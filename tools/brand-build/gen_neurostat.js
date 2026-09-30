const fs = require('fs');
const path = require('path');
const L = require('./gen_lib');
const { B, img, docFile, barcode, qr, register, E, O } = L;
const OUT = path.join(__dirname, 'out');
require('fs').mkdirSync(OUT, { recursive: true });

const FONTS = 'family=Roboto+Condensed:wght@400;700&family=Source+Sans+3:wght@400;600;700&family=Courier+Prime:wght@400;700';
const NAVY = '#14243a';
const GRAYB = '#5c6b7d';
const LINEB = '#9aa9bb';
const BLUEF = '#dfe8f7'; // campo de PDF preenchível (destaque azul do Acrobat)
const COND = "'Roboto Condensed','Arial Narrow',sans-serif";
const MONO = "'Courier Prime',monospace";

const ROOT = `width:460px;height:650px;box-sizing:border-box;position:relative;overflow:hidden;background:#fdfdfb;font-family:'Source Sans 3',Arial,sans-serif;color:#17202b;`;

// Cabeçalho da NeuroStat: papel timbrado centralizado, simétrico, regra dupla (institucional/clínico)
function header({ form, docNo, seed, cls = 'CONFIDENTIAL — PROPRIETARY' }) {
  return `<div style="position:relative;padding:13px 24px 0;">
    <div style="display:flex;justify-content:space-between;font-size:5.3px;letter-spacing:.09em;color:${GRAYB};">
      <div${E}>${form}</div><div${E} style="font-weight:700;color:${NAVY};">${cls}</div>
    </div>
    <div style="position:absolute;left:24px;top:27px;font-family:${MONO};font-size:5.2px;color:${GRAYB};line-height:1.55;"><div>DOC NO.</div><div${E} style="color:${NAVY};font-size:6px;font-weight:700;">${docNo}</div></div>
    <div style="position:absolute;right:24px;top:25px;">${barcode(seed, 76, 20, NAVY)}</div>
    <div style="display:flex;flex-direction:column;align-items:center;margin-top:4px;">
      <div style="width:36px;height:29px;overflow:hidden;position:relative;"><img src="${img(B.nsMark)}" alt="NeuroStat" style="position:absolute;width:119px;height:auto;left:-42px;top:-18px;"></div>
      <div style="font-family:${COND};font-weight:700;font-size:16px;letter-spacing:.34em;margin:4px 0 0 .34em;color:${NAVY};line-height:1;">NEUROSTAT</div>
      <div style="font-size:5.4px;letter-spacing:.24em;color:${GRAYB};margin-top:4px;">FIELD DIVISION · OFFICE OF CLINICAL AFFAIRS</div>
    </div>
    <div style="margin-top:8px;height:2px;background:${NAVY};"></div><div style="margin-top:2px;height:.75px;background:${NAVY};"></div>
  </div>`;
}

// Cabeçalho de continuação (versos): marca + wordmark pequeno à esquerda, título e nº à direita, regra dupla
function contHeader({ title, sub, form, docNo, seed, cls = 'CONFIDENTIAL — PROPRIETARY' }) {
  return `<div style="position:relative;padding:13px 24px 0;">
    <div style="display:flex;justify-content:space-between;font-size:5.3px;letter-spacing:.09em;color:${GRAYB};">
      <div${E}>${form}</div><div${E} style="font-weight:700;color:${NAVY};">${cls}</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:36px;height:29px;overflow:hidden;position:relative;flex-shrink:0;"><img src="${img(B.nsMark)}" alt="NeuroStat" style="position:absolute;width:119px;height:auto;left:-42px;top:-18px;"></div>
        <div>
          <div style="font-family:${COND};font-weight:700;font-size:12px;letter-spacing:.3em;color:${NAVY};line-height:1;">NEUROSTAT</div>
          <div style="font-size:4.8px;letter-spacing:.2em;color:${GRAYB};margin-top:3px;">FIELD DIVISION · OFFICE OF CLINICAL AFFAIRS</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div${E} style="font-family:${COND};font-weight:700;font-size:10px;letter-spacing:.08em;color:${NAVY};">${title}</div>
        <div${E} style="font-family:${MONO};font-size:5.6px;color:${GRAYB};margin-top:2px;">${sub}</div>
      </div>
    </div>
    <div style="margin-top:8px;height:2px;background:${NAVY};"></div><div style="margin-top:2px;height:.75px;background:${NAVY};"></div>
  </div>`;
}

function footer(seed, pages = '1 OF 1', printed = 'Printed 21 MAR 04:31 by SYSADM · NeuroStat Document Management System v4.2') {
  return `<div style="position:absolute;left:24px;right:24px;bottom:13px;border-top:.75px solid ${NAVY};padding-top:5px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;">
    <div style="font-size:5px;line-height:1.55;color:#4d5a6a;">
      <div>This document contains confidential and proprietary information of NeuroStat Org. Unauthorized disclosure, copying or distribution is prohibited.</div>
      <div${E}>${printed}</div>
    </div>
    <div style="display:flex;gap:6px;align-items:flex-end;flex-shrink:0;"><div style="font-size:5.4px;text-align:right;color:${GRAYB};line-height:1.5;"><div>PAGE</div><div${E} style="color:${NAVY};font-weight:700;">${pages}</div></div>${qr(seed, 30, NAVY)}</div>
  </div>`;
}

const watermark = `<div style="position:absolute;left:50%;top:52%;transform:translate(-50%,-50%) rotate(-31deg);font-family:${COND};font-weight:700;font-size:58px;letter-spacing:.12em;color:rgba(20,36,58,0.045);white-space:nowrap;pointer-events:none;">CONFIDENTIAL</div>`;

const secHead = (n, t) => `<div style="font-family:${COND};font-weight:700;font-size:8px;letter-spacing:.14em;color:${NAVY};border-bottom:1px solid ${NAVY};padding-bottom:2px;margin:11px 0 5px;">${n ? n + '&nbsp; ' : ''}${t}</div>`;

const cell = (label, value, opts = {}) => `<div style="padding:3px 6px 4px;border-right:1px solid ${NAVY};border-bottom:1px solid ${NAVY};${opts.span ? 'grid-column:span ' + opts.span + ';' : ''}${opts.field ? 'background:' + BLUEF + ';' : ''}">
  <div style="font-size:4.8px;letter-spacing:.09em;color:${GRAYB};font-weight:700;">${label}</div>
  <div${E} style="font-size:7.6px;margin-top:1px;${opts.mono ? 'font-family:' + MONO + ';font-weight:700;' : ''}line-height:1.35;">${value}</div>
</div>`;
const grid = (cols, cells) => `<div style="display:grid;grid-template-columns:${cols};border-top:1px solid ${NAVY};border-left:1px solid ${NAVY};margin-top:9px;">${cells}</div>`;
const cbox = (checked) => `<span style="display:inline-block;width:6.5px;height:6.5px;border:1px solid ${NAVY};margin-right:3px;vertical-align:-1px;text-align:center;font-size:6px;line-height:6px;font-weight:700;">${checked ? '✕' : ''}</span>`;

const esign = (name, role, when, cert, mt = 10) => `<div style="display:grid;grid-template-columns:auto 1fr auto;border:1px solid ${NAVY};margin-top:${mt}px;align-items:stretch;">
  <div style="background:${NAVY};color:#fff;font-family:${COND};font-weight:700;font-size:6px;letter-spacing:.1em;padding:5px 7px;display:flex;align-items:center;line-height:1.3;">ELECTRONICALLY<br>SIGNED</div>
  <div style="padding:4px 8px;"><div${E} style="font-size:7px;line-height:1.4;"><b>${name}</b> — ${role}</div><div${E} style="font-family:${MONO};font-size:6.3px;line-height:1.4;color:${GRAYB};">${when}</div></div>
  <div style="padding:4px 8px;border-left:1px solid ${LINEB};font-family:${MONO};font-size:5.8px;color:${GRAYB};display:flex;flex-direction:column;justify-content:center;"><div>CERT</div><div${E}>${cert}</div></div>
</div>`;

const th = (cols, labels) => `<div style="display:grid;grid-template-columns:${cols};background:${NAVY};color:#fff;font-family:${COND};font-weight:700;font-size:5.6px;letter-spacing:.12em;">${labels.map(l => `<div style="padding:3px 6px;">${l}</div>`).join('')}</div>`;
const tr = (cols, vals, i, mono = [], extra = '') => `<div style="display:grid;align-items:baseline;grid-template-columns:${cols};border-top:1px solid #c7d0dc;${i % 2 ? 'background:#f2f5f9;' : ''}${extra}">${vals.map((v, k) => `<div style="padding:3px 6px;"><div${E} style="${mono.includes(k) ? 'font-family:' + MONO + ';font-weight:700;' : ''}">${v}</div></div>`).join('')}</div>`;

const redact = (w) => `<span data-r style="background:#0c0c0c;color:#0c0c0c;padding:0 2px;">${w}</span>`;

const titleRow = (t, s) => `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:11px;">
      <div${E} style="font-family:${COND};font-weight:700;font-size:15px;letter-spacing:.06em;color:${NAVY};">${t}</div>
      <div${E} style="font-size:6px;letter-spacing:.08em;color:${GRAYB};">${s}</div>
    </div>`;
const titleRowBack = (t, s) => `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:9px;">
      <div${E} style="font-family:${COND};font-weight:700;font-size:12.5px;letter-spacing:.06em;color:${NAVY};">${t}</div>
      <div${E} style="font-size:6px;letter-spacing:.08em;color:${GRAYB};">${s}</div>
    </div>`;

