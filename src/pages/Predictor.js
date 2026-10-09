import React from 'react';
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import {NumInput} from '../components/NumInput.js';
import {fmtK, fv} from '../lib/format.js';

/* ══════════════════════════════════════════
   PAGE: PREDICTOR
══════════════════════════════════════════ */

export function PagePredictor({state,upd,derived}){
  const p=state.predictor;
  const age=state.profile.age;
  const{investAssets}=derived;
  const currentSavings=investAssets;
  const setP=k=>v=>upd('predictor',{...p,[k]:v});
  const rates={conservative:5,moderate:7,aggressive:9};
  const calcRetireAge=(r,desiredIncome,monthly,savings)=>{
    const required=desiredIncome/0.04;
    const mRate=(r/100)/12;
    for(let yr=age+1;yr<=75;yr++){
      const months=(yr-age)*12;
      const pf=fv(mRate,months,monthly,savings);
      if(pf>=required)return yr;
    }
    return 75;
  };
  const conservative=calcRetireAge(rates.conservative,p.desiredIncome,p.monthlyInvest,currentSavings);
  const base=calcRetireAge(rates.moderate,p.desiredIncome,p.monthlyInvest,currentSavings);
  const aggressive=calcRetireAge(rates.aggressive,p.desiredIncome,p.monthlyInvest,currentSavings);

  const chartData=Array.from({length:31},(_,i)=>{
    const months=i*12;
    return{
      year:age+i,
      conservative:Math.round(fv((rates.conservative/100)/12,months,p.monthlyInvest,currentSavings)),
      base:Math.round(fv((rates.moderate/100)/12,months,p.monthlyInvest,currentSavings)),
      aggressive:Math.round(fv((rates.aggressive/100)/12,months,p.monthlyInvest,currentSavings)),
    };
  });

  return React.createElement('div',{className:'stack stack-lg'},
    React.createElement('div',{className:'grid2'},
      React.createElement('div',{className:'card stack stack-md'},
        React.createElement('div',{className:'sec-title'},'⚙️ Inputs'),
        [['Desired Annual Income in Retirement','desiredIncome',0,500000,1000,'$'],['Monthly Investment Amount','monthlyInvest',0,50000,100,'$']].map(([lbl,k,mn,mx,st,pfx])=>
          React.createElement('div',{key:k,className:'input-group'},
            React.createElement('label',{className:'input-label'},lbl),
            React.createElement(NumInput,{value:p[k],min:mn,max:mx,step:st,onChange:setP(k),prefix:pfx,style:{width:'100%'}})
          )
        ),
        React.createElement('div',{className:'alert alert-info'},'📌 Using your current investment assets as starting point: ',React.createElement('strong',null,fmtK(currentSavings)))
      ),
      React.createElement('div',{className:'card stack stack-md'},
        React.createElement('div',{className:'sec-title'},'🔮 Retirement Ages'),
        [['Conservative (5%)',conservative,'fg3'],['Base Case (7%)',base,'accent'],['Aggressive (9%)',aggressive,'accent2']].map(([l,v,c])=>
          React.createElement('div',{key:l,style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--border2)'}},
            React.createElement('span',{style:{fontSize:13,color:'var(--fg2)'}},l),
            React.createElement('span',{style:{fontSize:24,fontWeight:700,color:`var(--${c})`,fontFamily:'Fraunces,Georgia,serif'}},`Age ${v}`)
          )
        )
      )
    ),
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'sec-title',style:{marginBottom:16}},'Wealth Trajectory by Scenario'),
      React.createElement(ResponsiveContainer,{width:'100%',height:260},
        React.createElement(LineChart,{data:chartData,margin:{top:5,right:5,left:5,bottom:5}},
          React.createElement(CartesianGrid,{strokeDasharray:'3 3',stroke:'var(--border2)'}),
          React.createElement(XAxis,{dataKey:'year',tick:{fontSize:10,fill:'var(--fg3)'}}),
          React.createElement(YAxis,{tick:{fontSize:10,fill:'var(--fg3)'},tickFormatter:v=>fmtK(v)}),
          React.createElement(Tooltip,{formatter:(v,n)=>[fmtK(v),n],contentStyle:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}),
          React.createElement(Legend,{wrapperStyle:{fontSize:12}}),
          React.createElement(Line,{type:'monotone',dataKey:'conservative',name:'Conservative',stroke:'#8a917f',strokeWidth:2,dot:false}),
          React.createElement(Line,{type:'monotone',dataKey:'base',name:'Base Case',stroke:'#4a7c52',strokeWidth:2,dot:false}),
          React.createElement(Line,{type:'monotone',dataKey:'aggressive',name:'Aggressive',stroke:'#d9a22b',strokeWidth:2,dot:false})
        )
      )
    )
  );
}
