/* ======================================================================================================
   WHATSAPP (Android, tema claro clássico) — 1080 × 2220. Balões editáveis (retângulo + texto + hora + ticks).
   Cores: barra de título #075E54, balão enviado #DCF8C6, recebido branco, papel de parede #E5DDD5 com rabiscos,
   ticks azuis #34B7F1, botão verde #128C7E. Depende de doc-screens.js (DS), doc-screens-kit.js (SC).
   ====================================================================================================== */
const WA = {};
WA.FONTS = ["400 20px 'Inter'", "500 20px 'Inter'", "600 20px 'Inter'"];
WA.C = {bar:'#054d44', head:'#075E54', inb:'#ffffff', out:'#dcf8c6', text:'#2b2b2b', timeIn:'#8e9aa0', timeOut:'#7d9a73', chip:'#e1f2fb', chipText:'#5b6f78', green:'#128c7e'};
WA.header = (kit, o)=>{
  const W = kit.W, C = WA.C, ty = 70, th = 170;
  SC.statusBar(kit, {y:0, h:ty, bg:C.bar, fg:'#ffffff', time:o.time || '05:21', style:'android'});
  kit.rect({left:0, top:ty, width:W, height:th, fill:C.head, blend:'source-over', label:'Barra de título'});
  SC.icon(kit, 'back', 24, ty + 58, 56, '#ffffff', {label:'Voltar'});
  kit.circle({left:100, top:ty + 36, r:49, fill:'#cfd8d6', blend:'source-over', label:'Avatar'});
  SC.icon(kit, 'person', 116, ty + 52, 66, '#ffffff', {label:'Avatar (ícone)'});
  kit.text(o.name, {left:226, top:ty + 36, width:520, font:'Inter', weight:600, size:44, fill:'#ffffff', lh:1.0, blend:'source-over', label:'Nome do contato'});
  kit.text(o.status, {left:226, top:ty + 96, width:560, font:'Inter', weight:400, size:30, fill:'#cfe6e1', lh:1.0, blend:'source-over', label:'Status'});
  if (o.icons !== false){
    SC.icon(kit, 'video', W - 330, ty + 56, 58, '#ffffff', {label:'Vídeo'});
    SC.icon(kit, 'call', W - 222, ty + 56, 58, '#ffffff', {label:'Ligar'});
    SC.icon(kit, 'more', W - 112, ty + 56, 58, '#ffffff', {label:'Mais'});
  }
  return ty + th;
};
WA.wall = (kit, y, seed)=>kit.proc('doodle', 0, y, kit.W, kit.H - y, {seed:seed || 3, opts:{bg:[229,221,213], ink:[207,198,188], cell:150}, label:'Papel de parede'});
WA.input = (kit)=>{
  const W = kit.W, H = kit.H;
  kit.rect({left:20, top:H - 138, width:W - 190, height:108, fill:'#ffffff', rx:54, blend:'source-over', label:'Campo de mensagem'});
  SC.icon(kit, 'smile', 48, H - 112, 56, '#9aa5a8', {label:'Emoji'});
  kit.text('Type a message', {left:126, top:H - 112, width:420, font:'Inter', weight:400, size:40, fill:'#a4acae', lh:1.0, blend:'source-over', label:'Campo (texto)'});
  SC.icon(kit, 'attach', W - 410, H - 112, 56, '#9aa5a8', {label:'Anexo', angle:0});
  SC.icon(kit, 'camera', W - 330, H - 112, 56, '#9aa5a8', {label:'Câmera'});
  kit.circle({left:W - 156, top:H - 138, r:54, fill:WA.C.green, blend:'source-over', label:'Botão do microfone'});
  SC.icon(kit, 'mic', W - 135, H - 117, 62, '#ffffff', {label:'Microfone'});
};
WA.chip = (kit, y, text)=>{
  const W = kit.W, tw = kit.measure(text, {font:'Inter', size:27, weight:500, cs:80}) + 56;
  kit.rect({left:(W - tw)/2, top:y, width:tw, height:56, fill:WA.C.chip, rx:16, blend:'source-over', label:'Data'});
  kit.text(text, {left:(W - tw)/2, top:y + 13, width:tw, font:'Inter', weight:500, size:27, cs:80, fill:WA.C.chipText, align:'center', lh:1.0, blend:'source-over', label:'Data (texto)'});
  return y + 56 + 22;
};
/* Um balão. m = {me, text, time, state:'sent'|'delivered'|'read', voice:'0:11'}. Devolve o y do fim (sem a folga). */
WA.bubble = (kit, y, m, tail)=>{
  const W = kit.W, C = WA.C, FS = 40, TS = 25, PX = 26, PY = 16, MG = 28, MAXW = Math.round(W*0.80), me = !!m.me;
  const state = me ? (m.state || 'read') : null;
  const tw = kit.measure(m.time, {font:'Inter', size:TS, weight:400}), timeW = tw + (me ? 44 : 0);
  let bw, bh, bx;
  if (m.voice){
    bw = 690; bh = 150; bx = me ? W - MG - bw : MG;
  } else {
    const inner = MAXW - PX*2, nat = Math.ceil(kit.measure(m.text, {font:'Inter', size:FS, weight:400})) + 14;
    const single = !m.text.includes('\n') && nat + 20 + timeW <= inner;
    const t = kit.text(m.text, {left:0, top:0, width:single ? nat : Math.min(inner, nat), font:'Inter', size:FS, weight:400, fill:C.text, lh:1.3, blend:'source-over', label:'Mensagem'});
    let lw = t.width; try { let mx = 0; for (let i = 0; i < t._textLines.length; i++) mx = Math.max(mx, t.getLineWidth(i)); lw = Math.ceil(mx) + 8; } catch (e) {}
    if (!single && lw < t.width) t.set('width', lw);
    const textW = single ? nat : t.width;
    bw = single ? textW + 20 + timeW + PX*2 : Math.max(textW, timeW) + PX*2;
    bh = single ? PY*2 + t.height : PY*2 + t.height + TS*1.15;
    bx = me ? W - MG - bw : MG;
    t.set({left:bx + PX, top:y + PY}); t.setCoords();
    m.__t = t;
  }
  const col = me ? C.out : C.inb;
  kit.rect({left:bx, top:y + 2, width:bw, height:bh, fill:'rgba(0,0,0,0.10)', rx:20, blend:'source-over', label:'Sombra do balão'});
  const box = kit.rect({left:bx, top:y, width:bw, height:bh, fill:col, rx:20, blend:'source-over', label:'Balão'});
  if (tail){
    const d = me ? `M ${bx + bw - 6} ${y} L ${bx + bw + 20} ${y} L ${bx + bw - 6} ${y + 30} Z` : `M ${bx + 6} ${y} L ${bx - 20} ${y} L ${bx + 6} ${y + 30} Z`;
    kit.path(d, {left:me ? bx + bw - 6 : bx - 20, top:y, fill:col, blend:'source-over', label:'Pontinha do balão'});
  }
  // o texto foi criado antes do retângulo: sobe de camada pra ficar por cima
  if (m.__t){ kit.cv.bringObjectToFront(m.__t); }
  const timeX = bx + bw - PX - timeW, timeY = y + bh - PY - TS*0.95 - 2;
  if (m.voice){
    SC.icon(kit, 'play', bx + 26, y + 36, 78, '#8a9aa0', {label:'Tocar'});
    const rng = mulberry32(m.voice.length*977 + 5);
    for (let i = 0; i < 34; i++){
      const hh = 10 + rng()*44;
      kit.rect({left:bx + 124 + i*14.5, top:y + 62 - hh/2 + 14, width:6, height:hh, fill:i < 3 ? '#34B7F1' : '#aab6bb', rx:3, blend:'source-over', label:'Onda do áudio'});
    }
    kit.text(m.voice, {left:bx + 124, top:y + bh - PY - TS*1.1 - 4, width:120, font:'Inter', weight:400, size:TS, fill:C.timeIn, lh:1.0, blend:'source-over', label:'Duração'});
  }
  kit.text(m.time, {left:timeX, top:timeY, width:tw + 8, font:'Inter', weight:400, size:TS, fill:me ? C.timeOut : C.timeIn, lh:1.0, blend:'source-over', label:'Hora'});
  if (me) SC.ticks(kit, state, timeX + tw + 8, timeY - 4, 34);
  return y + bh;
};
WA.chat = (kit, msgs, y0, o)=>{
  let y = y0, prev = null;
  msgs.forEach(m=>{
    if (m.chip){ y = WA.chip(kit, y + 10, m.chip); prev = null; return; }
    const first = !prev || prev.me !== m.me;
    y = WA.bubble(kit, y, m, first) + (first ? 14 : 14);
    prev = m;
  });
  return y;
};
WA.screen = async (kit, o)=>{
  const W = kit.W, H = kit.H;
  const top = 240;
  WA.wall(kit, top, o.seed);
  WA.header(kit, {name:o.name || 'DIVE CREW — CH.3', status:o.status || 'last seen today at 03:12', time:o.time});
  WA.chat(kit, o.msgs || [], top + 32);
  WA.input(kit);
};
WA.MAIN = [
  {chip:'TODAY'},
  {me:false, text:'you up?', time:'03:58'},
  {me:true, text:"yeah. can't sleep", time:'03:59', state:'read'},
  {me:false, text:"radio's doing that thing again", time:'04:01'},
  {me:false, text:'the low one, not static', time:'04:01'},
  {me:true, text:'i hear it through the floor now, not the speaker', time:'04:03', state:'read'},
  {me:false, text:"don't go near the moonpool", time:'04:04'},
  {me:false, text:'i mean it', time:'04:04'},
  {me:true, text:"wasn't going to. why", time:'04:06', state:'read'},
  {me:true, text:'hey', time:'05:02', state:'delivered'},
  {me:true, text:'please answer', time:'05:14', state:'delivered'},
];
WA.CONT = [
  {me:false, voice:'0:11', time:'05:31'},
  {me:true, text:'what is that', time:'05:32', state:'delivered'},
  {me:true, text:'is that you', time:'05:32', state:'delivered'},
  {me:false, text:'stay in the machine room', time:'05:36'},
  {me:false, text:'lock the door', time:'05:36'},
  {me:true, text:'who is this', time:'05:37', state:'sent'},
];
/* Tela de informação do contato: fundo claro, avatar grande, atalhos e lista de opções. */
WA.contact = async (kit)=>{
  const W = kit.W, H = kit.H, C = WA.C;
  kit.rect({left:0, top:0, width:W, height:H, fill:'#eceff1', blend:'source-over', label:'Fundo'});
  SC.statusBar(kit, {y:0, h:70, bg:C.bar, fg:'#ffffff', time:'05:41', style:'android'});
  kit.rect({left:0, top:70, width:W, height:170, fill:C.head, blend:'source-over', label:'Barra de título'});
  SC.icon(kit, 'back', 24, 128, 56, '#ffffff', {label:'Voltar'});
  kit.text('Contact info', {left:122, top:106, width:600, font:'Inter', weight:600, size:44, fill:'#ffffff', lh:1.0, blend:'source-over'});
  SC.icon(kit, 'more', W - 112, 126, 58, '#ffffff', {label:'Mais'});
  kit.rect({left:0, top:240, width:W, height:560, fill:'#ffffff', blend:'source-over', label:'Cartão do contato'});
  kit.circle({left:W/2 - 130, top:280, r:130, fill:'#cfd8d6', blend:'source-over', label:'Avatar grande'});
  SC.icon(kit, 'person', W/2 - 90, 320, 180, '#ffffff', {label:'Avatar (ícone)'});
  kit.text('DIVE CREW — CH.3', {left:0, top:566, width:W, font:'Inter', weight:600, size:52, fill:'#1c1c1c', align:'center', lh:1.0, blend:'source-over', label:'Nome'});
  kit.text('+47 555 03 12', {left:0, top:640, width:W, font:'Inter', weight:400, size:36, fill:'#7b858a', align:'center', lh:1.0, blend:'source-over', label:'Telefone'});
  kit.text('last seen today at 03:12', {left:0, top:696, width:W, font:'Inter', weight:400, size:32, fill:'#7b858a', align:'center', lh:1.0, blend:'source-over'});
  [['call', 'Call'], ['video', 'Video'], ['search', 'Search']].forEach(([ic, lab], i)=>{
    const cx = W/2 + (i - 1)*270;
    SC.icon(kit, ic, cx - 36, 830, 72, C.head, {label:lab});
    kit.text(lab, {left:cx - 100, top:918, width:200, font:'Inter', weight:500, size:32, fill:C.head, align:'center', lh:1.0, blend:'source-over'});
  });
  const rows = [['Media, links and docs', '0', 1040], ['Mute notifications', '', 1200], ['Custom notifications', '', 1320], ['Disappearing messages', 'Off', 1440]];
  kit.rect({left:0, top:1010, width:W, height:520, fill:'#ffffff', blend:'source-over', label:'Lista'});
  rows.forEach(([lab, val, y])=>{
    kit.text(lab, {left:40, top:y + 8, width:700, font:'Inter', weight:400, size:42, fill:'#1c1c1c', lh:1.0, blend:'source-over', label:lab});
    if (val) kit.text(val, {left:W - 240, top:y + 8, width:200, font:'Inter', weight:400, size:38, fill:'#7b858a', align:'right', lh:1.0, blend:'source-over'});
    kit.line(40, y + 90, W - 40, y + 90, {stroke:'#e6eaec', sw:2, blend:'source-over', label:'Separador'});
  });
  kit.rect({left:W - 190, top:1210, width:110, height:48, fill:'#c9ced1', rx:24, blend:'source-over', label:'Chave (desligada)'});
  kit.circle({left:W - 190, top:1206, r:28, fill:'#f4f6f7', blend:'source-over', label:'Chave (botão)'});
  kit.rect({left:0, top:1570, width:W, height:230, fill:'#ffffff', blend:'source-over', label:'Criptografia'});
  SC.icon(kit, 'lock', 40, 1612, 50, '#7b858a', {label:'Cadeado'});
  kit.text('Encryption', {left:120, top:1608, width:600, font:'Inter', weight:400, size:42, fill:'#1c1c1c', lh:1.0, blend:'source-over'});
  kit.text('Messages to this chat and calls are secured with end-to-end encryption. Tap to verify.', {left:120, top:1672, width:W - 160, font:'Inter', weight:400, size:31, fill:'#7b858a', lh:1.3, blend:'source-over'});
  kit.rect({left:0, top:1830, width:W, height:130, fill:'#ffffff', blend:'source-over', label:'Bloquear'});
  kit.text('Block DIVE CREW — CH.3', {left:40, top:1868, width:W - 80, font:'Inter', weight:400, size:42, fill:'#d33b3b', lh:1.0, blend:'source-over'});
};
/* Informação de chamadas. */
WA.calls = async (kit)=>{
  const W = kit.W, H = kit.H, C = WA.C;
  kit.rect({left:0, top:0, width:W, height:H, fill:'#ffffff', blend:'source-over', label:'Fundo'});
  SC.statusBar(kit, {y:0, h:70, bg:C.bar, fg:'#ffffff', time:'05:44', style:'android'});
  kit.rect({left:0, top:70, width:W, height:170, fill:C.head, blend:'source-over', label:'Barra de título'});
  SC.icon(kit, 'back', 24, 128, 56, '#ffffff', {label:'Voltar'});
  kit.text('Call info', {left:122, top:106, width:600, font:'Inter', weight:600, size:44, fill:'#ffffff', lh:1.0, blend:'source-over'});
  kit.circle({left:40, top:290, r:56, fill:'#cfd8d6', blend:'source-over', label:'Avatar'});
  SC.icon(kit, 'person', 62, 312, 76, '#ffffff', {label:'Avatar (ícone)'});
  kit.text('DIVE CREW — CH.3', {left:180, top:296, width:600, font:'Inter', weight:600, size:44, fill:'#1c1c1c', lh:1.0, blend:'source-over', label:'Nome'});
  kit.text('+47 555 03 12', {left:180, top:354, width:600, font:'Inter', weight:400, size:34, fill:'#7b858a', lh:1.0, blend:'source-over'});
  SC.icon(kit, 'call', W - 140, 316, 70, C.head, {label:'Ligar'});
  kit.line(0, 440, W, 440, {stroke:'#e6eaec', sw:2, blend:'source-over'});
  kit.text('Today', {left:40, top:470, width:500, font:'Inter', weight:600, size:36, fill:C.head, lh:1.0, blend:'source-over'});
  const calls = [['Missed voice call', '05:14', '', '#d33b3b', 'in'], ['Outgoing voice call', '05:12', 'Not answered', '#1c1c1c', 'out'], ['Outgoing voice call', '05:03', 'Not answered', '#1c1c1c', 'out'], ['Incoming voice call', '03:12', '0:00', '#1c1c1c', 'in']];
  calls.forEach(([lab, time, dur, col, dir], i)=>{
    const y = 560 + i*150;
    SC.icon(kit, 'back', 40, y + 14, 50, dir === 'out' ? '#128c7e' : col, {angle:dir === 'out' ? 135 : -45, label:'Seta da chamada'});
    kit.text(lab, {left:130, top:y + 4, width:620, font:'Inter', weight:400, size:42, fill:col, lh:1.0, blend:'source-over'});
    if (dur) kit.text(dur, {left:130, top:y + 62, width:500, font:'Inter', weight:400, size:32, fill:'#7b858a', lh:1.0, blend:'source-over'});
    kit.text(time, {left:W - 260, top:y + 8, width:220, font:'Inter', weight:400, size:36, fill:'#7b858a', align:'right', lh:1.0, blend:'source-over'});
    kit.line(130, y + 128, W - 40, y + 128, {stroke:'#eef1f2', sw:2, blend:'source-over'});
  });
};
registerDoc('whatsapp', {
  label:'Print — WhatsApp (conversa)', page:[1080, 2220], phys:[3, 6.17], screen:true,
  paper:{type:'liso', level:0, atmos:'neutra'}, fonts:WA.FONTS,
  build: async (kit)=>{ await WA.screen(kit, {msgs:WA.MAIN, time:'05:21', seed:3}); },
  pages:[
    {id:'cont', label:'Conversa continua (mais mensagens)', build: async (kit)=>{ await WA.screen(kit, {msgs:WA.CONT, time:'05:38', seed:4}); }},
    {id:'contact', label:'Informação do contato', build: WA.contact},
    {id:'calls', label:'Informação de chamadas', build: WA.calls},
    {id:'empty', label:'Conversa vazia (só a moldura)', build: async (kit)=>{ await WA.screen(kit, {msgs:[], time:'05:21', seed:5}); }},
  ],
});
