const fs = require('fs');
const path = require('path');
const L = require('./gen_lib');
const { B, img, docFile, barcode, register, E, O } = L;
const OUT = path.join(__dirname, 'out');
require('fs').mkdirSync(OUT, { recursive: true });

const FONTS = 'family=Oswald:wght@500;600;700&family=Arimo:wght@400;700&family=Courier+Prime:wght@400;700&family=Caveat:wght@500;600';
const NAVY = '#0d1a2e', ORANGE = '#d9531e', GOLD = '#d9a441', INK = '#141a24';
const OSW = "'Oswald',sans-serif";
const MONO = "'Courier Prime',monospace";
const PEN = '#1f3f9c';

// ======================= AVISO À TRIPULAÇÃO (A4) =======================
const order = (n, no, en, text) => `<div style="display:grid;grid-template-columns:20px 1fr;gap:6px;padding:7px 0;border-bottom:1px solid #d5d0c2;">
  <div style="font-family:${OSW};font-weight:700;font-size:15px;line-height:1;color:${ORANGE};">${n}</div>
  <div>
    <div style="display:flex;align-items:baseline;gap:.4em;font-family:${OSW};font-size:8.4px;letter-spacing:.14em;"><div${E} style="font-weight:600;color:${NAVY};">${no}</div><div${E} style="font-weight:500;color:#6b6a62;">/ ${en}</div></div>
    <div${E} style="font-size:7.9px;line-height:1.55;margin-top:2px;">${text}</div>
  </div>
</div>`;

const metaRow = (a, av, b, bv, c, cv) => `<div style="margin:8px 26px 0;display:grid;grid-template-columns:1fr 1fr 1fr;font-size:6px;color:#6b6a62;letter-spacing:.06em;border-bottom:1px solid ${NAVY};padding-bottom:4px;">
    <div style="display:flex;gap:.5em;align-items:baseline;">${a}<div${E} style="font-family:${MONO};font-weight:700;color:${INK};">${av}</div></div>
    <div style="display:flex;gap:.5em;align-items:baseline;justify-content:center;">${b}<div${E} style="font-family:${MONO};font-weight:700;color:${INK};">${bv}</div></div>
    <div style="display:flex;gap:.5em;align-items:baseline;justify-content:flex-end;">${c}<div${E} style="font-family:${MONO};font-weight:700;color:${INK};">${cv}</div></div>
  </div>`;

const strips = `<div style="height:6px;background:${ORANGE};"></div><div style="height:3px;background:${NAVY};"></div>`;
const NROOT = `width:460px;height:650px;box-sizing:border-box;position:relative;overflow:hidden;background:#fbfaf5;font-family:'Arimo',Arial,sans-serif;color:${INK};`;
const patchHead = `<div style="display:flex;align-items:center;gap:12px;margin:14px 26px 0;">
    <div style="flex:1;"><div style="height:2px;background:${NAVY};"></div><div style="height:1px;background:${ORANGE};margin-top:2px;"></div></div>
    <div${O('patch')} style="width:80px;height:80px;border-radius:50%;overflow:hidden;flex-shrink:0;"><img src="${img(B.odPatch)}" alt="Ødemark A. — Mørketid" style="width:83px;height:auto;margin:-1px 0 0 -1px;display:block;"></div>
    <div style="flex:1;"><div style="height:2px;background:${NAVY};"></div><div style="height:1px;background:${ORANGE};margin-top:2px;"></div></div>
  </div>
  <div style="text-align:center;margin-top:7px;">
    <div style="font-family:${OSW};font-weight:700;font-size:21px;letter-spacing:.24em;margin-left:.24em;color:${NAVY};line-height:1;">ØDEMARK A.</div>
    <div style="font-size:5.8px;letter-spacing:.24em;color:#6b6a62;margin-top:4px;">PLATTFORMDRIFT · PLATFORM OPERATIONS</div>
  </div>`;
