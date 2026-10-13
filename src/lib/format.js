

/* ── helpers ── */

export const uid=()=>{
  if(globalThis.crypto&&crypto.randomUUID)return crypto.randomUUID();
  const h=[...Array(32)].map(()=>Math.floor(Math.random()*16).toString(16));
  h[12]='4';h[16]='89ab'[Math.floor(Math.random()*4)];
  return `${h.slice(0,8).join('')}-${h.slice(8,12).join('')}-${h.slice(12,16).join('')}-${h.slice(16,20).join('')}-${h.slice(20).join('')}`;
};

export const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);

/* ── currency ── */

export const CURRENCIES={USD:'$',GBP:'£',EUR:'€',SGD:'S$',MYR:'RM',AUD:'A$',CAD:'C$',INR:'₹',JPY:'¥',HKD:'HK$',IDR:'Rp',THB:'฿',PHP:'₱',NZD:'NZ$',CNY:'CN¥',KRW:'₩'};

export const COUNTRIES={US:['United States','USD'],UK:['United Kingdom','GBP'],EU:['Eurozone','EUR'],SG:['Singapore','SGD'],MY:['Malaysia','MYR'],AU:['Australia','AUD'],CA:['Canada','CAD'],IN:['India','INR'],JP:['Japan','JPY'],HK:['Hong Kong','HKD'],ID:['Indonesia','IDR'],TH:['Thailand','THB'],PH:['Philippines','PHP'],NZ:['New Zealand','NZD'],CN:['China','CNY'],KR:['South Korea','KRW'],Other:['Other (USD)','USD']};

export const FX_FALLBACK={USD:1,GBP:0.75,EUR:0.87,SGD:1.3,MYR:4.2,AUD:1.5,CAD:1.37,INR:84,JPY:150,HKD:7.8,IDR:16000,THB:35,PHP:57,NZD:1.65,CNY:7.2,KRW:1380};

export const FX={rates:{...FX_FALLBACK},live:false,asOf:null};

export const CURRENCY={code:'USD',sym:'$'};

export const setCurrency=(country)=>{const code=(COUNTRIES[country]||COUNTRIES.US)[1];CURRENCY.code=code;CURRENCY.sym=CURRENCIES[code]||'$';};

export const fxRate=(code)=>FX.rates[code]||1; // units of this currency per 1 USD

export const fxPair=(from,to,override)=>override>0?override:fxRate(to)/fxRate(from); // 1 from = ? to

export const symFor=(code)=>CURRENCIES[code]||code+' ';

export const withSym=(sym,txt)=>sym+(/[A-Za-z]$/.test(sym)?' ':'')+txt;

export const fmtIn=(n,code)=>{const v=Math.round(Math.abs(n||0));return (n<0&&v!==0?'-':'')+withSym(symFor(code),v.toLocaleString('en-US'));};

export const fmt=(n)=>fmtIn(n,CURRENCY.code);

export const fmtK=(n)=>{const a=Math.abs(n||0);const s=n<0?'-':'';const sym=CURRENCY.sym;return a>=1e9?`${s}${withSym(sym,(a/1e9).toFixed(1)+'B')}`:a>=1e6?`${s}${withSym(sym,(a/1e6).toFixed(1)+'M')}`:a>=1e3?`${s}${withSym(sym,(a/1e3).toFixed(0)+'K')}`:fmt(n)};

export const fmtKIn=(n,code)=>{const prev={...CURRENCY};CURRENCY.code=code;CURRENCY.sym=symFor(code);const r=fmtK(n);CURRENCY.code=prev.code;CURRENCY.sym=prev.sym;return r;};

export const fmtPct=(n)=>`${(n||0).toFixed(1)}%`;

export const fv=(r,n,pmt,pv)=>pv*Math.pow(1+r,n)+(r===0?pmt*n:pmt*((Math.pow(1+r,n)-1)/r));

export const pmtCalc=(r,n,pv)=>n===0?0:r===0?pv/n:(pv*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
