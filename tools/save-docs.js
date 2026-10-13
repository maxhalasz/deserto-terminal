/* ===================== Salvar sozinho (estilo Google Docs), rascunho e abrir documentos =====================
   Dois sistemas SEPARADOS, de propósito:

   1) SALVAR SOZINHO. Todo documento tem nome (campo no topo) e é salvo a cada mudança, sem botão: o primeiro ajuste cria o
      documento em "Meus documentos"; os seguintes atualizam o mesmo (id estável: renomear só muda o nome). Onde guarda: no SITE
      (Firebase Realtime Database: props_docs_index/<id> = resumo; props_docs/<id> = corpo) e, se o site não responder ou negar
      a gravação num documento NOVO, neste navegador (IndexedDB). Aguarda 3 s sem mexer (no máximo 20 s de edição contínua).
      Vale pra modelos E pra documentos de marca.
      SEM LIMITE DE TAMANHO POR DOCUMENTO: o Firebase só aceita ~10 MB por texto e 16 MB por gravação, então o documento não vai
      inteiro num bloco só. Cada PÁGINA (ou lado) é um pedaço comprimido próprio (props_docs/<id>/parts/<chave>) e cada FOTO é guardada
      UMA vez, à parte e em fatias de 3 MB (props_docs/_imgs/<hash>), no documento só fica a referência "@img:<hash>". Salvar de
      novo só envia as páginas que mudaram e as fotos que ainda não estão lá (editar uma página não reenvia foto nenhuma). O limite
      que sobra é o do plano grátis do Firebase: 1 GB no total (a lista mostra quanto já está usado). Tudo fica sob props_docs e
      props_docs_index, então as mesmas regras de sempre valem (nada de regra nova).
   2) RASCUNHO. A cada mudança (1,2 s depois) o documento aberto — qualquer um, salvo ou não — é guardado neste navegador. Se a
      página recarregar, fechar sem querer ou cair, ao abrir de novo o documento volta do jeito que estava. Não depende de
      nome, internet nem do salvar sozinho estar ligado.
   Também: botões "Baixar arquivo" / "Abrir arquivo" (backup .json que não depende de nada).
   Testes: ?nosave=1 desliga os dois; ?nosite=1 nunca fala com o Firebase (cai no navegador). O harness de provas usa ?nosave=1
   pra não gravar documento de teste no banco de verdade. */

const SAVE_DB_PATH = 'props_docs', SAVE_INDEX_PATH = 'props_docs_index';
const FB_IMGS = '_imgs', FB_IMG_MIN = 8192, FB_IMG_CHUNK = 3000000;   // fotos: acima de 8 KB saem do documento; fatias de 3 milhões de caracteres
const _qs = new URLSearchParams(location.search);
const SAVE_OFF = _qs.get('nosave') === '1', SITE_OFF = _qs.get('nosite') === '1';
let _fbReady = null;

function saveSlug(name){
  return String(name||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'documento';
}
function saveB64(buf){
  const bytes = new Uint8Array(buf); let bin = ''; const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i+CH));
  return btoa(bin);
}
function saveFromB64(str){
  const bin = atob(str); const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function saveGzip(str){
  const cs = new CompressionStream('gzip'); const w = cs.writable.getWriter();
  w.write(new TextEncoder().encode(str)); w.close();
  return saveB64(await new Response(cs.readable).arrayBuffer());
}
async function saveGunzip(b64){
  const ds = new DecompressionStream('gzip'); const w = ds.writable.getWriter();
  w.write(saveFromB64(b64)); w.close();
  return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer());
}

/* ===================== O que vai dentro do documento salvo ===================== */
/* Retrato do documento aberto SEM mexer na tela (não tira a seleção, não toca em PAGES): é chamado no meio da edição.
   Devolve null se agora não dá (recorte aberto etc.). modelos: {v, kind:'props', template, cur, pages:[{json,pageW,pageH,template}]};
   marca: {v, kind:'brand', doc, side, extra:[ids de páginas extras], sides:{id: json}}. */
