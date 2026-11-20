// Valida a geometria de station-data.js: sobreposicao, portas, conectividade. Uso: node tools/_verify/validate_map.js
const fs=require('fs');
global.window={};
eval(fs.readFileSync(__dirname+'/../../station-data.js','utf8'));
const S=window.STATION;let err=0,warn=0;
const E=(m)=>{console.log('ERRO  '+m);err++;},W=(m)=>{console.log('aviso '+m);warn++;};
const ovl=(a,b)=>Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0])>.01&&Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1])>.01;
const touch=(a,b)=>{const ox=Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0]),oy=Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1]);
  return (Math.abs(a[0]+a[2]-b[0])<.01||Math.abs(b[0]+b[2]-a[0])<.01)&&oy>.4||(Math.abs(a[1]+a[3]-b[1])<.01||Math.abs(b[1]+b[3]-a[1])<.01)&&ox>.4;};
const ids=new Set();
Object.values(S.DECKS).forEach(d=>{
  console.log('\n== '+d.id+' '+d.name+'  bbox '+d.bbox.map(v=>v.toFixed(1)).join(' x ')+'  rooms '+d.rooms.length+' corr '+d.corr.length);
  const items=[...d.rooms.map(r=>({k:'sala',id:r.id,r:r.r})),...d.corr.map(c=>({k:'corredor',id:c.id,r:c.r})),...(d.voids||[]).map((v,i)=>({k:'vazio',id:d.id+':void'+i,r:v}))];
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
      const inC=d.corr.some(c=>out[0]>c.r[0]&&out[0]<c.r[0]+c.r[2]&&out[1]>c.r[1]&&out[1]<c.r[1]+c.r[3]);
      const inR=d.rooms.some(q=>q!==r&&out[0]>q.r[0]&&out[0]<q.r[0]+q.r[2]&&out[1]>q.r[1]&&out[1]<q.r[1]+q.r[3]);
      if(to==='c'&&!inC)E(d.id+': porta '+r.id+' lado '+s+' nao da num corredor');
      if(to==='r'&&!inR)E(d.id+': porta '+r.id+' lado '+s+' nao da noutra sala');
      const len=(s==='n'||s==='s')?w:h;if(len*Math.min(t,1-t)<.8)W(d.id+': porta '+r.id+' '+s+' muito perto do canto');});});
  // conectividade dos corredores (toque)
  const cs=d.corr,seen=new Set([cs[0].id]),q=[cs[0]];
  while(q.length){const c=q.pop();cs.forEach(o=>{if(!seen.has(o.id)&&(ovl(c.r,o.r)||touch(c.r,o.r))){seen.add(o.id);q.push(o);}});}
  cs.forEach(c=>{if(!seen.has(c.id))E(d.id+': corredor isolado '+c.id);});
  // sala alcancavel
  d.rooms.forEach(r=>{if(!r.d||!r.d.length)return;if(!r.d.some(x=>x[3]==='c')&&!r.d.some(x=>x[3]==='r'))E(d.id+': '+r.id+' sem acesso');});
  // areas
  const tot=d.rooms.reduce((a,r)=>a+r.r[2]*r.r[3],0);console.log('area de salas: '+Math.round(tot)+' m2');
  // textos
  d.rooms.forEach(r=>{if(!r.pub)W(d.id+': sala sem texto publico '+r.id);if(r.n.length>26)W('nome longo '+r.id);});
  // formato do texto publico: Nome em portugues. Explicacao.
  d.rooms.forEach(r=>{if(r.pub&&(!/^[^.]{2,60}\.\s.+\.$/.test(r.pub)||/(the|and|with)/i.test(r.pub)))E(d.id+': texto publico fora do formato Nome. Explicacao. (ou em ingles): '+r.id);});
  if(d.intro!==undefined&&!/^[^.]{2,90}\.\s.+\.$/.test(d.intro))E(d.id+': introducao do deck fora do formato');
  // escapes
  (d.esc||[]).forEach(e=>e.need.forEach(n=>{if(!d.corr.some(c=>c.id===n))E(d.id+': escape cita corredor inexistente '+n);}));
});
console.log('\n'+err+' erros, '+warn+' avisos');process.exit(err?1:0);
