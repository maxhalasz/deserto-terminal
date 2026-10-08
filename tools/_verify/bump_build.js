/* Troca o "?v=" de todos os scripts/CSS locais do props-generator.html e o rótulo de versão na tela.
   Por quê: o GitHub Pages deixa arquivos em cache até 10 min; sem isso o navegador mistura HTML novo com
   JS velho (bloco "Papel" aparece mas não faz nada). Rodar a CADA deploy: node tools/_verify/bump_build.js <rotulo>
   ex.: node tools/_verify/bump_build.js f1-04 */
const fs = require('fs'), path = require('path');
const tag = process.argv[2];
if (!tag) { console.error('uso: bump_build.js <rotulo>'); process.exit(1); }
const f = path.join(__dirname, '..', 'props-generator.html');
let s = fs.readFileSync(f, 'utf8');
// scripts e css locais (não vendor/ pesados): ganham ?v=
s = s.replace(/(<script src="(?!vendor\/)[^"?]+?\.js)(\?v=[^"]*)?"/g, `$1?v=${tag}"`);
s = s.replace(/(<link rel="stylesheet" href="vendor\/fonts-docs\.css)(\?v=[^"]*)?"/, `$1?v=${tag}"`);
s = s.replace(/(<span id="buildTag">)[^<]*(<\/span>)/, `$1${tag}$2`);
fs.writeFileSync(f, s);
console.log('build', tag, '->', (s.match(/\?v=/g) || []).length, 'referências');