// ---------- NeuroStat: relatório de incidente — frente ----------
const T1 = '48px 1fr';
const tlRow = (t, e, i) => tr(T1, [t, e], i, [0]);
const report = `<div style="${ROOT}">
  ${watermark}
  ${header({ form: 'FORM NS-IR-02 · REV. 06/18', docNo: 'NS-DES-0451', seed: 51 })}
  <div style="padding:0 24px;">
    ${titleRow('INCIDENT REPORT', 'COMMUNICATIONS LOSS — NIGHT SHIFT')}
    ${grid('1fr 1fr 0.8fr 1.3fr',
  cell('REPORT NO.', 'NS-DES-0451', { mono: true }) + cell('DATE OF INCIDENT', '21 MAR') + cell('TIME (LOCAL)', '03:12', { mono: true }) + cell('LOCATION', 'Platform — moonpool deck') +
  cell('REPORTED BY', 'HOLT, M.') + cell('DIVISION', 'Field Division') +
  `<div style="padding:3px 6px 4px;border-right:1px solid ${NAVY};border-bottom:1px solid ${NAVY};grid-column:span 2;"><div style="font-size:4.8px;letter-spacing:.09em;color:${GRAYB};font-weight:700;">INCIDENT TYPE</div><div style="font-size:7px;margin-top:2px;">${cbox(true)}COMMS LOSS &nbsp;${cbox(false)}EQUIPMENT &nbsp;${cbox(false)}PERSONNEL &nbsp;${cbox(false)}OTHER</div></div>`)}

    ${secHead('1', 'NARRATIVE')}
    <div style="font-size:7.7px;line-height:1.55;">
      <p${E} style="margin:0 0 6px;">At 03:12 local, radio contact with the ${redact('XXXXXX')} team was lost. The last recorded transmission consisted of broadband noise with no identifiable verbal content. Contact was not re-established on the primary or backup channel.</p>
      <p${E} style="margin:0 0 6px;">Surface crew are not authorized to descend without a direct order from supervision. ${redact('XXXXXXXXXX')} has been notified per standard protocol.</p>
      <p${E} style="margin:0;">Recommend continued monitoring of channel 4 until contact is reestablished or Holt authorizes escalation.</p>
    </div>

    ${secHead('2', 'TIMELINE')}
    <div style="border:1px solid ${NAVY};font-size:7px;">
      ${th(T1, ['TIME', 'EVENT'])}
      ${tlRow('03:12', 'Primary channel — contact lost', 0)}
      ${tlRow('03:14', 'Retry × 3 — no response', 1)}
      ${tlRow('03:20', 'Backup channel opened — carrier detected, no content', 0)}
      ${tlRow('03:52', 'Supervisor — no descent authorised (logged NS-DES-0451/A)', 1)}
    </div>

    ${secHead('3', 'DISPOSITION')}
    <div style="font-size:7.4px;line-height:1.7;">${cbox(true)}ESCALATED TO FIELD DIVISION &nbsp;&nbsp;${cbox(false)}CLOSED &nbsp;&nbsp;${cbox(false)}REFERRED<div${E}><b>Status:</b> OPEN — pending escalation authority.</div></div>

    ${secHead('4', 'ATTACHMENTS &amp; DISTRIBUTION')}
    <div style="font-size:7.2px;line-height:1.6;"><div${E}><b>Attachments:</b> A — Radio log extract, channel 4 (overleaf) · B — Secure messaging export NS-DES-0451/B (1 p.)</div><div${E}><b>Distribution:</b> Field Division Supervisor · Office of Clinical Affairs · Records (file)</div></div>
    ${esign('HOLT, M.', 'Field Division Supervisor', '21 MAR 04:02 · UTC+1', '7F3A-91C2')}
  </div>
  <img${O('stamp')} src="${img(B.nsStamp)}" alt="" style="position:absolute;right:-16px;top:540px;width:170px;transform:rotate(-7deg);opacity:.93;">
  ${footer(61, '1 OF 2')}
</div>`;

// ---------- relatório — verso: depoimentos, anexo A, ações ----------
const stmt = (who, role, taken, text) => `<div style="border:1px solid ${NAVY};margin-bottom:6px;">
  <div style="display:grid;grid-template-columns:1fr auto;background:#e6ecf3;border-bottom:1px solid ${NAVY};padding:3px 7px;font-size:6.6px;">
    <div${E}><b>${who}</b> — ${role}</div><div${E} style="font-family:${MONO};font-size:6px;color:${GRAYB};">${taken}</div>
  </div>
  <div${E} style="padding:5px 7px;font-size:7.3px;line-height:1.5;">${text}</div>
</div>`;
const RL = '54px 34px 22px 1fr';
const rlRow = (a, b, c, d, i) => tr(RL, [a, b, c, d], i, [0, 1, 2]);
const CA = '14px 1fr 70px 40px 52px';
const caRow = (n, a, o, d, s, i) => tr(CA, [n, a, o, d, s], i, [0, 3]);
const reportBack = `<div style="${ROOT}">
  ${watermark}
  ${contHeader({ form: 'FORM NS-IR-02 · REV. 06/18', title: 'INCIDENT REPORT — CONTINUATION', sub: 'NS-DES-0451 · SHEET 2 OF 2', docNo: 'NS-DES-0451', seed: 52 })}
  <div style="padding:0 24px;">
    ${secHead('5', 'WITNESS STATEMENTS (SUMMARY)')}
    ${stmt('OKAFOR, R.', 'Dive Support', '21 MAR 06:20 · taken by Supervisor', 'Witness was monitoring channel 2 from the dive support station. At 03:12 the channel stopped carrying speech. Witness states the line "was not down, it was full". Hails produced no response. Witness moved to the backup at 03:45 and did not hear the team again.')}
    ${stmt('LINDQVIST, T.', 'Comms Technician', '21 MAR 06:41 · taken by Supervisor', `Witness confirms loss of contact at 03:12. Witness deleted one message from channel #field-dive at 03:49 (see NS-DES-0451/B) and describes it as "a personal remark". Witness declined to repeat its content. ${redact('XXXXXXXXXXXXXXXX')}`)}

    ${secHead('6', 'ATTACHMENT A — RADIO LOG EXTRACT, CHANNEL 4')}
    <div style="border:1px solid ${NAVY};font-size:6.8px;">
      ${th(RL, ['TIME', 'CH', 'DIR', 'CONTENT'])}
      ${rlRow('03:12:04', 'CH4', 'RX', 'broadband noise, 4.2 s, no speech', 0)}
      ${rlRow('03:12:09', 'CH4', 'TX', '"Dive support to Field team, read?"', 1)}
      ${rlRow('03:14:00', 'CH4', 'TX', 'hail × 3, no reply', 0)}
      ${rlRow('03:20:11', 'BK', 'RX', 'carrier present, payload absent', 1)}
      ${rlRow('03:41:57', 'CH4', 'RX', 'broadband noise, 11.0 s, no speech', 0)}
      ${rlRow('03:52:20', 'CH4', '—', 'monitoring continued, no traffic', 1)}
    </div>

    ${secHead('7', 'CORRECTIVE ACTIONS')}
    <div style="border:1px solid ${NAVY};font-size:6.8px;">
      ${th(CA, ['#', 'ACTION', 'OWNER', 'DUE', 'STATUS'])}
      ${caRow('1', 'Inspect CH2 / CH4 transceivers and moonpool relay', 'Comms Tech', '24 MAR', 'OPEN', 0)}
      ${caRow('2', 'Retrieve full audit trail, #field-dive (NS-AT-01)', 'Records', '24 MAR', 'REQUESTED', 1)}
      ${caRow('3', 'Post-incident assessment, personnel on channel (NS-PSY-11)', 'Clinical', '24 MAR', 'DONE', 0)}
      ${caRow('4', 'Review descent authorisation threshold', 'FD Supervisor', '28 MAR', 'OPEN', 1)}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px;font-size:7px;">
      <div style="border:1px solid ${NAVY};padding:4px 7px;"><div style="font-family:${COND};font-weight:700;font-size:5.8px;letter-spacing:.1em;margin-bottom:2px;">8 · PRELIMINARY CAUSE</div>${cbox(false)}EQUIPMENT &nbsp;${cbox(false)}PROCEDURE<br>${cbox(false)}ENVIRONMENTAL &nbsp;${cbox(true)}UNDETERMINED</div>
      <div style="border:1px solid ${NAVY};padding:4px 7px;"><div style="font-family:${COND};font-weight:700;font-size:5.8px;letter-spacing:.1em;margin-bottom:2px;">9 · REVIEW</div><div${E} style="font-size:7px;line-height:1.5;">Office of Clinical Affairs: <b>PENDING</b><br>Records received: 21 MAR 09:15</div></div>
    </div>
  </div>
  ${footer(62, '2 OF 2')}
