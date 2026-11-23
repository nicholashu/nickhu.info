/* A continuous oil-film surface driven only by elapsed time. Pointer input
   adds a small perturbation; scrolling never changes the material phase. */
const surface = document.querySelector('.oil-surface');
let canvas = surface?.querySelector('canvas');
// Sampled wallpaper colours, with broad neutral fields and narrow coloured fringes.
// Shared stops keep the GPU and software versions in the same palette.
// The neutral base matches --page in portfolio.css and oil-surface.css.
const hexColour = hex => [1,3,5].map(i => Number.parseInt(hex.slice(i,i+2),16)/255);
const baseHex = '#c3c5be';
const base = hexColour(baseHex);
const ridgeTint = [.84,.85,.81];
const filmStops = [
  [0, baseHex], [.32, baseHex], [.44, '#a7b3a1'], [.56, '#a7b3a1'],
  [.62, '#a2b893'], [.68, '#a2b893'], [.73, '#b6adc6'], [.78, '#a1a6b9'],
  [.84, baseHex], [.94, baseHex], [.97, '#c3bb99'], [1, baseHex]
].map(([at, hex]) => ({at, colour: hexColour(hex)}));
const glVector = colour => `vec3(${colour.map(v=>v.toFixed(6)).join(',')})`;
const filmSpectrum = filmStops.slice(1).map((stop,i) => {
  const before=filmStops[i];
  return `if(h<=${stop.at.toFixed(6)}) return mix(${glVector(before.colour)},${glVector(stop.colour)},smoothstep(${before.at.toFixed(6)},${stop.at.toFixed(6)},h));`;
}).join('\n');
const flowRate = .16;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

if (surface && canvas) mountSurface();

function createGLRenderer(target) {
  const gl = target.getContext('webgl', {
    alpha: false, antialias: false, depth: false, stencil: false,
    powerPreference: 'low-power', preserveDrawingBuffer: false
  });
  if (!gl) return null;
  const vertex = `attribute vec2 a_position;
    varying vec2 v_uv;
    void main() { v_uv=a_position*.5+.5; gl_Position=vec4(a_position,0.,1.); }`;
  const fragment = `precision highp float;
    varying vec2 v_uv;
    uniform vec2 u_size;
    uniform vec2 u_pointer;
    uniform float u_time;
    uniform float u_touch;
    vec3 spectrum(float value) {
      float h=fract(value);
      ${filmSpectrum}
      return ${glVector(base)};
    }
    void main() {
      float aspect=u_size.x/u_size.y;
      vec2 p=(v_uv-.5)*2.; p.x*=aspect;
      vec2 q=p;
      q.x+=.28*sin(p.y*2.4)+.11*sin(p.y*5.3+p.x*.7);
      q.y+=.24*cos(p.x*2.0)+.10*sin(p.x*4.1-p.y*.6);
      float t=u_time*${flowRate.toFixed(3)};
      float a=q.x*2.15+q.y*.82+t;
      float b=q.y*2.70-q.x*.64-t*.7;
      float c=q.x*3.4-q.y*2.15+t*.35;
      float field=.71*sin(a)+.51*cos(b)+.24*sin(c);
      vec2 d=p-u_pointer;
      float dent=exp(-dot(d,d)*3.6);
      field+=u_touch*.30*dent;
      float fold=field*4.4+q.y*.18;
      float cycle=field*.39+q.x*.035+.18;
      vec3 rainbow=spectrum(cycle);
      float pearl=.5+.5*sin(field*1.65-q.y*.55-.6);
      float saturation=.88-.14*pearl*pearl;
      vec3 col=mix(${glVector(base)},rainbow,saturation);
      float ridge=exp(-pow(sin(fold)*4.4,2.));
      float hollow=exp(-pow(sin(fold+.32)*3.1,2.));
      col*=1.-hollow*.018;
      col=mix(col,${glVector(ridgeTint)},ridge*.055);
      float broad=.5+.5*sin(field*2.2+q.x*.3);
      col+=vec3(.003)*broad;
      gl_FragColor=vec4(clamp(col,0.,1.),1.);
    }`;
  const compile = (kind, source) => {
    const shader = gl.createShader(kind);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader); throw new Error('Oil surface shader unavailable');
    }
    return shader;
  };
  let program;
  try {
    const vert = compile(gl.VERTEX_SHADER, vertex);
    const frag = compile(gl.FRAGMENT_SHADER, fragment);
    program = gl.createProgram();
    gl.attachShader(program, vert); gl.attachShader(program, frag); gl.linkProgram(program);
    gl.deleteShader(vert); gl.deleteShader(frag);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Oil surface unavailable');
  } catch (error) { if (program) gl.deleteProgram(program); throw error; }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['size','pointer','time','touch'].map(key => [key, gl.getUniformLocation(program, `u_${key}`)]));
  return {
    kind: 'webgl', interval: 1000 / 60,
    resize(width, height) {
      const scale = Math.min(1, 1050 / Math.max(width, height), Math.sqrt(700000 / (width * height)));
      const w = Math.max(2, Math.round(width * scale));
      const h = Math.max(2, Math.round(height * scale));
      // Assigning either dimension clears and reallocates the drawing buffer.
      if (target.width === w && target.height === h) return;
      target.width = w;
      target.height = h;
      gl.viewport(0, 0, target.width, target.height);
    },
    draw(time, point, touch) {
      gl.uniform2f(uniforms.size, target.width, target.height);
      gl.uniform2f(uniforms.pointer, point[0], point[1]);
      gl.uniform1f(uniforms.time, time); gl.uniform1f(uniforms.touch, touch);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  };
}

