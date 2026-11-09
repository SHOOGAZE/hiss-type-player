/* ---------- cassette art: shell materials, reel types, stickers and the window backlight ----------
   Everything here is deterministic per cassette (seeded by its id), so a tape always keeps its own reels, its own plastic and its own history:
   reel types: teeth / smooth / clear. shell materials: gloss (opaque) / smoke (tinted translucent) / clear (nearly transparent).
   stickers: scotch tape, a DEMO rubber stamp and pen notes. The backlight is a group inside the window whose strength comes from the CSS variable --bk (set by lidStep). */
const REELS=['teeth','smooth','clear'],MATS=['gloss','smoke','clear'];
const REEL_N={teeth:'TEETH',smooth:'SMOOTH',clear:'CLEAR'},MAT_N={gloss:'GLOSS',smoke:'SMOKED',clear:'CLEAR'};
const hashId=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};
const cRng=seed=>{let h=(seed>>>0)||1;return()=>{h=(Math.imul(h,1664525)+1013904223)>>>0;return h/4294967296;};};
const reelOf=m=>REELS.includes(m.reel)?m.reel:(h=>h<45?'teeth':h<75?'smooth':'clear')(hashId(m.id)%100);
const matOf=m=>MATS.includes(m.mat)?m.mat:(h=>h<58?'gloss':h<84?'smoke':'clear')((hashId(m.id)>>>8)%100);
const hexLum=c=>{const n=parseInt(String(c).slice(1),16)||0;return(.299*(n>>16&255)+.587*(n>>8&255)+.114*(n&255))/255;};
const PEN_FF="'Bradley Hand','Noteworthy','Marker Felt','Segoe Print','Chalkboard SE','Comic Sans MS',cursive";
const STAMP_FF="'Impact','Haettenschweiler','Avenir Next Condensed','DIN Condensed','Arial Narrow',sans-serif";

/* ---- reels ---- */
const PACK_STOPS=(()=>{let s='<stop offset="0" stop-color="#241710"/>';for(let i=1;i<=13;i++)s+=`<stop offset="${(.2+.6*i/13).toFixed(3)}" stop-color="${i%2?'#44301f':'#35231a'}"/>`;
  return s+'<stop offset=".9" stop-color="#4d3523"/><stop offset=".965" stop-color="#7c5a3e"/><stop offset="1" stop-color="#1d120b"/>';})();
/* the lamp: a warm wash behind the window plus a glow in each hub; both are driven by --bk (0..1) and tinted by --bkc */
const bkc=(o,v)=>`style="stop-color:var(--bkc${v||''},${v?'#fff0c4':'#ffb347'})" stop-opacity="${o}"`;
const artDefs=u=>`<radialGradient id="pk${u}" cx=".5" cy=".5" r=".5" fx=".47" fy=".44">${PACK_STOPS}</radialGradient>
   <radialGradient id="hb${u}" cx=".36" cy=".3" r=".9"><stop offset="0" stop-color="#fdfbf2"/><stop offset=".55" stop-color="#e6e1d4"/><stop offset="1" stop-color="#aaa493"/></radialGradient>
   <radialGradient id="hc${u}" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".04"/><stop offset=".7" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#d8ecff" stop-opacity=".4"/></radialGradient>
   <radialGradient id="bk${u}" gradientUnits="userSpaceOnUse" cx="160" cy="124" r="136" gradientTransform="translate(160 124) scale(1 .46) translate(-160 -124)"><stop offset="0" ${bkc(.72)}/><stop offset=".5" ${bkc(.42)}/><stop offset="1" ${bkc(.12)}/></radialGradient>
   <radialGradient id="bg${u}"><stop offset="0" ${bkc(.34,2)}/><stop offset=".6" ${bkc(.12,2)}/><stop offset="1" ${bkc(0,2)}/></radialGradient>
   <linearGradient id="wn${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1814"/><stop offset=".5" stop-color="#0e0c0a"/><stop offset="1" stop-color="#060504"/></linearGradient>
   <linearGradient id="eb${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".25" stop-color="#fff" stop-opacity=".05"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
   <linearGradient id="sp${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
   <linearGradient id="ln${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ebe7da"/><stop offset="1" stop-color="#b7b2a2"/></linearGradient>
   <linearGradient id="tz${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22201b"/><stop offset="1" stop-color="#0b0a08"/></linearGradient>
   <radialGradient id="rl${u}" cx=".35" cy=".3"><stop offset="0" stop-color="#cfcabd"/><stop offset=".6" stop-color="#6d695e"/><stop offset="1" stop-color="#2c2a25"/></radialGradient>
   <clipPath id="sc${u}"><rect x="1" y="1" width="318" height="202" rx="12"/></clipPath>`;
