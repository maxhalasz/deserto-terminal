/* ===================== Cardápios: estilos extras =====================
   Cada modelo de cardápio (menu_fine, menu_diner, menu_fastfood) ganha vários ESTILOS, como se fossem de
   restaurantes, bares e cafés diferentes: layout, cores, fontes e papel próprios. O primeiro estilo de cada
   um (lodge / galley / anchor) está em doc-menus.js; este arquivo acrescenta os outros e registra a lista
   de estilos. Seletor "Estilo" no painel Documento (editor.js: syncDocVariantUI). */

(function(){
  const asVar = (id, vid, label)=>{ const d = DOC_TEMPLATES[id]; d.variants = [{id:vid, label, paper:d.paper, fonts:d.fonts, build:d.build}]; };
  asVar('menu_fine', 'lodge', 'Lodge · marfim e vermelho (hotel de montanha)');
  asVar('menu_diner', 'galley', 'Diner · vermelho sobre creme (lanchonete)');
  asVar('menu_fastfood', 'anchor', 'Shopping · mostarda e marrom (praça de alimentação)');
  const ff = DOC_TEMPLATES.menu_fastfood, orig = ff.build;
  ff.variants.push({id:'dinein', label:'Drive-in · vermelho e amarelo clássico', paper:{type:'liso', level:0.1, atmos:'neutra'}, fonts:ff.fonts,
    build:(k, c)=>orig(k, Object.assign({}, c, {theme:'classic'}))});
})();

const DM = {}; // pequenos ajudantes dos estilos
DM.fan = (kit, cx, cy, color, n, r0, dr, sw)=>{   // leque art déco: arcos concêntricos
  for (let i = 0; i < n; i++){
    const r = r0 + i*dr;
    kit.path(`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`, {left:cx - r, top:cy - r, fill:null, stroke:color, sw:sw || 2, label:'Leque'});
  }
};
DM.octFrame = (kit, x, y, w, h, cut, color, sw, label)=>{
  const d = `M ${x+cut} ${y} L ${x+w-cut} ${y} L ${x+w} ${y+cut} L ${x+w} ${y+h-cut} L ${x+w-cut} ${y+h} L ${x+cut} ${y+h} L ${x} ${y+h-cut} L ${x} ${y+cut} Z`;
  return kit.path(d, {left:x, top:y, fill:null, stroke:color, sw:sw, label:label || 'Moldura'});
};

