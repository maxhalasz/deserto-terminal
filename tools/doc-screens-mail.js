/* ======================================================================================================
   E-MAILS — celular (iOS Mail), computador (Outlook de três painéis) e anos 90 (Outlook Express / Windows 98).
   Cores de sistema: iOS azul #007AFF, separador #C6C6C8, cinza #8E8E93; Outlook azul #2B579A; Windows 98 cinza #C0C0C0,
   título navy #000080 → #1084D0, relevo branco/#808080/#404040. Corpo dos e-mails em inglês. 03/14 é quinta-feira.
   Depende de doc-screens.js (DS), doc-screens-kit.js (SC).
   ====================================================================================================== */
const ML = {};

ML.clip = (s, n)=>s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
/* -------------------------------- conteúdo (compartilhado pelas três telas) -------------------------------- */
ML.OKAFOR = {name:'J. Okafor', addr:'j.okafor@neurostat-fd.local', init:'O', to:'M. Holt', subject:'Re: shift log — attach radio transcript?', when:'Wed, Mar 13 at 23:41', short:'Wed 23:41',
  body:"Holt —\n\nPutting this on the record since the printer's down again and I don't trust the shared drive.\n\nWe lost the 03:12 channel like I told you, but it came back at 04:58 on its own. Nobody touched it.\n\nWhen it came back there was already something recorded on it. I'm not transcribing it over email.\n\nCome down and listen yourself before the next shift change.\n\n— Okafor"};
ML.HOLT = {name:'M. Holt', addr:'m.holt@neurostat-fd.local', init:'H', to:'J. Okafor', subject:'RE: Re: shift log — attach radio transcript?', when:'Thu, Mar 14 at 06:02', short:'Thu 06:02',
  body:"Okafor,\n\nDo not play it for the rest of the crew. Bring the drive to my office directly, nobody else present.\n\nThis is not the first time hardware has recorded something during a dropout. Previous instances are documented and classified above your clearance, which is itself informative.\n\nStandard procedure applies: log the timestamp, do not loop the audio, do not describe its content in writing.\n\n— M. Holt\nNEUROSTAT — Field Division"};
ML.ALERT = {name:'sysnotify', addr:'sysnotify@des-platform-01.internal', init:'S', to:'maintenance-dist@neurostat-fd.local', subject:'AUTOMATED ALERT: hull_array[12] THRESHOLD EXCEEDED', when:'Thu, Mar 14 at 05:15', short:'Thu 05:15',
  body:"THIS IS AN AUTOMATED MESSAGE. DO NOT REPLY.\n\nSENSOR NODE DES-PLATFORM-01 HAS LOGGED 40+ ANOMALY EVENTS ON HULL ARRAY CHANNEL 12 IN THE LAST SIX MINUTES.\n\nTHRESHOLD FOR AUTOMATIC SUPERVISOR NOTIFICATION: 3 EVENTS / HOUR.\nOBSERVED RATE: EXCEEDS SCALE.\n\nLOGGING HAS BEEN SUSPENDED BY SUPERVISOR OVERRIDE AT 05:15:00.\nTHIS SYSTEM WILL NOT SEND FURTHER ALERTS UNTIL LOGGING RESUMES.\n\n-- END OF MESSAGE --"};
ML.INBOX = [
  {from:'M. Holt', subj:ML.HOLT.subject, prev:'Okafor, Do not play it for the rest of the crew. Bring the drive to my office directly, nobody else present.', time:'06:02', unread:true},
  {from:'sysnotify', subj:ML.ALERT.subject, prev:'THIS IS AN AUTOMATED MESSAGE. DO NOT REPLY. SENSOR NODE DES-PLATFORM-01 HAS LOGGED 40+ ANOMALY EVENTS', time:'05:15', unread:true},
  {from:'Crew Services', subj:'Mail pickup moved to Friday', prev:'Crew mail is collected on Fridays. Letters left after the shuttle has gone will wait for the next one.', time:'04:30', unread:true},
  {from:'J. Okafor', subj:ML.OKAFOR.subject, prev:"Holt — Putting this on the record since the printer's down again and I don't trust the shared drive.", time:'Wed', unread:false},
  {from:'Galley', subj:'Dining deck closed 03:00–03:12', prev:'The dining deck is closed daily for cleaning from 03:00 to 03:12. Please do not enter during the cleaning.', time:'Wed', unread:false},
  {from:'Facilities', subj:'Pump maintenance, lower deck', prev:'Pump 2 will be offline 02:00–02:30 on Thursday. Noise from the lower deck during this time is expected.', time:'Tue', unread:false},
];

