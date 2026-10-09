/* ===================== Papéis (Etapa 4) =====================
   Relatório, dossiê redigido, etiqueta de evidência, carta, bilhete e diário como documentos DIGITAIS:
   layout e tipografia limpos por cima de papel procedural (doc-templates.js / paper-gen.js).
   Âncoras: Twin Peaks (relatório = formulário da delegacia/FBI; etiqueta = saco de evidência; carta e bilhete =
   papelaria do hotel) e Silent Hill 3 (dossiê = ficha de hospital liberada com tarjas). Fichas em DOCS_DESIGN_NOTES.md.
   Regras: nenhum texto manuscrito pronto (o Max imprime e escreve à mão); cada modelo nasce com 1–2 detalhes sutis
   em camadas próprias e apagáveis (carimbo, mancha) e 1 detalhe em DADO que não fecha. Textos em inglês. */

const DP = {};   // ajudantes comuns
DP.red = '#a8302a'; DP.brown = '#6b5a3e'; DP.ink = '#1b1a18'; DP.grey = '#55514a';

/* Tabela de campos: rows = [{h, cells:[{f:fração da largura, label, value, vfont, vsize, vweight}]}].
   Moldura e divisórias são traços finos; rótulo miúdo no canto, valor embaixo. Devolve o y do fim. */
DP.grid = (kit, x, y, w, rows, o)=>{
  o = o || {};
  const ink = o.ink || DP.ink, sw = o.sw || 1.3, total = rows.reduce((a, r)=>a + r.h, 0);
  kit.rect({left:x, top:y, width:w, height:total, stroke:ink, sw:sw*1.5, label:'Tabela (moldura)'});
  let cy = y;
  rows.forEach((r, ri)=>{
    if (ri) kit.line(x, cy, x + w, cy, {stroke:ink, sw, label:'Tabela (linha)'});
    let cx = x;
    r.cells.forEach((c, ci)=>{
      const cw = w*c.f;
      if (ci) kit.line(cx, cy, cx, cy + r.h, {stroke:ink, sw, label:'Tabela (coluna)'});
      if (c.label) kit.text(c.label, {left:cx + 12, top:cy + 9, width:cw - 24, font:o.lfont || 'Inter', weight:600, size:o.lsize || 12.5, cs:130, fill:o.lfill || DP.grey, lh:1.0});
      if (c.value != null && c.value !== '') kit.text(c.value, {left:cx + 12, top:cy + (c.vtop != null ? c.vtop : 36), width:cw - 24, font:c.vfont || o.vfont || 'Courier Prime', weight:c.vweight || o.vweight || 700, size:c.vsize || o.vsize || 25, fill:c.vfill || ink, lh:1.15});
      cx += cw;
    });
    cy += r.h;
  });
  return cy;
};

/* Texto com tarjas: `[[assim]]` vira tarja preta. Quebra as linhas por medida (mesma função que mede), cria UM texto
   com quebras explícitas e desenha cada tarja por cima da palavra, no x e y exatos (fonte mono: exato; senão, aproximado).
   Tarjas de várias linhas seguidas emendam num bloco. O texto continua na camada, por baixo da tarja (apagar a tarja revela). */
