const fs = require('fs');
const path = require('path');
const L = require('./gen_lib');
const { B, img, docFile, agedBackground, coffee, grainDef, speckDef, register, E, O } = L;
const OUT = path.join(__dirname, 'out');
require('fs').mkdirSync(OUT, { recursive: true });

const FONTS = 'family=Courier+Prime:wght@400;700&family=Special+Elite&family=Caveat:wght@500;600&family=Reenie+Beanie';
const INK = '#1b1a17';
const BLUEPEN = '#22357f';
const REDSTAMP = '#8a2222';
const TYPE = "'Courier Prime',monospace";
const ELITE = "'Special Elite','Courier Prime',monospace";

// Camadas comuns de "envelhecimento físico + fotocópia" (mirror = verso: borda de toner e mancha invertidas)
function paperLayers(id, seed, { fox = 9, coffeeAt = null, folds = [], copier = true, mirror = false } = {}) {
  const top = [];
  if (coffeeAt) top.push(coffee(mirror ? 100 - coffeeAt[0] : coffeeAt[0], coffeeAt[1], coffeeAt[2] || 22, coffeeAt[3] || 20));
  const bg = agedBackground(seed, { fox, layersTop: top, folds });
  let s = `<div style="position:absolute;inset:0;background:${bg};"></div>
  <div style="position:absolute;inset:0;filter:url(#${id}g);opacity:.38;mix-blend-mode:multiply;pointer-events:none;"></div>
  <div style="position:absolute;inset:0;filter:url(#${id}s);opacity:.5;pointer-events:none;"></div>`;
  if (copier) {
    const side = mirror ? '270deg' : '90deg';
    s += `<div style="position:absolute;inset:0;pointer-events:none;background:
      linear-gradient(${side}, rgba(18,14,6,0.42) 0, rgba(18,14,6,0.10) 1.1%, transparent 2.6%),
      linear-gradient(0deg, rgba(18,14,6,0.36) 0, rgba(18,14,6,0.08) 0.9%, transparent 2.2%),
      linear-gradient(90deg, transparent 0 63.1%, rgba(20,15,8,0.06) 63.1% 63.5%, transparent 63.5%);"></div>`;
  }
  return s;
}
const defs = (id, seed, thr) => grainDef(id + 'g', seed) + speckDef(id + 's', seed + 3, thr);
const ROOT = `width:460px;height:650px;box-sizing:border-box;position:relative;overflow:hidden;font-family:${TYPE};color:${INK};background:#e9e2cb;`;

// fantasma espelhado da outra face (não editável — sem marcadores)
const strip = (h) => h.replace(/ data-e\b/g, '').replace(/ data-hand\b/g, '').replace(/ data-notext\b/g, '').replace(/ data-obj="[a-z]+"/g, '').replace(/ data-r\b/g, '');
const ghost = (html, top = 0) => `<div style="position:absolute;left:0;right:0;top:${top}px;bottom:0;transform:scaleX(-1);opacity:.075;filter:blur(.45px);mix-blend-mode:multiply;pointer-events:none;">${strip(html)}</div>`;

const hand = (txt, x, y, o = {}) => `<div${E} data-hand style="position:absolute;left:${x}px;top:${y}px;font-family:'${o.font || 'Caveat'}',cursive;font-weight:${o.w || 600};font-size:${o.size || 13}px;line-height:1.05;color:${o.color || BLUEPEN};transform:rotate(${o.rot ?? -3}deg);white-space:${o.wrap ? 'normal' : 'nowrap'};${o.width ? 'width:' + o.width + 'px;' : ''}opacity:.92;">${txt}</div>`;

const faxLine = (txt) => `<div${E} style="position:absolute;left:24px;right:24px;top:9px;font-size:5.6px;letter-spacing:.06em;color:#3c382f;white-space:nowrap;overflow:hidden;">${txt}</div>`;
const stamp = (txt, x, y, rot = -7, color = REDSTAMP, size = 9) => `<div${O('stamp')} style="position:absolute;left:${x}px;top:${y}px;border:2px solid ${color};color:${color};font-family:${ELITE};font-size:${size}px;letter-spacing:.08em;padding:3px 9px;transform:rotate(${rot}deg);opacity:.82;text-align:center;line-height:1.35;mix-blend-mode:multiply;">${txt}</div>`;
const redact = (w) => `<span data-r style="background:${INK};color:${INK};padding:0 2px;">${w}</span>`;
const cboxD = (checked) => `<span style="display:inline-block;position:relative;width:7px;height:7px;border:1.2px solid ${INK};margin-right:4px;vertical-align:-1px;">${checked ? `<svg width="10" height="10" viewBox="0 0 10 10" style="position:absolute;left:-1.6px;top:-2px;"><path d="M1.2 1.6 L8.6 8.4 M8.4 1.2 L1.4 8.6" stroke="${BLUEPEN}" stroke-width="1.3" stroke-linecap="round" fill="none"/></svg>` : ''}</span>`;

