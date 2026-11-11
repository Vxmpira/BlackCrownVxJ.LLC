/* The space every BlackCrown page sits in: a black sun with a pink corona,
   drifting nebula, and star layers that move at different speeds as you scroll
   and move the pointer, so the page reads as deep instead of flat.
   Two canvases: the nebula and eclipse are a small WebGL shader stretched to
   fit (they are soft by nature), the stars are a crisp 2D canvas on top.
   If WebGL is missing, the CSS gradients on .space stay as the backdrop. */
(function () {
  var root = document.querySelector('.space');
  if (!root) return;
  var neb = root.querySelector('.space-neb'), starCv = root.querySelector('.space-stars');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var product = document.body.getAttribute('data-product') || 'home';
  var PAL = {
    home: [[1, 0.176, 0.584], [0.44, 0.2, 1]],
    korvus: [[1, 0.176, 0.584], [0.44, 0.2, 1]],
    crown: [[1, 0.176, 0.584], [0.62, 0.22, 0.95]],
    eclipse: [[1, 0.36, 0.68], [0.5, 0.22, 1]],
    lodestone: [[0.286, 0.843, 1], [0.22, 0.32, 1]]
  };
  var pal = PAL[product] || PAL.home;
  var W = 0, H = 0, scrollY = window.scrollY || 0, maxScroll = 1;
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  var sun = { x: 0, y: 0, r: 0 };
  var SUN_LAG = 0.42, horizon = document.querySelector('.horizon');

  /* ---- where the sun sits: behind whatever the page marks with data-sun ---- */
  function placeSun() {
    var a = document.querySelector('[data-sun]');
    var ok = false;
    if (a) {
      var b = a.getBoundingClientRect();
      if (b.width > 40 && b.height > 40) {
        sun.x = b.left + b.width / 2;
        sun.y = b.top + (window.scrollY || 0) + b.height / 2;
        sun.r = Math.min(b.width, b.height) * (parseFloat(a.getAttribute('data-sun')) || 0.36);
        ok = true;
      }
    }
    if (!ok) { sun.x = W * 0.84; sun.y = H * 0.26; sun.r = Math.min(W, H) * 0.17; }
    root.style.setProperty('--sun-x', sun.x + 'px');
    root.style.setProperty('--sun-y', sun.y + 'px');
    root.style.setProperty('--sun-r', sun.r + 'px');
  }

  /* ---- nebula and eclipse (WebGL) ---- */
  var gl = null, prog = null, U = {}, scaleSteps = [0.6, 0.45, 0.33], step = 0, still = reduce;
  var FS = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uTime,uScroll,uEnd;uniform vec2 uMouse;uniform vec3 uA,uB,uSun,uSun2;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return s;}',
    'float fbm3(vec2 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*noise(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return s;}',
    'vec4 eclipse(vec2 uv,vec3 s,float bead){',
    ' vec2 q=uv-s.xy;float d=length(q),r=s.z,e=d-r,ang=atan(q.y,q.x);',
    ' float rays=fbm3(vec2(ang*2.6+3.,d/r*.9-uTime*.03));',
    ' float streak=pow(fbm3(vec2(ang*7.,1.7+uTime*.01)),2.);',
    ' float outer=step(0.,e);',
    ' float tight=exp(-max(e,0.)/r*7.5);',
    ' float wide=exp(-max(e,0.)/r*1.7)*(.3+.95*rays);',
    ' float ring=exp(-abs(e)/r*110.);',
    ' float glow=outer*(tight*.95+wide*.5*(.55+streak))+ring*1.25;',
    ' vec2 bp=s.xy+r*vec2(cos(.74),sin(.74));float bd=length(uv-bp)/r;',
    ' float b=bead*(exp(-bd*30.)*1.7+exp(-bd*8.)*.28);',
    ' vec3 hot=vec3(1.,.87,.95);',
    ' vec3 c=mix(uA,hot,clamp(tight*outer*.9+ring,0.,1.));',
    ' vec3 col=c*glow+hot*b+uB*outer*exp(-max(e,0.)/r*.8)*.12;',
    ' return vec4(col,smoothstep(-.004,.004,e));}',
    'void main(){',
    ' vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
    ' vec2 m=uMouse*.02;',
    ' vec2 p=uv*1.15+vec2(m.x,-uScroll*.12+m.y);',
    ' vec2 w=vec2(fbm(p*1.3+uTime*.012),fbm(p*1.3+7.7-uTime*.01));',
    ' float n=fbm(p*1.05+w*1.25);',
    ' float cloud=smoothstep(.4,.86,n);',
    ' float fil=smoothstep(.5,.9,fbm(p*3.1+w*2.));',
    ' vec3 tint=mix(uB,uA,smoothstep(.3,.8,fbm3(p*.7+3.3)));',
    ' vec3 col=vec3(.014,.007,.032)+uB*.05*(1.-clamp(length(uv)*.7,0.,1.));',
    ' vec3 nb=tint*(cloud*.26+cloud*fil*.24);',
    ' vec4 s1=eclipse(uv,uSun+vec3(m*2.,0.),1.);',
    ' vec4 s2=eclipse(uv,uSun2,0.);',
    ' col+=nb*s1.a*s2.a;',
    ' col=col*s1.a*s2.a+s1.rgb+s2.rgb*uEnd;',
    ' col+=uA*exp(-(uv.y+.5)*4.2)*.22*uEnd;',
    ' col*=1.-.32*smoothstep(.55,1.25,length(uv*vec2(.8,1.)));',
    ' col+=(hash(gl_FragCoord.xy+uTime)-.5)/200.;',
    ' gl_FragColor=vec4(col,1.);}'
  ].join('\n');
  function initGL() {
    try {
      gl = neb.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
    } catch (e) { gl = null; }
    if (!gl) return false;
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}');
    var fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) { gl = null; return false; }
    prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; return false; }
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uRes', 'uTime', 'uScroll', 'uEnd', 'uMouse', 'uA', 'uB', 'uSun', 'uSun2'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    gl.uniform3fv(U.uA, pal[0]); gl.uniform3fv(U.uB, pal[1]);
    neb.addEventListener('webglcontextlost', function (e) { e.preventDefault(); gl = null; root.classList.remove('live'); });
    root.classList.add('live');
    return true;
  }
  function sizeGL() {
    if (!gl) return;
    var s = scaleSteps[step];
    neb.width = Math.max(2, Math.round(W * s)); neb.height = Math.max(2, Math.round(H * s));
    gl.viewport(0, 0, neb.width, neb.height);
    gl.uniform2f(U.uRes, neb.width, neb.height);
  }
  var t0 = performance.now(), frozenT = 0;
  function drawGL(now) {
    if (!gl) return;
    var t = still ? frozenT : (now - t0) / 1000;
    // a second, far larger eclipse rises behind the skyline that closes the page
    var end = 0, R2 = Math.max(W * 0.62, H * 0.95), y2 = H * 3 + R2;
    if (horizon) {
      var hb = horizon.getBoundingClientRect();
      end = Math.max(0, Math.min(1, (H - hb.top) / (H * 0.55)));
      y2 = hb.top + hb.height * 0.04 + (hb.top - H * 0.15) * 0.3 + R2;
    }
    var sy = sun.y - scrollY * (1 - SUN_LAG);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uScroll, scrollY / H);
    gl.uniform1f(U.uEnd, end);
    gl.uniform2f(U.uMouse, mouse.x, -mouse.y);
    gl.uniform3f(U.uSun, (sun.x - W / 2) / H, (H / 2 - sy) / H, sun.r / H);
    gl.uniform3f(U.uSun2, 0, (H / 2 - y2) / H, R2 / H);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ---- stars and foreground dust (2D) ---- */
  var sctx = starCv.getContext('2d'), dpr = 1, starList = [], dust = [], sprite = null;
  var seed = 20261111;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function makeStars() {
    seed = 20261111; starList = []; dust = [];
    var n = Math.round(Math.min(420, Math.max(120, (W * H) / 5200)));
    for (var i = 0; i < n; i++) {
      var z = Math.pow(rnd(), 2.2);
      starList.push({ x: rnd(), y: rnd(), z: 0.03 + z * 0.3, s: 0.5 + z * 1.5 + (rnd() < 0.04 ? 1.2 : 0), a: 0.25 + rnd() * 0.7, c: rnd(), tw: rnd() * 6.28, sp: 0.4 + rnd() * 1.4 });
    }
    var m = W < 700 ? 5 : 11;
    for (var j = 0; j < m; j++) dust.push({ x: rnd(), y: rnd(), z: 0.5 + rnd() * 0.5, s: 40 + rnd() * 130, a: 0.035 + rnd() * 0.06, c: rnd() });
    // one soft disc, reused for every dust mote
    sprite = document.createElement('canvas'); sprite.width = sprite.height = 128;
    var g = sprite.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }
  var accent = 'rgb(' + pal[0].map(function (v) { return Math.round(v * 255); }).join(',') + ')';
  var second = 'rgb(' + pal[1].map(function (v) { return Math.round(v * 255 * 0.9 + 25); }).join(',') + ')';
  function drawStars(now) {
    var t = now / 1000, span = H * 1.35;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.clearRect(0, 0, W, H);
    for (var i = 0; i < starList.length; i++) {
      var s = starList[i];
      var x = s.x * (W + 80) - 40 - mouse.x * s.z * 60;
      var y = (((s.y * span - scrollY * s.z - mouse.y * s.z * 40) % span) + span) % span - span * 0.12;
      if (y < -4 || y > H + 4) continue;
      var a = s.a * (reduce ? 1 : 0.72 + 0.28 * Math.sin(t * s.sp + s.tw));
      sctx.globalAlpha = a;
      sctx.fillStyle = s.c < 0.16 ? accent : s.c < 0.26 ? second : '#fff';
      if (s.s > 2) {
        sctx.globalAlpha = a * 0.5;
        sctx.drawImage(sprite, x - s.s * 3, y - s.s * 3, s.s * 6, s.s * 6);
        sctx.globalAlpha = a;
        sctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
      } else {
        sctx.fillRect(x, y, s.s, s.s);
      }
    }
    sctx.globalCompositeOperation = 'lighter';
    for (var j = 0; j < dust.length; j++) {
      var d = dust[j], sp = H * 1.8;
      var dx = d.x * (W + 300) - 150 - mouse.x * d.z * 90;
      var dy = (((d.y * sp - scrollY * d.z - mouse.y * d.z * 60) % sp) + sp) % sp - sp * 0.2;
      if (dy < -d.s || dy > H + d.s) continue;
      sctx.globalAlpha = d.a;
      sctx.fillStyle = d.c < 0.6 ? accent : second;
      sctx.beginPath(); sctx.arc(dx, dy, d.s * 0.5, 0, 6.2832); sctx.closePath();
      var gr = sctx.createRadialGradient(dx, dy, 0, dx, dy, d.s * 0.5);
      gr.addColorStop(0, sctx.fillStyle); gr.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = gr; sctx.fill();
    }
    sctx.globalCompositeOperation = 'source-over';
    sctx.globalAlpha = 1;
  }

  /* ---- sizing, input, loop ---- */
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    starCv.width = Math.round(W * dpr); starCv.height = Math.round(H * dpr);
    maxScroll = Math.max(1, document.documentElement.scrollHeight - H);
    makeStars(); placeSun(); sizeGL(); dirty = true;
  }
  var dirty = true, raf = 0, ema = 16, slow = 0, last = 0, twinkleAt = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = now - last; last = now;
    var mx = mouse.tx - mouse.x, my = mouse.ty - mouse.y;
    if (Math.abs(mx) + Math.abs(my) > 0.0015) { mouse.x += mx * 0.06; mouse.y += my * 0.06; dirty = true; }
    if (!reduce && now > twinkleAt) { twinkleAt = now + 110; dirty = true; }
    if (dirty) drawStars(now);
    if (gl && (!still || dirty)) {
      drawGL(now);
      if (!still && dt < 250) {
        ema += (dt - ema) * 0.08;
        if (ema > 30) slow++; else slow = Math.max(0, slow - 1);
        if (slow > 45) {
          slow = 0; ema = 16;
          if (step < scaleSteps.length - 1) { step++; sizeGL(); }
          else { still = true; frozenT = (now - t0) / 1000; }
        }
      }
    }
    dirty = false;
  }
  function start() { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); }
  window.addEventListener('scroll', function () { scrollY = window.scrollY || 0; dirty = true; }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('load', function () { maxScroll = Math.max(1, document.documentElement.scrollHeight - H); placeSun(); dirty = true; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeSun(); dirty = true; });
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', function (e) {
      mouse.tx = (e.clientX / W) * 2 - 1; mouse.ty = (e.clientY / H) * 2 - 1;
    }, { passive: true });
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) cancelAnimationFrame(raf); else start(); });
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function () { maxScroll = Math.max(1, document.documentElement.scrollHeight - H); placeSun(); dirty = true; });
    ro.observe(document.body);
  }
  W = window.innerWidth; H = window.innerHeight;
  initGL();
  resize();
  start();
  window.BCSpace = { place: function () { placeSun(); dirty = true; } };
})();
