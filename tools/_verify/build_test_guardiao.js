const fs=require('fs');
const g=fs.readFileSync(__dirname+'/../../guardiao.html','utf8');
const css=g.match(/<style>[^]*?<\/style>/)[0];
const seed={online:true,map:{pin:{deck:'module',x:35,y:26.8},rooms:{md0:{at:1},md1:{at:2},md4:{at:3}},corr:{mc_cm:true,mc_cn:true,mc_cp:true,mc_f2:true,mc_dm:true}},notes:{a:{t:'who has keys to M22?',at:Date.now()-60000,by:'OP-3',r:'md8'},b:{t:'hum under the floor',at:Date.now(),by:'OP-1'}}};
const h=`<!doctype html><html><head><meta charset="utf-8">${css}</head><body><div class="top"><h1>PAINEL DO <span>GUARDIÃO</span></h1></div>
<div class="tabs"><button class="tab">ESTAÇÃO</button><button class="tab active">MAPA</button><button class="tab">SUBMARINO</button></div>
<div id="tab-mapa" class="tabpanel active"></div>
<script src="station-data.js"></script><script src="station-eq.js"></script><script src="station-render.js"></script><script src="station-gm-data.js"></script><script src="guardiao-map.js"></script>
<script>
let data={sessions:{x:{station:${JSON.stringify(seed)}}}};const L=[];
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
 }catch(e){out.push('EXCECAO '+e.message);}
 const pre=document.createElement('pre');pre.id='testout';pre.textContent=out.join('\\n');document.body.appendChild(pre);},1200);}
</script></body></html>`;
fs.writeFileSync(__dirname+'/../../_test_guardiao.html',h);console.log('ok');
