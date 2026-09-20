/* ===================== Image Lab — ferramenta independente de efeitos =====================
   Sem noção de "documento"/"template" — só um canvas onde cada foto importada vira
   uma camada com filtros próprios. Reaproveita filters.js + filter-panel.js +
   composites.js, que também são usados pelo props-generator (mesmo motor, dois
   lugares diferentes). */

let canvas;
let canvasW = 1400, canvasH = 1000;

const CANVAS_PRESETS = {
  livre:    {w:1400, h:1000, label:'Livre'},
  polaroid: {w:1000, h:1000, label:'Quadrado Polaroid'},
  celular:  {w:900,  h:1600, label:'Retrato celular 9:16'},
  paisagem: {w:1600, h:1200, label:'Paisagem 4:3'},
};

/* ---- Histórico (undo/redo): pilha de snapshots canvas.toObject(). Guarda
   customType/__labName (propriedades nossas, fora do schema padrão do Fabric)
   pra sobreviver ao round-trip. `restoringHistory` evita que a própria restauração
   dispare um novo push (os eventos object:added/removed disparam durante o load). */
let history = [];
let historyIndex = -1;
let restoringHistory = false;
const HISTORY_LIMIT = 40;

function pushHistory(){
  if (restoringHistory) return;
  const snap = JSON.parse(JSON.stringify(canvas.toObject(['customType','__labName'])));
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
    updateFilterPanel();
    updateUndoRedoButtons();
  });
}
function undo(){ if (historyIndex>0) restoreHistory(historyIndex-1); }
function redo(){ if (historyIndex<history.length-1) restoreHistory(historyIndex+1); }
function updateUndoRedoButtons(){
  const bu = document.getElementById('btnUndo'), br = document.getElementById('btnRedo');
  if (bu) bu.disabled = historyIndex<=0;
  if (br) br.disabled = historyIndex>=history.length-1;
}

function initCanvas(){
  canvas = new fabric.Canvas('labCanvas', {
    width: canvasW, height: canvasH,
    backgroundColor: '#111318',
    preserveObjectStacking: true,
  });
  canvas.on('selection:created', updateFilterPanel);
  canvas.on('selection:updated', updateFilterPanel);
  canvas.on('selection:cleared', updateFilterPanel);
  canvas.on('object:added', ()=>{ renderLayerList(); pushHistory(); });
  canvas.on('object:removed', ()=>{ renderLayerList(); pushHistory(); });
  canvas.on('object:modified', ()=>{ pushHistory(); });
  setZoom(0.5);
  pushHistory();
}
function setZoom(z){
  const wrap = document.getElementById('canvasWrap');
  wrap.style.width = (canvasW*z)+'px';
  wrap.style.height = (canvasH*z)+'px';
  canvas.setZoom(z);
  canvas.setDimensions({width:canvasW*z, height:canvasH*z});
}
document.querySelectorAll('.zoomrow button[data-z]').forEach(b=>{
  b.addEventListener('click', ()=>setZoom(+b.dataset.z));
});

document.getElementById('canvasAspect').addEventListener('change', e=>{
  const p = CANVAS_PRESETS[e.target.value] || CANVAS_PRESETS.livre;
  canvasW = p.w; canvasH = p.h;
  setZoom(canvas.getZoom());
  canvas.renderAll();
  pushHistory();
});

