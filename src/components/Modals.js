import React, {useState} from 'react';
import {NumInput} from './NumInput.js';
import {uid} from '../lib/format.js';

/* ══════════════════════════════════════════
   MODALS
══════════════════════════════════════════ */

export function ModalRouter({modal,setModal,state,upd}){
  const close=()=>setModal(null);
  if(modal.type==='asset')return React.createElement(AssetModal,{modal,close,state,upd});
  if(modal.type==='cc')return React.createElement(CCModal,{modal,close,state,upd});
  if(modal.type==='loan')return React.createElement(LoanModal,{modal,close,state,upd});
  if(modal.type==='goal')return React.createElement(GoalModal,{modal,close,state,upd});
  if(modal.type==='scenario')return React.createElement(ScenarioModal,{modal,close,state,upd});
  return null;
}

export function AssetModal({modal,close,state,upd}){
  const init=modal.data||{id:uid(),name:'',type:'cash',value:0,institution:'',notes:''};
  const[d,setD]=useState(init);
  const save=()=>{
    if(!d.name.trim())return;
    const assets=modal.data?state.assets.map(a=>a.id===d.id?d:a):[...state.assets,d];
    upd('assets',assets);close();
  };
  return React.createElement('div',{className:'modal-overlay',onClick:close},
    React.createElement('div',{className:'modal',onClick:e=>e.stopPropagation()},
      React.createElement('div',{className:'modal-header'},
        React.createElement('div',{className:'modal-title'},modal.data?'Edit Asset':'Add Asset'),
        React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:close},'✕')
      ),
      React.createElement('div',{className:'modal-body'},
        React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Name'),React.createElement('input',{className:'input',value:d.name,onChange:e=>setD({...d,name:e.target.value})})),
        React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Type'),React.createElement('select',{className:'input',value:d.type,onChange:e=>setD({...d,type:e.target.value})},['cash','investment','retirement','property','crypto','other'].map(t=>React.createElement('option',{key:t,value:t},t.charAt(0).toUpperCase()+t.slice(1))))),
        React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Current Value'),React.createElement(NumInput,{value:d.value,min:0,max:1e9,onChange:v=>setD({...d,value:v}),prefix:'$',style:{width:'100%'}})),
        React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Institution'),React.createElement('input',{className:'input',value:d.institution,onChange:e=>setD({...d,institution:e.target.value})})),
        React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Notes'),React.createElement('textarea',{className:'input',value:d.notes,onChange:e=>setD({...d,notes:e.target.value})}))
      ),
      React.createElement('div',{className:'modal-footer'},
        React.createElement('button',{className:'btn btn-ghost',onClick:close},'Cancel'),
        React.createElement('button',{className:'btn btn-primary',onClick:save},'Save')
      )
    )
  );
}

export function CCModal({modal,close,state,upd}){
  const init=modal.data||{id:uid(),name:'',balance:0,rate:19.9,minPayment:0,limit:5000};
  const[d,setD]=useState(init);
  const save=()=>{
    if(!d.name.trim())return;
    const ccs=modal.data?state.debts.creditCards.map(c=>c.id===d.id?d:c):[...state.debts.creditCards,d];
    upd('debts',{...state.debts,creditCards:ccs});close();
  };
  return React.createElement('div',{className:'modal-overlay',onClick:close},
    React.createElement('div',{className:'modal',onClick:e=>e.stopPropagation()},
      React.createElement('div',{className:'modal-header'},
        React.createElement('div',{className:'modal-title'},modal.data?'Edit Card':'Add Credit Card'),
        React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:close},'✕')
      ),
      React.createElement('div',{className:'modal-body'},
        [['Card Name','name','text'],['Balance','balance','num'],['Credit Limit','limit','num'],['Interest Rate %','rate','num'],['Min Payment','minPayment','num']].map(([lbl,k,t])=>
          React.createElement('div',{key:k,className:'input-group'},
            React.createElement('label',{className:'input-label'},lbl),
            t==='text'?React.createElement('input',{className:'input',value:d[k],onChange:e=>setD({...d,[k]:e.target.value})}):
            React.createElement(NumInput,{value:d[k],min:0,max:1e7,step:k.includes('rate')||k.includes('Rate')?0.1:1,onChange:v=>setD({...d,[k]:v}),prefix:'$',style:{width:'100%'}})
          )
        )
      ),
      React.createElement('div',{className:'modal-footer'},
        React.createElement('button',{className:'btn btn-ghost',onClick:close},'Cancel'),
        React.createElement('button',{className:'btn btn-primary',onClick:save},'Save')
      )
    )
  );
}

