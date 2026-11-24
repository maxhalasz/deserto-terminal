# Submarino: rework como ferramenta de movimento

Status: PROJETO, nada implementado (2026-11-24). Substitui o visor 3D, o grid DDA e o sensor de movimento em tempo real. Perguntas em aberto no fim.

## Princípio

O terminal não mostra o mundo. Mostra instrumentos e executa ordens de movimento.
O mundo está no mapa do Guardião. O que se vê pelas câmeras sai da boca do Guardião quando um jogador pergunta.
A habilidade é do personagem (ficha, dados), não do jogador (reflexo, WASD). Sem minigame.

## O que o terminal faz

- **Instrumentos:** profundidade, rumo, velocidade, oxigênio, bateria, casco, cabo, luz, relógio de bordo.
- **Ordens:** rumo, profundidade-alvo, velocidade (parado, lenta, média, rápida), luz, soltar lastro (subida de emergência), recolher.
- **Câmeras:** lista (frente, baixo, popa, laterais) com estado (ok, estática, cega) e tempo de recarga. O jogador declara "olho a câmera 2"; o terminal marca a câmera em uso no painel do Guardião e liga o relógio. A resposta é falada. Opcional: o Guardião digita uma linha e ela aparece no monitor.
- **Log de bordo:** ordens e eventos, automático, só texto.

Fica de fora: qualquer imagem do ambiente, raycaster, partículas, parede de escuridão, vigas, colisão em tempo real.

## O que o Guardião tem

- **Mapa de nós**, não grid: lugares (cavidade, bifurcação, planície, desfiladeiro) ligados por trechos com distância, profundidade e dificuldade. A migração DDA fica morta.
- Posição exata do submarino, só no painel dele. A estação e o submarino veem o que os instrumentos reportam (profundidade, rumo), nunca onde estão.
- Contadores que ele mexe: oxigênio, bateria, casco, cabo, estado de cada câmera.
- Botões: pausar, travar o submarino, falha de comunicação (corta o log e os instrumentos da estação).

## Mecânica (Call of Cthulhu 7e)

Unidade de jogo: o **trecho**. Cada ordem de avanço cumpre um trecho; o Guardião resolve antes do próximo.

1. **Pilotar.** Quem está no posto rola *Pilotar (Submersível)*, especialização nova (base 1%). Dificuldade do trecho: Regular, Difícil (desfiladeiro, corrente) ou Extrema (passagem que mal cabe). Sucesso: passa limpo. Falha: **perigo** (ver 3).
2. **Velocidade escolhe o dado.** Rápida: dado de penalidade e menos tempo gasto. Lenta: dado de bônus e mais oxigênio e bateria. O relógio é a tensão; a perícia não é.
3. **Perigo.** Raspão (casco −1d3, ruído), perda de tempo, rumo errado, cabo preso. **Forçar a rolagem** vale, com justificativa (parar, ligar a luz, voltar um trecho). Falha forçada: encalhe, casco −1d6, algo ouve. Falha crítica (96–00): desastre.
4. **Estação guia por voz.** O operador rola *Navegar* ou *Eletrônica* pra ler a telemetria. Sucesso: o Guardião dá contatos e rumo certos. Falha: dado tardio ou impreciso. A voz vale tanto quanto o dado.
5. **Olhar a câmera.** Rolagem de *Encontrar* do jogador que declarou. Luz ligada: dado de bônus, e quem estiver lá fora também vê o submarino. Submarino parado: bônus. Em velocidade: penalidade. Regular: o essencial. Difícil: o detalhe. Extremo: o detalhe que muda a decisão. Falha: nada de especial, ou algo ambíguo.
6. **Custo de olhar.** Recarga por câmera (como na estação), bateria da luz, e **Sanidade**: quem entende demais perde mais. Sugestão: a perda de SAN só vale no sucesso Extremo; quem falha não viu bem e poupa.
7. **Perseguição.** Criatura contra submarino usa o capítulo de perseguições do livro (rolagem de velocidade, ações de movimento, perigos e barreiras). Os nós são os locais; o casco é a barreira. O terminal só mostra a velocidade efetiva resultante.
8. **Sorte.** O jogador pode gastar Sorte pra salvar o piloto, como no livro.

Os números exatos de velocidade, perigo e barreira estão no Guia do Guardião (cap. de perseguições, pp. 132 e 414 da edição em inglês); conferir lá antes de fixar.

## Dados no Firebase (`sessions/<SESSION>/submarine`)

- `nav {x, depth, heading, mode}` continua (mode: moonpool, diving, reeling).
- `ctl {heading, depth, speed, light}` ordens dos jogadores.
- `inst {o2, bat, hull, cable}` só o Guardião escreve.
- `cams/<id> {state, cd}` estado e recarga.
- `log/<push> {t, at, txt}`.

## Reaproveitar

- A transição do moonpool (`animateDive`, 100 ↔ 200 m) vira uma contagem de tempo, sem animação.
- O visual do terminal segue o tema NeuroStat da estação (cinza azulado, azul vivo): é o mesmo fabricante.
- O sensor de movimento do painel do Guardião vira lista de contatos em texto, escrita por ele.

## Perguntas em aberto

1. Trecho por ordem (decisão do Guardião a cada avanço) ou movimento contínuo e lento que o Guardião pausa?
2. O operador da estação tem algum botão (recolher o cabo) ou é só leitura?
3. O sensor de movimento morre, ou fica como contatos em texto?
4. O casco em PNG com visor recortado sai, ou fica como moldura dos instrumentos?
5. A resposta das câmeras é só falada, ou o Guardião também digita uma linha no monitor?
