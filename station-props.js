/* ============================================================
   Catalogo de PROPS do customizador de salas (publico: petroleira, laboratorio, NeuroStat, vestigios, marcadores).
   Catalogo publico (o repo e publico). Itens secretos da campanha ficam num catalogo privado do mestre, fora do git.
   Cada item = ops em metros, origem no CENTRO do item. Quem desenha e station-render.js (propSvg).
   ops: ['rc',x,y,w,h,rx,f] ['ci',x,y,r,f] ['ln',x1,y1,x2,y2,f] ['pl',[x,y,x,y,...],fechado,f] ['tx',x,y,txt,tam,negrito] ['ha',x,y,w,h]
   f: 0 contorno | 1 preenchido (papel) | 2 ambar (aviso/selo) | 3 tinta cheia | 4 mancha escura (vestigio)
   ============================================================ */
(function(){
const CATS=[['mob','Mobília'],['ind','Industrial'],['seg','Segurança'],['lab','Laboratório · NeuroStat'],['ves','Vestígios'],['mar','Marcadores']];
const ITEMS={},ORDER=[];
function def(id,n,cat,w,h,fn,opt){
  const ops=[];
  const o={rc:(x,y,ww,hh,rx,f)=>ops.push(['rc',x,y,ww,hh,rx||0,f||0]),ci:(x,y,r,f)=>ops.push(['ci',x,y,r,f||0]),
    ln:(x1,y1,x2,y2,f)=>ops.push(['ln',x1,y1,x2,y2,f||0]),pl:(pts,cl,f)=>ops.push(['pl',pts,cl?1:0,f||0]),
    tx:(x,y,t,sz,b)=>ops.push(['tx',x,y,String(t),sz||.3,b?1:0]),ha:(x,y,ww,hh)=>ops.push(['ha',x,y,ww,hh])};
  fn(o);
  ITEMS[id]=Object.assign({id,n,cat,w,h,ops,priv:!!(window.StationProps&&window.StationProps.priv)},opt||{});if(ORDER.indexOf(id)<0)ORDER.push(id);
}

/* ---------- MOBILIA ---------- */
def('mesa','Mesa','mob',2,1,o=>{o.rc(-1,-.5,2,1,.05);o.ln(-.85,-.35,.85,-.35);});
def('mesa_g','Mesa de reunião','mob',3.6,1.3,o=>{o.rc(-1.8,-.65,3.6,1.3,.35);o.rc(-1.5,-.4,3,.8,.2,1);});
def('mesa_r','Mesa redonda','mob',1.4,1.4,o=>{o.ci(0,0,.7);o.ci(0,0,.5,1);});
def('cadeira','Cadeira','mob',.55,.55,o=>{o.rc(-.25,-.2,.5,.45,.1,1);o.rc(-.27,-.3,.54,.12,.05);});
def('beliche','Beliche','mob',2,.95,o=>{o.rc(-1,-.47,2,.94);o.rc(-.95,-.4,.55,.8,.12,1);o.ln(-.2,-.47,-.2,.47);o.ln(-.12,-.47,-.12,.47);o.ci(.9,-.38,.05,1);o.ci(.9,.38,.05,1);});
def('cama','Cama','mob',2,1.05,o=>{o.rc(-1,-.52,2,1.04);o.rc(-.95,-.45,.6,.9,.12,1);o.ln(-.1,-.52,-.1,.52);});
def('armario','Armário','mob',1,.55,o=>{o.rc(-.5,-.27,1,.54);o.ln(0,-.27,0,.27);o.ci(-.08,0,.03,1);o.ci(.08,0,.03,1);});
def('estante','Estante','mob',2,.4,o=>{o.rc(-1,-.2,2,.4);for(let i=1;i<6;i++)o.ln(-1+i*2/6,-.2,-1+i*2/6,.2);});
def('sofa','Sofá','mob',2.1,.95,o=>{o.rc(-1.05,-.47,2.1,.94,.2);o.rc(-.9,-.4,1.8,.5,.12,1);o.rc(-1.05,-.47,.22,.94,.1);o.rc(.83,-.47,.22,.94,.1);});
def('balcao','Balcão','mob',3,.7,o=>{o.rc(-1.5,-.35,3,.7);o.ln(-1.5,.1,1.5,.1);o.ci(-.9,-.12,.14);o.rc(.2,-.25,.9,.28,0,1);});
def('cofre','Cofre','mob',.8,.8,o=>{o.rc(-.4,-.4,.8,.8,.05);o.rc(-.3,-.3,.6,.6,.04,1);o.ci(.05,0,.14);o.ln(.05,0,.05,-.1);});

/* ---------- INDUSTRIAL ---------- */
def('barril','Barril','ind',.65,.65,o=>{o.ci(0,0,.32);o.ci(0,0,.22,1);o.ln(-.1,-.1,.1,.1);});
def('tambores','Tambores','ind',1.5,1.4,o=>{[[-.4,-.35],[.4,-.35],[0,.35]].forEach(p=>{o.ci(p[0],p[1],.32);o.ci(p[0],p[1],.2,1);});});
def('conteiner','Contêiner','ind',6.1,2.5,o=>{o.rc(-3.05,-1.25,6.1,2.5);for(let i=1;i<14;i++)o.ln(-3.05+i*6.1/14,-1.25,-3.05+i*6.1/14,1.25);o.ha(2.45,-1.25,.6,2.5);});
def('palete','Palete com caixas','ind',1.3,1.3,o=>{o.rc(-.65,-.65,1.3,1.3);o.rc(-.58,-.58,.55,.55,.02,1);o.rc(.03,-.58,.55,.55,.02,1);o.rc(-.58,.03,.55,.55,.02,1);o.rc(.03,.03,.55,.55,.02,1);o.ln(-.58,-.58,-.03,-.03);o.ln(.58,.58,.03,.03);});
def('bobina','Bobina de cabo','ind',1.7,1.7,o=>{o.ci(0,0,.85);o.ci(0,0,.55,1);o.ci(0,0,.14,0);o.ci(.25,.12,.04,1);});
def('valvula','Válvula','ind',2,.9,o=>{o.rc(-1,-.1,2,.2,0,1);o.ci(0,0,.38);o.ln(-.38,0,.38,0);o.ln(0,-.38,0,.38);o.ci(0,0,.07,1);o.rc(-.3,.1,.6,.16,0,1);});
def('bomba','Bomba','ind',1.8,.9,o=>{o.rc(-.9,-.3,.9,.6,.08,1);o.ci(.45,0,.4);o.ci(.45,0,.2,1);o.rc(-.9,-.3,.2,.6);o.rc(.7,-.1,.2,.2);o.ln(-.9,.38,.9,.38);});
def('gerador','Gerador portátil','ind',1.5,.85,o=>{o.rc(-.75,-.42,1.5,.84,.08);o.rc(-.65,-.32,.7,.64,.04,1);o.ci(.4,0,.22);o.tx(-.3,.1,'G',.4,1);o.rc(.55,-.38,.16,.16,0,1);});
def('caixa_ferr','Caixa de ferramentas','ind',.75,.4,o=>{o.rc(-.37,-.2,.74,.4,.04,1);o.ln(-.37,0,.37,0);o.rc(-.12,-.26,.24,.07);});
def('escada_mao','Escada de mão','ind',2.6,.55,o=>{o.ln(-1.3,-.25,1.3,-.25);o.ln(-1.3,.25,1.3,.25);for(let i=0;i<=8;i++)o.ln(-1.2+i*.3,-.25,-1.2+i*.3,.25);});
def('tanque','Tanque','ind',2.2,2.2,o=>{o.ci(0,0,1.1);o.ci(0,0,.85,1);o.ln(-.85,0,.85,0);o.ln(0,-.85,0,.85);o.ci(.45,.45,.12);});
def('tubo','Tubulação','ind',3,1.6,o=>{o.pl([-1.5,.7,-.3,.7,.3,.3,.3,-.7,1.5,-.7],0,0);o.pl([-1.5,.5,-.4,.5,.1,.2,.1,-.5,1.5,-.5],0,0);o.ci(.2,0,.1,1);});
def('lampada','Lâmpada de emergência','ind',.5,.5,o=>{o.ci(0,0,.2,1);o.ci(0,0,.08);for(let k=0;k<8;k++){const t=k*Math.PI/4;o.ln(Math.cos(t)*.23,Math.sin(t)*.23,Math.cos(t)*.34,Math.sin(t)*.34);}});

/* ---------- SEGURANCA ---------- */
def('maca','Maca','seg',2,.7,o=>{o.rc(-1,-.35,2,.7,.1);o.rc(-.95,-.3,.45,.6,.12,1);o.ln(-.1,-.35,-.1,.35);o.ln(.4,-.35,.4,.35);});
def('kit_med','Kit médico','seg',.5,.4,o=>{o.rc(-.25,-.2,.5,.4,.04,1);o.ln(-.09,0,.09,0,2);o.ln(0,-.09,0,.09,2);});
def('barricada','Barricada','seg',2.4,.7,o=>{o.pl([-1.2,.3,-.7,-.3,-.2,.3,.3,-.3,.8,.3,1.2,-.3],0,0);o.rc(-1.2,-.1,2.4,.2,0,1);});
def('fita','Fita de isolamento','seg',3,.2,o=>{o.ha(-1.5,-.1,3,.2);o.rc(-1.5,-.1,3,.2,0,2);});
def('cone_perigo','Sinal de perigo','seg',.7,.7,o=>{o.pl([0,-.32,.34,.28,-.34,.28],1,2);o.tx(0,.2,'!',.34,1);});
def('lacre','Porta lacrada','seg',1.4,.3,o=>{o.rc(-.7,-.15,1.4,.3,0,2);o.ln(-.7,-.15,.7,.15,2);o.ln(-.7,.15,.7,-.15,2);});
def('placa_restr','Acesso restrito','seg',1.1,.3,o=>{o.rc(-.55,-.15,1.1,.3,.03,2);o.tx(0,.07,'RESTRITO',.2,1);});

/* ---------- LABORATORIO / NEUROSTAT ---------- */
def('bancada','Bancada de laboratório','lab',3,.8,o=>{o.rc(-1.5,-.4,3,.8);o.ci(-.9,0,.2);o.ci(-.9,0,.1,1);o.ci(.2,-.1,.09,1);o.ci(.5,.1,.07,1);o.ci(.8,-.1,.09,1);o.rc(1.05,-.3,.35,.6,0,1);});
def('mesa_exame','Mesa de exame','lab',2.1,1,o=>{o.rc(-1.05,-.5,2.1,1,.08);o.ci(-.78,0,.2,1);o.ln(-.2,-.5,-.2,.5,2);o.ln(.35,-.5,.35,.5,2);o.ln(.8,-.5,.8,.5,2);});
def('camara_conten','Câmara de contenção','lab',3,3,o=>{o.ci(0,0,1.5);o.ci(0,0,1.25,1);o.ci(0,0,1.25,2);o.ci(0,0,.5);o.ln(0,-1.5,0,-.5);o.ln(0,.5,0,1.5);o.rc(-.3,1.4,.6,.2,0,1);});
def('casulo','Casulo de observação','lab',2.6,1.2,o=>{o.rc(-1.3,-.6,2.6,1.2,.55);o.rc(-1.05,-.4,2.1,.8,.4,1);o.ci(-.7,0,.17);o.ln(.1,-.4,.1,.4);o.ci(.9,0,.07,2);});
def('rack','Rack de servidores','lab',.9,.7,o=>{o.rc(-.45,-.35,.9,.7);for(let i=0;i<5;i++){o.ln(-.4,-.25+i*.12,.4,-.25+i*.12);o.ci(.32,-.3+i*.12,.02,1);}});
def('terminal_p','Terminal de pesquisa','lab',1.3,.8,o=>{o.rc(-.65,-.4,1.3,.8);o.rc(-.3,-.35,.6,.35,.03,1);o.rc(-.3,.08,.6,.18,.02);o.ci(.5,.1,.08);});
def('amostras','Caixa de amostras','lab',.6,.45,o=>{o.rc(-.3,-.22,.6,.44,.04,1);o.ln(-.1,-.22,-.1,.22,2);o.ln(.1,-.22,.1,.22,2);});
def('freezer','Freezer ultrabaixo','lab',.9,.9,o=>{o.rc(-.45,-.45,.9,.9,.05);o.rc(-.35,-.35,.7,.7,.03,1);o.tx(0,.1,'-80',.3,1);});
def('eeg','Monitor EEG','lab',1,.6,o=>{o.rc(-.5,-.3,1,.6,.04);o.rc(-.42,-.23,.84,.34,.02,1);o.pl([-.4,0,-.28,-.12,-.18,.08,-.05,-.14,.06,.1,.18,-.1,.3,.06,.4,-.02],0,2);o.ci(-.3,.2,.04,1);o.ci(-.15,.2,.04,1);});
def('armario_cont','Armário de contenção','lab',1.2,.6,o=>{o.rc(-.6,-.3,1.2,.6);o.ln(0,-.3,0,.3);o.rc(-.6,-.3,1.2,.6,0,2);o.ci(-.1,0,.04,1);o.ci(.1,0,.04,1);});
def('camera_seg','Câmera','lab',.9,.9,o=>{o.ci(0,0,.15,1);o.pl([0,0,.75,-.4,.75,.4],1,0);});
def('selo_ns','Selo NeuroStat','lab',.7,.5,o=>{o.rc(-.35,-.25,.7,.5,.06,1);o.tx(0,.1,'NS',.34,1);});

/* ---------- VESTIGIOS ---------- */
def('corpo','Silhueta de corpo','ves',1.95,1.1,o=>{o.ci(-.8,0,.16);o.pl([-.62,-.08,-.48,-.2,-.3,-.42,-.08,-.52,.02,-.44,-.15,-.2,.2,-.16,.88,-.32,.96,-.2,.4,0,.96,.2,.88,.32,.2,.16,-.15,.2,.02,.44,-.08,.52,-.3,.42,-.48,.2,-.62,.08],1,0);});
def('poca','Poça escura','ves',1.2,1,o=>{o.pl([-.5,-.1,-.3,-.4,.1,-.45,.45,-.2,.55,.2,.2,.42,-.2,.4,-.45,.25],1,4);});
def('respingos','Respingos','ves',1.6,1.2,o=>{[[-.5,-.2,.09],[-.2,.15,.06],[.1,-.3,.1],[.35,.2,.07],[.6,-.05,.05],[-.7,.3,.04],[0,.45,.05],[.55,.45,.03]].forEach(p=>o.ci(p[0],p[1],p[2],4));});
def('pegadas','Pegadas','ves',2.4,1,o=>{for(let i=0;i<6;i++){const x=-1.05+i*.42,y=(i%2?.2:-.2);o.rc(x-.07,y-.16,.14,.32,.07,4);}});
def('arrasto','Marca de arrasto','ves',3,.8,o=>{o.pl([-1.5,.2,-.6,.3,.3,-.2,1.5,-.25],0,4);o.pl([-1.5,.05,-.6,.15,.3,-.35,1.5,-.4],0,4);});
def('rachadura','Rachadura','ves',2.2,.8,o=>{o.pl([-1.1,.1,-.6,-.15,-.3,.2,.2,-.2,.5,.1,1.1,-.1],0,0);o.pl([-.3,.2,-.2,.4],0,0);o.pl([.5,.1,.7,.34],0,0);});
def('fenda','Fenda no piso','ves',1.6,1.4,o=>{o.pl([-.5,-.1,-.2,-.5,.15,-.35,.5,-.5,.6,-.05,.3,.25,.45,.5,-.05,.35,-.35,.5,-.55,.2],1,3);o.ln(.6,-.05,.78,-.1);o.ln(-.2,-.5,-.28,-.64);o.ln(.45,.5,.55,.64);o.ln(-.55,.2,-.76,.3);});
def('papeis','Papéis caídos','ves',.8,.6,o=>{o.rc(-.3,-.2,.35,.45,0,1);o.rc(-.05,-.25,.35,.45,0,1);o.ln(-.2,-.05,.15,-.1);o.ln(-.2,.08,.15,.03);});
def('vidro','Vidro quebrado','ves',1.2,.8,o=>{[[-.4,-.1],[0,.1],[.35,-.2],[.2,.28],[-.2,.3]].forEach(p=>o.pl([p[0],p[1]-.1,p[0]+.12,p[1]+.06,p[0]-.1,p[1]+.08],1,0));});
def('agua','Mancha de umidade','ves',1.6,1.2,o=>{o.pl([-.6,0,-.3,-.35,.2,-.4,.65,-.05,.4,.35,-.2,.4],1,0);o.pl([-.35,0,-.1,-.2,.25,-.2,.4,0,.2,.2,-.1,.22],1,0);});

/* ---------- MARCADORES (so do mestre; o rotulo vira o numero/texto) ---------- */
def('marc','Marcador numerado','mar',.9,.9,o=>{o.ci(0,0,.4,2);},{inl:1});
def('seta','Seta','mar',1.6,.8,o=>{o.pl([-.8,0,.3,0],0,2);o.pl([.1,-.28,.8,0,.1,.28],1,2);});
def('alerta','Alerta','mar',.9,.9,o=>{o.pl([0,-.4,.42,.34,-.42,.34],1,2);o.tx(0,.26,'!',.42,1);});
def('ponto','Ponto de interesse','mar',.9,.9,o=>{o.ci(0,0,.38);o.ci(0,0,.06,3);o.ln(-.5,0,-.2,0);o.ln(.2,0,.5,0);o.ln(0,-.5,0,-.2);o.ln(0,.2,0,.5);});
def('texto','Texto','mar',2,.5,o=>{},{inl:1,txt:1});

window.StationProps={cats:CATS,items:ITEMS,order:ORDER,def,
  list:cat=>ORDER.map(id=>ITEMS[id]).filter(i=>!cat||i.cat===cat)};
})();
