/* ---------- record ---------- */
function sessionType(t){try{if(navigator.audioSession)navigator.audioSession.type=t;}catch(e){}}
async function armRec(){
  if(armed){stopTransport();return;}
  if(!cur){say(_t('NO CASSETTE'),1500);return;}
  if(lidP>0.08){say(_t('CLOSE THE LID'),1500);return;}
  if(isRun(S.mode)){say(_t('PRESS STOP FIRST'),1500);return;}
  initAudio();
  if(!navigator.mediaDevices||!window.MediaRecorder){say(_t('RECORDING NOT SUPPORTED'),2500);return;}
  armed=true;renderKeys();
  try{
    sessionType('play-and-record');
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    if(!armed){stream.getTracks().forEach(t=>t.stop());sessionType('playback');return;}
    const src=ctx.createMediaStreamSource(stream);
    const rg=ctx.createGain();rg.gain.value=D.rec*0.8;
    const cl=ctx.createWaveShaper();cl.curve=makeCurve(1.1,0);
    const an=ctx.createAnalyser();an.fftSize=512;
    src.connect(rg);rg.connect(cl);cl.connect(an);rg.connect(A.vuBus);
    let md=null;try{md=ctx.createMediaStreamDestination();cl.connect(md);}catch(e){}
    rec={stream,src,rg,cl,an,md,pb:new Float32Array(512),mr:null,chunks:[],start:0};
    say(_t('REC READY — PRESS PLAY'),3000);
  }catch(e){armed=false;sessionType('playback');say(_t('NO MICROPHONE ACCESS'),2500);}
  renderKeys();
}
function releaseMic(){
  if(rec){try{rec.src.disconnect();}catch(e){}try{rec.stream.getTracks().forEach(t=>t.stop());}catch(e){}}
  rec=null;sessionType('playback');
}
function startRec(){
  const p=getPos();rec.chunks=[];rec.ai=cur.meta.arm||0;
  try{rec.mr=new MediaRecorder(rec.md?rec.md.stream:rec.stream);}catch(e){say(_t('RECORDING NOT SUPPORTED'),2500);return;}
  const rr=rec;rec.mr.ondataavailable=e=>{if(e.data&&e.data.size)rr.chunks.push(e.data);};
  rec.mr.start();S.dir=1;S.rate=1;S.mode='rec';startSource(p,1,false,rec.ai);S.off=p;S.t0=S.t0||ctx.currentTime;rec.start=p;
  updateMotor();renderKeys();wake();say(_t('RECORDING'),99999);
}
function finishRec(){
  const r=rec,target=cur; rec=null;armed=false;
  if(!r||!r.mr||r.mr.state==='inactive'){if(r){try{r.src.disconnect();}catch(e){}r.stream.getTracks().forEach(t=>t.stop());}sessionType('playback');say('',0);return;}
  r.mr.onstop=async()=>{
    try{r.src.disconnect();}catch(e){}r.stream.getTracks().forEach(t=>t.stop());sessionType('playback');
    const blob=new Blob(r.chunks,{type:r.mr.mimeType||'audio/mp4'});
    if(!blob.size){say('',0);return;}
    say(_t('SAVING… WAIT'),99999);
    try{
      const rb=await decodeBuf(await blob.arrayBuffer());
      const T=target.T[r.ai],nb=overwrite(T.buf,rb,Math.max(0,r.start-REC_LAT));
      T.buf=nb;T.rev=null;setDur(target);
      await saveTrack(target,r.ai);target.meta.wear=Math.min(1.3,(target.meta.wear||0)+0.012);
      await dbPut('meta',target.meta);
      say(_t('RECORDED'),2000);
    }catch(e){say(_t('RECORDING FAILED'),2500);}
  };
  try{r.mr.stop();}catch(e){say('',0);}
}
const REC_LAT=0.05;
function overwrite(buf,rb,at){
  const sr=rb.sampleRate,s0=Math.floor(at*sr),len=Math.max(buf?buf.length:0,s0+rb.length),out=ctx.createBuffer(2,len,sr);
  for(let c=0;c<2;c++){
    const o=out.getChannelData(c);if(buf)o.set(buf.getChannelData(Math.min(c,buf.numberOfChannels-1)));
    o.set(rb.getChannelData(Math.min(c,rb.numberOfChannels-1)),s0);
  }
  return out;
}
function toWav(buf){
  const ch=Math.min(2,buf.numberOfChannels),n=buf.length,sr=buf.sampleRate,ab=new ArrayBuffer(44+n*ch*2),v=new DataView(ab);
  const ws=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
  ws(0,'RIFF');v.setUint32(4,36+n*ch*2,true);ws(8,'WAVE');ws(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);
  v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);ws(36,'data');v.setUint32(40,n*ch*2,true);
  const d=[];for(let c=0;c<ch;c++)d.push(buf.getChannelData(c));
  let o=44;for(let i=0;i<n;i++)for(let c=0;c<ch;c++){const x=clamp(d[c][i],-1,1);v.setInt16(o,x<0?x*0x8000:x*0x7fff,true);o+=2;}
  return ab;
}
