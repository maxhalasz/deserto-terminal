/* ===================== Diagrama de rede editável =====================
   Pedido do Max: o diagrama de rede da NeuroStat parecia um mapa de verdade mas era só
   arte plana — as caixas e ligações não existiam como objetos, só a arte travada por
   baixo. Aqui viram objetos Fabric de verdade: cada "nó" é uma caixa (Rect) + um rótulo
   (Textbox de 2 linhas, editável pelo modal normal) que se move junto, cada "ligação" é
   uma Line que segue os dois nós que conecta. Não é exclusivo de um documento — os
   botões "+ Nó de rede" / "🔗 Ligação" ficam na aba Adicionar, funcionam em qualquer
   documento (igual carimbo/marca d'água), e o diagrama da NeuroStat só usa isso pra
   montar a topologia inicial (ver buildDiagramTopology em brand.js). */

function makeNetworkNode(opts){
  opts = opts || {};
  const w = opts.width || 140, h = opts.height || 70;
  const stroke = opts.stroke || '#bcd4e8';
  const box = new fabric.Rect({
    left: opts.left||300, top: opts.top||300, width: w, height: h,
    fill: opts.fill || 'transparent', stroke, strokeWidth: 1.4,
    originX:'center', originY:'center',
  });
  box.set('customType','netNode');
  const oid = getOid(box);
  const label = new fabric.Textbox((opts.title||'NODE')+'\n'+(opts.sub||''), {
    left: box.left, top: box.top, width: w-10,
    fontFamily: "'Roboto Condensed','Arial Narrow',sans-serif", fontWeight:700, fontSize: opts.fontSize||13,
    fill: stroke, textAlign:'center', originX:'center', originY:'center', editable:false,
  });
  label.set('customType','netNodeLabel');
  label.__ownerOid = oid;
  box.__labName = '▭ Nó de rede';
  label.__labName = '▭ Rótulo do nó';
  return [box, label];
}
/* O rótulo acompanhar a caixa e as ligações se recalcularem sozinhas usa UM listener só,
   no nível do canvas (ligado uma vez em initCanvas, editor.js) em vez de listener por
   objeto — objetos reconstruídos por canvas.loadFromJSON (desfazer/refazer, trocar de
   lado e voltar) são instâncias NOVAS sem os listeners originais; um handler genérico no
   canvas não depende de nenhuma instância específica, então sobrevive a isso. */
function networkSyncOnObjectMoving(e){
  const box = e.target;
  if (!box || box.customType!=='netNode' || !box.canvas) return;
  const oid = box.__oid;
  const label = box.canvas.getObjects().find(o=>o.customType==='netNodeLabel' && o.__ownerOid===oid);
  if (label) label.set({left:box.left, top:box.top, scaleX:1, scaleY:1, width:(box.width*box.scaleX)-10}).setCoords();
  syncNetworkLinks(box);
}

/* Liga dois nós (as CAIXAS, não os rótulos) por uma linha reta entre os centros. Guarda os
   oids das duas pontas pra se recalcular sozinha quando qualquer uma das duas se move —
   não dá pra usar o padrão dono único (__ownerOid) porque uma ligação tem DOIS donos. */
function makeNetworkLink(nodeA, nodeB, opts){
  opts = opts || {};
  const line = new fabric.Line([nodeA.left, nodeA.top, nodeB.left, nodeB.top], {
    stroke: opts.stroke || '#6fa8d8', strokeWidth: opts.strokeWidth || 1.3,
    strokeDashArray: opts.dashed ? [4,3] : null,
    selectable:true, evented:true,
  });
  line.set('customType','netLink');
  line.__linkA = getOid(nodeA);
  line.__linkB = getOid(nodeB);
  line.__labName = '— Ligação';
  return line;
}
function syncNetworkLinks(movedNode){
  if (!movedNode.canvas) return;
  const oid = movedNode.__oid;
  movedNode.canvas.getObjects().filter(o=>o.customType==='netLink' && (o.__linkA===oid || o.__linkB===oid)).forEach(line=>{
    const a = movedNode.canvas.getObjects().find(o=>o.__oid===line.__linkA);
    const b = movedNode.canvas.getObjects().find(o=>o.__oid===line.__linkB);
    if (!a || !b) return;
    line.set({x1:a.left, y1:a.top, x2:b.left, y2:b.top});
    line.setCoords();
  });
}
/* Ao apagar um nó, some com a ligação junto (mesma lógica de deleteObjectCascade, mas
   pareada pelos DOIS lados — uma ligação nunca some sozinha órfã). */
function deleteNetworkNodeLinks(canvas, node){
  const oid = node.__oid;
  if (!oid) return;
  canvas.getObjects().filter(o=>o.customType==='netLink' && (o.__linkA===oid || o.__linkB===oid)).forEach(o=>canvas.remove(o));
}

/* ---- Modo de ligação: clique em dois nós em sequência pra conectar ---- */
let __netLinkMode = false, __netLinkFirst = null;
function toggleNetworkLinkMode(){
  __netLinkMode = !__netLinkMode;
  __netLinkFirst = null;
  document.querySelectorAll('.netLinkModeBtn').forEach(btn=>btn.classList.toggle('active', __netLinkMode));
  canvas.defaultCursor = __netLinkMode ? 'crosshair' : 'default';
  canvas.discardActiveObject(); canvas.renderAll();
}
function networkLinkModeClick(e){
  if (!__netLinkMode) return;
  const obj = e.target;
  if (!obj || obj.customType!=='netNode') return;
  if (!__netLinkFirst){ __netLinkFirst = obj; obj.__origStroke = obj.stroke; obj.set('stroke','#e0a72e'); canvas.renderAll(); return; }
  if (__netLinkFirst!==obj){
    const line = makeNetworkLink(__netLinkFirst, obj);
    canvas.add(line);
    canvas.sendObjectToBack(line);
    const art = canvas.getObjects().find(o=>o.customType==='brandArt'||o.customType==='background');
    if (art) canvas.sendObjectToBack(art);
    pushHistory();
  }
  __netLinkFirst.set('stroke', __netLinkFirst.__origStroke);
  __netLinkFirst = null;
  toggleNetworkLinkMode();
}
