// The data layer: everything that reads or writes your data in Supabase lives here.
// The app keeps its own shape (camelCase objects); this file converts to and from database rows.
import { COUNTRIES, uid } from './format.js';
import { D_DEBTS, D_EXPENSES, D_INCOME, D_LIFESTYLE, D_PREDICTOR, D_PROFILE, D_RETIREMENT } from './defaults.js';

export const SETTINGS_KEYS = ['profile', 'income', 'expenses', 'retirement', 'predictor', 'lifestyle'];
export const SYNCED_KEYS = [...SETTINGS_KEYS, 'assets', 'debts', 'goals', 'scenarios'];

export class DataError extends Error {
  constructor(message, code) { super(message); this.name = 'DataError'; this.code = code; }
}

/* ───────────── friendly error messages ───────────── */
export function friendlyMessage(e) {
  if (!e) return 'Something went wrong.';
  if (e instanceof DataError) return e.message;
  const msg = String(e.message || e);
  const code = e.code || '';
  if (/failed to fetch|networkerror|load failed|network request/i.test(msg)) return 'Cannot reach the server. Check your internet connection and try again.';
  if (/jwt|token|not authenticated|session/i.test(msg) || code === 'PGRST301' || code === 'PGRST303') return 'Your login has expired. Please sign in again.';
  if (code === '42501' || /row-level security|permission denied/i.test(msg)) return 'The database refused this change (permission). Try signing out and back in.';
  if (code === '23514') return 'One of the values is not allowed (too large, negative, or blank).';
  if (code === '23505') return 'That item already exists.';
  if (code === '42P01' || /relation .* does not exist|schema cache/i.test(msg)) return 'The database tables are not set up yet. Run the SQL migration in Supabase first.';
  return msg;
}

/* ───────────── validation (runs BEFORE anything is sent) ───────────── */
const MAX = 1e12;
const isNum = (v, min = 0, max = MAX, int = false) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max && (!int || Number.isInteger(v));
const isStr = (v, max) => typeof v === 'string' && v.length <= max;
const hasText = (v) => typeof v === 'string' && v.trim().length >= 1 && v.length <= 120;
const isId = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const ASSET_TYPES = ['cash', 'investment', 'retirement', 'property', 'crypto', 'other'];
const RISKS = ['low', 'medium', 'high'];

const assetErr = (a) => !a || !isId(a.id) ? 'Internal error: asset has no valid id.'
  : !hasText(a.name) ? 'Give the asset a name (1 to 120 characters).'
  : !ASSET_TYPES.includes(a.type) ? 'Pick a valid asset type.'
  : !isNum(a.value) ? 'The asset value must be a number from 0 up to one trillion.'
  : !isStr(a.institution ?? '', 120) ? 'Institution is too long (120 characters max).'
  : !isStr(a.notes ?? '', 1000) ? 'Notes are too long (1000 characters max).' : null;

const cardErr = (c) => !c || !isId(c.id) ? 'Internal error: card has no valid id.'
  : !hasText(c.name) ? 'Give the credit card a name.'
  : !isNum(c.balance) || !isNum(c.limit) || !isNum(c.minPayment) ? 'Balance, limit and minimum payment must be numbers of 0 or more.'
  : !isNum(c.rate, 0, 100) ? 'Interest rate must be between 0 and 100.' : null;

const loanErr = (l) => !l || !isId(l.id) ? 'Internal error: loan has no valid id.'
  : !hasText(l.name) ? 'Give the loan a name.'
  : !isNum(l.balance) || !isNum(l.minPayment) ? 'Balance and monthly payment must be numbers of 0 or more.'
  : !isNum(l.rate, 0, 100) ? 'Interest rate must be between 0 and 100.'
  : !isNum(l.tenureMonths, 0, 1200, true) ? 'Months remaining must be a whole number from 0 to 1200.' : null;

