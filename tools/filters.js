/* ===================== Motor de filtros (WebGL, fabric.filters.BaseFilter) =====================
   Padrão confirmado ao vivo na fabric.js 6.4.3 (não documentado igual nas buscas —
   verificado direto no prototype antes de escrever isto): cada filtro é uma classe
   com `static defaults`, `static uniformLocations` (array de nomes — getUniformLocations
   já vem pronto da BaseFilter, só precisa declarar os nomes), `getFragmentSource()`
   retornando a string do shader, `sendUniformData(gl, uniformLocations)` fazendo os
   `gl.uniformXf(...)`, e `applyTo2d({imageData:{data,width,height}})` como fallback
   pra quando não tem WebGL. Testado ponta-a-ponta com um filtro de vinheta antes de
   escrever os outros (renderizou certinho).

   Técnicas usadas, pesquisadas antes de implementar (sessão 2026-09-16):
   - Chromatic aberration: offset de UV por canal RGB escalado pela distância ao
     centro (maximmcnair.com/webgl-chromatic-aberration, geeks3d.com).
   - Vignette: 1-smoothstep(inner,outer,dist(uv,0.5)) (shader-learn.com/vignette).
   - Film grain: ruído simplex 2D de Ashima/McEwan (webgl-noise, MIT), modulado por
     luminância — não é ruído uniforme, grão real varia menos em áreas claras.
   - Lens distortion: radius = pow(radius, power) em coordenadas polares
     (prideout.net/barrel-distortion — power>1 barril, <1 almofada).
   - Color grading: lift/gamma/gain padrão ASC-CDL, a mesma matemática usada em
     ferramentas profissionais tipo DaVinci Resolve.
   - Bloom/glow e grunge&dirt NÃO são filtros de shader aqui — são compostos como
     objetos Fabric sobrepostos com blend mode nativo (mais simples e mais barato
     que sampler duplo em GLSL; ver editor.js `applyBloom`/`applyGrungeOverlay`). */

