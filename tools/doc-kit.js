/* ===================== Kit dos documentos digitais =====================
   Peças reutilizáveis pros modelos (doc-templates.js). Regra principal: ninguém digita `top`
   na mão — a coluna (`kit.column`) avança pela altura MEDIDA de cada texto, então nada se
   sobrepõe. Texto e formas escuros entram em *multiply*: o papel aparece através da tinta (é
   assim que tinta absorve), mas branco/claro (letra vazada em faixa colorida) fica normal.
   Depende de: fabric, PAGE_W/PAGE_H (layout.js), e — só na hora de usar — makeStampObjects
   (handwriting.js) e addStainAt (editor.js). As fontes TÊM que estar carregadas antes de montar
   (ensureFonts em editor.js), senão a altura medida sai errada. */

const DOC_INK = '#1b1a18';

/* Famílias que aparecem no dropdown de fonte do inspetor (as dos modelos antigos + as novas). */
const DOC_FONTS = [
  'PT Serif','Playfair Display','Old Standard TT','Libre Baskerville','EB Garamond','Cormorant Garamond','Bodoni Moda','UnifrakturCook',
  'Courier Prime','Special Elite','IBM Plex Mono','VT323',
  'Source Sans 3','Inter','IBM Plex Sans','Libre Franklin','Jost','Arimo','Roboto Condensed','Barlow Condensed','Oswald','Anton','Fredoka','Alfa Slab One','Yellowtail','Michroma',
];

/* Luminância 0–1 de qualquer cor CSS (usa o próprio canvas pra normalizar). */
function docLum(c){
  if (!c || c === 'transparent') return 1;
  const cx = docLum._c || (docLum._c = document.createElement('canvas').getContext('2d'));
  cx.fillStyle = '#000000'; cx.fillStyle = String(c);
  const v = cx.fillStyle;
  let r, g, b;
  if (v[0] === '#'){ r = parseInt(v.slice(1,3),16); g = parseInt(v.slice(3,5),16); b = parseInt(v.slice(5,7),16); }
  else { const m = v.match(/[\d.]+/g) || [0,0,0]; r = +m[0]; g = +m[1]; b = +m[2]; }
  return (r*0.299 + g*0.587 + b*0.114)/255;
}
/* Tinta (escura) usa multiply; letra clara e fundo claro não. */
function docBlendFor(color){ return docLum(color) < 0.62 ? 'multiply' : 'source-over'; }

