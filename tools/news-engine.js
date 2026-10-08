/* ===================== Motor do jornal v2 =====================
   O CANVAS É A FONTE DA VERDADE: cada objeto gerado carrega `__newsRole` (ex. 'lead.headline',
   'lead.body', 'index', 'ad.1', 'photo.1'). Antes de refazer o layout, `newsHarvest()` lê o texto
   atual de cada role (colunas do mesmo corpo se juntam por `__flowIdx`), então trocar de preset NÃO
   perde o que o Max editou; fotos que ele trocou são reencaixadas no novo layout. Roles que o preset
   novo não mostra ficam guardados no estado (`__newsState.content`, no objeto de fundo, que entra no
   desfazer). Texto que não cabe: o tamanho do corpo diminui; se ainda sobrar, corta no fim de linha e
   escreve "Continued on A5 »" — o texto completo continua guardado e volta quando o layout permitir.
   Medida e desenho usam a MESMA função (newsBreakLines, news-text.js).
   Grade: 6 colunas de 165 px, calha 22, margem 70 (A4 = 1240×1754).
   Fotos: cinza com grão (não meio-tom de pontos: o ponto vira moiré em zoom baixo; o filtro Meio-tom
   continua no painel de filtros da foto pra quem quiser). */

const NEWS_G = {M:70, W:1100, GUT:22, COL:165, TOP:232, BOTTOM:1668};
const newsX = (i)=> NEWS_G.M + i*(NEWS_G.COL + NEWS_G.GUT);
const newsW = (n)=> n*NEWS_G.COL + (n-1)*NEWS_G.GUT;
const NEWS_RED = '#8a1f1a', NEWS_INK = '#161412';
const NEWS_FONT_SPECS = [
  "400 16px 'Old Standard TT'", "italic 400 16px 'Old Standard TT'", "700 16px 'Old Standard TT'",
  "600 16px 'Libre Franklin'", "700 16px 'Libre Franklin'", "900 16px 'Libre Franklin'",
  "500 16px 'Barlow Condensed'", "600 16px 'Barlow Condensed'", "700 16px 'Barlow Condensed'",
  "700 16px 'UnifrakturCook'", "900 16px 'Playfair Display'",
];

