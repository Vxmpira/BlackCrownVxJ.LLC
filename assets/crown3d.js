/* The house crown, extruded from the brand mark and lit in 3D, standing in
   front of the eclipse on the home page. The four products orbit it: each one
   carries a label you can click, the dock under the hero steers the orbit, and
   the crown can be dragged to spin.
   Needs /assets/bc3d.js (the three.js bundle) loaded first. If WebGL is not
   available the flat SVG crown underneath stays visible instead. */
(function () {
  var canvas = document.getElementById('bc3d');
  if (!canvas || !window.THREE || !window.BC3D) return;
  var THREE = window.THREE, SVGLoader = window.BC3D.SVGLoader, EffectComposer = window.BC3D.EffectComposer,
    RenderPass = window.BC3D.RenderPass, UnrealBloomPass = window.BC3D.UnrealBloomPass;
  var stage = canvas.parentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 760px)').matches;
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    return;
  }
  var PINK = 0xff2d95, ORBIT_R = 3.05;
  var w = canvas.clientWidth || 600, h = canvas.clientHeight || 600;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
  camera.position.set(0, 0, 11);
  scene.add(new THREE.AmbientLight(0x241019, 1.2));
  var key = new THREE.PointLight(PINK, 46, 60); key.position.set(6, 8, 9); scene.add(key);
  var fill = new THREE.PointLight(0xff6fb6, 16, 60); fill.position.set(-8, -4, 6); scene.add(fill);
  var rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(0, 2, -6); scene.add(rim);

  var crown = new THREE.Group();
  scene.add(crown);
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 30"><path d="M4 24 L4 9 L12 16 L18 5 L24 16 L32 9 L32 24 Z"/></svg>';
  var path = new SVGLoader().parse(svg).paths[0];
  var shapes = SVGLoader.createShapes ? SVGLoader.createShapes(path) : path.toShapes(true);
  var geo = new THREE.ExtrudeGeometry(shapes, { depth: 7, bevelEnabled: true, bevelThickness: 0.9, bevelSize: 0.8, bevelSegments: 4, curveSegments: 6 });
  geo.scale(1, -1, 1);
  geo.center();
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  var size = new THREE.Vector3(); geo.boundingBox.getSize(size);
  var fit = 2.85 / Math.max(size.x, size.y);
  var faceMat = new THREE.MeshStandardMaterial({ color: 0x0b0b10, metalness: 0.7, roughness: 0.34, emissive: PINK, emissiveIntensity: 0.22, transparent: true });
  var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 22), new THREE.LineBasicMaterial({ color: PINK, transparent: true }));
  crown.add(new THREE.Mesh(geo, faceMat));
  crown.add(edges);
  crown.rotation.x = -0.12;

  // the four products, in orbit
  var orbit = new THREE.Group();
  scene.add(orbit);
  var sats = [0xff2d95, 0x49d7ff, 0xffe3f1, 0xff6fb6].map(function (c, i) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), new THREE.MeshBasicMaterial({ color: c }));
    var a = (i / 4) * Math.PI * 2;
    m.position.set(Math.cos(a) * ORBIT_R, 0, Math.sin(a) * ORBIT_R);
    m.userData.a = a;
    orbit.add(m);
    return m;
  });
  var ringPts = Array.from({ length: 128 }, function (_, i) { var a = (i / 128) * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * ORBIT_R, 0, Math.sin(a) * ORBIT_R); });
  var ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color: PINK, transparent: true, opacity: 0.34 }));
  orbit.add(ring);
  orbit.rotation.x = 0.4;

  var COUNT = isMobile ? 90 : 180;
  var pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3);
  var cPink = new THREE.Color(PINK), cWhite = new THREE.Color(0xffffff);
  for (var i = 0; i < COUNT; i++) {
    var r = 3.4 + Math.random() * 6, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.8;
    pos[i * 3 + 2] = r * Math.cos(ph) - 2;
    var c = Math.random() < 0.6 ? cPink : cWhite;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.04, vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  scene.add(particles);

  var composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  var bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.95, 0.6, 0.06);
  composer.addPass(bloom);
  // last pass: turn brightness into transparency, so the glow lies over the
  // eclipse behind the canvas instead of sitting in a black square
  var alphaMat = new THREE.ShaderMaterial({
    uniforms: { t: { value: null } },
    vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: 'uniform sampler2D t;varying vec2 v;void main(){vec3 c=texture2D(t,v).rgb;float a=clamp(max(c.r,max(c.g,c.b))*1.7,0.,1.);gl_FragColor=vec4(min(c,vec3(a)),a);}',
    depthTest: false, depthWrite: false, blending: THREE.NoBlending
  });
  var alphaScene = new THREE.Scene(), alphaCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  alphaScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), alphaMat));
  composer.addPass({
    enabled: true, needsSwap: false, clear: false, renderToScreen: true,
    setSize: function () {}, dispose: function () {},
    render: function (rdr, writeBuffer, readBuffer) {
      alphaMat.uniforms.t.value = readBuffer.texture;
      rdr.setRenderTarget(null);
      rdr.clear();
      rdr.render(alphaScene, alphaCam);
    }
  });

  /* ---- labels, the dock, and picking a product ---- */
  var qa = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var labels = qa('.orbit-label', stage), dock = qa('.dock a[data-k]');
  var sel = -1, angle = 0, spin = 0, vel = 0, dragging = false, lastX = 0, moved = 0;
  function pick(k) {
    sel = k;
    labels.forEach(function (l) { l.classList.toggle('on', +l.getAttribute('data-k') === k); });
    dock.forEach(function (d) { d.classList.toggle('on', +d.getAttribute('data-k') === k); });
  }
  labels.concat(dock).forEach(function (el) {
    var k = +el.getAttribute('data-k');
    el.addEventListener('pointerenter', function () { pick(k); });
    el.addEventListener('pointerleave', function () { pick(-1); });
    el.addEventListener('focus', function () { pick(k); });
    el.addEventListener('blur', function () { pick(-1); });
  });
  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.orbit-label')) return;
    dragging = true; lastX = e.clientX; moved = 0; vel = 0;
    stage.classList.add('drag');
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });
  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
    spin += dx * 0.012; vel = dx * 0.7; angle += dx * 0.006;
  });
  function drop() { dragging = false; stage.classList.remove('drag'); }
  stage.addEventListener('pointerup', drop);
  stage.addEventListener('pointercancel', drop);

  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduce) {
    window.addEventListener('pointermove', function (e) {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }
  var intro = reduce ? 1 : 0;
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var clock = new THREE.Clock();
  var raf = 0, visible = true, v3 = new THREE.Vector3();

  function resize() {
    w = canvas.clientWidth || w; h = canvas.clientHeight || h;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w, h);
  }
  window.addEventListener('resize', resize, { passive: true });

  function place() {
    // put each label over its product, dimmer when it passes behind the crown
    var ox = canvas.offsetLeft, oy = canvas.offsetTop;
    for (var i = 0; i < sats.length; i++) {
      var l = labels[i]; if (!l) continue;
      sats[i].getWorldPosition(v3);
      var depth = v3.z;
      v3.project(camera);
      var x = ox + (v3.x * 0.5 + 0.5) * w, y = oy + (-v3.y * 0.5 + 0.5) * h;
      l.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-165%)';
      l.style.opacity = sel === i ? 1 : (depth < 0 ? 0.42 : 0.92);
      l.style.zIndex = depth < 0 ? 1 : 3;
    }
  }
  function frame() {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (intro < 1) intro = Math.min(1, intro + dt / 1.3);
    var e = ease(intro);
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    if (!dragging) { spin += vel * dt * 0.02; vel *= Math.exp(-dt * 2.4); }
    if (sel >= 0) {
      // bring the chosen product round to the front
      var target = sats[sel].userData.a - Math.PI / 2;
      var diff = ((target - angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      angle += diff * (1 - Math.exp(-dt * 5));
    } else if (!dragging) {
      angle -= dt * 0.22;
    }
    crown.scale.setScalar(fit * (0.25 + 0.75 * e));
    crown.rotation.y = (1 - e) * Math.PI * 1.4 + t * 0.2 + mouse.x * 0.5 + spin;
    crown.rotation.x = -0.12 + mouse.y * 0.26 + Math.sin(t * 0.5) * 0.04;
    edges.material.opacity = e;
    faceMat.opacity = e;
    orbit.rotation.y = angle;
    orbit.rotation.z = Math.sin(t * 0.3) * 0.06 + mouse.x * 0.08;
    orbit.scale.setScalar(0.4 + 0.6 * e);
    ring.material.opacity = 0.34 * e;
    for (var i = 0; i < sats.length; i++) {
      var s = sats[i].scale.x, goal = sel === i ? 2.1 : 1;
      sats[i].scale.setScalar(s + (goal - s) * 0.15);
    }
    particles.rotation.y = t * 0.02;
    particles.rotation.x = mouse.y * 0.06;
    composer.render();
    place();
    if (reduce) cancelAnimationFrame(raf);
  }
  function sync() {
    cancelAnimationFrame(raf);
    if (visible && !document.hidden && !reduce) { clock.getDelta(); frame(); }
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }, { threshold: 0 }).observe(stage);
  }
  document.addEventListener('visibilitychange', sync);
  stage.classList.add('live');
  resize();
  frame();
})();
