/* ESTACAO · camadas de sistemas (VENT e POWER) — PROTOTIPO.
   Gera, a partir da propria planta (corredores = caminho de duto e cabo), as redes de ventilacao e de energia de um deck:
   tronco pelo eixo dos corredores, ramais ate cada sala e prumadas que sobem e descem. Em metros da placa (coordenadas do deck).
   Uso: StationSystems.forDeck(STATION, 'module', 'vent') -> {paths, branches, units, risers, title}. O desenho fica em station-render.js. */
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
  /* componentes soltos (corredores que so se encostam, jogs e firewall): liga pelo par de nos mais proximo */
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

const doorPts=r=>{const [x,y,w,h]=r.r;return (r.d||[]).map(d=>{const s=d[0],t=d[1];return s==='n'?[x+w*t,y]:s==='s'?[x+w*t,y+h]:s==='w'?[x,y+h*t]:[x+w,y+h*t];});};
const centre=r=>[r.r[0]+r.r[2]/2,r.r[1]+r.r[3]/2];

/* rede: origem (sala ou ponto) -> destinos (salas ou pontos). kind: s (insuflamento), x (exaustao), hv, lv */
function net(d,o){
  const srcR=o.src.room?d.rooms.find(r=>r.id===o.src.room):null;
  const srcP=o.src.pt||(srcR?doorPts(srcR)[0]||centre(srcR):null);if(!srcP)return null;
  const tg=(o.to||[]).map(t=>{if(Array.isArray(t))return {pt:t,c:t,door:t};const r=d.rooms.find(q=>q.id===t);if(!r)return null;
    const ds=doorPts(r);return {room:r,c:centre(r),doors:ds,door:ds[0]||centre(r)};}).filter(Boolean);
  const inserts=[srcP,...tg.map(t=>t.door)];
  /* com mais de uma porta, escolhe a mais perto da origem */
  tg.forEach((t,i)=>{if(t.doors&&t.doors.length>1)t.door=t.doors.slice().sort((a,b)=>dist(a,srcP)-dist(b,srcP))[0];inserts[i+1]=t.door;});
  const G=build(d,inserts);const si=G.node(srcP,G.ins[0]);const {pr}=dijkstra(G,si);
  const use={};const ends=[],branches=[];
  tg.forEach((t,i)=>{const b=G.ins[i+1];if(!b||b.d>5.5)return;const n=G.node(t.door,b);let u=n,guard=0;
    while(u!==si&&pr[u]>=0&&guard++<400){const k=pr[u]+'>'+u;use[k]=(use[k]||0)+1;u=pr[u];}
    if(u!==si&&n!==si)return;
    const P=[b.q[0],b.q[1]],D=t.door,pts=[P];let C=t.c;if(dist(P,D)>.3)pts.push(D);
    if(t.room&&t.doors&&t.doors.length){/* ramal entra so ate o meio da profundidade, pra nao passar por cima do nome da sala */
      const [rx,ry,rw,rh]=t.room.r;const nx=Math.abs(D[0]-rx)<.05?1:Math.abs(D[0]-(rx+rw))<.05?-1:0,ny=Math.abs(D[1]-ry)<.05?1:Math.abs(D[1]-(ry+rh))<.05?-1:0;
      const dep=nx?rw:rh,len=Math.min(dep*.42,3.6);C=[D[0]+nx*len,D[1]+ny*len];pts.push(C);}else pts.push(C);
    branches.push({pts,room:t.room?t.room.id:null,c:C});});
  const edges=Object.keys(use).map(k=>{const [a,b]=k.split('>').map(Number);return {a:[G.nodes[a].x,G.nodes[a].y],b:[G.nodes[b].x,G.nodes[b].y],n:use[k]};});
  return {k:o.k,edges,branches,src:srcP,rev:!!o.rev,w:o.w};
}

/* ---------- configuracao dos sistemas (prototipo: ventilacao e energia) ---------- */
const NOT=r=>r.t==='stair'||/lift|stair/i.test(r.n);
const CHASE_V=[50.5,40.5];        /* prumada de exaustao de processo: cellar, module, gas vent do weather */
const BLOCK_V=[24.5,21.5];        /* prumada de ar-condicionado do bloco (module -> deck E) */
const BLOCK_V_LQ=[22.5,9.5];      /* a mesma prumada, em coordenadas do deck do alojamento */
const P1=[28.5,26],P1_LQ=[26.5,14]; /* prumada eletrica no nucleo do bloco */

