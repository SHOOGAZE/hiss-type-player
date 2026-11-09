/* ---------- lid & bay gestures ---------- */
const bay=$('#bay'),lid=$('#lid'),shade=$('#shade'),glare=$('.glare');
let lidBk=false,bkV='',bkR=false;
const lidPrt=document.querySelector('#lid .prt');
let g=null,lidDrag=false,lidSwiped=0,lidOpenCls=false,uiS=1;
function reelHit(x,y){
  if(!cur)return null;
  for(const k of ['L','R']){const b=cur.refs['hub'+k].getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;
    if(Math.hypot(x-cx,y-cy)<44)return {k,cx,cy};}
  return null;
}
bay.addEventListener('pointerdown',e=>{
  if(g&&performance.now()-g.t0<2500)return;
  if(g)abortGesture();
  initAudio();
  const hit=reelHit(e.clientX,e.clientY);
  if(hit&&lidP>0.96&&cur&&S.mode!=='rec'&&!armed){try{bay.setPointerCapture(e.pointerId);}catch(_){}startScrub(hit,e);return;}
  /* swipe up on the glass opens the lid, swipe down closes it; the lid follows the finger */
  try{bay.setPointerCapture(e.pointerId);}catch(_){}
  g={type:'lid',id:e.pointerId,t0:performance.now(),y0:e.clientY,p0:lidP,moved:false,ly:e.clientY,lt:performance.now(),v:0};
});
bay.addEventListener('pointermove',e=>{
  if(!g||e.pointerId!==g.id)return;
  if(g.type==='scrub'){scrubMove(e);return;}
  const dy=g.y0-e.clientY;
  if(!g.moved&&Math.abs(dy)<8)return;
  g.moved=true;lidDrag=true;
  const now=performance.now(),dt=Math.max(0.005,(now-g.lt)/1000);
  const np=clamp(g.p0+dy/(bay.getBoundingClientRect().height*0.8),0,1);
  g.v=g.v*0.6+((np-lidP)/dt)*0.4;g.lt=now;g.ly=e.clientY;
  lidP=np;lidV=0;
});
function endGesture(e){
  if(!g||e.pointerId!==g.id)return;
  if(g.type==='scrub')endScrub();
  else if(g.type==='lid'&&g.moved){
    lidDrag=false;lidSwiped=performance.now();
    const proj=lidP+clamp(g.v,-6,6)*0.12;
    if(!cur&&proj>0.5){say(_t('NO CASSETTE'),1200);}
    lidT=proj>0.5?1:0;lidV=clamp(g.v,-6,6)*0.5;
  }
  g=null;
}
/* a gesture interrupted by rotation, a system overlay or lost capture must never leave a scrub hanging */
function abortGesture(){
  if(g&&g.type==='scrub')endScrub();
  if(g&&g.type==='lid'&&g.moved){lidDrag=false;lidT=lidP>0.5?1:0;}
  g=null;
}
['orientationchange','blur'].forEach(ev=>window.addEventListener(ev,abortGesture));
document.addEventListener('visibilitychange',abortGesture);
try{matchMedia('(orientation:portrait)').addEventListener('change',abortGesture);}catch(e){}
bay.addEventListener('lostpointercapture',e=>{if(g&&e.pointerId===g.id)endGesture(e);});
bay.addEventListener('pointerup',endGesture);
bay.addEventListener('pointercancel',endGesture);
bay.addEventListener('click',()=>{
  if(performance.now()-lidSwiped<400)return;
  if(lidP>0.85){if(cur&&lsQ.matches)return;   /* landscape: a tap only wakes the controls */
    initAudio();loadTarget=false;if(cur)ejectTape();else fileInp.click();}
});
function lidStep(dt){
  if(!lidDrag){
    const k=170,c=17,a=k*(lidT-lidP)-c*lidV;
    lidV+=a*dt;lidP+=lidV*dt;
    if(lidP>1){lidP=1;lidV=lidV>0?-lidV*0.3:0;}
    if(lidP<0){const vin=-lidV;lidP=0;lidV=Math.max(0,vin*0.3);if(vin>0.4&&lidT===0)thunk(clamp(vin/4,0.25,1));}
    if(Math.abs(lidV)<0.01&&Math.abs(lidT-lidP)<0.002){lidP=lidT;lidV=0;}
  }
  if(lidPrev<=0.06&&lidP>0.06){
    click('latch');
    if(!document.body.classList.contains('seen')){document.body.classList.add('seen');try{localStorage.setItem('tape4.seen','1');}catch(e){}}
    if(scr){endScrub();}
    if(S.mode!=='stop'||armed)stopTransport();
  }
  if(lidPrev<0.999&&lidP>=0.999)click('down');
  lidPrev=lidP;
  lid.style.transform='rotateX('+(lidP*lidA).toFixed(2)+'deg)';
  {const bk=lidP*lidA>90;if(bk!==lidBk){lidBk=bk;lid.classList.toggle('bk',bk);}}   /* past edge-on we see the inside of the lid: dark plastic */
  lidPrt.style.opacity=lidP>0.55?clamp(1-(lidP-0.55)/0.3,0,1).toFixed(2):'';   /* print fades out before the lid passes edge-on (its back side would show mirrored) */
  shade.style.opacity=(0.5*Math.sin(Math.PI*clamp(lidP,0,1))).toFixed(3);
  glare.style.transform='translateX('+((lidP*140)-30).toFixed(1)+'px)';
  /* window backlight: lit while the lid is closed (a little dimmer at rest, full while the tape runs), fades out as the lid lifts; red while recording */
  {const run=S.mode!=='stop'&&S.mode!=='pause',on=cur?clamp(1-lidP*2.2,0,1)*(run?1:.82):0,v=on.toFixed(2);
   if(v!==bkV){bkV=v;slot.style.setProperty('--bk',v);}
   const r=S.mode==='rec';if(r!==bkR){bkR=r;slot.classList.toggle('rec',r);}}
  /* the shelf dims/undims only once the lid has settled: flipping this mid-motion restyled every tile on the same frame */
  if(lidP===lidT){const o=lidT===1;if(o!==lidOpenCls){lidOpenCls=o;document.body.classList.toggle('open',o);}}
}

