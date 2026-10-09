/* ===================== Versos dos cardápios (um por estilo) =====================
   Cada estilo ganha `pages` (ver doc-pages.js): o verso reaproveita o visual da frente (molduras, fontes, paleta) e traz
   o conteúdo que combina com o lugar. Textos em inglês; 1 detalhe sutil por verso, sem explicação. Depende de
   doc-menus.js (TP), doc-menus2.js (DM.*) e do kit. */

const MV = (doc, id)=>DOC_TEMPLATES[doc].variants.find(v=>v.id === id);

/* ---------- Fine · Lodge: "After Dinner" ---------- */
MV('menu_fine', 'lodge').pages = [{id:'verso', label:'Verso — After Dinner', build: async (kit)=>{
  const W = kit.W, cx = W/2, red = TP.red;
  kit.rect({left:58, top:58, width:W-116, height:1638, stroke:red, sw:2.4, label:'Moldura externa'});
  kit.rect({left:74, top:74, width:W-148, height:1606, stroke:red, sw:1, label:'Moldura interna'});
  [[74,74],[W-74,74],[74,1680],[W-74,1680]].forEach(([x,y])=>kit.circle({left:x-5, top:y-5, r:5, fill:red, label:'Canto'}));
  kit.fir(cx - 27, 124, 88, {fill:red});
  kit.text('After Dinner', {left:0, top:236, width:W, font:'Cormorant Garamond', style:'italic', weight:500, size:92, align:'center', lh:1.0});
  kit.text('COFFEE  ·  CHEESE  ·  A LAST GLASS', {left:0, top:354, width:W, font:'Jost', weight:500, size:17, cs:340, fill:TP.brown, align:'center'});
  kit.zigzag(330, 910, 424, {amp:5, step:14, stroke:TP.ink, sw:1.4, opacity:0.4, label:'Zigue-zague (fio)'});
  const sections = [
    ['COFFEE & TEA', [['Coffee, black', 'Bottomless', '5'], ['Espresso', '', '5'], ['Earl Grey', 'Loose leaf, by the pot', '5'], ['Hot cherry cider', 'Cloves, orange peel', '9']]],
    ['DIGESTIFS', [['Calvados, twelve years', '', '18'], ['Armagnac', 'Gascony', '22'], ['Grappa', '', '16'], ['House cordial', 'Ask the kitchen', '—']]],
    ['CHEESE', [['Three cheeses', 'Honey, rye, pickled walnut', '18']]],
  ];
  const X = cx - 310, CW = 620;
  let y = 500;
  sections.forEach(([label, items])=>{
    kit.text(label, {left:0, top:y, width:W, font:'Jost', weight:600, size:16, cs:400, fill:red, align:'center'});
    kit.line(X + 40, y + 12, cx - 130, y + 12, {stroke:red, sw:1, label:'Filete'}); kit.line(cx + 130, y + 12, X + CW - 40, y + 12, {stroke:red, sw:1, label:'Filete'});
    y += 54;
    items.forEach(([name, desc, price])=>{
      const ry = kit.menuRow(name, price, X, y, CW, {font:'Cormorant Garamond', size:35, weight:500, fill:TP.ink, pfont:'Jost', psize:20, pweight:500, dots:false, pdy:6});
      y = ry + 2;
      if (desc){ const t = kit.text(desc, {left:X, top:y, width:CW, font:'Cormorant Garamond', style:'italic', weight:400, size:25, fill:TP.brown}); y = t.top + t.height; }
      y += 26;
    });
    y += 46;
  });
  kit.text('Please remain seated until the lamps are lowered.', {left:0, top:1596, width:W, font:'Cormorant Garamond', style:'italic', weight:500, size:26, fill:TP.brown, align:'center'});
  kit.zigzag(330, 910, 1654, {amp:5, step:14, stroke:TP.ink, sw:1.4, opacity:0.4, label:'Zigue-zague (fio)'});
}}];

