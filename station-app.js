/* ============================================================
   Terminal da estacao (estacao.html): mapa que revela (zoom, pan, animacoes), caderno, cameras.
   Estado vem do Firebase em sessions/<SESSION>/station/*
     online, unlocked{level:true}, force, cams{}, map{rooms{},corr{},pin,desc{sala:texto}}, notes{}
   ============================================================ */
(function(){
const S=window.STATION,R=window.StationRender;
const CAM_DURATION=6000,CAM_COOLDOWN=60000;
let PW=810,PH=664; // tamanho do painel do mapa (medido do DOM: muda em tela cheia)
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
const REDUCED=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

let theme='dark',fullMode=false,apiFull=false;
let ref=null,STATE={},curDeck=null,selRoom=null,notesMode='shared',showCams=false,lastLq='lqC',view=null,viewKey='',plan=null,dragMoved=false;
let prevRev=null,lastPlanDeck='',seenNotes=null,cardKey='',typeTok=0,lastPinKey='';
let prevProps=null,lastSig={stack:'',plan:'',notes:''},focusToken='',focusPulsed='',lastFocusAt=0,viewAnim=0,wasOnline=null,forceFit=false;
const pointers=new Map();let pinch=null;
const ME=(()=>{let v=LS.get('deserto:op');if(!v){v='OP-'+Math.random().toString(36).slice(2,5).toUpperCase();LS.set('deserto:op',v);}return v;})();

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

/* ---------- pilha isométrica: a plataforma vista de cima/diagonal, com a torre de alojamento ao lado ---------- */
const LQ_ELEV={lqE:58,lqD:54,lqC:50,lqB:46,lqA:42},PL_ELEV={weather:52,module:40,cellar:28};
function stackSVG(active){
  const s=1.25,PCX=166,LCX=66,TH=8,Y0=146,PM=12,WL=20;
  /* geometria do bloco, do poco e das chegadas: vem de STATION.STACK (em metros da placa) quando o mapa define; senao o padrao antigo */
  const ST=S.STACK,kk=ST?114/ST.plate[0]:1,PWd=114,PHd=ST?ST.plate[1]*kk:55,LW=ST?ST.blk[2]*kk:30,LH=ST?ST.blk[3]*kk:20;
  const SHAFTS=ST?ST.shafts.map(p=>[p[0]*kk,p[1]*kk]):[[38,27],[86,27]],CRN=ST?[ST.crane[0]*kk,ST.crane[1]*kk]:[96,24],MPL=ST?[ST.moon[0]*kk,ST.moon[1]*kk]:[54.5,28.4];
  const P=(x,y,cy,cx)=>[cx+(x-y)*s*.866,cy+(x+y)*s*.5];
  const ps=pts=>pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const yOf=e=>Y0+(52-e)*PM;
  const lvlActive=active?levelOfDeck(active):null,qu=isUnlocked('quarters'),pin=mapState().pin;
  const rr=revRooms(),rc=revCorr();
  const nrm=(d,x,y,W,H)=>[(x-d.bbox[0])/d.bbox[2]*W,(y-d.bbox[1])/d.bbox[3]*H];
  const poly=(d,r,cy,cx,W,H)=>[[r[0],r[1]],[r[0]+r[2],r[1]],[r[0]+r[2],r[1]+r[3]],[r[0],r[1]+r[3]]].map(q=>{const n=nrm(d,q[0],q[1],W,H);return P(n[0],n[1],cy,cx);});
  const slab=(d,cy,cx,W,H,sel,unl,rev)=>{
    const c=[[0,0],[W,0],[W,H],[0,H]].map(q=>P(q[0],q[1],cy,cx)),t=TH;
    let g=`<polygon class="sk-s1" points="${ps([c[3],c[2],[c[2][0],c[2][1]+t],[c[3][0],c[3][1]+t]])}"/><polygon class="sk-s2" points="${ps([c[1],c[2],[c[2][0],c[2][1]+t],[c[1][0],c[1][1]+t]])}"/><polygon class="sk-top" points="${ps(c)}"/>`;
    if(unl&&rev){d.corr.forEach(co=>{if(rc[co.id])g+=`<polygon class="sk-co" points="${ps(poly(d,co.r,cy,cx,W,H))}"/>`;});
      d.rooms.forEach(ro=>{if(rr[ro.id])g+=`<polygon class="sk-ro${ro.t==='off'?' off':''}" points="${ps(poly(d,ro.r,cy,cx,W,H))}"/>`;});}
    return g;};
  let h='';
  /* plano do mar */
  const wy=yOf(WL),wc=[[0,0],[PWd,0],[PWd,PHd],[0,PHd]].map(q=>P(q[0],q[1],wy,PCX));
  h+=`<polygon points="${ps(wc)}" class="sk-sea"/><text x="${wc[2][0]-4}" y="${wc[2][1]+12}" text-anchor="end" class="sk-d" font-size="7.5" letter-spacing=".14em">SEA LEVEL</text>`;
  /* pernas */
  [[0,0],[PWd,0],[PWd,PHd],[0,PHd]].forEach(([x,y])=>{const a=P(x,y,yOf(52),PCX),b=P(x,y,wy,PCX);h+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="sk-dash"/>`;});
  SHAFTS.forEach(([x,y])=>{const a=P(x,y,yOf(52),PCX),b=P(x,y,yOf(28),PCX);h+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="sk-shaft"/>`;[52,40,28].forEach(e=>{const q=P(x,y,yOf(e),PCX);h+=`<rect x="${q[0]-2.4}" y="${q[1]-2.4}" width="4.8" height="4.8" class="sk-shaftd"/>`;});});
  /* decks da plataforma */
  [['weather','L-07','WEATHER','+52 m'],['module','L-05','MODULE','+40 m'],['cellar','L-03','CELLAR','+28 m']].forEach(([lvl,tag,nm,el])=>{
    const sel=lvlActive===lvl,unl=isUnlocked(lvl),cy=yOf(PL_ELEV[lvl]),d=S.DECKS[lvl];
    const rev=Object.keys(rr).some(k=>S.roomIndex[k]&&S.roomIndex[k].deck===lvl);
    let g=`<g data-lvl="${lvl}" class="sk-dk ${unl?'on':'lock'}${sel?' sel':''}">`+slab(d,cy,PCX,PWd,PHd,sel,unl,rev);
    const cx=232,y=cy-34;
    g+=`<rect x="${cx}" y="${y}" width="64" height="40" class="sk-chip"/><text x="${cx+6}" y="${y+13}" class="sk-d" font-size="8.5" letter-spacing=".1em">${tag}</text><text x="${cx+6}" y="${y+25}" class="sk-t" font-weight="700" font-size="11.5" letter-spacing=".08em" style="font-family:'Barlow Condensed'">${nm}</text><text x="${cx+6}" y="${y+35}" class="sk-d" font-size="8">${unl?el:'LOCKED'}</text>`;
    if(pin&&pin.deck===lvl){const n=nrm(d,pin.x,pin.y,PWd,PHd),q=P(n[0],n[1],cy,PCX);g+=`<circle cx="${q[0]}" cy="${q[1]}" r="3.4" class="sk-pin"/><circle cx="${q[0]}" cy="${q[1]}" r="6.5" class="sk-pinr"/>`;}
    h+=g+'</g>';
  });
  /* o alojamento e um bloco da plataforma: contorno no module deck (+40), na ponta oeste, longe dos poços e do flare */
  const LQN=ST?[ST.blk[0]*kk,ST.blk[1]*kk]:[1.5,14],lqc=[[0,0],[LW,0],[LW,LH],[0,LH]],mdy=yOf(40);
  h+=`<polygon points="${ps(lqc.map(q=>P(LQN[0]+q[0],LQN[1]+q[1],mdy,PCX)))}" class="sk-blk"/>`;
  lqc.forEach(([x,y])=>{const a=P(x,y,yOf(62),LCX),b=P(x,y,yOf(42),LCX);h+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="sk-dash"/>`;});
  lqc.forEach(([x,y])=>{const a=P(x,y,yOf(42),LCX),b=P(LQN[0]+x,LQN[1]+y,mdy,PCX);h+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="sk-dash"/>`;});
  /* o weather deck (+52) atravessa o bloco entre os decks C e D */
  h+=`<polygon points="${ps(lqc.map(q=>P(q[0],q[1],yOf(52),LCX)))}" class="sk-sea"/>`;
  /* torre de alojamento: cinco decks, cada um selecionável */
  S.LQ_ORDER.forEach(id=>{
    const e=LQ_ELEV[id],cy=yOf(e),d=S.DECKS[id],on=qu&&active===id;
    const rev=Object.keys(rr).some(k=>S.roomIndex[k]&&S.roomIndex[k].deck===id);
    let g=`<g data-deck="${id}" class="sk-dk sk-lq ${qu?'on':'lock'}${on?' sel':''}">`+slab(d,cy,LCX,LW,LH,on,qu,rev);
    g+=`<text x="6" y="${cy+14}" class="sk-t" font-weight="700" font-size="19" style="font-family:'Barlow Condensed'">${id.slice(2)}</text><text x="6" y="${cy+25}" class="sk-d" font-size="7.5">+${e}</text>`;
    if(pin&&pin.deck===id){const n=nrm(d,pin.x,pin.y,LW,LH),q=P(n[0],n[1],cy,LCX);g+=`<circle cx="${q[0]}" cy="${q[1]}" r="2.6" class="sk-pin"/><circle cx="${q[0]}" cy="${q[1]}" r="5" class="sk-pinr"/>`;}
    h+=g+'</g>';
  });
  h+=`<text x="6" y="${yOf(62)-16}" class="sk-d" font-size="8" letter-spacing=".1em">L-06</text><text x="6" y="${yOf(62)-6}" class="sk-t" font-weight="600" font-size="8.5" letter-spacing=".06em">LIVING QUARTERS</text>`;
  /* ponte: convés C da torre encosta no weather deck */
  const bridgeA=P(LW,0,yOf(50),LCX),bridgeB=P(0,PHd,yOf(52),PCX);
  h+=`<path d="M${bridgeA[0]} ${bridgeA[1]}L${bridgeB[0]} ${bridgeB[1]}" class="sk-bridge"/>`;
  /* chegadas */
  const rc0=yOf(62),rfp=lqc.map(q=>P(q[0],q[1],rc0,LCX)),rb=rfp.map(p=>[p[0],p[1]+5]);
  h+=`<polygon points="${ps([rfp[3],rfp[2],[rfp[2][0],rfp[2][1]+5],[rfp[3][0],rfp[3][1]+5]])}" class="sk-s1"/><polygon points="${ps([rfp[1],rfp[2],[rfp[2][0],rfp[2][1]+5],[rfp[1][0],rfp[1][1]+5]])}" class="sk-s2"/><polygon points="${ps(rfp)}" class="sk-top"/>`;
  const hp=P(LW/2,LH/2,rc0,LCX);
  h+=`<circle cx="${hp[0]}" cy="${hp[1]}" r="5.5" class="sk-ln"/><text x="${hp[0]}" y="${hp[1]+3}" text-anchor="middle" class="sk-t" font-size="8" font-weight="700">H</text>`;
  h+=`<text x="106" y="${rc0+8}" class="sk-d" font-size="7.5" letter-spacing=".08em">+62 · HELIPORT A</text><text x="106" y="${rc0+19}" class="sk-d" font-size="7" letter-spacing=".08em">+52 · WEATHER ENTERS</text>`;
  h+=`<path d="M${hp[0]+30} ${rc0-14}L${hp[0]+7} ${hp[1]-4}" class="sk-arr"/><path d="M${hp[0]+10} ${hp[1]-10}l-5.5 5.5l7.5 1.5z" class="sk-arrf"/><text x="${hp[0]+33}" y="${rc0-10}" class="sk-l" font-size="9" font-weight="700">1</text>`;
  const cr=P(CRN[0],CRN[1],yOf(52),PCX),bt=P(CRN[0]+8,CRN[1]+6,wy,PCX);
  h+=`<path d="M${cr[0]} ${cr[1]}V${bt[1]-8}" class="sk-arr"/><rect x="${cr[0]-2.5}" y="${cr[1]-2.5}" width="5" height="5" class="sk-arrf"/><path d="M${bt[0]-13} ${bt[1]-3}h26l-4 7h-18z" class="sk-fill"/><text x="${cr[0]+8}" y="${cr[1]+4}" class="sk-l" font-size="9" font-weight="700">2</text>`;
  const mp=P(MPL[0],MPL[1],yOf(28),PCX),mw=P(MPL[0],MPL[1],wy,PCX);
  h+=`<circle cx="${mp[0]}" cy="${mp[1]}" r="4.5" class="sk-ln"/><path d="M${mp[0]} ${mp[1]+4}V${mw[1]-8}" class="sk-arr"/><path d="M${mw[0]-4.5} ${mw[1]-10}l4.5 7l4.5 -7z" class="sk-arrf"/><text x="${mp[0]+9}" y="${mp[1]+16}" class="sk-l" font-size="9" font-weight="700">3</text>`;
  const ly=wc[2][1]+34;
  h+=`<text x="10" y="${ly}" class="sk-l" font-size="7.5">1</text><text x="20" y="${ly}" class="sk-t" font-size="7.5" letter-spacing=".06em">HELICOPTER · HELIPORT A</text>`;
  h+=`<text x="10" y="${ly+13}" class="sk-l" font-size="7.5">2</text><text x="20" y="${ly+13}" class="sk-t" font-size="7.5" letter-spacing=".06em">SUPPLY BOAT · CRANE</text>`;
  h+=`<text x="10" y="${ly+26}" class="sk-l" font-size="7.5">3</text><text x="20" y="${ly+26}" class="sk-t" font-size="7.5" letter-spacing=".06em">MOONPOOL · WATER ACCESS</text>`;
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
function measure(){const w=$('planwrap');if(w&&w.clientWidth>50&&w.clientHeight>50){PW=w.clientWidth;PH=w.clientHeight;}}
function viewFor(r,m){m=m||5;let w=Math.max(r[2]+2*m,28),h=r[3]+2*m;if(w/h<PW/PH)w=h*PW/PH;else h=w*PH/PW;const cx=r[0]+r[2]/2,cy=r[1]+r[3]/2;return {x:plan.ox+(cx-w/2)*plan.px,y:plan.oy+(cy-h/2)*plan.px,w:w*plan.px,h:h*plan.px};}
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
  if(!view)return;const nw=Math.max(PW/16,Math.min(view.w/f,plan?plan.w*2:99999)),k=nw/view.w,nh=view.h*k;
  const fx=sx/PW,fy=sy/PH;view={x:view.x+(view.w-nw)*fx,y:view.y+(view.h-nh)*fy,w:nw,h:nh};applyView();}
function renderPlan(deckId){
  const wrap=$('planwrap'),d=S.DECKS[deckId];measure();
  if(!d){plan=null;view=null;wrap.innerHTML=`<div style="height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;letter-spacing:.3em;color:#6b6d68;line-height:1.7;text-align:center">NO LEVEL SELECTED<br><span style="font-size:10px;letter-spacing:.12em;opacity:.7">select an unlocked level</span></div>`;lastPlanDeck='';return;}
  const pin=mapState().pin;
  const PRP=mapState().props||{},prSig=Object.keys(PRP).sort().map(k=>k+':'+PRP[k].x+','+PRP[k].y+','+PRP[k].rot+','+PRP[k].sc+','+PRP[k].sx+','+PRP[k].sy+','+(PRP[k].lbl||'')).join(';')+'|'+Object.keys(mapState().noeq||{}).sort().join()+'|v'+(mapState().veilAll?1:0)+'|'+theme+'|'+PW+'x'+PH;
  const sig=[deckId,Object.keys(revRooms()).sort().join(),Object.keys(revCorr()).sort().join(),pin&&pin.deck===deckId?pin.x+','+pin.y:'',selRoom,showCams,Object.keys(camsOn()).join(),focusToken,prSig].join('|');
  if(sig===lastSig.plan&&wrap.querySelector('svg.cur')&&!forceFit)return;
  lastSig.plan=sig;
  const st={rooms:revRooms(),corr:revCorr(),pin:pin&&pin.deck===deckId?pin:null,sel:selRoom,showCams,camsOn:camsOn(),props:Object.keys(PRP).map(k=>Object.assign({id:k},PRP[k])),noeq:mapState().noeq||{},veilAll:!!mapState().veilAll};
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
  const nm=$('recName'),st=$('recStat')||{};
  if(r){nm.textContent=r.n;st.textContent='';st.className='stat';}
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
  if(r){const pr=r.n.split(' · '),code=/^M\d+$/.test(pr[0])?pr[0]:'';const area=Math.round(r.r[2]*r.r[3]);head=`<span>${esc(code)}</span><span>${esc(d.lvl)}</span>`;title=r.n.toUpperCase();text=descOf(r);}
  else if(d){head=`<span>${esc(d.lvl)} · ${esc(d.elev)}</span><span></span>`;title=d.name.toUpperCase();text=d.intro||'';}
  else{head='<span>—</span><span></span>';title='NO DATA';text='Sem dados. Nenhuma informação disponível neste nível.';}
  const rd=$('recdesc');if(rd)rd.textContent=text||'';
  const key=(r?r.id:deckId||'-')+'|'+text;
  if(key===cardKey&&c.dataset.has){ // so atualiza o cabecalho (ex.: porcentagem)
    const k=c.querySelector('.k');if(k)k.innerHTML=head;return;}
  cardKey=key;c.dataset.has='1';
  c.innerHTML=`${tapes}<div class="k">${head}</div><h4>${esc(title)}</h4><p></p>`;
  typeInto(c.querySelector('p'),text);
}

/* ---------- caderno ---------- */
function notesList(){
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
  const html=L.map(n=>{const mine=n.by===ME;const k=modeKey+n.key,isNew=!first&&!seenNotes.has(k);seenNotes.add(k);
    const rt=n.r&&S.roomIndex[n.r]?`<span class="rt" data-r="${esc(n.r)}">${esc((S.roomIndex[n.r].n.split(' · ')[0]).toUpperCase().slice(0,10))}</span>`:'';
    return `<div class="l ${mine?'me':'other'}${isNew&&!REDUCED?' inkin':''}">${esc(n.t)}${rt}${mine?`<i class="x" data-k="${esc(n.key)}">✕</i>`:''}</div>`;}).join('');
  box.innerHTML=html+`<input class="ninp" id="ninp" placeholder="${L.length?'':'write a note…'}" maxlength="240" autocomplete="off" spellcheck="false">`;
  const inp=$('ninp');if(typing){inp.value=val;inp.focus();try{inp.setSelectionRange(ss,se);}catch(e){}}
  if(atBottom||!typing)box.scrollTop=box.scrollHeight;
  $('ncount').textContent=L.length?L.length+(L.length===1?' note':' notes'):'empty';
}
function addNote(t){
  t=t.trim();if(!t)return;
  const room=selRoom&&S.roomIndex[selRoom]&&revRooms()[selRoom]?selRoom:null;
  const n={t,at:Date.now(),by:ME};if(room)n.r=room;
  ref.child('station/notes').push(n);
}

/* ---------- levar a atencao a uma sala (chip da nota ou "destacar" do Guardiao) ---------- */
function focusRoom(id){
  const r=S.roomIndex[id];if(!r||!revRooms()[id])return;const lvl=levelOfDeck(r.deck);
  if(!isUnlocked(lvl)||(forcedLevel()&&forcedLevel()!==lvl))return;
  curDeck=r.deck;selRoom=id;focusToken=id+'|'+Date.now();renderAll();
  if(plan)setView(viewFor(r.r,8),true);
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
  const pn=mapState().pin,ssig=[shown,theme,JSON.stringify(unlockedMap()),Object.keys(revRooms()).sort().join(),Object.keys(revCorr()).sort().join(),pn?pn.deck+','+pn.x+','+pn.y:''].join('|');
  if(ssig!==lastSig.stack){lastSig.stack=ssig;$('stack').innerHTML=stackSVG(shown);}
  renderPlan(shown);renderRecord(shown);renderCard(shown);
  const forced=forcedLevel();
  $('topinfo').innerHTML=forced?`<span class="forced">▲ DIRECTED VIEW</span>`:'';
  $('btnCctv').className='btn'+(showCams?' on':'');
  $('btnPin').classList.toggle('hid',!pn);
  const tk=tickerList();$('ticker').style.display=tk.length?'':'none';
  $('ticker').innerHTML=tk.length?'<b>▲ WARNING</b>'+tk.map(t=>`<span>${esc(t)}</span>`).join(''):'';
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
function setTab(t){document.querySelectorAll('.tab2').forEach(x=>x.classList.toggle('on',x.dataset.tab===t));$('view-map').style.display=t==='map'?'block':'none';$('view-cams').style.display=t==='cams'?'block':'none';}

const TICKER_DEF=['COMM SYNC +7d','MOONPOOL LEVEL HIGH'];
/* faixa de aviso: sem registro = padrao; 'off' ou vazio = escondida; o Guardiao edita em station/ticker */
function tickerList(){const t=STATE.ticker;if(t==='off')return [];if(t&&typeof t==='object')return Object.values(t).filter(x=>typeof x==='string'&&x.trim());return TICKER_DEF;}
/* ---------- tema, tela cheia, pino e navegacao por nivel ---------- */
const ELEV_ORDER=['lqE','lqD','weather','lqC','lqB','lqA','module','cellar']; // do mais alto ao mais baixo
const shownDeckId=()=>forcedLevel()?activeDeck():curDeck;
function applyTheme(m){theme=m==='light'?'light':'dark';document.documentElement.setAttribute('data-theme',theme);R.setTheme(theme);LS.set('deserto:theme',theme);
  const l=$('themeLbl');if(l)l.textContent=theme==='dark'?'LIGHT':'DARK';lastSig.stack='';lastSig.plan='';if(ref)renderAll();}
function setFull(on,fromApi){
  fullMode=!!on;document.body.classList.toggle('full',fullMode);const b=$('btnFull');b.classList.toggle('act',fullMode);b.textContent=fullMode?'✕ EXIT FULL':'⛶ FULL';
  if(!fromApi){try{if(fullMode){apiFull=true;const p=document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();if(p&&p.catch)p.catch(()=>{apiFull=false;});}else if(document.fullscreenElement){apiFull=false;document.exitFullscreen();}}catch(e){apiFull=false;}}
  measure();forceFit=true;lastSig.plan='';renderPlan(shownDeckId());}
function stepDeck(dir){
  if(forcedLevel())return;const cur=shownDeckId();let i=ELEV_ORDER.indexOf(cur);if(i<0)return;let j=i+dir;
  while(j>=0&&j<ELEV_ORDER.length&&!isUnlocked(levelOfDeck(ELEV_ORDER[j])))j+=dir;
  if(j<0||j>=ELEV_ORDER.length)return;curDeck=ELEV_ORDER[j];selRoom=null;forceFit=true;renderAll();}
function goPin(){
  const pin=mapState().pin;if(!pin)return;const lvl=levelOfDeck(pin.deck);
  if(!isUnlocked(lvl)||(forcedLevel()&&forcedLevel()!==lvl))return;
  if(shownDeckId()!==pin.deck){curDeck=pin.deck;selRoom=null;}
  const d=S.DECKS[pin.deck],hit=d&&d.rooms.find(r=>revRooms()[r.id]&&pin.x>=r.r[0]&&pin.x<=r.r[0]+r.r[2]&&pin.y>=r.r[1]&&pin.y<=r.r[1]+r.r[3]);
  if(hit)selRoom=hit.id;renderAll();
  if(plan)setView(viewFor([pin.x-7,pin.y-5,14,10],6),true);}
function zoomToRoom(){
  const id=selRoom,r=id&&S.roomIndex[id];if(!r||!plan||!revRooms()[id])return;
  setView(viewFor(r.r,4),true);}
function start(sessionRef){
  ref=sessionRef;
  applyTheme(LS.get('deserto:theme','dark'));
  buildCams();renderKey();fit();addEventListener('resize',fit);
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&apiFull&&fullMode){apiFull=false;setFull(false,true);}});
  $('vent').innerHTML='<i></i>'.repeat(26);
  document.querySelectorAll('.tab2').forEach(t=>t.addEventListener('click',()=>setTab(t.dataset.tab)));
  addEventListener('keydown',e=>{
    if(e.key==='F1'){e.preventDefault();setTab('map');return;}if(e.key==='F2'){e.preventDefault();setTab('cams');return;}
    if((e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))||e.ctrlKey||e.metaKey||e.altKey||$('view-map').style.display==='none')return;
    const key=e.key.length===1?e.key.toLowerCase():e.key;let used=true;
    if(key==='f'){setFull(!fullMode);e.preventDefault();return;}
    if(key==='h'){goPin();e.preventDefault();return;}
    if(key==='z'){zoomToRoom();e.preventDefault();return;}
    if(key==='t'){applyTheme(theme==='dark'?'light':'dark');e.preventDefault();return;}
    if(key==='Escape'){if(selRoom){selRoom=null;const dk=shownDeckId();renderPlan(dk);renderRecord(dk);renderCard(dk);}else if(fullMode)setFull(false);e.preventDefault();return;}
    if(fullMode&&(key==='ArrowUp'||key==='PageUp')){stepDeck(-1);e.preventDefault();return;}
    if(fullMode&&(key==='ArrowDown'||key==='PageDown')){stepDeck(1);e.preventDefault();return;}
    if(!view)return;
    const k=view.w*.12;
    if(key==='ArrowLeft')view.x-=k;else if(key==='ArrowRight')view.x+=k;else if(key==='ArrowUp')view.y-=k;else if(key==='ArrowDown')view.y+=k;
    else if(key==='+'||key==='=')zoomAt(1.3,PW/2,PH/2);else if(key==='-')zoomAt(1/1.3,PW/2,PH/2);
    else if(key==='0'){forceFit=true;renderPlan(shownDeckId());}
    else used=false;
    if(used){e.preventDefault();applyView();}});
  $('stack').addEventListener('click',e=>{
    const dk=e.target.closest('[data-deck]');
    if(dk&&dk.classList.contains('on')){if(forcedLevel())return;curDeck=dk.dataset.deck;selRoom=null;renderAll();return;}
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
  pw.addEventListener('dblclick',e=>{const r=e.target.closest('[data-room]');if(r&&revRooms()[r.dataset.room]){selRoom=r.dataset.room;const dk=shownDeckId();renderPlan(dk);renderRecord(dk);renderCard(dk);zoomToRoom();}else refit();});$('zFit').addEventListener('click',refit);
  $('zRoom').addEventListener('click',zoomToRoom);$('btnPin').addEventListener('click',goPin);$('btnFull').addEventListener('click',()=>setFull(!fullMode));$('btnTheme').addEventListener('click',()=>applyTheme(theme==='dark'?'light':'dark'));
  $('zIn').addEventListener('click',()=>zoomAt(1.4,PW/2,PH/2));$('zOut').addEventListener('click',()=>zoomAt(1/1.4,PW/2,PH/2));
  $('btnCctv').addEventListener('click',()=>{showCams=!showCams;renderAll();});
  $('nbl').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='ninp'){const v=e.target.value;e.target.value='';addNote(v);e.preventDefault();}});
  $('nbl').addEventListener('click',e=>{const rt=e.target.closest('.rt');if(rt){focusRoom(rt.dataset.r);return;}const x=e.target.closest('.x');if(!x)return;
    ref.child('station/notes/'+x.dataset.k).remove();});
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
