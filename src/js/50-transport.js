/* ---------- tape transport ---------- */
const NT=4;
/* ---- tape aging: wear lives on each cassette (persisted); loop passes erode on top ---- */
let loopOn=false,loopGen=0,lastWrap=0,lastAge=-1,wearSave=0;
const age=()=>cur?clamp((cur.meta.wear||0)+loopGen*0.045,0,1.3):0;
function paintAge(force){
  if(!cur)return;const a=age();
  if(!force&&Math.abs(a-lastAge)<0.008)return;lastAge=a;
  applyWear(cur.el,a);
  if(ctx)applyTape();
}
function shed(){
  if(!ctx)return;const n=ctx.currentTime+0.002,s=ctx.createBufferSource();s.buffer=A.noiseBuf;
  const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=rnd(1500,6500);f.Q.value=rnd(0.8,2);
  const e=ctx.createGain(),d=rnd(0.004,0.02);e.gain.setValueAtTime(0.0001,n);e.gain.linearRampToValueAtTime(rnd(0.01,0.035)*(0.5+age()),n+0.001);e.gain.exponentialRampToValueAtTime(0.0001,n+d);
  s.connect(f);f.connect(e);e.connect(A.master);s.start(n,Math.random()*1.5,d+0.02);
}
/* erosion: every loop pass punches a few soft holes into the buffers and dulls the level */
function erode(){
  const k=Math.min(loopGen,40);
  for(const t of cur.T){
    if(!t.buf)continue;const sr=t.buf.sampleRate,N=t.buf.length,holes=2+Math.round(k*0.9);
    for(let h=0;h<holes;h++){
      const len=Math.floor(sr*rnd(0.02,0.12)*(1+k*0.06)),at=Math.floor(Math.random()*Math.max(1,N-len)),dep=rnd(0.3,1);
      for(let c=0;c<t.buf.numberOfChannels;c++){const d=t.buf.getChannelData(c);
        for(let i=0;i<len&&at+i<N;i++){const w=0.5-0.5*Math.cos(2*Math.PI*i/len);d[at+i]*=1-dep*w;}}
    }
    const g=0.992;for(let c=0;c<t.buf.numberOfChannels;c++){const d=t.buf.getChannelData(c);for(let i=0;i<N;i++)d[i]*=g;}
    t.rev=null;
  }
}
function loopWrap(){
  const now=performance.now();if(now-lastWrap<300)return;lastWrap=now;
  if(!cur||!loopOn)return;
  loopGen++;erode();killSource();S.off=0;S.mode='stop';go('play');
  say(_t('LOOP · PASS ')+loopGen,1200);paintAge();
}
function ageTick(dt){
  if(!cur||!ctx)return;
  const m=S.mode;if(m==='play'||m==='rec'||m==='scrub'||m==='ff'||m==='rew'){
    const f=(m==='ff'||m==='rew')?0.3:1;
    cur.meta.wear=Math.min(1.3,(cur.meta.wear||0)+dt/2400*(0.6+tapeAmt)*f);
    wearSave+=dt;if(wearSave>20){wearSave=0;dbPut('meta',cur.meta).catch(()=>{});}
    paintAge();
  }
}
const trKey=(id,side,n)=>(side===0&&n===0)?id:id+'~'+side+n;
function revBuf(b){const r=ctx.createBuffer(b.numberOfChannels,b.length,b.sampleRate);
  for(let c=0;c<b.numberOfChannels;c++){const s=b.getChannelData(c),d=r.getChannelData(c);for(let i=0,n=s.length;i<n;i++)d[i]=s[n-1-i];}return r;}