// ---------- DRE: memorando datilografado (cópia) — frente ----------
const memoBody = `<div style="position:absolute;left:32px;right:32px;top:26px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="width:158px;height:62px;"></div>
        <div style="text-align:right;font-size:6.4px;line-height:1.7;letter-spacing:.04em;padding-top:2px;">
          <div>OFFICE OF SUBLEVEL OPERATIONS</div><div${E}>CONTROL NO. <b>SL-10-0117</b></div><div${E}>COPY 2 OF 3</div>
        </div>
      </div>
      <div style="height:1.5px;background:${INK};opacity:.7;margin-top:9px;"></div>
      <div style="text-align:center;font-family:${ELITE};font-size:13px;letter-spacing:.42em;margin:10px 0 9px .42em;">MEMORANDUM</div>
      <div style="font-size:8.6px;line-height:1.75;display:grid;grid-template-columns:104px 1fr;">
        <div>MEMORANDUM FOR:</div><div${E}>Director, Sublevel Command</div>
        <div>FROM:</div><div${E}>Systems Administration</div>
        <div>SUBJECT:</div><div${E} style="font-weight:700;">Network Integrity — Weekly Check</div>
        <div>DATE:</div><div><span style="display:inline-block;width:64px;height:8px;background:${INK};opacity:.5;border-radius:2px;vertical-align:-1px;"></span></div>
      </div>
      <div style="height:1px;background:${INK};opacity:.6;margin:8px 0 10px;"></div>
      <div style="font-size:8.6px;line-height:1.72;">
        <p${E} style="margin:0 0 9px;">1. &nbsp;Closed-network diagnostics were completed without incident. All terminal nodes are reporting nominal.</p>
        <p${E} style="margin:0 0 9px;">2. &nbsp;Personnel are reminded that access to Sublevel materials remains restricted to cleared staff. Ongoing work is not to be discussed outside the secure channel, including with affiliated contractors on site.</p>
        <p${E} style="margin:0 0 9px;">3. &nbsp;The weekly check window has been moved to 02:00 to reduce load on the closed network during shift change. No action is required by receiving offices.</p>
        <p${E} style="margin:0 0 9px;">4. &nbsp;Next check scheduled per standard rotation.</p>
      </div>
      <div style="margin-top:14px;font-size:8.6px;line-height:1.5;">
        <div${E}>Systems Administration</div>
        <div${E} style="font-size:7px;">Sublevel Core, Terminal Room 3</div>
      </div>
      <div${E} style="margin-top:12px;font-size:6.6px;line-height:1.6;">
        DISTRIBUTION: &nbsp;Director, Sublevel Command · Deputy Director (Ops) · File
      </div>
    </div>
    ${hand('R.K.', 300, 448, { font: 'Reenie Beanie', size: 20, color: '#1a1a1a', rot: -6 })}
    ${hand('rec\'d 3/14 — R.K.', 296, 476, { size: 12 })}
    ${stamp('FILED<br><span style="font-size:6.5px;letter-spacing:.14em;">NO ACTION REQUIRED</span>', 292, 500, -8, '#3b3a35')}`;
const memo = `<div style="${ROOT}">
  ${paperLayers('m', 201, { fox: 8, coffeeAt: [80, 78, 24, 22], folds: [33, 66] })}
  ${faxLine('MAR-14-2010 02:17     FROM: DRE SUBLEVEL 03     TO: DRE SUBLEVEL 01     P.01')}
  <img${O('logo')} src="${img(B.dre)}" alt="DRE — Division of Reality Engineering" style="position:absolute;left:32px;top:26px;width:158px;mix-blend-mode:multiply;opacity:.85;filter:grayscale(1) contrast(1.15);transform:rotate(-.3deg);">
  <div style="position:absolute;inset:0;transform:rotate(-.3deg);transform-origin:50% 40%;">${memoBody}</div>
  <div style="position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:5.6px;letter-spacing:.14em;color:#4a453a;">DRE — INTERNAL — NOT FOR EXTERNAL DISTRIBUTION</div>
</div>`;

// ---------- memorando — verso: ficha de tramitação (FORM DRE-12), com fantasma da frente ----------
const rt = (to, date, ini, rem, h) => `<div style="display:grid;grid-template-columns:118px 46px 44px 1fr;border-top:1px solid rgba(27,26,23,.4);min-height:${h || 21}px;font-size:7.6px;align-items:center;">
  <div style="padding:3px 6px;">${to ? `<div${E}>${to}</div>` : ''}</div><div style="padding:3px 6px;">${date ? `<div${E}>${date}</div>` : ''}</div><div style="padding:3px 6px;">${ini}</div><div style="padding:3px 6px;">${rem}</div></div>`;
const memoBackContent = `<div style="position:absolute;left:32px;right:32px;top:30px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          <div style="font-family:${ELITE};font-size:13px;letter-spacing:.2em;">ROUTING SLIP</div>
          <div style="font-size:6.4px;letter-spacing:.09em;margin-top:3px;">DIVISION OF REALITY ENGINEERING — OFFICE OF SUBLEVEL OPERATIONS</div>
        </div>
        <div style="text-align:right;font-size:6.2px;line-height:1.6;letter-spacing:.05em;"><div>FORM DRE-12 (REV. 9-91)</div><div${E}>CONTROL NO. <b>SL-10-0117</b></div></div>
      </div>
      <div style="height:1.5px;background:${INK};opacity:.7;margin:8px 0 8px;"></div>
      <div style="font-size:8px;line-height:1.7;display:grid;grid-template-columns:52px 1fr;">
        <div>RE:</div><div${E} style="font-weight:700;">Network Integrity — Weekly Check</div>
        <div>ORIGIN:</div><div${E}>Systems Administration, Sublevel Core</div>
      </div>
      <div style="margin-top:10px;border:1.2px solid ${INK};">
        <div style="display:grid;grid-template-columns:118px 46px 44px 1fr;font-weight:700;font-size:6px;letter-spacing:.08em;border-bottom:1.2px solid ${INK};"><div style="padding:3px 6px;">TO</div><div style="padding:3px 6px;">DATE</div><div style="padding:3px 6px;">INIT.</div><div style="padding:3px 6px;">REMARKS</div></div>
        ${rt('Director, Sublevel Command', '03/14', '<span style="font-family:\'Reenie Beanie\',cursive;font-size:17px;color:#1a1a1a;">R.K.</span>', '<div' + E + ' data-hand style="font-family:\'Caveat\',cursive;font-weight:600;font-size:12px;color:' + BLUEPEN + ';line-height:1.05;">noted</div>')}
        ${rt('Deputy Director (Ops)', '03/15', '', '', 21)}
        ${rt('Systems Administration', '', '', '', 21)}
        ${rt('File', '', '', '', 21)}
      </div>
      <div style="margin-top:12px;font-size:7.4px;line-height:1.9;">
        <div style="font-size:6px;letter-spacing:.1em;font-weight:700;">ACTION REQUESTED</div>
        <div>${cboxD(false)}FOR APPROVAL &nbsp;&nbsp;${cboxD(false)}FOR SIGNATURE &nbsp;&nbsp;${cboxD(true)}FOR INFORMATION</div>
        <div>${cboxD(false)}FOR ACTION &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${cboxD(false)}PER CONVERSATION &nbsp;&nbsp;${cboxD(false)}RETURN TO ORIGIN</div>
      </div>
      <div style="margin-top:10px;font-size:6px;letter-spacing:.1em;font-weight:700;">REMARKS</div>
      <div style="height:78px;border-bottom:1px solid rgba(27,26,23,.4);"></div>
      <div style="height:16px;border-bottom:1px solid rgba(27,26,23,.4);"></div>
      <div${E} style="margin-top:12px;font-size:6.2px;line-height:1.6;">RETENTION: 2 YEARS FROM DATE OF ISSUE. DESTROY BY: 03/2012<br>DO NOT REMOVE THIS SLIP FROM THE ATTACHED MEMORANDUM.</div>
    </div>
    ${hand('window moved to 02:00 — who signed that off?<br>sysadmin says the request came "from above".', 96, 266, { size: 13, rot: -1.5 })}
    ${hand('— R.K. 3/15', 250, 322, { size: 12.5, rot: -2 })}
    ${stamp('RECEIVED<br><span style="font-size:6.5px;letter-spacing:.14em;">MAR 15 2010 · SUBLEVEL COMMAND</span>', 268, 470, -6, BLUEPEN, 8.5)}`;
