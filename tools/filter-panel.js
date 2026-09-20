/* ===================== Painel de filtro compartilhado =====================
   Usado por props-generator.html (filtro numa foto dentro de um documento) e por
   image-lab.html (filtro na imagem única que a ferramenta edita). Só depende de
   fabric.js e das classes de filtro em filters.js — nenhuma referência a
   "documento"/"template" aqui, de propósito, pra ficar reaproveitável. */

const FILTER_REGISTRY = {
  Brightness: {label:'Brilho', cls:fabric.filters.Brightness, group:'Ajustes básicos', params:[
    {key:'brightness', label:'Brilho', min:-0.4, max:0.4, step:0.01}]},
  Contrast: {label:'Contraste', cls:fabric.filters.Contrast, group:'Ajustes básicos', params:[
    {key:'contrast', label:'Contraste', min:-0.5, max:0.5, step:0.01}]},
  Saturation: {label:'Saturação', cls:fabric.filters.Saturation, group:'Ajustes básicos', params:[
    {key:'saturation', label:'Saturação', min:-1, max:1, step:0.01}]},
  HueRotation: {label:'Matiz', cls:fabric.filters.HueRotation, group:'Ajustes básicos', params:[
    {key:'rotation', label:'Girar matiz', min:-1, max:1, step:0.01}]},
  Blur: {label:'Desfoque', cls:fabric.filters.Blur, group:'Ajustes básicos', params:[
    {key:'blur', label:'Quantidade', min:0, max:0.3, step:0.005}]},

  ColorGrade: {label:'Color grading', cls:ColorGradeFilter, group:'Cor & tom', params:[], vec3:['lift','gamma','gain']},
  Duotone: {label:'Duotone', cls:DuotoneFilter, group:'Cor & tom', params:[
    {key:'amount', label:'Mistura', min:0, max:1, step:0.01}], vec3:['shadow','highlight'], vec3Range:[0,1]},
  AgeTint: {label:'Idade do papel', cls:AgeTintFilter, group:'Cor & tom', params:[
    {key:'amount', label:'Quantidade', min:0, max:1, step:0.01}]},
  Posterize: {label:'Posterizar', cls:PosterizeFilter, group:'Cor & tom', params:[
    {key:'levels', label:'Níveis', min:2, max:16, step:1}]},
  Solarize: {label:'Solarizar', cls:SolarizeFilter, group:'Cor & tom', params:[
    {key:'threshold', label:'Limiar', min:0, max:1, step:0.01},
    {key:'amount', label:'Mistura', min:0, max:1, step:0.01}]},

  FilmGrain: {label:'Grão de filme', cls:FilmGrainFilter, group:'Grão & ruído', seedKey:'seed', params:[
    {key:'amount', label:'Intensidade', min:0, max:0.4, step:0.005},
    {key:'size', label:'Escala', min:100, max:1200, step:10}]},
  Noise: {label:'Ruído digital', cls:NoiseFilter, group:'Grão & ruído', seedKey:'seed', params:[
    {key:'amount', label:'Intensidade', min:0, max:0.5, step:0.005}]},
  DustScratches: {label:'Poeira & risco de filme', cls:DustScratchesFilter, group:'Grão & ruído', seedKey:'seed', params:[
    {key:'amount', label:'Intensidade', min:0, max:0.8, step:0.01}]},

  ChromaticAberration: {label:'Chromatic Aberration', cls:ChromaticAberrationFilter, group:'Dano & óptica', params:[
    {key:'amount', label:'Intensidade', min:0, max:0.05, step:0.001}]},
  LensDistortion: {label:'Distorção de lente', cls:LensDistortionFilter, group:'Dano & óptica', params:[
    {key:'power', label:'Barril(>1) / Almofada(<1)', min:0.5, max:2, step:0.01}]},
  Fringing: {label:'Fringing', cls:FringingFilter, group:'Dano & óptica', params:[
    {key:'amount', label:'Intensidade', min:0, max:0.06, step:0.001}]},
  LightLeak: {label:'Vazamento de luz', cls:LightLeakFilter, group:'Dano & óptica', seedKey:'seed', params:[
    {key:'amount', label:'Intensidade', min:0, max:1, step:0.01},
    {key:'spread', label:'Alcance', min:0.3, max:1.3, step:0.01}]},
  Vignette: {label:'Vinheta', cls:VignetteFilter, group:'Dano & óptica', params:[
    {key:'amount', label:'Intensidade', min:0, max:1, step:0.01},
    {key:'inner', label:'Raio interno', min:0, max:0.6, step:0.01}]},

  Scanlines: {label:'Scanlines', cls:ScanlinesFilter, group:'Estrutura', params:[
    {key:'intensity', label:'Intensidade', min:0, max:1, step:0.01},
    {key:'density', label:'Densidade', min:100, max:2000, step:10}]},
  VHS: {label:'VHS', cls:VHSFilter, group:'Estrutura', seedKey:'uSeed', params:[
    {key:'uCA', label:'Chromatic aberration', min:0, max:0.05, step:0.001},
    {key:'uScan', label:'Scanlines', min:0, max:1, step:0.01},
    {key:'uNoise', label:'Ruído', min:0, max:0.3, step:0.005}]},
  TapeGlitch: {label:'Glitch de trilha', cls:TapeGlitchFilter, group:'Estrutura', seedKey:'seed', params:[
    {key:'amount', label:'Deslocamento', min:0, max:0.15, step:0.005},
    {key:'band', label:'Espessura da faixa', min:0.005, max:0.08, step:0.005}]},
  Halftone: {label:'Meio-tom (jornal)', cls:HalftoneFilter, group:'Estrutura', params:[
    {key:'size', label:'Tamanho do ponto', min:0.004, max:0.03, step:0.001}]},
};

