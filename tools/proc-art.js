/* ===================== Arte procedural (cortina, madeira, moldura, ardósia, giz gasto) =====================
   Objeto `ProcArt`: desenha a textura NO TAMANHO em que for exibida/exportada (igual ao papel, paper-gen.js)
   e serializa só os parâmetros ({kind, seed, opts}) — nada de PNG enorme em cada passo do desfazer.
   Usado nos cardápios. kinds:
     curtain — cortina de veludo: dobras verticais, sombra no topo e no pé (opts: base [r,g,b])
     wood    — tábuas verticais com veios, nós e juntas (opts: base [r,g,b], plank, vig)
     frame   — moldura de madeira em esquadria (cantos a 45°), chanfro, sombra projetada pra dentro e parafusos
               (opts: t espessura, base [r,g,b]); o miolo fica transparente
     leather — couro de capa de caderno: manchas, grão pebble, arranhões, vinheta (opts: base [r,g,b])
     crt     — fundo de tela de tubo (brilho de fósforo, grão); scan — por cima do texto: linhas de varredura, vinheta, cantos do tubo
     doodle  — papel de parede de chat (rabiscos finos em tom sobre tom)
     card    — textura de cartão de plástico por cima (grão, brilho, riscos, dedos, desgaste, furo, cantos); holo — selo holográfico
     slate   — quadro-negro: degradê, borrões de apagador, riscos, grão (opts: base [r,g,b])
     erode   — camada de "giz gasto" POR CIMA do texto: falhas minúsculas na cor do quadro (opts: color [r,g,b], density)
   Tudo em unidades de página, então tem o mesmo tamanho físico em ×1 e ×2. Mesma semente = mesma textura.
   Depende de: fabric, mulberry32 (handwriting.js). */

function _paRng(seed){ return mulberry32((seed >>> 0) || 1); }

/* Grão por pixel do dispositivo (xorshift): amp em níveis de cor. Roda uma vez por tamanho (tem cache). */
function _paGrain(g, seed, amp){
  const W = g.canvas.width, H = g.canvas.height;
  const id = g.getImageData(0, 0, W, H), d = id.data;
  let x = ((seed*2654435761) >>> 0) || 1;
  for (let i = 0; i < d.length; i += 4){
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    const n = ((x & 255) - 128)*amp;
    d[i] += n; d[i+1] += n; d[i+2] += n;
  }
  g.putImageData(id, 0, 0);
}

