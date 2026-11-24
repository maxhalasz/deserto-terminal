/* ============================================================
   ØDEMARK A. — dados do mapa (PUBLICO: geometria + texto que o jogador pode ler). Pitch A.
   Gerado a partir de _preview_scratch/pitches/gen (kit, catalogo, pa_*.js; node adopt.js a). Unidade: metros; salas e corredores colados.
   Textos do Guardiao ficam em station-gm-data.js (so o guardiao.html carrega).
   ============================================================ */
(function(){
window.OLDR={"md_off":{"n":"Officers' cabins","t":"hab","eq":"cabinrow","cab":{"n":9,"side":"s"},"pub":"Cabines dos oficiais. Nove cabines de duas camas ao longo do casco norte, onde dormem a chefia e os oficiais. Cada uma tem uma escotilha para o lado de fora."},"md_ow":{"n":"Officers' washroom","t":"hab","eq":"wash","pub":"Banheiro dos oficiais. Chuveiros e pias de uso exclusivo da ala dos oficiais."},"md_om":{"n":"Officers' mess","t":"hab","eq":"dining","pub":"Refeitório dos oficiais. Sala onde os oficiais fazem as refeições e reuniões informais."},"md_cl":{"n":"Clinic","t":"hab","eq":"clinic","pub":"Enfermaria. Presta os primeiros socorros e guarda os medicamentos da plataforma."},"md_ol":{"n":"Laundry","t":"hab","eq":"laundry","pub":"Lavanderia dos oficiais. Lava e seca roupa de cama e macacões da ala dos oficiais."},"md_gym":{"n":"Gym","t":"hab","eq":"gym","pub":"Academia. Equipamentos de exercício para a tripulação nas folgas."},"md0":{"n":"Lounge","t":"hab","eq":"roundlounge","shape":"round","pub":"Lounge. Sala redonda de convivência ligada às duas alas, com sofás, quadros, armários individuais e máquinas de venda, usada para relaxar perto dos quartos ou de manhã."},"md1":{"n":"Boot room","t":"ind","eq":"lockers","pub":"Sala de botas. Passagem de troca de botas e macacão entre o lado limpo e o lado sujo; a faixa amarela no piso marca a divisão."},"md2":{"n":"Control room","t":"ind","eq":"console","lp":"t","pub":"Sala de controle. Monitora e comanda os sistemas da plataforma a partir de painéis e monitores."},"md3":{"n":"Electrical shop","t":"ind","eq":"elec","lp":"t","pub":"Oficina elétrica. Faz a manutenção e o reparo de painéis, motores e cabos elétricos."},"md12":{"n":"Dry store","t":"ind","eq":"store","pub":"Depósito seco. Guarda peças de reposição e material que não pode pegar umidade."},"md11":{"n":"Crew washroom","t":"hab","eq":"wash","pub":"Banheiro da tripulação. Chuveiros e pias de uso da ala da tripulação."},"md_cd":{"n":"Crew day room","t":"hab","eq":"crewday","pub":"Sala de convivência da tripulação. Espaço de descanso e jogos nas folgas."},"md_lc":{"n":"Crew laundry","t":"hab","eq":"laundry","pub":"Lavanderia da tripulação. Lava e seca roupa e macacões da tripulação."},"md_ppe":{"n":"PPE locker","t":"ind","eq":"ppe","pub":"Armário de EPI. Guarda e distribui os equipamentos de proteção individual: macacões, capacetes e cintos."},"md_crw":{"n":"Crew cabins","t":"hab","eq":"cabinrow","cab":{"n":9,"side":"n"},"pub":"Cabines da tripulação. Nove cabines de duas camas ao longo do casco sul, onde dorme o resto da tripulação. Cada uma tem uma escotilha para o lado de fora."},"md_ins":{"n":"Instrument shop","t":"ind","eq":"instr","pub":"Oficina de instrumentação. Calibra e conserta os manômetros e sensores da plataforma."},"md_scba":{"n":"SCBA store","t":"ind","eq":"dive","pub":"Depósito de respiradores autônomos. Guarda os aparelhos de respiração usados em emergências com gás ou fumaça."},"md_trf":{"n":"Transformer room","t":"ind","eq":"xfmr","pub":"Sala de transformadores. Reduz a tensão da energia gerada para alimentar os equipamentos."},"md_swu":{"n":"Stair W · up","t":"stair","eq":"stair","dir":"up","to":"L-07","pub":"Escada de subida. Liga o module deck ao weather deck."},"md_swd":{"n":"Stair W · down","t":"stair","eq":"stair","dir":"dn","to":"L-03","pub":"Escada de descida. Liga o module deck ao cellar deck."},"md4":{"n":"M10 · Wellbay","t":"ind","eq":"wellheads","pub":"Área dos poços (wellbay). Abriga as cabeças de poço, que controlam a saída do óleo e do gás do reservatório até a plataforma."},"md5":{"n":"M11 · Mud room","t":"ind","eq":"mud","pub":"Sala de lama. Prepara, bombeia e filtra a lama de perfuração, que resfria a broca e carrega os fragmentos de rocha até a superfície."},"md_lab":{"n":"Mud lab","t":"ind","eq":"lab","pub":"Laboratório de lama. Analisa as amostras de lama e de sedimento que sobem do poço."},"md_chem":{"n":"Chemical store","t":"ind","eq":"chemstore","pub":"Depósito de químicos. Guarda os produtos usados no tratamento do poço e do óleo."},"md6":{"n":"M20 · Separation","t":"ind","eq":"separators","pub":"Separação. Separa o óleo, o gás e a água que chegam misturados dos poços."},"md8":{"n":"M22 · Decommissioned","t":"off","eq":"sealed","st":"sealed","pub":"Módulo desativado. Antigo módulo de processo fora de operação, com válvulas e energia isoladas por bloqueio de segurança."},"md7":{"n":"M21 · Compression","t":"ind","eq":"compressors","pub":"Compressão. Comprime o gás separado para enviá-lo por duto ou reinjetá-lo no poço."},"md10":{"n":"M31 · Workshop","t":"ind","eq":"workshop","pub":"Oficina. Usina e conserta peças metálicas e ferramentas da plataforma."},"md9":{"n":"M30 · Utilities","t":"ind","eq":"utilities","pub":"Utilidades. Gera a energia e o ar quente da plataforma com geradores e sistemas auxiliares."},"md_inj":{"n":"M23 · Chemical injection","t":"ind","eq":"inj","pub":"Injeção de químicos. Dosa produtos químicos nas linhas para evitar corrosão e incrustação."},"md_wc":{"n":"WC and janitor","t":"ind","eq":"wash","pub":"Sanitários e zeladoria. Banheiros de apoio ao módulo e guarda de material de limpeza."},"md_se":{"n":"Stair E · up","t":"stair","eq":"stair","dir":"up","to":"L-07","pub":"Escada de subida. Liga o module deck ao weather deck."},"wd1":{"n":"Helideck","t":"ext","eq":"heli","pub":"Heliponto. Área de pouso e decolagem dos helicópteros que levam e trazem a tripulação."},"wd2":{"n":"Engine house","t":"ind","eq":"engine","pub":"Casa de máquinas. Abriga o motor do elevador e os tanques do sistema de sprinklers."},"wd15":{"n":"Utility shed","t":"ind","eq":"store","pub":"Casa de utilidades. Guarda ferramentas e material de apoio ao convés."},"wd4":{"n":"Tower top","t":"ext","eq":"tower","pub":"Topo da torre. Estrutura em treliça que sustenta equipamentos no alto da plataforma."},"wd3":{"n":"Laydown area","t":"ext","eq":"containers","pub":"Área de descarga. Espaço aberto onde os guindastes deixam os contêineres e a carga recebida dos barcos."},"wd6":{"n":"Lifeboats","t":"ind","eq":"lifeboats","pub":"Baleeiras. Cápsulas salva-vidas fechadas usadas para evacuar a tripulação em emergência."},"wd7":{"n":"PPE store","t":"ind","eq":"ppe","pub":"Depósito de EPI. Guarda cintos, capacetes e o cesto usado para transferir pessoal por guindaste."},"wd5":{"n":"Gas vent","t":"ext","eq":"vent","pub":"Respiro de gás. Chaminé que libera o gás com segurança quando a pressão passa do limite."},"wd14":{"n":"Muster station 3","t":"ext","eq":"muster","pub":"Ponto de reunião 3. Local onde a tripulação se apresenta e é contada durante um alarme."},"wd8":{"n":"Crane 1","t":"ext","eq":"crane","pub":"Guindaste 1. Içacarga entre os barcos de apoio e o convés."},"wd9":{"n":"Crane 2","t":"ext","eq":"crane","pub":"Guindaste 2. Içacarga e material entre os barcos de apoio e o convés."},"wd10":{"n":"Crane 3","t":"ext","eq":"crane","pub":"Guindaste 3. Içacarga e material entre os barcos de apoio e o convés."},"wd11":{"n":"Flare boom","t":"ext","eq":"flare","pub":"Ponta do flare. Lança que leva o queimador de gás em excesso para longe da plataforma."},"wd13":{"n":"Old platform","t":"off","eq":"old","st":"sealed","pub":"Plataforma antiga. Estrutura vizinha desativada, ligada à principal por uma passarela."},"cd1":{"n":"Machine room","t":"ind","eq":"sauna","pub":"Sala de máquinas. Concentra a ventilação e o aquecimento do deck, além da sauna usada pela tripulação."},"cd4":{"n":"Cargo area","t":"ind","eq":"cargo","pub":"Área de carga. Recebe, guarda e movimenta contêineres e materiais trazidos pelos guindastes."},"cd7":{"n":"Lower wellbay","t":"ind","eq":"xmas","pub":"Wellbay inferior. Parte baixa da área dos poços, onde ficam as árvores de natal, conjuntos de válvulas que controlam o fluxo de cada poço."},"cd2":{"n":"Drying room","t":"ind","eq":"drying","pub":"Sala de secagem. Seca macacões e roupa de trabalho molhados."},"cd3":{"n":"Desalination","t":"ind","eq":"desal","pub":"Dessalinização. Transforma água do mar em água doce para uso na plataforma."},"cd10":{"n":"Switchgear","t":"ind","eq":"switch","pub":"Quadro de força. Distribui e protege a energia elétrica enviada aos equipamentos."},"cd6":{"n":"Dive room","t":"ind","eq":"dive","pub":"Sala de mergulho. Guarda e prepara o equipamento dos mergulhadores e controla a escala de mergulho."},"cd12":{"n":"Paint store","t":"ind","eq":"paint","pub":"Depósito de tinta. Guarda tintas e solventes usados na manutenção contra a corrosão."},"cd5":{"n":"Moonpool","t":"ind","eq":"moonpool","pub":"Moonpool. Abertura no piso por onde equipamentos e submersíveis descem direto ao mar; um corredor em volta dá acesso a todos os lados."},"cd8":{"n":"Umbilical winch","t":"ind","eq":"winch","pub":"Guincho do umbilical. Enrola e desenrola o cabo que liga a plataforma aos veículos submarinos."},"cd11":{"n":"Fire pumps","t":"ind","eq":"pumps","pub":"Bombas de incêndio. Bombeiam água do mar para os sistemas de combate a incêndio."},"cd_hpu":{"n":"Hydraulic power unit","t":"ind","eq":"hpu","pub":"Unidade hidráulica. Fornece pressão de óleo para acionar válvulas e equipamentos."},"cd9":{"n":"ROV bay","t":"ind","eq":"rov","pub":"Baia de ROV. Guarda e prepara os veículos operados remotamente usados em inspeção submarina."},"cd13":{"n":"Waste","t":"ind","eq":"waste","pub":"Resíduos. Armazena o lixo e os resíduos oleosos até o transporte para terra."},"cd_bal":{"n":"Ballast control","t":"ind","eq":"ballast","pub":"Controle de lastro. Controla a água dos tanques que mantêm a plataforma estável."},"cd_swp":{"n":"Seawater pumps","t":"ind","eq":"pumps","pub":"Bombas de água do mar. Puxam água do mar para o resfriamento e para o sistema de incêndio."},"cd14":{"n":"Storeroom","t":"ind","eq":"store","pub":"Almoxarifado. Guarda material de consumo e peças de reposição do deck."},"cd15":{"n":"M12 · Decommissioned","t":"off","eq":"sealed","st":"sealed","pub":"Módulo desativado. Antigo módulo de processo fora de operação, com a entrada fechada por chapa soldada."},"cd_sp":{"n":"Spare parts","t":"ind","eq":"store","pub":"Peças de reposição. Guarda válvulas, flanges e juntas para a manutenção."},"cd_cab":{"n":"Cable room","t":"ind","eq":"cable","pub":"Sala de cabos. Guarda os carretéis de cabo elétrico e de controle."},"cd_hot":{"n":"Hot-work shop","t":"ind","eq":"workshop","pub":"Oficina de trabalho a quente. Solda e corta metal sob permissão e controle do risco de incêndio."},"cd_chm":{"n":"Chemical store","t":"ind","eq":"chemstore","pub":"Depósito de químicos. Guarda tambores de produtos químicos sobre bacias de contenção."},"cd_pwt":{"n":"Produced water treatment","t":"ind","pub":"Tratamento de água produzida. Separa o óleo residual da água que sobe com o petróleo antes de devolvê-la ao mar."},"cd_slop":{"n":"Slop tank room","t":"ind","pub":"Tanque de resíduos oleosos. Recebe o óleo recolhido dos drenos e das bacias de contenção."},"cd_clo":{"n":"Chlorination unit","t":"ind","pub":"Unidade de cloração. Dosa cloro na água do mar para impedir incrustação nas linhas e nas bombas."},"cd_egen":{"n":"Emergency generator room","t":"ind","pub":"Gerador de emergência. Mantém luz e bombas de incêndio ligadas quando a energia principal cai."},"lqE1":{"n":"Heliport access","t":"ext","eq":"hatch","pub":"Acesso ao heliponto. Escotilha e escada que levam à cobertura do alojamento e ao heliponto."},"lqE2":{"n":"Lift motor room","t":"ind","eq":"engine","pub":"Casa de máquinas do elevador. Abriga o motor do elevador e o tanque do sistema de sprinklers."},"lqE4":{"n":"Air handling units","t":"ind","eq":"ahu","pub":"Unidades de ar-condicionado. Renovam, filtram e esfriam o ar de todos os decks do alojamento."},"lqE6":{"n":"Antenna deck","t":"ext","eq":"antenna","pub":"Convés de antenas. Mastro e antenas de rádio e satélite que ligam a plataforma ao resto do mundo."},"lqE0":{"n":"Core","t":"ind","eq":"lift","pub":"Núcleo de circulação. Concentra a escada e o elevador que ligam os decks do alojamento."},"lqE9":{"n":"Stairwell","t":"stair","eq":"stair","pub":"Escada de emergência. Rota de fuga protegida por porta corta-fogo que liga os decks do alojamento."},"lqD1":{"n":"Communications","t":"ind","eq":"comms","pub":"Comunicações. Central de rádio e satélite para falar com a costa, os barcos e os helicópteros."},"lqD2":{"n":"Camera room","t":"ind","eq":"cameras","pub":"Sala de câmeras. Monitora as câmeras de segurança da plataforma e registra ocorrências."},"lqD3":{"n":"OIM office","t":"ind","eq":"office","pub":"Escritório do OIM. Sala do gerente da instalação, responsável por toda a plataforma."},"lqD4":{"n":"Meeting room","t":"ind","eq":"meeting","pub":"Sala de reunião. Reuniões de segurança e de planejamento."},"lqD5":{"n":"Offices","t":"ind","eq":"office","pub":"Escritórios. Trabalho administrativo e de planejamento."},"lqD6":{"n":"Archive","t":"ind","eq":"archive","pub":"Arquivo. Guarda registros, relatórios e documentos da operação."},"lqD8":{"n":"Coffee room","t":"ind","eq":"pantry","pub":"Sala do café. Pequena copa para a pausa da equipe administrativa."},"lqD10":{"n":"Training room","t":"ind","eq":"training","pub":"Sala de treinamento. Aulas de segurança, primeiros socorros e indução de quem chega."},"lqD0":{"n":"Core","t":"ind","eq":"lift","pub":"Núcleo de circulação. Concentra a escada e o elevador que ligam os decks do alojamento."},"lqD9":{"n":"Stairwell","t":"stair","eq":"stair","pub":"Escada de emergência. Rota de fuga protegida por porta corta-fogo que liga os decks do alojamento."},"lqC1":{"n":"Dormitories A","t":"hab","eq":"cabinrow","cab":{"n":6,"side":"s"},"pub":"Dormitórios A. Cabines de duas camas para equipes de rotação que passam períodos curtos a bordo."},"lqC3":{"n":"Cabins 1–6 · vacant","t":"off","eq":"cabinrow","cab":{"n":6,"side":"n"},"pub":"Cabines 1 a 6 (vagas). Cabines de reserva, mantidas arrumadas para quando chegar mais gente."},"lqC2":{"n":"Washrooms A","t":"hab","eq":"bath","pub":"Banheiros A. Chuveiros e pias de uso dos dormitórios do deck."},"lqC5":{"n":"Study room","t":"hab","eq":"study","pub":"Sala de estudo. Espaço silencioso com manuais técnicos para estudo e leitura."},"lqC6":{"n":"Quiet room","t":"hab","eq":"quiet","pub":"Sala de silêncio. Espaço de descanso curto longe do barulho."},"lqC4":{"n":"Linen room","t":"hab","eq":"linen","pub":"Rouparia. Guarda lençóis, toalhas e macacões limpos."},"lqC7":{"n":"Store","t":"hab","eq":"store","pub":"Depósito. Guarda o material de limpeza do deck."},"lqC0":{"n":"Core","t":"ind","eq":"lift","pub":"Núcleo de circulação. Concentra a escada e o elevador que ligam os decks do alojamento."},"lqC9":{"n":"Stairwell","t":"stair","eq":"stair","pub":"Escada de emergência. Rota de fuga protegida por porta corta-fogo que liga os decks do alojamento."},"lqC8":{"n":"Weather deck exit","t":"ext","eq":"hatch","pub":"Saída para o weather deck. Porta que liga o alojamento ao convés externo."},"lqB4":{"n":"Dormitories B","t":"hab","eq":"cabinrow","cab":{"n":6,"side":"s"},"pub":"Dormitórios B. Cabines de duas camas para equipes de rotação, ainda em uso."},"lqB1":{"n":"Cabins · sealed","t":"off","eq":"cabinrow","st":"sealed","cab":{"n":3,"side":"n"},"pub":"Cabines desativadas. Antigas cabines fechadas por falta de uso depois da redução da tripulação."},"lqB3":{"n":"Cabins · sealed","t":"off","eq":"cabinrow","st":"sealed","cab":{"n":2,"side":"n"},"pub":"Cabines desativadas. Mais cabines fechadas por falta de uso."},"lqB2":{"n":"TV room · disabled","t":"off","eq":"tv","pub":"Sala de TV (desativada). Antiga sala de convivência com televisão, fora de uso."},"lqB5":{"n":"Storage","t":"off","eq":"store","pub":"Depósito. Guarda colchões, papelada e materiais antigos do deck."},"lqB6":{"n":"Washrooms · sealed","t":"off","eq":"bath","st":"sealed","pub":"Banheiros (desativados). Antigos chuveiros e pias das cabines fechadas, com a água cortada."},"lqB7":{"n":"Washrooms B","t":"hab","eq":"bath","pub":"Banheiros B. Chuveiros e pias de uso dos dormitórios que ainda funcionam."},"lqB8":{"n":"Corridor end","t":"hab","eq":"plaster","pub":"Fim do corredor. Extremidade do corredor sul do deck."},"lqB0":{"n":"Core","t":"ind","eq":"lift","pub":"Núcleo de circulação. Concentra a escada e o elevador que ligam os decks do alojamento."},"lqB9":{"n":"Stairwell","t":"stair","eq":"stair","pub":"Escada de emergência. Rota de fuga protegida por porta corta-fogo que liga os decks do alojamento."},"lqA0":{"n":"Core","t":"ind","eq":"lift","pub":"Núcleo de circulação. Concentra a escada e o elevador que ligam os decks do alojamento."},"lqA9":{"n":"Stairwell","t":"stair","eq":"stair","pub":"Escada de emergência. Rota de fuga protegida por porta corta-fogo que liga os decks do alojamento."},"lqA1":{"n":"Mess hall","t":"hab","eq":"dining","pub":"Refeitório. Onde a tripulação faz as refeições, em turnos."},"lqA3":{"n":"Galley","t":"hab","eq":"galley","pub":"Cozinha. Prepara as refeições de toda a plataforma."},"lqA4":{"n":"Pantry","t":"hab","eq":"store","pub":"Despensa. Guarda os alimentos secos e enlatados."},"lqA5":{"n":"Cold room","t":"hab","eq":"cold","pub":"Câmara fria. Conserva carnes, laticínios e alimentos perecíveis."},"lqA2":{"n":"Lounge","t":"hab","eq":"lounge","pub":"Sala de estar. Espaço de convivência com sofá, TV e videogame."},"lqA6":{"n":"Laundry","t":"hab","eq":"laundry","pub":"Lavanderia. Lava e seca roupa de cama e macacões de todo o alojamento."},"lqA7":{"n":"Infirmary","t":"hab","eq":"infirmary","pub":"Enfermaria. Atende doentes e feridos até uma eventual remoção."},"lqA8":{"n":"Medic's room","t":"hab","eq":"office","pub":"Sala do médico. Consultas e guarda dos prontuários da tripulação."},"lqA10":{"n":"Common room","t":"hab","eq":"quiet","pub":"Sala de descanso. Espaço de repouso com poltronas voltadas para a janela."}};
/* ============================================================
   KIT DOS PITCHES (so preview; nada daqui vai pro repo ate o Max escolher).
   Monta decks em metros, posiciona salas RENTE aos corredores (row), cria portas, vazios (poche) e seguranca sozinho,
   e entrega window.STATION no mesmo formato do station-data.js.
   ============================================================ */
(function(root){
const PL={};
const CATN={};PL.CAT=CATN;PL.cat=o=>Object.assign(CATN,o);
const OLD=()=>root.OLDR||{};
const r1=v=>Math.round(v*100)/100;

/* ---------- portas automaticas (igual ao station-data.js) ---------- */
function ov(a0,a1,b0,b1){return Math.min(a1,b1)-Math.max(a0,b0);}
function autoDoors(room,corrs){
  const [x,y,w,h]=room.r,out=[];
  const sides=[
    ['n',c=>Math.abs(c.r[1]+c.r[3]-y)<.01&&ov(x,x+w,c.r[0],c.r[0]+c.r[2])>=1.4,c=>[Math.max(x,c.r[0]),Math.min(x+w,c.r[0]+c.r[2])],'x'],
    ['s',c=>Math.abs(c.r[1]-(y+h))<.01&&ov(x,x+w,c.r[0],c.r[0]+c.r[2])>=1.4,c=>[Math.max(x,c.r[0]),Math.min(x+w,c.r[0]+c.r[2])],'x'],
    ['w',c=>Math.abs(c.r[0]+c.r[2]-x)<.01&&ov(y,y+h,c.r[1],c.r[1]+c.r[3])>=1.4,c=>[Math.max(y,c.r[1]),Math.min(y+h,c.r[1]+c.r[3])],'y'],
    ['e',c=>Math.abs(c.r[0]-(x+w))<.01&&ov(y,y+h,c.r[1],c.r[1]+c.r[3])>=1.4,c=>[Math.max(y,c.r[1]),Math.min(y+h,c.r[1]+c.r[3])],'y']];
  sides.forEach(([s,test,span,ax])=>{
    const cs=corrs.filter(test);if(!cs.length)return;
    const c=cs[0],[a,b]=span(c),mid=(a+b)/2;
    const t=ax==='x'?(mid-x)/w:(mid-y)/h;
    out.push([s,Math.round(Math.max(.12,Math.min(.88,t))*100)/100,room.t==='stair'?'open':'door','c']);
  });
  return out.slice(0,room.maxDoors||2);
}

/* ---------- sala a partir do catalogo (+ snapshot das salas antigas) ---------- */
function mkRoom(id,x,y,w,h,o){
  const base=Object.assign({},OLD()[id]||{},CATN[id]||{},o||{});
  if(!base.n)throw new Error('sala sem nome: '+id);
  delete base.r;delete base.deck;if(!(o&&o.d)&&!(CATN[id]&&CATN[id].d))delete base.d;
  return Object.assign({id,r:[r1(x),r1(y),r1(w),r1(h)],t:'ind'},base);
}

/* ---------- deck ---------- */
PL.deck=meta=>{
  const D=Object.assign({rooms:[],corr:[],voids:[],blocks:[],stairs:[],esc:[],cams:[],fire:[],mcp:[],firewall:[],fireDoors:[]},meta);
  const rectOf=a=>{if(Array.isArray(a))return a;const o=D.rooms.find(r=>r.id===a)||D.corr.find(c=>c.id===a);if(!o)throw new Error('ancora desconhecida '+a);return o.r;};
  D.at=rectOf;
  D.c=(id,x,y,w,h,n,g,open)=>{const o={id,r:[r1(x),r1(y),r1(w),r1(h)],n:n||''};if(g)o.g=g;if(open)o.open=true;D.corr.push(o);return o.r;};
  D.r=(id,x,y,w,h,o)=>{const m=mkRoom(id,x,y,w,h,o);D.rooms.push(m);return m.r;};
  D.v=(x,y,w,h)=>{D.voids.push([r1(x),r1(y),r1(w),r1(h)]);};
  D.blk=(x,y,w,h,n,sub,d)=>{D.blocks.push({r:[r1(x),r1(y),r1(w),r1(h)],n,sub,d});};
  /* fileira de salas coladas num lado da ancora. side n|s: start = x absoluto, len = largura; side e|w: start = y absoluto, len = altura.
     item = [id,len,depth,opts] | [null,gap] | ['#',len,depth] (vazio) */
  D.row=(anchor,side,start,items)=>{
    const a=rectOf(anchor);let p=start;const out={};
    items.forEach(it=>{
      const [id,len,dep,o]=it;
      if(id===null){p+=len;return;}
      let x,y,w,h;
      if(side==='n'){x=p;w=len;h=dep;y=a[1]-dep;}
      else if(side==='s'){x=p;w=len;h=dep;y=a[1]+a[3];}
      else if(side==='w'){y=p;h=len;w=dep;x=a[0]-dep;}
      else{y=p;h=len;w=dep;x=a[0]+a[2];}
      if(id==='#')D.v(x,y,w,h);else out[id]=D.r(id,x,y,w,h,o);
      p+=len;
    });
    return out;};
  return D;
};

/* ---------- acabamento: portas, bbox, vazios, seguranca ---------- */
function eatBox(D){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  const eat=a=>{x0=Math.min(x0,a[0]);y0=Math.min(y0,a[1]);x1=Math.max(x1,a[0]+a[2]);y1=Math.max(y1,a[1]+a[3]);};
  D.rooms.forEach(r=>eat(r.r));D.corr.forEach(c=>eat(c.r));D.voids.forEach(eat);D.blocks.forEach(b=>eat(b.r));
  return [x0,y0,x1-x0,y1-y0];
}
function autoVoids(D,opt){
  const bb=D.foot?null:eatBox(D),G=.1;
  const feet=D.foot||[bb];
  const X0=Math.min(...feet.map(f=>f[0])),Y0=Math.min(...feet.map(f=>f[1])),X1=Math.max(...feet.map(f=>f[0]+f[2])),Y1=Math.max(...feet.map(f=>f[1]+f[3]));
  const W=Math.round((X1-X0)/G),H=Math.round((Y1-Y0)/G),grid=new Uint8Array(W*H);
  const mark=(a,v)=>{const i0=Math.max(0,Math.round((a[0]-X0)/G)),i1=Math.min(W,Math.round((a[0]+a[2]-X0)/G)),j0=Math.max(0,Math.round((a[1]-Y0)/G)),j1=Math.min(H,Math.round((a[1]+a[3]-Y0)/G));
    for(let j=j0;j<j1;j++)for(let i=i0;i<i1;i++)grid[j*W+i]=v;};
  feet.forEach(f=>mark(f,1)); // 1 = livre dentro da pegada
  const occ=a=>mark(a,2);
  D.rooms.forEach(r=>occ(r.r));D.corr.forEach(c=>occ(c.r));D.voids.forEach(occ);D.blocks.forEach(b=>occ(b.r));
  const minT=opt.minT||1.0,holes=[];const out=[];
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){
    if(grid[j*W+i]!==1)continue;
    let i2=i;while(i2<W&&grid[j*W+i2]===1)i2++;
    let j2=j+1;while(j2<H){let ok=true;for(let k=i;k<i2;k++)if(grid[j2*W+k]!==1){ok=false;break;}if(!ok)break;j2++;}
    for(let jj=j;jj<j2;jj++)for(let ii=i;ii<i2;ii++)grid[jj*W+ii]=3;
    out.push([r1(X0+i*G),r1(Y0+j*G),r1((i2-i)*G),r1((j2-j)*G)]);
  }
  // junta fatias vizinhas de mesma largura/posicao (empilhadas) pra nao deixar costura
  let merged=true;while(merged){merged=false;for(let a=0;a<out.length&&!merged;a++)for(let b=a+1;b<out.length;b++){const p=out[a],q=out[b];
    if(Math.abs(p[0]-q[0])<.01&&Math.abs(p[2]-q[2])<.01&&Math.abs(p[1]+p[3]-q[1])<.01){out[a]=[p[0],p[1],p[2],r1(p[3]+q[3])];out.splice(b,1);merged=true;break;}
    if(Math.abs(p[1]-q[1])<.01&&Math.abs(p[3]-q[3])<.01&&Math.abs(p[0]+p[2]-q[0])<.01){out[a]=[p[0],p[1],r1(p[2]+q[2]),p[3]];out.splice(b,1);merged=true;break;}}}
  out.forEach(v=>{if(Math.min(v[2],v[3])<minT)return;D.voids.push(v);if(v[2]*v[3]>(opt.holeA||26))holes.push(v);});
  D.holes=holes;
}
function safety(D){
  D.corr.forEach(c=>{const [x,y,w,h]=c.r,hz=w>=h,L=hz?w:h;if(L<7||c.open&&L<14)return;
    for(let t=Math.min(3.5,L/3),k=0;t<L-1.5;t+=21,k++){const p=hz?[r1(x+t),r1(y+h/2)]:[r1(x+w/2),r1(y+t)];D.fire.push(p);}
    for(let t=Math.min(11,L/2),k=0;t<L-1.5;t+=27,k++){const p=hz?[r1(x+t),r1(y+h/2)]:[r1(x+w/2),r1(y+t)];D.mcp.push(p);}});
}
PL.finish=(D,opt)=>{
  opt=opt||{};
  D.rooms.forEach(r=>{if(r.cab){r.d=[];for(let i=0;i<r.cab.n;i++)r.d.push([r.cab.side,Math.round((i+.5)/r.cab.n*1000)/1000,'cdoor','c']);}else if(!r.d)r.d=autoDoors(r,D.corr);});
  if(opt.autoVoid!==false)autoVoids(D,opt);
  D.bbox=eatBox(D);
  if(!D.fire.length&&opt.safety!==false)safety(D);
  return D;
};

/* ---------- STATION ---------- */
PL.station=(decks,extra)=>{
  extra=extra||{};
  const LEVELS=[{id:'weather',tag:'L-07',name:'Weather deck',elev:'+52 m'},{id:'quarters',tag:'L-06',name:'Living quarters',elev:'+42 / +62 m'},{id:'module',tag:'L-05',name:'Module deck',elev:'+40 m'},{id:'cellar',tag:'L-03',name:'Cellar deck',elev:'+28 m'}];
  const LEGACY={helipad:'weather',control:'module',mess:'quarters',drill:'cellar'};
  const DECK_LEVEL={weather:'weather',module:'module',cellar:'cellar',lqE:'quarters',lqD:'quarters',lqC:'quarters',lqB:'quarters',lqA:'quarters'};
  const DECKS={};decks.forEach(d=>{DECKS[d.id]=d;d.rooms.forEach(r=>{r.deck=d.id;});d.corr.forEach(c=>{c.deck=d.id;});});
  const intro=extra.intro||{};
  Object.values(DECKS).forEach(d=>{d.intro=intro[d.id]||d.intro||'';});
  const CAMERAS=extra.cameras||[{id:'cam01',label:'CAM-01',loc:'Restaurant'},{id:'cam02',label:'CAM-02',loc:'Lower wellbay'},{id:'cam03',label:'CAM-03',loc:'Main corridor'},{id:'cam04',label:'CAM-04',loc:'Moonpool'}];
  root.STATION={CAMERAS,LEVELS,LEGACY,DECK_LEVEL,DECKS,
    LQ_ORDER:['lqE','lqD','lqC','lqB','lqA'],LQ_NAMES:{lqE:'E · +58',lqD:'D · +54',lqC:'C · +50',lqB:'B · +46',lqA:'A · +42'},
    STACK:extra.stack||null,PITCH:extra.pitch||null,
    levelId:id=>(LEGACY[id]||id),
    decksOfLevel:l=>Object.keys(DECKS).filter(k=>DECK_LEVEL[k]===l),
    roomIndex:(()=>{const m={};Object.values(DECKS).forEach(d=>d.rooms.forEach(r=>m[r.id]=r));return m;})(),
    corrIndex:(()=>{const m={};Object.values(DECKS).forEach(d=>d.corr.forEach(c=>m[c.id]=c));return m;})()};
  return root.STATION;
};
root.PL=PL;
})(typeof window!=='undefined'?window:globalThis);

/* ============================================================
   Desenho por ASCII (1 caractere = 1 m). Cada deck e escrito como um mapa de texto; o parser vira salas, corredores, vazios,
   contorno de bloco e firewall.
     letra/digito/simbolo do legend  = sala (todas as celulas do mesmo simbolo formam UM retangulo cheio)
     .  corredor        :  galeria ao ar livre (corredor aberto)      F  corredor + porta corta-fogo (numerada)
     #  vazio (poche)   %  contorno do bloco (hachura)               |  firewall            espaco = fora / vazio automatico
   legend: {simbolo: 'id' | ['id',{opcoes}]}
   ============================================================ */
(function(root){
const PL=root.PL;
function decomp(rows,test){
  const H=rows.length,W=Math.max(0,...rows.map(r=>r.length)),seen=[];for(let y=0;y<H;y++)seen.push(new Uint8Array(W));
  const is=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&test((rows[y]||'')[x]||' ');
  const out=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(seen[y][x]||!is(x,y))continue;
    let x2=x;while(is(x2,y)&&!seen[y][x2])x2++;
    let y2=y+1;while(y2<H){let ok=true;for(let k=x;k<x2;k++)if(!is(k,y2)||seen[y2][k]){ok=false;break;}if(!ok)break;y2++;}
    for(let j=y;j<y2;j++)for(let i=x;i<x2;i++)seen[j][i]=1;
    out.push([x,y,x2-x,y2-y]);
  }
  return out;
}
PL.ascii=(D,rows,legend,o)=>{
  o=o||{};
  const H=rows.length,cell=(x,y)=>(rows[y]||'')[x]||' ';
  const g={};
  for(let y=0;y<H;y++)for(let x=0;x<rows[y].length;x++){const ch=cell(x,y);if(legend[ch]===undefined)continue;
    const e=g[ch]||(g[ch]={x0:x,y0:y,x1:x,y1:y,n:0});e.x0=Math.min(e.x0,x);e.y0=Math.min(e.y0,y);e.x1=Math.max(e.x1,x);e.y1=Math.max(e.y1,y);e.n++;}
  const probs=[];
  Object.keys(legend).forEach(ch=>{const e=g[ch];if(!e){probs.push('simbolo "'+ch+'" ('+(Array.isArray(legend[ch])?legend[ch][0]:legend[ch])+') nao aparece no mapa');return;}
    const w=e.x1-e.x0+1,h=e.y1-e.y0+1;if(w*h!==e.n)probs.push('sala "'+ch+'" ('+(Array.isArray(legend[ch])?legend[ch][0]:legend[ch])+') nao e um retangulo cheio: caixa '+w+'x'+h+' em ('+e.x0+','+e.y0+') mas tem '+e.n+' celulas');});
  if(probs.length)throw new Error(D.id+': '+probs.join(' | '));
  Object.keys(legend).forEach(ch=>{const e=g[ch],L=legend[ch],id=Array.isArray(L)?L[0]:L,op=Array.isArray(L)?L[1]:null;
    D.r(id,e.x0,e.y0,e.x1-e.x0+1,e.y1-e.y0+1,op);});
  // corredores
  const cs=(open,pre)=>decomp(rows,ch=>open?ch===':':(ch==='.'||ch==='F'));
  let n=0;const cn=o.cname||{};
  const pre=o.cpre||(D.id+'_c');
  decomp(rows,ch=>ch==='.'||ch==='F').forEach(r=>{n++;let nm='';Object.keys(cn).forEach(k=>{const [cx,cy]=k.split(',').map(Number);if(cx>=r[0]&&cx<r[0]+r[2]&&cy>=r[1]&&cy<r[1]+r[3])nm=cn[k];});
    const grp=o.cgrp&&Object.keys(o.cgrp).map(k=>{const [cx,cy]=k.split(',').map(Number);return (cx>=r[0]&&cx<r[0]+r[2]&&cy>=r[1]&&cy<r[1]+r[3])?o.cgrp[k]:null;}).find(Boolean);
    D.c(pre+String(n).padStart(2,'0'),r[0],r[1],r[2],r[3],nm,grp||null,false);});
  let gn=0;decomp(rows,ch=>ch===':').forEach(r=>{gn++;let nm='';Object.keys(cn).forEach(k=>{const [cx,cy]=k.split(',').map(Number);if(cx>=r[0]&&cx<r[0]+r[2]&&cy>=r[1]&&cy<r[1]+r[3])nm=cn[k];});
    D.c(pre+'g'+String(gn).padStart(2,'0'),r[0],r[1],r[2],r[3],nm,D.id+'_gal',true);});
  // vazios, bloco, firewall, portas corta-fogo
  decomp(rows,ch=>ch==='#').forEach(r=>D.v(r[0],r[1],r[2],r[3]));
  const bl=decomp(rows,ch=>ch==='%');bl.forEach((r,i)=>{const b=(o.blocks&&o.blocks[i])||{};D.blk(r[0],r[1],r[2],r[3],b.n,b.sub,b.d);});
  decomp(rows,ch=>ch==='|').forEach(r=>D.firewall.push(r));
  let fd=0;decomp(rows,ch=>ch==='F').forEach(r=>{fd++;D.fireDoors.push({id:'FD-'+fd,x:r[0]+r[2]/2,y:r[1]+r[3]/2,v:r[3]>=r[2]?1:0});});
  return D;
};

/* tela de pintura: rect() pinta (o que vem depois sobrescreve), put() cola um pedaco de ascii (espaco = transparente) */
PL.canvas=(W,H)=>{const g=[];for(let y=0;y<H;y++)g.push(new Array(W).fill(" "));
  const C={W,H,rect:(x,y,w,h,ch)=>{for(let j=Math.max(0,y);j<Math.min(H,y+h);j++)for(let i=Math.max(0,x);i<Math.min(W,x+w);i++)g[j][i]=ch;return C;},
    put:(x,y,rows)=>{rows.forEach((r,j)=>{for(let i=0;i<r.length;i++){if(r[i]!==" "&&y+j>=0&&y+j<H&&x+i>=0&&x+i<W)g[y+j][x+i]=r[i];}});return C;},
    rows:()=>g.map(r=>r.join("")),
    dump:()=>{const ruler="    "+Array.from({length:W},(_,i)=>i%10===0?String(i/10%10):" ").join("");return [ruler].concat(g.map((r,j)=>String(j).padStart(3," ")+" "+r.join(""))).join(String.fromCharCode(10));}};
  return C;};
/* rotas de fuga: pts em metros; 'need' sai sozinho dos corredores que os pontos tocam */
PL.route=(D,k,pts)=>{const need=new Set();pts.forEach(p=>D.corr.forEach(c=>{if(p[0]>=c.r[0]-.01&&p[0]<=c.r[0]+c.r[2]+.01&&p[1]>=c.r[1]-.01&&p[1]<=c.r[1]+c.r[3]+.01)need.add(c.id);}));
  D.esc.push({k,pts,need:[...need]});};
})(typeof window!=='undefined'?window:globalThis);

