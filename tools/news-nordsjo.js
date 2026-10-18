/* ===================== Nordsjo-Posten (f3-05) =====================
   Jornal regional norueguês (Straume, Sotra e Øygarden; fundado em 1932, fechado em 2016) em DUAS edições como "scan de documento":
   quinta-feira 9 de janeiro de 2003 (71. årgang) e quinta-feira 26 de outubro de 1989 (57. årgang). Texto em norueguês, aspas «».
   Design próprio, bem diferente do The Abyssal Post (serifa de jornal + título gótico), e igual nas duas edições (é o mesmo jornal). Tudo é tinta
   preta direto no papel, SEM caixa preta chapada (o Max achou que não combina com um jornal norueguês dos anos 90): título "Nordsjo-Posten" em
   serifa pesada com a marca das ondas e um filete ondulado embaixo, linha de data, aba cinza da seção, chamada em Libre Franklin 900, texto em
   PT Serif, caixas com fundo cinza de retícula, fotos em meio-tom fino com moldura grossa. O "scan" vem de três coisas somadas (receita
   pesquisada, ver proc-xerox.js):
     1) o conteúdo inteiro entra INCLINADO (newsTilt) e deslocado, como um papel torto no scanner;
     2) tinta levemente espalhada: NewsBox.soft (desfoque em unidades de página) em toda caixa de texto;
     3) a camada 'xerox' por cima (fundo preto do scanner no mesmo ângulo, toner, riscos, verso transparecendo, lombada) + papel Fotocópia.
   Vive DENTRO do modelo Jornal: cada layout é uma edição (2003 e 1989) e traz o próprio texto, papel, inclinação e intensidade de scan. O modelo
   'nordsjo' da versão anterior continua registrado (fora do menu) só pra abrir documentos salvos com ele.
   O texto padrão é o que o Max mandou; tudo é editável. Cada edição tem o PRÓPRIO layout: 2003 arejado (foto em largura total com o painel do
   título por cima, texto em 3 colunas estreitas, caixas à direita) e 1989 cheio (título + foto lado a lado, texto em 3 colunas,
   caixas, quatro notas miúdas com o clima de estranheza espalhado em vez de concentrado num elemento, e anúncios). */

const NORD_FONTS = ["900 16px 'Playfair Display'", "400 16px 'PT Serif'", "italic 400 16px 'PT Serif'", "700 16px 'PT Serif'", "400 16px 'Libre Franklin'", "700 16px 'Libre Franklin'", "900 16px 'Libre Franklin'"];
const NORD_G = {M:56, W:1128, GUT:16, TOP:112, BOTTOM:1660};
NORD_G.COL = (NORD_G.W - 5*NORD_G.GUT)/6;
const nX = i=>NORD_G.M + i*(NORD_G.COL + NORD_G.GUT), nW = n=>n*NORD_G.COL + (n - 1)*NORD_G.GUT;

/* Visual de cada edição: inclinação do papel, tinta mole, camada de scan, papel, retícula das fotos e foto-exemplo. */
const NORD_STYLE = {
  '2003': {tilt:-0.28, shift:[-3, 3], soft:0.45, pitch:3.2, photo:0, paper:{type:'fotocopia', level:0.55, fold:'meio', atmos:'neutra'},
           xerox:{tone:0.45, speck:0.45, streak:0.4, ghost:0.35, bed:0.6, gutter:0, side:'l'}},
  '1989': {tilt:0.5, shift:[5, -2], soft:0.8, pitch:4.2, photo:1, paper:{type:'fotocopia', level:0.78, fold:'meio', atmos:'silent'},
           xerox:{tone:0.9, speck:1, streak:0.8, ghost:0.75, bed:1, gutter:0.6, side:'l'}},
};

