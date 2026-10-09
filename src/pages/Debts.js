import React from 'react';
import {NumInput} from '../components/NumInput.js';
import {fmtK} from '../lib/format.js';

/* ══════════════════════════════════════════
   PAGE: DEBTS
══════════════════════════════════════════ */

export function PageDebts({state,upd,derived,modal,setModal}){
  const debts=state.debts;
  const{totalDebt,totalCCDebt,totalLoanDebt,totalMortgage,totalAssets}=derived;
  const totalMinPayment=debts.creditCards.reduce((a,b)=>a+b.minPayment,0)+debts.loans.reduce((a,b)=>a+b.minPayment,0)+(debts.mortgage.minPayment||0);
  const debtPct=totalAssets>0?Math.min(100,(totalDebt/totalAssets)*100):100;

  const delCC=(id)=>upd('debts',{...debts,creditCards:debts.creditCards.filter(c=>c.id!==id)});
  const delLoan=(id)=>upd('debts',{...debts,loans:debts.loans.filter(l=>l.id!==id)});

  return React.createElement('div',{className:'stack stack-lg'},
    /* Boss HP */
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'row-between',style:{marginBottom:12}},
        React.createElement('div',null,
          React.createElement('div',{style:{fontSize:11,fontWeight:600,color:'var(--fg3)',letterSpacing:'0.08em',textTransform:'uppercase'}},totalDebt===0?'⚡ All Debts Cleared!':'⚡ Total Debt'),
          React.createElement('div',{style:{fontSize:28,fontWeight:700,color:totalDebt===0?'var(--accent2)':'var(--red)',fontFamily:'Fraunces,Georgia,serif'}},fmtK(totalDebt))
        ),
        React.createElement('span',{style:{fontSize:12,color:'var(--fg3)'}},`Monthly min: ${fmtK(totalMinPayment)}`)
      ),
      React.createElement('div',{className:'progress-wrap progress-lg'},
        React.createElement('div',{className:'progress-fill',style:{width:`${debtPct}%`,background:`linear-gradient(90deg, var(--amber), var(--red))`}})
      ),
      React.createElement('div',{style:{fontSize:11,color:'var(--fg3)',marginTop:6}},`${debtPct.toFixed(0)}% of total assets — ${debtPct<36?'Healthy':debtPct<50?'Watch out':'Danger zone'}`)
    ),
    /* Credit Cards */
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'sec-header'},
        React.createElement('div',{className:'sec-title'},'💳 Credit Cards'),
        React.createElement('button',{className:'btn btn-primary btn-sm',onClick:()=>setModal({type:'cc',data:null})},'+ Add')
      ),
      debts.creditCards.length===0?React.createElement('p',{style:{color:'var(--fg3)',fontSize:13}},'No credit cards added.'):
      React.createElement('table',{className:'tbl'},
        React.createElement('thead',null,React.createElement('tr',null,['Card','Balance','Rate','Min Payment','Utilization',''].map(h=>React.createElement('th',{key:h},h)))),
        React.createElement('tbody',null,debts.creditCards.map(c=>React.createElement('tr',{key:c.id},
          React.createElement('td',{style:{fontWeight:500}},c.name),
          React.createElement('td',{style:{color:'var(--red)',fontWeight:600}},fmtK(c.balance)),
          React.createElement('td',null,`${c.rate}%`),
          React.createElement('td',null,fmtK(c.minPayment)),
          React.createElement('td',null,
            React.createElement('div',{className:'progress-wrap',style:{width:80}},
              React.createElement('div',{className:'progress-fill',style:{width:`${Math.min(100,(c.balance/(c.limit||1))*100)}%`,background:'var(--red)'}})
            )
          ),
          React.createElement('td',null,
            React.createElement('div',{className:'row gap-sm'},
              React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:()=>setModal({type:'cc',data:c})},'Edit'),
              React.createElement('button',{className:'btn btn-danger btn-sm',onClick:()=>delCC(c.id)},'✕')
            )
          )
        )))
      )
    ),
    /* Loans */
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'sec-header'},
        React.createElement('div',{className:'sec-title'},'🏦 Loans'),
        React.createElement('button',{className:'btn btn-primary btn-sm',onClick:()=>setModal({type:'loan',data:null})},'+ Add')
      ),
      debts.loans.length===0?React.createElement('p',{style:{color:'var(--fg3)',fontSize:13}},'No loans added.'):
      React.createElement('table',{className:'tbl'},
        React.createElement('thead',null,React.createElement('tr',null,['Loan','Balance','Rate','Monthly','Months Left',''].map(h=>React.createElement('th',{key:h},h)))),
        React.createElement('tbody',null,debts.loans.map(l=>React.createElement('tr',{key:l.id},
          React.createElement('td',{style:{fontWeight:500}},l.name),
          React.createElement('td',{style:{color:'var(--amber)',fontWeight:600}},fmtK(l.balance)),
          React.createElement('td',null,`${l.rate}%`),
          React.createElement('td',null,fmtK(l.minPayment)),
          React.createElement('td',null,l.tenureMonths,' mo'),
          React.createElement('td',null,
            React.createElement('div',{className:'row gap-sm'},
              React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:()=>setModal({type:'loan',data:l})},'Edit'),
              React.createElement('button',{className:'btn btn-danger btn-sm',onClick:()=>delLoan(l.id)},'✕')
            )
          )
        )))
      )
    ),
    /* Mortgage */
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'sec-title',style:{marginBottom:14}},'🏠 Mortgage'),
      React.createElement('div',{className:'grid4'},
        [['Balance','mortgage.balance',0,5000000,'balance'],['Interest Rate %','mortgage.rate',0,20,'rate'],['Monthly Payment','mortgage.minPayment',0,20000,'minPayment'],['Property Value','mortgage.propertyValue',0,5000000,'propertyValue']].map(([lbl,,mn,mx,k])=>
          React.createElement('div',{key:k,className:'input-group'},
            React.createElement('label',{className:'input-label'},lbl),
            React.createElement(NumInput,{value:debts.mortgage[k]||0,min:mn,max:mx,onChange:v=>upd('debts',{...debts,mortgage:{...debts.mortgage,[k]:v}}),prefix:'$',style:{width:'100%'}})
          )
        )
      )
    ),
    /* Strategy */
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'sec-title',style:{marginBottom:12}},'💡 Payoff Strategy'),
      React.createElement('div',{className:'grid2'},
        React.createElement('div',{className:'card-sm'},
          React.createElement('div',{style:{fontWeight:600,marginBottom:6}},'🏔 Avalanche (Cheapest)'),
          React.createElement('p',{style:{fontSize:12,color:'var(--fg2)',lineHeight:1.6}},'Pay minimums on all debts, then put extra money toward the highest interest rate first. Saves the most in interest over time.')
        ),
        React.createElement('div',{className:'card-sm'},
          React.createElement('div',{style:{fontWeight:600,marginBottom:6}},'⛄ Snowball (Motivating)'),
          React.createElement('p',{style:{fontSize:12,color:'var(--fg2)',lineHeight:1.6}},'Pay minimums on all debts, then attack the smallest balance first. Quick wins build momentum and motivation.')
        )
      )
    )
  );
}
