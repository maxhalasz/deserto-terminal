/* ============================================================
   Props das salas da plataforma (catalogo PUBLICO): lavanderia, academia, oficina, vasos de processo, helideck, guindaste.
   Mesma convencao de station-props.js (ops em metros, origem no centro; f: 0 contorno 1 papel 2 ambar 3 tinta 4 mancha).
   ============================================================ */
(function(){
const P=window.StationProps;if(!P)return;
const d=P.def;

/* ---------- alojamento e lazer ---------- */
d('lavadora','Máquina de lavar','hab',.75,.7,o=>{o.rc(-.375,-.35,.75,.7,.05);o.ci(0,.04,.24);o.ci(0,.04,.15,1);o.rc(-.3,-.3,.3,.07,0,1);o.ci(.24,-.26,.04,3);});
d('secadora','Secadora','hab',.75,.7,o=>{o.rc(-.375,-.35,.75,.7,.05);o.ci(0,.04,.24);o.ln(-.12,.04,.12,.04);o.ln(0,-.08,0,.16);o.ci(.24,-.26,.04,3);});
d('cesto_roupa','Cesto de roupa','hab',.7,.5,o=>{o.rc(-.35,-.25,.7,.5,.08,1);for(let i=1;i<6;i++)o.ln(-.35+i*.117,-.25,-.35+i*.117,.25);});
d('rack_roupa','Prateleira de roupa de cama','hab',1.8,.45,o=>{o.rc(-.9,-.225,1.8,.45);for(let i=0;i<4;i++)o.rc(-.82+i*.42,-.17,.38,.34,0,1);});
d('cafeteira','Cafeteira','hab',.4,.4,o=>{o.rc(-.2,-.2,.4,.4,.04);o.ci(0,.02,.1,1);o.rc(-.14,-.17,.28,.06,0,1);});
d('mesa_bilhar','Mesa de sinuca','hab',2.8,1.5,o=>{o.rc(-1.4,-.75,2.8,1.5,.06);o.rc(-1.2,-.58,2.4,1.16,0,1);[[-1.2,-.58],[0,-.58],[1.2,-.58],[-1.2,.58],[0,.58],[1.2,.58]].forEach(p=>o.ci(p[0],p[1],.07,3));});
d('esteira','Esteira de corrida','hab',.8,1.9,o=>{o.rc(-.4,-.95,.8,1.9,.05);o.rc(-.3,-.55,.6,1.35,.04,1);o.rc(-.35,-.92,.7,.3,.04);o.ci(0,-.77,.07,3);});
d('bicicleta','Bicicleta ergométrica','hab',.6,1.1,o=>{o.rc(-.3,-.55,.6,1.1,.1);o.ci(0,.1,.18,1);o.rc(-.2,-.5,.4,.14,0,1);o.ln(0,-.4,0,.1);});
d('supino','Banco de supino','hab',.8,2,o=>{o.rc(-.2,-.85,.4,1.7,.08,1);o.ln(-.4,-.55,.4,-.55);o.ci(-.4,-.55,.08,3);o.ci(.4,-.55,.08,3);o.rc(-.4,-.95,.08,.5);o.rc(.32,-.95,.08,.5);});
d('rack_pesos','Rack de halteres','hab',1.6,.6,o=>{o.rc(-.8,-.3,1.6,.6);for(let i=0;i<5;i++){o.ci(-.64+i*.32,-.1,.1,1);o.ci(-.64+i*.32,.14,.07,1);}});

/* ---------- processo e oficina ---------- */
d('vaso_pressao','Vaso separador (horizontal)','ind',5,1.8,o=>{o.rc(-2.5,-.9,5,1.8,.9,1);o.ln(-1.6,-.9,-1.6,.9);o.ln(1.6,-.9,1.6,.9);o.rc(-1.5,.85,.5,.3);o.rc(1,.85,.5,.3);o.ci(0,0,.22);o.ci(0,0,.1,3);o.ci(-2,0,.1,3);o.ci(2,0,.1,3);});
d('tanque_h','Tanque horizontal','ind',4,1.6,o=>{o.rc(-2,-.8,4,1.6,.8,1);o.ln(-1,-.8,-1,.8);o.ln(1,-.8,1,.8);o.ci(0,0,.15);o.rc(-1.3,.78,.4,.25);o.rc(.9,.78,.4,.25);});
d('motor_diesel','Motor diesel','ind',2.6,1.1,o=>{o.rc(-1.3,-.55,2.6,1.1,.05);for(let i=0;i<4;i++)o.rc(-1.1+i*.5,-.4,.4,.8,0,1);o.ci(1.05,0,.38);o.ci(1.05,0,.12,3);});
d('transformador','Transformador','ind',2,1.7,o=>{o.rc(-1,-.85,2,1.7,.04);for(let i=1;i<8;i++)o.ln(-1+i*.25,-.85,-1+i*.25,.85);o.ci(-.5,-.85,.12,3);o.ci(0,-.85,.12,3);o.ci(.5,-.85,.12,3);o.rc(-.9,.5,1.8,.3,0,1);});
d('torno','Torno mecânico','ind',2.2,.8,o=>{o.rc(-1.1,-.4,2.2,.8,.03);o.rc(-1.1,-.4,.6,.8,0,1);o.ci(-.62,0,.18);o.ci(-.62,0,.07,3);o.ln(-.45,0,.9,0);o.rc(.2,-.4,.4,.35,0,1);});
d('guindaste','Guindaste','ind',6,1.4,o=>{o.ci(-2.5,0,.6);o.ci(-2.5,0,.32,1);o.rc(-2.9,-.28,.8,.56,0,1);o.pl([-2.2,-.18,2.8,-.05,2.8,.05,-2.2,.18],1,1);o.ln(-2.2,0,2.8,0);o.ci(2.8,0,.14,3);});
d('helideck_h','Marcação do heliponto','mar',8,8,o=>{o.ci(0,0,4);o.ci(0,0,3.3);o.rc(-1.5,-2,.7,4,0,3);o.rc(.8,-2,.7,4,0,3);o.rc(-.8,-.35,1.6,.7,0,3);});
d('torre_flare','Queimador do flare','ind',2,2,o=>{o.ci(0,0,.9);o.ci(0,0,.45,1);o.ln(-.9,0,.9,0);o.ln(0,-.9,0,.9);o.ci(0,0,.15,2);});
d('estoque_caixas','Estante de caixas','ind',2.4,.6,o=>{o.rc(-1.2,-.3,2.4,.6);for(let i=0;i<5;i++){o.rc(-1.15+i*.47,-.25,.43,.5,0,1);}});
d('painel_sinot','Painel sinótico','ind',3,.3,o=>{o.rc(-1.5,-.15,3,.3);for(let i=0;i<14;i++)o.ci(-1.35+i*.21,0,.04,i%5===0?2:3);});
})();