</div>`;

// ---------- Requisição — frente ----------
const cellsI = (r, ex = '') => `<div style="display:grid;grid-template-columns:16px 1fr 50px 24px 46px;font-size:7.2px;border-top:1px solid #c7d0dc;${ex}"><div style="padding:3px 5px;font-family:${MONO};color:${GRAYB};">${r[0]}</div><div style="padding:3px 5px;background:${BLUEF};"><div${E}>${r[1]}</div></div><div style="padding:3px 5px;font-family:${MONO};background:${BLUEF};"><div${E}>${r[2]}</div></div><div style="padding:3px 5px;text-align:right;font-family:${MONO};background:${BLUEF};"><div${E}>${r[3]}</div></div><div style="padding:3px 5px;text-align:right;font-family:${MONO};background:${BLUEF};"><div${E}>${r[4]}</div></div></div>`;
const items = [
  ['1', 'Headset, comms, waterproof housing (unit 4 replacement)', 'HS-4-WH', '1', '412.00'],
  ['2', 'Housing gasket set, unit 4', 'GK-22', '2', '36.00'],
].map(r => cellsI(r)).join('');
const blankItems = [3, 4].map(n => `<div style="display:grid;grid-template-columns:16px 1fr 50px 24px 46px;font-size:7.2px;border-top:1px solid #c7d0dc;height:14px;"><div style="padding:3px 5px;font-family:${MONO};color:${GRAYB};">${n}</div><div style="background:#eef2f8;"></div><div style="background:#eef2f8;"></div><div style="background:#eef2f8;"></div><div style="background:#eef2f8;"></div></div>`).join('');

const apprCell = (role, l1, l2, last) => `<div style="${last ? '' : 'border-right:1px solid ' + NAVY + ';'}"><div style="background:#eef2f8;padding:3px 6px;font-weight:700;letter-spacing:.08em;font-size:5.2px;color:${GRAYB};">${role}</div><div style="padding:5px 6px;height:26px;font-size:6.4px;"><div${E}>${l1}</div><div${E} style="font-family:${MONO};color:${GRAYB};">${l2}</div></div></div>`;

const requisition = `<div style="${ROOT}">
  ${header({ form: 'FORM NS-EQ-04 · REV. 03/17', docNo: 'NS-REQ-1187', seed: 71 })}
  <div style="padding:0 24px;">
    ${titleRow('EQUIPMENT REQUISITION', 'FIELD DIVISION')}
    ${grid('1.2fr 1fr 1fr',
  cell('1 · REQUESTING EMPLOYEE', 'R. Okafor', { field: true }) + cell('2 · EMPLOYEE ID', 'NS-F-0212', { mono: true, field: true }) + cell('3 · DATE OF REQUEST', '21 MAR', { field: true }) +
  cell('4 · DEPARTMENT', 'Dive Support', { field: true }) + cell('5 · COST CENTER', 'FD-4417', { mono: true, field: true }) +
  `<div style="padding:3px 6px 4px;border-right:1px solid ${NAVY};border-bottom:1px solid ${NAVY};"><div style="font-size:4.8px;letter-spacing:.09em;color:${GRAYB};font-weight:700;">6 · PRIORITY</div><div style="font-size:7px;margin-top:2px;">${cbox(false)}STANDARD &nbsp;${cbox(true)}URGENT</div></div>`)}

    ${secHead('A', 'ITEMS REQUESTED')}
    <div style="border:1px solid ${NAVY};">
      <div style="display:grid;grid-template-columns:16px 1fr 50px 24px 46px;background:${NAVY};color:#fff;font-family:${COND};font-weight:700;font-size:5.6px;letter-spacing:.11em;"><div style="padding:3px 5px;">LN</div><div style="padding:3px 5px;">DESCRIPTION</div><div style="padding:3px 5px;">PART NO.</div><div style="padding:3px 5px;text-align:right;">QTY</div><div style="padding:3px 5px;text-align:right;">USD</div></div>
      ${items}${blankItems}
      <div style="display:grid;grid-template-columns:1fr 46px;font-size:7px;border-top:1.5px solid ${NAVY};background:#eef2f8;font-weight:700;"><div style="padding:3px 5px;text-align:right;">ESTIMATED TOTAL</div><div style="padding:3px 5px;text-align:right;font-family:${MONO};"><div${E}>448.00</div></div></div>
    </div>

    ${secHead('B', 'JUSTIFICATION')}
    <div style="background:${BLUEF};border:1px solid ${LINEB};padding:5px 7px;min-height:34px;"><div${E} style="font-size:7.6px;line-height:1.5;">Unit 4 headset failed during 03:12 contact loss — suspected water ingress at housing seal. Unit removed from service and tagged. Replacement required before next dive rotation.</div></div>

    ${secHead('C', 'APPROVALS')}
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border:1px solid ${NAVY};font-size:6px;">
      ${apprCell('REQUESTER', '<b>R. OKAFOR</b>', '21 MAR 08:41 · e-sig')}
      ${apprCell('SUPERVISOR', 'PENDING', '— / — / —')}
      ${apprCell('PROCUREMENT', 'PENDING', '— / — / —', true)}
    </div>

    <div style="margin-top:9px;border:1px dashed ${GRAYB};padding:5px 7px;font-size:6.2px;color:${GRAYB};display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
      <div style="grid-column:span 3;font-weight:700;letter-spacing:.1em;font-size:5.4px;">FOR PROCUREMENT USE ONLY</div>
      <div>PO NO. ____________</div><div>DATE ORDERED ________</div><div>VENDOR ID _______</div>
    </div>
  </div>
  ${footer(81, '1 OF 2', 'Printed 21 MAR 09:05 by OKAFOR, R. · NeuroStat Document Management System v4.2')}
</div>`;

// ---------- Requisição — verso: instruções, matriz, log de rota ----------
const ins = (n, t) => `<div style="display:flex;gap:5px;margin-bottom:4px;"><div style="font-family:${MONO};font-weight:700;font-size:6.6px;color:${NAVY};flex-shrink:0;">${n}.</div><div${E} style="flex:1;font-size:6.9px;line-height:1.5;">${t}</div></div>`;
const AM = '1.1fr 1.6fr 0.8fr';
const amRow = (a, b, c, i) => tr(AM, [a, b, c], i, [0]);
const RT = '74px 66px 1fr';
const rtRow = (a, b, c, i) => tr(RT, [a, b, c], i, [0, 1]);
const requisitionBack = `<div style="${ROOT}">
  ${contHeader({ form: 'FORM NS-EQ-04 · REV. 03/17', title: 'EQUIPMENT REQUISITION — INSTRUCTIONS', sub: 'NS-REQ-1187 · SHEET 2 OF 2', docNo: 'NS-REQ-1187', seed: 72 })}
  <div style="padding:0 24px;">
    ${secHead('', 'INSTRUCTIONS FOR COMPLETION')}
    <div style="display:grid;grid-template-columns:1fr 1fr;column-gap:14px;">
      <div>
        ${ins(1, 'Complete every field in Section A and B. Fields shaded blue are required. The form cannot be routed with a required field empty.')}
        ${ins(2, 'Use manufacturer part numbers. If no part number exists, describe the item and attach a specification sheet.')}
        ${ins(3, 'Estimated total must include shipping to the platform. Offshore freight is charged at cost.')}
        ${ins(4, 'Justification must state the operational effect if the request is refused.')}
      </div>
      <div>
        ${ins(5, 'URGENT priority is reserved for items required to keep a crew member safe or a system operational. Misuse is recorded.')}
        ${ins(6, 'Do not combine safety-critical and routine items on one form.')}
        ${ins(7, 'Failed or removed equipment must be tagged and held for inspection. Do not discard.')}
        ${ins(8, 'Retain the requester copy for seven years. Procurement retains the original.')}
      </div>
    </div>

    ${secHead('', 'APPROVAL AUTHORITY MATRIX')}
    <div style="border:1px solid ${NAVY};font-size:6.9px;">
      ${th(AM, ['ESTIMATED TOTAL (USD)', 'REQUIRED APPROVAL', 'TARGET'])}
      ${amRow('up to 500', 'Immediate supervisor', '1 day', 0)}
      ${amRow('501 – 2,500', 'Supervisor + Procurement', '3 days', 1)}
      ${amRow('2,501 – 10,000', 'Field Division Director', '5 days', 0)}
      ${amRow('over 10,000', 'Office of Clinical Affairs', '10 days', 1)}
    </div>
    <div${E} style="margin-top:5px;font-size:6.4px;line-height:1.5;color:${GRAYB};">URGENT requests are routed to Procurement in parallel with supervisor approval. The target turnaround for URGENT is four hours. Requests linked to an open incident report may be placed on hold by Records.</div>

    ${secHead('', 'ROUTING LOG')}
    <div style="border:1px solid ${NAVY};font-size:6.6px;">
      ${th(RT, ['DATE / TIME', 'USER', 'ACTION'])}
      ${rtRow('21 MAR 08:41', 'OKAFOR, R.', 'SUBMITTED (URGENT)', 0)}
      ${rtRow('21 MAR 08:41', 'SYSTEM', 'ROUTED → SUPERVISOR (HOLT, M.), PROCUREMENT', 1)}
      ${rtRow('21 MAR 09:02', 'HOLT, M.', 'VIEWED', 0)}
      ${rtRow('21 MAR 09:15', 'RECORDS', 'LINKED TO NS-DES-0451', 1)}
      ${rtRow('22 MAR 07:30', 'RECORDS', 'HOLD — PENDING INCIDENT REVIEW', 0)}
    </div>

    <div style="margin-top:9px;border:1px solid ${NAVY};padding:5px 8px;font-size:6.6px;line-height:1.55;"><div${E}><b>STATUS: ON HOLD.</b> Do not order. Release requires written authorisation from the Office of Clinical Affairs.</div></div>
  </div>
  ${footer(82, '2 OF 2', 'Printed 22 MAR 07:41 by RECORDS · NeuroStat Document Management System v4.2')}
