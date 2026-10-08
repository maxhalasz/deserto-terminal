/* ===================== Globais de página =====================
   O motor do jornal que vivia aqui foi substituído por news-text.js + news-engine.js (Fase 1).
   Ficam só os globais que o resto do código lê: PAGE_W/PAGE_H (cada modelo define o tamanho de página via
   applyPageSize em editor.js; ninguém guarda cópia, todo mundo lê no momento do uso) e o contexto 2D de
   medida (_mctx), usado pelas bolhas do print de WhatsApp (editor.js). */
let PAGE_W = 1240, PAGE_H = 1754;
const _measureCanvas = document.createElement('canvas');
const _mctx = _measureCanvas.getContext('2d');