/* ============================== CELULAR (iOS Mail) — 1080 × 2220 ============================== */
ML.IOS_FONTS = ["400 20px 'Inter'", "600 20px 'Inter'", "700 20px 'Inter'"];
ML.IOS = {blue:'#007aff', sep:'#c6c6c8', gray:'#8e8e93', ink:'#000000', avatar:'#a2a7b0'};
ML.iosFrame = (kit, o)=>{
  const W = kit.W, H = kit.H, C = ML.IOS;
  kit.rect({left:0, top:0, width:W, height:H, fill:'#ffffff', blend:'source-over', label:'Fundo'});
  SC.statusBar(kit, {y:0, h:112, fg:'#000000', time:o.time || '05:21', style:'ios'});
  kit.rect({left:W/2 - 190, top:H - 36, width:380, height:14, fill:'#000000', rx:7, blend:'source-over', label:'Indicador da tela inicial'});
};
ML.iosToolbar = (kit, icons)=>{
  const W = kit.W, H = kit.H, C = ML.IOS;
  kit.line(0, H - 232, W, H - 232, {stroke:C.sep, sw:2, blend:'source-over', label:'Separador da barra de baixo'});
  icons.forEach((ic, i)=>SC.icon(kit, ic, (W/(icons.length*2))*(1 + i*2) - 35, H - 196, 70, C.blue, {label:'Ícone — ' + ic}));
};
ML.iosMessage = (kit, d, box)=>{
  const W = kit.W, H = kit.H, C = ML.IOS;
  ML.iosFrame(kit, {time:d.statusTime});
  SC.icon(kit, 'left', 18, 134, 74, C.blue, {label:'Voltar'});
  kit.text(box || 'Inbox', {left:92, top:146, width:500, font:'Inter', weight:400, size:46, fill:C.blue, lh:1.0, blend:'source-over'});
  SC.icon(kit, 'up', W - 214, 132, 76, C.blue, {label:'Anterior'});
  SC.icon(kit, 'down', W - 120, 132, 76, C.blue, {label:'Próxima'});
  const subj = kit.text(d.subject, {left:44, top:268, width:W - 88, font:'Inter', weight:700, size:58, fill:C.ink, lh:1.18, blend:'source-over', label:'Assunto'});
  const y2 = subj.top + subj.height + 38;
  kit.circle({left:44, top:y2, r:56, fill:C.avatar, blend:'source-over', label:'Avatar'});
  kit.text(d.init, {left:44, top:y2 + 30, width:112, font:'Inter', weight:600, size:56, fill:'#ffffff', align:'center', lh:1.0, blend:'source-over'});
  kit.text(d.name, {left:176, top:y2 + 4, width:360, font:'Inter', weight:600, size:46, fill:C.ink, lh:1.0, blend:'source-over', label:'Remetente'});
  kit.text('To: ' + d.to, {left:176, top:y2 + 68, width:700, font:'Inter', weight:400, size:36, fill:C.gray, lh:1.0, blend:'source-over', label:'Para'});
  kit.text(d.when, {left:W - 520, top:y2 + 8, width:476, font:'Inter', weight:400, size:34, fill:C.gray, align:'right', lh:1.0, blend:'source-over', label:'Data'});
  kit.line(44, y2 + 146, W, y2 + 146, {stroke:C.sep, sw:2, blend:'source-over', label:'Separador'});
  kit.text(d.body, {left:44, top:y2 + 190, width:W - 88, font:'Inter', weight:400, size:45, fill:C.ink, lh:1.4, blend:'source-over', label:'Corpo do e-mail'});
  ML.iosToolbar(kit, ['trash', 'folder', 'reply', 'edit']);
};
ML.iosInbox = (kit)=>{
  const W = kit.W, H = kit.H, C = ML.IOS;
  ML.iosFrame(kit, {time:'05:23'});
  SC.icon(kit, 'left', 18, 134, 74, C.blue, {label:'Voltar'});
  kit.text('Mailboxes', {left:92, top:146, width:500, font:'Inter', weight:400, size:46, fill:C.blue, lh:1.0, blend:'source-over'});
  kit.text('Edit', {left:W - 190, top:146, width:150, font:'Inter', weight:400, size:46, fill:C.blue, align:'right', lh:1.0, blend:'source-over'});
  kit.text('Inbox', {left:44, top:236, width:700, font:'Inter', weight:700, size:104, fill:C.ink, lh:1.0, blend:'source-over', label:'Título'});
  kit.rect({left:44, top:392, width:W - 88, height:84, fill:'#e9e9eb', rx:22, blend:'source-over', label:'Busca'});
  SC.icon(kit, 'search', 70, 410, 48, C.gray, {label:'Lupa'});
  kit.text('Search', {left:138, top:414, width:400, font:'Inter', weight:400, size:42, fill:C.gray, lh:1.0, blend:'source-over'});
  ML.INBOX.forEach((m, i)=>{
    const y = 520 + i*232;
    if (m.unread) kit.circle({left:34, top:y + 40, r:14, fill:C.blue, blend:'source-over', label:'Não lido'});
    kit.text(m.from, {left:88, top:y + 22, width:560, font:'Inter', weight:600, size:46, fill:C.ink, lh:1.0, blend:'source-over'});
    kit.text(m.time, {left:W - 270, top:y + 28, width:200, font:'Inter', weight:400, size:36, fill:C.gray, align:'right', lh:1.0, blend:'source-over'});
    SC.icon(kit, 'left', W - 70, y + 20, 44, '#c7c7cc', {angle:180, label:'Seta'});
    kit.text(ML.clip(m.subj, 40), {left:88, top:y + 84, width:W - 150, font:'Inter', weight:400, size:41, fill:C.ink, lh:1.0, blend:'source-over'});
    kit.text(ML.clip(m.prev, 70), {left:88, top:y + 138, width:W - 150, font:'Inter', weight:400, size:36, fill:C.gray, lh:1.18, blend:'source-over'});
    kit.line(88, y + 222, W, y + 222, {stroke:C.sep, sw:2, blend:'source-over', label:'Separador'});
  });
  kit.line(0, H - 232, W, H - 232, {stroke:C.sep, sw:2, blend:'source-over'});
  kit.text('Updated Just Now', {left:0, top:H - 180, width:W, font:'Inter', weight:400, size:34, fill:C.ink, align:'center', lh:1.0, blend:'source-over'});
  SC.icon(kit, 'edit', W - 130, H - 196, 70, C.blue, {label:'Escrever'});
};
ML.iosCompose = (kit)=>{
  const W = kit.W, H = kit.H, C = ML.IOS;
  ML.iosFrame(kit, {time:'05:27'});
  kit.text('Cancel', {left:44, top:150, width:260, font:'Inter', weight:400, size:46, fill:C.blue, lh:1.0, blend:'source-over'});
  kit.text('New Message', {left:330, top:148, width:W - 660, font:'Inter', weight:600, size:46, fill:C.ink, align:'center', lh:1.0, blend:'source-over'});
  kit.circle({left:W - 130, top:132, r:44, fill:'#c7c7cc', blend:'source-over', label:'Enviar (desligado)'});
  SC.icon(kit, 'up', W - 118, 144, 64, '#ffffff', {label:'Seta de enviar'});
  const field = (label, val, y, hot)=>{
    const small = label.length > 8;
    kit.text(label, {left:44, top:y + (small ? 36 : 30), width:small ? 370 : 200, font:'Inter', weight:400, size:small ? 36 : 42, fill:C.gray, lh:1.0, blend:'source-over'});
    if (val) kit.text(val, {left:small ? 420 : 260, top:y + (small ? 36 : 30), width:W - (small ? 460 : 300), font:'Inter', weight:400, size:small ? 38 : 42, fill:hot ? C.blue : C.ink, lh:1.0, blend:'source-over'});
    kit.line(44, y + 104, W, y + 104, {stroke:C.sep, sw:2, blend:'source-over', label:'Separador'});
  };
  field('To:', 'M. Holt', 250, true); field('Cc/Bcc, From:', 'j.okafor@neurostat-fd.local', 354); field('Subject:', 'Re: shift log', 458);
  kit.text("Holt —\n\nI'm at the machine room door. It's playing again. I didn't touch anything.\n\n— Okafor", {left:44, top:600, width:W - 88, font:'Inter', weight:400, size:45, fill:C.ink, lh:1.4, blend:'source-over', label:'Corpo do e-mail'});
  kit.text('Sent from my iPhone', {left:44, top:1010, width:W - 88, font:'Inter', weight:400, size:45, fill:C.gray, lh:1.4, blend:'source-over', label:'Assinatura'});
};
registerDoc('email_mobile', {
  label:'Print — e-mail (celular)', page:[1080, 2220], phys:[3, 6.17], screen:true,
  paper:{type:'liso', level:0, atmos:'neutra'}, fonts:ML.IOS_FONTS,
  build: async (kit)=>{ ML.iosMessage(kit, Object.assign({}, ML.OKAFOR, {statusTime:'05:21'}), 'Inbox'); },
  pages:[
    {id:'reply', label:'Resposta (mensagem do Holt)', build: async (kit)=>{ ML.iosMessage(kit, Object.assign({}, ML.HOLT, {statusTime:'06:04'}), 'Inbox'); }},
    {id:'inbox', label:'Caixa de entrada (lista)', build: async (kit)=>{ ML.iosInbox(kit); }},
    {id:'compose', label:'Nova mensagem (rascunho)', build: async (kit)=>{ ML.iosCompose(kit); }},
  ],
});

