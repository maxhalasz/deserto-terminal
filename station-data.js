/* ============================================================
   ØDEMARK A. — dados do mapa (PUBLICO: geometria + texto que o jogador pode ler)
   Textos do Guardiao e camada DRE ficam em station-gm-data.js (so o guardiao.html carrega).
   Unidade: metros. Retangulos [x, y, w, h]. Rooms e corredores sao COLADOS (bordas coincidentes):
   a espessura de parede e desenhada centrada na borda. Portas ficam sobre a parede compartilhada.
   ============================================================ */
(function(){
const LEVELS=[
  {id:'weather', tag:'L-07', name:'Weather deck',     elev:'+52 m'},
  {id:'quarters',tag:'L-06', name:'Living quarters',  elev:'+42 / +58 m'},
  {id:'module',  tag:'L-05', name:'Module deck',      elev:'+40 m'},
  {id:'cellar',  tag:'L-03', name:'Cellar deck',      elev:'+28 m'},
  {id:'sub',     tag:'L-02', name:'Submerged level',  elev:'-40 / -260 m'}
];
// ids antigos do terminal (guardados no Firebase) -> ids novos
const LEGACY={helipad:'weather',control:'module',mess:'quarters',drill:'cellar'};
const DECK_LEVEL={weather:'weather',module:'module',cellar:'cellar',lqE:'quarters',lqD:'quarters',lqC:'quarters',lqB:'quarters',lqA:'quarters'};

const R=(id,n,x,y,w,h,t,o)=>Object.assign({id,n,r:[x,y,w,h],t:t||'ind'},o||{});
const C=(id,x,y,w,h,n)=>({id,r:[x,y,w,h],n:n||''});

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
  deck.rooms.forEach(r=>{if(!r.d)r.d=autoDoors(r,deck.corr);});
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  const eat=a=>{x0=Math.min(x0,a[0]);y0=Math.min(y0,a[1]);x1=Math.max(x1,a[0]+a[2]);y1=Math.max(y1,a[1]+a[3]);};
  deck.rooms.forEach(r=>eat(r.r));deck.corr.forEach(c=>eat(c.r));(deck.voids||[]).forEach(v=>eat(v));
  deck.bbox=[x0,y0,x1-x0,y1-y0];
  return deck;
}

/* ============================== MODULE DECK +40 ============================== */
const module_=build({
 id:'module',lvl:'L-05',name:'Module deck',elev:'+40 m',dwg:'ØA-GA-02',
 corr:[
  C('mc_cn',2,1.2,31,2.4,'C-40·N'),C('mc_cm',2,25.6,31,2.4,'C-40·M'),C('mc_cs',2,50,31,2.4,'C-40·S'),C('mc_cp',16,28,2.4,22,'C-40·P'),
  C('mc_f1',33,1.2,1.2,2.4,'FD-1'),C('mc_f2',33,25.6,1.2,2.4,'FD-2'),C('mc_f3',33,50,1.2,2.4,'FD-3'),
  C('mc_dn',34.2,1.2,79.2,2.4,'C-40·N'),C('mc_dm',34.2,25.6,79.2,2.4,'C-40·M'),C('mc_ds',34.2,50,79.2,2.4,'C-40·S'),
  C('mc_p1',57,3.6,2.8,46.4,'C-40·P1'),C('mc_p2',83.8,3.6,2.8,46.4,'C-40·P2')],
 firewall:[[33,0,1.2,1.2],[33,3.6,1.2,22],[33,28,1.2,22],[33,52.4,1.2,2.6]],
 fireDoors:[{id:'FD-1',x:33.6,y:2.4,v:1},{id:'FD-2',x:33.6,y:26.8,v:1},{id:'FD-3',x:33.6,y:51.2,v:1}],
 voids:[[34.2,3.6,2.8,14.4],[34.2,35.6,2.8,14.4],[110.4,3.6,3,14.4],[110.4,35.6,3,14.4]],
 rooms:[
  R('md0','Accommodation',2,3.6,31,22,'hab',{eq:'cabins',pub:'Crew accommodation block. Fourteen cabins along the north and south walls and a lounge between them. Most of the cabin doors are closed.'}),
  R('md1','Boot room',2,28,14,9,'ind',{eq:'lockers',pub:'Steel lockers with names on tape. Boots paired on a grated duckboard. A yellow stripe cuts the floor in two: clean on one side, dirty on the other.'}),
  R('md11','Washroom',2,37,14,5,'hab',{eq:'wash',pub:'Showers and basins for the crew. A drain in the middle of the floor.'}),
  R('md2','Control room',2,42,14,8,'ind',{eq:'console',lp:'t',pub:'Dim on purpose. Monitors over a mimic panel of small lamps. The chair backs are polished from use.'}),
  R('md12','Dry store',18.4,28,14.6,14,'ind',{eq:'store',pub:'Shelving to the ceiling. Spare parts, tagged and counted.'}),
  R('md3','Electrical shop',18.4,42,14.6,8,'ind',{eq:'elec',lp:'t',pub:'A shadow board with the outline of every tool. Three outlines are empty.'}),
  R('md_swu','Stair W · up',34.2,18,2.8,7.6,'stair',{eq:'stair',dir:'up',to:'L-07',pub:'Stairs to the weather deck.'}),
  R('md_swd','Stair W · down',34.2,28,2.8,7.6,'stair',{eq:'stair',dir:'dn',to:'L-03',pub:'Stairs to the cellar deck.'}),
  R('md4','M10 · Wellbay',37,3.6,20,22,'ind',{eq:'wellheads',pub:'Twenty-four wellheads in rows on a grated floor, open to the cellar deck below. A constant hiss of gas overhead.'}),
  R('md6','M20 · Separation',59.8,3.6,24,22,'ind',{eq:'separators',pub:'A forest of insulated pipe. Two horizontal vessels and the noise to keep you from talking.'}),
  R('md8','M22 · Decommissioned',86.6,3.6,23.8,22,'off',{eq:'sealed',st:'sealed',d:[['s',.4,'gate','c'],['n',.5,'gate','c']],pub:'Mesh gate with chain and red lock-out seal. A lock-out tag on every valve. Laminated notice dated 2013, peeling at the corner.'}),
  R('md_seu','Stair E · up',110.4,18,3,7.6,'stair',{eq:'stair',dir:'up',to:'L-07',pub:'Stairs to the weather deck.'}),
  R('md5','M11 · Mud room',37,28,20,22,'ind',{eq:'mud',pub:'Shale shakers throwing grey mud. Everything is coated in it, the lab window included.'}),
  R('md7','M21 · Compression',59.8,28,13,22,'ind',{eq:'compressors',pub:'Three compressors the size of a bus. A low hum that climbs through the soles of your boots.'}),
  R('md10','M31 · Workshop',72.8,28,11,22,'ind',{eq:'workshop',pub:'A lathe and swarf on the floor. A radio playing static. Three burn marks on the bench.'}),
  R('md9','M30 · Utilities',86.6,28,23.8,22,'ind',{eq:'utilities',pub:'Hot air and engine oil. Two large generators, one under a tarp.'}),
  R('md_sed','Stair E · down',110.4,28,3,7.6,'stair',{eq:'stair',dir:'dn',to:'L-03',pub:'Stairs to the cellar deck.'})],
 stairs:[],
 fire:[[12,26.8],[30,51.2],[40,26.8],[70,26.8],[100,26.8],[40,2.4],[100,2.4],[40,51.2],[100,51.2],[58.4,12],[84.9,40]],
 mcp:[[24,26.8],[48,26.8],[78,26.8],[108,26.8],[58.4,38],[84.9,12],[104,51.2],[46,2.4],[90,2.4]],
 esc:[
  {k:'p',pts:[[6,26.8],[35.6,26.8],[35.6,20.4]],need:['mc_cm','mc_f2','mc_dm']},
  {k:'p',pts:[[70,26.8],[35.6,26.8],[35.6,20.4]],need:['mc_dm']},
  {k:'p',pts:[[70,26.8],[111.9,26.8],[111.9,20.4]],need:['mc_dm']},
  {k:'s',pts:[[100,51.2],[58.4,51.2],[58.4,29.5]],need:['mc_ds','mc_p1']},
  {k:'s',pts:[[104,2.4],[84.9,2.4],[84.9,24.5]],need:['mc_dn','mc_p2']}],
 cams:[{id:'cam03',x:80,y:26.8,corr:'mc_dm'}]
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

/* ============================== CELLAR DECK +28 ============================== */
const cellar_=build({
 id:'cellar',lvl:'L-03',name:'Cellar deck',elev:'+28 m',dwg:'ØA-GA-03',
 corr:[
  C('cc_m',2,24,110,3,'C-28·M'),C('cc_n1',28,2,3,22,'C-28·N1'),C('cc_n2',67,2,3,22,'C-28·N2'),
  C('cc_s1',16,27,3,25,'C-28·S1'),C('cc_s2',30,27,3,33,'C-28·S2'),C('cc_s3',68,27,3,25,'C-28·S3'),C('cc_e',71,36,41,3,'C-28·E')],

 rooms:[
  R('cd1','Machine room',2,2,26,22,'ind',{eq:'sauna',pub:'A maze of silver ductwork overhead. A plywood sauna with a diverted steam valve. The steam is too thick to see the far wall.'}),
  R('cd4','Cargo area',31,2,36,22,'ind',{eq:'cargo',pub:'Eight metre ceiling, yellow lifting marks on the deck and an opening to the sky. Containers form aisles.'}),
  R('cd7','Lower wellbay',70,2,42,22,'ind',{eq:'xmas',pub:'The largest enclosed space on the platform. Christmas trees in rows. The echo comes back half a second late.'}),
  R('cd2','Drying room',2,27,14,12,'ind',{eq:'drying',pub:'Two rows of dripping coveralls over a heater. They sway slowly, all the time.'}),
  R('cd3','Desalination',2,39,14,13,'ind',{eq:'desal',pub:'White pipework and a high whine. A permanent puddle on the floor.'}),
  R('cd10','Switchgear',19,27,11,25,'ind',{eq:'switch',pub:'Electrical cabinets with hand-written labels. Smell of ozone. An emergency light that has always flickered.'}),
  R('cd5','Moonpool',33,27,19,23,'ind',{eq:'moonpool',pub:'A six metre square of black water in the floor, lit from below as the sea rises and falls. A yellow submersible hangs in the gantry.'}),
  R('cd15','M12 · Decommissioned',33,50,19,10,'off',{eq:'sealed',st:'sealed',d:[['w',.5,'weld','c']],pub:'A steel plate welded across the doorway. The floor patched, the walls bare.'}),
  R('cd6','Dive room',52,27,16,11,'ind',{eq:'dive',d:[['n',.5,'door','c'],['e',.5,'door','c']],pub:'Cylinders in racks and a suit hanging. A duty board with a marker that no longer wipes. A clipboard with the last name signed.'}),
  R('cd12','Paint store',52,38,16,12,'ind',{eq:'paint',d:[['e',.5,'door','c']],pub:'Paint cans and solvent drums. An open box of half-face masks. The thinner catches in your throat.'}),
  R('cd8','Umbilical winch',71,27,14,9,'ind',{eq:'winch',pub:'A steel reel the size of a car. A panel with two worn joysticks. The counter has not been zeroed since 2011.'}),
  R('cd11','Fire pumps',85,27,10,9,'ind',{eq:'pumps',pub:'Two large red pumps and a pipe the width of a body going down through the floor.'}),
  R('cd14','Storeroom',95,27,17,9,'ind',{eq:'store',pub:'Deep shelving with a light every second bay. Another company\'s label under the paint.'}),
  R('cd9','ROV bay',71,39,18,13,'ind',{eq:'rov',pub:'Two yellow ROVs in cradles. A manipulator arm stripped on the bench. Three dusty monitors on blue screens.'}),
  R('cd13','Waste',89,39,23,13,'ind',{eq:'waste',pub:'Two blue drums, a funnel and a scale. The extractor is switched off. People leave quickly.'})],
 stairs:[{x:29.5,y:4.6,w:3,h:4.6,dir:'up',lbl:'L-05'},{x:68.5,y:4.6,w:3,h:4.6,dir:'up',lbl:'L-05'},{x:17.5,y:49.4,w:3,h:4.6,dir:'up',lbl:'L-05'}],
 fire:[[6,25.5],[50,25.5],[90,25.5],[110,25.5],[29.5,12],[68.5,12],[17.5,34],[31.5,40],[69.5,45],[100,37.5]],
 mcp:[[24,25.5],[60,25.5],[100,25.5],[29.5,20],[68.5,20],[31.5,55],[69.5,30],[80,37.5]],
 esc:[
  {k:'p',pts:[[40,25.5],[29.5,25.5],[29.5,9]],need:['cc_m','cc_n1']},{k:'p',pts:[[60,25.5],[68.5,25.5],[68.5,9]],need:['cc_m','cc_n2']},
  {k:'p',pts:[[17.5,30],[17.5,46]],need:['cc_s1']},{k:'s',pts:[[100,37.5],[71,37.5]],need:['cc_e']}],
 cams:[{id:'cam04',x:42,y:30,room:'cd5'},{id:'cam02',x:90,y:12,room:'cd7'}]
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
const lqC=lqDeck('lqC','C','Living quarters · Deck C','+50 m · crosses the weather deck',
 [{id:'lqC1',n:'Dormitories A',w:13,t:'hab',eq:'dorm',pub:'A door every 3.5 m along 23 m of corridor. Name cards, half in pen. Bunk, fold-down desk and a narrow locker. Walls thin enough to hear the neighbour.'},
  {id:'lqC2',n:'Washrooms A',w:6.8,t:'hab',eq:'bath',pub:'Shower stalls with plastic curtains and white tile. An echo returns every drip. The door has had no lock since before the refit.'},
  {id:'lqC3',n:'Cabins 1–6 · vacant',w:6.8,t:'off',eq:'dorm',pub:'Six unlocked cabins, made up. Bedspread pulled tight, pillow in place. A closed smell of light mildew.'}],
 [{id:'lqC5',n:'Study room',w:8.4,t:'hab',eq:'study',pub:'Two tables and a shelf of technical manuals. Three paperbacks with broken spines. One chair always pulled out, turned to the wall.'},
  {id:'lqC6',n:'Quiet room',w:7.4,t:'hab',eq:'quiet',pub:'A sofa and one small round window. No equipment, no board, no sound.'},
  {id:'lqC4',n:'Linen room',w:6,t:'hab',eq:'linen',pub:'Folded sheets and coveralls in plastic bags. Smell of bleach, the only good smell here.'},
  {id:'lqC7',n:'Store',w:4.8,t:'hab',eq:'store',pub:'A cleaning cart and a vacuum cleaner. An unlocked door that nobody has ever taken anything from.'}],
 [R('lqC8','Weather deck exit',30.3,2,3.2,13.5,'ext',{eq:'hatch',d:[['s',.5,'open','r']],pub:'A wired-glass door. The first flight is visible; the rest goes dark.'})]);
const lqB=lqDeck('lqB','B','Living quarters · Deck B','+46 m · mostly sealed',
 [{id:'lqB2',n:'TV room · disabled',w:6,h:8,t:'off',eq:'tv',d:[['s',.5,'door','r']],pub:'Stacked chairs shoulder high. A tube TV still plugged in. Even dust, no fingermarks.'},
  {id:'lqB1',n:'Cabins 12–34 · sealed',w:12.3,t:'off',st:'sealed',eq:'dorm',pub:'Twenty-three closed doors along 23 m of corridor. Tape across every frame, already yellowed. An emergency light every ten metres. No smell at all.'},
  {id:'lqB4',n:'Dormitories B',w:8.3,t:'hab',eq:'dorm',pub:'Six cabins lit at the end of a dark corridor. These doors open. From the last you can see the 30 m back to the core.'}],
 [{id:'lqB3',n:'Cabins 35–46 · sealed',w:11.3,t:'off',st:'sealed',eq:'dorm',pub:'Twelve more doors. The last one ajar, the tape torn. A mattress without a sheet and an open locker.'},
  {id:'lqB6',n:'Washrooms · sealed',w:6,t:'off',st:'sealed',eq:'bath',pub:'Water cut at the main valve. A dry trap and the smell that rises from it. A mould line at knee height.'},
  {id:'lqB7',n:'Washrooms B',w:4.5,t:'hab',eq:'bath',pub:'Two showers and a basin. A mirror with the silver coming off. A bulb that blinks at irregular intervals.'},
  {id:'lqB8',n:'Plaster wall',w:4.8,t:'hab',eq:'plaster',pub:'The south corridor ends in a smooth wall. The same striped beige paper, peeled back 20 cm from the bottom. Behind it is not steel plate. It is plaster.'}],
 [R('lqB5','Storage',3.7,10,6,8,'off',{eq:'store',pub:'A rolled mattress tied with rope. Paperwork older than 2011, soft with damp. One box stamped by another company.'})]);
// B: B2 tem altura 8 (y 2-10) e B5 (y 10-18) fica abaixo dele; B1 comeca depois dos 6 m
lqB.rooms.forEach(r=>{if(r.id==='lqB1'){r.r[0]=9.7;} if(r.id==='lqB4'){r.r[0]=22;r.r[2]=8.3;}});
lqB.rooms.find(r=>r.id==='lqB2').d=[['s',.5,'door','r']];lqB.rooms.find(r=>r.id==='lqB5').d=autoDoors(lqB.rooms.find(r=>r.id==='lqB5'),lqB.corr);
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

const CAMERAS=[{id:'cam01',label:'CAM-01',loc:'Mess hall'},{id:'cam02',label:'CAM-02',loc:'Lower wellbay'},{id:'cam03',label:'CAM-03',loc:'Main corridor'},{id:'cam04',label:'CAM-04',loc:'Moonpool'}];
window.STATION={CAMERAS,LEVELS,LEGACY,DECK_LEVEL,DECKS,LQ_ORDER,LQ_NAMES,
  levelId:id=>(LEGACY[id]||id),
  decksOfLevel:l=>Object.keys(DECKS).filter(k=>DECK_LEVEL[k]===l),
  roomIndex:(()=>{const m={};Object.values(DECKS).forEach(d=>d.rooms.forEach(r=>m[r.id]=r));return m;})(),
  corrIndex:(()=>{const m={};Object.values(DECKS).forEach(d=>d.corr.forEach(c=>m[c.id]=c));return m;})()};
})();
