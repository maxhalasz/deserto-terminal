/* Torre de alojamento (LQ): decks E (+58) a A (+42). */
const {room,cabRow}=require('./lib');

/* ---------- Deck E: cobertura ---------- */
room('lqE1',c=>{ // acesso ao heliponto: sala de espera de embarque
  c.at('escada_f',5,2,0,{sy:.65});c.wall('w','sofa',2,{from:3,to:10,rot:270});c.wall('e','sofa',2,{from:3,to:10,rot:90});c.at('mesa_r',5,6.4,0);
  c.wall('n','armario',2,{at:[1.5,8.5]});c.wall('s','cesto_epi',2,{at:[1.4,8.6]});c.at('balcao',5,12.2,0,{sx:.9});c.at('terminal_p',5,12.2,0);c.at('cad_esc',5,13.1,0);c.at('lixeira',1,10.5,0);
});
room('lqE2',c=>{ // casa de máquinas do elevador
  c.at('gerador',4,3,0,{sx:1.8,sy:1.8});c.at('compressor',4,6.4,0,{sx:1.5});c.wall('n','quadro_eletr',2,{at:[2,6]});c.wall('e','talha',2,{at:[6,10]});c.wall('s','quadro_eletr',2,{at:[1.2,6.8]});c.at('caixa_ferr',4,10.4,0);c.at('placa_restr',4,12.6,0);
});
room('lqE4',c=>{ // unidades de tratamento de ar
  c.at('skid',4.3,3.2,0,{sx:1.5});c.at('skid',4.3,6.8,0,{sx:1.5});c.at('skid',4.3,10.4,0,{sx:1.5});c.bar('tubo_reto',.8,1.2,7.8,1.2);c.wall('w','quadro_eletr',2,{from:12.4,to:15.4,rot:270});c.wall('e','caixa_ferr',1,{at:[13]});
});
room('lqE6',c=>{ // deck das antenas (ao ar livre)
  [3,8,13.3,18.6,23.6].forEach(x=>{c.at('pilar',x,3,0);c.at('cx_juncao',x+1.1,3.9,0);});
  c.bar('cabo_p',3,3,23.6,3,{});c.bar('guarda',.6,.6,26,.6);c.bar('guarda',.6,5.4,26,5.4);c.at('luz_alerta',.8,.8,0);c.at('luz_alerta',25.8,.8,0);c.at('quadro_eletr',13.3,1.4,0);
});
function core(c){c.at('alcapao',1.6,1.5,0,{sx:1.8,sy:1.8});c.at('quadro',1.6,6.7,0);c.at('lixeira',.5,5.8,0);}
function stair(c){c.at('escada_f',c.w/2+.4,c.h/2,90,{sy:1.9,sx:1.2});}
room('lqE0',core);room('lqE9',c=>{c.at('escada_f',1.6,3.5,0,{sx:2.2,sy:2.2});});

