/* ===================== Editor principal (Fabric.js) =====================
   PAGE_W/PAGE_H e o motor de layout do jornal (presets, colunas, pull-quote,
   caixa lateral) vêm de layout.js. */
const TEX_CATS = {
  paper_aged: ['paper_aged_1.jpg','paper_aged_2.jpg','paper_aged_3.jpg','paper_aged_4.jpg','paper_aged_5.jpg','paper_aged_6.jpg','paper_aged_7.jpg'],
  paper_notebook_ruled: ['paper_notebook_2.jpg','paper_notebook_4.jpg'],
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

/* Reconstrói só a parte do jornal gerada pelo motor de layout (customType
   'newspaperPart'), preservando qualquer outro objeto que o Max tenha adicionado
   à mão (o fundo de papel nunca é tocado). Usado pelos presets/controles de coluna. */
async function rebuildNewspaperLayout(){
  if (!currentNewsContent || !currentNewsLayout) return;
  canvas.getObjects().filter(o=>o.__newsGenerated).forEach(o=>canvas.remove(o));
  const objs = await buildNewspaperObjects(currentNewsContent, currentNewsLayout);
  objs.forEach(o=>canvas.add(o));
  canvas.renderAll();
  renderLayerList();
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
  canvas.on('object:modified', renderLayerList);
  canvas.on('object:added', e=>{
    renderLayerList();
    // nunca deixa o Fabric entrar no modo de edição nativo — sempre passa pelo
    // modal (cursor confiável, prévia ao vivo). Ver comentário em openTextEditor.
    const o = e.target;
    if (o && (o.type==='textbox' || o.type==='handwrittentext' || o.type==='redactedtext')) o.editable = false;
  });
  canvas.on('object:removed', renderLayerList);
  canvas.on('mouse:dblclick', e=>{
    const o = e.target;
    if (o && (o.type==='textbox' || o.type==='handwrittentext' || o.type==='redactedtext')) openTextEditor(o);
  });
  setZoom(0.5);
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

/* ---- grunge/dirt e bloom: composição de objetos (não shader duplo-textura) ---- */
function applyGrungeOverlay(){
  const rng = mulberry32(Math.floor(Math.random()*4294967296));
  const fname = pickFile('grunge', rng);
  fabric.Image.fromURL(TEXTURE_PACK[fname], {crossOrigin:'anonymous'}).then(img=>{
    img.set({
      left:0, top:0, originX:'left', originY:'top',
      scaleX: PAGE_W/img.width, scaleY: PAGE_H/img.height,
      globalCompositeOperation: rng()<0.5?'multiply':'screen',
      opacity: 0.18+rng()*0.15,
      selectable:true,
    });
    img.set('customType','grunge');
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();
  });
}
function applyBloomToSelected(){
  const obj = canvas.getActiveObject();
  if (!obj || obj.type!=='image') { alert('Selecione uma imagem primeiro.'); return; }
  obj.clone().then(clone=>{
    clone.filters = [new fabric.filters.Blur({blur:0.06}), new fabric.filters.Brightness({brightness:0.35})];
    clone.applyFilters();
    clone.set({globalCompositeOperation:'screen', opacity:0.7});
    clone.set('customType','bloom');
    canvas.add(clone);
    canvas.setActiveObject(clone);
    canvas.renderAll();
  });
}

/* ===================== Templates ===================== */
function clearDoc(){
  canvas.clear();
  canvas.backgroundColor = '#ffffff';
}

async function loadTemplate(name){
  currentTemplate = name;
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
  if (o.customType==='background') return '📄 Papel de fundo';
  if (o.customType==='stain') return '💧 Mancha';
  if (o.customType==='grunge') return '🪨 Sujeira/grunge';
  if (o.customType==='bloom') return '✨ Glow';
  if (o.customType==='stamp') return '🔖 Carimbo';
  if (o.customType==='barcode') return '▮ Código de barras';
  if (o.customType==='photoPlaceholder') return '🖼 Placeholder de foto';
  if (o.customType==='photo') return '🖼 Foto';
  if (o.type==='handwrittentext') return '✎ ' + (o.text||'').slice(0,18);
  if (o.type==='redactedtext') return '▬ ' + (o.text||'').slice(0,18);
  if (o.type==='textbox') return 'T ' + (o.text||'').slice(0,18);
  return o.type;
}
function renderLayerList(){
  const box = document.getElementById('layerList');
  box.innerHTML = '';
  const objs = canvas.getObjects().slice().reverse();
  const active = canvas.getActiveObject();
  objs.forEach(o=>{
    const row = document.createElement('div');
    row.className = 'layerRow' + (o===active?' active':'');
    const nm = document.createElement('span'); nm.className='nm'; nm.textContent = objLabel(o);
    row.appendChild(nm);
    if (o.customType!=='background'){
      const del = document.createElement('button'); del.textContent='✕';
      del.addEventListener('click', (ev)=>{ ev.stopPropagation(); canvas.remove(o); canvas.renderAll(); });
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
  if (e.key==='Escape' && !document.getElementById('editorModal').hidden) closeTextEditor();
});

/* ===================== Inspetor (painel do objeto selecionado) =====================
   FILTER_REGISTRY, PRESETS, labeledRange, renderFilterPanel etc vêm de filter-panel.js
   (compartilhado com image-lab.html). */
function updateInspector(){
  const obj = canvas.getActiveObject();
  const panel = document.getElementById('inspector');
  const body = document.getElementById('inspectorBody');
  renderLayerList();
  if (!obj){ panel.classList.remove('show'); body.innerHTML=''; return; }
  panel.classList.add('show');
  body.innerHTML = '';

  if (obj.type==='textbox' || obj.type==='handwrittentext' || obj.type==='redactedtext'){
    renderTextInspector(obj, body);
  }
  if (obj.type==='image'){
    renderImageInspector(obj, body);
  }
  if (obj.customType==='background'){
    renderBackgroundInspector(obj, body);
  }

  const dup = document.createElement('button');
  dup.textContent = 'Duplicar';
  dup.addEventListener('click', ()=>{
    obj.clone().then(c=>{ c.set({left:obj.left+20, top:obj.top+20}); canvas.add(c); canvas.setActiveObject(c); canvas.renderAll(); });
  });
  body.appendChild(dup);
  if (obj.customType!=='background'){
    const del = document.createElement('button');
    del.textContent = 'Excluir'; del.className='danger';
    del.addEventListener('click', ()=>{ canvas.remove(obj); canvas.discardActiveObject(); canvas.renderAll(); });
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
  ['paper_aged','paper_notebook_ruled','paper_notebook_plain','paper_newsprint'].forEach(c=>{
    const o=document.createElement('option'); o.value=c; o.textContent=c; catSel.appendChild(o);
  });
  body.appendChild(catLab); body.appendChild(catSel);
  const swapBtn = document.createElement('button'); swapBtn.textContent='🎲 Trocar papel';
  swapBtn.addEventListener('click', async ()=>{
    const age = (obj.filters[0]&&obj.filters[0].amount)||0.4;
    await setBackgroundPaper(pickFile(catSel.value), {age});
    canvas.renderAll(); updateInspector();
  });
  body.appendChild(swapBtn);

  const ageFilter = (obj.filters||[])[0];
  if (ageFilter){
    body.appendChild(labeledRange('Idade do papel', ageFilter.amount, 0, 1, 0.01, v=>{
      ageFilter.amount = v; obj.applyFilters(); canvas.renderAll();
    }));
  }

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
  initCanvas();
  loadTemplate('newspaper');
});