/* Conteúdo padrão (inglês, o que o jogador vê). Chaves: `role` = texto; `role:title` = título da caixa. */
const NEWS_DEFAULTS = {
  'mast.name': 'The Abyssal Post',
  'mast.tag': 'Serving the platform and the coast since 1954',
  'ear.l:title': 'WEATHER', 'ear.l': 'Partly cloudy\nHigh 54° · Low 41°\nFog after midnight',
  'ear.r:title': 'ONE COPY', 'ear.r': '25¢\nVol. XCII, No. 118\nThursday edition',
  'folio.l': 'THURSDAY, MARCH 14', 'folio.c': 'PUBLISHED WEEKLY FOR THE PLATFORM AND THE COAST', 'folio.r': 'VOL. XCII · NO. 118',
  'foot.l': 'THE ABYSSAL POST  ·  MARCH 14', 'foot.r': 'A1',

  'lead.kicker': 'SPECIAL REPORT',
  'lead.headline': 'Platform loses contact with dive team',
  'lead.deck': 'Radio still transmitting static on the same channel since 03:12',
  'lead.byline': 'By Staff Reporter',
  'lead.body': 'The dive team assigned to the lower deck failed to return yesterday morning. Contact with base was lost at 03:12, according to night-shift logs, and has not been restored.\n' +
    'No bodies have been recovered. The company operating the platform declined to comment on the incident and referred questions to its offices on the mainland.\n' +
    'Coastal residents report hearing a continuous sound from the sea overnight, described by one fisherman as “a low choir, almost a breathing.” Others say the sound stopped at dawn.\n' +
    'Drilling operations continue as normal, according to an internal memo seen by this newspaper. The memo is dated three days before the incident.\n' +
    'Independent experts have questioned the official account. A retired dive supervisor, who asked not to be named, said the team would not have descended without a direct order from supervision.\n' +
    'Operations manager Elias Brandt, reached by telephone, said the platform was “operating within parameters.” Asked whether the dive team had been under orders to descend, he said the question was “not one for the press.”\n' +
    'The six divers were employed through a subsea contractor, which has not responded to repeated requests for comment. Its mainland office was closed on Wednesday afternoon.\n' +
    'Residents of Harbor Street said the supply boat’s lights could be seen from the pier until after midnight. One woman, who gave her name only as Mrs. Aldous, said she counted seven figures on the loading dock. The crew roster lists six.\n' +
    'The Harbor Office said the next supply boat is scheduled to leave at 06:00 on Friday. It could not say whether the boat will be allowed to dock.\n' +
    'Relatives of the six crew members were told on Wednesday that a statement would follow. As of press time, none has been issued.',
  'photo.1.cap': 'The Deserto platform, photographed from the supply boat on a clear morning. No rescue vessel has been sent to the site. Photo: Harbor Office',
  'photo.2.cap': 'Harbor Street, Wednesday evening. The foghorn was not sounded.',

  's2.headline': 'Coast Guard calls off second search', 's2.byline': 'By Dale Hennessey',
  's2.body': 'The Coast Guard cutter Harrier returned to port at dusk Wednesday after a second search failed to locate the platform’s lower deck on sonar. Commander Ruth Aldane said conditions were “unremarkable” and that the equipment had been checked twice.\n' +
    'The cutter will not return unless requested by the operator. “We go where we are called,” Aldane said. The operator has made no request.\n' +
    'A spokesman for the Harbor Board said the platform’s position had not changed, “as far as anyone can tell.”\n' +
    'Residents have been advised to avoid the lower shore road after dark, a precaution the board described as “routine.” The road has been closed to traffic since Monday.\n' +
    'The cutter’s sonar operator declined to be interviewed. Her log, filed at 21:15, lists the second search as “complete.” It lists the first as “ongoing.”',
  's3.headline': 'Harbor Board defers vote on ferry schedule', 's3.byline': 'Staff',
  's3.body': 'The Harbor Board voted 4–1 on Tuesday to postpone a decision on the winter ferry schedule until April, citing conflicting readings from the channel markers.\n' +
    'The lone dissent came from board member Alice Verne, who asked that the minutes record the time of the vote as 3:12 a.m., although the meeting adjourned at 9:40 p.m. The clerk said the discrepancy would be corrected.\n' +
    'Other business: the board approved $2,400 for repainting the harbor lamp posts, accepted a donation of folding chairs from the Legion post, and tabled a request from the platform operator to extend its docking hours “until further notice.”\n' +
    'The next meeting is scheduled for Tuesday, March 19, at 7 p.m. in the harbor office. The public is reminded that the harbor office clock runs eleven minutes slow.',
  's4.headline': 'Walter M. Kessler, 67', 's4.byline': 'Obituary',
  's4.body': 'Walter M. Kessler, 67, of Harbor Street, died Tuesday at home. A former rigger on the platform, he is survived by a sister and two nephews. Services will be private.\n' +
    'Mr. Kessler was born in the town in 1949 and worked the platform for 31 years until his retirement. He was a member of the Legion and sang in the choir at St. Brendan’s for many winters. Neighbors said he had been unwell since February and had stopped answering the door after dark.\n' +
    'He is preceded in death by his wife, Margaret. Memorial contributions may be made to the Harbor Lamp Fund. The family asks that no one visit the shore.',
  'pq': '“We heard it all night. Not the pumps. Something under the water, breathing.”\n— Deckhand, name withheld',
  'brief:title': 'IN BRIEF',
  'brief': 'Fish fry. The Legion post resumes its Friday fish fry at 6 p.m.\nLost. Brown terrier, answers to Pilot. Last seen on the pier at 03:12.\nTides. Today: high 05:41, low 11:58. Friday’s table is not available.\nFoghorn. It will not be sounded this week.',
  'index:title': 'INSIDE', 'index': 'Editorial|A5\nObituaries|A4\nLetters|A5\nWeather and tides|A6\nClassifieds|A7\nSports|B1',
  'tide:title': 'TIDE TABLE', 'tide': 'Thu 14|H 05:41 · L 11:58\nFri 15|not available\nSat 16|not available\nSun 17|H 03:12',
  'ad.1:title': 'LOST', 'ad.1': 'One diver’s watch, steel, engraved on the back. Reward. Ask at the Harbor Office.',
  'ad.2:title': 'WANTED', 'ad.2': 'Night cook for the dining deck. No experience required. No questions asked.',
  'ad.3:title': 'FOR SALE', 'ad.3': 'Rowboat, 12 ft, sound hull. Never used after dark. $140 or best offer.',
  'cls.title': 'CLASSIFIEDS',
  'cls': 'FOR RENT. Two rooms over the chandlery, quiet. Inquire within. Not available after dark.\n' +
    'LOST. Gold wedding band, Harbor Street, Tuesday night. Sentimental value.\n' +
    'HELP WANTED. Deckhand, six weeks, good pay. Apply at the Harbor Office, ask for Mr. Brandt.\n' +
    'FOUND. A pair of diving boots on the lower shore road. Not claimed. Not ours.\n' +
    'PIANO LESSONS. All ages. Hymns a specialty. Mrs. Aldous, Church Lane.\n' +
    'WANTED. Used foghorn, any condition. Cash.\n' +
    'NOTICE. Tide tables for the week of March 18 will be posted when received.\n' +
    'SEEKING. Roommate to share house near the pier. Light sleeper preferred.\n' +
    'FOR SALE. Hymnals, forty, in good condition. The choir no longer meets.\n' +
    'LOST. Brown terrier, answers to Pilot. If found, do not follow him.',
  'xl.kicker': 'EXTRA  ·  EXTRA  ·  EXTRA', 'xl.headline': 'Dive team missing', 'xl.deck': 'Platform silent for 30 hours. The company calls it “routine.”',
};