const nfooter = (seed, copy, code) => `<div style="position:absolute;left:26px;right:26px;bottom:14px;border-top:1.5px solid ${NAVY};padding-top:5px;display:flex;justify-content:space-between;align-items:flex-end;gap:10px;">
    <div style="font-size:5.2px;line-height:1.6;color:#4a4a45;">
      <div><b style="color:${NAVY};">Ødemark A.</b> — operated by Kelvara Petrochemicals AS · Post on all deck notice boards and in the mess. Standing orders remain in force until withdrawn by the Platform Manager.</div>
      <div${E}>${copy}</div>
    </div>
    <div style="text-align:center;flex-shrink:0;">${barcode(seed, 64, 15, NAVY)}<div${E} style="font-family:${MONO};font-size:4.8px;color:#4a4a45;margin-top:2px;">${code}</div></div>
  </div>`;

const notice = `<div style="${NROOT}">
  ${strips}
  ${patchHead}

  <div style="margin:12px 26px 0;background:${NAVY};color:#fff;display:flex;align-items:stretch;justify-content:space-between;">
    <div style="padding:7px 12px;">
      <div${E} style="font-family:${OSW};font-weight:700;font-size:13px;letter-spacing:.14em;color:${GOLD};line-height:1.1;">MELDING TIL BESETNINGEN</div>
      <div${E} style="font-family:${OSW};font-weight:500;font-size:8px;letter-spacing:.2em;color:#dfe3ea;margin-top:2px;">NOTICE TO CREW — STANDING ORDERS</div>
    </div>
    <div style="background:${ORANGE};padding:6px 12px;display:flex;flex-direction:column;justify-content:center;text-align:center;">
      <div${E} style="font-family:${OSW};font-weight:700;font-size:11px;letter-spacing:.12em;line-height:1.1;">MØRKETID</div>
      <div${E} style="font-family:${OSW};font-weight:500;font-size:7.5px;letter-spacing:.2em;">NOV — APR</div>
    </div>
  </div>

  ${metaRow('<span>NOTICE NO.</span>', 'ØA-SO-07', '<span>ISSUED</span>', '01.11', '<span>VALID</span>', 'UNTIL 30.04')}

  <div style="margin:2px 26px 0;">
    ${order('1', 'LYS', 'LIGHTING', 'Deck and moonpool floodlights remain on for the full Mørketid period. Report any failed unit to the Electrical Supervisor immediately. Lighting is not to be switched off for any reason.')}
    ${order('2', 'VAKT', 'WATCH', 'Night watch is doubled. Minimum two persons on the moonpool deck at all times after 18:00. <b>Nobody works at the moonpool rail alone.</b>')}
    ${order('3', 'KOMMUNIKASJON', 'COMMUNICATIONS', 'Weekly satellite check Thursday 06:00. Log every failed attempt with time and duration. The backup line is for routine reporting only.')}
    ${order('4', 'LYD', 'SOUNDS', 'Unexplained sounds from below the deck or from the moonpool are to be logged in the watch book (time, location, duration). They are <b>not</b> to be investigated.')}
    ${order('5', 'HELSE', 'HEALTH', 'Report sleep disturbance, disorientation or persistent ringing in the ears to the medic. Reports are confidential and non-punitive.')}
  </div>

  <div style="margin:12px 26px 0;display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <div${E} data-hand style="font-family:'Caveat',cursive;font-weight:600;font-size:22px;line-height:1;color:${PEN};transform:rotate(-3deg);transform-origin:left;">E. Solberg</div>
      <div style="border-top:1px solid ${NAVY};margin-top:2px;padding-top:2px;font-size:6.4px;color:#4a4a45;width:150px;"><div${E} style="font-weight:700;">Plattformsjef / Platform Manager</div><div${E}>Ødemark A.</div></div>
    </div>
    <div style="border:1px solid ${NAVY};font-size:5.8px;color:#6b6a62;display:grid;grid-template-columns:1fr 1fr;">
      <div style="padding:3px 7px;border-right:1px solid ${NAVY};border-bottom:1px solid ${NAVY};">POSTED</div><div style="padding:3px 7px;border-bottom:1px solid ${NAVY};"><div${E} data-hand style="font-family:'Caveat',cursive;font-weight:600;font-size:12px;color:${PEN};line-height:1;">01.11 MK</div></div>
      <div style="padding:3px 7px;border-right:1px solid ${NAVY};">REMOVE AFTER</div><div style="padding:3px 7px;"><div${E} style="font-family:${MONO};font-weight:700;color:${INK};">30.04</div></div>
    </div>
  </div>

  ${nfooter(61, 'Copy 3 of 6 · Uncontrolled when printed · Sheet 1 of 2 — safety information overleaf', 'ØA-SO-07')}
</div>`;