const memoBack = `<div style="${ROOT}">
  ${paperLayers('mb', 202, { fox: 8, coffeeAt: [80, 78, 24, 22], folds: [33, 66], mirror: true })}
  ${ghost(memoBody)}
  ${faxLine('MAR-14-2010 02:17     FROM: DRE SUBLEVEL 03     TO: DRE SUBLEVEL 01     P.02')}
  <div style="position:absolute;inset:0;transform:rotate(.3deg);transform-origin:50% 40%;">${memoBackContent}</div>
  <div style="position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:5.6px;letter-spacing:.14em;color:#4a453a;">DRE — INTERNAL — NOT FOR EXTERNAL DISTRIBUTION</div>
</div>`;

// ---------- DRE2: ficha de pessoal — frente ----------
const fld = (l, v) => `<div style="display:grid;grid-template-columns:78px 1fr;border-bottom:1px solid rgba(27,26,23,.35);padding:3.5px 0;font-size:8.2px;"><div style="font-size:6px;letter-spacing:.08em;padding-top:2px;">${l}</div><div${E} style="font-weight:700;">${v}</div></div>`;
const logCols = '1fr 1fr 1fr 1fr';
const logRow = (a, b, c, d, bold, last) => `<div style="display:grid;grid-template-columns:${logCols};${last ? '' : 'border-bottom:1px solid rgba(27,26,23,.3);'}"><div style="padding:3px 6px;"><div${E}>${a}</div></div><div style="padding:3px 6px;"><div${E}>${b}</div></div><div style="padding:3px 6px;"><div${E}>${c}</div></div><div style="padding:3px 6px;"><div${E}${bold ? ' style="font-weight:700;"' : ''}>${d}</div></div></div>`;
const cardBody = `<div style="position:absolute;left:24px;top:26px;width:132px;height:16px;border:1.5px solid ${INK};border-bottom:none;border-radius:6px 6px 0 0;background:rgba(255,255,255,.14);font-size:7px;letter-spacing:.1em;padding:3px 8px;font-weight:700;"><div${E}>SL-0338</div></div>
    <div style="position:absolute;left:24px;right:24px;top:41px;border:1.5px solid ${INK};padding:12px 14px 14px;background:rgba(255,255,255,.10);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-family:${ELITE};font-size:13px;letter-spacing:.14em;">PERSONNEL FILE</div>
          <div style="font-size:6.4px;letter-spacing:.09em;margin-top:2px;">DIVISION OF REALITY ENGINEERING — RECORDS SECTION</div>
        </div>
        <div style="text-align:right;font-size:6px;line-height:1.6;letter-spacing:.05em;"><div>FORM DRE-31 (REV. 4-92)</div><div><b>FILE COPY</b></div></div>
      </div>
      <div style="height:1.5px;background:${INK};margin:8px 0 10px;opacity:.7;"></div>
      <div style="display:grid;grid-template-columns:1fr 74px;gap:14px;">
        <div>
          ${fld('NAME', 'REYES, T.')}
          ${fld('EMPLOYEE NO.', 'SL-0338')}
          ${fld('DESIGNATION', 'Sr. Network Analyst')}
          ${fld('SECTION', 'Network Operations, Sublevel Core')}
          ${fld('CLEARANCE', 'Tier 3 — Sublevel')}
          ${fld('SUPERVISOR', 'Dir. K. Marchetti')}
          ${fld('DATE OPENED', '04 / 2009')}
          ${fld('STATUS', 'ACTIVE')}
        </div>
        <div>
          <div style="width:74px;height:92px;border:1px solid ${INK};background:linear-gradient(180deg,#8f8a7c,#6e6a5e);position:relative;overflow:hidden;filter:grayscale(1) contrast(1.1);">
            <div style="position:absolute;left:23px;top:16px;width:28px;height:32px;border-radius:50%;background:#4b483f;"></div>
            <div style="position:absolute;left:8px;top:52px;width:58px;height:50px;border-radius:50% 50% 0 0;background:#4b483f;"></div>
          </div>
          <div style="font-size:5.4px;text-align:center;margin-top:3px;letter-spacing:.06em;">PHOTO ATTACHED</div>
        </div>
      </div>
      <div style="margin-top:12px;font-size:6.2px;letter-spacing:.09em;font-weight:700;">REMARKS</div>
      <div${E} style="font-size:8.2px;line-height:1.7;margin-top:3px;">Flagged for repeated after-hours terminal access (Terminal 11). No action taken — see attached access log.<br>Subject reports "system noise" on closed-network audio monitor. Referred to Medical: routine.</div>
      <div style="margin-top:14px;display:flex;justify-content:space-between;font-size:6.6px;">
        <div${E}>ENTERED BY: <b>Records, Sublevel</b></div><div>REVIEWED: ______ / ______</div>
      </div>
    </div>
    <div style="position:absolute;left:24px;right:24px;top:364px;">
      <div style="font-size:6.4px;letter-spacing:.1em;font-weight:700;margin-bottom:3px;">ATTACHMENT A — ACCESS LOG EXTRACT (TERMINAL 11)</div>
      <div style="border:1.2px solid ${INK};font-size:7.6px;background:rgba(255,255,255,.08);">
        <div style="display:grid;grid-template-columns:${logCols};font-weight:700;font-size:6.2px;letter-spacing:.08em;border-bottom:1.2px solid ${INK};"><div style="padding:3px 6px;">DATE</div><div style="padding:3px 6px;">TERMINAL</div><div style="padding:3px 6px;">LOGIN</div><div style="padding:3px 6px;">LOGOUT</div></div>
        ${logRow('11 FEB', 'TERM-11', '23:48', '02:51')}
        ${logRow('18 FEB', 'TERM-11', '00:12', '03:12', true)}
        ${logRow('25 FEB', 'TERM-11', '23:59', '03:05')}
        ${logRow('04 MAR', 'TERM-11', '00:03', '03:12', true)}
        ${logRow('11 MAR', 'TERM-11', '23:51', '02:44', false, true)}
      </div>
    </div>
    ${hand('Access log reviewed 6/09 — nothing found. R.K.', 40, 552, { size: 13, rot: -2 })}
    ${hand('why Terminal 11?', 236, 199, { font: 'Reenie Beanie', size: 17, color: '#7a1c1c', rot: 4 })}
    ${stamp('COPY 2 — FIELD OFFICE', 262, 24, 3, '#3b3a35', 7.5)}
    ${stamp('DO NOT COPY', 296, 586, -6, REDSTAMP, 10)}`;
