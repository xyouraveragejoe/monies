import { pmtCalc, fv, fmt } from './format.js';

/* ──────────────────────────────────────────────────────────────
   Scenario risk engine. Pure maths, no screens, so it can be tested on its own.
   Change the numbers below to change how strict the checks are.
   ────────────────────────────────────────────────────────────── */
export const RULES = {
  bufferMonths: 6,          // months of spending you want left in cash after paying upfront
  bufferAmberMonths: 3,     // below this the cash check is red
  keepFreeShare: 0.10,      // share of income that should still be free each month after the plan
  debtShareAmber: 0.30,     // total debt repayments / income: amber above this
  debtShareRed: 0.40,       // ...red above this
  retireImpactAmber: 0.10,  // share of your projected retirement pot the plan costs: amber above this
  retireImpactRed: 0.25,    // ...red above this
  maxSaveMonths: 180,       // if saving up would take longer than this, the verdict is "park it"
};

const LEVEL = { green: 0, amber: 1, red: 2 };
const worst = (a, b) => (LEVEL[a] >= LEVEL[b] ? a : b);

/** Monthly loan repayment for one scenario. */
export const loanPayment = (s) =>
  s.loanTenure > 0 && s.loanAmount > 0 ? pmtCalc((s.loanRate / 100) / 12, s.loanTenure, s.loanAmount) : 0;

/** Cash you must have ready on day one. */
export const upfrontCash = (s) => Math.max(0, (s.cost || 0) - (s.loanAmount || 0));

/**
 * Judge one plan (a list of scenarios done together).
 * ctx = { income, expenses, surplus, liquid, existingDebtPayments, age, retireAge, returnRate, investable, monthlyContrib }
 */
