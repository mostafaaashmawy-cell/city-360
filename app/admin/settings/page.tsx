'use client';

import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import type { AppSettings } from '@/types';
import {
  Save,
  Image as ImageIcon,
  Building2,
  Globe,
  MessageCircle,
  Bot,
  Key,
  Check,
  Loader2,
  Link2,
} from 'lucide-react';

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon: React.ReactNode;
  helpText?: string;
}

function Field({ id, label, value, onChange, placeholder, type = 'text', icon, helpText }: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-white/70">
        <span className="text-white/40">{icon}</span>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all focus:ring-2 focus:ring-indigo-500/50"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onFocus={(e) => {
          e.target.style.border = '1px solid rgba(99,102,241,0.5)';
          e.target.style.background = 'rgba(99,102,241,0.06)';
        }}
        onBlur={(e) => {
          e.target.style.border = '1px solid rgba(255,255,255,0.1)';
          e.target.style.background = 'rgba(255,255,255,0.05)';
        }}
      />
      {helpText && <p className="text-white/30 text-xs">{helpText}</p>}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pb-4 border-b border-white/5">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {subtitle && <p className="text-white/40 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const set = (key: keyof AppSettings) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaveState('saving');
    await updateSettings(form);
    setTimeout(() => setSaveState('saved'), 600);
    setTimeout(() => setSaveState('idle'), 2600);
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-white/40 text-sm mt-1">
            Configure your virtual tour experience
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
        >
          {saveState === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
          {saveState === 'saved' && <Check className="w-4 h-4" />}
          {saveState === 'idle' && <Save className="w-4 h-4" />}
          {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* ── Branding ────────────────────────────────────────── */}
        <section className="space-y-5">
          <SectionTitle
            title="Branding"
            subtitle="Your company identity shown on the customer view header"
          />
          <Field
            id="company_logo_url"
            label="Company Logo URL"
            value={form.company_logo_url}
            onChange={set('company_logo_url')}
            placeholder="https://example.com/logo.png"
            icon={<ImageIcon className="w-4 h-4" />}
            helpText="Direct link to your company logo image (PNG/SVG recommended)"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              id="company_name"
              label="Company Name (EN)"
              value={form.company_name}
              onChange={set('company_name')}
              placeholder="City 360"
              icon={<Building2 className="w-4 h-4" />}
            />
            <Field
              id="company_name_ar"
              label="اسم الشركة (AR)"
              value={form.company_name_ar}
              onChange={set('company_name_ar')}
              placeholder="سيتي 360"
              icon={<Building2 className="w-4 h-4" />}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              id="project_name"
              label="Project Name (EN)"
              value={form.project_name}
              onChange={set('project_name')}
              placeholder="The Grand Tower"
              icon={<Building2 className="w-4 h-4" />}
            />
            <Field
              id="project_name_ar"
              label="اسم المشروع (AR)"
              value={form.project_name_ar}
              onChange={set('project_name_ar')}
              placeholder="البرج الكبير"
              icon={<Building2 className="w-4 h-4" />}
            />
          </div>
        </section>

        {/* ── Tour & Contact ───────────────────────────────────── */}
        <section className="space-y-5">
          <SectionTitle
            title="Tour & Contact"
            subtitle="The 3D tour iframe source and WhatsApp lead capture"
          />
          <Field
            id="coohom_url"
            label="Coohom Iframe URL"
            value={form.coohom_url}
            onChange={set('coohom_url')}
            placeholder="https://www.coohom.com/pub/tool/panorama/..."
            icon={<Link2 className="w-4 h-4" />}
            helpText="Paste the full shareable URL from your Coohom project"
          />
          <Field
            id="whatsapp_number"
            label="WhatsApp Number"
            value={form.whatsapp_number}
            onChange={set('whatsapp_number')}
            placeholder="201000000000"
            icon={<MessageCircle className="w-4 h-4" />}
            helpText="International format without + or spaces (e.g. 201000000000)"
          />
        </section>

        {/* ── AI Agent ─────────────────────────────────────────── */}
        <section className="space-y-5">
          <SectionTitle
            title="AI Voice Agent"
            subtitle="Connect your preferred AI voice agent service"
          />
          <Field
            id="ai_agent_name"
            label="Agent Name"
            value={form.ai_agent_name}
            onChange={set('ai_agent_name')}
            placeholder="Layla"
            icon={<Bot className="w-4 h-4" />}
            helpText="The name shown to customers"
          />
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <Globe className="w-4 h-4 text-white/40" />
              AI Connection Method
            </label>
            <select
              id="ai_connection_method"
              value={form.ai_connection_method}
              onChange={(e) => set('ai_connection_method')(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <option value="vapi">Vapi.ai</option>
              <option value="elevenlabs">ElevenLabs Conversational AI</option>
              <option value="retell">Retell AI</option>
              <option value="bland">Bland.ai</option>
              <option value="custom">Custom WebSocket</option>
            </select>
          </div>
          <Field
            id="ai_api_key"
            label="AI API Key / Agent ID"
            value={form.ai_api_key}
            onChange={set('ai_api_key')}
            placeholder="••••••••••••••••••••"
            type="password"
            icon={<Key className="w-4 h-4" />}
            helpText="Stored securely — never exposed to the client browser"
          />
        </section>

        {/* Bottom Save */}
        <div className="pt-4 border-t border-white/5">
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
          >
            {saveState === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
            {saveState === 'saved' && <Check className="w-4 h-4" />}
            {saveState === 'idle' && <Save className="w-4 h-4" />}
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Changes Saved!' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
