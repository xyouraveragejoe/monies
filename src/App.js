import React, {useState, useEffect, useRef, useCallback} from 'react';
import {ModalRouter} from './components/Modals.js';
import {D_AI, D_ASSETS, D_DEBTS, D_EXPENSES, D_GOALS, D_INCOME, D_LIFESTYLE, D_PREDICTOR, D_PROFILE, D_RETIREMENT, D_SCENARIOS} from './lib/defaults.js';
import {FX, FX_FALLBACK, setCurrency, uid} from './lib/format.js';
import {storageGet, storageSet} from './lib/storage.js';
import {supabase} from './lib/supabase.js';
import {loadAll, replaceAll, validateKey, mortgageHasData, friendlyMessage} from './lib/db.js';
import {createSync} from './lib/sync.js';
import {exampleState, blankState, legacyState, hasLegacyData, archiveLegacyData} from './lib/seed.js';
import {Welcome} from './components/Welcome.js';
import {PageAI} from './pages/AI.js';
import {PageAssets} from './pages/Assets.js';
import {PageDashboard} from './pages/Dashboard.js';
import {PageDebts} from './pages/Debts.js';
import {PageExpenses} from './pages/Expenses.js';
import {PageLifestyle} from './pages/Lifestyle.js';
import {PagePredictor} from './pages/Predictor.js';
import {PageRetirement} from './pages/Retirement.js';
import {PageRoadmap} from './pages/Roadmap.js';
import {PageScenarios} from './pages/Scenarios.js';
import {PageSnapshot} from './pages/Snapshot.js';

/* ── Nav config ── */

export const NAV=[
  {group:'Today',items:[{id:'dashboard',icon:'🌳',label:'My Orchard'},{id:'snapshot',icon:'🌱',label:'Profile & Income'}]},
  {group:'Money',items:[{id:'expenses',icon:'🧺',label:'Spending'},{id:'assets',icon:'🏺',label:'Assets'},{id:'debts',icon:'⛓️',label:'Debts'}]},
  {group:'The Future',items:[{id:'retirement',icon:'🎯',label:'Retirement Goal'},{id:'predictor',icon:'🔭',label:'Retire Predictor'},{id:'scenarios',icon:'🧭',label:'Scenarios'}]},
  {group:'Life',items:[{id:'lifestyle',icon:'🍎',label:'Lifestyle'},{id:'roadmap',icon:'🗺️',label:'Roadmap'}]},
  {group:'Help',items:[{id:'ai',icon:'💬',label:'AI Planner'}]},
];

/* ── Main App ── */

/* Your Claude API key and AI chat stay in THIS browser only. They are never sent to the database. */
const AI_KEY='monies_ai_local_v1';

