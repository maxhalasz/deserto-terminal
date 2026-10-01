/* ===================== Pilha de cenas genérica =====================
   Uma "cena" é uma folha com o json do canvas + o próprio histórico de desfazer/refazer.
   Página de documento (editor.js: PAGES/curPageIdx) e lado de doc de marca (brand.js:
   BRAND.cur.sides) eram a MESMA coisa reimplementada duas vezes de forma independente —
   esse módulo é a implementação única que os dois usam por baixo. Depende de `canvas`,
   `history`/`historyIndex`, `beginBatch`/`endBatch` e `cancelCrop`/`clearDoc`/`pushHistory`
   (editor.js, carregado antes deste script). */

function makeSceneSnapshot(extra){
  return Object.assign({
    json: JSON.parse(JSON.stringify(canvas.toObject(HISTORY_PROPS))),
    history: history.slice(),
    historyIndex,
  }, extra || {});
}

/* Troca pra outra cena: se `scene.json` existir, carrega (desfazer/refazer restaura o
   histórico PRÓPRIO daquela cena); senão chama `buildFresh()` num canvas limpo e começa
   um histórico novo — é o caminho de "cena nunca visitada antes" (primeira vez numa
   página nova, primeiro load de um lado de doc de marca). `applyFields(scene)` roda ANTES
   de qualquer coisa, pra setar estado tipo template/PAGE_W/PAGE_H que o carregamento em si
   depende (página muda de tamanho por template; lado de doc de marca não muda). */
async function sceneSwitchTo(scene, {applyFields, buildFresh, afterLoad} = {}){
  cancelCrop();
  beginBatch();
  try {
    if (applyFields) applyFields(scene);
    if (scene.json){
      await canvas.loadFromJSON(scene.json);
    } else if (buildFresh){
      clearDoc();
      await buildFresh();
    }
    if (afterLoad) afterLoad();
    canvas.renderAll();
  } finally { endBatch(); }
  if (scene.history){ history = scene.history.slice(); historyIndex = scene.historyIndex; }
  else { history = []; historyIndex = -1; pushHistory(); }
}
