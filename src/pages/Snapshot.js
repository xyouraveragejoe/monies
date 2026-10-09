import React from 'react';
import {NumInput} from '../components/NumInput.js';
import {COUNTRIES, fmtK, fmtPct} from '../lib/format.js';

/* ══════════════════════════════════════════
   PAGE: SNAPSHOT
══════════════════════════════════════════ */

export function PageSnapshot({state,upd,updPath,derived}){
  const p=state.profile,inc=state.income;
  const{healthScore,netWorth,savingsRate,totalAssets,totalDebt}=derived;
  const stars=Math.ceil(healthScore/20);
  return React.createElement('div',{className:'stack stack-lg'},
    React.createElement('div',{className:'grid2'},
      /* Profile */
      React.createElement('div',{className:'card stack stack-md'},
        React.createElement('div',{className:'sec-title'},'👤 Profile'),
        React.createElement('div',{className:'grid2'},
          React.createElement('div',{className:'input-group'},
            React.createElement('label',{className:'input-label'},'Your Name'),
            React.createElement('input',{className:'input',value:p.name||'',placeholder:'Name',onChange:e=>upd('profile',{...p,name:e.target.value})})
          ),
          React.createElement('div',{className:'input-group'},
            React.createElement('label',{className:'input-label'},'Age'),
            React.createElement(NumInput,{value:p.age,min:16,max:80,onChange:v=>upd('profile',{...p,age:v}),style:{width:'100%'}})
          ),
          React.createElement('div',{className:'input-group'},
            React.createElement('label',{className:'input-label'},'Country (sets your currency)'),
            React.createElement('select',{className:'input',value:p.country,onChange:e=>upd('profile',{...p,country:e.target.value})},
              Object.entries(COUNTRIES).map(([c,v])=>React.createElement('option',{key:c,value:c},`${v[0]} (${v[1]})`))
            )
          ),
          React.createElement('div',{className:'input-group'},
            React.createElement('label',{className:'input-label'},'Dependents'),
            React.createElement(NumInput,{value:p.dependents,min:0,max:10,onChange:v=>upd('profile',{...p,dependents:v}),style:{width:'100%'}})
          ),
          React.createElement('div',{className:'input-group'},
            React.createElement('label',{className:'input-label'},'Target Retire Age'),
            React.createElement(NumInput,{value:p.retireAge,min:30,max:80,onChange:v=>upd('profile',{...p,retireAge:v}),style:{width:'100%'}})
          ),
          React.createElement('div',{className:'input-group'},
            React.createElement('label',{className:'input-label'},'Life Expectancy'),
            React.createElement(NumInput,{value:p.lifeExpect,min:60,max:110,onChange:v=>upd('profile',{...p,lifeExpect:v}),style:{width:'100%'}})
          )
        )
      ),
      /* Income */
      React.createElement('div',{className:'card stack stack-md'},
        React.createElement('div',{className:'sec-title'},'💰 Income'),
        React.createElement('div',{className:'stack stack-md'},
          [['Monthly Salary','salary',0,500000],['Monthly Bonus (avg)','bonus',0,100000],['Side Income','sideIncome',0,100000],['Other Income','otherIncome',0,100000]].map(([lbl,k,mn,mx])=>
            React.createElement('div',{key:k,className:'input-group'},
              React.createElement('label',{className:'input-label'},lbl),
              React.createElement(NumInput,{value:inc[k],min:mn,max:mx,onChange:v=>upd('income',{...inc,[k]:v}),prefix:'$',style:{width:'100%'}})
            )
          ),
          React.createElement('div',{className:'input-group'},
            React.createElement('label',{className:'input-label'},'Pay Frequency'),
            React.createElement('select',{className:'input',value:inc.payFreq,onChange:e=>upd('income',{...inc,payFreq:e.target.value})},
              ['monthly','bi-weekly','weekly'].map(f=>React.createElement('option',{key:f,value:f},f.charAt(0).toUpperCase()+f.slice(1)))
            )
          )
        )
      )
    ),
    /* Health Score */
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'sec-header'},
        React.createElement('div',{className:'sec-title'},'Financial Health Score'),
        React.createElement('div',{style:{fontSize:22}},Array.from({length:5},(_,i)=>i<stars?'★':'☆').join(''))
      ),
      React.createElement('div',{className:'grid4'},
        [['Net Worth',fmtK(netWorth),netWorth>=0?'green':'red'],['Savings Rate',fmtPct(savingsRate),savingsRate>20?'green':savingsRate>0?'amber':'red'],['Total Assets',fmtK(totalAssets),'green'],['Total Debt',fmtK(totalDebt),totalDebt===0?'green':totalDebt<totalAssets?'amber':'red']].map(([l,v,c])=>
          React.createElement('div',{key:l,style:{textAlign:'center'}},
            React.createElement('div',{style:{fontSize:20,fontWeight:700,color:`var(--${c==='green'?'accent2':c==='red'?'red':'amber'})`}},v),
            React.createElement('div',{style:{fontSize:11,color:'var(--fg3)',marginTop:4}},l)
          )
        )
      )
    )
  );
}
