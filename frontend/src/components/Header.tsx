import React from 'react';
import { useAuth } from '@/lib/auth';

interface HeaderProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

const USER_COLORS: Record<string, string> = {
  shibin:    'from-violet-500 to-purple-600',
  niveditha: 'from-blue-500 to-cyan-500',
  nithin:    'from-emerald-500 to-teal-500',
};

export default function Header({ darkMode, onToggleDark }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
              <span className="text-lg">💪</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold gradient-text leading-none">Protein Tracker</h1>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">Shared Container</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
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

            {/* User badge */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/50">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${USER_COLORS[user.username] ?? 'from-violet-500 to-purple-600'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {user.display_name.slice(-1)}
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
    </header>
  );
}