</div>`;

// ---------- Mensagens seguras (1 página, sem verso) ----------
const M3 = '52px 62px 1fr';
const logLine = (t, who, msg, opt = {}) => `<div style="display:grid;grid-template-columns:${M3};gap:4px;padding:3.5px 8px;border-top:1px solid #d5dbe4;font-size:7px;line-height:1.5;${opt.bg ? 'background:' + opt.bg + ';' : ''}${opt.color ? 'color:' + opt.color + ';' : ''}">
  <div${E} style="font-family:${MONO};color:${opt.tcolor || GRAYB};">${t}</div><div${E} style="font-family:${MONO};font-weight:700;">${who}</div><div${E} style="${opt.italic ? 'font-style:italic;' : ''}">${msg}</div></div>`;
const messaging = `<div style="${ROOT}">
  ${watermark}
  ${header({ form: 'SYSTEM EXPORT · SMS-4.2', docNo: 'NS-DES-0451/B', seed: 91 })}
  <div style="padding:0 24px;">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:11px;">
      <div${E} style="font-family:${COND};font-weight:700;font-size:15px;letter-spacing:.06em;color:${NAVY};">SECURE MESSAGING — CHANNEL EXPORT</div>
    </div>
    ${grid('1fr 1fr 1fr',
  cell('CHANNEL', '#field-dive', { mono: true }) + cell('RANGE', '21 MAR 03:40 — 04:00', { mono: true }) + cell('EXPORTED BY', 'SYSADM (auto)', { mono: true }) +
  cell('RECORDS', '5', { mono: true }) + cell('ATTACHMENTS', '0', { mono: true }) + cell('PURPOSE', 'Incident review NS-DES-0451'))}

    <div style="margin-top:10px;border:1px solid ${NAVY};">
      <div style="display:grid;grid-template-columns:${M3};gap:4px;background:${NAVY};color:#fff;font-family:${COND};font-weight:700;font-size:5.6px;letter-spacing:.12em;padding:3px 8px;"><div>TIME</div><div>USER</div><div>MESSAGE</div></div>
      ${logLine('03:44:08', 'R.OKAFOR', 'comms still down on ch2, anyone else getting this')}
      ${logLine('03:45:31', 'T.LINDQVIST', 'same. switching to backup', { bg: '#f2f5f9' })}
      ${logLine('03:47:02', 'R.OKAFOR', "backup's clean. ch2 is just... quiet. not static, quiet")}
      ${logLine('03:49:17', 'SYSTEM', '1 message deleted by T.LINDQVIST', { bg: '#f2f5f9', color: GRAYB, italic: true })}
      ${logLine('03:52:40', 'SUPERVISOR', 'noted. do not descend. logging for NS review', { bg: NAVY, color: '#fff', tcolor: '#9fb3c8' })}
    </div>

    <div style="margin-top:10px;font-family:${MONO};font-size:6.2px;line-height:1.6;color:${GRAYB};border:1px solid ${LINEB};padding:5px 8px;">
      <div>EXPORT INTEGRITY</div>
      <div${E}>SHA-256 &nbsp;9F2C 4B1A 07DD E390 51AC 88F2 3E6B A71D</div>
      <div${E}>RECORDS 5 · DELETED 1 · EDITED 0 · ATTACHMENTS 0</div>
      <div>*** END OF EXPORT ***</div>
    </div>
    <div${E} style="margin-top:9px;font-size:6.4px;line-height:1.55;color:#4d5a6a;"><b>NOTE.</b> Deleted messages are retained in the audit trail and are not reproduced in this export. Request the full audit trail from Records under form NS-AT-01.</div>
  </div>
  ${footer(101, '1 OF 1', 'Printed 21 MAR 04:12 by SYSADM · NeuroStat Document Management System v4.2')}
</div>`;

// ---------- Avaliação psicológica — frente ----------
const mse = (l, v) => `<div style="display:grid;grid-template-columns:82px 1fr;border-top:1px solid ${NAVY};font-size:7.3px;"><div style="background:#e6ecf3;padding:4px 6px;font-family:${COND};font-weight:700;letter-spacing:.09em;font-size:6px;color:${NAVY};display:flex;align-items:center;border-right:1px solid ${NAVY};">${l}</div><div style="padding:4px 7px;line-height:1.45;"><div${E}>${v}</div></div></div>`;
const subj = (label, val, last, mono) => `<div style="padding:4px 7px;${last ? '' : 'border-right:1px solid ' + NAVY + ';'}"><div style="font-size:4.8px;letter-spacing:.09em;color:${GRAYB};font-weight:700;">${label}</div><div${E}${mono ? ` style="font-family:${MONO};font-weight:700;"` : ''}>${val}</div></div>`;
const psych = `<div style="${ROOT}">
  ${watermark}
  ${header({ form: 'FORM NS-PSY-11 · REV. 09/16', docNo: 'NS-PSY-0451', seed: 121, cls: 'CLINICAL — PROTECTED HEALTH INFORMATION' })}
  <div style="padding:0 24px;">
    ${titleRow('PSYCHOLOGICAL EVALUATION', 'MENTAL STATUS EXAMINATION')}
    <div style="margin-top:8px;display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;background:#e6ecf3;border:1px solid ${NAVY};font-size:7px;">
      ${subj('SUBJECT', '<b>OKAFOR, R.</b>')}${subj('EMP. ID', 'NS-F-0212', false, true)}${subj('DATE', '24 MAR')}${subj('CLINICIAN', 'Dr. A. Fenn', true)}
    </div>
    <div${E} style="margin-top:2px;font-size:6px;color:${GRAYB};">ENCOUNTER: Post-incident routine assessment (ref. NS-DES-0451) · Duration 34 min · Location: Medical bay, platform</div>

    ${secHead('1', 'FINDINGS')}
    <div style="border:1px solid ${NAVY};border-top:none;">
      ${mse('APPEARANCE', 'Groomed, fatigued')}
      ${mse('BEHAVIOR', 'Cooperative, mild psychomotor agitation')}
      ${mse('MOOD / AFFECT', '"Fine." — Affect flat, incongruent')}
      ${mse('SPEECH', 'Normal rate, occasional word-finding pause')}
      ${mse('THOUGHT PROCESS', 'Linear, goal-directed')}
      ${mse('THOUGHT CONTENT', 'Denies delusions. Reports intrusive counting behavior since the night of 21 MAR.')}
      ${mse('PERCEPTION', 'Denies hallucination. Reports intermittent pressure, left ear.')}
      ${mse('COGNITION', 'Oriented ×4. Attention intact. Recall 3/3.')}
      ${mse('INSIGHT / JUDGMENT', 'Fair / Fair')}
    </div>

    ${secHead('2', 'RISK ASSESSMENT')}
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:7px;">
      <div style="border:1px solid ${NAVY};padding:4px 6px;"><div style="font-weight:700;font-size:5.6px;letter-spacing:.08em;">SUICIDAL IDEATION</div>${cbox(false)}YES &nbsp;${cbox(true)}NO</div>
      <div style="border:1px solid ${NAVY};padding:4px 6px;"><div style="font-weight:700;font-size:5.6px;letter-spacing:.08em;">HOMICIDAL IDEATION</div>${cbox(false)}YES &nbsp;${cbox(true)}NO</div>
      <div style="border:1px solid ${NAVY};padding:4px 6px;"><div style="font-weight:700;font-size:5.6px;letter-spacing:.08em;">FIT FOR DUTY</div>${cbox(true)}YES &nbsp;${cbox(false)}NO</div>
    </div>

    ${secHead('3', 'RECOMMENDATION')}
    <div${E} style="font-size:7.6px;line-height:1.55;">Continue standard duty. Reassess in two weeks, or sooner if symptoms progress. Subject to report any sleep disturbance to the platform medic.</div>

    ${esign('FENN, A., Ph.D.', 'Clinical Psychologist, Field Division', '24 MAR 16:20 · UTC+1', 'B41E-07C9')}
    <div style="text-align:right;font-size:6px;color:${GRAYB};margin-top:6px;">CONTINUED OVERLEAF — ADDENDUM A (RESTRICTED)</div>
  </div>
  ${footer(131, '1 OF 2', 'Printed 24 MAR 16:31 by FENN, A. · NeuroStat Document Management System v4.2')}
