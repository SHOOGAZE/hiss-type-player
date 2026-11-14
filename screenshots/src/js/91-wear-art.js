/* ---------- deck wear art: marks are drawn at runtime, so no two decks (or skins) carry the same scratches ----------
   Seeded by a per-install number plus the skin: a deck keeps its own marks. Wear is placed the way a real deck gets it:
   bundles of fine parallel hairlines (a bag, a pocket), a few long "hero" scratches, cleaning swirls on glossy surfaces,
   more marks along the edges and where the thumb rests, almost none in the middle. Colours follow the material
   (light scratches on dark plastic, dark ones on pale plastic). */
var wrSeed=0;
const WR_STYLE={   /* B: hairline bundles (bl: lines per bundle, blen: their length), hero: long scratches, swirl: cleaning swirls, fine: single hairlines,
                      soft: scuffs, fade: faded-paint patches, edge: rubbed edges, chips: flaked paint, deep: wide scratches, gain: visibility, pal: [highlight, shadow] */
  sonic:    {B:5,bl:[7,15],blen:120,hero:1,swirl:0,fine:20,soft:0, fade:0,edge:0, chips:2, deep:0,gain:.9, spread:.15,pal:['#ffffff','#2c2f36']},  /* anodised aluminium: fine, one direction */
  kami:     {B:2,bl:[3,6], blen:34, hero:0,swirl:0,fine:6, soft:12,fade:0,edge:0, chips:0, deep:0,gain:.8, spread:1.2,pal:['#e6fff6','#0b3b33']},  /* matte plastic: soft scuffs, short marks */
  nashville:{B:1,bl:[3,6], blen:100,hero:2,swirl:0,fine:6, soft:0, fade:0,edge:0, chips:14,deep:4,gain:1,  spread:.6, pal:['#fffdf3','#4a4030']},  /* painted metal: chips and a few deep scratches */
  kiiro:    {B:1,bl:[3,5], blen:50, hero:0,swirl:1,fine:4, soft:4, fade:0,edge:12,chips:4, deep:0,gain:.85,spread:1.2,pal:['#fff6c0','#6b4a00']},  /* rubber and plastic: few scratches, rubbed edges */
  akane:    {B:2,bl:[4,8], blen:80, hero:1,swirl:1,fine:8, soft:2, fade:7,edge:0, chips:5, deep:0,gain:.9, spread:.8, pal:['#ffd9d0','#3a0c08']},  /* lacquer: moderate, patches of faded paint */
  kuro:     {B:4,bl:[6,12],blen:130,hero:1,swirl:2,fine:14,soft:0, fade:0,edge:0, chips:2, deep:0,gain:1.15,spread:.4,pal:['#cfd2d8','#000000']}   /* black plastic: fine and the most visible */
};
var wrGain=1;
function wrRng(seed){let h=seed>>>0;return()=>{h=(Math.imul(h,1664525)+1013904223)>>>0;return h/4294967296;};}
const wrF=v=>v.toFixed(1);
function wrLens(x,y,l,a,w,cv){
  const dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,ex=x+dx*l,ey=y+dy*l,cx=x+dx*l/2+nx*cv,cy=y+dy*l/2+ny*cv;
  return 'M'+wrF(x)+' '+wrF(y)+'Q'+wrF(cx+nx*w)+' '+wrF(cy+ny*w)+' '+wrF(ex)+' '+wrF(ey)+'Q'+wrF(cx-nx*w)+' '+wrF(cy-ny*w)+' '+wrF(x)+' '+wrF(y)+'Z';
}
/* one scratch: a thin tapered cut with a shadowed lip and a bright edge */
function wrScr(x,y,l,a,w,cv,op,P){op=Math.min(1,op*wrGain);const d=wrLens(x,y,l,a,w,cv);
  return "<path d='"+d+"' fill='"+P[1]+"' fill-opacity='"+(op*.5).toFixed(2)+"' transform='translate(.45 .55)'/><path d='"+d+"' fill='"+P[0]+"' fill-opacity='"+op.toFixed(2)+"'/>";}
/* a point, biased to the edges and (a little) to the bottom, where hands and pockets do the damage */
function wrPt(R,W,H,low){for(let i=0;i<14;i++){const x=R()*W,y=R()*H,e=Math.min(x,W-x,y,H-y)/Math.min(W,H),w=.18+.6*Math.exp(-e*6)+(low||0)*(y/H)*.3;if(R()<w)return[x,y];}return[R()*W,R()*H];}
/* a bundle of near-parallel hairlines of different lengths */
function wrBundle(R,W,H,dir,n,len,P,op){const p=wrPt(R,W,H,1),a=dir+(R()-.5)*.22,nx=-Math.sin(a),ny=Math.cos(a),ca=Math.cos(a),sa=Math.sin(a);let o='',off=0;
  for(let i=0;i<n;i++){off+=.7+R()*R()*4.5;const l=len*(.3+R()*.7),s=(R()-.5)*len*.55;
    o+=wrScr(p[0]+nx*off+ca*s,p[1]+ny*off+sa*s,l,a+(R()-.5)*.035,.1+R()*.2,(R()-.5)*1.4,op*(.35+R()*.65),P);}
  return o;}