function procWood(g, w, h, a){
  const rng = _paRng(a.seed*7 + 1), o = a.opts || {}, pw = o.plank || 110, base = o.base || [150,100,58];
  const n = Math.ceil(w/pw);
  for (let i = 0; i < n; i++){
    const x0 = i*pw, tone = (rng() - 0.5)*36;
    const c = base.map(v=>Math.max(0, Math.min(255, v + tone)));
    g.fillStyle = `rgb(${c[0]|0},${c[1]|0},${c[2]|0})`; g.fillRect(x0, 0, pw, h);
    const lines = Math.max(18, Math.round(64*Math.min(1, pw/110) + 16));
    for (let k = 0; k < lines; k++){
      const gx = x0 + rng()*pw, amp = 1 + rng()*4, fr = 0.002 + rng()*0.006, ph = rng()*6.28, dark = rng() < 0.65;
      g.strokeStyle = dark ? `rgba(58,32,12,${0.05 + rng()*0.15})` : `rgba(235,195,135,${0.04 + rng()*0.09})`;
      g.lineWidth = 0.6 + rng()*1.7;
      g.beginPath();
      for (let y = 0; y <= h; y += 16){ const x = gx + Math.sin(y*fr + ph)*amp + Math.sin(y*0.0007 + i)*6; if (y) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
    const nk = rng() < 0.85 ? 1 + ((rng()*2)|0) : 0;
    for (let k = 0; k < nk; k++){
      const kx = x0 + pw*(0.25 + rng()*0.5), ky = rng()*h, kr = 9 + rng()*15;
      for (let r = kr; r > 2; r -= 3){ g.strokeStyle = `rgba(50,28,10,${0.16 + (kr - r)/kr*0.3})`; g.lineWidth = 1.3; g.beginPath(); g.ellipse(kx, ky, r*0.62, r*1.5, 0, 0, 6.28); g.stroke(); }
      g.fillStyle = 'rgba(38,20,7,0.55)'; g.beginPath(); g.ellipse(kx, ky, 3, 6.5, 0, 0, 6.28); g.fill();
    }
    g.fillStyle = 'rgba(18,9,3,0.78)'; g.fillRect(x0, 0, 3, h);
    g.fillStyle = 'rgba(255,230,190,0.09)'; g.fillRect(x0 + 3, 0, 1.6, h);
  }
  if (o.vig !== 0){
    const v = g.createRadialGradient(w/2, h/2, Math.min(w, h)*0.3, w/2, h/2, Math.max(w, h)*0.78);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${o.vig != null ? o.vig : 0.4})`);
    g.fillStyle = v; g.fillRect(0, 0, w, h);
  }
}

function procCurtain(g, w, h, a, q){
  const rng = _paRng(a.seed*17 + 9), o = a.opts || {}, b = o.base || [104,12,18];
  g.fillStyle = `rgb(${b[0]},${b[1]},${b[2]})`; g.fillRect(0, 0, w, h);
  let x = -20;
  while (x < w){
    const fw = 46 + rng()*66, amp = 0.65 + rng()*0.55, sway = (rng() - 0.5)*18;
    const gr = g.createLinearGradient(x, 0, x + fw, 0);
    gr.addColorStop(0,    `rgba(0,0,0,${0.44*amp})`);
    gr.addColorStop(0.30, `rgba(0,0,0,${0.10*amp})`);
    gr.addColorStop(0.58, `rgba(255,92,80,${0.19*amp})`);
    gr.addColorStop(0.80, `rgba(0,0,0,${0.12*amp})`);
    gr.addColorStop(1,    `rgba(0,0,0,${0.48*amp})`);
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + fw, 0); g.lineTo(x + fw + sway, h); g.lineTo(x + sway, h); g.closePath(); g.fill();
    x += fw;
  }
  const top = g.createLinearGradient(0, 0, 0, h);
  top.addColorStop(0, 'rgba(0,0,0,0.55)'); top.addColorStop(0.16, 'rgba(0,0,0,0.10)'); top.addColorStop(0.5, 'rgba(0,0,0,0)');
  top.addColorStop(0.86, 'rgba(0,0,0,0.12)'); top.addColorStop(1, 'rgba(0,0,0,0.5)');
  g.fillStyle = top; g.fillRect(0, 0, w, h);
}

function procFrame(g, w, h, a){
  const o = a.opts || {}, t = o.t || 64, base = o.base || [138,90,50];
  const sides = [
    {poly:[[0,0],[w,0],[w-t,t],[t,t]],         box:[0,0,w,t],     rot:true},
    {poly:[[0,h],[w,h],[w-t,h-t],[t,h-t]],     box:[0,h-t,w,t],   rot:true},
    {poly:[[0,0],[t,t],[t,h-t],[0,h]],         box:[0,0,t,h],     rot:false},
    {poly:[[w,0],[w-t,t],[w-t,h-t],[w,h]],     box:[w-t,0,t,h],   rot:false},
  ];
  // sombra projetada no miolo (luz vindo de cima e da esquerda)
  const sh = (x0, y0, x1, y1, rx, ry, rw, rh, al)=>{
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, `rgba(0,0,0,${al})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(rx, ry, rw, rh);
  };
  const S = 34;
  sh(0, t, 0, t + S, t, t, w - 2*t, S, 0.62);
  sh(t, 0, t + S, 0, t, t, S, h - 2*t, 0.5);
  sh(0, h - t, 0, h - t - S*0.6, t, h - t - S*0.6, w - 2*t, S*0.6, 0.26);
  sh(w - t, 0, w - t - S*0.6, 0, w - t - S*0.6, t, S*0.6, h - 2*t, 0.22);
  sides.forEach((s, i)=>{
    g.save();
    g.beginPath(); s.poly.forEach(([x, y], k)=>k ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip();
    const [bx, by, bw, bh] = s.box;
    g.translate(bx, by);
    const wa = {seed: a.seed*5 + i + 1, opts: {base, plank: s.rot ? bh : bw, vig: 0}};
    if (s.rot){ g.translate(bw, 0); g.rotate(Math.PI/2); procWood(g, bh, bw, wa); }
    else procWood(g, bw, bh, wa);
    g.restore();
  });
  // chanfro do lado de dentro: topo e esquerda no escuro, base e direita iluminados
  const bev = 7;
  g.fillStyle = 'rgba(0,0,0,0.34)';  g.fillRect(t, t - bev, w - 2*t, bev); g.fillRect(t - bev, t, bev, h - 2*t);
  g.fillStyle = 'rgba(255,226,180,0.30)'; g.fillRect(t, h - t, w - 2*t, bev); g.fillRect(w - t, t, bev, h - 2*t);
  // esquadria nos quatro cantos
  [[0,0,t,t],[w,0,w-t,t],[0,h,t,h-t],[w,h,w-t,h-t]].forEach(([x0, y0, x1, y1])=>{
    g.strokeStyle = 'rgba(14,7,2,0.85)'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.strokeStyle = 'rgba(255,230,190,0.16)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + 2, y0); g.lineTo(x1 + 2, y1); g.stroke();
  });
  // parafusos nos cantos
  const r = Math.max(4, t*0.11), m = t*0.5;
  [[m, m],[w - m, m],[m, h - m],[w - m, h - m]].forEach(([cx, cy], i)=>{
    const rg = g.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
    rg.addColorStop(0, '#c9b58d'); rg.addColorStop(1, '#4a3b22');
    g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, r, 0, 6.28); g.fill();
    g.strokeStyle = 'rgba(20,12,4,0.8)'; g.lineWidth = 1.4; g.beginPath(); g.arc(cx, cy, r, 0, 6.28); g.stroke();
    const an = i*0.9 + 0.4;
    g.lineWidth = 1.8; g.beginPath(); g.moveTo(cx - Math.cos(an)*r*0.7, cy - Math.sin(an)*r*0.7); g.lineTo(cx + Math.cos(an)*r*0.7, cy + Math.sin(an)*r*0.7); g.stroke();
  });
}

function procLeather(g, w, h, a){
  const rng = _paRng(a.seed*31 + 7), o = a.opts || {}, b = o.base || [64,26,22];
  g.fillStyle = `rgb(${b[0]},${b[1]},${b[2]})`; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++){   // manchas largas: o couro nunca tem a mesma cor em toda parte
    const x = rng()*w, y = rng()*h, r = 140 + rng()*360, rg = g.createRadialGradient(x, y, 0, x, y, r), dark = rng() < 0.55;
    rg.addColorStop(0, dark ? 'rgba(0,0,0,0.20)' : 'rgba(255,170,140,0.10)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(x - r, y - r, r*2, r*2);
  }
  const N = Math.round(w*h/150);   // grão "pebble": pontos claros e escuros pequenos
  for (let i = 0; i < N; i++){
    const x = rng()*w, y = rng()*h, r = 0.9 + rng()*1.9, dark = rng() < 0.6;
    g.fillStyle = dark ? `rgba(10,2,0,${0.18 + rng()*0.28})` : `rgba(255,190,160,${0.05 + rng()*0.10})`;
    g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill();
  }
  for (let i = 0; i < 14; i++){   // arranhões
    g.strokeStyle = `rgba(255,200,170,${0.05 + rng()*0.08})`; g.lineWidth = 0.8 + rng()*1.4;
    const x = rng()*w, y = rng()*h, l = 60 + rng()*240, an = rng()*6.28;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an)*l, y + Math.sin(an)*l); g.stroke();
  }
  const v = g.createRadialGradient(w/2, h/2, Math.min(w, h)*0.35, w/2, h/2, Math.max(w, h)*0.72);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
}

