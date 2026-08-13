'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DailyAnalytics } from '@/types';

interface VisitorChartProps {
  data: DailyAnalytics[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl p-3 text-sm"
        style={{
          background: 'rgba(15,15,30,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <p className="text-white/60 text-xs mb-2 font-medium">{formatDate(label)}</p>
        {payload.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (entry: any) => (
            <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: entry.color }}
              />
              <span className="text-white/70 capitalize">{entry.name}:</span>
              <span className="text-white font-semibold">
                {entry.dataKey === 'avg_session_duration'
                  ? formatDuration(entry.value)
                  : entry.value}
              </span>
            </div>
          ),
        )}
      </div>
    );
  }
  return null;
}

export default function VisitorChart({ data }: VisitorChartProps) {
  const chartData = data.map((d) => ({ ...d, date: d.date }));

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(99,102,241,0.05)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-base">Visitor Trends</h3>
          <p className="text-white/40 text-sm mt-0.5">Last 7 days</p>
        </div>
        <span className="text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
          Daily
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', paddingTop: '12px' }}
          />
          <Area
            type="monotone"
            dataKey="visitor_count"
            name="Visitors"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#colorVisitors)"
            dot={{ fill: '#6366f1', r: 3 }}
            activeDot={{ r: 5, fill: '#818cf8' }}
          />
          <Area
            type="monotone"
            dataKey="leads_count"
            name="Leads"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#colorLeads)"
            dot={{ fill: '#06b6d4', r: 3 }}
            activeDot={{ r: 5, fill: '#22d3ee' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
