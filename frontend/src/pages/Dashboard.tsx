import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboard, fetchWeekly, fetchMonthly } from '@/lib/queries';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'audit'>('dashboard');
  const [showForm, setShowForm] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        darkMode={darkMode}
        onToggleDark={onToggleDark}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header Bar */}
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
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary sm:w-auto w-full shadow-lg shadow-violet-500/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log Protein Intake
          </button>
        </div>

        {/* View Switcher */}
        {activeTab === 'dashboard' ? (
          <>
            {/* Stats Cards */}
            {dashLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
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

      <footer className="border-t border-border/30 py-4 px-6 text-center">
        <p className="text-xs text-muted-foreground">
          Protein Tracker · Shared container (73 scoops) · Auto-refreshes every 30s
        </p>
      </footer>

      {showForm && <AddEntryForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
