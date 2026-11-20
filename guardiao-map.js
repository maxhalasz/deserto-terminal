/* ============================================================
   Painel do Guardiao — aba MAPA: revelar salas/corredores, pino "voce esta aqui",
   texto do Guardiao por sala (station-gm-data.js) e caderno dos jogadores.
   ============================================================ */
(function(){
const S=window.STATION,R=window.StationRender,GMD=(window.STATION_GM||{text:{}}).text;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const hhmm=t=>{const d=new Date(t);return pad(d.getHours())+':'+pad(d.getMinutes());};

function init(sessionRef){
  const ref=sessionRef.child('station'),gmRef=sessionRef.child('gm/mapnotes');
  const root=document.getElementById('tab-mapa');if(!root)return;
  let ST={},deck='module',sel=null,pinMode=false,neigh=true,GMN={},lastP=null;

  root.innerHTML=`
  <div class="card">
    <div class="hd"><div class="name"><b>MAPA</b> // revelação</div><div class="power" id="mpPin"><span class="led"></span><span id="mpPinTxt">POSICIONAR PINO</span></div></div>
    <div class="hint">Clique numa <b>sala</b> ou <b>corredor</b> pra revelar ou ocultar pros jogadores. Revelar sala também revela o corredor onde ela abre (desligue abaixo).
      <b>Shift+clique</b> só seleciona, sem mudar nada. Salas apagadas no desenho ainda não foram reveladas; o que está sólido eles já veem.</div>
    <div id="mpDecks" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
      <button class="btn" id="mpAll">REVELAR DECK INTEIRO</button><button class="btn" id="mpNone">OCULTAR DECK</button><button class="btn" id="mpPinClr">TIRAR PINO</button>
      <label style="font-size:11px;color:var(--ink-dim);letter-spacing:.06em;margin-left:auto;display:flex;gap:6px;align-items:center"><input type="checkbox" id="mpNeigh" checked> revelar corredor vizinho junto</label>
    </div>
    <div id="mpPlan" style="border:1px solid var(--line);background:#d9d6ca;line-height:0;overflow:auto"></div>
    <div id="mpSel" style="margin-top:14px"></div>
  </div>
  <div class="card">
    <div class="hd"><div class="name dim">CADERNO // <b>notas dos jogadores</b></div><button class="btn" id="mpNotesClr">apagar todas</button></div>
    <div id="mpNotes" style="display:flex;flex-direction:column;gap:6px"></div>
  </div>`;
  const $=id=>document.getElementById(id);

  /* ---- migracao dos ids antigos de nivel (helipad/control/mess/drill) ---- */
  ref.once('value').then(snap=>{const v=snap.val()||{},upd={};
    Object.keys(S.LEGACY).forEach(old=>{const nw=S.LEGACY[old];
      if(v.unlocked&&v.unlocked[old]){upd['unlocked/'+nw]=true;upd['unlocked/'+old]=null;}
      if(v.force===old){upd['force']=nw;}
      Object.keys(v.files||{}).forEach(k=>{if(v.files[k].level===old)upd['files/'+k+'/level']=nw;});});
    if(Object.keys(upd).length)ref.update(upd);});

  const revRooms=()=>(ST.map&&ST.map.rooms)||{},revCorr=()=>(ST.map&&ST.map.corr)||{};
  function corrOfDoors(r){const d=S.DECKS[r.deck],[x,y,w,h]=r.r,out=[];
    (r.d||[]).forEach(([s,t,k,to])=>{if(to!=='c')return;
      const p=s==='n'?[x+w*t,y-.7]:s==='s'?[x+w*t,y+h+.7]:s==='w'?[x-.7,y+h*t]:[x+w+.7,y+h*t];
      const c=d.corr.find(c=>p[0]>c.r[0]&&p[0]<c.r[0]+c.r[2]&&p[1]>c.r[1]&&p[1]<c.r[1]+c.r[3]);if(c)out.push(c.id);});
    return out;}
  function toggleRoom(id){
    const r=S.roomIndex[id],on=!!revRooms()[id],upd={};
    if(on)upd['map/rooms/'+id]=null;else{upd['map/rooms/'+id]={at:Date.now()};if(neigh)corrOfDoors(r).forEach(c=>{if(!revCorr()[c])upd['map/corr/'+c]=true;});}
    ref.update(upd);}
  function toggleCorr(id){const c=S.corrIndex[id],ids=c&&c.g?S.DECKS[c.deck].corr.filter(x=>x.g===c.g).map(x=>x.id):[id],on=!!revCorr()[id],upd={};ids.forEach(k=>{upd['map/corr/'+k]=on?null:true;});ref.update(upd);}

  const curDesc=r=>{const d=ST.map&&ST.map.desc;return d&&typeof d[r.id]==='string'&&d[r.id].trim()?d[r.id]:(r.pub||'');};
  function drawDecks(){
    const rr=revRooms();
    $('mpDecks').innerHTML=Object.keys(S.DECKS).map(id=>{const d=S.DECKS[id],n=d.rooms.filter(r=>rr[r.id]).length;
      return `<button class="btn view-btn${id===deck?' is-on':''}" data-d="${id}">${esc(d.lvl)} · ${esc(d.name.replace('Living quarters · ','LQ '))} <span style="opacity:.6">${n}/${d.rooms.length}</span></button>`;}).join('');
  }
  function camsOn(){const c=ST.cams||{},o={};Object.keys(c).forEach(k=>{if(c[k]&&c[k].on)o[k]=1;});return o;}
  function drawPlan(){
    const d=S.DECKS[deck],pin=ST.map&&ST.map.pin;
    const st={rooms:revRooms(),corr:revCorr(),ghost:true,pin:pin&&pin.deck===deck?pin:null,sel,showCams:true,camsOn:camsOn()};
    const p=R.plan(d,st,{W:800,maxH:560,id:'gm'});lastP=p;$('mpPlan').innerHTML=p.svg;
    $('mpPlan').querySelectorAll('[data-room],[data-corr]').forEach(e=>{e.style.cursor=pinMode?'crosshair':'pointer';});
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
      <button class="btn lock${on?' is-on':''}" id="mpTog" style="margin-left:auto">${on?'REVELADA — OCULTAR':'OCULTA — REVELAR'}</button></div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px"><div style="font-size:10px;letter-spacing:.2em;color:var(--ink-dim)">O QUE OS JOGADORES LEEM <span style="color:var(--live)">· edita ao vivo</span></div><span id="mpDescSt" style="font-size:10px;letter-spacing:.1em;color:var(--ink-dim);margin-left:auto"></span><button class="btn" id="mpDescRst" style="padding:3px 9px;font-size:10px">restaurar padrão</button></div>
    <textarea id="mpDesc" style="width:100%;min-height:96px;background:var(--panel2);border:1px solid var(--live-dim);border-radius:4px;color:var(--ink);font-family:inherit;font-size:13px;line-height:1.6;padding:10px 12px;resize:vertical;margin-bottom:12px">${esc(curDesc(r))}</textarea>
    <div style="font-size:10px;letter-spacing:.2em;color:${g&&g.p?'var(--live)':'var(--ink-dim)'};margin-bottom:5px">DESCRIÇÃO DO GUARDIÃO ${g?(g.p?'· PARADA DO TOUR':'· SÓ PASSA NA FRENTE'):''}</div>
    <div style="font-size:12.5px;background:var(--panel2);border:1px solid ${g&&g.p?'var(--live-dim)':'var(--line)'};border-radius:4px;padding:10px 12px 8px 26px;margin-bottom:12px;line-height:1.55"><ul style="margin:0">${bl||'<li style="list-style:none;margin-left:-14px;color:var(--ink-dim)">sem texto cadastrado</li>'}</ul></div>
    <div style="font-size:10px;letter-spacing:.2em;color:var(--ink-dim);margin-bottom:5px">SUAS NOTAS (só você vê)</div>
    <textarea id="mpGmNote" style="width:100%;min-height:80px;background:var(--bg);border:1px solid var(--line);border-radius:4px;color:var(--ink);font-family:inherit;font-size:13px;padding:8px 10px;resize:vertical" placeholder="Props, quem está aqui, o que muda por ato.">${esc(GMN[sel]||'')}</textarea>`;
    $('mpTog').addEventListener('click',()=>toggleRoom(sel));
    let dt;$('mpDesc').addEventListener('input',e=>{clearTimeout(dt);const v=e.target.value,id=sel,rr=S.roomIndex[id];$('mpDescSt').textContent='salvando…';dt=setTimeout(()=>{const dflt=(rr.pub||'').trim();ref.child('map/desc/'+id).set(v.trim()&&v.trim()!==dflt?v:null).then(()=>{$('mpDescSt').textContent='✓ no ar';setTimeout(()=>{const x=$('mpDescSt');if(x)x.textContent='';},1400);});},450);});
    $('mpDescRst').addEventListener('click',()=>{ref.child('map/desc/'+sel).remove();$('mpDesc').value=S.roomIndex[sel].pub||'';});
    let tm;$('mpGmNote').addEventListener('input',e=>{clearTimeout(tm);const v=e.target.value,id=sel;tm=setTimeout(()=>gmRef.child(id).set(v||null),500);});
  }
  function drawNotes(){
    const N=ST.notes||{},ks=Object.keys(N).sort((a,b)=>(N[a].at||0)-(N[b].at||0)),b=$('mpNotes');
    b.innerHTML=ks.length?ks.map(k=>{const n=N[k],rt=n.r&&S.roomIndex[n.r]?` <span style="color:var(--warn);font-size:10px">[${esc(S.roomIndex[n.r].n)}]</span>`:'';
      return `<div class="doc"><span class="dl" style="min-width:74px">${hhmm(n.at||0)} ${esc(n.by||'')}</span><span class="dt" style="color:var(--ink)">${esc(n.t)}${rt}</span><button class="del" data-k="${k}">apagar</button></div>`;}).join(''):`<div style="color:var(--ink-dim);opacity:.6;font-size:12px">Os jogadores ainda não escreveram nada.</div>`;
  }
  function drawAll(){drawDecks();drawPlan();drawSel();drawNotes();
    $('mpPin').classList.toggle('on',pinMode);$('mpPinTxt').textContent=pinMode?'CLIQUE NO MAPA…':'POSICIONAR PINO';}

  /* ---- eventos ---- */
  $('mpDecks').addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(!b)return;deck=b.dataset.d;sel=null;drawAll();});
  $('mpPlan').addEventListener('click',e=>{
    const svg=$('mpPlan').querySelector('svg');if(!svg||!lastP)return;
    if(pinMode){const b=svg.getBoundingClientRect(),k=lastP.w/b.width;const [x,y]=lastP.toDeck((e.clientX-b.left)*k,(e.clientY-b.top)*k);
      ref.child('map/pin').set({deck,x:Math.round(x*10)/10,y:Math.round(y*10)/10,at:Date.now()});pinMode=false;drawAll();return;}
    const room=e.target.closest('[data-room]'),corr=e.target.closest('[data-corr]');
    if(room){sel=room.dataset.room;if(!e.shiftKey)toggleRoom(sel);else drawAll();}
    else if(corr){if(!e.shiftKey)toggleCorr(corr.dataset.corr);}
    else {sel=null;drawAll();}
    if(room)drawSel();});
  $('mpPin').addEventListener('click',()=>{pinMode=!pinMode;drawAll();});
  $('mpPinClr').addEventListener('click',()=>ref.child('map/pin').remove());
  $('mpNeigh').addEventListener('change',e=>{neigh=e.target.checked;});
  $('mpAll').addEventListener('click',()=>{const d=S.DECKS[deck],upd={};d.rooms.forEach(r=>{if(!revRooms()[r.id])upd['map/rooms/'+r.id]={at:Date.now()};});d.corr.forEach(c=>{upd['map/corr/'+c.id]=true;});ref.update(upd);});
  $('mpNone').addEventListener('click',()=>{if(!confirm('Ocultar todo o deck dos jogadores?'))return;const d=S.DECKS[deck],upd={};d.rooms.forEach(r=>upd['map/rooms/'+r.id]=null);d.corr.forEach(c=>upd['map/corr/'+c.id]=null);ref.update(upd);});
  $('mpNotes').addEventListener('click',e=>{const k=e.target.dataset&&e.target.dataset.k;if(k&&e.target.classList.contains('del'))ref.child('notes/'+k).remove();});
  $('mpNotesClr').addEventListener('click',()=>{if(confirm('Apagar todas as notas dos jogadores?'))ref.child('notes').remove();});

  ref.on('value',snap=>{ST=snap.val()||{};const ta=document.getElementById('mpDesc');if(ta&&document.activeElement===ta){drawDecks();drawPlan();drawNotes();return;}drawAll();});
  gmRef.on('value',snap=>{GMN=snap.val()||{};if(!sel)return;const ta=$('mpGmNote');if(ta&&document.activeElement!==ta)ta.value=GMN[sel]||'';});
  drawAll();
}
window.GuardiaoMap={init};
})();
