// Protein Tracker — Push Notification Helpers
// Uses VAPID Web Push + Supabase to send real background phone notifications

import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string) || 'BIJKCjc8yN3YsgR-0zFCgSyLAxaQIT9-H4qU0qaIZd9htCr_8GcgtGzrabQJNakqvuk2yFSUqORRM2T8fFFBomo';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export interface SubscribeResult {
  status: 'granted' | 'denied' | 'unsupported' | 'ios';
  savedToDb: boolean;
  error?: string;
}

// ─── Subscribe & save to Supabase ─────────────────────────────────────────────
export async function subscribeToPush(userId: string, username: string): Promise<{ success: boolean; error?: string }> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, error: 'Push notifications not supported on this browser' };
  }
  if (!VAPID_PUBLIC_KEY) {
    return { success: false, error: 'VITE_VAPID_PUBLIC_KEY environment variable missing' };
  }

  try {
    const reg = await navigator.serviceWorker.ready;

    // Clear old invalid subscription if present to ensure fresh VAPID key binding
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      try { await existing.unsubscribe(); } catch (_) {}
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });

    const json = subscription.toJSON();
    const endpoint = json.endpoint ?? subscription.endpoint;
    const keys = json.keys as { p256dh: string; auth: string } | undefined;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return { success: false, error: 'Failed to extract push encryption keys from browser' };
    }

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
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Push subscribe error:', err);
    return { success: false, error: err?.message || 'Failed to subscribe' };
  }
}

// ─── Request Permission + Subscribe ───────────────────────────────────────────
export async function requestAndSubscribe(userId: string, username: string, displayName: string): Promise<SubscribeResult> {
  if (!('Notification' in window)) return { status: 'ios', savedToDb: false };

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') return { status: 'denied', savedToDb: false };

  const subRes = await subscribeToPush(userId, username);
  if (subRes.success) {
    sendLocalNotification(
      '💪 Protein Tracker — Reminders Active!',
      `Hey ${displayName}, reminders are ACTIVE! You will be reminded every 2 minutes if you forget to log your protein scoop.`
    );
    return { status: 'granted', savedToDb: true };
  }

  return { status: 'granted', savedToDb: false, error: subRes.error };
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
