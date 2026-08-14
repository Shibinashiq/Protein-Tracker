-- ─── Push Subscriptions Table ────────────────────────────────────────────────
-- Clean, fail-safe push subscriptions table for real background phone notifications

DROP TABLE IF EXISTS public.push_subscriptions;

CREATE TABLE public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  username    TEXT NOT NULL,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disable RLS so browser push token registration never gets blocked by database policies
ALTER TABLE public.push_subscriptions DISABLE ROW LEVEL SECURITY;

-- ─── Verify ───────────────────────────────────────────────────────────────────
SELECT 'push_subscriptions table ready and RLS disabled' AS status;
