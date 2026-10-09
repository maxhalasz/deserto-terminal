/* ===================== Registry dos modelos de documento =====================
   Cada modelo: {label, page:[px largura, px altura], phys:[pol, pol], paper:{type,level,fold,atmos},
   fonts:[specs de document.fonts.load], screen?:true (print de tela: sem bloco Papel), build(kit, ctx)}.
   O editor (editor.js: loadTemplateBody → buildDoc) cuida do tamanho, do papel e de carregar as
   fontes ANTES de chamar build — e `build` só usa o kit (doc-kit.js), então nada se sobrepõe.
   print-dpi.js lê `phys` daqui. Modelos que ainda não migraram seguem na cadeia antiga do editor. */
const DOC_TEMPLATES = {};
function registerDoc(id, def){ DOC_TEMPLATES[id] = Object.assign({id}, def); }

/* Ordem de exibição no <select> (ids que não existem no registry nem no HTML antigo são ignorados). */
const TEMPLATE_ORDER = ['newspaper','report','note','redacted','tag','letter','envelope','diary','terminal','badge','whatsapp','email_mobile','email_desktop','email_90s','menu_fine','menu_diner','menu_fastfood','blank','blank_ruled','blank_grid'];

const A4 = {page:[1240,1754], phys:[8.27,11.69]};

/* ---------- Em branco (3 folhas) ---------- */
registerDoc('blank', {
  label:'Em branco — lisa', page:A4.page, phys:A4.phys,
  paper:{type:'liso', level:0}, fonts:[],
  build: async ()=>{},
});
registerDoc('blank_ruled', {
  label:'Em branco — pautada', page:A4.page, phys:A4.phys,
  paper:{type:'sulfite', level:0.15}, fonts:[],
  build: async (kit)=>{ kit.ruled(); },
});
registerDoc('blank_grid', {
  label:'Em branco — quadriculada', page:A4.page, phys:A4.phys,
  paper:{type:'sulfite', level:0.15}, fonts:[],
  build: async (kit)=>{ kit.grid(); },
});