/* ---------- Fine · Velvet Room: "The Band" ---------- */
MV('menu_fine', 'velvet').pages = [{id:'verso', label:'Verso — The Band', build: async (kit)=>{
  const W = kit.W, H = kit.H, cx = W/2, gold = '#c9a45c', gold2 = '#e6cf94', cream = '#efe2c6';
  kit.rect({left:0, top:0, width:W, height:H, fill:'#110d0c', label:'Fundo preto'});
  DM.octFrame(kit, 58, 58, W-116, H-116, 40, gold, 3, 'Moldura externa');
  DM.octFrame(kit, 78, 78, W-156, H-156, 30, gold, 1.2, 'Moldura interna');
  DM.fan(kit, cx, 190, gold, 5, 26, 18, 2);
  kit.circle({left:cx-6, top:184, r:6, fill:gold, label:'Losango'});
  kit.text('THE BAND', {left:0, top:228, width:W, font:'Bodoni Moda', weight:700, size:84, cs:160, fill:gold, align:'center', lh:1.0, blend:'source-over'});
  kit.text('TONIGHT ON STAGE', {left:0, top:342, width:W, font:'Jost', weight:500, size:17, cs:420, fill:cream, align:'center', blend:'source-over'});
  kit.line(cx-250, 400, cx-20, 400, {stroke:gold, sw:1.4, label:'Filete'}); kit.line(cx+20, 400, cx+250, 400, {stroke:gold, sw:1.4, label:'Filete'});
  kit.rect({left:cx-6, top:394, width:12, height:12, fill:gold, angle:45, label:'Losango'});
  const sets = [['SET I', '21:00', 'Standards'], ['SET II', '22:15', 'The slow ones'], ['SET III', '23:30', 'Requests, written on a card'], ['SET IV', '00:45', 'The last dance']];
  const L = 230, CW = W - 460;
  let y = 480;
  sets.forEach(([n, t, d])=>{
    kit.text(n, {left:L, top:y + 22, width:200, font:'Jost', weight:600, size:19, cs:340, fill:gold, blend:'source-over'});
    kit.text(t, {left:L + 220, top:y, width:260, font:'Bodoni Moda', weight:500, size:64, fill:cream, lh:1.0, blend:'source-over'});
    kit.text(d, {left:L + 520, top:y + 18, width:CW - 520, font:'Cormorant Garamond', style:'italic', weight:400, size:32, fill:gold2, lh:1.1, blend:'source-over'});
    kit.line(L, y + 108, L + CW, y + 108, {stroke:gold, sw:1, opacity:0.55, label:'Filete'});
    y += 160;
  });
  kit.text('THE PLAYERS', {left:0, top:y + 40, width:W, font:'Jost', weight:600, size:16, cs:420, fill:gold, align:'center', blend:'source-over'});
  kit.text('Piano   ·   Upright bass   ·   Drums   ·   Voice', {left:0, top:y + 84, width:W, font:'Cormorant Garamond', style:'italic', weight:500, size:34, fill:cream, align:'center', blend:'source-over'});
  kit.text('REQUESTS ARE HANDED TO THE PIANO.  THE LAST REQUEST IS NOT PLAYED.', {left:140, top:1560, width:W-280, font:'Jost', weight:500, size:14.5, cs:260, fill:cream, align:'center', opacity:0.85, blend:'source-over'});
  kit.zigzag(150, W-150, 1634, {amp:11, step:30, stroke:gold, sw:2.4, label:'Zigue-zague dourado'});
  kit.zigzag(150, W-150, 1654, {amp:11, step:30, stroke:gold, sw:1.2, opacity:0.55, label:'Zigue-zague dourado'});
}}];

