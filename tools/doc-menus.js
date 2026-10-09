/* ===================== Cardápios =====================
   Âncoras: Twin Peaks (fine dining = timbre do Great Northern; diner = Double R) e Silent Hill 3
   (fast food = Happy Burger). Fichas em tools/DOCS_DESIGN_NOTES.md. Registrados em doc-templates.js (registerDoc). */
const TP = {red:'#a8302a', green:'#2f4a35', brown:'#6b5a3e', ink:'#1d1a16'};

/* ---------- Fine dining: "Executive Service" ---------- */
registerDoc('menu_fine', {
  label:'Cardápio — fine dining', page:A4.page, phys:A4.phys,
  paper:{type:'cartao', level:0.18, atmos:'twin', fold:'nenhuma'},
  fonts:["500 20px 'Cormorant Garamond'", "italic 500 20px 'Cormorant Garamond'", "italic 400 20px 'Cormorant Garamond'", "600 20px 'Jost'", "500 20px 'Jost'"].concat(typeof EM_FONTS !== 'undefined' ? EM_FONTS : []),
  build: async (kit)=>{
    const W = kit.W, cx = W/2, red = TP.red;
    kit.rect({left:58, top:58, width:W-116, height:1638, stroke:red, sw:2.4, label:'Moldura externa'});
    kit.rect({left:74, top:74, width:W-148, height:1606, stroke:red, sw:1, label:'Moldura interna'});
    [[74,74],[W-74,74],[74,1680],[W-74,1680]].forEach(([x,y])=>kit.circle({left:x-5, top:y-5, r:5, fill:red, label:'Canto'}));

    // timbre: o emblema da plataforma de cada lado do nome
    kit.emblem('plataforma', 'tinta', 316, 112, 100, {color:red, label:'Emblema — timbre'});
    kit.emblem('plataforma', 'tinta', 824, 112, 100, {color:red, label:'Emblema — timbre'});
    const head = kit.column(cx-180, 118, 360, {font:'Jost', weight:600, size:20, cs:300, fill:red, align:'center', lh:1.35});
    head.text('THE EXECUTIVE'); head.text('DINING ROOM'); head.text('PLATFORM DESERTO', {size:15, cs:420, fill:TP.brown});
    kit.line(cx-70, 252, cx+70, 252, {stroke:red, sw:1.6, label:'Filete do timbre'});

    kit.text('Evening Service', {left:0, top:278, width:W, font:'Cormorant Garamond', style:'italic', weight:500, size:84, align:'center', lh:1.0});
    kit.text("PRIX FIXE  ·  SEVEN O'CLOCK", {left:0, top:392, width:W, font:'Jost', weight:500, size:17, cs:340, fill:TP.brown, align:'center'});

    // cinco tempos, mas só quatro números (falta o IV)
    const courses = [
      ['I',   'TO BEGIN',     'Smoked roe, crème fraîche, rye crisp'],
      ['II',  'SOUP',         'Chilled cucumber, dill oil, cold-water prawn'],
      ['III', 'FROM THE SEA', 'Pan-seared cod, brown butter, sea lettuce'],
      ['V',   'TO FINISH',    'Cherry pie, whipped cream, black coffee'],
    ];
    const col = kit.column(190, 462, W-380, {align:'center'});
    courses.forEach(([n, label, dish])=>{
      col.text(n, {font:'Cormorant Garamond', weight:500, size:34, fill:red, cs:120, gap:2});
      col.text(label, {font:'Jost', weight:600, size:16, cs:340, fill:TP.brown, gap:10});
      col.text(dish, {font:'Cormorant Garamond', style:'italic', weight:500, size:35, lh:1.12, gap:54});
    });
    col.text('Course IV is served at the discretion of the kitchen.', {font:'Cormorant Garamond', style:'italic', weight:400, size:23, fill:TP.brown});

    // adega
    const wy = 1286;
    kit.text('THE CELLAR', {left:0, top:wy, width:W, font:'Jost', weight:600, size:16, cs:400, fill:red, align:'center'});
    kit.line(330, wy+12, 520, wy+12, {stroke:red, sw:1, label:'Filete'}); kit.line(720, wy+12, 910, wy+12, {stroke:red, sw:1, label:'Filete'});
    const lists = [
      [190, 'WHITE', [['Chablis Premier Cru · 2019','62'], ['Riesling Kabinett · 2021','48'], ['Sancerre · 2020','54']]],
      [650, 'RED',   [['Pinot Noir, Willamette · 2018','74'], ['Bordeaux Supérieur · 2016','68'], ['House Red','38']]],
    ];
    lists.forEach(([x, label, rows])=>{
      kit.text(label, {left:x, top:wy+52, width:400, font:'Jost', weight:600, size:14, cs:340, fill:TP.brown});
      let y = wy+86;
      rows.forEach(([name, price])=>{ y = kit.menuRow(name, price, x, y, 400, {font:'Cormorant Garamond', size:25, weight:500, fill:TP.ink, pfont:'Jost', psize:18, pweight:500, dots:false, pdy:4}) + 12; });
    });
    kit.text('Reserve, 1953 — by request', {left:0, top:1506, width:W, font:'Cormorant Garamond', style:'italic', weight:400, size:23, fill:TP.brown, align:'center'});

    kit.text('340 PER GUEST', {left:0, top:1552, width:W, font:'Jost', weight:600, size:20, cs:320, align:'center'});
    kit.text('Service concludes when the last guest has finished.', {left:0, top:1596, width:W, font:'Cormorant Garamond', style:'italic', weight:500, size:25, fill:TP.brown, align:'center'});
    kit.zigzag(330, 910, 1654, {amp:5, step:14, stroke:TP.ink, sw:1.4, opacity:0.4, label:'Zigue-zague (fio)'});

    await kit.cupRing(168, 1596, 70, {color:[110,24,34], opacity:0.62, seed:7, angle:0, label:'Detalhe — anel de vinho'});
  },
});

