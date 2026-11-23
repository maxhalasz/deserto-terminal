/* Weather deck (+52 m): convés aberto, helideck, guindastes, baleeiras, flare. */
const {room}=require('./lib');

room('wd1',c=>{ // helideck
  c.at('helideck_h',16,16,0,{sx:3.3,sy:3.3});
  c.bar('guarda',.6,.6,31.4,.6);c.bar('guarda',.6,31.4,31.4,31.4);c.bar('guarda',.6,.6,.6,31.4);c.bar('guarda',31.4,.6,31.4,31.4);
  [[1.6,1.6],[30.4,1.6],[1.6,30.4],[30.4,30.4]].forEach(p=>c.at('luz_alerta',p[0],p[1],0));
  c.at('carreta_ext',1.6,15,0);c.at('carreta_ext',30.4,15,0);c.at('kit_med',16,2.6,0);c.at('esc_marin',16,29.6,0);
  c.at('seta',26,6,45,{sx:.9});c.lbl('H1',5,5);
});
room('wd2',c=>{ // casa de máquinas
  [4.5,9,15,19.5].forEach(x=>{c.at('motor_diesel',x,3.4,0);c.at('gerador',x,6.4,0);});
  c.bar('tubo_reto',1,8.4,23,8.4);c.wall('s','quadro_eletr',4,{at:[3,7.2,16.4,20.5]});c.at('tanque_h',3.6,10.6,0,{sx:.7,sy:.7});c.at('bomba',9.2,10.6,0);c.at('compressor',16,10.6,0,{sx:.8});
});
room('wd15',c=>{ // depósito de utilidades
  c.wall('w','estante',3,{from:.6,to:11.4,rot:270});c.wall('e','estoque_caixas',2,{from:.8,to:6,rot:90});c.at('palete',3.7,4,0);c.at('palete',3.7,8,0);
  c.at('bancada',7.4,10.9,0,{sx:.8});c.at('caixa_ferr',7.6,8.6,0);c.at('escada_mao',6,3,0,{});
});
room('wd4',c=>{ // topo da torre
  c.at('plataforma',10.5,8,0,{sc:3});[[7.2,4.7],[13.8,4.7],[7.2,11.3],[13.8,11.3]].forEach(p=>c.at('pilar',p[0],p[1],0));
  c.at('alcapao',10.5,8,0,{sc:1.3});c.bar('guarda',3.6,1.6,17.4,1.6);c.bar('guarda',3.6,14.4,17.4,14.4);
  c.row('lampada',5,3,3,5.5,0,0);c.at('cabo_p',10.5,12.8,0,{sx:1.2});c.at('quadro_eletr',17.8,8,90);
});
room('wd3',c=>{ // área de descarga (laydown)
  c.row('conteiner',4,3.2,3,7.2,0,0);c.row('conteiner',4,6.4,3,7.2,0,0);c.at('conteiner',16.5,12.5,90);
  c.grid('palete',3,10.4,3,2,1.7,1.7,0);c.grid('tambores',4,17.5,4,1,3,0,0);c.row('bobina',3.2,22.6,3,2.6,0,0);
  c.at('fita',12,15.2,0,{sx:8});c.at('fita',12,24.6,0,{sx:8});c.at('cone_perigo',21.5,22,0);c.at('cone_perigo',21.5,25.4,0);c.at('carrinho',20,15.6,0);
});
room('wd6',c=>{ // baleeiras
  [3.8,10.3,16.8,23.3].forEach(x=>{c.at('bote',x,7,0,{sc:1.8});c.at('talha',x,3.3,0);});
  c.wall('s','colete',4,{at:[3,10,17,24]});c.at('luz_alerta',.8,.8,0);c.at('luz_alerta',27.2,.8,0);c.at('sirene',27.2,13,0);
});
room('wd7',c=>{ // depósito de EPI
  c.wall('w','estoque_caixas',3,{from:.5,to:10.5,rot:270});c.wall('n','cesto_epi',5,{from:3.5,to:12.8});c.wall('n','colete',4,{from:15.4,to:27.4});
  c.wall('s','scba',6,{from:.5,to:19});c.at('mesa',20.6,6.6,0);c.wall('s','kit_med',1,{at:[24.6]});c.at('cad_esc',20.6,7.6,0);
});
room('wd5',c=>{ // respiro de gás
  c.bar('tubo_reto',2,6,26,6);c.bar('tubo_reto',14,6,14,10.8,{});c.row('valvula',4.5,3.8,4,5.4,0,0);c.at('tanque',22,9,0);c.at('tanque',6,9,0);
  c.at('sirene',26.8,2.2,0);c.at('sirene',1.2,2.2,0);c.at('placa_restr',12,1.4,0);c.at('placa_restr',16,10.6,0);c.at('cone_perigo',20,10.6,0);c.at('cone_perigo',9,10.6,0);
});
room('wd14',c=>{ // ponto de reunião 3
  c.grid('ponto',3.5,3,4,3,3.2,3.2,0);c.lbl('MUSTER 3',9,.9);c.at('kit_med',16.5,2,0);c.at('kit_med',16.5,12,0);
  c.at('sirene',16.8,7,0);c.row('lampada',3,12.6,4,4,0,0);c.at('seta',15.6,5,0);c.at('seta',15.6,9.4,0);c.wall('s','colete',3,{at:[4,7,10]});
});
function crane(c){c.at('guindaste',6,3,0,{sc:1.6});c.at('quadro_eletr',2.2,5.2,0);c.at('carreta_ext',10.6,5.2,0);c.at('luz_alerta',1,1,0);}
room('wd8',crane);room('wd9',crane);room('wd10',c=>{c.at('guindaste',6,3,0,{sc:1.6});c.at('quadro_eletr',2.2,.7,0);c.at('carreta_ext',10.6,.7,0);c.at('luz_alerta',1,5,0);});
room('wd11',c=>{ // braço do flare
  c.at('torre_flare',11,6,0,{sc:2.2});c.bar('tubo_reto',.6,6.2,8.4,6.2);c.bar('guarda',1.5,1.2,13,1.2);c.bar('guarda',1.5,10.8,13,10.8);c.at('placa_restr',3,3.2,0);c.at('placa_restr',3,9,0);c.at('cone_perigo',6,8.4,0);
});
room('wd13',c=>{ // plataforma antiga (desativada)
  c.at('conteiner',7,5,12);c.at('conteiner',17,6.6,-8);c.row('tambores',3.6,12.6,2,3.2,0,0);c.at('tambores',12,15.4,35);c.at('barricada',12,19,0,{sx:2.4});c.at('bobina',19,15.4,0);
  c.at('lacre',12,2,0,{sx:3});c.at('mancha_p',13,10,0,{sx:2});c.at('cabo_p',8,9,20,{sx:1.5});c.at('tanque',20,19,0);c.at('placa_restr',4,19.6,0);
});
module.exports={};