function saveCollectPayload(){
  if (typeof cropRect !== 'undefined' && cropRect) return null;
  const liveJson = ()=>JSON.parse(JSON.stringify(canvas.toObject(HISTORY_PROPS)));
  if (typeof BRAND !== 'undefined' && BRAND.cur){
    const c = BRAND.cur, sides = {};
    Object.keys(c.sides || {}).forEach(k=>{ if (c.sides[k] && c.sides[k].json) sides[k] = c.sides[k].json; });
    sides[c.side] = liveJson();
    return {v:1, kind:'brand', doc:c.doc, side:c.side, extra:(c.extraSides || []).slice(), sides};
  }
  if (!PAGES.length) return null;
  const live = {json:liveJson(), pageW:PAGE_W, pageH:PAGE_H, template:currentTemplate};
  const pages = PAGES.map((p, i)=>i === curPageIdx ? live : {json:p.json, pageW:p.pageW, pageH:p.pageH, template:p.template});
  return {v:1, kind:'props', template:currentTemplate, cur:curPageIdx, pages};
}
function saveFmtBytes(n){ n = n || 0; return n >= 1048576 ? (n/1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n/1024)) + ' KB'; }
function saveNewId(name){ return saveSlug(name).slice(0, 40) + '-' + Date.now().toString(36) + Math.floor(Math.random()*1296).toString(36); }
function saveDefaultName(){
  let label = 'Documento';
  if (typeof BRAND !== 'undefined' && BRAND.cur) label = BRAND.cur.meta.familyLabel + ' — ' + BRAND.cur.meta.label;
  else if (typeof DOC_TEMPLATES !== 'undefined' && DOC_TEMPLATES[currentTemplate]) label = DOC_TEMPLATES[currentTemplate].label;
  return label + ' · ' + new Date().toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
}
/* Registro pronto pra gravar. Dá nome e id ao documento se ainda não tem. */
async function saveBuildRecord(){
  const payload = saveCollectPayload();
  if (!payload) return null;
  const tEl = document.getElementById('docName');
  let name = (tEl.value || '').trim();
  if (!name){ name = saveDefaultName(); tEl.value = name; }
  if (!saveCurrentId) saveCurrentId = saveNewId(name);
  const nPages = payload.kind === 'brand' ? Object.keys(payload.sides).length : payload.pages.length;
  return {id:saveCurrentId, name, kind:payload.kind, template:payload.kind === 'brand' ? 'brand:' + payload.doc : payload.template, savedAt:Date.now(), nPages, payload};
}
/* Texto comprimido do documento inteiro (navegador e arquivo guardam assim; o site guarda em pedaços, ver fbSave). */
async function saveRecGz(rec){
  if (!rec.data){ rec.data = await saveGzip(JSON.stringify(rec.payload)); rec.bytes = rec.data.length; }
  return rec;
}
const saveRecPlain = rec=>{ const r = Object.assign({}, rec); delete r.payload; return r; };   // o que vai pro IndexedDB (sem o objeto grande)
/* Compatível com o que existia: registro do documento atual (guardando a página em edição). */
async function saveCollect(name){
  canvas.discardActiveObject();
  if (typeof BRAND === 'undefined' || !BRAND.cur) pageSaveCurrent();
  if (name){ document.getElementById('docName').value = name; }
  const rec = await saveBuildRecord();
  if (!rec) throw new Error('Termine o recorte antes de salvar.');
  return saveRecGz(rec);
}
/* Abre um registro: modelos recarregam as páginas; documentos de marca reabrem o pack e repõem cada lado. */
async function saveRestore(rec){
  const d = rec.payload || JSON.parse(await saveGunzip(rec.data));
  if (d && d.kind === 'brand') return saveRestoreBrand(d);
  if (!d || !d.pages || !d.pages.length) throw new Error('Arquivo de documento vazio ou inválido.');
  return withSceneLock(async ()=>{
    if (typeof brandOnLeave === 'function') brandOnLeave();
    PAGES = d.pages.map(p=>({json:p.json, pageW:p.pageW, pageH:p.pageH, template:p.template}));
    curPageIdx = Math.max(0, Math.min(PAGES.length-1, d.cur||0));
    await sceneSwitchTo(PAGES[curPageIdx], {applyFields: applyPageSceneFields, afterLoad: ()=>recomputeBgFieldsFromObjects(canvas.getObjects())});
    const sel = document.getElementById('templateSel');
    if (sel && [...sel.options].some(o=>o.value===currentTemplate)) sel.value = currentTemplate;
    setSource('models'); fitPage();
    renderLayerList(); updateInspector(); updateUndoRedoButtons(); syncNewsLayoutUI(); updatePageNavUI();
    if (typeof syncDocVariantUI === 'function') syncDocVariantUI();
    docLoaded();
  });
}
async function saveRestoreBrand(d){
  BRAND.restoring = true;
  try { await loadBrandDoc(d.doc, 'front'); }   // abre o documento de verdade (pack, fontes, tamanho)
  finally { BRAND.restoring = false; }
  await withSceneLock(async ()=>{
    const c = BRAND.cur; if (!c) throw new Error('O documento de marca não abriu.');
    const core = c.meta.sides;
    for (const s of core){ if (d.sides && d.sides[s]){ const pack = await brandLoadPack(c.doc, s); await brandEnsureFonts(pack); } }   // a arte de cada lado precisa estar carregada antes do loadFromJSON
    c.extraSides = (d.extra || []).slice();
    c.sides = {};
    Object.keys(d.sides || {}).forEach(k=>{ if (k !== d.side) c.sides[k] = {json:d.sides[k]}; });
    const side = d.sides && d.sides[d.side] ? d.side : c.side;
    if (d.sides && d.sides[side]) await sceneSwitchTo({json:d.sides[side]}, {});   // o lado que estava aberto, com as edições
    c.side = side;
    renderLayerList(); updateInspector(); updateUndoRedoButtons(); brandUpdateUI();
  });
  docLoaded();
}

/* ===================== Identidade do documento aberto ===================== */
let saveCurrentId = null;      // id estável do documento (null = ainda não foi criado em "Meus documentos")
let saveCurrentWhere = null;   // 'site' | 'navegador' (onde ele mora)
let saveSavedSeq = 0;          // docChangeSeq da última gravação que deu certo
let docLoadSeq = 0;            // docChangeSeq quando o documento foi aberto (sem mexer = nada pra salvar)
let autoTimer = null, autoFirst = 0, autoPromise = null, autoLastAt = 0, autoErr = '';
const autoEnabled = ()=>{ const c = document.getElementById('autoSaveOn'); return !SAVE_OFF && (!c || c.checked); };

