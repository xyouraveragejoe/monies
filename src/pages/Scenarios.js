import React,{useState} from 'react';
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
  const [openId,setOpenId]=useState(null);
  const ctx=contextFrom(state,derived);
  const assessed=new Map(scenarios.map(s=>[s.id,assessPlan([s],ctx)]));
  const{monthlySurplus,totalAssets}=derived;
  const age=state.profile.age;
  const enabled=scenarios.filter(s=>s.enabled);
  const combined=enabled.length>0?assessPlan(enabled,ctx):null;
  const totalCost=enabled.reduce((a,s)=>a+s.cost,0);
  const totalMonthly=combined?combined.newMonthly:0;
  const maxPrepYears=enabled.length>0?Math.max(...enabled.map(s=>s.prepYears)):0;
  const netSurplusAfter=monthlySurplus-totalMonthly;

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
        React.createElement('button',{className:'btn btn-ghost btn-sm',style:{marginTop:8,width:'100%'},onClick:e=>{e.stopPropagation();setOpenId(openId===s.id?null:s.id);},'aria-expanded':openId===s.id},openId===s.id?'Hide analysis':'Why?'),
        React.createElement('button',{className:'btn btn-ghost btn-sm',style:{marginTop:8,width:'100%'},onClick:e=>{e.stopPropagation();setModal({type:'scenario',data:s});}},'Edit')
      ))
    ),
    openId&&scenarios.find(x=>x.id===openId)&&React.createElement(Analysis,{title:scenarios.find(x=>x.id===openId).name,a:assessed.get(openId)}),
    enabled.length>0&&React.createElement('div',{className:'card'},
      React.createElement('div',{className:'sec-title',style:{marginBottom:14}},'📊 Combined Impact'),
      React.createElement('div',{className:'grid4'},
        [['Total Cost',fmtK(totalCost),'fg'],['Extra Monthly',fmtK(totalMonthly),totalMonthly<monthlySurplus?'amber':'red'],['Surplus After',fmtK(netSurplusAfter),netSurplusAfter>0?'accent2':'red'],['Prep Time',`${maxPrepYears} yrs`,'accent']].map(([l,v,c])=>
          React.createElement('div',{key:l,className:'kpi'},
            React.createElement('div',{className:'kpi-label'},l),
            React.createElement('div',{className:'kpi-value',style:{fontSize:22,color:`var(--${c})`}},v)
          )
        )
      ),
      React.createElement(Analysis,{title:'All selected together',a:combined,embedded:true})
    ),
    React.createElement('button',{className:'btn btn-ghost',onClick:()=>setModal({type:'scenario',data:null})},'+ Add Scenario')
  );
}

/* The four traffic lights and the verdict for one plan */
function Analysis({title,a,embedded}){
  const body=[
    React.createElement('div',{key:'h',className:'row-between',style:{flexWrap:'wrap'}},
      React.createElement('div',{className:'sec-title'},embedded?'Verdict for the combined plan':`Why: ${title}`),
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
    React.createElement('div',{key:'f',className:'note'},`Upfront cash needed: ${fmt(a.upfront)}. New monthly cost: ${fmt(a.newMonthly)}. Surplus after: ${fmt(a.surplusAfter)}. Estimates use your saved income, spending, savings and debts.`)
  ];
  return embedded?React.createElement('div',{className:'stack stack-md',style:{marginTop:14}},body):React.createElement('div',{className:'card stack stack-md'},body);
}
