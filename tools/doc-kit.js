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