/* ---------- Deck D: administração ---------- */
room('lqD1',c=>{ // comunicações
  c.wall('n','rack',4,{from:.4,to:5.8,rot:0});c.at('mesa',3.1,7.6,0,{sx:1.45});c.at('radio',2.2,7.6,0);c.at('gravador',3.9,7.6,0);c.at('cad_esc',3.1,8.6,0);
  c.wall('w','estante',2,{from:9.6,to:14.6,rot:270});c.wall('e','par_monitores',1,{at:[6],rot:90});c.at('impressora',4.4,12.6,0);
});
room('lqD2',c=>{ // sala de câmeras: parede de monitores e bancada de operador
  c.wall('n','par_monitores',2,{from:.6,to:6.8});c.wall('n','par_monitores',1,{at:[3.7],gap:.7});
  c.at('mesa',3.7,6.6,0,{sx:1.6});c.at('cad_esc',2.6,7.6,0);c.at('cad_esc',4.8,7.6,0);c.wall('w','rack',3,{from:9,to:14.6,rot:270});c.wall('e','arquivo',3,{from:9,to:14.6,rot:90});c.at('cafeteira',3.7,11.4,0);c.at('mesa',3.7,12.2,0);
});
room('lqD3',c=>{ // escritório do OIM
  c.at('mesa_esc',3,6.2,0,{sx:1.4});c.at('cad_esc',3,5.2,180);c.at('cadeira',2.2,7.6,0);c.at('cadeira',3.8,7.6,0);c.wall('w','estante',2,{from:9,to:14.4,rot:270});c.wall('e','cofre',1,{at:[2.4]});
  c.wall('e','sofa',1,{at:[12],rot:90});c.wall('n','mapa_par',1,{at:[3],sx:1.5});c.at('tapete',3,6.8,0,{sx:.9,sy:.9});c.wall('s','quadro',1,{at:[1.2]});
});
room('lqD4',c=>{ // sala de reunião
  c.at('mesa_g',3.5,8,90);c.wall('w','cadeira',5,{from:5.4,to:10.6,gap:.9,rot:270});c.wall('e','cadeira',5,{from:5.4,to:10.6,gap:.9,rot:90});
  c.at('cadeira',3.5,5.6,0);c.at('cadeira',3.5,10.4,180);c.wall('n','quadro_br',1,{at:[3.5],sx:.9});c.wall('s','tv',1,{at:[1.3]});c.wall('w','cafeteira',1,{at:[1.8]});
});
room('lqD5',c=>{ // escritórios
  c.row('mesa_esc',1.4,2.4,2,2.6,0,0);c.row('cad_esc',1.4,3.3,2,2.6,0,180);c.at('mesa_esc',6.4,4.6,0);c.at('cad_esc',6.4,5.4,0);c.wall('w','arquivo',2,{from:3,to:5.6,rot:270});c.at('impressora',7.4,1.6,0);
});
room('lqD6',c=>{ // arquivo
  c.wall('w','arquivo',5,{from:.6,to:5.6,rot:270});c.wall('e','arquivo',5,{from:.6,to:5.6,rot:90});c.wall('s','estante',1,{at:[2.8],sx:.9});c.at('mesa_esc',2.8,3.4,0,{sx:.9});c.at('cad_esc',2.8,4.3,0);
});
room('lqD8',c=>{ // copa
  c.wall('n','cafeteira',1,{at:[3.3]});c.wall('n','geladeira',1,{at:[.8]});c.at('mesa_r',2,3.4,0,{sc:.8});c.wall('s','bebedouro',1,{at:[3.4]});c.wall('s','lixeira',1,{at:[.6]});
});
room('lqD10',c=>{ // sala de treinamento
  c.wall('s','quadro_br',1,{at:[4.5],sx:.9});c.row('mesa',2.2,2.6,3,2.4,0,0,{sx:1});c.row('cadeira',2.2,3.5,3,2.4,0,0);c.wall('e','tv',1,{at:[3],rot:90});c.wall('w','estante',1,{at:[3],rot:270});
});
room('lqD0',core);room('lqD9',c=>{c.at('escada_f',1.6,3.5,0,{sx:2.2,sy:2.2});});

