import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { addLog, fetchUserLogsOnDate, deleteLog } from '@/lib/queries';
import { useAuth } from '@/lib/auth';

interface AddEntryFormProps {
  onClose: () => void;
}

interface UserLogOnDate {
  id: string;
  scoops: number;
}

export default function AddEntryForm({ onClose }: AddEntryFormProps) {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [form, setForm] = useState({ date: today, scoops: 1, notes: '' });
  const [error, setError] = useState('');
  const [existingLogsOnDate, setExistingLogsOnDate] = useState<UserLogOnDate[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);
  const [isCheckingDate, setIsCheckingDate] = useState(false);

  // Check existing logs whenever selected date changes
  useEffect(() => {
    let active = true;
    if (session?.user?.id && form.date) {
      setIsCheckingDate(true);
      fetchUserLogsOnDate(session.user.id, form.date).then(logs => {
        if (active) {
          setExistingLogsOnDate(logs);
          setIsCheckingDate(false);
        }
      });
    }
    return () => { active = false; };
  }, [form.date, session?.user?.id]);

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

  const deleteLogMutation = useMutation({
    mutationFn: (logId: string) => deleteLog(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['weekly'] });
      queryClient.invalidateQueries({ queryKey: ['monthly'] });
      setShowDuplicateModal(false);
      setExistingLogsOnDate([]);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.scoops < 1 || form.scoops > 100) {
      setError('Scoops must be between 1 and 100');
      return;
    }

    // If entries already exist for the selected date and user hasn't confirmed yet, trigger duplicate modal
    if (!confirmedDuplicate && existingLogsOnDate.length > 0) {
      setShowDuplicateModal(true);
      return;
    }

    mutation.mutate();
  };

  const totalExistingScoops = existingLogsOnDate.reduce((sum, l) => sum + l.scoops, 0);

  const formattedSelectedDate = () => {
    try { return format(parseISO(form.date), 'MMMM d, yyyy'); } catch { return form.date; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md glass-card p-6 animate-fade-in z-10 border-2 border-border/80 shadow-2xl">
        <div className="flex items-center justify-between mb-5 border-b border-border/50 pb-3">
          <div>
            <h2 className="text-lg font-bold">Log Protein Intake</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recording as <span className="text-primary font-bold">{user?.display_name}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Picker + Instant Existing Entry Badge */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Date <span className="text-red-400">*</span>
              </label>
              {existingLogsOnDate.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold animate-pulse">
                  ⚠️ Already logged ({totalExistingScoops} scoop{totalExistingScoops > 1 ? 's' : ''})
                </span>
              )}
            </div>
            <input
              type="date"
              value={form.date}
              max={today}
              onChange={(e) => {
                setForm(f => ({ ...f, date: e.target.value }));
                setConfirmedDuplicate(false);
              }}
              className={`w-full px-4 py-2.5 rounded-xl bg-muted/50 border transition-all text-sm font-medium focus:outline-none focus:ring-2 ${
                existingLogsOnDate.length > 0
                  ? 'border-amber-500/60 focus:ring-amber-500/30'
                  : 'border-border focus:border-primary focus:ring-primary/20'
              }`}
              required
            />
            {existingLogsOnDate.length > 0 && (
              <p className="text-[11px] text-amber-400/90 mt-1 font-medium flex items-center gap-1">
                <span>⚠️ Note:</span> You already have {existingLogsOnDate.length} entry logged for {formattedSelectedDate()}.
              </p>
            )}
          </div>

          {/* Scoops counter */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm text-center font-bold text-lg"
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
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
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
            <p className="text-[10px] text-muted-foreground text-right mt-0.5">{form.notes.length}/500</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs font-semibold">
              <span>❌</span> {error}
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-border/50">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted/50 text-xs font-bold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending || isCheckingDate} className="btn-primary flex-1 py-2.5 text-xs font-bold">
              {mutation.isPending ? 'Saving...' : 'Log Intake'}
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Entry Confirmation Modal Popup */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm glass-card p-6 border-2 border-amber-500/60 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-amber-500/20">
              ⚠️
            </div>

            <div>
              <h3 className="font-bold text-lg text-foreground">Already Marked Entry!</h3>
              <p className="text-xs text-amber-400 font-semibold mt-1">
                You already logged for {formattedSelectedDate()}
              </p>
            </div>

            <div className="bg-muted/40 p-3.5 rounded-xl border border-border/60 text-xs space-y-1.5 text-left">
              <div className="flex items-center justify-between font-bold text-foreground">
                <span>Existing scoops logged:</span>
                <span className="text-amber-400">{totalExistingScoops} scoop{totalExistingScoops > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>New scoops to add:</span>
                <span className="text-primary font-bold">+{form.scoops} scoop{form.scoops > 1 ? 's' : ''}</span>
              </div>
              <div className="border-t border-border/40 pt-1.5 flex items-center justify-between font-bold text-foreground">
                <span>Total if confirmed:</span>
                <span className="text-emerald-400">{totalExistingScoops + form.scoops} scoops</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to mark a 2nd entry for this date?
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setConfirmedDuplicate(true);
                  setShowDuplicateModal(false);
                  mutation.mutate();
                }}
                disabled={mutation.isPending}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
              >
                ➕ Yes, Mark Additional {form.scoops} Scoop{form.scoops > 1 ? 's' : ''}
              </button>

              {existingLogsOnDate.length > 0 && (
                <button
                  onClick={() => {
                    deleteLogMutation.mutate(existingLogsOnDate[0].id);
                  }}
                  disabled={deleteLogMutation.isPending}
                  className="w-full py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 font-bold text-xs transition-all"
                >
                  {deleteLogMutation.isPending ? 'Removing...' : '🗑️ Remove Previous Entry'}
                </button>
              )}

              <button
                onClick={() => setShowDuplicateModal(false)}
                className="w-full py-2 rounded-xl bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