export function LoanModal({modal,close,state,upd}){
  const init=modal.data||{id:uid(),name:'',balance:0,rate:5.5,minPayment:0,tenureMonths:60};
  const[d,setD]=useState(init);
  const save=()=>{
    if(!d.name.trim())return;
    const loans=modal.data?state.debts.loans.map(l=>l.id===d.id?d:l):[...state.debts.loans,d];
    upd('debts',{...state.debts,loans});close();
  };
  return React.createElement('div',{className:'modal-overlay',onClick:close},
    React.createElement('div',{className:'modal',onClick:e=>e.stopPropagation()},
      React.createElement('div',{className:'modal-header'},
        React.createElement('div',{className:'modal-title'},modal.data?'Edit Loan':'Add Loan'),
        React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:close},'✕')
      ),
      React.createElement('div',{className:'modal-body'},
        [['Loan Name','name','text'],['Balance','balance','num'],['Interest Rate %','rate','num'],['Monthly Payment','minPayment','num'],['Months Remaining','tenureMonths','num']].map(([lbl,k,t])=>
          React.createElement('div',{key:k,className:'input-group'},
            React.createElement('label',{className:'input-label'},lbl),
            t==='text'?React.createElement('input',{className:'input',value:d[k],onChange:e=>setD({...d,[k]:e.target.value})}):
            React.createElement(NumInput,{value:d[k],min:0,max:1e7,step:k.includes('rate')||k.includes('Rate')?0.1:1,onChange:v=>setD({...d,[k]:v}),prefix:k!=='tenureMonths'?'$':undefined,style:{width:'100%'}})
          )
        )
      ),
      React.createElement('div',{className:'modal-footer'},
        React.createElement('button',{className:'btn btn-ghost',onClick:close},'Cancel'),
        React.createElement('button',{className:'btn btn-primary',onClick:save},'Save')
      )
    )
  );
}

export function GoalModal({modal,close,state,upd}){
  const init=modal.data||{id:uid(),label:'',category:'savings',targetAge:35,targetAmount:50000,currentAmount:0,done:false,color:'#4a7c52',note:''};
  const[d,setD]=useState(init);
  const save=()=>{
    if(!d.label.trim())return;
    const goals=modal.data?state.goals.map(g=>g.id===d.id?d:g):[...state.goals,d];
    upd('goals',goals);close();
  };
  const COLORS=['#4a7c52','#d9a22b','#c98a2b','#b3452f','#6b8fa3','#a86f8c'];
  return React.createElement('div',{className:'modal-overlay',onClick:close},
    React.createElement('div',{className:'modal',onClick:e=>e.stopPropagation()},
      React.createElement('div',{className:'modal-header'},
        React.createElement('div',{className:'modal-title'},modal.data?'Edit Goal':'Add Goal'),
        React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:close},'✕')
      ),
      React.createElement('div',{className:'modal-body'},
        React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Goal Name'),React.createElement('input',{className:'input',value:d.label,onChange:e=>setD({...d,label:e.target.value})})),
        React.createElement('div',{className:'grid2'},
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Category'),React.createElement('select',{className:'input',value:d.category,onChange:e=>setD({...d,category:e.target.value})},['savings','property','retirement','business','travel','education','other'].map(c=>React.createElement('option',{key:c,value:c},c)))),
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Target Age'),React.createElement(NumInput,{value:d.targetAge,min:state.profile.age,max:100,onChange:v=>setD({...d,targetAge:v}),style:{width:'100%'}}))
        ),
        React.createElement('div',{className:'grid2'},
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Target Amount'),React.createElement(NumInput,{value:d.targetAmount,min:0,max:1e9,onChange:v=>setD({...d,targetAmount:v}),prefix:'$',style:{width:'100%'}})),
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Current Amount'),React.createElement(NumInput,{value:d.currentAmount,min:0,max:1e9,onChange:v=>setD({...d,currentAmount:v}),prefix:'$',style:{width:'100%'}}))
        ),
        React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Notes'),React.createElement('input',{className:'input',value:d.note,onChange:e=>setD({...d,note:e.target.value})})),
        React.createElement('div',{className:'input-group'},
          React.createElement('label',{className:'input-label'},'Color'),
          React.createElement('div',{className:'row gap-sm'},
            COLORS.map(c=>React.createElement('div',{key:c,onClick:()=>setD({...d,color:c}),style:{width:24,height:24,borderRadius:'50%',background:c,cursor:'pointer',border:d.color===c?'2px solid var(--fg)':'2px solid transparent'}}))
          )
        )
      ),
      React.createElement('div',{className:'modal-footer'},
        React.createElement('button',{className:'btn btn-ghost',onClick:close},'Cancel'),
        React.createElement('button',{className:'btn btn-primary',onClick:save},'Save')
      )
    )
  );
}

