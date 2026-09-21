/* ===================== Personas de letra manuscrita =====================
   Pesquisa (sessão de 2026-09-16): rotação + deriva de linha de base + variante de
   glifo são os 3 parâmetros que mais vendem "escrito à mão" (técnica strokes.js).
   Testei 23 fontes handwriting do Google Fonts lado a lado (mesma frase, mesmo
   tamanho) antes de decidir esta lista — Patrick Hand, Permanent Marker, Gochi Hand
   e Nanum Pen Script (usadas na v1) saíram por ficarem "de fonte" mesmo com jitter;
   as fontes abaixo já pareciam escrita à mão SEM NENHUM jitter, porque a
   irregularidade já está desenhada no glifo.

   Técnica de jitter (retunada nesta versão): passeio aleatório correlacionado em
   DOIS níveis — um por PALAVRA (amplitude maior, é o que mantém letras conectadas
   de uma fonte cursiva "coladas" sem parecer estilhaçadas) e um por CARACTERE em
   cima (amplitude menor, ~30% do nível de palavra, pra variação fina). Cortar uma
   fonte de traço conectado em glifos jitterados independentemente com amplitude
   igual à de palavra foi o que fazia Architects Daughter/Patrick Hand parecerem
   artificiais na v1, mesmo sendo fontes decentes. */
function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HANDWRITING_PERSONAS = {
  A: {label:'Rabisco nervoso', fonts:["'Caveat'","'Reenie Beanie'"], altChance:0.3, baseSize:30, slant:-0.045, shakiness:0.60, baselineAmp:3.2, baselineFreq:0.030, sizeVar:0.11, spacing:0.94, ink:[20,24,58], inkAlpha:0.88, inkVar:0.16},
  B: {label:'Letra redonda e calma', fonts:["'Homemade Apple'"], altChance:0, baseSize:23, slant:0.006, shakiness:0.15, baselineAmp:1.2, baselineFreq:0.018, sizeVar:0.035, spacing:1.05, ink:[12,12,18], inkAlpha:0.92, inkVar:0.05},
  C: {label:'Cursiva neta, um pouco apressada', fonts:["'Kalam'"], altChance:0, baseSize:26, slant:-0.015, shakiness:0.26, baselineAmp:1.9, baselineFreq:0.028, sizeVar:0.06, spacing:0.98, ink:[15,15,20], inkAlpha:0.9, inkVar:0.08},
  D: {label:'Técnica, letra de forma inclinada', fonts:["'Architects Daughter'"], altChance:0, baseSize:24, slant:-0.01, shakiness:0.24, baselineAmp:1.8, baselineFreq:0.026, sizeVar:0.055, spacing:1.0, ink:[18,18,22], inkAlpha:0.9, inkVar:0.08},
  E: {label:'Cursiva desgastada, difícil de ler', fonts:["'Cedarville Cursive'"], altChance:0, baseSize:29, slant:0.01, shakiness:0.34, baselineAmp:2.4, baselineFreq:0.024, sizeVar:0.08, spacing:0.9, ink:[24,20,18], inkAlpha:0.85, inkVar:0.12},
  F: {label:'Bouncy, irregular', fonts:["'Covered By Your Grace'"], altChance:0, baseSize:22, slant:0.02, shakiness:0.30, baselineAmp:2.6, baselineFreq:0.032, sizeVar:0.09, spacing:1.0, ink:[16,16,24], inkAlpha:0.88, inkVar:0.1},
  G: {label:'Casual, redondinha, calma', fonts:["'Neucha'"], altChance:0, baseSize:27, slant:-0.008, shakiness:0.18, baselineAmp:1.4, baselineFreq:0.02, sizeVar:0.05, spacing:1.0, ink:[14,14,16], inkAlpha:0.9, inkVar:0.07},
  H: {label:'Letra de criança/adolescente', fonts:["'Schoolbell'"], altChance:0, baseSize:24, slant:0.012, shakiness:0.28, baselineAmp:2.2, baselineFreq:0.03, sizeVar:0.08, spacing:1.02, ink:[20,20,45], inkAlpha:0.86, inkVar:0.1},
  I: {label:'Fina, trêmula, insegura', fonts:["'Waiting for the Sunrise'"], altChance:0, baseSize:25, slant:0.005, shakiness:0.40, baselineAmp:2.8, baselineFreq:0.034, sizeVar:0.10, spacing:0.95, ink:[15,15,18], inkAlpha:0.82, inkVar:0.14},
  J: {label:'Rabisco fino e rápido', fonts:["'Just Another Hand'"], altChance:0, baseSize:28, slant:-0.02, shakiness:0.36, baselineAmp:2.6, baselineFreq:0.03, sizeVar:0.09, spacing:0.92, ink:[18,18,20], inkAlpha:0.87, inkVar:0.12},
  K: {label:'Redonda, meio impressa', fonts:["'Delius'"], altChance:0, baseSize:24, slant:0.0, shakiness:0.20, baselineAmp:1.5, baselineFreq:0.022, sizeVar:0.05, spacing:1.03, ink:[16,16,18], inkAlpha:0.9, inkVar:0.07},
  L: {label:'Brincalhona, tamanhos inconsistentes', fonts:["'Crafty Girls'"], altChance:0, baseSize:22, slant:0.015, shakiness:0.32, baselineAmp:2.4, baselineFreq:0.033, sizeVar:0.13, spacing:1.0, ink:[22,18,40], inkAlpha:0.85, inkVar:0.11},
  M: {label:'Cursiva fina e conectada', fonts:["'Shadows Into Light'"], altChance:0, baseSize:26, slant:-0.006, shakiness:0.22, baselineAmp:1.7, baselineFreq:0.024, sizeVar:0.05, spacing:0.98, ink:[15,15,15], inkAlpha:0.88, inkVar:0.08},
};
const HANDWRITING_PERSONA_LIST = Object.entries(HANDWRITING_PERSONAS).map(([id,p])=>({id, label:p.label}));

