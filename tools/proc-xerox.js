/* ===================== Efeito de scan / fotocópia ('xerox') =====================
   Pesquisado antes de escrever (receita comum de ferramentas de "scanner effect" e do Augraphy/BadPhotoCopy): o que faz um
   documento parecer escaneado é, nessa ordem, inclinação leve, contraste alto, grão fino, manchas de toner CONCENTRADAS em
   algumas áreas (não espalhadas por igual), faixas escuras nas bordas (o fundo do scanner aparecendo), riscos de varredura
   e, em jornal, o verso transparecendo. Aqui vira UMA camada por cima da página (ProcArt kind 'xerox', multiply):
     tone    luz do scanner: cantos e um dos lados mais escuros               (0–1)
     gutter  sombra de lombada (volume encadernado), lado em opts.side 'l'|'r' (0–1)
     ghost   verso transparecendo: linhas de texto e uma foto, ESPELHADAS     (0–1)
     speck   pontos de toner e fiapos, em manchas                              (0–1)
     streak  riscos horizontais da varredura e fios verticais de poeira        (0–1)
     bed     fundo preto do scanner fora do papel inclinado, borda irregular   (0–1)
     tilt    inclinação do papel em graus (o motor do jornal inclina o conteúdo no MESMO ângulo: newsTilt, news-docs.js)
     shift   deslocamento [dx, dy] do papel dentro do scanner
   O texto "mole" de tinta espalhada vem de NewsBox.soft (news-text.js), não daqui. Mesma semente = mesmo desgaste. */

