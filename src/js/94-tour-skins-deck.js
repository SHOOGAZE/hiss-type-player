/* ---------- tour ---------- */
const TOUR_ICO={
 '▲':'<path d="M12 19V6M6 11l6-6 6 6"/>',
 '＋':'<path d="M12 5v14M5 12h14"/>',
 '◎':'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.6"/><path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20" opacity=".0"/>',
 '4':'<path d="M4 6h16M4 10.7h16M4 15.3h16M4 20h16" opacity=".4"/><path d="M4 6h7M4 10.7h12M4 15.3h5M4 20h10"/>',
 '◐':'<circle cx="8" cy="12" r="3.4"/><circle cx="16" cy="12" r="3.4" opacity=".45"/><path d="M5 19h14"/>',
 '⚙':'<path d="M5 7h5M14 7h5M5 17h9M18 17h1M5 12h1M10 12h9"/><circle cx="12" cy="7" r="2"/><circle cx="16" cy="17" r="2"/><circle cx="8" cy="12" r="2"/>',
 '⟳':'<rect x="3" y="11" width="13" height="8" rx="2"/><path d="M8 6.5a7 7 0 0 1 11 2.5"/><path d="M20 4.5V9h-4.5"/>'
};
const TOUR=[
 ['▲','Swipe the lid up','Swipe up on the glass lid to open the deck. Swipe down to close it again.'],
 ['＋','Load your music','Tap the slot (or ＋ on the shelf) and pick audio from your device. Every file becomes a cassette.'],
 ['◎','Play it like tape','REW, PLAY, FF, STOP and PAUSE work like the real thing. Spin the reels with a finger to scrub. The knobs stop at their limits.'],
 ['4','Record on top','Tap 4TRK, press ARM on a track, close the mixer, then press REC and PLAY. Your new sound lands on that track while the others keep playing. Out of tracks? PING-PONG mixes the rest into the armed one.'],
 ['◐','Change the deck','SKIN swaps the whole deck: six machines with their own look, keys and sound. The longer you play, the more wear it shows. In DECK, LID switches between a closed lid and a see-through window.'],
 ['⚙','Shape the sound','DECK holds tape type, speed, tone, volume, sleep timer and NR (Dolby). TAPE and PITCH bend the sound, LOOP wears the tape out.'],
 ['⟳','Rotate your phone','Landscape shows the cassette full screen with glass controls. Long-press a cassette on the shelf to delete it. BOUNCE saves what you hear as a WAV.']
];
const tourEl=$('#intro');let tourI=0;
function tourPaint(){
  const x=TOUR[tourI];$('#tIco').innerHTML='<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+TOUR_ICO[x[0]]+'</svg>';$('#tTit').textContent=_t(x[1]).toUpperCase();$('#tTxt').textContent=_t(x[2]);
  $('#tDots').innerHTML=TOUR.map((_,i)=>'<i'+(i===tourI?' class="on"':'')+'></i>').join('');
  $('#tSkip').textContent=_t('SKIP');$('#tNext').textContent=tourI===TOUR.length-1?_t('START'):_t('NEXT');
  tourEl.querySelectorAll('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.l===lang));
}
function tourOpen(){tourI=0;tourPaint();tourEl.classList.add('on');}
function tourClose(){tourEl.classList.remove('on');try{localStorage.setItem('tape4.tour1','1');}catch(e){}}
$('#tNext').addEventListener('click',()=>{click('tick');if(tourI>=TOUR.length-1)tourClose();else{tourI++;tourPaint();}});
$('#tSkip').addEventListener('click',()=>{click('up');tourClose();});
tourEl.querySelectorAll('.lang button').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.l)));
$('#dkTour').addEventListener('click',()=>{closeDeck();tourOpen();});
try{if(!localStorage.getItem('tape4.tour1'))setTimeout(tourOpen,500);}catch(e){}
try{if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});}catch(e){}
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)wakeAudio();});
window.addEventListener('pageshow',wakeAudio);window.addEventListener('focus',wakeAudio);
/* ---------- skins ---------- */
const THEMES=[
  {id:'sonic',     name:'SORAKO TC-22',    brand:'SORAKO',  sub:'CASSETTE-CORDER TC-22',  desc:'Japan · silver · black keys',  sw:['#c9ccd1','#2a2b2e','#e5472f']},
  {id:'kami',      name:'KAMIYA CT-40',    brand:'KAMIYA',  sub:'SOFTWALK CT-40',         desc:'Japan · teal shell · lilac keys', sw:['#1a9a82','#d8cce0','#ff8a2a']},
  {id:'nashville', name:'HARLAN M60',      brand:'HARLAN',  sub:'MODEL 60 DECK',          desc:'USA · cream · wood',           sw:['#dcd7c4','#efede8','#d9531e']},
  {id:'kiiro',     name:'KIIRO KR-10',     brand:'KIIRO',   sub:'SPORT CASSETTE PLAYER',  desc:'Japan · yellow plate · rubber', sw:['#f4b90a','#2a2a2d','#ffd62e']},
  {id:'akane',     name:'AKANE AK-1',      brand:'AKANE',   sub:'STEREO CASSETTE PLAYER', desc:'Japan · red metal · cream keys', sw:['#c9261c','#f6f2ea','#ffb347']},
  {id:'kuro',      name:'KURO SR-1',       brand:'KURO',    sub:'SCHOOL RECORDER SR-1',   desc:'Japan · black · red REC',      sw:['#17181a','#2a2b2e','#e33a2a']}
];
const skinGrid=$('#skinGrid'),themesEl=$('#themes');
/* ================= 4-track mixer, ping-pong, flip, J-card ================= */
const mixEl=$('#mixer'),stripsEl=$('#strips'),nameIn=$('#nameIn');
let loadTarget=false;
function saveMeta(){if(cur)dbPut('meta',cur.meta).catch(()=>{});}
const stripEls=[];
function faderPos(i){const m=cur.meta.mix[i],f=stripEls[i].fd,h=f.clientHeight||128;stripEls[i].th.style.top=((1-m.g/1.2)*(h-22))+'px';}
(function(){
  for(let i=0;i<NT;i++){
    const d=document.createElement('div');d.className='st';
    d.innerHTML='<div class="tl">T'+(i+1)+'</div><div class="fw"><div class="fd"><div class="th"></div></div><div class="lv"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div><button class="arm-b" type="button">● ARM</button><button class="mu-b" type="button">MUTE</button><div class="ln">—</div><button class="cl-b" type="button">'+_t('ERASE')+'</button>';
    stripsEl.appendChild(d);
    const r={el:d,fd:d.querySelector('.fd'),lvs:[...d.querySelectorAll('.lv i')],lit:-1,env:0,th:d.querySelector('.th'),arm:d.querySelector('.arm-b'),mu:d.querySelector('.mu-b'),ln:d.querySelector('.ln'),cl:d.querySelector('.cl-b'),sure:0};
    stripEls.push(r);
    const setG=e=>{if(!cur)return;const rc=r.fd.getBoundingClientRect(),y=clamp((e.clientY-rc.top-11)/(rc.height-22),0,1),g=+(1.2*(1-y)).toFixed(3);
      cur.meta.mix[i].g=Math.abs(g-1)<0.04?1:g;faderPos(i);
      if(S.tg[i]&&ctx)S.tg[i].gain.setTargetAtTime(trackLevel(i),ctx.currentTime,0.02);};
    let drag=false;
    r.fd.addEventListener('pointerdown',e=>{drag=true;r.fd.setPointerCapture(e.pointerId);setG(e);click('tick');});
    r.fd.addEventListener('pointermove',e=>{if(drag)setG(e);});
    const up=()=>{if(drag){drag=false;saveMeta();click('up');}};
    r.fd.addEventListener('pointerup',up);r.fd.addEventListener('pointercancel',up);
    r.arm.addEventListener('click',()=>{if(!cur)return;if(S.mode==='rec'){say(_t('RECORDING IN PROGRESS'),1200);return;}
      cur.meta.arm=i;saveMeta();click('down');setTimeout(()=>click('up'),60);renderMixer();});
    r.mu.addEventListener('click',()=>{if(!cur)return;const m=cur.meta.mix[i];m.m=!m.m;saveMeta();click('down');
      if(S.tg[i]&&ctx)S.tg[i].gain.setTargetAtTime(trackLevel(i),ctx.currentTime,0.01);renderMixer();});
    r.cl.addEventListener('click',async()=>{
      if(!cur||!cur.T[i].buf)return;
      if(!r.sure){r.sure=1;r.cl.classList.add('sure');r.cl.textContent=_t('SURE?');clearTimeout(r.st);r.st=setTimeout(()=>{r.sure=0;renderMixer();},2200);click('tick');return;}
      if(S.mode!=='stop')stopTransport();
      cur.T[i]={buf:null,rev:null};await saveTrack(cur,i);saveMeta();r.sure=0;click('big');renderMixer();say(_t('TRACK ')+(i+1)+_t(' ERASED'),1500);
    });
  }
})();
function renderMixer(){
  if(!cur)return;const m=cur.meta;
  $('#mxTitle').textContent=_t('4-TRACK')+' · '+_t('SIDE ')+(cur.side?'B':'A');
  stripEls.forEach((r,i)=>{
    const t=cur.T[i],mx=m.mix[i];
    r.el.classList.toggle('arm',m.arm===i);r.arm.classList.toggle('on',m.arm===i);r.mu.classList.toggle('on',!!mx.m);
    r.ln.textContent=t.buf?fmt(t.buf.duration):_t('empty');
    r.el.classList.toggle('empty',!t.buf);r.sure=0;r.cl.classList.remove('sure');r.cl.textContent=_t('ERASE');r.cl.style.visibility=t.buf?'visible':'hidden';
    faderPos(i);
  });
  const a=m.arm+1;$('#mxLoad').textContent=_t('＋ LOAD INTO T')+a;$('#mxPP').textContent=_t('PING-PONG → T')+a;
  if(document.activeElement!==nameIn)nameIn.value=cur.side?(m.nameB||''):m.name;
  nameIn.placeholder=cur.side?_t('side B name'):_t('cassette name');
  $('#fontBtn').textContent=_t('FONT: ')+(isHand(m)?_t('HAND'):_t('PRINT'));
  nameIn.style.fontFamily=isHand(m)?'':'var(--print)';
  const ag=Math.round(clamp(age()/1.0,0,1.3)*100);
  $('#mxAge').textContent=_t('TAPE WEAR ')+ag+'%'+(loopGen?_t(' · LOOP: ')+loopGen+_t(' PASSES'):'');
}
function openMixer(){
  initAudio();if(!cur){say(_t('INSERT A CASSETTE FIRST'),1800);click('tick');return;}
  mixEl.classList.add('on');click('down');renderMixer();try{if(!localStorage.getItem('tape4.mx1')){localStorage.setItem('tape4.mx1','1');say(_t('ARM A TRACK · THEN REC + PLAY'),3200);}}catch(e){}requestAnimationFrame(renderMixer);
}
$('#mixBtn').addEventListener('click',openMixer);
/* ---------- deck sheet ---------- */
const dkEl=$('#dk'),dkNote=$('#dkNote');
const fmtBal=v=>v===0?'C':(v<0?'L':'R')+Math.abs(Math.round(v*100));
function dkPaint(){
  dkEl.querySelectorAll('.seg').forEach(g=>{const k=g.dataset.k;
    if(k==='lang'){g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===lang));return;}
    const cv=k==='sleep'?(sleepAt?+g.dataset.cur||0:0):D[k];
    g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===cv));});
  dkEl.querySelectorAll('#dkTg button').forEach(b=>b.classList.toggle('on',!!D[b.dataset.t]));
  $('#sTone').value=D.tone*100;$('#oTone').textContent=Math.round(D.tone*100);
  $('#sRec').value=D.rec*100;$('#oRec').textContent=Math.round(D.rec*100);
  $('#sPitch').value=(pitch*100).toFixed(1);$('#oSPitch').textContent=(pitch>0?'+':'')+(pitch*100).toFixed(1)+'%';$('#sVol').value=D.vol*100;$('#oVol').textContent=Math.round(D.vol*100);
  $('#sBal').value=D.bal*100;$('#oBal').textContent=fmtBal(D.bal);
  $('#nrBtn').classList.toggle('on',D.nr>0);

  const m=Math.max(0,Math.round((sleepAt-performance.now())/60000));
  dkNote.textContent=sleepAt?(_t('SLEEP: ~')+m+_t(' MIN')):(D.speed!==1?_t('SPEED ')+(D.speed<1?'½':'2×')+_t(' · RECORDING IS ALWAYS AT 1×'):'');
}
/* printed device data on the closed lid: brand, model and a live spec line (tape type, NR, speed, side, wear) */
const prt=$('#lid .prt'),prtB=prt.children[0],prtS=prt.children[1],prtI=prt.children[2],prtA=prt.children[3];let prtK='';
function updatePrint(){
  if(!document.body.classList.contains('lidc'))return;
  const T=THEMES.find(x=>x.id===theme)||THEMES[0],sd=cur&&cur.side?1:0,w=cur&&cur.meta?Math.round(clamp(cur.meta.wear||0,0,1)*100):0;
  const spec=cur?'TYPE '+TY[D.type].n+' · NR '+NRN[D.nr].replace('DOLBY ','')+' · '+(D.speed<1?'½':D.speed>1?'2×':'1×')+' · WEAR '+w+'%':'NO CASSETTE';
  const k=T.id+spec+sd;if(k===prtK)return;prtK=k;
  prtB.textContent=T.brand;prtS.textContent=T.sub;prtI.textContent=spec;prtA.textContent=sd?'◀ SIDE B':'SIDE A ▶';
}
setInterval(updatePrint,500);
/* library cover: the cassette shelf hides behind a small plastic cover; swipe it down to open, up (or pick a tape) to close */
function libLabel(){const c=document.getElementById('libC');if(!c)return;
  c.querySelector('.la').textContent=libO?'▲':'▼';c.querySelector('b').textContent=_t(libO?'CLOSE LIBRARY':'LIBRARY');
  c.querySelector('.ln').textContent=libO?'':lib.length+' '+_t('CASSETTES');}