const FILTER_GROUP_ORDER = ['Ajustes básicos','Cor & tom','Grão & ruído','Dano & óptica','Estrutura'];

// Campos escalados pelo slider de intensidade de preset (multiplicador linear
// aplicado só nesses campos, os outros — seed, size, density, threshold, power,
// levels, band, spread — ficam fixos pra não descaracterizar o efeito).
const INTENSITY_SCALABLE = {
  ChromaticAberration: ['amount'],
  Vignette: ['amount'],
  FilmGrain: ['amount'],
  Noise: ['amount'],
  Scanlines: ['intensity'],
  VHS: ['uCA','uScan','uNoise'],
  Fringing: ['amount'],
  AgeTint: ['amount'],
  LightLeak: ['amount'],
  DustScratches: ['amount'],
  Duotone: ['amount'],
  Solarize: ['amount'],
  TapeGlitch: ['amount'],
  ColorGrade: ['lift','gamma','gain'],
};

const PRESETS = {
  silent_hill: {label:'Silent Hill — Relatório', filters:[
    {type:'ColorGrade', lift:[0,0.01,0.01], gamma:[0,0,0], gain:[-0.15,-0.1,-0.1]},
    {type:'FilmGrain', amount:0.16, size:450},
    {type:'Vignette', amount:0.7, inner:0.2}]},
  outlast: {label:'Outlast — Visão noturna', filters:[
    {type:'ColorGrade', lift:[0,0.05,0], gamma:[0,0,0], gain:[-0.6,0.15,-0.6]},
    {type:'Noise', amount:0.22},
    {type:'Vignette', amount:0.85, inner:0.1},
    {type:'ChromaticAberration', amount:0.015}]},
  re2_scan: {label:'RE2 — Scan de arquivo', filters:[
    {type:'ColorGrade', lift:[0.04,0.02,0], gamma:[0.03,0,0], gain:[0.05,0,-0.1]},
    {type:'FilmGrain', amount:0.07, size:500},
    {type:'Vignette', amount:0.4, inner:0.35}]},
  vhs_achado: {label:'VHS achado', filters:[
    {type:'VHS', uCA:0.016, uScan:0.35, uNoise:0.1},
    {type:'Vignette', amount:0.6, inner:0.2}]},
  dre_digital: {label:'Digitalizado DRE', filters:[
    {type:'ColorGrade', lift:[0.06,0.08,0.13], gamma:[0,0,0], gain:[-0.35,-0.2,0.05]},
    {type:'Scanlines', intensity:0.25, density:1000},
    {type:'Vignette', amount:0.5, inner:0.25}]},
  polaroid: {label:'Polaroid', filters:[
    {type:'ColorGrade', lift:[0.03,0.02,0], gamma:[0.04,0.02,-0.02], gain:[0.06,0.02,-0.08]},
    {type:'Vignette', amount:0.45, inner:0.3},
    {type:'FilmGrain', amount:0.05, size:350}]},

  cctv: {label:'CCTV / Vigilância', filters:[
    {type:'Duotone', shadow:[0.01,0.03,0.01], highlight:[0.55,0.9,0.45], amount:0.9},
    {type:'Scanlines', intensity:0.35, density:1400},
    {type:'Noise', amount:0.05},
    {type:'Vignette', amount:0.75, inner:0.15}]},
  camcorder_achado: {label:'Camcorder achado', filters:[
    {type:'VHS', uCA:0.01, uScan:0.22, uNoise:0.06},
    {type:'LensDistortion', power:1.12},
    {type:'ColorGrade', lift:[0.02,0.02,0], gamma:[0,0,0], gain:[-0.05,-0.02,-0.08]},
    {type:'Vignette', amount:0.6, inner:0.15}]},
  flash_descartavel: {label:'Flash de descartável', filters:[
    {type:'ColorGrade', lift:[0.05,0.04,0.02], gamma:[0,0,0], gain:[0.18,0.1,0.02]},
    {type:'FilmGrain', amount:0.14, size:380},
    {type:'LightLeak', amount:0.35, seed:0.15, spread:0.6},
    {type:'Vignette', amount:0.3, inner:0.4}]},
  vazamento_luz: {label:'Vazamento de luz', filters:[
    {type:'LightLeak', amount:0.6, seed:0.6, spread:0.85},
    {type:'FilmGrain', amount:0.06, size:400},
    {type:'ColorGrade', lift:[0.02,0.01,0], gamma:[0,0,0], gain:[0.04,0.01,-0.03]}]},
  fax_telecopia: {label:'Fax / Telecópia', filters:[
    {type:'Posterize', levels:4},
    {type:'Scanlines', intensity:0.5, density:1800},
    {type:'Duotone', shadow:[0.05,0.05,0.05], highlight:[0.92,0.9,0.85], amount:1.0}]},
  polaroid_estourada: {label:'Polaroid estourada', filters:[
    {type:'ColorGrade', lift:[0.05,0.04,0.02], gamma:[0.05,0.03,-0.03], gain:[0.12,0.06,-0.1]},
    {type:'LightLeak', amount:0.3, seed:0.85, spread:0.55},
    {type:'Vignette', amount:0.4, inner:0.3},
    {type:'FilmGrain', amount:0.05, size:350}]},
  solarizado_necrose: {label:'Solarizado / Necrose', filters:[
    {type:'Solarize', threshold:0.45, amount:0.7},
    {type:'Duotone', shadow:[0.05,0.08,0.1], highlight:[0.75,0.95,0.85], amount:0.5},
    {type:'FilmGrain', amount:0.1, size:420}]},
  vigilancia_neurostat: {label:'Vigilância NeuroStat', filters:[
    {type:'Duotone', shadow:[0.02,0.04,0.08], highlight:[0.5,0.7,0.95], amount:0.85},
    {type:'Scanlines', intensity:0.25, density:1100},
    {type:'Vignette', amount:0.5, inner:0.25}]},
};

