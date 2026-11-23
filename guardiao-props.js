/* ============================================================
   Painel do Guardiao — CUSTOMIZADOR DE SALAS (props).
   Fonte da verdade (so GM): sessions/<S>/gm/props/<id> = {deck,k,x,y,rot,sc,shown,lbl,note}
   Publicado pros jogadores: sessions/<S>/station/map/props/<id> = {deck,x,y,rot,sc,w,h,ops,lbl,inl,txt}
   (so quando "shown"; o terminal desenha o desenho em si, sem precisar do catalogo, e so se a sala/corredor
   onde o item esta ja foi revelado). Tipos desconhecidos (catalogo privado ausente neste PC) sobrevivem, so nao dá pra redesenhar.
   ============================================================ */
(function(){
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const snap=(v,on)=>on?Math.round(v*4)/4:Math.round(v*100)/100;

function create(ctx){
  const {sessionRef,S,R,$,getDeck,getST,getLastP,redraw,pushHist}=ctx;
  const SP=window.StationProps,ITEMS=SP.items,SL=window.StationLayout;
  let LAYR={},active=false,arm=null,selId=null,cat='mob',q='',GP={},drag=null,lastRot=0,zi=1;const ZW=[800,1200,1700,2400];
  if(!document.getElementById('propsCss')){const st=document.createElement('style');st.id='propsCss';st.textContent=".pbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px;justify-content:space-between}\n.pgrid{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;max-height:230px;overflow:auto;padding:2px}\n.ptile{width:92px;background:#eceae2;border:1px solid #9a9889;border-radius:3px;padding:5px 3px 4px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;font-family:inherit;color:#222;font-size:10px;line-height:1.2}\n.ptile svg{width:40px;height:40px}.ptile:hover{border-color:var(--live)}.ptile.on{outline:2px solid #d0a24f;border-color:#d0a24f;background:#f3eedb}\n.pins{background:var(--panel2);border:1px solid var(--live-dim);border-radius:4px;padding:10px 12px;margin-bottom:6px}\n.pchip{background:var(--bg);border:1px solid var(--line);border-radius:12px;color:var(--ink);font-family:inherit;font-size:11px;padding:3px 10px;cursor:pointer}\n.pchip.h{opacity:.6;border-style:dashed}.pchip.on{border-color:#d0a24f;color:#d0a24f}.pchip:hover{border-color:var(--live)}";document.head.appendChild(st);}
  const gpRef=sessionRef.child('gm/props');
  const planEl=()=>$('mpPlan'),box=()=>$('mpProps');
  const pub=()=>{const m=getST().map;return (m&&m.props)||{};};
  const itemOf=(d,id)=>ITEMS[d.k]||pub()[id]||null;
  const num=v=>typeof v==='number'&&isFinite(v)?v:0;

  /* ---- publicacao ---- */
  function proj(d,id){
    const it=itemOf(d,id);if(!it)return null;
    return {deck:d.deck,x:num(d.x),y:num(d.y),rot:num(d.rot),sc:d.sc||1,sx:d.sx||1,sy:d.sy||1,w:it.w,h:it.h,ops:it.ops,lbl:d.lbl||'',inl:it.inl?1:0,txt:it.txt?1:0};
  }
  /* grava (null = apagar), com inverso pro Ctrl+Z */
  function save(id,nd,label,noHist){
    const old=GP[id]||null,upd={},inv={};
    upd['gm/props/'+id]=nd;inv['gm/props/'+id]=old;
    const pOld=pub()[id]||null,pNew=nd&&nd.shown?proj(nd,id):null;
    upd['station/map/props/'+id]=pNew;inv['station/map/props/'+id]=pOld;
    if(!noHist)pushHist({label,inv,root:'s'});
    if(nd)GP[id]=nd;else delete GP[id];
    sessionRef.update(upd);redraw();drawPanel();
  }
  const newId=()=>'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);

  /* ---- lista pro renderer ---- */
  function layoutProps(deck){const out=[],rr=(getST().map||{}).rooms||{};
    Object.keys(LAYR).forEach(room=>{const r=S.roomIndex[room];if(!r||r.deck!==deck)return;const its=(LAYR[room]||{}).items||{};
      Object.keys(its).sort((a,b)=>((its[a].z||0)-(its[b].z||0))||(a<b?-1:1)).forEach(id=>{const p=SL.toProp(S,ITEMS,room,SL.PFX(room)+id,its[id]);if(p){p.hidden=!rr[room]||!!its[id].sec;p.noHit=true;out.push(p);}});});
    return out;}
  const veiled=room=>{const m=getST().map;return !!(m&&m.veilAll);};
  const layoutUpd=(room,on,vl)=>SL.publishUpd(S,ITEMS,room,LAYR[room]||null,on&&!(vl===undefined?veiled(room):vl),pub());
  function list(deck){
    return layoutProps(deck).concat(Object.keys(GP).filter(id=>GP[id]&&GP[id].deck===deck).sort().map(id=>{const d=GP[id],it=itemOf(d,id);
      return {id,deck:d.deck,x:num(d.x),y:num(d.y),rot:num(d.rot),sc:d.sc||1,sx:d.sx||1,sy:d.sy||1,w:it?it.w:1,h:it?it.h:1,ops:it?it.ops:[],inl:it&&it.inl,txt:it&&it.txt,
        lbl:d.lbl||'',hidden:!d.shown,sel:id===selId,unk:!it};}));
  }
  const inRevealed=(deckId,x,y)=>{const st=getST().map||{},d=S.DECKS[deckId],rr=st.rooms||{},cc=st.corr||{};
    const inb=(r,e)=>x>r[0]-e&&x<r[0]+r[2]+e&&y>r[1]-e&&y<r[1]+r[3]+e;
    return d.rooms.some(r=>rr[r.id]&&inb(r.r,.3))||d.corr.some(c=>cc[c.id]&&inb(c.r,.2));};
  const roomAt=(deckId,x,y)=>{const r=S.DECKS[deckId].rooms.find(r=>x>r.r[0]&&x<r.r[0]+r.r[2]&&y>r.r[1]&&y<r.r[1]+r.r[3]);return r?r.n:'';};

  /* ---- painel ---- */
  function tile(it){return `<button class="ptile${arm===it.id?' on':''}" data-arm="${esc(it.id)}" title="${esc(it.n)}">${R.propThumb(it,40)}<span>${esc(it.n)}</span></button>`;}
  function drawPanel(){
    const b=box();if(!b)return;b.style.display=active?'block':'none';if(!active)return;
    const ae=document.activeElement;if(ae&&b.contains(ae)&&/INPUT|TEXTAREA/.test(ae.tagName)&&ae.id!=='ppSearch'){return;}
    const deck=getDeck(),mine=list(deck).filter(p=>GP[p.id]),ql=norm(q).trim();
    const items=SP.order.map(id=>ITEMS[id]).filter(i=>ql?norm(i.n).includes(ql):i.cat===cat);
    const sel=selId&&GP[selId]&&GP[selId].deck===deck?GP[selId]:null,sit=sel?itemOf(sel,selId):null;
    let ins='';
    if(sel){const shown=!!sel.shown,out=shown&&!inRevealed(deck,sel.x,sel.y);
      ins=`<div class="pins"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><b style="color:var(--ink);font-size:13px">${esc(sit?sit.n:'(tipo desconhecido: '+sel.k+')')}</b>
        <span style="font-size:10px;color:var(--ink-dim);letter-spacing:.1em">${esc(roomAt(deck,sel.x,sel.y)||'fora de sala')} · ${snap(sel.x)}, ${snap(sel.y)} m</span>
        <button class="btn lock${shown?' is-on':''}" id="ppShow" style="margin-left:auto">${shown?'REVELADO — OCULTAR':'OCULTO — REVELAR'}</button></div>
        ${out?'<div style="font-size:11px;color:var(--warn);margin-bottom:8px">⚠ Item revelado, mas a sala/corredor onde ele está ainda não foi revelado: os jogadores só o veem quando o lugar aparecer.</div>':''}
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
          <button class="btn" data-pa="rot-15">⟲ −15°</button><button class="btn" data-pa="rot15">⟳ +15°</button><button class="btn" data-pa="rot90">⟳ 90°</button>
          <button class="btn" data-pa="w-">− largura</button><button class="btn" data-pa="w+">+ largura</button><button class="btn" data-pa="sc-">− tamanho</button><button class="btn" data-pa="sc+">+ tamanho</button>
          <button class="btn" data-pa="dup">DUPLICAR</button><button class="btn" data-pa="del">APAGAR</button></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <label style="flex:1;min-width:180px;font-size:10px;letter-spacing:.14em;color:var(--ink-dim)">RÓTULO <span style="color:var(--live)">· os jogadores leem</span><input id="ppLbl" type="text" maxlength="40" value="${esc(sel.lbl||'')}" style="display:block;width:100%;margin-top:3px;background:var(--panel2);border:1px solid var(--live-dim);border-radius:4px;color:var(--ink);font-family:inherit;font-size:12px;padding:6px 8px"></label>
          <label style="flex:2;min-width:220px;font-size:10px;letter-spacing:.14em;color:var(--ink-dim)">NOTA DO MESTRE <span>· só você vê</span><textarea id="ppNote" style="display:block;width:100%;margin-top:3px;min-height:34px;background:var(--bg);border:1px solid var(--line);border-radius:4px;color:var(--ink);font-family:inherit;font-size:12px;padding:6px 8px;resize:vertical">${esc(sel.note||'')}</textarea></label></div></div>`;}
    else ins=`<div style="font-size:11px;color:var(--ink-dim);margin:2px 0 8px">${arm?'Clique no mapa pra colocar <b style="color:var(--ink)">'+esc(ITEMS[arm]?ITEMS[arm].n:arm)+'</b>. <b>Alt</b> solta a grade, <b>Esc</b> larga o item.':'Escolha um item abaixo e clique no mapa. Clique num item do mapa pra mexer nele; arraste pra mover.'}</div>`;
    b.innerHTML=`<div class="pbar"><div style="display:flex;gap:6px;flex-wrap:wrap">${SP.cats.map(([c,n])=>`<button class="btn view-btn${!ql&&c===cat?' is-on':''}" data-cat="${c}">${esc(n)}</button>`).join('')}</div>
      <div style="display:flex;gap:6px;align-items:center"><span style="font-size:10px;letter-spacing:.14em;color:var(--ink-dim)">ZOOM DO MAPA</span><button class="btn" data-pa="zout">−</button><button class="btn" data-pa="zin">+</button></div><input id="ppSearch" type="text" placeholder="buscar item…" value="${esc(q)}" autocomplete="off" style="min-width:150px;background:var(--bg);border:1px solid var(--line);border-radius:4px;color:var(--ink);font-family:inherit;font-size:12px;padding:6px 9px"></div>
      <div class="pgrid">${items.map(tile).join('')||'<span style="font-size:12px;color:var(--ink-dim)">nenhum item</span>'}</div>${ins}
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px"><div style="font-size:10px;letter-spacing:.2em;color:var(--ink-dim)">NESTE DECK (${mine.length}) · tracejado = oculto</div>
      <button class="btn" data-pa="revall" style="margin-left:auto">REVELAR TODOS</button><button class="btn" data-pa="hideall">OCULTAR TODOS</button><button class="btn" data-pa="clear">LIMPAR DECK</button></div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px">${mine.map(p=>`<button class="pchip${p.sel?' on':''}${p.hidden?' h':''}" data-sel="${esc(p.id)}">${esc((ITEMS[GP[p.id].k]||{n:'?'}).n)}${p.lbl?' · '+esc(p.lbl):''}</button>`).join('')||'<span style="font-size:12px;color:var(--ink-dim)">nada colocado ainda.</span>'}</div>`;
  }

  /* ---- acoes ---- */
  function act(a){
    const deck=getDeck();
    if(a==='revall'||a==='hideall'){const on=a==='revall';Object.keys(GP).filter(id=>GP[id].deck===deck&&!!GP[id].shown!==on).forEach(id=>save(id,Object.assign({},GP[id],{shown:on}),(on?'revelou':'ocultou')+' props'));return;}
    if(a==='clear'){const ids=Object.keys(GP).filter(id=>GP[id].deck===deck);if(!ids.length||!confirm('Apagar os '+ids.length+' props deste deck? (dá pra desfazer com Ctrl+Z, um por vez)'))return;ids.forEach(id=>save(id,null,'apagou prop'));selId=null;return;}
    if(a==='zin'||a==='zout'){zi=Math.max(0,Math.min(ZW.length-1,zi+(a==='zin'?1:-1)));redraw();return;}
    const d=GP[selId];if(!d)return;
    if(a==='del'){save(selId,null,'apagou '+((itemOf(d,selId)||{}).n||'prop'));selId=null;drawPanel();return;}
    if(a==='dup'){const id=newId();selId=id;save(id,Object.assign({},d,{x:snap(d.x+.75,1),y:snap(d.y+.75,1)}),'duplicou prop');return;}
    let nd=Object.assign({},d);
    if(a.startsWith('rot')){const v=a==='rot90'?90:+a.slice(3);nd.rot=((num(d.rot)+v)%360+360)%360;lastRot=nd.rot;}
    else if(a==='sc+')nd.sc=Math.min(4,Math.round((d.sc||1)*125)/100);
    else if(a==='sc-')nd.sc=Math.max(.25,Math.round((d.sc||1)*80)/100);
    else if(a==='w+')nd.sx=Math.min(8,Math.round((d.sx||1)*125)/100);
    else if(a==='w-')nd.sx=Math.max(.1,Math.round((d.sx||1)*80)/100);
    else if(a==='show')nd.shown=!d.shown;
    save(selId,nd,(a==='show'?(nd.shown?'revelou ':'ocultou '):'ajustou ')+((itemOf(d,selId)||{}).n||'prop'));
  }

  /* ---- mapa: colocar, selecionar, arrastar ---- */
  const toDeck=e=>{const svg=planEl().querySelector('svg'),P=getLastP();if(!svg||!P)return null;const b=svg.getBoundingClientRect(),k=P.w/b.width;return P.toDeck((e.clientX-b.left)*k,(e.clientY-b.top)*k);};
  function onDown(e){
    if(!active||e.button!==0)return;
    const pe=e.target.closest&&e.target.closest('[data-prop]'),pt=toDeck(e);if(!pt)return;
    if(pe){const id=pe.dataset.prop;if(!GP[id])return;selId=id;arm=null;const d=GP[id];
      redraw();drawPanel();
      drag={id,sx:pt[0],sy:pt[1],ox:num(d.x),oy:num(d.y),moved:false,el:planEl().querySelector('[data-prop="'+id+'"]')};
      try{planEl().setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();return;}
    if(arm){const it=ITEMS[arm];if(!it)return;const id=newId();
      const lbl=it.inl&&!it.txt?String(Object.values(GP).filter(g=>g.deck===getDeck()&&g.k===arm).length+1):(it.txt?'Texto':'');
      selId=id;save(id,{deck:getDeck(),k:arm,x:snap(pt[0],!e.altKey),y:snap(pt[1],!e.altKey),rot:lastRot,sc:1,shown:false,lbl},'colocou '+it.n);e.preventDefault();return;}
    if(selId){selId=null;redraw();drawPanel();}
  }
  function onMove(e){
    if(!drag)return;const pt=toDeck(e);if(!pt)return;
    const x=snap(drag.ox+pt[0]-drag.sx,!e.altKey),y=snap(drag.oy+pt[1]-drag.sy,!e.altKey);
    if(x!==drag.nx||y!==drag.ny){drag.nx=x;drag.ny=y;drag.moved=true;
      const P=getLastP(),d=GP[drag.id],el=drag.el;if(el&&P){el.setAttribute('transform','translate('+(P.ox+x*P.px)+' '+(P.oy+y*P.px)+') rotate('+num(d.rot)+') scale('+(P.px*(d.sc||1))+')');}}
  }
  function onUp(e){
    if(!drag)return;const dr=drag;drag=null;try{planEl().releasePointerCapture(e.pointerId);}catch(_){}
    if(dr.moved&&GP[dr.id])save(dr.id,Object.assign({},GP[dr.id],{x:dr.nx,y:dr.ny}),'moveu '+((itemOf(GP[dr.id],dr.id)||{}).n||'prop'));else{redraw();drawPanel();}
  }

  function bind(){
    const pl=planEl();
    pl.addEventListener('pointerdown',onDown);pl.addEventListener('pointermove',onMove);pl.addEventListener('pointerup',onUp);pl.addEventListener('pointercancel',onUp);
    box().addEventListener('click',e=>{
      const t=e.target.closest('[data-arm]');if(t){arm=arm===t.dataset.arm?null:t.dataset.arm;selId=arm?null:selId;redraw();drawPanel();return;}
      const c=e.target.closest('[data-cat]');if(c){cat=c.dataset.cat;q='';drawPanel();return;}
      const s=e.target.closest('[data-sel]');if(s){selId=s.dataset.sel;arm=null;redraw();drawPanel();return;}
      const a=e.target.closest('[data-pa]');if(a){act(a.dataset.pa);return;}
      if(e.target.id==='ppShow')act('show');});
    box().addEventListener('input',e=>{
      if(e.target.id==='ppSearch'){q=e.target.value;const p=e.target.selectionStart;drawPanel();const n=$('ppSearch');if(n){n.focus();n.setSelectionRange(p,p);}return;}
      if(e.target.id==='ppLbl'&&GP[selId]){const id=selId,v=e.target.value;clearTimeout(bind.t1);bind.t1=setTimeout(()=>save(id,Object.assign({},GP[id],{lbl:v}),'rótulo',true),350);}
      if(e.target.id==='ppNote'&&GP[selId]){const id=selId,v=e.target.value;clearTimeout(bind.t2);bind.t2=setTimeout(()=>{if(GP[id]){GP[id]=Object.assign({},GP[id],{note:v});gpRef.child(id+'/note').set(v||null);}},500);}
    });
    addEventListener('keydown',e=>{
      if(!active||(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))||e.ctrlKey||e.metaKey)return;
      const k=e.key;
      if(k==='Escape'){if(arm)arm=null;else selId=null;redraw();drawPanel();return;}
      if(!selId||!GP[selId])return;
      if(k==='r'||k==='R'){e.preventDefault();act(e.shiftKey?'rot-15':'rot15');}
      else if(k==='Delete'||k==='Backspace'){e.preventDefault();act('del');}
      else if(k==='d'||k==='D'){e.preventDefault();act('dup');}
      else if(k==='h'||k==='H'){e.preventDefault();act('show');}
      else if(k.startsWith('Arrow')){e.preventDefault();const st=e.shiftKey?1:.25,d=GP[selId];
        save(selId,Object.assign({},d,{x:snap(num(d.x)+(k==='ArrowRight'?st:k==='ArrowLeft'?-st:0),1),y:snap(num(d.y)+(k==='ArrowDown'?st:k==='ArrowUp'?-st:0),1)}),'moveu prop');}
    });
    sessionRef.child('gm/layout').on('value',s=>{LAYR=s.val()||{};if(!drag)redraw();});
    gpRef.on('value',s=>{GP=s.val()||{};if(selId&&!GP[selId])selId=null;if(!drag){redraw();drawPanel();}});
  }

  return {bind,list,layoutUpd,width:()=>ZW[zi],active:()=>active,dragging:()=>!!drag,armed:()=>arm,
    setActive:v=>{active=!!v;if(!active){arm=null;}drawPanel();redraw();},drawPanel,
    state:()=>({GP,selId,arm})};
}
window.GuardiaoProps={create};
})();
