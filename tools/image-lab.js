/* ===================== Image Lab — ferramenta independente de efeitos =====================
   Sem noção de "documento"/"template" — só um canvas onde cada foto importada vira
   uma camada com filtros próprios. Reaproveita filters.js + filter-panel.js, que
   também são usados pelo props-generator (mesmo motor, dois lugares diferentes). */

let canvas;
let canvasW = 1400, canvasH = 1000;

function initCanvas(){
  canvas = new fabric.Canvas('labCanvas', {
    width: canvasW, height: canvasH,
    backgroundColor: '#111318',
    preserveObjectStacking: true,
  });
  canvas.on('selection:created', updateFilterPanel);
  canvas.on('selection:updated', updateFilterPanel);
  canvas.on('selection:cleared', updateFilterPanel);
  canvas.on('object:added', renderLayerList);
  canvas.on('object:removed', renderLayerList);
  setZoom(0.5);
}
function setZoom(z){
  const wrap = document.getElementById('canvasWrap');
  wrap.style.width = (canvasW*z)+'px';
  wrap.style.height = (canvasH*z)+'px';
  canvas.setZoom(z);
  canvas.setDimensions({width:canvasW*z, height:canvasH*z});
}
document.querySelectorAll('.zoomrow button').forEach(b=>{
  b.addEventListener('click', ()=>setZoom(+b.dataset.z));
});

let layerCount = 0;
function addImageFromDataURL(dataUrl, atPoint){
  fabric.Image.fromURL(dataUrl).then(img=>{
    layerCount++;
    img.__labName = 'Foto ' + layerCount;
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
function loadFile(file, atPoint){
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = e => addImageFromDataURL(e.target.result, atPoint);
  reader.readAsDataURL(file);
}

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
dropZone.addEventListener('click', ()=>fileInput.click());
fileInput.addEventListener('change', e=>{ if (e.target.files[0]) loadFile(e.target.files[0]); e.target.value=''; });
['dragenter','dragover'].forEach(ev=>dropZone.addEventListener(ev, e=>{ e.preventDefault(); dropZone.classList.add('drag'); }));
['dragleave','drop'].forEach(ev=>dropZone.addEventListener(ev, e=>{ e.preventDefault(); dropZone.classList.remove('drag'); }));
dropZone.addEventListener('drop', e=>{ if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });

const canvasWrap = document.getElementById('canvasWrap');
canvasWrap.addEventListener('dragover', e=>e.preventDefault());
canvasWrap.addEventListener('drop', e=>{
  e.preventDefault();
  const f = e.dataTransfer.files[0]; if (!f) return;
  const rect = canvasWrap.getBoundingClientRect();
  const z = canvas.getZoom();
  loadFile(f, {x:(e.clientX-rect.left)/z, y:(e.clientY-rect.top)/z});
});

function renderLayerList(){
  const box = document.getElementById('layerList');
  box.innerHTML = '';
  const objs = canvas.getObjects().slice().reverse();
  const active = canvas.getActiveObject();
  objs.forEach(o=>{
    const row = document.createElement('div');
    row.className = 'layerRow' + (o===active?' active':'');
    const nm = document.createElement('span'); nm.className='nm'; nm.textContent = o.__labName||'Foto';
    row.appendChild(nm);
    const del = document.createElement('button'); del.textContent='✕';
    del.addEventListener('click', ev=>{ ev.stopPropagation(); canvas.remove(o); canvas.renderAll(); updateFilterPanel(); });
    row.appendChild(del);
    row.addEventListener('click', ()=>{ canvas.setActiveObject(o); canvas.renderAll(); updateFilterPanel(); });
    box.appendChild(row);
  });
}

function updateFilterPanel(){
  renderLayerList();
  const obj = canvas.getActiveObject();
  const fieldset = document.getElementById('filterFieldset');
  const host = document.getElementById('filterPanelHost');
  if (!obj || obj.type!=='image'){ fieldset.style.display='none'; return; }
  fieldset.style.display='block';
  renderFilterPanel(canvas, obj, host);
}
document.getElementById('btnDelete').addEventListener('click', ()=>{
  const obj = canvas.getActiveObject();
  if (!obj) return;
  canvas.remove(obj); canvas.discardActiveObject(); canvas.renderAll();
  updateFilterPanel();
});

document.getElementById('btnExport').addEventListener('click', ()=>{
  if (!canvas.getObjects().length){ alert('Adicione uma imagem primeiro.'); return; }
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
});