DP.redact = (kit, str, o)=>{
  const f = {font:o.font || 'Courier Prime', size:o.size || 22, weight:o.weight || 400, cs:o.cs || 0};
  const lh = o.lh || 1.5, fs = f.size, maxW = o.width;
  const lines = [];   // {s: texto simples, flags: [bool por caractere]}
  str.split('\n').forEach(par=>{
    if (!par.trim()){ lines.push({s:'', flags:[]}); return; }
    let red = false;
    const words = par.trim().split(/\s+/).map(w=>{
      let plain = '', fl = [];
      for (let i = 0; i < w.length;){
        if (w.startsWith('[[', i)){ red = true; i += 2; continue; }
        if (w.startsWith(']]', i)){ red = false; i += 2; continue; }
        plain += w[i]; fl.push(red); i++;
      }
      return {plain, fl};
    });
    let cur = null;
    const push = ()=>{ if (cur) lines.push(cur); cur = null; };
    words.forEach(wd=>{
      if (!cur){ cur = {s:wd.plain, flags:wd.fl.slice()}; return; }
      const t = cur.s + ' ' + wd.plain;
      if (kit.measure(t, f) > maxW){ push(); cur = {s:wd.plain, flags:wd.fl.slice()}; }
      else {
        const sp = cur.flags[cur.flags.length - 1] && wd.fl[0];   // espaço entre duas palavras tarjadas também fica preto
        cur.s = t; cur.flags.push(sp); wd.fl.forEach(b=>cur.flags.push(b));
      }
    });
    push();
  });
  const t = kit.text(lines.map(l=>l.s).join('\n'), {left:o.left, top:o.top, width:maxW + 8, font:f.font, size:fs, weight:f.weight, cs:f.cs, fill:o.fill, lh, label:o.label});
  const bars = [];
  let cellTop = t.top;
  lines.forEach((l, i)=>{
    const cellH = t.getHeightOfLine(i);
    let a = 0;
    while (a < l.flags.length){
      if (!l.flags[a]){ a++; continue; }
      let b = a; while (b < l.flags.length && l.flags[b]) b++;
      const x0 = t.left + kit.measure(l.s.slice(0, a), f), w = kit.measure(l.s.slice(a, b), f);
      const next = lines[i + 1], contNext = b === l.flags.length && next && next.flags[0];
      const top = cellTop + fs*0.10, h = contNext ? cellH - fs*0.12 : fs*1.02;
      bars.push(kit.rect({left:x0 - 1.5, top, width:w + 3, height:h, fill:'#0b0b0b', blend:'source-over', label:'Tarja'}));
      a = b;
    }
    cellTop += cellH;
  });
  return {text:t, bars, bottom:t.top + t.height};
};

/* Cabeçalho do formulário NS-302 (nome, versão, título). Devolve o y onde a primeira tabela começa. */
DP.reportHead = (kit, title)=>{
  const W = kit.W, L = 150, ink = DP.ink;
  kit.text('NEUROSTAT', {left:L, top:92, width:500, font:'Libre Franklin', weight:700, size:30, cs:90, lh:1.0});
  kit.text('FIELD DIVISION   ·   PLATFORM DESERTO', {left:L, top:134, width:700, font:'Inter', weight:600, size:12.5, cs:240, fill:DP.grey, lh:1.0});
  kit.text('NS-302 (Rev. 03-11)', {left:W - L - 300, top:100, width:300, font:'Inter', weight:500, size:13.5, cs:60, fill:DP.grey, align:'right', lh:1.0});
  kit.line(L, 176, W - L, 176, {stroke:ink, sw:2.6, label:'Filete do cabeçalho'});
  kit.text(title, {left:L, top:204, width:760, font:'Libre Franklin', weight:700, size:36, cs:40, lh:1.0});
  return 282;
};
/* Rodapé: assinaturas (opcionais) e linhas de arquivo. */
DP.reportFoot = (kit, o)=>{
  o = o || {};
  const W = kit.W, L = 150, CW = W - 300, ink = DP.ink, fy = 1510;
  if (o.sign !== false){
    kit.text(o.signA || 'Reporting officer', {left:L, top:fy, width:300, font:'Inter', weight:600, size:12.5, cs:130, fill:DP.grey, lh:1.0});
    kit.line(L, fy + 62, L + 400, fy + 62, {stroke:ink, sw:1.2, label:'Linha de assinatura'});
    kit.text(o.signB || 'Supervisor review', {left:L + 500, top:fy, width:300, font:'Inter', weight:600, size:12.5, cs:130, fill:DP.grey, lh:1.0});
    kit.line(L + 500, fy + 62, W - L, fy + 62, {stroke:ink, sw:1.2, label:'Linha de assinatura'});
  }
  kit.line(L, fy + 100, W - L, fy + 100, {stroke:ink, sw:1.2, label:'Filete do rodapé'});
  kit.text('Investigation on 03/14 at Platform Deserto        File # DES-0447        by M. Holt', {left:L, top:fy + 114, width:CW, font:'Courier Prime', weight:400, size:16, lh:1.2});
  kit.text(o.line2 || 'Date dictated 03/15        Original: Supervision.  Copy 1: Field Division.', {left:L, top:fy + 142, width:CW, font:'Courier Prime', weight:400, size:16, lh:1.2});
};
DP.reportStamp = (kit)=>kit.stamp('COPY 2 OF 2', {x:kit.W - 270, y:236, angle:-6, size:24, opacity:0.62, label:'Detalhe — carimbo COPY 2 OF 2'});
/* Parágrafos numerados em Courier com número na margem. Devolve o y do fim. */
DP.numbered = (kit, y, paras, from, o)=>{
  o = o || {};
  const L = 150, CW = kit.W - 300, size = o.size || 23;
  const col = kit.column(L + 70, y, CW - 70, {font:'Courier Prime', weight:400, size, lh:1.52});
  paras.forEach((p, i)=>{
    const t = col.text(p, {gap:o.gap != null ? o.gap : 28});
    kit.text((from + i) + '.', {left:L, top:t.top, width:60, font:'Courier Prime', weight:700, size, lh:1.52});
  });
  return col.y;
};
DP.REPORT_FONTS = ["400 20px 'Courier Prime'", "700 20px 'Courier Prime'", "600 20px 'Inter'", "500 20px 'Inter'", "700 20px 'Libre Franklin'"];