function docNewIdentity(){   // documento novo: ainda sem nome nem registro
  saveCurrentId = null; saveCurrentWhere = null; autoErr = ''; autoLastAt = 0;
  const t = document.getElementById('docName'); if (t) t.value = '';
}
function docLoaded(){        // acabou de abrir/criar: nada mudou ainda
  docDirty = false; docLoadSeq = docChangeSeq; saveSavedSeq = docChangeSeq;
  autoFirst = 0; clearTimeout(autoTimer); autoTimer = null;
  chipRefresh(); draftNote();
}
/* Há mudança que ainda não foi pra lugar nenhum? (pergunta ao trocar de documento) */
function docNeedsConfirm(){
  if (docChangeSeq === docLoadSeq) return false;                       // não mexeu
  if (autoEnabled() && !autoErr && saveCurrentId) return false;        // o salvar sozinho cuida (e faz uma última gravação antes de trocar)
  return docChangeSeq !== saveSavedSeq;
}

/* ===================== Indicador (topo) ===================== */
function chipSet(state, extra){
  const el = document.getElementById('saveChip'); if (!el) return;
  const t = ()=>new Date(autoLastAt || Date.now()).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
  const S = {
    off: ['Salvar sozinho desligado', 'warn'], none: ['', ''],
    pending: ['Alterações não salvas…', 'warn'], saving: ['Salvando…', ''],
    savedSite: ['☁ Salvo no site · ' + t(), 'ok'], savedLocal: ['💻 Salvo neste navegador · ' + t(), 'ok'],
    error: ['⚠ Não salvou: ' + extra, 'bad'],
  }[state] || ['', ''];
  el.textContent = S[0]; el.className = 'saveChip ' + S[1];
  el.title = state === 'savedLocal' ? 'O site não gravou; este documento está guardado só neste navegador. Baixe o arquivo (aba Salvar) pra ter backup.' : (state === 'error' ? String(extra) : '');
}
function chipRefresh(){
  if (SAVE_OFF) return chipSet('none');
  if (!autoEnabled()) return chipSet('off');
  if (autoErr) return chipSet('error', autoErr);
  if (docChangeSeq !== saveSavedSeq) return chipSet('pending');
  if (saveCurrentId) return chipSet(saveCurrentWhere === 'site' ? 'savedSite' : 'savedLocal');
  chipSet('none');
}

/* ===================== 1) Salvar sozinho ===================== */
/* Chamado a cada mudança do usuário (editor.js: docEdited). */
function autoNote(){
  if (SAVE_OFF) return;
  if (!autoEnabled()){ chipSet('off'); return; }
  if (!autoFirst) autoFirst = Date.now();
  chipSet('pending');
  clearTimeout(autoTimer);
  autoTimer = setTimeout(()=>autoRun(), Math.max(300, Math.min(3000, 20000 - (Date.now() - autoFirst))));
}
/* Pode gravar agora sem atrapalhar? (não no meio de uma troca de página, de edição de texto ou de recorte) */
function autoSafeNow(){
  const modal = document.getElementById('editorModal');
  if (typeof sceneBusy !== 'undefined' && sceneBusy) return false;
  if (modal && !modal.hidden) return false;
  if (typeof cropRect !== 'undefined' && cropRect) return false;
  if (restoringHistory) return false;
  return !!((typeof BRAND !== 'undefined' && BRAND.cur) || PAGES.length);
}
function autoRun(opts){
  if (autoPromise){ clearTimeout(autoTimer); autoTimer = setTimeout(()=>autoRun(opts), 600); return autoPromise; }
  autoPromise = autoRunInner(opts || {}).finally(()=>{ autoPromise = null; });
  return autoPromise;
}
async function autoRunInner(opts){
  clearTimeout(autoTimer); autoTimer = null;
  if (!opts.inLock && !autoSafeNow()){ autoTimer = setTimeout(()=>autoRun(opts), 700); return; }
  const seq = docChangeSeq;
  if (!opts.force && seq === saveSavedSeq) return;
  try {
    chipSet('saving');
    const rec = await saveBuildRecord();
    if (!rec){ autoTimer = setTimeout(()=>autoRun(opts), 700); return; }
    const where = await saveWrite(rec);
    saveSavedSeq = seq; autoFirst = 0; autoErr = ''; autoLastAt = Date.now();
    if (docChangeSeq === seq) docDirty = false;
    chipRefresh();
    saveListSoon();
    if (opts.force) saveStatus((where === 'site' ? 'Salvo no site: ' : 'Salvo neste navegador: ') + rec.name + ' (' + saveFmtBytes(rec.bytes) + ', ' + rec.nPages + ' pág.)');
  } catch(e){
    autoErr = String((e && (e.code || e.message)) || e).slice(0, 120);
    console.warn('Salvar sozinho falhou:', e);
    chipRefresh();
    if (opts.force) saveStatus('Não consegui salvar: ' + autoErr, true);
    if (!opts.inLock) autoTimer = setTimeout(()=>autoRun(), 20000);   // tenta de novo (rede, regras, tamanho)
  }
  finally { if (docChangeSeq !== seq && !autoTimer && autoEnabled() && !opts.inLock) autoNote(); }
}
/* Grava onde o documento mora; documento NOVO tenta o site e, se não der, fica no navegador (e avisa por quê). */
let _siteNoticeShown = false;
async function saveWrite(rec){
  if (saveCurrentWhere !== 'navegador'){
    try { await fbSave(rec); saveCurrentWhere = 'site'; return 'site'; }
    catch(e){
      if (saveCurrentWhere === 'site') throw e;   // já mora no site: não duplica no navegador, tenta de novo depois
      const denied = e && (e.code === 'PERMISSION_DENIED' || /permission/i.test(String(e.message||'')));
      if (!_siteNoticeShown && !SITE_OFF){
        _siteNoticeShown = true;
        saveStatus(denied
          ? 'O site negou a gravação: as regras do Firebase ainda não liberam "props_docs" (instrução abaixo, é uma vez só). Os documentos ficam guardados neste navegador por enquanto — baixe o arquivo pra ter backup.'
          : 'Não consegui salvar no site (' + (e.code || e.message || e) + '). Este documento ficou guardado só neste navegador — baixe o arquivo pra ter backup.', true);
        if (denied){ const h = document.getElementById('saveRulesHelp'); if (h) h.open = true; }
      }
    }
  }
  await saveRecGz(rec);
  await localSave(saveRecPlain(rec)); saveCurrentWhere = 'navegador'; return 'navegador';
}
/* Garante que o documento atual foi pra "Meus documentos" antes de trocar por outro. */
async function autoFlush(){
  if (SAVE_OFF) return;
  if (autoPromise) await autoPromise;
  if (docChangeSeq !== docLoadSeq && docChangeSeq !== saveSavedSeq && autoEnabled()) await autoRun({inLock:true, force:true});
}
async function saveNow(){   // botão "Salvar agora": força uma gravação (mesmo com o salvar sozinho desligado)
  if (SAVE_OFF){ saveStatus('Salvar desligado nesta página (?nosave=1).', true); return; }
  saveStatus('Salvando…');
  await autoRun({force:true});
}

