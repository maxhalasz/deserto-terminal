# Estação: camadas VENT e POWER

Status: PROTOTIPO visual (2026-11-24). As abas VENT e POWER do terminal continuam desligadas. O protótipo só aparece com `estacao.html?layer=vent` ou `?layer=power`. Falta o Max aprovar a direção antes de ligar nas abas e no painel do Guardião.

## Ideia

O mapa escurece e a rede aparece por cima, com o traço detalhado e as prumadas que mostram onde a rede sobe e onde desce. A planta de baixo fica como orientação (contorno fraco e nomes); o que importa é a rede.

- **VENT.** Insuflamento em creme, exaustão em laranja, os dois em duto vazado (parede fina, miolo escuro) com seta de fluxo. Cada sala atendida ganha um ramal curto e uma grelha: quadrado com X no insuflamento, círculo com cruz na exaustão. Unidades: casa de ar-condicionado (duas turbinas), ventilador, chaminé do gas vent.
- **POWER.** Alimentador de alta em laranja grosso (geradores, quadro principal, transformador), distribuição de baixa em creme fino com pontos de quadro. Geradores, quadro, transformador, UPS e baterias têm símbolo próprio. Alimentação de emergência tracejada.
- **Prumadas.** Anel com ▲ (sobe), ▼ (desce) ou os dois, e uma etiqueta com o destino ("L-06 · DECKS A–E", "L-07 ↑ GAS VENT"). A prumada fica no mesmo x,y em todos os decks que atravessa.

## Como o protótipo funciona

`station-systems.js` gera a rede a partir da própria planta: o eixo dos corredores vira o caminho de duto e de cabo, o caminho mais curto entre a origem e cada sala vira o tronco (a espessura cresce com o número de salas atendidas) e cada porta vira um ramal. Nada é desenhado à mão deck a deck. O desenho em si está em `station-render.js` (`sysLayer`).

Prumadas definidas:

- **Ar-condicionado do bloco:** (24,5; 21,5) no module deck, (22,5; 9,5) em cada deck do alojamento. Do HVAC do nível técnico sobe até o AHU do Deck E.
- **Exaustão de processo:** (50,5; 40,5) no cellar, no module e no weather. Sobe do cellar, atravessa a área suja e descarrega no gas vent.
- **Energia:** no núcleo do bloco, (28,5; 26) global. Sobe do quadro principal do cellar até os decks do alojamento.

Decks cobertos: module, cellar, weather e os cinco decks do bloco (módulo e cellar são os mais completos).

## Para decidir

1. O visual agrada? Ajustes possíveis: intensidade do escurecimento, cor do insuflamento, ramais até o centro da sala ou só até a porta.
2. O jogador vê a rede toda ou só o que o Guardião revelou (mesma regra do mapa: só aparece onde a sala ou o corredor foi revelado)?
3. O Guardião edita a rede (mover prumada, apagar ramal, desligar um trecho) ou o gerador basta?
4. Clicar numa prumada leva ao deck de destino com o foco na mesma prumada?
5. Algum trecho "morto" ou com falha (duto desligado, quadro sem energia) como pista narrativa? Fica pra uma segunda etapa.
