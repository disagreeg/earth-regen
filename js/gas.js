(function (GG) {
  'use strict';
  const Gas = {};
  GG.gas = Gas;
  let C, S, gas = null, lastT = 0, acc = 0, working = [], workAt = 0;
  const cfg = () => (C && C.gas) || {};
  Gas.on = function () { C = GG.config; S = GG.state; return !!(cfg().enabled && S && S.g && !(GG.practice && GG.practice.active)); };

  function grounds() {
    return S.sitesIn(S.g.loc).map(function (n) {
      const t = S.type(n); if (!t || t.revive === false) return null;
      let k;
      if (t.grow) { const cap = GG.sim.growCap(n) || 1; k = Math.min(1, (n.grown || 0) / cap); }
      else { const full = n.full || t.reserve || 1; k = 1 - Math.max(0, n.reserve || 0) / full; }
      const b = S.siteBox(n);
      return { n: n, type: n.type, k: Math.max(0, Math.min(1, k)), w: b.w, h: b.h };
    }).filter(Boolean);
  }

  function workingNow(now) {
    if (now - workAt < 500) return working;
    workAt = now;
    const B = cfg().burners || {}, K = cfg().cleaners || {};
    working = S.machinesHere().filter(function (n) {
      if (!B[n.type] && !K[n.type]) return false;
      if (GG.sim.diagnose && GG.sim.diagnose(n)) return false;
      return Object.keys(n.rates || {}).some(function (k) { return (n.rates[k] || 0) > 1e-3; });
    });
    return working;
  }

  function make() {
    const G = cfg(), box = GG.render.contentBox(S.g.loc) || { minX: -1500, minY: -1000, maxX: 1500, maxY: 1000 };
    const M = G.margin || 1200, cs = G.cell || 60, x0 = box.minX - M, y0 = box.minY - M;
    const nx = Math.ceil((box.maxX - box.minX + 2 * M) / cs), ny = Math.ceil((box.maxY - box.minY + 2 * M) / cs);
    const c = document.createElement('canvas'); c.width = nx; c.height = ny;

    const UP = 3, sf = document.createElement('canvas'); sf.width = nx * UP; sf.height = ny * UP;
    gas = { loc: S.g.loc, cs: cs, x0: x0, y0: y0, nx: nx, ny: ny, D: new Float32Array(nx * ny), O: new Float32Array(nx * ny),
            X: new Float32Array(nx * ny), tmp: new Float32Array(nx * ny), cv: c, img: c.getContext('2d').createImageData(nx, ny), wind: 0,
            soft: sf, up: UP };

    for (let s = 0; s < (G.prerun || 0); s++) step(0.05, 0);
  }
  function add(A, wx, wy, rw, rh, v) {
    const g = gas, i0 = Math.max(0, Math.floor((wx - rw / 2 - g.x0) / g.cs)), i1 = Math.min(g.nx - 1, Math.floor((wx + rw / 2 - g.x0) / g.cs));
    const j0 = Math.max(0, Math.floor((wy - rh / 2 - g.y0) / g.cs)), j1 = Math.min(g.ny - 1, Math.floor((wy + rh / 2 - g.y0) / g.cs));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) A[j * g.nx + i] += v;
  }
  function diffuse(A, rate, dx) {
    const g = gas, T = g.tmp, nx = g.nx, ny = g.ny;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i, l = i > 0 ? A[k - 1] : 0, r = i < nx - 1 ? A[k + 1] : 0, u = j > 0 ? A[k - nx] : 0, d = j < ny - 1 ? A[k + nx] : 0;
      const up = dx > 0 ? l : r;
      T[k] = A[k] + rate * ((l + r + u + d) / 4 - A[k]) + Math.abs(dx) * (up - A[k]);
    }
    A.set(T);
  }
  function step(dt, t) {
    const G = cfg(), E = G.emit || {}, g = gas, F = G.flow || 1, wxId = (GG.sim.wxIn(S.g.loc) || {}).id;
    g.wind = 0.04 * (wxId === 'storm' ? 4 : 1) * F * Math.sin(t / 23);
    const W = G.whole || {};
    grounds().forEach(function (s) {
      const dirt = 1 - s.k, area = Math.min(1.5, (s.w * s.h) / 160000);
      if (s.type === 'treeSite') add(g.O, s.n.x, s.n.y, s.w, s.h, (E.grove || 0) * s.k * dt);
      else if (s.type === 'wasteSite') add(g.X, s.n.x, s.n.y, s.w, s.h, (E.waste || 0) * dirt * dt);
      else add(g.D, s.n.x, s.n.y, s.w, s.h, (E.dirtyGround || 0) * dirt * area * dt);

      if (W.enabled && s.type !== 'treeSite') add(g.O, s.n.x, s.n.y, s.w * 1.2, s.h * 1.2, (W.restored || 0) * s.k * area * dt);
    });
    if (t > 0) workingNow(performance.now()).forEach(function (n) {
      const z = S.sizeOf(n), b = (G.burners || {})[n.type], c = (G.cleaners || {})[n.type];
      if (b) add(g.D, n.x, n.y - z.h / 2, z.w * 0.5, z.h * 0.5, (E.burner || 0) * b * dt);
      if (c) add(g.O, n.x, n.y, z.w * 0.7, z.h * 0.7, (E.cleaner || 0) * c * dt);
    });
    const rate = Math.min(0.9, 0.5 * F + 0.05);
    diffuse(g.D, rate, g.wind); diffuse(g.O, rate, g.wind); diffuse(g.X, rate * 0.6, g.wind * 0.5);
    const Fd = G.fade || {}, wash = wxId === 'rain' || wxId === 'storm' ? (Fd.rain || 0) : (Fd.dirty || 0);
    for (let k = 0; k < g.D.length; k++) {
      const m = Math.min(g.D[k], g.O[k]) * 0.6 * dt;
      g.D[k] = Math.max(0, Math.min(3, g.D[k] - m - g.D[k] * wash * dt));
      g.O[k] = Math.max(0, Math.min(3, g.O[k] - m * 0.5 - g.O[k] * (Fd.clean || 0) * dt));
      g.X[k] = Math.max(0, Math.min(3, g.X[k] - g.X[k] * (Fd.toxic || 0) * dt));
    }
  }
  function paintCells() {
    const G = cfg(), g = gas, d = g.img.data, A = G.strength || 1, P = G.colours || {}, al = G.alpha || {};
    const pd = P.dirty || [138, 116, 68], po = P.clean || [125, 200, 255], px = P.toxic || [156, 204, 58];

    const W = G.whole || {}, pc = W.enabled ? GG.sim.placeWorked(S.g.loc) : 0;
    const bD = Math.min(1, (W.enabled ? (W.dirty || 0) * (1 - pc) : 0) * 0.9), bO = Math.min(1, (W.enabled ? (W.clean || 0) * pc : 0) * 0.9), bs = bD + bO + 1e-6;
    g.floor = { r: Math.round((pd[0] * bD + po[0] * bO) / bs), g: Math.round((pd[1] * bD + po[1] * bO) / bs), b: Math.round((pd[2] * bD + po[2] * bO) / bs),
                a: Math.min(1, A * ((al.dirty || 0) * bD + (al.clean || 0) * bO)) };
    for (let k = 0; k < g.D.length; k++) {
      const D = Math.min(1, g.D[k] * 0.9), O = Math.min(1, g.O[k] * 0.9), X = Math.min(1, g.X[k] * 0.9), sum = D + O + X + 1e-6;
      d[k * 4]     = (pd[0] * D + po[0] * O + px[0] * X) / sum;
      d[k * 4 + 1] = (pd[1] * D + po[1] * O + px[1] * X) / sum;
      d[k * 4 + 2] = (pd[2] * D + po[2] * O + px[2] * X) / sum;
      d[k * 4 + 3] = Math.min(255, 255 * A * ((al.dirty || 0) * D + (al.clean || 0) * O + (al.toxic || 0) * X));
    }
    g.cv.getContext('2d').putImageData(g.img, 0, 0);

    const s = g.soft.getContext('2d'), L = G.look || {};
    s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, g.soft.width, g.soft.height); s.imageSmoothingEnabled = true;
    if ('filter' in s) s.filter = 'blur(' + ((L.blur || 2.4) * g.up).toFixed(1) + 'px)';
    s.drawImage(g.cv, 0, 0, g.soft.width, g.soft.height);
    if ('filter' in s) s.filter = 'none';

    const e = Math.max(1, (L.edge || 6) * g.up), SW = g.soft.width, SH = g.soft.height;
    s.globalCompositeOperation = 'destination-in';
    [[0, 0, SW, 0], [0, 0, 0, SH]].forEach(function (d) {
      const gr = s.createLinearGradient(d[0], d[1], d[2], d[3]), fx = e / (d[2] ? SW : SH);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(fx, '#000'); gr.addColorStop(1 - fx, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      s.fillStyle = gr; s.fillRect(0, 0, SW, SH);
    });
    s.globalCompositeOperation = 'source-over';
  }

  function rnd(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function noiseTile(seed, oct, lo, hi) {
    const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), im = x.createImageData(N, N), F = new Float32Array(N * N), r = rnd(seed);
    let amp = 1, tot = 0;
    for (let o = 0; o < oct; o++) {
      const f = 4 << o, L = []; for (let i = 0; i < f * f; i++) L.push(r());
      const at = function (i, j) { return L[((j % f + f) % f) * f + ((i % f + f) % f)]; };
      for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) {
        const fx = xx / N * f, fy = y / N * f, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
        const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
        const a = at(i, j) + (at(i + 1, j) - at(i, j)) * su, b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * su;
        F[y * N + xx] += (a + (b - a) * sv) * amp;
      }
      tot += amp; amp *= 0.5;
    }
    for (let k = 0; k < N * N; k++) {
      const v = Math.max(0, Math.min(1, (F[k] / tot - 0.25) / 0.5));
      im.data[k * 4] = im.data[k * 4 + 1] = im.data[k * 4 + 2] = 255; im.data[k * 4 + 3] = Math.round((lo + (hi - lo) * v) * 255);
    }
    x.putImageData(im, 0, 0); return c;
  }
  let buf = null, mask = null, CLOUD = null, CLOUD2 = null;

  Gas.draw = function (ctx, base, cam, w, h, time, night) {
    if (!Gas.on()) return;
    const G = cfg(), L = G.look || {};
    if (!gas || gas.loc !== S.g.loc || gas.cs !== (G.cell || 60)) { make(); lastT = time; acc = 1; }

    acc += Math.min(0.25, Math.max(0, time - lastT)); lastT = time;
    if (acc >= 1 / (G.rate || 15)) { step(Math.min(0.25, acc), time); paintCells(); acc = 0; }
    if (!CLOUD) { CLOUD = noiseTile(11, 5, 0.25, 1); CLOUD2 = noiseTile(29, 4, 0.35, 1); }
    const g = gas, sc = cam.scale, s = base.a, k = s * 0.5;
    const PW = Math.max(2, Math.ceil(w * s * 0.5)), PH = Math.max(2, Math.ceil(h * s * 0.5));
    const fit = function (c) { if (!c) c = document.createElement('canvas'); if (c.width !== PW || c.height !== PH) { c.width = PW; c.height = PH; } return c; };
    buf = fit(buf); mask = fit(mask);
    const b = buf.getContext('2d'), m = mask.getContext('2d');
    const world = function (c2) { c2.setTransform(k * sc, 0, 0, k * sc, k * (w / 2 - cam.x * sc), k * (h / 2 - cam.y * sc)); };
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1; b.clearRect(0, 0, PW, PH);

    const f = g.floor;
    if (f && f.a > 0.001) { b.fillStyle = 'rgba(' + f.r + ',' + f.g + ',' + f.b + ',' + f.a.toFixed(3) + ')'; b.fillRect(0, 0, PW, PH); }
    world(b); b.imageSmoothingEnabled = true; b.imageSmoothingQuality = 'high';
    b.drawImage(g.soft, g.x0, g.y0, g.nx * g.cs, g.ny * g.cs);

    const size = (G.patch || 1500) * (L.size || 3.5), drift = time * (L.drift || 6) * (G.flow || 1);
    const fill = function (c2, tile, sz, dx, dy) { const pat = c2.createPattern(tile, 'repeat'); pat.setTransform(new DOMMatrix().translate(dx, dy).scale(sz / 256));
      c2.fillStyle = pat; c2.fillRect(cam.x - w / 2 / sc - 50, cam.y - h / 2 / sc - 50, w / sc + 100, h / sc + 100); };
    m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.clearRect(0, 0, PW, PH);
    world(m); fill(m, CLOUD, size, drift, drift * 0.4);
    m.globalCompositeOperation = 'destination-in'; fill(m, CLOUD2, size * 0.55, -drift * 0.7, drift * 0.5);
    m.globalCompositeOperation = 'source-over'; m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalAlpha = L.floor === undefined ? 0.3 : L.floor; m.fillStyle = '#fff'; m.fillRect(0, 0, PW, PH);
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'destination-in'; b.drawImage(mask, 0, 0);
    b.globalCompositeOperation = 'source-over';
    const keep = G.nightKeep === undefined ? 1 : G.nightKeep;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = (L.alpha || 0.9) * (1 - (1 - keep) * (night || 0));
    ctx.drawImage(buf, 0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
  };

  Gas.stats = function () {
    if (!gas) return null;
    let D = 0, O = 0, X = 0; for (let k = 0; k < gas.D.length; k++) { D += gas.D[k]; O += gas.O[k]; X += gas.X[k]; }
    const n = gas.D.length;
    return { loc: gas.loc, cells: gas.nx + ' x ' + gas.ny, dirty: +(D / n).toFixed(3), clean: +(O / n).toFixed(3), toxic: +(X / n).toFixed(3), working: working.length };
  };
  Gas.reset = function () { gas = null; };
})(window.GG);