</div>`;

// ---------- psicológica — verso: Adendo A (restrito) ----------
const SC = '1.5fr 0.6fr 1.2fr';
const scRow = (a, b, c, i) => tr(SC, [a, b, c], i, [1]);
const AL = '74px 66px 1fr';
const alRow = (a, b, c, i) => tr(AL, [a, b, c], i, [0, 1]);
const psychBack = `<div style="${ROOT}">
  ${watermark}
  ${contHeader({ form: 'FORM NS-PSY-11 · ADDENDUM A', title: 'ADDENDUM A — RESTRICTED', sub: 'NS-PSY-0451 · SHEET 2 OF 2', docNo: 'NS-PSY-0451', seed: 122, cls: 'CLINICAL — PROTECTED HEALTH INFORMATION' })}
  <div style="padding:0 24px;">
    <div style="margin-top:8px;background:${NAVY};color:#fff;padding:5px 9px;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-family:${COND};font-weight:700;font-size:7.6px;letter-spacing:.14em;">RESTRICTED — CLINICAL AFFAIRS LEVEL 3 AND ABOVE</div>
      <div style="font-size:5.6px;letter-spacing:.06em;color:#9fb3c8;">DO NOT FILE IN SUBJECT RECORD</div>
    </div>

    ${secHead('A1', 'SUBJECT STATEMENT (VERBATIM EXCERPT)')}
    <div style="border-left:2px solid ${NAVY};padding:2px 0 2px 9px;font-size:7.8px;line-height:1.6;font-style:italic;"><div${E}>"It is not a sound. It is a count. When I stop paying attention it does not stop, it goes on without me, and when I look again it is ahead of where I was."</div></div>

    ${secHead('A2', 'STRUCTURED SCREENING')}
    <div style="border:1px solid ${NAVY};font-size:6.9px;">
      ${th(SC, ['INSTRUMENT', 'SCORE', 'INTERPRETATION'])}
      ${scRow('PHQ-9 (depression)', '6', 'Mild', 0)}
      ${scRow('GAD-7 (anxiety)', '4', 'Minimal', 1)}
      ${scRow('ISI (insomnia severity)', '19', 'Clinically severe', 0)}
      ${scRow('NS-C7 (cognitive recurrence)', 'FLAG', 'Recurrence, count pattern', 1)}
    </div>
    <div${E} style="margin-top:4px;font-size:6.4px;color:${GRAYB};font-family:${MONO};">Sleep log, self-reported: 21 MAR 2.5 h · 22 MAR 3.0 h · 23 MAR 1.5 h</div>

    ${secHead('A3', 'CLINICIAN NOTES')}
    <div style="font-size:7.5px;line-height:1.56;">
      <p${E} style="margin:0 0 5px;">Subject counts in sets of seven and reports that the count continues when unattended. Onset coincides with the loss of contact on 21 MAR. Two other personnel from the same watch (${redact('XXXXXXXX')}, ${redact('XXXXXXXX')}) describe the same pattern independently.</p>
      <p${E} style="margin:0 0 5px;">No causal link is asserted. Cohort review requested. The recommendation on sheet 1 is not amended in the record at this time.</p>
      <p${E} style="margin:0;">Addendum withheld from the platform medic under NS-CA-9.</p>
    </div>

    ${secHead('A4', 'ACCESS LOG — THIS ADDENDUM')}
    <div style="border:1px solid ${NAVY};font-size:6.6px;">
      ${th(AL, ['DATE / TIME', 'USER', 'ACTION'])}
      ${alRow('24 MAR 16:48', 'FENN, A.', 'CREATED, SIGNED', 0)}
      ${alRow('24 MAR 17:20', 'HOLT, M.', 'VIEWED', 1)}
      ${alRow('25 MAR 02:10', redact('XXXXXXXX'), 'VIEWED (OFF-HOURS)', 0)}
    </div>
    ${esign('FENN, A., Ph.D.', 'Clinical Psychologist, Field Division', '24 MAR 16:48 · UTC+1', 'B41E-0A13', 9)}
  </div>
  ${footer(132, '2 OF 2', 'Printed 25 MAR 02:14 by SYSADM · NeuroStat Document Management System v4.2')}
</div>`;

// ---------- Exame físico periódico — frente ----------
const vit = (label, val) => `<div style="border-right:1px solid ${NAVY};border-bottom:1px solid ${NAVY};padding:3px 5px;"><div style="font-size:4.6px;letter-spacing:.07em;color:${GRAYB};font-weight:700;">${label}</div><div${E} style="font-size:7.4px;font-family:${MONO};font-weight:700;margin-top:1px;">${val}</div></div>`;
const bodyDiagram = (marks) => `<svg width="100%" viewBox="0 0 412 150" xmlns="http://www.w3.org/2000/svg" style="display:block;">
  <text x="62" y="10" text-anchor="middle" font-family="Roboto Condensed, sans-serif" font-size="6.5" font-weight="700" fill="${NAVY}" letter-spacing="1">ANTERIOR</text>
  <text x="290" y="10" text-anchor="middle" font-family="Roboto Condensed, sans-serif" font-size="6.5" font-weight="700" fill="${NAVY}" letter-spacing="1">POSTERIOR</text>
  <g stroke="${NAVY}" stroke-width="0.9" fill="none">
    <circle cx="62" cy="24" r="9"/>
    <path d="M62 33 L62 78 M40 45 Q62 40 84 45 M62 78 Q44 80 40 118 M62 78 Q80 80 84 118 M40 118 L38 140 M84 118 L86 140"/>
    <path d="M48 44 L44 90 M76 44 L80 90"/>
  </g>
  <g stroke="${NAVY}" stroke-width="0.9" fill="none">
    <circle cx="290" cy="24" r="9"/>
    <path d="M290 33 L290 78 M268 45 Q290 40 312 45 M290 78 Q272 80 268 118 M290 78 Q308 80 312 118 M268 118 L266 140 M312 118 L314 140"/>
    <path d="M276 44 L272 90 M304 44 L308 90"/>
  </g>
  ${marks.map((m, i) => `<circle cx="${m.x}" cy="${m.y}" r="3.4" fill="none" stroke="${ORANGE_NS}" stroke-width="1"/><text x="${m.x + (m.lx || 8)}" y="${m.y + (m.ly || 2)}" font-family="Courier Prime, monospace" font-size="5.2" fill="${ORANGE_NS}" font-weight="700">${i + 1}</text>`).join('')}
</svg>`;
const ORANGE_NS = '#a13a12';
const finding = (n, t) => `<div style="display:flex;gap:5px;margin-bottom:3px;"><div style="font-family:${MONO};font-weight:700;font-size:6.4px;color:${ORANGE_NS};flex-shrink:0;">${n}</div><div${E} style="flex:1;font-size:7px;line-height:1.45;">${t}</div></div>`;
const physical = `<div style="${ROOT}">
  ${watermark}
  ${header({ form: 'FORM NS-MED-02 · REV. 11/19', docNo: 'NS-MED-0578', seed: 141, cls: 'CLINICAL — PROTECTED HEALTH INFORMATION' })}
  <div style="padding:0 24px;">
    ${titleRow('PERIODIC PHYSICAL EXAMINATION', 'ANNUAL — OFFSHORE FITNESS STANDARD')}
    <div style="margin-top:8px;display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;background:#e6ecf3;border:1px solid ${NAVY};font-size:7px;">
      ${subj('SUBJECT', '<b>LINDQVIST, T.</b>')}${subj('EMP. ID', 'NS-F-0344', false, true)}${subj('DATE', '02 APR')}${subj('EXAMINER', 'Dr. R. Achebe', true)}
    </div>
    <div${E} style="margin-top:2px;font-size:6px;color:${GRAYB};">ENCOUNTER: Annual fitness review, also referenced by NS-DES-0451 witness follow-up · Location: Medical bay, platform</div>

    ${secHead('1', 'VITALS')}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid ${NAVY};border-left:1px solid ${NAVY};">
      ${vit('HEART RATE', '58 bpm')}${vit('BLOOD PRESSURE', '118/76')}${vit('TEMP', '36.4 °C')}${vit('RESP. RATE', '13 /min')}
      ${vit('O2 SAT', '98%')}${vit('WEIGHT', '81.4 kg')}${vit('HEIGHT', '179 cm')}${vit('BMI', '25.4')}
    </div>

    ${secHead('2', 'EXAMINATION — SEE NUMBERED FINDINGS')}
    <div style="border:1px solid ${NAVY};padding:6px 8px 4px;background:#fff;">
      ${bodyDiagram([{ x: 55, y: 20, lx: 9, ly: -2 }, { x: 84, y: 95, lx: 8 }, { x: 296, y: 60, lx: -14, ly: -4 }])}
      <div style="margin-top:4px;">
        ${finding('1', 'Bilateral mild conjunctival injection, no discharge. Denies visual disturbance.')}
        ${finding('2', 'Old surgical scar, right forearm (pre-existing, noted 2022).')}
        ${finding('3', 'Tenderness on palpation, left trapezius, no radiation. Reports "the cold feeling doesn\'t go away" in the same spot.')}
      </div>
    </div>

    ${secHead('3', 'SYSTEMS REVIEW')}
    <div style="font-size:7.3px;line-height:1.6;">
      <div${E}><b>Cardiopulmonary:</b> Regular rate and rhythm, lungs clear bilaterally.</div>
      <div${E}><b>Neurological:</b> Cranial nerves II–XII grossly intact. Reports occasional word-finding pause, denies otherwise.</div>
      <div${E}><b>Sleep:</b> Self-reported average 4.1 h/night over last 14 days, below platform minimum (6 h). Referred to Addendum, overleaf.</div>
    </div>

    ${secHead('4', 'FIT FOR DUTY')}
    <div style="font-size:7.4px;line-height:1.6;">${cbox(true)}FIT, NO RESTRICTION &nbsp;&nbsp;${cbox(false)}FIT WITH RESTRICTION &nbsp;&nbsp;${cbox(false)}UNFIT<div${E} style="margin-top:2px;"><b>Restriction:</b> None. Sleep deficiency flagged for follow-up in 14 days per Section 3.</div></div>

    ${esign('ACHEBE, R., M.D.', 'Staff Physician, Field Division', '02 APR 10:15 · UTC+1', '5C11-2F80')}
    <div style="text-align:right;font-size:6px;color:${GRAYB};margin-top:6px;">CONTINUED OVERLEAF — LAB PANEL &amp; IMMUNIZATION RECORD</div>
  </div>
  ${footer(141, '1 OF 2', 'Printed 02 APR 10:22 by ACHEBE, R. · NeuroStat Document Management System v4.2')}
