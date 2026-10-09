import React from 'react';
import {AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts';
import {HeroCard} from '../components/Hero.js';
import {CURRENCY, clamp, fmtK, fmtPct, fv, fxRate} from '../lib/format.js';

/* ══════════════════════════════════════════
   PAGE: DASHBOARD
══════════════════════════════════════════ */

export function PageDashboard({state,derived,setPage,upd}){
  const{netWorth,monthlySurplus,savingsRate,healthScore,totalAssets,totalDebt}=derived;
  const age=state.profile.age;
  // Net worth projection (30 years)
  const r=(state.retirement.returnRate/100)/12;
  const projData=Array.from({length:31},(_,i)=>{
    const months=i*12;
    const projected=fv(r,months,Math.max(monthlySurplus,0),netWorth);
    return{year:age+i,value:Math.max(projected,0)};
  });
  // Growth stages are defined in USD so they mean the same thing in every currency.
  const nwUSD=netWorth/fxRate(CURRENCY.code);
  const level=nwUSD<10000?1:nwUSD<50000?2:nwUSD<100000?3:nwUSD<500000?4:5;
  const levelLabel=['','Seed','Sapling','Young tree','Orchard','Grove'][level];
  const goalProgress=state.goals.map(g=>({...g,pct:Math.min(100,(g.currentAmount/g.targetAmount)*100)}));
  const warnings=[];
  if(savingsRate<10)warnings.push({type:'warn',msg:'Savings rate below 10% — increase monthly contributions'});
  if(derived.cashAssets<derived.totalExpenses*3)warnings.push({type:'warn',msg:'Emergency fund below 3 months — top it up'});
  if(totalDebt>totalAssets*0.5)warnings.push({type:'danger',msg:'High debt-to-asset ratio — prioritize debt payoff'});
  if(monthlySurplus<0)warnings.push({type:'danger',msg:'Monthly deficit detected — review your expenses'});

  return React.createElement('div',{className:'stack stack-lg'},
    React.createElement(HeroCard,{state,derived,level,levelLabel,nwUSD,upd}),
    React.createElement('div',{className:'grid4'},
      React.createElement('div',{className:'card kpi'},
        React.createElement('div',{className:'kpi-label'},'Net Worth'),
        React.createElement('div',{className:'kpi-value',style:{color:netWorth>=0?'var(--fg)':'var(--red)'}},fmtK(netWorth)),
        React.createElement('div',{className:'kpi-sub'},`Assets ${fmtK(totalAssets)} · Debt ${fmtK(totalDebt)}`)
      ),
      React.createElement('div',{className:'card kpi'},
        React.createElement('div',{className:'kpi-label'},'Monthly Surplus'),
        React.createElement('div',{className:'kpi-value',style:{color:monthlySurplus>=0?'var(--accent2)':'var(--red)'}},fmtK(monthlySurplus)),
        React.createElement('div',{className:'kpi-sub'},`Income ${fmtK(derived.totalIncome)} · Spend ${fmtK(derived.totalExpenses)}`)
      ),
      React.createElement('div',{className:'card kpi'},
        React.createElement('div',{className:'kpi-label'},'Savings Rate'),
        React.createElement('div',{className:'kpi-value'},fmtPct(savingsRate)),
        React.createElement('div',{className:'progress-wrap',style:{marginTop:6}},
          React.createElement('div',{className:'progress-fill',style:{width:`${clamp(savingsRate,0,100)}%`,background:savingsRate>20?'var(--accent2)':savingsRate>10?'var(--amber)':'var(--red)'}})
        )
      ),
      React.createElement('div',{className:'card kpi'},
        React.createElement('div',{className:'kpi-label'},'Health Score'),
        React.createElement('div',{className:'kpi-value'},`${healthScore}`),
        React.createElement('div',{className:'progress-wrap',style:{marginTop:6}},
          React.createElement('div',{className:'progress-fill',style:{width:`${healthScore}%`,background:healthScore>=80?'var(--accent2)':healthScore>=50?'var(--amber)':'var(--red)'}})
        )
      )
    ),
    /* Chart + Goals */
    React.createElement('div',{className:'grid2'},
      React.createElement('div',{className:'card',style:{gridColumn:'1/2'}},
        React.createElement('div',{className:'sec-header'},
          React.createElement('div',{className:'sec-title'},'Net Worth Projection'),
          React.createElement('span',{className:'chip'},`${state.retirement.returnRate}% return`)
        ),
        React.createElement(ResponsiveContainer,{width:'100%',height:200},
          React.createElement(AreaChart,{data:projData,margin:{top:5,right:5,left:5,bottom:5}},
            React.createElement('defs',null,
              React.createElement('linearGradient',{id:'nwGrad',x1:'0',y1:'0',x2:'0',y2:'1'},
                React.createElement('stop',{offset:'5%',stopColor:'#4a7c52',stopOpacity:0.3}),
                React.createElement('stop',{offset:'95%',stopColor:'#4a7c52',stopOpacity:0})
              )
            ),
            React.createElement(CartesianGrid,{strokeDasharray:'3 3',stroke:'var(--border2)'}),
            React.createElement(XAxis,{dataKey:'year',tick:{fontSize:10,fill:'var(--fg3)'},tickLine:false}),
            React.createElement(YAxis,{tick:{fontSize:10,fill:'var(--fg3)'},tickLine:false,tickFormatter:v=>fmtK(v)}),
            React.createElement(Tooltip,{formatter:(v)=>[fmtK(v),'Net Worth'],contentStyle:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}),
            React.createElement(Area,{type:'monotone',dataKey:'value',stroke:'#4a7c52',fill:'url(#nwGrad)',strokeWidth:2})
          )
        )
      ),
      React.createElement('div',{className:'card'},
        React.createElement('div',{className:'sec-header'},
          React.createElement('div',{className:'sec-title'},'Goal Progress'),
          React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:()=>{}},'+')
        ),
        React.createElement('div',{className:'stack stack-md'},
          goalProgress.map(g=>React.createElement('div',{key:g.id,className:'stack',style:{gap:6}},
            React.createElement('div',{className:'row-between'},
              React.createElement('span',{style:{fontSize:13,fontWeight:500}},g.label),
              React.createElement('span',{style:{fontSize:12,color:'var(--fg3)'}},`${fmtK(g.currentAmount)} / ${fmtK(g.targetAmount)}`)
            ),
            React.createElement('div',{className:'progress-wrap'},
              React.createElement('div',{className:'progress-fill',style:{width:`${g.pct}%`,background:g.color||'var(--accent)'}})
            ),
            React.createElement('div',{style:{fontSize:11,color:'var(--fg3)'}},`${g.pct.toFixed(0)}% · Target age ${g.targetAge}`)
          ))
        )
      )
    ),
    /* Warnings */
    warnings.length>0&&React.createElement('div',{className:'stack stack-sm'},
      warnings.map((w,i)=>React.createElement('div',{key:i,className:`alert alert-${w.type==='danger'?'danger':'warn'}`},'⚠ ',w.msg))
    )
  );
}
