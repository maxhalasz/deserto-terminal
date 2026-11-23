/* Module deck (+40 m): cabines, áreas de apoio e módulos de processo. */
const {room,cabRow}=require('./lib');

room('md_off',c=>cabRow(c,{extra:(i,p,w,d)=>{if(i%3===0)p('quadro',w/2,.1,0);}}));          // cabines dos oficiais
room('md_crw',c=>cabRow(c,{extra:(i,p,w,d)=>{if(i%2===1)p('cesto_roupa',.45,d-.3,0);}}));    // cabines da tripulação

room('md_ow',c=>{ // lavabo dos oficiais
  c.wall('w','lavatorio',3,{from:2,to:6});c.wall('e','vaso',3,{from:2,to:6.4});c.wall('s','chuveiro',2,{from:1.2,to:5.2});
  c.wall('n','lixeira',1,{at:[1],gap:.1});c.wall('n','armario',1,{at:[6]});
});
room('md_om',c=>{ // refeitório dos oficiais
  [[3.3,4.15],[8,4.15]].forEach(([x,y])=>{c.at('mesa_ref',x,y,0);c.row('cadeira',x-.9,y-1.35,3,.9,0,0);c.row('cadeira',x-.9,y+1.35,3,.9,0,180);});
  c.wall('w','geladeira',1,{from:.3,to:1.2});c.wall('w','pia_coz',1,{from:1.4,to:3.2});c.wall('w','fogao',1,{from:3.3,to:4.3});
  c.wall('s','vending',1,{at:[10.7]});c.wall('n','tv',1,{at:[2.6]});c.wall('n','cafeteira',1,{at:[9.6]});
});
room('md_cl',c=>{ // enfermaria
  c.wall('n','armario',2,{from:5,to:7.8});c.wall('e','mesa_exame',1,{from:2.3,to:4.7});c.wall('s','maca',2,{from:.6,to:7.4});
  c.wall('n','mesa_esc',1,{at:[1.3]});c.at('cad_esc',1.3,1.3,0);c.wall('w','kit_med',1,{at:[1.7]});c.at('lixeira',6.6,1.45,0);
});
room('md_ol',c=>{ // lavanderia
  c.wall('w','lavadora',3,{from:.4,to:3.6,rot:270});c.wall('w','secadora',2,{from:4.2,to:6.8,rot:270});
  c.wall('n','rack_roupa',1,{at:[6.6]});c.wall('s','cesto_roupa',3,{from:3,to:7.4});c.at('mesa',4.2,4.1,0);c.wall('e','lixeira',1,{at:[6.2]});
});
room('md_gym',c=>{ // academia (cabe na sala de 13x14)
  c.wall('n','esteira',3,{from:.8,to:6,rot:0});c.wall('n','bicicleta',2,{from:7,to:10.4,rot:0});
  c.wall('w','rack_pesos',2,{from:5.4,to:9.4,rot:270});c.at('supino',4.5,8.5,90);c.at('supino',4.5,11,90);
  c.at('tapete',8,10,0,{sx:2.4,sy:2});c.wall('s','bebedouro',1,{at:[1.2]});c.wall('s','estante',1,{at:[3.2]});c.wall('s','quadro',1,{at:[7],gap:.04});
});
room('md0',c=>{ // lounge redondo: poltronas em anel, mesa baixa no centro, relógio, quadros
  const cx=c.w/2,cy=c.h/2;
  c.at('tapete',cx,cy,0,{sx:1.8,sy:1.9});c.at('mesa_r',cx,cy,0);
  for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8,rr=3.7;c.at('poltrona',cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,Math.round((a*180/Math.PI+90)/90)*90%360);}
  c.at('lixeira',cx-1.3,cy+1.1,0);c.at('bebedouro',cx+1.2,cy-1.4,0);
});
room('md1',c=>{ // sala das botas: armários com nome em fita, estrado gradeado, faixa amarela
  c.wall('n','armario',5,{from:.5,to:8.2});c.wall('w','armario',3,{from:2.2,to:6.4});
  c.at('grade_p',6.9,6.3,0,{sx:.85});c.row('esc_marin',3.1,5.1,3,.9,0,0);
  c.at('fita',5.1,4.7,0,{sx:3.3});c.wall('e','cesto_epi',1,{at:[1.4]});
});
room('md2',c=>{ // sala de controle: seis monitores, painel sinótico, encosto lustroso
  c.wall('w','painel_sinot',1,{at:[3.8],sx:1.4,rot:270});
  c.at('mesa',3.4,3.1,0,{sx:1.55});c.at('par_monitores',3.4,2.6,0);c.at('cad_esc',3.4,4,0);
  c.at('mesa',7.2,3.1,0,{sx:1.2});c.at('par_monitores',7.2,2.6,0);c.at('cad_esc',7.2,4,0);
  c.wall('s','rack',3,{from:.5,to:5.5});c.wall('s','arquivo',1,{at:[7.3]});c.at('cafeteira',9.4,6.6,0);c.at('radio',9.3,2.3,0);
});
room('md3',c=>{ // oficina elétrica
  c.wall('n','quadro_eletr',3,{from:.5,to:4.6,sx:1.25});c.wall('w','bancada',2,{at:[2.15,6.9]});c.at('carrinho',4.3,6.1,0);
  c.wall('s','caixa_ferr',2,{from:.8,to:4.4});c.at('transformador',8.3,5.5,90,{sx:.55,sy:.55});c.wall('e','cx_juncao',2,{from:1.4,to:3});c.wall('e','cilindros',1,{at:[7.4],rot:270});
});
room('md12',c=>{ // depósito seco
  c.wall('w','estoque_caixas',3,{from:.4,to:8.6,rot:270});c.at('palete',3,.8,0);c.at('palete',3,2.3,0);c.at('palete',3,6.9,0);
});
room('md11',c=>{ // lavabo da tripulação
  c.wall('w','lavatorio',4,{from:.3,to:5.4});c.wall('e','vaso',3,{from:.8,to:4.3});c.wall('s','chuveiro',3,{at:[1,2.2,7.8]});c.wall('n','armario',1,{at:[4.4]});c.at('lixeira',7.4,2,0);
});
room('md_cd',c=>{ // sala de convivência da tripulação
  c.wall('w','sofa',2,{from:.4,to:9.8,rot:270});c.at('mesa_r',4.1,6.6,0);c.row('poltrona',3,10.8,2,2,0,0);
  c.wall('n','tv',1,{at:[4.9]});c.wall('e','estante',2,{at:[3.5,12]});c.wall('s','vending',1,{at:[1.2]});c.at('mesa',2.6,12.8,0);
  c.at('cadeira',2.6,12,0);c.at('cadeira',2.6,13.6,180);c.at('tapete',3.6,6.6,0,{sx:1.5,sy:1.3});
});
room('md_lc',c=>{ // lavanderia da tripulação
  c.wall('n','lavadora',4,{from:.4,to:4.4});c.wall('n','secadora',3,{from:4.5,to:7.7});c.wall('w','cesto_roupa',2,{at:[1.6,6.5]});c.at('mesa',4.5,5.6,0,{sx:1.2});c.wall('e','rack_roupa',1,{at:[5.4],rot:90});
});
room('md_ppe',c=>{ // armário de EPI
  c.wall('w','armario',4,{from:.4,to:7.6,rot:270});c.wall('n','cesto_epi',4,{from:1.2,to:7.4});c.wall('e','colete',2,{at:[1.8,6.6]});c.at('mesa',3.8,5.4,0,{sx:.9});c.wall('s','scba',2,{at:[1.2,6.8]});
});
room('md_ins',c=>{ // oficina de instrumentação
  c.wall('n','bancada',3,{from:.4,to:9.6});c.at('mesa_esc',2.1,2.5,0);c.at('terminal_p',2.1,2.5,0);c.at('cad_esc',2.1,3.3,0);c.wall('w','estante',1,{at:[3.9],rot:270});c.at('caixa_ferr',3.4,3.9,0);c.at('carrinho',7.6,3.6,0);c.wall('e','quadro_eletr',1,{at:[3.5],rot:90});
});
room('md_scba',c=>{ // reserva de SCBA
  c.wall('n','scba',3,{from:.4,to:6.8});c.wall('w','cilindros',2,{from:1.6,to:4.7,rot:270});c.wall('e','armario',2,{from:1.8,to:4.6,rot:90});
});
room('md_trf',c=>{ // sala dos transformadores
  c.wall('n','transformador',2,{from:.4,to:5.4,sx:.95,sy:.9});c.wall('s','quadro_eletr',2,{at:[.8,5]});c.at('luz_alerta',2.9,2.7,0);
});
room('md_swu',c=>{c.at('escada_f',c.w/2,c.h/2,0,{sy:2.4});});
room('md_swd',c=>{c.at('escada_f',c.w/2,c.h/2,0,{sy:2.4});});
room('md_se',c=>{c.at('escada_f',c.w/2,c.h/2,0,{sy:2.4});});

