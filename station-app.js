/* ============================================================
   Terminal da estacao (estacao.html): mapa que revela (zoom, pan, animacoes), caderno, cameras.
   Estado vem do Firebase em sessions/<SESSION>/station/*
     online, unlocked{level:true}, force, cams{}, map{rooms{},corr{},pin,desc{sala:texto}}, notes{}
   ============================================================ */
(function(){
const S=window.STATION,R=window.StationRender;
const CAM_DURATION=6000,CAM_COOLDOWN=60000;
const PW=850,PH=664; // tamanho do painel do mapa
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
const REDUCED=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

let ref=null,STATE={},curDeck=null,selRoom=null,notesMode='shared',showCams=false,lastLq='lqC',view=null,viewKey='',plan=null,dragMoved=false;
let prevRev=null,lastPlanDeck='',seenNotes=null,cardKey='',typeTok=0,lastPinKey='';
let prevProps=null,lastSig={stack:'',plan:'',notes:''},focusToken='',focusPulsed='',lastFocusAt=0,viewAnim=0,wasOnline=null,forceFit=false;
const pointers=new Map();let pinch=null;
const ME=(()=>{let v=LS.get('deserto:op');if(!v){v='OP-'+Math.random().toString(36).slice(2,5).toUpperCase();LS.set('deserto:op',v);}return v;})();
let minePrefs=[];try{minePrefs=JSON.parse(LS.get('deserto:notes','[]'));}catch(e){}

/* ---------- niveis / decks ---------- */
const unlockedMap=()=>STATE.unlocked||{};
function isUnlocked(level){const u=unlockedMap();return !!(u[level]||Object.keys(S.LEGACY).some(k=>S.LEGACY[k]===level&&u[k]));}
const forcedLevel=()=>{const f=STATE.force?S.levelId(STATE.force):null;return f&&S.LEVELS.some(l=>l.id===f)?f:null;};
const mapState=()=>STATE.map||{};
const revRooms=()=>mapState().rooms||{};
const revCorr=()=>mapState().corr||{};
const descOf=r=>{const d=mapState().desc;return d&&typeof d[r.id]==='string'&&d[r.id].trim()?d[r.id]:(r.pub||'');};
function defaultDeck(level){
  if(level==='quarters'){const has=k=>Object.keys(revRooms()).some(r=>S.roomIndex[r]&&S.roomIndex[r].deck===k);if(has(lastLq))return lastLq;return S.LQ_ORDER.find(has)||lastLq;}
  return level;
}
const levelOfDeck=id=>S.DECK_LEVEL[id];
function activeDeck(){
  const f=forcedLevel();
  if(f){if(curDeck&&levelOfDeck(curDeck)===f)return curDeck;return defaultDeck(f);}
  if(curDeck&&isUnlocked(levelOfDeck(curDeck)))return curDeck;
  const cnt={};Object.keys(revRooms()).forEach(k=>{const r=S.roomIndex[k];if(r)cnt[levelOfDeck(r.deck)]=(cnt[levelOfDeck(r.deck)]||0)+1;});
  const cand=S.LEVELS.filter(l=>isUnlocked(l.id)).sort((x,y)=>(cnt[y.id]||0)-(cnt[x.id]||0));return cand.length?defaultDeck(cand[0].id):null;
}

/* ---------- stack isometrico ---------- */
function stackSVG(active){
  const s=1.4,cx=148,TH=8,LIVE='#79c9b5',SP=186,Y0=44;
  const P=(x,y,cy)=>[cx+(x-y)*s*.866,cy+(x+y)*s*.5];
  const ps=pts=>pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const lvlActive=active?levelOfDeck(active):null;
  const rr=revRooms(),rc=revCorr();
  const norm=(d,x,y)=>[(x-d.bbox[0])/d.bbox[2]*114,(y-d.bbox[1])/d.bbox[3]*55];
  const rectPoly=(d,r,cy)=>[[r[0],r[1]],[r[0]+r[2],r[1]],[r[0]+r[2],r[1]+r[3]],[r[0],r[1]+r[3]]].map(q=>{const n=norm(d,q[0],q[1]);return P(n[0],n[1],cy);});
  const ys=[0,1,2].map(i=>Y0+i*SP);
  let h='';
  [[0,0],[114,0],[114,55],[0,55]].forEach(([x,y])=>{const a=P(x,y,ys[0]),b=P(x,y,ys[2]);h+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#22373b" stroke-dasharray="3 5"/>`;});
  [[38,27],[86,27]].forEach(([x,y])=>{const a=P(x,y,ys[0]),b=P(x,y,ys[2]);h+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${LIVE}" stroke-width="1.2" opacity=".55"/>`;[0,1,2].forEach(i=>{const q=P(x,y,ys[i]);h+=`<rect x="${q[0]-2.6}" y="${q[1]-2.6}" width="5.2" height="5.2" fill="${LIVE}" opacity=".8"/>`;});});
  ['weather','module','cellar'].forEach((lvl,i)=>{
    const lv=S.LEVELS.find(l=>l.id===lvl),sel=lvlActive===lvl,unl=isUnlocked(lvl),cy=ys[i],d=S.DECKS[lvl];
    const c=[[0,0],[114,0],[114,55],[0,55]].map(q=>P(q[0],q[1],cy));
    const top=sel?'#2a3b40':'#1b282c',s1=sel?'#16242a':'#111b1f',s2=sel?'#111d21':'#0e1619',ed=sel?LIVE:(unl?'#3b585d':'#26363a');
    let g=`<g data-lvl="${lvl}" class="${unl?'on':'lock'}" opacity="${unl?1:.5}">`;
    g+=`<polygon points="${ps([c[3],c[2],[c[2][0],c[2][1]+TH],[c[3][0],c[3][1]+TH]])}" fill="${s1}" stroke="${ed}"/><polygon points="${ps([c[1],c[2],[c[2][0],c[2][1]+TH],[c[1][0],c[1][1]+TH]])}" fill="${s2}" stroke="${ed}"/><polygon points="${ps(c)}" fill="${top}" stroke="${ed}" stroke-width="${sel?1.6:1}" ${unl?'':'stroke-dasharray="4 4"'}/>`;
    if(unl){
      d.corr.forEach(co=>{if(rc[co.id])g+=`<polygon class="sx" points="${ps(rectPoly(d,co.r,cy))}" fill="${co.open?'#1a2a2d':'#0f191d'}"/>`;});
      d.rooms.forEach(ro=>{if(rr[ro.id]){const off=ro.t==='off';g+=`<polygon class="sx" points="${ps(rectPoly(d,ro.r,cy))}" fill="${off?'#3a3118':(sel?'#3b5359':'#2b3e43')}" stroke="${off?'#d0a24f':'#8fb5ae'}" stroke-width=".8"/>`;}});
    }
    const y=cy+34;
    g+=`<rect x="10" y="${y}" width="66" height="46" fill="${sel?LIVE:'#18252a'}" stroke="${sel?LIVE:'#3b585d'}"/><text x="17" y="${y+15}" font-family="IBM Plex Mono" font-size="10" fill="${sel?'#07110f':'#8aa8a4'}" letter-spacing=".1em">${lv.tag}</text><text x="17" y="${y+28}" font-family="Barlow Condensed" font-weight="700" font-size="11.5" fill="${sel?'#07110f':'#8aa8a4'}" letter-spacing=".1em">${lv.name.split(' ')[0].toUpperCase()}</text><text x="17" y="${y+40}" font-family="IBM Plex Mono" font-size="8.5" fill="${sel?'#07110f':'#5f7d80'}">${unl?lv.elev:'LOCKED'}</text>`;
    if(sel){const a=P(114,27.5,cy);g+=`<path d="M${a[0]+10} ${a[1]}l12 -8v16z" fill="${LIVE}"/>`;}
    h+=g+'</g>';
  });
  // torre de alojamento: seletor de decks
  const qy=ys[2]+150,qu=isUnlocked('quarters'),qsel=lvlActive==='quarters';
  h+=`<g data-lvl="quarters" class="${qu?'on':'lock'}"><rect x="10" y="${qy}" width="278" height="92" fill="${qsel?'#17262b':'#131f23'}" stroke="${qsel?LIVE:'#26434a'}"/><text x="20" y="${qy+16}" font-family="IBM Plex Mono" font-size="9.5" letter-spacing=".22em" fill="${qu?'#8aa8a4':'#4b6568'}">L-06 · LIVING QUARTERS</text>${qu?'':`<text x="278" y="${qy+16}" text-anchor="end" font-family="IBM Plex Mono" font-size="8.5" fill="#4b6568">LOCKED</text>`}</g>`;
  S.LQ_ORDER.forEach((id,i)=>{
    const x=20+i*52,on=qu&&active===id;
    h+=`<g data-deck="${id}" class="${qu?'on':'lock'}" opacity="${qu?1:.45}"><rect x="${x}" y="${qy+26}" width="46" height="54" fill="${on?LIVE:'#18252a'}" stroke="${on?LIVE:'#3b585d'}"/><text x="${x+8}" y="${qy+44}" font-family="Barlow Condensed" font-weight="700" font-size="17" fill="${on?'#07110f':'#cfe0dc'}">${id.slice(2)}</text><text x="${x+8}" y="${qy+57}" font-family="IBM Plex Mono" font-size="8" fill="${on?'#07110f':'#5f7d80'}">${S.LQ_NAMES[id].split(' · ')[1]}</text></g>`;
  });
  return h;
}

/* ---------- mapa: render, enquadramento, zoom, pan e animacoes ---------- */
function camsOn(){const c=STATE.cams||{},o={};Object.keys(c).forEach(k=>{if(c[k]&&c[k].on)o[k]=1;});return o;}
function revealedBox(d){
  const rr=revRooms(),rc=revCorr();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,n=0;
  const eat=r=>{x0=Math.min(x0,r[0]);y0=Math.min(y0,r[1]);x1=Math.max(x1,r[0]+r[2]);y1=Math.max(y1,r[1]+r[3]);n++;};
  d.rooms.forEach(r=>{if(rr[r.id])eat(r.r);});d.corr.forEach(c=>{if(rc[c.id])eat(c.r);});
  if(!n)return {box:d.bbox.slice(),n:0};
  return {box:[x0-4,y0-5,x1-x0+8,y1-y0+10],n};
}
function fitView(d,p){
  const rb=revealedBox(d),b=rb.box;
  let w=Math.max(b[2],62),h=Math.max(b[3],w*PH/PW*.55);
  const cxm=b[0]+b[2]/2,cym=b[1]+b[3]/2;
  if(w/h<PW/PH)w=h*PW/PH;else h=w*PH/PW;
  return {x:p.ox+(cxm-w/2)*p.px,y:p.oy+(cym-h/2)*p.px,w:w*p.px,h:h*p.px};
}
function setView(tg,animate){
  cancelAnimationFrame(viewAnim);
  if(!animate||REDUCED||!view){view=tg;applyView();return;}
  const a={x:view.x,y:view.y,w:view.w,h:view.h},t0=performance.now(),D=650;
  (function f(now){const k=Math.min(1,(now-t0)/D),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    view={x:a.x+(tg.x-a.x)*e,y:a.y+(tg.y-a.y)*e,w:a.w+(tg.w-a.w)*e,h:a.h+(tg.h-a.h)*e};applyView();
    if(k<1)viewAnim=requestAnimationFrame(f);})(t0);
}
function outsideView(r){if(!view||!plan)return true;const x=plan.ox+r[0]*plan.px,y=plan.oy+r[1]*plan.px,w=r[2]*plan.px,h=r[3]*plan.px;return x<view.x+8||y<view.y+8||x+w>view.x+view.w-8||y+h>view.y+view.h-8;}
function applyView(){const svg=$('planwrap').querySelector('svg.cur');if(svg&&view)svg.setAttribute('viewBox',`${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`);}
function zoomAt(f,sx,sy){
  if(!view)return;const nw=Math.max(PW/9,Math.min(view.w/f,plan?plan.w*2:99999)),k=nw/view.w,nh=view.h*k;
  const fx=sx/PW,fy=sy/PH;view={x:view.x+(view.w-nw)*fx,y:view.y+(view.h-nh)*fy,w:nw,h:nh};applyView();}
function renderPlan(deckId){
  const wrap=$('planwrap'),d=S.DECKS[deckId];
  if(!d){plan=null;view=null;wrap.innerHTML=`<div style="height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;letter-spacing:.3em;color:#6b6d68;line-height:1.7;text-align:center">NO LEVEL SELECTED<br><span style="font-size:10px;letter-spacing:.12em;opacity:.7">select an unlocked level</span></div>`;lastPlanDeck='';return;}
  const pin=mapState().pin;
  const PRP=mapState().props||{},prSig=Object.keys(PRP).sort().map(k=>k+':'+PRP[k].x+','+PRP[k].y+','+PRP[k].rot+','+PRP[k].sc+','+(PRP[k].lbl||'')).join(';');
  const sig=[deckId,Object.keys(revRooms()).sort().join(),Object.keys(revCorr()).sort().join(),pin&&pin.deck===deckId?pin.x+','+pin.y:'',selRoom,showCams,Object.keys(camsOn()).join(),focusToken,prSig].join('|');
  if(sig===lastSig.plan&&wrap.querySelector('svg.cur')&&!forceFit)return;
  lastSig.plan=sig;
  const st={rooms:revRooms(),corr:revCorr(),pin:pin&&pin.deck===deckId?pin:null,sel:selRoom,showCams,camsOn:camsOn(),props:Object.keys(PRP).map(k=>Object.assign({id:k},PRP[k]))};
  plan=R.plan(d,st,{W:Math.round(d.bbox[2]*7+84),maxH:99999,id:'pl',key:false});
  // o que acabou de ser revelado neste deck
  const cur={rooms:new Set(Object.keys(revRooms()).filter(k=>S.roomIndex[k]&&S.roomIndex[k].deck===deckId)),corr:new Set(Object.keys(revCorr()).filter(k=>S.corrIndex[k]&&S.corrIndex[k].deck===deckId))};
  const sameDeck=lastPlanDeck===deckId&&prevRev;
  const nr=sameDeck?[...cur.rooms].filter(k=>!prevRev.rooms.has(k)):[],nc=sameDeck?[...cur.corr].filter(k=>!prevRev.corr.has(k)):[];
  const changed=nr.length||nc.length,deckChanged=lastPlanDeck!==deckId;
  const oldHTML=wrap.querySelector('svg.cur')?wrap.innerHTML:'';
  wrap.innerHTML=plan.svg;
  const svg=wrap.querySelector('svg');svg.removeAttribute('width');svg.removeAttribute('height');svg.removeAttribute('style');svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.classList.add('cur');
  const key=deckId+'|'+cur.rooms.size+'|'+cur.corr.size;
  if(key!==viewKey||forceFit){const tg=fitView(d,plan);
    if(deckChanged||!view)view=tg;
    else if(forceFit)setView(tg,true);
    else if([...nr.map(k=>S.roomIndex[k].r),...nc.map(k=>S.corrIndex[k].r)].some(outsideView))setView(tg,true);
    viewKey=key;forceFit=false;}
  applyView();
  // brilho nos elementos novos
  const add=(r)=>{const x=plan.ox+r[0]*plan.px,y=plan.oy+r[1]*plan.px;const e=document.createElementNS('http://www.w3.org/2000/svg','rect');e.setAttribute('class','pulse');e.setAttribute('x',x-2);e.setAttribute('y',y-2);e.setAttribute('width',r[2]*plan.px+4);e.setAttribute('height',r[3]*plan.px+4);svg.appendChild(e);};
  const propNow=new Set(plan.props||[]);if(prevProps&&lastPlanDeck===deckId){propNow.forEach(id=>{if(prevProps.has(id))return;const p=PRP[id];if(!p)return;const rr=Math.max(p.w||1,p.h||1)*(p.sc||1)/2+.5;const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('class','pulse');c.setAttribute('cx',plan.ox+p.x*plan.px);c.setAttribute('cy',plan.oy+p.y*plan.px);c.setAttribute('r',rr*plan.px);svg.appendChild(c);});}
  prevProps=propNow;
  nr.forEach(k=>add(S.roomIndex[k].r));nc.forEach(k=>add(S.corrIndex[k].r));
  if(focusToken&&focusPulsed!==focusToken){const fr=S.roomIndex[focusToken.split('|')[0]];if(fr&&fr.deck===deckId){add(fr.r);svg.lastChild.setAttribute('class','pulse long');}focusPulsed=focusToken;}
  if(!REDUCED){
    if(changed&&oldHTML){ // o desenho antigo fica por baixo e o novo aparece por cima
      svg.classList.add('fresh');const old=document.createElement('div');old.className='oldplan';old.innerHTML=oldHTML.replace('class="cur"','class="gone"');wrap.insertBefore(old,wrap.firstChild);
      const g=old.querySelector('svg');if(g){g.removeAttribute('width');g.removeAttribute('height');g.classList.remove('cur');}
      setTimeout(()=>{if(old.parentNode)old.remove();},1100);
    }else if(deckChanged){svg.classList.add('fresh');}
  }
  prevRev=cur;lastPlanDeck=deckId;
}
function renderKey(){
  const T=R.T,it=[
    [`<svg width="26" height="8"><path d="M0 4H20" stroke="${T.route}" stroke-width="2.4"/><path d="M18 0L26 4L18 8z" fill="${T.route}"/></svg>`,'Escape route'],
    [`<svg width="12" height="12"><rect x=".5" y=".5" width="11" height="11" fill="${T.room}" stroke="${T.wall}"/><path d="M2 10H4.5V7.5H7V5H9V2.5H10" fill="none" stroke="${T.route}"/></svg>`,'Stairs'],
    [`<svg width="12" height="10"><rect width="12" height="10" fill="#1b1d1f"/><path d="M0 10L10 0M4 10L14 0M-4 10L6 0" stroke="${T.hazard}" stroke-width="2.4"/></svg>`,'Fire door'],
    [`<svg width="8" height="8"><rect width="8" height="8" fill="${T.fire}"/></svg>`,'Extinguisher'],
    [`<svg width="12" height="10"><rect width="12" height="10" fill="${T.sealBg}" stroke="${T.wall}"/><path d="M0 10L10 0M4 10L14 0" stroke="${T.amber}" stroke-width="2"/></svg>`,'Sealed']];
  $('planKey').innerHTML=it.map(x=>`<i>${x[0]}${x[1]}</i>`).join('');
}
function renderRecord(deckId){
  const d=S.DECKS[deckId];
  const r=d&&selRoom&&S.roomIndex[selRoom]&&S.roomIndex[selRoom].deck===deckId&&revRooms()[selRoom]?S.roomIndex[selRoom]:null;
  const nm=$('recName'),st=$('recStat');
  if(r){nm.textContent=r.n;st.textContent=r.st==='sealed'?'LOCKED':'UNLOCKED';st.className='stat '+(r.st==='sealed'?'lock':'open');}
  else{nm.textContent=d?d.name:'—';st.textContent='';st.className='stat';}
}
/* digita o texto do cartao como maquina de escrever */
function typeInto(el,text){
  const tok=++typeTok;
  if(REDUCED||!text){el.textContent=text;return;}
  el.textContent='';const caret=document.createElement('span');caret.className='caret';caret.textContent='▌';
  let i=0;const step=Math.max(6,Math.min(16,1500/text.length));
  (function tick(){if(tok!==typeTok)return;i=Math.min(text.length,i+1+(text.length>180?1:0));el.textContent=text.slice(0,i);if(i<text.length){el.appendChild(caret);setTimeout(tick,step);}})();
}
function renderCard(deckId){
  const d=S.DECKS[deckId],c=$('ncard');
  const tapes=`<div class="tape" style="left:-24px;top:6px;transform:rotate(-40deg)"></div><div class="tape" style="right:-22px;top:4px;transform:rotate(38deg)"></div>`;
  const r=d&&selRoom&&S.roomIndex[selRoom]&&S.roomIndex[selRoom].deck===deckId&&revRooms()[selRoom]?S.roomIndex[selRoom]:null;
  let head,title,text;
  if(r){const pr=r.n.split(' · '),code=/^M\d+$/.test(pr[0])?pr[0]:'';const area=Math.round(r.r[2]*r.r[3]);head=`<span>${esc(code?code+' · ':'')}${area} m²</span><span>${esc(d.lvl)}</span>`;title=r.n.toUpperCase();text=descOf(r);}
  else if(d){head=`<span>${esc(d.lvl)} · ${esc(d.elev)}</span><span></span>`;title=d.name.toUpperCase();text=d.intro||'';}
  else{head='<span>—</span><span></span>';title='NO DATA';text='Sem dados. Nenhuma informação disponível neste nível.';}
  const key=(r?r.id:deckId||'-')+'|'+text;
  if(key===cardKey&&c.dataset.has){ // so atualiza o cabecalho (ex.: porcentagem)
    const k=c.querySelector('.k');if(k)k.innerHTML=head;return;}
  cardKey=key;c.dataset.has='1';
  c.innerHTML=`${tapes}<div class="k">${head}</div><h4>${esc(title)}</h4><p></p>`;
  typeInto(c.querySelector('p'),text);
}

/* ---------- caderno ---------- */
function notesList(){
  if(notesMode==='mine')return minePrefs.map((n,i)=>Object.assign({key:'m'+i},n)).sort((a,b)=>a.at-b.at);
  const N=STATE.notes||{};return Object.keys(N).map(k=>Object.assign({key:k},N[k])).sort((a,b)=>(a.at||0)-(b.at||0));
}
function renderNotes(){
  const L=notesList(),box=$('nbl');
  const nsig=notesMode+'|'+L.map(n=>n.key+':'+n.t+':'+(n.r||'')).join('|');
  if(nsig===lastSig.notes&&box.querySelector('.ninp'))return;lastSig.notes=nsig;
  const typing=document.activeElement&&document.activeElement.id==='ninp';const val=typing?document.activeElement.value:'';const ss=typing?document.activeElement.selectionStart:0,se=typing?document.activeElement.selectionEnd:0;
  const atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<40;
  const first=seenNotes===null;if(first)seenNotes=new Set();
  const modeKey=notesMode+':';
  const html=L.map(n=>{const mine=notesMode==='mine'||n.by===ME;const k=modeKey+n.key,isNew=!first&&!seenNotes.has(k);seenNotes.add(k);
    const rt=n.r&&S.roomIndex[n.r]?`<span class="rt" data-r="${esc(n.r)}">${esc((S.roomIndex[n.r].n.split(' · ')[0]).toUpperCase().slice(0,10))}</span>`:'';
    return `<div class="l ${mine?'me':'other'}${isNew&&!REDUCED?' inkin':''}">${esc(n.t)}${rt}${mine?`<i class="x" data-k="${esc(n.key)}">✕</i>`:''}</div>`;}).join('');
  box.innerHTML=html+`<input class="ninp" id="ninp" placeholder="${L.length?'':'write a note…'}" maxlength="240" autocomplete="off" spellcheck="false">`;
  const inp=$('ninp');if(typing){inp.value=val;inp.focus();try{inp.setSelectionRange(ss,se);}catch(e){}}
  if(atBottom||!typing)box.scrollTop=box.scrollHeight;
  $('ncount').textContent=L.length?L.length+(L.length===1?' note':' notes'):'empty';
  $('nmShared').classList.toggle('on',notesMode==='shared');$('nmMine').classList.toggle('on',notesMode==='mine');
  $('nbSub').textContent=notesMode==='shared'?'shared with team':'only on this device';
}
function addNote(t){
  t=t.trim();if(!t)return;
  const room=selRoom&&S.roomIndex[selRoom]&&revRooms()[selRoom]?selRoom:null;
  const n={t,at:Date.now(),by:ME};if(room)n.r=room;
  if(notesMode==='mine'){minePrefs.push(n);LS.set('deserto:notes',JSON.stringify(minePrefs));renderNotes();}
  else ref.child('station/notes').push(n);
}

/* ---------- levar a atencao a uma sala (chip da nota ou "destacar" do Guardiao) ---------- */
function focusRoom(id){
  const r=S.roomIndex[id];if(!r||!revRooms()[id])return;const lvl=levelOfDeck(r.deck);
  if(!isUnlocked(lvl)||(forcedLevel()&&forcedLevel()!==lvl))return;
  curDeck=r.deck;selRoom=id;focusToken=id+'|'+Date.now();renderAll();
  if(plan){const rr=r.r,w=Math.max(rr[2]+16,36),h=w*PH/PW,cx=rr[0]+rr[2]/2,cy=rr[1]+rr[3]/2;
    setView({x:plan.ox+(cx-w/2)*plan.px,y:plan.oy+(cy-h/2)*plan.px,w:w*plan.px,h:h*plan.px},true);}
}

/* ---------- render geral ---------- */
function renderStatic(){const online=!!STATE.online;$('standby').style.display=online?'none':'flex';const T=$('terminal');T.classList.toggle('on',online);
  if(wasOnline===false&&online&&!REDUCED){T.classList.add('boot');setTimeout(()=>T.classList.remove('boot'),1700);}wasOnline=online;}
function renderAll(){
  renderStatic();
  const deck=activeDeck();
  if(deck!==curDeck&&!forcedLevel()){curDeck=deck;}
  const shown=forcedLevel()?deck:curDeck;
  if(shown&&shown.startsWith('lq'))lastLq=shown;
  $('stackcount').textContent='';
  const ssig=[shown,JSON.stringify(unlockedMap()),Object.keys(revRooms()).sort().join(),Object.keys(revCorr()).sort().join()].join('|');
  if(ssig!==lastSig.stack){lastSig.stack=ssig;$('stack').innerHTML=stackSVG(shown);}
  renderPlan(shown);renderRecord(shown);renderCard(shown);
  const forced=forcedLevel();
  $('topinfo').innerHTML=forced?`<span class="forced">▲ DIRECTED VIEW</span>`:'';
  $('btnCctv').className='btn'+(showCams?' on':'');
  const tk=STATE.ticker&&STATE.ticker.length?STATE.ticker:['COMM SYNC +7d','L-02 PRESSURE ELEVATED'];
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

/* ---------- cena ---------- */
function fit(){const s=Math.min(innerWidth/1600,innerHeight/1000);$('scene').style.transform='scale('+s+')';}
function barcode(){let s=5,x=0,h='';for(let i=0;i<34;i++){s=(s*16807)%2147483647;const w=1+(s%3);h+=`<i style="left:${x}px;width:${w}px"></i>`;x+=w+1+(s>>3)%2;}$('barcode').innerHTML=`<span class="bc" style="width:${x}px">${h}</span>`;}
function setTab(t){document.querySelectorAll('.tab2').forEach(x=>x.classList.toggle('on',x.dataset.tab===t));$('view-map').style.display=t==='map'?'block':'none';$('view-cams').style.display=t==='cams'?'block':'none';}

function start(sessionRef){
  ref=sessionRef;
  barcode();buildCams();renderKey();fit();addEventListener('resize',fit);
  $('vent').innerHTML='<i></i>'.repeat(26);
  document.querySelectorAll('.tab2').forEach(t=>t.addEventListener('click',()=>setTab(t.dataset.tab)));
  addEventListener('keydown',e=>{
    if(e.key==='F1'){e.preventDefault();setTab('map');return;}if(e.key==='F2'){e.preventDefault();setTab('cams');return;}
    if((e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))||!view||$('view-map').style.display==='none')return;
    const k=view.w*.12;let used=true;
    if(e.key==='ArrowLeft')view.x-=k;else if(e.key==='ArrowRight')view.x+=k;else if(e.key==='ArrowUp')view.y-=k;else if(e.key==='ArrowDown')view.y+=k;
    else if(e.key==='+'||e.key==='=')zoomAt(1.3,PW/2,PH/2);else if(e.key==='-')zoomAt(1/1.3,PW/2,PH/2);
    else if(e.key==='0'){forceFit=true;renderPlan(forcedLevel()?activeDeck():curDeck);}
    else if(e.key==='Escape'){selRoom=null;const dk=forcedLevel()?activeDeck():curDeck;renderPlan(dk);renderRecord(dk);renderCard(dk);}
    else used=false;
    if(used){e.preventDefault();applyView();}});
  $('stack').addEventListener('click',e=>{
    const dk=e.target.closest('[data-deck]');
    if(dk&&dk.classList.contains('on')){curDeck=dk.dataset.deck;selRoom=null;renderAll();return;}
    const lv=e.target.closest('[data-lvl]');if(!lv||lv.classList.contains('lock'))return;
    if(forcedLevel())return;
    curDeck=defaultDeck(lv.dataset.lvl);selRoom=null;renderAll();});
  /* mapa: clique seleciona sala; arrastar move; roda e botoes dao zoom */
  const pw=$('planwrap');let drag=null;
  const shownDeck=()=>forcedLevel()?activeDeck():curDeck;
  pw.addEventListener('click',e=>{if(dragMoved){dragMoved=false;return;}
    const r=e.target.closest('[data-room]');selRoom=r&&revRooms()[r.dataset.room]?r.dataset.room:null;
    const deck=shownDeck();renderPlan(deck);renderRecord(deck);renderCard(deck);});
  pw.addEventListener('pointerdown',e=>{if(!view)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)};drag=null;return;}
    drag={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y,moved:false};});
  addEventListener('pointermove',e=>{
    if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch&&pointers.size===2&&view){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y),bb=pw.getBoundingClientRect(),k=PW/bb.width;
      if(pinch.d>0&&Math.abs(d-pinch.d)>2){zoomAt(d/pinch.d,((a.x+b.x)/2-bb.left)*k,((a.y+b.y)/2-bb.top)*k);pinch.d=d;dragMoved=true;}return;}
    if(!drag||!view)return;const sc=Math.min(innerWidth/1600,innerHeight/1000);const k=view.w/(PW*sc);
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;pw.classList.add('drag');
    view.x=drag.vx-dx*k;view.y=drag.vy-dy*k;applyView();});
  addEventListener('pointerup',e=>{pointers.delete(e.pointerId);if(pointers.size<2)pinch=null;if(drag&&drag.moved)dragMoved=true;drag=null;pw.classList.remove('drag');setTimeout(()=>{dragMoved=false;},0);});
  pw.addEventListener('wheel',e=>{e.preventDefault();const b=pw.getBoundingClientRect(),k=PW/b.width;zoomAt(e.deltaY<0?1.18:1/1.18,(e.clientX-b.left)*k,(e.clientY-b.top)*k);},{passive:false});
  const refit=()=>{forceFit=true;renderPlan(shownDeck());};
  pw.addEventListener('dblclick',refit);$('zFit').addEventListener('click',refit);
  $('zIn').addEventListener('click',()=>zoomAt(1.4,PW/2,PH/2));$('zOut').addEventListener('click',()=>zoomAt(1/1.4,PW/2,PH/2));
  $('btnCctv').addEventListener('click',()=>{showCams=!showCams;renderAll();});
  $('nmShared').addEventListener('click',()=>{notesMode='shared';renderNotes();});
  $('nmMine').addEventListener('click',()=>{notesMode='mine';renderNotes();});
  $('nbl').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='ninp'){const v=e.target.value;e.target.value='';addNote(v);e.preventDefault();}});
  $('nbl').addEventListener('click',e=>{const rt=e.target.closest('.rt');if(rt){focusRoom(rt.dataset.r);return;}const x=e.target.closest('.x');if(!x)return;
    if(notesMode==='mine'){const tgt=notesList().find(n=>n.key===x.dataset.k);if(tgt){minePrefs=minePrefs.filter(n=>!(n.at===tgt.at&&n.t===tgt.t));LS.set('deserto:notes',JSON.stringify(minePrefs));renderNotes();}}
    else ref.child('station/notes/'+x.dataset.k).remove();});
  $('camgrid').addEventListener('click',e=>{
    const card=e.target.closest('.camcard');if(!card)return;const id=card.dataset.id,c=(STATE.cams||{})[id]||{};
    if(!c.on)return;const now=Date.now();if(now-(c.pulledAt||0)<CAM_COOLDOWN)return;
    ref.child('station/cams/'+id+'/pulledAt').set(now);playCamera(id);});
  let seenPulls={};
  ref.child('station/cams').on('value',snap=>{const cams=snap.val()||{},now=Date.now();
    Object.keys(cams).forEach(id=>{const p=cams[id]&&cams[id].pulledAt;if(!p||seenPulls[id]===p)return;seenPulls[id]=p;if(now-p<CAM_DURATION)playCamera(id);});renderCameras();});
  ref.child('station').on('value',snap=>{STATE=snap.val()||{};
    if(curDeck&&!isUnlocked(levelOfDeck(curDeck))){curDeck=null;selRoom=null;}
    renderAll();
    const f=mapState().focus;if(f&&f.at&&f.at!==lastFocusAt){lastFocusAt=f.at;if(Date.now()-f.at<12000)focusRoom(f.room);}});
  setInterval(renderCameras,1000);
  setInterval(()=>{const t=new Date().toTimeString().slice(0,8);const c=$('clock'),tc=$('camtc');if(c)c.textContent=t;if(tc)tc.textContent=t;},1000);
  renderAll();
}
window.StationApp={start,_state:()=>STATE,_render:renderAll};
})();