/* Catalogo das salas NOVAS e das que mudaram de nome/texto (o resto vem do snapshot old_rooms.js).
   Texto publico: "[Nome em portugues]. [Explicacao]."  Nomes de pessoas ficam fora (so no GM). */
PL.cat({
 /* ===== module deck ===== */
 mb_ent:{n:'Block entrance',t:'ind',eq:'entry',pub:'Entrada do bloco. Antessala ao pé da escada e do elevador do alojamento, a ligação coberta entre o bloco e a plataforma.'},
 mb_st:{n:'Block stair',t:'stair',dir:'up',to:'L-06',eq:'stair',pub:'Escada do bloco. Liga o module deck aos decks do alojamento.'},
 mb_lf:{n:'Block lift',t:'ind',eq:'lift',pub:'Elevador do bloco. Sobe do module deck até o heliponto, parando em cada deck do alojamento.'},
 mc_chg:{n:'Crew change room',t:'ind',eq:'lockers',pub:'Sala de troca da tripulação. Vestiário onde a equipe troca a roupa de bordo pelo macacão de trabalho antes de entrar nos módulos.'},
 md_ppe:{n:'PPE lockers',pub:'Armários de EPI. Guardam e distribuem os equipamentos de proteção individual: macacões, capacetes e cintos.'},
 ms_cal:{n:'Production suite',t:'hab',eq:'suite',pub:'Suíte do superintendente de produção. Escritório e quarto no mesmo cômodo, ao lado da sala de controle.'},
 ms_les:{n:'Maintenance suite',t:'hab',eq:'suite',pub:'Suíte do supervisor de manutenção. Escritório e quarto no mesmo cômodo, perto da oficina elétrica.'},
 ms_chl:{n:'Dive suite',t:'hab',eq:'suite',pub:'Suíte do supervisor de mergulho. Escritório e quarto no mesmo cômodo, perto da escada para o cellar deck.'},
 mt_w:{n:'Stair W',t:'stair',dir:'ud',to:'L-07 · L-03',eq:'stair',pub:'Escada W. Liga o weather deck, o module deck e o cellar deck.'},
 mt_c:{n:'Stair C',t:'stair',dir:'ud',to:'L-07 · L-03',eq:'stair',pub:'Escada C. Liga o weather deck, o module deck e o cellar deck.'},
 mt_e:{n:'Stair E',t:'stair',dir:'ud',to:'L-07 · L-03',eq:'stair',pub:'Escada E. Liga o weather deck, o module deck e o cellar deck.'},
 md4:{pub:'Área dos poços (wellbay). Abriga as cabeças de poço sob a torre de perfuração; a perfuração está parada no inverno e o equipamento está preservado.'},
 md5:{pub:'Sala de lama. Prepara e filtra a lama de perfuração; parada no inverno, com o equipamento preservado.'},
 md_lab:{pub:'Laboratório de lama. Analisa as amostras da lama de perfuração; parado no inverno, com a bancada coberta.'},
 md8:{pub:'Módulo desativado (injeção de gás). Antigo módulo de injeção de gás, parado desde 2013, com válvulas e energia isoladas por bloqueio de segurança.'},
 md9:{pub:'Utilidades. Produz o ar comprimido, a água quente e o vapor usados pela plataforma.'},
 /* ===== cellar ===== */
 cd1:{n:'Machine room',eq:'gens',pub:'Sala de máquinas. Abriga os três geradores, as tomadas de ar e a sauna improvisada que a tripulação monta no vapor.'},
 cd10:{n:'Switchgear and batteries',eq:'switch',pub:'Quadro de força e baterias. Distribui a energia dos geradores e guarda as baterias de reserva.'},
 cd12:{n:'Paint and chemical store',pub:'Paiol de tintas e químicos. Guarda tintas, solventes e produtos químicos, além das máscaras respiratórias.'},
 cd7:{pub:'Wellbay inferior. Parte baixa da área dos poços, sob a torre, onde ficam as árvores de natal; a perfuração está parada no inverno.'},
 cd_rsk:{n:'Risers shaft',t:'ind',eq:'shaft',pub:'Poço dos risers. Cabeça de um poço de concreto com o elevador que desce cerca de nove minutos até o fundo.'},
 cd_emb:{n:'Boat embarkation',t:'ind',eq:'jetty',pub:'Ponto de embarque. Plataforma junto à água com escada até o mar, onde o barco de apoio recolhe a tripulação.'},
 cd_stk:{n:'Battery room',t:'ind',eq:'battery',pub:'Sala de baterias. Guarda as baterias que mantêm a luz de emergência e os sistemas de controle quando a energia cai.'},
 /* ===== weather ===== */
 wd4:{pub:'Topo da torre. Treliça da torre de perfuração, parada no inverno, com o equipamento preservado.'},
 wd14:{n:'Muster point',eq:'muster0',pub:'Ponto de reunião. Local onde a tripulação se apresenta e é contada num alarme, ao lado do quadro de T-cards.'},
 wd_tc:{n:'T-card board',t:'ext',eq:'tcards',pub:'Quadro de T-cards. Painel de cartões com o nome de cada pessoa a bordo, usado para contar a tripulação no alarme.'},
 wd6:{pub:'Baleeiras. Cápsulas salva-vidas fechadas, ao lado do alojamento, para evacuar a tripulação.'},
 wd_raft:{n:'Life rafts',t:'ext',eq:'liferaft',pub:'Balsas salva-vidas. Balsas infláveis lançadas por um escorregador até o mar, na ponta oposta ao alojamento.'},
 wd_hb:{n:'Heliport B',t:'ext',eq:'heliB',pub:'Heliponto B (desativado). Antigo heliponto da plataforma velha, fora de uso.'},
 wd13:{pub:'Plataforma antiga. Estrutura vizinha desativada e lacrada, ligada à principal pela Ponte B.'},
 /* ===== bloco: nucleo (escada + elevador) em cada deck ===== */
 le_st:{n:'Stair',t:'stair',dir:'ud',to:'L-06',eq:'stair',pub:'Escada do bloco. Liga os decks do alojamento ao heliponto e ao module deck.'},
 ld_st:{n:'Stair',t:'stair',dir:'ud',to:'L-06',eq:'stair',pub:'Escada do bloco. Liga os decks do alojamento ao heliponto e ao module deck.'},
 lc_st:{n:'Stair',t:'stair',dir:'ud',to:'L-06',eq:'stair',pub:'Escada do bloco. Liga os decks do alojamento ao heliponto e ao module deck.'},
 lb_st:{n:'Stair',t:'stair',dir:'ud',to:'L-06',eq:'stair',pub:'Escada do bloco. Liga os decks do alojamento ao heliponto e ao module deck.'},
 la_st:{n:'Stair',t:'stair',dir:'ud',to:'L-06 · L-05',eq:'stair',pub:'Escada do bloco. Liga os decks do alojamento ao heliponto e desce até o module deck.'},
 le_lf:{n:'Lift',t:'ind',eq:'lift',pub:'Elevador do bloco. Liga o heliponto, os decks do alojamento e o module deck.'},
 ld_lf:{n:'Lift',t:'ind',eq:'lift',pub:'Elevador do bloco. Liga o heliponto, os decks do alojamento e o module deck.'},
 lc_lf:{n:'Lift',t:'ind',eq:'lift',pub:'Elevador do bloco. Liga o heliponto, os decks do alojamento e o module deck.'},
 lb_lf:{n:'Lift',t:'ind',eq:'lift',pub:'Elevador do bloco. Liga o heliponto, os decks do alojamento e o module deck.'},
 la_lf:{n:'Lift',t:'ind',eq:'lift',pub:'Elevador do bloco. Liga o heliponto, os decks do alojamento e o module deck.'},
 /* ===== deck E ===== */
 lqE1:{n:'Heliport access',pub:'Acesso ao heliponto. Escotilha e escada que levam à cobertura do alojamento e ao Heliporto A.'},
 lqE2:{n:'Machine house',pub:'Casa de máquinas. Abriga o motor do elevador e os tanques do sistema de sprinklers.'},
 /* ===== deck D ===== */
 ls_gun:{n:'Platform suite',t:'hab',eq:'suite',pub:'Suíte do supervisor da plataforma. Escritório e quarto no mesmo cômodo, ao lado da sala de comunicações.'},
 ls_aru:{n:'Operator suite',t:'hab',eq:'suite',pub:'Suíte do representante da operadora. Escritório e quarto no mesmo cômodo, junto aos escritórios e ao arquivo.'},
 lqD5:{n:'Offices'},
 /* ===== deck C ===== */
 lc_w:{n:'Cabins · west wing',t:'hab',eq:'cabinrow',pub:'Cabines da ala oeste. Seis cabines de duas camas, cada uma com escotilha para o lado de fora e porta própria para o corredor.'},
 lc_e:{n:'Cabins · east wing',t:'hab',eq:'cabinrow',pub:'Cabines da ala leste. Seis cabines de duas camas, cada uma com escotilha para o lado de fora e porta própria para o corredor.'},
 lc_com:{n:'Common room',t:'hab',shape:'round',eq:'roundlounge',pub:'Sala de convivência. Sala redonda no meio do deck, com sofás, quadros e duas máquinas de venda, usada pelas duas alas.'},
 lc_bath:{n:'Washrooms',t:'hab',eq:'bath',pub:'Banheiros. Chuveiros e pias de uso das duas alas de cabines.'},
 lc_lau:{n:'Laundry',t:'hab',eq:'laundry',pub:'Lavanderia. Lava e seca roupa de cama e macacões de todo o alojamento.'},
 lqC4:{pub:'Rouparia. Guarda lençóis, toalhas e macacões limpos.'},
 lqC7:{n:'Store',pub:'Depósito. Guarda o material de limpeza do deck.'},
 lqC8:{pub:'Saída para o weather deck. Porta que liga o alojamento ao convés externo.'},
 /* ===== deck B ===== */
 lb_c1:{n:'Cabins · sealed',t:'off',st:'sealed',eq:'cabinrow',pub:'Cabines lacradas. Fileira de cabines fechadas com fita e sem uso desde a redução da tripulação.'},
 lb_c2:{n:'Cabins · sealed',t:'off',st:'sealed',eq:'cabinrow',pub:'Cabines lacradas. Mais cabines fechadas com fita e sem uso.'},
 lb_c3:{n:'Cabins · sealed',t:'off',st:'sealed',eq:'cabinrow',pub:'Cabines lacradas. Cabines fechadas, com a última porta encostada.'},
 lqB2:{pub:'Sala de TV (desativada). Antiga sala de convivência com televisão, fora de uso.'},
 lqB5:{pub:'Depósito. Guarda colchões, papelada e materiais antigos do deck.'},
 lqB6:{pub:'Banheiros (desativados). Antigos chuveiros e pias das cabines lacradas, com a água cortada.'},
 lqB8:{pub:'Fim do corredor. Extremidade do corredor do deck.'},
 /* ===== deck A ===== */
 la_rest:{n:'Restaurant',t:'hab',eq:'bar',pub:'Restaurante. Único lugar de refeição do alojamento, mobiliado como um bar, com balcão, mesas e cabines.'},
 la_kit:{n:'Kitchen',t:'hab',eq:'kitchen',pub:'Cozinha. Prepara as refeições de todos a bordo e serve o restaurante pelo balcão.'},
 la_pan:{n:'Pantry',t:'hab',eq:'store',pub:'Despensa. Guarda os alimentos secos e enlatados da cozinha.'},
 la_cold:{n:'Cold room',t:'hab',eq:'cold',pub:'Câmara fria. Conserva carnes, laticínios e alimentos perecíveis.'},
 la_frz:{n:'Freezer',t:'hab',eq:'freezer',pub:'Freezer. Congela e guarda carne e peixe por meses.'},
 la_lng:{n:'Lounge',t:'hab',eq:'loungeps',pub:'Sala de estar. Sofás, videogame e uma mini academia, aberta para o restaurante.'},
 la_inf:{n:'Infirmary',t:'hab',eq:'infirmary',pub:'Enfermaria. Atende doentes e feridos e guarda os medicamentos até uma eventual remoção.'},
 la_fos:{n:'Doctor\'s suite',t:'hab',eq:'suite',pub:'Suíte do médico. Quarto e consultório do médico da plataforma, ao lado da enfermaria.'},
 la_vst:{n:'Airlock vestibule',t:'ind',eq:'vest',pub:'Antessala da entrada. Câmara de duas portas na saída do alojamento para o module deck; o bloco é o refúgio pressurizado.'},
 la_stp:{n:'Entrance steps',t:'stair',dir:'dn',to:'L-05',eq:'stair',pub:'Degraus da entrada. Descem da antessala do Deck A até o module deck.'}
});

