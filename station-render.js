/* ============================================================
   Renderer da planta (SVG). Usa STATION (dados) e STATION_EQ (equipamento).
   Leitura de escape plan: poche de parede, portas com arco, vaos, equipamento por sala,
   corredores com grade, cotas, bolhas de grade estrutural, escala, figura humana, legenda.
   ============================================================ */
(function(){
const T={paper:'#e4e1d6',wall:'#1b1d1f',corr:'#c1c2b8',room:'#efede5',deck:'#dedbcf',grate:'rgba(0,0,0,.11)',grid:'#bdb9aa',sub:'#6b6d68',ink:'#1b1d1f',label:'#1b1d1f',
  equip:'#6a6c67',eqFill:'#dbd9ce',stub:'#8d8d82',cable:'#a6a79d',door:'#3a3c3d',route:'#d9531e',you:'#1b1d1f',youText:'#eceae2',sel:'#d9531e',amber:'#b8480f',
  sealBg:'#d2cebd',hazard:'#d9531e',fire:'#9c2f1b',pink:'#26282a',stain:'rgba(92,34,28,.72)'};
const THEME={dark:{paper:'#e4e1d6',room:'#efede5',corr:'#c1c2b8',deck:'#dedbcf',grid:'#bdb9aa'},light:{paper:'#eceae2',room:'#fbfaf6',corr:'#d6d3c8',deck:'#f4f3ee',grid:'#cfccbe'}};
function setTheme(m){Object.assign(T,THEME[m]||THEME.dark);}
const DW={door:1.3,cdoor:1.0,double:2.4,open:2.6,gate:1.8,weld:1.4,hatch:1.0};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f1=v=>(Math.round(v*10)/10).toString();
const inR=(r,x,y,e)=>x>r[0]-(e||0)&&x<r[0]+r[2]+(e||0)&&y>r[1]-(e||0)&&y<r[1]+r[3]+(e||0);
const touchR=(a,b,e)=>{e=e||.3;return Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0])>=-e&&Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1])>=-e;};

/* ---------- props do customizador (ops em metros; ver station-props.js) ---------- */
const parr=a=>Array.isArray(a)?a:(a&&typeof a==='object'?Object.keys(a).sort((x,y)=>x-y).map(k=>a[k]):[]);
const NS='vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"';
const pf=(f,closed)=>f==1?`fill="${T.eqFill}" stroke="${T.pink}" stroke-width="1.05"`:f==2?`fill="rgba(138,106,42,.2)" stroke="${T.amber}" stroke-width="1.15"`:f==3?`fill="${T.pink}" stroke="${T.pink}" stroke-width="1"`:f==4?(closed?`fill="${T.stain}" stroke="none"`:`fill="none" stroke="${T.stain}" stroke-width="2.4"`):`fill="none" stroke="${T.pink}" stroke-width="1.05"`;
const pn=v=>Math.round(v*1000)/1000;
function propOps(ops,pid){
  let s='';
  parr(ops).forEach(o=>{o=parr(o);const t=o[0];
    if(t==='rc')s+=`<rect x="${pn(o[1])}" y="${pn(o[2])}" width="${pn(o[3])}" height="${pn(o[4])}"${o[5]?` rx="${pn(o[5])}"`:''} ${pf(o[6])} ${NS}/>`;
    else if(t==='ci')s+=`<circle cx="${pn(o[1])}" cy="${pn(o[2])}" r="${pn(o[3])}" ${pf(o[4],1)} ${NS}/>`;
    else if(t==='ln')s+=`<path d="M${pn(o[1])} ${pn(o[2])}L${pn(o[3])} ${pn(o[4])}" ${o[5]==4?pf(4,0):pf(o[5]==2?2:0).replace(/fill="[^"]*"/,'fill="none"')} ${NS}/>`;
    else if(t==='pl'){const p=parr(o[1]);let d='';for(let i=0;i+1<p.length;i+=2)d+=(i?'L':'M')+pn(p[i])+' '+pn(p[i+1]);if(+o[2])d+='Z';
      s+=`<path d="${d}" ${(+o[2])?pf(o[3],1):pf(o[3],0).replace(/fill="[^"]*"/,'fill="none"')} ${NS}/>`;}
    else if(t==='ha')s+=`<rect x="${pn(o[1])}" y="${pn(o[2])}" width="${pn(o[3])}" height="${pn(o[4])}" fill="url(#${pid||'pl'}q)" stroke="${T.amber}" stroke-width=".8" ${NS}/>`;
    else if(t==='tx')s+=`<text x="${pn(o[1])}" y="${pn(o[2])}" text-anchor="middle" font-family="Barlow Condensed" font-weight="${+o[5]?700:500}" font-size="${pn(o[4])}" fill="${T.pink}">${esc(o[3])}</text>`;
  });
  return s;
}
/* um prop dentro de <g> no espaco da planta. p={id,x,y,rot,sc,w,h,ops,lbl,inl,txt,hidden,sel,unk} */
function propG(p,o){
  const w=p.w||1,h=p.h||1,sc=p.sc||1,sx=p.sx||1,sy=p.sy||1,rot=p.rot||0,pid=o.pid||'pl';
  const cx=o.X(p.x),cy=o.Y(p.y),k=o.px*sc;
  let inner=propOps(p.ops,pid);
  if(p.unk)inner+=`<rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" fill="none" stroke="${T.pink}" stroke-width="1" stroke-dasharray="3 2" ${NS}/><text y=".14" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size=".5" fill="${T.pink}">?</text>`;
  if(p.inl&&p.lbl){const L=String(p.lbl),sz=p.txt?Math.min(.5,(w*1.1)/Math.max(1,L.length*.5)):Math.min(.46,.8/Math.max(1,L.length*.55));
    inner+=`<text transform="rotate(${-rot})" y="${pn(sz*.33)}" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="${pn(sz)}" fill="${p.txt?T.pink:T.pink}">${esc(L)}</text>`;}
  if(o.hit)inner=`<rect x="${-Math.max(w,.9)/2}" y="${-Math.max(h,.9)/2}" width="${Math.max(w,.9)}" height="${Math.max(h,.9)}" fill="transparent" stroke="none" pointer-events="all"/>`+inner;
  if(p.sel)inner+=`<rect x="${-w/2-.12}" y="${-h/2-.12}" width="${w+.24}" height="${h+.24}" fill="none" stroke="${T.sel}" stroke-width="1.6" stroke-dasharray="5 3" ${NS}/>`;
  let s=`<g class="prop${p.hidden?' ph':''}" data-prop="${esc(p.id)}" transform="translate(${pn(cx)} ${pn(cy)}) rotate(${rot}) scale(${pn(k*sx)} ${pn(k*sy)})"${p.hidden?' opacity=".5" stroke-dasharray="3 2"':''}>${inner}</g>`;
  if(!p.inl&&p.lbl)s+=`<text x="${pn(cx)}" y="${pn(cy+o.P(Math.hypot(w*sx,h*sy)/2*sc)+8)}" text-anchor="middle" font-family="IBM Plex Mono" font-size="6.8" fill="${T.sub}" paint-order="stroke" stroke="${T.room}" stroke-width="2.6" pointer-events="none">${esc(p.lbl)}</text>`;
  return s;
}
function propThumb(it,size){
  const m=Math.max(it.w,it.h)/2+.18,S=size||44;
  return `<svg width="${S}" height="${S}" viewBox="${-m} ${-m} ${m*2} ${m*2}" style="display:block">${propOps(it.ops,'pt')}${it.unk?'':''}${it.inl&&!it.txt?`<text y="${pn(.14)}" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size=".42" fill="${T.pink}">1</text>`:''}${it.txt?`<text y=".12" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size=".4" fill="${T.pink}">Aa</text>`:''}</svg>`;
}