/* ===================== 2) Rascunho (recarregar a página não perde nada) ===================== */
let _dT = null, _dBusy = false;
function draftNote(){ if (SAVE_OFF) return; clearTimeout(_dT); _dT = setTimeout(draftRun, 1200); }
async function draftRun(){
  if (_dBusy || !autoSafeNow()){ clearTimeout(_dT); _dT = setTimeout(draftRun, 700); return; }
  _dBusy = true; const seq = docChangeSeq;
  try {
    const payload = saveCollectPayload();
    if (!payload){ clearTimeout(_dT); _dT = setTimeout(draftRun, 700); return; }
    const gz = await saveGzip(JSON.stringify(payload));
    await idbPut('draft', {id:'current', kind:payload.kind, name:(document.getElementById('docName').value || '').trim(), savedId:saveCurrentId, where:saveCurrentWhere,
      template:currentTemplate, edited:docChangeSeq !== docLoadSeq, savedAt:Date.now(), data:gz});
    if (docChangeSeq === seq) docDirty = false;   // só agora é seguro fechar a aba sem aviso
  } catch(e){ console.warn('Rascunho não gravou:', e); }
  finally { _dBusy = false; }
}
function draftClear(){ return idbDel('draft', 'current').catch(()=>{}); }
/* Ao abrir a página: se sobrou um rascunho, o documento volta. Devolve true se reabriu. */
async function draftRestoreOnStart(){
  if (SAVE_OFF) return false;
  let d = null;
  try { d = await idbGet('draft', 'current'); } catch(e){ return false; }
  if (!d || !d.data) return false;
  try {
    await saveRestore({data:d.data});
    document.getElementById('docName').value = d.name || '';
    saveCurrentId = d.savedId || null; saveCurrentWhere = d.where || null;
    autoLastAt = d.savedAt || 0;
    if (d.edited) docEdited();   // o rascunho tinha mudança: o salvar sozinho grava (ou cria) o documento com ela
    else chipRefresh();
    const hora = new Date(d.savedAt).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
    noticeShow('Documento reaberto do rascunho de ' + hora + (d.name ? ' ("' + d.name + '")' : '') + '. Seu trabalho não foi perdido.', 'Descartar e começar de novo', async ()=>{
      await autoFlush(); await draftClear(); docNewIdentity(); await loadTemplate('newspaper');
    });
    return true;
  } catch(e){ console.warn('Rascunho inválido, ignorado:', e); return false; }
}
function noticeShow(text, label, fn){
  const n = document.getElementById('notice'); if (!n) return;
  document.getElementById('noticeText').textContent = text;
  const b = document.getElementById('noticeAct');
  b.style.display = label ? '' : 'none'; b.textContent = label || '';
  b.onclick = ()=>{ n.hidden = true; if (fn) fn(); };
  document.getElementById('noticeClose').onclick = ()=>{ n.hidden = true; };
  n.hidden = false;
}
/* Fecha a aba / esconde: manda o que falta pro rascunho agora (a gravação é assíncrona, melhor esforço). */
document.addEventListener('visibilitychange', ()=>{
  if (document.visibilityState !== 'hidden' || SAVE_OFF) return;
  if (docChangeSeq !== docLoadSeq) draftRun();
  if (autoTimer && autoEnabled()) autoRun();
});

