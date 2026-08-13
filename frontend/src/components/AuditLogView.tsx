import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';
import { fetchLogs } from '@/lib/queries';
import { ConsumptionLog } from '@/lib/supabase';
import { USER_INITIALS } from '@/lib/auth';

const USER_COLORS: Record<string, { bg: string; text: string; dot: string; border: string; gradient: string }> = {
  shibin:    { bg: 'bg-violet-500/15', text: 'text-violet-400',  dot: 'bg-violet-400',  border: 'border-violet-500/40', gradient: 'from-violet-600 to-purple-600' },
  niveditha: { bg: 'bg-blue-500/15',   text: 'text-blue-400',    dot: 'bg-blue-400',    border: 'border-blue-500/40',   gradient: 'from-blue-600 to-cyan-600' },
  nithin:    { bg: 'bg-emerald-500/15',text: 'text-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-500/40', gradient: 'from-emerald-600 to-teal-600' },
};

function getColors(username: string) {
  return USER_COLORS[username] ?? { bg: 'bg-muted/40', text: 'text-muted-foreground', dot: 'bg-muted-foreground', border: 'border-border', gradient: 'from-slate-600 to-slate-700' };
}

function getInitials(username?: string, displayName?: string) {
  if (username && USER_INITIALS[username.toLowerCase()]) return USER_INITIALS[username.toLowerCase()];
  return (displayName ?? 'U').slice(0, 2).toUpperCase();
}

interface GroupedDay {
  date: string;
  totalScoops: number;
  logs: ConsumptionLog[];
  userCounts: Record<string, number>;
}

