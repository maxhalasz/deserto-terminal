/* ===================== Motor de layout do jornal =====================
   Portado da v2 (canvas puro) pra gerar OBJETOS Fabric em vez de desenhar direto —
   mesma lógica de distribuição proporcional de linhas por coluna, kicker,
   pull-quote, caixa lateral, foto de banner/coluna. A v3 tinha perdido isso
   (virou 5 Textbox soltos sem coluna nenhuma) — Max notou e pediu de volta. */
// let em vez de const: cada template define o tamanho de página certo pra ele
// (retrato A4, página dupla em paisagem, tela de terminal, cartão de crachá) via
// applyPageSize() em editor.js. O resto deste arquivo lê PAGE_W/PAGE_H no momento
// do uso (nunca guarda cópia), então continua funcionando sem mudança nenhuma —
// o jornal sempre chama applyPageSize('newspaper') antes de montar o layout.
let PAGE_W = 1240, PAGE_H = 1754;

const SIZE_FRAC = {P:0.16, M:0.27, G:0.42};
const BANNER_H = {P:150, M:220, G:300};
const PQ_HEIGHT = 190;
const SIDEBAR_HEIGHT = 210;

const NEWS_PRESETS = {
  p1: {label:'Foto topo (larga)', nCols:3, banner:{enabled:true,size:'G'}, photoA:{enabled:false,size:'M',col:1,pos:'top'}, photoB:{enabled:false,size:'M',col:0,pos:'bottom'}, pullquote:{enabled:false,col:2}, sidebarBox:{enabled:false,col:2}},
  p2: {label:'Foto lateral', nCols:3, banner:{enabled:false,size:'M'}, photoA:{enabled:true,size:'G',col:2,pos:'top'}, photoB:{enabled:false,size:'M',col:0,pos:'bottom'}, pullquote:{enabled:false,col:2}, sidebarBox:{enabled:false,col:2}},
  p3: {label:'Duas fotos', nCols:4, banner:{enabled:false,size:'M'}, photoA:{enabled:true,size:'P',col:0,pos:'top'}, photoB:{enabled:true,size:'P',col:3,pos:'bottom'}, pullquote:{enabled:false,col:2}, sidebarBox:{enabled:false,col:2}},
  p4: {label:'Só texto (denso)', nCols:4, banner:{enabled:false,size:'M'}, photoA:{enabled:false,size:'M',col:1,pos:'top'}, photoB:{enabled:false,size:'M',col:0,pos:'bottom'}, pullquote:{enabled:true,col:2}, sidebarBox:{enabled:false,col:2}},
  p5: {label:'Rodapé + caixa', nCols:3, banner:{enabled:false,size:'M'}, photoA:{enabled:true,size:'M',col:1,pos:'bottom'}, photoB:{enabled:false,size:'M',col:0,pos:'bottom'}, pullquote:{enabled:false,col:2}, sidebarBox:{enabled:true,col:2}},
};

const _measureCanvas = document.createElement('canvas');
const _mctx = _measureCanvas.getContext('2d');

function wrapWordsFlat(text){
  const out = [];
  text.split(/\n+/).forEach((p,pi,arr)=>{
    p.split(/\s+/).filter(Boolean).forEach(w=>out.push(w));
    if (pi<arr.length-1) out.push('\n');
  });
  return out;
}
function countLinesForWidth(words, font, maxWidth){
  _mctx.font = font;
  let n=1, lineW=0;
  const sw = _mctx.measureText(' ').width;
  words.forEach(w=>{
    if (w==='\n'){ n++; lineW=0; return; }
    const ww = _mctx.measureText(w).width;
    if (lineW+sw+ww>maxWidth && lineW>0){ n++; lineW=ww; } else { lineW += (lineW>0?sw:0)+ww; }
  });
  return n;
}
function sliceWordsToLineBudget(words, startIdx, font, maxWidth, budget){
  let idx = startIdx, lines=0;
  const startLines = 0;
  while (lines < budget && idx < words.length){
    idx++;
    lines = countLinesForWidth(words.slice(startIdx, idx), font, maxWidth);
  }
  return idx;
}
function wordsToText(words){
  return words.map(w=>w==='\n' ? '\n' : w).join(' ').replace(/ \n /g,'\n').replace(/^\n | \n$/g,'');
}

