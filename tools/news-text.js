/* ===================== Texto do jornal: quebra de linhas + NewsBox =====================
   Duas peças que o motor do jornal (news-engine.js) e a ferramenta usam:

   1) `newsBreakLines` — função PURA que quebra um texto em linhas pra uma largura dada. É o MESMO
      cálculo pra medir (motor) e pra desenhar (NewsBox._render), então uma coluna nunca estoura por
      diferença de medida (o layout antigo medida com um canvas e o Fabric quebrava com larguras
      guardadas a 400px: uma linha de diferença e o texto passava da coluna).

   2) `NewsBox` — a "caixa de jornal": UM objeto (movível, redimensionável só na largura), com título
      + texto dentro, moldura desenhada por ele mesmo e ALTURA SEMPRE calculada pelo texto. Subclasse de
      fabric.Textbox no mesmo padrão do BrandText (brand.js): sobrescreve initDimensions e _render, então
      herda serialização, clone, alças de largura. Armadilhas do Fabric 6.4.3 que valem aqui:
        - sem campos de classe (rodam depois do pai e apagam o que o setOptions já atribuiu): defaults
          via Object.assign no construtor;
        - textLayoutProperties inclui as props novas, senão set('title') não remede;
        - initDimensions NUNCA chama o pai, e usa _set (não set) pra não recursar.
   Estilos de moldura (`frame`): none, box (moldura simples + título em versalete), bar (faixa preta no
   título), ad (anúncio, linha dupla, centralizado), rules (só filetes em cima e embaixo).
   Texto em colunas de corpo: frame none + as props indent/indentFirst/contPara/justify. */

const _newsMeasureCtx = document.createElement('canvas').getContext('2d');
function newsFontStr(style, weight, size, family){ return `${style||'normal'} ${weight||400} ${size}px '${family}'`; }
/* Largura de um texto numa fonte (cache por fonte+espaçamento). */
function newsMeasure(font, cs){
  const c = _newsMeasureCtx;
  const key = font + '|' + (cs||0);
  const cache = newsMeasure._c || (newsMeasure._c = new Map());
  let m = cache.get(key);
  if (!m){
    m = new Map();
    cache.set(key, m);
  }
  return (str)=>{
    let w = m.get(str);
    if (w === undefined){
      c.font = font;
      if ('letterSpacing' in c) c.letterSpacing = (cs ? (cs/1000*parseFloat(font.match(/(\d+(\.\d+)?)px/)[1])) : 0) + 'px';
      w = c.measureText(str).width;
      if (m.size > 4000) m.clear();
      m.set(str, w);
    }
    return w;
  };
}
/* settleFonts (editor.js) chama isso: larguras medidas com fonte reserva não valem mais. */
function newsClearMeasureCache(){ if (newsMeasure._c) newsMeasure._c.clear(); }

/* Quebra `text` em linhas de no máximo `maxW`. `\n` separa parágrafos. Devolve [{t, p, last}]:
   t = texto da linha, p = começa parágrafo, last = última linha do parágrafo.
   opts.indent: recuo da 1ª linha de cada parágrafo (px); opts.indentFirst: recua também a 1ª linha do texto. */
function newsBreakLines(text, measure, maxW, opts){
  opts = opts || {};
  const out = [];
  const indent = opts.indent || 0;
  String(text == null ? '' : text).split('\n').forEach((para, pi)=>{
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length){ out.push({t:'', p:true, last:true}); return; }
    let line = '', first = true;
    const avail = ()=> maxW - ((first && indent && (pi > 0 || opts.indentFirst)) ? indent : 0);
    words.forEach(w=>{
      const cand = line ? line + ' ' + w : w;
      if (!line || measure(cand) <= avail()) line = cand;
      else { out.push({t:line, p:first, last:false}); first = false; line = w; }
    });
    out.push({t:line, p:first, last:true});
  });
  return out;
}

class NewsBox extends fabric.Textbox {
  static type = 'NewsBox';
  static textLayoutProperties = [...fabric.Textbox.textLayoutProperties, 'title','frame','padX','padY','titleSize','titleFont','bodyFont','bodyWeight','bodyStyle','justify','indent','indentFirst','contPara','upper','rows','charSp','titleAlign','minH'];

  constructor(text, options){
    options = Object.assign({
      title:'', frame:'box', padX:null, padY:null, titleSize:12.5, titleFont:'Libre Franklin',
      bodyFont:'Old Standard TT', bodyWeight:400, bodyStyle:'normal',
      fontSize:15, lineHeight:1.28, fill:'#161412', frameColor:null,
      justify:false, indent:0, indentFirst:false, contPara:false, upper:false, rows:false, charSp:0, titleAlign:'left', soft:0, minH:0, tintFill:false,
      textAlign:'left', objectCaching:false, editable:false, width:240,
    }, options || {});
    super(text, options);
    this.setControlsVisibility({tl:false, tr:false, bl:false, br:false, mt:false, mb:false});
    this.lockScalingFlip = true;
  }