/* ---------- Bar / lanchonete: "The Galley" ---------- */
registerDoc('menu_diner', {
  label:'Cardápio — bar/lanchonete', page:A4.page, phys:A4.phys,
  paper:{type:'cartao', level:0.12, atmos:'twin', fold:'nenhuma'},
  fonts:["400 20px 'Yellowtail'", "400 20px 'Alfa Slab One'", "500 20px 'Oswald'", "600 20px 'Source Sans 3'", "700 20px 'Source Sans 3'", "italic 400 20px 'Source Sans 3'"],
  build: async (kit)=>{
    const W = kit.W, red = TP.red, green = TP.green, ink = '#231a14', warm = '#5b4a3a';
    kit.rect({left:50, top:50, width:W-100, height:1654, stroke:red, sw:5, label:'Moldura'});
    kit.rect({left:64, top:64, width:W-128, height:1626, stroke:red, sw:1.6, label:'Moldura interna'});

    // logo em oval, no estilo do "RR" do Double R
    kit.ellipse({left:100, top:100, rx:108, ry:88, stroke:red, sw:7, label:'Logo — oval'});
    kit.ellipse({left:110, top:110, rx:98, ry:78, stroke:red, sw:2, label:'Logo — oval interno'});
    kit.text('G', {left:104, top:118, width:208, font:'Yellowtail', size:118, fill:red, align:'center', lh:1.0, label:'Logo — G'});
    kit.text('The Galley', {left:340, top:92, width:820, font:'Yellowtail', size:160, fill:red, lh:1.0});
    kit.text('COFFEE SHOP & LUNCH COUNTER', {left:346, top:272, width:800, font:'Oswald', weight:500, size:30, cs:180, fill:green});
    kit.text('Platform Deserto · Mess Deck · Open all hours', {left:346, top:318, width:800, font:'Source Sans 3', style:'italic', weight:400, size:22, fill:warm});
    kit.zigzag(64, W-64, 380, {amp:11, step:26, stroke:ink, sw:4, label:'Zigue-zague (Red Room)'});

    const LX = 104, RX = 646, CW = 490;
    const section = (c, title)=>{
      c.text(title, {font:'Alfa Slab One', size:34, fill:red, cs:60, gap:4});
      c.rule({stroke:red, sw:2.4, after:3}); c.rule({stroke:red, sw:1, after:14});
    };
    const row = (c, name, price, desc)=>{
      const y = kit.menuRow(name, price, c.left, c.y, CW, {font:'Source Sans 3', size:26, weight:600, fill:ink, pfont:'Alfa Slab One', psize:24, pweight:400, pfill:red, pdy:1, dotColor:ink});
      c.y = y + 2;
      if (desc) c.text(desc, {font:'Source Sans 3', style:'italic', weight:400, size:19, fill:warm, gap:4});
      c.y += 12;
    };
    const L = kit.column(LX, 440, CW), R = kit.column(RX, 440, CW);
    section(L, 'BREAKFAST');
    row(L, 'Two eggs, any style, toast', '3.50'); row(L, 'Hotcakes, three high', '3.25'); row(L, 'Oatmeal, brown sugar', '1.75');
    L.gap(34);
    section(L, 'ON THE SIDE');
    row(L, 'Hash browns', '1.25'); row(L, 'Bacon, three strips', '1.50'); row(L, 'Toast, buttered', '0.75');
    L.gap(34);
    section(L, 'SWEETS');
    row(L, 'Cherry pie, a slice', '2.50', 'Baked on the platform, daily.'); row(L, 'Doughnut', '0.75'); row(L, 'Fruit cup', '2.00');
    section(R, 'SANDWICHES');
    row(R, 'Grilled cheese', '3.00'); row(R, 'Tuna salad on white', '3.00'); row(R, 'Chili (Mon / Thu)', '4.00');
    row(R, 'Soup of the day', '—', 'Ask your supervisor.'); row(R, 'Crackers', '0.00'); row(R, 'Earplugs (see supply locker)', '0.00');
    R.gap(34);
    section(R, 'DRINKS');
    row(R, 'Coffee — hot, black, bottomless', '0.00'); row(R, 'Hot chocolate', '1.50'); row(R, 'Milk shake', '2.25');

    // especial do dia
    const sy = Math.max(L.y, R.y) + 40;
    kit.line(104, sy, W-104, sy, {stroke:ink, sw:2, dash:[2,8], cap:'round', label:'Separador'});
    const scx = 285, scy = sy + 190;
    kit.star(scx, scy, 160, 132, 16, {fill:red, label:'Selo — especial do dia'});
    kit.text("TODAY'S", {left:scx-150, top:scy-60, width:300, font:'Alfa Slab One', size:38, fill:'#f3e9d2', align:'center', lh:1.0});
    kit.text('SPECIAL', {left:scx-150, top:scy-12, width:300, font:'Alfa Slab One', size:38, fill:'#f3e9d2', align:'center', lh:1.0});
    const S = kit.column(510, sy + 60, 630);
    S.text('Chili con carne', {font:'Alfa Slab One', size:46, fill:ink, lh:1.0, gap:6});
    S.text('with cornbread and a mug of coffee', {font:'Source Sans 3', style:'italic', weight:400, size:26, fill:warm, gap:14});
    S.y = kit.menuRow('Today only', '4.00', 510, S.y, 626, {font:'Source Sans 3', size:26, weight:700, fill:ink, pfont:'Alfa Slab One', psize:30, pweight:400, pfill:red, dotColor:ink}) + 24;
    kit.text('Meatloaf, mashed potatoes', {left:510, top:S.y, width:626, font:'Source Sans 3', weight:600, size:24, fill:'#7d746b', strike:true, lh:1.05, label:'Item riscado'});
    kit.text("86'd", {left:510, top:S.y + 36, width:300, font:'Source Sans 3', style:'italic', weight:400, size:19, fill:warm});

    // rodapé
    const fy = 1512;
    kit.line(104, fy, W-104, fy, {stroke:red, sw:2, label:'Filete do rodapé'});
    kit.text('OPEN 24 HOURS  —  CLOSED 03:00–03:12 FOR CLEANING', {left:104, top:fy+22, width:W-208, font:'Oswald', weight:500, size:24, cs:120, fill:green, align:'center'});
    kit.text('Comment card box located outside galley. Messages regarding noise complaints should be directed to supervision directly, not posted here.', {left:150, top:fy+68, width:W-300, font:'Source Sans 3', style:'italic', weight:400, size:19, fill:warm, align:'center', lh:1.3});

    await kit.cupRing(1030, 1425, 78, {color:[112,66,28], opacity:0.62, seed:3, label:'Detalhe — anel de café'});
  },
});