/* ---------- Fine · Chez Désert: "Carte des vins" ---------- */
MV('menu_fine', 'bistro').pages = [{id:'verso', label:'Verso — Carte des vins', build: async (kit)=>{
  const W = kit.W, cx = W/2, navy = '#1f3556', red = '#a8302a', soft = '#4a5a76';
  kit.rect({left:56, top:56, width:W-112, height:1642, stroke:navy, sw:3, label:'Moldura'});
  kit.rect({left:70, top:70, width:W-140, height:1614, stroke:navy, sw:1, label:'Moldura interna'});
  [[70,70],[W-70,70],[70,1684],[W-70,1684]].forEach(([x,y])=>kit.rect({left:x-7, top:y-7, width:14, height:14, fill:navy, angle:45, label:'Canto'}));
  kit.text('Carte des Vins', {left:0, top:100, width:W, font:'Yellowtail', size:128, fill:navy, align:'center', lh:1.0});
  kit.path('M 400 262 Q 470 238 540 262 T 680 262 T 820 262', {left:400, top:246, fill:null, stroke:red, sw:3, label:'Soulignement'});
  kit.text('VERRE   /   BOUTEILLE', {left:0, top:308, width:W, font:'Jost', weight:500, size:16, cs:340, fill:soft, align:'center'});
  kit.line(120, 354, W-120, 354, {stroke:navy, sw:1.2, label:'Filete'});
  const colX = [130, 650], CW = 460;
  const section = (c, title)=>{ c.text(title, {font:'Cormorant Garamond', weight:600, size:36, fill:red, cs:200, gap:2}); c.rule({stroke:navy, sw:1.2, after:16}); };
  const item = (c, name, price, desc)=>{
    const y = kit.menuRow(name, price, c.left, c.y, CW, {font:'Cormorant Garamond', size:34, weight:600, fill:navy, pfont:'Jost', psize:24, pweight:500, pfill:navy, dotColor:navy, dotOpacity:0.4, dotSize:2.4, pdy:6});
    c.y = y + 1;
    if (desc) c.text(desc, {font:'EB Garamond', style:'italic', weight:400, size:25, fill:soft, gap:20}); else c.y += 20;
  };
  const A = kit.column(colX[0], 390, CW), B = kit.column(colX[1], 390, CW);
  section(A, 'ROUGES');
  item(A, 'Côtes du Rhône', '9 / 34', 'Syrah, garrigue, poivre');
  item(A, 'Bourgogne Pinot Noir', '12 / 46', 'Cerise noire, sous-bois');
  item(A, 'Saint-Émilion', '14 / 54', 'Merlot, cèdre, tabac');
  item(A, 'Vin de la maison', '7 / 26', '');
  A.gap(44); section(A, 'BLANCS');
  item(A, 'Chablis', '11 / 42', 'Pierre à fusil, citron');
  item(A, 'Sancerre', '12 / 46', 'Sauvignon, herbe coupée');
  item(A, 'Muscadet sur lie', '8 / 30', 'Pour les huîtres');
  section(B, 'ROSÉS & MOUSSEUX');
  item(B, 'Tavel', '9 / 34', 'Framboise, épices');
  item(B, 'Crémant d’Alsace', '11 / 42', 'Brut, fines bulles');
  item(B, 'Champagne, demi-sec', '— / 78', '');
  B.gap(44); section(B, 'DIGESTIFS');
  item(B, 'Calvados', '12', 'Pays d’Auge');
  item(B, 'Armagnac', '14', 'Vingt ans d’âge');
  item(B, 'Marc de Bourgogne', '10', '');
  item(B, 'Eau-de-vie de la maison', '—', 'Ne se commande pas');
  const by = 1450;
  kit.rect({left:250, top:by, width:W-500, height:104, stroke:navy, sw:2.4, label:'Quadro do vin du jour'});
  kit.rect({left:258, top:by + 8, width:W-516, height:88, stroke:navy, sw:0.9, label:'Quadro do vin du jour (fio)'});
  kit.text('VIN DU JOUR  —  verre 7   ·   bouteille 26', {left:260, top:by + 30, width:W-520, font:'Cormorant Garamond', weight:600, size:30, fill:navy, align:'center', cs:60, lh:1.0});
  kit.text('Le sommelier est à la cave. Sonnez une fois.', {left:0, top:1596, width:W, font:'EB Garamond', style:'italic', weight:400, size:25, fill:soft, align:'center'});
}}];

