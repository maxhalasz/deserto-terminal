/* ===================== Páginas prontas dos documentos (versos, continuações, anexos) =====================
   Cada modelo (ou estilo de cardápio) ganha `pages: [{id, label, build(kit, ctx), paper?, fonts?}]`. O botão "+ Página"
   (editor.js: pageAdd / buildDocPage) oferece essa lista; a página nova entra logo depois da atual, no mesmo tamanho e
   visual. Mesmas regras dos modelos: nada de manuscrito pronto (espaço e linhas pra escrever), 1–2 detalhes sutis em
   camada própria, dado que não fecha quando fizer sentido. Depende de doc-papers.js (DP.*) e do kit (doc-kit.js). */

/* ---------- Relatório NS-302 ---------- */
DOC_TEMPLATES.report.pages = [
  {id:'cont', label:'Folha de continuação (NS-302a)', fonts:DP.REPORT_FONTS, build: async (kit)=>{
    const L = 150, CW = kit.W - 300, ink = DP.ink;
    DP.reportHead(kit, 'CONTINUATION SHEET');
    const y1 = DP.grid(kit, L, 282, CW, [
      {h:94, cells:[{f:0.40, label:'FILE NO.', value:'DES-0447'}, {f:0.30, label:'DATE OF OCCURRENCE', value:'03/14'}, {f:0.30, label:'PAGE', value:'2 of 2'}]},
    ]);
    kit.text('NARRATIVE (CONTINUED)', {left:L, top:y1 + 46, width:600, font:'Inter', weight:700, size:14, cs:320, lh:1.0});
    kit.line(L, y1 + 76, kit.W - L, y1 + 76, {stroke:ink, sw:1.2, label:'Filete'});
    DP.numbered(kit, y1 + 106, [
      'Surface crew were asked to remain in quarters from 05:00. All complied.',
      'The moonpool hatch was closed and locked at 05:15. The key was logged with the Supervisor.',
      'Tape no. 12 was removed from the surface station at 05:40 and placed in the safe. A second copy was not made.',
      'No further transmissions were received on the 14th. Radio monitoring continues. End of report.',
    ], 6);
    DP.reportFoot(kit);
    DP.reportStamp(kit);
  }},
  {id:'witness', label:'Declaração de testemunha (NS-302W)', fonts:DP.REPORT_FONTS, build: async (kit)=>{
    const W = kit.W, L = 150, CW = W - 300, ink = DP.ink;
    DP.reportHead(kit, 'STATEMENT OF WITNESS');
    const y1 = DP.grid(kit, L, 282, CW, [
      {h:94, cells:[{f:0.50, label:'NAME'}, {f:0.25, label:'POSITION'}, {f:0.25, label:'DATE'}]},
      {h:94, cells:[{f:0.50, label:'LOCATION AT TIME OF INCIDENT'}, {f:0.25, label:'TIME'}, {f:0.25, label:'FILE NO.', value:'DES-0447'}]},
    ]);
    kit.text('State in your own words what you saw and heard. Write clearly. Do not guess. Do not discuss this statement with other witnesses before signing.',
      {left:L, top:y1 + 40, width:CW, font:'Courier Prime', weight:400, size:20, lh:1.45});
    kit.ruled({top:y1 + 170, bottom:1430, gap:54, left:L, right:W - L, margin:false, color:'#55514a', sw:1.1, opacity:0.5});
    kit.text('I have read the above statement and it is true.', {left:L, top:1452, width:CW, font:'Courier Prime', weight:400, size:18, lh:1.2});
    DP.reportFoot(kit, {signA:'Signature of witness', signB:'Statement taken by', line2:'Date dictated 03/15        Original: Supervision.  Copy 1: Field Division.'});
  }},
  {id:'evidence', label:'Lista de evidências (NS-302E)', fonts:DP.REPORT_FONTS, build: async (kit)=>{
    const W = kit.W, L = 150, CW = W - 300, ink = DP.ink;
    DP.reportHead(kit, 'EVIDENCE RECEIPT');
    const fr = [0.10, 0.38, 0.18, 0.20, 0.14];
    const rows = [{h:46, cells:[{f:fr[0], label:'ITEM'}, {f:fr[1], label:'DESCRIPTION'}, {f:fr[2], label:'COLLECTED'}, {f:fr[3], label:'LOCATION'}, {f:fr[4], label:'TAG'}]}];
    const data = [
      ['12', 'Diving watch, steel, stopped', '03/14 04:20', 'Lower deck', '0447-12'],
      ['13', 'Tape, magnetic, no. 12', '03/14 05:40', 'Surface station', '0447-13'],
    ];
    for (let i = 0; i < 14; i++){
      const r = data[i] || [String(12 + i), '', '', '', ''];
      rows.push({h:68, cells:r.map((v, k)=>({f:fr[k], value:v, vsize:19, vweight:400, vtop:20, vfill:data[i] || k ? ink : DP.grey}))});
    }
    const y1 = DP.grid(kit, L, 282, CW, rows, {lsize:12});
    kit.text('Items received:  2          Items logged:  2', {left:L, top:y1 + 28, width:CW, font:'Courier Prime', weight:700, size:20, lh:1.2});
    DP.reportFoot(kit, {signA:'Received by', signB:'Counted by'});
  }},
];