const card = `<div style="${ROOT}">
  ${paperLayers('c', 301, { fox: 10, coffeeAt: [16, 88, 20, 18], folds: [50] })}
  ${faxLine('JUL-06-2009 16:41     FROM: DRE RECORDS     TO: SUBLEVEL FIELD OFFICE     P.03')}
  <div style="position:absolute;inset:0;transform:rotate(.25deg);transform-origin:50% 40%;">${cardBody}</div>
</div>`;

// ---------- ficha de pessoal — verso: histórico ----------
const hcols = '52px 1fr 92px';
const hrow = (a, b, c) => `<div style="display:grid;grid-template-columns:${hcols};border-bottom:1px solid rgba(27,26,23,.3);"><div style="padding:3px 6px;"><div${E}>${a}</div></div><div style="padding:3px 6px;"><div${E}>${b}</div></div><div style="padding:3px 6px;"><div${E}>${c}</div></div></div>`;
const hhead = (labels) => `<div style="display:grid;grid-template-columns:${hcols};font-weight:700;font-size:6.2px;letter-spacing:.08em;border-bottom:1.2px solid ${INK};">${labels.map(l => `<div style="padding:3px 6px;">${l}</div>`).join('')}</div>`;
const hsec = (t) => `<div style="font-size:6.4px;letter-spacing:.1em;font-weight:700;margin:12px 0 3px;">${t}</div>`;
const cardBackBody = `<div style="position:absolute;left:24px;right:24px;top:30px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          <div style="font-family:${ELITE};font-size:12px;letter-spacing:.14em;">PERSONNEL FILE — HISTORY</div>
          <div style="font-size:6.2px;letter-spacing:.09em;margin-top:2px;">DIVISION OF REALITY ENGINEERING — RECORDS SECTION</div>
        </div>
        <div style="text-align:right;font-size:6px;line-height:1.6;letter-spacing:.05em;"><div>FORM DRE-31 (REV. 4-92)</div><div${E}><b>SL-0338 · REYES, T.</b></div></div>
      </div>
      <div style="height:1.5px;background:${INK};margin:8px 0 2px;opacity:.7;"></div>

      ${hsec('ASSIGNMENT HISTORY')}
      <div style="border:1.2px solid ${INK};font-size:7.4px;background:rgba(255,255,255,.08);">
        ${hhead(['FROM', 'UNIT / POSITION', 'SUPERVISOR'])}
        ${hrow('09/1996', 'Facilities, Sublevel 01 — Technician', 'D. Rourke')}
        ${hrow('03/2001', 'Systems Administration — Network Technician', 'R. Halloran')}
        ${hrow('08/2005', 'Records, Sublevel 01 — Analyst', 'R. Halloran')}
        ${hrow('04/2009', 'Network Operations, Sublevel Core — Sr. Network Analyst', 'K. Marchetti')}
      </div>

      ${hsec('CLEARANCE HISTORY')}
      <div style="border:1.2px solid ${INK};font-size:7.4px;background:rgba(255,255,255,.08);">
        ${hhead(['DATE', 'TIER', 'GRANTED BY'])}
        ${hrow('09/1996', 'Tier 1 — Facilities', 'Security')}
        ${hrow('08/2005', 'Tier 2 — Records', 'Dir. Halloran')}
        ${hrow('04/2009', 'Tier 3 — Sublevel', 'Dir. Marchetti')}
      </div>

      ${hsec('MEDICAL REFERRALS')}
      <div style="border:1.2px solid ${INK};font-size:7.4px;background:rgba(255,255,255,.08);">
        ${hhead(['DATE', 'REASON / DISPOSITION', 'REF.'])}
        ${hrow('05/2009', '"System noise", closed-network audio monitor — routine, no finding', 'MED-0921')}
        ${hrow('11/1998', 'Exposure screening, Sublevel 01 corridor incident — cleared', 'MED-9811')}
      </div>

      ${hsec('LEAVE / ABSENCE')}
      <div${E} style="font-size:7.6px;line-height:1.6;">None recorded 2009–present.</div>
      <div style="margin-top:14px;display:flex;justify-content:space-between;font-size:6.6px;">
        <div${E}>ENTERED BY: <b>Records, Sublevel</b></div><div>REVIEWED: ______ / ______</div>
      </div>
    </div>
    ${hand('T.R. found the recorder, 11/98 — see tag EV-0447/003', 34, 474, { size: 12.5, rot: -2 })}
    ${hand('same corridor?', 300, 498, { font: 'Reenie Beanie', size: 17, color: '#7a1c1c', rot: 3 })}
    ${stamp('REVIEWED', 300, 560, -5, '#3b3a35', 9)}`;
