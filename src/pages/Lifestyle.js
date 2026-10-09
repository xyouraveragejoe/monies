import React from 'react';
import {CURRENCY, fmtK, fxRate} from '../lib/format.js';

/* ══════════════════════════════════════════
   PAGE: LIFESTYLE
══════════════════════════════════════════ */

export function PageLifestyle({state,upd,derived}){
  const ls=state.lifestyle;
  const{totalIncome,netWorth}=derived;
  const templates={
    nomad:{label:'Digital Nomad',icon:'🌍',reqIncome:4000,reqNW:50000,desc:'Work remotely, travel the world, minimal possessions'},
    balanced:{label:'Balanced Life',icon:'⚖️',reqIncome:5000,reqNW:100000,desc:'Stable career, family, occasional travel'},
    traveler:{label:'Frequent Traveler',icon:'✈️',reqIncome:7000,reqNW:150000,desc:'Business class, 6+ trips per year, hotel points'},
    luxury:{label:'Luxury',icon:'💎',reqIncome:15000,reqNW:500000,desc:'Premium cars, fine dining, designer brands'},
    fire:{label:'FIRE',icon:'🔥',reqIncome:3000,reqNW:1000000,desc:'Financially Independent, Retired Early at 45'},
    family:{label:'Big Family',icon:'👨‍👩‍👧‍👦',reqIncome:8000,reqNW:200000,desc:'3+ kids, private school, big home, family vacations'},
  };
  const sc=fxRate(CURRENCY.code);
  const t0=templates[ls.template]||templates.balanced;
  const t={...t0,reqIncome:t0.reqIncome*sc,reqNW:t0.reqNW*sc};
  const extras={travelOften:1000,luxuryCar:800,bigFamily:1500,privateSchool:2000,businessClass:500,beachHouse:2000,entrepreneurLife:1000,digitalNomad:500};
  const extraTotal=Object.entries(extras).reduce((a,[k,v])=>ls[k]?a+v*sc:a,0);
  const totalRequired=t.reqIncome+extraTotal;
  const shortfall=Math.max(0,totalRequired-totalIncome);
  const nwNeeded=t.reqNW;
  const nwShortfall=Math.max(0,nwNeeded-netWorth);
  const fireNum=totalRequired*12/0.04;
  const yearsToNW=netWorth<nwNeeded&&derived.monthlySurplus>0?
    Math.ceil(Math.log(nwNeeded/Math.max(netWorth,1))/Math.log(1+(state.retirement.returnRate/100)/12)/12):0;

  return React.createElement('div',{className:'stack stack-lg'},
    /* Templates */
    React.createElement('div',null,
      React.createElement('div',{className:'sec-title',style:{marginBottom:14}},'Choose Your Lifestyle'),
      React.createElement('div',{className:'grid3'},
        Object.entries(templates).map(([k,v])=>React.createElement('div',{key:k,
          className:`scenario-card${ls.template===k?' active':''}`,
          onClick:()=>upd('lifestyle',{...ls,template:k})
        },
          React.createElement('div',{style:{fontSize:24,marginBottom:8}},v.icon),
          React.createElement('div',{style:{fontWeight:600,fontSize:13,marginBottom:4}},v.label),
          React.createElement('div',{style:{fontSize:11,color:'var(--fg3)',marginBottom:8}},v.desc),
          React.createElement('div',{style:{fontSize:12,color:'var(--accent2)'}},`From ${fmtK(v.reqIncome*sc)}/mo`)
        ))
      )
    ),
    /* Add-ons */
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'sec-title',style:{marginBottom:14}},'Add-On Costs'),
      React.createElement('div',{className:'grid4'},
        Object.entries(extras).map(([k,v])=>React.createElement('div',{key:k,
          className:`scenario-card${ls[k]?' active':''}`,
          style:{cursor:'pointer'},
          onClick:()=>upd('lifestyle',{...ls,[k]:!ls[k]})
        },
          React.createElement('div',{style:{fontWeight:500,fontSize:12,marginBottom:4}},{travelOften:'✈ Travel Often',luxuryCar:'🚗 Luxury Car',bigFamily:'👨‍👩‍👧‍👦 Big Family',privateSchool:'🎓 Private School',businessClass:'🛫 Business Class',beachHouse:'🏖 Beach House',entrepreneurLife:'🚀 Entrepreneur',digitalNomad:'💻 Digital Nomad'}[k]),
          React.createElement('div',{style:{fontSize:11,color:'var(--fg3)'}},`+${fmtK(v*sc)}/mo`)
        ))
      )
    ),
    /* Results */
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'sec-title',style:{marginBottom:14}},'💡 What You Need'),
      React.createElement('div',{className:'grid4'},
        [['Required Income',fmtK(totalRequired)+'/mo','fg'],['Income Shortfall',shortfall>0?fmtK(shortfall):'+'+fmtK(totalIncome-totalRequired),shortfall>0?'red':'accent2'],['Required Net Worth',fmtK(nwNeeded),'fg'],['FIRE Number',fmtK(fireNum),'accent']].map(([l,v,c])=>
          React.createElement('div',{key:l,className:'kpi'},
            React.createElement('div',{className:'kpi-label'},l),
            React.createElement('div',{className:'kpi-value',style:{fontSize:20,color:`var(--${c})`}},v)
          )
        )
      ),
      yearsToNW>0&&React.createElement('div',{className:'alert alert-info',style:{marginTop:14}},`📅 Estimated ${yearsToNW} years to reach required net worth of ${fmtK(nwNeeded)} at current trajectory.`)
    )
  );
}
