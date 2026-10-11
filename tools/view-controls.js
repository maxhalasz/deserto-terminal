/* ===================== Zoom, movimento da página e comportamento da barra lateral =====================
   Carrega ANTES de editor.js (initCanvas já chama setZoom). Só usa `canvas`, PAGE_W/PAGE_H e `cropRect` na hora de
   rodar (nunca no carregamento), então a ordem não importa pra eles.

   Zoom (pesquisado: técnica padrão de editor de canvas): guarda o ponto da PÁGINA que está sob o cursor, muda o tamanho
   e rola o palco até esse ponto voltar pra baixo do cursor. Ctrl+roda e pinça de trackpad chegam como evento `wheel` com
   ctrlKey; precisa de listener com { passive:false } direto no palco (em window/document o Chrome força passivo e o
   preventDefault não vale). O palco centraliza o documento com margin:auto (e não align-items:center): centralizado
   quando sobra espaço, colado no começo quando passa, senão o lado esquerdo/topo fica inalcançável. */
const ZOOM_MIN = 0.1, ZOOM_MAX = 4, STAGE_PAD = 26;
let zoomMode = 'page';   // 'page' | 'width' | 'manual': enquanto não for manual, redimensionar a janela refaz o ajuste
const stageEl = ()=>document.getElementById('stage');

function stageCenter(){
  const st = stageEl(), r = st.getBoundingClientRect();
  return {x: r.left + st.clientWidth/2, y: r.top + st.clientHeight/2};
}
/* Muda o zoom. `anchor` = ponto da tela ({x,y} em px do navegador) que deve continuar sobre o mesmo ponto da página. */
function setZoom(z, anchor){
  z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
  const el = document.getElementById('editorCanvas'), wrap = document.getElementById('canvasWrap'), st = stageEl();
  let pg = null;
  if (anchor && st && wrap){
    const r = wrap.getBoundingClientRect(), z0 = canvas.getZoom();
    pg = {x:(anchor.x - r.left)/z0, y:(anchor.y - r.top)/z0};
  }
  el.parentElement.style.width = (PAGE_W*z)+'px';
  el.parentElement.style.height = (PAGE_H*z)+'px';
  canvas.setZoom(z);
  canvas.setDimensions({width:PAGE_W*z, height:PAGE_H*z});
  if (pg){
    const r = wrap.getBoundingClientRect();
    st.scrollLeft += (r.left + pg.x*z) - anchor.x;
    st.scrollTop += (r.top + pg.y*z) - anchor.y;
  }
  syncZoomUI();
}
function zoomBy(f, anchor){ zoomMode = 'manual'; setZoom(canvas.getZoom()*f, anchor || stageCenter()); }
function zoomTo(z, anchor){ zoomMode = 'manual'; setZoom(z, anchor || stageCenter()); }
function stageAvail(){ const st = stageEl(); return {w: Math.max(100, st.clientWidth - 2*STAGE_PAD), h: Math.max(100, st.clientHeight - 2*STAGE_PAD)}; }
/* Página inteira na tela. */
function fitPage(){
  zoomMode = 'page';
  const a = stageAvail();
  setZoom(Math.min(a.w/PAGE_W, a.h/PAGE_H));
  stageEl().scrollLeft = 0; stageEl().scrollTop = 0;
}
/* Página na largura da tela (rola pra ver o resto). */
function fitWidth(){
  zoomMode = 'width';
  setZoom(stageAvail().w/PAGE_W);
  stageEl().scrollLeft = 0; stageEl().scrollTop = 0;
}
/* Aproxima na seleção (se não tem seleção, é a página inteira). */
function zoomToFit(){
  const active = canvas.getActiveObject();
  if (!active || active===cropRect){ fitPage(); return; }
  zoomMode = 'manual';
  const r = active.getBoundingRect(), a = stageAvail();
  setZoom(Math.min(a.w/Math.max(40, r.width), a.h/Math.max(40, r.height))*0.9);
  const st = stageEl(), sr = st.getBoundingClientRect(), wr = document.getElementById('canvasWrap').getBoundingClientRect(), z = canvas.getZoom();
  st.scrollLeft += (wr.left + (r.left + r.width/2)*z) - (sr.left + st.clientWidth/2);
  st.scrollTop += (wr.top + (r.top + r.height/2)*z) - (sr.top + st.clientHeight/2);
}
function syncZoomUI(){
  const sel = document.getElementById('zoomSel'); if (!sel || typeof canvas==='undefined' || !canvas) return;
  const z = canvas.getZoom(), pct = Math.round(z*100);
  let custom = sel.querySelector('option[data-custom]');
  const preset = [...sel.options].find(o=>!o.dataset.custom && Math.abs(+o.value - z) < 0.004);
  if (preset){ if (custom) custom.remove(); sel.value = preset.value; return; }
  if (!custom){ custom = document.createElement('option'); custom.dataset.custom = '1'; sel.insertBefore(custom, sel.firstChild); }
  custom.value = z; custom.textContent = pct + '%'; sel.value = custom.value;
}

/* ---- ligações da barra de cima ---- */
document.getElementById('zoomSel').addEventListener('change', e=>zoomTo(+e.target.value));
document.getElementById('btnZoomIn').addEventListener('click', ()=>zoomBy(1.25));
document.getElementById('btnZoomOut').addEventListener('click', ()=>zoomBy(0.8));
document.getElementById('btnZoomPage').addEventListener('click', fitPage);
document.getElementById('btnZoomWidth').addEventListener('click', fitWidth);
document.getElementById('btnZoomFit').addEventListener('click', zoomToFit);
document.getElementById('btnQuickPNG').addEventListener('click', ()=>document.getElementById('btnExport').click());
window.addEventListener('resize', ()=>{ if (typeof canvas==='undefined' || !canvas) return; if (zoomMode==='page') fitPage(); else if (zoomMode==='width') fitWidth(); });