// ---------- aviso — verso: planta de decks, sinais de alarme, contatos ----------
const deckPlan = `<svg width="100%" viewBox="0 0 408 210" xmlns="http://www.w3.org/2000/svg" style="display:block;">
  <defs>
    <pattern id="hz" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#f4f2ea"/><rect width="2.2" height="6" fill="#d9531e" opacity=".55"/></pattern>
    <pattern id="wv" width="10" height="6" patternUnits="userSpaceOnUse"><rect width="10" height="6" fill="#c7d9e6"/><path d="M0 3 Q2.5 0.5 5 3 T10 3" fill="none" stroke="#5f86a3" stroke-width=".7"/></pattern>
  </defs>
  <rect x="0" y="0" width="408" height="210" fill="#f4f2ea"/>
  <rect x="10" y="10" width="388" height="156" fill="#fff" stroke="#0d1a2e" stroke-width="1.6"/>
  <rect x="18" y="18" width="94" height="140" fill="#e8e5d8" stroke="#0d1a2e" stroke-width="1"/>
  <text x="65" y="34" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="600" font-size="8" fill="#0d1a2e" letter-spacing="1">LEGEKVARTER</text>
  <text x="65" y="43" text-anchor="middle" font-family="Arimo, Arial, sans-serif" font-size="5.6" fill="#4a4a45">LIVING QUARTERS · LQ</text>
  <rect x="26" y="52" width="38" height="30" fill="none" stroke="#0d1a2e" stroke-width=".6"/><text x="45" y="69" text-anchor="middle" font-family="Arimo, Arial, sans-serif" font-size="5.4" fill="#0d1a2e">MESS</text>
  <rect x="66" y="52" width="38" height="30" fill="none" stroke="#0d1a2e" stroke-width=".6"/><text x="85" y="69" text-anchor="middle" font-family="Arimo, Arial, sans-serif" font-size="5.4" fill="#0d1a2e">MEDIC</text>
  <rect x="26" y="88" width="78" height="24" fill="none" stroke="#0d1a2e" stroke-width=".6"/><text x="65" y="102" text-anchor="middle" font-family="Arimo, Arial, sans-serif" font-size="5.4" fill="#0d1a2e">CONTROL ROOM</text>
  <rect x="26" y="118" width="78" height="32" fill="none" stroke="#0d1a2e" stroke-width=".6"/><text x="65" y="136" text-anchor="middle" font-family="Arimo, Arial, sans-serif" font-size="5.4" fill="#0d1a2e">CABINS</text>

  <rect x="120" y="18" width="132" height="66" fill="#eeece1" stroke="#0d1a2e" stroke-width="1"/>
  <text x="186" y="46" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="600" font-size="8" fill="#0d1a2e" letter-spacing="1">BORERIGG</text>
  <text x="186" y="55" text-anchor="middle" font-family="Arimo, Arial, sans-serif" font-size="5.6" fill="#4a4a45">DRILL FLOOR</text>
  <rect x="120" y="92" width="132" height="66" fill="#eeece1" stroke="#0d1a2e" stroke-width="1"/>
  <text x="186" y="120" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="600" font-size="8" fill="#0d1a2e" letter-spacing="1">PROSESS</text>
  <text x="186" y="129" text-anchor="middle" font-family="Arimo, Arial, sans-serif" font-size="5.6" fill="#4a4a45">PROCESS · MUD STORE</text>

  <rect x="260" y="18" width="64" height="66" fill="url(#hz)" stroke="#0d1a2e" stroke-width="1"/>
  <rect x="270" y="41" width="44" height="22" fill="#fbfaf5" stroke="#0d1a2e" stroke-width=".6"/>
  <text x="292" y="50" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="600" font-size="6.6" fill="#0d1a2e" letter-spacing=".6">LAGER D-4</text>
  <text x="292" y="58" text-anchor="middle" font-family="Arimo, Arial, sans-serif" font-size="4.6" fill="#8a2b0d" font-weight="700">STENGT / CLOSED</text>

  <rect x="260" y="92" width="64" height="66" fill="url(#wv)" stroke="#0d1a2e" stroke-width="1.2"/>
  <rect x="266" y="100" width="52" height="34" fill="#a9c3d6" stroke="#0d1a2e" stroke-width=".8" stroke-dasharray="3 2"/>
  <text x="292" y="120" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="700" font-size="7.2" fill="#0d1a2e" letter-spacing=".4">MOONPOOL</text>
  <rect x="264" y="141" width="56" height="10" fill="#fff" opacity=".85"/><text x="292" y="148.4" text-anchor="middle" font-family="Arimo, Arial, sans-serif" font-size="4.6" fill="#0d1a2e">RAIL: TWO PERSONS</text>

  <circle cx="362" cy="52" r="26" fill="#fff" stroke="#0d1a2e" stroke-width="1.2"/><circle cx="362" cy="52" r="20" fill="none" stroke="#0d1a2e" stroke-width=".6" stroke-dasharray="2 2"/>
  <text x="362" y="58" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="700" font-size="17" fill="#0d1a2e">H</text>
  <text x="362" y="86" text-anchor="middle" font-family="Arimo, Arial, sans-serif" font-size="5" fill="#4a4a45">HELIDECK</text>
  <rect x="336" y="104" width="52" height="16" fill="#e8e5d8" stroke="#0d1a2e" stroke-width=".8"/><text x="362" y="115" text-anchor="middle" font-family="Arimo, Arial, sans-serif" font-size="5.4" fill="#0d1a2e">CRANE PEDESTAL</text>
  <path d="M362 122 Q 362 140 328 132" fill="none" stroke="#0d1a2e" stroke-width=".8"/>
  <text x="366" y="142" text-anchor="middle" font-family="Arimo, Arial, sans-serif" font-size="5" fill="#4a4a45">MOONPOOL CRANE</text>

  <circle cx="116" cy="70" r="7" fill="#d9531e"/><text x="116" y="72.6" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="700" font-size="7" fill="#fff">M1</text>
  <circle cx="340" cy="30" r="7" fill="#d9531e"/><text x="340" y="32.6" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="700" font-size="7" fill="#fff">M2</text>
  <rect x="12" y="150" width="14" height="14" fill="#0d1a2e"/><text x="19" y="160" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="700" font-size="8" fill="#fff">A</text>
  <rect x="382" y="150" width="14" height="14" fill="#0d1a2e"/><text x="389" y="160" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="700" font-size="8" fill="#fff">B</text>

  <g transform="translate(10 178)">
    <circle cx="6" cy="6" r="5" fill="#d9531e"/><text x="16" y="9" font-family="Arimo, Arial, sans-serif" font-size="5.6" fill="#0d1a2e">SAMLEPUNKT / MUSTER POINT</text>
    <rect x="132" y="1" width="10" height="10" fill="#0d1a2e"/><text x="148" y="9" font-family="Arimo, Arial, sans-serif" font-size="5.6" fill="#0d1a2e">LIVBÅT / LIFEBOAT STATION</text>
    <rect x="268" y="1" width="10" height="10" fill="url(#hz)" stroke="#0d1a2e" stroke-width=".6"/><text x="284" y="9" font-family="Arimo, Arial, sans-serif" font-size="5.6" fill="#0d1a2e">STENGT / CLOSED</text>
    <text x="0" y="24" font-family="Arimo, Arial, sans-serif" font-size="5.2" fill="#6b6a62">Schematic, main deck level. Not to scale. Lower levels and the moonpool shaft are not shown.</text>
  </g>
</svg>`;

