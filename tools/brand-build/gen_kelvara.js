const fs = require('fs');
const path = require('path');
const L = require('./gen_lib');
const { B, img, docFile, barcode, register, E, O } = L;
const OUT = path.join(__dirname, 'out');
require('fs').mkdirSync(OUT, { recursive: true });

const FONTS = 'family=Arimo:wght@400;700&family=Michroma&family=Courier+Prime:wght@400;700&family=Caveat:wght@500;600';
const INK = '#161616';
const GRAY = '#6a6a64';
const ORANGE = '#d9531e';
const BLUE = '#1f3f9c';
const MONO = "'Courier Prime',monospace";
const MICRO = "'Michroma',sans-serif";

// Régua de profundidade no topo (assinatura da Kelvara — ecoa a logo-termômetro)
function ruler() {
  const nums = [];
  for (let i = 0; i <= 8; i++) nums.push(`<span style="position:absolute;left:${i * 50 + 3}px;top:3px;">${i * 50}</span>`);
  return `<div style="position:relative;height:20px;background:${INK};color:#cfcbc0;font-family:${MONO};font-size:5px;">
    <div style="position:absolute;left:0;right:0;bottom:0;height:4px;background:repeating-linear-gradient(90deg,#cfcbc0 0 1px,transparent 1px 5px);"></div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:8px;background:repeating-linear-gradient(90deg,#cfcbc0 0 1px,transparent 1px 25px);"></div>
    ${nums.join('')}
    <div style="position:absolute;left:224px;bottom:0;width:3px;height:15px;background:${ORANGE};"></div>
  </div>`;
}

const rowsHtml = (rows) => rows.map(([l, v]) => `<div style="display:flex;justify-content:space-between;gap:6px;padding:2.4px 6px;border-top:1px solid #c9c7bf;font-size:5.8px;"><span style="color:${GRAY};letter-spacing:.05em;">${l}</span><span${E} style="flex:1;text-align:right;font-family:${MONO};font-weight:700;color:${INK};">${v}</span></div>`).join('');

function block({ title, sub, rows, sentFrom }) {
  return `<div style="margin:13px 22px 0;display:grid;grid-template-columns:100px 1fr 134px;border:1px solid ${INK};background:#fff;">
    <div style="padding:8px;display:flex;align-items:center;justify-content:center;border-right:1px solid ${INK};"><img src="${img(B.kelvara)}" alt="Kelvara Petrochemicals AS" style="width:84px;height:auto;"></div>
    <div style="padding:8px 10px;border-right:1px solid ${INK};display:flex;flex-direction:column;justify-content:center;">
      <div style="font-size:5.4px;letter-spacing:.1em;color:${GRAY};">DOCUMENT TYPE</div>
      <div style="font-family:${MICRO};font-size:8px;line-height:1.45;margin-top:3px;color:${INK};">${title}</div>
      <div style="font-size:5.6px;letter-spacing:.06em;color:${GRAY};margin-top:4px;">${sub}</div>
    </div>
    <div>
      <div${E} style="background:${INK};color:#f2a577;padding:3.5px 6px;font-size:5.8px;letter-spacing:.07em;font-weight:700;">SENT FROM: ${sentFrom}</div>
      ${rowsHtml(rows)}
    </div>
  </div>`;
}

// cabeçalho compacto (versos / continuação)
function compactHeader({ title, sub, rows, sentFrom }) {
  return `<div style="margin:11px 22px 0;display:grid;grid-template-columns:88px 1fr 134px;border:1px solid ${INK};background:#fff;">
    <div style="padding:7px;display:flex;align-items:center;justify-content:center;border-right:1px solid ${INK};"><img src="${img(B.kelvara)}" alt="Kelvara Petrochemicals AS" style="width:72px;height:auto;"></div>
    <div style="padding:6px 9px;border-right:1px solid ${INK};display:flex;flex-direction:column;justify-content:center;">
      <div style="font-family:${MICRO};font-size:7px;line-height:1.45;color:${INK};">${title}</div>
      <div style="font-size:5.4px;letter-spacing:.06em;color:${GRAY};margin-top:3px;">${sub}</div>
    </div>
    <div>
      <div${E} style="background:${INK};color:#f2a577;padding:3.5px 6px;font-size:5.8px;letter-spacing:.07em;font-weight:700;">SENT FROM: ${sentFrom}</div>
      ${rowsHtml(rows)}
    </div>
  </div>`;
}

function foldTicks() {
  return `<div style="position:absolute;left:0;top:216px;width:9px;height:1px;background:#8a8a84;"></div>
  <div style="position:absolute;left:0;top:325px;width:5px;height:1px;background:#8a8a84;"></div>
  <div style="position:absolute;left:0;top:433px;width:9px;height:1px;background:#8a8a84;"></div>`;
}

function footer(docNo, seed) {
  return `<div style="position:absolute;left:22px;right:22px;bottom:14px;border-top:1.5px solid ${INK};padding-top:6px;display:flex;justify-content:space-between;align-items:flex-end;gap:10px;">
    <div style="font-size:5.2px;line-height:1.6;color:#4a4a45;">
      <b style="color:${INK};">Kelvara Petrochemicals AS</b> · Org.nr. 921 447 306 MVA · Postboks 2217 Sentrum, N-4001 Stavanger, Norway<br>
      UNCONTROLLED WHEN PRINTED — verify current revision on Kelvara Intranet before use · ISO 9001 · ISO 14001 · ISO 45001
    </div>
    <div style="text-align:center;flex-shrink:0;">${barcode(seed, 70, 16)}<div style="font-family:${MONO};font-size:5px;color:#4a4a45;margin-top:2px;">${docNo}</div></div>
  </div>`;
}

