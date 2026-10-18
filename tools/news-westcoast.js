/* ===================== Westcoast Post (f3-05) =====================
   Jornal em inglês das ilhas a oeste de Bergen (edição de quinta-feira, 18 de outubro; volume LXVIII = 2029 − 1961), no MESMO formato do
   The Abyssal Post: o mesmo motor (news-engine.js), a mesma grade, as mesmas fontes e o mesmo papel; só o título e os textos mudam.
   Três páginas prontas, cada uma com composição PRÓPRIA (nenhuma repete um layout do Abyssal; mesma cara: título, fontes, papel e frames).
   O texto padrão é o que o Max mandou; tudo é editável:
     A4 — faixa de três matérias no alto, matéria principal no meio (foto alta e citação à esquerda), faixa de serviço e anúncios na base;
     A5 — anúncios locais em PIRÂMIDE (três pilhas, anúncio grande na base), com o aviso público e a caixa "Honoring its legacy" no alto;
     A6 — título em painel preto, linha do tempo HORIZONTAL (novo módulo NewsBox rows:'ribbon'), texto em 2 colunas, foto e citação.
   Vive DENTRO do modelo Jornal (painel "Layout do jornal" e "Tipo da nova página"); o modelo 'westcoast' da primeira versão continua registrado
   (fora do menu) só pra abrir documentos salvos com ele. */

