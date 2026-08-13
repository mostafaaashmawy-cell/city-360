'use client';

import { useSettings } from '@/context/SettingsContext';
import type { Language } from '@/types';

export default function LanguageToggle() {
  const { language, setLanguage } = useSettings();

  const toggle = () => {
    const next: Language = language === 'en' ? 'ar' : 'en';
    setLanguage(next);
  };

  return (
    <button
      id="language-toggle"
      onClick={toggle}
      aria-label={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
      className="relative flex items-center h-8 rounded-full px-1 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-white/20 focus:outline-none"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        width: '72px',
      }}
    >
      {/* Sliding indicator */}
      <span
        className="absolute top-1 w-8 h-6 rounded-full transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          left: language === 'en' ? '4px' : '36px',
          boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
        }}
      />
      {/* Labels */}
      <span
        className={`relative z-10 flex-1 text-center text-xs font-semibold transition-colors duration-300 ${language === 'en' ? 'text-white' : 'text-white/40'}`}
      >
        EN
      </span>
      <span
        className={`relative z-10 flex-1 text-center text-xs font-semibold transition-colors duration-300 ${language === 'ar' ? 'text-white' : 'text-white/40'}`}
      >
        ع
      </span>
    </button>
  );
}
