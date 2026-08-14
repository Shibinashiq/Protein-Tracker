import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fetchLogs } from '@/lib/queries';
import { ConsumptionLog } from '@/lib/supabase';
import { USER_INITIALS } from '@/lib/auth';

interface UserEntriesModalProps {
  username: string;
  displayName: string;
  totalScoops: number;
  onClose: () => void;
}

const USER_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  shibin:    { bg: 'bg-violet-500/15', text: 'text-violet-400',  border: 'border-violet-500/40', gradient: 'from-violet-600 to-purple-600' },
  niveditha: { bg: 'bg-blue-500/15',   text: 'text-blue-400',    border: 'border-blue-500/40',   gradient: 'from-blue-600 to-cyan-600' },
  nithin:    { bg: 'bg-emerald-500/15',text: 'text-emerald-400', border: 'border-emerald-500/40', gradient: 'from-emerald-600 to-teal-600' },
};

function getColors(username: string) {
  return USER_COLORS[username.toLowerCase()] ?? { bg: 'bg-muted/40', text: 'text-muted-foreground', border: 'border-border', gradient: 'from-slate-600 to-slate-700' };
}

export default function UserEntriesModal({ username, displayName, totalScoops, onClose }: UserEntriesModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: fetchLogs,
    refetchInterval: 30000,
  });

  const allLogs: ConsumptionLog[] = data ?? [];

  // Filter logs for this user only
  const userLogs = allLogs
    .filter((l) => (l.username || '').toLowerCase() === username.toLowerCase())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const colors = getColors(username);
  const initials = USER_INITIALS[username.toLowerCase()] || displayName.slice(0, 2).toUpperCase();

  const formatDate = (dateStr: string) => {
    try { return format(parseISO(dateStr), 'EEEE, MMM d, yyyy'); } catch { return dateStr; }
  };

  const formatTime = (timeStr: string) => {
    try { return format(parseISO(timeStr), 'h:mm a'); } catch { return timeStr; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg glass-card p-6 animate-fade-in max-h-[85vh] flex flex-col border-2 border-border/80 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-5 border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors.gradient} text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg border-2 border-white/40`}>
              {initials}
            </div>
            <div>
              <h3 className="text-xl font-bold">{displayName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total Logged: <strong className={colors.text}>{totalScoops} scoops</strong> · {userLogs.length} entries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground border border-border/50"
          >
            ✕
          </button>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Scoop Entry History:
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : userLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <span className="text-3xl block mb-2">📋</span>
              <p className="text-sm font-semibold">No entries recorded yet</p>
              <p className="text-xs mt-1">Scoops logged by {displayName} will appear here</p>
            </div>
          ) : (
            userLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-muted/40 border-2 border-border/70 flex items-center justify-between gap-3 shadow-sm hover:border-primary/40 transition-colors"
              >
                {/* Left: Date + Time + Notes */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground">{formatDate(log.date)}</span>
                    <span className="text-xs text-muted-foreground font-medium">· {formatTime(log.created_at)}</span>
                  </div>
                  {log.notes ? (
                    <p className="text-xs text-foreground/90 mt-1 truncate">💬 {log.notes}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic mt-0.5">No notes</p>
                  )}
                </div>

                {/* Right: +1 Scoop Badge */}
                <div className="flex-shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-primary/20 text-primary font-bold text-xs whitespace-nowrap shadow-sm border border-primary/30">
                    +{log.scoops} {log.scoops === 1 ? 'scoop' : 'scoops'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-border/50 text-right">
          <button onClick={onClose} className="btn-primary py-2 px-5 text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
