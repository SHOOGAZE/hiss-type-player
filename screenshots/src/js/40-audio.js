/* ---------- audio ---------- */
function makeCurve(k,b){
  const n=2048,c=new Float32Array(n);
  const off=Math.tanh(k*b), norm=Math.max(Math.abs(Math.tanh(k*(1+b))-off),Math.abs(Math.tanh(k*(-1+b))-off));
  for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=(Math.tanh(k*(x+b))-off)/norm;}
  return c;
}
/* decoding goes through its own OfflineAudioContext: after the app was backgrounded iOS leaves the live context 'interrupted' and its decodeAudioData can hang forever */
function decodeBuf(ab){
  const rate=(ctx&&ctx.sampleRate)||44100,OC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  const job=OC?new OC(1,1,rate).decodeAudioData(ab):ctx.decodeAudioData(ab);
  return Promise.race([job,new Promise((_,no)=>setTimeout(()=>no(new Error('decode timeout')),20000))]);
}
function wakeAudio(){ if(ctx&&ctx.state!=='running')ctx.resume().catch(()=>{}); }
function initAudio(){
  if(ctx){ if(ctx.state!=='running') ctx.resume().catch(()=>{}); return; }
  try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){}
  const AC=window.AudioContext||window.webkitAudioContext;
  ctx=new AC({latencyHint:'interactive'});
  const g=(v)=>{const n=ctx.createGain();n.gain.value=v;return n;};
  A.scrG=g(1);A.trG=g(1);A.dropG=g(1);A.input=g(1);
  A.input.channelCount=2;A.input.channelCountMode='explicit';A.input.channelInterpretation='speakers';
  A.sat=ctx.createWaveShaper();A.sat.oversample='2x';
  A.lp=ctx.createBiquadFilter();A.lp.type='lowpass';A.lp.Q.value=0.6;A.lp.frequency.value=17000;
  A.mix=g(1);A.master=g(0.9);A.vuBus=g(1);A.vuBus.channelCount=2;A.vuBus.channelCountMode='explicit';
  A.windHp=ctx.createBiquadFilter();A.windHp.type='highpass';A.windHp.frequency.value=20;A.windHp.Q.value=0.5;
  A.scrG.connect(A.trG);A.trG.connect(A.windHp);A.windHp.connect(A.dropG);A.dropG.connect(A.input);A.input.connect(A.sat);A.sat.connect(A.lp);
  const sh=(t,f)=>{const b=ctx.createBiquadFilter();b.type=t;b.frequency.value=f;b.gain.value=0;return b;};
  A.tyLo=sh('lowshelf',150);A.tyHi=sh('highshelf',7000);A.nrHi=sh('highshelf',9000);A.toLo=sh('lowshelf',220);A.toHi=sh('highshelf',3800);
  A.lp.connect(A.tyLo);A.tyLo.connect(A.tyHi);A.tyHi.connect(A.nrHi);A.nrHi.connect(A.toLo);A.toLo.connect(A.toHi);A.toHi.connect(A.mix);
  A.mix.connect(A.master);A.master.connect(A.vuBus);
  A.out=g(D.vol);A.pan=ctx.createStereoPanner?ctx.createStereoPanner():null;
  A.lim=ctx.createDynamicsCompressor();A.lim.threshold.value=-4;A.lim.knee.value=2;A.lim.ratio.value=20;A.lim.attack.value=0.002;A.lim.release.value=0.18;
  A.master.connect(A.out);A.out.connect(A.lim);
  if(A.pan){A.lim.connect(A.pan);A.pan.connect(ctx.destination);}else A.lim.connect(ctx.destination);
  A.split=ctx.createChannelSplitter(2);A.vuBus.connect(A.split);
  A.anL=ctx.createAnalyser();A.anR=ctx.createAnalyser();A.anL.fftSize=A.anR.fftSize=1024;A.anL.smoothingTimeConstant=A.anR.smoothingTimeConstant=0;
  A.split.connect(A.anL,0);A.split.connect(A.anR,1);
  A.dead=g(0);A.anL.connect(A.dead);A.anR.connect(A.dead);A.dead.connect(ctx.destination);
  A.clk=g(TC().lv);A.clkHp=ctx.createBiquadFilter();A.clkHp.type='highpass';A.clkHp.frequency.value=150;A.clkHp.Q.value=0.6;
  A.clkEq=ctx.createBiquadFilter();A.clkEq.type='peaking';A.clkEq.frequency.value=260;A.clkEq.Q.value=0.8;A.clkEq.gain.value=TC().bd;
  A.clkLim=ctx.createDynamicsCompressor();A.clkLim.threshold.value=-8;A.clkLim.knee.value=4;A.clkLim.ratio.value=14;A.clkLim.attack.value=0.001;A.clkLim.release.value=0.06;
  A.clk.connect(A.clkHp);A.clkHp.connect(A.clkEq);A.clkEq.connect(A.clkLim);A.clkLim.connect(ctx.destination);
  const nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=nb.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1; A.noiseBuf=nb;
  const loopNoise=()=>{const s=ctx.createBufferSource();s.buffer=nb;s.loop=true;return s;};
  const hs=loopNoise(),hh=ctx.createBiquadFilter();hh.type='highpass';hh.frequency.value=2500;A.hissG=g(0);hs.connect(hh);hh.connect(A.hissG);A.hissG.connect(A.master);hs.start();
  const rs=loopNoise(),rl=ctx.createBiquadFilter();rl.type='lowpass';rl.frequency.value=220;A.rumG=g(0);rs.connect(rl);rl.connect(A.rumG);A.rumG.connect(A.master);rs.start(0,0.7);
  const ws=loopNoise(),wb=ctx.createBiquadFilter();wb.type='bandpass';wb.frequency.value=1100;wb.Q.value=3;A.whirG=g(0);ws.connect(wb);wb.connect(A.whirG);A.whirG.connect(A.master);ws.start(0,1.1);
  const rt=loopNoise(),rb=ctx.createBiquadFilter();rb.type='bandpass';rb.frequency.value=3600;rb.Q.value=0.9;A.rusG=g(0);rt.connect(rb);rb.connect(A.rusG);A.rusG.connect(A.master);rt.start(0,0.4);
  A.whn=ctx.createOscillator();A.whn.type='triangle';A.whn.frequency.value=110;const wl2=ctx.createBiquadFilter();wl2.type='lowpass';wl2.frequency.value=1400;A.whnG=g(0);A.whn.connect(wl2);wl2.connect(A.whnG);A.whnG.connect(A.master);A.whn.start();
  A.hum=ctx.createOscillator();A.hum.frequency.value=52;A.humG=g(0);A.hum.connect(A.humG);A.humG.connect(A.master);A.hum.start();
  A.wow=ctx.createOscillator();A.wow.frequency.value=0.9;A.wowG=g(0.001);A.fl=ctx.createOscillator();A.fl.frequency.value=8.5;A.flG=g(0.0005);A.wowSum=g(1);
  A.wow.connect(A.wowG);A.wowG.connect(A.wowSum);A.fl.connect(A.flG);A.flG.connect(A.wowSum);A.wow.start();A.fl.start();
  /* stretched tape: now and then the speed sags by a fraction of a percent and recovers. Only on a worn tape, and rare (about every 15-50 s) */
  if(ctx.createConstantSource){A.sag=ctx.createConstantSource();A.sag.offset.value=0;A.sag.connect(A.wowSum);A.sag.start();
    setInterval(()=>{const a=age();if(!ctx||S.mode!=='play'||a<0.15)return;
      if(Math.random()<Math.min(0.5,a*0.07)){const n=ctx.currentTime,d=(0.006+Math.random()*0.012)*Math.min(1,a+0.2);
        A.sag.offset.cancelScheduledValues(n);A.sag.offset.setTargetAtTime(-d,n,0.25);A.sag.offset.setTargetAtTime(0,n+0.5,0.5);}},1000);}
  setInterval(()=>{if(!ctx)return;const n=ctx.currentTime;A.wow.frequency.setTargetAtTime(rnd(0.5,1.5),n,0.6);A.fl.frequency.setTargetAtTime(rnd(6,11),n,0.5);},1200);
  setInterval(()=>{ if(!ctx||S.mode!=='play'||(tapeAmt<0.3&&age()<0.12))return;
    if(Math.random()<Math.max(0,tapeAmt-0.25)*0.35+age()*0.28){const n=ctx.currentTime,dl=rnd(0.04,0.16);A.dropG.gain.cancelScheduledValues(n);
      A.dropG.gain.setTargetAtTime(rnd(0.02,0.25),n,0.004);A.dropG.gain.setTargetAtTime(1,n+dl,0.012);} },600);
  setInterval(()=>{if(ctx&&cur&&S.mode==='play'&&age()>0.2&&Math.random()<(age()-0.1)*0.8)shed();},180);
  applyTape();applyDeck();
  lastState=ctx.state;
  ctx.onstatechange=()=>{ if(ctx.state==='running'&&lastState!=='running'&&isRun(S.mode)) resync(); lastState=ctx.state; };
  ctx.resume().catch(()=>{});
  loadSamples();   /* the optional sample pack: before this, it only loaded after a skin change */
}
function applyDeck(){
  if(!ctx)return;const n=ctx.currentTime,T=TY[D.type];
  A.tyLo.gain.setTargetAtTime(T.lo,n,0.05);A.tyHi.gain.setTargetAtTime(T.hi,n,0.05);
  A.nrHi.gain.setTargetAtTime(NRS[D.nr],n,0.05);
  A.toLo.gain.setTargetAtTime(-D.tone*4,n,0.05);A.toHi.gain.setTargetAtTime(D.tone*9,n,0.05);
  A.out.gain.setTargetAtTime(D.vol*D.vol*1.1,n,0.04);if(A.pan)A.pan.pan.setTargetAtTime(D.bal,n,0.04);
  if(rec&&rec.rg)rec.rg.gain.setTargetAtTime(D.rec*0.8,n,0.03);
  applyTape();paintSpec();
}
function paintSpec(){
  if(!cur||!cur.el)return;const T=TY[D.type];
  const a=cur.el.querySelector('.tp'),b=cur.el.querySelector('.nrt');
  if(a)a.textContent='TYPE '+T.n+' · '+T.bias+' · '+T.eq;if(b)b.textContent='NR ▸ '+NRN[D.nr];
}
function applyTape(){
  if(!ctx)return; const t=tapeAmt,n=ctx.currentTime;
  const C=TC(),ag=age();A.sat.curve=makeCurve(0.3+t*7*C.sat*TY[D.type].sat+ag*1.6,0.12*t*C.sat+ag*0.05);
  A.lp.frequency.setTargetAtTime(Math.min(20000,17000*C.lp*TY[D.type].lp*Math.pow(0.17,t)*Math.pow(0.42,ag)),n,0.05);
  /* worn tape wobbles on its own: a floor that grows with age, so it is audible even with TAPE near zero */
  A.wowG.gain.setTargetAtTime((0.0007+t*t*0.011)*C.wow*(1+ag*1.3)+ag*0.0018*C.wow,n,0.05);
  A.flG.gain.setTargetAtTime((0.0003+t*0.0045)*C.wow*(1+ag)+ag*0.0006*C.wow,n,0.05);
  updateMotor();
}
/* motor coast: after STOP (tape stop or wind-down) the motor spins down for a moment instead of cutting out; coastU = AudioContext time the coast ends */
let coastU=0,coastD=0;
function updateMotor(){
  if(!ctx)return; const n=ctx.currentTime,m=S.mode,run=isRun(m)||m==='scrub',t=tapeAmt;
  const co=coastU>n;                      /* spinning down after STOP */
  const mot=run||m==='pause'||co;         /* PAUSE: the capstan motor keeps turning, only the pinch roller lets go of the tape */
  const hiss=m==='play'?1:(m==='ff'||m==='rew')?0.35:m==='scrub'?0.6:0;
  const hum=(m==='play'||m==='rec')?1:(m==='ff'||m==='rew')?1.6:m==='scrub'?0.5:m==='pause'?0.8:co?1:0;
  const C=TC();A.hissG.gain.setTargetAtTime(hiss*C.hiss*TY[D.type].hiss*NRH[D.nr]*(1+age()*2.2)*(0.0012+Math.pow(t,1.6)*0.035),n,co&&!hiss?coastD*0.3:0.05);
  const tc=co&&!run&&m!=='pause'?coastD*0.4:null;
  A.humG.gain.setTargetAtTime(mot&&!tc?0.004*hum*C.hum:0,n,tc||0.08);
  A.rumG.gain.setTargetAtTime(mot&&!tc?0.012*hum*C.hum:0,n,tc||0.1);
  A.whirG.gain.setTargetAtTime(mot&&!tc?0.004*hum:0,n,tc||0.1);
  A.hum.frequency.setTargetAtTime((m==='ff'||m==='rew')?170:tc?22:52,n,tc?coastD*0.5:0.15);
  const wind=(m==='ff'||m==='rew');
  A.trG.gain.setTargetAtTime(wind?(D.cue?0.36:0.07):1,n,0.12);
  A.windHp.frequency.setTargetAtTime(wind?420:20,n,0.1);
  A.whnG.gain.setTargetAtTime(wind?0.011*C.hum:0,n,wind?0.1:0.07);
  A.whn.frequency.setTargetAtTime(wind?250:105,n,wind?0.28:0.12);
  A.rusG.gain.setTargetAtTime(wind?0.016:0,n,wind?0.15:0.06);
}
/* Physical key sounds: contact transient + body resonances (modal) + spring + bottom-out thump */
const SND={
  /* SONIC: brushed aluminium chassis, heavy metal parts - longer bright ring */
  sonic:    {modes:[[1500,.045,.4],[2900,.032,.55],[5200,.022,.4],[7800,.012,.2]], hf:[6000,2,.007,.5], th:[240,.035,.3], trav:.009, sp:[6800,.3]},
  /* KAMI: smooth matte ceramic-like plastic, tight tolerances - short, damped, high */
  kami:     {modes:[[2200,.012,.32],[4100,.008,.22]],                       hf:[2600,.8,.006,.3],   th:[230,.028,.28], trav:.012, sp:null},
  /* KIIRO: heavy rubber and solid plastic - big thud */
  kiiro:    {modes:[[800,.035,.4],[1700,.02,.5],[3400,.012,.35]],           hf:[4200,1.4,.009,.6], th:[125,.075,.55], trav:.011, sp:[6200,.3]},
  /* AKANE: cold, dense, damped metal - dry short body */
  akane:    {modes:[[420,.06,.45],[880,.04,.3],[1750,.025,.2]],             hf:[1600,.8,.013,.3],  th:[95,.085,.5],  trav:.024, sp:null},
  /* KURO: dense matte ABS school-recorder keys */
  kuro:     {modes:[[900,.03,.4],[1800,.018,.5],[3600,.012,.3]],            hf:[3500,1.2,.012,.5], th:[150,.05,.5], trav:.014, sp:[5200,.25]},
  /* NASHVILLE (ACE): wooden composite + chrome mechanics, warm acoustic resonance */
  nashville:{modes:[[330,.09,.5],[640,.13,.4],[1240,.1,.3],[2480,.07,.2],[3900,.05,.15]], hf:[2400,1.2,.011,.65], th:[85,.11,.55], trav:.03, sp:[4400,.35]}
};
/* Crisp mechanical voices. Everything is short (a click is 5-40 ms); resonances are noise-excited
   band-passed ticks, not ringing sines, so nothing sounds like a beep or a boom on a phone speaker. */