function createCPURenderer(target) {
  const context = target.getContext('2d', {alpha:false});
  if (!context) return null;
  const {sin,cos,exp,floor,round} = Math;
  let pixels, samples;
  return {
    kind:'canvas2d', interval:1000 / 30,
    resize(width,height) {
      // At most 48,000 samples, including tall phones. CSS handles upscaling.
      const scale = Math.min(1,256/width,450/height,Math.sqrt(48000/(width*height)));
      const w=Math.max(2,Math.round(width*scale)),h=Math.max(2,Math.round(height*scale));
      if(pixels&&target.width===w&&target.height===h)return;
      target.width=w;target.height=h;
      pixels=context.createImageData(w,h);samples=new Float32Array(w*h*7);
      const aspect=w/h;
      for(let row=0;row<h;row++)for(let col=0;col<w;col++) {
        const x=((col+.5)/w-.5)*2*aspect,y=(.5-(row+.5)/h)*2;
        const qx=x+.28*Math.sin(y*2.4)+.11*Math.sin(y*5.3+x*.7);
        const qy=y+.24*Math.cos(x*2.0)+.10*Math.sin(x*4.1-y*.6);
        const i=(row*w+col)*7;
        samples[i]=x;samples[i+1]=y;samples[i+2]=qx;samples[i+3]=qy;
        samples[i+4]=qx*2.15+qy*.82;samples[i+5]=qy*2.70-qx*.64;samples[i+6]=qx*3.4-qy*2.15;
        pixels.data[(row*w+col)*4+3]=255;
      }
    },
    draw(time,point,touch) {
      if(!pixels)return;
      const data=pixels.data,t=time*flowRate;
      for(let j=0,i=0;j<samples.length;j+=7,i+=4) {
        const x=samples[j],y=samples[j+1],qx=samples[j+2],qy=samples[j+3];
        let field=.71*sin(samples[j+4]+t)+.51*cos(samples[j+5]-t*.7)+.24*sin(samples[j+6]+t*.35);
        if(touch>.002) {const dx=x-point[0],dy=y-point[1];field+=touch*.30*exp(-(dx*dx+dy*dy)*3.6);}
        const fold=field*4.4+qy*.18,cycle=field*.39+qx*.035+.18;
        const h=cycle-floor(cycle);
        let segment=1;
        while(segment<filmStops.length-1&&h>filmStops[segment].at)segment++;
        const from=filmStops[segment-1],to=filmStops[segment];
        let f=(h-from.at)/(to.at-from.at);f=f*f*(3-2*f);
        const a=from.colour,b=to.colour;
        const pearl=.5+.5*sin(field*1.65-qy*.55-.6),saturation=.88-.14*pearl*pearl;
        const ridge=exp(-1*(sin(fold)*4.4)**2)*.055;
        const shadow=1-exp(-1*(sin(fold+.32)*3.1)**2)*.018;
        const broad=.5+.5*sin(field*2.2+qx*.3);
        let red=(base[0]+(a[0]+(b[0]-a[0])*f-base[0])*saturation)*shadow;
        let green=(base[1]+(a[1]+(b[1]-a[1])*f-base[1])*saturation)*shadow;
        let blue=(base[2]+(a[2]+(b[2]-a[2])*f-base[2])*saturation)*shadow;
        red+=(ridgeTint[0]-red)*ridge+.003*broad;green+=(ridgeTint[1]-green)*ridge+.003*broad;blue+=(ridgeTint[2]-blue)*ridge+.003*broad;
        data[i]=round(red*255);data[i+1]=round(green*255);data[i+2]=round(blue*255);
      }
      context.putImageData(pixels,0,0);
    }
  };
}