/* ===================== Firebase (carregado só quando precisa) ===================== */
function saveLoadScript(src){
  return new Promise((res, rej)=>{ const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = ()=>rej(new Error('não consegui carregar ' + src)); document.head.appendChild(s); });
}
function saveFirebase(){
  if (SITE_OFF) return Promise.reject(new Error('site desligado nesta página (?nosite=1)'));
  if (_fbReady) return _fbReady;
  _fbReady = (async ()=>{
    if (!navigator.onLine) throw new Error('sem internet');
    const base = 'https://www.gstatic.com/firebasejs/10.12.2/';
    if (typeof firebase === 'undefined'){
      await saveLoadScript(base + 'firebase-app-compat.js');
      await saveLoadScript(base + 'firebase-auth-compat.js');
      await saveLoadScript(base + 'firebase-database-compat.js');
    }
    // firebase-config.js (raiz do site) inicializa o app, cria `db` e entra como anônimo — reaproveitado, não duplicado
    if (typeof db === 'undefined') await saveLoadScript('../firebase-config.js');
    await new Promise((res, rej)=>{
      const t = setTimeout(()=>rej(new Error('login anônimo demorou')), 12000);
      firebase.auth().onAuthStateChanged(u=>{ if (u){ clearTimeout(t); res(u); } });
    });
    return db;
  })();
  _fbReady.catch(()=>{ _fbReady = null; });
  return _fbReady;
}
/* ---- formato no site (v2) ----
   props_docs/<id>/head  = {v:2, kind, template|doc, cur|side|extra, nPages, keys:[...], imgs:[hash...]}
   props_docs/<id>/parts/<chave> = página ("p0","p1"...) ou lado de documento de marca ("s_front"...) em gzip→base64, fotos trocadas por "@img:<hash>"
   props_docs/_imgs/<hash>/{n, c0, c1...} = a foto (data URL) em fatias;  props_docs_index/_imgs/<hash> = {s:tamanho, t:quando}
   props_docs_index/<id> = {name, kind, template, savedAt, nPages, bytes (só as páginas), imgBytes, v:2, imgs:[hash...]}
   Documento antigo (v1): props_docs/<id>/data = tudo num bloco só; ainda abre, e a próxima gravação converte pro formato novo. */