  _padX(){ return this.padX != null ? this.padX : (this.frame === 'none' ? 0 : (this.frame === 'rules' ? 0 : 11)); }
  _padY(){ return this.padY != null ? this.padY : (this.frame === 'none' ? 0 : (this.frame === 'rules' ? 7 : 9)); }
  _bodyFontStr(){ return newsFontStr(this.bodyStyle, this.bodyWeight, this.fontSize, this.bodyFont); }
  _titleFontStr(){ return newsFontStr('normal', this.frame === 'ad' ? 700 : (this.titleFont === 'Libre Franklin' ? 700 : 700), this.titleSize, this.titleFont); }
  _titleCs(){ return this.titleFont === 'Libre Franklin' ? 110 : (this.frame === 'ad' ? 20 : 60); }

  initDimensions(){
    if (!this.initialized) return;
    const W = Math.max(30, this.width), px = this._padX(), py = this._padY();
    const innerW = Math.max(10, W - 2*px);
    const lh = this.fontSize * this.lineHeight;
    const nb = this._nb = {px, py, innerW, lh, title:null, titleH:0, lines:[], rows:null};
    // título
    if (this.title){
      const tm = newsMeasure(this._titleFontStr(), this._titleCs());
      const tt = this.frame === 'ad' ? this.title : this.title.toUpperCase();
      const tl = newsBreakLines(tt, tm, innerW).map(l=>l.t);
      const tlh = this.titleSize * (this.frame === 'ad' ? 1.12 : 1.25);
      nb.title = {lines: tl, lh: tlh};
      nb.titleH = tl.length * tlh + (this.frame === 'bar' ? this.titleSize*0.9 : (this.frame === 'ad' ? 7 : 8));
      if (this.frame === 'bar') nb.titleH = tl.length*tlh + this.titleSize*0.9;
    }
    // corpo
    const text = this.upper ? String(this.text||'').toUpperCase() : String(this.text||'');
    if (this.rows === 'wrap' || this.rows === 'defs' || this.rows === 'ribbon'){
      this._layoutTable(text, innerW, lh, nb);
    } else if (this.rows){
      nb.rows = text.split('\n').filter(s=>s.trim().length).map(s=>{ const k = s.indexOf('|'); return k < 0 ? [s, ''] : [s.slice(0,k).trim(), s.slice(k+1).trim()]; });
      nb.bodyH = nb.rows.length * lh;
    } else {
      const m = newsMeasure(this._bodyFontStr(), this.charSp);
      nb.lines = newsBreakLines(text, m, innerW, {indent:this.indent, indentFirst:this.indentFirst});
      nb.bodyH = nb.lines.length * lh;
    }
    const bar = this.frame === 'bar', rules = this.frame === 'rules';
    nb.bodyTopOff = bar ? nb.titleH + py : py + nb.titleH + (rules && nb.title ? 4 : 0) + (rules && !nb.title ? 4 : 0);
    this.height = Math.max(8, this.minH || 0, nb.bodyTopOff + nb.bodyH + py);   // minH: altura mínima (anúncios de uma mesma linha, com o texto no topo)
    this.dirty = true;
  }

  /* Tabelas com texto que quebra de linha (linhas `chave|texto`). rows:'wrap' = coluna da chave à esquerda (largura da maior chave,
     no máximo 42%) e o texto quebrado ao lado, com fio fino entre as entradas; rows:'defs' = a chave em negrito numa linha e o texto
     quebrado embaixo, na largura toda. (rows:true continua sendo a linha única com pontilhado.) */
  _layoutTable(text, innerW, lh, nb){
    const mode = this.rows, fs = this.fontSize;
    const mB = newsMeasure(newsFontStr(this.bodyStyle, 700, fs, this.bodyFont), this.charSp), m = newsMeasure(this._bodyFontStr(), this.charSp);
    const ents = text.split('\n').filter(s=>s.trim().length).map(s=>{ const k = s.indexOf('|'); return k < 0 ? [s.trim(), ''] : [s.slice(0, k).trim(), s.slice(k+1).trim()]; });
    if (mode === 'ribbon'){   // linha do tempo horizontal: um trilho com um ponto por entrada, o ano em negrito e o texto quebrado embaixo
      const n = Math.max(1, ents.length), cw = innerW/n;
      let hmax = 1;
      const cells = ents.map((e, i)=>{ const vl = e[1] ? newsBreakLines(e[1], m, cw - 14).map(l=>l.t) : []; hmax = Math.max(hmax, 1 + vl.length); return {kl:[e[0]], vl, x:i*cw}; });
      nb.table = {mode, cw, ents:cells, rail:15}; nb.bodyH = 15 + hmax*lh;
      return;
    }
    let keyW = 0;
    if (mode === 'wrap'){ ents.forEach(e=>{ keyW = Math.max(keyW, mB(e[0])); }); keyW = Math.min(keyW + 10, innerW*0.42); }
    const gap = mode === 'defs' ? lh*0.42 : lh*0.2;
    let Hh = 0;
    const out = ents.map((e, i)=>{
      const kl = newsBreakLines(e[0], mB, mode === 'wrap' ? keyW - 8 : innerW).map(l=>l.t);
      const vl = e[1] ? newsBreakLines(e[1], m, mode === 'wrap' ? innerW - keyW : innerW).map(l=>l.t) : [];
      const n = mode === 'wrap' ? Math.max(kl.length, vl.length, 1) : kl.length + vl.length;
      const rec = {kl, vl, y:Hh}; Hh += n*lh + (i < ents.length - 1 ? gap : 0); return rec;
    });
    nb.table = {mode, keyW, ents:out, gap}; nb.bodyH = Hh;
  }