export function ScenarioModal({modal,close,state,upd}){
  const init=modal.data||{id:uid(),name:'',icon:'⚗️',enabled:false,category:'other',cost:10000,downPayment:0,loanAmount:0,loanRate:0,loanTenure:0,monthlyExtra:0,prepYears:1,risk:'medium',note:''};
  const[d,setD]=useState(init);
  const save=()=>{
    if(!d.name.trim())return;
    const scenarios=modal.data?state.scenarios.map(s=>s.id===d.id?d:s):[...state.scenarios,d];
    upd('scenarios',scenarios);close();
  };
  return React.createElement('div',{className:'modal-overlay',onClick:close},
    React.createElement('div',{className:'modal',onClick:e=>e.stopPropagation()},
      React.createElement('div',{className:'modal-header'},
        React.createElement('div',{className:'modal-title'},modal.data?'Edit Scenario':'Add Scenario'),
        React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:close},'✕')
      ),
      React.createElement('div',{className:'modal-body'},
        React.createElement('div',{className:'grid2'},
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Name'),React.createElement('input',{className:'input',value:d.name,onChange:e=>setD({...d,name:e.target.value})})),
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Icon (emoji)'),React.createElement('input',{className:'input',value:d.icon,onChange:e=>setD({...d,icon:e.target.value})}))
        ),
        React.createElement('div',{className:'grid2'},
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Total Cost'),React.createElement(NumInput,{value:d.cost,min:0,max:1e9,onChange:v=>setD({...d,cost:v}),prefix:'$',style:{width:'100%'}})),
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Down Payment'),React.createElement(NumInput,{value:d.downPayment,min:0,max:1e9,onChange:v=>setD({...d,downPayment:v}),prefix:'$',style:{width:'100%'}}))
        ),
        React.createElement('div',{className:'grid2'},
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Loan Amount'),React.createElement(NumInput,{value:d.loanAmount,min:0,max:1e9,onChange:v=>setD({...d,loanAmount:v}),prefix:'$',style:{width:'100%'}})),
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Loan Rate %'),React.createElement(NumInput,{value:d.loanRate,min:0,max:30,step:0.1,onChange:v=>setD({...d,loanRate:v}),style:{width:'100%'}}))
        ),
        React.createElement('div',{className:'grid2'},
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Loan Tenure (months)'),React.createElement(NumInput,{value:d.loanTenure,min:0,max:480,onChange:v=>setD({...d,loanTenure:v}),style:{width:'100%'}})),
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Extra Monthly Cost'),React.createElement(NumInput,{value:d.monthlyExtra,min:0,max:50000,onChange:v=>setD({...d,monthlyExtra:v}),prefix:'$',style:{width:'100%'}}))
        ),
        React.createElement('div',{className:'grid2'},
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Prep Years Needed'),React.createElement(NumInput,{value:d.prepYears,min:0,max:30,onChange:v=>setD({...d,prepYears:v}),style:{width:'100%'}})),
          React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Risk Level'),React.createElement('select',{className:'input',value:d.risk,onChange:e=>setD({...d,risk:e.target.value})},['low','medium','high'].map(r=>React.createElement('option',{key:r,value:r},r.charAt(0).toUpperCase()+r.slice(1)))))
        ),
        React.createElement('div',{className:'input-group'},React.createElement('label',{className:'input-label'},'Notes'),React.createElement('textarea',{className:'input',value:d.note,onChange:e=>setD({...d,note:e.target.value})}))
      ),
      React.createElement('div',{className:'modal-footer'},
        React.createElement('button',{className:'btn btn-ghost',onClick:close},'Cancel'),
        React.createElement('button',{className:'btn btn-primary',onClick:save},'Save')
      )
    )
  );
}