function sizeToHeight(size, baseH){ return baseH*SIZE_FRAC[size]; }

/* Gera um placeholder de foto (mesmo estilo halftone do resto da ferramenta) como
   fabric.Image pronto pra entrar no canvas. */
async function makeColumnPhoto(x,y,w,h){
  return makePhotoPlaceholder({left:x, top:y, width:w, height:h});
}

/* content = {orgao,data,kicker,headline,subhead,byline,body,photo,pullquoteText,sidebarTitle,sidebarText,gothic}
   layoutCfg = {nCols,banner,photoA,photoB,pullquote,sidebarBox} (mesma forma dos presets)
   Retorna array de objetos fabric prontos (ainda não adicionados ao canvas). */
async function buildNewspaperObjects(content, layoutCfg){
  const c = content, L = layoutCfg;
  const M = 74;
  const objs = [];
  const bodyFont = `15px 'PT Serif'`;

  const masthead = new fabric.Textbox(c.orgao||'', {
    left:PAGE_W/2, top:52, originX:'center', width:PAGE_W-160, textAlign:'center',
    fontFamily: c.gothic ? "'UnifrakturCook'" : "'Playfair Display'",
    fontWeight: c.gothic ? 700 : 900, fontSize: c.gothic?60:52, fill:'#181410',
  });
  objs.push(masthead);

  const ruleTop = new fabric.Line([M,116,PAGE_W-M,116], {stroke:'#181410', strokeWidth:2.4, selectable:true});
  const ruleTop2 = new fabric.Line([M,122,PAGE_W-M,122], {stroke:'#181410', strokeWidth:1});
  objs.push(ruleTop, ruleTop2);

  const dateL = new fabric.Textbox((c.data||'').toUpperCase(), {left:M, top:134, width:500, fontFamily:"'PT Serif'", fontSize:12, fill:'#181410'});
  const dateR = new fabric.Textbox('EXEMPLAR ÚNICO', {left:PAGE_W-M-260, top:134, width:260, textAlign:'right', fontFamily:"'PT Serif'", fontSize:12, fill:'#181410'});
  objs.push(dateL, dateR);

  let y = 168;
  if (c.kicker){
    const kick = new fabric.Textbox(c.kicker.toUpperCase(), {left:M, top:y, width:PAGE_W-M*2, fontFamily:"'Courier Prime'", fontWeight:700, fontSize:15, fill:'#8a2020'});
    objs.push(kick);
    y += 26;
  }

  _mctx.font = `900 42px 'Playfair Display'`;
  const hlLines = countLinesForWidth(wrapWordsFlat((c.headline||'').toUpperCase()), `900 42px 'Playfair Display'`, PAGE_W-M*2);
  const headline = new fabric.Textbox((c.headline||'').toUpperCase(), {left:M, top:y, width:PAGE_W-M*2, fontFamily:"'Playfair Display'", fontWeight:900, fontSize:42, fill:'#181410', lineHeight:1.05});
  objs.push(headline);
  y += hlLines*46 + 16;

  const sub = new fabric.Textbox(c.subhead||'', {left:M, top:y, width:PAGE_W-M*2, fontFamily:"'PT Serif'", fontStyle:'italic', fontSize:19, fill:'#181410'});
  objs.push(sub);
  _mctx.font = `italic 19px 'PT Serif'`;
  const subLines = countLinesForWidth(wrapWordsFlat(c.subhead||''), `italic 19px 'PT Serif'`, PAGE_W-M*2);
  y += Math.max(1,subLines)*24 + 10;

  const ruleMid = new fabric.Line([M,y,PAGE_W-M,y], {stroke:'#181410', strokeWidth:1.6});
  objs.push(ruleMid);
  y += 20;

  const byline = new fabric.Textbox((c.byline||'').toUpperCase(), {left:M, top:y, width:PAGE_W-M*2, fontFamily:"'PT Serif'", fontSize:12, fill:'#181410'});
  objs.push(byline);
  y += 28;

  let usedCaption = false;
  if (L.banner.enabled){
    const bh = BANNER_H[L.banner.size];
    const bannerPhoto = await makeColumnPhoto(M, y, PAGE_W-M*2, bh);
    objs.push(bannerPhoto);
    y += bh + 10;
    if (c.photo){
      const cap = new fabric.Textbox(c.photo, {left:M, top:y, width:PAGE_W-M*2, fontFamily:"'PT Serif'", fontStyle:'italic', fontSize:12.5, fill:'#181410'});
      objs.push(cap);
      _mctx.font = `italic 12.5px 'PT Serif'`;
      y += countLinesForWidth(wrapWordsFlat(c.photo), `italic 12.5px 'PT Serif'`, PAGE_W-M*2)*15 + 10;
      usedCaption = true;
    }
  }
  const contentTop = y;

  const colGap = 26;
  const nCols = Math.max(2, Math.min(4, L.nCols));
  const colW = (PAGE_W-M*2-colGap*(nCols-1))/nCols;
  const baseColH = PAGE_H-90-contentTop;

  const photos = [];
  if (L.photoA.enabled) photos.push(Object.assign({}, L.photoA, {col: Math.min(L.photoA.col, nCols-1)}));
  if (L.photoB.enabled) photos.push(Object.assign({}, L.photoB, {col: Math.min(L.photoB.col, nCols-1)}));
  const pqCol = L.pullquote.enabled ? Math.min(L.pullquote.col, nCols-1) : -1;
  const sbCol = L.sidebarBox.enabled ? Math.min(L.sidebarBox.col, nCols-1) : -1;
  const topPhotoOf = c2 => photos.find(p=>p.col===c2 && p.pos==='top');
  const botPhotoOf = c2 => photos.find(p=>p.col===c2 && p.pos==='bottom');

  const reserved = new Array(nCols).fill(0);
  for (let c2=0;c2<nCols;c2++){
    const tp = topPhotoOf(c2); if (tp) reserved[c2]+= sizeToHeight(tp.size, baseColH)+38;
    const bp = botPhotoOf(c2); if (bp) reserved[c2]+= sizeToHeight(bp.size, baseColH)+38;
    if (pqCol===c2) reserved[c2]+=PQ_HEIGHT;
    if (sbCol===c2) reserved[c2]+=SIDEBAR_HEIGHT;
  }
  const colAvail = reserved.map(r=>Math.max(80, baseColH-r));
  const totalAvail = colAvail.reduce((a,b)=>a+b,0);

  const bodyWords = wrapWordsFlat(c.body||'');
  const totalLines = countLinesForWidth(bodyWords, bodyFont, colW);
  const linesFor = colAvail.map(h => Math.max(1, Math.round(totalLines*h/totalAvail)));

  let wi = 0;
  for (let col=0; col<nCols; col++){
    const cx = M + col*(colW+colGap);
    let cy = contentTop;

    const tp = topPhotoOf(col);
    if (tp){
      const ph = sizeToHeight(tp.size, baseColH);
      const photo = await makeColumnPhoto(cx, cy, colW, ph);
      objs.push(photo);
      cy += ph + 8;
      if (!usedCaption && c.photo){
        const cap = new fabric.Textbox(c.photo, {left:cx, top:cy, width:colW, fontFamily:"'PT Serif'", fontStyle:'italic', fontSize:11, fill:'#181410'});
        objs.push(cap);
        _mctx.font = `italic 11px 'PT Serif'`;
        cy += countLinesForWidth(wrapWordsFlat(c.photo), `italic 11px 'PT Serif'`, colW)*13 + 8;
        usedCaption = true;
      } else cy += 4;
    }
    if (pqCol===col){
      objs.push(...makePullquoteObjects(cx, cy, colW, c.pullquoteText));
      cy += PQ_HEIGHT + 8;
    }
    if (sbCol===col){
      objs.push(...makeSidebarBoxObjects(cx, cy, colW, SIDEBAR_HEIGHT, c.sidebarTitle, c.sidebarText));
      cy += SIDEBAR_HEIGHT + 10;
    }

    const startWi = wi;
    const budget = linesFor[col];
    wi = sliceWordsToLineBudget(bodyWords, startWi, bodyFont, colW, budget);
    const chunk = bodyWords.slice(startWi, wi);
    const chunkText = wordsToText(chunk);
    if (chunkText.trim()){
      const colText = new fabric.Textbox(chunkText, {left:cx, top:cy, width:colW, fontFamily:"'PT Serif'", fontSize:15, fill:'#181410', lineHeight:1.4});
      objs.push(colText);
    }

    const bp = botPhotoOf(col);
    if (bp){
      const ph = sizeToHeight(bp.size, baseColH);
      const bottomY = contentTop + baseColH - ph;
      const photo = await makeColumnPhoto(cx, Math.max(cy+10, bottomY), colW, ph);
      objs.push(photo);
      if (!usedCaption && c.photo){
        const capY = photo.top + ph + 8;
        const cap = new fabric.Textbox(c.photo, {left:cx, top:capY, width:colW, fontFamily:"'PT Serif'", fontStyle:'italic', fontSize:11, fill:'#181410'});
        objs.push(cap);
        usedCaption = true;
      }
    }

    if (col<nCols-1){
      const sep = new fabric.Line([cx+colW+colGap/2, contentTop, cx+colW+colGap/2, PAGE_H-90], {stroke:'rgba(24,20,16,0.35)', strokeWidth:1});
      objs.push(sep);
    }
  }

  if (wi < bodyWords.length){
    const jump = new fabric.Textbox('Continua na página 2 »', {left:PAGE_W-M-260, top:PAGE_H-78, width:260, textAlign:'right', fontFamily:"'PT Serif'", fontStyle:'italic', fontSize:11, fill:'#181410'});
    objs.push(jump);
  }
  const pageNum = new fabric.Textbox('— 1 —', {left:PAGE_W/2-60, top:PAGE_H-54, width:120, textAlign:'center', fontFamily:"'PT Serif'", fontSize:11, fill:'#181410'});
  objs.push(pageNum);

  // marca TODOS os objetos como gerados pelo motor de layout (pra rebuild limpo),
  // sem sobrescrever customType de objetos que já tinham um propósito próprio
  // (photoPlaceholder, stampText...) — bug real: antes, `o.customType||'newspaperPart'`
  // deixava as fotos com customType 'photoPlaceholder' de fora da limpeza no rebuild,
  // então trocar de preset só empilhava fotos novas em cima das antigas.
  objs.forEach(o=>{ o.__newsGenerated = true; if (!o.customType) o.set('customType','newspaperPart'); });
  return objs;
}