/* one long scratch with a brighter core */
function wrHero(R,W,H,dir,len,P,op){const p=wrPt(R,W,H,.5),a=dir+(R()-.5)*.5;
  return wrScr(p[0],p[1],len*(.7+R()*.5),a,.45+R()*.3,(R()-.5)*10,op,P)+wrScr(p[0],p[1],len*.5,a,.15,(R()-.5)*4,op*.6,P);}
/* cleaning swirl: a few concentric arcs of a wiping cloth, only visible where light rakes across a glossy surface */
function wrSwirl(R,W,H,P,op){const p=wrPt(R,W,H,.2),r0=9+R()*14,a0=R()*6.28,k=3+((R()*4)|0);let o='';
  for(let i=0;i<k;i++){const r=r0+i*(2+R()*1.8),a1=a0+(R()-.5)*.9,sp=.8+R()*1.7;
    o+="<path d='M"+wrF(p[0]+Math.cos(a1)*r)+' '+wrF(p[1]+Math.sin(a1)*r)+'A'+wrF(r)+' '+wrF(r)+' 0 0 1 '+wrF(p[0]+Math.cos(a1+sp)*r)+' '+wrF(p[1]+Math.sin(a1+sp)*r)+"' fill='none' stroke='"+P[0]+"' stroke-opacity='"+Math.min(.5,(.09+R()*.1)*op*wrGain).toFixed(3)+"' stroke-width='.45' stroke-linecap='round'/>";}
  return o;}
