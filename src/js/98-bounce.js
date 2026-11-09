/* ---------- bounce: capture exactly what you hear (master bus) to WAV ---------- */
let bnc=null;
function bounceStart(){
  initAudio();
  const sp=ctx.createScriptProcessor(4096,2,2),L=[],R=[];let n=0;
  sp.onaudioprocess=e=>{
    const a=e.inputBuffer.getChannelData(0),b=e.inputBuffer.getChannelData(Math.min(1,e.inputBuffer.numberOfChannels-1));
    L.push(new Float32Array(a));R.push(new Float32Array(b));n+=a.length;
    if(n>ctx.sampleRate*300)bounceStop();
  };
  A.master.connect(sp);sp.connect(A.dead);
  bnc={sp,L,R,t0:performance.now()};
  $('#bncBtn').classList.add('on');say(_t('BOUNCE ● RECORDING'),3600000);
}
async function bounceStop(){
  if(!bnc)return;const b=bnc;bnc=null;
  try{A.master.disconnect(b.sp);b.sp.disconnect();}catch(e){}
  b.sp.onaudioprocess=null;
  $('#bncBtn').classList.remove('on');say('',0);
  const n=b.L.reduce((a,x)=>a+x.length,0);
  if(n<ctx.sampleRate*0.3){say(_t('BOUNCE: TOO SHORT'),2000);return;}
  const buf=ctx.createBuffer(2,n,ctx.sampleRate),l=buf.getChannelData(0),r=buf.getChannelData(1);
  let o=0;for(let i=0;i<b.L.length;i++){l.set(b.L[i],o);r.set(b.R[i],o);o+=b.L[i].length;}
  let pk=0;for(let i=0;i<n;i++){const v=Math.abs(l[i]),w=Math.abs(r[i]);if(v>pk)pk=v;if(w>pk)pk=w;}
  if(pk>0.98){const k=0.98/pk;for(let i=0;i<n;i++){l[i]*=k;r[i]*=k;}}
  const base=(cur&&cur.meta.name?curName().replace(/\.[^.]+$/,''):'hiss').replace(/[^\w\u0400-\u04ff-]+/g,'_');
  const file=new File([toWav(buf)],base+'_hiss_'+theme+'.wav',{type:'audio/wav'});
  say('BOUNCE ✓ '+(n/ctx.sampleRate).toFixed(1)+_t(' S'),3000);
  try{
    if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'HISS bounce'});return;}
  }catch(e){if(e&&e.name==='AbortError')return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=file.name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);
}
$('#bncBtn').addEventListener('click',()=>{click('down');setTimeout(()=>click('up'),80);bnc?bounceStop():bounceStart();});
if(location.hash==='#dev')window.__tape4={get A(){return A},getPos,get dying(){return dying},click,applyTheme,initAudio,get ctx(){return ctx},A,get S(){return S},get cur(){return cur},go,loopWrap,pingpong,flip,jcard,get loopGen(){return loopGen},age,get lib(){return lib},renderTray,paintLabel,insert,cassSVG,repaintCass,reelOf,matOf,D,setTape:v=>{tapeAmt=v;applyTape();},applyTape};
try{applyTheme(localStorage.getItem('tape4.theme')||'sonic',true);}catch(e){applyTheme('sonic',true);}

requestAnimationFrame(frame);
renderKeys();
(async()=>{
  db=await dbOpen();
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist();}catch(e){}
  try{lib=await dbAll('meta');}catch(e){lib=[];}
  /* tablets: the deck keeps its phone proportions and is scaled up to the screen height, centred on the skin background */
  const deckEl=document.getElementById('deck'),tabQ=matchMedia('(min-width:700px) and (min-height:700px)');
  function fit(){
    if(!tabQ.matches||lsQ.matches){uiS=1;deckEl.style.cssText='';document.documentElement.classList.remove('tab');return;}
    const W=440;
    uiS=Math.max(1,Math.min((innerWidth-32)/W,innerHeight/860,2.4));
    document.documentElement.classList.add('tab');
    deckEl.style.cssText=`left:50%;right:auto;top:0;bottom:auto;width:${W+24}px;height:${innerHeight/uiS}px;transform:translateX(-50%) scale(${uiS});transform-origin:50% 0`;
  }
  fit();const refit=()=>{fit();renderTray();};window.addEventListener('resize',refit);window.addEventListener('orientationchange',()=>setTimeout(refit,200));
  renderTray();
  if(lang==='ru')applyLang();
})();
})();