export default function AuditLogView() {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const [filterUser, setFilterUser] = useState('all');
  const [selectedDay, setSelectedDay] = useState<GroupedDay | null>(null);
  const [customDateFilter, setCustomDateFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: fetchLogs,
    refetchInterval: 30000,
  });

  const logs: ConsumptionLog[] = data ?? [];

  // Group logs by date
  const groupedMap: Record<string, ConsumptionLog[]> = {};
  for (const log of logs) {
    if (!groupedMap[log.date]) groupedMap[log.date] = [];
    groupedMap[log.date].push(log);
  }

  // Convert map into array sorted newest first
  const groupedDays: GroupedDay[] = Object.keys(groupedMap)
    .sort((a, b) => b.localeCompare(a))
    .map(date => {
      const dayLogs = groupedMap[date];
      const totalScoops = dayLogs.reduce((sum, l) => sum + l.scoops, 0);
      const userCounts: Record<string, number> = { shibin: 0, niveditha: 0, nithin: 0 };
      for (const l of dayLogs) {
        userCounts[l.username || ''] = (userCounts[l.username || ''] || 0) + l.scoops;
      }
      return { date, totalScoops, logs: dayLogs, userCounts };
    });

  // Filter grouped days by user filter and custom date
  const filteredDays = groupedDays.filter(d => {
    const matchDate = !customDateFilter || d.date === customDateFilter;
    const matchUser = filterUser === 'all' || (d.userCounts[filterUser] ?? 0) > 0;
    return matchDate && matchUser;
  });

  const formatDateTitle = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    try { return format(parseISO(dateStr), 'EEEE, MMM d, yyyy'); } catch { return dateStr; }
  };

  const formatShortDate = (dateStr: string) => {
    try { return format(parseISO(dateStr), 'MMM d, yyyy'); } catch { return dateStr; }
  };

  const formatTime = (timeStr: string) => {
    try { return format(parseISO(timeStr), 'h:mm a'); } catch { return timeStr; }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header controls & filters */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">📅</span> Daily Audit Calendar
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Click any date card to view who logged scoops and details for that day
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Pick specific date */}
            <div>
              <input
                type="date"
                value={customDateFilter}
                onChange={(e) => setCustomDateFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
              />
            </div>

            {/* Clear date filter button */}
            {customDateFilter && (
              <button
                onClick={() => setCustomDateFilter('')}
                className="px-2.5 py-1.5 rounded-xl bg-muted/40 hover:bg-muted text-xs text-muted-foreground transition-colors"
              >
                Clear Date
              </button>
            )}

            {/* User Filter */}
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-medium"
            >
              <option value="all">All 3 Users</option>
              <option value="shibin">Shibin</option>
              <option value="niveditha">Niveditha</option>
              <option value="nithin">Nithin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Date Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filteredDays.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          <span className="text-4xl block mb-2">🗓️</span>
          <p className="text-base font-semibold">No logs recorded for this selection</p>
          <p className="text-xs mt-1">Try picking a different date or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDays.map((day) => {
            const isToday = day.date === todayStr;
            return (
              <div
                key={day.date}
                onClick={() => setSelectedDay(day)}
                className={`group relative glass-card p-5 cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200 border-2 ${
                  isToday ? 'border-primary/50 bg-primary/5' : 'border-border/60 hover:border-primary/40'
                }`}
              >
                {/* Date header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold">{formatDateTitle(day.date)}</span>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                          Today
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatShortDate(day.date)}</span>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-primary/20 text-primary font-bold text-sm flex-shrink-0">
                    {day.totalScoops} {day.totalScoops === 1 ? 'scoop' : 'scoops'}
                  </span>
                </div>

                {/* User Badges summary for the day */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Users Logged on this Date:
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'shibin', name: 'Shibin', scoops: day.userCounts.shibin, color: USER_COLORS.shibin },
                      { key: 'niveditha', name: 'Niveditha', scoops: day.userCounts.niveditha, color: USER_COLORS.niveditha },
                      { key: 'nithin', name: 'Nithin', scoops: day.userCounts.nithin, color: USER_COLORS.nithin },
                    ].map((u) => (
                      <div
                        key={u.key}
                        className={`p-2 rounded-xl border-2 ${u.color.border} ${u.color.bg} flex flex-col items-center justify-center transition-all ${
                          u.scoops > 0 ? 'opacity-100 shadow-sm' : 'opacity-30'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${u.color.dot}`} />
                          <span className={`text-[11px] font-bold ${u.color.text} truncate`}>{u.name}</span>
                        </div>
                        <span className="text-xs font-bold mt-0.5">{u.scoops}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Click to view indicator */}
                <div className="mt-4 flex items-center justify-between text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">
                  <span>Click to view entry details ({day.logs.length})</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Date Details Modal / Drawer */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedDay(null)} />

          <div className="relative w-full max-w-lg glass-card p-6 animate-fade-in max-h-[85vh] flex flex-col border-2 border-border/80 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-5 border-b border-border/50 pb-4">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Date Log Details</span>
                <h3 className="text-xl font-bold mt-0.5">{formatDateTitle(selectedDay.date)}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{formatShortDate(selectedDay.date)} · Total {selectedDay.totalScoops} scoops</p>
              </div>

              <button
                onClick={() => setSelectedDay(null)}
                className="w-8 h-8 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground border border-border/50"
              >
                ✕
              </button>
            </div>

            {/* User Summary Bar in Modal */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { key: 'shibin', name: 'Shibin', scoops: selectedDay.userCounts.shibin, color: USER_COLORS.shibin },
                { key: 'niveditha', name: 'Niveditha', scoops: selectedDay.userCounts.niveditha, color: USER_COLORS.niveditha },
                { key: 'nithin', name: 'Nithin', scoops: selectedDay.userCounts.nithin, color: USER_COLORS.nithin },
              ].map(u => (
                <div key={u.key} className={`p-2.5 rounded-xl border-2 ${u.color.border} ${u.color.bg} flex flex-col items-center justify-center shadow-sm`}>
                  <span className={`text-xs font-bold ${u.color.text} text-center leading-tight`}>{u.name}</span>
                  <span className="text-sm font-bold mt-0.5">{u.scoops} scoops</span>
                </div>
              ))}
            </div>

            {/* List of User Entries for this day */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Entries logged on this date:
              </div>

              {selectedDay.logs.map((log) => {
                const colors = getColors(log.username ?? '');
                const initials = getInitials(log.username, log.display_name);
                return (
                  <div key={log.id} className="p-3.5 rounded-xl bg-muted/40 border-2 border-border/70 flex items-center justify-between gap-3 shadow-sm">
                    {/* Left: Avatar initial letter box (SA / NR / NI) + User Name & Timestamp + Notes */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md border-2 border-white/40 ring-2 ring-black/10`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-sm ${colors.text}`}>{log.display_name}</span>
                          <span className="text-xs text-muted-foreground font-medium">· {formatTime(log.created_at)}</span>
                        </div>
                        {log.notes ? (
                          <p className="text-xs text-foreground/90 mt-0.5 truncate">💬 {log.notes}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground/50 italic mt-0.5">No notes</p>
                        )}
                      </div>
                    </div>

                    {/* Right: Badge vertically centered */}
                    <div className="flex-shrink-0">
                      <span className="px-3 py-1.5 rounded-xl bg-primary/20 text-primary font-bold text-xs whitespace-nowrap shadow-sm border border-primary/30">
                        +{log.scoops} {log.scoops === 1 ? 'scoop' : 'scoops'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-border/50 text-right">
              <button
                onClick={() => setSelectedDay(null)}
                className="btn-primary py-2 px-5 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