PL.cat({mx_sto1:{n:"Process store",t:"ind",eq:"store",pub:"Depósito de processo. Guarda peças e consumíveis dos módulos de processo."},mx_sto2:{n:"Process store",t:"ind",eq:"store",pub:"Depósito de processo. Guarda peças e consumíveis dos módulos de processo."},mx_sto3:{n:"Process store",t:"ind",eq:"store",pub:"Depósito de processo. Guarda peças e consumíveis dos módulos de processo."},mx_sto4:{n:"Process store",t:"ind",eq:"store",pub:"Depósito de processo. Guarda peças e consumíveis dos módulos de processo."},mx_foam:{n:"Foam room",t:"ind",eq:"pumps",pub:"Sala de espuma. Guarda os tanques de espuma do sistema de combate a incêndio da área dos poços."},mx_gas1:{n:"Gas detection",t:"ind",eq:"elec",pub:"Detecção de gás. Concentra os sensores e os alarmes de gás do deck."},mx_gas2:{n:"Gas detection",t:"ind",eq:"elec",pub:"Detecção de gás. Concentra os sensores e os alarmes de gás do deck."}});
PL.cat({wd16:{n:'Pipe rack',t:'ext',eq:'store',pub:'Rack de tubulação. Área aberta onde correm os tubos e cabos que atravessam o convés.'}});
PL.cat({wd17:{n:'Staging deck',t:'ext',eq:'containers',pub:'Convés de apoio. Área aberta onde se deixam ferramentas e material junto ao alojamento.'},wd18:{n:'Staging deck',t:'ext',eq:'containers',pub:'Convés de apoio. Área aberta onde se deixam ferramentas e material junto à torre.'}});

