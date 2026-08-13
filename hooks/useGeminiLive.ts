'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { AgentState, SmartCardData } from '@/types';
import { useAgent } from '@/context/AgentContext';
import { useSettings } from '@/context/SettingsContext';

// Audio parameters for input (user microphone)
const INPUT_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 2048;

// Audio parameters for output (AI speech playback)
const OUTPUT_SAMPLE_RATE = 24000;

export function useGeminiLive() {
  const { setAgentState, showSmartCards, hideSmartCards } = useAgent();
  const { language } = useSettings();
  
  const [status, setStatus] = useState<AgentState>('idle');
  const [error, setError] = useState<string | null>(null);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  
  // Recording references
  const audioContextInputRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Playback references
  const audioContextOutputRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  
  // Keep track of active state to avoid race conditions
  const isConnectingRef = useRef<boolean>(false);

  // Sync state to local state and global agent state context
  const updateStatus = useCallback((newState: AgentState) => {
    setStatus(newState);
    setAgentState(newState);
  }, [setAgentState]);

  // ─── 1. Playback Queue Control (AI Speech) ───────────────────────────────────
  const stopAIPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Source might have already finished
      }
    });
    activeSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
  }, []);

  const playPCMChunk = useCallback((base64Data: string) => {
    try {
      // Initialize output AudioContext if needed
      if (!audioContextOutputRef.current) {
        audioContextOutputRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      }

      const audioCtx = audioContextOutputRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Convert Base64 PCM 16-bit to Float32Array
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      // Create Audio Buffer
      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, OUTPUT_SAMPLE_RATE);
      audioBuffer.getChannelData(0).set(float32Array);

      // Create Buffer Source
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
      }

      // Play sequentially with queue
      source.start(nextPlayTimeRef.current);
      activeSourcesRef.current.push(source);

      // Clean up reference when audio finished
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          updateStatus('listening');
        }
      };

      nextPlayTimeRef.current += audioBuffer.duration;
      updateStatus('speaking');
    } catch (err) {
      console.error('Playback failed:', err);
    }
  }, [updateStatus]);

  // ─── 2. Audio Processing (User Microphone) ──────────────────────────────────
  const startRecording = useCallback(() => {
    try {
      // Audio Conversion helper: Float32Array to 16-bit PCM ArrayBuffer
      const floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
        const buffer = new ArrayBuffer(input.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // true = little-endian
        }
        return buffer;
      };

      // ArrayBuffer to Base64 encoder
      const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
      };

      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        mediaStreamRef.current = stream;
        
        audioContextInputRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });

        const source = audioContextInputRef.current.createMediaStreamSource(stream);
        
        scriptProcessorRef.current = audioContextInputRef.current.createScriptProcessor(
          BUFFER_SIZE,
          1,
          1
        );

        scriptProcessorRef.current.onaudioprocess = (event) => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

          const inputData = event.inputBuffer.getChannelData(0);
          
          // Barge-in check: If user starts speaking while AI is talking, interrupt playback
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);
          if (rms > 0.04 && nextPlayTimeRef.current > 0) {
            stopAIPlayback();
            updateStatus('listening');
          }

          // Convert Float32 to PCM 16-bit and stream as base64 chunk
          const pcmBuffer = floatTo16BitPCM(inputData);
          const base64Audio = arrayBufferToBase64(pcmBuffer);

          wsRef.current.send(
            JSON.stringify({
              realtimeInput: {
                audio: {
                  data: base64Audio,
                  mimeType: 'audio/pcm;rate=16000',
                },
              },
            })
          );
        };

        source.connect(scriptProcessorRef.current);
        scriptProcessorRef.current.connect(audioContextInputRef.current.destination);
      });
    } catch (err) {
      console.error('Failed to access microphone:', err);
      setError('Microphone access denied.');
    }
  }, [stopAIPlayback, updateStatus]);

  const stopRecording = useCallback(() => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextInputRef.current) {
      audioContextInputRef.current.close();
      audioContextInputRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // ─── 3. Session Initiation & Tool Handling ──────────────────────────────────
  const setupSession = useCallback((ws: WebSocket) => {
    // 7-year real estate plan system instruction
    const systemPrompt = `You are Layla, an expert real estate sales agent representing "City Scale" modeling company. 
Speak in a warm, professional manner. You can speak in Arabic and English fluently based on the language of the user's choice. 
When discussing properties, area, downpayments, or monthly installments, you must calculate installments based on a 7-year installment plan. 
IMPORTANT: When presenting any financial figures, numbers, area sizes or key points, you MUST trigger the 'show_dynamic_smart_cards' tool to show the cards visually to the user.`;

    const setupMessage = {
      setup: {
        model: 'models/gemini-2.0-flash-exp',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede', // Aoede = warm female voice
              },
            },
          },
        },
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: 'show_dynamic_smart_cards',
                description: 'Triggers the display panel showing property details, downpayment, monthly installments, and highlight points.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    downpayment: {
                      type: 'NUMBER',
                      description: 'The downpayment amount in EGP.',
                    },
                    monthly_installment: {
                      type: 'NUMBER',
                      description: 'The calculated monthly installment in EGP (over 7 years).',
                    },
                    area: {
                      type: 'STRING',
                      description: 'The property area size, e.g., "150 m² — 3 Bed, 2 Bath".',
                    },
                    key_selling_points: {
                      type: 'ARRAY',
                      items: {
                        type: 'STRING',
                      },
                      description: 'List of features, highlights or selling points, e.g., ["Pool View", "Fully Finished", "Smart Home"].',
                    },
                  },
                  required: ['downpayment', 'monthly_installment', 'area', 'key_selling_points'],
                },
              },
            ],
          },
        ],
      },
    };

    ws.send(JSON.stringify(setupMessage));
  }, []);

  const handleToolCall = useCallback((ws: WebSocket, call: any) => {
    try {
      const { name, args, id } = call;
      if (name === 'show_dynamic_smart_cards') {
        const { downpayment, monthly_installment, area, key_selling_points } = args;

        // Map arguments to SmartCardData
        const cards: SmartCardData[] = [
          {
            id: 'dp',
            label: 'Downpayment',
            labelAr: 'مقدم الحجز',
            value: `EGP ${downpayment.toLocaleString()}`,
            icon: '💰',
            color: 'green',
          },
          {
            id: 'inst',
            label: 'Installments',
            labelAr: 'الأقساط الشهرية',
            value: `EGP ${monthly_installment.toLocaleString()} / month over 7 years`,
            icon: '📅',
            color: 'blue',
          },
          {
            id: 'area',
            label: 'Unit Area',
            labelAr: 'مساحة الوحدة',
            value: area,
            icon: '📐',
            color: 'purple',
          },
          {
            id: 'kw',
            label: 'Highlights',
            labelAr: 'المميزات',
            value: key_selling_points.join(' · '),
            icon: '✨',
            color: 'rose',
          },
        ];

        // Trigger React UI Panel
        showSmartCards(cards);

        // Send toolResponse back to Gemini API
        const toolResponse = {
          toolResponse: {
            functionResponses: [
              {
                id: id,
                name: name,
                response: {
                  output: { status: 'success', message: 'Smart cards rendered successfully' },
                },
              },
            ],
          },
        };
        ws.send(JSON.stringify(toolResponse));
      }
    } catch (err) {
      console.error('Failed to execute tool call:', err);
    }
  }, [showSmartCards]);

  // ─── 4. Connection Lifecycle ──────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    updateStatus('idle');
    isConnectingRef.current = false;
    
    stopRecording();
    stopAIPlayback();
    hideSmartCards();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [stopRecording, stopAIPlayback, hideSmartCards, updateStatus]);

  const connect = useCallback(async () => {
    if (wsRef.current || isConnectingRef.current) return;
    
    isConnectingRef.current = true;
    updateStatus('processing');
    setError(null);

    try {
      // 1. Fetch connection details from secure Next.js API endpoint
      const response = await fetch('/api/gemini-session');
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to fetch session parameters.');
      }

      // Check if proxy was upgraded directly or use fallback URL
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const proxyUrl = `${wsProtocol}//${window.location.host}/api/gemini-session`;
      
      let socketUrl = data.url;
      
      // Attempt to use direct edge proxy if available in Cloudflare
      try {
        const testRes = await fetch('/api/gemini-session', {
          headers: { Upgrade: 'websocket', Connection: 'Upgrade' }
        });
        if (testRes.status === 101) {
          socketUrl = proxyUrl;
        }
      } catch (e) {
        // Fallback to secure API query URL
      }

      // 2. Establish WebSocket connection
      const ws = new WebSocket(socketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        updateStatus('processing');
        setupSession(ws);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Confirmation of setup completed
          if (message.setupComplete) {
            updateStatus('listening');
            startRecording();
          }

          // Handle server audio response
          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData && part.inlineData.data) {
                playPCMChunk(part.inlineData.data);
              }
            }
          }

          // Handle server-side VAD interruption / User speech barge-in
          if (message.serverContent?.interrupted) {
            stopAIPlayback();
            updateStatus('listening');
          }

          // Handle model function calls
          if (message.toolCall?.functionCalls) {
            for (const call of message.toolCall.functionCalls) {
              handleToolCall(ws, call);
            }
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket Error:', e);
        setError('WebSocket error occurred.');
        disconnect();
      };

      ws.onclose = () => {
        disconnect();
      };

    } catch (err: any) {
      console.error('Connection failed:', err);
      setError(err.message || 'Connection failed.');
      disconnect();
    }
  }, [disconnect, setupSession, startRecording, playPCMChunk, stopAIPlayback, handleToolCall, updateStatus]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    error,
    connect,
    disconnect,
  };
}
