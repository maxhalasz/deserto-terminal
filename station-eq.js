/* Biblioteca de equipamento por sala (metros locais, origem no canto da sala). Desenho de linha fina, nunca domina a planta. */
(function(){
const EQ={};
// a = {rc(x,y,w,h,rx,fill), ci(x,y,r,fill), ln(x1,y1,x2,y2), pl(points), tx(x,y,txt,size), dash}
EQ.cabins=(r,a,w,h)=>{const n=Math.floor((w-1.6)/4.1);
  for(let i=0;i<n;i++){const x=.8+i*4.1;
    a.rc(x,.8,4.1,6.2);a.rc(x+.35,1.2,.9,2.0,0,1);a.rc(x+1.4,1.2,.9,2.0,0,1);a.rc(x+2.9,.9,.8,1.0);
    a.rc(x,h-7,4.1,6.2);a.rc(x+.35,h-3.6,.9,2.0,0,1);a.rc(x+1.4,h-3.8,.9,2.0,0,1);a.rc(x+2.9,h-1.9,.8,1.0);}
  a.ln(.8,7.2,w-.8,7.2);a.ln(.8,h-7.2,w-.8,h-7.2);
  [[.25,.5],[.5,.5],[.75,.5]].forEach(([fx,fy])=>{const x=w*fx,y=h*fy;a.ci(x,y,.85);[[-1.5,0],[1.5,0],[0,-1.5],[0,1.5]].forEach(d=>a.ci(x+d[0],y+d[1],.35));});
  a.rc(1.2,10.4,8,1.6,.3);a.rc(1.2,h-12,8,1.6,.3);a.rc(w-9.2,10.4,8,1.6,.3);};
EQ.dorm=(r,a,w,h)=>{const rows=Math.max(2,Math.round(h/3.5)),st=h/rows;
  for(let i=1;i<rows;i++)a.ln(0,i*st,w,i*st);
  for(let i=0;i<rows;i++){const y=i*st;a.rc(.4,y+.5,.9,Math.min(2,st-1),0,1);a.rc(w-1.6,y+.5,1.1,.7);if(w>9)a.rc(2.4,y+.5,.9,Math.min(2,st-1),0,1);}};
EQ.bath=(r,a,w,h)=>{const n=Math.max(2,Math.floor(w/1.4));for(let i=0;i<n;i++){const x=.3+i*(w-.6)/n;a.rc(x,.4,(w-.6)/n-.2,1.3);a.ci(x+((w-.6)/n-.2)/2,1.05,.22);}
  if(h>4){a.rc(.4,h-1.2,Math.min(w-.8,3.4),.8);a.ci(1.2,h-.8,.2);}};
EQ.wash=EQ.bath;
EQ.lockers=(r,a,w,h)=>{const n=Math.floor((w-1)/1.03);for(let i=0;i<n;i++)a.rc(.5+i*1.03,.4,.95,.7,0,1);
  a.rc(2.5,2.4,w-5,.5,0,1);a.rc(1,h-2.6,w-2,1.9);for(let i=1;i<w-2;i++)a.ln(1+i,h-2.6,1+i,h-.7);a.line2(w*.68,1.4,w*.68,h-.3);};
EQ.console=(r,a,w,h)=>{a.rc(1,.5,w-2,.7,0,1);for(let i=0;i<w-3;i++)a.ci(1.8+i*1.3,.85,.18,1);
  [1.2,w/2+.4].forEach(x=>{a.rc(x,h-2.6,w/2-1.6,1.1);a.rc(x+.4,h-2.95,.9,.4,0,1);a.rc(x+1.7,h-2.95,.9,.4,0,1);a.ci(x+(w/2-1.6)/2,h-.9,.3);});};
EQ.elec=(r,a,w,h)=>{a.rc(.8,.5,w-2.2,1.2);a.ci(2,1.1,.3);a.rc(.5,h-1.7,5.2,1,0,1);for(let i=0;i<4;i++)a.rc(w-1.8,2.4+i*1.4,1.5,1.3);a.ci(w-4,h-2.4,1.1);a.ci(w-4,h-2.4,.4);};
EQ.store=(r,a,w,h)=>{const hor=w>=h;if(hor){const n=Math.max(2,Math.floor((h-.8)/2.6));for(let i=0;i<n;i++){a.rc(1,.8+i*2.6,w-2,.7,0,1);}}else{const n=Math.max(2,Math.floor((w-.8)/2.6));for(let i=0;i<n;i++)a.rc(.8+i*2.6,1,.7,h-2,0,1);}};
EQ.stair=(r,a,w,h)=>{const vert=h>=w,n=vert?Math.floor(h/.55):Math.floor(w/.55);
  for(let i=1;i<n;i++){vert?a.ln(.2,i*h/n,w-.2,i*h/n):a.ln(i*w/n,.2,i*w/n,h-.2);}
  const dn=r.dir==='dn';a.arrow(vert?w/2:w*.15,vert?h*.85:h/2,vert?w/2:w*.85,vert?h*.15:h/2,dn);};
EQ.wellheads=(r,a,w,h)=>{const cols=Math.floor((w-3)/2.9)+1,rows=Math.floor((h-8)/3.1)+1,x0=(w-(cols-1)*2.9)/2;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const x=x0+i*2.9,y=3.2+j*3.1;a.ci(x,y,.58,1);a.ln(x-.55,y,x+.55,y);a.ln(x,y-.55,x,y+.55);}
  const yh=h-5.2;a.ln(1.5,yh,w-1.5,yh);a.ln(1.5,yh+.6,w-1.5,yh+.6);for(let i=0;i<cols;i++){a.ln(x0+i*2.9,3.2+(rows-1)*3.1+.6,x0+i*2.9,yh);a.ci(x0+i*2.9,yh+.3,.28,1);}};
EQ.mud=(r,a,w,h)=>{for(let i=0;i<3;i++){a.rc(1.5+i*5.8,1.8,5,2.2);a.ln(1.5+i*5.8,2.9,6.5+i*5.8,2.9);}
  a.rc(1.5,7,w/2-2,5.2,.4);a.rc(w/2+.5,7,w/2-2,5.2,.4);a.ln(1.5,9.6,w/2-.5,9.6);a.ln(w/2+.5,9.6,w-1.5,9.6);
  [[4.2,h-4.4],[8.4,h-4.4]].forEach(([x,y])=>{a.ci(x,y,1.2);a.ci(x,y,.45,1);});a.ln(4,4,4,7);a.ln(9,4,9,7);a.ln(14,4,14,7);a.rc(w-6.6,h-5.6,4.4,2.6,0,1);};
EQ.separators=(r,a,w,h)=>{a.rc(2,2.4,w-4,3.4,1.7);a.rc(5,5.8,1.2,.7,0,1);a.rc(w-6.5,5.8,1.2,.7,0,1);a.rc(2,8.2,w-4,3.4,1.7);a.rc(5,11.6,1.2,.7,0,1);a.rc(w-6.5,11.6,1.2,.7,0,1);
  const ys=h-4.6;[w*.25,w*.55,w*.82].forEach(x=>{a.ci(x,ys,1.5);a.ln(x-1.5,ys,x+1.5,ys);a.ln(x,ys-1.5,x,ys+1.5);a.ln(x,11.6+.7,x,ys-1.5);});a.ln(w/2,5.8,w/2,8.2);};
EQ.sealed=(r,a,w,h)=>{EQ.separators(r,a,w,h);};
EQ.compressors=(r,a,w,h)=>{const n=3,st=(h-2)/n;for(let i=0;i<n;i++){const y=1+i*st;a.rc(1,y,w-2,st-1);a.ci(3.6,y+(st-1)/2,1.5);a.ci(3.6,y+(st-1)/2,.5,1);a.rc(w-5.8,y+1.2,4.4,st-3.4);a.ln(5.2,y+(st-1)/2,w-5.8,y+(st-1)/2);}};
EQ.workshop=(r,a,w,h)=>{a.rc(1,1,w-2,1.1);a.rc(1.2,5,w-3,1.2,0.3);a.ln(1.2,5.6,w-1.8,5.6);a.ci(w-3,10,1.1);a.rc(1,h-3,w-2,1.1);a.rc(1,h-6.5,3,1);for(let i=0;i<14;i++)a.ci(2+((i*37)%(w-4)),8+((i*53)%6),.12,1);};
EQ.utilities=(r,a,w,h)=>{a.rc(2,2,w/2-3,6);a.rc(3,3,w/2-5,4);a.rc(w/2+1,2,w/2-3,6);a.rc(w/2+2,3,w/2-5,4);a.hatch(w/2+1,2,w/2-3,6);a.ln(2,10,w-2,10);a.ln(2,10.6,w-2,10.6);for(let i=0;i<4;i++)a.ci(4+i*4.2,15,1.1);a.rc(w-7,13,5,5.5);};
EQ.heli=(r,a,w,h)=>{const R=Math.min(w,h)/2;a.ci(w/2,h/2,R*.86);a.ci(w/2,h/2,R*.62);a.tx(w/2,h/2+3.2,'H',9,1,.5);
  a.ci(w/2,h/2,R*.97,0,1);};
EQ.engine=(r,a,w,h)=>{a.rc(2,2,10,h-4);a.ci(7,h/2,2.2);a.ci(7,h/2,.7,1);a.ci(w-8,h*.3,3.2);a.ci(w-8,h*.75,3.2);a.ln(12,h/2,w-12,h*.3);a.ln(12,h/2,w-12,h*.75);for(let i=0;i<6;i++)a.ln(3,3+i*1.3,11,3+i*1.3);};
EQ.containers=(r,a,w,h)=>{const rows=Math.floor((h-2)/3.8);for(let j=0;j<rows;j++){const y=1.5+j*3.8;if(j%3===2){a.ln(.8,y+1.2,w-.8,y+1.2);continue;}
  a.rc(1.2,y,w/2-1.8,2.4,0,1);a.rc(w/2+.6,y,w/2-1.8,2.4,0,1);a.ln(1.2+(w/2-1.8)/2,y,1.2+(w/2-1.8)/2,y+2.4);a.ln(w/2+.6+(w/2-1.8)/2,y,w/2+.6+(w/2-1.8)/2,y+2.4);}a.ci(w-3,h-3,.5);a.ln(w-3,h-3,w-12,h-10);};
EQ.tower=(r,a,w,h)=>{a.rc(3,3,w-6,h-6);a.ln(3,3,w-3,h-3);a.ln(w-3,3,3,h-3);a.rc(5.2,5.2,w-10.4,h-10.4);a.ci(w/2,h/2,.9,1);};
EQ.vent=(r,a,w,h)=>{a.ci(w/2,h/2,3.2,0);a.ci(w/2,h/2,1.5,1);a.ci(w/2,h/2,5.6,0,1);a.ln(w/2-8,h/2,w/2-5.6,h/2);a.ln(w/2+5.6,h/2,w/2+8,h/2);a.ln(w/2,h/2+5.6,w/2,h-1);};
EQ.lifeboats=(r,a,w,h)=>{const n=4,cw=(w-2)/n;for(let i=0;i<n;i++){const x=1+i*cw+.3;a.rc(x,2,cw-.6,h-4,Math.min(1.8,(cw-.6)/2));a.ci(x+(cw-.6)/2,h*.35,.6);a.ln(x+.3,h-4,x+cw-.9,h-4);}};
EQ.ppe=(r,a,w,h)=>{const big=w>=20,rows=Math.max(1,Math.floor((h-1)/(big?3.2:2.4))),cols=Math.max(2,Math.floor(((big?w-9:w)-2)/1.4));for(let j=0;j<rows;j++){const y=(big?2.5:1.6)+j*(big?3.2:2.4);a.ln(1,y,(big?w-9:w-1),y);for(let i=0;i<cols;i++)a.ci(1.6+i*1.4,y,.35,1);}if(big){a.rc(w-7,6,5,6.4);a.ln(w-7,6,w-2,12.4);}};
EQ.muster=(r,a,w,h)=>{a.ci(w/2,h/2,Math.min(w,h)*.34);a.tx(w/2,h/2+4,'3',12,1,.5);};
EQ.crane=(r,a,w,h)=>{a.ci(w/2,h/2,2.4);a.ci(w/2,h/2,.8,1);a.ln(w/2,h/2,w-.6,.8);};
EQ.flare=(r,a,w,h)=>{a.ci(w/2,h/2,2.4);for(let k=0;k<8;k++){const t=k*Math.PI/4;a.ln(w/2+Math.cos(t)*2.4,h/2+Math.sin(t)*2.4,w/2+Math.cos(t)*4.6,h/2+Math.sin(t)*4.6);}};
EQ.old=(r,a,w,h)=>{a.rc(3,3,w-6,h-6);a.ln(3,3,w-3,h-3);a.ci(w/2,h/2,5);a.rc(w-9,3,6,5);};
EQ.sauna=(r,a,w,h)=>{for(let i=0;i<7;i++)a.ln(1,2+i*.9,w-1,2+i*.9);a.rc(3,10,9,7);a.ln(3,13,12,13);a.ln(3,15,12,15);a.ci(w-6,12,1.2);a.ci(w-6,12,.5,1);a.rc(w-11,17,8,3.6);};
EQ.cargo=(r,a,w,h)=>{const nj=Math.max(1,Math.floor((h-3)/4.8));for(let j=0;j<nj;j++)for(let i=0;i<4;i++){if((i+j)%3===2)continue;const x=2+i*(w-4)/4+.3,y=1.6+j*4.8;a.rc(x,y,(w-4)/4-1,2.6,0,1);a.ln(x+((w-4)/4-1)/2,y,x+((w-4)/4-1)/2,y+2.6);}
  a.ln(1,h-2,w-1,h-2);a.ln(1,h-2.6,w-1,h-2.6);a.rc(w/2-1.4,h-3.4,2.8,1.8,0,1);a.hatch(w-9,2,7,7);};
EQ.xmas=(r,a,w,h)=>{const cols=Math.floor((w-3)/3.2),rows=3,x0=(w-(cols-1)*3.2)/2;for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const x=x0+i*3.2,y=3+j*5.6;a.ci(x,y,.8,1);a.ln(x-.8,y,x+.8,y);a.ln(x,y-.8,x,y+.8);}
  a.ln(1,h-2.6,w-1,h-2.6);a.ln(1,h-2,w-1,h-2);};
