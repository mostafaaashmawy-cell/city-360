'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { AppSettings, Language } from '@/types';
import { mockSettings } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';

interface SettingsContextValue {
  settings: AppSettings;
  language: Language;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(mockSettings);
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(false);

  const isRTL = language === 'ar';

  // Load from Supabase on mount (falls back to mock if no connection)
  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .limit(1)
        .single();
      if (!error && data) setSettings(data as AppSettings);
      setIsLoading(false);
    };
    load();
  }, []);

  // Apply RTL to document
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const updated = { ...settings, ...partial };
      setSettings(updated);
      if (!supabase) return;
      await supabase
        .from('app_settings')
        .upsert({ ...updated, id: updated.id ?? '1' });
    },
    [settings],
  );

  return (
    <SettingsContext.Provider
      value={{ settings, language, isRTL, setLanguage, updateSettings, isLoading }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