/* ---------- Diner · The Galley: "Plates of the Week" ---------- */
MV('menu_diner', 'galley').pages = [{id:'verso', label:'Verso — Plates of the Week', build: async (kit)=>{
  const W = kit.W, red = TP.red, green = TP.green, ink = '#231a14', warm = '#5b4a3a';
  kit.rect({left:50, top:50, width:W-100, height:1654, stroke:red, sw:5, label:'Moldura'});
  kit.rect({left:64, top:64, width:W-128, height:1626, stroke:red, sw:1.6, label:'Moldura interna'});
  kit.text('Plates of the Week', {left:0, top:96, width:W, font:'Yellowtail', size:136, fill:red, align:'center', lh:1.0});
  kit.text('MESS DECK  ·  EVERY EVENING FROM FIVE', {left:0, top:262, width:W, font:'Oswald', weight:500, size:30, cs:180, fill:green, align:'center'});
  kit.zigzag(64, W-64, 340, {amp:11, step:26, stroke:ink, sw:4, label:'Zigue-zague (Red Room)'});
  const days = [['MONDAY', 'Meatloaf, mashed potatoes', '4.25'], ['TUESDAY', 'Pot roast, carrots, gravy', '4.50'], ['WEDNESDAY', 'Fish and chips', '4.00'], ['THURSDAY', 'Chili con carne, cornbread', '4.00'], ['FRIDAY', 'Fish fry, slaw, rye', '4.25'], ['SATURDAY', 'Roast chicken, stuffing', '4.75'], ['SUNDAY', 'Whatever is left', '—']];
  const L = 120, CW = W - 240;
  let y = 400;
  days.forEach(([d, dish, price])=>{
    kit.text(d, {left:L, top:y + 4, width:260, font:'Alfa Slab One', size:30, fill:red, lh:1.0});
    const ry = kit.menuRow(dish, price, L + 280, y, CW - 280, {font:'Source Sans 3', size:32, weight:600, fill:ink, pfont:'Alfa Slab One', psize:28, pweight:400, pfill:red, pdy:1, dotColor:ink});
    y = ry + 58;
  });
  kit.line(L, y + 10, W - L, y + 10, {stroke:ink, sw:2, dash:[2,8], cap:'round', label:'Separador'});
  // cupom destacável
  const cy = y + 60;
  kit.rect({left:L + 40, top:cy, width:CW - 80, height:230, stroke:red, sw:4, dash:[18, 12], label:'Cupom (borda)'});
  kit.text('CLIP THIS', {left:L + 40, top:cy + 26, width:CW - 80, font:'Oswald', weight:500, size:24, cs:260, fill:green, align:'center'});
  kit.text('One free coffee', {left:L + 40, top:cy + 62, width:CW - 80, font:'Yellowtail', size:84, fill:red, align:'center', lh:1.0});
  kit.text('with any breakfast.  Good until 03:12.', {left:L + 40, top:cy + 168, width:CW - 80, font:'Source Sans 3', style:'italic', weight:400, size:26, fill:warm, align:'center'});
  kit.text('OPEN 24 HOURS  —  CLOSED 03:00–03:12 FOR CLEANING', {left:104, top:1620, width:W-208, font:'Oswald', weight:500, size:24, cs:120, fill:green, align:'center'});
}}];