const ROOT = `width:460px;height:650px;box-sizing:border-box;position:relative;overflow:hidden;background:#fbfaf6;font-family:'Arimo',Arial,sans-serif;color:${INK};`;

const meta = (rows) => `<div style="margin:9px 22px 0;display:grid;grid-template-columns:52px 1fr 52px 1fr;border-left:1px solid ${INK};border-bottom:1px solid ${INK};font-size:7px;">${rows}</div>`;
const L_ = (t) => `<div style="background:#ecebe5;padding:3.5px 6px;font-weight:700;letter-spacing:.05em;font-size:5.8px;border-top:1px solid ${INK};display:flex;align-items:center;">${t}</div>`;
const V_ = (t, span = 1, extra = '') => `<div style="grid-column:span ${span};padding:3.5px 7px;border-top:1px solid ${INK};border-right:1px solid ${INK};"><div${E} style="${extra}">${t}</div></div>`;
const hand = (t, x, y, o = {}) => `<div${E} data-hand style="position:absolute;left:${x}px;top:${y}px;font-family:'Caveat',cursive;font-weight:600;font-size:${o.size || 13}px;line-height:1.05;color:${o.color || BLUE};transform:rotate(${o.rot ?? -3}deg);${o.nowrap ? 'white-space:nowrap;' : ''}${o.width ? 'width:' + o.width + 'px;' : ''}">${t}</div>`;
const secTitle = (n, t) => `<div style="font-weight:700;font-size:7px;letter-spacing:.09em;border-bottom:1px solid ${INK};padding-bottom:2px;margin-bottom:5px;">${n}&nbsp; ${t}</div>`;

// ================= MEMO — frente =================
const memoFront = `<div style="${ROOT}">
  ${ruler()}
  ${block({ title: 'INTERNAL<br>MEMORANDUM', sub: 'LOGISTICS DIVISION — SUPPLY &amp; MARINE', sentFrom: 'STAVANGER HQ', rows: [['DOC NO.', 'KP-LOG-0091'], ['REV.', '02'], ['DATE', '18.03'], ['PAGE', '1 OF 2'], ['CLASS.', 'INTERNAL']] })}
  ${meta(
  L_('TO') + V_('Ødemark A. — Topside Supervision', 3) +
  L_('CC') + V_('HSE Coordinator · Shift Leads · Crew Planning', 3) +
  L_('FROM') + V_('C. Vance, Logistics Coordinator', 3) +
  L_('RE') + V_('<b>Supply run — week 11 schedule change</b>', 3) +
  L_('ACTION') + V_('Confirm receipt to shift supervisor by 19.03, 17:00', 3))}

  <div style="margin:14px 22px 0;font-size:7.9px;line-height:1.56;color:#1c1c1a;">
    <p${E} style="margin:0 0 7px;">1. The Thursday supply run (MS Nordvakt, voyage 11) is moved to <b>Saturday 22.03 at 06:00</b> due to weather clearance on the mainland side. Topside crew should have the outbound manifest and personal parcels ready by end of shift Friday.</p>
    <p${E} style="margin:0 0 7px;">2. Logistics note: the weekly satellite check has failed to connect <span${O('ring')} data-notext style="display:inline-block;border:1.2px solid ${BLUE};border-radius:50%;padding:0 5px;margin:-1.2px -6.2px;transform:rotate(-2deg);">three times</span> this month (04.03, 11.03, 14.03). Maintenance has been notified and a service ticket raised (KP-IT-88214). Until resolved, routine reporting continues via the backup line at the scheduled times. Do not extend backup-line use beyond routine reporting. See attachment 1 (overleaf).</p>
    <p${E} style="margin:0 0 7px;">3. Crew rotation is unaffected. Personnel scheduled for the Thursday helicopter transfer will be moved to the Saturday sailing. Individual notices follow from Crew Planning.</p>
    <p${E} style="margin:0 0 7px;">4. Questions regarding cargo priority should be addressed to Logistics on ext. 4102. Please do not contact the vessel directly.</p>
  </div>

  <div style="margin:4px 22px 0;border:1px solid ${INK};font-size:6.6px;">
    <div style="background:#ecebe5;padding:3px 6px;font-weight:700;letter-spacing:.07em;font-size:5.8px;border-bottom:1px solid ${INK};">TABLE 1 — REVISED SAILING SCHEDULE (VOYAGE 11)</div>
    <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;">
      <div style="padding:3px 6px;font-weight:700;font-size:5.8px;color:${GRAY};border-bottom:1px solid #c9c7bf;">SAILING</div><div style="padding:3px 6px;font-weight:700;font-size:5.8px;color:${GRAY};border-bottom:1px solid #c9c7bf;">DEPARTS STAVANGER</div><div style="padding:3px 6px;font-weight:700;font-size:5.8px;color:${GRAY};border-bottom:1px solid #c9c7bf;">ARRIVES ØDEMARK A.</div><div style="padding:3px 6px;font-weight:700;font-size:5.8px;color:${GRAY};border-bottom:1px solid #c9c7bf;">STATUS</div>
      <div style="padding:3px 6px;border-bottom:1px solid #dcdad2;"><div${E}>Planned (Thursday)</div></div><div style="padding:3px 6px;border-bottom:1px solid #dcdad2;"><div${E} style="font-family:${MONO};">20.03 22:00</div></div><div style="padding:3px 6px;border-bottom:1px solid #dcdad2;"><div${E} style="font-family:${MONO};">21.03 06:00</div></div><div style="padding:3px 6px;border-bottom:1px solid #dcdad2;"><div${E} style="font-weight:700;">CANCELLED</div></div>
      <div style="padding:3px 6px;border-bottom:1px solid #dcdad2;"><div${E}>Revised (Saturday)</div></div><div style="padding:3px 6px;border-bottom:1px solid #dcdad2;"><div${E} style="font-family:${MONO};">21.03 22:00</div></div><div style="padding:3px 6px;border-bottom:1px solid #dcdad2;"><div${E} style="font-family:${MONO};">22.03 06:00</div></div><div style="padding:3px 6px;border-bottom:1px solid #dcdad2;"><div${E} style="font-weight:700;color:${ORANGE};">CONFIRMED</div></div>
      <div style="padding:3px 6px;"><div${E}>Crew transfer</div></div><div style="padding:3px 6px;"><div${E} style="font-family:${MONO};">Thu 20.03</div></div><div style="padding:3px 6px;"><div${E} style="font-family:${MONO};">—</div></div><div style="padding:3px 6px;"><div${E} style="font-weight:700;">MOVED TO SAILING</div></div>
    </div>
  </div>

  ${hand('3x already.<br>ask Vance re: backup line?', 236, 456, { size: 13, rot: -4 })}

  <div style="margin:14px 22px 0;font-size:7.6px;">
    <div${E} style="font-weight:700;">C. Vance</div>
    <div${E} style="color:${GRAY};">Logistics Coordinator — Kelvara Petrochemicals AS</div>
  </div>
  <div${E} style="margin:10px 22px 0;font-size:6.2px;color:#4a4a45;line-height:1.5;"><b>DISTRIBUTION:</b> Topside Supervision · HSE Coordinator · Shift Leads (A/B) · Crew Planning · File<br><b>REFERENCES:</b> KP-LOG-0084 (supply run 10) · KP-IT-88214 (satellite terminal service ticket)</div>

  ${foldTicks()}
  ${footer('KP-LOG-0091 · REV 02', 11)}
</div>`;