/* ============================== COMPUTADOR (Outlook, três painéis) — 1600 × 1000 ============================== */
ML.OL_FONTS = ["400 20px 'Source Sans 3'", "600 20px 'Source Sans 3'", "700 20px 'Source Sans 3'", "italic 400 20px 'Source Sans 3'"];
ML.OL = {blue:'#2b579a', blueDark:'#1e4474', sel:'#cde6f7', hover:'#e6f2fb', line:'#e1e1e1', pane:'#f3f3f3', ink:'#242424', gray:'#6b6b6b', unread:'#0f6cbd'};
ML.olFrame = (kit, o)=>{
  const W = kit.W, H = kit.H, C = ML.OL, F = 'Source Sans 3';
  kit.rect({left:0, top:0, width:W, height:H, fill:'#ffffff', blend:'source-over', label:'Fundo'});
  kit.rect({left:0, top:0, width:W, height:80, fill:C.blue, blend:'source-over', label:'Barra de título e abas'});
  kit.text(o.title, {left:200, top:8, width:W - 400, font:F, weight:400, size:19, fill:'#ffffff', align:'center', lh:1.0, blend:'source-over', label:'Título da janela'});
  ['—', '▢', '✕'].forEach((g, i)=>kit.text(g, {left:W - 150 + i*50, top:6, width:40, font:'Arimo', weight:400, size:20, fill:'#ffffff', align:'center', lh:1.0, blend:'source-over', label:'Botão da janela'}));
  const tabs = o.tabs || ['File', 'Home', 'Send / Receive', 'Folder', 'View', 'Help'];
  let tx = 14;
  tabs.forEach((t, i)=>{
    const w = kit.measure(t, {font:F, size:19, weight:400}) + 40, sel = t === (o.tab || 'Home');
    if (i === 0) kit.rect({left:tx, top:40, width:w, height:40, fill:C.blueDark, blend:'source-over', label:'Aba File'});
    else if (sel) kit.rect({left:tx, top:42, width:w, height:38, fill:C.pane, blend:'source-over', label:'Aba selecionada'});
    kit.text(t, {left:tx, top:51, width:w, font:F, weight:400, size:19, fill:sel && i ? C.blue : '#ffffff', align:'center', lh:1.0, blend:'source-over', label:'Aba — ' + t});
    tx += w;
  });
  // faixa de ferramentas
  kit.rect({left:0, top:80, width:W, height:104, fill:C.pane, blend:'source-over', label:'Faixa de ferramentas'});
  kit.line(0, 184, W, 184, {stroke:'#d6d6d6', sw:2, blend:'source-over'});
  let bx = 20;
  (o.buttons || [['mail', 'New Email'], ['trash', 'Delete'], ['folder', 'Archive'], ['reply', 'Reply'], ['replyall', 'Reply All'], ['forward', 'Forward'], ['flag', 'Follow Up'], ['search', 'Search']]).forEach(([ic, lab], i)=>{
    const w = Math.max(84, kit.measure(lab, {font:F, size:16, weight:400}) + 30);
    SC.icon(kit, ic, bx + w/2 - 20, 94, 40, i === 0 ? C.blue : '#444444', {label:'Ícone — ' + lab});
    kit.text(lab, {left:bx, top:146, width:w, font:F, weight:400, size:16, fill:C.ink, align:'center', lh:1.0, blend:'source-over', label:'Botão — ' + lab});
    bx += w + (i === 2 || i === 5 ? 28 : 6);
    if (i === 2 || i === 5) kit.line(bx - 17, 96, bx - 17, 168, {stroke:'#d0d0d0', sw:2, blend:'source-over', label:'Divisor'});
  });
  // barra de status
  kit.rect({left:0, top:H - 32, width:W, height:32, fill:C.blue, blend:'source-over', label:'Barra de status'});
  kit.text(o.status || 'Items: 6     Unread: 3', {left:16, top:H - 25, width:600, font:F, weight:400, size:16, fill:'#ffffff', lh:1.0, blend:'source-over'});
  kit.text('All folders are up to date.     Connected to: Microsoft Exchange', {left:W - 700, top:H - 25, width:684, font:F, weight:400, size:16, fill:'#ffffff', align:'right', lh:1.0, blend:'source-over'});
};
ML.olFolders = (kit, sel)=>{
  const C = ML.OL, F = 'Source Sans 3', H = kit.H;
  kit.rect({left:0, top:185, width:250, height:H - 217, fill:'#f7f7f7', blend:'source-over', label:'Painel de pastas'});
  kit.line(250, 185, 250, H - 32, {stroke:C.line, sw:2, blend:'source-over'});
  kit.text('m.holt@neurostat-fd.local', {left:14, top:200, width:230, font:F, weight:600, size:17, fill:C.ink, lh:1.0, blend:'source-over', label:'Conta'});
  [['Inbox', '3'], ['Drafts', ''], ['Sent Items', ''], ['Archive', ''], ['Deleted Items', '2'], ['Junk Email', '']].forEach(([f, n], i)=>{
    const y = 238 + i*38, on = f === sel;
    if (on) { kit.rect({left:0, top:y - 6, width:250, height:36, fill:C.sel, blend:'source-over', label:'Pasta selecionada'}); kit.rect({left:0, top:y - 6, width:4, height:36, fill:C.blue, blend:'source-over'}); }
    kit.text(f, {left:34, top:y, width:150, font:F, weight:on ? 600 : 400, size:19, fill:C.ink, lh:1.0, blend:'source-over', label:'Pasta — ' + f});
    if (n) kit.text(n, {left:190, top:y, width:44, font:F, weight:600, size:18, fill:C.unread, align:'right', lh:1.0, blend:'source-over'});
  });
};
ML.olList = (kit, items, selIdx)=>{
  const C = ML.OL, F = 'Source Sans 3', H = kit.H, X = 251, Wl = 450;
  kit.text('Focused', {left:X + 18, top:200, width:90, font:F, weight:600, size:19, fill:C.blue, lh:1.0, blend:'source-over'});
  kit.rect({left:X + 18, top:228, width:78, height:3, fill:C.blue, blend:'source-over'});
  kit.text('Other', {left:X + 120, top:200, width:100, font:F, weight:400, size:19, fill:C.gray, lh:1.0, blend:'source-over'});
  kit.text('All   ▾', {left:X + Wl - 110, top:200, width:90, font:F, weight:400, size:17, fill:C.gray, align:'right', lh:1.0, blend:'source-over'});
  kit.line(X, 238, X + Wl, 238, {stroke:C.line, sw:2, blend:'source-over'});
  items.forEach((m, i)=>{
    const y = 240 + i*112, on = i === selIdx;
    if (on){ kit.rect({left:X, top:y, width:Wl, height:112, fill:C.sel, blend:'source-over', label:'Mensagem selecionada'}); }
    if (m.unread) kit.rect({left:X, top:y, width:4, height:112, fill:C.blue, blend:'source-over', label:'Não lido'});
    kit.text(m.from, {left:X + 20, top:y + 12, width:300, font:F, weight:m.unread ? 700 : 400, size:20, fill:C.ink, lh:1.0, blend:'source-over'});
    kit.text(m.time, {left:X + Wl - 120, top:y + 14, width:100, font:F, weight:400, size:16, fill:m.unread ? C.unread : C.gray, align:'right', lh:1.0, blend:'source-over'});
    kit.text(m.subj.length > 44 ? m.subj.slice(0, 43) + '…' : m.subj, {left:X + 20, top:y + 42, width:Wl - 40, font:F, weight:m.unread ? 600 : 400, size:18, fill:m.unread ? C.unread : C.ink, lh:1.0, blend:'source-over'});
    kit.text(m.prev.length > 62 ? m.prev.slice(0, 61) + '…' : m.prev, {left:X + 20, top:y + 72, width:Wl - 40, font:F, weight:400, size:16, fill:C.gray, lh:1.0, blend:'source-over'});
    kit.line(X + 20, y + 111, X + Wl, y + 111, {stroke:'#eeeeee', sw:2, blend:'source-over'});
  });
  kit.line(X + Wl, 185, X + Wl, H - 32, {stroke:C.line, sw:2, blend:'source-over'});
};
ML.olReading = (kit, d)=>{
  const W = kit.W, H = kit.H, C = ML.OL, F = 'Source Sans 3', X = 722, RW = W - X - 36;
  const subj = kit.text(d.subject, {left:X, top:204, width:RW, font:F, weight:600, size:30, fill:C.ink, lh:1.15, blend:'source-over', label:'Assunto'});
  const y = subj.top + subj.height + 22;
  kit.circle({left:X, top:y, r:30, fill:'#7b5ea7', blend:'source-over', label:'Avatar'});
  kit.text(d.init + (d.init2 || ''), {left:X, top:y + 18, width:60, font:F, weight:600, size:22, fill:'#ffffff', align:'center', lh:1.0, blend:'source-over'});
  kit.text(d.name, {left:X + 76, top:y, width:380, font:F, weight:600, size:21, fill:C.ink, lh:1.0, blend:'source-over', label:'Remetente'});
  kit.text('<' + d.addr + '>', {left:X + 76, top:y + 28, width:600, font:F, weight:400, size:17, fill:C.gray, lh:1.0, blend:'source-over'});
  kit.text('To: ' + d.to, {left:X + 76, top:y + 52, width:600, font:F, weight:400, size:17, fill:C.gray, lh:1.0, blend:'source-over'});
  kit.text(d.when, {left:W - 400, top:y + 4, width:364, font:F, weight:400, size:17, fill:C.gray, align:'right', lh:1.0, blend:'source-over', label:'Data'});
  ['reply', 'replyall', 'forward'].forEach((ic, i)=>SC.icon(kit, ic, W - 160 + i*44, y + 36, 28, C.blue, {label:'Ícone — ' + ic}));
  kit.line(X, y + 92, X + RW, y + 92, {stroke:C.line, sw:2, blend:'source-over', label:'Separador'});
  kit.text(d.body, {left:X, top:y + 118, width:RW, font:F, weight:400, size:21, fill:C.ink, lh:1.45, blend:'source-over', label:'Corpo do e-mail'});
};
ML.olMain = (kit, o)=>{
  ML.olFrame(kit, {title:o.title || 'Inbox - m.holt@neurostat-fd.local - Outlook', status:o.status});
  ML.olFolders(kit, o.folder || 'Inbox');
  ML.olList(kit, o.items || ML.INBOX, o.sel);
  ML.olReading(kit, o.msg);
};
ML.olCompose = (kit)=>{
  const W = kit.W, H = kit.H, C = ML.OL, F = 'Source Sans 3';
  ML.olFrame(kit, {title:'RE: Re: shift log — attach radio transcript? - Message (HTML)', tab:'Message', tabs:['File', 'Message', 'Insert', 'Options', 'Format Text', 'Review', 'Help'],
    buttons:[['send', 'Send'], ['attach', 'Attach File'], ['flag', 'Follow Up'], ['search', 'Check Names']], status:'Draft saved at 06:11'});
  const bx = 14, by = 196;
  // botão Send grande
  kit.rect({left:bx, top:by, width:120, height:112, fill:'#ffffff', stroke:'#d0d0d0', sw:2, rx:4, blend:'source-over', label:'Botão Send'});
  SC.icon(kit, 'send', bx + 36, by + 20, 48, C.blue, {label:'Enviar'});
  kit.text('Send', {left:bx, top:by + 78, width:120, font:F, weight:600, size:20, fill:C.ink, align:'center', lh:1.0, blend:'source-over'});
  const fields = [['From', 'm.holt@neurostat-fd.local'], ['To', 'J. Okafor <j.okafor@neurostat-fd.local>'], ['Cc', ''], ['Subject', 'RE: Re: shift log — attach radio transcript?']];
  fields.forEach(([l, v], i)=>{
    const y = 200 + i*50;
    kit.rect({left:150, top:y, width:90, height:42, fill:'#f3f3f3', stroke:'#d0d0d0', sw:1.5, blend:'source-over', label:'Rótulo'});
    kit.text(l, {left:150, top:y + 11, width:90, font:F, weight:400, size:18, fill:C.ink, align:'center', lh:1.0, blend:'source-over'});
    kit.rect({left:240, top:y, width:W - 276, height:42, fill:'#ffffff', stroke:'#d0d0d0', sw:1.5, blend:'source-over', label:'Campo'});
    if (v) kit.text(v, {left:254, top:y + 10, width:W - 310, font:F, weight:l === 'Subject' ? 600 : 400, size:20, fill:C.ink, lh:1.0, blend:'source-over'});
  });
  kit.line(0, 404, W, 404, {stroke:C.line, sw:2, blend:'source-over'});
  kit.text("Okafor,\n\n\n\n\n\nFrom: J. Okafor\nSent: Wednesday, March 13, 23:41\nTo: M. Holt\nSubject: Re: shift log — attach radio transcript?\n\nHolt —\n\nPutting this on the record since the printer's down again and I don't trust the shared drive.\n\nWe lost the 03:12 channel like I told you, but it came back at 04:58 on its own. Nobody touched it.",
    {left:36, top:424, width:W - 72, font:F, weight:400, size:21, fill:C.ink, lh:1.45, blend:'source-over', label:'Corpo do e-mail'});
};
registerDoc('email_desktop', {
  label:'Print — e-mail (computador)', page:[1600, 1000], phys:[10, 6.25], screen:true,
  paper:{type:'liso', level:0, atmos:'neutra'}, fonts:ML.OL_FONTS.concat(["400 20px 'Arimo'"]),
  build: async (kit)=>{ ML.olMain(kit, {msg:ML.HOLT, sel:0}); },
  pages:[
    {id:'thread', label:'Mensagem anterior (Okafor)', build: async (kit)=>{ ML.olMain(kit, {msg:ML.OKAFOR, sel:3}); }},
    {id:'alert', label:'Alerta automático', build: async (kit)=>{ ML.olMain(kit, {msg:ML.ALERT, sel:1}); }},
    {id:'compose', label:'Resposta (janela de redação)', build: async (kit)=>{ ML.olCompose(kit); }},
  ],
});
