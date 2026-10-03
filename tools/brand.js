/* ===================== Documentos de marca (Kelvara / NeuroStat / DRE / Ødemark) =====================
   Arquitetura híbrida: cada lado de cada documento é um "pack" gerado offline a partir do mockup HTML
   aprovado (vendor/brand/<doc>_<lado>.js):
     - arte:    raster em alta resolução com TODO o texto editável escondido (papel, réguas, tabelas, logos,
                envelhecimento, código de barras, ...), objeto travado na base (BrandArt);
     - campos:  cada trecho de texto editável, com posição/rotação/fonte/cor/quebras de linha EXATAS do mockup
                (BrandText — desenha o texto com as mesmas métricas do navegador, sem reflow surpresa);
     - objetos: carimbos, círculos à caneta, logos e selos como imagens soltas com transparência (movíveis).
   Por isso o visual bate com o mockup e o texto continua editável. Este arquivo carrega DEPOIS de editor.js
   (usa canvas/history/restoringHistory/applyPageSize/etc. de lá em tempo de chamada). */

const BRAND = { cur: null, artEls: {}, measure: null };

/* ---------- carregamento dos packs (sob demanda — cada lado é um .js próprio) ---------- */
function brandLoadPack(doc, side){
  const key = doc+':'+side;
  if (window.BRAND_PACK && window.BRAND_PACK[key]) return Promise.resolve(window.BRAND_PACK[key]);
  return new Promise((res, rej)=>{
    const s = document.createElement('script');
    s.src = `vendor/brand/${doc}_${side}.js?v=${window.BRAND_VERSION||0}`;
    s.onload = ()=> (window.BRAND_PACK && window.BRAND_PACK[key]) ? res(window.BRAND_PACK[key]) : rej(new Error('Pack vazio: '+key));
    s.onerror = ()=> rej(new Error('Não achei '+s.src));
    document.head.appendChild(s);
  });
}
function brandDocMeta(docId){
  for (const f of (window.BRAND_INDEX||[])) { const d = f.docs.find(x=>x.id===docId); if (d) return Object.assign({family:f.id, familyLabel:f.label}, d); }
  return null;
}
/* Fontes usadas em canvas só carregam se alguém pedir explicitamente (o navegador só baixa @font-face
   preguiçoso quando o DOM usa) — sem isso o primeiro desenho sairia com fonte reserva. */
async function brandEnsureFonts(pack){
  const specs = new Set();
  pack.fields.forEach(f=>{
    const st = f.font.style||'normal';
    specs.add(`${st} ${f.font.weight} 16px ${f.font.family}`);
    if (f.text.indexOf('**')>=0) specs.add(`${st} 700 16px ${f.font.family}`);
  });
  await Promise.all([...specs].map(s=>document.fonts.load(s, 'AaØøÅåÆæ0123456789—·×').catch(()=>{})));
}
async function brandArtElement(key){
  if (BRAND.artEls[key]) return BRAND.artEls[key];
  const pack = window.BRAND_PACK && window.BRAND_PACK[key];
  if (!pack) throw new Error('Arte não carregada: '+key);
  const img = new Image();
  img.src = pack.art.src;
  await img.decode();
  BRAND.artEls[key] = img;
  return img;
}

/* ---------- BrandArt: a arte travada. Nunca serializa o dataURL no histórico (2–5 MB por snapshot ×40) ---------- */
const _FabricImageBase = fabric.FabricImage || fabric.Image;
class BrandArt extends _FabricImageBase {
  static type = 'BrandArt';
  getSrc(){ return ''; }
  toObject(props){ return Object.assign(super.toObject(props), {brandKey: this.brandKey}); }
  static async fromObject(object, options){
    const {type, src, filters, resizeFilter, crossOrigin, brandKey, ...rest} = object;
    const el = await brandArtElement(brandKey);
    const img = new this(el, rest);
    img.brandKey = brandKey;
    return img;
  }
}
fabric.classRegistry.setClass(BrandArt, 'BrandArt');

/* ---------- BrandText: texto com métricas do navegador ----------
   Estende Textbox (herda alças de largura, serialização, clone) mas troca o layout/desenho. As quebras de
   linha originais do mockup vêm gravadas (brandWraps) e só valem enquanto o texto, a fonte e a largura são os
   originais — mexeu em qualquer um, reflui sozinho. Marcadores no texto: **negrito** e [[trecho censurado]]. */
function _brandMeasureCtx(){
  if (!BRAND.measure) BRAND.measure = document.createElement('canvas').getContext('2d');
  return BRAND.measure;
}
/* Kerning/ligaduras ligados como no DOM (canvas usa 'auto', que em alguns tamanhos desliga o kerning) */
function _brandCtxSetup(ctx, ls){
  if ('letterSpacing' in ctx) ctx.letterSpacing = ls + 'px';
  if ('fontKerning' in ctx) ctx.fontKerning = 'normal';
  if ('textRendering' in ctx) ctx.textRendering = 'optimizeLegibility';
}
class BrandText extends fabric.Textbox {
  static type = 'BrandText';

  constructor(text, options){
    options = options || {};
    super(text, Object.assign({
      fontFamily: "'Courier Prime'", fontSize: 10, fill: '#141414', lineHeight: 1.2, textAlign: 'left',
      editable: false, objectCaching: false,
    }, options));
  }

  initDimensions(){
    if (!this.initialized) return;
    this._brandLines = this._brandComputeLines();
    const lh = this.fontSize * this.lineHeight;
    this.height = Math.max(1, this._brandLines.length) * lh;
  }

