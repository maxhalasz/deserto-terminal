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

/* ===================== Histórico (undo/redo) =====================
   Mesmo padrão de tools/image-lab.js: pilha de snapshots canvas.toObject(),
   guardando as propriedades customizadas que cada tipo de objeto usa fora do
   schema padrão do Fabric. `restoringHistory` evita que a própria restauração
   (ou uma reconstrução em lote, tipo trocar preset de jornal) dispare pushes
   espúrios — os eventos object:added/removed disparam um por objeto mesmo numa
   operação em lote. */
const HISTORY_PROPS = ['customType','__paperFile','personaId','fatigue','seed','redactPct','__newsGenerated','__labName','__oid','__ownerOid'];
let history = [];
let historyIndex = -1;
let restoringHistory = false;
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
function restoreHistory(idx){
  if (idx<0 || idx>=history.length) return;
  restoringHistory = true;
  cancelCrop();
  canvas.loadFromJSON(history[idx]).then(()=>{
    canvas.renderAll();
    restoringHistory = false;
    historyIndex = idx;
    renderLayerList();
    updateInspector();
    updateUndoRedoButtons();
    syncNewsLayoutUI();
  });
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
  const wasRestoring = restoringHistory;
  restoringHistory = true; // troca de preset é UMA ação do usuário, não N pushes por objeto removido/adicionado
  canvas.getObjects().filter(o=>o.__newsGenerated).forEach(o=>canvas.remove(o));
  const objs = await buildNewspaperObjects(currentNewsContent, currentNewsLayout);
  objs.forEach(o=>canvas.add(o));
  canvas.renderAll();
  renderLayerList();
  restoringHistory = wasRestoring;
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
  canvas.on('object:added', e=>{
    renderLayerList();
    pushHistory();
    // nunca deixa o Fabric entrar no modo de edição nativo — sempre passa pelo
    // modal (cursor confiável, prévia ao vivo). Ver comentário em openTextEditor.
    const o = e.target;
    if (o && (o.type==='textbox' || o.type==='handwrittentext' || o.type==='redactedtext')) o.editable = false;
  });
  canvas.on('object:removed', ()=>{ renderLayerList(); pushHistory(); });
  canvas.on('mouse:dblclick', e=>{
    const o = e.target;
    if (o && (o.type==='textbox' || o.type==='handwrittentext' || o.type==='redactedtext')) openTextEditor(o);
  });
  setZoom(0.5);
  pushHistory();
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
};
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
/* Alinha o primeiro pico de uma faixa lateral à MESMA linha física do primeiro
   pico da faixa do meio — bug real achado testando ao vivo: cada faixa detecta
   picos de forma independente, e se uma faixa perde 1-2 linhas do topo (comum
   perto da espiral do caderno, onde o sinal é mais fraco), o "primeiro pico" dela
   pode ser a linha 3 enquanto o da faixa do meio é a linha 1 — comparar os dois
   direto dava uma inclinação gigante e errada (~2 espaçamentos de diferença).
   Usa o espaçamento (que é o mesmo pra todas as faixas, papel pautado é
   paralelo) pra achar quantas linhas de diferença existem e voltar pra mesma
   linha do meio. Validado com simulação Node reproduzindo exatamente esse caso
   (faixas perdendo linhas diferentes) antes de entrar aqui. */
