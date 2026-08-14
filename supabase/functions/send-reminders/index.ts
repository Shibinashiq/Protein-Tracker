// Supabase Edge Function: send-reminders
// Triggered every 3 hours by pg_cron or Supabase Scheduler
// Sends push notifications to users who haven't logged a protein scoop today

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@proteintracker.app';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ─── Encode base64url ──────────────────────────────────────────────────────────
function base64urlToUint8(str: string): Uint8Array {
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const b64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
}

function uint8ToBase64url(arr: Uint8Array): string {
  let s = '';
  arr.forEach(b => s += String.fromCharCode(b));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ─── Create VAPID JWT for Authorization header ─────────────────────────────────
async function makeVapidJwt(audience: string): Promise<string> {
  const header = uint8ToBase64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = uint8ToBase64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: vapidSubject,
  })));

  const privateKeyBytes = base64urlToUint8(vapidPrivateKey);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const data = new TextEncoder().encode(`${header}.${payload}`);
  const signatureBuffer = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, cryptoKey, data);
  const signature = uint8ToBase64url(new Uint8Array(signatureBuffer));
  return `${header}.${payload}.${signature}`;
}

// ─── Send a single push notification ──────────────────────────────────────────
async function sendPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: object): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const jwt = await makeVapidJwt(audience);

    // Encrypt payload using Web Push encryption (simplified VAPID-only path)
    const bodyBytes = new TextEncoder().encode(JSON.stringify(payload));

    const res = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt},k=${vapidPublicKey}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': bodyBytes.length.toString(),
        'TTL': '86400',
      },
      body: bodyBytes,
    });
    return res.ok || res.status === 201;
  } catch (err) {
    console.error('Push send error:', err);
    return false;
  }
}

// ─── Main Handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' } });
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 1. Get all push subscriptions
  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('*');

  if (subError) {
    return new Response(JSON.stringify({ error: subError.message }), { status: 500 });
  }

  // 2. Get all users who have logged today
  const { data: todayLogs } = await supabase
    .from('consumption_logs')
    .select('user_id')
    .eq('date', today);

  const loggedUserIds = new Set((todayLogs ?? []).map((l: { user_id: string }) => l.user_id));

  // 3. Send push to users who haven't logged today
  const results: string[] = [];
  for (const sub of (subscriptions ?? [])) {
    if (loggedUserIds.has(sub.user_id)) {
      results.push(`${sub.username}: already logged today — skipped`);
      continue;
    }

    const displayNames: Record<string, string> = {
      shibin: 'Shibin',
      niveditha: 'Niveditha',
      nithin: 'Nithin',
    };
    const name = displayNames[sub.username] || sub.username;

    const sent = await sendPush(sub, {
      title: '⏰ Protein Tracker Reminder',
      body: `Hey ${name}, you haven't logged your protein scoop today! Tap to log ⚡`,
      url: '/',
    });

    results.push(`${sub.username}: ${sent ? '✅ sent' : '❌ failed'}`);
  }

  return new Response(JSON.stringify({ date: today, results }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
