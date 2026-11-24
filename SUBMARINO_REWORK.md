# Submarino: rework como ferramenta da mesa

Status: PROJETO, nada implementado (revisado em 2026-11-24 depois do feedback do Max). Substitui o visor 3D, o grid DDA e o sensor de movimento em tempo real. Perguntas em aberto no fim.

## Princípio

O submarino é um adicional da campanha. A campanha não gira em torno dele.
Nenhuma rolagem acontece na ferramenta. Pilotar, olhar e qualquer teste de perícia se resolvem na mesa real, com dados reais, como em qualquer cena.
O terminal serve pra duas coisas: mover o submarino com facilidade e dar aos jogadores a sensação de estar presos lá dentro.
O que se vê nas câmeras sai da boca do Guardião, quando os jogadores perguntam.

## O que o terminal faz

- **Mover.** Controle simples, sem habilidade do jogador: poucos botões ou teclas pra rumo, profundidade e velocidade. Os jogadores escolhem a experiência de pilotar que quiserem (um pilota, todos opinam, ordens faladas, revezamento). A ferramenta não impõe papel nem exige perícia.
- **Instrumentos básicos** pra dar corpo à cabine: profundidade, rumo, velocidade, oxigênio, bateria, casco. O Guardião mexe nos contadores; nada se calcula sozinho.
- **Isolamento.** O ponto principal. Sugestões abaixo.
- **Log de bordo** automático, só texto.

Fica de fora: qualquer imagem do ambiente, raycaster, partículas, colisão em tempo real, rolagens, perícias.

## O que o Guardião tem

- Posição do submarino e um mapa pra se orientar. O formato (nós, grade, desenho solto) é livre; a ferramenta só precisa guardar onde o submarino está.
- Contadores (oxigênio, bateria, casco, cabo) e um botão de falha de comunicação.
- Pausar e travar o submarino.

## Isolamento (ideias, nada decidido)

Os jogadores no submarino precisam sentir que estão sozinhos.

1. **Som da cabine.** Ambiente contínuo no terminal (estrutura rangendo, bomba, respiração do sistema) que sobe e desce com a profundidade e a velocidade. Cobre a voz de quem está fora da sala.
2. **Quem está fora mal se ouve.** Tocar o ruído de cabine em volta dos jogadores (alto-falante ou fone) pra dificultar ouvir o que o resto da mesa fala. O Guardião controla o volume.
3. **Rádio com a estação.** A conversa com os operadores passa por um canal com chiado e corte. Falha de comunicação semanal vira silêncio total: só o ruído.
4. **Escuridão.** Tela quase preta, sem imagem. A luz da cabine é uma lâmpada que o Guardião pode apagar.

Reaproveitar: o visual do terminal pode seguir o monitor da NeuroStat (`monitor.html`, cinza azulado).

## Dados no Firebase (`sessions/<SESSION>/submarine`)

- `nav {x, depth, heading, mode}` continua (mode: moonpool, diving, reeling).
- `ctl {heading, depth, speed}` ordens dos jogadores.
- `inst {o2, bat, hull}` só o Guardião escreve.
- `ambience {level, comms}` volume do ruído e estado do rádio, só o Guardião escreve.
- `log/<push> {t, at, txt}`.

## Perguntas em aberto

1. Que controle de movimento: teclas simples, botões na tela, ou ordens que o Guardião aceita e aplica?
2. O áudio de isolamento sai por alto-falante da sala ou por fone dos jogadores?
3. O operador da estação só lê, ou tem algum botão (recolher o cabo)?
4. O casco em PNG com visor recortado sai, ou fica como moldura dos instrumentos?
5. O sensor de movimento morre, ou vira uma lista de contatos que o Guardião escreve?