const NORD_DEFAULTS = {
  '2003': {
    'mast.name': 'Nordsjo-Posten',
    'run': 'TORSDAG 9. JANUAR 2003 · 71. ÅRGANG · NR. 2 · UTGITT I STRAUME FOR SOTRA OG ØYGARDEN',
    'bar': 'SPESIALSAK',
    'lead.kicker': 'PIONERDYKKERNE', 'lead.headline': 'Dykkerne vest for øyene',
    'lead.deck': 'Granskingen er ferdig. Fem menn som jobbet på feltet vest for Sotra forteller fem forskjellige historier om hva de gjorde der',
    'lead.byline': 'Av Siri Tangen',
    'photo.1.cap': 'Dykkerklokke heises om bord på en plattform vest for øyene, 1984. Foto: Nordsjo-Postens arkiv',
    'lead.body': 'Kommisjonen som regjeringen oppnevnte i 2000 har levert sin rapport om pionerdykkerne i Nordsjøen. Mellom 350 og 400 menn dykket for oljeindustrien på norsk sokkel mellom 1965 og 1990. Rapporten beskriver hurtig dekompresjon, mangelfull informasjon om helserisiko og dårlig oppfølging av mennene etterpå. Regjeringen har varslet at den vil komme tilbake til saken i en stortingsmelding.\n' +
      'For lesere på Sotra og i Øygarden har rapporten en egen side. Minst 23 dykkere fra distriktet jobbet mellom 1983 og 1990 på et felt vest for øyene, på kontrakter som kommisjonen ikke har klart å følge til en arbeidsgiver. Elleve firmaer sto oppført som oppdragsgiver, og ingen av dem hadde en adresse som fantes. Alle ble slettet fra Foretaksregisteret i løpet av 1991. Skattemyndighetene har ikke funnet et eneste regnskap fra noen av dem.\n' +
      'Kommisjonen peker også på at dykkeloggene fra feltet oppgir dybder som er grunnere enn det loddinger og sjøkart viser. Dykkeplanene ble godkjent av Oljedirektoratet uten at noen kontrollerte dem på stedet. Direktoratet vil ikke kommentere detaljer før regjeringen har behandlet saken.\n' +
      'Mennene er uenige om hva jobben var. Fem av dem har fortalt sin versjon til Nordsjo-Posten, og de står i boksen ved siden av. Alle har lønnsslipper, og ingen av slippene kommer fra samme firma.\n' +
      'Overlege Henrik Solheim ved Haukeland universitetssykehus har undersøkt flere av mennene. Han sier at hukommelseshull etter hard belastning er kjent, og at hjernen fyller hullene med det som ligger nærmest. «Hjernen liker ikke et hull. Den fyller det som vann i et fotspor», sier Solheim. Han legger til at det ikke forklarer hvorfor fem menn husker fem ulike oppdrag på samme felt i de samme årene.\n' +
      'Tre av mennene beskriver det samme stedet nær kanten av den dype renna fiskerne kaller Djupet: en bunn dekket av hvalben, som én av dem kaller kirkegården. Ingen undersøkelse fra perioden har registrert funnet. To av mennene sier at de hørte kvinnestemmer under vann, som klang inne i hodet. Den ene kaller det havfruer. En eldre fisker på Rong kjenner lyden som «Sangen fra Djupet», en gammel fortelling om kvinner på bunnen som kaller fiskere ved navn. Han sier at fortellingen var kjent på Rong lenge før dykkerne kom hjem.\n' +
      'Rolf Aasheim, leder i Nordsjødykkernes forening, mener oppgjøret må omfatte alle som var på feltet, også dem som ikke kan dokumentere hvem de jobbet for. «Mange har lønnsslippene sine og ingen andre papirer. Noen har mistet hele sesonger av livet», sier Aasheim.',
    'pq': '«Jeg vet at jeg jobbet de sesongene, for jeg har lønnsslippene. Jeg kan ikke fortelle deg én ting som skjedde.»\n— Jostein Langvik, dykker 1972–1989',
    'b1:title': 'FEM DYKKERE, FEM FORKLARINGER',
    'b1': 'Arvid Nesse, 54|Inspeksjon av en rørledning. Han husker røret tydelig. Ingen rørledning er lagt vest for øyene.\n' +
      'Jostein Langvik, 49|Leting etter et fiskefartøy som skal ha forlist i 1986. Fartøyet står ikke i noe forlisregister.\n' +
      'Oddvar Hellesøy, 52|Rydding av gamle sjøminer. Marinen har ikke bestilt oppdraget og kjenner ikke til miner på stedet.\n' +
      'Kåre Bjørnevik, 51|Et selskap testet en ny dekompresjonstabell på mannskapet. Ingen selskap har overtatt ansvaret for noen test.\n' +
      'En femte dykker, 55, som ikke vil navngis|Å finne varmt vann på bunnen. «Jeg vet hvordan det høres ut», sier han.',
    'b2:title': 'SAKEN I KORTE TREKK',
    'b2': '1965|Pionertiden begynner\n1983–1990|Dykking på feltet vest for øyene\n1991|Elleve firmaer slettes fra Foretaksregisteret\n1993|Kronberg-utvalget legger frem sin rapport\n2000|Regjeringen oppnevner granskingskommisjon\n31. desember 2002|Rapporten overleveres\n2003|Regjeringen varsler stortingsmelding',
    'ad.1:title': 'BAKERIET', 'ad.1': 'Ferske rundstykker og skolebrød hver dag fra kl. 06. Bestill kake til helgen innen torsdag.',
    'ad.2:title': 'STRAUME BILVERKSTED', 'ad.2': 'Vinterdekk og dekkskift. Bestill time i dag. Tlf. 56 00 12 34.',
    'ad.3:title': 'SOTRA FRISØR', 'ad.3': 'Åpent tirsdag til lørdag. Pensjonistrabatt på onsdager.',
    'foot.l': 'NORDSJO-POSTEN  ·  TORSDAG 9. JANUAR 2003', 'foot.r': 'SIDE 8',
  },
  '1989': {
    'mast.name': 'Nordsjo-Posten',
    'run': 'TORSDAG 26. OKTOBER 1989 · 57. ÅRGANG · NR. 43 · UTGITT I STRAUME FOR SOTRA OG ØYGARDEN',
    'bar': 'LOKALT',
    'lead.kicker': 'UTFALLET', 'lead.headline': 'Et hjerte i garnet',
    'lead.deck': 'Håkon Rask (53) fikk noe uvanlig opp fra kanten av Djupet og kaller det et hjerte. Legen sier at han ikke har sett slikt vev før',
    'lead.byline': 'Av Siri Tangen',
    'photo.1.cap': 'Håkon Rask med funnet utenfor huset i Utfallet. Det veide omtrent to kilo da det kom opp. Foto: S. Tangen',
    'lead.body': 'Håkon Rask (53) fra Utfallet trakk garnene sine ved kanten av Djupet tirsdag morgen, på omtrent 300 meters dyp, da noe tungt kom opp sammen med fisken. Det var en mørkerød klump på størrelse med et brød, med grener som årer ut fra den ene siden. «Jeg trodde først det var en bit av en hval», sier Rask. «Så så jeg formen. Det er et hjerte.»\n' +
      'Da klumpen kom over rekka, var den myk som lever, forteller Rask. Da han la til kai på Utfallet, var den i ferd med å bli hard, og onsdag morgen var den tørr og tung som bark. Den veier omtrent to kilo. Kona hans har bedt ham flytte den ut av kjøkkenet, og nå står den på hylla i stua.\n' +
      'Onsdag tok Rask funnet med til legekontoret i Straume. Lege Haldor Ness sier at han ikke har sett slikt vev før. «Jeg tør ikke si hva det er», sier Ness. Han har bedt om å få se funnet igjen i morgen.\n' +
      'Ole Hjartøy (84), som har fisket fra Utfallet siden han var gutt, sier at han har hørt om noe lignende. Faren hans fikk noe opp i 1921 som han ikke ville ha om bord. «Han kuttet linen og sa at havet kunne beholde det det hadde sendt», sier Hjartøy. Han vil ikke si mer, og det finnes ingen andre som husker saken.\n' +
      'Nordsjo-Posten har fått brev fra en samler i Bergen som har hørt om funnet. Han tilbyr det dobbelte av det Rask ber om, og skriver at han har liknende materiale. Avisen oppgir ikke navnet hans. Rask har ikke svart. «Det er ikke til salgs», sier han.\n' +
      'Rask sier at alle som vil kan komme og se funnet, og at det blir stående hos ham. Flere naboer har vært innom i løpet av uka. De fleste sier at det ligner mest på et hjerte som har ligget lenge i sjøen, og at de ikke ville ha det på hylla selv.\n' +
      'Utfallet-fiskerne er vant til rare fangster. «Vi har tatt opp ankere, tønner og en gang en kommode», sier en fisker på kaia. «Men aldri noe som ser ut som en del av en person.»',
    'pq': '«Det kom opp i garnet mitt. Det kan stå på hylla mi.»\n— Håkon Rask',
    'b1:title': 'KORT FORTALT',
    'b1': 'Undersøkelsesfartøy|Et utenlandsk fartøy har ligget for anker vest for feltet siden mandag. Fiskere er bedt om å holde garnene unna. Havnekapteinen sier at fartøyet har gyldig tillatelse og at oppdragsgiveren ikke har gitt opplysninger.\n' +
      'Butikken i Utfallet|Butikken og postkontoret stenger for godt lørdag etter 44 år. Posten kjøres fra Ågotnes tre dager i uka.\n' +
      'Ferga til Fedje|Vinterrute fra 1. november. Siste avgang kl. 17.30.\n' +
      'Basar|Utfallet kapell holder basar søndag kl. 14. Overskuddet går til nytt tak.',
    'b2:title': 'FUNNET I TALL',
    'b2': 'Funnet|tirsdag 24. oktober\nSted|kanten av Djupet\nDyp|ca. 300 meter\nStørrelse|som et brød\nVekt|ca. 2 kilo\nFarge|mørk rød\nTil salgs|nei',
    'ad.1:title': 'SOTRA BYGGEVARER', 'ad.1': 'Vinterutsalg på isolasjon og kledning. Åpent mandag til fredag 07–16, lørdag 09–13.',
    'ad.2:title': 'KAFFESTUA', 'ad.2': 'Vafler og kaffe hver dag. Søndagsmiddag fra kl. 14. Åpent 10–17.',
    'ad.3:title': 'SOTRA RADIO & TV', 'ad.3': 'Service og reparasjon på alle merker. Antennemontering. Tlf. 05 33 12 34.',
    'foot.l': 'NORDSJO-POSTEN  ·  TORSDAG 26. OKTOBER 1989', 'foot.r': 'SIDE 5',
    'v1:title': 'VÆRET',
    'v1': 'Torsdag: tåke om morgenen, bris fra vest. Fredag: sørvest og regn. Sjøen er urolig ved Djupet, ellers rolig. Fiskerne melder om stille vann inne ved land. Barometeret på kaia falt tolv hektopascal på en time natt til onsdag, uten at været endret seg.',
    'v2:title': 'LENSMANNEN MELDER',
    'v2': 'Tre henvendelser om lyder fra sjøen natt til onsdag. Ingen funn. Lensmannen minner om at hunder bør holdes inne om natten. En liten snekke ble funnet driftende ved Utfallet kai tirsdag morgen. Båten var tom og garnene var trukket. Eieren er funnet i god behold.',
    'v3:title': 'LESERBREV',
    'v3': 'Hunden vår har sittet ved stuevinduet mot vest siden tirsdag. Han vil ikke spise og vil ikke bli med ut. Har andre i Utfallet opplevd det samme? — Bekymret, Utfallet\nKua til Berge ville ikke gå ned til stranda onsdag. Hun har gått der i seks somre. — Nabo',
    'v4:title': 'SAVNET',
    'v4': 'Katten Pus, grå med hvit labb, borte fra Utfallet siden tirsdag kveld. Hører til hos familien Berge. Dørene står åpne. Fant du den, ring 56 00 12 34.',
  },
};

