/* ===================== Papel procedural (fundo dos documentos) =====================
   Pesquisado antes de escrever (ver tools/DOCS_DESIGN_NOTES.md): shaders de papel prontos
   (Paper Design) separam o papel em camadas — aspereza (grão fino), fibra (fios curvos),
   dobras, rugas, pontinhos — e acendem tudo com uma luz de canto; o clássico SVG faz o mesmo
   com feTurbulence (ruído fractal) + feDiffuseLighting (luz rasante). Aqui: um fragment shader
   próprio (escrito do zero) que gera o papel NO TAMANHO em que for desenhado (zoom da tela ou
   exportação ×2), então nunca borra, e o fundo só guarda parâmetros (paperSpec) — nada de PNG
   de 2–5 MB em cada passo do desfazer.

   Camadas: cor base → nuvens (formação do papel) → relevo (grão + fibras, luz de canto) →
   papel verge (linhas) → pontinhos → ferrugem (só atmosfera Silent Hill) → envelhecido → borda →
   vinheta → dobra. `level` (0–1) escala todas as de textura; cor/atmosfera não dependem dele.
   Tudo em "unidades de página" (1240 = A4 largura), então a textura tem o mesmo tamanho FÍSICO
   em ×1 e ×2. Mesma semente = mesma textura. */

const PAPER_TYPES = {
  liso:      {label:'Liso (digital puro)', flat:true, tint:[1,1,1]},
  sulfite:   {label:'Sulfite (escritório)', tint:[0.985,0.982,0.968], grain:[0.55,0.9], fiber:[0.30,0.030,0.9,0.72], cloud:[0.012,0.0070], relief:1.0, speck:[0.00,0.8,0.97], edge:[0.00,40], laid:0},
  jornal:    {label:'Papel-jornal', tint:[0.905,0.893,0.850], grain:[0.70,0.8], fiber:[0.80,0.026,0.8,0.60], cloud:[0.030,0.0105], relief:1.5, speck:[0.10,0.7,0.955], edge:[0.05,70], laid:0},
  cartao:    {label:'Cartão (menu)', tint:[0.972,0.955,0.915], grain:[0.50,1.0], fiber:[0.25,0.030,0.9,0.76], cloud:[0.011,0.0075], relief:0.9, speck:[0.00,0.8,0.97], edge:[0.02,40], laid:0},
  creme:     {label:'Bloco / creme', tint:[0.945,0.905,0.788], grain:[0.60,0.9], fiber:[0.60,0.028,0.85,0.66], cloud:[0.022,0.0085], relief:1.2, speck:[0.05,0.7,0.96], edge:[0.04,60], laid:0},
  verge:     {label:'Papel verge (carta)', tint:[0.945,0.905,0.800], grain:[0.55,0.9], fiber:[0.55,0.028,0.85,0.68], cloud:[0.020,0.0085], relief:1.2, speck:[0.04,0.7,0.965], edge:[0.03,50], laid:0.55},
  fotocopia: {label:'Fotocópia', tint:[0.955,0.955,0.940], grain:[0.80,1.2], fiber:[0.30,0.030,0.9,0.78], cloud:[0.010,0.0130], relief:0.8, speck:[0.80,1.1,0.915], edge:[0.16,90], laid:0},
  pardo:     {label:'Pardo (kraft)', tint:[0.700,0.545,0.385], grain:[0.80,0.8], fiber:[1.10,0.024,0.75,0.56], cloud:[0.045,0.0075], relief:1.8, speck:[0.18,0.7,0.945], edge:[0.10,70], laid:0},
  termico:   {label:'Térmico', tint:[0.948,0.958,0.965], grain:[0.30,1.0], fiber:[0.12,0.030,0.9,0.80], cloud:[0.008,0.0070], relief:0.6, speck:[0.00,0.8,0.97], edge:[0.00,40], laid:0},
};
const PAPER_TYPE_ORDER = ['liso','sulfite','jornal','cartao','creme','verge','fotocopia','pardo','termico'];

/* Atmosfera: muda cor, borda, grão e sujeira juntos. */
const PAPER_ATMOS = {
  neutra: {label:'Neutra', tintMul:[1,1,1], age:0, ageColor:[0.93,0.86,0.68], edge:1, grain:1, cloud:1, speck:1, rust:0, vig:0},
  twin:   {label:'Twin Peaks', tintMul:[1.0,0.975,0.915], age:0.10, ageColor:[0.96,0.90,0.74], edge:1.1, grain:1, cloud:1.1, speck:1, rust:0, vig:0.05},
  silent: {label:'Silent Hill 3', tintMul:[0.975,0.955,0.87], age:0.34, ageColor:[0.92,0.86,0.68], edge:2.3, grain:1.2, cloud:1.9, speck:2.0, rust:0.55, vig:0.20},
};
const PAPER_FOLDS = {nenhuma:{label:'Sem dobra', n:0}, meio:{label:'Ao meio', n:1}, tres:{label:'Em três (carta)', n:2}};

