import React from 'react';
import {PieChart, Pie, Cell, Tooltip, ResponsiveContainer} from 'recharts';
import {NumInput} from '../components/NumInput.js';
import {fmtK, fmtPct} from '../lib/format.js';

/* ══════════════════════════════════════════
   PAGE: EXPENSES
══════════════════════════════════════════ */

export function PageExpenses({state,upd,derived}){
  const exp=state.expenses;
  const{totalExpenses,totalIncome,monthlySurplus,savingsRate}=derived;
  const groups=[
    {label:'🏠 Housing',fields:[['housing','Rent/Mortgage'],['utilities','Utilities'],['insurance_home','Home Insurance'],['roadTax','Road/Property Tax']]},
    {label:'🚗 Transport',fields:[['transport','Public Transport'],['fuel','Fuel'],['insurance_car','Car Insurance']]},
    {label:'🍽️ Food & Drink',fields:[['groceries','Groceries'],['diningOut','Dining Out'],['coffee','Coffee/Cafes']]},
    {label:'🛡️ Insurance',fields:[['insurance_health','Health Insurance'],['insurance_life','Life Insurance']]},
    {label:'✨ Lifestyle',fields:[['entertainment','Entertainment'],['subscriptions','Subscriptions'],['gym','Gym/Sports'],['travel','Travel'],['clothing','Clothing'],['personalCare','Personal Care']]},
    {label:'👨‍👩‍👧 Family',fields:[['childcare','Childcare'],['education','Education'],['parentAllowance','Parent Allowance'],['gifts','Gifts'],['charity','Charity']]},
    {label:'💊 Health',fields:[['medical','Medical/Dental']]},
    {label:'📦 Other',fields:[['miscellaneous','Miscellaneous']]},
  ];
  const pieColors=['#4a7c52','#d9a22b','#c98a2b','#b3452f','#6b8fa3','#a86f8c','#8f9a4a','#5f8f8b'];
  const pieData=groups.map((g,i)=>({
    name:g.label.split(' ').slice(1).join(' '),
    value:g.fields.reduce((a,[k])=>a+(exp[k]||0),0),
    color:pieColors[i]
  })).filter(d=>d.value>0);

  return React.createElement('div',{className:'stack stack-lg'},
    /* Summary bar */
    React.createElement('div',{className:'grid4'},
      [['Total Monthly',fmtK(totalExpenses)],['Total Income',fmtK(totalIncome)],['Surplus',fmtK(monthlySurplus)],['Savings Rate',fmtPct(savingsRate)]].map(([l,v],i)=>
        React.createElement('div',{key:l,className:'card kpi'},
          React.createElement('div',{className:'kpi-label'},l),
          React.createElement('div',{className:'kpi-value',style:{fontSize:22,color:i===2?(monthlySurplus>=0?'var(--accent2)':'var(--red)'):'var(--fg)'}},v)
        )
      )
    ),
    React.createElement('div',{className:'grid2'},
      /* Groups */
      React.createElement('div',{className:'stack stack-md',style:{gridColumn:'1/2'}},
        groups.map(g=>React.createElement('div',{key:g.label,className:'card'},
          React.createElement('div',{className:'sec-header',style:{marginBottom:10}},
            React.createElement('span',{style:{fontSize:13,fontWeight:600}},g.label),
            React.createElement('span',{style:{fontSize:12,color:'var(--fg3)'}},fmtK(g.fields.reduce((a,[k])=>a+(exp[k]||0),0)))
          ),
          React.createElement('div',{className:'grid2'},
            g.fields.map(([k,lbl])=>React.createElement('div',{key:k,className:'input-group'},
              React.createElement('label',{className:'input-label'},lbl),
              React.createElement(NumInput,{value:exp[k]||0,min:0,max:50000,onChange:v=>upd('expenses',{...exp,[k]:v}),prefix:'$',style:{width:'100%'}})
            ))
          )
        ))
      ),
      /* Pie */
      React.createElement('div',{className:'card',style:{position:'sticky',top:0,alignSelf:'flex-start'}},
        React.createElement('div',{className:'sec-title',style:{marginBottom:16}},'Breakdown'),
        React.createElement(ResponsiveContainer,{width:'100%',height:220},
          React.createElement(PieChart,null,
            React.createElement(Pie,{data:pieData,cx:'50%',cy:'50%',innerRadius:55,outerRadius:90,paddingAngle:2,dataKey:'value'},
              pieData.map((d,i)=>React.createElement(Cell,{key:i,fill:d.color}))
            ),
            React.createElement(Tooltip,{formatter:(v,n)=>[fmtK(v),n],contentStyle:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}})
          )
        ),
        React.createElement('div',{className:'stack',style:{gap:6}},
          pieData.map(d=>React.createElement('div',{key:d.name,className:'row-between',style:{fontSize:12}},
            React.createElement('div',{className:'row gap-sm'},
              React.createElement('span',{style:{width:8,height:8,borderRadius:2,background:d.color,display:'inline-block'}}),
              React.createElement('span',{style:{color:'var(--fg2)'}},d.name)
            ),
            React.createElement('span',{style:{fontWeight:600}},fmtK(d.value))
          ))
        )
      )
    )
  );
}
