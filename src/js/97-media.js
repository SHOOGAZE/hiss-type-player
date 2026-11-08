/* ---------- lock screen / headphone controls (Media Session) ----------
   iOS only shows Now Playing for a real media element, so a silent looping <audio> runs while the tape moves; the sound itself still comes from Web Audio. */
var msAu=null,msKey='';
function msSilence(){const n=8000,b=new Uint8Array(44+n),dv=new DataView(b.buffer),w=(o,s)=>{for(let i=0;i<s.length;i++)b[o+i]=s.charCodeAt(i);};
  w(0,'RIFF');dv.setUint32(4,36+n,true);w(8,'WAVEfmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,8000,true);dv.setUint32(28,8000,true);dv.setUint16(32,1,true);dv.setUint16(34,8,true);w(36,'data');dv.setUint32(40,n,true);b.fill(128,44);
  let s='';for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return 'data:audio/wav;base64,'+btoa(s);}
function syncMedia(){
  if(!('mediaSession' in navigator))return;
  const live=S.mode==='play'||S.mode==='ff'||S.mode==='rew'||S.mode==='rec';
  try{
    if(!msAu){msAu=new Audio(msSilence());msAu.loop=true;msAu.setAttribute('playsinline','');}
    if(live){if(msAu.paused)msAu.play().catch(()=>{});}else if(!msAu.paused)msAu.pause();
    navigator.mediaSession.playbackState=cur?(live?'playing':'paused'):'none';
    if(!cur)return;
    const T=THEMES.find(x=>x.id===theme)||THEMES[0],k=curName()+'|'+T.brand+'|'+cur.side;
    if(k!==msKey){msKey=k;navigator.mediaSession.metadata=new MediaMetadata({title:curName(),artist:'HISS · '+T.brand,album:cur.side?'SIDE B':'SIDE A',
      artwork:[{src:'icons/icon-192.png',sizes:'192x192',type:'image/png'},{src:'icons/icon-512.png',sizes:'512x512',type:'image/png'}]});}
    if(cur.dur>0)navigator.mediaSession.setPositionState({duration:cur.dur,playbackRate:1,position:clamp(getPos(),0,cur.dur)});
  }catch(e){}
}
if('mediaSession' in navigator){
  try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(e){}   /* Safari: play through the silent switch like a media app */
  const set=(a,f)=>{try{navigator.mediaSession.setActionHandler(a,f);}catch(e){}};
  set('play',()=>{if(!cur)return;if(S.mode==='pause')pauseTape();else if(S.mode!=='play')go('play');});
  set('pause',()=>{if(S.mode==='play'||S.mode==='ff'||S.mode==='rew')pauseTape();});
  set('stop',()=>stopTransport());
  setInterval(syncMedia,2000);
}