EQ.drying=(r,a,w,h)=>{[3.5,7.8].forEach(y=>{a.ln(1,y,w-1,y);for(let i=0;i<Math.floor((w-2)/.9);i++)a.rc(1+i*.9,y-.1,.5,1.6,0,1);});a.rc(1,h-2.2,w-2,1.2);};
EQ.desal=(r,a,w,h)=>{[3.2,8.4].forEach(x=>{a.ci(x,3.2,1.7);a.ci(x,3.2,.6,1);});a.ci(13,3.2,1.7);a.ln(1,7.2,w-1,7.2);a.ln(1,7.8,w-1,7.8);a.rc(1,9.8,w-2,2);a.ci(4,h-1.6,.9);};
EQ.switch=(r,a,w,h)=>{const n=Math.floor((h-2)/1.4);for(let i=0;i<n;i++){a.rc(.4,1+i*1.4,1.5,1.25);a.rc(w-1.9,1+i*1.4,1.5,1.25);}a.ln(w/2,.5,w/2,h-.5);};
EQ.moonpool=(r,a,w,h)=>{const s=7;a.rc((w-s)/2,(h-s)/2,s,s,0,1);for(let i=1;i<6;i++)a.ln((w-s)/2+.4,(h-s)/2+i*s/6,(w-s)/2+s-.4,(h-s)/2+i*s/6);
  a.ln(1.5,3,w-1.5,3);a.ln(1.5,3.7,w-1.5,3.7);a.rc(w/2-2,2.5,4,2.2,0,1);a.ln((w-s)/2-2,(h-s)/2,(w-s)/2-2,(h+s)/2);a.ln((w+s)/2+2,(h-s)/2,(w+s)/2+2,(h+s)/2);};
