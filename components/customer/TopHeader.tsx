'use client';

import Image from 'next/image';
import { useSettings } from '@/context/SettingsContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function TopHeader() {
  const { settings, language } = useSettings();

  const companyName =
    language === 'ar' ? settings.company_name_ar : settings.company_name;
  const projectName =
    language === 'ar' ? settings.project_name_ar : settings.project_name;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 h-16"
      style={{
        background:
          'linear-gradient(180deg, rgba(10,10,20,0.85) 0%, rgba(10,10,20,0.4) 100%)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Left: Logo + Names */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="relative flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/20 bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
          {settings.company_logo_url && !settings.company_logo_url.includes('placeholder') ? (
            <Image
              src={settings.company_logo_url}
              alt={companyName}
              fill
              className="object-cover"
            />
          ) : (
            <span className="text-white font-bold text-sm select-none">
              {companyName.charAt(0)}
            </span>
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col leading-tight">
          <span className="text-white font-semibold text-sm tracking-wide">
            {companyName}
          </span>
          <span className="text-white/60 text-xs font-medium">{projectName}</span>
        </div>
      </div>

      {/* Right: Language Toggle */}
      <div className="flex items-center gap-3">
        {/* Live badge */}
        <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          360° Live
        </span>
        <LanguageToggle />
      </div>
    </header>
  );
}
