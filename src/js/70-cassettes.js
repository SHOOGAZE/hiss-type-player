/* ---------- track storage ---------- */
async function saveTrack(c,n){
  const t=c.T[n],k=trKey(c.meta.id,c.side,n);
  if(t.buf)await dbPut('data',{id:k,buf:toWav(t.buf),type:'audio/wav'}); else await dbDel('data',k);
  setDur(c);
}
async function loadSide(m,side){
  const T=[];
  for(let n=0;n<NT;n++){
    let buf=null;
    try{const d=await dbGet('data',trKey(m.id,side,n));if(d&&d.buf)buf=await decodeBuf(d.buf.slice(0));}catch(e){}
    T.push({buf,rev:null});
  }
  return T;
}
function defaults(m){
  if(!m.mix)m.mix=[0,1,2,3].map(()=>({g:1,m:false,p:0}));
  if(typeof m.wear!=='number')m.wear=0;
  if(typeof m.arm!=='number')m.arm=0;
}
const sideName=(m,side)=>side?(m.nameB||'SIDE B'):m.name;
const curName=()=>sideName(cur.meta,cur.side);
/* ---------- cassettes ---------- */
const slot=$('#slot'),emptyEl=$('#empty'),trayEl=$('#tray'),fileInp=$('#file');
function teeth(cx,cy){let s='';for(let i=0;i<6;i++)s+=`<rect x="${cx-2}" y="${cy-8.8}" width="4" height="4.6" fill="#e5e0d3" transform="rotate(${i*60} ${cx} ${cy})"/>`;return s;}
function reelSVG(k,cx,cy,r){
  return `<g class="reel${k}" transform="rotate(0 ${cx} ${cy})">
   <circle class="pack${k}" cx="${cx}" cy="${cy}" r="${r}" fill="url(#pk)" stroke="#5a3d28" stroke-width=".6"/>
   <circle class="ring${k}" cx="${cx}" cy="${cy}" r="${r-4}" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="1.3" stroke-dasharray="2 6"/>
   <circle class="hub${k}" cx="${cx}" cy="${cy}" r="14" fill="#e5e0d3" stroke="#8d877b" stroke-width="1.2"/>
   <circle cx="${cx}" cy="${cy}" r="8.8" fill="#0b0a09"/>${teeth(cx,cy)}
   <circle cx="${cx}" cy="${cy-11.4}" r="1.4" fill="#6b655a"/></g>`;
}
const COND="'Avenir Next Condensed','DIN Condensed','Helvetica Neue','Arial Narrow','Roboto Condensed',sans-serif";
const PFF={kuro:COND,sonic:"'Helvetica Neue',Helvetica,Arial,sans-serif",kami:"'Arial Rounded MT Bold','Avenir Next Rounded','Avenir Next',sans-serif",
  kiiro:"Menlo,'Courier New',ui-monospace,monospace",akane:"'DIN Condensed','Avenir Next Condensed','Arial Narrow',sans-serif",nashville:"'American Typewriter','Courier New',Courier,serif"};
const PW={kuro:.46,sonic:.62,kami:.62,kiiro:.62,akane:.46,nashville:.68},PS={kuro:2.4,sonic:1.6,kami:1.2,kiiro:.8,akane:2.6,nashville:1.2},PWT={kuro:600,sonic:500,kami:400,kiiro:500,akane:600,nashville:600};
const printFF=()=>PFF[theme]||COND;
const HAND_FF="'Bradley Hand','Noteworthy','Marker Felt','Segoe Print',cursive";
const isHand=m=>m.font==='hand';
/* print caps top out at 19 (they used to reach 26 and shouted); handwriting has a small x-height, so it gets a larger size to match */
function labFs(n,print){return print?clamp(Math.floor(236/(Math.max(1,n.length)*((PW[theme]||.5)+(PS[theme]||2)/22))),11,19):(n.length>22?16:n.length>15?20:25);}
function labTxt(m,t){return isHand(m)?t:t.toUpperCase();}
/* paper grain: one pre-rendered noise tile shared by every cassette (no per-frame SVG filter) */
(function(){
  const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d'),im=x.createImageData(96,96);
  for(let i=0;i<im.data.length;i+=4){const v=120+Math.random()*100|0;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=Math.random()*110|0;}
  x.putImageData(im,0,0);
  const d=document.createElement('div');d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML='<svg width="0" height="0"><defs><pattern id="nzG" width="96" height="96" patternUnits="userSpaceOnUse"><image href="'+c.toDataURL()+'" width="96" height="96"/></pattern></defs></svg>';
  document.body.appendChild(d);
})();
/* ---- visible wear: scratches, label stains, lifted corners, fading ink. Everything is seeded by the cassette id,
   so a given cassette always ages in the same places; `data-t` is the wear level at which a mark starts to appear. ---- */
