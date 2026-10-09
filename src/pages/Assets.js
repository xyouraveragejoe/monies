import React from 'react';
import {PieChart, Pie, Cell, Tooltip, ResponsiveContainer} from 'recharts';
import {ASSET_COLORS, ASSET_ICONS} from '../lib/defaults.js';
import {fmtK} from '../lib/format.js';

/* ══════════════════════════════════════════
   PAGE: ASSETS
══════════════════════════════════════════ */

export function PageAssets({state,upd,modal,setModal}){
  const assets=state.assets;
  const total=assets.reduce((a,b)=>a+b.value,0);
  const byType={};
  assets.forEach(a=>{byType[a.type]=(byType[a.type]||0)+a.value;});
  const pieData=Object.entries(byType).map(([t,v])=>({name:t,value:v,color:ASSET_COLORS[t]||'#8a917f'}));

  const deleteAsset=(id)=>upd('assets',assets.filter(a=>a.id!==id));

  return React.createElement('div',{className:'stack stack-lg'},
    React.createElement('div',{className:'row-between'},
      React.createElement('div',{className:'kpi'},
        React.createElement('div',{className:'kpi-label'},'Total Assets'),
        React.createElement('div',{className:'kpi-value'},fmtK(total))
      ),
      React.createElement('button',{className:'btn btn-primary',onClick:()=>setModal({type:'asset',data:null})},'+ Add Asset')
    ),
    React.createElement('div',{className:'grid2'},
      React.createElement('div',{className:'card'},
        React.createElement('table',{className:'tbl'},
          React.createElement('thead',null,React.createElement('tr',null,
            ['Asset','Type','Institution','Value',''].map(h=>React.createElement('th',{key:h},h))
          )),
          React.createElement('tbody',null,
            assets.map(a=>React.createElement('tr',{key:a.id},
              React.createElement('td',null,React.createElement('div',{style:{fontWeight:500}},a.name)),
              React.createElement('td',null,React.createElement('span',{className:'chip'},ASSET_ICONS[a.type],' ',a.type)),
              React.createElement('td',{style:{color:'var(--fg2)'}},a.institution||'—'),
              React.createElement('td',{style:{fontWeight:600,color:'var(--accent2)'}},fmtK(a.value)),
              React.createElement('td',null,
                React.createElement('div',{className:'row gap-sm'},
                  React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:()=>setModal({type:'asset',data:a})},'Edit'),
                  React.createElement('button',{className:'btn btn-danger btn-sm',onClick:()=>deleteAsset(a.id)},'✕')
                )
              )
            ))
          )
        )
      ),
      React.createElement('div',{className:'stack stack-md'},
        React.createElement('div',{className:'card'},
          React.createElement('div',{className:'sec-title',style:{marginBottom:14}},'By Category'),
          React.createElement(ResponsiveContainer,{width:'100%',height:180},
            React.createElement(PieChart,null,
              React.createElement(Pie,{data:pieData,cx:'50%',cy:'50%',outerRadius:75,dataKey:'value'},
                pieData.map((d,i)=>React.createElement(Cell,{key:i,fill:d.color}))
              ),
              React.createElement(Tooltip,{formatter:(v,n)=>[fmtK(v),n],contentStyle:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}})
            )
          ),
          pieData.map(d=>React.createElement('div',{key:d.name,className:'row-between',style:{fontSize:12,marginBottom:6}},
            React.createElement('div',{className:'row gap-sm'},
              React.createElement('span',{style:{width:8,height:8,borderRadius:2,background:d.color,display:'inline-block'}}),
              React.createElement('span',{style:{color:'var(--fg2)',textTransform:'capitalize'}},d.name)
            ),
            React.createElement('span',{style:{fontWeight:600}},fmtK(d.value))
          ))
        )
      )
    )
  );
}