/* ---- foto-exemplo em cinza (cena genérica: plataforma no mar, cais na neblina, retrato) ---- */
function newsDrawScene(g, cw, ch, variant, rng){
  const blobs = (y0, y1, n, light)=>{
    for (let i = 0; i < n; i++){
      const bx = rng()*cw, by = y0 + rng()*(y1-y0), r = (0.10 + rng()*0.22)*cw;
      const rg = g.createRadialGradient(bx, by, 0, bx, by, r);
      rg.addColorStop(0, light ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.22)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.fillRect(bx-r, by-r, r*2, r*2);
    }
  };
  if (variant === 1){          // cais na neblina
    const gr = g.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, '#d8d8d8'); gr.addColorStop(0.55, '#a9a9a9'); gr.addColorStop(1, '#4b4b4b');
    g.fillStyle = gr; g.fillRect(0, 0, cw, ch); blobs(0, ch*0.6, 7, true);
    g.fillStyle = '#1b1b1b'; g.beginPath(); g.moveTo(0, ch*0.74); g.lineTo(cw, ch*0.64); g.lineTo(cw, ch*0.72); g.lineTo(0, ch*0.86); g.closePath(); g.fill();
    for (let i = 0; i < 9; i++){ const t = i/8, x = cw*(0.05 + 0.9*t), y = ch*(0.76 - 0.1*t); g.fillRect(x, y - ch*(0.12 - 0.05*t), cw*0.02*(1-0.4*t), ch*(0.12 - 0.05*t)); }
    blobs(ch*0.4, ch, 6, true);
  } else if (variant === 2){   // retrato (silhueta)
    const gr = g.createRadialGradient(cw*0.5, ch*0.4, 5, cw*0.5, ch*0.5, cw*0.9); gr.addColorStop(0, '#e2e2e2'); gr.addColorStop(1, '#6e6e6e');
    g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
    g.fillStyle = '#242424';
    g.beginPath(); g.ellipse(cw*0.5, ch*0.42, cw*0.17, ch*0.17, 0, 0, Math.PI*2); g.fill();
    g.beginPath(); g.moveTo(cw*0.12, ch); g.quadraticCurveTo(cw*0.5, ch*0.52, cw*0.88, ch); g.closePath(); g.fill();
    blobs(0, ch, 4, false);
  } else {                      // plataforma no mar
    const hz = ch*0.60;
    const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#b7b7b7'); sky.addColorStop(1, '#ececec');
    g.fillStyle = sky; g.fillRect(0, 0, cw, hz); blobs(0, hz, 8, true); blobs(0, hz*0.7, 3, false);
    const sea = g.createLinearGradient(0, hz, 0, ch); sea.addColorStop(0, '#767676'); sea.addColorStop(1, '#1d1d1d');
    g.fillStyle = sea; g.fillRect(0, hz, cw, ch-hz);
    g.strokeStyle = 'rgba(255,255,255,0.13)'; g.lineWidth = Math.max(1, ch*0.004);
    for (let i = 0; i < 46; i++){ const y = hz + rng()*(ch-hz), x = rng()*cw, l = cw*(0.05 + rng()*0.18); g.beginPath(); g.moveTo(x, y); g.lineTo(x+l, y); g.stroke(); }
    const px = cw*0.50, pw = cw*0.34, deckY = hz - ch*0.10;
    g.fillStyle = '#131313';
    g.fillRect(px, deckY, pw, ch*0.045);
    for (let i = 0; i < 4; i++) g.fillRect(px + pw*0.05 + i*pw*0.29, deckY, cw*0.012, hz - deckY + ch*0.06);
    g.beginPath(); g.moveTo(px + pw*0.60, deckY); g.lineTo(px + pw*0.70, deckY - ch*0.22); g.lineTo(px + pw*0.80, deckY); g.closePath(); g.fill();
    g.fillRect(px + pw*0.69, deckY - ch*0.26, cw*0.006, ch*0.05);
    g.fillRect(px + pw*0.10, deckY - ch*0.05, pw*0.18, ch*0.05);
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(px + pw*0.2, deckY + ch*0.012, cw*0.008, ch*0.01);
    const rf = g.createLinearGradient(0, hz, 0, hz + ch*0.14); rf.addColorStop(0, 'rgba(0,0,0,0.5)'); rf.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rf; g.fillRect(px, hz, pw, ch*0.14);
  }
  const v = g.createRadialGradient(cw/2, ch/2, Math.min(cw, ch)*0.3, cw/2, ch/2, Math.max(cw, ch)*0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.35)');
  g.fillStyle = v; g.fillRect(0, 0, cw, ch);
}
function newsFitCover(img, x, y, w, h){
  const el = img.getElement();
  const nw = el.naturalWidth || el.width, nh = el.naturalHeight || el.height;
  const ir = nw/nh, tr = w/h; let sw = nw, sh = nh;
  if (ir > tr) sw = nh*tr; else sh = nw/tr;
  img.set({left:x, top:y, originX:'left', originY:'top', angle:0, flipX:false, flipY:false,
    cropX:(nw-sw)/2, cropY:(nh-sh)/2, width:sw, height:sh, scaleX:w/sw, scaleY:h/sh});
  img.setCoords();
}
/* Cinza + contraste + grão fino: o "papel de jornal" da foto. Quem troca a foto herda esses filtros. */
function newsPhotoFilters(){
  return [new fabric.filters.Grayscale(), new fabric.filters.Contrast({contrast:0.16}), new NoiseFilter({amount:0.13, seed:3})];
}
async function newsMakePhoto(x, y, w, h, variant, seed){
  const rng = mulberry32(seed || 1);
  const cw = Math.round(w*2), ch = Math.round(h*2);
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  newsDrawScene(cv.getContext('2d'), cw, ch, variant, rng);
  const img = await fabric.Image.fromURL(cv.toDataURL());
  newsFitCover(img, x, y, w, h);
  img.filters = newsPhotoFilters();
  img.applyFilters();
  img.set({globalCompositeOperation:'multiply', hoverCursor:'pointer'});
  img.set('customType', 'photoPlaceholder');
  return img;
}

