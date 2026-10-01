/* ===================== Diagrama de rede editável =====================
   Pedido do Max: o diagrama de rede da NeuroStat parecia um mapa de verdade mas era só
   arte plana — as caixas e ligações não existiam como objetos, só a arte travada por
   baixo. Aqui viram objetos Fabric de verdade. Não é exclusivo de um documento — o botão
   "+ Nó de rede" fica na aba Adicionar, funciona em qualquer documento (igual carimbo/
   marca d'água), e o diagrama da NeuroStat só usa isso pra montar a topologia inicial (ver
   buildDiagramTopology em brand.js).

   Revisão 2026-10-01, duas rodadas de feedback do Max:
   1ª ("só to arrastando um monte de imagens e fica feio pra caralho"): conector virou um
   "elbow" em ângulo reto (sai da borda do nó virada pro destino, não mais centro a centro
   diagonal), caixa ganhou preenchimento semi-opaco + acento de canto.
   2ª ("refaz do zero, você sequer entende o que tá fazendo... isso está amador"): o nó
   inteiro (caixa+rótulo+acento) agora é um `fabric.Group` de verdade — antes eram 3
   objetos soltos colados por uma string (__ownerOid) e resincronizados por um listener que
   varria o CANVAS INTEIRO a cada tick de arrasto. Um Group não precisa disso: o Fabric já
   move/escala os filhos junto nativamente. `subTargetCheck:true` + `interactive:false`
   (confirmado no fonte vendorizado do Fabric 6.4.3, testado ao vivo com duplo clique real)
   deixa o grupo arrastar como UMA peça rígida mas ainda relata qual filho foi clicado via
   `e.subTargets` — é assim que o duplo clique no rótulo continua abrindo o modal de texto
   de sempre (editor.js cuida disso agora, não é mais código daqui). O modo "clica A, clica
   B pra ligar" também saiu: agora existe uma alcinha de conexão (pontinho laranja na borda
   direita de cada nó) que se arrasta até outro nó, com uma linha de prévia ao vivo — é o
   padrão de qualquer ferramenta de diagrama de verdade (confirmado em pesquisa: draw.io,
   React Flow etc. todos usam arrastar-de-uma-porta em vez de alternador de modo). Adicionar
   nó também virou clique-na-ferramenta → clique-no-canvas-onde-quer, não nasce mais sempre
   no centro. */

function makeNetworkNode(opts){
  opts = opts || {};
  const w = opts.width || 140, h = opts.height || 70;
  const stroke = opts.stroke || '#bcd4e8';
  const accentColor = opts.accent || '#6fa8d8';
  const cx = opts.left||300, cy = opts.top||300;
  const box = new fabric.Rect({
    left: cx, top: cy, width: w, height: h,
    fill: opts.fill || 'rgba(15,41,66,0.6)', stroke, strokeWidth: 1.4,
    rx: 3, ry: 3, originX:'center', originY:'center',
  });
  box.set('customType','netNodeBox');
  const label = new fabric.Textbox((opts.title||'NODE')+'\n'+(opts.sub||''), {
    left: cx, top: cy, width: w-10,
    fontFamily: "'Roboto Condensed','Arial Narrow',sans-serif", fontWeight:700, fontSize: opts.fontSize||13,
    fill: stroke, textAlign:'center', originX:'center', originY:'center', editable:false,
  });
  label.set('customType','netNodeLabel');
  // Acento de canto: marcador pequeno, decorativo — lê como indicador de porta/dispositivo
  // (linguagem de diagrama técnico), não como decoração solta.
  const accent = new fabric.Rect({
    left: cx - w/2 + 5, top: cy - h/2 + 5, width:6, height:6,
    fill: accentColor, originX:'left', originY:'top', selectable:false, evented:false,
  });
  accent.set('customType','netNodeAccent');
  // Fabric.Group, dado um array de objetos já posicionados em coordenada ABSOLUTA de
  // canvas, calcula a própria bounding box e converte os filhos pra coordenada relativa
  // ao grupo sozinho (confirmado ao vivo) — não precisa reescrever as posições acima em
  // coordenada local na mão.
  const group = new fabric.Group([box, label, accent], {
    subTargetCheck: true, interactive: false,
  });
  group.set('customType','netNode');
  const oid = getOid(group);
  group.__labName = '▭ Nó de rede';

  // Alça de conexão: único objeto de TOPO fora do grupo — precisa de mousedown próprio
  // pra iniciar o arrasto-de-ligação, e um filho de grupo não-interativo não recebe isso
  // sozinho. Reposicionada com UM set() simples sempre que o nó se move (bem mais barato
  // que a antiga varredura de __ownerOid no canvas inteiro, porque é só ESTE objeto).
  const handle = new fabric.Circle({
    radius: 5, left: cx+w/2, top: cy, fill: accentColor, stroke:'#1b1e24', strokeWidth:1,
    originX:'center', originY:'center', selectable:false, hasControls:false,
    hoverCursor:'crosshair', evented:true,
  });
  handle.set('customType','netConnectHandle');
  handle.__ownerOid = oid;
  handle.__labName = '◆ Alça de ligação';
  return [group, handle];
}

