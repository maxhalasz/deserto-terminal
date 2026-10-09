/* ===================== Telas e crachás (Etapa 5) =====================
   Terminal de log (CRT), crachá (NeuroStat e Ødemark A.), WhatsApp, e-mail de celular, e-mail de computador e
   e-mail dos anos 90, refeitos com fidelidade de interface real (cores, proporções e fontes das interfaces
   verdadeiras; ver DOCS_DESIGN_NOTES.md), como objetos Fabric editáveis. Todos têm páginas prontas (verso,
   continuação, outras telas do mesmo programa). Textos em inglês. Datas coerentes com o resto: 03/14 é QUINTA-FEIRA.
   Depende de doc-kit.js, doc-screens-kit.js (SC.*), proc-art.js e emblem.js. */

const DS = {};
DS.fix = (n)=>String(n);

/* ======================================================================================================
   TERMINAL — tubo de fósforo verde, VT323, linhas de varredura, vinheta e cantos do tubo
   ====================================================================================================== */
DS.TERM_FONTS = ["400 20px 'VT323'"];
DS.TERM = {g:'#5dff7a', hi:'#d2ffdb', dim:'#2fc24e', glow:'rgba(90,255,125,0.55)', dark:'#03140a'};
/* spec = {title, sub, cmd, blocks:[{lines:[...], hi?:bool, dim?:bool}], foot, prompt:true} */
DS.term = async (kit, spec)=>{
  const W = kit.W, H = kit.H, T = DS.TERM, X = 92, Y = 74, SZ = spec.size || 34, LH = 1.1, CW = W - X*2;
  kit.proc('crt', 0, 0, W, H, {seed:spec.seed || 2, opts:{tint:[60,255,100]}, label:'Tela (fundo de tubo)'});
  const cw = kit.measure('M', {font:'VT323', size:SZ, weight:400}), cols = Math.floor(CW/cw);
  const col = kit.column(X, Y, CW, {font:'VT323', size:SZ, weight:400, lh:LH, fill:T.g, blend:'source-over', shadow:{color:T.glow, blur:7}});
  // barra de título em vídeo inverso
  const bar = kit.rect({left:X - 12, top:col.y - 2, width:CW + 24, height:SZ*LH*1.13 + 6, fill:T.g, blend:'source-over', label:'Barra de título (vídeo inverso)'});
  col.text(spec.title.padEnd(cols).slice(0, cols), {fill:T.dark, shadow:null, gap:0, label:'Título'});
  col.y += 6;
  if (spec.sub) col.text(spec.sub, {gap:0, label:'Subtítulo'});
  col.text('='.repeat(cols), {fill:T.dim, gap:2, label:'Linha'});
  if (spec.cmd) col.text('> ' + spec.cmd, {gap:LH*SZ*0.6, label:'Comando'});
  (spec.blocks || []).forEach(b=>{
    const t = col.text(b.lines.join('\n'), {fill:b.hi ? T.hi : (b.dim ? T.dim : T.g), gap:b.gap != null ? b.gap : SZ*0.5, label:b.label || 'Texto do terminal'});
  });
  if (spec.foot) col.text(spec.foot, {fill:T.dim, gap:SZ*0.4, label:'Rodapé'});
  if (spec.prompt !== false){
    const p = col.text(spec.promptText || '> ', {gap:0, label:'Prompt'});
    const lw = kit.measure(spec.promptText || '> ', {font:'VT323', size:SZ, weight:400});
    kit.rect({left:X + lw + 2, top:p.top + 5, width:cw*0.9, height:SZ*0.82, fill:T.g, blend:'source-over', label:'Cursor'});
  }
  kit.proc('scan', 0, 0, W, H, {seed:spec.seed || 2, opts:{tint:[60,255,100], line:3.4, vig:0.55, corner:70}, label:'Efeito de tubo (varredura e vinheta)'});
  DS.termCols = cols;
};
DS.tl = (time, key, val, w)=>time.padEnd(10) + key.padEnd(w || 26) + val;
DS.TERM_MAIN = ()=>({
  title:' NEUROSTAT FIELD DIVISION :: HULL MONITORING TERMINAL :: NODE DES-PLATFORM-01',
  sub:' BUILD 4.7.2                                         THU 03/14   05:21:07',
  cmd:'logview --since 02:00 --channel radio,dive,hull',
  blocks:[
    {lines:[
      DS.tl('02:40:11', 'dive_team.status', '= DEPLOYED'), DS.tl('03:09:44', 'dive_team.depth', '= 61.0 m'), DS.tl('03:11:58', 'radio.check()', '-> OK'),
      DS.tl('03:12:04', 'radio.check()', '-> TIMEOUT'), DS.tl('03:12:04', 'radio.retry(3)', '-> TIMEOUT'), DS.tl('03:12:07', 'link.status', '= DEGRADED'),
      DS.tl('04:20:02', 'winch.line', '= RECOVERED'), DS.tl('04:58:41', 'radio.ch3', '= RESTORED'), DS.tl('04:58:41', 'crew_log.entry', '= [REDACTED]'),
    ]},
    {lines:[
      DS.tl('05:14:22', 'sensor.hull_array[12]', '-> ANOMALY'), DS.tl('05:14:23', 'sensor.hull_array[12]', '-> ANOMALY'), DS.tl('05:14:23', 'sensor.hull_array[12]', '-> ANOMALY'),
      DS.tl('05:14:24', 'sensor.hull_array[*]', '-> ANOMALY'),
    ], hi:true},
    {lines:[DS.tl('05:15:00', 'supervisor.override', '= TRUE'), DS.tl('05:15:00', 'logging', 'SUSPENDED')]},
  ],
  foot:'-- 15 entries shown, 3 withheld by supervisor.override --',
});
DS.TERM_PAGES = [
  {id:'hull', label:'Varredura do casco (hullscan)', fonts:DS.TERM_FONTS, build: async (kit)=>{
    const bar = (n, over)=>over ? '#'.repeat(34) + ' >>>>>>' : '#'.repeat(n);
    const rows = [];
    [6, 5, 7, 4, 6, 8, 5, 7, 6, 4, 5].forEach((n, i)=>rows.push(('CH ' + String(i + 1).padStart(2, '0')).padEnd(8) + bar(n*2).padEnd(44) + ('-' + (58 + n)).padEnd(8) + 'OK'));
    rows.push('CH 12'.padEnd(8) + bar(0, true).padEnd(44) + 'OVER'.padEnd(8) + 'ANOMALY  (x43)');
    [5, 6, 4, 7].forEach((n, i)=>rows.push(('CH ' + String(13 + i)).padEnd(8) + bar(n*2).padEnd(44) + ('-' + (60 + n)).padEnd(8) + 'OK'));
    await DS.term(kit, {seed:3, size:29, title:' NEUROSTAT FIELD DIVISION :: HULL ARRAY :: NODE DES-PLATFORM-01', sub:' BUILD 4.7.2                                         THU 03/14   05:22:40',
      cmd:'hullscan --array 1-16 --last 6m',
      blocks:[{lines:['CH      LEVEL                                       dB      STATE'], dim:true, gap:2}, {lines:rows.slice(0, 11)}, {lines:[rows[11]], hi:true, gap:2}, {lines:rows.slice(12)}],
      foot:'RATE   43 EVENTS / 6 MIN        THRESHOLD   3 EVENTS / HOUR'});
  }},
  {id:'files', label:'Lista de arquivos (gravações)', fonts:DS.TERM_FONTS, build: async (kit)=>{
    const f = (perm, own, size, date, name, dur)=>perm.padEnd(12) + own.padEnd(8) + size.padStart(11) + '  ' + date.padEnd(14) + name.padEnd(18) + dur;
    await DS.term(kit, {seed:4, title:' NEUROSTAT FIELD DIVISION :: FILE SYSTEM :: NODE DES-PLATFORM-01', sub:' BUILD 4.7.2                                         THU 03/14   05:24:03',
      cmd:'ls -l /var/rec/ch3',
      blocks:[{lines:['total 4']}, {lines:[
        f('-rw-r--r--', 'sysop', '1,964,544', 'Mar 14 03:12', 'ch3_0312.raw', '[00:00:11]'),
        f('-rw-r--r--', 'sysop', '1,964,544', 'Mar 14 04:58', 'ch3_0458.raw', '[00:00:11]'),
        f('-rw-r--r--', '(none)', '1,964,544', 'Mar 14 04:58', 'ch3_0458.raw~', '[00:00:11]'),
        f('-rw-r--r--', 'sysop', '0', 'Mar 14 05:15', 'ch3_0515.raw', '[--:--:--]'),
      ]}],
      foot:'4 files.  3 identical.', promptText:'> '});
  }},
  {id:'login', label:'Tela de login', fonts:DS.TERM_FONTS, build: async (kit)=>{
    await DS.term(kit, {seed:5, title:' NEUROSTAT FIELD DIVISION :: NODE DES-PLATFORM-01', sub:' BUILD 4.7.2',
      blocks:[
        {lines:['MEMORY TEST  65536K OK', 'RADIO LINK    CH3  DEGRADED', 'HULL ARRAY   16 CHANNELS  1 NOT RESPONDING', 'CLOCK        03:12:07  (NOT SYNCHRONIZED)'], dim:true},
        {lines:['AUTHORIZED USE ONLY.  ALL SESSIONS ARE RECORDED.']},
        {lines:['login: sysop', 'Password: ********', '', 'Last login: Wed Mar 13 22:41:09 on tty2', '3 failed attempts since last login  (from: tty0, tty0, tty0)']},
      ], prompt:true, promptText:'> '});
  }},
  {id:'prompt', label:'Tela vazia (só o prompt)', fonts:DS.TERM_FONTS, build: async (kit)=>{
    await DS.term(kit, {seed:6, title:' NEUROSTAT FIELD DIVISION :: NODE DES-PLATFORM-01', sub:' BUILD 4.7.2                                         THU 03/14   05:26:11', blocks:[], prompt:true});
  }},
];
registerDoc('terminal', {
  label:'Terminal — log do sistema (CRT)', page:[1600, 1200], phys:[10.67, 8], screen:true,
  paper:{type:'liso', level:0, atmos:'neutra'}, fonts:DS.TERM_FONTS,
  build: async (kit)=>{ await DS.term(kit, DS.TERM_MAIN()); },
  pages:DS.TERM_PAGES,
});
