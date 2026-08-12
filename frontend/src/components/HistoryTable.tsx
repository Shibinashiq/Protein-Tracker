import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fetchLogs } from '@/lib/queries';
import { ConsumptionLog } from '@/lib/supabase';

const USER_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  shibin:    { bg: 'bg-violet-500/15', text: 'text-violet-400',  dot: 'bg-violet-400'  },
  niveditha: { bg: 'bg-blue-500/15',   text: 'text-blue-400',    dot: 'bg-blue-400'    },
  nithin:    { bg: 'bg-emerald-500/15',text: 'text-emerald-400', dot: 'bg-emerald-400' },
};

function getColors(username: string) {
  return USER_COLORS[username] ?? { bg: 'bg-muted/40', text: 'text-muted-foreground', dot: 'bg-muted-foreground' };
}

export default function HistoryTable() {
  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: fetchLogs,
    refetchInterval: 30000,
  });

  const logs: ConsumptionLog[] = data ?? [];

  const filtered = logs.filter(l => {
    const matchUser = filterUser === 'all' || l.username === filterUser;
    const matchSearch = !search ||
      (l.display_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.notes ?? '').toLowerCase().includes(search.toLowerCase()) ||
      l.date.includes(search);
    return matchUser && matchSearch;
  });

  const formatDate = (d: string) => { try { return format(parseISO(d), 'MMM d, yyyy'); } catch { return d; } };
  const formatTime = (d: string) => { try { return format(parseISO(d), 'MMM d, h:mm a'); } catch { return d; } };

  return (
    <div className="glass-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-semibold">Audit Log</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} · read-only history
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-xs w-32 sm:w-40"
          />
          <select
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-xs"
          >
            <option value="all">All Users</option>
            <option value="shibin">Shibin</option>
            <option value="niveditha">Niveditha</option>
            <option value="nithin">Nithin</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
            <span className="text-3xl">📋</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">No entries found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {logs.length === 0 ? 'Add your first protein log above' : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {['Date', 'User', 'Scoops', 'Notes', 'Added At'].map(h => (
                    <th key={h} className={`py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider ${h === 'Scoops' ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((log, i) => {
                  const colors = getColors(log.username ?? '');
                  return (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                      <td className="py-3 px-3 font-medium">{formatDate(log.date)}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                          {log.display_name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-muted/40 font-bold text-sm">{log.scoops}</span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-xs max-w-[200px] truncate">
                        {log.notes || <span className="text-muted-foreground/40 italic">—</span>}
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground">{formatTime(log.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col gap-2">
            {filtered.map((log, i) => {
              const colors = getColors(log.username ?? '');
              return (
                <div key={log.id} className="bg-muted/20 rounded-xl p-3 animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        {log.display_name}
                      </span>
                      <span className="text-xs font-medium">{formatDate(log.date)}</span>
                    </div>
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center font-bold text-sm">{log.scoops}</span>
                  </div>
                  {log.notes && <p className="text-xs text-muted-foreground mt-2 truncate">{log.notes}</p>}
                  <p className="text-xs text-muted-foreground/60 mt-1">{formatTime(log.created_at)}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