/* Zigue-zague em faixa (piso da Red Room): fundo c2 com `rows` degraus em zigue-zague, os pares em c1. */
DM.chevron = (kit, x1, x2, y, o)=>{
  const amp = o.amp || 26, half = o.half || amp, rows = o.rows || 3, sh = o.sh || 20, hgt = amp + rows*sh;
  kit.rect({left:x1, top:y, width:x2 - x1, height:hgt, fill:o.c2, blend:'source-over', label:(o.label || 'Faixa') + ' (fundo)'}).__bleedOk = true;
  const n = Math.ceil((x2 - x1)/half);
  for (let k = 0; k < rows; k += 2){
    const y0 = y + k*sh, tp = [], bp = [];
    for (let i = 0; i <= n; i++){ const px = x1 + i*half, off = i%2 ? amp : 0; tp.push(px + ' ' + (y0 + off)); bp.push(px + ' ' + (y0 + sh + off)); }
    kit.path('M ' + tp.join(' L ') + ' L ' + bp.reverse().join(' L ') + ' Z', {left:x1, top:y0, fill:o.c1, blend:'source-over', label:(o.label || 'Faixa') + ' (listra)'}).__bleedOk = true;
  }
};
/* Traço de giz: linha com pequenas oscilações (mão levantada), um caminho só. */
DM.chalkLine = (kit, x1, y1, x2, y2, o)=>{
  o = o || {};
  const rng = mulberry32((o.seed || 1)*131 + Math.round(x1*3 + y1*7)), len = Math.hypot(x2 - x1, y2 - y1) || 1, n = Math.max(2, Math.round(len/26));
  const nx = -(y2 - y1)/len, ny = (x2 - x1)/len, amp = o.wob != null ? o.wob : 1.7, pts = [];
  let off = 0;
  for (let i = 0; i <= n; i++){ off = (off + (rng() - 0.5)*amp*2.2)*0.72; const t = i/n; pts.push([x1 + (x2 - x1)*t + nx*off, y1 + (y2 - y1)*t + ny*off]); }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) d += ` Q ${pts[i-1][0].toFixed(1)} ${pts[i-1][1].toFixed(1)} ${((pts[i-1][0] + pts[i][0])/2).toFixed(1)} ${((pts[i-1][1] + pts[i][1])/2).toFixed(1)}`;
  d += ` L ${pts[n][0].toFixed(1)} ${pts[n][1].toFixed(1)}`;
  return kit.path(d, {left:Math.min(...pts.map(p=>p[0])), top:Math.min(...pts.map(p=>p[1])), fill:null, stroke:o.stroke, sw:o.sw || 3.5, join:'round', blend:'source-over', opacity:o.opacity != null ? o.opacity : 0.92, label:o.label || 'Traço de giz'});
};
/* Moldura de giz: quatro traços que passam um pouco do canto (como se desenha à mão). */
DM.chalkBox = (kit, x, y, w, h, o)=>{
  const ov = o.ov != null ? o.ov : 9, s = o.seed || 1, op = {stroke:o.stroke, sw:o.sw || 3.5, opacity:o.opacity, label:'Moldura de giz'};
  DM.chalkLine(kit, x - ov, y, x + w + ov*0.6, y + 1, Object.assign({seed:s}, op));
  DM.chalkLine(kit, x + w, y - ov*0.5, x + w + 1, y + h + ov, Object.assign({seed:s + 1}, op));
  DM.chalkLine(kit, x + w + ov*0.5, y + h, x - ov, y + h - 1, Object.assign({seed:s + 2}, op));
  DM.chalkLine(kit, x, y + h + ov*0.6, x - 1, y - ov, Object.assign({seed:s + 3}, op));
};
/* Abeto só de contorno, em giz. */
DM.chalkFir = (kit, x, y, h, color, sw)=>{
  const f = kit.fir(x, y, h, {fill:'#000000', label:'Abeto de giz'});
  f.set({fill:null, stroke:color, strokeWidth:sw || 3, strokeLineJoin:'round', globalCompositeOperation:'source-over', opacity:0.9});
  return f;
};
/* Xícara de giz com vapor. (x,y) = canto de cima-esquerda do corpo; s = escala. */
DM.chalkCup = (kit, x, y, s, chalk, steam)=>{
  const P = (px, py)=>`${(x + px*s).toFixed(1)} ${(y + py*s).toFixed(1)}`;
  const o = {fill:null, join:'round', blend:'source-over', sw:5, opacity:0.9};
  kit.path(`M ${P(0,0)} L ${P(0,60)} Q ${P(0,95)} ${P(35,95)} L ${P(70,95)} Q ${P(105,95)} ${P(105,60)} L ${P(105,0)} Z`, Object.assign({left:x, top:y, stroke:chalk, label:'Xícara de giz'}, o));
  kit.path(`M ${P(105,15)} Q ${P(145,15)} ${P(145,45)} Q ${P(145,72)} ${P(105,72)}`, Object.assign({left:x + 105*s, top:y + 15*s, stroke:chalk, label:'Alça de giz'}, o));
  [20, 62].forEach(dx=>kit.path(`M ${P(dx,-20)} Q ${P(dx-10,-40)} ${P(dx+2,-58)} Q ${P(dx+14,-76)} ${P(dx+2,-94)}`, Object.assign({left:x + (dx - 6)*s, top:y - 94*s, stroke:steam, label:'Vapor de giz'}, o)));
};