EQ.dive=(r,a,w,h)=>{const cols=Math.max(2,Math.floor((w-1)/1.6)),rows=h>6?2:1;for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)a.ci(1.2+i*1.6,1.4+j*1.5,.5,1);if(h>8){a.rc(w-5,1,4,3);a.rc(1,h-4,6,1.2);a.rc(w-4,h-4.5,2.5,2.5,0,1);}};
EQ.paint=(r,a,w,h)=>{for(let j=0;j<3;j++)for(let i=0;i<6;i++)a.ci(1.6+i*1.8,2+j*1.9,.55,(i+j)%3===0?1:0);a.ln(1,h-3,w-1,h-3);a.rc(1,h-2.4,w-2,1.2,0,1);};
EQ.winch=(r,a,w,h)=>{a.ci(w*.4,h/2,3.4);a.ci(w*.4,h/2,1.4);a.ci(w*.4,h/2,.4,1);a.rc(w-4.2,2,2.8,4);a.ci(w-2.8,3,.3,1);a.ci(w-2.8,4.6,.3,1);};
EQ.pumps=(r,a,w,h)=>{[2.5,6.8].forEach(x=>{a.rc(x,2,3,5,.5);a.ci(x+1.5,4.5,1.1);a.rc(x+.5,7,2,1.8);});a.ln(1,h-1.6,w-1,h-1.6);a.ln(1,h-1.1,w-1,h-1.1);};
EQ.rov=(r,a,w,h)=>{[2,w/2+.5].forEach((x,i)=>{a.rc(x,2.2,w/2-2.5,4.2,.6);a.ci(x+1.4,4.3,.8);a.ci(x+(w/2-2.5)-1.4,4.3,.8);a.ln(x,4.3,x+w/2-2.5,4.3);});a.rc(1,h-3.4,w-2,1.2);for(let i=0;i<3;i++)a.rc(2+i*2.6,h-4.2,1.8,.7,0,1);};
EQ.waste=(r,a,w,h)=>{a.ci(2.4,2.4,.8);a.ci(4.2,2.4,.8);a.ci(2.4,4.1,.8);a.rc(w-5,h-4.6,3.4,2.6);a.ln(1,h-1.8,w-1,h-1.8);a.ci(w-3,2.5,1);};
EQ.lift=(r,a,w,h)=>{a.rc(.5,.5,w-1,3);a.ln(.5,.5,w-.5,3.5);a.ln(w-.5,.5,.5,3.5);const n=7;for(let i=1;i<n;i++)a.ln(.4,3.8+i*(h-4.4)/n,w-.4,3.8+i*(h-4.4)/n);};
EQ.hatch=(r,a,w,h)=>{a.ci(w/2,Math.min(h/2,4),.9);a.ln(w/2-.9,Math.min(h/2,4),w/2+.9,Math.min(h/2,4));a.ln(w/2,Math.min(h/2,4)-.9,w/2,Math.min(h/2,4)+.9);};
EQ.ahu=(r,a,w,h)=>{[[.8,1],[.8,9]].forEach(([x,y])=>{a.rc(x,y,w-1.6,6.4);a.ci(x+2.2,y+3.2,1.5);a.ci(x+4.8,y+3.2,1.5);a.ln(x+7,y,x+7,y+6.4);a.ln(x+7.6,y,x+7.6,y+6.4);});};
EQ.antenna=(r,a,w,h)=>{a.ci(w/2,h/2,.6,1);for(let k=0;k<6;k++){const t=k*Math.PI/3;a.ln(w/2,h/2,w/2+Math.cos(t)*7,h/2+Math.sin(t)*2.1);}a.ci(w*.28,h/2,1.6);a.ln(w*.28-1.6,h/2,w*.28+1.6,h/2);a.ln(w/2,h/2,w-1,h-.8);};
EQ.comms=(r,a,w,h)=>{a.rc(.8,.8,w-1.6,1.1);a.rc(.8,.8,1.1,h-2.6);a.rc(2.2,.4,.8,.5,0,1);a.rc(3.4,.4,.8,.5,0,1);a.ci(3.4,3.4,.35);for(let i=0;i<3;i++)a.ln(w-.6,2+i*1.4,w-.6,2.8+i*1.4);};
EQ.cameras=(r,a,w,h)=>{for(let j=0;j<3;j++)for(let i=0;i<3;i++)a.rc(.9+i*(w-1.8)/3,.5+j*.9,(w-1.8)/3-.15,.75,0,(i+j)%3===0?1:0);a.rc(1,h-3.6,w-2,1.2);a.ci(w/2,h-1.7,.4);};
EQ.office=(r,a,w,h)=>{a.rc(1,1.2,Math.min(w-2,4),1.5);a.ci(Math.min(w-2,4)/2+1,3.6,.4);a.rc(w-1.8,h-4,1.3,3);if(h>8){a.rc(1,h-3,Math.min(w-2,4),1.5);}};
EQ.meeting=(r,a,w,h)=>{const tw=Math.min(w-2,4.4);a.rc((w-tw)/2,1.4,tw,h-2.8,.5);for(let i=0;i<5;i++){a.ci((w-tw)/2-.5,2.2+i*(h-4.4)/4,.32);a.ci((w+tw)/2+.5,2.2+i*(h-4.4)/4,.32);}a.rc(w/2-.8,.4,1.6,.5,0,1);};
EQ.archive=(r,a,w,h)=>{const n=6,cw=(w-1.2)/n;for(let i=0;i<n;i++)a.rc(.6+i*cw,1,cw-.15,h-2,0,i<4?1:0);a.ln(.6,.8,w-.6,.8);a.ln(.6,h-.8,w-.6,h-.8);};
EQ.pantry=(r,a,w,h)=>{a.rc(.5,.5,w-1,1.1);a.ci(w*.35,1.05,.4);a.rc(w*.62,.7,.7,.7,0,1);a.ci(w*.5,h-1.1,.4,1);};
EQ.training=(r,a,w,h)=>{a.ci(w/2,h-2.1,.4);a.rc(w/2-.4,h-1.7,.8,1.2,0,1);for(let i=0;i<8;i++)a.ci(1+i*(w-2)/7,1.4,.3);a.rc(w-3.8,2.2,2.8,.5,0,1);a.rc(1,3.4,Math.min(5,w-2),.9);};
EQ.study=(r,a,w,h)=>{a.rc(1,1.2,w/2-1.4,1.3);a.rc(w/2+.4,1.2,w/2-1.4,1.3);a.rc(1,h-1.7,w-2,.9,0,1);for(let i=0;i<4;i++)a.ci(1.6+i*1.2,2.9,.28);};
EQ.quiet=(r,a,w,h)=>{a.rc(1,h-3.1,Math.min(5,w-2),2.2,.5);a.ci(w-2.4,h-2,.8);a.ci(w-1.4,1.8,.5);};
EQ.linen=(r,a,w,h)=>{for(let j=0;j<3;j++)a.rc(.8,.8+j*1.7,w-1.6,.9,0,1);a.rc(w-2.5,h-2.4,1.8,1.5);};
EQ.tv=(r,a,w,h)=>{for(let i=0;i<4;i++)a.rc(.6+i*1.2,h-1.8-i*.1,.8,.8,0,1);a.rc(.8,.5,2.6,.7,0,1);a.ci(w-1.6,2,.35);};
EQ.plaster=(r,a,w,h)=>{for(let i=1;i<9;i++)a.ln(i*w/9,.4,i*w/9,h-.4);a.ln(.4,h-.4,w-.4,h-.4);a.ln(w-.3,.5,w-.3,h-.5);};
EQ.dining=(r,a,w,h)=>{const nr=Math.max(1,Math.min(4,Math.floor((h-1)/2.2)));for(let j=0;j<nr;j++){const y=1.2+j*2.2;a.rc(1.2,y,w-2.4,.9);for(let i=0;i<Math.floor((w-2)/1.3);i++){a.ci(1.6+i*1.3,y-.4,.2,1);a.ci(1.6+i*1.3,y+1.3,.2,j===nr-1&&nr>3?0:1);}}};
EQ.galley=(r,a,w,h)=>{a.rc(.5,.5,w-1,.9);a.rc(.5,.5,.9,h-1);for(let i=0;i<4;i++)a.rc(1.8+i*1.2,.7,1,.6,0,1);a.rc(w/2-1,h/2-.5,2,1,0,1);a.ci(w-1.4,h-1.6,.5);};
EQ.cold=(r,a,w,h)=>{for(let j=0;j<3;j++)a.rc(.5,.8+j*1.6,w-1,.7,0,1);a.ln(w/2,.4,w/2,h-.6);};
EQ.lounge=(r,a,w,h)=>{a.rc(1,1,5.6,1.7,.4);a.rc(1,1,1.7,5,.4);a.rc(w-4.6,.6,3.6,.6,0,1);a.ci(5,6,1.1);a.ci(w-3,5.5,.55);a.ci(w-1.8,6.6,.55);};
EQ.laundry=(r,a,w,h)=>{for(let i=0;i<4;i++){a.rc(.8+i*(w-1.6)/6,.6,(w-1.6)/6-.2,1.6);a.ci(.8+i*(w-1.6)/6+((w-1.6)/6-.2)/2,1.4,.5);}for(let i=4;i<6;i++){a.rc(.8+i*(w-1.6)/6,.6,(w-1.6)/6-.2,1.6,0,1);}a.ln(1,h-1.4,w-1,h-1.4);};
EQ.infirmary=(r,a,w,h)=>{a.rc(.8,.8,1,2.2,0,1);a.rc(2.4,.8,1,2.2,0,1);a.rc(w-2.4,.6,1.8,1.2);a.ci(w-1.4,h-1.1,.4);a.rc(w-4.8,h-1.8,1.4,1.1,0,1);};