function labeledRange(labelText, val, min, max, step, onInput){
  const wrap = document.createElement('div');
  const lab = document.createElement('label');
  const span = document.createElement('span'); span.className='rangeval'; span.textContent = (+val).toFixed(3);
  lab.textContent = labelText+' '; lab.appendChild(span);
  const input = document.createElement('input');
  input.type='range'; input.min=min; input.max=max; input.step=step; input.value=val;
  input.addEventListener('input', ()=>{ span.textContent=(+input.value).toFixed(3); onInput(+input.value); });
  wrap.appendChild(lab); wrap.appendChild(input);
  return wrap;
}

/* Aplica um preset no objeto, com intensidade opcional (0-1.5, 1=como definido).
   Só os campos listados em INTENSITY_SCALABLE pro tipo escalam — os demais (seed,
   size, density, threshold, power, levels...) ficam como definidos no preset. */
function applyPreset(canvasRef, obj, preset, intensity){
  intensity = (typeof intensity === 'number' && !isNaN(intensity)) ? intensity : 1;
  obj.filters = preset.filters.map(fdef=>{
    const def = FILTER_REGISTRY[fdef.type];
    const inst = new def.cls();
    const scalable = INTENSITY_SCALABLE[fdef.type] || [];
    Object.keys(fdef).forEach(k=>{
      if (k==='type') return;
      let v = fdef[k];
      if (intensity !== 1 && scalable.includes(k)){
        v = Array.isArray(v) ? v.map(n=>n*intensity) : v*intensity;
      }
      inst[k]=v;
    });
    return inst;
  });
  obj.applyFilters();
  canvasRef.renderAll();
  obj.__lastPreset = preset;
}

