/* Props principais UNICOS por sala (metros locais, origem no canto da sala). Complementa station-eq.js:
   a sala que tem desenho proprio aqui usa ele no lugar do generico do tipo. So o essencial, no mesmo traco tecnico.
   a = {rc(x,y,w,h,rx,fill), ci(x,y,r,fill,dash), ln, tx(x,y,txt,size,bold,mid), hatch(x,y,w,h), arrow, line2} */
(function(){
const Q={};
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
/* pecas */
const box=(a,x,y,w,h)=>{a.rc(x,y,w,h);a.ln(x,y,x+w,y+h);a.ln(x+w,y,x,y+h);};
const pallet=(a,x,y,w,h)=>{a.rc(x,y,w,h);a.ln(x,y+h/2,x+w,y+h/2);a.ln(x+w/2,y,x+w/2,y+h);};
const shelf=(a,x,y,len,vert)=>{if(vert){a.rc(x,y,.6,len,0,1);for(let i=1;i<len;i+=1)a.ln(x,y+i,x+.6,y+i);}else{a.rc(x,y,len,.6,0,1);for(let i=1;i<len;i+=1)a.ln(x+i,y,x+i,y+.6);}};
const bed=(a,x,y,w,h,vert)=>{a.rc(x,y,w,h,.15);if(vert)a.rc(x+.15,y+.15,w-.3,.55,.1,1);else a.rc(x+.15,y+.15,.55,h-.3,.1,1);};
const desk=(a,x,y,w,h,chair)=>{a.rc(x,y,w,h);if(chair!==false)a.ci(x+w/2,y+h+.55,.35);};
const tank=(a,x,y,r)=>{a.ci(x,y,r);a.ci(x,y,r*.4,1);};
const reel=(a,x,y,r)=>{a.ci(x,y,r);a.ci(x,y,r*.55);a.ci(x,y,r*.18,1);};
const rack=(a,x,y,w,h,n)=>{a.rc(x,y,w,h);for(let i=1;i<n;i++)a.ln(x+i*w/n,y,x+i*w/n,y+h);};
const pump=(a,x,y)=>{a.rc(x,y,1.6,.9,.1,1);a.ci(x+2.2,y+.45,.55);a.rc(x+2.9,y+.15,.8,.6);};
const lamp=(a,x,y)=>a.ci(x,y,.16,1);
const extg=(a,x,y)=>a.ci(x,y,.28,1);
const sofa=(a,x,y,w,h)=>{a.rc(x,y,w,h,.25);a.rc(x+.2,y+.2,w-.4,h*.38,.15,1);};
const cabinet=(a,x,y,w,h)=>{a.rc(x,y,w,h,0,1);a.ln(x+w/2,y,x+w/2,y+h);};
const bench=(a,x,y,w)=>{a.rc(x,y,w,.9);a.ci(x+.7,y+.45,.22);a.rc(x+w-1.6,y+.2,1.2,.5,0,1);};

/* ---------- salas de estoque: cada uma com a sua arrumacao ---------- */
Q.md12=(r,a,w,h)=>{shelf(a,.8,.5,w-1.6);shelf(a,.8,h-1.1,w-1.6);a.rc(w/2-1.8,1.4,3.6,.5,0,1);a.rc(w/2-.6,1.4,.8,.5);a.rc(w/2+.5,1.4,.8,.5);a.tx(w/2,h-1.7,'VALVES',4.6,0,1);};
Q.mx_sto1=(r,a,w,h)=>{pallet(a,.8,.8,2.6,2.6);pallet(a,3.8,.8,2.6,2.6);pallet(a,.8,3.8,2.6,2.6);pallet(a,3.8,3.8,2.6,2.6);a.rc(w-2.2,.8,1.4,h-1.6,0,1);a.line2(.5,h-1.4,w-.5,h-1.4);};
Q.mx_sto2=(r,a,w,h)=>{const n=Math.max(2,Math.floor((h-1)/2.5));for(let i=0;i<n;i++){const y=.7+i*(h-1.4)/n;a.rc(1,y,w-2,.65,0,1);for(let k=1;k<w-2;k+=2)a.ln(1+k,y,1+k,y+.65);}a.tx(1.2,h-.3,'BAY 1-'+n,4.4);};
Q.mx_sto3=(r,a,w,h)=>{const n=Math.floor((w-1)/2.2);for(let i=0;i<n;i++)reel(a,1.5+i*2.2,1.4,.85);shelf(a,.8,h-1.2,w-1.6);shelf(a,.8,h-3,w-1.6);a.rc(w-2.4,3.2,1.6,2,0,1);};
Q.mx_sto4=(r,a,w,h)=>{for(let j=0;j<Math.floor((h-1)/1.9);j++)for(let i=0;i<Math.floor((w-1)/1.9);i++)a.rc(.7+i*1.9,.7+j*1.9,1.6,1.6);};
Q.mb_prov=(r,a,w,h)=>{const cw=w*.45;a.rc(.5,.5,cw,h-1);a.hatch(.5,.5,cw,h-1);a.tx(cw/2+.5,h/2,'COLD',4.8,1,1);
  const x0=cw+1.5;for(let i=0;i<3;i++)shelf(a,x0,.7+i*2.1,w-x0-3.2);pallet(a,x0,h-2.2,1.6,1.6);pallet(a,x0+2,h-2.2,1.6,1.6);a.rc(w-2.4,h-2.4,1.6,1.6,0,1);a.ci(w-1.6,h-.8,.3);};
Q.wd16=(r,a,w,h)=>{for(let i=0;i<5;i++)a.ln(.6,1.2+i*(h-2.4)/4,w-.6,1.2+i*(h-2.4)/4);for(let k=1;k<w;k+=2.5)a.rc(k,.5,.5,h-1,0,1);a.rc(.5,h/2-.6,w-1,1.2,0,0);};
Q.wd15=(r,a,w,h)=>{shelf(a,.6,.6,w-1.2);reel(a,2,h-2.2,1.2);reel(a,5.4,h-2.2,1.2);a.ci(w-2,h-2,.7);a.ci(w-3.7,h-2,.7);a.rc(w-3.4,1.6,2.4,1.2,0,1);};
Q.cd14=(r,a,w,h)=>{const n=Math.max(2,Math.floor((w-2)/3.4));for(let i=0;i<n;i++){shelf(a,1.2+i*3.4,1,h-5,true);shelf(a,1.2+i*3.4+1.2,1,h-5,true);}a.rc(1,h-3.4,w-2,2.4);a.hatch(1,h-3.4,w-2,2.4);a.tx(w/2,h-2,'CAGE',4.6,1,1);};
Q.cd_spr=(r,a,w,h)=>{const n=Math.floor((h-1)/3.4);for(let i=0;i<n;i++){reel(a,w*.34,1.8+i*3.4,1.3);}shelf(a,w-1.4,.8,h-1.6,true);shelf(a,w-2.5,.8,h-1.6,true);a.tx(.6,h-.4,'M22',4.4);};
Q.lqE7=(r,a,w,h)=>{for(let i=0;i<4;i++){a.rc(.7,.9+i*1.1,1.1,.8,0,1);a.ln(.7,.9+i*1.1,1.8,1.7+i*1.1);}a.hatch(3,.8,w-3.8,2.4);extg(a,w-1,h-1);extg(a,w-2,h-1);a.ci(w/2,h-2.6,.9);a.ci(w/2,h-2.6,.4,1);};
Q.lqC7=(r,a,w,h)=>{a.rc(.6,.6,2,1.2,.1);a.ci(1,2.1,.25);a.ci(2.2,2.1,.25);a.rc(w-1.5,.6,.9,2.4,0,1);};
Q.lqB5=(r,a,w,h)=>{for(let i=0;i<3;i++)a.rc(.7+i*1.3,.7,1.1,3.2,.5);a.rc(w-2.4,h-2.2,1.8,1.6);a.rc(w-3.6,h-2.2,1.1,1.6);};
Q.lb_sto=(r,a,w,h)=>{a.hatch(.7,.7,3,h-1.4);a.hatch(4,.7,2.4,h-1.4);for(let i=0;i<4;i++)a.rc(7+i*1.1,.7,.9,h-1.4,0,1);a.hatch(w-3.6,.7,2.9,2.4);};
Q.la_pan=(r,a,w,h)=>{shelf(a,.5,.6,h-1.2,true);shelf(a,w-1.1,.6,h-1.2,true);a.rc(w/2-.5,h-1.9,1,1.3,0,1);};

/* ---------- suites e escritorios: um arranjo diferente cada ---------- */
Q.ms_cal=(r,a,w,h)=>{bed(a,.6,h-2.6,2,2,0);cabinet(a,w-1.8,.5,1.2,2.4);desk(a,w/2-1.6,.8,3.2,1.2);a.rc(.6,.5,w*.35,.4,0,1);a.tx(1,1.5,'PROD',4.2);sofa(a,w-4.2,h-2,3,1.3);a.rc(w/2-.8,h/2,1.6,.8);};
Q.ms_les=(r,a,w,h)=>{bed(a,w-2.8,h-2.2,2.2,1.7,0);bench(a,.6,.6,w*.5);cabinet(a,w-1.8,.5,1.2,2);desk(a,.8,h-2.2,2.6,1);a.rc(w/2,h/2,.9,.9,.1,1);};
Q.ms_chl=(r,a,w,h)=>{bed(a,.6,.6,2.1,2.5,1);rack(a,w-3.6,.6,3,.8,3);a.ci(w-3.1,1.5,.28);a.ci(w-2.1,1.5,.28);a.ci(w-1.1,1.5,.28);desk(a,w/2-1.4,h-2.2,2.8,1.1);a.tx(w/2,h-2.9,'DECO TABLE',3.8,0,1);cabinet(a,.6,h-2.6,1.2,2);};
Q.ls_gun=(r,a,w,h)=>{desk(a,w/2-1.8,1,3.6,1.5);bed(a,.6,h-2.4,2.2,1.9,0);sofa(a,w-3.4,h-1.9,2.8,1.3);a.rc(w-1.9,.5,1.3,.6,0,1);a.tx(w-1.3,1.3,'VHF',3.8,0,1);cabinet(a,.6,.5,1.2,2);};
Q.ls_aru=(r,a,w,h)=>{a.rc(w/2-2.3,h/2-1.1,4.6,2.2,.3);for(let i=0;i<4;i++){a.ci(w/2-1.7+i*1.15,h/2-1.7,.3);a.ci(w/2-1.7+i*1.15,h/2+1.7,.3);}bed(a,.6,.6,2.3,2,0);a.rc(w-2.4,.6,1.7,1.1,0,1);cabinet(a,w-1.8,h-2.6,1.2,2);};
Q.la_fos=(r,a,w,h)=>{desk(a,.6,.6,2.8,1.1);a.rc(w-2.6,.6,2,2.6,.15);a.rc(w-2.4,.8,.8,.8,.2,1);shelf(a,.6,h-1.2,w-1.2);cabinet(a,w-1.8,h-3,1.2,1.7);a.rc(.6,h-3.1,2.1,1.5,.1);};
Q.md3=(r,a,w,h)=>{bench(a,.6,.6,w-1.4);bench(a,.6,h-1.6,w*.55);for(let i=0;i<3;i++)a.rc(w-2.6,2+i*1.4,1.9,1.1,0,0);a.rc(.8,h/2-.6,2.6,1.2,0,1);for(let i=0;i<5;i++)a.rc(w*.2+i*1.2,2.2,.9,.5);};
Q.mx_gas1=(r,a,w,h)=>{a.rc(.7,.6,w-1.4,1.2,0,1);for(let i=0;i<Math.floor((w-2)/1.1);i++)lamp(a,1.3+i*1.1,1.2);rack(a,.8,h-2.4,3.6,1.1,4);a.ci(w-2,h-2,.7);a.ci(w-2,h-2,.28,1);};
Q.mx_gas2=(r,a,w,h)=>{a.rc(.7,.6,2,h-1.2,0,1);for(let i=0;i<Math.floor((h-2)/1.2);i++)lamp(a,1.7,1.2+i*1.2);a.rc(w-3,.8,2.2,1.4,0,1);rack(a,w/2-1.6,h/2-.5,3.2,1,4);for(let i=0;i<3;i++)tank(a,w-2.4+i*0,3+i*1.5,.5);};
Q.mb_ups=(r,a,w,h)=>{for(let i=0;i<Math.floor((w-2)/1.3);i++){a.rc(.7+i*1.3,.5,1.15,1.1,0,1);lamp(a,1.27+i*1.3,1.05);}for(let j=0;j<3;j++)rack(a,1,h-5+j*1.6,w*.5,1.1,Math.floor(w*.5/1.1));a.rc(w-2.8,h-3.6,2.1,2.8,0,1);};
Q.lqD5=(r,a,w,h)=>{const n=3,cw=(w-1.2)/n;for(let i=0;i<n;i++){const x=.6+i*cw;a.ln(x,.6,x,h-.6);a.rc(x+.4,.9,cw-1.4,1,0,0);a.ci(x+cw/2-.3,2.7,.3);a.rc(x+.4,h-2.2,cw-1.4,1,0,0);a.ci(x+cw/2-.3,h-3.1,.3);}a.ln(.6,h/2,w-.6,h/2);};
Q.lqD3=(r,a,w,h)=>{desk(a,w/2-1.2,h*.3,2.4,1.4);cabinet(a,.5,.6,1.1,2.4);a.rc(w-1.9,h-2.6,1.4,1.6,0,1);a.ci(w-1.2,h-1.8,.45);a.rc(.6,h-1.6,2.4,.9,0,1);};
Q.lqD11=(r,a,w,h)=>{a.rc(.6,.5,w-1.2,.35,0,1);a.rc(w/2-1.6,h/2-.7,3.2,1.4);for(let i=0;i<4;i++)a.ci(w/2-1.2+i*.8,h/2-1.3,.22);cabinet(a,w-1.8,h-2.3,1.2,1.8);cabinet(a,w-3.2,h-2.3,1.2,1.8);};
Q.lqD12=(r,a,w,h)=>{desk(a,.6,.8,2.4,1.1);desk(a,w-3,.8,2.4,1.1);shelf(a,.6,h-1.2,w-1.2);a.rc(w/2-.4,h/2,.8,.6,0,1);a.ci(w/2,h/2+1.3,.3);};

/* ---------- EPI, bombas, guindastes, deck ---------- */
Q.md_ppe=(r,a,w,h)=>{for(let i=0;i<Math.floor((w-1)/1.2);i++)a.rc(.6+i*1.2,.5,1.1,.7,0,1);rack(a,.6,h-2.2,w*.5,1.4,5);a.rc(w-2.4,h-2.4,1.8,1.8,.2);a.ci(w-1.5,h-1.5,.5);};
Q.wd7=(r,a,w,h)=>{shelf(a,.6,.6,w-1.2);shelf(a,.6,h-1.2,w-1.2);a.rc(w/2-1,h/2-.8,2,1.6,.2);a.ln(w/2-1,h/2,w/2+1,h/2);a.ci(w/2,h/2,.2,1);};
Q.cd_scs=(r,a,w,h)=>{for(let i=0;i<Math.floor((w-1)/.9);i++)a.rc(.6+i*.9,.5,.7,.5,.2,1);for(let i=0;i<Math.floor((w-1)/.9);i++)a.ln(.95+i*.9,1.05,.95+i*.9,2.6);a.hatch(.6,h-3,w*.45,2.3);a.rc(w-3,h-2.6,2.3,1.9,0,1);a.ci(w-1.8,h-1.7,.45);};
Q.mx_foam=(r,a,w,h)=>{tank(a,w*.28,h*.45,Math.min(2.4,h*.28));tank(a,w*.58,h*.45,Math.min(2.4,h*.28));a.rc(w-2.8,h*.3,1.9,2.4,0,1);a.ln(w*.28,h*.45-2.4,w*.28,.5);a.ln(w*.58,h*.45-2.4,w*.58,.5);a.ln(w*.28,.5,w*.58,.5);};
Q.cd_swp=(r,a,w,h)=>{for(let i=0;i<3;i++){const y=2.5+i*(h-5)/2;a.rc(1.5,y-1.1,w-3,2.2);a.ci(w*.3,y,.9);a.ci(w*.3,y,.35,1);a.rc(w*.55,y-.6,2.4,1.2,.2,1);a.ln(w-1.5,y,w-.5,y);}a.ln(w-.5,2,w-.5,h-2);};
Q.wd8=(r,a,w,h)=>{a.ci(w/2,h/2,Math.min(w,h)*.28);a.ci(w/2,h/2,Math.min(w,h)*.11,1);a.ln(w/2,h/2,w*.94,h*.12);a.ln(w/2,h/2,w*.94,h*.12);a.rc(w/2-1.3,h/2-1,2,1.6,.2);};
Q.wd9=(r,a,w,h)=>{a.ci(w/2,h/2,Math.min(w,h)*.28);a.ci(w/2,h/2,Math.min(w,h)*.11,1);a.ln(w/2,h/2,w*.08,h*.2);a.rc(w/2+.3,h/2-.4,1.7,1.6,.2);a.ci(w*.1,h*.82,.5,1);};
Q.wd10=(r,a,w,h)=>{a.ci(w/2,h/2,Math.min(w,h)*.28);a.ci(w/2,h/2,Math.min(w,h)*.11,1);a.ln(w/2,h/2,w*.9,h*.88);a.rc(w/2-2,h/2+.2,1.8,1.5,.2);a.ln(w*.2,h*.12,w*.38,h*.3);};
Q.wd17=(r,a,w,h)=>{pallet(a,1,1,3,2.4);pallet(a,4.6,1,3,2.4);a.hatch(8.6,1,4,2.4);a.rc(w-5,1,3.4,2.4,.2);a.ci(w-3.3,2.2,.7);a.rc(1,h-3.2,w*.35,2.2,0,1);for(let i=0;i<4;i++)a.ci(w*.55+i*1.6,h-2,.6);};
Q.wd18=(r,a,w,h)=>{a.rc(1,1,3.2,2.6);a.hatch(1,1,3.2,2.6);a.ci(6.5,2.2,1.1);a.ci(6.5,2.2,.45,1);a.ci(9.6,2.2,1.1);a.ci(9.6,2.2,.45,1);for(let i=0;i<3;i++)a.rc(w-9+i*2.8,h-3.4,2.4,2.4);a.rc(w*.38,h-2.6,3,1.6,0,1);};
Q.mc_chg=(r,a,w,h)=>{for(let i=0;i<Math.floor((w-1)/.75);i++)a.rc(.5+i*.75,.4,.65,.4,0,1);a.rc(1,h/2-.5,w-2,1.1,0,0);for(let i=0;i<Math.floor((w-3)/1.5);i++)a.ci(1.8+i*1.5,h/2+.05,.3);a.rc(w-3.2,h-2.2,2.6,1.6,0,1);a.rc(.6,h-2.2,2.6,1.6,0,1);a.line2(w*.62,.4,w*.62,h-.4);};

/* ---------- maquinas e processo ---------- */
Q.cd_air=(r,a,w,h)=>{for(let i=0;i<2;i++){const x=1.5+i*(w/2-.5);a.rc(x,2,w/2-2.4,3);a.ci(x+1.5,3.5,.8);a.ci(x+1.5,3.5,.3,1);a.rc(x+w/2-4,2.6,1.2,1.8,0,1);}a.rc(w-3,h-3.4,2.2,2.6,.3);a.ln(1.5,h-1.4,w-1.5,h-1.4);a.rc(1.5,h-3,1.4,1.4,0,1);};
Q.cd_wks=(r,a,w,h)=>{bench(a,.6,.6,w-1.2);bench(a,.6,h-1.6,w*.4);a.ci(w*.62,h*.55,1.3);a.ci(w*.62,h*.55,.5,1);a.rc(w-3.4,h-3.2,2.6,2.2,0,1);a.rc(w*.28,h*.45,3.2,1,.2);a.ci(1.2,h/2,.45,1);a.ci(2.2,h/2,.45,1);};
Q.mb_inc=(r,a,w,h)=>{a.rc(1,1,w*.4,h-2,.3);a.ci(1+w*.2,h*.5,.9);a.rc(w*.55,1.2,w*.4-.5,1.4,0,1);a.rc(w*.55,h-2.6,w*.4-.5,1.4);a.ci(w*.8,h*.45,.6,1);a.ln(1+w*.4,h*.5,w*.55,h*.45);};
Q.md_scba=(r,a,w,h)=>{for(let i=0;i<Math.floor((w-1)/1.05);i++){a.rc(.6+i*1.05,.5,.9,.9,.2,1);a.ci(1.05+i*1.05,1.95,.35);}a.rc(.8,h-2.4,w*.5,1.5,0,1);for(let i=0;i<4;i++)a.ci(w*.62+i*.95,h-1.7,.35);};
Q.mb_hvac=(r,a,w,h)=>{for(let i=0;i<2;i++){a.rc(1+i*(w/2-.5),1,w/2-2,h*.5);for(let k=1;k<4;k++)a.ln(1+i*(w/2-.5),1+k*h*.125,w/2-1+i*(w/2-.5),1+k*h*.125);a.ci(w/4+i*(w/2),1+h*.25,.9);}a.rc(1,h-2.6,w-2,1.2,0,1);a.line2(w/2,1,w/2,h-.5);};
Q.mb_wtr=(r,a,w,h)=>{for(let i=0;i<4;i++)tank(a,2.5+i*(w-5)/3,h*.35,Math.min(1.9,h*.22));a.ln(1.5,h*.7,w-1.5,h*.7);a.rc(w-4,h-2.2,2.6,1.4,0,1);a.ci(2,h-1.5,.5);a.rc(3.5,h-2.2,1.5,1.4,.1,1);};
Q.mb_stp=(r,a,w,h)=>{a.rc(1,1,w*.55,h-2);a.hatch(1,1,w*.55,h-2);a.ci(1+w*.27,h/2,.4,1);a.rc(w*.7,1.4,2.2,1.6,0,1);a.ci(w*.82,h-2.2,.8);a.ln(1+w*.55,h/2,w*.82,h-3);};
Q.cd_lube=(r,a,w,h)=>{for(let j=0;j<2;j++)for(let i=0;i<Math.floor((w-1)/1.6);i++)a.ci(1.4+i*1.6,1.6+j*1.6,.62);a.rc(.8,h-3.2,w-1.6,2.4,0,1);a.line2(.6,h-3.5,w-.6,h-3.5);a.ci(w-2,h-1.8,.5,1);};
Q.lqC8=(r,a,w,h)=>{a.rc(.4,.4,w-.8,.9,0,1);a.rc(.5,h-1.6,1.4,.9);a.rc(w-2,h-1.6,1.4,.9);};
Q.lqB6=(r,a,w,h)=>{for(let i=0;i<Math.floor((w-1)/1.5);i++){a.rc(.6+i*1.5,.5,1.2,1.2);a.ci(1.2+i*1.5,1.1,.28);}a.hatch(.6,h-3,w-1.2,2.4);a.line2(.6,h/2,w-.6,h/2);};
Q.la_cln=(r,a,w,h)=>{shelf(a,.5,.5,w-1,false);shelf(a,.5,h-1.1,w*.5);a.rc(w-3.6,h-2.4,2.8,1.8,.2);a.ci(w-3.1,h-.5,.25);a.ci(w-1.4,h-.5,.25);a.ci(2,h/2,.6);a.ln(1.4,h/2,2.6,h/2);};
Q.cd_pwt=(r,a,w,h)=>{for(let i=0;i<3;i++){tank(a,3+i*(w-6)/2,3.5,Math.min(2.3,h*.2));}a.ln(1.5,7.4,w-1.5,7.4);for(let i=0;i<3;i++)a.ln(3+i*(w-6)/2,3.5+2.3,3+i*(w-6)/2,7.4);pump(a,2,h-3.4);pump(a,w/2-1,h-3.4);a.rc(w-4,h-3.4,2.8,2.4,0,1);a.tx(2,h-.5,'PWT',4.6,1);};
Q.cd_egen=(r,a,w,h)=>{a.rc(2,2,w*.45,h*.4,.3);for(let k=1;k<5;k++)a.ln(2+k*w*.09,2,2+k*w*.09,2+h*.4);a.ci(2+w*.5,2+h*.2,1.3);a.ci(2+w*.5,2+h*.2,.5,1);a.rc(w-7,2,5,3,.2);a.ci(w-4.5,3.5,.8);a.rc(2,h-4,5.5,2.4,.4);a.ci(4,h-2.8,.6,1);a.rc(w-5,h-4.5,3.2,3,0,1);a.line2(1,h*.6,w-1,h*.6);a.tx(w-5,h-.8,'ESD',4.4,1);};

window.STATION_EQ_ROOM=Q;
})();
