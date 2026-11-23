/* ============================================================
   Painel do Guardiao — aba MAPA: revelar salas/corredores (com desfazer), destacar sala pra mesa,
   busca de salas, pino "voce esta aqui", texto do Guardiao por sala (station-gm-data.js),
   descricao publica editavel ao vivo e caderno dos jogadores.
   ============================================================ */
(function(){
const S=window.STATION,R=window.StationRender,GMD=(window.STATION_GM||{text:{}}).text;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const hhmm=t=>{const d=new Date(t);return pad(d.getHours())+':'+pad(d.getMinutes());};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

function init(sessionRef){
  const ref=sessionRef.child('station'),gmRef=sessionRef.child('gm/mapnotes');
  const root=document.getElementById('tab-mapa');if(!root)return;
  let ST={},deck='module',sel=null,pinMode=false,neigh=true,GMN={},lastP=null,mouse=null;
  const hist=[]; // pilha de desfazer: {label, inv}

  root.innerHTML=`
  <div class="card">
    <div class="hd"><div class="name"><b>MAPA</b> // revelação</div><div style="display:flex;gap:8px;align-items:center"><button class="btn" id="mpUndo" disabled style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">↶ DESFAZER</button><div class="power" id="mpPin"><span class="led"></span><span id="mpPinTxt">POSICIONAR PINO</span></div></div></div>
    <div class="hint">Clique numa <b>sala</b> ou <b>corredor</b> pra revelar ou ocultar pros jogadores. Revelar sala também revela o corredor onde ela abre (desligue abaixo).
      <b>Shift+clique</b> só seleciona, sem mudar nada. <b>P</b> coloca o pino "você está aqui" onde o mouse estiver. Salas apagadas no desenho ainda não foram reveladas; o que está sólido eles já veem. <b>Ctrl+Z</b> desfaz a última revelação.</div>
    <div id="mpDecks" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px;position:relative">
      <a class="btn" href="editor-salas.html" target="_blank" title="Abre o editor de salas (monta o interior de cada sala e salva sozinho)" style="text-decoration:none">EDITOR DE SALAS ↗</a><button class="btn" id="mpMode" title="Alterna entre revelar o mapa e customizar as salas com props">MODO: REVELAR</button><button class="btn" id="mpAll">REVELAR DECK INTEIRO</button><button class="btn" id="mpNone">OCULTAR DECK</button><button class="btn" id="mpVeilAll" title="Cobre o conteúdo de TODAS as salas reveladas, em todos os decks: os jogadores veem cada sala só com o nome centralizado. Clique de novo pra descobrir.">COBRIR O MAPA</button><button class="btn" id="mpPinClr">TIRAR PINO</button>
      <input id="mpSearch" type="text" placeholder="buscar sala (nome ou código)…" autocomplete="off" style="flex:1;min-width:200px;background:var(--bg);border:1px solid var(--line);border-radius:4px;color:var(--ink);font-family:inherit;font-size:12px;padding:7px 10px">
      <label style="font-size:11px;color:var(--ink-dim);letter-spacing:.06em;display:flex;gap:6px;align-items:center"><input type="checkbox" id="mpNeigh" checked> corredor vizinho junto</label>
      <div id="mpResults" style="display:none;position:absolute;left:0;right:0;top:100%;z-index:20;background:var(--panel2);border:1px solid var(--live-dim);border-radius:4px;max-height:260px;overflow:auto"></div>
    </div>
    <div id="mpPlan" style="border:1px solid var(--line);background:#d9d6ca;line-height:0;overflow:auto"></div>
    <div id="mpProps" style="display:none;margin-top:14px"></div>
    <div id="mpSel" style="margin-top:14px"></div>
  </div>
  <div class="card">
    <div class="hd"><div class="name"><b>AVISO</b> // faixa vermelha no terminal</div><span id="mpTkSt" style="font-size:10px;letter-spacing:.1em;color:var(--ink-dim)"></span></div>
    <div class="hint">Uma linha por aviso. Aparece em vermelho na base do mapa dos jogadores, na hora. Apagar todas as linhas ou <b>REMOVER AVISO</b> esconde a faixa.</div>
    <textarea id="mpTk" rows="3" style="width:100%;background:var(--panel2);border:1px solid var(--live-dim);border-radius:4px;color:var(--ink);font-family:inherit;font-size:13px;line-height:1.6;padding:10px 12px;resize:vertical"></textarea>
    <div style="display:flex;gap:8px;margin-top:8px"><button class="btn" id="mpTkOff">REMOVER AVISO</button><button class="btn" id="mpTkDef">RESTAURAR PADRÃO</button></div>
  </div>
  <div class="card">
    <div class="hd"><div class="name dim">CADERNO // <b>notas dos jogadores</b></div><button class="btn" id="mpNotesClr">apagar todas</button></div>
    <div id="mpNotes" style="display:flex;flex-direction:column;gap:6px"></div>
  </div>`;
  const $=id=>document.getElementById(id);
  let PR=null;

  /* ---- migracao dos ids antigos de nivel (helipad/control/mess/drill) ---- */
  ref.once('value').then(snap=>{const v=snap.val()||{},upd={};
    Object.keys(S.LEGACY).forEach(old=>{const nw=S.LEGACY[old];
      if(v.unlocked&&v.unlocked[old]){upd['unlocked/'+nw]=true;upd['unlocked/'+old]=null;}
      if(v.force===old){upd['force']=nw;}
      Object.keys(v.files||{}).forEach(k=>{if(v.files[k].level===old)upd['files/'+k+'/level']=nw;});});
    if(Object.keys(upd).length)ref.update(upd);});

  /* faixa de aviso: sem registro = padrao; 'off' = escondida; senao a lista que o Guardiao escreveu */
  const TK_DEF=['COMM SYNC +7d','L-02 PRESSURE ELEVATED'];
  const tkList=()=>{const t=ST.ticker;if(t==='off')return [];if(t&&typeof t==='object')return Object.values(t).filter(x=>typeof x==='string'&&x.trim());return TK_DEF;};
  function drawTicker(){const ta=$('mpTk');if(!ta)return;if(document.activeElement!==ta)ta.value=tkList().join('\n');const off=ST.ticker==='off';$('mpTkOff').classList.toggle('is-on',off);$('mpTkOff').textContent=off?'AVISO REMOVIDO — LIGAR DE NOVO':'REMOVER AVISO';}
  const revRooms=()=>(ST.map&&ST.map.rooms)||{},revCorr=()=>(ST.map&&ST.map.corr)||{};
  /* grava uma revelacao guardando o inverso pra poder desfazer */
  function apply(upd,label){
    const inv={};
    Object.keys(upd).forEach(p=>{if(p==='map/veilAll'){inv[p]=(ST.map&&ST.map.veilAll)?true:null;return;}const m=p.match(/^map\/(rooms|corr|props|noeq)\/(.+)$/);if(!m)return;const cur=((ST.map&&ST.map[m[1]])||{})[m[2]];inv[p]=cur===undefined?null:cur;});
    if(Object.keys(inv).length){hist.push({label,inv});if(hist.length>60)hist.shift();}
    ref.update(upd);drawUndo();
  }
  function undo(){const h=hist.pop();if(!h)return;(h.root==='s'?sessionRef:ref).update(h.inv);drawUndo();}
  const pushHist=h=>{hist.push(h);if(hist.length>60)hist.shift();drawUndo();};
  function drawUndo(){const b=$('mpUndo');if(!b)return;const h=hist[hist.length-1];b.disabled=!h;b.textContent=h?'↶ DESFAZER: '+h.label:'↶ DESFAZER';}
  function corrOfDoors(r){const d=S.DECKS[r.deck],[x,y,w,h]=r.r,out=[];
    (r.d||[]).forEach(([s,t,k,to])=>{if(to!=='c')return;
      const p=s==='n'?[x+w*t,y-.7]:s==='s'?[x+w*t,y+h+.7]:s==='w'?[x-.7,y+h*t]:[x+w+.7,y+h*t];
      const c=d.corr.find(c=>p[0]>c.r[0]&&p[0]<c.r[0]+c.r[2]&&p[1]>c.r[1]&&p[1]<c.r[1]+c.r[3]);if(c)out.push(c.id);});
    return out;}
  const veilAllOn=()=>!!(ST.map&&ST.map.veilAll);
  const layUpd=(id,on,upd,vl)=>{if(PR)Object.assign(upd,PR.layoutUpd(id,on,vl));};
  /* revela uma sala (com o mapa coberto, ela entra so com o nome: o layout nao e publicado) */
  function revealKeys(id,upd){upd['map/rooms/'+id]={at:Date.now()};layUpd(id,true,upd);}
  function roomUpd(id,upd){const r=S.roomIndex[id];if(!revRooms()[id]){revealKeys(id,upd);if(neigh)corrOfDoors(r).forEach(c=>{if(!revCorr()[c])upd['map/corr/'+c]=true;});}return upd;}
  function toggleRoom(id){
    const r=S.roomIndex[id],on=!!revRooms()[id],upd={};
    if(on){upd['map/rooms/'+id]=null;layUpd(id,false,upd);}else roomUpd(id,upd);
    apply(upd,(on?'ocultou ':'revelou ')+r.n);}
  /* cobrir vale pro mapa inteiro: tira os itens publicados de todas as salas reveladas e volta a publicar quando descobre */
  function toggleVeilAll(){const on=!veilAllOn(),upd={};
    upd['map/veilAll']=on?true:null;upd['map/veil']=null;
    Object.keys(revRooms()).forEach(id=>{if(S.roomIndex[id])layUpd(id,!on,upd,on);});
    apply(upd,on?'cobriu o mapa inteiro':'descobriu o mapa inteiro');}
  function drawVeilBtn(){const b=$('mpVeilAll');if(!b)return;const on=veilAllOn();b.textContent=on?'MAPA COBERTO — DESCOBRIR':'COBRIR O MAPA';b.classList.toggle('is-on',on);}
  function toggleCorr(id){const c=S.corrIndex[id],ids=c&&c.g?S.DECKS[c.deck].corr.filter(x=>x.g===c.g).map(x=>x.id):[id],on=!!revCorr()[id],upd={};ids.forEach(k=>{upd['map/corr/'+k]=on?null:true;});apply(upd,(on?'ocultou ':'revelou ')+'corredor '+(c.n||c.id));}

  const curDesc=r=>{const d=ST.map&&ST.map.desc;return d&&typeof d[r.id]==='string'&&d[r.id].trim()?d[r.id]:(r.pub||'');};
  function drawDecks(){
    const rr=revRooms();
    $('mpDecks').innerHTML=Object.keys(S.DECKS).map(id=>{const d=S.DECKS[id],n=d.rooms.filter(r=>rr[r.id]).length;
      return `<button class="btn view-btn${id===deck?' is-on':''}" data-d="${id}">${esc(d.lvl)} · ${esc(d.name.replace('Living quarters · ','LQ '))} <span style="opacity:.6">${n}/${d.rooms.length}</span></button>`;}).join('');
  }
  function camsOn(){const c=ST.cams||{},o={};Object.keys(c).forEach(k=>{if(c[k]&&c[k].on)o[k]=1;});return o;}
  function drawPlan(){
    const d=S.DECKS[deck],pin=ST.map&&ST.map.pin;
    if(PR&&PR.dragging())return;
    drawVeilBtn();
    const st={rooms:revRooms(),corr:revCorr(),ghost:true,pin:pin&&pin.deck===deck?pin:null,sel,showCams:true,camsOn:camsOn(),props:PR?PR.list(deck):null,veilAll:veilAllOn()};
    const p=R.plan(d,st,{W:PR&&PR.active()?PR.width():800,maxH:PR&&PR.active()?99999:560,id:'gm'});lastP=p;$('mpPlan').innerHTML=p.svg;
    $('mpPlan').querySelectorAll('[data-room],[data-corr]').forEach(e=>{e.style.cursor=pinMode?'crosshair':(PR&&PR.active()?(PR.armed()?'copy':'default'):'pointer');});
  }
  function drawSel(){
    const box=$('mpSel');
    if(!sel){box.innerHTML=`<div style="font-size:11px;color:var(--ink-dim)">Nenhuma sala selecionada.</div>`;return;}
    const r=S.roomIndex[sel];if(!r){box.innerHTML='';return;}
    const on=!!revRooms()[sel],g=GMD[sel];
    const bl=g?g.b.map(x=>`<li style="margin-bottom:3px">${esc(x)}</li>`).join(''):'';
    box.innerHTML=`
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
      <div style="font-size:14px;color:var(--ink)">${esc(r.n)} <span style="font-size:10px;color:var(--ink-dim);letter-spacing:.1em">${esc(r.id)} · ${Math.round(r.r[2]*r.r[3])} m² · ${esc(S.DECKS[r.deck].lvl)}</span></div>
      <div style="margin-left:auto;display:flex;gap:8px;align-items:center"><span id="mpFocusSt" style="font-size:10px;color:var(--live);letter-spacing:.1em"></span><button class="btn" id="mpFocus" title="Revela a sala (se estiver oculta) e leva a atenção de todos os terminais até ela, com um pulso">DESTACAR PRA MESA</button><button class="btn lock${on?' is-on':''}" id="mpTog">${on?'REVELADA — OCULTAR':'OCULTA — REVELAR'}</button></div></div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px"><div style="font-size:10px;letter-spacing:.2em;color:var(--ink-dim)">O QUE OS JOGADORES LEEM <span style="color:var(--live)">· edita ao vivo</span></div><span id="mpDescSt" style="font-size:10px;letter-spacing:.1em;color:var(--ink-dim);margin-left:auto"></span><button class="btn" id="mpDescRst" style="padding:3px 9px;font-size:10px">restaurar padrão</button></div>
    <textarea id="mpDesc" style="width:100%;min-height:96px;background:var(--panel2);border:1px solid var(--live-dim);border-radius:4px;color:var(--ink);font-family:inherit;font-size:13px;line-height:1.6;padding:10px 12px;resize:vertical;margin-bottom:12px">${esc(curDesc(r))}</textarea>
    <div style="font-size:10px;letter-spacing:.2em;color:${g&&g.p?'var(--live)':'var(--ink-dim)'};margin-bottom:5px">DESCRIÇÃO DO GUARDIÃO ${g?(g.p?'· PARADA DO TOUR':'· SÓ PASSA NA FRENTE'):''}</div>
    <div style="font-size:12.5px;background:var(--panel2);border:1px solid ${g&&g.p?'var(--live-dim)':'var(--line)'};border-radius:4px;padding:10px 12px 8px 26px;margin-bottom:12px;line-height:1.55"><ul style="margin:0">${bl||'<li style="list-style:none;margin-left:-14px;color:var(--ink-dim)">sem texto cadastrado</li>'}</ul></div>
    <div style="font-size:10px;letter-spacing:.2em;color:var(--ink-dim);margin-bottom:5px">SUAS NOTAS (só você vê)</div>
    <textarea id="mpGmNote" style="width:100%;min-height:80px;background:var(--bg);border:1px solid var(--line);border-radius:4px;color:var(--ink);font-family:inherit;font-size:13px;padding:8px 10px;resize:vertical" placeholder="Props, quem está aqui, o que muda por ato.">${esc(GMN[sel]||'')}</textarea>`;
    $('mpTog').addEventListener('click',()=>toggleRoom(sel));
    $('mpFocus').addEventListener('click',()=>{const id=sel,upd={};if(!revRooms()[id])roomUpd(id,upd);upd['map/focus']={room:id,at:Date.now()};
      const revealing=!!upd['map/rooms/'+id];if(revealing)apply(Object.assign({},upd),'revelou e destacou '+S.roomIndex[id].n);else ref.update(upd);
      $('mpFocusSt').textContent='✓ na tela da mesa';setTimeout(()=>{const x=$('mpFocusSt');if(x)x.textContent='';},2200);});
    let dt;$('mpDesc').addEventListener('input',e=>{clearTimeout(dt);const v=e.target.value,id=sel,rr=S.roomIndex[id];$('mpDescSt').textContent='salvando…';dt=setTimeout(()=>{const dflt=(rr.pub||'').trim();ref.child('map/desc/'+id).set(v.trim()&&v.trim()!==dflt?v:null).then(()=>{$('mpDescSt').textContent='✓ no ar';setTimeout(()=>{const x=$('mpDescSt');if(x)x.textContent='';},1400);});},450);});
    $('mpDescRst').addEventListener('click',()=>{ref.child('map/desc/'+sel).remove();$('mpDesc').value=S.roomIndex[sel].pub||'';});
    let tm;$('mpGmNote').addEventListener('input',e=>{clearTimeout(tm);const v=e.target.value,id=sel;tm=setTimeout(()=>gmRef.child(id).set(v||null),500);});
  }
  function drawNotes(){
    const N=ST.notes||{},ks=Object.keys(N).sort((a,b)=>(N[a].at||0)-(N[b].at||0)),b=$('mpNotes');
    b.innerHTML=ks.length?ks.map(k=>{const n=N[k],rt=n.r&&S.roomIndex[n.r]?` <span style="color:var(--warn);font-size:10px">[${esc(S.roomIndex[n.r].n)}]</span>`:'';
      return `<div class="doc"><span class="dl" style="min-width:74px">${hhmm(n.at||0)} ${esc(n.by||'')}</span><span class="dt" style="color:var(--ink)">${esc(n.t)}${rt}</span><button class="del" data-k="${k}">apagar</button></div>`;}).join(''):`<div style="color:var(--ink-dim);opacity:.6;font-size:12px">Os jogadores ainda não escreveram nada.</div>`;
  }
  function drawAll(){drawDecks();drawPlan();drawSel();drawNotes();drawUndo();
    $('mpPin').classList.toggle('on',pinMode);$('mpPinTxt').textContent=pinMode?'CLIQUE NO MAPA…':'POSICIONAR PINO';}

  /* ---- busca de salas ---- */
  function search(q){
    const box=$('mpResults');q=norm(q).trim();
    if(!q){box.style.display='none';return;}
    const hits=Object.values(S.roomIndex).filter(r=>norm(r.n).includes(q)||norm(r.id).includes(q)).slice(0,10);
    box.innerHTML=hits.length?hits.map(r=>`<div data-id="${esc(r.id)}" style="padding:8px 12px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:10px"><span style="color:var(--ink)">${esc(r.n)}</span><span style="color:var(--ink-dim);font-size:10px;letter-spacing:.1em">${esc(S.DECKS[r.deck].lvl)} · ${revRooms()[r.id]?'<b style="color:var(--live)">revelada</b>':'oculta'}</span></div>`).join(''):`<div style="padding:10px 12px;font-size:12px;color:var(--ink-dim)">Nenhuma sala encontrada.</div>`;
    box.style.display='block';
  }

  /* ---- eventos ---- */
  $('mpDecks').addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(!b)return;deck=b.dataset.d;sel=null;drawAll();});
  $('mpPlan').addEventListener('click',e=>{
    if(PR&&PR.active())return;
    const svg=$('mpPlan').querySelector('svg');if(!svg||!lastP)return;
    if(pinMode){const b=svg.getBoundingClientRect(),k=lastP.w/b.width;const [x,y]=lastP.toDeck((e.clientX-b.left)*k,(e.clientY-b.top)*k);
      ref.child('map/pin').set({deck,x:Math.round(x*10)/10,y:Math.round(y*10)/10,at:Date.now()});pinMode=false;drawAll();return;}
    const room=e.target.closest('[data-room]'),corr=e.target.closest('[data-corr]');
    if(room){sel=room.dataset.room;if(!e.shiftKey)toggleRoom(sel);else drawAll();}
    else if(corr){if(!e.shiftKey)toggleCorr(corr.dataset.corr);}
    else {sel=null;drawAll();}
    if(room)drawSel();});
  $('mpPin').addEventListener('click',()=>{pinMode=!pinMode;drawAll();});
  function pinAt(cx,cy){const svg=$('mpPlan').querySelector('svg');if(!svg||!lastP)return false;const b=svg.getBoundingClientRect();if(cx<b.left||cx>b.right||cy<b.top||cy>b.bottom)return false;
    const k=lastP.w/b.width,[x,y]=lastP.toDeck((cx-b.left)*k,(cy-b.top)*k);ref.child('map/pin').set({deck,x:Math.round(x*10)/10,y:Math.round(y*10)/10,at:Date.now()});return true;}
  $('mpPlan').addEventListener('mousemove',e=>{mouse={x:e.clientX,y:e.clientY};});$('mpPlan').addEventListener('mouseleave',()=>{mouse=null;});
  addEventListener('keydown',e=>{if((e.key==='p'||e.key==='P')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&root.classList.contains('active')&&!(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))){
    e.preventDefault();if(mouse&&pinAt(mouse.x,mouse.y)){const t=$('mpPinTxt');t.textContent='PINO POSICIONADO ✓';setTimeout(()=>{if($('mpPinTxt'))$('mpPinTxt').textContent=pinMode?'CLIQUE NO MAPA…':'POSICIONAR PINO';},1400);}else{pinMode=!pinMode;drawAll();}}});
  $('mpPinClr').addEventListener('click',()=>ref.child('map/pin').remove());
  $('mpNeigh').addEventListener('change',e=>{neigh=e.target.checked;});
  $('mpVeilAll').addEventListener('click',toggleVeilAll);
  $('mpAll').addEventListener('click',()=>{const d=S.DECKS[deck],upd={};d.rooms.forEach(r=>{if(!revRooms()[r.id])revealKeys(r.id,upd);});d.corr.forEach(c=>{if(!revCorr()[c.id])upd['map/corr/'+c.id]=true;});apply(upd,'revelou o deck inteiro');});
  $('mpNone').addEventListener('click',()=>{if(!confirm('Ocultar todo o deck dos jogadores? (dá pra desfazer com Ctrl+Z)'))return;const d=S.DECKS[deck],upd={};d.rooms.forEach(r=>{if(revRooms()[r.id]){upd['map/rooms/'+r.id]=null;layUpd(r.id,false,upd);}});d.corr.forEach(c=>{if(revCorr()[c.id])upd['map/corr/'+c.id]=null;});apply(upd,'ocultou o deck');});
  $('mpUndo').addEventListener('click',undo);
  addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&root.classList.contains('active')&&!(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))){e.preventDefault();undo();}});
  $('mpSearch').addEventListener('input',e=>search(e.target.value));
  $('mpSearch').addEventListener('keydown',e=>{if(e.key==='Escape'){e.target.value='';search('');}});
  $('mpResults').addEventListener('click',e=>{const it=e.target.closest('[data-id]');if(!it)return;const r=S.roomIndex[it.dataset.id];deck=r.deck;sel=r.id;$('mpSearch').value='';search('');drawAll();});
  $('mpNotes').addEventListener('click',e=>{const k=e.target.dataset&&e.target.dataset.k;if(k&&e.target.classList.contains('del'))ref.child('notes/'+k).remove();});
  $('mpNotesClr').addEventListener('click',()=>{if(confirm('Apagar todas as notas dos jogadores?'))ref.child('notes').remove();});

  if(window.GuardiaoProps){PR=window.GuardiaoProps.create({sessionRef,S,R,$,getDeck:()=>deck,getST:()=>ST,getLastP:()=>lastP,redraw:drawPlan,pushHist});PR.bind();
    $('mpMode').addEventListener('click',()=>{const on=!PR.active();PR.setActive(on);$('mpPlan').style.maxHeight=on?'640px':'';$('mpMode').textContent=on?'MODO: PROPS':'MODO: REVELAR';$('mpMode').classList.toggle('is-on',on);$('mpSel').style.display=on?'none':'';drawPlan();});}
  else $('mpMode').style.display='none';
  if(window.StationLayout&&window.StationProps)window.StationLayout.seedDefaults(sessionRef,S,window.StationProps.items).catch(()=>{});
  /* nao reescreve o painel da sala enquanto o Guardiao digita nele */
  let tkT;$('mpTk').addEventListener('input',e=>{clearTimeout(tkT);const v=e.target.value;$('mpTkSt').textContent='salvando…';tkT=setTimeout(()=>{const L=v.split('\n').map(x=>x.trim()).filter(Boolean);ref.child('ticker').set(L.length?L:'off').then(()=>{$('mpTkSt').textContent='✓ no ar';setTimeout(()=>{const x=$('mpTkSt');if(x)x.textContent='';},1400);});},450);});
  $('mpTkOff').addEventListener('click',()=>{if(ST.ticker==='off')ref.child('ticker').remove();else ref.child('ticker').set('off');});
  $('mpTkDef').addEventListener('click',()=>{ref.child('ticker').remove();$('mpTk').blur();});
  ref.on('value',snap=>{ST=snap.val()||{};drawTicker();const ae=document.activeElement;if(ae&&$('mpSel')&&$('mpSel').contains(ae)){drawDecks();drawPlan();drawNotes();return;}drawAll();});
  gmRef.on('value',snap=>{GMN=snap.val()||{};if(!sel)return;const ta=$('mpGmNote');if(ta&&document.activeElement!==ta)ta.value=GMN[sel]||'';});
  drawAll();
}
window.GuardiaoMap={init};
})();
