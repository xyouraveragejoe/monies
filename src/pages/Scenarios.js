import React from 'react';
import {fmtK, fmt} from '../lib/format.js';
import {assessPlan, contextFrom, VERDICT_LABEL} from '../lib/risk.js';

const LIGHT={green:'var(--accent2)',amber:'var(--amber)',red:'var(--red)'};
const LIGHT_ICON={green:'●',amber:'●',red:'●'};
const RISK_COLOR={low:'var(--accent2)',medium:'var(--amber)',high:'var(--red)'};
const VERDICT_COLOR={go:'var(--accent2)',save:'var(--amber)',restructure:'var(--amber)',park:'var(--red)'};

/* ══════════════════════════════════════════
   PAGE: SCENARIOS
══════════════════════════════════════════ */

export function PageScenarios({state,upd,derived,modal,setModal}){
  const scenarios=state.scenarios;
  const ctx=contextFrom(state,derived);
  const assessed=new Map(scenarios.map(s=>[s.id,assessPlan([s],ctx)]));
  const enabled=scenarios.filter(s=>s.enabled);
  const combined=enabled.length>0?assessPlan(enabled,ctx):null;

  const toggleScenario=(id)=>upd('scenarios',scenarios.map(s=>s.id===id?{...s,enabled:!s.enabled}:s));

  return React.createElement('div',{className:'stack stack-lg'},
    React.createElement('div',{className:'grid4'},
      scenarios.map(s=>React.createElement('div',{key:s.id,
        className:`scenario-card${s.enabled?' active':''}`,
        onClick:()=>toggleScenario(s.id)
      },
        React.createElement('div',{className:'row-between',style:{marginBottom:8}},
          React.createElement('span',{style:{fontSize:20}},s.icon),
          React.createElement('button',{className:`toggle${s.enabled?' on':''}`,onClick:e=>{e.stopPropagation();toggleScenario(s.id);}})
        ),
        React.createElement('div',{style:{fontWeight:600,fontSize:13,marginBottom:4}},s.name),
        React.createElement('div',{style:{fontSize:12,color:'var(--fg3)'}},fmtK(s.cost)),
        React.createElement('div',{className:'row gap-sm',style:{marginTop:8,flexWrap:'wrap'}},
          React.createElement('span',{className:'chip',style:{background:'transparent',color:RISK_COLOR[assessed.get(s.id).risk],borderColor:RISK_COLOR[assessed.get(s.id).risk]}},assessed.get(s.id).risk,' risk'),
          React.createElement('span',{className:'chip',style:{background:'transparent',color:VERDICT_COLOR[assessed.get(s.id).verdict],borderColor:VERDICT_COLOR[assessed.get(s.id).verdict]}},VERDICT_LABEL[assessed.get(s.id).verdict])
        ),
        React.createElement('button',{className:'btn btn-ghost btn-sm',style:{marginTop:8,width:'100%'},onClick:e=>{e.stopPropagation();setModal({type:'scenario',data:s});}},'Edit')
      ))
    ),
    combined?React.createElement(Analysis,{title:enabled.length===1?enabled[0].name:`All ${enabled.length} selected, done together`,a:combined})
      :React.createElement('div',{className:'note'},'Tap one or more scenarios above to see whether you can afford them, what the risk is and what to do about it.'),
    React.createElement('button',{className:'btn btn-ghost',onClick:()=>setModal({type:'scenario',data:null})},'+ Add Scenario')
  );
}

/* The four traffic lights and the verdict for one plan */
function Analysis({title,a}){
  const body=[
    React.createElement('div',{key:'h',className:'row-between',style:{flexWrap:'wrap'}},
      React.createElement('div',{className:'sec-title'},`Analysis: ${title}`),
      React.createElement('span',{className:'chip',style:{background:'transparent',color:RISK_COLOR[a.risk],borderColor:RISK_COLOR[a.risk]}},a.risk,' risk profile')
    ),
    React.createElement('div',{key:'v',className:'alert',style:{borderLeft:`4px solid ${VERDICT_COLOR[a.verdict]}`,background:'var(--bg3)',color:'var(--fg)',flexDirection:'column',gap:4}},
      React.createElement('strong',{style:{color:VERDICT_COLOR[a.verdict]}},VERDICT_LABEL[a.verdict]),
      React.createElement('span',null,a.message)),
    a.reasons.length?React.createElement('div',{key:'r',className:'note'},`Risk comes from: ${a.reasons.join(', ')}.`):null,
    React.createElement('div',{key:'c',className:'stack stack-sm'},a.checks.map(c=>
      React.createElement('div',{key:c.id,className:'row',style:{gap:10,alignItems:'flex-start'}},
        React.createElement('span',{'aria-label':c.level,style:{color:LIGHT[c.level],fontSize:18,lineHeight:'20px'}},LIGHT_ICON[c.level]),
        React.createElement('div',{style:{minWidth:0}},
          React.createElement('div',{style:{fontWeight:600,fontSize:13}},c.title,React.createElement('span',{style:{color:LIGHT[c.level],fontWeight:600,marginLeft:8,fontSize:11,textTransform:'uppercase'}},c.level)),
          React.createElement('div',{style:{fontSize:12,color:'var(--fg2)'}},c.detail))
      ))),
    React.createElement('div',{key:'f',className:'note'},`Upfront cash needed: ${fmt(a.upfront)}.${a.launchReserve>0?` Start-up reserve (${a.launchMonths} months of lower income): ${fmt(a.launchReserve)}.`:''} New monthly cost: ${fmt(a.newMonthly)}. Monthly surplus once running: ${fmt(a.surplusAfter)}. Estimates use your saved income, spending, savings and debts.`)
  ];
  return React.createElement('div',{className:'card stack stack-md'},body);
}
