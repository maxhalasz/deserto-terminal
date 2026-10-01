/* ===================== Diagrama de rede editável =====================
   Pedido do Max: o diagrama de rede da NeuroStat parecia um mapa de verdade mas era só
   arte plana — as caixas e ligações não existiam como objetos, só a arte travada por
   baixo. Aqui viram objetos Fabric de verdade: cada "nó" é uma caixa (Rect) + um rótulo
   (Textbox de 2 linhas, editável pelo modal normal) + um acento de canto que se move
   junto, cada "ligação" é um conector em ângulo reto que segue os dois nós que conecta.
   Não é exclusivo de um documento — os botões "+ Nó de rede" / "🔗 Ligação" ficam na aba
   Adicionar, funcionam em qualquer documento (igual carimbo/marca d'água), e o diagrama
   da NeuroStat só usa isso pra montar a topologia inicial (ver buildDiagramTopology em
   brand.js).

   Revisão 2026-10-01 (feedback do Max: "só to arrastando um monte de imagens e fica feio
   pra caralho"): a v1 ligava CENTRO a CENTRO com uma linha reta — sem preenchimento
   opaco na caixa, a linha aparecia atravessando por dentro dela, e cruzando qualquer
   outro nó que estivesse no caminho. Duas mudanças: (1) conector agora é um "elbow" em
   ângulo reto (sai da borda do nó virada pro destino, UMA dobra de 90° no meio — o mesmo
   tipo de conector de qualquer ferramenta de diagrama tipo Visio/draw.io), nunca mais
   diagonal nem atravessando centro de caixa; (2) a caixa ganhou preenchimento semi-opaco
   (não é mais transparente) + cantos levemente arredondados + um acento de canto, pra ler
   como um "painel"/dispositivo de verdade em vez de um retângulo vazio flutuando sobre a
   arte. Arrastar também passou a alinhar num grid de 20px — sem isso, reposicionar nó a
   nó à mão nunca ficava alinhado. */

