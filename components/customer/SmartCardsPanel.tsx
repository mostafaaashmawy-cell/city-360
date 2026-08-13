'use client';

import { useAgent } from '@/context/AgentContext';
import { useSettings } from '@/context/SettingsContext';
import type { SmartCardData } from '@/types';
import { X } from 'lucide-react';

// ─── Color Maps ───────────────────────────────────────────────────────────────
const colorStyles: Record<
  SmartCardData['color'],
  { bg: string; border: string; icon: string; text: string }
> = {
  blue: {
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.3)',
    icon: 'text-blue-400',
    text: 'text-blue-300',
  },
  green: {
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)',
    icon: 'text-emerald-400',
    text: 'text-emerald-300',
  },
  purple: {
    bg: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.3)',
    icon: 'text-violet-400',
    text: 'text-violet-300',
  },
  orange: {
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
    icon: 'text-amber-400',
    text: 'text-amber-300',
  },
  rose: {
    bg: 'rgba(244,63,94,0.12)',
    border: 'rgba(244,63,94,0.3)',
    icon: 'text-rose-400',
    text: 'text-rose-300',
  },
};

// ─── Single Card ──────────────────────────────────────────────────────────────
function SmartCard({ card, lang }: { card: SmartCardData; lang: 'en' | 'ar' }) {
  const styles = colorStyles[card.color];
  const label = lang === 'ar' ? card.labelAr : card.label;

  return (
    <div
      className="rounded-2xl p-3.5 flex items-start gap-3 animate-slide-up"
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: styles.bg, border: `1px solid ${styles.border}` }}
      >
        <span role="img" aria-hidden="true">{card.icon}</span>
      </div>
      {/* Text */}
      <div className="min-w-0">
        <p className={`text-[11px] font-medium uppercase tracking-widest mb-0.5 ${styles.text}`}>
          {label}
        </p>
        <p className="text-white font-semibold text-sm leading-snug break-words">
          {card.value}
        </p>
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────
export default function SmartCardsPanel() {
  const { smartCardsVisible, smartCards, hideSmartCards } = useAgent();
  const { language, isRTL } = useSettings();

  if (!smartCardsVisible || smartCards.length === 0) return null;

  return (
    <div
      className={`cards-panel fixed top-20 ${isRTL ? 'left-4' : 'right-4'} z-[55] w-72 sm:w-80`}
    >
      {/* Panel container */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(10,10,20,0.88)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-sm font-semibold text-white">
              {language === 'ar' ? 'ملخص العرض' : 'Property Summary'}
            </span>
          </div>
          <button
            onClick={hideSmartCards}
            aria-label="Close summary panel"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cards */}
        <div className="p-3 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
          {smartCards.map((card) => (
            <SmartCard key={card.id} card={card} lang={language} />
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-4 pb-3">
          <p className="text-center text-[11px] text-white/30">
            {language === 'ar'
              ? 'استمر في التحدث مع المساعد لمزيد من التفاصيل'
              : 'Keep talking to the agent for more details'}
          </p>
        </div>
      </div>
    </div>
  );
}
