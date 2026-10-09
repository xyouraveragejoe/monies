import { createClient } from '@supabase/supabase-js';

// These two values are PUBLIC by design (the publishable key only lets people do what
// Row Level Security allows). They come from environment variables, never from the code.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && key);

export const supabase = supabaseConfigured
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