const mortgageErr = (m) => !m ? 'Missing mortgage.'
  : !isNum(m.balance) || !isNum(m.minPayment) || !isNum(m.propertyValue ?? 0) ? 'Mortgage amounts must be numbers of 0 or more.'
  : !isNum(m.rate, 0, 100) ? 'Mortgage rate must be between 0 and 100.'
  : !isNum(m.tenureMonths ?? 0, 0, 1200, true) ? 'Mortgage term must be a whole number of months from 0 to 1200.' : null;

const goalErr = (g) => !g || !isId(g.id) ? 'Internal error: goal has no valid id.'
  : !hasText(g.label) ? 'Give the goal a name.'
  : !isStr(g.category, 40) || !g.category ? 'Pick a category.'
  : !isNum(g.targetAge, 0, 120, true) ? 'Target age must be a whole number from 0 to 120.'
  : !isNum(g.targetAmount) || !isNum(g.currentAmount) ? 'Amounts must be numbers of 0 or more.'
  : !/^#[0-9a-fA-F]{6}$/.test(g.color || '') ? 'Pick a valid colour.'
  : !isStr(g.note ?? '', 1000) ? 'Note is too long (1000 characters max).' : null;

const scenarioErr = (s) => !s || !isId(s.id) ? 'Internal error: scenario has no valid id.'
  : !hasText(s.name) ? 'Give the scenario a name.'
  : !isStr(s.icon ?? '', 16) ? 'Icon should be a single emoji.'
  : !isNum(s.cost) || !isNum(s.downPayment) || !isNum(s.loanAmount) ? 'Cost, down payment and loan must be numbers of 0 or more.'
  : !isNum(s.loanRate, 0, 100) ? 'Loan rate must be between 0 and 100.'
  : !isNum(s.loanTenure, 0, 1200, true) ? 'Loan tenure must be a whole number of months from 0 to 1200.'
  : !isNum(s.monthlyExtra, -MAX, MAX) ? 'Extra monthly cost must be a number.'
  : !isNum(s.prepYears, 0, 100) ? 'Prep years must be between 0 and 100.'
  : !RISKS.includes(s.risk) ? 'Pick a risk level.'
  : !isStr(s.note ?? '', 1000) ? 'Note is too long (1000 characters max).' : null;

const listErr = (arr, fn) => { if (!Array.isArray(arr)) return 'Expected a list.'; for (const x of arr) { const e = fn(x); if (e) return e; } return null; };

function settingsErr(key, v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return `Invalid ${key} settings.`;
  for (const [k, x] of Object.entries(v)) {
    if (typeof x === 'number' && !Number.isFinite(x)) return `"${k}" must be a real number.`;
    if (typeof x === 'string' && x.length > 200) return `"${k}" is too long.`;
    if ((key === 'expenses' || key === 'income') && typeof x === 'number' && (x < 0 || x > MAX)) return `"${k}" must be between 0 and one trillion.`;
  }
  if (key === 'profile') {
    if (!isNum(v.age, 0, 120)) return 'Age must be between 0 and 120.';
    if (v.country && !COUNTRIES[v.country]) return 'Pick a country from the list.';
  }
  return null;
}

/** Returns an error message, or null when the value is fine to save. */
export function validateKey(key, val) {
  if (SETTINGS_KEYS.includes(key)) return settingsErr(key, val);
  if (key === 'assets') return listErr(val, assetErr);
  if (key === 'goals') return listErr(val, goalErr);
  if (key === 'scenarios') return listErr(val, scenarioErr);
  if (key === 'debts') {
    if (!val) return 'Missing debts.';
    return listErr(val.creditCards, cardErr) || listErr(val.loans, loanErr) || mortgageErr(val.mortgage);
  }
  return null;
}

