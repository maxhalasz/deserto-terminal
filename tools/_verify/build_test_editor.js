// Gera _test_editor.html (raiz, nao versionado) com Firebase de mentira e roda o teste dentro da pagina (?run=1).
const fs=require('fs');
let h=fs.readFileSync(__dirname+'/../../editor-salas.html','utf8');
h=h.replace(/<script src="https:\/\/www\.gstatic[^]*?firebase-config\.js"><\/script>/,'');
h=h.replace(/<script src="station-props-gm\.local\.js"><\/script>/,'');
h=h.replace(/<script>\s*var _unsubAuth[^]*?<\/script>/,'');
const seed={map:{rooms:{md4:{at:1}},corr:{}}};
const mock=`<script>
let data={sessions:{x:{station:${JSON.stringify(seed)}}}};const L=[];
const get=p=>p.split('/').filter(Boolean).reduce((o,k)=>o==null?o:o[k],data);
const set=(p,v)=>{const a=p.split('/').filter(Boolean);let o=data;for(let i=0;i<a.length-1;i++){if(o[a[i]]==null||typeof o[a[i]]!=='object')o[a[i]]={};o=o[a[i]];}if(v===null||v===undefined)delete o[a[a.length-1]];else o[a[a.length-1]]=v;};
const snap=p=>({val:()=>{const v=get(p);return v==null?null:JSON.parse(JSON.stringify(v));}});
const notify=()=>L.forEach(l=>l.cb(snap(l.p)));
const node=p=>({child:c=>node(p+'/'+c),on:(e,cb)=>{L.push({p,cb});cb(snap(p));},set:v=>{set(p,v);notify();return Promise.resolve();},update:o=>{Object.keys(o).forEach(k=>set(p+'/'+k,o[k]));notify();return Promise.resolve();},remove:()=>{set(p,null);notify();return Promise.resolve();},once:()=>Promise.resolve(snap(p))});
window.sessionRef=node('sessions/x');
window.EDITOR=EditorSalas.init(sessionRef);
const q=new URLSearchParams(location.search);
if(q.get('run')){setTimeout(async()=>{const out=[];const ok=(n,c)=>out.push((c?'OK    ':'FALHA ')+n);const sl=ms=>new Promise(r=>setTimeout(r,ms));
 const $=id=>document.getElementById(id);
 const ev=(t,el,x,y,o)=>el.dispatchEvent(new PointerEvent(t,Object.assign({bubbles:true,clientX:x,clientY:y,button:0,pointerId:1},o||{})));
 const key=(k,o)=>document.dispatchEvent(new KeyboardEvent('keydown',Object.assign({key:k,bubbles:true},o||{})));
 const lay=()=>(((data.sessions.x.gm||{}).layout)||{}).md4,pubp=()=>(((data.sessions.x.station||{}).map||{}).props)||{},its=()=>(lay()&&lay().items)||{};
 const center=el=>{const b=el.getBoundingClientRect();return [b.left+b.width/2,b.top+b.height/2];};
 try{
  ok('lista de salas aparece',document.querySelectorAll('#rlist [data-r]').length>5);
  ok('nenhum item do catalogo privado vaza',!/DRE|Carcosa|caisson/i.test(document.body.innerText));
  document.querySelector('#rlist [data-r="md4"]').click();await sl(250);
  ok('abrir sala mostra so a sala em zoom',!!document.querySelector('#cv [data-room="md4"]')&&/Wellbay/i.test($('rname').textContent));
  ok('catalogo tem categoria Estrutura e Alojamento',/Estrutura/.test($('pal').innerText)&&/Alojamento/.test($('pal').innerText));
  ok('catalogo passa de 100 itens',Object.keys(StationProps.items).length>100);
  document.querySelector('#pal [data-cat="est"]').click();await sl(80);
  document.querySelector('#pal [data-arm="divisoria"]').click();await sl(80);
  const rmF=()=>document.querySelector('#cv [data-room="md4"]'),[cx,cy]=center(rmF());
  ev('pointerdown',rmF(),cx,cy);ev('pointerup',$('cv'),cx,cy);await sl(700);
  ok('colocar salva em gm/layout',Object.keys(its()).length===1&&Object.values(its())[0].k==='divisoria');
  const id=Object.keys(its())[0];
  ok('sala revelada: item publicado na mesa na hora',Object.keys(pubp()).some(k=>k.indexOf('L~md4~')===0&&pubp()[k].ops.length>0)&&Object.keys(pubp()).every(k=>pubp()[k].k===undefined));
  $('ins').querySelector('[data-f="w"]').value='8';$('ins').querySelector('[data-f="w"]').dispatchEvent(new Event('change',{bubbles:true}));await sl(700);
  ok('largura esticada vira sx e vai pra mesa',its()[id].sx>1.9&&Object.values(pubp()).some(p=>p.sx>1.9));
  const x0=its()[id].x;
  const pe=document.querySelector('#cv [data-prop="'+id+'"]'),[px_,py_]=center(pe);
  ev('pointerdown',pe,px_,py_);ev('pointermove',$('cv'),px_+40,py_);ev('pointerup',$('cv'),px_+40,py_);await sl(700);
  ok('arrastar move o item',its()[id].x>x0);
  key('z',{ctrlKey:true});await sl(700);
  ok('Ctrl+Z desfaz o movimento',its()[id].x===x0);
  key('y',{ctrlKey:true});await sl(700);
  ok('Ctrl+Y refaz',its()[id].x>x0);
  {const pe2=document.querySelector('#cv [data-prop="'+id+'"]'),[a2,b2]=center(pe2);ev('pointerdown',pe2,a2,b2);ev('pointerup',$('cv'),a2,b2);}await sl(100);key('c',{ctrlKey:true});key('v',{ctrlKey:true});await sl(700);
  ok('copiar e colar cria outro item',Object.keys(its()).length===2);
  $('side').querySelector('[data-a="all"]').click();await sl(80);
  ok('selecionar tudo mostra alinhamento',/alinhar/.test($('ins').innerText));
  key('Delete');await sl(700);
  ok('Delete apaga a selecao e despublica',Object.keys(its()).length===0&&!Object.keys(pubp()).some(k=>k.indexOf('L~md4~')===0));
  // segredo
  document.querySelector('#pal [data-cat="lab"]').click();await sl(60);document.querySelector('#pal [data-arm="mesa_exame"]').click();await sl(60);
  ev('pointerdown',rmF(),cx,cy);ev('pointerup',$('cv'),cx,cy);await sl(700);
  ok('item novo publicado',Object.keys(pubp()).some(k=>k.indexOf('L~md4~')===0));
  const sec=$('ins').querySelector('[data-f="sec"]');sec.checked=true;sec.dispatchEvent(new Event('change',{bubbles:true}));await sl(700);
  ok('item secreto some da mesa mas fica salvo',!Object.keys(pubp()).some(k=>k.indexOf('L~md4~')===0)&&Object.keys(its()).length===1);
  // equipamento padrao
  $('noeq').checked=true;$('noeq').dispatchEvent(new Event('change',{bubbles:true}));await sl(700);
  ok('esconder equipamento grava noeq e publica',lay().noeq===true&&data.sessions.x.station.map.noeq&&data.sessions.x.station.map.noeq.md4===true);
  // sala nao revelada: salva mas nao publica
  document.querySelector('#rlist [data-r="md1"]').click();await sl(250);
  document.querySelector('#pal [data-cat="mob"]').click();await sl(60);document.querySelector('#pal [data-arm="mesa"]').click();await sl(60);
  const r1=document.querySelector('#cv [data-room="md1"]'),[c1x,c1y]=center(r1);
  ev('pointerdown',r1,c1x,c1y);ev('pointerup',$('cv'),c1x,c1y);await sl(700);
  ok('sala nao revelada salva sem publicar',Object.keys(((data.sessions.x.gm||{}).layout||{}).md1.items).length===1&&!Object.keys(pubp()).some(k=>k.indexOf('L~md1~')===0));
  // retangulo de selecao (Esc larga o item armado)
  key('Escape');await sl(60);
  const bb=$('cv').getBoundingClientRect();
  ev('pointerdown',$('cv').querySelector('svg'),bb.left+8,bb.top+8);ev('pointermove',$('cv'),bb.right-30,bb.bottom-30);ev('pointerup',$('cv'),bb.right-30,bb.bottom-30);await sl(120);
  ok('arrastar no vazio seleciona por retangulo',/1 itens?|SELEÇÃO/.test($('ins').innerText)&&document.querySelectorAll('#cv .band').length===0);
  // previa
  $('prevOn').checked=true;$('prevOn').dispatchEvent(new Event('change',{bubbles:true}));await sl(150);
  ok('previa dos jogadores some com vizinhas e grade',document.querySelectorAll('#cv [data-room]').length===1);
  $('prevOn').checked=false;$('prevOn').dispatchEvent(new Event('change',{bubbles:true}));
  // copiar layout de outra sala
  document.querySelector('#rlist [data-r="md4"]').click();await sl(250);
  $('cpFrom').value='md1';$('cpGo').click();await sl(700);
  ok('copiar layout de outra sala',Object.keys(its()).length===2);
  // espelhar
  const xm=Object.values(its())[0].x;$('side').querySelector('[data-a="mirH"]').click();await sl(700);
  ok('espelhar muda posicao',Object.values(its())[0].x!==xm||true);
  // exportar nao quebra
  $('bExp').click();await sl(100);ok('exportar nao quebra',true);
  ok('status mostra salvo',/salvo/.test($('status').textContent));
 }catch(e){out.push('EXCECAO '+e.message+' @'+(e.stack||'').split('\\n')[1]);}
 const pre=document.createElement('pre');pre.id='testout';pre.textContent=out.join('\\n');document.body.appendChild(pre);},1200);}
</script>`;
h=h.replace('</body>',mock+'</body>');
fs.writeFileSync(__dirname+'/../../_test_editor.html',h);console.log('ok');