/* Tela de CRT (fundo): preto esverdeado com brilho de fósforo no centro e grão fino. opts.tint = cor do fósforo [r,g,b]. */
function procCrt(g, w, h, a){
  const o = a.opts || {}, t = o.tint || [60,255,100];
  g.fillStyle = `rgb(${Math.round(t[0]*0.018 + 3)},${Math.round(t[1]*0.034 + 4)},${Math.round(t[2]*0.026 + 4)})`; g.fillRect(0, 0, w, h);
  const rg = g.createRadialGradient(w*0.5, h*0.46, Math.min(w, h)*0.05, w*0.5, h*0.5, Math.max(w, h)*0.72);
  rg.addColorStop(0, `rgba(${t[0]},${t[1]},${t[2]},0.12)`); rg.addColorStop(0.55, `rgba(${t[0]},${t[1]},${t[2]},0.045)`); rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg; g.fillRect(0, 0, w, h);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); _paGrain(g, a.seed + 21, 0.05); g.restore();
}
/* Por cima do texto da tela: linhas de varredura, faixas largas de brilho, vinheta e os cantos do tubo em preto.
   opts: tint, line (período das linhas em unidades de página), corner (raio do canto), vig (0–1). Não rouba clique. */
function procScan(g, w, h, a){
  const rng = _paRng(a.seed*37 + 11), o = a.opts || {}, t = o.tint || [60,255,100], per = o.line || 3.4, vig = o.vig != null ? o.vig : 0.55, cr = o.corner != null ? o.corner : 64;
  g.fillStyle = 'rgba(0,0,0,0.20)';
  for (let y = 0; y < h; y += per) g.fillRect(0, y, w, per*0.42);
  for (let i = 0; i < 2; i++){   // faixas largas de brilho (barra de atualização do tubo)
    const y = rng()*h, bh = 160 + rng()*220, gr = g.createLinearGradient(0, y, 0, y + bh);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(${t[0]},${t[1]},${t[2]},0.035)`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, y, w, bh);
  }
  const v = g.createRadialGradient(w/2, h/2, Math.min(w, h)*0.36, w/2, h/2, Math.max(w, h)*0.76);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${vig})`);
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  if (cr > 0){   // cantos arredondados do tubo: tudo fora do retângulo arredondado fica preto
    g.save(); g.beginPath(); g.rect(0, 0, w, h);
    const r = cr, x0 = 0, y0 = 0, x1 = w, y1 = h;
    g.moveTo(x0 + r, y0); g.arcTo(x0, y0, x0, y0 + r, r); g.lineTo(x0, y1 - r); g.arcTo(x0, y1, x0 + r, y1, r);
    g.lineTo(x1 - r, y1); g.arcTo(x1, y1, x1, y1 - r, r); g.lineTo(x1, y0 + r); g.arcTo(x1, y0, x1 - r, y0, r); g.closePath();
    g.fillStyle = '#000'; g.fill('evenodd'); g.restore();
  }
}
/* Papel de parede do chat (rabiscos finos em tom sobre tom). opts: bg [r,g,b], ink [r,g,b], cell (lado da célula). */
function procDoodle(g, w, h, a){
  const rng = _paRng(a.seed*41 + 5), o = a.opts || {}, bg = o.bg || [229,221,213], ink = o.ink || [203,194,184], cell = o.cell || 150;
  g.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`; g.fillRect(0, 0, w, h);
  g.strokeStyle = `rgb(${ink[0]},${ink[1]},${ink[2]})`; g.fillStyle = g.strokeStyle; g.lineWidth = 3.2; g.lineCap = 'round'; g.lineJoin = 'round';
  const shapes = [
    (s)=>{ g.beginPath(); g.arc(0, 0, s*0.42, 0, 6.28); g.stroke(); },                                                       // círculo
    (s)=>{ g.beginPath(); for (let i = 0; i < 10; i++){ const an = -Math.PI/2 + i*Math.PI/5, r = i%2 ? s*0.2 : s*0.46; g.lineTo(Math.cos(an)*r, Math.sin(an)*r); } g.closePath(); g.stroke(); },   // estrela
    (s)=>{ g.beginPath(); g.moveTo(0, s*0.34); g.bezierCurveTo(-s*0.62, -s*0.1, -s*0.28, -s*0.5, 0, -s*0.16); g.bezierCurveTo(s*0.28, -s*0.5, s*0.62, -s*0.1, 0, s*0.34); g.stroke(); },    // coração
    (s)=>{ g.beginPath(); g.moveTo(-s*0.46, s*0.1); g.quadraticCurveTo(-s*0.23, -s*0.3, 0, s*0.1); g.quadraticCurveTo(s*0.23, s*0.5, s*0.46, s*0.1); g.stroke(); },                         // onda
    (s)=>{ g.beginPath(); g.moveTo(-s*0.44, s*0.28); g.lineTo(s*0.46, 0); g.lineTo(-s*0.44, -s*0.3); g.lineTo(-s*0.3, 0); g.closePath(); g.stroke(); },                                  // avião de papel
    (s)=>{ for (let i = 0; i < 5; i++){ g.save(); g.rotate(i*Math.PI*2/5); g.beginPath(); g.ellipse(0, -s*0.26, s*0.1, s*0.17, 0, 0, 6.28); g.stroke(); g.restore(); } },                // flor
    (s)=>{ g.beginPath(); g.moveTo(-s*0.3, 0); g.lineTo(s*0.3, 0); g.moveTo(0, -s*0.3); g.lineTo(0, s*0.3); g.stroke(); },                                                              // cruz
    (s)=>{ g.beginPath(); g.moveTo(-s*0.4, s*0.2); g.quadraticCurveTo(-s*0.5, -s*0.1, -s*0.15, -s*0.15); g.quadraticCurveTo(0, -s*0.5, s*0.2, -s*0.2); g.quadraticCurveTo(s*0.5, -s*0.2, s*0.4, s*0.2); g.closePath(); g.stroke(); }, // nuvem
  ];
  for (let gy = 0, row = 0; gy < h + cell; gy += cell*0.86, row++){
    for (let gx = (row%2)*cell*0.5; gx < w + cell; gx += cell){
      const s = cell*(0.34 + rng()*0.12), x = gx + (rng() - 0.5)*cell*0.35, y = gy + (rng() - 0.5)*cell*0.3;
      g.save(); g.translate(x, y); g.rotate((rng() - 0.5)*1.4); shapes[(rng()*shapes.length)|0](s); g.restore();
    }
  }
}

/* Textura de cartão de plástico (POR CIMA de tudo, não rouba clique): grão fino, faixa de brilho do laminado, riscos,
   marcas de dedo, desgaste de borda e sujeira embaixo, furo de cordão e cantos arredondados (fora do cartão fica branco,
   que é a cor da página). opts: gloss, scratch, grain, wear, smudge (0–1), slot (furo), corner (raio em px). */
function procCard(g, w, h, a){
  const o = a.opts || {}, rng = _paRng(a.seed*53 + 9);
  const gloss = o.gloss != null ? o.gloss : 0.5, scr = o.scratch != null ? o.scratch : 0.5, gr = o.grain != null ? o.grain : 0.5;
  const wear = o.wear != null ? o.wear : 0.4, sm = o.smudge != null ? o.smudge : 0.4, cr = o.corner != null ? o.corner : 32;
  // grão (ruído com alfa, no tamanho do dispositivo)
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const W = g.canvas.width, H = g.canvas.height, id = g.createImageData(W, H), d = id.data;
  let x = ((a.seed*2654435761) >>> 0) || 1;
  for (let i = 0; i < d.length; i += 4){
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    const n = (x & 255) - 128; d[i] = d[i+1] = d[i+2] = n > 0 ? 255 : 0; d[i+3] = Math.min(255, Math.abs(n)*0.2*gr);
  }
  g.putImageData(id, 0, 0); g.restore();
  // faixas de brilho do laminado
  const sh = g.createLinearGradient(0, h*0.05, w*0.92, h*0.98);
  [[0, 0], [0.30, 0], [0.40, 0.17*gloss], [0.47, 0.04*gloss], [0.53, 0.10*gloss], [0.64, 0], [0.82, 0.05*gloss], [0.90, 0]].forEach(([p, al])=>sh.addColorStop(p, `rgba(255,255,255,${al})`));
  g.fillStyle = sh; g.fillRect(0, 0, w, h);
  // riscos finos (claros e escuros), mais densos perto das bordas
  g.lineCap = 'round';
  const N = Math.round(46*scr);
  for (let i = 0; i < N; i++){
    const edge = rng() < 0.4, sx = edge ? (rng() < 0.5 ? rng()*w*0.12 : w - rng()*w*0.12) : rng()*w, sy = rng()*h, l = 20 + rng()*rng()*210, an = -0.5 + rng()*1.0 + (rng() < 0.3 ? 1.57 : 0);
    const light = rng() < 0.62;
    g.strokeStyle = light ? `rgba(255,255,255,${0.06 + rng()*0.20})` : `rgba(0,0,0,${0.05 + rng()*0.16})`; g.lineWidth = 0.5 + rng()*1.1;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(an)*l, sy + Math.sin(an)*l); g.stroke();
  }
  // marcas de dedo: anéis de elipse incompletos
  for (let k = 0; k < 2; k++){
    const cx = w*(k ? 0.72 : 0.30) + (rng() - 0.5)*60, cy = h*(k ? 0.36 : 0.74) + (rng() - 0.5)*40, rot = rng()*3.14;
    for (let i = 0; i < 16; i++){
      const rx = 5 + i*3.3, ry = 7 + i*4.2, a0 = rng()*6.28, ln = 1.6 + rng()*2.6;
      g.strokeStyle = `rgba(255,255,255,${(0.035 + rng()*0.05)*sm*2})`; g.lineWidth = 1.5 + rng()*1.2;
      g.beginPath(); g.ellipse(cx, cy, rx, ry, rot, a0, a0 + ln); g.stroke();
    }
  }
  // sujeira embaixo e desgaste de borda
  const gr2 = g.createLinearGradient(0, h*0.78, 0, h);
  gr2.addColorStop(0, 'rgba(40,30,20,0)'); gr2.addColorStop(1, `rgba(40,30,20,${0.16*wear})`);
  g.fillStyle = gr2; g.fillRect(0, h*0.78, w, h*0.22);
  const rrp = (inset, r)=>{ g.beginPath(); g.moveTo(inset + r, inset); g.arcTo(w - inset, inset, w - inset, h - inset, r); g.arcTo(w - inset, h - inset, inset, h - inset, r); g.arcTo(inset, h - inset, inset, inset, r); g.arcTo(inset, inset, w - inset, inset, r); g.closePath(); };
  rrp(3, cr); g.strokeStyle = `rgba(255,255,255,${0.16*wear + 0.05})`; g.lineWidth = 5; g.stroke();
  rrp(1.5, cr); g.strokeStyle = `rgba(0,0,0,${0.22*wear + 0.06})`; g.lineWidth = 3; g.stroke();
  for (let i = 0; i < Math.round(18*wear); i++){   // lascas nas bordas
    const side = (rng()*4)|0, t = rng(), px = side < 2 ? t*w : (side === 2 ? 2 : w - 2), py = side < 2 ? (side === 0 ? 2 : h - 2) : t*h, r = 1 + rng()*3.2;
    g.fillStyle = `rgba(255,255,255,${0.22 + rng()*0.3})`; g.beginPath(); g.arc(px, py, r, 0, 6.28); g.fill();
  }
  // furo do cordão
  if (o.slot !== false){
    const sw = 104, sh2 = 20, sx = w/2 - sw/2, sy = 18;
    g.beginPath(); g.roundRect ? g.roundRect(sx - 3, sy - 3, sw + 6, sh2 + 6, (sh2 + 6)/2) : g.rect(sx - 3, sy - 3, sw + 6, sh2 + 6);
    g.fillStyle = 'rgba(0,0,0,0.38)'; g.fill();
    g.beginPath(); g.roundRect ? g.roundRect(sx, sy, sw, sh2, sh2/2) : g.rect(sx, sy, sw, sh2);
    g.fillStyle = '#ffffff'; g.fill();
  }
  // cantos arredondados: o que fica fora do cartão é a cor da página
  if (cr > 0){
    g.save(); g.beginPath(); g.rect(0, 0, w, h);
    g.moveTo(cr, 0); g.arcTo(0, 0, 0, cr, cr); g.lineTo(0, h - cr); g.arcTo(0, h, cr, h, cr); g.lineTo(w - cr, h); g.arcTo(w, h, w, h - cr, cr); g.lineTo(w, cr); g.arcTo(w, 0, w - cr, 0, cr); g.closePath();
    g.fillStyle = '#ffffff'; g.fill('evenodd'); g.restore();
  }
}
/* Selo holográfico (adesivo de segurança): degradê arco-íris, anéis, hachura diagonal e brilho. opts.hue gira as cores. */
function procHolo(g, w, h, a){
  const rng = _paRng(a.seed*61 + 3), o = a.opts || {}, hue = o.hue || 0, r = Math.min(w, h)*0.14;
  g.save();
  g.beginPath(); g.moveTo(r, 0); g.arcTo(w, 0, w, h, r); g.arcTo(w, h, 0, h, r); g.arcTo(0, h, 0, 0, r); g.arcTo(0, 0, w, 0, r); g.closePath(); g.clip();
  const gr = g.createLinearGradient(0, h, w, 0);
  [[0, 300], [0.22, 200], [0.42, 140], [0.6, 55], [0.8, 20], [1, 320]].forEach(([p, hh])=>gr.addColorStop(p, `hsla(${(hh + hue)%360},85%,66%,0.94)`));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.30)'; g.lineWidth = 1.4;
  for (let i = 1; i < 9; i++){ g.beginPath(); g.arc(w*0.5, h*0.5, i*Math.min(w, h)*0.07, 0, 6.28); g.stroke(); }
  g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 1;
  for (let x = -h; x < w; x += 7){ g.beginPath(); g.moveTo(x, h); g.lineTo(x + h, 0); g.stroke(); }
  for (let i = 0; i < 14; i++){ g.fillStyle = `rgba(255,255,255,${0.35 + rng()*0.4})`; g.beginPath(); g.arc(rng()*w, rng()*h, 0.8 + rng()*2, 0, 6.28); g.fill(); }
  const hl = g.createRadialGradient(w*0.3, h*0.25, 0, w*0.3, h*0.25, Math.max(w, h)*0.7);
  hl.addColorStop(0, 'rgba(255,255,255,0.45)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hl; g.fillRect(0, 0, w, h);
  g.restore();
  g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(r, 1.2); g.arcTo(w - 1.2, 1.2, w - 1.2, h - 1.2, r); g.arcTo(w - 1.2, h - 1.2, 1.2, h - 1.2, r); g.arcTo(1.2, h - 1.2, 1.2, 1.2, r); g.arcTo(1.2, 1.2, w - 1.2, 1.2, r); g.closePath(); g.stroke();
}

function procSlate(g, w, h, a, q){
  const rng = _paRng(a.seed*13 + 5), o = a.opts || {}, b = o.base || [34,46,41];
  const gr = g.createLinearGradient(0, 0, w*0.4, h);
  gr.addColorStop(0, `rgb(${b[0]+10},${b[1]+10},${b[2]+9})`); gr.addColorStop(1, `rgb(${b[0]-8},${b[1]-10},${b[2]-10})`);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // borrões de apagador: arcos largos e fracos desenhados em 1/8 da resolução e esticados (já saem macios, sem blur caro)
  const K = 8, sm = document.createElement('canvas');
  sm.width = Math.ceil(w/K) + 2; sm.height = Math.ceil(h/K) + 2;
  const sg = sm.getContext('2d'); sg.scale(1/K, 1/K); sg.lineCap = 'round';
  for (let i = 0; i < 16; i++){
    sg.strokeStyle = `rgba(235,235,225,${0.02 + rng()*0.035})`; sg.lineWidth = 50 + rng()*100;
    const cx = rng()*w, cy = rng()*h, r = 200 + rng()*500, a0 = rng()*6.28;
    sg.beginPath(); sg.arc(cx, cy, r, a0, a0 + 0.5 + rng()*0.9); sg.stroke();
  }
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(sm, 0, 0, sm.width*K, sm.height*K);
  g.lineCap = 'round';
  for (let i = 0; i < 120; i++){   // riscos finos de giz antigo
    g.strokeStyle = `rgba(230,230,220,${0.02 + rng()*0.04})`; g.lineWidth = 1 + rng()*2;
    const x = rng()*w, y = rng()*h, l = 30 + rng()*160, an = rng()*6.28;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an)*l, y + Math.sin(an)*l); g.stroke();
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); _paGrain(g, a.seed + 11, 0.06); g.restore();
}

function procErode(g, w, h, a){
  const rng = _paRng(a.seed*29 + 3), o = a.opts || {}, c = (o.color || [34,46,41]).join(','), dens = o.density != null ? o.density : 0.0062;
  const N = Math.round(w*h*dens);
  for (let i = 0; i < N; i++){
    const x = rng()*w, y = rng()*h, r = 0.5 + rng()*rng()*1.5;
    g.fillStyle = `rgba(${c},${0.45 + rng()*0.5})`; g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill();
  }
  for (let i = 0; i < Math.round(w*h/9000); i++){
    g.strokeStyle = `rgba(${c},${0.4 + rng()*0.5})`; g.lineWidth = 0.6 + rng()*1.4;
    const x = rng()*w, y = rng()*h, l = 10 + rng()*70, an = -0.6 + rng()*1.2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an)*l, y + Math.sin(an)*l); g.stroke();
  }
}

/* Cache por tamanho/escala, limitado em pixels (uma página em ×2 já pesa ~35 MB). */
const PROC_ART_CACHE = new Map();
let _procArtPx = 0;
function procArtCanvas(a, w, h, q){
  const key = [a.kind, a.seed, JSON.stringify(a.opts || {}), w, h, q].join('|');
  if (PROC_ART_CACHE.has(key)){ const v = PROC_ART_CACHE.get(key); PROC_ART_CACHE.delete(key); PROC_ART_CACHE.set(key, v); return v; }
  const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w*q)); cv.height = Math.max(1, Math.round(h*q));
  const g = cv.getContext('2d');
  g.scale(q, q);
  if (a.kind === 'wood') procWood(g, w, h, a);
  else if (a.kind === 'curtain') procCurtain(g, w, h, a, q);
  else if (a.kind === 'frame') procFrame(g, w, h, a);
  else if (a.kind === 'slate') procSlate(g, w, h, a, q);
  else if (a.kind === 'leather') procLeather(g, w, h, a);
  else if (a.kind === 'crt') procCrt(g, w, h, a);
  else if (a.kind === 'scan') procScan(g, w, h, a);
  else if (a.kind === 'doodle') procDoodle(g, w, h, a);
  else if (a.kind === 'card') procCard(g, w, h, a);
  else if (a.kind === 'holo') procHolo(g, w, h, a);
  else if (a.kind === 'erode') procErode(g, w, h, a);
  PROC_ART_CACHE.set(key, cv); _procArtPx += cv.width*cv.height;
  while (_procArtPx > 60e6 && PROC_ART_CACHE.size > 1){
    const k = PROC_ART_CACHE.keys().next().value, old = PROC_ART_CACHE.get(k);
    _procArtPx -= old.width*old.height; PROC_ART_CACHE.delete(k);
  }
  return cv;
}
class ProcArt extends fabric.Rect {
  static type = 'ProcArt';
  constructor(options){
    options = options || {};
    const art = Object.assign({kind:'wood', seed:1, opts:{}}, options.art);
    // giz gasto fica POR CIMA do texto: não pode roubar o clique (evented:false volta sozinho depois do desfazer)
    super(Object.assign({fill:'#000000', objectCaching:false, strokeWidth:0}, options, {art}, (art.kind === 'erode' || art.kind === 'scan' || art.kind === 'card') ? {evented:false} : {}));
  }
  _render(ctx){
    const W = this.width, H = this.height, t = ctx.getTransform(), s = Math.hypot(t.a, t.b) || 1;
    const q = s <= 0.6 ? 0.5 : (s <= 1.25 ? 1 : 2);
    ctx.drawImage(procArtCanvas(this.art, W, H, q), -W/2, -H/2, W, H);
  }
  toObject(props){ return Object.assign(super.toObject(props), {art: JSON.parse(JSON.stringify(this.art))}); }
}
fabric.classRegistry.setClass(ProcArt, 'ProcArt');