function vent(S,id){const d=S.DECKS[id];if(!d)return null;
  const rm=f=>d.rooms.filter(f).map(r=>r.id);
  const out={title:'VENTILATION',nets:[],units:[],risers:[]};
  if(id==='module'){
    const clean=rm(r=>r.r[0]+r.r[2]<=47.2&&!NOT(r)&&!['mb_hvac','mb_stp','mb_inc'].includes(r.id)&&r.t!=='ext');
    out.nets.push({k:'s',src:{room:'mb_hvac'},to:[...clean,BLOCK_V]});
    out.nets.push({k:'x',src:{pt:CHASE_V},to:rm(r=>r.r[0]>=48.5&&!NOT(r)&&r.t!=='ext'),rev:true});
    out.nets.push({k:'x',src:{pt:BLOCK_V},to:['mb_stp','mb_inc','mb_wtr'],rev:true,w:.75});
    out.units.push({room:'mb_hvac',t:'ahu',lbl:'AHU-1'});
    out.risers.push({x:BLOCK_V[0],y:BLOCK_V[1],dir:'up',to:'L-06 · DECKS A–E',k:'s'},{x:CHASE_V[0],y:CHASE_V[1],dir:'ud',to:'L-03 ↓ · L-07 ↑ GAS VENT',k:'x'});
  }else if(id==='cellar'){
    out.nets.push({k:'x',src:{pt:CHASE_V},to:rm(r=>['cd1','cd10','cd_stk','cd12','cd_lube','cd_air','cd_wks','cd_egen','cd13','cd14','cd2'].includes(r.id)),rev:true});
    out.units.push({room:'cd1',t:'fan',lbl:'INTAKE'},{room:'cd_egen',t:'fan',lbl:'EXH'},{room:'cd5',t:'fan',lbl:'EXH'});
    out.risers.push({x:CHASE_V[0],y:CHASE_V[1],dir:'up',to:'L-05 · GAS VENT',k:'x'});
  }else if(id==='weather'){
    out.units.push({room:'wd5',t:'stack',lbl:'GAS VENT'});
    out.risers.push({x:CHASE_V[0],y:CHASE_V[1],dir:'dn',to:'L-05 · PROCESS EXHAUST',k:'x'});
  }else if(/^lq/.test(id)){
    const wet={lqA:['la_kit','la_gym','la_cln','la_inf'],lqB:['lqB6'],lqC:['lc_bath','lc_lau'],lqD:['lqD8','lqD10'],lqE:['lqE2']}[id]||[];
    const all=rm(r=>!NOT(r)&&r.t!=='ext');
    const src=id==='lqE'?{room:'lqE4'}:{pt:BLOCK_V_LQ};
    out.nets.push({k:'s',src,to:all.filter(i=>!(id==='lqE'&&i==='lqE4'))});
    if(wet.length)out.nets.push({k:'x',src:{pt:BLOCK_V_LQ},to:wet,rev:true,w:.8});
    if(id==='lqE'){out.units.push({room:'lqE4',t:'ahu',lbl:'AHU-2'});out.risers.push({x:BLOCK_V_LQ[0],y:BLOCK_V_LQ[1],dir:'dn',to:'DECK D · ROOF EXHAUST ↑',k:'s'});}
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
    out.lines.push({k:'hv',pts:[[22.5,26],[22.5,27],[28.5,27]],riserFeed:true});
    out.nets.push({k:'em',src:{room:'cd_egen'},to:['cd10']});
    out.nets.push({k:'lv',src:{pt:[22.5,27]},to:rm(r=>!NOT(r)&&!['cd1','cd10','cd_stk','cd_egen','cd_rsk','cd15'].includes(r.id)&&r.t!=='ext')});
    out.risers.push({x:P1[0],y:P1[1],dir:'up',to:'L-05 · MODULE',k:'hv'});
  }else if(id==='module'){
    out.units.push({room:'md_trf',t:'xfmr',lbl:'T1'},{room:'mb_ups',t:'ups',lbl:'UPS'},{room:'md2',t:'panel',lbl:'CTRL'});
    out.nets.push({k:'hv',src:{pt:P1},to:['md_trf']});
    out.nets.push({k:'lv',src:{room:'md_trf'},to:rm(r=>r.r[0]>=48.5&&!NOT(r)&&r.t!=='ext'&&r.id!=='md_trf')});
    out.nets.push({k:'lv',src:{pt:P1},to:rm(r=>r.r[0]+r.r[2]<=47.2&&!NOT(r)&&r.t!=='ext')});
    out.risers.push({x:P1[0],y:P1[1],dir:'ud',to:'L-06 ↑ · L-03 ↓',k:'hv'});
  }else if(/^lq/.test(id)){
    out.nets.push({k:'lv',src:{pt:P1_LQ},to:rm(r=>!NOT(r)&&r.t!=='ext')});
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
  const res={kind,title:cfg.title,paths:[],units:[],risers:cfg.risers||[],lines:cfg.lines||[],hi:{}};
  (cfg.nets||[]).forEach(n=>{const r=net(d,n);if(!r)return;res.paths.push(r);
    if(n.src.room)res.hi[n.src.room]=1;(n.to||[]).forEach(t=>{if(typeof t==='string')res.hi[t]=1;});});
  (cfg.units||[]).forEach(u=>{let x=u.x,y=u.y;if(u.room){const r=d.rooms.find(q=>q.id===u.room);if(!r)return;[x,y]=centre(r);res.hi[u.room]=1;}res.units.push({x,y,t:u.t,lbl:u.lbl});});
  return res;
}
window.StationSystems={forDeck};
})();
