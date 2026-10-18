/* ===================== Jornais além do The Abyssal Post (f3-05) =====================
   O Abyssal Post é o modelo 'newspaper' (news-engine.js, NÃO é editado). Este arquivo dá a outros jornais o mesmo
   motor (NewsBuilder + NewsBox, o canvas é a fonte da verdade, trocar de layout não perde texto editado) sem mexer
   nele: cada jornal declara uma CONFIG (construtor, layouts, textos padrão) e usa `newsRebuildCfg`, que é a mesma
   função `newsRebuild` com a config no lugar das constantes do Abyssal. O estado do jornal fica no mesmo lugar
   (bg.__newsState), então desfazer, trocar de página e salvar funcionam sem código novo.
   NEWS_DOCS é o registro que o painel "Layout do jornal" (editor.js) lê: {rebuild, order, row, mast, justify}. */

const NEWS_DOCS = {};
NEWS_DOCS.newspaper = {rebuild:(p)=>newsRebuild(p), mast:true, justify:true};

/* newsRebuild com config: cfg = {Builder, presets, defaults | defaultsFor(st), defaultPreset, mast, justify, after?(B, st)}. */
async function newsRebuildCfg(cfg, patch){
  if (!getBackground()) return;
  beginBatch();
  try {
    const st0 = getNewsState() || {};
    const h = newsHarvest();
    const st = Object.assign({preset:cfg.defaultPreset, mast:cfg.mast || 'gothic', justify:!!cfg.justify, seed:Math.floor(Math.random()*1e6)}, st0, patch || {});
    if (!cfg.presets[st.preset]) st.preset = cfg.defaultPreset;
    const defaults = cfg.defaultsFor ? cfg.defaultsFor(st) : cfg.defaults;
    st.content = Object.assign({}, defaults, h.content);
    const keepers = canvas.getObjects().filter(o=>!o.__newsGenerated && o.customType !== 'background');
    canvas.getObjects().filter(o=>o.__newsGenerated).forEach(o=>canvas.remove(o));
    const B = new cfg.Builder(canvas, st, h.photos, defaults);
    await cfg.presets[st.preset].build(B);
    st.vis = B.vis;
    keepers.forEach(o=>canvas.bringObjectToFront(o));
    setNewsState(st);
    const bgNow = getBackground();
    if (bgNow) bgNow.__docPageKind = st.preset;   // o layout é o "tipo da página" (aparece no status da página)
    canvas.renderAll();
    renderLayerList();
  } finally { endBatch(); }
  pushHistory();
  syncNewsLayoutUI();
}

/* Botões de layout de um jornal (um bloco .newsRows por jornal no painel). */
function newsDocButtons(docId, rowId, cfg){
  const row = document.getElementById(rowId); if (!row) return;
  Object.keys(cfg.presets).forEach(key=>{
    const b = document.createElement('button');
    b.textContent = cfg.presets[key].label; b.dataset.preset = key;
    b.addEventListener('click', ()=>newsRebuildLocked({preset:key}));
    row.appendChild(b);
  });
}
/* Página nova do mesmo jornal: herda título (gótico/serifado), justificado e edição (issue) da página anterior. */
function newsInherit(ctx){
  const pv = ctx && ctx.prev && ctx.prev.news, p = {};
  if (pv){ ['mast', 'justify', 'issue'].forEach(k=>{ if (pv[k] != null) p[k] = pv[k]; }); }
  return p;
}
/* Entrada da lista "Tipo da nova página". */
function newsPageKinds(cfg, fonts, extraPatch){
  return Object.keys(cfg.presets).map(k=>({
    id:k, label:cfg.presets[k].label, fonts,
    build: async (kit, ctx)=>{ await newsRebuildCfg(cfg, Object.assign({preset:k}, extraPatch ? extraPatch(ctx) : {}, newsInherit(ctx))); },
  }));
}

/* Anúncios na base da página: mesma altura, colados no rodapé. specs = [{role, x, w}]. Devolve o topo da faixa. */
function newsBottomRow(B, specs, bottom, o){
  const boxes = specs.map(s=>B.txt(s.role, s.x, 0, s.w, o).obj).filter(Boolean);
  if (!boxes.length) return bottom;
  const H = newsEqualize(boxes);
  boxes.forEach(b=>{ b.set('top', bottom - H); b.setCoords(); });
  return bottom - H;
}

/* Gira e desloca TODO o conteúdo gerado pelo motor em volta do centro da página, como um papel que entrou torto no scanner.
   (O efeito 'xerox' de proc-art desenha o fundo preto do scanner no mesmo ângulo.) */