/* ───────────── app object  <->  database row ───────────── */
export const MAPS = {
  assets: {
    table: 'assets',
    toRow: (a) => ({ id: a.id, name: a.name.trim(), type: a.type, value: a.value, institution: a.institution || '', notes: a.notes || '' }),
    fromRow: (r) => ({ id: r.id, name: r.name, type: r.type, value: Number(r.value), institution: r.institution, notes: r.notes }),
  },
  goals: {
    table: 'goals',
    toRow: (g) => ({ id: g.id, label: g.label.trim(), category: g.category, target_age: g.targetAge, target_amount: g.targetAmount, current_amount: g.currentAmount, done: !!g.done, color: g.color, note: g.note || '' }),
    fromRow: (r) => ({ id: r.id, label: r.label, category: r.category, targetAge: r.target_age, targetAmount: Number(r.target_amount), currentAmount: Number(r.current_amount), done: r.done, color: r.color, note: r.note }),
  },
  scenarios: {
    table: 'scenarios',
    toRow: (s) => ({ id: s.id, name: s.name.trim(), icon: s.icon || '', enabled: !!s.enabled, category: s.category || 'other', cost: s.cost, down_payment: s.downPayment, loan_amount: s.loanAmount, loan_rate: s.loanRate, loan_tenure: s.loanTenure, monthly_extra: s.monthlyExtra, prep_years: s.prepYears, risk: s.risk, note: s.note || '' }),
    fromRow: (r) => ({ id: r.id, name: r.name, icon: r.icon, enabled: r.enabled, category: r.category, cost: Number(r.cost), downPayment: Number(r.down_payment), loanAmount: Number(r.loan_amount), loanRate: Number(r.loan_rate), loanTenure: r.loan_tenure, monthlyExtra: Number(r.monthly_extra), prepYears: Number(r.prep_years), risk: r.risk, note: r.note }),
  },
  creditCards: {
    table: 'liabilities', kind: 'credit_card',
    toRow: (c) => ({ id: c.id, kind: 'credit_card', name: c.name.trim(), balance: c.balance, rate: c.rate, min_payment: c.minPayment, credit_limit: c.limit }),
    fromRow: (r) => ({ id: r.id, name: r.name, balance: Number(r.balance), rate: Number(r.rate), minPayment: Number(r.min_payment), limit: Number(r.credit_limit) }),
  },
  loans: {
    table: 'liabilities', kind: 'loan',
    toRow: (l) => ({ id: l.id, kind: 'loan', name: l.name.trim(), balance: l.balance, rate: l.rate, min_payment: l.minPayment, tenure_months: l.tenureMonths }),
    fromRow: (r) => ({ id: r.id, name: r.name, balance: Number(r.balance), rate: Number(r.rate), minPayment: Number(r.min_payment), tenureMonths: r.tenure_months }),
  },
  mortgage: {
    table: 'liabilities', kind: 'mortgage',
    toRow: (m) => ({ id: m.id, kind: 'mortgage', name: 'Mortgage', balance: m.balance, rate: m.rate, min_payment: m.minPayment, tenure_months: m.tenureMonths ?? 0, property_value: m.propertyValue ?? 0 }),
    fromRow: (r) => ({ id: r.id, balance: Number(r.balance), rate: Number(r.rate), minPayment: Number(r.min_payment), tenureMonths: r.tenure_months, propertyValue: Number(r.property_value) }),
  },
};

export const mortgageHasData = (m) => !!m && (m.balance > 0 || m.minPayment > 0 || m.propertyValue > 0);

