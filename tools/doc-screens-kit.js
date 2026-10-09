/* ===================== Peças das telas (terminal, WhatsApp, e-mails, crachá) =====================
   Ícones vetoriais (Material Design Icons, licença Apache 2.0: caixa 24×24), barra de status de celular, relevo
   (bevel) de janela do Windows 98, balão de chat. Tudo sai como objetos Fabric editáveis, nada de imagem pronta.
   Depende de: fabric, DocKit (doc-kit.js). Carrega antes de doc-screens.js. */

const SC = {};
SC.ICONS = {
  back:'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  video:'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
  call:'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
  more:'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  mic:'M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z',
  attach:'M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z',
  camera:'M12 8.8c-1.77 0-3.2 1.43-3.2 3.2s1.43 3.2 3.2 3.2 3.2-1.43 3.2-3.2S13.77 8.8 12 8.8zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z',
  smile:'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z',
  trash:'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  reply:'M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z',
  replyall:'M7 8V5l-7 7 7 7v-3l-4-4 4-4zm6 1V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z',
  forward:'M12 8V4l8 8-8 8v-4H4V8z',
  folder:'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  edit:'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  up:'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z',
  down:'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z',
  left:'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  send:'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z',
  search:'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  play:'M8 5v14l11-7z',
  done:'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z',
  doneall:'M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z',
  signal:'M2 22h20V2z',
  wifi:'M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z',
  person:'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  lock:'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
  image:'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  add:'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  flag:'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z',
  star:'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  close:'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  mail:'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  inbox:'M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z',
  drafts:'M21.99 8c0-.72-.37-1.35-.94-1.7L12 1 2.95 6.3C2.38 6.65 2 7.28 2 8v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2l-.01-10zM12 13L3.74 7.84 12 3l8.26 4.84L12 13z',
  print:'M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z',
  refresh:'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
};
/* Ícone: o canto de cima-esquerda da caixa 24×24 fica em (x,y); `size` = lado da caixa em px. */
SC.icon = (kit, name, x, y, size, color, o)=>{
  o = o || {};
  const d = SC.ICONS[name]; if (!d) throw new Error('ícone desconhecido: ' + name);
  const s = size/24;
  const p = kit.path(d, {left:0, top:0, fill:color, scale:s, opacity:o.opacity, blend:o.blend || 'source-over', label:o.label || ('Ícone — ' + name)});
  const minX = p.pathOffset.x - p.width/2, minY = p.pathOffset.y - p.height/2;
  p.set({left:x + minX*s, top:y + minY*s});
  if (o.angle){   // gira em torno do centro do próprio desenho
    p.set({originX:'center', originY:'center', left:x + size/2 + (minX + p.width/2 - 12)*s, top:y + size/2 + (minY + p.height/2 - 12)*s, angle:o.angle});
  }
  return p;
};
/* Barra de status de celular. style 'android' (ícones à direita, hora no fim) ou 'ios' (hora à esquerda). */
SC.statusBar = (kit, o)=>{
  const W = kit.W, y = o.y || 0, h = o.h || 72, fg = o.fg || '#ffffff', time = o.time || '04:19', ios = o.style === 'ios';
  if (o.bg) kit.rect({left:0, top:y, width:W, height:h, fill:o.bg, blend:'source-over', label:'Barra de status'});
  const fs = Math.round(h*0.40), cy = y + h/2;
  const tw = kit.measure(time, {font:o.font || 'Inter', size:fs, weight:ios ? 700 : 500});
  const icon = Math.round(h*0.34);
  let x = W - 28;
  // bateria
  const bw = Math.round(h*0.52), bh = Math.round(h*0.26);
  x -= bw; kit.rect({left:x, top:cy - bh/2, width:bw, height:bh, stroke:fg, sw:2.4, rx:4, opacity:0.95, blend:'source-over', label:'Bateria'});
  kit.rect({left:x + 4, top:cy - bh/2 + 4, width:(bw - 8)*0.62, height:bh - 8, fill:fg, rx:1.5, blend:'source-over', label:'Bateria (carga)'});
  kit.rect({left:x + bw + 1, top:cy - bh*0.2, width:4, height:bh*0.4, fill:fg, blend:'source-over', label:'Bateria (ponta)'});
  x -= 20 + icon; SC.icon(kit, 'wifi', x, cy - icon/2, icon, fg, {label:'Wi-Fi'});
  x -= 14 + icon; SC.icon(kit, 'signal', x, cy - icon/2, icon, fg, {label:'Sinal'});
  if (ios) kit.text(time, {left:46, top:cy - fs*0.6, width:200, font:o.font || 'Inter', weight:700, size:fs, fill:fg, lh:1.0, blend:'source-over', label:'Hora'});
  else kit.text(time, {left:x - 22 - tw - 8, top:cy - fs*0.6, width:tw + 16, font:o.font || 'Inter', weight:500, size:fs, fill:fg, align:'right', lh:1.0, blend:'source-over', label:'Hora'});
};
/* Relevo clássico do Windows 98: 4 filetes (claro em cima/esquerda, escuro embaixo/direita), por fora e por dentro.
   sunken = afundado (campos, listas). Devolve nada; só linhas. */
SC.bevel = (kit, x, y, w, h, sunken)=>{
  const L1 = sunken ? '#808080' : '#ffffff', D1 = sunken ? '#ffffff' : '#404040', L2 = sunken ? '#404040' : '#dfdfdf', D2 = sunken ? '#dfdfdf' : '#808080';
  const seg = (d, c, lab)=>kit.path(d, {left:0, top:0, fill:null, stroke:c, sw:2, blend:'source-over', label:lab || 'Relevo'});
  const line = (pts, c)=>{
    const d = 'M ' + pts.map(p=>p.join(' ')).join(' L ');
    const p = seg(d, c);
    const minX = Math.min(...pts.map(q=>q[0])), minY = Math.min(...pts.map(q=>q[1]));
    p.set({left:minX - 1, top:minY - 1});
    return p;
  };
  line([[x + 1, y + h - 1], [x + 1, y + 1], [x + w - 1, y + 1]], L1);
  line([[x + w - 1, y + 1], [x + w - 1, y + h - 1], [x + 1, y + h - 1]], D1);
  line([[x + 3, y + h - 3], [x + 3, y + 3], [x + w - 3, y + 3]], L2);
  line([[x + w - 3, y + 3], [x + w - 3, y + h - 3], [x + 3, y + h - 3]], D2);
};
/* Duas camadas de ticks do WhatsApp: 'sent' (um, cinza), 'delivered' (dois, cinza), 'read' (dois, azul). */
SC.ticks = (kit, state, x, y, size)=>{
  const col = state === 'read' ? '#34B7F1' : '#8e9a9f';
  SC.icon(kit, state === 'sent' ? 'done' : 'doneall', x, y, size, col, {label:'Ticks (' + state + ')'});
};