const alarmRow = (a, b, c, d) => `<div style="display:grid;grid-template-columns:100px 100px 1fr;border-top:1px solid #d5d0c2;font-size:7.4px;align-items:baseline;">
  <div style="padding:5px 8px;"><div${E} style="font-family:${OSW};font-weight:600;font-size:8.4px;letter-spacing:.12em;color:${NAVY};">${a}</div><div${E} style="font-size:6px;color:#6b6a62;letter-spacing:.06em;">${b}</div></div>
  <div style="padding:5px 8px;"><div${E} style="font-weight:700;">${c}</div></div>
  <div style="padding:5px 8px;"><div${E} style="line-height:1.5;">${d}</div></div>
</div>`;
const noticeBack = `<div style="${NROOT}">
  ${strips}
  <div style="display:flex;justify-content:space-between;align-items:center;margin:11px 26px 0;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div${O('patch')} style="width:46px;height:46px;border-radius:50%;overflow:hidden;flex-shrink:0;"><img src="${img(B.odPatch)}" alt="" style="width:48px;height:auto;margin:-1px 0 0 -1px;display:block;"></div>
      <div>
        <div style="font-family:${OSW};font-weight:700;font-size:15px;letter-spacing:.2em;color:${NAVY};line-height:1;">ØDEMARK A.</div>
        <div style="font-size:5.2px;letter-spacing:.2em;color:#6b6a62;margin-top:3px;">PLATTFORMDRIFT · PLATFORM OPERATIONS</div>
      </div>
    </div>
    <div style="text-align:right;"><div${E} style="font-family:${MONO};font-size:6px;color:#6b6a62;">ØA-SO-07 · SHEET 2 OF 2</div></div>
  </div>
  <div style="margin:9px 26px 0;"><div style="height:2px;background:${NAVY};"></div><div style="height:1px;background:${ORANGE};margin-top:2px;"></div></div>

  <div style="margin:10px 26px 0;background:${NAVY};color:#fff;padding:7px 12px;">
    <div${E} style="font-family:${OSW};font-weight:700;font-size:12px;letter-spacing:.14em;color:${GOLD};line-height:1.1;">DEKKSPLAN OG SAMLEPUNKTER</div>
    <div${E} style="font-family:${OSW};font-weight:500;font-size:7.6px;letter-spacing:.2em;color:#dfe3ea;margin-top:2px;">DECK PLAN AND MUSTER POINTS</div>
  </div>
  <div style="margin:8px 26px 0;border:1px solid ${NAVY};">${deckPlan}</div>

  <div style="margin:11px 26px 0;">
    <div style="font-family:${OSW};font-weight:700;font-size:8.6px;letter-spacing:.16em;color:${NAVY};border-bottom:1.5px solid ${NAVY};padding-bottom:3px;">ALARMSIGNALER <span style="font-weight:500;color:#6b6a62;">/ ALARM SIGNALS</span></div>
    ${alarmRow('GENERALALARM', 'GENERAL ALARM', 'Continuous tone', 'Stop work. Go to your muster point. Report to the muster leader. Wait for instructions over the PA.')}
    ${alarmRow('GASSALARM', 'GAS ALARM', 'Intermittent tone', 'Stop work. Move upwind, away from the source. Muster at M2 unless directed otherwise.')}
    ${alarmRow('EVAKUERING', 'ABANDON PLATFORM', 'PA order only', 'Proceed to your lifeboat station as listed on the muster list. Do not return to the cabins.')}
  </div>

  <div style="margin:11px 26px 0;">
    <div style="font-family:${OSW};font-weight:700;font-size:8.6px;letter-spacing:.16em;color:${NAVY};border-bottom:1.5px solid ${NAVY};padding-bottom:3px;">NØDNUMRE <span style="font-weight:500;color:#6b6a62;">/ EMERGENCY NUMBERS</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;font-size:7.2px;">
      <div style="padding:5px 8px 5px 0;border-bottom:1px solid #d5d0c2;"><div style="color:#6b6a62;font-size:5.8px;letter-spacing:.08em;">CONTROL ROOM</div><div${E} style="font-family:${MONO};font-weight:700;">ext. 4001</div></div>
      <div style="padding:5px 8px;border-bottom:1px solid #d5d0c2;"><div style="color:#6b6a62;font-size:5.8px;letter-spacing:.08em;">MEDIC</div><div${E} style="font-family:${MONO};font-weight:700;">ext. 4055</div></div>
      <div style="padding:5px 0 5px 8px;border-bottom:1px solid #d5d0c2;"><div style="color:#6b6a62;font-size:5.8px;letter-spacing:.08em;">HSE DUTY OFFICER</div><div${E} style="font-family:${MONO};font-weight:700;">ext. 4417</div></div>
      <div style="padding:5px 8px 5px 0;"><div style="color:#6b6a62;font-size:5.8px;letter-spacing:.08em;">PLATFORM MANAGER</div><div${E} style="font-family:${MONO};font-weight:700;">ext. 4000</div></div>
      <div style="padding:5px 8px;"><div style="color:#6b6a62;font-size:5.8px;letter-spacing:.08em;">VHF</div><div${E} style="font-family:${MONO};font-weight:700;">ch. 16 / 12</div></div>
      <div style="padding:5px 0 5px 8px;"><div style="color:#6b6a62;font-size:5.8px;letter-spacing:.08em;">MARINE DUTY OFFICER</div><div${E} style="font-family:${MONO};font-weight:700;">ext. 4100</div></div>
    </div>
  </div>

  ${nfooter(62, 'Copy 3 of 6 · Uncontrolled when printed · Sheet 2 of 2', 'ØA-SO-07 · 2/2')}
</div>`;

