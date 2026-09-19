# Projeto "O Deserto" — Terminais Virtuais de RPG

## Como me chamar e idioma
- O usuário se chama **Max**, me chama de **Claudio**.
- **Todo o trabalho e conversa em português.** Texto exibido AO JOGADOR no terminal é em inglês; o painel do GM (Guardião) é em português.
- Max dá feedback direto e cortante. Não precisa suavizar nem repetir de volta as correções — internalizar e aplicar.
- **Disciplina de pesquisa:** SEMPRE pesquisar na web antes de implementar técnica de renderização nova. As melhores soluções vieram após pesquisa (lodev.org foi a fonte-chave). Improvisar custou muitas iterações — não improvisar.
- **Validar com simulações Node** antes de entregar (ASCII art, contadores, casos extremos). Max valoriza isso.
- Preferir reescrita completa a remendos quando a fundação está errada.

## O universo (não contradizer — canon fixo)
RPG de horror Lovecraftiano/SCP chamado **"Unidos pela História"**. Campanha atual: **"O Deserto"**, numa plataforma de petróleo offshore sobre uma fenda submarina.
- **DRE**: organização secreta extinta (NUNCA escrever "o mundo não teve explicação" — ela era secreta, ninguém soube). **NeuroStat**: sucessora corporativa. **Aegis Corp** foi criada só pra Schwarzwald-Süd. **Marcus Holt**: staff da NeuroStat que supervisionou a Aegis.
- **"O Coro" (The Choir)**: cognitohazard (gatilho væl.juˈeɪn). Paciente zero **Anselm Krause** destruiu a DRE pela rede fechada.
- A criatura sob a plataforma é um **hive-mind biológico SEPARADO do Coro**, ligado a artefato Hastur (**Lente de Carcosa**, escolhida pra uso dos jogadores), sobreviveu por um marcador pálido reivindicando Carcosa, retorna após o fechamento da ferida Schwarzwald-Süd.
- **Azathoth** (não Yog-Sothoth) sustenta a realidade sonhando. O Observador de Schwarzwald-Süd é prole de Yog-Sothoth.
- Campanhas completas: "O Trono Carmesim", "Schwarzwald-Süd".
- Estrutura de "O Deserto": Chegada/Rotina → Primeira Descida (trote) → A Morte (assassinato red herring). Seção da DRE atrás de parede falsa; moonpool = limiar; soldados NeuroStat descem e não voltam; falha de comunicação semanal = relógio narrativo.

## Estilo de escrita de Max (pra lore/wiki em PT)
Seco, estrutural, consequencialista; cada frase entrega informação nova. PROIBIDO: tripla negação, paralelismo vazio, rótulo emocional, conclusões interpretativas, linguagem metagame na prosa, perguntas retóricas como pivô, comentário após imagens, em-dashes pra virada artificial, over-organização em listas. PERMITIDO: frases nominais sem verbo pra impacto ("Um qualquer."), palavrão como termômetro de intensidade. Página Mythos é exceção (arcaico/ornamentado). Cross-refs wiki: `@NomeDaPagina`. Boxed text: concreto sobre abstrato, ordem de movimento ocular (ameaça por último), ameaça inominada ("algo"/"essa coisa"), condição material como pavor, fecha relatos orais com citação direta do jogador.

---

# ARQUITETURA TÉCNICA

## Hospedagem e sync
- **GitHub Pages** + **Firebase Realtime Database**. Repo: `maxhalasz.github.io/deserto-terminal/` (usuário GitHub: **maxhalasz** — migrado de max296 em 19/set/2026, acesso àquela conta foi perdido). Arquivos na raiz do repo.
- Estado no Firebase em `sessions/deserto-mesa-01/{station,submarine}`. SDK compat 10.12.2. SESSION_KEY="deserto-mesa-01".
- Arquivos: `firebase-config.js` (chaves + SESSION_KEY), `guardiao.html` (painel GM), `estacao.html`, `submarino.html`, pasta `img/`.

## Estado autoritativo do submarino (Firebase)
`submarine/nav = { x, depth, heading, mode }` (throttle 100ms).
- `x` = posição lateral no corredor; `depth` = profundidade; `heading` = direção (0 = descer/+depth); `mode` = "moonpool" | "diving" | "reeling".
- Presença sincronizada no mesmo throttle.