/* Miniatura de preset: aplica os filtros via applyTo2d (fallback CPU que toda
   classe já implementa) num canvas pequeno, sem passar por WebGL/Fabric — mais
   simples e rápido que clonar o objeto numa StaticCanvas só pra pré-visualizar.
   Alguns filtros geométricos (LensDistortion, Fringing) não têm fallback 2D de
   propósito (comentado em filters.js) — a miniatura só fica sem esse efeito
   específico, o resultado real ao aplicar continua correto. */
/* Fabric reaproveita o próprio elemento de origem (`obj.getElement()`) como
   destino da renderização filtrada — depois de aplicar um preset, esse elemento
   NÃO é mais a imagem original, é o resultado já filtrado (confirmado ao vivo:
   sem isso, toda miniatura de preset ficava verde depois de aplicar CCTV uma vez).
   Por isso guardamos uma cópia num canvas próprio na primeira vez que vemos cada
   objeto — antes de qualquer filtro ser tocado — e reusamos essa cópia sempre. */
const THUMB_SRC_CACHE = new WeakMap();
function getPristineThumbSource(obj){
  let el = THUMB_SRC_CACHE.get(obj);
  if (!el){
    const live = obj.getElement ? obj.getElement() : obj._element;
    const iw = live && (live.naturalWidth||live.width), ih = live && (live.naturalHeight||live.height);
    if (!live || !iw || !ih) return null;
    el = document.createElement('canvas');
    el.width = iw; el.height = ih;
    el.getContext('2d').drawImage(live, 0, 0, iw, ih);
    THUMB_SRC_CACHE.set(obj, el);
  }
  return el;
}

function renderPresetThumbnail(imgEl, preset, w, h){
  try {
    const c = document.createElement('canvas'); c.width=w; c.height=h;
    const ctx = c.getContext('2d');
    const iw = imgEl.naturalWidth||imgEl.width, ih = imgEl.naturalHeight||imgEl.height;
    if (!iw || !ih) return null;
    const s = Math.max(w/iw, h/ih);
    const dw = iw*s, dh = ih*s;
    ctx.drawImage(imgEl, (w-dw)/2, (h-dh)/2, dw, dh);
    const imageData = ctx.getImageData(0,0,w,h);
    preset.filters.forEach(fdef=>{
      const def = FILTER_REGISTRY[fdef.type];
      if (!def) return;
      const inst = new def.cls();
      Object.keys(fdef).forEach(k=>{ if (k!=='type') inst[k]=fdef[k]; });
      if (typeof inst.applyTo2d === 'function') inst.applyTo2d({imageData});
    });
    ctx.putImageData(imageData,0,0);
    return c.toDataURL();
  } catch(e){ return null; }
}

function renderFilterRow(canvasRef, obj, filterInst, idx, onChange){
  const type = filterInst.constructor.type;
  const def = FILTER_REGISTRY[type];
  const row = document.createElement('div'); row.className='filterRow';
  const head = document.createElement('div'); head.className='filterHead';
  const b = document.createElement('b'); b.textContent = def?def.label:type;
  head.appendChild(b);
  const btns = document.createElement('span');
  if (def && def.seedKey){
    const roll = document.createElement('button'); roll.textContent='🎲'; roll.title='Rerolar padrão aleatório';
    roll.style.marginRight='4px';
    roll.addEventListener('click', ()=>{ filterInst[def.seedKey]=Math.random(); obj.applyFilters(); canvasRef.renderAll(); });
    btns.appendChild(roll);
  }
  const rm = document.createElement('button'); rm.textContent='✕';
  rm.addEventListener('click', ()=>{ obj.filters.splice(idx,1); obj.applyFilters(); canvasRef.renderAll(); onChange(); });
  btns.appendChild(rm);
  head.appendChild(btns);
  row.appendChild(head);
  if (def){
    def.params.forEach(p=>{
      row.appendChild(labeledRange(p.label, filterInst[p.key], p.min, p.max, p.step, v=>{
        filterInst[p.key]=v; obj.applyFilters(); canvasRef.renderAll();
      }));
    });
    if (def.vec3){
      const range = def.vec3Range || [-1,1];
      def.vec3.forEach(vk=>{
        const sub = document.createElement('div'); sub.className='hint'; sub.textContent=vk.toUpperCase();
        row.appendChild(sub);
        ['R','G','B'].forEach((ch,ci)=>{
          row.appendChild(labeledRange(vk+'.'+ch, filterInst[vk][ci], range[0], range[1], 0.01, v=>{
            filterInst[vk][ci]=v; obj.applyFilters(); canvasRef.renderAll();
          }));
        });
      });
    }
  }
  return row;
}

