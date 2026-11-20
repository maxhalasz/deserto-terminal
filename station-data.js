/* ============================================================
   ØDEMARK A. — dados do mapa (PUBLICO: geometria + texto que o jogador pode ler)
   Textos do Guardiao ficam em station-gm-data.js (so o guardiao.html carrega).
   Unidade: metros. Retangulos [x, y, w, h]. Rooms e corredores sao COLADOS (bordas coincidentes):
   a espessura de parede e desenhada centrada na borda. Portas ficam sobre a parede compartilhada.
   ============================================================ */
(function(){
const LEVELS=[
  {id:'weather', tag:'L-07', name:'Weather deck',     elev:'+52 m'},
  {id:'quarters',tag:'L-06', name:'Living quarters',  elev:'+42 / +58 m'},
  {id:'module',  tag:'L-05', name:'Module deck',      elev:'+40 m'},
  {id:'cellar',  tag:'L-03', name:'Cellar deck',      elev:'+28 m'}
];
// ids antigos do terminal (guardados no Firebase) -> ids novos
const LEGACY={helipad:'weather',control:'module',mess:'quarters',drill:'cellar'};
const DECK_LEVEL={weather:'weather',module:'module',cellar:'cellar',lqE:'quarters',lqD:'quarters',lqC:'quarters',lqB:'quarters',lqA:'quarters'};

const R=(id,n,x,y,w,h,t,o)=>Object.assign({id,n,r:[x,y,w,h],t:t||'ind'},o||{});
const C=(id,x,y,w,h,n,g,open)=>{const o={id,r:[x,y,w,h],n:n||''};if(g)o.g=g;if(open)o.open=true;return o;};

/* ---------- auto-portas: uma porta em cada lado que encosta num corredor (max 2) ---------- */
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
  return out.slice(0,2);
}
function build(deck){
  deck.rooms.forEach(r=>{if(r.cab){r.d=[];for(let i=0;i<r.cab.n;i++)r.d.push([r.cab.side,Math.round((i+.5)/r.cab.n*1000)/1000,'cdoor','c']);}else if(!r.d)r.d=autoDoors(r,deck.corr);});
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  const eat=a=>{x0=Math.min(x0,a[0]);y0=Math.min(y0,a[1]);x1=Math.max(x1,a[0]+a[2]);y1=Math.max(y1,a[1]+a[3]);};
  deck.rooms.forEach(r=>eat(r.r));deck.corr.forEach(c=>eat(c.r));(deck.voids||[]).forEach(v=>eat(v));
  deck.bbox=[x0,y0,x1-x0,y1-y0];
  return deck;
}

/* ============================== MODULE DECK +40 ==============================
   Lado limpo (oeste): ala dos oficiais (norte), ala da tripulacao (sul), lounge redondo no meio, tronco N-S.
   Firewall em x 46-47.2 com tres fire doors. Lado sujo (leste): rede de corredores que dobram e se cruzam. */
const module_=build({
 id:'module',lvl:'L-05',name:'Module deck',elev:'+40 m',dwg:'ØA-GA-02',
 corr:[
  // --- lado limpo ---
  C('mc_s1',3,7.4,43,2.4,'C-40·N1','mg_s1'),C('mc_f1',46,7.4,1.2,2.4,'FD-1','mg_s1'),
  C('mc_m',31,29.7,15,3,'C-40·M','mg_m'),C('mc_f2',46,29.7,1.2,3,'FD-2','mg_m'),
  C('mc_c1',3,57,43,2.4,'C-40·S1','mg_c1'),C('mc_f3',46,57,1.2,2.4,'FD-3','mg_c1'),
  C('mc_t',41.2,9.8,2.4,47.2,'C-40·T'),C('mc_k1',22.8,9.8,2.4,14.4,'C-40·K1'),C('mc_k2',22.8,38.2,2.4,18.8,'C-40·K2'),
  // --- galerias externas (ao ar livre) ligando o oeste e o leste por fora ---
  C('mw_n',1,-0.4,125,2,'Gallery N','mg_gn',1),C('mw_nl1',70,1.6,2.4,1.8,'','mg_gn',1),C('mw_nl2',100,1.6,2.4,1.8,'','mg_gn',1),
  C('mw_w',1,1.6,2,63.4,'Gallery W','mg_gw',1),C('mw_e',124,1.6,2,63.4,'Gallery E','mg_ge',1),
  C('mw_s',1,65,125,2,'Gallery S','mg_gs',1),C('mw_sl1',100,59.4,2.4,5.6,'','mg_gs',1),C('mw_sl2',60,59.4,2.4,5.6,'','mg_gs',1),
  // --- lado sujo ---
  C('mc_dn1',47.2,7.4,22.8,2.4,'C-40·N1','mg_dn'),C('mc_dn2',70,3.4,2.4,6.4,'','mg_dn'),C('mc_dn3',72.4,3.4,51.6,2.4,'C-40·N3','mg_dn'),
  C('mc_dn4',97.6,5.8,2.4,18.7,'C-40·N4'),C('mc_p1',67.6,9.8,2.4,17.7,'C-40·P1'),
  C('mc_dm1',47.2,29.7,24.8,3,'C-40·M1','mg_dm'),C('mc_lk',69.6,27.5,2.4,2.2,'','mg_dm'),C('mc_dm3',67.6,24.5,56.4,3,'C-40·M3','mg_dm'),
  C('mc_p3',69.6,32.7,2.4,24.3,'C-40·P3'),C('mc_p4',96,27.5,2.4,29.5,'C-40·P4'),
  C('mc_ds1',47.2,57,73.8,2.4,'C-40·S1','mg_ds')],
 firewall:[[46,1.6,1.2,5.8],[46,9.8,1.2,19.9],[46,32.7,1.2,24.3],[46,59.4,1.2,5.6]],
 fireDoors:[{id:'FD-1',x:46.6,y:8.6,v:1},{id:'FD-2',x:46.6,y:31.2,v:1},{id:'FD-3',x:46.6,y:58.2,v:1}],
 voids:[[47.2,9.8,2.8,12.3],[47.2,40.3,2.8,16.7],[70,9.8,2.4,14.7],[72,27.5,24,5.2],[43.6,9.8,2.4,19.9],[43.6,32.7,2.4,24.3],[25.2,17,16,4],[4,17,18.8,7.2],[4,38.2,9,11.4],[13,38.2,9.8,2.8],[25.2,38.2,5.8,2],[121,47,3,4.8],[72.4,1.6,27.6,1.8],[102.4,1.6,21.6,1.8],[47.2,59.4,12.8,5.6],[62.4,59.4,37.6,5.6],[102.4,59.4,21.6,5.6]],
 rooms:[
  // ---- lado limpo: ala dos oficiais ----
  R('md_off','Officers\' cabins',4,2.8,41.4,4.6,'hab',{cab:{n:9,side:'s'},eq:'cabinrow',pub:'Nine small cabins along the north hull, two bunks each. Brass name plates on the doors. A porthole the size of a dinner plate in every one.'}),
  R('md_ow','Officers\' washroom',4,9.8,7,7.2,'hab',{eq:'wash',pub:'Showers and basins for the officers. Tiled white and always warm.'}),
  R('md_om','Officers\' mess',11,9.8,11.8,7.2,'hab',{eq:'dining',pub:'A table for twelve with place cards. The good crockery is locked behind glass.'}),
  R('md_cl','Clinic',25.2,9.8,8,7.2,'hab',{eq:'clinic',pub:'Two beds and a locked drug cabinet. A scale and a height chart on the wall.'}),
  R('md_ol','Laundry',33.2,9.8,8,7.2,'hab',{eq:'laundry',pub:'Industrial washers and dryers. A nylon line across the room.'}),
  // ---- lounge redondo e arredores ----
  R('md_gym','Gym',4,24.2,13,14,'hab',{eq:'gym',d:[['e',.5,'open','r']],pub:'Free weights and two rowing machines. A mirror with a crack across one corner.'}),
  R('md0','Lounge',17,24.2,14,14,'hab',{shape:'round',eq:'roundlounge',d:[['n',.5,'open','c'],['s',.5,'open','c'],['e',.5,'open','c'],['w',.5,'open','r']],pub:'Sala redonda de sofás e quadros nas paredes, para relaxar perto dos quartos ou de manhã. Armários individuais ao longo da parede, um para cada pessoa, e duas máquinas de venda que ninguém usa de verdade. O relógio sobre a porta anda cinco minutos atrasado.'}),
  R('md1','Boot room',31,21,10.2,8.7,'ind',{eq:'lockers',pub:'Steel lockers with names on tape. Boots paired on a grated duckboard. A yellow stripe cuts the floor in two: clean on one side, dirty on the other.'}),
  R('md2','Control room',31,32.7,10.2,7.5,'ind',{eq:'console',lp:'t',pub:'Dim on purpose. Monitors over a mimic panel of small lamps. The chair backs are polished from use.'}),
  R('md3','Electrical shop',25.2,40.2,10.8,8.8,'ind',{eq:'elec',lp:'t',pub:'A shadow board with the outline of every tool. Three outlines are empty.'}),
  R('md12','Dry store',36,40.2,5.2,8.8,'ind',{eq:'store',pub:'Shelving to the ceiling. Spare parts, tagged and counted.'}),
  // ---- ala da tripulacao ----
  R('md11','Crew washroom',4,49.6,9,7.4,'hab',{eq:'wash',pub:'Showers and basins for the crew. A drain in the middle of the floor.'}),
  R('md_cd','Crew day room',13,41,9.8,16,'hab',{eq:'crewday',pub:'A sofa, a table and a card game left unfinished.'}),
  R('md_lc','Crew laundry',25.2,49,8,8,'hab',{eq:'laundry',pub:'Washers and a drying rack. Detergent hangs in the air.'}),
  R('md_ppe','PPE locker',33.2,49,8,8,'ind',{eq:'ppe',pub:'Coveralls, helmets and harnesses on labelled shelves.'}),
  R('md_crw','Crew cabins',4,59.4,41.4,4.6,'hab',{cab:{n:9,side:'n'},eq:'cabinrow',pub:'Nine small cabins along the south hull, two bunks each. Names on tape. A porthole the size of a dinner plate in every one.'}),
  // ---- lado sujo ----
  R('md_ins','Instrument shop',47.2,2.4,10,5,'ind',{eq:'instr',pub:'Calibration benches and spare gauges in labelled drawers.'}),
  R('md_scba','SCBA store',57.2,2.4,7,5,'ind',{eq:'dive',pub:'Breathing apparatus in wall cabinets. Every gauge reads full.'}),
  R('md_trf','Transformer room',64.2,2.4,5.8,5,'ind',{eq:'xfmr',pub:'Three oil-filled transformers. The hum is higher than the compressors.'}),
  R('md_swu','Stair W · up',47.2,22.1,2.8,7.6,'stair',{eq:'stair',dir:'up',to:'L-07',pub:'Stairs to the weather deck.'}),
  R('md_swd','Stair W · down',47.2,32.7,2.8,7.6,'stair',{eq:'stair',dir:'dn',to:'L-03',pub:'Stairs to the cellar deck.'}),
  R('md4','M10 · Wellbay',50,9.8,17.6,19.9,'ind',{eq:'wellheads',pub:'Twenty-four wellheads in rows on a grated floor, open to the cellar deck below. A constant hiss of gas overhead.'}),
  R('md5','M11 · Mud room',50,32.7,19.6,17,'ind',{eq:'mud',pub:'Shale shakers throwing grey mud. Everything is coated in it, the lab window included.'}),
  R('md_lab','Mud lab',50,49.7,7.2,7.3,'ind',{eq:'lab',pub:'A fume hood and a bench of sample jars with grey sediment.'}),
  R('md_chem','Chemical store',57.2,49.7,12.4,7.3,'ind',{eq:'chemstore',pub:'Sacks and drums behind a chain. Hazard diamonds on every label.'}),
  R('md6','M20 · Separation',72.4,5.8,25.2,18.7,'ind',{eq:'separators',pub:'A forest of insulated pipe. Two horizontal vessels and the noise to keep you from talking.'}),
  R('md8','M22 · Decommissioned',100,5.8,24,18.7,'off',{eq:'sealed',st:'sealed',d:[['s',.4,'gate','c'],['n',.5,'gate','c']],pub:'Mesh gate with chain and red lock-out seal. A lock-out tag on every valve. Laminated notice dated 2013, peeling at the corner.'}),
  R('md7','M21 · Compression',72,32.7,13,24.3,'ind',{eq:'compressors',pub:'Three compressors the size of a bus. A low hum that climbs through the soles of your boots.'}),
  R('md10','M31 · Workshop',85,32.7,11,24.3,'ind',{eq:'workshop',pub:'A lathe and swarf on the floor. A radio playing static. Three burn marks on the bench.'}),
  R('md9','M30 · Utilities',98.4,27.5,25.6,19.5,'ind',{eq:'utilities',d:[['n',.3,'door','c'],['w',.5,'door','c'],['e',.5,'door','c']],pub:'Hot air and engine oil. Two large generators, one under a tarp.'}),
  R('md_inj','M23 · Chemical injection',98.4,47,12,10,'ind',{eq:'inj',pub:'Three dosing tanks and a row of small pumps. The valve tags are in two languages.'}),
  R('md_wc','WC and janitor',110.4,47,10.6,10,'ind',{eq:'wash',pub:'A cleaning cart, a mop bucket and two stalls.'}),
  R('md_se','Stair E · up',121,51.8,3,7.6,'stair',{eq:'stair',dir:'up',to:'L-07',pub:'Stairs to the weather deck.'})],
 stairs:[],
 fire:[[20,0.6],[80,0.6],[2,30],[125,30],[20,66],[80,66],[8,8.6],[30,8.6],[42.4,20],[42.4,45],[8,58.2],[34,58.2],[50,8.6],[66,31.2],[80,26],[112,26],[100,58.2],[84,58.2],[71,45]],
 mcp:[[60,0.6],[2,50],[125,50],[60,66],[18,8.6],[38,8.6],[42.4,35],[18,58.2],[38,58.2],[56,31.2],[90,26],[104,26],[110,58.2],[71,38],[97.2,40],[60,4.6]],
 esc:[
  {k:'p',pts:[[27,31.2],[48.6,31.2],[48.6,24]],need:['mc_m','mc_f2','mc_dm1']},
  {k:'p',pts:[[8,8.6],[42.4,8.6],[42.4,31.2]],need:['mc_s1','mc_t']},
  {k:'p',pts:[[8,58.2],[42.4,58.2],[42.4,31.2]],need:['mc_c1','mc_t']},
  {k:'p',pts:[[80,58.2],[119,58.2],[122.5,58.2],[122.5,54]],need:['mc_ds1']},
  {k:'s',pts:[[56,8.6],[68.8,8.6],[68.8,26]],need:['mc_dn1','mc_p1']},
  {k:'s',pts:[[60,58.2],[70.8,58.2],[70.8,35]],need:['mc_ds1','mc_p3']},
  {k:'s',pts:[[2,60],[2,0.6],[60,0.6]],need:['mw_w','mw_n']},
  {k:'s',pts:[[125,10],[125,64],[100,66]],need:['mw_e','mw_s']},
  {k:'s',pts:[[80,0.6],[125,0.6],[125,20]],need:['mw_n','mw_e']}],
 cams:[{id:'cam03',x:56,y:31.2,corr:'mc_dm1'}]
});

/* ============================== WEATHER DECK +52 ============================== */
const weather_=build({
 id:'weather',lvl:'L-07',name:'Weather deck',elev:'+52 m',dwg:'ØA-GA-01',outdoor:true,
 corr:[
  C('wc_n',2,2,106,2,'Walkway N'),C('wc_s',2,51,106,2,'Walkway S'),C('wc_w',2,2,2,51,'Walkway W'),C('wc_e',106,2,2,51,'Walkway E'),
  C('wc_x1',4,36,32,2,'Cross walkway'),C('wc_v1',36,4,2,47,'Walkway V1'),C('wc_v2',62,4,2,47,'Walkway V2'),C('wc_v3',80,4,2,47,'Walkway V3'),C('wc_x2',82,21,24,2,'Cross walkway'),
  C('wc_fb',108,12,22,2.4,'Flare bridge'),C('wc_bb',108,36,18,2.4,'Bridge B')],
 rooms:[
  R('wd1','Helideck',4,4,32,32,'ext',{eq:'heli',pub:'A 22 m circle with the H worn off. Safety net slanting outward. A yellow rope with a sign across the access.'}),
  R('wd2','Engine house',4,38,32,13,'ind',{eq:'engine',pub:'Lift motor behind a grille, two grey sprinkler tanks. Smell of hot grease.'}),
  R('wd3','Laydown area',38,4,24,47,'ext',{eq:'containers',pub:'Containers stacked two high and a crane hook swinging by itself. The windiest spot on the platform.'}),
  R('wd4','Tower top',64,4,16,22,'ext',{eq:'tower',pub:'White lattice climbing fifty metres. A cage ladder with no end in sight.'}),
  R('wd5','Gas vent',64,28,16,23,'ext',{eq:'vent',pub:'A grey stack, paint peeling in bands. When it opens, the whole platform hears it.'}),
  R('wd6','Lifeboats',82,4,24,17,'ind',{eq:'lifeboats',pub:'Four orange capsules in inclined cradles, seventy seats each. The muster board is mostly blank lines.'}),
  R('wd7','PPE store',82,23,24,16,'ind',{eq:'ppe',pub:'Harnesses and helmets in rows. A personnel basket in the corner, dried kelp caught in the mesh.'}),
  R('wd14','Muster station 3',82,39,24,12,'ext',{eq:'muster',pub:'Assembly point. Painted number three on the deck.'}),
  R('wd8','Crane 1',16,-4,12,6,'ext',{eq:'crane',pub:'Glazed cab high on the pedestal. Sixty metre boom.'}),
  R('wd9','Crane 2',60,-4,12,6,'ext',{eq:'crane',pub:'An office chair lashed down with rope inside the cab.'}),
  R('wd10','Crane 3',60,53,12,6,'ext',{eq:'crane',pub:'Cracked glass in one corner, mended with tape gone yellow.'}),
  R('wd11','Flare boom',130,8,14,10,'ext',{eq:'flare',pub:'The end of an eighty metre walkway with no shelter and no stop. The guard rail hums in the wind.'}),
  R('wd13','Old platform',126,28,24,24,'off',{eq:'old',st:'sealed',d:[],pub:'Orange with rust from base to top. A second helipad marking, barely visible. No lights, no antennas.'})],
 stairs:[{x:37,y:27,w:2,h:3.4,dir:'dn',lbl:'L-05'},{x:107,y:27,w:2,h:3.4,dir:'dn',lbl:'L-05'}],
 fire:[[10,3],[50,3],[90,3],[10,52],[50,52],[90,52],[3,26],[107,10],[107,44]],
 mcp:[[30,3],[70,3],[100,3],[30,52],[70,52],[3,14],[3,40],[107,26]],
 esc:[
  {k:'p',pts:[[37,10],[37,27]],need:['wc_v1']},{k:'p',pts:[[37,46],[37,27]],need:['wc_v1']},
  {k:'p',pts:[[107,10],[107,27]],need:['wc_e']},{k:'p',pts:[[107,46],[107,27]],need:['wc_e']}],
 cams:[]
});

/* ============================== CELLAR DECK +28 ==============================
   Anel de corredor em volta do moonpool; corredor de carga que dobra para o leste; ramais, becos e salas pequenas. */
const cellar_=build({
 id:'cellar',lvl:'L-03',name:'Cellar deck',elev:'+28 m',dwg:'ØA-GA-03',
 corr:[
  C('cc_w',17,31.8,28.6,2.8,'C-28·W','cg_w'),C('cc_cw',23.6,3,2.4,28.8,'C-28·N1'),C('cc_n1',56,15.6,2.4,6,''),
  C('cc_rn',45.6,21.6,26.8,2.4,'C-28·R','cg_r'),C('cc_rs',45.6,42,26.8,2.4,'','cg_r'),C('cc_rw',45.6,24,2.4,18,'','cg_r'),C('cc_re',70,24,2.4,18,'','cg_r'),
  C('cc_ne2',72.4,21.6,7.6,2.4,''),C('cc_ne',80,3,2.4,21,'C-28·N2'),C('cc_e',72.4,31.8,30,2.8,'C-28·E'),
  C('cc_sw',17,34.6,2.4,19.8,'C-28·S1'),C('cc_sb',19.4,52,80.6,2.4,'C-28·B'),C('cw_ee',100,52,20.4,2.4,'C-28·B2','cg_e'),
  C('cw_n',1,0,121.4,2,'Gallery N','cg_n',1),C('cw_nl1',23.6,2,2.4,1,'','cg_n',1),C('cw_nl2',80,2,2.4,1,'','cg_n',1),C('cw_e',120.4,2,2,62,'Gallery E','cg_e',1)],
 voids:[[26,15.6,30,6],[58.4,15.6,21.6,6],[19.4,34.6,26.2,2],[29.4,36.6,8.2,7.8],[82.4,21.6,16,2.4]],
 rooms:[
  R('cd1','Machine room',4,3,19.6,22,'ind',{eq:'sauna',pub:'A maze of silver ductwork overhead. A plywood sauna with a diverted steam valve. The steam is too thick to see the far wall.'}),
  R('cd4','Cargo area',26,3,54,12.6,'ind',{eq:'cargo',pub:'Eight metre ceiling, yellow lifting marks on the deck and an opening to the sky. Containers form aisles.'}),
  R('cd7','Lower wellbay',82.4,3,36,18.6,'ind',{eq:'xmas',pub:'The largest enclosed space on the platform. Christmas trees in rows. The echo comes back half a second late.'}),
  R('cd2','Drying room',4,27.4,13,11,'ind',{eq:'drying',pub:'Two rows of dripping coveralls over a heater. They sway slowly, all the time.'}),
  R('cd3','Desalination',4,40,13,12,'ind',{eq:'desal',pub:'White pipework and a high whine. A permanent puddle on the floor.'}),
  R('cd10','Switchgear',19.4,36.6,10,15.4,'ind',{eq:'switch',pub:'Electrical cabinets with hand-written labels. Smell of ozone. An emergency light that has always flickered.'}),
  R('cd6','Dive room',37.6,36.6,8,7.8,'ind',{eq:'dive',pub:'Cylinders in racks and a suit hanging. A duty board with a marker that no longer wipes. A clipboard with the last name signed.'}),
  R('cd12','Paint store',29.4,44.4,16.2,7.6,'ind',{eq:'paint',pub:'Paint cans and solvent drums. An open box of half-face masks. The thinner catches in your throat.'}),
  R('cd5','Moonpool',48,24,22,18,'ind',{eq:'moonpool',pub:'A square of black water in the floor, lit from below as the sea rises and falls. A yellow submersible hangs in the gantry. A corridor runs all the way round it.'}),
  R('cd8','Umbilical winch',45.6,44.4,14,7.6,'ind',{eq:'winch',pub:'A steel reel the size of a car. A panel with two worn joysticks. The counter has not been zeroed since 2011.'}),
  R('cd11','Fire pumps',59.6,44.4,12.8,7.6,'ind',{eq:'pumps',pub:'Two large red pumps and a pipe the width of a body going down through the floor.'}),
  R('cd_hpu','Hydraulic power unit',82.4,24,16,7.8,'ind',{eq:'hpu',pub:'A tank of hydraulic oil, two pumps and a pressure panel. Drip trays under every fitting.'}),
  R('cd9','ROV bay',72.4,34.6,16,17.4,'ind',{eq:'rov',pub:'Two yellow ROVs in cradles. A manipulator arm stripped on the bench. Three dusty monitors on blue screens.'}),
  R('cd13','Waste',88.4,34.6,11.6,17.4,'ind',{eq:'waste',pub:'Two blue drums, a funnel and a scale. The extractor is switched off. People leave quickly.'}),
  R('cd_bal','Ballast control',102.4,26.4,14,11.8,'ind',{eq:'ballast',d:[['w',.5,'door','c']],pub:'A console with a diagram of the platform legs and the ballast tanks. Several indicators read amber.'}),
  R('cd_swp','Seawater pumps',102.4,38.2,14,13.8,'ind',{eq:'pumps',d:[['n',.5,'door','r']],pub:'Large pumps on a raised floor and a pipe going down into the dark.'}),
  R('cd14','Storeroom',19.4,54.4,12,7.6,'ind',{eq:'store',pub:'Deep shelving with a light every second bay. Another company\'s label under the paint.'}),
  R('cd15','M12 · Decommissioned',31.4,54.4,16,7.6,'off',{eq:'sealed',st:'sealed',d:[['n',.5,'weld','c']],pub:'A steel plate welded across the doorway. The floor patched, the walls bare.'}),
  R('cd_sp','Spare parts',47.4,54.4,16,7.6,'ind',{eq:'store',pub:'Valves, flanges and gaskets on racks. A paper inventory on a clipboard.'}),
  R('cd_cab','Cable room',63.4,54.4,12,7.6,'ind',{eq:'cable',pub:'Cable reels in rows, each tagged with a date and a destination.'}),
  R('cd_hot','Hot-work shop',75.4,54.4,14,7.6,'ind',{eq:'workshop',pub:'A welding bench and gas bottles chained to the wall. A burnt smell that never quite goes.'}),
  R('cd_chm','Chemical store',89.4,54.4,10.6,7.6,'ind',{eq:'chemstore',pub:'Drums on spill trays, stacked two high.'})],
 stairs:[{x:24.8,y:5.8,w:2.2,h:4.2,dir:'up',lbl:'L-05'},{x:81.2,y:5.8,w:2.2,h:4.2,dir:'up',lbl:'L-05'},{x:18.2,y:50.6,w:2.2,h:4.2,dir:'up',lbl:'L-05'}],
 fire:[[6,3],[24.8,14],[24.8,28],[30,33.2],[40,33.2],[46.8,30],[58,22.8],[71.2,30],[90,33.2],[100,33.2],[18.2,45],[40,53.2],[70,53.2],[90,53.2],[81.2,14]],
 mcp:[[24.8,20],[34,33.2],[46.8,38],[64,22.8],[80,33.2],[18.2,40],[50,53.2],[80,53.2],[81.2,8]],
 esc:[
  {k:'p',pts:[[40,33.2],[24.8,33.2],[24.8,9]],need:['cc_w','cc_cw']},
  {k:'p',pts:[[75,22.8],[81.2,22.8],[81.2,9]],need:['cc_rn','cc_ne2','cc_ne']},
  {k:'p',pts:[[18.2,36],[18.2,50]],need:['cc_sw']},
  {k:'s',pts:[[95,33.2],[74,33.2]],need:['cc_e']},
  {k:'s',pts:[[25,1],[80,1],[121.4,1],[121.4,40]],need:['cw_n','cw_e']}],
 cams:[{id:'cam04',x:58,y:33,room:'cd5'},{id:'cam02',x:98,y:10,room:'cd7'}]
});

/* ============================== LIVING QUARTERS A–E (34 x 28) ============================== */
function lqDeck(id,suffix,name,elev,rowN,rowS,extra){
  const corr=[C(id+'_c',3.7,18,26.6,2,'Corridor '+suffix)];
  const rooms=[];
  let x=3.7;rowN.forEach(it=>{if(it.cw){corr.push(C(it.id,x,2,it.cw,16,'Cross '+suffix));x+=it.cw;return;}
    rooms.push(R(it.id,it.n,x,2,it.w,it.h||16,it.t||'ind',it));x+=it.w;});
  x=3.7;rowS.forEach(it=>{rooms.push(R(it.id,it.n,x,20,it.w,6,it.t||'ind',it));x+=it.w;});
  rooms.push(R(id+'0','Core',.5,15.5,3.2,7,'ind',{eq:'lift',d:[['e',.5,'door','c']],pub:'Stair and lift core. A worn handrail and a lift with a folding gate.'}));
  rooms.push(R(id+'9','Stairwell',30.3,15.5,3.2,7,'stair',{eq:'stair',d:[['w',.5,'door','c']],pub:'Fire door with a push bar. Five flights on the outside of the block.'}));
  (extra||[]).forEach(e=>rooms.push(e));
  return build({id,lvl:'L-06',name,elev,dwg:'ØA-LQ-'+suffix,corr,rooms,fire:[[6,19],[16,19],[28,19]],mcp:[[10,19],[22,19]],stairs:[],esc:[{k:'p',pts:[[16,19],[31.9,19]],need:[id+'_c']},{k:'p',pts:[[16,19],[2.1,19]],need:[id+'_c']}],cams:[],voids:[]});
}
const lqE=lqDeck('lqE','E','Living quarters · Deck E','+58 m',
 [{id:'lqE1',n:'Heliport access',w:10,t:'ext',eq:'hatch',pub:'A round hatch with a wheel lock. A chain with a sign across the ladder.'},
  {id:'lqE2',n:'Lift motor room',w:8,eq:'engine',pub:'Lift motor behind a grille, two sprinkler tanks. Machinery cycling without a pause.'},
  {id:'lqE4',n:'Air handling units',w:8.6,eq:'ahu',pub:'Two units the size of containers, stacked filters beside them. A duct riser down to all five decks. A constant blow that drowns everything else.'}],
 [{id:'lqE6',n:'Antenna deck',w:26.6,t:'ext',eq:'antenna',pub:'A mast in the centre and a dish turned south. Coax bundled every metre. The whole platform is below this point.'}]);
const lqD=lqDeck('lqD','D','Living quarters · Deck D','+54 m',
 [{id:'lqD1',n:'Communications',w:6.2,eq:'comms',pub:'An L-shaped desk with two VHF radios and a satellite terminal. A paper logbook. Perforated acoustic panel on the wall.'},
  {id:'lqD2',n:'Camera room',w:7.4,eq:'cameras',pub:'Nine monitors, four without signal. A notebook of occurrences with a pen tied to it.'},
  {id:'lqD3',n:'OIM office',w:6,eq:'office',pub:'A locked filing cabinet and a record player with a classic vinyl. The only door in the block with a real key.'},
  {id:'lqD4',n:'Meeting room',w:7,eq:'meeting',pub:'A table for twelve and a projector with the cable wound up. The days-without-accident counter has been overwritten.'}],
 [{id:'lqD5',n:'Offices',w:8,eq:'office',pub:'Three booths with half-height partitions. You can hear the booth next door.'},
  {id:'lqD6',n:'Archive',w:5.6,eq:'archive',pub:'A sliding archive of six modules. Labels from 2011 to now. The earlier modules are empty, their labels scraped off.'},
  {id:'lqD8',n:'Coffee room',w:4,eq:'pantry',pub:'A sink, a coffee machine and a flask. Where everything that does not fit in the mess hall gets said.'},
  {id:'lqD10',n:'Training room',w:9,eq:'training',pub:'A CPR mannequin seated facing the door. A laminated muster map, Rev. 3, 2011. An induction video recorded in 2009.'}]);
/* Decks de dormitorio (C e B): cabines pequenas (2 pessoas) na parede externa norte e sul, cada uma com janela; corredores
   proprios das alas, lavabos e salas de uso no miolo. */
function lqDorm(id,suffix,name,elev,rooms,extra){
  const corr=[C(id+'_n',3.7,6.6,26.6,2.4,'Corridor '+suffix+'1'),C(id+'_s',3.7,19,26.6,2.4,'Corridor '+suffix+'2'),C(id+'_l',27.9,9,2.4,10,'Link '+suffix)];
  const all=rooms.concat([
    R(id+'0','Core',.5,15.5,3.2,7,'ind',{eq:'lift',d:[['e',.67,'door','c']],pub:'Stair and lift core. A worn handrail and a lift with a folding gate.'}),
    R(id+'9','Stairwell',30.3,15.5,3.2,7,'stair',{eq:'stair',d:[['w',.67,'door','c']],pub:'Fire door with a push bar. Five flights on the outside of the block.'})]).concat(extra||[]);
  return build({id,lvl:'L-06',name,elev,dwg:'ØA-LQ-'+suffix,corr,rooms:all,fire:[[8,7.8],[22,7.8],[8,20.2],[22,20.2],[29.1,14]],mcp:[[14,7.8],[14,20.2],[29.1,10]],stairs:[],
    esc:[{k:'p',pts:[[6,7.8],[29.1,7.8],[29.1,20.2],[31.9,20.2]],need:[id+'_n',id+'_l',id+'_s']},{k:'p',pts:[[6,20.2],[31.5,20.2]],need:[id+'_s']}],cams:[],voids:[]});
}
const lqC=lqDorm('lqC','C','Living quarters · Deck C','+50 m · crosses the weather deck',[
  R('lqC1','Dormitories A',3.7,2,26.6,4.6,'hab',{cab:{n:6,side:'s'},eq:'cabinrow',pub:'Six small cabins along the north hull, two bunks each. Name cards, half in pen. Walls thin enough to hear the neighbour. A small round window in each.'}),
  R('lqC3','Cabins 1–6 · vacant',3.7,21.4,26.6,4.6,'off',{cab:{n:6,side:'n'},eq:'cabinrow',pub:'Six unlocked cabins, made up. Bedspread pulled tight, pillow in place. A closed smell of light mildew.'}),
  R('lqC2','Washrooms A',3.7,9,7,10,'hab',{eq:'bath',pub:'Shower stalls with plastic curtains and white tile. An echo returns every drip. The door has had no lock since before the refit.'}),
  R('lqC5','Study room',10.7,9,8.4,10,'hab',{eq:'study',pub:'Two tables and a shelf of technical manuals. Three paperbacks with broken spines. One chair always pulled out, turned to the wall.'}),
  R('lqC6','Quiet room',19.1,9,8.8,5,'hab',{eq:'quiet',pub:'A sofa and one small round window. No equipment, no board, no sound.'}),
  R('lqC4','Linen room',19.1,14,4.4,5,'hab',{eq:'linen',pub:'Folded sheets and coveralls in plastic bags. Smell of bleach, the only good smell here.'}),
  R('lqC7','Store',23.5,14,4.4,5,'hab',{eq:'store',pub:'A cleaning cart and a vacuum cleaner. An unlocked door that nobody has ever taken anything from.'})],
  [R('lqC8','Weather deck exit',30.3,2,3.2,13.5,'ext',{eq:'hatch',d:[['s',.5,'open','r']],pub:'A wired-glass door. The first flight is visible; the rest goes dark.'})]);
const lqB=lqDorm('lqB','B','Living quarters · Deck B','+46 m · mostly sealed',[
  R('lqB4','Dormitories B',3.7,2,26.6,4.6,'hab',{cab:{n:6,side:'s'},eq:'cabinrow',pub:'Six cabins lit at the end of a dark corridor. These doors open. From the last you can see the length of the deck back to the core.'}),
  R('lqB1','Cabins · sealed',3.7,21.4,15.3,4.6,'off',{st:'sealed',cab:{n:3,side:'n'},eq:'cabinrow',pub:'A row of closed doors. Tape across every frame, already yellowed. An emergency light every ten metres. No smell at all.'}),
  R('lqB3','Cabins · sealed',19,21.4,11.3,4.6,'off',{st:'sealed',cab:{n:2,side:'n'},eq:'cabinrow',pub:'More closed doors. The last one ajar, the tape torn. A mattress without a sheet and an open locker.'}),
  R('lqB2','TV room · disabled',3.7,9,6,5,'off',{eq:'tv',pub:'Stacked chairs shoulder high. A tube TV still plugged in. Even dust, no fingermarks.'}),
  R('lqB5','Storage',3.7,14,6,5,'off',{eq:'store',pub:'A rolled mattress tied with rope. Paperwork older than 2011, soft with damp. One box stamped by another company.'}),
  R('lqB6','Washrooms · sealed',10.7,9,6,10,'off',{st:'sealed',eq:'bath',pub:'Water cut at the main valve. A dry trap and the smell that rises from it. A mould line at knee height.'}),
  R('lqB7','Washrooms B',16.7,9,5,10,'hab',{eq:'bath',pub:'Two showers and a basin. A mirror with the silver coming off. A bulb that blinks at irregular intervals.'}),
  R('lqB8','Corridor end',21.7,9,6.2,10,'hab',{eq:'plaster',pub:'The corridor ends in a smooth wall covered in the same striped beige paper, peeling from the bottom edge.'})]);

const lqA=(function(){
  const d=build({id:'lqA',lvl:'L-06',name:'Living quarters · Deck A',elev:'+42 m',dwg:'ØA-LQ-A',
   corr:[C('lqA_c',3.7,18,26.6,2,'Corridor A'),C('lqA_x',16,2,1.8,16,'Cross A')],
   rooms:[
    R('lqA0','Core',.5,15.5,3.2,7,'ind',{eq:'lift',d:[['e',.5,'door','c']],pub:'Worn handrail in the middle. A lift with a folding gate and five buttons.'}),
    R('lqA9','Stairwell',30.3,15.5,3.2,7,'stair',{eq:'stair',d:[['w',.5,'door','c']],pub:'Fire door with a push bar. Five flights on the outside of the block.'}),
    R('lqA1','Mess hall',3.7,2,12.3,10,'hab',{eq:'dining',d:[['e',.5,'door','c'],['s',.2,'open','r']],pub:'A table for forty, dinner for fourteen. Chairs turned up on the tables at the back. A TV with the news and no sound.'}),
    R('lqA3','Galley',3.7,12,6.4,6,'hab',{eq:'galley',pub:'Stainless steel wall to wall, an eight-burner range. A serving hatch open to the mess hall. A tube TV playing an Italian comedy too loud.'}),
    R('lqA4','Pantry',10.1,12,3,6,'hab',{eq:'store',pub:'Shelves to the ceiling. Stock for three months, every can turned label forward.'}),
    R('lqA5','Cold room',13.1,12,2.9,6,'hab',{eq:'cold',pub:'A lever latch and a fogged window. An empty hook on the ceiling rail. The compressor knocks in cycles.'}),
    R('lqA2','Lounge',17.8,2,12.5,10,'hab',{eq:'lounge',d:[['w',.5,'door','c']],pub:'A cracked leatherette sofa, a PlayStation on a big TV, weights used as a coat rack.'}),
    R('lqA6','Laundry',17.8,12,12.5,6,'hab',{eq:'laundry',pub:'Four washers and two dryers. A nylon line across the room. There is always something left behind.'}),
    R('lqA7','Infirmary',3.7,20,10,6,'hab',{eq:'infirmary',pub:'Two beds and a locked cabinet. An anatomy poster from 1998 held up with tape. Cleaner than anywhere else.'}),
    R('lqA8','Medic\'s room',13.7,20,6,6,'hab',{eq:'office',pub:'A steel filing cabinet with a lock. A corkboard with one paper turned to the wall.'}),
    R('lqA10','Common room',19.7,20,10.6,6,'hab',{eq:'quiet',pub:'Armchairs facing the round window. Dark nine months of the year. An ashtray that should not be here.'})],
   fire:[[6,19],[16,19],[28,19]],mcp:[[10,19],[22,19]],stairs:[],esc:[{k:'p',pts:[[16,19],[31.9,19]],need:['lqA_c']},{k:'p',pts:[[16,19],[2.1,19]],need:['lqA_c']}],
   cams:[{id:'cam01',x:10,y:7,room:'lqA1'}],voids:[]});
  return d;})();
lqA.rooms.find(r=>r.id==='lqA3').d=[['s',.5,'door','c'],['n',.3,'open','r']];

const DECKS={module:module_,weather:weather_,cellar:cellar_,lqE,lqD,lqC,lqB,lqA};
const LQ_ORDER=['lqE','lqD','lqC','lqB','lqA'];
const LQ_NAMES={lqE:'E · +58',lqD:'D · +54',lqC:'C · +50',lqB:'B · +46',lqA:'A · +42'};
Object.values(DECKS).forEach(d=>{d.rooms.forEach(r=>{r.deck=d.id;});d.corr.forEach(c=>{c.deck=d.id;});});
/* ---------- textos que o jogador le: SEMPRE "[Nome em portugues]. [O que e e o que faz na petroleira]." O Guardiao pode sobrescrever ao vivo (station/map/desc/<sala>) ---------- */
const PUB_PT={
 md_off:'Cabines dos oficiais. Nove cabines de duas camas ao longo do casco norte, onde dormem a chefia e os oficiais. Cada uma tem uma escotilha para o lado de fora.',
 md_crw:'Cabines da tripulação. Nove cabines de duas camas ao longo do casco sul, onde dorme o resto da tripulação. Cada uma tem uma escotilha para o lado de fora.',
 md_ow:'Banheiro dos oficiais. Chuveiros e pias de uso exclusivo da ala dos oficiais.',
 md_om:'Refeitório dos oficiais. Sala onde os oficiais fazem as refeições e reuniões informais.',
 md_cl:'Enfermaria. Presta os primeiros socorros e guarda os medicamentos da plataforma.',
 md_ol:'Lavanderia dos oficiais. Lava e seca roupa de cama e macacões da ala dos oficiais.',
 md_gym:'Academia. Equipamentos de exercício para a tripulação nas folgas.',
 md0:'Lounge. Sala redonda de convivência ligada às duas alas, com sofás, quadros, armários individuais e máquinas de venda, usada para relaxar perto dos quartos ou de manhã.',
 md1:'Sala de botas. Passagem de troca de botas e macacão entre o lado limpo e o lado sujo; a faixa amarela no piso marca a divisão.',
 md2:'Sala de controle. Monitora e comanda os sistemas da plataforma a partir de painéis e monitores.',
 md3:'Oficina elétrica. Faz a manutenção e o reparo de painéis, motores e cabos elétricos.',
 md12:'Depósito seco. Guarda peças de reposição e material que não pode pegar umidade.',
 md11:'Banheiro da tripulação. Chuveiros e pias de uso da ala da tripulação.',
 md_cd:'Sala de convivência da tripulação. Espaço de descanso e jogos nas folgas.',
 md_lc:'Lavanderia da tripulação. Lava e seca roupa e macacões da tripulação.',
 md_ppe:'Armário de EPI. Guarda e distribui os equipamentos de proteção individual: macacões, capacetes e cintos.',
 md_ins:'Oficina de instrumentação. Calibra e conserta os manômetros e sensores da plataforma.',
 md_scba:'Depósito de respiradores autônomos. Guarda os aparelhos de respiração usados em emergências com gás ou fumaça.',
 md_trf:'Sala de transformadores. Reduz a tensão da energia gerada para alimentar os equipamentos.',
 md_swu:'Escada de subida. Liga o module deck ao weather deck.',md_swd:'Escada de descida. Liga o module deck ao cellar deck.',md_se:'Escada de subida. Liga o module deck ao weather deck.',
 md4:'Área dos poços (wellbay). Abriga as cabeças de poço, que controlam a saída do óleo e do gás do reservatório até a plataforma.',
 md5:'Sala de lama. Prepara, bombeia e filtra a lama de perfuração, que resfria a broca e carrega os fragmentos de rocha até a superfície.',
 md_lab:'Laboratório de lama. Analisa as amostras de lama e de sedimento que sobem do poço.',
 md_chem:'Depósito de químicos. Guarda os produtos usados no tratamento do poço e do óleo.',
 md6:'Separação. Separa o óleo, o gás e a água que chegam misturados dos poços.',
 md8:'Módulo desativado. Antigo módulo de processo fora de operação, com válvulas e energia isoladas por bloqueio de segurança.',
 md7:'Compressão. Comprime o gás separado para enviá-lo por duto ou reinjetá-lo no poço.',
 md10:'Oficina. Usina e conserta peças metálicas e ferramentas da plataforma.',
 md9:'Utilidades. Gera a energia e o ar quente da plataforma com geradores e sistemas auxiliares.',
 md_inj:'Injeção de químicos. Dosa produtos químicos nas linhas para evitar corrosão e incrustação.',
 md_wc:'Sanitários e zeladoria. Banheiros de apoio ao módulo e guarda de material de limpeza.',
 wd1:'Heliponto. Área de pouso e decolagem dos helicópteros que levam e trazem a tripulação.',
 wd2:'Casa de máquinas. Abriga o motor do elevador e os tanques do sistema de sprinklers.',
 wd3:'Área de descarga. Espaço aberto onde os guindastes deixam os contêineres e a carga recebida dos barcos.',
 wd4:'Topo da torre. Estrutura em treliça que sustenta equipamentos no alto da plataforma.',
 wd5:'Respiro de gás. Chaminé que libera o gás com segurança quando a pressão passa do limite.',
 wd6:'Baleeiras. Cápsulas salva-vidas fechadas usadas para evacuar a tripulação em emergência.',
 wd7:'Depósito de EPI. Guarda cintos, capacetes e o cesto usado para transferir pessoal por guindaste.',
 wd14:'Ponto de reunião 3. Local onde a tripulação se apresenta e é contada durante um alarme.',
 wd8:'Guindaste 1. Içacarga entre os barcos de apoio e o convés.',
 wd9:'Guindaste 2. Içacarga e material entre os barcos de apoio e o convés.',
 wd10:'Guindaste 3. Içacarga e material entre os barcos de apoio e o convés.',
 wd11:'Ponta do flare. Lança que leva o queimador de gás em excesso para longe da plataforma.',
 wd13:'Plataforma antiga. Estrutura vizinha desativada, ligada à principal por uma passarela.',
 cd1:'Sala de máquinas. Concentra a ventilação e o aquecimento do deck, além da sauna usada pela tripulação.',
 cd4:'Área de carga. Recebe, guarda e movimenta contêineres e materiais trazidos pelos guindastes.',
 cd7:'Wellbay inferior. Parte baixa da área dos poços, onde ficam as árvores de natal, conjuntos de válvulas que controlam o fluxo de cada poço.',
 cd2:'Sala de secagem. Seca macacões e roupa de trabalho molhados.',
 cd3:'Dessalinização. Transforma água do mar em água doce para uso na plataforma.',
 cd10:'Quadro de força. Distribui e protege a energia elétrica enviada aos equipamentos.',
 cd6:'Sala de mergulho. Guarda e prepara o equipamento dos mergulhadores e controla a escala de mergulho.',
 cd12:'Depósito de tinta. Guarda tintas e solventes usados na manutenção contra a corrosão.',
 cd5:'Moonpool. Abertura no piso por onde equipamentos e submersíveis descem direto ao mar; um corredor em volta dá acesso a todos os lados.',
 cd8:'Guincho do umbilical. Enrola e desenrola o cabo que liga a plataforma aos veículos submarinos.',
 cd11:'Bombas de incêndio. Bombeiam água do mar para os sistemas de combate a incêndio.',
 cd_hpu:'Unidade hidráulica. Fornece pressão de óleo para acionar válvulas e equipamentos.',
 cd9:'Baia de ROV. Guarda e prepara os veículos operados remotamente usados em inspeção submarina.',
 cd13:'Resíduos. Armazena o lixo e os resíduos oleosos até o transporte para terra.',
 cd_bal:'Controle de lastro. Controla a água dos tanques que mantêm a plataforma estável.',
 cd_swp:'Bombas de água do mar. Puxam água do mar para o resfriamento e para o sistema de incêndio.',
 cd14:'Almoxarifado. Guarda material de consumo e peças de reposição do deck.',
 cd15:'Módulo desativado. Antigo módulo de processo fora de operação, com a entrada fechada por chapa soldada.',
 cd_sp:'Peças de reposição. Guarda válvulas, flanges e juntas para a manutenção.',
 cd_cab:'Sala de cabos. Guarda os carretéis de cabo elétrico e de controle.',
 cd_hot:'Oficina de trabalho a quente. Solda e corta metal sob permissão e controle do risco de incêndio.',
 cd_chm:'Depósito de químicos. Guarda tambores de produtos químicos sobre bacias de contenção.',
 lqE0:'Núcleo de circulação. Concentra a escada e o elevador que ligam os decks do alojamento.',lqD0:'Núcleo de circulação. Concentra a escada e o elevador que ligam os decks do alojamento.',lqC0:'Núcleo de circulação. Concentra a escada e o elevador que ligam os decks do alojamento.',lqB0:'Núcleo de circulação. Concentra a escada e o elevador que ligam os decks do alojamento.',lqA0:'Núcleo de circulação. Concentra a escada e o elevador que ligam os decks do alojamento.',
 lqE9:'Escada de emergência. Rota de fuga protegida por porta corta-fogo que liga os decks do alojamento.',lqD9:'Escada de emergência. Rota de fuga protegida por porta corta-fogo que liga os decks do alojamento.',lqC9:'Escada de emergência. Rota de fuga protegida por porta corta-fogo que liga os decks do alojamento.',lqB9:'Escada de emergência. Rota de fuga protegida por porta corta-fogo que liga os decks do alojamento.',lqA9:'Escada de emergência. Rota de fuga protegida por porta corta-fogo que liga os decks do alojamento.',
 lqE1:'Acesso ao heliponto. Escotilha e escada que levam à cobertura do alojamento e ao heliponto.',
 lqE2:'Casa de máquinas do elevador. Abriga o motor do elevador e o tanque do sistema de sprinklers.',
 lqE4:'Unidades de ar-condicionado. Renovam, filtram e esfriam o ar de todos os decks do alojamento.',
 lqE6:'Convés de antenas. Mastro e antenas de rádio e satélite que ligam a plataforma ao resto do mundo.',
 lqD1:'Comunicações. Central de rádio e satélite para falar com a costa, os barcos e os helicópteros.',
 lqD2:'Sala de câmeras. Monitora as câmeras de segurança da plataforma e registra ocorrências.',
 lqD3:'Escritório do OIM. Sala do gerente da instalação, responsável por toda a plataforma.',
 lqD4:'Sala de reunião. Reuniões de segurança e de planejamento.',
 lqD5:'Escritórios. Trabalho administrativo e de planejamento.',
 lqD6:'Arquivo. Guarda registros, relatórios e documentos da operação.',
 lqD8:'Sala do café. Pequena copa para a pausa da equipe administrativa.',
 lqD10:'Sala de treinamento. Aulas de segurança, primeiros socorros e indução de quem chega.',
 lqC1:'Dormitórios A. Cabines de duas camas para equipes de rotação que passam períodos curtos a bordo.',
 lqC3:'Cabines 1 a 6 (vagas). Cabines de reserva, mantidas arrumadas para quando chegar mais gente.',
 lqC2:'Banheiros A. Chuveiros e pias de uso dos dormitórios do deck.',
 lqC5:'Sala de estudo. Espaço silencioso com manuais técnicos para estudo e leitura.',
 lqC6:'Sala de silêncio. Espaço de descanso curto longe do barulho.',
 lqC4:'Rouparia. Guarda lençóis, toalhas e macacões limpos.',
 lqC7:'Depósito. Guarda o material de limpeza do deck.',
 lqC8:'Saída para o weather deck. Porta que liga o alojamento ao convés externo.',
 lqB4:'Dormitórios B. Cabines de duas camas para equipes de rotação, ainda em uso.',
 lqB1:'Cabines desativadas. Antigas cabines fechadas por falta de uso depois da redução da tripulação.',
 lqB3:'Cabines desativadas. Mais cabines fechadas por falta de uso.',
 lqB2:'Sala de TV (desativada). Antiga sala de convivência com televisão, fora de uso.',
 lqB5:'Depósito. Guarda colchões, papelada e materiais antigos do deck.',
 lqB6:'Banheiros (desativados). Antigos chuveiros e pias das cabines fechadas, com a água cortada.',
 lqB7:'Banheiros B. Chuveiros e pias de uso dos dormitórios que ainda funcionam.',
 lqB8:'Fim do corredor. Extremidade do corredor sul do deck.',
 lqA1:'Refeitório. Onde a tripulação faz as refeições, em turnos.',
 lqA3:'Cozinha. Prepara as refeições de toda a plataforma.',
 lqA4:'Despensa. Guarda os alimentos secos e enlatados.',
 lqA5:'Câmara fria. Conserva carnes, laticínios e alimentos perecíveis.',
 lqA2:'Sala de estar. Espaço de convivência com sofá, TV e videogame.',
 lqA6:'Lavanderia. Lava e seca roupa de cama e macacões de todo o alojamento.',
 lqA7:'Enfermaria. Atende doentes e feridos até uma eventual remoção.',
 lqA8:'Sala do médico. Consultas e guarda dos prontuários da tripulação.',
 lqA10:'Sala de descanso. Espaço de repouso com poltronas voltadas para a janela.'
};
const DECK_INTRO={
 weather:'Convés de tempo (weather deck). O deck mais alto da plataforma, ao ar livre, com heliponto, guindastes, baleeiras e a ponte do flare.',
 module:'Deck de módulos (module deck). Reúne as cabines, a área dos poços e os módulos de processo, separados por um firewall; galerias externas dão a volta por fora.',
 cellar:'Deck do porão (cellar deck). O deck mais baixo da plataforma, com área de carga, moonpool, bombas e o wellbay inferior.',
 lqE:'Deck E do alojamento. Cobertura do prédio de alojamento, com acesso ao heliponto, casa de máquinas e antenas.',
 lqD:'Deck D do alojamento. Administração da plataforma: comunicações, sala de câmeras e escritórios.',
 lqC:'Deck C do alojamento. Dormitórios de rotação; o deck atravessa o weather deck.',
 lqB:'Deck B do alojamento. Dormitórios, em grande parte desativados.',
 lqA:'Deck A do alojamento. Refeitório, cozinha, sala de estar e enfermaria.'};
Object.values(DECKS).forEach(d=>{d.intro=DECK_INTRO[d.id]||'';d.rooms.forEach(r=>{if(PUB_PT[r.id])r.pub=PUB_PT[r.id];});});



const CAMERAS=[{id:'cam01',label:'CAM-01',loc:'Mess hall'},{id:'cam02',label:'CAM-02',loc:'Lower wellbay'},{id:'cam03',label:'CAM-03',loc:'Main corridor'},{id:'cam04',label:'CAM-04',loc:'Moonpool'}];
window.STATION={CAMERAS,LEVELS,LEGACY,DECK_LEVEL,DECKS,LQ_ORDER,LQ_NAMES,
  levelId:id=>(LEGACY[id]||id),
  decksOfLevel:l=>Object.keys(DECKS).filter(k=>DECK_LEVEL[k]===l),
  roomIndex:(()=>{const m={};Object.values(DECKS).forEach(d=>d.rooms.forEach(r=>m[r.id]=r));return m;})(),
  corrIndex:(()=>{const m={};Object.values(DECKS).forEach(d=>d.corr.forEach(c=>m[c.id]=c));return m;})()};
})();