/* Meio-tom fino e neutro (cinza, sem creme): o ponto é fixo em unidades de página (pitch), então não vira moiré grosso ao ampliar. */
function nordPhotoFilters(pitch, w){
  return [new fabric.filters.Grayscale(), new fabric.filters.Contrast({contrast:0.22}), new HalftoneFilter({size:Math.max(0.002, pitch/w), paper:[0.94, 0.94, 0.93], ink:[0.07, 0.07, 0.07]})];
}

class NordBuilder extends NewsDocBuilder {
  constructor(cv, st, photos, defaults){
    super(cv, st, photos, defaults);
    this.S = NORD_STYLE[st.issue] || NORD_STYLE['2003'];
  }
  /* toda caixa de texto leva a tinta mole da edição (as colunas do corpo também) */
  txt(role, x, y, w, o){ return super.txt(role, x, y, w, Object.assign({soft:this.S.soft}, o || {})); }
  flow(role, x, y, w, o){
    const n0 = this.cv.getObjects().length, r = super.flow(role, x, y, w, o);
    this.cv.getObjects().slice(n0).forEach(ob=>{ if (ob.type === 'newsbox') ob.set('soft', this.S.soft); });
    return r;
  }

  /* Marca do jornal: anel com três ondas, em tinta preta direto no papel. */
  emblem(x, y, d){
    const k = this.kit, s = d/78;
    this._mark(k.circle({left:x, top:y, r:d/2 - 2*s, stroke:NEWS_INK, sw:3.8, fill:null, blend:'multiply', label:'Marca — anel'}), 'rule');
    for (let i = 0; i < 3; i++){
      this._mark(k.path('M 0 9 Q 8 -3 16 9 T 32 9 T 48 9 T 64 9', {left:x + d/2 - 32*s, top:y + d/2 + (i - 1)*14*s - 8*s, stroke:NEWS_INK, sw:3.6, scale:s, blend:'multiply', label:'Marca — onda'}), 'rule');
    }
  }
  /* Filete ondulado (o mar): uma onda de comprimento `len` e altura `amp` em toda a largura. */
  wave(x, y, w, amp, len, sw, label){
    const h = len/2, n = Math.ceil(w/h);
    let d = `M 0 0 Q ${h/2} ${-amp} ${h} 0`;
    for (let k = 2; k <= n; k++) d += ` T ${k*h} 0`;
    this._mark(this.kit.path(d, {left:x, top:y - amp/2, stroke:NEWS_INK, sw, blend:'multiply', label:label || 'Filete ondulado'}), 'rule');
  }
  /* Título do jornal direto no papel: filete grosso, a marca das ondas à esquerda e o nome em serifa pesada, filete ondulado, linha de data e
     edição entre filetes e a aba cinza da seção. Devolve onde o conteúdo começa. */
  async top(tabRole){
    const M = NORD_G.M, W = NORD_G.W;
    this.rule(M, 30, M + W, 30, 5.2); this.rule(M, 38, M + W, 38, 1.1);
    this.emblem(M + 2, 54, 90);
    this.txt('mast.name', M + 112, 40, W - 112, {font:'Playfair Display', weight:900, size:134, lh:1.0, cs:-8, align:'center', fit:true, minSize:60});
    this.wave(M, 170, W, 8, 36, 2.6, 'Filete ondulado (1)'); this.wave(M + 18, 180, W - 18, 5, 36, 1.3, 'Filete ondulado (2)');
    this.txt('run', M, 193, W, {font:'Libre Franklin', weight:700, size:11.4, cs:150, lh:1.2, align:'center', upper:true, fit:true, minSize:8});
    this.rule(M, 215, M + W, 215, 2.6); this.rule(M, 220, M + W, 220, 0.9);
    const ty = 232, tw = 236;
    this._mark(this.kit.rect({left:M, top:ty, width:tw, height:28, fill:'#d6d3cb', stroke:NEWS_INK, sw:1.6, label:'Aba da seção'}), 'rule');
    this.txt(tabRole, M + 14, ty + 8, tw - 28, {font:'Libre Franklin', weight:900, size:12.8, cs:270, lh:1.0, upper:true});
    this.rule(M + tw, ty + 26, M + W, ty + 26, 2.6);
    return ty + 28 + 12;
  }
  /* Anúncios na base (mesma altura) e rodapé. Devolve o topo dos anúncios. */
  base(){
    const G = NORD_G, BT = G.BOTTOM, LX = nX(0), FW = G.W;
    const adsTop = newsBottomRow(this, [0, 2, 4].map((c, i)=>({role:'ad.' + (i + 1), x:nX(c), w:nW(2)})), BT, {frame:'box', title:true, font:'PT Serif', size:13.6, lh:1.3, titleSize:12, titleFont:'Libre Franklin'});
    this.rule(LX, BT + 12, LX + FW, BT + 12, 1.1);
    this.txt('foot.l', LX, BT + 20, 800, {font:'Libre Franklin', weight:700, size:9.8, cs:140, lh:1.2, upper:true, fill:'#2a2622'});
    this.txt('foot.r', LX + FW - 240, BT + 19, 240, {font:'Libre Franklin', weight:900, size:11, cs:200, lh:1.2, upper:true, align:'right'});
    return adsTop;
  }
  /* Chamada: kicker, título pesado e (opcional) deck e assinatura. Com `box` vira um painel de papel com moldura grossa (por cima da foto);
     sem `box`, fica direto no papel entre um filete grosso em cima e um fino embaixo. A altura acompanha o texto (ou `minH`). */
  revHead(role, x, y, w, o){
    o = o || {}; const pad = o.box ? 20 : 2;
    const panel = o.box ? this.kit.rect({left:x, top:y, width:w, height:60, fill:'#f0eee7', stroke:NEWS_INK, sw:3.4, blend:'source-over', label:'Painel do título'}) : null;
    if (panel) this._mark(panel, 'rule'); else this.rule(x, y + 2, x + w, y + 2, 4.6);
    let yy = y + (o.box ? 17 : 18);
    const k = this.txt(role + '.kicker', x + pad, yy, w - 2*pad, {font:'Libre Franklin', weight:900, size:13, cs:270, upper:true, lh:1.2});
    if (k.obj) yy = k.bottom + 6;
    const h = this.txt(role + '.headline', x + pad, yy, w - 2*pad, {font:'Libre Franklin', weight:900, size:o.size || 80, lh:0.95, cs:-14});
    yy = h.bottom + 12;
    if (o.deck){
      const d = this.txt(role + '.deck', x + pad, yy, w - 2*pad, {font:'PT Serif', style:'italic', size:o.deckSize || 19, lh:1.27});
      if (d.obj) yy = d.bottom + 12;
    }
    if (o.byline){
      const b = this.txt(role + '.byline', x + pad, yy, w - 2*pad, {font:'Libre Franklin', weight:700, size:11.5, cs:190, upper:true, lh:1.2, fill:'#3a352f'});
      if (b.obj) yy = b.bottom + 12;
    }
    const bottom = Math.max(yy + 6, y + (o.minH || 0));
    if (panel){ panel.set('height', bottom - y); panel.setCoords(); } else this.rule(x, bottom - 1, x + w, bottom - 1, 1.2);
    return bottom;
  }
  /* foto em meio-tom fino com moldura grossa; legenda em x/largura próprios (o painel do título pode estar por cima). Devolve onde a legenda termina. */
  async photo(role, x, y, w, h, o){
    o = o || {};
    let img = this.photos[role];
    if (img){ newsFitCover(img, x, y, w, h); }
    else {
      img = await newsMakePhoto(x, y, w, h, o.variant != null ? o.variant : this.S.photo, (this.seed++)*131 + (this.st.seed || 7));
      img.filters = nordPhotoFilters(this.S.pitch, w); img.applyFilters();
    }
    img.set({stroke:'#121110', strokeWidth:2.2});
    this._mark(img, role); img.__labName = 'Foto (trocar) — ' + role;
    this.cv.add(img);
    let bot = y + h;
    const c = this.txt(role + '.cap', o.capX != null ? o.capX : x, y + h + 6, o.capW || w, {font:'Libre Franklin', size:11.2, lh:1.3, fill:'#1d1b19'});
    if (c.obj) bot = c.bottom;
    return bot + 10;
  }
  /* O papel entrou torto no scanner: o conteúdo todo inclina e a camada de scan vai por cima. */
  finish(){
    newsTilt(this.cv, this.S.tilt, this.S.shift[0], this.S.shift[1], PAGE_W, PAGE_H);
    const x = this.kit.proc('xerox', 0, 0, PAGE_W, PAGE_H, {seed:this.st.seed || 7, opts:Object.assign({}, this.S.xerox, {tilt:this.S.tilt, shift:this.S.shift}), blend:'multiply', label:'Efeito de scan (fotocópia)'});
    this._mark(x, 'xerox');
  }
}