/* ---------- Dossiê redigido ---------- */
DOC_TEMPLATES.redacted.pages = [
  {id:'index', label:'Índice de páginas (pág. 1)', fonts:DP.DOS_FONTS, build: async (kit)=>{
    const W = kit.W, L = 140, CW = W - 280, ink = DP.ink;
    DP.dosHead(kit, 1, 'RELEASED IN FULL');
    kit.text('DOCUMENT INDEX', {left:L, top:262, width:700, font:'Libre Franklin', weight:700, size:34, cs:50, lh:1.0});
    const fr = [0.16, 0.46, 0.38];
    const rows = [{h:46, cells:[{f:fr[0], label:'PAGE'}, {f:fr[1], label:'STATUS'}, {f:fr[2], label:'EXEMPTION'}]}];
    const idx = [['1', 'Released in full', '—'], ['2', 'Released in part', '(b)(6)'], ['3', 'Released in part', '(b)(1)  (b)(6)']];
    for (let p = 4; p <= 9; p++) idx.push([String(p), 'Withheld in full', '(b)(1)']);
    idx.forEach(r=>rows.push({h:62, cells:r.map((v, k)=>({f:fr[k], value:v, vsize:22, vweight:k === 0 ? 700 : 400, vtop:18}))}));
    const y1 = DP.grid(kit, L, 322, CW, rows, {lsize:12});
    DP.redact(kit, '9 pages reviewed.  1 released in full.  2 released in part.  6 withheld in full.\n\nReviewing official: [[Name withheld]]\nAuthority: [[Supervision, Field Division]]', {left:L, top:y1 + 44, width:CW, font:'Courier Prime', size:22, weight:400, lh:1.5, fill:ink, label:'Texto do índice'});
    DP.dosFoot(kit, 1, '(b)(6)', false);
  }},
  {id:'memo', label:'Memorando com tarjas (pág. 2)', fonts:DP.DOS_FONTS, build: async (kit)=>{
    const W = kit.W, L = 140, CW = W - 280, ink = DP.ink;
    DP.dosHead(kit, 2);
    kit.text('MEMORANDUM', {left:L, top:262, width:700, font:'Libre Franklin', weight:700, size:34, cs:60, lh:1.0});
    const head = DP.redact(kit, 'TO:        [[Supervision]]\nFROM:      [[M. Holt]]\nDATE:      03/15\nRE:        [[Incident of 03/14]]', {left:L, top:322, width:CW, font:'Courier Prime', size:23, weight:700, lh:1.5, fill:ink, label:'Cabeçalho do memorando'});
    kit.line(L, head.bottom + 14, W - L, head.bottom + 14, {stroke:ink, sw:1.6, label:'Filete'});
    DP.redact(kit, [
      '1.  This memorandum records the events of the night watch of 03/14.',
      '',
      '2.  At [[03:12]] contact with [[the dive team]] was lost. The surface station recorded [[eleven seconds]] of the final transmission.',
      '',
      '3.  [[Three members of Supervision were present at the first playback. Their names are held in the file. One of them left the station before the recording ended and has not returned to his quarters.]]',
      '',
      '4.  It is recommended that [[the lower deck be sealed]] until further notice.',
      '',
      '5.  No reply to this memorandum is requested.',
    ].join('\n'), {left:L, top:head.bottom + 50, width:CW, font:'Courier Prime', size:23, weight:400, lh:1.5, fill:ink, label:'Texto do memorando'});
    DP.dosFoot(kit, 2, '(b)(6)');
  }},
  {id:'withheld', label:'Página retida (pág. 4)', fonts:DP.DOS_FONTS, build: async (kit)=>{
    const W = kit.W, L = 140, CW = W - 280, ink = DP.ink;
    DP.dosHead(kit, 4, 'WITHHELD IN FULL');
    // transparência: o texto do verso aparece espelhado e quase invisível
    const ghost = kit.text('Subject was located near the coral formation. State of consciousness unknown. Immediate containment and notification of leadership recommended.\n\nA second recording was made at the moonpool at 04:40. It was played back once in the presence of three members of Supervision.\n\nThe identified sound pattern does not match any catalog known to the division.\n\nRemaining personnel were interviewed on 03/15.',
      {left:L, top:300, width:CW, font:'Courier Prime', size:23, lh:1.5, fill:ink, opacity:0.055, label:'Detalhe — texto do verso (transparência)'});
    ghost.set('flipX', true); ghost.__allowOverlap = true;
    const by = 640, bh = 330;
    kit.rect({left:L, top:by, width:CW, height:bh, fill:'#cfcbc2', opacity:0.6, blend:'multiply', label:'Bloco de página retida'});
    kit.rect({left:L, top:by, width:CW, height:bh, stroke:ink, sw:3, label:'Bloco de página retida (borda)'});
    kit.rect({left:L + 10, top:by + 10, width:CW - 20, height:bh - 20, stroke:ink, sw:1.2, label:'Bloco de página retida (fio)'});
    kit.text('THIS PAGE HAS BEEN', {left:L, top:by + 62, width:CW, font:'Courier Prime', weight:700, size:30, cs:140, align:'center', lh:1.0});
    kit.text('WITHHELD IN FULL', {left:L, top:by + 108, width:CW, font:'Courier Prime', weight:700, size:44, cs:140, align:'center', lh:1.0});
    kit.text('Exemption (b)(1)', {left:L, top:by + 190, width:CW, font:'Courier Prime', weight:700, size:26, align:'center', lh:1.0});
    kit.text('Pages 4 – 9.  A copy is held in the file.', {left:L, top:by + 238, width:CW, font:'Courier Prime', weight:400, size:20, align:'center', lh:1.0});
    DP.dosFoot(kit, 4, '(b)(1)', false);
  }},
];

