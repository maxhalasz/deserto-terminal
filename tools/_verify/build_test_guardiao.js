const fs=require('fs');
const g=fs.readFileSync(__dirname+'/../../guardiao.html','utf8');
const css=g.match(/<style>[^]*?<\/style>/)[0];
const seed={online:true,map:{pin:{deck:'module',x:35,y:26.8},rooms:{md0:{at:1},md1:{at:2},md4:{at:3}},corr:{mc_cm:true,mc_cn:true,mc_cp:true,mc_f2:true,mc_dm:true}},notes:{a:{t:'who has keys to M22?',at:Date.now()-60000,by:'OP-3',r:'md8'},b:{t:'hum under the floor',at:Date.now(),by:'OP-1'}}};
const h=`<!doctype html><html><head><meta charset="utf-8">${css}</head><body><div class="top"><h1>PAINEL DO <span>GUARDIÃO</span></h1></div>
<div class="tabs"><button class="tab">ESTAÇÃO</button><button class="tab active">MAPA</button><button class="tab">SUBMARINO</button></div>
<div id="tab-mapa" class="tabpanel active"></div>
<script src="station-data.js"></script><script src="station-eq.js"></script><script src="station-render.js"></script><script src="station-gm-data.js"></script><script src="station-props.js"></script><script src="station-props-more.js"></script><script src="station-layout.js"></script><script src="guardiao-props.js"></script><script src="guardiao-map.js"></script>
<script>
let data={sessions:{x:{station:${JSON.stringify(seed)},gm:{layout:{md2:{noeq:true,items:{a:{k:"mesa",x:2,y:2,rot:0,sc:1,sx:1,sy:1,z:0},b:{k:"cadeira",x:3,y:2,rot:0,sc:1,sx:1,sy:1,z:0,sec:1}}}}}}}};const L=[];
const get=p=>p.split('/').filter(Boolean).reduce((o,k)=>o==null?o:o[k],data);
const set=(p,v)=>{const a=p.split('/').filter(Boolean);let o=data;for(let i=0;i<a.length-1;i++){if(o[a[i]]==null||typeof o[a[i]]!=='object')o[a[i]]={};o=o[a[i]];}if(v===null)delete o[a[a.length-1]];else o[a[a.length-1]]=v;};
const snap=p=>({val:()=>{const v=get(p);return v==null?null:JSON.parse(JSON.stringify(v));}});
const notify=()=>L.forEach(l=>l.cb(snap(l.p)));
const node=p=>({child:c=>node(p+'/'+c),on:(e,cb)=>{L.push({p,cb});cb(snap(p));},set:v=>{set(p,v);notify();return Promise.resolve();},update:o=>{Object.keys(o).forEach(k=>set(p+'/'+k,o[k]));notify();return Promise.resolve();},remove:()=>{set(p,null);notify();return Promise.resolve();},once:()=>Promise.resolve(snap(p))});
GuardiaoMap.init(node('sessions/x'));
const q=new URLSearchParams(location.search);const sel=q.get('sel');if(sel){const e=document.querySelector('[data-room="'+sel+'"]');if(e)e.dispatchEvent(new MouseEvent('click',{bubbles:true,shiftKey:true}));}
if(q.get('run')){setTimeout(async()=>{const out=[];const ok=(n,c)=>out.push((c?'OK    ':'FALHA ')+n);const sl=ms=>new Promise(r=>setTimeout(r,ms));
 try{document.querySelector('[data-room="md4"]').dispatchEvent(new MouseEvent('click',{bubbles:true,shiftKey:true}));
  const ta=document.getElementById('mpDesc');ok('textarea de descricao existe',!!ta);
  ta.value='Descricao nova do mestre';ta.dispatchEvent(new Event('input',{bubbles:true}));await sl(800);
  ok('descricao gravada no banco',data.sessions.x.station.map.desc&&data.sessions.x.station.map.desc.md4==='Descricao nova do mestre');
  document.getElementById('mpDescRst').click();await sl(300);
  ok('restaurar apaga o texto custom',!(data.sessions.x.station.map.desc&&data.sessions.x.station.map.desc.md4));
  ok('nao lista o nivel submerso',!/Submerged|SUBMERGED/.test(document.body.innerText));
  document.querySelector('#mpPlan [data-corr="mw_n"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));await sl(300);
  ok('corredor em grupo revela todos os trechos',!!data.sessions.x.station.map.corr.mw_nl1&&!!data.sessions.x.station.map.corr.mw_nl2);
  document.getElementById('mpUndo').click();await sl(300);
  ok('desfazer oculta o grupo de novo',!data.sessions.x.station.map.corr.mw_nl1&&!data.sessions.x.station.map.corr.mw_nl2);
  document.querySelector('[data-room="md2"]').dispatchEvent(new MouseEvent('click',{bubbles:true,shiftKey:true}));
  document.getElementById('mpFocus').click();await sl(300);
  ok('destacar revela a sala escondida',!!data.sessions.x.station.map.rooms.md2);
  {const pp=data.sessions.x.station.map.props||{};ok('revelar a sala publica o layout dela',Object.keys(pp).filter(k=>k.indexOf('L~md2~')===0).length===1);ok('item secreto do layout nao e publicado',!Object.keys(pp).some(k=>/~b$/.test(k)));ok('layout com noeq publica noeq',!!(data.sessions.x.station.map.noeq&&data.sessions.x.station.map.noeq.md2));}
  ok('destacar grava o foco',data.sessions.x.station.map.focus&&data.sessions.x.station.map.focus.room==='md2');
  document.getElementById('mpUndo').click();await sl(300);
  ok('desfazer tira a sala revelada pelo destaque',!data.sessions.x.station.map.rooms.md2);
  ok('desfazer tambem despublica o layout',!Object.keys(data.sessions.x.station.map.props||{}).some(k=>k.indexOf('L~md2~')===0)&&!(data.sessions.x.station.map.noeq||{}).md2);
  const sr=document.getElementById('mpSearch');sr.value='lounge';sr.dispatchEvent(new Event('input',{bubbles:true}));
  ok('busca acha a sala',/Lounge/.test(document.getElementById('mpResults').innerText));
  document.querySelector('#mpResults [data-id]').click();await sl(200);
  ok('clicar no resultado seleciona a sala',/Lounge/.test(document.getElementById('mpSel').innerText));
  // ---- sala coberta (so o nome) e tecla P ----
  document.querySelector('#mpDecks [data-d="module"]').click();await sl(150);
  document.querySelector('[data-room="md2"]').dispatchEvent(new MouseEvent('click',{bubbles:true,shiftKey:true}));await sl(150);
  ok('botao de cobrir existe na ficha',!!document.getElementById('mpVeil')&&/COBRIR/.test(document.getElementById('mpVeil').textContent));
  document.getElementById('mpVeil').click();await sl(300);
  {const m=data.sessions.x.station.map;ok('cobrir revela a sala ja coberta',m.veil&&m.veil.md2===true&&!!m.rooms.md2);
   ok('sala coberta nao publica o layout',!Object.keys(m.props||{}).some(k=>k.indexOf('L~md2~')===0)&&!(m.noeq||{}).md2);}
  ok('GM ve o selo COBERTA no mapa',/COBERTA/.test(document.getElementById('mpPlan').textContent));
  document.getElementById('mpVeil').click();await sl(300);
  {const m=data.sessions.x.station.map;ok('descobrir apaga o veu',!(m.veil&&m.veil.md2));ok('descobrir publica o layout da sala',Object.keys(m.props||{}).filter(k=>k.indexOf('L~md2~')===0).length===1);}
  document.getElementById('mpVeilNew').click();await sl(60);
  document.querySelector('[data-room="md3"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));await sl(300);
  ok('revelar ja coberta grava o veu junto',data.sessions.x.station.map.rooms.md3&&data.sessions.x.station.map.veil&&data.sessions.x.station.map.veil.md3===true);
  document.getElementById('mpVeilNew').click();await sl(60);
  document.getElementById('mpUndo').click();await sl(250);
  ok('desfazer tira sala e veu',!data.sessions.x.station.map.rooms.md3&&!(data.sessions.x.station.map.veil&&data.sessions.x.station.map.veil.md3));
  document.getElementById('mpVeilAll').click();await sl(300);
  ok('cobrir salas cobre todas as reveladas do deck',['md0','md1','md4','md2'].filter(k=>data.sessions.x.station.map.rooms[k]).every(k=>data.sessions.x.station.map.veil&&data.sessions.x.station.map.veil[k]));
  document.getElementById('mpVeilNone').click();await sl(300);
  ok('descobrir salas limpa o deck',!Object.keys(data.sessions.x.station.map.veil||{}).length);
  {document.getElementById('tab-mapa').classList.add('active');const sv=document.querySelector('#mpPlan svg'),b=sv.getBoundingClientRect(),cx=b.left+b.width*.55,cy=b.top+b.height*.5;
   const p0=JSON.stringify(data.sessions.x.station.map.pin);
   document.getElementById('mpPlan').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:cx,clientY:cy}));
   document.dispatchEvent(new KeyboardEvent('keydown',{key:'p',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keydown',{key:'p'}));await sl(300);
   const p1=data.sessions.x.station.map.pin;ok('tecla P poe o pino onde o mouse esta',p1&&JSON.stringify(p1)!==p0&&p1.deck==='module');}
  // ---- aviso do terminal ----
  {const tk=document.getElementById('mpTk');ok('campo do aviso mostra o padrao',/COMM SYNC/.test(tk.value));
   tk.focus();tk.value='ALARME GERAL\\nTROQUEM DE TURNO';tk.dispatchEvent(new Event('input',{bubbles:true}));await sl(800);
   ok('aviso editado grava a lista',Array.isArray(data.sessions.x.station.ticker)&&data.sessions.x.station.ticker.length===2&&data.sessions.x.station.ticker[0]==='ALARME GERAL');tk.blur();
   document.getElementById('mpTkOff').click();await sl(300);
   ok('remover aviso grava off',data.sessions.x.station.ticker==='off');
   ok('botao mostra aviso removido',/REMOVIDO/.test(document.getElementById('mpTkOff').textContent));
   document.getElementById('mpTkOff').click();await sl(300);
   ok('religar volta ao padrao',data.sessions.x.station.ticker===undefined&&/COMM SYNC/.test(document.getElementById('mpTk').value));}
  // ---- customizador de props ----
  const ev=(t,el,x,y)=>el.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:x,clientY:y,button:0,pointerId:1}));
  const gp=()=>((data.sessions.x.gm||{}).props)||{},mp=()=>(((data.sessions.x.station||{}).map||{}).props)||{};
  document.getElementById('mpMode').click();await sl(100);
  ok('modo props abre o painel',document.getElementById('mpProps').style.display==='block'&&/Mobília/.test(document.getElementById('mpProps').innerText));
  document.querySelector('#mpDecks [data-d="module"]').click();await sl(150);
  const w0=+document.querySelector('#mpPlan svg').getAttribute('width');document.querySelector('#mpProps [data-pa="zin"]').click();await sl(150);
  ok('zoom do mapa aumenta o desenho',+document.querySelector('#mpPlan svg').getAttribute('width')>w0);
  document.querySelector('#mpProps [data-arm="mesa"]').click();await sl(100);
  const re=document.querySelector('#mpPlan [data-room="md4"]').getBoundingClientRect(),cx=re.left+re.width/2,cy=re.top+re.height/2;
  ev('pointerdown',document.querySelector('#mpPlan [data-room="md4"]'),cx,cy);ev('pointerup',document.querySelector('#mpPlan'),cx,cy);await sl(300);
  const ids=Object.keys(gp());ok('colocar grava no gm/props',ids.length===1&&gp()[ids[0]].k==='mesa'&&gp()[ids[0]].shown===false);
  ok('item oculto NAO vai pra map/props',Object.keys(mp()).filter(k=>k.indexOf('L~')!==0).length===0);
  ok('item oculto aparece no mapa do GM tracejado',!!document.querySelector('#mpPlan .prop.ph'));
  const id=ids[0];
  document.getElementById('ppShow').click();await sl(300);
  ok('revelar publica o desenho',mp()[id]&&Array.isArray(mp()[id].ops)&&mp()[id].ops.length>0&&mp()[id].k===undefined);
  document.querySelector('#mpProps [data-pa="rot90"]').click();await sl(250);
  ok('girar 90 grava nos dois lugares',gp()[id].rot===90&&mp()[id].rot===90);
  const pe=document.querySelector('#mpPlan [data-prop="'+id+'"]').getBoundingClientRect(),px0=gp()[id].x;
  ev('pointerdown',document.querySelector('#mpPlan [data-prop="'+id+'"]'),pe.left+pe.width/2,pe.top+pe.height/2);
  ev('pointermove',document.querySelector('#mpPlan'),pe.left+pe.width/2+40,pe.top+pe.height/2);
  ev('pointerup',document.querySelector('#mpPlan'),pe.left+pe.width/2+40,pe.top+pe.height/2);await sl(300);
  ok('arrastar move o item e republica',gp()[id].x>px0&&mp()[id].x===gp()[id].x);
  document.getElementById('ppLbl').value='C-9';document.getElementById('ppLbl').dispatchEvent(new Event('input',{bubbles:true}));await sl(700);
  ok('rotulo vai pros jogadores',mp()[id].lbl==='C-9');
  document.getElementById('mpUndo').click();await sl(300);
  ok('desfazer volta o movimento',gp()[id].x===px0);
  document.querySelector('#mpProps [data-pa="del"]').click();await sl(300);
  ok('apagar tira dos dois',!gp()[id]&&!mp()[id]);
  document.querySelector('#mpProps [data-cat="mar"]').click();await sl(50);
  document.querySelector('#mpProps [data-arm="marc"]').click();await sl(50);
  ev('pointerdown',document.querySelector('#mpPlan [data-room="md4"]'),cx,cy);ev('pointerup',document.querySelector('#mpPlan'),cx,cy);await sl(250);
  ok('marcador nasce numerado',Object.values(gp()).some(g=>g.k==='marc'&&g.lbl==='1'));
  ok('catalogo publico nao cita DRE',!/DRE|Carcosa|Coro/i.test(window.StationProps.order.map(i=>window.StationProps.items[i].n).join(' ')));
  }catch(e){out.push('EXCECAO '+e.message+' @'+(e.stack||'').split('\\n')[1]);}
 const pre=document.createElement('pre');pre.id='testout';pre.textContent=out.join('\\n');document.body.appendChild(pre);},1200);}
</script></body></html>`;
fs.writeFileSync(__dirname+'/../../_test_guardiao.html',h);console.log('ok');