const PAPER_VERT = 'attribute vec2 aPos; void main(){ gl_Position = vec4(aPos,0.0,1.0); }';
const PAPER_FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform float uScale; uniform vec2 uPage; uniform vec2 uSeed;
uniform vec3 uTint; uniform float uLevel;
uniform vec2 uGrain; uniform vec4 uFiber; uniform vec2 uCloud; uniform float uRelief;
uniform vec3 uSpeck; uniform vec2 uEdge; uniform float uVig; uniform float uRust;
uniform float uAge; uniform vec3 uAgeColor; uniform float uLaid; uniform float uFold; uniform float uLight;

float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  float a = hash(i), b = hash(i+vec2(1.0,0.0)), c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for (int i=0;i<4;i++){ s += a*vnoise(p); p = p*2.03 + vec2(17.3,9.1); a *= 0.5; }
  return s;
}
float fiberLayer(vec2 p, float seed, float lenF, float widF, float thr){
  vec2 w = vec2(vnoise(p*0.02+seed), vnoise(p*0.02+seed+31.7)) - 0.5;
  p += w*7.0;
  float ang = vnoise(p*0.003 + seed*1.7)*6.2832 + seed;
  vec2 d = vec2(cos(ang), sin(ang));
  vec2 q = vec2(dot(p,d)*lenF, dot(p, vec2(-d.y,d.x))*widF);
  return smoothstep(thr, thr+0.22, vnoise(q + seed*13.0));
}
float heightAt(vec2 p){
  float g = vnoise(p*uGrain.y)*0.65 + vnoise(p*uGrain.y*2.7+5.1)*0.35;
  float f = max(fiberLayer(p, 1.0, uFiber.y, uFiber.z, uFiber.w), 0.8*fiberLayer(p+43.0, 2.0, uFiber.y, uFiber.z, uFiber.w));
  return uGrain.x*g + uFiber.x*f;
}
float crease(float y, float y0){
  float d = y - y0;
  float line = exp(-d*d/(2.0*2.4*2.4));
  float ridge = exp(-pow((d+8.0)/13.0, 2.0)) - exp(-pow((d-8.0)/13.0, 2.0));
  return -0.11*line + 0.045*ridge;
}
void main(){
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 p = frag / uScale;
  vec2 sp = p + uSeed;
  vec3 col = uTint;

  float c = fbm(sp*uCloud.y);
  float tone = (c - 0.5) * 2.0 * uCloud.x * uLevel * 5.0;
  col *= vec3(1.0 + tone, 1.0 + tone*0.92, 1.0 + tone*0.80);

  // Nível de detalhe: em zoom baixo o grão some na média (igual reduzir uma foto de papel).
  float lod = clamp(uScale, 0.3, 1.0);
  vec2 L = vec2(cos(uLight), sin(uLight));
  float h0 = heightAt(sp), h1 = heightAt(sp + L*0.9);
  col *= 1.0 + (h0 - h1) * uRelief * uLevel * 0.11 * lod;

  if (uLaid > 0.0){
    float lv = sin(sp.y*6.2832/3.8)*0.5 + 0.5;
    col *= 1.0 - uLaid*uLevel*0.10*lv*(0.55 + 0.45*vnoise(sp*0.4));
    float cv = pow(abs(sin(sp.x*3.1416/62.0)), 40.0);
    col *= 1.0 - uLaid*uLevel*0.035*cv;
  }

  float s = vnoise(sp*uSpeck.y + 91.0)*0.7 + vnoise(sp*uSpeck.y*3.1)*0.3;
  float sm = smoothstep(uSpeck.z, uSpeck.z + 0.025, s);
  col *= 1.0 - sm*uSpeck.x*uLevel*0.55*vec3(0.55,0.62,0.78);

  float edgeDist = min(min(p.x, uPage.x - p.x), min(p.y, uPage.y - p.y));
  if (uRust > 0.0){
    float rr = fbm(sp*0.0045 + 3.0);
    float edgeW = 1.0 - smoothstep(0.0, 300.0, edgeDist);
    float rm = smoothstep(0.52, 0.84, rr + edgeW*0.30) * uRust * uLevel;
    col = mix(col, col*vec3(0.62,0.42,0.24)*1.18, rm*0.60);
  }
  col = mix(col, col*uAgeColor, uAge);

  float en = vnoise(sp*0.05)*0.6 + vnoise(sp*0.17)*0.4;
  float ed = smoothstep(0.0, uEdge.y, edgeDist + (en-0.5)*uEdge.y*0.45);
  col *= 1.0 - uEdge.x*uLevel*(1.0-ed);

  vec2 uv = p/uPage;
  col *= 1.0 - uVig*uLevel*smoothstep(0.38, 0.88, length((uv-0.5)*vec2(1.0,0.92)));

  if (uFold > 0.5){
    float y = p.y + (vnoise(vec2(p.x*0.012, 3.0))-0.5)*3.0;
    float fa = 0.45 + 0.55*uLevel;
    float k = 0.0;
    if (uFold < 1.5) k = crease(y, uPage.y*0.5);
    else k = crease(y, uPage.y/3.0) + crease(y, uPage.y*2.0/3.0);
    col *= 1.0 + k*fa;
  }

  col += (hash(gl_FragCoord.xy + uSeed) - 0.5)/255.0;
  gl_FragColor = vec4(clamp(col,0.0,1.0), 1.0);
}`;

const PaperGL = {canvas:null, gl:null, prog:null, loc:{}, failed:false};
function paperGLInit(){
  if (PaperGL.failed) return false;
  if (PaperGL.gl && !PaperGL.gl.isContextLost()) return true;
  try {
    const cv = document.createElement('canvas');
    cv.width = 16; cv.height = 16;
    const gl = cv.getContext('webgl', {preserveDrawingBuffer:true, antialias:false, alpha:false}) || cv.getContext('experimental-webgl', {preserveDrawingBuffer:true, antialias:false, alpha:false});
    if (!gl) throw new Error('sem WebGL');
    const mk = (type, src)=>{
      const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, PAPER_VERT));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, PAPER_FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const loc = {};
    ['uRes','uScale','uPage','uSeed','uTint','uLevel','uGrain','uFiber','uCloud','uRelief','uSpeck','uEdge','uVig','uRust','uAge','uAgeColor','uLaid','uFold','uLight']
      .forEach(n=>{ loc[n] = gl.getUniformLocation(prog, n); });
    PaperGL.canvas = cv; PaperGL.gl = gl; PaperGL.prog = prog; PaperGL.loc = loc;
    return true;
  } catch(e){
    console.warn('Papel procedural indisponível (WebGL):', e);
    PaperGL.failed = true;
    return false;
  }
}

const PAPER_DEFAULT_SPEC = {type:'liso', level:0.3, fold:'nenhuma', atmos:'neutra', seed:1};
function paperNormalizeSpec(spec){
  const s = Object.assign({}, PAPER_DEFAULT_SPEC, spec || {});
  if (!PAPER_TYPES[s.type]) s.type = 'liso';
  if (!PAPER_ATMOS[s.atmos]) s.atmos = 'neutra';
  if (!PAPER_FOLDS[s.fold]) s.fold = 'nenhuma';
  s.level = Math.max(0, Math.min(1, +s.level || 0));
  s.seed = (Math.floor(+s.seed) || 1) >>> 0;
  return s;
}
function paperTintOf(spec){
  const s = paperNormalizeSpec(spec), t = PAPER_TYPES[s.type], a = PAPER_ATMOS[s.atmos];
  const base = t.tint.map((v,i)=>v*a.tintMul[i]);
  const age = t.flat ? 0 : a.age;
  return base.map((v,i)=>Math.max(0, Math.min(1, v*(1-age + age*a.ageColor[i]))));
}
function paperTintCSS(spec){
  const c = paperTintOf(spec).map(v=>Math.round(v*255));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/* Renderiza o papel pra um canvas 2D de (w*scale)×(h*scale). Devolve null se não der (sem WebGL). */
function paperRender(specIn, w, h, scale){
  const spec = paperNormalizeSpec(specIn);
  const T = PAPER_TYPES[spec.type], A = PAPER_ATMOS[spec.atmos];
  if (!paperGLInit()) return null;
  const gl = PaperGL.gl, cv = PaperGL.canvas, L = PaperGL.loc;
  const maxSz = Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)||4096, gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0]||4096, 8192);
  let sc = scale;
  if (w*sc > maxSz) sc = maxSz/w;
  if (h*sc > maxSz) sc = Math.min(sc, maxSz/h);
  const pw = Math.max(1, Math.round(w*sc)), ph = Math.max(1, Math.round(h*sc));
  if (cv.width !== pw || cv.height !== ph){ cv.width = pw; cv.height = ph; }
  gl.viewport(0, 0, pw, ph);
  const tint = paperTintOf(spec);
  const sr = (n)=>{ let x = (spec.seed*2654435761 + n*40503) >>> 0; x ^= x>>>13; x = Math.imul(x, 1274126177)>>>0; return (x%100000)/100000; };
  gl.uniform2f(L.uRes, pw, ph);
  gl.uniform1f(L.uScale, pw/w);
  gl.uniform2f(L.uPage, w, h);
  gl.uniform2f(L.uSeed, sr(1)*4000, sr(2)*4000);
  gl.uniform3f(L.uTint, tint[0], tint[1], tint[2]);
  gl.uniform1f(L.uLevel, spec.level);
  const g = T.grain||[0,1], f = T.fiber||[0,0.03,0.9,0.7], c = T.cloud||[0,0.005], sk = T.speck||[0,0.8,0.97], e = T.edge||[0,40];
  gl.uniform2f(L.uGrain, g[0]*A.grain, g[1]);
  gl.uniform4f(L.uFiber, f[0]*A.grain, f[1], f[2], f[3]);
  gl.uniform2f(L.uCloud, c[0]*A.cloud, c[1]);
  gl.uniform1f(L.uRelief, T.relief||0);
  gl.uniform3f(L.uSpeck, sk[0]*A.speck, sk[1], sk[2]);
  gl.uniform2f(L.uEdge, e[0]*A.edge, e[1]);
  gl.uniform1f(L.uVig, A.vig);
  gl.uniform1f(L.uRust, A.rust);
  gl.uniform1f(L.uAge, 0);
  gl.uniform3f(L.uAgeColor, A.ageColor[0], A.ageColor[1], A.ageColor[2]);
  gl.uniform1f(L.uLaid, T.laid||0);
  gl.uniform1f(L.uFold, PAPER_FOLDS[spec.fold].n);
  gl.uniform1f(L.uLight, 2.35);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  const out = document.createElement('canvas');
  out.width = pw; out.height = ph;
  out.getContext('2d').drawImage(cv, 0, 0);
  return out;
}

/* Cache global (instâncias novas nascem a cada desfazer/troca de página; sem isso o papel seria
   regerado toda vez). Limite pequeno: uma textura ×2 de A4 pesa ~35 MB. */
const PAPER_CACHE = new Map();
const PAPER_CACHE_MAX = 4;
function paperCached(spec, w, h, q){
  const key = [spec.type, spec.level.toFixed(3), spec.fold, spec.atmos, spec.seed, w, h, q].join('|');
  if (PAPER_CACHE.has(key)){
    const v = PAPER_CACHE.get(key); PAPER_CACHE.delete(key); PAPER_CACHE.set(key, v); return v;
  }
  const cv = paperRender(spec, w, h, q);
  if (cv){
    PAPER_CACHE.set(key, cv);
    while (PAPER_CACHE.size > PAPER_CACHE_MAX) PAPER_CACHE.delete(PAPER_CACHE.keys().next().value);
  }
  return cv;
}

/* Como o papel entra na exportação: 'textura' (padrão), 'cor' (só a cor do papel) ou 'branco'
   (pra imprimir em papel de verdade — papel impresso em papel fica "duplo"). */
let PAPER_EXPORT_MODE = 'textura';
function paperWithExportMode(mode, fn){
  const prev = PAPER_EXPORT_MODE;
  PAPER_EXPORT_MODE = mode;
  try { return fn(); } finally { PAPER_EXPORT_MODE = prev; }
}

class PaperBackground extends fabric.Rect {
  static type = 'PaperBackground';
  constructor(options){
    options = options || {};
    const spec = paperNormalizeSpec(options.paperSpec);
    super(Object.assign({
      left:0, top:0, width:(typeof PAGE_W==='number'?PAGE_W:1240), height:(typeof PAGE_H==='number'?PAGE_H:1754),
      fill:'#ffffff', selectable:false, evented:true, hoverCursor:'pointer', objectCaching:false,
      hasControls:false, hasBorders:false, lockMovementX:true, lockMovementY:true, customType:'background',
    }, options, {paperSpec: spec}));
  }
  _render(ctx){
    const W = this.width, H = this.height, spec = paperNormalizeSpec(this.paperSpec);
    const mode = PAPER_EXPORT_MODE;
    if (mode === 'branco'){ ctx.fillStyle = '#ffffff'; ctx.fillRect(-W/2, -H/2, W, H); return; }
    if (mode === 'cor' || PAPER_TYPES[spec.type].flat && spec.fold==='nenhuma' && spec.atmos==='neutra'){
      ctx.fillStyle = paperTintCSS(spec); ctx.fillRect(-W/2, -H/2, W, H); return;
    }
    const t = ctx.getTransform(), s = Math.hypot(t.a, t.b) || 1;
    const q = s <= 0.6 ? 0.5 : (s <= 1.25 ? 1 : (s <= 2.5 ? 2 : 3));
    const cv = paperCached(spec, W, H, q);
    if (!cv){ ctx.fillStyle = paperTintCSS(spec); ctx.fillRect(-W/2, -H/2, W, H); return; }
    ctx.drawImage(cv, -W/2, -H/2, W, H);
  }
  toObject(props){
    return Object.assign(super.toObject(props), {paperSpec: Object.assign({}, this.paperSpec)});
  }
}
fabric.classRegistry.setClass(PaperBackground, 'PaperBackground');
