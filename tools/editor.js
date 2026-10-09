/* ===================== Editor principal (Fabric.js) =====================
   PAGE_W/PAGE_H e o motor de layout do jornal (presets, colunas, pull-quote,
   caixa lateral) vêm de layout.js. */
const TEX_CATS = {
  // paper_aged_2.jpg e paper_aged_3.jpg removidas: são fotos de livro ABERTO
  // (lombada/dobra central visível), e o crop centralizado de setBackgroundPaper
  // deixa essa vinca bem no meio da página final — confirmado ao vivo no template
  // Etiqueta 2026-09-21. Não reintroduzir sem recortar/rejeitar a lombada.
  paper_aged: ['paper_aged_1.jpg','paper_aged_4.jpg','paper_aged_5.jpg','paper_aged_6.jpg','paper_aged_7.jpg'],
  // paper_aged_2.jpg e paper_aged_3.jpg voltam aqui, dedicadas ao template
  // "Diário — página dupla" (loadTemplate name==='diary') — a lombada de livro
  // que as tirou do pool geral é exatamente o que esse template precisa.
  paper_aged_bookspread: ['paper_aged_2.jpg','paper_aged_3.jpg'],
  // paper_notebook_2.jpg removida: marca d'água de banco de imagens visível na
  // foto inteira (confirmado ao vivo 2026-09-21) — não reintroduzir sem achar
  // substituto limpo.
  paper_notebook_ruled: ['paper_notebook_4.jpg'],
  paper_notebook_plain: ['paper_notebook_1.jpg','paper_notebook_3.jpg'],
  paper_newsprint: ['paper_newsprint_1.jpg'],
  stain_shape: ['stain_shape_1.jpg','stain_shape_2.jpg','stain_shape_3.jpg'],
  stain_coffee: ['stain_coffee_1.jpg'],
  stain_blood: ['stain_blood_1.jpg'],
  stain_mold: ['stain_mold.jpg'],
  grunge: ['metal_scratched_1.jpg','metal_rusted_1.jpg','metal_brushed_1.jpg','metal_brushed_2.jpg'],
};
function pickFile(cat, rng){ const a=TEX_CATS[cat]; return a[Math.floor((rng?rng():Math.random())*a.length)]; }

let canvas;
let currentTemplate = 'newspaper';
let currentNewsContent = null;
let currentNewsLayout = null;

/* ===================== Páginas (documento com mais de uma folha) =====================
   Pedido do Max: documentos de template (relatório, dossiê, carta etc, NÃO os de marca —
   esses já têm o próprio sistema de frente/verso fixo) precisam poder crescer além de uma
   folha só, pra ficar pronto pra impressão (ex: um relatório de 3 páginas). Cada página
   guarda seu PRÓPRIO snapshot (json do canvas + histórico de desfazer/refazer), igual o
   padrão já provado em BRAND.cur.sides — troca de página é só salvar a atual e carregar a
   outra. `PAGES[i].pageW/pageH/template` existem pra o tamanho de folha (que já varia por
   template, ver PAGE_SIZES) viajar junto com a página certa. */
let PAGES = [];
let curPageIdx = 0;

/* ===================== Histórico (undo/redo) =====================
   Mesmo padrão de tools/image-lab.js: pilha de snapshots canvas.toObject(),
   guardando as propriedades customizadas que cada tipo de objeto usa fora do
   schema padrão do Fabric. `restoringHistory` evita que a própria restauração
   (ou uma reconstrução em lote, tipo trocar preset de jornal) dispare pushes
   espúrios — os eventos object:added/removed disparam um por objeto mesmo numa
   operação em lote. */
const HISTORY_PROPS = ['customType','__paperFile','personaId','fatigue','seed','redactPct','__docVariant','__docPageKind','__newsGenerated','__newsRole','__flowIdx','__flowPara','__newsState','__labName','__oid','__ownerOid','__cornerRadiusPx','__linkA','__linkB','__stampOptions','__userGroup','__userLocked'];
let history = [];
let historyIndex = -1;
/* Contador de profundidade, NÃO boolean — uma operação em lote (trocar de página, trocar
   de lado de doc de marca, recarregar histórico) pode disparar OUTRA operação em lote por
   baixo antes de terminar (ex: trocar de página chama canvas.loadFromJSON, que dispara
   object:added por objeto). Um boolean com "salva o valor antigo, restaura no finally" só
   funciona se TODO call site lembrar de fazer isso certo — dois (pageGo/pageDelete) não
   lembravam e resetavam pra false incondicional, fechando o lote externo cedo demais. Um
   contador fecha sozinho: beginBatch/endBatch sempre dão certo não importa o aninhamento. */
let restoringHistory = 0;
function beginBatch(){ restoringHistory++; }
function endBatch(){ restoringHistory = Math.max(0, restoringHistory-1); }

/* Trava simples pra operações de "troca de cena" (carregar template, trocar/adicionar/
   apagar página, carregar doc de marca, trocar de lado) — todas mexem em PAGES/BRAND.cur/
   currentTemplate/history ao mesmo tempo que esperam um await (loadFromJSON, carregar
   fonte, montar arte). O contador de lote acima já deixa o HISTÓRICO seguro mesmo se duas
   dessas rodarem juntas, mas a troca de PÁGINA/ESTADO em si (ex: dois cliques rápidos em
   "Próxima") ainda poderia embaralhar `curPageIdx`/`PAGES` — essa trava impede que uma
   segunda operação comece antes da primeira terminar. */
let sceneBusy = false;
async function withSceneLock(fn){
  if (sceneBusy) return;
  sceneBusy = true;
  try { await fn(); } finally { sceneBusy = false; }
}
const HISTORY_LIMIT = 40;
function pushHistory(){
  if (restoringHistory) return;
  const snap = JSON.parse(JSON.stringify(canvas.toObject(HISTORY_PROPS)));
  history = history.slice(0, historyIndex+1);
  history.push(snap);
  if (history.length > HISTORY_LIMIT) history.shift();
  historyIndex = history.length-1;
  updateUndoRedoButtons();
}
async function restoreHistory(idx){
  if (idx<0 || idx>=history.length) return;
  beginBatch();
  cancelCrop();
  try {
    await canvas.loadFromJSON(history[idx]);
    canvas.renderAll();
    historyIndex = idx;
  } finally { endBatch(); }
  renderLayerList();
  updateInspector();
  updateUndoRedoButtons();
  syncNewsLayoutUI();
}
function undo(){ if (historyIndex>0) restoreHistory(historyIndex-1); }
function redo(){ if (historyIndex<history.length-1) restoreHistory(historyIndex+1); }
function updateUndoRedoButtons(){
  const bu = document.getElementById('btnUndo'), br = document.getElementById('btnRedo');
  if (bu) bu.disabled = historyIndex<=0;
  if (br) br.disabled = historyIndex>=history.length-1;
}

function initCanvas(){
  canvas = new fabric.Canvas('editorCanvas', {
    width: PAGE_W, height: PAGE_H,
    backgroundColor: '#ffffff',
    preserveObjectStacking: true,
  });
  canvas.on('selection:created', updateInspector);
  canvas.on('selection:updated', updateInspector);
  canvas.on('selection:cleared', updateInspector);
  canvas.on('object:modified', ()=>{ renderLayerList(); pushHistory(); });
  // renderLayerList só fora de operações em lote (restoringHistory): um documento de
  // marca tem ~150 camadas, e redesenhar a lista (com miniaturas) a cada objeto
  // adicionado seria quadrático — os chamadores em lote já chamam renderLayerList no fim.
  canvas.on('object:added', e=>{
    if (!restoringHistory) renderLayerList();
    pushHistory();
    // nunca deixa o Fabric entrar no modo de edição nativo — sempre passa pelo
    // modal (cursor confiável, prévia ao vivo). Ver comentário em openTextEditor.
    const o = e.target;
    if (o && isModalText(o)) o.editable = false;
  });
  canvas.on('object:removed', ()=>{ if (!restoringHistory) renderLayerList(); pushHistory(); });
  canvas.on('mouse:dblclick', e=>{
    const o = e.target;
    if (o && isModalText(o)){ openTextEditor(o); return; }
    // Duplo clique num filho de um Group não-interativo (carimbo, nó de rede) — o Fabric
    // resolve o grupo inteiro como `target`, mas relata qual filho foi clicado via
    // `e.subTargets` (confirmado ao vivo, ver network-diagram.js). Mesmo modal de sempre.
    if (o && o.type==='group' && e.subTargets && e.subTargets.length){
      const sub = e.subTargets.find(isModalText);
      if (sub) openTextEditor(sub);
    }
  });
  canvas.on('mouse:down', e=>{ if (typeof networkMouseDown==='function') networkMouseDown(e); });
  canvas.on('mouse:move', e=>{ if (typeof networkMouseMove==='function') networkMouseMove(e); });
  canvas.on('mouse:up', e=>{ if (typeof networkMouseUp==='function') networkMouseUp(e); });
  canvas.on('object:moving', e=>{
    applyAlignmentSnap(e);
    if (typeof networkSyncOnObjectMoving==='function') networkSyncOnObjectMoving(e);
  });
  canvas.on('object:scaling', e=>{ if (typeof networkSyncOnObjectMoving==='function') networkSyncOnObjectMoving(e); });
  canvas.on('object:modified', e=>{ hideGuideLines(); if (typeof networkSyncOnObjectMoving==='function') networkSyncOnObjectMoving(e); });
  canvas.on('mouse:up', hideGuideLines);
  setZoom(0.5);
  pushHistory();
}
function isModalText(o){ return o.type==='textbox' || o.type==='handwrittentext' || o.type==='redactedtext' || o.type==='brandtext' || o.type==='itext' || o.type==='newsbox'; }
function isLockedBase(o){ return o.customType==='background' || o.customType==='brandArt'; }

/* ---- Travar/esconder por objeto (ícones na lista de Camadas) — diferente de
   isLockedBase (objetos de SISTEMA fixos tipo papel de fundo, que nunca mostram os
   botões de reordenar/apagar): __userLocked é um estado que o PRÓPRIO usuário liga/
   desliga em qualquer objeto, só afeta interação no CANVAS (selectable/evented), a
   linha na lista de Camadas continua com todos os botões (inclusive o cadeado, pra
   destravar de novo). Clicar na linha da lista ainda seleciona um objeto travado —
   setActiveObject é chamada direta, não depende de selectable (que só controla
   clique/arrasto NO CANVAS). */
function toggleObjectLock(o){
  o.__userLocked = !o.__userLocked;
  o.set({selectable: !o.__userLocked, evented: !o.__userLocked, hoverCursor: o.__userLocked ? 'default' : 'move'});
  if (o.__userLocked && canvas.getActiveObject()===o){ canvas.discardActiveObject(); updateInspector(); }
  canvas.renderAll(); renderLayerList(); pushHistory();
}
function toggleObjectHide(o){
  o.visible = !o.visible;
  if (!o.visible && canvas.getActiveObject()===o){ canvas.discardActiveObject(); updateInspector(); }
  canvas.renderAll(); renderLayerList(); pushHistory();
}

/* ===================== Guias de alinhamento =====================
   Substitui o grid fixo de 20px que só o diagrama de rede tinha (ver network-diagram.js)
   — ao arrastar QUALQUER objeto, procura bordas/centro de outros objetos (e do canvas)
   perto o bastante pra "colar", com uma guia visual temporária. Limiar em pixels de TELA
   (dividido pelo zoom atual), não de documento, pra sentir igual em qualquer nível de
   zoom — padrão "smart guides" de Figma/Canva/Balsamiq, pesquisado antes de implementar.
   `getBoundingRect()` (sem argumentos nesta versão do Fabric, confirmado no fonte
   vendorizado) já devolve a caixa em coordenada de DOCUMENTO — funciona igual não importa
   o originX/originY de cada tipo de objeto (nó de rede usa 'center', a maioria usa
   'left'/'top' padrão), sem precisar tratar isso caso a caso. */
let __guideH = null, __guideV = null;
function ensureGuideLines(){
  if (__guideH) return;
  const opts = {stroke:'#ff5fa8', strokeWidth:1, strokeDashArray:[4,3], selectable:false, evented:false, excludeFromExport:true, visible:false};
  __guideH = new fabric.Line([0,0,0,0], opts);
  __guideV = new fabric.Line([0,0,0,0], Object.assign({}, opts));
  beginBatch();
  canvas.add(__guideH); canvas.add(__guideV);
  endBatch();
}
function hideGuideLines(){
  if (!__guideH) return;
  __guideH.set('visible', false); __guideV.set('visible', false);
  canvas.requestRenderAll();
}
function applyAlignmentSnap(e){
  const obj = e.target;
  if (!obj || obj===cropRect) return;
  ensureGuideLines();
  if (obj===__guideH || obj===__guideV) return;
  const excluded = new Set(activeSelectionMembers(obj));
  excluded.add(cropRect); excluded.add(__guideH); excluded.add(__guideV);
  const thresh = 8 / canvas.getZoom();
  const br = obj.getBoundingRect();
  const movingX = [br.left, br.left+br.width/2, br.left+br.width];
  const movingY = [br.top, br.top+br.height/2, br.top+br.height];
  const candX = [0, PAGE_W/2, PAGE_W], candY = [0, PAGE_H/2, PAGE_H];
  canvas.getObjects().forEach(o=>{
    if (excluded.has(o)) return;
    const r = o.getBoundingRect();
    candX.push(r.left, r.left+r.width/2, r.left+r.width);
    candY.push(r.top, r.top+r.height/2, r.top+r.height);
  });
  let dx = null, bestXDist = thresh, snapXAt = null;
  movingX.forEach(v=>candX.forEach(c=>{ const d = Math.abs(v-c); if (d < bestXDist){ bestXDist = d; dx = c-v; snapXAt = c; } }));
  let dy = null, bestYDist = thresh, snapYAt = null;
  movingY.forEach(v=>candY.forEach(c=>{ const d = Math.abs(v-c); if (d < bestYDist){ bestYDist = d; dy = c-v; snapYAt = c; } }));
  if (dx!==null) obj.set('left', obj.left+dx);
  if (dy!==null) obj.set('top', obj.top+dy);
  if (dx!==null || dy!==null) obj.setCoords();
  __guideV.set(snapXAt!==null ? {x1:snapXAt, y1:-50, x2:snapXAt, y2:PAGE_H+50, visible:true} : {visible:false});
  __guideH.set(snapYAt!==null ? {x1:-50, y1:snapYAt, x2:PAGE_W+50, y2:snapYAt, visible:true} : {visible:false});
}
function setZoom(z){
  const el = document.getElementById('editorCanvas');
  el.parentElement.style.width = (PAGE_W*z)+'px';
  el.parentElement.style.height = (PAGE_H*z)+'px';
  canvas.setZoom(z);
  canvas.setDimensions({width:PAGE_W*z, height:PAGE_H*z});
}
document.querySelectorAll('.zoomrow button[data-z]').forEach(b=>{
  b.addEventListener('click', ()=>setZoom(+b.dataset.z));
});
document.getElementById('btnZoomFit').addEventListener('click', zoomToFit);

/* ---- tamanho de página por template: cada formato de documento tem sua
   proporção física real (folha A4 retrato, página dupla de livro aberto em
   paisagem, tela de terminal 4:3, cartão de crachá) em vez de um canvas único
   pra tudo. PAGE_W/PAGE_H (layout.js) são lidos no momento do uso em todo o
   resto do código, então só trocar o valor e re-aplicar o zoom já propaga. ---- */
const PAGE_SIZES = {blank:[1240,1754]};   // só o padrão (A4): o tamanho de cada modelo vem do registry (DOC_TEMPLATES[id].page); o brand.js acrescenta os dele
/* Carrega as fontes de UM modelo ANTES de montar (o navegador só baixa a fonte quando alguém
   pede pra desenhar com ela, e o canvas não redesenha sozinho depois). Depois limpa o cache de
   largura de letra do Fabric (ele guarda por fonte: se um texto mediu com a fonte reserva, o erro
   fica guardado pra sempre) e remede todo texto já criado. `specs`: strings de document.fonts.load,
   ex. "700 16px 'Jost'". */