/* ===== salas que ocupam os vazios dos decks (2026-11-24) ===== */
PL.cat({
 cd_wks:{n:'Maintenance workshop',t:'ind',eq:'workshop',pub:'Oficina de manutenção. Bancadas, torno e solda para consertar peças da plataforma, ao lado da área de carga.'},
 cd_lube:{n:'Lube oil store',t:'ind',eq:'paint',pub:'Paiol de óleo lubrificante. Guarda tambores de óleo e graxa usados nos geradores, bombas e guindastes.'},
 cd_air:{n:'Air compressor room',t:'ind',eq:'compressors',pub:'Sala de compressores de ar. Produz o ar de instrumentos que opera as válvulas e os controles pneumáticos do deck.'},
 cd_spr:{n:'Spare parts warehouse',t:'ind',eq:'store',pub:'Almoxarifado. Prateleiras com peças de reposição, vedações, válvulas e mangueiras catalogadas por número.'},
 cd_scs:{n:'Survival gear store',t:'ind',eq:'ppe',pub:'Paiol de sobrevivência. Guarda trajes de imersão, coletes e kits de resgate para o ponto de embarque.'},
 lqE7:{n:'Heliport store',t:'ind',eq:'store',pub:'Paiol do heliporto. Guarda calços, redes, extintores e o equipamento de resgate e abastecimento do Heliporto A.'},
 lqD11:{n:'Safety office',t:'ind',eq:'office',pub:'Escritório de segurança. Mantém os planos de emergência, os registros de treinamento e o controle das inspeções.'},
 lqD12:{n:'Supply office',t:'ind',eq:'office',pub:'Escritório de suprimentos. Controla pedidos, estoque e as remessas que chegam e saem pelo barco de apoio.'},
 lb_sto:{n:'Storeroom · sealed',t:'off',eq:'store',pub:'Depósito lacrado. Guarda colchões, roupa de cama e mobília dos dormitórios fechados do deck.'},
 la_gym:{n:'Gym',t:'hab',eq:'gym',pub:'Academia. Esteiras, bicicleta e pesos livres para a tripulação, ao lado do lounge.'},
 la_cln:{n:'Cleaning store',t:'hab',eq:'linen',pub:'Depósito de limpeza. Carrinhos, produtos e roupa de cama da equipe de hotelaria.'}
});