/* ===================== Importar fotos ===================== */
let layerCounter = 0;
function addImageFromDataURL(dataUrl, atPoint){
  fabric.Image.fromURL(dataUrl).then(img=>{
    layerCounter++;
    img.__labName = 'Foto ' + layerCounter;
    const maxDim = 900;
    if (img.width>maxDim || img.height>maxDim){
      const s = maxDim/Math.max(img.width,img.height);
      img.scale(s);
    }
    img.set({
      left: (atPoint&&atPoint.x)||canvasW/2-img.getScaledWidth()/2,
      top: (atPoint&&atPoint.y)||canvasH/2-img.getScaledHeight()/2,
    });
    img.filters = [];
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();
  });
}
function loadFiles(fileList, atPoint){
  Array.from(fileList||[]).forEach((f,idx)=>{
    if (!f || !f.type || !f.type.startsWith('image/')) return;
    const reader = new FileReader();
    const pt = atPoint ? {x:atPoint.x+idx*26, y:atPoint.y+idx*26} : null;
    reader.onload = e => addImageFromDataURL(e.target.result, pt);
    reader.readAsDataURL(f);
  });
}

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
dropZone.addEventListener('click', ()=>fileInput.click());
fileInput.addEventListener('change', e=>{ loadFiles(e.target.files); e.target.value=''; });
['dragenter','dragover'].forEach(ev=>dropZone.addEventListener(ev, e=>{ e.preventDefault(); dropZone.classList.add('drag'); }));
['dragleave','drop'].forEach(ev=>dropZone.addEventListener(ev, e=>{ e.preventDefault(); dropZone.classList.remove('drag'); }));
dropZone.addEventListener('drop', e=>{ loadFiles(e.dataTransfer.files); });

const canvasWrap = document.getElementById('canvasWrap');
canvasWrap.addEventListener('dragover', e=>e.preventDefault());
canvasWrap.addEventListener('drop', e=>{
  e.preventDefault();
  if (!e.dataTransfer.files.length) return;
  const rect = canvasWrap.getBoundingClientRect();
  const z = canvas.getZoom();
  loadFiles(e.dataTransfer.files, {x:(e.clientX-rect.left)/z, y:(e.clientY-rect.top)/z});
});
document.addEventListener('paste', e=>{
  const items = (e.clipboardData && e.clipboardData.files) || [];
  if (items.length) loadFiles(items);
});

/* ===================== Camadas ===================== */
function labelForCustomType(t){
  const map = {bloom:'✨ Glow', grunge:'🪨 Sujeira', polaroidFrame:'🖼 Moldura', polaroidCaption:'✏️ Legenda', cctvHud:'📹 HUD', vhsBar:'▬ Barra VHS'};
  return map[t];
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
      thumb.src = o.toDataURL({format:'png', multiplier: 36/Math.max(bw,bh,1)});
    } catch(e){ /* objeto ainda não renderizável (ex: texto vazio) — sem miniatura */ }
    row.appendChild(thumb);

    const nm = document.createElement('span'); nm.className='nm';
    nm.textContent = o.__labName || labelForCustomType(o.customType) || 'Camada';
    nm.title = 'Duplo clique pra renomear';
    nm.addEventListener('dblclick', ev=>{
      ev.stopPropagation();
      const novo = prompt('Novo nome da camada:', o.__labName||'');
      if (novo){ o.__labName = novo; renderLayerList(); pushHistory(); }
    });
    row.appendChild(nm);

    const mkBtn = (txt, title, fn)=>{
      const b = document.createElement('button'); b.textContent=txt; b.title=title;
      b.addEventListener('click', ev=>{ ev.stopPropagation(); fn(); });
      return b;
    };
    row.appendChild(mkBtn('↑','Trazer pra frente', ()=>{ canvas.bringObjectForward(o); canvas.renderAll(); renderLayerList(); pushHistory(); }));
    row.appendChild(mkBtn('↓','Mandar pra trás', ()=>{ canvas.sendObjectBackwards(o); canvas.renderAll(); renderLayerList(); pushHistory(); }));
    row.appendChild(mkBtn('⧉','Duplicar', ()=>duplicateLayer(o)));
    row.appendChild(mkBtn('✕','Excluir', ()=>{ canvas.remove(o); canvas.discardActiveObject(); canvas.renderAll(); updateFilterPanel(); }));

    row.addEventListener('click', ()=>{ canvas.setActiveObject(o); canvas.renderAll(); updateFilterPanel(); });
    box.appendChild(row);
  });
}
function duplicateLayer(o){
  o.clone().then(clone=>{
    clone.__labName = (o.__labName||'Camada') + ' cópia';
    clone.set({left:(o.left||0)+20, top:(o.top||0)+20});
    canvas.add(clone);
    canvas.setActiveObject(clone);
    canvas.renderAll();
  });
}