// ================= MEMO — verso (anexo: e-mails encaminhados) =================
const mail = (from, to, cc, sent, subj, body) => `<div style="border:1px solid ${INK};margin-top:7px;background:#fff;">
  <div style="display:grid;grid-template-columns:34px 1fr;font-size:6.4px;background:#f4f3ee;border-bottom:1px solid ${INK};padding:4px 7px;row-gap:1.5px;">
    <span style="color:${GRAY};">From:</span><span${E}><b>${from}</b></span>
    <span style="color:${GRAY};">To:</span><span${E}>${to}</span>
    ${cc ? `<span style="color:${GRAY};">Cc:</span><span${E}>${cc}</span>` : ''}
    <span style="color:${GRAY};">Sent:</span><span${E}>${sent}</span>
    <span style="color:${GRAY};">Subject:</span><span${E}><b>${subj}</b></span>
  </div>
  <div${E} style="padding:7px 9px;font-size:7.4px;line-height:1.55;">${body}</div>
</div>`;
const memoBack = `<div style="${ROOT}">
  ${ruler()}
  ${compactHeader({ title: 'INTERNAL MEMORANDUM<br>ATTACHMENT 1', sub: 'FORWARDED CORRESPONDENCE', sentFrom: 'STAVANGER HQ', rows: [['DOC NO.', 'KP-LOG-0091'], ['REV.', '02'], ['PAGE', '2 OF 2'], ['CLASS.', 'INTERNAL']] })}
  <div style="margin:11px 22px 0;">
    <div style="font-weight:700;font-size:7px;letter-spacing:.09em;">ATTACHMENT 1 — E-MAIL THREAD, TICKET KP-IT-88214</div>
    <div style="font-size:5.8px;color:${GRAY};margin-top:2px;">Printed from Kelvara Mail by C. VANCE, 18.03 09:15 · 3 messages · newest first</div>
    ${mail('C. Vance', 'KP IT Service Desk', 'HSE Coordinator', 'Tuesday 18.03 09:12', 'FW: RE: KP-IT-88214 — Satellite terminal, Ødemark A. — link check failure',
  'Forwarding for your awareness. This is the third occurrence this month and the pattern is now weekly (04.03, 11.03, 14.03). Topside reports the backup line "sounds wrong". Please advise whether the physical inspection can be brought forward from the next crew change.<br><br>Regards,<br>C. Vance, Logistics')}
    ${mail('KP IT Service Desk', 'C. Vance', '', 'Friday 14.03 09:40', 'RE: KP-IT-88214 — Satellite terminal, Ødemark A. — link check failure',
    'Remote diagnostics were run at 06:00 and 09:00. Antenna alignment is nominal. The modem shows carrier present on both attempts, payload absent. No fault found at our end. We recommend a physical inspection at the next crew change. Ticket remains open.<br><br>KP IT Service Desk · ext. 4200')}
    ${mail('Ødemark A. — Topside Supervision', 'KP IT Service Desk', '', 'Friday 14.03 06:22', 'Weekly satellite check failed (3rd this month)',
      'Weekly check failed again at 06:00. The line is not noisy. It is empty. The operator on watch says he can hear the carrier but there is nothing in it, no hiss, no clicks. Third time this month. Please treat as priority.')}
  </div>
  ${hand('"carrier but nothing in it"<br>— what does that mean??', 236, 500, { size: 13, rot: -3 })}
  <div style="position:absolute;left:22px;right:22px;top:566px;font-size:5.6px;color:${GRAY};display:flex;justify-content:space-between;"><span>Kelvara Mail — printed 18.03 09:15 — user CVANCE</span><span>Page 1/1 (attachment)</span></div>
  ${foldTicks()}
  ${footer('KP-LOG-0091 · REV 02 · ATT 1', 12)}
</div>`;