/* ============ Relatório · formulário de incidente (estilo FD-302, Twin Peaks) ============ */
registerDoc('report', {
  label:'Relatório — formulário de incidente (NS-302)', page:A4.page, phys:A4.phys,
  paper:{type:'sulfite', level:0.12, atmos:'twin', fold:'nenhuma'},
  fonts:DP.REPORT_FONTS,
  build: async (kit)=>{
    const L = 150, CW = kit.W - 300, ink = DP.ink;
    DP.reportHead(kit, 'REPORT OF INCIDENT');
    const y1 = DP.grid(kit, L, 282, CW, [
      {h:94, cells:[{f:0.28, label:'DATE OF OCCURRENCE', value:'03/14'}, {f:0.20, label:'TIME', value:'03:12'}, {f:0.32, label:'FILE NO.', value:'DES-0447'}, {f:0.20, label:'PAGE', value:'1 of 2'}]},
      {h:94, cells:[{f:0.70, label:'LOCATION', value:'Platform Deserto, moonpool level'}, {f:0.30, label:'CLASSIFICATION', value:'INTERNAL'}]},
      {h:94, cells:[{f:0.45, label:'REPORTED BY', value:'M. Holt, Supervision'}, {f:0.25, label:'PERSONNEL PRESENT', value:'6'}, {f:0.30, label:'WATCH', value:'Night'}]},
    ]);
    kit.text('NARRATIVE', {left:L, top:y1 + 46, width:400, font:'Inter', weight:700, size:14, cs:320, lh:1.0});
    kit.line(L, y1 + 76, kit.W - L, y1 + 76, {stroke:ink, sw:1.2, label:'Filete'});
    DP.numbered(kit, y1 + 106, [
      'At 03:12 on 03/14 radio contact with the dive team was lost. The last transmission recorded at the surface station consisted of broadband noise. No verbal content was identified.',
      'The dive team (Reyes, Okafor, Lindqvist) descended through the moonpool at 02:40 under standing orders. Surface personnel (Holt, Brandt, Tan, Vance) held position at the winch.',
      'Contact was attempted on all channels at 03:15, 03:30 and 04:00. No response. The line was reeled in at 04:20. The line was intact.',
      'Surface crew are not authorized to descend without direct order from Supervision. No such order has been given.',
      'The transmission was retained on tape no. 12. The recording runs 11 seconds. Playback at the surface station was stopped at the direction of the Supervisor.',
    ], 1);
    DP.reportFoot(kit);
    DP.reportStamp(kit);
  },
});

