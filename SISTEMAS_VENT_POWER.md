# Estação: camadas VENT e POWER

Status: PROTOTIPO na branch `estacao-rodada-9` (2026-11-24), ainda não publicado. As abas POWER e VENT do terminal agora alternam a camada (STRUCTURE volta ao mapa); `?layer=vent` ou `?layer=power` abre direto.

## Como fica

Clicar em VENT ou POWER escurece **tudo**, inclusive os nomes das salas (quase somem, só o contorno fraco fica pra orientar). A rede aparece por cima como caminhos simples:

- **VENT.** Dutos pelo forro: uma árvore ortogonal que cresce da origem até a saída mais próxima e ramifica; atravessa salas e NÃO segue os corredores. Curvas suaves, espessura que afina conforme atende menos saídas, pontinhos de ar correndo no sentido do fluxo. Insuflamento em creme, exaustão em laranja.
- **Saídas.** Duas formas: barra na parede (ao lado da porta) e anel no teto sobre o mobiliário. Nunca no centro da sala: a posição vem do tipo da sala (sobre a cama na suíte, sobre a mesa no escritório, sobre o fogão na cozinha, em linha sobre os geradores, etc.). Exaustão tem o anel com cruz.
- **Só quem precisa.** Sem ramal: escadas, elevadores, antecâmara, depósitos, câmaras frias, cabines lacradas, salas desativadas, convés, moonpool. Insuflamento vai pras salas ocupadas; exaustão pras molhadas e perigosas (banheiro, cozinha, lavanderia, laboratório, bateria, tinta, oficina, geradores, compressores, módulos de processo, wellbay).
- **POWER.** Outro desenho, em âmbar: traço angular de esquema elétrico. Alimentador de alta grosso (geradores, quadro principal, transformador), distribuição de baixa em bandeja de cabos (duas linhas com degraus) junto à parede do corredor, caixas de junção nos cantos e quadros com raio ao lado da porta. Só salas que consomem.
- **Prumadas.** Anel com ▲, ▼ ou os dois e uma etiqueta com o destino. Ficam no mesmo x,y em todos os decks que atravessam: ar-condicionado do bloco (module → Deck E), exaustão de processo (cellar → module → gas vent do weather) e energia no núcleo do bloco.
- **Segredo.** A rede só aparece onde o corredor ou a sala já foi revelado (no painel do Guardião aparece tudo).

## Como é gerado

`station-systems.js` monta a rede a partir da planta: o eixo dos corredores é o caminho, o menor caminho entre a origem e cada sala vira o tronco e cada porta vira um ramal; `FURN` guarda onde ficam as saídas por tipo de sala. O desenho está em `station-render.js` (`sysLayer`).

## Para decidir

1. Escurecimento e nomes: do jeito que está ou mais claro?
2. Sala sem ramal aparece de algum jeito (um pontinho "sem ventilação") ou fica em branco?
3. O Guardião edita (mover saída, apagar ramal, cortar um trecho) ou o gerador basta?
4. Clicar numa prumada leva ao deck de destino?
5. Falha narrativa: duto cortado, quadro sem energia, trecho que não funciona mais? Fica pra uma segunda etapa.
