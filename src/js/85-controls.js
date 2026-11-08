/* ---------- keys ---------- */
const keyEls={};document.querySelectorAll('.key').forEach(k=>keyEls[k.dataset.k]=k);
const hold={},prevDown={};let holdT=null;
function renderKeys(){
  const m=S.mode;
  const want={play:m==='play'||m==='rec',rec:m==='rec'||armed,rew:m==='rew',ff:m==='ff',pause:m==='pause',stop:false};
  let popped=0;
  for(const k in want){
    const dn=want[k]||!!hold[k];keyEls[k].classList.toggle('down',dn);
    if(prevDown[k]&&!dn)popped++;prevDown[k]=dn;
  }
  if(ctx)for(let i=0;i<Math.min(popped,3);i++)setTimeout(()=>click('up'),i*30);
}
function press(id){
  switch(id){
    case 'play':
      if(armed&&rec&&S.mode!=='rec'){if(lidP>0.08){say(_t('CLOSE THE LID'),1500);break;}startRec();}
      else if(armed&&!rec){say(_t('WAITING FOR MIC…'),1200);}
      else if(S.mode!=='play')go('play');
      break;
    case 'stop':stopTransport(true);break;
    case 'rew':if(S.mode==='rec'||armed)say(_t('PRESS STOP FIRST'),1200);else windGo('rew');break;
    case 'ff':if(S.mode==='rec'||armed)say(_t('PRESS STOP FIRST'),1200);else windGo('ff');break;
    case 'pause':if(S.mode==='rec')say(_t('NO PAUSE WHILE RECORDING'),1200);else pauseTape();break;
    case 'rec':armRec();break;
  }
}
$('#keys').addEventListener('pointerdown',e=>{
  const k=e.target.closest('.key');if(!k)return;e.preventDefault();
  initAudio();const id=k.dataset.k;hold[id]=true;click('down');press(id);renderKeys();
});
const releaseHold=()=>{clearTimeout(holdT);holdT=setTimeout(()=>{for(const k in hold)hold[k]=false;renderKeys();},90);};
window.addEventListener('pointerup',releaseHold);window.addEventListener('pointercancel',releaseHold);