/* Cabeçalho do dossiê: faixa preta, NeuroStat, código, selo com a página. Devolve 232 (y do filete). */
DP.dosHead = (kit, pageNo, status)=>{
  const W = kit.W, L = 140, ink = DP.ink;
  kit.rect({left:0, top:0, width:W, height:66, fill:'#0d0d0d', label:'Faixa de classificação'});
  kit.text('RESTRICTED  —  DO NOT DISTRIBUTE', {left:0, top:20, width:W, font:'Courier Prime', weight:700, size:20, cs:280, fill:'#e8e4d8', align:'center', lh:1.0});
  kit.text('NEUROSTAT', {left:L, top:108, width:500, font:'Libre Franklin', weight:700, size:30, cs:90, lh:1.0});
  kit.text('CASE NO. 0447-D', {left:L, top:152, width:500, font:'Courier Prime', weight:700, size:22, lh:1.0});
  kit.text('DOC. 0447-D-0031   ·   REL-2204-17', {left:L, top:184, width:600, font:'Courier Prime', weight:400, size:16, fill:DP.grey, lh:1.0});
  const sx = W - L - 330, sy = 100;
  kit.rect({left:sx, top:sy, width:330, height:96, stroke:ink, sw:3.4, label:'Selo (borda)'});
  kit.rect({left:sx + 7, top:sy + 7, width:316, height:82, stroke:ink, sw:1.2, label:'Selo (fio)'});
  kit.text(status || 'RELEASED IN PART', {left:sx, top:sy + 22, width:330, font:'Courier Prime', weight:700, size:status && status.length > 17 ? 21 : 26, cs:60, align:'center', lh:1.0});
  kit.text('PAGE ' + pageNo + ' OF 9', {left:sx, top:sy + 58, width:330, font:'Courier Prime', weight:700, size:16, cs:180, align:'center', lh:1.0});
  kit.line(L, 232, W - L, 232, {stroke:ink, sw:2.4, label:'Filete do cabeçalho'});
  return 232;
};
DP.dosFoot = (kit, pageNo, exempt, prepared)=>{
  const W = kit.W, L = 140, CW = W - 280, ink = DP.ink;
  if (prepared !== false) kit.text('Prepared by:  M. Holt', {left:L, top:1566, width:600, font:'Courier Prime', weight:400, size:19, lh:1.0});
  kit.line(L, 1618, W - L, 1618, {stroke:ink, sw:1.2, label:'Filete do rodapé'});
  kit.text(exempt || '(b)(1)   (b)(6)', {left:L, top:1634, width:300, font:'Courier Prime', weight:400, size:15, fill:DP.grey, lh:1.0});
  kit.text('NEUROSTAT — FIELD DIVISION', {left:L + 300, top:1634, width:CW - 600, font:'Courier Prime', weight:400, size:15, cs:120, fill:DP.grey, align:'center', lh:1.0});
  kit.text(String(pageNo), {left:W - L - 100, top:1634, width:100, font:'Courier Prime', weight:700, size:17, align:'right', lh:1.0});
};
DP.DOS_FONTS = ["400 20px 'Courier Prime'", "700 20px 'Courier Prime'", "600 20px 'Inter'", "700 20px 'Libre Franklin'"];

/* ============ Dossiê · documento liberado com tarjas (hospital, Silent Hill 3) ============ */
registerDoc('redacted', {
  label:'Dossiê — documento liberado com tarjas', page:A4.page, phys:A4.phys,
  paper:{type:'fotocopia', level:0.30, atmos:'silent', fold:'nenhuma'},
  fonts:DP.DOS_FONTS,
  build: async (kit)=>{
    const W = kit.W, L = 140, CW = W - 280, ink = DP.ink;
    DP.dosHead(kit, 3);
    // ficha (linhas finas de formulário de hospital); valores com tarja
    const gy = 262, rh = 84, cw3 = CW/3;
    kit.rect({left:L, top:gy, width:CW, height:rh*2, stroke:ink, sw:1.8, label:'Ficha (moldura)'});
    kit.line(L, gy + rh, L + CW, gy + rh, {stroke:ink, sw:1.2, label:'Ficha (linha)'});
    [1, 2].forEach(i=>kit.line(L + cw3*i, gy, L + cw3*i, gy + rh*2, {stroke:ink, sw:1.2, label:'Ficha (coluna)'}));
    const cells = [['SUBJECT', '[[M. Holt]]'], ['LOCATION', 'Lower deck'], ['LEVEL', 'B-3'], ['CONDITION', '[[Unknown]]'], ['EXAMINED BY', '[[Dr. Reyes]]'], ['OUTCOME', '[[Pending]]']];
    cells.forEach(([lab, val], i)=>{
      const cx = L + cw3*(i%3), cy = gy + rh*Math.floor(i/3);
      kit.text(lab, {left:cx + 12, top:cy + 9, width:cw3 - 24, font:'Inter', weight:600, size:12.5, cs:130, fill:DP.grey, lh:1.0});
      DP.redact(kit, val, {left:cx + 12, top:cy + 36, width:cw3 - 24, font:'Courier Prime', size:25, weight:700, lh:1.15, fill:ink, label:'Campo'});
    });
    const paras = [
      'Subject was located near [[the coral formation]]. State of consciousness [[unknown]]. Immediate [[containment]] and notification of [[leadership]] recommended.',
      '',
      'The identified sound pattern does not match any catalog known to the division. Preliminary analysis suggests [[uncatalogued biological origin]]. Further [[sampling]] was not authorized.',
      '',
      '[[A second recording was made at the moonpool at 04:40. It was played back once in the presence of three members of Supervision. Two of them have since requested transfer. The third has not been located.]]',
      '',
      'Remaining personnel were interviewed on 03/15 by [[M. Holt]]. Statements are held in the file and are not reproduced here.',
      '',
      'Distribution of this report is limited to [[Supervision]] and the [[Field Division]]. Copies are numbered. Copy 2 was not returned.',
    ];
    const r = DP.redact(kit, paras.join('\n'), {left:L, top:gy + rh*2 + 56, width:CW, font:'Courier Prime', size:23, weight:400, lh:1.5, fill:ink, label:'Texto do dossiê'});
    // páginas retidas
    const wy = Math.max(r.bottom + 40, 1280);
    kit.rect({left:L, top:wy, width:CW, height:150, fill:'#cfcbc2', opacity:0.55, blend:'multiply', label:'Bloco de páginas retidas'});
    kit.rect({left:L, top:wy, width:CW, height:150, stroke:ink, sw:2.4, label:'Bloco de páginas retidas (borda)'});
    kit.text('PAGES 4 – 9', {left:L, top:wy + 30, width:CW, font:'Courier Prime', weight:700, size:30, cs:160, align:'center', lh:1.0});
    kit.text('WITHHELD IN FULL', {left:L, top:wy + 72, width:CW, font:'Courier Prime', weight:700, size:22, cs:200, align:'center', lh:1.0});
    kit.text('Exemption (b)(1)', {left:L, top:wy + 108, width:CW, font:'Courier Prime', weight:400, size:17, align:'center', lh:1.0});
    DP.dosFoot(kit, 3);
    await kit.stain('blood', {x:1010, y:1500, size:170, opacity:0.32, angle:20, seed:7, label:'Detalhe — mancha de ferrugem'});
  },
});