/* ---------- módulos de processo ---------- */
room('md4',c=>{ // M10 · Wellbay: cabeças de poço em grade, linhas de produção, calha de cabos
  c.grid('poco',2.3,3,5,3,3.0,3.2,0);
  c.bar('tubo_reto',1.4,13.4,16.2,13.4);c.bar('canaleta',1.4,14.6,16.2,14.6);
  [2.3,5.3,8.3,11.3,14.3].forEach(x=>c.bar('tubo_reto',x,10.3,x,13.1));
  c.at('manifold',3,16.4,0);c.at('manifold',8,16.4,0);c.at('skid',13.6,16.9,0);
  c.wall('e','quadro_eletr',2,{from:1.4,to:4.6,rot:90});c.wall('s','chuv_emerg',1,{at:[16.4]});c.wall('w','escada_mao',1,{at:[11.5],rot:270});
});
room('md5',c=>{ // M11 · Mud room: tanques de lama, bombas, linhas
  c.row('tanque',2.2,3.1,3,3.8,0,0);c.bar('tubo_reto',1.2,5.7,17.8,5.7);
  c.row('bomba',3,8.1,3,4.4,0,0);c.row('bomba_dos',3.5,10.6,3,4.4,0,0);
  c.at('skid',16.4,12.2,0);c.row('tambores',3.2,14,3,3.6,0,0);c.at('bobina',15.4,14.3,0);c.wall('e','quadro_eletr',2,{from:1.4,to:3.6,rot:90});
});
room('md_lab',c=>{ // mud lab
  c.wall('n','bancada',2,{from:.4,to:6.8});c.at('centrifuga',1.2,2.5,0);c.at('microscopio',5.8,2.5,0);c.at('balcao',3.6,4.6,0,{sx:.9});
  c.wall('e','freezer',1,{at:[4.2]});c.wall('s','armario',2,{at:[1.2,6]});c.at('cad_esc',3.6,5.3,0);c.wall('w','amostras',1,{at:[3.3],rot:270});
});
room('md_chem',c=>{ // depósito químico
  c.wall('n','tambores',4,{from:.4,to:8.4});c.wall('w','palete',2,{from:2,to:6.2});c.wall('e','tanque_am',1,{at:[1.2]});c.wall('s','barril',5,{at:[1,2,3,8,9]});c.at('chuv_emerg',4.4,5.8,0);c.at('lava_olhos',11.6,6.4,0);c.at('placa_restr',7,3.9,0);
});
room('md6',c=>{ // M20 · Separation: separadores horizontais, bombas, painel
  c.at('vaso_pressao',5.6,4.2,0);c.at('vaso_pressao',12.6,4.2,0);c.at('vaso_pressao',19.6,4.2,0);
  c.bar('tubo_reto',2.4,7.4,23.2,7.4);c.bar('canaleta',2.4,8.2,23.2,8.2);
  c.row('bomba',3,10.6,4,5.4,0,0);c.row('valvula',3,13.6,4,5.4,0,0);c.at('skid',22.6,16.2,0);c.wall('s','quadro_eletr',3,{from:1,to:9});c.wall('e','escada_mao',1,{at:[11],rot:90});
});
room('md8',c=>{ // M22 · Decommissioned: equipamento retirado, só marcas no piso, lacre
  c.at('tapete',12,9.3,0,{sx:8,sy:4.6});c.row('tanque',4,4.5,3,6,0,0,{});
  c.at('tubo_reto',8,14.4,0,{sx:2});c.at('lacre',12,17.3,0,{sx:4});c.at('cone_perigo',5,16.6,0);c.at('cone_perigo',7.2,16.6,0);c.at('cone_perigo',13,16.6,0);c.at('cone_perigo',15.4,16.6,0);c.wall('n','placa_restr',2,{from:5,to:19});c.at('lampada',12,9.3,0);
});
room('md7',c=>{ // M21 · Compression: compressores e depuradores
  c.at('compressor',4.6,5,90,{sx:1.7,sy:1.5});c.at('compressor',4.6,10,90,{sx:1.7,sy:1.5});c.at('compressor',4.6,15,90,{sx:1.7,sy:1.5});
  c.at('vaso_pressao',10.2,7.4,90,{sx:.8,sy:.9});c.at('vaso_pressao',10.2,15.4,90,{sx:.8,sy:.9});c.bar('tubo_reto',7.2,2.6,7.2,22);c.wall('s','quadro_eletr',2,{from:1,to:11.4});
});
room('md10',c=>{ // M31 · Workshop: tornos, bancadas, soldagem, ferramental
  c.at('torno',2.1,3.6,90);c.at('torno',2.1,7.2,90);c.wall('w','bancada',2,{from:9,to:17,rot:270});c.wall('e','ferramental',3,{from:3,to:10,rot:90});
  c.at('mesa',7.6,14.4,0,{sx:1.3});c.row('cilindros',6.2,17.6,3,1.7,0,0);c.at('carrinho',7.6,20,0);c.wall('s','caixa_ferr',2,{at:[1.2,2.4]});c.at('lava_olhos',9.8,22.8,0);
});
room('md9',c=>{ // M30 · Utilities: geradores, motores diesel, tanques, painéis
  c.at('gerador',4,3,0,{sx:1.5,sy:1.4});c.at('gerador',8.6,3,0,{sx:1.5,sy:1.4});c.at('motor_diesel',4.6,6.6,0);c.at('motor_diesel',9.4,6.6,0);
  c.at('tanque_h',17.6,4.4,0);c.at('tanque_h',17.6,7.4,0,{});c.bar('tubo_reto',2,9.6,24,9.6);
  c.row('bomba',3,12.6,3,3,0,0);c.at('compressor',14,13.2,0);c.at('skid',20.4,13.4,0);c.wall('s','quadro_eletr',4,{from:1,to:12});c.wall('e','estoque_caixas',1,{at:[16.6],rot:90});
});
room('md_inj',c=>{ // M23 · Chemical injection
  c.row('bomba_dos',1.6,2.4,4,2.4,0,0);c.row('tanque_am',3.4,5.2,3,2.8,0,0);c.wall('e','skid',1,{at:[4.4],rot:90});c.wall('s','quadro_eletr',2,{from:1,to:6});c.at('chuv_emerg',10.2,8.8,0);
});
room('md_wc',c=>{ // WC e zeladoria
  c.wall('w','vaso',3,{from:.4,to:5.4});c.wall('n','lavatorio',3,{from:2,to:8.4});c.wall('e','armario',1,{at:[5.5],rot:90});c.at('carrinho',7.8,7.6,0);c.wall('s','lixeira',2,{at:[1.8,3.4]});c.at('chuveiro',9.4,8.6,0);
});
module.exports={};