/* ---- cabines pequenas (2 pessoas, janela pro lado de fora) ---- */
EQ.cabinrow=(r,a,w,h)=>{const c=r.cab,n=c.n,horiz=(c.side==='n'||c.side==='s');
  const cw=(horiz?w:h)/n,dep=horiz?h:w,toward=(c.side==='s'||c.side==='e')?1:-1; // lado da porta
  for(let i=1;i<n;i++){horiz?a.wall(i*cw,0,i*cw,h):a.wall(0,i*cw,w,i*cw);}
  for(let i=0;i<n;i++){
    const o=i*cw;
    // beliche: encostado numa parede lateral, cabeca na parede da janela
    const bx=horiz?o+.35:0,by=horiz?0:o+.35;
    if(horiz){const wy=toward>0?.4:dep-2.5;a.rc(o+.35,wy,.95,2.1,0,1);a.rc(o+1.4,wy,.95,2.1,0);a.ln(o+.35,wy+.55,o+1.3,wy+.55);
      a.rc(o+cw-1.2,toward>0?.4:dep-1.4,.8,1.0);a.rc(o+cw-1.9,toward>0?.4:dep-1.2,.7,.7,0,1);}
    else{const wx=toward>0?.4:dep-2.5;a.rc(wx,o+.35,2.1,.95,0,1);a.rc(wx,o+1.4,2.1,.95,0);a.ln(wx+.55,o+.35,wx+.55,o+1.3);
      a.rc(toward>0?.4:dep-1.4,o+cw-1.2,1.0,.8);a.rc(toward>0?.4:dep-1.2,o+cw-1.9,.7,.7,0,1);}
  }};