/* ---- Ctrl+roda / pinça: zoom no cursor ---- */
stageEl().addEventListener('wheel', e=>{
  if (!(e.ctrlKey || e.metaKey)) return;   // roda sem Ctrl rola a página normalmente
  e.preventDefault();
  const unit = e.deltaMode===1 ? 16 : (e.deltaMode===2 ? 400 : 1);
  zoomBy(Math.exp(-e.deltaY*unit*0.0022), {x:e.clientX, y:e.clientY});
}, {passive:false});

/* ---- mover a página: Espaço+arrastar ou botão do meio ---- */
let spaceDown = false, panning = null;
stageEl().addEventListener('mousedown', e=>{
  if (e.button===1 || (e.button===0 && spaceDown)){
    e.preventDefault(); e.stopPropagation();   // captura: o Fabric não chega a ver esse clique
    const st = stageEl();
    panning = {x:e.clientX, y:e.clientY, sl:st.scrollLeft, st:st.scrollTop};
    st.classList.add('panning');
  }
}, true);
window.addEventListener('mousemove', e=>{
  if (!panning) return;
  const st = stageEl();
  st.scrollLeft = panning.sl - (e.clientX - panning.x);
  st.scrollTop = panning.st - (e.clientY - panning.y);
});
window.addEventListener('mouseup', ()=>{ if (panning){ panning = null; stageEl().classList.remove('panning'); } });
function endSpace(){ spaceDown = false; stageEl().classList.remove('canPan'); }
document.addEventListener('keydown', e=>{
  const modal = document.getElementById('editorModal');
  if (modal && !modal.hidden) return;
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (tag==='INPUT' || tag==='TEXTAREA' || tag==='SELECT') return;
  if (e.code==='Space'){
    if (tag==='BUTTON') document.activeElement.blur();   // senão o Espaço "clica" no último botão usado
    e.preventDefault();
    if (!spaceDown){ spaceDown = true; stageEl().classList.add('canPan'); }
    return;
  }
  if (e.ctrlKey || e.metaKey){
    if (e.key==='0'){ e.preventDefault(); fitPage(); }
    else if (e.key==='1'){ e.preventDefault(); zoomTo(1); }
    else if (e.key==='+' || e.key==='='){ e.preventDefault(); zoomBy(1.25); }
    else if (e.key==='-' || e.key==='_'){ e.preventDefault(); zoomBy(0.8); }
  }
});
document.addEventListener('keyup', e=>{ if (e.code==='Space') endSpace(); });
window.addEventListener('blur', endSpace);

/* ===================== Barra lateral ===================== */
/* Modelos × documentos de marca: duas fontes do mesmo "Documento". */
function setSource(src){
  const brand = src==='brand';
  const m = document.getElementById('modelsSource'), b = document.getElementById('brandSource');
  if (m) m.style.display = brand ? 'none' : 'flex';
  if (b) b.style.display = brand ? 'flex' : 'none';
  document.querySelectorAll('#sourceSeg button').forEach(x=>x.classList.toggle('active', x.dataset.src===(brand ? 'brand' : 'models')));
}
document.querySelectorAll('#sourceSeg button').forEach(x=>x.addEventListener('click', ()=>setSource(x.dataset.src)));

/* Painéis que abrem e fecham clicando no título (o estado fica guardado neste navegador). */
(function initCollapsiblePanels(){
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('props.panelsCollapsed') || '{}') || {}; } catch(e){ saved = {}; }
  document.querySelectorAll('#side .panel').forEach(p=>{
    if (p.id==='inspector') return;   // o painel do objeto selecionado nunca fecha
    const head = p.querySelector(':scope > .panel-head'), ttl = head && head.querySelector('.ttl');
    if (!head || !ttl) return;
    p.classList.add('collapsible');
    const key = ttl.textContent.trim();
    if (saved[key]) p.classList.add('collapsed');
    head.addEventListener('click', ()=>{
      p.classList.toggle('collapsed');
      saved[key] = p.classList.contains('collapsed');
      try { localStorage.setItem('props.panelsCollapsed', JSON.stringify(saved)); } catch(e){ /* sem armazenamento: só não lembra */ }
    });
  });
})();

/* Explicações longas ficam escondidas: o botão ? no título do painel mostra/esconde (também guardado neste navegador). */
(function initHelpButtons(){
  let on = {};
  try { on = JSON.parse(localStorage.getItem('props.helpOn') || '{}') || {}; } catch(e){ on = {}; }
  document.querySelectorAll('#side .panel').forEach(p=>{
    const head = p.querySelector(':scope > .panel-head'), ttl = head && head.querySelector('.ttl');
    if (!head || !ttl || !p.querySelector('.hint.help')) return;
    const key = ttl.textContent.trim();
    const b = document.createElement('button'); b.type = 'button'; b.className = 'helpBtn'; b.textContent = '?'; b.title = 'Mostrar/esconder a explicação deste painel';
    if (on[key]) p.classList.add('helpOn');
    b.addEventListener('click', ev=>{
      ev.stopPropagation();
      p.classList.toggle('helpOn'); on[key] = p.classList.contains('helpOn');
      try { localStorage.setItem('props.helpOn', JSON.stringify(on)); } catch(e){ /* sem armazenamento */ }
    });
    head.appendChild(b);
  });
})();

document.getElementById('btnPickImage').addEventListener('click', ()=>document.getElementById('fileAddImage').click());
