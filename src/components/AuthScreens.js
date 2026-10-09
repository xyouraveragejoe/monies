import React, { useState } from 'react';
import { supabase } from '../lib/supabase.js';

const h = React.createElement;
export const MIN_PASSWORD = 10;
// Optional: if set, the app shows a single passcode box and signs in to this one account.
export const OWNER_EMAIL = (import.meta.env.VITE_OWNER_EMAIL || '').trim();

export function friendlyAuth(e) {
  const m = String((e && e.message) || e || '');
  if (/invalid login credentials/i.test(m)) return 'That email and password do not match.';
  if (/email not confirmed/i.test(m)) return 'This email is not confirmed yet. Check your inbox for the confirmation link.';
  if (/already (been )?registered|already exists/i.test(m)) return 'An account with this email already exists. Try signing in.';
  if (/signups? (are |is )?(not allowed|disabled)/i.test(m)) return 'New sign-ups are turned off for this app.';
  if (/rate limit|too many|security purposes/i.test(m)) return 'Too many attempts. Wait a few minutes and try again.';
  if (/failed to fetch|network/i.test(m)) return 'Cannot reach the server. Check your internet connection.';
  if (/same password|different from the old/i.test(m)) return 'Choose a password you have not used on this account before.';
  return m || 'Something went wrong. Please try again.';
}

function Field({ id, label, type = 'text', value, onChange, autoComplete, hint, right }) {
  return h('div', { className: 'input-group' },
    h('label', { className: 'input-label', htmlFor: id }, label),
    h('div', { style: { position: 'relative' } },
      h('input', { id, className: 'input', type, value, autoComplete, required: true, onChange: (e) => onChange(e.target.value), style: right ? { paddingRight: 64 } : undefined }),
      right || null),
    hint ? h('div', { className: 'note' }, hint) : null);
}

function Shell({ title, subtitle, children }) {
  return h('div', { className: 'auth-wrap' },
    h('div', { className: 'auth-card' },
      h('div', { className: 'auth-brand' }, h('span', { className: 'logo-icon', 'aria-hidden': 'true' }, '🌳'), h('span', null, 'Monies')),
      h('h1', { className: 'auth-title' }, title),
      subtitle ? h('p', { className: 'auth-sub' }, subtitle) : null,
      children));
}

