/* ---------- frame ---------- */
const lMode=$('#lMode'),lTime=$('#lTime'),lName=$('#lName'),recLed=$('#recLed');
const MODES={stop:'STOP',play:'PLAY',pause:'PAUSE',ff:'FF >>',rew:'<< REW',rec:'REC',scrub:'SCRUB'};
let rfN=0,lidMoving=false,lastT=0,cache={m:'',t:'',n:''};
function updateReels(pos){
  if(!cur)return;
  const p=cur.dur>0?clamp(pos/cur.dur,0,1):0,dp=pos-lastPos;lastPos=pos;
  const rr=a=>Math.sqrt(RMIN*RMIN+(RMAX*RMAX-RMIN*RMIN)*a),rL=rr(1-p),rR=rr(p);
  /* hub has 6-fold symmetry: a step past ~30deg/frame reads as spinning backwards (wagon-wheel), so FF/REW is capped at 24deg/frame */
  const cs=x=>Math.max(-24,Math.min(24,x));
  cur.aL-=cs(dp*V/rL*57.2958);cur.aR-=cs(dp*V/rR*57.2958);
  if(Math.abs(rL-cur.rL)>0.04){cur.rL=rL;cur.refs.packL.setAttribute('r',rL.toFixed(2));cur.refs.edgeL.setAttribute('r',(rL-.6).toFixed(2));cur.refs.ringL.setAttribute('r',Math.max(rL-4,15).toFixed(2));}
  if(Math.abs(rR-cur.rR)>0.04){cur.rR=rR;cur.refs.packR.setAttribute('r',rR.toFixed(2));cur.refs.edgeR.setAttribute('r',(rR-.6).toFixed(2));cur.refs.ringR.setAttribute('r',Math.max(rR-4,15).toFixed(2));}
  if(dp!==0&&!(lidMoving&&(rfN++&1))){
    cur.refs.reelL.setAttribute('transform','rotate('+(cur.aL%360).toFixed(2)+' '+CL+' '+CY+')');
    cur.refs.reelR.setAttribute('transform','rotate('+(cur.aR%360).toFixed(2)+' '+CR+' '+CY+')');
  }
}
function frame(t){
  requestAnimationFrame(frame);
  const dt=Math.min(0.05,(t-lastT)/1000||0.016);lastT=t;
  lidStep(dt);lidMoving=(lidP!==lidT)&&S.mode!=='ff'&&S.mode!=='rew';
  const pos=cur?getPos():0;
  if(cur){
    if(S.mode==='play'&&loopOn&&pos>=cur.dur-0.015)loopWrap();
    else if((S.mode==='play'||S.mode==='ff')&&pos>=cur.dur-0.015)autoStop();
    else if(S.mode==='rew'&&pos<=0.015)autoStop();
    else if(S.mode==='rew'&&D.mem&&memFrom&&pos<=cntZero+0.05){stopTransport();click('big');say(_t('MEMORY STOP'),1800);}
  }
  scrubTick(dt,t);ageTick(dt);
  updateReels(pos);setCounter(pos);updateVU(dt);l4Tick(pos,t);mixMeters(pos,t);ledTick();
  recLed.classList.toggle('on',S.mode==='rec'||(armed&&Math.floor(t/400)%2===0));
  if(rec&&rec.an&&(armed||S.mode==='rec')){rec.an.getFloatTimeDomainData(rec.pb);let pk=0;for(let i=0;i<rec.pb.length;i++){const a=Math.abs(rec.pb[i]);if(a>pk)pk=a;}if(pk>0.93)rec.pkT=t;}
  recLed.classList.toggle('peak',!!(rec&&rec.pkT&&t-rec.pkT<140));
  const mt=MODES[S.mode]||S.mode,tt=cur?fmt(pos)+' / '+fmt(cur.dur):'00:00 / 00:00';
  const nm=(performance.now()<msgUntil||msgText)&&performance.now()<msgUntil?msgText:(cur?curName():_t('TAP SLOT TO LOAD AUDIO'));
  if(mt!==cache.m){cache.m=mt;lMode.textContent=mt;}
  if(tt!==cache.t){cache.t=tt;lTime.textContent=tt;}
  if(nm!==cache.n){cache.n=nm;lName.textContent=nm;lName.classList.remove('mq');const ov=lName.scrollWidth-lName.clientWidth;if(ov>3){lName.style.setProperty('--mq',ov+'px');lName.style.setProperty('--mqd',(ov/16+3).toFixed(1)+'s');lName.classList.add('mq');}}
}

/* ---------- boot ---------- */
function applyLang(){
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-i]').forEach(e=>{if(e.dataset.en===undefined)e.dataset.en=e.textContent;e.textContent=_t(e.dataset.en);});
  cache.n=null;renderTray();renderSkins();
  if(typeof renderMixer==='function'&&cur)renderMixer();
  dkPaint();
  if(tourEl.classList.contains('on'))tourPaint();
}
function setLang(l){lang=l==='ru'?'ru':'en';try{localStorage.setItem('tape4.lang',lang);}catch(e){}applyLang();click('tick');}