</div>`;

// ---------- Exame físico — verso: painel de laboratório, imunização ----------
const LP = '1.6fr 0.9fr 1fr 1fr';
const lpRow = (a, b, c, d, i) => tr(LP, [a, b, c, d], i, [1]);
const IM = '1.5fr 1fr 1fr';
const imRow = (a, b, c, i) => tr(IM, [a, b, c], i, [1]);
const physicalBack = `<div style="${ROOT}">
  ${watermark}
  ${contHeader({ form: 'FORM NS-MED-02 · REV. 11/19', title: 'PHYSICAL EXAM — LAB &amp; IMMUNIZATION', sub: 'NS-MED-0578 · SHEET 2 OF 2', docNo: 'NS-MED-0578', seed: 142, cls: 'CLINICAL — PROTECTED HEALTH INFORMATION' })}
  <div style="padding:0 24px;">
    ${secHead('5', 'LABORATORY PANEL')}
    <div style="border:1px solid ${NAVY};font-size:6.9px;">
      ${th(LP, ['TEST', 'RESULT', 'REFERENCE', 'FLAG'])}
      ${lpRow('Hemoglobin', '15.1 g/dL', '13.5–17.5', '—')}
      ${lpRow('White cell count', '7.8 ×10⁹/L', '4.5–11.0', '—')}
      ${lpRow('Cortisol (AM)', '27.4 µg/dL', '6.0–18.4', 'HIGH')}
      ${lpRow('TSH', '2.1 mIU/L', '0.4–4.0', '—')}
      ${lpRow('Fasting glucose', '94 mg/dL', '70–99', '—')}
      ${lpRow('Vitamin D', '19 ng/mL', '30–100', 'LOW')}
    </div>
    <div${E} style="margin-top:4px;font-size:6.6px;line-height:1.5;color:${GRAYB};">Cortisol elevation consistent with acute stress response; recheck in 30 days. Vitamin D low, consistent with limited UV exposure offshore — routine, supplement issued.</div>

    ${secHead('6', 'IMMUNIZATION RECORD')}
    <div style="border:1px solid ${NAVY};font-size:6.9px;">
      ${th(IM, ['VACCINE', 'DATE', 'DUE'])}
      ${imRow('Hepatitis A/B', '14 MAR 2023', '2028')}
      ${imRow('Tetanus/Diphtheria', '02 APR 2024', '2034')}
      ${imRow('Influenza (seasonal)', '11 OCT 2025', '2026')}
    </div>

    ${secHead('7', 'CLINICIAN NOTES')}
    <div style="font-size:7.4px;line-height:1.58;">
      <p${E} style="margin:0 0 6px;">Subject is one of three personnel from the 21 MAR night watch now showing a similar combination of elevated cortisol and reduced sleep duration on routine bloodwork, independent of the psychological screening under NS-PSY-11. No shared exposure has been identified. Flagged for cohort review — see memo to Office of Clinical Affairs, 03 APR.</p>
      <p${E} style="margin:0;">Subject described the trapezius tenderness (Section 2, finding 3) as "the same cold spot Rosa has" — Section 3 systems review team includes OKAFOR, R. (NS-F-0212). No physical basis identified for the localized sensation on exam.</p>
    </div>

    <div style="margin-top:9px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:7px;">
      <div style="border:1px solid ${NAVY};padding:4px 7px;"><div style="font-family:${COND};font-weight:700;font-size:5.8px;letter-spacing:.1em;margin-bottom:2px;">8 · NEXT REVIEW</div><div${E}>16 APR — sleep &amp; cortisol recheck</div></div>
      <div style="border:1px solid ${NAVY};padding:4px 7px;"><div style="font-family:${COND};font-weight:700;font-size:5.8px;letter-spacing:.1em;margin-bottom:2px;">9 · COHORT REVIEW</div><div${E}>Requested — Office of Clinical Affairs<br>Status: PENDING</div></div>
    </div>
  </div>
  ${footer(142, '2 OF 2', 'Printed 02 APR 10:22 by ACHEBE, R. · NeuroStat Document Management System v4.2')}
</div>`;

// ---------- Aviso de desligamento — frente (carta, não formulário) ----------
const letterHeader = (docNo, seed) => `<div style="position:relative;padding:20px 30px 0;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="width:30px;height:24px;overflow:hidden;position:relative;flex-shrink:0;"><img src="${img(B.nsMark)}" alt="NeuroStat" style="position:absolute;width:99px;height:auto;left:-35px;top:-15px;"></div>
      <div style="font-family:${COND};font-weight:700;font-size:11px;letter-spacing:.28em;color:${NAVY};">NEUROSTAT</div>
    </div>
    <div style="text-align:right;font-size:5.4px;color:${GRAYB};line-height:1.6;"><div${E}>DOC NO. ${docNo}</div><div>OFFICE OF HUMAN RESOURCES</div></div>
  </div>
  <div style="margin-top:10px;height:1.2px;background:${NAVY};"></div>
</div>`;
const termination = `<div style="${ROOT}">
  ${letterHeader('NS-HR-0891', 161)}
  <div style="padding:18px 30px 0;font-size:8px;line-height:1.65;color:#17202b;">
    <div${E} style="margin-bottom:14px;">02 APR</div>
    <div${E} style="margin-bottom:3px;">LINDQVIST, T.<br>Employee No. NS-F-0344<br>Comms Technician, Field Division</div>
    <div${E} style="margin:14px 0;font-weight:700;">RE: TERMINATION OF EMPLOYMENT — EFFECTIVE IMMEDIATELY</div>
    <p${E} style="margin:0 0 10px;">This letter confirms that your employment with NeuroStat Org, Field Division, is terminated effective 02 APR, in accordance with Section 4.2 of your employment agreement (breach of information security policy, ref. incident NS-DES-0451/B). This decision is final and not subject to internal appeal.</p>
    <p${E} style="margin:0 0 10px;">You are relieved of all platform duties as of the time of this letter. A checklist of exit requirements is enclosed overleaf; failure to complete it by the date shown may affect your final payment and your eligibility for transfer to NeuroStat Org or its affiliates.</p>
    <p${E} style="margin:0 0 10px;">Your confidentiality obligations under Section 9 of your employment agreement continue in force without time limit. This includes all matters relating to Field Division operations, whether or not marked confidential at the time.</p>
    <p${E} style="margin:0 0 10px;">Transport off the platform has been arranged for the next scheduled crew rotation. Until departure, access to the Field Division network and to Terminal Room 3 is suspended.</p>
    <p${E} style="margin:0;">Questions regarding this letter should be directed to the Office of Human Resources, not to your former supervisor.</p>
  </div>
  <div style="padding:0 30px;margin-top:22px;font-size:8px;line-height:1.6;">
    <div${E}>NeuroStat Org — Office of Human Resources</div>
    <div${E} style="margin-top:2px;color:${GRAYB};font-family:${MONO};font-size:6.4px;">Authorised electronically — no signature required per NS-HR policy 2.1</div>
  </div>
  ${footer(161, '1 OF 2', 'Printed 02 APR 11:40 by SYSTEM (HR) · NeuroStat Document Management System v4.2')}
</div>`;

// ---------- desligamento — verso: checklist de saída ----------
const exitItem = (label, due) => `<div style="display:grid;grid-template-columns:16px 1fr 60px;border-top:1px solid #c7d0dc;font-size:7.2px;align-items:center;"><div style="padding:4px 5px;">${cbox(false)}</div><div style="padding:4px 5px;"><div${E}>${label}</div></div><div style="padding:4px 5px;font-family:${MONO};color:${GRAYB};"><div${E}>${due}</div></div></div>`;
const terminationBack = `<div style="${ROOT}">
  ${contHeader({ form: 'FORM NS-HR-09 · REV. 02/21', title: 'EXIT REQUIREMENTS', sub: 'NS-HR-0891 · SHEET 2 OF 2', docNo: 'NS-HR-0891', seed: 162 })}
  <div style="padding:0 24px;">
    <div${E} style="margin-top:9px;font-size:7.2px;line-height:1.5;color:#17202b;">All items below must be completed before departure from the platform. Unreturned equipment is deducted from final payment at replacement cost.</div>

    ${secHead('A', 'RETURN OF COMPANY PROPERTY')}
    <div style="border:1px solid ${NAVY};">
      <div style="display:grid;grid-template-columns:16px 1fr 60px;background:${NAVY};color:#fff;font-family:${COND};font-weight:700;font-size:5.6px;letter-spacing:.1em;"><div style="padding:3px 5px;"></div><div style="padding:3px 5px;">ITEM</div><div style="padding:3px 5px;">DUE</div></div>
      ${exitItem('Access badge (ØA-CID series)', '02 APR')}
      ${exitItem('Field terminal + charger, asset tag NS-T-1140', '02 APR')}
      ${exitItem('Comms headset, unit-assigned', '02 APR')}
      ${exitItem('Platform PPE (issued, non-personal items)', '02 APR')}
      ${exitItem('Any physical or digital copies of NS-DES-0451 materials', '02 APR')}
    </div>

    ${secHead('B', 'ADMINISTRATIVE')}
    <div style="font-size:7.2px;line-height:1.75;">${cbox(false)}Exit interview completed<br>${cbox(false)}Forwarding address on file<br>${cbox(false)}Final pay statement acknowledged<br>${cbox(false)}Confidentiality reminder (Section 9) acknowledged, signed</div>

    ${secHead('C', 'CONTACTS')}
    <div style="border:1px solid ${NAVY};font-size:7px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;"><div style="padding:4px 7px;border-right:1px solid #c7d0dc;border-bottom:1px solid #c7d0dc;font-weight:700;">HUMAN RESOURCES</div><div style="padding:4px 7px;border-bottom:1px solid #c7d0dc;"><div${E} style="font-family:${MONO};">ext. 4600</div></div>
      <div style="padding:4px 7px;border-right:1px solid #c7d0dc;font-weight:700;">PAYROLL</div><div style="padding:4px 7px;"><div${E} style="font-family:${MONO};">ext. 4610</div></div></div>
    </div>

    <div style="margin-top:10px;border:1px solid ${NAVY};padding:5px 8px;font-size:6.6px;line-height:1.55;color:${GRAYB};"><div${E}>Do not contact your former supervisor or team regarding this checklist. Direct all questions to Human Resources.</div></div>
  </div>
  ${footer(162, '2 OF 2', 'Printed 02 APR 11:40 by SYSTEM (HR) · NeuroStat Document Management System v4.2')}
