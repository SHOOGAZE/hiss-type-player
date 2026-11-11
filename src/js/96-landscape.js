/* ---------- landscape: auto-hide UI + track level bars ---------- */
const lsQ=window.matchMedia('(orientation:landscape) and ((max-height:600px) or ((min-width:900px) and (pointer:coarse)))');
let uiT=0;
function uiShow(){document.body.classList.remove('uihide');clearTimeout(uiT);
  if(lsQ.matches)uiT=setTimeout(()=>{if(lsQ.matches&&isRun(S.mode)&&!document.querySelector('#mixer.on,#dk.on,#themes.on'))document.body.classList.add('uihide');},3800);}
window.addEventListener('pointerdown',uiShow,true);
lsQ.addEventListener&&lsQ.addEventListener('change',()=>{document.body.classList.remove('uihide');uiShow();});
const l4=$('#l4');let l4bars=null;
(function(){let h='';for(let i=0;i<4;i++)h+='<div><i><b></b></i><small>'+(i+1)+'</small></div>';l4.innerHTML=h;l4bars=[...l4.querySelectorAll('div')];})();
l4.addEventListener('click',()=>{if(cur)openMixer();});
function trackEnv(t){
  if(t.env&&t.envBuf===t.buf)return t.env;const b=t.buf;if(!b)return null;
  const d=b.getChannelData(0),win=Math.max(1,Math.round(b.sampleRate*0.05)),n=Math.ceil(d.length/win),e=new Float32Array(n);
  for(let i=0;i<n;i++){let a=0;const st=i*win,en=Math.min(d.length,st+win);for(let k=st;k<en;k+=4)a+=d[k]*d[k];e[i]=Math.sqrt(a/Math.max(1,(en-st)/4));}
  t.env=e;t.envBuf=b;return e;
}
let l4T=0;
function l4Tick(pos,t){
  if(!lsQ.matches||!cur||t-l4T<45)return;l4T=t;
  for(let i=0;i<4;i++){
    const tr=cur.T[i],el=l4bars[i],run=(S.mode==='play'||S.mode==='rec'||S.mode==='ff'||S.mode==='rew');
    let v=0;if(tr&&tr.buf&&run&&!(S.mode==='ff'||S.mode==='rew')){const e=trackEnv(tr);if(e){const k=Math.floor(pos/0.05);v=(e[k]||0)*trackLevel(i)*(D.vol>0?1:0)*3.2;}}
    const b=el.querySelector('b');b.style.height=Math.min(100,v*100)+'%';
    el.classList.toggle('arm',(cur.meta.arm||0)===i&&(armed||S.mode==='rec'));el.classList.toggle('mute',!!cur.meta.mix[i].m);
  }
}
/* sleep timer: fade out then stop */
function setSleep(min){
  sleepAt=min?performance.now()+min*60000:0;if(ctx&&A.out)applyDeck();
  say(min?_t('SLEEP TIMER ')+min+_t(' MIN'):_t('SLEEP TIMER OFF'),1800);
}
setInterval(()=>{
  if(!sleepAt)return;const left=sleepAt-performance.now();
  if(left<=0){sleepAt=0;dkEl.querySelectorAll('[data-k=sleep]').forEach(g=>g.dataset.cur=0);
    if(isRun(S.mode)||S.mode==='pause')stopTransport();if(ctx)applyDeck();dkPaint();say(_t('SLEEP · STOP'),3000);return;}
  if(left<8000&&ctx&&isRun(S.mode)){A.out.gain.setTargetAtTime(D.vol*D.vol*1.1*(left/8000),ctx.currentTime,0.2);}
  if(dkEl.classList.contains('on'))dkPaint();
},1000);
applyDeck();
function closeMixer(){mixEl.classList.remove('on');click('up');saveMeta();}
$('#mxX').addEventListener('click',closeMixer);
mixEl.addEventListener('click',e=>{if(e.target===mixEl)closeMixer();});
/* rename (handwritten label) */
function paintLabel(){
  if(!cur||!cur.refs.nm)return;const nm=curName(),t=nm.length>30?nm.slice(0,29)+'…':nm;
  const m=cur.meta,hd=isHand(m);cur.refs.nm.textContent=labTxt(m,t);cur.refs.nm.setAttribute('font-size',labFs(t,!hd));
  cur.refs.nm.setAttribute('font-family',hd?HAND_FF:printFF());cur.refs.nm.setAttribute('font-weight',hd?400:(PWT[theme]||600));cur.refs.nm.setAttribute('letter-spacing',hd?0:(PS[theme]||2));
  cur.refs.nm.setAttribute('transform','rotate('+(hd?m.rot:0)+' 160 50)');
  if(cur.refs.du)cur.refs.du.textContent=cur.dur?fmt(cur.dur):(cur.meta.cap?fmt(cur.meta.cap/2):'--:--');
  const gn=cur.el.querySelector('.gn');if(gn)gn.textContent=genTxt(m);
}
nameIn.addEventListener('input',()=>{
  if(!cur)return;const v=nameIn.value.slice(0,30);
  if(cur.side)cur.meta.nameB=v.trim()?v:'';else cur.meta.name=v.trim()?v:'untitled';
  paintLabel();
});
nameIn.addEventListener('change',()=>{saveMeta();renderTray();});
/* reels (teeth / smooth / clear) and shell plastic (gloss / smoked / clear): saved on the cassette, redrawn in place */
$('#mxReel').addEventListener('click',()=>{if(!cur)return;const m=cur.meta;m.reel=REELS[(REELS.indexOf(reelOf(m))+1)%REELS.length];saveMeta();repaintCass();renderTray();renderMixer();click('down');setTimeout(()=>click('up'),60);});
$('#mxMat').addEventListener('click',()=>{if(!cur)return;const m=cur.meta;m.mat=MATS[(MATS.indexOf(matOf(m))+1)%MATS.length];saveMeta();repaintCass();renderTray();renderMixer();click('down');setTimeout(()=>click('up'),60);});
$('#fontBtn').addEventListener('click',()=>{if(!cur)return;cur.meta.font=isHand(cur.meta)?'print':'hand';saveMeta();paintLabel();renderTray();renderMixer();click('down');setTimeout(()=>click('up'),60);});
/* load a file into the armed track */
$('#mxLoad').addEventListener('click',()=>{if(!cur)return;if(S.mode!=='stop')stopTransport();initAudio();loadTarget=true;fileInp.click();});
async function loadIntoTrack(file){
  const i=cur.meta.arm,target=cur;
  say(_t('LOADING INTO T')+(i+1)+'…',99999);
  try{
    const buf=await decodeBuf(await file.arrayBuffer());
    target.T[i]={buf,rev:null};setDur(target);paintLabel();
    await saveTrack(target,i);await dbPut('meta',target.meta);
    say('T'+(i+1)+_t(' LOADED'),1800);click('latch');renderMixer();renderTray();
  }catch(e){say(_t('COULD NOT READ FILE'),2500);}
}
/* generation loss: roll off the top, add hiss, wow and soft saturation; stronger for older tape (ag). Shared by ping-pong and DUB */
async function degrade(L,R,len,ag){
    const sr=ctx.sampleRate,fc=clamp(11500*Math.pow(0.55,ag),3500,12000)*TC().lp,al=1-Math.exp(-2*Math.PI*Math.min(fc,18000)/sr);
    const hs=0.0012*(1+ag*2)*TC().hiss,sat=1.15+ag*0.4+TC().sat*0.25,ns=Math.tanh(sat);
    const out=ctx.createBuffer(2,len,sr),oL=out.getChannelData(0),oR=out.getChannelData(1);
    let yl=0,yr=0,pk=0,hp1=0,hp2=0;const W=0.0004*sr*TC().wow*(1+ag),f1=0.6+Math.random()*0.5,f2=7.5+Math.random();
    for(let k=0;k<len;k++){
      const d=W*(Math.sin(2*Math.PI*f1*k/sr)+0.15*Math.sin(2*Math.PI*f2*k/sr)),q=k+d,i0=Math.floor(q),fr=q-i0;
      const xl=i0>=0&&i0+1<len?L[i0]*(1-fr)+L[i0+1]*fr:0,xr=i0>=0&&i0+1<len?R[i0]*(1-fr)+R[i0+1]*fr:0;
      const n1=(Math.random()*2-1),n2=(Math.random()*2-1);
      hp1+=(n1-hp1)*0.6;hp2+=(n2-hp2)*0.6;
      yl+=al*(Math.tanh(sat*xl)/ns-yl);yr+=al*(Math.tanh(sat*xr)/ns-yr);
      const vl=yl+(n1-hp1)*hs,vr=yr+(n2-hp2)*hs;oL[k]=vl;oR[k]=vr;
      const a=Math.abs(vl),b2=Math.abs(vr);if(a>pk)pk=a;if(b2>pk)pk=b2;
      if((k&0x3fff)===0&&k)await new Promise(r=>setTimeout(r,0));
    }
    if(pk>0.95){const g=0.95/pk;for(let k=0;k<len;k++){oL[k]*=g;oR[k]*=g;}}
    return out;
}
/* ping-pong: sum every other track onto the armed one, with generation loss */
async function pingpong(){
  if(!cur||busy)return;if(S.mode!=='stop')stopTransport();
  const dst=cur.meta.arm,srcs=[];
  cur.T.forEach((t,i)=>{if(i!==dst&&t.buf&&!cur.meta.mix[i].m)srcs.push(i);});
  if(!srcs.length){say(_t('NOTHING TO MIX — UNMUTE A TRACK'),2200);click('tick');return;}
  busy=true;say(_t('PING-PONG…'),99999);mixEl.classList.remove('on');
  await new Promise(r=>setTimeout(r,60));
  try{
    const sr=ctx.sampleRate;let len=0;for(const i of srcs)len=Math.max(len,cur.T[i].buf.length);
    const L=new Float32Array(len),R=new Float32Array(len);
    for(const i of srcs){
      const b=cur.T[i].buf,mx=cur.meta.mix[i],pa=(clamp(mx.p||0,-1,1)+1)*Math.PI/4,gl=Math.cos(pa)*mx.g*1.414,gr=Math.sin(pa)*mx.g*1.414;
      const a0=b.getChannelData(0),a1=b.getChannelData(Math.min(1,b.numberOfChannels-1));
      for(let k=0;k<b.length;k++){L[k]+=a0[k]*gl;R[k]+=a1[k]*gr;}
    }
    const out=await degrade(L,R,len,age());
    cur.T[dst]={buf:out,rev:null};setDur();paintLabel();
    for(const i of srcs)cur.meta.mix[i].m=true;
    cur.meta.wear=Math.min(1.3,(cur.meta.wear||0)+0.07);cur.meta.gen=(cur.meta.gen||1)+1;paintLabel();paintAge(true);
    await saveTrack(cur,dst);await dbPut('meta',cur.meta);
    click('big');say('PING-PONG → T'+(dst+1)+_t(' DONE'),2600);
  }catch(e){say(_t('PING-PONG FAILED'),2500);}
  busy=false;
}
$('#mxPP').addEventListener('click',pingpong);
/* DUB: copy the whole cassette onto a new one, one generation down: every track goes through the same tape loss as a ping-pong */
async function dubTape(){
  if(!cur||busy)return;if(S.mode!=='stop')stopTransport();
  const src=cur,sm=src.meta;busy=true;say(_t('DUBBING…'),99999);mixEl.classList.remove('on');
  await new Promise(r=>setTimeout(r,60));
  try{
    const ag=clamp(age()+0.12,0,1.3),id=uid();
    const m={id,name:sm.name,nameB:sm.nameB,shell:sm.shell,paper:sm.paper,stripe:sm.stripe,pen:sm.pen,rot:sm.rot,dur:sm.dur,durB:sm.durB,created:Date.now(),
      gen:(sm.gen||1)+1,wear:Math.min(1.3,(sm.wear||0)+0.1),plays:0,secs:0,arm:sm.arm||0,mix:(sm.mix||[]).map(x=>({g:x.g,m:x.m,p:x.p}))};
    for(let sd=0;sd<2;sd++){
      const T=sd===src.side?src.T:await loadSide(sm,sd);
      for(let n=0;n<NT;n++){
        const b=T[n]&&T[n].buf;if(!b)continue;
        const L=b.getChannelData(0),R=b.getChannelData(Math.min(1,b.numberOfChannels-1));
        const out=await degrade(L,R,b.length,ag);
        await dbPut('data',{id:trKey(id,sd,n),buf:toWav(out),type:'audio/wav'});
      }
    }
    await dbPut('meta',m);lib.push(m);renderTray();
    click('big');say(_t('DUB DONE · G')+m.gen,2600);
  }catch(e){say(_t('DUB FAILED'),2500);}
  busy=false;
}
$('#mxDub').addEventListener('click',dubTape);

