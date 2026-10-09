/* ===================== Arte procedural (cortina, madeira, moldura, ardósia, giz gasto) =====================
   Objeto `ProcArt`: desenha a textura NO TAMANHO em que for exibida/exportada (igual ao papel, paper-gen.js)
   e serializa só os parâmetros ({kind, seed, opts}) — nada de PNG enorme em cada passo do desfazer.
   Usado nos cardápios. kinds:
     curtain — cortina de veludo: dobras verticais, sombra no topo e no pé (opts: base [r,g,b])
     wood    — tábuas verticais com veios, nós e juntas (opts: base [r,g,b], plank, vig)
     frame   — moldura de madeira em esquadria (cantos a 45°), chanfro, sombra projetada pra dentro e parafusos
               (opts: t espessura, base [r,g,b]); o miolo fica transparente
     leather — couro de capa de caderno: manchas, grão pebble, arranhões, vinheta (opts: base [r,g,b])
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
    super(Object.assign({fill:'#000000', objectCaching:false, strokeWidth:0}, options, {art}, art.kind === 'erode' ? {evented:false} : {}));
  }
  _render(ctx){
    const W = this.width, H = this.height, t = ctx.getTransform(), s = Math.hypot(t.a, t.b) || 1;
    const q = s <= 0.6 ? 0.5 : (s <= 1.25 ? 1 : 2);
    ctx.drawImage(procArtCanvas(this.art, W, H, q), -W/2, -H/2, W, H);
  }
  toObject(props){ return Object.assign(super.toObject(props), {art: JSON.parse(JSON.stringify(this.art))}); }
}
fabric.classRegistry.setClass(ProcArt, 'ProcArt');
