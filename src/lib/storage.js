/* ── storage ── */

export const storageGet=async(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb}catch{return fb}};

export const storageSet=async(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
