import { createClient } from '@supabase/supabase-js';

// These two values are PUBLIC by design (the publishable key only lets people do what
// Row Level Security allows). They come from environment variables, never from the code.
const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

// A pasted key that contains a stray character (like "…", a smart quote or a hidden space) makes the
// browser fail with a confusing "non ISO-8859-1" error, so we check for it and explain instead.
const plain = (v) => /^[\x21-\x7E]+$/.test(v);
export const configProblem = !url || !key ? '' :
  !plain(key) ? 'VITE_SUPABASE_PUBLISHABLE_KEY contains a character that is not allowed (often "…", a quote mark or a space from copy and paste). Copy the key again from Supabase and paste it with nothing else.' :
  !plain(url) ? 'VITE_SUPABASE_URL contains a character that is not allowed. Copy it again from Supabase.' : '';

export const supabaseConfigured = Boolean(url && key) && !configProblem;

export const supabase = supabaseConfigured
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
