/* ===================== Tamanho físico real / DPI dos PNGs exportados =====================
   Bug real reportado pelo Max ("checa se o tamanho deles está certo"): as proporções em
   pixel já batiam com A4 (1240×1754 = A4 a 150dpi, ×2 = 2480×3508 = A4 a 300dpi — o padrão
   de mercado), mas o PNG exportado não carregava NENHUM metadado de DPI. Sem isso, qualquer
   visualizador/impressora assume 96dpi por padrão — um "A4" de 2480×3508px sai como
   25.8"×36.5" na tela/impressora, do tamanho certo só na proporção, não no tamanho físico.
   Corrigido gravando o chunk `pHYs` do PNG (pixels por metro) com o DPI derivado do tamanho
   físico real de cada tipo de documento — crachá e etiqueta usam o tamanho de cartão/tag
   real, os formulários usam A4 real. */
const PAGE_PHYS_IN = { // polegadas [largura, altura] de cada template antigo (loadTemplate)
  newspaper:[8.27,11.69], report:[8.27,11.69], note:[8.27,11.69], redacted:[8.27,11.69],
  tag:[8.27,11.69], letter:[8.27,11.69], blank:[8.27,11.69],
  diary:[16.54,11.69],  // duas páginas A4 lado a lado (livro aberto)
  terminal:[11,8.5],    // impressão de terminal em papel contínuo — aproxima papel ofício
  badge:[3.375,2.125],  // crachá NeuroStat do template antigo — tamanho real de cartão CR80
};
const BRAND_PHYS_IN = { // por doc id dos documentos de marca — default A4 se não listado
  od_badge:[3.375,2.125], // cartão CR80 real
  dre_tag:[2.75,4.75],    // etiqueta de embarque/evidência tamanho "3" real
};
function docPhysicalSize(templateName){
  if (PAGE_PHYS_IN[templateName]) return PAGE_PHYS_IN[templateName];
  if (templateName && templateName.indexOf('brand:')===0){
    return BRAND_PHYS_IN[templateName.slice(6)] || [8.27,11.69];
  }
  return [8.27,11.69];
}
function getExportDpi(pxWidth, templateName){
  const [wIn] = docPhysicalSize(templateName || (typeof currentTemplate!=='undefined' ? currentTemplate : null));
  return Math.max(1, Math.round(pxWidth/wIn));
}

/* ---- gravação do chunk pHYs num PNG (data URL) já pronto ---- */
let _crc32Table = null;
function crc32(bytes){
  if (!_crc32Table){
    _crc32Table = new Uint32Array(256);
    for (let n=0;n<256;n++){
      let c=n;
      for (let k=0;k<8;k++) c = (c&1) ? (0xEDB88320 ^ (c>>>1)) : (c>>>1);
      _crc32Table[n]=c>>>0;
    }
  }
  let crc = 0xFFFFFFFF;
  for (let i=0;i<bytes.length;i++) crc = _crc32Table[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function dataUrlToBytes(dataUrl){
  const bin = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  return bytes;
}
function bytesToBase64(bytes){
  let bin=''; const CH=0x8000;
  for (let i=0;i<bytes.length;i+=CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i+CH));
  return btoa(bin);
}
function pngWithDpi(dataUrl, dpi){
  try {
    const bytes = dataUrlToBytes(dataUrl);
    if (bytes[0]!==0x89 || bytes[1]!==0x50) return dataUrl; // não é PNG (ex: preview inline) — não mexe
    const ppu = Math.round(dpi/0.0254); // pixels por metro
    const type = [0x70,0x48,0x59,0x73]; // "pHYs"
    const body = new Uint8Array(13); // type(4) + data(9)
    body.set(type, 0);
    const bdv = new DataView(body.buffer);
    bdv.setUint32(4, ppu); bdv.setUint32(8, ppu); body[12]=1; // unidade = metro
    const crc = crc32(body);
    const chunk = new Uint8Array(4+13+4); // length(4) + type+data(13) + crc(4)
    const cdv = new DataView(chunk.buffer);
    cdv.setUint32(0, 9); // length do DADO (sem contar type)
    chunk.set(body, 4);
    cdv.setUint32(17, crc);
    const insertAt = 33; // assinatura(8) + chunk IHDR completo (4+4+13+4=25) — IHDR tem tamanho fixo
    const out = new Uint8Array(bytes.length + chunk.length);
    out.set(bytes.subarray(0, insertAt), 0);
    out.set(chunk, insertAt);
    out.set(bytes.subarray(insertAt), insertAt + chunk.length);
    return 'data:image/png;base64,' + bytesToBase64(out);
  } catch(e){ console.warn('pngWithDpi falhou, exportando sem metadado de DPI', e); return dataUrl; }
}