function correlatedWalk(prev, amp, inertia, rng){
  return prev*inertia + (rng()*2-1)*amp*(1-inertia);
}

/* fabric.HandwrittenText — Textbox que troca o desenho interno de glifo pelo motor
   de jitter em dois níveis (palavra + caractere), mantendo alças de seleção/mover/
   redimensionar nativas do Fabric (só o _render muda). */
class HandwrittenText extends fabric.Textbox {
  static type = 'HandwrittenText';

  constructor(text, options){
    options = options || {};
    super(text, Object.assign({
      fontFamily: "'Caveat'",
      fontSize: 30,
      fill: '#141a3a',
      editable: false,
    }, options));
    this.personaId = options.personaId || 'A';
    this.fatigue = options.fatigue !== undefined ? options.fatigue : true;
    this.seed = options.seed || Math.floor(Math.random()*4294967296);
  }

  _render(ctx){
    const persona = HANDWRITING_PERSONAS[this.personaId] || HANDWRITING_PERSONAS.A;
    const rng = mulberry32(this.seed);
    const w = this.width, h = this.height;
    const x0 = -w/2, y0 = -h/2;
    const maxWidth = w;
    const lineHeight = persona.baseSize * 1.5;
    // matriz local->página, pra amostrar o campo de dobra do papel na posição real
    // de cada caractere (não a posição dentro da caixa de texto) — pesquisado:
    // é o mesmo princípio do Displacement Map do Photoshop.
    const foldMatrix = (typeof this.calcTransformMatrix==='function') ? this.calcTransformMatrix() : null;
    const hasFold = foldMatrix && typeof sampleFoldSlope==='function' && typeof currentFoldField!=='undefined' && currentFoldField;

    // Pauta do papel: se o fundo tem linhas azuis detectadas (computeRuledLines
    // em editor.js) e o objeto não está rotacionado, cada quebra de linha gruda
    // na próxima linha da pauta em vez de usar lineHeight fixo. Sem rotação a
    // conversão local<->página é só translação+escala (this.top/this.scaleY já
    // são page-space) — não precisa inverter matriz. Objeto rotacionado cai no
    // comportamento antigo (limite consciente: bilhete manuscrito na prática não
    // é usado rotacionado).
    const scaleX = this.scaleX || 1, scaleY = this.scaleY || 1;
    const hasRuled = typeof currentRuledLines!=='undefined' && currentRuledLines && Math.abs(this.angle||0) < 0.5;
    const localToPageY = localY => this.top + (localY - y0)*scaleY;
    const pageToLocalY = pageY => (pageY - this.top)/scaleY + y0;
    const localToPageX = localX => this.left + (localX - x0)*scaleX;
    // Pauta agora dá uma inclinação PRÓPRIA por linha (computeRuledLines em
    // editor.js) — o índice de linha vira estado incremental (lineIdx) em vez de
    // recalculado a cada avanço a partir de Y: assim não tem risco de uma leve
    // deriva real de espaçamento acumular erro e o texto pular/repetir uma linha
    // no meio do bilhete.
    let lineIdx = hasRuled ? lineIdxNearest(localToPageY(y0 + lineHeight*0.8)) : 0;
    const advanceLine = ()=>{
      if (!hasRuled) return cy + lineHeight;
      lineIdx += 1;
      return pageToLocalY(lineAt(lineIdx).y);
    };

    const paragraphs = (this.text||'').split(/\n+/).filter(p=>p.trim().length);
    let cy = hasRuled ? pageToLocalY(lineAt(lineIdx).y) : y0 + lineHeight*0.8;
    // Levanta o traço um pouco acima da linha detectada em vez de deixar a
    // linha de base do glifo cravada no centro do traço azul (Max: "parece estar
    // seguindo o centro das linhas, não escrevendo acima delas") — aplicado só no
    // translate de desenho (abaixo), nunca em cy/lineIdx, pra não interferir na
    // matemática de índice de linha.
    const baselineLift = hasRuled ? persona.baseSize * 0.32 : 0;

    ctx.save();
    ctx.textBaseline = 'alphabetic';

    paragraphs.forEach((p, pi)=>{
      const fatigueT = this.fatigue ? pi/Math.max(1,paragraphs.length-1) : 0;
      const shake = persona.shakiness * (1+fatigueT*0.7);
      const sizeVarAmt = persona.sizeVar * (1+fatigueT*0.5);
      const baselineAmp = hasRuled ? persona.baselineAmp*0.5 : persona.baselineAmp;
      let wjr=0, wjy=0, wjs=0;
      let cx = x0;
      const words = p.split(/\s+/).filter(Boolean);
      ctx.font = `${persona.baseSize}px ${persona.fonts[0]}`;
      const spaceW = ctx.measureText(' ').width*persona.spacing;

      words.forEach(word=>{
        ctx.font = `${persona.baseSize}px ${persona.fonts[0]}`;
        const wWidth = ctx.measureText(word).width*persona.spacing;
        if (cx+wWidth > x0+maxWidth && cx>x0){ cy = advanceLine(); cx = x0; }

        wjr = correlatedWalk(wjr, shake*0.09, 0.55, rng);
        wjy = correlatedWalk(wjy, shake*2.6, 0.55, rng);
        wjs = correlatedWalk(wjs, sizeVarAmt*0.7, 0.5, rng);

        let ccx = cx;
        for (const ch of word){
          const cjr = wjr + correlatedWalk(0, shake*0.035, 0, rng);
          const cjy = wjy + correlatedWalk(0, shake*1.1, 0, rng);
          const cjs = wjs + correlatedWalk(0, sizeVarAmt*0.3, 0, rng);
          const useAlt = persona.fonts.length>1 && rng()<persona.altChance;
          const sz = persona.baseSize*(1+cjs);
          ctx.font = `${sz.toFixed(1)}px ${useAlt?persona.fonts[1]:persona.fonts[0]}`;
          const cw = ctx.measureText(ch).width;
          const wave = Math.sin((ccx-x0)*persona.baselineFreq)*baselineAmp;
          const [ir,ig,ib] = persona.ink;
          const ia = Math.max(0.35, Math.min(1, persona.inkAlpha*(0.85+(rng()-0.5)*persona.inkVar*1.6)));

          let foldRot = 0, foldDy = 0;
          if (hasFold){
            const pagePt = fabric.util.transformPoint({x: ccx+cw/2, y: cy+cjy+wave}, foldMatrix);
            const slope = sampleFoldSlope(pagePt.x, pagePt.y);
            foldRot = slope.dx * 0.9;
            // Amortecido bem forte quando colado na pauta: o campo de dobra reage ao
            // RELEVO da foto (sombra de vinco), a pauta reage à TINTA azul — numa foto
            // muito amassada os dois brigavam (foldDy arrancava a letra da linha
            // exatamente nas dobras mais fortes). A rotação (foldRot) é discreta e não
            // atrapalha, então só o deslocamento vertical é reduzido aqui.
            foldDy = slope.dy * 14 * (hasRuled ? 0.15 : 1);
          }
          // Inclinação da PRÓPRIA linha (cada linha tem a sua, não uma só pra página
          // inteira — computeRuledLines casa left/mid/right linha a linha) — desloca
          // cada caractere conforme sua posição X real, igual o `wave` já faz, pra a
          // linha desenhada seguir a leve diagonal real em vez de ficar sempre
          // perfeitamente horizontal.
          let tiltDy = 0;
          if (hasRuled){
            const lineSlope = lineAt(lineIdx).slope;
            if (lineSlope) tiltDy = lineSlope * (localToPageX(ccx+cw/2) - currentRuledLines.refX) / scaleY;
          }

          ctx.save();
          ctx.translate(ccx+cw/2, cy+cjy+wave+foldDy+tiltDy-baselineLift);
          ctx.rotate(persona.slant+cjr+foldRot);
          // segundo traço bem sutil, deslocado, opacidade baixa — simula tinta
          // absorvida na fibra do papel (pincelada dupla em vez de glifo chapado).
          ctx.fillStyle = `rgba(${ir},${ig},${ib},${(ia*0.35).toFixed(2)})`;
          ctx.fillText(ch, -cw/2 + (rng()-0.5)*0.7, (rng()-0.5)*0.6);
          ctx.fillStyle = `rgba(${ir},${ig},${ib},${ia})`;
          ctx.fillText(ch, -cw/2, 0);
          ctx.restore();
          ccx += cw*persona.spacing;
        }
        cx = ccx + spaceW;
      });
      cy = advanceLine();
    });

    ctx.restore();
    this.height = Math.max(this.height, cy - y0 + lineHeight*0.3);
  }

