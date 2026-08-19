'use client';

import type { LeadSession, LeadStatus } from '@/types';
import { useState } from 'react';
import { ChevronRight, Phone, Globe, MessageCircle, AlertCircle, Sparkles, Eye, CheckCircle2 } from 'lucide-react';
import SessionDetail from './SessionDetail';

interface LeadsTableProps {
  sessions: LeadSession[];
  onStatusChange?: (sessionId: string, newStatus: LeadStatus) => void;
}

export const statusStyles: Record<LeadStatus, string> = {
  new: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  qualified: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  need_assistance: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  contacted: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  closed: 'bg-white/5 text-white/40 border-white/10',
};

export const statusLabels: Record<LeadStatus, { en: string; ar: string; desc: string }> = {
  new: {
    en: 'New',
    ar: 'جديد (غير مفتوح)',
    desc: 'Unopened lead that the admin has not viewed yet in dashboard',
  },
  qualified: {
    en: 'Qualified',
    ar: 'مؤهل للشراء',
    desc: 'High intent: Buyer discussed 7-yr installment, downpayment, budget or site visit',
  },
  need_assistance: {
    en: 'Need Assistance',
    ar: 'يحتاج مساعدة خاصة',
    desc: 'Client requested special payment plan or asked questions the AI did not have',
  },
  contacted: {
    en: 'Contacted',
    ar: 'تم التواصل',
    desc: 'Sales team has reached out to this lead',
  },
  closed: {
    en: 'Closed',
    ar: 'مغلق',
    desc: 'Deal finalized or inquiry completed',
  },
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LeadsTable({ sessions, onStatusChange }: LeadsTableProps) {
  const [selected, setSelected] = useState<LeadSession | null>(null);
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());

  const handleOpenLead = (session: LeadSession) => {
    setOpenedIds((prev) => new Set(prev).add(session.id));
    setSelected(session);
  };

  return (
    <>
      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Table header */}
        <div
          className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <span>Visitor & WhatsApp Lead</span>
          <span className="hidden sm:block">Date</span>
          <span className="hidden md:block">Duration</span>
          <span>Lead Status</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {sessions.map((session) => {
            const isUnopened = session.status === 'new' && !openedIds.has(session.id);

            return (
              <button
                key={session.id}
                onClick={() => handleOpenLead(session)}
                className={`w-full grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-center text-left hover:bg-white/[0.03] transition-colors group ${
                  isUnopened ? 'bg-indigo-500/[0.04]' : ''
                }`}
              >
                {/* Visitor & Lead channel badge */}
                <div className="min-w-0 flex items-start gap-2.5">
                  {/* Unopened dot indicator */}
                  {isUnopened && (
                    <span
                      className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0 animate-pulse"
                      title="New unopened lead"
                    />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm truncate">
                        {session.visitor_name ?? 'Anonymous Visitor'}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <MessageCircle className="w-2.5 h-2.5" /> WhatsApp
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      {session.visitor_phone && (
                        <span className="flex items-center gap-1 text-white/40 text-xs">
                          <Phone className="w-3 h-3 text-cyan-400" />
                          {session.visitor_phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-white/30 text-xs">
                        <Globe className="w-3 h-3" />
                        {session.language.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <span className="hidden sm:block text-white/50 text-xs whitespace-nowrap">
                  {formatDate(session.created_at)}
                </span>

                {/* Duration */}
                <span className="hidden md:block text-white/50 text-xs whitespace-nowrap">
                  {formatDuration(session.duration_seconds)}
                </span>

                {/* Status badge */}
                <div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border whitespace-nowrap inline-flex items-center gap-1.5 ${
                      statusStyles[session.status]
                    }`}
                  >
                    {session.status === 'new' && <Eye className="w-3 h-3" />}
                    {session.status === 'qualified' && <Sparkles className="w-3 h-3" />}
                    {session.status === 'need_assistance' && <AlertCircle className="w-3 h-3" />}
                    {session.status === 'closed' && <CheckCircle2 className="w-3 h-3" />}
                    {statusLabels[session.status].en}
                  </span>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <SessionDetail
          session={selected}
          onClose={() => setSelected(null)}
          onStatusChange={onStatusChange}
        />
      )}
    </>
  );
}