function nz(n,fc,q,dec,g){
  const s=ctx.createBufferSource();s.buffer=A.noiseBuf;
  const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=Math.min(fc,16000);f.Q.value=q;
  const e=ctx.createGain();e.gain.setValueAtTime(0.0001,n);e.gain.linearRampToValueAtTime(g,n+0.0005);e.gain.exponentialRampToValueAtTime(0.0001,n+dec);
  s.connect(f);f.connect(e);e.connect(A.clk);s.start(n,Math.random()*1.5,dec+0.02);
}
/* a resonant "tok": 1.5 ms noise burst through a high-Q band-pass, decay capped so it can't sing */
function ring(n,f,dec,g){
  dec=Math.min(0.03,dec*0.5);
  const s=ctx.createBufferSource();s.buffer=A.noiseBuf;
  const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=Math.min(Math.max(f*2.1,1500),14000);bp.Q.value=7;
  const e=ctx.createGain();e.gain.setValueAtTime(0.0001,n);e.gain.linearRampToValueAtTime(g*2.4,n+0.0004);e.gain.exponentialRampToValueAtTime(0.0001,n+dec);
  s.connect(bp);bp.connect(e);e.connect(A.clk);s.start(n,Math.random()*1.5,dec+0.01);
}
/* bottom-out knock: short, mid-low, no sub-bass (phone speakers can't play it anyway) */
function thump(P,vel,pitch,n,k){
  const f0=Math.max(210,P.th[0]*1.5)*pitch,dec=Math.min(0.05,P.th[1]*0.55)*(0.6+0.4*k);
  const o=ctx.createOscillator(),e=ctx.createGain();
  o.frequency.setValueAtTime(f0*1.5,n);o.frequency.exponentialRampToValueAtTime(f0,n+0.012);
  e.gain.setValueAtTime(0.0001,n);e.gain.linearRampToValueAtTime(P.th[2]*0.07*vel*k,n+0.0015);e.gain.exponentialRampToValueAtTime(0.0001,n+dec);
  o.connect(e);e.connect(A.clk);o.start(n);o.stop(n+dec+0.02);
  nz(n,1300+f0*2,0.9,Math.min(0.03,dec),0.55*vel*k);
}
function strike(P,vel,pitch,n,rel){
  if(!rel){nz(n,5200*pitch,0.5,0.0035,1.1*vel);nz(n,Math.max(P.hf[0],2600)*pitch,P.hf[1],P.hf[2],P.hf[3]*vel*1.5);}
  else nz(n,Math.max(P.hf[0],2600)*pitch*1.1,P.hf[1],P.hf[2]*0.7,P.hf[3]*vel*0.7);
  if(!rel&&Math.random()<0.4)nz(n+0.003,P.hf[0]*pitch*1.2,P.hf[1],P.hf[2]*0.6,P.hf[3]*vel*0.3);
  for(const m of P.modes)ring(n,m[0]*pitch*(rel?1.06:1),m[1]*(rel?0.7:1),m[2]*vel*(rel?0.45:1));
}
function spring(P,vel,n){
  if(!P.sp)return;const f=P.sp[0]*(1+rnd(-0.05,0.05));
  ring(n,f,0.05,P.sp[1]*vel*0.45);ring(n+0.002,f*1.34,0.04,P.sp[1]*vel*0.3);
}
/* optional sample pack: sounds/index.json lists files; sounds/<skin>/<name>.* overrides the synth for that skin, sounds/<name>.* for all */
const SMP={};let smpIdx=null,smpLoading=false;
async function loadSamples(){
  if(!ctx||!/^https?:$/.test(location.protocol))return;
  try{
    if(smpIdx===null){if(smpLoading)return;smpLoading=true;const r=await fetch('sounds/index.json',{cache:'no-cache'});smpIdx=r.ok?await r.json():{};smpLoading=false;}
  }catch(e){smpIdx={};smpLoading=false;}
  for(const k in SMP)delete SMP[k];
  const files=Object.assign({},smpIdx.all||{},smpIdx[theme]||{});
  for(const kind in files){
    const list=[].concat(files[kind]),bufs=[];                 /* a kind may be one file or a list: a random one plays each time */
    for(const f of list){try{const r=await fetch('sounds/'+f);if(r.ok)bufs.push(await decodeBuf(await r.arrayBuffer()));}catch(e){}}
    if(bufs.length)SMP[kind]=bufs;
  }
}
const SMP_GAIN={enc:0.22,down:0.85,up:0.8,latch:0.75},smpLast={};   /* encoder clicks are recorded hot: play them well below full level */
/* the two recorded key sets are shared by six decks, so every skin voices them differently: pitch (smaller/bigger parts), brightness, a body resonance and how long the tone rings */
const SMP_VOICE={
  sonic:    {rate:1.06,lp:15000,pk:[5200,3],  gain:1,   dec:0},     /* aluminium: bright, ringing */
  kami:     {rate:1.24,lp:7600, pk:[2600,2],  gain:.85, dec:.085},  /* light plastic: high, short, soft */
  nashville:{rate:.9,  lp:5600, pk:[330,6],   gain:1.05,dec:0},     /* wood and chrome: warm body */
  kiiro:    {rate:.8,  lp:4300, pk:[140,5],   gain:1.08,dec:.16},   /* rubber: soft thud */
  akane:    {rate:.96, lp:7000, pk:[1700,2],  gain:1,   dec:.11},   /* damped metal */
  kuro:     {rate:.72, lp:3300, pk:[180,4],   gain:1.12,dec:.13}    /* dense matte ABS: dull and heavy */
};
/* encoder detents: the same recorded click for every deck, nudged a little per skin (SORAKO stays the reference) */
const ENC_VOICE={
  sonic:    {rate:1,   lp:20000,pk:[5000,0],gain:1,   dec:0},     /* the reference click, untouched */
  kami:     {rate:1.1, lp:12000,pk:[3000,1.5],gain:.95,dec:.06},  /* a touch lighter and shorter */
  nashville:{rate:.94, lp:9000, pk:[500,2.5],gain:1.15,dec:0},    /* a little warmer, with some body */
  kiiro:    {rate:.88, lp:6500, pk:[200,3],  gain:1.1, dec:.12},  /* softer, rubbery */
  akane:    {rate:1,   lp:10000,pk:[2000,1.5],gain:1.05,dec:.09}, /* slightly drier */
  kuro:     {rate:.82, lp:5000, pk:[240,3],  gain:1.12,dec:.1}    /* duller and heavier */
};
function playSample(kind){
  const L=SMP[kind];if(!L||!L.length)return false;
  let i=(Math.random()*L.length)|0;if(L.length>1&&i===smpLast[kind])i=(i+1)%L.length;smpLast[kind]=i;
  const V=kind==='enc'?ENC_VOICE[theme]:SMP_VOICE[theme],n=ctx.currentTime;
  const s=ctx.createBufferSource();s.buffer=L[i];s.playbackRate.value=(V?V.rate:1)*(1+rnd(-0.03,0.03));
  const g=ctx.createGain();g.gain.value=rnd(0.9,1.05)*(SMP_GAIN[kind]||1)*(V?V.gain:1);
  let out=s;
  if(V){
    const pk=ctx.createBiquadFilter();pk.type='peaking';pk.frequency.value=V.pk[0];pk.Q.value=1.2;pk.gain.value=V.pk[1];
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=V.lp;lp.Q.value=.5;
    s.connect(pk);pk.connect(lp);out=lp;
    if(V.dec){g.gain.setValueAtTime(g.gain.value,n+V.dec*.4);g.gain.setTargetAtTime(0,n+V.dec*.4,V.dec/3);}
  }
  out.connect(g);g.connect(A.clk);s.start(n);return true;
}
function click(kind){
  if(!ctx)return;
  if(SMP[kind]&&playSample(kind))return;
  if(kind==='toggle'){
    const P=SND[theme]||SND.sonic,n=ctx.currentTime+0.002,pitch=1+rnd(-0.03,0.03);
    nz(n,5200*pitch,1.4,0.005,0.6);ring(n,3100*pitch,0.05,0.16);ring(n,4700*pitch,0.035,0.1);
    strike(P,0.8,pitch*1.25,n+0.006,false);thump(P,0.7,pitch*1.2,n+0.012,0.7);
    nz(n+0.07,3600*pitch,1.8,0.004,0.3);ring(n+0.07,2500*pitch,0.03,0.08);return;
  }
  if(kind==='eject'){
    const P=SND[theme]||SND.sonic,n=ctx.currentTime+0.002,pitch=1+rnd(-0.03,0.03);
    strike(P,0.9,pitch*1.1,n,false);spring(P,1,n+0.004);thump(P,0.6,pitch,n+0.012,0.8);
    const s=ctx.createBufferSource();s.buffer=A.noiseBuf;const f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=1.1;
    f.frequency.setValueAtTime(1100,n+0.05);f.frequency.exponentialRampToValueAtTime(3400,n+0.2);
    const e=ctx.createGain();e.gain.setValueAtTime(0.0001,n+0.05);e.gain.linearRampToValueAtTime(0.07,n+0.1);e.gain.exponentialRampToValueAtTime(0.0001,n+0.22);
    s.connect(f);f.connect(e);e.connect(A.clk);s.start(n+0.05,Math.random()*1.5,0.2);return;
  }
  if(kind==='insert'){
    const P=SND[theme]||SND.sonic,n=ctx.currentTime+0.002;
    const s=ctx.createBufferSource();s.buffer=A.noiseBuf;const f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=1.1;
    f.frequency.setValueAtTime(3200,n);f.frequency.exponentialRampToValueAtTime(1100,n+0.16);
    const e=ctx.createGain();e.gain.setValueAtTime(0.0001,n);e.gain.linearRampToValueAtTime(0.09,n+0.03);e.gain.setValueAtTime(0.09,n+0.12);e.gain.exponentialRampToValueAtTime(0.0001,n+0.19);
    s.connect(f);f.connect(e);e.connect(A.clk);s.start(n,Math.random()*1.5,0.22);
    const pitch=1+rnd(-0.03,0.03);strike(P,1.1,pitch*0.9,n+0.17,false);thump(P,1.0,pitch*0.9,n+0.18,1.1);spring(P,0.9,n+0.175);return;
  }
  const P=SND[theme]||SND.sonic,n=ctx.currentTime+0.002,pitch=1+rnd(-0.035,0.035),vel=rnd(0.88,1.05);
  if(kind==='down'){strike(P,vel,pitch,n,false);spring(P,vel,n+P.trav*0.4);thump(P,vel,pitch,n+P.trav,1);strike(P,vel*0.35,pitch*1.05,n+P.trav,false);}
  else if(kind==='up'){strike(P,vel*0.7,pitch,n,true);spring(P,vel*0.7,n+0.004);thump(P,vel*0.7,pitch*1.1,n+0.006,0.5);}
  else if(kind==='latch'){strike(P,vel*1.1,pitch*0.9,n,false);thump(P,vel*0.8,pitch*0.9,n+0.02,1);spring(P,vel,n+0.01);}
  else if(kind==='big'){strike(P,vel*1.4,pitch*0.8,n,false);thump(P,vel*1.4,pitch*0.8,n+0.01,1.3);strike(P,vel*0.6,pitch*1.1,n+0.07,true);thump(P,vel*0.6,pitch,n+0.075,0.6);}
  else if(kind==='enc')microClick(vel,pitch,n);
  else{nz(n,P.hf[0]*pitch*1.1,P.hf[1],P.hf[2]*0.5,P.hf[3]*vel*0.22);}
}
/* encoder step: a dry plastic/ceramic micro-click. Short and quiet, no ring, no echo: a bright 1 ms strike, a damped low-Q "tk" body
   and a tiny springy return a few ms later (the "elastic crackle"). In a fast spin the body shortens and the clicks run together
   into a soft stepped crackle instead of ringing. Noise through low-Q filters only, so nothing can sing or bleep. */