/* ---------- Diner · Roadhouse: "On Stage" ---------- */
MV('menu_diner', 'roadhouse').pages = [{id:'verso', label:'Verso — On Stage', build: async (kit)=>{
  const W = kit.W, H = kit.H;
  const cream = '#efe2c4', amber = '#e2a847', ink = '#0e0807', soft = '#cdbd9c';
  kit.proc('curtain', 0, 0, W, H, {seed:11, opts:{base:[104,12,18]}, label:'Cortina vermelha'});
  const sc = 124, nsc = Math.ceil(W/sc), pel = 70;
  let d = `M 0 0 L ${nsc*sc} 0 L ${nsc*sc} ${pel}`;
  for (let i = nsc - 1; i >= 0; i--) d += ` A ${sc/2} ${sc*0.4} 0 0 1 ${i*sc} ${pel}`;
  kit.path(d + ' Z', {left:0, top:0, fill:'#2a0508', stroke:amber, sw:2.4, blend:'source-over', label:'Franja da cortina'}).__bleedOk = true;
  kit.text('THIS WEEK', {left:0, top:150, width:W, font:'Barlow Condensed', weight:600, size:34, cs:380, fill:amber, align:'center', lh:1.0});
  const sh = kit.text('ON STAGE', {left:7, top:195, width:W, font:'Anton', size:212, cs:30, fill:ink, align:'center', lh:1.0, opacity:0.6, label:'Título (sombra)'});
  sh.__bleedOk = true; sh.__allowOverlap = true;
  kit.text('ON STAGE', {left:0, top:188, width:W, font:'Anton', size:212, cs:30, fill:cream, align:'center', lh:1.0});
  DM.chevron(kit, 0, W, 470, {amp:26, rows:3, sh:20, c1:ink, c2:cream, label:'Piso zigue-zague'});
  const px = 78, py = 600, pw = W - 156, ph = 780;
  kit.rect({left:px, top:py, width:pw, height:ph, fill:'rgba(10,4,4,0.66)', label:'Painel'});
  kit.rect({left:px + 14, top:py + 14, width:pw - 28, height:ph - 28, stroke:amber, sw:1.6, opacity:0.8, blend:'source-over', label:'Painel (fio)'});
  const nights = [
    ['FRIDAY', [['21:00', 'The Low Tides'], ['22:15', 'Harbor Street Boys'], ['23:30', 'The Hymnals'], ['00:45', 'Mrs. Aldous at the piano']]],
    ['SATURDAY', [['21:00', 'Pilot & the Terriers'], ['22:15', 'The Kessler Brothers'], ['23:30', 'Open stage'], ['00:45', 'The house band']]],
  ];
  nights.forEach(([night, sets], i)=>{
    const x = i ? 654 : 126, c = kit.column(x, py + 44, 460);
    c.text(night, {font:'Anton', size:44, fill:amber, cs:140, gap:4});
    c.rule({stroke:cream, sw:1.6, after:20, blend:'source-over', opacity:0.55});
    sets.forEach(([t, name])=>{
      kit.text(t, {left:x, top:c.y, width:120, font:'Anton', size:36, fill:amber, lh:1.0});
      const tt = kit.text(name.toUpperCase(), {left:x + 128, top:c.y + 4, width:332, font:'Libre Franklin', weight:600, size:26, cs:30, fill:cream, lh:1.15});
      c.y = tt.top + tt.height + 26;
    });
  });
  kit.text('HOUSE RULES', {left:px + 48, top:py + 470, width:600, font:'Anton', size:34, fill:amber, cs:140, lh:1.0});
  kit.line(px + 48, py + 520, px + pw - 48, py + 520, {stroke:cream, sw:1.6, opacity:0.55, blend:'source-over', label:'Filete'});
  const rules = ['No phones near the stage.', 'No requests after midnight.', 'Do not applaud the last song.'];
  rules.forEach((r, i)=>kit.text('·   ' + r.toUpperCase(), {left:px + 48, top:py + 546 + i*52, width:pw - 96, font:'Libre Franklin', weight:600, size:26, cs:30, fill:cream, lh:1.0}));
  DM.chevron(kit, 0, W, 1490, {amp:26, rows:3, sh:20, c1:ink, c2:cream, label:'Piso zigue-zague'});
  kit.text('KITCHEN OPEN UNTIL 02:00', {left:0, top:1628, width:W, font:'Barlow Condensed', weight:600, size:27, cs:240, fill:cream, align:'center', lh:1.0, opacity:0.92});
}}];

