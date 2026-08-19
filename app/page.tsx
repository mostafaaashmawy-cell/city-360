'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import CoohomIframe from '@/components/customer/CoohomIframe';
import TopHeader from '@/components/customer/TopHeader';
import AIAgentButton from '@/components/customer/AIAgentButton';
import SmartCardsPanel from '@/components/customer/SmartCardsPanel';
import WhatsAppButton from '@/components/customer/WhatsAppButton';
import { useSettings } from '@/context/SettingsContext';
import { Lock, MessageCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function CustomerViewContent() {
  const { activeProject, projects, setActiveProjectId, getProjectBySlug, language } = useSettings();
  const searchParams = useSearchParams();

  // If a ?project=slug or ?p=slug is provided in URL, switch active project
  useEffect(() => {
    const slug = searchParams.get('project') || searchParams.get('p');
    if (slug) {
      const match = getProjectBySlug(slug);
      if (match && match.id !== activeProject.id) {
        setActiveProjectId(match.id);
      }
    }
  }, [searchParams, getProjectBySlug, activeProject.id, setActiveProjectId]);

  // ── If the project is toggled OFF (Offline / Under Maintenance) ──────────────
  if (!activeProject.is_active) {
    const companyName =
      language === 'ar' ? activeProject.company_name_ar : activeProject.company_name;
    const projectName =
      language === 'ar' ? activeProject.project_name_ar : activeProject.project_name;

    return (
      <main className="min-h-screen bg-[#0a0a14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div
          className="max-w-md w-full rounded-3xl p-8 text-center space-y-6 relative z-10"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}
        >
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-white/10 mx-auto flex items-center justify-center p-2 border border-white/15">
            {activeProject.company_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeProject.company_logo_url}
                alt={companyName}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <Lock className="w-7 h-7 text-indigo-400" />
            )}
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              Virtual Tour Offline
            </span>
            <h1 className="text-xl font-bold text-white">{projectName}</h1>
            <p className="text-sm text-white/50">{companyName}</p>
          </div>

          <p className="text-xs text-white/60 leading-relaxed">
            {language === 'ar'
              ? 'هذه الجولة الافتراضية متوقفة مؤقتاً أو تحت الصيانة. يرجى التواصل مع فريق المبيعات للحصول على مزيد من المعلومات أو حجز موعد زيارة.'
              : 'This 360° virtual property tour is currently offline or undergoing maintenance. Please contact our sales team for availability or to schedule a private walkthrough.'}
          </p>

          <div className="pt-2 flex flex-col gap-3">
            <a
              href={`https://wa.me/${activeProject.whatsapp_number || '201000000000'}?text=${encodeURIComponent(
                `Hello, I am inquiring about ${activeProject.project_name}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/20"
              style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}
            >
              <MessageCircle className="w-4 h-4" />
              {language === 'ar' ? 'تواصل معنا عبر واتساب' : 'Contact Sales on WhatsApp'}
            </a>

            <Link
              href="/admin/settings"
              className="inline-flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors pt-2"
            >
              <span>Admin Access</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Normal Active Customer View ─────────────────────────────────────────────
  return (
    <main className="customer-page relative bg-[#0a0a14]">
      {/* Layer 0 — Full-viewport 3D Virtual Tour */}
      <CoohomIframe url={activeProject.virtual_tour_url || activeProject.coohom_url} />

      {/* Layer 1 — Top Header (z-50) */}
      <TopHeader />

      {/* Layer 2 — Smart Cards Panel (z-55) */}
      <SmartCardsPanel />

      {/* Layer 3 — Floating Action Buttons (z-60) */}
      <WhatsAppButton />
      <AIAgentButton />
    </main>
  );
}

export default function CustomerView() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center text-white/40 text-sm">
          Loading Virtual Tour Experience…
        </div>
      }
    >
      <CustomerViewContent />
    </Suspense>
  );
}
