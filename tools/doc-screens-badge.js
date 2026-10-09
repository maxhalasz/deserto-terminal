/* ======================================================================================================
   CRACHÁ — cartão CR80 (3,375 × 2,125 pol). Dois estilos: NeuroStat (azul clínico) e Ødemark A. (cores do patch).
   Frente e verso. Depende de doc-screens.js (DS), doc-screens-kit.js (SC) e emblem.js.
   ====================================================================================================== */
DS.BADGE_FONTS = ["700 20px 'Libre Franklin'", "600 20px 'Inter'", "500 20px 'Inter'", "700 20px 'Courier Prime'", "400 20px 'Courier Prime'", "600 20px 'Barlow Condensed'"].concat(EM_FONTS);
DS.badgeData = {name:'J. OKAFOR', role:'DIVE SUPPORT', zone:'MOONPOOL DECK', level:'2', id:'0447-M-12', code:'0447M12', issued:'02/14', expires:'03/12'};
/* Linhas diagonais finas (padrão de segurança), um caminho só. */
DS.guilloche = (kit, W, H, color, op)=>{
  let d = '';
  for (let x = -H; x < W; x += 14) d += `M ${x} ${H} L ${x + H} 0 `;
  const p = kit.path(d, {left:0, top:0, fill:null, stroke:color, sw:1, opacity:op, blend:'source-over', label:'Padrão de segurança'});
  p.__bleedOk = true; return p;
};
DS.badgeNeurostat = async (kit)=>{
  const W = kit.W, H = kit.H, d = DS.badgeData, ink = '#0b1a2c', mid = '#1f5a96', grey = '#51657c', deep = '#12365e';
  kit.rect({left:0, top:0, width:W, height:H, fill:'#eef3f9', blend:'source-over', label:'Cartão'});
  DS.guilloche(kit, W, H, '#bfcfe2', 0.6);
  const band = kit.rect({left:0, top:0, width:W, height:96, fill:'#0a1829', blend:'source-over', label:'Faixa do topo'});
  band.set('fill', new fabric.Gradient({type:'linear', coords:{x1:0, y1:0, x2:W, y2:0}, colorStops:[{offset:0, color:'#07121f'}, {offset:1, color:'#153a63'}]}));
  kit.text('NEUROSTAT', {left:40, top:26, width:420, font:'Libre Franklin', weight:700, size:38, cs:120, fill:'#ffffff', lh:1.0, blend:'source-over'});
  kit.text('FIELD DIVISION', {left:W - 360, top:38, width:320, font:'Inter', weight:600, size:16, cs:340, fill:'#9db8d6', align:'right', lh:1.0, blend:'source-over'});
  kit.rect({left:0, top:96, width:W, height:6, fill:'#3f7fc0', blend:'source-over', label:'Filete azul'});
  kit.rect({left:34, top:130, width:208, height:262, fill:'#ffffff', stroke:'#9db4cf', sw:2, rx:10, blend:'source-over', label:'Moldura da foto'});
  await kit.photo(40, 136, 196, 250, {rx:8, seed:7, c0:'#a9bdd6', c1:'#52719a', c2:'#1a2b44', label:'Foto (trocar)'});
  const X = 276;
  kit.text(d.name, {left:X, top:132, width:540, font:'Libre Franklin', weight:700, size:52, fill:ink, lh:1.0, label:'Nome'});
  kit.text(d.role, {left:X, top:196, width:540, font:'Inter', weight:600, size:24, cs:160, fill:mid, lh:1.0, label:'Cargo'});
  kit.text('FIELD DIVISION  ·  PLATFORM DESERTO', {left:X, top:232, width:560, font:'Inter', weight:500, size:16, cs:200, fill:grey, lh:1.0});
  kit.rect({left:X, top:272, width:230, height:48, fill:deep, rx:6, blend:'source-over', label:'Nível de acesso'});
  kit.text('ACCESS  LEVEL  ' + d.level, {left:X, top:285, width:230, font:'Inter', weight:600, size:19, cs:140, fill:'#ffffff', align:'center', lh:1.0, blend:'source-over'});
  kit.text(d.zone, {left:X + 250, top:285, width:300, font:'Inter', weight:600, size:19, cs:140, fill:ink, lh:1.0});
  const row = (label, val, x, y)=>{ kit.text(label, {left:x, top:y, width:140, font:'Inter', weight:600, size:12.5, cs:200, fill:grey, lh:1.0}); kit.text(val, {left:x, top:y + 18, width:140, font:'Courier Prime', weight:700, size:24, fill:ink, lh:1.0}); };
  row('ID', d.id, X, 342); row('ISSUED', d.issued, X + 190, 342); row('EXPIRES', d.expires, X + 350, 342);
  const bc = kit.barcode(d.code, X, 410, 74, 2.7, {fill:ink, label:'Código de barras (Code 128)'});
  kit.text(d.code, {left:X, top:488, width:bc.width, font:'Courier Prime', weight:700, size:16, cs:200, fill:ink, align:'center', lh:1.0});
};
DS.badgeOdemark = async (kit)=>{
  const W = kit.W, H = kit.H, d = DS.badgeData, navy = '#141b30', orange = '#e5601d', cream = '#efe6cb', yellow = '#f1c232';
  kit.rect({left:0, top:0, width:W, height:H, fill:navy, blend:'source-over', label:'Cartão'});
  kit.rect({left:0, top:H - 70, width:W, height:70, fill:orange, blend:'source-over', label:'Faixa de baixo'});
  kit.rect({left:20, top:20, width:W - 40, height:H - 40, stroke:orange, sw:3, rx:20, blend:'source-over', label:'Moldura'});
  kit.emblem('plataforma', 'cor', W - 190, 34, 150, {label:'Emblema'});
  kit.text('ØDEMARK A.', {left:46, top:44, width:520, font:'Barlow Condensed', weight:700, size:66, cs:90, fill:cream, lh:1.0, blend:'source-over'});
  kit.text('CREW  ACCESS  CARD', {left:48, top:112, width:520, font:'Barlow Condensed', weight:500, size:24, cs:300, fill:orange, lh:1.0, blend:'source-over'});
  kit.rect({left:46, top:158, width:214, height:268, fill:cream, rx:12, blend:'source-over', label:'Moldura da foto'});
  await kit.photo(52, 164, 202, 256, {rx:8, seed:9, label:'Foto (trocar)'});
  const X = 296;
  kit.text(d.name, {left:X, top:170, width:520, font:'Barlow Condensed', weight:700, size:64, cs:40, fill:cream, lh:1.0, blend:'source-over', label:'Nome'});
  kit.text(d.role + '  —  CONTRACTOR', {left:X, top:240, width:520, font:'Barlow Condensed', weight:500, size:27, cs:180, fill:yellow, lh:1.0, blend:'source-over'});
  kit.rect({left:X, top:292, width:300, height:46, fill:yellow, rx:6, blend:'source-over', label:'Zona'});
  kit.text(d.zone, {left:X, top:302, width:300, font:'Barlow Condensed', weight:700, size:27, cs:140, fill:navy, align:'center', lh:1.0, blend:'source-over'});
  kit.text('LEVEL ' + d.level, {left:X + 316, top:302, width:200, font:'Barlow Condensed', weight:700, size:27, cs:140, fill:cream, lh:1.0, blend:'source-over'});
  const row = (label, val, x, y, hot)=>{ kit.text(label, {left:x, top:y, width:140, font:'Barlow Condensed', weight:500, size:17, cs:300, fill:orange, lh:1.0, blend:'source-over'}); kit.text(val, {left:x, top:y + 22, width:150, font:'Courier Prime', weight:700, size:27, fill:hot ? '#ff8a5c' : cream, lh:1.0, blend:'source-over'}); };
  row('ID', d.id, X, 364); row('ISSUED', d.issued, X + 200, 364); row('EXPIRES', d.expires, X + 360, 364, true);
  kit.text('NOV — APR   ·   MØRKETID', {left:0, top:H - 50, width:W, font:'Barlow Condensed', weight:600, size:26, cs:360, fill:navy, align:'center', lh:1.0, blend:'source-over'});
};
DS.badgeVersoNeurostat = async (kit)=>{
  const W = kit.W, H = kit.H, ink = '#0b1a2c', grey = '#51657c', deep = '#12365e';
  kit.rect({left:0, top:0, width:W, height:H, fill:'#eef3f9', blend:'source-over', label:'Cartão (verso)'});
  DS.guilloche(kit, W, H, '#bfcfe2', 0.6);
  kit.rect({left:0, top:44, width:W, height:100, fill:'#0d1624', blend:'source-over', label:'Tarja magnética'});
  kit.rect({left:36, top:176, width:W - 72, height:66, fill:'#ffffff', stroke:'#9db4cf', sw:2, blend:'source-over', label:'Campo de assinatura'});
  kit.text('AUTHORIZED SIGNATURE', {left:48, top:184, width:400, font:'Inter', weight:600, size:12, cs:200, fill:grey, lh:1.0});
  kit.text('This card is the property of NeuroStat Field Division. It is not transferable. If found, return it to any Supervisor. Use of this card by anyone other than the holder is prohibited.',
    {left:36, top:266, width:W - 72, font:'Inter', weight:400, size:19, fill:ink, lh:1.4});
  kit.text('ACCESS ZONES', {left:36, top:378, width:300, font:'Inter', weight:700, size:14, cs:260, fill:ink, lh:1.0});
  [['A', 'Dining deck', true], ['B', 'Machine room', true], ['C', 'Moonpool deck', true], ['D', 'Lower deck', false]].forEach(([z, name, on], i)=>{
    const x = 36 + i*204;
    kit.rect({left:x, top:410, width:26, height:26, stroke:ink, sw:2, blend:'source-over', label:'Caixa de zona'});
    if (on) SC.icon(kit, 'done', x - 1, 409, 28, deep, {label:'Marca'});
    kit.text(z + '  ' + name, {left:x + 38, top:413, width:170, font:'Inter', weight:500, size:16, fill:ink, lh:1.0});
  });
  kit.text('EMERGENCY  ·  Platform Deserto Control   ext. 312', {left:36, top:468, width:W - 72, font:'Courier Prime', weight:700, size:17, fill:ink, lh:1.0});
};
DS.badgeVersoOdemark = async (kit)=>{
  const W = kit.W, H = kit.H, navy = '#141b30', orange = '#e5601d', cream = '#efe6cb', yellow = '#f1c232';
  kit.rect({left:0, top:0, width:W, height:H, fill:navy, blend:'source-over', label:'Cartão (verso)'});
  kit.emblem('plataforma', 'tinta', W - 520, 100, 520, {color:cream, opacity:0.10, label:'Marca d’água (emblema)'}).__bleedOk = true;
  kit.rect({left:0, top:44, width:W, height:96, fill:'#0b0f1c', blend:'source-over', label:'Tarja magnética'});
  kit.rect({left:20, top:20, width:W - 40, height:H - 40, stroke:orange, sw:3, rx:20, blend:'source-over', label:'Moldura'});
  kit.text('MUSTER STATION', {left:46, top:172, width:240, font:'Barlow Condensed', weight:500, size:20, cs:300, fill:orange, lh:1.0, blend:'source-over'});
  kit.text('4', {left:46, top:196, width:120, font:'Barlow Condensed', weight:700, size:150, fill:yellow, lh:1.0, blend:'source-over'});
  kit.text('ACCESS', {left:300, top:176, width:300, font:'Barlow Condensed', weight:500, size:20, cs:300, fill:orange, lh:1.0, blend:'source-over'});
  [['Dining deck', true], ['Machine room', true], ['Moonpool deck', true], ['Lower deck', false]].forEach(([n, on], i)=>{
    const y = 210 + i*40;
    kit.rect({left:300, top:y, width:24, height:24, stroke:cream, sw:2, blend:'source-over', label:'Caixa de zona'});
    if (on) SC.icon(kit, 'done', 298, y - 2, 28, yellow, {label:'Marca'});
    kit.text(n.toUpperCase(), {left:338, top:y + 2, width:300, font:'Barlow Condensed', weight:600, size:22, cs:140, fill:cream, lh:1.0, blend:'source-over'});
  });
  kit.text('EMERGENCY SIGNAL:  SEVEN SHORT BLASTS', {left:46, top:398, width:W - 92, font:'Barlow Condensed', weight:600, size:26, cs:160, fill:cream, lh:1.0, blend:'source-over'});
  kit.text('IF FOUND, RETURN TO CREW SERVICES', {left:46, top:436, width:W - 92, font:'Barlow Condensed', weight:500, size:21, cs:200, fill:orange, lh:1.0, blend:'source-over'});
};
registerDoc('badge', {
  label:'Crachá — cartão de acesso', page:[860, 540], phys:[3.375, 2.125], screen:true,
  paper:{type:'liso', level:0, atmos:'neutra'}, fonts:DS.BADGE_FONTS,
  variants:[
    {id:'neurostat', label:'NeuroStat · azul clínico', build:DS.badgeNeurostat, pages:[{id:'verso', label:'Verso — tarja e zonas', build:DS.badgeVersoNeurostat}]},
    {id:'odemark', label:'Ødemark A. · cartão de tripulação', build:DS.badgeOdemark, pages:[{id:'verso', label:'Verso — muster e zonas', build:DS.badgeVersoOdemark}]},
  ],
});