function reelSVG(k,cx,cy,r,type,u){
  const A=(a,s)=>`transform="rotate(${a} ${cx} ${cy})"`;
  const glow=rr=>`<circle cx="${cx}" cy="${cy}" r="${rr}" style="fill:var(--bkc2,#fff0c4);opacity:calc(var(--bk,0)*.85)"/>`;
  let hub='',teeth='';
  if(type==='smooth'){
    /* a solid, smooth hub: machined grooves, a tiny spindle hole and three dimples so the spin still reads */
    hub=`<circle class="hub${k}" cx="${cx}" cy="${cy}" r="14" fill="url(#hb${u})" stroke="#6c675b" stroke-width="1"/>
     <circle cx="${cx}" cy="${cy}" r="12.2" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width=".6"/><circle cx="${cx}" cy="${cy}" r="11.5" fill="none" stroke="#000" stroke-opacity=".13" stroke-width=".6"/>
     <circle cx="${cx}" cy="${cy}" r="8.4" fill="none" stroke="#000" stroke-opacity=".1" stroke-width=".6"/><circle cx="${cx}" cy="${cy}" r="7.7" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width=".5"/>
     <circle cx="${cx}" cy="${cy}" r="5.6" fill="#8f897c"/>${glow(4.4)}<circle cx="${cx}" cy="${cy}" r="4.6" fill="#0b0a09" fill-opacity=".92" stroke="#4a463e" stroke-width=".7"/>
     ${[0,120,240].map(a=>`<g ${A(a)}><circle cx="${cx}" cy="${cy-10}" r="1.5" fill="#000" fill-opacity=".28"/><circle cx="${cx}" cy="${cy-10.3}" r="1.3" fill="#fff" fill-opacity=".55"/></g>`).join('')}
     <path d="M${cx-1.8} ${cy-12.4}L${cx+1.8} ${cy-12.4}L${cx} ${cy-14.6}Z" fill="#c4502f" fill-opacity=".9"/>`;
  }else if(type==='clear'){
    /* a transparent hub: glass ring, six spokes and clear teeth, the tape pack shows through */
    teeth=[0,60,120,180,240,300].map(a=>`<rect x="${cx-2}" y="${cy-8.8}" width="4" height="4.8" rx=".6" fill="#fff" fill-opacity=".88" stroke="#000" stroke-opacity=".35" stroke-width=".35" ${A(a)}/>`).join('');
    hub=`<circle class="hub${k}" cx="${cx}" cy="${cy}" r="14" fill="url(#hc${u})" stroke="#fff" stroke-opacity=".62" stroke-width="1.1"/>
     <circle cx="${cx}" cy="${cy}" r="14.7" fill="none" stroke="#000" stroke-opacity=".5" stroke-width=".7"/>
     <circle cx="${cx}" cy="${cy}" r="12.3" fill="none" stroke="#fff" stroke-opacity=".26" stroke-width=".6"/>
     ${[30,90,150,210,270,330].map(a=>`<rect x="${cx-.95}" y="${cy-13}" width="1.9" height="4.4" fill="#fff" fill-opacity=".5" ${A(a)}/>`).join('')}
     <circle cx="${cx}" cy="${cy}" r="9.6" fill="none" stroke="#fff" stroke-opacity=".78" stroke-width="2.3"/><circle cx="${cx}" cy="${cy}" r="8.5" fill="#050403" fill-opacity=".6"/>${glow(8.2)}${teeth}
     <circle cx="${cx}" cy="${cy-11.6}" r="1.1" fill="#fff" fill-opacity=".9"/>`;
  }else{
    teeth=[0,60,120,180,240,300].map(a=>`<rect x="${cx-2}" y="${cy-8.8}" width="4" height="4.8" rx=".5" fill="#ebe6d9" stroke="#3a3328" stroke-opacity=".55" stroke-width=".35" ${A(a)}/>`).join('');
    hub=`<circle class="hub${k}" cx="${cx}" cy="${cy}" r="14" fill="url(#hb${u})" stroke="#6c675b" stroke-width="1"/>
     <circle cx="${cx}" cy="${cy}" r="12.4" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width=".6"/>
     <circle cx="${cx}" cy="${cy}" r="9.6" fill="#9b9588"/><circle cx="${cx}" cy="${cy}" r="8.8" fill="#0b0a09"/>${glow(8.4)}${teeth}
     <circle cx="${cx}" cy="${cy-11.4}" r="1.4" fill="#6b655a"/>`;
  }
  return `<circle class="pack${k}" cx="${cx}" cy="${cy}" r="${r}" fill="url(#pk${u})" stroke="#5a3d28" stroke-width=".6"/>
   <circle class="edge${k}" cx="${cx}" cy="${cy}" r="${r-.6}" fill="none" style="stroke:var(--bkc,#ffb347);opacity:calc(var(--bk,0)*.75)" stroke-width="1.5"/>
   <g class="reel${k}" transform="rotate(0 ${cx} ${cy})">
    <circle class="ring${k}" cx="${cx}" cy="${cy}" r="${r-4}" fill="none" stroke="#fff" stroke-opacity=".09" stroke-width="1.3" stroke-dasharray="2 6"/>
    <circle cx="${cx}" cy="${cy}" r="15.6" fill="#000" fill-opacity=".34"/>${hub}</g>`;
}
/* the lamp sits behind the tape: a strong wash on the window background (under the reels, so hubs and teeth stay crisp) and a mild bloom on the glass above them */
const bklUnder=u=>`<g class="bkl" style="opacity:var(--bk,0)"><rect x="52" y="92" width="216" height="64" fill="url(#bk${u})"/></g>`;
const bklTop=u=>`<g class="bkl" style="opacity:var(--bk,0)"><circle cx="${CL}" cy="${CY}" r="36" fill="url(#bg${u})"/><circle cx="${CR}" cy="${CY}" r="34" fill="url(#bg${u})"/></g>`;