/* Monta o painel inteiro (presets + intensidade + lista de filtros aplicados +
   adicionar novo, agrupado) dentro de `body` (um elemento já existente na página)
   pra `obj` (fabric.Image), usando `canvasRef` pra re-renderizar. Chama de novo
   pra atualizar a lista. */
function renderFilterPanel(canvasRef, obj, body){
  body.innerHTML = '';

  const presetLab = document.createElement('div'); presetLab.className='hint'; presetLab.textContent='Presets:';
  const presetRow = document.createElement('div'); presetRow.className='presetRow';
  const srcEl = getPristineThumbSource(obj);
  Object.entries(PRESETS).forEach(([key,p])=>{
    const b = document.createElement('button'); b.className='presetBtn';
    b.title = p.label;
    if (srcEl){
      const thumb = renderPresetThumbnail(srcEl, p, 72, 50);
      if (thumb){
        const img = document.createElement('img'); img.src = thumb; img.alt='';
        b.appendChild(img);
      }
    }
    const span = document.createElement('span'); span.textContent = p.label;
    b.appendChild(span);
    b.addEventListener('click', ()=>{ applyPreset(canvasRef, obj, p, +intensityInput.value); renderFilterPanel(canvasRef, obj, body); });
    presetRow.appendChild(b);
  });
  body.appendChild(presetLab); body.appendChild(presetRow);

  const intensityWrap = document.createElement('div');
  const intensityInput = document.createElement('input');
  intensityInput.type='range'; intensityInput.min=0.2; intensityInput.max=1.5; intensityInput.step=0.05;
  intensityInput.value = 1;
  const intensityLab = document.createElement('label');
  const intensitySpan = document.createElement('span'); intensitySpan.className='rangeval'; intensitySpan.textContent='100%';
  intensityLab.textContent='Intensidade do preset '; intensityLab.appendChild(intensitySpan);
  intensityInput.addEventListener('input', ()=>{
    intensitySpan.textContent = Math.round(intensityInput.value*100)+'%';
    if (obj.__lastPreset) applyPreset(canvasRef, obj, obj.__lastPreset, +intensityInput.value);
  });
  intensityWrap.appendChild(intensityLab); intensityWrap.appendChild(intensityInput);
  body.appendChild(intensityWrap);

  const filterListLab = document.createElement('div'); filterListLab.className='hint'; filterListLab.textContent='Filtros aplicados:';
  body.appendChild(filterListLab);
  (obj.filters||[]).forEach((f, idx)=>{
    body.appendChild(renderFilterRow(canvasRef, obj, f, idx, ()=>renderFilterPanel(canvasRef, obj, body)));
  });

  const addLab = document.createElement('label'); addLab.textContent='+ Adicionar filtro';
  const addSel = document.createElement('select');
  const noneOpt = document.createElement('option'); noneOpt.value=''; noneOpt.textContent='— escolher —';
  addSel.appendChild(noneOpt);
  FILTER_GROUP_ORDER.forEach(group=>{
    const entries = Object.entries(FILTER_REGISTRY).filter(([,def])=>def.group===group);
    if (!entries.length) return;
    const og = document.createElement('optgroup'); og.label = group;
    entries.forEach(([key,def])=>{
      const o=document.createElement('option'); o.value=key; o.textContent=def.label; og.appendChild(o);
    });
    addSel.appendChild(og);
  });
  addSel.addEventListener('change', ()=>{
    if (!addSel.value) return;
    const def = FILTER_REGISTRY[addSel.value];
    obj.filters = obj.filters||[];
    obj.filters.push(new def.cls());
    obj.applyFilters();
    canvasRef.renderAll();
    renderFilterPanel(canvasRef, obj, body);
  });
  body.appendChild(addLab); body.appendChild(addSel);
}
