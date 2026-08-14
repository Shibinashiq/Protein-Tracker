// Vercel Serverless API Function: /api/send-reminders
// Triggered every 2 minutes by Vercel Cron to send Web Push notifications

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unxmqtyfetbolhgujpma.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nSYm0FRq4v3QlKkiJH54TA_6Bdr_Y5e';

const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || 'BIJKCjc8yN3YsgR-0zFCgSyLAxaQIT9-H4qU0qaIZd9htCr_8GcgtGzrabQJNakqvuk2yFSUqORRM2T8fFFBomo';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'rshHm2OupT9ROStkNAmiUN59_glpS3nEalsCbHH4K5c';
const VAPID_SUBJECT = 'mailto:admin@proteintracker.app';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 1. Fetch all registered push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subError) {
      return res.status(500).json({ error: subError.message });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'No push subscriptions found in database' });
    }

    // 2. Fetch users who have logged today
    const { data: todayLogs } = await supabase
      .from('consumption_logs')
      .select('user_id')
      .eq('date', today);

    const loggedUserIds = new Set((todayLogs ?? []).map((l) => l.user_id));

    // 3. Send push to users who haven't logged today
    const results = [];
    for (const sub of subscriptions) {
      if (loggedUserIds.has(sub.user_id)) {
        results.push({ username: sub.username, status: 'skipped_already_logged' });
        continue;
      }

      const displayNames = {
        shibin: 'Shibin',
        niveditha: 'Niveditha',
        nithin: 'Nithin',
      };
      const name = displayNames[sub.username] || sub.username;

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      const payload = JSON.stringify({
        title: '⏰ Protein Tracker Reminder',
        body: `Hey ${name}, don't forget your daily protein scoop! Tap to log +1 scoop ⚡`,
        url: '/',
      });

      try {
        await webpush.sendNotification(pushSubscription, payload);
        results.push({ username: sub.username, status: 'sent_success' });
      } catch (pushErr) {
        console.error('Web push error:', pushErr);
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
        results.push({ username: sub.username, status: 'failed', error: pushErr.message });
      }
    }

    return res.status(200).json({ date: today, results });
  } catch (err) {
    console.error('Serverless error:', err);
    return res.status(500).json({ error: err.message });
  }
}
