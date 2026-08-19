'use client';

import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { mockSessions } from '@/lib/mockData';
import type { LeadSession, LeadStatus } from '@/types';
import LeadsTable from '@/components/admin/LeadsTable';
import ProjectTabBar from '@/components/admin/ProjectTabBar';
import {
  MessageCircle,
  Eye,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Building2,
} from 'lucide-react';

export default function LeadsPage() {
  const { projects } = useSettings();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [sessions, setSessions] = useState<LeadSession[]>(mockSessions);

  // Compute counts per project for tabs
  const leadCountsByProject: Record<string, number> = {};
  sessions.forEach((s) => {
    if (s.project_id) {
      leadCountsByProject[s.project_id] = (leadCountsByProject[s.project_id] || 0) + 1;
    }
  });

  // Filter sessions based on selected project tab
  const filteredSessions =
    selectedProjectId === 'all'
      ? sessions
      : sessions.filter((s) => s.project_id === selectedProjectId);

  const activeProj = projects.find((p) => p.id === selectedProjectId);

  const counts = {
    total: filteredSessions.length,
    new: filteredSessions.filter((s) => s.status === 'new').length,
    qualified: filteredSessions.filter((s) => s.status === 'qualified').length,
    need_assistance: filteredSessions.filter((s) => s.status === 'need_assistance').length,
    closed: filteredSessions.filter((s) => s.status === 'closed').length,
  };

  const handleStatusChange = (sessionId: string, newStatus: LeadStatus) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s))
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">WhatsApp Leads & Inquiries</h1>
          <p className="text-white/40 text-sm mt-1">
            Review and manage all customer WhatsApp leads and captured buying signals
          </p>
        </div>
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
              {selectedProjectId === 'all'
                ? 'All Projects'
                : activeProj?.project_name || 'Selected Project'}
            </strong>
          </span>
        </div>
        <span className="text-xs text-white/40 font-medium">
          {filteredSessions.length} WhatsApp lead{filteredSessions.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Quick stats for selected project with updated categories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'New (Unopened)',
            value: counts.new,
            Icon: Eye,
            color: 'text-indigo-400',
            bg: 'rgba(99,102,241,0.08)',
            border: 'rgba(99,102,241,0.2)',
            hint: 'Leads not opened yet by admin',
          },
          {
            label: 'Qualified',
            value: counts.qualified,
            Icon: Sparkles,
            color: 'text-emerald-400',
            bg: 'rgba(16,185,129,0.08)',
            border: 'rgba(16,185,129,0.2)',
            hint: 'High buying intent (budget/plan)',
          },
          {
            label: 'Need Assistance',
            value: counts.need_assistance,
            Icon: AlertCircle,
            color: 'text-amber-400',
            bg: 'rgba(245,158,11,0.08)',
            border: 'rgba(245,158,11,0.2)',
            hint: 'Special plan / Custom questions',
          },
          {
            label: 'Closed Deals',
            value: counts.closed,
            Icon: CheckCircle2,
            color: 'text-white/50',
            bg: 'rgba(255,255,255,0.04)',
            border: 'rgba(255,255,255,0.08)',
            hint: 'Inquiries finalized',
          },
        ].map(({ label, value, Icon, color, bg, border, hint }) => (
          <div
            key={label}
            className="rounded-xl p-4 flex flex-col justify-between space-y-2"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-xs font-medium">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-white font-bold text-xl tabular-nums">{value}</p>
              <p className="text-[11px] text-white/40 truncate">{hint}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <LeadsTable sessions={filteredSessions} onStatusChange={handleStatusChange} />
    </div>
  );
}