/* ---------- Diner · Café Abyssal: "The Pastry Case" ---------- */
MV('menu_diner', 'cafe').pages = [{id:'verso', label:'Verso — The Pastry Case', build: async (kit)=>{
  const W = kit.W, H = kit.H, T = 66;
  const chalk = '#f1eee2', yel = '#ecd98c', pink = '#eea9b7', slate = [34,46,41];
  const halo = {color:'rgba(241,238,226,0.45)', blur:3};
  kit.proc('slate', 0, 0, W, H, {seed:14, opts:{base:slate}, label:'Quadro-negro'});
  kit.proc('frame', 0, 0, W, H, {seed:16, opts:{t:T, base:[122,76,42]}, label:'Moldura de madeira'});
  kit.text('The Pastry Case', {left:0, top:96, width:W, font:'Yellowtail', size:132, fill:chalk, align:'center', lh:1.0, shadow:halo, opacity:0.96});
  kit.text('BAKED ON THE PLATFORM, DAILY', {left:0, top:284, width:W, font:'Barlow Condensed', weight:600, size:34, cs:380, fill:yel, align:'center', lh:1.0, opacity:0.95});
  DM.chalkLine(kit, 190, 352, W - 190, 354, {stroke:chalk, sw:4, seed:21});
  DM.chalkLine(kit, 230, 365, W - 230, 364, {stroke:chalk, sw:2, seed:22, opacity:0.7});
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
  const A = kit.column(colX[0], 410, CW), B = kit.column(colX[1], 410, CW);
  section(A, 'From the case');
  item(A, 'Cherry pie, slice', '4.50', 'with a little cream'); item(A, 'Lemon tart', '4.00'); item(A, 'Chocolate cake', '4.50'); item(A, 'Cinnamon roll', '3.50'); item(A, 'Shortbread', '2.00'); item(A, 'Day-old', '2.00', 'ask at the counter');
  section(B, 'Cold things');
  item(B, 'Iced coffee', '3.50'); item(B, 'Lemonade', '3.00', 'sour, on purpose'); item(B, 'Cold milk', '2.00'); item(B, 'Affogato', '5.50', 'espresso over ice cream');
  // cartão de fidelidade: dez círculos, nove marcados
  const bx = 130, by = 1130, bw = W - 260, bh = 300;
  DM.chalkBox(kit, bx, by, bw, bh, {stroke:chalk, sw:4, seed:6});
  kit.text('Ten coffees, the tenth is on us.', {left:bx, top:by + 26, width:bw, font:'Yellowtail', size:58, fill:yel, align:'center', lh:1.0, shadow:halo});
  for (let i = 0; i < 10; i++){
    const cx = bx + 110 + (i%5)*((bw - 220)/4), cy = by + 170 + Math.floor(i/5)*84;
    kit.circle({left:cx - 28, top:cy - 28, r:28, stroke:chalk, sw:3.5, opacity:0.9, blend:'source-over', label:'Círculo de giz'});
    if (i < 9){
      DM.chalkLine(kit, cx - 15, cy - 15, cx + 15, cy + 15, {stroke:pink, sw:4, seed:30 + i, wob:1});
      DM.chalkLine(kit, cx + 15, cy - 15, cx - 15, cy + 15, {stroke:pink, sw:4, seed:50 + i, wob:1});
    }
  }
  kit.text('Free refill with a smile.', {left:0, top:1500, width:W, font:'Yellowtail', size:56, fill:pink, align:'center', lh:1.0, shadow:{color:'rgba(238,169,183,0.4)', blur:3}});
  kit.text('WIFI:  the-tide-is-low     PASSWORD:  0312', {left:0, top:1620, width:W, font:'Barlow Condensed', weight:600, size:28, cs:260, fill:yel, align:'center', lh:1.0, opacity:0.9});
  kit.proc('erode', T, T, W - 2*T, H - 2*T, {seed:18, opts:{color:slate}, label:'Giz gasto'});
}}];