function applyLib(){document.body.classList.toggle('libc',!!D.libc);document.body.classList.toggle('libo',libO);libLabel();requestAnimationFrame(()=>requestAnimationFrame(lidFit));}
function libOpen(){if(libO)return;libO=true;applyLib();click('latch');requestAnimationFrame(renderTray);}
function libClose(){if(!libO)return;libO=false;if(typeof setTrayEdit==='function')setTrayEdit(false);applyLib();click('down');}
{const c=$('#libC');let lg=null;
  c.addEventListener('pointerdown',e=>{lg={y:e.clientY,done:false};try{c.setPointerCapture(e.pointerId);}catch(_){}});
  c.addEventListener('pointermove',e=>{if(!lg||lg.done)return;const dy=e.clientY-lg.y;if(!libO&&dy>14){lg.done=true;libOpen();}else if(libO&&dy<-14){lg.done=true;libClose();}});
  ['pointerup','pointercancel'].forEach(ev=>c.addEventListener(ev,e=>{if(lg&&!lg.done&&Math.abs(e.clientY-lg.y)<8){initAudio();(libO?libClose:libOpen)();}lg=null;}));}
/* window shapes of the closed lid, drawn in the old 390x262 portrait lid space and re-mapped onto the real cassette box */
const LID_WIN={
  sonic:'M105 112H285A43 43 0 0 1 328 155V155A43 43 0 0 1 285 198H105A43 43 0 0 1 62 155V155A43 43 0 0 1 105 112Z',
  kami:'M80 155A50 50 0 1 0 180 155A50 50 0 1 0 80 155ZM209 155A50 50 0 1 0 309 155A50 50 0 1 0 209 155Z',
  nashville:'M60 120H330A10 10 0 0 1 340 130V180A10 10 0 0 1 330 190H60A10 10 0 0 1 50 180V130A10 10 0 0 1 60 120Z',
  kiiro:'M70 92H320A26 26 0 0 1 346 118V182A26 26 0 0 1 320 208H70A26 26 0 0 1 44 182V118A26 26 0 0 1 70 92Z',
  akane:'M96 108H294L336 204H54Z',
  kuro:'M39 136H351A5 5 0 0 1 356 141V169A5 5 0 0 1 351 174H39A5 5 0 0 1 34 169V141A5 5 0 0 1 39 136Z'
};
const winBoxC={};
function winBox(d){  /* bounding box of a window path, measured once */
  if(winBoxC[d])return winBoxC[d];
  const n='http://www.w3.org/2000/svg',v=document.createElementNS(n,'svg'),q=document.createElementNS(n,'path');
  v.setAttribute('style','position:absolute;width:0;height:0;visibility:hidden');q.setAttribute('d',d);v.appendChild(q);document.body.appendChild(v);
  let r;try{r=q.getBBox();}catch(e){r={x:0,y:0,width:390,height:262};}v.remove();return(winBoxC[d]={x:r.x,y:r.y,width:r.width,height:r.height});
}
/* landscape variant: same reel centres, smaller radius (shrinking the whole shape would pull the circles off their reels) */
const LID_WIN_T={kami:'M72 155A58 58 0 1 0 188 155A58 58 0 1 0 72 155ZM201 155A58 58 0 1 0 317 155A58 58 0 1 0 201 155Z'};   /* tablets: bigger windows */
const LID_WIN_L={kami:'M86 155A44 44 0 1 0 174 155A44 44 0 1 0 86 155ZM215 155A44 44 0 1 0 303 155A44 44 0 1 0 215 155Z'};
let lidKey='';
function lidMask(){
  const lid=$('#lid'),sl=$('#slot')||$('#empty');if(!lid||!sl)return;
  const bx=e=>({left:e.offsetLeft,top:e.offsetTop,width:e.offsetWidth,height:e.offsetHeight});  /* layout boxes: unaffected by the lid's swipe transform */
  const a=bx(lid);let b=bx(sl);
  if(!b.width){const e=$('#empty');if(e)b=bx(e);}
  if(!a.width||!b.width)return;
  const th0=document.body.dataset.theme,ky=[a.width,a.height,b.left-a.left,b.top-a.top,b.width,th0,innerWidth,getComputedStyle(document.body).getPropertyValue('--sheen')].join('|');
  if(ky===lidKey)return;lidKey=ky;   /* same geometry as last time: skip rebuilding the SVG masks (the costly repaint behind the rotation stutter) */
  const W=a.width,H=a.height,k=b.width/344,m=0.9385*k;           /* 344 = cassette width in the portrait bay, 0.9385 = lid px per viewBox unit */
  const tx=(b.left-a.left)-11*k,ty=(b.top-a.top)-13*k;
  const th=document.body.dataset.theme,tab=W>H&&innerWidth>=900,dl=tab?LID_WIN_T[th]:(W>H&&LID_WIN_L[th]);
  const d=dl||LID_WIN[th]||LID_WIN.sonic;
  const ls=dl?1:(tab?1.2:(W>H?.88:1)),cx=195,cy=155;   /* landscape: windows a little smaller so they clear the key bar and the printed text */
  const ux=v=>cx+(v-cx)/ls,uy=v=>cy+(v-cy)/ls;
  const x0=ux(-tx/m-4),y0=uy(-ty/m-4),x1=ux((W-tx)/m+4),y1=uy((H-ty)/m+4);
  const g=(inner)=>"url(\"data:image/svg+xml,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 "+W.toFixed(1)+" "+H.toFixed(1)+"'>"+inner+"</svg>")+"\")";
  const T="transform='translate("+tx.toFixed(2)+" "+ty.toFixed(2)+") scale("+m.toFixed(4)+") translate("+cx+" "+cy+") scale("+ls+") translate("+(-cx)+" "+(-cy)+")'";
  const mask=g("<path "+T+" fill-rule='evenodd' d='M"+x0+" "+y0+"H"+x1+"V"+y1+"H"+x0+"Z "+d+"'/>");
  const bb=winBox(d),gx=bb.x,gy=bb.y,gw=bb.width,gh=bb.height;
  const sh=+(getComputedStyle(document.body).getPropertyValue('--sheen')||1);
  const rim=g("<defs><linearGradient id='b' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000' stop-opacity='.75'/><stop offset='.5' stop-color='#000' stop-opacity='.25'/><stop offset='.52' stop-color='#fff' stop-opacity='.2'/><stop offset='1' stop-color='#fff' stop-opacity='.85'/></linearGradient>"
    +"<linearGradient id='r' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff' stop-opacity='"+(.3*sh).toFixed(2)+"'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></linearGradient>"
    +"<clipPath id='c'><path d='"+d+"'/></clipPath></defs><g "+T+">"
    +"<path d='"+d+"' fill='none' stroke='#000' stroke-opacity='.4' stroke-width='9'/>"
    +"<path d='"+d+"' fill='none' stroke='url(#b)' stroke-width='5'/>"
    +"<path d='"+d+"' fill='none' stroke='#000' stroke-opacity='.55' stroke-width='1'/>"
    +"<rect clip-path='url(#c)' x='"+gx+"' y='"+gy+"' width='"+gw+"' height='"+(gh*.42).toFixed(1)+"' fill='url(#r)'/>"
    +"<g clip-path='url(#c)'><path d='"+d+"' fill='#bfe0ff' fill-opacity='.07'/>"
    +"<path d='M"+(gx+gw*.12)+" "+(gy+gh)+"L"+(gx+gw*.34)+" "+gy+"H"+(gx+gw*.46)+"L"+(gx+gw*.24)+" "+(gy+gh)+"Z' fill='#fff' fill-opacity='"+(.09*sh).toFixed(2)+"'/>"
    +"<path d='M"+(gx+gw*.5)+" "+(gy+gh)+"L"+(gx+gw*.68)+" "+gy+"H"+(gx+gw*.73)+"L"+(gx+gw*.55)+" "+(gy+gh)+"Z' fill='#fff' fill-opacity='"+(.05*sh).toFixed(2)+"'/></g></g>");
  /* inside of the moulded lid: stiffening rib frame, screw bosses and a raised lip round the window */
  const R=(x,y)=>"<circle cx='"+x+"' cy='"+y+"' r='6' fill='url(#bo)'/><circle cx='"+x+"' cy='"+y+"' r='2.2' fill='#000' fill-opacity='.55'/>";
  const inn=g("<defs><radialGradient id='bo' cx='.35' cy='.3' r='.8'><stop offset='0' stop-color='#fff' stop-opacity='.22'/><stop offset='1' stop-color='#000' stop-opacity='.55'/></radialGradient>"
    +"<linearGradient id='vg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000' stop-opacity='.35'/><stop offset='.25' stop-color='#000' stop-opacity='0'/><stop offset='.8' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.4'/></linearGradient></defs>"
    +"<rect width='"+W.toFixed(1)+"' height='"+H.toFixed(1)+"' fill='url(#vg)'/>"
    +"<rect x='13' y='13' width='"+(W-26).toFixed(1)+"' height='"+(H-39).toFixed(1)+"' rx='12' fill='none' stroke='#000' stroke-opacity='.55' stroke-width='3'/>"
    +"<rect x='13' y='13' width='"+(W-26).toFixed(1)+"' height='"+(H-39).toFixed(1)+"' rx='12' fill='none' stroke='#fff' stroke-opacity='.09' stroke-width='1' transform='translate(0 2)'/>"
    +"<g "+T+"><path d='"+d+"' fill='none' stroke='#000' stroke-opacity='.5' stroke-width='11' stroke-linejoin='round'/><path d='"+d+"' fill='none' stroke='#fff' stroke-opacity='.1' stroke-width='6' stroke-linejoin='round'/><path d='"+d+"' fill='none' stroke='#000' stroke-opacity='.6' stroke-width='1.2'/></g>"
    +R(24,24)+R(W-24,24)+R(24,H-30)+R(W-24,H-30));
  document.body.style.setProperty('--lid-in',inn);
  document.body.style.setProperty('--lid-mask',mask);document.body.style.setProperty('--lid-rim',rim);
}
function applyLid(){document.body.classList.toggle('lidc',!!D.lidc);prtK='';lidMask();updatePrint();}
/* rotation: fix the lid in the very next frame, then once more after iOS has finished resizing (a no-op when nothing changed) */
{let raf=0,mk=0;const sync=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;try{lidMask();lidFit();}catch(e){}});clearTimeout(mk);mk=setTimeout(()=>{try{lidMask();lidFit();}catch(e){}},180);};
 window.addEventListener('resize',sync);window.addEventListener('orientationchange',sync);}