  _brandFont(bold){ return `${this.fontStyle||'normal'} ${bold ? 700 : (this.fontWeight||400)} ${this.fontSize}px ${this.fontFamily}`; }
  _brandLS(){ return (this.charSpacing||0) / 1000 * this.fontSize; }
  _brandArrWidth(arr){
    const c = _brandMeasureCtx();
    _brandCtxSetup(c, this._brandLS());
    const pad = this.brandRedPad || 0;
    let w = 0, i = 0;
    while (i < arr.length){
      let j = i; const b = arr[i].b, r = arr[i].r;
      while (j < arr.length && arr[j].b === b && arr[j].r === r) j++;
      c.font = this._brandFont(b);
      w += c.measureText(arr.slice(i, j).map(x=>x.ch).join('')).width + (r ? pad*2 : 0);
      i = j;
    }
    return w;
  }
  _brandParse(){
    const src = this.text || '';
    const chars = []; let b = false, r = false;
    for (let i = 0; i < src.length;){
      if (src[i] === '\\' && i + 1 < src.length){ chars.push({ch: src[i+1], b, r}); i += 2; continue; }
      if (src.startsWith('**', i)){ b = !b; i += 2; continue; }
      if (src.startsWith('[[', i)){ r = true; i += 2; continue; }
      if (src.startsWith(']]', i)){ r = false; i += 2; continue; }
      chars.push({ch: src[i], b, r}); i++;
    }
    return chars;
  }
  _brandComputeLines(){
    const chars = this._brandParse();
    const plain = chars.map(c=>c.ch).join('');
    const W = this.width;
    const trimEnd = (arr)=>{ let n = arr.length; while (n>0 && arr[n-1].ch===' ') n--; return arr.slice(0, n); };
    const saved = Array.isArray(this.brandWraps) && this.brandSrc === plain
      && Math.abs((this.brandFs||0) - this.fontSize) < 0.01 && Math.abs((this.brandW||0) - this.width) < 0.5;
    const soft = new Set(saved ? this.brandWraps : []);
    const paras = [[]];
    chars.forEach(c=>{ if (c.ch === '\n') paras.push([]); else paras[paras.length-1].push(c); });

    const out = []; let offset = 0;
    paras.forEach(p=>{
      if (saved){
        let start = 0;
        for (let i = 1; i <= p.length; i++){
          if (i === p.length || soft.has(offset + i)){ out.push(trimEnd(p.slice(start, i))); start = i; }
        }
        if (!p.length) out.push([]);
      } else if (this.brandNowrap){
        out.push(trimEnd(p));
      } else {
        const tokens = []; let t = [];
        for (let i = 0; i < p.length; i++){
          t.push(p[i]);
          const ch = p[i].ch, nx = p[i+1] && p[i+1].ch;
          if (ch === ' ' && nx && nx !== ' '){ tokens.push(t); t = []; }
          else if (ch === '-' && nx && /[A-Za-z0-9]/.test(nx) && i > 0 && /[A-Za-z0-9]/.test(p[i-1].ch)){ tokens.push(t); t = []; }
        }
        if (t.length) tokens.push(t);
        let line = [], lw = 0;
        tokens.forEach(tk=>{
          const tw = this._brandArrWidth(tk), twTrim = this._brandArrWidth(trimEnd(tk));
          if (line.length && lw + twTrim > W + 0.01){ out.push(trimEnd(line)); line = []; lw = 0; }
          line = line.concat(tk); lw += tw;
        });
        out.push(trimEnd(line));
      }
      offset += p.length + 1;
    });

    const c = _brandMeasureCtx();
    _brandCtxSetup(c, this._brandLS());
    const pad = this.brandRedPad || 0;
    return out.map(arr=>{
      const runs = []; let total = 0, i = 0;
      while (i < arr.length){
        let j = i; const b = arr[i].b, r = arr[i].r;
        while (j < arr.length && arr[j].b === b && arr[j].r === r) j++;
        const txt = arr.slice(i, j).map(x=>x.ch).join('');
        c.font = this._brandFont(b);
        const w = c.measureText(txt).width + (r ? pad*2 : 0);
        runs.push({t: txt, b, r, w}); total += w; i = j;
      }
      return {runs, w: total};
    });
  }

  _render(ctx){
    const lines = this._brandLines || (this._brandLines = this._brandComputeLines());
    const fs = this.fontSize, lh = fs * this.lineHeight, baseY = fs * (this.brandBaseR != null ? this.brandBaseR : 0.8);
    const W = this.width, H = this.height, x0 = -W/2, y0 = -H/2;
    const pad = this.brandRedPad || 0;
    ctx.save();
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    _brandCtxSetup(ctx, this._brandLS());
    ctx.fillStyle = this.fill;
    lines.forEach((ln, i)=>{
      const y = y0 + baseY + i*lh;
      let x = x0;
      if (this.textAlign === 'right') x = x0 + Math.max(0, W - ln.w);
      else if (this.textAlign === 'center') x = x0 + Math.max(0, (W - ln.w)/2);
      ln.runs.forEach(run=>{
        ctx.font = this._brandFont(run.b);
        if (run.r){
          const m = ctx.measureText('Hg');
          ctx.fillStyle = this.brandRedColor || '#0c0c0c';
          ctx.fillRect(x, y - m.fontBoundingBoxAscent, run.w, m.fontBoundingBoxAscent + m.fontBoundingBoxDescent);
          ctx.fillStyle = this.fill;
        } else {
          ctx.fillText(run.t, x + 0, y);
        }
        x += run.w;
      });
    });
    ctx.restore();
  }

  brandCloneOptions(){
    const o = {};
    ['width','fontSize','fontFamily','fontWeight','fontStyle','fill','textAlign','lineHeight','charSpacing','brandBaseR','brandWraps','brandSrc','brandFs','brandW','brandNowrap','brandRedPad','brandRedColor']
      .forEach(k=>{ o[k] = this[k]; });
    return o;
  }
  toObject(props){
    return Object.assign(super.toObject(props), this.brandCloneOptions(), {});
  }
}
fabric.classRegistry.setClass(BrandText, 'BrandText');

/* ---------- Topologia inicial dos diagramas de rede editáveis ---------- */
const DIAGRAM_TOPOLOGY = {
  ns_diagram: {
    stroke: '#6fa8d8',
    nodes: [
      { key: 'ctrl', title: 'CONTROL RM', sub: 'SW-01', x: 126, y: 108, w: 90, h: 50 },
      { key: 'relay', title: 'COMMS RELAY', sub: 'SW-02', x: 276, y: 108, w: 90, h: 50 },
      { key: 'core', title: 'CORE', sub: '', x: 106, y: 206, w: 46, h: 30 },
      { key: 'dive', title: 'DIVE SUPPORT', sub: 'TERM 02–04', x: 56, y: 266, w: 90, h: 55 },
      { key: 'term3', title: 'TERMINAL RM 3', sub: 'TERM 09–12', x: 176, y: 266, w: 90, h: 55 },
      { key: 'moon', title: 'MOONPOOL CTRL', sub: 'TERM 14', x: 356, y: 266, w: 90, h: 55 },
      { key: 'med', title: 'MEDICAL BAY', sub: 'TERM 07', x: 176, y: 334, w: 90, h: 50 },
      { key: 'crane', title: 'CRANE PEDESTAL', sub: 'RELAY ONLY', x: 356, y: 334, w: 90, h: 50 },
    ],
    links: [['ctrl', 'core'], ['core', 'dive'], ['core', 'term3'], ['term3', 'med'], ['relay', 'core', true], ['core', 'moon'], ['moon', 'crane', true]],
  },
};
/* Constrói a topologia inicial como objetos de verdade (tools/network-diagram.js) em vez de
   arte plana — ligações primeiro (ficam por baixo), nós por cima (cobrem o trecho da linha
   que passaria por dentro da caixa, sobra só o trecho visível entre elas). */
function buildDiagramTopology(cv, topo, k){
  const nodes = {};
  topo.nodes.forEach(n=>{
    const [node, handle] = makeNetworkNode({
      left: n.x*k, top: n.y*k, width: n.w*k, height: n.h*k,
      title: n.title, sub: n.sub, stroke: topo.stroke, fontSize: 6*k,
    });
    nodes[n.key] = { node, handle };
  });
  topo.links.forEach(([aKey, bKey, dashed])=>{
    const a = nodes[aKey], b = nodes[bKey];
    if (!a || !b) return;
    cv.add(makeNetworkLink(a.node, b.node, { stroke: topo.stroke, dashed, strokeWidth: 1.3*k }));
  });
  Object.values(nodes).forEach(({node, handle})=>{ cv.add(node); cv.add(handle); });
}