/* ===================== Painel de filtros + propriedades da camada ===================== */
function updateFilterPanel(){
  renderLayerList();
  const obj = canvas.getActiveObject();
  const filterFieldset = document.getElementById('filterFieldset');
  const layerFieldset = document.getElementById('layerPropsFieldset');
  if (!obj || obj===cropRect){
    filterFieldset.style.display='none';
    layerFieldset.style.display='none';
    return;
  }
  layerFieldset.style.display='block';
  renderLayerProps(obj);
  if (obj.type!=='image'){ filterFieldset.style.display='none'; return; }
  filterFieldset.style.display='block';
  renderFilterPanel(canvas, obj, document.getElementById('filterPanelHost'));
}
function renderLayerProps(obj){
  const host = document.getElementById('layerPropsHost');
  host.innerHTML='';
  host.appendChild(labeledRange('Opacidade', obj.opacity!=null?obj.opacity:1, 0, 1, 0.01, v=>{ obj.set('opacity', v); canvas.renderAll(); pushHistory(); }));
  const lab = document.createElement('label'); lab.textContent='Modo de mescla';
  const sel = document.createElement('select');
  ['source-over','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','difference','exclusion'].forEach(m=>{
    const o = document.createElement('option'); o.value=m; o.textContent=m;
    if ((obj.globalCompositeOperation||'source-over')===m) o.selected=true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', ()=>{ obj.set('globalCompositeOperation', sel.value); canvas.renderAll(); pushHistory(); });
  host.appendChild(lab); host.appendChild(sel);
}
document.getElementById('btnDelete').addEventListener('click', ()=>{
  const obj = canvas.getActiveObject();
  if (!obj) return;
  canvas.remove(obj); canvas.discardActiveObject(); canvas.renderAll();
  updateFilterPanel();
});
// Grava histórico quando um slider de filtro é solto (evento nativo 'change', não
// o 'input' contínuo que filter-panel.js usa pra atualizar ao vivo) — delegação
// no container, sem precisar tocar em filter-panel.js.
document.getElementById('filterPanelHost').addEventListener('change', ()=>pushHistory());

/* ===================== Recorte ===================== */
let cropRect = null, cropTarget = null;
function startCrop(){
  const obj = canvas.getActiveObject();
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
  restoringHistory = true; // o retângulo de recorte é temporário, não entra no histórico
  canvas.add(cropRect);
  restoringHistory = false;
  canvas.setActiveObject(cropRect);
  canvas.renderAll();
  document.getElementById('cropActions').style.display='flex';
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
    cropX: (obj.cropX||0)+relLeft,
    cropY: (obj.cropY||0)+relTop,
    width: clW/obj.scaleX,
    height: clH/obj.scaleY,
    left: clLeft, top: clTop,
  });
  obj.setCoords();
  const target = obj;
  cancelCrop();
  canvas.setActiveObject(target);
  canvas.renderAll();
  pushHistory();
}
function cancelCrop(){
  if (cropRect){
    const wasRestoring = restoringHistory;
    restoringHistory = true; // remover o retângulo temporário não é uma mudança de conteúdo
    canvas.remove(cropRect);
    restoringHistory = wasRestoring;
  }
  cropRect = null; cropTarget = null;
  const bar = document.getElementById('cropActions');
  if (bar) bar.style.display='none';
}
document.getElementById('btnCrop').addEventListener('click', startCrop);
document.getElementById('btnCropApply').addEventListener('click', applyCrop);
document.getElementById('btnCropCancel').addEventListener('click', ()=>{ cancelCrop(); canvas.renderAll(); });

/* ===================== Espelhar ===================== */
function flipSelected(axis){
  const obj = canvas.getActiveObject();
  if (!obj || obj===cropRect) return;
  if (axis==='h') obj.set('flipX', !obj.flipX); else obj.set('flipY', !obj.flipY);
  canvas.renderAll();
  pushHistory();
}
document.getElementById('btnFlipH').addEventListener('click', ()=>flipSelected('h'));
document.getElementById('btnFlipV').addEventListener('click', ()=>flipSelected('v'));

