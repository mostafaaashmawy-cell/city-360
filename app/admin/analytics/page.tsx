'use client';

import { useState, useMemo } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { mockAnalytics, mockSessions } from '@/lib/mockData';
import StatCard from '@/components/admin/StatCard';
import VisitorChart from '@/components/admin/VisitorChart';
import ProjectTabBar from '@/components/admin/ProjectTabBar';
import {
  Users,
  Clock,
  TrendingUp,
  Percent,
  Building2,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

type SortField = 'date' | 'visitor_count' | 'avg_session_duration' | 'leads_count';
type SortOrder = 'asc' | 'desc';

export default function AnalyticsPage() {
  const { projects } = useSettings();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('7');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Compute lead counts per project for the Excel tabs
  const leadCountsByProject: Record<string, number> = {};
  mockSessions.forEach((s) => {
    if (s.project_id) {
      leadCountsByProject[s.project_id] = (leadCountsByProject[s.project_id] || 0) + 1;
    }
  });

  // Calculate project-adjusted analytics
  const activeProj = projects.find((p) => p.id === selectedProjectId);
  const multiplier =
    selectedProjectId === 'all'
      ? 1.0
      : selectedProjectId === projects[0]?.id
      ? 0.62
      : 0.38;

  const totalVisitors = Math.round(mockAnalytics.total_visitors * multiplier);
  const totalLeads =
    selectedProjectId === 'all'
      ? mockAnalytics.total_leads
      : Math.round(mockAnalytics.total_leads * multiplier);
  const conversionRate =
    totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : mockAnalytics.conversion_rate;
  const avgDuration = mockAnalytics.avg_session_duration;

  // Base daily data with project multiplier
  const rawDailyData = useMemo(() => {
    return mockAnalytics.daily.map((d) => ({
      ...d,
      visitor_count: Math.round(d.visitor_count * multiplier),
      leads_count: Math.round(d.leads_count * multiplier),
    }));
  }, [multiplier]);

  // Filter and sort table records
  const filteredAndSortedDaily = useMemo(() => {
    let result = [...rawDailyData];

    // Search filter (e.g. searching a date string)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (day) =>
          day.date.toLowerCase().includes(q) ||
          new Date(day.date)
            .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            .toLowerCase()
            .includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'date') {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [rawDailyData, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-white/25" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-400" />
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Project Analytics</h1>
          <p className="text-white/40 text-sm mt-1">
            Track visitor engagement and lead conversions across projects
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 w-fit">
          <Calendar className="w-3.5 h-3.5 text-white/40 ml-2 mr-1" />
          {(['7', '14', '30'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDateRange(r)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                dateRange === r
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              Last {r} Days
            </button>
          ))}
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
            {selectedProjectId === 'all'
              ? 'All Projects (Aggregated)'
              : activeProj?.project_name || 'Selected Project'}
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
      <VisitorChart data={rawDailyData} />

      {/* ── Daily breakdown table with interactive filters & sorting ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Table Header & Search Filter */}
        <div
          className="px-5 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div>
            <h3 className="text-white font-semibold text-sm">
              Daily Breakdown —{' '}
              {selectedProjectId === 'all' ? 'All Projects' : activeProj?.project_name}
            </h3>
            <span className="text-white/30 text-xs">
              Showing {filteredAndSortedDaily.length} records · Click column header to sort
            </span>
          </div>

          {/* Search bar inside table */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search date..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-white/25 bg-white/5 border border-white/10 outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        {/* Sortable Column Headers */}
        <div
          className="grid grid-cols-4 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 border-b border-white/5 select-none"
          style={{ background: 'rgba(255,255,255,0.01)' }}
        >
          <button
            type="button"
            onClick={() => handleSort('date')}
            className="flex items-center gap-1.5 text-left hover:text-white transition-colors"
          >
            <span>Date</span>
            {renderSortIcon('date')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('visitor_count')}
            className="flex items-center gap-1.5 text-left hover:text-white transition-colors"
          >
            <span>Visitors</span>
            {renderSortIcon('visitor_count')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('avg_session_duration')}
            className="hidden sm:flex items-center gap-1.5 text-left hover:text-white transition-colors"
          >
            <span>Avg Duration</span>
            {renderSortIcon('avg_session_duration')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('leads_count')}
            className="flex items-center gap-1.5 text-left hover:text-white transition-colors"
          >
            <span>Leads</span>
            {renderSortIcon('leads_count')}
          </button>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-white/5">
          {filteredAndSortedDaily.length > 0 ? (
            filteredAndSortedDaily.map((day) => (
              <div
                key={day.date}
                className="grid grid-cols-4 gap-4 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-white/70 text-sm font-medium">
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
            ))
          ) : (
            <div className="p-8 text-center text-xs text-white/40">
              No matching analytics records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