function dkSet(k,v,quiet){
  D[k]=v;saveDeck();if(k==='speed')retune();if(k==='lidc')applyLid();if(k==='libc'){libO=false;applyLib();}
  initAudio();applyDeck();dkPaint();if(!quiet)click('tick');
}
dkEl.querySelectorAll('.seg').forEach(g=>g.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const k=g.dataset.k,v=+b.dataset.v;
  if(k==='lang'){setLang(b.dataset.v);return;}
  if(k==='sleep'){setSleep(v);g.dataset.cur=v;click('tick');dkPaint();return;}
  dkSet(k,v);
  if(k==='type')say(_t('TAPE TYPE ')+TY[D.type].n,1500);if(k==='nr')say(NRN[D.nr],1500);if(k==='speed')say(_t('SPEED ')+(v<1?'½':v>1?'2×':'1×'),1500);
}));
$('#dkTg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.t;dkSet(k,D[k]?0:1);
  say(({auto:'AUTO REVERSE',mem:'MEMORY STOP',cue:'CUE'})[k]+(D[k]?_t(' ON'):_t(' OFF')),1500);});
const sl=(id,k,f)=>$(id).addEventListener('input',e=>{D[k]=f(+e.target.value);saveDeck();initAudio();applyDeck();dkPaint();});
sl('#sTone','tone',v=>v/100);sl('#sRec','rec',v=>v/100);sl('#sVol','vol',v=>v/100);
sl('#sBal','bal',v=>Math.abs(v)<6?0:v/100);
function openDeck(){dkPaint();dkEl.classList.add('on');click('latch');}
function closeDeck(){dkEl.classList.remove('on');click('up');}
$('#dkBtn').addEventListener('click',()=>{initAudio();openDeck();});
$('#dkX').addEventListener('click',closeDeck);
dkEl.addEventListener('pointerdown',e=>{if(e.target===dkEl)closeDeck();});
$('#nrBtn').addEventListener('click',()=>{initAudio();dkSet('nr',(D.nr+1)%3,true);click('down');setTimeout(()=>click('up'),70);say(NRN[D.nr],1500);});


