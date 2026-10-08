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

/* ============ Bar · "Midnight Tide" (néon, anos 80) ============ */
DOC_TEMPLATES.menu_diner.variants.push({
  id:'neon', label:'Bar · néon e noite (Midnight Tide)',
  paper:{type:'liso', level:0.1, atmos:'silent'},
  fonts:["400 20px 'Yellowtail'", "500 20px 'Oswald'", "600 20px 'Oswald'", "400 20px 'Source Sans 3'", "600 20px 'Source Sans 3'", "700 20px 'Source Sans 3'", "italic 400 20px 'Source Sans 3'"],
  build: async (kit)=>{
    const W = kit.W, H = kit.H, cx = W/2, pink = '#ff4fa3', cyan = '#38e1ff', white = '#f4f1ff', lav = '#b4aee8';
    kit.rect({left:0, top:0, width:W, height:H, fill:'#0a0d1f', label:'Fundo'});
    // grade de horizonte (synthwave) no pé da página
    const hz = 1352, vx = cx;
    for (let i = 0; i <= 18; i++){ const x = -300 + i*(W+600)/18; kit.line(vx + (x - vx)*0.04, hz, x, H, {stroke:pink, sw:1.6, opacity:0.4, blend:'source-over', label:'Grade'}).__bleedOk = true; }
    for (let i = 0; i < 9; i++){ const t = Math.pow(i/8, 2); kit.line(0, hz + (H-hz)*t, W, hz + (H-hz)*t, {stroke:pink, sw:1.6, opacity:0.4, blend:'source-over', label:'Grade'}); }
    kit.rect({left:0, top:hz-120, width:W, height:120, fill:'#0a0d1f', opacity:0.0, label:'(reserva)'});
    const frame = kit.rect({left:56, top:56, width:W-112, height:H-112, stroke:cyan, sw:6, rx:34, blend:'source-over', label:'Moldura néon'});
    frame.set('shadow', new fabric.Shadow({color:cyan, blur:22, offsetX:0, offsetY:0}));
    kit.rect({left:76, top:76, width:W-152, height:H-152, stroke:pink, sw:2, rx:24, blend:'source-over', label:'Moldura néon (rosa)'});
    kit.text('Midnight Tide', {left:0, top:104, width:W, font:'Yellowtail', size:196, fill:'#ffd0e8', align:'center', lh:1.0, blend:'source-over', shadow:{color:pink, blur:30}});
    kit.text('COCKTAILS  ·  BEER  ·  BITES', {left:0, top:344, width:W, font:'Oswald', weight:600, size:40, cs:320, fill:'#d8f8ff', align:'center', blend:'source-over', shadow:{color:cyan, blur:20}});

    const colX = [118, 650], CW = 470;
    const section = (c, title)=>{
      c.text(title, {font:'Oswald', weight:600, size:42, cs:200, fill:'#d8f8ff', blend:'source-over', shadow:{color:cyan, blur:14}, gap:4});
      c.rule({stroke:pink, sw:3, after:14, blend:'source-over'});
    };
    const item = (c, name, price, desc)=>{
      const y = kit.menuRow(name.toUpperCase(), price, c.left, c.y, CW, {font:'Oswald', size:34, weight:500, fill:white, pfont:'Source Sans 3', psize:30, pweight:700, pfill:'#ff9ccf', dotColor:lav, dotOpacity:0.5, dotSize:2.6, cs:40});
      c.y = y + 1;
      if (desc) c.text(desc, {font:'Source Sans 3', style:'italic', weight:400, size:24, fill:lav, blend:'source-over', gap:16}); else c.y += 16;
    };
    const A = kit.column(colX[0], 450, CW), B = kit.column(colX[1], 450, CW);
    section(A, 'SIGNATURE');
    item(A, 'Last Call', '11', 'Dark rum, black coffee, bitters');
    item(A, 'The 03:12', '12', 'Gin, brine, a little smoke');
    item(A, 'Moonpool', '11', 'Vodka, blue curaçao, crushed ice');
    item(A, 'Depth Charge', '9', 'Whiskey, dropped into dark beer');
    item(A, 'Seafoam', '12', 'Gin, cucumber, sea salt');
    section(B, 'ON TAP');
    item(B, 'Harbor Lager', '6', '');
    item(B, 'Black Tide Stout', '7', '');
    item(B, 'Fog IPA', '7', '');
    item(B, 'Dock Pilsner', '6', '');
    B.gap(24); section(B, 'BAR BITES');
    item(B, 'Fish tacos', '12', 'Cabbage, lime, hot sauce');
    item(B, 'Salt fries', '6', '');
    item(B, 'Pickled things', '5', 'Ask which things');
    item(B, 'Cherry pie, slice', '6', '');
    item(B, 'Oysters, half dozen', '16', 'Ask the shucker about the pearls');
    const lo = kit.text('LAST ORDERS 03:00  —  WE CLOSE WHEN THE TIDE TURNS', {left:0, top:1500, width:W, font:'Oswald', weight:500, size:30, cs:180, fill:'#d8f8ff', align:'center', blend:'source-over', shadow:{color:cyan, blur:16}});
    await kit.cupRing(1016, 1250, 58, {color:[120,200,255], blend:'screen', opacity:0.18, seed:6, label:'Detalhe — anel de copo (luz)'});
  },
});