/* ===== casas de maquinas sob o bloco de alojamento (module deck) ===== */
PL.cat({
 mb_hvac:{n:'Accommodation HVAC plant',t:'ind',eq:'ahu',pub:'Casa de ar-condicionado do alojamento. Climatiza e ventila os cinco decks do bloco, de onde sobem os dutos pela prumada.'},
 mb_wtr:{n:'Potable water plant',t:'ind',eq:'desal',pub:'Tratamento de água potável. Filtra, trata e guarda a água doce que abastece cozinha, banheiros e chuveiros do bloco.'},
 mb_ups:{n:'LQ electrical room',t:'ind',eq:'elec',pub:'Sala elétrica do alojamento. Quadros de distribuição e baterias de reserva que alimentam os decks do bloco.'},
 mb_prov:{n:'Provisions store',t:'ind',eq:'store',pub:'Depósito de provisões. Recebe e guarda a comida seca e refrigerada trazida pelo barco de apoio, perto do elevador do bloco.'},
 mb_stp:{n:'Sewage treatment',t:'ind',eq:'waste',pub:'Tratamento de esgoto. Trata os dejetos do alojamento antes de devolvê-los ao mar.'},
 mb_inc:{n:'Incinerator room',t:'ind',eq:'utilities',pub:'Incinerador. Queima o lixo seco e os resíduos da cozinha antes de embarcar o que sobra.'}
});

