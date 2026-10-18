/* ===================== Jornais além do The Abyssal Post (f3-05, f3-07) =====================
   O Abyssal Post é o 'newspaper' (news-engine.js, NÃO é editado). Westcoast Post e Nordsjo-Posten usam o mesmo motor (NewsBuilder + NewsBox,
   o canvas é a fonte da verdade, trocar de layout não perde texto editado): cada jornal declara uma CONFIG e usa `newsRebuildCfg`, que é a
   mesma função `newsRebuild` com a config no lugar das constantes do Abyssal. O estado fica no mesmo lugar (bg.__newsState), então
   desfazer, trocar de página e salvar funcionam sem código novo.
   OS TRÊS JORNAIS VIVEM DENTRO DO MODELO "JORNAL": o painel "Layout do jornal" tem um grupo de botões por jornal, e "Tipo da nova página" lista os
   layouts de todos (cada layout pertence a UM jornal: NEWS_CFGS). Trocar a página de um jornal pro layout de outro é "trocar de jornal": o que o
   Max NÃO editou acompanha o novo jornal (título, orelhas, textos padrão) e o que ele editou fica; o papel da página acompanha o jornal quando o
   papel padrão dele é diferente (o Nordsjo-Posten é fotocópia escaneada). `newsRebuildAny` é o roteador que o painel chama.
   NEWS_DOCS é o registro por modelo que o editor.js lê ({rebuild, rows}); NEWS_CFGS guarda os jornais; NEWS_EXTRA_KINDS são as entradas
   extras de "Tipo da nova página" do modelo 'newspaper' (doc-pages.js as acrescenta). */

const NEWS_DOCS = {};
const NEWS_CFGS = {};
const NEWS_EXTRA_KINDS = [];

/* O Abyssal como config (só pra trocar DE e PARA ele; o caminho dele sem trocar de jornal continua sendo o newsRebuild original). */
const ABY_CFG = {id:'abyssal', Builder:NewsBuilder, presets:NEWS_PRESETS, defaults:NEWS_DEFAULTS, defaultPreset:'classica', mast:'gothic', justify:false,
  ui:{mast:true, justify:true}, paperFor:()=>Object.assign({}, DOC_TEMPLATES.newspaper.paper)};
NEWS_CFGS.abyssal = ABY_CFG;
/* Jornal dono de um layout. */
function newsCfgOfPreset(id){
  for (const k in NEWS_CFGS){ if (NEWS_CFGS[k].presets[id]) return NEWS_CFGS[k]; }
  return ABY_CFG;
}
const newsDefaultsOf = (cfg, st)=>cfg.defaultsFor ? cfg.defaultsFor(st) : cfg.defaults;

/* newsRebuild com config: cfg = {id, Builder, presets, defaults | defaultsFor(st), defaultPreset, mast, justify, ui, paperFor(st)}.
   Se a página vem de OUTRO jornal (ou de outra edição), o texto que o Max não editou passa a ser o do jornal novo. */