const NORD_PRESETS = {
  /* 2003 — layout arejado: foto em largura total com o título num painel preto por cima, deck e texto em 3 colunas estreitas à esquerda
     e, à direita, as caixas empilhadas (o tamanho do texto da pilha é o maior que cabe). */
  nord_a6: {label:'2003 — Dykkerne vest for øyene', build: async (B)=>{
    const G = NORD_G, LX = nX(0), FW = G.W, LW = nW(4), RX = nX(4), RW = nW(2);
    const T = await B.top('bar');
    const lim = B.base() - 20;
    const PH = 340;
    const capBot = await B.photo('photo.1', LX, T, FW, PH, {capX:RX, capW:RW});
    const pb = B.revHead('lead', LX, T + PH - 126, LW, {size:72, box:true});
    let y = pb + 12;
    const dk = B.txt('lead.deck', LX, y, LW, {font:'PT Serif', style:'italic', size:20, lh:1.27}); if (dk.obj) y = dk.bottom + 7;
    const bl = B.txt('lead.byline', LX, y, LW, {font:'Libre Franklin', weight:700, size:11, cs:170, upper:true, lh:1.2}); if (bl.obj) y = bl.bottom + 7;
    B.rule(LX, y, LX + LW, y, 1.1); y += 12;
    const gut = 14, cw = (LW - 2*gut)/3;
    const fe = B.flow('lead.body', LX, y, LW, {cols:3, size:21, bottom:lim, minSize:11.5, gut, font:'PT Serif', lh:1.32});
    B.vline(LX + cw + gut/2, y, fe); B.vline(LX + 2*cw + gut*1.5, y, fe);
    // direita: pilha de caixas
    const sy = Math.max(capBot, T + PH + 8) + 6;
    const mk = sz=>[B.txt('b1', RX, sy, RW, {frame:'tint', title:true, rows:'defs', font:'PT Serif', size:sz, lh:1.32}),
      B.txt('pq', RX, sy, RW, {frame:'rules', font:'PT Serif', style:'italic', size:sz*1.66, lh:1.22, padY:11}),
      B.txt('b2', RX, sy, RW, {frame:'tint', title:true, rows:'wrap', font:'PT Serif', size:sz, lh:1.32})].map(r=>r.obj);
    let sz = 19, boxes = mk(sz);
    while (sz > 12.5 && boxes.reduce((a, o)=>a + o.height, 0) + 32 > lim - sy){ boxes.forEach(o=>B.cv.remove(o)); sz -= 0.5; boxes = mk(sz); }
    B.stackFill(boxes, sy, lim, 16);
    B.vline(RX - G.GUT/2, T + PH + 8, lim);
    B.rule(LX, lim + 10, LX + FW, lim + 10, 1.1);
    B.finish();
  }},

  /* 1989 — layout apertado e cheio: painel preto (4 col.) com o título e a chamada + foto (2 col.), texto em 3 colunas estreitas com fios,
     as duas caixas de baixo, uma fileira de quatro notas miúdas (tempo, lensmann, cartas, desaparecido) e os anúncios. */
  nord_old: {label:'1989 — Et hjerte i garnet', build: async (B)=>{
    const G = NORD_G, LX = nX(0), FW = G.W, LW = nW(4), RX = nX(4), RW = nW(2);
    const T = await B.top('bar');
    const lim = B.base() - 20;
    // faixa de notas miúdas: quatro caixas de mesma altura, coladas acima dos anúncios
    const sw = (FW - 3*G.GUT)/4;
    const small = [1, 2, 3, 4].map((n, i)=>B.txt('v' + n, LX + i*(sw + G.GUT), 0, sw, {frame:'box', title:true, font:'PT Serif', size:13.4, lh:1.3, titleSize:11.5, titleFont:'Libre Franklin'}).obj).filter(Boolean);
    const sH = Math.max(0, ...small.map(o=>o.height)), smallTop = lim - sH;
    small.forEach(o=>{ o.set('minH', sH); o.set('top', smallTop); o.setCoords(); });
    // chamada: painel preto + foto na mesma altura
    const pb = B.revHead('lead', LX, T, LW, {size:104, deck:true, deckSize:20, byline:true, minH:330});
    const capBot = await B.photo('photo.1', RX, T, RW, pb - T, {});
    const y = Math.max(pb + 12, capBot);
    B.rule(LX, y + 2, LX + FW, y + 2, 3.2); B.rule(LX, y + 7, LX + FW, y + 7, 0.9);
    const by = y + 20, gut = 16, cw = (FW - 2*gut)/3;
    // caixas do meio (para saber a altura) e o texto em 3 colunas no que sobra
    const b1 = B.txt('b1', LX, 0, nW(3), {frame:'tint', title:true, rows:'defs', font:'PT Serif', size:18, lh:1.32}).obj;
    const pq = B.txt('pq', nX(3), 0, nW(3), {frame:'rules', font:'PT Serif', style:'italic', size:30, lh:1.22, padY:12}).obj;
    const b2 = B.txt('b2', nX(3), 0, nW(3), {frame:'tint', title:true, rows:'wrap', font:'PT Serif', size:18, lh:1.32}).obj;
    const L = Math.max(b1.height, pq.height + 14 + b2.height);
    const fe = B.flow('lead.body', LX, by, FW, {cols:3, size:23, bottom:smallTop - 20 - L - 24, minSize:11.5, gut, font:'PT Serif', lh:1.3});
    B.vline(LX + cw + gut/2, by, fe); B.vline(LX + 2*cw + gut*1.5, by, fe);
    const lowerTop = fe + 20, lowerBot = smallTop - 18;
    B.rule(LX, lowerTop - 9, LX + FW, lowerTop - 9, 1.1);
    b1.set('top', lowerTop); b1.set('minH', Math.max(b1.height, lowerBot - lowerTop)); b1.setCoords();
    B.stackFill([pq, b2], lowerTop, lowerBot, 14);
    B.vline(nX(3) - G.GUT/2, lowerTop, lowerBot);
    B.rule(LX, smallTop - 9, LX + FW, smallTop - 9, 1.1);
    B.rule(LX, lim + 10, LX + FW, lim + 10, 1.1);
    B.finish();
  }},
};

