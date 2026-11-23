// Gera _test_estacao.html (na raiz, nao versionado) com Firebase de mentira e um cenario de estado. Uso: node tools/_verify/build_test_estacao.js [start|mid|late]
const fs=require('fs');
const scen=process.argv[2]||'mid';
let h=fs.readFileSync(__dirname+'/../../estacao.html','utf8');
h=h.replace(/<script src="https:\/\/www\.gstatic[^]*?firebase-config\.js"><\/script>/,'');
h=h.replace(/<script>\s*var _unsubAuth[^]*?<\/script>/,'');
const mock=`<script>
const SEED=${JSON.stringify(seed(scen))};
function seedFn(){return SEED;}
(function(){
 let data={sessions:{x:{station:JSON.parse(JSON.stringify(SEED))}}};const L=[];
 const get=p=>p.split('/').filter(Boolean).reduce((o,k)=>o==null?o:o[k],data);
 const set=(p,v)=>{const a=p.split('/').filter(Boolean);let o=data;for(let i=0;i<a.length-1;i++){if(o[a[i]]==null||typeof o[a[i]]!=='object')o[a[i]]={};o=o[a[i]];}if(v===null)delete o[a[a.length-1]];else o[a[a.length-1]]=v;};
 const snap=p=>({val:()=>{const v=get(p);return v==null?null:JSON.parse(JSON.stringify(v));}});
 const notify=()=>L.forEach(l=>l.cb(snap(l.p)));
 const node=p=>({child:c=>node(p+'/'+c),on:(e,cb)=>{L.push({p,cb});cb(snap(p));},set:v=>{set(p,v);notify();return Promise.resolve();},remove:()=>{set(p,null);notify();return Promise.resolve();},
   push:v=>{const k='k'+Math.random().toString(36).slice(2,8);set(p+'/'+k,v);notify();return{key:k};},once:()=>Promise.resolve(snap(p)),transaction:f=>{set(p,f(get(p)));notify();}});
 window.sessionRef=node('sessions/x');window.__data=()=>data;
})();
</script>`;
function seed(s){
  global.window=global;eval(fs.readFileSync(__dirname+'/../../station-data.js','utf8'));const MC=window.STATION.DECKS.module.corr;
  const cleanR=['mb_ent','mb_st','mb_lf','md1','md2','md3','md12','mc_chg','md_ppe','ms_les','ms_cal'];
  const cleanC=MC.filter(c=>c.r[0]<47&&!c.open).map(c=>c.id);
  const dirtyR=['md4','md5','md6','md8','mt_w','mt_c','md_lab','md_chem'];
  const dirtyC=MC.filter(c=>c.r[0]>=47&&c.r[0]<100&&!c.open).map(c=>c.id);
  const T=Date.now()-3600e3;const R=a=>{const o={};a.forEach((k,i)=>o[k]={at:T+i*90e3});return o;},C=a=>{const o={};a.forEach(k=>o[k]=true);return o;};
  const base={online:true,unlocked:{weather:true,module:true,cellar:true,quarters:true},cams:{cam03:{on:true,pulledAt:0}},force:null,
    map:{pin:{deck:'module',x:40,y:26},rooms:{},corr:{}},notes:{}};
  if(s==='start'){base.map.rooms=R(['md1','md0']);base.map.corr=C(['mc_m','mc_f2','mc_t']);base.unlocked={module:true};}
  if(s==='mid'){base.map.rooms=R([...cleanR,...dirtyR]);base.map.corr=C([...cleanC,...dirtyC]);
    base.notes={a:{t:'boot room: 3 tool outlines empty',at:T+1e6,by:'OP-1',r:'md1'},b:{t:'fire door 2 jams. kick it low',at:T+2e6,by:'OP-2'},c:{t:'who has keys to M22?',at:T+3e6,by:'OP-3',r:'md8'},d:{t:'hum under the floor, same as 3:12',at:T+4e6,by:'OP-1'}};}
  if(s==='late'){base.map.rooms=R([...cleanR,...dirtyR,'md7','md10','md9','md_inj','md_wc','md_se','md_ins','md_scba','md_trf']);base.map.corr=C([...cleanC,...dirtyC,'mc_dn4']);
    base.map.rooms.wd1={at:T};base.map.corr.wc_n=true;}
  return base;
}
h=h.replace('<script>\nvar _unsubAuth','<script>\nvar _x');
h=h.replace('</body>',mock+'<script>StationApp.start(sessionRef);const q=new URLSearchParams(location.search);if(q.get("sel"))document.querySelector("[data-room=\\""+q.get("sel")+"\\"]")&&document.querySelector("[data-room=\\""+q.get("sel")+"\\"]").dispatchEvent(new MouseEvent("click",{bubbles:true}));</script></body>');
h=h.replace('</body>','<script>'+fs.readFileSync(__dirname+'/estacao_inpage_test.js','utf8')+'</script></body>');fs.writeFileSync(__dirname+'/../../_test_estacao_'+scen+'.html',h);console.log('ok '+scen);
