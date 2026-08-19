'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { AgentState, SmartCardData } from '@/types';
import { useAgent } from '@/context/AgentContext';
import { useSettings } from '@/context/SettingsContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const INPUT_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 2048;
const OUTPUT_SAMPLE_RATE = 24000;
const SESSION_SETUP_TIMEOUT_MS = 15000;

// ─── PCM Helpers (module-scope, stable across renders) ────────────────────────
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const buf = new ArrayBuffer(input.length * 2);
  const view = new DataView(buf);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGeminiLive() {
  const { setAgentState, showSmartCards, hideSmartCards } = useAgent();
  const { activeProject } = useSettings();

  const [status, setStatus] = useState<AgentState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState<boolean>(false);

  // ── CRITICAL: use refs for all guards so callbacks never see stale closure values ──
  const isHoldingRef = useRef<boolean>(false);        // mirrors isHolding state, no stale closure
  const sessionReadyRef = useRef<boolean>(false);
  const isConnectingRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  const isToolExecutingRef = useRef<boolean>(false);

  // WebSocket
  const wsRef = useRef<WebSocket | null>(null);

  // Input audio
  const audioContextInputRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // Output audio (AI playback)
  const audioContextOutputRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);

  // ─── Status helper ────────────────────────────────────────────────────────────
  const updateStatus = useCallback(
    (newState: AgentState) => {
      setStatus(newState);
      setAgentState(newState);
    },
    [setAgentState]
  );

  // ─── AI Playback control ──────────────────────────────────────────────────────
  const stopAIPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => { try { src.stop(); } catch (_) {} });
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
        const ctx = audioContextOutputRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        if (!gainNodeRef.current) {
          const gn = ctx.createGain();
          gn.gain.value = 0.85;
          gn.connect(ctx.destination);
          gainNodeRef.current = gn;
        }

        const binaryStr = window.atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const int16 = new Int16Array(bytes.buffer);
        const f32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768.0;

        const audioBuf = ctx.createBuffer(1, f32.length, OUTPUT_SAMPLE_RATE);
        audioBuf.getChannelData(0).set(f32);

        const src = ctx.createBufferSource();
        src.buffer = audioBuf;
        src.connect(gainNodeRef.current ?? ctx.destination);

        const now = ctx.currentTime;
        if (nextPlayTimeRef.current < now) nextPlayTimeRef.current = now;
        src.start(nextPlayTimeRef.current);
        nextPlayTimeRef.current += audioBuf.duration;
        activeSourcesRef.current.push(src);
        updateStatus('speaking');

        src.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== src);
          // Only go idle if NOT recording and no more chunks pending
          if (activeSourcesRef.current.length === 0 && !isRecordingRef.current) {
            updateStatus('idle');
          }
        };
      } catch (err) {
        console.error('[playPCMChunk]', err);
      }
    },
    [updateStatus]
  );

  // ─── Full cleanup ─────────────────────────────────────────────────────────────
  const cleanupAll = useCallback(() => {
    console.log('[cleanup] running full cleanup');
    isRecordingRef.current = false;
    sessionReadyRef.current = false;
    isConnectingRef.current = false;
    isToolExecutingRef.current = false;
    isHoldingRef.current = false;
    setIsHolding(false);

    // Mic / input
    try { scriptProcessorRef.current?.disconnect(); } catch (_) {}
    scriptProcessorRef.current = null;
    try { audioContextInputRef.current?.close(); } catch (_) {}
    audioContextInputRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;

    // Output / playback
    stopAIPlayback();
    gainNodeRef.current = null;
    try { audioContextOutputRef.current?.close(); } catch (_) {}
    audioContextOutputRef.current = null;

    // WebSocket — clear ref FIRST so onclose re-entrant calls are no-ops
    const ws = wsRef.current;
    wsRef.current = null;
    try { ws?.close(1000); } catch (_) {}

    hideSmartCards();
    updateStatus('idle');
  }, [stopAIPlayback, hideSmartCards, updateStatus]);

  // ─── Session-level WebSocket message dispatcher ───────────────────────────────
  // Defined outside initSession so it can be replaced by a stable ref
  const handleWsMessage = useCallback(
    async (event: MessageEvent, ws: WebSocket) => {
      try {
        let raw = event.data;
        if (raw instanceof Blob) raw = await raw.text();
        else if (raw instanceof ArrayBuffer) raw = new TextDecoder().decode(raw);

        const msg = JSON.parse(raw);

        // AI audio chunks
        if (msg.serverContent?.modelTurn?.parts) {
          for (const part of msg.serverContent.modelTurn.parts) {
            if (part.inlineData?.data) playPCMChunk(part.inlineData.data);
          }
        }

        // Gemini finished its turn → go back to idle (ready for next question)
        if (msg.serverContent?.turnComplete && !isRecordingRef.current) {
          // Small delay so the last audio chunk has started playing
          setTimeout(() => {
            if (!isRecordingRef.current && activeSourcesRef.current.length === 0) {
              updateStatus('idle');
            }
          }, 200);
        }

        // Tool call
        if (msg.toolCall?.functionCalls) {
          for (const call of msg.toolCall.functionCalls) {
            const { name, args, id } = call;
            if (name !== 'show_dynamic_smart_cards') continue;

            // Mark tool executing so audio processor is blocked during this
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

            // Send tool response back to Gemini immediately
            try {
              ws.send(
                JSON.stringify({
                  toolResponse: {
                    functionResponses: [
                      { id, name, response: { output: { status: 'success' } } },
                    ],
                  },
                })
              );
              console.log('[tool] response sent for', name);
            } catch (e) {
              console.error('[tool] failed to send response:', e);
            }

            // Unblock audio processor once tool round-trip is done
            isToolExecutingRef.current = false;
          }
        }
      } catch (e) {
        console.error('[WS] parse error:', e);
      }
    },
    [playPCMChunk, updateStatus, showSmartCards]
  );

  // ─── Initialize a new Gemini Live session ─────────────────────────────────────
  const initSession = useCallback(async (): Promise<boolean> => {
    // Already connected and ready
    if (sessionReadyRef.current && wsRef.current?.readyState === WebSocket.OPEN) return true;
    // Another init in progress
    if (isConnectingRef.current) return false;

    isConnectingRef.current = true;
    setError(null);

    try {
      // ── 1. Microphone access ──────────────────────────────────────────────────
      console.log('[init] requesting microphone');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // ── 2. Input AudioContext + ScriptProcessor ───────────────────────────────
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

      // ── 3. Output AudioContext ────────────────────────────────────────────────
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

      // ── 4. Wire mic → ScriptProcessor (gated by isRecordingRef) ──────────────
      const micSource = audioContextInputRef.current.createMediaStreamSource(stream);
      const processor = audioContextInputRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);
      processor.onaudioprocess = (ev) => {
        if (!isRecordingRef.current) return;
        if (!sessionReadyRef.current) return;
        if (isToolExecutingRef.current) return;
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const pcm = floatTo16BitPCM(ev.inputBuffer.getChannelData(0));
        ws.send(
          JSON.stringify({
            realtimeInput: {
              mediaChunks: [{ data: arrayBufferToBase64(pcm), mimeType: 'audio/pcm;rate=16000' }],
            },
          })
        );
      };
      micSource.connect(processor);
      processor.connect(audioContextInputRef.current.destination);
      scriptProcessorRef.current = processor;

      // ── 5. Fetch secure WS URL from Cloudflare Worker ────────────────────────
      console.log('[init] fetching /api/gemini-session');
      const resp = await fetch('/api/gemini-session');
      const data = await resp.json();
      if (!resp.ok || !data.url) throw new Error(data.error || 'No WebSocket URL returned.');

      // ── 6. Open WebSocket ─────────────────────────────────────────────────────
      console.log('[init] opening WebSocket');
      const ws = new WebSocket(data.url);
      wsRef.current = ws;

      // ── 7. Wait for setupComplete (with timeout) ──────────────────────────────
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Session setup timed out after 15s.')), SESSION_SETUP_TIMEOUT_MS);

        ws.onopen = () => {
          console.log('[WS] open → sending setup');
          const voiceName = activeProject?.ai_voice || 'Aoede';
          const agentName = activeProject?.ai_agent_name || 'Layla';
          const companyName = activeProject?.company_name || 'City Scale';
          const projectName = activeProject?.project_name || 'The Grand Tower';
          const customPrompt = activeProject?.ai_prompt || '';

          const systemPrompt = `You are ${agentName}, an expert real estate sales agent representing "${companyName}" for the project "${projectName}".
${customPrompt}
You seamlessly speak Arabic (Egyptian dialect) and English based on the language of the user. Keep answers conversational, helpful, and concise.
IMPORTANT RULE: Whenever you discuss or present specific financial numbers, downpayment, monthly installment, unit area, or key features, you MUST invoke the 'show_dynamic_smart_cards' tool to display these figures visually on screen.`;

          ws.send(
            JSON.stringify({
              setup: {
                model: 'models/gemini-2.5-flash-native-audio-latest',
                generationConfig: {
                  responseModalities: ['AUDIO'],
                  speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName } },
                  },
                },
                // Disable server-side VAD — we manage turns with activityStart/activityEnd
                realtimeInputConfig: {
                  automaticActivityDetection: { disabled: true },
                },
                systemInstruction: { parts: [{ text: systemPrompt }] },
                tools: [
                  {
                    functionDeclarations: [
                      {
                        name: 'show_dynamic_smart_cards',
                        description:
                          'Display a visual panel with downpayment, monthly installments, area, and key highlights.',
                        parameters: {
                          type: 'OBJECT',
                          properties: {
                            downpayment: { type: 'NUMBER', description: 'Downpayment in EGP.' },
                            monthly_installment: {
                              type: 'NUMBER',
                              description: 'Monthly installment over 7 years in EGP.',
                            },
                            area: { type: 'STRING', description: 'Unit area, e.g. "145 m²".' },
                            key_selling_points: {
                              type: 'ARRAY',
                              items: { type: 'STRING' },
                              description: 'Key selling points list.',
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
        };

        // ── This handler runs for the ENTIRE session lifetime ──
        ws.onmessage = (event) => {
          // Resolve promise on first setupComplete
          if (!sessionReadyRef.current) {
            // Peek at the raw data to check for setupComplete before dispatching
            const parseAndCheck = async () => {
              let raw = event.data;
              if (raw instanceof Blob) raw = await raw.text();
              else if (raw instanceof ArrayBuffer) raw = new TextDecoder().decode(raw);
              const msg = JSON.parse(raw);
              if (msg.setupComplete) {
                console.log('[WS] setupComplete');
                sessionReadyRef.current = true;
                isConnectingRef.current = false;
                clearTimeout(timer);
                resolve();
              }
              // Also dispatch to full handler in case audio arrives early (rare)
              handleWsMessage(event, ws);
            };
            parseAndCheck().catch(console.error);
          } else {
            // Session already set up — dispatch all messages normally
            handleWsMessage(event, ws);
          }
        };

        ws.onerror = () => {
          clearTimeout(timer);
          // Only reject if we haven't resolved yet
          if (!sessionReadyRef.current) {
            reject(new Error('WebSocket connection failed.'));
          } else {
            // Post-setup error → full cleanup
            console.error('[WS] error during active session');
            setError('Connection error. Please try again.');
            cleanupAll();
          }
        };

        ws.onclose = (e) => {
          clearTimeout(timer);
          console.log(`[WS] closed code=${e.code} reason="${e.reason}"`);
          if (!sessionReadyRef.current) {
            // Closed before setup completed
            reject(new Error(`Connection closed before ready (code ${e.code}).`));
          } else {
            // Closed after a working session
            const userFacingError =
              e.code !== 1000 && e.reason ? e.reason : null;
            if (userFacingError) setError(userFacingError);
            cleanupAll();
          }
        };
      });

      console.log('[init] session ready!');
      return true;
    } catch (err: any) {
      console.error('[init] failed:', err);
      setError(err.message || 'Failed to start session.');
      cleanupAll();
      return false;
    }
  }, [handleWsMessage, cleanupAll]);

  // ─── Push-to-Talk: Press & Hold ──────────────────────────────────────────────
  const startHoldToSpeak = useCallback(async () => {
    // FIX: use isHoldingRef (not isHolding state) to avoid stale closure
    if (isHoldingRef.current) return;
    isHoldingRef.current = true;
    setIsHolding(true);

    stopAIPlayback(); // interrupt any ongoing AI speech

    // Connect if not already
    const alreadyReady =
      sessionReadyRef.current && wsRef.current?.readyState === WebSocket.OPEN;

    if (!alreadyReady) {
      updateStatus('processing');
      const ok = await initSession();
      if (!ok) {
        isHoldingRef.current = false;
        setIsHolding(false);
        return;
      }
    }

    // Block PTT signals during active tool call
    if (isToolExecutingRef.current) {
      console.warn('[PTT] tool executing — delaying activityStart');
      // Wait up to 1s for tool to complete
      await new Promise<void>((res) => {
        const check = setInterval(() => {
          if (!isToolExecutingRef.current) { clearInterval(check); res(); }
        }, 50);
        setTimeout(() => { clearInterval(check); res(); }, 1000);
      });
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
        console.log('[PTT] activityStart sent');
      } catch (e) {
        console.error('[PTT] activityStart failed:', e);
      }
    }

    isRecordingRef.current = true;
    updateStatus('listening');
  }, [stopAIPlayback, updateStatus, initSession]);

  const releaseHoldToSpeak = useCallback(() => {
    // FIX: use isHoldingRef (not isHolding state) to avoid stale closure
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    setIsHolding(false);

    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    updateStatus('processing');
    console.log('[PTT] released → sending activityEnd');

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ realtimeInput: { activityEnd: {} } }));
        console.log('[PTT] activityEnd sent');
      } catch (e) {
        console.error('[PTT] activityEnd failed:', e);
      }
    }
  }, []); // NOTE: no deps — uses only refs, completely stale-closure-proof

  useEffect(() => () => cleanupAll(), [cleanupAll]);

  return { status, error, isHolding, startHoldToSpeak, releaseHoldToSpeak, disconnect: cleanupAll };
}