const cardBack = `<div style="${ROOT}">
  ${paperLayers('cb', 302, { fox: 10, coffeeAt: [16, 88, 20, 18], folds: [50], mirror: true })}
  ${ghost(cardBody)}
  ${faxLine('JUL-06-2009 16:41     FROM: DRE RECORDS     TO: SUBLEVEL FIELD OFFICE     P.04')}
  <div style="position:absolute;inset:0;transform:rotate(-.25deg);transform-origin:50% 40%;">${cardBackBody}</div>
</div>`;

// ---------- DRE3: impressão de terminal (papel contínuo, banner ASCII) — sem verso ----------
const banner = [
  '####  ####  #####',
  '#   # #   # #    ',
  '#   # ####  #### ',
  '#   # #  #  #    ',
  '####  #   # #####',
].join('\n');
const punch = Array.from({ length: 13 }, () => '<span style="width:7px;height:7px;border-radius:50%;background:#a9a493;box-shadow:inset 0 1px 1px rgba(0,0,0,.3);"></span>').join('');
const printout = `<div style="width:460px;height:650px;box-sizing:border-box;position:relative;overflow:hidden;font-family:${TYPE};color:#1c1c1c;background:repeating-linear-gradient(#f2efe1 0 24px, #d6e6cf 24px 48px);">
  <div style="position:absolute;inset:0;filter:url(#pg);opacity:.32;mix-blend-mode:multiply;pointer-events:none;"></div>
  <div style="position:absolute;inset:0;filter:url(#ps);opacity:.4;pointer-events:none;"></div>
  <div style="position:absolute;top:0;bottom:0;left:0;width:22px;background:linear-gradient(90deg,rgba(255,255,255,.25),transparent);"></div>
  <div style="position:absolute;top:0;bottom:0;left:6px;display:flex;flex-direction:column;justify-content:space-around;padding:10px 0;">${punch}</div>
  <div style="position:absolute;top:0;bottom:0;right:6px;display:flex;flex-direction:column;justify-content:space-around;padding:10px 0;">${punch}</div>
  <div style="position:absolute;left:0;right:0;top:0;height:0;border-top:1px dashed rgba(60,60,50,.35);"></div>

  <div style="position:absolute;top:48px;left:44px;right:40px;">
    <div style="font-size:9px;line-height:9.6px;white-space:pre;font-weight:700;letter-spacing:.02em;height:48px;">${banner}   <span style="font-weight:400;font-size:7px;letter-spacing:0;">SUBLEVEL-CORE</span></div>
    <div${E} style="margin-top:24px;font-size:9.5px;line-height:24px;white-space:pre;">JOB 04471   USER SYSADM   QUEUE SL-PRT02   03/14/10 10:18
DRE INTERNAL // NETWORK STATUS   NODE: SUBLEVEL-CORE  BLD 1.4
------------------------------------------------------------
02:00:00  net.check() -&gt; OK
02:00:00  nodes.active = 14/14
06:00:00  net.check() -&gt; OK
06:00:00  nodes.active = 14/14
10:00:00  net.check() -&gt; OK
10:00:00  nodes.active = 13/14
<b>10:00:04  node[11].status = UNRESPONSIVE</b>
<b>10:00:04  node[11].last_op = ANSELM.K [TERM-11]</b>
10:14:00  supervisor.paged = TRUE
10:14:00  log.export = LOCKED
------------------------------------------------------------
*** END OF JOB 04471 ***   PAGE 001</div>
  </div>
  ${hand('who is this?', 290, 392, { font: 'Reenie Beanie', size: 17, color: '#7a1c1c', rot: -4 })}
</div>`;