/* ---------- monta um lado num canvas (Canvas do editor ou StaticCanvas da exportação) ---------- */
const BRAND_OBJ_LABEL = {ring:'⭕ Círculo à caneta', stamp:'🔖 Carimbo', logo:'◼ Logo', patch:'◉ Selo Ødemark', mark:'◈ Emblema'};
function makeBrandText(f, k){
  const th = f.angle * Math.PI / 180, w = f.w * k, h = f.h * k;
  const hx = -w/2, hy = -h/2;
  const left = f.cx*k + hx*Math.cos(th) - hy*Math.sin(th);
  const top  = f.cy*k + hx*Math.sin(th) + hy*Math.cos(th);
  return new BrandText(f.text, {
    left, top, originX: 'left', originY: 'top', angle: f.angle,
    width: w, fontSize: f.font.size*k, fontFamily: f.font.family, fontWeight: f.font.weight, fontStyle: f.font.style,
    fill: f.color, opacity: f.opacity, textAlign: f.align, lineHeight: f.lh / f.font.size, charSpacing: f.ls / f.font.size * 1000,
    brandBaseR: f.base / f.font.size, brandWraps: f.wraps, brandSrc: f.plain, brandFs: f.font.size*k, brandW: w,
    brandNowrap: f.nowrap, brandRedPad: f.redPad*k, brandRedColor: f.redBg || '#0c0c0c',
    customType: 'brandText', lockScalingFlip: true,
  });
}
async function buildBrandSide(cv, pack){
  const k = pack.k, W = Math.round(pack.wCss*k), H = Math.round(pack.hCss*k);
  await brandEnsureFonts(pack);
  const artEl = await brandArtElement(pack.key);
  const art = new BrandArt(artEl, {
    left: 0, top: 0, originX: 'left', originY: 'top', scaleX: W/pack.art.w, scaleY: H/pack.art.h,
    selectable: false, evented: true, hoverCursor: 'pointer', customType: 'brandArt',
  });
  art.brandKey = pack.key;
  cv.add(art);
  const items = [];
  pack.objs.forEach(o=>items.push({ord: o.ord, o}));
  pack.fields.forEach(f=>items.push({ord: f.ord, f}));
  items.sort((a, b)=>a.ord - b.ord);
  for (const it of items){
    if (it.o){
      const o = it.o;
      const img = await fabric.Image.fromURL(o.src);
      img.set({
        left: o.x*k, top: o.y*k, originX: 'left', originY: 'top', scaleX: (o.w*k)/img.width, scaleY: (o.h*k)/img.height,
        globalCompositeOperation: o.blend, customType: 'brandObj', __labName: BRAND_OBJ_LABEL[o.kind] || '◼ Elemento',
      });
      cv.add(img);
    } else {
      cv.add(makeBrandText(it.f, k));
    }
  }
  // Diagrama de rede editável (pedido do Max: "um mecanismo para eu editar os nódulos e
  // ligações") — o mapa nunca foi extraído do mockup (a arte só tem timbre/título/nota),
  // ele é montado aqui como nós/ligações de verdade a partir de uma topologia fixa por
  // documento. Só roda pra quem tem uma topologia registrada (hoje: ns_diagram).
  const topo = pack.side === 'front' ? DIAGRAM_TOPOLOGY[pack.doc] : null;
  if (topo) buildDiagramTopology(cv, topo, k);
  // Slots de foto (bug real reportado pelo Max: clicar na caixa "PHOTO ATTACHED" etc não
  // levava a nenhum jeito de trocar por uma foto de verdade, porque era só gradiente
  // pintado na arte travada — sem objeto nenhum ali pra selecionar). Cada data-slot="photo"
  // do mockup vira um placeholder de foto DE VERDADE (mesmo objeto/mesmo fluxo de "Trocar
  // foto" dos templates antigos), inserido por cima da arte, recortado com os cantos
  // arredondados do slot quando o mockup tinha (`rx`).
  for (const slot of (pack.slots||[])){
    if (slot.kind !== 'photo') continue;
    const inset = (slot.inset != null ? slot.inset : 1.2) * k;
    const ph = await makePhotoPlaceholder({
      left: slot.x*k + inset, top: slot.y*k + inset,
      width: Math.max(4, slot.w*k - inset*2), height: Math.max(4, slot.h*k - inset*2),
      rx: Math.max(0, (slot.rx||0)*k - inset*0.3),
    });
    ph.__labName = '🖼 Foto';
    cv.add(ph);
  }
}

/* ---------- estado e troca de lado ---------- */
function brandOnLeave(){ BRAND.cur = null; brandUpdateUI(); }
async function loadBrandDoc(docId, side){
  return withSceneLock(async ()=>{
    const meta = brandDocMeta(docId);
    if (!meta) return;
    side = side || 'front';
    const pack = await brandLoadPack(docId, side);
    const k = meta.k, W = Math.round(meta.wCss*k), H = Math.round(meta.hCss*k);
    currentTemplate = 'brand:'+docId;
    PAGE_SIZES[currentTemplate] = [W, H];
    applyPageSize(currentTemplate);
    currentBgCategory = null; currentBgOpts = null; currentFoldField = null; currentRuledLines = null;
    currentNewsContent = null; currentNewsLayout = null;
    await sceneSwitchTo({}, { buildFresh: ()=>buildBrandSide(canvas, pack) });
    BRAND.cur = {doc: docId, meta, k, W, H, side, sides: {}, extraSides: []};
    PAGES = []; curPageIdx = 0; // documento de marca usa o próprio sistema de lados, não PAGES
    renderLayerList(); updateInspector(); syncNewsLayoutUI(); brandUpdateUI(); updatePageNavUI();
  });
}
/* Lados de um doc de marca = os autorados (c.meta.sides, fixos, vêm do pack) + os que o
   Max adicionou à mão (c.extraSides) — combinados pra navegação/label/export verem uma
   lista só. Pedido do Max: "continua não tendo a opção de adicionar e remover páginas dos
   documentos de marca" — faltava justamente isso, só os docs de template tinham. */
function brandAllSides(c){ return [...c.meta.sides, ...(c.extraSides||[])]; }
async function brandSwitchSide(side){
  const c = BRAND.cur;
  if (!c || c.side === side) return;
  const isCore = c.meta.sides.includes(side);
  if (!isCore && !(c.extraSides||[]).includes(side)) return;
  return withSceneLock(async ()=>{
    cancelCrop(); // antes do snapshot — senão o retângulo de recorte temporário vira parte permanente do lado salvo
    canvas.discardActiveObject();
    c.sides[c.side] = makeSceneSnapshot();
    const saved = c.sides[side];
    await sceneSwitchTo(saved || {}, {
      buildFresh: ()=>brandBuildSideOnCanvas(canvas, c, side),
    });
    c.side = side;
    renderLayerList(); updateInspector(); updateUndoRedoButtons(); brandUpdateUI();
  });
}
/* Nova página em branco DEPOIS da atual, no mesmo documento de marca — mesmo tamanho de
   folha, papel envelhecido liso (sem arte travada, já que não existe mockup pra uma página
   inventada). Max escreve o que quiser nela. */
