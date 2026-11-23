/* Cellar deck (+28 m): casa de máquinas, carga, moonpool, bombas, wellbay inferior. */
const {room}=require('./lib');

room('cd1',c=>{ // casa de máquinas (porta leste, y 11)
  c.row('motor_diesel',3.2,3.2,2,6.6,0,0,{sx:1.2,sy:1.2});c.row('gerador',3.2,6.2,2,6.6,0,0,{sx:1.3});
  c.row('compressor',3.4,10,3,5.4,0,0);c.bar('tubo_reto',1,8.2,18.6,8.2);c.bar('canaleta',1,12.4,12,12.4);
  c.row('bomba',3.4,15,4,4,0,0);c.row('valvula',3.4,17.6,3,5.6,0,0);c.at('vaso_pressao',12,20.4,0,{sx:.9,sy:.9});c.wall('n','quadro_eletr',2,{at:[16.6,18.4]});c.wall('w','escada_mao',1,{at:[11],rot:270});
});
room('cd4',c=>{ // área de carga
  c.row('conteiner',4.2,2.2,4,6.8,0,0);c.at('conteiner',33,2.2,0);c.grid('palete',37,2.3,3,1,1.5,0,0);
  c.grid('tambores',4,8.6,6,1,3.2,0,0);c.row('bobina',24.5,9.4,3,2.6,0,0);c.grid('palete',34,8.8,4,1,1.6,0,0);
  c.bar('canaleta',1,5.6,53,5.6);c.at('fita',27,11.4,0,{sx:12});c.at('carrinho',44,10.6,0);c.at('cone_perigo',52,11,0);c.at('placa_restr',2.4,11,0);
});
room('cd7',c=>{ // wellbay inferior: árvores de natal em grade, manifolds
  c.grid('poco',4.5,3,9,3,3.5,3.2,0);c.bar('tubo_reto',2,12.6,34,12.6);c.bar('canaleta',2,13.8,34,13.8);
  c.row('manifold',6,16.4,3,9,0,0);c.at('skid',31.4,16.4,0);c.wall('e','quadro_eletr',2,{from:2,to:6,rot:90});
});
room('cd2',c=>{ // sala de secagem
  c.wall('n','cabideiro',4,{from:.6,to:12.4});c.wall('w','secadora',3,{from:3.6,to:9.6,rot:270});c.wall('s','estante',2,{from:.6,to:8});
  c.at('mesa',7.4,7.6,0,{sx:1.1});c.at('cesto_roupa',7.4,6.3,0);c.at('palete',11.4,9.8,0,{sc:.8});c.wall('e','lixeira',1,{at:[1.6]});
});
room('cd3',c=>{ // dessalinização
  c.row('tanque',2.4,2.6,3,3.8,0,0);c.bar('tubo_reto',1,5,12,5);c.row('bomba',3,7.4,3,3.6,0,0);c.at('skid',9.2,10,0);c.wall('n','quadro_eletr',1,{at:[11.6],rot:90});c.wall('s','valvula',1,{at:[3.4]});
});
room('cd10',c=>{ // switchgear
  c.wall('n','quadro_eletr',4,{from:.5,to:9.6,sx:2.1});c.wall('e','quadro_eletr',3,{from:2.4,to:12.8,rot:90,sx:2.2});
  c.at('transformador',3.2,7.6,0,{sc:.8});c.at('rack',6.8,3.6,0);c.wall('s','painel_sinot',1,{at:[3],sx:.9});c.at('luz_alerta',1.4,14.2,0);c.at('placa_restr',8.6,14.4,0);
});
room('cd6',c=>{ // sala de mergulho
  c.wall('n','cilindros',4,{from:.4,to:7.6});c.wall('w','colete',2,{from:1.6,to:6,rot:270});c.at('bancada',3.6,6.6,0,{sx:.9});c.wall('e','tanque_am',1,{at:[2.4]});c.wall('e','caixa_ferr',2,{at:[4.8,7.2]});c.wall('s','scba',1,{at:[1.5]});
});
room('cd12',c=>{ // depósito de tintas
  c.wall('n','tambores',6,{from:.4,to:15.8});c.wall('w','estante',1,{at:[4.6],rot:270});c.wall('s','palete',3,{at:[1.4,3.1,13]});c.at('palete',13.2,3.6,0);
  c.at('lava_olhos',15.4,6.8,0);c.at('placa_restr',3.4,4.6,0);c.at('cone_perigo',10,5.2,0);
});
room('cd5',c=>{ // moonpool: abertura central com guarda-corpo, guincho em A, carretel
  c.at('alcapao',11,9,0,{sx:8.5,sy:5.6});
  c.bar('guarda',5.1,4.9,16.9,4.9);c.bar('guarda',5.1,13.1,16.9,13.1);c.bar('guarda',5.1,4.9,5.1,13.1);c.bar('guarda',16.9,4.9,16.9,13.1);
  c.at('talha',3.2,4.4,0);c.at('talha',18.8,4.4,0);c.at('bobina',2.6,15,0);c.at('bobina',19.4,15,0);c.at('cabo_p',8,3,0);
  c.at('quadro_eletr',1.1,9.4,90);c.at('escada_mao',20.6,9,90);c.at('cone_perigo',3.8,10,0);c.at('cone_perigo',18.2,10,0);c.at('luz_alerta',1,1,0);c.at('luz_alerta',21,1,0);c.at('placa_restr',8,16.8,0);
});
room('cd8',c=>{ // guincho do umbilical
  c.at('bobina',3.4,3.8,0,{sc:2});c.at('bobina',10.6,3.8,0,{sc:2});c.at('motor_diesel',7,3.8,0,{sx:.6,sy:.8});c.wall('s','quadro_eletr',2,{at:[2.6,11.6]});c.at('cabo_p',7,6.1,0,{sx:1.3});
});
room('cd11',c=>{ // bombas de incêndio
  c.at('motor_diesel',3.4,2,0);c.at('bomba',3.4,3.4,0);c.at('motor_diesel',9.4,2,0);c.at('bomba',9.4,3.4,0);
  c.at('tanque_h',11,5.6,0,{sx:.6,sy:.7});c.bar('tubo_reto',1,4.7,12,4.7);c.wall('s','valvula',2,{at:[1.6,3.9]});c.wall('s','quadro_eletr',1,{at:[10.6]});
});
room('cd_hpu',c=>{ // unidade hidráulica
  c.at('skid',3.2,2.4,0);c.at('skid',7.2,2.4,0);c.at('tanque_h',12.6,2.4,0);c.row('bomba',3,5.6,3,3.4,0,0);c.wall('n','quadro_eletr',1,{at:[14.4]});c.at('cilindros',14,6.4,0);
});
room('cd9',c=>{ // ROV bay: ROV no berço, cabine de pilotagem, carretel
  c.at('skid',8,6.6,0,{sx:1.3,sy:1.2});c.at('caixa_ferr',6.2,9.4,0);c.at('bobina',12.6,6.6,0,{sc:1.3});c.at('talha',8,3.2,0);
  c.at('mesa',3.8,13.6,0,{sx:1.2});c.at('par_monitores',3.8,13.2,0);c.at('cad_esc',3.8,14.6,0);c.at('mesa',9.4,13.6,0,{sx:1.2});c.at('par_monitores',9.4,13.2,0);c.at('cad_esc',9.4,14.6,0);
  c.wall('w','bancada',1,{at:[7],rot:270});c.wall('e','ferramental',2,{at:[10,13],rot:90});c.wall('e','carrinho',1,{at:[15.2]});
});
room('cd13',c=>{ // resíduos
  c.grid('tambores',2.6,3,2,3,3,3.2,0);c.grid('barril',9.6,3,1,5,0,1.2,0);c.at('skid',6,12.6,0);c.wall('s','lixeira',3,{at:[1.4,2.4,10.4]});c.at('chuv_emerg',9.6,10.6,0);c.at('placa_restr',2,12.6,0);
});
room('cd_bal',c=>{ // controle de lastro
  c.wall('n','painel_sinot',1,{at:[7],sx:2.1});c.at('mesa',4.4,4,0,{sx:1.3});c.at('par_monitores',4.4,3.6,0);c.at('cad_esc',4.4,5,0);c.at('mesa',9.6,4,0,{sx:1.3});c.at('par_monitores',9.6,3.6,0);c.at('cad_esc',9.6,5,0);
  c.wall('s','rack',3,{from:.6,to:6}); c.wall('e','quadro_eletr',2,{from:4,to:8.4,rot:90});c.at('radio',12.6,2.6,0);c.wall('s','arquivo',1,{at:[9]});
});
room('cd_swp',c=>{ // bombas de água do mar
  c.row('bomba',3.4,4.6,4,2.9,0,0,{sc:1.3});c.bar('tubo_reto',1,2.4,13,2.4);c.bar('tubo_reto',1,7.4,13,7.4);c.row('valvula',3,9.6,4,3,0,0);c.wall('s','quadro_eletr',3,{from:.6,to:9});c.at('chuv_emerg',12.8,11.4,0);
});
room('cd14',c=>{ // almoxarifado
  c.wall('w','estoque_caixas',2,{from:.6,to:6.6,rot:270});c.wall('s','estoque_caixas',3,{from:3,to:11.4});c.at('palete',9.4,3.4,0);c.at('palete',9.4,1.9,0);c.at('carrinho',6.4,5.2,0);c.wall('e','arquivo',1,{at:[4.4]});
});
room('cd15',c=>{ // M12 · desativada e selada: só marcas de onde havia equipamento
  c.at('tapete',8,3.8,0,{sx:6,sy:2.8});c.at('lacre',8,.9,0,{sx:2.4});c.at('fita',8,6.9,0,{sx:5});c.at('placa_restr',4,5.6,0);c.at('placa_restr',12.4,5.6,0);c.at('cone_perigo',2,6.4,0);c.at('barricada',8,6.2,0);
});
room('cd_sp',c=>{ // peças sobressalentes
  c.wall('n','estoque_caixas',4,{from:.4,to:15.6});c.wall('s','estoque_caixas',4,{from:.4,to:15.6});c.row('bobina',3,4,4,3.4,0,0,{sc:.9});c.at('carrinho',14.6,3.8,0);c.wall('w','palete',1,{at:[3.8],gap:.1});
});
room('cd_cab',c=>{ // sala de cabos
  c.row('bobina',2.6,2.6,4,2.8,0,0);c.bar('canaleta',1,4.8,11,4.8);c.wall('s','cx_juncao',5,{from:.6,to:8.4});c.wall('s','quadro_eletr',1,{at:[10.4]});c.at('cabo_p',6,6.2,0);
});
room('cd_hot',c=>{ // oficina de trabalho a quente
  c.wall('n','bancada',2,{at:[1.9,4.9],sx:.9});c.at('torno',10.4,1.4,0,{sx:.9});c.row('cilindros',1.8,5.4,4,1.3,0,0);c.at('carrinho',9,4.8,0);c.at('caixa_ferr',11.4,4.6,0);c.wall('s','lava_olhos',1,{at:[13]});c.at('placa_restr',6,6.7,0);c.at('mesa',8,5.8,0,{sx:.9});
});
room('cd_chm',c=>{ // depósito químico
  c.wall('n','tambores',3,{at:[1,2.6,8.4]});c.wall('w','palete',2,{from:2.4,to:6.4,rot:270});c.at('tanque_am',8.4,5.2,0);c.wall('s','barril',3,{at:[3.2,4.4,5.6]});c.at('chuv_emerg',9.6,3.2,0,{});c.at('lava_olhos',3.4,6.6,0);
});
room('cd_pwt',c=>{ // tratamento de agua produzida
  c.at('vaso_pressao',6,2.2,0);c.at('vaso_pressao',14,2.2,0);c.bar('tubo_reto',1,4.4,19,4.4);c.row('bomba',3.6,6.4,3,3.4,0,0);c.at('tanque',17.6,6.6,0);c.wall('s','quadro_eletr',2,{at:[3,16]});c.at('valvula',13.4,6.4,0);
});
room('cd_slop',c=>{ // tanque de residuos oleosos
  c.at('tanque_h',4,2.6,0);c.at('tanque_h',4,5.6,0);c.at('bomba',8.8,3.4,0);c.at('skid',9.4,6.8,0);c.at('caixa_ferr',1.4,8.8,0);c.at('placa_restr',6.4,9.2,0);c.at('chuv_emerg',11.2,8.6,0);c.bar('tubo_reto',1,.9,7,.9);
});
room('cd_clo',c=>{ // cloracao
  c.row('bomba_dos',1.6,2.9,3,1.6,0,0);c.at('tanque_am',7.6,2.5,0);c.at('skid',3.6,4.9,0);c.at('tanque_am',7.6,5.2,0);c.wall('w','quadro_eletr',1,{at:[6.4],rot:270});c.at('lava_olhos',9.2,3.4,0,{});
});
room('cd_egen',c=>{ // gerador de emergencia
  c.at('motor_diesel',5,3.2,0,{sx:1.3});c.at('motor_diesel',14.6,3.2,0,{sx:1.3});c.at('gerador',5,6.2,0,{sx:1.2});c.at('gerador',14.6,6.2,0,{sx:1.2});c.at('tanque_h',10,6.2,0,{sx:.6,sy:.6});
  c.wall('w','rack',2,{from:2.6,to:5,rot:270});c.wall('s','quadro_eletr',2,{at:[1.8,18.4]});c.bar('tubo_reto',1,.9,19,.9);
});
module.exports={};