const fbKnownImgs = new Set(), fbImgCache = new Map(), fbLast = {};   // fotos que já sei que estão lá / fotos baixadas / páginas já enviadas por documento
const _imgHashCache = new Map();
async function fbImgHash(src){
  let h = _imgHashCache.get(src);
  if (!h){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(src));
    h = [...new Uint8Array(buf)].slice(0, 16).map(b=>b.toString(16).padStart(2, '0')).join('');
    if (_imgHashCache.size > 200) _imgHashCache.clear();
    _imgHashCache.set(src, h);
  }
  return h;
}
function fbCollectSrcs(node, out){
  if (Array.isArray(node)) node.forEach(n=>fbCollectSrcs(n, out));
  else if (node && typeof node === 'object'){
    Object.keys(node).forEach(k=>{
      const v = node[k];
      if (k === 'src' && typeof v === 'string' && v.length > FB_IMG_MIN && v.indexOf('data:') === 0) out.add(v);
      else if (v && typeof v === 'object') fbCollectSrcs(v, out);
    });
  }
}
function fbRestoreSrcs(node, imgs){
  if (Array.isArray(node)) node.forEach(n=>fbRestoreSrcs(n, imgs));
  else if (node && typeof node === 'object'){
    Object.keys(node).forEach(k=>{
      const v = node[k];
      if (k === 'src' && typeof v === 'string' && v.indexOf('@img:') === 0){ const f = imgs[v.slice(5)]; if (f) node[k] = f; }
      else if (v && typeof v === 'object') fbRestoreSrcs(v, imgs);
    });
  }
}
/* O documento vira {head, parts}: uma peça por página (modelos) ou por lado (marca). */
function fbSplit(payload){
  const parts = {};
  if (payload.kind === 'brand'){
    Object.keys(payload.sides).forEach(k=>{ parts['s_' + k] = payload.sides[k]; });
    return {head:{kind:'brand', doc:payload.doc, side:payload.side, extra:payload.extra || []}, parts};
  }
  payload.pages.forEach((p, i)=>{ parts['p' + i] = p; });
  return {head:{kind:'props', template:payload.template, cur:payload.cur, nPages:payload.pages.length}, parts};
}
function fbJoin(head, parts){
  if (head.kind === 'brand'){
    const sides = {};
    Object.keys(parts).forEach(k=>{ if (k.indexOf('s_') === 0) sides[k.slice(2)] = parts[k]; });
    return {v:1, kind:'brand', doc:head.doc, side:head.side, extra:head.extra ? Object.values(head.extra) : [], sides};
  }
  const pages = [];
  for (let i = 0; i < head.nPages; i++) pages.push(parts['p' + i]);
  return {v:1, kind:'props', template:head.template, cur:head.cur || 0, pages};
}
async function fbPutImg(d, h, src){
  const base = SAVE_DB_PATH + '/' + FB_IMGS + '/' + h, n = Math.ceil(src.length / FB_IMG_CHUNK);
  // o registro vai PRIMEIRO: se o envio cair no meio, a limpeza (fbGc) acha as fatias soltas e apaga
  await d.ref(SAVE_INDEX_PATH + '/' + FB_IMGS + '/' + h).set({s:src.length, t:Date.now()});
  for (let i = 0; i < n; i++){   // uma fatia por gravação: nenhuma passa de ~3 MB
    await d.ref(base + '/c' + i).set(src.slice(i*FB_IMG_CHUNK, (i+1)*FB_IMG_CHUNK));
  }
  await d.ref(base + '/n').set(n);   // o "n" vai por último: a foto só existe depois de completa
}
async function fbGetImg(d, h){
  if (fbImgCache.has(h)) return fbImgCache.get(h);
  const v = (await d.ref(SAVE_DB_PATH + '/' + FB_IMGS + '/' + h).once('value')).val();
  if (!v || !v.n) throw new Error('foto do documento não encontrada no site');
  let s = ''; for (let i = 0; i < v.n; i++) s += v['c' + i] || '';
  if (fbImgCache.size > 12) fbImgCache.delete(fbImgCache.keys().next().value);
  fbImgCache.set(h, s); return s;
}
async function fbSave(rec){
  const d = await saveFirebase();
  const payload = rec.payload || JSON.parse(await saveGunzip(rec.data));
  const {head, parts} = fbSplit(payload);
  // 1) fotos novas (as que já estão lá não sobem de novo)
  const srcs = new Set(); Object.keys(parts).forEach(k=>fbCollectSrcs(parts[k], srcs));
  const hashOf = new Map(); let imgBytes = 0;
  for (const src of srcs){ hashOf.set(src, await fbImgHash(src)); imgBytes += src.length; }
  for (const [src, h] of hashOf){
    if (fbKnownImgs.has(h)) continue;
    const have = (await d.ref(SAVE_DB_PATH + '/' + FB_IMGS + '/' + h + '/n').once('value')).val();
    if (have == null){ if (typeof chipSet === 'function') chipSet('saving'); await fbPutImg(d, h, src); }
    fbKnownImgs.add(h);
  }
  // 2) páginas: só as que mudaram desde a última gravação deste documento
  const gz = {}; let bytes = 0;
  for (const k of Object.keys(parts)){
    const json = JSON.stringify(parts[k], (key, v)=>(key === 'src' && typeof v === 'string' && hashOf.has(v)) ? '@img:' + hashOf.get(v) : v);
    gz[k] = await saveGzip(json); bytes += gz[k].length;
  }
  const last = fbLast[rec.id], upd = {}, root = SAVE_DB_PATH + '/' + rec.id;
  Object.keys(gz).forEach(k=>{ if (!last || last[k] !== gz[k]) upd[root + '/parts/' + k] = gz[k]; });
  if (last) Object.keys(last).forEach(k=>{ if (!(k in gz)) upd[root + '/parts/' + k] = null; });   // página apagada
  head.v = 2; head.keys = Object.keys(gz); head.imgs = [...new Set(hashOf.values())];
  upd[root + '/head'] = head; upd[root + '/data'] = null;   // data = formato antigo, sai na conversão
  upd[SAVE_INDEX_PATH + '/' + rec.id] = {name:rec.name, kind:rec.kind || 'props', template:rec.template, savedAt:rec.savedAt, nPages:rec.nPages, bytes, imgBytes, v:2, imgs:head.imgs};
  await d.ref().update(upd);   // uma gravação só, atômica: o documento (e a linha dele na lista) nunca ficam pela metade
  fbLast[rec.id] = gz; rec.bytes = bytes + imgBytes;
}
let fbUsageBytes = 0;
async function fbList(){
  const d = await saveFirebase();
  const snap = await d.ref(SAVE_INDEX_PATH).once('value');
  const v = snap.val() || {};
  let total = 0;
  Object.keys(v).forEach(k=>{ if (k === FB_IMGS) Object.keys(v[k]).forEach(h=>{ total += (v[k][h] && v[k][h].s) || 0; }); else total += (v[k] && v[k].bytes) || 0; });
  fbUsageBytes = total;
  return Object.keys(v).filter(id=>id !== FB_IMGS).map(id=>Object.assign({id, where:'site'}, v[id]));
}
async function fbLoad(id){
  const d = await saveFirebase();
  const v = (await d.ref(SAVE_DB_PATH + '/' + id).once('value')).val();
  if (!v) throw new Error('documento não encontrado no site');
  if (!v.head){ if (!v.data) throw new Error('documento não encontrado no site'); return {id, data:v.data}; }   // formato antigo
  const head = v.head, imgs = {}, parts = {}, hs = head.imgs ? Object.values(head.imgs) : [];
  for (const h of hs) imgs[h] = await fbGetImg(d, h);
  for (const k of Object.values(head.keys || Object.keys(v.parts || {}))){
    const part = JSON.parse(await saveGunzip(v.parts[k]));
    fbRestoreSrcs(part, imgs); parts[k] = part;
  }
  fbLast[id] = Object.assign({}, v.parts);   // a próxima gravação já sai só com o que mudar
  hs.forEach(h=>fbKnownImgs.add(h));
  return {id, payload:fbJoin(head, parts)};
}
/* Apaga as fotos que nenhum documento usa mais (só as com mais de 10 min, pra não pegar uma foto de um salvamento em andamento). */
async function fbGc(){
  const d = await saveFirebase();
  const idx = (await d.ref(SAVE_INDEX_PATH).once('value')).val() || {}, used = new Set();
  Object.keys(idx).forEach(k=>{ if (k !== FB_IMGS && idx[k] && idx[k].imgs) Object.values(idx[k].imgs).forEach(h=>used.add(h)); });
  const reg = idx[FB_IMGS] || {}, del = {};
  Object.keys(reg).forEach(h=>{
    if (!used.has(h) && Date.now() - ((reg[h] && reg[h].t) || 0) > 600000){
      del[SAVE_DB_PATH + '/' + FB_IMGS + '/' + h] = null; del[SAVE_INDEX_PATH + '/' + FB_IMGS + '/' + h] = null; fbKnownImgs.delete(h); fbImgCache.delete(h);
    }
  });
  if (Object.keys(del).length) await d.ref().update(del);
}
async function fbDelete(id){
  const d = await saveFirebase();
  await d.ref(SAVE_DB_PATH + '/' + id).remove(); await d.ref(SAVE_INDEX_PATH + '/' + id).remove();
  delete fbLast[id];
  try { await fbGc(); } catch(e){ console.warn('limpeza de fotos não rodou', e); }
}