/* ---------- Deck C: dormitórios de rotação ---------- */
room('lqC1',c=>cabRow(c));                               // dormitórios A
room('lqC3',c=>cabRow(c,{vacant:true}));                 // cabines 1–6, vagas
room('lqC2',c=>{ // lavabos A
  c.wall('w','lavatorio',4,{from:.8,to:9.2});c.wall('e','vaso',4,{from:1,to:9.2});c.at('chuveiro',1.5,1.5,0);c.at('chuveiro',5.4,1.5,0);c.at('chuveiro',1.5,8.5,180);c.at('chuveiro',5.4,8.5,180);c.at('lixeira',3.5,5,0);
});
room('lqC5',c=>{ // sala de estudo
  c.row('mesa',2.3,3.4,2,3.6,0,0);c.row('mesa',2.3,6.6,2,3.6,0,0);c.row('cadeira',1.7,4.3,4,1.8,0,0);c.wall('w','estante',2,{from:.6,to:9.4,rot:270});c.wall('e','estante',2,{from:.6,to:9.4,rot:90});
});
room('lqC6',c=>{ // sala silenciosa
  c.wall('w','poltrona',3,{from:.6,to:4.4,rot:270});c.at('tapete',5,2.5,0,{sx:1,sy:1});c.at('poltrona',5.8,2.5,0);c.wall('e','estante',1,{at:[4.2],rot:90,sx:.8});c.wall('s','estante',1,{at:[6.4],sx:.9});
});
room('lqC4',c=>{ // rouparia
  c.wall('n','rack_roupa',2,{from:.5,to:4,gap:.1});c.wall('w','estante',1,{at:[2.5],rot:270,sx:.9});c.wall('e','cesto_roupa',2,{at:[1.4,3.6],rot:90});c.at('carrinho',2.2,2.6,0);
});
room('lqC7',c=>{ // depósito
  c.wall('n','estoque_caixas',1,{at:[2.2],sx:.8});c.wall('w','palete',2,{at:[1.4,3.4]});c.wall('e','caixa_ferr',1,{at:[1.2]});c.at('cesto_epi',3.4,3.6,0);
});
room('lqC0',core);room('lqC9',c=>{c.at('escada_f',1.6,3.5,0,{sx:2.2,sy:2.2});});
room('lqC8',c=>{ // saída pro weather deck: escotilha, EPI, aviso
  c.at('escada_f',1.6,11.6,0,{sy:.6});c.wall('w','colete',2,{from:1.2,to:7.4,rot:270});c.wall('e','cesto_epi',2,{from:1.2,to:7.4,rot:90});c.at('placa_restr',1.6,10,0);c.at('luz_alerta',1.6,.6,0);
});

/* ---------- Deck B: dormitórios, quase todo lacrado ---------- */
room('lqB4',c=>cabRow(c));                               // dormitórios B (em uso)
room('lqB1',c=>cabRow(c,{vacant:true}));                 // cabines lacradas
room('lqB3',c=>cabRow(c,{vacant:true}));
room('lqB2',c=>{ // sala de TV desativada
  c.wall('w','sofa',1,{at:[2.5],rot:270});c.wall('w','poltrona',2,{at:[2.3,4.2],rot:270,gap:1.7});c.wall('e','tv',1,{at:[2.5],rot:90});c.at('mesa_r',3.6,3,0,{sc:.7});c.at('lacre',3,.8,0,{sx:.5});
});
room('lqB5',c=>{ // depósito
  c.wall('n','estoque_caixas',2,{from:.6,to:5.4});c.wall('w','palete',1,{at:[3],gap:.1});c.at('carrinho',4.2,2.6,0);
});
room('lqB6',c=>{ // lavabos lacrados
  c.wall('w','lavatorio',3,{from:1.4,to:8.4});c.wall('e','vaso',3,{from:1.4,to:8.4});c.at('lacre',3,5.2,90,{sx:.8});c.at('fita',3,4.9,0,{sx:.9});c.at('placa_restr',3,6.2,0);
});
room('lqB7',c=>{ // lavabos B
  c.wall('w','lavatorio',3,{from:1.4,to:8.4});c.wall('e','vaso',3,{from:1.4,to:8.4});c.at('lixeira',1,9.2,0);
});
room('lqB8',c=>{ // fim do corredor: parede rebocada, material de obra
  c.bar('divisoria',.6,5,5.6,5);c.at('palete',1.4,2.2,0);c.at('escada_mao',4.6,2.4,0);c.at('carrinho',4.8,7.6,0);c.at('caixa_ferr',1.4,7.6,0);c.at('fita',3.1,4.2,0,{sx:1.6});c.at('mancha_p',3.1,5.3,0,{sx:1.4});
});
room('lqB0',core);room('lqB9',c=>{c.at('escada_f',1.6,3.5,0,{sx:2.2,sy:2.2});});

