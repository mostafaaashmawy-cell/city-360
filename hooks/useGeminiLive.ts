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
  const [isHolding, setIsHolding] = useState<boolean>(false);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);

  // Recording references
  const audioContextInputRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const isRecordingRef = useRef<boolean>(false);

  // Playback references
  const audioContextOutputRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);

  const isConnectingRef = useRef<boolean>(false);
  const isToolExecutingRef = useRef<boolean>(false);

  // Sync state
  const updateStatus = useCallback(
    (newState: AgentState) => {
      setStatus(newState);
      setAgentState(newState);
    },
    [setAgentState]
  );

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

  const playPCMChunk = useCallback(
    (base64Data: string) => {
      try {
        if (!audioContextOutputRef.current) {
          audioContextOutputRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
        }

        const audioCtx = audioContextOutputRef.current;
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        // Initialize Gain Node for comfortable volume
        if (!gainNodeRef.current) {
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = 0.7;
          gainNode.connect(audioCtx.destination);
          gainNodeRef.current = gainNode;
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

        if (gainNodeRef.current) {
          source.connect(gainNodeRef.current);
        } else {
          source.connect(audioCtx.destination);
        }

        const currentTime = audioCtx.currentTime;
        if (nextPlayTimeRef.current < currentTime) {
          nextPlayTimeRef.current = currentTime;
        }

        source.start(nextPlayTimeRef.current);
        activeSourcesRef.current.push(source);

        source.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
          if (activeSourcesRef.current.length === 0 && !isRecordingRef.current) {
            updateStatus('idle');
          }
        };

        nextPlayTimeRef.current += audioBuffer.duration;
        if (!isRecordingRef.current) {
          updateStatus('speaking');
        }
      } catch (err) {
        console.error('Audio playback error:', err);
      }
    },
    [updateStatus]
  );

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
    isRecordingRef.current = false;
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
Keep answers concise, clear, and focused.
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

  const handleToolCall = useCallback(
    (ws: WebSocket, call: any) => {
      try {
        const { name, args, id } = call;
        if (name === 'show_dynamic_smart_cards') {
          isToolExecutingRef.current = true;
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
          setTimeout(() => {
            isToolExecutingRef.current = false;
          }, 500);
        }
      } catch (err) {
        console.error('Failed to handle tool call:', err);
        isToolExecutingRef.current = false;
      }
    },
    [showSmartCards]
  );

  // ─── 4. Connection Lifecycle ──────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    updateStatus('idle');
    setIsHolding(false);
    isConnectingRef.current = false;
    isRecordingRef.current = false;

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

  const connectAndInit = useCallback(async (): Promise<WebSocket | null> => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    if (isConnectingRef.current) return null;

    isConnectingRef.current = true;
    updateStatus('processing');
    setError(null);

    try {
      // 1. Request microphone access with echo cancellation & noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
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

      // Auto-resume audio contexts
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

      // 2. Setup microphone processor (only sends data when isRecordingRef.current === true)
      const source = audioContextInputRef.current.createMediaStreamSource(stream);
      scriptProcessorRef.current = audioContextInputRef.current.createScriptProcessor(
        BUFFER_SIZE,
        1,
        1
      );

      scriptProcessorRef.current.onaudioprocess = (audioEvent) => {
        // Strict Push-to-Talk filter: Do NOT stream any audio unless user is holding the button!
        if (!isRecordingRef.current) return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (isToolExecutingRef.current) return;

        const inputData = audioEvent.inputBuffer.getChannelData(0);

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

      // 3. Fetch connection details from API endpoint
      const response = await fetch('/api/gemini-session');
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to initialize session parameters.');
      }

      // 4. Establish WebSocket connection
      const ws = new WebSocket(data.url);
      wsRef.current = ws;

      return new Promise<WebSocket>((resolve, reject) => {
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
              console.log('Gemini Live setup complete.');
              isConnectingRef.current = false;
              resolve(ws);
            }

            // Handle server audio stream
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.data) {
                  playPCMChunk(part.inlineData.data);
                }
              }
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
          isConnectingRef.current = false;
          disconnect();
          reject(e);
        };

        ws.onclose = (e) => {
          console.log('WebSocket closed:', e.code, e.reason);
          isConnectingRef.current = false;
          if (e.code !== 1000 && e.reason) {
            setError(e.reason);
          }
          disconnect();
        };
      });
    } catch (err: any) {
      console.error('Connection initialization failed:', err);
      isConnectingRef.current = false;
      setError(err.message || 'Microphone or connection failed.');
      disconnect();
      return null;
    }
  }, [disconnect, setupSession, playPCMChunk, handleToolCall, updateStatus]);

  // ─── 5. Push-to-Talk (Hold to Speak) Handlers ────────────────────────────────
  const startHoldToSpeak = useCallback(async () => {
    setIsHolding(true);
    stopAIPlayback(); // If AI is speaking, interrupt immediately

    try {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        updateStatus('processing');
        const ws = await connectAndInit();
        if (!ws) {
          setIsHolding(false);
          return;
        }
      }

      // Start streaming audio
      isRecordingRef.current = true;
      updateStatus('listening');
    } catch (e) {
      setIsHolding(false);
      updateStatus('idle');
    }
  }, [connectAndInit, stopAIPlayback, updateStatus]);

  const releaseHoldToSpeak = useCallback(() => {
    setIsHolding(false);

    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      updateStatus('processing'); // Transition to thinking while waiting for AI response

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // 1. Send trailing empty/silence buffer to cleanly flush the audio pipeline
        const silenceBuffer = new ArrayBuffer(640);
        const base64Silence = arrayBufferToBase64(silenceBuffer);
        try {
          wsRef.current.send(
            JSON.stringify({
              realtimeInput: {
                mediaChunks: [
                  {
                    data: base64Silence,
                    mimeType: 'audio/pcm;rate=16000',
                  },
                ],
              },
            })
          );
        } catch (e) {}

        // 2. Explicitly signal end-of-turn so Gemini generates response immediately with zero delay
        try {
          wsRef.current.send(
            JSON.stringify({
              clientContent: {
                turnComplete: true,
              },
            })
          );
        } catch (e) {}
      }
    }
  }, [updateStatus]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    error,
    isHolding,
    startHoldToSpeak,
    releaseHoldToSpeak,
    disconnect,
  };
}