export function assessPlan(items, ctx, rules = RULES) {
  const upfront = items.reduce((a, s) => a + upfrontCash(s), 0);
  const newMonthly = items.reduce((a, s) => a + loanPayment(s) + (s.monthlyExtra || 0), 0);
  const loanMonthly = items.reduce((a, s) => a + loanPayment(s), 0);
  const income = Math.max(ctx.income, 0);
  const spendAfter = ctx.expenses + newMonthly;
  const checks = [];

  // 1. Cash cover
  const liquidAfter = ctx.liquid - upfront;
  const monthsCover = spendAfter > 0 ? liquidAfter / spendAfter : (liquidAfter >= 0 ? Infinity : -Infinity);
  const cashLevel = liquidAfter < 0 ? 'red' : monthsCover >= rules.bufferMonths ? 'green' : monthsCover >= rules.bufferAmberMonths ? 'amber' : 'red';
  checks.push({
    id: 'cash', title: 'Cash cover', level: cashLevel, value: monthsCover, upfront, liquidAfter,
    detail: liquidAfter < 0
      ? 'You do not have enough savings to pay the upfront amount.'
      : `After paying the upfront amount, your savings would cover ${Number.isFinite(monthsCover) ? monthsCover.toFixed(1) : 'many'} months of spending (aim for ${rules.bufferMonths}).`,
  });

  // 2. Monthly squeeze
  const surplusAfter = ctx.surplus - newMonthly;
  const freeShare = income > 0 ? surplusAfter / income : (surplusAfter >= 0 ? 1 : -1);
  const squeezeLevel = surplusAfter < 0 ? 'red' : freeShare >= rules.keepFreeShare ? 'green' : 'amber';
  checks.push({
    id: 'squeeze', title: 'Monthly squeeze', level: squeezeLevel, value: freeShare, surplusAfter, newMonthly,
    detail: surplusAfter < 0
      ? 'Your monthly spending would be higher than your income.'
      : `After the new monthly cost you would still have ${(freeShare * 100).toFixed(0)}% of your income free (aim for ${(rules.keepFreeShare * 100).toFixed(0)}% or more).`,
  });

  // 3. Debt load
  const debtShare = income > 0 ? (ctx.existingDebtPayments + loanMonthly) / income : (loanMonthly > 0 ? 1 : 0);
  const debtLevel = debtShare >= rules.debtShareRed ? 'red' : debtShare >= rules.debtShareAmber ? 'amber' : 'green';
  checks.push({
    id: 'debt', title: 'Debt load', level: debtLevel, value: debtShare,
    detail: `Debt repayments would take ${(debtShare * 100).toFixed(0)}% of your income (banks start to worry above ${(rules.debtShareRed * 100).toFixed(0)}%).`,
  });

  // 4. Retirement impact (an estimate: the upfront money and the new monthly cost no longer get invested)
  const years = Math.max(0, ctx.retireAge - ctx.age);
  const r = (ctx.returnRate || 0) / 100 / 12;
  const n = years * 12;
  const pot = fv(r, n, ctx.monthlyContrib || 0, ctx.investable || 0);
  const costYears = Math.min(years, Math.max(...items.map((s) => (s.loanTenure > 0 ? s.loanTenure / 12 : years)), 0));
  const lost = upfront * Math.pow(1 + r, n) + fv(r, Math.min(n, Math.round(costYears * 12)), Math.max(newMonthly, 0), 0) * Math.pow(1 + r, Math.max(0, n - Math.round(costYears * 12)));
  const impact = pot > 0 ? lost / pot : (lost > 0 ? 1 : 0);
  const retireLevel = impact >= rules.retireImpactRed ? 'red' : impact >= rules.retireImpactAmber ? 'amber' : 'green';
  checks.push({
    id: 'retire', title: 'Retirement impact', level: retireLevel, value: impact, lost, pot,
    detail: years === 0
      ? 'You are at your target retirement age, so this is measured against today\'s savings.'
      : `If this money were invested instead, it would grow to about ${(impact * 100).toFixed(0)}% of your projected retirement pot.`,
  });

  const overall = checks.reduce((a, c) => worst(a, c.level), 'green');
  const risk = overall === 'red' ? 'high' : overall === 'amber' ? 'medium' : 'low';
  const reasons = checks.filter((c) => c.level === 'red' || c.level === 'amber').sort((a, b) => LEVEL[b.level] - LEVEL[a.level]).map((c) => c.title);

  // Verdict
  const monthlyBlocked = squeezeLevel === 'red' || debtLevel === 'red';
  const maxMonthly = Math.min(
    ctx.surplus - rules.keepFreeShare * income,
    rules.debtShareRed * income - ctx.existingDebtPayments + (newMonthly - loanMonthly) // extra costs are not debt repayments
  );
  const cashNeeded = upfront + rules.bufferMonths * spendAfter;
  const cashGap = Math.max(0, cashNeeded - ctx.liquid);
  const saveMonths = cashGap === 0 ? 0 : ctx.surplus > 0 ? Math.ceil(cashGap / ctx.surplus) : Infinity;
  let verdict, message;
  if (monthlyBlocked && maxMonthly <= 0) {
    verdict = 'park';
    message = 'Your income cannot carry a new monthly commitment right now. Park this one and first free up monthly cash (cut spending or pay down debt).';
  } else if (monthlyBlocked) {
    verdict = 'restructure';
    message = `The monthly cost is too high for you. It is ${fmt(newMonthly)} a month and your limit is about ${fmt(Math.max(0, maxMonthly))}. Lower it by ${fmt(Math.max(1, newMonthly - maxMonthly))}: a bigger down payment, a longer loan, or a cheaper version.`;
  } else if (cashLevel !== 'green') {
    if (!Number.isFinite(saveMonths) || saveMonths > rules.maxSaveMonths) {
      verdict = 'park';
      message = 'Saving up for this would take too long at your current monthly surplus. Park it, or find a cheaper version.';
    } else {
      verdict = 'save';
      message = `Save ${fmt(cashGap)} more. At today's monthly surplus that takes about ${saveMonths} month${saveMonths === 1 ? '' : 's'}.`;
    }
  } else if (retireLevel === 'red') {
    verdict = 'restructure';
    message = 'You can afford it, but it would cost a large part of your future retirement pot. Consider a cheaper version or accept a later retirement age.';
  } else {
    verdict = 'go';
    message = retireLevel === 'amber' || overall === 'amber'
      ? 'You can do this now, with a few things to watch (see the amber lines).'
      : 'You can do this now. All four checks pass.';
  }

  return { checks, overall, risk, reasons, verdict, message, upfront, newMonthly, loanMonthly, surplusAfter, cashGap, saveMonths: Number.isFinite(saveMonths) ? saveMonths : null, maxMonthly };
}

/** Build the numbers the engine needs from the app's saved state. */
export function contextFrom(state, derived) {
  const d = state.debts;
  const existingDebtPayments =
    d.creditCards.reduce((a, c) => a + (c.minPayment || 0), 0) +
    d.loans.reduce((a, c) => a + (c.minPayment || 0), 0) +
    (d.mortgage.minPayment || 0);
  const liquid = state.assets.filter((a) => a.type === 'cash' || a.type === 'investment').reduce((a, b) => a + b.value, 0);
  return {
    income: derived.totalIncome,
    expenses: derived.totalExpenses,
    surplus: derived.monthlySurplus,
    liquid,
    existingDebtPayments,
    age: state.profile.age,
    retireAge: state.retirement.desiredAge,
    returnRate: state.retirement.returnRate,
    investable: derived.investAssets,
    monthlyContrib: state.retirement.monthlyContrib,
  };
}

export const VERDICT_LABEL = { go: 'Go now', save: 'Save first', restructure: 'Restructure', park: 'Park it' };