/* ---------- Fast food: "Anchor Basket" (Happy Burger, Silent Hill 3) ---------- */
registerDoc('menu_fastfood', {
  label:'Cardápio — fast food', page:A4.page, phys:A4.phys,
  paper:{type:'liso', level:0.1, atmos:'silent', fold:'nenhuma'},
  fonts:["400 20px 'Anton'", "600 20px 'Oswald'", "600 20px 'Source Sans 3'", "400 20px 'Source Sans 3'", "700 20px 'Source Sans 3'"],
  build: async (kit, ctx)=>{
    const W = kit.W, H = kit.H;
    const C = (ctx && ctx.theme === 'classic')
      ? {bg:'#8e1414', head:'#f2c230', dark:'#2a0d0d', card:'#fff6df', badge:'#c4261d', price:'#c4261d', cream:'#fff6df', accent:'#f2c230'}
      : {bg:'#2b1a12', head:'#e6a12a', dark:'#2b1a12', card:'#f4e4ba', badge:'#d9731a', price:'#c8610f', cream:'#f4e4ba', accent:'#e6a12a'};
    kit.rect({left:0, top:0, width:W, height:H, fill:C.bg, label:'Fundo'});
    kit.rect({left:0, top:0, width:W, height:370, fill:C.head, label:'Faixa do topo'});

    // mascote
    kit.circle({left:70, top:80, r:105, fill:C.cream, stroke:C.dark, sw:8, label:'Mascote — rosto'});
    kit.circle({left:164, top:150, r:11, fill:C.dark, label:'Mascote — olho'});
    kit.circle({left:228, top:150, r:11, fill:C.dark, label:'Mascote — olho'});
    kit.path('M 128 215 Q 175 268 222 215', {left:128, top:215, fill:null, stroke:C.dark, sw:10, join:'round', label:'Mascote — sorriso'});
    kit.text('ANCHOR BASKET', {left:330, top:64, width:880, font:'Anton', size:134, fill:C.dark, cs:20, lh:1.0});
    kit.text('DOCKSIDE LOCATION — OPEN 24H', {left:334, top:236, width:860, font:'Oswald', weight:600, size:38, cs:100, fill:C.dark});
    kit.rect({left:334, top:296, width:540, height:50, fill:C.badge, label:'Etiqueta NEW'});
    kit.text('NEW! DEEP-SEA PLATFORM BASKET', {left:334, top:306, width:540, font:'Oswald', weight:600, size:27, cs:60, fill:C.cream, align:'center', lh:1.0});
    kit.checker(0, 370, W, 40, '#1b110b', C.cream);

    const combos = [
      ['1', 'CAPTAIN COMBO',   'Fish basket, fries, soda',        '9.99'],
      ['2', 'DOUBLE ANCHOR',   'Double burger, fries, soda',      '11.49'],
      ['3', 'CREW SPECIAL',    'Chicken tenders, fries, soda',    '8.99'],
      ['4', 'DEEP-SEA BASKET', 'Catch of the day, fries, slaw',   '12.49'],
    ];
    for (let i = 0; i < combos.length; i++){
      const [num, name, desc, price] = combos[i];
      const x = i%2 ? 625 : 70, y = i < 2 ? 450 : 810;
      kit.rect({left:x, top:y, width:545, height:330, fill:C.card, rx:22, label:'Cartão '+num});
      kit.circle({left:x+30, top:y+26, r:50, fill:C.badge, label:'Número '+num});
      kit.text(num, {left:x+30, top:y+26+18, width:100, font:'Anton', size:68, fill:C.cream, align:'center', lh:1.0});
      const col = kit.column(x+30, y+140, 280);
      col.text(name, {font:'Anton', size:38, fill:C.dark, lh:1.0, gap:8});
      col.text(desc, {font:'Source Sans 3', weight:600, size:22, fill:'#5b3d28', lh:1.2});
      kit.text(price, {left:x+30, top:y+250, width:280, font:'Anton', size:62, fill:C.price, lh:1.0});
      await kit.photo(x+318, y+30, 200, 270, {rx:14, seed:i+3, label:'Foto — '+name});
    }

    // quadro de baixo
    kit.text('ALSO ON THE BOARD', {left:70, top:1180, width:1100, font:'Oswald', weight:600, size:38, cs:80, fill:C.accent, lh:1.0});
    kit.line(70, 1236, W-70, 1236, {stroke:C.accent, sw:3, label:'Filete'});
    const board = [
      [70,  [['5','Fish sandwich','5.49'], ['6','Chicken sandwich','5.99'], ['7','Veggie burger','5.49'], ['8','Chili bowl','3.99'], ['9','Onion rings','2.99']]],
      [640, [['10','Large fries','2.49'], ['11','Slaw','1.99'], ['12','Shake, any flavor','3.29'], ['14','Pie of the day','2.49']]],
    ];
    board.forEach(([x, rows])=>{
      rows.forEach(([n, name, price], i)=>{
        const y = 1256 + i*46;
        kit.text(n, {left:x, top:y-2, width:52, font:'Anton', size:30, fill:C.accent, lh:1.0});
        kit.menuRow(name, price, x+56, y, 474, {font:'Source Sans 3', size:26, weight:600, fill:C.cream, pfont:'Source Sans 3', pweight:700, dotColor:C.cream, dotOpacity:0.5});
      });
    });
    kit.rect({left:70, top:1510, width:W-140, height:90, stroke:C.accent, sw:3, label:'Caixa infantil'});
    kit.text('LITTLE MATE MEAL  —  any basket, half size, toy included  —  5.99', {left:90, top:1536, width:W-180, font:'Oswald', weight:600, size:29, cs:50, fill:C.accent, align:'center', lh:1.0});
    kit.text('** Shuttle to platform departs 0600 sharp. Missing the shuttle is not grounds for reimbursement. Catch of the day: whatever the platform pulls up. Prices subject to the tide.', {left:70, top:1632, width:W-140, font:'Source Sans 3', weight:400, size:16, fill:C.cream, opacity:0.78, lh:1.3});

    await kit.smudge(1070, 1090, 62, {color:[60,34,14], opacity:0.6, seed:5, label:'Detalhe — mancha de gordura'});
  },
});
