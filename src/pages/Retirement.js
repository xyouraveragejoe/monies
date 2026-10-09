import React from 'react';
import {AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import {NumInput} from '../components/NumInput.js';
import {fmtK, fmtPct, fv, pmtCalc} from '../lib/format.js';

/* ══════════════════════════════════════════
   PAGE: RETIREMENT GOAL
══════════════════════════════════════════ */

export function PageRetirement({state,upd,derived}){
  const r=state.retirement;
  const{netWorth,investAssets,monthlySurplus}=derived;
  const age=state.profile.age;
  const yearsLeft=Math.max(0,r.desiredAge-age);
  const inflAdj=r.inflation/100;
  const retRate=r.returnRate/100;
  const retIncome=r.desiredIncome*Math.pow(1+inflAdj,yearsLeft);
  const swr=r.lifestyle==='lean'?0.05:r.lifestyle==='comfortable'?0.04:0.035;
  const required=retIncome/swr;
  const currentPortfolio=investAssets;
  const mRate=(retRate-inflAdj)/12;
  const months=yearsLeft*12;
  const portfolioAtRetire=fv(mRate,months,r.monthlyContrib,currentPortfolio);
  const gap=required-portfolioAtRetire;
  const reqMonthly=gap>0&&months>0?pmtCalc(mRate,months,gap):0;
  const successProb=Math.min(100,Math.max(0,(portfolioAtRetire/required)*100));

  const chartData=Array.from({length:yearsLeft+1},(_,i)=>({
    year:age+i,
    portfolio:Math.round(fv(mRate,i*12,r.monthlyContrib,currentPortfolio)),
    target:Math.round(required*(i/yearsLeft))
  }));

  const setR=k=>v=>upd('retirement',{...r,[k]:v});
  return React.createElement('div',{className:'stack stack-lg'},
    React.createElement('div',{className:'grid2'},
      React.createElement('div',{className:'card stack stack-md'},
        React.createElement('div',{className:'sec-title'},'⚙️ Parameters'),
        React.createElement('div',{className:'grid2'},
          [['Desired Retire Age','desiredAge',30,80,1],['Desired Annual Income','desiredIncome',0,500000,1000],['Monthly Contribution','monthlyContrib',0,50000,100],['Expected Return %','returnRate',1,20,0.5],['Inflation %','inflation',0,10,0.5]].map(([lbl,k,mn,mx,st])=>
            React.createElement('div',{key:k,className:'input-group'},
              React.createElement('label',{className:'input-label'},lbl),
              React.createElement(NumInput,{value:r[k],min:mn,max:mx,step:st,onChange:setR(k),prefix:k.includes('Income')||k.includes('Contrib')?'$':undefined,style:{width:'100%'}})
            )
          ),
          React.createElement('div',{className:'input-group'},
            React.createElement('label',{className:'input-label'},'Lifestyle'),
            React.createElement('select',{className:'input',value:r.lifestyle,onChange:e=>upd('retirement',{...r,lifestyle:e.target.value})},
              ['lean','comfortable','luxury'].map(l=>React.createElement('option',{key:l,value:l},l.charAt(0).toUpperCase()+l.slice(1)))
            )
          )
        )
      ),
      React.createElement('div',{className:'card stack stack-md'},
        React.createElement('div',{className:'sec-title'},'📊 Results'),
        React.createElement('div',{className:'grid2'},
          [['Required Portfolio',fmtK(required),'fg'],[`Projected Portfolio`,fmtK(portfolioAtRetire),portfolioAtRetire>=required?'accent2':'red'],['Monthly Gap',gap>0?`+${fmtK(reqMonthly)}`:'-',gap>0?'red':'accent2'],['Years to Retire',yearsLeft,'fg'],['Success Probability',fmtPct(successProb),successProb>80?'accent2':successProb>50?'amber':'red']].map(([l,v,c])=>
            React.createElement('div',{key:l},
              React.createElement('div',{style:{fontSize:11,color:'var(--fg3)',marginBottom:3}},l),
              React.createElement('div',{style:{fontSize:18,fontWeight:700,color:`var(--${c})`}},v)
            )
          )
        ),
        React.createElement('div',{style:{marginTop:8}},
          React.createElement('div',{style:{fontSize:11,color:'var(--fg3)',marginBottom:6}},'Success Probability'),
          React.createElement('div',{className:'progress-wrap progress-lg'},
            React.createElement('div',{className:'progress-fill',style:{width:`${successProb}%`,background:successProb>80?'var(--accent2)':successProb>50?'var(--amber)':'var(--red)'}})
          )
        ),
        gap>0&&React.createElement('div',{className:'alert alert-warn',style:{marginTop:8}},`⚠ Increase monthly contribution by ${fmtK(reqMonthly)} to close the gap.`)
      )
    ),
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'sec-title',style:{marginBottom:16}},'Portfolio Projection vs Target'),
      React.createElement(ResponsiveContainer,{width:'100%',height:240},
        React.createElement(AreaChart,{data:chartData,margin:{top:5,right:5,left:5,bottom:5}},
          React.createElement('defs',null,
            React.createElement('linearGradient',{id:'retGrad',x1:'0',y1:'0',x2:'0',y2:'1'},
              React.createElement('stop',{offset:'5%',stopColor:'#4a7c52',stopOpacity:0.3}),
              React.createElement('stop',{offset:'95%',stopColor:'#4a7c52',stopOpacity:0})
            )
          ),
          React.createElement(CartesianGrid,{strokeDasharray:'3 3',stroke:'var(--border2)'}),
          React.createElement(XAxis,{dataKey:'year',tick:{fontSize:10,fill:'var(--fg3)'}}),
          React.createElement(YAxis,{tick:{fontSize:10,fill:'var(--fg3)'},tickFormatter:v=>fmtK(v)}),
          React.createElement(Tooltip,{formatter:(v,n)=>[fmtK(v),n],contentStyle:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}),
          React.createElement(Legend,{wrapperStyle:{fontSize:12}}),
          React.createElement(Area,{type:'monotone',dataKey:'portfolio',name:'Your Portfolio',stroke:'#4a7c52',fill:'url(#retGrad)',strokeWidth:2}),
          React.createElement(Area,{type:'monotone',dataKey:'target',name:'Required Target',stroke:'#d9a22b',fill:'none',strokeWidth:2,strokeDasharray:'4 4'})
        )
      )
    )
  );
}
