// Valida a geometria do mapa da estacao: sobreposicao, portas, conectividade, textos, escadas alinhadas entre os decks.
// Uso: node tools/_verify/validate_map.js [arquivo-de-dados.js]   (padrao: station-data.js)
const fs=require('fs'),path=require('path');
global.window=global;
const file=path.resolve(process.argv[2]||__dirname+'/../../station-data.js');
(0,eval)(fs.readFileSync(file,'utf8'));
const S=window.STATION;let err=0,warn=0;
const E=(m)=>{console.log('ERRO  '+m);err++;},W=(m)=>{console.log('aviso '+m);warn++;};
const ovl=(a,b)=>Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0])>.01&&Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1])>.01;
const touch=(a,b)=>{const ox=Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0]),oy=Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1]);
  return (Math.abs(a[0]+a[2]-b[0])<.01||Math.abs(b[0]+b[2]-a[0])<.01)&&oy>.4||(Math.abs(a[1]+a[3]-b[1])<.01||Math.abs(b[1]+b[3]-a[1])<.01)&&ox>.4;};
const ids=new Set();
const ENGLISH=new RegExp('\\b(the|and|with)\\b','i');
Object.values(S.DECKS).forEach(d=>{
  console.log('\n== '+d.id+' '+d.name+'  bbox '+d.bbox.map(v=>v.toFixed(1)).join(' x ')+'  rooms '+d.rooms.length+' corr '+d.corr.length);
  const items=[...d.rooms.map(r=>({k:'sala',id:r.id,r:r.r})),...d.corr.map(c=>({k:'corredor',id:c.id,r:c.r})),...(d.voids||[]).map((v,i)=>({k:'vazio',id:d.id+':void'+i,r:v})),...(d.blocks||[]).map((b,i)=>({k:'bloco',id:d.id+':bloco'+i,r:b.r}))];
  items.forEach(i=>{if(ids.has(i.id))E('id duplicado '+i.id);ids.add(i.id);});
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
    if(items[i].k==='corredor'&&items[j].k==='corredor')continue; // corredores podem se cruzar (uniao)
    if(ovl(items[i].r,items[j].r))E(d.id+': '+items[i].k+' '+items[i].id+' sobrepoe '+items[j].k+' '+items[j].id);}
  // portas
  d.rooms.forEach(r=>{
    if(!r.d||!r.d.length){ if(!(d.outdoor&&r.t==='ext')&&!r.st&&r.id!=='wd13')W(d.id+': sala sem porta '+r.id+' ('+r.n+')'); return;}
    r.d.forEach(([s,t,k,to])=>{
      const [x,y,w,h]=r.r;const p=s==='n'?[x+w*t,y]:s==='s'?[x+w*t,y+h]:s==='w'?[x,y+h*t]:[x+w,y+h*t];
      const out=s==='n'?[p[0],p[1]-.7]:s==='s'?[p[0],p[1]+.7]:s==='w'?[p[0]-.7,p[1]]:[p[0]+.7,p[1]];
      const inC=d.corr.some(c=>out[0]>=c.r[0]-.01&&out[0]<=c.r[0]+c.r[2]+.01&&out[1]>=c.r[1]-.01&&out[1]<=c.r[1]+c.r[3]+.01);
      const inR=d.rooms.some(q=>q!==r&&out[0]>q.r[0]&&out[0]<q.r[0]+q.r[2]&&out[1]>q.r[1]&&out[1]<q.r[1]+q.r[3]);
      if(to==='c'&&!inC)E(d.id+': porta '+r.id+' lado '+s+' nao da num corredor');
      if(to==='r'&&!inR)E(d.id+': porta '+r.id+' lado '+s+' nao da noutra sala');
      const len=(s==='n'||s==='s')?w:h;if(len*Math.min(t,1-t)<.8)W(d.id+': porta '+r.id+' '+s+' muito perto do canto');});});
  // portas dos contornos de bloco
  (d.blocks||[]).forEach((b,i)=>(b.d||[]).forEach(([s,t,k,to])=>{
    const [x,y,w,h]=b.r;const p=s==='n'?[x+w*t,y]:s==='s'?[x+w*t,y+h]:s==='w'?[x,y+h*t]:[x+w,y+h*t];
    const out=s==='n'?[p[0],p[1]-.7]:s==='s'?[p[0],p[1]+.7]:s==='w'?[p[0]-.7,p[1]]:[p[0]+.7,p[1]];
    if(!d.corr.some(c=>out[0]>=c.r[0]-.01&&out[0]<=c.r[0]+c.r[2]+.01&&out[1]>=c.r[1]-.01&&out[1]<=c.r[1]+c.r[3]+.01))E(d.id+': porta do bloco '+i+' lado '+s+' nao da num corredor');}));
  // conectividade dos corredores (toque)
  const cs=d.corr,seen=new Set([cs[0].id]),q=[cs[0]];
  while(q.length){const c=q.pop();cs.forEach(o=>{if(!seen.has(o.id)&&(ovl(c.r,o.r)||touch(c.r,o.r))){seen.add(o.id);q.push(o);}});}
  cs.forEach(c=>{if(!seen.has(c.id))E(d.id+': corredor isolado '+c.id);});
  // sala alcancavel
  d.rooms.forEach(r=>{if(!r.d||!r.d.length)return;if(!r.d.some(x=>x[3]==='c')&&!r.d.some(x=>x[3]==='r'))E(d.id+': '+r.id+' sem acesso');});
  // sala so com porta pra outra sala precisa chegar a um corredor
  {const byId={};d.rooms.forEach(r=>byId[r.id]=r);
   const reach=new Set(d.rooms.filter(r=>(r.d||[]).some(x=>x[3]==='c')).map(r=>r.id));let ch=true;
   while(ch){ch=false;d.rooms.forEach(r=>{if(reach.has(r.id))return;(r.d||[]).forEach(([s,t,k,to])=>{if(to!=='r')return;const [x,y,w,h]=r.r;const p=s==='n'?[x+w*t,y-.7]:s==='s'?[x+w*t,y+h+.7]:s==='w'?[x-.7,y+h*t]:[x+w+.7,y+h*t];
     const o=d.rooms.find(q=>q!==r&&p[0]>q.r[0]&&p[0]<q.r[0]+q.r[2]&&p[1]>q.r[1]&&p[1]<q.r[1]+q.r[3]);if(o&&reach.has(o.id)){reach.add(r.id);ch=true;}});});}
   d.rooms.forEach(r=>{if((r.d||[]).length&&!reach.has(r.id)&&!r.st)E(d.id+': '+r.id+' so abre pra salas que nao chegam a um corredor');});}
  // areas
  const tot=d.rooms.reduce((a,r)=>a+r.r[2]*r.r[3],0);console.log('area de salas: '+Math.round(tot)+' m2');
  if(d.holes&&d.holes.length)d.holes.forEach(h=>W(d.id+': buraco de '+Math.round(h[2]*h[3])+' m2 em ['+h.join(', ')+'] (vira poche)'));
  // textos
  d.rooms.forEach(r=>{if(!r.pub)W(d.id+': sala sem texto publico '+r.id);if(r.n.length>26)W('nome longo '+r.id);});
  // formato do texto publico: Nome em portugues. Explicacao.
  d.rooms.forEach(r=>{if(r.pub&&(!/^[^.]{2,60}\.\s.+\.$/.test(r.pub)||ENGLISH.test(r.pub)))E(d.id+': texto publico fora do formato Nome. Explicacao. (ou em ingles): '+r.id);});
  if(d.intro!==undefined&&!/^[^.]{2,90}\.\s.+\.$/.test(d.intro))E(d.id+': introducao do deck fora do formato');
  // escapes
  (d.esc||[]).forEach(e=>e.need.forEach(n=>{if(!d.corr.some(c=>c.id===n))E(d.id+': escape cita corredor inexistente '+n);}));
});