/* Montagem de um pitch: PL.station(decks, extras). Uso: PL.assemble('A', {block:{org,size}, column:[ids], stack:{...}}) */
PL.INTRO={
 weather:'Convés de tempo (weather deck). O deck mais alto da plataforma, ao ar livre, com guindastes, baleeiras, balsas salva-vidas e a passagem do alojamento.',
 module:'Deck de módulos (module deck). Reúne a entrada do bloco de alojamento, a sala de controle, a área dos poços e os módulos de processo, separados por um firewall.',
 cellar:'Deck do porão (cellar deck). O deck mais baixo da plataforma, com área de carga, moonpool, geradores, bombas e o wellbay inferior.',
 lqE:'Deck E do alojamento. Cobertura do bloco, com acesso ao Heliporto A, casa de máquinas e antenas.',
 lqD:'Deck D do alojamento. Administração da plataforma: comunicações, sala de câmeras, escritórios, arquivo e as suítes de dois oficiais.',
 lqC:'Deck C do alojamento. Cabines de duas camas em duas alas, sala de convivência redonda e a saída para o weather deck.',
 lqB:'Deck B do alojamento. Quase todo lacrado, com cabines fechadas, sala de TV desativada e depósito.',
 lqA:'Deck A do alojamento. Restaurante, cozinha, sala de estar, enfermaria e a antessala de entrada para o module deck.'};
PL.assemble=(P,extra)=>{
  const X=PL[P];const order=['module','weather','cellar','lqE','lqD','lqC','lqB','lqA'];
  order.forEach(k=>{delete X[k].canvasDump;});const S=PL.station(order.map(k=>X[k]),{intro:PL.INTRO,pitch:P,stack:extra.stack});
  S.BLOCK=extra.block;S.COLUMN=extra.column;S.REV=extra.rev||null;return S;};