// ================= MANIFESTO — frente =================
const rowsM = [
  ['1', 'Diesel filter cartridges', 'CTN', '12', '96', 'ENGINE RM', ''],
  ['2', 'Dry stores (rationed)', 'CRT', '40', '620', 'GALLEY', ''],
  ['3', 'Medical resupply kit', 'BOX', '1', '18', 'INFIRMARY', ''],
  ['4', 'Drilling mud additive', 'DRM', '6', '690', 'RIG FLOOR', 'DG'],
  ['5', 'Crew mail / personal parcels', 'BAG', '1', '14', 'TOPSIDE ADM', ''],
];
const gridCols = '16px 1fr 28px 26px 34px 62px';
const cellE = (t, extra = '') => `<div${E} style="${extra}">${t}</div>`;
const manifestRows = rowsM.map((r, i) => `<div style="display:grid;grid-template-columns:${gridCols};font-size:7px;border-top:1px solid #cfcdc4;${i % 2 ? 'background:#f3f1ea;' : ''}">
    <div style="padding:5px 5px;font-family:${MONO};color:${GRAY};">${r[0]}</div>
    <div style="padding:5px 5px;line-height:1.35;">${cellE(r[1])}${r[6] ? `<div style="font-size:6px;color:#a13a12;font-weight:700;margin-top:1px;">UN 3082 · CLASS 9 · ENV. HAZARDOUS SUBST., LIQUID, N.O.S.</div>` : ''}</div>
    <div style="padding:5px 4px;font-family:${MONO};">${cellE(r[2], 'text-align:center;')}</div>
    <div style="padding:5px 4px;font-family:${MONO};">${cellE(r[3], 'text-align:right;')}</div>
    <div style="padding:5px 4px;font-family:${MONO};">${cellE(r[4], 'text-align:right;')}</div>
    <div style="padding:5px 5px;font-size:6.2px;">${cellE(r[5])}${r[6] ? '<b style="display:inline-block;background:' + ORANGE + ';color:#fff;padding:0 3px;margin-top:1px;">DG</b>' : ''}</div>
  </div>`).join('');

const manifestFront = `<div style="${ROOT}">
  ${ruler()}
  ${block({ title: 'CARGO MANIFEST<br>SUPPLY RUN 11', sub: 'MARINE OPERATIONS — OFFSHORE LOGISTICS', sentFrom: 'ØDEMARK A. TOPSIDE', rows: [['DOC NO.', 'KP-LOG-0102'], ['REV.', '01'], ['DATE', '22.03'], ['PAGE', '1 OF 2'], ['CLASS.', 'INTERNAL']] })}
  <div style="margin:9px 22px 0;display:grid;grid-template-columns:52px 1fr 52px 1fr;border-left:1px solid ${INK};border-bottom:1px solid ${INK};font-size:7px;">
    ${L_('VESSEL') + V_('MS NORDVAKT (LAK7)') + L_('VOYAGE') + V_('11 / NV')}
    ${L_('FROM') + V_('Stavanger, Ryfast Quay 4') + L_('TO') + V_('Ødemark A. — moonpool crane')}
    ${L_('ETA') + V_('22.03 06:00') + L_('MASTER') + V_('Capt. H. Sæther')}
  </div>

  <div style="margin:12px 22px 0;border:1px solid ${INK};position:relative;">
    <div style="display:grid;grid-template-columns:${gridCols};background:${INK};color:#f4f2ea;font-size:5.6px;font-weight:700;letter-spacing:.06em;">
      <div style="padding:4px 5px;">LN</div><div style="padding:4px 5px;">DESCRIPTION OF GOODS</div><div style="padding:4px 4px;text-align:center;">PKG</div><div style="padding:4px 4px;text-align:right;">QTY</div><div style="padding:4px 4px;text-align:right;">KG</div><div style="padding:4px 5px;">DELIVER TO</div>
    </div>
    ${manifestRows}
    <div style="display:grid;grid-template-columns:${gridCols};font-size:7px;border-top:1.5px solid ${INK};background:#ecebe5;font-weight:700;">
      <div style="padding:5px;"></div><div style="padding:5px 5px;">TOTAL — 5 LINES</div><div></div><div style="padding:5px 4px;font-family:${MONO};">${cellE('60', 'text-align:right;')}</div><div style="padding:5px 4px;font-family:${MONO};">${cellE('1,438', 'text-align:right;')}</div><div></div>
    </div>
    ${hand('✓', 418, 24, { size: 14, rot: 0 })}${hand('✓', 418, 41, { size: 14, rot: 0 })}${hand('✓', 418, 58, { size: 14, rot: 0 })}${hand('✓', 418, 80, { size: 14, rot: 0 })}${hand('?', 416, 104, { size: 14, rot: 0 })}
  </div>
  ${hand('bag sealed — no addressee tag. nobody claimed it', 22, 337, { size: 12.5, rot: -2, nowrap: true })}

  <div style="margin:30px 22px 0;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:5.8px;color:${GRAY};">
    <div style="border-top:1px solid ${INK};padding-top:3px;">MASTER — SIGNATURE / DATE</div>
    <div style="border-top:1px solid ${INK};padding-top:3px;">RECEIVED BY (TOPSIDE ADMIN)</div>
    <div style="border-top:1px solid ${INK};padding-top:3px;">HSE DG CHECK (LN 4)</div>
  </div>
  <div${O('stamp')} style="position:absolute;left:336px;top:342px;border:1.6px solid ${INK};color:${INK};font-weight:700;font-size:8px;letter-spacing:.1em;padding:2px 8px;transform:rotate(-5deg);opacity:.85;">CHECKED</div>

  <div style="margin:16px 22px 0;border:1px solid ${INK};font-size:6.4px;">
    <div style="background:#ecebe5;padding:3px 6px;font-weight:700;letter-spacing:.07em;font-size:5.8px;border-bottom:1px solid ${INK};">DANGEROUS GOODS DECLARATION — LINE 4</div>
    <div style="display:grid;grid-template-columns:.7fr 1.7fr .6fr .6fr 1fr 1fr;">
      <div style="padding:3px 6px;font-size:5.4px;color:${GRAY};border-bottom:1px solid #dcdad2;">UN NO.</div><div style="padding:3px 6px;font-size:5.4px;color:${GRAY};border-bottom:1px solid #dcdad2;">PROPER SHIPPING NAME</div><div style="padding:3px 6px;font-size:5.4px;color:${GRAY};border-bottom:1px solid #dcdad2;">CLASS</div><div style="padding:3px 6px;font-size:5.4px;color:${GRAY};border-bottom:1px solid #dcdad2;">PG</div><div style="padding:3px 6px;font-size:5.4px;color:${GRAY};border-bottom:1px solid #dcdad2;">PACKAGING</div><div style="padding:3px 6px;font-size:5.4px;color:${GRAY};border-bottom:1px solid #dcdad2;">STOWAGE</div>
      <div style="padding:3px 6px;font-family:${MONO};font-weight:700;">${cellE('3082')}</div><div style="padding:3px 6px;line-height:1.35;">${cellE('Environmentally hazardous substance, liquid, n.o.s. (drilling mud additive)')}</div><div style="padding:3px 6px;font-family:${MONO};">${cellE('9')}</div><div style="padding:3px 6px;font-family:${MONO};">${cellE('III')}</div><div style="padding:3px 6px;">${cellE('6 × steel drum 115 kg')}</div><div style="padding:3px 6px;">${cellE('Deck, cat. A')}</div>
    </div>
  </div>

  <div style="margin:12px 22px 0;border:1px solid ${INK};">
    <div style="background:#ecebe5;padding:3px 6px;font-weight:700;letter-spacing:.07em;font-size:5.8px;border-bottom:1px solid ${INK};">REMARKS / DISCREPANCIES (COMPLETE ON RECEIPT)</div>
    <div style="height:14px;border-bottom:1px solid #cfcdc4;position:relative;">${hand('recount ok 07:10 — LN 5 bag not on original packing list', 8, -1, { size: 12, rot: 0, nowrap: true })}</div>
    <div style="height:14px;border-bottom:1px solid #cfcdc4;"></div>
    <div style="height:14px;"></div>
  </div>
  <div${E} style="margin:10px 22px 0;font-size:6.2px;color:#4a4a45;line-height:1.55;"><b>NOTES.</b> Dangerous goods (LN 4) to be handled per KP-HSE-DG-01. Landing on moonpool crane only after Permit to Work is issued. Discrepancies to be reported to Logistics on arrival, before unloading is signed off. Conditions of carriage overleaf.</div>

  ${foldTicks()}
  ${footer('KP-LOG-0102 · REV 01', 23)}
</div>`;

