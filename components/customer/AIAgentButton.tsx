'use client';

import { useAgent } from '@/context/AgentContext';
import { useSettings } from '@/context/SettingsContext';
import type { AgentState } from '@/types';
import { useState, useCallback } from 'react';
import { DEMO_SMART_CARDS } from '@/lib/mockData';

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
    <div className="flex items-end gap-[3px] h-7">
      {[...Array(5)].map((_, i) => (
        <span key={i} className="wave-bar" />
      ))}
    </div>
  );
}

function ProcessingVisual() {
  return (
    <div className="relative w-7 h-7">
      <svg
        className="spin-ring absolute inset-0 w-7 h-7"
        viewBox="0 0 28 28"
        fill="none"
      >
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
        <span
          key={n}
          className={`absolute inset-0 rounded-full bg-white/20 pulse-ring-${n}`}
        />
      ))}
      <MicIcon className="w-7 h-7 text-white relative z-10" />
    </div>
  );
}

// ─── Label Map ────────────────────────────────────────────────────────────────
const stateLabels: Record<AgentState, { en: string; ar: string }> = {
  idle: { en: 'Ask AI Agent', ar: 'اسأل المساعد' },
  listening: { en: 'Listening…', ar: 'أستمع إليك…' },
  processing: { en: 'Thinking…', ar: 'أفكر…' },
  speaking: { en: 'Speaking…', ar: 'أتحدث…' },
};

const stateGradients: Record<AgentState, string> = {
  idle: 'linear-gradient(135deg, #6366f1, #06b6d4)',
  listening: 'linear-gradient(135deg, #10b981, #06b6d4)',
  processing: 'linear-gradient(135deg, #f59e0b, #f43f5e)',
  speaking: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
};

// ─── Main Component ───────────────────────────────────────────────────────────
import { useGeminiLive } from '@/hooks/useGeminiLive';

export default function AIAgentButton() {
  const { agentState } = useAgent();
  const { language } = useSettings();
  const [showTooltip, setShowTooltip] = useState(false);
  const { connect, disconnect, error } = useGeminiLive();

  // Handle click by triggering real Gemini Live connection
  const handleClick = useCallback(() => {
    if (agentState === 'idle') {
      connect();
    } else {
      disconnect();
    }
  }, [agentState, connect, disconnect]);

  const label = stateLabels[agentState][language];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2">
      {/* Error Badge */}
      {error && (
        <div
          className="bg-rose-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-fade-in whitespace-nowrap border border-rose-400"
        >
          {error}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && agentState === 'idle' && !error && (
        <div
          className="glass px-3 py-1.5 rounded-full text-xs font-medium text-white/90 animate-fade-in whitespace-nowrap"
          style={{ border: '1px solid rgba(255,255,255,0.15)' }}
        >
          {language === 'ar' ? 'تحدث مع مساعد الذكاء الاصطناعي' : 'Talk to AI Sales Agent'}
        </div>
      )}

      {/* Main Button */}
      <button
        id="ai-agent-button"
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={label}
        className="relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        style={{
          background: stateGradients[agentState],
          boxShadow:
            agentState === 'idle'
              ? '0 8px 32px rgba(99,102,241,0.5), 0 0 0 0 rgba(99,102,241,0.4)'
              : '0 8px 40px rgba(99,102,241,0.6)',
        }}
      >
        {/* Idle breathing ring */}
        {agentState === 'idle' && (
          <span className="absolute inset-0 rounded-full idle-breathe" />
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
      <span className="text-xs font-medium text-white/80 tracking-wide select-none">
        {label}
      </span>
    </div>
  );
}