  _render(ctx){
    if (!this._nb) this.initDimensions();
    const nb = this._nb, W = this.width, H = this.height, x0 = -W/2, y0 = -H/2, ink = this.fill || '#161412', fc = this.frameColor || ink;
    ctx.save();
    if (this.soft > 0 && 'filter' in ctx){   // tinta que "espalha" (scan/fotocópia): desfoque leve em unidades de página, igual em qualquer zoom
      const tt = ctx.getTransform();
      ctx.filter = 'blur(' + (this.soft*(Math.hypot(tt.a, tt.b) || 1)).toFixed(2) + 'px)';
    }
    ctx.textBaseline = 'alphabetic';
    const setCs = (px)=>{ if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; };
    // moldura
    ctx.strokeStyle = fc; ctx.fillStyle = fc;
    if (this.tintFill){ ctx.save(); ctx.globalAlpha *= 0.13; ctx.fillRect(x0, y0, W, H); ctx.restore(); }   // fundo cinza de retícula atrás de qualquer moldura (ex.: faixa preta no título)
    if (this.frame === 'box'){ ctx.lineWidth = 1.6; ctx.strokeRect(x0+0.8, y0+0.8, W-1.6, H-1.6); }
    else if (this.frame === 'bar'){ ctx.fillRect(x0, y0, W, nb.titleH); ctx.lineWidth = 1.4; ctx.strokeRect(x0+0.7, y0+0.7, W-1.4, H-1.4); }
    else if (this.frame === 'ad'){ ctx.lineWidth = 2.6; ctx.strokeRect(x0+1.3, y0+1.3, W-2.6, H-2.6); ctx.lineWidth = 0.9; ctx.strokeRect(x0+6, y0+6, W-12, H-12); }
    else if (this.frame === 'rules'){ ctx.fillRect(x0, y0, W, 2.6); ctx.fillRect(x0, y0+5.2, W, 0.9); ctx.fillRect(x0, y0+H-1.1, W, 1.1); }
    else if (this.frame === 'tint'){   // caixa com fundo cinza (retícula) e filete grosso em cima
      ctx.save(); ctx.globalAlpha *= 0.13; ctx.fillRect(x0, y0, W, H); ctx.restore();
      ctx.lineWidth = 1; ctx.strokeRect(x0+0.5, y0+0.5, W-1, H-1); ctx.fillRect(x0, y0, W, 3.4);
    }
    // título
    const prevOp = ctx.globalCompositeOperation;
    if (nb.title){
      // título claro sobre a faixa preta: com multiply sumiria; só o título volta pro modo normal
      if (this.frame === 'bar') ctx.globalCompositeOperation = 'source-over';
      ctx.font = this._titleFontStr();
      setCs(this._titleCs()/1000*this.titleSize);
      const base = (i)=> (this.frame === 'bar' ? y0 + this.titleSize*0.45 : y0 + nb.py + (this.frame === 'rules' ? 4 : 0)) + i*nb.title.lh + this.titleSize*(0.95);
      nb.title.lines.forEach((l, i)=>{
        const w = ctx.measureText(l).width;
        let x = x0 + nb.px;
        if (this.frame === 'ad' || this.titleAlign === 'center') x = x0 + (W - w)/2;
        ctx.fillStyle = this.frame === 'bar' ? (this.titleFill || '#f4f1e8') : ink;
        ctx.fillText(l, x, base(i));
      });
      setCs(0);
      ctx.globalCompositeOperation = prevOp;
      if (this.frame === 'box' || this.frame === 'rules' || this.frame === 'tint'){
        const ry = y0 + nb.py + (this.frame === 'rules' ? 4 : 0) + nb.title.lines.length*nb.title.lh + 1;
        ctx.fillStyle = fc; ctx.fillRect(x0 + nb.px, ry, nb.innerW, 0.9);
      }
    }
    // corpo
    const top = y0 + nb.bodyTopOff;
    const asc = this.fontSize*(0.8 + (this.lineHeight-1)/2);
    ctx.font = this._bodyFontStr();
    ctx.fillStyle = ink;
    setCs(this.charSp/1000*this.fontSize);
    if (nb.table){
      const T = nb.table, boldFont = newsFontStr(this.bodyStyle, 700, this.fontSize, this.bodyFont);
      if (T.mode === 'ribbon'){
        const ry = top + 6;
        ctx.fillRect(x0 + nb.px, ry - 1.1, nb.innerW, 2.2);
        T.ents.forEach(e=>{
          const cx = x0 + nb.px + e.x;
          ctx.beginPath(); ctx.arc(cx + 5, ry, 4.6, 0, 6.2832); ctx.fill();
          ctx.font = boldFont; ctx.fillText(e.kl[0], cx, top + T.rail + asc);
          ctx.font = this._bodyFontStr();
          e.vl.forEach((l, j)=>ctx.fillText(l, cx, top + T.rail + (1 + j)*nb.lh + asc));
        });
      } else T.ents.forEach((e, i)=>{
        const yt = top + e.y;
        if (T.mode === 'wrap' && i){ ctx.save(); ctx.globalAlpha *= 0.4; ctx.fillRect(x0 + nb.px, yt - T.gap/2 - 0.35, nb.innerW, 0.7); ctx.restore(); }
        ctx.font = boldFont;
        e.kl.forEach((l, j)=>ctx.fillText(l, x0 + nb.px, yt + j*nb.lh + asc));
        ctx.font = this._bodyFontStr();
        e.vl.forEach((l, j)=>{
          if (T.mode === 'wrap') ctx.fillText(l, x0 + nb.px + T.keyW, yt + j*nb.lh + asc);
          else ctx.fillText(l, x0 + nb.px, yt + (e.kl.length + j)*nb.lh + asc);
        });
      });
    } else if (nb.rows){
      nb.rows.forEach((r, i)=>{
        const y = top + i*nb.lh + asc, wl = ctx.measureText(r[0]).width, wr = ctx.measureText(r[1]).width;
        ctx.fillText(r[0], x0 + nb.px, y);
        if (r[1]) ctx.fillText(r[1], x0 + nb.px + nb.innerW - wr, y);
        if (r[1]){
          const a = x0 + nb.px + wl + 6, b = x0 + nb.px + nb.innerW - wr - 6;
          if (b - a > 10){ ctx.save(); ctx.fillStyle = ink; ctx.globalAlpha *= 0.55; for (let x = a; x < b; x += 5) ctx.fillRect(x, y - this.fontSize*0.12, 1.3, 1.3); ctx.restore(); }
        }
      });
    } else {
      nb.lines.forEach((ln, i)=>{
        const y = top + i*nb.lh + asc;
        const ind = (ln.p && this.indent && (i > 0 || this.indentFirst)) ? this.indent : 0;
        let x = x0 + nb.px + ind, avail = nb.innerW - ind;
        const text = ln.t;
        const lastOfPara = ln.last && !(this.contPara && i === nb.lines.length - 1);
        if (this.justify && !lastOfPara && text.indexOf(' ') > 0){
          const words = text.split(' '), sp = ctx.measureText(' ').width;
          const wsum = words.reduce((a, w)=>a + ctx.measureText(w).width, 0);
          const gap = (avail - wsum)/(words.length - 1);
          if (gap >= sp*0.85 && gap <= sp*1.7){
            let xx = x; words.forEach(w=>{ ctx.fillText(w, xx, y); xx += ctx.measureText(w).width + gap; });
            return;
          }
        }
        let tx = x;
        if (this.textAlign === 'center') tx = x0 + (W - ctx.measureText(text).width)/2;
        else if (this.textAlign === 'right') tx = x0 + W - nb.px - ctx.measureText(text).width;
        ctx.fillText(text, tx, y);
      });
    }
    setCs(0);
    ctx.restore();
  }

  newsOptions(){
    const o = {};
    ['width','title','frame','padX','padY','titleSize','titleFont','bodyFont','bodyWeight','bodyStyle','fontSize','lineHeight','fill','frameColor','titleFill','justify','indent','indentFirst','contPara','upper','rows','charSp','titleAlign','textAlign','soft','minH','tintFill']
      .forEach(k=>{ o[k] = this[k]; });
    return o;
  }
  toObject(props){
    return Object.assign(super.toObject(props), this.newsOptions());
  }
}
fabric.classRegistry.setClass(NewsBox, 'NewsBox');