function newsTilt(cv, deg, dx, dy, W, H){
  if (!deg && !dx && !dy) return;
  const a = deg*Math.PI/180, c = Math.cos(a), s = Math.sin(a), cx = W/2, cy = H/2;
  cv.getObjects().filter(o=>o.__newsGenerated).forEach(o=>{
    const p = o.getCenterPoint(), rx = p.x - cx, ry = p.y - cy;
    o.set('angle', (o.angle || 0) + deg);
    o.setPositionByOrigin(new fabric.Point(cx + rx*c - ry*s + dx, cy + rx*s + ry*c + dy), 'center', 'center');
    o.setCoords();
  });
}

/* NewsBuilder com: textos padrão do próprio jornal (pageLabel lê `defaults`, não os do Abyssal), tabelas com quebra (rows:'wrap'|'defs') e cabeçalho
   de capa com número de página. */
class NewsDocBuilder extends NewsBuilder {
  constructor(cv, st, photos, defaults){ super(cv, st, photos); this.D = defaults || {}; }
  txt(role, x, y, w, o){
    const r = super.txt(role, x, y, w, o);
    if (r.obj && o && typeof o.rows === 'string'){ r.obj.set('rows', o.rows); r.obj.initDimensions(); r.bottom = r.obj.top + r.obj.height; }
    if (r.obj && o && o.soft){ r.obj.set('soft', o.soft); }
    if (r.obj && o && o.tintFill){ r.obj.set('tintFill', true); }
    return r;
  }
  pageLabel(label, keys){
    const last = this.st.lastLabel;
    keys.forEach(k=>{
      const v = this.c[k];
      if (label && (v === this.D[k] || v === last)) this.c[k] = label;
      else if (!label && last && v === last) this.c[k] = this.D[k];
    });
    this.st.lastLabel = label || null;
  }
  /* Empilha caixas na vertical a partir de y (com `gap` entre elas) e reparte a folga até `end` como altura mínima de cada uma
     (o texto fica no topo, a moldura cresce pra baixo). Devolve onde a pilha termina. */
  stackFill(boxes, y, end, gap, center){
    boxes = boxes.filter(Boolean);
    if (!boxes.length) return y;
    const H = boxes.reduce((a, o)=>a + o.height, 0) + gap*(boxes.length - 1), e = Math.max(0, end - y - H)/boxes.length;
    let yy = y;
    boxes.forEach(o=>{
      if (e > 1){ if (typeof center === 'function' ? center(o) : center) o.set('padY', o._padY() + e/2); else o.set('minH', o.height + e); o.initDimensions(); }   // center: anúncios (texto no meio); senão texto no topo
      o.set('top', yy); o.setCoords(); yy += o.height + gap;
    });
    return yy - gap;
  }
  /* Título em painel preto (letra clara): kicker + título, o painel acompanha a altura do texto. Devolve onde o painel termina. */
  revHead(role, x, y, w, o){
    o = o || {}; const pad = 16;
    const panel = this.kit.rect({left:x, top:y, width:w, height:40, fill:NEWS_INK, label:'Painel do título'}); this._mark(panel, 'rule');
    const k = this.txt(role + '.kicker', x + pad, y + 13, w - 2*pad, {font:'Libre Franklin', weight:700, size:12, cs:220, upper:true, lh:1.2, fill:'#e3b3a8', blend:'source-over'});
    const h = this.txt(role + '.headline', x + pad, (k.obj ? k.bottom : y + 13) + 6, w - 2*pad, {font:'Old Standard TT', weight:700, size:o.size || 54, lh:1.02, fill:'#f4f1e8', blend:'source-over'});
    const bottom = (h.obj ? h.bottom : y + 40) + 16;
    panel.set('height', bottom - y); panel.setCoords();
    return bottom;
  }
  /* header() do Abyssal (capa) com o número da página no rodapé. */
  headerLabeled(label){
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
    this.rule(M, NEWS_G.BOTTOM + 14, M + W, NEWS_G.BOTTOM + 14, 1);
    this.pageLabel(label, ['foot.r']);
    this.txt('foot.l', M, NEWS_G.BOTTOM + 22, 600, {font:'Libre Franklin', weight:600, size:10, cs:100, lh:1.2, fill:'#4a4540'});
    this.txt('foot.r', M + W - 200, NEWS_G.BOTTOM + 22, 200, {font:'Libre Franklin', weight:700, size:11, cs:100, lh:1.2, align:'right'});
    return Math.max(NEWS_G.TOP, fy + 20 + 16);
  }
}
