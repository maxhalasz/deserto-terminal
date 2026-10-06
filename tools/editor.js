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
const HISTORY_PROPS = ['customType','__paperFile','personaId','fatigue','seed','redactPct','__newsGenerated','__labName','__oid','__ownerOid','__cornerRadiusPx','__linkA','__linkB','__stampOptions'];
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

/* Reconstrói só a parte do jornal gerada pelo motor de layout (customType
   'newspaperPart'), preservando qualquer outro objeto que o Max tenha adicionado
   à mão (o fundo de papel nunca é tocado). Usado pelos presets/controles de coluna. */
async function rebuildNewspaperLayout(){
  if (!currentNewsContent || !currentNewsLayout) return;
  beginBatch(); // troca de preset é UMA ação do usuário, não N pushes por objeto removido/adicionado
  try {
    canvas.getObjects().filter(o=>o.__newsGenerated).forEach(o=>canvas.remove(o));
    const objs = await buildNewspaperObjects(currentNewsContent, currentNewsLayout);
    objs.forEach(o=>canvas.add(o));
    canvas.renderAll();
    renderLayerList();
  } finally { endBatch(); }
  pushHistory();
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
function isModalText(o){ return o.type==='textbox' || o.type==='handwrittentext' || o.type==='redactedtext' || o.type==='brandtext' || o.type==='itext'; }
function isLockedBase(o){ return o.customType==='background' || o.customType==='brandArt'; }

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
document.querySelectorAll('.zoomrow button').forEach(b=>{
  b.addEventListener('click', ()=>setZoom(+b.dataset.z));
});

/* ---- tamanho de página por template: cada formato de documento tem sua
   proporção física real (folha A4 retrato, página dupla de livro aberto em
   paisagem, tela de terminal 4:3, cartão de crachá) em vez de um canvas único
   pra tudo. PAGE_W/PAGE_H (layout.js) são lidos no momento do uso em todo o
   resto do código, então só trocar o valor e re-aplicar o zoom já propaga. ---- */
const PAGE_SIZES = {
  newspaper:[1240,1754], report:[1240,1754], note:[1240,1754], redacted:[1240,1754],
  tag:[1240,1754], letter:[1240,1754], blank:[1240,1754],
  diary:[2480,1754],   // duas páginas retrato lado a lado — proporção real de livro aberto
  terminal:[1600,1200], // paisagem 4:3, proporção de tela CRT
  badge:[860,540],      // cartão de crachá, ~1.6:1
  whatsapp:[1080,2220], email_mobile:[1080,2220], // print de celular, proporção ~19.5:9
  email_desktop:[1600,1000], // tela de computador, paisagem 16:10
  email_90s:[1200,900],      // monitor CRT 4:3 (era do Outlook Express)
  menu_fine:[1240,1754], menu_diner:[1240,1754], menu_fastfood:[1240,1754], // A4 retrato, mesma folha dos outros impressos
};
// Templates que são print de tela (sem papel físico algum) — nascem no modo Digital,
// igual ao crachá, mas por um motivo diferente: não existe versão "fotografada" possível.
const DIGITAL_SCREEN_TEMPLATES = ['badge','whatsapp','email_mobile','email_desktop','email_90s','menu_fastfood'];
// Cor(es) do fundo liso de cada print de tela (buildFlatScreenBg) — fonte única usada tanto
// por loadTemplateBody (primeira página) quanto por pageAdd (páginas extras do mesmo doc),
// pro mesmo motivo que 'terminal'/'digital' já precisavam de um caso especial ali: sem isso
// uma página nova nesses templates nasceria sem fundo nenhum (nenhuma das 3 condições que
// pageAdd já checava — terminal, digital com categoria, papel com categoria — bateria).
const FLAT_SCREEN_BG = {
  whatsapp:['#ECE5DD'], email_mobile:['#ffffff'], email_desktop:['#ffffff'], email_90s:['#c0c0c0'],
  menu_fastfood:['#d41c1c','#a81414'],
};
/* Arimo/Source Sans 3/Oswald são fontes NOVAS nesse arquivo — nenhum template antigo
   (newspaper/report/badge/...) as usa, então nenhuma delas é "esquentada" pelo
   loadTemplate('newspaper') do carregamento inicial (document.fonts.ready, fim do
   arquivo). Mesmo bug que brand.js já tinha resolvido (ver brandEnsureFonts lá): o
   navegador só baixa um @font-face quando alguém pede pra desenhar texto nele, e
   canvas não redesenha sozinho quando a fonte termina de chegar depois — sem esperar
   aqui, o PRIMEIRO documento desses sai com a fonte reserva do sistema (confirmado ao
   vivo: cardápio "diner" saiu em serifada em vez de Oswald condensada na primeira carga).
*/
const SCREEN_TEMPLATE_FONTS = [
  "400 16px 'Arimo'", "700 16px 'Arimo'",
  "400 16px 'Source Sans 3'", "italic 400 16px 'Source Sans 3'",
  "500 16px 'Oswald'", "700 16px 'Oswald'",
];
let _screenFontsReady = null;
function ensureScreenTemplateFonts(){
  if (!_screenFontsReady){
    _screenFontsReady = Promise.all(SCREEN_TEMPLATE_FONTS.map(s=>document.fonts.load(s, 'AaØøÅåÆæ0123456789—·×').catch(()=>{})));
  }
  return _screenFontsReady;
}
function applyPageSize(name){
  const [w,h] = PAGE_SIZES[name] || PAGE_SIZES.blank;
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
      if (old) canvas.remove(old);
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

/* ---- fundo digital: sem foto, sem envelhecimento/dobra/pauta — um documento
   "renderizado" em vez de fotografado (pedido do Max pro crachá: "ao invés de
   usar uma textura pro cartão de acesso, faz ele digital", generalizado num
   alternador Texturizado/Digital pra qualquer template). Degradê frio + grade
   fina (linguagem visual azul-clínica já estabelecida no estacao.html/NeuroStat)
   em vez de papel real — os carimbos/fotos/composites por cima continuam
   texturizados nos dois modos, porque não dependem do fundo pra nada. */
function setDigitalBackground(opts){
  opts = opts || {};
  const old = canvas.getObjects().find(o=>o.customType==='background');
  if (old) canvas.remove(old);
  const c = document.createElement('canvas'); c.width=PAGE_W; c.height=PAGE_H;
  const ctx = c.getContext('2d');
  const grd = ctx.createLinearGradient(0,0,PAGE_W,PAGE_H);
  grd.addColorStop(0, opts.color1||'#eef2f7');
  grd.addColorStop(1, opts.color2||'#dbe2ec');
  ctx.fillStyle = grd; ctx.fillRect(0,0,PAGE_W,PAGE_H);
  ctx.strokeStyle = 'rgba(20,40,70,0.05)'; ctx.lineWidth = 1;
  for (let x=0; x<PAGE_W; x+=40){ ctx.beginPath(); ctx.moveTo(x+0.5,0); ctx.lineTo(x+0.5,PAGE_H); ctx.stroke(); }
  for (let y=0; y<PAGE_H; y+=40){ ctx.beginPath(); ctx.moveTo(0,y+0.5); ctx.lineTo(PAGE_W,y+0.5); ctx.stroke(); }
  return fabric.Image.fromURL(c.toDataURL()).then(img=>{
    img.set({left:0, top:0, selectable:false, evented:true, hoverCursor:'pointer'});
    img.set('customType','background');
    img.__paperFile = null;
    canvas.add(img);
    canvas.sendObjectToBack(img);
    currentFoldField = null; currentRuledLines = null;
    return img;
  });
}

/* ---- alternador Texturizado/Digital: cada template guarda a CATEGORIA de papel
   (não o arquivo exato) que usaria se estivesse texturizado, então trocar o modo
   depois de já ter conteúdo no documento só troca o fundo — não regenera o resto
   (loadTemplateBody inteiro apagaria edições do Max). ---- */
let bgMode = 'textured';
let currentBgCategory = null, currentBgOpts = null;
function setTemplateBackground(category, opts){
  currentBgCategory = category; currentBgOpts = opts||{};
  if (bgMode === 'digital') return setDigitalBackground(currentBgOpts);
  const rng = mulberry32(Math.floor(Math.random()*4294967296));
  return setBackgroundPaper(pickFile(category, rng), currentBgOpts);
}
function updateBgModeUI(){
  document.querySelectorAll('.bgModeBtn').forEach(b=>b.classList.toggle('active', b.dataset.bgmode===bgMode));
}
function setBgMode(mode){
  if (mode===bgMode){ updateBgModeUI(); return; }
  bgMode = mode;
  updateBgModeUI();
  if (!currentBgCategory) return; // documento ainda não tem fundo de papel (ex: terminal)
  beginBatch();
  Promise.resolve(setTemplateBackground(currentBgCategory, currentBgOpts)).then(()=>{
    canvas.renderAll();
  }).finally(()=>{
    endBatch();
    pushHistory();
  });
}
document.querySelectorAll('.bgModeBtn').forEach(b=>{
  b.addEventListener('click', ()=>setBgMode(b.dataset.bgmode));
});

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
function addStain(type){
  const rng = mulberry32(Math.floor(Math.random()*4294967296));
  // Café e sangue agora têm foto dedicada de verdade (já na cor certa, sem precisar
  // de tinta por cima) — mistura com o pool genérico tingido pra manter diversidade
  // de formato em vez de repetir sempre a mesma mancha.
  const dedicatedCat = type==='coffee' ? 'stain_coffee' : type==='blood' ? 'stain_blood' : null;
  const useDedicated = dedicatedCat && TEX_CATS[dedicatedCat] && TEX_CATS[dedicatedCat].length && rng()<0.5;
  const cat = type==='mold' ? 'stain_mold' : useDedicated ? dedicatedCat : 'stain_shape';
  const fname = pickFile(cat, rng);
  const tint = (cat==='stain_shape') ? (STAIN_TINT[type] || null) : null;
  const imgEl = new Image();
  imgEl.onload = ()=>{
    const url = makeFeatheredStainURL(imgEl, tint, Math.floor(rng()*4294967296));
    fabric.Image.fromURL(url).then(img=>{
      const s = 160+rng()*260;
      img.set({
        left: PAGE_W*0.15+rng()*PAGE_W*0.7, top: PAGE_H*0.15+rng()*PAGE_H*0.7,
        scaleX: s/img.width, scaleY: s/img.height,
        angle: rng()*360, flipX: rng()<0.5, flipY: rng()<0.5,
        globalCompositeOperation:'multiply', opacity: 0.55+rng()*0.3,
        originX:'center', originY:'center',
      });
      img.set('customType','stain');
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  };
  imgEl.src = TEXTURE_PACK[fname];
}

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

/* Extraído do template "terminal" pra ser reaproveitado por pageAdd (uma página nova no
   mesmo documento precisa do mesmo "monitor" de fundo, sem repetir o log de texto —
   esse cada página escreve o seu). */
async function buildTerminalScreenBg(){
  currentFoldField = null; currentRuledLines = null;
  const screenC = document.createElement('canvas'); screenC.width=PAGE_W; screenC.height=PAGE_H;
  screenC.getContext('2d').fillStyle = '#0a1512';
  screenC.getContext('2d').fillRect(0,0,PAGE_W,PAGE_H);
  const screen = await fabric.Image.fromURL(screenC.toDataURL());
  screen.set({left:0, top:0, selectable:false, evented:true, hoverCursor:'pointer'});
  screen.filters = [new ScanlinesFilter({intensity:0.35, density:1400}), new VignetteFilter({amount:0.55, inner:0.2})];
  screen.applyFilters();
  screen.set('customType','background');
  canvas.add(screen);
}

/* Fundo liso (cor sólida ou degradê) pra prints de tela/app — mesma técnica de
   buildTerminalScreenBg (desenha num canvas solto, vira fabric.Image, customType
   'background') mas SEM a grade clínica azulada do setDigitalBackground: aquela
   grade é a linguagem visual específica da NeuroStat/estacao.html, não faz sentido
   atrás de um app de chat ou menu de fast-food. */
async function buildFlatScreenBg(color1, color2){
  currentFoldField = null; currentRuledLines = null;
  const c = document.createElement('canvas'); c.width=PAGE_W; c.height=PAGE_H;
  const ctx = c.getContext('2d');
  if (color2){
    const grd = ctx.createLinearGradient(0,0,0,PAGE_H);
    grd.addColorStop(0,color1); grd.addColorStop(1,color2);
    ctx.fillStyle = grd;
  } else ctx.fillStyle = color1;
  ctx.fillRect(0,0,PAGE_W,PAGE_H);
  const bg = await fabric.Image.fromURL(c.toDataURL());
  bg.set({left:0, top:0, selectable:false, evented:true, hoverCursor:'pointer'});
  bg.set('customType','background');
  canvas.add(bg);
  return bg;
}
/* Barra de status de celular (hora + sinal + bateria) — reaproveitada pelo print de
   WhatsApp e pelo print de e-mail no celular, os dois "screenshot de telefone". Ícones
   são formas Fabric simples (Rects), não glifos de fonte — ficam nítidos em qualquer
   tamanho de export, sem depender de uma fonte de ícone carregada. */
function buildPhoneStatusBar(fg){
  fg = fg || '#111111';
  const time = new fabric.Textbox('9:41', {left:56, top:28, width:200, fontFamily:"'Arimo'", fontWeight:700, fontSize:32, fill:fg});
  const bars = [0,1,2,3].map(i=> new fabric.Rect({left:PAGE_W-224+i*20, top:52-i*7, width:11, height:13+i*7, rx:2, ry:2, fill:fg}));
  const battBody = new fabric.Rect({left:PAGE_W-110, top:32, width:66, height:30, rx:7, ry:7, fill:'transparent', stroke:fg, strokeWidth:3});
  const battTip = new fabric.Rect({left:PAGE_W-42, top:40, width:6, height:14, rx:2, ry:2, fill:fg});
  const battFill = new fabric.Rect({left:PAGE_W-104, top:38, width:54, height:18, rx:3, ry:3, fill:fg});
  return [time, ...bars, battBody, battTip, battFill];
}
/* Par nome+preço alinhado (nome na margem esquerda, preço na direita) — usado pelos
   dois cardápios de papel (fine dining e galley); o de fast-food usa caixas de combo
   em vez de linha, então não reaproveita essa função. */
function menuRow(name, price, left, top, width, opts){
  opts = opts||{};
  const nameBox = new fabric.Textbox(name, {left, top, width:width-160, fontFamily:opts.fontFamily||"'PT Serif'", fontSize:opts.fontSize||22, fill:opts.fill||'#141414', lineHeight:1.3});
  const priceBox = new fabric.Textbox(price, {left:left+width-150, top, width:150, originX:'left', textAlign:'right', fontFamily:opts.fontFamily||"'PT Serif'", fontWeight:700, fontSize:opts.fontSize||22, fill:opts.fill||'#141414'});
  return [nameBox, priceBox];
}

async function loadTemplate(name){
  return withSceneLock(async ()=>{
    if (typeof brandOnLeave==='function') brandOnLeave(); // sai do modo "documento de marca" (frente/verso)
    currentTemplate = name;
    await sceneSwitchTo({}, { buildFresh: ()=>loadTemplateBody(name) });
    PAGES = [pageSnapshot()];
    curPageIdx = 0;
    updatePageNavUI();
  });
}
/* clearDoc() não roda mais aqui dentro — o único chamador (loadTemplate, acima) já passa
   por sceneSwitchTo, que limpa o canvas antes de chamar buildFresh. */
async function loadTemplateBody(name){
  applyPageSize(name);
  const rng = mulberry32(Math.floor(Math.random()*4294967296));
  // Crachá é digital por padrão (pedido do Max: "ao invés de usar uma textura pro
  // cartão de acesso, faz ele digital") — os outros mantêm o comportamento antigo
  // (papel fotografado), mas o alternador continua disponível pros dois lados.
  bgMode = (DIGITAL_SCREEN_TEMPLATES.includes(name)) ? 'digital' : 'textured';
  currentBgCategory = null; currentBgOpts = null; // reseta pra não sobrar categoria do template anterior (ex: 'terminal' não usa papel algum)
  updateBgModeUI();
  if (FLAT_SCREEN_BG[name] || name==='menu_diner' || name==='menu_fastfood') await ensureScreenTemplateFonts();

  if (name==='blank'){
    await setTemplateBackground('paper_aged');
    canvas.renderAll(); renderLayerList(); return;
  }

  if (name==='newspaper'){
    await setTemplateBackground('paper_newsprint');
    const content = {
      orgao: 'THE ABYSSAL POST',
      data: 'MARCH 14 — EDITION NO. 118',
      kicker: '',
      headline: 'PLATFORM LOSES CONTACT WITH DIVE TEAM',
      subhead: 'Radio still transmitting static on the same channel since 03:12',
      byline: 'STAFF REPORT',
      body: 'The dive team failed to return to the deck yesterday morning. Contact with base was lost at 03:12, according to night-shift logs.\n\nNo bodies have been recovered. The company operating the platform declined to comment on the incident.\n\nCoastal residents report hearing a continuous sound coming from the sea overnight, described as "a low choir, almost a breathing."\n\nDrilling operations continue as normal, according to an internal memo. Independent experts have questioned the official account.',
      photo: 'The platform, photographed on a clear day. No rescue team was dispatched to the site.',
      pullquoteText: '', sidebarTitle: '', sidebarText: '',
      gothic: true,
    };
    currentNewsContent = content;
    currentNewsLayout = JSON.parse(JSON.stringify(NEWS_PRESETS.p2));
    const objs = await buildNewspaperObjects(content, currentNewsLayout);
    objs.forEach(o=>canvas.add(o));
  }
  else if (name==='report'){
    await setTemplateBackground('paper_aged');
    const head = new fabric.Textbox('CONFIDENTIAL — INTERNAL USE ONLY\nNEUROSTAT — FIELD DIVISION\nREF: NS-DES-0447\nDATE: 03/14', {left:90, top:90, width:500, fontFamily:"'Courier Prime'", fontWeight:700, fontSize:14, fill:'#141414', lineHeight:1.5});
    const body = new RedactedText('INCIDENT REPORT — NIGHT SHIFT\n\nAt 03:12 radio contact with the dive team was lost. The last recorded transmission consisted of broadband noise, no identifiable verbal content.\n\nSurface crew not authorized to descend without direct order from supervision.', {left:90, top:220, width:PAGE_W-180, redactPct:0, fontSize:16});
    const stamp = makeStampObjects('CONFIDENTIAL', {left:PAGE_W-220, top:150, angle:-10, color:'#7a2020'});
    const sig = new HandwrittenText('M. Holt', {left:90, top:620, width:260, personaId:'C', fontSize:26});
    [head, body, stamp, sig].forEach(o=>canvas.add(o));
  }
  else if (name==='note'){
    await setTemplateBackground('paper_notebook_ruled', {age:0.3});
    const body = new HandwrittenText("if you find this\n\ndon't go down\n\nthe radio won't stop but there's no one talking\n\ni saw something near the moonpool yesterday and i'm not going to describe it\n\nstay in the machine room, lock the door", {left:110, top:220, width:PAGE_W-260, personaId:'A', fontSize:30, fatigue:true});
    canvas.add(body);
  }
  else if (name==='redacted'){
    await setTemplateBackground('paper_aged');
    const band = new fabric.Rect({left:66, top:70, width:PAGE_W-132, height:34, fill:'#101010'});
    const bandTxt = new fabric.Textbox('RESTRICTED — DO NOT DISTRIBUTE', {left:PAGE_W/2, top:78, originX:'center', width:900, fontFamily:"'Courier Prime'", fontWeight:700, fontSize:15, fill:'#e6e2d8', textAlign:'center'});
    const head = new fabric.Textbox('NEUROSTAT\nCASE NO. 0447-D', {left:90, top:130, width:500, fontFamily:"'Courier Prime'", fontWeight:700, fontSize:15, fill:'#141414', lineHeight:1.4});
    const body = new RedactedText('Subject was located near the coral formation. State of consciousness unknown. Immediate containment and notification of leadership recommended.\n\nThe identified sound pattern does not match any catalog known to the division. Preliminary analysis suggests uncatalogued biological origin.', {left:90, top:220, width:PAGE_W-180, redactPct:28, fontSize:16});
    const stamp = makeStampObjects('CLASSIFIED', {left:PAGE_W/2, top:PAGE_H/2+150, angle:-18, color:'rgba(150,20,20,0.85)', fontSize:44});
    [band, bandTxt, head, body, stamp].forEach(o=>canvas.add(o));
  }
  else if (name==='tag'){
    await setTemplateBackground('paper_aged');
    const border = new fabric.Rect({left:80, top:80, width:PAGE_W-160, height:PAGE_H-160-260, fill:'transparent', stroke:'#141414', strokeWidth:4});
    const org = new fabric.Textbox('NEUROSTAT', {left:PAGE_W/2, top:130, originX:'center', width:600, fontFamily:"'Courier Prime'", fontWeight:700, fontSize:22, fill:'#141414', textAlign:'center'});
    const title = new fabric.Textbox('EVIDENCE — DO NOT REMOVE', {left:PAGE_W/2, top:180, originX:'center', width:700, fontFamily:"'Playfair Display'", fontWeight:900, fontSize:30, fill:'#141414', textAlign:'center'});
    const ref = new fabric.Textbox('CASE 0447 / ITEM 12\nDATE: 03/14', {left:120, top:260, width:500, fontFamily:"'Courier Prime'", fontSize:16, fill:'#141414', lineHeight:1.5});
    const obs = new fabric.Textbox('Recovered from lower deck. Smell of brackish water. Handle with gloves.', {left:120, top:340, width:PAGE_W-240, fontFamily:"'Courier Prime'", fontSize:14, fill:'#141414', lineHeight:1.4});
    const barcode = await makeBarcodeImage({left:120, top:560, width:400, seed:Math.floor(rng()*1e9)});
    barcode.scaleToWidth(400);
    [border, org, title, ref, obs, barcode].forEach(o=>canvas.add(o));
  }
  else if (name==='diary'){
    // Página dupla: paper_aged_2/3.jpg são fotos de livro ABERTO (lombada visível
    // no meio) que saíram do pool comum por causa exatamente disso — aqui a
    // lombada é a feature. Canvas em paisagem (applyPageSize já trocou pra
    // 2480×1754 — duas páginas de 1240 de largura lado a lado, a lombada cai
    // bem no meio, em x=1240). Dois blocos de texto, um por página, com margem
    // suficiente pra não cruzar por cima dela.
    await setTemplateBackground('paper_aged_bookspread', {age:0.35});
    const leftEntry = new HandwrittenText(
      "MARCH 09\n\nCrew rotation finished. Everyone settled in fine, no complaints. Weather held.\n\nRan the weekly radio check at 0600, channel clear both ways. Standard.\n\nOff to bed early tonight.",
      {left:90, top:180, width:1000, personaId:'G', fontSize:26, fatigue:false}
    );
    const rightEntry = new HandwrittenText(
      "MARCH 13\n\nNo radio check today. Second day in a row now. Base says it's atmospheric.\n\nDive team went down at noon and came back an hour early. Nobody's talking about why.\n\nI keep hearing something under the deck at night. Not the pumps.",
      {left:PAGE_W/2+90, top:180, width:1000, personaId:'G', fontSize:26, fatigue:true}
    );
    [leftEntry, rightEntry].forEach(o=>canvas.add(o));
  }
  else if (name==='letter'){
    await setTemplateBackground('paper_aged', {age:0.3});
    const body = new fabric.Textbox(
      "March 11\n\nDear Sarah,\n\nI know it's been a while. Work out here doesn't leave much room for letters, and honestly there isn't much to say that would clear the censor's desk anyway.\n\nThe platform is fine. Routine, mostly. I think about the house a lot, and the noise the boiler used to make, and how much I used to complain about it. I'd take that noise over what we've got out here.\n\nIf anything happens, the company has my paperwork in order. Don't let them tell you otherwise.\n\nTake care of yourself.\n\nYours,\nM.",
      {left:120, top:150, width:PAGE_W-240, fontFamily:"'PT Serif'", fontSize:18, fill:'#181410', lineHeight:1.6}
    );
    const sig = new HandwrittenText('M.', {left:120, top:PAGE_H-220, width:200, personaId:'C', fontSize:28});
    [body, sig].forEach(o=>canvas.add(o));
  }
  else if (name==='terminal'){
    // Único template sem foto de papel: um "monitor" desenhado (retângulo escuro
    // + scanlines/vinheta via filtro, mesmo padrão de makePhotoPlaceholder: desenha
    // num canvas solto, vira fabric.Image, só assim dá pra usar ScanlinesFilter/
    // VignetteFilter — filtro WebGL só funciona em cima de Image, não de Rect) em
    // vez de fundo físico. Bate com a própria frase de efeito da ferramenta
    // ("digitalizar nos HDs da DRE"). Sem foto de papel, então sem campo de dobra
    // nem pauta detectável — reseta os dois pra não sobrar estado de um template
    // anterior (esse aqui não usa texto manuscrito, mas se o Max adicionar um na
    // mão o campo teria ficado velho).
    await buildTerminalScreenBg();
    const lines = [
      'NEUROSTAT FIELD DIVISION — SYSTEM LOG',
      'NODE: DES-PLATFORM-01          BUILD 4.7.2',
      '----------------------------------------',
      '03:11:58  radio.check() -> OK',
      '03:12:04  radio.check() -> TIMEOUT',
      '03:12:04  radio.retry(3) -> TIMEOUT',
      '03:12:07  link.status = DEGRADED',
      '04:00:00  dive_team.status = DEPLOYED',
      '04:58:41  dive_team.status = RETURNED_EARLY',
      '04:58:41  crew_log.entry = [REDACTED]',
      '05:14:22  sensor.hull_array[12] -> ANOMALY',
      '05:14:23  sensor.hull_array[12] -> ANOMALY',
      '05:14:23  sensor.hull_array[12] -> ANOMALY',
      '05:14:24  sensor.hull_array[*]  -> ANOMALY',
      '05:15:00  supervisor.override = TRUE',
      '05:15:00  logging.suspended',
    ];
    const txt = new fabric.Textbox(lines.join('\n'), {
      left:70, top:60, width:PAGE_W-140, fontFamily:"'Courier Prime'", fontSize:20, fill:'#7fffb0', lineHeight:1.55,
    });
    canvas.add(txt);
  }
  else if (name==='badge'){
    await setTemplateBackground('paper_aged', {age:0.15});
    const headerBar = new fabric.Rect({left:0, top:0, width:PAGE_W, height:90, fill:'#1c3a5e'});
    const org = new fabric.Textbox('NEUROSTAT', {left:24, top:22, width:400, fontFamily:"'Courier Prime'", fontWeight:700, fontSize:26, fill:'#e6eef8'});
    const photo = await makePhotoPlaceholder({left:36, top:140, width:220, height:280});
    const name2 = new fabric.Textbox('J. OKAFOR', {left:300, top:150, width:520, fontFamily:"'Playfair Display'", fontWeight:900, fontSize:32, fill:'#141414'});
    const role = new fabric.Textbox('FIELD DIVISION — DIVE SUPPORT', {left:300, top:200, width:520, fontFamily:"'Courier Prime'", fontSize:16, fill:'#3a3a3a'});
    const level = new fabric.Textbox('ACCESS LEVEL: 2 — MOONPOOL DECK', {left:300, top:240, width:520, fontFamily:"'Courier Prime'", fontWeight:700, fontSize:16, fill:'#7a2020'});
    const id = new fabric.Textbox('ID 0447-M-12', {left:300, top:300, width:520, fontFamily:"'Courier Prime'", fontSize:14, fill:'#3a3a3a'});
    const barcode = await makeBarcodeImage({left:36, top:PAGE_H-100, width:PAGE_W-72, seed:Math.floor(rng()*1e9)});
    barcode.scaleToWidth(PAGE_W-72);
    [headerBar, org, photo, name2, role, level, id, barcode].forEach(o=>canvas.add(o));
  }
  else if (name==='whatsapp'){
    // Print de app de chat — fundo liso (cor de parede clássica do WhatsApp), sem papel
    // nenhum. Cada balão é RECT (fundo) + Textbox (texto) + Textbox (hora) — três objetos
    // editáveis de verdade, não uma imagem; o Max troca o texto de qualquer fala direto.
    await buildFlatScreenBg(...FLAT_SCREEN_BG.whatsapp);
    const HEADER_H = 190;
    const header = new fabric.Rect({left:0, top:0, width:PAGE_W, height:HEADER_H, fill:'#075E54'});
    const back = new fabric.Textbox('←', {left:30, top:HEADER_H-96, width:70, fontFamily:"'Arimo'", fontSize:48, fill:'#ffffff'});
    const avatar = new fabric.Circle({left:120, top:HEADER_H-90, radius:36, fill:'#cfd8d6'});
    const cName = new fabric.Textbox('DIVE CREW — CH.3', {left:210, top:HEADER_H-96, width:700, fontFamily:"'Source Sans 3'", fontWeight:700, fontSize:30, fill:'#ffffff'});
    const cStatus = new fabric.Textbox('last seen today at 04:19', {left:210, top:HEADER_H-54, width:700, fontFamily:"'Source Sans 3'", fontSize:20, fill:'#d8ece6'});
    const icons = new fabric.Textbox('📹  📞  ⋮', {left:PAGE_W-260, top:HEADER_H-90, width:220, fontSize:34, fill:'#ffffff', textAlign:'right'});
    const statusBar = buildPhoneStatusBar('#ffffff');
    const msgs = [
      {me:false, text:'you up?', time:'03:58'},
      {me:true,  text:"yeah. can't sleep", time:'03:59'},
      {me:false, text:"radio's doing that thing again", time:'04:01'},
      {me:false, text:'the low one, not static', time:'04:01'},
      {me:true,  text:"i hear it through the floor now, not the speaker", time:'04:03'},
      {me:false, text:"don't go near the moonpool", time:'04:04'},
      {me:false, text:'i mean it', time:'04:04'},
      {me:true,  text:"wasn't going to. why", time:'04:06'},
      {me:true,  text:'hey', time:'05:02', unread:true},
      {me:true,  text:'please answer', time:'05:14', unread:true},
    ];
    const objs = [header, back, avatar, cName, cStatus, icons, ...statusBar];
    let y = HEADER_H + 40;
    const MARGIN = 40, MAXW = 660, PAD = 28;
    msgs.forEach(m=>{
      // Textbox nunca encolhe abaixo da largura que a gente passa (ao contrário de
      // fabric.Text, que cresce pro conteúdo mas não quebra linha) — sem medir o texto
      // primeiro, toda bolha sairia do mesmo tamanho (MAXW), mesmo um "hey" sozinho.
      // Mede a largura natural com o canvas 2D (_mctx, de layout.js, mesmo truque que
      // o motor de coluna do jornal já usa) e só usa MAXW quando o texto de fato precisa.
      _mctx.font = "27px 'Source Sans 3'";
      const naturalW = _mctx.measureText(m.text).width;
      const boxW = Math.min(MAXW, Math.max(60, Math.ceil(naturalW)+4));
      const textBox = new fabric.Textbox(m.text, {left:0, top:0, width:boxW, fontFamily:"'Source Sans 3'", fontSize:27, fill:'#111111', lineHeight:1.32});
      const bubbleW = textBox.width + PAD*2;
      const bubbleH = textBox.height + PAD*2 + 26;
      const bubbleLeft = m.me ? (PAGE_W - MARGIN - bubbleW) : MARGIN;
      const bubble = new fabric.Rect({left:bubbleLeft, top:y, width:bubbleW, height:bubbleH, rx:22, ry:22, fill: m.me ? '#DCF8C6' : '#ffffff'});
      textBox.set({left:bubbleLeft+PAD, top:y+PAD});
      const tick = m.me ? (m.unread ? '✓ ' : '✓✓ ') : '';
      const stamp = new fabric.Textbox(tick+m.time, {left:bubbleLeft+PAD, top:y+bubbleH-40, width:bubbleW-PAD*2, fontFamily:"'Source Sans 3'", fontSize:18, fill: m.unread ? '#8a8a8a' : '#53bdeb', textAlign:'right'});
      objs.push(bubble, textBox, stamp);
      y += bubbleH + 24;
    });
    const inputBar = new fabric.Rect({left:0, top:PAGE_H-150, width:PAGE_W, height:150, fill:'#f0f0f0'});
    const inputPill = new fabric.Rect({left:40, top:PAGE_H-120, width:PAGE_W-220, height:90, rx:45, ry:45, fill:'#ffffff'});
    const inputPh = new fabric.Textbox('Message', {left:76, top:PAGE_H-100, width:500, fontFamily:"'Source Sans 3'", fontSize:26, fill:'#9a9a9a'});
    const sendBtn = new fabric.Circle({left:PAGE_W-120, top:PAGE_H-120, radius:45, fill:'#075E54'});
    const sendIco = new fabric.Textbox('➤', {left:PAGE_W-108, top:PAGE_H-104, width:60, fontSize:30, fill:'#ffffff'});
    objs.push(inputBar, inputPill, inputPh, sendBtn, sendIco);
    objs.forEach(o=>canvas.add(o));
  }
  else if (name==='email_mobile'){
    // Print de e-mail no celular (estilo iOS Mail): fundo branco liso, mesma barra de
    // status do whatsapp (reaproveitada, agora em preto já que o fundo aqui é claro).
    await buildFlatScreenBg(...FLAT_SCREEN_BG.email_mobile);
    const statusBar = buildPhoneStatusBar('#111111');
    const back = new fabric.Textbox('‹ Inbox', {left:40, top:140, width:300, fontFamily:"'Arimo'", fontSize:30, fill:'#007aff'});
    const subject = new fabric.Textbox('Re: shift log — attach radio transcript?', {left:40, top:210, width:PAGE_W-80, fontFamily:"'Arimo'", fontWeight:700, fontSize:40, fill:'#111111', lineHeight:1.2});
    const avatar = new fabric.Circle({left:40, top:360, radius:40, fill:'#8a8f98'});
    const avatarInit = new fabric.Textbox('O', {left:62, top:382, width:60, fontFamily:"'Arimo'", fontWeight:700, fontSize:32, fill:'#ffffff'});
    const sender = new fabric.Textbox('J. Okafor', {left:140, top:362, width:500, fontFamily:"'Arimo'", fontWeight:700, fontSize:28, fill:'#111111'});
    const toLine = new fabric.Textbox('to Dive Team — Channel 3', {left:140, top:402, width:500, fontFamily:"'Arimo'", fontSize:22, fill:'#8a8f98'});
    const date = new fabric.Textbox('Thu, Mar 13 at 23:41', {left:PAGE_W-340, top:362, width:300, fontFamily:"'Arimo'", fontSize:22, fill:'#8a8f98', textAlign:'right'});
    const divider = new fabric.Rect({left:40, top:470, width:PAGE_W-80, height:2, fill:'#e3e3e3'});
    const body = new fabric.Textbox(
      "Holt —\n\nPutting this on the record since the printer's down again and I don't trust the shared drive.\n\nWe lost the 03:12 channel like I told you, but it came back at 04:58 on its own. Nobody touched it.\n\nWhen it came back there was already something recorded on it. I'm not transcribing it over email.\n\nCome down and listen yourself before the next shift change.\n\n— Okafor",
      {left:40, top:510, width:PAGE_W-80, fontFamily:"'Arimo'", fontSize:27, fill:'#1a1a1a', lineHeight:1.5}
    );
    [...statusBar, back, subject, avatar, avatarInit, sender, toLine, date, divider, body].forEach(o=>canvas.add(o));
  }
  else if (name==='email_desktop'){
    // Print de e-mail no computador (estilo Outlook clássico): painel de pastas à
    // esquerda + barra de ferramentas + cabeçalho + corpo. Paisagem — monitor, não papel.
    await buildFlatScreenBg(...FLAT_SCREEN_BG.email_desktop);
    const sidebar = new fabric.Rect({left:0, top:0, width:280, height:PAGE_H, fill:'#f3f2f1'});
    const folders = ['Inbox','Drafts','Sent Items','Archive','Deleted Items'];
    const folderObjs = [];
    folders.forEach((f,i)=>{
      const topY = 110 + i*56;
      if (i===0) folderObjs.push(new fabric.Rect({left:10, top:topY-8, width:260, height:46, rx:6, ry:6, fill:'#dbe6fb'}));
      folderObjs.push(new fabric.Textbox(f, {left:30, top:topY, width:230, fontFamily:"'Arimo'", fontWeight:i===0?700:400, fontSize:22, fill:'#202020'}));
    });
    const acct = new fabric.Textbox('DES-PLATFORM-01 MAIL', {left:24, top:30, width:240, fontFamily:"'Arimo'", fontWeight:700, fontSize:18, fill:'#444444'});
    const toolbar = new fabric.Rect({left:280, top:0, width:PAGE_W-280, height:74, fill:'#ffffff', stroke:'#e1e1e1', strokeWidth:1});
    const toolbarTxt = new fabric.Textbox('↩ Reply     ↪ Reply All     ➜ Forward     🗑 Delete     🖨 Print', {left:310, top:22, width:PAGE_W-340, fontFamily:"'Arimo'", fontSize:24, fill:'#333333'});
    const subject = new fabric.Textbox('RE: Re: shift log — attach radio transcript?', {left:310, top:104, width:PAGE_W-340, fontFamily:"'Arimo'", fontWeight:700, fontSize:32, fill:'#111111'});
    const fromLbl = new fabric.Textbox('From:', {left:310, top:164, width:90, fontFamily:"'Arimo'", fontWeight:700, fontSize:20, fill:'#555555'});
    const fromVal = new fabric.Textbox('M. Holt <m.holt@neurostat-fd.local>', {left:400, top:164, width:700, fontFamily:"'Arimo'", fontSize:20, fill:'#111111'});
    const toLbl = new fabric.Textbox('To:', {left:310, top:196, width:90, fontFamily:"'Arimo'", fontWeight:700, fontSize:20, fill:'#555555'});
    const toVal = new fabric.Textbox('Dive Team — Channel 3', {left:400, top:196, width:700, fontFamily:"'Arimo'", fontSize:20, fill:'#111111'});
    const dateLbl = new fabric.Textbox('Thu 03/14 06:02', {left:PAGE_W-330, top:164, width:300, fontFamily:"'Arimo'", fontSize:20, fill:'#555555', textAlign:'right'});
    const divider = new fabric.Rect({left:310, top:234, width:PAGE_W-340, height:2, fill:'#e1e1e1'});
    const body = new fabric.Textbox(
      "Okafor,\n\nDo not play it for the rest of the crew. Bring the drive to my office directly, nobody else present.\n\nThis is not the first time hardware has recorded something during a dropout. Previous instances are documented and classified above your clearance, which is itself informative.\n\nStandard procedure applies: log the timestamp, do not loop the audio, do not describe its content in writing.\n\n— M. Holt\nNEUROSTAT — Field Division",
      {left:310, top:270, width:PAGE_W-360, fontFamily:"'Source Sans 3'", fontSize:24, fill:'#1a1a1a', lineHeight:1.5}
    );
    [sidebar, acct, ...folderObjs, toolbar, toolbarTxt, subject, fromLbl, fromVal, toLbl, toVal, dateLbl, divider, body].forEach(o=>canvas.add(o));
  }
  else if (name==='email_90s'){
    // Outlook Express / Windows 98 — a cor e o bisel 3D dos "botões" vendem a época, não a
    // fonte (nenhuma fonte carregada imita MS Sans Serif de verdade). Dois Rects por botão
    // (claro no topo/esquerda, escuro embaixo/direita) simulam o bevel clássico do Win98.
    await buildFlatScreenBg(...FLAT_SCREEN_BG.email_90s);
    const titleBar = new fabric.Rect({left:0, top:0, width:PAGE_W, height:40, fill:'#000080'});
    const titleTxt = new fabric.Textbox('Inbox - Message  (Plain Text)', {left:14, top:8, width:700, fontFamily:"'Arimo'", fontWeight:700, fontSize:20, fill:'#ffffff'});
    const winBtns = new fabric.Textbox('_  □  X', {left:PAGE_W-110, top:6, width:100, fontFamily:"'Arimo'", fontWeight:700, fontSize:20, fill:'#ffffff'});
    const menuBar = new fabric.Textbox('File   Edit   View   Insert   Format   Tools   Actions   Help', {left:14, top:46, width:PAGE_W-28, fontFamily:"'Arimo'", fontSize:18, fill:'#111111'});
    const toolDivider = new fabric.Rect({left:0, top:78, width:PAGE_W, height:2, fill:'#808080'});
    const btnObjs = [];
    const btnLabels = ['↩ Reply','↪ Fwd','🖨 Print','🗑 Delete','⏎ Send'];
    btnLabels.forEach((lab,i)=>{
      const bx = 14+i*110, by = 86, bw = 100, bh = 50;
      btnObjs.push(new fabric.Rect({left:bx, top:by, width:bw, height:bh, fill:'#c0c0c0', stroke:'#808080', strokeWidth:2}));
      btnObjs.push(new fabric.Rect({left:bx, top:by, width:bw-2, height:bh-2, fill:'transparent', stroke:'#ffffff', strokeWidth:2}));
      btnObjs.push(new fabric.Textbox(lab, {left:bx+6, top:by+14, width:bw-12, fontFamily:"'Arimo'", fontSize:15, fill:'#111111', textAlign:'center'}));
    });
    const headerPanel = new fabric.Rect({left:0, top:148, width:PAGE_W, height:150, fill:'#c0c0c0', stroke:'#808080', strokeWidth:1});
    const hdrRows = [
      ['From:','sysnotify@des-platform-01.internal'],
      ['To:','maintenance-dist@neurostat-fd.local'],
      ['Subject:','AUTOMATED ALERT: hull_array[12] THRESHOLD EXCEEDED'],
      ['Date:','Fri 03/14 05:15 AM'],
    ];
    const hdrObjs = [];
    hdrRows.forEach((r,i)=>{
      hdrObjs.push(new fabric.Textbox(r[0], {left:20, top:158+i*34, width:110, fontFamily:"'Arimo'", fontWeight:700, fontSize:17, fill:'#111111'}));
      hdrObjs.push(new fabric.Textbox(r[1], {left:140, top:158+i*34, width:PAGE_W-160, fontFamily:"'Arimo'", fontSize:17, fill:'#111111'}));
    });
    const bodyPanel = new fabric.Rect({left:0, top:298, width:PAGE_W, height:PAGE_H-298, fill:'#ffffff'});
    const body = new fabric.Textbox(
      "THIS IS AN AUTOMATED MESSAGE. DO NOT REPLY.\n\nSENSOR NODE DES-PLATFORM-01 HAS LOGGED 40+ ANOMALY EVENTS ON HULL ARRAY CHANNEL 12 IN THE LAST SIX MINUTES.\n\nTHRESHOLD FOR AUTOMATIC SUPERVISOR NOTIFICATION: 3 EVENTS / HOUR.\nOBSERVED RATE: EXCEEDS SCALE.\n\nLOGGING HAS BEEN SUSPENDED BY SUPERVISOR OVERRIDE AT 05:15:00.\nTHIS SYSTEM WILL NOT SEND FURTHER ALERTS UNTIL LOGGING RESUMES.\n\n-- END OF MESSAGE --",
      {left:24, top:318, width:PAGE_W-48, fontFamily:"'Courier Prime'", fontSize:19, fill:'#111111', lineHeight:1.5}
    );
    [titleBar, titleTxt, winBtns, menuBar, toolDivider, ...btnObjs, headerPanel, ...hdrObjs, bodyPanel, body].forEach(o=>canvas.add(o));
  }
  else if (name==='menu_fine'){
    await setTemplateBackground('paper_aged', {age:0.1});
    const title = new fabric.Textbox('EXECUTIVE SERVICE', {left:0, top:140, width:PAGE_W, originX:'left', fontFamily:"'Playfair Display'", fontWeight:900, fontSize:56, fill:'#141414', textAlign:'center', charSpacing:200});
    const subtitle = new fabric.Textbox('PLATFORM DESERTO — DINING DECK', {left:0, top:220, width:PAGE_W, fontFamily:"'Courier Prime'", fontSize:18, fill:'#5a5240', textAlign:'center', charSpacing:150});
    const ruleTop = new fabric.Rect({left:PAGE_W/2-180, top:290, width:360, height:2, fill:'#9a8a5a'});
    const sections = [
      {label:'AMUSE-BOUCHE', items:[['Smoked roe, crème fraîche','']]},
      {label:'FIRST', items:[['Scallop crudo, brown butter, sea lettuce','']]},
      {label:'SECOND', items:[['Dry-aged beef, bone marrow jus, charred onion','']]},
      {label:'DESSERT', items:[['Dark chocolate, salt caramel, burnt citrus','']]},
    ];
    const objs = [title, subtitle, ruleTop];
    let y = 360;
    sections.forEach(sec=>{
      objs.push(new fabric.Textbox(sec.label, {left:0, top:y, width:PAGE_W, fontFamily:"'Playfair Display'", fontWeight:700, fontSize:24, fill:'#7a6a34', textAlign:'center', charSpacing:120}));
      y += 60;
      sec.items.forEach(([itemName])=>{
        objs.push(new fabric.Textbox(itemName, {left:140, top:y, width:PAGE_W-280, fontFamily:"'PT Serif'", fontStyle:'italic', fontSize:22, fill:'#141414', textAlign:'center'}));
        y += 70;
      });
      y += 30;
    });
    const ruleBot = new fabric.Rect({left:PAGE_W/2-180, top:y, width:360, height:2, fill:'#9a8a5a'});
    const price = new fabric.Textbox('FIXED MENU — $340 PER GUEST', {left:0, top:y+40, width:PAGE_W, fontFamily:"'Courier Prime'", fontWeight:700, fontSize:20, fill:'#141414', textAlign:'center', charSpacing:100});
    const footer = new fabric.Textbox('Wine pairing available upon request. Please advise of dietary restrictions 48 hours prior to crew rotation.', {left:160, top:y+110, width:PAGE_W-320, fontFamily:"'PT Serif'", fontStyle:'italic', fontSize:15, fill:'#5a5240', textAlign:'center', lineHeight:1.4});
    objs.push(ruleBot, price, footer);
    objs.forEach(o=>canvas.add(o));
  }
  else if (name==='menu_diner'){
    await setTemplateBackground('paper_aged', {age:0.2});
    const band = new fabric.Rect({left:0, top:0, width:PAGE_W, height:150, fill:'#c79a2b'});
    const title = new fabric.Textbox('GALLEY — WEEKLY BOARD', {left:0, top:36, width:PAGE_W, fontFamily:"'Oswald'", fontWeight:700, fontSize:52, fill:'#1a1a1a', textAlign:'center'});
    const sections = [
      {label:'HOT', color:'#9a2d20', items:[['Chili (Mon/Thu)','4'],['Grilled cheese','3'],['Soup of the day — ask your supervisor','—']]},
      {label:'COLD', color:'#1c5a3a', items:[['Tuna salad','3'],['Fruit cup','2']]},
      {label:'ALWAYS AVAILABLE', color:'#1c3a5e', items:[['Coffee — bottomless','0'],['Crackers','0'],['Earplugs — see supply locker','0']]},
    ];
    const objs = [band, title];
    let y = 210;
    sections.forEach(sec=>{
      objs.push(new fabric.Rect({left:90, top:y, width:PAGE_W-180, height:46, fill:sec.color}));
      objs.push(new fabric.Textbox(sec.label, {left:90, top:y+8, width:PAGE_W-180, fontFamily:"'Oswald'", fontWeight:700, fontSize:26, fill:'#ffffff', textAlign:'center'}));
      y += 70;
      sec.items.forEach(([name2, price])=>{
        menuRow(name2, price, 120, y, PAGE_W-240, {fontFamily:"'Source Sans 3'", fontSize:24, fill:'#1a1a1a'}).forEach(o=>objs.push(o));
        y += 50;
      });
      y += 50;
    });
    const footer = new fabric.Textbox('Comment card box located outside galley. Messages regarding noise complaints should be directed to supervision directly, not posted here.', {left:120, top:y+10, width:PAGE_W-240, fontFamily:"'Source Sans 3'", fontStyle:'italic', fontSize:16, fill:'#4a4a4a', textAlign:'center', lineHeight:1.4});
    objs.push(footer);
    objs.forEach(o=>canvas.add(o));
  }
  else if (name==='menu_fastfood'){
    await buildFlatScreenBg(...FLAT_SCREEN_BG.menu_fastfood);
    const title = new fabric.Textbox('ANCHOR BASKET', {left:0, top:60, width:PAGE_W, fontFamily:"'Oswald'", fontWeight:700, fontSize:72, fill:'#ffec3d', textAlign:'center'});
    const sub = new fabric.Textbox('DOCKSIDE LOCATION — OPEN 24H', {left:0, top:150, width:PAGE_W, fontFamily:"'Oswald'", fontSize:24, fill:'#ffffff', textAlign:'center'});
    const ribbon = new fabric.Rect({left:PAGE_W-420, top:220, width:460, height:70, fill:'#ffec3d', angle:-8});
    const ribbonTxt = new fabric.Textbox('NEW! DEEP-SEA PLATFORM BASKET', {left:PAGE_W-420, top:238, width:460, angle:-8, fontFamily:"'Oswald'", fontWeight:700, fontSize:18, fill:'#a81414', textAlign:'center'});
    const combos = [
      {n:'1', name:'CAPTAIN COMBO', desc:'Fish basket, fries, soda', price:'$9.99'},
      {n:'2', name:'DOUBLE ANCHOR', desc:'Double burger, fries, soda', price:'$11.49'},
      {n:'3', name:'CREW SPECIAL', desc:'Chicken tenders, fries, soda', price:'$8.99'},
    ];
    const objs = [title, sub, ribbon, ribbonTxt];
    let y = 400;
    combos.forEach(c=>{
      const box = new fabric.Rect({left:90, top:y, width:PAGE_W-180, height:170, rx:16, ry:16, fill:'#ffffff'});
      const num = new fabric.Circle({left:116, top:y+26, radius:36, fill:'#d41c1c'});
      const numTxt = new fabric.Textbox(c.n, {left:116, top:y+44, width:72, fontFamily:"'Oswald'", fontWeight:700, fontSize:36, fill:'#ffffff', textAlign:'center'});
      const nameTxt = new fabric.Textbox(c.name, {left:210, top:y+24, width:640, fontFamily:"'Oswald'", fontWeight:700, fontSize:30, fill:'#1a1a1a'});
      const descTxt = new fabric.Textbox(c.desc, {left:210, top:y+70, width:640, fontFamily:"'Source Sans 3'", fontSize:20, fill:'#4a4a4a'});
      const priceTxt = new fabric.Textbox(c.price, {left:PAGE_W-260, top:y+55, width:160, fontFamily:"'Oswald'", fontWeight:700, fontSize:34, fill:'#d41c1c', textAlign:'right'});
      objs.push(box, num, numTxt, nameTxt, descTxt, priceTxt);
      y += 200;
    });
    const footer = new fabric.Textbox('** Shuttle to platform departs 0600 sharp. Missing the shuttle is not grounds for reimbursement.', {left:90, top:y+10, width:PAGE_W-180, fontFamily:"'Source Sans 3'", fontStyle:'italic', fontSize:16, fill:'#ffffff', textAlign:'center', lineHeight:1.4});
    objs.push(footer);
    objs.forEach(o=>canvas.add(o));
  }

  canvas.renderAll();
  renderLayerList();
  syncNewsLayoutUI();
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
  document.getElementById('pageStatus').textContent = `Página ${curPageIdx+1} de ${PAGES.length}`;
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
async function pageAdd(){
  return withSceneLock(async ()=>{
    pageSaveCurrent();
    await sceneSwitchTo({}, {
      buildFresh: async ()=>{
        if (currentTemplate==='terminal') await buildTerminalScreenBg();
        else if (FLAT_SCREEN_BG[currentTemplate]) await buildFlatScreenBg(...FLAT_SCREEN_BG[currentTemplate]);
        else if (bgMode==='digital' && currentBgOpts) await setDigitalBackground(currentBgOpts);
        else if (currentBgCategory) await setBackgroundPaper(pickFile(currentBgCategory, Math.random), currentBgOpts);
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
document.getElementById('btnPageAdd').addEventListener('click', ()=>pageAdd());
document.getElementById('btnPageDel').addEventListener('click', ()=>pageDelete());

/* ===================== Layout do jornal (presets + colunas) ===================== */
const newsPresetRow = document.getElementById('newsPresetRow');
Object.entries(NEWS_PRESETS).forEach(([key, preset])=>{
  const b = document.createElement('button');
  b.textContent = preset.label;
  b.addEventListener('click', ()=>{
    currentNewsLayout = JSON.parse(JSON.stringify(preset));
    document.getElementById('newsCols').value = currentNewsLayout.nCols;
    rebuildNewspaperLayout();
  });
  newsPresetRow.appendChild(b);
});
document.getElementById('newsCols').addEventListener('change', (e)=>{
  if (!currentNewsLayout) return;
  currentNewsLayout.nCols = +e.target.value;
  rebuildNewspaperLayout();
});
function syncNewsLayoutUI(){
  const show = currentTemplate==='newspaper';
  document.getElementById('newsLayoutBlock').style.display = show?'block':'none';
  if (show && currentNewsLayout) document.getElementById('newsCols').value = currentNewsLayout.nCols;
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
  if (o.type==='handwrittentext') return '✎ ' + (o.text||'').slice(0,18);
  if (o.type==='redactedtext') return '▬ ' + (o.text||'').slice(0,18);
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
      const up = document.createElement('button'); up.textContent='↑'; up.title='Trazer pra frente';
      up.addEventListener('click', (ev)=>{ ev.stopPropagation(); canvas.bringObjectForward(o); canvas.renderAll(); renderLayerList(); pushHistory(); });
      row.appendChild(up);
      const down = document.createElement('button'); down.textContent='↓'; down.title='Mandar pra trás';
      down.addEventListener('click', (ev)=>{ ev.stopPropagation(); canvas.sendObjectBackwards(o); canvas.renderAll(); renderLayerList(); pushHistory(); });
      row.appendChild(down);
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
function updateEditorCount(){
  const v = document.getElementById('editorTextarea').value;
  document.getElementById('editorCount').textContent = v.length+' caracteres, '+(v.trim()?v.trim().split(/\s+/).length:0)+' palavras';
}
function openTextEditor(targetObj){
  editorTarget = targetObj;
  document.getElementById('editorTitle').textContent = 'Editando texto';
  const ta = document.getElementById('editorTextarea');
  ta.value = targetObj.text;
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
    } else {
      editorTarget.set('text', newText);
      canvas.renderAll(); renderLayerList();
      if (newText !== before) pushHistory();
    }
  }
  document.getElementById('editorModal').hidden = true;
  editorTarget = null;
}
document.getElementById('editorTextarea').addEventListener('input', ()=>{
  updateEditorCount();
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

  if (obj.type==='brandtext'){
    renderBrandTextInspector(obj, body);
  } else if (obj.type==='textbox' || obj.type==='handwrittentext' || obj.type==='redactedtext'){
    renderTextInspector(obj, body);
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
    const fontOptions = ["'PT Serif'","'Playfair Display'","'Courier Prime'","'UnifrakturCook'"].map(f=>({value:f, label:f.replace(/'/g,'')}));
    body.appendChild(field.select('Fonte', fontOptions, obj.fontFamily, v=>{ obj.set('fontFamily', v); canvas.renderAll(); }));
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
    body.appendChild(field.buttonRow([
      field.button('🖼 Polaroid', ()=>{ addPolaroidFrame(canvas, obj); pushHistory(); }),
      field.button('📹 HUD CCTV', ()=>{ addCCTVHud(canvas, obj); pushHistory(); }),
    ]));
    body.appendChild(field.button('▬ Barras VHS', ()=>{ addVHSBars(canvas, obj); pushHistory(); }));
  }

  const filterPanelHost = document.createElement('div');
  body.appendChild(filterPanelHost);
  renderFilterPanel(canvas, obj, filterPanelHost);

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

  // Controles de categoria/reroll/mancha só fazem sentido no modo Texturizado —
  // o fundo Digital não é uma foto (não tem categoria pra trocar, mancha em cima
  // de um degradê vetorial ficaria errado). Modo se troca no alternador da aba
  // Documento, não aqui.
  if (bgMode === 'digital'){
    body.appendChild(field.hint('Fundo digital (sem foto) — troque pra Texturizado na aba Documento pra ver categoria de papel e manchas.'));
    return;
  }

  const CAT_LABELS = {paper_aged:'Envelhecido', paper_notebook_ruled:'Caderno pautado', paper_notebook_plain:'Caderno liso', paper_newsprint:'Jornal'};
  const catOptions = Object.keys(CAT_LABELS).map(c=>({value:c, label:CAT_LABELS[c]}));
  const catValue = (currentBgCategory && CAT_LABELS[currentBgCategory]) ? currentBgCategory : catOptions[0].value;
  const catField = field.select('Categoria', catOptions, catValue, ()=>{});
  body.appendChild(catField);
  body.appendChild(field.button('🎲 Trocar papel', async ()=>{
    const age = (obj.filters[0]&&obj.filters[0].amount)||0.4;
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
    }
  });
  return out;
}
const TEXT_ENTRY_LABELS = {
  // customType próprio (brandText, stampText, ...) preserva a caixa exata que o resto do
  // código já usa (confirmado em brand.js/handwriting.js/network-diagram.js) — já o `type`
  // nativo do Fabric (textbox, handwrittentext, redactedtext) chega sempre minúsculo aqui
  // porque extractTextEntries já normaliza isso antes de guardar.
  textbox: 'Texto', handwrittentext: 'Texto manuscrito', redactedtext: 'Texto censurado',
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
document.getElementById('btnExport').addEventListener('click', ()=>{
  const mult = +document.getElementById('exportScale').value;
  canvas.discardActiveObject(); canvas.renderAll();
  let dataUrl = canvas.toDataURL({format:'png', multiplier: mult/canvas.getZoom()});
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
  initCanvas();
  loadTemplate('newspaper');
});
