/* ===================== Fotos no histórico de desfazer =====================
   Usado por editor.js (props-generator) e image-lab.js. Uma foto vira data URL de centenas de KB a vários MB; a pilha de
   desfazer guarda até 40 snapshots do canvas inteiro, então a mesma foto era copiada 40 vezes (e re-serializada a cada
   passo: dezenas de ms e centenas de MB de memória). Aqui cada imagem diferente é guardada UMA vez e o snapshot leva só um
   marcador "@h:<n>". Antes de carregar um snapshot no canvas, histExpand devolve o texto original. */
const HIST_IMG_IDS = new Map(), HIST_IMG_SRC = [];
function histIntern(list){
  (list||[]).forEach(o=>{
    if (typeof o.src==='string' && o.src.length>4096){
      let id = HIST_IMG_IDS.get(o.src);
      if (id===undefined){ id = HIST_IMG_SRC.length; HIST_IMG_SRC.push(o.src); HIST_IMG_IDS.set(o.src, id); }
      o.src = '@h:'+id;
    }
    if (Array.isArray(o.objects)) histIntern(o.objects);
  });
}
function histExpand(snap){
  const fix = o=>{
    const c = Object.assign({}, o);
    if (typeof c.src==='string' && c.src.indexOf('@h:')===0) c.src = HIST_IMG_SRC[+c.src.slice(3)];
    if (Array.isArray(c.objects)) c.objects = c.objects.map(fix);
    return c;
  };
  return Object.assign({}, snap, {objects: (snap.objects||[]).map(fix)});
}
/* Tira o canvas.toObject() de um snapshot pronto pra guardar. */
function histSnapshot(canvasRef, props){
  const raw = canvasRef.toObject(props);
  histIntern(raw.objects);
  return JSON.parse(JSON.stringify(raw));
}
