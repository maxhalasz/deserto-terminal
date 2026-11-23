/* Biblioteca do gerador de layouts padrão das salas (tools/gen_layouts.js -> station-layouts.js).
   Cada sala é montada com itens REAIS do catálogo (station-props*.js), em metros a partir do canto da sala
   (x pra direita, y pra baixo, origem do item = centro). O gerador confere limites, portas e sobreposição. */
global.window=global;
const ROOT=require('path').resolve(__dirname,'../..');
require(ROOT+'/station-data.js');require(ROOT+'/station-props.js');require(ROOT+'/station-props-more.js');require(ROOT+'/station-props-rooms.js');
const S=window.STATION,P=window.StationProps;
const DW={door:1.3,cdoor:1.0,double:2.4,open:2.6,gate:1.8,weld:1.4,hatch:1.0};
const FLOOR=new Set(['tapete','mancha_p','queimado','agua','lama','giz','po','respingos','poca','pegadas','arrasto','ponto','seta','marc','alerta','texto','rachadura','fenda','canaleta','tubo_reto','fita','lacre','cabo_p']);
const SURF=new Set(['par_monitores','terminal_p','microscopio','centrifuga','cafeteira','radio','gravador','amostras','impressora','lampada','kit_med','bandeja','papeis','cracha','chave','lanterna','luz_alerta','caixa_ferr','selo_ns','camera_seg','sirene','alcapao']);
const TUCK=new Set(['cadeira','cad_esc','cad_interr','poltrona','carrinho','lixeira','criado']);
const r2=v=>Math.round(v*100)/100;
const SIDE_ROT={n:0,e:90,s:180,w:270};
function dims(k,rot,sx,sy){const c=P.items[k];if(!c)throw new Error('item desconhecido: '+k);const w=c.w*(sx||1),h=c.h*(sy||1);return (Math.round(rot/90)%2)?[h,w]:[w,h];}

