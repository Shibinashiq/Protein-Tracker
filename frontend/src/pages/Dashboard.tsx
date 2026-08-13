import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fetchDashboard, fetchWeekly, fetchMonthly, addLog } from '@/lib/queries';
import { useAuth } from '@/lib/auth';
import Header from '@/components/Header';
import StatsCards from '@/components/StatsCards';
import WeeklyChart from '@/components/WeeklyChart';
import MonthlyChart from '@/components/MonthlyChart';
import AddEntryForm from '@/components/AddEntryForm';
import AuditLogView from '@/components/AuditLogView';

interface DashboardProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function Dashboard({ darkMode, onToggleDark }: DashboardProps) {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'audit'>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
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

  // Quick 1-Tap +1 Scoop Mutation
  const quickLogMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error('Not logged in');
      await addLog(session.user.id, todayStr, 1, 'Quick 1-tap log');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['weekly'] });
      queryClient.invalidateQueries({ queryKey: ['monthly'] });

      // Trigger Toast
      setToastMessage(`⚡ Logged 1 scoop for ${user?.display_name || 'you'}!`);
      setTimeout(() => setToastMessage(null), 3500);
    },
    onError: (err: Error) => {
      setToastMessage(`❌ ${err.message || 'Failed to log scoop'}`);
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

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
                ? 'Track your shared protein container in real time'
                : 'Filter entries by calendar date, view daily breakdowns and timestamps'}
            </p>
          </div>

          {/* Buttons: Quick 1-Tap + Custom Log */}
          <div className="flex items-center gap-2.5 sm:w-auto w-full">
            <button
              onClick={() => quickLogMutation.mutate()}
              disabled={quickLogMutation.isPending}
              className="flex-1 sm:flex-none btn-primary py-2.5 px-4 shadow-lg shadow-violet-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              title={`Instantly log 1 scoop for ${user?.display_name}`}
            >
              {quickLogMutation.isPending ? (
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span className="text-base leading-none">⚡</span>
              )}
              <span className="font-bold text-sm whitespace-nowrap">
                {quickLogMutation.isPending ? 'Logging...' : '+1 Scoop Today'}
              </span>
            </button>

            <button
              onClick={() => setShowForm(true)}
              className="py-2.5 px-3.5 rounded-xl border border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/60 text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0"
              title="Custom Log (date, scoops, notes)"
            >
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Custom Log</span>
            </button>
          </div>
        </div>

        {/* View Switcher */}
        {activeTab === 'dashboard' ? (
          <>
            {/* Stats Cards */}
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
                />
              </div>
            ) : null}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
              <WeeklyChart data={weekly?.data ?? []} users={weekly?.users ?? []} />
              <MonthlyChart data={monthly?.data ?? []} users={monthly?.users ?? []} />
            </div>
          </>
        ) : (
          <AuditLogView />
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/90 dark:bg-slate-800/95 text-white shadow-2xl border border-violet-500/40 backdrop-blur-xl">
            <span className="text-sm font-semibold">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/60 hover:text-white text-xs ml-2"
            >
              ✕
            </button>
          </div>
        </div>
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