/* Frente do saco de evidência. d = {item, desc, dt, loc, by, rows:[[de,para,data,hora]...], code, human, stain:{type,o}}. */
DP.tagFront = async (kit, d)=>{
  const W = kit.W, L = 56, CW = W - 112, ink = '#1a1410', lab = '#43301f';
  kit.line(0, 96, W, 96, {stroke:ink, sw:2, dash:[14, 10], opacity:0.7, label:'Linha de corte'}).__bleedOk = true;
  kit.text('TEAR ALONG LINE TO OPEN', {left:0, top:38, width:W, font:'Inter', weight:600, size:13, cs:300, fill:lab, align:'center', lh:1.0});
  kit.text('EVIDENCE', {left:0, top:128, width:W, font:'Libre Franklin', weight:900, size:150, cs:30, fill:'#5a1810', align:'center', lh:1.0});
  kit.text('PLATFORM DESERTO   ·   FIELD DIVISION', {left:0, top:296, width:W, font:'Inter', weight:600, size:14, cs:280, fill:lab, align:'center', lh:1.0});
  kit.line(L, 336, W - L, 336, {stroke:ink, sw:2.6, label:'Filete'});
  const gy = DP.grid(kit, L, 360, CW, [
    {h:84, cells:[{f:0.5, label:'CASE NO.', value:'0447'}, {f:0.5, label:'ITEM NO.', value:d.item}]},
    {h:150, cells:[{f:1, label:'DESCRIPTION'}]},
    {h:84, cells:[{f:0.5, label:'DATE / TIME COLLECTED', value:d.dt, vsize:24}, {f:0.5, label:'LOCATION', value:d.loc, vsize:24}]},
    {h:84, cells:[{f:0.5, label:'COLLECTED BY', value:d.by, vsize:24}, {f:0.5, label:'SIGNATURE'}]},
  ], {ink, lfill:lab});
  kit.text(d.desc, {left:L + 12, top:360 + 84 + 36, width:CW - 24, font:'Courier Prime', weight:400, size:19, fill:ink, lh:1.35});
  kit.text('CHAIN OF CUSTODY', {left:L, top:gy + 22, width:500, font:'Inter', weight:700, size:14, cs:300, fill:ink, lh:1.0});
  const rows = [{h:42, cells:[{f:0.3, label:'RELEASED BY'}, {f:0.3, label:'RECEIVED BY'}, {f:0.22, label:'DATE'}, {f:0.18, label:'TIME'}]}];
  d.rows.forEach(r=>rows.push({h:50, cells:r.map((v, i)=>({f:[0.3, 0.3, 0.22, 0.18][i], value:v, vsize:19, vweight:400, vtop:12}))}));
  const cy = DP.grid(kit, L, gy + 50, CW, rows, {ink, lfill:lab, lsize:11, vsize:19});
  const by = cy + 28, lw = CW, lh = 176;
  kit.rect({left:L, top:by, width:lw, height:lh, fill:'#f1ecdf', opacity:0.96, blend:'source-over', label:'Etiqueta branca'});
  kit.rect({left:L, top:by, width:lw, height:lh, stroke:'#2a1c10', sw:1, opacity:0.4, label:'Etiqueta branca (borda)'});
  const code = kit.barcode(d.code, 0, by + 20, 100, 3.9, {fill:'#111111', label:'Código de barras (Code 128)'});
  code.obj.set({left:L + (lw - code.width)/2});
  kit.text(d.human, {left:L, top:by + 132, width:lw, font:'Courier Prime', weight:700, size:23, cs:160, fill:'#111111', align:'center', lh:1.0});
  kit.text('KEEP SEALED UNTIL INSPECTION', {left:0, top:1296, width:W, font:'Inter', weight:600, size:12, cs:260, fill:lab, align:'center', lh:1.0});
  await kit.stain(d.stain.type, Object.assign({size:150, opacity:0.4}, d.stain.o));
};
DP.TAG_FONTS = ["400 20px 'Courier Prime'", "700 20px 'Courier Prime'", "600 20px 'Inter'", "900 20px 'Libre Franklin'", "700 20px 'Libre Franklin'"];

