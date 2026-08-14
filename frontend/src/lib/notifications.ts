// Protein Tracker — Push Notification Helpers
// Uses VAPID Web Push + Supabase to send real background phone notifications

import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ─── Subscribe & save to Supabase ─────────────────────────────────────────────
export async function subscribeToPush(userId: string, username: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VITE_VAPID_PUBLIC_KEY is not set');
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const subscription = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });

    const { endpoint, keys } = subscription.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    // Upsert subscription into Supabase push_subscriptions table
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        username,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      console.error('Failed to save push subscription:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Push subscribe error:', err);
    return false;
  }
}

// ─── Request Permission + Subscribe ───────────────────────────────────────────
export async function requestAndSubscribe(userId: string, username: string, displayName: string): Promise<'granted' | 'denied' | 'unsupported' | 'ios'> {
  if (!('Notification' in window)) return 'ios';

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') return 'denied';

  const subscribed = await subscribeToPush(userId, username);
  if (subscribed) {
    // Show immediate confirmation notification
    sendLocalNotification(
      '💪 Protein Tracker — Reminders Active!',
      `Hey ${displayName}, you'll get a reminder every 3 hours if you forget to log your protein scoop.`
    );
  }
  return 'granted';
}

// ─── Local in-browser notification (only works when app is open) ───────────────
export function sendLocalNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg' });
    });
  } else {
    new Notification(title, { body });
  }
}