/* ---- estado (guardado no objeto de fundo: entra no desfazer e na troca de página) ---- */
function getNewsState(){ const b = getBackground(); return b && b.__newsState ? b.__newsState : null; }
function setNewsState(st){ const b = getBackground(); if (b) b.__newsState = st; }

/* Se `vis` é o começo de `full` (ignorando diferenças de espaço/quebra), devolve o resto de `full` (cru). */
function newsTailAfter(full, vis){
  let i = 0, j = 0;
  const isWs = (c)=>c === ' ' || c === '\n' || c === '\t' || c === '\r';
  while (j < vis.length){
    while (j < vis.length && isWs(vis[j])) j++;
    while (i < full.length && isWs(full[i])) i++;
    if (j >= vis.length) break;
    if (i >= full.length || full[i] !== vis[j]) return null;
    i++; j++;
  }
  const tail = full.slice(i);
  return tail.trim() ? tail : null;
}

/* Lê o texto atual de cada role (e as fotos que o Max trocou) a partir dos objetos do canvas. */
function newsHarvest(){
  const st = getNewsState();
  const content = Object.assign({}, st && st.content ? st.content : {});
  const photos = {};
  const groups = {};
  canvas.getObjects().forEach(o=>{
    if (!o.__newsRole) return;
    if (o.type === 'newsbox') (groups[o.__newsRole] || (groups[o.__newsRole] = [])).push(o);
    else if (o.type === 'image' && o.customType !== 'photoPlaceholder') photos[o.__newsRole] = o;
  });
  const norm = s=>String(s||'').replace(/\s+/g, ' ').trim();
  Object.keys(groups).forEach(role=>{
    const arr = groups[role].slice().sort((a, b)=>(a.__flowIdx||0) - (b.__flowIdx||0));
    let text = '';
    arr.forEach((o, i)=>{ text += (i ? (o.__flowPara ? '\n' : ' ') : '') + String(o.text||''); });
    const vis = st && st.vis && st.vis[role];
    // inalterado desde o último layout → mantém o texto COMPLETO (que pode ter parte cortada/"continua")
    if (vis != null && norm(vis) === norm(text) && content[role] != null) { /* mantém */ }
    else {
      // editado: o que estava escondido (depois do "Continued on A5") continua colado no fim do texto novo
      const tail = (vis != null && content[role] != null) ? newsTailAfter(content[role], vis) : null;
      content[role] = text + (tail || '');
    }
    if (arr[0].frame !== 'none' && arr[0].title !== undefined) content[role + ':title'] = arr[0].title;
  });
  return {content, photos};
}