/* ============ Etiqueta · saco de evidência (kraft, Twin Peaks) ============ */
registerDoc('tag', {
  label:'Etiqueta — saco de evidência', page:[900, 1350], phys:[6, 9],
  paper:{type:'pardo', level:0.5, atmos:'twin', fold:'nenhuma'},
  fonts:DP.TAG_FONTS,
  build: (kit)=>DP.tagFront(kit, {
    item:'12', desc:'One (1) diving watch, steel, stopped. Water behind the crystal. Handle with gloves.', dt:'03/14   04:20', loc:'Lower deck', by:'M. Holt',
    rows:[['Brandt', 'Holt', '03/14', '03:50'], ['Holt', '', '', ''], ['', '', '', ''], ['', '', '', '']],
    code:'COUNT AGAIN', human:'0447 - 12', stain:{type:'coffee', o:{x:700, y:250, angle:-14, seed:3, label:'Detalhe — anel de umidade'}},
  }),
});

/* Timbre da plataforma: dois abetos vermelhos, nome empilhado, filete. */
DP.letterhead = (kit)=>{
  const W = kit.W, cx = W/2, red = DP.red;
  kit.fir(cx - 250, 92, 84, {fill:red, label:'Abeto do timbre'});
  kit.fir(cx + 250 - 52, 92, 84, {fill:red, label:'Abeto do timbre'});
  const head = kit.column(cx - 200, 90, 400, {font:'Jost', weight:600, size:22, cs:320, fill:red, align:'center', lh:1.3});
  head.text('PLATFORM DESERTO'); head.text('CREW SERVICES', {size:16, cs:420, fill:DP.brown});
  kit.line(cx - 80, 196, cx + 80, 196, {stroke:red, sw:1.6, label:'Filete do timbre'});
};
DP.LETTER_FONTS = ["600 20px 'Jost'", "500 20px 'Jost'", "400 20px 'Libre Baskerville'", "italic 400 20px 'Libre Baskerville'", "700 20px 'Courier Prime'"];