EQ.roundlounge=(r,a,w,h)=>{const c=w/2;a.ci(c,c,1.6);a.ci(c,c,.5,1);
  for(let k=0;k<8;k++){const t=k*Math.PI/4+Math.PI/8,rr=3.1;a.ci(c+Math.cos(t)*rr,c+Math.sin(t)*rr,.5,1);}
  for(let k=0;k<6;k++){const t=k*Math.PI/3+Math.PI/6;const x=c+Math.cos(t)*(c-1.9),y=c+Math.sin(t)*(c-1.9);a.rc(x-1.1,y-.5,2.2,1,.4);}
  a.ci(c,c,c-1.0,0,1);};
EQ.gym=(r,a,w,h)=>{for(let i=0;i<4;i++){a.rc(1+i*2.6,1,1.0,2.2,0,1);a.ln(1.5+i*2.6,1,1.5+i*2.6,3.2);}
  for(let i=0;i<3;i++){a.rc(1.2+i*3.2,6,2.6,.7,0,1);a.ci(1.6+i*3.2,6.35,.35);a.ci(3.8+i*3.2,6.35,.35);}
  a.rc(1,h-4,6,3,.3);a.ln(1,h-2.5,7,h-2.5);a.ci(w-3,h-3,1.2);a.ci(w-3,h-3,.4,1);};
