import React from 'react';
import {fmtK} from '../lib/format.js';

/* ══════════════════════════════════════════
   PAGE: ROADMAP
══════════════════════════════════════════ */

export function PageRoadmap({state,upd,modal,setModal}){
  const goals=state.goals;
  const age=state.profile.age;
  const sorted=[...goals].sort((a,b)=>a.targetAge-b.targetAge);
  const toggleDone=(id)=>upd('goals',goals.map(g=>g.id===id?{...g,done:!g.done}:g));
  const deleteGoal=(id)=>upd('goals',goals.filter(g=>g.id!==id));

  return React.createElement('div',{className:'stack stack-lg'},
    React.createElement('div',{className:'row-between'},
      React.createElement('div',{className:'kpi'},
        React.createElement('div',{className:'kpi-label'},'Goals'),
        React.createElement('div',{className:'kpi-value'},`${goals.filter(g=>g.done).length} / ${goals.length} complete`)
      ),
      React.createElement('button',{className:'btn btn-primary',onClick:()=>setModal({type:'goal',data:null})},'+ Add Goal')
    ),
    React.createElement('div',{className:'grid2'},
      React.createElement('div',{className:'timeline'},
        sorted.map(g=>{
          const isPast=g.targetAge<age;
          const isCurrent=g.targetAge>=age&&g.targetAge<=age+2;
          return React.createElement('div',{key:g.id,className:'tl-item'},
            React.createElement('div',{className:`tl-dot${g.done?' done':isCurrent?' active':''}`}),
            React.createElement('div',{className:'card',style:{borderColor:g.done?'var(--accent2)':isCurrent?'var(--accent)':'var(--border)'}},
              React.createElement('div',{className:'row-between',style:{marginBottom:8}},
                React.createElement('div',null,
                  React.createElement('span',{className:'chip',style:{background:g.color+'22',color:g.color,border:'none',marginRight:6}},`Age ${g.targetAge}`),
                  React.createElement('span',{style:{fontWeight:600,fontSize:14}},g.label)
                ),
                React.createElement('div',{className:'row gap-sm'},
                  React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:()=>toggleDone(g.id)},g.done?'↩ Undo':'✓ Done'),
                  React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:()=>setModal({type:'goal',data:g})},'Edit'),
                  React.createElement('button',{className:'btn btn-danger btn-sm',onClick:()=>deleteGoal(g.id)},'✕')
                )
              ),
              React.createElement('div',{className:'row-between',style:{marginBottom:6}},
                React.createElement('span',{style:{fontSize:12,color:'var(--fg3)'}},g.note||g.category),
                React.createElement('span',{style:{fontSize:12,fontWeight:600}},fmtK(g.targetAmount))
              ),
              React.createElement('div',{className:'progress-wrap'},
                React.createElement('div',{className:'progress-fill',style:{width:`${Math.min(100,(g.currentAmount/g.targetAmount)*100)}%`,background:g.color||'var(--accent)'}})
              ),
              React.createElement('div',{style:{fontSize:11,color:'var(--fg3)',marginTop:4}},`${fmtK(g.currentAmount)} saved · ${((g.currentAmount/g.targetAmount)*100).toFixed(0)}%`)
            )
          );
        })
      ),
      /* Summary */
      React.createElement('div',{className:'stack stack-md',style:{alignSelf:'flex-start'}},
        React.createElement('div',{className:'card'},
          React.createElement('div',{className:'sec-title',style:{marginBottom:12}},'📊 Progress Overview'),
          goals.map(g=>React.createElement('div',{key:g.id,style:{marginBottom:12}},
            React.createElement('div',{className:'row-between',style:{marginBottom:4}},
              React.createElement('span',{style:{fontSize:12,fontWeight:500}},g.label),
              React.createElement('span',{style:{fontSize:11,color:'var(--fg3)'}},`${((g.currentAmount/g.targetAmount)*100).toFixed(0)}%`)
            ),
            React.createElement('div',{className:'progress-wrap'},
              React.createElement('div',{className:'progress-fill',style:{width:`${Math.min(100,(g.currentAmount/g.targetAmount)*100)}%`,background:g.color||'var(--accent)'}})
            )
          ))
        )
      )
    )
  );
}
