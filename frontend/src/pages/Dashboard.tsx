import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fetchDashboard, fetchWeekly, fetchMonthly, fetchLogs, addLog, fetchUserLogsOnDate, deleteLog } from '@/lib/queries';
import { useAuth } from '@/lib/auth';
import Header from '@/components/Header';
import StatsCards from '@/components/StatsCards';
import WeeklyChart from '@/components/WeeklyChart';
import MonthlyChart from '@/components/MonthlyChart';
import AddEntryForm from '@/components/AddEntryForm';
import AuditLogView from '@/components/AuditLogView';
import UserEntriesModal from '@/components/UserEntriesModal';

interface DashboardProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

interface SelectedUserModalState {
  username: string;
  displayName: string;
  totalScoops: number;
}

export default function Dashboard({ darkMode, onToggleDark }: DashboardProps) {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'audit'>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dismissReminder, setDismissReminder] = useState(false);
  const [selectedUserModal, setSelectedUserModal] = useState<SelectedUserModalState | null>(null);

  // Duplicate entry confirmation modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateExistingEntries, setDuplicateExistingEntries] = useState<{ id: string; scoops: number }[]>([]);
  const [pendingLogAction, setPendingLogAction] = useState<(() => void) | null>(null);

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 30000,
  });

  const { data: logsData } = useQuery({
    queryKey: ['logs'],
    queryFn: fetchLogs,
    refetchInterval: 30000,
  });

  const { data: weekly } = useQuery({
    queryKey: ['weekly'],
    queryFn: fetchWeekly,
    refetchInterval: 30000,
  });

  const { data: monthly } = useQuery({
    queryKey: ['monthly'],
    queryFn: fetchMonthly,
    refetchInterval: 30000,
  });

  // Check if current active user has logged a scoop today
  const userLogsToday = (logsData ?? []).filter(
    (l) => l.date === todayStr && l.username === user?.username
  );
  const hasLoggedToday = userLogsToday.length > 0;

  // Background push notifications handled by Supabase Edge Function (send-reminders)

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['logs'] });
    queryClient.invalidateQueries({ queryKey: ['weekly'] });
    queryClient.invalidateQueries({ queryKey: ['monthly'] });
  };

  // Actual log mutation (runs after confirmation if needed)
  const doLogMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error('Not logged in');
      await addLog(session.user.id, todayStr, 1, 'Quick 1-tap log');
    },
    onSuccess: () => {
      invalidateAll();
      setToastMessage(`⚡ Logged 1 scoop for ${user?.display_name || 'you'}!`);
      setTimeout(() => setToastMessage(null), 3500);
    },
    onError: (err: Error) => {
      setToastMessage(`❌ ${err.message || 'Failed to log scoop'}`);
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

  // Delete log mutation (for duplicate removal)
  const deleteLogMutation = useMutation({
    mutationFn: (logId: string) => deleteLog(logId),
    onSuccess: () => {
      invalidateAll();
      setToastMessage('🗑️ Duplicate entry removed!');
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  // Check for existing log before allowing quick +1 scoop
  const handleQuickLog = async () => {
    if (!session?.user?.id) return;

    const existingLogs = await fetchUserLogsOnDate(session.user.id, todayStr);

    if (existingLogs.length > 0) {
      // Already logged today → show confirmation modal
      setDuplicateExistingEntries(existingLogs);
      setPendingLogAction(() => () => doLogMutation.mutate());
      setShowDuplicateModal(true);
    } else {
      doLogMutation.mutate();
    }
  };

  const handleConfirmDuplicate = () => {
    setShowDuplicateModal(false);
    if (pendingLogAction) {
      pendingLogAction();
      setPendingLogAction(null);
    }
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateModal(false);
    setPendingLogAction(null);
  };

  const isPending = doLogMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header
        darkMode={darkMode}
        onToggleDark={onToggleDark}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">


        {/* Top Header Bar & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold">
              {activeTab === 'dashboard' ? 'Dashboard' : 'Audit Log & History'}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeTab === 'dashboard'
                ? 'Track your shared protein container in real time · Click any user card to view entry history'
                : 'Filter entries by calendar date, view daily breakdowns and timestamps'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:w-auto w-full">
            <button
              onClick={handleQuickLog}
              disabled={isPending}
              className="flex-1 sm:flex-none btn-primary py-2.5 px-4 shadow-lg shadow-violet-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span className="text-base leading-none">⚡</span>
              )}
              <span className="font-bold text-sm whitespace-nowrap">
                {isPending ? 'Logging...' : '+1 Scoop Today'}
              </span>
            </button>

            <button
              onClick={() => setShowForm(true)}
              className="py-2.5 px-3.5 rounded-xl border border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/60 text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0"
            >
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Custom Log</span>
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' ? (
          <>
            {dashLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-muted/30 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            ) : dashboard ? (
              <div className="animate-fade-in">
                <StatsCards
                  userTotals={dashboard.userTotals}
                  grandTotal={dashboard.grandTotal}
                  remaining={dashboard.remaining}
                  totalScoops={dashboard.totalScoops}
                  percentRemaining={dashboard.percentRemaining}
                  onSelectUser={(u) => setSelectedUserModal({
                    username: u.username,
                    displayName: u.display_name,
                    totalScoops: u.total_scoops,
                  })}
                />
              </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
              <WeeklyChart data={weekly?.data ?? []} users={weekly?.users ?? []} />
              <MonthlyChart data={monthly?.data ?? []} users={monthly?.users ?? []} />
            </div>
          </>
        ) : (
          <AuditLogView />
        )}
      </main>

      {/* ─── Duplicate Entry Confirmation Modal ─────────────────────────────── */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={handleCancelDuplicate} />
          <div className="relative w-full max-w-sm glass-card p-6 animate-fade-in border-2 border-amber-500/50 shadow-2xl space-y-4">
            {/* Warning icon */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl flex-shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-bold">Already Logged Today!</h3>
                <p className="text-xs text-muted-foreground mt-0.5">You already have {duplicateExistingEntries.length} entry for today</p>
              </div>
            </div>

            {/* Existing entries list */}
            <div className="bg-muted/30 rounded-xl border border-border/60 p-3 space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Today's Existing Entries:</p>
              {duplicateExistingEntries.map((entry, i) => (
                <div key={entry.id} className="flex items-center justify-between">
                  <span className="text-xs text-foreground font-medium">Entry {i + 1}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-primary/20 text-primary text-xs font-bold">+{entry.scoops} scoop</span>
                    <button
                      onClick={() => {
                        deleteLogMutation.mutate(entry.id);
                        setShowDuplicateModal(false);
                        setPendingLogAction(null);
                        setDuplicateExistingEntries(prev => prev.filter(e => e.id !== entry.id));
                      }}
                      className="text-[10px] text-red-400 hover:text-red-300 font-semibold px-1.5 py-0.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Remove this entry"
                    >
                      🗑 Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Warning message */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <p className="text-xs text-amber-400 font-medium leading-relaxed">
                ⚠️ If you continue, <strong>2 scoops will be marked</strong> for today. Only add another entry if you genuinely took a second scoop!
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCancelDuplicate}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDuplicate}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-all"
              >
                Yes, Add 2nd Scoop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/90 dark:bg-slate-800/95 text-white shadow-2xl border border-violet-500/40 backdrop-blur-xl">
            <span className="text-sm font-semibold">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white text-xs ml-2">✕</button>
          </div>
        </div>
      )}

      {/* User Specific Entries Modal */}
      {selectedUserModal && (
        <UserEntriesModal
          username={selectedUserModal.username}
          displayName={selectedUserModal.displayName}
          totalScoops={selectedUserModal.totalScoops}
          onClose={() => setSelectedUserModal(null)}
        />
      )}

      <footer className="border-t border-border/30 py-4 px-6 text-center">
        <p className="text-xs text-muted-foreground">
          Protein Tracker · Shared container (73 scoops) · Auto-refreshes every 30s
        </p>
      </footer>

      {showForm && <AddEntryForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
