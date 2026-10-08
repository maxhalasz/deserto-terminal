/* ===================== Salvar / abrir documentos =====================
   Pedido do Max: guardar documentos semi-prontos pra abrir, editar e corrigir depois.
   Onde guarda (o primeiro que funcionar, nessa ordem):
     1) NO SITE: Firebase Realtime Database do projeto (props_docs_index/<id> = resumo; props_docs/<id> = corpo).
        O SDK só é baixado quando o Max clica em Salvar/Atualizar lista (a ferramenta continua offline por padrão).
     2) NESTE NAVEGADOR: IndexedDB (se o Firebase não responder ou negar permissão).
     3) ARQUIVO .json: botões "Baixar arquivo" / "Abrir arquivo" (backup que não depende de nada).
   O que é salvo: todas as páginas (json do canvas, sem o histórico de desfazer) + qual página estava aberta.
   O corpo vai comprimido (gzip → base64) porque fotos viram data URL e o Firebase limita ~10 MB por gravação.
   Documentos de marca (aba Marcas) têm outro sistema de lados e ainda não entram aqui. */

const SAVE_DB_PATH = 'props_docs', SAVE_INDEX_PATH = 'props_docs_index';
const SAVE_MAX_BYTES = 9*1024*1024;
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

/* Pacote do documento atual. */
async function saveCollect(name){
  if (currentTemplate && currentTemplate.indexOf('brand:') === 0) throw new Error('Documentos de marca ainda não podem ser salvos por aqui.');
  canvas.discardActiveObject();
  pageSaveCurrent();
  const pages = PAGES.map(p=>({json:p.json, pageW:p.pageW, pageH:p.pageH, template:p.template}));
  const payload = JSON.stringify({v:1, template:currentTemplate, cur:curPageIdx, pages});
  const gz = await saveGzip(payload);
  return {id:saveSlug(name), name, template:currentTemplate, savedAt:Date.now(), nPages:pages.length, bytes:gz.length, data:gz};
}
async function saveRestore(rec){
  const d = JSON.parse(await saveGunzip(rec.data));
  if (!d || !d.pages || !d.pages.length) throw new Error('Arquivo de documento vazio ou inválido.');
  return withSceneLock(async ()=>{
    if (typeof brandOnLeave === 'function') brandOnLeave();
    PAGES = d.pages.map(p=>({json:p.json, pageW:p.pageW, pageH:p.pageH, template:p.template}));
    curPageIdx = Math.max(0, Math.min(PAGES.length-1, d.cur||0));
    await sceneSwitchTo(PAGES[curPageIdx], {applyFields: applyPageSceneFields, afterLoad: ()=>recomputeBgFieldsFromObjects(canvas.getObjects())});
    const sel = document.getElementById('templateSel');
    if (sel && [...sel.options].some(o=>o.value===currentTemplate)) sel.value = currentTemplate;
    renderLayerList(); updateInspector(); updateUndoRedoButtons(); syncNewsLayoutUI(); updatePageNavUI();
    if (typeof syncDocVariantUI === 'function') syncDocVariantUI();
  });
}

