/* Harness de provas (Node 22+, Edge sem janela via CDP — mesmo método de tools/brand-build).
   Uso:
     node tools/_verify/render.js shot <url> <saida.png> [largura altura] [esperaTitulo]
        -> abre a URL, espera document.title === esperaTitulo (padrão 'done'), tira captura da página inteira.
     node tools/_verify/render.js templates <pasta> [mult] [id ...]
        -> abre props-generator.html, pra cada modelo faz loadTemplate(id) e exporta PNG (multiplicador mult,
           padrão 1) + relatório do DocKit.lint (se existir) em <pasta>/<id>.png e <pasta>/lint.json.
     node tools/_verify/render.js eval <arquivo.js> [url]
        -> abre a página (padrão props-generator.html), roda o arquivo JS (async) e imprime o retorno.
   O servidor local (tools/_verify/serve.py, porta 8000) precisa estar rodando.
   Perfil temporário do Edge é APAGADO no fim (ele enche o disco). */
const { spawn, execSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const EDGE = process.env.EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = process.env.BASE || 'http://localhost:8000/tools/';
const PORT = 9300 + Math.floor(Math.random() * 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(w, h) {
  const ud = path.join(process.env.SCRATCH || os.tmpdir(), 'edge_profile_' + Date.now());
  const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${ud}`,
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars',
    '--force-color-profile=srgb', '--force-device-scale-factor=1', `--window-size=${Math.round(w)},${Math.round(h)}`,
    '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 80; i++) {
    try {
      const t = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = t.find((x) => x.type === 'page');
      if (page) { ws = page.webSocketDebuggerUrl; break; }
    } catch (e) { /* subindo */ }
    await sleep(250);
  }
  if (!ws) { cleanup({ proc, ud }); throw new Error('Edge não subiu'); }
  const sock = new WebSocket(ws);
  await new Promise((r, j) => { sock.onopen = r; sock.onerror = j; });
  let id = 0; const pend = new Map(); const listeners = [];
  sock.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { const { res, rej } = pend.get(d.id); pend.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); }
    else listeners.forEach((l) => l(d));
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); sock.send(JSON.stringify({ id: i, method, params })); });
  const waitEvent = (name) => new Promise((res) => { const l = (d) => { if (d.method === name) { listeners.splice(listeners.indexOf(l), 1); res(d); } }; listeners.push(l); });
  await send('Page.enable'); await send('Runtime.enable');
  return { proc, sock, send, waitEvent, ud };
}
/* Encerra SÓ o Edge que este script abriu (o perfil dele é identificado pelo --user-data-dir; nunca
   `taskkill /IM msedge.exe`, que derrubaria o Edge do usuário) e apaga o perfil temporário. O Edge
   deixa processos-filho (gpu, crashpad) vivos segurando arquivos, e o perfil tem caminhos que o
   rmSync do Node às vezes não alcança — por isso o plano B com robocopy (espelhar uma pasta vazia). */
function cleanup(c) {
  try { c.sock && c.sock.close(); } catch (e) {}
  const mark = c.ud.replace(/\\/g, '\\\\');
  try { execSync(`taskkill /PID ${c.proc.pid} /T /F`, { stdio: 'ignore' }); } catch (e) {}
  try {
    execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name='msedge.exe'\\" | Where-Object { $_.CommandLine -like '*${path.basename(c.ud)}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' });
  } catch (e) {}
  for (let i = 0; i < 6; i++) {
    try { fs.rmSync(c.ud, { recursive: true, force: true }); } catch (e) {}
    if (!fs.existsSync(c.ud)) return;
    execSync('ping -n 2 127.0.0.1 >nul', { stdio: 'ignore' });
  }
  const empty = c.ud + '_vazio';
  try {
    fs.mkdirSync(empty, { recursive: true });
    try { execSync(`robocopy "${empty}" "${c.ud}" /MIR /NFL /NDL /NJH /NJS /NP`, { stdio: 'ignore' }); } catch (e) { /* robocopy sai com código != 0 mesmo quando funciona */ }
    fs.rmSync(c.ud, { recursive: true, force: true }); fs.rmSync(empty, { recursive: true, force: true });
  } catch (e) { console.log('AVISO: não consegui apagar o perfil', c.ud); }
}
async function evalJS(c, expr, awaitPromise = true) {
  const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise });
  if (r.exceptionDetails) throw new Error('JS: ' + JSON.stringify(r.exceptionDetails).slice(0, 900));
  return r.result.value;
}
async function open(c, url) {
  const loaded = c.waitEvent('Page.loadEventFired');
  await c.send('Page.navigate', { url });
  await loaded;
}
async function waitFor(c, cond, ms = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (await evalJS(c, cond, false)) return true; } catch (e) {}
    await sleep(300);
  }
  throw new Error('timeout esperando: ' + cond);
}

async function cmdShot(url, out, w = 1400, h = 1000, title = 'done') {
  const c = await launch(w, h);
  try {
    await open(c, url);
    await waitFor(c, `document.title==${JSON.stringify(title)}`, 120000);
    const dim = await evalJS(c, '({w:Math.max(document.documentElement.scrollWidth,innerWidth),h:Math.max(document.documentElement.scrollHeight,innerHeight)})', false);
    await c.send('Emulation.setDeviceMetricsOverride', { width: dim.w, height: dim.h, deviceScaleFactor: 1, mobile: false });
    await sleep(500);
    const r = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: dim.w, height: dim.h, scale: 1 } });
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(r.data, 'base64'));
    console.log('ok', out, dim.w + 'x' + dim.h);
  } finally { cleanup(c); }
}

async function cmdTemplates(dir, mult = 1, ids = []) {
  const c = await launch(1500, 1000);
  try {
    await open(c, BASE + 'props-generator.html?cb=' + Date.now());
    await waitFor(c, "typeof canvas!=='undefined' && canvas && typeof loadTemplate==='function' && currentTemplate==='newspaper' && canvas.getObjects().length>3", 60000);
    await sleep(800);
    if (!ids.length) ids = await evalJS(c, "[...document.getElementById('templateSel').options].map(o=>o.value)", false);
    fs.mkdirSync(dir, { recursive: true });
    const lint = {};
    for (const id of ids) {
      try {
        const res = await evalJS(c, `(async()=>{
          await loadTemplate(${JSON.stringify(id)});
          await new Promise(r=>setTimeout(r,400));
          canvas.discardActiveObject(); canvas.renderAll();
          const url = canvas.toDataURL({format:'png', multiplier: ${+mult}/canvas.getZoom()});
          const lint = (typeof DocKit!=='undefined' && DocKit.lint) ? DocKit.lint(canvas) : null;
          return {url, lint, n: canvas.getObjects().length, w: PAGE_W, h: PAGE_H};
        })()`);
        fs.writeFileSync(path.join(dir, id + '.png'), Buffer.from(res.url.split(',')[1], 'base64'));
        lint[id] = { n: res.n, size: res.w + 'x' + res.h, lint: res.lint };
        console.log('ok', id, res.w + 'x' + res.h, res.n + ' objs', res.lint && res.lint.length ? res.lint.length + ' avisos' : '');
      } catch (e) { console.log('ERRO', id, String(e.message).slice(0, 300)); lint[id] = { erro: String(e.message).slice(0, 300) }; }
    }
    fs.writeFileSync(path.join(dir, 'lint.json'), JSON.stringify(lint, null, 1));
  } finally { cleanup(c); }
}

async function cmdEval(file, url) {
  const c = await launch(1500, 1000);
  try {
    await open(c, url || (BASE + 'props-generator.html?cb=' + Date.now()));
    await waitFor(c, "typeof canvas!=='undefined' && canvas && typeof loadTemplate==='function' && canvas.getObjects().length>3", 60000);
    await sleep(500);
    const out = await evalJS(c, '(async()=>{' + fs.readFileSync(file, 'utf8') + '})()');
    console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 1));
  } finally { cleanup(c); }
}

(async () => {
  const [cmd, ...a] = process.argv.slice(2);
  if (cmd === 'shot') await cmdShot(a[0], a[1], a[2] ? +a[2] : undefined, a[3] ? +a[3] : undefined, a[4]);
  else if (cmd === 'templates') await cmdTemplates(a[0], a[1] ? +a[1] : 1, a.slice(2));
  else if (cmd === 'eval') await cmdEval(a[0], a[1]);
  else console.log('uso: render.js shot|templates|eval ...');
  process.exit(0);
})().catch((e) => { console.error('FALHOU', e.message); process.exit(1); });