  toObject(props){
    return Object.assign(super.toObject(props), {personaId:this.personaId, fatigue:this.fatigue, seed:this.seed});
  }
}
fabric.classRegistry.setClass(HandwrittenText, 'HandwrittenText');

/* ===================== fabric.RedactedText =====================
   Texto datilografado com censura por palavra (barras pretas) — reaproveita o
   algoritmo já validado na v1 (pickRedactIndices), agora como objeto Fabric
   movível/redimensionável como qualquer outro. */
class RedactedText extends fabric.Textbox {
  static type = 'RedactedText';

  constructor(text, options){
    options = options || {};
    super(text, Object.assign({
      fontFamily: "'Courier Prime'",
      fontSize: 16,
      fill: '#141414',
      lineHeight: 1.5,
      editable: false,
    }, options));
    this.redactPct = options.redactPct !== undefined ? options.redactPct : 28;
    this.seed = options.seed || Math.floor(Math.random()*4294967296);
  }

  _pickRedactIndices(n, rng){
    const p = Math.max(0, Math.min(0.85, this.redactPct/100));
    const count = Math.max(0, Math.round(n*p));
    const s = new Set();
    let guard=0;
    while (s.size<count && guard<n*4){ s.add(Math.floor(rng()*n)); guard++; }
    return s;
  }