function makeNetworkNode(opts){
  opts = opts || {};
  const w = opts.width || 140, h = opts.height || 70;
  const stroke = opts.stroke || '#bcd4e8';
  const accentColor = opts.accent || '#6fa8d8';
  const box = new fabric.Rect({
    left: opts.left||300, top: opts.top||300, width: w, height: h,
    fill: opts.fill || 'rgba(15,41,66,0.6)', stroke, strokeWidth: 1.4,
    rx: 3, ry: 3,
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
  // Acento de canto: marcador pequeno, não selecionável sozinho — lê como indicador de
  // porta/dispositivo (linguagem de diagrama técnico), não como decoração solta.
  const accent = new fabric.Rect({
    left: box.left - w/2 + 5, top: box.top - h/2 + 5, width:6, height:6,
    fill: accentColor, originX:'left', originY:'top', selectable:false, evented:false,
  });
  accent.set('customType','netNodeAccent');
  accent.__ownerOid = oid;
  box.__labName = '▭ Nó de rede';
  label.__labName = '▭ Rótulo do nó';
  accent.__labName = '◆ Acento do nó';
  return [box, label, accent];
}
/* Rótulo/acento acompanharem a caixa e as ligações se recalcularem sozinhas usa UM
   listener só, no nível do canvas (ligado uma vez em initCanvas, editor.js) em vez de
   listener por objeto — objetos reconstruídos por canvas.loadFromJSON (desfazer/refazer,
   trocar de lado e voltar, trocar de página) são instâncias NOVAS sem os listeners
   originais; um handler genérico no canvas não depende de nenhuma instância específica,
   então sobrevive a isso. O alinhamento/snap em si NÃO é mais feito aqui — virou o sistema
   genérico de guias (editor.js, applyAlignmentSnap) que roda ANTES deste handler pra
   QUALQUER objeto, nó de rede incluso; este handler só reage à posição (já alinhada) pra
   mover rótulo/acento/ligações junto. */
function networkSyncOnObjectMoving(e){
  const box = e.target;
  if (!box || box.customType!=='netNode' || !box.canvas) return;
  const oid = box.__oid;
  const bw = box.getScaledWidth(), bh = box.getScaledHeight();
  box.canvas.getObjects().forEach(o=>{
    if (o.__ownerOid !== oid) return;
    if (o.customType==='netNodeLabel'){
      o.set({left:box.left, top:box.top, scaleX:1, scaleY:1, width:bw-10}).setCoords();
    } else if (o.customType==='netNodeAccent'){
      o.set({left: box.left-bw/2+5, top: box.top-bh/2+5}).setCoords();
    }
  });
  syncNetworkLinks(box);
}

/* Caminho em ângulo reto (conector "elbow", estilo diagrama técnico) entre as bordas de
   dois nós — sai do lado de CADA caixa que fica de frente pro outro nó (nunca do centro),
   com uma única dobra de 90° no meio do trecho. Decide eixo dominante pela maior distância
   (horizontal vs vertical) entre os centros. */
function orthogonalPath(A, B){
  const aw = A.getScaledWidth(), ah = A.getScaledHeight();
  const bw = B.getScaledWidth(), bh = B.getScaledHeight();
  const dx = B.left - A.left, dy = B.top - A.top;
  if (Math.abs(dx) >= Math.abs(dy)){
    const dir = dx >= 0 ? 1 : -1;
    const sx = A.left + dir*aw/2, sy = A.top;
    const ex = B.left - dir*bw/2, ey = B.top;
    const midX = (sx+ex)/2;
    return [{x:sx,y:sy},{x:midX,y:sy},{x:midX,y:ey},{x:ex,y:ey}];
  }
  const dir = dy >= 0 ? 1 : -1;
  const sx = A.left, sy = A.top + dir*ah/2;
  const ex = B.left, ey = B.top - dir*bh/2;
  const midY = (sy+ey)/2;
  return [{x:sx,y:sy},{x:sx,y:midY},{x:ex,y:midY},{x:ex,y:ey}];
}
/* Liga dois nós (as CAIXAS, não os rótulos) por um conector em ângulo reto. Guarda os
   oids das duas pontas pra se recalcular sozinha quando qualquer uma das duas se move —
   não dá pra usar o padrão dono único (__ownerOid) porque uma ligação tem DOIS donos. */
function makeNetworkLink(nodeA, nodeB, opts){
  opts = opts || {};
  const pts = orthogonalPath(nodeA, nodeB);
  const line = new fabric.Polyline(pts, {
    fill: '', stroke: opts.stroke || '#6fa8d8', strokeWidth: opts.strokeWidth || 1.5,
    strokeDashArray: opts.dashed ? [4,3] : null,
    selectable: true, evented: true, objectCaching: false,
  });
  line.set('customType','netLink');
  line.__linkA = getOid(nodeA);
  line.__linkB = getOid(nodeB);
  line.__labName = '— Ligação';
  return line;
}
/* Fabric.Polyline não recalcula sozinho bounding box/pathOffset se a gente só trocar
   `.points` na mão (métodos internos de recálculo são privados e variam entre versões) —
   mais simples e robusto é descartar a ligação velha e criar outra já com os pontos
   certos, reusando EXATAMENTE a mesma função de criação (nenhuma lógica de geometria
   duplicada). Embrulhado em restoringHistory porque isso dispara várias vezes por segundo
   durante um arrasto — sem a trava, cada remove+add viraria um push de desfazer. */
function syncNetworkLinks(movedNode){
  const cv = movedNode.canvas;
  if (!cv) return;
  const oid = movedNode.__oid;
  beginBatch();
  let touched = false;
  try {
    cv.getObjects().filter(o=>o.customType==='netLink' && (o.__linkA===oid || o.__linkB===oid)).forEach(line=>{
      const a = cv.getObjects().find(o=>o.__oid===line.__linkA);
      const b = cv.getObjects().find(o=>o.__oid===line.__linkB);
      if (!a || !b) return;
      const fresh = makeNetworkLink(a, b, {stroke: line.stroke, strokeWidth: line.strokeWidth, dashed: !!line.strokeDashArray});
      cv.remove(line);
      cv.add(fresh);
      cv.sendObjectToBack(fresh);
      touched = true;
    });
    if (touched){
      const art = cv.getObjects().find(o=>o.customType==='brandArt'||o.customType==='background');
      if (art) cv.sendObjectToBack(art);
    }
  } finally { endBatch(); }
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