/* ============ Fine dining · "The Velvet Room" (clube de jantar, preto e dourado) ============ */
DOC_TEMPLATES.menu_fine.variants.push({
  id:'velvet', label:'Clube de jantar · preto e dourado (Velvet Room)',
  paper:{type:'liso', level:0.12, atmos:'silent'},
  fonts:["700 20px 'Bodoni Moda'", "500 20px 'Bodoni Moda'", "italic 400 20px 'Cormorant Garamond'", "600 20px 'Cormorant Garamond'", "500 20px 'Jost'", "600 20px 'Jost'"],
  build: async (kit)=>{
    const W = kit.W, H = kit.H, cx = W/2, gold = '#c9a45c', gold2 = '#e6cf94', cream = '#efe2c6';
    kit.rect({left:0, top:0, width:W, height:H, fill:'#110d0c', label:'Fundo preto'});
    DM.octFrame(kit, 58, 58, W-116, H-116, 40, gold, 3, 'Moldura externa');
    DM.octFrame(kit, 78, 78, W-156, H-156, 30, gold, 1.2, 'Moldura interna');
    DM.fan(kit, cx, 190, gold, 5, 26, 18, 2);
    kit.circle({left:cx-6, top:184, r:6, fill:gold, label:'Losango'});
    kit.text('THE VELVET ROOM', {left:0, top:228, width:W, font:'Bodoni Moda', weight:700, size:72, cs:140, fill:gold, align:'center', lh:1.0, blend:'source-over'});
    kit.text('SUPPER CLUB  ·  PLATFORM DESERTO', {left:0, top:332, width:W, font:'Jost', weight:500, size:17, cs:420, fill:cream, align:'center', blend:'source-over'});
    kit.line(cx-250, 394, cx-20, 394, {stroke:gold, sw:1.4, label:'Filete'}); kit.line(cx+20, 394, cx+250, 394, {stroke:gold, sw:1.4, label:'Filete'});
    kit.rect({left:cx-6, top:388, width:12, height:12, fill:gold, angle:45, label:'Losango'});

    const sections = [
      ['SMALL PLATES', [['Oysters, half dozen', 'Champagne mignonette, lemon', '18'], ['Beef tartare', 'Quail yolk, capers, rye crisp', '16'], ['Smoked eel', 'Horseradish cream, pickled shallot', '15']]],
      ['FROM THE GRILL', [['Dry-aged ribeye', 'Bone marrow butter, charred onion', '48'], ['Salt-baked sea bass', 'Brown butter, capers, sea lettuce', '38'], ['Duck breast', 'Cherry jus, black pepper', '36']]],
      ['SWEETS', [['Cherry pie, whipped cream', 'Baked on the platform, daily', '12'], ['Dark chocolate', 'Sea salt, burnt orange, black coffee', '14']]],
      ['AFTER MIDNIGHT', [['The Special', 'Ask the band', '—']]],
    ];
    const L = 220, CW = W - 440;
    let y = 440;
    sections.forEach(([title, items])=>{
      kit.text(title, {left:0, top:y, width:W, font:'Jost', weight:600, size:17, cs:420, fill:gold, align:'center', blend:'source-over'});
      kit.line(L, y+13, cx-190, y+13, {stroke:gold, sw:1, opacity:0.7, label:'Filete'}); kit.line(cx+190, y+13, L+CW, y+13, {stroke:gold, sw:1, opacity:0.7, label:'Filete'});
      y += 52;
      items.forEach(([name, desc, price])=>{
        const ry = kit.menuRow(name.toUpperCase(), price, L, y, CW, {font:'Bodoni Moda', size:28, weight:500, fill:cream, pfont:'Jost', psize:24, pweight:500, pfill:gold, dotColor:gold, dotOpacity:0.45, dotSize:2.4, cs:60});
        kit.text(desc, {left:L, top:ry + 2, width:CW, font:'Cormorant Garamond', style:'italic', weight:400, size:23, fill:gold2, blend:'source-over'});
        y = ry + 2 + 31 + 17;
      });
      y += 24;
    });
    kit.text('THE BAND PLAYS UNTIL 03:00.  THE KITCHEN CLOSES WHEN THE BAND STOPS.', {left:140, top:1560, width:W-280, font:'Jost', weight:500, size:14.5, cs:260, fill:cream, align:'center', opacity:0.85, blend:'source-over'});
    kit.zigzag(150, W-150, 1634, {amp:11, step:30, stroke:gold, sw:2.4, label:'Zigue-zague dourado'});
    kit.zigzag(150, W-150, 1654, {amp:11, step:30, stroke:gold, sw:1.2, opacity:0.55, label:'Zigue-zague dourado'});
    await kit.cupRing(1012, 1480, 62, {color:[222,190,120], blend:'screen', opacity:0.22, seed:9, label:'Detalhe — anel de copo (luz)'});
  },
});

