/* ===================== Emblemas: logo da plataforma (Ødemark A.) =====================
   Objeto `Emblem` (Rect quadrado): desenha o vetor no tamanho em que for exibido/exportado (nítido em qualquer zoom e
   em ×2/×3), guarda em cache por escala e serializa só os parâmetros `em:{kind, variant, color, accent, seed, wear}`.
   Foi feito pra ser INSERIDO onde o Max quiser (aba Adicionar → Emblemas) e pra servir de timbre/marca d'água dos modelos.

   Famílias (`em.kind`):
     plataforma — selo redondo "ØDEMARK A — MØRKETID" com a plataforma, a estrela de quatro pontas e "NOV — APR"
     mono       — roundel "Ø.A"
     icone      — só a plataforma com a estrela (sem anéis nem texto)
     abeto      — abeto. NÃO é logo da plataforma: é peça do próximo RPG, mantida só como objeto inserível.
   Versões (`em.variant`), todas VETORIAIS e limpas, sem a textura bordada do patch:
     cor       — as cores do patch (azul-marinho, laranja, creme, amarelo)
     tinta     — uma cor só, só traço (papel timbrado, marca d'água); cor em `em.color`
     negativo  — disco cheio com o desenho vazado (o papel aparece pelos vazados)
     selo      — carimbo de borracha: tinta de uma cor com desgaste (`em.wear` 0–1, `em.seed` muda o desgaste)
     relevo    — relevo seco (sem tinta): só luz e sombra nas bordas, como papel gravado
     ouro      — folha de ouro (capa de caderno, couro)
   Geometria em unidades onde o raio externo do selo = 500 (medida sobre o desenho vetorial original).
   Depende de: fabric, mulberry32 (handwriting.js), docLum (doc-kit.js, só em tempo de uso). */

const EM_FONTS = ["700 20px 'Barlow Condensed'", "500 20px 'Barlow Condensed'", "400 20px 'Barlow Condensed'"];
const EM_KINDS = {plataforma:'Selo Ødemark A. — Mørketid', mono:'Roundel Ø.A', icone:'Plataforma (só o desenho)', abeto:'Abeto (peça do próximo RPG)'};
const EM_VARIANTS = {cor:'Cor (azul, laranja, creme)', tinta:'Tinta (uma cor)', negativo:'Negativo (disco cheio)', selo:'Carimbo de borracha (gasto)', relevo:'Relevo seco (sem tinta)', ouro:'Folha de ouro'};
const EM_PAL = {
  cor:  {disc:'#141b30', ring:'#e5601d', base:'#e5601d', text:'#efe6cb', rig:'#efe6cb', star:'#f1c232', sub:'#f1c232', dots:'#efe6cb', monoRing:'#e6ae0a', monoDisc:'#131a1a', monoText:'#f3f1ea', fir:'#2f4a35'},
};
const EM_INK = '#1b1a18';

function emFontsReady(){
  try { return document.fonts.check("700 20px 'Barlow Condensed'") && document.fonts.check("500 20px 'Barlow Condensed'") && document.fonts.check("400 20px 'Barlow Condensed'"); }
  catch (e){ return true; }
}

/* Texto em arco. top=true: lê da esquerda pra direita pela parte de CIMA (topo das letras pra fora); false: pela de BAIXO
   (topo das letras pra dentro). `radius` é o raio da linha de base; `span` o ângulo total (rad); o espaçamento entre letras
   é calculado pra o texto ocupar exatamente esse ângulo. */
