// Executado DENTRO da pagina de teste (Firebase de mentira). Escreve o resultado num <pre id="testout">.
(function(){
if(!new URLSearchParams(location.search).get('run'))return;
setTimeout(()=>{
  const out=[];const ok=(n,c)=>out.push((c?'OK    ':'FALHA ')+n);
  const $=id=>document.getElementById(id);
  const click=el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  try{
    click(document.querySelector('[data-deck="lqD"]'));
    ok('chip LQ D troca o plano',/LIVING QUARTERS · DECK D/i.test($('planwrap').innerHTML));
    click(document.querySelector('[data-lvl="module"]'));
    click(document.querySelector('#planwrap [data-room="md4"]'));
    ok('selecionar sala mostra registro',/WELLBAY/i.test($('recBody').innerHTML));
    ok('cartao mostra texto publico',/wellheads/i.test($('ncard').innerHTML));
    ok('sala oculta nao existe no DOM',!document.querySelector('#planwrap [data-room="md9"]'));
    const inp=$('ninp');inp.value='teste de nota';inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    ok('nota adicionada',/teste de nota/.test($('nbl').innerHTML));
    ok('nota ligada a sala',/<span class="rt">[^<]*M10/i.test($('nbl').innerHTML));
    click(document.querySelector('.fitem'));
    ok('arquivo abre',$('docov').classList.contains('on')&&/Incident/.test($('docbody').innerHTML));
    ok('tarja vira redacted',/class="redacted"/.test($('docbody').innerHTML));
    click($('docback'));ok('voltar fecha',!$('docov').classList.contains('on'));
    click($('btnCctv'));ok('CCTV mostra camera',/CAM-03/.test($('planwrap').innerHTML));
    sessionRef.child('station/force').set('cellar');
    ok('forcado vai pro cellar',/CELLAR DECK/i.test($('planwrap').innerHTML)&&/DIRECTED VIEW/.test($('topinfo').innerHTML));
    sessionRef.child('station/force').set(null);
    sessionRef.child('station/unlocked').set({helipad:true});
    ok('id legado helipad libera weather',!document.querySelector('[data-lvl="weather"]').classList.contains('lock'));
    ok('legado control mapeia arquivo pro module',(function(){sessionRef.child('station/unlocked').set({module:true});click(document.querySelector('[data-lvl="module"]'));return /Maintenance log/.test($('fileBody').innerHTML);})());
    sessionRef.child('station/online').set(false);
    ok('standby quando offline',$('standby').style.display==='flex');
  }catch(e){out.push('EXCECAO '+e.message+' @'+(e.stack||'').split('\n')[1]);}
  const pre=document.createElement('pre');pre.id='testout';pre.textContent=out.join('\n');document.body.appendChild(pre);
},1500);
})();