/* ---------- Fast food · Anchor Basket / Drive-in: cupons ---------- */
function MV_coupons(theme){
  return async (kit)=>{
    const W = kit.W, H = kit.H;
    const C = theme === 'classic'
      ? {bg:'#8e1414', head:'#f2c230', dark:'#2a0d0d', card:'#fff6df', badge:'#c4261d', price:'#c4261d', cream:'#fff6df', accent:'#f2c230'}
      : {bg:'#2b1a12', head:'#e6a12a', dark:'#2b1a12', card:'#f4e4ba', badge:'#d9731a', price:'#c8610f', cream:'#f4e4ba', accent:'#e6a12a'};
    kit.rect({left:0, top:0, width:W, height:H, fill:C.bg, label:'Fundo'});
    kit.rect({left:0, top:0, width:W, height:300, fill:C.head, label:'Faixa do topo'});
    kit.circle({left:70, top:62, r:80, fill:C.cream, stroke:C.dark, sw:7, label:'Mascote — rosto'});
    kit.circle({left:128, top:116, r:9, fill:C.dark, label:'Mascote — olho'});
    kit.circle({left:176, top:116, r:9, fill:C.dark, label:'Mascote — olho'});
    kit.path('M 108 170 Q 151 214 194 170', {left:108, top:170, fill:null, stroke:C.dark, sw:8, join:'round', label:'Mascote — sorriso'});
    kit.text('SAVE ON THE DOCKSIDE', {left:290, top:70, width:900, font:'Anton', size:96, fill:C.dark, cs:20, lh:1.0});
    kit.text('CLIP IT.  SHOW IT.  EAT.', {left:294, top:196, width:880, font:'Oswald', weight:600, size:40, cs:100, fill:C.dark});
    kit.checker(0, 300, W, 40, '#1b110b', C.cream);
    const cps = [['FREE SODA', 'with any basket'], ['FRIES HALF OFF', 'with a Crew Special'], ['KIDS EAT FREE', 'Little Mate Meal with any adult basket'], ['TWO-FOR-ONE SHAKES', 'after 22:00'], ['FREE PIE', 'with a Deep-Sea Basket'], ['FREE REFILL', 'one per person, per shift']];
    cps.forEach(([title, sub], i)=>{
      const x = i%2 ? 625 : 70, y = 392 + Math.floor(i/2)*330;
      kit.rect({left:x, top:y, width:545, height:300, fill:C.card, rx:22, label:'Cupom ' + (i + 1)});
      kit.rect({left:x + 14, top:y + 14, width:517, height:272, stroke:C.badge, sw:4, dash:[16, 10], rx:14, label:'Cupom ' + (i + 1) + ' (tracejado)'});
      kit.text('CLIP', {left:x + 34, top:y + 28, width:200, font:'Oswald', weight:600, size:20, cs:300, fill:C.badge, lh:1.0});
      kit.text(title, {left:x + 34, top:y + 76, width:480, font:'Anton', size:52, fill:C.dark, lh:1.0});
      kit.text(sub, {left:x + 34, top:y + 156, width:480, font:'Source Sans 3', weight:600, size:26, fill:'#5b3d28', lh:1.2});
      kit.text('Valid until 03/14 03:12.  No cash value.', {left:x + 34, top:y + 240, width:480, font:'Source Sans 3', style:'italic', weight:400, size:19, fill:'#6a4a38', lh:1.0});
    });
    kit.text('One coupon per visit. Coupons are not accepted below deck. Management reserves the right to refuse any coupon presented after the shuttle has left.', {left:70, top:1420, width:W-140, font:'Source Sans 3', weight:400, size:18, fill:C.cream, opacity:0.8, lh:1.3});
    kit.rect({left:70, top:1520, width:W-140, height:90, stroke:C.accent, sw:3, label:'Caixa infantil'});
    kit.text('LITTLE MATE CLUB  —  ask at the counter for your card', {left:90, top:1546, width:W-180, font:'Oswald', weight:600, size:29, cs:50, fill:C.accent, align:'center', lh:1.0});
    await kit.smudge(1040, 1040, 58, {color:[60,34,14], opacity:0.55, seed:8, label:'Detalhe — mancha de gordura'});
  };
}
MV('menu_fastfood', 'anchor').pages = [{id:'verso', label:'Verso — Cupons', fonts:["400 20px 'Anton'", "600 20px 'Oswald'", "600 20px 'Source Sans 3'", "italic 400 20px 'Source Sans 3'"], build:MV_coupons('anchor')}];
MV('menu_fastfood', 'dinein').pages = [{id:'verso', label:'Verso — Cupons', fonts:["400 20px 'Anton'", "600 20px 'Oswald'", "600 20px 'Source Sans 3'", "italic 400 20px 'Source Sans 3'"], build:MV_coupons('classic')}];