const _fontLoads = new Map();
async function ensureFonts(specs){
  const list = (specs||[]).filter(Boolean);
  await Promise.all(list.map(s=>{
    if (!_fontLoads.has(s)) _fontLoads.set(s, document.fonts.load(s, 'AaØøÅåÆæ0123456789—·×').catch(()=>{}));
    return _fontLoads.get(s);
  }));
  settleFonts();
}
function settleFonts(){
  if (fabric.cache && fabric.cache.clearFontCache) fabric.cache.clearFontCache();
  if (typeof newsClearMeasureCache==='function') newsClearMeasureCache();
  if (typeof canvas==='undefined' || !canvas) return;
  canvas.getObjects().forEach(o=>{ if (typeof o.initDimensions==='function' && /text|newsbox/i.test(o.type||'')) o.initDimensions(); });
  canvas.requestRenderAll();
}
document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', ()=>settleFonts());
function applyPageSize(name){
  const [w,h] = (typeof DOC_TEMPLATES!=='undefined' && DOC_TEMPLATES[name] && DOC_TEMPLATES[name].page) || PAGE_SIZES[name] || PAGE_SIZES.blank;
  PAGE_W = w; PAGE_H = h;
  setZoom(canvas.getZoom());
  updateExportLabels();
}
function updateExportLabels(){
  const sel = document.getElementById('exportScale');
  if (!sel) return;
  [...sel.options].forEach(o=>{
    const mult = +o.value;
    const suffix = mult===1 ? 'Tela / digitalizado' : 'Impressão (alta resolução)';
    o.textContent = `${suffix} (${Math.round(PAGE_W*mult)}×${Math.round(PAGE_H*mult)})`;
  });
}

/* ---- Abas da barra lateral: reorganização de contêiner, não redesenho — cada
   fieldset já existia, só ganhou um wrapper .tabPanel. A aba Objeto troca
   sozinha pra sempre que algo é selecionado (updateInspector chama switchTab),
   já que "Objeto selecionado" era o bloco que mais precisava rolar pra alcançar
   depois que cresceu (crop/flip/composites/opacidade da rodada anterior). ---- */
function switchTab(name){
  document.querySelectorAll('.tabBtn').forEach(b=>b.classList.toggle('active', b.dataset.tab===name));
  document.querySelectorAll('.tabPanel').forEach(p=>{ p.style.display = (p.dataset.tabPanel===name) ? 'flex' : 'none'; });
}
document.querySelectorAll('.tabBtn').forEach(b=>{
  b.addEventListener('click', ()=>switchTab(b.dataset.tab));
});

/* ---- fundo de papel: objeto travado, sempre na base, com filtro de idade ---- */
function setBackgroundPaper(filename, opts){
  opts = opts||{};
  return new Promise(resolve=>{
    fabric.Image.fromURL(TEXTURE_PACK[filename], {crossOrigin:'anonymous'}).then(img=>{
      const old = canvas.getObjects().find(o=>o.customType==='background');
      const keepNews = old && old.__newsState;
      if (old) canvas.remove(old);
      if (keepNews) img.__newsState = keepNews;
      const ir = img.width/img.height, tr = PAGE_W/PAGE_H;
      let sw=img.width, sh=img.height;
      if (ir>tr) sw = img.height*tr; else sh = img.width/tr;
      img.set({
        left:0, top:0, originX:'left', originY:'top',
        cropX:(img.width-sw)/2, cropY:(img.height-sh)/2, width:sw, height:sh,
        scaleX: PAGE_W/sw, scaleY: PAGE_H/sh,
        selectable:false, evented:true, hoverCursor:'pointer',
      });
      img.filters = [new AgeTintFilter({amount: opts.age!==undefined?opts.age:0.4})];
      img.applyFilters();
      img.set('customType','background');
      img.__paperFile = filename;
      canvas.add(img);
      canvas.sendObjectToBack(img);
      computeFoldField(img.getElement(), img.cropX, img.cropY, sw, sh);
      computeRuledLines(img.getElement(), img.cropX, img.cropY, sw, sh);
      resolve(img);
    });
  });
}
function getBackground(){ return canvas.getObjects().find(o=>o.customType==='background'); }

/* computeFoldField/computeRuledLines (mais abaixo) escrevem em globais do MÓDULO
   (currentFoldField/currentRuledLines) que HandwrittenText._render() lê a cada desenho —
   setBackgroundPaper já os recalcula quando o papel muda ao vivo, mas trocar de PÁGINA
   (pageGo) ou exportar várias páginas (collectPagePNGs) reconstrói o canvas via
   loadFromJSON/StaticCanvas, que NÃO dispara isso sozinho. Sem recalcular aqui, o texto
   manuscrito de uma página passaria a reagir à dobra/pauta da página ERRADA (a que estava
   ativa antes da troca). */
function recomputeBgFieldsFromObjects(objs){
  const bg = objs.find(o=>o.customType==='background' && o.getElement && o.getElement());
  if (bg){
    computeFoldField(bg.getElement(), bg.cropX, bg.cropY, bg.width, bg.height);
    computeRuledLines(bg.getElement(), bg.cropX, bg.cropY, bg.width, bg.height);
  } else {
    currentFoldField = null; currentRuledLines = null;
  }
}

/* ===================== Papel (bloco "Papel" da aba Documento) =====================
   O fundo de TODO modelo novo é um PaperBackground (paper-gen.js): papel procedural que só
   guarda parâmetros. Tipo "Foto de papel" continua existindo (pacote antigo de fotos, via
   setBackgroundPaper) — a barra "Intensidade" vira a idade da foto nesse caso. */
const PAPER_PHOTO_CATS = {paper_aged:'Envelhecido', paper_notebook_ruled:'Caderno pautado', paper_notebook_plain:'Caderno liso', paper_newsprint:'Jornal', paper_aged_bookspread:'Livro aberto'};
function randomSeed32(){ return Math.floor(Math.random()*4294967295)+1; }
function getPaperBg(){ const b = getBackground(); return (b && b.type==='paperbackground') ? b : null; }
/* Coloca (ou troca) o fundo procedural. Sempre na base da pilha. */
function setPaper(spec){
  const s = paperNormalizeSpec(Object.assign({seed: randomSeed32()}, spec||{}));
  const old = getBackground();
  const keepNews = old && old.__newsState, keepVar = old && old.__docVariant;
  if (old) canvas.remove(old);
  const bg = new PaperBackground({width:PAGE_W, height:PAGE_H, paperSpec:s});
  if (keepNews) bg.__newsState = keepNews;
  if (keepVar) bg.__docVariant = keepVar;
  canvas.add(bg);
  canvas.sendObjectToBack(bg);
  currentFoldField = null; currentRuledLines = null;
  return bg;
}
function paperPhotoCatOf(file){ return Object.keys(TEX_CATS).find(c=>PAPER_PHOTO_CATS[c] && TEX_CATS[c].includes(file)) || 'paper_aged'; }
function readPaperUIState(){
  const bg = getBackground();
  if (!bg) return null;
  if (bg.type==='paperbackground') return Object.assign({kind:'proc'}, paperNormalizeSpec(bg.paperSpec));
  if (bg.type==='image' && bg.__paperFile){
    const f = (bg.filters||[]).find(x=>x.constructor.type==='AgeTint');
    return {kind:'foto', cat: paperPhotoCatOf(bg.__paperFile), level: f ? f.amount : 0.4};
  }
  return {kind:'flat'};
}
function syncPaperUI(){
  const block = document.getElementById('paperBlock');
  if (!block) return;
  const brand = currentTemplate && currentTemplate.indexOf('brand:')===0;
  const st = brand ? null : readPaperUIState();
  const def = (typeof DOC_TEMPLATES!=='undefined') && DOC_TEMPLATES[currentTemplate];
  const screen = !!(def && def.screen);
  block.style.display = (!st || st.kind==='flat' || screen) ? 'none' : 'block';
  if (block.style.display==='none') return;
  document.getElementById('paperType').value = st.kind==='foto' ? 'foto' : st.type;
  document.getElementById('paperLevel').value = Math.round(st.level*100);
  document.getElementById('paperLevelVal').textContent = Math.round(st.level*100);
  document.getElementById('paperLevelLbl').firstChild.textContent = st.kind==='foto' ? 'Idade do papel ' : 'Intensidade ';
  document.getElementById('paperProcOnly').style.display = st.kind==='foto' ? 'none' : 'block';
  document.getElementById('paperPhotoOnly').style.display = st.kind==='foto' ? 'block' : 'none';
  if (st.kind==='foto') document.getElementById('paperPhotoCat').value = st.cat;
  else { document.getElementById('paperFold').value = st.fold; document.getElementById('paperAtmos').value = st.atmos; }
  paperReportMode();
}
/* Aviso visível quando o WebGL não funciona: o papel continua aparecendo (modo lento em CPU), mas o Max sabe por quê. */
function paperReportMode(){
  const h = document.getElementById('paperHint'); if (!h) return;
  const msg = PaperGL.usedCPU ? ('WebGL indisponível neste navegador' + (PaperGL.error ? ' (' + PaperGL.error + ')' : '') + ': usando o modo lento (CPU), com resolução menor. Ative a aceleração de hardware do navegador pra qualidade total.') : '';
  if (h.textContent !== msg) h.textContent = msg;
}
function paperCommit(){ canvas.requestRenderAll(); pushHistory(); renderLayerList(); }
function paperApply(mut, commit){
  const st = readPaperUIState();
  if (!st) return;
  if (st.kind==='proc'){
    const bg = getPaperBg();
    bg.set('paperSpec', paperNormalizeSpec(Object.assign({}, bg.paperSpec, mut)));
    canvas.requestRenderAll();
    if (commit) paperCommit();
  }
}
function paperSwitchKind(value){
  const st = readPaperUIState() || {};
  beginBatch();
  try {
    if (value==='foto'){
      const cat = (currentBgCategory && PAPER_PHOTO_CATS[currentBgCategory]) ? currentBgCategory : 'paper_aged';
      currentBgCategory = cat;
      return setBackgroundPaper(pickFile(cat), {age: 0.4}).then(()=>{ canvas.renderAll(); }).finally(()=>{ endBatch(); paperCommit(); syncPaperUI(); });
    }
    const old = st.kind==='proc' ? st : {};
    setPaper({type:value, level: st.kind==='proc' ? old.level : 0.35, fold: old.fold||'nenhuma', atmos: old.atmos||'neutra', seed: old.seed});
  } finally { if (value!=='foto') endBatch(); }
  if (value!=='foto'){ paperCommit(); syncPaperUI(); }
}
function initPaperUI(){
  const T = document.getElementById('paperType');
  if (!T) return;
  PAPER_TYPE_ORDER.forEach(id=>{ const o = document.createElement('option'); o.value = id; o.textContent = PAPER_TYPES[id].label; T.appendChild(o); });
  const fo = document.createElement('option'); fo.value = 'foto'; fo.textContent = 'Foto de papel (antigo)'; T.appendChild(fo);
  const F = document.getElementById('paperFold'); Object.keys(PAPER_FOLDS).forEach(k=>{ const o = document.createElement('option'); o.value = k; o.textContent = PAPER_FOLDS[k].label; F.appendChild(o); });
  const A = document.getElementById('paperAtmos'); Object.keys(PAPER_ATMOS).forEach(k=>{ const o = document.createElement('option'); o.value = k; o.textContent = PAPER_ATMOS[k].label; A.appendChild(o); });
  const C = document.getElementById('paperPhotoCat'); Object.keys(PAPER_PHOTO_CATS).forEach(k=>{ const o = document.createElement('option'); o.value = k; o.textContent = PAPER_PHOTO_CATS[k]; C.appendChild(o); });
  T.addEventListener('change', ()=>paperSwitchKind(T.value));
  F.addEventListener('change', ()=>paperApply({fold:F.value}, true));
  A.addEventListener('change', ()=>paperApply({atmos:A.value}, true));
  document.getElementById('btnPaperSeed').addEventListener('click', ()=>paperApply({seed: randomSeed32()}, true));
  const L = document.getElementById('paperLevel');
  let lvTimer = null;
  L.addEventListener('input', ()=>{
    document.getElementById('paperLevelVal').textContent = L.value;
    const st = readPaperUIState();
    if (st && st.kind==='proc') paperApply({level: L.value/100}, false);
    else if (st && st.kind==='foto'){
      const bg = getBackground(), f = (bg.filters||[]).find(x=>x.constructor.type==='AgeTint');
      if (f){ f.amount = L.value/100; clearTimeout(lvTimer); lvTimer = setTimeout(()=>{ bg.applyFilters(); canvas.requestRenderAll(); }, 60); }
    }
  });
  L.addEventListener('change', ()=>{ const st = readPaperUIState(); if (st && st.kind!=='flat') paperCommit(); });
  C.addEventListener('change', ()=>{
    const st = readPaperUIState() || {};
    currentBgCategory = C.value;
    beginBatch();
    setBackgroundPaper(pickFile(C.value), {age: st.level!=null ? st.level : 0.4}).then(()=>canvas.renderAll()).finally(()=>{ endBatch(); paperCommit(); syncPaperUI(); });
  });
  const ex = document.getElementById('exportPaperMode');
  if (ex) ex.value = 'textura';
}

/* Categoria de papel em FOTO do fundo atual (tipo "Foto de papel" do bloco Papel e inspetor do fundo em foto).
   `LEGACY_PAPER_MAP`: categorias antigas que viram papel procedural. */
let currentBgCategory = null, currentBgOpts = null;
const LEGACY_PAPER_MAP = {
  paper_newsprint: {type:'jornal', level:0.4, fold:'meio', atmos:'neutra'},
  paper_aged:      {type:'creme',  level:0.4, fold:'nenhuma', atmos:'neutra'},
};
function setTemplateBackground(category, opts){
  currentBgCategory = category; currentBgOpts = opts||{};
  if (LEGACY_PAPER_MAP[category]){ setPaper(Object.assign({}, LEGACY_PAPER_MAP[category])); return Promise.resolve(); }
  const rng = mulberry32(Math.floor(Math.random()*4294967296));
  return setBackgroundPaper(pickFile(category, rng), currentBgOpts);
}

/* ===================== Campo de dobra/vinco (pra texto seguir o relevo do papel) =====================
   Pesquisado: é o mesmo princípio do Displacement Map do Photoshop (Filter > Distort
   > Displace) — desfoca a imagem pra sobrar só as variações grandes de luz (onde uma
   dobra real muda a incidência de luz), pega o gradiente disso, e usa pra deslocar
   o que for desenhado em cima. Aqui: downscale agressivo (36×50 células) já faz o
   trabalho de "desfoque" por média de área — não precisa de um blur separado. */
let currentFoldField = null;
function computeFoldField(imgEl, sx, sy, sw, sh){
  const cols=36, rows=50;
  const c = document.createElement('canvas'); c.width=cols; c.height=rows;
  const ctx = c.getContext('2d');
  ctx.drawImage(imgEl, sx,sy,sw,sh, 0,0,cols,rows);
  const data = ctx.getImageData(0,0,cols,rows).data;
  const lum = new Float32Array(cols*rows);
  for (let i=0;i<cols*rows;i++) lum[i] = (data[i*4]*0.299+data[i*4+1]*0.587+data[i*4+2]*0.114)/255;
  const dx = new Float32Array(cols*rows), dy = new Float32Array(cols*rows);
  for (let y=0;y<rows;y++){
    for (let x=0;x<cols;x++){
      const xm = lum[y*cols+Math.max(0,x-1)], xp = lum[y*cols+Math.min(cols-1,x+1)];
      const ym = lum[Math.max(0,y-1)*cols+x], yp = lum[Math.min(rows-1,y+1)*cols+x];
      dx[y*cols+x] = xp-xm;
      dy[y*cols+x] = yp-ym;
    }
  }
  currentFoldField = {cols, rows, dx, dy};
}
function sampleFoldSlope(px, py){
  if (!currentFoldField) return {dx:0,dy:0};
  const {cols,rows,dx,dy} = currentFoldField;
  const fx = Math.max(0,Math.min(cols-1, Math.floor((px/PAGE_W)*cols)));
  const fy = Math.max(0,Math.min(rows-1, Math.floor((py/PAGE_H)*rows)));
  const i = fy*cols+fx;
  return {dx: dx[i]||0, dy: dy[i]||0};
}

