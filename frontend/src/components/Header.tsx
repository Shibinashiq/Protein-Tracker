import React, { useState, useEffect } from 'react';
import { useAuth, USER_INITIALS } from '@/lib/auth';
import { sendImmediateNotification } from '@/lib/notifications';

interface HeaderProps {
  darkMode: boolean;
  onToggleDark: () => void;
  activeTab: 'dashboard' | 'audit';
  onTabChange: (tab: 'dashboard' | 'audit') => void;
}

const USER_COLORS: Record<string, string> = {
  shibin:    'from-violet-500 to-purple-600',
  niveditha: 'from-blue-500 to-cyan-500',
  nithin:    'from-emerald-500 to-teal-500',
};

export default function Header({ darkMode, onToggleDark, activeTab, onTabChange }: HeaderProps) {
  const { user, logout } = useAuth();
  const initials = user?.username ? USER_INITIALS[user.username] || user.display_name.slice(0, 2) : 'U';

  const [notifGranted, setNotifGranted] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotifGranted(true);
    }
  }, []);

  const handleNotificationToggle = () => {
    // Apple iOS restriction check: Chrome on iOS doesn't support Web Notifications directly in browser tab
    if (!('Notification' in window)) {
      setShowIOSModal(true);
      return;
    }

    if (Notification.permission === 'granted') {
      setNotifGranted(true);
      sendImmediateNotification(user?.display_name || 'there');
    } else {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          setNotifGranted(true);
          sendImmediateNotification(user?.display_name || 'there');
        } else {
          alert('Notification permission was denied in your browser settings.');
        }
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Nav Tabs */}
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
                <span className="text-lg">💪</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-base font-bold gradient-text leading-none">Protein Tracker</h1>
                <p className="text-xs text-muted-foreground leading-none mt-0.5">Shared Container</p>
              </div>
            </div>

            {/* Navigation Tabs - Icons only on mobile, Icon + Text on desktop */}
            <nav className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => onTabChange('dashboard')}
                title="Dashboard"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => onTabChange('audit')}
                title="Audit Log"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'audit'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Audit Log</span>
              </button>
            </nav>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Notification Bell toggle */}
            <button
              onClick={handleNotificationToggle}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 hover:shadow-md ${
                notifGranted
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
              title={notifGranted ? 'Notifications Active (Click for instant test notification)' : 'Enable Notifications'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDark}
              className="w-9 h-9 rounded-xl border border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/60 flex items-center justify-center transition-all duration-200 hover:shadow-md"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* User badge with initials */}
            {user && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-muted/40 border border-border/50">
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${USER_COLORS[user.username] ?? 'from-violet-500 to-purple-600'} text-white flex items-center justify-center text-xs font-bold flex-shrink-0 border-2 border-white/40 shadow-sm`}>
                  {initials}
                </div>
                <span className="text-sm font-medium hidden sm:block">{user.display_name}</span>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={logout}
              className="w-9 h-9 rounded-xl border border-border hover:border-red-500/40 bg-muted/30 hover:bg-red-500/10 flex items-center justify-center transition-all duration-200 group"
              title="Logout"
            >
              <svg className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* iPhone iOS Safari Guidance Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-card p-6 border-2 border-violet-500/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xl flex-shrink-0">
                📱
              </div>
              <div>
                <h3 className="font-bold text-base">iPhone Push Setup</h3>
                <p className="text-xs text-muted-foreground">Apple iOS Notification Rule</p>
              </div>
            </div>

            <p className="text-xs text-foreground/90 leading-relaxed">
              Apple blocks notifications inside Chrome on iOS. To enable push notifications on your iPhone:
            </p>

            <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside bg-muted/30 p-3 rounded-xl border border-border/50">
              <li>Open this app link in <strong className="text-foreground">Safari</strong></li>
              <li>Tap <strong className="text-foreground">Share (📤 icon at bottom)</strong></li>
              <li>Tap <strong className="text-foreground">"Add to Home Screen"</strong></li>
              <li>Open the app from your iPhone home screen & tap the Bell 🔔 icon!</li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
