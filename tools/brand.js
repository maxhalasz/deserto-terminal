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
    s.src = `vendor/brand/${doc}_${side}.js`;
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
}

/* ---------- estado e troca de lado ---------- */
function brandOnLeave(){ BRAND.cur = null; brandUpdateUI(); }
async function loadBrandDoc(docId, side){
  const meta = brandDocMeta(docId);
  if (!meta) return;
  side = side || 'front';
  const pack = await brandLoadPack(docId, side);
  const k = meta.k, W = Math.round(meta.wCss*k), H = Math.round(meta.hCss*k);
  cancelCrop();
  restoringHistory = true;
  try {
    currentTemplate = 'brand:'+docId;
    PAGE_SIZES[currentTemplate] = [W, H];
    applyPageSize(currentTemplate);
    clearDoc();
    currentBgCategory = null; currentBgOpts = null; currentFoldField = null; currentRuledLines = null;
    currentNewsContent = null; currentNewsLayout = null;
    await buildBrandSide(canvas, pack);
    canvas.renderAll();
  } finally { restoringHistory = false; }
  BRAND.cur = {doc: docId, meta, k, W, H, side, sides: {}};
  history = []; historyIndex = -1;
  pushHistory();
  renderLayerList(); updateInspector(); syncNewsLayoutUI(); brandUpdateUI();
}
async function brandSwitchSide(side){
  const c = BRAND.cur;
  if (!c || c.side === side || !c.meta.sides.includes(side)) return;
  cancelCrop();
  canvas.discardActiveObject();
  c.sides[c.side] = {json: JSON.parse(JSON.stringify(canvas.toObject(HISTORY_PROPS))), history, historyIndex};
  const pack = await brandLoadPack(c.doc, side);
  const saved = c.sides[side];
  restoringHistory = true;
  try {
    if (saved) await canvas.loadFromJSON(saved.json);
    else { clearDoc(); await buildBrandSide(canvas, pack); }
    canvas.renderAll();
  } finally { restoringHistory = false; }
  if (saved){ history = saved.history; historyIndex = saved.historyIndex; }
  else { history = []; historyIndex = -1; pushHistory(); }
  c.side = side;
  renderLayerList(); updateInspector(); updateUndoRedoButtons(); brandUpdateUI();
}
function brandDownload(dataUrl, name){
  const a = document.createElement('a');
  a.href = dataUrl; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
async function brandExportBoth(mult){
  const c = BRAND.cur; if (!c) return;
  canvas.discardActiveObject(); canvas.renderAll();
  const out = {};
  out[c.side] = canvas.toDataURL({format: 'png', multiplier: mult / canvas.getZoom()});
  for (const other of c.meta.sides){
    if (other === c.side) continue;
    const sc = new fabric.StaticCanvas(null, {width: c.W, height: c.H, backgroundColor: '#ffffff'});
    const saved = c.sides[other];
    if (saved) await sc.loadFromJSON(saved.json);
    else await buildBrandSide(sc, await brandLoadPack(c.doc, other));
    sc.renderAll();
    out[other] = sc.toDataURL({format: 'png', multiplier: mult});
    sc.dispose();
  }
  const stamp = Date.now();
  Object.keys(out).forEach((s, i)=>setTimeout(()=>brandDownload(out[s], `${c.doc}_${s === 'front' ? 'frente' : 'verso'}_${stamp}.png`), i*350));
}
/* Foto no encaixe do cartão (recorte "cover", cantos arredondados como a moldura) */
function brandAddPhoto(file){
  const c = BRAND.cur; if (!c) return;
  const pack = window.BRAND_PACK[c.doc+':'+c.side];
  const slot = pack && pack.slots.find(s=>s.kind === 'photo');
  if (!slot) return;
  const reader = new FileReader();
  reader.onload = (e)=>{
    fabric.Image.fromURL(e.target.result).then(img=>{
      const k = c.k, inset = 1;
      const sw = (slot.w - inset*2) * k, sh = (slot.h - inset*2) * k;
      const ir = img.width / img.height, tr = sw / sh;
      let cw = img.width, ch = img.height;
      if (ir > tr) cw = img.height * tr; else ch = img.width / tr;
      const scale = sw / cw;
      img.set({
        left: (slot.x + inset)*k, top: (slot.y + inset)*k, originX: 'left', originY: 'top',
        cropX: (img.width - cw)/2, cropY: (img.height - ch)/2, width: cw, height: ch, scaleX: scale, scaleY: scale,
        customType: 'photo', __labName: '🖼 Foto do cartão',
        clipPath: new fabric.Rect({width: cw, height: ch, rx: 5*k/scale, ry: 5*k/scale, originX: 'center', originY: 'center', left: 0, top: 0}),
      });
      canvas.getObjects().filter(o=>o.__labName === '🖼 Foto do cartão').forEach(o=>canvas.remove(o));
      canvas.insertAt(1, img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  };
  reader.readAsDataURL(file);
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
function brandUpdateUI(){
  const c = BRAND.cur;
  const act = document.getElementById('brandActive'); if (!act) return;
  act.style.display = c ? 'block' : 'none';
  document.querySelectorAll('.sideBtn').forEach(b=>{
    b.classList.toggle('active', !!c && b.dataset.side === c.side);
    b.disabled = !c || !c.meta.sides.includes(b.dataset.side);
  });
  const status = document.getElementById('brandStatus');
  if (status) status.textContent = c ? `${c.meta.familyLabel} — ${c.meta.label} · ${c.side === 'front' ? 'FRENTE' : 'VERSO'}${c.meta.sides.length < 2 ? ' (documento de uma face só)' : ''}` : '';
  const pack = c && window.BRAND_PACK[c.doc+':'+c.side];
  const slotRow = document.getElementById('brandSlotRow');
  if (slotRow) slotRow.style.display = (pack && pack.slots.some(s=>s.kind === 'photo')) ? 'block' : 'none';
  document.querySelectorAll('.bgModeBtn').forEach(b=>{ b.disabled = !!c; });
}
(function brandInitUI(){
  const fam = document.getElementById('brandFamily'), doc = document.getElementById('brandDoc');
  if (!fam || !window.BRAND_INDEX) return;
  window.BRAND_INDEX.forEach(f=>{ const o = document.createElement('option'); o.value = f.id; o.textContent = f.label; fam.appendChild(o); });
  const fill = ()=>{
    doc.innerHTML = '';
    const f = window.BRAND_INDEX.find(x=>x.id === fam.value);
    f.docs.forEach(d=>{ const o = document.createElement('option'); o.value = d.id; o.textContent = d.label + (d.sides.length > 1 ? ' (frente + verso)' : ''); doc.appendChild(o); });
  };
  fam.addEventListener('change', fill); fill();
  document.getElementById('btnBrandLoad').addEventListener('click', ()=>{
    if (!confirm('Isso apaga o documento atual. Continuar?')) return;
    const btn = document.getElementById('btnBrandLoad'); btn.disabled = true;
    loadBrandDoc(doc.value, 'front').catch(e=>alert(e.message)).finally(()=>{ btn.disabled = false; });
  });
  document.querySelectorAll('.sideBtn').forEach(b=>b.addEventListener('click', ()=>brandSwitchSide(b.dataset.side).catch(e=>alert(e.message))));
  document.getElementById('btnBrandExportBoth').addEventListener('click', ()=>brandExportBoth(+document.getElementById('exportScale').value).catch(e=>alert(e.message)));
  document.getElementById('brandPhotoFile').addEventListener('change', (e)=>{ const f = e.target.files[0]; if (f) brandAddPhoto(f); e.target.value = ''; });
  brandUpdateUI();
})();