let lastMc=0;
function microClick(vel,pitch,n){
  const t=performance.now(),gap=t-lastMc;lastMc=t;
  const fast=gap<70,k=fast?0.6:1,j=()=>1+rnd(-0.08,0.08);
  const res=(at,fc,q,dec,g)=>{
    const s=ctx.createBufferSource();s.buffer=A.noiseBuf;
    const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=Math.min(fc,12000);bp.Q.value=q;
    const e=ctx.createGain();e.gain.setValueAtTime(0.0001,at);e.gain.linearRampToValueAtTime(g,at+0.0004);e.gain.exponentialRampToValueAtTime(0.0001,at+dec);
    s.connect(bp);bp.connect(e);e.connect(A.clk);s.start(at,Math.random()*1.5,dec+0.01);
  };
  const v=vel*(fast?0.8:1);vuKick=Math.max(vuKick,0.04);
  res(n,3000*pitch*j(),0.9,0.0016,0.26*v);                   /* dry strike */
  res(n+0.0003,1150*pitch*j(),2.4,0.0055*k+0.002,0.36*v);   /* damped body, low Q: a "tk", not a ring */
  res(n+0.0045+rnd(0,0.0015),1900*pitch*j(),1.6,0.0035,0.15*v*k); /* springy return */
}
function thunk(str){
  if(!ctx)return;
  const P=SND[theme]||SND.sonic,n=ctx.currentTime+0.002;
  thump(P,str*0.9,0.8,n,1.1);strike(P,str*0.7,0.8,n,false);nz(n,900,0.9,0.05,0.3*str);
}
let vuKick=0;
