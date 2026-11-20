/* ============================================================
   Terminal da estacao (estacao.html): mapa que revela, caderno, arquivos, cameras.
   Estado vem do Firebase em sessions/<SESSION>/station/*
     online, unlocked{level:true}, force, files{}, cams{}, map{rooms{},corr{},pin}, notes{}
   ============================================================ */
(function(){
const S=window.STATION,R=window.StationRender;
const CAM_DURATION=6000,CAM_COOLDOWN=60000;
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const hhmm=t=>{const d=new Date(t);return pad(d.getHours())+':'+pad(d.getMinutes());};
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};

let ref=null,STATE={},curDeck=null,selRoom=null,notesMode='shared',openFile=null,showCams=false,lastLq='lqC',view='map';
const ME=(()=>{let v=LS.get('deserto:op');if(!v){v='OP-'+(1+Math.floor(Math.random()*9));LS.set('deserto:op',v);}return v;})();
let minePrefs=[];try{minePrefs=JSON.parse(LS.get('deserto:notes','[]'));}catch(e){}

const DECK_ORDER=['weather','module','cellar'];
const INTRO={
  weather:'Open deck above the module block. Helideck, crane pedestals, lifeboats and the flare bridge. Weather permitting.',
  module:'Module deck. Clean side to the west of the firewall, process modules to the east. Fire doors held closed.',
  cellar:'Cellar deck. Cargo area, moonpool and the lower wellbay. Sea state affects the moonpool.',
  lqE:'Deck E. Heliport access and building services.',lqD:'Deck D. Communications, camera room and offices.',lqC:'Deck C. Crew dormitories. Passes through the weather deck.',
  lqB:'Deck B. Most of the corridor is closed off.',lqA:'Deck A. Mess hall, galley, lounge and infirmary.'};
const TYPE={hab:'HABITATION',ind:'INDUSTRIAL',off:'OUT OF SERVICE',ext:'OPEN DECK',stair:'STAIRWAY'};

/* ---------- niveis / decks ---------- */
const unlockedMap=()=>STATE.unlocked||{};
function isUnlocked(level){const u=unlockedMap();return !!(u[level]||Object.keys(S.LEGACY).some(k=>S.LEGACY[k]===level&&u[k]));}
const forcedLevel=()=>STATE.force?S.levelId(STATE.force):null;
const mapState=()=>STATE.map||{};
const revRooms=()=>mapState().rooms||{};
const revCorr=()=>mapState().corr||{};
function defaultDeck(level){
  if(level==='quarters'){const d=S.DECKS[lastLq];if(d&&Object.keys(revRooms()).some(k=>S.roomIndex[k]&&S.roomIndex[k].deck===lastLq))return lastLq;
    const withRev=S.LQ_ORDER.find(k=>Object.keys(revRooms()).some(r=>S.roomIndex[r]&&S.roomIndex[r].deck===k));return withRev||lastLq;}
  if(level==='sub')return 'sub';
  return level;
}
function levelOfDeck(id){return id==='sub'?'sub':S.DECK_LEVEL[id];}
function activeDeck(){
  const f=forcedLevel();
  if(f){if(curDeck&&levelOfDeck(curDeck)===f)return curDeck;return defaultDeck(f);}
  if(curDeck&&isUnlocked(levelOfDeck(curDeck)))return curDeck;
  const cnt={};Object.keys(revRooms()).forEach(k=>{const r=S.roomIndex[k];if(r)cnt[levelOfDeck(r.deck)]=(cnt[levelOfDeck(r.deck)]||0)+1;});
  const cand=S.LEVELS.filter(l=>isUnlocked(l.id)).sort((x,y)=>(cnt[y.id]||0)-(cnt[x.id]||0));return cand.length?defaultDeck(cand[0].id):null;
}

/* ---------- stack isometrico ---------- */
function stackSVG(active){
  const s=1.4,cx=148,TH=8,LIVE='#79c9b5',AMB='#d0a24f',SP=158,Y0=38;
  const P=(x,y,cy)=>[cx+(x-y)*s*.866,cy+(x+y)*s*.5];
  const ps=pts=>pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const lvlActive=active?levelOfDeck(active):null;
  const rr=revRooms(),rc=revCorr();
  const norm=(d,x,y)=>[(x-d.bbox[0])/d.bbox[2]*114,(y-d.bbox[1])/d.bbox[3]*55];
  const rectPoly=(d,r,cy)=>[[r[0],r[1]],[r[0]+r[2],r[1]],[r[0]+r[2],r[1]+r[3]],[r[0],r[1]+r[3]]].map(q=>{const n=norm(d,q[0],q[1]);return P(n[0],n[1],cy);});
  const ys=[0,1,2,3].map(i=>Y0+i*SP);
  let h='';
  [[0,0],[114,0],[114,55],[0,55]].forEach(([x,y])=>{const a=P(x,y,ys[0]),b=P(x,y,ys[3]);h+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#22373b" stroke-dasharray="3 5"/>`;});
  // escadas entre os decks revelados
  [[38,27],[86,27]].forEach(([x,y])=>{const a=P(x,y,ys[0]),b=P(x,y,ys[2]);h+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${LIVE}" stroke-width="1.2" opacity=".55"/>`;[0,1,2].forEach(i=>{const q=P(x,y,ys[i]);h+=`<rect x="${q[0]-2.6}" y="${q[1]-2.6}" width="5.2" height="5.2" fill="${LIVE}" opacity=".8"/>`;});});
  const LV=[['weather','weather'],['module','module'],['cellar','cellar']];
  LV.forEach(([lvl,deckId],i)=>{
    const lv=S.LEVELS.find(l=>l.id===lvl),sel=lvlActive===lvl,unl=isUnlocked(lvl),cy=ys[i],d=S.DECKS[deckId];
    const c=[[0,0],[114,0],[114,55],[0,55]].map(q=>P(q[0],q[1],cy));
    const top=sel?'#2a3b40':'#1b282c',s1=sel?'#16242a':'#111b1f',s2=sel?'#111d21':'#0e1619',ed=sel?LIVE:(unl?'#3b585d':'#26363a');
    let g=`<g data-lvl="${lvl}" class="${unl?'on':'lock'}" opacity="${unl?1:.5}">`;
    g+=`<polygon points="${ps([c[3],c[2],[c[2][0],c[2][1]+TH],[c[3][0],c[3][1]+TH]])}" fill="${s1}" stroke="${ed}"/><polygon points="${ps([c[1],c[2],[c[2][0],c[2][1]+TH],[c[1][0],c[1][1]+TH]])}" fill="${s2}" stroke="${ed}"/><polygon points="${ps(c)}" fill="${top}" stroke="${ed}" stroke-width="${sel?1.6:1}" ${unl?'':'stroke-dasharray="4 4"'}/>`;
    if(unl){
      d.corr.forEach(co=>{if(rc[co.id])g+=`<polygon points="${ps(rectPoly(d,co.r,cy))}" fill="#0f191d"/>`;});
      d.rooms.forEach(ro=>{if(rr[ro.id]){const off=ro.t==='off';g+=`<polygon points="${ps(rectPoly(d,ro.r,cy))}" fill="${off?'#3a3118':(sel?'#3b5359':'#2b3e43')}" stroke="${off?AMB:'#8fb5ae'}" stroke-width=".8"/>`;}});
    }
    const y=cy+30;
    g+=`<rect x="10" y="${y}" width="58" height="42" fill="${sel?LIVE:'#18252a'}" stroke="${sel?LIVE:'#3b585d'}"/><text x="17" y="${y+15}" font-family="IBM Plex Mono" font-size="10" fill="${sel?'#07110f':'#8aa8a4'}" letter-spacing=".1em">${lv.tag}</text><text x="17" y="${y+28}" font-family="Barlow Condensed" font-weight="700" font-size="11" fill="${sel?'#07110f':'#8aa8a4'}" letter-spacing=".1em">${lv.name.split(' ')[0].toUpperCase()}</text><text x="17" y="${y+38}" font-family="IBM Plex Mono" font-size="8" fill="${sel?'#07110f':'#5f7d80'}">${unl?lv.elev:'LOCKED'}</text>`;
    if(sel){const a=P(114,27.5,cy);g+=`<path d="M${a[0]+10} ${a[1]}l12 -8v16z" fill="${LIVE}"/>`;}
    h+=g+'</g>';
  });
  { // submerso: sem registro
    const lv=S.LEVELS.find(l=>l.id==='sub'),sel=lvlActive==='sub',unl=isUnlocked('sub'),cy=ys[3];
    const c=[[0,0],[114,0],[114,55],[0,55]].map(q=>P(q[0],q[1],cy));
    h+=`<g data-lvl="sub" class="${unl?'on':'lock'}" opacity="${unl?1:.5}"><polygon points="${ps(c)}" fill="#1a170f" stroke="${AMB}" stroke-dasharray="6 5"/><text x="${cx}" y="${cy+78}" text-anchor="middle" font-family="IBM Plex Mono" font-size="10" fill="${AMB}" letter-spacing=".2em">NO RECORD</text>
    <rect x="10" y="${cy+30}" width="58" height="42" fill="${sel?AMB:'#1c1910'}" stroke="${AMB}"/><text x="17" y="${cy+45}" font-family="IBM Plex Mono" font-size="10" fill="${sel?'#1c1910':AMB}">${lv.tag.replace('L-02','L-02/??')}</text><text x="17" y="${cy+58}" font-family="Barlow Condensed" font-weight="700" font-size="10.5" fill="${sel?'#1c1910':AMB}" letter-spacing=".08em">SUBMERGED</text><text x="17" y="${cy+68}" font-family="IBM Plex Mono" font-size="8" fill="${sel?'#1c1910':AMB}" opacity=".8">−40 / −260</text></g>`;
  }
  // torre de alojamento: seletor de decks
  const qy=ys[3]+150,qu=isUnlocked('quarters'),qsel=lvlActive==='quarters';
  h+=`<g data-lvl="quarters" class="${qu?'on':'lock'}"><rect x="10" y="${qy}" width="278" height="78" fill="${qsel?'#17262b':'#131f23'}" stroke="${qsel?LIVE:'#26434a'}"/><text x="20" y="${qy+16}" font-family="IBM Plex Mono" font-size="9.5" letter-spacing=".22em" fill="${qu?'#8aa8a4':'#4b6568'}">L-06 · LIVING QUARTERS ${qu?'':'· LOCKED'}</text></g>`;
  S.LQ_ORDER.forEach((id,i)=>{
    const x=20+i*52,on=qu&&active===id;
    const has=Object.keys(rr).some(k=>S.roomIndex[k]&&S.roomIndex[k].deck===id);
    h+=`<g data-deck="${id}" class="${qu?'on':'lock'}" opacity="${qu?1:.45}"><rect x="${x}" y="${qy+26}" width="46" height="40" fill="${on?LIVE:'#18252a'}" stroke="${on?LIVE:'#3b585d'}"/><text x="${x+8}" y="${qy+44}" font-family="Barlow Condensed" font-weight="700" font-size="17" fill="${on?'#07110f':'#cfe0dc'}">${id.slice(2)}</text><text x="${x+8}" y="${qy+58}" font-family="IBM Plex Mono" font-size="8" fill="${on?'#07110f':'#5f7d80'}">${S.LQ_NAMES[id].split(' · ')[1]}</text>${has&&!on?`<rect x="${x+36}" y="${qy+30}" width="5" height="5" fill="${LIVE}"/>`:''}</g>`;
  });
  return h;
}

/* ---------- renderizacao ---------- */
function surveyPct(deckId){const d=S.DECKS[deckId];if(!d)return 0;const rr=revRooms();return Math.round(d.rooms.filter(r=>rr[r.id]).length/d.rooms.length*100);}
function camsOn(){const c=STATE.cams||{},o={};Object.keys(c).forEach(k=>{if(c[k]&&c[k].on)o[k]=1;});return o;}
let planH=500;
function renderPlan(deckId){
  const wrap=$('planwrap');
  const d=S.DECKS[deckId];
  if(!d){
    const h=deckId==='sub'?'NO SURVEY DATA':'NO DECK SELECTED';
    wrap.innerHTML=`<div style="height:440px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;letter-spacing:.3em;color:#6b6d68;line-height:1.6;text-align:center">${h}<br><span style="font-size:10px;letter-spacing:.12em;opacity:.7">${deckId==='sub'?'structure below the waterline is not in the schematic':'select an unlocked level'}</span></div>`;
    planH=442;return;}
  const pin=mapState().pin;
  const st={rooms:revRooms(),corr:revCorr(),pin:pin&&pin.deck===deckId?pin:null,sel:selRoom,showCams,camsOn:camsOn()};
  const p=R.plan(d,st,{W:810,maxH:500,id:'pl'});
  wrap.innerHTML=p.svg;planH=p.h+2;
}
function layoutBottom(){
  const top=54+planH+12,h=810-top-12-28-10;
  [$('pRecord'),$('pFiles')].forEach((e,i)=>{e.style.top=top+'px';e.style.height=h+'px';e.style.width='399px';e.style.left=(12+i*411)+'px';});
}
function renderRecord(deckId){
  const d=S.DECKS[deckId],b=$('recBody');
  if(!d){b.innerHTML=`<div class="none">No survey data.</div>`;$('recTag').textContent='—';return;}
  const r=selRoom&&S.roomIndex[selRoom]&&S.roomIndex[selRoom].deck===deckId&&revRooms()[selRoom]?S.roomIndex[selRoom]:null;
  if(r){const parts=r.n.split(' · '),code=/^M\d+$/.test(parts[0])?parts[0]:r.id.toUpperCase();
    $('recTag').textContent=code;
    const stat=r.st==='sealed'?['SEALED · LOTO','w']:(r.t==='off'?['OFFLINE','w']:['NOMINAL','']);
    b.innerHTML=`<div class="kv"><i>NAME</i><span>${esc(r.n.toUpperCase())}</span></div><div class="kv"><i>TYPE</i><span>${TYPE[r.t]||'—'}</span></div><div class="kv"><i>AREA</i><span>${Math.round(r.r[2]*r.r[3])} m²</span></div><div class="kv"><i>DECK</i><span>${esc(d.lvl)} · ${esc(d.elev)}</span></div><div class="kv"><i>STATUS</i><span class="${stat[1]}">${stat[0]}</span></div><div class="kv"><i>EXITS</i><span>${(r.d||[]).length||'—'}</span></div>`;
  }else{
    const rooms=d.rooms.filter(x=>revRooms()[x.id]).length;
    $('recTag').textContent=d.lvl;
    b.innerHTML=`<div class="kv"><i>DECK</i><span>${esc(d.name.toUpperCase())}</span></div><div class="kv"><i>ELEVATION</i><span>${esc(d.elev)}</span></div><div class="kv"><i>SURVEYED</i><span>${rooms} / ${d.rooms.length} ROOMS</span></div><div style="padding:12px;font-size:11.5px;line-height:1.55;color:var(--ink-dim)">Select a surveyed room on the plan to read its record.</div>`;
  }
}
function filesForLevel(level){
  const F=STATE.files||{};
  return Object.keys(F).filter(k=>S.levelId(F[k].level)===level&&F[k].available).sort((a,b)=>(F[a].at||0)-(F[b].at||0));
}
function renderFiles(deckId){
  const lvl=deckId?levelOfDeck(deckId):null,b=$('fileBody');
  $('fileTag').textContent=lvl?(S.LEVELS.find(l=>l.id===lvl)||{}).tag||'—':'—';
  if(!lvl){b.innerHTML=`<div class="none">No node selected.</div>`;return;}
  const keys=filesForLevel(lvl),F=STATE.files||{};
  b.innerHTML=keys.length?keys.map(k=>`<div class="fitem" data-k="${k}"><span class="ic">▤ FILE</span><span class="ti">${esc(F[k].title||'Untitled')}</span><span class="ar">→</span></div>`).join(''):`<div class="none">No files available on this node.</div>`;
}
function inline(t){t=t.replace(/\[\[(.+?)\]\]/g,(m,p)=>`<span class="redacted">${p}</span>`);return t.replace(/\*(.+?)\*/g,(m,p)=>`<em>${p}</em>`);}
function renderDocBody(raw){return esc(raw||'').split(/\n\s*\n/).map(bl=>{const l=bl.trim();if(!l)return '';if(/^##\s+/.test(l))return `<h3>${inline(l.replace(/^##\s+/,''))}</h3>`;return `<p>${inline(l.replace(/\n/g,' '))}</p>`;}).join('');}
function renderDoc(){
  const ov=$('docov'),F=STATE.files||{};
  if(openFile&&F[openFile]&&F[openFile].available){$('dochead').textContent='FILE // '+esc((F[openFile].title||'').toUpperCase());$('docbody').innerHTML=`<h2>${esc(F[openFile].title||'FILE')}</h2><div class="doc">${renderDocBody(F[openFile].body)}</div>`;ov.classList.add('on');}
  else{openFile=null;ov.classList.remove('on');}
}
function renderCard(deckId){
  const d=S.DECKS[deckId],c=$('ncard');
  const tapes=`<div class="tape" style="left:-28px;top:6px;transform:rotate(-40deg)"></div><div class="tape" style="right:-26px;top:4px;transform:rotate(38deg)"></div>`;
  const r=d&&selRoom&&S.roomIndex[selRoom]&&S.roomIndex[selRoom].deck===deckId&&revRooms()[selRoom]?S.roomIndex[selRoom]:null;
  if(r){const area=Math.round(r.r[2]*r.r[3]);const at=revRooms()[selRoom];
    const pr=r.n.split(" · ");const code=/^Md+$/.test(pr[0])?pr[0]:r.id.toUpperCase();
    c.innerHTML=`${tapes}<div class="k"><span>${esc(code)} · ${area} m²</span><span>${typeof at==='object'&&at&&at.at?'surveyed '+hhmm(at.at):'surveyed'}</span></div><h4>${esc(r.n.toUpperCase())}</h4><p>${esc(r.pub||'')}</p>`;
  }else if(d){
    c.innerHTML=`${tapes}<div class="k"><span>${esc(d.lvl)} · ${esc(d.elev)}</span><span>${surveyPct(deckId)}% surveyed</span></div><h4>${esc(d.name.toUpperCase())}</h4><p>${esc(INTRO[deckId]||'')} Select a room on the plan to read it.</p>`;
  }else{
    c.innerHTML=`${tapes}<div class="k"><span>NO NODE</span><span></span></div><h4>NO DATA</h4><p>Nothing has been surveyed on this level.</p>`;
  }
}
/* ---------- caderno ---------- */
function notesList(){
  if(notesMode==='mine')return minePrefs.map((n,i)=>Object.assign({key:'m'+i},n)).sort((a,b)=>a.at-b.at);
  const N=STATE.notes||{};return Object.keys(N).map(k=>Object.assign({key:k},N[k])).sort((a,b)=>(a.at||0)-(b.at||0));
}
function renderNotes(){
  const L=notesList(),box=$('nbl');
  const atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<40;
  const html=L.map(n=>{const mine=notesMode==='mine'||n.by===ME;const rt=n.r&&S.roomIndex[n.r]?`<span class="rt">${esc((S.roomIndex[n.r].n.split(' · ')[0]).toUpperCase().slice(0,10))}</span>`:'';
    return `<div class="l ${mine?'me':'other'}"><small>${hhmm(n.at||Date.now())}${notesMode==='shared'&&n.by?' '+esc(n.by):''}</small>${esc(n.t)}${rt}${mine?`<i class="x" data-k="${esc(n.key)}">✕</i>`:''}</div>`;}).join('');
  const typing=document.activeElement&&document.activeElement.id==='ninp';const val=typing?document.activeElement.value:'';
  box.innerHTML=html+`<input class="ninp" id="ninp" placeholder="${L.length?'':'write a note…'}" maxlength="240" autocomplete="off" spellcheck="false">`;
  const inp=$('ninp');if(typing){inp.value=val;inp.focus();}
  if(atBottom||!typing)box.scrollTop=box.scrollHeight;
  $('ncount').textContent=L.length?L.length+(L.length===1?' note':' notes'):'empty';
  $('nmShared').classList.toggle('on',notesMode==='shared');$('nmMine').classList.toggle('on',notesMode==='mine');
  $('nbSub').textContent=notesMode==='shared'?'shared with team':'only on this device';
  $('nbl').parentNode.querySelector('.nstamp').style.opacity=0;
}
function addNote(t){
  t=t.trim();if(!t)return;
  const room=selRoom&&S.roomIndex[selRoom]&&revRooms()[selRoom]?selRoom:null;
  const n={t,at:Date.now(),by:ME};if(room)n.r=room;
  if(notesMode==='mine'){minePrefs.push(n);LS.set('deserto:notes',JSON.stringify(minePrefs));renderNotes();}
  else ref.child('station/notes').push(n);
}

function renderStatic(){
  const online=!!STATE.online;
  $('standby').style.display=online?'none':'flex';
  $('terminal').className=online?'on':'';
}
function renderAll(){
  renderStatic();
  const deck=activeDeck();
  if(deck!==curDeck&&!forcedLevel()){curDeck=deck;}
  const shown=forcedLevel()?deck:curDeck;
  if(shown&&shown.startsWith&&shown.startsWith('lq'))lastLq=shown;
  const unl=S.LEVELS.filter(l=>isUnlocked(l.id)).length;
  $('stackcount').textContent=unl+' / '+S.LEVELS.length+' LEVELS';
  $('stack').innerHTML=stackSVG(shown);
  renderPlan(shown);layoutBottom();renderRecord(shown);renderFiles(shown);renderDoc();renderCard(shown);
  const forced=forcedLevel();
  const pct=shown&&S.DECKS[shown]?surveyPct(shown):0,seg=Math.round(pct/12.5);
  $('topinfo').innerHTML=(forced?`<span class="forced">▲ DIRECTED VIEW</span>`:'')+`SURVEYED <span class="seg2" style="margin-left:6px">${'<i></i>'.repeat(seg)}${'<i class="o"></i>'.repeat(8-seg)}</span><span style="color:var(--live)">${pct}%</span>`;
  $('btnCctv').className='btn'+(showCams?' on':'');
  const tk=STATE.ticker&&STATE.ticker.length?STATE.ticker:['COMM SYNC +7d','L-02 PRESSURE ELEVATED','DRE SECTOR: NO RECORD'];
  $('ticker').innerHTML='<b>▲ WARNING</b>'+tk.map(t=>`<span>${esc(t)}</span>`).join('');
  renderNotes();renderCameras();
}

/* ---------- cameras ---------- */
function buildCams(){
  const g=$('camgrid');g.innerHTML='';
  S.CAMERAS.forEach(c=>{const d=document.createElement('div');d.className='camcard off';d.dataset.id=c.id;
    d.innerHTML=`<div class="camtop"><span class="cl">${c.label}</span><span class="cs">OFFLINE</span></div><div class="thumb"><div style="text-align:center"><div class="label">${esc(c.loc)}</div><div class="cd"></div></div></div>`;g.appendChild(d);});
}
function renderCameras(){
  const cams=STATE.cams||{},now=Date.now();
  document.querySelectorAll('.camcard').forEach(card=>{
    const c=cams[card.dataset.id]||{},isOn=!!c.on,pulledAt=c.pulledAt||0,cool=isOn&&(now-pulledAt<CAM_COOLDOWN);
    card.classList.toggle('off',!isOn);card.classList.toggle('on',isOn&&!cool);card.classList.toggle('cooldown',cool);
    const cs=card.querySelector('.cs'),cd=card.querySelector('.cd');
    if(!isOn){cs.textContent='OFFLINE';cd.textContent='';}
    else if(cool){cs.textContent='REACQUIRING';cd.textContent='SIGNAL LOST · '+Math.ceil((CAM_COOLDOWN-(now-pulledAt))/1000)+'s';}
    else{cs.textContent='● LIVE';cd.textContent='';}});
}
function playCamera(id){
  const meta=S.CAMERAS.find(c=>c.id===id)||{label:'CAM',loc:'—'};
  $('camlabel').textContent=meta.label;$('camloc').textContent=meta.loc;
  const feed=$('camfeed'),frame=$('camframe');feed.classList.add('on');frame.classList.remove('dropping');
  clearTimeout(window._camTimer);window._camTimer=setTimeout(()=>{frame.classList.add('dropping');setTimeout(()=>feed.classList.remove('on'),480);},CAM_DURATION);
}

/* ---------- escala da cena ---------- */
function fit(){const s=Math.min(innerWidth/1600,innerHeight/1000);$('scene').style.transform='scale('+s+')';}
function barcode(){let s=5,x=0,h='';for(let i=0;i<34;i++){s=(s*16807)%2147483647;const w=1+(s%3);h+=`<i style="left:${x}px;width:${w}px"></i>`;x+=w+1+(s>>3)%2;}$('barcode').innerHTML=`<span class="bc" style="width:${x}px">${h}</span>`;}

function setTab(t){view=t;document.querySelectorAll('.tab2').forEach(x=>x.classList.toggle('on',x.dataset.tab===t));$('view-map').style.display=t==='map'?'block':'none';$('view-cams').style.display=t==='cams'?'block':'none';}

function start(sessionRef){
  ref=sessionRef;
  barcode();buildCams();fit();addEventListener('resize',fit);
  $('vent').innerHTML='<i></i>'.repeat(26);
  document.querySelectorAll('.tab2').forEach(t=>t.addEventListener('click',()=>setTab(t.dataset.tab)));
  addEventListener('keydown',e=>{if(e.key==='F1'){e.preventDefault();setTab('map');}else if(e.key==='F2'){e.preventDefault();setTab('cams');}else if(e.key==='Escape'&&openFile){openFile=null;renderDoc();}});
  $('stack').addEventListener('click',e=>{
    const dk=e.target.closest('[data-deck]');
    if(dk&&dk.classList.contains('on')){curDeck=dk.dataset.deck;selRoom=null;renderAll();return;}
    const lv=e.target.closest('[data-lvl]');if(!lv||lv.classList.contains('lock'))return;
    if(forcedLevel())return;
    curDeck=defaultDeck(lv.dataset.lvl);selRoom=null;renderAll();});
  $('planwrap').addEventListener('click',e=>{const r=e.target.closest('[data-room]');selRoom=r&&revRooms()[r.dataset.room]?r.dataset.room:null;
    const deck=forcedLevel()?activeDeck():curDeck;renderPlan(deck);renderRecord(deck);renderCard(deck);});
  $('btnCctv').addEventListener('click',()=>{showCams=!showCams;renderAll();});
  $('fileBody').addEventListener('click',e=>{const f=e.target.closest('.fitem');if(f){openFile=f.dataset.k;renderDoc();}});
  $('docback').addEventListener('click',()=>{openFile=null;renderDoc();});
  $('nmShared').addEventListener('click',()=>{notesMode='shared';renderNotes();});
  $('nmMine').addEventListener('click',()=>{notesMode='mine';renderNotes();});
  $('nbl').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='ninp'){const v=e.target.value;e.target.value='';addNote(v);e.preventDefault();}});
  $('nbl').addEventListener('click',e=>{const x=e.target.closest('.x');if(!x)return;
    if(notesMode==='mine'){const i=+x.dataset.k.slice(1);const arr=notesList();const tgt=arr.find(n=>n.key===x.dataset.k);if(tgt){minePrefs=minePrefs.filter(n=>!(n.at===tgt.at&&n.t===tgt.t));LS.set('deserto:notes',JSON.stringify(minePrefs));renderNotes();}}
    else ref.child('station/notes/'+x.dataset.k).remove();});
  $('camgrid').addEventListener('click',e=>{
    const card=e.target.closest('.camcard');if(!card)return;const id=card.dataset.id,c=(STATE.cams||{})[id]||{};
    if(!c.on)return;const now=Date.now();if(now-(c.pulledAt||0)<CAM_COOLDOWN)return;
    ref.child('station/cams/'+id+'/pulledAt').set(now);playCamera(id);});
  let seenPulls={};
  ref.child('station/cams').on('value',snap=>{const cams=snap.val()||{},now=Date.now();
    Object.keys(cams).forEach(id=>{const p=cams[id]&&cams[id].pulledAt;if(!p||seenPulls[id]===p)return;seenPulls[id]=p;if(now-p<CAM_DURATION)playCamera(id);});renderCameras();});
  ref.child('station').on('value',snap=>{STATE=snap.val()||{};
    const un=unlockedMap();if(curDeck&&!isUnlocked(levelOfDeck(curDeck))){curDeck=null;selRoom=null;}
    if(openFile&&!(STATE.files&&STATE.files[openFile]&&STATE.files[openFile].available))openFile=null;
    renderAll();});
  setInterval(renderCameras,1000);
  setInterval(()=>{const t=new Date().toTimeString().slice(0,8);const c=$('clock'),tc=$('camtc');if(c)c.textContent=t;if(tc)tc.textContent=t;},1000);
  renderAll();
}
window.StationApp={start,_state:()=>STATE,_render:renderAll};
})();