function mountSurface() {
  let renderer;
  try { renderer=createGLRenderer(canvas); } catch { /* The matched software material remains available. */ }
  const software=()=>{
    const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;
    return createCPURenderer(canvas);
  };
  if(!renderer)renderer=software();
  if(!renderer){surface.dataset.renderer='static';return;}
  let frame=0,last=null,nextDraw=0,time=7,touch=0,touchTarget=0;
  let point=[.4,.2],pointTarget=[.4,.2],lastPointerTime=0;
  let width=innerWidth,height=innerHeight;
  const draw=()=>renderer.draw(time,point,touch);
  const resize=()=>{
    width=Math.max(1,innerWidth);height=Math.max(1,innerHeight);
    renderer.resize(width,height);
    if(reduceMotion.matches)touch=0;
    draw();
  };
  const tick=now=>{
    frame=0;
    if(document.hidden||reduceMotion.matches){last=null;nextDraw=0;return;}
    // Update the material and pointer from every display tick. Long main-thread
    // stalls must not fast-forward the surface when rendering resumes.
    const elapsed=last===null ? 0 : Math.min(.05,Math.max(0,(now-last)/1000));
    last=now;time+=elapsed;
    const ease=1-Math.exp(-4*elapsed);
    if(now-lastPointerTime>150)touchTarget=0;
    touch+=(touchTarget-touch)*ease;
    point[0]+=(pointTarget[0]-point[0])*ease;point[1]+=(pointTarget[1]-point[1])*ease;
    if(now+.25>=nextDraw){
      draw();
      // Keep the fractional deadline instead of restarting the wait at `now`.
      // A 42ms reset previously meant three 60Hz frames between GPU updates.
      const interval=renderer.interval;
      nextDraw=nextDraw ? nextDraw+interval : now+interval;
      if(nextDraw<=now)nextDraw+=(Math.floor((now-nextDraw)/interval)+1)*interval;
    }
    frame=requestAnimationFrame(tick);
  };
  const run=()=>{
    if(document.hidden||reduceMotion.matches){cancelAnimationFrame(frame);frame=0;last=null;nextDraw=0;return;}
    if(!frame)frame=requestAnimationFrame(tick);
  };
  const pointer=event=>{
    if(reduceMotion.matches)return;
    pointTarget=[(event.clientX/width-.5)*2*(width/height),(.5-event.clientY/height)*2];
    touchTarget=event.type==='pointerdown' ? .85 : .48;lastPointerTime=performance.now();
  };
  addEventListener('pointermove',pointer,{passive:true});
  addEventListener('pointerdown',pointer,{passive:true});
  addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',run);
  reduceMotion.addEventListener('change',()=>{
    if(reduceMotion.matches){time=7;touch=0;draw();}
    run();
  });
  canvas.addEventListener('webglcontextlost',()=>{
    renderer=software();
    if(!renderer){surface.dataset.renderer='static';cancelAnimationFrame(frame);frame=0;return;}
    surface.dataset.renderer=renderer.kind;resize();run();
  },{once:true});
  surface.dataset.renderer=renderer.kind;resize();run();
}