class DocKit {
  /* Teste automático de um documento montado (usado pelo harness tools/_verify/render.js):
     devolve a lista de problemas — objeto fora da página, texto sobre texto/foto, fonte não carregada. */
  static lint(cv){
    const W = PAGE_W, H = PAGE_H, out = [];
    const nm = o=> o.__labName || (typeof o.text === 'string' ? '"' + o.text.replace(/\s+/g,' ').slice(0, 26) + '"' : o.type);
    const objs = cv.getObjects().filter(o=>o.customType !== 'background' && o.excludeFromExport !== true && o.visible !== false && o.customType !== 'stain' && o.customType !== 'grunge');
    objs.forEach(o=>{
      if (o.__bleedOk) return;
      const r = o.getBoundingRect();
      if (r.left < -2 || r.top < -2 || r.left + r.width > W + 2 || r.top + r.height > H + 2)
        out.push({kind:'fora-da-pagina', obj:nm(o), x:Math.round(r.left), y:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height)});
    });
    const isTxt = o=>typeof o.text === 'string' && !o.angle && !o.__allowOverlap;
    const isImg = o=>(o.customType === 'photoPlaceholder' || o.customType === 'photo' || o.customType === 'barcode') && !o.angle && !o.__allowOverlap;
    const boxOf = o=>{ const r = o.getBoundingRect(); const dy = isTxt(o) ? (o.fontSize||16)*0.2 : 0; return {l:r.left, t:r.top + dy, r:r.left + r.width, b:r.top + r.height - dy}; };
    const items = objs.filter(o=>isTxt(o) || isImg(o));
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++){
      const a = boxOf(items[i]), b = boxOf(items[j]);
      const w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (w > 3 && h > 3 && w*h > 40) out.push({kind:'sobreposicao', a:nm(items[i]), b:nm(items[j]), area:Math.round(w*h)});
    }
    const seen = new Set();
    objs.forEach(o=>{
      if (typeof o.text !== 'string' || !o.fontFamily) return;
      const key = `${o.fontStyle||'normal'} ${o.fontWeight||400} 16px ${o.fontFamily}`;
      if (seen.has(key)) return; seen.add(key);
      if (!document.fonts.check(key, 'AaBb')) out.push({kind:'fonte-nao-carregada', fonte:key});
    });
    return out;
  }

  constructor(cv){
    this.cv = cv;
    this.W = PAGE_W; this.H = PAGE_H;
    this.ink = DOC_INK;
  }
  add(o, label){
    if (label) o.__labName = label;
    this.cv.add(o);
    return o;
  }

  /* Texto. Fonte sem aspas ('PT Serif'). `align` left|center|right; `cs` espaçamento de letra (1/1000 em). */
  text(str, o){
    o = o || {};
    const fill = o.fill || this.ink;
    const t = new fabric.Textbox(String(str), {
      left: o.left != null ? o.left : 0, top: o.top != null ? o.top : 0,
      width: o.width || (this.W - (o.left||0)*2),
      fontFamily: `'${o.font || 'PT Serif'}'`, fontSize: o.size || 16,
      fontWeight: o.weight || 400, fontStyle: o.style || 'normal',
      fill, textAlign: o.align || 'left', lineHeight: o.lh || 1.25, charSpacing: o.cs || 0,
      underline: !!o.underline, linethrough: !!o.strike,
      angle: o.angle || 0, opacity: o.opacity != null ? o.opacity : 1,
      globalCompositeOperation: o.blend || docBlendFor(fill),
    });
    if (o.shadow) t.set('shadow', new fabric.Shadow({color:o.shadow.color, blur:o.shadow.blur != null ? o.shadow.blur : 12, offsetX:0, offsetY:0}));
    if (o.label) t.__labName = o.label;
    this.cv.add(t);
    return t;
  }
  rect(o){
    const fill = o.fill == null ? 'transparent' : o.fill;
    const r = new fabric.Rect({
      left: o.left, top: o.top, width: o.width, height: o.height, fill,
      stroke: o.stroke || null, strokeWidth: o.stroke ? (o.sw || 1) : 0,
      rx: o.rx || 0, ry: o.rx || 0, angle: o.angle || 0, opacity: o.opacity != null ? o.opacity : 1,
      strokeDashArray: o.dash || null,
      globalCompositeOperation: o.blend || docBlendFor(o.fill || o.stroke || this.ink),
    });
    if (o.label) r.__labName = o.label;
    this.cv.add(r);
    return r;
  }
  line(x1, y1, x2, y2, o){
    o = o || {};
    const stroke = o.stroke || this.ink;
    const l = new fabric.Line([x1, y1, x2, y2], {
      stroke, strokeWidth: o.sw || 1, strokeDashArray: o.dash || null, opacity: o.opacity != null ? o.opacity : 1,
      strokeLineCap: o.cap || 'butt',
      globalCompositeOperation: o.blend || docBlendFor(stroke),
    });
    if (o.label) l.__labName = o.label;
    this.cv.add(l);
    return l;
  }
  circle(o){
    const c = new fabric.Circle({
      left: o.left, top: o.top, radius: o.r, fill: o.fill == null ? 'transparent' : o.fill,
      stroke: o.stroke || null, strokeWidth: o.stroke ? (o.sw || 1) : 0, opacity: o.opacity != null ? o.opacity : 1,
      globalCompositeOperation: o.blend || docBlendFor(o.fill || o.stroke || this.ink),
    });
    if (o.label) c.__labName = o.label;
    this.cv.add(c);
    return c;
  }
  /* Caminho SVG (motivos: abeto, zigue-zague, estrela...). */
  path(d, o){
    o = o || {};
    const p = new fabric.Path(d, {
      left: o.left || 0, top: o.top || 0,
      fill: o.fill == null ? 'transparent' : o.fill, stroke: o.stroke || null, strokeWidth: o.stroke ? (o.sw || 1) : 0,
      opacity: o.opacity != null ? o.opacity : 1, angle: o.angle || 0,
      scaleX: o.scale || 1, scaleY: o.scale || 1,
      globalCompositeOperation: o.blend || docBlendFor(o.fill || o.stroke || this.ink),
      strokeLineJoin: o.join || 'miter',
    });
    if (o.label) p.__labName = o.label;
    this.cv.add(p);
    return p;
  }

  /* Textura procedural (cortina, madeira, moldura, quadro-negro, giz gasto) — ver proc-art.js. Um objeto só; guarda só os parâmetros. */
  proc(kind, x, y, w, h, o){
    o = o || {};
    const p = new ProcArt({left: x, top: y, width: w, height: h, art: {kind, seed: o.seed || 1, opts: o.opts || {}},
      opacity: o.opacity != null ? o.opacity : 1, globalCompositeOperation: o.blend || 'source-over'});
    if (o.label) p.__labName = o.label;
    this.cv.add(p);
    return p;
  }

  /* Largura em px de uma linha de texto (pra pontilhado de preço, centralização manual etc.). */
  measure(str, o){
    o = o || {};
    const c = DocKit._mctx || (DocKit._mctx = document.createElement('canvas').getContext('2d'));
    c.font = `${o.style || 'normal'} ${o.weight || 400} ${o.size || 16}px '${o.font || 'PT Serif'}'`;
    if ('letterSpacing' in c) c.letterSpacing = ((o.cs || 0)/1000*(o.size || 16)) + 'px';
    return c.measureText(String(str)).width;
  }
  ellipse(o){
    const e = new fabric.Ellipse({
      left: o.left, top: o.top, rx: o.rx, ry: o.ry, fill: o.fill == null ? 'transparent' : o.fill,
      stroke: o.stroke || null, strokeWidth: o.stroke ? (o.sw || 1) : 0, opacity: o.opacity != null ? o.opacity : 1,
      globalCompositeOperation: o.blend || docBlendFor(o.fill || o.stroke || this.ink),
    });
    if (o.label) e.__labName = o.label;
    this.cv.add(e);
    return e;
  }

  /* ---- Motivos em vetor (um objeto só cada) ---- */
  /* Abeto estilizado (silhueta em três degraus + tronco). x,y = canto de cima-esquerda; h = altura. */
  fir(x, y, h, o){
    o = o || {};
    const W = h*0.62, p = (a,b)=>`${(a*W).toFixed(2)},${(b*h).toFixed(2)}`;
    const d = `M ${p(0.5,0)} L ${p(0.78,0.36)} L ${p(0.64,0.36)} L ${p(0.9,0.66)} L ${p(0.7,0.66)} L ${p(1,0.92)} L ${p(0.56,0.92)} L ${p(0.56,1)} L ${p(0.44,1)} L ${p(0.44,0.92)} L ${p(0,0.92)} L ${p(0.3,0.66)} L ${p(0.1,0.66)} L ${p(0.36,0.36)} L ${p(0.22,0.36)} Z`;
    return this.path(d, {left: x, top: y, fill: o.fill || '#a8302a', label: o.label || 'Abeto', opacity: o.opacity});
  }
  /* Zigue-zague horizontal (chevron da Red Room, em linha fina). */
  zigzag(x1, x2, y, o){
    o = o || {};
    const amp = o.amp || 10, step = o.step || 24;
    let d = `M ${x1} ${y}`, up = true;
    for (let x = x1 + step/2; x <= x2 + 0.1; x += step/2){ d += ` L ${x.toFixed(1)} ${(y + (up ? -amp : amp)).toFixed(1)}`; up = !up; }
    return this.path(d, {left: x1, top: y - amp, fill: null, stroke: o.stroke || this.ink, sw: o.sw || 3, join: 'miter', label: o.label || 'Zigue-zague', opacity: o.opacity});
  }
  /* Estrela de pontas (selo de "especial do dia"). */
  star(cx, cy, ro, ri, n, o){
    o = o || {};
    let d = '', minx = 1e9, miny = 1e9;
    for (let i = 0; i < n*2; i++){
      const a = -Math.PI/2 + i*Math.PI/n, r = i%2 ? ri : ro;
      const px = cx + Math.cos(a)*r, py = cy + Math.sin(a)*r;
      minx = Math.min(minx, px); miny = Math.min(miny, py);
      d += (i ? ' L ' : 'M ') + px.toFixed(1) + ' ' + py.toFixed(1);
    }
    d += ' Z';
    return this.path(d, {left: minx, top: miny, fill: o.fill || '#a8302a', label: o.label || 'Estrela', opacity: o.opacity, stroke: o.stroke, sw: o.sw});
  }
  /* Tabuleiro xadrez de uma fileira (piso de praça de alimentação), num único caminho. */
  checker(x, y, w, size, c1, c2){
    const n = Math.ceil(w/size);
    if (c2) this.rect({left: x, top: y, width: w, height: size, fill: c2, label: 'Xadrez (fundo)'});
    let d = '';
    for (let i = 0; i < n; i += 2){
      const x0 = x + i*size, x1 = Math.min(x + w, x0 + size);
      d += `M ${x0} ${y} L ${x1} ${y} L ${x1} ${y+size} L ${x0} ${y+size} Z `;
    }
    return this.path(d, {left: x, top: y, fill: c1, label: 'Xadrez'});
  }
  /* Código de barras Code 128 REAL (conjunto B), desenhado como UM caminho vetorial (nítido em qualquer
     exportação, não pesa no desfazer). mw = largura do módulo em px. Devolve {obj, width}. */
  barcode(text, x, y, h, mw, o){
    o = o || {};
    const {widths} = code128Widths(text);
    let d = '', cx = 0;
    widths.forEach((w, i)=>{ if (i%2 === 0) d += 'M ' + (cx*mw).toFixed(2) + ' 0 L ' + ((cx+w)*mw).toFixed(2) + ' 0 L ' + ((cx+w)*mw).toFixed(2) + ' ' + h + ' L ' + (cx*mw).toFixed(2) + ' ' + h + ' Z '; cx += w; });
    const obj = this.path(d, {left: x, top: y, fill: o.fill || this.ink, label: o.label || 'Código de barras (Code 128)'});
    return {obj, width: cx*mw};
  }
  /* Linha de cardápio: nome à esquerda, preço à direita, pontilhado entre os dois. Devolve o y do fim. */
  menuRow(name, price, x, y, w, o){
    o = o || {};
    const size = o.size || 24, font = o.font || 'Source Sans 3', weight = o.weight || 600;
    let p = null, pw = 0;
    if (price !== '' && price != null) pw = this.measure(price, {font: o.pfont || font, size: o.psize || size, weight: o.pweight || 700});
    // a caixa do nome tem só a largura do nome (se for maior que o espaço, quebra) — nunca invade a do preço
    const nameW = Math.min(this.measure(name, {font, size, weight, style: o.style, cs: o.cs}) + 10, w - (pw ? pw + 24 : 0));
    const t = this.text(name, {left: x, top: y, width: nameW, font, size, weight, style: o.style, fill: o.fill, lh: 1.05, cs: o.cs});
    if (pw){
      p = this.text(price, {left: x + w - pw - 4, top: y + (o.pdy || 0), width: pw + 8, font: o.pfont || font, size: o.psize || size, weight: o.pweight || 700, fill: o.pfill || o.fill, align: 'right', lh: 1.05});
    }
    if (o.dots !== false && p){
      const nw = this.measure(name, {font, size, weight, style: o.style, cs: o.cs});
      const lx1 = x + nw + 12, lx2 = x + w - pw - 14, ly = y + size*1.02;
      if (lx2 - lx1 > 24) this.line(lx1, ly, lx2, ly, {stroke: o.dotColor || o.fill || this.ink, sw: o.dotSize || 3, dash: [0.1, o.dotGap || 7], cap: 'round', opacity: o.dotOpacity != null ? o.dotOpacity : 0.55, label: 'Pontilhado'});
    }
    return Math.max(t.top + t.height, p ? p.top + p.height : 0);
  }
  /* Foto-exemplo (troca pela foto real no inspetor): luz quente com manchas suaves, sem o meio-tom do jornal.
     Cores via o.c0/c1/c2 (centro, meio, borda). Serializa como imagem normal (customType photoPlaceholder). */
  async photo(x, y, w, h, o){
    o = o || {};
    const rng = mulberry32(o.seed || Math.floor(Math.random()*4294967296));
    const sc = 2, cw = Math.round(w*sc), ch = Math.round(h*sc);
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(cw*0.5, ch*0.42, 8, cw*0.5, ch*0.5, Math.max(cw, ch)*0.78);
    grd.addColorStop(0, o.c0 || '#e8b45a'); grd.addColorStop(0.55, o.c1 || '#9c5d28'); grd.addColorStop(1, o.c2 || '#35200f');
    g.fillStyle = grd; g.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 7; i++){
      const bx = rng()*cw, by = rng()*ch, r = (0.12 + rng()*0.28)*Math.max(cw, ch);
      const dark = rng() < 0.55, rg = g.createRadialGradient(bx, by, 0, bx, by, r);
      rg.addColorStop(0, dark ? 'rgba(30,16,8,0.32)' : 'rgba(255,224,150,0.26)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(bx, by, r, 0, Math.PI*2); g.fill();
    }
    const img = await fabric.Image.fromURL(cv.toDataURL());
    img.set({left: x, top: y, scaleX: w/img.width, scaleY: h/img.height});
    img.set('customType', 'photoPlaceholder');
    applyPhotoCornerRadius(img, o.rx || 0);
    img.__labName = o.label || 'Foto (trocar)';
    this.cv.add(img);
    return img;
  }

  /* ---- Detalhes por cima feitos em código (não dependem do pacote de fotos de mancha) ---- */
  _overlayImage(cv, x, y, size, o){
    return fabric.Image.fromURL(cv.toDataURL()).then(img=>{
      img.set({left: x, top: y, originX: 'center', originY: 'center', scaleX: size/cv.width, scaleY: size/cv.width,
        angle: o.angle || 0, opacity: o.opacity != null ? o.opacity : 0.55, globalCompositeOperation: o.blend || 'multiply'});
      img.set('customType', 'stain');
      img.__labName = o.label;
      this.cv.add(img);
      return img;
    });
  }
  /* Anel de copo (café, vinho): arcos curtos com largura e opacidade variando, uma falha, segundo anel
     mais fraco deslocado (fundo do copo) e uns pingos. `color` = [r,g,b]. */
  cupRing(x, y, r, o){
    o = o || {};
    const col = (o.color || [112, 66, 28]).join(','), seed = o.seed || 1, rng = mulberry32(seed*9973 + 17);
    const size = Math.ceil(r*2 + 70), c = size/2, TAU = Math.PI*2;
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const g = cv.getContext('2d');
    if ('filter' in g) g.filter = 'blur(0.8px)';
    const wash = g.createRadialGradient(c, c, r*0.15, c, c, r);
    wash.addColorStop(0, `rgba(${col},0.04)`); wash.addColorStop(1, `rgba(${col},0.11)`);
    g.fillStyle = wash; g.beginPath(); g.arc(c, c, r, 0, TAU); g.fill();
    const gap0 = rng()*TAU, gapW = 0.45 + rng()*0.5;
    const ring = (rr, ox, oy, a0f, wmul)=>{
      const N = 200;
      for (let i = 0; i < N; i++){
        const a0 = i/N*TAU, a1 = (i + 1.7)/N*TAU;
        const d = ((a0 - gap0)%TAU + TAU)%TAU;
        if (d < gapW*(wmul < 1 ? 1.8 : 1)) continue;
        const wob = Math.sin(a0*3 + seed)*2.2 + Math.sin(a0*7 + seed*2)*1.1;
        g.strokeStyle = `rgba(${col},${a0f*(0.55 + 0.45*rng())})`;
        g.lineWidth = (3.5 + 5*(0.5 + 0.5*Math.sin(a0*2 + seed)) + rng()*1.4)*wmul;
        g.beginPath(); g.arc(c + ox, c + oy, rr + wob, a0, a1); g.stroke();
      }
    };
    ring(r, 0, 0, 0.62, 1);
    ring(r*0.94, 4, 3, 0.26, 0.6);
    for (let i = 0; i < 4; i++){
      const a = rng()*TAU, rr = r + 10 + rng()*r*0.5, pr = 1.5 + rng()*3.2;
      g.fillStyle = `rgba(${col},${0.3 + rng()*0.3})`; g.beginPath(); g.arc(c + Math.cos(a)*rr, c + Math.sin(a)*rr, pr, 0, TAU); g.fill();
    }
    return this._overlayImage(cv, x, y, size, {angle: o.angle, opacity: o.opacity, blend: o.blend, label: o.label || 'Detalhe — anel de copo'});
  }
  /* Mancha de gordura/umidade: borda irregular, centro mais escuro, uns respingos. */
  smudge(x, y, r, o){
    o = o || {};
    const col = (o.color || [70, 42, 18]).join(','), seed = o.seed || 1, rng = mulberry32(seed*7919 + 5);
    const size = Math.ceil(r*2 + 40), c = size/2, TAU = Math.PI*2;
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const g = cv.getContext('2d');
    if ('filter' in g) g.filter = 'blur(1.4px)';
    const pts = 28, path = new Path2D();
    for (let i = 0; i <= pts; i++){
      const a = i/pts*TAU, rr = r*(0.72 + 0.28*(0.5 + 0.5*Math.sin(a*3 + seed) )*(0.6 + 0.4*rng()));
      const px = c + Math.cos(a)*rr, py = c + Math.sin(a)*rr;
      if (i) path.lineTo(px, py); else path.moveTo(px, py);
    }
    path.closePath();
    const grd = g.createRadialGradient(c, c, r*0.1, c, c, r);
    grd.addColorStop(0, `rgba(${col},0.55)`); grd.addColorStop(0.7, `rgba(${col},0.32)`); grd.addColorStop(1, `rgba(${col},0.12)`);
    g.fillStyle = grd; g.fill(path);
    g.strokeStyle = `rgba(${col},0.35)`; g.lineWidth = 2.2; g.stroke(path);
    for (let i = 0; i < 5; i++){
      const a = rng()*TAU, rr = r*(1.0 + rng()*0.35), pr = 2 + rng()*5;
      g.fillStyle = `rgba(${col},${0.25 + rng()*0.3})`; g.beginPath(); g.arc(c + Math.cos(a)*rr, c + Math.sin(a)*rr, pr, 0, TAU); g.fill();
    }
    return this._overlayImage(cv, x, y, size, {angle: o.angle, opacity: o.opacity, blend: o.blend, label: o.label || 'Detalhe — mancha de gordura'});
  }

  /* Coluna com cursor vertical: cada texto entra onde o anterior terminou. */
  column(left, top, width, defaults){
    const kit = this, d = defaults || {};
    let y = top;
    const col = {
      get y(){ return y; }, set y(v){ y = v; },
      left, width,
      text(str, o){
        o = o || {};
        const t = kit.text(str, Object.assign({}, d, o, {left: o.left != null ? o.left : left, top: y, width: o.width || width}));
        y = t.top + t.height + (o.gap != null ? o.gap : (d.gap || 0));
        return t;
      },
      gap(n){ y += n; return col; },
      rule(o){ o = o || {}; const l = kit.line(left, y, left + (o.width || width), y, o); y += (o.sw || 1) + (o.after != null ? o.after : 0); return l; },
    };
    return col;
  }

  /* Folha pautada (linhas finas + margem vermelha opcional) — pro "Em branco" e blocos. */
  ruled(o){
    o = o || {};
    const gap = o.gap || 47, top = o.top != null ? o.top : 150, bottom = o.bottom != null ? o.bottom : this.H - 90;
    const x1 = o.left != null ? o.left : 70, x2 = o.right != null ? o.right : this.W - 70;
    const color = o.color || '#7d9bbd';
    for (let y = top; y <= bottom; y += gap) this.line(x1, y, x2, y, {stroke: color, sw: o.sw || 1.4, opacity: o.opacity != null ? o.opacity : 0.55, label: o.label || 'Pauta'});
    if (o.margin !== false) this.line(o.marginX != null ? o.marginX : x1 + 78, top - 60, o.marginX != null ? o.marginX : x1 + 78, bottom + 30, {stroke: '#c75a5a', sw: 1.6, opacity: 0.6, label: 'Margem'});
  }
  /* Folha quadriculada. */
  grid(o){
    o = o || {};
    const step = o.step || 30, color = o.color || '#8aa6bf', op = o.opacity != null ? o.opacity : 0.4;
    const x0 = o.left != null ? o.left : 40, x1 = o.right != null ? o.right : this.W - 40;
    const y0 = o.top != null ? o.top : 40, y1 = o.bottom != null ? o.bottom : this.H - 40;
    for (let x = x0; x <= x1 + 0.1; x += step) this.line(x, y0, x, y1, {stroke: color, sw: 1, opacity: op, label: 'Quadrícula'});
    for (let y = y0; y <= y1 + 0.1; y += step) this.line(x0, y, x1, y, {stroke: color, sw: 1, opacity: op, label: 'Quadrícula'});
  }

  /* "Detalhes por cima": mancha (async, foto real feathered) e carimbo. Sempre com nome de camada. */
  async stain(type, o){
    o = o || {};
    const img = await addStainAt(type, {x: o.x, y: o.y, size: o.size, angle: o.angle, opacity: o.opacity, flip: o.flip, seed: o.seed, quiet: true});
    if (img) img.__labName = o.label || ('Detalhe — mancha de ' + ({coffee:'café', water:'água', blood:'ferrugem', mold:'mofo'}[type] || type));
    return img;
  }
  stamp(text, o){
    o = o || {};
    const g = makeStampObjects(text, {left: o.x, top: o.y, angle: o.angle != null ? o.angle : -8, color: o.color || '#7a2020', fontSize: o.size || 26, opacity: o.opacity != null ? o.opacity : 0.78, strokeWidth: o.sw || 3});
    g.__labName = o.label || ('Detalhe — carimbo ' + text);
    this.cv.add(g);
    return g;
  }
}
/* Code 128 (conjunto B): tabela dos 107 símbolos (larguras barra/espaço) + soma de verificação mod 103. */
const CODE128_TABLE = '212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112'.split(' ');

/* Larguras de módulo (barra, espaço, barra, ...) para o texto, já com início B, verificação e fim. */
function code128Widths(text){
  const START_B = 104, STOP = 106;
  const codes = [START_B];
  let sum = START_B;
  for (let i = 0; i < text.length; i++){
    const v = text.charCodeAt(i) - 32;
    if (v < 0 || v > 95) throw new Error('Code 128 B: caractere fora de 32–127: ' + text[i]);
    codes.push(v); sum += v*(i + 1);
  }
  codes.push(sum % 103); codes.push(STOP);
  const widths = [];
  codes.forEach(c=>{ CODE128_TABLE[c].split('').forEach(d=>widths.push(+d)); });
  return {codes, widths};
}