// ================= MANIFESTO — verso (condições de transporte) =================
const clause = (n, h, t) => `<div style="margin-bottom:6px;"><div style="font-weight:700;font-size:6px;letter-spacing:.06em;">${n}. ${h}</div><div style="font-size:6.1px;line-height:1.5;color:#2c2c2a;margin-top:1px;"><div${E}>${t}</div></div></div>`;
const manifestBack = `<div style="${ROOT}">
  ${ruler()}
  ${compactHeader({ title: 'CONDITIONS OF CARRIAGE<br>OFFSHORE SUPPLY', sub: 'REVERSE OF CARGO MANIFEST', sentFrom: 'ØDEMARK A. TOPSIDE', rows: [['DOC NO.', 'KP-LOG-0102'], ['REV.', '01'], ['PAGE', '2 OF 2'], ['CLASS.', 'INTERNAL']] })}
  <div style="margin:11px 22px 0;display:grid;grid-template-columns:1fr 1fr;column-gap:14px;">
    <div>
      ${clause(1, 'DEFINITIONS', '"Carrier" means the operator of the vessel named overleaf. "Consignee" means Kelvara Petrochemicals AS or its designated installation representative. "Goods" means all cargo listed on the manifest.')}
      ${clause(2, 'CARGO DECLARATION', 'All packages must be marked with installation, line number and gross weight. Undeclared or mis-declared goods may be refused, or landed at the shipper\'s risk and expense.')}
      ${clause(3, 'DANGEROUS GOODS', 'Goods classified under the IMDG Code must be accompanied by a completed declaration and stowed as required by the Code. See KP-HSE-DG-01. The master may refuse any package that is damaged or leaking.')}
      ${clause(4, 'WEATHER AND SEA STATE', 'Loading, discharge and crane operations are subject to the assessment of the master and the installation manager. Delay caused by weather is not a breach of these conditions.')}
      ${clause(5, 'CRANE OPERATIONS', 'Goods are landed only after a Permit to Work has been issued. Lifts over the moonpool require two authorised banksmen and radio contact with the control room.')}
      ${clause(6, 'INSPECTION', 'The consignee may inspect the goods on arrival. Discrepancies must be recorded on the manifest before unloading is signed off.')}
    </div>
    <div>
      ${clause(7, 'MAIL AND PERSONAL EFFECTS', 'Mail bags and personal parcels are carried on a best-endeavours basis and must carry an addressee tag. Untagged items are held by Topside Admin for fourteen days and then returned to Stavanger.')}
      ${clause(8, 'LIABILITY', 'The carrier is not liable for loss of or damage to goods caused by sea state, fire, or acts outside its reasonable control. Liability is limited to the declared value on the manifest.')}
      ${clause(9, 'NOTIFICATION OF CLAIMS', 'Loss or damage must be notified to Marine Operations within 24 hours of arrival. Later notification may be rejected.')}
      ${clause(10, 'SECURITY', 'All goods are subject to inspection under the installation security plan. Sealed containers may be opened for inspection without notice.')}
      ${clause(11, 'PERSONNEL ON BOARD', 'Personnel travelling with the goods are subject to the vessel\'s safety rules and the master\'s instructions at all times.')}
      ${clause(12, 'GOVERNING LAW', 'These conditions are governed by Norwegian law. Disputes are subject to the jurisdiction of Stavanger District Court.')}
    </div>
  </div>

  <div style="margin:6px 22px 0;border:1px solid ${INK};">
    <div style="background:${INK};color:#f4f2ea;padding:3.5px 7px;font-weight:700;letter-spacing:.09em;font-size:5.8px;">EMERGENCY CONTACTS — OFFSHORE LOGISTICS</div>
    <div style="display:grid;grid-template-columns:1.3fr 1fr 1fr;font-size:6.6px;">
      <div style="padding:4px 7px;border-bottom:1px solid #cfcdc4;font-weight:700;">MARINE DUTY OFFICER</div><div style="padding:4px 7px;border-bottom:1px solid #cfcdc4;"><div${E} style="font-family:${MONO};">ext. 4100</div></div><div style="padding:4px 7px;border-bottom:1px solid #cfcdc4;"><div${E} style="font-family:${MONO};">VHF ch. 12 / 16</div></div>
      <div style="padding:4px 7px;border-bottom:1px solid #cfcdc4;font-weight:700;">HSE DUTY OFFICER</div><div style="padding:4px 7px;border-bottom:1px solid #cfcdc4;"><div${E} style="font-family:${MONO};">ext. 4417</div></div><div style="padding:4px 7px;border-bottom:1px solid #cfcdc4;"><div${E} style="font-family:${MONO};">VHF ch. 12</div></div>
      <div style="padding:4px 7px;font-weight:700;">INSTALLATION CONTROL ROOM</div><div style="padding:4px 7px;"><div${E} style="font-family:${MONO};">ext. 4001</div></div><div style="padding:4px 7px;"><div${E} style="font-family:${MONO};">24 h</div></div>
    </div>
  </div>

  <div style="margin:12px 22px 0;display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:5.8px;color:${GRAY};">
    <div style="border-top:1px solid ${INK};padding-top:3px;">CARRIER ACKNOWLEDGEMENT — MASTER / DATE</div>
    <div style="border-top:1px solid ${INK};padding-top:3px;">CONSIGNEE ACKNOWLEDGEMENT — NAME / DATE</div>
  </div>
  ${foldTicks()}
  ${footer('KP-LOG-0102 · REV 01 · COC', 24)}
</div>`;

