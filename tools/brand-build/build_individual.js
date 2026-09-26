const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'out');
const OUT_DIR = path.join(__dirname, 'solo');
const ASSETS = path.join(__dirname, 'assets');

fs.mkdirSync(OUT_DIR, { recursive: true });

const MIME = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
function dataUri(relPath) {
  const full = path.join(ASSETS, path.basename(relPath));
  const ext = path.extname(full).toLowerCase();
  const b64 = fs.readFileSync(full).toString('base64');
  return `data:${MIME[ext]};base64,${b64}`;
}
const BLOB_MAP = {
  'd10d647d11b8d23e2b0c24c1933ddc8d': dataUri('1.png'),
  '52547a92fbbd3a5c8fe22204b4810337': dataUri('6.png'),
  'a92fe7b83e5468ccf31aa5d752c3dee2': dataUri('7.webp'),
  '6b7b995ea67197ee717e941f9c2b7cc0': dataUri('9.webp'),
  '30a8bae6ec926c956c2a4c47c299136d': dataUri('10.webp'),
  '876a9380daca85198c38bf52778c841e': dataUri('11.png'),
};
function patchBlobs(str) {
  Object.entries(BLOB_MAP).forEach(([id, uri]) => { str = str.split('/_blob/' + id).join(uri); });
  return str;
}
function extractBoard(html) {
  const helmetMatch = html.match(/<helmet>([\s\S]*?)<\/helmet>/);
  const helmet = helmetMatch ? helmetMatch[1] : '';
  const afterHelmetEnd = html.indexOf('</helmet>') + '</helmet>'.length;
  const rootDivStart = html.indexOf('<div', afterHelmetEnd);
  let depth = 0, end = -1;
  const re = /<div|<\/div>/g;
  re.lastIndex = rootDivStart;
  let match;
  while ((match = re.exec(html))) {
    if (match[0] === '<div') depth++; else depth--;
    if (depth === 0) { end = match.index + match[0].length; break; }
  }
  const svg = html.slice(afterHelmetEnd, rootDivStart);
  const rootDiv = html.slice(rootDivStart, end);
  // pega w/h do data-props $preview
  const previewMatch = html.match(/"\$preview":\{"width":(\d+),"height":(\d+)\}/);
  const w = previewMatch ? +previewMatch[1] : 460;
  const h = previewMatch ? +previewMatch[2] : 650;
  return { helmet, svg, rootDiv, w, h };
}

const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.dc.html'));
const manifest = [];
files.forEach(f => {
  const html = fs.readFileSync(path.join(SRC_DIR, f), 'utf8');
  const { helmet, svg, rootDiv, w, h } = extractBoard(html);
  const page = `<!doctype html><html><head><meta charset="utf-8">${helmet}<style>body{margin:0;background:#fff;overflow:hidden;}</style></head><body>${patchBlobs(svg)}${patchBlobs(rootDiv)}</body></html>`;
  const outName = f.replace('.dc.html', '.html');
  fs.writeFileSync(path.join(OUT_DIR, outName), page, 'utf8');
  manifest.push({ file: outName, w: w, h: h });
});
fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest));
