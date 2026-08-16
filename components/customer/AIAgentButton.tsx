'use client';

import { useAgent } from '@/context/AgentContext';
import { useSettings } from '@/context/SettingsContext';
import type { AgentState } from '@/types';
import { useState, useCallback } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';

// ─── Icons ────────────────────────────────────────────────────────────────────
function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm7 10a1 1 0 1 1 2 0 9 9 0 0 1-18 0 1 1 0 1 1 2 0 7 7 0 0 0 14 0zm-8 9h2v2h-2v-2z" />
    </svg>
  );
}

// ─── State Visuals ────────────────────────────────────────────────────────────
function IdleIcon() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <MicIcon className="w-7 h-7 text-white" />
    </div>
  );
}

function ListeningVisual() {
  return (
    <div className="flex items-end gap-[3.5px] h-7">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className="wave-bar bg-white rounded-full w-1"
          style={{
            animation: `wave 0.8s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.15}s`,
            minHeight: '8px',
          }}
        />
      ))}
    </div>
  );
}

function ProcessingVisual() {
  return (
    <div className="relative w-7 h-7">
      <svg className="spin-ring absolute inset-0 w-7 h-7" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="12" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
        <path
          d="M14 2 A12 12 0 0 1 26 14"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function SpeakingVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {[1, 2, 3].map((n) => (
        <span key={n} className={`absolute inset-0 rounded-full bg-white/20 pulse-ring-${n}`} />
      ))}
      <MicIcon className="w-7 h-7 text-white relative z-10" />
    </div>
  );
}

// ─── Label Map ────────────────────────────────────────────────────────────────
const stateLabels: Record<AgentState, { en: string; ar: string }> = {
  idle: { en: 'Hold to speak', ar: 'اضغط مطولاً للتحدث' },
  listening: { en: 'Recording... Release to send', ar: 'جاري التسجيل... اترك للإرسال' },
  processing: { en: 'Thinking…', ar: 'أفكر…' },
  speaking: { en: 'Speaking…', ar: 'أتحدث…' },
};

const stateGradients: Record<AgentState, string> = {
  idle: 'linear-gradient(135deg, #6366f1, #06b6d4)',
  listening: 'linear-gradient(135deg, #ef4444, #f97316)', // Red/orange recording glow
  processing: 'linear-gradient(135deg, #f59e0b, #f43f5e)',
  speaking: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIAgentButton() {
  const { agentState } = useAgent();
  const { language } = useSettings();
  const [showTooltip, setShowTooltip] = useState(false);
  const { isHolding, startHoldToSpeak, releaseHoldToSpeak, error } = useGeminiLive();

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      // Capture pointer so releasing anywhere triggers handlePointerUp
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      startHoldToSpeak();
    },
    [startHoldToSpeak]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      releaseHoldToSpeak();
    },
    [releaseHoldToSpeak]
  );

  const label = stateLabels[agentState][language];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 select-none touch-none">
      {/* Error Badge */}
      {error && (
        <div className="bg-rose-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-fade-in whitespace-nowrap border border-rose-400">
          {error}
        </div>
      )}

      {/* WhatsApp Voice Note Style Tooltip */}
      {showTooltip && agentState === 'idle' && !error && (
        <div
          className="glass px-3 py-1.5 rounded-full text-xs font-medium text-white/90 animate-fade-in whitespace-nowrap"
          style={{ border: '1px solid rgba(255,255,255,0.15)' }}
        >
          {language === 'ar' ? '🎙️ اضغط مطولاً أثناء التحدث' : '🎙️ Hold down while speaking'}
        </div>
      )}

      {/* Main Hold-to-Speak Button */}
      <button
        id="ai-agent-button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={label}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 select-none touch-none focus:outline-none ${
          isHolding ? 'scale-125 shadow-2xl ring-4 ring-rose-400/50' : 'hover:scale-105 active:scale-95'
        }`}
        style={{
          background: stateGradients[agentState],
          boxShadow:
            agentState === 'listening'
              ? '0 0 35px rgba(239,68,68,0.7), 0 0 15px rgba(249,115,22,0.5)'
              : agentState === 'idle'
              ? '0 8px 32px rgba(99,102,241,0.5), 0 0 0 0 rgba(99,102,241,0.4)'
              : '0 8px 40px rgba(99,102,241,0.6)',
        }}
      >
        {/* Idle breathing ring */}
        {agentState === 'idle' && (
          <span className="absolute inset-0 rounded-full idle-breathe" />
        )}

        {/* Recording active pulse ring */}
        {agentState === 'listening' && (
          <span className="absolute inset-0 rounded-full animate-ping bg-rose-400/30 duration-1000" />
        )}

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          {agentState === 'idle' && <IdleIcon />}
          {agentState === 'listening' && <ListeningVisual />}
          {agentState === 'processing' && <ProcessingVisual />}
          {agentState === 'speaking' && <SpeakingVisual />}
        </div>
      </button>

      {/* State Label */}
      <span
        className={`text-xs font-semibold tracking-wide select-none transition-colors duration-200 ${
          agentState === 'listening' ? 'text-rose-300 font-bold animate-pulse' : 'text-white/85'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