/* PITCH A "ANEIS" — module deck (+40). Placa 136 x 52. Bloco em (2,12) 34x28. */
PL.A=PL.A||{};
PL.A.module=(function(){
  const D=PL.deck({id:'module',lvl:'L-05',name:'Module deck',elev:'+40 m',dwg:'ØA-GA-02'});
  const C=PL.canvas(136,52);
  // galerias ao ar livre
  C.rect(0,0,136,2,':').rect(0,50,136,2,':').rect(0,2,2,48,':').rect(134,2,2,48,':');
  // contorno do bloco e nucleo (elevador, escada, antessala de entrada)
  C.rect(26,20,3,4,'L').rect(26,24,3,8,'S').rect(29,20,7,12,'e');
  // sob o bloco: casas de maquinas do alojamento (espinha de servico em x=22..26)
  C.rect(22,12,4,28,'.').rect(2,12,20,8,'H').rect(2,20,20,7,'Q').rect(2,27,20,6,'R').rect(2,33,20,7,'Y').rect(26,12,10,8,'a').rect(26,32,10,8,'b');
  // ===== lado limpo: anel em volta do bloco =====
  C.rect(2,9,22,3,'.').rect(22,4,3,8,'.').rect(25,4,22,3,'.').rect(36,7,3,12,'.');   // norte: jog pra cima em x=22
  C.rect(36,19,5,16,'.').rect(41,19,6,12,'.');                                         // hub na frente da entrada
  C.rect(2,40,34,3,'.').rect(36,35,3,7,'.').rect(36,40,11,3,'.');                     // sul: passagem estreita + praca sul
  // salas do lado limpo
  C.rect(2,2,9,7,'2').rect(11,2,11,7,'E').rect(25,7,11,5,'D');
  C.rect(39,7,8,6,'K').rect(39,13,8,6,'1').rect(41,31,6,9,'B');
  C.rect(2,43,12,7,'C').rect(14,43,12,7,'P').rect(26,43,15,7,'3').rect(41,43,6,7,'W');
  // firewall (x=47) com tres portas corta-fogo
  C.rect(47,2,1,48,'|').rect(47,4,1,3,'F').rect(47,24,1,3,'F').rect(47,40,1,2,'F');
  // ===== lado sujo: anel 1 (cluster de lama), barramento compartilhado, anel 2 (processo) e anel 3 (poco) =====
  C.rect(48,4,3,6,'.').rect(48,10,22,3,'.').rect(48,13,3,26,'.').rect(48,39,22,3,'.');   // anel 1
  C.rect(70,10,4,32,'.');                                                                 // barramento (8 do anel 1 e do anel 2)
  C.rect(74,10,36,3,'.').rect(74,39,36,3,'.').rect(107,13,3,26,'.');                      // anel 2
  C.rect(110,12,24,3,'.').rect(110,37,24,3,'.');                                          // anel em volta do wellbay (fecha na galeria E)
  // ilha 1 (lama) e ilha 2 (processo)
  C.rect(51,13,19,10,'M').rect(51,23,8,16,'l').rect(59,23,11,16,'h');
  C.rect(74,13,20,12,'A').rect(74,25,10,14,'O').rect(84,25,10,14,'V').rect(94,13,13,26,'U');
  // salas ao redor
  C.rect(51,2,10,8,'I').rect(61,2,9,8,'g').rect(74,2,20,8,'Z').rect(94,2,8,8,'x');
  C.rect(48,42,10,8,'X').rect(58,42,4,8,'c').rect(62,42,11,8,'T').rect(74,42,14,8,'q').rect(88,42,12,8,'J').rect(100,42,10,8,'N');
  C.rect(110,2,12,10,'f').rect(122,2,12,10,'y').rect(110,40,12,10,'z').rect(122,40,4,10,'u').rect(126,40,8,10,'w');
  C.rect(110,15,24,22,'G');
  const LEG={e:'mb_ent',L:['mb_lf',{d:[['e',.5,'open','r']]}],S:['mb_st',{d:[['e',.5,'open','r']]}],'2':'ms_les',E:'md3',D:'md12',K:'md2','1':'ms_cal',B:'md1',C:'mc_chg',P:'md_ppe','3':'ms_chl',W:'mt_w',
    I:'md_ins',g:'mx_gas1',M:'md5',l:'md_lab',h:'md_chem',A:'md6',O:'md7',V:'md10',U:'md9',Z:['md8',{d:[['s',.4,'gate','c'],['s',.8,'gate','c']]}],x:'mx_sto1',
    X:'md_scba',c:'mt_c',T:'md_trf',q:'mx_sto2',J:'md_inj',N:'md_wc',f:'mx_foam',y:'mx_gas2',z:'mx_sto3',u:'mt_e',w:'mx_sto4',G:'md4',H:'mb_hvac',Q:'mb_wtr',R:'mb_ups',Y:'mb_prov',a:'mb_stp',b:'mb_inc'};
  PL.ascii(D,C.rows(),LEG,{cpre:'mc',cname:{'30,10':'C-40·N1','60,11':'C-40·R1','72,25':'C-40·BUS','90,11':'C-40·R2','40,25':'Hub','48,25':'C-40·W','120,13':'C-40·W1'},
    blocks:[]});
  D.blocks.push({r:[2,12,34,28],n:'Living quarters above',open:true});
  D.stairs.push({x:34.5,y:26,w:3,h:6,dir:'up',lbl:'L-06'});
  PL.route(D,'p',[[49.5,36],[49.5,25.5],[44,25.5],[38.5,25.5]]);
  PL.route(D,'p',[[108.5,20],[108.5,38.5],[124,38.5],[124,42]]);
  PL.route(D,'p',[[38.5,10],[38.5,36],[38.5,41.5],[44,41.5],[44,44]]);
  PL.route(D,'s',[[60,11.5],[72,11.5],[72,40.5],[60,40.5],[50,40.5]]);
  PL.route(D,'s',[[3,10.5],[23,10.5],[23,5.5],[37,5.5]]);
  PL.finish(D,{autoVoid:true});
  D.cams.push({id:'cam03',x:42,y:25,corr:(D.corr.find(c=>42>c.r[0]&&42<c.r[0]+c.r[2]&&25>c.r[1]&&25<c.r[1]+c.r[3])||{}).id});
  D.canvasDump=C.dump();
  return D;
})();

/* PITCH A "ANEIS" — weather deck (+52): anel perimetral + pista interna em volta do laydown + ramos radiais. Bloco atravessa o deck em (2,12). */
PL.A=PL.A||{};
PL.A.weather=(function(){
  const D=PL.deck({id:'weather',lvl:'L-07',name:'Weather deck',elev:'+52 m',dwg:'ØA-GA-01',outdoor:true});
  const C=PL.canvas(176,70);const oy=14; // y do canvas = y real + 14 (a ponta do flare passa de y=0)
  const R=(x,y,w,h,ch)=>C.rect(x,y+oy,w,h,ch);
  // anel perimetral (aberto)
  R(2,2,132,2,':');R(2,48,132,2,':');R(0,2,2,48,':');R(134,2,2,48,':');
  // bloco que atravessa o conves
  R(2,12,34,28,'%');
  // pista interna em volta do laydown + ramos
  R(36,25,10,3,'.');R(46,9,52,3,'.');R(46,36,52,3,'.');R(46,12,3,24,'.');R(95,12,3,24,'.');
  R(70,4,3,5,'.');R(70,39,3,9,'.');R(98,22,12,3,'.');R(120,-4,3,6,':');R(136,40,14,3,':');
  R(38,44,8,4,'.');R(56,39,8,9,'.');R(118,42,12,6,'.');
  // conves (areas abertas) e salas
  R(49,12,46,24,'d');R(38,13,8,12,'m');R(38,28,8,5,'t');R(4,41,30,7,'b');R(46,39,10,9,'v');R(64,39,6,9,'p');R(100,40,18,8,'r');
  R(100,12,10,10,'g');R(100,25,10,10,'s');R(110,15,24,22,'T');
  R(4,4,32,8,'a');R(100,4,34,8,'c');R(30,-4,12,6,'1');R(86,-4,12,6,'2');R(76,50,12,6,'3');R(114,-14,15,10,'f');R(150,36,22,16,'o');R(150,20,22,16,'h');
  const LEG={m:'wd14',t:'wd_tc',b:'wd6',d:'wd3',v:'wd5',p:'wd7',g:'wd16',a:'wd17',c:'wd18',s:'wd15',r:'wd_raft',T:'wd4','1':'wd8','2':'wd9','3':'wd10',f:'wd11',o:'wd13',h:'wd_hb'};
  PL.ascii(D,C.rows(),LEG,{cpre:'ow',cname:{'40,40':'Walkway','60,24':'Inner ring','60,63':'Walkway S'},blocks:[{n:'Living quarters',sub:'DECK C EXITS HERE',d:[['e',.5,'door','c']]}]});
  const sh=a=>{a[1]-=oy;};
  D.rooms.forEach(r=>sh(r.r));D.corr.forEach(c=>sh(c.r));D.voids.forEach(sh);D.blocks.forEach(b=>sh(b.r));
  D.stairs.push({x:44,y:46.5,w:2.2,h:3.6,dir:'dn',lbl:'L-05'},{x:60,y:46,w:2.2,h:3.6,dir:'dn',lbl:'L-05'},{x:124,y:45,w:2.2,h:3.6,dir:'dn',lbl:'L-05'});
  PL.route(D,'p',[[37,26.5],[47.5,26.5],[47.5,37.5],[60,37.5],[60,44]]);
  PL.route(D,'p',[[47.5,26.5],[47.5,10.5],[71.5,10.5],[71.5,5]]);
  PL.route(D,'s',[[96.5,13],[96.5,37.5],[120,37.5],[124,43]]);
  PL.route(D,'s',[[3,3],[133,3]]);
  PL.finish(D,{autoVoid:false});
  D.canvasDump=C.dump();
  return D;
})();

/* PITCH A "ANEIS" — cellar deck (+28): rede irregular em volta do moonpool. */
PL.A=PL.A||{};
PL.A.cellar=(function(){
  const D=PL.deck({id:'cellar',lvl:'L-03',name:'Cellar deck',elev:'+28 m',dwg:'ØA-GA-03'});
  const C=PL.canvas(136,52);
  C.rect(0,0,136,2,':').rect(134,2,2,48,':');
  // rede irregular de corredores
  C.rect(2,13,28,3,'.').rect(27,16,3,7,'.').rect(27,20,22,3,'.').rect(27,23,3,21,'.').rect(15,44,33,4,'.');       // oeste
  C.rect(49,13,3,22,'.').rect(49,33,28,3,'.').rect(74,12,3,24,'.').rect(49,12,28,3,'.');                          // anel do moonpool
  C.rect(58,36,4,12,'.');                                                                                        // desce pra escada C
  C.rect(77,22,19,3,'.').rect(88,25,3,8,'.').rect(88,30,22,3,'.').rect(93,2,3,20,'.');                           // leste
  C.rect(106,33,4,12,'.').rect(106,44,28,4,'.');                                                                 // sudeste
  // salas
  C.rect(2,2,46,11,'d').rect(2,16,17,20,'a').rect(19,16,8,12,'w').rect(19,28,8,8,'k');
  C.rect(30,23,10,12,'y').rect(40,23,9,12,'v').rect(30,35,19,9,'p').rect(2,36,13,12,'s').rect(15,36,12,8,'x');
  C.rect(52,15,22,18,'M').rect(49,36,9,8,'n').rect(62,36,12,10,'r').rect(74,36,12,10,'f');
  C.rect(49,2,14,10,'h').rect(63,2,14,10,'b').rect(77,2,16,10,'e').rect(77,12,16,10,'q').rect(96,2,14,20,'u');
  C.rect(30,13,18,7,'K').rect(96,22,14,8,'L').rect(77,25,11,11,'A').rect(88,33,8,17,'S').rect(96,43,10,7,'P');
  C.rect(110,15,24,22,'W').rect(110,2,24,13,'g').rect(96,33,10,10,'R').rect(122,38,12,6,'E').rect(110,37,12,7,'z');
  const LEG={d:'cd4',a:'cd1',w:'cd10',k:'cd_stk',y:'cd2',v:'cd6',p:'cd12',s:'cd14',x:['cd15',{d:[['s',.5,'weld','c']]}],M:'cd5',n:'cd8',r:'cd9',f:'cd11',
    h:'cd_hpu',b:'cd_bal',e:'cd3',q:'cd_pwt',u:'cd_swp',W:'cd7',g:'cd_egen',R:'cd_rsk',E:'cd_emb',z:'cd13',K:'cd_wks',L:'cd_lube',A:'cd_air',S:'cd_spr',P:'cd_scs'};
  PL.ascii(D,C.rows(),LEG,{cpre:'cc',cname:{'10,14':'C-28·W','38,21':'C-28·N2','50,24':'C-28·R','80,23':'C-28·E','110,31':'C-28·E2','30,46':'C-28·B'}});
  D.stairs.push({x:44,y:46.5,w:2.2,h:3.6,dir:'up',lbl:'L-05'},{x:60,y:46,w:2.2,h:3.6,dir:'up',lbl:'L-05'},{x:124,y:45,w:2.2,h:3.6,dir:'up',lbl:'L-05'});
  PL.route(D,'p',[[28.5,30],[28.5,21.5],[50.5,21.5]]);
  PL.route(D,'p',[[108,40],[108,46],[124,46]]);
  PL.route(D,'p',[[50.5,34.5],[60,34.5],[60,44]]);
  PL.route(D,'s',[[3,14.5],[28.5,14.5],[28.5,21.5]]);
  PL.route(D,'s',[[135,10],[135,46]]);
  PL.finish(D,{autoVoid:true});
  D.cams.push({id:'cam04',x:63,y:24,room:'cd5'},{id:'cam02',x:122,y:26,room:'cd7'});
  D.canvasDump=C.dump();
  return D;
})();

