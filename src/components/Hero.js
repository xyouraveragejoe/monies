import React from 'react';
import {NumInput} from './NumInput.js';
import {CURRENCIES, CURRENCY, FX, clamp, fmt, fmtIn, fmtK, fmtPct, fxPair, fxRate} from '../lib/format.js';

/* ══════════════════════════════════════════
   HERO: the tree that grows with your savings
══════════════════════════════════════════ */

export function TreeGraphic({progress,fruit}){
  const sc=0.55+0.45*clamp(progress,0,1);
  const blobs=[[120,92,62],[78,112,44],[162,112,44],[100,64,40],[142,64,40],[120,40,32]];
  let seed=11;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
  const fr=Array.from({length:Math.min(fruit,14)},()=>{const a=rnd()*6.28,d=rnd()*52*sc;return{x:120+Math.cos(a)*d*1.1,y:(150-(150-92)*sc)+Math.sin(a)*d*0.8}});
  return React.createElement('svg',{viewBox:'0 0 240 260',width:'100%',style:{maxWidth:260},role:'img','aria-label':`A tree grown to ${Math.round(clamp(progress,0,1)*100)} percent of its next stage`},
    React.createElement('ellipse',{cx:120,cy:248,rx:86,ry:9,fill:'var(--accent)',opacity:0.2}),
    React.createElement('path',{d:'M112 248c2-40 0-70-6-100h28c-6 30-8 60-6 100z',fill:'var(--bark)'}),
    blobs.map((c,i)=>React.createElement('circle',{key:i,cx:120+(c[0]-120)*sc,cy:150-(150-c[1])*sc,r:c[2]*sc,fill:i%2?'var(--accent)':'var(--accent2)',opacity:i%2?0.85:1})),
    fr.map((f,i)=>React.createElement('circle',{key:'f'+i,cx:f.x,cy:f.y,r:6,fill:'var(--honey)',stroke:'var(--bg3)',strokeWidth:2}))
  );
}

export function HeroCard({state,derived,level,levelLabel,nwUSD,upd}){
  const{netWorth,monthlySurplus,savingsRate}=derived;
  const p=state.profile,cur=CURRENCY.code;
  const thr=[10000,50000,100000,500000,1000000];
  const nextUSD=thr[level-1];
  const progress=clamp(nwUSD/nextUSD,0,1);
  const nextLocal=nextUSD*fxRate(cur);
  const left=Math.max(0,nextLocal-netWorth);
  const months=monthlySurplus>0?Math.ceil(left/monthlySurplus):null;
  const doneGoals=state.goals.filter(g=>g.done).length;
  const second=p.second&&p.second!==cur?p.second:'';
  const rate=second?fxPair(cur,second,p.fxOverride):0;
  const setP=(patch)=>upd('profile',{...p,...patch});
  const msg=nwUSD>=1000000?'Your grove is fully grown. Keep tending it.':
    months===null?`Your tree needs more water: spending is above income. Free up some monthly surplus to start growing toward ${fmtK(nextLocal)}.`:
    `Stage ${level} of 5: ${levelLabel}. You are ${Math.round(progress*100)}% of the way to ${fmtK(nextLocal)}. At ${fmtK(monthlySurplus)} a month, that is about ${months} month${months===1?'':'s'}.`;
  const stat=(l,v)=>React.createElement('div',{key:l,style:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',minWidth:0}},
    React.createElement('div',{style:{fontSize:12,color:'var(--fg2)'}},l),
    React.createElement('div',{style:{fontFamily:'var(--font-display)',fontSize:18,fontWeight:700}},v));
  return React.createElement('section',{className:'hero-card','aria-label':'Net worth overview'},
    React.createElement('div',{style:{minWidth:0}},
      React.createElement('div',{className:'kpi-label'},'What your orchard is worth today'),
      React.createElement('div',{className:'hero-big',style:{color:netWorth>=0?'var(--accent)':'var(--red)'}},fmt(netWorth)),
      React.createElement('p',{style:{color:'var(--fg2)',maxWidth:'52ch'}},msg),
      React.createElement('div',{style:{display:'flex',flexWrap:'wrap',gap:10,marginTop:16}},
        stat('Saved each month',fmtK(monthlySurplus)),
        stat('Share of income',fmtPct(savingsRate)),
        stat('Goals completed',`${doneGoals} of ${state.goals.length}`)
      ),
      React.createElement('div',{style:{marginTop:18,display:'flex',flexDirection:'column',gap:8}},
        React.createElement('label',{className:'row gap-sm',htmlFor:'second-currency',style:{fontSize:13,color:'var(--fg2)',flexWrap:'wrap'}},
          'See it in another currency',
          React.createElement('select',{id:'second-currency',className:'input',style:{width:'auto'},value:p.second||'',onChange:e=>setP({second:e.target.value,fxOverride:0})},
            React.createElement('option',{value:''},'None'),
            Object.keys(CURRENCIES).filter(c=>c!==cur).map(c=>React.createElement('option',{key:c,value:c},c))
          )
        ),
        second&&React.createElement('div',{style:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',display:'flex',flexDirection:'column',gap:6}},
          React.createElement('div',null,'In ',second,': ',React.createElement('strong',{style:{fontFamily:'var(--font-display)',fontSize:20}},fmtIn(netWorth*rate,second))),
          React.createElement('div',{style:{fontSize:12,color:'var(--fg2)'}},
            `Monthly surplus ${fmtIn(monthlySurplus*rate,second)} · Assets ${fmtIn(derived.totalAssets*rate,second)} · Debt ${fmtIn(derived.totalDebt*rate,second)}`),
          React.createElement('div',{className:'row gap-sm',style:{flexWrap:'wrap',fontSize:12,color:'var(--fg2)'}},
            `1 ${cur} =`,
            React.createElement(NumInput,{value:+rate.toPrecision(5),min:0.000001,max:1e9,step:0.000001,onChange:v=>setP({fxOverride:v}),style:{width:120}}),
            second,
            p.fxOverride>0?React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:()=>setP({fxOverride:0})},'Use market rate'):null
          ),
          React.createElement('div',{style:{fontSize:11,color:'var(--fg3)'}},
            p.fxOverride>0?'Using the rate you entered.':FX.live?`Market rate, updated ${FX.asOf||'recently'}.`:'Approximate rate used because live rates could not be loaded. Type your own to be exact.')
        )
      )
    ),
    React.createElement('div',{className:'hero-tree'},React.createElement(TreeGraphic,{progress,fruit:doneGoals}),
      React.createElement('div',{style:{fontSize:12,color:'var(--fg2)',textAlign:'center'}},'Each gold fruit is a goal you completed.'))
  );
}