/* ---------- escadas e elevadores alinhados entre os decks (mesmo x,y; LQ usa a origem do bloco) ---------- */
{
  const chains=[['weather','module','cellar'],['lqE','lqD','lqC','lqB','lqA','module']];
  const BK=S.BLOCK?[S.BLOCK.org[0],S.BLOCK.org[1],S.BLOCK.size[0],S.BLOCK.size[1]]:null;
  const inBlock=a=>BK&&a.x>=BK[0]&&a.x<=BK[0]+BK[2]&&a.y>=BK[1]&&a.y<=BK[1]+BK[3];
  const itemsOf=d=>{const org=d.org||[0,0],out=[];
    d.rooms.forEach(r=>{const c=[r.r[0]+r.r[2]/2+org[0],r.r[1]+r.r[3]/2+org[1]];
      if(r.t==='stair')out.push({id:r.id,x:c[0],y:c[1],dir:r.dir||'ud',kind:'stair'});
      else if(r.eq==='lift')out.push({id:r.id,x:c[0],y:c[1],dir:'ud',kind:'lift'});});
    (d.stairs||[]).forEach(s=>out.push({id:'overlay@'+s.x+','+s.y,x:s.x+org[0],y:s.y+org[1],dir:s.dir||'ud',kind:s.k==='lift'?'lift':'stair'}));
    return out;};
  chains.forEach((ch,ci)=>{for(let i=0;i<ch.length-1;i++){
    const U=S.DECKS[ch[i]],L=S.DECKS[ch[i+1]];if(!U||!L)continue;
    const part=(deck,a)=>deck.id!=='module'||!BK||(ci===1?inBlock(a):!inBlock(a)); // no module deck, o bloco so conta na cadeia do bloco
    const dn=itemsOf(U).filter(a=>part(U,a)&&(a.dir==='dn'||a.dir==='ud')),up=itemsOf(L).filter(a=>part(L,a)&&(a.dir==='up'||a.dir==='ud'));
    // o topo da torre (E) e o fundo da cadeia nao tem par acima/abaixo; so se confere o par adjacente
    dn.forEach(a=>{if(!up.some(b=>b.kind===a.kind&&Math.hypot(a.x-b.x,a.y-b.y)<=.8))E('escada/elevador '+a.id+' ('+U.id+') desce mas nao ha par que sobe em '+L.id+' no mesmo x,y ('+a.x.toFixed(1)+','+a.y.toFixed(1)+')');});
    up.forEach(b=>{if(!dn.some(a=>a.kind===b.kind&&Math.hypot(a.x-b.x,a.y-b.y)<=.8))E('escada/elevador '+b.id+' ('+L.id+') sobe mas nao ha par que desce em '+U.id+' no mesmo x,y ('+b.x.toFixed(1)+','+b.y.toFixed(1)+')');});
  }});
}
/* coluna do poco: torre (weather), wellbay (module) e wellbay inferior (cellar) no mesmo x,y */
if(S.COLUMN){const rs=S.COLUMN.map(id=>S.roomIndex[id]);
  if(rs.some(r=>!r))E('coluna do poco cita sala inexistente');
  else{const c=rs.map(r=>[r.r[0]+r.r[2]/2,r.r[1]+r.r[3]/2]);c.forEach((p,i)=>{if(Math.hypot(p[0]-c[0][0],p[1]-c[0][1])>1.2)E('coluna do poco: '+S.COLUMN[i]+' fora do eixo da torre');});}}
/* nada da DRE em nenhum arquivo publico */
{const j=JSON.stringify(S);if(/\bDRE\b|caisson|ala da DRE/i.test(j))E('o mapa cita a DRE ou o caisson (proibido nos arquivos publicos)');}
console.log('\n'+err+' erros, '+warn+' avisos');process.exit(err?1:0);
