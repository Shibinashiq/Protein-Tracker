import React, { useState, useEffect, useRef } from 'react';
import { useAuth, USER_INITIALS } from '@/lib/auth';
import { subscribeToPush } from '@/lib/notifications';
import { useAppUpdate } from '@/lib/useAppUpdate';

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
  const { user, session, logout } = useAuth();
  const { updateAvailable, applyUpdate } = useAppUpdate();
  const initials = user?.username ? USER_INITIALS[user.username] || user.display_name.slice(0, 2) : 'U';

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-subscribe push token on mount when user is authenticated
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted' && session?.user?.id && user?.username) {
      subscribeToPush(session.user.id, user.username, user.display_name);
    }
  }, [session?.user?.id, user?.username, user?.display_name]);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await applyUpdate();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Left: Logo & Nav Tabs */}
          <div className="flex items-center gap-2.5 sm:gap-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
                <span className="text-lg">💪</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-base font-bold gradient-text leading-none">Protein Tracker</h1>
                <p className="text-xs text-muted-foreground leading-none mt-0.5">Shared Container</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => onTabChange('dashboard')}
                title="Dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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

          {/* Right side: Ultra-clean User Profile Pill Dropdown */}
          <div className="relative" ref={menuRef}>
            {user && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`relative flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-200 shadow-sm ${
                  showMenu
                    ? 'border-primary/60 bg-muted/60 ring-2 ring-primary/20'
                    : 'border-border/60 bg-muted/40 hover:bg-muted/60 hover:border-primary/40'
                }`}
              >
                {/* User Avatar Circle */}
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${USER_COLORS[user.username] ?? 'from-violet-500 to-purple-600'} text-white flex items-center justify-center text-xs font-bold flex-shrink-0 border-2 border-white/40 shadow-sm`}>
                  {initials}
                </div>

                {/* User Name */}
                <span className="text-xs font-bold">{user.display_name}</span>

                {/* Update Available Indicator Badge */}
                {updateAvailable && (
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" title="Update available" />
                )}

                {/* Dropdown Chevron */}
                <svg
                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${showMenu ? 'rotate-180 text-foreground' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            {/* Dropdown Menu Popup */}
            {showMenu && user && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-card border-2 border-border/70 shadow-2xl p-2 z-50 animate-fade-in space-y-1">
                {/* User Header */}
                <div className="px-3 py-2.5 rounded-xl bg-muted/30 border border-border/40 mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${USER_COLORS[user.username] ?? 'from-violet-500 to-purple-600'} text-white flex items-center justify-center text-xs font-bold flex-shrink-0 border-2 border-white/40 shadow-sm`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{user.display_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.username}@protein.app</p>
                    </div>
                  </div>
                </div>

                {/* Theme Switcher Button */}
                <button
                  onClick={() => { onToggleDark(); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <div className="flex items-center gap-2">
                    {darkMode ? (
                      <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">{darkMode ? '☀️' : '🌙'}</span>
                </button>

                {/* Refresh & Sync App Button */}
                <button
                  onClick={() => { handleManualRefresh(); setShowMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    updateAvailable
                      ? 'bg-violet-600 text-white shadow-md font-bold'
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{updateAvailable ? 'Apply App Update' : 'Refresh App & Sync'}</span>
                  </div>
                  {updateAvailable && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-black text-[9px] font-bold uppercase">New</span>
                  )}
                </button>

                <div className="my-1 border-t border-border/40" />

                {/* Logout Button */}
                <button
                  onClick={() => { setShowMenu(false); logout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