export function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  const go = (m) => { setMode(m); setErr(''); setInfo(''); };

  async function submit(e) {
    e.preventDefault();
    setErr(''); setInfo('');
    const em = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(em)) return setErr('Enter a valid email address.');
    if (mode === 'signup') {
      if (password.length < MIN_PASSWORD) return setErr(`Use at least ${MIN_PASSWORD} characters for your password.`);
      if (password !== confirm) return setErr('The two passwords do not match.');
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: em, password });
        if (error) throw error;
        if (!data.session) { setInfo('Account created. Check your email to confirm it, then sign in.'); setMode('signin'); }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo: window.location.origin });
        if (error) throw error;
        setInfo('If that email has an account, a reset link is on its way. Open it on this device.');
      }
    } catch (ex) {
      setErr(friendlyAuth(ex));
    } finally {
      setBusy(false);
    }
  }

  const toggle = h('button', { type: 'button', className: 'btn btn-ghost btn-sm', style: { position: 'absolute', right: 6, top: 5 }, onClick: () => setShow((s) => !s), 'aria-pressed': show }, show ? 'Hide' : 'Show');
  const titles = { signin: 'Welcome back', signup: 'Create your account', forgot: 'Reset your password' };
  const subs = { signin: 'Sign in to see your orchard.', signup: 'Your data is stored privately and only you can open it.', forgot: 'Enter your email and we will send a reset link.' };

  return h(Shell, { title: titles[mode], subtitle: subs[mode] },
    h('form', { onSubmit: submit, className: 'stack stack-md', noValidate: true },
      h(Field, { id: 'auth-email', label: 'Email', type: 'email', value: email, onChange: setEmail, autoComplete: 'email' }),
      mode !== 'forgot' ? h(Field, { id: 'auth-password', label: 'Password', type: show ? 'text' : 'password', value: password, onChange: setPassword, autoComplete: mode === 'signup' ? 'new-password' : 'current-password', hint: mode === 'signup' ? `At least ${MIN_PASSWORD} characters. A long phrase works well.` : null, right: toggle }) : null,
      mode === 'signup' ? h(Field, { id: 'auth-confirm', label: 'Confirm password', type: show ? 'text' : 'password', value: confirm, onChange: setConfirm, autoComplete: 'new-password' }) : null,
      err ? h('div', { className: 'alert alert-danger', role: 'alert' }, err) : null,
      info ? h('div', { className: 'alert alert-success', role: 'status' }, info) : null,
      h('button', { type: 'submit', className: 'btn btn-primary', disabled: busy, style: { justifyContent: 'center' } }, busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link')),
    h('div', { className: 'auth-links' },
      mode === 'signin' ? h('button', { className: 'link-btn', onClick: () => go('forgot') }, 'Forgot password?') : null,
      mode === 'signin' ? h('button', { className: 'link-btn', onClick: () => go('signup') }, 'Create an account') : h('button', { className: 'link-btn', onClick: () => go('signin') }, 'Back to sign in')));
}

/** One-box login: the passcode is the password of the single account you created in Supabase. */
export function PasscodeScreen() {
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (!code) return setErr('Enter your passcode.');
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password: code });
      if (error) throw error;
    } catch (ex) {
      const m = String((ex && ex.message) || '');
      setErr(/invalid login credentials/i.test(m) ? 'That passcode is not right.' : friendlyAuth(ex));
    } finally {
      setBusy(false);
    }
  }

  const toggle = h('button', { type: 'button', className: 'btn btn-ghost btn-sm', style: { position: 'absolute', right: 6, top: 5 }, onClick: () => setShow((s) => !s), 'aria-pressed': show }, show ? 'Hide' : 'Show');
  return h(Shell, { title: 'Welcome back', subtitle: 'Enter your passcode to open your orchard.' },
    h('form', { onSubmit: submit, className: 'stack stack-md', noValidate: true },
      h(Field, { id: 'passcode', label: 'Passcode', type: show ? 'text' : 'password', value: code, onChange: setCode, autoComplete: 'current-password', right: toggle }),
      err ? h('div', { className: 'alert alert-danger', role: 'alert' }, err) : null,
      h('button', { type: 'submit', className: 'btn btn-primary', disabled: busy, style: { justifyContent: 'center' } }, busy ? 'Please wait…' : 'Open')));
}

/** Shown after you open the reset link from your email. */
export function RecoveryScreen({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (password.length < MIN_PASSWORD) return setErr(`Use at least ${MIN_PASSWORD} characters for your password.`);
    if (password !== confirm) return setErr('The two passwords do not match.');
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      onDone();
    } catch (ex) {
      setErr(friendlyAuth(ex));
    } finally {
      setBusy(false);
    }
  }

  return h(Shell, { title: 'Choose a new password', subtitle: 'You are signed in with your reset link. Set a new password to finish.' },
    h('form', { onSubmit: submit, className: 'stack stack-md', noValidate: true },
      h(Field, { id: 'new-password', label: 'New password', type: 'password', value: password, onChange: setPassword, autoComplete: 'new-password', hint: `At least ${MIN_PASSWORD} characters.` }),
      h(Field, { id: 'new-password-confirm', label: 'Confirm new password', type: 'password', value: confirm, onChange: setConfirm, autoComplete: 'new-password' }),
      err ? h('div', { className: 'alert alert-danger', role: 'alert' }, err) : null,
      h('button', { type: 'submit', className: 'btn btn-primary', disabled: busy, style: { justifyContent: 'center' } }, busy ? 'Saving…' : 'Save new password')));
}

/** Shown when the two Supabase environment variables are missing. */
export function SetupScreen() {
  return h(Shell, { title: 'One setup step left', subtitle: 'This app needs your Supabase project details before it can store anything.' },
    h('div', { className: 'stack stack-sm' },
      h('p', null, 'Add these two environment variables, then redeploy (Vercel) or restart the dev server (local):'),
      h('pre', { className: 'auth-code' }, 'VITE_SUPABASE_URL\nVITE_SUPABASE_PUBLISHABLE_KEY'),
      h('p', { className: 'note' }, 'Vercel: Project > Settings > Environment Variables. Local: copy .env.example to .env.local. Use the publishable key only, never a secret or service_role key.')));
}
