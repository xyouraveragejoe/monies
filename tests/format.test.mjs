// Run with:  node tests/format.test.mjs
globalThis.localStorage = { getItem() { return null; }, setItem() {} };
const { fmt, fmtK, fmtIn, fmtKIn } = await import('../src/lib/format.js');
let fails = 0;
const ok = (c, m) => { if (c) console.log('ok  ', m); else { console.log('FAIL', m); fails++; process.exitCode = 1; } };
ok(fmt(1234567) === '$1,234,567', 'fmt uses comma thousands: ' + fmt(1234567));
ok(fmtK(400000) === '$400,000', 'fmtK no longer shortens to K: ' + fmtK(400000));
ok(fmtK(2500000) === '$2,500,000', 'fmtK no longer shortens to M: ' + fmtK(2500000));
ok(fmtK(999) === '$999' && fmtK(0) === '$0', 'small numbers are unchanged');
ok(fmtK(-12500) === '-$12,500', 'negatives keep the minus first: ' + fmtK(-12500));
ok(fmtIn(1234567, 'EUR').includes('1,234,567'), 'other currencies use commas too: ' + fmtIn(1234567, 'EUR'));
ok(!/[KMB]\b/.test(fmtKIn(5400000000, 'USD').replace(/USD/, '')), 'billions are written in full: ' + fmtKIn(5400000000, 'USD'));
// Same formula the number boxes use to show a value while you are not typing in them
const shown = (raw, dec = 2) => { const n = parseFloat(String(raw).replace(/,/g, '')); return Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: dec }) : raw; };
ok(shown('1234567') === '1,234,567' && shown('1234.5') === '1,234.5' && shown('42') === '42' && shown('0') === '0', 'number box display adds commas');
ok(parseFloat('1,234,567'.replace(/,/g, '')) === 1234567, 'pasted comma figures are read correctly');
console.log(fails ? `\n${fails} FAILED` : '\nALL FORMAT CHECKS PASSED');
