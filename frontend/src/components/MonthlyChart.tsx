import React from 'react';
import {
  BarChart,
  Bar,
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

interface MonthlyChartProps {
  data: ChartDataPoint[];
  users: string[];
}

const USER_COLORS = ['#8b5cf6', '#3b82f6', '#10b981'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((s, p) => s + p.value, 0);
    if (total === 0) return null;
    return (
      <div className="custom-tooltip">
        <p className="font-semibold mb-2 text-foreground">{label}</p>
        {payload.filter(p => p.value > 0).map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium text-foreground">{p.value} scoops</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-border/50 text-xs flex justify-between">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold text-foreground">{total} scoops</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function MonthlyChart({ data, users }: MonthlyChartProps) {
  const formatted = data.map(d => ({
    ...d,
    date: (() => { try { return format(parseISO(d.date as string), 'MMM d'); } catch { return d.date; } })(),
  }));

  const currentMonth = format(new Date(), 'MMMM yyyy');

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-sm sm:text-base">Monthly Consumption</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{currentMonth} daily breakdown</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={12} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            interval={data.length > 15 ? 4 : 1}
          />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          {users.map((u, i) => (
            <Bar
              key={u}
              dataKey={u}
              name={u}
              fill={USER_COLORS[i] ?? '#8b5cf6'}
              radius={[4, 4, 0, 0]}
              opacity={0.9}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