/* ---- Firebase (carregado só quando precisa) ---- */
function saveLoadScript(src){
  return new Promise((res, rej)=>{ const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = ()=>rej(new Error('não consegui carregar ' + src)); document.head.appendChild(s); });
}
function saveFirebase(){
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
async function fbSave(rec){
  const d = await saveFirebase();
  if (rec.bytes > SAVE_MAX_BYTES) throw new Error('documento grande demais pro site (' + (rec.bytes/1048576).toFixed(1) + ' MB; limite ~9 MB)');
  await d.ref(SAVE_DB_PATH + '/' + rec.id).set({data:rec.data});
  await d.ref(SAVE_INDEX_PATH + '/' + rec.id).set({name:rec.name, template:rec.template, savedAt:rec.savedAt, nPages:rec.nPages, bytes:rec.bytes});
}
async function fbList(){
  const d = await saveFirebase();
  const snap = await d.ref(SAVE_INDEX_PATH).once('value');
  const v = snap.val() || {};
  return Object.keys(v).map(id=>Object.assign({id, where:'site'}, v[id]));
}
async function fbLoad(id){
  const d = await saveFirebase();
  const snap = await d.ref(SAVE_DB_PATH + '/' + id).once('value');
  const v = snap.val();
  if (!v || !v.data) throw new Error('documento não encontrado no site');
  return {id, data:v.data};
}
async function fbDelete(id){
  const d = await saveFirebase();
  await d.ref(SAVE_DB_PATH + '/' + id).remove(); await d.ref(SAVE_INDEX_PATH + '/' + id).remove();
}

/* ---- IndexedDB (plano B neste navegador) ---- */
function idb(){
  return new Promise((res, rej)=>{
    const r = indexedDB.open('props-docs', 1);
    r.onupgradeneeded = ()=>r.result.createObjectStore('docs', {keyPath:'id'});
    r.onsuccess = ()=>res(r.result); r.onerror = ()=>rej(r.error);
  });
}
const idbTx = (mode, fn)=>idb().then(db=>new Promise((res, rej)=>{ const t = db.transaction('docs', mode), st = t.objectStore('docs'); const out = fn(st); t.oncomplete = ()=>res(out && out.result !== undefined ? out.result : undefined); t.onerror = ()=>rej(t.error); }));
const localSave = (rec)=>idbTx('readwrite', st=>st.put(rec));
const localList = ()=>idbTx('readonly', st=>st.getAll()).then(a=>(a||[]).map(r=>({id:r.id, name:r.name, template:r.template, savedAt:r.savedAt, nPages:r.nPages, bytes:r.bytes, where:'navegador'})));
const localLoad = (id)=>idbTx('readonly', st=>st.get(id));
const localDelete = (id)=>idbTx('readwrite', st=>st.delete(id));

/* ---- interface ---- */
function saveStatus(msg, bad){
  const el = document.getElementById('saveStatus'); if (!el) return;
  el.textContent = msg; el.style.color = bad ? '#e58a8a' : '#8fb0dc';
}
async function saveRefreshList(){
  const box = document.getElementById('docList'); if (!box) return;
  box.textContent = 'Carregando…';
  let items = [], fbErr = null;
  try { items = await fbList(); } catch(e){ fbErr = e; }
  try { items = items.concat(await localList()); } catch(e){ /* IndexedDB indisponível */ }
  items.sort((a, b)=>(b.savedAt||0) - (a.savedAt||0));
  box.innerHTML = '';
  if (fbErr) saveStatus('Site indisponível (' + (fbErr.code || fbErr.message || fbErr) + '). Mostrando só o que está neste navegador.', true);
  if (!items.length){ box.textContent = 'Nenhum documento salvo ainda.'; return; }
  items.forEach(it=>{
    const row = document.createElement('div'); row.className = 'layerRow';
    const nm = document.createElement('span'); nm.className = 'nm';
    const when = it.savedAt ? new Date(it.savedAt).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'}) : '';
    nm.textContent = (it.where === 'site' ? '☁ ' : '💻 ') + it.name; nm.title = `${it.template || ''} · ${it.nPages||1} pág. · ${when} · ${it.where}`;
    row.appendChild(nm);
    const open = document.createElement('button'); open.textContent = 'Abrir';
    open.addEventListener('click', ()=>saveOpen(it));
    const del = document.createElement('button'); del.textContent = '✕'; del.title = 'Apagar';
    del.addEventListener('click', async ()=>{
      if (!confirm('Apagar "' + it.name + '" (' + it.where + ')? Não dá pra desfazer.')) return;
      try { if (it.where === 'site') await fbDelete(it.id); else await localDelete(it.id); saveStatus('Apagado.'); } catch(e){ saveStatus('Não consegui apagar: ' + (e.message||e), true); }
      saveRefreshList();
    });
    row.appendChild(open); row.appendChild(del); box.appendChild(row);
  });
}
async function saveOpen(it){
  if (!confirm('Abrir "' + it.name + '" apaga o documento que está na tela. Continuar?')) return;
  try {
    saveStatus('Abrindo…');
    const rec = it.where === 'site' ? await fbLoad(it.id) : await localLoad(it.id);
    await saveRestore(rec);
    document.getElementById('docName').value = it.name;
    saveStatus('Aberto: ' + it.name);
  } catch(e){ saveStatus('Erro ao abrir: ' + (e.message||e), true); console.error(e); }
}
async function saveNow(){
  const nameEl = document.getElementById('docName');
  const name = (nameEl.value || '').trim();
  if (!name){ saveStatus('Dê um nome ao documento.', true); nameEl.focus(); return; }
  try {
    saveStatus('Salvando…');
    const rec = await saveCollect(name);
    let where = 'site';
    try { await fbSave(rec); }
    catch(e){
      console.warn('Firebase não salvou:', e);
      where = 'navegador';
      await localSave(rec);
      const denied = e && (e.code === 'PERMISSION_DENIED' || /permission/i.test(String(e.message||'')));
      saveStatus(denied
        ? 'O site negou a gravação: as regras do Firebase ainda não liberam "props_docs" (instrução abaixo, é uma vez só). Salvei neste navegador por enquanto — baixe o arquivo pra ter backup.'
        : 'Não consegui salvar no site (' + (e.code || e.message || e) + '). Salvei só neste navegador — baixe o arquivo pra ter backup.', true);
      if (denied){ const h = document.getElementById('saveRulesHelp'); if (h) h.open = true; }
      saveRefreshList(); return;
    }
    saveStatus('Salvo no site: ' + name + ' (' + (rec.bytes/1024).toFixed(0) + ' KB, ' + rec.nPages + ' pág.)');
    saveRefreshList();
  } catch(e){ saveStatus('Erro ao salvar: ' + (e.message||e), true); console.error(e); }
}
async function saveToFile(){
  const name = (document.getElementById('docName').value || '').trim() || 'documento';
  try {
    const rec = await saveCollect(name);
    const blob = new Blob([JSON.stringify({props_doc:1, id:rec.id, name:rec.name, template:rec.template, savedAt:rec.savedAt, nPages:rec.nPages, data:rec.data})], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = rec.id + '.props.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    saveStatus('Arquivo baixado: ' + rec.id + '.props.json');
  } catch(e){ saveStatus('Erro: ' + (e.message||e), true); }
}
async function saveFromFile(file){
  try {
    const rec = JSON.parse(await file.text());
    if (!rec.props_doc || !rec.data) throw new Error('não é um arquivo de documento do gerador de props');
    if (!confirm('Abrir "' + rec.name + '" apaga o documento que está na tela. Continuar?')) return;
    await saveRestore(rec);
    document.getElementById('docName').value = rec.name || '';
    saveStatus('Aberto do arquivo: ' + rec.name);
  } catch(e){ saveStatus('Erro ao abrir arquivo: ' + (e.message||e), true); }
}
(function initSaveDocsUI(){
  const $ = id=>document.getElementById(id);
  if (!$('btnSaveDoc')) return;
  $('btnSaveDoc').addEventListener('click', saveNow);
  $('btnSaveFile').addEventListener('click', saveToFile);
  $('btnOpenFile').addEventListener('click', ()=>$('fileOpenDoc').click());
  $('fileOpenDoc').addEventListener('change', e=>{ const f = e.target.files[0]; if (f) saveFromFile(f); e.target.value = ''; });
  $('btnRefreshDocs').addEventListener('click', saveRefreshList);
  localList().then(items=>{ if (items.length && !$('docList').dataset.init){ $('docList').dataset.init = '1'; } }).catch(()=>{});
})();
