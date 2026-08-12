import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';

const USERS = [
  {
    username: 'shibin',
    displayName: 'Shibin',
    emoji: '💪',
    color: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/30',
    ring: 'border-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    username: 'niveditha',
    displayName: 'Niveditha',
    emoji: '🏋️',
    color: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/30',
    ring: 'border-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    username: 'nithin',
    displayName: 'Nithin',
    emoji: '🥤',
    color: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/30',
    ring: 'border-emerald-500',
    bg: 'bg-emerald-500/10',
  },
];

export default function Login() {
  const { login } = useAuth();
  const [selectedUser, setSelectedUser] = useState(USERS[0]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = (user: typeof USERS[0]) => {
    setSelectedUser(user);
    setError('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(selectedUser.username, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg.includes('Invalid') ? 'Wrong password. Try again.' : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-0 w-72 h-72 rounded-full bg-emerald-600/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-2xl shadow-violet-500/30 mb-4">
            <span className="text-3xl">💪</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Protein Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1.5">73 scoops · shared container</p>
        </div>

        <div className="glass-card p-7">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-4">
            Who are you?
          </p>

          {/* User cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {USERS.map((u) => {
              const isSelected = selectedUser.username === u.username;
              return (
                <button
                  key={u.username}
                  type="button"
                  onClick={() => handleSelect(u)}
                  className={`relative flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl border-2 transition-all duration-200
                    ${isSelected
                      ? `${u.ring} ${u.bg} shadow-lg`
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                    }`}
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${u.color} flex items-center justify-center shadow-lg ${u.shadow} transition-transform duration-200 ${isSelected ? 'scale-105' : ''}`}>
                    <span className="text-xl">{u.emoji}</span>
                  </div>
                  <span className="text-xs font-semibold leading-none">{u.displayName}</span>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center shadow-md`}>
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected user label */}
          <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl ${selectedUser.bg} border border-current/10`}>
            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${selectedUser.color} flex items-center justify-center text-xs`}>
              {selectedUser.emoji}
            </div>
            <span className="text-sm font-medium">Signing in as <span className="font-bold">{selectedUser.displayName}</span></span>
          </div>

          {/* Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm animate-fade-in">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="btn-primary w-full py-3"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In as {selectedUser.displayName}
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Protein Tracker · Shared container
        </p>
      </div>
    </div>
  );
}
