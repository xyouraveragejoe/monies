import React, {useState, useEffect, useRef} from 'react';
import {CURRENCY} from '../lib/format.js';

/* ══════════════════════════════════════════
   PAGE: AI PLANNER
══════════════════════════════════════════ */

export function PageAI({state,upd,derived}){
  const ai=state.ai;
  const[input,setInput]=useState('');
  const[loading,setLoading]=useState(false);
  const messagesEndRef=useRef(null);

  const setAI=v=>upd('ai',{...ai,...v});

  const scrollToBottom=()=>messagesEndRef.current?.scrollIntoView({behavior:'smooth'});
  useEffect(scrollToBottom,[ai.messages]);

  const buildContext=()=>`
User Financial Profile:
- Age: ${state.profile.age}, Country: ${state.profile.country}
- Monthly Income: ${CURRENCY.code} ${derived.totalIncome.toFixed(0)}
- Monthly Expenses: ${CURRENCY.code} ${derived.totalExpenses.toFixed(0)}
- Monthly Surplus: ${CURRENCY.code} ${derived.monthlySurplus.toFixed(0)}
- Net Worth: ${CURRENCY.code} ${derived.netWorth.toFixed(0)}
- Total Assets: ${CURRENCY.code} ${derived.totalAssets.toFixed(0)}
- Total Debt: ${CURRENCY.code} ${derived.totalDebt.toFixed(0)}
- Savings Rate: ${derived.savingsRate.toFixed(1)}%
- Health Score: ${derived.healthScore}/100
- Target Retire Age: ${state.profile.retireAge}
`;

  const sendMessage=async(text)=>{
    if(!ai.apiKey){alert('Please enter your Claude API key first.');return;}
    if(!text.trim())return;
    const newMsgs=[...ai.messages,{role:'user',content:text}];
    setAI({messages:newMsgs});
    setInput('');
    setLoading(true);
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'x-api-key':ai.apiKey,'anthropic-version':'2023-06-01','content-type':'application/json','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1500,system:`You are a professional financial advisor and CFO. ${buildContext()} Be direct, specific, and actionable. Format with clear points.`,messages:newMsgs.map(m=>({role:m.role,content:m.content}))})
      });
      const d=await res.json();
      const reply=d.content?.[0]?.text||'Sorry, I could not generate a response.';
      setAI({messages:[...newMsgs,{role:'assistant',content:reply}]});
    }catch(e){
      setAI({messages:[...newMsgs,{role:'assistant',content:`Error: ${e.message}`}]});
    }
    setLoading(false);
  };

  const quickQ=['Can I retire by age 50?','How to eliminate my debt faster?','Am I saving enough?','What should I invest in now?','How to increase my net worth?'];

  return React.createElement('div',{className:'stack stack-lg'},
    /* API Key */
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'sec-title',style:{marginBottom:12}},'🔑 Claude API Key'),
      React.createElement('div',{className:'row gap-sm'},
        React.createElement('input',{className:'input',type:'password',value:ai.apiKey,placeholder:'sk-ant-...',style:{flex:1},onChange:e=>setAI({apiKey:e.target.value})}),
        React.createElement('button',{className:'btn btn-primary',onClick:()=>sendMessage('Analyze my financial situation and provide a comprehensive strategy report with specific action items.')},'Generate Report')
      ),
      React.createElement('div',{style:{fontSize:11,color:'var(--fg3)',marginTop:6}},'Your key is stored locally and never sent anywhere except Anthropic\'s API.')
    ),
    /* Quick Questions */
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'sec-title',style:{marginBottom:12}},'Quick Questions'),
      React.createElement('div',{className:'row',style:{flexWrap:'wrap',gap:8}},
        quickQ.map(q=>React.createElement('button',{key:q,className:'btn btn-ghost btn-sm',onClick:()=>sendMessage(q)},q))
      )
    ),
    /* Chat */
    React.createElement('div',{className:'card',style:{padding:0,overflow:'hidden'}},
      React.createElement('div',{style:{padding:'14px 16px',borderBottom:'1px solid var(--border)'}},
        React.createElement('div',{className:'sec-title'},'💬 AI Financial Advisor')
      ),
      React.createElement('div',{className:'chat-messages',style:{minHeight:300}},
        ai.messages.length===0&&React.createElement('div',{style:{textAlign:'center',color:'var(--fg3)',padding:40}},
          React.createElement('div',{style:{fontSize:32,marginBottom:12}},'◊'),
          React.createElement('div',{style:{fontSize:14,fontWeight:500}},'Your AI Financial Advisor'),
          React.createElement('div',{style:{fontSize:12,marginTop:4}},'Ask me anything about your finances')
        ),
        ai.messages.map((m,i)=>React.createElement('div',{key:i,className:`chat-bubble chat-${m.role==='user'?'user':'ai'}`},m.content)),
        loading&&React.createElement('div',{className:'chat-bubble chat-ai',style:{display:'flex',gap:6,alignItems:'center'}},
          React.createElement('div',{style:{width:6,height:6,borderRadius:'50%',background:'var(--fg3)',animation:'pulse 1s infinite'}}),
          React.createElement('div',{style:{width:6,height:6,borderRadius:'50%',background:'var(--fg3)',animation:'pulse 1s 0.2s infinite'}}),
          React.createElement('div',{style:{width:6,height:6,borderRadius:'50%',background:'var(--fg3)',animation:'pulse 1s 0.4s infinite'}})
        ),
        React.createElement('div',{ref:messagesEndRef})
      ),
      React.createElement('div',{className:'chat-input-row'},
        React.createElement('input',{className:'input',value:input,placeholder:'Ask your AI financial advisor...',style:{flex:1},onChange:e=>setInput(e.target.value),onKeyDown:e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(input);}}}),
        React.createElement('button',{className:'btn btn-primary',onClick:()=>sendMessage(input),disabled:loading},'Send')
      )
    )
  );
}