function trackBuf(t,rev){if(!t.buf)return null;if(!rev)return t.buf;if(!t.rev)t.rev=revBuf(t.buf);return t.rev;}
function setDur(c){c=c||cur;if(!c)return;let d=0;for(const t of c.T)if(t.buf)d=Math.max(d,t.buf.duration);c.dur=d;if(c.side===0)c.meta.dur=d;else c.meta.durB=d;if(c===cur&&c.refs&&c.refs.du)c.refs.du.textContent=d?fmt(d):'--:--';}
function getPos(){
  if(!cur)return 0; let p=S.off;
  if(ctx&&isRun(S.mode)) p=S.off+S.dir*Math.max(0,ctx.currentTime-S.t0)*S.rate;
  return clamp(p,0,S.mode==='rec'?1e9:cur.dur);
}
function killSource(){
  if(!ctx)return; const n=ctx.currentTime;
  if(S.sg){try{S.sg.gain.cancelScheduledValues(n);S.sg.gain.setTargetAtTime(0,n,0.006);}catch(e){}}
  for(const s of S.srcs){try{s.stop(n+0.05);}catch(e){}try{A.wowSum.disconnect(s.playbackRate);}catch(e){}s.onended=null;}
  S.srcs=[];S.src=null;S.sg=null;S.tg=[];
}
function setRates(r,tc){const n=ctx.currentTime;for(const s of S.srcs){if(tc)s.playbackRate.setTargetAtTime(r,n,tc);else s.playbackRate.setValueAtTime(r,n);}}
function trackLevel(i){const m=cur.meta.mix[i];return m.m?0:m.g;}
function startSource(pos,rate,rev,excl){
  killSource();
  const n=ctx.currentTime,st=n+0.006,sg=ctx.createGain();
  sg.gain.setValueAtTime(0,n);sg.gain.setTargetAtTime(1,st,0.006);sg.connect(A.scrG);
  let main=null,mainLeft=-1;
  cur.T.forEach((t,i)=>{
    if(i===excl||!t.buf)return;
    const b=trackBuf(t,rev),off=rev?t.buf.duration-pos:pos;
    if(off<0||off>=b.duration-0.001)return;
    const s=ctx.createBufferSource();s.buffer=b;s.playbackRate.value=rate;
    const tg=ctx.createGain();tg.gain.value=trackLevel(i);
    let node=tg;
    if(ctx.createStereoPanner){const pn=ctx.createStereoPanner();pn.pan.value=cur.meta.mix[i].p||0;tg.connect(pn);node=pn;}
    s.connect(tg);node.connect(sg);A.wowSum.connect(s.playbackRate);
    s.start(st,off);S.srcs.push(s);S.tg[i]=tg;
    const left=b.duration-off;if(left>mainLeft){mainLeft=left;main=s;}
  });
  if(!main){try{sg.disconnect();}catch(e){}return false;}
  S.src=main;S.sg=sg;S.t0=st;S.off=pos;S.rate=rate;
  main.onended=()=>{ if(S.src===main){S.src=null; if(S.mode==='play'&&loopOn){loopWrap();return;} if(S.mode==='play'||S.mode==='ff'||S.mode==='rew') autoStop();} };
  return true;
}
function windGo(m){
  const again=S.mode===m&&FFR===FFR_N;
  FFR=again?FFR_T:FFR_N;
  if(go(m)&&again)say(_t('TURBO ')+(m==='ff'?'▶▶▶':'◀◀◀'),1200);
}
function go(mode){
  if(!cur){say(_t('NO CASSETTE'),1800);return false;}
  if(lidP>0.08){say(_t('CLOSE THE LID'),1800);return false;}
  initAudio();
  if(cur.dur<=0.01){say(_t('EMPTY SIDE — RECORD OR LOAD'),2200);return false;}
  const p=getPos(); killSource(); S.off=p;
  let ok=true;
  if(mode==='play'){S.dir=1;ok=startSource(p,baseRate(),false);}
  else if(mode==='ff'){S.dir=1;ok=startSource(p,FFR,false);}
  else if(mode==='rew'){S.dir=-1;memFrom=p>cntZero+0.4;ok=p>0.02&&startSource(p,FFR,true);}
  if(!ok){S.mode='stop';say(mode==='rew'?_t('START OF TAPE'):_t('END OF TAPE'),1500);updateMotor();renderKeys();return false;}
  if((mode==='ff'||mode==='rew')&&S.srcs.length){const n=ctx.currentTime;
    for(const x of S.srcs){x.playbackRate.cancelScheduledValues(n);x.playbackRate.setValueAtTime(1,n);x.playbackRate.linearRampToValueAtTime(FFR,n+0.4);}
    S.t0+=1.2/FFR;}
  S.mode=mode;updateMotor();renderKeys();wake();return true;
}
function spinDown(){
  if(!ctx)return;const n=ctx.currentTime,list=S.srcs.slice(),sg=S.sg;
  S.srcs=[];S.src=null;S.sg=null;S.tg=[];
  for(const x of list){x.onended=null;try{x.playbackRate.cancelScheduledValues(n);x.playbackRate.setValueAtTime(x.playbackRate.value,n);x.playbackRate.exponentialRampToValueAtTime(0.9,n+0.2);x.stop(n+0.24);}catch(e){}
    setTimeout(()=>{try{A.wowSum.disconnect(x.playbackRate);}catch(e){}},400);}
  if(sg){try{sg.gain.cancelScheduledValues(n);sg.gain.setValueAtTime(sg.gain.value,n);sg.gain.linearRampToValueAtTime(0,n+0.22);}catch(e){}}
}
function pauseTape(){
  if(S.mode==='pause'){go('play');return;}
  if(S.mode==='play'||S.mode==='ff'||S.mode==='rew'){const p=getPos();killSource();S.off=p;S.mode='pause';updateMotor();renderKeys();}
}
function stopTransport(){
  const wasRec=S.mode==='rec',p=getPos();
  if(ctx){if(S.mode==='ff'||S.mode==='rew')spinDown();else killSource();}
  if(wasRec)finishRec(); else if(armed&&rec){releaseMic();}
  armed=false;S.off=p;S.mode='stop';
  updateMotor();renderKeys();releaseWake();
  if(cur&&wearSave>0){wearSave=0;dbPut('meta',cur.meta).catch(()=>{});}
}
function retune(){
  if(ctx&&S.mode==='play'&&S.src){const p=getPos(),n=ctx.currentTime;S.off=p;S.t0=n;S.rate=baseRate();setRates(S.rate,0);}
}
function autoStop(){
  if(S.mode==='stop')return; const end=S.dir>0;
  if(end&&D.auto&&S.mode==='play'&&!busy&&cur){stopTransport();click('big');flip().then(()=>{if(cur&&cur.dur>0.01)go('play');});return;}
  stopTransport();click('big');say(end?_t('END OF TAPE'):_t('START OF TAPE'),2000);
}
function resync(){ if(cur&&ctx&&isRun(S.mode)&&S.mode!=='rec'){const m=S.mode;go(m);} }
function setPitch(v){
  pitch=Math.abs(v)<0.004?0:v;
  if(ctx&&S.mode==='play'&&S.src){const p=getPos(),n=ctx.currentTime;S.off=p;S.t0=n;S.rate=baseRate();setRates(S.rate,0);}
  saveSet();
}
let wl=null;
async function wake(){try{if(navigator.wakeLock&&!wl){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null;});}}catch(e){}}
function releaseWake(){try{wl&&wl.release();}catch(e){}wl=null;}