/* ============ Fine dining · "Chez Désert" (bistrô francês, tinta azul-marinho) ============ */
DOC_TEMPLATES.menu_fine.variants.push({
  id:'bistro', label:'Bistrô · tinta azul-marinho (Chez Désert)',
  paper:{type:'cartao', level:0.24, atmos:'twin'},
  fonts:["400 20px 'Yellowtail'", "600 20px 'Cormorant Garamond'", "500 20px 'Cormorant Garamond'", "italic 500 20px 'Cormorant Garamond'", "400 20px 'EB Garamond'", "italic 400 20px 'EB Garamond'", "500 20px 'Jost'"],
  build: async (kit)=>{
    const W = kit.W, cx = W/2, navy = '#1f3556', red = '#a8302a', soft = '#4a5a76';
    kit.rect({left:56, top:56, width:W-112, height:1642, stroke:navy, sw:3, label:'Moldura'});
    kit.rect({left:70, top:70, width:W-140, height:1614, stroke:navy, sw:1, label:'Moldura interna'});
    [[70,70],[W-70,70],[70,1684],[W-70,1684]].forEach(([x,y])=>kit.rect({left:x-7, top:y-7, width:14, height:14, fill:navy, angle:45, label:'Canto'}));
    kit.text('Chez Désert', {left:0, top:96, width:W, font:'Yellowtail', size:156, fill:navy, align:'center', lh:1.0});
    kit.path('M 400 292 Q 470 268 540 292 T 680 292 T 820 292', {left:400, top:276, fill:null, stroke:red, sw:3, label:'Soulignement'});
    kit.text('BISTRO  ·  OPEN WHEN THE TIDE IS RIGHT', {left:0, top:318, width:W, font:'Jost', weight:500, size:16, cs:340, fill:soft, align:'center'});
    kit.text('★  MENU DU JOUR  ★', {left:0, top:372, width:W, font:'Jost', weight:500, size:19, cs:300, fill:red, align:'center'});
    kit.line(120, 420, W-120, 420, {stroke:navy, sw:1.2, label:'Filete'});

    const colX = [130, 650], CW = 460;
    const section = (c, title)=>{ c.text(title, {font:'Cormorant Garamond', weight:600, size:36, fill:red, cs:200, gap:2}); c.rule({stroke:navy, sw:1.2, after:14}); };
    const item = (c, name, price, desc)=>{
      const y = kit.menuRow(name, price, c.left, c.y, CW, {font:'Cormorant Garamond', size:32, weight:600, fill:navy, pfont:'Jost', psize:23, pweight:500, pfill:navy, dotColor:navy, dotOpacity:0.4, dotSize:2.2, pdy:5});
      c.y = y + 1;
      if (desc) c.text(desc, {font:'EB Garamond', style:'italic', weight:400, size:23, fill:soft, gap:16}); else c.y += 16;
    };
    const A = kit.column(colX[0], 452, CW), B = kit.column(colX[1], 452, CW);
    section(A, 'ENTRÉES');
    item(A, 'Soupe à l’oignon', '9', 'Gruyère, croûton, thyme');
    item(A, 'Terrine de campagne', '11', 'Cornichons, moutarde à l’ancienne');
    item(A, 'Salade de lentilles', '8', 'Échalote, vinaigrette tiède');
    A.gap(34); section(A, 'PLATS');
    item(A, 'Poisson du jour', '26', 'Beurre blanc, pommes vapeur');
    item(A, 'Confit de canard', '28', 'Pommes sarladaises, cerises');
    item(A, 'Boeuf bourguignon', '27', 'Lardons, champignons, purée');
    item(A, 'Omelette aux herbes', '16', 'Salade verte');
    section(B, 'FROMAGES');
    item(B, 'Plateau de trois', '14', 'Confiture de figues');
    item(B, 'Chèvre chaud', '12', 'Miel, noix');
    B.gap(34); section(B, 'DESSERTS');
    item(B, 'Tarte aux cerises', '9', 'Crème fraîche');
    item(B, 'Crème brûlée', '8', 'Vanille de Madagascar');
    item(B, 'Mousse au chocolat', '8', '');
    B.gap(34); section(B, 'BOISSONS');
    item(B, 'Café noir, bien serré', '3', '');
    item(B, 'Vin de la maison, verre', '7', '');
    item(B, 'Eau de la mer, filtrée', '0', 'Sur demande');

    const by = 1480;
    kit.rect({left:250, top:by, width:W-500, height:104, stroke:navy, sw:2.4, label:'Quadro da fórmula'});
    kit.rect({left:258, top:by+8, width:W-516, height:88, stroke:navy, sw:0.9, label:'Quadro da fórmula (fio)'});
    kit.text('FORMULE  —  trois plats  38   ·   deux plats  29', {left:260, top:by+30, width:W-520, font:'Cormorant Garamond', weight:600, size:30, fill:navy, align:'center', cs:60, lh:1.0});
    kit.text('Fermé le lundi, et quand la marée est mauvaise.', {left:0, top:1612, width:W, font:'EB Garamond', style:'italic', weight:400, size:23, fill:soft, align:'center'});
    await kit.cupRing(1000, 1380, 66, {color:[112,66,28], opacity:0.5, seed:4, label:'Detalhe — anel de café'});
  },
});

