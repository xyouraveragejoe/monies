import React, { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase.js';
import { AuthScreen, RecoveryScreen, SetupScreen } from './AuthScreens.js';
import { App } from '../App.js';

const h = React.createElement;

const Splash = ({ text }) => h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--fg2)', gap: 12 } },
  h('div', { style: { width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' } }), text);

/** Decides what to show: setup help, login, password reset, or the app itself. */
export function Root() {
  const [status, setStatus] = useState(supabaseConfigured ? 'loading' : 'setup'); // loading | out | in | recovery | setup
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!supabaseConfigured) return undefined;
    let dead = false;
    supabase.auth.getSession().then(({ data }) => {
      if (dead) return;
      setSession(data.session);
      setStatus((prev) => (prev === 'recovery' ? prev : data.session ? 'in' : 'out'));
    }).catch(() => { if (!dead) setStatus('out'); });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (dead) return;
      if (event === 'PASSWORD_RECOVERY') { setSession(s); setStatus('recovery'); }
      else if (event === 'SIGNED_OUT') { setSession(null); setStatus('out'); }
      else if (s) { setSession(s); setStatus((prev) => (prev === 'recovery' ? prev : 'in')); }
    });
    return () => { dead = true; data.subscription.unsubscribe(); };
  }, []);

  if (status === 'setup') return h(SetupScreen);
  if (status === 'loading') return h(Splash, { text: 'Opening Monies…' });
  if (status === 'recovery') return h(RecoveryScreen, { onDone: () => setStatus('in') });
  if (status === 'out' || !session) return h(AuthScreen);
  return h(App, { key: session.user.id, user: session.user, onSignOut: () => supabase.auth.signOut() });
}