// ---------- DRE4: briefing classificado — frente ----------
const banner4 = (t) => `<div style="background:#161513;color:#e8dfc4;text-align:center;font-family:${ELITE};font-size:8.6px;letter-spacing:.14em;padding:5px 0;"><div${E}>${t}</div></div>`;
const para = (n, t, w) => `<div style="display:flex;gap:7px;"><span style="font-weight:700;${w ? 'width:' + w + 'px;flex-shrink:0;' : ''}">${n}.</span><span${E} style="flex:1;">${t}</span></div>`;
const briefBody = `<div style="position:absolute;left:30px;right:30px;top:12px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-family:${ELITE};font-size:13px;letter-spacing:.18em;">BRIEFING</div>
            <div${E} style="font-size:9px;font-weight:700;margin-top:2px;">NETWORK ACCESS REVIEW</div>
          </div>
          <div style="border:1px solid ${INK};font-size:5.8px;">
            <div style="background:rgba(27,26,23,.85);color:#e8dfc4;padding:2px 7px;letter-spacing:.14em;text-align:center;">ROUTING</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center;">
              <div style="padding:2px 6px;border-right:1px solid ${INK};">DIR</div><div style="padding:2px 6px;border-right:1px solid ${INK};">DEP</div><div style="padding:2px 6px;">SLC</div>
              <div style="padding:2px 6px;border-top:1px solid ${INK};border-right:1px solid ${INK};height:14px;position:relative;"><span style="position:absolute;left:5px;top:-2px;font-family:'Reenie Beanie',cursive;font-size:16px;color:${BLUEPEN};">K.M.</span></div><div style="padding:2px 6px;border-top:1px solid ${INK};border-right:1px solid ${INK};"></div><div style="padding:2px 6px;border-top:1px solid ${INK};"></div>
            </div>
          </div>
        </div>
        <div style="height:1.5px;background:${INK};opacity:.7;margin:8px 0 7px;"></div>
        <div style="display:grid;grid-template-columns:70px 1fr 70px 1fr;font-size:7.2px;line-height:1.7;">
          <div>CONTROL NO.</div><div${E} style="font-weight:700;">SL-10-0119</div><div>COPY</div><div${E} style="font-weight:700;">1 OF 2</div>
          <div>FOR:</div><div${E}>Director, Sublevel Command</div><div>SUPERSEDES</div><div${E}>SL-09-0812</div>
        </div>
        <div style="height:1px;background:${INK};opacity:.5;margin:7px 0 10px;"></div>
        <div style="font-size:8.5px;line-height:1.65;display:flex;flex-direction:column;gap:8px;">
          ${para(1, 'Network diagnostics confirm anomalous traffic originating from Terminal 11, Sublevel Core, beginning 09:52.')}
          ${para(2, `Subject ${redact('XXXXXXXXXX')} logged in under valid credentials at the time of the anomaly. No forced entry is indicated.`)}
          ${para(3, 'Closed-network isolation protocol was <b>NOT</b> triggered. Cause under review.')}
          ${para(4, 'Recommend immediate credential audit for all Sublevel terminal access, retroactive to 01 JAN.')}
          ${para(5, 'Pending audit, physical access to Terminal Room 3 is restricted to two-person entry. Terminal 11 is to be powered down and tagged.')}
          ${para(6, 'This briefing supersedes all prior guidance on network isolation procedure.')}
        </div>
        <div style="margin-top:46px;font-size:7px;line-height:1.7;">
          <div${E}><b>ATTACHMENTS:</b> (1) Terminal 11 access log, 02–10 JAN (3 pp.) · (2) Network topology, Sublevel Core (1 p.)</div>
          <div${E}><b>ACTION OFFICER:</b> Deputy Director (Ops) — suspense 21 MAR</div>
        </div>
      </div>
      ${hand('Who authorized the 09:52 access?', 44, 322, { size: 13, rot: -2 })}
      <div style="position:absolute;left:30px;right:30px;bottom:14px;border-top:1px solid ${INK};padding-top:5px;font-size:6.4px;line-height:1.65;">
        <div${E}>CLASSIFIED BY: ${redact('XXXX')} &nbsp;·&nbsp; REASON: 1.4(g) &nbsp;·&nbsp; DECLASSIFY ON: —</div>
        <div${E}>PAGE 1 OF 3</div>
      </div>
      ${stamp('SUBLEVEL EYES<br>ONLY — COPY 1', 292, 462, -8, REDSTAMP, 8.5)}`;
const briefing = `<div style="${ROOT}">
  ${paperLayers('b', 401, { fox: 8, coffeeAt: [86, 84, 21, 19], folds: [33, 66] })}
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;">
    ${banner4('DRE — SUBLEVEL ONLY // NOT FOR EXTERNAL DISTRIBUTION')}
    <div style="position:relative;flex:1;transform:rotate(-.25deg);">${briefBody}</div>
    ${banner4('DRE — SUBLEVEL ONLY // NOT FOR EXTERNAL DISTRIBUTION')}
  </div>
</div>`;

// ---------- briefing — verso: página 2 ----------
const dcol = '30px 1fr 50px 40px';
const drow = (a, b, c, d) => `<div style="display:grid;grid-template-columns:${dcol};border-top:1px solid ${INK};font-size:7px;"><div style="padding:3px 6px;border-right:1px solid ${INK};"><div${E}>${a}</div></div><div style="padding:3px 6px;border-right:1px solid ${INK};"><div${E}>${b}</div></div><div style="padding:3px 6px;border-right:1px solid ${INK};">${c ? `<div${E}>${c}</div>` : ''}</div><div style="padding:3px 6px;height:14px;">${d}</div></div>`;
const briefBackBody = `<div style="position:absolute;left:30px;right:30px;top:12px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <div${E} style="font-family:${ELITE};font-size:11px;letter-spacing:.16em;">BRIEFING — CONTINUED</div>
          <div${E} style="font-size:7.2px;"><b>SL-10-0119</b> · COPY 1 OF 2</div>
        </div>
        <div style="height:1.5px;background:${INK};opacity:.7;margin:7px 0 10px;"></div>
        <div style="font-size:8.5px;line-height:1.65;display:flex;flex-direction:column;gap:8px;">
          ${para(7, 'A two-person entry log for Terminal Room 3 is to be forwarded to the Deputy Director (Ops) at the close of each shift.', 15)}
          ${para(8, `Personnel with prior knowledge of the anomaly are to confine discussion to the secure channel. Contact with affiliated contractors on site is limited to scheduled exchanges. ${redact('XXXXXXXXXXXXXXXX')}`, 15)}
          ${para(9, 'Complaints of "system noise" on the closed-network audio monitor are to be logged centrally under SL-AUD. Personnel filing more than one such complaint are to be referred to Medical.', 15)}
          ${para(10, 'The Terminal 11 session buffer is to be preserved in place. It is <b>NOT</b> to be replayed, exported or duplicated pending the audit.', 15)}
          ${para(11, 'Questions regarding this briefing are to be directed to the Action Officer. Do not contact the originating office.', 15)}
        </div>
        <div style="margin-top:16px;font-size:6.4px;letter-spacing:.1em;font-weight:700;">DISTRIBUTION AND RECEIPT</div>
        <div style="margin-top:3px;border:1px solid ${INK};font-size:7px;">
          <div style="display:grid;grid-template-columns:${dcol};font-weight:700;font-size:6px;letter-spacing:.08em;"><div style="padding:3px 6px;border-right:1px solid ${INK};">COPY</div><div style="padding:3px 6px;border-right:1px solid ${INK};">HOLDER</div><div style="padding:3px 6px;border-right:1px solid ${INK};">DATE</div><div style="padding:3px 6px;">INIT.</div></div>
          ${drow('1', 'Director, Sublevel Command', '03/15', '<span style="font-family:\'Reenie Beanie\',cursive;font-size:16px;color:' + BLUEPEN + ';position:relative;top:-3px;">K.M.</span>')}
          ${drow('2', 'Deputy Director (Ops)', '03/15', '')}
          ${drow('—', 'File, Sublevel Records', '', '')}
        </div>
      </div>
      ${hand('nobody is to touch the buffer.<br>who is reading it then?', 40, 400, { size: 13, rot: -2 })}
      <div style="position:absolute;left:30px;right:30px;bottom:14px;border-top:1px solid ${INK};padding-top:5px;font-size:6.4px;line-height:1.65;">
        <div${E}>CLASSIFIED BY: ${redact('XXXX')} &nbsp;·&nbsp; REASON: 1.4(g) &nbsp;·&nbsp; DECLASSIFY ON: —</div>
        <div${E}>PAGE 2 OF 3</div>
      </div>
      ${stamp('SUBLEVEL EYES<br>ONLY — COPY 1', 292, 462, -8, REDSTAMP, 8.5)}`;
