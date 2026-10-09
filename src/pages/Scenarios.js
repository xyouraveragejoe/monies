import React from 'react';
import {DEBT_RISK_COLOR} from '../lib/defaults.js';
import {fmtK, pmtCalc} from '../lib/format.js';

/* ══════════════════════════════════════════
   PAGE: SCENARIOS
══════════════════════════════════════════ */

export function PageScenarios({state,upd,derived,modal,setModal}){
  const scenarios=state.scenarios;
  const{monthlySurplus,totalAssets}=derived;
  const age=state.profile.age;
  const enabled=scenarios.filter(s=>s.enabled);
  const totalCost=enabled.reduce((a,s)=>a+s.cost,0);
  const totalMonthly=enabled.reduce((a,s)=>a+(s.loanTenure>0?pmtCalc((s.loanRate/100)/12,s.loanTenure,s.loanAmount):0)+s.monthlyExtra,0);
  const maxPrepYears=enabled.length>0?Math.max(...enabled.map(s=>s.prepYears)):0;
  const netSurplusAfter=monthlySurplus-totalMonthly;
  const feasible=netSurplusAfter>0&&totalAssets>=totalCost*0.1;

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
        React.createElement('div',{className:`chip`,style:{marginTop:8,background:DEBT_RISK_COLOR[s.risk]+'22',color:DEBT_RISK_COLOR[s.risk],border:'none'}},s.risk,' risk'),
        React.createElement('button',{className:'btn btn-ghost btn-sm',style:{marginTop:8,width:'100%'},onClick:e=>{e.stopPropagation();setModal({type:'scenario',data:s});}},'Edit')
      ))
    ),
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
      React.createElement('div',{style:{marginTop:14},className:feasible?'alert alert-success':'alert alert-danger'},
        feasible?`✅ Feasible! With ${maxPrepYears} years of preparation, you can achieve all selected scenarios.`:`⚠ Challenging — your monthly surplus may not cover combined costs. Consider reducing scenarios or increasing income.`
      )
    ),
    React.createElement('button',{className:'btn btn-ghost',onClick:()=>setModal({type:'scenario',data:null})},'+ Add Scenario')
  );
}
