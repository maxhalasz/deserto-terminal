// Helpers compartilhados pelo gerador dos documentos de marca (mockup .dc.html)
const B = {
  kelvara: 'd10d647d11b8d23e2b0c24c1933ddc8d',
  odBadge: '52547a92fbbd3a5c8fe22204b4810337',
  odPatch: 'a92fe7b83e5468ccf31aa5d752c3dee2',
  nsMark: '6b7b995ea67197ee717e941f9c2b7cc0',
  nsStamp: '30a8bae6ec926c956c2a4c47c299136d',
  dre: '876a9380daca85198c38bf52778c841e',
};
const img = id => `/_blob/${id}`;

function rng(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function docFile({ title, fonts, w = 460, h = 650, defs = '', body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?${fonts}&display=swap" rel="stylesheet">
<style>
  body { margin: 0; }
</style>
</helmet>
${defs}
${body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
}

// Código de barras (barras inteiras, sem antialias)
function barcode(seed, w, h, color = '#141414') {
  const r = rng(seed); let x = 2; const bars = [];
  while (x < w - 2) {
    const bw = 1 + Math.floor(r() * 3);
    if (r() < 0.78) bars.push(`<rect x="${x}" y="0" width="${bw}" height="${h}"/>`);
    x += bw + (r() < 0.7 ? 1 : 2);
  }
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" fill="${color}" xmlns="http://www.w3.org/2000/svg">${bars.join('')}</svg>`;
}

// QR-like (finder patterns + dados aleatórios)
function qr(seed, size = 30, color = '#141414', n = 25) {
  const r = rng(seed); const rects = [];
  const inFinder = (x, y) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
  const finder = (ox, oy) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const edge = x === 0 || y === 0 || x === 6 || y === 6;
      const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      if (edge || core) rects.push(`<rect x="${ox + x}" y="${oy + y}" width="1" height="1"/>`);
    }
  };
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (inFinder(x, y)) continue;
    if (r() < 0.48) rects.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" fill="${color}" xmlns="http://www.w3.org/2000/svg">${rects.join('')}</svg>`;
}

// Manchas pequenas de foxing (px, não %)
function foxing(seed, n, W = 460, H = 650) {
  const r = rng(seed); const s = [];
  for (let i = 0; i < n; i++) {
    const x = (r() * 100).toFixed(1), y = (r() * 100).toFixed(1);
    const rad = (2 + r() * 6).toFixed(1);
    const op = (0.10 + r() * 0.22).toFixed(2);
    const tone = r() < 0.5 ? '128,84,32' : '96,62,24';
    s.push(`radial-gradient(circle ${(+rad * 2.2).toFixed(1)}px at ${x}% ${y}%, rgba(${tone},${op}) 0, rgba(${tone},${(op * 0.45).toFixed(2)}) ${rad}px, transparent ${(+rad * 2.2).toFixed(1)}px)`);
  }
  // duas manchas maiores e muito sutis
  for (let i = 0; i < 2; i++) {
    const x = (r() * 100).toFixed(0), y = (r() * 100).toFixed(0);
    s.push(`radial-gradient(ellipse 60px 40px at ${x}% ${y}%, rgba(140,100,45,0.10), transparent)`);
  }
  return s.join(',\n      ');
}

function coffee(x, y, rx = 22, ry = 20) {
  return `radial-gradient(ellipse ${rx + 6}px ${ry + 6}px at ${x}% ${y}%, rgba(150,98,38,0.05) 0, rgba(150,98,38,0.05) ${Math.min(rx, ry) - 1}px, rgba(112,68,24,0.34) ${Math.min(rx, ry)}px, rgba(112,68,24,0.30) ${Math.min(rx, ry) + 2}px, rgba(112,68,24,0.08) ${Math.min(rx, ry) + 5}px, transparent ${Math.min(rx, ry) + 7}px)`;
}

function foldLines(points) {
  return points.map(p => `linear-gradient(to bottom, transparent calc(${p}% - 3px), rgba(255,255,255,0.32) calc(${p}% - 1px), rgba(84,62,30,0.22) ${p}%, rgba(255,255,255,0.14) calc(${p}% + 2px), transparent calc(${p}% + 4px))`);
}

function agedBackground(seed, { fox = 10, layersTop = [], folds = [] } = {}) {
  const L = [...layersTop, ...foldLines(folds), foxing(seed, fox),
    'linear-gradient(to right, rgba(150,108,48,0.34), transparent 8%)',
    'linear-gradient(to left, rgba(150,108,48,0.28), transparent 8%)',
    'linear-gradient(to bottom, rgba(150,108,48,0.26), transparent 6%)',
    'linear-gradient(to top, rgba(150,108,48,0.32), transparent 8%)',
    'linear-gradient(160deg, #efeada, #e4dbc0)'];
  return L.join(',\n      ');
}

function grainDef(id, seed) {
  return `<svg width="0" height="0" style="position: absolute;"><filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" seed="${seed}" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.20  0 0 0 0 0.15  0 0 0 0 0.08  0 0 0 0.32 0"/></filter></svg>`;
}
function speckDef(id, seed, thr = 10.4) {
  return `<svg width="0" height="0" style="position: absolute;"><filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${seed}" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.10  0 0 0 0 0.09  0 0 0 0 0.06  14 0 0 0 -${thr}"/></filter></svg>`;
}

// registro global dos documentos de marca (frente/verso) — usado pelo pipeline de build
const REG_PATH = require('path').join(__dirname, 'brand_registry.json');
function register(entry) {
  const fsx = require('fs');
  let reg = [];
  try { reg = JSON.parse(fsx.readFileSync(REG_PATH, 'utf8')); } catch (e) {}
  reg = reg.filter(r => r.file !== entry.file);
  reg.push(entry);
  fsx.writeFileSync(REG_PATH, JSON.stringify(reg, null, 2));
}
const E = ' data-e';
const O = k => ` data-obj="${k}"`;

module.exports = { register, E, O, B, img, rng, docFile, barcode, qr, foxing, coffee, foldLines, agedBackground, grainDef, speckDef };