function alignBandToMid(band, midFirstPeakRow, midSpacing){
  const avgSpacing = (band.spacing+midSpacing)/2;
  const k = Math.round((band.peaks[0]-midFirstPeakRow)/avgSpacing);
  return k; // deslocamento de ÍNDICE: band.peaks[i-k] é a mesma linha física que mid.peaks[i]
}
/* computeRuledLines: uma inclinação POR LINHA, não uma única pra página inteira.
   Papel fotografado real ondula/tuerce (lombada do caderno, curvatura da folha) —
   uma inclinação global (versão anterior) não seguia isso, Max reportou "as linhas
   do papel estão tortas". Repete o casamento left/mid/right (já validado pro 1º
   pico) LINHA A LINHA: o deslocamento de índice k é o mesmo pra página inteira
   (linhas são paralelas, calculado uma vez), então band.peaks[i-k] dá o par certo
   pra cada i sem precisar recasar. Linhas sem par válido nas 3 faixas (perto da
   borda onde uma faixa perdeu picos) caem na inclinação média das que têm.
   Validado em simulação Node: erro de inclinação <0.004 mesmo com ondulação +
   ruído + faixas perdendo linhas líderes diferentes. */
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
    const kLeft = alignBandToMid(left, mid.peaks[0], mid.spacing);
    const kRight = alignBandToMid(right, mid.peaks[0], mid.spacing);
    const lines = [];
    const slopes = [];
    for (let i=0;i<mid.peaks.length;i++){
      const li = i-kLeft, ri = i-kRight;
      const midY = (mid.peaks[i]/rows)*PAGE_H;
      let slope = null;
      if (li>=0 && li<left.peaks.length && ri>=0 && ri<right.peaks.length){
        const leftY = (left.peaks[li]/rows)*PAGE_H, rightY = (right.peaks[ri]/rows)*PAGE_H;
        // trava de segurança: uma foto de mesa não devia ter mais que uns 10° de
        // inclinação (tan(10°)≈0.176) — se o casamento de linha ainda assim errar,
        // não deixa a inclinação virar um efeito absurdo.
        slope = Math.max(-0.18, Math.min(0.18, (rightY-leftY)/(rightRefX-leftRefX)));
        slopes.push(slope);
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

async function loadTemplate(name){
  currentTemplate = name;
  const __wasRestoring = restoringHistory;
  restoringHistory = true; // carregar um template é UMA ação, não um push por objeto removido/adicionado
  try {
    await loadTemplateBody(name);
  } finally {
    restoringHistory = __wasRestoring;
    pushHistory();
  }
}
async function loadTemplateBody(name){
  applyPageSize(name);
  clearDoc();
  const rng = mulberry32(Math.floor(Math.random()*4294967296));

  if (name==='blank'){
    await setBackgroundPaper(pickFile('paper_aged', rng));
    canvas.renderAll(); renderLayerList(); return;
  }

  if (name==='newspaper'){
    await setBackgroundPaper(pickFile('paper_newsprint', rng));
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
    await setBackgroundPaper(pickFile('paper_aged', rng));
    const head = new fabric.Textbox('CONFIDENTIAL — INTERNAL USE ONLY\nNEUROSTAT — FIELD DIVISION\nREF: NS-DES-0447\nDATE: 03/14', {left:90, top:90, width:500, fontFamily:"'Courier Prime'", fontWeight:700, fontSize:14, fill:'#141414', lineHeight:1.5});
    const body = new RedactedText('INCIDENT REPORT — NIGHT SHIFT\n\nAt 03:12 radio contact with the dive team was lost. The last recorded transmission consisted of broadband noise, no identifiable verbal content.\n\nSurface crew not authorized to descend without direct order from supervision.', {left:90, top:220, width:PAGE_W-180, redactPct:0, fontSize:16});
    const [stampRect, stampTxt] = makeStampObjects('CONFIDENTIAL', {left:PAGE_W-220, top:150, angle:-10, color:'#7a2020'});
    const sig = new HandwrittenText('M. Holt', {left:90, top:620, width:260, personaId:'C', fontSize:26});
    [head, body, stampRect, stampTxt, sig].forEach(o=>canvas.add(o));
  }
  else if (name==='note'){
    await setBackgroundPaper(pickFile('paper_notebook_ruled', rng), {age:0.3});
    const body = new HandwrittenText("if you find this\n\ndon't go down\n\nthe radio won't stop but there's no one talking\n\ni saw something near the moonpool yesterday and i'm not going to describe it\n\nstay in the machine room, lock the door", {left:110, top:220, width:PAGE_W-260, personaId:'A', fontSize:30, fatigue:true});
    canvas.add(body);
  }
  else if (name==='redacted'){
    await setBackgroundPaper(pickFile('paper_aged', rng));
    const band = new fabric.Rect({left:66, top:70, width:PAGE_W-132, height:34, fill:'#101010'});
    const bandTxt = new fabric.Textbox('RESTRICTED — DO NOT DISTRIBUTE', {left:PAGE_W/2, top:78, originX:'center', width:900, fontFamily:"'Courier Prime'", fontWeight:700, fontSize:15, fill:'#e6e2d8', textAlign:'center'});
    const head = new fabric.Textbox('NEUROSTAT\nCASE NO. 0447-D', {left:90, top:130, width:500, fontFamily:"'Courier Prime'", fontWeight:700, fontSize:15, fill:'#141414', lineHeight:1.4});
    const body = new RedactedText('Subject was located near the coral formation. State of consciousness unknown. Immediate containment and notification of leadership recommended.\n\nThe identified sound pattern does not match any catalog known to the division. Preliminary analysis suggests uncatalogued biological origin.', {left:90, top:220, width:PAGE_W-180, redactPct:28, fontSize:16});
    const [stampRect, stampTxt] = makeStampObjects('CLASSIFIED', {left:PAGE_W/2, top:PAGE_H/2+150, angle:-18, color:'rgba(150,20,20,0.85)', fontSize:44});
    [band, bandTxt, head, body, stampRect, stampTxt].forEach(o=>canvas.add(o));
  }
  else if (name==='tag'){
    await setBackgroundPaper(pickFile('paper_aged', rng));
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
    await setBackgroundPaper(pickFile('paper_aged_bookspread', rng), {age:0.35});
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
    await setBackgroundPaper(pickFile('paper_aged', rng), {age:0.3});
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
    await setBackgroundPaper(pickFile('paper_aged', rng), {age:0.15});
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

  canvas.renderAll();
  renderLayerList();
  syncNewsLayoutUI();
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
  return img;
}

/* ===================== Toolbar: adicionar objetos ===================== */
document.getElementById('templateSel').addEventListener('change', ()=>{});
document.getElementById('btnNewDoc').addEventListener('click', ()=>{
  if (!confirm('Isso apaga o documento atual. Continuar?')) return;
  loadTemplate(document.getElementById('templateSel').value);
});

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
  const [rect, txt] = makeStampObjects('CONFIDENTIAL', {left:PAGE_W/2, top:PAGE_H/2});
  canvas.add(rect); canvas.add(txt); canvas.setActiveObject(txt); canvas.renderAll();
});
document.getElementById('btnAddBarcode').addEventListener('click', async ()=>{
  const b = await makeBarcodeImage({left:PAGE_W/2-130, top:PAGE_H/2});
  canvas.add(b); canvas.setActiveObject(b); canvas.renderAll();
});
document.getElementById('btnAddPhotoPlaceholder').addEventListener('click', async ()=>{
  const p = await makePhotoPlaceholder({left:PAGE_W/2-150, top:PAGE_H/2-100});
  canvas.add(p); canvas.setActiveObject(p); canvas.renderAll();
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
  if (o.customType==='stain') return '💧 Mancha';
  if (o.customType==='grunge') return '🪨 Sujeira/grunge';
  if (o.customType==='bloom') return '✨ Glow';
  if (o.customType==='stamp') return '🔖 Carimbo';
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
  const objs = canvas.getObjects().filter(o=>o!==cropRect).slice().reverse();
  const active = canvas.getActiveObject();
  objs.forEach(o=>{
    const row = document.createElement('div');
    row.className = 'layerRow' + (o===active?' active':'');

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

    if (o.customType!=='background'){
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
  ctx.fillStyle = '#efe7d0'; ctx.fillRect(0,0,canvasEl.width,canvasEl.height);

  const w = targetObj.width||300, h = Math.max(targetObj.height||300, w*0.6);
  const fitScale = Math.min(canvasEl.width/w, canvasEl.height/h) * 0.9;
  ctx.save();
  ctx.setTransform(fitScale,0,0,fitScale, canvasEl.width/2, canvasEl.height/2);

  if (targetObj.type==='handwrittentext'){
    const tmp = new HandwrittenText(text||' ', {width:w, personaId:targetObj.personaId, fatigue:targetObj.fatigue, seed:targetObj.seed, fontSize:targetObj.fontSize});
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
    editorTarget.set('text', document.getElementById('editorTextarea').value);
    canvas.renderAll(); renderLayerList();
  }
  document.getElementById('editorModal').hidden = true;
  editorTarget = null;
}
document.getElementById('editorTextarea').addEventListener('input', ()=>{
  updateEditorCount();
  if (editorTarget) renderEditorPreview(editorTarget, document.getElementById('editorTextarea').value);
});
document.getElementById('editorClose').addEventListener('click', closeTextEditor);
document.addEventListener('keydown', e=>{
  if (!document.getElementById('editorModal').hidden){
    if (e.key==='Escape') closeTextEditor();
    return; // editando texto no modal — não deixa nenhum outro atalho passar
  }
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (tag==='INPUT' || tag==='TEXTAREA' || tag==='SELECT') return;
  const obj = canvas.getActiveObject();
  if (e.key==='Delete' || e.key==='Backspace'){
    if (obj && obj!==cropRect && obj.customType!=='background'){ e.preventDefault(); deleteObjectCascade(canvas, obj); canvas.discardActiveObject(); canvas.renderAll(); }
  } else if (e.ctrlKey && e.key.toLowerCase()==='d'){
    if (obj){ e.preventDefault(); obj.clone().then(c=>{ c.set({left:obj.left+20, top:obj.top+20}); canvas.add(c); canvas.setActiveObject(c); canvas.renderAll(); }); }
  } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='z'){
    e.preventDefault(); redo();
  } else if (e.ctrlKey && e.key.toLowerCase()==='z'){
    e.preventDefault(); undo();
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

  if (obj.type==='textbox' || obj.type==='handwrittentext' || obj.type==='redactedtext'){
    renderTextInspector(obj, body);
  }
  if (obj.type==='image'){
    renderImageInspector(obj, body);
  }
  if (obj.customType==='background'){
    renderBackgroundInspector(obj, body);
  }
  renderLayerProps(obj, body);

  const dup = document.createElement('button');
  dup.textContent = 'Duplicar';
  dup.addEventListener('click', ()=>{
    obj.clone().then(c=>{ c.set({left:obj.left+20, top:obj.top+20}); canvas.add(c); canvas.setActiveObject(c); canvas.renderAll(); });
  });
  body.appendChild(dup);
  if (obj.customType!=='background'){
    const del = document.createElement('button');
    del.textContent = 'Excluir'; del.className='danger';
    del.addEventListener('click', ()=>{ deleteObjectCascade(canvas, obj); canvas.discardActiveObject(); canvas.renderAll(); });
    body.appendChild(del);
  }
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
  details.appendChild(labeledRange('Opacidade', obj.opacity!=null?obj.opacity:1, 0, 1, 0.01, v=>{ obj.set('opacity', v); canvas.renderAll(); }));
  const lab = document.createElement('label'); lab.textContent='Modo de mescla';
  const sel = document.createElement('select');
  ['source-over','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','difference','exclusion'].forEach(m=>{
    const o = document.createElement('option'); o.value=m; o.textContent=m;
    if ((obj.globalCompositeOperation||'source-over')===m) o.selected=true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', ()=>{ obj.set('globalCompositeOperation', sel.value); canvas.renderAll(); pushHistory(); });
  details.appendChild(lab); details.appendChild(sel);
  body.appendChild(details);
}

function renderTextInspector(obj, body){
  const lab1 = document.createElement('label'); lab1.textContent='Texto';
  const editBtn = document.createElement('button'); editBtn.textContent='✎ Abrir editor';
  editBtn.addEventListener('click', ()=>openTextEditor(obj));
  body.appendChild(lab1); body.appendChild(editBtn);

  if (obj.type==='handwrittentext'){
    const lab = document.createElement('label'); lab.textContent='Estilo de letra';
    const sel = document.createElement('select');
    HANDWRITING_PERSONA_LIST.forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.label; sel.appendChild(o); });
    sel.value = obj.personaId;
    sel.addEventListener('change', ()=>{ obj.personaId = sel.value; canvas.renderAll(); });
    body.appendChild(lab); body.appendChild(sel);

    const fatLab = document.createElement('label'); fatLab.className='inline';
    const fatCb = document.createElement('input'); fatCb.type='checkbox'; fatCb.checked = obj.fatigue;
    fatCb.addEventListener('change', ()=>{ obj.fatigue = fatCb.checked; canvas.renderAll(); });
    fatLab.appendChild(fatCb); fatLab.appendChild(document.createTextNode(' Piora ao longo do texto'));
    body.appendChild(fatLab);

    const reseed = document.createElement('button'); reseed.textContent='🎲 Novo aspecto';
    reseed.addEventListener('click', ()=>{ obj.seed = Math.floor(Math.random()*4294967296); canvas.renderAll(); });
    body.appendChild(reseed);
  } else {
    const lab = document.createElement('label'); lab.textContent='Fonte';
    const sel = document.createElement('select');
    ["'PT Serif'","'Playfair Display'","'Courier Prime'","'UnifrakturCook'"].forEach(f=>{
      const o=document.createElement('option'); o.value=f; o.textContent=f.replace(/'/g,''); sel.appendChild(o);
    });
    sel.value = obj.fontFamily;
    sel.addEventListener('change', ()=>{ obj.set('fontFamily', sel.value); canvas.renderAll(); });
    body.appendChild(lab); body.appendChild(sel);

    body.appendChild(labeledRange('Tamanho', obj.fontSize, 8, 90, 1, v=>{ obj.set('fontSize', v); canvas.renderAll(); }));

    const colorLab = document.createElement('label'); colorLab.textContent='Cor';
    const colorInp = document.createElement('input'); colorInp.type='color'; colorInp.value = rgbToHex(obj.fill);
    colorInp.addEventListener('input', ()=>{ obj.set('fill', colorInp.value); canvas.renderAll(); });
    body.appendChild(colorLab); body.appendChild(colorInp);
  }

  if (obj.type==='redactedtext'){
    body.appendChild(labeledRange('Censura (%)', obj.redactPct, 0, 85, 1, v=>{ obj.redactPct=v; canvas.renderAll(); }));
    const reseed = document.createElement('button'); reseed.textContent='🎲 Nova censura';
    reseed.addEventListener('click', ()=>{ obj.seed = Math.floor(Math.random()*4294967296); canvas.renderAll(); });
    body.appendChild(reseed);
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
  const wasRestoring = restoringHistory;
  restoringHistory = true;
  canvas.add(cropRect);
  restoringHistory = wasRestoring;
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
    const wasRestoring = restoringHistory;
    restoringHistory = true;
    canvas.remove(cropRect);
    restoringHistory = wasRestoring;
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
    const lab = document.createElement('label'); lab.textContent='Trocar foto';
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
    body.appendChild(lab); body.appendChild(inp);

    const transformRow = document.createElement('div'); transformRow.className='grid2';
    const cropBtn = document.createElement('button'); cropBtn.textContent='▧ Recortar';
    cropBtn.addEventListener('click', ()=>startCrop(obj));
    const flipHBtn = document.createElement('button'); flipHBtn.textContent='⇋ Espelhar H';
    flipHBtn.addEventListener('click', ()=>flipSelected(obj,'h'));
    transformRow.appendChild(cropBtn); transformRow.appendChild(flipHBtn);
    body.appendChild(transformRow);
    const flipVBtn = document.createElement('button'); flipVBtn.textContent='⇵ Espelhar V';
    flipVBtn.addEventListener('click', ()=>flipSelected(obj,'v'));
    body.appendChild(flipVBtn);

    const compositeLab = document.createElement('div'); compositeLab.className='hint'; compositeLab.textContent='Moldura / overlay:';
    body.appendChild(compositeLab);
    const compositeRow = document.createElement('div'); compositeRow.className='grid2';
    const polaroidBtn = document.createElement('button'); polaroidBtn.textContent='🖼 Polaroid';
    polaroidBtn.addEventListener('click', ()=>{ addPolaroidFrame(canvas, obj); pushHistory(); });
    const cctvBtn = document.createElement('button'); cctvBtn.textContent='📹 HUD CCTV';
    cctvBtn.addEventListener('click', ()=>{ addCCTVHud(canvas, obj); pushHistory(); });
    compositeRow.appendChild(polaroidBtn); compositeRow.appendChild(cctvBtn);
    body.appendChild(compositeRow);
    const vhsBtn = document.createElement('button'); vhsBtn.textContent='▬ Barras VHS';
    vhsBtn.addEventListener('click', ()=>{ addVHSBars(canvas, obj); pushHistory(); });
    body.appendChild(vhsBtn);
  }

  const filterPanelHost = document.createElement('div');
  body.appendChild(filterPanelHost);
  renderFilterPanel(canvas, obj, filterPanelHost);

  const grungeBtn = document.createElement('button'); grungeBtn.textContent='🪨 Adicionar camada de sujeira';
  grungeBtn.addEventListener('click', applyGrungeOverlay);
  body.appendChild(grungeBtn);
  const bloomBtn = document.createElement('button'); bloomBtn.textContent='✨ Aplicar glow/bloom (nesta imagem)';
  bloomBtn.addEventListener('click', applyBloomToSelected);
  body.appendChild(bloomBtn);
}

function renderBackgroundInspector(obj, body){
  const lab = document.createElement('div'); lab.className='hint'; lab.textContent='Papel de fundo';
  body.appendChild(lab);

  const catLab = document.createElement('label'); catLab.textContent='Categoria';
  const catSel = document.createElement('select');
  const CAT_LABELS = {paper_aged:'Envelhecido', paper_notebook_ruled:'Caderno pautado', paper_notebook_plain:'Caderno liso', paper_newsprint:'Jornal'};
  Object.keys(CAT_LABELS).forEach(c=>{
    const o=document.createElement('option'); o.value=c; o.textContent=CAT_LABELS[c]; catSel.appendChild(o);
  });
  body.appendChild(catLab); body.appendChild(catSel);
  const swapBtn = document.createElement('button'); swapBtn.textContent='🎲 Trocar papel';
  swapBtn.addEventListener('click', async ()=>{
    const age = (obj.filters[0]&&obj.filters[0].amount)||0.4;
    await setBackgroundPaper(pickFile(catSel.value), {age});
    canvas.renderAll(); updateInspector();
  });
  body.appendChild(swapBtn);
  // "Idade do papel" não tem slider próprio aqui de propósito — obj.type==='image'
  // já faz updateInspector chamar renderImageInspector ANTES desta função (o fundo
  // é ao mesmo tempo type:'image' e customType:'background'), que já desenha um
  // slider de "Idade do papel" pra esse mesmo AgeTintFilter via renderFilterPanel.
  // Ter os dois era bug cosmético confirmado (dois controles pro mesmo valor).

  const stainLab = document.createElement('div'); stainLab.className='hint'; stainLab.textContent='Adicionar mancha:';
  body.appendChild(stainLab);
  const stainRow = document.createElement('div'); stainRow.className='toolgrid';
  [['Água','water'],['Café','coffee'],['Sangue','blood'],['Mofo','mold']].forEach(([lbl,val])=>{
    const b = document.createElement('button'); b.textContent=lbl;
    b.addEventListener('click', ()=>addStain(val));
    stainRow.appendChild(b);
  });
  body.appendChild(stainRow);
}

/* ===================== Exportar ===================== */
document.getElementById('btnExport').addEventListener('click', ()=>{
  const mult = +document.getElementById('exportScale').value;
  canvas.discardActiveObject(); canvas.renderAll();
  const dataUrl = canvas.toDataURL({format:'png', multiplier: mult/canvas.getZoom()});
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `prop_${currentTemplate}_${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

/* ===================== Init ===================== */
document.fonts.ready.then(()=>{
  switchTab('doc');
  initCanvas();
  loadTemplate('newspaper');
});