async function brandAddPage(){
  const c = BRAND.cur; if (!c) return;
  return withSceneLock(async ()=>{
    cancelCrop();
    canvas.discardActiveObject();
    c.sides[c.side] = makeSceneSnapshot();
    const newSide = 'extra_' + Date.now();
    beginBatch();
    try {
      clearDoc();
      await setBackgroundPaper(pickFile('paper_aged', Math.random), {age:0.3});
      canvas.renderAll();
    } finally { endBatch(); }
    c.extraSides = c.extraSides || [];
    c.extraSides.push(newSide);
    c.side = newSide;
    history = []; historyIndex = -1; pushHistory();
    renderLayerList(); updateInspector(); brandUpdateUI();
  });
}
/* Só apaga página EXTRA (adicionada pelo Max) — os lados autorados do pack nunca somem
   por aqui, são o documento em si. */
async function brandDeletePage(){
  const c = BRAND.cur; if (!c || !(c.extraSides||[]).includes(c.side)) return;
  if (!confirm('Apagar esta página? Não dá pra desfazer.')) return;
  // NÃO embrulha em withSceneLock aqui — brandSwitchSide (chamado embaixo) já faz isso, e
  // um withSceneLock dentro de outro vira no-op silencioso (o de dentro vê sceneBusy=true
  // e sai sem fazer nada). A mutação dos arrays abaixo é síncrona, não precisa de trava.
  const all = brandAllSides(c);
  const idx = all.indexOf(c.side);
  c.extraSides.splice(c.extraSides.indexOf(c.side), 1);
  delete c.sides[c.side];
  const target = all[Math.min(idx, all.length-2)] || c.meta.sides[0];
  c.side = null; // força brandSwitchSide a não dar no-op por "já tá nesse lado"
  await brandSwitchSide(target);
}
function brandDownload(dataUrl, name){
  const a = document.createElement('a');
  a.href = dataUrl; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
/* Rótulo do lado pela posição na lista (não pelo id): índice 0 é sempre "Frente"; com
   só 2 lados o segundo é "Verso"; com 3+ (pedido do Max: mais de uma página de verso —
   ex: DRE4 tem 3 páginas) os demais viram "Pág. 3", "Pág. 4"... */
function brandSideLabel(sides, i){
  if (i === 0) return 'Frente';
  if (i === 1 && sides.length === 2) return 'Verso';
  return 'Pág. ' + (i+1);
}
function brandSlug(s){
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
/* Reconstrói UM lado que não está salvo em c.sides — lado autorado busca o pack (como
   sempre); página extra (sem pack, o Max inventou) vira papel envelhecido liso, mesmo
   fallback de brandAddPage/brandSwitchSide. Compartilhado pelos dois exports abaixo. */
async function brandBuildSideOnCanvas(cv, c, side){
  if (c.meta.sides.includes(side)) await buildBrandSide(cv, await brandLoadPack(c.doc, side));
  else await setBackgroundPaper(pickFile('paper_aged', Math.random), {age:0.3});
}
async function brandExportAll(mult){
  const c = BRAND.cur; if (!c) return;
  const allSides = brandAllSides(c);
  canvas.discardActiveObject(); canvas.renderAll();
  const out = {};
  out[c.side] = canvas.toDataURL({format: 'png', multiplier: mult / canvas.getZoom()});
  for (const other of allSides){
    if (other === c.side) continue;
    const sc = new fabric.StaticCanvas(null, {width: c.W, height: c.H, backgroundColor: '#ffffff'});
    const saved = c.sides[other];
    if (saved) await sc.loadFromJSON(saved.json);
    else await brandBuildSideOnCanvas(sc, c, other);
    sc.renderAll();
    out[other] = sc.toDataURL({format: 'png', multiplier: mult});
    sc.dispose();
  }
  const dpi = getExportDpi(c.W*mult, 'brand:'+c.doc);
  const stamp = Date.now();
  allSides.forEach((s, i)=>{
    const label = brandSideLabel(allSides, i);
    setTimeout(()=>brandDownload(pngWithDpi(out[s], dpi), `${c.doc}_${brandSlug(label)}_${stamp}.png`), i*350);
  });
}
/* Mesma varredura de brandExportAll (canvas ao vivo pro lado atual + StaticCanvas pros
   outros), só que junta tudo num PDF só em vez de N PNGs separados — pedido do Max
   ("pronto pra impressão" pra documento de mais de uma página). */
async function brandExportPDF(mult){
  const c = BRAND.cur; if (!c) return;
  const allSides = brandAllSides(c);
  if (allSides.length < 2){ alert('Documento de uma face só — use "Baixar PNG".'); return; }
  canvas.discardActiveObject(); canvas.renderAll();
  const out = [];
  out[allSides.indexOf(c.side)] = canvas.toDataURL({format: 'png', multiplier: mult / canvas.getZoom()});
  for (let i=0; i<allSides.length; i++){
    const s = allSides[i];
    if (s === c.side) continue;
    const sc = new fabric.StaticCanvas(null, {width: c.W, height: c.H, backgroundColor: '#ffffff'});
    const saved = c.sides[s];
    if (saved) await sc.loadFromJSON(saved.json);
    else await brandBuildSideOnCanvas(sc, c, s);
    sc.renderAll();
    out[i] = sc.toDataURL({format: 'png', multiplier: mult});
    sc.dispose();
  }
  const dpi = getExportDpi(c.W*mult, 'brand:'+c.doc);
  const [wIn, hIn] = docPhysicalSize('brand:'+c.doc);
  const orientation = wIn >= hIn ? 'landscape' : 'portrait';
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({orientation, unit:'in', format:[wIn, hIn], compress:true});
  out.forEach((dataUrl, i)=>{
    const d = pngWithDpi(dataUrl, dpi);
    if (i>0) pdf.addPage([wIn, hIn], orientation);
    pdf.addImage(d, 'PNG', 0, 0, wIn, hIn);
  });
  pdf.save(`${c.doc}_${Date.now()}.pdf`);
}
/* Mesma ideia de exportTextForDocs (editor.js), só que varrendo os LADOS de um doc de
   marca (autorados + extras) em vez de PAGES. */
function brandExportText(){
  const c = BRAND.cur; if (!c) return;
  const allSides = brandAllSides(c);
  canvas.discardActiveObject();
  const sections = allSides.map((s, i)=>({
    label: brandSideLabel(allSides, i),
    entries: extractTextEntries(s===c.side ? canvas.getObjects() : (c.sides[s] ? c.sides[s].json.objects : [])),
  }));
  downloadTextSections(c.doc, sections);
}

/* ---------- inspetor do texto de marca ---------- */
function brandFontChoices(){
  const set = new Set(["'Courier Prime'", "'PT Serif'"]);
  Object.values(window.BRAND_PACK || {}).forEach(p=>p.fields.forEach(f=>set.add(f.font.family)));
  return [...set];
}
function renderBrandTextInspector(obj, body){
  const lab1 = document.createElement('label'); lab1.textContent = 'Texto';
  const editBtn = document.createElement('button'); editBtn.textContent = '✎ Abrir editor';
  editBtn.addEventListener('click', ()=>openTextEditor(obj));
  body.appendChild(lab1); body.appendChild(editBtn);
  const hint = document.createElement('div'); hint.className = 'hint';
  hint.textContent = 'No editor: **negrito** e [[trecho censurado]]. Quebras de linha originais valem até você mudar texto, fonte ou largura.';
  body.appendChild(hint);

  const lab = document.createElement('label'); lab.textContent = 'Fonte';
  const sel = document.createElement('select');
  brandFontChoices().forEach(f=>{
    const o = document.createElement('option'); o.value = f; o.textContent = f.split(',')[0].replace(/['"]/g, ''); sel.appendChild(o);
  });
  sel.value = obj.fontFamily;
  sel.addEventListener('change', ()=>{ obj.set('fontFamily', sel.value); canvas.renderAll(); pushHistory(); });
  body.appendChild(lab); body.appendChild(sel);

  body.appendChild(labeledRange('Tamanho', obj.fontSize, 5, 120, 0.5, v=>{ obj.set('fontSize', v); canvas.renderAll(); }));
  const colorLab = document.createElement('label'); colorLab.textContent = 'Cor';
  const colorInp = document.createElement('input'); colorInp.type = 'color'; colorInp.value = rgbToHex(obj.fill);
  colorInp.addEventListener('input', ()=>{ obj.set('fill', colorInp.value); canvas.renderAll(); });
  body.appendChild(colorLab); body.appendChild(colorInp);
  const boldLab = document.createElement('label'); boldLab.className = 'inline';
  const boldCb = document.createElement('input'); boldCb.type = 'checkbox'; boldCb.checked = (+obj.fontWeight||400) >= 600;
  boldCb.addEventListener('change', ()=>{ obj.set('fontWeight', boldCb.checked ? 700 : 400); canvas.renderAll(); pushHistory(); });
  boldLab.appendChild(boldCb); boldLab.appendChild(document.createTextNode(' Negrito no bloco todo'));
  body.appendChild(boldLab);
}
function renderBrandArtInspector(obj, body){
  const h = document.createElement('div'); h.className = 'hint';
  h.textContent = 'Arte do documento (travada): papel, réguas, tabelas, logos e textura. Os textos são camadas separadas por cima — dê duplo clique neles pra editar.';
  body.appendChild(h);
}

/* ---------- UI (aba "Marcas") ---------- */
function brandRenderSideButtons(){
  const row = document.getElementById('sideBtnRow');
  if (!row || !BRAND.cur) return;
  row.innerHTML = '';
  const c = BRAND.cur;
  const sides = brandAllSides(c);
  sides.forEach((s, i)=>{
    const b = document.createElement('button');
    b.className = 'sideBtn' + (c.side === s ? ' active' : '');
    b.textContent = brandSideLabel(sides, i);
    b.addEventListener('click', ()=>brandSwitchSide(s).catch(e=>alert(e.message)));
    row.appendChild(b);
  });
  const isExtra = (c.extraSides||[]).includes(c.side);
  const delBtn = document.getElementById('btnBrandPageDel');
  if (delBtn) delBtn.disabled = !isExtra;
}
function brandUpdateUI(){
  const c = BRAND.cur;
  const act = document.getElementById('brandActive'); if (!act) return;
  act.style.display = c ? 'block' : 'none';
  brandRenderSideButtons();
  if (!c){
    const status = document.getElementById('brandStatus'); if (status) status.textContent = '';
    document.querySelectorAll('.bgModeBtn').forEach(b=>{ b.disabled = false; });
    return;
  }
  const allSides = brandAllSides(c);
  const status = document.getElementById('brandStatus');
  if (status) status.textContent = `${c.meta.familyLabel} — ${c.meta.label} · ${brandSideLabel(allSides, allSides.indexOf(c.side)).toUpperCase()}${allSides.length < 2 ? ' (documento de uma face só)' : ''}`;
  const btnAll = document.getElementById('btnBrandExportBoth');
  if (btnAll) btnAll.textContent = allSides.length > 1 ? `⭳ Baixar todas as ${allSides.length} páginas (${allSides.length} PNGs)` : '⭳ Baixar PNG';
  document.querySelectorAll('.bgModeBtn').forEach(b=>{ b.disabled = true; });
}
/* ---------- Referência rápida de lore (pedido do Max: "lembrete de nomenclaturas e lore
   na lateral pra eu ter tudo das famílias e organizações em fácil acesso") — só o que já
   está estabelecido nos documentos construídos até agora, nada novo inventado aqui. */
const LORE_REF = {
  kelvara: {
    'Pessoas': [['C. Vance', 'Logistics Coordinator, Stavanger HQ'], ['Capt. H. Sæther', 'Master, MS Nordvakt'], ['M. Krog', 'Deck Crew, Topside — reportou o sensor do moonpool'], ['T. Lund', 'Shift Supervisor'], ['E. Solberg', 'Platform Manager, Ødemark A.'], ['K. Andresen', 'Drilling Technician, crachá modelo']],
    'Numeração de documentos': [['KP-LOG-####', 'logística / manifesto de carga'], ['KP-SB-###', 'boletim de segurança'], ['KP-HSE-##', 'formulário HSE'], ['ØA-SO-##', 'ordens de Mørketid, Ødemark A.'], ['ØA-CID-#####', 'crachá de identificação']],
    'Linha do tempo': [['14–22 MAR', 'memorando de logística + manifesto de carga (supply run 11)'], ['15 MAR', 'boletim de segurança — sensor do moonpool (LT-4102B)']],
    'Termos / detalhes': [['MS Nordvakt', 'embarcação de suprimento regular'], ['Mørketid', 'temporada de trevas (NOV–ABR) — vigia dobrada, luzes sempre acesas, regra de duas pessoas no moonpool']],
  },
  neurostat: {
    '⚠ O que a fundação realmente é (spoiler, só pro GM)': [['Fachada pública', 'instituto de risco cognitivo, neurociência aplicada e segurança da informação humana — registro público real, mas é fachada'], ['Por baixo', 'localiza, reabre e explora a herança operacional da @DRE — trata os escombros como propriedade intelectual a recuperar'], ['A petroleira de O Deserto', 'subsidiária industrial da fundação — pessoal de fachada que desconhece pra quem trabalha'], ['Os soldados que desceram', 'mandados pela NeuroStat pra confirmar se a anomalia do fundo voltou'], ['A hipótese de trabalho (ERRADA)', 'contato direto com @Hastur via Serra dos Pesares + um "paciente zero" identificado — mas o rastro de Krause foi consumido junto com o resto, essa identidade não existe mais'], ['Vantagem sobre a DRE', 'comunicação moderna + capacidade de correlação de dados que a DRE nunca teve, fora de qualquer tranca — a condição que conteve o Coro em 1991 (isolamento técnico) não se repete aqui']],
    'Hierarquia (wiki)': [['A Diretoria', 'corpo decisório — define onde o capital entra e o que se busca; nenhum membro em registro público; nunca contato com o que a fundação extrai'], ['Gestão de Projeto', 'responde por UMA operação do início ao fim (orçamento/pessoal/prazo/resultado), reporta direto à Diretoria — quem assinou a ordem de descer à trincheira em O Deserto'], ['Os Técnicos', 'Operador, Verdugos, Cinzas, Analista, Custódio, Escolta — níveis N1 (campo), N2 (técnico), N3 (arquivo/dados), N0 (não-liberado)'], ['Consultoria de Campo', 'especialistas contratados por projeto sob NDA, maioria dispensada ao fim — a maior parte do trabalho de risco é feita por quem não sabe o tamanho do que toca'], ['Fachada', 'funcionários das subsidiárias/institutos que trabalham pra NeuroStat SEM SABER — o quadro da petroleira de O Deserto é pessoal de fachada']],
    'Equipes de campo (wiki)': [['Verdugo', 'extração de espécimes anômalos VIVOS de sítios comprometidos — foi Verdugo que desceu à trincheira'], ['Cinza', 'limpeza e remoção — apaga rastro de operação, neutraliza testemunha, sanitiza um sítio'], ['Cardume', 'escolta e segurança de instalação ativa']],
    'Membros conhecidos (wiki)': [['Marcus Holt', 'sem cargo listado na wiki — ver @Marcus Holt'], ['A. Fischer', 'sem cargo listado na wiki'], ['Félix Carvalho', 'sem cargo listado na wiki']],
    'Pessoas (docs já publicados)': [['M. Holt', 'Field Division Supervisor'], ['R. Okafor', 'Dive Support, NS-F-0212'], ['T. Lindqvist', 'Comms Technician, NS-F-0344 — desligado 02 ABR'], ['Dr. A. Fenn', 'Clinical Psychologist'], ['Dr. R. Achebe', 'Staff Physician'], ['K. Vance', 'Facilities Engineering']],
    'Numeração de documentos': [['NS-DES-####', 'relatório de incidente'], ['NS-PSY-####', 'avaliação psicológica'], ['NS-MED-####', 'exame físico'], ['NS-REQ-####', 'requisição de equipamento'], ['NS-HR-####', 'RH / desligamento'], ['NS-FE-####', 'facilities / rede'], ['NS-INT-####', 'transcrição de entrevista']],
    'Linha do tempo (docs já publicados)': [['21 MAR, 03:12', 'perda de contato com a equipe de mergulho (incidente NS-DES-0451)'], ['24 MAR', 'avaliação psicológica de Okafor + Adendo A'], ['26 MAR', 'entrevista de acompanhamento com Okafor'], ['02 ABR', 'exame físico de Lindqvist + desligamento']],
    'Termos / lore (docs já publicados)': [['Contagem em sete', 'padrão cognitivo recorrente — Okafor e Lindqvist, independentemente'], ['Terminal Room 3', 'nós 09–12, maior concentração de sessões fora de horário na topologia de rede'], ['Cortisol elevado', 'achado em ao menos 2 funcionários do mesmo turno da noite de 21 MAR']],
  },
  dre: {
    '⚠ Conflito de datas (não resolvido)': [['Docs antigos (memo/personnel/briefing/terminal)', '2009–2010 — contradiz "documentação para em 1991"'], ['dre_tag / dre_audio', '1998 — idem'], ['ANSELM.K no log de terminal (dre_terminal, 14 MAR 2010)', 'colide com o nome do Anselm Krause real da wiki (arquivista, paciente zero do Coro, apagado em 1991) — não editado ainda, perguntar ao Max se é erro ou gancho intencional'], ['Catalog cards novos (ARC/Anomaly)', 'já respeitam 1991 — únicos alinhados com a wiki até agora']],
    'Hierarquia de comando (wiki)': [['Conclave', 'corpo decisório máximo, composição/identidade nunca registradas, nunca contato direto com anomalia'], ['Curadoria', 'camada executiva, concentrava o conhecimento consolidado — foi aqui que @O Coro foi reconstruído a partir dos fragmentos'], ['Diretor de Instalação', 'autoridade máxima local, reporta à Curadoria'], ['Chefia de Setor', 'comando técnico de um setor dentro da instalação'], ['Pessoal de base', 'pesquisadores, operadores, técnicos, arquivistas, segurança']],
    'Classificação de pessoal (wiki)': [['Classe Selada', 'proibida de qualquer contato direto com anomalia — o Conclave é Selada'], ['Classe de Contato', 'trabalha com anomalias já em quarentena cognitiva / liberadas de efeito memético'], ['Classe de Exposição', 'pessoal descartável, testes de contato direto, recrutado fora dos quadros permanentes'], ['Liberação 1–5', 'acesso à informação, sobreposto à classe — Liberação 5 = arquivo irrestrito']],
    'Setores (wiki)': [['Correlação', 'cruzava registros de anomalias entre instalações pela rede fechada'], ['Contenção', 'manutenção física e cognitiva das anomalias presas'], ['Norma', 'pesquisa de anomalias de ruptura da realidade'], ['Recuperação', 'campo — localizava/isolava/trazia anomalias pra contenção'], ['Psicoanálise', 'neutralizava efeito memético antes de liberar pra Classe de Contato'], ['Telecomunicação', 'rede fechada entre instalações, tecnologia décadas à frente'], ['Arquivos', 'guarda da documentação, em transição física→digital no fim'], ['Identificação', 'produzia e controlava os chips de identificação']],
    'Grupos de Campo (wiki)': [['Equipe Orfeu', 'anomalias biológicas/químicas/radiológicas, surtos contagiosos'], ['Equipe Erebo', 'subsolo e subaquático profundo, atuava com o Setor Erebo'], ['Equipe Lázaro', 'quarentena cognitiva de campo — treinada pra CONTER sem compreender'], ['Equipe Sentinela', 'contrainteligência — cultos do Mythos, vazamento de conhecimento anômalo'], ['Equipe Sudário', 'recuperação de pessoal/material em instalação comprometida, entra onde a contenção falhou']],
    'Classificação de anomalias (wiki)': [['AWE / ERA 1–4', 'mudança no plano da existência — Class1 ≤100km, Class2 ≤10.000km, Class3 global, Class4 possivelmente cósmico'], ['ARC / CAC', 'itens com efeito anômalo ligado a eles'], ['BLOOM / VODMO', 'vida orgânica de mutação oculta'], ['Eidolon', 'entidade anômala sem corpo material'], ['Telos', 'tudo que a DRE fez ou derivou de anomalias'], ['BREACH / PREQUE', 'concentração física de anomalias ligada fisicamente a uma realidade externa'], ['Apeiron', 'nome pros deuses antigos e a pesquisa da DRE sobre eles'], ['Noetic', 'adendo do Max (fora da wiki original) — memetic/knowledge hazard']],
    'Tolerância T0–T3 (wiki)': [['T0', 'Inerte'], ['T1', 'Contido'], ['T2', 'Manutenção constante necessária'], ['T3', 'Impossível de conter, ou ainda não contido — ex. da wiki: "A Colônia é um BLOOM T2"']],
    'Instalações conhecidas (wiki)': [['Complexo Heisenberg', '@Schwarzwald-Süd, sul da Alemanha, erguido 1929–34 sobre ponto de Véu fino; DRE não abriu @O Outro Mundo, só conectou a cidade a ele; depois virou fachada Heisenberg Pharmaceutical pela @Aegis Corporation'], ['Complexo Serra dos Pesares', 'Santa Catarina, Brasil, subterrâneo sob fachada de mineração de carvão; conduziu o @Projeto SOMA e a mineração em direção a @Hastur; incidente catastrófico de 1987']],
    'Membros conhecidos (wiki, sem doc ainda)': [['Dra. Elena Voss', 'sem cargo listado na wiki'], ['Dr. Adrian Mühler', 'chefe científico do Setor Heisenberg durante o incidente'], ['Dr. Leo Fischer', 'sem cargo listado na wiki'], ['Dr. Elias Hartwich', 'sem cargo listado na wiki'], ['Dra. Sabine Reitz', 'sem cargo listado na wiki'], ['L. Häuser', 'sem cargo listado na wiki']],
    '⚠ O que realmente aconteceu em 1991 (spoiler, só pro GM)': [['Causa real', '@O Coro chegou à DRE como desaparecimentos tratados como anomalias menores em várias instalações; Setor de Correlação cruzou os registros pela rede fechada'], ['Anselm Krause', 'arquivista de BASE (baixa liberação), encarregado da documentação física pré-digitalização — manuseou o material já consolidado e fechou a contemplação; a palavra saiu dele, não por escolha'], ['O apagamento', 'TODOS os membros da DRE, ligados pela mesma rede, apagados no mesmo instante em TODAS as instalações — algumas anomalias contidas sumiram junto; a seção de O Deserto foi a ÚLTIMA a cair, isolada no Atlântico, só percebeu pelo silêncio das outras'], ['Por que não se repete', 'a condição que conteve o Coro foi o ISOLAMENTO TÉCNICO da DRE (tecnologia pré-90 não alcançava além dos muros da organização) — a NeuroStat tem comunicação moderna e correlação de dados real, essa condição não existe mais pra ela'], ['Hipótese da NeuroStat', 'contato direto com @Hastur via Serra dos Pesares + um "paciente zero" identificado — a própria wiki diz que essa hipótese ESTÁ ERRADA (o rastro de Krause foi consumido com o resto, essa identidade não existe mais pra seguir)']],
    '⚠ O Coro / væl.juˈeɪn — mecânica (spoiler, só pro GM)': [['O que é', 'um CONCEITO — informação que existe na realidade sem corpo nem origem, se aloja em mentes humanas de grande força de vontade, em pontos fixos da Terra; chega fragmentado (imagem, som, estrutura) e se monta aos poucos'], ['Não é invocado', 'a fração chega sozinha; mentes fortes RESISTEM à compulsão de espalhar o fragmento — o fragmento que para numa mente resistente nunca completa, e sem completar não dispara. Dá pra carregar um pedaço a vida inteira sem cruzar o limiar'], ['O gatilho é ACÚMULO', 'o salto de fragmento pra contemplação inteira exige pedaços de MENTES DIFERENTES, captados em LUGARES diferentes, reunidos num mesmo entendimento — é a integridade que mata, não o fragmento isolado'], ['Geografia própria', 'distinta das Feridas do Véu (tipo @Schwarzwald-Süd — "de carne e ruptura"); a geografia do Coro é "de silêncio", sobreposta e independente — @Serra dos Pesares é um ponto tocado conhecido'], ['væl.juˈeɪn', 'o nome da fração — sem grafia, sem registro, sem fonte; já está em TODA mente humana abaixo da consciência; compreender = articular, e a articulação não passa por escolha — no instante em que a contemplação se completa, a palavra sai sozinha'], ['O apagamento em si', 'dita uma vez, por uma só pessoa, a palavra apaga SIMULTANEAMENTE todos os que têm consciência do Coro — inclusive quem nunca ouviu a palavra, porque a CONSCIÊNCIA da fração já é a condição, não a audição dela']],
    'Pessoas (lore dos documentos já publicados)': [['R.K.', 'Sublevel Command — iniciais em várias assinaturas/carimbos'], ['K. Marchetti', 'Director, Sublevel'], ['T. Reyes (SL-0338)', 'Sr. Network Analyst — acesso noturno ao Terminal 11 desde 1996'], ['M. Osei', 'Audio Laboratory'], ['Dir. Halloran', 'Records']],
    'Numeração de documentos': [['SL-YY-####', 'memorando / briefing'], ['AL-YY-####', 'Audio Laboratory'], ['DRE-####', 'caso de evidência'], ['FORM DRE-##', 'formulário interno (personnel, evidência, tramitação)'], ['FORM DRE-63', 'catalog card de artefato (ARC)'], ['FORM DRE-64', 'catalog card de anomalia']],
    'Linha do tempo (docs já publicados)': [['1996', 'T. Reyes começa na DRE (Facilities)'], ['11/1998', 'gravador recuperado — etiqueta DRE-0447/003'], ['12/1998', 'gravação examinada pelo Audio Lab'], ['02–10 JAN', 'janela de auditoria do acesso ao Terminal 11'], ['14 MAR 2010', 'memorando de rede + log de terminal (ANSELM.K) — ver conflito de datas acima'], ['06 JUL 2009', 'ficha de pessoal de Reyes reemitida'], ['09/11/88', 'recuperação do ARC-0891 (Equipe Sudário)'], ['03/1989', 'ANOM-0447 registrada, Complexo Heisenberg Setor Erebo']],
    'Termos / lore (docs já publicados)': [['Terminal 11', 'Sublevel Core — acesso após-horário recorrente, nunca explicado'], ['ANSELM.K', 'último operador registrado no log de terminal, 14 MAR 2010'], ['Gravador DRE-0447/003', 'contagem em sete, segunda voz aos 02:24, corte abrupto aos 02:44'], ['ARC-0891', 'artefato, Tier T1, Equipe Sudário'], ['ANOM-0447', 'Recurrent Numerical Intrusion — Minor, Noetic, T0, fechada "UNCORRELATED"']],
  },
  odemark: {
    'Pessoas': [['E. Solberg', 'Platform Manager'], ['K. Andresen', 'Drilling Technician, Kelvara Petrochemicals']],
    'Numeração de documentos': [['ØA-SO-##', 'ordens permanentes (Mørketid)'], ['ØA-CID-#####', 'crachá de identificação']],
    'Linha do tempo': [['01 NOV – 30 ABR', 'temporada Mørketid, ordens em vigor']],
    'Termos / lore': [['Operada pela Kelvara', 'Ødemark A. é uma plataforma da Kelvara Petrochemicals'], ['Regra de duas pessoas', 'ninguém trabalha sozinho no corrimão do moonpool'], ['Sinais de alarme', 'Generalalarm (contínuo) · Gassalarm (intermitente) · Evakuering (só por ordem no PA)']],
  },
};
function renderLoreData(boxId, data, emptyMsg){
  const box = document.getElementById(boxId);
  if (!box) return;
  box.innerHTML = '';
  if (!data){ box.textContent = emptyMsg || 'Sem referência.'; return; }
  Object.entries(data).forEach(([section, rows])=>{
    const det = document.createElement('details'); det.className = 'loreSec';
    const sum = document.createElement('summary'); sum.textContent = section; det.appendChild(sum);
    const dl = document.createElement('dl');
    rows.forEach(([term, def])=>{
      const dt = document.createElement('dt'); dt.textContent = term;
      const dd = document.createElement('dd'); dd.textContent = def;
      dl.appendChild(dt); dl.appendChild(dd);
    });
    det.appendChild(dl);
    box.appendChild(det);
  });
}
function renderLoreRef(familyId){
  renderLoreData('loreRef', LORE_REF[familyId], 'Sem referência ainda pra esta organização.');
}
/* Cosmologia/Mythos: pano de fundo geral (Azathoth, Hastur, O Coro, a trama atual) — não
   muda com a organização selecionada em #brandFamily, por isso não vive dentro de
   LORE_REF (que é por família) e é renderizado UMA vez só, não a cada troca de dropdown. */
const MYTHOS_REF = {
  'Núcleo — Deuses Antigos': [
    ['Azathoth', 'Sultão-Demônio, Caos Nuclear, deus cego e idiota no CENTRO de tudo — a realidade é o sonho informe que emana dele. Os Deuses Exteriores tocam música dissonante sem parar pra mantê-lo dormindo; o despertar dele seria a dissolução de tudo que o sonho sustenta'],
    ['Yog-Sothoth', 'o Tudo-em-Um e o Um-em-Tudo, o Portão e a Chave — coextensivo a todo espaço e tempo sem pertencer ao universo que permeia. Onde uma camada da realidade toca outra, é ele o limiar'],
    ['Nyarlathotep', 'o Caos Rastejante — alma e arauto dos Outros Deuses; diferente dos demais, CAMINHA entre os homens, sob mil faces'],
    ['Cthulhu', 'jaz sonhando na cidadela submersa de R\'lyeh, à espera de quando as estrelas se alinhem'],
    ['Shub-Niggurath', 'a Cabra Negra dos Bosques de Mil Filhotes — prolifera nas margens da fertilidade monstruosa'],
    ['Hastur', 'o Inominável, Rei de Amarelo — reina sobre a cidade morta de Carcosa, à margem do lago de Hali, sob estrelas negras. ÚNICO Grande Antigo que fala direto com os seus (o Signo Amarelo, a peça maldita que leva o título dele) — os outros recebem devoção em silêncio, ele instrui. Diz reconhecer uma afinidade com a humanidade, "como um filósofo que pensa na existência de formigas com a moralidade de suas ações"'],
  ],
  '⚠ Trama atual (spoiler, pra onde a campanha vai)': [
    ['Ubbo-Sathla', 'deixou de existir sem motivo no centro da terra, espalhando restos de si — um desses restos virou @A Colônia (WIP), que teve influência de Hastur. Isso avisou Hastur de que tem algo errado acontecendo na Terra'],
    ['O culpado real', '@Nyarlathotep — está preparando o nascimento de um novo deus, e a Terra se apresentou como berço perfeito (vida pra consumir/cativar + vidas manipuláveis)'],
    ['Hastur', 'preferia ficar neutro nisso até Nyarlathotep manipular O Círculo pra abrir os portões de Azathoth e enfraquecer Ubbo-Sathla, deixando a nova entidade parasitária tomar o lugar dele'],
    ['Os Sonhadores das Máscara', 'culto paratecnológico que Nyarlathotep criou manipulando residentes de cidades isoladas, pra preparar a chegada do novo deus'],
    ['Gancho pra próxima campanha', 'o culto do Signo Amarelo tomou posse de um agente do FBI que está investigando isso'],
  ],
  '⚠ O Coro / væl.juˈeɪn — mecânica (spoiler, cognitohazard)': [
    ['O que é', 'um CONCEITO — informação que existe na realidade sem corpo nem origem, se aloja em mentes humanas de grande força de vontade, em pontos fixos da Terra; chega fragmentado (imagem, som, estrutura) e se monta aos poucos'],
    ['Não é invocado', 'a fração chega sozinha; mentes fortes RESISTEM à compulsão de espalhar o fragmento — o fragmento que para numa mente resistente nunca completa, e sem completar não dispara. Dá pra carregar um pedaço a vida inteira sem cruzar o limiar'],
    ['O gatilho é ACÚMULO', 'o salto de fragmento pra contemplação inteira exige pedaços de MENTES DIFERENTES, captados em LUGARES diferentes, reunidos num mesmo entendimento — é a integridade que mata, não o fragmento isolado'],
    ['Geografia própria', 'distinta das Feridas do Véu (tipo @Schwarzwald-Süd — "de carne e ruptura"); a geografia do Coro é "de silêncio", sobreposta e independente — @Serra dos Pesares é um ponto tocado conhecido'],
    ['væl.juˈeɪn', 'o nome da fração — sem grafia, sem registro, sem fonte; já está em TODA mente humana abaixo da consciência; compreender = articular, e a articulação não passa por escolha — no instante em que a contemplação se completa, a palavra sai sozinha'],
    ['O apagamento em si', 'dita uma vez, por uma só pessoa, a palavra apaga SIMULTANEAMENTE todos os que têm consciência do Coro — inclusive quem nunca ouviu a palavra, porque a CONSCIÊNCIA da fração já é a condição, não a audição dela'],
  ],
  'Entidades do Mythos encontradas': [
    ['@Necronomicon (Al Azif)', 'citado só pelo nome na wiki, sem detalhe ainda'],
    ['@Shoggoth', 'citado só pelo nome na wiki, sem detalhe ainda'],
    ['@O Observador Eterno', 'citado só pelo nome na wiki, sem detalhe ainda'],
    ['@O Outro Mundo (Hohlschicht)', 'citado só pelo nome na wiki, sem detalhe ainda — ver @Schwarzwald-Süd pro contexto de como a DRE o conectou à cidade'],
  ],
};
function renderMythosRef(){
  renderLoreData('mythosRef', MYTHOS_REF);
}

(function brandInitUI(){
  const fam = document.getElementById('brandFamily'), doc = document.getElementById('brandDoc');
  if (!fam || !window.BRAND_INDEX) return;
  window.BRAND_INDEX.forEach(f=>{ const o = document.createElement('option'); o.value = f.id; o.textContent = f.label; fam.appendChild(o); });
  const fill = ()=>{
    doc.innerHTML = '';
    const f = window.BRAND_INDEX.find(x=>x.id === fam.value);
    f.docs.forEach(d=>{ const o = document.createElement('option'); o.value = d.id; o.textContent = d.label + (d.sides.length > 1 ? ` (${d.sides.length} páginas)` : ''); doc.appendChild(o); });
    renderLoreRef(fam.value);
  };
  fam.addEventListener('change', fill); fill();
  document.getElementById('btnBrandLoad').addEventListener('click', ()=>{
    if (!confirm('Isso apaga o documento atual. Continuar?')) return;
    const btn = document.getElementById('btnBrandLoad'); btn.disabled = true;
    loadBrandDoc(doc.value, 'front').catch(e=>alert(e.message)).finally(()=>{ btn.disabled = false; });
  });
  document.getElementById('btnBrandExportBoth').addEventListener('click', ()=>brandExportAll(+document.getElementById('exportScale').value).catch(e=>alert(e.message)));
  document.getElementById('btnBrandExportPDF').addEventListener('click', ()=>brandExportPDF(+document.getElementById('exportScale').value).catch(e=>alert(e.message)));
  document.getElementById('btnBrandPageAdd').addEventListener('click', ()=>brandAddPage().catch(e=>alert(e.message)));
  document.getElementById('btnBrandPageDel').addEventListener('click', ()=>brandDeletePage().catch(e=>alert(e.message)));
  document.getElementById('btnBrandExportText').addEventListener('click', brandExportText);
  renderMythosRef();
  brandUpdateUI();
})();
