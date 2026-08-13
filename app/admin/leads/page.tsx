'use client';

import { mockSessions } from '@/lib/mockData';
import LeadsTable from '@/components/admin/LeadsTable';
import { Users, UserCheck, UserX, Sparkles } from 'lucide-react';

export default function LeadsPage() {
  const sessions = mockSessions;

  const counts = {
    total: sessions.length,
    new: sessions.filter((s) => s.status === 'new').length,
    qualified: sessions.filter((s) => s.status === 'qualified').length,
    closed: sessions.filter((s) => s.status === 'closed').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads & Conversations</h1>
          <p className="text-white/40 text-sm mt-1">
            All visitor sessions and AI conversation logs
          </p>
        </div>
        <button
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
        >
          <Sparkles className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Sessions', value: counts.total, Icon: Users, color: 'text-indigo-400', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
          { label: 'New Leads', value: counts.new, Icon: Sparkles, color: 'text-indigo-400', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.15)' },
          { label: 'Qualified', value: counts.qualified, Icon: UserCheck, color: 'text-emerald-400', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
          { label: 'Closed', value: counts.closed, Icon: UserX, color: 'text-white/40', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
        ].map(({ label, value, Icon, color, bg, border }) => (
          <div
            key={label}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
            <div>
              <p className="text-white font-bold text-lg tabular-nums">{value}</p>
              <p className="text-white/40 text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <LeadsTable sessions={sessions} />
    </div>
  );
}
