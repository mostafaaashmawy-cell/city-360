'use client';

import CoohomIframe from '@/components/customer/CoohomIframe';
import TopHeader from '@/components/customer/TopHeader';
import AIAgentButton from '@/components/customer/AIAgentButton';
import SmartCardsPanel from '@/components/customer/SmartCardsPanel';
import WhatsAppButton from '@/components/customer/WhatsAppButton';
import { useSettings } from '@/context/SettingsContext';

export default function CustomerView() {
  const { settings } = useSettings();

  return (
    <main className="customer-page relative bg-[#0a0a14]">
      {/* Layer 0 — Full-viewport 3D Tour */}
      <CoohomIframe url={settings.coohom_url} />

      {/* Layer 1 — Top Header (z-50) */}
      <TopHeader />

      {/* Layer 2 — Smart Cards Panel (z-55) — slides in from side */}
      <SmartCardsPanel />

      {/* Layer 3 — Floating Buttons (z-60) */}
      <WhatsAppButton />
      <AIAgentButton />
    </main>
  );
}
