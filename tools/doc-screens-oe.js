/* ======================================================================================================
   E-MAIL DOS ANOS 90 — Outlook Express / Windows 98 — 1200 × 900.
   Janela principal (pastas + lista + painel de leitura), mensagem aberta, janela de resposta e pasta "Deleted Items".
   Cores do Windows 98: cinza #C0C0C0, relevo branco / #DFDFDF / #808080 / #404040, título navy #000080 → #1084D0,
   seleção navy com letra branca. Depende de doc-screens.js (DS), doc-screens-kit.js (SC) e doc-screens-mail.js (ML).
   ====================================================================================================== */
const OE = {};
OE.FONTS = ["400 20px 'Arimo'", "700 20px 'Arimo'", "400 20px 'Courier Prime'", "700 20px 'Courier Prime'"];
OE.C = {face:'#c0c0c0', navy:'#000080', sky:'#1084d0', ink:'#000000', white:'#ffffff', dark:'#808080'};
OE.F = 'Arimo';
OE.title = (kit, text)=>{
  const W = kit.W, C = OE.C;
  const bar = kit.rect({left:0, top:0, width:W, height:34, fill:C.navy, blend:'source-over', label:'Barra de título'});
  bar.set('fill', new fabric.Gradient({type:'linear', coords:{x1:0, y1:0, x2:W, y2:0}, colorStops:[{offset:0, color:C.navy}, {offset:1, color:C.sky}]}));
  SC.icon(kit, 'mail', 8, 4, 26, '#f4d03f', {label:'Ícone da janela'});
  kit.text(text, {left:42, top:7, width:W - 260, font:OE.F, weight:700, size:18, fill:'#ffffff', lh:1.0, blend:'source-over', label:'Título da janela'});
  [['_', 0], ['▢', 1], ['✕', 2]].forEach(([g, i])=>{
    const x = W - 112 + i*34 + (i === 2 ? 4 : 0);
    kit.rect({left:x, top:5, width:30, height:24, fill:C.face, blend:'source-over', label:'Botão da janela'});
    SC.bevel(kit, x, 5, 30, 24, false);
    kit.text(g, {left:x, top:7, width:30, font:OE.F, weight:700, size:17, fill:'#000000', align:'center', lh:1.0, blend:'source-over'});
  });
};
OE.menu = (kit, items)=>{
  const C = OE.C; let x = 12;
  kit.rect({left:0, top:34, width:kit.W, height:26, fill:C.face, blend:'source-over', label:'Barra de menus'});
  items.forEach(m=>{ const w = kit.measure(m, {font:OE.F, size:16, weight:400}) + 20; kit.text(m, {left:x, top:39, width:w, font:OE.F, weight:400, size:16, fill:'#000000', lh:1.0, blend:'source-over', label:'Menu — ' + m}); x += w; });
  kit.line(0, 60, kit.W, 60, {stroke:'#808080', sw:2, blend:'source-over', label:'Divisor'});
};
OE.toolbar = (kit, y, buttons)=>{
  const C = OE.C; let x = 8;
  kit.rect({left:0, top:y, width:kit.W, height:74, fill:C.face, blend:'source-over', label:'Barra de ferramentas'});
  buttons.forEach(([ic, lab, col, gap])=>{
    const w = Math.max(82, kit.measure(lab, {font:OE.F, size:15, weight:400}) + 22);
    SC.icon(kit, ic, x + w/2 - 17, y + 6, 34, col, {label:'Ícone — ' + lab});
    kit.text(lab, {left:x, top:y + 46, width:w, font:OE.F, weight:400, size:15, fill:'#000000', align:'center', lh:1.0, blend:'source-over', label:'Botão — ' + lab});
    x += w + 4 + (gap ? 14 : 0);
    if (gap) kit.line(x - 11, y + 8, x - 11, y + 64, {stroke:'#808080', sw:2, blend:'source-over', label:'Divisor'});
  });
  SC.bevel(kit, 0, y, kit.W, 74, false);
};
OE.TB = [['mail', 'Create Mail', '#e0b400'], ['reply', 'Reply', '#1f5fbf'], ['replyall', 'Reply All', '#1f5fbf'], ['forward', 'Forward', '#2a8a3a', true], ['print', 'Print', '#404040'], ['close', 'Delete', '#c0261f', true], ['refresh', 'Send/Recv', '#2a8a3a'], ['person', 'Addresses', '#7a5a2a'], ['search', 'Find', '#404040']];
OE.folders = (kit, x, y, w, h, sel)=>{
  const C = OE.C;
  kit.rect({left:x, top:y, width:w, height:26, fill:C.face, blend:'source-over', label:'Cabeçalho das pastas'});
  SC.bevel(kit, x, y, w, 26, false);
  kit.text('Folders', {left:x + 8, top:y + 5, width:120, font:OE.F, weight:400, size:16, fill:'#000000', lh:1.0, blend:'source-over'});
  kit.text('✕', {left:x + w - 24, top:y + 4, width:18, font:OE.F, weight:700, size:16, fill:'#000000', lh:1.0, blend:'source-over'});
  kit.rect({left:x, top:y + 26, width:w, height:h - 26, fill:'#ffffff', blend:'source-over', label:'Lista de pastas'});
  SC.bevel(kit, x, y + 26, w, h - 26, true);
  const rows = [[0, 'Outlook Express', ''], [1, 'Local Folders', ''], [2, 'Inbox', '(3)'], [2, 'Outbox', ''], [2, 'Sent Items', ''], [2, 'Deleted Items', '(2)'], [2, 'Drafts', '']];
  rows.forEach(([lvl, name, n], i)=>{
    const ry = y + 36 + i*30, rx = x + 14 + lvl*22, on = name === sel;
    if (on) kit.rect({left:rx + 26, top:ry - 2, width:kit.measure(name + (n ? ' ' + n : ''), {font:OE.F, size:16, weight:700}) + 12, height:26, fill:C.navy, blend:'source-over', label:'Pasta selecionada'});
    SC.icon(kit, 'folder', rx, ry - 1, 24, lvl === 0 ? '#f0f0f0' : '#f0d060', {label:'Pasta'});
    kit.text(name + (n ? ' ' + n : ''), {left:rx + 32, top:ry + 2, width:200, font:OE.F, weight:(n || on) ? 700 : 400, size:16, fill:on ? '#ffffff' : '#000000', lh:1.0, blend:'source-over', label:'Pasta — ' + name});
  });
};
OE.list = (kit, x, y, w, rowsH, rows, selIdx)=>{
  const C = OE.C, F = OE.F;
  const cols = [['!', 28], ['', 28], ['From', 230], ['Subject', w - 28 - 28 - 230 - 190], ['Received', 190]];
  let cx = x;
  cols.forEach(([lab, cw])=>{
    kit.rect({left:cx, top:y, width:cw, height:26, fill:C.face, blend:'source-over', label:'Coluna'});
    SC.bevel(kit, cx, y, cw, 26, false);
    if (lab === '') SC.icon(kit, 'attach', cx + 4, y + 2, 22, '#404040', {label:'Anexo'});
    else kit.text(lab, {left:cx + 8, top:y + 5, width:cw - 12, font:F, weight:400, size:16, fill:'#000000', lh:1.0, blend:'source-over'});
    cx += cw;
  });
  kit.rect({left:x, top:y + 26, width:w, height:rowsH - 26, fill:'#ffffff', blend:'source-over', label:'Lista de mensagens'});
  SC.bevel(kit, x, y + 26, w, rowsH - 26, true);
  rows.forEach((r, i)=>{
    const ry = y + 30 + i*28, on = i === selIdx, col = on ? '#ffffff' : '#000000', wt = r.unread ? 700 : 400;
    if (on) kit.rect({left:x + 3, top:ry - 1, width:w - 6, height:27, fill:C.navy, blend:'source-over', label:'Linha selecionada'});
    SC.icon(kit, r.unread ? 'mail' : 'drafts', x + 32, ry + 1, 22, on ? '#ffffff' : (r.unread ? '#e0b400' : '#8a8a8a'), {label:'Estado'});
    kit.text(r.from, {left:x + 28 + 28 + 8, top:ry + 3, width:222, font:F, weight:wt, size:16, fill:col, lh:1.0, blend:'source-over'});
    kit.text(r.subj.length > 52 ? r.subj.slice(0, 51) + '…' : r.subj, {left:x + 28 + 28 + 230 + 8, top:ry + 3, width:cols[3][1] - 12, font:F, weight:wt, size:16, fill:col, lh:1.0, blend:'source-over'});
    kit.text(r.when, {left:x + w - 190 + 8, top:ry + 3, width:176, font:F, weight:wt, size:16, fill:col, lh:1.0, blend:'source-over'});
  });
};
OE.ROWS = [
  {from:'sysnotify', subj:ML.ALERT.subject, when:'3/14/2013 5:15 AM', unread:true},
  {from:'M. Holt', subj:ML.HOLT.subject, when:'3/14/2013 6:02 AM', unread:true},
  {from:'Crew Services', subj:'Mail pickup moved to Friday', when:'3/14/2013 4:30 AM', unread:true},
  {from:'J. Okafor', subj:ML.OKAFOR.subject, when:'3/13/2013 11:41 PM', unread:false},
  {from:'Galley', subj:'Dining deck closed 03:00-03:12', when:'3/13/2013 4:05 PM', unread:false},
];
OE.header = (kit, x, y, w, d)=>{
  const F = OE.F;
  kit.rect({left:x, top:y, width:w, height:112, fill:OE.C.face, blend:'source-over', label:'Cabeçalho da mensagem'});
  SC.bevel(kit, x, y, w, 112, false);
  const rows = d.compose ? [['From:', d.fromLine], ['To:', d.toLine], ['Cc:', ''], ['Subject:', d.subject]] : [['From:', d.fromLine], ['Date:', d.dateLine], ['To:', d.toLine], ['Subject:', d.subject]];
  rows.forEach(([l, v], i)=>{
    kit.text(l, {left:x + 14, top:y + 10 + i*25, width:90, font:F, weight:700, size:16, fill:'#000000', lh:1.0, blend:'source-over'});
    kit.text(v, {left:x + 108, top:y + 10 + i*25, width:w - 124, font:F, weight:i === 3 ? 700 : 400, size:16, fill:'#000000', lh:1.0, blend:'source-over'});
  });
};
OE.main = (kit, o)=>{
  const W = kit.W, H = kit.H, C = OE.C;
  kit.rect({left:0, top:0, width:W, height:H, fill:C.face, blend:'source-over', label:'Janela'});
  OE.title(kit, (o.folder || 'Inbox') + ' - Outlook Express');
  OE.menu(kit, ['File', 'Edit', 'View', 'Tools', 'Message', 'Help']);
  OE.toolbar(kit, 62, OE.TB);
  const top = 142, listH = 232, split = top + listH + 8;
  OE.folders(kit, 6, top, 236, H - top - 42, o.folder || 'Inbox');
  OE.list(kit, 250, top, W - 256, listH, o.rows || OE.ROWS, o.sel != null ? o.sel : 0);
  if (o.msg){
    OE.header(kit, 250, split, W - 256, o.msg);
    kit.rect({left:250, top:split + 116, width:W - 256, height:H - split - 116 - 42, fill:'#ffffff', blend:'source-over', label:'Painel de leitura'});
    SC.bevel(kit, 250, split + 116, W - 256, H - split - 116 - 42, true);
    kit.text(o.msg.body, {left:268, top:split + 132, width:W - 292, font:'Courier Prime', weight:400, size:18, fill:'#000000', lh:1.45, blend:'source-over', label:'Corpo do e-mail'});
  } else {
    kit.rect({left:250, top:split, width:W - 256, height:H - split - 42, fill:'#ffffff', blend:'source-over', label:'Painel de leitura'});
    SC.bevel(kit, 250, split, W - 256, H - split - 42, true);
    kit.text('There are no messages to preview.', {left:250, top:split + 90, width:W - 256, font:OE.F, weight:400, size:18, fill:'#808080', align:'center', lh:1.0, blend:'source-over'});
  }
  kit.rect({left:0, top:H - 34, width:W, height:34, fill:C.face, blend:'source-over', label:'Barra de status'});
  SC.bevel(kit, 4, H - 29, W - 250, 24, true); SC.bevel(kit, W - 240, H - 29, 236, 24, true);
  kit.text(o.status || '5 message(s), 3 unread', {left:12, top:H - 24, width:600, font:OE.F, weight:400, size:15, fill:'#000000', lh:1.0, blend:'source-over'});
  kit.text('Working Online', {left:W - 230, top:H - 24, width:220, font:OE.F, weight:400, size:15, fill:'#000000', lh:1.0, blend:'source-over'});
};
OE.window = (kit, o)=>{
  const W = kit.W, H = kit.H, C = OE.C;
  kit.rect({left:0, top:0, width:W, height:H, fill:C.face, blend:'source-over', label:'Janela'});
  OE.title(kit, o.title);
  OE.menu(kit, ['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Message', 'Help']);
  OE.toolbar(kit, 62, o.buttons);
  OE.header(kit, 0, 142, W, o.msg);
  kit.rect({left:0, top:262, width:W, height:H - 262, fill:'#ffffff', blend:'source-over', label:'Corpo'});
  SC.bevel(kit, 0, 262, W, H - 262, true);
  kit.text(o.body, {left:20, top:280, width:W - 44, font:'Courier Prime', weight:400, size:19, fill:'#000000', lh:1.5, blend:'source-over', label:'Corpo do e-mail'});
};
OE.alertMsg = ()=>({fromLine:'sysnotify@des-platform-01.internal', dateLine:'Thursday, March 14, 2013 5:15 AM', toLine:'maintenance-dist@neurostat-fd.local', subject:ML.ALERT.subject, body:ML.ALERT.body});
registerDoc('email_90s', {
  label:'Print — e-mail (anos 90)', page:[1200, 900], phys:[8, 6], screen:true,
  paper:{type:'liso', level:0, atmos:'neutra'}, fonts:OE.FONTS,
  build: async (kit)=>{ OE.main(kit, {msg:OE.alertMsg(), sel:0}); },
  pages:[
    {id:'open', label:'Mensagem aberta (janela própria)', build: async (kit)=>{
      OE.window(kit, {title:ML.ALERT.subject, buttons:[['reply', 'Reply', '#1f5fbf'], ['replyall', 'Reply All', '#1f5fbf'], ['forward', 'Forward', '#2a8a3a', true], ['print', 'Print', '#404040'], ['close', 'Delete', '#c0261f', true], ['up', 'Previous', '#404040'], ['down', 'Next', '#404040'], ['person', 'Addresses', '#7a5a2a']], msg:OE.alertMsg(), body:ML.ALERT.body});
    }},
    {id:'compose', label:'Resposta (janela de redação)', build: async (kit)=>{
      OE.window(kit, {title:'Re: ' + ML.ALERT.subject, buttons:[['send', 'Send', '#1f5fbf', true], ['edit', 'Cut', '#404040'], ['folder', 'Copy', '#404040'], ['attach', 'Attach', '#404040', true], ['person', 'Check', '#7a5a2a'], ['search', 'Spelling', '#404040']],
        msg:{compose:true, fromLine:'m.holt@neurostat-fd.local', dateLine:'', toLine:'sysnotify@des-platform-01.internal', subject:'Re: ' + ML.ALERT.subject},
        body:'\n\n\n-----Original Message-----\nFrom: sysnotify@des-platform-01.internal\nSent: Thursday, March 14, 2013 5:15 AM\nTo: maintenance-dist@neurostat-fd.local\nSubject: ' + ML.ALERT.subject + '\n\nTHIS IS AN AUTOMATED MESSAGE. DO NOT REPLY.'});
    }},
    {id:'deleted', label:'Pasta Deleted Items', build: async (kit)=>{
      OE.main(kit, {folder:'Deleted Items', rows:[{from:'sysnotify', subj:'AUTOMATED ALERT: hull_array[12] (x40)', when:'3/14/2013 5:15 AM', unread:false}, {from:'sysnotify', subj:'AUTOMATED ALERT: hull_array[12] (x43)', when:'3/14/2013 5:15 AM', unread:false}], sel:-1, status:'2 message(s), 0 unread'});
    }},
  ],
});
