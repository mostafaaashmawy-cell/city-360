import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose';
}

const colorMap = {
  indigo: {
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.25)',
    icon: 'rgba(99,102,241,0.15)',
    iconText: 'text-indigo-400',
    trend: 'text-indigo-400',
  },
  cyan: {
    bg: 'rgba(6,182,212,0.1)',
    border: 'rgba(6,182,212,0.25)',
    icon: 'rgba(6,182,212,0.15)',
    iconText: 'text-cyan-400',
    trend: 'text-cyan-400',
  },
  emerald: {
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.25)',
    icon: 'rgba(16,185,129,0.15)',
    iconText: 'text-emerald-400',
    trend: 'text-emerald-400',
  },
  amber: {
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.25)',
    icon: 'rgba(245,158,11,0.15)',
    iconText: 'text-amber-400',
    trend: 'text-amber-400',
  },
  rose: {
    bg: 'rgba(244,63,94,0.1)',
    border: 'rgba(244,63,94,0.25)',
    icon: 'rgba(244,63,94,0.15)',
    iconText: 'text-rose-400',
    trend: 'text-rose-400',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
}: StatCardProps) {
  const c = colorMap[color];

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.iconText}`}
          style={{ background: c.icon }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-lg ${trend.value >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}
          >
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-white/50 text-sm mt-1">{title}</p>
        {subtitle && <p className="text-white/30 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
