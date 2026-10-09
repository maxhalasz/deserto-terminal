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
/* ---------------------------------------------------------------------------------------------------
   A CONVERSA é UM objeto só (`WaChat`): guarda a lista de mensagens e desenha tudo sozinho — tamanho dos balões,
   pontinha, hora, ticks, áudio, chips de data — então o formato da tela NÃO muda com a quantidade de mensagens.
   Poucas mensagens: a lista começa no topo (como no Android). Quando passa do tamanho da tela, ela ancora embaixo e as
   mais antigas saem por cima, cortadas pela barra de título, igual a um print de celular de verdade.
   Cabeçalho, barra de digitação e papel de parede continuam objetos à parte (não dependem das mensagens).
   Mensagem: {t:'text'|'voice'|'chip', me:bool, text, time, st:'sent'|'delivered'|'read', dur:'0:11'}.
   --------------------------------------------------------------------------------------------------- */
WA.M = {FS:40, TS:25, PX:26, PY:16, MG:28, R:20, LH:1.3, SAME:14, DIFF:26, CHIP:56, TOP:30, BOTTOM:24};
WA.fontsReady = ()=>{ try { return document.fonts.check("400 20px 'Inter'") && document.fonts.check("500 20px 'Inter'"); } catch (e){ return true; } };
WA.rr = (g, x, y, w, h, r)=>{ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
WA.wrap = (g, text, maxW)=>{
  g.font = `400 ${WA.M.FS}px 'Inter'`;
  const out = [];
  String(text || '').split('\n').forEach(par=>{
    if (par === ''){ out.push(''); return; }
    let line = '';
    par.split(' ').forEach(word=>{ const t = line ? line + ' ' + word : word; if (line && g.measureText(t).width > maxW){ out.push(line); line = word; } else line = t; });
    out.push(line);
  });
  return out;
};
/* Calcula tamanho e posição de cada item (sem desenhar). Devolve {items, total}. */
WA.layout = (g, W, msgs)=>{
  const M = WA.M, items = [], MAXW = Math.round(W*0.80), inner = MAXW - M.PX*2;
  let y = 0, prevMe = null;
  msgs.forEach((m, i)=>{
    const t = m.t || 'text';
    if (t === 'chip'){
      g.font = `500 27px 'Inter'`; const tw = g.measureText(String(m.text || '').toUpperCase()).width + 56;
      y += i ? 14 : 0; items.push({m, t, y, h:M.CHIP, bw:tw}); y += M.CHIP + 22; prevMe = null; return;
    }
    const me = !!m.me, first = prevMe === null || prevMe !== me;
    if (i && prevMe !== null) y += first ? M.DIFF : M.SAME;
    g.font = `400 ${M.TS}px 'Inter'`; const tw = g.measureText(m.time || '').width, timeW = tw + (me ? 44 : 0);
    let it;
    if (t === 'voice'){ it = {m, t, me, first, y, h:150, bw:690, tw, timeW}; }
    else {
      const lines = WA.wrap(g, m.text, inner);
      g.font = `400 ${M.FS}px 'Inter'`;
      const nat = Math.ceil(Math.max(...lines.map(l=>g.measureText(l).width), 10)), lastW = g.measureText(lines[lines.length - 1]).width;
      const inline = lastW + 20 + timeW <= inner;
      const contentW = inline ? Math.max(nat, Math.ceil(lastW) + 20 + timeW) : Math.max(nat, timeW);
      it = {m, t, me, first, y, lines, inline, tw, timeW, bw:contentW + M.PX*2, h:M.PY*2 + lines.length*M.LH*M.FS + (inline ? 0 : M.TS*1.15)};
    }
    items.push(it); y += it.h; prevMe = me;
  });
  return {items, total:y};
};
WA.ticks = (g, state, x, y, size)=>{
  const d = state === 'sent' ? SC.ICONS.done : SC.ICONS.doneall, s = size/24;
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = state === 'read' ? '#34B7F1' : '#8e9a9f'; g.fill(new Path2D(d)); g.restore();
};
/* Desenha a conversa dentro de um retângulo W×H (origem no canto de cima-esquerda). */
WA.draw = (g, W, H, chat)=>{
  const M = WA.M, C = WA.C, lay = WA.layout(g, W, chat.msgs || []);
  const avail = H - M.TOP - M.BOTTOM;
  const y0 = lay.total <= avail ? M.TOP : H - M.BOTTOM - lay.total;
  lay.items.forEach(it=>{
    const y = y0 + it.y;
    if (y > H || y + it.h < 0) return;
    if (it.t === 'chip'){
      const x = (W - it.bw)/2;
      g.fillStyle = C.chip; WA.rr(g, x, y, it.bw, it.h, 16); g.fill();
      g.font = `500 27px 'Inter'`; g.fillStyle = C.chipText; g.textAlign = 'center'; g.textBaseline = 'middle';
      if ('letterSpacing' in g) g.letterSpacing = '2px';
      g.fillText(String(it.m.text || '').toUpperCase(), W/2, y + it.h/2 + 1);
      if ('letterSpacing' in g) g.letterSpacing = '0px';
      return;
    }
    const me = it.me, bx = me ? W - M.MG - it.bw : M.MG, col = me ? C.out : C.inb, state = it.m.st || 'read';
    g.fillStyle = 'rgba(0,0,0,0.10)'; WA.rr(g, bx, y + 2, it.bw, it.h, M.R); g.fill();
    g.fillStyle = col; WA.rr(g, bx, y, it.bw, it.h, M.R); g.fill();
    if (it.first){   // pontinha
      g.beginPath();
      if (me){ g.moveTo(bx + it.bw - 6, y); g.lineTo(bx + it.bw + 20, y); g.lineTo(bx + it.bw - 6, y + 30); }
      else { g.moveTo(bx + 6, y); g.lineTo(bx - 20, y); g.lineTo(bx + 6, y + 30); }
      g.closePath(); g.fill();
    }
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    if (it.t === 'text'){
      g.font = `400 ${M.FS}px 'Inter'`; g.fillStyle = C.text;
      it.lines.forEach((l, i)=>g.fillText(l, bx + M.PX, y + M.PY + i*M.LH*M.FS + (M.LH*M.FS + M.FS*0.7)/2));
    } else {   // áudio
      g.save(); g.translate(bx + 26, y + 34); g.scale(78/24, 78/24); g.fillStyle = '#8a9aa0'; g.fill(new Path2D(SC.ICONS.play)); g.restore();
      const rng = mulberry32(String(it.m.dur || '0:00').length*977 + 5);
      for (let i = 0; i < 34; i++){ const hh = 10 + rng()*44; g.fillStyle = i < 3 ? '#34B7F1' : '#aab6bb'; WA.rr(g, bx + 124 + i*14.5, y + 62 - hh/2 + 14, 6, hh, 3); g.fill(); }
      g.font = `400 ${M.TS}px 'Inter'`; g.fillStyle = C.timeIn; g.fillText(it.m.dur || '0:00', bx + 124, y + it.h - M.PY - 6);
    }
    g.font = `400 ${M.TS}px 'Inter'`; g.fillStyle = me ? C.timeOut : C.timeIn;
    const timeX = bx + it.bw - M.PX - it.timeW, base = y + it.h - M.PY - 6;
    g.fillText(it.m.time || '', timeX, base);
    if (me) WA.ticks(g, state, timeX + it.tw + 8, base - 28, 34);
  });
};
class WaChat extends fabric.Rect {
  static type = 'WaChat';
  constructor(options){
    options = options || {};
    const chat = Object.assign({msgs:[]}, options.chat);
    super(Object.assign({fill:'#000000', strokeWidth:0, objectCaching:false, width:1080, height:1800,
      lockMovementX:true, lockMovementY:true, lockScalingX:true, lockScalingY:true, lockRotation:true, hasControls:false}, options, {chat}));
  }
  _render(ctx){
    const W = this.width, H = this.height;
    if (!WA.fontsReady() && !WaChat._waiting){
      WaChat._waiting = true;
      Promise.all(["400 20px 'Inter'", "500 20px 'Inter'"].map(f=>document.fonts.load(f))).then(()=>{ WaChat._waiting = false; if (this.canvas) this.canvas.requestRenderAll(); }, ()=>{ WaChat._waiting = false; });
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(-W/2, -H/2, W, H); ctx.clip();
    ctx.translate(-W/2, -H/2);
    WA.draw(ctx, W, H, this.chat);
    ctx.restore();
  }
  toObject(props){ return Object.assign(super.toObject(props), {chat: JSON.parse(JSON.stringify(this.chat))}); }
}
fabric.classRegistry.setClass(WaChat, 'WaChat');

/* Inspetor da conversa (aba Objeto): lista as mensagens, deixa editar texto, hora, lado e ticks, e adicionar/apagar/mover. */
WA.inspector = (obj, body)=>{
  const msgs = obj.chat.msgs;
  const apply = (rebuild)=>{ obj.dirty = true; canvas.requestRenderAll(); pushHistory(); if (rebuild) updateInspector(); };
  const nextTime = ()=>{
    for (let i = msgs.length - 1; i >= 0; i--){ const m = msgs[i].time; if (m && /^\d{1,2}:\d{2}$/.test(m)){ let [h, mi] = m.split(':').map(Number); mi += 1; if (mi > 59){ mi = 0; h = (h + 1)%24; } return String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0'); } }
    return '05:30';
  };
  const add = (m)=>{ msgs.push(m); apply(true); };
  body.appendChild(field.hint('A conversa é um objeto só: o formato da tela se mantém com qualquer quantidade de mensagens. Poucas ficam no topo; passando do tamanho da tela, as mais antigas saem por cima, como no celular.'));
  body.appendChild(field.buttonRow([
    field.button('＋ Recebida', ()=>add({t:'text', me:false, text:'Nova mensagem', time:nextTime(), st:'read'})),
    field.button('＋ Enviada', ()=>add({t:'text', me:true, text:'Nova mensagem', time:nextTime(), st:'delivered'})),
  ], 'grid2'));
  body.appendChild(field.buttonRow([
    field.button('＋ Áudio', ()=>add({t:'voice', me:false, dur:'0:11', time:nextTime(), st:'read'})),
    field.button('＋ Data', ()=>add({t:'chip', text:'Today'})),
  ], 'grid2'));
  const el = (tag, css, txt)=>{ const e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
  msgs.forEach((m, i)=>{
    const t = m.t || 'text', card = el('div', 'border:1px solid #3a4658;border-radius:6px;padding:7px;margin:7px 0;background:rgba(255,255,255,0.03)');
    const head = el('div', 'display:flex;gap:6px;align-items:center;margin-bottom:5px');
    const kind = document.createElement('select'); kind.style.flex = '1';
    [['in', 'Recebida'], ['out', 'Enviada'], ['vin', 'Áudio recebido'], ['vout', 'Áudio enviado'], ['chip', 'Data']].forEach(([v, l])=>{ const o = document.createElement('option'); o.value = v; o.textContent = l; kind.appendChild(o); });
    kind.value = t === 'chip' ? 'chip' : (t === 'voice' ? (m.me ? 'vout' : 'vin') : (m.me ? 'out' : 'in'));
    kind.addEventListener('change', ()=>{
      const v = kind.value;
      if (v === 'chip'){ msgs[i] = {t:'chip', text:m.text || 'Today'}; }
      else if (v === 'vin' || v === 'vout'){ msgs[i] = {t:'voice', me:v === 'vout', dur:m.dur || '0:11', time:m.time || nextTime(), st:m.st || 'read'}; }
      else { msgs[i] = {t:'text', me:v === 'out', text:m.text || 'Nova mensagem', time:m.time || nextTime(), st:m.st || 'read'}; }
      apply(true);
    });
    head.appendChild(kind);
    const btn = (label, title, fn)=>{ const b = el('button', 'padding:2px 8px;min-width:0', label); b.title = title; b.addEventListener('click', fn); return b; };
    head.appendChild(btn('↑', 'Subir', ()=>{ if (i > 0){ [msgs[i - 1], msgs[i]] = [msgs[i], msgs[i - 1]]; apply(true); } }));
    head.appendChild(btn('↓', 'Descer', ()=>{ if (i < msgs.length - 1){ [msgs[i + 1], msgs[i]] = [msgs[i], msgs[i + 1]]; apply(true); } }));
    head.appendChild(btn('✕', 'Apagar', ()=>{ msgs.splice(i, 1); apply(true); }));
    card.appendChild(head);
    if (t === 'text' || t === 'chip'){
      const ta = document.createElement('textarea'); ta.value = m.text || ''; ta.rows = t === 'chip' ? 1 : Math.min(5, Math.max(2, (m.text || '').split('\n').length + 1)); ta.style.width = '100%';
      ta.addEventListener('input', ()=>{ m.text = ta.value; obj.dirty = true; canvas.requestRenderAll(); });
      ta.addEventListener('change', ()=>pushHistory());
      card.appendChild(ta);
    }
    if (t === 'voice'){
      const du = document.createElement('input'); du.type = 'text'; du.value = m.dur || '0:11'; du.placeholder = 'Duração (0:11)'; du.style.width = '100%';
      du.addEventListener('input', ()=>{ m.dur = du.value; obj.dirty = true; canvas.requestRenderAll(); }); du.addEventListener('change', ()=>pushHistory());
      card.appendChild(du);
    }
    if (t !== 'chip'){
      const row = el('div', 'display:flex;gap:6px;margin-top:5px');
      const ti = document.createElement('input'); ti.type = 'text'; ti.value = m.time || ''; ti.placeholder = 'Hora'; ti.style.width = '38%';
      ti.addEventListener('input', ()=>{ m.time = ti.value; obj.dirty = true; canvas.requestRenderAll(); }); ti.addEventListener('change', ()=>pushHistory());
      row.appendChild(ti);
      if (m.me){
        const st = document.createElement('select'); st.style.flex = '1';
        [['sent', '✓ enviada'], ['delivered', '✓✓ entregue'], ['read', '✓✓ lida (azul)']].forEach(([v, l])=>{ const o = document.createElement('option'); o.value = v; o.textContent = l; st.appendChild(o); });
        st.value = m.st || 'read';
        st.addEventListener('change', ()=>{ m.st = st.value; apply(false); });
        row.appendChild(st);
      }
      card.appendChild(row);
    }
    body.appendChild(card);
  });
};
WA.chatObj = (kit, msgs, top)=>{
  const o = new WaChat({left:0, top, width:kit.W, height:kit.H - top - 170, chat:{msgs}});
  o.__labName = 'Conversa (clique pra editar as mensagens)';
  kit.cv.add(o);
  return o;
};
WA.screen = async (kit, o)=>{
  const top = 240;
  WA.wall(kit, top, o.seed);
  WA.chatObj(kit, JSON.parse(JSON.stringify(o.msgs || [])), top);
  WA.header(kit, {name:o.name || 'DIVE CREW — CH.3', status:o.status || 'last seen today at 03:12', time:o.time});
  WA.input(kit);
};
WA.MAIN = [
  {t:'chip', text:'Today'},
  {t:'text', me:false, text:'you up?', time:'03:58'},
  {t:'text', me:true, text:"yeah. can't sleep", time:'03:59', st:'read'},
  {t:'text', me:false, text:"radio's doing that thing again", time:'04:01'},
  {t:'text', me:false, text:'the low one, not static', time:'04:01'},
  {t:'text', me:true, text:'i hear it through the floor now, not the speaker', time:'04:03', st:'read'},
  {t:'text', me:false, text:"don't go near the moonpool", time:'04:04'},
  {t:'text', me:false, text:'i mean it', time:'04:04'},
  {t:'text', me:true, text:"wasn't going to. why", time:'04:06', st:'read'},
  {t:'text', me:true, text:'hey', time:'05:02', st:'delivered'},
  {t:'text', me:true, text:'please answer', time:'05:14', st:'delivered'},
];
WA.CONT = [
  {t:'text', me:true, text:'please answer', time:'05:14', st:'delivered'},
  {t:'voice', me:false, dur:'0:11', time:'05:31'},
  {t:'text', me:true, text:'what is that', time:'05:32', st:'delivered'},
  {t:'text', me:true, text:'is that you', time:'05:32', st:'delivered'},
  {t:'text', me:false, text:'stay in the machine room', time:'05:36'},
  {t:'text', me:false, text:'lock the door', time:'05:36'},
  {t:'text', me:true, text:'who is this', time:'05:37', st:'sent'},
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
  hint:'A conversa é um objeto só: clique nela pra editar, adicionar, mover ou apagar mensagens (aba Objeto). O formato da tela se mantém com qualquer quantidade: poucas ficam no topo; passando do tamanho da tela, as mais antigas saem por cima, como no celular.',
  build: async (kit)=>{ await WA.screen(kit, {msgs:WA.MAIN, time:'05:21', seed:3}); },
  pages:[
    {id:'cont', label:'Conversa continua (mais mensagens)', build: async (kit)=>{ await WA.screen(kit, {msgs:WA.CONT, time:'05:38', seed:4}); }},
    {id:'contact', label:'Informação do contato', build: WA.contact},
    {id:'calls', label:'Informação de chamadas', build: WA.calls},
    {id:'empty', label:'Conversa vazia (só a moldura)', build: async (kit)=>{ await WA.screen(kit, {msgs:[], time:'05:21', seed:5}); }},
  ],
});