/* ============ Carta · papel timbrado da plataforma (Great Northern) ============ */
registerDoc('letter', {
  label:'Carta — papel timbrado', page:A4.page, phys:A4.phys,
  paper:{type:'verge', level:0.28, atmos:'twin', fold:'tres'},
  fonts:DP.LETTER_FONTS,
  build: async (kit)=>{
    const W = kit.W, cx = W/2, L = 190, CW = W - 380, red = DP.red;
    DP.letterhead(kit);

    kit.text('March 11', {left:W - 190 - 300, top:310, width:300, font:'Libre Baskerville', weight:400, size:21, align:'right', lh:1.2});
    const col = kit.column(L, 396, CW, {font:'Libre Baskerville', weight:400, size:22, lh:1.65, gap:36});
    col.text('Dear Sarah,');
    col.text("I know it's been a while. Work out here doesn't leave much room for letters, and honestly there isn't much to say that would clear the censor's desk anyway.");
    col.text("The platform is fine. Routine, mostly. I think about the house a lot, and the noise the boiler used to make, and how much I used to complain about it. I'd take that noise over what we've got out here.");
    col.text("If anything happens, the company has my paperwork in order. Don't let them tell you otherwise.");
    col.text('Take care of yourself.');
    col.text('Yours,', {gap:0});
    // espaço pra assinatura e P.S. à mão
    kit.text('Platform Deserto  ·  Offshore Block 7  ·  Crew mail is collected on Fridays.', {left:0, top:1644, width:W, font:'Jost', weight:500, size:14, cs:240, fill:DP.brown, align:'center', lh:1.0});
    kit.line(L, 1626, W - L, 1626, {stroke:red, sw:1, opacity:0.7, label:'Filete do rodapé'});
    kit.stamp('RECEIVED  MAR 09', {x:W - 330, y:236, angle:-9, size:22, opacity:0.66, label:'Detalhe — carimbo de recebimento'});
  },
});

/* Cabeçalho do bloco de recados: tira de cola, "From the desk of", linha do nome e dias da semana (círculo opcional). */
DP.noteHead = (kit, o)=>{
  const W = kit.W, red = DP.red;
  // tira de cola no topo
  kit.rect({left:0, top:0, width:W, height:60, fill:'#d8d1bd', opacity:0.7, blend:'multiply', label:'Tira de cola'}).__bleedOk = true;
  kit.line(0, 60, W, 60, {stroke:'#8d8571', sw:2, opacity:0.55, label:'Borda da cola'}).__bleedOk = true;
  kit.fir(150, 98, 58, {fill:red, label:'Abeto do timbre'});
  kit.fir(W - 150 - 36, 98, 58, {fill:red, label:'Abeto do timbre'});
  kit.text('FROM THE DESK OF', {left:0, top:104, width:W, font:'Jost', weight:600, size:20, cs:340, fill:red, align:'center', lh:1.0});
  kit.text('PLATFORM DESERTO', {left:0, top:138, width:W, font:'Jost', weight:500, size:12.5, cs:420, fill:DP.brown, align:'center', lh:1.0});
  kit.line(120, 208, W - 120, 208, {stroke:DP.ink, sw:1.2, opacity:0.75, label:'Linha do nome'});
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], x0 = 90, x1 = W - 90, step = (x1 - x0)/6;
  days.forEach((d, i)=>kit.text(d, {left:x0 + step*i - 40, top:252, width:80, font:'Jost', weight:600, size:16, cs:200, fill:DP.brown, align:'center', lh:1.0}));
  if (o && o.circle != null){
    const ex = x0 + step*o.circle, ey = 262;
    kit.path(`M ${ex - 8} ${ey - 24} C ${ex + 34} ${ey - 30} ${ex + 52} ${ey + 4} ${ex + 36} ${ey + 22} C ${ex + 14} ${ey + 42} ${ex - 38} ${ey + 34} ${ex - 46} ${ey + 6} C ${ex - 50} ${ey - 16} ${ex - 18} ${ey - 30} ${ex + 14} ${ey - 28}`,
      {left:ex - 50, top:ey - 30, fill:null, stroke:'#8e2a22', sw:3.2, join:'round', blend:'multiply', opacity:0.82, label:'Detalhe — círculo no dia da semana'});
  }
};
DP.NOTE_FONTS = ["600 20px 'Jost'", "500 20px 'Jost'"];

/* ============ Bilhete · bloco do hotel/plataforma ============ */
registerDoc('note', {
  label:'Bilhete — bloco de recados', page:[874, 1240], phys:[5.83, 8.27],
  paper:{type:'creme', level:0.3, atmos:'twin', fold:'nenhuma'},
  fonts:DP.NOTE_FONTS,
  build: async (kit)=>{
    const W = kit.W, H = kit.H, cx = W/2, red = DP.red;
    DP.noteHead(kit, {circle:3});

    kit.ruled({top:330, bottom:H - 130, gap:52, left:60, right:W - 60, margin:false, color:'#9fb0bf', sw:1.3, opacity:0.55});
    kit.text('PLATFORM DESERTO   ·   CREW SERVICES', {left:0, top:H - 82, width:W, font:'Jost', weight:500, size:12, cs:320, fill:DP.brown, align:'center', lh:1.0});
    await kit.stain('water', {x:W - 150, y:H - 250, size:120, opacity:0.32, angle:30, seed:5, label:'Detalhe — pingo de água'});
  },
});

