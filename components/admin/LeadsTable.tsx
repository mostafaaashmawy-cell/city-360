'use client';

import type { LeadSession } from '@/types';
import { useState } from 'react';
import { ChevronRight, Phone, Globe } from 'lucide-react';
import SessionDetail from './SessionDetail';

interface LeadsTableProps {
  sessions: LeadSession[];
}

const statusStyles = {
  new: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  contacted: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  qualified: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  closed: 'bg-white/5 text-white/40 border-white/10',
};

const statusLabels = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  closed: 'Closed',
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

export default function LeadsTable({ sessions }: LeadsTableProps) {
  const [selected, setSelected] = useState<LeadSession | null>(null);

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
          <span>Visitor</span>
          <span className="hidden sm:block">Date</span>
          <span className="hidden md:block">Duration</span>
          <span>Status</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setSelected(session)}
              className="w-full grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-center text-left hover:bg-white/[0.03] transition-colors group"
            >
              {/* Visitor */}
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {session.visitor_name ?? 'Anonymous'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {session.visitor_phone && (
                    <span className="flex items-center gap-1 text-white/40 text-xs">
                      <Phone className="w-3 h-3" />
                      {session.visitor_phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-white/30 text-xs">
                    <Globe className="w-3 h-3" />
                    {session.language.toUpperCase()}
                  </span>
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
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-lg border whitespace-nowrap ${statusStyles[session.status]}`}
              >
                {statusLabels[session.status]}
              </span>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <SessionDetail session={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