  _render(ctx){
    const rng = mulberry32(this.seed);
    const w = this.width, h = this.height;
    const x0 = -w/2, y0 = -h/2;
    const lineHeight = this.fontSize*this.lineHeight;
    ctx.save();
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.fillStyle = this.fill;
    ctx.textBaseline = 'alphabetic';

    const words = [];
    (this.text||'').split(/\n+/).forEach((p,pi,arr)=>{
      p.split(/\s+/).filter(Boolean).forEach(w=>words.push(w));
      if (pi<arr.length-1) words.push('\n');
    });
    const redact = this._pickRedactIndices(words.filter(w=>w!=='\n').length, rng);

    let cx=x0, cy=y0+this.fontSize, wi=0;
    const spaceW = ctx.measureText(' ').width;
    const bars = [];
    words.forEach(word=>{
      if (word==='\n'){ cy+=lineHeight; cx=x0; return; }
      const ww = ctx.measureText(word).width;
      if (cx+ww>x0+w && cx>x0){ cy+=lineHeight; cx=x0; }
      if (redact.has(wi)){
        bars.push({x:cx,y:cy,w:ww});
      } else {
        ctx.fillText(word, cx, cy);
      }
      cx += ww+spaceW;
      wi++;
    });
    ctx.fillStyle = '#0a0a0a';
    bars.forEach(b=>ctx.fillRect(b.x-1, b.y-this.fontSize*0.78, b.w+2, this.fontSize*0.92));
    ctx.restore();
    this.height = Math.max(this.height, cy-y0+lineHeight*0.5);
  }

