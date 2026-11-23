/* ============================================================
   Layout das salas (itens fixos de cada sala, montados no editor-salas.html).
   Guardado so do lado do mestre: sessions/<S>/gm/layout/<sala> = {items:{id:{k,x,y,rot,sc,sx,sy,z,lbl,sec,s?}}, noeq, t}
   x,y em metros a partir do canto da sala (a sala pode mudar de lugar sem perder o layout).
   Quando a sala e REVELADA, os itens viram props publicados em station/map/props/L~<sala>~<z>~<id> (so o desenho)
   e station/map/noeq/<sala> esconde o equipamento padrao. Itens "secretos" nunca sao publicados.
   ============================================================ */
(function(){
const PFX=room=>'L~'+room+'~';
const zpad=z=>String(Math.max(0,Math.min(999,Math.round((+z||0)+500)))).padStart(3,'0');
const num=v=>typeof v==='number'&&isFinite(v)?v:0;
const items=rec=>(rec&&rec.items)||{};
function catalog(it,ITEMS){return ITEMS[it.k]||it.s||null;}
/* item do layout -> prop pro renderer (coordenadas absolutas do deck) */
function toProp(S,ITEMS,roomId,id,it){
  const r=S.roomIndex[roomId];if(!r)return null;const c=catalog(it,ITEMS);
  return {id,deck:r.deck,x:r.r[0]+num(it.x),y:r.r[1]+num(it.y),rot:num(it.rot),sc:it.sc||1,sx:it.sx||1,sy:it.sy||1,
    w:c?c.w:1,h:c?c.h:1,ops:c?c.ops:[],inl:c&&c.inl?1:0,txt:c&&c.txt?1:0,lbl:it.lbl||'',unk:!c};
}
/* o que vai pro terminal */
function projection(S,ITEMS,roomId,id,it){
  const p=toProp(S,ITEMS,roomId,id,it);if(!p||p.unk)return null;
  return {deck:p.deck,x:p.x,y:p.y,rot:p.rot,sc:p.sc,sx:p.sx,sy:p.sy,w:p.w,h:p.h,ops:p.ops,lbl:p.lbl,inl:p.inl,txt:p.txt};
}
/* caminhos (relativos a station/) pra publicar ou despublicar a sala; pubProps = station/map/props atual */
function publishUpd(S,ITEMS,roomId,rec,on,pubProps){
  const upd={},pre=PFX(roomId);
  Object.keys(pubProps||{}).forEach(k=>{if(k.indexOf(pre)===0)upd['map/props/'+k]=null;});
  if(on&&rec)Object.keys(items(rec)).forEach(id=>{const it=rec.items[id];if(it.sec)return;const p=projection(S,ITEMS,roomId,id,it);
    if(p)upd['map/props/'+pre+zpad(it.z)+'~'+id]=p;});
  upd['map/noeq/'+roomId]=(on&&rec&&rec.noeq)?true:null;
  return upd;
}
/* primeira vez: copia o layout padrao (station-layouts.js) pro Firebase das salas que ainda nao tem registro, e
   publica o das salas que ja estao reveladas (e nao cobertas). Salas que o mestre editou ou limpou nunca sao tocadas. */
function seedDefaults(sessionRef,S,ITEMS){
  const D=window.STATION_LAYOUTS;if(!D||!sessionRef)return Promise.resolve(0);
  return Promise.all([sessionRef.child('gm/layout').once('value'),sessionRef.child('station/map').once('value')]).then(([a,b])=>{
    const have=a.val()||{},map=b.val()||{},upd={};let n=0;
    Object.keys(D).forEach(id=>{
      if(have[id]||!S.roomIndex[id])return;
      const rec={noeq:D[id].noeq!==false,seed:1,t:Date.now(),items:D[id].items};
      upd['gm/layout/'+id]=rec;n++;
      if(map.rooms&&map.rooms[id]&&!(map.veil&&map.veil[id])){const u=publishUpd(S,ITEMS,id,rec,true,map.props||{});Object.keys(u).forEach(k=>{upd['station/'+k]=u[k];});}
    });
    return n?sessionRef.update(upd).then(()=>n):0;
  });
}
const defaultOf=id=>{const d=window.STATION_LAYOUTS&&window.STATION_LAYOUTS[id];return d?{noeq:d.noeq!==false,items:JSON.parse(JSON.stringify(d.items))}:null;};
const count=rec=>Object.keys(items(rec)).length;
window.StationLayout={PFX,zpad,toProp,projection,publishUpd,count,catalog,seedDefaults,defaultOf};
})();
