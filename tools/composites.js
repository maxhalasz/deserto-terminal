/* ===================== Composites compartilhados =====================
   Elementos de "composição" — objetos Fabric reais sobrepostos (não filtros de
   shader) — usados tanto pelo props-generator (fotos dentro de um documento)
   quanto pelo image-lab (foto solta). Cada função recebe o canvas e as
   dimensões/posição do que ela deve envolver como parâmetro, em vez de depender
   de globals fixos tipo PAGE_W/PAGE_H — assim funciona nos dois lugares sem
   modificação. `editor.js` (props-generator) e `image-lab.js` chamam essas
   funções em vez de manter cópia própria. */

/* ---- Bloom/glow: clona o objeto, desfoca+clareia, blend screen por cima ---- */
function addBloomToObject(canvas, obj){
  if (!obj || obj.type!=='image') return Promise.reject(new Error('Selecione uma imagem primeiro.'));
  return obj.clone().then(clone=>{
    clone.filters = [new fabric.filters.Blur({blur:0.06}), new fabric.filters.Brightness({brightness:0.35})];
    clone.applyFilters();
    clone.set({globalCompositeOperation:'screen', opacity:0.7});
    clone.set('customType','bloom');
    canvas.add(clone);
    canvas.setActiveObject(clone);
    canvas.renderAll();
    return clone;
  });
}

/* ---- Sujeira/grunge: uma textura de metal arranhado/enferrujado por cima,
   multiply ou screen, opacidade baixa. `files` é a lista de nomes já resolvida
   pelo chamador (props-generator usa TEX_CATS.grunge; image-lab usa a mesma
   lista, ambos lendo de TEXTURE_PACK). */
function addGrungeOverlay(canvas, w, h, texturePack, files){
  if (!files || !files.length) return Promise.reject(new Error('Sem texturas de sujeira carregadas.'));
  const fname = files[Math.floor(Math.random()*files.length)];
  return fabric.Image.fromURL(texturePack[fname], {crossOrigin:'anonymous'}).then(img=>{
    img.set({
      left:0, top:0, originX:'left', originY:'top',
      scaleX: w/img.width, scaleY: h/img.height,
      globalCompositeOperation: Math.random()<0.5?'multiply':'screen',
      opacity: 0.18+Math.random()*0.15,
      selectable:true,
    });
    img.set('customType','grunge');
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();
    return img;
  });
}

/* ---- Moldura Polaroid: retângulo branco por trás do objeto (borda fina nos 3
   lados, grossa embaixo pra legenda) + legenda editável. ---- */
function addPolaroidFrame(canvas, obj){
  if (!obj) return null;
  const bw = obj.getScaledWidth(), bh = obj.getScaledHeight();
  const border = Math.max(bw,bh)*0.06;
  const bottomBorder = border*3.4;
  const frame = new fabric.Rect({
    left: obj.left - border, top: obj.top - border,
    width: bw + border*2, height: bh + border + bottomBorder,
    fill: '#f4f1ea', originX:'left', originY:'top',
    shadow: new fabric.Shadow({color:'rgba(0,0,0,0.35)', blur:16, offsetX:0, offsetY:8}),
  });
  frame.set('customType','polaroidFrame');
  canvas.add(frame);
  canvas.sendObjectToBack(frame);
  const caption = new fabric.IText('legenda...', {
    left: obj.left + bw/2, top: obj.top + bh + border*0.55,
    fontFamily:"'Caveat'", fontSize: Math.max(16, bh*0.05), fill:'#2b2b2b',
    originX:'center', originY:'top', textAlign:'center',
  });
  caption.set('customType','polaroidCaption');
  canvas.add(caption);
  canvas.setActiveObject(obj);
  canvas.renderAll();
  return {frame, caption};
}

/* ---- HUD de câmera de segurança: timestamp + REC + ID da câmera, texto
   monoespaçado editável nos cantos do objeto. ---- */
function addCCTVHud(canvas, obj){
  if (!obj) return null;
  const bw = obj.getScaledWidth(), bh = obj.getScaledHeight();
  const fontSize = Math.max(13, bh*0.032);
  const now = new Date();
  const pad = n=>String(n).padStart(2,'0');
  const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}  ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const base = {fontFamily:"'Courier Prime'", fontSize, originX:'left', originY:'top'};
  const rec = new fabric.IText('● REC', Object.assign({}, base, {
    left: obj.left+fontSize*0.7, top: obj.top+fontSize*0.7, fill:'#ff3b3b'}));
  const cam = new fabric.IText('CAM 04', Object.assign({}, base, {
    left: obj.left+bw-fontSize*5.2, top: obj.top+fontSize*0.7, fill:'#d8e8d8'}));
  const stamp = new fabric.IText(ts, Object.assign({}, base, {
    left: obj.left+fontSize*0.7, top: obj.top+bh-fontSize*1.9, fill:'#d8e8d8'}));
  [rec,cam,stamp].forEach(o=>{ o.set('customType','cctvHud'); canvas.add(o); });
  canvas.renderAll();
  return [rec,cam,stamp];
}

/* ---- Barras VHS: letterbox preto em cima/embaixo + faixa fina de ruído de
   trilha junto de uma das bordas. ---- */
function addVHSBars(canvas, obj){
  if (!obj) return null;
  const bw = obj.getScaledWidth(), bh = obj.getScaledHeight();
  const barH = bh*0.075;
  const top = new fabric.Rect({left:obj.left, top:obj.top, width:bw, height:barH, fill:'#000', originX:'left', originY:'top'});
  const bottom = new fabric.Rect({left:obj.left, top:obj.top+bh-barH, width:bw, height:barH, fill:'#000', originX:'left', originY:'top'});
  const track = new fabric.Rect({left:obj.left, top:obj.top+bh-barH-barH*0.22, width:bw, height:barH*0.22, fill:'rgba(225,225,225,0.55)', originX:'left', originY:'top'});
  [top,bottom,track].forEach(o=>{ o.set('customType','vhsBar'); canvas.add(o); });
  canvas.renderAll();
  return [top,bottom,track];
}
