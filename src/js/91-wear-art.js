/* ---------- deck wear art: scratches are drawn at runtime, so no two decks (or skins) carry the same marks ----------
   The pattern is seeded by a per-install number plus the skin, so a deck keeps its own scratches; each material scratches in its own way. */
var wrSeed=0;
const WR_STYLE={   /* n/nb: scratches per layer, len: longest scratch, spread: how far angles stray from the main direction, chips: flaked paint at the edges,
                      soft: scuffed smudges, fade: large faded-paint patches, edge: rubbed edges, deep: wide deep scratches, gain: how visible marks are */
  sonic:    {n:44,nb:64,len:130,spread:.2, chips:2, cl:3,soft:0,fade:0,edge:0, deep:0,gain:.9},   /* anodised aluminium: many fine scratches, one direction */
  kami:     {n:14,nb:22,len:34, spread:1.4,chips:0, cl:6,soft:10,fade:0,edge:0, deep:0,gain:.8},  /* matte plastic: soft scuffs and short marks, nothing long */
  nashville:{n:14,nb:22,len:150,spread:.8,chips:14,cl:2,soft:0,fade:0,edge:0, deep:4,gain:1},     /* painted metal: chipped edges and a few deep scratches */
  kiiro:    {n:8, nb:14,len:50, spread:1.8,chips:4, cl:3,soft:4,fade:0,edge:12,deep:0,gain:.85},  /* rubber and plastic: few scratches, rubbed edges */
  akane:    {n:20,nb:32,len:90, spread:1.0,chips:5, cl:3,soft:2,fade:7,edge:0, deep:0,gain:.9},   /* lacquer: moderate, with patches of faded paint */
  kuro:     {n:34,nb:54,len:140,spread:.6, chips:2, cl:2,soft:0,fade:0,edge:0, deep:0,gain:1.15}  /* black plastic: light fine scratches, the most visible */
};
var wrGain=1;
function wrRng(seed){let h=seed>>>0;return()=>{h=(Math.imul(h,1664525)+1013904223)>>>0;return h/4294967296;};}
function wrLens(x,y,l,a,w,cv){
  const dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,ex=x+dx*l,ey=y+dy*l,cx=x+dx*l/2+nx*cv,cy=y+dy*l/2+ny*cv,f=v=>v.toFixed(1);
  return 'M'+f(x)+' '+f(y)+'Q'+f(cx+nx*w)+' '+f(cy+ny*w)+' '+f(ex)+' '+f(ey)+'Q'+f(cx-nx*w)+' '+f(cy-ny*w)+' '+f(x)+' '+f(y)+'Z';
}
function wrScr(x,y,l,a,w,cv,op){op=Math.min(1,op*wrGain);const d=wrLens(x,y,l,a,w,cv);
  return "<path d='"+d+"' fill='#2a1e12' fill-opacity='"+(op*.55).toFixed(2)+"' transform='translate(.5 .6)'/><path d='"+d+"' fill='#f6f1e4' fill-opacity='"+op.toFixed(2)+"'/>";}
