import React from 'react';

interface UserTotal {
  id: string;
  username: string;
  display_name: string;
  total_scoops: number;
}

interface StatsCardsProps {
  userTotals: UserTotal[];
  grandTotal: number;
  remaining: number;
  totalScoops: number;
  percentRemaining: number;
}

const USER_CONFIG = [
  { gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', icon: '👤' },
  { gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: '👤' },
  { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: '👤' },
];

function StatCard({
  label,
  value,
  sub,
  gradient,
  bg,
  border,
  textColor,
  icon,
  progress,
}: {
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
  bg: string;
  border: string;
  textColor: string;
  icon: string;
  progress?: number;
}) {
  return (
    <div className={`stat-card ${bg} border ${border}`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <span className={`text-3xl font-bold ${textColor} count-animate`}>{value}</span>
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
          <span className="text-lg">{icon}</span>
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Container level</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gradient} rounded-full progress-bar-animate transition-all duration-1000`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function StatsCards({ userTotals, grandTotal, remaining, totalScoops, percentRemaining }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* Per-user cards */}
      {userTotals.map((u, i) => {
        const config = USER_CONFIG[i] ?? USER_CONFIG[0];
        return (
          <StatCard
            key={u.id}
            label={u.display_name}
            value={u.total_scoops}
            sub="total scoops"
            gradient={config.gradient}
            bg={config.bg}
            border={config.border}
            textColor={config.text}
            icon={config.icon}
          />
        );
      })}

      {/* Grand total */}
      <StatCard
        label="Total Consumed"
        value={grandTotal}
        sub="all users combined"
        gradient="from-orange-500 to-rose-600"
        bg="bg-orange-500/10"
        border="border-orange-500/20"
        textColor="text-orange-400"
        icon="📊"
      />

      {/* Remaining */}
      <StatCard
        label="Remaining"
        value={remaining}
        sub={`of ${totalScoops} scoops`}
        gradient={percentRemaining > 30 ? 'from-emerald-500 to-green-600' : percentRemaining > 15 ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-rose-600'}
        bg={percentRemaining > 30 ? 'bg-emerald-500/10' : percentRemaining > 15 ? 'bg-yellow-500/10' : 'bg-red-500/10'}
        border={percentRemaining > 30 ? 'border-emerald-500/20' : percentRemaining > 15 ? 'border-yellow-500/20' : 'border-red-500/20'}
        textColor={percentRemaining > 30 ? 'text-emerald-400' : percentRemaining > 15 ? 'text-yellow-400' : 'text-red-400'}
        icon={percentRemaining > 30 ? '✅' : percentRemaining > 15 ? '⚠️' : '🚨'}
        progress={percentRemaining}
      />
    </div>
  );
}