/* ===================== IndexedDB (neste navegador): documentos e rascunho ===================== */
/* Uma conexão só, reaproveitada. Versão 2 acrescentou o armazém "draft" (o rascunho). */
let _idbP = null;
function idb(){
  if (_idbP) return _idbP;
  _idbP = new Promise((res, rej)=>{
    const r = indexedDB.open('props-docs', 2);
    r.onupgradeneeded = ()=>{
      const d = r.result;
      if (!d.objectStoreNames.contains('docs')) d.createObjectStore('docs', {keyPath:'id'});
      if (!d.objectStoreNames.contains('draft')) d.createObjectStore('draft', {keyPath:'id'});
    };
    r.onsuccess = ()=>{ const d = r.result; d.onclose = d.onversionchange = ()=>{ _idbP = null; try { d.close(); } catch(e){} }; res(d); };
    r.onerror = ()=>{ _idbP = null; rej(r.error); };
  });
  return _idbP;
}
const idbTx = (store, mode, fn)=>idb().then(db=>new Promise((res, rej)=>{
  const t = db.transaction(store, mode), st = t.objectStore(store); const out = fn(st);
  t.oncomplete = ()=>res(out && out.result !== undefined ? out.result : undefined); t.onerror = ()=>rej(t.error); t.onabort = ()=>rej(t.error);
}));
const idbPut = (store, rec)=>idbTx(store, 'readwrite', st=>st.put(rec));
const idbGet = (store, id)=>idbTx(store, 'readonly', st=>st.get(id));
const idbDel = (store, id)=>idbTx(store, 'readwrite', st=>st.delete(id));
const localSave = (rec)=>idbPut('docs', rec);
const localList = ()=>idbTx('docs', 'readonly', st=>st.getAll()).then(a=>(a||[]).map(r=>({id:r.id, name:r.name, kind:r.kind || 'props', template:r.template, savedAt:r.savedAt, nPages:r.nPages, bytes:r.bytes, where:'navegador'})));
const localLoad = (id)=>idbGet('docs', id);
const localDelete = (id)=>idbDel('docs', id);

