/* BlackCrown art: small drawn scenes that stand for each product, built in
   code so they stay sharp at any size and answer the pointer.
     korvus     the world, watched: a globe with the Asia, London and New York desks
     lodestone  a lodestone pulling a chart toward its levels
     crown      a vault dial around the crown, one node per room
     eclipse    the eclipse with the community in orbit around it
     learn      five steps up, one for each beginner guide
     none       an empty orbit, for when we are not the right fit
     skyline    the house skyline that closes every page
   Usage: <canvas data-art="korvus"></canvas>. A canvas with data-art-follow="x"
   changes scene when the pick group named x changes. */
(function () {
  var TAU = Math.PI * 2, D = Math.PI / 180;
  var PINK = '#FF2D95', SOFT = '#FF6FB6', CYAN = '#49D7FF', GOLD = '#E8C77F', GREEN = '#35E08F', GREY = '#9A98A6', VIOLET = '#8B5CFF', HOT = '#FFE3F1';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }
  function mono(c, px) { c.font = '500 ' + px + 'px "JetBrains Mono", ui-monospace, monospace'; }
  function core(c, cx, cy, r, col, bare) {
    if (!bare) {
      var g = c.createRadialGradient(cx, cy, r * 0.97, cx, cy, r * 2.2);
      g.addColorStop(0, rgba(col, 0.6)); g.addColorStop(0.1, rgba(col, 0.24)); g.addColorStop(0.45, rgba(col, 0.07)); g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r * 2.2, 0, TAU); c.fill();
    }
    c.fillStyle = '#030106'; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
    if (!bare) { c.strokeStyle = rgba(HOT, 0.85); c.lineWidth = 1.2; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); }
  }
  function ticks(c, cx, cy, r, n, len, rot, col, every, lenBig) {
    c.strokeStyle = col; c.lineWidth = 1; c.beginPath();
    for (var i = 0; i < n; i++) {
      var a = rot + (i / n) * TAU, l = every && i % every === 0 ? lenBig : len;
      c.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      c.lineTo(cx + Math.cos(a) * (r + l), cy + Math.sin(a) * (r + l));
    }
    c.stroke();
  }
  function crownPath(c, cx, cy, s) {
    // the brand mark, 36 by 30, centred
    var p = [[4, 24], [4, 9], [12, 16], [18, 5], [24, 16], [32, 9], [32, 24]];
    c.beginPath();
    p.forEach(function (q, i) { var x = cx + (q[0] - 18) * s, y = cy + (q[1] - 15) * s; if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.closePath();
  }

  /* ---------------- korvus: the globe ---------------- */
  var LAND = null;
  function land() {
    if (LAND) return LAND;
    var hex = '000000000000000000000000000000000000000000000000000000000000000000007e0ff800000000000000000000000fd3fffc00580000180000000000016bc7fff80000002002c0000000001cacc07ff800000201ff741000018001cbf83fc000000037ffffff80c7ffffffae3f80007fcff7ffffffff23ffffffac1e0600effffffffffffe07fffff8300c0003dfffffffffff5c0083fff83a000022dfffffffffe0600201fffe3f0000219fffffffff80c000007fffbf80005bfffffffffff08000001ffffc00001ffffffffffff00000001ffffc00001ffd7fffffffc00000001ffff800005dfc7fffffff900000001fffe00000707bfffffff6000000001fffe000007097fffffff2200000000fffc000003e00fffffff0c000000007ff8000007f99fffffff10000000001f0800000fffff7fffff80000000000f0000001fffff8fffff0000000000060400001ffff7f1fffc0000000000072080001ffff3e0f1e8000000000001e000001ffffbc0e1f08000000000003000003fffff00607000000000000011c0001fffff80601000000000000003f0000fffff80000040000000000003fe00043fff00008300000000000003fe00001ffe00006e00000000000007ff80001ffc000026a8000000000007ffe0000ff800002087000000000007fff0000ff800000c03800000000003fff00007fc00000000000200000001ffe0000ffc80000019000000000000ffe0000ff98000007f0000000000007fe0000ff1000000ff8000000000007fc00007f3000003ffc00000000000ff000007e0000003ffe00000000000ff000007e0000003ffe00000000000fe000003c0000001ffe00000000000fc0000020000000103c00000000001f80000000000000001c02000000001e00000000000000000002000000000c00000000000000000004000000001c000000000000000000080000000018000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000001f00fffff000000000000f000000c3ffefffffffc00000001f4e0003fffffffffffffff0003fffffd8003fffffffffffffffc0063fffffe81c3fffffffffffffffc0007ffffffe77ffffffffffffffffe0ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    LAND = [];
    for (var j = 2; j < 52; j++) {
      var lat = (90 - (j + 0.5) * 3) * D, cl = Math.cos(lat), skip = Math.max(1, Math.round(1 / Math.max(cl, 0.2)));
      for (var i = 0; i < 120; i++) {
        if (i % skip) continue;
        var idx = j * 120 + i, bit = (parseInt(hex.charAt(idx >> 2), 16) >> (3 - (idx & 3))) & 1;
        if (bit) LAND.push([cl, Math.sin(lat), (-180 + (i + 0.5) * 3) * D]);
      }
    }
    return LAND;
  }
  var DESKS = [['Asia desk', 35.7, 139.7], ['London desk', 51.5, -0.1], ['New York desk', 40.7, -74]];
  function korvus(c, w, h, t, m, st) {
    var cx = w / 2, cy = h / 2, R = Math.min(w, h) * (st.bare ? 0.272 : 0.34);
    var rot = -t * 0.14 - m.x * 0.6 + 1.2, tilt = 0.36 + m.y * 0.18, ct = Math.cos(tilt), sn = Math.sin(tilt);
    function P(cl, sl, lon) {
      var x = cl * Math.sin(lon + rot), y = sl, z = cl * Math.cos(lon + rot);
      return [x, y * ct - z * sn, y * sn + z * ct];
    }
    core(c, cx, cy, R, PINK, st.bare);
    var g = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    g.addColorStop(0, 'rgba(60,18,58,.55)'); g.addColorStop(0.6, 'rgba(14,5,20,.5)'); g.addColorStop(1, 'rgba(3,1,6,.2)');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
    var L = land(), i, p, ds = Math.max(1.1, R / 110);
    c.fillStyle = rgba(SOFT, 0.09);
    for (i = 0; i < L.length; i++) { p = P(L[i][0], L[i][1], L[i][2]); if (p[2] <= 0) c.fillRect(cx + p[0] * R, cy - p[1] * R, ds, ds); }
    for (i = 0; i < L.length; i++) {
      p = P(L[i][0], L[i][1], L[i][2]);
      if (p[2] > 0) { c.fillStyle = rgba(p[2] > 0.75 ? HOT : SOFT, 0.2 + p[2] * 0.75); c.fillRect(cx + p[0] * R, cy - p[1] * R, ds * (0.8 + p[2] * 0.7), ds * (0.8 + p[2] * 0.7)); }
    }
    // the three desks, the wires between them, and stories travelling the wires
    var pts = DESKS.map(function (d) { var la = d[1] * D; return { n: d[0], cl: Math.cos(la), sl: Math.sin(la), lon: d[2] * D }; });
    for (var a = 0; a < 3; a++) {
      var A = pts[a], B = pts[(a + 1) % 3], prev = null, N = 40;
      var ax = [A.cl * Math.sin(A.lon), A.sl, A.cl * Math.cos(A.lon)], bx = [B.cl * Math.sin(B.lon), B.sl, B.cl * Math.cos(B.lon)];
      var om = Math.acos(Math.max(-1, Math.min(1, ax[0] * bx[0] + ax[1] * bx[1] + ax[2] * bx[2]))), so = Math.sin(om) || 1;
      var pulse = (t * 0.22 + a * 0.33) % 1;
      for (var k = 0; k <= N; k++) {
        var u = k / N, f1 = Math.sin((1 - u) * om) / so, f2 = Math.sin(u * om) / so, lift = 1 + 0.2 * Math.sin(Math.PI * u);
        var vx = (ax[0] * f1 + bx[0] * f2) * lift, vy = (ax[1] * f1 + bx[1] * f2) * lift, vz = (ax[2] * f1 + bx[2] * f2) * lift;
        var cr = Math.cos(rot), sr = Math.sin(rot);
        var x = vx * cr + vz * sr, z = -vx * sr + vz * cr, y = vy * ct - z * sn; z = vy * sn + z * ct;
        var q = [cx + x * R, cy - y * R, z];
        if (prev && (z > 0 || x * x + y * y > 1) && (prev[2] > 0 || true)) {
          c.strokeStyle = rgba(PINK, z > 0 ? 0.75 : 0.18); c.lineWidth = 1.1;
          c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(q[0], q[1]); c.stroke();
        }
        if (Math.abs(u - pulse) < 0.5 / N + 0.012 && z > -0.1) {
          c.fillStyle = '#fff'; c.shadowColor = PINK; c.shadowBlur = 12;
          c.beginPath(); c.arc(q[0], q[1], 2.4, 0, TAU); c.fill(); c.shadowBlur = 0;
        }
        prev = q;
      }
    }
    mono(c, Math.max(9, Math.min(12, R / 14)));
    pts.forEach(function (d, n) {
      var q = P(d.cl, d.sl, d.lon);
      if (q[2] < 0.05) return;
      var x = cx + q[0] * R, y = cy - q[1] * R, ph = (t * 0.7 + n * 0.37) % 1;
      c.strokeStyle = rgba(HOT, (1 - ph) * q[2]); c.lineWidth = 1.2;
      c.beginPath(); c.arc(x, y, 3 + ph * R * 0.11, 0, TAU); c.stroke();
      c.fillStyle = '#fff'; c.shadowColor = PINK; c.shadowBlur = 14;
      c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); c.shadowBlur = 0;
      c.fillStyle = rgba('#ffffff', 0.55 + 0.45 * q[2]); c.textBaseline = 'middle';
      c.fillText(d.n, x + 10, y - 9);
    });
    // the watch: a ring that never stops turning
    var R2 = R * 1.26;
    ticks(c, cx, cy, R2, 96, R * 0.022, t * 0.05, rgba(SOFT, 0.35), 8, R * 0.05);
    var sw = t * 0.5;
    var sg = c.createConicGradient ? c.createConicGradient(sw, cx, cy) : null;
    if (sg) {
      sg.addColorStop(0, rgba(PINK, 0)); sg.addColorStop(0.82, rgba(PINK, 0)); sg.addColorStop(0.995, rgba(PINK, 0.3)); sg.addColorStop(1, rgba(PINK, 0));
      c.fillStyle = sg; c.beginPath(); c.arc(cx, cy, R2, 0, TAU); c.arc(cx, cy, R * 1.01, 0, TAU, true); c.fill();
    }
    c.strokeStyle = rgba(HOT, 0.8); c.lineWidth = 1.2; c.beginPath();
    c.moveTo(cx + Math.cos(sw) * R * 1.01, cy + Math.sin(sw) * R * 1.01); c.lineTo(cx + Math.cos(sw) * (R2 + R * 0.05), cy + Math.sin(sw) * (R2 + R * 0.05)); c.stroke();
  }

  /* ---------------- lodestone: the stone and its field ---------------- */
  function lodestone(c, w, h, t, m, st) {
    var cx = w / 2, cy = h / 2, R = Math.min(w, h) * (st.bare ? 0.5 : 0.42), i;
    if (!st.bars) {
      var r = rng(11), px = 0; st.bars = [];
      for (i = 0; i < 46; i++) { var o = px, cl = o + (r() - 0.47) * 0.5 + Math.sin(i * 0.33) * 0.12; st.bars.push([o, cl, Math.max(o, cl) + r() * 0.22, Math.min(o, cl) - r() * 0.22]); px = cl; }
      var mx = Math.max.apply(null, st.bars.map(function (b) { return b[2]; })), mn = Math.min.apply(null, st.bars.map(function (b) { return b[3]; }));
      st.bars = st.bars.map(function (b) { return b.map(function (v) { return (v - mn) / (mx - mn) * 2 - 1; }); });
    }
    // a faint chart crossing the whole scene
    var bw = (w * 0.92) / 46, amp = R * 0.52;
    for (i = 0; i < 46; i++) {
      var b = st.bars[i], x = w * 0.04 + (i + 0.5) * bw, up = b[1] >= b[0];
      var dx = Math.abs(x - cx) / (w * 0.5), al = 0.12 + dx * 0.5;
      c.strokeStyle = c.fillStyle = up ? rgba(CYAN, al) : rgba('#8a88a0', al * 0.8); c.lineWidth = 1;
      c.beginPath(); c.moveTo(x, cy - b[2] * amp); c.lineTo(x, cy - b[3] * amp); c.stroke();
      c.fillRect(x - bw * 0.3, cy - Math.max(b[0], b[1]) * amp, bw * 0.6, Math.max(1.5, Math.abs(b[0] - b[1]) * amp));
    }
    // the levels it holds
    var LV = [['PDH', -0.86, '#ffffff'], ['Asia H', -0.5, VIOLET], ['EQ', 0, '#cfcdd8'], ['London L', 0.46, CYAN], ['PDL', 0.84, '#ffffff']];
    mono(c, Math.max(9, Math.min(12, R / 22))); c.textBaseline = 'middle';
    LV.forEach(function (l, n) {
      var y = cy + l[1] * amp * 1.05, ph = (Math.sin(t * 0.8 + n * 1.3) + 1) / 2;
      c.strokeStyle = rgba(l[2], 0.28 + ph * 0.3); c.setLineDash(n === 2 ? [2, 5] : [7, 5]); c.lineWidth = 1;
      c.beginPath(); c.moveTo(w * 0.03, y); c.lineTo(w * 0.97 - 62, y); c.stroke(); c.setLineDash([]);
      c.fillStyle = rgba(l[2], 0.9); c.fillText(l[0], w * 0.97 - 56, y);
    });
    // field lines of a dipole, tilted, with current running along them
    var ax = -0.42 + m.x * 0.35 + Math.sin(t * 0.12) * 0.06, ca = Math.cos(ax), sa = Math.sin(ax);
    for (var k = 0; k < 7; k++) {
      var Lk = R * (0.42 + k * 0.17);
      for (var side = -1; side <= 1; side += 2) {
        c.beginPath();
        for (var s = 0; s <= 48; s++) {
          var th = 0.16 + (s / 48) * (Math.PI - 0.32), rr = Lk * Math.sin(th) * Math.sin(th);
          var lx = rr * Math.cos(th), ly = rr * Math.sin(th) * side * 0.82;
          var X = cx + lx * ca - ly * sa, Y = cy + lx * sa + ly * ca;
          if (s) c.lineTo(X, Y); else c.moveTo(X, Y);
        }
        c.strokeStyle = rgba(CYAN, 0.34 - k * 0.035); c.lineWidth = 1; c.stroke();
        for (var q = 0; q < 2; q++) {
          var u = ((t * (0.1 + 0.012 * k) + q * 0.5 + k * 0.13) % 1), th2 = 0.16 + u * (Math.PI - 0.32), r2 = Lk * Math.sin(th2) * Math.sin(th2);
          var lx2 = r2 * Math.cos(th2), ly2 = r2 * Math.sin(th2) * side * 0.82;
          c.fillStyle = rgba('#ffffff', 0.9 * Math.sin(u * Math.PI)); c.shadowColor = CYAN; c.shadowBlur = 10;
          c.beginPath(); c.arc(cx + lx2 * ca - ly2 * sa, cy + lx2 * sa + ly2 * ca, 1.7, 0, TAU); c.fill(); c.shadowBlur = 0;
        }
      }
    }
    // the stone: a cut crystal
    var S = R * 0.2, V = [[0, -1.25], [0.82, -0.55], [0.95, 0.42], [0.2, 1.2], [-0.72, 0.78], [-0.92, -0.36]], C0 = [0.1, -0.12];
    function vp(v) { return [cx + (v[0] * ca - v[1] * sa) * S, cy + (v[0] * sa + v[1] * ca) * S]; }
    var gl = c.createRadialGradient(cx, cy, S * 0.3, cx, cy, S * 3.2);
    gl.addColorStop(0, rgba(CYAN, 0.34)); gl.addColorStop(1, rgba(CYAN, 0));
    c.fillStyle = gl; c.beginPath(); c.arc(cx, cy, S * 3.2, 0, TAU); c.fill();
    var cc = vp(C0);
    V.forEach(function (v, n) {
      var a = vp(v), b2 = vp(V[(n + 1) % V.length]), sh = 0.1 + 0.5 * ((Math.sin(n * 1.9 + t * 0.4) + 1) / 2);
      c.beginPath(); c.moveTo(cc[0], cc[1]); c.lineTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.closePath();
      c.fillStyle = 'rgba(' + Math.round(8 + sh * 40) + ',' + Math.round(22 + sh * 120) + ',' + Math.round(36 + sh * 150) + ',.95)'; c.fill();
      c.strokeStyle = rgba(CYAN, 0.9); c.lineWidth = 1.1; c.stroke();
    });
  }

  /* ---------------- crown: the vault ---------------- */
  var ROOMS = ['Unfiltered', 'Deep-Logic', 'Visual Analysis', 'Creativity'];
  function crown(c, w, h, t, m, st) {
    var cx = w / 2 + m.x * 6, cy = h / 2 + m.y * 6, R = Math.min(w, h) * (st.bare ? 0.47 : 0.4);
    if (!st.bare) core(c, cx, cy, R * 0.5, PINK, false);
    var rings = [[0.6, 48, 0.06, 4], [0.8, 72, -0.04, 6], [1, 120, 0.025, 10]];
    rings.forEach(function (r, n) {
      var rr = R * r[0], rot = t * r[2] + n;
      c.strokeStyle = rgba(n === 1 ? GOLD : SOFT, 0.26); c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, rr, 0, TAU); c.stroke();
      ticks(c, cx, cy, rr, r[1], R * 0.016, rot, rgba(n === 1 ? GOLD : SOFT, 0.5), r[3], R * 0.04);
      // heavy arcs, like the tumblers of a lock
      c.lineWidth = Math.max(2, R * 0.012); c.strokeStyle = rgba(n === 1 ? GOLD : PINK, 0.85); c.lineCap = 'round';
      for (var k = 0; k < 3; k++) { var a0 = rot * (n % 2 ? -2.2 : 2.2) + k * TAU / 3 + n * 0.7; c.beginPath(); c.arc(cx, cy, rr, a0, a0 + 0.34 + n * 0.1); c.stroke(); }
      c.lineCap = 'butt';
    });
    // one node per room on the middle ring
    mono(c, Math.max(9, Math.min(12, R / 20))); c.textBaseline = 'middle';
    var sel = Math.floor(t / 2.6) % 4;
    ROOMS.forEach(function (name, n) {
      var a = -Math.PI / 2 + n * TAU / 4 + 0.6 + Math.sin(t * 0.15) * 0.1, x = cx + Math.cos(a) * R * 0.8, y = cy + Math.sin(a) * R * 0.8, on = n === sel;
      c.strokeStyle = rgba(PINK, on ? 0.7 : 0.25); c.lineWidth = 1; c.beginPath(); c.moveTo(cx + Math.cos(a) * R * 0.33, cy + Math.sin(a) * R * 0.33); c.lineTo(x, y); c.stroke();
      c.fillStyle = on ? '#fff' : rgba(SOFT, 0.9); c.shadowColor = PINK; c.shadowBlur = on ? 22 : 8;
      c.beginPath(); c.arc(x, y, on ? 5.5 : 3.6, 0, TAU); c.fill(); c.shadowBlur = 0;
      c.fillStyle = rgba('#ffffff', on ? 1 : 0.6); c.textAlign = Math.cos(a) < -0.2 ? 'right' : Math.cos(a) > 0.2 ? 'left' : 'center';
      c.fillText(name, x + (Math.cos(a) < -0.2 ? -12 : Math.cos(a) > 0.2 ? 12 : 0), y + (Math.abs(Math.cos(a)) <= 0.2 ? (Math.sin(a) > 0 ? 16 : -16) : 0));
      c.textAlign = 'left';
    });
    // the crown, kept at the centre
    var s = R * 0.017;
    c.shadowColor = PINK; c.shadowBlur = 26; crownPath(c, cx, cy, s);
    c.fillStyle = rgba(PINK, 0.14); c.fill(); c.strokeStyle = PINK; c.lineWidth = Math.max(1.6, s * 1.1); c.lineJoin = 'round'; c.stroke(); c.shadowBlur = 0;
    c.beginPath(); c.moveTo(cx - 11 * s, cy + 13 * s); c.lineTo(cx + 11 * s, cy + 13 * s); c.stroke();
  }

  /* ---------------- eclipse-x: the room in orbit ---------------- */
  var WINGS = ['Market floor', 'E-commerce wing', 'AI lab'];
  function eclipse(c, w, h, t, m, st) {
    var cx = w / 2, cy = h / 2, R = Math.min(w, h) * (st.bare ? 0.242 : 0.24), i, ob = st.bare ? 1.2 : 1.5, os = st.bare ? 0.24 : 0.42;
    if (!st.dots) {
      var r = rng(5); st.dots = [];
      for (i = 0; i < 54; i++) { var band = i % 3; st.dots.push({ band: band, a: r() * TAU, r: ob + band * os + (r() - 0.5) * os * 0.55, sp: (0.05 + r() * 0.05) * (band % 2 ? -1 : 1), s: 1.3 + r() * 1.6, hub: i < 3 }); }
    }
    var tiltY = 0.36 + m.y * 0.1, skew = m.x * 0.25, pos = [];
    st.dots.forEach(function (d) {
      var a = d.a + t * d.sp, x = Math.cos(a) * d.r * R, z = Math.sin(a), y = z * d.r * R * tiltY + x * (0.16 + d.band * 0.06 - skew * 0.3);
      pos.push({ x: cx + x, y: cy + y, z: z, d: d });
    });
    function drawDots(front) {
      pos.forEach(function (p) {
        if ((p.z >= 0) !== front) return;
        var al = front ? 0.95 : 0.4;
        c.fillStyle = p.d.hub ? '#fff' : rgba(p.d.band === 1 ? HOT : SOFT, al); c.shadowColor = PINK; c.shadowBlur = p.d.hub ? 18 : 6;
        c.beginPath(); c.arc(p.x, p.y, p.d.hub ? 4.6 : p.d.s * (front ? 1 : 0.75), 0, TAU); c.fill(); c.shadowBlur = 0;
      });
    }
    // orbits behind the sun
    for (i = 0; i < 3; i++) {
      c.strokeStyle = rgba(SOFT, 0.16); c.lineWidth = 1; c.beginPath();
      for (var s = 0; s <= 64; s++) { var a = (s / 64) * TAU, x = Math.cos(a) * (ob + i * os) * R, y = Math.sin(a) * (ob + i * os) * R * tiltY + x * (0.16 + i * 0.06 - skew * 0.3); if (s) c.lineTo(cx + x, cy + y); else c.moveTo(cx + x, cy + y); }
      c.stroke();
    }
    drawDots(false);
    core(c, cx, cy, R, SOFT, st.bare);
    // people near each other are talking
    c.lineWidth = 1;
    for (i = 0; i < pos.length; i++) for (var j = i + 1; j < pos.length; j++) {
      var p = pos[i], q = pos[j]; if (p.z < 0 || q.z < 0) continue;
      var dd = Math.hypot(p.x - q.x, p.y - q.y), lim = R * 0.62;
      if (dd < lim) { c.strokeStyle = rgba(SOFT, 0.42 * (1 - dd / lim)); c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke(); }
    }
    drawDots(true);
    mono(c, Math.max(9, Math.min(12, R / 9))); c.textBaseline = 'middle';
    pos.forEach(function (p, n) { if (!p.d.hub || p.z < -0.2) return; c.fillStyle = rgba('#ffffff', 0.9); c.fillText(WINGS[n], p.x + 10, p.y - 10); });
  }

  /* ---------------- learn: five steps ---------------- */
  var STEPS = ['Sessions', 'Margin', 'Tick value', 'Rollover', 'What moves it'];
  function learn(c, w, h, t, m, st) {
    var n = 5, sw = w * 0.15, sh = h * 0.105, x0 = w * 0.11, y0 = h * 0.78, i;
    var at = (t * 0.45) % (n + 1.2), cur = Math.min(n - 1, Math.floor(at));
    mono(c, Math.max(9, Math.min(12, w / 46))); c.textBaseline = 'middle';
    for (i = 0; i < n; i++) {
      var x = x0 + i * sw + m.x * 4 * i, y = y0 - i * sh, done = i <= cur;
      c.fillStyle = rgba(GREEN, done ? 0.13 : 0.04); c.strokeStyle = rgba(GREEN, done ? 0.9 : 0.3); c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + sw * 0.86, y); c.lineTo(x + sw * 0.86 + sw * 0.16, y - sh * 0.3); c.lineTo(x + sw * 0.16, y - sh * 0.3); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + h); c.moveTo(x + sw * 0.86, y); c.lineTo(x + sw * 0.86, y + h); c.strokeStyle = rgba(GREEN, 0.1); c.stroke();
      // a candle standing on each step
      var bx = x + sw * 0.5, ch = sh * (0.55 + i * 0.16);
      c.strokeStyle = c.fillStyle = rgba(done ? GREEN : GREY, done ? 0.95 : 0.4);
      c.beginPath(); c.moveTo(bx, y - sh * 0.3 - ch * 1.3); c.lineTo(bx, y - sh * 0.22); c.stroke();
      c.fillRect(bx - sw * 0.07, y - sh * 0.3 - ch, sw * 0.14, ch * 0.78);
      c.fillStyle = rgba('#ffffff', done ? 0.95 : 0.45); c.fillText(STEPS[i], x + 2, y + 16);
    }
    var f = Math.min(1, at - cur), hx = x0 + cur * sw + sw * 0.5, hy = y0 - cur * sh - sh * 0.3;
    if (at < n && cur < n - 1) { hx += f * f * sw; hy -= f * f * sh + Math.sin(f * Math.PI) * sh * 0.9 * (f > 0.4 ? 1 : 0); }
    c.fillStyle = '#fff'; c.shadowColor = GREEN; c.shadowBlur = 20; c.beginPath(); c.arc(hx + sw * 0.26, hy - sh * (0.55 + cur * 0.16) * 1.45 - 6, 4.5, 0, TAU); c.fill(); c.shadowBlur = 0;
  }

  /* ---------------- none: an empty orbit ---------------- */
  function none(c, w, h, t, m, st) {
    var cx = w / 2 + m.x * 5, cy = h / 2 + m.y * 5, R = Math.min(w, h) * 0.34;
    c.strokeStyle = rgba(GREY, 0.4); c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
    c.setLineDash([3, 9]); c.beginPath(); c.arc(cx, cy, R * 0.62, 0, TAU); c.stroke(); c.setLineDash([]);
    ticks(c, cx, cy, R, 4, R * 0.1, t * 0.03, rgba(GREY, 0.7));
    var a = t * 0.25;
    c.fillStyle = '#fff'; c.shadowColor = '#fff'; c.shadowBlur = 14; c.beginPath(); c.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 4, 0, TAU); c.fill(); c.shadowBlur = 0;
    var s = R * 0.02; crownPath(c, cx, cy, s); c.strokeStyle = rgba(GREY, 0.75); c.lineWidth = 1.4; c.lineJoin = 'round'; c.stroke();
  }

  /* ---------------- skyline: the house, at night ---------------- */
  function skyline(c, w, h, t, m, st) {
    if (!st.layers || st.w !== w || st.h !== h) {
      st.w = w; st.h = h; st.layers = []; st.wins = [];
      var r = rng(77), dpr = st.dpr;
      [[0.34, 0.5, 26, '#0d0716', 0.25], [0.52, 0.72, 40, '#08040f', 0.5], [0.7, 1, 58, '#040208', 1]].forEach(function (cfg, li) {
        var cv = document.createElement('canvas'); cv.width = Math.round((w + 160) * dpr); cv.height = Math.round(h * dpr);
        var g = cv.getContext('2d'); g.scale(dpr, dpr);
        var x = -20;
        while (x < w + 180) {
          var bw = cfg[2] * (0.6 + r() * 1.3), bh = h * (cfg[0] + (cfg[1] - cfg[0]) * Math.pow(r(), 1.7)) * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, Math.max(0, x / w)))) ;
          var top = h - bh;
          g.fillStyle = cfg[3]; g.fillRect(x, top, bw, bh);
          if (r() < 0.35) { g.fillRect(x + bw * 0.3, top - bh * 0.08, bw * 0.4, bh * 0.08); if (r() < 0.5) g.fillRect(x + bw * 0.48, top - bh * 0.2, 1.5, bh * 0.14); }
          g.fillStyle = rgba(li === 2 ? PINK : SOFT, 0.5 * cfg[4]); g.fillRect(x, top, bw, 1);
          var ws = li === 2 ? 3 : 2, gap = li === 2 ? 7 : 5;
          for (var wy = top + 8; wy < h - 6; wy += gap + 2) for (var wx = x + 4; wx < x + bw - 4; wx += gap) {
            var lit = r();
            if (lit < 0.3) {
              var col = lit < 0.03 ? CYAN : lit < 0.09 ? GOLD : lit < 0.2 ? PINK : SOFT;
              g.fillStyle = rgba(col, (0.25 + r() * 0.6) * cfg[4]); g.fillRect(wx, wy, ws, ws * 1.4);
              if (li === 2 && r() < 0.06) st.wins.push([wx, wy, ws, col, r() * 6]);
            }
          }
          x += bw + (r() < 0.2 ? cfg[2] * 0.3 : 1);
        }
        st.layers.push([cv, cfg[4]]);
      });
    }
    st.layers.forEach(function (L, i) {
      var off = -80 - m.x * (6 + i * 14);
      c.drawImage(L[0], off, 0, w + 160, h);
    });
    // the crown tower, front and centre
    var tw = Math.max(46, w * 0.034), th = h * 0.72, tx = w / 2 - tw / 2 - m.x * 34, ty = h - th;
    var g2 = c.createLinearGradient(tx, 0, tx + tw, 0); g2.addColorStop(0, '#0a0512'); g2.addColorStop(0.5, '#170a22'); g2.addColorStop(1, '#06030b');
    c.fillStyle = g2; c.fillRect(tx, ty, tw, th);
    c.fillStyle = rgba(PINK, 0.85); c.fillRect(tx, ty, tw, 1.5); c.fillRect(tx + tw * 0.5 - 0.75, ty, 1.5, th);
    for (var y = ty + 10; y < h - 6; y += 9) { var on = (Math.sin(y * 12.9 + Math.floor(t * 0.7)) + 1) / 2; c.fillStyle = rgba(PINK, 0.15 + on * 0.55); c.fillRect(tx + 5, y, tw - 10, 2); }
    var s = tw / 26;
    c.shadowColor = PINK; c.shadowBlur = 24; crownPath(c, tx + tw / 2, ty - 15 * s, s);
    c.fillStyle = rgba(PINK, 0.2); c.fill(); c.strokeStyle = HOT; c.lineWidth = 1.6; c.lineJoin = 'round'; c.stroke(); c.shadowBlur = 0;
    // a few windows switch on and off
    st.wins.forEach(function (wn) {
      var on = Math.sin(t * 0.6 + wn[4]) > 0.2;
      c.fillStyle = on ? rgba(wn[3], 0.95) : '#040208'; c.fillRect(wn[0] - 80 - m.x * 34, wn[1], wn[2], wn[2] * 1.4);
    });
    var fade = c.createLinearGradient(0, h * 0.7, 0, h); fade.addColorStop(0, 'rgba(3,2,6,0)'); fade.addColorStop(1, 'rgba(3,2,6,.92)');
    c.fillStyle = fade; c.fillRect(0, h * 0.7, w, h * 0.3);
  }

  var SCENES = { korvus: korvus, lodestone: lodestone, crown: crown, eclipse: eclipse, learn: learn, none: none, skyline: skyline };

  /* ---------------- instances and one shared loop ---------------- */
  var list = [], running = false, t0 = performance.now();
  function Inst(cv) {
    this.cv = cv; this.c = cv.getContext('2d'); this.scene = cv.getAttribute('data-art'); this.st = { bare: cv.hasAttribute('data-bare') };
    this.vis = false; this.m = { x: 0, y: 0, tx: 0, ty: 0 }; this.w = 0; this.h = 0; this.drawn = false;
  }
  Inst.prototype.size = function () {
    var b = this.cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (b.width < 8 || b.height < 8) return false;
    var w = Math.round(b.width), h = Math.round(b.height);
    if (w !== this.w || h !== this.h || dpr !== this.dpr) {
      this.w = w; this.h = h; this.dpr = dpr; this.st.dpr = dpr;
      this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
      this.drawn = false;
    }
    return true;
  };
  Inst.prototype.draw = function (t) {
    if (!this.size()) return;
    var c = this.c, fn = SCENES[this.scene];
    if (!fn) return;
    this.m.x += (this.m.tx - this.m.x) * 0.07; this.m.y += (this.m.ty - this.m.y) * 0.07;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    c.globalAlpha = 1; c.textAlign = 'left';
    fn(c, this.w, this.h, t, this.m, this.st);
    this.drawn = true;
  };
  Inst.prototype.set = function (scene) {
    if (!SCENES[scene] || scene === this.scene) return;
    var self = this;
    this.cv.style.opacity = 0;
    setTimeout(function () { self.scene = scene; self.st = { bare: self.st.bare, dpr: self.dpr }; self.cv.setAttribute('data-art', scene); self.drawn = false; self.cv.style.opacity = 1; if (reduce) self.draw(8); kick(); }, 170);
  };
  function loop(now) {
    var t = (now - t0) / 1000 + 8, any = false;
    for (var i = 0; i < list.length; i++) if (list[i].vis) { list[i].draw(t); any = true; }
    if (any && !reduce && !document.hidden) requestAnimationFrame(loop); else running = false;
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }
  function add(cv) {
    if (cv.__art) return cv.__art;
    var it = new Inst(cv); cv.__art = it; list.push(it);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { it.vis = es[0].isIntersecting; if (it.vis) kick(); }, { rootMargin: '80px' }).observe(cv);
    } else { it.vis = true; kick(); }
    var zone = cv.closest('[data-art-zone]') || cv.parentElement || cv;
    zone.addEventListener('pointermove', function (e) {
      var b = cv.getBoundingClientRect();
      it.m.tx = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1));
      it.m.ty = Math.max(-1, Math.min(1, ((e.clientY - b.top) / b.height) * 2 - 1));
    }, { passive: true });
    zone.addEventListener('pointerleave', function () { it.m.tx = 0; it.m.ty = 0; }, { passive: true });
    return it;
  }
  Array.prototype.forEach.call(document.querySelectorAll('canvas[data-art]'), add);
  document.addEventListener('bc:pick', function (e) {
    Array.prototype.forEach.call(document.querySelectorAll('canvas[data-art-follow="' + e.detail.name + '"]'), function (cv) {
      if (e.detail.art) add(cv).set(e.detail.art);
    });
  });
  window.addEventListener('resize', function () { list.forEach(function (it) { it.drawn = false; }); kick(); }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(kick);
})();
