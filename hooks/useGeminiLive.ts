'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { AgentState, SmartCardData } from '@/types';
import { useAgent } from '@/context/AgentContext';
import { useSettings } from '@/context/SettingsContext';

// Audio parameters
const INPUT_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 2048;
const OUTPUT_SAMPLE_RATE = 24000;

// ─── PCM Helpers (module scope so stable across renders) ───────────────────────
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function useGeminiLive() {
  const { setAgentState, showSmartCards, hideSmartCards } = useAgent();
  const { language } = useSettings();

  const [status, setStatus] = useState<AgentState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState<boolean>(false);

  // WebSocket & session state
  const wsRef = useRef<WebSocket | null>(null);
  const sessionReadyRef = useRef<boolean>(false);      // true after setupComplete received
  const isConnectingRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  const isToolExecutingRef = useRef<boolean>(false);

  // Input audio
  const audioContextInputRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // Output audio (AI speech)
  const audioContextOutputRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);

  // Callbacks that want the latest wsRef without stale closures
  const updateStatus = useCallback(
    (newState: AgentState) => {
      setStatus(newState);
      setAgentState(newState);
    },
    [setAgentState]
  );

  // ─── Playback helpers ─────────────────────────────────────────────────────────
  const stopAIPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try { src.stop(); } catch (_) {}
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
        if (audioCtx.state === 'suspended') audioCtx.resume();

        if (!gainNodeRef.current) {
          const gn = audioCtx.createGain();
          gn.gain.value = 0.8;
          gn.connect(audioCtx.destination);
          gainNodeRef.current = gn;
        }

        const binaryStr = window.atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

        const int16 = new Int16Array(bytes.buffer);
        const f32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768.0;

        const buf = audioCtx.createBuffer(1, f32.length, OUTPUT_SAMPLE_RATE);
        buf.getChannelData(0).set(f32);

        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        src.connect(gainNodeRef.current ?? audioCtx.destination);

        const now = audioCtx.currentTime;
        if (nextPlayTimeRef.current < now) nextPlayTimeRef.current = now;
        src.start(nextPlayTimeRef.current);
        nextPlayTimeRef.current += buf.duration;

        activeSourcesRef.current.push(src);
        updateStatus('speaking');

        src.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== src);
          if (activeSourcesRef.current.length === 0 && !isRecordingRef.current) {
            updateStatus('idle');
          }
        };
      } catch (err) {
        console.error('[playPCMChunk] error:', err);
      }
    },
    [updateStatus]
  );

  // ─── Session setup message ────────────────────────────────────────────────────
  const setupSession = useCallback((ws: WebSocket) => {
    const systemPrompt = `You are Layla, a friendly and expert Egyptian real estate sales agent representing "City Scale" physical & visual modeling company.
Speak in a warm, helpful, and natural conversational tone. 
You can understand and speak in Arabic (Egyptian dialect) and English seamlessly based on what language the user speaks.
Keep answers concise, clear, and focused.
When explaining property pricing, units, downpayments, or monthly installments, calculate financial installments based on a 7-year installment plan.
IMPORTANT RULE: Whenever you discuss or present specific financial numbers, downpayment, monthly installment, unit area, or key features, you MUST invoke the 'show_dynamic_smart_cards' tool to show those figures visually on the user's screen.`;

    ws.send(
      JSON.stringify({
        setup: {
          model: 'models/gemini-2.5-flash-native-audio-latest',
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
            },
          },
          // Disable automatic VAD so we control turn boundaries with activityStart/activityEnd
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: true,
            },
          },
          systemInstruction: { parts: [{ text: systemPrompt }] },
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'show_dynamic_smart_cards',
                  description:
                    'Displays a visual panel showing downpayment, monthly installments over 7 years, area, and key highlights.',
                  parameters: {
                    type: 'OBJECT',
                    properties: {
                      downpayment: { type: 'NUMBER', description: 'Downpayment amount in EGP.' },
                      monthly_installment: {
                        type: 'NUMBER',
                        description: 'Monthly installment over 7 years in EGP.',
                      },
                      area: { type: 'STRING', description: 'Unit area, e.g. "145 m²".' },
                      key_selling_points: {
                        type: 'ARRAY',
                        items: { type: 'STRING' },
                        description: 'Key selling points.',
                      },
                    },
                    required: [
                      'downpayment',
                      'monthly_installment',
                      'area',
                      'key_selling_points',
                    ],
                  },
                },
              ],
            },
          ],
        },
      })
    );
    console.log('[setupSession] setup message sent');
  }, []);

  // ─── Tool call handler ────────────────────────────────────────────────────────
  const handleToolCall = useCallback(
    (ws: WebSocket, call: any) => {
      try {
        const { name, args, id } = call;
        if (name !== 'show_dynamic_smart_cards') return;

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
        ws.send(
          JSON.stringify({
            toolResponse: {
              functionResponses: [
                {
                  id,
                  name,
                  response: { output: { status: 'success' } },
                },
              ],
            },
          })
        );
        setTimeout(() => {
          isToolExecutingRef.current = false;
        }, 500);
      } catch (err) {
        console.error('[handleToolCall] error:', err);
        isToolExecutingRef.current = false;
      }
    },
    [showSmartCards]
  );

  // ─── Disconnect / cleanup ─────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    isRecordingRef.current = false;
    sessionReadyRef.current = false;
    isConnectingRef.current = false;
    setIsHolding(false);

    // Stop mic processor
    try { scriptProcessorRef.current?.disconnect(); } catch (_) {}
    scriptProcessorRef.current = null;
    try { audioContextInputRef.current?.close(); } catch (_) {}
    audioContextInputRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;

    // Stop playback
    stopAIPlayback();
    gainNodeRef.current = null;
    try { audioContextOutputRef.current?.close(); } catch (_) {}
    audioContextOutputRef.current = null;

    // Close WS
    try { wsRef.current?.close(); } catch (_) {}
    wsRef.current = null;

    hideSmartCards();
    updateStatus('idle');
  }, [stopAIPlayback, hideSmartCards, updateStatus]);

  // ─── Full initialization (called once on first press) ────────────────────────
  const initSession = useCallback(async (): Promise<boolean> => {
    if (sessionReadyRef.current && wsRef.current?.readyState === WebSocket.OPEN) return true;
    if (isConnectingRef.current) return false;

    isConnectingRef.current = true;
    setError(null);

    try {
      console.log('[initSession] requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: INPUT_SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      console.log('[initSession] microphone granted');

      // Build input audio context + processor
      audioContextInputRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      if (audioContextInputRef.current.state === 'suspended') {
        await audioContextInputRef.current.resume();
      }
      audioContextInputRef.current.onstatechange = () => {
        if (audioContextInputRef.current?.state === 'suspended') {
          audioContextInputRef.current.resume().catch(() => {});
        }
      };

      // Build output audio context
      audioContextOutputRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      if (audioContextOutputRef.current.state === 'suspended') {
        await audioContextOutputRef.current.resume();
      }
      audioContextOutputRef.current.onstatechange = () => {
        if (audioContextOutputRef.current?.state === 'suspended') {
          audioContextOutputRef.current.resume().catch(() => {});
        }
      };

      // Wire microphone → ScriptProcessor (gated by isRecordingRef)
      const source = audioContextInputRef.current.createMediaStreamSource(stream);
      const processor = audioContextInputRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);
      processor.onaudioprocess = (ev) => {
        if (!isRecordingRef.current) return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (!sessionReadyRef.current) return;
        if (isToolExecutingRef.current) return;

        const pcm = floatTo16BitPCM(ev.inputBuffer.getChannelData(0));
        wsRef.current.send(
          JSON.stringify({
            realtimeInput: {
              mediaChunks: [{ data: arrayBufferToBase64(pcm), mimeType: 'audio/pcm;rate=16000' }],
            },
          })
        );
      };
      source.connect(processor);
      processor.connect(audioContextInputRef.current.destination);
      scriptProcessorRef.current = processor;

      // Fetch WS URL from worker
      console.log('[initSession] fetching /api/gemini-session...');
      const resp = await fetch('/api/gemini-session');
      const data = await resp.json();
      if (!resp.ok || !data.url) throw new Error(data.error || 'No WebSocket URL returned.');

      console.log('[initSession] connecting WebSocket...');
      const ws = new WebSocket(data.url);
      wsRef.current = ws;

      // Wait for setupComplete
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Session setup timed out.')), 15000);

        ws.onopen = () => {
          console.log('[WS] open → sending setup');
          setupSession(ws);
        };

        ws.onmessage = async (event) => {
          try {
            let raw = event.data;
            if (raw instanceof Blob) raw = await raw.text();
            else if (raw instanceof ArrayBuffer) raw = new TextDecoder().decode(raw);

            const msg = JSON.parse(raw);
            console.log('[WS] message keys:', Object.keys(msg));

            if (msg.setupComplete) {
              console.log('[WS] setupComplete received');
              sessionReadyRef.current = true;
              isConnectingRef.current = false;
              clearTimeout(timeout);
              resolve();
            }

            if (msg.serverContent?.modelTurn?.parts) {
              for (const part of msg.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) playPCMChunk(part.inlineData.data);
              }
            }

            if (msg.toolCall?.functionCalls) {
              for (const call of msg.toolCall.functionCalls) handleToolCall(ws, call);
            }

            // After AI response turn ends
            if (msg.serverContent?.turnComplete && !isRecordingRef.current) {
              updateStatus('idle');
            }
          } catch (e) {
            console.error('[WS] parse error:', e);
          }
        };

        ws.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error('WebSocket connection error.'));
        };

        ws.onclose = (e) => {
          clearTimeout(timeout);
          console.log('[WS] closed:', e.code, e.reason);
          if (sessionReadyRef.current) {
            // Session was established; clean up gracefully
            if (e.code !== 1000 && e.reason) setError(e.reason);
            sessionReadyRef.current = false;
            isRecordingRef.current = false;
            isConnectingRef.current = false;
            setIsHolding(false);
            updateStatus('idle');
          } else {
            reject(new Error(`WS closed before setup: ${e.code} ${e.reason}`));
          }
        };
      });

      console.log('[initSession] session ready!');
      return true;
    } catch (err: any) {
      console.error('[initSession] failed:', err);
      isConnectingRef.current = false;
      sessionReadyRef.current = false;
      setError(err.message || 'Failed to start session.');
      disconnect();
      return false;
    }
  }, [setupSession, playPCMChunk, handleToolCall, updateStatus, disconnect]);

  // ─── Push-to-Talk handlers ────────────────────────────────────────────────────
  const startHoldToSpeak = useCallback(async () => {
    if (isHolding) return; // double-fire guard
    setIsHolding(true);
    stopAIPlayback();

    const alreadyConnected =
      sessionReadyRef.current && wsRef.current?.readyState === WebSocket.OPEN;

    if (!alreadyConnected) {
      updateStatus('processing');
      const ok = await initSession();
      if (!ok) {
        setIsHolding(false);
        return;
      }
    }

    // Signal start of user speech to Gemini
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
        console.log('[PTT] activityStart sent');
      } catch (e) {
        console.error('[PTT] failed to send activityStart:', e);
      }
    }

    // Start streaming mic audio
    isRecordingRef.current = true;
    updateStatus('listening');
    console.log('[PTT] recording started');
  }, [isHolding, stopAIPlayback, updateStatus, initSession]);

  const releaseHoldToSpeak = useCallback(() => {
    if (!isHolding) return;
    setIsHolding(false);

    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    console.log('[PTT] recording stopped → waiting for AI response');
    updateStatus('processing');

    // Signal end of user speech so Gemini generates a response
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ realtimeInput: { activityEnd: {} } }));
        console.log('[PTT] activityEnd sent');
      } catch (e) {
        console.error('[PTT] failed to send activityEnd:', e);
      }
    }
  }, [isHolding, updateStatus]);

  useEffect(() => () => disconnect(), [disconnect]);

  return { status, error, isHolding, startHoldToSpeak, releaseHoldToSpeak, disconnect };
}
