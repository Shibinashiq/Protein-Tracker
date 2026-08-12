/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Types matching the Supabase tables ────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
}

export interface ProteinContainer {
  id: number;
  total_scoops: number;
  updated_at: string;
}

export interface ConsumptionLog {
  id: number;
  user_id: string;
  date: string;
  scoops: number;
  notes: string | null;
  created_at: string;
  // joined
  username?: string;
  display_name?: string;
}
