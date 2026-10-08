/* Baixa fontes do Google Fonts (licença OFL) pra tools/vendor/fonts/ e gera tools/vendor/fonts-docs.css.
   Uso: node tools/font-build/add_fonts.js
   - O Google entrega o CSS já dividido por faixa de caractere (unicode-range), igual ao fonts.css atual.
     Precisa de User-Agent de Chrome (senão vem .ttf). Ficamos só com os blocos `latin` e `latin-ext`.
   - Os .woff2 são deduplicados por URL (fonte variável reaproveita o mesmo arquivo entre pesos).
   - As 85 regras do fonts.css antigo NÃO são tocadas: este arquivo é ligado DEPOIS dele no HTML.
   A ferramenta funciona sem internet (preparada antes da sessão), então tudo fica local. */
const fs = require('fs'), path = require('path');
const OUT_DIR = path.join(__dirname, '..', 'vendor', 'fonts');
const OUT_CSS = path.join(__dirname, '..', 'vendor', 'fonts-docs.css');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/* [família, especificação do css2] */
const FAMILIES = [
  ['Cormorant Garamond', 'ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600'],
  ['Bodoni Moda', 'ital,wght@0,400;0,500;0,700;0,900;1,400'],
  ['Jost', 'wght@400;500;600;700'],
  ['Yellowtail', null],
  ['Alfa Slab One', null],
  ['Anton', null],
  ['Fredoka', 'wght@400;500;600;700'],
  ['Old Standard TT', 'ital,wght@0,400;0,700;1,400'],
  ['Libre Baskerville', 'ital,wght@0,400;0,700;1,400'],
  ['EB Garamond', 'ital,wght@0,400;0,500;0,700;1,400;1,500'],
  ['Libre Franklin', 'ital,wght@0,400;0,600;0,700;0,900;1,400'],
  ['Barlow Condensed', 'ital,wght@0,400;0,500;0,600;0,700;1,400'],
  ['Inter', 'wght@400;500;600;700'],
  ['IBM Plex Mono', 'ital,wght@0,400;0,500;0,700;1,400'],
  ['IBM Plex Sans', 'ital,wght@0,400;0,500;0,600;0,700;1,400'],
  ['VT323', null],
  /* itálicos e pesos que faltavam no fonts.css antigo */
  ['Source Sans 3', 'ital,wght@1,400;1,600;1,700'],
  ['Oswald', 'wght@400'],
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const urlToFile = new Map();
  let css = '/* Gerado por tools/font-build/add_fonts.js — fontes Google (OFL), auto-hospedadas. Não editar à mão. */\n';
  for (const [fam, spec] of FAMILIES) {
    const url = 'https://fonts.googleapis.com/css2?family=' + fam.replace(/ /g, '+') + (spec ? ':' + spec : '') + '&display=swap';
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) { console.log('FALHOU', fam, res.status); continue; }
    const text = await res.text();
    const blocks = [...text.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)];
    let n = 0;
    for (const [, subset, face] of blocks) {
      if (subset !== 'latin' && subset !== 'latin-ext') continue;
      const m = face.match(/src:\s*url\(([^)]+)\)/);
      if (!m) continue;
      const src = m[1];
      let file = urlToFile.get(src);
      if (!file) {
        file = fam.replace(/ /g, '_') + '_d' + (n++) + '.woff2';
        const bin = Buffer.from(await (await fetch(src, { headers: { 'User-Agent': UA } })).arrayBuffer());
        fs.writeFileSync(path.join(OUT_DIR, file), bin);
        urlToFile.set(src, file);
      }
      css += face.replace(/src:\s*url\([^)]+\)\s*format\('woff2'\)/, `src: url('fonts/${file}') format('woff2')`) + '\n';
    }
    console.log('ok', fam, blocks.filter(b => b[1] === 'latin' || b[1] === 'latin-ext').length + ' blocos');
  }
  fs.writeFileSync(OUT_CSS, css);
  const total = [...urlToFile.values()].reduce((a, f) => a + fs.statSync(path.join(OUT_DIR, f)).size, 0);
  console.log('arquivos:', urlToFile.size, 'tamanho:', Math.round(total / 1024) + ' KB', '->', OUT_CSS);
}
main().catch(e => { console.error(e); process.exit(1); });