// ================= BOLETIM — frente =================
const hazard = `repeating-linear-gradient(45deg, ${INK} 0 12px, ${ORANGE} 12px 24px)`;
const bul = (t) => `<div style="display:flex;gap:6px;"><div style="width:6px;height:6px;background:${INK};margin-top:3px;flex-shrink:0;"></div><div${E} style="flex:1;">${t}</div></div>`;
const bulletinFront = `<div style="${ROOT}">
  <div style="height:16px;background:${hazard};"></div>
  ${block({ title: 'SAFETY<br>BULLETIN', sub: 'HEALTH, SAFETY &amp; ENVIRONMENT — OFFSHORE', sentFrom: 'HSE DIVISION, STAVANGER HQ', rows: [['BULLETIN', 'KP-SB-014'], ['ISSUED', '15.03'], ['VALID', 'UNTIL REVOKED'], ['DISTRIB.', 'ALL DECKS'], ['CLASS.', 'INTERNAL']] })}
  <div style="margin:9px 22px 0;background:${INK};color:#fff;display:flex;align-items:center;gap:9px;padding:7px 10px;">
    <div style="width:20px;height:18px;background:${ORANGE};clip-path:polygon(50% 0%,0% 100%,100% 100%);display:flex;align-items:flex-end;justify-content:center;flex-shrink:0;"><span style="font-weight:700;font-size:10px;color:${INK};line-height:1;padding-bottom:1px;">!</span></div>
    <div${E} style="flex:1;font-family:${MICRO};font-size:6.8px;line-height:1.5;letter-spacing:.02em;">HAZARD ALERT — MOONPOOL DEPTH SENSOR DISCREPANCY (LT-4102B)</div>
  </div>

  <div style="margin:12px 22px 0;font-size:7.9px;line-height:1.56;color:#1c1c1a;">
    ${secTitle('1', 'SUMMARY')}
    <p${E} style="margin:0 0 7px;">During routine maintenance on 14.03, a topside crew member reported a secondary reading on the moonpool depth sensor (LT-4102B) inconsistent with visual observation. The discrepancy self-corrected after approximately four minutes. No injuries. No equipment damage identified. Sensor calibration was verified on 15.03 and found within tolerance.</p>
    <div style="margin:0 0 10px;border:1px solid ${INK};padding:6px 8px 4px;background:#fff;">
      <svg width="100%" viewBox="0 0 396 92" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <rect x="0" y="0" width="396" height="92" fill="#fff"/>
        <rect x="8" y="8" width="150" height="10" fill="#161616"/>
        <rect x="238" y="8" width="150" height="10" fill="#161616"/>
        <rect x="158" y="8" width="80" height="4" fill="none" stroke="#161616" stroke-dasharray="3 2"/>
        <line x1="158" y1="18" x2="158" y2="82" stroke="#161616" stroke-width="1.4"/>
        <line x1="238" y1="18" x2="238" y2="82" stroke="#161616" stroke-width="1.4"/>
        <path d="M0 40 Q 20 36 40 40 T 80 40 T 120 40 T 158 40" fill="none" stroke="#161616" stroke-width="0.8"/>
        <path d="M238 40 Q 258 36 278 40 T 318 40 T 358 40 T 396 40" fill="none" stroke="#161616" stroke-width="0.8"/>
        <path d="M158 44 Q 178 40 198 44 T 238 44" fill="none" stroke="#161616" stroke-width="0.8" opacity="0.55"/>
        <path d="M158 50 Q 178 46 198 50 T 238 50" fill="none" stroke="#161616" stroke-width="0.8" opacity="0.3"/>
        <line x1="180" y1="12" x2="180" y2="60" stroke="#d9531e" stroke-width="1.2" stroke-dasharray="2 2"/>
        <rect x="174" y="58" width="12" height="7" fill="#d9531e"/>
        <text x="192" y="63" font-family="Courier Prime, monospace" font-size="6" fill="#161616" font-weight="700">LT-4102B</text>
        <text x="196" y="30" font-family="Arimo, Arial, sans-serif" font-size="5.5" fill="#161616">MOONPOOL</text>
        <text x="10" y="32" font-family="Arimo, Arial, sans-serif" font-size="5.5" fill="#161616">TOPSIDE DECK</text>
        <text x="246" y="32" font-family="Arimo, Arial, sans-serif" font-size="5.5" fill="#161616">CRANE PEDESTAL</text>
        <text x="168" y="88" font-family="Arimo, Arial, sans-serif" font-size="5.5" fill="#161616">SEA LEVEL / DEPTH REFERENCE</text>
      </svg>
      <div style="font-size:5.8px;color:${GRAY};margin-top:2px;">Figure 1 — Location of depth sensor LT-4102B in the moonpool shaft (schematic, not to scale)</div>
    </div>

    ${secTitle('2', 'IMMEDIATE ACTIONS')}
    <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:9px;">
      ${bul('Log any sensor discrepancy immediately in the Permit to Work log, regardless of duration.')}
      ${bul('<b>Do not approach the moonpool rail alone</b> during a discrepancy event.')}
      ${bul('Report to your shift supervisor before resuming work.')}
      ${bul('Do not attempt to recalibrate LT-4102B without HSE authorisation.')}
    </div>

    ${secTitle('3', 'REPORTING')}
    <p${E} style="margin:0 0 8px;">Report any recurrence to the HSE Duty Officer (ext. 4417, VHF channel 12). Reports are non-punitive. Near-miss and discrepancy reports are reviewed weekly by the HSE Division. Use report form KP-HSE-07 (overleaf).</p>
  </div>

  <div style="margin:0 22px;border:1px solid ${INK};font-size:6px;">
    <div style="background:#ecebe5;padding:3px 6px;font-weight:700;letter-spacing:.07em;border-bottom:1px solid ${INK};">NOTICE BOARD POSTING — COMPLETE ON DISPLAY</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;">
      <div style="padding:5px 6px;border-right:1px solid #c9c7bf;color:${GRAY};">POSTED BY<br><div${E} data-hand style="font-family:'Caveat',cursive;font-weight:600;font-size:13px;color:${BLUE};line-height:1.1;">M. Krog</div></div>
      <div style="padding:5px 6px;border-right:1px solid #c9c7bf;color:${GRAY};">DATE POSTED<br><div${E} data-hand style="font-family:'Caveat',cursive;font-weight:600;font-size:13px;color:${BLUE};line-height:1.1;">16.03</div></div>
      <div style="padding:5px 6px;border-right:1px solid #c9c7bf;color:${GRAY};">DATE REMOVED<br><div${E} data-hand style="font-family:'Caveat',cursive;font-weight:600;font-size:13px;color:${BLUE};line-height:1.1;min-height:14px;">&nbsp;</div></div>
      <div style="padding:5px 6px;color:${GRAY};">INITIALS<br><div${E} data-hand style="font-family:'Caveat',cursive;font-weight:600;font-size:13px;color:${BLUE};line-height:1.1;min-height:14px;">&nbsp;</div></div>
    </div>
  </div>
  <div style="margin:8px 22px 0;font-size:6.2px;color:#4a4a45;line-height:1.5;"><b>POST ON ALL DECK NOTICE BOARDS.</b> This bulletin remains in force until withdrawn by the HSE Division. Uncontrolled copies must be replaced on revision.</div>

  ${foldTicks()}
  ${footer('KP-SB-014 · REV 01', 37)}
</div>`;

