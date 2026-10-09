# Fichas de pesquisa — documentos digitais do gerador de props

Pesquisa feita em 2026-10-08 (imagens reais de referência no navegador do app + leitura). Cada ficha diz como o objeto real é feito e o que entra no modelo. Cores são estimativas olhando as imagens; ajustar na prova.

## Atmosfera (âncoras da campanha)

**Twin Peaks** (o comum com um erro: lodge, diner, madeira, café, torta)
- Papel timbrado do Great Northern Hotel: creme (~#F0E6C8), logo pequeno vermelho (~#B5402C) com "THE GREAT NORTHERN HOTEL" empilhado e dois abetos nas pontas, rodapé miúdo com endereço. Bloco de notas com tira de cola no topo. Variante com abeto verde-escuro (~#2F4A35).
- Double R Diner: menu vermelho (~#B3262E) sobre creme (~#F3E9D2), logo "RR" desenhado em contorno; capa verde-floresta com montanha (cartão postal antigo recolorido); no quadro, letra branca em colunas sobre fundo escuro ("BREAKFAST · LUNCH · DINNER").
- Evidência da delegacia: saco pardo (~#B98E5E) com cabeçalho "EVIDENCE" e tabela de cadeia de custódia.
- Diário da Laura: livro pequeno de capa vermelha, páginas cremes com linhas finas azuis.
- Cores: vermelho cereja, verde-floresta, marrom madeira, creme, âmbar. Zigue-zague preto e branco (Red Room). Título em Avant Garde condensada.
- Fire Walk With Me: mais duro e sujo; a rosa azul aparece raro, como detalhe.

**Silent Hill 3** (sujo, enferrujado, comercial e hospitalar em decomposição)
- Fichas e memos do hospital: papel creme-amarelado (~#E4D6A8) com mancha de ferrugem (~#8A4B24) e vinco; formulário digitado com linhas finas; fundo escuro em volta.
- Happy Burger (shopping): letreiro amarelo-laranja (~#E8A32A) sobre fundo escuro e marrom (~#3A2418); lugar alegre e vazio. Praças de alimentação reais dos anos 90: piso xadrez, cadeiras de plástico em pastel, painéis iluminados vermelho/amarelo/azul com foto de combo e número.
- Cores: cinza-amarelado dessaturado, ferrugem, marrom de sangue seco (~#5B2A1E), verde-azulado sujo, laranja de lâmpada; grão de filme e vinheta forte.

**Detalhes (secundários):** RE7 (papel sujo, amontoado, luz fraca; jornal "Dulvey Daily" com título em letra gótica), SH2 remake (nota pequena amarelada com ferrugem), Gravity Falls (cifra simples miúda).

## Cardápios

**Fine dining.** Cartão de menu fixo de hotel. Modernos: eixo central, linhas finas, caixa alta espaçada, itálico nos pratos, sem cifrão, preço único. Variações escuras (preto e dourado) existem, mas a âncora é o Great Northern (creme + vermelho + abetos). Fontes: Cormorant Garamond (títulos, itálico), Jost (caixa alta espaçada).

**Diner (bar/lanchonete).** Página única, logo em script dentro de contorno, blocos por seção (Drinks, Sandwiches & Snacks, Breakfast, Desserts), moldura com dupla linha, pontilhado entre nome e preço, especial em estrela. Vermelho sobre creme, verde-floresta de apoio. Fontes: Yellowtail (script), Alfa Slab One, Oswald, Source Sans 3.

**Fast food.** Painel de combos numerados com foto e preço; no real, painel iluminado atrás do balcão. No SH3, amarelo-laranja sobre marrom escuro. Fontes: Anton (título), Fredoka (amigável), Source Sans 3 (letra miúda).

## Papéis

**Relatório (FD-302).** Texto datilografado em bloco corrido, quase sem formatação; cabeçalho com "FEDERAL BUREAU OF INVESTIGATION", número da ficha, "Date of transcription" no alto; rodapé com "Investigation on / at / File # / by / Date dictated". Margens largas (~1 polegada). Tarjas pretas de caneta no texto quando liberado. Layout: cabeçalho impresso + tabela de campos (rótulo miúdo sans, valor em Courier Prime) + parágrafos numerados.

**Dossiê redigido (FOIA/hospital).** Página de fotocópia cinza, tarjas pretas grossas e retangulares (como marcador) cobrindo linhas inteiras, carimbo "Approved for release" no topo, código de documento no cabeçalho, códigos de exceção (b)(1)(b)(6) no rodapé. No SH3: ficha de hospital, linhas finas, papel manchado.

**Etiqueta (evidência).** Saco pardo ou etiqueta adesiva 3,5×6,5 pol: cabeçalho "EVIDENCE", campos (caso, descrição, data e hora, local, coletor, assinatura) e tabela de cadeia de custódia (de / por / data / hora). Código de barras ou QR. Térmica: papel branco azulado, texto cinza-escuro.

**Carta.** Timbre pequeno no alto, endereço, data, corpo em serifa, fecho, rodapé miúdo. Dobra em três (marcas horizontais a 1/3 e 2/3). Papel verge/creme.

**Bilhete.** Bloco com tira de cola no topo (cinza), título impresso pequeno vermelho (Great Northern), linhas finas claras, margem esquerda.

**Diário / caderno de registro.** Livro aberto: linhas finas azuis ou cinza, margem vermelha opcional, cabeçalho de data, número de página no canto. Max escreve à mão por cima.

**Jornal semanal.** Nome com "orelhas" (tempo, preço, edição), linha de edição, manchete em serifada bold, colunas com linhas finas, foto com legenda e crédito, caixa de índice, classificados densos em letra mínima, anúncios em moldura. Papel-jornal: cinza-neutro (L* ~85), mais ganho de tinta, show-through do verso, erro de registro de cor. Masthead gótico (RE7 "Dulvey Daily") ou serifado de jornal local.

## Técnica do papel (resumo da pesquisa)

- Modelo de camadas de shaders de papel prontos (Paper Design): aspereza (grão fino), fibra (fios curvos), dobras (linhas retas com crista), rugas/amassados (facetas), pontinhos (impurezas); luz por ângulo. Parâmetros: semente, ângulo, escala, cor de fundo/papel/sombra.
- Clássico SVG: `feTurbulence` (fractalNoise, baseFrequency ~0,04, 5 oitavas) + `feDiffuseLighting` (surfaceScale ~2) = papel áspero.
- Fotocópia: camadas de ruído empilhadas (grão de toner + papel + irregularidades), blend multiply/screen.
- Tinta em papel não revestido: espalha (dot gain), mostra o verso (show-through), borda áspera. Simulação barata: tinta em multiply sobre o papel.

## Telas (Etapa 5, pesquisa de 2026-10-09)

Fidelidade de interface: cores e proporções das interfaces reais. Valores confirmados em fontes de paleta (WhatsApp brand colors, iOS system colors, Win98 gradient caption) e, onde a busca não confirmou, usados como aproximação declarada.
- **Terminal CRT.** Fósforo P1 verde (~#33FF00; usei #5DFF7A pra ler melhor), preto esverdeado, brilho (text-shadow) em volta do texto, linhas de varredura (~1 de cada 3 px, escuras), vinheta nos cantos e cantos arredondados do tubo em preto. Fonte VT323. Âmbar é preset alternativo (#FFB000), não usado.
- **WhatsApp (Android, tema claro clássico).** Barra de título #075E54 (barra de status #054D44), balão enviado #DCF8C6, recebido branco, papel de parede #E5DDD5 com rabiscos tom sobre tom, ticks azuis #34B7F1, botão verde #128C7E, chip de data #E1F2FB. Marca da paleta: #075E54, #128C7E, #25D366, #DCF8C6, #34B7F1, #ECE5DD. O mapeamento exato de cada cor na interface não foi confirmado por fonte; a conferência final é por olho contra um print real.
- **E-mail celular (iOS Mail).** Azul de sistema #007AFF, separador opaco #C6C6C8, cinza #8E8E93, texto 17 pt, barra de status 44–47 pt, barra de baixo com lixeira, pasta, responder e escrever, indicador da tela inicial. Fonte: Inter (substituto de SF Pro).
- **E-mail computador (Outlook, três painéis).** Barra de título e abas azuis #2B579A, faixa de ferramentas cinza #F3F3F3, painel de pastas à esquerda, lista no meio (selecionado #CDE6F7, não lido em negrito azul), painel de leitura à direita, barra de status azul. Cores exatas do Office não confirmadas por fonte (só o azul de seleção #C9E1F8 de outro app); aproximação visual. Fonte: Source Sans 3 (substituto de Segoe UI).
- **E-mail anos 90 (Outlook Express / Windows 98).** Cinza #C0C0C0, relevo branco/#DFDFDF (claro) e #808080/#404040 (escuro), título gradiente navy #000080 → #1084D0 (valor do Win98 confirmado), seleção navy com letra branca, janela principal = pastas à esquerda + lista (colunas !, anexo, From, Subject, Received) + painel de leitura com cabeçalho, barra de ferramentas com ícones coloridos. Fonte: Arimo (MS Sans Serif não existe).
- **Crachá.** Cartão CR80 3,375 × 2,125 pol. NeuroStat: faixa azul #173250 → #2F6DB0, filete vermelho, foto, nome, cargo, nível de acesso, ID/emitido/expira, Code 128. Ødemark A.: navy #141B30, laranja #E5601D, creme #EFE6CB, amarelo #F1C232 (cores do patch), emblema, zona e muster.
- **Datas:** 03/14 é QUINTA-FEIRA (bate com o jornal "Thursday, March 14"); ano 2013 nos prints que mostram ano (quinta-feira, NeuroStat existe desde 2011).