/* As duas páginas pautadas do diário (cabeçalho, data, margem, número). nos = [esquerda, direita]. */
DP.diaryPages = (kit, nos)=>{
  const W = kit.W, H = kit.H, mid = W/2;
  [{side:'L', no:nos[0]}, {side:'R', no:nos[1]}].forEach(p=>{
    const lx = p.side === 'L' ? 110 : mid + 150, rx = p.side === 'L' ? mid - 150 : W - 110;
    kit.ruled({top:220, bottom:H - 140, gap:50, left:lx, right:rx, margin:false, color:'#8aa3bf', sw:1.3, opacity:0.5});
    kit.line(lx + 78, 170, lx + 78, H - 110, {stroke:'#c75a5a', sw:1.6, opacity:0.55, label:'Margem'});
    kit.text('LOG   ·   PLATFORM DESERTO', {left:lx, top:96, width:600, font:'Jost', weight:600, size:15, cs:300, fill:DP.brown, lh:1.0});
    kit.text('DATE', {left:rx - 360, top:100, width:80, font:'Jost', weight:600, size:14, cs:260, fill:DP.brown, lh:1.0});
    kit.line(rx - 300, 122, rx, 122, {stroke:DP.ink, sw:1.2, opacity:0.7, label:'Linha da data'});
    kit.text(p.no, {left:p.side === 'L' ? lx : rx - 100, top:H - 98, width:100, font:'Jost', weight:600, size:22, fill:DP.brown, align:p.side === 'L' ? 'left' : 'right', lh:1.0});
  });
};
/* Sombra da lombada no centro da página dupla. */
DP.spine = (kit)=>{
  const H = kit.H, mid = kit.W/2;
  const sh = kit.rect({left:mid - 90, top:0, width:180, height:H, fill:'transparent', blend:'multiply', label:'Sombra da lombada'});
  sh.set('fill', new fabric.Gradient({type:'linear', coords:{x1:0, y1:0, x2:180, y2:0}, colorStops:[
    {offset:0, color:'rgba(60,40,20,0)'}, {offset:0.42, color:'rgba(60,40,20,0.22)'}, {offset:0.5, color:'rgba(40,25,10,0.42)'}, {offset:0.58, color:'rgba(60,40,20,0.22)'}, {offset:1, color:'rgba(60,40,20,0)'}]}));
  return sh;
};
DP.DIARY_FONTS = ["600 20px 'Jost'", "500 20px 'Jost'", "400 20px 'Courier Prime'"];

/* ============ Diário · caderno de registro, página dupla ============ */
registerDoc('diary', {
  label:'Diário — página dupla', page:[2480, 1754], phys:[16.54, 11.69],
  paper:{type:'creme', level:0.32, atmos:'twin', fold:'nenhuma'},
  fonts:DP.DIARY_FONTS,
  build: async (kit)=>{
    const W = kit.W, H = kit.H, mid = W/2, red = DP.red;
    DP.diaryPages(kit, ['47', '49']);
    DP.spine(kit);
    // marca d'água: selo da plataforma, quase invisível, na página da direita
    const sx = mid + 560, sy = 900;
    kit.circle({left:sx - 190, top:sy - 190, r:190, stroke:DP.brown, sw:4, opacity:0.07, label:'Marca d’água (selo)'});
    kit.circle({left:sx - 170, top:sy - 170, r:170, stroke:DP.brown, sw:1.6, opacity:0.07, label:'Marca d’água (selo)'});
    kit.fir(sx - 62, sy - 110, 130, {fill:DP.brown, opacity:0.07, label:'Marca d’água (abeto)'});
    kit.text('CREW LOG', {left:sx - 190, top:sy + 40, width:380, font:'Jost', weight:600, size:30, cs:420, fill:DP.brown, opacity:0.07, align:'center', lh:1.0, label:'Marca d’água (texto)'});
  },
});