export function App({user,onSignOut}){
  const[page,setPage]=useState('dashboard');
  const[sideCollapsed,setSideCollapsed]=useState(false);
  const[darkMode,setDarkMode]=useState(()=>{try{return window.matchMedia('(prefers-color-scheme: dark)').matches}catch{return false}});
  const[menuOpen,setMenuOpen]=useState(false);
  const[,setFxTick]=useState(0);
  const[loaded,setLoaded]=useState(false);
  const[modal,setModal]=useState(null);// {type,data}
  const[needsWelcome,setNeedsWelcome]=useState(false);
  const[loadError,setLoadError]=useState('');
  const[reloadKey,setReloadKey]=useState(0);
  const[saveStatus,setSaveStatus]=useState({state:'idle'});
  const[notice,setNotice]=useState('');
  const[signOutArmed,setSignOutArmed]=useState(false);

  const[state,setState]=useState({
    profile:D_PROFILE,income:D_INCOME,expenses:D_EXPENSES,
    assets:[...D_ASSETS],debts:{...D_DEBTS,creditCards:[...D_DEBTS.creditCards],loans:[...D_DEBTS.loans],mortgage:{...D_DEBTS.mortgage}},
    retirement:{...D_RETIREMENT},predictor:{...D_PREDICTOR},
    goals:[...D_GOALS],scenarios:[...D_SCENARIOS],ai:{...D_AI},lifestyle:{...D_LIFESTYLE}
  });
  const stateRef=useRef(state);
  const syncRef=useRef(null);
  if(!syncRef.current)syncRef.current=createSync(supabase,setSaveStatus);

  // Load your data from Supabase when you sign in (and again if you press Retry).
  useEffect(()=>{
    let dead=false;
    setLoadError('');
    (async()=>{
      try{
        const {empty,state:remote}=await loadAll(supabase);
        const ai=await storageGet(AI_KEY,null);
        if(dead)return;
        stateRef.current={...stateRef.current,...remote,ai:{...D_AI,...(ai||{})}};
        setState(stateRef.current);
        setNeedsWelcome(empty);
        setLoaded(true);
      }catch(e){
        if(!dead)setLoadError(friendlyMessage(e));
      }
    })();
    return()=>{dead=true};
  },[user.id,reloadKey]);

  // Warn before closing the tab if something has not been saved yet.
  useEffect(()=>{
    const warn=(e)=>{if(syncRef.current.pending()){e.preventDefault();e.returnValue='';}};
    window.addEventListener('beforeunload',warn);
    return()=>window.removeEventListener('beforeunload',warn);
  },[]);

  // First sign-in: pick how the account starts, then write it to the database.
  const startWith=async(kind)=>{
    let base,ai=null;
    if(kind==='legacy'){const r=legacyState();base=r.state;ai=r.ai;}
    else base=kind==='example'?exampleState():blankState();
    await replaceAll(supabase,base);
    if(kind==='legacy'){archiveLegacyData();if(ai)await storageSet(AI_KEY,ai);}
    stateRef.current={...stateRef.current,...base,...(ai?{ai:{...D_AI,...ai}}:{})};
    setState(stateRef.current);
    setNeedsWelcome(false);
  };

  // Every edit goes through here: validate, update the screen, then save in the background.
  const upd=(key,val)=>{
    if(key==='ai'){
      stateRef.current={...stateRef.current,ai:val};
      setState(stateRef.current);
      storageSet(AI_KEY,val);
      return;
    }
    const err=validateKey(key,val);
    if(err){setNotice(`Not saved: ${err}`);return;}
    let next=val;
    if(key==='debts'&&!next.mortgage.id&&mortgageHasData(next.mortgage))next={...next,mortgage:{...next.mortgage,id:uid()}};
    const prev=stateRef.current[key];
    setNotice('');
    stateRef.current={...stateRef.current,[key]:next};
    setState(stateRef.current);
    syncRef.current.enqueue(key,prev,next);
  };

  const trySignOut=()=>{
    if(syncRef.current.pending()&&!signOutArmed){setSignOutArmed(true);return;}
    onSignOut();
  };

  const updPath=(key,sub,val)=>upd(key,{...state[key],[sub]:val});

  useEffect(()=>{
    document.documentElement.setAttribute('data-theme',darkMode?'dark':'light');
  },[darkMode]);

  useEffect(()=>{
    let dead=false;
    (async()=>{
      try{
        const c=JSON.parse(localStorage.getItem('flp_fx')||'null');
        if(c&&c.rates&&Date.now()-c.t<12*3600*1000){FX.rates={...FX_FALLBACK,...c.rates};FX.live=true;FX.asOf=c.asOf;if(!dead)setFxTick(x=>x+1);return;}
      }catch{}
      try{
        const r=await fetch('https://open.er-api.com/v6/latest/USD');
        const d=await r.json();
        if(d&&d.result==='success'&&d.rates){
          FX.rates={...FX_FALLBACK,...d.rates};FX.live=true;FX.asOf=(d.time_last_update_utc||'').slice(0,16);
          try{localStorage.setItem('flp_fx',JSON.stringify({t:Date.now(),rates:d.rates,asOf:FX.asOf}));}catch{}
          if(!dead)setFxTick(x=>x+1);
        }
      }catch{}
    })();
    return()=>{dead=true};
  },[]);

  setCurrency(state.profile.country);

  // ── derived financials ──
  const totalIncome=state.income.salary+(state.income.bonus/12)+state.income.sideIncome+state.income.otherIncome;
  const totalExpenses=Object.values(state.expenses).reduce((a,b)=>a+b,0);
  const monthlySurplus=totalIncome-totalExpenses;
  const savingsRate=totalIncome>0?(monthlySurplus/totalIncome)*100:0;
  const totalAssets=state.assets.reduce((a,b)=>a+b.value,0);
  const totalCCDebt=state.debts.creditCards.reduce((a,b)=>a+b.balance,0);
  const totalLoanDebt=state.debts.loans.reduce((a,b)=>a+b.balance,0);
  const totalMortgage=state.debts.mortgage.balance||0;
  const totalDebt=totalCCDebt+totalLoanDebt+totalMortgage;
  const netWorth=totalAssets-totalDebt;
  const cashAssets=state.assets.filter(a=>a.type==='cash').reduce((a,b)=>a+b.value,0);
  const investAssets=state.assets.filter(a=>a.type==='investment'||a.type==='retirement').reduce((a,b)=>a+b.value,0);
  const debtRatio=totalIncome>0?(totalDebt/(totalIncome*12))*100:0;
  const burnRate=totalExpenses/Math.max(cashAssets,1)*30; // days of runway
  const healthScore=Math.min(100,Math.max(0,
    (savingsRate>20?25:savingsRate>10?15:savingsRate>0?5:0)+
    (debtRatio<36?25:debtRatio<50?15:debtRatio<80?5:0)+
    (cashAssets>=totalExpenses*6?25:cashAssets>=totalExpenses*3?15:cashAssets>=totalExpenses?5:0)+
    (netWorth>0?25:netWorth>-10000?10:0)
  ));

  const derived={totalIncome,totalExpenses,monthlySurplus,savingsRate,totalAssets,totalDebt,netWorth,cashAssets,investAssets,debtRatio,burnRate,healthScore,totalCCDebt,totalLoanDebt,totalMortgage};

  if(loadError)return React.createElement('div',{className:'auth-wrap'},
    React.createElement('div',{className:'auth-card'},
      React.createElement('h1',{className:'auth-title'},'Could not load your data'),
      React.createElement('div',{className:'alert alert-danger',role:'alert'},loadError),
      React.createElement('div',{className:'row gap-sm',style:{marginTop:16}},
        React.createElement('button',{className:'btn btn-primary',onClick:()=>setReloadKey(k=>k+1)},'Try again'),
        React.createElement('button',{className:'btn btn-ghost',onClick:onSignOut},'Sign out'))));

  if(!loaded)return React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--fg2)',gap:12}},
    React.createElement('div',{style:{width:20,height:20,border:'2px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}),
    'Loading your data...'
  );

  if(needsWelcome)return React.createElement(Welcome,{email:user.email,hasLegacy:hasLegacyData(),onChoose:startWith});

  const currentNav=NAV.flatMap(g=>g.items).find(i=>i.id===page);

  return React.createElement('div',{id:'app-root',style:{display:'flex',height:'100%'}},
    /* Sidebar */
    menuOpen&&React.createElement('div',{className:'scrim',onClick:()=>setMenuOpen(false)}),
    React.createElement('aside',{className:`sidebar${sideCollapsed?' collapsed':''}${menuOpen?' mobile-open':''}`},
      React.createElement('div',{className:'sidebar-logo'},
        React.createElement('div',{className:'logo-icon'},'🌳'),
        !sideCollapsed&&React.createElement('span',{className:'logo-text'},'Monies')
      ),
      React.createElement('nav',{className:'sidebar-nav'},
        NAV.map(group=>React.createElement('div',{key:group.group,className:'nav-group'},
          React.createElement('div',{className:'nav-group-label'},group.group),
          group.items.map(item=>React.createElement('div',{
            key:item.id,
            className:`nav-item${page===item.id?' active':''}`,
            onClick:()=>{setPage(item.id);setMenuOpen(false);}
          },
            React.createElement('span',{className:'nav-icon'},item.icon),
            !sideCollapsed&&React.createElement('span',{className:'nav-label'},item.label)
          ))
        ))
      ),
      React.createElement('div',{className:'sidebar-bottom'},
        React.createElement('button',{className:'sidebar-toggle',onClick:()=>setSideCollapsed(p=>!p)},
          sideCollapsed?'→':'← Collapse'
        )
      )
    ),
    /* Main */
    React.createElement('div',{className:'main'},
      React.createElement('div',{className:'topbar'},
        React.createElement('div',{className:'row gap-sm'},
          React.createElement('button',{className:'menu-btn btn btn-ghost btn-sm','aria-label':'Open menu',onClick:()=>setMenuOpen(o=>!o)},'☰'),
          React.createElement('div',{className:'page-title'},currentNav?.label||'Monies')
        ),
        React.createElement('div',{className:'topbar-actions'},
          React.createElement('span',{className:`save-status ${saveStatus.state}`,role:'status','aria-live':'polite'},
            saveStatus.state==='saving'?'Saving…':saveStatus.state==='error'?'Not saved':'Saved to your account'),
          React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:()=>setDarkMode(p=>!p)},darkMode?'☀ Light':'☾ Dark'),
          React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:trySignOut,title:user.email,onBlur:()=>setSignOutArmed(false)},signOutArmed?'Unsaved changes. Sign out anyway?':'Sign out'),
          React.createElement('div',{className:'health-pill',style:{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:7}},
            React.createElement('span',{style:{fontSize:11,color:'var(--fg3)'}},healthScore>=80?'🟢':healthScore>=50?'🟡':'🔴'),
            React.createElement('span',{style:{fontSize:12,fontWeight:600}},`${healthScore}/100`)
          )
        )
      ),
      saveStatus.state==='error'&&React.createElement('div',{className:'banner banner-error',role:'alert'},
        React.createElement('span',null,`Your latest changes are NOT saved yet. ${saveStatus.message||''}`),
        React.createElement('button',{className:'btn btn-sm btn-primary',onClick:()=>syncRef.current.retry(()=>stateRef.current)},'Retry saving')),
      notice&&React.createElement('div',{className:'banner banner-warn',role:'alert'},
        React.createElement('span',null,notice),
        React.createElement('button',{className:'btn btn-sm btn-ghost',onClick:()=>setNotice('')},'Dismiss')),
      React.createElement('div',{className:'page-content'},
        page==='dashboard'&&React.createElement(PageDashboard,{state,derived,setPage,upd}),
        page==='snapshot'&&React.createElement(PageSnapshot,{state,upd,updPath,derived}),
        page==='expenses'&&React.createElement(PageExpenses,{state,upd,derived}),
        page==='assets'&&React.createElement(PageAssets,{state,upd,modal,setModal}),
        page==='debts'&&React.createElement(PageDebts,{state,upd,derived,modal,setModal}),
        page==='retirement'&&React.createElement(PageRetirement,{state,upd,derived}),
        page==='predictor'&&React.createElement(PagePredictor,{state,upd,derived}),
        page==='scenarios'&&React.createElement(PageScenarios,{state,upd,derived,modal,setModal}),
        page==='lifestyle'&&React.createElement(PageLifestyle,{state,upd,derived}),
        page==='roadmap'&&React.createElement(PageRoadmap,{state,upd,modal,setModal}),
        page==='ai'&&React.createElement(PageAI,{state,upd,derived})
      )
    ),
    /* Modals */
    modal&&React.createElement(ModalRouter,{modal,setModal,state,upd})
  );
}
