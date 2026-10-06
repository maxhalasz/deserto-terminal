/* ===================== Composites compartilhados =====================
   Elementos de "composição" — objetos Fabric reais sobrepostos (não filtros de
   shader) — usados tanto pelo props-generator (fotos dentro de um documento)
   quanto pelo image-lab (foto solta). Cada função recebe o canvas e as
   dimensões/posição do que ela deve envolver como parâmetro, em vez de depender
   de globals fixos tipo PAGE_W/PAGE_H — assim funciona nos dois lugares sem
   modificação. `editor.js` (props-generator) e `image-lab.js` chamam essas
   funções em vez de manter cópia própria.

   Rastreio de dono (bug real reportado por Max, testando ao vivo): clicar
   "HUD CCTV" de novo empilhava um HUD em cima do outro em vez de trocar, e
   apagar a foto deixava o HUD/moldura órfão flutuando. Cada objeto "dono"
   (a foto) ganha um `__oid` (id estável, sobrevive no undo/redo porque
   HISTORY_PROPS em editor.js/image-lab.js inclui __oid/__ownerOid), e cada
   composite anexado guarda `__ownerOid` apontando pra ele. `addXOverlay`
   sempre remove qualquer composite do MESMO tipo já anexado àquele dono antes
   de adicionar (troca, não empilha), e `deleteObjectCascade` apaga os filhos
   junto do dono. */
let __oidCounter = 1;
function getOid(obj){
  if (!obj.__oid) obj.__oid = 'o'+(__oidCounter++)+'_'+Math.floor(Math.random()*1e6);
  return obj.__oid;
}
function removeOwnedByType(canvas, ownerOid, customTypes){
  canvas.getObjects().filter(o=>o.__ownerOid===ownerOid && customTypes.includes(o.customType)).forEach(o=>canvas.remove(o));
}
function deleteObjectCascade(canvas, obj){
  if (!obj) return;
  const oid = obj.__oid;
  canvas.remove(obj);
  if (oid){
    canvas.getObjects().filter(o=>o.__ownerOid===oid).forEach(o=>canvas.remove(o));
    // ligações de diagrama de rede não têm UM dono (__ownerOid) — têm duas pontas
    // (__linkA/__linkB) — apagar qualquer nó das duas pontas some com a ligação junto,
    // pra nunca sobrar uma linha órfã apontando pro vazio.
    canvas.getObjects().filter(o=>o.customType==='netLink' && (o.__linkA===oid || o.__linkB===oid)).forEach(o=>canvas.remove(o));
  }
}

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
   pelo chamador. Comentário antigo aqui dizia que as duas ferramentas liam do
   MESMO pack (TEXTURE_PACK) — não é verdade: props-generator usa TEX_CATS.grunge
   (editor.js) dentro de vendor/texture-pack.js (6.9MB, tudo: papel/mancha/jornal/
   grunge); image-lab usa vendor/texture-pack-grunge.js (1.5MB, só os 4 arquivos
   de grunge) — DE PROPÓSITO, não por descuido: a ferramenta é usada "possivelmente
   sem wifi" na mesa (ver CLAUDE.md), carregar o pack de 6.9MB inteiro só pelos 4
   arquivos de grunge não compensa. HOJE as duas listas têm EXATAMENTE os mesmos 4
   arquivos (metal_brushed_1/2, metal_rusted_1, metal_scratched_1 — conferido
   direto nos dois arquivos vendorizados), mas são duas fontes de verdade mesmo
   assim: se um dia adicionar/trocar uma textura de grunge, atualizar os DOIS
   lugares — TEX_CATS.grunge (editor.js) E vendor/texture-pack-grunge.js. */
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
   lados, grossa embaixo pra legenda) + legenda editável.
   Virou fabric.Group (rodada "refaz do zero" do Max) — frame+legenda eram 2 objetos soltos
   ligados só por __ownerOid, cada um sua própria linha na lista de camadas. Continuam NÃO
   agrupados com a FOTO em si — a foto precisa continuar selecionável sozinha (recorte,
   filtro, trocar foto), só a decoração em cima dela virou uma peça só. A legenda edita pelo
   mesmo modal de sempre (duplo clique → e.subTargets, editor.js), `.set('text',...)` simples
   bastando porque legenda não redimensiona nada ao lado (diferente do carimbo). ---- */
function addPolaroidFrame(canvas, obj){
  if (!obj) return null;
  const oid = getOid(obj);
  removeOwnedByType(canvas, oid, ['polaroid']);
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
  const caption = new fabric.IText('legenda...', {
    left: obj.left + bw/2, top: obj.top + bh + border*0.55,
    fontFamily:"'Caveat'", fontSize: Math.max(16, bh*0.05), fill:'#2b2b2b',
    originX:'center', originY:'top', textAlign:'center',
  });
  caption.set('customType','polaroidCaption');
  const group = new fabric.Group([frame, caption], {subTargetCheck:true, interactive:false});
  group.set('customType','polaroid');
  group.__ownerOid = oid;
  group.__labName = '🖼 Moldura Polaroid';
  canvas.add(group);
  canvas.sendObjectToBack(group);
  canvas.setActiveObject(obj);
  canvas.renderAll();
  return group;
}

/* ---- HUD de câmera de segurança: timestamp + REC + ID da câmera, texto
   monoespaçado editável nos cantos do objeto. Virou Group — mesmo raciocínio do Polaroid. ---- */
function addCCTVHud(canvas, obj){
  if (!obj) return null;
  const oid = getOid(obj);
  removeOwnedByType(canvas, oid, ['cctvHud']);
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
  [rec,cam,stamp].forEach(o=>o.set('customType','cctvHudText'));
  const group = new fabric.Group([rec,cam,stamp], {subTargetCheck:true, interactive:false});
  group.set('customType','cctvHud');
  group.__ownerOid = oid;
  group.__labName = '📹 HUD câmera';
  canvas.add(group);
  canvas.renderAll();
  return group;
}

/* ---- Barras VHS: letterbox preto em cima/embaixo + faixa fina de ruído de
   trilha junto de uma das bordas. Virou Group — nada aqui é editável (não há texto), só
   reunia 3 Rects soltos ligados por __ownerOid sem motivo pra continuarem separados. ---- */
function addVHSBars(canvas, obj){
  if (!obj) return null;
  const oid = getOid(obj);
  removeOwnedByType(canvas, oid, ['vhsBar']);
  const bw = obj.getScaledWidth(), bh = obj.getScaledHeight();
  const barH = bh*0.075;
  const top = new fabric.Rect({left:obj.left, top:obj.top, width:bw, height:barH, fill:'#000', originX:'left', originY:'top'});
  const bottom = new fabric.Rect({left:obj.left, top:obj.top+bh-barH, width:bw, height:barH, fill:'#000', originX:'left', originY:'top'});
  const track = new fabric.Rect({left:obj.left, top:obj.top+bh-barH-barH*0.22, width:bw, height:barH*0.22, fill:'rgba(225,225,225,0.55)', originX:'left', originY:'top'});
  const group = new fabric.Group([top,bottom,track], {subTargetCheck:false, interactive:false});
  group.set('customType','vhsBar');
  group.__ownerOid = oid;
  group.__labName = '▬ Barras VHS';
  canvas.add(group);
  canvas.renderAll();
  return group;
}