function plan(deck,st,o){
  const id=o.id||'sp',PW=o.W,bb=deck.bbox;
  const padL=36,padT=36,padR=30,keyH=o.key===false?0:50,botH=50+keyH;
  let px=Math.min((PW-padL-padR)/bb[2],((o.maxH||9999)-padT-botH)/bb[3],o.maxPx||14);px=Math.floor(px*100)/100;
  const ox=padL-bb[0]*px,oy=padT-bb[1]*px,H=Math.ceil(padT+bb[3]*px+botH);
  const X=v=>ox+v*px,Y=v=>oy+v*px,P=m=>m*px;
  const out=deck.outdoor,WE=out?.12:.25;
  const veiled=r=>!!(st.veil&&st.veil[r.id]);
  const showR=r=>st.rooms&&st.rooms[r.id]?'f':(st.ghost?'g':null);
  const showC=c=>st.corr&&st.corr[c.id]?'f':(st.ghost?'g':null);
  const fullRects=[];deck.rooms.forEach(r=>{if(showR(r)==='f')fullRects.push(r.r);});deck.corr.forEach(c=>{if(showC(c)==='f')fullRects.push(c.r);});
  const anyRects=fullRects.slice();deck.rooms.forEach(r=>{if(showR(r)==='g')anyRects.push(r.r);});deck.corr.forEach(c=>{if(showC(c)==='g')anyRects.push(c.r);});
  const nearFull=r=>fullRects.some(q=>touchR(q,r));
  const nearAny=r=>anyRects.some(q=>touchR(q,r));
  const ptFull=(x,y)=>deck.corr.some(c=>showC(c)==='f'&&inR(c.r,x,y,.2));
  const ptAny=(x,y)=>deck.corr.some(c=>showC(c)&&inR(c.r,x,y,.2));
  const rect=(r,e,fill,extra)=>`<rect x="${f1(X(r[0]-e))}" y="${f1(Y(r[1]-e))}" width="${f1(P(r[2]+2*e))}" height="${f1(P(r[3]+2*e))}" fill="${fill}" ${extra||''}/>`;
  let propIds=[];
  let h=`<defs>
   <pattern id="${id}g" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0L4 4M4 0L0 4" stroke="${T.grate}" stroke-width=".5"/></pattern>
   <pattern id="${id}z" width="9" height="9" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="${T.sealBg}"/><rect width="3.2" height="9" fill="${T.amber}" opacity=".5"/></pattern>
   <pattern id="${id}h" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${T.wall}"/><rect width="5" height="10" fill="${T.hazard}"/></pattern>
   <pattern id="${id}q" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="6" stroke="${T.equip}" stroke-width=".9"/></pattern>
   <pattern id="${id}c" width="7" height="7" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="${T.corr}"/><line x1="0" y1="0" x2="0" y2="7" stroke="${T.wall}" stroke-width=".6" opacity=".45"/></pattern>
   <pattern id="${id}d" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 5L5 0" stroke="${T.grate}" stroke-width=".8"/></pattern>
   <marker id="${id}m" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="${T.route}"/></marker></defs>`;
  /* grade estrutural + bolhas */
  const gx0=Math.floor(bb[0]/10)*10,gy0=Math.floor(bb[1]/10)*10;
  let gi=0;
  for(let gx=gx0;gx<=bb[0]+bb[2]+.01;gx+=10){const x=X(gx);if(x<padL-6||x>PW-padR+6)continue;h+=`<line x1="${x}" y1="${padT-8}" x2="${x}" y2="${Y(bb[1]+bb[3])+8}" stroke="${T.grid}" stroke-width=".7" stroke-dasharray="14 4 2 4"/><circle cx="${x}" cy="${padT-16}" r="8" fill="${T.paper}" stroke="${T.sub}"/><text x="${x}" y="${padT-12.6}" text-anchor="middle" font-family="IBM Plex Mono" font-size="9" fill="${T.sub}">${String.fromCharCode(65+gi)}</text>`;gi++;}
  gi=1;
  for(let gy=gy0;gy<=bb[1]+bb[3]+.01;gy+=10){const y=Y(gy);if(y<padT-6||y>Y(bb[1]+bb[3])+6)continue;h+=`<line x1="${padL-8}" y1="${y}" x2="${X(bb[0]+bb[2])+8}" y2="${y}" stroke="${T.grid}" stroke-width=".7" stroke-dasharray="14 4 2 4"/><circle cx="${padL-18}" cy="${y}" r="8" fill="${T.paper}" stroke="${T.sub}"/><text x="${padL-18}" y="${y+3.4}" text-anchor="middle" font-family="IBM Plex Mono" font-size="9" fill="${T.sub}">${gi}</text>`;gi++;}

  /* continuacoes pontilhadas (fronteira do que foi explorado) */
  if(!st.ghost){
    deck.corr.forEach(c=>{if(showC(c))return;
      const [x,y,w,hh]=c.r,horiz=w>=hh,len=horiz?w:hh,cx=x+w/2,cy=y+hh/2;
      const pts=[];for(let t=0;t<=len;t+=.5){const px_=horiz?x+t:cx,py_=horiz?cy:y+t;pts.push([px_,py_]);}
      const nearTo=p=>fullRects.some(q=>inR(q,p[0],p[1],.9));
      const sel=pts.filter(p=>fullRects.some(q=>Math.hypot(Math.max(q[0]-p[0],0,p[0]-q[0]-q[2]),Math.max(q[1]-p[1],0,p[1]-q[1]-q[3]))<5.2)&&!fullRects.some(q=>inR(q,p[0],p[1],-.1)));
      if(sel.length>1){let d='';let prev=null;sel.forEach(p=>{if(!prev||Math.hypot(p[0]-prev[0],p[1]-prev[1])>.8)d+=`M${f1(X(p[0]))} ${f1(Y(p[1]))}`;else d+=`L${f1(X(p[0]))} ${f1(Y(p[1]))}`;prev=p;});
        h+=`<path d="${d}" fill="none" stroke="${T.stub}" stroke-width="1.5" stroke-dasharray="1.5 6" stroke-linecap="round"/>`;}});
  }

  /* camadas: ghost (so GM) e full */
  const layer=mode=>{
    const rooms=deck.rooms.filter(r=>showR(r)===mode),corrs=deck.corr.filter(c=>showC(c)===mode);
    let s='';
    // paredes dos corredores
    corrs.forEach(c=>s+=rect(c.r,c.open?.14:WE,T.wall));
    // vazios estruturais (poche solido)
    (deck.voids||[]).forEach((v,i)=>{const vis=mode==='f'?nearFull(v):(st.ghost&&nearAny(v)&&!nearFull(v));if(vis){s+=rect(v,WE,T.wall);if(v[2]*v[3]>40)s+=rect(v,-WE,`url(#${id}c)`);}});
    // firewall
    (deck.firewall||[]).forEach(f=>{const vis=mode==='f'?nearFull(f):(st.ghost&&nearAny(f)&&!nearFull(f));if(vis)s+=rect(f,0,`url(#${id}h)`,`stroke="${T.wall}" stroke-width="1"`);});
    // pisos dos corredores
    corrs.forEach(c=>{s+=rect(c.r,0,T.corr,`data-corr="${c.id}"${c.g?` data-grp="${c.g}"`:''}`)+rect(c.r,0,`url(#${id}g)`,'pointer-events="none"');});
    // calha de cabos
    corrs.filter(c=>c.r[2]>=20||c.r[3]>=20).forEach(c=>{const [x,y,w,hh]=c.r,hz=w>=hh;s+=`<path d="${hz?`M${f1(X(x+.6))} ${f1(Y(y+hh/2))}H${f1(X(x+w-.6))}`:`M${f1(X(x+w/2))} ${f1(Y(y+.6))}V${f1(Y(y+hh-.6))}`}" stroke="${T.cable}" stroke-width=".8" stroke-dasharray="6 3" fill="none"/>`;});
    // paredes das salas
    rooms.forEach(r=>{if(out&&r.t==='ext')return;if(r.shape==='round'){const [x,y,w,hh]=r.r;s+=`<circle cx="${f1(X(x+w/2))}" cy="${f1(Y(y+hh/2))}" r="${f1(P(w/2+WE))}" fill="${T.wall}"/>`;}else s+=rect(r.r,WE,T.wall);});
    // pisos das salas
    rooms.forEach(r=>{
      if(out&&r.t==='ext'){s+=rect(r.r,0,T.deck,`data-room="${r.id}" stroke="${T.sub}" stroke-width="1" stroke-dasharray="6 4"`)+rect(r.r,0,`url(#${id}d)`,'pointer-events="none"');return;}
      const fill=r.st==='sealed'||r.t==='off'&&r.st?`url(#${id}z)`:T.room;
      if(r.shape==='round'){const [x,y,w,hh]=r.r;s+=`<circle cx="${f1(X(x+w/2))}" cy="${f1(Y(y+hh/2))}" r="${f1(P(w/2-WE))}" fill="${fill}" data-room="${r.id}"/>`;}
      else s+=rect(r.r,-WE,fill,`data-room="${r.id}"`);});
    // vestibulo de escada: degraus
    // portas
    rooms.forEach(r=>{if(out&&r.t==='ext')return;(r.d||[]).forEach(d=>{s+=door(r,d);});});
    rooms.forEach(r=>{if(r.cab)s+=windows(r);});
    // equipamento
    if(mode==='f')rooms.forEach(r=>{const eq=window.STATION_EQ[r.eq];if(!eq||(st.noeq&&st.noeq[r.id])||veiled(r))return;const a=api(r);try{eq(r,a.api,r.r[2],r.r[3]);}catch(e){}const kid=`${id}k${r.id}`;s+=`<clipPath id="${kid}"><path clip-rule="evenodd" d="${clipPath(r)}"/></clipPath><g pointer-events="none" clip-path="url(#${kid})">${a.get()}</g>`;});
    // etiquetas
    rooms.forEach(r=>{s+=label(r,mode);});
    // codigos de corredor
    if(mode==='f')corrs.forEach(c=>{if(!c.n||c.r[2]*c.r[3]<30)return;const [x,y,w,hh]=c.r,hz=w>=hh;if((hz?w:hh)<14)return;
      const cx=X(x+w/2),cy=Y(y+hh/2);s+=`<text x="${f1(cx)}" y="${f1(cy+2.6)}" text-anchor="middle" font-family="IBM Plex Mono" font-size="7" fill="${T.sub}" letter-spacing=".22em" ${hz?'':`transform="rotate(-90 ${f1(cx)} ${f1(cy)})"`} pointer-events="none">${esc(c.n)}</text>`;});
    return s;
  };
  function api(r){const [rx,ry,rw,rh]=r.r,sealed=r.st==='sealed';let o_='';
    const dash=sealed?' stroke-dasharray="3 2"':'';
    const S=`fill="none" stroke="${T.equip}" stroke-width="${sealed?.7:.95}"${dash}`,F=`fill="${T.eqFill}" stroke="${T.equip}" stroke-width="${sealed?.7:.95}"${dash}`;
    const ax=v=>f1(X(rx+v)),ay=v=>f1(Y(ry+v));
    const a={
      rc:(x,y,w,hh,rx_,f)=>{o_+=`<rect x="${ax(x)}" y="${ay(y)}" width="${f1(P(w))}" height="${f1(P(hh))}" ${rx_?`rx="${f1(P(rx_))}"`:''} ${f?F:S}/>`;},
      ci:(x,y,rr,f,dsh)=>{o_+=`<circle cx="${ax(x)}" cy="${ay(y)}" r="${f1(P(rr))}" ${f?F:S}${dsh?' stroke-dasharray="4 3"':''}/>`;},
      ln:(x1,y1,x2,y2)=>{o_+=`<path d="M${ax(x1)} ${ay(y1)}L${ax(x2)} ${ay(y2)}" ${S}/>`;},
      wall:(x1,y1,x2,y2)=>{o_+=`<path d="M${ax(x1)} ${ay(y1)}L${ax(x2)} ${ay(y2)}" stroke="${T.wall}" stroke-width="1.7" fill="none"/>`;},
      line2:(x1,y1,x2,y2)=>{o_+=`<path d="M${ax(x1)} ${ay(y1)}L${ax(x2)} ${ay(y2)}" stroke="${T.amber}" stroke-width="1.6" stroke-dasharray="6 4" fill="none"/>`;},
      tx:(x,y,t,sz,b,mid)=>{o_+=`<text x="${ax(x)}" y="${ay(y)}" text-anchor="${mid?'middle':'start'}" font-family="Barlow Condensed" font-weight="${b?700:500}" font-size="${sz*px/6.6}" fill="${T.equip}">${esc(t)}</text>`;},
      hatch:(x,y,w,hh)=>{o_+=`<rect x="${ax(x)}" y="${ay(y)}" width="${f1(P(w))}" height="${f1(P(hh))}" fill="url(#${id}q)" stroke="${T.equip}" stroke-width=".7"/>`;},
      arrow:(x1,y1,x2,y2,dn)=>{o_+=`<path d="M${ax(x1)} ${ay(y1)}L${ax(x2)} ${ay(y2)}" stroke="${T.route}" stroke-width="1.3" fill="none" marker-end="url(#${id}m)"/>`;}
    };
    return {api:a,get:()=>o_};}
  function clipPath(r){
    const [x,y,w,hh]=r.r,m=WE;
    let d=`M${f1(X(x+m))} ${f1(Y(y+m))}H${f1(X(x+w-m))}V${f1(Y(y+hh-m))}H${f1(X(x+m))}Z`;
    (r.d||[]).forEach(([sd,t,k])=>{if(k==='weld')return;const dw=(DW[k]||1.3)+.3,dep=(DW[k]||1.3)+.5,horiz=(sd==='n'||sd==='s');
      const cx=horiz?x+w*t:(sd==='w'?x:x+w),cy=horiz?(sd==='n'?y:y+hh):y+hh*t;
      let rx,ry,rw,rh;if(horiz){rx=cx-dw/2;rw=dw;rh=dep;ry=sd==='n'?y:y+hh-dep;}else{ry=cy-dw/2;rh=dw;rw=dep;rx=sd==='w'?x:x+w-dep;}
      d+=`M${f1(X(rx))} ${f1(Y(ry))}h${f1(P(rw))}v${f1(P(rh))}h${f1(-P(rw))}Z`;});
    return d;}
  function windows(r){
    const [x,y,w,hh]=r.r,c=r.cab,n=c.n;let o_='';
    const opp={n:'s',s:'n',e:'w',w:'e'}[c.side],horiz=(opp==='n'||opp==='s');
    for(let i=0;i<n;i++){const t=(i+.5)/n;const cx=horiz?x+w*t:(opp==='w'?x:x+w),cy=horiz?(opp==='n'?y:y+hh):y+hh*t,ww=1.3;
      if(horiz){const x0=X(cx-ww/2),x1=X(cx+ww/2),yy=Y(cy);o_+=`<rect x="${f1(x0)}" y="${f1(yy-P(.32))}" width="${f1(x1-x0)}" height="${f1(P(.64))}" fill="${T.room}"/><path d="M${f1(x0)} ${f1(yy-P(.14))}H${f1(x1)}M${f1(x0)} ${f1(yy+P(.14))}H${f1(x1)}" stroke="${T.wall}" stroke-width=".8"/><path d="M${f1(x0)} ${f1(yy-P(.32))}V${f1(yy+P(.32))}M${f1(x1)} ${f1(yy-P(.32))}V${f1(yy+P(.32))}" stroke="${T.wall}" stroke-width="1.2"/>`;}
      else{const y0=Y(cy-ww/2),y1=Y(cy+ww/2),xx=X(cx);o_+=`<rect x="${f1(xx-P(.32))}" y="${f1(y0)}" width="${f1(P(.64))}" height="${f1(y1-y0)}" fill="${T.room}"/><path d="M${f1(xx-P(.14))} ${f1(y0)}V${f1(y1)}M${f1(xx+P(.14))} ${f1(y0)}V${f1(y1)}" stroke="${T.wall}" stroke-width=".8"/><path d="M${f1(xx-P(.32))} ${f1(y0)}H${f1(xx+P(.32))}M${f1(xx-P(.32))} ${f1(y1)}H${f1(xx+P(.32))}" stroke="${T.wall}" stroke-width="1.2"/>`;}}
    return o_;}
  function door(r,d){
    const [s,t,k,to]=d,[x,y,w,hh]=r.r;
    const dw=DW[k]||1.3;
    const horiz=(s==='n'||s==='s');
    const cx=horiz?x+w*t:(s==='w'?x:x+w),cy=horiz?(s==='n'?y:y+hh):y+hh*t;
    const nx=s==='w'?-1:(s==='e'?1:0),ny=s==='n'?-1:(s==='s'?1:0); // normal para fora
    const tx=horiz?1:0,ty=horiz?0:1;
    // gap = wall region
    const gap=(c0,c1)=>{ // c0..c1 em coordenadas ao longo da normal, relativo ao bordo
      const a0=[cx-tx*dw/2+nx*c0,cy-ty*dw/2+ny*c0],a1=[cx+tx*dw/2+nx*c1,cy+ty*dw/2+ny*c1];
      return [Math.min(a0[0],a1[0]),Math.min(a0[1],a1[1]),Math.abs(a1[0]-a0[0]),Math.abs(a1[1]-a0[1])];};
    const outC=to==='c'?T.corr:(out?T.deck:T.room);
    let o_='';
    if(k==='weld'){const g=gap(-.31,.31);o_+=rect(g,0,`url(#${id}z)`,`stroke="${T.wall}" stroke-width=".8"`);return o_;}
    const gOut=gap(0,.31),gIn=gap(-.31,0);
    o_+=rect(gOut,0,outC)+rect(gIn,0,T.room);
    // batentes
    const j=(sx)=>`M${f1(X(cx+tx*sx*dw/2-nx*.31))} ${f1(Y(cy+ty*sx*dw/2-ny*.31))}L${f1(X(cx+tx*sx*dw/2+nx*.31))} ${f1(Y(cy+ty*sx*dw/2+ny*.31))}`;
    o_+=`<path d="${j(-1)}${j(1)}" stroke="${T.wall}" stroke-width="1.2" fill="none"/>`;
    if(k==='open')return o_;
    if(k==='gate'){const g=gap(-.1,.1);o_+=rect(g,0,'none',`stroke="${T.amber}" stroke-width="2" stroke-dasharray="4 3"`)+`<circle cx="${f1(X(cx))}" cy="${f1(Y(cy))}" r="${f1(P(.45))}" fill="${T.room}" stroke="${T.amber}" stroke-width="1.4"/>`;return o_;}
    const leaf=(hx,hy,ex,ey,len)=>{ // dobradica H, ponta da porta E, abre para dentro (-normal)
      const lx=hx-nx*len,ly=hy-ny*len;const cr=(lx-hx)*(ey-hy)-(ly-hy)*(ex-hx);
      return `<path d="M${f1(X(hx))} ${f1(Y(hy))}L${f1(X(lx))} ${f1(Y(ly))}M${f1(X(lx))} ${f1(Y(ly))}A${f1(P(len))} ${f1(P(len))} 0 0 ${cr>0?1:0} ${f1(X(ex))} ${f1(Y(ey))}" fill="none" stroke="${T.door}" stroke-width=".9"/>`;};
    if(k==='double'){const hx1=cx-tx*dw/2,hy1=cy-ty*dw/2,hx2=cx+tx*dw/2,hy2=cy+ty*dw/2;o_+=leaf(hx1,hy1,cx,cy,dw/2)+leaf(hx2,hy2,cx,cy,dw/2);}
    else if(k==='hatch'){o_+=`<circle cx="${f1(X(cx))}" cy="${f1(Y(cy))}" r="${f1(P(.5))}" fill="none" stroke="${T.door}" stroke-width="1"/>`;}
    else o_+=leaf(cx-tx*dw/2,cy-ty*dw/2,cx+tx*dw/2,cy+ty*dw/2,dw);
    return o_;
  }
  function label(r,mode){
    if(out&&r.t==='ext'&&mode!=='f')return '';
    const [x,y,w,hh]=r.r;
    if(veiled(r)&&mode==='f'&&r.t!=='stair'){const nm=r.n.split(' · ').filter((q,i)=>!(i===0&&/^Md+$/.test(q))).join(' · '),wpx=P(w),hpx=P(hh);let fs=Math.max(7.5,Math.min(15,wpx/(nm.length*.58)));let lines=[nm];
      if(nm.length*.58*fs>wpx*.9){const wd=nm.split(' ');const mid=Math.ceil(wd.length/2);lines=wd.length>1?[wd.slice(0,mid).join(' '),wd.slice(mid).join(' ')]:[nm];fs=Math.max(7,Math.min(14,wpx*.9/(Math.max(...lines.map(l=>l.length))*.6)));}
      const cx=X(x+w/2),cy=Y(y+hh/2)-(lines.length-1)*(fs+1)/2+fs*.34;
      return `<g pointer-events="none">${lines.map((l,i)=>`<text x="${f1(cx)}" y="${f1(cy+i*(fs+1.6))}" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="${f1(fs)}" fill="${T.label}" letter-spacing=".08em" style="text-transform:uppercase" paint-order="stroke" stroke="${T.room}" stroke-width="3.2" stroke-linejoin="round">${esc(l)}</text>`).join('')}</g>`;}
    if(r.t==='stair'){const txt=(r.dir==='dn'?'DN ':'UP ')+(r.to||'');const cx=X(x+w/2),cy=Y(y+hh/2);return `<text x="${f1(cx)}" y="${f1(cy+2)}" text-anchor="middle" font-family="IBM Plex Mono" font-size="6.8" fill="${T.label}" letter-spacing=".14em" transform="rotate(-90 ${f1(cx)} ${f1(cy)})" paint-order="stroke" stroke="${T.room}" stroke-width="2.6" pointer-events="none">${txt}</text>`;}
    const parts=r.n.split(' · ');const code=/^M\d+$/.test(parts[0])?parts[0]:'';const name=(code?parts.slice(1).join(' · '):r.n);
    const area=Math.round(w*hh);
    const wpx=P(w);let fs=Math.max(7,Math.min(10.5,wpx/(name.length*.6)));
    let lines=[name];if(name.length*.58*fs>wpx*.94){const alt=name.split(' · ').length>1?name.split(' · '):name.split(' ');if(alt.length>1){const mid=Math.ceil(alt.length/2);lines=[alt.slice(0,mid).join(' '),alt.slice(mid).join(' ')];}
      fs=Math.max(6.6,Math.min(fs*1.2,wpx/(Math.max(...lines.map(l=>l.length))*.6)));}
    const pos=r.lp||(r.eq==='cabins'||w*hh<260?'c':'br');
    let ax,ay,an;
    if(pos==='br'){ax=X(x+w)-6;ay=Y(y+hh)-12-(lines.length-1)*(fs+1.6);an='end';}else if(pos==='t'){ax=X(x+w/2);ay=Y(y)+P(2.9);an='middle';}else{ax=X(x+w/2);ay=Y(y+hh/2)-(lines.length-1)*(fs+1)/2;an='middle';}
    const halo=out&&r.t==='ext'?T.deck:T.room;
    let s=`<g pointer-events="none">`;
    lines.forEach((l,i)=>{s+=`<text x="${f1(ax)}" y="${f1(ay+i*(fs+1.6))}" text-anchor="${an}" font-family="Barlow Condensed" font-weight="700" font-size="${f1(fs)}" fill="${T.label}" letter-spacing=".06em" style="text-transform:uppercase" paint-order="stroke" stroke="${halo}" stroke-width="3.2" stroke-linejoin="round">${esc(l)}</text>`;});
    const sub=(code?code+' · ':'')+area+' m²';
    s+=`<text x="${f1(ax)}" y="${f1(ay+lines.length*(fs+1.6)-1.2)}" text-anchor="${an}" font-family="IBM Plex Mono" font-size="6.6" fill="${T.sub}" letter-spacing=".08em" paint-order="stroke" stroke="${halo}" stroke-width="2.6">${sub}</text></g>`;
    return s;
  }

  if(st.ghost)h+=`<g opacity=".32">${layer('g')}</g>`;
  h+=layer('f');
  /* props do customizador */
  if(st.props&&st.props.length){const inRev=p=>deck.rooms.some(r=>showR(r)==='f'&&!veiled(r)&&inR(r.r,p.x,p.y,.3))||(ptFull(p.x,p.y)&&!deck.rooms.some(r=>veiled(r)&&inR(r.r,p.x,p.y,.3)));
    const list=st.props.filter(p=>p.deck===deck.id&&(st.ghost||inRev(p)));propIds=list.map(p=>p.id);
    if(list.length)h+=`<g class="props"${st.ghost?'':' pointer-events="none"'}>${list.map(p=>propG(p,{px,X,Y,P,pid:id,hit:!!st.ghost})).join('')}</g>`;}

  /* GM: selo nas salas cobertas (os jogadores veem so o nome) */
  if(st.veilMark)deck.rooms.forEach(r=>{if(showR(r)==='f'&&st.veilMark[r.id]){const x=X(r.r[0])+5,y=Y(r.r[1])+5;h+=`<g pointer-events="none"><rect x="${f1(x)}" y="${f1(y)}" width="44" height="11" fill="${T.amber}"/><text x="${f1(x+22)}" y="${f1(y+8.4)}" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="9.5" letter-spacing=".12em" fill="${T.youText}">COBERTA</text></g>`;}});
  /* fire doors do firewall */
  (deck.fireDoors||[]).forEach(f=>{if(!(st.ghost?ptAny(f.x,f.y):ptFull(f.x,f.y)))return;
    const x=X(f.x),y=Y(f.y);h+=`<g pointer-events="none"><rect x="${f1(x-P(.2))}" y="${f1(y-P(1.2))}" width="${f1(P(.4))}" height="${f1(P(2.4))}" fill="url(#${id}h)" stroke="${T.wall}" stroke-width="1"/><text x="${f1(x+P(1.2))}" y="${f1(y-P(1.5))}" font-family="IBM Plex Mono" font-size="6.6" fill="${T.label}" paint-order="stroke" stroke="${T.corr}" stroke-width="2.4">${f.id}</text></g>`;});
  /* escadas soltas (simbolo em cima do corredor) */
  (deck.stairs||[]).forEach(sx=>{if(!(st.ghost?ptAny(sx.x,sx.y):ptFull(sx.x,sx.y)))return;
    const x0=X(sx.x-sx.w/2),y0=Y(sx.y-sx.h/2),w=P(sx.w),hh=P(sx.h);
    h+=`<g pointer-events="none"><rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(w)}" height="${f1(hh)}" fill="${T.room}" stroke="${T.wall}" stroke-width="1.3"/>${Array.from({length:8},(_,i)=>`<line x1="${f1(x0)}" y1="${f1(y0+(i+1)*hh/9)}" x2="${f1(x0+w)}" y2="${f1(y0+(i+1)*hh/9)}" stroke="${T.wall}" stroke-width=".7"/>`).join('')}<path d="M${f1(x0+w/2)} ${f1(y0+hh-3)}V${f1(y0+4)}M${f1(x0+w/2-2.6)} ${f1(y0+7.4)}L${f1(x0+w/2)} ${f1(y0+3.6)}L${f1(x0+w/2+2.6)} ${f1(y0+7.4)}" stroke="${T.route}" stroke-width="1.3" fill="none"/><text x="${f1(x0+w+4)}" y="${f1(y0+hh/2+2.4)}" font-family="IBM Plex Mono" font-size="6.6" fill="${T.label}" paint-order="stroke" stroke="${T.corr}" stroke-width="2.4">${sx.dir==='dn'?'DN':'UP'} ${sx.lbl||''}</text></g>`;});
  /* extintores e botoeiras */
  (deck.fire||[]).forEach(([x,y])=>{if(st.ghost?!ptAny(x,y):!ptFull(x,y))return;h+=`<rect x="${f1(X(x)-3.2)}" y="${f1(Y(y)-3.2)}" width="6.4" height="6.4" fill="${T.fire}" stroke="${T.wall}" stroke-width=".6" pointer-events="none"/>`;});
  (deck.mcp||[]).forEach(([x,y])=>{if(st.ghost?!ptAny(x,y):!ptFull(x,y))return;h+=`<g pointer-events="none"><circle cx="${f1(X(x))}" cy="${f1(Y(y))}" r="3.3" fill="${T.fire}" stroke="${T.wall}" stroke-width=".6"/><circle cx="${f1(X(x))}" cy="${f1(Y(y))}" r="1.1" fill="${T.room}"/></g>`;});
  /* rotas de fuga */
  (deck.esc||[]).forEach(e=>{if(!e.need.every(n=>st.corr&&st.corr[n]||st.ghost))return;
    const d=e.pts.map((p,i)=>(i?'L':'M')+f1(X(p[0]))+' '+f1(Y(p[1]))).join('');
    h+=`<path d="${d}" fill="none" stroke="${T.route}" stroke-width="${e.k==='p'?2.6:2}" ${e.k==='s'?'stroke-dasharray="7 5"':''} stroke-linejoin="round" marker-end="url(#${id}m)" opacity="${e.k==='p'?1:.85}" pointer-events="none"/>`;});
  /* cameras */
  if(st.showCams)(deck.cams||[]).forEach(c=>{if(!(st.camsOn&&st.camsOn[c.id]))return;const vis=c.room?(st.rooms&&st.rooms[c.room]):(st.corr&&st.corr[c.corr]);if(!vis&&!st.ghost)return;
    const x=X(c.x),y=Y(c.y);h+=`<g pointer-events="none"><rect x="${f1(x-9)}" y="${f1(y-7)}" width="18" height="14" fill="${T.room}" stroke="${T.amber}" stroke-width="1.3"/><path d="M${f1(x-5)} ${f1(y-3)}h7v6h-7zM${f1(x+2)} ${f1(y-1)}l4 -2v6l-4 -2z" fill="none" stroke="${T.amber}"/><text x="${f1(x)}" y="${f1(y+18)}" text-anchor="middle" font-family="IBM Plex Mono" font-size="6.8" fill="${T.amber}" paint-order="stroke" stroke="${T.corr}" stroke-width="2.4">${c.id.toUpperCase().replace('CAM','CAM-')}</text></g>`;});
  /* selecao */
  if(st.sel){const r=deck.rooms.find(q=>q.id===st.sel);if(r&&(showR(r))){const x=X(r.r[0]),y=Y(r.r[1]),w=P(r.r[2]),hh=P(r.r[3]),k=Math.min(13,w/3,hh/3);
    h+=`<g stroke="${T.sel}" fill="none" stroke-width="2.4" pointer-events="none"><path d="M${f1(x-6)} ${f1(y+k)}V${f1(y-6)}H${f1(x+k)}M${f1(x+w+6)} ${f1(y+k)}V${f1(y-6)}H${f1(x+w-k)}M${f1(x-6)} ${f1(y+hh-k)}V${f1(y+hh+6)}H${f1(x+k)}M${f1(x+w+6)} ${f1(y+hh-k)}V${f1(y+hh+6)}H${f1(x+w-k)}"/></g>`;}}
  /* voce esta aqui */
  if(st.pin&&st.pin.deck===deck.id){const x=X(st.pin.x),y=Y(st.pin.y),left=x>PW*.38;
    const tx=left?x-106:x+30,ty=y-46;
    h+=`<g pointer-events="none"><circle class="ping" cx="${f1(x)}" cy="${f1(y)}" r="9" fill="none" stroke="${T.you}" stroke-width="1.6"/><circle cx="${f1(x)}" cy="${f1(y)}" r="9" fill="none" stroke="${T.you}" stroke-width="1.6"/><circle cx="${f1(x)}" cy="${f1(y)}" r="3.8" fill="${T.you}"/><path d="M${f1(x+(left?-6:6))} ${f1(y-6)}L${f1(left?x-30:x+30)} ${f1(y-32)}" stroke="${T.you}" stroke-width="1"/><rect x="${f1(tx)}" y="${f1(ty)}" width="76" height="14" fill="${T.you}"/><text x="${f1(tx+38)}" y="${f1(ty+10.5)}" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="10.5" letter-spacing=".1em" fill="${T.youText}">YOU ARE HERE</text></g>`;}
  /* cotas, escala, figura, norte */
  const bx=X(bb[0]),by=Y(bb[1]+bb[3])+16;
  const dim=(x1,x2,t)=>`<g stroke="${T.sub}" stroke-width=".8" fill="none"><path d="M${f1(X(x1))} ${f1(by)}H${f1(X(x2))}M${f1(X(x1))} ${f1(by-4)}V${f1(by+4)}M${f1(X(x2))} ${f1(by-4)}V${f1(by+4)}M${f1(X(x1)-3)} ${f1(by+3)}l6 -6M${f1(X(x2)-3)} ${f1(by+3)}l6 -6"/></g><rect x="${f1((X(x1)+X(x2))/2-18)}" y="${f1(by-5)}" width="36" height="10" fill="${T.paper}"/><text x="${f1((X(x1)+X(x2))/2)}" y="${f1(by+3)}" text-anchor="middle" font-family="IBM Plex Mono" font-size="7.6" fill="${T.sub}">${t}</text>`;
  h+=dim(bb[0],bb[0]+bb[2],f1(bb[2])+' m');
  h+=`<g transform="translate(${f1(X(bb[0])-26)} ${f1(Y(bb[1]+bb[3]/2))}) rotate(-90)"><path d="M${f1(-P(bb[3])/2)} 0H${f1(P(bb[3])/2)}M${f1(-P(bb[3])/2)} -4V4M${f1(P(bb[3])/2)} -4V4" stroke="${T.sub}" stroke-width=".8"/><rect x="-18" y="-5" width="36" height="10" fill="${T.paper}"/><text y="3" text-anchor="middle" font-family="IBM Plex Mono" font-size="7.6" fill="${T.sub}">${f1(bb[3])} m</text></g>`;
  const sy=by+26;
  h+=`<g stroke="${T.ink}" stroke-width="1.2"><path d="M${f1(bx)} ${sy}H${f1(bx+P(20))}M${f1(bx)} ${sy-4}V${sy+4}M${f1(bx+P(10))} ${sy-3}V${sy+3}M${f1(bx+P(20))} ${sy-4}V${sy+4}"/></g><rect x="${f1(bx)}" y="${sy-2}" width="${f1(P(10))}" height="4" fill="${T.ink}"/><text x="${f1(bx+P(20)+8)}" y="${sy+3}" font-family="IBM Plex Mono" font-size="8" fill="${T.sub}">20 m</text>`;
  h+=`<g transform="translate(${f1(bx+P(20)+66)} ${sy})"><ellipse rx="${f1(.3*px+1.2)}" ry="${f1(.2*px+.8)}" fill="${T.ink}"/><circle r="${f1(.12*px+.8)}" fill="${T.paper}"/><text x="14" y="3" font-family="IBM Plex Mono" font-size="8" fill="${T.sub}">1.8 m</text></g>`;
  h+=`<g transform="translate(${f1(PW-padR-8)} ${sy-4})"><circle r="9" fill="none" stroke="${T.sub}"/><path d="M0 -8L3 3L0 1L-3 3Z" fill="${T.ink}"/><text y="-12" text-anchor="middle" font-family="IBM Plex Mono" font-size="7.5" fill="${T.sub}">N</text></g>`;
  /* legenda */
  if(o.key!==false){const ky=H-34;
    const it=[[`<path d="M0 0H30" stroke="${T.route}" stroke-width="2.6" marker-end="url(#${id}m)"/>`,'Escape route',38],[`<path d="M0 0H30" stroke="${T.route}" stroke-width="2" stroke-dasharray="7 5"/>`,'Secondary',38],
      [`<rect x="2" y="-6" width="12" height="12" fill="${T.room}" stroke="${T.wall}"/><path d="M4 4H7V1H10V-2H12" fill="none" stroke="${T.route}"/>`,'Stairs',20],[`<rect x="0" y="-5" width="14" height="10" fill="url(#${id}h)" stroke="${T.wall}"/>`,'Fire door',20],
      [`<rect x="2" y="-3.5" width="7" height="7" fill="${T.fire}" stroke="${T.wall}" stroke-width=".6"/>`,'Extinguisher',20],[`<circle cx="5" cy="0" r="3.6" fill="${T.fire}" stroke="${T.wall}" stroke-width=".6"/>`,'Call point',20],
      [`<rect x="0" y="-5" width="14" height="10" fill="url(#${id}z)" stroke="${T.wall}"/>`,'Sealed',20],[`<path d="M0 0H30" stroke="${T.stub}" stroke-width="1.5" stroke-dasharray="1.5 6" stroke-linecap="round"/>`,'Not surveyed',38]];
    const widths=[100,86,60,70,92,80,62,90],tot=widths.reduce((a,b)=>a+b,0),sc=Math.min(1,(PW-60-42)/tot);let cx=66;
    h+=`<line x1="${padL-2}" y1="${ky-18}" x2="${PW-padR+2}" y2="${ky-18}" stroke="${T.grid}"/><text x="${padL}" y="${ky+3}" font-family="Barlow Condensed" font-weight="700" font-size="10" letter-spacing=".22em" fill="${T.sub}">KEY</text>`;
    it.forEach((q,i)=>{h+=`<g transform="translate(${f1(cx)} ${ky})">${q[0]}<text x="${q[2]}" y="3" font-family="Barlow Condensed" font-weight="600" font-size="11" fill="${T.label}" letter-spacing=".05em">${q[1]}</text></g>`;cx+=widths[i]*sc;});
  }
  h+=`<text x="${PW-padR}" y="${H-6}" text-anchor="end" font-family="IBM Plex Mono" font-size="7.5" fill="${T.sub}" letter-spacing=".1em">${esc(deck.dwg)} · REV 3 · ${esc(deck.name.toUpperCase())} ${esc(deck.elev)} · SCALE 1:500 @A1</text>`;
  return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${H}" viewBox="0 0 ${PW} ${H}" style="display:block;background:${T.paper}">${h}</svg>`,w:PW,h:H,px,ox,oy,toDeck:(sx,sy)=>[(sx-ox)/px,(sy-oy)/px],props:propIds};
}
window.StationRender={plan,T,propThumb,propG,setTheme};
})();