const NORD_CFG = {id:'nordsjo', Builder:NordBuilder, presets:NORD_PRESETS, defaultsFor:st=>NORD_DEFAULTS[st.issue] || NORD_DEFAULTS['2003'], defaultPreset:'nord_a6', mast:'-', justify:false, fonts:NORD_FONTS,
  ui:{mast:false, justify:false}, paperFor:st=>Object.assign({}, NORD_STYLE[st.issue || '2003'].paper)};
/* Cada layout é uma edição (issue): o layout escolhe o texto, o papel e o desgaste do scan. */
NORD_PRESETS.nord_a6.issue = '2003'; NORD_PRESETS.nord_old.issue = '1989';
/* Dentro do modelo Jornal: botões no painel "Layout do jornal" e entradas em "Tipo da nova página" (a página nova já nasce com o papel de fotocópia). */
newsRegisterPaper(NORD_CFG, 'newsPresetRowNord', 'Nordsjo-Posten', NORD_FONTS, k=>NORD_STYLE[NORD_PRESETS[k].issue].paper);
/* Modelo próprio da versão anterior: fica registrado só pra os documentos salvos com ele continuarem abrindo (não aparece mais no menu Modelo). */
NEWS_DOCS.nordsjo = {rebuild:newsRebuildAny, rows:'newspaper'};
const _nordVar = (id, label)=>({id, label, paper:NORD_STYLE[id].paper, fonts:NORD_FONTS,
  build: async (kit, ctx)=>{ await newsRebuildCfg(NORD_CFG, {preset:id === '1989' ? 'nord_old' : 'nord_a6'}); },
  pages:newsPageKinds(NORD_CFG, NORD_FONTS).sort((a, b)=>(b.id === (id === '1989' ? 'nord_old' : 'nord_a6')) - (a.id === (id === '1989' ? 'nord_old' : 'nord_a6')))});
registerDoc('nordsjo', {
  label:'Jornal antigo — Nordsjo-Posten (scan, norueguês)', page:A4.page, phys:A4.phys,
  paper:NORD_STYLE['2003'].paper, fonts:NORD_FONTS, variantNoun:'jornal',
  variants:[_nordVar('2003', '9. januar 2003 — Dykkerne vest for øyene'), _nordVar('1989', '26. oktober 1989 — Et hjerte i garnet')],
  build: async (kit, ctx)=>{ await newsRebuildCfg(NORD_CFG, {preset:'nord_a6'}); },
});
