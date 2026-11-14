/* ---------- storage ---------- */
let db=null; const mem={meta:new Map(),data:new Map()};
function dbOpen(){return new Promise(res=>{try{const r=indexedDB.open('tape4',1);
  r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('meta',{keyPath:'id'});d.createObjectStore('data',{keyPath:'id'});};
  r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);r.onblocked=()=>res(null);}catch(e){res(null);}});}
function idb(store,mode,fn){return new Promise((res,rej)=>{const t=db.transaction(store,mode);const rq=fn(t.objectStore(store));
  t.oncomplete=()=>res(rq&&rq.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error);});}
const dbAll=s=>db?idb(s,'readonly',o=>o.getAll()):Promise.resolve([...mem[s].values()]);
const dbGet=(s,id)=>db?idb(s,'readonly',o=>o.get(id)):Promise.resolve(mem[s].get(id));
const dbPut=(s,o)=>db?idb(s,'readwrite',x=>x.put(o)):(mem[s].set(o.id,o),Promise.resolve());
const dbDel=(s,id)=>db?idb(s,'readwrite',x=>x.delete(id)):(mem[s].delete(id),Promise.resolve());