class NewsBuilder {
  constructor(cv, st, photos){
    this.cv = cv; this.st = st; this.c = st.content; this.photos = photos || {}; this.vis = {};
    this.kit = new DocKit(cv); this.seed = 1;
  }
  _mark(o, role){ o.__newsGenerated = true; if (role) o.__newsRole = role; return o; }
  /* Caixa de texto. role vira __newsRole. Devolve {obj, bottom}. */
  txt(role, x, y, w, o){
    o = o || {};
    let t = this.c[role]; if (t == null) t = o.text;
    if (t == null || t === '') return {obj:null, bottom:y};
    const title = o.title === true ? (this.c[role + ':title'] || '') : (o.title || '');
    const fill = o.fill || NEWS_INK;
    let size = o.size || 15;
    if (o.fit){ const m = ()=>newsMeasure(newsFontStr(o.style, o.weight, size, o.font || 'Old Standard TT'), o.cs || 0); const tx = o.upper ? String(t).toUpperCase() : String(t); while (size > (o.minSize || 30) && m()(tx) > w) size -= 1; }
    const nb = new NewsBox(t, {
      left:x, top:y, width:w, frame:o.frame || 'none', title, bodyFont:o.font || 'Old Standard TT', bodyWeight:o.weight || 400, bodyStyle:o.style || 'normal',
      fontSize:size, lineHeight:o.lh || 1.28, fill, frameColor:o.frameColor || null, upper:!!o.upper, rows:!!o.rows, charSp:o.cs || 0,
      textAlign:o.align || 'left', titleSize:o.titleSize || 12.5, titleFont:o.titleFont || 'Libre Franklin', titleAlign:o.titleAlign || 'left', titleFill:o.titleFill || '#f4f1e8',
      justify:!!o.justify, indent:o.indent || 0, padX:o.padX != null ? o.padX : null, padY:o.padY != null ? o.padY : null,
      globalCompositeOperation: o.blend || docBlendFor(fill),
    });
    this._mark(nb, role);
    if (o.label) nb.__labName = o.label;
    this.cv.add(nb);
    return {obj:nb, bottom:nb.top + nb.height};
  }
  rule(x1, y1, x2, y2, sw){ const l = this.kit.line(x1, y1, x2, y2, {stroke:NEWS_INK, sw:sw || 1, label:'Filete'}); this._mark(l, 'rule'); return l; }
  /* Faixa preta com título (cabeçalho de seção: classificados). */
  band(role, x, y, w){
    const label = this.c[role];
    if (!label) return y;
    const r = this.kit.rect({left:x, top:y, width:w, height:22, fill:NEWS_INK, label:'Faixa — ' + role}); this._mark(r, 'rule');
    this.txt(role, x, y + 4, w, {font:'Libre Franklin', weight:700, size:11.5, cs:150, lh:1.0, fill:'#f4f1e8', blend:'source-over', align:'center'});
    return y + 22 + 8;
  }
  /* Caixa colada na base da região (anúncios etc.): cria, mede e reposiciona. Devolve o topo. */
  boxAtBottom(role, x, w, bottom, o){
    const r = this.txt(role, x, 0, w, o);
    if (!r.obj) return bottom;
    const top = bottom - r.obj.height; r.obj.set('top', top); r.obj.setCoords();
    return top;
  }
  head(role, x, y, w, o){
    o = o || {};
    let yy = y; const al = o.align || 'left';
    const k = this.txt(role + '.kicker', x, yy, w, {font:'Libre Franklin', weight:700, size:12, cs:150, fill:NEWS_RED, upper:true, lh:1.2, align:al});
    if (k.obj) yy = k.bottom + 6;
    const h = this.txt(role + '.headline', x, yy, w, {font:o.font || 'Old Standard TT', weight:o.weight || 700, size:o.size || 34, lh:o.lh || 1.04, upper:!!o.upper, align:al, fit:!!o.fit, minSize:o.minSize});
    yy = h.bottom + 8;
    const d = this.txt(role + '.deck', x, yy, w, {style:'italic', size:o.deckSize || 17, lh:1.22, align:al});
    if (d.obj) yy = d.bottom + 9;
    const b = this.txt(role + '.byline', x, yy, w, {font:'Libre Franklin', weight:600, size:11, cs:130, upper:true, lh:1.2, fill:'#4a4540', align:al});
    if (b.obj){ yy = b.bottom + 5; if (o.rule !== false){ this.rule(x, yy, x + w, yy, 1); yy += 9; } }
    return yy;
  }
  /* Corpo em colunas: começa no tamanho máximo (o.size) e encolhe até caber; corta com "Continued on A5 »"
     se ainda sobrar. o.font/weight/indent permitem classificados (Barlow Condensed, sem recuo). */
  flow(role, x, y, w, o){
    const text = this.c[role]; if (!text) return y;
    const font = o.font || 'Old Standard TT', weight = o.weight || 400;
    const cols = o.cols || 1, gut = o.gut != null ? o.gut : 20, cw = (w - (cols-1)*gut)/cols, lhK = o.lh || 1.3, bottom = o.bottom;
    const minS = o.minSize || 12.5; let size = o.size || 15, pick = null;
    const indentK = o.indent != null ? o.indent : 0.95;
    for (;;){
      const m = newsMeasure(newsFontStr('normal', weight, size, font), 0);
      const lines = newsBreakLines(text, m, cw, {indent:size*indentK, indentFirst:false});
      const lineH = size*lhK, cap = Math.max(1, Math.floor((bottom - y)/lineH));
      if (lines.length <= cap*cols || size <= minS){ pick = {size, lines, lineH, cap}; break; }
      size -= 0.5;
    }
    let {lines, lineH, cap} = pick; size = pick.size;
    const overflow = lines.length > cap*cols;
    if (overflow) lines = lines.slice(0, Math.max(0, cap*cols - 1));
    const n = lines.length, per = overflow ? cap : Math.max(1, Math.min(cap, Math.ceil(n/cols)));
    let at = 0, bot = y, lastLines = 0, lastX = x;
    for (let c = 0; c < cols; c++){
      const sl = lines.slice(at, at + per); at += per;
      if (!sl.length) break;
      let str = ''; sl.forEach((l, j)=>{ str += (j ? (l.p ? '\n' : ' ') : '') + l.t; });
      const cont = at < n && !lines[at].p;
      const nb = new NewsBox(str, {left:x + c*(cw+gut), top:y, width:cw, frame:'none', bodyFont:font, bodyWeight:weight, fontSize:size, lineHeight:lhK, indent:size*indentK, indentFirst:c === 0 ? false : sl[0].p, contPara:cont, justify:!!this.st.justify, fill:NEWS_INK, globalCompositeOperation:'multiply'});
      this._mark(nb, role); nb.__flowIdx = c; nb.__flowPara = sl[0].p;
      this.cv.add(nb);
      bot = Math.max(bot, nb.top + nb.height); lastLines = sl.length; lastX = nb.left;
    }
    this.vis[role] = lines.map((l, j)=>(j ? (l.p ? '\n' : ' ') : '') + l.t).join('');
    if (overflow){
      const j = new NewsBox('Continued on A5 »', {left:lastX, top:y + lastLines*lineH, width:cw, frame:'none', fontSize:Math.max(12, size - 1.5), lineHeight:lhK, bodyStyle:'italic', textAlign:'right', fill:NEWS_INK, globalCompositeOperation:'multiply'});
      this._mark(j, role + '.jump'); this.cv.add(j);
      bot = Math.max(bot, j.top + j.height);
    }
    return bot;
  }
  async photo(role, x, y, w, h, o){
    o = o || {};
    let img = this.photos[role];
    if (img){ newsFitCover(img, x, y, w, h); }
    else img = await newsMakePhoto(x, y, w, h, o.variant || 0, (this.seed++)*131 + (this.st.seed || 7));
    this._mark(img, role); img.__labName = 'Foto (trocar) — ' + role;
    this.cv.add(img);
    let bot = y + h;
    const c = this.txt(o.cap || (role + '.cap'), x, y + h + 6, w, {style:'italic', size:12.5, lh:1.25, fill:'#2a2622'});
    if (c.obj) bot = c.bottom;
    return bot + 10;
  }
  vline(x, y1, y2){ return this.rule(x, y1, x, y2, 0.9); }