function procXerox(g, w, h, a){
  const o = a.opts || {}, rng = _paRng(a.seed*53 + 7);
  const num = (k, d)=>o[k] != null ? +o[k] : d;
  const tone = num('tone', 0.5), speck = num('speck', 0.5), streak = num('streak', 0.5), ghost = num('ghost', 0.4), bed = num('bed', 0.7), gutter = num('gutter', 0), tilt = num('tilt', 0);
  const sh = o.shift || [3, 2], side = o.side === 'r' ? 'r' : 'l';
  const blk = (al)=>`rgba(0,0,0,${Math.max(0, Math.min(1, al)).toFixed(3)})`;
  const area = w*h/2.2e6;

  // 1) luz do scanner: cantos mais escuros e um lado mais escuro que o outro
  if (tone > 0){
    const v = g.createRadialGradient(w/2, h*0.46, Math.min(w, h)*0.3, w/2, h/2, Math.max(w, h)*0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, blk(0.17*tone)); g.fillStyle = v; g.fillRect(0, 0, w, h);
    const l = g.createLinearGradient(0, 0, w, 0);
    l.addColorStop(0, blk(side === 'l' ? 0.10*tone : 0.03*tone)); l.addColorStop(0.55, 'rgba(0,0,0,0)'); l.addColorStop(1, blk(side === 'l' ? 0.03*tone : 0.10*tone));
    g.fillStyle = l; g.fillRect(0, 0, w, h);
  }
  // 2) lombada: sombra larga que vem da dobra do volume
  if (gutter > 0){
    const gw = 110, x0 = side === 'r' ? w : 0, dir = side === 'r' ? -1 : 1, gr = g.createLinearGradient(x0, 0, x0 + dir*gw, 0);
    gr.addColorStop(0, blk(0.55*gutter)); gr.addColorStop(0.3, blk(0.2*gutter)); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(side === 'r' ? w - gw : 0, 0, gw, h);
  }
  // 3) verso transparecendo (espelhado, bem fraco): blocos de linhas de texto, títulos e uma foto
  if (ghost > 0){
    g.save(); g.translate(w, 0); g.scale(-1, 1);
    const blocks = 6;
    for (let b = 0; b < blocks; b++){
      const bw = 250 + rng()*330, bh = 150 + rng()*330, bx = 56 + rng()*(w - bw - 112), by = 130 + rng()*(h - bh - 260);
      g.fillStyle = blk(0.075*ghost); g.fillRect(bx, by - 26, bw*(0.5 + rng()*0.5), 15);   // título do bloco
      g.fillStyle = blk((0.045 + rng()*0.02)*ghost);
      for (let yy = by; yy < by + bh; yy += 8.4){
        let xx = bx; const end = bx + bw*(yy + 8.4 >= by + bh ? 0.4 + rng()*0.4 : 0.9 + rng()*0.1);
        while (xx < end){ const wl = 5 + rng()*24; g.fillRect(xx, yy, Math.min(wl, end - xx), 3.3); xx += wl + 3.6; }
      }
    }
    const px = 70 + rng()*(w - 480), py = 260 + rng()*(h - 700), pw = 300 + rng()*160, ph = 190 + rng()*110;
    const pg = g.createLinearGradient(px, py, px + pw, py + ph); pg.addColorStop(0, blk(0.12*ghost)); pg.addColorStop(1, blk(0.045*ghost));
    g.fillStyle = pg; g.fillRect(px, py, pw, ph);
    g.restore();
  }
  // 4) toner: pontos e fiapos, em manchas (60% perto de centros de mancha, o resto solto)
  if (speck > 0){
    const nC = 26, cs = [];
    for (let i = 0; i < nC; i++) cs.push([rng()*w, rng()*h, 30 + rng()*90]);
    const gauss = ()=>(rng() + rng() + rng() - 1.5)*0.9;
    const nS = Math.round(1250*speck*area);
    for (let i = 0; i < nS; i++){
      let x, y;
      if (rng() < 0.6){ const c = cs[(rng()*nC) | 0]; x = c[0] + gauss()*c[2]; y = c[1] + gauss()*c[2]; } else { x = rng()*w; y = rng()*h; }
      const r = 0.45 + Math.pow(rng(), 2.2)*1.7;
      g.fillStyle = blk(0.22 + rng()*0.55); g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
    }
    g.lineCap = 'round';
    for (let i = 0, n = Math.round(11*speck*area); i < n; i++){   // fiapos
      const x = rng()*w, y = rng()*h, len = 8 + rng()*30, ang = rng()*6.2832, bend = (rng() - 0.5)*len*0.8;
      g.strokeStyle = blk(0.18 + rng()*0.3); g.lineWidth = 0.5 + rng()*0.5;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(ang)*len*0.5 + bend, y + Math.sin(ang)*len*0.5 - bend, x + Math.cos(ang)*len, y + Math.sin(ang)*len); g.stroke();
    }
  }
  // 5) riscos: horizontais (varredura) e verticais (poeira no vidro)
  if (streak > 0){
    g.lineCap = 'butt';
    for (let i = 0, n = Math.round(10*streak); i < n; i++){
      const y = rng()*h, x0 = rng()*w*0.55, len = w*(0.25 + rng()*0.7);
      g.strokeStyle = blk(0.035 + rng()*0.07); g.lineWidth = 0.7 + rng()*1.1;
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + len, y + (rng() - 0.5)*1.5); g.stroke();
    }
    for (let i = 0, n = Math.max(1, Math.round(3*streak)); i < n; i++){
      const x = rng()*w, len = h*(0.35 + rng()*0.65), y0 = rng()*(h - len);
      g.strokeStyle = blk(0.03 + rng()*0.06); g.lineWidth = 0.8 + rng()*1.3;
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (rng() - 0.5)*2.5, y0 + len); g.stroke();
    }
  }
  // 6) fundo preto do scanner: tudo fora do retângulo do papel (inclinado e deslocado), com a borda irregular e uma sombra curta pra dentro
  if (bed > 0){
    const ang = tilt*Math.PI/180, c = Math.cos(ang), s = Math.sin(ang);
    const cx = w/2 + sh[0]*bed, cy = h/2 + sh[1]*bed, hw = w/2 - 5*bed, hh = h/2 - 4*bed;
    const P = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y])=>[cx + x*c - y*s, cy + x*s + y*c]);
    const poly = [];
    for (let i = 0; i < 4; i++){
      const A = P[i], B = P[(i + 1) % 4], len = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(2, Math.round(len/9));
      for (let k = 0; k < n; k++){ const t = k/n; poly.push([A[0] + (B[0] - A[0])*t + (rng() - 0.5)*1.5, A[1] + (B[1] - A[1])*t + (rng() - 0.5)*1.5]); }
    }
    const path = ()=>{ poly.forEach((p, i)=>i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
    g.save(); g.beginPath(); path(); g.clip();
    [[18, 0.045], [10, 0.07], [5, 0.12], [2.4, 0.18]].forEach(([lw, al])=>{ g.strokeStyle = blk(al*Math.min(1, bed + 0.25)); g.lineWidth = lw*2; g.beginPath(); path(); g.stroke(); });
    g.restore();
    g.beginPath(); g.rect(-40, -40, w + 80, h + 80); path(); g.fillStyle = '#000'; g.fill('evenodd');
  }
}

/* Inspetor do efeito (um controle pra cada camada; zero tira a camada). */
function renderXeroxInspector(obj, body){
  const o = obj.art.opts || {};
  const set = (k, v)=>{ obj.art.opts = Object.assign({}, obj.art.opts, {[k]:v}); obj.dirty = true; canvas.requestRenderAll(); };
  const slider = (label, key, def)=>body.appendChild(field.range(label, o[key] != null ? o[key] : def, 0, 1, 0.05, v=>set(key, v)));
  body.appendChild(field.hint('Efeito de scan por cima da página: cada controle é uma camada; zero tira a camada. O texto "mole" é por caixa (tinta espalhada, no inspetor da caixa de jornal).'));
  slider('Luz do scanner (cantos escuros)', 'tone', 0.5); slider('Sombra de lombada', 'gutter', 0); slider('Verso transparecendo', 'ghost', 0.4);
  slider('Toner (pontos e fiapos)', 'speck', 0.5); slider('Riscos de varredura e poeira', 'streak', 0.5); slider('Fundo preto do scanner', 'bed', 0.7);
  body.appendChild(field.button('🎲 Novo desgaste', ()=>{ obj.art.seed = randomSeed32(); obj.dirty = true; canvas.requestRenderAll(); pushHistory(); }));
}
