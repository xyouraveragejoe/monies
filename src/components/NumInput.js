import React, {useState, useEffect} from 'react';
import {CURRENCY, clamp, fxRate} from '../lib/format.js';

/* ── NumInput ── */

export function NumInput({value,onChange,min=0,max=999999999,step=1,style,placeholder,prefix:prefixIn,disabled}){
  const isMoney=prefixIn==='$';
  const prefix=isMoney?CURRENCY.sym:prefixIn;
  if(isMoney)max=max*Math.max(1,fxRate(CURRENCY.code));
  const dec=Math.max(2,((String(step).split('.')[1])||'').length);
  const[raw,setRaw]=useState(String(value??0));
  const[focused,setFocused]=useState(false);
  useEffect(()=>{if(!focused)setRaw(String(value??0));},[value,focused]);
  const commit=()=>{
    setFocused(false);
    const p=parseFloat(raw);
    if(isNaN(p)){setRaw(String(value??0));return;}
    const clamped=clamp(p,min,max);
    const final=step<1?parseFloat(clamped.toFixed(dec)):Math.round(clamped);
    setRaw(String(final));
    if(final!==value)onChange(final);
  };
  return React.createElement('div',{style:{position:'relative',display:'flex',alignItems:'center',...style}},
    prefix&&React.createElement('span',{style:{position:'absolute',left:10,color:'var(--fg3)',fontSize:13,pointerEvents:'none'}},prefix),
    React.createElement('input',{
      type:'text',inputMode:'decimal',value:raw,placeholder,disabled,
      style:{width:'100%',padding:prefix?`8px 12px 8px ${14+String(prefix).length*9}px`:'8px 12px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:7,color:'var(--fg)',fontSize:13,fontFamily:'inherit',outline:'none',transition:'border 0.15s',opacity:disabled?0.5:1},
      onFocus:()=>{setFocused(true);setRaw(String(value??0));},
      onChange:e=>{if(/^-?\d*\.?\d*$/.test(e.target.value)||e.target.value==='-')setRaw(e.target.value);},
      onBlur:commit,
      onKeyDown:e=>{if(e.key==='Enter')e.currentTarget.blur();}
    })
  );
}