/* ---- stickers: scotch tape, DEMO stamp, pen ---- */
const NOTES={en:['mix 1998','for K. xx','DON’T ERASE!','best of','side A = slow','road trip','dub #2','rough take','summer ’94','keep!','3 am','radio rip','bedroom demo'],
  ru:['микс 98','для К. xx','НЕ СТИРАТЬ!','лучшее','дубль 2','поездка','черновик','лето ’94','оставить!','3 ночи','с радио','домашнее демо']};
const OLDT={en:['MIX 3','TAPE 2','radio','demo','BEST OF','dub'],ru:['МИКС 3','кассета 2','радио','демо','ЛУЧШЕЕ','копия']};
function tapeStrip(x,y,w,h,rot,R){
  const n=Math.max(3,Math.round(h/2.6)),f=v=>v.toFixed(1);
  let d=`M${f(-w/2)} ${f(-h/2)}H${f(w/2)}`;
  for(let i=1;i<=n;i++)d+=`L${f(w/2+(i%2?1.2:-1)*(.5+R()))} ${f(-h/2+h*i/n)}`;
  d+=`H${f(-w/2)}`;
  for(let i=n-1;i>=0;i--)d+=`L${f(-w/2+(i%2?-1.2:1)*(.5+R()))} ${f(-h/2+h*i/n)}`;
  d+='Z';
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">
   <path d="${d}" fill="#000" fill-opacity=".2" transform="translate(.5 .9)"/>
   <path d="${d}" fill="#f4e7b4" fill-opacity=".36"/><path class="scy" d="${d}" fill="#b98a2e" opacity="0"/>
   <path d="${d}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".5"/>
   <path d="M${f(-w*.12)} ${f(-h/2)}L${f(w*.02)} ${f(h/2)}H${f(w*.16)}L${f(w*.02+w*.14)} ${f(-h/2)}Z" fill="#fff" fill-opacity=".2"/>
   <path d="M${f(-w/2+4)} ${f(-h*.15)}q3 1 5 -1M${f(w/2-9)} ${f(h*.2)}q3 -1 5 1" stroke="#7a6320" stroke-opacity=".35" stroke-width=".5" fill="none"/>
  </g>`;
}
/* the dirty rectangle a peeled-off strip leaves behind */
function tapeGhost(x,y,w,h,rot,R){
  let s='';for(let i=0;i<7;i++){const xx=-w/2+2+R()*(w-4);s+=`M${xx.toFixed(1)} ${(-h/2+R()*2).toFixed(1)}v${(h*(.5+R()*.5)).toFixed(1)}`;}
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" fill="#9c7d3c" fill-opacity=".17"/><path d="${s}" stroke="#5e4518" stroke-opacity=".16" stroke-width=".6" fill="none"/><path d="M${-w/2} ${-h/2}H${w/2}M${-w/2} ${h/2}H${w/2}" stroke="#4d3912" stroke-opacity=".22" stroke-width=".5"/></g>`;
}
/* a hand-drawn star, underline and signature are drawn as strokes, so they look the same on every device and font */
function penStar(x,y,r,rot,col,R){let p=[];for(let i=0;i<10;i++){const a=rot+i*Math.PI/5-Math.PI/2,rr=(i%2?r*.45:r)*(.9+R()*.2);p.push((x+Math.cos(a)*rr).toFixed(1)+' '+(y+Math.sin(a)*rr).toFixed(1));}
  return `<path class="pn" d="M${p.join('L')}Z" fill="none" stroke="${col}" stroke-width=".9" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>`;}