## Terminais
- **estacao.html**: COMPLETO. Visual NeuroStat azul-clínico, mapa vertical, dossiês com markup, câmeras com cooldown via Firebase (frames placeholder — trocar por imagens reais é trabalho futuro).
- **submarino.html**: FOCO atual. ~975 linhas. Estética Iron Lung. Casco PNG sobreposto com visor recortado, canvas atrás renderizando a navegação. **VISOR COMPLETO E REVISADO.**
- **guardiao.html**: painel GM.
- Pendente: terminal de OPERADOR da estação (jogadores em cima monitoram o submarino, SÓ LEITURA, guiam por voz). Terminal DRE (`dre.html`): computadores VHS anos 90 degradados, não iniciado.

## Imagens
Uploads originais processados com PIL → `img/`: `old_intact.png`, `old_cracked.png` (casco velho), `neurostat.png` (moderno), `moonpool.png`. Otimizadas (quantização 128 cores). IMPORTANTE: subir tudo num commit só — commits em cadeia cancelam o deploy do Pages.

---

# VISOR DO SUBMARINO (submarino.html) — estado atual COMPLETO

Estética Iron Lung: claustrofóbico, máquina velha. Dois "skins" de casco: velho (luz quente âmbar) e NeuroStat (luz fria azulada), controlado por `STATE.skin`.

## Constantes do mundo
- `MAX_DEPTH=3122, CORAL_DEPTH=600, START_DEPTH=200`.
- Moonpool/superfície a 100m (MOON_DEPTH); submerso começa a 200m.
- `STATION_TOP=120, STATION_PILLARS_LO=150, STATION_PILLARS_HI=195`.

## Mundo atual (FÓRMULA — a ser migrado pra grid, ver abaixo)
- `CANYON` = array gerado proceduralmente (seed=7): linha central `cx` que serpenteia + meia-largura `hw` (90u no início → 45u no fundo). Gerado a cada 40m.
- `corridorAt(depth)` → `{cx, hw}` interpolado. **LIMITAÇÃO FUNDAMENTAL: uma posição lateral por profundidade — não suporta bifurcações.**
- `isPillar(x, depth)`: DOIS pilares grossos da petroleira (halfGap=hw*0.45, raio=hw*0.28) na faixa 150-195m (ACIMA do início a 200m). Fonte única (visual+colisão usam a mesma fórmula).
- `isStationBackWall(depth)`: parede/teto da estação no topo (120-130m).