/* ============ Bar · "The Roadhouse" (cortina vermelha, zigue-zague preto e creme) ============ */
DOC_TEMPLATES.menu_diner.variants.push({
  id:'roadhouse', label:'Bar de estrada · cortina vermelha e zigue-zague (The Roadhouse)',
  paper:{type:'liso', level:0.1, atmos:'silent'},
  fonts:["400 20px 'Anton'", "500 20px 'Barlow Condensed'", "600 20px 'Barlow Condensed'", "600 20px 'Libre Franklin'", "700 20px 'Libre Franklin'", "italic 400 20px 'Libre Franklin'"],
  build: async (kit)=>{
    const W = kit.W, H = kit.H, cx = W/2;
    const cream = '#efe2c4', amber = '#e2a847', ink = '#0e0807', soft = '#cdbd9c';
    kit.proc('curtain', 0, 0, W, H, {seed:3, opts:{base:[104,12,18]}, label:'Cortina vermelha'});
    // franja da cortina (festão) no topo
    const sc = 124, nsc = Math.ceil(W/sc), pel = 70;
    let d = `M 0 0 L ${nsc*sc} 0 L ${nsc*sc} ${pel}`;
    for (let i = nsc - 1; i >= 0; i--) d += ` A ${sc/2} ${sc*0.4} 0 0 1 ${i*sc} ${pel}`;
    kit.path(d + ' Z', {left:0, top:0, fill:'#2a0508', stroke:amber, sw:2.4, blend:'source-over', label:'Franja da cortina'}).__bleedOk = true;

    kit.text('★    ★    ★', {left:0, top:150, width:W, font:'Barlow Condensed', weight:600, size:34, cs:200, fill:amber, align:'center', lh:1.0});
    const sombra = kit.text('ROADHOUSE', {left:7, top:195, width:W, font:'Anton', size:212, cs:30, fill:ink, align:'center', lh:1.0, opacity:0.6, label:'Título (sombra)'});
    sombra.__bleedOk = true; sombra.__allowOverlap = true;
    kit.text('ROADHOUSE', {left:0, top:188, width:W, font:'Anton', size:212, cs:30, fill:cream, align:'center', lh:1.0});
    kit.text('LIVE MUSIC FRIDAY & SATURDAY  ·  KITCHEN OPEN LATE', {left:0, top:446, width:W, font:'Barlow Condensed', weight:600, size:31, cs:260, fill:amber, align:'center', lh:1.0});
    DM.chevron(kit, 0, W, 506, {amp:26, rows:3, sh:20, c1:ink, c2:cream, label:'Piso zigue-zague'});

    // painel escuro com a lista
    const px = 78, py = 636, pw = W - 156, ph = 806;
    kit.rect({left:px, top:py, width:pw, height:ph, fill:'rgba(10,4,4,0.66)', label:'Painel'});
    kit.rect({left:px + 14, top:py + 14, width:pw - 28, height:ph - 28, stroke:amber, sw:1.6, opacity:0.8, blend:'source-over', label:'Painel (fio)'});
    const colX = [126, 654], CW = 460;
    const section = (c, title)=>{
      c.text(title, {font:'Anton', size:44, fill:amber, cs:140, gap:4});
      c.rule({stroke:cream, sw:1.6, after:16, blend:'source-over', opacity:0.55});
    };
    const item = (c, name, price, desc)=>{
      const y = kit.menuRow(name.toUpperCase(), price, c.left, c.y, CW, {font:'Libre Franklin', size:29, weight:600, fill:cream, pfont:'Libre Franklin', psize:29, pweight:700, pfill:amber, dotColor:cream, dotOpacity:0.32, dotSize:2.6, cs:30});
      c.y = y + 2;
      if (desc) c.text(desc, {font:'Libre Franklin', style:'italic', weight:400, size:23, fill:soft, blend:'source-over', gap:17}); else c.y += 17;
    };
    const A = kit.column(colX[0], py + 44, CW), B = kit.column(colX[1], py + 44, CW);
    section(A, 'ON TAP');
    item(A, 'Pine Lager', '6', '5.0%  ·  crisp, a little sweet');
    item(A, 'Derrick Amber', '7', '5.6%  ·  toasted malt');
    item(A, 'Black Tide Stout', '7', '6.2%  ·  coffee and smoke');
    item(A, 'Tap Four', '—', 'Out of order since the platform opened');
    A.gap(26); section(A, 'WHISKEY & RYE');
    item(A, 'House whiskey', '6', '');
    item(A, 'Rye, neat', '9', '');
    item(A, 'Bourbon, on the rocks', '9', '');
    item(A, 'Single malt, 12 yr', '14', '');
    section(B, 'FROM THE KITCHEN');
    item(B, 'Roadhouse burger', '12', 'Sharp cheddar, pickle, onion');
    item(B, 'Grilled cheese + soup', '9', 'Soup is whatever is hot');
    item(B, 'Chili, bowl', '8', 'Beans optional');
    item(B, 'Fried catch', '14', 'Beer batter, lemon');
    item(B, 'Fries', '5', '');
    B.gap(26); section(B, 'SWEETS & COFFEE');
    item(B, 'Cherry pie, slice', '6', 'Baked on the platform, daily');
    item(B, 'Coffee, bottomless', '3', '');
    await kit.cupRing(1052, 1386, 42, {color:[226,176,110], blend:'screen', opacity:0.2, seed:5, label:'Detalhe — anel de copo (luz)'});

    DM.chevron(kit, 0, W, 1490, {amp:26, rows:3, sh:20, c1:ink, c2:cream, label:'Piso zigue-zague'});
    kit.text('THE BAND PLAYS FIVE SETS.  ONLY FOUR ARE ON THE POSTER.', {left:0, top:1628, width:W, font:'Barlow Condensed', weight:600, size:27, cs:240, fill:cream, align:'center', lh:1.0, opacity:0.92});
  },
});