const ALL={},PROBLEMS=[];
function room(id,fn,opt){
  const r=S.roomIndex[id];if(!r)throw new Error('sala inexistente: '+id);
  const w=r.r[2],h=r.r[3],items=[],doors=(r.t==='ext'?[]:(r.d||[])).filter(d=>d[2]!=='weld');let n=0;
  const ctx={id,w,h,r,doors,items,
    at(k,x,y,rot,o){const d=dims(k,rot||0,o&&o.sx,o&&o.sy);const it=Object.assign({k,x:r2(x),y:r2(y),rot:rot||0},o||{});it._id='d'+(++n);items.push(it);return it;},
    nw(k,x,y,rot,o){const d=dims(k,rot||0,o&&o.sx,o&&o.sy);return ctx.at(k,x+d[0]/2,y+d[1]/2,rot,o);},
    /* n itens encostados numa parede, distribuidos entre from e to (ao longo da parede) */
    wall(side,k,cnt,o){o=o||{};const gap=o.gap==null?.06:o.gap,rot=o.rot==null?SIDE_ROT[side]:o.rot,d=dims(k,rot,o.sx,o.sy);
      const horiz=side==='n'||side==='s',len=horiz?w:h,from=o.from==null?.3:o.from,to=o.to==null?len-.3:o.to;
      const pos=o.at||Array.from({length:cnt},(_,i)=>from+(i+.5)*(to-from)/cnt);const out=[];
      pos.forEach(t=>{const x=horiz?t:(side==='w'?d[0]/2+gap:w-d[0]/2-gap),y=horiz?(side==='n'?d[1]/2+gap:h-d[1]/2-gap):t;
        const oo=Object.assign({},o);['gap','rot','from','to','at'].forEach(f=>delete oo[f]);out.push(ctx.at(k,x,y,rot,oo));});return out;},
    row(k,x,y,cnt,dx,dy,rot,o){const out=[];for(let i=0;i<cnt;i++)out.push(ctx.at(k,x+i*dx,y+i*dy,rot,o));return out;},
    grid(k,x,y,cols,rows,dx,dy,rot,o){const out=[];for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)out.push(ctx.at(k,x+i*dx,y+j*dy,rot,o));return out;},
    /* item esticavel de (x1,y1) a (x2,y2) na horizontal ou vertical */
    bar(k,x1,y1,x2,y2,o){const c=P.items[k],len=Math.hypot(x2-x1,y2-y1),vert=Math.abs(y2-y1)>Math.abs(x2-x1);
      return ctx.at(k,(x1+x2)/2,(y1+y2)/2,vert?90:0,Object.assign({sx:r2(len/c.w)},o||{}));},
    lbl(t,x,y,o){return ctx.at('texto',x,y,0,Object.assign({lbl:t},o||{}));}
  };
  fn(ctx);
  check(ctx);
  const out={};items.forEach(it=>{const id2=it._id;delete it._id;Object.keys(it).forEach(f=>{if(it[f]===0&&f!=='x'&&f!=='y'&&f!=='rot')delete it[f];});out[id2]=it;});
  ALL[id]={noeq:true,items:out};
  return ctx;
}
function rectOf(it){const [w,h]=dims(it.k,it.rot||0,it.sx,it.sy);return [it.x-w/2,it.y-h/2,w,h];}
function ov(a,b){const x=Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0]),y=Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1]);return x>0&&y>0?x*y:0;}
function check(ctx){
  const {id,w,h,r,doors,items}=ctx,rnd=r.shape==='round';
  const bad=m=>PROBLEMS.push(id+': '+m);
  const zones=doors.map(([s,t,k])=>{const dw=(DW[k]||1.3)+.2,dep=(DW[k]||1.3)+.3,horiz=s==='n'||s==='s';
    const cx=horiz?w*t:(s==='w'?0:w),cy=horiz?(s==='n'?0:h):h*t;
    if(horiz)return [cx-dw/2,s==='n'?0:h-dep,dw,dep];return [s==='w'?0:w-dep,cy-dw/2,dep,dw];});
  const rects=items.map(rectOf);
  items.forEach((it,i)=>{const b=rects[i],fl=FLOOR.has(it.k);
    if(rnd){const R=w/2-.25,cx=w/2,cy=h/2,far=[[b[0],b[1]],[b[0]+b[2],b[1]],[b[0],b[1]+b[3]],[b[0]+b[2],b[1]+b[3]]].some(p=>Math.hypot(p[0]-cx,p[1]-cy)>R+.05);if(far&&!fl)bad(it.k+'@'+it.x+','+it.y+' fora da sala redonda');}
    else if(b[0]<-.02||b[1]<-.02||b[0]+b[2]>w+.02||b[1]+b[3]>h+.02)bad(it.k+'@'+it.x+','+it.y+' fora da sala ('+w+'x'+h+')');
    if(!fl&&!it.lbl&&it.k!=='escada_f'&&!SURF.has(it.k))zones.forEach(z=>{if(ov(b,z)>.05)bad(it.k+'@'+it.x+','+it.y+' invade a porta');});
    for(let j=i+1;j<items.length;j++){const o=items[j];if(fl||FLOOR.has(o.k)||TUCK.has(it.k)||TUCK.has(o.k)||SURF.has(it.k)||SURF.has(o.k))continue;
      const a=ov(b,rects[j]);if(a>.06)bad(it.k+'@'+it.x+','+it.y+' bate em '+o.k+'@'+o.x+','+o.y+' ('+r2(a)+' m2)');}});
}
/* cabine de 2: porta numa face; "side" = lado em que a porta abre pro corredor (s = porta embaixo, escotilha em cima) */
function cabin(ctx,x0,y0,cw,cd,side,o){o=o||{};
  const fy=side==='n'?(y=>y0+cd-y):(y=>y0+y),rf=side==='n'?180:0;
  const put=(k,x,y,rot,op)=>ctx.at(k,x0+x,fy(y),rot==null?0:(side==='n'?(rot+180)%360:rot),op);
  if(o.vacant){put('cama_camp',.55,1.1,90);put('cama_camp',cw-.55,1.1,90);put('armario',cw/2,.5,0);return;}
  put('beliche',.55,1.15,90);                 // beliche contra a parede esquerda
  put('armario',cw-.4,1.2,90);                // armario na direita
  put('mesa_esc',cw/2+.35,.5,0);put('cad_esc',cw/2+.35,1.25,0);   // mesa sob a escotilha
  put('lavatorio',cw-.45,cd-.35,180);
  if(o.extra)o.extra(put,cw,cd);
}
function cabRow(ctx,o){o=o||{};const c=ctx.r.cab,n=c.n,horiz=true,cw=ctx.w/n;
  for(let i=0;i<n;i++)cabin(ctx,i*cw,0,cw,ctx.h,c.side,{vacant:o.vacant&&(o.vacant===true||o.vacant(i)),extra:o.extra&&((p,w,d)=>o.extra(i,p,w,d))});}
module.exports={S,P,ALL,PROBLEMS,room,cabin,cabRow,dims,r2,ov,rectOf};