// ================= BOLETIM — verso (formulário HSE) =================
const ff = (label, h, content, opt = {}) => `<div style="${opt.span ? 'grid-column:span ' + opt.span + ';' : ''}border-right:1px solid ${INK};border-bottom:1px solid ${INK};padding:3px 6px 3px;height:${h}px;position:relative;">
  <div style="font-size:5px;letter-spacing:.08em;color:${GRAY};font-weight:700;">${label}</div>
  ${content}
</div>`;
const penf = (t, o = {}) => `<div${E} data-hand style="font-family:'Caveat',cursive;font-weight:600;font-size:${o.size || 12}px;line-height:1.05;color:${BLUE};margin-top:1px;${o.rot ? 'transform:rotate(' + o.rot + 'deg);' : ''}">${t}</div>`;
const cb = (checked, label) => `<span style="display:inline-block;margin-right:8px;"><span style="display:inline-block;width:6.5px;height:6.5px;border:1px solid ${INK};margin-right:3px;vertical-align:-1px;text-align:center;font-size:6px;line-height:6px;font-weight:700;">${checked ? '✕' : ''}</span>${label}</span>`;
const bulletinBack = `<div style="${ROOT}">
  <div style="height:16px;background:${hazard};"></div>
  ${compactHeader({ title: 'HSE REPORT FORM<br>KP-HSE-07', sub: 'SENSOR DISCREPANCY / NEAR-MISS REPORT', sentFrom: 'HSE DIVISION, STAVANGER HQ', rows: [['BULLETIN', 'KP-SB-014'], ['REV.', '01'], ['PAGE', '2 OF 2'], ['CLASS.', 'INTERNAL']] })}
  <div style="margin:9px 22px 0;background:#ecebe5;border:1px solid ${INK};padding:5px 8px;font-size:6.4px;line-height:1.5;"><b>NON-PUNITIVE REPORTING.</b> Complete this form for any sensor discrepancy, near-miss or observation that does not match instrument readings. Hand to your shift supervisor before the end of shift. Copies: HSE Division · Platform Manager · File.</div>

  <div style="margin:8px 22px 0;display:grid;grid-template-columns:1.4fr 1fr 1fr;border-top:1px solid ${INK};border-left:1px solid ${INK};">
    ${ff('1 · REPORTED BY (NAME / ROLE)', 26, penf('M. Krog — Deck Crew, Topside'))}
    ${ff('2 · DATE OF EVENT', 26, penf('14.03'))}
    ${ff('3 · TIME (24 H)', 26, penf('10:41'))}
    ${ff('4 · LOCATION', 24, `<div style="font-size:6.4px;line-height:1.7;margin-top:1px;">${cb(true, 'MOONPOOL')}${cb(false, 'RIG FLOOR')}${cb(false, 'ENGINE RM')}${cb(false, 'OTHER')}</div>`, { span: 3 })}
    ${ff('5 · INSTRUMENT / TAG', 26, penf('LT-4102B (moonpool depth)'))}
    ${ff('6 · READING SHOWN', 26, penf('41.2 m'))}
    ${ff('7 · OBSERVED / EXPECTED', 26, penf('~36 m (flat surface)'))}
    ${ff('8 · DURATION OF DISCREPANCY', 26, penf('about 4 min, self-corrected'))}
    ${ff('9 · INJURY / DAMAGE', 26, `<div style="font-size:6.4px;margin-top:2px;">${cb(false, 'YES')}${cb(true, 'NO')}</div>`)}
    ${ff('10 · WORK IN PROGRESS', 26, penf('crane pedestal maint.'))}
    ${ff('11 · WHAT WAS OBSERVED (DESCRIBE IN YOUR OWN WORDS)', 66, penf('Surface looked flat. Instrument said 41 m for about four minutes then dropped back to normal on its own. Nobody near the rail. Heard nothing from below but the shaft felt colder than it should. Did not approach the rail.', { size: 12.5 }), { span: 3 })}
    ${ff('12 · IMMEDIATE ACTION TAKEN', 40, penf('Logged in PTW log. Informed shift supervisor. Kept clear of rail until reading normal.', { size: 12.5 }), { span: 3 })}
    ${ff('13 · SUGGESTED FOLLOW-UP', 34, penf('Sensor check. Maybe not the sensor.', { size: 12.5 }), { span: 3 })}
    ${ff('14 · REPORTER SIGNATURE / DATE', 30, penf('M. Krog  14.03', { size: 15, rot: -2 }), { span: 2 })}
    ${ff('15 · SUPERVISOR (RECEIVED) / DATE', 30, penf('T. Lund  14.03 11:05', { size: 13, rot: -1 }))}
  </div>

  <div style="margin:8px 22px 0;border:1px solid ${INK};font-size:6.2px;">
    <div style="background:${INK};color:#f4f2ea;padding:3px 7px;font-weight:700;letter-spacing:.09em;font-size:5.6px;">FOR HSE DIVISION USE ONLY</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;">
      <div style="padding:5px 7px;border-right:1px solid #c9c7bf;color:${GRAY};">REPORT NO.<br><b style="font-family:${MONO};color:${INK};">HSE-OS-0314-02</b></div>
      <div style="padding:5px 7px;border-right:1px solid #c9c7bf;color:${GRAY};">CLASSIFICATION<br><b style="color:${INK};">OBSERVATION — UNEXPLAINED</b></div>
      <div style="padding:5px 7px;color:${GRAY};">REVIEWED BY / DATE<br><b style="color:${INK};">—</b></div>
    </div>
  </div>
  ${foldTicks()}
  ${footer('KP-HSE-07 · REV 03', 38)}
</div>`;