function wearGfx(m){
  let h=0;for(const c of m.id)h=(h*31+c.charCodeAt(0))>>>0;
  const R=()=>{h=(h*1664525+1013904223)>>>0;return h/4294967296;};
  let s='';
  for(let i=0;i<16;i++){            /* hairline scratches over the shell */
    const x=8+R()*304,y=8+R()*188,l=6+R()*26,a=(R()-.5)*1.6,t=(i/16*.8).toFixed(2);
    s+=`<path data-t="${t}" data-m=".55" d="M${x.toFixed(1)} ${y.toFixed(1)}l${(Math.cos(a)*l).toFixed(1)} ${(Math.sin(a)*l).toFixed(1)}" stroke="#fff" stroke-width=".5" stroke-linecap="round" opacity="0"/>`;
  }
  for(let i=0;i<10;i++){            /* dark scuffs and specks */
    const x=10+R()*300,y=10+R()*184,r=.5+R()*1.5,t=(.15+i/10*.7).toFixed(2);
    s+=`<circle data-t="${t}" data-m=".45" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#000" opacity="0"/>`;
  }
  for(let i=0;i<5;i++){             /* tea-coloured stains soaking into the paper label */
    const x=34+R()*252,y=24+R()*56,r=6+R()*14,t=(.2+i*.13).toFixed(2);
    s+=`<ellipse data-t="${t}" data-m=".28" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r*.55).toFixed(1)}" fill="#8a5a1c" opacity="0"/>`;
  }
  for(let i=0;i<9;i++){             /* fine scratches on the window glass */
    const x=60+R()*200,y=96+R()*54,l=8+R()*30,a=(R()-.5)*.9,t=(.1+i/9*.8).toFixed(2);
    s+=`<path data-t="${t}" data-m=".5" d="M${x.toFixed(1)} ${y.toFixed(1)}l${(Math.cos(a)*l).toFixed(1)} ${(Math.sin(a)*l).toFixed(1)}" stroke="#fff" stroke-width=".4" opacity="0"/>`;
  }
  s+=`<path data-t=".45" data-m=".7" d="M22 76l12 12H22z" fill="#000" opacity="0"/><path data-t=".6" data-m=".6" d="M298 12l-14 0 14 14z" fill="#e9dfc6" opacity="0"/>`; /* curled label corners */
  return `<g class="wear" pointer-events="none">${s}</g>`;
}
function applyWear(root,a){
  if(!root)return;a=clamp(a||0,0,1.3);
  root.querySelectorAll('.wear [data-t]').forEach(e=>{const t=+e.dataset.t,m=+e.dataset.m;e.setAttribute('opacity',(clamp((a-t)/0.22,0,1)*m).toFixed(3));});
  const ink=(1-clamp(a,0,1)*0.55).toFixed(3);
  root.querySelectorAll('.nm,.tp,.nrt,.du').forEach(e=>{e.style.opacity=e.classList.contains('nm')?ink:(ink*0.85).toFixed(3);});
  const tint=root.querySelector('.tint');if(tint)tint.setAttribute('opacity',Math.min(0.55,a*0.45).toFixed(3));
}
function cassSVG(m,uidk,side,lite){
  side=side||0;const nm0=sideName(m,side);
  const name=nm0.length>30?nm0.slice(0,29)+'…':nm0;
  const hd=isHand(m),fs=labFs(name,!hd);
  const est=name.length*((PW[theme]||.5)+(PS[theme]||2)/22)*fs,tl=(!hd&&est>205)?' textLength="224" lengthAdjust="spacingAndGlyphs"':'';
  const d0=side?m.durB:m.dur,dur=d0?fmt(d0):'--:--';
  const mn='ui-monospace,Menlo,monospace';
  const bolt=(x,y)=>`<circle cx="${x}" cy="${y}" r="5.2" fill="#0c0b0a" opacity=".55"/><circle cx="${x}" cy="${y}" r="4.3" fill="url(#bl${uidk})" stroke="#000" stroke-opacity=".6" stroke-width=".6"/><path d="M${x-3} ${y} H${x+3} M${x} ${y-3} V${y+3}" stroke="#000a" stroke-width=".9" transform="rotate(${(x*7+y*3)%80} ${x} ${y})"/>`;
  let rules='';for(let y=56;y<=80;y+=12)rules+=`<line x1="34" x2="286" y1="${y}" y2="${y}" stroke="#2a3a5a" stroke-opacity=".22"/>`;
  const tape60=Math.max(10,Math.round(((d0||2400)/60)/5)*5);
  return `<svg viewBox="0 0 320 204" xmlns="http://www.w3.org/2000/svg">
  <defs>
   <linearGradient id="sh${uidk}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m.shell[0]}"/><stop offset="1" stop-color="${m.shell[1]}"/></linearGradient>
   <linearGradient id="gl${uidk}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".16" stop-color="#fff" stop-opacity=".06"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
   <linearGradient id="lg${uidk}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".07" stop-color="#000" stop-opacity="0"/><stop offset=".93" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
   <radialGradient id="bl${uidk}" cx=".35" cy=".3"><stop offset="0" stop-color="#8c8a85"/><stop offset=".7" stop-color="#3a3935"/><stop offset="1" stop-color="#1c1b19"/></radialGradient>
   <clipPath id="wc${uidk}"><rect x="52" y="92" width="216" height="64" rx="32"/></clipPath>
   <radialGradient id="pk"><stop offset="0" stop-color="#2c1c12"/><stop offset=".82" stop-color="#3b271a"/><stop offset="1" stop-color="#1e130c"/></radialGradient>
  </defs>
  <rect x="1" y="1" width="318" height="202" rx="12" fill="url(#sh${uidk})" stroke="#000" stroke-opacity=".65"/>
  <rect x="1" y="1" width="318" height="202" rx="12" fill="url(#gl${uidk})"/>
  <rect x="3.5" y="3.5" width="313" height="197" rx="9.5" fill="none" stroke="#fff" stroke-opacity=".2"/>
  <rect x="6" y="6" width="308" height="192" rx="8" fill="none" stroke="#000" stroke-opacity=".16"/>
  <path d="M3 94 H317" stroke="#000" stroke-opacity=".14"/><path d="M3 95.2 H317" stroke="#fff" stroke-opacity=".1"/>
  <rect x="56" y="1.5" width="18" height="4.5" rx="1" fill="#000" opacity=".5"/><rect x="246" y="1.5" width="18" height="4.5" rx="1" fill="#000" opacity=".5"/>
  ${bolt(13,13)}${bolt(307,13)}${bolt(13,191)}${bolt(307,191)}${bolt(160,191)}
  <rect x="22" y="13" width="276" height="76" rx="5" fill="#000" opacity=".28" transform="translate(0 1.5)"/>
  <rect x="22" y="12" width="276" height="76" rx="5" fill="${m.paper}"/>
  ${lite?'':'<rect x="22" y="12" width="276" height="76" rx="5" fill="url(#nzG)" opacity=".5"/>'}
  <rect x="22" y="12" width="276" height="76" rx="5" fill="url(#lg${uidk})"/>
  <path d="M22 17a5 5 0 0 1 5-5h266a5 5 0 0 1 5 5v9H22z" fill="${m.stripe}"/>
  <path d="M22 26H298" stroke="#000" stroke-opacity=".18"/>
  <rect class="tint" x="22" y="12" width="276" height="76" rx="5" fill="#a8741f" opacity="0"/>
  <text x="30" y="22.5" font-family="${mn}" font-size="8" font-weight="700" letter-spacing="2" fill="${m.paper}">SIDE ${side?'B':'A'}</text>
  <text x="160" y="22.5" text-anchor="middle" font-family="${mn}" font-size="6" font-weight="700" letter-spacing="2.4" fill="${m.paper}" opacity=".85">C-${tape60}</text>
  <text class="du" x="290" y="22.5" text-anchor="end" font-family="${mn}" font-size="8" font-weight="700" letter-spacing="2" fill="${m.paper}">${dur}</text>
  ${rules}
  <text class="nm" x="160" y="53" text-anchor="middle"${tl} font-size="${fs}" fill="${m.pen}" font-family="${hd?HAND_FF:printFF()}" font-weight="${hd?400:(PWT[theme]||600)}" letter-spacing="${hd?0:(PS[theme]||2)}" transform="rotate(${hd?m.rot:0} 160 50)">${esc(labTxt(m,name))}</text>
  <text class="tp" x="30" y="84" font-family="${mn}" font-size="5.4" letter-spacing="1.3" font-weight="700" fill="${m.pen}" opacity=".8">TYPE ${TY[D.type].n} · ${TY[D.type].bias} · ${TY[D.type].eq}</text>
  <text class="nrt" x="290" y="84" text-anchor="end" font-family="${mn}" font-size="5.4" letter-spacing="1.3" font-weight="700" fill="${m.pen}" opacity=".8">NR ▸ ${NRN[D.nr]}</text>
  <rect x="48" y="88" width="224" height="72" rx="36" fill="#000" opacity=".3"/>
  <rect x="52" y="92" width="216" height="64" rx="32" fill="#0b0a09" stroke="#000"/>
  <g clip-path="url(#wc${uidk})">${reelSVG('L',CL,CY,26)}${reelSVG('R',CR,CY,20)}</g>
  <rect x="52.5" y="92.5" width="215" height="63" rx="31.5" fill="none" stroke="#fff" stroke-opacity=".16"/>
  <path d="M60 100 Q160 88 262 100 L262 112 Q160 100 60 112Z" fill="#fff" opacity=".08"/>
  <path d="M70 204 L84 166 H236 L250 204Z" fill="#14130f" stroke="#000"/>
  <path d="M84 166 H236" stroke="#fff" stroke-opacity=".12"/>
  <path d="M${CL-22} ${CY+24} L88 169 M${CR+17} ${CY+18} L232 169" stroke="#4a3322" stroke-width="1.4" fill="none" opacity=".9"/>
  <rect x="96" y="188" width="128" height="3" fill="#3b2a1c"/><rect x="96" y="188" width="128" height="1" fill="#fff" opacity=".12"/>
  <circle cx="110" cy="180" r="6" fill="#000"/><circle cx="110" cy="180" r="4.4" fill="none" stroke="#6b655a" stroke-width="1"/>
  <circle cx="210" cy="180" r="6" fill="#000"/><circle cx="210" cy="180" r="4.4" fill="none" stroke="#6b655a" stroke-width="1"/>
  <rect x="146" y="173" width="28" height="13" rx="2" fill="#000"/><rect x="150" y="176" width="20" height="5" rx="1" fill="#8d877b"/><rect x="150" y="176" width="20" height="1.5" fill="#fff" opacity=".35"/>
  <circle cx="90" cy="196" r="2" fill="#000"/><circle cx="230" cy="196" r="2" fill="#000"/>
  ${wearGfx(m)}
  </svg>`;
}
function buildCassette(m,side){
  const el=document.createElement('div');el.className='cass enter';
  el.innerHTML=cassSVG(m,m.id.slice(0,5),side);applyWear(el,m.wear);
  const q=s=>el.querySelector(s);
  return {el,refs:{reelL:q('.reelL'),reelR:q('.reelR'),packL:q('.packL'),packR:q('.packR'),ringL:q('.ringL'),ringR:q('.ringR'),hubL:q('.hubL'),hubR:q('.hubR'),nm:q('.nm'),du:q('.du'),tint:q('.tint')}};
}
function ejectCur(){
  if(!cur)return; if(ctx)killSource();loopGen=0; const el=cur.el; el.classList.remove('enter');el.classList.add('leave');setTimeout(()=>el.remove(),320);
  cur=null;emptyEl.style.opacity=1;
}
function ejectTape(){
  if(!cur||busy)return;
  if(lidP<0.5){say(_t('OPEN THE LID — SWIPE UP'),1800);click('tick');return;}
  if(S.mode!=='stop')stopTransport();
  mixEl.classList.remove('on');saveMeta();ejectCur();renderTray();
  S.off=0;lastPos=0;click('eject');say(_t('CASSETTE REMOVED'),1600);
}
async function insert(id){
  if(busy)return; const m=lib.find(x=>x.id===id); if(!m)return;
  if(lidP<0.5){say(_t('OPEN THE LID — SWIPE UP'),2000);return;}
  if(cur&&cur.meta.id===id){ejectTape();return;}
  busy=true;initAudio();
  try{
    stopTransport();ejectCur();renderTray();say(_t('LOADING…'),99999);
    const d=await dbGet('data',id); if(!d)throw new Error('nodata');
    defaults(m);
    const T=await loadSide(m,0);
    if(!T[0].buf)throw new Error('decode');
    m.dur=T[0].buf.duration;
    const c=buildCassette(m,0);slot.appendChild(c.el);
    cur={meta:m,T,side:0,dur:0,el:c.el,refs:c.refs,aL:0,aR:0,rL:26,rR:20};setDur();dbPut('meta',m).catch(()=>{});
    paintAge(true);
    S.off=0;lastPos=0;cntZero=0;emptyEl.style.opacity=0;
    click('insert');say('',0);renderTray();
  }catch(e){say(_t('COULD NOT DECODE'),2800);}
  finally{busy=false;}
}
async function addFiles(files){
  initAudio();let first=null,n=0;
  for(const f of files){
    try{
      say(_t('READING FILE…'),99999);
      const ab=await f.arrayBuffer();
      let dur=0;
      try{dur=(await decodeBuf(ab.slice(0))).duration;}catch(e){say(_t('NOT AUDIO: ')+(f.name||_t('file')).slice(0,22),2800);continue;}
      const m={id:uid(),name:'untitled',
        shell:pick(SHELLS),paper:pick(PAPERS),stripe:pick(STRIPES),pen:pick(PENS),rot:+rnd(-1.6,1.6).toFixed(2),dur,created:Date.now()+n};
      await dbPut('data',{id:m.id,buf:ab,type:f.type});await dbPut('meta',m);
      lib.push(m);if(!first)first=m;n++;
    }catch(e){say(_t('COULD NOT READ FILE'),2500);}
  }
  renderTray();
  if(first){ if(lidP>0.5)await insert(first.id); else say(_t('CASSETTES ADDED: ')+n,2200); }
  else if(!n)setTimeout(()=>{if(performance.now()>msgUntil)say('',0);},0);
}
async function removeTape(m){
  if(cur&&cur.meta.id===m.id){stopTransport();ejectCur();}
  lib=lib.filter(x=>x.id!==m.id);
  try{await dbDel('meta',m.id);for(let sd=0;sd<2;sd++)for(let n=0;n<NT;n++)await dbDel('data',trKey(m.id,sd,n));}catch(e){}
  renderTray();click('big');say(_t('CASSETTE DELETED'),1500);
}
function setTrayEdit(on){
  trayEl.classList.toggle('edit',!!on);
  if(on){click('latch');say(_t('DELETE MODE: TAP A CASSETTE'),2500);}
}
document.addEventListener('pointerdown',e=>{if(trayEl.classList.contains('edit')&&!e.target.closest('#tray'))setTrayEdit(false);},true);
function renderTray(){
  try{libLabel();}catch(e){}
  trayEl.innerHTML='';
  if(!lib.length)trayEl.classList.remove('edit');
  const add=document.createElement('div');add.className='mini add';add.innerHTML='<b>+</b><small>'+_t('LOAD')+'</small>';
  add.addEventListener('click',()=>{initAudio();loadTarget=false;fileInp.click();});trayEl.appendChild(add);
  const rank=new Map([...lib].sort((a,b)=>a.created-b.created).map((m,i)=>[m.id,i+1]));
  [...lib].sort((a,b)=>b.created-a.created).forEach(m=>{
    const d=document.createElement('div');d.className='mini'+(cur&&cur.meta.id===m.id?' on':'');
    d.style.setProperty('--hi',m.shell[0]);d.style.setProperty('--lo',m.shell[1]);
    d.innerHTML=cassSVG(m,'t'+m.id.replace(/\W/g,''),0,true)+`<em class="tg">#${rank.get(m.id)}${m.dur?' · '+fmt(m.dur):''}</em><b class="x"></b>`;applyWear(d,m.wear);
    let tm=null,lp=false,sx=0,sy=0;
    d.addEventListener('pointerdown',e=>{lp=false;sx=e.clientX;sy=e.clientY;clearTimeout(tm);if(e.target.closest('.x'))return;tm=setTimeout(()=>{lp=true;setTrayEdit(true);},600);});
    d.addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-sx,e.clientY-sy)>8)clearTimeout(tm);});
    ['pointerup','pointercancel','pointerleave'].forEach(ev=>d.addEventListener(ev,()=>clearTimeout(tm)));
    const xb=d.querySelector('.x');let xt=null;
    const TRASH='<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>';
    const xset=sure=>{xb.classList.toggle('sure',sure);xb.innerHTML=TRASH+'<span>'+(sure?_t('SURE?'):_t('DELETE'))+'</span>';};xset(false);
    xb.addEventListener('click',e=>{e.stopPropagation();
      if(!xb.classList.contains('sure')){xset(true);click('tick');clearTimeout(xt);xt=setTimeout(()=>xset(false),2500);return;}
      removeTape(m);});
    d.addEventListener('click',()=>{if(lp){lp=false;return;}if(trayEl.classList.contains('edit')){setTrayEdit(false);return;}initAudio();if(D.libc&&libO&&cur&&cur.meta.id===m.id){libClose();return;}insert(m.id);if(D.libc&&libO&&lidP>=0.5)setTimeout(libClose,380);});
    trayEl.appendChild(d);
  });
  /* always two rows: a taller shelf pushed the whole panel down. More tapes scroll inside the shelf */
  const rows=2,cells=rows*4;
  for(let i=lib.length+1;i<cells;i++){const g=document.createElement('div');g.className='mini ghost';
    g.addEventListener('click',()=>{if(trayEl.classList.contains('edit')){setTrayEdit(false);return;}initAudio();loadTarget=false;fileInp.click();});trayEl.appendChild(g);}
  requestAnimationFrame(()=>{const t=trayEl.querySelector('.mini');if(t){const h=t.getBoundingClientRect().height/uiS;if(h>8)trayEl.style.setProperty('--trayMax',Math.round(rows*h+(rows-1)*8+12)+'px');}
    const on=trayEl.querySelector('.mini.on');if(on&&!trayEl.classList.contains('edit')){const top=on.offsetTop,bot=top+on.offsetHeight;if(top<trayEl.scrollTop)trayEl.scrollTop=top-6;else if(bot>trayEl.scrollTop+trayEl.clientHeight)trayEl.scrollTop=bot-trayEl.clientHeight+6;}});
}
let rzT=0;window.addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(()=>{if(typeof renderTray==='function')renderTray();},120);});
fileInp.addEventListener('change',()=>{wakeAudio();const fl=[...fileInp.files];if(!fl.length)return;
  if(loadTarget&&cur){loadTarget=false;loadIntoTrack(fl[0]).finally(()=>{fileInp.value='';});return;}
  loadTarget=false;addFiles(fl).finally(()=>{fileInp.value='';});});