const WC_DEFAULTS = {
  /* ---- cabeçalho e rodapé do jornal ---- */
  'mast.name': 'Westcoast Post',
  'mast.tag': 'The English-language weekly of the western islands, since 1961',
  'ear.l:title': 'WEATHER', 'ear.l': 'Showers, 8°\nWind rising Monday\nStorm on Tuesday',
  'ear.r:title': 'ONE COPY', 'ear.r': 'NOK 35\nVol. LXVIII, No. 42\nThursday edition',
  'folio.l': 'THURSDAY, OCTOBER 18', 'folio.c': 'PUBLISHED WEEKLY FOR SOTRA, ØYGARDEN AND THE OUTER ISLANDS', 'folio.r': 'VOL. LXVIII · NO. 42',
  'foot.l': 'WESTCOAST POST  ·  OCTOBER 18', 'foot.r': 'A1',
  'ih.l': 'THURSDAY, OCTOBER 18', 'ih.r': 'A5',

  /* ---- A4 ---- */
  'lead.kicker': 'RONG', 'lead.headline': 'A life in 213 lots',
  'lead.deck': 'A Rong fisherman died with no heirs. The court’s administrator sells everything he owned next Saturday', 'lead.byline': 'By Torunn Hjelle',
  'lead.body': 'Johannes Kleppe fished from Rong for forty-four years, ran the small ferry to the outer islands for twelve more, and died in his house in August at the age of 91. He had no wife, children, siblings or cousins that anyone could find. Next Saturday the contents of the house go under the hammer in the community hall at Rong, 213 lots, starting at 11:00.\n' +
    'When nobody inherits, the district court appoints a lawyer to settle the estate. Marianne Leirvåg searched the population register and the church books for relatives and found none. After debts and costs, the money from the sale goes to charities for children and young people, as the law requires.\n' +
    'The catalogue reads like an inventory of a quiet life. There are twenty glass floats from fishing nets, the lots collectors ask about first. A shelf in the hall holds 41 pairs of reading glasses, no two alike. A kitchen drawer contains 83 keys that open nothing in the house, and the auctioneer will sell them by weight. A brass barometer hangs on the kitchen wall with the needle on “Change”.\n' +
    'Five boxes hold group photographs of the kind taken at christenings, funerals and the quay at the end of a season. None has a caption. Neighbours who came to look at the catalogue could name about half the faces.\n' +
    'The lawyer found one item she will not sell, a cigar box with nineteen letters, all written and none posted, addressed to the same woman at an address in Bergen. “These belong to him and to the woman he wrote to,” Leirvåg said. “I will not put them in a sale.” They go to the local history society with his other papers.\n' +
    '“He mended half the outboards on Rong and never sent a bill,” said a neighbour of thirty years. “We never saw the inside of the house.”\n' +
    '“In a house like this about a third of the lots usually go unsold,” Leirvåg said. “What nobody bids on goes to the second-hand shop.”\n' +
    'The viewing is open next Friday from 17:00 to 19:00. The catalogue is available at the community hall and from the administrator’s office.',
  'photo.1.cap': 'Lot 118: 41 pairs of reading glasses on the viewing table at the community hall in Rong. They stood on one shelf in the hall.',
  'pq': '“These belong to him and to the woman he wrote to.”\n— Marianne Leirvåg, estate administrator',
  'photo.2.cap': 'Crowds on the hill above Kolltveit on 13 April, waiting for Apophis. Most saw only cloud.',
  's4.kicker': 'SCIENCE · NTB', 's4.headline': 'Apophis was changed by its visit',
  's4.body': 'Six months after the asteroid Apophis passed closer to Earth than many satellites, scientists say the encounter left marks on it.\n' +
    'The 340-metre asteroid passed within about 32,000 kilometres of Earth on 13 April, the closest approach of an object that size in recorded history. A spacecraft studying it since has found that its spin changed and that loose rock appears to have slid across its surface during the pass.\n' +
    '“Earth pulled on it like a tide,” one researcher said. “We predicted it. Seeing it is another thing.”\n' +
    'Apophis is named after Apep, the Egyptian serpent of chaos that tried every night to swallow the sun. Early calculations in 2004 gave it a small chance of hitting Earth this year. That was later ruled out for at least a century.',
  's2.headline': 'Fields warned of satellite outages in storm', 's2.byline': 'Staff',
  's2.body': 'Platforms that have relied on satellite since the cable failure should expect interruptions during next week’s storm, the provider has warned.\n' +
    'Heavy rain and dense cloud weaken satellite signals, an effect engineers call rain fade. Strong wind can also push the antennas out of alignment. The provider said customers should be ready for periods with no connection at all, from minutes to several hours.\n' +
    'The operators said safety communications do not depend on the link. Every platform keeps VHF, MF and HF radio for contact with ships, the coast radio station and the rescue centre at Sola.\n' +
    'Phone calls home, email and video consultations with doctors on shore do depend on it.\n' +
    '“Tell your family before Monday that they may not hear from you for a while,” one platform worker told the Post at the base gate. “Last winter we had four days with nothing.”',
  's3.headline': 'Mackerel talks resume with fishermen watching', 's3.byline': 'By Torunn Hjelle',
  's3.body': 'Negotiators from Norway, the United Kingdom, the EU, the Faroe Islands, Iceland and Greenland meet in London on Tuesday to try again to agree how next year’s mackerel catch should be shared.\n' +
    'The coastal states have failed for most of the past two decades to agree, and each sets its own quota. Scientists have again advised a cut, warning that the combined catch has been above their advice for years.\n' +
    'Small-boat fishermen say the fight in London matters less to them than what happens to the Norwegian share at home. Fri Fisk wants more of it for the coastal fleet and less for the large trawlers.\n' +
    'Fri Fisk said earlier in the week that it would send someone to London to stand outside the talks, as it did last year.',
  'brief:title': 'IN BRIEF',
  'brief': 'Power. BKK has crews on standby for the outer islands from Monday.\nFerry. The Fedje ferry may be cancelled at short notice Tuesday and Wednesday.\nBase. The base gate closes at 22:00 during the storm.\nBus. Night bus to Ågotnes cancelled Tuesday.',
  'index:title': 'THE WEEK AHEAD', 'index': 'Sun 21|showers, 8°\nMon 22|wind rising, 9°\nTue 23|storm, 8°\nWed 24|storm, 7°\nThu 25|gale easing, 6°',
  'tide:title': 'FEDJE FERRY', 'tide': 'Weekdays|06:10 · 09:40 · 15:20\nSaturday|08:30 · 14:00\nSunday|11:00 · 17:30\nTue–Wed|check before travel',
  'ad.2:title': 'WANTED', 'ad.2': 'Old fishing gear, glass floats, anything from before 1990. Also unusual finds from the sea. Box 207.',
  'ad.3:title': 'FOR SALE', 'ad.3': 'Four winter tyres on rims, 205/55 R16. NOK 2,000.',
  'ad.1:title': 'TO LET', 'ad.1': 'Boathouse with slipway, Hjelme. Winter storage. Call evenings.',

  /* ---- A5 ---- */
  'a5.band': 'LOCAL ADVERTISING',
  'adb.1:title': 'STRAUME PHARMACY', 'adb.1': 'Open Monday to Saturday, 09:00 to 18:00. Vitamin D, cod liver oil and daylight lamps for the dark months. Free blood pressure check on Thursdays. Prescriptions ready the same day if ordered before 14:00.',
  'adb.2:title': 'ÅGOTNES DENTAL CLINIC', 'adb.2': 'New patients welcome. Evening appointments on Tuesdays and Thursdays. Emergency line for toothache, tel. 56 00 12 34.',
  'adb.3:title': 'SOTRA AUTO & TYRES', 'adb.3': 'Winter tyre change from NOK 450, studded or non-studded. Book before the first frost. Courtesy car for base workers. Open 07:00 to 17:00, Saturdays until 14:00.',
  'adm.1:title': 'SOTRA ROWING CLUB', 'adm.1': 'Winter training in the boathouse, Tuesdays and Thursdays at 18:30. Rowing machines and a coach for beginners. The first month is free.',
  'adm.2:title': 'ADULT SWIMMING COURSE', 'adm.2': 'Hjelme pool, Mondays at 19:00. For adults who never learned. Instructors from the Sea Rescue Society. A few places left.',
  'adm.3:title': 'STRAUME CINEMA', 'adm.3': 'Saturday 16:00 family adventure, Saturday 20:00 Nordic thriller, Sunday matinee 14:00. Popcorn and waffles.',
  'adm.4:title': 'KOLLTVEIT LIBRARY CHESS CLUB', 'adm.4': 'Every second Wednesday at 18:00. All levels welcome. Boards provided, coffee on the house.',
  'ads.1:title': 'ÅGOTNES BAKERY', 'ads.1': 'Bread, rolls and cinnamon buns daily from 06:00. Waffles on Sundays. Order your Saturday cake by Thursday.',
  'ads.2:title': 'FJELL GROCER', 'ads.2': 'Winter stock is in: lamp oil, candles, batteries and tinned food. Local lamb and smoked fish. Open 08:00 to 20:00.',
  'ads.3:title': 'RONG FIREWOOD', 'ads.3': 'Dry birch and pine, delivered on the islands. 60-litre bags and trailer loads. Order before the storm.',
  'ads.4:title': 'SOTRA ELECTRIC', 'ads.4': 'Fuse boxes, heating cables, generators and emergency lighting. Free quotes. Call-out service on the islands at any hour.',
  'pn:title': 'PUBLIC NOTICE', 'pn': 'ØYGARDEN MUNICIPALITY — The zoning plan for the new quay at Ågotnes is open for comments. Documents at the library and online. Comments by 15 November.',
  'lg:title': 'HONORING ITS LEGACY', 'lg': 'NORDSJO-POSTEN, 1932 TO 2016 — The Westcoast Post began in 1961 as the English weekend supplement of Nordsjo-Posten and keeps its archive. The collection is open to the public at Straume library, Monday to Saturday.',

  /* ---- A6 ---- */
  'w6.band': 'WORLD',
  'w6.kicker': 'SPECIAL REPORT', 'w6.headline': 'Navy investigates cut cable west of the islands',
  'w6.deck': 'The third damaged cable in northern European waters this year. “We have not ruled anything out”', 'w6.byline': 'By Dag Erik Tveit',
  'photo.6.cap': 'The cable repair vessel waits in Bergen for the weather to turn. Repairs are unlikely before November. Photo: Westcoast Post',
  'w6.body': 'The Navy and the Coast Guard are investigating damage to a subsea fibre cable about seventy kilometres west of the islands, which cut data links to several platforms in the outer fields last week.\n' +
    'The cable carries traffic between the Vestland coast, the fields and the United Kingdom. It failed in the early hours of Thursday 11 October. The operator said the fault lies in deep water near the edge of the shelf, about 800 metres down. Most commercial traffic was rerouted within six hours. Platforms that depended on the cable switched to satellite.\n' +
    'It is the third cable incident in northern European waters this year and the second in the North Sea. Since the first Baltic cases in 2022 and 2023, governments around the sea have treated every break as a possible attack until shown otherwise. Most have turned out to be dragged anchors. A few have never been explained.\n' +
    'A spokesman for the Joint Headquarters said the Navy is examining ship traffic in the days before the failure, including vessels that had switched off their position transponders. “We are looking at every possibility, from an anchor dragged in bad weather to something on the seabed we don’t yet understand,” he said. “We have not ruled anything out.”\n' +
    'Allied navies have raised their patrols over the main cable routes in the North Sea since the second incident in June. The Ministry of Justice said it is too early to say whether the damage was deliberate and that the government is in contact with the countries concerned.\n' +
    'The operator said the cable is old and lies close to steep ground, where the seabed has shifted before. It has asked the shipping registers for every vessel within fifty kilometres of the fault between Monday and Thursday and has received 23 answers so far.\n' +
    'A repair vessel was due at the site this week but has been held in port by the forecast. The operator does not expect work to start before November, and the first storm of the season arrives on Tuesday.\n' +
    'Platforms in the outer fields now depend on satellite links, which the provider has warned may fail in the storm. See A4.',
  'tl:title': 'CABLES AND PIPELINES, YEAR BY YEAR',
  'tl': '2022|Nord Stream pipelines damaged by explosions in the Baltic\n2023|Gas pipeline and data cable between Finland and Estonia damaged by an anchor\n2024|Two Baltic data cables cut within a day, a ship shadowed for weeks\nDec 2024|Power cable between Finland and Estonia damaged, a tanker seized\nFeb 2029|Baltic data cable damaged off Gotland\nJun 2029|North Sea cable damaged off Denmark\nOct 2029|Cable west of the islands fails',
  'pq6': '“Something on the seabed we don’t yet understand. We have not ruled anything out.”\n— Navy spokesman',
  'nums6:title': 'BY THE NUMBERS',
  'nums6': 'Distance from the coast|70 km\nDepth at the fault|800 m\nHours to reroute traffic|6\nPlatforms on satellite|11\nShips traced in the area|23\nEarliest repair|November',
  'wb.1:title': 'SEABED', 'wb.1': 'The government opens a new round of licences for seabed minerals in the Norwegian Sea. Environmental groups say they will go to court.',
  'wb.2:title': 'BARENTS', 'wb.2': 'Norway and Russia close the Barents Sea quotas weeks late. The Russian fleet refuses inspection at sea, and the Fisheries Directorate calls it a procedural matter.',
  'wb.3:title': 'GAS', 'wb.3': 'A fault at the Kollsnes gas plant west of Bergen cuts exports by a fifth for two days and pushes European gas prices up six percent.',
};