/* 4-TRACK sheet: live level per track, rarely used buttons tucked away */
function mixMeters(pos,t){
  if(!cur||!mixEl.classList.contains('on'))return;
  const run=S.mode==='play'||S.mode==='rec';
  stripEls.forEach((r,i)=>{
    const tr=cur.T[i];let v=0;
    if(tr&&tr.buf&&run){const e=trackEnv(tr);if(e)v=(e[Math.floor(pos/0.05)]||0)*trackLevel(i)*(D.vol>0?1:0)*3.2;}
    r.env+=(Math.min(1,v)-r.env)*(v>r.env?0.6:0.22);
    const n=Math.round(r.env*10);
    if(n!==r.lit){r.lit=n;r.lvs.forEach((el,k)=>el.classList.toggle('on',k<n));}
  });
}
$('#mxMore').addEventListener('click',()=>{const o=$('#mxRare').classList.toggle('on');$('#mxMore').classList.toggle('open',o);click('tick');});

$('#sPitch').addEventListener('input',e=>{const v=+e.target.value/100;pitchK.set(v);$('#oSPitch').textContent=(pitch>0?'+':'')+(pitch*100).toFixed(1)+'%';});
function ledTick(){const gr=$('#grille'),g=$('#gLed');if(!g)return;let m=0;for(const x of vus)if(x.v>m)m=x.v;gr.style.setProperty('--lv',m.toFixed(2));g.classList.toggle('pk',m>0.96);}

applyLid();
applyLib();