/* ============ Café · "Café Abyssal" (giz no quadro-negro) ============ */
DOC_TEMPLATES.menu_diner.variants.push({
  id:'cafe', label:'Café · giz no quadro-negro (Café Abyssal)',
  paper:{type:'creme', level:0.2, atmos:'twin'},
  fonts:["400 20px 'Yellowtail'", "500 20px 'Barlow Condensed'", "600 20px 'Barlow Condensed'", "700 20px 'Barlow Condensed'", "400 20px 'Fredoka'", "500 20px 'Fredoka'"],
  build: async (kit)=>{
    const W = kit.W, H = kit.H, cx = W/2, chalk = '#f2efe4', yel = '#f0d98a', pink = '#f2a7b5';
    kit.rect({left:0, top:0, width:W, height:H, fill:'#5a3b24', label:'Moldura de madeira'});
    kit.rect({left:60, top:60, width:W-120, height:H-120, fill:'#1d2622', rx:8, label:'Quadro-negro'});
    kit.rect({left:60, top:60, width:W-120, height:H-120, stroke:'#2e1d10', sw:6, rx:8, label:'Sombra do quadro'});
    for (let i = 0; i < 7; i++) await kit.smudge(160 + (i*173)%(W-320), 200 + (i*307)%(H-400), 150 + (i%3)*40, {color:[235,235,225], blend:'screen', opacity:0.05, seed:i+1, label:'Pó de giz'});
    const ch = {fill:chalk, blend:'source-over', opacity:0.95};
    kit.text('Café Abyssal', {left:0, top:104, width:W, font:'Yellowtail', size:150, fill:chalk, align:'center', lh:1.0, blend:'source-over', opacity:0.96});
    kit.path('M 330 300 Q 400 276 470 300 T 610 300 T 750 300 T 890 300', {left:330, top:282, fill:null, stroke:yel, sw:5, label:'Soulignement'});
    kit.text('ESPRESSO  ·  TEA  ·  BAKERY', {left:0, top:326, width:W, font:'Barlow Condensed', weight:600, size:38, cs:380, fill:yel, align:'center', blend:'source-over'});
    // xícara de giz com vapor
    kit.path('M 990 190 L 990 250 Q 990 285 1025 285 L 1060 285 Q 1095 285 1095 250 L 1095 190 Z', {left:990, top:190, fill:null, stroke:chalk, sw:5, join:'round', blend:'source-over', opacity:0.9, label:'Xícara'});
    kit.path('M 1095 205 Q 1135 205 1135 235 Q 1135 262 1095 262', {left:1095, top:205, fill:null, stroke:chalk, sw:5, blend:'source-over', opacity:0.9, label:'Alça'});
    kit.path('M 1010 170 Q 1000 150 1012 132 Q 1024 114 1012 96', {left:1000, top:96, fill:null, stroke:pink, sw:4, blend:'source-over', label:'Vapor'});
    kit.path('M 1050 170 Q 1040 150 1052 132 Q 1064 114 1052 96', {left:1040, top:96, fill:null, stroke:pink, sw:4, blend:'source-over', label:'Vapor'});

    const colX = [128, 650], CW = 460;
    const section = (c, title)=>{
      c.text(title, {font:'Yellowtail', size:72, fill:yel, blend:'source-over', gap:0, lh:1.0});
      c.rule({stroke:chalk, sw:3, after:14, blend:'source-over', opacity:0.7});
    };
    const item = (c, name, price, note)=>{
      const y = kit.menuRow(name.toUpperCase(), price, c.left, c.y, CW, {font:'Barlow Condensed', size:39, weight:600, fill:chalk, pfont:'Fredoka', psize:33, pweight:500, pfill:pink, dotColor:chalk, dotOpacity:0.45, dotSize:2.8, cs:50, pdy:-2});
      c.y = y + 2;
      if (note) c.text(note, {font:'Fredoka', weight:400, size:22, fill:'#bcb8a8', blend:'source-over', gap:14}); else c.y += 14;
    };
    const A = kit.column(colX[0], 430, CW), B = kit.column(colX[1], 430, CW);
    section(A, 'Espresso bar');
    item(A, 'Espresso', '3.00'); item(A, 'Macchiato', '3.40'); item(A, 'Americano', '3.50'); item(A, 'Cortado', '3.80'); item(A, 'Flat white', '4.20');
    item(A, 'Latte', '4.50', 'oat, whole or none'); item(A, 'Mocha', '4.80');
    item(A, 'Black as midnight', '2.50', 'drip, bottomless');
    section(B, 'From the oven');
    item(B, 'Croissant', '3.50'); item(B, 'Cherry pie, slice', '4.50', 'baked on the platform, daily'); item(B, 'Banana bread', '3.80'); item(B, 'Almond croissant', '4.00'); item(B, 'Day-old', '2.00', 'ask at the counter');
    B.gap(20); section(B, 'Tea & other');
    item(B, 'Earl Grey', '3.00'); item(B, 'Chamomile', '3.00'); item(B, 'Hot chocolate', '3.50'); item(B, 'Caramel milk', '4.20');
    const bx = 128, by = 1282, bw = W-256, bh = 190;
    kit.rect({left:bx, top:by, width:bw, height:bh, stroke:chalk, sw:4, rx:22, opacity:0.9, blend:'source-over', label:'Quadro de giz'});
    kit.rect({left:bx+10, top:by+10, width:bw-20, height:bh-20, stroke:yel, sw:2, rx:16, opacity:0.7, blend:'source-over', label:'Quadro de giz (fio)'});
    kit.text("Today's special", {left:bx, top:by+22, width:bw, font:'Yellowtail', size:62, fill:yel, align:'center', lh:1.0, blend:'source-over'});
    kit.text('FISH CHOWDER & RYE   7.50   ·   UNTIL IT\'S GONE', {left:bx, top:by+112, width:bw, font:'Barlow Condensed', weight:600, size:40, cs:120, fill:chalk, align:'center', lh:1.0, blend:'source-over'});
    kit.line(128, 1500, W-128, 1500, {stroke:chalk, sw:3, dash:[2,10], cap:'round', blend:'source-over', opacity:0.6, label:'Tracejado de giz'});
    kit.text('Free refill with a smile.', {left:0, top:1530, width:W, font:'Yellowtail', size:52, fill:pink, align:'center', blend:'source-over'});
    kit.text('WIFI:  the-tide-is-low     PASSWORD:  0312', {left:0, top:1618, width:W, font:'Barlow Condensed', weight:600, size:28, cs:260, fill:yel, align:'center', blend:'source-over', opacity:0.9});
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
