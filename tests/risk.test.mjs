// Run with:  node tests/risk.test.mjs
import { assessPlan, loanPayment, upfrontCash, RULES } from '../src/lib/risk.js';
let fails = 0;
const ok = (c, m) => { if (c) console.log('ok  ', m); else { console.log('FAIL', m); fails++; process.exitCode = 1; } };

const ctx = { income: 5000, expenses: 3000, surplus: 2000, liquid: 60000, existingDebtPayments: 300, age: 30, retireAge: 60, returnRate: 7, investable: 40000, monthlyContrib: 500 };
const base = { cost: 0, downPayment: 0, loanAmount: 0, loanRate: 0, loanTenure: 0, monthlyExtra: 0, prepYears: 1 };

// Small purchase paid from savings: everything fine
let a = assessPlan([{ ...base, cost: 5000 }], ctx);
ok(a.verdict === 'go' && a.risk === 'low', 'small cash purchase -> go / low risk');

// Cannot pay the upfront amount at all
a = assessPlan([{ ...base, cost: 90000 }], ctx);
ok(a.checks.find((c) => c.id === 'cash').level === 'red' && a.risk === 'high', 'cost above savings -> cash red, high risk');
ok(a.verdict === 'save' && a.saveMonths > 0, 'cash is the only problem -> save first with a month count');

// Gap and months: need upfront + 6 months spending after - liquid
const gap = 90000 + 6 * 3000 - 60000;
ok(Math.abs(a.cashGap - gap) < 1e-6 && a.saveMonths === Math.ceil(gap / 2000), 'savings gap and months are computed correctly');

// Loan payment matches the standard formula (100k, 5%, 20y = 659.96)
const lp = loanPayment({ ...base, loanAmount: 100000, loanRate: 5, loanTenure: 240 });
ok(Math.abs(lp - 659.96) < 0.01, 'loan payment 100k @5% 20y = 659.96');
ok(upfrontCash({ cost: 400000, loanAmount: 320000 }) === 80000, 'upfront = cost minus loan');

// Monthly cost too big -> restructure, with a limit smaller than the cost
const big = { ...base, cost: 500000, loanAmount: 450000, loanRate: 6, loanTenure: 240, monthlyExtra: 500 };
a = assessPlan([big], { ...ctx, liquid: 200000 });
ok(a.verdict === 'restructure' && a.risk === 'high', 'monthly cost too high -> restructure / high');
ok(a.maxMonthly < a.newMonthly, 'monthly limit is below the plan monthly cost');

// No room at all -> park
a = assessPlan([big], { ...ctx, surplus: 100, existingDebtPayments: 2100, liquid: 200000 });
ok(a.verdict === 'park', 'no room for any new monthly cost -> park it');

// Saving would take forever -> park
a = assessPlan([{ ...base, cost: 900000 }], { ...ctx, surplus: 100 });
ok(a.verdict === 'park', 'savings gap needs more than 15 years -> park it');

// Zero surplus never divides by zero
a = assessPlan([{ ...base, cost: 70000 }], { ...ctx, surplus: 0 });
ok(a.verdict === 'park' && a.saveMonths === null, 'zero surplus -> park, no crash');

// Combining two plans costs more than either alone
const h = { ...base, cost: 400000, loanAmount: 320000, loanRate: 4.5, loanTenure: 360, monthlyExtra: 200 };
const c = { ...base, cost: 30000, monthlyExtra: 100 };
const both = assessPlan([h, c], { ...ctx, liquid: 150000 });
ok(both.upfront === 80000 + 30000 && Math.abs(both.newMonthly - (loanPayment(h) + 300)) < 1e-6, 'combined plan adds upfront cash and monthly costs');

// Zero income does not crash
a = assessPlan([big], { ...ctx, income: 0, surplus: -500 });
ok(['park', 'restructure'].includes(a.verdict), 'zero income handled');
// Retiring now
a = assessPlan([{ ...base, cost: 1000 }], { ...ctx, age: 60 });
ok(a.checks.find((c) => c.id === 'retire').level !== undefined, 'age = retirement age handled');
// ---- Business without a loan: lose salary for 12 months, then earn part of it back ----
const biz = { ...base, cost: 50000, monthlyExtra: 800, incomeChange: -5000, incomeChangeMonths: 12, incomeAfter: -1500 };
a = assessPlan([biz], { ...ctx, liquid: 200000, surplus: 2000 });
// launch gap per month = 5000 + 800 - 2000 = 3800, for 12 months = 45600
ok(Math.abs(a.launchReserve - 45600) < 1e-6 && a.launchMonths === 12, 'business: start-up months need savings (3800 x 12)');
ok(a.checks.find((c) => c.id === 'cash').liquidAfter === 200000 - 50000 - 45600, 'business: savings left after upfront and start-up months');
// steady state: surplus 2000 - 800 - 1500 = -300 -> squeeze red
ok(a.checks.find((c) => c.id === 'squeeze').level === 'red', 'business that never covers its own costs -> squeeze red');
// Rich enough and the business pays back: all good
const goodBiz = { ...biz, incomeAfter: 800 };
a = assessPlan([goodBiz], { ...ctx, liquid: 400000 });
ok(a.checks.find((c) => c.id === 'squeeze').level !== 'red' && a.checks.find((c) => c.id === 'cash').level === 'green', 'business with enough savings and positive income afterwards passes squeeze and cash');
// Not enough savings for the start-up months -> save first, including start-up months in the gap
a = assessPlan([goodBiz], { ...ctx, liquid: 60000 });
ok(a.verdict === 'save' && a.cashGap > 45600 - 10000, 'business: savings gap includes the start-up months');
// A pay rise (no start-up period) improves the monthly check
const raise = { ...base, cost: 0, incomeAfter: 500 };
a = assessPlan([raise], ctx);
ok(a.surplusAfter === ctx.surplus + 500, 'income after with no start-up period applies straight away');
// Old scenarios without the new fields still work
a = assessPlan([{ ...base, cost: 5000 }], ctx);
ok(a.launchReserve === 0, 'scenarios without income fields behave as before');
console.log(fails ? `\n${fails} FAILED` : '\nALL RISK CHECKS PASSED');
