-- ══════════════════════════════════════════════════════════════════
--   PROTEIN TRACKER — Supabase Setup SQL (Expose Public Schema)
--   Run this ENTIRE file in: Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════════

-- Expose public schema to PostgREST API
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, api';
NOTIFY pgrst, 'reload schema';

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ─── 1. PROFILES TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT        NOT NULL UNIQUE,
  display_name TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. PROTEIN CONTAINER TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.protein_container (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  total_scoops INTEGER     NOT NULL DEFAULT 73,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.protein_container (total_scoops)
SELECT 73
WHERE NOT EXISTS (SELECT 1 FROM public.protein_container);

-- ─── 3. CONSUMPTION LOGS TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consumption_logs (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE        NOT NULL,
  scoops     INTEGER     NOT NULL CHECK (scoops >= 1 AND scoops <= 100),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.consumption_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_date    ON public.consumption_logs(date);

-- ─── 4. ROW LEVEL SECURITY & PERMISSIONS ─────────────────────────
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protein_container ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_logs  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "container_select" ON public.protein_container;
CREATE POLICY "container_select" ON public.protein_container FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "logs_select" ON public.consumption_logs;
CREATE POLICY "logs_select" ON public.consumption_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "logs_insert" ON public.consumption_logs;
CREATE POLICY "logs_insert" ON public.consumption_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ─── 5. AUTO-CONFIRM EMAILS TRIGGER ──────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auto_confirm_email ON auth.users;
CREATE TRIGGER tr_auto_confirm_email
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_email();

-- ─── 6. AUTO-PROFILE TRIGGER ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- Reload schema
NOTIFY pgrst, 'reload schema';

-- ─── 7. VERIFY ───────────────────────────────────────────────────
SELECT total_scoops FROM public.protein_container;
