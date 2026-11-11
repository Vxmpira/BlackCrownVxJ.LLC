/* BlackCrown site behavior. Everything here answers something the visitor
   does: open a menu, pick a need, scroll the gallery, drag a reel or the day,
   toggle a chart layer, move the pointer across a panel. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer:fine)').matches;

  /* ---- header: border on scroll, phone menu, close the dropdown on outside click ---- */
  var head = $('.site-head'), bar = $('.progress');
  function onScroll() {
    if (head) head.classList.toggle('scrolled', window.scrollY > 8);
    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  var burger = $('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.documentElement.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      var d = $('.nav details');
      if (d && open) d.open = true;
    });
    $$('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.documentElement.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }
  document.addEventListener('click', function (e) {
    $$('.nav details[open]').forEach(function (d) {
      if (!d.contains(e.target) && !document.documentElement.classList.contains('nav-open')) d.open = false;
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') $$('.nav details[open]').forEach(function (d) { d.open = false; });
  });

  /* ---- generic "pick one" groups: fit finder, Crown rooms, Eclipse-X floor plan ---- */
  $$('[data-pick]').forEach(function (group) {
    var name = group.getAttribute('data-pick');
    var buttons = $$('[data-for]', group);
    var views = $$('[data-view="' + name + '"]');
    function choose(id) {
      buttons.forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-for') === id ? 'true' : 'false'); });
      views.forEach(function (v) { v.hidden = v.getAttribute('data-id') !== id; });
      var m = $('[data-meter="' + name + '"]');
      var b = buttons.filter(function (x) { return x.getAttribute('data-for') === id; })[0];
      if (m && b && b.hasAttribute('data-draw')) m.style.width = b.getAttribute('data-draw') + '%';
      if (b) {
        var cap = $('[data-cap-for="' + name + '"]');
        if (cap && b.hasAttribute('data-cap')) cap.textContent = b.getAttribute('data-cap');
        document.dispatchEvent(new CustomEvent('bc:pick', { detail: { name: name, id: id, art: b.getAttribute('data-art') } }));
      }
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        choose(b.getAttribute('data-for'));
        // on a phone the answer sits below the list, so bring it into view
        var v = views.filter(function (x) { return !x.hidden; })[0];
        if (v && window.innerWidth < 980 && v.getBoundingClientRect().top > window.innerHeight * 0.7) {
          v.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
    group.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var i = buttons.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n = buttons[(i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length];
      n.focus();
      choose(n.getAttribute('data-for'));
    });
    if (buttons[0]) choose((buttons.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0] || buttons[0]).getAttribute('data-for'));
  });

  /* ---- screenshots: dark and light ---- */
  $$('.shot').forEach(function (shot) {
    $$('[data-set-mode]', shot).forEach(function (b) {
      b.addEventListener('click', function () {
        var light = b.getAttribute('data-set-mode') === 'light';
        shot.classList.toggle('light', light);
        $$('[data-set-mode]', shot).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      });
    });
  });

  /* ---- Korvus: filter the sample feed the way the terminal does ---- */
  $$('[data-feed]').forEach(function (box) {
    var cards = $$('.card', box), empty = $('.feed-empty', box);
    $$('.chips button', box).forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter'), shown = 0;
        $$('.chips button', box).forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        cards.forEach(function (c) {
          var ok = f === 'all' || (' ' + c.getAttribute('data-tags') + ' ').indexOf(' ' + f + ' ') >= 0;
          c.hidden = !ok;
          if (ok) shown++;
        });
        if (empty) empty.hidden = shown > 0;
      });
    });
  });

  /* ---- home: a day with the house ---- */
  $$('.day').forEach(function (day) {
    var range = $('input[type=range]', day), needle = $('.day-needle', day), segs = $$('.day-track i', day);
    var clock = $('.day-clock b', day), phase = $('.day-clock small', day), title = $('.day-read h3', day), text = $('.day-read p', day), link = $('.day-read a', day), read = $('.day-read', day);
    function fmt(p) {
      var mins = Math.round(((18 + p) % 24) * 60), h = Math.floor(mins / 60), m = mins % 60, ap = h >= 12 ? 'PM' : 'AM';
      return ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
    }
    var orb = $('.day-orb', day), track = $('.day-track', day);
    function set(p) {
      needle.style.left = (p / 24) * 100 + '%';
      if (orb) {
        // night arc, then day arc: the same curve the two dashed paths draw
        var u = p < 12 ? p / 12 : (p - 12) / 12;
        orb.style.left = (p / 24) * 100 + '%';
        orb.style.top = ((1 - u) * (1 - u) * 100 + 2 * (1 - u) * u * -70 + u * u * 100) + '%';
        orb.classList.toggle('sun', p >= 12);
      }
      clock.textContent = fmt(p);
      segs.forEach(function (s) {
        var on = p >= +s.getAttribute('data-from') && p < +s.getAttribute('data-to');
        s.classList.toggle('on', on);
        if (!on) return;
        phase.textContent = s.textContent + ', New York time';
        title.textContent = s.getAttribute('data-title');
        text.textContent = s.getAttribute('data-text');
        link.textContent = s.getAttribute('data-link');
        link.href = s.getAttribute('data-href');
        read.style.setProperty('--c', getComputedStyle(s).getPropertyValue('--c'));
      });
    }
    range.addEventListener('input', function () { set(Math.min(23.99, +range.value)); });
    track.addEventListener('click', function (e) {
      var r = track.getBoundingClientRect();
      range.value = Math.round(Math.max(0, Math.min(23.75, ((e.clientX - r.left) / r.width) * 24)) * 4) / 4;
      set(+range.value);
    });
    // open on the visitor's current New York time
    var now = 0;
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var hh = +parts.filter(function (x) { return x.type === 'hour'; })[0].value % 24, mm = +parts.filter(function (x) { return x.type === 'minute'; })[0].value;
      now = ((hh + mm / 60 - 18) + 24) % 24;
    } catch (e) { now = 15.5; }
    range.value = Math.round(now * 4) / 4;
    set(Math.min(23.99, +range.value));
  });

  /* ---- LodeStone: a sample session, drawn layer by layer ---- */
  $$('[data-chart]').forEach(function (box) {
    var svg = $('svg', box), note = $('.chart-note', box);
    var W = 760, H = 400, L = 14, R = 96, T = 18, B = 26, N = 96;
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    // the shape of the day: Asia ranges, London sweeps the Asia low, New York runs the highs
    var drift = function (i) { return i < 24 ? 0.02 : i < 34 ? -0.05 : i < 44 ? -0.22 : i < 60 ? 0.1 : i < 72 ? 0.5 : i < 80 ? -0.12 : 0.06; };
    var bars = [], px = 100;
    for (var i = 0; i < N; i++) {
      var o = px, c = o + drift(i) + (rnd() - 0.5) * 1.5;
      var hi = Math.max(o, c) + rnd() * 0.75, lo = Math.min(o, c) - rnd() * 0.75;
      bars.push({ o: o, c: c, h: hi, l: lo });
      px = c;
    }
    // two matching swing highs in London: resting liquidity
    bars[36].h = bars[45].h = Math.max(bars[36].h, bars[45].h) + 0.25;
    var hiAll = Math.max.apply(null, bars.map(function (b) { return b.h; })), loAll = Math.min.apply(null, bars.map(function (b) { return b.l; }));
    var pad = (hiAll - loAll) * 0.16, top = hiAll + pad, bot = loAll - pad;
    var X = function (i) { return L + (i + 0.5) * ((W - L - R) / N); };
    var Y = function (v) { return T + (top - v) / (top - bot) * (H - T - B); };
    var bw = ((W - L - R) / N) * 0.62;
    var el = function (tag, attrs, parent, txt) {
      var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (txt) n.textContent = txt;
      (parent || svg).appendChild(n);
      return n;
    };
    var layer = function (name) { return el('g', { class: 'lyr', 'data-layer': name }); };
    var label = function (g, y, text, color) {
      el('text', { x: W - R + 8, y: y + 3.5, fill: color, 'font-family': 'JetBrains Mono, monospace', 'font-size': 10 }, g, text);
    };
    var line = function (g, y, x1, color, dash) {
      el('line', { x1: x1, x2: W - R + 4, y1: y, y2: y, stroke: color, 'stroke-width': 1, 'stroke-dasharray': dash || '' }, g);
    };
    var range = function (a, b) {
      var s = bars.slice(a, b + 1);
      return { h: Math.max.apply(null, s.map(function (x) { return x.h; })), l: Math.min.apply(null, s.map(function (x) { return x.l; })) };
    };

    // premium and discount sits behind everything
    var pd = layer('pd'), eq = (hiAll + loAll) / 2;
    el('rect', { x: L, y: Y(hiAll), width: W - L - R, height: Y(eq) - Y(hiAll), fill: 'rgba(255,45,149,.07)' }, pd);
    el('rect', { x: L, y: Y(eq), width: W - L - R, height: Y(loAll) - Y(eq), fill: 'rgba(53,224,143,.06)' }, pd);
    line(pd, Y(eq), L, 'rgba(255,255,255,.45)', '2 4');
    label(pd, Y(eq), 'EQ', '#cfcdd8');
    el('text', { x: L + 6, y: Y(hiAll) + 13, fill: 'rgba(255,140,196,.8)', 'font-family': 'JetBrains Mono, monospace', 'font-size': 10 }, pd, 'Premium');
    el('text', { x: L + 6, y: Y(loAll) - 6, fill: 'rgba(120,235,180,.8)', 'font-family': 'JetBrains Mono, monospace', 'font-size': 10 }, pd, 'Discount');

    // sessions
    var ses = layer('sessions');
    [['Asia', 0, 23, '#b15bff'], ['London', 32, 47, '#49d7ff'], ['NY AM', 60, 71, '#ff2d95'], ['NY PM', 76, 91, '#e8c77f']].forEach(function (s) {
      var r = range(s[1], s[2]), x0 = X(s[1]) - bw, x1 = X(s[2]) + bw;
      el('rect', { x: x0, y: Y(r.h), width: x1 - x0, height: Y(r.l) - Y(r.h), fill: s[3], 'fill-opacity': 0.07, stroke: s[3], 'stroke-opacity': 0.45, 'stroke-width': 1 }, ses);
      el('text', { x: x0 + 5, y: Y(r.h) - 5, fill: s[3], 'font-family': 'JetBrains Mono, monospace', 'font-size': 10 }, ses, s[0]);
      if (s[0] === 'Asia' || s[0] === 'London') {
        line(ses, Y(r.h), x1, s[3], '5 4');
        line(ses, Y(r.l), x1, s[3], '5 4');
        label(ses, Y(r.h), s[0] + ' H', s[3]);
        label(ses, Y(r.l), s[0] + ' L', s[3]);
      }
    });

    // prior day levels
    var prior = layer('prior'), pdh = hiAll - (hiAll - loAll) * 0.1, pdl = loAll + (hiAll - loAll) * 0.3;
    line(prior, Y(pdh), L, '#ffffff'); label(prior, Y(pdh), 'PDH', '#ffffff');
    line(prior, Y(pdl), L, '#ffffff'); label(prior, Y(pdl), 'PDL', '#ffffff');

    // candles
    var candles = el('g', {});
    bars.forEach(function (b, i) {
      var up = b.c >= b.o, col = up ? '#49d7ff' : '#6d6b78';
      el('line', { x1: X(i), x2: X(i), y1: Y(b.h), y2: Y(b.l), stroke: col, 'stroke-width': 1 }, candles);
      el('rect', { x: X(i) - bw / 2, y: Y(Math.max(b.o, b.c)), width: bw, height: Math.max(1, Math.abs(Y(b.o) - Y(b.c))), fill: col }, candles);
    });

    // resting liquidity: the equal highs
    var liq = layer('liq'), ly = Y(bars[36].h);
    el('line', { x1: X(36), x2: X(64), y1: ly, y2: ly, stroke: '#e8c77f', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }, liq);
    [36, 45].forEach(function (i) { el('circle', { cx: X(i), cy: ly - 5, r: 2.6, fill: '#e8c77f' }, liq); });
    el('text', { x: X(36), y: ly - 12, fill: '#e8c77f', 'font-family': 'JetBrains Mono, monospace', 'font-size': 10 }, liq, 'Equal highs');

    // SMT at the London low
    var smt = layer('smt'), low = 32, lv = Infinity;
    for (var j = 32; j <= 47; j++) if (bars[j].l < lv) { lv = bars[j].l; low = j; }
    el('path', { d: 'M' + X(low) + ' ' + (Y(lv) + 7) + ' l-6 10 h12 z', fill: '#35e08f' }, smt);
    el('text', { x: X(low) + 11, y: Y(lv) + 18, fill: '#35e08f', 'font-family': 'JetBrains Mono, monospace', 'font-size': 10 }, smt, 'SMT: NQ lower low, ES held');

    // time axis
    [['6 PM', 0], ['12 AM', 24], ['6 AM', 48], ['12 PM', 72], ['4 PM', 88]].forEach(function (t) {
      el('text', { x: X(t[1]), y: H - 8, fill: '#6a6876', 'font-family': 'JetBrains Mono, monospace', 'font-size': 10 }, svg, t[0]);
    });

    var notes = {
      sessions: 'Sessions: each session is boxed as it forms, and its high and low stay on the chart after it ends.',
      prior: 'Prior levels: yesterday’s high and low, pinned so you never redraw them.',
      pd: 'Premium and discount: the dealing range split at equilibrium, so you can see which half you are paying in.',
      liq: 'Resting liquidity: swing highs that match are flagged where they form, before price reaches for them.',
      smt: 'SMT divergence: flagged when NQ and ES stop agreeing at a session extreme.'
    };
    $$('.layers input', box).forEach(function (inp) {
      var apply = function () {
        var g = $('[data-layer="' + inp.value + '"]', svg);
        if (g) g.classList.toggle('off', !inp.checked);
      };
      inp.addEventListener('change', function () {
        apply();
        if (note) note.textContent = inp.checked ? notes[inp.value] : 'Layer hidden. Every module in LodeStone has its own switch, exactly like this.';
      });
      apply();
    });
  });

  /* ---- the gallery: the page holds still while the products pass sideways ---- */
  $$('[data-pin]').forEach(function (pin) {
    var track = $('.pin-track', pin), slides = $$('.slide', pin), bar = $('.pin-bar i', pin), count = $('.pin-count', pin);
    var prev = $('.prev', pin), next = $('.next', pin), dist = 0, native = false, cur = -1;
    function update() {
      var p;
      if (native) {
        var max = track.scrollWidth - track.clientWidth;
        p = max > 0 ? track.scrollLeft / max : 0;
      } else {
        p = dist > 0 ? Math.min(1, Math.max(0, -pin.getBoundingClientRect().top / dist)) : 0;
        track.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
      }
      var mid = window.innerWidth / 2, best = 0, bd = 1e9;
      slides.forEach(function (s, i) {
        var r = s.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid);
        if (d < bd) { bd = d; best = i; }
      });
      if (best !== cur) {
        cur = best;
        slides.forEach(function (s, i) { s.classList.toggle('on', i === best); });
        if (count) count.textContent = (best + 1) + ' / ' + slides.length;
        if (prev) prev.disabled = best === 0;
        if (next) next.disabled = best === slides.length - 1;
      }
      if (bar) bar.style.transform = 'translateX(' + (p * 400).toFixed(1) + '%)';
    }
    function mode() {
      native = reduce || window.innerWidth < 980 || window.innerHeight < 620;
      pin.classList.toggle('native', native);
      if (native) { pin.style.height = ''; track.style.transform = ''; dist = 0; }
      else { dist = Math.max(0, track.offsetWidth - window.innerWidth); pin.style.height = (window.innerHeight + dist) + 'px'; }
      update();
    }
    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      if (native) { slides[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); return; }
      var want = slides[i].offsetLeft + slides[i].offsetWidth / 2 - window.innerWidth / 2;
      var top = pin.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + Math.max(0, Math.min(dist, want)), behavior: reduce ? 'auto' : 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { go(cur - 1); });
    if (next) next.addEventListener('click', function () { go(cur + 1); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) || e.target.closest('[data-pick]')) return;
      var r = pin.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.5 || r.bottom < window.innerHeight * 0.5) return;
      e.preventDefault();
      go(cur + (e.key === 'ArrowRight' ? 1 : -1));
    });
    window.addEventListener('scroll', function () { if (!native) update(); }, { passive: true });
    track.addEventListener('scroll', function () { if (native) update(); }, { passive: true });
    window.addEventListener('resize', mode, { passive: true });
    window.addEventListener('load', mode);
    mode();
  });

  /* ---- reels: a row of tiles you drag, wheel or step through ---- */
  $$('.rows.reel').forEach(function (reel) {
    var wrap = document.createElement('div');
    wrap.className = 'reel-wrap';
    reel.parentNode.insertBefore(wrap, reel);
    wrap.appendChild(reel);
    var ctl = document.createElement('div');
    ctl.className = 'reel-ctl';
    ctl.innerHTML = '<div class="reel-bar"><i></i></div><button class="arrow-btn prev" type="button" aria-label="Scroll back"></button><button class="arrow-btn next" type="button" aria-label="Scroll forward"></button>';
    wrap.appendChild(ctl);
    var bar = $('.reel-bar i', ctl), prev = $('.prev', ctl), next = $('.next', ctl);
    function upd() {
      var max = reel.scrollWidth - reel.clientWidth, p = max > 0 ? reel.scrollLeft / max : 0;
      bar.style.transform = 'translateX(' + (p * 400).toFixed(1) + '%)';
      prev.disabled = reel.scrollLeft < 4;
      next.disabled = reel.scrollLeft > max - 4;
      ctl.hidden = max < 8;
    }
    function step(dir) {
      var c = reel.children[0];
      reel.scrollBy({ left: dir * (c ? c.offsetWidth + 16 : 320) * 2, behavior: reduce ? 'auto' : 'smooth' });
    }
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    reel.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd, { passive: true });
    var down = false, sx = 0, sl = 0;
    reel.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = reel.scrollLeft; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 4) reel.classList.add('drag');
      reel.scrollLeft = sl - dx;
    }, { passive: true });
    window.addEventListener('pointerup', function () { down = false; reel.classList.remove('drag'); });
    upd();
  });

  /* ---- panels catch the light under the pointer ---- */
  if (fine) {
    $$('.plan,.shift>div,.fit-grid>div,.rows>div,.principles>div,.steps li,.fit-answer,.day,.dock a,.slide').forEach(function (el) { el.classList.add('lit'); });
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest ? e.target.closest('.lit') : null;
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---- windows lean toward the pointer ---- */
  if (fine && !reduce) {
    $$('[data-tilt]').forEach(function (el) {
      var zone = el.parentElement;
      zone.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(1500px) rotateY(' + (x * 5).toFixed(2) + 'deg) rotateX(' + (-y * 4).toFixed(2) + 'deg)';
      }, { passive: true });
      zone.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---- stations: a short map of the page down the left edge ---- */
  var NAMES = { fit: 'Find your fit', products: 'The four products', day: 'Your day', standard: 'How we work', company: 'Company and questions',
    problem: 'The problem', demo: 'Try it', get: 'What you get', pricing: 'Pricing', questions: 'Questions', calendar: 'Calendar', compass: 'Compass',
    readouts: 'Readouts', control: 'Your controls', labels: 'Chart labels', console: 'The console', credit: 'Room credit', division: 'The division',
    join: 'How to join', rules: 'House rules' };
  var secs = $$('main > section[id]');
  if (secs.length >= 4 && 'IntersectionObserver' in window) {
    var st = document.createElement('nav');
    st.className = 'stations';
    st.setAttribute('aria-label', 'On this page');
    secs.forEach(function (s) {
      var a = document.createElement('a');
      a.href = '#' + s.id;
      a.innerHTML = '<span></span>';
      a.firstChild.textContent = NAMES[s.id] || (s.id.charAt(0).toUpperCase() + s.id.slice(1));
      st.appendChild(a);
    });
    document.body.appendChild(st);
    var dots = $$('a', st);
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        dots.forEach(function (d) { d.classList.toggle('on', d.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { so.observe(s); });
  }

  /* ---- legal pages: build the contents list and follow the reader ---- */
  var toc = $('.toc');
  if (toc) {
    var heads = $$('.legal h2[id]');
    heads.forEach(function (h) {
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent.replace(/^\s*\d+\s*/, '');
      toc.appendChild(a);
    });
    if ('IntersectionObserver' in window) {
      var links = $$('a', toc);
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (l) { l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id); });
        });
      }, { rootMargin: '-15% 0px -70% 0px' });
      heads.forEach(function (h) { io.observe(h); });
    }
  }

  /* ---- prefetch a page when its link is hovered ---- */
  var done = {};
  document.addEventListener('mouseover', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.host !== location.host) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || done[a.pathname] || a.pathname === location.pathname) return;
    done[a.pathname] = 1;
    var l = document.createElement('link');
    l.rel = 'prefetch';
    l.href = a.pathname;
    document.head.appendChild(l);
  }, { passive: true });

  /* ---- analytics beacon (feeds the admin dashboard) ---- */
  var EP = 'https://admin.blackcrownvxj.com/api/track';
  function hit(e, k, x) { try { new Image().src = EP + '?e=' + e + '&k=' + encodeURIComponent(k) + (x || '') + '&_=' + Date.now(); } catch (_) {} }
  var key = document.body.getAttribute('data-track');
  if (key) hit('visit', key, '&d=' + (window.innerWidth < 768 ? 'm' : 'd') + '&r=' + encodeURIComponent((document.referrer || '').slice(0, 200)));
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (/korvus\.industries/i.test(h)) hit('click', 'korvus');
    else if (/blackcrown-intelligence\.com/i.test(h)) hit('click', 'intelligence');
    else if (/discord\.(gg|com)/i.test(h)) hit('click', 'collective');
  }, true);

  /* ---- staff door: three quick clicks on the footer crown ---- */
  var mark = $('.site-foot .brand svg');
  if (mark) {
    var n = 0, t = 0;
    mark.addEventListener('click', function () {
      var now = Date.now();
      if (now - t > 1400) n = 0;
      t = now;
      if (++n >= 3) { n = 0; window.location.href = 'https://admin.blackcrownvxj.com'; }
    });
  }
})();
