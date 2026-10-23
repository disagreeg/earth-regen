window.GG = window.GG || {};
GG.menu = (function () {
  'use strict';

  const M = {};
  let root = null, page = 'home', open = true, started = false;
  let bgCv = null, bgCtx = null, pts = null, packets = [], bgLast = 0, bgRAF = 0;
  const C = () => GG.config;

  function bgInit() {
    const cfg = C().menu.bg;
    pts = [];
    for (let i = 0; i < cfg.nodes; i++) {
      pts.push({
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - 0.5), vy: (Math.random() - 0.5),
        r: cfg.dotMin + Math.random() * (cfg.dotMax - cfg.dotMin),
        c: cfg.hue[Math.floor(Math.random() * cfg.hue.length)],
      });
    }
    packets = [];
  }

  function bgResize() {
    if (!bgCv) return;
    const dpr = window.devicePixelRatio || 1;

    const w = bgCv.clientWidth, h = bgCv.clientHeight;
    const r = bgCv.getBoundingClientRect();
    const k = (w && r.width) ? (r.width / w) * dpr : dpr;
    bgCv.width = Math.round(w * k);
    bgCv.height = Math.round(h * k);
    bgCtx.setTransform(k, 0, 0, k, 0, 0);
  }

  function bgStep(dt, w, h) {
    const cfg = C().menu.bg;
    for (const p of pts) {
      p.x += p.vx * cfg.speed * dt / w;
      p.y += p.vy * cfg.speed * dt / h;

      if (p.x < -0.05) p.x = 1.05; if (p.x > 1.05) p.x = -0.05;
      if (p.y < -0.05) p.y = 1.05; if (p.y > 1.05) p.y = -0.05;
    }
    for (let i = packets.length - 1; i >= 0; i--) {
      packets[i].k += cfg.packetSpeed * dt;
      if (packets[i].k >= 1) packets.splice(i, 1);
    }
  }

  let skyStars = null, skyNeb = null, skyW = 0, skyH = 0, skyT = 0;
  function skyCfg() { const s = C().menu.sky; return s && s.enabled ? s : null; }
  function skyDraw(dt, w, h) {
    const cfg = skyCfg();
    if (!cfg) return;
    skyT += dt;
    if (!skyStars) {
      let s = 7; const rnd = function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
      skyStars = [];
      for (let i = 0; i < (cfg.stars || 0); i++) {
        const big = rnd() < (cfg.bigShare || 0);
        skyStars.push({ x: rnd(), y: rnd(), r: big ? 1.1 + rnd() * 0.8 : 0.4 + rnd() * 0.6,
                        a: big ? 0.7 + rnd() * 0.3 : 0.25 + rnd() * 0.45,
                        sp: 0.6 + rnd() * 2.2, ph: rnd() * Math.PI * 2, tint: rnd() });
      }
    }
    if (cfg.nebula) {
      if (!skyNeb || skyW !== w || skyH !== h) {
        skyW = w; skyH = h;
        skyNeb = document.createElement('canvas');
        skyNeb.width = Math.max(1, Math.round(w / 2)); skyNeb.height = Math.max(1, Math.round(h / 2));
        const n = skyNeb.getContext('2d'), W2 = skyNeb.width, H2 = skyNeb.height;
        (cfg.blobs || []).forEach(function (b) {
          const g = n.createRadialGradient(b[0] * W2, b[1] * H2, 0, b[0] * W2, b[1] * H2, b[2] * Math.max(W2, H2));
          g.addColorStop(0, 'rgba(' + b[3] + ',' + b[4] + ')'); g.addColorStop(1, 'rgba(' + b[3] + ',0)');
          n.fillStyle = g; n.fillRect(0, 0, W2, H2);
        });
      }
      bgCtx.drawImage(skyNeb, 0, 0, w, h);
    }
    const drift = skyT * (cfg.drift || 0);
    for (const p of skyStars) {
      const x = ((p.x + drift) % 1) * w, y = p.y * h;
      const a = p.a * (0.72 + 0.28 * Math.sin(skyT * p.sp + p.ph));
      bgCtx.fillStyle = p.tint < 0.15 ? 'rgba(255,220,190,' + a + ')'
                      : p.tint > 0.85 ? 'rgba(190,215,255,' + a + ')' : 'rgba(235,240,250,' + a + ')';
      bgCtx.beginPath(); bgCtx.arc(x, y, p.r, 0, Math.PI * 2); bgCtx.fill();
    }
  }

  function bgDraw(dt) {
    if (!bgCtx) return;
    const w = bgCv.clientWidth, h = bgCv.clientHeight, cfg = C().menu.bg;
    bgStep(dt, w, h);
    bgCtx.clearRect(0, 0, w, h);
    skyDraw(dt, w, h);
    bgCtx.globalAlpha = cfg.alpha;

    const near = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const ax = a.x * w, ay = a.y * h, bx = b.x * w, by = b.y * h;
        const d = Math.hypot(bx - ax, by - ay);
        if (d > cfg.linkDist) continue;
        const k = 1 - d / cfg.linkDist;
        near.push({ a: a, ax: ax, ay: ay, bx: bx, by: by, k: k });
        bgCtx.strokeStyle = a.c;
        bgCtx.globalAlpha = cfg.alpha * k * 0.22;
        bgCtx.lineWidth = 1;
        bgCtx.beginPath();
        bgCtx.moveTo(ax, ay);

        bgCtx.bezierCurveTo((ax + bx) / 2, ay, (ax + bx) / 2, by, bx, by);
        bgCtx.stroke();
      }
    }

    if (near.length && Math.random() < cfg.packetChance * dt * near.length * 0.1) {
      const n = near[Math.floor(Math.random() * near.length)];
      packets.push({ ax: n.ax, ay: n.ay, bx: n.bx, by: n.by, k: 0, c: n.a.c });
    }
    for (const p of packets) {
      const t = p.k, mt = 1 - t;
      const cx1 = (p.ax + p.bx) / 2, cx2 = cx1;
      const x = mt * mt * mt * p.ax + 3 * mt * mt * t * cx1 + 3 * mt * t * t * cx2 + t * t * t * p.bx;
      const y = mt * mt * mt * p.ay + 3 * mt * mt * t * p.ay + 3 * mt * t * t * p.by + t * t * t * p.by;
      bgCtx.globalAlpha = cfg.alpha * Math.sin(t * Math.PI);
      bgCtx.fillStyle = p.c;
      bgCtx.beginPath(); bgCtx.arc(x, y, 2.4, 0, Math.PI * 2); bgCtx.fill();
    }

    for (const p of pts) {
      bgCtx.globalAlpha = cfg.alpha * 0.75;
      bgCtx.fillStyle = p.c;
      bgCtx.beginPath(); bgCtx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2); bgCtx.fill();
      bgCtx.globalAlpha = cfg.alpha * 0.14;
      bgCtx.beginPath(); bgCtx.arc(p.x * w, p.y * h, p.r * 4, 0, Math.PI * 2); bgCtx.fill();
    }
    bgCtx.globalAlpha = 1;
  }

  function bgLoop(now) {
    if (!open) { bgRAF = 0; return; }
    const t = now / 1000;
    const dt = Math.min(0.05, bgLast ? t - bgLast : 0);
    bgLast = t;

    if (loadingNow && loadingCfg().quietMenu) { bgRAF = requestAnimationFrame(bgLoop); return; }
    bgDraw(dt);
    if (eCtx) earthDraw(dt);
    bgRAF = requestAnimationFrame(bgLoop);
  }

  const LANDMASK = [
    [],
    [[16, 31]],
    [[12, 32], [38, 41], [45, 49], [54, 58]],

    [[4, 22], [25, 32], [46, 47], [49, 50], [53, 58],
     [61, 62], [64, 65]],

    [[3, 24], [26, 31], [38, 42], [45, 49], [51, 71]],

    [[2, 16], [21, 23], [26, 28], [31, 33], [37, 38],
     [40, 71]],

    [[3, 16], [21, 24], [34, 35], [37, 63], [67, 68]],

    [[3, 5], [10, 18], [21, 25], [34, 35], [37, 64],
     [67, 67]],
    [[11, 16], [19, 24], [35, 64]],
    [[11, 22], [34, 38], [40, 41], [45, 45],
     [48, 62], [64, 65]],

    [[12, 20], [34, 35], [38, 38], [40, 46], [48, 59],
     [61, 61], [63, 64]],

    [[12, 19], [34, 40], [43, 60], [62, 63]],

    [[13, 16], [19, 19], [33, 46], [48, 60]],
    [[14, 16], [19, 21], [33, 42], [44, 47], [50, 53],
     [55, 58], [60, 60]],
    [[15, 17], [21, 22], [32, 43], [45, 47], [50, 53],
     [56, 58]],

    [[17, 19], [21, 23], [33, 43], [45, 47], [51, 52],
     [56, 58], [60, 61]],

    [[20, 23], [33, 45], [52, 52], [56, 57], [60, 61]],
    [[20, 26], [37, 45], [55, 56], [58, 59]],
    [[20, 27], [37, 44], [56, 56], [58, 60]],
    [[20, 29], [38, 44], [57, 58], [60, 64]],
    [[20, 29], [38, 45], [61, 65]],
    [[21, 29], [38, 43], [45, 46], [60, 65]],
    [[21, 28], [38, 43], [45, 46], [59, 66]],
    [[22, 26], [38, 42], [59, 66]],
    [[22, 25], [39, 42], [59, 66]],
    [[23, 24], [64, 65], [70, 71]],

    [[23, 24], [65, 65], [70, 70]],
    [[23, 23]],
    [[22, 23]],
    [],
    [[23, 24]],
    [[23, 24], [36, 66]],
    [[0, 25], [32, 71]],
    [[0, 71]], [[0, 71]], [[0, 71]],
  ];
  let MW = 72, MH = 36;
  let MASK = null, maskRows = null;
  function maskBuild() {
    MASK = new Float32Array(MW * MH);
    (maskRows || LANDMASK).forEach(function (row, r) {
      (row || []).forEach(function (seg) {
        for (let c = seg[0]; c <= seg[1]; c++) MASK[r * MW + c] = 1;
      });
    });
  }

  function landAt(lon, lat) {
    if (!MASK) maskBuild();
    let u = (lon / (Math.PI * 2) + 0.5) * MW - 0.5;
    let v = (0.5 - lat / Math.PI) * MH - 0.5;
    const u0 = Math.floor(u), v0 = Math.floor(v);
    const fu = u - u0, fv = v - v0;
    const w = function (c, r) {
      c = ((c % MW) + MW) % MW;
      r = r < 0 ? 0 : (r > MH - 1 ? MH - 1 : r);
      return MASK[r * MW + c];
    };
    const a = w(u0, v0) * (1 - fu) + w(u0 + 1, v0) * fu;
    const b = w(u0, v0 + 1) * (1 - fu) + w(u0 + 1, v0 + 1) * fu;
    return a * (1 - fv) + b * fv;
  }

  M.landMask = function (rows, w, h) {
    maskRows = rows || null; MW = rows ? w : 72; MH = rows ? h : 36; MASK = null;
  };

  M.landAt = function (lonDeg, latDeg) {
    return landAt(lonDeg * Math.PI / 180, latDeg * Math.PI / 180);
  };

  const LAND = [
    { lo: -1.95, la:  0.60, r: 0.30 }, { lo: -1.74, la:  0.16, r: 0.17 },
    { lo: -1.36, la: -0.40, r: 0.24 }, { lo:  0.06, la:  0.54, r: 0.21 },
    { lo:  0.30, la:  0.10, r: 0.27 }, { lo:  0.44, la: -0.44, r: 0.20 },
    { lo:  1.36, la:  0.44, r: 0.30 }, { lo:  1.82, la: -0.04, r: 0.18 },
    { lo:  2.46, la: -0.56, r: 0.19 }, { lo:  2.92, la:  0.28, r: 0.14 },
    { lo:  0.00, la: -1.18, r: 0.28 },
  ];

  function seeded(n, fn) {
    const a = []; let s = 20260811;
    const rnd = function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = 0; i < n; i++) a.push(fn(rnd, i));
    return a;
  }

  const SPECKS = seeded(64, function (rnd) {
    return { lo: rnd() * Math.PI * 2, la: (rnd() - 0.5) * 2.2, r: 0.02 + rnd() * 0.05 };
  });

  const CLOUDS = seeded(14, function (rnd) {
    return { lo: rnd() * Math.PI * 2, la: (rnd() - 0.5) * 1.9,
             r: 0.13 + rnd() * 0.13, o: (rnd() - 0.5) * 0.30, ov: (rnd() - 0.5) * 0.16 };
  });

  let eCv = null, eCtx = null, eRot = 0;
  let eCur = 0, eTarget = 0;
  let eStage = 0, eCap = '', eSub = '';

  let ePin = 0, eAuto = false, eAutoT = 0;

  let eGrab = null, eSpin = 0;

  function earthOn() { const e = C().menu.earth; return !!(e && e.enabled); }
  function dragCfg() {
    const d = (C().menu.earth || {}).drag || {};
    return { enabled: d.enabled !== false, turnPerWidth: d.turnPerWidth || 1,
             spin: d.spin !== false, spinDecaySec: d.spinDecaySec || 1.1,
             maxSpin: d.maxSpin || 7 };
  }
  function homeEarth() { return earthOn() && C().menu.earth.onHome !== false; }

  function stageOf(pct) {
    const n = C().menu.earth.stages;
    return Math.max(0, Math.min(n - 1, Math.round((pct || 0) * (n - 1))));
  }

  function lastPlayed() {
    let best = null;
    for (let i = 1; i <= C().menu.slots; i++) {
      const m = GG.state.slotMeta(i);
      if (m && (!best || (m.savedAt || 0) > (best.savedAt || 0))) best = m;
    }
    return best;
  }

  function capWrite() {
    const cap = root && root.querySelector('.mn-earth-cap');
    if (cap) cap.innerHTML = '<b>' + eCap + '</b><i>' + eSub + '</i>';
    if (!root) return;
    root.querySelectorAll('.mn-eg[data-stage]').forEach(function (b) {
      const v = b.dataset.stage;
      b.classList.toggle('on', v === 'auto' ? eAuto
                             : v === 'live' ? (!ePin && !eAuto)
                             : (+v === ePin && !eAuto));
    });
  }

  function earthShow(m, slot, snap) {

    if (ePin || eAuto) { capWrite(); return; }
    const n = C().menu.earth.stages, T = GG.i18n.t;
    const sl = T('mn.slot').charAt(0) + T('mn.slot').slice(1).toLowerCase();
    eStage = stageOf(m ? m.pct : 0);
    eTarget = n > 1 ? eStage / (n - 1) : 1;
    eCap = T('mn.stage') + ' ' + (eStage + 1) + ' / ' + n;
    eSub = m ? (m.name ? esc(m.name) : sl + ' ' + m.slot) + ' &mdash; ' +
               Math.round(m.pct * 100) + '% ' + T('mn.cleaned')
             : (slot ? sl + ' ' + slot + ' &mdash; ' + T('mn.nothingYet') : T('mn.noRun'));
    if (snap) eCur = eTarget;
    capWrite();
  }

  function earthDefault(snap) { earthShow(lastPlayed(), 0, snap); }

  function setStage(i, snap, tag) {
    const tot = C().menu.earth.stages, T = GG.i18n.t;
    eStage = Math.max(0, Math.min(tot - 1, i));
    eTarget = tot > 1 ? eStage / (tot - 1) : 1;
    if (snap) eCur = eTarget;
    eCap = T('mn.stage') + ' ' + (eStage + 1) + ' / ' + tot;
    eSub = T(tag) + ' &mdash; ' + Math.round(eTarget * 100) + '% ' + T('mn.cleaned');
    capWrite();
  }

  M.earthPreview = function (n, snap) {
    const tot = C().menu.earth.stages;
    eAuto = false;
    ePin = Math.max(0, Math.min(tot, Math.round(n || 0)));
    if (!ePin) { earthDefault(false); return 0; }
    setStage(ePin - 1, snap, 'mn.preview');
    return ePin;
  };

  M.earthAuto = function (on) {
    const want = on === undefined ? !eAuto : !!on;
    ePin = 0; eAuto = false;
    if (!want) { earthDefault(false); return false; }
    eAuto = true; eAutoT = 0;
    setStage(0, true, 'mn.auto');
    return true;
  };

  function mix(a, b, t) {
    const p = function (h) {
      return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    };
    const x = p(a), y = p(b), o = [];
    for (let i = 0; i < 3; i++) {
      o.push(Math.max(0, Math.min(255, Math.round(x[i] + (y[i] - x[i]) * t)))
        .toString(16).padStart(2, '0'));
    }
    return '#' + o.join('');
  }

  function rgbOf(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }

  let sphCv = null, sphCtx = null, sphImg = null;
  function sphereBuf(n) {
    if (!sphCv || sphCv.width !== n) {
      sphCv = document.createElement('canvas');
      sphCv.width = sphCv.height = n;
      sphCtx = sphCv.getContext('2d');
      sphImg = sphCtx.createImageData(n, n);
    }
    return sphImg;
  }

  function drawReal(cx, cy, R, c, cfg) {
    const n = Math.max(48, Math.min(cfg.detailPx || 200, Math.round(R * 2)));
    const img = sphereBuf(n), px = img.data;
    const sea = rgbOf(mix(cfg.dirty.sea, cfg.clean.sea, c));
    const land = rgbOf(mix(cfg.dirty.land, cfg.clean.land, c));

    const dry = rgbOf(mix(cfg.dirty.dry || '#7a6a4a', cfg.clean.dry || '#b7a06a', c));
    const ice = rgbOf(mix(cfg.dirty.ice || '#9c9384', cfg.clean.ice || '#eaf7ff', c));
    const ct = Math.cos(cfg.tilt), st = Math.sin(cfg.tilt);

    const lx = -0.42, ly = 0.50, lz = 0.76;

    const gl = cfg.glint || {};
    const gPow  = gl.power === undefined ? 22  : gl.power;
    const gBase = gl.base  === undefined ? 60  : gl.base;
    const gGain = gl.gain  === undefined ? 120 : gl.gain;

    const iceLat = Math.min(89, (cfg.iceLat === undefined ? 66 : cfg.iceLat) +
                                (cfg.iceLoss === undefined ? 12 : cfg.iceLoss) * (1 - c));
    const iceEdge = Math.sin(iceLat * Math.PI / 180);
    const iceSpan = Math.max(0.004, 1 - iceEdge);
    const half = n / 2, inv = 1 / (half - 0.5);

    const LT = cfg.lights || {};
    const litOn = LT.enabled === true;
    const cellR = (LT.cellDeg || 1.3) * Math.PI / 180;
    const clusR = (LT.clusterDeg || 10) * Math.PI / 180;
    const dens0 = (LT.min === undefined ? 0.03 : LT.min) +
                  ((LT.max === undefined ? 0.4 : LT.max) - (LT.min === undefined ? 0.03 : LT.min)) * c;
    const nFrom = (LT.night || [0.05, 0.4])[0], nTo = (LT.night || [0.05, 0.4])[1];
    const lit = rgbOf(LT.color || '#ffcf7a');
    const litK = LT.strength === undefined ? 0.95 : LT.strength;
    function hsh(a, b, s) {
      let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(s, 1274126177);
      h = Math.imul(h ^ (h >>> 13), 1103515245);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }

    for (let y = 0; y < n; y++) {
      const ny = (y + 0.5 - half) * inv;
      for (let x = 0; x < n; x++) {
        const i = (y * n + x) * 4;
        const nx = (x + 0.5 - half) * inv;
        const d2 = nx * nx + ny * ny;
        if (d2 >= 1) { px[i + 3] = 0; continue; }
        const z = Math.sqrt(1 - d2);
        const Y = -ny;

        const y0 = Y * ct + z * st;
        const z0 = -Y * st + z * ct;
        const lat = Math.asin(Math.max(-1, Math.min(1, y0)));
        let lon = Math.atan2(nx, z0) - eRot;
        lon = lon % (Math.PI * 2);
        if (lon > Math.PI) lon -= Math.PI * 2; else if (lon < -Math.PI) lon += Math.PI * 2;

        let g = landAt(lon, lat);
        g = g <= 0.34 ? 0 : g >= 0.62 ? 1 : (g - 0.34) / 0.28;

        const band = Math.abs(Math.abs(lat) - 0.42) < 0.20 ? 1 : 0;
        let r0, g0, b0;
        if (g > 0) {
          const dm = band * 0.55;
          r0 = land[0] + (dry[0] - land[0]) * dm;
          g0 = land[1] + (dry[1] - land[1]) * dm;
          b0 = land[2] + (dry[2] - land[2]) * dm;
          r0 = sea[0] + (r0 - sea[0]) * g;
          g0 = sea[1] + (g0 - sea[1]) * g;
          b0 = sea[2] + (b0 - sea[2]) * g;
        } else { r0 = sea[0]; g0 = sea[1]; b0 = sea[2]; }

        const ab = Math.abs(y0);
        let iceK = 0;
        if (ab > iceEdge) {
          iceK = Math.min(1, (ab - iceEdge) / iceSpan);
          iceK = iceK * iceK * (3 - 2 * iceK);
          r0 += (ice[0] - r0) * iceK; g0 += (ice[1] - g0) * iceK; b0 += (ice[2] - b0) * iceK;
        }

        let lam = nx * lx + Y * ly + z * lz;
        if (lam < 0) lam = 0;
        const sh = 0.28 + 0.80 * lam;
        r0 *= sh; g0 *= sh; b0 *= sh;

        if (litOn && g > 0.5 && iceK < 0.3 && lam < nTo) {
          const dark = lam <= nFrom ? 1 : 1 - (lam - nFrom) / (nTo - nFrom);
          const ix = Math.floor((lon + Math.PI) / cellR), iy = Math.floor((lat + 2) / cellR);
          const cw = hsh(Math.floor((lon + Math.PI) / clusR), Math.floor((lat + 2) / clusR), 7);

          const dens = dens0 * (0.06 + 2.4 * cw * cw * cw) * (band ? 0.5 : 1);
          if (hsh(ix, iy, 1) < dens) {
            const k = dark * litK * (0.5 + 0.5 * hsh(ix, iy, 3));
            r0 += (lit[0] - r0) * k; g0 += (lit[1] - g0) * k; b0 += (lit[2] - b0) * k;
          }
        }

        const icd = iceK < 0.4 ? 1 - iceK / 0.4 : 0;
        if (icd > 0 && g < 1) {
          const sp = Math.pow(lam, gPow) * (gBase + gGain * c) * (1 - g) * icd;
          if (sp > 0) {
            const k = sp < 255 ? sp / 255 : 1;
            r0 += (255 - r0) * k; g0 += (255 - g0) * k; b0 += (255 - b0) * k;
          }
        }
        px[i]     = r0 > 255 ? 255 : r0;
        px[i + 1] = g0 > 255 ? 255 : g0;
        px[i + 2] = b0 > 255 ? 255 : b0;
        px[i + 3] = 255;
      }
    }
    sphCtx.putImageData(img, 0, 0);
    eCtx.drawImage(sphCv, cx - R, cy - R, R * 2, R * 2);
  }

  function v2Cfg() { const e = C().menu.earth; return e && e.v2 && e.v2.enabled ? e.v2 : null; }

  function vHash(x, y, z, s) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1440670441) ^ Math.imul(s, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1103515245);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function vNoise(x, y, z, s) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    let fx = x - xi, fy = y - yi, fz = z - zi;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
    const a = vHash(xi, yi, zi, s), b = vHash(xi + 1, yi, zi, s), c = vHash(xi, yi + 1, zi, s), d = vHash(xi + 1, yi + 1, zi, s);
    const e = vHash(xi, yi, zi + 1, s), f = vHash(xi + 1, yi, zi + 1, s), g = vHash(xi, yi + 1, zi + 1, s), h = vHash(xi + 1, yi + 1, zi + 1, s);
    const x1 = a + (b - a) * fx, x2 = c + (d - c) * fx, x3 = e + (f - e) * fx, x4 = g + (h - g) * fx;
    const y1 = x1 + (x2 - x1) * fy, y2 = x3 + (x4 - x3) * fy;
    return y1 + (y2 - y1) * fz;
  }
  function vFbm(x, y, z, oct, s) {
    let a = 0.5, f = 1, sum = 0, n = 0;
    for (let i = 0; i < oct; i++) { sum += a * vNoise(x * f, y * f, z * f, s + i * 31); n += a; a *= 0.5; f *= 2.03; }
    return sum / n;
  }
  function zScore(arr) {
    let m = 0; for (let i = 0; i < arr.length; i++) m += arr[i]; m /= arr.length;
    let v = 0; for (let i = 0; i < arr.length; i++) v += (arr[i] - m) * (arr[i] - m); v = Math.sqrt(v / arr.length) || 1;
    for (let i = 0; i < arr.length; i++) arr[i] = (arr[i] - m) / v;
  }
  function sStep(a, b, x) { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function mix3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  function zone(a, t, d, m, b, u) {
    if (a < 12) return t;
    if (a < 22) return mix3(t, d, sStep(12, 22, a));
    if (a < 32) return d;
    if (a < 42) return mix3(d, m, sStep(32, 42, a));
    if (a < 52) return m;
    if (a < 58) return mix3(m, b, sStep(52, 58, a));
    if (a < 64) return b;
    if (a < 70) return mix3(b, u, sStep(64, 70, a));
    return u;
  }

  let v2 = null;
  function v2Bake(v) {
    const tw = v.texW || 512, th = tw / 2, cw = v.cloudW || 384, ch = cw / 2;
    const P = v.palette, h = function (x) { return rgbOf(x); };
    const L = { tro: h(P.tropics), des: h(P.desert), tem: h(P.temperate), bor: h(P.north), tun: h(P.tundra),
                dTro: h(P.deadTropics), dDes: h(P.deadDesert), dTem: h(P.deadTemperate), dBor: h(P.deadNorth), dTun: h(P.deadTundra),
                deep: h(P.seaDeep), shal: h(P.seaShallow), dDeep: h(P.deadSeaDeep), dShal: h(P.deadSeaShallow) };
    const clean = new Float32Array(tw * th * 4), dirty = new Float32Array(tw * th * 3);
    const D = v.detail || 0;
    const R2D = 180 / Math.PI;
    for (let y = 0; y < th; y++) {
      const lat = (0.5 - (y + 0.5) / th) * Math.PI, latD = Math.abs(lat) * R2D, la = lat * R2D;
      for (let x = 0; x < tw; x++) {
        const lon = ((x + 0.5) / tw - 0.5) * Math.PI * 2, lo = lon * R2D, j = y * tw + x;
        let g = landAt(lon, lat);

        if (g < 0.6) {
          let m = 0;
          for (let dy = -5; dy <= 5; dy += 5) for (let dx = -5; dx <= 5; dx += 5) {
            if (dx || dy) m += landAt((lo + dx) / R2D, Math.max(-90, Math.min(90, la + dy)) / R2D);
          }
          if (m / 8 > 0.8) g = Math.max(g, 0.8);
        }

        let gx = 0, gy = 0, gz = 0, inland = 0;
        const g0 = g, soft = g <= 0.34 ? 0 : g >= 0.62 ? 1 : (g - 0.34) / 0.28;
        const CN = D * (v.coastNoise === undefined ? 1 : v.coastNoise), IW = v.inlandWater || 0;
        if (D) gx = Math.cos(lat) * Math.cos(lon), gy = Math.sin(lat), gz = Math.cos(lat) * Math.sin(lon);
        if (CN || IW) {

          if (g < 0.62) {
            let m = 0;
            for (let k = 0; k < 8; k++) {
              const a = k * Math.PI / 4;
              m += landAt((lo + 10 * Math.cos(a) / Math.max(0.2, Math.cos(lat))) / R2D, Math.max(-90, Math.min(90, la + 10 * Math.sin(a))) / R2D);
            }
            inland = sStep(0.45, 0.7, m / 8);
          }
          g += (vFbm(gx * 6 + 11, gy * 6, gz * 6, 6, 313) - 0.5) * 0.9 * CN * (1 - inland);
        }
        let land = CN ? sStep(0.45, 0.53, g) * (1 - inland) + soft * inland : soft;

        let shallow = Math.pow(sStep(0.10, 0.48, D ? g0 : g), 2.4);
        if (IW && inland) {
          shallow += (1 - shallow) * IW * inland;
          land += (1 - land) * 0.3 * IW * inland;
        }
        const cl = mix3(mix3(L.deep, L.shal, shallow), zone(latD, L.tro, L.des, L.tem, L.bor, L.tun), land);
        const dl = mix3(mix3(L.dDeep, L.dShal, shallow), zone(latD, L.dTro, L.dDes, L.dTem, L.dBor, L.dTun), land);
        if (D && land > 0) {
          const k = 1 + (vFbm(gx * 14, gy * 14, gz * 14, 5, 515) - 0.5) * 0.55 * D * land;
          cl[0] *= k; cl[1] *= k; cl[2] *= k; dl[0] *= k; dl[1] *= k; dl[2] *= k;
        }
        clean[j * 4] = cl[0]; clean[j * 4 + 1] = cl[1]; clean[j * 4 + 2] = cl[2]; clean[j * 4 + 3] = land;
        dirty[j * 3] = dl[0]; dirty[j * 3 + 1] = dl[1]; dirty[j * 3 + 2] = dl[2];
      }
    }

    const n = cw * ch, sw = new Float32Array(n), sm = new Float32Array(n);
    for (let y = 0; y < ch; y++) {
      const lat = (0.5 - (y + 0.5) / ch) * Math.PI, c0 = Math.cos(lat), s0 = Math.sin(lat);
      for (let x = 0; x < cw; x++) {
        const lon = ((x + 0.5) / cw - 0.5) * Math.PI * 2;
        const px = c0 * Math.cos(lon), py = s0, pz = c0 * Math.sin(lon), j = y * cw + x;
        const q = vFbm(px * 1.6, py * 1.6, pz * 1.6, 3, 707) - 0.5, r = vFbm(px * 1.6 + 7.1, py * 1.6, pz * 1.6, 3, 808) - 0.5;
        sw[j] = vFbm(px * 2.6 + q * 3.2, py * 2.6 + r * 3.2, pz * 2.6 + (q - r) * 2, 3, 909);
        if (D) sw[j] += (vFbm(px * 9 + q * 4, py * 9 + r * 4, pz * 9, 4, 919) - 0.5) * 0.35 * D;
        const q2 = vFbm(px * 1.3 + 3, py * 1.3, pz * 1.3, 2, 111) - 0.5;
        sm[j] = vFbm(px * 2 + q2 * 3, py * 2 - q2 * 2, pz * 2 + q2, 3, 222);
        if (D) sm[j] += (vFbm(px * 8 + q2 * 3, py * 8, pz * 8, 4, 929) - 0.5) * 0.3 * D;
      }
    }
    zScore(sw); zScore(sm);
    const cloud = new Float32Array(n), smog = new Float32Array(n), ca = v.cloudAlpha || 0.62;
    for (let y = 0; y < ch; y++) {
      const lat = (0.5 - (y + 0.5) / ch) * Math.PI, al = Math.abs(lat);

      const band = 0.45 * Math.exp(-Math.pow(lat / 0.14, 2)) - 0.55 * Math.exp(-Math.pow((al - 0.47) / 0.13, 2)) +
                   0.40 * Math.exp(-Math.pow((al - 1.02) / 0.18, 2));
      for (let x = 0; x < cw; x++) {
        const j = y * cw + x;
        cloud[j] = sStep(0.75 - band, 2.1 - band, sw[j]) * ca;
        smog[j] = sStep(-0.6, 1.0, sm[j]);
      }
    }
    v2 = { tw: tw, th: th, cw: cw, ch: ch, clean: clean, dirty: dirty, mix: new Float32Array(tw * th * 4), mixC: -1,
           cloud: cloud, smog: smog, geo: null, buf: null, bctx: null, img: null, last: -1, lastRot: 0, lastC: -1 };
  }

  function v2Geo(N, tilt) {
    const ct = Math.cos(tilt), st = Math.sin(tilt), half = N / 2, e = 1 / half;
    const lx = -0.42, ly = 0.50, lz = 0.76;
    const idx = [], lat = [], lon = [], lam = [], ys = [], aa = [], rim = [];
    for (let y = 0; y < N; y++) {
      const ny = (y + 0.5 - half) / half;
      for (let x = 0; x < N; x++) {
        let nx = (x + 0.5 - half) / half, d2 = nx * nx + ny * ny;
        if (d2 >= (1 + e) * (1 + e)) continue;
        const d = Math.sqrt(d2);
        let yy = ny;
        if (d > 0.9995) { nx *= 0.9995 / d; yy *= 0.9995 / d; d2 = 0.999; }
        const z = Math.sqrt(1 - d2), Y = -yy;
        const y0 = Y * ct + z * st, z0 = -Y * st + z * ct;
        const l = nx * lx + Y * ly + z * lz;
        idx.push(y * N + x);
        lat.push(Math.asin(Math.max(-1, Math.min(1, y0))));
        lon.push(Math.atan2(nx, z0));
        lam.push(l); ys.push(Math.abs(y0));
        aa.push(Math.max(0, Math.min(1, (1 - d) / e + 0.5)));
        rim.push(Math.pow(1 - z, 2.4) * (0.10 + 0.90 * sStep(-0.35, 0.45, l)));
      }
    }
    const F = function (a) { return Float32Array.from(a); };
    return { N: N, tilt: tilt, n: idx.length, idx: Int32Array.from(idx), lat: F(lat), lon: F(lon), lam: F(lam),
             ys: F(ys), aa: F(aa), rim: F(rim) };
  }

  function v2Paint(c, cfg, v, time) {
    const V = v2, G = V.geo, px = V.img.data, tw = V.tw, th = V.th, cw = V.cw, ch = V.ch;
    if (Math.abs(c - V.mixC) > 0.004) {
      const cl = V.clean, di = V.dirty, mx = V.mix, n = tw * th;
      for (let j = 0; j < n; j++) {
        const a = j * 4, b = j * 3;
        mx[a] = di[b] + (cl[a] - di[b]) * c; mx[a + 1] = di[b + 1] + (cl[a + 1] - di[b + 1]) * c;
        mx[a + 2] = di[b + 2] + (cl[a + 2] - di[b + 2]) * c; mx[a + 3] = cl[a + 3];
      }
      V.mixC = c;
    }
    const T = V.mix, CL = V.cloud, SM = V.smog, dirt = 1 - c;
    const iceLat = Math.min(89, (cfg.iceLat === undefined ? 66 : cfg.iceLat) + (cfg.iceLoss === undefined ? 12 : cfg.iceLoss) * dirt);
    const iceEdge = Math.sin(iceLat * Math.PI / 180), iceSpan = Math.max(0.004, 1 - iceEdge);
    const ice = rgbOf(mix(cfg.dirty.ice, cfg.clean.ice, c));
    const cloud = rgbOf(mix(cfg.dirty.cloud, cfg.clean.cloud, c));
    const haze = rgbOf(mix(cfg.dirty.smog, cfg.clean.smog, c));
    const smogC = rgbOf(v.smog || '#c2a974');
    const atmo = rgbOf(mix(v.airDirty || '#b3955a', v.airClean || '#79c2ff', c));
    const hazeA = dirt * (v.haze === undefined ? 0.10 : v.haze);
    const smogA = dirt * (v.smogAlpha === undefined ? 0.78 : v.smogAlpha);
    const rimK = 0.55 + 0.35 * c;
    const gl = cfg.glint || {}, gPow = gl.power === undefined ? 22 : gl.power;
    const gSpec = (gl.base === undefined ? 60 : gl.base) + (gl.gain === undefined ? 120 : gl.gain) * c;
    const rot = eRot, cDrift = eRot * (v.cloudDrift === undefined ? 0.12 : v.cloudDrift) + time * (v.cloudWind || 0.006);
    const sDrift = eRot * 0.05 + time * 0.004;
    const I2P = 1 / (Math.PI * 2), IP = 1 / Math.PI;
    for (let q = 0; q < G.n; q++) {
      const i = G.idx[q] * 4, lat = G.lat[q], lam = G.lam[q], lon = G.lon[q] - rot;

      let u = (lon * I2P + 0.5) * tw - 0.5; u -= Math.floor(u / tw) * tw;
      let w = (0.5 - lat * IP) * th - 0.5; if (w < 0) w = 0; else if (w > th - 1.001) w = th - 1.001;
      const u0 = u | 0, fu = u - u0, w0 = w | 0, fw = w - w0, u1 = u0 + 1 === tw ? 0 : u0 + 1;
      const a00 = (w0 * tw + u0) * 4, a10 = (w0 * tw + u1) * 4, a01 = a00 + tw * 4, a11 = a10 + tw * 4;
      const k00 = (1 - fu) * (1 - fw), k10 = fu * (1 - fw), k01 = (1 - fu) * fw, k11 = fu * fw;
      let r = T[a00] * k00 + T[a10] * k10 + T[a01] * k01 + T[a11] * k11;
      let g = T[a00 + 1] * k00 + T[a10 + 1] * k10 + T[a01 + 1] * k01 + T[a11 + 1] * k11;
      let b = T[a00 + 2] * k00 + T[a10 + 2] * k10 + T[a01 + 2] * k01 + T[a11 + 2] * k11;
      const land = T[a00 + 3] * k00 + T[a10 + 3] * k10 + T[a01 + 3] * k01 + T[a11 + 3] * k11;

      const ab = G.ys[q];
      let iceK = 0;
      if (ab > iceEdge) { iceK = Math.min(1, (ab - iceEdge) / iceSpan); iceK = iceK * iceK * (3 - 2 * iceK);
        r += (ice[0] - r) * iceK; g += (ice[1] - g) * iceK; b += (ice[2] - b) * iceK; }
      if (hazeA > 0.004) { r += (haze[0] - r) * hazeA; g += (haze[1] - g) * hazeA; b += (haze[2] - b) * hazeA; }

      const lp = lam > 0 ? lam : 0, sh = 0.28 + 0.80 * lp;
      r *= sh; g *= sh; b *= sh;

      if (lp > 0.6 && land < 1 && iceK < 0.4) {
        const sp = Math.pow(lp, gPow) * gSpec * (1 - land) * (1 - iceK / 0.4);
        if (sp > 0.5) { const k = sp < 255 ? sp / 255 : 1; r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
      }

      let cu = ((lon - cDrift) * I2P + 0.5) * cw - 0.5; cu -= Math.floor(cu / cw) * cw;
      let cv = (0.5 - lat * IP) * ch - 0.5; if (cv < 0) cv = 0; else if (cv > ch - 1.001) cv = ch - 1.001;
      let c0 = cu | 0, fc = cu - c0, v0 = cv | 0, fv = cv - v0, c1 = c0 + 1 === cw ? 0 : c0 + 1;
      const ca = (CL[v0 * cw + c0] * (1 - fc) + CL[v0 * cw + c1] * fc) * (1 - fv) +
                 (CL[(v0 + 1) * cw + c0] * (1 - fc) + CL[(v0 + 1) * cw + c1] * fc) * fv;
      if (ca > 0.002) { const s = sh * 1.05;
        r += (cloud[0] * s - r) * ca; g += (cloud[1] * s - g) * ca; b += (cloud[2] * s - b) * ca; }
      if (smogA > 0.004) {
        cu = ((lon - sDrift) * I2P + 0.5) * cw - 0.5; cu -= Math.floor(cu / cw) * cw;
        c0 = cu | 0; fc = cu - c0; c1 = c0 + 1 === cw ? 0 : c0 + 1;
        const sa = ((SM[v0 * cw + c0] * (1 - fc) + SM[v0 * cw + c1] * fc) * (1 - fv) +
                    (SM[(v0 + 1) * cw + c0] * (1 - fc) + SM[(v0 + 1) * cw + c1] * fc) * fv) * smogA;
        r += (smogC[0] * sh - r) * sa; g += (smogC[1] * sh - g) * sa; b += (smogC[2] * sh - b) * sa;
      }

      const rk = G.rim[q] * rimK;
      r += (atmo[0] - r) * rk; g += (atmo[1] - g) * rk; b += (atmo[2] - b) * rk;
      px[i] = r > 255 ? 255 : r; px[i + 1] = g > 255 ? 255 : g; px[i + 2] = b > 255 ? 255 : b;
      px[i + 3] = 255 * G.aa[q];
    }
    V.bctx.putImageData(V.img, 0, 0);
  }

  function v2Draw(cx, cy, R, c, cfg, v, dt) {
    if (!v2) v2Bake(v);
    const V = v2;
    const dpr = window.devicePixelRatio || 1;
    const N = Math.max(64, Math.min(v.px || 320, Math.round(R * 2 * dpr * (eCv.width / Math.max(1, eCv.clientWidth * dpr)))));
    if (!V.geo || V.geo.N !== N || V.geo.tilt !== cfg.tilt) {
      V.geo = v2Geo(N, cfg.tilt);
      V.buf = document.createElement('canvas'); V.buf.width = V.buf.height = N;
      V.bctx = V.buf.getContext('2d'); V.img = V.bctx.createImageData(N, N);
      V.last = -1;
    }
    V.clock = (V.clock || 0) + dt;

    const due = V.last < 0 || V.clock - V.last >= 1 / Math.max(1, v.paintHz || 20) ||
                eGrab || eSpin || Math.abs(c - V.lastC) > 0.002;
    if (due) { v2Paint(c, cfg, v, V.clock); V.last = V.clock; V.lastC = c; }

    const atmo = rgbOf(mix(v.airDirty || '#b3955a', v.airClean || '#79c2ff', c));
    const col = function (a) { return 'rgba(' + Math.round(atmo[0]) + ',' + Math.round(atmo[1]) + ',' + Math.round(atmo[2]) + ',' + a + ')'; };
    const ox = cx - R * 0.04, oy = cy - R * 0.04;
    const gr = eCtx.createRadialGradient(ox, oy, R * 0.97, ox, oy, R * 1.14);
    gr.addColorStop(0, col(0.34 + 0.26 * c)); gr.addColorStop(0.35, col(0.12 + 0.10 * c)); gr.addColorStop(1, col(0));
    eCtx.fillStyle = gr;
    eCtx.beginPath(); eCtx.arc(ox, oy, R * 1.14, 0, Math.PI * 2); eCtx.fill();
    eCtx.imageSmoothingEnabled = true; eCtx.imageSmoothingQuality = 'high';
    eCtx.drawImage(V.buf, cx - R, cy - R, R * 2, R * 2);
  }

  function earthResize() {
    if (!eCv) return;
    const dpr = window.devicePixelRatio || 1;
    const w = eCv.clientWidth || C().menu.earth.size;

    const px = (eCv.getBoundingClientRect().width || w) * dpr;
    eCv.width = eCv.height = Math.round(px);
    const k = px / w;
    eCtx.setTransform(k, 0, 0, k, 0, 0);
  }

  const SPEED_MS = 16;
  const STILL_MS = 120;

  function now() { return (window.performance && performance.now()) ? performance.now() : Date.now(); }

  function earthGrab(e) {
    if (!eCv || e.button !== 0 || !dragCfg().enabled) return;
    if (!e.target || e.target !== eCv) return;
    e.preventDefault();
    eGrab = { x: e.clientX, t: now(), moved: now(), dx: 0, v: 0 };
    eSpin = 0;
    eCv.classList.add('mn-earth-held');
    window.addEventListener('pointermove', earthTurn);
    window.addEventListener('pointerup', earthDrop);
    window.addEventListener('pointercancel', earthDrop);
  }

  function earthTurn(e) {
    if (!eGrab || !eCv) return;

    const w = eCv.getBoundingClientRect().width || eCv.clientWidth || 1;
    const dx = e.clientX - eGrab.x;

    const turn = (dx / w) * dragCfg().turnPerWidth * Math.PI * 2;
    eRot += turn;
    eGrab.x = e.clientX;
    if (!turn) return;

    const t = now();
    eGrab.dx += turn; eGrab.moved = t;
    if (t - eGrab.t >= SPEED_MS) {
      eGrab.v = eGrab.dx / ((t - eGrab.t) / 1000);
      eGrab.dx = 0; eGrab.t = t;
    }
  }

  function earthDrop() {
    if (!eGrab) return;
    const d = dragCfg();

    const stale = now() - eGrab.moved > STILL_MS;
    if (d.spin && !stale) eSpin = Math.max(-d.maxSpin, Math.min(d.maxSpin, eGrab.v || 0));
    eGrab = null;
    if (eCv) eCv.classList.remove('mn-earth-held');
    window.removeEventListener('pointermove', earthTurn);
    window.removeEventListener('pointerup', earthDrop);
    window.removeEventListener('pointercancel', earthDrop);
  }

  function blob(cx, cy, R, lo, la, r, rot, tilt, fill, alpha) {
    const cl = Math.cos(la);
    const x = Math.sin(lo + rot) * cl;
    const y0 = Math.sin(la), z0 = Math.cos(lo + rot) * cl;
    const y = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
    const z = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
    if (z <= 0.02) return;
    const px = cx + x * R, py = cy - y * R;
    const rad = r * R;
    const ang = Math.atan2(py - cy, px - cx);
    const g = eCtx.createRadialGradient(px, py, 0, px, py, Math.max(1, rad));
    g.addColorStop(0, fill);
    g.addColorStop(0.62, fill);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    eCtx.save();

    eCtx.globalAlpha = Math.min(1, z * 4.5) * (alpha === undefined ? 1 : alpha);
    eCtx.translate(px, py); eCtx.rotate(ang);
    eCtx.scale(Math.max(0.04, z), 1);
    eCtx.translate(-px, -py);
    eCtx.fillStyle = g;
    eCtx.beginPath(); eCtx.arc(px, py, rad, 0, Math.PI * 2); eCtx.fill();
    eCtx.restore();
  }

  function earthDraw(dt) {
    if (!eCv || !eCv.isConnected) { eCv = null; eCtx = null; return; }
    const cfg = C().menu.earth;
    const w = eCv.clientWidth, h = w;
    if (!w) return;

    const want = Math.round(eCv.getBoundingClientRect().width * (window.devicePixelRatio || 1));
    if (want > 0 && Math.abs(want - eCv.width) > 1) earthResize();

    if (eGrab) {

    } else {
      const d = dragCfg();
      if (eSpin) {
        eRot += eSpin * dt;
        eSpin *= Math.exp(-dt / Math.max(0.05, d.spinDecaySec));
        if (Math.abs(eSpin) < 0.02) eSpin = 0;
      }
      eRot += dt * Math.PI * 2 / Math.max(1, cfg.spinSec);
    }
    const detail = cfg.detail !== false;

    if (eAuto) {
      eAutoT += dt;
      const hold = Math.max(0.2, cfg.previewSec || 1.4);
      if (eAutoT >= hold) {
        eAutoT = 0;
        setStage((eStage + 1) % cfg.stages, false, 'mn.auto');
      }
    }

    const k = Math.min(1, dt / Math.max(0.01, cfg.morphSec));
    eCur += (eTarget - eCur) * k;

    const c = eCur, dirt = 1 - c;
    const cx = w / 2, cy = h / 2;

    const haloK = Math.max(1, cfg.halo || 1.2);
    const R = (Math.min(w, h) / 2 - 2) / haloK;
    eCtx.clearRect(0, 0, w, h);

    const V2 = v2Cfg();
    if (V2) { v2Draw(cx, cy, R, c, cfg, V2, dt); return; }

    const sea   = mix(cfg.dirty.sea,   cfg.clean.sea,   c);
    const land  = mix(cfg.dirty.land,  cfg.clean.land,  c);
    const rim   = mix(cfg.dirty.rim,   cfg.clean.rim,   c);
    const smog  = mix(cfg.dirty.smog,  cfg.clean.smog,  c);
    const cloud = mix(cfg.dirty.cloud || '#b7a892', cfg.clean.cloud || '#ffffff', c);
    const ice   = mix(cfg.dirty.ice   || '#9c9384', cfg.clean.ice   || '#eaf7ff', c);

    const halo = eCtx.createRadialGradient(cx, cy, R * 0.94, cx, cy, R * haloK);
    halo.addColorStop(0, rim); halo.addColorStop(1, 'rgba(0,0,0,0)');
    eCtx.save();
    eCtx.globalAlpha = 0.16 + 0.30 * c;
    eCtx.fillStyle = halo;
    eCtx.beginPath(); eCtx.arc(cx, cy, R * haloK, 0, Math.PI * 2); eCtx.fill();
    eCtx.restore();

    eCtx.save();
    eCtx.beginPath(); eCtx.arc(cx, cy, R, 0, Math.PI * 2); eCtx.clip();

    if (cfg.realWorld !== false) {

      drawReal(cx, cy, R, c, cfg);
    } else {

      const oc = eCtx.createRadialGradient(cx - R * 0.34, cy - R * 0.38, R * 0.08, cx, cy, R * 1.12);
      oc.addColorStop(0, mix(sea, '#ffffff', 0.22));
      oc.addColorStop(1, sea);
      eCtx.fillStyle = oc;
      eCtx.fillRect(0, 0, w, h);

      if (detail) {
        const gx = cx - R * 0.36, gy = cy - R * 0.40;
        const gl = eCtx.createRadialGradient(gx, gy, 0, gx, gy, R * 0.34);
        gl.addColorStop(0, '#ffffff'); gl.addColorStop(1, 'rgba(255,255,255,0)');
        eCtx.save();
        eCtx.globalAlpha = 0.06 + 0.16 * c;
        eCtx.fillStyle = gl;
        eCtx.beginPath(); eCtx.arc(gx, gy, R * 0.34, 0, Math.PI * 2); eCtx.fill();
        eCtx.restore();
      }

      for (const L of LAND) {
        blob(cx, cy, R, L.lo, L.la, L.r, eRot, cfg.tilt, land);

        if (detail) {
          blob(cx, cy, R, L.lo + 0.11, L.la - 0.09, L.r * 0.60, eRot, cfg.tilt,
               mix(land, '#0d2417', 0.34), 0.55);
        }
      }

      if (detail) {
        const ir = (cfg.ice || 0.34) * (0.5 + 0.5 * c);
        blob(cx, cy, R, 0, 1.40, ir, eRot, cfg.tilt, ice);
        blob(cx, cy, R, 0, -1.40, ir * 1.06, eRot, cfg.tilt, ice);
      }
    }

    if (detail && cfg.clouds > 0) {
      const ca = (cfg.cloudAlpha === undefined ? 0.34 : cfg.cloudAlpha);
      const rot = eRot * (cfg.cloudDrift || 1.35);
      for (let i = 0; i < cfg.clouds && i < CLOUDS.length; i++) {
        const q = CLOUDS[i];
        blob(cx, cy, R, q.lo, q.la, q.r, rot, cfg.tilt, cloud, ca);
        blob(cx, cy, R, q.lo + q.o, q.la + q.ov, q.r * 0.74, rot, cfg.tilt, cloud, ca * 0.8);
      }
    }

    if (dirt > 0.01) {
      eCtx.save();
      eCtx.globalAlpha = dirt * (cfg.smogAlpha === undefined ? 0.34 : cfg.smogAlpha);
      eCtx.fillStyle = smog;
      eCtx.fillRect(0, 0, w, h);
      eCtx.restore();
      const n = Math.round(cfg.specks * dirt);
      for (let i = 0; i < n && i < SPECKS.length; i++) {
        const s = SPECKS[i];
        blob(cx, cy, R, s.lo, s.la, s.r, eRot * 0.98, cfg.tilt, '#3b3126', dirt * 0.5);
      }
    }

    const deep = cfg.realWorld !== false ? 0.34 : 0.62;
    const sh = eCtx.createRadialGradient(cx - R * 0.30, cy - R * 0.34, R * 0.10, cx, cy, R * 1.02);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(0.62, 'rgba(0,0,0,0.04)');
    sh.addColorStop(1, 'rgba(0,0,0,' + deep + ')');
    eCtx.fillStyle = sh;
    eCtx.fillRect(0, 0, w, h);

    if (detail) {
      const lb = eCtx.createRadialGradient(cx, cy, R * 0.80, cx, cy, R);
      lb.addColorStop(0, 'rgba(0,0,0,0)'); lb.addColorStop(1, rim);
      eCtx.save();
      eCtx.globalAlpha = 0.16 + 0.34 * c;
      eCtx.fillStyle = lb;
      eCtx.fillRect(0, 0, w, h);
      eCtx.restore();
    }
    eCtx.restore();

    eCtx.strokeStyle = rim;
    eCtx.globalAlpha = 0.30 + 0.45 * c;
    eCtx.lineWidth = 1.2;
    eCtx.beginPath(); eCtx.arc(cx, cy, R, 0, Math.PI * 2); eCtx.stroke();
    eCtx.globalAlpha = 1;
  }

  M.frame = function (dt) { bgDraw(dt || 1 / 60); if (eCtx) earthDraw(dt || 1 / 60); };
  M.earthStage = function () { return eStage; };

  M.earthRot = function () { return { rot: eRot, spin: eSpin, held: !!eGrab }; };

  M.earthRebake = function () { v2 = null; };

  M.earthSnapshot = function (N, c, rot, time) {
    const e = C().menu.earth, v = v2Cfg();
    if (!v) return null;
    if (!v2) v2Bake(v);
    const V = v2;

    V.snaps = V.snaps || {};
    V.snap = V.snaps[N];
    if (!V.snap || V.snap.geo.tilt !== e.tilt) {
      const geo = v2Geo(N, e.tilt), buf = document.createElement('canvas');
      buf.width = buf.height = N;
      const bctx = buf.getContext('2d');
      V.snap = V.snaps[N] = { geo: geo, buf: buf, bctx: bctx, img: bctx.createImageData(N, N) };
    }
    const keep = { geo: V.geo, buf: V.buf, bctx: V.bctx, img: V.img }, keepRot = eRot;
    V.geo = V.snap.geo; V.buf = V.snap.buf; V.bctx = V.snap.bctx; V.img = V.snap.img; eRot = rot;
    try { v2Paint(Math.max(0, Math.min(1, c)), e, v, time === undefined ? (V.clock || 0) : time); }
    finally { V.geo = keep.geo; V.buf = keep.buf; V.bctx = keep.bctx; V.img = keep.img; eRot = keepRot; V.mixC = -1; V.last = -1; }
    return V.snap.buf;
  };

  M.earthProject = function (lonDeg, latDeg, rot) {
    const t = C().menu.earth.tilt, lat = latDeg * Math.PI / 180, lg = lonDeg * Math.PI / 180 + rot;
    const y0 = Math.sin(lat), x = Math.cos(lat) * Math.sin(lg), z0 = Math.cos(lat) * Math.cos(lg);
    const Y = y0 * Math.cos(t) - z0 * Math.sin(t), z = y0 * Math.sin(t) + z0 * Math.cos(t);
    return { x: x, y: -Y, front: z > 0 };
  };

  M.render = function () { if (root) render(); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60;
    if (h) return h + 'h ' + m + 'm';
    if (m) return m + 'm';
    return sec + 's';
  }
  function fmtWhen(ms) {
    if (!ms) return '';
    const d = new Date(ms), now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    return sameDay ? GG.i18n.t('mn.today') + ' ' + hh + ':' + mm
                   : d.getDate() + '/' + (d.getMonth() + 1) + ' ' + hh + ':' + mm;
  }

  function newsDue() {
    const N = (GG.config.ui || {}).whatsNew;
    if (!N || !N.enabled || !N.id) return null;
    if (M.newsSeen === N.id) return null;
    if (N.returningOnly) {
      let played = false;
      for (let i = 1; i <= 3 && !played; i++) {
        try { if (GG.state.slotMeta(i)) played = true; } catch (e) {}
      }
      if (!played) return null;
    }
    return N;
  }

  function showNews() {
    const old = root.querySelector('.mn-news');
    if (old) old.remove();
    const N = newsDue();
    if (!N) return;
    const T = GG.i18n.t;
    const box = document.createElement('div');
    box.className = 'mn-news';

    const spook = N.spooky && GG.halloween && GG.halloween.season && GG.halloween.season() ? N.spooky : null;
    let head = esc(N.title);
    if (spook && spook.glow) head = head.replace(esc(spook.glow), '<span class="hw-news-glow">' + esc(spook.glow) + '</span>');
    box.innerHTML =
      '<div class="mn-news-card">' +
        '<div class="mn-news-head">' + head + '</div>' +
        '<div class="mn-news-body">' + esc(N.text) + '</div>' +
        '<button class="mn-btn mn-primary mn-news-ok"><span>' + T('mn.newsOk') + '</span></button>' +
      '</div>';
    root.appendChild(box);
    if (spook && GG.halloween.newsCard) GG.halloween.newsCard(box, spook);
    box.querySelector('.mn-news-ok').onclick = function () {
      GG.audio.play('click');
      M.newsSeen = N.id;
      saveSettings();
      box.remove();
    };
  }

  function homePage() {
    const T = GG.i18n.t;
    const t = '' +

      '<div class="mn-title"><span class="mn-t1">EARTH</span><span class="mn-t2">ReGen</span></div>' +

      '<div class="mn-btns">' +
        '<button class="mn-btn mn-primary" data-go="slots"><span>' + T('mn.play') + '</span></button>' +
        '<button class="mn-btn" data-go="codex"><span>' + T('mn.codex') + '</span></button>' +
        '<button class="mn-btn" data-go="settings"><span>' + T('mn.settings') + '</span></button>' +
        '<button class="mn-btn mn-quiet" data-act="exit"><span>' + T('mn.exit') + '</span></button>' +
      '</div>';
    if (!homeEarth()) return t;

    const cap = C().menu.earth.capOnHome ? '<div class="mn-earth-cap"></div>' : '';
    return '<div class="mn-splitpane mn-homepane">' +
             '<div class="mn-earthcol">' +
               '<canvas id="menu-earth"></canvas>' +
               cap +
             '</div>' +
             '<div class="mn-homecol">' + t + '</div>' +
           '</div>';
  }

  function slotCard(i) {
    const m = GG.state.slotMeta(i), T = GG.i18n.t;
    if (!m) {

      return '<div class="mn-slot mn-empty" data-slot="' + i + '" data-fresh="1">' +
             '<div class="mn-shot mn-noshot">' + GG.icons.svg('site', 34) + '</div>' +
             '<div class="mn-sl-body"><div class="mn-sl-n">' + T('mn.slot') + ' ' + i + '</div>' +
             '<div class="mn-sl-empty">' + T('mn.emptySlot') + '</div></div>' +
             '<div class="mn-sl-go">' + T('mn.newGame') + '</div>' +
             '<button class="mn-mini mn-imp" data-import="' + i + '">' + T('mn.import') + '</button>' +
             '</div>';
    }
    const pct = Math.round(m.pct * 100);
    const loc = GG.state.locationById(m.loc);

    const title = m.name ? esc(m.name) : T('mn.slot') + ' ' + i;
    const sub = (m.name ? T('mn.slot').toLowerCase() + ' ' + i + ' &middot; ' : '') +
                fmtWhen(m.savedAt);

    const FC = GG.config.fullCircle || {};
    const circ = m.cycle > 0
      ? '<span class="mn-circle" title="' + esc(T('fc.planAfter')
          .replace('%m', GG.util.small(Math.pow(FC.siteMul || 1, m.cycle)))) + '">' +
        GG.icons.svg('fullCircle', 12) + '<b>' + T('fc.title') +
        (m.cycle > 1 ? ' ×' + m.cycle : '') + '</b></span>'
      : '';
    return '<div class="mn-slot' + (m.cycle > 0 ? ' mn-circled' : '') + '" data-slot="' + i + '">' +
      '<div class="mn-shot">' + (m.shot ? '<img src="' + m.shot + '" alt="">'
                                        : '<span class="mn-noshot">' + GG.icons.svg('site', 34) + '</span>') +
        circ + '</div>' +
      '<div class="mn-sl-body">' +
        '<div class="mn-sl-n">' + title + '<em>' + sub + '</em></div>' +
        '<div class="mn-sl-meta">' +
          '<span>' + fmtTime(m.playedSec) + ' ' + T('mn.played') + '</span>' +
          '<span>' + (loc ? loc.name : '') + '</span>' +
        '</div>' +
        '<div class="mn-bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="mn-sl-pct">' + pct + T('mn.complete') + '</div>' +
      '</div>' +
      '<div class="mn-sl-acts">' +
        '<button class="mn-mini mn-go" data-slot="' + i + '">' + T('mn.continue') + '</button>' +
        '<button class="mn-mini mn-exp" data-export="' + i + '">' + T('mn.export') + '</button>' +
        '<button class="mn-mini mn-new" data-slot="' + i + '" data-fresh="1">' + T('mn.new') + '</button>' +
        '<button class="mn-mini mn-del" data-del="' + i + '">' + T('mn.delete') + '</button>' +
      '</div></div>';
  }

  function menuNote(msg, ok) {
    let el = document.getElementById('mn-note');
    if (!el) { el = document.createElement('div'); el.id = 'mn-note'; document.body.appendChild(el); }
    el.textContent = msg;
    el.className = 'mn-note ' + (ok ? 'ok' : 'bad') + ' show';
    clearTimeout(menuNote._t);
    menuNote._t = setTimeout(function () { el.classList.remove('show'); }, 3400);
  }

  function exportSlot(i) {
    const raw = GG.state.sget(GG.state.slotKey(i));
    if (!raw) { menuNote(GG.i18n.t('mn.expNone'), false); return; }
    let nm = 'slot' + i;
    try { const g = JSON.parse(raw).g;
          if (g && g.name) nm = g.name.replace(/[^\w\-]+/g, '_').slice(0, 24) || nm; } catch (e) {}
    const d = new Date(), p2 = function (x) { return ('0' + x).slice(-2); };
    const stamp = d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate());
    const a = document.createElement('a');
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    a.href = url; a.download = 'earthregen-' + nm + '-' + stamp + '.json';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
    GG.audio.play('claim');
    menuNote(GG.i18n.t('mn.expOk'), true);
  }

  function applyImport(i, d) {
    if (!d || typeof d !== 'object' || !d.g || typeof d.g !== 'object' || d.v === undefined)
      return { ok: false, msg: 'impBad' };
    if (d.v !== GG.config.saveVersion) return { ok: false, msg: 'impVer' };
    try { GG.state.sset(GG.state.slotKey(i), JSON.stringify(d)); GG.state.mirror(GG.state.slotKey(i)); }
    catch (e) { return { ok: false, msg: 'impFail' }; }
    return { ok: true, msg: 'impOk' };
  }

  function importToSlot(i) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = function () {
      const f = inp.files && inp.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = function () {
        let d;
        try { d = JSON.parse(String(rd.result)); }
        catch (e) { menuNote(GG.i18n.t('mn.impBad'), false); return; }
        const r = applyImport(i, d);
        menuNote(GG.i18n.t('mn.' + r.msg), r.ok);
        if (r.ok) { GG.audio.play('claim'); render(); }
      };
      rd.readAsText(f);
    };
    inp.click();
  }

  function slotsPage() {
    let list = '<div class="mn-slots">';
    for (let i = 1; i <= C().menu.slots; i++) list += slotCard(i);
    list += '</div>';
    const head = '<div class="mn-head"><button class="mn-back" data-go="home">' +
                 GG.i18n.t('mn.back') + '</button><h2>' +
                 GG.i18n.t('mn.chooseSlot') + '</h2></div>';
    if (!earthOn()) return head + list;
    return head +
      '<div class="mn-splitpane">' +
        '<div class="mn-earthcol">' +
          '<canvas id="menu-earth"></canvas>' +
          '<div class="mn-earth-cap"></div>' +
          stageStrip() +
        '</div>' + list +
      '</div>';
  }

  function stageStrip() {
    const cfg = C().menu.earth, dev = C().dev;
    if (!dev || !dev.enabled || cfg.preview === false) return '';
    let s = '<div class="mn-egrid">';
    for (let i = 1; i <= cfg.stages; i++) s += '<button class="mn-eg" data-stage="' + i + '">' + i + '</button>';
    s += '<button class="mn-eg mn-eg-w" data-stage="auto">' + GG.i18n.t('mn.autoBtn') +
         '</button><button class="mn-eg mn-eg-w on" data-stage="live">' +
         GG.i18n.t('mn.liveBtn') + '</button>';
    return s + '</div>';
  }

  function row(label, id, val, hint) {
    return '<div class="mn-row"><label>' + label + '<b id="' + id + 'V">' + val + '</b></label>' +
           '<input type="range" id="' + id + '" min="0" max="100" value="' + val + '">' +
           (hint ? '<div class="mn-hint">' + hint + '</div>' : '') + '</div>';
  }

  let setTab = 'general';
  function ctlTabOn() {
    return C().menu.controlsTab !== false && !!(GG.ui && GG.ui.controlsHtml);
  }

  function setTabList() {
    if (!ctlTabOn()) return [];
    const list = C().menu.settingsTabs || ['general', 'controls'];
    return list.filter(function (k) { return k !== 'controls' || ctlTabOn(); });
  }
  function setTabsHtml() {
    const list = setTabList();
    if (!list.length) return '';
    return '<div class="mn-seg mn-settabs">' + list.map(function (k) {
      return '<button data-settab="' + k + '"' + (setTab === k ? ' class="on"' : '') + '>' +
             GG.i18n.t('mn.set_' + k) + '</button>';
    }).join('') + '</div>';
  }

  function settingsPage() {
    const a = C().audio;
    const fs = isFull();
    const T = GG.i18n.t;

    let langSeg = '';
    GG.i18n.langs.forEach(function (l) {
      langSeg += '<button data-lang="' + l.id + '"' +
                 (GG.i18n.lang() === l.id ? ' class="on"' : '') + '>' + l.label + '</button>';
    });

    let wxSeg = '';
    ((GG.config.wxNotice && GG.config.wxNotice.options) || []).forEach(function (m) {
      wxSeg += '<button data-wxn="' + m + '"' +
               (M.wxNotice === m ? ' class="on"' : '') + '>' + T('mn.wx_' + m) + '</button>';
    });

    function uiSeg(key, attr, live) {
      const cfg = ((GG.config.ui || {})[key]) || {};
      if (cfg.enabled === false || cfg.setting === false) return '';
      let h = '';
      (cfg.options || []).forEach(function (m) {
        h += '<button data-' + attr + '="' + m + '"' +
             (live === m ? ' class="on"' : '') + '>' + T('mn.' + key + '_' + m) + '</button>';
      });
      return h;
    }
    const outletSeg = uiSeg('outletBar', 'obar', M.outletBar);
    const skinSeg   = uiSeg('skinChoice', 'skn', M.skinChoice);
    const gridSeg   = uiSeg('gridSnap', 'grds', M.gridSnap);
    const bendSeg   = uiSeg('wireBends', 'wbnd', M.wireBends);
    const walgSeg   = uiSeg('wireAlign', 'walg', M.wireAlign);
    const gstySeg   = uiSeg('gridStyle', 'gsty', M.gridStyle);
    const wxhSeg    = uiSeg('wxHints', 'wxh', M.wxHints);
    const tlnSeg    = uiSeg('treeLines', 'tln', M.treeLines);
    const swgSeg    = uiSeg('sweepGesture', 'swg', M.sweepGesture);

    const dslSeg    = (GG.input && GG.input.touchUi && GG.input.touchUi()) ? '' : uiSeg('dragSelect', 'dsl', M.dragSelect);
    const cblSeg    = uiSeg('colourBlind', 'cbl', M.colourBlind);
    const attSeg    = uiSeg('attention', 'att', M.attention);
    const tipSeg    = uiSeg('tips', 'tip', M.tips);
    const pvSeg     = uiSeg('planetView', 'pvw', M.planetView);
    let zoomSeg = '';
    zoomCfg().options.forEach(function (z) {
      zoomSeg += '<button data-mnz="' + z + '"' +
                 (Math.abs(z - M.zoom) < 1e-6 ? ' class="on"' : '') + '>' +
                 Math.round(z * 100) + '%</button>';
    });

    function seg(label, id, html, hint) {
      if (!html) return '';
      return '<div class="mn-row mn-toggle">' +
          '<label>' + label + '</label>' +
          '<div class="mn-seg" id="' + id + '">' + html + '</div>' +
          (hint ? '<div class="mn-hint">' + hint + '</div>' : '') +
        '</div>';
    }
    const sweepRow = seg(T('mn.sweepGesture'), 'swgSeg', swgSeg, T('mn.sweepHint')) +
      seg(T('mn.dragSelect'), 'dslSeg', dslSeg, T('mn.dragSelectHint'));
    const rows = {

      general: seg(T('mn.language'), 'langSeg', langSeg) +
        seg(T('mn.display'), 'fsSeg',
            '<button data-fs="0"' + (fs ? '' : ' class="on"') + '>' + T('mn.window') + '</button>' +
            '<button data-fs="1"' + (fs ? ' class="on"' : '') + '>' + T('mn.fullscreen') + '</button>',
            T('mn.fsHint')) +
        seg(T('mn.size'), 'zoomSeg', zoomSeg) +
        seg(T('mn.colourBlind'), 'cblSeg', cblSeg),
      audio:
        row(T('mn.volAll'), 'volAll', Math.round(M.master * 100), '') +
        row(T('mn.volSfx'), 'volSfx', Math.round(a.volume * 100), '') +
        row(T('mn.volMus'), 'volMus', Math.round(a.musicVolume * 100), ''),

      ui: seg(T('mn.skinChoice'), 'sknSeg', skinSeg) +
        seg(T('mn.attention'), 'attSeg', attSeg) +
        seg(T('mn.wxNotice'), 'wxSeg', wxSeg) +
        (tipSeg ? seg(T('mn.tips'), 'tipSeg', tipSeg, T('mn.tipsHint')) : '') +
        seg(T('mn.wxHints'), 'wxhSeg', wxhSeg, T('mn.wxHintsHint')) +
        seg(T('mn.treeLines'), 'tlnSeg', tlnSeg, T('mn.treeLinesHint')) +
        seg(T('mn.outletBar'), 'obarSeg', outletSeg, T('mn.outletHint')) +
        seg(T('mn.planetView'), 'pvwSeg', pvSeg, T('mn.planetViewHint')),
      build: seg(T('mn.gridSnap'), 'grdsSeg', gridSeg, T('mn.gridHint')) +
        seg(T('mn.wireBends'), 'wbndSeg', bendSeg, T('mn.bendHint')) +
        (walgSeg ? seg(T('mn.wireAlign'), 'walgSeg', walgSeg, T('mn.wireAlignHint')) : '') +
        (gstySeg ? seg(T('mn.gridStyle'), 'gstySeg', gstySeg, T('mn.gridStyleHint')) : ''),
    };
    const tabs = setTabList();
    let body = '';
    if (!tabs.length) {
      body = '<div class="mn-set">' + rows.general + rows.audio + rows.ui + rows.build + sweepRow + '</div>';
    } else if (setTab === 'controls') {

      body = (sweepRow ? '<div class="mn-set">' + sweepRow + '</div>' : '') +
             '<div class="mn-set mn-ctl">' + GG.ui.controlsHtml() + '</div>';
    } else {
      Object.keys(rows).forEach(function (k) {
        const home = tabs.indexOf(k) >= 0 ? k : 'general';
        if (home === setTab) body += rows[k];
      });
      body = '<div class="mn-set">' + body + '</div>';
    }
    return '<div class="mn-head"><button class="mn-back" data-go="home">' + T('mn.back') +
           '</button><h2>' + T('mn.settings') + '</h2></div>' + setTabsHtml() + body;
  }

  let pendingSlot = 0;
  function tutorPage() {
    const T = GG.i18n.t;
    return '' +
      '<div class="mn-head"><button class="mn-back" data-go="slots">' + T('mn.back') + '</button>' +
      '<h2>' + T('mn.newRun') + ' &mdash; ' + T('mn.slot') + ' ' + pendingSlot + '</h2></div>' +
      '<div class="mn-ask">' +
        '<div class="mn-name">' +
          '<label for="runName">' + T('mn.nameRun') + '</label>' +
          '<input id="runName" type="text" maxlength="' + C().menu.nameMax + '" ' +
                 'placeholder="' + T('mn.slot') + ' ' + pendingSlot + '" autocomplete="off" ' +
                 'spellcheck="false">' +
          (C().menu.newRunHints ? '<div class="mn-hint">' + T('mn.nameHint') + ' ' + pendingSlot + '.</div>' : '') +
        '</div>' +
        '<p>' + T('mn.tutorAsk') + '</p>' +
        (C().menu.newRunHints ? '<p class="mn-dim">' + T('mn.tutorBlurb') + '</p>' : '') +
        '<div class="mn-btns">' +
          '<button class="mn-btn mn-primary" data-tut="1"><span>' + T('mn.tutorYes') + '</span></button>' +
          '<button class="mn-btn" data-tut="0"><span>' + T('mn.tutorNo') + '</span></button>' +
        '</div>' +
      '</div>';
  }

  function bestSlot() {
    let best = null;
    for (let i = 1; i <= GG.state.SLOTS; i++) {
      const m = GG.state.slotMeta(i);
      if (!m) continue;
      if (!best || m.pct > best.pct || (m.pct === best.pct && m.ci > best.ci)) best = m;
    }
    return best;
  }

  function codexPage() {
    const T = GG.i18n.t, C = GG.config, IC = GG.icons;
    const best = bestSlot();

    const head = '<div class="mn-head"><button class="mn-back" data-go="home">' +
                 T('mn.back') + '</button><h2>' + T('mn.codex') + '</h2></div>';
    const back = '<div class="mn-btns"><button class="mn-btn" data-go="home"><span>' +
                 T('mn.backToMenu') + '</span></button></div>';
    if (!best) return head + '<div class="mn-cx-empty">' + T('mn.codexNone') + '</div>' + back;

    const have = GG.state.slotSkills(best.slot) || {};
    const unlocked = {};
    C.skills.forEach(function (sk) {
      if (!have[sk.id]) return;
      (sk.unlocks || []).forEach(function (id) { unlocked[id] = true; });
    });
    Object.keys(C.nodeTypes).forEach(function (id) {
      if (C.nodeTypes[id].unlockedFromStart && C.nodeTypes[id].buildable) unlocked[id] = true;
    });

    let n = 0, out = '';
    C.categories.forEach(function (cat) {
      const list = Object.keys(C.nodeTypes).filter(function (id) {
        const t = C.nodeTypes[id];

        if (GG.sim && GG.sim.demoNode && GG.sim.demoNode(id)) return false;
        return t.buildable && t.category === cat.id && unlocked[id];
      });
      if (!list.length) return;
      out += '<div class="mn-cx-cat" style="--c:' + cat.color + '">' + esc(cat.name) + '</div>';
      list.forEach(function (id) {
        const t = C.nodeTypes[id];
        n++;
        const spec = (C.specOf(t) || []).map(function (r) {
          return '<div class="mn-cx-sp"><span>' + esc(GG.i18n.ins(r[0])) + '</span><b>' +
                 esc(GG.i18n.ins(r[1])) + '</b></div>';
        }).join('');
        out += '<div class="mn-cx-m" style="--c:' + cat.color + '">' +
                 '<div class="mn-cx-h"><span class="mn-cx-ic" style="color:' + GG.config.iconColor(t) + '">' + IC.svg(t.icon, 18) + '</span>' +
                 '<b>' + esc(t.name) + '</b></div>' +
                 (C.codexDescOf(t) ? '<i>' + esc(C.codexDescOf(t)) + '</i>' : '') +
                 (spec ? '<div class="mn-cx-spec">' + spec + '</div>' : '') +
               '</div>';
      });
    });

    const total = Object.keys(C.nodeTypes).filter(function (id) {
      return C.nodeTypes[id].buildable &&
             !(GG.sim && GG.sim.demoNode && GG.sim.demoNode(id));
    }).length;
    const sub = '<div class="mn-cx-sub">' + esc(best.name || (T('mn.slot') + ' ' + best.slot)) +
                ' &middot; ' + n + ' / ' + total + '</div>';
    return head + sub + '<div class="mn-cx">' + out + '</div>' + back;
  }

  function render(still) {
    const body = root.querySelector('.mn-body');

    const split = (page === 'slots' && earthOn()) || (page === 'home' && homeEarth());
    body.className = 'mn-body mn-' + page + (split ? ' mn-earth-on' : '') +
                     (page === 'settings' && ctlTabOn() ? ' mn-settabs-on' : '');
    body.innerHTML = page === 'home' ? homePage()
                   : page === 'slots' ? slotsPage()
                   : page === 'tutor' ? tutorPage()
                   : page === 'codex' ? codexPage()
                   : settingsPage();

    const items = body.querySelectorAll('.mn-btn, .mn-slot, .mn-row, .mn-head');
    if (!still) items.forEach(function (el, i) {
      el.style.animationDelay = (i * 45) + 'ms';
      el.classList.add('mn-in');
    });
    if (page === 'home') showNews();
    if (page === 'settings') wireSettings();
    if (page === 'tutor') {
      const box = root.querySelector('#runName');
      if (box) setTimeout(function () { try { box.focus(); } catch (e) {} }, 260);
    }

    earthDrop();
    eCv = root.querySelector('#menu-earth');
    eCtx = eCv ? eCv.getContext('2d') : null;
    if (eCtx) { earthResize(); earthDefault(true); }
  }

  function go(p) {
    if (p === page) return;
    page = p;
    if (p === 'settings') setTab = 'general';
    GG.audio.play('click');
    render();
  }

  function startSlot(i, fresh) {
    if (fresh) { pendingSlot = i; go('tutor'); return; }
    launch(i, false, false);
  }

  let loadRAF = 0;

  function splashCfg() {
    const S = (GG.config && GG.config.splash) || {};
    return { enabled: S.enabled !== false, fadeMs: S.fadeMs || 520,
             holdMs: S.holdMs || 1250, skippable: S.skippable !== false,
             hint: S.hint !== false, hintAfterMs: S.hintAfterMs || 700,
             fontWaitMs: S.fontWaitMs || 500,
             bg: S.bg || '#0A0B0B', ink: S.ink || '#F5F5F5',
             markPx: S.markPx || 200, markPxNarrow: S.markPxNarrow || 128,
             namePx: S.namePx || 34, namePxNarrow: S.namePxNarrow || 22 };
  }

  M.splashRun = function (then) {
    const cfg = splashCfg();
    then = then || function () {};
    if (!cfg.enabled) { then(); return null; }

    const el = document.createElement('div');
    el.className = 'mn-splash';
    el.style.setProperty('--sp-fade', cfg.fadeMs + 'ms');
    el.style.setProperty('--sp-bg', cfg.bg);
    el.style.setProperty('--sp-ink', cfg.ink);
    el.style.setProperty('--sp-mark', cfg.markPx + 'px');
    el.style.setProperty('--sp-mark-sm', cfg.markPxNarrow + 'px');
    el.style.setProperty('--sp-name', cfg.namePx + 'px');
    el.style.setProperty('--sp-name-sm', cfg.namePxNarrow + 'px');
    el.innerHTML =
      '<div class="mn-splash-in">' +
        '<div class="mn-splash-mark">' + ((GG.brand && GG.brand.company) || '') + '</div>' +
        '<div class="mn-splash-name">DISAGREEG</div>' +
        (cfg.hint ? '<div class="mn-splash-skip">' + GG.i18n.t('mn.skipSplash') + '</div>' : '') +
      '</div>';
    root.appendChild(el);

    let timer = 0, hintTimer = 0, done = false, begun = false;

    function finish() {
      if (done) return;
      done = true;
      clearTimeout(timer); clearTimeout(hintTimer);
      window.removeEventListener('pointerdown', finish, true);
      window.removeEventListener('keydown', finish, true);
      el.classList.add('out');

      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        then();
      }, cfg.fadeMs);
    }

    function begin() {
      if (begun || done) return;
      begun = true;

      if (GG.audio && GG.audio.musicTry) GG.audio.musicTry();
      requestAnimationFrame(function () { el.classList.add('on'); });
      timer = setTimeout(finish, cfg.fadeMs + cfg.holdMs);
      if (cfg.hint) {
        hintTimer = setTimeout(function () { el.classList.add('hint'); },
                               cfg.fadeMs + cfg.hintAfterMs);
      }
    }
    setTimeout(begin, cfg.fontWaitMs);
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(begin); }
    catch (e) { begin(); }

    if (cfg.skippable) {
      window.addEventListener('pointerdown', finish, true);
      window.addEventListener('keydown', finish, true);
    }
    M.splashSkip = finish;
    return el;
  };

  function loadingCfg() {
    const L = (GG.config && GG.config.loading) || {};
    return { enabled: L.enabled !== false, minSteps: L.minSteps || 240,
             sliceMs: L.sliceMs || 22, minShowMs: L.minShowMs || 420,
             fadeMs: L.fadeMs || 260, tipEverySec: L.tipEverySec || 2.6,
             tips: L.tips !== false, oneAtATime: L.oneAtATime !== false,
             wireBar: L.wireBar !== false, packets: L.wirePackets || 4,
             packetSec: L.wirePacketSec || 1.2,
             stepWise: L.stepWise === true, quietMenu: L.quietMenu === true };
  }

  function loadingTips() {
    const T = GG.i18n.t;
    return [1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return T('ld.tip' + i); });
  }

  const WIRE_D = 'M10 22 C 70 2, 110 42, 180 22 S 262 14, 270 22';
  function wireBarHtml(n) {
    let dots = '';
    for (let i = 0; i < n; i++) dots += '<circle r="2.6" class="mn-wire-pk"/>';
    return '<svg class="mn-load-wire" viewBox="0 0 280 44">' +
      '<path class="mn-wire-bg" d="' + WIRE_D + '"/>' +
      '<path class="mn-wire-on" d="' + WIRE_D + '"/>' +
      '<g>' + dots + '</g>' +
      '<circle class="mn-wire-out" cx="10" cy="22" r="5.5"/>' +
      '<circle class="mn-wire-in" cx="270" cy="22" r="5.5"/>' +
    '</svg>';
  }

  function loadingShow(name, cfg) {
    const T = GG.i18n.t;
    const el = document.createElement('div');
    el.className = 'mn-load';
    el.innerHTML =
      '<div class="mn-load-in">' +
        '<div class="mn-load-title">' + T('ld.title') + '</div>' +
        '<div class="mn-load-run"></div>' +
        (cfg && cfg.wireBar ? wireBarHtml(cfg.packets) : '<div class="mn-load-bar"><i></i></div>') +
        '<div class="mn-load-pct">0%</div>' +
        '<div class="mn-load-tip"></div>' +
      '</div>';

    el.querySelector('.mn-load-run').textContent = name || '';
    root.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('on'); });
    return el;
  }

  function loadingHide(el, cfg, then) {
    el.classList.remove('on');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); then(); },
               cfg.fadeMs);
  }

  function loadingRun(job, name, done) {
    const cfg = loadingCfg(), el = loadingShow(name, cfg), t0 = performance.now();
    const bar = el.querySelector('.mn-load-bar i'), pct = el.querySelector('.mn-load-pct'),
          wOn = el.querySelector('.mn-wire-on'), wIn = el.querySelector('.mn-wire-in'),
          pks = Array.prototype.slice.call(el.querySelectorAll('.mn-wire-pk')),
          tipEl = el.querySelector('.mn-load-tip'), tips = loadingTips();
    let tipAt = -1, wLen = 0, stepMs = 0;
    if (!cfg.tips) tipEl.style.display = 'none';
    if (wOn) { try { wLen = wOn.getTotalLength(); } catch (e) { wLen = 0; } }
    function drawWire(k) {
      if (!wOn || !wLen) return;
      const lit = k * wLen, now = performance.now() / 1000;
      wOn.style.strokeDasharray = lit.toFixed(1) + ' ' + (wLen + 1).toFixed(1);
      wIn.classList.toggle('lit', k >= 0.999);
      pks.forEach(function (c, i) {
        const d = ((now / cfg.packetSec + i / pks.length) % 1) * lit;
        const q = wOn.getPointAtLength(d);
        c.setAttribute('cx', q.x.toFixed(1)); c.setAttribute('cy', q.y.toFixed(1));
        c.style.opacity = lit > 6 ? '1' : '0';
      });
    }
    drawWire(0);

    function frame() {
      const sliceEnd = performance.now() + cfg.sliceMs;

      let finished = false;
      if (cfg.stepWise) {

        do {
          const s0 = performance.now();
          finished = GG.sim.offlineStep(job, 1);
          const took = performance.now() - s0;
          stepMs = stepMs ? stepMs * 0.8 + took * 0.2 : took;
        } while (!finished && performance.now() + stepMs < sliceEnd);
      } else {
        while (performance.now() < sliceEnd) {
          finished = GG.sim.offlineStep(job, 8);
          if (finished) break;
        }
      }
      const k = Math.max(0, Math.min(1, job.done / job.steps));
      if (bar) bar.style.transform = 'scaleX(' + k.toFixed(4) + ')';
      drawWire(k);
      pct.textContent = Math.round(k * 100) + '%';
      if (cfg.tips) {
        const slot = Math.floor((performance.now() - t0) / (cfg.tipEverySec * 1000)) % tips.length;
        if (slot !== tipAt) { tipAt = slot; tipEl.textContent = tips[slot]; }
      }
      if (!finished) { loadRAF = requestAnimationFrame(frame); return; }

      const wait = Math.max(0, cfg.minShowMs - (performance.now() - t0));
      loadRAF = 0;
      setTimeout(function () { loadingHide(el, cfg, done); }, wait);
    }
    loadRAF = requestAnimationFrame(frame);
  }

  let loadingNow = false;

  function launch(i, fresh, withTutor, name) {

    const cfg = loadingCfg();
    if (loadingNow && cfg.oneAtATime) return;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

    if (!GG.state.openSlot(i, !!fresh, name, { defer: cfg.enabled })) {
      menuNote(GG.i18n.t('mn.loadBroken'), false);
      return;
    }
    const job = GG.state.offlineJob;

    if (job && job.steps < cfg.minSteps) { GG.state.finishOffline(); }
    else if (job) {
      const runName = GG.state.g.name || GG.i18n.t('mn.slot') + ' ' + i;
      loadingNow = true;
      loadingRun(job, runName, function () {
        loadingNow = false;
        GG.state.offlineReport = GG.sim.offlineEnd(job);
        GG.state.offlineJob = null;
        launchRest(i, fresh, withTutor);
      });
      return;
    }
    launchRest(i, fresh, withTutor);
  }

  function launchRest(i, fresh, withTutor) {
    started = true;
    M.close();

    if (GG.input && GG.input.clampCamera) GG.input.clampCamera();

    GG.ui.refreshPalette();
    GG.ui.buildTree();
    GG.ui.buildPlaces();
    GG.input.cancelPlacing();
    GG.ui.selectNode(null);

    if (!fresh) GG.tutor.sync();
    else if (withTutor) GG.tutor.restart();
    else { GG.tutor.restart(); GG.tutor.finish(true); }

    GG.ui.offlineCard(GG.state.offlineReport);
    GG.state.offlineReport = null;
  }

  function exitGame() {
    if (started) GG.state.save(true);
    GG.audio.play('boostOff');

    const T = GG.i18n.t;
    root.querySelector('.mn-body').innerHTML =
      '<div class="mn-bye mn-in"><div class="mn-title"><span class="mn-t1">EARTH</span>' +
      '<span class="mn-t2">ReGen</span></div>' +
      '<p>' + T('mn.saved') + '</p><p class="mn-dim">' + T('mn.mayClose') + '</p>' +
      '<button class="mn-btn" data-go="home"><span>' + T('mn.backToMenu') + '</span></button></div>';
    root.querySelector('.mn-bye').querySelectorAll('*');
    setTimeout(function () { try { window.close(); } catch (e) {} }, 120);
  }

  M.master = 1;

  let baseSfx = 0.35, baseMus = 0.14;

  function applyMaster() {
    GG.audio.setVolume(baseSfx * M.master);
    GG.audio.setMusicVolume(baseMus * M.master);
  }

  function wireSettings() {
    const all = root.querySelector('#volAll'), sfx = root.querySelector('#volSfx'),
          mus = root.querySelector('#volMus');
    function label(el, v) { root.querySelector('#' + el + 'V').textContent = v; }

    if (all) {
    all.oninput = function () {
      M.master = +all.value / 100;
      label('volAll', all.value);
      applyMaster();
      sfx.value = Math.round(GG.config.audio.volume * 100); label('volSfx', sfx.value);
      mus.value = Math.round(GG.config.audio.musicVolume * 100); label('volMus', mus.value);
      saveSettings();
    };

    sfx.oninput = function () {
      baseSfx = (+sfx.value / 100) / (M.master || 1);
      GG.audio.setVolume(+sfx.value / 100);
      label('volSfx', sfx.value); saveSettings();
    };
    sfx.onchange = function () { GG.audio.play('click'); };
    mus.oninput = function () {
      baseMus = (+mus.value / 100) / (M.master || 1);
      GG.audio.setMusicVolume(+mus.value / 100);
      label('volMus', mus.value); saveSettings();
    };
    }
    root.querySelectorAll('#wxSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.wxNotice === b.dataset.wxn) return;
        GG.audio.play('click');
        M.wxNotice = b.dataset.wxn;
        saveSettings();
        render();
      };
    });

    root.querySelectorAll('#sknSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.skinChoice === b.dataset.skn) return;
        GG.audio.play('click');
        M.skinChoice = b.dataset.skn;
        if (GG.ui && GG.ui.applySkin) GG.ui.applySkin();
        saveSettings();
        render();
      };
    });
    root.querySelectorAll('#tipSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.tips === b.dataset.tip) return;
        GG.audio.play('click');
        M.tips = b.dataset.tip;
        saveSettings();
        render();
      };
    });
    root.querySelectorAll('#attSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.attention === b.dataset.att) return;
        GG.audio.play('click');
        M.attention = b.dataset.att;
        if (GG.ui && GG.ui.syncStuck) GG.ui.syncStuck(true);
        saveSettings();
        render();
      };
    });
    root.querySelectorAll('#cblSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.colourBlind === b.dataset.cbl) return;
        GG.audio.play('click');
        M.colourBlind = b.dataset.cbl;
        if (GG.ui && GG.ui.applyColourBlind) GG.ui.applyColourBlind();
        saveSettings();
        render();
      };
    });
    root.querySelectorAll('#pvwSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.planetView === b.dataset.pvw) return;
        GG.audio.play('click');
        M.planetView = b.dataset.pvw;
        saveSettings();
        render();
      };
    });
    root.querySelectorAll('#swgSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.sweepGesture === b.dataset.swg) return;
        GG.audio.play('click');
        M.sweepGesture = b.dataset.swg;
        saveSettings();
        render();
      };
    });
    root.querySelectorAll('#obarSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.outletBar === b.dataset.obar) return;
        GG.audio.play('click');
        M.outletBar = b.dataset.obar;
        saveSettings();
        render();
      };
    });

    root.querySelectorAll('#wxhSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.wxHints === b.dataset.wxh) return;
        GG.audio.play('click');
        M.wxHints = b.dataset.wxh;
        saveSettings();
        render();
      };
    });
    root.querySelectorAll('#tlnSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.treeLines === b.dataset.tln) return;
        GG.audio.play('click');
        M.treeLines = b.dataset.tln;
        saveSettings();
        if (GG.ui && GG.ui.buildTree) GG.ui.buildTree();
        render();
      };
    });
    root.querySelectorAll('#dslSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.dragSelect === b.dataset.dsl) return;
        GG.audio.play('click');
        M.dragSelect = b.dataset.dsl;
        saveSettings();
        render();
      };
    });
    root.querySelectorAll('#wbndSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.wireBends === b.dataset.wbnd) return;
        GG.audio.play('click');
        M.wireBends = b.dataset.wbnd;
        saveSettings();
        render();
      };
    });
    root.querySelectorAll('#gstySeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.gridStyle === b.dataset.gsty) return;
        GG.audio.play('click');
        M.gridStyle = b.dataset.gsty;
        saveSettings();
        render();
      };
    });
    root.querySelectorAll('#walgSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.wireAlign === b.dataset.walg) return;
        GG.audio.play('click');
        M.wireAlign = b.dataset.walg;
        saveSettings();
        render();
      };
    });
    root.querySelectorAll('#grdsSeg button').forEach(function (b) {
      b.onclick = function () {
        if (M.gridSnap === b.dataset.grds) return;
        GG.audio.play('click');
        M.gridSnap = b.dataset.grds;
        saveSettings();
        render();
      };
    });
    root.querySelectorAll('#zoomSeg button').forEach(function (b) {
      b.onclick = function () {

        const same = Math.abs(+b.dataset.mnz - M.zoom) < 1e-6;
        if (same && !M.zoomAuto) return;
        GG.audio.play('click');
        M.setZoom(+b.dataset.mnz);
        render();
      };
    });
    root.querySelectorAll('#fsSeg button').forEach(function (b) {
      b.onclick = function () {
        GG.audio.play('click');
        M.setFullscreen(b.dataset.fs === '1');
      };
    });

    root.querySelectorAll('#langSeg button').forEach(function (b) {
      b.onclick = function () {
        if (GG.i18n.lang() === b.dataset.lang) return;
        GG.audio.play('click');
        GG.i18n.setLang(b.dataset.lang);
        saveSettings();
        render();
      };
    });
  }

  function isFull() {
    try { if (window.desktop && window.desktop.isFullscreen) return !!window.desktop.isFullscreen(); } catch (e) {}
    return !!document.fullscreenElement;
  }
  M.setFullscreen = function (on) {
    if (window.desktop && window.desktop.setFullscreen) {
      try { window.desktop.setFullscreen(!!on); } catch (e) {}

      setTimeout(function () { if (open && page === 'settings') render(); saveSettings(); }, 350);
      return;
    }
    try {
      if (on && !document.fullscreenElement) document.documentElement.requestFullscreen();
      else if (!on && document.fullscreenElement) document.exitFullscreen();
    } catch (e) {  }
    saveSettings();
  };

  function zoomCfg() {
    const z = (C().menu || {}).zoom || {};
    return { options: (z.options && z.options.length) ? z.options : [1],
             def: z.def === undefined ? 1 : z.def,
             auto: z.auto !== false,
             minStage: z.minStage === undefined ? 0 : z.minStage,
             minW: z.minW === undefined ? 0 : z.minW,
             chrome: z.chrome === undefined ? 0 : z.chrome };
  }

  function pickZoom(z) {
    const o = zoomCfg().options;
    let best = o[0];
    for (const v of o) if (Math.abs(v - z) < Math.abs(best - z)) best = v;
    return best;
  }

  function autoZoom() {
    const cfg = zoomCfg();
    if (!cfg.auto) return pickZoom(cfg.def);
    const opts = cfg.options.slice().sort(function (a, b) { return b - a; });
    const w = window.innerWidth || 0, h = window.innerHeight || 0;
    if (!w || !h) return pickZoom(cfg.def);
    for (const z of opts) {
      if (w / z >= cfg.minW && h / z - cfg.chrome >= cfg.minStage) return z;
    }
    return opts[opts.length - 1];
  }

  M.zoomAuto = true;

  function applyZoom() {
    document.documentElement.style.setProperty('--gz', String(M.zoom));
    if (eCtx) earthResize();
    bgResize();
    if (GG.render && GG.render.resize) { try { GG.render.resize(); } catch (e) {} }
  }
  M.zoom = 1;
  M.setZoom = function (z, save) {
    M.zoom = pickZoom(+z || zoomCfg().def);
    M.zoomAuto = false;
    applyZoom();
    if (save !== false) saveSettings();
    return M.zoom;
  };

  M.zoomAutoApply = function () {
    if (!M.zoomAuto) return M.zoom;
    const z = autoZoom();
    if (Math.abs(z - M.zoom) < 1e-6) return M.zoom;
    M.zoom = z;
    applyZoom();
    saveSettings();
    return M.zoom;
  };

  M.wxNotice = (GG.config.wxNotice && GG.config.wxNotice.def) || 'here';

  function uiCfg(k) { return ((GG.config.ui || {})[k]) || {}; }
  M.outletBar  = uiCfg('outletBar').def  || 'off';
  M.skinChoice = uiCfg('skinChoice').def || 'new';

  M.gridSnap   = uiCfg('gridSnap').def   || 'free';
  M.wireBends  = uiCfg('wireBends').def  || 'off';
  M.wireAlign  = uiCfg('wireAlign').def  || 'on';
  M.gridStyle  = uiCfg('gridStyle').def  || 'lines';
  M.wxHints    = uiCfg('wxHints').def    || 'auto';
  M.treeLines  = uiCfg('treeLines').def  || 'straight';
  M.sweepGesture = uiCfg('sweepGesture').def || 'hover';
  M.dragSelect   = uiCfg('dragSelect').def   || 'pan';
  M.colourBlind  = uiCfg('colourBlind').def  || 'off';
  M.attention    = uiCfg('attention').def    || 'all';
  M.tips         = uiCfg('tips').def         || 'on';
  M.planetView   = uiCfg('planetView').def   || 'off';

  M.newsSeen   = '';

  const SET_KEY = 'earthregen.settings';
  function saveSettings() {
    try {
      localStorage.setItem(SET_KEY, JSON.stringify({
        master: M.master, sfx: baseSfx, mus: baseMus,

        mix: GG.config.audio.mixVersion || 1,
        full: isFull(),
        zoom: M.zoom,

        zoomAuto: !!M.zoomAuto,

        lang: GG.i18n ? GG.i18n.lang() : 'en',

        wxNotice: M.wxNotice,

        outletBar: M.outletBar,
        outletVer: ((GG.config.ui || {}).outletBar || {}).version || 1,
        gridSnap: M.gridSnap,
        gridVer: ((GG.config.ui || {}).gridSnap || {}).version || 1,
        wireBends: M.wireBends,
        wireAlign: M.wireAlign,
        gridStyle: M.gridStyle,
        bendVer: ((GG.config.ui || {}).wireBends || {}).version || 1,
        wxHints: M.wxHints,
        treeLines: M.treeLines,
        sweepGesture: M.sweepGesture,
        dragSelect: M.dragSelect,
        colourBlind: M.colourBlind,
        attention: M.attention,
        tips: M.tips,
        planetView: M.planetView,
        skinChoice: M.skinChoice,
        newsSeen: M.newsSeen || '',
        devHidden: !!(GG.ui && GG.ui.devHidden && GG.ui.devHidden()),
      }));
      if (GG.state && GG.state.mirror) GG.state.mirror(SET_KEY);
    } catch (e) {}
  }

  M.saveSettings = saveSettings;
  function loadSettings() {
    try {
      const d = JSON.parse(localStorage.getItem(SET_KEY) || 'null');
      if (!d) return;

      M.newsSeen = typeof d.newsSeen === 'string' ? d.newsSeen : '';
      M.zoomAuto = d.zoomAuto === undefined ? true : !!d.zoomAuto;
      if (d.zoom !== undefined && !M.zoomAuto) M.zoom = pickZoom(d.zoom);
      else M.zoom = autoZoom();
      if (d.wxNotice && (GG.config.wxNotice.options || []).indexOf(d.wxNotice) >= 0)
        M.wxNotice = d.wxNotice;

      function pickUi(key, saved, cur) {
        const cfg = ((GG.config.ui || {})[key]) || {};
        return (cfg.options || []).indexOf(saved) >= 0 ? saved : cur;
      }

      const obVer = ((GG.config.ui || {}).outletBar || {}).version || 1;
      const obStale = (d.outletVer || 1) !== obVer;
      if (!obStale) M.outletBar = pickUi('outletBar', d.outletBar, M.outletBar);
      M.skinChoice = pickUi('skinChoice', d.skinChoice, M.skinChoice);

      const gsStale = (d.gridVer || 1) !== ((((GG.config.ui || {}).gridSnap) || {}).version || 1);
      if (!gsStale) M.gridSnap = pickUi('gridSnap', d.gridSnap, M.gridSnap);

      const wbStale = (d.bendVer || 1) !== ((((GG.config.ui || {}).wireBends) || {}).version || 1);
      if (!wbStale) M.wireBends = pickUi('wireBends', d.wireBends, M.wireBends);
      M.wireAlign  = pickUi('wireAlign',  d.wireAlign,  M.wireAlign);
      M.gridStyle  = pickUi('gridStyle',  d.gridStyle,  M.gridStyle);
      M.wxHints    = pickUi('wxHints',    d.wxHints,    M.wxHints);
      M.treeLines  = pickUi('treeLines',  d.treeLines,  M.treeLines);
      M.sweepGesture = pickUi('sweepGesture', d.sweepGesture, M.sweepGesture);
      M.dragSelect   = pickUi('dragSelect',   d.dragSelect,   M.dragSelect);
      M.colourBlind  = pickUi('colourBlind',  d.colourBlind,  M.colourBlind);
      M.attention    = pickUi('attention',    d.attention,    M.attention);
      M.tips         = pickUi('tips',         d.tips,         M.tips);
      M.planetView   = pickUi('planetView',   d.planetView,   M.planetView);

      if (GG.ui && GG.ui.applySkin) GG.ui.applySkin();
      if (GG.ui && GG.ui.applyColourBlind) GG.ui.applyColourBlind();
      if (d.devHidden !== undefined && GG.ui && GG.ui.setDevHidden) GG.ui.setDevHidden(d.devHidden, false);
      M.master = d.master === undefined ? 1 : d.master;

      const stale = (d.mix || 1) !== (GG.config.audio.mixVersion || 1);
      if (!stale) {
        baseSfx = d.sfx === undefined ? baseSfx : d.sfx;
        baseMus = d.mus === undefined ? baseMus : d.mus;
      }
      applyMaster();
      if (stale || obStale || gsStale) saveSettings();
    } catch (e) {}
  }

  M.isOpen = function () { return open; };
  M.started = function () { return started; };

  M.close = function () {
    open = false;
    earthDrop();
    if (GG.audio && GG.audio.musicMode) GG.audio.musicMode('game');
    root.classList.add('mn-hide');
    setTimeout(function () { if (!open) root.classList.add('hidden'); }, 320);
    if (bgRAF) { cancelAnimationFrame(bgRAF); bgRAF = 0; }

    if (GG.ui && GG.ui.syncWeatherSound) GG.ui.syncWeatherSound();
  };

  M.open = function (p) {

    if (GG.practice && GG.practice.active) GG.practice.exit();
    if (started) GG.state.save(true);
    open = true;

    if (GG.audio) { GG.audio.leaveWeather(); if (GG.audio.musicMode) GG.audio.musicMode('menu'); }
    page = p || (started ? 'slots' : 'home');
    root.classList.remove('hidden');

    requestAnimationFrame(function () { root.classList.remove('mn-hide'); });
    render();
    bgResize();
    bgLast = 0;
    if (!bgRAF) bgRAF = requestAnimationFrame(bgLoop);
  };

  M._applyImport = applyImport;
  M._exportSlot = exportSlot;

  const GKEY = 'earthregen.guardSeen';

  M.needsMouse = function () {
    const g = GG.config.mobileGuard || {};
    if (!g.enabled) return false;
    const coarse = GG.util.noMouse();
    const narrow = g.minWidth > 0 && innerWidth < g.minWidth;
    return coarse || narrow;
  };

  M.guardRun = function (force) {
    const g = GG.config.mobileGuard || {};
    if (!g.enabled) return null;
    if (!force) {
      if (!M.needsMouse()) return null;

      if (g.rememberSec > 0) {
        const t = parseFloat(localStorage.getItem(GKEY) || '0');
        if (t && (Date.now() - t) / 1000 < g.rememberSec) return null;
      }
    }

    const el = document.createElement('div');
    el.className = 'mg-wrap';
    const T = GG.i18n.t;
    el.innerHTML =
      '<div class="mg-card">' +
        '<div class="mg-icon">' +

          '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" '+
            'stroke="currentColor" stroke-width="1.8" stroke-linecap="round">'+
            '<rect x="7" y="2.6" width="10" height="18.8" rx="5"/>'+
            '<path d="M12 6.4v3.6"/></svg>' +
        '</div>' +
        '<h2>' + T('mg.title') + '</h2>' +
        '<p>' + T('mg.body') + '</p>' +
        '<p class="mg-come">' + T('mg.come') + '</p>' +
        (g.allowAnyway === false ? '' :
          '<button class="mg-go" type="button">' + T('mg.anyway') + '</button>') +
      '</div>';

    el.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    const go = el.querySelector('.mg-go');
    if (go) go.addEventListener('click', function () {
      if (g.rememberSec > 0) { try { localStorage.setItem(GKEY, String(Date.now())); } catch (e) {} }
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 260);
    });

    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('on'); });
    return el;
  };

  M.init = function () {
    root = document.getElementById('menu');
    bgCv = document.getElementById('menu-bg');
    bgCtx = bgCv.getContext('2d');
    bgInit();
    bgResize();
    window.addEventListener('resize', function () {
      M.zoomAutoApply();
      bgResize(); earthResize();

      if (window.desktop && open && page === 'settings') render();
    });
    document.addEventListener('fullscreenchange', function () { M.zoomAutoApply(); });

    root.addEventListener('pointerdown', earthGrab);

    root.addEventListener('mouseover', function (e) {
      if (!eCtx) return;
      const card = e.target.closest('[data-slot]');
      if (!card) return;
      const i = +card.dataset.slot;
      earthShow(GG.state.slotMeta(i), i, false);
    });
    root.addEventListener('mouseout', function (e) {
      if (!eCtx) return;
      const card = e.target.closest('[data-slot]');

      if (!card || (e.relatedTarget && e.relatedTarget.closest &&
                    e.relatedTarget.closest('[data-slot]') === card)) return;
      if (e.relatedTarget && e.relatedTarget.closest &&
          e.relatedTarget.closest('[data-slot]')) return;
      earthDefault(false);
    });
    baseSfx = C().audio.volume;
    baseMus = C().audio.musicVolume;
    M.zoom = autoZoom();
    loadSettings();
    applyZoom();

    root.addEventListener('click', function (e) {
      const exp = e.target.closest('[data-export]');
      if (exp) { e.stopPropagation(); exportSlot(+exp.dataset.export); return; }
      const imp = e.target.closest('[data-import]');
      if (imp) { e.stopPropagation(); importToSlot(+imp.dataset.import); return; }
      const del = e.target.closest('[data-del]');
      if (del) {
        GG.audio.play('demolish');
        GG.state.deleteSlot(+del.dataset.del);
        render();
        return;
      }
      const slot = e.target.closest('[data-slot]');
      if (slot && (slot.dataset.slot && (slot.classList.contains('mn-slot') ||
                                         slot.classList.contains('mn-mini')))) {

        if (slot.classList.contains('mn-slot') && !slot.classList.contains('mn-empty')) return;
        startSlot(+slot.dataset.slot, slot.dataset.fresh === '1');
        return;
      }
      const st = e.target.closest('.mn-eg[data-stage]');
      if (st) {
        GG.audio.play('click');
        const v = st.dataset.stage;
        if (v === 'auto') M.earthAuto();
        else if (v === 'live') { M.earthAuto(false); }

        else M.earthPreview(+v === ePin ? 0 : +v, false);
        return;
      }
      const tut = e.target.closest('[data-tut]');
      if (tut) {
        const box = root.querySelector('#runName');
        launch(pendingSlot, true, tut.dataset.tut === '1', box ? box.value : '');
        return;
      }
      const stab = e.target.closest('[data-settab]');
      if (stab) {
        if (stab.dataset.settab !== setTab) { setTab = stab.dataset.settab; GG.audio.play('click'); render(true); }
        return;
      }
      const g = e.target.closest('[data-go]');
      if (g) { go(g.dataset.go); return; }
      const a = e.target.closest('[data-act]');
      if (a && a.dataset.act === 'exit') exitGame();
    });

    window.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !open) return;
      if (root.querySelector('.mn-splash')) return;
      if (page === 'home') return;
      e.preventDefault();
      GG.audio.play('click');
      go(page === 'tutor' ? 'slots' : 'home');
    });

    document.addEventListener('fullscreenchange', function () {
      if (open && page === 'settings') render();
      saveSettings();
    });

    M.open('home');
    M.guardRun();

    M.splashRun();
  };

  return M;
})();