/* ============ Café · "Café Abyssal" (lodge: moldura de madeira, quadro-negro, giz) ============ */
DOC_TEMPLATES.menu_diner.variants.push({
  id:'cafe', label:'Café · lodge de madeira com quadro de giz (Café Abyssal)',
  paper:{type:'liso', level:0.05, atmos:'neutra'},
  fonts:["400 20px 'Yellowtail'", "500 20px 'Barlow Condensed'", "600 20px 'Barlow Condensed'", "400 20px 'Shadows Into Light'"],
  build: async (kit)=>{
    const W = kit.W, H = kit.H, cx = W/2, T = 66;
    const chalk = '#f1eee2', yel = '#ecd98c', pink = '#eea9b7', slate = [34,46,41];
    const halo = {color:'rgba(241,238,226,0.45)', blur:3};
    kit.proc('slate', 0, 0, W, H, {seed:4, opts:{base:slate}, label:'Quadro-negro'});
    kit.proc('frame', 0, 0, W, H, {seed:6, opts:{t:T, base:[122,76,42]}, label:'Moldura de madeira'});

    DM.chalkFir(kit, 128, 120, 150, chalk, 3);
    DM.chalkFir(kit, W - 128 - 93, 120, 150, chalk, 4);
    kit.text('Café Abyssal', {left:0, top:96, width:W, font:'Yellowtail', size:140, fill:chalk, align:'center', lh:1.0, shadow:halo, opacity:0.96});
    kit.text('COFFEE   ·   PIE   ·   BREAKFAST ALL DAY', {left:0, top:296, width:W, font:'Barlow Condensed', weight:600, size:34, cs:380, fill:yel, align:'center', lh:1.0, opacity:0.95});
    DM.chalkLine(kit, 190, 368, W - 190, 370, {stroke:chalk, sw:4, seed:1});
    DM.chalkLine(kit, 230, 381, W - 230, 380, {stroke:chalk, sw:2, seed:2, opacity:0.7});

    const colX = [130, 660], CW = 450;
    const section = (c, title)=>{
      c.text(title, {font:'Yellowtail', size:74, fill:yel, blend:'source-over', gap:0, lh:1.0, shadow:halo});
      DM.chalkLine(kit, c.left, c.y + 2, c.left + CW, c.y + 3, {stroke:chalk, sw:3, seed:Math.round(c.y), opacity:0.75});
      c.y += 16;
    };
    const item = (c, name, price, note)=>{
      const y = kit.menuRow(name.toUpperCase(), price, c.left, c.y, CW, {font:'Barlow Condensed', size:40, weight:600, fill:chalk, pfont:'Barlow Condensed', psize:37, pweight:600, pfill:pink, dotColor:chalk, dotOpacity:0.4, dotSize:2.8, cs:50});
      c.y = y + 2;
      if (note) c.text(note, {font:'Shadows Into Light', weight:400, size:26, fill:'#c4c0b0', blend:'source-over', gap:12}); else c.y += 12;
    };
    const A = kit.column(colX[0], 430, CW), B = kit.column(colX[1], 430, CW);
    section(A, 'Espresso bar');
    item(A, 'Espresso', '3.00'); item(A, 'Macchiato', '3.40'); item(A, 'Americano', '3.50'); item(A, 'Cortado', '3.80'); item(A, 'Flat white', '4.20');
    item(A, 'Latte', '4.50', 'oat, whole or none');
    item(A, 'Black as midnight', '2.50', 'drip, bottomless');
    A.gap(18); section(A, 'Breakfast');
    item(A, 'Eggs & toast', '6.50', 'any style');
    item(A, 'Pancakes, maple', '7.50');
    section(B, 'From the oven');
    item(B, 'Croissant', '3.50'); item(B, 'Cherry pie, slice', '4.50', 'baked on the platform, daily'); item(B, 'Banana bread', '3.80'); item(B, 'Almond croissant', '4.00'); item(B, 'Day-old', '2.00', 'ask at the counter');
    B.gap(18); section(B, 'Tea & other');
    item(B, 'Earl Grey', '3.00'); item(B, 'Chamomile', '3.00'); item(B, 'Hot chocolate', '3.50'); item(B, 'Caramel milk', '4.20');
    DM.chalkCup(kit, 498, 462, 0.62, chalk, pink);

    const bx = 130, by = 1316, bw = W - 260, bh = 188;
    DM.chalkBox(kit, bx, by, bw, bh, {stroke:chalk, sw:4, seed:3});
    DM.chalkBox(kit, bx + 12, by + 12, bw - 24, bh - 24, {stroke:yel, sw:2, seed:5, opacity:0.7, ov:5});
    kit.text("Today's special", {left:bx, top:by + 22, width:bw, font:'Yellowtail', size:62, fill:yel, align:'center', lh:1.0, shadow:halo});
    kit.text("FISH CHOWDER & RYE   7.50   ·   UNTIL IT'S GONE", {left:bx, top:by + 114, width:bw, font:'Barlow Condensed', weight:600, size:40, cs:120, fill:chalk, align:'center', lh:1.0});
    kit.text('Free refill with a smile.', {left:0, top:1532, width:W, font:'Yellowtail', size:56, fill:pink, align:'center', lh:1.0, shadow:{color:'rgba(238,169,183,0.4)', blur:3}});
    kit.text('WIFI:  the-tide-is-low     PASSWORD:  0312', {left:0, top:1630, width:W, font:'Barlow Condensed', weight:600, size:28, cs:260, fill:yel, align:'center', lh:1.0, opacity:0.9});
    kit.proc('erode', T, T, W - 2*T, H - 2*T, {seed:8, opts:{color:slate}, label:'Giz gasto'});
  },
});

