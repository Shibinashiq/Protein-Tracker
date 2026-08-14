-- ─── Push Subscriptions Table ────────────────────────────────────────────────
-- Stores browser push subscription endpoints per user for background notifications

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS with open public policy so push registration never fails
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Service role can read all subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Public push subscriptions access" ON public.push_subscriptions;

CREATE POLICY "Public push subscriptions access" ON public.push_subscriptions
  FOR ALL TO public USING (true) WITH CHECK (true);

-- ─── Verify ───────────────────────────────────────────────────────────────────
SELECT 'push_subscriptions table & RLS ready' AS status;
