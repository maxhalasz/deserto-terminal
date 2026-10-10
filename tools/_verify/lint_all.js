/* Lint de todos os scripts de uma página como se fossem UM programa só (eles dividem globais; ordem de carga = ordem do HTML).
   Acha variável não definida, função/variável declarada duas vezes e variável local sem uso.
   Uso:  LINT_DIR=<pasta onde rodou "npm i eslint@9 globals"> node tools/_verify/lint_all.js [pagina.html]
   (a pasta do ESLint fica FORA do repo, ex. no scratchpad; não precisa de package.json no projeto).
   Falsos positivos conhecidos no props-generator: `firebase`/`db` (carregados na hora de salvar), `history` (sombra de
   window.history, de propósito) e os campos descartados na desestruturação de BrandArt.fromObject. */
const fs = require('fs'), path = require('path'), { createRequire } = require('module');
const lintDir = process.env.LINT_DIR;
if (!lintDir) { console.error('Defina LINT_DIR (pasta com node_modules/eslint e node_modules/globals).'); process.exit(2); }
const req = createRequire(path.join(path.resolve(lintDir), 'x.js'));
const { ESLint } = req('eslint'), globals = req('globals');
const root = path.join(__dirname, '..') + path.sep;
const page = process.argv[2] || 'props-generator.html';
const html = fs.readFileSync(root + page, 'utf8');
const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1].split('?')[0]).filter(s => !s.startsWith('vendor/'));
let combined = '', map = [];
for (const s of srcs) {
  const p = root + s;
  if (!fs.existsSync(p)) { console.log('faltando', s); continue; }
  const code = fs.readFileSync(p, 'utf8');
  map.push({ file: s, start: combined.split('\n').length });
  combined += code + '\n';
}
const out = path.join(path.resolve(lintDir), 'combined.js');
fs.writeFileSync(out, combined);
const where = (line) => { let m = map[0]; for (const e of map) if (line >= e.start) m = e; return m.file + ':' + (line - m.start + 1); };
(async () => {
  const eslint = new ESLint({
    cwd: path.resolve(lintDir),   // o arquivo combinado fica na pasta do ESLint (fora do repo)
    overrideConfigFile: true,
    overrideConfig: [{
      files: ['**/*.js'],
      languageOptions: { ecmaVersion: 2022, sourceType: 'script',
        globals: Object.assign({}, globals.browser, { fabric: 'readonly', TEXTURE_PACK: 'writable', BRAND_INDEX: 'writable', BRAND_PACK: 'writable', jspdf: 'readonly' }) },
      rules: { 'no-undef': 'error', 'no-redeclare': 'error', 'no-dupe-keys': 'error', 'no-unreachable': 'warn', 'no-self-assign': 'warn',
        'no-unused-vars': ['warn', { vars: 'all', args: 'none', caughtErrors: 'none' }], 'no-const-assign': 'error', 'no-func-assign': 'error',
        'no-dupe-class-members': 'error', 'no-fallthrough': 'warn', 'no-unsafe-finally': 'error', 'use-isnan': 'error', 'valid-typeof': 'error',
        'no-dupe-else-if': 'error', 'no-duplicate-case': 'error', 'no-ex-assign': 'error' },
    }],
  });
  const res = await eslint.lintFiles([out]);
  const byRule = {};
  res[0].messages.forEach(m => { (byRule[m.ruleId] = byRule[m.ruleId] || []).push(m); });
  for (const [rule, list] of Object.entries(byRule)) { console.log('\n### ' + rule + ' (' + list.length + ')'); list.forEach(m => console.log(where(m.line) + '  ' + m.message)); }
  if (!res[0].messages.length) console.log('sem avisos');
})();