/* ============ Fast food · "Pizza Deck" (xadrez vermelho de toalha) ============ */
DOC_TEMPLATES.menu_fastfood.variants.push({
  id:'pizza', label:'Pizzaria · toalha xadrez vermelha (Pizza Deck)',
  paper:{type:'sulfite', level:0.14, atmos:'neutra'},
  fonts:["700 20px 'Fredoka'", "600 20px 'Fredoka'", "500 20px 'Fredoka'", "400 20px 'Anton'", "600 20px 'Source Sans 3'", "italic 400 20px 'Source Sans 3'"],
  build: async (kit)=>{
    const W = kit.W, H = kit.H, cx = W/2, red = '#c4261d', green = '#2a5a35', cream = '#fff6df', dark = '#3a1410';
    // toalha xadrez: faixas verticais e horizontais translúcidas (o cruzamento escurece, como gingham de verdade)
    const step = 70;
    let dv = '', dh = '';
    for (let x = 0; x < W; x += step*2) dv += `M ${x} 0 L ${x+step} 0 L ${x+step} ${H} L ${x} ${H} Z `;
    for (let y = 0; y < H; y += step*2) dh += `M 0 ${y} L ${W} ${y} L ${W} ${y+step} L 0 ${y+step} Z `;
    kit.path(dv, {left:0, top:0, fill:red, opacity:0.34, label:'Xadrez (vertical)'});
    kit.path(dh, {left:0, top:0, fill:red, opacity:0.34, label:'Xadrez (horizontal)'});
    // faixa do título
    kit.rect({left:70, top:70, width:W-140, height:300, fill:cream, rx:30, label:'Faixa do título'});
    kit.rect({left:70, top:70, width:W-140, height:300, stroke:red, sw:8, rx:30, label:'Faixa do título (borda)'});
    // fatia de pizza
    kit.path('M 190 130 L 330 330 L 120 330 Z', {left:120, top:130, fill:'#f0b84a', stroke:dark, sw:7, join:'round', label:'Fatia'});
    kit.path('M 120 330 Q 225 360 330 330', {left:120, top:328, fill:null, stroke:dark, sw:9, label:'Borda da fatia'});
    [[200,230,13],[240,282,12],[170,290,11]].forEach(([x,y,r])=>kit.circle({left:x-r, top:y-r, r, fill:red, stroke:dark, sw:3, label:'Calabresa'}));
    kit.text('PIZZA DECK', {left:380, top:96, width:760, font:'Fredoka', weight:700, size:132, fill:red, lh:1.0, cs:20});
    kit.text('WOOD-FIRED  ·  OPEN 24H', {left:386, top:250, width:740, font:'Fredoka', weight:600, size:42, fill:green, cs:120});
    kit.text('Whole pies only after midnight', {left:388, top:316, width:740, font:'Source Sans 3', style:'italic', weight:400, size:24, fill:dark});

    // lista com tamanhos
    kit.rect({left:70, top:410, width:W-140, height:960, fill:cream, rx:26, label:'Painel da lista'});
    kit.rect({left:70, top:410, width:W-140, height:960, stroke:red, sw:6, rx:26, label:'Painel da lista (borda)'});
    const colSize = [830, 930, 1030]; // x dos preços P / M / G
    ['S','M','L'].forEach((t, i)=>kit.text(t, {left:colSize[i]-10, top:436, width:90, font:'Anton', size:34, fill:red, align:'center', lh:1.0}));
    kit.line(110, 484, W-110, 484, {stroke:red, sw:3, label:'Filete'});
    const pies = [
      ['Margherita', 'tomato, mozzarella, basil', [8, 11, 14]],
      ['Pepperoni', 'pepperoni, mozzarella', [9, 12, 15]],
      ['Brine', 'anchovy, black olive, caper', [9, 12, 15]],
      ['Four Cheese', 'mozzarella, fontina, gorgonzola, parmesan', [10, 13, 16]],
      ['Garden', 'peppers, mushroom, onion, olive', [8, 11, 14]],
      ['Deck Special', 'whatever the oven has', [10, 13, 16]],
    ];
    pies.forEach(([name, desc, prices], i)=>{
      const y = 508 + i*142;
      kit.text(name, {left:120, top:y, width:640, font:'Fredoka', weight:600, size:44, fill:dark, lh:1.0});
      kit.text(desc, {left:122, top:y+60, width:640, font:'Source Sans 3', style:'italic', weight:400, size:23, fill:'#6a4a40', lh:1.15});
      prices.forEach((p, j)=>kit.text(String(p), {left:colSize[j]-10, top:y+6, width:90, font:'Anton', size:46, fill:red, align:'center', lh:1.0}));
      if (i < pies.length-1) kit.line(120, y+124, W-120, y+124, {stroke:red, sw:1.6, dash:[2,8], cap:'round', opacity:0.7, label:'Pontilhado'});
    });
    // combos
    kit.rect({left:70, top:1410, width:W-140, height:210, fill:red, rx:26, label:'Faixa dos combos'});
    kit.text('COMBOS', {left:110, top:1432, width:300, font:'Anton', size:54, fill:cream, lh:1.0, blend:'source-over', cs:60});
    kit.text('Slice + soda  4.99', {left:110, top:1508, width:520, font:'Fredoka', weight:600, size:38, fill:cream, blend:'source-over', lh:1.0});
    kit.text('Whole pie + 2 liters  18.99', {left:110, top:1560, width:700, font:'Fredoka', weight:600, size:38, fill:cream, blend:'source-over', lh:1.0});
    kit.text('We deliver to the dining deck only.\nWe do not deliver below deck.', {left:780, top:1470, width:360, font:'Source Sans 3', style:'italic', weight:600, size:22, fill:cream, blend:'source-over', align:'right', lh:1.3});
    await kit.smudge(1112, 1322, 46, {color:[120,40,16], opacity:0.5, seed:11, label:'Detalhe — mancha de gordura'});
  },
});