async function newsRebuildCfg(cfg, patch){
  if (!getBackground()) return;
  if (cfg.fonts && typeof ensureFonts === 'function') await ensureFonts(cfg.fonts);
  beginBatch();
  try {
    const st0 = getNewsState() || {};
    const h = newsHarvest();
    const st = Object.assign({preset:cfg.defaultPreset, mast:cfg.mast || 'gothic', justify:!!cfg.justify, seed:Math.floor(Math.random()*1e6)}, st0, patch || {});
    if (!cfg.presets[st.preset]) st.preset = cfg.defaultPreset;
    if (cfg.presets[st.preset].issue) st.issue = cfg.presets[st.preset].issue;
    const defaults = newsDefaultsOf(cfg, st);
    const prevCfg = st0.preset ? newsCfgOfPreset(st0.preset) : null, prevDef = prevCfg ? newsDefaultsOf(prevCfg, st0) : null;
    let content = Object.assign({}, defaults, h.content);
    if (prevDef && prevDef !== defaults){   // trocou de jornal/edição: só o que foi editado fica, o resto vira o texto padrão do jornal novo
      const edited = {};
      Object.keys(h.content).forEach(k=>{ if (!(k in prevDef) || h.content[k] !== prevDef[k]) edited[k] = h.content[k]; });
      content = Object.assign({}, defaults, edited);
    }
    st.content = content;
    st.paper = cfg.id;
    if (prevCfg && prevCfg.paperFor && cfg.paperFor){   // papel padrão diferente (ex.: fotocópia do Nordsjo): a página troca de papel
      const a = prevCfg.paperFor(st0), b = cfg.paperFor(st);
      if (JSON.stringify(a) !== JSON.stringify(b)) setPaper(b);
    }
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

/* Roteador do painel "Layout do jornal": decide qual jornal refaz a página. Abyssal → Abyssal segue pelo newsRebuild original. */
async function newsRebuildAny(patch){
  patch = patch || {};
  if (!getBackground()) return;
  const st0 = getNewsState() || {}, cur = newsCfgOfPreset(st0.preset || 'classica'), target = patch.preset ? newsCfgOfPreset(patch.preset) : cur;
  if (target === ABY_CFG && cur === ABY_CFG) return newsRebuild(patch);
  return newsRebuildCfg(target, patch);
}
NEWS_DOCS.newspaper = {rebuild:newsRebuildAny, rows:'newspaper'};

/* Botões de layout de um jornal, na linha `rowId` do painel (dentro do bloco do modelo Jornal). */
function newsDocButtons(rowId, cfg){
  const row = document.getElementById(rowId); if (!row) return;
  Object.keys(cfg.presets).forEach(key=>{
    const b = document.createElement('button');
    b.textContent = cfg.presets[key].label; b.dataset.preset = key;
    b.addEventListener('click', ()=>newsRebuildLocked({preset:key}));
    row.appendChild(b);
  });
}
/* Página nova do mesmo jornal: herda título (gótico/serifado) e justificado da página anterior. */
function newsInherit(ctx){
  const pv = ctx && ctx.prev && ctx.prev.news, p = {};
  if (pv){ ['mast', 'justify'].forEach(k=>{ if (pv[k] != null) p[k] = pv[k]; }); }
  return p;
}
/* Entradas da lista "Tipo da nova página". `prefix` vai na frente do nome (no modelo Jornal, que mistura os três jornais); `paperOf(preset)`
   dá o papel da página nova quando o jornal não usa o papel padrão do modelo. */
function newsPageKinds(cfg, fonts, extraPatch, prefix, paperOf){
  return Object.keys(cfg.presets).map(k=>{
    const kind = {id:k, label:(prefix || '') + cfg.presets[k].label, fonts,
      build: async (kit, ctx)=>{ await newsRebuildCfg(cfg, Object.assign({preset:k}, extraPatch ? extraPatch(ctx) : {}, newsInherit(ctx))); }};
    if (paperOf){ const p = paperOf(k); if (p) kind.paper = p; }
    return kind;
  });
}
/* Registra um jornal no modelo Jornal: config, botões no painel e entradas em "Tipo da nova página". */
function newsRegisterPaper(cfg, rowId, label, fonts, paperOf){
  NEWS_CFGS[cfg.id] = cfg;
  newsDocButtons(rowId, cfg);
  newsPageKinds(cfg, fonts, null, label + ' — ', paperOf).forEach(k=>NEWS_EXTRA_KINDS.push(k));
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
  /* Título grande direto no papel (tinta preta, sem caixa): filete duplo em cima, kicker, título em serifa pesada e filete embaixo.
     A altura acompanha o texto (ou `minH`). Devolve onde o bloco termina. */
  bigHead(role, x, y, w, o){
    o = o || {};
    this.rule(x, y + 2, x + w, y + 2, 3.2); this.rule(x, y + 7, x + w, y + 7, 0.9);
    const k = this.txt(role + '.kicker', x, y + 17, w, {font:'Libre Franklin', weight:700, size:12, cs:150, upper:true, lh:1.2, fill:NEWS_RED});
    const h = this.txt(role + '.headline', x, (k.obj ? k.bottom : y + 17) + 6, w, {font:'Old Standard TT', weight:700, size:o.size || 54, lh:1.02});
    const bottom = Math.max((h.obj ? h.bottom : y + 40) + 14, y + (o.minH || 0));
    this.rule(x, bottom, x + w, bottom, 1.3);
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