  /* Cabeçalho comum: orelhas (tempo/preço), nome do jornal, filetes e linha de edição. Devolve o topo do conteúdo. */
  header(){
    const M = NEWS_G.M, W = NEWS_G.W, gothic = this.st.mast !== 'serif';
    this.txt('ear.l', M, 58, newsW(1), {frame:'box', title:true, size:13, lh:1.3, titleSize:11.5});
    this.txt('ear.r', newsX(5), 58, newsW(1), {frame:'box', title:true, size:13, lh:1.3, titleSize:11.5, align:'right'});
    const name = gothic
      ? this.txt('mast.name', newsX(1), 54, newsW(4), {font:'UnifrakturCook', weight:700, size:80, lh:1.0, align:'center', fit:true, minSize:40})
      : this.txt('mast.name', newsX(1), 62, newsW(4), {font:'Old Standard TT', weight:700, size:74, lh:1.0, align:'center', upper:true, cs:30, fit:true, minSize:36});
    const tagY = (name.obj ? name.bottom : 140) + (gothic ? -2 : 4);
    this.txt('mast.tag', newsX(1), tagY, newsW(4), {style:'italic', size:14.5, align:'center', fill:'#3a352f'});
    const ry = Math.max(tagY + 28, 176);
    this.rule(M, ry, M + W, ry, 3.2); this.rule(M, ry + 6, M + W, ry + 6, 1);
    const fy = ry + 14;
    this.txt('folio.l', M, fy, 250, {font:'Libre Franklin', weight:600, size:11, cs:110, lh:1.2});
    this.txt('folio.c', M + 270, fy, W - 540, {font:'Libre Franklin', weight:600, size:10, cs:90, lh:1.2, align:'center', fill:'#4a4540'});
    this.txt('folio.r', M + W - 250, fy, 250, {font:'Libre Franklin', weight:600, size:11, cs:110, lh:1.2, align:'right'});
    this.rule(M, fy + 20, M + W, fy + 20, 1.3);
    // rodapé
    this.rule(M, NEWS_G.BOTTOM + 14, M + W, NEWS_G.BOTTOM + 14, 1);
    this.txt('foot.l', M, NEWS_G.BOTTOM + 22, 600, {font:'Libre Franklin', weight:600, size:10, cs:100, lh:1.2, fill:'#4a4540'});
    this.txt('foot.r', M + W - 200, NEWS_G.BOTTOM + 22, 200, {font:'Libre Franklin', weight:700, size:11, cs:100, lh:1.2, align:'right'});
    return Math.max(NEWS_G.TOP, fy + 20 + 16);
  }
}

const NEWS_AD = {frame:'ad', title:true, size:14, lh:1.25, align:'center', titleSize:21, titleFont:'Barlow Condensed'};
const NEWS_CLS = {font:'Barlow Condensed', weight:500, size:14.5, lh:1.22, indent:0, minSize:12, gut:18};