function makePullquoteObjects(x,y,w,text){
  const ruleA = new fabric.Line([x,y,x+w,y], {stroke:'#181410', strokeWidth:1.4});
  const ruleB = new fabric.Line([x,y+PQ_HEIGHT,x+w,y+PQ_HEIGHT], {stroke:'#181410', strokeWidth:1.4});
  const quoteMark = new fabric.Text('“', {left:x-4, top:y-6, fontFamily:"'Playfair Display'", fontWeight:900, fontSize:50, fill:'#181410'});
  const txt = new fabric.Textbox(text||'', {left:x+6, top:y+34, width:w-12, fontFamily:"'PT Serif'", fontStyle:'italic', fontWeight:700, fontSize:19, fill:'#181410', lineHeight:1.3});
  [ruleA,ruleB,quoteMark,txt].forEach(o=>o.set('customType','newspaperPart'));
  return [ruleA,ruleB,quoteMark,txt];
}
function makeSidebarBoxObjects(x,y,w,h,title,text){
  const rect = new fabric.Rect({left:x, top:y, width:w, height:h, fill:'transparent', stroke:'#181410', strokeWidth:2});
  const head = new fabric.Rect({left:x, top:y, width:w, height:26, fill:'#181410'});
  const headTxt = new fabric.Textbox((title||'MATÉRIA RELACIONADA').toUpperCase(), {left:x+8, top:y+6, width:w-16, fontFamily:"'Courier Prime'", fontWeight:700, fontSize:12.5, fill:'#efe9da'});
  const bodyTxt = new fabric.Textbox(text||'', {left:x+10, top:y+36, width:w-20, fontFamily:"'PT Serif'", fontSize:12.5, fill:'#181410', lineHeight:1.35});
  [rect,head,headTxt,bodyTxt].forEach(o=>o.set('customType','newspaperPart'));
  return [rect,head,headTxt,bodyTxt];
}