/* flip the cassette: side B has its own four tracks */
async function flip(){
  if(!cur||busy)return;busy=true;
  if(S.mode!=='stop')stopTransport();
  const m=cur.meta,ns=cur.side^1;
  say(_t('FLIPPING…'),99999);
  try{
    const T=await loadSide(m,ns);
    await dbPut('meta',m);
    const old=cur.el;old.classList.remove('enter');old.classList.add('leave');setTimeout(()=>old.remove(),320);
    const c=buildCassette(m,ns);slot.appendChild(c.el);
    cur.T=T;cur.side=ns;cur.el=c.el;cur.refs=c.refs;cur.aL=cur.aR=0;cur.rL=26;cur.rR=20;
    setDur();paintLabel();S.off=0;lastPos=0;cntZero=0;loopGen=0;paintAge(true);
    click('latch');say(_t('SIDE ')+(ns?'B':'A')+(cur.dur?'':_t(' — EMPTY')),2000);renderMixer();
  }catch(e){say(_t('COULD NOT FLIP'),2200);}
  busy=false;
}
$('#mxFlip').addEventListener('click',flip);
/* J-card */
async function shareFile(file){
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'HISS'});return;}}
  catch(e){if(e&&e.name==='AbortError')return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=file.name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);
}
async function jcard(){
  if(!cur)return;const m=cur.meta,W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const css=getComputedStyle(document.body),accent=css.getPropertyValue('--accent').trim()||'#ffb84a';
  x.fillStyle=m.paper;x.fillRect(0,0,W,H);
  x.fillStyle='rgba(0,0,0,.04)';for(let i=0;i<1400;i++)x.fillRect(Math.random()*W,Math.random()*H,2,2);
  x.fillStyle=m.stripe;x.fillRect(0,0,W,120);x.fillRect(0,H-70,W,70);
  const mono='ui-monospace,Menlo,monospace',hand='"Bradley Hand","Noteworthy","Marker Felt","Segoe Print",cursive';
  x.fillStyle=m.paper;x.font='700 34px '+mono;x.textBaseline='middle';{const br=(THEMES.find(t=>t.id===theme)||THEMES[0]).brand;x.fillText(br+' · HISS',60,60);}
  x.textAlign='right';x.fillText('C-'+(m.cap?Math.round(m.cap/60):Math.max(10,Math.round((Math.max(m.dur||0,m.durB||0)/60)*2))),W-60,60);x.textAlign='left';
  const hd=isHand(m),tf=hd?hand:printFF(),tw=hd?'':(PWT[theme]||600)+' ';x.fillStyle=m.pen;x.font=tw+'96px '+tf;
  let t=labTxt(m,m.name),fs=96;while(x.measureText(t).width>W-120&&fs>40){fs-=6;x.font=tw+fs+'px '+tf;}
  x.save();x.translate(60,250);x.rotate(hd?(m.rot||0)*Math.PI/180:0);x.fillText(t,0,0);x.restore();
  x.strokeStyle='rgba(0,0,0,.18)';x.lineWidth=2;for(let y=330;y<=450;y+=60){x.beginPath();x.moveTo(60,y);x.lineTo(W-60,y);x.stroke();}
  const cols=[[0,m.name,m.dur],[1,m.nameB||'',m.durB]];
  for(const [sd,nm,du] of cols){
    const ox=60+sd*480;x.fillStyle=m.stripe;x.fillRect(ox,520,440,6);
    x.fillStyle=m.pen;x.font='700 40px '+mono;x.fillText('SIDE '+(sd?'B':'A'),ox,580);
    x.font='28px '+mono;x.globalAlpha=.7;x.fillText(du?fmt(du):'--:--',ox+300,580);x.globalAlpha=1;
    x.font=tw+'42px '+tf;const nn=labTxt(m,sd?(nm||'—'):nm);x.fillText(nn.length>22?nn.slice(0,21)+'…':nn,ox,650);
    let tr=[];
    if(sd===cur.side){cur.T.forEach((tk,i)=>{if(tk.buf)tr.push('T'+(i+1)+'  '+fmt(tk.buf.duration)+(cur.meta.mix[i].m?'  (mute)':''));});}
    else{tr=du?[_t('recorded · ')+fmt(du)]:[_t('empty')];}
    x.font='26px '+mono;tr.forEach((l,k)=>{x.globalAlpha=.8;x.fillText(l,ox,720+k*44);x.globalAlpha=1;});
  }
  x.fillStyle=m.pen;x.globalAlpha=.55;x.font='26px '+mono;
  x.fillText(_t('TAPE WEAR ')+Math.round(clamp(age(),0,1.3)*100)+'%'+(loopGen?_t(' · LOOP ')+loopGen:''),60,1010);
  {const sc=Math.round(m.secs||0),h=Math.floor(sc/3600),mi=Math.floor(sc%3600/60);x.fillText('G'+(m.gen||1)+' · '+_t('PLAYED ')+(m.plays||0)+'× · '+(h?h+_t(' H '):'')+mi+_t(' MIN'),60,960);}
  x.fillText(new Date(m.created||Date.now()).toLocaleDateString('ru-RU'),60,1060);x.globalAlpha=1;
  x.fillStyle=accent;x.beginPath();x.arc(W-120,1040,34,0,7);x.fill();x.fillStyle=m.paper;x.beginPath();x.arc(W-120,1040,12,0,7);x.fill();
  x.fillStyle=m.paper;x.font='700 28px '+mono;x.fillText('shoogaze.github.io/hiss',60,H-35);
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));
  const base=m.name.replace(/[^\wЀ-ӿ-]+/g,'_')||'hiss';
  await shareFile(new File([blob],base+'_jcard.png',{type:'image/png'}));
  say(_t('J-CARD READY'),1800);
}
$('#mxCard').addEventListener('click',jcard);
let delT=null;
$('#mxDel').addEventListener('click',()=>{
  const b=$('#mxDel');if(!cur)return;
  if(!b.classList.contains('sure')){b.classList.add('sure');b.textContent=_t('REALLY DELETE? TAP AGAIN');click('tick');clearTimeout(delT);delT=setTimeout(()=>{b.classList.remove('sure');b.textContent=_t('DELETE CASSETTE');},2500);return;}
  clearTimeout(delT);b.classList.remove('sure');b.textContent=_t('DELETE CASSETTE');
  const m=cur.meta;mixEl.classList.remove('on');removeTape(m);
});
function renderSkins(){
  skinGrid.innerHTML='';
  THEMES.forEach(T=>{
    const d=document.createElement('div');d.className='tile'+(T.id===theme?' sel':'');
    d.innerHTML=`<div class="sw" style="background:${T.sw[0]}"><i style="background:${T.sw[1]}"></i><i style="background:${T.sw[1]}"></i><i style="background:${T.sw[1]}"></i><s style="background:${T.sw[2]}"></s></div><b>${T.name}</b><small>${_t(T.desc)}</small>`;
    d.addEventListener('click',()=>{applyTheme(T.id);});
    skinGrid.appendChild(d);
  });
}
function applyTheme(id,silent){
  const T=THEMES.find(x=>x.id===id)||THEMES[0];theme=T.id;
  document.body.dataset.theme=T.id;paintWearArt();
  try{if(cur&&cur.refs&&cur.refs.nm)paintLabel();}catch(e){}
    $('#brandB').textContent=T.brand;$('#brandS').textContent=T.sub;
  const mc=document.querySelector('meta[name=theme-color]');
  if(mc){const c=getComputedStyle(document.body).getPropertyValue('--meta').trim();if(c)mc.setAttribute('content',c);}
  try{localStorage.setItem('tape4.theme',theme);}catch(e){}
  if(ctx){A.clk.gain.value=TC().lv;A.clkEq.gain.value=TC().bd;applyTape();loadSamples();}
  renderSkins();
  try{lidMask();lidFit();}catch(e){}
  try{updatePrint();}catch(e){}   /* lid print follows the skin at once, not on the next 500 ms tick */
}
function closeSkins(){themesEl.classList.remove('on');click('toggle');}
$('#skinBtn').addEventListener('click',()=>{initAudio();renderSkins();themesEl.classList.add('on');click('toggle');});
$('#skinX').addEventListener('click',closeSkins);
themesEl.addEventListener('click',e=>{if(e.target===themesEl)closeSkins();});