/* ---------- scrub ---------- */
function startScrub(hit,e){
  const p=getPos();
  scr={hit,last:Math.atan2(e.clientY-hit.cy,e.clientX-hit.cx),lastT:performance.now(),v:0,vt:performance.now(),prev:S.mode,dir:0,audioPos:p};
  killSource();S.off=p;S.mode='scrub';
  g={type:'scrub',t0:performance.now(),id:e.pointerId};
  updateMotor();renderKeys();say(_t('SCRUB'),700);click('tick');
}
function scrubMove(e){
  if(!scr||!cur)return;
  const a=Math.atan2(e.clientY-scr.hit.cy,e.clientX-scr.hit.cx);
  let d=a-scr.last;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;scr.last=a;
  const r=scr.hit.k==='L'?cur.rL:cur.rR,dpos=-d*r/V;
  const now=performance.now(),dt=Math.max(0.004,(now-scr.lastT)/1000);scr.lastT=now;
  const np=clamp(S.off+dpos,0,cur.dur),real=np-S.off;S.off=np;
  scr.v=scr.v*0.6+(real/dt)*0.4;scr.vt=now;
}
function scrubTick(dt,now){
  if(!scr||!ctx||!cur)return;
  if(now-scr.vt>70)scr.v*=Math.exp(-dt*25);
  const v=scr.v,mag=Math.abs(v),dir=v>0?1:-1,n=ctx.currentTime;
  if(mag<0.05){A.scrG.gain.setTargetAtTime(0,n,0.02);if(S.src)killSource();scr.dir=0;return;}
  const r=clamp(mag,0.05,8);
  if(!S.src||scr.dir!==dir){startSource(S.off,r,dir<0);scr.dir=dir;scr.audioPos=S.off;}
  else{
    setRates(r,0.03);scr.audioPos+=dir*r*dt;
    if(Math.abs(scr.audioPos-S.off)>0.25){startSource(S.off,r,dir<0);scr.audioPos=S.off;}
  }
  A.scrG.gain.setTargetAtTime(1,n,0.02);
}
function endScrub(){
  if(!scr)return; const prev=scr.prev;scr=null;
  if(ctx){killSource();A.scrG.gain.setTargetAtTime(1,ctx.currentTime,0.01);}
  S.mode='stop';updateMotor();renderKeys();
  if(prev==='play')go('play');
}

/* first run: until the lid has been opened once, it gives a small nudge now and then */
try{if(localStorage.getItem('tape4.seen'))document.body.classList.add('seen');}catch(e){}
setInterval(()=>{
  if(document.body.classList.contains('seen')||g||lidT!==0||lidP>0.01||S.mode!=='stop'||document.querySelector('#intro.on,#mixer.on,#dk.on,#themes.on'))return;
  lidT=0.05;setTimeout(()=>{if(!g&&lidT===0.05)lidT=0;},380);
},7000);

/* how far the lid may fold back: it needs free space above the window; when the library is open (or the screen is short) the flap is laid flatter so it never covers the knobs */
function lidFit(){
  try{
    const bay=document.getElementById('bay');if(!bay||getComputedStyle(document.getElementById('panel')).display==='none'){lidA=100;return;}
    let low=0;['knPitch','knTape'].forEach(id=>{const r=document.getElementById(id).getBoundingClientRect();if(r.height&&r.bottom>low)low=r.bottom;});
    const r=document.querySelector('#ctl .duo').getBoundingClientRect();if(r.height&&r.bottom>low)low=r.bottom;
    const gap=bay.getBoundingClientRect().top-low;
    lidA=+clamp(90+(gap-14)/(58-14)*10,90,100).toFixed(1);
  }catch(e){lidA=100;}
}
setTimeout(lidFit,300);
