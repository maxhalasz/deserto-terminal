/* ===================== Painel de filtro compartilhado =====================
   Usado por props-generator.html (filtro numa foto dentro de um documento) e por
   image-lab.html (filtro na imagem única que a ferramenta edita). Só depende de
   fabric.js e das classes de filtro em filters.js — nenhuma referência a
   "documento"/"template" aqui, de propósito, pra ficar reaproveitável. */

const FILTER_REGISTRY = {
  ChromaticAberration: {label:'Chromatic Aberration', cls:ChromaticAberrationFilter, params:[
    {key:'amount', label:'Intensidade', min:0, max:0.05, step:0.001}]},
  Vignette: {label:'Vinheta', cls:VignetteFilter, params:[
    {key:'amount', label:'Intensidade', min:0, max:1, step:0.01},
    {key:'inner', label:'Raio interno', min:0, max:0.6, step:0.01}]},
  FilmGrain: {label:'Grão de filme', cls:FilmGrainFilter, params:[
    {key:'amount', label:'Intensidade', min:0, max:0.4, step:0.005},
    {key:'size', label:'Escala', min:100, max:1200, step:10}]},
  Noise: {label:'Ruído digital', cls:NoiseFilter, params:[
    {key:'amount', label:'Intensidade', min:0, max:0.5, step:0.005}]},
  LensDistortion: {label:'Distorção de lente', cls:LensDistortionFilter, params:[
    {key:'power', label:'Barril(>1) / Almofada(<1)', min:0.5, max:2, step:0.01}]},
  Scanlines: {label:'Scanlines', cls:ScanlinesFilter, params:[
    {key:'intensity', label:'Intensidade', min:0, max:1, step:0.01},
    {key:'density', label:'Densidade', min:100, max:2000, step:10}]},
  VHS: {label:'VHS', cls:VHSFilter, params:[
    {key:'uCA', label:'Chromatic aberration', min:0, max:0.05, step:0.001},
    {key:'uScan', label:'Scanlines', min:0, max:1, step:0.01},
    {key:'uNoise', label:'Ruído', min:0, max:0.3, step:0.005}]},
  Fringing: {label:'Fringing', cls:FringingFilter, params:[
    {key:'amount', label:'Intensidade', min:0, max:0.06, step:0.001}]},
  Halftone: {label:'Meio-tom (jornal)', cls:HalftoneFilter, params:[
    {key:'size', label:'Tamanho do ponto', min:0.004, max:0.03, step:0.001}]},
  AgeTint: {label:'Idade do papel', cls:AgeTintFilter, params:[
    {key:'amount', label:'Quantidade', min:0, max:1, step:0.01}]},
  ColorGrade: {label:'Color grading', cls:ColorGradeFilter, params:[], vec3:['lift','gamma','gain']},
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

function applyPreset(canvasRef, obj, preset){
  obj.filters = preset.filters.map(fdef=>{
    const def = FILTER_REGISTRY[fdef.type];
    const inst = new def.cls();
    Object.keys(fdef).forEach(k=>{ if (k!=='type') inst[k]=fdef[k]; });
    return inst;
  });
  obj.applyFilters();
  canvasRef.renderAll();
}

function renderFilterRow(canvasRef, obj, filterInst, idx, onChange){
  const type = filterInst.constructor.type;
  const def = FILTER_REGISTRY[type];
  const row = document.createElement('div'); row.className='filterRow';
  const head = document.createElement('div'); head.className='filterHead';
  const b = document.createElement('b'); b.textContent = def?def.label:type;
  const rm = document.createElement('button'); rm.textContent='✕';
  rm.addEventListener('click', ()=>{ obj.filters.splice(idx,1); obj.applyFilters(); canvasRef.renderAll(); onChange(); });
  head.appendChild(b); head.appendChild(rm);
  row.appendChild(head);
  if (def){
    def.params.forEach(p=>{
      row.appendChild(labeledRange(p.label, filterInst[p.key], p.min, p.max, p.step, v=>{
        filterInst[p.key]=v; obj.applyFilters(); canvasRef.renderAll();
      }));
    });
    if (def.vec3){
      def.vec3.forEach(vk=>{
        const sub = document.createElement('div'); sub.className='hint'; sub.textContent=vk.toUpperCase();
        row.appendChild(sub);
        ['R','G','B'].forEach((ch,ci)=>{
          row.appendChild(labeledRange(vk+'.'+ch, filterInst[vk][ci], -1, 1, 0.01, v=>{
            filterInst[vk][ci]=v; obj.applyFilters(); canvasRef.renderAll();
          }));
        });
      });
    }
  }
  return row;
}

/* Monta o painel inteiro (presets + lista de filtros aplicados + adicionar novo)
   dentro de `body` (um elemento já existente na página) pra `obj` (fabric.Image),
   usando `canvasRef` pra re-renderizar. Chama de novo pra atualizar a lista. */
function renderFilterPanel(canvasRef, obj, body){
  body.innerHTML = '';

  const presetLab = document.createElement('div'); presetLab.className='hint'; presetLab.textContent='Presets:';
  const presetRow = document.createElement('div'); presetRow.className='presetRow';
  Object.entries(PRESETS).forEach(([key,p])=>{
    const b = document.createElement('button'); b.textContent = p.label;
    b.addEventListener('click', ()=>{ applyPreset(canvasRef, obj, p); renderFilterPanel(canvasRef, obj, body); });
    presetRow.appendChild(b);
  });
  body.appendChild(presetLab); body.appendChild(presetRow);

  const filterListLab = document.createElement('div'); filterListLab.className='hint'; filterListLab.textContent='Filtros aplicados:';
  body.appendChild(filterListLab);
  (obj.filters||[]).forEach((f, idx)=>{
    body.appendChild(renderFilterRow(canvasRef, obj, f, idx, ()=>renderFilterPanel(canvasRef, obj, body)));
  });

  const addLab = document.createElement('label'); addLab.textContent='+ Adicionar filtro';
  const addSel = document.createElement('select');
  const noneOpt = document.createElement('option'); noneOpt.value=''; noneOpt.textContent='— escolher —';
  addSel.appendChild(noneOpt);
  Object.entries(FILTER_REGISTRY).forEach(([key,def])=>{
    const o=document.createElement('option'); o.value=key; o.textContent=def.label; addSel.appendChild(o);
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
