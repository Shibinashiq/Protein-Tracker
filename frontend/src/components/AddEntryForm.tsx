import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { addLog, fetchUserLogsOnDate } from '@/lib/queries';
import { useAuth } from '@/lib/auth';

interface AddEntryFormProps {
  onClose: () => void;
}

export default function AddEntryForm({ onClose }: AddEntryFormProps) {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [form, setForm] = useState({ date: today, scoops: 1, notes: '' });
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<{ count: number; totalScoops: number } | null>(null);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);

  const mutation = useMutation({
    mutationFn: () => addLog(session!.user.id, form.date, form.scoops, form.notes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['weekly'] });
      queryClient.invalidateQueries({ queryKey: ['monthly'] });
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to add entry. Please try again.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.scoops < 1 || form.scoops > 100) {
      setError('Scoops must be between 1 and 100');
      return;
    }

    // Check for existing entries on the selected date
    if (!confirmedDuplicate && session?.user?.id) {
      const existing = await fetchUserLogsOnDate(session.user.id, form.date);
      if (existing.length > 0) {
        const totalExisting = existing.reduce((s, l) => s + l.scoops, 0);
        setDuplicateWarning({ count: existing.length, totalScoops: totalExisting });
        return; // Wait for user to confirm
      }
    }
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md glass-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">Log Protein Intake</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recording as <span className="text-primary font-medium">{user?.display_name}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              max={today}
              onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              required
            />
          </div>

          {/* Scoops counter */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Number of Scoops <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, scoops: Math.max(1, f.scoops - 1) }))}
                className="w-10 h-10 rounded-xl bg-muted/50 border border-border hover:border-primary/40 hover:bg-muted flex items-center justify-center transition-all font-bold text-lg"
              >−</button>
              <input
                type="number"
                value={form.scoops}
                min={1} max={100}
                onChange={(e) => setForm(f => ({ ...f, scoops: parseInt(e.target.value) || 1 }))}
                className="flex-1 px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm text-center font-semibold text-lg"
                required
              />
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, scoops: Math.min(100, f.scoops + 1) }))}
                className="w-10 h-10 rounded-xl bg-muted/50 border border-border hover:border-primary/40 hover:bg-muted flex items-center justify-center transition-all font-bold text-lg"
              >+</button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Notes <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Post-workout, morning shake..."
              rows={2}
              maxLength={500}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground text-right mt-0.5">{form.notes.length}/500</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          )}

          {/* Duplicate Entry Warning */}
          {duplicateWarning && (
            <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="text-xs font-bold text-amber-400">Already logged on this date!</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {duplicateWarning.count} existing {duplicateWarning.count === 1 ? 'entry' : 'entries'} · {duplicateWarning.totalScoops} scoop{duplicateWarning.totalScoops > 1 ? 's' : ''} logged
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                Adding this will mark <strong>{duplicateWarning.totalScoops + form.scoops} total scoops</strong> for {form.date}. Only confirm if you actually took a second serving!
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="flex-1 py-2 rounded-xl border border-border bg-muted/30 text-xs font-semibold hover:bg-muted/60 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { setConfirmedDuplicate(true); setDuplicateWarning(null); mutation.mutate(); }}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-all"
                >
                  Yes, Log {form.scoops} More Scoop{form.scoops > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted/50 text-sm font-medium transition-all">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 py-2.5">
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Log Intake
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