/* SERVICE DECK: cleaned and polished, the machine is as good as new (tapes keep their own wear) */
$('#mxClean').addEventListener('click',()=>{
  const b=$('#mxClean');
  if(!b.classList.contains('sure')){b.classList.add('sure');b.textContent=_t('REALLY? TAP AGAIN');click('tick');clearTimeout(b._t);b._t=setTimeout(()=>{b.classList.remove('sure');b.textContent=_t('SERVICE DECK');},2500);return;}
  b.classList.remove('sure');b.textContent=_t('SERVICE DECK');
  D.hrs=0;saveDeck();paintDeckWear(true);click('latch');say(_t('DECK SERVICED'),1500);
});

/* NEW TAPE: the cassette is re-taped, wear and loop damage are gone for good */
$('#mxNew').addEventListener('click',()=>{
  if(!cur)return;const b=$('#mxNew');
  if(!b.classList.contains('sure')){b.classList.add('sure');b.textContent=_t('REALLY? TAP AGAIN');click('tick');clearTimeout(b._t);b._t=setTimeout(()=>{b.classList.remove('sure');b.textContent=_t('NEW TAPE');},2500);return;}
  b.classList.remove('sure');b.textContent=_t('NEW TAPE');
  cur.meta.wear=0;loopGen=0;paintAge(true);renderTray();dbPut('meta',cur.meta).catch(()=>{});click('latch');say(_t('NEW TAPE'),1500);
});