/* kind: 'plate' (the deck body), 'lid' (solid lid), 'glass' (clear lid). m scales the amount of wear */
function wrLayer(W,H,st,R,dir,m,kind){
  const P=st.pal,pl=kind==='plate',gl=kind==='glass';let o='';
  const N=v=>Math.max(0,Math.round(v*m));
  if(st.fade&&!gl){o+="<defs><radialGradient id='wf'><stop offset='0' stop-color='"+P[0]+"' stop-opacity='1'/><stop offset='.55' stop-color='"+P[0]+"' stop-opacity='.5'/><stop offset='1' stop-color='"+P[0]+"' stop-opacity='0'/></radialGradient></defs>";
    for(let i=0;i<N(st.fade);i++)o+="<ellipse cx='"+(R()*W).toFixed(0)+"' cy='"+(R()*H).toFixed(0)+"' rx='"+(30+R()*40).toFixed(0)+"' ry='"+(18+R()*30).toFixed(0)+"' fill='url(#wf)' fill-opacity='"+(.07+R()*.08).toFixed(3)+"' transform='rotate("+(R()*180).toFixed(0)+")'/>";}
  if(gl){   /* fingerprint haze where the thumb lifts the lid, and a little dust */
    o+="<defs><radialGradient id='hz'><stop offset='0' stop-color='#fff' stop-opacity='.9'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></radialGradient></defs><ellipse cx='"+(W*(.4+R()*.2)).toFixed(0)+"' cy='"+(H*.9).toFixed(0)+"' rx='"+(W*.16).toFixed(0)+"' ry='"+(H*.16).toFixed(0)+"' fill='url(#hz)' fill-opacity='.07'/>";
    for(let i=0;i<16*m;i++){const p=wrPt(R,W,H,0);o+="<circle cx='"+wrF(p[0])+"' cy='"+wrF(p[1])+"' r='"+(.35+R()*.7).toFixed(2)+"' fill='#fff' fill-opacity='"+(.18+R()*.25).toFixed(2)+"'/>";}}
  for(let i=0;i<N(st.soft);i++){const p=wrPt(R,W,H,1);
    o+="<ellipse cx='"+wrF(p[0])+"' cy='"+wrF(p[1])+"' rx='"+(5+R()*10).toFixed(1)+"' ry='"+(1.5+R()*2.5).toFixed(1)+"' fill='"+P[0]+"' fill-opacity='"+(.1+R()*.12).toFixed(3)+"' transform='rotate("+((dir*57.3)+(R()-.5)*50).toFixed(0)+" "+wrF(p[0])+" "+wrF(p[1])+")'/>";}
  if(!gl)for(let i=0;i<N(st.edge);i++){const sd=(R()*4)|0,l=18+R()*50;
    if(sd===0)o+=wrScr(1.5+R()*2,R()*H,l,Math.PI/2,.9,(R()-.5)*2,.5,P);else if(sd===1)o+=wrScr(W-1.5-R()*2,R()*H,l,Math.PI/2,.9,(R()-.5)*2,.5,P);
    else if(sd===2)o+=wrScr(R()*W,1.5+R()*2,l,0,.9,(R()-.5)*2,.5,P);else o+=wrScr(R()*W,H-1.5-R()*2,l,0,.9,(R()-.5)*2,.5,P);}
  const sw=gl?st.swirl+1:st.swirl;for(let i=0;i<N(sw*(pl?1.5:1));i++)o+=wrSwirl(R,W,H,P,gl?1.3:1);
  const bl=st.bl,len=pl?st.blen:st.blen*.7;
  for(let i=0;i<N(st.B*(gl?.8:1));i++)o+=wrBundle(R,W,H,dir,Math.round(bl[0]+R()*(bl[1]-bl[0])),len,P,.6);
  for(let i=0;i<N(st.hero*(gl?1.2:1));i++)o+=wrHero(R,W,H,dir,len*1.2,P,.7);
  for(let i=0;i<N(st.fine);i++){const p=wrPt(R,W,H,1);o+=wrScr(p[0],p[1],8+R()*R()*len*.6,dir+(R()-.5)*(i<st.fine*.7?.35:st.spread*2),.14+R()*.3,(R()-.5)*3,.3+R()*.4,P);}
  if(m>1&&pl)for(let i=0;i<st.deep;i++){const p=wrPt(R,W,H,0);o+=wrScr(p[0],p[1],50+R()*70,dir+(R()-.5)*.5,.8+R()*.4,(R()-.5)*8,.85,P);}
  if(pl)for(let c=0;c<N(st.chips);c++){const sd=(R()*4)|0;let x,y;
    if(sd===0){x=R()*4;y=R()*H;}else if(sd===1){x=W-R()*4;y=R()*H;}else if(sd===2){x=R()*W;y=R()*4;}else{x=R()*W;y=H-R()*4;}
    const pts=[];for(let q=0;q<5;q++)pts.push([x+(R()-.5)*4.4,y+(R()-.5)*4.4]);
    pts.sort((a,b)=>Math.atan2(a[1]-y,a[0]-x)-Math.atan2(b[1]-y,b[0]-x));
    const d='M'+pts.map(p=>wrF(p[0])+' '+wrF(p[1])).join('L')+'Z';
    o+="<path d='"+d+"' fill='"+P[1]+"' fill-opacity='.35' transform='translate(.6 .7)'/><path d='"+d+"' fill='"+P[0]+"' fill-opacity='.8'/>";}
  return o;
}
function wrUri(inner,W,H,slice){return 'url("data:image/svg+xml,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 "+W+" "+H+"' preserveAspectRatio='"+(slice?'xMidYMid slice':'none')+"'>"+inner+"</svg>")+'")';}
function paintWearArt(){
  if(!document.body.classList.contains('worn'))return;
  try{
    if(!wrSeed){try{wrSeed=+localStorage.getItem('tape4.wseed')||0;if(!wrSeed){wrSeed=1+((Math.random()*4e9)>>>0);localStorage.setItem('tape4.wseed',String(wrSeed));}}catch(e){wrSeed=12345;}}
    const st=WR_STYLE[theme]||WR_STYLE.sonic,sk=[...theme].reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))>>>0,7);
    wrGain=st.gain;const R=wrRng(wrSeed^sk),dir=-.9+(R()-.5)*.8,b=document.body.style;
    b.setProperty('--wr-s1',wrUri(wrLayer(400,800,st,R,dir,.6,'plate'),400,800));
    b.setProperty('--wr-s2',wrUri(wrLayer(400,800,st,R,dir,1.7,'plate'),400,800));
    b.setProperty('--wr-l',wrUri(wrLayer(480,300,st,R,dir+.15,.7,'lid'),480,300,true));
    b.setProperty('--wr-g',wrUri(wrLayer(480,300,st,R,dir+.15,.8,'glass'),480,300,true));
    const kn=[12,7,12,7,12,7];
    for(let i=1;i<=6;i++){let o='';const kr=wrRng(wrSeed+i*7919+sk);
      for(let j=0;j<kn[i-1];j++)o+=wrScr(12+kr()*36,9+kr()*29,3+kr()*9,-.6+(kr()-.5)*1.4,.22+kr()*.25,(kr()-.5)*2,.5+kr()*.4,st.pal);
      b.setProperty('--wr-k'+i,wrUri(o,60,60));}
  }catch(e){}
}