const briefingBack = `<div style="${ROOT}">
  ${paperLayers('bb', 402, { fox: 8, coffeeAt: [86, 84, 21, 19], folds: [33, 66], mirror: true })}
  ${ghost(briefBody, 22)}
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;">
    ${banner4('DRE — SUBLEVEL ONLY // NOT FOR EXTERNAL DISTRIBUTION')}
    <div style="position:relative;flex:1;transform:rotate(.25deg);">${briefBackBody}</div>
    ${banner4('DRE — SUBLEVEL ONLY // NOT FOR EXTERNAL DISTRIBUTION')}
  </div>
</div>`;

// ---------- DRE5: etiqueta de evidência — frente ----------
const tagClip = 'clip-path:polygon(14% 0%,86% 0%,100% 8%,100% 100%,0% 100%,0% 8%);';
const RS = 'rgba(138,34,34,.5)';
const pen = (t, o = {}) => `<div${E} data-hand style="font-family:'Caveat',cursive;font-weight:600;font-size:${o.size || 12.5}px;color:${o.color || '#1a2a6b'};line-height:1;${o.style || ''}">${t}</div>`;
const tagf = (l, v) => `<div><div style="font-size:5.6px;letter-spacing:.08em;font-weight:700;">${l}</div><div style="border-bottom:1px solid rgba(138,34,34,.6);min-height:13px;padding-top:1px;">${v}</div></div>`;
const tagPaper = (mirror) => `<div style="position:absolute;inset:0;${tagClip}background:
    radial-gradient(ellipse 34px 30px at ${mirror ? 28 : 72}% 80%, rgba(112,68,24,0.06) 0, rgba(112,68,24,0.06) 21px, rgba(112,68,24,0.30) 24px, rgba(112,68,24,0.08) 28px, transparent 31px),
    ${L.foxing(mirror ? 502 : 501, 7)},
    linear-gradient(to ${mirror ? 'left' : 'right'}, rgba(150,108,48,0.30), transparent 9%),
    linear-gradient(to ${mirror ? 'right' : 'left'}, rgba(150,108,48,0.26), transparent 9%),
    linear-gradient(to top, rgba(150,108,48,0.30), transparent 8%),
    linear-gradient(165deg, #e2cfa0, #d3bb84);"></div>
  <div style="position:absolute;inset:0;${tagClip}filter:url(#tg);opacity:.38;mix-blend-mode:multiply;"></div>
  <div style="position:absolute;inset:0;${tagClip}filter:url(#ts);opacity:.7;"></div>`;
const tagHole = `<div style="position:absolute;left:50%;top:13px;transform:translateX(-50%);width:20px;height:20px;border-radius:50%;background:#12100a;box-shadow:inset 0 2px 3px rgba(0,0,0,.6),0 0 0 3px rgba(80,60,30,.35);"></div>`;
const tagString = `<div style="position:absolute;left:50%;top:0;transform:translateX(-50%) rotate(4deg);transform-origin:top;width:2px;height:30px;background:repeating-linear-gradient(#8a7a5a 0 3px,#6b5d43 3px 6px);"></div>`;
const TAGROOT = `width:280px;height:480px;box-sizing:border-box;position:relative;overflow:hidden;font-family:${TYPE};color:${REDSTAMP};background:transparent;`;
const cc = (a, b, c) => `<div style="padding:1px 3px;border-top:1px solid ${RS};border-right:1px solid ${RS};">${a}</div><div style="padding:1px 3px;border-top:1px solid ${RS};border-right:1px solid ${RS};">${b}</div><div style="padding:1px 3px;border-top:1px solid ${RS};">${c}</div>`;
const tag = `<div style="${TAGROOT}">
  ${tagPaper(false)}
  <img${O('logo')} src="${img(B.dre)}" alt="" style="position:absolute;width:170px;left:50%;top:59%;transform:translate(-50%,-50%);mix-blend-mode:multiply;opacity:.09;">
  ${tagHole}${tagString}
  <div style="position:absolute;inset:0;padding:44px 20px 16px;display:flex;flex-direction:column;">
    <div style="text-align:center;font-family:${ELITE};font-size:13px;letter-spacing:.2em;border:2px solid ${REDSTAMP};padding:4px 0;">EVIDENCE</div>
    <div style="text-align:center;font-size:6px;letter-spacing:.09em;margin-top:4px;">DIVISION OF REALITY ENGINEERING</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 10px;margin-top:12px;">
      ${tagf('CASE NO.', pen('DRE-0447'))}
      ${tagf('ITEM NO.', pen('003'))}
    </div>
    <div style="margin-top:8px;">${tagf('DESCRIPTION', pen('Handheld recorder, water-damaged.<br>Tape intact — not yet played.'))}</div>
    <div style="margin-top:8px;">${tagf('RECOVERED FROM', pen('Sublevel — Access Corridor C'))}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 10px;margin-top:8px;">
      ${tagf('DATE / TIME', pen('11/09/98 &nbsp;02:40'))}
      ${tagf('RECOVERED BY', pen('T.R.'))}
    </div>
    <div style="margin-top:8px;">${tagf('CONDITION / REMARKS', pen('found running. batteries dead when logged'))}</div>
    <div style="margin-top:auto;border-top:1px dashed ${REDSTAMP};padding-top:6px;">
      <div style="font-size:6.2px;font-weight:700;letter-spacing:.09em;">CHAIN OF CUSTODY</div>
      <div style="display:grid;grid-template-columns:.9fr 1fr 1fr;font-size:5.4px;margin-top:3px;border-top:1px solid ${RS};">
        <div style="padding:2px 3px;border-right:1px solid ${RS};">DATE</div><div style="padding:2px 3px;border-right:1px solid ${RS};">FROM</div><div style="padding:2px 3px;">TO</div>
        ${cc(pen('11/98', { size: 11 }), pen('T.R.', { size: 11 }), pen('Records', { size: 11 }))}
        <div style="padding:6px 3px;border-top:1px solid ${RS};border-right:1px solid ${RS};"></div><div style="padding:6px 3px;border-top:1px solid ${RS};border-right:1px solid ${RS};"></div><div style="padding:6px 3px;border-top:1px solid ${RS};"></div>
      </div>
    </div>
  </div>
</div>`;

