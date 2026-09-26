// Pipeline: solo HTML (mockup) -> pack híbrido (arte raster sem o texto editável + campos + objetos)
// uso: node brand_build.js [doc:side ...]   (sem args = todos do brand_registry.json)
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const SCRATCH = __dirname;
const REG = JSON.parse(fs.readFileSync(path.join(SCRATCH, 'brand_registry.json'), 'utf8'));
const SOLO = path.join(__dirname, 'solo').split(path.sep).join('/');
const OUT = path.join(__dirname, '..', 'vendor', 'brand');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9333;
fs.mkdirSync(OUT, { recursive: true });

// escala css->unidades do canvas do editor, por documento
const DOC_K = { od_badge: 2, dre_tag: 3 };
const kOf = (doc) => DOC_K[doc] || (1240 / 460);

// ---------- código que roda DENTRO da página ----------
function EXTRACT(Z) {
  const warns = [];
  const rect = (n) => { const r = n.getBoundingClientRect(); return { left: r.left / Z, top: r.top / Z, right: r.right / Z, bottom: r.bottom / Z, width: r.width / Z, height: r.height / Z }; };
  const crects = (rg) => Array.from(rg.getClientRects()).map((r) => ({ left: r.left / Z, top: r.top / Z, width: r.width / Z, height: r.height / Z }));
  const root = document.querySelector('body > div');
  const rr = rect(root);
  const PAGE = { w: root.offsetWidth, h: root.offsetHeight };
  const cv = document.createElement('canvas').getContext('2d');
  const num = (v) => parseFloat(v) || 0;

  function ancestors(el) { const a = []; let e = el; while (e && e !== document.body) { a.push(e); e = e.parentElement; } return a; }
  function cumAngle(el) {
    let ang = 0;
    ancestors(el).forEach((e) => {
      const t = getComputedStyle(e).transform;
      if (t && t !== 'none') { const m = new DOMMatrix(t); ang += Math.atan2(m.b, m.a) * 180 / Math.PI; }
    });
    return ang;
  }
  function neutralize(el) {
    const saved = [];
    ancestors(el).forEach((e) => {
      const t = getComputedStyle(e).transform;
      if (t && t !== 'none') { saved.push([e, e.style.transform]); e.style.transform = 'none'; }
    });
    return () => saved.forEach(([e, v]) => { e.style.transform = v; });
  }
  function opacityChain(el) {
    let o = 1; ancestors(el).forEach((e) => { o *= parseFloat(getComputedStyle(e).opacity); }); return o;
  }
  function isolatedByAncestor(el) {
    let e = el.parentElement;
    while (e && e !== document.body) {
      const c = getComputedStyle(e);
      if (c.transform !== 'none' || parseFloat(c.opacity) < 1 || c.filter !== 'none' || c.mixBlendMode !== 'normal' || c.isolation === 'isolate') return true;
      if (c.position !== 'static' && c.zIndex !== 'auto') return true;
      e = e.parentElement;
    }
    return false;
  }
  const WSRE = /[ \t\n\r\f]/;

  const allEls = Array.from(document.querySelectorAll('[data-e],[data-obj]'));
  const fields = [];
  document.querySelectorAll('[data-e]').forEach((el, idx) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'inline') warns.push('inline data-e #' + idx + ': ' + el.textContent.slice(0, 30));
    const angle = cumAngle(el);
    const bb = rect(el);
    const cxF = bb.left + bb.width / 2 - rr.left, cyF = bb.top + bb.height / 2 - rr.top;
    const restore = neutralize(el);
    const r0 = rect(el);
    const bl = num(cs.borderLeftWidth), br = num(cs.borderRightWidth), bt = num(cs.borderTopWidth), bbm = num(cs.borderBottomWidth);
    const pl = num(cs.paddingLeft), pr = num(cs.paddingRight), pt = num(cs.paddingTop), pb = num(cs.paddingBottom);
    const cLeft = r0.left + bl + pl, cTop = r0.top + bt + pt;
    const cW = r0.width - bl - br - pl - pr, cH = r0.height - bt - bbm - pt - pb;
    const dx = ((bl + pl) - (br + pr)) / 2, dy = ((bt + pt) - (bbm + pb)) / 2;
    const th = angle * Math.PI / 180;
    const cx = cxF + dx * Math.cos(th) - dy * Math.sin(th), cy = cyF + dx * Math.sin(th) + dy * Math.cos(th);

    const ws = cs.whiteSpace, pre = ws.startsWith('pre'), nowrap = ws === 'nowrap' || ws === 'pre';
    const baseW = parseInt(cs.fontWeight, 10) || 400;
    const fam = cs.fontFamily, fsz = num(cs.fontSize), fstyle = cs.fontStyle;
    const color = cs.color;

    // 1. caracteres com estilo
    const chars = [];
    (function walk(node, flags) {
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          const p = n.parentElement, pc = getComputedStyle(p);
          const w = parseInt(pc.fontWeight, 10) || 400;
          const f = { b: w > baseW, r: !!p.closest('[data-r]') && el.contains(p.closest('[data-r]')) };
          if (pc.color !== color && !f.r) warns.push('cor divergente em #' + idx + ' "' + n.nodeValue.slice(0, 20) + '"');
          if (pc.fontFamily !== fam || Math.abs(num(pc.fontSize) - fsz) > 0.01) warns.push('fonte/tamanho divergente em #' + idx + ' "' + n.nodeValue.slice(0, 20) + '"');
          if (pc.fontStyle !== fstyle) warns.push('estilo divergente em #' + idx);
          const s = n.nodeValue;
          for (let k = 0; k < s.length; k++) chars.push({ ch: s[k], node: n, k, b: f.b, r: f.r });
        } else if (n.nodeType === 1) {
          if (n.tagName === 'BR') chars.push({ ch: '\n', br: true, b: false, r: false });
          else walk(n);
        }
      });
    })(el);

    // 2. colapso de espaço (regras do CSS white-space:normal/nowrap) — ou cru se pre
    let out = [];
    if (pre) {
      out = chars.map((c) => Object.assign({}, c));
    } else {
      let prevSpace = true;
      chars.forEach((c) => {
        if (c.br) { if (out.length && out[out.length - 1].ch === ' ') out.pop(); out.push(c); prevSpace = true; return; }
        if (WSRE.test(c.ch)) { if (prevSpace) return; out.push(Object.assign({}, c, { ch: ' ' })); prevSpace = true; }
        else { out.push(c); prevSpace = false; }
      });
      while (out.length && out[out.length - 1].ch === ' ') out.pop();
    }
    if (!out.length) { restore(); warns.push('campo vazio #' + idx); return; }

    // 3. quebras suaves reais do DOM (retângulo de cada caractere visível)
    const rng = document.createRange();
    const lineOf = new Array(out.length).fill(-1);
    let curTop = null, curLine = -1, firstTop = null, secondTop = null;
    out.forEach((c, i) => {
      if (c.br || c.ch === '\n' || c.ch === ' ') return;
      rng.setStart(c.node, c.k); rng.setEnd(c.node, c.k + 1);
      const rc = crects(rng)[0];
      if (!rc || rc.height === 0) return;
      if (curTop === null || rc.top - curTop > rc.height * 0.5) {
        curLine++; curTop = rc.top;
        if (curLine === 0) firstTop = rc.top; else if (curLine === 1) secondTop = rc.top;
      }
      lineOf[i] = curLine;
    });
    let plain = '', wraps = [];
    const runs = [];
    out.forEach((c, i) => {
      // início de nova linha suave = primeiro char visível cuja linha difere da última linha vista, sem \n imediatamente antes
      if (lineOf[i] > 0 && (i === 0 || lineOf[i - 1] !== lineOf[i])) {
        // acha a linha anterior (ignora espaços/nl entre)
        let j = i - 1; while (j >= 0 && lineOf[j] === -1 && out[j].ch === ' ') j--;
        const prevCh = j >= 0 ? out[j] : null;
        const hard = out.slice(Math.max(0, j), i).some((x) => x.ch === '\n' || x.br);
        if (prevCh && !hard && lineOf[j] !== lineOf[i]) wraps.push(plain.length);
      }
      plain += c.ch;
      const last = runs[runs.length - 1];
      if (last && last.b === c.b && last.r === c.r) last.t += c.ch; else runs.push({ t: c.ch, b: c.b, r: c.r });
    });
    let markup = '';
    const esc = (t) => t.replace(/[\\*\[\]]/g, (m) => '\\' + m);
    runs.forEach((r) => { markup += r.r ? '[[' + esc(r.t) + ']]' : r.b ? '**' + esc(r.t) + '**' : esc(r.t); });

    // 4. métricas
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    el.insertBefore(probe, el.firstChild);
    const base = rect(probe).bottom - cTop;
    el.removeChild(probe);
    let lh;
    if (cs.lineHeight !== 'normal') lh = num(cs.lineHeight);
    else if (secondTop !== null && firstTop !== null) lh = secondTop - firstTop;
    else lh = cH;
    const nLines = Math.max(1, curLine + 1 + out.filter((c) => c.ch === '\n' || c.br).length);
    let align = cs.textAlign; if (align === 'start') align = 'left'; if (align === 'end') align = 'right';
    restore();

    fields.push({
      id: 'f' + idx, hand: el.hasAttribute('data-hand'),
      cx, cy, w: cW, h: cH, angle,
      font: { family: fam, size: fsz, weight: baseW, style: fstyle },
      color, opacity: opacityChain(el), ls: cs.letterSpacing === 'normal' ? 0 : num(cs.letterSpacing),
      align, lh, base, nowrap, pre, text: markup, plain, wraps, nLines,
      redPad: 2, redBg: (function () { const r = el.querySelector('[data-r]'); return r ? getComputedStyle(r).backgroundColor : null; })(), ord: allEls.indexOf(el),
    });
  });

  const objs = [];
  document.querySelectorAll('[data-obj]').forEach((el, idx) => {
    const cs = getComputedStyle(el);
    const bb = rect(el);
    const pad = 3;
    let x = bb.left - rr.left - pad, y = bb.top - rr.top - pad, w = bb.width + pad * 2, h = bb.height + pad * 2;
    const x2 = Math.min(PAGE.w, x + w), y2 = Math.min(PAGE.h, y + h);
    x = Math.max(0, x); y = Math.max(0, y); w = x2 - x; h = y2 - y;
    const blend = (!isolatedByAncestor(el) && cs.mixBlendMode === 'multiply') ? 'multiply' : 'source-over';
    el.setAttribute('data-pick', String(idx));
    objs.push({ kind: el.dataset.obj, x, y, w, h, blend, idx, ord: allEls.indexOf(el) });
  });
  const slots = [];
  document.querySelectorAll('[data-slot]').forEach((el) => {
    const bb = rect(el);
    slots.push({ kind: el.dataset.slot, x: bb.left - rr.left, y: bb.top - rr.top, w: bb.width, h: bb.height });
  });
  return { PAGE, fields, objs, slots, warns };
}