function penLine(x1,x2,y,col,R,w){const m=(x1+x2)/2;return `<path class="pn" d="M${x1.toFixed(1)} ${(y+R()).toFixed(1)}Q${(m-8).toFixed(1)} ${(y-1.6+R()).toFixed(1)} ${m.toFixed(1)} ${(y+.4).toFixed(1)}T${x2.toFixed(1)} ${(y-.8+R()*1.6).toFixed(1)}" fill="none" stroke="${col}" stroke-width="${w||1}" stroke-linecap="round" opacity=".88"/>`;}
function penSig(x,y,w,col,R){const n=5+((R()*3)|0),st=w/n;let d=`M${x} ${y}`,px=x;
  for(let i=0;i<n;i++){const up=3+R()*5,loop=R()<.45;
    d+=loop?`c${(st*.1).toFixed(1)} ${(-up).toFixed(1)} ${(st*.7).toFixed(1)} ${(-up*.9).toFixed(1)} ${(st*.45).toFixed(1)} ${(up*.2).toFixed(1)}c${(-st*.15).toFixed(1)} ${(up*.4).toFixed(1)} ${(st*.35).toFixed(1)} ${(up*.35).toFixed(1)} ${(st*.55).toFixed(1)} ${(-1+R()*2).toFixed(1)}`
      :`c${(st*.25).toFixed(1)} ${(-up).toFixed(1)} ${(st*.5).toFixed(1)} ${(up*.6).toFixed(1)} ${st.toFixed(1)} ${(-1+R()*2).toFixed(1)}`;}
  d+=`M${(x+w*.05).toFixed(1)} ${(y+5.2).toFixed(1)}q${(w*.4).toFixed(1)} ${(-2.4).toFixed(1)} ${(w*.95).toFixed(1)} ${(-1+R()*2).toFixed(1)}`;
  return `<path class="pn" d="${d}" fill="none" stroke="${col}" stroke-width=".95" stroke-linecap="round" stroke-linejoin="round" opacity=".88"/>`;}
