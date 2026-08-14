import { supabase, ConsumptionLog, Profile } from './supabase';
import { format, subDays } from 'date-fns';

// ─── Dashboard Stats ───────────────────────────────────────────────────────────

export async function fetchDashboard() {
  // Fetch container, profiles, and all logs in parallel
  const [containerRes, profilesRes, logsRes] = await Promise.all([
    supabase.from('protein_container').select('total_scoops').order('id', { ascending: false }).limit(1).single(),
    supabase.from('profiles').select('id, username, display_name, created_at').order('username'),
    supabase.from('consumption_logs').select('user_id, scoops'),
  ]);

  const totalScoops: number = containerRes.data?.total_scoops ?? 73;
  const profiles: Profile[] = profilesRes.data ?? [];
  const allLogs = logsRes.data ?? [];

  const userTotals = profiles.map(p => ({
    ...p,
    total_scoops: allLogs
      .filter(l => l.user_id === p.id)
      .reduce((s, l) => s + l.scoops, 0),
  }));

  const grandTotal = allLogs.reduce((s, l) => s + l.scoops, 0);
  const remaining = Math.max(0, totalScoops - grandTotal);

  return {
    userTotals,
    grandTotal,
    remaining,
    totalScoops,
    percentRemaining: Math.round((remaining / totalScoops) * 100),
  };
}

// ─── Weekly Chart Data (last 7 days) ──────────────────────────────────────────

export async function fetchWeekly() {
  const since = format(subDays(new Date(), 6), 'yyyy-MM-dd');

  const [profilesRes, logsRes] = await Promise.all([
    supabase.from('profiles').select('id, display_name').order('username'),
    supabase
      .from('consumption_logs')
      .select('date, scoops, user_id')
      .gte('date', since),
  ]);

  const profiles = profilesRes.data ?? [];
  const logs = logsRes.data ?? [];
  const userNames = profiles.map(p => p.display_name);

  // Build a day map for the last 7 days
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }

  const dataMap: Record<string, Record<string, number>> = {};
  for (const day of days) {
    dataMap[day] = {};
    for (const p of profiles) dataMap[day][p.display_name] = 0;
  }

  for (const log of logs) {
    const profile = profiles.find(p => p.id === log.user_id);
    if (profile && dataMap[log.date]) {
      dataMap[log.date][profile.display_name] =
        (dataMap[log.date][profile.display_name] ?? 0) + log.scoops;
    }
  }

  const data = days.map(day => ({ date: day, ...dataMap[day] }));
  return { data, users: userNames };
}

// ─── Monthly Chart Data (current month) ───────────────────────────────────────

export async function fetchMonthly() {
  const now = new Date();
  const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');

  const [profilesRes, logsRes] = await Promise.all([
    supabase.from('profiles').select('id, display_name').order('username'),
    supabase
      .from('consumption_logs')
      .select('date, scoops, user_id')
      .gte('date', monthStart),
  ]);

  const profiles = profilesRes.data ?? [];
  const logs = logsRes.data ?? [];
  const userNames = profiles.map(p => p.display_name);

  // All days in current month so far
  const days: string[] = [];
  for (let d = 1; d <= now.getDate(); d++) {
    days.push(format(new Date(now.getFullYear(), now.getMonth(), d), 'yyyy-MM-dd'));
  }

  const dataMap: Record<string, Record<string, number>> = {};
  for (const day of days) {
    dataMap[day] = {};
    for (const p of profiles) dataMap[day][p.display_name] = 0;
  }

  for (const log of logs) {
    const profile = profiles.find(p => p.id === log.user_id);
    if (profile && dataMap[log.date]) {
      dataMap[log.date][profile.display_name] =
        (dataMap[log.date][profile.display_name] ?? 0) + log.scoops;
    }
  }

  const data = days.map(day => ({ date: day, ...dataMap[day] }));
  return { data, users: userNames };
}

// ─── All Logs (audit log) ────────────────────────────────────────────────────

export async function fetchLogs(): Promise<ConsumptionLog[]> {
  const [profilesRes, logsRes] = await Promise.all([
    supabase.from('profiles').select('id, username, display_name'),
    supabase
      .from('consumption_logs')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
  ]);

  const profiles = profilesRes.data ?? [];
  const logs = logsRes.data ?? [];

  return logs.map(log => {
    const profile = profiles.find(p => p.id === log.user_id);
    return {
      ...log,
      username: profile?.username ?? '',
      display_name: profile?.display_name ?? '',
    };
  });
}

// ─── Add Log Entry ────────────────────────────────────────────────────────────

export async function addLog(userId: string, date: string, scoops: number, notes?: string) {
  // Check remaining scoops first
  const [containerRes, totalRes] = await Promise.all([
    supabase.from('protein_container').select('total_scoops').order('id', { ascending: false }).limit(1).single(),
    supabase.from('consumption_logs').select('scoops'),
  ]);

  const totalScoops = containerRes.data?.total_scoops ?? 73;
  const consumed = (totalRes.data ?? []).reduce((s, l) => s + l.scoops, 0);
  const remaining = totalScoops - consumed;

  if (scoops > remaining) {
    throw new Error(`Not enough scoops remaining (${remaining} left)`);
  }

  const { error } = await supabase.from('consumption_logs').insert({
    user_id: userId,
    date,
    scoops,
    notes: notes || null,
  });

  if (error) throw new Error(error.message);
}

// ─── Check if user already has log(s) on a specific date ──────────────────────

export async function fetchUserLogsOnDate(userId: string, date: string): Promise<{ id: string; scoops: number }[]> {
  const { data } = await supabase
    .from('consumption_logs')
    .select('id, scoops')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true });
  return data ?? [];
}

// ─── Delete a specific log entry by ID ────────────────────────────────────────

export async function deleteLog(logId: string) {
  const { error } = await supabase.from('consumption_logs').delete().eq('id', logId);
  if (error) throw new Error(error.message);
}