/* ===================== Molduras / overlays (composites.js) ===================== */
document.getElementById('btnBloom').addEventListener('click', ()=>{
  addBloomToObject(canvas, canvas.getActiveObject()).catch(e=>alert(e.message));
});
document.getElementById('btnGrunge').addEventListener('click', ()=>{
  if (typeof TEXTURE_PACK_GRUNGE === 'undefined'){ alert('Texturas de sujeira não carregadas.'); return; }
  addGrungeOverlay(canvas, canvasW, canvasH, TEXTURE_PACK_GRUNGE, Object.keys(TEXTURE_PACK_GRUNGE)).catch(e=>alert(e.message));
});
document.getElementById('btnPolaroid').addEventListener('click', ()=>{
  const obj = canvas.getActiveObject();
  if (!obj || obj.type!=='image'){ alert('Selecione uma foto primeiro.'); return; }
  addPolaroidFrame(canvas, obj);
  pushHistory();
});
document.getElementById('btnCCTV').addEventListener('click', ()=>{
  const obj = canvas.getActiveObject();
  if (!obj || obj.type!=='image'){ alert('Selecione uma foto primeiro.'); return; }
  addCCTVHud(canvas, obj);
  pushHistory();
});
document.getElementById('btnVHSBars').addEventListener('click', ()=>{
  const obj = canvas.getActiveObject();
  if (!obj || obj.type!=='image'){ alert('Selecione uma foto primeiro.'); return; }
  addVHSBars(canvas, obj);
  pushHistory();
});

/* ===================== Antes/depois (segurar espaço) ===================== */
let beforeAfterStash = null;
function toggleBeforeAfter(on){
  const obj = canvas.getActiveObject();
  if (!obj || obj.type!=='image') return;
  if (on){
    if (beforeAfterStash) return;
    beforeAfterStash = obj.filters;
    obj.filters = [];
    obj.applyFilters();
    canvas.renderAll();
  } else {
    if (!beforeAfterStash) return;
    obj.filters = beforeAfterStash;
    beforeAfterStash = null;
    obj.applyFilters();
    canvas.renderAll();
  }
}

/* ===================== Atalhos de teclado ===================== */
let spaceHeld = false;
document.addEventListener('keydown', e=>{
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (tag==='INPUT' || tag==='TEXTAREA' || tag==='SELECT') return;
  const obj = canvas.getActiveObject();
  if (obj && obj.isEditing) return;
  if (e.code==='Space'){
    if (obj && obj.type==='image' && !spaceHeld){ e.preventDefault(); spaceHeld=true; toggleBeforeAfter(true); }
    return;
  }
  if (e.key==='Delete' || e.key==='Backspace'){
    if (obj && obj!==cropRect){ e.preventDefault(); canvas.remove(obj); canvas.discardActiveObject(); canvas.renderAll(); updateFilterPanel(); }
  } else if (e.ctrlKey && e.key.toLowerCase()==='d'){
    if (obj){ e.preventDefault(); duplicateLayer(obj); }
  } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='z'){
    e.preventDefault(); redo();
  } else if (e.ctrlKey && e.key.toLowerCase()==='z'){
    e.preventDefault(); undo();
  }
});
document.addEventListener('keyup', e=>{
  if (e.code==='Space' && spaceHeld){ spaceHeld=false; toggleBeforeAfter(false); }
});
document.getElementById('btnUndo').addEventListener('click', undo);
document.getElementById('btnRedo').addEventListener('click', redo);

/* ===================== Exportar ===================== */
document.getElementById('btnExport').addEventListener('click', ()=>{
  if (!canvas.getObjects().filter(o=>o!==cropRect).length){ alert('Adicione uma imagem primeiro.'); return; }
  cancelCrop();
  const mult = +document.getElementById('exportScale').value;
  canvas.discardActiveObject(); canvas.renderAll();
  const dataUrl = canvas.toDataURL({format:'png', multiplier: mult/canvas.getZoom()});
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `imagelab_${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

document.fonts.ready.then(()=>{
  initCanvas();
  renderLayerList();
  updateUndoRedoButtons();
});
