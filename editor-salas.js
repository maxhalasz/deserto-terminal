/* ============================================================
   EDITOR DE SALAS (so do mestre). Uma sala por vez, em zoom, com grade; salva sozinho em gm/layout/<sala>.
   Se a sala ja esta revelada pros jogadores, cada mudanca republica os itens dela na hora.
   Ver station-layout.js (formato) e station-props*.js (catalogo).
   ============================================================ */
(function(){
const S=window.STATION,R=window.StationRender,SP=window.StationProps,SL=window.StationLayout,ITEMS=SP.items;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const num=v=>typeof v==='number'&&isFinite(v)?v:0;
const r2=v=>Math.round(v*100)/100;
const clone=o=>JSON.parse(JSON.stringify(o));
const pad=n=>String(n).padStart(2,'0');
const newId=()=>'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);

function init(sessionRef){
  const layRef=sessionRef.child('gm/layout'),stRef=sessionRef.child('station');
  const root=document.getElementById('app');
  let deckId='module',roomId=null,LAY={},PUB={},sel=new Set(),arm=null,clip=null,zi=1,grid=true,snapStep=.25,preview=false,q='',cat='mob',pq='';
  let undo=[],redo=[],dirty=new Set(),saveT=0,status='',drag=null,band=null,lastRot=0,lastP=null,statusT=0;

  root.innerHTML=`
  <header id="top"><div class="ttl">EDITOR DE <span>SALAS</span></div><div id="decks"></div>
    <div class="sp"></div><span id="status"></span>
    <button class="btn" id="bUndo" title="Ctrl+Z" disabled>↶</button><button class="btn" id="bRedo" title="Ctrl+Y" disabled>↷</button>
    <button class="btn" id="bExp" title="Baixa um arquivo com todas as salas (backup)">EXPORTAR</button><button class="btn" id="bImp">IMPORTAR</button><input type="file" id="fImp" accept=".json,application/json" style="display:none">
    <a class="btn" href="guardiao.html" title="Voltar ao painel do Guardião">PAINEL ↗</a></header>
  <main>
    <aside id="rooms"><input id="rq" type="text" placeholder="buscar sala…" autocomplete="off"><div id="rlist"></div></aside>
    <section id="stage"><div id="tools"><div id="rname"></div><div class="sp"></div>
      <label>grade <select id="snap"><option value="0.1">0,1 m</option><option value="0.25" selected>0,25 m</option><option value="0.5">0,5 m</option><option value="1">1 m</option><option value="0">livre</option></select></label>
      <label><input type="checkbox" id="gridOn" checked> linhas</label>
      <label title="Mostra como os jogadores vão ver (sem grade, sem salas vizinhas, sem itens secretos)"><input type="checkbox" id="prevOn"> prévia dos jogadores</label>
      <button class="btn" id="zOut">−</button><button class="btn" id="zFit">AJUSTAR</button><button class="btn" id="zIn">+</button></div>
      <div id="cv"></div><div id="tip"></div></section>
    <aside id="side"><div id="pal"></div><div id="ins"></div><div id="rtools"></div></aside>
  </main>`;
  const $=id=>document.getElementById(id);

  /* ---------- dados ---------- */
  const room=()=>roomId?S.roomIndex[roomId]:null;
  const rec=()=>LAY[roomId]||null;
  const itemsOf=id=>((LAY[id]||{}).items)||{};
  function ensure(){if(!LAY[roomId])LAY[roomId]={items:{},noeq:false};if(!LAY[roomId].items)LAY[roomId].items={};return LAY[roomId];}
  const revealed=id=>!!(PUB.map&&PUB.map.rooms&&PUB.map.rooms[id]);
  const veiledR=id=>!!(PUB.map&&PUB.map.veil&&PUB.map.veil[id]);
  const pubProps=()=>(PUB.map&&PUB.map.props)||{};

  /* ---------- salvar (sozinho) ---------- */
  function setStatus(t,keep){status=t;$('status').textContent=t;clearTimeout(statusT);if(!keep)statusT=setTimeout(()=>{$('status').textContent='';},4000);}
  function toWrite(id){
    const r=LAY[id];if(!r)return null;
    const out={noeq:!!r.noeq,t:Date.now(),items:{}};if(!SL.count(r))out.empty=true;
    Object.keys(r.items).forEach(k=>{const it=Object.assign({},r.items[k]);const c=ITEMS[it.k];
      if(c&&c.priv)it.s={w:c.w,h:c.h,ops:c.ops,inl:c.inl?1:0,txt:c.txt?1:0};else delete it.s;
      Object.keys(it).forEach(f=>{if(it[f]===undefined)delete it[f];});out.items[k]=it;});
    return out;}
  function flush(){
    clearTimeout(saveT);saveT=0;const ids=[...dirty];dirty.clear();if(!ids.length)return;
    setStatus('salvando…',true);
    const ps=ids.map(id=>{const w=toWrite(id);
      const upd={};upd['gm/layout/'+id]=w;
      Object.assign(upd,prefixed(SL.publishUpd(S,ITEMS,id,w,revealed(id)&&!veiledR(id),pubProps())));
      return sessionRef.update(upd);});
    Promise.all(ps).then(()=>setStatus('✓ salvo '+pad(new Date().getHours())+':'+pad(new Date().getMinutes()))).catch(e=>setStatus('⚠ não salvou: '+(e&&e.message||e),true));
  }
  const prefixed=u=>{const o={};Object.keys(u).forEach(k=>{o['station/'+k]=u[k];});return o;};
  function touch(id){dirty.add(id);clearTimeout(saveT);saveT=setTimeout(flush,450);setStatus('alterações…',true);}
  addEventListener('beforeunload',e=>{if(dirty.size){flush();e.preventDefault();e.returnValue='';}});

  /* ---------- desfazer ---------- */
  function pushUndo(){undo.push({room:roomId,rec:clone(LAY[roomId]||null)});if(undo.length>80)undo.shift();redo=[];drawUR();}
  function restore(from,to){const h=from.pop();if(!h)return;to.push({room:h.room,rec:clone(LAY[h.room]||null)});
    if(h.rec)LAY[h.room]=h.rec;else delete LAY[h.room];
    if(h.room!==roomId){roomId=h.room;deckId=room().deck;}sel.clear();touch(h.room);renderAll();}
  const doUndo=()=>restore(undo,redo),doRedo=()=>restore(redo,undo);
  function drawUR(){$('bUndo').disabled=!undo.length;$('bRedo').disabled=!redo.length;}
  /* toda mudanca passa por aqui */
  function mut(fn,noRender){pushUndo();const r=ensure();fn(r);touch(roomId);if(!noRender)renderAll();}

  /* ---------- cabecalho e lista ---------- */
  function drawDecks(){$('decks').innerHTML=Object.keys(S.DECKS).map(id=>{const d=S.DECKS[id];return `<button class="btn chip${id===deckId?' on':''}" data-d="${id}">${esc(d.lvl)} ${esc(d.name.replace('Living quarters · ','LQ '))}</button>`;}).join('');}
  function drawRooms(){
    const ql=norm(q).trim(),list=[];
    Object.keys(S.DECKS).forEach(id=>{if(!ql&&id!==deckId)return;S.DECKS[id].rooms.forEach(r=>{if(r.t==='stair')return;if(ql&&!(norm(r.n).includes(ql)||norm(r.id).includes(ql)))return;list.push(r);});});
    $('rlist').innerHTML=list.map(r=>{const n=SL.count(LAY[r.id]);
      return `<button class="ri${r.id===roomId?' on':''}" data-r="${esc(r.id)}"><span class="rn">${esc(r.n.replace(/^M\d+ · /,''))}</span><span class="rm">${n?'<b>'+n+'</b>':''}${LAY[r.id]&&LAY[r.id].noeq?' ◌':''}${revealed(r.id)?' ●':''}</span></button>`;}).join('')||'<div class="mut">nenhuma sala</div>';
  }

  /* ---------- paleta ---------- */
  function drawPal(){
    const ql=norm(pq).trim(),its=SP.order.map(id=>ITEMS[id]).filter(i=>ql?norm(i.n).includes(ql):i.cat===cat);
    $('pal').innerHTML=`<div class="sh">ITENS</div><div class="cats">${SP.cats.map(([c,n])=>`<button class="btn chip${!ql&&c===cat?' on':''}" data-cat="${c}">${esc(n)}</button>`).join('')}</div>
      <input id="pq" type="text" placeholder="buscar item…" value="${esc(pq)}" autocomplete="off">
      <div class="pg">${its.map(i=>`<button class="pt${arm===i.id?' on':''}" data-arm="${esc(i.id)}" title="${esc(i.n)}">${R.propThumb(i,38)}<span>${esc(i.n)}</span></button>`).join('')||'<span class="mut">nenhum item</span>'}</div>`;
  }

  /* ---------- canvas ---------- */
  function pdeck(r){
    const d=S.DECKS[r.deck],m=4,bb=[r.r[0]-m,r.r[1]-m,r.r[2]+2*m,r.r[3]+2*m];
    const hit=q2=>q2[0]<bb[0]+bb[2]&&q2[0]+q2[2]>bb[0]&&q2[1]<bb[1]+bb[3]&&q2[1]+q2[3]>bb[1];
    const inb=(x,y)=>x>=bb[0]&&x<=bb[0]+bb[2]&&y>=bb[1]&&y<=bb[1]+bb[3];
    return Object.assign({},d,{bbox:bb,rooms:d.rooms.filter(q2=>q2===r||(!preview&&hit(q2.r))),corr:d.corr.filter(c=>hit(c.r)),voids:(d.voids||[]).filter(hit),firewall:(d.firewall||[]).filter(hit),
      fireDoors:(d.fireDoors||[]).filter(f=>inb(f.x,f.y)),stairs:(d.stairs||[]).filter(s=>inb(s.x,s.y)),fire:(d.fire||[]).filter(p=>inb(p[0],p[1])),mcp:(d.mcp||[]).filter(p=>inb(p[0],p[1])),esc:[],cams:[]});
  }
  function propList(){
    const r=room(),its=itemsOf(roomId);
    return Object.keys(its).sort((a,b)=>(num(its[a].z)-num(its[b].z))||(a<b?-1:1)).filter(id=>!(preview&&its[id].sec)).map(id=>{
      const p=SL.toProp(S,ITEMS,roomId,id,its[id]);p.sel=sel.has(id)&&!preview;p.hidden=!!its[id].sec;return p;});
  }
  function draw(){
    const r=room(),cv=$('cv');
    if(!r){cv.innerHTML='<div class="empty">Escolha uma sala na lista à esquerda.</div>';lastP=null;return;}
    const d=pdeck(r),bb=d.bbox,vw=Math.max(300,cv.clientWidth-8),vh=Math.max(300,cv.clientHeight-8);
    const fit=Math.min((vw-66)/bb[2],(vh-90)/bb[3],80),W=Math.round((fit*zi)*bb[2]+66);
    const st={rooms:{[r.id]:1},corr:{},ghost:!preview,props:propList(),noeq:{}};
    d.corr.forEach(c=>{st.corr[c.id]=1;});
    const rec_=rec();if(rec_&&rec_.noeq)st.noeq[r.id]=1;
    const p=R.plan(d,st,{W,maxH:99999,maxPx:200,id:'ed',key:false});lastP=p;
    let svg=p.svg;
    if(grid&&!preview){const x0=r.r[0],y0=r.r[1],w=r.r[2],h=r.r[3];let g='<g pointer-events="none" stroke-linecap="butt">';
      for(let i=0;i<=Math.floor(w);i++){const x=p.ox+(x0+i)*p.px;g+=`<path d="M${x.toFixed(1)} ${(p.oy+y0*p.px).toFixed(1)}V${(p.oy+(y0+h)*p.px).toFixed(1)}" stroke="rgba(30,70,90,${i%5?'.10':'.22'})" stroke-width="${i%5?.6:.9}"/>`;}
      for(let j=0;j<=Math.floor(h);j++){const y=p.oy+(y0+j)*p.px;g+=`<path d="M${(p.ox+x0*p.px).toFixed(1)} ${y.toFixed(1)}H${(p.ox+(x0+w)*p.px).toFixed(1)}" stroke="rgba(30,70,90,${j%5?'.10':'.22'})" stroke-width="${j%5?.6:.9}"/>`;}
      svg=svg.replace(/<\/svg>$/,g+'</g></svg>');}
    const sx=cv.scrollLeft,sy=cv.scrollTop;cv.innerHTML=svg;cv.scrollLeft=sx;cv.scrollTop=sy;
    $('rname').innerHTML=`<b>${esc(r.n)}</b> <span class="mut">${esc(r.id)} · ${r2(r.r[2])} × ${r2(r.r[3])} m · ${esc(S.DECKS[r.deck].lvl)}${revealed(r.id)?' · <i class="live">revelada: mudanças vão pra mesa na hora</i>':''}</span>`;
  }
  function toDeck(e){const svg=$('cv').querySelector('svg');if(!svg||!lastP)return null;const b=svg.getBoundingClientRect(),k=lastP.w/b.width;return lastP.toDeck((e.clientX-b.left)*k,(e.clientY-b.top)*k);}
  const toRel=pt=>{const r=room();return [pt[0]-r.r[0],pt[1]-r.r[1]];};
  const snap=(v,e)=>snapStep&&!(e&&e.altKey)?Math.round(v/snapStep)*snapStep:r2(v);

  /* ---------- inspetor ---------- */
  function drawIns(){
    const b=$('ins'),r=room();if(!r){b.innerHTML='';return;}
    const ids=[...sel].filter(id=>itemsOf(roomId)[id]);
    let h='<div class="sh">SELEÇÃO</div>';
    if(!ids.length){h+=`<div class="mut" style="line-height:1.6">${arm?'Clique na sala pra colocar <b>'+esc((ITEMS[arm]||{}).n||arm)+'</b>. <b>Esc</b> larga o item.':'Escolha um item na paleta e clique na sala. Clique num item pra editar, arraste pra mover, arraste no vazio pra selecionar vários.'}</div>`;}
    else if(ids.length===1){const id=ids[0],it=itemsOf(roomId)[id],c=ITEMS[it.k]||it.s||{n:'(tipo desconhecido)',w:1,h:1};
      h+=`<div class="ib"><b>${esc(c.n||it.k)}</b><div class="g2">
        <label>X (m)<input type="number" step="0.05" data-f="x" value="${r2(num(it.x))}"></label><label>Y (m)<input type="number" step="0.05" data-f="y" value="${r2(num(it.y))}"></label>
        <label>Largura (m)<input type="number" step="0.1" min="0.1" data-f="w" value="${r2(c.w*(it.sc||1)*(it.sx||1))}"></label><label>Profund. (m)<input type="number" step="0.1" min="0.1" data-f="h" value="${r2(c.h*(it.sc||1)*(it.sy||1))}"></label>
        <label>Giro (°)<input type="number" step="15" data-f="rot" value="${Math.round(num(it.rot))}"></label><label>Rótulo<input type="text" maxlength="40" data-f="lbl" value="${esc(it.lbl||'')}"></label></div>
        <label class="ck"><input type="checkbox" data-f="sec" ${it.sec?'checked':''}> secreto (não aparece pros jogadores)</label>`;}
    else h+=`<div class="ib"><b>${ids.length} itens</b><div class="row"><button class="btn" data-a="alL">alinhar à esq.</button><button class="btn" data-a="alR">à dir.</button><button class="btn" data-a="alT">ao topo</button><button class="btn" data-a="alB">embaixo</button><button class="btn" data-a="alCX">centro X</button><button class="btn" data-a="alCY">centro Y</button><button class="btn" data-a="dsX">distribuir ↔</button><button class="btn" data-a="dsY">distribuir ↕</button></div>`;
    if(ids.length)h+=`<div class="row"><button class="btn" data-a="rotL">⟲ 15°</button><button class="btn" data-a="rotR">⟳ 15°</button><button class="btn" data-a="rot90">⟳ 90°</button><button class="btn" data-a="wMin">− largura</button><button class="btn" data-a="wPlus">+ largura</button><button class="btn" data-a="big">+ tamanho</button><button class="btn" data-a="small">− tamanho</button></div>
      <div class="row"><button class="btn" data-a="dup">DUPLICAR</button><button class="btn" data-a="copy">COPIAR</button><button class="btn" data-a="front">PRA FRENTE</button><button class="btn" data-a="back">PRA TRÁS</button><button class="btn dng" data-a="del">APAGAR</button></div></div>`;
    b.innerHTML=h;
    const rt=$('rtools'),rr=rec();
    const others=Object.keys(LAY).filter(k=>k!==roomId&&SL.count(LAY[k])&&S.roomIndex[k]);
    rt.innerHTML=`<div class="sh">ESTA SALA</div><div class="ib">
      <label class="ck"><input type="checkbox" id="noeq" ${rr&&rr.noeq?'checked':''}> esconder o equipamento padrão (só os meus itens)</label>
      <div class="row"><button class="btn" data-a="mirH">espelhar ↔</button><button class="btn" data-a="mirV">espelhar ↕</button><button class="btn" data-a="paste" ${clip?'':'disabled'}>COLAR${clip?' ('+clip.length+')':''}</button><button class="btn" data-a="all">SELECIONAR TUDO</button><button class="btn dng" data-a="clear">LIMPAR SALA</button>${SL.defaultOf(roomId)?'<button class="btn" data-a="reset" title="Volta ao layout que veio pronto com o mapa">RESTAURAR PADRÃO</button>':''}</div>
      <div class="row"><select id="cpFrom"><option value="">copiar o layout de…</option>${others.map(k=>`<option value="${esc(k)}">${esc(S.roomIndex[k].n)} (${SL.count(LAY[k])})</option>`).join('')}</select><button class="btn" id="cpGo">COPIAR PRA CÁ</button></div></div>`;
  }

  /* ---------- operacoes ---------- */
  function selItems(){const its=itemsOf(roomId);return [...sel].filter(id=>its[id]).map(id=>[id,its[id]]);}
  function act(a){
    const r=room();if(!r)return;
    if(a==='all'){sel=new Set(Object.keys(itemsOf(roomId)));draw();drawIns();return;}
    if(a==='reset'){const d=SL.defaultOf(roomId);if(!d||!confirm('Voltar esta sala ao layout padrão? O que você montou nela será trocado (Ctrl+Z desfaz).'))return;mut(x=>{x.items=d.items;x.noeq=d.noeq;});sel.clear();return;}
    if(a==='clear'){const n=SL.count(rec());if(!n||!confirm('Apagar os '+n+' itens desta sala? (Ctrl+Z desfaz)'))return;mut(x=>{x.items={};x.noeq=false;});sel.clear();return;}
    if(a==='paste'){if(!clip)return;const ids=[];mut(x=>{clip.forEach(c=>{const id=newId();ids.push(id);x.items[id]=Object.assign({},clone(c),{x:r2(num(c.x)+(clip.fromRoom===roomId?.5:0)),y:r2(num(c.y)+(clip.fromRoom===roomId?.5:0))});});});sel=new Set(ids);renderAll();return;}
    if(a==='mirH'||a==='mirV'){mut(x=>{Object.values(x.items).forEach(it=>{if(a==='mirH'){it.x=r2(r.r[2]-num(it.x));it.rot=((-num(it.rot))%360+360)%360;}else{it.y=r2(r.r[3]-num(it.y));it.rot=(((180-num(it.rot))%360)+360)%360;}});});return;}
    const ss=selItems();if(!ss.length)return;
    if(a==='del'){mut(x=>{ss.forEach(([id])=>delete x.items[id]);});sel.clear();return;}
    if(a==='copy'){clip=ss.map(([,it])=>clone(it));clip.fromRoom=roomId;setStatus('copiado '+clip.length+' item(ns): Ctrl+V cola');drawIns();return;}
    if(a==='dup'){const ids=[];mut(x=>{ss.forEach(([id,it])=>{const n=newId();ids.push(n);x.items[n]=Object.assign(clone(it),{x:r2(num(it.x)+.5),y:r2(num(it.y)+.5)});});});sel=new Set(ids);renderAll();return;}
    mut(x=>{const its=ss.map(([id])=>x.items[id]);
      const bx=it=>{const c=ITEMS[it.k]||it.s||{w:1,h:1},ang=num(it.rot)*Math.PI/180,w=c.w*(it.sc||1)*(it.sx||1),h=c.h*(it.sc||1)*(it.sy||1),ex=Math.abs(w*Math.cos(ang))+Math.abs(h*Math.sin(ang)),ey=Math.abs(w*Math.sin(ang))+Math.abs(h*Math.cos(ang));return {l:num(it.x)-ex/2,r:num(it.x)+ex/2,t:num(it.y)-ey/2,b:num(it.y)+ey/2};};
      if(a==='rotL'||a==='rotR'||a==='rot90'){const v=a==='rotL'?-15:a==='rotR'?15:90;its.forEach(it=>{it.rot=((num(it.rot)+v)%360+360)%360;lastRot=it.rot;});}
      else if(a==='wPlus'||a==='wMin'){its.forEach(it=>{it.sx=Math.max(.1,r2((it.sx||1)*(a==='wPlus'?1.25:.8)));});}
      else if(a==='big'||a==='small'){its.forEach(it=>{it.sc=Math.max(.25,Math.min(5,r2((it.sc||1)*(a==='big'?1.25:.8))));});}
      else if(a==='front'||a==='back'){const zs=Object.values(x.items).map(i=>num(i.z));const z=a==='front'?Math.max(...zs)+1:Math.min(...zs)-1;its.forEach(it=>{it.z=z;});}
      else if(a.startsWith('al')){const bs=its.map(bx);
        if(a==='alL'){const m=Math.min(...bs.map(b=>b.l));its.forEach((it,i)=>{it.x=r2(num(it.x)+m-bs[i].l);});}
        if(a==='alR'){const m=Math.max(...bs.map(b=>b.r));its.forEach((it,i)=>{it.x=r2(num(it.x)+m-bs[i].r);});}
        if(a==='alT'){const m=Math.min(...bs.map(b=>b.t));its.forEach((it,i)=>{it.y=r2(num(it.y)+m-bs[i].t);});}
        if(a==='alB'){const m=Math.max(...bs.map(b=>b.b));its.forEach((it,i)=>{it.y=r2(num(it.y)+m-bs[i].b);});}
        if(a==='alCX'){const m=bs.reduce((s,b)=>s+(b.l+b.r)/2,0)/bs.length;its.forEach((it,i)=>{it.x=r2(m);});}
        if(a==='alCY'){const m=bs.reduce((s,b)=>s+(b.t+b.b)/2,0)/bs.length;its.forEach((it,i)=>{it.y=r2(m);});}}
      else if(a==='dsX'||a==='dsY'){const k=a==='dsX'?'x':'y';const o=its.slice().sort((p,q2)=>num(p[k])-num(q2[k]));if(o.length>2){const a0=num(o[0][k]),a1=num(o[o.length-1][k]);o.forEach((it,i)=>{it[k]=r2(a0+(a1-a0)*i/(o.length-1));});}}
    });
  }
  function setField(f,v){
    const ss=selItems();if(ss.length!==1)return;const [id,it]=ss[0],c=ITEMS[it.k]||it.s||{w:1,h:1};
    mut(x=>{const t=x.items[id];
      if(f==='x'||f==='y')t[f]=r2(num(parseFloat(v)));
      else if(f==='rot')t.rot=((Math.round(num(parseFloat(v)))%360)+360)%360;
      else if(f==='w')t.sx=Math.max(.05,r2((parseFloat(v)||c.w)/(c.w*(t.sc||1))));
      else if(f==='h')t.sy=Math.max(.05,r2((parseFloat(v)||c.h)/(c.h*(t.sc||1))));
      else if(f==='lbl')t.lbl=String(v);
      else if(f==='sec'){if(v)t.sec=1;else delete t.sec;}},true);
    draw();
  }

  /* ---------- mouse no canvas ---------- */
  function tfFor(it,dx,dy){const r=room(),k=lastP.px,c=ITEMS[it.k]||it.s||{w:1,h:1};
    return 'translate('+(lastP.ox+(r.r[0]+num(it.x)+dx)*k)+' '+(lastP.oy+(r.r[1]+num(it.y)+dy)*k)+') rotate('+num(it.rot)+') scale('+(k*(it.sc||1)*(it.sx||1))+' '+(k*(it.sc||1)*(it.sy||1))+')';}
  function onDown(e){
    if(e.button!==0||!room())return;const pt=toDeck(e);if(!pt)return;
    const pe=e.target.closest&&e.target.closest('[data-prop]');
    if(pe&&itemsOf(roomId)[pe.dataset.prop]){const id=pe.dataset.prop;arm=null;
      if(e.shiftKey){if(sel.has(id))sel.delete(id);else sel.add(id);}else if(!sel.has(id))sel=new Set([id]);
      draw();drawIns();drawPal();
      drag={sx:pt[0],sy:pt[1],moved:false,dx:0,dy:0,ids:[...sel]};
      try{$('cv').setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();return;}
    if(arm){const it=ITEMS[arm];if(!it)return;const rel=toRel(pt),id=newId();
      mut(x=>{x.items[id]={k:arm,x:snap(rel[0],e),y:snap(rel[1],e),rot:lastRot,sc:1,sx:1,sy:1,z:0,lbl:it.txt?'Texto':''};},true);
      sel=new Set([id]);draw();drawIns();e.preventDefault();return;}
    // arrastar no vazio = selecionar por retangulo
    const cv=$('cv'),b=cv.getBoundingClientRect();
    band={x0:e.clientX,y0:e.clientY,moved:false,shift:e.shiftKey,el:document.createElement('div')};band.el.className='band';cv.appendChild(band.el);
    try{cv.setPointerCapture(e.pointerId);}catch(_){}
  }
  function onMove(e){
    if(drag){const pt=toDeck(e);if(!pt)return;const dx=snap(pt[0]-drag.sx,e),dy=snap(pt[1]-drag.sy,e);
      if(dx!==drag.dx||dy!==drag.dy){drag.dx=dx;drag.dy=dy;drag.moved=true;const its=itemsOf(roomId);
        drag.ids.forEach(id=>{const el=$('cv').querySelector('[data-prop="'+id+'"]');if(el&&its[id])el.setAttribute('transform',tfFor(its[id],dx,dy));});}
      return;}
    if(band){const cv=$('cv'),b=cv.getBoundingClientRect();band.moved=band.moved||Math.hypot(e.clientX-band.x0,e.clientY-band.y0)>4;
      const l=Math.min(band.x0,e.clientX),t=Math.min(band.y0,e.clientY);
      Object.assign(band.el.style,{left:(l-b.left+cv.scrollLeft)+'px',top:(t-b.top+cv.scrollTop)+'px',width:Math.abs(e.clientX-band.x0)+'px',height:Math.abs(e.clientY-band.y0)+'px'});}
  }
  function onUp(e){
    try{$('cv').releasePointerCapture(e.pointerId);}catch(_){}
    if(drag){const d=drag;drag=null;
      if(d.moved&&(d.dx||d.dy)){mut(x=>{d.ids.forEach(id=>{const it=x.items[id];if(it){it.x=r2(num(it.x)+d.dx);it.y=r2(num(it.y)+d.dy);}});});}else{draw();}
      drawIns();return;}
    if(band){const bd=band;band=null;bd.el.remove();
      if(!bd.moved){if(!bd.shift){sel.clear();draw();drawIns();}return;}
      const a=toDeckXY(bd.x0,bd.y0),b2=toDeckXY(e.clientX,e.clientY);if(!a||!b2)return;const r=room();
      const x0=Math.min(a[0],b2[0])-r.r[0],x1=Math.max(a[0],b2[0])-r.r[0],y0=Math.min(a[1],b2[1])-r.r[1],y1=Math.max(a[1],b2[1])-r.r[1];
      const its=itemsOf(roomId),got=Object.keys(its).filter(id=>num(its[id].x)>=x0&&num(its[id].x)<=x1&&num(its[id].y)>=y0&&num(its[id].y)<=y1);
      sel=bd.shift?new Set([...sel,...got]):new Set(got);draw();drawIns();}
  }
  const toDeckXY=(cx,cy)=>toDeck({clientX:cx,clientY:cy});

  /* ---------- renderizar tudo ---------- */
  function renderAll(){drawDecks();drawRooms();drawPal();draw();drawIns();drawUR();}
  function pick(id){if(roomId===id)return;flush();roomId=id;deckId=room().deck;sel.clear();arm=null;zi=1;renderAll();$('cv').scrollTo&&$('cv').scrollTo(0,0);}

  /* ---------- eventos ---------- */
  $('decks').addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(!b)return;deckId=b.dataset.d;q='';$('rq').value='';drawDecks();drawRooms();});
  $('rq').addEventListener('input',e=>{q=e.target.value;drawRooms();});
  $('rlist').addEventListener('click',e=>{const b=e.target.closest('[data-r]');if(b)pick(b.dataset.r);});
  $('pal').addEventListener('click',e=>{const t=e.target.closest('[data-arm]');if(t){arm=arm===t.dataset.arm?null:t.dataset.arm;if(arm)sel.clear();drawPal();draw();drawIns();return;}
    const c=e.target.closest('[data-cat]');if(c){cat=c.dataset.cat;pq='';drawPal();}});
  $('pal').addEventListener('input',e=>{if(e.target.id==='pq'){pq=e.target.value;const p=e.target.selectionStart;drawPal();const n=$('pq');if(n){n.focus();n.setSelectionRange(p,p);}}});
  $('side').addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(a&&!a.disabled)act(a.dataset.a);
    if(e.target.id==='cpGo'){const from=$('cpFrom').value;if(!from||!room())return;const src=itemsOf(from),ids=[];
      mut(x=>{Object.keys(src).forEach(k=>{const id=newId();ids.push(id);x.items[id]=clone(src[k]);});});sel=new Set(ids);renderAll();}});
  $('side').addEventListener('change',e=>{
    if(e.target.id==='noeq'){mut(x=>{x.noeq=e.target.checked;});return;}
    const f=e.target.dataset&&e.target.dataset.f;if(f)setField(f,e.target.type==='checkbox'?e.target.checked:e.target.value);});
  $('side').addEventListener('input',e=>{const f=e.target.dataset&&e.target.dataset.f;if(f==='lbl'){const v=e.target.value;clearTimeout(act.t);act.t=setTimeout(()=>setField('lbl',v),300);}});
  const cv=$('cv');cv.addEventListener('pointerdown',onDown);cv.addEventListener('pointermove',onMove);cv.addEventListener('pointerup',onUp);cv.addEventListener('pointercancel',onUp);
  cv.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();zi=Math.max(.5,Math.min(8,zi*(e.deltaY<0?1.15:.87)));draw();},{passive:false});
  $('zIn').addEventListener('click',()=>{zi=Math.min(8,zi*1.3);draw();});$('zOut').addEventListener('click',()=>{zi=Math.max(.5,zi/1.3);draw();});$('zFit').addEventListener('click',()=>{zi=1;draw();});
  $('snap').addEventListener('change',e=>{snapStep=parseFloat(e.target.value)||0;});
  $('gridOn').addEventListener('change',e=>{grid=e.target.checked;draw();});
  $('prevOn').addEventListener('change',e=>{preview=e.target.checked;sel.clear();draw();drawIns();});
  $('bUndo').addEventListener('click',doUndo);$('bRedo').addEventListener('click',doRedo);
  $('bExp').addEventListener('click',()=>{flush();const out={v:1,t:Date.now(),rooms:{}};Object.keys(LAY).forEach(k=>{const w=toWrite(k);if(w)out.rooms[k]=w;});
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,1)],{type:'application/json'}));const d=new Date();a.download='salas-petroleira-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);});
  $('bImp').addEventListener('click',()=>$('fImp').click());
  $('fImp').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();
    rd.onload=()=>{try{const j=JSON.parse(rd.result),rs=j.rooms||{},ks=Object.keys(rs).filter(k=>S.roomIndex[k]);
      if(!ks.length){alert('Arquivo sem salas conhecidas.');return;}
      if(!confirm('Importar '+ks.length+' sala(s)? O layout atual dessas salas será substituído.'))return;
      undo=[];redo=[];ks.forEach(k=>{LAY[k]=rs[k];dirty.add(k);});flush();renderAll();}catch(err){alert('Arquivo inválido: '+err.message);}e.target.value='';};rd.readAsText(f);});
  addEventListener('keydown',e=>{
    if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    const k=e.key,ctl=e.ctrlKey||e.metaKey;
    if(ctl&&k.toLowerCase()==='z'){e.preventDefault();e.shiftKey?doRedo():doUndo();return;}
    if(ctl&&k.toLowerCase()==='y'){e.preventDefault();doRedo();return;}
    if(ctl&&k.toLowerCase()==='c'){if(sel.size){e.preventDefault();act('copy');}return;}
    if(ctl&&k.toLowerCase()==='v'){if(clip){e.preventDefault();act('paste');}return;}
    if(ctl&&k.toLowerCase()==='a'){e.preventDefault();act('all');return;}
    if(ctl&&k.toLowerCase()==='d'){e.preventDefault();act('dup');return;}
    if(k==='Escape'){if(arm)arm=null;else sel.clear();drawPal();draw();drawIns();return;}
    if(!sel.size)return;
    if(k==='Delete'||k==='Backspace'){e.preventDefault();act('del');}
    else if(k==='r'||k==='R'){e.preventDefault();act(e.shiftKey?'rotL':'rotR');}
    else if(k.startsWith('Arrow')){e.preventDefault();const st=e.shiftKey?1:(snapStep||.1),dx=k==='ArrowRight'?st:k==='ArrowLeft'?-st:0,dy=k==='ArrowDown'?st:k==='ArrowUp'?-st:0;
      mut(x=>{selItems().forEach(([id])=>{const it=x.items[id];it.x=r2(num(it.x)+dx);it.y=r2(num(it.y)+dy);});});}
  });
  addEventListener('resize',()=>{clearTimeout(init.rt);init.rt=setTimeout(draw,150);});
  $('tip').innerHTML='<b>Atalhos:</b> clique coloca o item escolhido · arraste move · arraste no vazio seleciona vários · <b>Shift</b> soma à seleção · <b>R</b> gira · setas movem · <b>Ctrl+C/V</b> copia e cola (inclusive em outra sala) · <b>Ctrl+D</b> duplica · <b>Delete</b> apaga · <b>Ctrl+Z/Y</b> desfaz/refaz · <b>Ctrl+roda</b> zoom · <b>Alt</b> solta a grade. Salva sozinho.';

  /* ---------- Firebase ---------- */
  layRef.on('value',s=>{const v=s.val()||{};const keep={};dirty.forEach(k=>{if(LAY[k])keep[k]=LAY[k];});
    LAY=Object.assign({},v,keep);if(drag)return;drawRooms();if(roomId&&!dirty.has(roomId)){draw();drawIns();}});
  stRef.on('value',s=>{PUB=s.val()||{};if(drag)return;drawRooms();if(roomId)draw();});
  if(window.StationLayout)SL.seedDefaults(sessionRef,S,ITEMS).catch(()=>{});
  renderAll();
  return {state:()=>({roomId,LAY,sel:[...sel]}),pick,flush};
}
window.EditorSalas={init};
})();