const out = (name, title, body, meta) => {
  fs.writeFileSync(path.join(OUT, name), docFile({ title, fonts: FONTS, body }));
  register(Object.assign({ file: name, family: 'kelvara' }, meta));
};
out('Main.dc.html', 'Kelvara — Memorando', memoFront, { doc: 'kelvara_memo', side: 'front', label: 'Memorando interno' });
out('Main_back.dc.html', 'Kelvara — Memorando (verso)', memoBack, { doc: 'kelvara_memo', side: 'back', label: 'Memorando interno' });
out('Kelvara2.dc.html', 'Kelvara — Manifesto de carga', manifestFront, { doc: 'kelvara_manifest', side: 'front', label: 'Manifesto de carga' });
out('Kelvara2_back.dc.html', 'Kelvara — Manifesto (verso)', manifestBack, { doc: 'kelvara_manifest', side: 'back', label: 'Manifesto de carga' });
out('Kelvara3.dc.html', 'Kelvara — Boletim de segurança', bulletinFront, { doc: 'kelvara_bulletin', side: 'front', label: 'Boletim de segurança' });
out('Kelvara3_back.dc.html', 'Kelvara — Boletim (verso)', bulletinBack, { doc: 'kelvara_bulletin', side: 'back', label: 'Boletim de segurança' });
console.log('kelvara ok');
