'use client';

import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { mockAnalytics, mockSessions } from '@/lib/mockData';
import StatCard from '@/components/admin/StatCard';
import VisitorChart from '@/components/admin/VisitorChart';
import ProjectTabBar from '@/components/admin/ProjectTabBar';
import { Users, Clock, TrendingUp, Percent, Building2 } from 'lucide-react';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function AnalyticsPage() {
  const { projects } = useSettings();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Compute lead counts per project for the Excel tabs
  const leadCountsByProject: Record<string, number> = {};
  mockSessions.forEach((s) => {
    if (s.project_id) {
      leadCountsByProject[s.project_id] = (leadCountsByProject[s.project_id] || 0) + 1;
    }
  });

  // Calculate project-adjusted analytics
  const activeProj = projects.find((p) => p.id === selectedProjectId);
  const multiplier = selectedProjectId === 'all' ? 1.0 : selectedProjectId === projects[0]?.id ? 0.62 : 0.38;

  const totalVisitors = Math.round(mockAnalytics.total_visitors * multiplier);
  const totalLeads = selectedProjectId === 'all' ? mockAnalytics.total_leads : Math.round(mockAnalytics.total_leads * multiplier);
  const conversionRate = totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : mockAnalytics.conversion_rate;
  const avgDuration = mockAnalytics.avg_session_duration;

  // Filter daily data
  const dailyData = mockAnalytics.daily.map((d) => ({
    ...d,
    visitor_count: Math.round(d.visitor_count * multiplier),
    leads_count: Math.round(d.leads_count * multiplier),
  }));

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Project Analytics</h1>
          <p className="text-white/40 text-sm mt-1">
            Track visitor engagement and lead conversions across projects
          </p>
        </div>
      </div>

      {/* ── Excel-Style Sheet Tab Bar (Auto-creates tabs for every project!) ──── */}
      <ProjectTabBar
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        leadCountsByProject={leadCountsByProject}
      />

      {/* Active Filter Indicator */}
      <div className="flex items-center gap-2 text-xs text-white/50 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/5 w-fit">
        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
        <span>
          Viewing metrics for:{' '}
          <strong className="text-white">
            {selectedProjectId === 'all' ? 'All Projects (Aggregated)' : activeProj?.project_name || 'Selected Project'}
          </strong>
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Visitors"
          value={totalVisitors.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 12, label: 'vs last week' }}
          color="indigo"
        />
        <StatCard
          title="Avg. Session Duration"
          value={formatDuration(avgDuration)}
          icon={<Clock className="w-5 h-5" />}
          trend={{ value: 8, label: 'vs last week' }}
          color="cyan"
        />
        <StatCard
          title="Total Leads"
          value={totalLeads}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 22, label: 'vs last week' }}
          color="emerald"
        />
        <StatCard
          title="Conversion Rate"
          value={`${conversionRate.toFixed(1)}%`}
          icon={<Percent className="w-5 h-5" />}
          trend={{ value: 3, label: 'vs last week' }}
          color="amber"
        />
      </div>

      {/* Visitor Chart */}
      <VisitorChart data={dailyData} />

      {/* Daily breakdown table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="px-5 py-4 border-b border-white/5 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <h3 className="text-white font-semibold text-sm">
            Daily Breakdown — {selectedProjectId === 'all' ? 'All Projects' : activeProj?.project_name}
          </h3>
          <span className="text-white/30 text-xs">Last 7 days</span>
        </div>

        <div
          className="grid grid-cols-4 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/30 border-b border-white/5"
          style={{ background: 'rgba(255,255,255,0.01)' }}
        >
          <span>Date</span>
          <span>Visitors</span>
          <span className="hidden sm:block">Avg Duration</span>
          <span>Leads</span>
        </div>

        <div className="divide-y divide-white/5">
          {[...dailyData].reverse().map((day) => (
            <div
              key={day.date}
              className="grid grid-cols-4 gap-4 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-white/60 text-sm">
                {new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="text-white font-semibold text-sm tabular-nums">
                {day.visitor_count}
              </span>
              <span className="hidden sm:block text-white/50 text-sm">
                {formatDuration(day.avg_session_duration)}
              </span>
              <span className="text-emerald-400 font-semibold text-sm tabular-nums">
                {day.leads_count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