/* PITCH A "ANEIS" — bloco de alojamento (34 x 28 m, origem global (2,12)). Nucleo fixo: elevador (24,8,3,4) e escada (24,12,3,8).
   Cada deck usa um anel/arranjo diferente de corredores. */
PL.A=PL.A||{};
(function(){
  const mk=(id,sfx,name,elev)=>{const D=PL.deck({id,lvl:'L-06',name:'Living quarters · Deck '+sfx,elev,dwg:'ØA-LQ-'+sfx,org:[2,12]});return D;};
  const fin=(D,C,LEG,o)=>{PL.ascii(D,C.rows(),LEG,Object.assign({cpre:D.id+'c'},o||{}));return D;};
  const core=(C,s)=>{C.rect(24,8,3,4,'L').rect(24,12,3,8,'S');return {L:s+'_lf',S:s+'_st'};};

  /* ---------- Deck E (+58): corredor em L, casa de maquinas, acesso ao heliponto ---------- */
  PL.A.lqE=(function(){
    const D=mk('lqE','E','Living quarters · Deck E','+58 m'),C=PL.canvas(34,28);core(C,'le');
    C.rect(8,9,16,3,'.').rect(21,9,3,11,'.');                                    // L que chega no nucleo
    C.rect(0,0,16,9,'4').rect(16,0,18,9,'6').rect(27,9,7,11,'1').rect(8,12,13,9,'2').rect(0,9,8,12,'7');
    PL.ascii(D,C.rows(),{L:'le_lf',S:'le_st','4':'lqE4','6':'lqE6','1':['lqE1',{d:[['w',.5,'door','r']]}],'2':'lqE2','7':'lqE7'},{cpre:'lqEc',cname:{'12,10':'Corridor E'}});
    PL.route(D,'p',[[9.5,10.5],[22.5,10.5],[22.5,16],[23.5,16]]);
    PL.finish(D,{autoVoid:true});return D;})();

  /* ---------- Deck D (+54): anel em volta de um miolo de escritorios ---------- */
  PL.A.lqD=(function(){
    const D=mk('lqD','D','Living quarters · Deck D','+54 m'),C=PL.canvas(34,28);core(C,'ld');
    C.rect(5,5,29,3,'.').rect(5,5,3,18,'.').rect(21,8,3,15,'.').rect(5,20,29,3,'.').rect(31,8,3,12,'.');   // anel + anel pequeno em volta do nucleo
    C.rect(0,0,9,5,'1').rect(9,0,9,5,'g').rect(18,0,9,5,'2').rect(27,0,7,5,'4');                              // norte
    C.rect(0,5,5,8,'8').rect(0,13,5,10,'6');                                                                  // oeste
    C.rect(8,8,13,6,'5').rect(8,14,13,6,'a');                                                                 // miolo
    C.rect(27,8,4,12,'c').rect(0,23,12,5,'t').rect(12,23,11,5,'y').rect(23,23,11,5,'z');
    PL.ascii(D,C.rows(),{L:'ld_lf',S:'ld_st','1':'lqD1',g:['ls_gun',{d:[['s',.5,'door','c'],['w',.5,'door','r']]}],'2':'lqD2','4':'lqD4','8':'lqD8','6':'lqD6','5':'lqD5',a:'ls_aru',c:'lqD3',t:'lqD10',y:'lqD11',z:'lqD12'},
      {cpre:'lqDc',cname:{'6,10':'Corridor D1','12,6':'Corridor D2'}});
    PL.route(D,'p',[[6.5,21.5],[6.5,6.5],[22.5,6.5],[22.5,16],[23.5,16]]);
    PL.route(D,'s',[[32.5,6.5],[32.5,21.5],[8,21.5]]);
    PL.finish(D,{autoVoid:true});return D;})();

  /* ---------- Deck C (+50): alas de cabines nas pontas, sala redonda no centro, anel em volta ---------- */
  PL.A.lqC=(function(){
    const D=mk('lqC','C','Living quarters · Deck C','+50 m · crosses the weather deck'),C=PL.canvas(34,28);core(C,'lc');
    C.rect(5,2,24,3,'.').rect(5,2,3,24,'.').rect(5,23,24,3,'.').rect(27,0,2,28,'.');                              // anel em volta do miolo
    C.rect(0,2,5,24,'w').rect(29,0,5,12,'e').rect(29,12,5,4,'x').rect(29,16,5,12,'E');
    C.rect(8,5,12,12,'o').rect(8,17,9,6,'b').rect(17,17,7,6,'l').rect(20,5,4,6,'n').rect(20,11,4,6,'s');
    PL.ascii(D,C.rows(),{L:'lc_lf',S:'lc_st',w:['lc_w',{cab:{n:6,side:'e'}}],e:['lc_e',{cab:{n:3,side:'w'},n:'Cabins · east wing N'}],E:['lc_e2',{cab:{n:3,side:'w'},n:'Cabins · east wing S',eq:'cabinrow',t:'hab',pub:'Cabines da ala leste. Três cabines de duas camas, cada uma com escotilha para o lado de fora e porta própria para o corredor.'}],
      x:['lqC8',{d:[['w',.5,'door','c'],['e',.5,'door','x']]}],o:['lc_com',{d:[['n',.5,'open','c'],['w',.5,'open','c']]}],b:'lc_bath',l:'lc_lau',n:'lqC4',s:['lqC7',{d:[['w',.5,'door','r']]}]},
      {cpre:'lqCc',cname:{'6,12':'Corridor C1','15,3':'Corridor C2'}});
    PL.route(D,'p',[[28,14],[16,14]].map(p=>p)); // so pra existir; refeito abaixo
    D.esc.length=0;
    PL.route(D,'p',[[6.5,6],[6.5,24.5],[26,24.5],[28,24.5],[28,14]]);
    PL.route(D,'s',[[28,2],[6,3.5]]);
    PL.finish(D,{autoVoid:true});return D;})();

  /* ---------- Deck B (+46): quase tudo lacrado; corredor em T com becos ---------- */
  PL.A.lqB=(function(){
    const D=mk('lqB','B','Living quarters · Deck B','+46 m · mostly sealed'),C=PL.canvas(34,28);core(C,'lb');
    C.rect(2,12,22,3,'.').rect(21,8,3,4,'.').rect(5,3,3,9,'.').rect(14,15,3,10,'.');
    C.rect(8,3,10,9,'t').rect(18,3,6,5,'g').rect(2,15,12,5,'c').rect(17,15,7,9,'w').rect(0,3,5,9,'d').rect(2,20,12,5,'s');
    PL.ascii(D,C.rows(),{L:'lb_lf',S:'lb_st',t:'lqB2',g:'lqB5',c:['lb_c1',{cab:{n:3,side:'n'}}],w:'lqB6',d:['lb_c3',{cab:{n:2,side:'e'}}],s:'lb_sto'},{cpre:'lqBc',cname:{'10,13':'Corridor B1'}});
    PL.route(D,'p',[[3,13.5],[22.5,13.5],[22.5,16],[23.5,16]]);
    PL.finish(D,{autoVoid:true});return D;})();

  /* ---------- Deck A (+42): restaurante aberto pro lounge, cozinha colada, antessala da entrada ---------- */
  PL.A.lqA=(function(){
    const D=mk('lqA','A','Living quarters · Deck A','+42 m'),C=PL.canvas(34,28);core(C,'la');
    C.rect(21,5,3,18,'.').rect(21,5,13,3,'.').rect(21,20,13,3,'.').rect(27,8,7,3,'.').rect(27,17,7,3,'.').rect(10,13,11,3,'.');
    C.rect(0,0,13,13,'R').rect(13,0,8,13,'U').rect(0,13,10,8,'K').rect(0,21,5,7,'p').rect(5,21,5,7,'c').rect(10,21,5,7,'f').rect(15,21,6,7,'d').rect(10,16,11,5,'i');
    C.rect(27,11,4,6,'v').rect(31,11,3,6,'s').rect(21,0,13,5,'G').rect(21,23,13,5,'Z');
    PL.ascii(D,C.rows(),{L:'la_lf',S:'la_st',R:['la_rest',{d:[['s',.8,'door','c'],['e',.5,'wide','r']]}],U:'la_lng',K:['la_kit',{d:[['n',.5,'open','r'],['e',.19,'door','c'],['s',.25,'door','r'],['s',.85,'door','r']]}],
      p:['la_pan',{d:[['n',.5,'door','r']]}],c:['la_cold',{d:[['n',.5,'door','r']]}],f:['la_frz',{d:[['w',.5,'door','r']]}],d:['la_fos',{d:[['n',.3,'door','r'],['e',.14,'door','c']]}],i:'la_inf',G:'la_gym',Z:'la_cln',
      v:['la_vst',{d:[['n',.5,'door','c'],['e',.5,'door','r']]}],s:['la_stp',{d:[['w',.5,'open','r']]}]},{cpre:'lqAc',cname:{'12,14':'Corridor A1','22,12':'Corridor A2'}});
    PL.route(D,'p',[[11,14.5],[22.5,14.5],[22.5,6.5],[32.5,6.5],[32.5,9.5]]);
    PL.route(D,'s',[[22.5,21.5],[32.5,21.5],[32.5,18.5]]);
    D.cams.push({id:'cam01',x:6,y:6,room:'la_rest'});
    PL.finish(D,{autoVoid:true});return D;})();
})();

PL.assemble('A',{rev:'A1',block:{org:[2,12],size:[34,28]},column:['wd4','md4','cd7'],stack:{blk:[2,12,34,28],shafts:[[100,26]],crane:[98,0],moon:[63,24],plate:[136,52]}});

delete window.PL;delete window.OLDR;
})();
