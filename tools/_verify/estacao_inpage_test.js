// Executado DENTRO da pagina de teste (Firebase de mentira). Escreve o resultado num <pre id="testout">.
(function(){
if(!new URLSearchParams(location.search).get('run'))return;
setTimeout(async()=>{
  const out=[];const ok=(n,c)=>out.push((c?'OK    ':'FALHA ')+n);
  const $=id=>document.getElementById(id);
  const await_=()=>{};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const click=el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  try{
    click(document.querySelector('[data-deck="lqD"]'));
    ok('chip LQ D troca o plano',/Deck D/i.test($('recName').textContent));
    click(document.querySelector('[data-lvl="module"]'));
    click(document.querySelector('#planwrap [data-room="md4"]'));
    ok('selecionar sala mostra nome na faixa',/Wellbay/i.test($('recName').textContent));
    ok('sala aberta aparece UNLOCKED',/UNLOCKED/.test($('recStat').textContent));
    ok('cartao mostra o nome da sala',/WELLBAY/i.test($('ncard').innerHTML));
    click(document.querySelector('#planwrap [data-room="md8"]'));
    ok('sala selada aparece LOCKED',/^LOCKED/.test($('recStat').textContent));
    ok('sala oculta nao existe no DOM',!document.querySelector('#planwrap [data-room="md9"]'));
    ok('nenhum nivel submerso na pagina',!/SUBMERGED|NOT SURVEYED/.test(document.getElementById('scene').innerText));
    ok('porcentagem levantada aparece',/SURVEYED\s*\d+%/.test($('topinfo').innerText.replace(/\s+/g,' '))&&/TOTAL/.test($('topinfo').innerText));
    ok('placa do nivel mostra porcentagem',/\d+%/.test(document.querySelector('[data-lvl="module"]').textContent));
    await sleep(2600);
    ok('descricao da sala em portugues',/Portão de tela/.test($('ncard').textContent));
    ok('nenhum texto sobre DRE na pagina',!/DRE/.test(document.getElementById('scene').innerText));
    ok('nao ha painel de arquivos',!document.getElementById('fileBody')&&!document.getElementById('pFiles'));
    const vb0=document.querySelector('#planwrap svg').getAttribute('viewBox');
    click($('zIn'));const vb1=document.querySelector('#planwrap svg').getAttribute('viewBox');
    ok('zoom + muda o viewBox',vb0!==vb1);
    click($('zFit'));ok('FIT volta ao enquadramento',document.querySelector('#planwrap svg').getAttribute('viewBox')===vb0);
    const inp=$('ninp');inp.value='teste de nota';inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    ok('nota adicionada',/teste de nota/.test($('nbl').innerHTML));
    ok('nota sem horario nem autor',!/<small>/.test($('nbl').innerHTML));
    ok('nota ligada a sala',/<span class="rt">/i.test($('nbl').innerHTML));
    click($('btnCctv'));ok('CCTV mostra camera',/CAM-03/.test($('planwrap').innerHTML));
    // descricao editada pelo Guardiao aparece ao vivo (typewriter leva ~1.5 s)
    click(document.querySelector('[data-lvl="module"]'));click(document.querySelector('#planwrap [data-room="md4"]'));
    sessionRef.child('station/map/desc/md4').set('Texto novo do mestre sobre o wellbay.');
    await sleep(2600);
    ok('descricao editada aparece no cartao',/Texto novo do mestre/.test($('ncard').textContent));
    // revelar sala nova gera brilho
    sessionRef.child('station/map/rooms/md9').set({at:Date.now()});
    await sleep(300);
    ok('sala revelada ganha pulso',!!document.querySelector('#planwrap .pulse'));
    ok('sala revelada aparece no plano',!!document.querySelector('#planwrap [data-room="md9"]'));
    sessionRef.child('station/map/rooms/md9').set(null);
    sessionRef.child('station/force').set('cellar');
    ok('forcado vai pro cellar',/Cellar deck/i.test($('recName').textContent)&&/DIRECTED VIEW/.test($('topinfo').innerHTML));
    sessionRef.child('station/force').set(null);
    sessionRef.child('station/unlocked').set({helipad:true});
    ok('id legado helipad libera weather',!document.querySelector('[data-lvl="weather"]').classList.contains('lock'));
    document.querySelector('.tab2[data-tab="cams"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));
    const vc=$('view-cams').getBoundingClientRect(),hd=document.querySelector('.hdr').getBoundingClientRect();
    ok('aba cameras nao cobre o cabecalho',vc.top>=hd.bottom-1&&$('view-cams').style.display==='block');
    sessionRef.child('station/online').set(false);
    ok('standby quando offline',$('standby').style.display==='flex');
  }catch(e){out.push('EXCECAO '+e.message+' @'+(e.stack||'').split('\n')[1]);}
  const pre=document.createElement('pre');pre.id='testout';pre.textContent=out.join('\n');document.body.appendChild(pre);
},1500);
})();