</div>`;

// ---------- Transcrição de entrevista — frente ----------
const XS = '30px 44px 1fr';
const speakerLine = (t, who, txt, i, sysNote) => `<div style="display:grid;grid-template-columns:${XS};gap:4px;padding:3px 0;${i % 2 ? 'background:#f2f5f9;' : ''}${sysNote ? 'font-style:italic;' : ''}">
  <div${E} style="font-family:${MONO};font-size:6px;color:${GRAYB};padding-left:6px;">${t}</div>
  <div${E} style="font-family:${COND};font-weight:700;font-size:6.6px;color:${NAVY};">${who}</div>
  <div${E} style="font-size:7.2px;line-height:1.45;padding-right:6px;">${txt}</div>
</div>`;
const transcript = `<div style="${ROOT}">
  ${watermark}
  ${header({ form: 'FORM NS-CL-03 · REV. 07/20', docNo: 'NS-INT-0452', seed: 171, cls: 'CLINICAL — PROTECTED HEALTH INFORMATION' })}
  <div style="padding:0 24px;">
    ${titleRow('INTERVIEW TRANSCRIPT', 'FOLLOW-UP — COGNITIVE RECURRENCE COHORT')}
    ${grid('1fr 1fr 1fr 1fr',
  cell('SUBJECT', 'OKAFOR, R.', { mono: false }) + cell('INTERVIEWER', 'Dr. A. Fenn') + cell('DATE', '26 MAR', { mono: true }) + cell('DURATION', '22 min', { mono: true }) +
  cell('LOCATION', 'Medical bay, platform', { span: 2 }) + cell('RECORDING', 'NS-INT-0452/AUD', { mono: true, span: 2 }))}

    ${secHead('', 'TRANSCRIPT')}
    <div style="border:1px solid ${NAVY};">
      <div style="display:grid;grid-template-columns:${XS};background:${NAVY};color:#fff;font-family:${COND};font-weight:700;font-size:5.4px;letter-spacing:.1em;"><div style="padding:3px 6px;">TIME</div><div style="padding:3px 6px;">SPEAKER</div><div style="padding:3px 6px;">TEXT</div></div>
      ${speakerLine('00:00', 'FENN', 'Recording started. Can you tell me, in your own words, what you notice.', 0)}
      ${speakerLine('00:11', 'OKAFOR', 'It\'s not all the time. Mostly at night, when it\'s quiet. I count things without meaning to — steps, tiles, whatever\'s in front of me.', 1)}
      ${speakerLine('00:34', 'FENN', 'Does it stop when you ask it to?', 0)}
      ${speakerLine('00:38', 'OKAFOR', 'Usually. Not always. Sometimes I catch myself already at a high number and I don\'t remember starting.', 1)}
      ${speakerLine('00:51', 'FENN', 'When did you first notice this?', 0)}
      ${speakerLine('00:54', 'OKAFOR', 'The night comms went down. 21st. I was on channel two the whole time it happened.', 1)}
      ${speakerLine('01:10', 'FENN', 'Was there anything on the channel before contact was lost — anything you can describe?', 0)}
      ${speakerLine('01:16', 'OKAFOR', "[pause] It wasn't static. It had a rhythm. I didn't think about it as counting until after. Now I think that's what it was doing the whole time.", 1, true)}
      ${speakerLine('01:41', 'FENN', 'Have you told anyone else this, specifically the rhythm detail?', 0)}
      ${speakerLine('01:45', 'OKAFOR', 'Lindqvist. He said the cold spot on his shoulder does the same thing, moves in time.', 1)}
    </div>
    <div style="text-align:right;font-size:6px;color:${GRAYB};margin-top:6px;">CONTINUED OVERLEAF</div>
  </div>
  ${footer(171, '1 OF 2', 'Printed 26 MAR 09:40 by FENN, A. · NeuroStat Document Management System v4.2')}
</div>`;

// ---------- transcrição — verso: continuação, certificação ----------
const transcriptBack = `<div style="${ROOT}">
  ${watermark}
  ${contHeader({ form: 'FORM NS-CL-03 · REV. 07/20', title: 'INTERVIEW TRANSCRIPT — CONTINUED', sub: 'NS-INT-0452 · SHEET 2 OF 2', docNo: 'NS-INT-0452', seed: 172, cls: 'CLINICAL — PROTECTED HEALTH INFORMATION' })}
  <div style="padding:0 24px;">
    <div style="border:1px solid ${NAVY};margin-top:9px;">
      ${speakerLine('02:03', 'FENN', 'I want to try something. Count backward from ten for me, out loud.', 0)}
      ${speakerLine('02:08', 'OKAFOR', 'Ten, nine, eight, seven —', 1)}
      ${speakerLine('02:11', 'OKAFOR', '[subject stops unprompted, 6-second pause]', 1, true)}
      ${speakerLine('02:17', 'FENN', 'Are you all right? You stopped at seven.', 0)}
      ${speakerLine('02:20', 'OKAFOR', 'Something else was already past it. I was still on seven and it wasn\'t.', 1)}
      ${speakerLine('02:34', 'FENN', 'We\'ll stop there for today. You did well.', 0)}
      ${speakerLine('02:38', 'OKAFOR', 'Is Lindqvist doing one of these too?', 1)}
      ${speakerLine('02:41', 'FENN', '[non-responsive, redirected] Let\'s focus on your own follow-up for now.', 0, true)}
    </div>

    ${secHead('', "INTERVIEWER'S NOTE")}
    <div style="font-size:7.4px;line-height:1.56;">
      <p${E} style="margin:0 0 6px;">Subject terminated a simple backward count unprompted at 02:11, describing the sensation as something "already past" the number in progress. This matches the pattern in NS-PSY-0451 Addendum A (recurrence continuing "without" the subject). Recommend NS-C7 screening be added to this subject's chart; not administered to date.</p>
      <p${E} style="margin:0;">Subject volunteered Lindqvist's name unprompted, twice. Lindqvist has not yet been formally interviewed under this protocol — see NS-MED-0578 (periodic exam, same date range) for an independent corroborating note from a different clinician.</p>
    </div>

    ${secHead('', 'CERTIFICATION')}
    <div style="border:1px solid ${NAVY};font-size:6.6px;line-height:1.6;padding:6px 8px;"><div${E}>I certify that this transcript is a true and complete record of the recording referenced above, prepared from the audio file NS-INT-0452/AUD.</div></div>
    ${esign('FENN, A., Ph.D.', 'Clinical Psychologist, Field Division', '26 MAR 14:05 · UTC+1', 'B41E-1C24', 9)}
  </div>
  ${footer(172, '2 OF 2', 'Printed 26 MAR 14:10 by FENN, A. · NeuroStat Document Management System v4.2')}