/* ===================== Linhas do papel pautado (pra texto manuscrito grudar nelas) =====================
   Pesquisado/prototipado nesta sessão: calcula por linha de pixel o "excesso de
   azul" = média(B) − média(R) (tinta azul deprime o vermelho mais que o azul num
   papel próximo de branco/creme), acha picos locais acima de um limiar
   adaptativo. Valida o padrão comparando cada gap CONSECUTIVO entre picos ao
   múltiplo mais próximo do espaçamento mediano (tolera 1+ linha perdida por
   dobra/sombra sem invalidar o resto, já que cada checagem é local) — um teste de
   grid rígido ancorado no primeiro pico foi tentado primeiro e rejeitou dados
   reais bons por deriva sistemática de espaçamento. Validado com simulação Node
   contra dados reais capturados ao vivo (bate 18/18 gaps) e contra ruído puro
   (0/30 falsos positivos, 30 seeds variados).

   Rodada seguinte (pesquisa: detecção de skew em documento usa regressão linear
   pra achar o ângulo representativo de uma linha de texto — mesmo princípio
   aqui): uma foto real não é um scan perfeitamente plano, a pauta pode ter uma
   leve inclinação de ponta a ponta. Por isso agora amostra TRÊS faixas de coluna
   (25%/50%/75% da largura) em vez de uma só, cada uma roda a mesma detecção
   independente, e a inclinação vem da diferença de posição entre a faixa
   esquerda e a direita — as linhas de um caderno são paralelas, então uma
   inclinação ÚNICA pra pauta inteira (rotação leve da foto) já modela bem o caso
   real, sem precisar casar cada linha individualmente entre as 3 faixas. Só
   aceita inclinação quando as 3 faixas validam independentemente; senão cai pra
   inclinação zero (mesmo comportamento de antes). Fica null quando o papel não
   tem pauta detectável. */
let currentRuledLines = null;
function detectLineBand(imgEl, sx, sy, sw, sh, colFrac, bandFrac){
  const rows = Math.max(200, Math.min(900, Math.round(sh)));
  const cols = 24;
  const bandSx = sx + sw*(colFrac-bandFrac/2), bandSw = sw*bandFrac;
  const c = document.createElement('canvas'); c.width=cols; c.height=rows;
  const ctx = c.getContext('2d');
  ctx.drawImage(imgEl, bandSx, sy, bandSw, sh, 0, 0, cols, rows);
  const data = ctx.getImageData(0,0,cols,rows).data;
  const score = new Float32Array(rows);
  for (let y=0;y<rows;y++){
    let sumR=0, sumB=0;
    for (let x=0;x<cols;x++){ const i=(y*cols+x)*4; sumR+=data[i]; sumB+=data[i+2]; }
    score[y] = (sumB-sumR)/cols;
  }
  let mean=0; for (let y=0;y<rows;y++) mean+=score[y]; mean/=rows;
  let variance=0; for (let y=0;y<rows;y++) variance += (score[y]-mean)*(score[y]-mean); variance/=rows;
  const threshold = mean + Math.sqrt(variance)*1.5;
  const rawPeaks = [];
  for (let y=2;y<rows-2;y++){
    if (score[y]>threshold && score[y]>=score[y-1] && score[y]>=score[y+1] && score[y]>score[y-2] && score[y]>score[y+2]) rawPeaks.push(y);
  }
  const peaks = [];
  rawPeaks.forEach(p=>{ if (!peaks.length || p-peaks[peaks.length-1]>15) peaks.push(p); });
  if (peaks.length < 8) return null;
  const gapsSeq = peaks.slice(1).map((p,i)=>p-peaks[i]);
  const gapsSorted = gapsSeq.slice().sort((a,b)=>a-b);
  const spacing = gapsSorted[Math.floor(gapsSorted.length/2)];
  if (spacing < rows*(30/900)) return null;
  const tol = Math.max(6, spacing*0.25);
  const good = gapsSeq.filter(g=>{ const k=Math.round(g/spacing); return k>=1 && Math.abs(g-k*spacing)<=tol*k; }).length;
  if (good/gapsSeq.length < 0.7) return null;
  return {peaks, spacing, rows};
}
function median(arr){
  const s = arr.slice().sort((a,b)=>a-b), n = s.length;
  return n%2 ? s[(n-1)/2] : (s[n/2-1]+s[n/2])/2;
}
/* Acha o deslocamento de ÍNDICE entre uma faixa lateral e a do meio — band.peaks[i-k]
   é a mesma linha física que mid.peaks[i]. Bug real achado testando ao vivo (2 vezes):
   1ª vez, confiar só no PRIMEIRO pico da faixa lateral pra achar k quebrava quando essa
   faixa perdia linhas líderes no topo (comum perto da espiral do caderno). Corrigido
   usando o espaçamento pra estimar k a partir do 1º pico. MAS numa foto real capturada
   ao vivo nesta sessão, o 1º pico da faixa esquerda era um ponto FANTASMA isolado (um
   salto de ~4 espaçamentos até o próximo pico, não uma sequência de líderes perdidos) —
   o k estimado só por ele (k=2) casava linhas erradas em TODA a página (diffs de ~80px
   constantes), produzindo inclinação errada em quase toda linha. Corrigido de novo:
   busca k num intervalo em volta da estimativa ingênua e escolhe o que MINIMIZA A
   MEDIANA da diferença absoluta entre mid.peaks[i] e band.peaks[i-k] — a mediana ignora
   o ponto fantasma isolado (é maioria de pares bons que decide), a média não ignoraria.
   Validado com simulação Node reproduzindo esse exato caso real (peaks capturados ao
   vivo) antes de entrar aqui: k ingênuo dava 2 (errado), k robusto dá 4 (correto). */
function findBandOffset(mid, band){
  const avgSpacing = (band.spacing+mid.spacing)/2;
  const k0 = Math.round((band.peaks[0]-mid.peaks[0])/avgSpacing);
  let bestK = k0, bestScore = Infinity;
  for (let k=k0-4; k<=k0+4; k++){
    const diffs = [];
    for (let i=0;i<mid.peaks.length;i++){
      const j = i-k;
      if (j>=0 && j<band.peaks.length) diffs.push(Math.abs(mid.peaks[i]-band.peaks[j]));
    }
    if (diffs.length < Math.min(mid.peaks.length, band.peaks.length)*0.5) continue;
    const score = median(diffs);
    if (score < bestScore){ bestScore = score; bestK = k; }
  }
  return bestK;
}
/* computeRuledLines: uma inclinação POR LINHA, não uma única pra página inteira.
   Papel fotografado real ondula/tuerce (lombada do caderno, curvatura da folha) —
   uma inclinação global (versão anterior) não seguia isso, Max reportou "as linhas
   do papel estão tortas". Repete o casamento left/mid/right LINHA A LINHA: o
   deslocamento de índice k é o mesmo pra página inteira (linhas são paralelas,
   calculado uma vez via findBandOffset), então band.peaks[i-k] dá o par certo pra
   cada i sem precisar recasar. Uma linha cujo par ainda assim resulta numa
   inclinação implausível (>10°, ±0.18 — sinal de casamento pontual ruim, tipo um
   pico fantasma isolado que sobrou mesmo com o k certo) é DESCARTADA (não
   clampada) e cai na média das linhas boas — clampar em vez de descartar
   mascarava o problema (ver findBandOffset) em vez de resolvê-lo. Linhas sem par
   válido nas 3 faixas (perto da borda onde uma faixa perdeu picos) também caem na
   inclinação média das que têm. Validado em simulação Node com dados sintéticos
   (ondulação, ruído, líderes perdidos) E com os peaks reais capturados ao vivo
   nesta sessão. */
function computeRuledLines(imgEl, sx, sy, sw, sh){
  currentRuledLines = null;
  const mid = detectLineBand(imgEl, sx, sy, sw, sh, 0.5, 0.2);
  if (!mid) return;
  const left = detectLineBand(imgEl, sx, sy, sw, sh, 0.25, 0.14);
  const right = detectLineBand(imgEl, sx, sy, sw, sh, 0.75, 0.14);
  const rows = mid.rows;
  const midRefX = 0.5*PAGE_W, leftRefX = 0.25*PAGE_W, rightRefX = 0.75*PAGE_W;
  const spacingPage = (mid.spacing/rows)*PAGE_H;
  if (left && right){
    const kLeft = findBandOffset(mid, left);
    const kRight = findBandOffset(mid, right);
    const lines = [];
    const slopes = [];
    for (let i=0;i<mid.peaks.length;i++){
      const li = i-kLeft, ri = i-kRight;
      const midY = (mid.peaks[i]/rows)*PAGE_H;
      let slope = null;
      if (li>=0 && li<left.peaks.length && ri>=0 && ri<right.peaks.length){
        const leftY = (left.peaks[li]/rows)*PAGE_H, rightY = (right.peaks[ri]/rows)*PAGE_H;
        const raw = (rightY-leftY)/(rightRefX-leftRefX);
        // trava de segurança: uma foto de mesa não devia ter mais que uns 10° de
        // inclinação (tan(10°)≈0.176) — se um casamento pontual ainda assim der
        // mais que isso, descarta (cai no fallback de média) em vez de clampar.
        if (Math.abs(raw) <= 0.18){ slope = raw; slopes.push(slope); }
      }
      lines.push({y: midY, slope});
    }
    const avgSlope = slopes.length ? slopes.reduce((a,b)=>a+b,0)/slopes.length : 0;
    lines.forEach(l=>{ if (l.slope===null) l.slope = avgSlope; });
    currentRuledLines = {lines, spacing: spacingPage, refX: midRefX};
  } else {
    currentRuledLines = {lines: mid.peaks.map(p=>({y:(p/rows)*PAGE_H, slope:0})), spacing: spacingPage, refX: midRefX};
  }
}
/* lineAt/lineIdxNearest: acesso ao array de linhas detectadas com extrapolação
   além do trecho lido (texto pode continuar abaixo da última linha detectada) —
   usa o espaçamento médio e repete a inclinação da linha de borda mais próxima.
   handwriting.js usa lineIdxNearest só UMA vez (achar a linha inicial) e depois
   incrementa um contador linha a linha (nunca re-deriva o índice a partir de Y) —
   evita que uma leve deriva real de espaçamento entre linhas acumule erro e pule/
   repita uma linha no meio do texto. */
function lineAt(idx){
  const {lines, spacing} = currentRuledLines;
  const n = lines.length;
  if (idx>=0 && idx<n) return lines[idx];
  if (idx<0) return {y: lines[0].y + idx*spacing, slope: lines[0].slope};
  return {y: lines[n-1].y + (idx-(n-1))*spacing, slope: lines[n-1].slope};
}
function lineIdxNearest(pageY){
  const {lines, spacing} = currentRuledLines;
  return Math.round((pageY - lines[0].y)/spacing);
}

