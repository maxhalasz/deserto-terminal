/* ESTACAO · camadas de sistemas (VENT e POWER) — PROTOTIPO.
   Gera, a partir da propria planta, as redes de ventilacao e de energia de um deck: o eixo dos corredores e o caminho do tronco,
   so as salas que precisam recebem ramal, e cada ramal termina em saidas posicionadas (parede ou teto sobre o mobiliario), nao no centro.
   Coordenadas em metros do deck. Uso: StationSystems.forDeck(STATION,'module','vent') -> {paths, units, risers, hi}. O desenho fica em station-render.js. */
(function(){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

/* ---------- grafo dos corredores ---------- */
function build(d,inserts){
  const segs=d.corr.map(c=>{const [x,y,w,h]=c.r,hz=w>=h;return hz?{hz:1,c:y+h/2,a:x,b:x+w,pts:[x,x+w]}:{hz:0,c:x+w/2,a:y,b:y+h,pts:[y,y+h]};});
  const T=2;
  for(let i=0;i<segs.length;i++)for(let j=i+1;j<segs.length;j++){const A=segs[i],B=segs[j];if(A.hz===B.hz)continue;
    const H=A.hz?A:B,V=A.hz?B:A;if(V.c>=H.a-T&&V.c<=H.b+T&&H.c>=V.a-T&&H.c<=V.b+T){H.pts.push(V.c);V.pts.push(H.c);}}
  const proj=p=>{let best=null;segs.forEach((s,i)=>{const t=clamp(s.hz?p[0]:p[1],s.a,s.b),q=s.hz?[t,s.c]:[s.c,t],dd=dist(p,q);if(!best||dd<best.d)best={d:dd,i,t,q};});return best;};
  const ins=inserts.map(p=>{const b=proj(p);if(b)segs[b.i].pts.push(b.t);return b;});
  const nodes=[],idx={},key=(x,y)=>x.toFixed(2)+','+y.toFixed(2);
  const node=(x,y)=>{const k=key(x,y);if(idx[k]==null){idx[k]=nodes.length;nodes.push({x,y});}return idx[k];};
  const adj=[];const edge=(a,b)=>{if(a===b)return;const w=dist([nodes[a].x,nodes[a].y],[nodes[b].x,nodes[b].y]);(adj[a]=adj[a]||[]).push([b,w]);(adj[b]=adj[b]||[]).push([a,w]);};
  segs.forEach(s=>{const ps=[...new Set(s.pts.map(v=>+v.toFixed(2)))].sort((p,q)=>p-q);let prev=null;
    ps.forEach(v=>{const n=s.hz?node(v,s.c):node(s.c,v);if(prev!=null)edge(prev,n);prev=n;});});
  /* corredores que so se encostam (jogs, firewall): liga pelo par de nos mais proximo */
  const par=nodes.map((_,i)=>i),f=i=>par[i]===i?i:(par[i]=f(par[i]));
  adj.forEach((l,a)=>l.forEach(([b])=>{par[f(a)]=f(b);}));
  for(let it=0;it<30;it++){let best=null;
    for(let a=0;a<nodes.length;a++)for(let b=a+1;b<nodes.length;b++){if(f(a)===f(b))continue;const dd=dist([nodes[a].x,nodes[a].y],[nodes[b].x,nodes[b].y]);if(dd<8&&(!best||dd<best.d))best={a,b,d:dd};}
    if(!best)break;
    const A=nodes[best.a],B=nodes[best.b];
    if(Math.abs(A.x-B.x)>.05&&Math.abs(A.y-B.y)>.05){const m=node(B.x,A.y);edge(best.a,m);edge(m,best.b);par[f(m)]=f(best.a);}else edge(best.a,best.b);
    par[f(best.a)]=f(best.b);}
  return {nodes,adj,ins,node:(p,b)=>b?node(b.q[0],b.q[1]):null};
}
function dijkstra(G,src){const n=G.nodes.length,dd=Array(n).fill(1e9),pr=Array(n).fill(-1),done=Array(n).fill(false);dd[src]=0;
  for(;;){let u=-1;for(let i=0;i<n;i++)if(!done[i]&&(u<0||dd[i]<dd[u]))u=i;if(u<0||dd[u]>=1e9)break;done[u]=true;
    (G.adj[u]||[]).forEach(([v,w])=>{if(dd[u]+w<dd[v]){dd[v]=dd[u]+w;pr[v]=u;}});}
  return {dd,pr};}

const doorPts=r=>{const [x,y,w,h]=r.r;return (r.d||[]).filter(d=>d[2]!=='open'&&d[2]!=='wide'||true).map(d=>{const s=d[0],t=d[1];return s==='n'?[x+w*t,y]:s==='s'?[x+w*t,y+h]:s==='w'?[x,y+h*t]:[x+w,y+h*t];});};
const centre=r=>[r.r[0]+r.r[2]/2,r.r[1]+r.r[3]/2];

/* onde ficam as saidas dentro da sala: parede ao lado da porta e teto sobre o mobiliario (fracoes da sala; nunca o centro) */
const FURN={suite:[[.22,.3]],office:[[.3,.3],[.72,.3]],kitchen:[[.22,.28],[.22,.7]],console:[[.5,.7]],comms:[[.3,.35]],cameras:[[.5,.35]],meeting:[[.5,.5]],
  training:[[.3,.4],[.7,.4]],archive:[[.3,.5],[.7,.5]],bar:[[.25,.35],[.7,.35],[.45,.72]],loungeps:[[.3,.6],[.6,.3]],infirmary:[[.22,.5],[.7,.5]],gym:[[.3,.55],[.72,.55]],
  roundlounge:[[.3,.35],[.7,.65]],lab:[[.5,.2]],workshop:[[.5,.3],[.5,.72]],lockers:[[.3,.55],[.7,.55]],ppe:[[.35,.65]],entry:[[.5,.5]],dive:[[.5,.6]],
  gens:[[.2,.4],[.5,.4],[.8,.4]],compressors:[[.3,.4],[.7,.4]],switch:[[.3,.4],[.7,.4]],elec:[[.5,.4]],battery:[[.5,.4]],pumps:[[.3,.5],[.7,.5]],
  mud:[[.25,.3],[.75,.3],[.5,.75]],separators:[[.25,.3],[.75,.3],[.5,.72]],inj:[[.3,.5],[.7,.5]],utilities:[[.3,.3],[.7,.3],[.5,.75]],wellheads:[[.2,.3],[.5,.3],[.8,.3],[.2,.7],[.5,.7],[.8,.7]],
  chemstore:[[.5,.5]],paint:[[.5,.5]],waste:[[.5,.5]],bath:[[.5,.3]],laundry:[[.3,.5],[.7,.5]],drying:[[.3,.5],[.7,.5]],ahu:[[.5,.5]],xfmr:[[.5,.5]],desal:[[.5,.5]],
  cranecab:[[.5,.5]]};

function roomJob(room,D,P){
  const [rx,ry,rw,rh]=room.r;
  const nx=Math.abs(D[0]-rx)<.06?1:Math.abs(D[0]-(rx+rw))<.06?-1:0,ny=Math.abs(D[1]-ry)<.06?1:Math.abs(D[1]-(ry+rh))<.06?-1:0;
  const dep=nx?rw:rh,wid=nx?rh:rw,lat=[-ny,nx];
  const cen=centre(room),s=((cen[0]-D[0])*lat[0]+(cen[1]-D[1])*lat[1])>=0?1:-1;
  const terms=[],pts=[P];if(dist(P,D)>.3)pts.push(D);
  /* saida na parede, ao lado da porta */
  if(wid>=4.6&&!['bath','wash'].includes(room.eq))terms.push({x:D[0]+lat[0]*s*1.7,y:D[1]+lat[1]*s*1.7,t:'wall',nx,ny});
  const fp=FURN[room.eq]||[[.5,.5]];
  /* o ramal segue pelo teto: entra pela porta, anda ate a linha do mobiliario e abre lateral ate cada saida */
  const ts=fp.map(q=>[rx+rw*q[0],ry+rh*q[1]]);
  if(ts.length===1&&Math.abs(ts[0][0]-cen[0])<.5&&Math.abs(ts[0][1]-cen[1])<.5){ /* sem mobiliario conhecido: desloca do centro, pro lado da parede */
    ts[0]=[D[0]+nx*dep*.55+lat[0]*s*wid*.24,D[1]+ny*dep*.55+lat[1]*s*wid*.24];}
  const along=q=>nx?(q[0]-D[0])*nx:(q[1]-D[1])*ny;
  const mid=ts.reduce((a,q)=>a+along(q),0)/ts.length;
  const M=[D[0]+nx*mid,D[1]+ny*mid];pts.push(M);
  const lats=ts.map(q=>(q[0]-M[0])*lat[0]+(q[1]-M[1])*lat[1]);
  const lo=Math.min(0,...lats),hi=Math.max(0,...lats);
  const spine=[[M[0]+lat[0]*lo,M[1]+lat[1]*lo],[M[0]+lat[0]*hi,M[1]+lat[1]*hi]];
  const sp=[];
  /* tronco do ramal: do ponto M pro lado de menor lateral, depois pro de maior; desenha como caminho unico */
  const first=Math.abs(lo)<=Math.abs(hi)?spine[0]:spine[1],second=Math.abs(lo)<=Math.abs(hi)?spine[1]:spine[0];
  if(dist(first,M)>.1)pts.push(first);if(dist(second,first)>.1)pts.push(second);
  ts.forEach(q=>{terms.push({x:q[0]+0,y:q[1]+0,t:'ceil',sx:M[0]+lat[0]*((q[0]-M[0])*lat[0]+(q[1]-M[1])*lat[1]),sy:M[1]+lat[1]*((q[0]-M[0])*lat[0]+(q[1]-M[1])*lat[1])});});
  return {pts,terms};
}

/* rede: origem (sala ou ponto) -> destinos (salas ou pontos). kind: s (insuflamento), x (exaustao), hv, lv */
function net(d,o){
  const srcR=o.src.room?d.rooms.find(r=>r.id===o.src.room):null;
  const srcP=o.src.pt||(srcR?doorPts(srcR)[0]||centre(srcR):null);if(!srcP)return null;
  const tg=(o.to||[]).map(t=>{if(Array.isArray(t))return {pt:t,c:t,doors:[t],door:t};const r=d.rooms.find(q=>q.id===t);if(!r)return null;
    const ds=doorPts(r);return {room:r,c:centre(r),doors:ds,door:ds[0]||centre(r)};}).filter(Boolean);
  tg.forEach(t=>{if(t.doors&&t.doors.length>1)t.door=t.doors.slice().sort((a,b)=>dist(a,srcP)-dist(b,srcP))[0];});
  const inserts=[srcP,...tg.map(t=>t.door)];
  const G=build(d,inserts);const si=G.node(srcP,G.ins[0]);const {pr}=dijkstra(G,si);
  const use={};const branches=[];
  tg.forEach((t,i)=>{const b=G.ins[i+1];if(!b||b.d>5.5)return;const n=G.node(t.door,b);let u=n,guard=0;
    while(u!==si&&pr[u]>=0&&guard++<400){const k=pr[u]+'>'+u;use[k]=(use[k]||0)+1;u=pr[u];}
    if(u!==si&&n!==si)return;
    const P=[b.q[0],b.q[1]];
    if(t.room&&t.room.r&&o.kind!=='lv'&&o.kind!=='hv'&&o.kind!=='em'){const j=roomJob(t.room,t.door,P);branches.push({pts:j.pts,terms:j.terms,room:t.room.id});}
    else{/* energia: ramal curto ate um quadro na parede ao lado da porta */
      const D=t.door,pts=[P];if(dist(P,D)>.3)pts.push(D);
      const r=t.room,terms=[];if(r){const [rx,ry,rw,rh]=r.r;const nx=Math.abs(D[0]-rx)<.06?1:Math.abs(D[0]-(rx+rw))<.06?-1:0,ny=Math.abs(D[1]-ry)<.06?1:Math.abs(D[1]-(ry+rh))<.06?-1:0;
        const lat=[-ny,nx],cen=centre(r),s=((cen[0]-D[0])*lat[0]+(cen[1]-D[1])*lat[1])>=0?1:-1;const Q=[D[0]+lat[0]*s*1.6+nx*.55,D[1]+lat[1]*s*1.6+ny*.55];
        pts.push([D[0]+nx*.55,D[1]+ny*.55],Q);terms.push({x:Q[0],y:Q[1],t:'panel'});}
      else terms.push({x:D[0],y:D[1],t:'panel'});
      branches.push({pts,terms,room:r?r.id:null});}});
  const edges=Object.keys(use).map(k=>{const [a,b]=k.split('>').map(Number);return {a:[G.nodes[a].x,G.nodes[a].y],b:[G.nodes[b].x,G.nodes[b].y],n:use[k]};});
  return {k:o.k,edges,branches,src:srcP,rev:!!o.rev,w:o.w};
}

/* ---------- VENT: arvore de dutos pelo forro, ligando as saidas entre si (nao segue corredor) ---------- */
const ceilCands=r=>{const [rx,ry,rw,rh]=r.r;const fp=FURN[r.eq];
  const ts=fp?fp.map(q=>[rx+rw*q[0],ry+rh*q[1]]):[[rx+rw*.3,ry+rh*.35]];
  return ts.map(q=>[Math.round(q[0]*2)/2,Math.round(q[1]*2)/2]);};

function ventTree(d,o){
  const srcR=o.src.room?d.rooms.find(r=>r.id===o.src.room):null;
  const S=o.src.pt||(srcR?centre(srcR):null);if(!S)return null;
  const man=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
  const flat=[];
  (o.to||[]).forEach((t,k)=>{if(Array.isArray(t))flat.push({it:{pt:true,room:null,id:'pt'+k},c:t});
    else{const r=d.rooms.find(q=>q.id===t);if(r)ceilCands(r).forEach(c=>flat.push({it:{room:r,id:r.id},c}));}});
  const segs=[],br=[];
  const nearest=c=>{let best={d:man(c,S),seg:null,P:S};
    segs.forEach(s=>{const P=s.hz?[clamp(c[0],s.a,s.b),s.c]:[s.c,clamp(c[1],s.a,s.b)];const dd=man(c,P);if(dd<best.d-1e-6)best={d:dd,seg:s,P};});return best;};
  const addSegs=(pts,own)=>{for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if(Math.abs(a[1]-b[1])<1e-6&&Math.abs(a[0]-b[0])>1e-6)segs.push({hz:1,c:a[1],a:Math.min(a[0],b[0]),b:Math.max(a[0],b[0]),own});
    else if(Math.abs(a[0]-b[0])<1e-6&&Math.abs(a[1]-b[1])>1e-6)segs.push({hz:0,c:a[0],a:Math.min(a[1],b[1]),b:Math.max(a[1],b[1]),own});}};
  let guard=0;
  while(flat.length&&guard++<600){
    let bi=0,bb=null;
    flat.forEach((f,i)=>{const n=nearest(f.c);if(!bb||n.d<bb.d-1e-6){bb=n;bi=i;}});
    const f=flat.splice(bi,1)[0],c=f.c,P=bb.P,seg=bb.seg;let pts;
    if(!seg){const dx=Math.abs(c[0]-S[0]),dy=Math.abs(c[1]-S[1]);pts=dx>=dy?[S,[c[0],S[1]],c]:[S,[S[0],c[1]],c];}
    else if(seg.hz)pts=(c[0]>=seg.a&&c[0]<=seg.b)?[P,c]:[P,[P[0],c[1]],c];
    else pts=(c[1]>=seg.a&&c[1]<=seg.b)?[P,c]:[P,[c[0],P[1]],c];
    pts=pts.filter((p,i)=>!i||dist(p,pts[i-1])>1e-6);
    if(pts.length<2)pts=[P,[c[0]+.01,c[1]]];
    const id=br.length;br.push({pts,parent:seg?seg.own:null,room:f.it.room?f.it.room.id:null,roomObj:f.it.room,entry:f.it.entryBr==null,size:1});
    if(f.it.entryBr==null)f.it.entryBr=id;
    addSegs(pts,id);
  }
  for(let i=br.length-1;i>=0;i--)if(br[i].parent!=null)br[br[i].parent].size+=br[i].size;
  /* terminais: anel no teto em cada ponta; barra na parede onde o duto entra na sala */
  const terms=[],seen={};
  br.forEach(b=>{const q=b.pts[b.pts.length-1];terms.push({x:q[0],y:q[1],t:'ceil'});
    const r=b.roomObj;if(!r||!b.entry||seen[r.id])return;seen[r.id]=1;
    const [rx,ry,rw,rh]=r.r;if((r.eq==='bath'||r.eq==='wash')||Math.min(rw,rh)<3.6)return;
    const inside=(x,y)=>x>rx+.05&&x<rx+rw-.05&&y>ry+.05&&y<ry+rh-.05;
    for(let i=0;i<b.pts.length-1;i++){const p=b.pts[i],q2=b.pts[i+1],L=dist(p,q2),n=Math.max(2,Math.ceil(L/.1));let prev=p,found=false;
      for(let k=1;k<=n;k++){const x=p[0]+(q2[0]-p[0])*k/n,y=p[1]+(q2[1]-p[1])*k/n;
        if(!inside(prev[0],prev[1])&&inside(x,y)){const hz=Math.abs(q2[1]-p[1])<1e-6,dirv=hz?Math.sign(q2[0]-p[0]):Math.sign(q2[1]-p[1]);
          terms.push(hz?{x:dirv>0?rx:rx+rw,y,t:'wall',nx:1,ny:0}:{x,y:dirv>0?ry:ry+rh,t:'wall',nx:0,ny:1});found=true;break;}
        prev=[x,y];}
      if(found)break;}});
  return {k:o.k,rev:!!o.rev,src:S,branches:br.map(b=>({pts:b.pts,size:b.size,room:b.room})),terms};
}

/* ---------- quais salas precisam de cada rede ---------- */
const NOT=r=>r.t==='stair'||/lift|stair/i.test(r.n);
const NOSUP={vest:1,hatch:1,store:1,paint:1,linen:1,cold:1,freezer:1,cabinrow:1,moonpool:1,tower:1,shaft:1,jetty:1,antenna:1,tcards:1,xmas:1,wellheads:1,cargo:1,sealed:1,tv:1,heli:1,rov:1,winch:1,hpu:1,ballast:1,waste:1,engine:1,entry:0,inj:1,chemstore:1,mud:1,separators:1,utilities:1,compressors:1,pumps:1,gens:1,drying:1,battery:1,switch:1,xfmr:1,elec:0,old:1,flare:1,crane:1,muster0:1,liferaft:1,lifeboats:1,vent:1,containers:1,bath:1,wash:1,laundry:1,kitchen:0,lab:0,desal:1,ahu:1};
const needSup=r=>!NOT(r)&&r.t!=='ext'&&r.t!=='off'&&r.st!=='sealed'&&!NOSUP[r.eq];
const EXH={bath:1,wash:1,kitchen:1,laundry:1,lab:1,chemstore:1,paint:1,battery:1,waste:1,workshop:1,gens:1,compressors:1,utilities:1,mud:1,separators:1,inj:1,sauna:1,drying:1,switch:1,xfmr:1,elec:1,wellheads:1,xmas:1,pumps:1,desal:1,hpu:1};
const needExh=r=>!NOT(r)&&r.t!=='ext'&&r.t!=='off'&&r.st!=='sealed'&&!!EXH[r.eq];
const needPow=r=>!NOT(r)&&r.t!=='ext'&&r.st!=='sealed'&&!['vest','hatch','store','cabinrow','moonpool','shaft','jetty','tcards','cargo','paint','linen','cold','freezer','old'].includes(r.eq);

const CHASE_V=[50.5,40.5];        /* prumada de exaustao de processo: cellar, module, gas vent do weather */
const BLOCK_V=[24.5,21.5];        /* prumada de ar-condicionado do bloco (module -> deck E) */
const BLOCK_V_LQ=[22.5,9.5];      /* a mesma prumada, em coordenadas do deck do alojamento */
const P1=[28.5,26],P1_LQ=[26.5,14]; /* prumada eletrica no nucleo do bloco */

function vent(S,id){const d=S.DECKS[id];if(!d)return null;
  const rm=f=>d.rooms.filter(f).map(r=>r.id);
  const out={title:'VENTILATION',trees:[],units:[],risers:[]};
  if(id==='module'){
    out.trees.push({k:'s',src:{room:'mb_hvac'},to:[...rm(r=>r.r[0]+r.r[2]<=47.2&&needSup(r)&&r.id!=='mb_hvac'),BLOCK_V]});
    out.trees.push({k:'x',src:{pt:CHASE_V},to:rm(r=>r.r[0]>=48.5&&needExh(r)),rev:true});
    out.units.push({room:'mb_hvac',t:'ahu',lbl:'AHU-1'});
    out.risers.push({x:BLOCK_V[0],y:BLOCK_V[1],dir:'up',to:'L-06 · DECKS A–E',k:'s'},{x:CHASE_V[0],y:CHASE_V[1],dir:'ud',to:'L-03 ↓ · L-07 ↑ GAS VENT',k:'x'});
  }else if(id==='cellar'){
    out.trees.push({k:'x',src:{pt:CHASE_V},to:rm(r=>needExh(r)||['cd12','cd_lube','cd_wks','cd_egen','cd1'].includes(r.id)),rev:true});
    out.units.push({room:'cd1',t:'fan',lbl:'INTAKE'},{room:'cd_egen',t:'fan',lbl:'EXH'});
    out.risers.push({x:CHASE_V[0],y:CHASE_V[1],dir:'up',to:'L-05 · GAS VENT',k:'x'});
  }else if(id==='weather'){
    out.units.push({room:'wd5',t:'stack',lbl:'GAS VENT'});
    out.risers.push({x:CHASE_V[0],y:CHASE_V[1],dir:'dn',to:'L-05 · PROCESS EXHAUST',k:'x'});
  }else if(/^lq/.test(id)){
    const src=id==='lqE'?{room:'lqE4'}:{pt:BLOCK_V_LQ};
    out.trees.push({k:'s',src,to:rm(r=>needSup(r)&&!(id==='lqE'&&r.id==='lqE4'))});
    const ex=rm(needExh);if(ex.length)out.trees.push({k:'x',src:{pt:BLOCK_V_LQ},to:ex,rev:true});
    if(id==='lqE'){out.units.push({room:'lqE4',t:'ahu',lbl:'AHU-2'});out.risers.push({x:BLOCK_V_LQ[0],y:BLOCK_V_LQ[1],dir:'dn',to:'DECK D ↓ · ROOF ↑',k:'s'});}
    else out.risers.push({x:BLOCK_V_LQ[0],y:BLOCK_V_LQ[1],dir:'ud',to:({lqD:'DECK E ↑ · DECK C ↓',lqC:'DECK D ↑ · DECK B ↓',lqB:'DECK C ↑ · DECK A ↓',lqA:'DECK B ↑ · MODULE ↓'})[id],k:'s'});
  }
  return out;}

function power(S,id){const d=S.DECKS[id];if(!d)return null;
  const rm=f=>d.rooms.filter(f).map(r=>r.id);
  const out={title:'POWER',nets:[],units:[],risers:[],lines:[]};
  if(id==='cellar'){
    const gx=[5.5,10.4,15.2];
    gx.forEach(x=>out.units.push({x,y:20.4,t:'gen',lbl:'G'}));
    out.lines.push({k:'hv',pts:[[gx[0],21.8],[gx[0],26],[22.5,26]]},{k:'hv',pts:[[gx[1],21.8],[gx[1],26]]},{k:'hv',pts:[[gx[2],21.8],[gx[2],26]]});
    out.units.push({x:22.5,y:25,t:'sw',lbl:'MSB'},{room:'cd_stk',t:'bat',lbl:'BATT'},{room:'cd_egen',t:'gen',lbl:'EG'});
    out.lines.push({k:'hv',pts:[[22.5,26],[22.5,27],[28.5,27]]});
    out.nets.push({k:'em',src:{room:'cd_egen'},to:['cd10']});
    out.nets.push({k:'lv',src:{pt:[22.5,27]},to:rm(r=>needPow(r)&&!['cd1','cd10','cd_stk','cd_egen','cd_rsk','cd15'].includes(r.id))});
    out.risers.push({x:P1[0],y:P1[1],dir:'up',to:'L-05 · MODULE',k:'hv'});
  }else if(id==='module'){
    out.units.push({room:'md_trf',t:'xfmr',lbl:'T1'},{room:'mb_ups',t:'ups',lbl:'UPS'},{room:'md2',t:'panel',lbl:'CTRL'});
    out.nets.push({k:'hv',src:{pt:P1},to:['md_trf']});
    out.nets.push({k:'lv',src:{room:'md_trf'},to:rm(r=>r.r[0]>=48.5&&needPow(r)&&r.id!=='md_trf')});
    out.nets.push({k:'lv',src:{pt:P1},to:rm(r=>r.r[0]+r.r[2]<=47.2&&needPow(r))});
    out.risers.push({x:P1[0],y:P1[1],dir:'ud',to:'L-06 ↑ · L-03 ↓',k:'hv'});
  }else if(/^lq/.test(id)){
    out.nets.push({k:'lv',src:{pt:P1_LQ},to:rm(needPow)});
    out.units.push({x:P1_LQ[0]-1.6,y:P1_LQ[1],t:'panel',lbl:'DB'});
    out.risers.push({x:P1_LQ[0],y:P1_LQ[1],dir:id==='lqE'?'dn':'ud',to:({lqE:'DECK D ↓',lqD:'DECK E ↑ · DECK C ↓',lqC:'DECK D ↑ · DECK B ↓',lqB:'DECK C ↑ · DECK A ↓',lqA:'DECK B ↑ · MODULE ↓'})[id],k:'hv'});
  }else if(id==='weather'){
    out.units.push({x:30,y:3,t:'panel',lbl:'CRANE'},{x:92,y:3,t:'panel',lbl:'CRANE'},{x:82,y:52,t:'panel',lbl:'CRANE'});
    out.risers.push({x:P1[0],y:P1[1],dir:'dn',to:'L-05 · MODULE',k:'hv'});
  }
  return out;}

/* ---------- resultado pro renderer ---------- */
function forDeck(S,id,kind){
  const cfg=kind==='vent'?vent(S,id):kind==='power'?power(S,id):null;if(!cfg)return null;const d=S.DECKS[id];
  const res={kind,title:cfg.title,paths:[],vent:[],units:[],risers:cfg.risers||[],lines:cfg.lines||[],hi:{}};
  (cfg.trees||[]).forEach(t=>{const r=ventTree(d,t);if(!r)return;res.vent.push(r);if(t.src.room)res.hi[t.src.room]=1;r.branches.forEach(b=>{if(b.room)res.hi[b.room]=1;});});
  (cfg.nets||[]).forEach(n=>{const r=net(d,Object.assign({},n,{kind:n.k}));if(!r)return;res.paths.push(r);
    if(n.src.room)res.hi[n.src.room]=1;r.branches.forEach(b=>{if(b.room)res.hi[b.room]=1;});});
  (cfg.units||[]).forEach(u=>{let x=u.x,y=u.y;if(u.room){const r=d.rooms.find(q=>q.id===u.room);if(!r)return;[x,y]=centre(r);res.hi[u.room]=1;}res.units.push({x,y,t:u.t,lbl:u.lbl,room:u.room||null});});
  return res;
}
window.StationSystems={forDeck};
})();
