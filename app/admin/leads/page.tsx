'use client';

import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { mockSessions } from '@/lib/mockData';
import LeadsTable from '@/components/admin/LeadsTable';
import ProjectTabBar from '@/components/admin/ProjectTabBar';
import { Users, UserCheck, UserX, Sparkles, Building2 } from 'lucide-react';

export default function LeadsPage() {
  const { projects } = useSettings();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Compute counts per project for tabs
  const leadCountsByProject: Record<string, number> = {};
  mockSessions.forEach((s) => {
    if (s.project_id) {
      leadCountsByProject[s.project_id] = (leadCountsByProject[s.project_id] || 0) + 1;
    }
  });

  // Filter sessions based on selected project tab
  const filteredSessions =
    selectedProjectId === 'all'
      ? mockSessions
      : mockSessions.filter((s) => s.project_id === selectedProjectId);

  const activeProj = projects.find((p) => p.id === selectedProjectId);

  const counts = {
    total: filteredSessions.length,
    new: filteredSessions.filter((s) => s.status === 'new').length,
    qualified: filteredSessions.filter((s) => s.status === 'qualified').length,
    closed: filteredSessions.filter((s) => s.status === 'closed').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads & Conversations</h1>
          <p className="text-white/40 text-sm mt-1">
            Review customer AI conversation transcripts and captured requirements
          </p>
        </div>
        <button
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 w-fit shadow-md shadow-indigo-500/20"
          style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
        >
          <Sparkles className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* ── Excel-Style Project Tabs (Auto-generated for each project) ─────── */}
      <ProjectTabBar
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        leadCountsByProject={leadCountsByProject}
      />

      {/* Active Tab Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-white/50 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/5 w-fit">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            Displaying leads for:{' '}
            <strong className="text-white">
              {selectedProjectId === 'all' ? 'All Projects' : activeProj?.project_name || 'Selected Project'}
            </strong>
          </span>
        </div>
        <span className="text-xs text-white/40 font-medium">
          {filteredSessions.length} conversation{filteredSessions.length === 1 ? '' : 's'} found
        </span>
      </div>

      {/* Quick stats for selected project */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Sessions',
            value: counts.total,
            Icon: Users,
            color: 'text-indigo-400',
            bg: 'rgba(99,102,241,0.1)',
            border: 'rgba(99,102,241,0.2)',
          },
          {
            label: 'New Leads',
            value: counts.new,
            Icon: Sparkles,
            color: 'text-indigo-400',
            bg: 'rgba(99,102,241,0.08)',
            border: 'rgba(99,102,241,0.15)',
          },
          {
            label: 'Qualified',
            value: counts.qualified,
            Icon: UserCheck,
            color: 'text-emerald-400',
            bg: 'rgba(16,185,129,0.08)',
            border: 'rgba(16,185,129,0.2)',
          },
          {
            label: 'Closed',
            value: counts.closed,
            Icon: UserX,
            color: 'text-white/40',
            bg: 'rgba(255,255,255,0.04)',
            border: 'rgba(255,255,255,0.08)',
          },
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
      <LeadsTable sessions={filteredSessions} />
    </div>
  );
}