/* ---- manchas: fotos reais com máscara de alfa (sem borda quadrada) + tinta de cor ---- */
const STAIN_TINT = { water:null, coffee:'rgb(126,76,32)', blood:'rgb(94,18,18)' };
function makeFeatheredStainURL(imgEl, tintRGB, seed){
  const rng = mulberry32(seed);
  const size = Math.min(520, Math.max(imgEl.naturalWidth||imgEl.width, imgEl.naturalHeight||imgEl.height));
  const c = document.createElement('canvas'); c.width=size; c.height=size;
  const ctx = c.getContext('2d');
  const iw=imgEl.naturalWidth||imgEl.width, ih=imgEl.naturalHeight||imgEl.height;
  const ir = iw/ih;
  let sw=iw, sh=ih, sx=0, sy=0;
  if (ir>1){ sw=ih; sx=(iw-sw)/2; } else { sh=iw; sy=(ih-sh)/2; }
  ctx.drawImage(imgEl, sx,sy,sw,sh, 0,0,size,size);
  if (tintRGB){
    ctx.globalCompositeOperation='color';
    ctx.fillStyle=tintRGB;
    ctx.fillRect(0,0,size,size);
    ctx.globalCompositeOperation='source-over';
  }
  ctx.globalCompositeOperation='destination-in';
  const cx=size/2, cy=size/2;
  const grd = ctx.createRadialGradient(cx,cy,size*0.08,cx,cy,size*0.48);
  grd.addColorStop(0,'rgba(255,255,255,1)');
  grd.addColorStop(0.68,'rgba(255,255,255,0.92)');
  grd.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=grd;
  ctx.beginPath();
  const pts=16;
  for (let i=0;i<=pts;i++){
    const ang=i/pts*Math.PI*2;
    const rr = size*0.48*(0.8+rng()*0.2);
    const px=cx+Math.cos(ang)*rr, py=cy+Math.sin(ang)*rr;
    if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation='source-over';
  return c.toDataURL();
}
/* Mancha por cima do papel. `o` (tudo opcional) fixa posição/tamanho/ângulo/opacidade/semente — os
   modelos usam isso pra colocar o "detalhe" sempre no mesmo lugar (kit.stain); sem `o` é a mancha
   aleatória de sempre, já selecionada. Devolve uma Promise com a imagem. */
function addStainAt(type, o){
  o = o || {};
  const rng = mulberry32(o.seed || Math.floor(Math.random()*4294967296));
  // Café e sangue agora têm foto dedicada de verdade (já na cor certa, sem precisar
  // de tinta por cima) — mistura com o pool genérico tingido pra manter diversidade
  // de formato em vez de repetir sempre a mesma mancha.
  const dedicatedCat = type==='coffee' ? 'stain_coffee' : type==='blood' ? 'stain_blood' : null;
  const useDedicated = dedicatedCat && TEX_CATS[dedicatedCat] && TEX_CATS[dedicatedCat].length && rng()<0.5;
  const cat = type==='mold' ? 'stain_mold' : useDedicated ? dedicatedCat : 'stain_shape';
  const fname = pickFile(cat, rng);
  const tint = (cat==='stain_shape') ? (STAIN_TINT[type] || null) : null;
  return new Promise(resolve=>{
    const imgEl = new Image();
    imgEl.onload = ()=>{
      const url = makeFeatheredStainURL(imgEl, tint, Math.floor(rng()*4294967296));
      fabric.Image.fromURL(url).then(img=>{
        const s = o.size || (160+rng()*260);
        const rx = rng(), ry = rng(), rAng = rng(), rFx = rng(), rFy = rng(), rOp = rng();
        img.set({
          left: o.x!=null ? o.x : PAGE_W*0.15+rx*PAGE_W*0.7, top: o.y!=null ? o.y : PAGE_H*0.15+ry*PAGE_H*0.7,
          scaleX: s/img.width, scaleY: s/img.height,
          angle: o.angle!=null ? o.angle : rAng*360, flipX: o.flip!=null ? !!o.flip : rFx<0.5, flipY: rFy<0.5,
          globalCompositeOperation:'multiply', opacity: o.opacity!=null ? o.opacity : 0.55+rOp*0.3,
          originX:'center', originY:'center',
        });
        img.set('customType','stain');
        canvas.add(img);
        if (!o.quiet){ canvas.setActiveObject(img); canvas.renderAll(); }
        resolve(img);
      });
    };
    imgEl.onerror = ()=>resolve(null);
    imgEl.src = TEXTURE_PACK[fname];
  });
}
function addStain(type){ return addStainAt(type); }

/* ---- grunge/dirt e bloom: composição de objetos (não shader duplo-textura),
   implementação real em composites.js (compartilhada com o image-lab) ---- */
function applyGrungeOverlay(){
  addGrungeOverlay(canvas, PAGE_W, PAGE_H, TEXTURE_PACK, TEX_CATS.grunge).catch(e=>alert(e.message));
}
function applyBloomToSelected(){
  addBloomToObject(canvas, canvas.getActiveObject()).catch(e=>alert(e.message));
}

/* ===================== Templates ===================== */
function clearDoc(){
  canvas.clear();
  canvas.backgroundColor = '#ffffff';
}

async function loadTemplate(name, opts){
  return withSceneLock(async ()=>{
    if (typeof brandOnLeave==='function') brandOnLeave(); // sai do modo "documento de marca" (frente/verso)
    currentTemplate = name;
    await sceneSwitchTo({}, { buildFresh: ()=>loadTemplateBody(name, opts) });
    PAGES = [pageSnapshot()];
    curPageIdx = 0;
    updatePageNavUI();
  });
}
/* clearDoc() não roda mais aqui dentro — o único chamador (loadTemplate, acima) já passa
   por sceneSwitchTo, que limpa o canvas antes de chamar buildFresh. */
/* Modelos do registry (doc-templates.js): fundo de papel procedural + fontes carregadas antes
   de montar + `build(kit)` que usa o kit (doc-kit.js). Os que ainda não migraram seguem na
   cadeia antiga de else-if logo abaixo. */
/* Estilo (variante) de um modelo: cada um traz o próprio layout, papel e fontes. Sem `variants`, o próprio modelo. */
function docVariantOf(def, id){
  if (!def.variants || !def.variants.length) return Object.assign({id:null}, {paper:def.paper, fonts:def.fonts, build:def.build, pages:def.pages});
  const v = def.variants.find(x=>x.id===id) || def.variants[0];
  return Object.assign({}, v, {paper: v.paper || def.paper, fonts: v.fonts || def.fonts, pages: v.pages || def.pages});
}
async function buildDoc(name, variantId){
  const def = DOC_TEMPLATES[name];
  const v = docVariantOf(def, variantId);
  applyPageSize(name);
  currentBgCategory = null; currentBgOpts = null;
  await ensureFonts(v.fonts);
  const bg = setPaper(Object.assign({}, v.paper));
  if (v.id) bg.__docVariant = v.id;
  const kit = new DocKit(canvas);
  await v.build(kit, {name, variant:v.id, rng: mulberry32(Math.floor(Math.random()*4294967296))});
}
async function loadTemplateBody(name, opts){
  // Todos os modelos estão no registry (doc-templates.js e arquivos doc-*.js); nome desconhecido cai na folha em branco.
  const id = (typeof DOC_TEMPLATES!=='undefined' && DOC_TEMPLATES[name]) ? name : 'blank';
  await buildDoc(id, opts && opts.variant);
  canvas.renderAll(); renderLayerList(); syncNewsLayoutUI();
}

/* ===================== Páginas: navegação/adicionar/apagar/exportar =====================
   Não se aplica a documentos de marca (aba Marcas) — esses já têm o próprio sistema de
   lados fixos pré-autorados (BRAND.cur.sides). Esse aqui é pros templates de documento
   (relatório, carta, dossiê...), pra um documento GM poder crescer além de uma folha só. */
function pageSnapshot(){
  return makeSceneSnapshot({pageW: PAGE_W, pageH: PAGE_H, template: currentTemplate});
}
function pageSaveCurrent(){
  if (PAGES.length) PAGES[curPageIdx] = pageSnapshot();
}
function applyPageSceneFields(scene){
  currentTemplate = scene.template;
  PAGE_W = scene.pageW; PAGE_H = scene.pageH;
  setZoom(canvas.getZoom());
  updateExportLabels();
}
function updatePageNavUI(){
  const wrap = document.getElementById('pageNavBlock');
  if (!wrap) return;
  const isBrand = currentTemplate && currentTemplate.indexOf('brand:')===0;
  wrap.style.display = isBrand ? 'none' : 'block';
  if (isBrand) return;
  const kindId = (getBackground() || {}).__docPageKind, kind = kindId && docPageKinds().find(k=>k.id===kindId);
  document.getElementById('pageStatus').textContent = `Página ${curPageIdx+1} de ${PAGES.length}` + (kind ? ' · ' + kind.label : '');
  document.getElementById('btnPagePrev').disabled = curPageIdx<=0;
  document.getElementById('btnPageNext').disabled = curPageIdx>=PAGES.length-1;
  document.getElementById('btnPageDel').disabled = PAGES.length<=1;
}
async function pageGo(idx){
  if (idx<0 || idx>=PAGES.length || idx===curPageIdx) return;
  return withSceneLock(async ()=>{
    pageSaveCurrent();
    await sceneSwitchTo(PAGES[idx], {
      applyFields: applyPageSceneFields,
      afterLoad: ()=>recomputeBgFieldsFromObjects(canvas.getObjects()),
    });
    curPageIdx = idx;
    renderLayerList(); updateInspector(); updateUndoRedoButtons(); syncNewsLayoutUI(); updatePageNavUI();
  });
}
/* Nova página em branco no MESMO documento: repete o fundo (mesma categoria de papel —
   foto NOVA do mesmo tipo, ou tela de terminal, ou digital) sem repetir o conteúdo — o
   Max escreve o que quiser em cada página. */
/* Páginas prontas do mesmo documento (verso, continuação, anexos): `pages` do modelo ou do estilo, em doc-pages.js. */
function docPageKinds(){
  const def = (typeof DOC_TEMPLATES!=='undefined') && DOC_TEMPLATES[currentTemplate];
  if (!def) return [];
  const bg = getBackground();
  return docVariantOf(def, bg && bg.__docVariant).pages || [];
}
async function buildDocPage(name, variantId, kind, pageNo, prev){
  const def = DOC_TEMPLATES[name], v = docVariantOf(def, variantId);
  await ensureFonts([].concat(v.fonts || [], kind.fonts || []));
  const bg = setPaper(Object.assign({}, kind.paper || v.paper));
  if (v.id) bg.__docVariant = v.id;
  bg.__docPageKind = kind.id;
  await kind.build(new DocKit(canvas), {name, variant:v.id, kind:kind.id, pageNo, prev:prev || {}, rng: mulberry32(Math.floor(Math.random()*4294967296))});
}
function syncPageKindUI(){
  const sel = document.getElementById('pageKindSel'); if (!sel) return;
  const kinds = docPageKinds(), sig = currentTemplate + ':' + ((getBackground() || {}).__docVariant || '') + ':' + kinds.map(k=>k.id).join(',');
  if (sel.dataset.sig === sig) return;
  sel.dataset.sig = sig; sel.innerHTML = '';
  kinds.forEach(k=>{ const o = document.createElement('option'); o.value = k.id; o.textContent = k.label; sel.appendChild(o); });
  const o = document.createElement('option'); o.value = ''; o.textContent = 'Em branco (só o papel)'; sel.appendChild(o);
}
async function pageAdd(kindId){
  return withSceneLock(async ()=>{
    pageSaveCurrent();
    const keep = readPaperUIState(); // o canvas é limpo dentro do sceneSwitchTo, então guarda o papel antes
    const variantId = (getBackground() || {}).__docVariant;
    const prevNews = (typeof getNewsState==='function') ? getNewsState() : null;   // página nova do jornal herda masthead e justificado
    const kind = kindId ? docPageKinds().find(k=>k.id===kindId) : null;
    await sceneSwitchTo({}, {
      buildFresh: async ()=>{
        if (kind) await buildDocPage(currentTemplate, variantId, kind, curPageIdx + 2, {news:prevNews});
        else if (keep && keep.kind==='proc') setPaper(Object.assign({}, keep, {seed: randomSeed32()}));
        else if (keep && keep.kind==='foto') await setBackgroundPaper(pickFile(keep.cat), {age: keep.level});
        else if (currentBgCategory) await setBackgroundPaper(pickFile(currentBgCategory, Math.random), currentBgOpts);
        const nb = getBackground();
        if (nb && variantId && !nb.__docVariant) nb.__docVariant = variantId;   // página em branco continua do mesmo estilo
      },
    });
    PAGES.splice(curPageIdx+1, 0, pageSnapshot());
    curPageIdx++;
    renderLayerList(); updateInspector(); syncNewsLayoutUI(); updatePageNavUI();
  });
}
async function pageDelete(){
  if (PAGES.length<=1) return;
  if (!confirm('Apagar esta página? Não dá pra desfazer.')) return;
  return withSceneLock(async ()=>{
    PAGES.splice(curPageIdx, 1);
    const idx = Math.min(curPageIdx, PAGES.length-1);
    await sceneSwitchTo(PAGES[idx], {
      applyFields: applyPageSceneFields,
      afterLoad: ()=>recomputeBgFieldsFromObjects(canvas.getObjects()),
    });
    curPageIdx = idx;
    renderLayerList(); updateInspector(); updateUndoRedoButtons(); syncNewsLayoutUI(); updatePageNavUI();
  });
}
/* Renderiza CADA página num PNG — a atual pelo canvas ao vivo, as outras por um
   StaticCanvas isolado (mesmo truque já provado em brandExportAll), sem navegar de
   verdade (sem mexer em histórico/seleção/UI da página que o Max está editando). Salva e
   restaura currentFoldField/currentRuledLines ao redor do laço: são globais do módulo que
   HandwrittenText lê a cada desenho, e cada StaticCanvas precisa dos campos DA SUA PRÓPRIA
   página, não os da página ativa. */
async function collectPagePNGs(mult){
  const prevPaperMode = PAPER_EXPORT_MODE;
  PAPER_EXPORT_MODE = exportPaperModeValue();
  try { return await collectPagePNGsInner(mult); } finally { PAPER_EXPORT_MODE = prevPaperMode; }
}
async function collectPagePNGsInner(mult){
  pageSaveCurrent();
  const savedFold = currentFoldField, savedRuled = currentRuledLines;
  const out = [];
  for (let i=0; i<PAGES.length; i++){
    const p = PAGES[i];
    if (i===curPageIdx){
      canvas.discardActiveObject(); canvas.renderAll();
      let dataUrl = canvas.toDataURL({format:'png', multiplier: mult/canvas.getZoom()});
      out.push(pngWithDpi(dataUrl, getExportDpi(p.pageW*mult, p.template)));
      continue;
    }
    const sc = new fabric.StaticCanvas(null, {width:p.pageW, height:p.pageH, backgroundColor:'#ffffff'});
    await sc.loadFromJSON(p.json);
    recomputeBgFieldsFromObjects(sc.getObjects());
    sc.renderAll();
    let dataUrl = sc.toDataURL({format:'png', multiplier: mult});
    out.push(pngWithDpi(dataUrl, getExportDpi(p.pageW*mult, p.template)));
    sc.dispose();
  }
  currentFoldField = savedFold; currentRuledLines = savedRuled;
  return out;
}
async function exportPagesPDF(){
  if (PAGES.length<2){ alert('Só tem uma página — use "Baixar PNG", ou adicione mais páginas primeiro (botão "+ Página").'); return; }
  const btn = document.getElementById('btnExportPDF');
  if (btn) btn.disabled = true;
  try {
    const mult = +document.getElementById('exportScale').value;
    const pngs = await collectPagePNGs(mult);
    const [wIn, hIn] = docPhysicalSize(currentTemplate);
    const orientation = wIn >= hIn ? 'landscape' : 'portrait';
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({orientation, unit:'in', format:[wIn, hIn], compress:true});
    pngs.forEach((dataUrl, i)=>{
      if (i>0) pdf.addPage([wIn, hIn], orientation);
      pdf.addImage(dataUrl, 'PNG', 0, 0, wIn, hIn);
    });
    pdf.save(`prop_${currentTemplate.replace(/[^a-z0-9_-]/gi,'_')}_${Date.now()}.pdf`);
  } finally { if (btn) btn.disabled = false; }
}

async function makePhotoPlaceholder(opts){
  opts = opts||{};
  const c = document.createElement('canvas'); c.width=400; c.height=260;
  const ctx = c.getContext('2d');
  // Nada de texto de instrução cravado no pixel — isso ia pro PNG exportado se o
  // Max esquecesse de trocar a foto (bug real, achado pelo Max: "precisa ficar mais
  // realista"). Em vez de uma caixa cinza chapada, um degradê com manchas suaves
  // dá variação de tom de verdade pro filtro de meio-tom trabalhar em cima — uma
  // área plana vira uma grade de pontos uniforme e sem graça nenhuma.
  const grd = ctx.createRadialGradient(200,110,20,200,140,270);
  grd.addColorStop(0,'#e8e2cd');
  grd.addColorStop(0.55,'#a49a80');
  grd.addColorStop(1,'#5f5648');
  ctx.fillStyle=grd; ctx.fillRect(0,0,400,260);
  for (let i=0;i<6;i++){
    const bx=50+Math.random()*300, by=30+Math.random()*200, r=25+Math.random()*75;
    const rg = ctx.createRadialGradient(bx,by,0,bx,by,r);
    rg.addColorStop(0,'rgba(28,24,18,0.2)');
    rg.addColorStop(1,'rgba(28,24,18,0)');
    ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(bx,by,r,0,Math.PI*2); ctx.fill();
  }
  const img = await fabric.Image.fromURL(c.toDataURL());
  img.set({left:opts.left||300, top:opts.top||300, scaleX:(opts.width||300)/img.width, scaleY:(opts.height||200)/img.height});
  img.filters = [new HalftoneFilter({size:0.012})];
  img.set('customType','photoPlaceholder');
  applyPhotoCornerRadius(img, opts.rx||0);
  return img;
}
/* Cantos arredondados opcionais (crachás etc.) — o raio é guardado em PIXELS DO
   DOCUMENTO (não em unidades locais do objeto), porque "Trocar foto" troca o
   elemento de imagem por um novo quase sempre com outro tamanho natural — sem
   isso o clipPath ficaria com o raio errado depois da troca. */
function applyPhotoCornerRadius(img, rxPx){
  img.__cornerRadiusPx = rxPx||0;
  if (!rxPx){ img.clipPath = null; return; }
  const rx = rxPx/(img.scaleX||1), ry = rxPx/(img.scaleY||1);
  img.clipPath = new fabric.Rect({width:img.width, height:img.height, rx, ry, originX:'center', originY:'center', left:0, top:0});
}

/* ===================== Toolbar: adicionar objetos ===================== */
document.getElementById('templateSel').addEventListener('change', ()=>{});
document.getElementById('btnNewDoc').addEventListener('click', ()=>{
  if (!confirm('Isso apaga o documento atual. Continuar?')) return;
  loadTemplate(document.getElementById('templateSel').value);
});
document.getElementById('btnPagePrev').addEventListener('click', ()=>pageGo(curPageIdx-1));
document.getElementById('btnPageNext').addEventListener('click', ()=>pageGo(curPageIdx+1));
document.getElementById('btnPageAdd').addEventListener('click', ()=>pageAdd(document.getElementById('pageKindSel').value));
document.getElementById('btnPageDel').addEventListener('click', ()=>pageDelete());

/* ===================== Layout do jornal (presets, título, justificar, caixa) =====================
   O texto e as fotos vivem nos próprios objetos (news-engine.js: __newsRole); trocar de preset colhe o que
   está no canvas e refaz o layout, então nada do que o Max editou se perde. */
const newsPresetRow = document.getElementById('newsPresetRow');
NEWS_PRESET_ORDER.forEach(key=>{
  const b = document.createElement('button');
  b.textContent = NEWS_PRESETS[key].label; b.dataset.preset = key;
  b.addEventListener('click', ()=>{ if (!sceneBusy) newsRebuild({preset:key}); });
  newsPresetRow.appendChild(b);
});
document.getElementById('newsMast').addEventListener('change', e=>{ if (!sceneBusy) newsRebuild({mast:e.target.value}); });
document.getElementById('newsJustify').addEventListener('change', e=>{ if (!sceneBusy) newsRebuild({justify:e.target.checked}); });
document.getElementById('btnNewsReflow').addEventListener('click', ()=>{ if (!sceneBusy) newsRebuild({}); });
function addNewsBox(){
  const nb = new NewsBox('Write here. The box grows with the text.', {left:PAGE_W/2-150, top:PAGE_H/2-70, width:300, frame:'box', title:'NOTICE', globalCompositeOperation:'multiply'});
  canvas.add(nb); canvas.setActiveObject(nb); canvas.renderAll();
}
['btnAddNewsBox','btnNewsBoxHere'].forEach(id=>{ const b = document.getElementById(id); if (b) b.addEventListener('click', addNewsBox); });
/* Emblemas (aba Adicionar): escolhe família + versão + cor e insere no centro da página. */
(function initEmblemUI(){
  const k = document.getElementById('emKind'), v = document.getElementById('emVariant'), c = document.getElementById('emColor');
  if (!k || !v) return;
  Object.keys(EM_KINDS).forEach(id=>k.add(new Option(EM_KINDS[id], id)));
  Object.keys(EM_VARIANTS).forEach(id=>v.add(new Option(EM_VARIANTS[id], id)));
  v.value = 'tinta';
  v.addEventListener('change', ()=>{ c.value = v.value === 'selo' ? '#7a2020' : '#1b1a18'; });
  document.getElementById('btnAddEmblem').addEventListener('click', async ()=>{
    await ensureFonts(EM_FONTS);
    const size = Math.round(Math.min(340, PAGE_W*0.4, PAGE_H*0.4));
    const useColor = ['tinta', 'selo', 'negativo'].includes(v.value);
    const e = new Emblem({left:PAGE_W/2 - size/2, top:PAGE_H/2 - size/2, width:size, em:{kind:k.value, variant:v.value, color:useColor ? c.value : null, accent:null, seed:randomSeed32(), wear:0.5}});
    canvas.add(e); canvas.setActiveObject(e); canvas.renderAll(); pushHistory();
  });
})();
function renderEmblemInspector(obj, body){
  const em = obj.em;
  const opt = (map)=>Object.keys(map).map(value=>({value, label:map[value]}));
  body.appendChild(field.select('Emblema', opt(EM_KINDS), em.kind, val=>{ obj.setEmblem({kind:val}); canvas.renderAll(); pushHistory(); updateInspector(); }));
  body.appendChild(field.select('Versão', opt(EM_VARIANTS), em.variant, val=>{
    obj.setEmblem({variant:val, color: val === 'selo' && !em.color ? '#7a2020' : em.color});
    canvas.renderAll(); pushHistory(); updateInspector();
  }));
  if (['tinta', 'selo', 'negativo'].includes(em.variant)) body.appendChild(field.color('Cor da tinta', em.color || EM_INK, val=>{ obj.setEmblem({color:val}); canvas.renderAll(); }));
  if (em.variant === 'cor'){
    body.appendChild(field.color('Anel e linha d\'água', em.color || EM_PAL.cor.ring, val=>{ obj.setEmblem({color:val}); canvas.renderAll(); }));
    body.appendChild(field.color('Estrela e "NOV — APR"', em.accent || EM_PAL.cor.star, val=>{ obj.setEmblem({accent:val}); canvas.renderAll(); }));
  }
  if (em.variant === 'selo'){
    body.appendChild(field.range('Desgaste do carimbo', em.wear != null ? em.wear : 0.5, 0, 1, 0.05, val=>{ obj.setEmblem({wear:val}); canvas.renderAll(); }));
    body.appendChild(field.button('🎲 Novo desgaste', ()=>{ obj.setEmblem({seed:randomSeed32()}); canvas.renderAll(); pushHistory(); }));
  }
  body.appendChild(field.hint('Vetor: dá pra ampliar à vontade sem perder nitidez. Use as alças dos cantos pra mudar o tamanho.'));
}
/* Seletor "Estilo" (só aparece nos modelos que têm mais de um estilo, ex.: cardápios). */
function syncDocVariantUI(){
  syncPageKindUI();
  const hn = document.getElementById('docHint'), hd = (typeof DOC_TEMPLATES!=='undefined') && DOC_TEMPLATES[currentTemplate];
  if (hn){ hn.textContent = (hd && hd.hint) || ''; hn.style.display = (hd && hd.hint) ? 'block' : 'none'; }
  const blk = document.getElementById('docVariantBlock'); if (!blk) return;
  const def = (typeof DOC_TEMPLATES!=='undefined') && DOC_TEMPLATES[currentTemplate];
  if (!def || !def.variants || def.variants.length < 2){ blk.style.display = 'none'; return; }
  blk.style.display = 'block';
  const sel = document.getElementById('docVariantSel');
  const sig = def.variants.map(v=>v.id).join(',');
  if (sel.dataset.sig !== currentTemplate + ':' + sig){
    sel.innerHTML = ''; def.variants.forEach(v=>{ const o = document.createElement('option'); o.value = v.id; o.textContent = v.label; sel.appendChild(o); });
    sel.dataset.sig = currentTemplate + ':' + sig;
  }
  const bg = getBackground();
  sel.value = (bg && bg.__docVariant) || def.variants[0].id;
}
document.getElementById('docVariantSel').addEventListener('change', async (e)=>{
  const want = e.target.value;
  if (!confirm('Trocar o estilo refaz o cardápio do zero (apaga as edições deste documento). Continuar?')){ syncDocVariantUI(); return; }
  await loadTemplate(currentTemplate, {variant:want});
});
function syncNewsLayoutUI(){
  syncDocVariantUI();
  const show = currentTemplate==='newspaper';
  document.getElementById('newsLayoutBlock').style.display = show?'block':'none';
  const st = show ? getNewsState() : null;
  if (st){
    document.getElementById('newsMast').value = st.mast || 'gothic';
    document.getElementById('newsJustify').checked = !!st.justify;
  }
  document.querySelectorAll('#newsPresetRow button').forEach(b=>b.classList.toggle('active', !!st && b.dataset.preset===st.preset));
  syncPaperUI();
}

document.getElementById('btnAddText').addEventListener('click', ()=>{
  const t = new fabric.Textbox('Texto', {left:PAGE_W/2-150, top:PAGE_H/2-20, width:300, fontFamily:"'PT Serif'", fontSize:20, fill:'#181410'});
  canvas.add(t); canvas.setActiveObject(t); canvas.renderAll();
});
document.getElementById('btnAddHandwritten').addEventListener('click', ()=>{
  const t = new HandwrittenText('escreva aqui', {left:PAGE_W/2-150, top:PAGE_H/2-20, width:300, personaId:'A'});
  canvas.add(t); canvas.setActiveObject(t); canvas.renderAll();
});
document.getElementById('btnAddRedacted').addEventListener('click', ()=>{
  const t = new RedactedText('texto datilografado a ser parcialmente censurado', {left:PAGE_W/2-200, top:PAGE_H/2-20, width:400, redactPct:25});
  canvas.add(t); canvas.setActiveObject(t); canvas.renderAll();
});
document.getElementById('btnAddStamp').addEventListener('click', ()=>{
  const stamp = makeStampObjects('CONFIDENTIAL', {left:PAGE_W/2, top:PAGE_H/2});
  canvas.add(stamp); canvas.setActiveObject(stamp); canvas.renderAll();
});
document.getElementById('btnAddBarcode').addEventListener('click', async ()=>{
  const b = await makeBarcodeImage({left:PAGE_W/2-130, top:PAGE_H/2});
  canvas.add(b); canvas.setActiveObject(b); canvas.renderAll();
});
document.getElementById('btnAddPhotoPlaceholder').addEventListener('click', async ()=>{
  const p = await makePhotoPlaceholder({left:PAGE_W/2-150, top:PAGE_H/2-100});
  canvas.add(p); canvas.setActiveObject(p); canvas.renderAll();
});
document.getElementById('btnAddWatermark').addEventListener('click', ()=>{
  const t = makeWatermarkText('CONFIDENTIAL', {left:PAGE_W/2, top:PAGE_H/2, width:PAGE_W*0.8});
  canvas.add(t); canvas.setActiveObject(t); canvas.renderAll();
});
document.getElementById('btnAddNetNode').addEventListener('click', ()=>armPlaceNetNode());
[['btnStainWater','water'],['btnStainCoffee','coffee'],['btnStainBlood','blood'],['btnStainMold','mold']].forEach(([id,type])=>{
  const b = document.getElementById(id); if (b) b.addEventListener('click', ()=>addStain(type));
});

function loadImageFileToCanvas(file, atPoint){
  const reader = new FileReader();
  reader.onload = (e)=>{
    fabric.Image.fromURL(e.target.result).then(img=>{
      const maxW = 500;
      if (img.width>maxW) img.scale(maxW/img.width);
      img.set({left:(atPoint&&atPoint.x)||PAGE_W/2-img.getScaledWidth()/2, top:(atPoint&&atPoint.y)||PAGE_H/2-img.getScaledHeight()/2});
      img.set('customType','photo');
      canvas.add(img); canvas.setActiveObject(img); canvas.renderAll();
    });
  };
  reader.readAsDataURL(file);
}
document.getElementById('fileAddImage').addEventListener('change', (e)=>{
  const f = e.target.files[0]; if (f) loadImageFileToCanvas(f);
  e.target.value = '';
});
const canvasWrap = document.getElementById('canvasWrap');
canvasWrap.addEventListener('dragover', e=>{ e.preventDefault(); });
canvasWrap.addEventListener('drop', e=>{
  e.preventDefault();
  const f = e.dataTransfer.files[0];
  if (!f || !f.type.startsWith('image/')) return;
  const rect = canvasWrap.getBoundingClientRect();
  const z = canvas.getZoom();
  const pt = {x:(e.clientX-rect.left)/z, y:(e.clientY-rect.top)/z};
  loadImageFileToCanvas(f, pt);
});

/* ===================== Camadas ===================== */
function objLabel(o){
  if (o.__labName) return o.__labName;
  if (o.customType==='background') return '📄 Papel de fundo';
  if (o.customType==='brandArt') return '🎨 Arte do documento (travada)';
  if (o.type==='brandtext') return '𝐓 ' + (o.text||'').replace(/\*\*|\[\[|\]\]/g,'').slice(0,20);
  if (o.customType==='stain') return '💧 Mancha';
  if (o.customType==='grunge') return '🪨 Sujeira/grunge';
  if (o.customType==='bloom') return '✨ Glow';
  if (o.customType==='stamp' || o.customType==='stampText') return '🔖 Carimbo';
  if (o.customType==='stampBorder') return '▭ Moldura do carimbo';
  if (o.customType==='stampGrain') return '🩸 Textura de tinta';
  if (o.customType==='watermark') return "💧 Marca d'água";
  if (o.customType==='netNode') return '▭ Nó de rede';
  if (o.customType==='netNodeLabel') return '▭ Rótulo do nó';
  if (o.customType==='netLink') return '— Ligação';
  if (o.customType==='barcode') return '▮ Código de barras';
  if (o.customType==='photoPlaceholder') return '🖼 Placeholder de foto';
  if (o.customType==='photo') return '🖼 Foto';
  if (o.customType==='polaroidFrame') return '🖼 Moldura Polaroid';
  if (o.customType==='polaroidCaption') return '✏️ Legenda';
  if (o.customType==='cctvHud') return '📹 HUD câmera';
  if (o.customType==='vhsBar') return '▬ Barra VHS';
  if (o.type==='group' && o.__userGroup) return '📦 Grupo';
  if (o.type==='handwrittentext') return '✎ ' + (o.text||'').slice(0,18);
  if (o.type==='redactedtext') return '▬ ' + (o.text||'').slice(0,18);
  if (o.type==='newsbox') return '📰 ' + (o.title || o.text || '').toString().replace(/\s+/g,' ').slice(0,22);
  if (o.type==='textbox') return 'T ' + (o.text||'').slice(0,18);
  if (o.type==='image') return '🖼 Imagem';
  return o.type;
}
function renderLayerList(){
  const box = document.getElementById('layerList');
  box.innerHTML = '';
  // Alça de conexão do nó de rede e as guias de alinhamento são chrome de edição, não
  // conteúdo — não aparecem como linha própria na lista (igual cropRect já não aparecia).
  const objs = canvas.getObjects().filter(o=>o!==cropRect && o.customType!=='netConnectHandle' && o!==__guideH && o!==__guideV).slice().reverse();
  const activeMembers = activeSelectionMembers(canvas.getActiveObject());
  objs.forEach(o=>{
    const row = document.createElement('div');
    row.className = 'layerRow' + (activeMembers.includes(o)?' active':'');

    const thumb = document.createElement('img'); thumb.className='layerThumb';
    try {
      const bw = o.getScaledWidth()||40, bh = o.getScaledHeight()||40;
      thumb.src = o.toDataURL({format:'png', multiplier: 30/Math.max(bw,bh,1)});
    } catch(e){ /* objeto ainda não renderizável — sem miniatura */ }
    row.appendChild(thumb);

    const nm = document.createElement('span'); nm.className='nm'; nm.textContent = objLabel(o);
    nm.title = 'Duplo clique pra renomear';
    nm.addEventListener('dblclick', ev=>{
      ev.stopPropagation();
      const novo = prompt('Novo nome da camada:', o.__labName||'');
      if (novo){ o.__labName = novo; renderLayerList(); pushHistory(); }
    });
    row.appendChild(nm);

    if (!isLockedBase(o)){
      const up = document.createElement('button'); up.textContent='↑'; up.title='Avançar um nível (Shift+clique: trazer pra frente de tudo)';
      up.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        if (ev.shiftKey) canvas.bringObjectToFront(o); else canvas.bringObjectForward(o);
        canvas.renderAll(); renderLayerList(); pushHistory();
      });
      row.appendChild(up);
      const down = document.createElement('button'); down.textContent='↓'; down.title='Recuar um nível (Shift+clique: mandar pra trás de tudo)';
      down.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        if (ev.shiftKey) canvas.sendObjectToBack(o); else canvas.sendObjectBackwards(o);
        canvas.renderAll(); renderLayerList(); pushHistory();
      });
      row.appendChild(down);
      const lock = document.createElement('button'); lock.textContent = o.__userLocked?'🔒':'🔓';
      lock.title = o.__userLocked ? 'Destravar (permite mover/selecionar no canvas de novo)' : 'Travar (impede mover/selecionar sem querer no canvas)';
      lock.addEventListener('click', (ev)=>{ ev.stopPropagation(); toggleObjectLock(o); });
      row.appendChild(lock);
      const hide = document.createElement('button'); hide.textContent = o.visible===false?'🙈':'👁';
      hide.title = o.visible===false ? 'Mostrar de novo' : 'Esconder (some do canvas, continua na lista)';
      hide.addEventListener('click', (ev)=>{ ev.stopPropagation(); toggleObjectHide(o); });
      row.appendChild(hide);
      const del = document.createElement('button'); del.textContent='✕';
      del.addEventListener('click', (ev)=>{ ev.stopPropagation(); deleteObjectCascade(canvas, o); canvas.renderAll(); });
      row.appendChild(del);
    }
    row.addEventListener('click', ()=>{ canvas.setActiveObject(o); canvas.renderAll(); updateInspector(); });
    box.appendChild(row);
  });
}

