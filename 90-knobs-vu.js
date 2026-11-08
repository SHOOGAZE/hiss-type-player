/* ---------- counter, knobs, vu ---------- */
const drums=[];const cntEl=$('#counter');
for(let i=0;i<4;i++){const d=document.createElement('div');d.className='drum';const c=document.createElement('div');c.className='col';
  for(let n=0;n<10;n++){const s=document.createElement('span');s.textContent=n;c.appendChild(s);}d.appendChild(c);cntEl.appendChild(d);drums.push(c);}
let lastCnt=-1,lastTick=0;
function setCounter(pos){
  let n=Math.floor((pos-cntZero)/1.2);n=((n%10000)+10000)%10000;
  if(n===lastCnt)return;lastCnt=n;const s=String(n).padStart(4,'0');
  drums.forEach((c,i)=>c.style.transform='translateY(-'+(+s[i]*26)+'px)');
  const t=performance.now();if(ctx&&isRun(S.mode)&&t-lastTick>90){lastTick=t;click('tick');}
}
$('#reset').addEventListener('click',()=>{initAudio();cntZero=getPos();lastCnt=-1;click('down');setCounter(getPos());});

let kuid=0;
const GLINT='<svg class="glint" viewBox="-50 -50 100 100"><path d="M-26 -24A35 35 0 0 1 10 -34" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/><path d="M-30 -14A34 34 0 0 1 -22 -27" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2" stroke-linecap="round"/><path d="M24 30A35 35 0 0 1 -6 37" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2.4" stroke-linecap="round"/></svg>';
function capSVG(){
  const id='kg'+(kuid++);let ribs='';const N=30;
  for(let i=0;i<N;i++)ribs+=`<rect x="-1.5" y="-49.5" width="3" height="9" rx="1" transform="rotate(${(i*360/N).toFixed(2)})"/>`;
  return `<svg class="kc" viewBox="-50 -50 100 100">
  <defs>
   <radialGradient id="${id}b" cx=".36" cy=".3" r=".95"><stop offset="0" stop-color="var(--k1)"/><stop offset=".58" stop-color="var(--k2)"/><stop offset="1" stop-color="var(--k3)"/></radialGradient>
   <radialGradient id="${id}d" cx=".62" cy=".68" r=".9"><stop offset="0" stop-color="var(--k1)"/><stop offset=".6" stop-color="var(--k2)"/><stop offset="1" stop-color="var(--k3)"/></radialGradient>
  </defs>
  <circle r="48" cy="3" fill="#000" opacity=".28"/><circle r="45" cy="1.6" fill="#000" opacity=".28"/>
  <g class="rib"><circle r="49" fill="var(--kr2)"/><g fill="var(--kr1)">${ribs}</g><circle r="40.5" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="1.6"/></g>
  <circle r="41" fill="url(#${id}b)" stroke="#000" stroke-opacity=".5" stroke-width=".9"/>
  <circle r="40" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width=".7"/>
  <g class="rings" fill="none"><circle r="36" stroke="#000" stroke-opacity=".16" stroke-width=".6"/><circle r="35.4" stroke="#fff" stroke-opacity=".18" stroke-width=".5"/>
   <circle r="31" stroke="#000" stroke-opacity=".14" stroke-width=".6"/><circle r="30.4" stroke="#fff" stroke-opacity=".16" stroke-width=".5"/>
   <circle r="26" stroke="#000" stroke-opacity=".13" stroke-width=".6"/><circle r="25.4" stroke="#fff" stroke-opacity=".14" stroke-width=".5"/>
   <circle r="21" stroke="#000" stroke-opacity=".12" stroke-width=".6"/><circle r="20.4" stroke="#fff" stroke-opacity=".12" stroke-width=".5"/></g>
  <g class="dish"><circle r="23" fill="url(#${id}d)" stroke="#000" stroke-opacity=".38" stroke-width=".8"/><circle r="22.2" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width=".6" stroke-dasharray="0"/></g>
  </svg>`;
}
function knob(el,o){
  let v=o.val,acc=0,bump=0,lastHit=0;
  const N=21,PX=8,stepLog=[];let fly=0;
  const angOf=x=>-135+270*(x-o.min)/(o.max-o.min);
  let t='<svg viewBox="0 0 60 60">';
  for(let i=0;i<N;i++){const a=(-135+i*13.5)*Math.PI/180,r1=28,r2=i%5===0?22.5:24.5;
    t+=`<line x1="${(30+r1*Math.sin(a)).toFixed(2)}" y1="${(30-r1*Math.cos(a)).toFixed(2)}" x2="${(30+r2*Math.sin(a)).toFixed(2)}" y2="${(30-r2*Math.cos(a)).toFixed(2)}" stroke-width="1.6" stroke-linecap="round"/>`;}
  el.innerHTML=t+'</svg>';
  const lines=[...el.querySelectorAll('line')];
  const hold=document.createElement('i');hold.className='cap';
  const cap=document.createElement('i');cap.className='spin';cap.innerHTML=capSVG()+'<b></b>';
  hold.appendChild(cap);hold.insertAdjacentHTML('beforeend',GLINT);el.appendChild(hold);
  const render=()=>{
    for(let i=0;i<N;i++){
      const tv=o.min+(o.max-o.min)*i/(N-1),e=1e-9;
      const lit=o.bi?(v>=o.def?(tv>=o.def-e&&tv<=v+e):(tv<=o.def+e&&tv>=v-e)):(tv<=v+e);
      lines[i].classList.toggle('lit',lit);
    }
    cap.style.transform='rotate('+(angOf(v)+bump)+'deg)';o.show(v);
  };
  const recoil=(dir,k)=>{bump=dir*5.5*k;cap.style.transition='transform .05s ease-out';render();
    clearTimeout(recoil.t);recoil.t=setTimeout(()=>{bump=0;cap.style.transition='transform .14s cubic-bezier(.3,1.8,.5,1)';render();setTimeout(()=>{cap.style.transition='';},170);},55);};
  render();let gk=null,lastTap=0;
  el.addEventListener('pointerdown',e=>{cancelAnimationFrame(fly);stepLog.length=0;el.setPointerCapture(e.pointerId);gk={x:e.clientX,y:e.clientY,tot:0};e.preventDefault();initAudio();});
  el.addEventListener('pointermove',e=>{
    if(!gk)return;
    const d=(gk.y-e.clientY)+(e.clientX-gk.x);gk.y=e.clientY;gk.x=e.clientX;
    if(d===0)return;
    gk.tot+=Math.abs(d);acc+=d;
    while(Math.abs(acc)>=PX){
      const dir=acc>0?1:-1;acc-=dir*PX;
      const nv=+clamp(Math.round((v+dir*o.step)/o.step)*o.step,o.min,o.max).toFixed(4);
      if(Math.abs(nv-v)>1e-9){v=nv;click('enc');o.onChange(v);stepLog.push({t:performance.now(),d:dir});if(stepLog.length>8)stepLog.shift();recoil(dir,.3);
        if(v<=o.min+1e-9||v>=o.max-1e-9){thunk(.3);recoil(dir,1);try{navigator.vibrate&&navigator.vibrate(12);}catch(e){}}}
      else{acc=0;const t=performance.now();if(t-lastHit>110){thunk(t-lastHit>600?.4:.18);lastHit=t;try{navigator.vibrate&&navigator.vibrate(6);}catch(e){}}recoil(dir,.6);break;}
    }
    render();
  });
  /* a heavy knob keeps turning after a flick: speed (steps/s) decays with friction, each step still clicks */
  const flywheel=()=>{
    const now=performance.now(),rec=stepLog.filter(x=>now-x.t<170);
    if(rec.length<3||now-rec[rec.length-1].t>90)return;
    const dir=rec[rec.length-1].d,span=(rec[rec.length-1].t-rec[0].t)/1000||0.05;
    let sp=Math.min(34,(rec.length-1)/span);if(sp<9)return;
    let ps=0,last=now;
    const tick=tt=>{
      const dt=Math.min(0.05,(tt-last)/1000);last=tt;sp*=Math.exp(-2.7*dt);ps+=sp*dt;
      while(ps>=1){ps-=1;
        const nv=+clamp(Math.round((v+dir*o.step)/o.step)*o.step,o.min,o.max).toFixed(4);
        if(Math.abs(nv-v)<1e-9){thunk(.3);recoil(dir,1);return;}
        v=nv;click('enc');o.onChange(v);recoil(dir,.3);render();
        if(v<=o.min+1e-9||v>=o.max-1e-9){thunk(.3);recoil(dir,1);return;}}
      if(sp>2.5)fly=requestAnimationFrame(tick);
    };
    fly=requestAnimationFrame(tick);
  };
  const up=()=>{
    if(gk&&gk.tot>=5)flywheel();
    if(gk&&gk.tot<5){const n=performance.now();
      if(n-lastTap<320){v=o.def;click('big');render();o.onChange(v);}
      lastTap=n;}
    gk=null;
  };
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',()=>{gk=null;});
  return {set(x){v=x;render();o.onChange(v);},sync(x){v=x;render();}};
}
const pitchK=knob($('#kPitch'),{min:-0.12,max:0.12,val:pitch,def:0,step:0.005,bi:true,
  show:v=>{$('#oPitch').textContent=(v>0?'+':'')+(v*100).toFixed(1)+'%';},onChange:v=>{setPitch(v);say('PITCH '+(v>0?'+':'')+(v*100).toFixed(1)+'%',700);}});