function decoSVG(m,side,u,lite){
  const R=cRng(hashId(m.id)^(side?0x9e3779b1:0)),ru=lang==='ru';
  const pen=['#28409a','#28409a','#1b1b1b','#a3231d','#1f4d3a'][(R()*5)|0],ps=hexLum(m.shell[0])<.5?'#f2efe4':'#1c1b19';
  const pool=ru?NOTES.ru:NOTES.en,old=ru?OLDT.ru:OLDT.en,pk=a=>a[(R()*a.length)|0];
  const txt=(s,x,y,fs,rot,col,anc,cls)=>`<text class="${cls||'pn'}" x="${x}" y="${y}" text-anchor="${anc||'start'}" font-family="${PEN_FF}" font-size="${fs}" fill="${col}" textLength="${(s.length*fs*.46).toFixed(1)}" lengthAdjust="spacingAndGlyphs" transform="rotate(${rot.toFixed(1)} ${x} ${y})" opacity=".92">${esc(s)}</text>`;
  let ink='',tape='',stamp='',any=false;
  /* scotch tape: strips that hold the label down, and the smear of one that was peeled off. Rectangular, never round */
  const spots={tl:[26,17,-42],tr:[294,17,40],bot:[160,81,2],lf:[23,48,90],rt:[297,50,90]};
  const ks=Object.keys(spots).map(k=>[R(),k]).sort((a,b)=>a[0]-b[0]).map(a=>a[1]);
  const nT=R()<.55?(R()<.4?2:1):(R()<.3?1:0);
  for(let i=0;i<nT;i++){const s=spots[ks[i]];tape+=tapeStrip(s[0]+(R()-.5)*4,s[1]+(R()-.5)*3,(i?25:30)+R()*10,9+R()*3,s[2]+(R()-.5)*10,R);any=true;}
  if(R()<.4){const s=spots[ks[nT]];tape=tapeGhost(s[0],s[1],26+R()*10,10,s[2]+(R()-.5)*8,R)+tape;any=true;}
  /* DEMO rubber stamp, a little crooked, ink broken up by a noise mask */
  let stR=false;
  if(R()<.34){stR=R()<.5;const sx=stR?236:84,sy=61+R()*3,w=60,h=21,rot=-12+R()*22,ink0=R()<.62?'#c23a2b':'#2f4a9a';
    stamp=(lite?'':`<mask id="stm${u}" maskUnits="userSpaceOnUse" x="-45" y="-20" width="90" height="40"><rect x="-45" y="-20" width="90" height="40" fill="#fff"/><rect x="-45" y="-20" width="90" height="40" fill="url(#nzS)"/></mask>`)+
      `<g class="stp" transform="translate(${sx} ${sy.toFixed(1)}) rotate(${rot.toFixed(1)})" ${lite?'':`mask="url(#stm${u})"`} opacity=".8"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="3" fill="none" stroke="${ink0}" stroke-width="1.9"/><rect x="${-w/2+2.6}" y="${-h/2+2.6}" width="${w-5.2}" height="${h-5.2}" rx="1.4" fill="none" stroke="${ink0}" stroke-width=".6"/>
       <text x="0" y="${(h*.27).toFixed(1)}" text-anchor="middle" font-family="${STAMP_FF}" font-weight="800" font-size="${(h*.66).toFixed(1)}" textLength="${w-16}" lengthAdjust="spacingAndGlyphs" fill="${ink0}">DEMO</text></g>`;any=true;}
  /* pen: notes on the label rules, a crossed-out old title, underline, star, signature, and a paint-pen number on the shell */
  if(R()<.58){ink+=txt(pk(pool),34,56,9.5+R()*1.6,-1.6+R()*1.6,pen);any=true;}
  if(R()<.3){const o=pk(old),fs=8.6,w=o.length*fs*.46;ink+=txt(o,34,67,fs,-.8+R()*1.2,pen)+penLine(33,35+w,64.2,pen,R,.8)+penLine(33,35+w,65.6,pen,R,.7);any=true;}
  if(!stR&&R()<.5){ink+=R()<.5?penSig(210,62,70,pen,R):txt(pk(["3/14","’94","07.96","12/03","’99","5.2."]),288,67,10,-2+R()*3,pen,'end');any=true;}
  if(R()<.34){const nm=sideName(m,side)||'',w=Math.min(228,Math.max(50,nm.length*13));ink+=penLine(160-w/2,160+w/2,50.3,pen,R,1);any=true;}
  if(R()<.2){ink+=penStar(283,35,4.6,R()*.6,pen,R);any=true;}
  if(R()<.6){ink+=txt('#'+String(1+((R()*40)|0)).padStart(2,'0'),286,188,10.5,-10+R()*8,ps,'middle');any=true;}
  else if(R()<.3){let t='';for(let i=0;i<4;i++)t+=`M${24+i*4} 178v${(10+R()*2).toFixed(1)}`;t+='M21 189L40 180';ink+=`<path class="pn" d="${t}" stroke="${ps}" stroke-width=".9" stroke-linecap="round" fill="none" opacity=".85"/>`;any=true;}
  if(!any)ink+=txt(pk(pool),34,56,10,-1,pen);
  return `<g class="deco" pointer-events="none">${stamp}${ink}${tape}</g>`;
}