// ---------- etiqueta — verso: exame e destino ----------
const tagBack = `<div style="${TAGROOT}">
  ${tagPaper(true)}
  ${tagHole}
  <div style="position:absolute;inset:0;padding:44px 20px 16px;display:flex;flex-direction:column;">
    <div style="text-align:center;font-family:${ELITE};font-size:11px;letter-spacing:.16em;border:2px solid ${REDSTAMP};padding:4px 0;">EXAMINATION</div>
    <div${E} style="text-align:center;font-size:6px;letter-spacing:.09em;margin-top:4px;">CASE DRE-0447 · ITEM 003</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 10px;margin-top:12px;">
      ${tagf('EXAMINED BY', pen('M. Osei — Audio Lab'))}
      ${tagf('DATE', pen('12/98'))}
    </div>
    <div style="margin-top:8px;">${tagf('RESULT', pen('Tape plays. 00:41 of hiss, then a voice counting. Not identified. One duplicate made, master retained.', { style: 'min-height:38px;' }))}</div>
    <div style="margin-top:8px;">
      <div style="font-size:5.6px;letter-spacing:.08em;font-weight:700;">DISPOSITION</div>
      <div style="font-size:6.6px;line-height:1.9;margin-top:2px;">${cboxD(false)}RETURN TO FINDER<br>${cboxD(false)}RETAIN — EVIDENCE LOCKER<br>${cboxD(true)}TRANSFER — SUBLEVEL VAULT</div>
    </div>
    <div style="margin-top:8px;">${tagf('AUTHORISED BY', pen('Dir. Halloran'))}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 10px;margin-top:8px;">
      ${tagf('LAB SEAL NO.', pen('A-7731'))}
      <div><div style="font-size:5.6px;letter-spacing:.08em;font-weight:700;">SEAL ON RECEIPT</div><div style="font-size:6.6px;line-height:1.9;margin-top:1px;">${cboxD(true)}INTACT &nbsp;${cboxD(false)}BROKEN</div></div>
    </div>
    <div style="margin-top:auto;">
      <div${E} data-hand style="font-family:'Caveat',cursive;font-weight:600;font-size:14px;color:#7a1c1c;line-height:1;transform:rotate(-3deg);margin-bottom:6px;">do NOT replay the duplicate</div>
      <div style="border-top:1px dashed ${REDSTAMP};padding-top:5px;display:flex;justify-content:space-between;align-items:flex-end;">
        <div style="font-size:5.4px;line-height:1.55;letter-spacing:.05em;">DO NOT REMOVE THIS TAG<br>FROM THE EVIDENCE ITEM.<br>FORM DRE-44 (REV. 2-90)</div>
        ${L.barcode(77, 88, 20, REDSTAMP)}
      </div>
    </div>
  </div>
</div>`;

const out = (name, title, body, meta, extra = {}) => {
  fs.writeFileSync(path.join(OUT, name), docFile(Object.assign({ title, fonts: FONTS, body }, extra)));
  register(Object.assign({ file: name, family: 'dre' }, meta));
};
out('DRE.dc.html', 'DRE — Memorando', memo, { doc: 'dre_memo', side: 'front', label: 'Memorando datilografado' }, { defs: defs('m', 201, 10.9) });
out('DRE_back.dc.html', 'DRE — Memorando (verso)', memoBack, { doc: 'dre_memo', side: 'back', label: 'Memorando datilografado' }, { defs: defs('mb', 202, 10.9) });
out('DRE2.dc.html', 'DRE — Ficha de pessoal', card, { doc: 'dre_personnel', side: 'front', label: 'Ficha de pessoal' }, { defs: defs('c', 301, 10.9) });
out('DRE2_back.dc.html', 'DRE — Ficha de pessoal (verso)', cardBack, { doc: 'dre_personnel', side: 'back', label: 'Ficha de pessoal' }, { defs: defs('cb', 302, 10.9) });
out('DRE3.dc.html', 'DRE — Impressão de terminal', printout, { doc: 'dre_terminal', side: 'front', label: 'Impressão de terminal' }, { defs: grainDef('pg', 321) + speckDef('ps', 331, 10.8) });
out('DRE4.dc.html', 'DRE — Briefing classificado', briefing, { doc: 'dre_briefing', side: 'front', label: 'Briefing classificado' }, { defs: defs('b', 401, 10.9) });
out('DRE4_back.dc.html', 'DRE — Briefing (página 2)', briefingBack, { doc: 'dre_briefing', side: 'back', label: 'Briefing classificado' }, { defs: defs('bb', 402, 10.9) });
out('DRE5.dc.html', 'DRE — Cartão de evidência', tag, { doc: 'dre_tag', side: 'front', label: 'Etiqueta de evidência', w: 280, h: 480 }, { w: 280, h: 480, defs: grainDef('tg', 511) + speckDef('ts', 521, 10.9) });
out('DRE5_back.dc.html', 'DRE — Cartão de evidência (verso)', tagBack, { doc: 'dre_tag', side: 'back', label: 'Etiqueta de evidência', w: 280, h: 480 }, { w: 280, h: 480, defs: grainDef('tg', 511) + speckDef('ts', 521, 10.9) });
console.log('dre ok');