/* ---- Presets: cada um é uma função que posiciona blocos na grade (usa a altura medida de cada bloco) ---- */
const NEWS_PRESETS = {
  classica: {label:'Capa clássica', build: async (B)=>{
    const T = B.header(), BT = NEWS_G.BOTTOM, LX = newsX(0), LW = newsW(4), RX = newsX(4), RW = newsW(2);
    // direita: breves, índice, citação, foto, obituário, tábua de marés e anúncio colado na base
    let ry = T;
    const brief = B.txt('brief', RX, ry, RW, {frame:'box', title:true, size:13.5, lh:1.28}); ry = brief.bottom + 14;
    const idx = B.txt('index', RX, ry, RW, {frame:'bar', title:true, rows:true, size:14, lh:1.35}); ry = idx.bottom + 14;
    const pq = B.txt('pq', RX, ry, RW, {frame:'rules', style:'italic', size:19, lh:1.24, weight:700, padY:10}); ry = pq.bottom + 14;
    const adTop = B.boxAtBottom('ad.1', RX, RW, BT, NEWS_AD);
    const tideTop = B.boxAtBottom('tide', RX, RW, adTop - 14, {frame:'box', title:true, rows:true, size:13.5, lh:1.35});
    ry = await B.photo('photo.2', RX, ry, RW, 200, {variant:1});
    ry = B.head('s4', RX, ry, RW, {size:19, rule:false});
    B.flow('s4.body', RX, ry, RW, {size:14, bottom:tideTop - 16, minSize:12.5});
    // esquerda: matéria principal + duas secundárias + anúncios
    let y = B.head('lead', LX, T, LW, {size:50, upper:true, lh:1.0, deckSize:18});
    y = await B.photo('photo.1', LX, y, LW, Math.round(LW*0.50), {variant:0});
    y = B.flow('lead.body', LX, y, LW, {cols:2, size:15, bottom:1100, minSize:12.5});
    y = Math.max(y, 1090) + 12; B.rule(LX, y, LX + LW, y, 1.3); y += 14;
    const adL = B.boxAtBottom('ad.2', LX, newsW(2), BT, NEWS_AD);
    const adM = B.boxAtBottom('ad.3', newsX(2), newsW(2), BT, NEWS_AD);
    const lim = Math.min(adL, adM) - 16;
    let a = B.head('s2', LX, y, newsW(2), {size:23, rule:false}); B.flow('s2.body', LX, a, newsW(2), {size:14, bottom:lim, minSize:12.5});
    let b = B.head('s3', newsX(2), y, newsW(2), {size:23, rule:false}); B.flow('s3.body', newsX(2), b, newsW(2), {size:14, bottom:lim, minSize:12.5});
    B.vline(RX - NEWS_G.GUT/2, T, BT); B.vline(newsX(2) - NEWS_G.GUT/2, y, lim);
  }},
  larga: {label:'Manchete larga', build: async (B)=>{
    const T = B.header(), BT = NEWS_G.BOTTOM, LX = newsX(0), FW = NEWS_G.W;
    let y = B.head('lead', LX, T, FW, {size:68, upper:true, lh:0.98, align:'center', deckSize:21, rule:true});
    y = await B.photo('photo.1', LX, y, FW, 380, {variant:0});
    const RX = newsX(4), RW = newsW(2), LW = newsW(4);
    const bodyBottom = 1296;
    const e1 = B.flow('lead.body', LX, y, LW, {cols:3, size:15, bottom:bodyBottom, minSize:12.5, gut:18});
    let ry = y;
    const idx = B.txt('index', RX, ry, RW, {frame:'bar', title:true, rows:true, size:14, lh:1.35}); ry = idx.bottom + 14;
    const brief = B.txt('brief', RX, ry, RW, {frame:'box', title:true, size:13, lh:1.26}); ry = brief.bottom;
    const split = Math.max(e1, ry, bodyBottom - 30) + 14;
    B.rule(LX, split, LX + FW, split, 1.3);
    const adA = B.boxAtBottom('ad.1', RX, RW, BT, NEWS_AD);
    const adB = B.boxAtBottom('ad.2', RX, RW, adA - 14, NEWS_AD);
    const tide = B.txt('tide', RX, split + 14, RW, {frame:'box', title:true, rows:true, size:13.5, lh:1.35});
    let a = B.head('s2', LX, split + 14, newsW(2), {size:25, rule:false}); B.flow('s2.body', LX, a, newsW(2), {size:14, bottom:BT, minSize:12.5});
    let b = B.head('s3', newsX(2), split + 14, newsW(2), {size:25, rule:false}); B.flow('s3.body', newsX(2), b, newsW(2), {size:14, bottom:BT, minSize:12.5});
    B.vline(newsX(2) - NEWS_G.GUT/2, split + 14, BT); B.vline(RX - NEWS_G.GUT/2, split + 14, BT); B.vline(RX - NEWS_G.GUT/2, y, split - 8);
  }},
  extra: {label:'Edição extra (tabloide)', build: async (B)=>{
    const T = B.header(), BT = NEWS_G.BOTTOM, LX = newsX(0), FW = NEWS_G.W;
    const bar = B.kit.rect({left:LX, top:T, width:FW, height:54, fill:'#161412', label:'Faixa EXTRA'}); B._mark(bar, 'rule');
    B.txt('xl.kicker', LX, T + 9, FW, {font:'Barlow Condensed', weight:700, size:30, cs:320, lh:1.0, align:'center', fill:'#f4f1e8', blend:'source-over'});
    let y = T + 54 + 22;
    const h = B.txt('xl.headline', LX, y, FW, {font:'Barlow Condensed', weight:700, size:190, lh:0.9, upper:true, align:'center', fit:true, minSize:60, cs:10});
    y = h.bottom + 6;
    const d = B.txt('xl.deck', LX, y, FW, {style:'italic', size:27, lh:1.2, align:'center'}); y = d.bottom + 14;
    B.rule(LX, y, LX + FW, y, 3); y += 14;
    y = await B.photo('photo.1', LX, y, FW, 500, {variant:0});
    const a1 = B.boxAtBottom('ad.1', LX, newsW(2), BT, NEWS_AD);
    const a2 = B.boxAtBottom('index', newsX(2), newsW(2), BT, {frame:'bar', title:true, rows:true, size:14, lh:1.35});
    const a3 = B.boxAtBottom('brief', newsX(4), newsW(2), BT, {frame:'box', title:true, size:12.5, lh:1.24});
    const bodyBottom = Math.min(a1, a2, a3) - 26;
    B.flow('lead.body', LX, y, FW, {cols:3, size:17, bottom:bodyBottom, minSize:12.5, gut:24});
    B.rule(LX, bodyBottom + 12, LX + FW, bodyBottom + 12, 1.3);
  }},
  duas: {label:'Duas matérias', build: async (B)=>{
    const T = B.header(), BT = NEWS_G.BOTTOM, LX = newsX(0), RX = newsX(3), HW = newsW(3);
    const a1 = B.boxAtBottom('ad.1', newsX(0), newsW(2), BT, NEWS_AD), a2 = B.boxAtBottom('ad.2', newsX(2), newsW(2), BT, NEWS_AD), a3 = B.boxAtBottom('ad.3', newsX(4), newsW(2), BT, NEWS_AD);
    const lim = Math.min(a1, a2, a3) - 22;
    let y = B.head('lead', LX, T, HW, {size:38, upper:true, lh:1.02, deckSize:16});
    y = await B.photo('photo.1', LX, y, HW, Math.round(HW*0.86), {variant:0});
    B.flow('lead.body', LX, y, HW, {cols:2, size:16.5, bottom:lim, minSize:12.5});
    let y2 = B.head('s2', RX, T, HW, {size:38, upper:true, lh:1.02, deckSize:16});
    y2 = await B.photo('photo.2', RX, y2, HW, Math.round(HW*0.98), {variant:1});
    B.flow('s2.body', RX, y2, HW, {cols:2, size:16.5, bottom:lim, minSize:12.5});
    B.vline(newsX(3) - NEWS_G.GUT/2, T, lim);
    B.rule(LX, lim + 10, LX + NEWS_G.W, lim + 10, 1.3);
  }},
  denso: {label:'Só texto (denso)', build: async (B)=>{
    const T = B.header(), BT = NEWS_G.BOTTOM, LX = newsX(0), LW = newsW(4), RX = newsX(4), RW = newsW(2);
    const a1 = B.boxAtBottom('ad.1', newsX(0), newsW(2), BT, NEWS_AD), a2 = B.boxAtBottom('ad.2', newsX(2), newsW(2), BT, NEWS_AD), a3 = B.boxAtBottom('ad.3', newsX(4), newsW(2), BT, NEWS_AD);
    const adsTop = Math.min(a1, a2, a3) - 16;
    // classificados em 3 colunas, logo acima dos anúncios
    const clsTop = adsTop - 200;
    const cy = B.band('cls.title', LX, clsTop, NEWS_G.W);
    B.flow('cls', LX, cy, NEWS_G.W, Object.assign({cols:3, bottom:adsTop - 4}, NEWS_CLS));
    const lim = clsTop - 18;
    let y = B.head('lead', LX, T, LW, {size:46, upper:true, lh:1.0, deckSize:18});
    const mid = 905;
    y = B.flow('lead.body', LX, y, LW, {cols:3, size:15, bottom:mid, minSize:12.5, gut:18});
    let ry = T;
    const pq = B.txt('pq', RX, ry, RW, {frame:'rules', style:'italic', size:20, lh:1.24, weight:700, padY:11}); ry = pq.bottom + 14;
    const brief = B.txt('brief', RX, ry, RW, {frame:'box', title:true, size:13.5, lh:1.28}); ry = brief.bottom + 14;
    const idx = B.txt('index', RX, ry, RW, {frame:'bar', title:true, rows:true, size:14, lh:1.35}); ry = idx.bottom + 14;
    const tide = B.txt('tide', RX, ry, RW, {frame:'box', title:true, rows:true, size:13.5, lh:1.35}); ry = tide.bottom;
    const split = Math.max(y, ry, mid - 20) + 14;
    B.rule(LX, split, LX + NEWS_G.W, split, 1.3);
    const wi = newsW(2);
    [['s2', 0], ['s3', 2], ['s4', 4]].forEach(([r, c], i)=>{
      const x = newsX(c); const hh = B.head(r, x, split + 14, wi, {size:22, rule:false});
      B.flow(r + '.body', x, hh, wi, {size:14.5, bottom:lim, minSize:12.5});
      if (i) B.vline(x - NEWS_G.GUT/2, split + 14, lim);
    });
    B.vline(RX - NEWS_G.GUT/2, T, split - 8);
    B.rule(LX, lim + 8, LX + NEWS_G.W, lim + 8, 1.3);
  }},
};
const NEWS_PRESET_ORDER = ['classica', 'larga', 'extra', 'duas', 'denso'];

