import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

interface WeeklyChartProps {
  data: ChartDataPoint[];
  users: string[];
}

const USER_COLORS = ['#8b5cf6', '#3b82f6', '#10b981'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="font-semibold mb-2 text-foreground">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium text-foreground">{p.value} scoops</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-border/50 text-xs flex justify-between">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold text-foreground">{payload.reduce((s, p) => s + p.value, 0)} scoops</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function WeeklyChart({ data, users }: WeeklyChartProps) {
  const formatted = data.map(d => ({
    ...d,
    date: (() => { try { return format(parseISO(d.date as string), 'EEE d'); } catch { return d.date; } })(),
  }));

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-sm sm:text-base">Weekly Consumption</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 7 days by user</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            {users.map((u, i) => (
              <linearGradient key={u} id={`grad-weekly-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={USER_COLORS[i] ?? '#8b5cf6'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={USER_COLORS[i] ?? '#8b5cf6'} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          {users.map((u, i) => (
            <Area
              key={u}
              type="monotone"
              dataKey={u}
              name={u}
              stroke={USER_COLORS[i] ?? '#8b5cf6'}
              strokeWidth={2}
              fill={`url(#grad-weekly-${i})`}
              dot={{ fill: USER_COLORS[i] ?? '#8b5cf6', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