/* ---------- Fast food · Pizza Deck: "Build your own" ---------- */
MV('menu_fastfood', 'pizza').pages = [{id:'verso', label:'Verso — Build your own', build: async (kit)=>{
  const W = kit.W, H = kit.H, red = '#c4261d', green = '#2a5a35', cream = '#fff6df', dark = '#3a1410';
  const step = 70;
  let dv = '', dh = '';
  for (let x = 0; x < W; x += step*2) dv += `M ${x} 0 L ${x+step} 0 L ${x+step} ${H} L ${x} ${H} Z `;
  for (let y = 0; y < H; y += step*2) dh += `M 0 ${y} L ${W} ${y} L ${W} ${y+step} L 0 ${y+step} Z `;
  kit.path(dv, {left:0, top:0, fill:red, opacity:0.34, label:'Xadrez (vertical)'});
  kit.path(dh, {left:0, top:0, fill:red, opacity:0.34, label:'Xadrez (horizontal)'});
  kit.rect({left:70, top:70, width:W-140, height:230, fill:cream, rx:30, label:'Faixa do título'});
  kit.rect({left:70, top:70, width:W-140, height:230, stroke:red, sw:8, rx:30, label:'Faixa do título (borda)'});
  kit.text('BUILD YOUR OWN', {left:70, top:104, width:W-140, font:'Fredoka', weight:700, size:104, fill:red, align:'center', lh:1.0, cs:20});
  kit.text('every pie starts as cheese and tomato', {left:70, top:226, width:W-140, font:'Source Sans 3', style:'italic', weight:400, size:28, fill:dark, align:'center'});
  kit.rect({left:70, top:340, width:W-140, height:1000, fill:cream, rx:26, label:'Painel da lista'});
  kit.rect({left:70, top:340, width:W-140, height:1000, stroke:red, sw:6, rx:26, label:'Painel da lista (borda)'});
  const sec = (c, title)=>{ c.text(title, {font:'Fredoka', weight:700, size:40, fill:red, lh:1.0, gap:6}); c.rule({stroke:red, sw:3, after:12}); };
  const row = (c, name, price)=>{ const y = kit.menuRow(name, price, c.left, c.y, 490, {font:'Fredoka', size:30, weight:500, fill:dark, pfont:'Anton', psize:32, pweight:400, pfill:red, dotColor:dark, dotOpacity:0.5}); c.y = y + 12; };
  const A = kit.column(120, 376, 490), B = kit.column(650, 376, 490);
  sec(A, 'CRUST'); row(A, 'Thin', '0.00'); row(A, 'Deck (thick)', '2.00'); row(A, 'Gluten-free', '3.00');
  A.gap(24); sec(A, 'SAUCE'); row(A, 'Tomato', '0.00'); row(A, 'White garlic', '1.00'); row(A, 'Hot oil', '1.00');
  A.gap(24); sec(A, 'CHEESE'); row(A, 'Mozzarella', '0.00'); row(A, 'Extra mozzarella', '2.00'); row(A, 'Gorgonzola', '2.50');
  sec(B, 'TOPPINGS  ·  1.50 EACH'); ['Pepperoni', 'Anchovy', 'Black olive', 'Mushroom', 'Onion', 'Pepper', 'Sausage', 'Capers'].forEach(t=>row(B, t, '1.50'));
  B.gap(24); sec(B, 'SIZES'); row(B, 'Small, 8 in', '—'); row(B, 'Medium, 12 in', '—'); row(B, 'Large, 16 in', '—');
  kit.rect({left:70, top:1380, width:W-140, height:240, fill:red, rx:26, label:'Faixa de avisos'});
  kit.text('WHOLE PIES ONLY AFTER MIDNIGHT', {left:110, top:1414, width:W-220, font:'Anton', size:48, fill:cream, lh:1.0, blend:'source-over', cs:40});
  kit.text('Delivery to the dining deck only.\nOrders taken until the oven goes out.\nThe oven has not gone out since opening.', {left:110, top:1486, width:W-220, font:'Source Sans 3', style:'italic', weight:600, size:26, fill:cream, blend:'source-over', lh:1.35});
  await kit.smudge(1050, 1180, 50, {color:[120,40,16], opacity:0.5, seed:13, label:'Detalhe — mancha de gordura'});
}}];
