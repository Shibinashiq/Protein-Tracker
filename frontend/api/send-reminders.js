// Vercel Serverless API Function: /api/send-reminders
// Sends Protein Scoop & Scheduled Water Intake Push Notifications to all user phones

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unxmqtyfetbolhgujpma.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nSYm0FRq4v3QlKkiJH54TA_6Bdr_Y5e';

const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || 'BIJKCjc8yN3YsgR-0zFCgSyLAxaQIT9-H4qU0qaIZd9htCr_8GcgtGzrabQJNakqvuk2yFSUqORRM2T8fFFBomo';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'rshHm2OupT9ROStkNAmiUN59_glpS3nEalsCbHH4K5c';
const VAPID_SUBJECT = 'mailto:admin@proteintracker.app';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DISPLAY_NAMES = {
  shibin: 'Shibin',
  niveditha: 'Niveditha',
  nithin: 'Nithin',
};

function getWaterReminder(istHour, name) {
  if (istHour === 11) {
    return {
      title: '💧 Water Check (1.5 Liters)',
      body: `💧 Hey ${name}! Have you completed 1.5 liters of water so far today? Stay hydrated and keep going!`,
    };
  }
  if (istHour === 13) {
    return {
      title: '💧 Water Check (2.5 Liters)',
      body: `💧 Hey ${name}! Time for another water check. Have you drank 1 more liter and reached 2.5 liters today?`,
    };
  }
  if (istHour === 17) {
    return {
      title: '💧 Water Check (3.0 Liters)',
      body: `💧 Hey ${name}! Have you completed 3 liters of water intake today? You're doing great—keep it up!`,
    };
  }
  if (istHour === 21) {
    return {
      title: '💧 Final Water Check (4.0 Liters)',
      body: `💧 Hey ${name}! Final check for today. Have you completed your 4-liter daily water goal? Finish strong and stay healthy! 💪💧`,
    };
  }
  return null;
}

export default async function handler(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const date = new Date();
    const istHour = parseInt(date.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }), 10);
    const forcedType = req.query?.type; // 'water' or 'protein' or 'test'

    // 1. Fetch all registered push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subError) return res.status(500).json({ error: subError.message });
    if (!subscriptions || subscriptions.length === 0) return res.status(200).json({ message: 'No push subscriptions found' });

    // 2. Fetch users who logged protein today
    const { data: todayLogs } = await supabase.from('consumption_logs').select('user_id').eq('date', today);
    const loggedUserIds = new Set((todayLogs ?? []).map((l) => l.user_id));

    const results = [];
    for (const sub of subscriptions) {
      const name = DISPLAY_NAMES[sub.username.toLowerCase()] || sub.username;
      const pushSubscription = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };

      const payloads = [];

      // A. Water Reminder Check (11 AM, 1 PM, 5 PM, 9 PM IST)
      const waterCheck = getWaterReminder(istHour, name);
      if (forcedType === 'water' || waterCheck) {
        payloads.push(waterCheck || {
          title: '💧 Daily Water Reminder',
          body: `💧 Hey ${name}! Remember to keep drinking water and reach your daily 4-liter goal today!`,
        });
      }

      // B. Protein Scoop Reminder (every 3 hours if scoop not logged today)
      if ((forcedType === 'protein' || !waterCheck) && !loggedUserIds.has(sub.user_id)) {
        payloads.push({
          title: '⏰ Protein Scoop Reminder',
          body: `Hey ${name}, don't forget your daily protein scoop! Tap to log +1 scoop ⚡`,
        });
      }

      for (const payload of payloads) {
        try {
          await webpush.sendNotification(pushSubscription, JSON.stringify({ ...payload, url: '/' }));
          results.push({ username: sub.username, title: payload.title, status: 'sent_success' });
        } catch (pushErr) {
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
          results.push({ username: sub.username, title: payload.title, status: 'failed', error: pushErr.message });
        }
      }
    }

    return res.status(200).json({ date: today, istHour, results });
  } catch (err) {
    console.error('Serverless error:', err);
    return res.status(500).json({ error: err.message });
  }
}