/* ---------- Etiqueta / saco de evidência ---------- */
DOC_TEMPLATES.tag.pages = [
  {id:'verso', label:'Verso do saco (selo e custódia)', fonts:DP.TAG_FONTS, build: async (kit)=>{
    const W = kit.W, L = 56, CW = W - 112, ink = '#1a1410', lab = '#43301f';
    kit.text('TAPE SEAL NO. 0312', {left:0, top:44, width:W, font:'Inter', weight:600, size:15, cs:300, fill:lab, align:'center', lh:1.0});
    // fita de evidência atravessando o saco
    const ty = 100, th = 118;
    kit.rect({left:0, top:ty, width:W, height:th, fill:'#e9e1cf', blend:'source-over', label:'Fita de evidência'}).__bleedOk = true;
    kit.rect({left:0, top:ty, width:W, height:8, fill:'#8a1f1a', blend:'source-over', label:'Fita (listra)'}).__bleedOk = true;
    kit.rect({left:0, top:ty + th - 8, width:W, height:8, fill:'#8a1f1a', blend:'source-over', label:'Fita (listra)'}).__bleedOk = true;
    kit.text('EVIDENCE — DO NOT OPEN — EVIDENCE — DO NOT OPEN', {left:-20, top:ty + 40, width:W + 40, font:'Libre Franklin', weight:900, size:27, cs:40, fill:'#8a1f1a', blend:'source-over', align:'center', lh:1.0}).__bleedOk = true;
    kit.text('SEALED BY (INITIALS)', {left:L, top:ty + th + 22, width:340, font:'Inter', weight:600, size:12.5, cs:130, fill:lab, lh:1.0});
    kit.line(L, ty + th + 84, L + 340, ty + th + 84, {stroke:ink, sw:1.3, label:'Linha de assinatura'});
    kit.text('DATE / TIME', {left:W - L - 340, top:ty + th + 22, width:340, font:'Inter', weight:600, size:12.5, cs:130, fill:lab, lh:1.0});
    kit.line(W - L - 340, ty + th + 84, W - L, ty + th + 84, {stroke:ink, sw:1.3, label:'Linha de assinatura'});
    // continuação da cadeia de custódia
    const gy0 = ty + th + 140;
    kit.text('CHAIN OF CUSTODY  (CONTINUED)', {left:L, top:gy0, width:600, font:'Inter', weight:700, size:14, cs:300, fill:ink, lh:1.0});
    const fr = [0.3, 0.3, 0.22, 0.18], rows = [{h:42, cells:[{f:fr[0], label:'RELEASED BY'}, {f:fr[1], label:'RECEIVED BY'}, {f:fr[2], label:'DATE'}, {f:fr[3], label:'TIME'}]}];
    for (let i = 0; i < 8; i++) rows.push({h:50, cells:fr.map(f=>({f}))});
    const cy = DP.grid(kit, L, gy0 + 30, CW, rows, {ink, lfill:lab, lsize:11});
    kit.text('Do not staple.  Do not write on the seal.  Photograph the item before opening.', {left:L, top:cy + 30, width:CW, font:'Courier Prime', weight:400, size:17, fill:ink, lh:1.35});
    kit.text('BAG NO. 07   ·   LOT 0447', {left:0, top:1296, width:W, font:'Inter', weight:600, size:12, cs:260, fill:lab, align:'center', lh:1.0});
    kit.stamp('OPENED  03/14  03:12', {x:W - 250, y:cy + 100, angle:-5, size:19, color:'#7a2020', opacity:0.72, label:'Detalhe — carimbo OPENED'});
  }},
  {id:'item', label:'Outra etiqueta (item 13)', fonts:DP.TAG_FONTS, build: (kit)=>DP.tagFront(kit, {
    item:'13', desc:'One (1) magnetic tape, no. 12. Label torn. Handle with gloves.', dt:'03/14   05:40', loc:'Surface station', by:'M. Holt',
    rows:[['Holt', 'Safe (Supervision)', '03/14', '05:40'], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']],
    code:'SEVEN', human:'0447 - 13', stain:{type:'water', o:{x:190, y:1210, angle:25, seed:9, label:'Detalhe — mancha de água'}},
  })},
];

/* ---------- Carta ---------- */
DOC_TEMPLATES.letter.pages = [
  {id:'p2', label:'Página 2 (sem timbre)', fonts:DP.LETTER_FONTS, build: async (kit)=>{
    const W = kit.W;
    kit.text('—  2  —', {left:0, top:104, width:W, font:'Libre Baskerville', weight:400, size:20, cs:80, fill:DP.brown, align:'center', lh:1.0});
  }},
];

/* ---------- Envelope (modelo próprio, 2 faces) ---------- */
registerDoc('envelope', {
  label:'Envelope — frente e verso', page:[1300, 650], phys:[8.66, 4.33],
  paper:{type:'creme', level:0.25, atmos:'twin', fold:'nenhuma'},
  fonts:["600 20px 'Jost'", "500 20px 'Jost'", "700 20px 'Courier Prime'", "700 20px 'Libre Franklin'"].concat(EM_FONTS),
  build: async (kit)=>{
    const W = kit.W, H = kit.H, red = DP.red;
    kit.text('CREW SERVICES', {left:70, top:62, width:500, font:'Jost', weight:600, size:19, cs:300, fill:red, lh:1.0});
    kit.text('Platform Deserto  ·  Offshore Block 7', {left:70, top:94, width:560, font:'Jost', weight:500, size:15, cs:160, fill:DP.brown, lh:1.0});
    kit.emblem('plataforma', 'tinta', 70, 132, 74, {color:red, label:'Emblema — remetente'});
    // selo postal
    const sx = W - 70 - 140, sy = 58;
    kit.rect({left:sx, top:sy, width:140, height:170, fill:'#8a2a22', blend:'source-over', label:'Selo postal'});
    kit.rect({left:sx + 10, top:sy + 10, width:120, height:150, stroke:'#efe3c4', sw:2, blend:'source-over', label:'Selo postal (fio)'});
    kit.emblem('icone', 'tinta', sx + 70 - 50, sy + 24, 100, {color:'#efe3c4', label:'Selo postal (plataforma)'});
    kit.text('25', {left:sx, top:sy + 124, width:140, font:'Libre Franklin', weight:900, size:30, fill:'#efe3c4', blend:'source-over', align:'center', lh:1.0});
    kit.rect({left:sx - 5, top:sy - 5, width:150, height:180, stroke:'#e9dfc7', sw:9, dash:[3, 9], cap:'round', blend:'source-over', label:'Selo postal (picote)'});
    // carimbo de postagem + linhas onduladas
    const pcx = sx - 130, pcy = 150;
    kit.circle({left:pcx - 82, top:pcy - 82, r:82, stroke:'#2c2a40', sw:3, opacity:0.62, blend:'multiply', label:'Detalhe — carimbo postal'});
    kit.circle({left:pcx - 68, top:pcy - 68, r:68, stroke:'#2c2a40', sw:1.4, opacity:0.55, blend:'multiply', label:'Detalhe — carimbo postal (fio)'});
    kit.text('CREW MAIL', {left:pcx - 70, top:pcy - 42, width:140, font:'Jost', weight:600, size:15, cs:200, fill:'#2c2a40', align:'center', opacity:0.65, lh:1.0, label:'Detalhe — carimbo postal (texto)'});
    kit.text('MAR 08', {left:pcx - 70, top:pcy - 14, width:140, font:'Libre Franklin', weight:900, size:28, fill:'#2c2a40', align:'center', opacity:0.65, lh:1.0, label:'Detalhe — carimbo postal (data)'});
    kit.text('03:12', {left:pcx - 70, top:pcy + 24, width:140, font:'Jost', weight:600, size:17, cs:160, fill:'#2c2a40', align:'center', opacity:0.65, lh:1.0, label:'Detalhe — carimbo postal (hora)'});
    for (let i = 0; i < 4; i++){
      const y = 100 + i*30;
      kit.path(`M ${pcx + 90} ${y} Q ${pcx + 130} ${y - 16} ${pcx + 170} ${y} T ${sx + 150} ${y}`, {left:pcx + 90, top:y - 16, fill:null, stroke:'#2c2a40', sw:2.4, opacity:0.5, blend:'multiply', label:'Detalhe — linhas de cancelamento'});
    }
    kit.stamp('EXAMINED   No. 3', {x:330, y:H - 118, angle:-3, size:24, color:'#8a1f1a', opacity:0.7, label:'Detalhe — carimbo da censura'});
  },
  pages: [
    {id:'verso', label:'Verso (aba)', build: async (kit)=>{
      const W = kit.W, H = kit.H;
      // aba triangular
      kit.path(`M 0 0 L ${W} 0 L ${W/2} 330 Z`, {left:0, top:0, fill:'#d6c9a6', opacity:0.55, stroke:'#8d8571', sw:2, blend:'multiply', label:'Aba do envelope'}).__bleedOk = true;
      kit.text('CREW SERVICES  ·  PLATFORM DESERTO', {left:0, top:60, width:W, font:'Jost', weight:600, size:16, cs:340, fill:DP.brown, align:'center', lh:1.0, opacity:0.8});
      kit.emblem('mono', 'selo', W/2 - 62, 108, 124, {color:'#7a2020', wear:0.45, seed:4, angle:-8, label:'Detalhe — selo Ø.A'});
      // fita de reabertura
      const tape = kit.rect({left:W/2 - 300, top:250, width:600, height:62, fill:'#ece5d2', blend:'source-over', angle:-3, label:'Fita de reabertura'});
      kit.text('OPENED BY CREW SERVICES  ·  RESEALED', {left:W/2 - 290, top:268, width:580, font:'Libre Franklin', weight:900, size:19, cs:90, fill:'#8a1f1a', blend:'source-over', align:'center', lh:1.0, angle:-3, label:'Fita de reabertura (texto)'});
    }},
  ],
});

/* ---------- Bilhete ---------- */
DOC_TEMPLATES.note.pages = [
  {id:'next', label:'Próxima folha do bloco', fonts:DP.NOTE_FONTS, build: async (kit)=>{
    const W = kit.W, H = kit.H;
    DP.noteHead(kit, {});
    kit.ruled({top:330, bottom:H - 130, gap:52, left:60, right:W - 60, margin:false, color:'#9fb0bf', sw:1.3, opacity:0.55});
    kit.text('PLATFORM DESERTO   ·   CREW SERVICES', {left:0, top:H - 82, width:W, font:'Jost', weight:500, size:12, cs:320, fill:DP.brown, align:'center', lh:1.0});
  }},
  {id:'msg', label:'Recado "While you were out"', fonts:DP.NOTE_FONTS, build: async (kit)=>{
    const W = kit.W, H = kit.H, red = DP.red, ink = DP.ink;
    kit.rect({left:0, top:0, width:W, height:60, fill:'#d8d1bd', opacity:0.7, blend:'multiply', label:'Tira de cola'}).__bleedOk = true;
    kit.line(0, 60, W, 60, {stroke:'#8d8571', sw:2, opacity:0.55, label:'Borda da cola'}).__bleedOk = true;
    kit.text('WHILE YOU WERE OUT', {left:0, top:98, width:W, font:'Jost', weight:600, size:34, cs:200, fill:red, align:'center', lh:1.0});
    const field = (label, x, y, w)=>{
      kit.text(label, {left:x, top:y, width:120, font:'Jost', weight:600, size:14, cs:200, fill:DP.brown, lh:1.0});
      kit.line(x + 70, y + 20, x + w, y + 20, {stroke:ink, sw:1.2, opacity:0.75, label:'Linha'});
    };
    field('TO', 70, 178, W - 140);
    field('DATE', 70, 232, 400); field('TIME', 520, 232, 284);
    kit.text('A.M.', {left:640, top:236, width:60, font:'Jost', weight:600, size:13, fill:DP.brown, lh:1.0});
    field('M', 70, 286, W - 140);
    field('OF', 70, 340, W - 140);
    field('PHONE', 70, 394, W - 140);
    const opts = ['TELEPHONED', 'CALLED TO SEE YOU', 'WANTS TO SEE YOU', 'RETURNED YOUR CALL', 'PLEASE CALL', 'WILL CALL AGAIN', 'URGENT'];
    opts.forEach((o, i)=>{
      const x = i%2 ? 460 : 70, y = 462 + Math.floor(i/2)*50;
      kit.rect({left:x, top:y, width:24, height:24, stroke:ink, sw:1.6, opacity:0.85, label:'Caixa de seleção'});
      kit.text(o, {left:x + 38, top:y + 2, width:340, font:'Jost', weight:600, size:15, cs:120, lh:1.0});
    });
    kit.text('MESSAGE', {left:70, top:690, width:300, font:'Jost', weight:600, size:14, cs:260, fill:DP.brown, lh:1.0});
    kit.ruled({top:750, bottom:1120, gap:52, left:60, right:W - 60, margin:false, color:'#9fb0bf', sw:1.3, opacity:0.55});
    kit.text('OPERATOR', {left:70, top:1150, width:200, font:'Jost', weight:600, size:14, cs:200, fill:DP.brown, lh:1.0});
    kit.line(170, 1170, W - 70, 1170, {stroke:ink, sw:1.2, opacity:0.75, label:'Linha'});
  }},
  {id:'verso', label:'Verso da folha', fonts:DP.NOTE_FONTS, build: async (kit)=>{
    const W = kit.W, H = kit.H;
    kit.rect({left:0, top:0, width:W, height:60, fill:'#d8d1bd', opacity:0.35, blend:'multiply', label:'Tira de cola (transparência)'}).__bleedOk = true;
    const ghost = kit.text('FROM THE DESK OF', {left:0, top:104, width:W, font:'Jost', weight:600, size:20, cs:340, fill:DP.red, align:'center', lh:1.0, opacity:0.08, label:'Detalhe — verso em transparência'});
    ghost.set('flipX', true); ghost.__allowOverlap = true;
    kit.ruled({top:330, bottom:H - 130, gap:52, left:60, right:W - 60, margin:false, color:'#9fb0bf', sw:1.3, opacity:0.12});
    kit.text('PAD NO. 3-12', {left:0, top:H - 82, width:W, font:'Jost', weight:500, size:12, cs:320, fill:DP.brown, align:'center', lh:1.0, opacity:0.6});
  }},
];

/* ---------- Diário ---------- */
DOC_TEMPLATES.diary.pages = [
  {id:'spread', label:'Próximas páginas (50 e 51)', fonts:DP.DIARY_FONTS, build: async (kit)=>{
    DP.diaryPages(kit, ['50', '51']);
    DP.spine(kit);
  }},
  {id:'title', label:'Folha de rosto (propriedade)', fonts:DP.DIARY_FONTS, build: async (kit)=>{
    const W = kit.W, H = kit.H, mid = W/2, red = DP.red, ink = DP.ink;
    // esquerda: verso da capa
    const lx = 190, lw = mid - 380;
    kit.text('THIS LOG IS THE PROPERTY OF', {left:lx, top:260, width:lw, font:'Jost', weight:600, size:22, cs:300, fill:red, align:'center', lh:1.0});
    kit.line(lx + 80, 360, lx + lw - 80, 360, {stroke:ink, sw:1.3, opacity:0.75, label:'Linha do nome'});
    kit.text('IF FOUND, RETURN TO', {left:lx, top:480, width:lw, font:'Jost', weight:500, size:17, cs:300, fill:DP.brown, align:'center', lh:1.0});
    kit.text('Crew Services', {left:lx, top:530, width:lw, font:'Libre Baskerville', weight:400, size:30, align:'center', lh:1.0});
    kit.text('Platform Deserto  ·  Offshore Block 7', {left:lx, top:584, width:lw, font:'Jost', weight:500, size:17, cs:160, fill:DP.brown, align:'center', lh:1.0});
    kit.emblem('plataforma', 'tinta', lx + lw/2 - 85, 690, 170, {color:red, label:'Emblema — folha de rosto'});
    // direita: folha de rosto
    const rx = mid + 190, rw = mid - 380;
    kit.text('CREW LOG', {left:rx, top:420, width:rw, font:'Jost', weight:600, size:84, cs:360, fill:red, align:'center', lh:1.0});
    kit.line(rx + 120, 540, rx + rw - 120, 540, {stroke:red, sw:2, label:'Filete'});
    kit.text('VOLUME  III', {left:rx, top:572, width:rw, font:'Jost', weight:500, size:24, cs:420, fill:DP.brown, align:'center', lh:1.0});
    kit.text('FROM', {left:rx + 100, top:760, width:100, font:'Jost', weight:600, size:16, cs:260, fill:DP.brown, lh:1.0});
    kit.line(rx + 200, 780, rx + rw - 100, 780, {stroke:ink, sw:1.2, opacity:0.75, label:'Linha'});
    kit.text('TO', {left:rx + 100, top:840, width:100, font:'Jost', weight:600, size:16, cs:260, fill:DP.brown, lh:1.0});
    kit.line(rx + 200, 860, rx + rw - 100, 860, {stroke:ink, sw:1.2, opacity:0.75, label:'Linha'});
    kit.text('No.  03 – 112', {left:rx, top:1500, width:rw, font:'Jost', weight:500, size:16, cs:300, fill:DP.brown, align:'center', lh:1.0});
    DP.spine(kit);
  }},
  {id:'cover', label:'Capa (aberta: traseira e frente)', paper:{type:'liso', level:0}, fonts:DP.DIARY_FONTS, build: async (kit)=>{
    const W = kit.W, H = kit.H, mid = W/2, gold = '#c9a45c';
    kit.proc('leather', 0, 0, W, H, {seed:5, opts:{base:[64, 26, 22]}, label:'Couro da capa'});
    // costura e vinco da lombada
    kit.rect({left:60, top:60, width:mid - 130, height:H - 120, stroke:'#b88a78', sw:2.2, dash:[16, 12], opacity:0.4, blend:'source-over', label:'Costura (traseira)'});
    kit.rect({left:mid + 70, top:60, width:mid - 130, height:H - 120, stroke:'#b88a78', sw:2.2, dash:[16, 12], opacity:0.4, blend:'source-over', label:'Costura (frente)'});
    kit.rect({left:mid - 6, top:0, width:12, height:H, fill:'#1a0a08', opacity:0.75, blend:'source-over', label:'Vinco da lombada'});
    // plaqueta da frente
    const px = mid + 330, py = 500, pw = mid - 660, ph = 520;
    kit.rect({left:px, top:py, width:pw, height:ph, fill:'#2a110d', opacity:0.55, blend:'source-over', label:'Plaqueta (fundo)'});
    kit.rect({left:px, top:py, width:pw, height:ph, stroke:gold, sw:4, blend:'source-over', label:'Plaqueta (moldura)'});
    kit.rect({left:px + 14, top:py + 14, width:pw - 28, height:ph - 28, stroke:gold, sw:1.4, blend:'source-over', label:'Plaqueta (fio)'});
    kit.emblem('plataforma', 'ouro', px + pw/2 - 125, py + 24, 250, {label:'Emblema — capa (ouro)'});
    kit.text('CREW LOG', {left:px, top:py + 292, width:pw, font:'Jost', weight:600, size:58, cs:300, fill:gold, blend:'source-over', align:'center', lh:1.0});
    kit.text('PLATFORM DESERTO', {left:px, top:py + 372, width:pw, font:'Jost', weight:500, size:18, cs:420, fill:gold, blend:'source-over', align:'center', lh:1.0});
    kit.text('VOLUME  III', {left:px, top:py + 436, width:pw, font:'Jost', weight:500, size:21, cs:420, fill:gold, blend:'source-over', align:'center', lh:1.0});
  }},
];

/* ---------- Jornal ---------- */
const newsPagePatch = (preset, ctx)=>{
  const p = {preset}, pv = ctx.prev && ctx.prev.news;
  if (pv){ if (pv.mast) p.mast = pv.mast; if (pv.justify != null) p.justify = pv.justify; }
  return p;
};
DOC_TEMPLATES.newspaper.pages = [
  {id:'interna', label:'Página interna (A5, continuação)', fonts:NEWS_FONT_SPECS, build: async (kit, ctx)=>{ await newsRebuild(newsPagePatch('interna', ctx)); }},
  {id:'classificados', label:'Classificados (A7)', fonts:NEWS_FONT_SPECS, build: async (kit, ctx)=>{ await newsRebuild(newsPagePatch('classificados', ctx)); }},
];