// ======================= CARTÃO DE IDENTIFICAÇÃO (CR80 paisagem) =======================
const CARD = `width:640px;height:402px;box-sizing:border-box;position:relative;overflow:hidden;font-family:${MONO};background:linear-gradient(135deg,#0c1524 0%,#0a1220 45%,#060a12 100%);`;
const cardBase = (seedAngle) => `<div style="position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,0.09) 45%,rgba(255,255,255,0.02) 55%,transparent 65%);"></div>
  <div style="position:absolute;inset:0;opacity:0.10;background:repeating-linear-gradient(${seedAngle}deg,#e0a72e 0 1px,transparent 1px 7px);"></div>`;
const fieldC = (label, val) => `<div><div style="font-size:8px;letter-spacing:.1em;color:#6b7383;">${label}</div><div${E} style="font-size:12px;color:#dfe3ea;margin-top:2px;">${val}</div></div>`;
const bcBars = '<div style="width:2px;height:100%;background:#f3ede0;"></div><div style="width:1px;height:65%;background:#f3ede0;"></div><div style="width:3px;height:100%;background:#f3ede0;"></div><div style="width:1px;height:50%;background:#f3ede0;"></div><div style="width:2px;height:85%;background:#f3ede0;"></div><div style="width:1px;height:60%;background:#f3ede0;"></div><div style="width:2px;height:100%;background:#f3ede0;"></div><div style="width:1px;height:40%;background:#f3ede0;"></div><div style="width:3px;height:80%;background:#f3ede0;"></div><div style="width:1px;height:55%;background:#f3ede0;"></div><div style="width:2px;height:90%;background:#f3ede0;"></div>';
const badgeFront = `<div style="${CARD}">
  ${cardBase(35)}
  <div style="position:absolute;right:-30px;top:-30px;width:150px;height:150px;border-radius:50%;background:conic-gradient(from 90deg,#66ddd6,#d9531e,#e0a72e,#6fd6ff,#66ddd6);opacity:.16;filter:blur(1px);"></div>
  <div style="position:absolute;inset:0;padding:22px 26px;display:flex;flex-direction:column;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:10px;">
        <img${O('mark')} src="${img(B.odBadge)}" alt="Ø.A" style="height:34px;width:34px;filter:drop-shadow(0 0 6px rgba(224,167,46,0.5));">
        <div>
          <div style="font-family:${OSW};font-weight:700;font-size:15px;letter-spacing:.1em;color:#f3ede0;">ØDEMARK A.</div>
          <div style="font-size:9px;letter-spacing:.12em;color:#8a93a3;margin-top:1px;">CREW IDENTIFICATION</div>
        </div>
      </div>
      <div${E} style="text-align:right;font-size:8.5px;letter-spacing:.1em;color:#6b7383;">MØRKETID<br>NOV — APR</div>
    </div>
    <div style="height:1px;background:linear-gradient(90deg,#d9531e,transparent);margin-top:14px;"></div>
    <div style="display:flex;gap:18px;margin-top:16px;flex-grow:1;">
      <div data-slot="photo" style="width:108px;height:132px;border-radius:6px;background:linear-gradient(155deg,#33455e,#1a2436);border:1px solid rgba(224,167,46,.4);flex-shrink:0;"></div>
      <div style="flex-grow:1;display:flex;flex-direction:column;">
        <div${E} style="font-family:${OSW};font-weight:700;font-size:21px;letter-spacing:.02em;color:#f3ede0;">K. ANDRESEN</div>
        <div${E} style="font-size:11px;letter-spacing:.04em;color:#e0a72e;margin-top:2px;">DRILLING TECHNICIAN — KELVARA PETROCHEMICALS AS</div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px;margin-top:16px;">
          ${fieldC('DATE OF BIRTH', '14 / 06 / 1991')}${fieldC('EMPLOYEE NO.', 'KP-04471')}${fieldC('ISSUED', '03 / 2024')}${fieldC('VALID THRU', '03 / 2027')}
        </div>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;">
      <div style="width:34px;height:24px;border-radius:3px;background:linear-gradient(155deg,#e0c274,#a9822f);position:relative;"><div style="position:absolute;inset:3px;border:1px solid rgba(0,0,0,.35);border-radius:2px;"></div></div>
      <div style="display:flex;gap:2px;height:20px;align-items:flex-end;">${bcBars}</div>
      <div${E} style="font-size:8px;letter-spacing:.08em;color:#6b7383;">ØA-CID-04471</div>
    </div>
  </div>
</div>`;