/* ===================== Editor de texto (modal) =====================
   Nunca deixa o Fabric entrar no modo de edição nativo em HandwrittenText/
   RedactedText — esses dois sobrescrevem _render() com layout próprio, então o
   cursor nativo do Fabric (que depende do layout de linha INTERNO do Fabric) fica
   na posição errada. Sempre passa por este modal, que tem cursor de verdade
   (textarea normal) + prévia ao vivo renderizada com a MESMA função de desenho do
   objeto real. */
let editorTarget = null;
function renderEditorPreview(targetObj, text){
  const canvasEl = document.getElementById('editorPreview');
  const ctx = canvasEl.getContext('2d');
  ctx.clearRect(0,0,canvasEl.width,canvasEl.height);
  const lightInk = targetObj.type==='brandtext' && typeof targetObj.fill==='string' && (()=>{ const m = rgbToHex(targetObj.fill).match(/[0-9a-f]{2}/gi); return m && (parseInt(m[0],16)*0.299+parseInt(m[1],16)*0.587+parseInt(m[2],16)*0.114) > 150; })();
  ctx.fillStyle = lightInk ? '#141a24' : '#efe7d0'; ctx.fillRect(0,0,canvasEl.width,canvasEl.height);

  const w = targetObj.width||300, h = Math.max(targetObj.height||300, w*0.6);
  const fitScale = Math.min(canvasEl.width/w, canvasEl.height/h) * 0.9;
  ctx.save();
  ctx.setTransform(fitScale,0,0,fitScale, canvasEl.width/2, canvasEl.height/2);

  if (targetObj.type==='handwrittentext'){
    const tmp = new HandwrittenText(text||' ', {width:w, personaId:targetObj.personaId, fatigue:targetObj.fatigue, seed:targetObj.seed, fontSize:targetObj.fontSize});
    tmp._render(ctx);
  } else if (targetObj.type==='brandtext'){
    const tmp = new BrandText(text||' ', targetObj.brandCloneOptions());
    tmp._render(ctx);
  } else if (targetObj.type==='redactedtext'){
    const tmp = new RedactedText(text||' ', {width:w, redactPct:targetObj.redactPct, seed:targetObj.seed, fontFamily:targetObj.fontFamily, fontSize:targetObj.fontSize, fill:targetObj.fill});
    tmp._render(ctx);
  } else if (targetObj.type==='newsbox'){
    const tmp = new NewsBox(text||' ', Object.assign(targetObj.newsOptions(), {title: document.getElementById('editorTitleInput').value}));
    tmp._render(ctx);
  } else {
    ctx.font = `${targetObj.fontSize||16}px ${targetObj.fontFamily||"'PT Serif'"}`;
    ctx.fillStyle = targetObj.fill||'#181410';
    ctx.textBaseline = 'top';
    const x0=-w/2, y0=-h/2;
    let x=x0, y=y0;
    const lineHeight = (targetObj.fontSize||16)*1.3;
    (text||'').split(/\n/).forEach(line=>{
      x = x0;
      line.split(/\s+/).filter(Boolean).forEach(word=>{
        const ww = ctx.measureText(word+' ').width;
        if (x+ww > x0+w && x>x0){ y+=lineHeight; x=x0; }
        ctx.fillText(word, x, y);
        x += ww;
      });
      y += lineHeight;
    });
  }
  ctx.restore();
}
/* Barra de formatação do modal (duplo clique no texto): fonte, tamanho, negrito, itálico, alinhamento e cor.
   Aplica ao vivo no objeto (a prévia já lê dele) e o desfazer entra no fechar do modal.
   Cada tipo tem os nomes de propriedade dele (NewsBox: bodyFont/bodyWeight/bodyStyle). */
