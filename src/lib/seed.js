// The three ways a brand-new account can start.
import { uid } from './format.js';
import { D_ASSETS, D_DEBTS, D_EXPENSES, D_GOALS, D_INCOME, D_LIFESTYLE, D_PREDICTOR, D_PROFILE, D_RETIREMENT, D_SCENARIOS } from './defaults.js';
import { DataError, SYNCED_KEYS, mortgageHasData, validateKey } from './db.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const withIds = (arr) => arr.map((x) => ({ ...clone(x), id: uid() }));

/** Example numbers so you can see how the app works. You can edit or delete all of it. */
export function exampleState() {
  return {
    profile: clone(D_PROFILE), income: clone(D_INCOME), expenses: clone(D_EXPENSES),
    retirement: clone(D_RETIREMENT), predictor: clone(D_PREDICTOR), lifestyle: clone(D_LIFESTYLE),
    assets: withIds(D_ASSETS), goals: withIds(D_GOALS), scenarios: withIds(D_SCENARIOS),
    debts: { creditCards: withIds(D_DEBTS.creditCards), loans: withIds(D_DEBTS.loans), mortgage: clone(D_DEBTS.mortgage) },
  };
}

/** Nothing entered yet. */
export function blankState() {
  return {
    profile: clone(D_PROFILE),
    income: { ...clone(D_INCOME), salary: 0, bonus: 0, sideIncome: 0, otherIncome: 0 },
    expenses: Object.fromEntries(Object.keys(D_EXPENSES).map((k) => [k, 0])),
    retirement: clone(D_RETIREMENT), predictor: clone(D_PREDICTOR), lifestyle: clone(D_LIFESTYLE),
    assets: [], goals: [], scenarios: [],
    debts: { creditCards: [], loans: [], mortgage: { ...clone(D_DEBTS.mortgage), balance: 0, minPayment: 0, propertyValue: 0 } },
  };
}

const LEGACY_KEY = 'flp_state_v3';
export const hasLegacyData = () => { try { return !!localStorage.getItem(LEGACY_KEY); } catch { return false; } };

/** Data the old version saved in this browser. Returns { state, ai }. */
export function legacyState() {
  let old;
  try { old = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null'); } catch { old = null; }
  if (!old || typeof old !== 'object') throw new DataError('No saved data was found in this browser.');
  const base = exampleState();
  const merge = (k) => ({ ...base[k], ...(old[k] && typeof old[k] === 'object' ? old[k] : {}) });
  const list = (arr) => (Array.isArray(arr) ? arr : []).map((x) => ({ ...x, id: uid() }));
  const od = old.debts || {};
  const mortgage = { ...base.debts.mortgage, ...(od.mortgage || {}) };
  delete mortgage.id;
  if (mortgageHasData(mortgage)) mortgage.id = uid();
  const state = {
    profile: merge('profile'), income: merge('income'), expenses: merge('expenses'),
    retirement: merge('retirement'), predictor: merge('predictor'), lifestyle: merge('lifestyle'),
    assets: list(old.assets), goals: list(old.goals), scenarios: list(old.scenarios),
    debts: { creditCards: list(od.creditCards), loans: list(od.loans), mortgage },
  };
  if (!COUNTRY_OK(state.profile.country)) state.profile.country = 'US';
  for (const k of SYNCED_KEYS) {
    const err = validateKey(k, state[k]);
    if (err) throw new DataError(`Your saved browser data could not be imported (${k}): ${err}`);
  }
  return { state, ai: old.ai && typeof old.ai === 'object' ? old.ai : null };
}
const COUNTRY_OK = (c) => typeof c === 'string' && c.length > 0;

/** Keep the old browser copy as a backup under another name; the app stops reading it. */
export function archiveLegacyData() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) { localStorage.setItem(`${LEGACY_KEY}_imported`, raw); localStorage.removeItem(LEGACY_KEY); }
  } catch { /* ignore */ }
}