  toObject(props){
    return Object.assign(super.toObject(props), {redactPct:this.redactPct, seed:this.seed});
  }
}
fabric.classRegistry.setClass(RedactedText, 'RedactedText');

/* ===================== Carimbo (texto editável + borda que se ajusta sozinha) =====================
   fabric.IText em vez de Textbox: cresce/encolhe com o texto (não quebra linha numa
   largura fixa), e como não sobrescreve _render() o cursor nativo do Fabric funciona
   certo — dá pra editar clicando duas vezes direto, sem precisar do modal. A borda é
   um Rect separado (não-selecionável) que se recalcula sozinho a cada mudança. */
function makeStampObjects(text, options){
  options = options || {};
  const color = options.color || '#7a2020';
  const fontSize = options.fontSize || 30;
  const angle = options.angle || -10;
  const padX = 22, padY = 16;

  const txt = new fabric.IText(text, {
    fontFamily:"'Courier Prime'", fontWeight:'700', fontSize, fill:color,
    left: options.left||400, top: options.top||400, angle,
    originX:'center', originY:'center', textAlign:'center',
  });
  const rect = new fabric.Rect({
    left: txt.left, top: txt.top, angle,
    width: txt.width+padX*2, height: txt.height+padY*2,
    fill:'transparent', stroke:color, strokeWidth:3,
    originX:'center', originY:'center', selectable:false, evented:false,
  });
  txt.set('customType','stampText');
  rect.set('customType','stampBorder');

  const sync = ()=>{
    rect.set({width:txt.width+padX*2, height:txt.height+padY*2, left:txt.left, top:txt.top, angle:txt.angle});
    rect.setCoords();
  };
  txt.on('changed', sync);
  txt.on('moving', sync);
  txt.on('rotating', sync);
  txt.on('scaling', sync);
  txt.__stampRect = rect;
  return [rect, txt];
}

/* ===================== Código de barras (pré-renderizado como imagem) ===================== */
function makeBarcodeImage(options){
  options = options || {};
  const w = options.width||260, h = options.height||60;
  const rng = mulberry32(options.seed || Math.floor(Math.random()*4294967296));
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle = '#111';
  let x=2;
  while (x<w-2){
    const bw = 1+rng()*4;
    if (rng()<0.55) ctx.fillRect(x,2,bw,h-4);
    x += bw+1+rng()*2.5;
  }
  return new Promise(resolve=>{
    fabric.Image.fromURL(c.toDataURL(), {crossOrigin:'anonymous'}).then(img=>{
      img.set({left:options.left||400, top:options.top||400});
      img.set('customType','barcode');
      resolve(img);
    });
  });
}