// Ashima/McEwan webgl-noise 2D simplex noise (MIT license) — implementação canônica,
// reproduzida sem alteração de fórmula.
const GLSL_SNOISE = `
vec3 mod289_3(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec2 mod289_2(vec2 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec3 permute289(vec3 x){ return mod289_3(((x*34.0)+1.0)*x); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289_2(i);
  vec3 p = permute289(permute289(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

class ChromaticAberrationFilter extends fabric.filters.BaseFilter {
  getFragmentSource(){
    return `precision highp float;
    uniform sampler2D uTexture; uniform float uAmount; varying vec2 vTexCoord;
    void main(){
      vec2 dir = vTexCoord - 0.5;
      vec2 off = dir * uAmount;
      float r = texture2D(uTexture, vTexCoord - off).r;
      vec4 c0 = texture2D(uTexture, vTexCoord);
      float b = texture2D(uTexture, vTexCoord + off).b;
      gl_FragColor = vec4(r, c0.g, b, c0.a);
    }`;
  }
  applyTo2d({imageData:{data,width,height}}){
    const amt = this.amount;
    const src = new Uint8ClampedArray(data);
    for (let y=0;y<height;y++) for (let x=0;x<width;x++){
      const dx=(x/width-0.5), dy=(y/height-0.5);
      const ox = Math.round(dx*amt*width), oy = Math.round(dy*amt*height);
      const i = (y*width+x)*4;
      const rx = Math.min(width-1,Math.max(0,x-ox)), ry = Math.min(height-1,Math.max(0,y-oy));
      const bx = Math.min(width-1,Math.max(0,x+ox)), by = Math.min(height-1,Math.max(0,y+oy));
      data[i]   = src[(ry*width+rx)*4];
      data[i+2] = src[(by*width+bx)*4+2];
    }
  }
}
ChromaticAberrationFilter.type = 'ChromaticAberration';
ChromaticAberrationFilter.defaults = {amount:0.01};
ChromaticAberrationFilter.uniformLocations = ['uAmount'];
ChromaticAberrationFilter.prototype.sendUniformData = function(gl,loc){ gl.uniform1f(loc.uAmount, this.amount); };
fabric.classRegistry.setClass(ChromaticAberrationFilter, 'ChromaticAberration');

class VignetteFilter extends fabric.filters.BaseFilter {
  getFragmentSource(){
    return `precision highp float;
    uniform sampler2D uTexture; uniform float uAmount; uniform float uInner; varying vec2 vTexCoord;
    void main(){
      vec4 color = texture2D(uTexture, vTexCoord);
      float d = distance(vTexCoord, vec2(0.5));
      float v = 1.0 - smoothstep(uInner, 0.78, d) * uAmount;
      color.rgb *= v;
      gl_FragColor = color;
    }`;
  }
  applyTo2d({imageData:{data,width,height}}){
    for (let y=0;y<height;y++) for (let x=0;x<width;x++){
      const dx=(x/width-0.5), dy=(y/height-0.5);
      const d=Math.sqrt(dx*dx+dy*dy);
      const t = Math.min(1,Math.max(0,(d-this.inner)/(0.78-this.inner)));
      const v = 1.0 - t*this.amount;
      const i=(y*width+x)*4;
      data[i]*=v; data[i+1]*=v; data[i+2]*=v;
    }
  }
}
VignetteFilter.type = 'Vignette';
VignetteFilter.defaults = {amount:0.6, inner:0.25};
VignetteFilter.uniformLocations = ['uAmount','uInner'];
VignetteFilter.prototype.sendUniformData = function(gl,loc){ gl.uniform1f(loc.uAmount,this.amount); gl.uniform1f(loc.uInner,this.inner); };
fabric.classRegistry.setClass(VignetteFilter, 'Vignette');

class FilmGrainFilter extends fabric.filters.BaseFilter {
  getFragmentSource(){
    return `precision highp float;
    uniform sampler2D uTexture; uniform float uAmount; uniform float uSize; uniform float uSeed;
    varying vec2 vTexCoord;
    ${GLSL_SNOISE}
    void main(){
      vec4 color = texture2D(uTexture, vTexCoord);
      float lum = dot(color.rgb, vec3(0.299,0.587,0.114));
      float n = snoise(vTexCoord*uSize + uSeed)*0.5 + snoise(vTexCoord*uSize*2.3 - uSeed*1.7)*0.25;
      float amt = uAmount * (1.0 - lum*0.55);
      color.rgb += n*amt;
      gl_FragColor = color;
    }`;
  }
  applyTo2d({imageData:{data,width,height}}){
    for (let y=0;y<height;y++) for (let x=0;x<width;x++){
      const i=(y*width+x)*4;
      const lum=(data[i]*0.299+data[i+1]*0.587+data[i+2]*0.114)/255;
      const n=(Math.random()-0.5)*2;
      const amt=this.amount*255*(1-lum*0.55);
      data[i]+=n*amt; data[i+1]+=n*amt; data[i+2]+=n*amt;
    }
  }
}
FilmGrainFilter.type = 'FilmGrain';
FilmGrainFilter.defaults = {amount:0.08, size:400, seed:0};
FilmGrainFilter.uniformLocations = ['uAmount','uSize','uSeed'];
FilmGrainFilter.prototype.sendUniformData = function(gl,loc){ gl.uniform1f(loc.uAmount,this.amount); gl.uniform1f(loc.uSize,this.size); gl.uniform1f(loc.uSeed,this.seed); };
fabric.classRegistry.setClass(FilmGrainFilter, 'FilmGrain');

class NoiseFilter extends fabric.filters.BaseFilter {
  getFragmentSource(){
    return `precision highp float;
    uniform sampler2D uTexture; uniform float uAmount; uniform float uSeed; varying vec2 vTexCoord;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)) + uSeed)*43758.5453); }
    void main(){
      vec4 color = texture2D(uTexture, vTexCoord);
      float n = hash(floor(vTexCoord*900.0)) - 0.5;
      color.rgb += n*uAmount;
      gl_FragColor = color;
    }`;
  }
  applyTo2d({imageData:{data,width,height}}){
    for (let i=0;i<data.length;i+=4){
      const n=(Math.random()-0.5)*this.amount*255;
      data[i]+=n; data[i+1]+=n; data[i+2]+=n;
    }
  }
}
NoiseFilter.type = 'Noise';
NoiseFilter.defaults = {amount:0.1, seed:0};
NoiseFilter.uniformLocations = ['uAmount','uSeed'];
NoiseFilter.prototype.sendUniformData = function(gl,loc){ gl.uniform1f(loc.uAmount,this.amount); gl.uniform1f(loc.uSeed,this.seed); };
fabric.classRegistry.setClass(NoiseFilter, 'Noise');

class LensDistortionFilter extends fabric.filters.BaseFilter {
  getFragmentSource(){
    return `precision highp float;
    uniform sampler2D uTexture; uniform float uPower; varying vec2 vTexCoord;
    void main(){
      vec2 p = vTexCoord*2.0-1.0;
      float theta = atan(p.y, p.x);
      float radius = pow(length(p), uPower);
      p = vec2(radius*cos(theta), radius*sin(theta));
      vec2 uv = 0.5*(p+1.0);
      if (uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){ gl_FragColor = vec4(0.0,0.0,0.0,0.0); return; }
      gl_FragColor = texture2D(uTexture, uv);
    }`;
  }
  applyTo2d(options){ /* efeito geométrico — sem fallback 2D simples, mantém imagem original */ }
}
LensDistortionFilter.type = 'LensDistortion';
LensDistortionFilter.defaults = {power:1.15};
LensDistortionFilter.uniformLocations = ['uPower'];
LensDistortionFilter.prototype.sendUniformData = function(gl,loc){ gl.uniform1f(loc.uPower,this.power); };
fabric.classRegistry.setClass(LensDistortionFilter, 'LensDistortion');

class ScanlinesFilter extends fabric.filters.BaseFilter {
  getFragmentSource(){
    return `precision highp float;
    uniform sampler2D uTexture; uniform float uIntensity; uniform float uDensity; varying vec2 vTexCoord;
    void main(){
      vec4 color = texture2D(uTexture, vTexCoord);
      float scan = sin(vTexCoord.y*uDensity)*0.5+0.5;
      color.rgb *= 1.0 - uIntensity*(1.0-scan);
      gl_FragColor = color;
    }`;
  }
  applyTo2d({imageData:{data,width,height}}){
    for (let y=0;y<height;y++){
      const scan = Math.sin(y/height*this.density)*0.5+0.5;
      const f = 1.0 - this.intensity*(1-scan);
      for (let x=0;x<width;x++){
        const i=(y*width+x)*4;
        data[i]*=f; data[i+1]*=f; data[i+2]*=f;
      }
    }
  }
}
ScanlinesFilter.type = 'Scanlines';
ScanlinesFilter.defaults = {intensity:0.35, density:900};
ScanlinesFilter.uniformLocations = ['uIntensity','uDensity'];
ScanlinesFilter.prototype.sendUniformData = function(gl,loc){ gl.uniform1f(loc.uIntensity,this.intensity); gl.uniform1f(loc.uDensity,this.density); };
fabric.classRegistry.setClass(ScanlinesFilter, 'Scanlines');

class VHSFilter extends fabric.filters.BaseFilter {
  getFragmentSource(){
    return `precision highp float;
    uniform sampler2D uTexture; uniform float uCA; uniform float uScan; uniform float uNoise; uniform float uSeed;
    varying vec2 vTexCoord;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)) + uSeed)*43758.5453); }
    void main(){
      vec2 dir = vTexCoord - 0.5;
      vec2 off = dir * uCA;
      float r = texture2D(uTexture, vTexCoord - off).r;
      vec4 c0 = texture2D(uTexture, vTexCoord);
      float b = texture2D(uTexture, vTexCoord + off).b;
      vec3 col = vec3(r, c0.g, b);
      float scan = sin(vTexCoord.y*800.0)*0.5+0.5;
      col *= 1.0 - uScan*(1.0-scan);
      float n = hash(floor(vTexCoord*700.0)) - 0.5;
      col += n*uNoise;
      col.g += 0.015;
      gl_FragColor = vec4(col, c0.a);
    }`;
  }
  applyTo2d({imageData:{data,width,height}}){
    for (let y=0;y<height;y++){
      const scan = Math.sin(y/height*800)*0.5+0.5;
      const f = 1.0 - this.uScan*(1-scan);
      for (let x=0;x<width;x++){
        const i=(y*width+x)*4;
        const n=(Math.random()-0.5)*this.uNoise*255;
        data[i]=(data[i]*f)+n; data[i+1]=(data[i+1]*f)+n+4; data[i+2]=(data[i+2]*f)+n;
      }
    }
  }
}
VHSFilter.type = 'VHS';
VHSFilter.defaults = {uCA:0.012, uScan:0.3, uNoise:0.08, uSeed:0};
VHSFilter.uniformLocations = ['uCA','uScan','uNoise','uSeed'];
VHSFilter.prototype.sendUniformData = function(gl,loc){
  gl.uniform1f(loc.uCA,this.uCA); gl.uniform1f(loc.uScan,this.uScan);
  gl.uniform1f(loc.uNoise,this.uNoise); gl.uniform1f(loc.uSeed,this.uSeed);
};
fabric.classRegistry.setClass(VHSFilter, 'VHS');

class ColorGradeFilter extends fabric.filters.BaseFilter {
  getFragmentSource(){
    return `precision highp float;
    uniform sampler2D uTexture;
    uniform vec3 uLift; uniform vec3 uGamma; uniform vec3 uGain;
    varying vec2 vTexCoord;
    void main(){
      vec4 color = texture2D(uTexture, vTexCoord);
      vec3 c = color.rgb;
      c = c * (1.0 + uGain - uLift) + uLift;
      c = pow(max(c, vec3(0.0)), max(vec3(1.0) - uGamma, vec3(0.01)));
      gl_FragColor = vec4(clamp(c,0.0,1.0), color.a);
    }`;
  }
  applyTo2d({imageData:{data}}){
    const [lr,lg,lb]=this.lift, [gr,gg,gb]=this.gamma, [nr,ng,nb]=this.gain;
    for (let i=0;i<data.length;i+=4){
      let r=data[i]/255, g=data[i+1]/255, b=data[i+2]/255;
      r = r*(1+nr-lr)+lr; g = g*(1+ng-lg)+lg; b = b*(1+nb-lb)+lb;
      r = Math.pow(Math.max(r,0), Math.max(1-gr,0.01));
      g = Math.pow(Math.max(g,0), Math.max(1-gg,0.01));
      b = Math.pow(Math.max(b,0), Math.max(1-gb,0.01));
      data[i]=Math.min(255,Math.max(0,r*255));
      data[i+1]=Math.min(255,Math.max(0,g*255));
      data[i+2]=Math.min(255,Math.max(0,b*255));
    }
  }
}
ColorGradeFilter.type = 'ColorGrade';
ColorGradeFilter.defaults = {lift:[0,0,0], gamma:[0,0,0], gain:[0,0,0]};
ColorGradeFilter.uniformLocations = ['uLift','uGamma','uGain'];
ColorGradeFilter.prototype.sendUniformData = function(gl,loc){
  gl.uniform3fv(loc.uLift,this.lift); gl.uniform3fv(loc.uGamma,this.gamma); gl.uniform3fv(loc.uGain,this.gain);
};
fabric.classRegistry.setClass(ColorGradeFilter, 'ColorGrade');

class FringingFilter extends fabric.filters.BaseFilter {
  getFragmentSource(){
    return `precision highp float;
    uniform sampler2D uTexture; uniform float uAmount; varying vec2 vTexCoord;
    const float EPS = 0.0022;
    void main(){
      vec4 center = texture2D(uTexture, vTexCoord);
      float lx = dot(texture2D(uTexture, vTexCoord+vec2(EPS,0.0)).rgb, vec3(0.299,0.587,0.114))
               - dot(texture2D(uTexture, vTexCoord-vec2(EPS,0.0)).rgb, vec3(0.299,0.587,0.114));
      float ly = dot(texture2D(uTexture, vTexCoord+vec2(0.0,EPS)).rgb, vec3(0.299,0.587,0.114))
               - dot(texture2D(uTexture, vTexCoord-vec2(0.0,EPS)).rgb, vec3(0.299,0.587,0.114));
      float edge = clamp(length(vec2(lx,ly))*6.0, 0.0, 1.0);
      vec2 off = normalize(vec2(lx,ly)+1e-4) * edge * uAmount;
      float r = texture2D(uTexture, vTexCoord+off).r;
      float b = texture2D(uTexture, vTexCoord-off).b;
      gl_FragColor = vec4(r, center.g, b, center.a);
    }`;
  }
  applyTo2d(options){ /* efeito sutil de borda — sem fallback 2D, mantém imagem original */ }
}
FringingFilter.type = 'Fringing';
FringingFilter.defaults = {amount:0.015};
FringingFilter.uniformLocations = ['uAmount'];
FringingFilter.prototype.sendUniformData = function(gl,loc){ gl.uniform1f(loc.uAmount,this.amount); };
fabric.classRegistry.setClass(FringingFilter, 'Fringing');

// Meio-tom (reprodução de jornal antigo) — amostra a cor no centro de cada célula
// e desenha um ponto cujo raio cresce com o escuro (mais tinta = mais escuro),
// técnica clássica de halftone/screen de impressão.
class HalftoneFilter extends fabric.filters.BaseFilter {
  getFragmentSource(){
    return `precision highp float;
    uniform sampler2D uTexture; uniform float uSize; varying vec2 vTexCoord;
    void main(){
      vec2 cellUV = floor(vTexCoord/uSize)*uSize + uSize*0.5;
      vec4 color = texture2D(uTexture, cellUV);
      float lum = dot(color.rgb, vec3(0.299,0.587,0.114));
      vec2 local = (vTexCoord - floor(vTexCoord/uSize)*uSize)/uSize - 0.5;
      float d = length(local);
      float r = sqrt(max(0.0,1.0-lum))*0.5;
      float dotM = 1.0 - smoothstep(r-0.06, r+0.06, d);
      vec3 bw = mix(vec3(0.90,0.88,0.82), vec3(0.10,0.09,0.08), dotM);
      gl_FragColor = vec4(bw, color.a);
    }`;
  }
  applyTo2d({imageData:{data,width,height}}){
    const cell = Math.max(2, Math.round(this.size*width));
    for (let cy=0; cy<height; cy+=cell){
      for (let cx=0; cx<width; cx+=cell){
        const ci = (Math.min(height-1,cy+Math.floor(cell/2))*width + Math.min(width-1,cx+Math.floor(cell/2)))*4;
        const lum = (data[ci]*0.299+data[ci+1]*0.587+data[ci+2]*0.114)/255;
        const r = Math.sqrt(Math.max(0,1-lum))*0.5*cell;
        for (let y=cy;y<Math.min(height,cy+cell);y++){
          for (let x=cx;x<Math.min(width,cx+cell);x++){
            const dx=x-(cx+cell/2), dy=y-(cy+cell/2);
            const dot = Math.sqrt(dx*dx+dy*dy)<=r;
            const i=(y*width+x)*4;
            const v = dot?26:230;
            data[i]=v; data[i+1]=v*0.98; data[i+2]=v*0.93;
          }
        }
      }
    }
  }
}
HalftoneFilter.type = 'Halftone';
HalftoneFilter.defaults = {size:0.012};
HalftoneFilter.uniformLocations = ['uSize'];
HalftoneFilter.prototype.sendUniformData = function(gl,loc){ gl.uniform1f(loc.uSize,this.size); };
fabric.classRegistry.setClass(HalftoneFilter, 'Halftone');

// Idade do papel — tinta sépia progressiva; não dá pra "rejuvenescer" uma foto real,
// só envelhecer mais em cima da base dela (mesmo raciocínio da v1, agora como filtro
// ajustável ao vivo em vez de baked-in).
class AgeTintFilter extends fabric.filters.BaseFilter {
  getFragmentSource(){
    return `precision highp float;
    uniform sampler2D uTexture; uniform float uAmount; varying vec2 vTexCoord;
    void main(){
      vec4 color = texture2D(uTexture, vTexCoord);
      vec3 tint = vec3(0.86, 0.72, 0.44);
      color.rgb = mix(color.rgb, color.rgb*tint, uAmount);
      float dark = max(0.0, uAmount-0.55)*1.3;
      color.rgb = mix(color.rgb, color.rgb*0.72, dark);
      gl_FragColor = color;
    }`;
  }
  applyTo2d({imageData:{data}}){
    const a=this.amount, dark=Math.max(0,a-0.55)*1.3;
    for (let i=0;i<data.length;i+=4){
      data[i]=data[i]*(1-a)+data[i]*0.86*a; data[i]*= (1-dark)+0.72*dark;
      data[i+1]=data[i+1]*(1-a)+data[i+1]*0.72*a; data[i+1]*=(1-dark)+0.72*dark;
      data[i+2]=data[i+2]*(1-a)+data[i+2]*0.44*a; data[i+2]*=(1-dark)+0.72*dark;
    }
  }
}
AgeTintFilter.type = 'AgeTint';
AgeTintFilter.defaults = {amount:0.4};
AgeTintFilter.uniformLocations = ['uAmount'];
AgeTintFilter.prototype.sendUniformData = function(gl,loc){ gl.uniform1f(loc.uAmount,this.amount); };
fabric.classRegistry.setClass(AgeTintFilter, 'AgeTint');