function emArcText(g, str, radius, span, px, weight, color, top){
  g.save();
  g.font = `${weight} ${px}px 'Barlow Condensed'`; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const chars = [...str], w = chars.map(c=>g.measureText(c).width), total = w.reduce((a, b)=>a + b, 0);
  const track = chars.length > 1 ? (radius*span - total)/(chars.length - 1) : 0;
  let cum = 0;
  chars.forEach((c, i)=>{
    const mid = cum + w[i]/2; cum += w[i] + track;
    const off = mid/radius - span/2;                       // ângulo em relação ao centro do arco
    g.save();
    if (top){ const th = -Math.PI/2 + off; g.rotate(th + Math.PI/2); g.translate(0, -radius); }
    else { const th = Math.PI/2 - off; g.rotate(th - Math.PI/2); g.translate(0, radius); }
    g.fillText(c, 0, 0);
    g.restore();
  });
  g.restore();
}
function emStar(g, cx, cy, ro, ri, color){
  g.fillStyle = color; g.beginPath();
  for (let i = 0; i < 8; i++){ const a = -Math.PI/2 + i*Math.PI/4, r = i%2 ? ri : ro; g.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r); }
  g.closePath(); g.fill();
}
/* A plataforma: torre em A, convés oco, braço do flare, quatro pernas e a linha d'água. P = {rig, star, base}. */
function emRig(g, P, withStar){
  if (withStar !== false) emStar(g, 0, -230.5, 86, 24, P.star);
  g.strokeStyle = P.rig; g.fillStyle = P.rig; g.lineCap = 'butt'; g.lineJoin = 'miter';
  // pernas
  g.lineWidth = 17.6;
  [[-124.4, -164.8], [-62.2, -78.2], [62.2, 78.7], [126.9, 164.8]].forEach(([x0, x1])=>{ g.beginPath(); g.moveTo(x0, 84.5); g.lineTo(x1, 248.7); g.stroke(); });
  // torre
  g.lineWidth = 15.5;
  g.beginPath(); g.moveTo(-9.3, -160.6); g.lineTo(-50.3, 38.9); g.moveTo(9.3, -160.6); g.lineTo(50.3, 38.9); g.stroke();
  g.fillRect(-18.6, -161, 37.2, 15);
  g.fillRect(-28.5, -104.7, 57, 17.6); g.fillRect(-38.8, -50.3, 77.6, 17.6);
  // convés
  g.lineWidth = 17.6; g.strokeRect(-155.5, 31.1, 311.5, 44.6);
  // braço
  g.lineWidth = 15.5; g.beginPath(); g.moveTo(164.8, 38.9); g.lineTo(274.6, -23.3); g.stroke();
  // linha d'água (por cima das pernas)
  g.strokeStyle = P.base; g.lineWidth = 14.5; g.beginPath(); g.moveTo(-180, 230.5); g.lineTo(180, 230.5); g.stroke();
}
function emFir(g, color){
  const h = 900, W = h*0.62, p = (a, b)=>[(a - 0.5)*W, (b - 0.5)*h];
  const pts = [[0.5,0],[0.78,0.36],[0.64,0.36],[0.9,0.66],[0.7,0.66],[1,0.92],[0.56,0.92],[0.56,1],[0.44,1],[0.44,0.92],[0,0.92],[0.3,0.66],[0.1,0.66],[0.36,0.36],[0.22,0.36]];
  g.fillStyle = color; g.beginPath(); pts.forEach(([a, b], i)=>{ const [x, y] = p(a, b); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill();
}
function emRing(g, r, w, color){ g.strokeStyle = color; g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, Math.PI*2); g.stroke(); }

/* Desenho de uma cor só (a "máscara"): é a base de tinta, carimbo, relevo, ouro e negativo. opt.outer=false tira o anel grosso. */
function emMask(g, kind, color, opt){
  opt = opt || {};
  const P = {rig:color, star:color, base:color};
  if (kind === 'plataforma'){
    if (opt.outer !== false) emRing(g, 482.3, 34.7, color);
    emRing(g, 319.9, 9.8, color);
    emArcText(g, 'ØDEMARK A — MØRKETID', 380.8, 152*Math.PI/180, 85, 700, color, true);
    emArcText(g, 'NOV — APR', 376, 56*Math.PI/180, 53, 500, color, false);
    emRig(g, P, true);
  } else if (kind === 'mono'){
    if (opt.outer !== false) emRing(g, 470, 46, color);
    emRing(g, 404, 8, color);
    g.fillStyle = color; g.font = "700 380px 'Barlow Condensed'"; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText('Ø.A', 0, 134);
  } else if (kind === 'icone'){
    g.save(); g.scale(1.6, 1.6); g.translate(-47.3, 33.7); emRig(g, P, true); g.restore();
  } else if (kind === 'abeto'){
    emFir(g, color);
  }
}
/* As cores do patch. */
function emColor(g, kind, em){
  const C = EM_PAL.cor, ring = em.color || C.ring, acc = em.accent || C.star;
  if (kind === 'plataforma'){
    g.fillStyle = C.disc; g.beginPath(); g.arc(0, 0, 500, 0, Math.PI*2); g.fill();
    emRing(g, 482.3, 34.7, ring); emRing(g, 319.9, 9.8, ring);
    emArcText(g, 'ØDEMARK A — MØRKETID', 380.8, 152*Math.PI/180, 85, 700, C.text, true);
    emArcText(g, 'NOV — APR', 376, 56*Math.PI/180, 53, 500, acc, false);
    g.fillStyle = C.dots; [[-152,-170,8],[-89,-252,6.5],[86,-238,6.5],[140,-135,8]].forEach(([x, y, r])=>{ g.beginPath(); g.arc(x, y, r, 0, Math.PI*2); g.fill(); });
    emRig(g, {rig:C.rig, star:acc, base:ring}, true);
  } else if (kind === 'mono'){
    g.fillStyle = em.color || C.monoRing; g.beginPath(); g.arc(0, 0, 500, 0, Math.PI*2); g.fill();
    g.fillStyle = C.monoDisc; g.beginPath(); g.arc(0, 0, 430, 0, Math.PI*2); g.fill();
    g.fillStyle = C.monoText; g.font = "700 438px 'Barlow Condensed'"; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText('Ø.A', 0, 154);
  } else if (kind === 'icone'){
    g.save(); g.scale(1.6, 1.6); g.translate(-47.3, 33.7); emRig(g, {rig:C.rig, star:acc, base:ring}, true); g.restore();
  } else if (kind === 'abeto'){
    emFir(g, em.color || C.fir);
  }
}
function emMaskCanvas(S, kind, opt){
  const m = document.createElement('canvas'); m.width = m.height = S;
  const g = m.getContext('2d'); g.translate(S/2, S/2); g.scale(S/1000, S/1000);
  emMask(g, kind, '#000000', opt);
  return m;
}
/* Desgaste de carimbo: furinhos, riscos e manchas de pouca tinta (apaga com destination-out). */
function emWear(g, S, seed, wear){
  const rng = mulberry32((seed >>> 0) || 1), k = S/512;
  g.save(); g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 9; i++){   // regiões de pouca tinta
    const x = rng()*S, y = rng()*S, r = (30 + rng()*90)*k, rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(0,0,0,${0.10 + wear*0.30})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(x - r, y - r, r*2, r*2);
  }
  const N = Math.round(S*S*0.0011*wear);
  for (let i = 0; i < N; i++){
    const x = rng()*S, y = rng()*S, r = (0.5 + rng()*rng()*2.6)*k;
    g.fillStyle = `rgba(0,0,0,${0.55 + rng()*0.45})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI*2); g.fill();
  }
  for (let i = 0; i < Math.round(8*wear); i++){
    g.strokeStyle = `rgba(0,0,0,${0.5 + rng()*0.5})`; g.lineWidth = (0.7 + rng()*1.6)*k;
    const x = rng()*S, y = rng()*S, l = (30 + rng()*120)*k, a = rng()*Math.PI*2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a)*l, y + Math.sin(a)*l); g.stroke();
  }
  g.restore();
}
function emRender(S, em){
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'), kind = em.kind, variant = em.variant, ink = em.color || EM_INK;
  const place = (ctx)=>{ ctx.translate(S/2, S/2); ctx.scale(S/1000, S/1000); };
  if (variant === 'cor'){ g.save(); place(g); emColor(g, kind, em); g.restore(); }
  else if (variant === 'tinta' || variant === 'selo'){
    g.save(); place(g); emMask(g, kind, ink); g.restore();
    if (variant === 'selo') emWear(g, S, em.seed, em.wear != null ? em.wear : 0.5);
  } else if (variant === 'negativo'){
    if (kind === 'plataforma' || kind === 'mono'){
      g.save(); place(g); g.fillStyle = ink; g.beginPath(); g.arc(0, 0, 500, 0, Math.PI*2); g.fill(); g.restore();
      const m = emMaskCanvas(S, kind, {outer:false});
      g.globalCompositeOperation = 'destination-out'; g.drawImage(m, 0, 0);
      g.save(); place(g); g.globalCompositeOperation = 'destination-out'; emRing(g, 470, 7, '#000'); g.restore();
    } else { g.save(); place(g); emMask(g, kind, ink); g.restore(); }
  } else if (variant === 'relevo'){
    const m = emMaskCanvas(S, kind), d = Math.max(1.2, S*0.0042);
    const wm = document.createElement('canvas'); wm.width = wm.height = S;
    const wg = wm.getContext('2d'); wg.drawImage(m, 0, 0); wg.globalCompositeOperation = 'source-in'; wg.fillStyle = '#ffffff'; wg.fillRect(0, 0, S, S);
    g.globalAlpha = 0.34; g.drawImage(m, d, d);
    g.globalAlpha = 0.85; g.drawImage(wm, -d, -d);
    g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 0.92; g.drawImage(m, 0, 0);
  } else if (variant === 'ouro'){
    const m = emMaskCanvas(S, kind), d = Math.max(1.5, S*0.005);
    g.globalAlpha = 0.5; g.drawImage(m, d, d); g.globalAlpha = 1;
    const gm = document.createElement('canvas'); gm.width = gm.height = S;
    const gg = gm.getContext('2d'); gg.drawImage(m, 0, 0); gg.globalCompositeOperation = 'source-in';
    const gr = gg.createLinearGradient(0, 0, S*0.35, S); gr.addColorStop(0, '#f6e7ab'); gr.addColorStop(0.45, '#c9a24b'); gr.addColorStop(0.7, '#8f6a22'); gr.addColorStop(1, '#e8cb7c');
    gg.fillStyle = gr; gg.fillRect(0, 0, S, S);
    g.drawImage(gm, 0, 0);
  }
  return cv;
}

const EM_CACHE = new Map();
const EM_STEPS = [96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048];
function emCanvas(em, S){
  const key = [em.kind, em.variant, em.color || '', em.accent || '', em.seed, em.wear, S].join('|');
  if (EM_CACHE.has(key)){ const v = EM_CACHE.get(key); EM_CACHE.delete(key); EM_CACHE.set(key, v); return v; }
  const cv = emRender(S, em);
  EM_CACHE.set(key, cv);
  while (EM_CACHE.size > 40) EM_CACHE.delete(EM_CACHE.keys().next().value);
  return cv;
}
/* Multiplicar (tinta escura) ou normal (cor/relevo/ouro/clara). */
function emBlendFor(em){
  const v = em.variant;
  if (v === 'cor' || v === 'relevo' || v === 'ouro') return 'source-over';
  const c = em.color || EM_INK;
  return (typeof docLum === 'function' && docLum(c) >= 0.62) ? 'source-over' : 'multiply';
}
function emLabel(em){ return 'Emblema — ' + (EM_KINDS[em.kind] || em.kind) + ' (' + (EM_VARIANTS[em.variant] || em.variant).replace(/ \(.*$/, '').toLowerCase() + ')'; }

class Emblem extends fabric.Rect {
  static type = 'Emblem';
  constructor(options){
    options = options || {};
    const em = Object.assign({kind:'plataforma', variant:'tinta', color:null, accent:null, seed:1, wear:0.5}, options.em);
    const size = options.width || 300;
    super(Object.assign({width:size, height:size, fill:'#000000', strokeWidth:0, objectCaching:false}, options, {em}));
    if (!options.globalCompositeOperation) this.globalCompositeOperation = emBlendFor(em);
    if (!this.__labName) this.__labName = emLabel(em);
    if (this.setControlsVisibility) this.setControlsVisibility({ml:false, mr:false, mt:false, mb:false});
  }
  /* Troca parâmetros (inspetor): atualiza etiqueta e modo de mistura. */
  setEmblem(patch){
    this.em = Object.assign({}, this.em, patch);
    this.globalCompositeOperation = emBlendFor(this.em);
    this.__labName = emLabel(this.em);
    this.dirty = true;
  }
  _render(ctx){
    const W = this.width, t = ctx.getTransform(), s = Math.hypot(t.a, t.b) || 1;
    const need = W*s, S = EM_STEPS.find(v=>v >= need) || EM_STEPS[EM_STEPS.length - 1];
    if (!emFontsReady() && (this.em.kind === 'plataforma' || this.em.kind === 'mono')){
      // fonte ainda não carregou: desenha sem guardar no cache e pede novo desenho quando carregar
      if (!Emblem._waiting){
        Emblem._waiting = true;
        Promise.all(EM_FONTS.map(f=>document.fonts.load(f))).then(()=>{ Emblem._waiting = false; if (this.canvas) this.canvas.requestRenderAll(); }, ()=>{ Emblem._waiting = false; });
      }
      ctx.drawImage(emRender(S, this.em), -W/2, -W/2, W, W);
      return;
    }
    ctx.drawImage(emCanvas(this.em, S), -W/2, -W/2, W, W);
  }
  toObject(props){ return Object.assign(super.toObject(props), {em: JSON.parse(JSON.stringify(this.em))}); }
}
fabric.classRegistry.setClass(Emblem, 'Emblem');