function wrLayer(W,H,n,cl,chips,R,dir,spread,lmax,st,heavy){
  let o='';
  if(st){
    for(let i=0;i<st.fade*(heavy?1:.6);i++)o+="<ellipse cx='"+(R()*W).toFixed(0)+"' cy='"+(R()*H).toFixed(0)+"' rx='"+(30+R()*40).toFixed(0)+"' ry='"+(18+R()*30).toFixed(0)+"' fill='#f6f1e4' fill-opacity='"+(.05+R()*.06).toFixed(3)+"' transform='rotate("+(R()*180).toFixed(0)+")'/>";
    for(let i=0;i<st.soft*(heavy?1:.6);i++){const x=R()*W,y=R()*H;o+="<ellipse cx='"+x.toFixed(1)+"' cy='"+y.toFixed(1)+"' rx='"+(5+R()*10).toFixed(1)+"' ry='"+(1.5+R()*2.5).toFixed(1)+"' fill='#f6f1e4' fill-opacity='"+(.1+R()*.12).toFixed(3)+"' transform='rotate("+((dir*57.3)+(R()-.5)*50).toFixed(0)+" "+x.toFixed(1)+" "+y.toFixed(1)+")'/>";}
    for(let i=0;i<st.edge*(heavy?1:.6);i++){const sd=(R()*4)|0,l=18+R()*50;
      if(sd===0)o+=wrScr(1.5+R()*2,R()*H,l,Math.PI/2,.9,(R()-.5)*2,.5);else if(sd===1)o+=wrScr(W-1.5-R()*2,R()*H,l,Math.PI/2,.9,(R()-.5)*2,.5);
      else if(sd===2)o+=wrScr(R()*W,1.5+R()*2,l,0,.9,(R()-.5)*2,.5);else o+=wrScr(R()*W,H-1.5-R()*2,l,0,.9,(R()-.5)*2,.5);}
    if(heavy)for(let i=0;i<st.deep;i++)o+=wrScr(R()*W,R()*H,50+R()*70,dir+(R()-.5)*.5,.8+R()*.4,(R()-.5)*8,.85);
  }
  for(let i=0;i<n;i++){const l=10+R()*R()*lmax,a=dir+(R()-.5)*(i<n*.7?.4:spread*2);
    o+=wrScr(R()*W,R()*H,l,a,.25+R()*.5,(R()-.5)*5,.45+R()*.45);}
  for(let k=0;k<cl;k++){const x=R()*W,y=R()*H,a=dir+(R()-.5)*.6;
    for(let j=0;j<5;j++)o+=wrScr(x+j*2.2*Math.sin(a),y-j*2.2*Math.cos(a),6+R()*16,a+(R()-.5)*.1,.22+R()*.2,(R()-.5)*1.5,.55);}
  for(let c=0;c<chips;c++){const sd=(R()*4)|0;let x,y;
    if(sd===0){x=R()*4;y=R()*H;}else if(sd===1){x=W-R()*4;y=R()*H;}else if(sd===2){x=R()*W;y=R()*4;}else{x=R()*W;y=H-R()*4;}
    const pts=[];for(let q=0;q<5;q++)pts.push([x+(R()-.5)*4.4,y+(R()-.5)*4.4]);
    pts.sort((a,b)=>Math.atan2(a[1]-y,a[0]-x)-Math.atan2(b[1]-y,b[0]-x));
    const d='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')+'Z';
    o+="<path d='"+d+"' fill='#2a1e12' fill-opacity='.35' transform='translate(.6 .7)'/><path d='"+d+"' fill='#f6f1e4' fill-opacity='.8'/>";}
  return o;
}
function wrUri(inner,W,H){return 'url("data:image/svg+xml,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 "+W+" "+H+"' preserveAspectRatio='none'>"+inner+"</svg>")+'")';}
function paintWearArt(){
  if(!document.body.classList.contains('worn'))return;
  try{
    if(!wrSeed){try{wrSeed=+localStorage.getItem('tape4.wseed')||0;if(!wrSeed){wrSeed=1+((Math.random()*4e9)>>>0);localStorage.setItem('tape4.wseed',String(wrSeed));}}catch(e){wrSeed=12345;}}
    const st=WR_STYLE[theme]||WR_STYLE.sonic,sk=[...theme].reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))>>>0,7);
    wrGain=st.gain;const R=wrRng(wrSeed^sk),dir=-.9+(R()-.5)*.8,b=document.body.style;
    b.setProperty('--wr-s1',wrUri(wrLayer(400,800,st.n,st.cl,st.chips>>1,R,dir,st.spread,st.len,st,false),400,800));
    b.setProperty('--wr-s2',wrUri(wrLayer(400,800,st.nb,st.cl+2,st.chips,R,dir,st.spread,st.len,st,true),400,800));
    const kn=[12,7,12,7,12,7];
    for(let i=1;i<=6;i++){let o='';const kr=wrRng(wrSeed+i*7919+sk);
      for(let j=0;j<kn[i-1];j++)o+=wrScr(12+kr()*36,9+kr()*29,3+kr()*9,-.6+(kr()-.5)*1.4,.22+kr()*.25,(kr()-.5)*2,.5+kr()*.4);
      b.setProperty('--wr-k'+i,wrUri(o,60,60));}
  }catch(e){}
}
