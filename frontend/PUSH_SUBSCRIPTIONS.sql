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

-- Allow each user to manage their own subscriptions only
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Allow Edge Function (service role) to read all subscriptions to send notifications
CREATE POLICY "Service role can read all subscriptions" ON public.push_subscriptions
  FOR SELECT USING (true);

-- ─── Verify ───────────────────────────────────────────────────────────────────
SELECT 'push_subscriptions table ready' AS status;