/* Refaz o layout: colhe o texto/fotos atuais, apaga o que o motor gerou, monta o preset e guarda o estado.
   patch = {preset, mast, justify}. */
async function newsRebuild(patch){
  if (!getBackground()) return;
  beginBatch();
  try {
    const st0 = getNewsState() || {};
    const h = newsHarvest();
    const st = Object.assign({preset:'classica', mast:'gothic', justify:false, seed:Math.floor(Math.random()*1e6)}, st0, patch || {});
    st.content = Object.assign({}, NEWS_DEFAULTS, h.content);
    const keepers = canvas.getObjects().filter(o=>!o.__newsGenerated && o.customType !== 'background');
    canvas.getObjects().filter(o=>o.__newsGenerated).forEach(o=>canvas.remove(o));
    const B = new NewsBuilder(canvas, st, h.photos);
    await NEWS_PRESETS[st.preset].build(B);
    st.vis = B.vis;
    keepers.forEach(o=>canvas.bringObjectToFront(o));
    setNewsState(st);
    canvas.renderAll();
    renderLayerList();
  } finally { endBatch(); }
  pushHistory();
  syncNewsLayoutUI();
}

registerDoc('newspaper', {
  label:'Jornal (capa)', page:A4.page, phys:A4.phys,
  paper:{type:'jornal', level:0.4, fold:'meio', atmos:'twin'},
  fonts:NEWS_FONT_SPECS,
  build: async ()=>{ await newsRebuild({preset:'classica'}); },
});
