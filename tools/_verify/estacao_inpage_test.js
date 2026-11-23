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
    ok('sala aberta nao mostra LOCKED/UNLOCKED',!/LOCKED/i.test(document.getElementById('scene').innerText));
    ok('cartao mostra o nome da sala',/WELLBAY/i.test($('ncard').innerHTML));
    click(document.querySelector('#planwrap [data-room="md8"]'));
    ok('sala selada tambem nao mostra LOCKED',!/LOCKED/i.test(document.getElementById('scene').innerText)&&!document.getElementById('recStat'));
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
     {const n0=document.querySelectorAll('#planwrap svg.cur g[clip-path]').length;sessionRef.child('station/map/noeq/md4').set(true);await sleep(300);
      ok('noeq esconde o equipamento padrao da sala',document.querySelectorAll('#planwrap svg.cur g[clip-path]').length===n0-1);
      sessionRef.child('station/map/noeq/md4').set(null);
      sessionRef.child('station/map/props/L~md4~500~i1').set(Object.assign(mkp(q4),{sx:3,sy:1}));await sleep(300);
      ok('prop de layout esticado (sx) aparece',/scale\([\d.]+ [\d.]+\)/.test(document.querySelector('#planwrap [data-prop="L~md4~500~i1"]').getAttribute('transform')));}
     sessionRef.child('station/map/props').set(null);sessionRef.child('station/map/rooms/md9').set(null);await sleep(200);
     ok('apagar prop tira do mapa',!document.querySelector('#planwrap [data-prop]'));}
    // caderno: so compartilhado
    ok('sem botao MINE',!document.getElementById('nmMine')&&!/MINE/.test(document.querySelector('.ntools').textContent));
    // pilha isometrica com a torre de alojamento
    ok('pilha tem os 5 decks do alojamento',['lqE','lqD','lqC','lqB','lqA'].every(k=>document.querySelector('#stack [data-deck="'+k+'"]')));
    ok('pilha tem os 3 decks da plataforma',['weather','module','cellar'].every(k=>document.querySelector('#stack [data-lvl="'+k+'"]'))&&document.querySelectorAll('#stack polygon').length>20);
    ok('pilha diz onde chega cada um',/HELICOPTER/.test($('stack').textContent)&&/MOONPOOL/.test($('stack').textContent)&&/LIVING QUARTERS/.test($('stack').textContent));
    // cabecalho sem revisao nem codigo; aviso editavel e vermelho
    ok('sem REV nem codigo de barras no cabecalho',!/REV\b/.test(document.querySelector('.hdr').innerText)&&!document.getElementById('barcode'));
    ok('rodape do mapa sem REV',!/REV \d/.test(document.querySelector('#planwrap svg').textContent));
    ok('aviso aparece por padrao',/WARNING/.test($('ticker').textContent)&&$('ticker').style.display!=='none');
    ok('aviso e vermelho',/rgb\((2[0-9]{2}|1[5-9][0-9]), ?[0-9]{1,2}, ?[0-9]{1,2}\)/.test(getComputedStyle(document.querySelector('#ticker b')).backgroundColor));
    sessionRef.child('station/ticker').set(['SEM CONTATO COM A TERRA']);await sleep(250);
    ok('aviso editado pelo Guardiao aparece',/SEM CONTATO/.test($('ticker').textContent)&&!/COMM SYNC/.test($('ticker').textContent));
    sessionRef.child('station/ticker').set('off');await sleep(250);
    ok('aviso removido some',$('ticker').style.display==='none');
    sessionRef.child('station/ticker').set(null);await sleep(250);
    ok('sem registro volta o padrao',/COMM SYNC/.test($('ticker').textContent));
    // pilha: bloco do alojamento integrado
    ok('contorno do bloco no module deck',!!document.querySelector('#stack .sk-blk'));
    ok('heliponto A no teto +62 e sem H no weather',/HELIPORT A/.test($('stack').textContent)&&/\+62/.test($('stack').textContent)&&(($('stack').textContent.match(/>H</g)||[]).length===0)&&($('stack').innerHTML.match(/>H<\/text>/g)||[]).length===1);
    // tema claro/escuro
    click($('btnTheme'));ok('tema claro liga',document.documentElement.getAttribute('data-theme')==='light'&&/DARK/.test($('themeLbl').textContent));
    click($('btnTheme'));ok('tema escuro volta',document.documentElement.getAttribute('data-theme')==='dark');
    // mapa coberto: so o nome, sem o que tem dentro
    click(document.querySelector('[data-lvl="module"]'));await sleep(200);
    {const mk=r=>({deck:'module',x:r[0]+r[2]/2,y:r[1]+r[3]/2,rot:0,sc:1,w:1,h:1,ops:[['rc',-.5,-.5,1,1,0,1]],lbl:'',inl:0,txt:0});
     sessionRef.child('station/map/props/pv').set(mk(STATION.roomIndex.md4.r));await sleep(250);
     ok('prop aparece antes de cobrir',!!document.querySelector('#planwrap [data-prop="pv"]'));
     const eq0=document.querySelectorAll('#planwrap svg.cur g[clip-path]').length;
     sessionRef.child('station/map/veilAll').set(true);await sleep(300);
     const sv=document.querySelector('#planwrap svg.cur');
     ok('mapa coberto some com o equipamento',document.querySelectorAll('#planwrap svg.cur g[clip-path]').length===0);
     ok('sala coberta some com o prop',!document.querySelector('#planwrap [data-prop="pv"]'));
     ok('sala coberta mostra so o nome',/WELLBAY/i.test(sv.textContent)&&!/350 m²/.test(sv.textContent));
     sessionRef.child('station/map/veilAll').set(null);sessionRef.child('station/map/props/pv').set(null);await sleep(250);
     ok('descobrir volta o conteudo',/350 m²/.test(document.querySelector('#planwrap svg.cur').textContent));}
    // tela cheia, setas trocam de nivel, pino
    ok('botao YOU ARE HERE aparece com pino',!$('btnPin').classList.contains('hid'));
    click($('btnFull'));await sleep(400);
    ok('tela cheia liga',document.body.classList.contains('full')&&$('planwrap').offsetWidth>1200);
    ok('caneta some na tela cheia',getComputedStyle(document.querySelector('.pen')).display==='none');
    const dn=document.getElementById('recName').textContent;
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));await sleep(300);
    ok('seta pra baixo desce de nivel',document.getElementById('recName').textContent!==dn&&/Cellar|Deck A|Living/i.test(document.getElementById('recName').textContent));
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));await sleep(300);
    ok('seta pra cima sobe de nivel',document.getElementById('recName').textContent===dn||/Module/i.test(document.getElementById('recName').textContent));
    for(let i=0;i<9;i++){document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));await sleep(120);}
    ok('as setas passam pelos decks do alojamento',/Deck E|Living quarters/i.test(document.getElementById('recName').textContent));
    click($('btnPin'));await sleep(500);
    ok('YOU ARE HERE leva ao deck do pino',/Module/i.test(document.getElementById('recName').textContent)||/M\d|Boot|Control|Lounge|Gym|Crew|Officer|Electrical/i.test(document.getElementById('recName').textContent));
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(150);
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(250);
    ok('Esc sai da tela cheia',!document.body.classList.contains('full'));
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
