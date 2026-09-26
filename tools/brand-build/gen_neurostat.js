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
console.log('neurostat ok');
