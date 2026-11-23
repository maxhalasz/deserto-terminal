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
    ok('nada de survey nem porcentagem na tela',!/survey|levantad|\d+\s?%|\bTOTAL\b/i.test(document.getElementById('scene').innerText)&&!/\d+%/.test(document.getElementById('stack').textContent));
    await sleep(2600);
    ok('descricao no formato Nome. Explicacao.',/^Módulo desativado\. Antigo módulo/.test($('ncard').querySelector('p').textContent));
    click(document.querySelector('[data-lvl="module"]'));click(document.querySelector('#planwrap [data-room="md4"]'));
    ok('nenhum texto sobre DRE na pagina',!/DRE/.test(document.getElementById('scene').innerText));
    ok('nao ha painel de arquivos',!document.getElementById('fileBody')&&!document.getElementById('pFiles'));
    const vb0=document.querySelector('#planwrap svg').getAttribute('viewBox');
    click($('zIn'));const vb1=document.querySelector('#planwrap svg').getAttribute('viewBox');
    ok('zoom + muda o viewBox',vb0!==vb1);
    // o Edge sem janela as vezes nao entrega requestAnimationFrame: sem rAF a animacao nao anda e o teste nao prova nada
    let rafN=0;const rafProbe=()=>{rafN++;requestAnimationFrame(rafProbe);};requestAnimationFrame(rafProbe);
    click($('zFit'));await sleep(900);
    ok('FIT sai do zoom (animado)'+(rafN?'':' [sem rAF neste navegador: ignorado]'),!rafN||document.querySelector('#planwrap svg').getAttribute('viewBox')!==vb1);
    const inp=$('ninp');inp.value='teste de nota';inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    ok('nota adicionada',/teste de nota/.test($('nbl').innerHTML));
    ok('nota sem horario nem autor',!/<small>/.test($('nbl').innerHTML));
    ok('nota ligada a sala',/<span class="rt"/i.test($('nbl').innerHTML));
    // desempenho: nota nova nao redesenha pilha nem mapa
    const stackNode=$('stack').firstChild,planNode=document.querySelector('#planwrap svg.cur');
    const inp2=$('ninp');inp2.value='segunda nota';inp2.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await sleep(100);
    ok('nota nova nao redesenha a pilha',$('stack').firstChild===stackNode);
    ok('nota nova nao redesenha o mapa',document.querySelector('#planwrap svg.cur')===planNode);
    // clicar no chip da sala leva ate ela
    click(document.querySelector('#planwrap [data-room="md1"]'));click(document.querySelector('#nbl .rt'));await sleep(50);
    ok('chip da nota seleciona a sala',/Wellbay|Boot room/i.test($('recName').textContent));
    // destaque vindo do Guardiao
    sessionRef.child('station/map/focus').set({room:'md6',at:Date.now()});await sleep(200);
    ok('destaque do Guardiao seleciona a sala',/Separation/i.test($('recName').textContent));
    ok('destaque do Guardiao pulsa a sala',!!document.querySelector('#planwrap .pulse.long'));
    // teclado
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(50);
    ok('Esc limpa a selecao',!/Separation/i.test($('recName').textContent));
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
    // props do customizador: so aparecem se a sala/corredor onde estao ja foi revelado
    {const q4=STATION.roomIndex.md4.r,q9=STATION.roomIndex.md9.r;
     const mkp=r=>({deck:'module',x:r[0]+r[2]/2,y:r[1]+r[3]/2,rot:30,sc:1,w:1,h:1,ops:[['rc',-.5,-.5,1,1,0,1]],lbl:'T1',inl:0,txt:0});
     sessionRef.child('station/map/props/pa').set(mkp(q4));await sleep(300);
     ok('prop em sala revelada aparece',!!document.querySelector('#planwrap [data-prop="pa"]'));
     ok('prop em sala oculta nao vaza no DOM',!document.querySelector('#planwrap [data-prop="pb"]'));
     ok('rotulo do prop aparece',/T1/.test(document.querySelector('#planwrap svg.cur').textContent));
     ok('prop novo ganha pulso',!!document.querySelector('#planwrap circle.pulse'));
     sessionRef.child('station/map/props/pb').set(mkp(q9));await sleep(300);
     ok('prop em sala oculta nao vaza no DOM',!document.querySelector('#planwrap [data-prop="pb"]'));
     sessionRef.child('station/map/rooms/md9').set({at:Date.now()});await sleep(300);
     ok('prop aparece quando a sala e revelada',!!document.querySelector('#planwrap [data-prop="pb"]'));
     ok('prop nao e clicavel no terminal',!!document.querySelector('#planwrap g.props[pointer-events="none"]'));
     sessionRef.child('station/map/props').set(null);sessionRef.child('station/map/rooms/md9').set(null);await sleep(200);
     ok('apagar prop tira do mapa',!document.querySelector('#planwrap [data-prop]'));}
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
