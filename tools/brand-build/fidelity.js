// compara o documento montado no editor (Fabric) com o mockup HTML renderizado na mesma resolução
const fs = require('fs'), path = require('path');
const { spawn } = require('child_process');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SOLO = path.join(__dirname, 'solo').split(path.sep).join('/');
const TOOL = process.env.TOOL_URL || 'file:///' + path.join(__dirname, '..', 'props-generator.html').split(path.sep).join('/');
const OUTD = path.join(__dirname, 'fid_out'); fs.mkdirSync(OUTD, { recursive: true });
const REG = JSON.parse(fs.readFileSync(path.join(__dirname, 'brand_registry.json'), 'utf8'));
const PORT = 9555;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kOf = (doc) => ({ od_badge: 2, dre_tag: 3 }[doc] || (1240 / 460));

async function launch() {
  const ud = path.join(__dirname, 'ep_f' + Date.now());
  const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${ud}`, '--disable-lcd-text', '--hide-scrollbars', '--force-color-profile=srgb', '--disable-gpu', '--allow-file-access-from-files', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 60; i++) { try { const t = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = t.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch (e) {} await sleep(250); }
  const sock = new WebSocket(ws); await new Promise((r) => (sock.onopen = r));
  let id = 0; const pend = new Map(); const ls = [];
  sock.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const { res, rej } = pend.get(d.id); pend.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); } else ls.forEach((l) => l(d)); };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); sock.send(JSON.stringify({ id: i, method, params })); });
  const waitEvent = (n) => new Promise((res) => { const l = (d) => { if (d.method === n) { ls.splice(ls.indexOf(l), 1); res(d); } }; ls.push(l); });
  const errors = [];
  ls.push((d) => {
    if (d.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(d.params.exceptionDetails).slice(0, 500));
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push('console.error: ' + d.params.args.map((a) => a.value || a.description).join(' ').slice(0, 400));
  });
  return { proc, sock, send, waitEvent, errors, ud };
}
const ev = async (c, expr, aw) => {
  const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: !!aw });
  if (r.exceptionDetails) throw new Error('JS: ' + JSON.stringify(r.exceptionDetails).slice(0, 700));
  return r.result.value;
};

(async () => {
  const targets = process.argv.slice(2);
  const c = await launch();
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  try {
    for (const t of targets) {
      const [doc, side] = t.split(':');
      const ent = REG.find((e) => e.doc === doc && e.side === side);
      const soloFile = ent.file.replace('.dc.html', '.html');
      const man = JSON.parse(fs.readFileSync(path.join(SOLO, 'manifest.json'), 'utf8')).find((m) => m.file === soloFile);
      const k = kOf(doc), Z = 2 * k;
      const pw = Math.round(man.w * Z), ph = Math.floor(man.h * Z);
      await c.send('Emulation.setDeviceMetricsOverride', { width: pw, height: ph, deviceScaleFactor: 1, mobile: false });
      let lo = c.waitEvent('Page.loadEventFired');
      await c.send('Page.navigate', { url: 'file:///' + SOLO + '/' + soloFile }); await lo;
      await ev(c, `document.documentElement.style.zoom=${Z}`);
      await ev(c, 'document.fonts.ready.then(()=>1)', true); await sleep(700);
      const ref = (await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: pw, height: ph, scale: 1 } })).data;
      fs.writeFileSync(path.join(OUTD, `${doc}_${side}_ref.png`), Buffer.from(ref, 'base64'));

      await c.send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 1000, deviceScaleFactor: 1, mobile: false });
      lo = c.waitEvent('Page.loadEventFired');
      await c.send('Page.navigate', { url: TOOL }); await lo;
      await sleep(1800);
      await ev(c, `(async()=>{ await document.fonts.ready; await loadBrandDoc(${JSON.stringify(doc)}, 'front'); ${side === 'back' ? "await brandSwitchSide('back');" : ''} return 1; })()`, true);
      await sleep(300);
      const mine = await ev(c, `(()=>{ canvas.discardActiveObject(); canvas.renderAll(); return canvas.toDataURL({format:'png', multiplier: 2 / canvas.getZoom()}).split(',')[1]; })()`);
      fs.writeFileSync(path.join(OUTD, `${doc}_${side}_mine.png`), Buffer.from(mine, 'base64'));

      const stats = await ev(c, `(async()=>{
        const load = (b64)=> new Promise((res)=>{ const i=new Image(); i.onload=()=>res(i); i.src='data:image/png;base64,'+b64; });
        const [a,b] = await Promise.all([load(${JSON.stringify(ref)}), load(${JSON.stringify(mine)})]);
        const W=Math.min(a.width,b.width), H=Math.min(a.height,b.height);
        const mk=(im)=>{ const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,W,H); x.drawImage(im,0,0); return x.getImageData(0,0,W,H); };
        const A=mk(a), B=mk(b);
        const out=document.createElement('canvas'); out.width=W; out.height=H; const ox=out.getContext('2d'); const O=ox.createImageData(W,H);
        let sum=0, big=0, n=W*H;
        for(let i=0;i<n;i++){
          const d=(Math.abs(A.data[i*4]-B.data[i*4])+Math.abs(A.data[i*4+1]-B.data[i*4+1])+Math.abs(A.data[i*4+2]-B.data[i*4+2]))/3;
          sum+=d; if(d>48) big++;
          const gray=(A.data[i*4]+A.data[i*4+1]+A.data[i*4+2])/3;
          const base=Math.min(255,gray*0.35+165);
          const g=Math.max(0,base-Math.min(base,d*1.6));
          O.data[i*4]=d<6?base:255; O.data[i*4+1]=d<6?base:g; O.data[i*4+2]=d<6?base:g; O.data[i*4+3]=255;
        }
        ox.putImageData(O,0,0);
        return JSON.stringify({W,H,ref:[a.width,a.height],mine:[b.width,b.height],meanAbs:(sum/n).toFixed(3),pctBig:(100*big/n).toFixed(3), heat: out.toDataURL('image/png').split(',')[1]});
      })()`, true);
      const st = JSON.parse(stats);
      fs.writeFileSync(path.join(OUTD, `${doc}_${side}_heat.png`), Buffer.from(st.heat, 'base64'));
      console.log(`${doc}:${side}  ref ${st.ref} mine ${st.mine}  meanAbs ${st.meanAbs}  %pix>48: ${st.pctBig}`);
    }
  } finally {
    if (c.errors.length) console.log('ERROS DA PAGINA:\n' + c.errors.join('\n'));
    c.sock.close(); try { require('child_process').execSync('taskkill /pid ' + c.proc.pid + ' /T /F', { stdio: 'ignore' }); } catch (e) { c.proc.kill(); }
    await sleep(1500);
    try { fs.rmSync(c.ud, { recursive: true, force: true, maxRetries: 8, retryDelay: 400 }); } catch (e) { /* perfil temporário do Edge */ }
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