/* ───────────── talking to Supabase ───────────── */
function check(res) {
  if (res && res.error) { const err = new DataError(friendlyMessage(res.error), res.error.code); err.cause = res.error; throw err; }
  return res;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function upsertRows(sb, table, rows) {
  if (rows.length) check(await sb.from(table).upsert(rows, { onConflict: 'id' }));
}
async function deleteIds(sb, table, ids) {
  if (ids.length) check(await sb.from(table).delete().in('id', ids));
}

async function syncList(sb, name, prev, next) {
  const m = MAPS[name];
  const before = new Map((prev || []).map((x) => [x.id, x]));
  const nextIds = new Set(next.map((x) => x.id));
  const changed = next.filter((x) => !same(before.get(x.id), x)).map(m.toRow);
  const removed = (prev || []).filter((x) => !nextIds.has(x.id)).map((x) => x.id);
  await upsertRows(sb, m.table, changed);
  await deleteIds(sb, m.table, removed);
}

async function syncMortgage(sb, prev, next) {
  if (same(prev, next)) return;
  if (!next.id) return; // nothing worth saving yet (all zero, never saved)
  await upsertRows(sb, 'liabilities', [MAPS.mortgage.toRow(next)]);
}

export async function upsertSettings(sb, obj) {
  check(await sb.from('user_settings').upsert(obj, { onConflict: 'user_id' }));
}

/** Save ONE changed key, sending only what changed. */
export async function syncKey(sb, key, prev, next) {
  if (SETTINGS_KEYS.includes(key)) return upsertSettings(sb, { [key]: next });
  if (key === 'assets' || key === 'goals' || key === 'scenarios') return syncList(sb, key, prev, next);
  if (key === 'debts') {
    await syncList(sb, 'creditCards', prev?.creditCards, next.creditCards);
    await syncList(sb, 'loans', prev?.loans, next.loans);
    await syncMortgage(sb, prev?.mortgage, next.mortgage);
    return;
  }
}

/** Make the database match this value exactly (used for retry, and for the first import). */
async function replaceList(sb, name, next) {
  const m = MAPS[name];
  let q = sb.from(m.table).select('id');
  if (m.kind) q = q.eq('kind', m.kind);
  const existing = check(await q).data || [];
  const keep = new Set(next.map((x) => x.id));
  await deleteIds(sb, m.table, existing.map((r) => r.id).filter((id) => !keep.has(id)));
  await upsertRows(sb, m.table, next.map(m.toRow));
}

export async function replaceKey(sb, key, value) {
  if (SETTINGS_KEYS.includes(key)) return upsertSettings(sb, { [key]: value });
  if (key === 'assets' || key === 'goals' || key === 'scenarios') return replaceList(sb, key, value);
  if (key === 'debts') {
    await replaceList(sb, 'creditCards', value.creditCards);
    await replaceList(sb, 'loans', value.loans);
    if (value.mortgage.id) await upsertRows(sb, 'liabilities', [MAPS.mortgage.toRow(value.mortgage)]);
  }
}

/** First-time setup: lists first, settings LAST (so "settings row exists" means setup finished). */
export async function replaceAll(sb, state) {
  for (const k of ['assets', 'goals', 'scenarios', 'debts']) await replaceKey(sb, k, state[k]);
  await upsertSettings(sb, Object.fromEntries(SETTINGS_KEYS.map((k) => [k, state[k]])));
}

export async function loadAll(sb) {
  const [settings, assets, liabs, goals, scen] = (await Promise.all([
    sb.from('user_settings').select('*').maybeSingle(),
    sb.from('assets').select('*').order('created_at').order('id'),
    sb.from('liabilities').select('*').order('created_at').order('id'),
    sb.from('goals').select('*').order('created_at').order('id'),
    sb.from('scenarios').select('*').order('created_at').order('id'),
  ])).map(check);
  const s = settings.data;
  const rows = liabs.data || [];
  const mortgageRow = rows.find((r) => r.kind === 'mortgage');
  const state = {
    profile: { ...D_PROFILE, ...(s?.profile || {}) },
    income: { ...D_INCOME, ...(s?.income || {}) },
    expenses: { ...D_EXPENSES, ...(s?.expenses || {}) },
    retirement: { ...D_RETIREMENT, ...(s?.retirement || {}) },
    predictor: { ...D_PREDICTOR, ...(s?.predictor || {}) },
    lifestyle: { ...D_LIFESTYLE, ...(s?.lifestyle || {}) },
    assets: (assets.data || []).map(MAPS.assets.fromRow),
    goals: (goals.data || []).map(MAPS.goals.fromRow),
    scenarios: (scen.data || []).map(MAPS.scenarios.fromRow),
    debts: {
      creditCards: rows.filter((r) => r.kind === 'credit_card').map(MAPS.creditCards.fromRow),
      loans: rows.filter((r) => r.kind === 'loan').map(MAPS.loans.fromRow),
      mortgage: mortgageRow ? MAPS.mortgage.fromRow(mortgageRow) : { ...D_DEBTS.mortgage },
    },
  };
  return { empty: !s, state };
}

export { uid };