/* ---------- Deck A: refeitório, cozinha, estar, enfermaria ---------- */
room('lqA0',core);room('lqA9',c=>{c.at('escada_f',1.6,3.5,0,{sx:2.2,sy:2.2});});
room('lqA1',c=>{ // refeitório
  [[3.4,3.2],[8.6,3.2],[8.6,7.4]].forEach(([x,y])=>{c.at('mesa_ref',x,y,0);c.row('cadeira',x-.9,y-1.35,3,.9,0,0);c.row('cadeira',x-.9,y+1.35,3,.9,0,180);});
  c.at('mesa_r',2.4,6.2,0);c.at('mesa_r',5.2,6.2,0);c.wall('n','vending',1,{at:[11.2]});c.wall('n','bebedouro',1,{at:[6.2]});c.wall('w','quadro',1,{at:[5.8]});
});
room('lqA3',c=>{ // cozinha
  c.wall('w','fogao',2,{at:[3.4,4.6]});c.wall('e','pia_coz',1,{at:[1.5]});c.at('mesa',4.4,3.4,0,{sx:.9});c.wall('e','geladeira',1,{at:[3.6]});c.wall('s','lixeira',1,{at:[5.6]});
});
room('lqA4',c=>{ // despensa
  c.wall('w','estoque_caixas',2,{from:.4,to:5.6,rot:270,sx:.9});c.wall('e','estante',2,{from:.4,to:5.6,rot:90,sx:.9});
});
room('lqA5',c=>{ // câmara fria
  c.wall('w','freezer',2,{from:.4,to:4,rot:270,sx:.9,sy:.9});c.wall('e','estoque_caixas',1,{at:[1.2],rot:90,sx:.7});
});
room('lqA2',c=>{ // sala de estar
  c.at('tapete',6.4,5,0,{sx:1.6,sy:1.6});c.wall('n','sofa',2,{from:2,to:10.6});c.wall('w','poltrona',2,{at:[3,7.4],rot:270,gap:1.4});c.at('mesa_r',7.2,5.6,0);c.wall('s','tv',1,{at:[6.2]});c.at('mesa_bilhar',9.4,8,0,{sc:.8});c.wall('e','estante',1,{at:[4.6],rot:90});
});
room('lqA6',c=>{ // lavanderia
  c.wall('n','lavadora',4,{from:.4,to:4.8});c.wall('n','secadora',3,{from:5.2,to:8.6});c.wall('e','rack_roupa',1,{at:[2.4],rot:90});c.at('mesa',8.4,3.7,0);c.wall('s','cesto_roupa',3,{from:8,to:12});c.wall('w','estante',1,{at:[5],rot:270});
});
room('lqA7',c=>{ // enfermaria
  c.wall('s','maca',3,{from:.4,to:9.6});c.wall('n','armario_cont',2,{from:.6,to:4.6});c.wall('e','mesa_exame',1,{at:[2.5],rot:90});c.wall('n','kit_med',1,{at:[7.6]});c.at('lixeira',8.6,1.4,0);c.at('cad_esc',6.6,3.2,0);
});
room('lqA8',c=>{ // sala do médico
  c.at('mesa_esc',4.8,3.6,90);c.at('cad_esc',3.9,3.6,270);c.wall('w','arquivo',2,{from:2.6,to:5.4,rot:270});c.wall('s','armario',1,{at:[3]});c.at('kit_med',4.9,1.4,0);
});
room('lqA10',c=>{ // sala comum
  c.wall('w','sofa',1,{at:[3],rot:270});c.wall('s','mesa',2,{from:2,to:8.8});c.row('cadeira',2.6,3.6,2,3.2,0,0);c.wall('e','estante',1,{at:[3],rot:90});c.wall('n','quadro',2,{at:[3,8]});c.at('tapete',5.4,3.2,0,{sx:.9,sy:.8});
});
module.exports={};