## Renderização (função `draw`) — ordem de desenho
1. **Fundo + iluminação ambiente**: `ambLight = 1 - depthN*0.8` (1 a 200m → 0.2 no fundo). Cor base esverdeada/fria, clareia perto da superfície, escurece com profundidade. Aplicada ao fundo, paredes E chão. A lanterna NÃO é afetada por ambLight.
2. **CHÃO via FLOOR CASTING** (técnica lodev): scanlines horizontais, vetores dir/plane que GIRAM com heading, ponto do mundo = pos + rowDist*rayDir, textura por `rockShade(wx,wy)` (ruído quebrado, sem listras) nas coords do mundo. Linhas de grid do mundo (GRID=16). SIGHT=13 (chão escurece perto). ROWH=3.
3. **PAREDES via raycaster** (FOV=78°, COLS=w/4, MAXD=520, STEP=5, WALLH=h*46): cada coluna lança raio, marcha até cruzar margem/pilar/parede-de-fundo/parede-de-escuridão. Distância perpendicular corrige fish-eye (cos). Textura de rocha, sombreamento direcional (margem esq mais escura), fog por distância (WALL_SIGHT=340).
4. **PAREDE DE ESCURIDÃO** (hitKind="dark"): superfície PRETA PURA (#000, imune à lanterna) na distância máxima de visão `VIS_WALL = 320 - depthN*120` (~320u superfície → ~200u fundo). Tratada pelo raycaster, com altura projetada de parede normal (y0d..y1d). Acompanha o sub, revela o canyon conforme avança. SUBSTITUIU tentativas de vinheta radial e de teto de caverna (ambos descartados).
5. **PARTÍCULAS suspensas** (`drawParticles`): reagem ao movimento REAL do sub. Profundidade muda → escoam VERTICAL (descer=sobem, subir=descem — sinal já corrigido). Giro/lateral → horizontal. Avanço → escoamento radial leve do centro. Não dominam a tela.
6. **PLÂNCTON iluminado**: ~260 partículas fixas no espaço 3D que só brilham sob o facho da lanterna (como sujeira na água). Cor acompanha o casco.
7. **NÉVOA** integrada à parede de escuridão.
8. **FACHO** da lanterna (gradiente), **partículas de movimento**, **HUD** (BRG bússola topo, DEPTH abaixo).

## Movimento (navLoop)
- WASD livre estilo Iron Lung. W frente na direção do heading, S ré, A/D giram. Colisão por eixo separado (desliza nas paredes, não trava). 
- Limite de subida = STATION_TOP (pode subir até ver a estação). Colisão com pilares e parede da estação.
- Três modos: "moonpool"/"diving"/"reeling". Reeling recolhe pela LINHA CENTRAL (caminho seguro garantido). 
- Transição moonpool (`animateDive`): ~7.5s, anima depth 100↔200, easing orgânico. Primeira carga do Firebase adota estado direto sem animar (`applyModeInstant`).
- Sincronizado via Firebase (throttle 100ms).

## HUD / controles
- BRG (bússola), DEPTH (fica vermelho além do coral). Luz OFF↔AIM (Ctrl liga, segue cursor no desktop / arrasta no mobile). Foco (Espaço). `lightOn` controla tudo (variável `lightMode` foi removida na limpeza por ser redundante).

## DESCARTADO (não retentar)
- **Teto de caverna**: várias tentativas (cortina, arco, faixa, espelhamento lodev, parede coluna-a-coluna). TODAS descartadas. Max decidiu jogar o teto fora por completo. Não tem teto.
- **Vinheta radial pra escuridão**: descartada em favor da parede preta sólida no raycaster.

## VIGAS (guardar pra usar no mapa) [IMPORTANTE]
O visual de "viga" (faixa horizontal listrada de rocha que apareceu nas tentativas de teto) deve ser reutilizado como MUITAS VIGAS estruturais nos primeiros 600m do canyon, junto com as grades — como estrutura da plataforma, NÃO como teto. Max gostou do visual nesse uso.

---

# PRÓXIMO PASSO: MIGRAR O MUNDO PRA GRID DOOM/WOLFENSTEIN (DDA) — EM ANDAMENTO

## Decisão (confirmada por Max)
Migrar o mundo de FÓRMULA (`corridorAt`) pra GRADE DE TILES 2D estilo Doom/Wolfenstein com algoritmo DDA. Isso destrava bifurcações de verdade, áreas abertas, zonas horizontais (sem descida), subidas leves antes de descer, e os mapas.

- **Tamanho do tile: 40u** (Wolfenstein clássico, grosso). Curvas ficam mais "quadradas" — Max aceitou isso ciente.
- **Conteúdo: converter o canyon procedural ATUAL pro grid** (mesmo visual de agora), e adicionar bifurcações editando o grid depois.

## Arquitetura planejada
- Mundo = array 2D `MAP[linha][coluna]`. 0 = água navegável, 1 = rocha (parede). Depois tipos especiais (2 = pilar da estação, etc.).
- Eixo vertical do grid = profundidade (descer = avançar nas linhas). Horizontal = posição lateral.
- **Dimensões validadas**: TILE=40, X_MIN=-200, X_MAX=200 → 10 colunas laterais × ~79 linhas de profundidade. Largura média do corredor convertido: ~3.4 tiles (encolhe de ~5 no topo a ~3 no fundo). Bom pra navegar e bifurcar.
- **Construção declarativa por cima do grid**: funções construtoras que "pintam" no grid em vez de editar célula a célula: `corredor(de, até, larguraX)`, `bifurcacao(profundidade, ramoEsq, ramoDir)`, `areaAberta(de, até, largura)`, `zonaHorizontal(profundidade, comprimento)`, `subidaLeve(...)`. Max edita em peças semânticas, o raycaster lê o grid simples.
- **Raycaster passa a usar DDA** no grid (em vez de marchar em `corridorAt`). Colisão também lê o grid. Reeling segue caminho marcado no grid.

## Algoritmo DDA (pesquisado no lodev — fórmulas confirmadas)
- `deltaDistX = abs(1/rayDirX)`, `deltaDistY = abs(1/rayDirY)` (só o ratio importa).
- `sideDistX/Y` = distância do raio à próxima borda de célula; `stepX/Y` = -1 ou +1 pela direção do raio.
- Loop: se `sideDistX < sideDistY` → `sideDistX += deltaDistX; mapX += stepX; side=0;` senão → `sideDistY += deltaDistY; mapY += stepY; side=1;`. Checa `MAP[mapY][mapX] > 0`.
- `perpWallDist` calculado pelo `side` (NÃO distância euclidiana — evita fish-eye).
- Câmera usa vetores `dir` + `plane` (matriz 2×2), não ângulo. Se rayDir = 0, usar 1e30 pra evitar divisão por zero.
- Fontes: lodev raycasting I/II/III/IV, hackmd cub3d, aaaa.sh (DDA interativo), andorsaga.

## Plano de migração por etapas (pra não quebrar tudo)
1. Sistema de grid + conversão do canyon atual (PROTOTIPADO E VALIDADO em Node — funciona).
2. Raycaster DDA renderizando o grid (mesmo visual do corredor atual) — validar.
3. Colisão lendo o grid.
4. Reeling seguindo caminho no grid.
5. Funções construtoras (bifurcação, área aberta, etc.).
- Trabalhar numa CÓPIA (`submarino_grid.html`) até estar provado, depois substituir.

## Depois da migração (sub-etapa 2 restante)
- Os DOIS MAPAS no painel GM: radar (visto de cima) + CORTE VERTICAL novo.
- Tabs no painel GM: Estação / Submarino+Monitor / DRE.
- **Sensor de movimento** no monitor (os jogadores se localizam SÓ por ele — o mapa deles NÃO mostra o coral/caverna).

## Vibe do mapa real (quando construir)
- A entrada da caverna (o hive-mind) vai pra ~2000m numa bifurcação difícil. No protótipo ficou no coral (~600m) só pra teste, mas o teto foi removido.
- O canyon fecha por cima passando ~1500m.
- O mapa dos jogadores NÃO mostra o coral/caverna — eles se localizam só pelo SENSOR DE MOVIMENTO do veículo.

---

# FERRAMENTAS DE PROPS (offline, GM-only — não acessadas pelos jogadores)

**DUAS ferramentas separadas** (v4, 2026-09-16 — Max corrigiu o escopo: "o editor de imagem... é pra ser uma ferramenta totalmente separada"):
- **`tools/props-generator.html`** — só documentos/props (jornal, relatório, bilhete, dossiê, etiqueta).
- **`tools/image-lab.html`** — ferramenta independente e genérica de efeitos: arrasta qualquer foto, aplica filtro/preset, exporta. Não sabe o que é um "documento" ou "template". Reaproveita o mesmo motor de filtro (`tools/filter-panel.js` + `tools/filters.js`) do props-generator, mas é 100% standalone — abre sozinha, não depende da outra ferramenta.

**O toca-fitas (`cassette-player.html`) foi deletado** — não retentar, Max achou ruim mesmo com fotos reais e pediu foco total no props.

## Histórico de versões (pra não repetir erro)
- v1/v2 (canvas puro, sem lib): o jornal com fotos reais e o motor de layout de colunas ficaram muito bons — Max elogiou explicitamente.
- v3 (primeira reescrita em Fabric.js): resolveu bugs reais (export quebrado, manchas com borda quadrada, letra capitular colidindo) mas **regrediu duro em qualidade visual** — trocou o motor de layout de 5 presets por Textbox soltos sem coluna, e comprimiu as texturas agressivamente (820px/q70) pra caber num limite de tamanho que só existia no MEU ambiente de teste (o preview `file://` da ferramenta de browser usada nas sessões tem um teto de arquivo de ~700KB-1MB pro documento navegado — não é uma restrição de navegador real). Max: "os visuais iniciais estavam MIL VEZES melhores antes... fico até ofendido". Lição: não sacrificar qualidade do ENTREGÁVEL por uma limitação do MEU ambiente de teste — testar de outro jeito (servidor local) em vez de comprimir o produto.
- v4 (atual): motor de layout de colunas restaurado (agora gerando objetos Fabric em vez de desenhar direto — `tools/layout.js`), 4 texturas novas em qualidade real já aplicadas + mais 8 candidatas aguardando aprovação (ver abaixo), carimbo editável, conteúdo padrão em inglês, editor de texto com cursor confiável, sistema de dobra/vinco novo, bug de sobreposição de layout do jornal corrigido, placeholder de foto sem texto cravado no pixel.

## Arquitetura (props-generator)
- `tools/props-generator.html` (shell) + `tools/vendor/fabric.min.js` (Fabric.js v6.4.3 UMD, vendorizado) + `tools/vendor/fonts.css` + `tools/vendor/fonts/*.woff2` (self-hosted) + `tools/vendor/texture-pack.js` (base64, gerado por script) + `tools/handwriting.js` + `tools/filters.js` + `tools/filter-panel.js` (painel de filtro compartilhado com image-lab) + `tools/layout.js` (motor de colunas do jornal) + `tools/editor.js` (lógica principal). Ordem de `<script>` importa: handwriting → filters → filter-panel → layout → editor.
- **Por que vendorizar tudo em vez de CDN**: a ferramenta é preparada antes de uma sessão e usada na mesa, possivelmente sem wifi.
- **Por que texturas em base64 em vez de arquivo solto**: evita fetch separado (nunca tainta o canvas, export sempre funciona) e falhas de carregar imagem relativa em contextos restritos. **Script de geração** (Python/PIL): lê `img/props/`, redimensiona, recomprime JPEG, grava em `tools/vendor/texture-pack.js` como `window.TEXTURE_PACK = {nome: dataURL}`. **v3 comprimia demais (820px/q70) — não repetir**; qualidade real (~1600px, q85-90) é o alvo, o teto de tamanho só importa pro MEU ambiente de teste, não pro navegador real do Max.
- **Nota sobre abrir via `file://` direto**: confirmado nesta sessão que scripts externos (`<script src="vendor/...">`) às vezes não executam no preview `file://` do MEU ambiente de teste especificamente (não confirmado se é assim no navegador real do Max — é bem provável que NÃO seja, já que `<script src>` local é comportamento padrão de navegador). Se abrir direto e a tela ficar em branco, servidor local resolve: `python -m http.server 8000` na raiz do repo, abrir via `http://localhost:8000/tools/props-generator.html`.

## O editor
- Canvas Fabric.js de 1240×1754. Cada elemento (texto, foto, carimbo, código de barras, mancha, papel de fundo) é um objeto Fabric de verdade: arrastável, redimensionável, rotacionável, com painel de camadas (`renderLayerList`) e inspetor contextual (`updateInspector`) na sidebar.
- **Modelos** (`loadTemplate(name)` em `editor.js`): Jornal, Relatório, Bilhete manuscrito, Dossiê redigido, Etiqueta, Em branco. **Conteúdo padrão em INGLÊS** em todos (v3 tinha em português por engano — contradizia a própria convenção do projeto: texto que o jogador acaba vendo, impresso ou "digitalizado", é inglês; só a UI da ferramenta em si é português).
- **Jornal com motor de layout de colunas de volta** (`tools/layout.js`, `buildNewspaperObjects`): 5 presets (`NEWS_PRESETS` — foto topo/lateral/duas fotos/denso/rodapé+caixa) geram um conjunto de objetos Fabric (masthead, kicker, headline, colunas de texto com distribuição proporcional de linha por altura disponível, pull-quote, caixa lateral, fotos) — clicar um preset REFAZ essa parte (remove objetos com `customType:'newspaperPart'`, gera de novo), sem mexer no papel de fundo nem em objetos que o Max adicionou à mão. `textAlign:'justify'` do Fabric.Textbox tem um bug visual real (engole espaço entre palavras em certas quebras de linha) — **não usar**, ficou com `left` mesmo (ragged-right), testado e limpo.
- **Tipos de objeto especiais** (`handwriting.js`): `HandwrittenText` (Textbox customizado, `_render` trocado pelo motor de jitter), `RedactedText` (Textbox com censura por palavra), `makeStampObjects()` (retorna `[rect, itext]` — carimbo agora é **editável de verdade**: `fabric.IText` de largura automática + `Rect` de borda que se recalcula sozinho a cada evento `changed`/`moving`/`rotating`/`scaling` do texto; IText não sobrescreve `_render`, então o cursor nativo do Fabric funciona certo sem precisar do modal), `makeBarcodeImage()`.
- **Editor de texto: cursor sempre confiável**. `HandwrittenText`/`RedactedText` sobrescrevem `_render()` com layout próprio — isso quebra o cursor nativo do Fabric no clique duplo (a posição do cursor depende do layout de linha INTERNO do Fabric, que nunca é populado corretamente por um `_render` customizado). Por isso esses dois tipos ganham `editable:false` e o `object:added`/`mouse:dblclick` do canvas força SEMPRE passar pelo modal (`openTextEditor` em `editor.js`) — nunca o editor nativo quebrado. Modal redesenhado: textarea grande com `caret-color` explícito + **prévia ao vivo** (`renderEditorPreview`, chama o `_render()` do próprio objeto numa mini-instância descartável) mostrando exatamente como vai ficar no prop enquanto digita. `fabric.IText` normal (usado só no carimbo) mantém edição nativa — não sobrescreve `_render`, cursor funciona sem ajuda.
- **Manchas com borda macia**: `makeFeatheredStainURL()` bate a foto real de mancha numa blob orgânica (16 pontos, raio ±20% de variação) com `destination-in` antes de virar objeto Fabric — sem isso o retângulo da foto de fundo aparecia fantasma no multiply (bug reportado, corrigido).
- **Idade do papel**: filtro (`AgeTintFilter`) ao vivo — não dá pra "rejuvenescer" uma foto real, só envelhecer mais em cima da base dela. Linhas pautadas de caderno sempre vêm da PRÓPRIA foto real agora (categoria `paper_notebook_ruled`), não desenhadas por cima — evita o desalinhamento que a v2 tinha.
- **Sistema de dobra/vinco** (novo, pedido explícito do Max — "reconhece os ângulos nas dobras... tem muitas maneiras no Google"): `computeFoldField()` em `editor.js` reduz a foto de papel carregada pra uma grade pequena (36×50 células — o próprio downscale já faz o trabalho de desfoque por média de área, não precisa de blur separado), calcula luminância e o GRADIENTE dela (mesmo princípio do Displacement Map do Photoshop: Filter > Distort > Displace — uma dobra real muda a incidência de luz, então aparece como variação grande de luminância). `sampleFoldSlope(px,py)` dá a inclinação local em qualquer ponto da página. `HandwrittenText._render()` usa `calcTransformMatrix()` + `fabric.util.transformPoint` pra achar a posição REAL de cada caractere na página (não a posição local dentro da caixa de texto) e soma uma rotação/deslocamento proporcional à inclinação da dobra ali — o texto passa a reagir ao relevo de verdade da foto. Só implementado pra `HandwrittenText` por ora (é onde faz mais sentido narrativamente); recalculado toda vez que `setBackgroundPaper` troca o papel.
- **Tinta absorvida**: `HandwrittenText` desenha cada caractere DUAS vezes — um traço quase invisível deslocado por baixo (opacidade ~35%, offset aleatório pequeno) + o traço normal em cima, simulando tinta se espalhando na fibra do papel em vez de um glifo chapado.
- **Letra capitular**: continua fora (v3 tinha um bug de colisão — a letra grande não reservava altura pras linhas seguintes). Sem solução de reflow multi-linha automática; se precisar, adicionar manual como texto separado.

## `image-lab.html`
Canvas único sem noção de documento — arrasta/escolhe uma foto, vira uma camada (`fabric.Image`) com filtros próprios; dá pra empilhar várias fotos (cada uma é uma camada independente, painel de camadas simples). Usa `renderFilterPanel()` de `filter-panel.js` — o MESMO código que o props-generator usa pro inspetor de imagem, extraído pra não duplicar a UI de sliders entre as duas ferramentas. `tools/image-lab.js` é o único arquivo de lógica específico dela.

## Motor de filtros (`filters.js`) — WebGL via `fabric.filters.BaseFilter`
Padrão confirmado ao vivo na fabric 6.4.3 (não documentado igual nas buscas — checar `fabric.filters.Brightness.prototype` se mexer nisso de novo): `static defaults`, `static uniformLocations` (array de nomes, `getUniformLocations` já vem pronto), `getFragmentSource()` retorna o shader, `sendUniformData(gl,loc)` faz os `gl.uniformXf`, `applyTo2d({imageData})` é o fallback sem WebGL.

10 filtros implementados e **testados visualmente um por um** (screenshot, não só "compilou"): `ChromaticAberration`, `Vignette`, `FilmGrain` (simplex noise de Ashima/webgl-noise, MIT), `Noise` (hash simples, "ruído de sensor" distinto do grão), `LensDistortion` (barril/almofada, fórmula polar de prideout.net), `Scanlines`, `VHS` (combo CA+scanlines+ruído+leve sangramento de cor num shader só), `ColorGrade` (lift/gamma/gain padrão ASC-CDL — mesma matemática de ferramentas tipo DaVinci Resolve), `Fringing` (CA localizada, ponderada por gradiente de luminância — só aparece em bordas de alto contraste), `Halftone` (meio-tom de jornal, raio do ponto cresce com o escuro), `AgeTint` (idade do papel).

**Bloom/glow e sujeira/grunge NÃO são shader** — são objetos Fabric compostos (`applyBloomToSelected`/`applyGrungeOverlay` em `editor.js`): clona a imagem, aplica blur+brightness ou usa uma foto real de metal arranhado/enferrujado, `globalCompositeOperation` screen/multiply por cima. Mais simples que sampler duplo em GLSL e o resultado fica editável (move/opacidade/apaga como qualquer objeto).

**Presets** (`PRESETS` em `editor.js`): combos de filtro aplicáveis num clique — Silent Hill (Relatório), Outlast (Visão noturna), RE2 (Scan de arquivo), VHS achado, Digitalizado DRE (reaproveita paleta do `dre.html`), Polaroid.

## Manuscrito — personas recuradas visualmente
`HANDWRITING_PERSONAS` em `handwriting.js`. Renderizei uma folha comparando 23 fontes handwriting do Google Fonts lado a lado e OLHEI o resultado antes de decidir — Patrick Hand, Permanent Marker, Gochi Hand e Nanum Pen Script (usadas numa versão anterior) saíram porque ficam "de fonte" mesmo com jitter (Max confirmou visualmente que não pareciam escrita à mão). Entraram: Cedarville Cursive, Covered By Your Grace, Neucha, Schoolbell, Waiting for the Sunrise, Just Another Hand, Delius, Crafty Girls, Caveat, Homemade Apple, Kalam, Architects Daughter, Shadows Into Light — 13 personas, cada uma com fonte(s), inclinação, "shakiness", amplitude/frequência de onda de baseline, variação de tamanho e tinta próprias.

Jitter em DOIS níveis (por palavra, amplitude maior — mantém letras cursivas "coladas" — e por caractere em cima, amplitude menor) em vez de jitter por caractere isolado: cortar uma fonte de traço conectado em glifos jitterados independentes com amplitude alta "estilhaça" a palavra, foi isso que fazia fontes decentes parecerem artificiais na versão anterior.

## Texturas — status (2026-09-17)
`img/props/` agora tem 22 arquivos: o set antigo (17 fotos que o Max colou no chat + `stain_mold.jpg`) MAIS as 4 aprovadas pelo Max na rodada anterior ("as que você marcou de verde pareciam boas"), já processadas em qualidade real (~1600px lado maior, JPEG q88) e embutidas em `tools/vendor/texture-pack.js` (regerado via script Python/PIL que lê `img/props/` inteiro e grava `window.TEXTURE_PACK`):
- `paper_aged_7.jpg` (era "paper_aged_1" no review, Vintage Paper Texture, CC-BY 2.0) — adicionada ao pool `paper_aged` (agora 7 arquivos).
- `paper_notebook_4.jpg` (era "notebook_ruled_1", Wrinkled Lined Notebook, CC-BY 2.0) — adicionada ao pool `paper_notebook_ruled` (agora 2 arquivos).
- `stain_coffee_1.jpg` e `stain_blood_1.jpg` (Coffee Stains / Blood Spatter, CC-BY-SA/CC-BY) — ganharam categorias PRÓPRIAS em `TEX_CATS` (`stain_coffee`, `stain_blood`) em vez de entrar no pool genérico `stain_shape`. `addStain(type)` agora sorteia 50/50 entre a foto dedicada (já na cor certa, sem tingir) e o pool genérico tingido por `STAIN_TINT` — mantém a variação de FORMATO sem perder a opção antiga.
- Testado visualmente: papel envelhecido novo, caderno pautado novo (dobras e linha de margem reais, muito mais convincente que o antigo), mancha de café (anéis reais) e mancha de sangue (respingos reais) — todos com foto real, sem gradiente procedural.

**Buscando mais diversidade (pedido explícito do Max: "as texturas procura mais para mais diversidade")** — 8 novas candidatas do Wikimedia Commons baixadas e mandadas pro Max em `_review_v3.png` (verde = eu aprovaria, amarelo = tem uso mas com ressalva), **aguardando resposta antes de aplicar** (regra permanente dele: sempre mostrar textura antes de embutir):
- Verde: mais uma variante de papel envelhecido ("Sandra", CC-BY 2.0), mancha de ÁGUA isolada de verdade em envelope (categoria nova `stain_water` — preenche o buraco que faltava desde a rodada anterior), caderno pautado limpo com vinco leve (CC-BY 2.0), pergaminho real (categoria nova `paper_parchment`, tom âmbar rico).
- Amarelo: papel envelhecido bem escuro/uniforme (parece mais efeito de vinheta que envelhecimento real, ressalva de qualidade), caderno danificado por água com ondulação muito extrema (bom pra um "documento arruinado" específico, não pra uso geral), duas fotos de papel amassado em tons de cinza/dessaturado (ótimas pra TESTAR o sistema de dobra/vinco com um vinco dramático de verdade — pendência antiga registrada abaixo — mas precisam do `AgeTintFilter` por cima pra não ficarem cinzas demais).
- Ainda não encontrado: substituto de qualidade pra `paper_aged_2` (a antiga rejeitada por tom azul-esverdeado) especificamente — as novas candidatas cobrem diversidade geral mas nenhuma foi buscada como substituição 1-para-1 dela.
- Script de busca: API do Wikimedia (`w/api.php?action=query&generator=search&gsrsearch=intitle:X&gsrnamespace=6&prop=imageinfo&iiprop=url|size|extmetadata`) com header `User-Agent` — funcionou sem rate-limit nesta sessão (o HTTP 429 do fim da sessão anterior não se repetiu).

## Pendências conhecidas (não bloqueiam uso, registrar pra próxima sessão)
- **Lote de texturas v3 aguardando aprovação do Max** (ver acima) — arquivos já baixados no scratchpad da sessão anterior (não commitados), não aplicar sem resposta dele.
- Ferramenta de expansão de ÁUDIO (efeitos de fita/rádio/interferência/reverb em cima de áudio importado) — pedida pelo Max, adiada explicitamente a pedido dele pra focar 100% no props primeiro. Não iniciada.
- Painel do inspetor de fundo (`renderBackgroundInspector`) duplica o controle de "Idade do papel" (aparece uma vez na lista genérica de filtros, outra vez no painel específico de papel) — cosmético, não funcional, mas vale limpar.
- Personas de manuscrito testadas em 3 de 13 (A, B, E) com captura de tela real; as outras 10 foram tunadas por raciocínio a partir do teste de fonte estática, não verificadas com o motor de jitter rodando — vale conferir visualmente antes de depender delas pra algo importante de mesa.
- Sistema de dobra/vinco (`computeFoldField`/`sampleFoldSlope`) só está ligado em `HandwrittenText`; funciona sem erro e testado uma vez visualmente, mas o efeito é sutil na textura de papel usada no teste (crease não muito dramático onde o texto ficou) — as 2 fotos de papel amassado do lote v3 (acima) são candidatas boas pra esse teste, ainda não usadas nele.
- `RedactedText`/`Textbox` normal ainda não reagem à dobra do papel — só o manuscrito, de propósito (é onde faz mais sentido narrativamente), mas dá pra estender se fizer sentido depois.

## Correções da rodada de feedback 2026-09-16/17 (pra não repetir)
- **Bug: trocar preset/colunas do jornal sobrepunha objetos em vez de substituir.** Causa: `buildNewspaperObjects()` só marcava `customType:'newspaperPart'` quando o objeto NÃO tinha `customType` próprio (`o.customType||'newspaperPart'`) — objetos como `photoPlaceholder` (que já tem seu próprio `customType`) nunca eram pegos pelo filtro de remoção em `rebuildNewspaperLayout()`, ficavam órfãos, e o próximo preset desenhava por cima. Corrigido com uma flag independente `__newsGenerated:true` em TODOS os objetos gerados pelo motor de layout (`layout.js`), e `rebuildNewspaperLayout()` (`editor.js`) agora filtra por essa flag em vez do `customType`. Testado programaticamente (contagem de objetos idêntica indo e voltando entre presets e entre números de coluna).
- **Placeholder de foto pouco realista**: `makePhotoPlaceholder()` cravava o texto literal `"clique e escolha uma foto"` direto no pixel da imagem — ia parar no PNG exportado se o Max esquecesse de trocar a foto, e a caixa cinza chapada virava um meio-tom sem graça nenhuma (meio-tom precisa de VARIAÇÃO de tom pra parecer foto de verdade, uma área plana vira só uma grade de pontos uniforme). Corrigido: fundo agora é um degradê radial com manchas suaves aleatórias (sem texto nenhum cravado), o filtro de meio-tom por cima produz um padrão de pontos com variação real, lendo como uma foto genérica desfocada em vez de uma caixa de instrução.

---

# WORKFLOW / FERRAMENTAS
- **Validação**: rodar simulações Node (`node << 'EOF'`) com ASCII art e contadores antes de entregar. Conferir sintaxe e chaves balanceadas do bloco `<script>`.
- **Worldcraft**: wiki que Max usa (links compartilhados podem dar 404 por login/JS — pedir texto colado ou export).
- **Claude Code no Windows**: o npm via PowerShell pode dar erro de execution policy (`npm.ps1 cannot be loaded`). Soluções: usar `cmd` em vez de PowerShell [mais simples], OU `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, OU WSL.