const WC_PRESETS = {
  /* A4 — composição própria (não repete a capa clássica): faixa de três matérias no alto, matéria principal no meio com a foto alta
     e a citação à esquerda, e uma faixa de serviço (breves, a semana, a balsa) e três anúncios na base. */
  wc_a4: {label:'A4 — Faixa de três e matéria principal', build: async (B)=>{
    const T = B.headerLabeled('A4'), BT = NEWS_G.BOTTOM, LX = newsX(0), FW = NEWS_G.W, G = NEWS_G.GUT;
    // base: três anúncios e, acima deles, a faixa de serviço, tudo com a mesma altura
    const adsTop = newsBottomRow(B, [{role:'ad.2', x:newsX(0), w:newsW(2)}, {role:'ad.3', x:newsX(2), w:newsW(2)}, {role:'ad.1', x:newsX(4), w:newsW(2)}], BT, NEWS_AD);
    const svc = [
      B.txt('brief', newsX(0), 0, newsW(2), {frame:'box', title:true, size:13.8, lh:1.3}).obj,
      B.txt('index', newsX(2), 0, newsW(2), {frame:'bar', title:true, rows:true, size:14.5, lh:1.45}).obj,
      B.txt('tide', newsX(4), 0, newsW(2), {frame:'box', title:true, rows:true, size:14.5, lh:1.45}).obj,
    ];
    const sH = Math.max(...svc.map(o=>o.height)), svcTop = adsTop - 16 - sH;
    svc.forEach(o=>{ o.set('minH', sH); o.set('top', svcTop); o.setCoords(); });
    // faixa de cima: três matérias lado a lado (a terceira abre com a foto)
    const stripBot = T + 500;
    let a = B.head('s2', newsX(0), T, newsW(2), {size:24, rule:false}); B.flow('s2.body', newsX(0), a, newsW(2), {size:15.5, bottom:stripBot, minSize:12.5});
    let b = B.head('s3', newsX(2), T, newsW(2), {size:24, rule:false}); B.flow('s3.body', newsX(2), b, newsW(2), {size:15.5, bottom:stripBot, minSize:12.5});
    let c = await B.photo('photo.2', newsX(4), T, newsW(2), 140, {variant:1});
    c = B.head('s4', newsX(4), c, newsW(2), {size:22, rule:false}); B.flow('s4.body', newsX(4), c, newsW(2), {size:15.5, bottom:stripBot, minSize:12.5});
    B.vline(newsX(2) - G/2, T, stripBot); B.vline(newsX(4) - G/2, T, stripBot);
    // meio: título e texto em 4 colunas, foto alta e citação à esquerda
    const midTop = stripBot + 16;
    B.rule(LX, midTop - 7, LX + FW, midTop - 7, 3); B.rule(LX, midTop - 2, LX + FW, midTop - 2, 0.9);
    const lim = svcTop - 24, RXb = newsX(2), RWb = newsW(4);
    const y = B.head('lead', RXb, midTop + 6, RWb, {size:54, upper:true, lh:1.0, deckSize:18});
    B.flow('lead.body', RXb, y, RWb, {cols:2, size:17, bottom:lim, minSize:12.5});
    const py = await B.photo('photo.1', LX, midTop + 6, newsW(2), 400, {variant:1});
    B.txt('pq', LX, py, newsW(2), {frame:'rules', style:'italic', size:20, lh:1.24, weight:700, padY:10});
    B.vline(newsX(2) - G/2, midTop + 6, lim);
    B.rule(LX, svcTop - 10, LX + FW, svcTop - 10, 1.3);
  }},

  /* A5 — anúncios em pirâmide: três pilhas de 2 colunas, o anúncio grande na base de cada uma, e o canto livre no alto das duas da
     esquerda vira a caixa do arquivo e o aviso público. Cada anúncio é esticado pra pilha fechar certinha no rodapé. */
  wc_a5: {label:'A5 — Anúncios em pirâmide', build: async (B)=>{
    const T = B.innerHeader('A5'), BT = NEWS_G.BOTTOM, LX = newsX(0), FW = NEWS_G.W, end = BT - 2, col = i=>newsX(i*2), CW = newsW(2);
    const AD = (size, tsize)=>Object.assign({}, NEWS_AD, {size, titleSize:tsize, lh:1.3});
    const y0 = B.band('a5.band', LX, T, FW);
    const lg = B.txt('lg', col(0), y0, CW, {frame:'bar', title:true, size:18, lh:1.38}).obj;
    const pn = B.txt('pn', col(1), y0, CW, {frame:'rules', title:true, size:18, lh:1.38}).obj;
    const tops = [lg.top + lg.height + 16, pn.top + pn.height + 16, y0];
    const plan = [[['ads.2', 's'], ['ads.3', 's'], ['adb.3', 'b']], [['adm.3', 'm'], ['adm.4', 'm'], ['adb.2', 'b']], [['ads.1', 's'], ['ads.4', 's'], ['adm.1', 'm'], ['adm.2', 'm'], ['adb.1', 'b']]];
    // o anúncio cresce até o maior tamanho em que as três pilhas ainda cabem (a folga que sobrar é dividida entre os anúncios da pilha)
    const sty = f=>({b:AD(27*f, 46*f), m:AD(23*f, 37*f), s:{frame:'box', title:true, size:19.5*f, lh:1.34, titleFont:'Barlow Condensed', titleSize:27*f}});
    const mk = f=>plan.map((st, i)=>st.map(([role, k])=>B.txt(role, col(i), 0, CW, sty(f)[k]).obj));
    const fits = st=>st.map((boxes, i)=>boxes.reduce((a, o)=>a + o.height, 0) + 16*(boxes.length - 1) <= end - tops[i]).every(Boolean);
    let f = 1.25, stacks = mk(f);
    while (f > 0.7 && !fits(stacks)){ stacks.forEach(st=>st.forEach(o=>B.cv.remove(o))); f -= 0.04; stacks = mk(f); }
    const centered = o=>o.frame === 'ad';   // anúncio de moldura dupla: texto no meio; moldura simples: texto no topo
    stacks.forEach((boxes, i)=>B.stackFill(boxes, tops[i], end, 16, centered));
    // a caixa do arquivo e o aviso ganham a altura que falta no alto pra pirâmide fechar
    B.vline(col(1) - NEWS_G.GUT/2, y0, end); B.vline(col(2) - NEWS_G.GUT/2, y0, end);
  }},

  /* A6 — título em painel preto ao lado dos números, linha do tempo HORIZONTAL em largura total, texto em 2 colunas e foto + citação à direita. */
  wc_a6: {label:'A6 — Painel preto e linha do tempo', build: async (B)=>{
    const T = B.innerHeader('A6'), BT = NEWS_G.BOTTOM, LX = newsX(0), FW = NEWS_G.W, LW = newsW(4), RX = newsX(4), RW = newsW(2), G = NEWS_G.GUT;
    const lim = newsBottomRow(B, [{role:'wb.1', x:newsX(0), w:newsW(2)}, {role:'wb.2', x:newsX(2), w:newsW(2)}, {role:'wb.3', x:newsX(4), w:newsW(2)}], BT, NEWS_AD) - 22;
    const y0 = B.band('w6.band', LX, T, FW);
    const pb = B.revHead('w6', LX, y0, LW, {size:50});
    const pq = B.txt('pq6', RX, y0, RW, {frame:'rules', style:'italic', size:24, lh:1.24, weight:700, padY:12}).obj;
    if (pq){ pq.set('minH', Math.max(pq.height, pb - y0)); pq.setCoords(); }
    let y = pb + 10;
    const dk = B.txt('w6.deck', LX, y, LW, {style:'italic', size:19, lh:1.26}); if (dk.obj) y = dk.bottom + 6;
    const bl = B.txt('w6.byline', LX, y, LW, {font:'Libre Franklin', weight:600, size:11, cs:130, upper:true, lh:1.2, fill:'#4a4540'}); if (bl.obj) y = bl.bottom + 10;
    const ty = y;
    const tl = B.txt('tl', LX, ty, FW, {frame:'rules', title:true, rows:'ribbon', size:13.2, lh:1.3});
    const by = tl.bottom + 16;
    B.flow('w6.body', LX, by, LW, {cols:2, size:22, bottom:lim, minSize:12.5});
    const py = await B.photo('photo.6', RX, by, RW, 430, {variant:0});
    const nums = B.txt('nums6', RX, py, RW, {frame:'box', title:true, rows:true, size:19.5, lh:1.75}).obj;
    if (nums){ nums.set('minH', Math.max(nums.height, lim - py)); nums.setCoords(); }
    B.vline(RX - G/2, by, lim);
    B.rule(LX, lim + 8, LX + FW, lim + 8, 1.3);
  }},
};

