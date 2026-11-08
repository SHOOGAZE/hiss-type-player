/* ---------- state ---------- */
const S={srcs:[],tg:[],mode:'stop',t0:0,off:0,rate:1,dir:1,src:null,sg:null};
let cur=null, lib=[], pitch=0, tapeAmt=0.25, armed=false, rec=null, busy=false, theme='sonic';
let lidP=0,lidV=0,lidT=0,lidPrev=0,libO=false,lidA=100;
let ctx=null, lastState='', msgText='', msgUntil=0, cntZero=0, scr=null, lastPos=0;
const A={};
/* tape character per skin: lp=top end, hiss, wow=wow/flutter, sat=saturation, hum=motor/mains, lv=key click level */
const TCH={
  sonic:    {lp:1.3, hiss:.6,  wow:.6,  sat:.8,  hum:.5,  lv:.60, bd:0.5},
  kami:     {lp:.75, hiss:.8,  wow:1.3, sat:.9,  hum:.4,  lv:.85, bd:0.5},
  kiiro:    {lp:1.15,hiss:.5,  wow:.35, sat:.7,  hum:.7,  lv:.60, bd:1.5},
  akane:    {lp:.85, hiss:1.3, wow:.8,  sat:1.1, hum:.3,  lv:.55, bd:1.5},
  kuro:     {lp:1,   hiss:1,   wow:1,   sat:1,   hum:1,   lv:.60, bd:1.5},
  nashville:{lp:.6,  hiss:1.1, wow:1.5, sat:1.6, hum:1.5, lv:.40, bd:2.5}
};
const TC=()=>TCH[theme]||TCH.sonic;
try{const st=JSON.parse(localStorage.getItem('tape4.set')||'{}'); if(typeof st.pitch==='number')pitch=st.pitch; if(typeof st.tape==='number')tapeAmt=st.tape;}catch(e){}
const saveSet=()=>{try{localStorage.setItem('tape4.set',JSON.stringify({pitch,tape:tapeAmt}));}catch(e){}};
/* deck settings: tape type, Dolby NR, speed, tone, rec level, volume, balance, auto-reverse, memory, cue */
const TY=[{n:'I',bias:'NORMAL BIAS',eq:'120µs',lp:1,hiss:1,sat:1,lo:2.5,hi:-1.5},
          {n:'II',bias:'HIGH BIAS',eq:'70µs',lp:1.25,hiss:1.12,sat:.85,lo:0,hi:2.2},
          {n:'IV',bias:'METAL BIAS',eq:'70µs',lp:1.5,hiss:.8,sat:.6,lo:-.5,hi:.6}];
const NRN=['OFF','DOLBY B','DOLBY C'],NRH=[1,.45,.2],NRS=[0,-1.2,-2.8];
const D={type:0,nr:0,speed:1,tone:0,rec:1,vol:1,bal:0,auto:0,mem:0,cue:1,lidc:1,libc:1,hrs:0};
try{Object.assign(D,JSON.parse(localStorage.getItem('tape4.deck')||'{}'));}catch(e){}
const saveDeck=()=>{try{localStorage.setItem('tape4.deck',JSON.stringify(D));}catch(e){}};
const baseRate=()=>(1+pitch)*D.speed;
let sleepAt=0,memFrom=false;
const say=(t,ms)=>{msgText=t;msgUntil=performance.now()+(ms||0);};