// ---------- CDP ----------
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function launch(w, h) {
  const ud = path.join(SCRATCH, 'edge_profile_' + Date.now());
  const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${ud}`, '--disable-lcd-text', '--hide-scrollbars', '--force-color-profile=srgb', `--window-size=${Math.round(w)},${Math.round(h)}`, '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 60; i++) {
    try {
      const t = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = t.find((x) => x.type === 'page');
      if (page) { ws = page.webSocketDebuggerUrl; break; }
    } catch (e) { /* ainda subindo */ }
    await sleep(250);
  }
  if (!ws) throw new Error('Edge não subiu');
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
  return { proc, sock, send, waitEvent, ud };
}

async function evalJS(cdp, expr, awaitPromise = false) {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise });
  if (r.exceptionDetails) throw new Error('JS: ' + JSON.stringify(r.exceptionDetails).slice(0, 600));
  return r.result.value;
}
const setCss = (cdp, css) => evalJS(cdp, `(()=>{let s=document.getElementById('__hide'); if(!s){s=document.createElement('style'); s.id='__hide'; document.head.appendChild(s);} s.textContent=${JSON.stringify(css)}; return 1;})()`);
const shot = async (cdp, fmt, clip, quality) => {
  const p = { format: fmt, clip: Object.assign({ scale: 1 }, clip), fromSurface: true, captureBeyondViewport: false };
  if (quality) p.quality = quality;
  return Buffer.from((await cdp.send('Page.captureScreenshot', p)).data, 'base64');
};

(async () => {
  const want = process.argv.slice(2);
  const summary = [];
  const groups = {};
  for (const ent of REG) {
    const key = `${ent.doc}:${ent.side}`;
    if (want.length && !want.includes(key) && !want.includes(ent.doc)) continue;
    const dsf = 2 * kOf(ent.doc);
    (groups[dsf] = groups[dsf] || []).push(ent);
  }
  for (const dsfStr of Object.keys(groups)) {
    const dsf = +dsfStr;
    const first = groups[dsfStr][0]; const fman = JSON.parse(fs.readFileSync(path.join(SOLO, 'manifest.json'), 'utf8')).find((m) => m.file === first.file.replace('.dc.html', '.html'));
    const cdp = await launch(fman.w * dsf, fman.h * dsf);
    try {
      await cdp.send('Page.enable');
      await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
      for (const ent of groups[dsfStr]) {
        const key = `${ent.doc}:${ent.side}`;
        const soloFile = ent.file.replace('.dc.html', '.html');
        const man = JSON.parse(fs.readFileSync(path.join(SOLO, 'manifest.json'), 'utf8')).find((m) => m.file === soloFile);
        const k = kOf(ent.doc);
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: Math.round(man.w * dsf), height: Math.round(man.h * dsf), deviceScaleFactor: 1, mobile: false });
        const loaded = cdp.waitEvent('Page.loadEventFired');
        await cdp.send('Page.navigate', { url: 'file:///' + SOLO + '/' + soloFile });
        await loaded;
        await evalJS(cdp, `document.documentElement.style.zoom=${dsf}`);
        await evalJS(cdp, 'document.fonts.ready.then(()=>document.fonts.status)', true);
        await sleep(600);
        await evalJS(cdp, 'document.fonts.ready.then(()=>document.fonts.status)', true);
        const real = await evalJS(cdp, 'innerWidth+"x"+innerHeight+" root "+document.querySelector("body > div").offsetWidth+"x"+document.querySelector("body > div").offsetHeight');
        if (process.env.VERBOSE) console.log('viewport', real);

        const ex = await evalJS(cdp, `(${EXTRACT.toString()})(${dsf})`);
        await setCss(cdp, `html,body{background:transparent!important} [data-e],[data-e] *{color:transparent!important;text-decoration-color:transparent!important} [data-r]{background:transparent!important} [data-obj]{visibility:hidden!important}`);
        await sleep(150);
        const pw = Math.round(man.w * dsf), ph = Math.floor(man.h * dsf);
        const clipPage = { x: 0, y: 0, width: pw, height: ph };
        const png = await shot(cdp, 'png', clipPage);
        const webp = await shot(cdp, 'webp', clipPage, 90);
        const usePng = png.length <= 700 * 1024 || png.length <= webp.length * 1.15;
        const artBuf = usePng ? png : webp;
        const art = { src: `data:image/${usePng ? 'png' : 'webp'};base64,` + artBuf.toString('base64'), w: pw, h: ph, fmt: usePng ? 'png' : 'webp' };

        const objs = [];
        for (const o of ex.objs) {
          const x0 = Math.floor(o.x * dsf), y0 = Math.floor(o.y * dsf), x1 = Math.ceil((o.x + o.w) * dsf), y1 = Math.ceil((o.y + o.h) * dsf);
          await setCss(cdp, `html,body{background:transparent!important} body *{visibility:hidden!important} body *:not([data-pick="${o.idx}"]):not([data-pick="${o.idx}"] *){filter:none!important;background:none!important;box-shadow:none!important} [data-pick="${o.idx}"],[data-pick="${o.idx}"] *{visibility:visible!important} [data-notext],[data-notext] *{color:transparent!important}`);
          await sleep(100);
          const clipO = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
          let b = await shot(cdp, 'png', clipO), mime = 'png';
          if (b.length > 80 * 1024) { const w2 = await shot(cdp, 'webp', clipO, 95); if (w2.length < b.length * 0.7) { b = w2; mime = 'webp'; } }
          objs.push({ kind: o.kind, ord: o.ord, x: x0 / dsf, y: y0 / dsf, w: (x1 - x0) / dsf, h: (y1 - y0) / dsf, blend: o.blend, src: `data:image/${mime};base64,` + b.toString('base64') });
        }

        const pack = { key, doc: ent.doc, side: ent.side, family: ent.family, label: ent.label, wCss: man.w, hCss: man.h, k, art, fields: ex.fields, objs, slots: ex.slots };
        const fn = path.join(OUT, `${ent.doc}_${ent.side}.js`);
        fs.writeFileSync(fn, `window.BRAND_PACK=window.BRAND_PACK||{};window.BRAND_PACK[${JSON.stringify(key)}]=${JSON.stringify(pack)};
`);
        const kb = (fs.statSync(fn).size / 1024).toFixed(0);
        summary.push(`${key}  ${art.fmt} art ${Math.round(artBuf.length / 1024)}KB (png ${Math.round(png.length / 1024)} / webp ${Math.round(webp.length / 1024)})  file ${kb}KB  fields ${ex.fields.length} objs ${objs.length} slots ${ex.slots.length}${ex.warns.length ? '  WARN: ' + ex.warns.join(' | ') : ''}`);
        console.log(summary[summary.length - 1]);
      }
    } finally {
      cdp.sock.close(); try { require('child_process').execSync('taskkill /pid ' + cdp.proc.pid + ' /T /F', { stdio: 'ignore' }); } catch (e) { cdp.proc.kill(); }
      await sleep(1500);
      try { fs.rmSync(cdp.ud, { recursive: true, force: true, maxRetries: 8, retryDelay: 400 }); } catch (e) { /* perfil temporário do Edge */ }
    }
  }
  // índice
  const fam = {};
  REG.forEach((e) => {
    fam[e.family] = fam[e.family] || { id: e.family, docs: {} };
    const d = fam[e.family].docs[e.doc] = fam[e.family].docs[e.doc] || { id: e.doc, label: e.label, sides: [], k: kOf(e.doc) };
    d.sides.push(e.side);
    const w = e.w || 460, h = e.h || 650;
    d.wCss = w; d.hCss = h;
  });
  const FAMLABEL = { kelvara: 'Kelvara Petrochemicals', neurostat: 'NeuroStat', dre: 'DRE', odemark: 'Ødemark A.' };
  const index = Object.values(fam).map((f) => ({ id: f.id, label: FAMLABEL[f.id] || f.id, docs: Object.values(f.docs).map((d) => Object.assign(d, { pageW: Math.round(d.wCss * d.k), pageH: Math.round(d.hCss * d.k) })) }));
  fs.writeFileSync(path.join(OUT, 'brand-index.js'), 'window.BRAND_INDEX=' + JSON.stringify(index, null, 1) + ';\n');
  console.log('\nindice ok');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