// ---------- cartão — verso ----------
const tr_ = (label, val, extra = '') => `<div style="border:1px solid rgba(224,167,46,.35);border-radius:3px;padding:5px 8px;${extra}"><div style="font-size:7px;letter-spacing:.1em;color:#6b7383;">${label}</div><div${E} style="font-size:11px;color:#dfe3ea;margin-top:2px;">${val}</div></div>`;
const badgeBack = `<div style="${CARD}">
  ${cardBase(-35)}
  <div${O('mark')} style="position:absolute;right:30px;top:96px;width:230px;height:230px;opacity:.06;background:none;"><img src="${img(B.odBadge)}" alt="" style="width:230px;height:230px;"></div>
  <div style="position:absolute;left:0;right:0;top:24px;height:54px;background:linear-gradient(180deg,#141416,#08080a 60%,#101012);box-shadow:inset 0 1px 0 rgba(255,255,255,.06),inset 0 -1px 0 rgba(255,255,255,.04);"></div>

  <div style="position:absolute;left:26px;top:92px;width:340px;height:36px;background:repeating-linear-gradient(135deg,#f1ecdd 0 5px,#e6dfcb 5px 10px);border:1px solid rgba(0,0,0,.4);">
    <div style="position:absolute;left:6px;top:2px;font-size:6px;letter-spacing:.1em;color:#7a7462;">AUTHORISED SIGNATURE — NOT VALID UNLESS SIGNED</div>
    <div${E} data-hand style="position:absolute;left:44px;top:8px;font-family:'Caveat',cursive;font-weight:600;font-size:22px;line-height:1;color:#1a2a6b;transform:rotate(-3deg);white-space:nowrap;">K. Andresen</div>
  </div>
  <div style="position:absolute;left:380px;right:26px;top:92px;height:36px;display:flex;align-items:center;justify-content:flex-end;gap:12px;">
    <div style="text-align:right;font-size:7px;letter-spacing:.1em;line-height:1.5;"><div style="color:#6b7383;">MOONPOOL DECK</div><div${E} style="color:${GOLD};">TWO-PERSON RULE</div></div>
    <div style="width:34px;height:34px;border:1.5px solid ${ORANGE};border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:${OSW};font-weight:700;font-size:14px;color:${ORANGE};">2</div>
  </div>

  <div style="position:absolute;left:26px;right:26px;top:144px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;">
    ${tr_('MUSTER STATION', 'M1 · LQ LOBBY')}${tr_('LIFEBOAT', 'A · SEAT 14')}${tr_('BLOOD GROUP', 'A POS')}${tr_('MEDICAL ALERT', 'NONE')}
  </div>

  <div style="position:absolute;left:26px;right:26px;top:212px;">
    <div style="font-size:7px;letter-spacing:.14em;color:#6b7383;margin-bottom:5px;">OFFSHORE SAFETY TRAINING — VALID THRU</div>
    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;">
      ${tr_('BOSIET', '03 / 2027')}${tr_('HUET', '03 / 2027')}${tr_('FIRE TEAM', '09 / 2026')}${tr_('H2S', '03 / 2026')}
    </div>
  </div>

  <div style="position:absolute;left:26px;right:26px;top:300px;height:1px;background:linear-gradient(90deg,#d9531e,transparent);"></div>
  <div style="position:absolute;left:26px;right:250px;top:310px;font-size:7.4px;line-height:1.6;color:#8a93a3;">
    <div${E}><b>IF FOUND, RETURN TO:</b> Ødemark A. Platform Operations, c/o Kelvara Petrochemicals AS, Postboks 2217 Sentrum, N-4001 Stavanger, Norway. Tel. +47 51 00 00 00. This card is the property of Kelvara Petrochemicals AS and must be surrendered on request.</div>
  </div>
  <div style="position:absolute;right:26px;top:312px;width:200px;text-align:right;">
    <div style="display:inline-block;background:#f3ede0;padding:4px 6px 2px;">${barcode(71, 188, 26, '#0a1220')}</div>
    <div${E} style="font-size:8px;letter-spacing:.08em;color:#6b7383;margin-top:3px;">ØA-CID-04471</div>
  </div>
</div>`;

const out = (name, title, body, meta, extra = {}) => {
  fs.writeFileSync(path.join(OUT, name), docFile(Object.assign({ title, fonts: FONTS, body }, extra)));
  register(Object.assign({ file: name, family: 'odemark' }, meta));
};
out('OdemarkNotice.dc.html', 'Ødemark A. — Ordens de Mørketid', notice, { doc: 'od_notice', side: 'front', label: 'Ordens de Mørketid' });
out('OdemarkNotice_back.dc.html', 'Ødemark A. — Planta de decks (verso)', noticeBack, { doc: 'od_notice', side: 'back', label: 'Ordens de Mørketid' });
out('OdemarkBadge.dc.html', 'Ødemark A. — Cartão de identificação', badgeFront, { doc: 'od_badge', side: 'front', label: 'Cartão de identificação', w: 640, h: 402 }, { w: 640, h: 402 });
out('OdemarkBadge_back.dc.html', 'Ødemark A. — Cartão (verso)', badgeBack, { doc: 'od_badge', side: 'back', label: 'Cartão de identificação', w: 640, h: 402 }, { w: 640, h: 402 });
console.log('odemark ok');