const tapeK=knob($('#kTape'),{min:0,max:1,val:tapeAmt,def:0.25,step:0.025,
  show:v=>{$('#oTape').textContent=Math.round(v*100);},onChange:v=>{tapeAmt=v;applyTape();saveSet();say('TAPE '+Math.round(v*100),700);}});
$('#loopBtn').addEventListener('click',()=>{initAudio();loopOn=!loopOn;$('#loopBtn').classList.toggle('on',loopOn);click('down');setTimeout(()=>click('up'),70);const first=loopOn&&!localStorage.getItem('tape4.loopw');if(first)try{localStorage.setItem('tape4.loopw','1');}catch(e){}
  say(loopOn?(first?_t('LOOP ERODES THE AUDIO · IT CANNOT BE UNDONE'):_t('LOOP ON — THE TAPE WILL SHED')):_t('LOOP OFF'),first?3600:1800);});
/* the speaker LED follows the output level of the two channels */
const vus=[{v:0,an:'anL'},{v:0,an:'anR'}];
const vbuf=new Float32Array(1024);
function updateVU(dt){
  vuKick*=Math.exp(-dt*9);
  for(const x of vus){
    let n=0;
    if(ctx&&A[x.an]&&(S.mode!=='stop'||armed||x.v>0.004)){A[x.an].getFloatTimeDomainData(vbuf);let s=0;for(let i=0;i<1024;i++)s+=vbuf[i]*vbuf[i];
      const db=20*Math.log10(Math.sqrt(s/1024)+1e-5);n=clamp(0.8+(db+8)*0.025,0,1.04);}
    if(vuKick>0.003)n=clamp(n+vuKick*(0.4+Math.random()*0.6),0,1.04);
    const tau=n>x.v?0.08:0.28;x.v+=(n-x.v)*(1-Math.exp(-dt/tau));
  }
}
/* empty spindles */
(function(){let s='';for(const cx of [CL,CR]){s+=`<circle cx="${cx}" cy="${CY}" r="17" fill="#1a1814" stroke="#000"/><circle cx="${cx}" cy="${CY}" r="12" fill="#8d877b"/><circle cx="${cx}" cy="${CY}" r="8" fill="#2b2925"/>`;
  for(let i=0;i<6;i++)s+=`<rect x="${cx-2}" y="${CY-8}" width="4" height="4" fill="#cfc9bb" transform="rotate(${i*60} ${cx} ${CY})"/>`;}
  $('#spinds').innerHTML=s;})();
