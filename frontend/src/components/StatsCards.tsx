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
  onSelectUser?: (user: UserTotal) => void;
}

const USER_CONFIG = [
  { gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10', border: 'border-violet-500/20 hover:border-violet-500/50', text: 'text-violet-400', icon: '👤' },
  { gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20 hover:border-blue-500/50', text: 'text-blue-400', icon: '👤' },
  { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20 hover:border-emerald-500/50', text: 'text-emerald-400', icon: '👤' },
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
  onClick,
  isUserCard,
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
  onClick?: () => void;
  isUserCard?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`stat-card ${bg} border ${border} ${
        isUserCard ? 'cursor-pointer hover:scale-[1.03] hover:shadow-xl transition-all duration-200 group' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</span>
          <span className={`text-3xl font-bold ${textColor} count-animate`}>{value}</span>
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
          <span className="text-lg">{icon}</span>
        </div>
      </div>

      {isUserCard && (
        <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-[11px] font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
          <span>View entry history</span>
          <span>→</span>
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-2">
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

export default function StatsCards({
  userTotals,
  grandTotal,
  remaining,
  totalScoops,
  percentRemaining,
  onSelectUser,
}: StatsCardsProps) {
  // 73 total scoops divided across 3 users = 24.3 scoops per person
  const fairSharePerUser = Math.round((totalScoops / 3) * 10) / 10;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Individual User Cards */}
      {userTotals.map((u, i) => {
        const config = USER_CONFIG[i] ?? USER_CONFIG[0];
        const userRemaining = Math.max(0, Math.round((fairSharePerUser - u.total_scoops) * 10) / 10);
        return (
          <StatCard
            key={u.id}
            label={u.display_name}
            value={u.total_scoops}
            sub={`${userRemaining} left of ${fairSharePerUser}`}
            gradient={config.gradient}
            bg={config.bg}
            border={config.border}
            textColor={config.text}
            icon={config.icon}
            isUserCard={true}
            onClick={() => onSelectUser && onSelectUser(u)}
          />
        );
      })}

      {/* Fair Share Per Person Card */}
      <StatCard
        label="Share Per Person"
        value={fairSharePerUser}
        sub="Target per user"
        gradient="from-cyan-500 to-blue-600"
        bg="bg-cyan-500/10"
        border="border-cyan-500/20"
        textColor="text-cyan-400"
        icon="⚖️"
      />

      {/* Total Consumed Card */}
      <StatCard
        label="Total Consumed"
        value={grandTotal}
        sub={`out of ${totalScoops} scoops`}
        gradient="from-violet-500 to-purple-600"
        bg="bg-violet-500/10"
        border="border-violet-500/20"
        textColor="text-violet-400"
        icon="📊"
      />

      {/* Remaining Powder Card */}
      <StatCard
        label="Container Left"
        value={remaining}
        sub="scoops remaining"
        gradient="from-amber-500 to-orange-600"
        bg="bg-amber-500/10"
        border="border-amber-500/20"
        textColor="text-amber-400"
        icon="🫙"
        progress={percentRemaining}
      />
    </div>
  );
}