/* Chamado pelo listener genérico de object:moving/scaling/modified (editor.js) quando o
   alvo é um nó de rede — só precisa reposicionar a alça de conexão (rótulo/acento já
   acompanham sozinhos, são filhos do Group) e recalcular as ligações conectadas. */
function networkSyncOnObjectMoving(e){
  const node = e.target;
  if (!node || node.customType!=='netNode' || !node.canvas) return;
  const oid = node.__oid;
  const bw = node.getScaledWidth();
  const handle = node.canvas.getObjects().find(o=>o.customType==='netConnectHandle' && o.__ownerOid===oid);
  if (handle) handle.set({left: node.left+bw/2, top: node.top}).setCoords();
  syncNetworkLinks(node);
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
/* Liga dois nós por um conector em ângulo reto. Guarda os oids das duas pontas pra se
   recalcular sozinha quando qualquer uma das duas se move — não dá pra usar o padrão dono
   único (__ownerOid) porque uma ligação tem DOIS donos. */
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
   duplicada). Embrulhado em beginBatch/endBatch porque isso dispara várias vezes por
   segundo durante um arrasto — sem a trava, cada remove+add viraria um push de desfazer. */
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

/* ---- Adicionar nó: clique na ferramenta, depois clique no canvas onde quer colocar ---- */
let __placingNetNode = false;
function armPlaceNetNode(){
  __placingNetNode = true;
  canvas.defaultCursor = 'crosshair';
  document.querySelectorAll('.netLinkModeBtn').forEach(btn=>btn.classList.add('active'));
}
function cancelPlaceNetNode(){
  __placingNetNode = false;
  canvas.defaultCursor = 'default';
  document.querySelectorAll('.netLinkModeBtn').forEach(btn=>btn.classList.remove('active'));
}

/* ---- Ligar arrastando: mousedown na alça laranja começa, uma linha de prévia segue o
   cursor, soltar sobre outro nó cria a ligação de verdade. Um handler só cobre os dois
   fluxos (colocar nó / começar a arrastar ligação) porque os dois decidem o que fazer a
   partir do PRIMEIRO clique no canvas, e só um dos dois pode estar em curso por vez. ---- */
let __connectFrom = null, __connectPreviewLine = null;
function networkMouseDown(e){
  if (__placingNetNode){
    if (!e.target){
      const p = canvas.getPointer(e.e);
      const [node, handle] = makeNetworkNode({left:p.x, top:p.y, title:'NODE', sub:''});
      canvas.add(node); canvas.add(handle);
      canvas.setActiveObject(node);
      canvas.renderAll();
    }
    cancelPlaceNetNode();
    return;
  }
  if (e.target && e.target.customType==='netConnectHandle'){
    __connectFrom = canvas.getObjects().find(o=>o.__oid===e.target.__ownerOid);
    if (!__connectFrom) return;
    __connectPreviewLine = new fabric.Line([__connectFrom.left, __connectFrom.top, __connectFrom.left, __connectFrom.top], {
      stroke:'#e0a72e', strokeWidth:1.5, strokeDashArray:[4,3], selectable:false, evented:false, excludeFromExport:true,
    });
    beginBatch(); canvas.add(__connectPreviewLine); endBatch();
    canvas.selection = false;
  }
}
function networkMouseMove(e){
  if (!__connectFrom || !__connectPreviewLine) return;
  const p = canvas.getPointer(e.e);
  __connectPreviewLine.set({x2:p.x, y2:p.y});
  canvas.requestRenderAll();
}
function networkMouseUp(e){
  if (!__connectFrom) return;
  if (__connectPreviewLine){ beginBatch(); canvas.remove(__connectPreviewLine); endBatch(); __connectPreviewLine = null; }
  canvas.selection = true;
  const target = e.target;
  if (target && target.customType==='netNode' && target!==__connectFrom){
    const line = makeNetworkLink(__connectFrom, target);
    canvas.add(line);
    canvas.sendObjectToBack(line);
    const art = canvas.getObjects().find(o=>o.customType==='brandArt'||o.customType==='background');
    if (art) canvas.sendObjectToBack(art);
    pushHistory();
  }
  canvas.renderAll();
  __connectFrom = null;
}