EQ.instr=(r,a,w,h)=>{a.rc(.6,.6,w-1.2,1.0);for(let i=0;i<6;i++)a.rc(1+i*(w-2)/6,.9,.7,.4,0,1);a.rc(.6,h-1.6,w-1.2,1.0);a.ci(w/2,h/2,.5);};
EQ.xfmr=(r,a,w,h)=>{const n=3,cw=(w-1.4)/n;for(let i=0;i<n;i++){const x=.7+i*cw;a.rc(x,.8,cw-.4,h-1.6);for(let k=0;k<5;k++)a.ln(x+.4,1.4+k*(h-3)/4,x+cw-.8,1.4+k*(h-3)/4);}};
EQ.lab=(r,a,w,h)=>{a.rc(.6,.6,w-1.2,1.0);a.rc(w/2-1.6,h/2-.5,3.2,1.0);for(let i=0;i<3;i++)a.ci(1.6+i*1.6,h-1.6,.4,1);a.rc(w-2.4,h-2.6,1.8,2,0,1);a.ci(w/2,2.6,.35);};
EQ.inj=(r,a,w,h)=>{for(let i=0;i<3;i++){a.ci(2+i*3.6,2.6,1.2);a.ci(2+i*3.6,2.6,.4,1);}a.ln(.8,5.4,w-.8,5.4);for(let i=0;i<3;i++){a.rc(1.4+i*3.6,6.4,2.4,1.6);a.ci(2.6+i*3.6,7.2,.5);}};
EQ.cable=(r,a,w,h)=>{for(let j=0;j<2;j++)for(let i=0;i<Math.floor((w-1)/2.6);i++){a.ci(1.6+i*2.6,1.8+j*2.8,1.0);a.ci(1.6+i*2.6,1.8+j*2.8,.35,1);}};
EQ.clinic=(...x)=>EQ.infirmary(...x);EQ.hpu=(...x)=>EQ.pumps(...x);EQ.ballast=(...x)=>EQ.console(...x);EQ.chemstore=(...x)=>EQ.paint(...x);
EQ.crewday=(...x)=>EQ.lounge(...x);

window.STATION_EQ=EQ;
})();
