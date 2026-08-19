'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import type { Project, GeminiVoice, GeminiTone } from '@/types';
import LogoUpload from '@/components/admin/LogoUpload';
import VoiceSelector from '@/components/admin/VoiceSelector';
import {
  Save,
  Building2,
  MessageCircle,
  Bot,
  Check,
  Loader2,
  Link2,
  Copy,
  ExternalLink,
  Plus,
  CopyPlus,
  Trash2,
  Globe,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
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
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-white/80">
        <span className="text-indigo-400">{icon}</span>
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
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onFocus={(e) => {
          e.target.style.border = '1px solid rgba(99,102,241,0.5)';
          e.target.style.background = 'rgba(99,102,241,0.06)';
        }}
        onBlur={(e) => {
          e.target.style.border = '1px solid rgba(255,255,255,0.1)';
          e.target.style.background = 'rgba(255,255,255,0.04)';
        }}
      />
      {helpText && <p className="text-white/40 text-xs">{helpText}</p>}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pb-3 border-b border-white/10">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {subtitle && <p className="text-white/40 text-xs mt-1">{subtitle}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    createProject,
    duplicateProject,
    updateProject,
    deleteProject,
    toggleProjectActive,
  } = useSettings();

  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const [form, setForm] = useState<Project>({ ...currentProject });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync form when selected project changes
  useEffect(() => {
    if (currentProject) {
      setForm({ ...currentProject });
    }
  }, [currentProject]);

  const set = (key: keyof Project) => (value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaveState('saving');
    await updateProject(currentProject.id, form);
    setTimeout(() => setSaveState('saved'), 500);
    setTimeout(() => setSaveState('idle'), 2500);
  };

  const handleCreateNew = async () => {
    const newProj = await createProject({
      project_name: 'New Property Project',
      project_name_ar: 'مشروع عقاري جديد',
    });
    setActiveProjectId(newProj.id);
  };

  const handleDuplicate = async () => {
    const cloned = await duplicateProject(currentProject.id);
    setActiveProjectId(cloned.id);
  };

  const copyPreviewLink = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const previewUrl = `${origin}/?project=${form.slug}`;
      navigator.clipboard.writeText(previewUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen space-y-8 max-w-5xl">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Project & AI Settings</h1>
          <p className="text-white/40 text-sm mt-1">
            Manage multiple virtual tour projects, Gemini AI persona, and company branding
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-all border border-white/10"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            New Project
          </button>

          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 shadow-lg shadow-indigo-500/20"
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
          >
            {saveState === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
            {saveState === 'saved' && <Check className="w-4 h-4" />}
            {saveState === 'idle' && <Save className="w-4 h-4" />}
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── Multi-Project Selector Cards ────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Select Active Project to Configure
          </span>
          <span className="text-xs text-white/40">{projects.length} Total Projects</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((proj) => {
            const isCurrent = proj.id === activeProjectId;
            return (
              <div
                key={proj.id}
                onClick={() => setActiveProjectId(proj.id)}
                className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border relative flex flex-col justify-between space-y-3 ${
                  isCurrent
                    ? 'bg-indigo-500/15 border-indigo-400/80 shadow-lg shadow-indigo-500/10'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {proj.project_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm line-clamp-1">
                        {proj.project_name}
                      </h3>
                      <p className="text-[11px] text-white/40">slug: /{proj.slug}</p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      proj.is_active
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {proj.is_active ? 'Live' : 'Offline'}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                  <span>Voice: {proj.ai_voice || 'Aoede'}</span>
                  {isCurrent && (
                    <span className="text-indigo-400 font-semibold text-[11px]">Active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Active Project Control Bar ──────────────────────────────── */}
      <div
        className="p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toggleProjectActive(currentProject.id)}
            className="flex items-center gap-2 text-xs font-semibold text-white px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 transition-all"
          >
            {form.is_active ? (
              <>
                <ToggleRight className="w-5 h-5 text-emerald-400" />
                <span>Public Preview: <strong className="text-emerald-300">ON (Live)</strong></span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-rose-400" />
                <span>Public Preview: <strong className="text-rose-300">OFF (Maintenance)</strong></span>
              </>
            )}
          </button>

          <span className="text-xs text-white/30 hidden md:inline">|</span>

          {/* Quick Duplicate Project Button */}
          <button
            type="button"
            onClick={handleDuplicate}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
          >
            <CopyPlus className="w-3.5 h-3.5 text-cyan-400" />
            Duplicate Project
          </button>
        </div>

        {/* Project Preview Link & Copy */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={copyPreviewLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition-all"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copied Link!' : 'Copy Preview Link'}
          </button>

          <a
            href={`/?project=${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Tour
          </a>
        </div>
      </div>

      {/* ── Project Configuration Form ──────────────────────────────── */}
      <div className="space-y-8">
        {/* 1. Branding & Identity */}
        <section className="space-y-5">
          <SectionTitle
            title="Company & Project Identity"
            subtitle="Logo, names in English and Arabic, and custom URL slug"
          />

          {/* Logo Upload Section */}
          <LogoUpload
            value={form.company_logo_url}
            onChange={(logoData) => set('company_logo_url')(logoData)}
            label="Company Logo"
            helpText="Upload PNG, SVG, or JPG (Max 4MB). Renders automatically in the virtual tour header."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              id="company_name"
              label="Company Name (EN)"
              value={form.company_name}
              onChange={set('company_name')}
              placeholder="City Scale"
              icon={<Building2 className="w-4 h-4" />}
            />
            <Field
              id="company_name_ar"
              label="اسم الشركة (AR)"
              value={form.company_name_ar}
              onChange={set('company_name_ar')}
              placeholder="سيتي سكيل"
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

          <Field
            id="slug"
            label="Project Slug (Subdomain/Path Identifier)"
            value={form.slug}
            onChange={set('slug')}
            placeholder="grand-tower"
            icon={<Globe className="w-4 h-4" />}
            helpText="Used in the public URL: yoursite.com/?project=your-slug"
          />
        </section>

        {/* 2. Virtual Tour & WhatsApp */}
        <section className="space-y-5">
          <SectionTitle
            title="Virtual Tour & Contact"
            subtitle="The 3D tour URL and sales contact number"
          />
          <Field
            id="virtual_tour_url"
            label="Virtual Tour URL"
            value={form.virtual_tour_url || form.coohom_url || ''}
            onChange={set('virtual_tour_url')}
            placeholder="https://www.coohom.com/pub/tool/panorama/... (or Matterport, Kuula, 3DVista)"
            icon={<Link2 className="w-4 h-4" />}
            helpText="Paste the full shareable URL from Coohom, Matterport, Kuula, or any 3D tour provider"
          />
          <Field
            id="whatsapp_number"
            label="WhatsApp Number for Leads"
            value={form.whatsapp_number}
            onChange={set('whatsapp_number')}
            placeholder="201000000000"
            icon={<MessageCircle className="w-4 h-4" />}
            helpText="International format without + or spaces (e.g. 201000000000)"
          />
        </section>

        {/* 3. Gemini Multimodal Live AI Settings */}
        <section className="space-y-5">
          <SectionTitle
            title="Google Gemini Live Voice Agent Settings"
            subtitle="Configure voice timbre, conversational tone, and project knowledge base"
          />

          <Field
            id="ai_agent_name"
            label="Agent Name"
            value={form.ai_agent_name || 'Layla'}
            onChange={set('ai_agent_name')}
            placeholder="Layla"
            icon={<Bot className="w-4 h-4" />}
            helpText="The name the agent introduces herself/himself with"
          />

          {/* Voice Selector with Listen Test */}
          <VoiceSelector
            value={form.ai_voice || 'Aoede'}
            onChange={(v: GeminiVoice) => set('ai_voice')(v)}
          />

          {/* Tone Selector */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-white/80">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Conversational Tone
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'consultative', label: 'Consultative & Advisor', labelAr: 'مستشار عقاري خبير' },
                { id: 'friendly', label: 'Warm & Friendly', labelAr: 'ودود ومرحب' },
                { id: 'professional', label: 'Formal & Professional', labelAr: 'رسمي واحترافي' },
                { id: 'energetic', label: 'Energetic & Sales', labelAr: 'حماسي وبيعي' },
              ].map((tone) => {
                const isSelected = (form.ai_tone || 'consultative') === tone.id;
                return (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => set('ai_tone')(tone.id as GeminiTone)}
                    className={`p-3 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-md'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-white/70'
                    }`}
                  >
                    <p className="text-xs font-semibold">{tone.label}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{tone.labelAr}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agent Knowledge & Sales Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="ai_prompt" className="flex items-center gap-2 text-sm font-medium text-white/80">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Agent Knowledge Base & Sales Prompt
              </label>
              <span className="text-xs text-white/40">Injected into live session</span>
            </div>
            <textarea
              id="ai_prompt"
              rows={6}
              value={form.ai_prompt || ''}
              onChange={(e) => set('ai_prompt')(e.target.value)}
              placeholder="Enter pricing rules, installment plans, amenities, delivery dates, and smart card rules..."
              className="w-full px-4 py-3 rounded-xl text-xs sm:text-sm text-white placeholder-white/25 outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 leading-relaxed font-mono"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <p className="text-xs text-white/40">
              💡 Tip: Specify exact 7-year installment plans and remind the agent to call <code>show_dynamic_smart_cards</code> when discussing financial numbers.
            </p>
          </div>
        </section>

        {/* 4. Delete Project (if more than 1 project exists) */}
        {projects.length > 1 && (
          <div className="pt-4 border-t border-rose-500/20 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-rose-400">Danger Zone</h4>
              <p className="text-xs text-white/40 mt-0.5">
                Permanently delete this project and remove its preview
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${currentProject.project_name}"?`)) {
                  deleteProject(currentProject.id);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Project
            </button>
          </div>
        )}

        {/* Bottom Save Button */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 shadow-lg shadow-indigo-500/20"
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
          >
            {saveState === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
            {saveState === 'saved' && <Check className="w-4 h-4" />}
            {saveState === 'idle' && <Save className="w-4 h-4" />}
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'All Settings Saved!' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
