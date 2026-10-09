import React, { useState } from 'react';

const h = React.createElement;

/** First sign-in: choose how this account starts. Nothing is saved until you pick one. */
export function Welcome({ email, hasLegacy, onChoose }) {
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  async function pick(kind) {
    setBusy(kind); setErr('');
    try { await onChoose(kind); } catch (e) { setErr(e.message || 'Could not save. Please try again.'); setBusy(''); }
  }

  const option = (kind, title, text, primary) => h('button', {
    key: kind, type: 'button', disabled: !!busy, onClick: () => pick(kind),
    className: 'welcome-option' + (primary ? ' primary' : ''),
  }, h('strong', null, busy === kind ? 'Saving…' : title), h('span', null, text));

  return h('div', { className: 'auth-wrap' },
    h('div', { className: 'auth-card', style: { maxWidth: 520 } },
      h('div', { className: 'auth-brand' }, h('span', { className: 'logo-icon', 'aria-hidden': 'true' }, '🌳'), h('span', null, 'Monies')),
      h('h1', { className: 'auth-title' }, 'Let us plant your orchard'),
      h('p', { className: 'auth-sub' }, `Signed in as ${email}. How would you like to start?`),
      h('div', { className: 'stack stack-sm' },
        hasLegacy ? option('legacy', 'Bring my data from this browser', 'Copies the numbers you entered before logins existed into your account.', true) : null,
        option('example', 'Start with example numbers', 'See how everything works, then replace the examples with your own.', !hasLegacy),
        option('blank', 'Start blank', 'Begin with empty lists and zeros.', false)),
      err ? h('div', { className: 'alert alert-danger', role: 'alert', style: { marginTop: 12 } }, err) : null));
}
