'use client';

import { mockAnalytics } from '@/lib/mockData';
import StatCard from '@/components/admin/StatCard';
import VisitorChart from '@/components/admin/VisitorChart';
import { Users, Clock, TrendingUp, Percent } from 'lucide-react';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function AnalyticsPage() {
  const a = mockAnalytics;

  return (
    <div className="p-6 lg:p-8 space-y-8 min-h-screen">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-white/40 text-sm mt-1">
          Track visitor engagement and lead performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Visitors"
          value={a.total_visitors.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 12, label: 'vs last week' }}
          color="indigo"
        />
        <StatCard
          title="Avg. Session Duration"
          value={formatDuration(a.avg_session_duration)}
          icon={<Clock className="w-5 h-5" />}
          trend={{ value: 8, label: 'vs last week' }}
          color="cyan"
        />
        <StatCard
          title="Total Leads"
          value={a.total_leads}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 22, label: 'vs last week' }}
          color="emerald"
        />
        <StatCard
          title="Conversion Rate"
          value={`${a.conversion_rate.toFixed(1)}%`}
          icon={<Percent className="w-5 h-5" />}
          trend={{ value: 3, label: 'vs last week' }}
          color="amber"
        />
      </div>

      {/* Visitor Chart */}
      <VisitorChart data={a.daily} />

      {/* Daily breakdown table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="px-5 py-4 border-b border-white/5 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <h3 className="text-white font-semibold text-sm">Daily Breakdown</h3>
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
          {[...a.daily].reverse().map((day) => (
            <div
              key={day.date}
              className="grid grid-cols-4 gap-4 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-white/60 text-sm">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
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