</div>`;

// ---------- Diagrama de instalação / rede — frente (planta técnica, não formulário) ----------
const BP_BG = '#0f2942', BP_LINE = '#bcd4e8', BP_ACC = '#6fa8d8';
const bpRoom = (x, y, w, h, label, sub) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${BP_LINE}" stroke-width="0.9"/>
  <text x="${x + w / 2}" y="${y + h / 2 - 2}" text-anchor="middle" font-family="Roboto Condensed, sans-serif" font-size="7" font-weight="700" fill="${BP_LINE}" letter-spacing=".5">${label}</text>
  ${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 7}" text-anchor="middle" font-family="Courier Prime, monospace" font-size="5" fill="${BP_ACC}">${sub}</text>` : ''}`;
const bpLink = (x1, y1, x2, y2, dashed) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${BP_ACC}" stroke-width="1.1" ${dashed ? 'stroke-dasharray="3 2"' : ''}/>`;
const bpNode = (x, y, id) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${BP_BG}" stroke="${BP_ACC}" stroke-width="1"/><text x="${x}" y="${y + 1.8}" text-anchor="middle" font-family="Courier Prime, monospace" font-size="4.2" fill="${BP_ACC}">${id}</text>`;
const blueprint = `<div style="width:460px;height:650px;box-sizing:border-box;position:relative;overflow:hidden;background:${BP_BG};font-family:'Source Sans 3',Arial,sans-serif;color:${BP_LINE};">
  <div style="position:absolute;inset:0;opacity:.35;background-image:linear-gradient(${BP_ACC}22 1px,transparent 1px),linear-gradient(90deg,${BP_ACC}22 1px,transparent 1px);background-size:20px 20px;"></div>
  <div style="position:absolute;left:16px;top:14px;display:flex;align-items:center;gap:7px;">
    <div style="width:26px;height:21px;overflow:hidden;position:relative;filter:invert(1) brightness(2);opacity:.85;"><img src="${img(B.nsMark)}" alt="NeuroStat" style="position:absolute;width:86px;height:auto;left:-30px;top:-13px;"></div>
    <div style="font-family:${COND};font-weight:700;font-size:9px;letter-spacing:.24em;">NEUROSTAT</div>
  </div>
  <div${E} style="position:absolute;right:16px;top:16px;text-align:right;font-size:5.4px;letter-spacing:.08em;color:${BP_ACC};">FIELD DIVISION — FACILITIES ENGINEERING</div>

  <div${E} style="position:absolute;left:16px;top:38px;font-family:${COND};font-weight:700;font-size:13px;letter-spacing:.06em;">NETWORK TOPOLOGY — SUBLEVEL / TOPSIDE</div>
  <div${E} style="position:absolute;left:16px;top:52px;font-size:5.6px;letter-spacing:.06em;color:${BP_ACC};">CLOSED NETWORK, FIELD DIVISION PLATFORM — NOT FOR DISTRIBUTION OUTSIDE FACILITIES ENGINEERING</div>

  <svg width="428" height="330" viewBox="0 0 428 330" xmlns="http://www.w3.org/2000/svg" style="position:absolute;left:16px;top:66px;">
    ${bpLink(90, 55, 90, 140)}${bpLink(90, 140, 40, 200)}${bpLink(90, 140, 160, 200)}${bpLink(160, 200, 160, 260)}
    ${bpLink(260, 55, 260, 140, true)}${bpLink(260, 140, 340, 200)}${bpLink(340, 200, 340, 260, true)}
    ${bpLink(90, 140, 260, 140)}
    ${bpRoom(50, 20, 80, 45, 'CONTROL RM', 'SW-01')}
    ${bpRoom(220, 20, 80, 45, 'COMMS RELAY', 'SW-02')}
    ${bpNode(90, 140, 'CORE')}
    ${bpRoom(0, 175, 80, 50, 'DIVE SUPPORT', 'TERM 02–04')}
    ${bpRoom(120, 175, 80, 50, 'TERMINAL RM 3', 'TERM 09–12')}
    ${bpRoom(300, 175, 80, 50, 'MOONPOOL CTRL', 'TERM 14')}
    ${bpRoom(120, 245, 80, 45, 'MEDICAL BAY', 'TERM 07')}
    ${bpRoom(300, 245, 80, 45, 'CRANE PEDESTAL', 'RELAY ONLY')}
    <text x="214" y="305" text-anchor="middle" font-family="Courier Prime, monospace" font-size="5" fill="${BP_ACC}">DASHED = BACKUP / LOW-BANDWIDTH LINK</text>
  </svg>

  <div style="position:absolute;left:16px;top:410px;right:16px;border-top:1px solid ${BP_ACC};padding-top:6px;">
    <div style="font-family:${COND};font-weight:700;font-size:6px;letter-spacing:.1em;margin-bottom:3px;">LEGEND</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;font-size:6px;">
      <div>▭ Node / equipment room</div><div>— Primary fibre run</div>
      <div>◯ Core switch</div><div>┄ Backup / low-bandwidth link</div>
    </div>
  </div>

  <div${E} style="position:absolute;left:16px;top:470px;right:16px;font-size:6.6px;line-height:1.6;color:${BP_LINE};">Terminal Room 3 (TERM 09–12) carries the highest concentration of after-hours sessions of any node on this topology — see NS-DES-0451 Annex. Crane Pedestal is relay-only; no user terminal is present at that location.</div>

  <div style="position:absolute;left:16px;right:16px;bottom:16px;border:1px solid ${BP_ACC};display:grid;grid-template-columns:1fr 1fr 1fr 1fr;font-size:5.6px;">
    <div style="padding:4px 6px;border-right:1px solid ${BP_ACC};"><div style="color:${BP_ACC};">DRAWN</div><div${E}>K. VANCE</div></div>
    <div style="padding:4px 6px;border-right:1px solid ${BP_ACC};"><div style="color:${BP_ACC};">CHECKED</div><div${E}>—</div></div>
    <div style="padding:4px 6px;border-right:1px solid ${BP_ACC};"><div style="color:${BP_ACC};">SCALE</div><div${E}>NTS</div></div>
    <div style="padding:4px 6px;"><div style="color:${BP_ACC};">DWG NO. / REV</div><div${E}>NS-FE-0212 / A</div></div>
  </div>
</div>`;

// ---------- diagrama — verso: relação de equipamentos, revisões ----------
const EQ = '44px 1.3fr 1fr 1fr';
const eqRow = (a, b, c, d, i) => tr(EQ, [a, b, c, d], i, [0]);
const diagramBack = `<div style="${ROOT}">
  ${contHeader({ form: 'FORM NS-FE-08 · REV. 01/22', title: 'EQUIPMENT SCHEDULE', sub: 'NS-FE-0212 · SHEET 2 OF 2', docNo: 'NS-FE-0212', seed: 182 })}
  <div style="padding:0 24px;">
    ${secHead('', 'EQUIPMENT SCHEDULE — REFERENCE NS-FE-0212')}
    <div style="border:1px solid ${NAVY};font-size:6.6px;">
      ${th(EQ, ['NODE', 'LOCATION', 'MODEL', 'IP RANGE'])}
      ${eqRow('SW-01', 'Control Room — core switch', 'Juniper EX-4400', '10.4.0.1/24')}
      ${eqRow('SW-02', 'Comms Relay — edge switch', 'Juniper EX-2300', '10.4.1.1/24')}
      ${eqRow('TERM 02–04', 'Dive Support', 'NS field terminal', '10.4.2.10–14')}
      ${eqRow('TERM 07', 'Medical Bay', 'NS field terminal', '10.4.2.30')}
      ${eqRow('TERM 09–12', 'Terminal Room 3', 'NS field terminal', '10.4.2.40–44')}
      ${eqRow('TERM 14', 'Moonpool Control', 'NS field terminal, hardened', '10.4.2.60')}
      ${eqRow('RELAY', 'Crane Pedestal', 'Fibre repeater, unmanned', '—')}
    </div>
    <div${E} style="margin-top:5px;font-size:6.4px;line-height:1.5;color:${GRAYB};">Crane Pedestal relay has no address and no login — equipment schedule lists it only because it appears in the physical fibre run.</div>

    ${secHead('', 'REVISION HISTORY')}
    <div style="border:1px solid ${NAVY};font-size:6.6px;">
      ${th('22px 1fr 60px 70px', ['REV', 'DESCRIPTION', 'DATE', 'BY'])}
      ${tr('22px 1fr 60px 70px', ['—', 'Original issue', '14 JAN 2022', 'K. VANCE'], 0)}
      ${tr('22px 1fr 60px 70px', ['A', 'Added Terminal Room 3 sub-nodes 11–12', '19 MAR', 'K. VANCE'], 1)}
    </div>

    ${secHead('', 'NOTES')}
    <div style="font-size:7.2px;line-height:1.6;"><div${E}>1. All field terminals authenticate against SW-01. No terminal on this topology is reachable from outside the closed network.</div><div${E} style="margin-top:4px;">2. Backup link (Comms Relay → Moonpool Control) is rated for telemetry only, not voice or file transfer.</div></div>
  </div>
  ${footer(182, '2 OF 2', 'Printed 19 MAR 08:10 by VANCE, K. · NeuroStat Document Management System v4.2')}
</div>`;

const out = (name, title, body, meta) => {
  fs.writeFileSync(path.join(OUT, name), docFile({ title, fonts: FONTS, body }));
  register(Object.assign({ file: name, family: 'neurostat' }, meta));
};
out('NeuroStat.dc.html', 'NeuroStat — Relatório', report, { doc: 'ns_incident', side: 'front', label: 'Relatório de incidente' });
out('NeuroStat_back.dc.html', 'NeuroStat — Relatório (verso)', reportBack, { doc: 'ns_incident', side: 'back', label: 'Relatório de incidente' });
out('NeuroStat2.dc.html', 'NeuroStat — Requisição de equipamento', requisition, { doc: 'ns_requisition', side: 'front', label: 'Requisição de equipamento' });
out('NeuroStat2_back.dc.html', 'NeuroStat — Requisição (verso)', requisitionBack, { doc: 'ns_requisition', side: 'back', label: 'Requisição de equipamento' });
out('NeuroStat3.dc.html', 'NeuroStat — Registro de mensagens seguras', messaging, { doc: 'ns_messaging', side: 'front', label: 'Registro de mensagens seguras' });
out('NeuroStat4.dc.html', 'NeuroStat — Avaliação psicológica', psych, { doc: 'ns_psych', side: 'front', label: 'Avaliação psicológica' });
out('NeuroStat4_back.dc.html', 'NeuroStat — Avaliação psicológica (Adendo A)', psychBack, { doc: 'ns_psych', side: 'back', label: 'Avaliação psicológica' });
out('NeuroStat5.dc.html', 'NeuroStat — Exame físico periódico', physical, { doc: 'ns_physical', side: 'front', label: 'Exame físico periódico' });
out('NeuroStat5_back.dc.html', 'NeuroStat — Exame físico (verso)', physicalBack, { doc: 'ns_physical', side: 'back', label: 'Exame físico periódico' });
out('NeuroStat6.dc.html', 'NeuroStat — Aviso de desligamento', termination, { doc: 'ns_termination', side: 'front', label: 'Aviso de desligamento' });
out('NeuroStat6_back.dc.html', 'NeuroStat — Desligamento (checklist)', terminationBack, { doc: 'ns_termination', side: 'back', label: 'Aviso de desligamento' });
out('NeuroStat7.dc.html', 'NeuroStat — Transcrição de entrevista', transcript, { doc: 'ns_transcript', side: 'front', label: 'Transcrição de entrevista' });
out('NeuroStat7_back.dc.html', 'NeuroStat — Transcrição (continuação)', transcriptBack, { doc: 'ns_transcript', side: 'back', label: 'Transcrição de entrevista' });
out('NeuroStat8.dc.html', 'NeuroStat — Diagrama de rede', blueprint, { doc: 'ns_diagram', side: 'front', label: 'Diagrama de instalação/rede' });
out('NeuroStat8_back.dc.html', 'NeuroStat — Diagrama (equipamentos)', diagramBack, { doc: 'ns_diagram', side: 'back', label: 'Diagrama de instalação/rede' });
console.log('neurostat ok');