let editorFormatDirty = false;
function editorFmtProps(o){
  if (o.type==='newsbox') return {font:'bodyFont', weight:'bodyWeight', style:'bodyStyle', align:'textAlign', fill:'fill', size:'fontSize', quotes:false};
  return {font:'fontFamily', weight:'fontWeight', style:'fontStyle', align:'textAlign', fill:'fill', size:'fontSize', quotes:true};
}
function buildEditorFormat(o){
  const bar = document.getElementById('editorFormat');
  bar.innerHTML = '';
  editorFormatDirty = false;
  if (o.type==='handwrittentext'){
    bar.style.display = 'flex';
    const sel = document.createElement('select'); sel.title = 'Estilo de letra';
    HANDWRITING_PERSONA_LIST.forEach(p=>{ const op = document.createElement('option'); op.value = p.id; op.textContent = p.label; sel.appendChild(op); });
    sel.value = o.personaId;
    sel.addEventListener('change', ()=>{ o.personaId = sel.value; editorFormatDirty = true; canvas.requestRenderAll(); renderEditorPreview(o, document.getElementById('editorTextarea').value); });
    bar.appendChild(sel);
    return;
  }
  if (o.customType==='stampText' || o.type==='group'){ bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  const P = editorFmtProps(o);
  const apply = (k, v)=>{ o.set(k, v); editorFormatDirty = true; canvas.requestRenderAll(); renderEditorPreview(o, document.getElementById('editorTextarea').value); };
  // fonte
  const fams = DOC_FONTS.map(f=>P.quotes ? `'${f}'` : f);
  const cur = o[P.font];
  if (cur && !fams.includes(cur)) fams.unshift(cur);
  const fsel = document.createElement('select'); fsel.title = 'Fonte'; fsel.className = 'fmtFont';
  fams.forEach(f=>{ const op = document.createElement('option'); op.value = f; op.textContent = String(f).replace(/'/g,''); op.style.fontFamily = P.quotes ? f : `'${f}'`; fsel.appendChild(op); });
  fsel.value = cur;
  fsel.addEventListener('change', ()=>apply(P.font, fsel.value));
  bar.appendChild(fsel);
  // tamanho
  const size = document.createElement('input'); size.type = 'number'; size.min = 6; size.max = 400; size.step = 1; size.title = 'Tamanho'; size.className = 'fmtSize';
  size.value = Math.round(o[P.size]*10)/10;
  size.addEventListener('input', ()=>{ const v = +size.value; if (v >= 6) apply(P.size, v); });
  bar.appendChild(size);
  const tog = (label, title, on, fn, st)=>{
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.title = title; b.className = 'fmtBtn' + (on ? ' on' : ''); if (st) b.style.cssText = st;
    b.addEventListener('click', ()=>{ const now = !b.classList.contains('on'); b.classList.toggle('on', now); fn(now); });
    bar.appendChild(b); return b;
  };
  tog('B', 'Negrito', +o[P.weight] >= 600 || o[P.weight]==='bold', on=>apply(P.weight, on ? 700 : 400), 'font-weight:700');
  tog('I', 'Itálico', o[P.style]==='italic', on=>apply(P.style, on ? 'italic' : 'normal'), 'font-style:italic');
  ['left','center','right'].forEach((a, i)=>{
    const b = document.createElement('button'); b.type = 'button'; b.title = 'Alinhar ' + ['à esquerda','ao centro','à direita'][i];
    b.textContent = ['⇤','↔','⇥'][i]; b.className = 'fmtBtn' + ((o[P.align]||'left')===a ? ' on' : '');
    b.addEventListener('click', ()=>{ bar.querySelectorAll('.fmtAlign').forEach(x=>x.classList.remove('on')); b.classList.add('on'); apply(P.align, a); });
    b.classList.add('fmtAlign'); bar.appendChild(b);
  });
  if (typeof o[P.fill]==='string'){
    const col = document.createElement('input'); col.type = 'color'; col.title = 'Cor do texto'; col.className = 'fmtColor';
    col.value = rgbToHex(o[P.fill]);
    col.addEventListener('input', ()=>apply(P.fill, col.value));
    bar.appendChild(col);
  }
}
function updateEditorCount(){
  const v = document.getElementById('editorTextarea').value;
  document.getElementById('editorCount').textContent = v.length+' caracteres, '+(v.trim()?v.trim().split(/\s+/).length:0)+' palavras';
}
function openTextEditor(targetObj){
  editorTarget = targetObj;
  document.getElementById('editorTitle').textContent = 'Editando texto';
  const ta = document.getElementById('editorTextarea');
  ta.value = targetObj.text;
  const ti = document.getElementById('editorTitleInput');
  if (targetObj.type==='newsbox'){ ti.style.display = 'block'; ti.value = targetObj.title || ''; document.getElementById('editorTitle').textContent = 'Editando caixa de jornal'; }
  else ti.style.display = 'none';
  buildEditorFormat(targetObj);
  document.getElementById('editorModal').hidden = false;
  updateEditorCount();
  renderEditorPreview(targetObj, ta.value);
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
}
function closeTextEditor(){
  if (editorTarget){
    const before = editorTarget.text;
    const newText = document.getElementById('editorTextarea').value;
    // Texto de carimbo é filho de um Group (ver handwriting.js) — a largura pode mudar e
    // o grupo não se remede sozinho quando um filho muda de tamanho por dentro, então
    // trocar o texto reconstrói o carimbo inteiro em vez de só setar `.text`.
    if (editorTarget.customType==='stampText' && newText!==before && editorTarget.group){
      const fresh = rebuildStamp(editorTarget.group, newText);
      canvas.setActiveObject(fresh);
      canvas.renderAll(); renderLayerList();
      pushHistory();
    } else if (editorTarget.type==='newsbox'){
      const newTitle = document.getElementById('editorTitleInput').value, beforeTitle = editorTarget.title;
      editorTarget.set({title:newTitle, text:newText});
      canvas.renderAll(); renderLayerList();
      if (newText !== before || newTitle !== beforeTitle) pushHistory();
    } else {
      editorTarget.set('text', newText);
      canvas.renderAll(); renderLayerList();
      if (newText !== before) pushHistory();
    }
  }
  if (editorFormatDirty){ canvas.renderAll(); renderLayerList(); pushHistory(); editorFormatDirty = false; }
  document.getElementById('editorModal').hidden = true;
  editorTarget = null;
}
document.getElementById('editorTextarea').addEventListener('input', ()=>{
  updateEditorCount();
  if (editorTarget) renderEditorPreview(editorTarget, document.getElementById('editorTextarea').value);
});
document.getElementById('editorTitleInput').addEventListener('input', ()=>{
  if (editorTarget) renderEditorPreview(editorTarget, document.getElementById('editorTextarea').value);
});
document.getElementById('editorClose').addEventListener('click', closeTextEditor);

/* ===================== Multi-seleção =====================
   Pedido do Max, achado numa auditoria do código: o Fabric já deixa marquee/shift-click
   multi-selecionar (canvas.selection nunca foi desativado), mas APAGAR, DUPLICAR e o
   inspector só liam canvas.getActiveObject() (singular) — com 2+ objetos isso devolve o
   ActiveSelection sintético do Fabric, que nenhum desses caminhos tratava (os `if` de tipo
   simplesmente não batiam, silenciosamente). Esses 3 helpers centralizam o tratamento:
   qualquer lugar que precisar "apagar o que tá selecionado" ou "duplicar o que tá
   selecionado" chama estes em vez de reimplementar o desvio objeto-único/seleção-múltipla. */
function activeSelectionMembers(obj){
  // Fabric 6: o getter .type devolve o nome da classe em minúsculo (confirmado ao vivo:
  // 'activeselection', não 'activeSelection') — testar com o valor real, não o que pareceria certo.
  return obj && obj.type==='activeselection' ? obj.getObjects() : (obj ? [obj] : []);
}
function deleteActiveSelection(){
  const obj = canvas.getActiveObject();
  if (!obj || obj===cropRect) return;
  const members = activeSelectionMembers(obj).filter(m=>m!==cropRect && !isLockedBase(m));
  if (!members.length) return;
  canvas.discardActiveObject();
  members.forEach(m=>deleteObjectCascade(canvas, m));
  canvas.renderAll();
}
function duplicateActiveSelection(){
  const obj = canvas.getActiveObject();
  if (!obj) return;
  const members = activeSelectionMembers(obj).filter(m=>m.customType!=='brandArt');
  if (!members.length) return;
  canvas.discardActiveObject();
  Promise.all(members.map(m=>m.clone().then(c=>{ c.set({left:m.left+20, top:m.top+20}); canvas.add(c); return c; }))).then(clones=>{
    if (clones.length===1) canvas.setActiveObject(clones[0]);
    else canvas.setActiveObject(new fabric.ActiveSelection(clones, {canvas}));
    canvas.renderAll();
  });
}

/* ---- Clipboard (Ctrl+C/Ctrl+V): diferente de Duplicar (Ctrl+D, mesmo canvas, instantâneo),
   o clipboard PERSISTE — guarda um snapshot serializado (mesma serialização HISTORY_PROPS
   que pageSnapshot/histórico já usam em todo lugar do projeto, não uma referência Fabric
   viva) então sobrevive a trocar de página ou até de documento antes de colar. Reconstrução
   via fabric.util.enlivenObjects (confirmado ao vivo: round-trip preserva customType/
   personaId/instância de classe certa — mesmo mecanismo que canvas.loadFromJSON usa por
   baixo pro histórico). */
let editorClipboard = null;
function copyActiveSelection(){
  const obj = canvas.getActiveObject();
  if (!obj) return;
  const members = activeSelectionMembers(obj).filter(m=>m!==cropRect && m.customType!=='brandArt');
  if (!members.length) return;
  editorClipboard = members.map(m=>m.toObject(HISTORY_PROPS));
}
function pasteClipboard(){
  if (!editorClipboard || !editorClipboard.length) return;
  fabric.util.enlivenObjects(editorClipboard).then(objs=>{
    objs.forEach(o=>{ o.set({left:(o.left||0)+20, top:(o.top||0)+20}); canvas.add(o); });
    if (objs.length===1) canvas.setActiveObject(objs[0]);
    else canvas.setActiveObject(new fabric.ActiveSelection(objs, {canvas}));
    canvas.renderAll();
    updateInspector();
  });
}

/* ---- Agrupar/Desagrupar persistente (Ctrl+G/Ctrl+Shift+G, convenção Figma/Canva) ----
   `toGroup()`/`toActiveSelection()` NÃO existem nesta build vendorizada do Fabric 6.4.3
   (confirmado por grep direto no fonte — API documentada em versões mais novas, não nesta).
   Grupo: reusa a técnica já comprovada dos composites fixos (composites.js) — remove os
   objetos (posição absoluta) do canvas, `new fabric.Group([...])` já converte sozinho pra
   coordenada relativa ao grupo. Desagrupar: `group.exitGroup(filho, false)` é um método
   PÚBLICO do Fabric (achado lendo o fonte vendorizado, não documentado nos resultados de
   busca) que aplica a transformação inversa — testado ao vivo, round-trip exato (mesmo
   left/top/angle/scale de antes de agrupar). `__userGroup:true` distingue esse grupo
   genérico do usuário dos composites fixos (carimbo/polaroid/HUD/nó de rede), que têm seu
   próprio customType e inspector dedicado — um grupo de usuário cai no inspector genérico
   (opacidade/mescla + Desagrupar), não em nenhum desses. subTargetCheck+interactive:false
   reusa o mesmo padrão dos composites: arrasta como peça única, mas duplo clique ainda
   alcança um filho de texto pra editar (mouse:dblclick já trata isso genericamente pra
   qualquer Group, nenhuma mudança necessária ali). */
function groupActiveSelection(){
  const obj = canvas.getActiveObject();
  if (!obj || obj.type!=='activeselection') return;
  const members = activeSelectionMembers(obj).filter(m=>m!==cropRect && !isLockedBase(m));
  if (members.length<2) return;
  canvas.discardActiveObject();
  members.forEach(m=>canvas.remove(m));
  const group = new fabric.Group(members, {__userGroup:true, subTargetCheck:true, interactive:false});
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.renderAll();
  updateInspector();
  pushHistory();
}
function ungroupSelection(){
  const obj = canvas.getActiveObject();
  if (!obj || obj.type!=='group' || !obj.__userGroup) return;
  const members = obj.getObjects().slice();
  canvas.remove(obj);
  members.forEach(m=>{ obj.exitGroup(m, false); canvas.add(m); });
  canvas.setActiveObject(new fabric.ActiveSelection(members, {canvas}));
  canvas.renderAll();
  updateInspector();
  pushHistory();
}

/* ---- Alinhar/distribuir multi-seleção (convenção Figma: Alt+A/H/D/W/V/S — não
   implementado como atalho aqui de propósito, colide com atalhos comuns de
   navegador/SO; só botão). `getBoundingRect()` já devolve coordenada de DOCUMENTO
   absoluta mesmo pra um objeto dentro de ActiveSelection (mesmo fato que
   applyAlignmentSnap já usa) — a matemática de bbox combinado/delta foi validada
   em Node isolada antes de integrar (ver histórico de commits). Somar o delta
   (puramente relativo) em m.left/m.top funciona mesmo quando esses valores estão
   em coordenada relativa à ActiveSelection, porque é uma DIFERENÇA, não uma
   posição absoluta, e a seleção não tem rotação/escala própria no caso normal
   (confirmado ao vivo). */
function selectionBBox(members){
  const rects = members.map(m=>m.getBoundingRect());
  const left = Math.min(...rects.map(r=>r.left));
  const top = Math.min(...rects.map(r=>r.top));
  const right = Math.max(...rects.map(r=>r.left+r.width));
  const bottom = Math.max(...rects.map(r=>r.top+r.height));
  return {left, top, right, bottom, width:right-left, height:bottom-top};
}
function alignSelection(mode){
  const obj = canvas.getActiveObject();
  if (!obj) return;
  const members = activeSelectionMembers(obj).filter(m=>m!==cropRect);
  if (members.length<2) return;
  const bbox = selectionBBox(members);
  members.forEach(m=>{
    const r = m.getBoundingRect();
    let dx=0, dy=0;
    if (mode==='left') dx = bbox.left - r.left;
    else if (mode==='right') dx = bbox.right - (r.left+r.width);
    else if (mode==='centerH') dx = (bbox.left+bbox.width/2) - (r.left+r.width/2);
    else if (mode==='top') dy = bbox.top - r.top;
    else if (mode==='bottom') dy = bbox.bottom - (r.top+r.height);
    else if (mode==='centerV') dy = (bbox.top+bbox.height/2) - (r.top+r.height/2);
    m.set({left:m.left+dx, top:m.top+dy});
    m.setCoords();
  });
  canvas.renderAll();
  pushHistory();
}
function distributeSelection(axis){
  const obj = canvas.getActiveObject();
  if (!obj) return;
  const members = activeSelectionMembers(obj).filter(m=>m!==cropRect);
  if (members.length<3) return;
  const withBox = members.map(m=>({m, box:m.getBoundingRect()}));
  const key = axis==='h' ? (b=>b.left+b.width/2) : (b=>b.top+b.height/2);
  withBox.sort((a,b)=>key(a.box)-key(b.box));
  const firstC = key(withBox[0].box), lastC = key(withBox[withBox.length-1].box);
  const step = (lastC-firstC)/(withBox.length-1);
  withBox.forEach((item,pos)=>{
    if (pos===0 || pos===withBox.length-1) return;
    const targetC = firstC + step*pos;
    const delta = targetC - key(item.box);
    if (axis==='h') item.m.set({left:item.m.left+delta});
    else item.m.set({top:item.m.top+delta});
    item.m.setCoords();
  });
  canvas.renderAll();
  pushHistory();
}

/* ---- Zoom-to-fit / zoom-to-seleção: um botão só, contextual — ajusta pra caber a
   SELEÇÃO ativa se houver uma, senão a página inteira. Calcula a partir do espaço
   visível de #main (menos a .zoomrow e um respiro), não tenta centralizar o scroll
   (a composição de flexbox centralizado + scroll overflow de #main não dá pra
   resolver com uma conta simples de scrollLeft/Top sem arriscar errar em algum
   caso — o zoom certo já resolve a maior parte do uso real). */
function zoomToFit(){
  const main = document.getElementById('main');
  const zoomrow = document.querySelector('.zoomrow');
  const active = canvas.getActiveObject();
  let w = PAGE_W, h = PAGE_H;
  if (active && active!==cropRect){
    const r = active.getBoundingRect();
    w = r.width; h = r.height;
  }
  const PAD = 44;
  const availW = Math.max(100, main.clientWidth - PAD);
  const availH = Math.max(100, main.clientHeight - (zoomrow?zoomrow.offsetHeight:0) - PAD);
  const z = Math.max(0.05, Math.min(2, Math.min(availW/w, availH/h)));
  setZoom(z);
}

const NUDGE_STEP = 1, NUDGE_STEP_SHIFT = 10;
document.addEventListener('keydown', e=>{
  if (!document.getElementById('editorModal').hidden){
    if (e.key==='Escape') closeTextEditor();
    return; // editando texto no modal — não deixa nenhum outro atalho passar
  }
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (tag==='INPUT' || tag==='TEXTAREA' || tag==='SELECT') return;
  const obj = canvas.getActiveObject();
  if (e.key==='Delete' || e.key==='Backspace'){
    e.preventDefault(); deleteActiveSelection();
  } else if (e.ctrlKey && e.key.toLowerCase()==='d'){
    e.preventDefault(); duplicateActiveSelection();
  } else if (e.ctrlKey && e.key.toLowerCase()==='c'){
    e.preventDefault(); copyActiveSelection();
  } else if (e.ctrlKey && e.key.toLowerCase()==='v'){
    e.preventDefault(); pasteClipboard();
  } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='g'){
    e.preventDefault(); ungroupSelection();
  } else if (e.ctrlKey && e.key.toLowerCase()==='g'){
    e.preventDefault(); groupActiveSelection();
  } else if (e.ctrlKey && e.shiftKey && e.key===']'){
    e.preventDefault(); if (obj && !isLockedBase(obj)){ canvas.bringObjectToFront(obj); canvas.renderAll(); renderLayerList(); pushHistory(); }
  } else if (e.ctrlKey && e.shiftKey && e.key==='['){
    e.preventDefault(); if (obj && !isLockedBase(obj)){ canvas.sendObjectToBack(obj); canvas.renderAll(); renderLayerList(); pushHistory(); }
  } else if (e.ctrlKey && e.key===']'){
    e.preventDefault(); if (obj && !isLockedBase(obj)){ canvas.bringObjectForward(obj); canvas.renderAll(); renderLayerList(); pushHistory(); }
  } else if (e.ctrlKey && e.key==='['){
    e.preventDefault(); if (obj && !isLockedBase(obj)){ canvas.sendObjectBackwards(obj); canvas.renderAll(); renderLayerList(); pushHistory(); }
  } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='z'){
    e.preventDefault(); redo();
  } else if (e.ctrlKey && e.key.toLowerCase()==='z'){
    e.preventDefault(); undo();
  } else if (e.key==='Escape'){
    if (typeof __placingNetNode!=='undefined' && __placingNetNode){ e.preventDefault(); cancelPlaceNetNode(); }
    else if (obj){ e.preventDefault(); canvas.discardActiveObject(); canvas.renderAll(); updateInspector(); }
  } else if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
    if (obj && obj!==cropRect){
      e.preventDefault();
      const step = e.shiftKey ? NUDGE_STEP_SHIFT : NUDGE_STEP;
      const dx = e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0;
      const dy = e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;
      obj.set({left: obj.left+dx, top: obj.top+dy});
      obj.setCoords();
      canvas.renderAll();
      nudgeDirty = true; // histórico só é gravado UMA vez no keyup — segurar a seta não pode encher os 40 slots de desfazer com micro-passos
    }
  }
});
let nudgeDirty = false;
document.addEventListener('keyup', e=>{
  if (nudgeDirty && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
    nudgeDirty = false;
    pushHistory();
  }
});
document.getElementById('btnUndo').addEventListener('click', undo);
document.getElementById('btnRedo').addEventListener('click', redo);
document.getElementById('btnCropApply').addEventListener('click', applyCrop);
document.getElementById('btnCropCancel').addEventListener('click', ()=>{ cancelCrop(); canvas.renderAll(); });

/* ===================== Inspetor (painel do objeto selecionado) =====================
   FILTER_REGISTRY, PRESETS, labeledRange, renderFilterPanel etc vêm de filter-panel.js
   (compartilhado com image-lab.html). */
function updateInspector(){
  const obj = canvas.getActiveObject();
  const panel = document.getElementById('inspector');
  const body = document.getElementById('inspectorBody');
  renderLayerList();
  if (!obj || obj===cropRect){ panel.classList.remove('show'); body.innerHTML=''; return; }
  panel.classList.add('show');
  body.innerHTML = '';
  switchTab('object'); // seleção pula sozinho pra aba Objeto — não precisa rolar até achar

  if (obj.type==='activeselection'){
    renderMultiSelectInspector(obj, body);
    return;
  }

  if (obj.type==='newsbox'){
    renderNewsBoxInspector(obj, body);
  } else if (obj.type==='brandtext'){
    renderBrandTextInspector(obj, body);
  } else if (obj.type==='textbox' || obj.type==='handwrittentext' || obj.type==='redactedtext'){
    renderTextInspector(obj, body);
  } else if (obj.type==='emblem'){
    renderEmblemInspector(obj, body);
  } else if (obj.type==='wachat'){
    WA.inspector(obj, body);
  }
  if (obj.customType==='brandArt'){
    renderBrandArtInspector(obj, body);
  }
  if (obj.type==='image'){
    renderImageInspector(obj, body);
  }
  if (obj.customType==='background'){
    renderBackgroundInspector(obj, body);
  }
  if (obj.customType==='netNode' || obj.customType==='netLink'){
    renderNetworkInspector(obj, body);
  }
  if (obj.type==='group' && obj.__userGroup){
    body.appendChild(field.hint('Grupo de objetos.'));
    body.appendChild(field.button('📦 Desagrupar (Ctrl+Shift+G)', ungroupSelection));
  }
  renderLayerProps(obj, body);

  if (obj.customType!=='brandArt') body.appendChild(field.button('Duplicar', duplicateActiveSelection));
  if (!isLockedBase(obj)) body.appendChild(field.button('Excluir', deleteActiveSelection, {className:'danger'}));
}
/* Seleção múltipla (marquee/shift-click): os inspetores por tipo acima não fazem sentido
   pra um grupo heterogêneo de objetos — mostra só a contagem e as duas ações que fazem
   sentido em lote (duplicar/excluir todos), via os mesmos helpers que o teclado usa. */
function renderMultiSelectInspector(sel, body){
  const members = sel.getObjects();
  body.appendChild(field.hint(`${members.length} objetos selecionados.`));
  body.appendChild(field.button('📦 Agrupar (Ctrl+G)', groupActiveSelection));

  body.appendChild(field.hint('Alinhar:'));
  body.appendChild(field.buttonRow([
    field.button('← Esquerda', ()=>alignSelection('left')),
    field.button('↔ Centro', ()=>alignSelection('centerH')),
    field.button('→ Direita', ()=>alignSelection('right')),
  ], 'grid3'));
  body.appendChild(field.buttonRow([
    field.button('↑ Topo', ()=>alignSelection('top')),
    field.button('↕ Centro', ()=>alignSelection('centerV')),
    field.button('↓ Base', ()=>alignSelection('bottom')),
  ], 'grid3'));
  if (members.length>=3){
    body.appendChild(field.hint('Distribuir (precisa de 3+):'));
    body.appendChild(field.buttonRow([
      field.button('↔ Horizontal', ()=>distributeSelection('h')),
      field.button('↕ Vertical', ()=>distributeSelection('v')),
    ]));
  }

  body.appendChild(field.button('Duplicar todos', duplicateActiveSelection));
  body.appendChild(field.button('Excluir todos', deleteActiveSelection, {className:'danger'}));
}

function labeledRange(labelText, val, min, max, step, onInput){
  const wrap = document.createElement('div');
  const lab = document.createElement('label');
  const span = document.createElement('span'); span.className='rangeval'; span.textContent = (+val).toFixed(3);
  lab.textContent = labelText+' '; lab.appendChild(span);
  const input = document.createElement('input');
  input.type='range'; input.min=min; input.max=max; input.step=step; input.value=val;
  input.addEventListener('input', ()=>{ span.textContent=(+input.value).toFixed(3); onInput(+input.value); });
  wrap.appendChild(lab); wrap.appendChild(input);
  return wrap;
}

/* Opacidade + modo de mescla — genérico pra qualquer objeto selecionado (mancha
   e grunge já usam globalCompositeOperation internamente, mas nunca expunham
   slider pro usuário ajustar por conta própria). */
function renderLayerProps(obj, body){
  const details = document.createElement('details');
  const summary = document.createElement('summary'); summary.textContent = 'Opacidade / mescla'; summary.style.cursor='pointer'; summary.style.color='#9ea6b3'; summary.style.fontSize='11.5px'; summary.style.margin='6px 0 2px';
  details.appendChild(summary);
  details.appendChild(field.range('Opacidade', obj.opacity!=null?obj.opacity:1, 0, 1, 0.01, v=>{ obj.set('opacity', v); canvas.renderAll(); }));
  const blendOptions = ['source-over','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','difference','exclusion'].map(m=>({value:m, label:m}));
  details.appendChild(field.select('Modo de mescla', blendOptions, obj.globalCompositeOperation||'source-over', v=>{ obj.set('globalCompositeOperation', v); canvas.renderAll(); pushHistory(); }));
  body.appendChild(details);
}

function renderNewsBoxInspector(obj, body){
  body.appendChild(field.button('✎ Editar título e texto', ()=>openTextEditor(obj)));
  const frames = [{value:'box',label:'Moldura simples'},{value:'bar',label:'Faixa preta no título'},{value:'ad',label:'Anúncio (linha dupla)'},{value:'rules',label:'Só filetes'},{value:'none',label:'Sem moldura'}];
  body.appendChild(field.select('Estilo da caixa', frames, obj.frame, v=>{ obj.set('frame', v); canvas.renderAll(); pushHistory(); }));
  const nbFonts = DOC_FONTS.slice(); if (obj.bodyFont && !nbFonts.includes(obj.bodyFont)) nbFonts.unshift(obj.bodyFont);
  body.appendChild(field.select('Fonte do texto', nbFonts.map(f=>({value:f, label:f})), obj.bodyFont, v=>{ obj.set('bodyFont', v); canvas.renderAll(); pushHistory(); }));
  if (obj.title !== undefined && obj.frame !== 'none'){
    const tFonts = DOC_FONTS.slice(); if (obj.titleFont && !tFonts.includes(obj.titleFont)) tFonts.unshift(obj.titleFont);
    body.appendChild(field.select('Fonte do título', tFonts.map(f=>({value:f, label:f})), obj.titleFont, v=>{ obj.set('titleFont', v); canvas.renderAll(); pushHistory(); }));
  }
  body.appendChild(field.range('Tamanho do texto', obj.fontSize, 9, 40, 0.5, v=>{ obj.set('fontSize', v); canvas.renderAll(); }));
  body.appendChild(field.range('Entrelinha', obj.lineHeight, 1, 1.8, 0.02, v=>{ obj.set('lineHeight', v); canvas.renderAll(); }));
  body.appendChild(field.checkbox('Texto justificado', !!obj.justify, v=>{ obj.set('justify', v); canvas.renderAll(); pushHistory(); }));
  body.appendChild(field.checkbox('Texto em itálico', obj.bodyStyle==='italic', v=>{ obj.set('bodyStyle', v ? 'italic' : 'normal'); canvas.renderAll(); pushHistory(); }));
  body.appendChild(field.color('Cor da tinta', rgbToHex(obj.fill), v=>{ obj.set('fill', v); canvas.renderAll(); }));
  body.appendChild(field.hint('A altura segue o texto sozinha. Arraste as alças do meio (esquerda/direita) pra mudar a largura.'));
}
function renderTextInspector(obj, body){
  const editWrap = document.createElement('div');
  editWrap.appendChild(field.label('Texto'));
  editWrap.appendChild(field.button('✎ Abrir editor', ()=>openTextEditor(obj)));
  body.appendChild(editWrap);

  if (obj.type==='handwrittentext'){
    body.appendChild(field.select('Estilo de letra', HANDWRITING_PERSONA_LIST.map(p=>({value:p.id, label:p.label})), obj.personaId, v=>{ obj.personaId=v; canvas.renderAll(); }));
    body.appendChild(field.checkbox('Piora ao longo do texto', obj.fatigue, v=>{ obj.fatigue=v; canvas.renderAll(); }));
    body.appendChild(field.button('🎲 Novo aspecto', ()=>{ obj.seed = Math.floor(Math.random()*4294967296); canvas.renderAll(); }));
  } else {
    // Lista única de fontes (DOC_FONTS, doc-kit.js). Se o objeto usa uma fonte fora da lista, ela entra no topo.
    const fams = DOC_FONTS.map(f=>`'${f}'`);
    if (obj.fontFamily && !fams.includes(obj.fontFamily)) fams.unshift(obj.fontFamily);
    const fontOptions = fams.map(f=>({value:f, label:f.replace(/'/g,'')}));
    body.appendChild(field.select('Fonte', fontOptions, obj.fontFamily, v=>{ obj.set('fontFamily', v); canvas.renderAll(); pushHistory(); }));
    if (obj.type==='textbox'){
      body.appendChild(field.checkbox('Negrito', +obj.fontWeight>=600 || obj.fontWeight==='bold', v=>{ obj.set('fontWeight', v ? 700 : 400); canvas.renderAll(); pushHistory(); }));
      body.appendChild(field.checkbox('Itálico', obj.fontStyle==='italic', v=>{ obj.set('fontStyle', v ? 'italic' : 'normal'); canvas.renderAll(); pushHistory(); }));
    }
    body.appendChild(field.range('Tamanho', obj.fontSize, 8, 90, 1, v=>{ obj.set('fontSize', v); canvas.renderAll(); }));
    body.appendChild(field.color('Cor', rgbToHex(obj.fill), v=>{ obj.set('fill', v); canvas.renderAll(); }));
  }

  if (obj.type==='redactedtext'){
    body.appendChild(field.range('Censura (%)', obj.redactPct, 0, 85, 1, v=>{ obj.redactPct=v; canvas.renderAll(); }));
    body.appendChild(field.button('🎲 Nova censura', ()=>{ obj.seed = Math.floor(Math.random()*4294967296); canvas.renderAll(); }));
  }
}

function rgbToHex(c){
  if (!c) return '#000000';
  if (c[0]==='#') return c;
  const m = c.match(/\d+/g);
  if (!m) return '#000000';
  return '#'+m.slice(0,3).map(n=>(+n).toString(16).padStart(2,'0')).join('');
}

/* ===================== Recorte + espelhar (fotos) =====================
   Mesmo mecanismo de tools/image-lab.js: marquise fabric.Rect, cropX/cropY
   nativos do Fabric (não reencoda a imagem, só muda qual região é mostrada). */
let cropRect = null, cropTarget = null;
function startCrop(obj){
  if (!obj || obj.type!=='image'){ alert('Selecione uma foto primeiro.'); return; }
  if (Math.round(obj.angle||0)%360 !== 0){ alert('Endireite a foto (ângulo 0°) antes de recortar.'); return; }
  cancelCrop();
  cropTarget = obj;
  const bw = obj.getScaledWidth(), bh = obj.getScaledHeight();
  cropRect = new fabric.Rect({
    left: obj.left + bw*0.1, top: obj.top + bh*0.1,
    width: bw*0.8, height: bh*0.8,
    fill: 'rgba(61,98,147,0.15)', stroke:'#6d93c9', strokeWidth:1.5, strokeDashArray:[6,4],
    cornerColor:'#6d93c9', transparentCorners:false, lockRotation:true,
  });
  cropRect.setControlsVisibility({mtr:false});
  beginBatch();
  canvas.add(cropRect);
  endBatch();
  canvas.setActiveObject(cropRect);
  canvas.renderAll();
  const bar = document.getElementById('cropActions'); if (bar) bar.style.display='flex';
}
function applyCrop(){
  if (!cropRect || !cropTarget) return;
  const obj = cropTarget;
  const rectLeft = cropRect.left, rectTop = cropRect.top;
  const rectW = cropRect.getScaledWidth(), rectH = cropRect.getScaledHeight();
  const imgLeft = obj.left, imgTop = obj.top;
  const imgW = obj.getScaledWidth(), imgH = obj.getScaledHeight();
  const clLeft = Math.max(rectLeft, imgLeft), clTop = Math.max(rectTop, imgTop);
  const clRight = Math.min(rectLeft+rectW, imgLeft+imgW), clBottom = Math.min(rectTop+rectH, imgTop+imgH);
  const clW = Math.max(2, clRight-clLeft), clH = Math.max(2, clBottom-clTop);
  const relLeft = (clLeft-imgLeft)/obj.scaleX;
  const relTop = (clTop-imgTop)/obj.scaleY;
  obj.set({
    cropX: (obj.cropX||0)+relLeft, cropY: (obj.cropY||0)+relTop,
    width: clW/obj.scaleX, height: clH/obj.scaleY,
    left: clLeft, top: clTop,
  });
  obj.setCoords();
  const target = obj;
  cancelCrop();
  canvas.setActiveObject(target);
  canvas.renderAll();
  pushHistory();
  updateInspector();
}
function cancelCrop(){
  if (cropRect){
    beginBatch();
    canvas.remove(cropRect);
    endBatch();
  }
  cropRect = null; cropTarget = null;
  const bar = document.getElementById('cropActions'); if (bar) bar.style.display='none';
}
function flipSelected(obj, axis){
  if (!obj || obj===cropRect) return;
  if (axis==='h') obj.set('flipX', !obj.flipX); else obj.set('flipY', !obj.flipY);
  canvas.renderAll();
  pushHistory();
}

function renderImageInspector(obj, body){
  if (obj.customType==='photoPlaceholder' || obj.customType==='photo'){
    const swapWrap = document.createElement('div');
    swapWrap.appendChild(field.label('Trocar foto'));
    const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*';
    inp.addEventListener('change', (e)=>{
      const f = e.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = ev=>{
        fabric.Image.fromURL(ev.target.result).then(newImg=>{
          const filters = obj.filters;
          newImg.set({left:obj.left, top:obj.top, scaleX:obj.getScaledWidth()/newImg.width, scaleY:obj.getScaledHeight()/newImg.height, angle:obj.angle});
          newImg.filters = filters;
          newImg.applyFilters();
          newImg.set('customType', obj.customType==='photoPlaceholder'?'photo':obj.customType);
          if (obj.__labName) newImg.__labName = obj.__labName;
          if (obj.__newsRole){
            // foto de jornal: mantém o papel (role) e reencaixa na caixa (cover), senão o rebuild perde a foto
            newImg.__newsRole = obj.__newsRole; newImg.__newsGenerated = obj.__newsGenerated;
            newImg.set('globalCompositeOperation', obj.globalCompositeOperation);
            newsFitCover(newImg, obj.left, obj.top, obj.getScaledWidth(), obj.getScaledHeight());
          }
          applyPhotoCornerRadius(newImg, obj.__cornerRadiusPx||0);
          const idx = canvas.getObjects().indexOf(obj);
          canvas.remove(obj);
          canvas.insertAt(idx, newImg);
          canvas.setActiveObject(newImg);
          canvas.renderAll();
          updateInspector();
        });
      };
      reader.readAsDataURL(f);
    });
    swapWrap.appendChild(inp);
    body.appendChild(swapWrap);

    body.appendChild(field.buttonRow([
      field.button('▧ Recortar', ()=>startCrop(obj)),
      field.button('⇋ Espelhar H', ()=>flipSelected(obj,'h')),
    ]));
    body.appendChild(field.button('⇵ Espelhar V', ()=>flipSelected(obj,'v')));

    body.appendChild(field.hint('Moldura / overlay:'));
    // Sem pushHistory() explícito aqui de propósito: addPolaroidFrame/addCCTVHud/addVHSBars
    // chamam canvas.add(group) por dentro, que já dispara o listener object:added (uma
    // chamada extra aqui duplicava o histórico — um Ctrl+Z não desfazia, precisava de dois).
    // Bloom/Grunge (acima) já estavam certos; só esses três tinham o bug.
    body.appendChild(field.buttonRow([
      field.button('🖼 Polaroid', ()=>addPolaroidFrame(canvas, obj)),
      field.button('📹 HUD CCTV', ()=>addCCTVHud(canvas, obj)),
    ]));
    body.appendChild(field.button('▬ Barras VHS', ()=>addVHSBars(canvas, obj)));
  }

  const filterPanelHost = document.createElement('div');
  body.appendChild(filterPanelHost);
  renderFilterPanel(canvas, obj, filterPanelHost, pushHistory);
  // Solta-de-slider e o <select> de adicionar filtro disparam 'change' nativo — pega por
  // delegação aqui (mesmo padrão que image-lab.js já tinha). Ações de botão puro (preset/
  // reroll/remover/reordenar) usam o onCommit explícito passado acima, já que um <button
  // click> nunca dispara 'change'. Sem nenhum dos dois, editor.js não tinha undo pra
  // filtro algum (bug real, confirmado lendo o código antes desta correção).
  filterPanelHost.addEventListener('change', ()=>pushHistory());

  body.appendChild(field.button('🪨 Adicionar camada de sujeira', applyGrungeOverlay));
  body.appendChild(field.button('✨ Aplicar glow/bloom (nesta imagem)', applyBloomToSelected));
}

function renderNetworkInspector(obj, body){
  if (obj.customType==='netLink'){
    body.appendChild(field.checkbox('Linha tracejada (backup/baixa banda)', !!obj.strokeDashArray, v=>{ obj.set('strokeDashArray', v ? [4,3] : null); canvas.renderAll(); pushHistory(); }));
    body.appendChild(field.color('Cor', rgbToHex(obj.stroke), v=>{ obj.set('stroke', v); canvas.renderAll(); }));
    body.appendChild(field.hint('Ligação entre dois nós — some sozinha se um dos dois for apagado.'));
    return;
  }
  // obj é o Group (caixa+rótulo+acento) — a cor em si está no filho da caixa, não no grupo.
  const box = obj.getObjects().find(o=>o.customType==='netNodeBox');
  body.appendChild(field.color('Cor da borda', rgbToHex(box.stroke), v=>{ box.set('stroke', v); canvas.renderAll(); }));
  body.appendChild(field.hint('Arraste pra mover/redimensionar. Duplo clique no rótulo edita. Arraste do pontinho laranja na borda direita até outro nó pra ligar.'));
}
function renderBackgroundInspector(obj, body){
  body.appendChild(field.hint('Papel de fundo'));
  if (obj.type==='paperbackground'){
    body.appendChild(field.hint('Papel procedural: tipo, intensidade, dobra e atmosfera ficam no bloco "Papel" da aba Documento. Manchas e carimbos: aba Adicionar.'));
    return;
  }

  const CAT_LABELS = {paper_aged:'Envelhecido', paper_notebook_ruled:'Caderno pautado', paper_notebook_plain:'Caderno liso', paper_newsprint:'Jornal'};
  const catOptions = Object.keys(CAT_LABELS).map(c=>({value:c, label:CAT_LABELS[c]}));
  const catValue = (currentBgCategory && CAT_LABELS[currentBgCategory]) ? currentBgCategory : catOptions[0].value;
  const catField = field.select('Categoria', catOptions, catValue, ()=>{});
  body.appendChild(catField);
  body.appendChild(field.button('🎲 Trocar papel', async ()=>{
    // Busca por TIPO, não por índice — obj.filters[0] assumia que AgeTint é sempre o
    // primeiro filtro da pilha, o que quebra se a ordem mudar (agora reordenável, Fase 4).
    const ageFilter = (obj.filters||[]).find(f=>f.constructor.type==='AgeTint');
    const age = (ageFilter && ageFilter.amount) || 0.4;
    await setTemplateBackground(catField.__input.value, {age});
    canvas.renderAll(); updateInspector();
  }));
  // "Idade do papel" não tem slider próprio aqui de propósito — obj.type==='image'
  // já faz updateInspector chamar renderImageInspector ANTES desta função (o fundo
  // é ao mesmo tempo type:'image' e customType:'background'), que já desenha um
  // slider de "Idade do papel" pra esse mesmo AgeTintFilter via renderFilterPanel.
  // Ter os dois era bug cosmético confirmado (dois controles pro mesmo valor).

  body.appendChild(field.hint('Adicionar mancha:'));
  body.appendChild(field.buttonRow([
    field.button('Água', ()=>addStain('water')),
    field.button('Café', ()=>addStain('coffee')),
    field.button('Sangue', ()=>addStain('blood')),
    field.button('Mofo', ()=>addStain('mold')),
  ], 'toolgrid'));
}

/* ===================== Exportar texto (pra editar fora, tipo Google Docs) =====================
   Pedido do Max: poder editar o TEXTO de um documento num editor de verdade (Google Docs)
   sem a ferramenta de Props deixar de ser a ferramenta principal — só de mão única por
   enquanto (baixa um .txt, ele sobe/abre onde quiser e cola de volta na mão depois).
   Considerei integrar direto com a API do Google Docs, mas isso pediria o Max criar um
   projeto no Google Cloud e autorizar a ferramenta a cada uso (props-generator é uma
   página estática, sem servidor — não dá pra guardar credencial nenhuma) só pra um recurso
   que na prática só precisa TIRAR o texto de dentro. Um .txt bem organizado resolve o
   mesmo problema sem esse custo: o Google Drive já abre/converte .txt direto.
   `objOrJson` aceita tanto objetos Fabric AO VIVO (página atual) quanto o array de objetos
   já serializado em JSON (páginas/lados salvos, não ao vivo) — os dois têm `.text` nos nós
   de texto e, pra Group, `.getObjects()` (ao vivo) ou `.objects` (JSON) com os filhos. */
function extractTextEntries(objOrJsonList){
  const out = [];
  (objOrJsonList||[]).forEach(o=>{
    const children = typeof o.getObjects === 'function' ? o.getObjects() : o.objects;
    if (Array.isArray(children)){ out.push(...extractTextEntries(children)); return; }
    if (typeof o.text === 'string' && o.text.trim()){
      // customType (string minha, tipo 'stampText') não muda de caixa entre ao-vivo e JSON.
      // o `type` nativo do Fabric muda: toObject() serializa this.constructor.type (ex.
      // "Textbox", maiúsculo original — confirmado no fonte vendorizado), mas o getter .type
      // de um objeto AO VIVO devolve minúsculo. Sem normalizar, o mesmo texto virava duas
      // chaves diferentes ("Textbox" vs "textbox") dependendo de qual página/lado veio.
      const type = o.customType || (o.type||'').toLowerCase();
      out.push({type, text: o.text});
      if (o.title && String(o.title).trim()) out.push({type:'newsboxTitle', text:String(o.title)});
    }
  });
  return out;
}
const TEXT_ENTRY_LABELS = {
  // customType próprio (brandText, stampText, ...) preserva a caixa exata que o resto do
  // código já usa (confirmado em brand.js/handwriting.js/network-diagram.js) — já o `type`
  // nativo do Fabric (textbox, handwrittentext, redactedtext) chega sempre minúsculo aqui
  // porque extractTextEntries já normaliza isso antes de guardar.
  textbox: 'Texto', newsbox: 'Caixa de jornal', newsboxTitle: 'Título da caixa', handwrittentext: 'Texto manuscrito', redactedtext: 'Texto censurado',
  brandText: 'Campo do documento', stampText: 'Carimbo', polaroidCaption: 'Legenda Polaroid',
  cctvHudText: 'HUD câmera', netNodeLabel: 'Rótulo do nó de rede', watermark: "Marca d'água",
};
function textEntryLabel(type){ return TEXT_ENTRY_LABELS[type] || type; }
function downloadTextSections(docName, sections){
  let out = `${docName}\n${'='.repeat(docName.length)}\n`;
  sections.forEach(sec=>{
    out += `\n--- ${sec.label} ---\n\n`;
    if (!sec.entries.length){ out += '(sem texto nesta página)\n'; return; }
    sec.entries.forEach(e=>{ out += `[${textEntryLabel(e.type)}]\n${e.text}\n\n`; });
  });
  const blob = new Blob([out], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${docName.replace(/[^a-z0-9_-]/gi,'_')}_texto_${Date.now()}.txt`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function exportTextForDocs(){
  canvas.discardActiveObject();
  const sections = PAGES.length
    ? PAGES.map((p, i)=>({label: `Página ${i+1}`, entries: extractTextEntries(i===curPageIdx ? canvas.getObjects() : (p.json ? p.json.objects : []))}))
    : [{label: 'Documento', entries: extractTextEntries(canvas.getObjects())}];
  downloadTextSections(currentTemplate, sections);
}

/* ===================== Exportar ===================== */
/* Lista de modelos: o <select> do HTML traz os modelos antigos; os do registry (doc-templates.js)
   entram com o rótulo deles, na ordem de TEMPLATE_ORDER (os que ainda não migraram ficam como estão). */
function populateTemplateSelect(){
  const sel = document.getElementById('templateSel');
  if (!sel || typeof DOC_TEMPLATES==='undefined' || typeof TEMPLATE_ORDER==='undefined') return;
  const legacy = {};
  [...sel.options].forEach(o=>{ legacy[o.value] = o.textContent; });
  const keep = sel.value;
  sel.innerHTML = '';
  TEMPLATE_ORDER.forEach(id=>{
    const label = (DOC_TEMPLATES[id] && DOC_TEMPLATES[id].label) || legacy[id];
    if (!label) return;
    const o = document.createElement('option'); o.value = id; o.textContent = label; sel.appendChild(o);
  });
  if ([...sel.options].some(o=>o.value===keep)) sel.value = keep;
}
function exportPaperModeValue(){ const s = document.getElementById('exportPaperMode'); return s ? s.value : 'textura'; }
document.getElementById('btnExport').addEventListener('click', ()=>{
  const mult = +document.getElementById('exportScale').value;
  canvas.discardActiveObject(); canvas.renderAll();
  let dataUrl = paperWithExportMode(exportPaperModeValue(), ()=>canvas.toDataURL({format:'png', multiplier: mult/canvas.getZoom()}));
  dataUrl = pngWithDpi(dataUrl, getExportDpi(PAGE_W*mult));
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `prop_${currentTemplate.replace(/[^a-z0-9_-]/gi,'_')}_${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});
document.getElementById('btnExportPDF').addEventListener('click', ()=>exportPagesPDF().catch(e=>alert(e.message)));
document.getElementById('btnExportText').addEventListener('click', exportTextForDocs);

/* ===================== Init ===================== */
document.fonts.ready.then(()=>{
  switchTab('doc');
  populateTemplateSelect();
  initPaperUI();
  initCanvas();
  loadTemplate('newspaper');
});