const WC_CFG = {id:'westcoast', Builder:NewsDocBuilder, presets:WC_PRESETS, defaults:WC_DEFAULTS, defaultPreset:'wc_a4', mast:'gothic', justify:false, fonts:NEWS_FONT_SPECS,
  ui:{mast:true, justify:true}, paperFor:()=>Object.assign({}, DOC_TEMPLATES.newspaper.paper)};
/* Dentro do modelo Jornal: botões no painel "Layout do jornal" e entradas em "Tipo da nova página". */
newsRegisterPaper(WC_CFG, 'newsPresetRowWest', 'Westcoast Post', NEWS_FONT_SPECS);
/* Modelo próprio da primeira versão: fica registrado só pra os documentos salvos com ele continuarem abrindo (não aparece mais no menu Modelo). */
NEWS_DOCS.westcoast = {rebuild:newsRebuildAny, rows:'newspaper'};
registerDoc('westcoast', {
  label:'Jornal — Westcoast Post (A4, A5, A6)', page:A4.page, phys:A4.phys,
  paper:{type:'jornal', level:0.4, fold:'meio', atmos:'twin'},
  fonts:NEWS_FONT_SPECS,
  build: async ()=>{ await newsRebuildCfg(WC_CFG, {preset:'wc_a4'}); },
  pages:newsPageKinds(WC_CFG, NEWS_FONT_SPECS),
});