/* ===================== Interface: lista, abrir, arquivo ===================== */
function saveStatus(msg, bad){
  const el = document.getElementById('saveStatus'); if (!el) return;
  el.textContent = msg; el.style.color = bad ? '#e58a8a' : '#8fb0dc';
}
let _listStale = true;
/* A lista de "Meus documentos" se atualiza sozinha: ao gravar (se a aba Salvar está aberta) e ao abrir a aba Salvar. */
function saveListSoon(){ _listStale = true; const a = document.querySelector('.tabBtn.active'); if (a && a.dataset.tab === 'save') saveRefreshList(); }
function saveListShown(){ if (_listStale) saveRefreshList(); }
async function saveRefreshList(){
  const box = document.getElementById('docList'); if (!box) return;
  _listStale = false;
  box.textContent = 'Carregando…';
  let items = [], fbErr = null;
  if (!SITE_OFF){ try { items = await fbList(); } catch(e){ fbErr = e; } }
  try { items = items.concat(await localList()); } catch(e){ /* IndexedDB indisponível */ }
  items.sort((a, b)=>(b.savedAt||0) - (a.savedAt||0));
  box.innerHTML = '';
  const use = document.getElementById('saveUsage');
  if (use){
    if (fbErr || SITE_OFF) use.textContent = '';
    else { const pct = fbUsageBytes / (1024*1024*1024) * 100; use.textContent = 'Ocupando ' + saveFmtBytes(fbUsageBytes) + ' no site, de 1 GB grátis (' + (pct < 0.1 ? '<0,1' : pct.toFixed(1).replace('.', ',')) + '%).'; use.style.color = pct > 80 ? '#e58a8a' : ''; }
  }
  if (fbErr) saveStatus('Site indisponível (' + (fbErr.code || fbErr.message || fbErr) + '). Mostrando só o que está neste navegador.', true);
  if (!items.length){ box.textContent = 'Nenhum documento salvo ainda. Mexa no documento: ele se salva sozinho.'; return; }
  items.forEach(it=>{
    const row = document.createElement('div'); row.className = 'layerRow' + (it.id === saveCurrentId ? ' active' : '');
    const nm = document.createElement('span'); nm.className = 'nm';
    const when = it.savedAt ? new Date(it.savedAt).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'}) : '';
    nm.textContent = (it.where === 'site' ? '☁ ' : '💻 ') + it.name; nm.title = `${it.name}\n${it.template || ''} · ${it.nPages||1} pág. · ${saveFmtBytes((it.bytes||0) + (it.imgBytes||0))} · ${when} · ${it.where === 'site' ? 'no site' : 'neste navegador'}`;
    row.appendChild(nm);
    const open = document.createElement('button'); open.textContent = it.id === saveCurrentId ? 'Aberto' : 'Abrir'; open.disabled = it.id === saveCurrentId;
    open.addEventListener('click', ()=>saveOpen(it));
    const del = document.createElement('button'); del.textContent = '✕'; del.title = 'Apagar';
    del.addEventListener('click', async ()=>{
      if (!confirm('Apagar "' + it.name + '" (' + (it.where === 'site' ? 'no site' : 'neste navegador') + ')? Não dá pra desfazer.')) return;
      try {
        if (it.where === 'site') await fbDelete(it.id); else await localDelete(it.id);
        if (it.id === saveCurrentId){ saveCurrentId = null; saveCurrentWhere = null; chipRefresh(); }
        saveStatus('Apagado.');
      } catch(e){ saveStatus('Não consegui apagar: ' + (e.message||e), true); }
      saveRefreshList();
    });
    row.appendChild(open); row.appendChild(del); box.appendChild(row);
  });
}
async function saveOpen(it){
  try {
    saveStatus('Abrindo…');
    await autoFlush();   // o documento que está na tela já foi salvo antes de trocar
    if (docNeedsConfirm() && !confirm('O documento que está na tela tem alterações que não foram salvas. Abrir "' + it.name + '" mesmo assim?')){ saveStatus(''); return; }
    const rec = it.where === 'site' ? await fbLoad(it.id) : await localLoad(it.id);
    await saveRestore(rec);   // do site vem o documento já remontado (rec.payload); do navegador vem comprimido (rec.data)
    document.getElementById('docName').value = it.name;
    saveCurrentId = it.id; saveCurrentWhere = it.where === 'site' ? 'site' : 'navegador'; autoLastAt = it.savedAt || 0;
    chipRefresh(); draftNote();
    saveStatus('Aberto: ' + it.name);
    saveRefreshList();
  } catch(e){ saveStatus('Erro ao abrir: ' + (e.message||e), true); console.error(e); }
}
async function saveToFile(){
  try {
    const rec = await saveCollect();
    const blob = new Blob([JSON.stringify({props_doc:1, id:rec.id, name:rec.name, kind:rec.kind, template:rec.template, savedAt:rec.savedAt, nPages:rec.nPages, data:rec.data})], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = saveSlug(rec.name) + '.props.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    saveStatus('Arquivo baixado: ' + saveSlug(rec.name) + '.props.json');
  } catch(e){ saveStatus('Erro: ' + (e.message||e), true); }
}
async function saveFromFile(file){
  try {
    const rec = JSON.parse(await file.text());
    if (!rec.props_doc || !rec.data) throw new Error('não é um arquivo de documento do gerador de props');
    await autoFlush();
    if (docNeedsConfirm() && !confirm('O documento que está na tela tem alterações que não foram salvas. Abrir "' + rec.name + '" mesmo assim?')) return;
    docNewIdentity();   // o arquivo abre como documento NOVO (uma cópia): o salvar sozinho cria o registro dele
    await saveRestore(rec);
    document.getElementById('docName').value = rec.name || '';
    docEdited();
    saveStatus('Aberto do arquivo: ' + rec.name);
  } catch(e){ saveStatus('Erro ao abrir arquivo: ' + (e.message||e), true); }
}
(function initSaveDocsUI(){
  const $ = id=>document.getElementById(id);
  if (!$('btnSaveDoc')) return;
  // nome no topo: cada letra conta como mudança (renomear atualiza o mesmo documento)
  $('docName').addEventListener('input', ()=>docEdited());
  $('docName').addEventListener('keydown', e=>{ if (e.key === 'Enter'){ e.preventDefault(); e.target.blur(); } });
  // salvar sozinho: liga/desliga (lembra neste navegador)
  const chk = $('autoSaveOn');
  try { if (localStorage.getItem('props.autosave') === '0') chk.checked = false; } catch(e){ /* sem armazenamento */ }
  chk.addEventListener('change', ()=>{
    try { localStorage.setItem('props.autosave', chk.checked ? '1' : '0'); } catch(e){ /* sem armazenamento */ }
    if (chk.checked && docChangeSeq !== saveSavedSeq && docChangeSeq !== docLoadSeq) autoNote(); else chipRefresh();
  });
  $('btnSaveDoc').addEventListener('click', saveNow);
  $('btnSaveFile').addEventListener('click', saveToFile);
  $('btnOpenFile').addEventListener('click', ()=>$('fileOpenDoc').click());
  $('fileOpenDoc').addEventListener('change', e=>{ const f = e.target.files[0]; if (f) saveFromFile(f); e.target.value = ''; });
  $('btnRefreshDocs').addEventListener('click', saveRefreshList);
  chipRefresh();
})();
