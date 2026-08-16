'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { AgentState, SmartCardData } from '@/types';
import { useAgent } from '@/context/AgentContext';
import { useSettings } from '@/context/SettingsContext';

// Audio parameters
const INPUT_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 2048;
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

  const isConnectingRef = useRef<boolean>(false);

  // Sync state
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
        // finished
      }
    });
    activeSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
  }, []);

  const playPCMChunk = useCallback((base64Data: string) => {
    try {
      if (!audioContextOutputRef.current) {
        audioContextOutputRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      }

      const audioCtx = audioContextOutputRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Base64 PCM 16-bit to Float32Array
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

      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, OUTPUT_SAMPLE_RATE);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
      }

      source.start(nextPlayTimeRef.current);
      activeSourcesRef.current.push(source);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          updateStatus('listening');
        }
      };

      nextPlayTimeRef.current += audioBuffer.duration;
      updateStatus('speaking');
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  }, [updateStatus]);

  // ─── 2. Helpers for Audio Recording ─────────────────────────────────────────
  const floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const stopRecording = useCallback(() => {
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch (e) {}
      scriptProcessorRef.current = null;
    }
    if (audioContextInputRef.current) {
      try {
        audioContextInputRef.current.close();
      } catch (e) {}
      audioContextInputRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // ─── 3. Session Initiation & Tool Handling ──────────────────────────────────
  const setupSession = useCallback((ws: WebSocket) => {
    const systemPrompt = `You are Layla, a friendly and expert Egyptian real estate sales agent representing "City Scale" physical & visual modeling company.
Speak in a warm, helpful, and natural conversational tone. 
You can understand and speak in Arabic (Egyptian dialect) and English seamlessly based on what language the user speaks.
When explaining property pricing, units, downpayments, or monthly installments, calculate financial installments based on a 7-year installment plan.
IMPORTANT RULE: Whenever you discuss or present specific financial numbers, downpayment, monthly installment, unit area, or key features, you MUST invoke the 'show_dynamic_smart_cards' tool to show those figures visually on the user's screen.`;

    const setupMessage = {
      setup: {
        model: 'models/gemini-2.5-flash-native-audio-latest',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede',
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
                description: 'Displays a visual panel showing downpayment, monthly installments over 7 years, area, and key highlights.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    downpayment: {
                      type: 'NUMBER',
                      description: 'The downpayment amount in EGP.',
                    },
                    monthly_installment: {
                      type: 'NUMBER',
                      description: 'The calculated monthly installment amount in EGP (over 7 years).',
                    },
                    area: {
                      type: 'STRING',
                      description: 'The property unit area, e.g. "145 m² — 3 Bed, 2 Bath".',
                    },
                    key_selling_points: {
                      type: 'ARRAY',
                      items: {
                        type: 'STRING',
                      },
                      description: 'Key highlights or selling points, e.g. ["Pool View", "Smart Home", "7-Yr Installments"].',
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

    console.log('Sending Gemini Live setup message...');
    ws.send(JSON.stringify(setupMessage));
  }, []);

  const handleToolCall = useCallback((ws: WebSocket, call: any) => {
    try {
      const { name, args, id } = call;
      if (name === 'show_dynamic_smart_cards') {
        const { downpayment, monthly_installment, area, key_selling_points } = args;

        const cards: SmartCardData[] = [
          {
            id: 'dp',
            label: 'Downpayment',
            labelAr: 'مقدم الحجز',
            value: `EGP ${Number(downpayment || 0).toLocaleString()}`,
            icon: '💰',
            color: 'green',
          },
          {
            id: 'inst',
            label: 'Installments',
            labelAr: 'الأقساط الشهرية',
            value: `EGP ${Number(monthly_installment || 0).toLocaleString()} / month (7 yrs)`,
            icon: '📅',
            color: 'blue',
          },
          {
            id: 'area',
            label: 'Unit Area',
            labelAr: 'مساحة الوحدة',
            value: String(area || ''),
            icon: '📐',
            color: 'purple',
          },
          {
            id: 'kw',
            label: 'Highlights',
            labelAr: 'المميزات',
            value: Array.isArray(key_selling_points) ? key_selling_points.join(' · ') : '',
            icon: '✨',
            color: 'rose',
          },
        ];

        showSmartCards(cards);

        const toolResponse = {
          toolResponse: {
            functionResponses: [
              {
                id: id,
                name: name,
                response: {
                  output: { status: 'success', message: 'Cards shown visually to user.' },
                },
              },
            ],
          },
        };
        ws.send(JSON.stringify(toolResponse));
      }
    } catch (err) {
      console.error('Failed to handle tool call:', err);
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
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
  }, [stopRecording, stopAIPlayback, hideSmartCards, updateStatus]);

  const connect = useCallback(async () => {
    if (wsRef.current || isConnectingRef.current) return;

    isConnectingRef.current = true;
    updateStatus('processing');
    setError(null);

    try {
      // 1. Immediately request microphone access inside user click gesture (required for mobile browsers)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Initialize audio contexts on user gesture
      audioContextInputRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      audioContextOutputRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

      if (audioContextInputRef.current.state === 'suspended') {
        await audioContextInputRef.current.resume();
      }
      if (audioContextOutputRef.current.state === 'suspended') {
        await audioContextOutputRef.current.resume();
      }

      // Auto-resume audio contexts if backgrounded or interrupted by iframe media
      audioContextInputRef.current.onstatechange = () => {
        if (audioContextInputRef.current && audioContextInputRef.current.state === 'suspended') {
          audioContextInputRef.current.resume().catch(() => {});
        }
      };
      audioContextOutputRef.current.onstatechange = () => {
        if (audioContextOutputRef.current && audioContextOutputRef.current.state === 'suspended') {
          audioContextOutputRef.current.resume().catch(() => {});
        }
      };

      // 2. Fetch connection details from API endpoint
      const response = await fetch('/api/gemini-session');
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to initialize session parameters.');
      }

      // 3. Establish WebSocket connection directly to Gemini Live API
      const ws = new WebSocket(data.url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Gemini Live WebSocket opened.');
        setupSession(ws);
      };

      ws.onmessage = async (event) => {
        try {
          let rawData = event.data;
          if (rawData instanceof Blob) {
            rawData = await rawData.text();
          } else if (rawData instanceof ArrayBuffer) {
            rawData = new TextDecoder().decode(rawData);
          }

          const message = JSON.parse(rawData);

          // Confirmation of session setup
          if (message.setupComplete) {
            console.log('Gemini Live setup complete. Starting audio streaming...');
            updateStatus('listening');

            // Wire up user microphone streaming
            if (audioContextInputRef.current && mediaStreamRef.current) {
              const source = audioContextInputRef.current.createMediaStreamSource(
                mediaStreamRef.current
              );
              scriptProcessorRef.current = audioContextInputRef.current.createScriptProcessor(
                BUFFER_SIZE,
                1,
                1
              );

              scriptProcessorRef.current.onaudioprocess = (audioEvent) => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

                const inputData = audioEvent.inputBuffer.getChannelData(0);

                // Barge-in detector: If user speaks, interrupt AI audio immediately
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                  sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                if (rms > 0.04 && nextPlayTimeRef.current > 0) {
                  stopAIPlayback();
                  updateStatus('listening');
                }

                // Send PCM 16-bit audio chunk to Gemini
                const pcmBuffer = floatTo16BitPCM(inputData);
                const base64Audio = arrayBufferToBase64(pcmBuffer);

                wsRef.current.send(
                  JSON.stringify({
                    realtimeInput: {
                      mediaChunks: [
                        {
                          data: base64Audio,
                          mimeType: 'audio/pcm;rate=16000',
                        },
                      ],
                    },
                  })
                );
              };

              source.connect(scriptProcessorRef.current);
              scriptProcessorRef.current.connect(audioContextInputRef.current.destination);
            }
          }

          // Handle server audio stream
          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData && part.inlineData.data) {
                playPCMChunk(part.inlineData.data);
              }
            }
          }

          // Handle server-side Voice Activity Detection interruption
          if (message.serverContent?.interrupted) {
            stopAIPlayback();
            updateStatus('listening');
          }

          // Handle function calling
          if (message.toolCall?.functionCalls) {
            for (const call of message.toolCall.functionCalls) {
              handleToolCall(ws, call);
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket Error:', e);
        setError('Voice connection error occurred.');
        disconnect();
      };

      ws.onclose = (e) => {
        console.log('WebSocket closed:', e.code, e.reason);
        if (e.code !== 1000 && e.reason) {
          setError(e.reason);
        }
        disconnect();
      };
    } catch (err: any) {
      console.error('Connection initialization failed:', err);
      setError(err.message || 'Microphone or connection failed.');
      disconnect();
    }
  }, [disconnect, setupSession, playPCMChunk, stopAIPlayback, handleToolCall, updateStatus]);

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
