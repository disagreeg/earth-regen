(function (GG) {
  'use strict';
  const C = GG.config, S = GG.state, IC = GG.icons;

  const FONT_UI = "'Inter', ui-sans-serif, system-ui, sans-serif";
  const FONT_DISPLAY = "'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif";
  const FONT_MONO = "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace";

  const R = {};
  GG.render = R;

  let cv, ctx, dpr = 1, W = 0, H = 0;

  let boostMarks = {};

  function collar(kind, typeId, x, y, w, h, r, time) {
    const F = C.boostFx;
    if (!F || !F.enabled || !F[kind]) return;
    const list = boostMarks[typeId];
    if (!list || !list.length) return;

    const k = 0.5 + 0.5 * Math.sin(time * (Math.PI * 2) / F.pulseSec);
    const a = F.alphaLow + (F.alpha - F.alphaLow) * k;
    ctx.save();
    list.slice(0, F.maxStack).forEach(function (b, i) {
      const p = F.pad * (i + 1);
      ctx.strokeStyle = rgba(b.color, a);
      ctx.lineWidth = F.width;
      ctx.shadowColor = rgba(b.color, a * 0.8);
      ctx.shadowBlur = F.glow;
      roundRect(x - p, y - p, w + p * 2, h + p * 2, r + p); ctx.stroke();
    });
    ctx.restore();
  }

  R.init = function (canvas) {
    cv = canvas;
    ctx = cv.getContext('2d');
    R.canvas = cv;
    window.addEventListener('resize', R.resize);
    R.resize();
  };

  R.uiZoom = function () {
    const z = document.body && document.body.currentCSSZoom;
    if (typeof z === 'number' && z > 0) return z;

    if (cv && cv.clientWidth) {
      const r = cv.getBoundingClientRect();
      if (r.width > 0) return r.width / cv.clientWidth;
    }
    return 1;
  };

  R.resize = function () {
    dpr = window.devicePixelRatio || 1;
    const z = R.uiZoom();

    W = cv.clientWidth; H = cv.clientHeight;
    if (!W || !H) { const r = cv.getBoundingClientRect(); W = r.width / z; H = r.height / z; }
    cv.width = Math.round(W * z * dpr);
    cv.height = Math.round(H * z * dpr);
    ctx.setTransform(z * dpr, 0, 0, z * dpr, 0, 0);

    if (GG.ui && GG.ui.applyLayout) GG.ui.applyLayout();
  };

  const VIS = { line: '#8cc8ff', glow: '#4a9fe0', body: 'rgba(8,14,22,.8)', balloon: 48, crate: 30, minPx: 30, sit: 0.9, gone: 1.35 };
  let vis = null;
  const visSpark = {};
  const visEase = u => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);
  const visSc = () => 1 / S.g.camera.scale;
  function visOn() { const V = C.visitor; return !!(V && V.enabled !== false && S.skillLevel(V.skill) > 0); }
  function visVols() { return S.machinesHere().filter(n => n.type === 'player'); }
  function visBest() {
    const rate = n => GG.sim.crewRate(n, 'player') * GG.sim.powerMul(n);
    return visVols().reduce((a, n) => (!a || rate(n) > rate(a) ? n : a), null);
  }
  function visBox(n) { const z = S.sizeOf(n); return { x: n.x - z.w / 2, y: n.y - z.h / 2, w: z.w, h: z.h }; }
  function visPerch(n) { const b = visBox(n); return { x: b.x + b.w * 0.8, y: b.y - VIS.crate / 3 }; }
  function visAir() { return Math.max(VIS.balloon, VIS.minPx * visSc()); }
  const visPx = (w, min) => Math.max(w * S.g.camera.scale, min || 0);
  function stepVisitor(time) {
    const g = S.g, V = C.visitor;
    if (!visOn()) { vis = null; return; }
    if (typeof g.visitorNext !== 'number' || g.visitorNext > g.playtime + V.everySec) g.visitorNext = g.playtime + V.everySec;
    if (!vis && g.playtime >= g.visitorNext) {
      g.visitorNext = g.playtime + V.everySec;
      if (visVols().length) {
        const v = viewRect(0), s = visSc();
        vis = { phase: 'cross', t0: time, x0: v.x0 + (v.x1 - v.x0) * (0.25 + Math.random() * 0.5), yb: v.y1 + 50 * s, x: 0, y: 0, last: time, loc: g.loc };
      }
    }
    if (!vis) return;
    if (vis.loc !== g.loc) { vis = null; return; }
    const age = time - vis.t0, s = visSc(), n = vis.target ? S.node(vis.target) : null;
    if (vis.phase === 'cross') {
      const dt = Math.max(0, Math.min(0.05, time - vis.last)); vis.last = time;
      vis.yb -= (H + 100) / V.riseSec * dt * s;
      vis.y = vis.yb; vis.x = vis.x0 + Math.sin(age * 0.8) * 6 * s;
      if (vis.y + visAir() * 0.6 < viewRect(0).y0) vis = null;
    } else if (vis.phase === 'go') {
      if (!n) { vis = null; return; }
      const pp = visPerch(n), to = { x: pp.x, y: pp.y - visAir() * 0.4 - 10 }, e = visEase(age / 1.3);
      vis.x = vis.fx + (to.x - vis.fx) * e; vis.y = vis.fy + (to.y - vis.fy) * e;
      if (age >= 1.3) Object.assign(vis, { phase: 'perch', t0: time, bx: vis.x, by: vis.y, air: visAir(), took: false });
    } else if (vis.phase === 'perch') {
      if (!n) { vis = null; return; }
      if (!vis.took && age >= VIS.gone) {
        vis.took = true;
        g.visitorBoost = { id: n.id, until: g.playtime + GG.sim.visitorSec() };
        GG.audio.play('boost');
        const b = visBox(n); R.burst(b.x + b.w * 0.8, b.y + 6, { color: VIS.glow, count: 14, speed: 55, lift: 10, size: 2.2 });
      }
      if (age >= 2.6) vis = null;
    }
  }
  R.visitorClick = function (wx, wy) {
    if (!vis || vis.phase !== 'cross') return false;
    if (Math.hypot(wx - vis.x, wy - vis.y) > Math.max(visAir() * 0.6, 30 * visSc())) return false;
    const n = visBest(); if (!n) return false;
    R.burst(vis.x, vis.y, { color: VIS.glow, count: 10, speed: 70, lift: 10, size: 2 });
    Object.assign(vis, { phase: 'go', t0: visClock, target: n.id, fx: vis.x, fy: vis.y });
    return true;
  };
  let visClock = 0;
  R.visitor = function () { return vis; };
  const VPATH = {
    envelope: (c, body) => { c.moveTo(12, 1); c.bezierCurveTo(19, 1, 20.5, 8, 15.5, 13.2); c.lineTo(8.5, 13.2); c.bezierCurveTo(3.5, 8, 5, 1, 12, 1); c.closePath();
      if (!body) { c.moveTo(12, 1); c.bezierCurveTo(9, 3.5, 8.6, 9, 10.2, 13.2); c.moveTo(12, 1); c.bezierCurveTo(15, 3.5, 15.4, 9, 13.8, 13.2);
        c.moveTo(6.3, 6.5); c.quadraticCurveTo(12, 8.2, 17.7, 6.5); } },
    band: (c) => { c.moveTo(9.2, 13.6); c.lineTo(14.8, 13.6); c.lineTo(14, 15.2); c.lineTo(10, 15.2); c.closePath(); },
    ropes: (c) => { c.moveTo(10, 15.2); c.lineTo(8.6, 18.6); c.moveTo(14, 15.2); c.lineTo(15.4, 18.6); c.moveTo(11.2, 15.2); c.lineTo(11, 18.6); c.moveTo(12.8, 15.2); c.lineTo(13, 18.6); },
    crate: (c, body) => { c.rect(8, 18.6, 8, 4.8); if (!body) { c.moveTo(8, 20.1); c.lineTo(16, 20.1); c.moveTo(10.7, 20.1); c.lineTo(10.7, 23.4); c.moveTo(13.3, 20.1); c.lineTo(13.3, 23.4); } },
    crateBig: (c, body) => { c.rect(4, 9, 16, 11); if (!body) { c.moveTo(4, 12); c.lineTo(20, 12); c.moveTo(9.3, 12); c.lineTo(9.3, 20); c.moveTo(14.7, 12); c.lineTo(14.7, 20);
      c.moveTo(11, 10.5); c.lineTo(13, 10.5); } },
  };
  const VBALLOON = (c, body) => { VPATH.envelope(c, body); if (body) { c.moveTo(9.2, 13.6); VPATH.band(c); c.moveTo(8, 18.6); VPATH.crate(c, body); }
    else { VPATH.band(c); VPATH.ropes(c); VPATH.crate(c, body); } };
  const VENVELOPE = (c, body) => { VPATH.envelope(c, body); if (body) { c.moveTo(9.2, 13.6); VPATH.band(c); } else { VPATH.band(c); VPATH.ropes(c); } };
  function visWire(x, y, sizePx, rot, path) {
    const k = visSc() * sizePx / 24;
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(k, k); ctx.translate(-12, -12);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); path(ctx, true); ctx.fillStyle = VIS.body; ctx.fill();
    ctx.beginPath(); path(ctx, false);
    ctx.strokeStyle = VIS.line; ctx.lineWidth = Math.max(1.6, Math.min(2.6, sizePx / 24 * 1.1)) * 24 / sizePx;
    ctx.shadowColor = VIS.glow; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.restore();
  }
  function visChip(n, text, frac, alpha, col, scale, above, ink) {
    const b = visBox(n), t = S.type(n);
    col = col || VIS.glow;
    ctx.save(); ctx.globalAlpha = alpha; ctx.font = '600 9.5px ' + FONT_MONO;
    const w = ctx.measureText(text).width + 22, h = 16;
    let py = b.y + 13, right = b.x + b.w - 12;
    const hp = R.headPill ? R.headPill(n, t) : null;
    if (hp && hp.w > 0) right -= hp.w + 5;
    let px = right - w;

    const shown = GG.sim.nameOf ? GG.sim.nameOf(n) : t.name, nameW = b.w - 50 - 12 - (hp && hp.w ? hp.w + 8 : 0);
    fitNameFont(shown, nameW);
    const nameEnd = b.x + 50 + ctx.measureText(clipText(shown, nameW)).width;
    ctx.font = '600 9.5px ' + FONT_MONO;
    if (above || px < nameEnd + 6) { px = b.x + b.w - 12 - w; py = b.y - h - 5; }
    const cy = py + h / 2;
    if (scale && scale !== 1) { ctx.translate(px + w / 2, cy); ctx.scale(scale, scale); ctx.translate(-(px + w / 2), -cy); }
    ctx.fillStyle = 'rgba(14,20,26,0.85)'; roundRect(px, py, w, h, 8); ctx.fill();
    ctx.strokeStyle = col; ctx.globalAlpha = alpha * 0.55; ctx.lineWidth = 1; roundRect(px + 0.5, py + 0.5, w - 1, h - 1, 7.5); ctx.stroke();
    ctx.globalAlpha = alpha; ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(74,159,224,0.25)'; ctx.beginPath(); ctx.arc(px + 8, cy, 4, 0, Math.PI * 2); ctx.stroke();
    if (frac > 0) { ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(px + 8, cy, 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac)); ctx.stroke(); }
    ctx.fillStyle = ink || '#9fd4ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, px + (w + 10) / 2, cy + 0.5);
    ctx.restore();
  }
  function drawVisitor(time) {
    visClock = time;
    stepVisitor(time);
    const g = S.g, s = visSc();
    if (vis && vis.phase === 'cross') visWire(vis.x, vis.y, visPx(VIS.balloon, VIS.minPx * 1.15), Math.sin(time * 1.3) * 0.05, VBALLOON);
    else if (vis && vis.phase === 'go') visWire(vis.x, vis.y, visPx(VIS.balloon, VIS.minPx * 1.15), Math.sin(time * 1.3) * 0.05, VBALLOON);
    else if (vis && vis.phase === 'perch') {
      const age = time - vis.t0, n = S.node(vis.target), up = Math.min(1, age / 2.4);
      if (up < 1) { ctx.save(); ctx.globalAlpha = 1 - up; visWire(vis.bx + Math.sin(age * 2) * 6 * s, vis.by - visEase(up) * 220 * s, visPx(VIS.balloon, VIS.minPx * 1.15), 0, VENVELOPE); ctx.restore(); }
      if (n && age < VIS.gone) {
        const card = visBox(n), pp = visPerch(n), into = Math.max(0, Math.min(1, (age - VIS.sit) / (VIS.gone - VIS.sit))), k = 1 - visEase(into);
        const d = Math.min(1, age / 0.35), sy = vis.by + vis.air * 0.4;
        const bounce = d < 1 ? 0 : Math.max(0, Math.sin((age - 0.35) * 18) * 4 * Math.exp(-(age - 0.35) * 8));
        let x = pp.x, y = sy + (pp.y - sy) * d * d - bounce;
        x += (card.x + card.w * 0.8 - x) * into; y += (card.y + 18 - y) * into;
        if (k > 0.02) { ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.6); visWire(x, y, visPx(VIS.crate * (0.25 + 0.75 * k), 0), 0, VPATH.crateBig); ctx.restore(); }
      }
    }

    const B = g.visitorBoost, n = B && S.node(B.id);
    if (!B || !n || n.loc !== g.loc) return;
    const left = B.until - g.playtime, total = GG.sim.visitorSec();
    if (left < -0.45) { delete visSpark[B.id]; return; }
    const alpha = left > 0 ? 1 : 1 + left / 0.45;
    visChip(n, 'x' + ((C.visitor || {}).mul || 1), left > 0 ? left / total : 0, alpha);
    const card = visBox(n), list = visSpark[B.id] || (visSpark[B.id] = { at: 0, p: [] });
    if (left > 0 && time - list.at > 0.28) { list.at = time; list.p.push({ x: card.x + card.w * (0.15 + Math.random() * 0.7), y: card.y + 4, t0: time }); }
    list.p = list.p.filter(p => time - p.t0 < 0.9);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#9fd4ff';
    list.p.forEach(p => { const u = (time - p.t0) / 0.9, y = p.y - u * 22; ctx.globalAlpha = (1 - u) * 0.8;
      ctx.beginPath(); ctx.moveTo(p.x, y - 3); ctx.lineTo(p.x + 2.2, y); ctx.lineTo(p.x, y + 1.2); ctx.lineTo(p.x - 2.2, y); ctx.closePath(); ctx.fill(); });
    ctx.restore();
  }

  const GUS = { line: '#8cc8ff', glow: '#4a9fe0', chip: '#cfe9ff', in: 1.1 };
  let gustSeen = null;
  const GWIND = typeof Path2D !== 'undefined' ? new Path2D('M3 8h9.5a2.5 2.5 0 1 0-2.5-2.5M3 12h14.5a2.5 2.5 0 1 1-2.5 2.5M3 16h6') : null;
  const gClamp = v => Math.max(0, Math.min(1, v));
  function gustWind(x, y, size, alpha) {
    if (!GWIND || alpha <= 0) return;
    const k = size / 24;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-12, -12);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = GUS.line; ctx.lineWidth = 1.8;
    ctx.shadowColor = GUS.glow; ctx.shadowBlur = 8; ctx.stroke(GWIND); ctx.shadowBlur = 0; ctx.stroke(GWIND);
    ctx.restore();
  }
  function gustBumpOf(n) {
    if (!gustSeen || n.id !== gustSeen.id) return null;
    const k = (performance.now() / 1000 - gustSeen.t0 - GUS.in) / 0.3;
    return k >= 0 && k < 1 ? { s: 1 + 0.05 * Math.sin(Math.PI * k), a: 1 } : null;
  }
  function drawGust() {
    const g = S.g.gust, n = g && S.node(g.id);
    if (!g || !n) { gustSeen = null; return; }
    if (n.loc !== S.g.loc) return;
    const now = performance.now() / 1000, left = g.until - S.g.playtime;
    if (left < -0.2) return;
    if (!gustSeen || gustSeen.id !== g.id || gustSeen.until !== g.until) {
      gustSeen = { id: g.id, until: g.until, t0: now };
      if (left > 0 && (C.gust || {}).sound) GG.audio.play(C.gust.sound);
    }
    const age = now - gustSeen.t0, u = Math.max(1, 0.6 / S.g.camera.scale), b = visBox(n);
    const ib = { x: b.x + 13, y: b.y + 11, s: 28 }, icx = ib.x + ib.s / 2, icy = ib.y + ib.s / 2;
    if (age < GUS.in + 0.35) {
      const k = 1 - Math.pow(1 - gClamp(age / GUS.in), 3);
      gustWind(icx - 190 * u + 190 * u * k, icy, 54 * u, Math.min(1, age / 0.2) * (1 - gClamp((age - GUS.in) / 0.35)));
    }
    const r = (age - GUS.in) / 0.8;
    if (r >= 0 && r < 1) {
      const k = 1 - Math.pow(1 - r, 3);
      ctx.save(); ctx.strokeStyle = GUS.line; ctx.shadowColor = GUS.glow; ctx.shadowBlur = 10; ctx.lineWidth = 2.2 * (1 - k * 0.5);
      ctx.globalAlpha = 0.95 * (1 - k); ctx.beginPath(); ctx.arc(icx, icy, 16 + 40 * k, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    const on = gClamp((age - GUS.in) / 0.2) * gClamp(left / 1.2);
    if (!(left > 0 && on > 0)) return;
    const col = C.iconColor ? C.iconColor(S.type(n)) : GUS.line;
    const hx = icx + 2 * 17 / 24, t = now;
    ctx.save(); ctx.beginPath(); ctx.rect(ib.x, ib.y, ib.s, ib.s); ctx.clip(); ctx.lineCap = 'round';
    ctx.strokeStyle = col; ctx.globalAlpha = on * 0.6; ctx.lineWidth = 1.6; ctx.shadowColor = col; ctx.shadowBlur = 4;
    for (let i = 0; i < 3; i++) { const a0 = t * 9 + i * 2.094; ctx.beginPath(); ctx.arc(hx, icy, 8.5, a0, a0 + 1.1); ctx.stroke(); }
    ctx.restore();
    const pk = age - GUS.in, pop = 0.6 + 0.4 * (1 - Math.pow(1 - gClamp(pk / 0.35), 3)) + 0.15 * Math.sin(gClamp(pk / 0.35) * Math.PI);
    visChip(n, 'x' + ((C.gust || {}).mul || 1), left / ((C.gust || {}).sec || 30), on, GUS.chip, pop);
  }

  let shoot = null, starPick = null, starClock = 0;
  function starOn() { const T = C.star; return !!(T && T.enabled !== false && S.skillLevel(T.skill) > 0); }
  function starShape(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, q = i % 2 ? r * 0.32 : r; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    ctx.closePath(); ctx.fill();
  }
  function starScreen(el) {
    if (!el || !el.offsetParent) return null;
    const c = cv.getBoundingClientRect(), r = el.getBoundingClientRect(), z = R.uiZoom();
    return { l: (r.left - c.left) / z, r: (r.right - c.left) / z, t: (r.top - c.top) / z, b: (r.bottom - c.top) / z };
  }
  function starSkyTop() {
    let y = 0;
    ['topbar', 'places', 'boost-bar'].forEach(id => {
      const r = starScreen(document.getElementById(id));
      if (r && r.b > r.t && r.b > y && r.t < H * 0.4) y = r.b;
    });
    return R.toWorld(0, y).y;
  }
  function starBar() {
    const r = starScreen(document.getElementById('boost-bar'));
    return r ? R.toWorld(Math.max(r.l + 30, r.r) + 10, (r.t + r.b) / 2) : R.toWorld(60, 100);
  }
  function starLaunch(time) {
    const v = viewRect(0), s = visSc(), w = v.x1 - v.x0, h = v.y1 - v.y0, fromLeft = Math.random() < 0.5, m = 60 * s;
    const top = starSkyTop() + 20 * s;
    shoot = { x0: fromLeft ? v.x0 - m : v.x1 + m, y0: top + h * Math.random() * 0.06, dx: (fromLeft ? 1 : -1) * (w + 2 * m),
              dy: h * (0.22 + Math.random() * 0.12), sag: h * 0.06, t0: time, dur: C.star.crossSec, dust: [], caught: false, loc: S.g.loc };
  }
  function starPos(t) {
    const u = Math.max(0, Math.min(1, (t - shoot.t0) / shoot.dur));
    return { x: shoot.x0 + shoot.dx * u, y: shoot.y0 + shoot.dy * u + shoot.sag * Math.sin(u * Math.PI) * -0.5 + shoot.sag * u * u };
  }
  function stepStar(time) {
    const g = S.g;
    if (!starOn()) { shoot = null; starPick = null; return; }
    const ni = GG.sim.nightNow();
    if (ni && g.starNight !== ni.index) {
      g.starNight = ni.index;
      g.starAt = Math.random() * 100 < C.star.pct ? { index: ni.index, frac: 0.1 + Math.random() * 0.65 } : null;
    }
    const at = g.starAt;
    if (at && (!ni || ni.index !== at.index)) g.starAt = null;
    else if (at && ni.frac >= at.frac && !shoot) { g.starAt = null; starLaunch(time); }
    if (shoot && shoot.loc !== g.loc) shoot = null;
    if (shoot && !shoot.caught && time - shoot.t0 > shoot.dur + 0.2) shoot = null;
    if (shoot && shoot.caught && time - shoot.caughtAt > 1.6) shoot = null;
  }
  R.starClick = function (wx, wy) {
    if (!shoot || shoot.caught) return false;
    const p = starPos(starClock);
    if (Math.hypot(wx - p.x, wy - p.y) > 40 * visSc()) return false;
    const list = GG.sim.starBoosts(), b = list.length ? list[Math.floor(Math.random() * list.length)] : null;
    shoot.caught = true; shoot.caughtAt = starClock;
    starPick = { id: b ? b.id : null, x: p.x, y: p.y, t0: starClock, landed: false };
    if (C.star.sound) GG.audio.play(C.star.sound);
    return true;
  };
  R.star = function () { return { shoot: shoot, pick: starPick, pos: shoot ? starPos(starClock) : null }; };
  function drawStar(time) {
    starClock = time;
    stepStar(time);
    const s = visSc();
    if (shoot && !shoot.caught) {
      const p = starPos(time), a = starPos(Math.max(shoot.t0, time - 0.05)), L = Math.hypot(p.x - a.x, p.y - a.y) || 1;
      const nx = (p.x - a.x) / L, ny = (p.y - a.y) / L, tail = 170 * s;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createLinearGradient(p.x, p.y, p.x - nx * tail, p.y - ny * tail);
      gr.addColorStop(0, 'rgba(255,245,200,0.95)'); gr.addColorStop(0.3, 'rgba(255,215,140,0.45)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = gr; ctx.beginPath();
      ctx.moveTo(p.x + ny * 3.2 * s, p.y - nx * 3.2 * s); ctx.lineTo(p.x - nx * tail, p.y - ny * tail); ctx.lineTo(p.x - ny * 3.2 * s, p.y + nx * 3.2 * s); ctx.closePath(); ctx.fill();
      const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 22 * s);
      halo.addColorStop(0, 'rgba(255,255,240,1)'); halo.addColorStop(0.25, 'rgba(255,236,170,0.7)'); halo.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(p.x, p.y, 22 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; starShape(p.x, p.y, (9 + 2 * Math.sin(time * 25)) * s, time * 3);
      if (Math.random() < 0.7) shoot.dust.push({ x: p.x - nx * 10 * s, y: p.y - ny * 10 * s, vx: (Math.random() - 0.5) * 20 * s, vy: (10 + Math.random() * 25) * s, t0: time });
      ctx.restore();
    }
    if (shoot) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ffe9a8';
      shoot.dust = shoot.dust.filter(d => time - d.t0 < 1.1 && time >= d.t0);
      shoot.dust.forEach(d => { const k = time - d.t0, a = 1 - k / 1.1; ctx.globalAlpha = a; starShape(d.x + d.vx * k, d.y + d.vy * k, 2.2 * s * a + 0.6 * s, time * 4); });
      ctx.restore();
    }
    if (!starPick) return;
    const age = time - starPick.t0, hop = 0.18, fly = 0.7;
    if (age < 0) { starPick = null; return; }
    if (!starPick.id) {
      if (age > 0.6) { starPick = null; return; }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - age / 0.6; ctx.fillStyle = '#ffffff';
      starShape(starPick.x, starPick.y, 9 * s, time * 3); ctx.restore(); return;
    }
    const tg = starBar();
    let x, y, sz = 9 * s;
    if (age < hop) { const k = Math.sin(age / hop * Math.PI); x = starPick.x; y = starPick.y - 14 * s * k; sz *= 1 + 0.35 * k; }
    else {
      const k = Math.min(1, (age - hop) / fly), e = k * k * (3 - 2 * k);
      const cx = (starPick.x + tg.x) / 2, cy = Math.min(starPick.y, tg.y) - 80 * s;
      x = (1 - e) * (1 - e) * starPick.x + 2 * (1 - e) * e * cx + e * e * tg.x;
      y = (1 - e) * (1 - e) * starPick.y + 2 * (1 - e) * e * cy + e * e * tg.y;
      sz *= 1 - 0.45 * e;
      if (shoot && Math.random() < 0.8) shoot.dust.push({ x: x, y: y, vx: (Math.random() - 0.5) * 16 * s, vy: (6 + Math.random() * 14) * s, t0: time });
      if (k >= 1 && !starPick.landed) { starPick.landed = true; GG.sim.starStart(starPick.id); }
    }
    if (starPick.landed && age > hop + fly + 0.25) { starPick = null; return; }
    const a = starPick.landed ? Math.max(0, Math.min(1, 1 - (age - hop - fly) / 0.25)) : 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
    const halo = ctx.createRadialGradient(x, y, 0, x, y, sz * 2.4);
    halo.addColorStop(0, 'rgba(255,255,240,0.95)'); halo.addColorStop(0.35, 'rgba(255,236,170,0.5)'); halo.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, sz * 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; starShape(x, y, sz, time * 3); ctx.restore();
  }

  const NOTE_COL = '#b478e8', notes = [];
  let noteClock = 0;
  R.noteDrop = function (delay) {
    const v = viewRect(0), w = v.x1 - v.x0, h = v.y1 - v.y0, gx = v.x0 + w * (0.2 + Math.random() * 0.6);
    notes.push({ x0: v.x0 - w * 0.08, gx: gx, gy: v.y0 + h * (0.45 + Math.random() * 0.4), top: v.y0 - h * 0.08,
                 t0: null, delay: delay || 0, fall: C.banknote.fallSec, ph: Math.random() * 6, val: C.banknote.cash,
                 state: 'wait', x: gx, y: v.y0, rot: 0, sy: 1, loc: S.g.loc });
  };
  R.notes = function () { return notes; };
  function noteBox() { const s = visSc(); return { w: 46 * s, h: 22 * s }; }
  R.noteClick = function (wx, wy) {
    const b = noteBox();
    const nt = notes.find(n => (n.state === 'land' || n.state === 'fall') && n.loc === S.g.loc &&
      Math.abs(wx - n.x) < b.w * 0.65 && Math.abs(wy - n.y) < b.h * 0.9);
    if (!nt) return false;
    nt.state = 'taken';
    const cash = GG.sim.takeNote(), p = R.toScreen(nt.x, nt.y);
    if (GG.ui.luckyCoin) GG.ui.luckyCoin(p.x, p.y, cash, 'note');
    return true;
  };
  function drawNotes(time) {
    noteClock = time;
    const s = visSc(), B = noteBox(), eo = u => 1 - Math.pow(1 - u, 3);
    for (let i = notes.length - 1; i >= 0; i--) {
      const nt = notes[i];
      if (nt.state === 'taken' || nt.loc !== S.g.loc) { notes.splice(i, 1); continue; }
      if (nt.t0 === null) nt.t0 = time + nt.delay;
      if (nt.state === 'wait') { if (time < nt.t0) continue; nt.state = 'fall'; }
      if (nt.state === 'fall') {
        const u = Math.max(0, Math.min(1, (time - nt.t0) / nt.fall)), k = time - nt.t0 + nt.ph;
        nt.x = nt.x0 + (nt.gx - nt.x0) * eo(u) + Math.sin(k * 3.1) * 16 * s;
        nt.y = nt.top + (nt.gy - nt.top) * (u * u * 0.6 + u * 0.4) + Math.sin(k * 2.3) * 10 * s * (1 - u);
        nt.rot = k * 5.5 * (1 - u * 0.8); nt.sy = Math.cos(k * 6.3);
        if (u >= 1) { nt.state = 'land'; nt.landT = time; nt.x = nt.gx; nt.y = nt.gy; R.burst(nt.x, nt.y + 4, { color: '#cbbb96', count: 7, speed: 40, lift: 10, size: 2 }); }
      } else if (nt.state === 'land') {
        nt.rot = 0; nt.sy = 0.6;
        if (time - nt.landT > C.banknote.lieSec) { nt.state = 'fade'; nt.fadeT = time; }
      } else if (nt.state === 'fade' && time - nt.fadeT > 1.5) { notes.splice(i, 1); continue; }
      const a = nt.state === 'fade' ? Math.max(0, 1 - (time - nt.fadeT) / 1.5) : 1;
      const gu = nt.state === 'fall' ? Math.max(0, Math.min(1, (time - nt.t0) / nt.fall)) : 1, w = B.w, h = B.h;
      ctx.save(); ctx.globalAlpha = 0.28 * gu * a; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(nt.x, nt.gy + 6 * s, w * (0.25 + 0.3 * gu), h * 0.22, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = a; ctx.translate(nt.x, nt.y); ctx.rotate(nt.rot || 0); ctx.scale(1, nt.sy);
      const back = nt.sy < 0;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.fillStyle = 'rgba(8,14,22,.85)'; roundRect(-w / 2, -h / 2, w, h, 3 * s); ctx.fill();
      ctx.strokeStyle = NOTE_COL; ctx.lineWidth = 1.8 * s; ctx.shadowColor = NOTE_COL; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.globalAlpha = a * 0.6; ctx.lineWidth = 1 * s; roundRect(-w / 2 + 3.5 * s, -h / 2 + 3.5 * s, w - 7 * s, h - 7 * s, 2 * s); ctx.stroke();
      ctx.globalAlpha = a; ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.arc(0, 0, h * 0.27, 0, Math.PI * 2); ctx.stroke();
      if (!back) {
        ctx.fillStyle = NOTE_COL; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '700 ' + (8.5 * s) + 'px Inter, sans-serif'; ctx.fillText('$', 0, 0.5 * s);
        ctx.font = '700 ' + (6 * s) + 'px Inter, sans-serif'; const lab = String(nt.val);
        ctx.fillText(lab, -w / 2 + 10 * s, -h / 2 + 6.5 * s); ctx.fillText(lab, w / 2 - 10 * s, h / 2 - 6 * s);
      }
      ctx.restore();
      if (nt.state === 'land') {
        const g = ((time - nt.landT) % 2) / 2;
        if (g < 0.35) { ctx.save(); ctx.globalAlpha = (1 - g / 0.35) * 0.9; ctx.strokeStyle = '#f1e2ff'; ctx.lineWidth = 2 * s;
          const gx = nt.x - w / 2 + w * (g / 0.35); ctx.beginPath(); ctx.moveTo(gx - 4 * s, nt.y - h * 0.3); ctx.lineTo(gx + 4 * s, nt.y + h * 0.3); ctx.stroke(); ctx.restore(); }
      }
    }
  }

  const rises = [];
  let gemClock = 0;
  R.groundGemRise = function (spot) { rises.push(Object.assign({}, spot, { t0: null, how: C.groundGem.types[spot.type] || 'pop' })); };
  R.groundRises = function () { return rises; };
  function gemGlyph(x, y, size, a, spin) {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(spin === undefined ? 1 : Math.max(0.2, Math.abs(Math.cos(spin))), 1);
    ctx.shadowColor = '#ff5c8a'; ctx.shadowBlur = size * 0.5;
    GG.icons.drawIcon(ctx, 'diamond', 0, 0, size, '#ff5c8a', 2.2); ctx.restore();
  }
  function gemStar(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, q = i % 2 ? r * 0.32 : r; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    ctx.closePath(); ctx.fill();
  }
  R.groundGemClick = function (wx, wy, ev) {
    const list = S.g.groundGems || [], s = visSc();
    const i = list.findIndex(w => w.loc === S.g.loc && Math.hypot(wx - w.x, wy - (w.y - 26 * s)) < 22 * s);
    if (i < 0) return false;
    const w = list[i], amount = GG.sim.takeGroundGem(i);
    if (!amount) return false;
    GG.audio.play('gemTake');
    const p = R.toScreen(w.x, w.y - 26 * s);
    if (!(GG.ui.groundGemHome && GG.ui.groundGemHome(p.x, p.y, amount)) && GG.ui.spark) GG.ui.spark(p.x, p.y, '+' + amount + ' ◆', 'gem');
    return true;
  };
  function drawGroundGems(time) {
    const last = gemClock; gemClock = time;
    const dt = Math.max(0, Math.min(0.05, time - last)), s = visSc(), eo = u => 1 - Math.pow(1 - u, 3);
    const back = u => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
    const cl = v => Math.max(0, Math.min(1, v));
    for (let i = rises.length - 1; i >= 0; i--) {
      const r = rises[i];
      if (r.t0 === null) r.t0 = time;
      const age = time - r.t0, col = (C.groundGem.color || {})[r.type] || '#cccccc';
      if (r.loc !== S.g.loc) { rises.splice(i, 1); GG.sim.groundGemLand(r); continue; }
      if (r.how === 'rise') {
        for (let k = 0; k < 3; k++) { const u = (age - k * 0.22) / 1.3; if (u <= 0 || u >= 1) continue;
          ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = (1 - u) * 0.8; ctx.lineWidth = (2.5 - 1.5 * u) * s;
          ctx.beginPath(); ctx.ellipse(r.x, r.y, (8 + 70 * eo(u)) * s, (4 + 30 * eo(u)) * s, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        const u = cl((age - 0.3) / 0.7), y = r.y + 12 * s - 38 * s * eo(u);
        ctx.save(); ctx.beginPath(); ctx.rect(r.x - 40 * s, r.y - 120 * s, 80 * s, 122 * s); ctx.clip();
        gemGlyph(r.x, y, 30 * s * (0.6 + 0.4 * u), cl(u * 2)); ctx.restore();
        if (u > 0 && u < 1) { ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = 0.5 * (1 - u); ctx.beginPath(); ctx.ellipse(r.x, r.y + 2 * s, 14 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      } else {
        const cu = cl(age / 0.35);
        ctx.save(); ctx.strokeStyle = 'rgba(20,14,8,' + (0.85 * cl((1.6 - age) / 0.5)) + ')'; ctx.lineWidth = 2.2 * s; ctx.lineJoin = 'round';
        for (let k = 0; k < 5; k++) { const a = k * 1.256 + 0.4; ctx.beginPath(); ctx.moveTo(r.x, r.y);
          for (let j = 1; j <= 3; j++) { const d = 9 * j * cu * s; ctx.lineTo(r.x + Math.cos(a + (j % 2 ? 0.3 : -0.3)) * d, r.y + Math.sin(a + (j % 2 ? 0.3 : -0.3)) * d * 0.5); } ctx.stroke(); }
        ctx.restore();
        if (age > 0.35 && !r.burst) { r.burst = true; R.burst(r.x, r.y, { color: col, count: 16, speed: 90, lift: 26, size: 2.6 }); }
        if (age > 0.35) { const u = cl((age - 0.35) / 0.55);
          gemGlyph(r.x, r.y - 26 * s * back(u), 30 * s * (0.5 + 0.5 * eo(u)), cl(u * 3), age < 1.1 ? (age - 0.35) * 12 : undefined); }
      }
      if (age > 1.05 && age < 1.45) { ctx.save(); ctx.fillStyle = '#fff'; ctx.globalAlpha = 1 - (age - 1.05) / 0.4; gemStar(r.x + 9 * s, r.y - 34 * s, 6 * s, age * 4); ctx.restore(); }
      if (age > 1.4) {
        rises.splice(i, 1);
        if (GG.sim.groundGemLand(r) === 'slot' && GG.ui.syncGem) {
          GG.ui.syncGem();
          const el = document.querySelector('#gem-layer .gem');
          if (el) { el.classList.remove('fx-drop'); const sh = el.querySelector('.gshadow,.gring'); if (sh) sh.remove(); }
        }
      }
    }

    const list = S.g.groundGems || [];
    for (let i = list.length - 1; i >= 0; i--) {
      const w = list[i];
      if (w.loc !== S.g.loc) continue;
      if (!S.g.gem && !rises.length) { list.splice(i, 1); GG.sim.groundGemLand(w); if (GG.ui.syncGem) GG.ui.syncGem(); continue; }
      gemGlyph(w.x, w.y - 26 * s + Math.sin(time * 2.5 + i) * 3 * s, 26 * s, 0.85);
    }
  }

  let aurSeen = null;
  function drawAurora(time) {
    const Sm = GG.sim, on = Sm.auroraOn && Sm.auroraOn();
    if (on && !aurSeen) aurSeen = { t0: time, end: null };
    if (!on && aurSeen && aurSeen.end === null) aurSeen.end = time;
    if (!aurSeen) return;
    const fadeIn = Math.max(0, Math.min(1, (time - aurSeen.t0) / 4));
    const fadeOut = aurSeen.end === null ? 1 : Math.max(0, 1 - (time - aurSeen.end) / 4);
    if (fadeOut <= 0) { aurSeen = null; return; }
    const k = fadeIn * fadeOut * 0.8, t = aurSeen.t0 + (time - aurSeen.t0) * 0.6, s = visSc();
    const vr = viewRect(0), vw = vr.x1 - vr.x0, vh = vr.y1 - vr.y0;
    const v = { x0: vr.x0, w: vw, y0: vr.y0 - vh * 0.02, h: vh * 0.45 };
    const bands = [['76,255,176', 0.18, 0.0], ['125,255,154', 0.30, 1.7], ['180,140,255', 0.55, 3.1], ['90,230,220', 0.75, 4.4]];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    bands.forEach(([rgb, cx, ph], i) => {
      const w = v.w * 0.42, x0 = v.x0 + v.w * cx - w / 2 + Math.sin(t * 0.12 + ph) * v.w * 0.05, N = 48, top = [], bot = [];
      for (let j = 0; j <= N; j++) {
        const x = x0 + w * j / N, f = j / N;
        const wave = Math.sin(f * 7 + t * 0.6 + ph) * v.h * 0.025 + Math.sin(f * 17 - t * 1.1 + ph) * v.h * 0.008;
        const yt = v.y0 + v.h * (0.04 + 0.06 * Math.sin(f * 3 + ph + t * 0.2)) + wave;
        top.push([x, yt]); bot.push([x, yt + v.h * (0.22 + 0.06 * Math.sin(f * 5 + t * 0.4 + ph))]);
      }
      const g = ctx.createLinearGradient(0, v.y0, 0, v.y0 + v.h * 0.42);
      g.addColorStop(0, 'rgba(' + rgb + ',0)'); g.addColorStop(0.55, 'rgba(' + rgb + ',' + (0.2 * k) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g;
      for (let q = 0; q < N; q++) {
        ctx.globalAlpha = Math.pow(Math.sin((q + 0.5) / N * Math.PI), 0.7);
        ctx.beginPath(); ctx.moveTo(top[q][0], top[q][1]); ctx.lineTo(top[q + 1][0] + 0.5 * s, top[q + 1][1]);
        ctx.lineTo(bot[q + 1][0] + 0.5 * s, bot[q + 1][1]); ctx.lineTo(bot[q][0], bot[q][1]); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.14 * k) + ')'; ctx.lineWidth = 2 * s;
      for (let r = 0; r < 22; r++) { const f = ((r * 0.618 + i * 0.3) % 1), q = Math.round(f * N), x = top[q][0], a = 0.5 + 0.5 * Math.sin(t * 2 + r * 1.3 + ph);
        ctx.globalAlpha = a * Math.sin(f * Math.PI); ctx.beginPath(); ctx.moveTo(x, top[q][1]); ctx.lineTo(x, bot[q][1]); ctx.stroke(); }
      ctx.globalAlpha = 1;
    });
    ctx.restore();
  }

  let con = null, conClock = 0;
  const conPts = {};
  function conGroupPts(gr) {
    if (conPts[gr.id]) return conPts[gr.id];
    const v = gr.stars.map(([ra, de]) => { const a = ra * Math.PI / 12, d = de * Math.PI / 180; return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)]; });
    const m = v.reduce((o, u) => [o[0] + u[0], o[1] + u[1], o[2] + u[2]], [0, 0, 0]), ml = Math.hypot(m[0], m[1], m[2]), c = m.map(x => x / ml);
    let east = [-c[1], c[0], 0]; const el = Math.hypot(east[0], east[1], east[2]) || 1; east = east.map(x => x / el);
    const north = [c[1] * east[2] - c[2] * east[1], c[2] * east[0] - c[0] * east[2], c[0] * east[1] - c[1] * east[0]];
    const xy = v.map(u => [-(u[0] * east[0] + u[1] * east[1] + u[2] * east[2]), -(u[0] * north[0] + u[1] * north[1] + u[2] * north[2])]);
    const xs = xy.map(q => q[0]), ys = xy.map(q => q[1]);
    const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    const span = Math.max(x1 - x0, y1 - y0);
    return (conPts[gr.id] = xy.map(([x, y]) => [(x - (x0 + x1) / 2) / span, (y - (y0 + y1) / 2) / span]));
  }
  function conOn() { const K = C.constellation; return !!(K && K.enabled !== false && S.skillLevel(K.skill) > 0); }
  function conWorld() {
    const v = viewRect(0), w = v.x1 - v.x0, h = v.y1 - v.y0, s = visSc(), size = Math.min(w, h) * (con.gr.size || 0.26), cx = v.x0 + w * 0.5;
    const pts = conGroupPts(con.gr), ys = pts.map(q => q[1]), mid = -Math.min.apply(null, ys);
    const top = starSkyTop() + 50 * s;
    return pts.map(([a, b]) => ({ x: cx + a * size, y: top + (b + mid) * size }));
  }

  function conGroups() {
    const K = C.constellation, Sm = GG.sim;
    if (K.reward !== 'boost' || !K.skipHidden) return K.groups;
    return K.groups.filter(gr => { const b = Sm.boostById(gr.prize); return b && Sm.boostVisible(b); });
  }
  function conPage(wx, wy) {
    const c = cv.getBoundingClientRect(), z = R.uiZoom(), p = R.toScreen(wx, wy);
    return { x: c.left + p.x * z, y: c.top + p.y * z };
  }
  function stepCon(time) {
    const g = S.g, K = C.constellation;
    if (!conOn()) { con = null; return; }
    const ni = GG.sim.nightNow();
    if (ni && g.conNight !== ni.index) {
      g.conNight = ni.index;
      g.conAt = Math.random() * 100 < GG.sim.stat('constellation', 'conPct') ? K.fromFrac + Math.random() * K.spanFrac : null;
    }
    if (g.conAt !== null && g.conAt !== undefined && (!ni || ni.index !== g.conNight)) g.conAt = null;
    else if (g.conAt !== null && g.conAt !== undefined && ni.frac >= g.conAt && !con) {
      g.conAt = null;
      const all = conGroups(), gr = all[Math.floor(Math.random() * all.length)];
      if (gr) con = { gr: gr, t0: time, until: time + (gr.sec || K.sec), got: 0, hits: [], wrong: -9, reset: -9, done: 0, gone: 0, loc: g.loc };
    }
    if (!con) return;
    if (con.loc !== g.loc && !con.done) { con = null; return; }
    if (!con.done && !con.gone && (time > con.until || !ni)) con.gone = time;
    if (con.done && !con.dropped && K.reward !== 'boost' && time - con.done > 0.65) { con.dropped = true; const gem = GG.sim.conDiamond(); con.landAt = gem && gem.x !== undefined ? { x: gem.x, y: gem.y } : null; if (gem && GG.ui.syncGem) GG.ui.syncGem(); }
    if ((con.gone && time - con.gone > 1.2) || (con.done && time - con.done > 2.4)) con = null;
  }
  R.conClick = function (wx, wy) {
    if (!con || con.done || con.gone) return false;
    const pts = conWorld(), s = visSc();
    let at = -1, best = 20 * s;
    pts.forEach((p, i) => { const d = Math.hypot(wx - p.x, wy - p.y); if (d < best) { best = d; at = i; } });
    if (at < 0) return false;
    const reset = con.gr.wrong === 'reset';
    if (at === con.got) {
      con.hits[at] = conClock; con.got++;
      if (con.got === pts.length) { con.done = conClock; if (C.constellation.reward === 'boost') conWin(pts); }
    } else if (reset && con.got > 0) { con.got = 0; con.hits = []; con.reset = conClock; }
    else if (at > con.got) con.wrong = conClock;
    return true;
  };
  function conWin(pts) {
    const b = GG.sim.conPrize(con.gr.prize);
    if (!b) return;
    GG.audio.play('conDone');
    const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cy = pts.reduce((a, p) => a + p.y, 0) / pts.length, at = conPage(cx, cy);
    setTimeout(() => { if (GG.ui.savedFly) GG.ui.savedFly(b, at); }, 550);
  }

  R.conState = function () {
    if (!con || con.done || con.gone) return null;
    return { id: con.gr.id, got: con.got, n: con.gr.stars.length, left: Math.max(0, con.until - conClock),
             sec: con.gr.sec || C.constellation.sec, prize: C.constellation.reward === 'boost' ? con.gr.prize : null, pts: conWorld() };
  };
  function drawCon(time) {
    conClock = time;
    stepCon(time);
    if (!con) return;
    const pts = conWorld(), s = visSc(), gr = con.gr, cl = v => Math.max(0, Math.min(1, v)), eo = u => 1 - Math.pow(1 - u, 3);
    const fadeIn = cl((time - con.t0) / 1.2);
    const fadeOut = con.gone ? cl(1 - (time - con.gone) / 1.2) : con.done ? cl(1 - (time - con.done - 1.2) / 1.2) : 1;
    const k = fadeIn * fadeOut; if (!k) return;
    const resetAge = time - con.reset, redK = resetAge < 0.5 ? 1 - resetAge / 0.5 : 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    gr.lines.forEach(([a, b]) => {
      const A = pts[a], B = pts[b], lit = con.got > a && con.got > b;
      if (lit) {
        const from = a > b ? A : B, to = a > b ? B : A, u = cl((time - con.hits[Math.max(a, b)]) / 0.25);
        ctx.strokeStyle = 'rgba(255,228,150,' + (0.85 * k) + ')'; ctx.lineWidth = 1.8 * s; ctx.shadowColor = '#ffe39a'; ctx.shadowBlur = 8 * s;
        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(from.x + (to.x - from.x) * u, from.y + (to.y - from.y) * u); ctx.stroke(); ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = redK ? 'rgba(255,120,110,' + ((0.2 + 0.4 * redK) * k) + ')' : 'rgba(190,205,255,' + (0.2 * k) + ')';
        ctx.lineWidth = 1 * s; ctx.setLineDash([2.5 * s, 6 * s]);
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.setLineDash([]);
      }
    });
    pts.forEach((p, i) => {
      const lit = i < con.got, next = i === con.got && !con.done && !con.gone;
      const ring = next && gr.hint !== 'soft', soft = next && gr.hint === 'soft';
      const tw = (0.75 + 0.25 * Math.sin(time * 5 + i * 1.7)) * (soft ? 1.22 + 0.08 * Math.sin(time * 3) : 1);
      const shake = (next && time - con.wrong < 0.35 ? Math.sin((time - con.wrong) * 60) * 3 * s : 0) + (redK ? Math.sin(resetAge * 70 + i) * 2.5 * s * redK : 0);
      const x = p.x + shake, r = (lit ? 6 : 4.5) * s * tw;
      const halo = ctx.createRadialGradient(x, p.y, 0, x, p.y, r * 3.2);
      halo.addColorStop(0, lit ? 'rgba(255,236,170,' + (0.75 * k) + ')' : redK ? 'rgba(255,150,140,' + (0.6 * k) + ')'
        : soft ? 'rgba(255,241,200,' + (0.8 * k) + ')' : 'rgba(210,222,255,' + (0.5 * k) + ')');
      halo.addColorStop(1, 'rgba(210,222,255,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, p.y, r * 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = k; ctx.fillStyle = lit ? '#fff4c8' : '#eef3ff'; starShape(x, p.y, r, time * 0.6 + i); ctx.globalAlpha = 1;
      if (ring) {
        const u = (time * 1.2) % 1;
        ctx.strokeStyle = 'rgba(255,241,184,' + (0.75 * (1 - u) * k) + ')'; ctx.lineWidth = 1.6 * s;
        ctx.beginPath(); ctx.arc(x, p.y, (8 + 15 * u) * s, 0, Math.PI * 2); ctx.stroke();
      }
    });
    if (con.done && con.landAt) {
      const age = time - con.done, cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cy = pts.reduce((a, p) => a + p.y, 0) / pts.length, L = con.landAt;
      if (age > 0.65 && age < 1.6) {
        const u = cl((age - 0.65) / 0.45), hx = cx + (L.x - cx) * eo(u), hy = cy + (L.y - cy) * eo(u);
        const g = ctx.createLinearGradient(cx, cy, hx, hy);
        g.addColorStop(0, 'rgba(255,236,170,0)'); g.addColorStop(1, 'rgba(255,236,170,' + (0.9 * (1 - cl((age - 1.1) / 0.5))) + ')');
        ctx.strokeStyle = g; ctx.lineWidth = 2.5 * s; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.fillStyle = '#fff8dc'; starShape(hx, hy, 6 * s, time * 4);
      }
    }
    ctx.restore();
  }

  const petMist = [], petFloats = [], petAt = {};
  let petLoc = null;
  function petReset() { petMist.length = 0; petFloats.length = 0; Object.keys(petAt).forEach(k => delete petAt[k]); GG.sim.petAcc = {}; }
  function drawPetMist(time) {
    const Sm = GG.sim;
    if (petLoc !== S.g.loc) { petLoc = S.g.loc; petReset(); }
    const s = visSc();
    Sm.petGrounds().forEach(g => {
      const box = S.siteBox(g);
      if (Math.random() < 0.55) petMist.push({ x: g.x + (Math.random() - 0.5) * box.w * 0.9, y: g.y + (Math.random() - 0.3) * box.h * 0.6,
        r: (14 + Math.random() * 22) * s, t0: time, life: 2.2 + Math.random() * 1.4, vx: (Math.random() - 0.5) * 8 * s, sp: Math.random() < 0.15 });
      if (petAt[g.id] === undefined) petAt[g.id] = time;
      if (time - petAt[g.id] >= (C.petrichor.floatSec || 1.6)) {
        petAt[g.id] = time;
        const v = Sm.petAcc[g.id] || 0; Sm.petAcc[g.id] = 0;
        if (v > 0) petFloats.push({ x: g.x, y: g.y - box.h * 0.15, v: v, t0: time });
      }
    });
    if (!petMist.length) return;
    ctx.save();
    for (let i = petMist.length - 1; i >= 0; i--) {
      const m = petMist[i], age = time - m.t0; if (age > m.life || age < 0) { petMist.splice(i, 1); continue; }
      const u = age / m.life, a = Math.sin(u * Math.PI), x = m.x + m.vx * age, y = m.y - age * 16 * s, r = m.r * (0.8 + 0.6 * u);
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(190,255,220,' + (0.22 * a) + ')'); gr.addColorStop(1, 'rgba(190,255,220,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      if (m.sp) { ctx.globalAlpha = a; ctx.fillStyle = '#eafff2'; starShape(x, y, 3 * s, time * 3); ctx.globalAlpha = 1; }
    }
    ctx.restore();
  }
  function drawPetFloats(time) {
    if (!petFloats.length) return;
    const s = visSc();
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 ' + (14 * s) + 'px Inter, sans-serif';
    for (let i = petFloats.length - 1; i >= 0; i--) {
      const f = petFloats[i], u = (time - f.t0) / 1.8; if (u >= 1 || u < 0) { petFloats.splice(i, 1); continue; }
      ctx.globalAlpha = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85;
      ctx.fillStyle = '#62d4e3'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 3 * s;
      ctx.fillText('+' + GG.util.small(f.v) + ' CI', f.x, f.y - u * 26 * s);
    }
    ctx.restore();
  }

  function coreCol(h) {
    const a = [240, 192, 74], b = [255, 138, 50], c = [255, 72, 56], k = Math.max(0, Math.min(1, h));
    const m = (x, y, f) => Math.round(x + (y - x) * f), t = k < 0.6 ? k / 0.6 : (k - 0.6) / 0.4, A = k < 0.6 ? a : b, B = k < 0.6 ? b : c;
    return 'rgb(' + m(A[0], B[0], t) + ',' + m(A[1], B[1], t) + ',' + m(A[2], B[2], t) + ')';
  }
  const coreClock = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  function coreReactors() { return S.machinesHere().filter(n => { const t = S.type(n); return t && t.fission; }); }
  function drawCoreWaves(time) {
    const Sm = GG.sim;
    if (!Sm.coreOn || !Sm.coreOn()) return;
    const u = Math.max(1, 0.6 / S.g.camera.scale);
    coreReactors().forEach(n => {
      const h = n.coreHeat || 0;
      if (h < 0.5 || !Sm.coreActive(n)) return;
      const b = visBox(n), k = (h - 0.5) / 0.5;
      ctx.save(); ctx.lineWidth = 1.6 * u; ctx.lineCap = 'round'; ctx.strokeStyle = coreCol(h);
      for (let i = 0; i < 3; i++) {
        const p = ((time * 0.45) + i / 3) % 1, x0 = n.x + (i - 1) * b.w * 0.22, y0 = b.y - 4 * u - p * 34 * u;
        ctx.globalAlpha = (0.2 + 0.5 * k) * Math.sin(p * Math.PI);
        ctx.beginPath();
        for (let q = 0; q <= 10; q++) { const yy = y0 - q * 1.8 * u, xx = x0 + Math.sin(q * 0.8 + time * 3 + i) * 2.6 * u; q ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.stroke();
      }
      ctx.restore();
    });
  }
  function drawCore(time) {
    const Sm = GG.sim;
    if (!Sm.coreOn || !Sm.coreOn()) return;
    const L = (C.prism && C.prism.look) || {}, ch = L.crystal || 16, red = 'rgb(255,72,56)';
    coreReactors().forEach(n => {
      const b = visBox(n), cool = Sm.coreCoolLeft(n);
      if (cool > 0) {
        if (!prismPaths) prismPaths = ((IC.paths || {}).prism || []).map(d => new Path2D(d));
        if (prismPaths.length) {
          const k = ch / 20; ctx.save(); ctx.translate(b.x + 20 - 12 * k, b.y - 2 - 12 * k); ctx.scale(k, k);
          ctx.fillStyle = 'rgba(20,22,30,0.95)'; ctx.fill(prismPaths[0]);
          ctx.strokeStyle = 'rgba(255,72,56,0.85)'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          prismPaths.forEach(q => ctx.stroke(q)); ctx.restore();
        }
        if (C.prismCore.meltLook === 'mark') {
          const txt = GG.i18n.t('ui.meltdown') + ' ' + coreClock(cool);
          ctx.save(); ctx.font = '700 8.5px ' + FONT_UI;
          const w = ctx.measureText(txt).width + 26, h = 16, px = b.x + b.w - 12 - w, py = b.y - h - 5, cy = py + h / 2;
          ctx.fillStyle = 'rgba(255,72,56,.18)'; roundRect(px, py, w, h, 8); ctx.fill();
          ctx.strokeStyle = 'rgba(255,72,56,.55)'; ctx.lineWidth = 1; roundRect(px + 0.5, py + 0.5, w - 1, h - 1, 7.5); ctx.stroke();
          ctx.restore();
          statusMark(px + 9, cy, 4.5, red, true);
          ctx.save(); ctx.font = '700 8.5px ' + FONT_UI; ctx.fillStyle = red; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(txt, px + w / 2 + 5, cy + 0.5); ctx.restore();
          return;
        }
        const f = cool / C.prismCore.cooldownSec;
        ctx.save(); roundRect(b.x, b.y, b.w, b.h, 12); ctx.clip();
        ctx.fillStyle = 'rgba(255,72,56,.18)'; ctx.fillRect(b.x, b.y, b.w, 3);
        ctx.fillStyle = red; ctx.fillRect(b.x, b.y, b.w * f, 3); ctx.restore();
        const cx = b.x + 38, cy = b.y - 2, r = 5;
        ctx.save(); ctx.strokeStyle = red; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.55); ctx.lineTo(cx, cy); ctx.lineTo(cx + r * 0.45, cy + r * 0.2); ctx.stroke();
        ctx.fillStyle = red; ctx.font = '600 9.5px ' + FONT_MONO; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(coreClock(cool), b.x + 47, b.y - 1.5); ctx.restore();
        return;
      }
      const h = n.coreHeat || 0;
      if (!(n.prisms > 0) && !(h > 0.005)) return;
      const on = Sm.coreActive(n), col = coreCol(h);
      visChip(n, Math.round(h * 100) + '%  ' + (on ? coreClock((1 - h) * Sm.coreMeltSec()) : '\u2193'), h, 1, col, 1, true, col);
    });
  }

  function drawMoonlight(time) {
    const Sm = GG.sim, u = Math.max(1, 0.6 / S.g.camera.scale);
    S.machinesHere().forEach(n => {
      if (n.type !== 'solarPanel' || !Sm.moonOn(n)) return;
      const ni = Sm.nightAt(n), f = ni ? ni.frac : 0;
      const k = Math.max(0, Math.min(1, f / 0.1)) * Math.max(0, Math.min(1, (1 - f) / 0.08));
      if (k <= 0) return;
      const b = visBox(n), ph = time % 3.6, sw = 1.6;
      if (ph < sw) {
        const pr = ph / sw, e = pr * pr * (3 - 2 * pr), x = b.x + b.w * (-0.3 + 1.6 * e), fa = Math.sin(Math.PI * pr);
        ctx.save(); roundRect(b.x, b.y, b.w, b.h, 10); ctx.clip();
        const gr = ctx.createLinearGradient(x - b.w * 0.2, b.y, x + b.w * 0.2, b.y + b.h);
        gr.addColorStop(0, 'rgba(200,215,255,0)'); gr.addColorStop(0.5, 'rgba(215,228,255,' + (0.26 * k * fa) + ')'); gr.addColorStop(1, 'rgba(200,215,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.restore();
      }
      ctx.save(); ctx.strokeStyle = 'rgba(200,215,255,' + (0.55 * k) + ')'; ctx.lineWidth = 2 * u; ctx.shadowColor = '#c8d6ff'; ctx.shadowBlur = 12;
      roundRect(b.x - 2 * u, b.y - 2 * u, b.w + 4 * u, b.h + 4 * u, 11); ctx.stroke(); ctx.restore();
    });
  }

  function drawGolden(time) {
    const Sm = GG.sim, win = Sm.stat('solarPanel', 'goldSec'), u = Math.max(1, 0.6 / S.g.camera.scale);
    S.machinesHere().forEach(n => {
      if (n.type !== 'solarPanel') return;
      const g = Sm.goldPhase(n); if (g === null) return;
      const k = Math.max(0, Math.min(1, g / 2.5)) * Math.max(0, Math.min(1, (win - g) / 3));
      const b = visBox(n), ph = time % 3.2, sw = 1.4;
      if (ph < sw) {
        const pr = ph / sw, e = pr * pr * (3 - 2 * pr), x = b.x + b.w * (-0.3 + 1.6 * e), fa = Math.sin(Math.PI * pr);
        ctx.save(); roundRect(b.x, b.y, b.w, b.h, 10); ctx.clip();
        const gr = ctx.createLinearGradient(x - b.w * 0.2, b.y, x + b.w * 0.2, b.y + b.h);
        gr.addColorStop(0, 'rgba(255,215,130,0)'); gr.addColorStop(0.5, 'rgba(255,225,150,' + (0.34 * k * fa) + ')'); gr.addColorStop(1, 'rgba(255,215,130,0)');
        ctx.fillStyle = gr; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.restore();
      }
      ctx.save(); ctx.strokeStyle = 'rgba(255,200,97,' + (0.6 * k) + ')'; ctx.lineWidth = 2 * u; ctx.shadowColor = '#ffc861'; ctx.shadowBlur = 12;
      roundRect(b.x - 2 * u, b.y - 2 * u, b.w + 4 * u, b.h + 4 * u, 11); ctx.stroke(); ctx.restore();
      visChip(n, 'x' + (C.goldHour.mul || 1), 1 - g / win, k, '#ffc861', 1, true);
    });
  }

  R.particles = [];
  R.burst = function (wx, wy, opts) {
    opts = opts || {};
    const n = opts.count || 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (opts.speed || 60) * (0.35 + Math.random() * 0.9);
      R.particles.push({
        x: wx + (Math.random() - 0.5) * (opts.spread || 10),
        y: wy + (Math.random() - 0.5) * (opts.spread || 10),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.lift || 40),
        life: 0, max: (opts.life || 0.75) * (0.6 + Math.random() * 0.7),
        size: (opts.size || 3) * (0.5 + Math.random()),
        color: opts.color || '#8de3b4',
      });
    }
    if (R.particles.length > 400) R.particles.splice(0, R.particles.length - 400);
  };

  R.siteBurst = function (site, wx, wy, planting) {

    const box = S.siteBox(site), cfg = C.swipe;
    if (cfg.bits && cfg.bits.enabled) return siteBits(site, box, wx, wy, planting);
    const main = planting ? '#7ff0b0' : '#8de3b4';
    R.burst(wx, wy, { color: main, count: 6, speed: 70, lift: 45, spread: 16 });
    for (let i = 0; i < (cfg.puffs || 0); i++) {
      R.burst(site.x + (Math.random() - 0.5) * box.w * cfg.puffSpread,
              site.y + (Math.random() - 0.5) * box.h * cfg.puffSpread,
              { color: main, count: 4, speed: 55, lift: 38, spread: 24, size: 2.6 });
    }
    R.burst(wx, wy, { color: '#62d4e3', count: 4, speed: 45, lift: 60, size: 2 });
  };

  R.bits = [];
  function siteBits(site, box, wx, wy, planting) {
    const B = C.swipe.bits, rnd = (a, b) => a + Math.random() * (b - a);
    const clamp = (x, y) => ({
      x: Math.max(site.x - box.w / 2 + B.inset, Math.min(site.x + box.w / 2 - B.inset, x)),
      y: Math.max(site.y - box.h / 2 + B.inset + 14, Math.min(site.y + box.h / 2 - B.inset, y)) });
    const piece = function (at, small) {
      const a = rnd(-Math.PI * 0.85, -Math.PI * 0.15), sp = rnd(70, 150) * (small ? 0.75 : 1);
      const p = { x: at.x + rnd(-6, 6), y: at.y + rnd(-4, 4), vx: Math.cos(a) * sp * 0.75,
                  vy: Math.sin(a) * sp, rot: rnd(0, 6), age: 0 };
      if (planting) Object.assign(p, { k: 'leaf', spin: rnd(-7, 7), life: rnd(0.8, 1.2),
        size: rnd(0.9, 1.3) * (small ? 0.85 : 1), g: 150, col: B.leaves[Math.floor(Math.random() * B.leaves.length)] });
      else Object.assign(p, { k: 'chip', spin: rnd(-9, 9), life: rnd(0.6, 0.95),
        size: rnd(2.2, 4.2) * (small ? 0.8 : 1), g: 320, col: B.trash[Math.floor(Math.random() * B.trash.length)],
        shape: [rnd(0.6, 1), rnd(0.6, 1), rnd(0.6, 1), rnd(0.6, 1)] });
      R.bits.push(p);
    };
    const speck = function (at) {
      R.bits.push({ k: 'dot', x: at.x, y: at.y, vx: rnd(-40, 40), vy: rnd(-90, -40), age: 0,
        life: rnd(0.4, 0.6), size: rnd(1.2, 1.8), col: planting ? B.soil : B.speck, g: planting ? 260 : 60 });
    };
    const at = clamp(wx, wy);
    for (let i = 0; i < B.near; i++) piece(at, false);
    for (let i = 0; i < B.specks; i++) speck(at);
    for (let f = 0; f < B.far; f++) {
      const a = rnd(0, Math.PI * 2), d = rnd(B.farMin, B.farMax);
      const there = clamp(wx + Math.cos(a) * d, wy + Math.sin(a) * d);
      for (let i = 0; i < B.farEach; i++) piece(there, true);
    }
    if (R.bits.length > 400) R.bits.splice(0, R.bits.length - 400);
  }
  function stepBits(dt) {
    for (let i = R.bits.length - 1; i >= 0; i--) {
      const p = R.bits[i];
      p.age += dt;
      if (p.age >= p.life) { R.bits.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt;
      p.vx *= 1 - 1.2 * dt;
      if (p.spin) p.rot += p.spin * dt;
    }
  }
  function drawBits() {
    for (const p of R.bits) {
      const f = p.age / p.life;
      ctx.save(); ctx.translate(p.x, p.y);
      if (p.k === 'chip') {
        ctx.globalAlpha = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3;
        ctx.rotate(p.rot);
        const r = p.size, q = p.shape;
        ctx.fillStyle = 'rgba(' + p.col + ',0.95)';
        ctx.beginPath(); ctx.moveTo(-r * q[0], -r * 0.6); ctx.lineTo(r * q[1], -r * 0.7 * q[2]);
        ctx.lineTo(r * q[2], r * 0.6); ctx.lineTo(-r * 0.8 * q[3], r * 0.7); ctx.closePath(); ctx.fill();
      } else if (p.k === 'leaf') {
        ctx.globalAlpha = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3;
        ctx.rotate(p.rot); ctx.scale(p.size, p.size);
        ctx.fillStyle = 'rgba(' + p.col + ',0.85)';
        ctx.beginPath(); ctx.ellipse(0, 0, 4.2, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.swipe.bits.vein; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.stroke();
      } else {
        ctx.globalAlpha = 1 - f;
        ctx.fillStyle = 'rgba(' + p.col + ',0.9)';
        ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  R.waves = [];
  R.ringSec = function () { return C.siteFx.ring.on ? C.siteFx.ring.sec : 0; };
  R.wave = function (site, wx, wy) {
    const F = C.siteFx;
    R.waves.push({ site: site, x: wx, y: wy, t: 0,
                   max: Math.max(R.ringSec(), F.dent.sec, F.flow.sec) });
    if (R.waves.length > 8) R.waves.shift();
  };
  function wavesOn(site) {
    const out = [];
    for (const w of R.waves) if (w.site === site) out.push(w);
    return out;
  }

  function dentAmp(w) {
    const D = C.siteFx.dent;
    const k = w.t / D.sec;
    if (k >= 1 || D.depth <= 0) return 0;
    return D.depth * Math.exp(-D.decay * k) * Math.cos(k * D.wobble);
  }

  function outlinePoints(x, y, w, h, r, step) {
    const pts = [], x2 = x + w, y2 = y + h;
    function edge(ax, ay, bx, by, nx, ny) {
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
      for (let i = 0; i < n; i++) {
        const k = i / n;
        pts.push({ x: ax + (bx - ax) * k, y: ay + (by - ay) * k, nx: nx, ny: ny });
      }
    }
    function corner(cx, cy, a0, a1) {
      const n = Math.max(2, Math.round(Math.abs(a1 - a0) * r / step));
      for (let i = 0; i < n; i++) {
        const a = a0 + (a1 - a0) * (i / n);
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r,
                   nx: -Math.cos(a), ny: -Math.sin(a) });
      }
    }
    edge(x + r, y, x2 - r, y, 0, 1);
    corner(x2 - r, y + r, -Math.PI / 2, 0);
    edge(x2, y + r, x2, y2 - r, -1, 0);
    corner(x2 - r, y2 - r, 0, Math.PI / 2);
    edge(x2 - r, y2, x + r, y2, 0, -1);
    corner(x + r, y2 - r, Math.PI / 2, Math.PI);
    edge(x, y2 - r, x, y + r, 1, 0);
    corner(x + r, y + r, Math.PI, Math.PI * 1.5);
    return pts;
  }

  function spanSteps(w, d) {
    const n = Math.max(1, Math.ceil(w / d)), out = [];
    for (let i = 0; i <= n; i++) out.push(Math.min(w, i * d));
    return out;
  }
  function sitePath(s, box, ws) {
    const x = s.x - box.w / 2, y = s.y - box.h / 2;
    let live = null;
    for (const w of ws) {
      const a = dentAmp(w);
      if (Math.abs(a) < 0.05) continue;
      (live || (live = [])).push({ x: w.x, y: w.y, a: a });
    }
    if (!live) { roundRect(x, y, box.w, box.h, 18); return; }

    const reach = C.siteFx.dent.reach, two = 2 * reach * reach;
    const pts = outlinePoints(x, y, box.w, box.h, 18, 6);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      let push = 0;
      for (const d of live) {
        const dx = p.x - d.x, dy = p.y - d.y;
        push += d.a * Math.exp(-(dx * dx + dy * dy) / two);
      }
      const px = p.x + p.nx * push, py = p.y + p.ny * push;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  function flowSurf(ws, px) {
    const F = C.siteFx.flow;
    let d = 0;
    for (const w of ws) {
      const k = w.t / F.sec;
      if (k >= 1) continue;
      const dist = Math.abs(px - w.x);
      d += F.surfAmp * (1 - k) * Math.exp(-dist / F.surfLen) *
           Math.sin(dist / F.surfWave - w.t * F.speed * Math.PI);
    }
    return d;
  }

  function rockLook(s) {
    const L = C.asteroid && C.asteroid.look;
    if (!L || !L.enabled || !s || s.type !== 'meteorite') return null;
    return (L.kinds || {})[s.rare || 'common'] || (L.kinds || {}).common || null;
  }
  function rkHash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
  function rkRng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let q = Math.imul(seed ^ seed >>> 15, 1 | seed);
    q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; }; }
  const rkR = (r, a, b) => a + r() * (b - a), rkCl = v => Math.max(0, Math.min(1, v)), rkEase = v => { v = rkCl(v); return v * v * (3 - 2 * v); };

  function rockRim(x, y, w, h, rk) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 60, y - 60, w + 120, h + 120); roundRect(x + w, y, -w, h, 14); ctx.clip('evenodd');
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = 'rgba(12,9,6,' + (0.45 / (i + 1)).toFixed(3) + ')'; ctx.lineWidth = 6 + i * 6;
      ctx.beginPath(); roundRect(x - 3 - i * 3, y - 3 - i * 3, w + 6 + i * 6, h + 6 + i * 6, 16 + i * 3); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(' + rk.rim + ',0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 2, y + h * 0.6); ctx.lineTo(x - 2, y + 12); ctx.quadraticCurveTo(x - 2, y - 2, x + 12, y - 2);
    ctx.lineTo(x + w * 0.6, y - 2); ctx.stroke();
    ctx.restore();
  }

  function rockGlints(s, x, y, w, h, frac, time, rk) {
    const G = rk.glint;
    if (!G || frac <= 0) return;
    const top = y + h * (1 - frac) + 6;
    if (y + h - 4 - top <= 2) return;
    ctx.save();
    ctx.beginPath(); roundRect(x + 4, top, w - 8, y + h - 4 - top, 10); ctx.clip();
    const r = rkRng(rkHash('fl' + s.id));
    for (let i = 0; i < (G.n || 10); i++) {
      const px = x + rkR(r, 0.06, 0.94) * w, py = y + rkR(r, 0.1, 0.95) * h, ph = rkR(r, 0, 6.3), sp = rkR(r, 0.6, 1.4);
      const k = Math.max(0, Math.sin(time * sp + ph));
      if (k < 0.3) continue;
      const sz = (G.size || 4) * (0.4 + 0.6 * k);
      ctx.fillStyle = 'rgba(' + G.rgb + ',' + (0.85 * k).toFixed(3) + ')';
      ctx.beginPath(); ctx.moveTo(px, py - sz); ctx.quadraticCurveTo(px, py, px + sz, py); ctx.quadraticCurveTo(px, py, px, py + sz);
      ctx.quadraticCurveTo(px, py, px - sz, py); ctx.quadraticCurveTo(px, py, px, py - sz); ctx.fill();
    }
    ctx.restore();
  }

  R.rockMarks = [];
  R.rockPuffs = [];
  const rockPuffed = new WeakSet();
  function drawRockMarks(dt) {
    const L = C.asteroid && C.asteroid.look, sec = (L && L.scorchSec) || 10;
    for (let i = R.rockMarks.length - 1; i >= 0; i--) {
      const m = R.rockMarks[i]; m.t += dt;
      if (m.t >= sec) { R.rockMarks.splice(i, 1); continue; }
      if (m.loc !== S.g.loc) continue;
      const k = 1 - m.t / sec, cx = m.x, cy = m.y;
      const gr = ctx.createRadialGradient(cx, cy, m.h * 0.45, cx, cy, m.w * 0.85);
      gr.addColorStop(0, 'rgba(18,12,8,' + (0.6 * k).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(18,12,8,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(cx, cy, m.w * 0.85, m.h * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawRockPuffs(dt) {
    for (let i = R.rockPuffs.length - 1; i >= 0; i--) {
      const p = R.rockPuffs[i]; p.t += dt;
      if (p.t >= 1.4) { R.rockPuffs.splice(i, 1); continue; }
      if (p.loc !== S.g.loc) continue;
      const r = rkRng(rkHash('pf' + p.id)), k = rkEase(p.t / 1.2), fade = 1 - rkCl((p.t - 0.4) / 1.0);
      for (let j = 0; j < 22; j++) {
        const a = rkR(r, 0, Math.PI * 2), d = rkR(r, 0.15, 0.55) * p.w * k, rr = rkR(r, 6, 14) * (0.5 + k);
        const px = p.x + Math.cos(a) * d, py = p.y + Math.sin(a) * d * 0.6 - k * rkR(r, 10, 30);
        ctx.fillStyle = 'rgba(' + p.dust + ',' + (0.35 * fade).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(px, py, rr, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function rockChips(f, rk, lt) {
    if (lt < 0 || lt >= 1.6) return;
    const b = S.siteBox(f.site), r = rkRng(rkHash('ch' + f.site.id)), k = rkCl(lt / 0.6), fade = 1 - rkCl((lt - 1.0) / 0.6);
    ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = rk.chip;
    for (let i = 0; i < 12; i++) {
      const a = rkR(r, 0, Math.PI * 2), d = rkR(r, 0.6, 1.0) * b.w * 0.62, sz = rkR(r, 2, 4);
      const px = f.x + Math.cos(a) * d * rkEase(k), py = f.y + Math.sin(a) * d * 0.72 * rkEase(k) - Math.sin(k * Math.PI) * 26;
      ctx.beginPath(); ctx.moveTo(px - sz, py); ctx.lineTo(px, py - sz * 0.8); ctx.lineTo(px + sz, py + sz * 0.2); ctx.lineTo(px - sz * 0.2, py + sz * 0.7);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  R.falls = [];
  R.rockFall = function (site) {
    const A = C.asteroid || {}, F = A.fall || {};
    if (!F.enabled || !site) return;
    const dur = (typeof F.sec === 'number' ? F.sec : A.hitDelaySec) || 1.4;
    const tail = Math.max(F.flash ? F.flash.sec : 0.5, rockLook(site) ? 1.6 : 0);
    R.falls.push({ site: site, x: site.x, y: site.y, loc: site.loc,
                   t: 0, hit: dur, max: dur + tail });
    if (R.falls.length > 6) R.falls.shift();
  };

  function fallOf(site) {
    for (const f of R.falls) if (f.site === site) return f;
    return null;
  }

  function stepFalls(dt) {
    const F = (C.asteroid || {}).fall || {};
    for (let i = R.falls.length - 1; i >= 0; i--) {
      const f = R.falls[i], was = f.t;
      f.t += dt;

      if (was < f.hit && f.t >= f.hit) {
        if (rockLook(f.site)) {
          const b = S.siteBox(f.site);
          R.rockMarks.push({ x: f.x, y: f.y, w: b.w, h: b.h, loc: f.loc, t: 0 });
        } else {
          const d = F.dust || {};
          R.burst(f.x, f.y, { color: d.color || '#cbbb96', count: d.count || 30,
                              speed: d.speed || 165, lift: d.lift || 55,
                              life: d.life || 1.15, size: d.size || 3.4, spread: 26 });
        }
      }
      if (f.t >= f.max) R.falls.splice(i, 1);
    }
  }

  function drawFalls() {
    const A = C.asteroid || {}, F = A.fall || {};
    if (!F.enabled || !R.falls.length) return;
    const st = F.streak || {}, fl = F.flash || {};
    for (const f of R.falls) {
      if (f.loc && f.loc !== S.g.loc) continue;
      const rk = rockLook(f.site), look = C.asteroid.look || {};
      if (rk) rockChips(f, rk, f.t - f.hit);
      if (f.t < f.hit) {

        const k = f.t / f.hit, e = k * k;
        const from = F.from || 1000, tilt = (F.tilt || 0) * from;
        const hx = f.x - tilt * (1 - e), hy = f.y - from * (1 - e);
        const len = st.len || 120;

        const dx = tilt, dy = from, m = Math.hypot(dx, dy) || 1;
        const tx = hx - (dx / m) * len, ty = hy - (dy / m) * len;
        ctx.save();
        ctx.lineCap = 'round';
        const col = rk ? rk.streak[0] : (st.color || '#ffe6b8'), glow = rk ? rk.streak[1] : (st.glow || '#ff8a3d');
        const g = ctx.createLinearGradient(tx, ty, hx, hy);
        g.addColorStop(0, rk ? 'rgba(0,0,0,0)' : 'rgba(255,138,61,0)');
        g.addColorStop(1, col);
        ctx.strokeStyle = g;
        ctx.lineWidth = st.w || 6;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.fillStyle = col;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(hx, hy, (st.head || 9) * (0.55 + 0.45 * e), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        const k = (f.t - f.hit) / (fl.sec || 0.5);
        if (k >= 1) continue;
        ctx.save();
        ctx.globalAlpha = (1 - k) * 0.85;
        ctx.strokeStyle = 'rgba(' + (rk ? rk.ring : (fl.color || '255,206,140')) + ',1)';
        ctx.lineWidth = 5 * (1 - k) + 1;
        ctx.beginPath(); ctx.arc(f.x, f.y, (rk ? (look.ringR || 140) : (fl.r || 210)) * k, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }
  }

  R.rockets = [];
  R.smoke = [];
  R.smoke2 = [];
  R.parts2 = [];
  R.scrap2 = [];
  let rocketSeen = {}, rocketG = null;

  R.rocketFx = function (at, kind, fuel) {
    const F = C.rocketFx || {};
    if (!F.enabled || !at || !S.g) return null;

    if (!fuel && at.id && GG.sim.rocketFuel) {
      try { fuel = GG.sim.rocketFuel(at).res; } catch (e) { fuel = null; }
    }
    const rec = { id: at.id || null, x: at.x, y: at.y, loc: at.loc || S.g.loc, kind: kind,
                  t: 0, max: kind === 'land' ? (F.landSec || 3.6) : (F.launchSec || 5),
                  touched: false, puff: 0, spark: 0, fuel: fuel || null };
    R.rockets = R.rockets.filter(r => !(r.id && r.id === rec.id));
    R.rockets.push(rec);
    const snd = (F.sound || {})[kind];
    if (snd && GG.audio) GG.audio.play(snd);
    return rec;
  };

  R.rocketHeard = function (n, kind) {
    const F = C.rocketFx || {};
    if (!F.enabled || !n || !S.g || !(F.sound || {})[kind]) return false;
    return (n.loc || C.locations[0].id) === S.g.loc;
  };

  function padOf(r) {
    const n = r.id ? S.node(r.id) : null;
    if (n) return { x: n.x, y: n.y - S.sizeOf(n).h / 2 };
    return { x: r.x, y: r.y };
  }

  function rocketPose(r) {
    const F = C.rocketFx || {}, p = padOf(r);
    if (r.kind === 'launch') {
      const ig = F.igniteSec || 1;
      if (r.t < ig) {
        const k = r.t / ig;
        return { x: p.x + (F.shake || 0) * (0.4 + 0.6 * k) * (Math.random() * 2 - 1),
                 y: p.y, flame: k, alpha: Math.min(1, r.t / 0.2), pad: p, low: true };
      }
      const u = (r.t - ig) / Math.max(0.01, r.max - ig);
      return { x: p.x, y: p.y - (F.rise || 1500) * Math.pow(u, 2.2), flame: 1 + 0.4 * u,
               alpha: u > 0.75 ? Math.max(0, 1 - (u - 0.75) / 0.25) : 1, pad: p, low: u < 0.25 };
    }
    const ta = (F.touchAt || 0.78) * r.max;
    if (r.t < ta) {
      const k = r.t / ta;
      return { x: p.x, y: p.y - (F.from || 950) * Math.pow(1 - k, 2.4), flame: 0.45 + 0.75 * k,
               alpha: Math.min(1, k / 0.12), pad: p, low: k > 0.7 };
    }
    const k2 = (r.t - ta) / Math.max(0.01, r.max - ta);
    return { x: p.x, y: p.y, flame: Math.max(0, 1 - k2 * 4), alpha: Math.max(0, 1 - k2), pad: p, low: true };
  }
  function puff(r, x, y, vx, vy, big) {
    const M = (C.rocketFx || {}).smoke || {}, AT = (C.rocketFx || {}).atomic || {};
    R.smoke.push({ x: x, y: y, vx: vx, vy: vy, loc: r.loc, t: 0,
                   color: atomOf(r) ? AT.smoke : null,
                   max: (M.life || 2.2) * (0.7 + Math.random() * 0.6),
                   r0: (M.size || 11) * (big ? 1.4 : 1) * (0.6 + Math.random() * 0.8) });
  }

  function atomOf(r) {
    const A = (C.rocketFx || {}).atomic || {}, res = r.fuel && C.resources[r.fuel];
    if (!A.enabled || !res || !res.radioactive || !res.color) return null;
    const h = res.color.replace('#', '');
    return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)).join(',');
  }
  function stepRockets(dt) {
    const F = C.rocketFx || {};
    if (!F.enabled || !S.g) { R.rockets.length = 0; R.smoke.length = 0; R.smoke2.length = 0; R.parts2.length = 0; R.scrap2.length = 0; return; }
    if (rocketG !== S.g) { rocketG = S.g; rocketSeen = {}; R.rockets.length = 0; R.smoke.length = 0; R.smoke2.length = 0; R.parts2.length = 0; R.scrap2.length = 0; }
    S.machines().forEach(function (n) {
      const t = S.type(n);
      if (!t || !t.rocket) return;
      const fly = GG.sim.rocketLeft(n) > 0, was = rocketSeen[n.id];
      rocketSeen[n.id] = fly;
      if (was === undefined || was === fly) return;
      if ((n.loc || C.locations[0].id) !== S.g.loc) return;
      R.rocketFx(n, fly ? 'launch' : 'land');
    });
    const M = F.smoke || {}, D = F.dust || {}, s = F.size || 70;
    const v2 = rocketV2();
    for (let i = R.rockets.length - 1; i >= 0; i--) {
      const r = R.rockets[i];
      r.t += dt;
      if (r.t >= r.max || (r.id && !S.node(r.id))) { R.rockets.splice(i, 1); continue; }
      if (v2) { stepRocketV2(r, dt); continue; }
      const q = rocketPose(r);

      r.puff += dt * (M.perSec || 34) * (q.flame > 0.05 ? 1 : 0);
      while (r.puff >= 1) {
        r.puff -= 1;
        if (q.low) {
          const side = Math.random() < 0.5 ? -1 : 1;
          puff(r, q.pad.x + side * Math.random() * s * 0.2, q.pad.y - 2,
               side * (50 + Math.random() * 110), -(4 + Math.random() * 22), true);
        } else if (r.kind === 'launch') {
          puff(r, q.x + (Math.random() - 0.5) * 6, q.y + s * 0.18,
               (Math.random() - 0.5) * 24, 10 + Math.random() * 25, false);
        }
      }

      const atom = atomOf(r), AT = F.atomic || {}, SP = AT.spark || {};
      if (atom && q.flame > 0.05 && q.alpha > 0.05) {
        r.spark += dt * (AT.sparksPerSec || 45);
        while (r.spark >= 1) {
          r.spark -= 1;
          R.burst(q.x + (Math.random() - 0.5) * 8, q.y + s * 0.1,
                  { color: 'rgb(' + atom + ')', count: 1, speed: SP.speed || 110, lift: -30,
                    life: SP.life || 0.8, size: SP.size || 2.2, spread: 6 });
        }
      }

      if (r.kind === 'land' && !r.touched && r.t >= (F.touchAt || 0.78) * r.max) {
        r.touched = true;
        if (atom) R.burst(q.pad.x, q.pad.y, { color: 'rgb(' + atom + ')', count: AT.touchSparks || 22,
          speed: 200, lift: 60, life: 1, size: 2.4, spread: 20 });
        R.burst(q.pad.x, q.pad.y, { color: D.color || '#c9bea8', count: D.count || 34,
          speed: D.speed || 170, lift: D.lift || 30, life: D.life || 1.1, size: D.size || 3.2, spread: 30 });
        for (let k = 0; k < 14; k++) {
          const a = Math.PI + (k / 13) * Math.PI;
          puff(r, q.pad.x, q.pad.y - 2, Math.cos(a) * (90 + Math.random() * 60),
               Math.sin(a) * 18, true);
        }
      }
    }
    for (let i = R.smoke.length - 1; i >= 0; i--) {
      const p = R.smoke[i];
      p.t += dt;
      if (p.t >= p.max) { R.smoke.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= (1 - 1.3 * dt); p.vy *= (1 - 1.3 * dt);
      p.vy -= 9 * dt;
    }
    if (R.smoke.length > 280) R.smoke.splice(0, R.smoke.length - 280);
    stepRocketBits(dt);
  }

  function drawRocketShape(x, y, flame, alpha, accent, atom) {
    const s = ((C.rocketFx || {}).size || 70) / 70;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (flame > 0.02) {
      const L = (16 + 30 * flame) * (0.85 + Math.random() * 0.3);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, 0, 0, L);
      if (atom) {
        g.addColorStop(0, 'rgba(245,255,245,0.95)');
        g.addColorStop(0.3, 'rgba(' + atom + ',0.9)');
        g.addColorStop(0.7, 'rgba(' + atom + ',0.5)');
        g.addColorStop(1, 'rgba(' + atom + ',0)');
      } else {
        g.addColorStop(0, 'rgba(255,252,235,0.95)');
        g.addColorStop(0.3, 'rgba(255,209,102,0.9)');
        g.addColorStop(0.7, 'rgba(255,122,61,0.55)');
        g.addColorStop(1, 'rgba(255,90,40,0)');
      }
      ctx.fillStyle = g;
      ctx.shadowColor = atom ? 'rgb(' + atom + ')' : '#ff8a3d';
      ctx.shadowBlur = 22;
      const w = 5.5 + 2 * Math.min(1, flame);
      ctx.beginPath();
      ctx.moveTo(-w, 0);
      ctx.quadraticCurveTo(-w - 1.5, L * 0.45, 0, L);
      ctx.quadraticCurveTo(w + 1.5, L * 0.45, w, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    const line = '#8f9bab';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

    ctx.fillStyle = accent;
    [-1, 1].forEach(function (d) {
      ctx.beginPath();
      ctx.moveTo(11 * d, -8); ctx.lineTo(21 * d, 1); ctx.lineTo(21 * d, -9); ctx.lineTo(11 * d, -27);
      ctx.closePath(); ctx.fill();
    });

    ctx.fillStyle = '#5d6672';
    ctx.beginPath();
    ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(4.5, -8); ctx.lineTo(-4.5, -8);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#e8ecf1'; ctx.strokeStyle = line;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-11, -52, 22, 45, 4); else ctx.rect(-11, -52, 22, 45);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = accent;
    ctx.fillRect(-11, -20, 22, 4);

    ctx.beginPath();
    ctx.moveTo(-11, -51);
    ctx.quadraticCurveTo(-10, -62, 0, -70);
    ctx.quadraticCurveTo(10, -62, 11, -51);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#243447';
    ctx.beginPath(); ctx.arc(0, -36, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(-1.6, -37.6, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function rgb3(rgb, a) { return 'rgba(' + rgb + ',' + (+a).toFixed(3) + ')'; }
  function rocketV2() { return ((C.rocketFx || {}).style || 'v1') === 'v2'; }

  function wob(t, s) {
    return Math.sin(t * 13.1 + s) * 0.5 + Math.sin(t * 29.7 + s * 2.3) * 0.3 + Math.sin(t * 57.3 + s * 4.1) * 0.2;
  }
  function flameRGB(atom) {
    return atom ? { core: '240,255,242', mid: atom, out: atom, lit: atom }
                : { core: '255,250,232', mid: '255,196,92', out: '255,112,52', lit: '255,160,80' };
  }
  function poseV2(r) {
    const F = C.rocketFx || {}, p = padOf(r), ig = F.igniteSec || 1;
    let o;
    if (r.kind === 'launch') {
      if (r.t < ig) {
        const lit = Math.max(0, (r.t - 0.45) / Math.max(0.01, ig - 0.45));
        o = { dx: (F.shake || 0) * 0.55 * lit * wob(r.t, r.seed), dy: 0, flame: Math.pow(lit, 0.8), alpha: 1,
              legs: 1, low: true, squash: 0.6 * lit, heat: lit };
      } else {
        const u = (r.t - ig) / Math.max(0.01, r.max - ig);
        o = { dx: 0, dy: -(F.rise || 1500) * Math.pow(u, 2.2), flame: 1 + 0.45 * u,
              alpha: u > 0.75 ? Math.max(0, 1 - (u - 0.75) / 0.25) : 1,
              legs: Math.max(0, 1 - Math.max(0, u - 0.12) / 0.1), low: u < 0.2, squash: 0, heat: 1 };
      }
    } else {
      const ta = (F.touchAt || 0.78) * r.max;
      if (r.t < ta) {
        const k = r.t / ta, e = Math.min(1, Math.max(0, (k - 0.45) / 0.35));
        o = { dx: 0, dy: -(F.from || 950) * Math.pow(1 - k, 2.4), flame: 0.5 + 0.8 * Math.pow(k, 1.6),
              alpha: Math.min(1, k / 0.12), legs: e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2,
              low: k > 0.72, squash: 0, heat: 1 };
      } else {
        const k2 = (r.t - ta) / Math.max(0.01, r.max - ta);
        const dip = Math.sin(Math.min(1, k2 * 3) * Math.PI) * 2.2 * (1 - k2);
        o = { dx: 0, dy: dip, flame: Math.max(0, 1 - k2 * 5),
              alpha: k2 < 0.55 ? 1 : Math.max(0, 1 - (k2 - 0.55) / 0.45),
              legs: 1, low: true, squash: dip * 0.5, heat: Math.max(0, 1 - k2 * 0.9) };
      }
    }
    o.x = p.x + o.dx; o.y = p.y + o.dy; o.pad = p;
    return o;
  }
  function smoke2(r, o) {
    R.smoke2.push(Object.assign({ t: 0, rot: Math.random() * 6.28, loc: r.loc }, o));
  }
  function part2(r, o) {
    R.parts2.push(Object.assign({ t: 0, loc: r.loc }, o));
  }
  function stepRocketV2(r, dt) {
    const F = C.rocketFx || {}, sc = (F.size || 70) / 70, AT = F.atomic || {};
    if (r.seed === undefined) { r.seed = Math.random() * 100; r.vent = 0; r.cut = -1; }
    const q = poseV2(r), p = q.pad, atom = atomOf(r);
    const smokeRgb = atom ? (AT.smoke || '150,215,165') : '196,200,206';

    if (r.kind === 'launch' && r.t < 0.9) {
      r.vent += dt * 26;
      while (r.vent >= 1) {
        r.vent -= 1;
        const d = Math.random() < 0.5 ? -1 : 1;
        smoke2(r, { x: p.x + d * 11 * sc, y: p.y + (-40 + Math.random() * 4) * sc, vx: d * (30 + Math.random() * 40),
                    vy: 12 + Math.random() * 20, r0: 3 + Math.random() * 2, grow: 16, max: 0.9 + Math.random() * 0.6,
                    rgb: '235,240,246', a: 0.55, lit: 0 });
      }
    }

    if (r.kind === 'launch' && r.t >= 0.44 && r.t - dt < 0.44) {
      for (let i = 0; i < 26; i++) {
        const a = Math.PI * (0.05 + Math.random() * 0.9);
        part2(r, { x: p.x + (Math.random() - 0.5) * 8, y: p.y + 4, vx: Math.cos(a) * (60 + Math.random() * 160) * (Math.random() < 0.5 ? -1 : 1),
                   vy: -Math.sin(a) * (20 + Math.random() * 60), max: 0.5 + Math.random() * 0.5, size: 1.6,
                   rgb: atom || '255,190,90', glow: 1 });
      }
    }

    r.puff += dt * (q.low ? 42 : 26) * Math.min(1.2, q.flame) * (q.flame > 0.06 ? 1 : 0);
    while (r.puff >= 1) {
      r.puff -= 1;
      if (q.low) {
        const d = Math.random() < 0.5 ? -1 : 1;
        smoke2(r, { x: p.x + d * Math.random() * 10, y: p.y - 3 - Math.random() * 4, vx: d * (70 + Math.random() * 150),
                    vy: -(2 + Math.random() * 16), r0: 7 + Math.random() * 7, grow: 30 + Math.random() * 22,
                    max: 2.2 + Math.random() * 1.4, rgb: smokeRgb, a: 0.42, lit: 1 });
      } else if (r.kind === 'launch') {
        smoke2(r, { x: q.x + (Math.random() - 0.5) * 5, y: q.y + (F.size || 70) * 0.3 + Math.random() * 10,
                    vx: (Math.random() - 0.5) * 18, vy: 12 + Math.random() * 18, r0: 4 + Math.random() * 3,
                    grow: 18 + Math.random() * 12, max: 1.6 + Math.random() * 0.9, rgb: smokeRgb,
                    a: 0.42 * q.alpha, lit: 0.6 });
      }
    }

    if (q.flame > 0.08 && q.alpha > 0.05) {
      r.spark += dt * (atom ? 60 : 14) * Math.min(1, q.flame);
      while (r.spark >= 1) {
        r.spark -= 1;
        const a = Math.PI / 2 + (Math.random() - 0.5) * 1.1;
        part2(r, { x: q.x + (Math.random() - 0.5) * 6, y: q.y + 12 + Math.random() * 14,
                   vx: Math.cos(a) * (40 + Math.random() * 90), vy: Math.sin(a) * (40 + Math.random() * 110),
                   max: 0.45 + Math.random() * 0.6, size: atom ? 1.8 : 1.3, rgb: atom || '255,176,90', glow: 1, trail: 1 });
      }
    }

    if (r.kind === 'land' && !r.touched && r.t >= (F.touchAt || 0.78) * r.max) {
      r.touched = true;
      for (let k = 0; k < 22; k++) {
        const d = k % 2 ? 1 : -1;
        smoke2(r, { x: p.x + d * Math.random() * 12, y: p.y - 2, vx: d * (90 + Math.random() * 130), vy: -(4 + Math.random() * 14),
                    r0: 8 + Math.random() * 6, grow: 34 + Math.random() * 20, max: 1.8 + Math.random() * 1.2,
                    rgb: '201,190,168', a: 0.55, lit: 0.5 });
      }
      for (let i = 0; i < 40; i++) {
        const a = Math.PI * (1 + Math.random());
        part2(r, { x: p.x + (Math.random() - 0.5) * 30, y: p.y - 1, vx: Math.cos(a) * (60 + Math.random() * 170),
                   vy: Math.sin(a) * (30 + Math.random() * 90), max: 0.7 + Math.random() * 0.6, size: 2.2,
                   rgb: '201,190,168', grav: 1 });
      }
      if (atom) for (let i = 0; i < 28; i++) {
        const a = Math.PI * (1 + Math.random());
        part2(r, { x: p.x, y: p.y - 2, vx: Math.cos(a) * (80 + Math.random() * 180), vy: Math.sin(a) * (40 + Math.random() * 110),
                   max: 0.8 + Math.random() * 0.6, size: 1.9, rgb: atom, glow: 1, trail: 1 });
      }
    }

    const SC = F.scrap || {};
    if (r.kind === 'land' && r.touched && !r.dropped && SC.enabled &&
        r.t >= (F.touchAt || 0.78) * r.max + (SC.delay || 0)) {
      r.dropped = true;
      const side = r.seed % 2 < 1 ? 1 : -1, bx = p.x + side * (SC.side || 40) * sc;
      R.scrap2.push({ x: bx, y: p.y, loc: r.loc, t: 0, max: (SC.sec || 5), seed: r.seed, side: side });
      if (R.scrap2.length > 6) R.scrap2.shift();
    }

    if (r.kind === 'land' && r.touched && r.cut < 0 && q.flame <= 0) {
      r.cut = r.t;
      for (let i = 0; i < 6; i++) smoke2(r, { x: p.x + (Math.random() - 0.5) * 8, y: p.y - 4, vx: (Math.random() - 0.5) * 40,
        vy: -(10 + Math.random() * 16), r0: 5, grow: 20, max: 1.4, rgb: '230,234,240', a: 0.4, lit: 0 });
    }
  }
  function stepRocketBits(dt) {
    for (let i = R.smoke2.length - 1; i >= 0; i--) {
      const p = R.smoke2[i];
      p.t += dt;
      if (p.t >= p.max) { R.smoke2.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= (1 - 1.5 * dt); p.vy *= (1 - 1.2 * dt);
      p.vy -= 10 * dt; p.rot += dt * 0.4;
    }
    if (R.smoke2.length > 320) R.smoke2.splice(0, R.smoke2.length - 320);
    for (let i = R.parts2.length - 1; i >= 0; i--) {
      const p = R.parts2[i];
      p.t += dt;
      if (p.t >= p.max) { R.parts2.splice(i, 1); continue; }
      p.px = p.x; p.py = p.y;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += (p.grav ? 240 : 70) * dt; p.vx *= (1 - 1.4 * dt);
    }
    if (R.parts2.length > 400) R.parts2.splice(0, R.parts2.length - 400);
    for (let i = R.scrap2.length - 1; i >= 0; i--) {
      const b = R.scrap2[i];
      const was = b.t; b.t += dt;
      if (b.t >= b.max) { R.scrap2.splice(i, 1); continue; }

      if (was < 0.22 && b.t >= 0.22) {
        for (let k = 0; k < 8; k++) {
          const d = k % 2 ? 1 : -1;
          R.smoke2.push({ t: 0, rot: Math.random() * 6.28, loc: b.loc, x: b.x + d * 6, y: b.y - 2,
            vx: d * (40 + Math.random() * 60), vy: -(3 + Math.random() * 8), r0: 4, grow: 16,
            max: 1 + Math.random() * 0.6, rgb: '201,190,168', a: 0.45, lit: 0 });
        }
      }
    }
  }

  function softPuff(x, y, rad, rgb, a, rot) {
    for (let i = 0; i < 3; i++) {
      const ang = rot + i * 2.1, ox = Math.cos(ang) * rad * 0.28, oy = Math.sin(ang) * rad * 0.2, rr = rad * (0.8 + 0.12 * i);
      const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rr);
      g.addColorStop(0, rgb3(rgb, a * 0.55)); g.addColorStop(0.6, rgb3(rgb, a * 0.3)); g.addColorStop(1, rgb3(rgb, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + ox, y + oy, rr, 0, 6.2832); ctx.fill();
    }
  }
  function plumeV2(q, r, atom, T) {
    if (q.flame <= 0.02) return;
    const c = flameRGB(atom), f = q.flame, sd = r.seed || 0;
    const L = (18 + 34 * f) * (1 + 0.08 * wob(T, sd)), w = 5 + 2.4 * Math.min(1, f);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [[1.35, 1.9, c.out, 0.28], [1.0, 1.25, c.mid, 0.55], [0.55, 0.62, c.core, 0.95]].forEach(function (l, i) {
      const len = L * l[0], ww = w * l[1], col = l[2], al = l[3];
      const g = ctx.createLinearGradient(0, 0, 0, len);
      g.addColorStop(0, rgb3(col, al)); g.addColorStop(0.55, rgb3(col, al * 0.55)); g.addColorStop(1, rgb3(col, 0));
      ctx.fillStyle = g;
      const b1 = wob(T * 1.3 + i, sd + i) * ww * 0.18, b2 = wob(T * 1.7 + i * 2, sd - i) * ww * 0.18;
      ctx.beginPath(); ctx.moveTo(-ww * 0.72, 0);
      ctx.bezierCurveTo(-ww * 1.1 + b1, len * 0.3, -ww * 0.55 + b2, len * 0.75, 0, len);
      ctx.bezierCurveTo(ww * 0.55 - b1, len * 0.75, ww * 1.1 - b2, len * 0.3, ww * 0.72, 0);
      ctx.closePath(); ctx.fill();
    });
    if (f > 0.75) {
      const k = Math.min(1, (f - 0.75) / 0.3);
      for (let i = 0; i < 3; i++) {
        const y = 6 + i * (L * 0.17), rr = (w * 0.42) * (1 - i * 0.22);
        ctx.fillStyle = rgb3(c.core, 0.6 * k * (1 - i * 0.25));
        ctx.beginPath(); ctx.moveTo(0, y - rr * 1.3); ctx.lineTo(rr, y); ctx.lineTo(0, y + rr * 1.3); ctx.lineTo(-rr, y);
        ctx.closePath(); ctx.fill();
      }
    }
    const gl = ctx.createRadialGradient(0, 4, 0, 0, 4, 34 + 16 * f);
    gl.addColorStop(0, rgb3(c.mid, 0.35 * Math.min(1, f))); gl.addColorStop(1, rgb3(c.mid, 0));
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 4, 34 + 16 * f, 0, 6.2832); ctx.fill();
    ctx.restore();
  }

  function hullV2(q, accent, atom) {
    const legs = q.legs, heat = q.heat || 0, c = flameRGB(atom), line = '#8f9bab';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    [-1, 1].forEach(function (d) {
      const hipX = 8 * d, hipY = -17, footX = (11 + 13 * legs) * d, footY = -22 + 26 * legs - q.squash;
      const kneeX = (10 + 7 * legs) * d, kneeY = -10 + 5 * legs;
      ctx.strokeStyle = '#4c5563'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(kneeX, kneeY); ctx.lineTo(footX, footY); ctx.stroke();
      ctx.strokeStyle = '#8b95a3'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hipX, hipY + 6); ctx.lineTo(kneeX, kneeY); ctx.stroke();
      if (legs > 0.2) { ctx.fillStyle = '#5d6672'; ctx.beginPath(); ctx.ellipse(footX, footY, 3.8 * legs, 1.4, 0, 0, 6.2832); ctx.fill(); }
    });
    ctx.fillStyle = '#5d6672';
    ctx.beginPath(); ctx.moveTo(-7.2, 0); ctx.lineTo(7.2, 0); ctx.lineTo(4.6, -9); ctx.lineTo(-4.6, -9); ctx.closePath(); ctx.fill();
    if (heat > 0.02) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgb3(atom || '255,120,60', 0.55 * heat);
      ctx.beginPath(); ctx.moveTo(-7.2, 0); ctx.lineTo(7.2, 0); ctx.lineTo(6.2, -3.5); ctx.lineTo(-6.2, -3.5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    [-1, 1].forEach(function (d) {
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.moveTo(10.5 * d, -7); ctx.lineTo(21 * d, 2); ctx.lineTo(22 * d, -7);
      ctx.quadraticCurveTo(18 * d, -18, 10.5 * d, -30); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgb3(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    });
    ctx.fillStyle = '#e8ecf1'; ctx.strokeStyle = line; ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-11, -52, 22, 44, 3); else ctx.rect(-11, -52, 22, 44);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgb3(70,80,94,0.55)'; ctx.lineWidth = 0.8;
    [-31, -42].forEach(function (y) { ctx.beginPath(); ctx.moveTo(-11, y); ctx.lineTo(11, y); ctx.stroke(); });
    ctx.fillStyle = accent; ctx.fillRect(-11, -24, 22, 4.5); ctx.fillRect(-11, -50.5, 22, 2.2);
    ctx.fillStyle = 'rgb3(60,68,80,0.55)';
    for (let i = -8; i <= 8; i += 4) {
      ctx.beginPath(); ctx.arc(i, -31, 0.55, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(i, -42, 0.55, 0, 6.2832); ctx.fill();
    }
    ctx.strokeStyle = accent; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-3, -14); ctx.lineTo(0, -11); ctx.lineTo(3, -14); ctx.stroke();
    ctx.fillStyle = '#e8ecf1'; ctx.strokeStyle = line; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-11, -51.5); ctx.bezierCurveTo(-11, -61, -6, -67, 0, -72);
    ctx.bezierCurveTo(6, -67, 11, -61, 11, -51.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.moveTo(-3.2, -68.4); ctx.quadraticCurveTo(0, -73.5, 3.2, -68.4); ctx.quadraticCurveTo(0, -69.6, -3.2, -68.4); ctx.fill();
    ctx.fillStyle = '#5c6674'; ctx.beginPath(); ctx.arc(0, -37, 5.6, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#243447'; ctx.beginPath(); ctx.arc(0, -37, 4.4, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgb3(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-1.7, -38.8, 1.5, 1, -0.6, 0, 6.2832); ctx.fill();
    if (q.flame > 0.05) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgb3(c.lit, 0.16 * Math.min(1, q.flame)); ctx.fillRect(-11, -24, 22, 17);
      ctx.restore();
    }
  }
  function drawRocketsV2(T) {
    const loc = S.g.loc, sc = ((C.rocketFx || {}).size || 70) / 70;
    const rt = C.nodeTypes.rocket, accent = (rt && C.iconColor) ? C.iconColor(rt) : '#ff7eb6';
    const here = R.rockets.filter(function (r) { return r.loc === loc; })
      .map(function (r) { return { r: r, q: poseV2(r), atom: atomOf(r) }; });

    for (const p of R.smoke2) {
      if (p.loc !== loc) continue;
      const k = p.t / p.max, rad = p.r0 + p.grow * Math.sqrt(k), a = p.a * (1 - k) * (k < 0.08 ? k / 0.08 : 1);
      softPuff(p.x, p.y, rad, p.rgb, a, p.rot);
      if (!p.lit) continue;
      let near = 0, lit = null;
      here.forEach(function (h) {
        if (h.q.flame <= 0.05 || h.q.alpha <= 0.1) return;
        const v = Math.max(0, 1 - Math.hypot((p.x - h.q.x) * 0.5, p.y - h.q.y) / 120);
        if (v > near) { near = v; lit = flameRGB(h.atom).lit; }
      });
      if (near > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        softPuff(p.x, p.y + rad * 0.2, rad * 0.8, lit, a * 0.28 * near * p.lit, p.rot);
        ctx.restore();
      }
    }
    here.forEach(function (h) {
      const q = h.q, c = flameRGB(h.atom);
      if (q.low && q.flame > 0.05) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gl = ctx.createRadialGradient(q.pad.x, q.pad.y, 0, q.pad.x, q.pad.y, 64);
        gl.addColorStop(0, rgb3(c.lit, 0.26 * Math.min(1, q.flame) * q.alpha)); gl.addColorStop(1, rgb3(c.lit, 0));
        ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(q.pad.x, q.pad.y, 64, 18, 0, 0, 6.2832); ctx.fill();
        const near = Math.max(0, 1 + q.dy / 60);
        if (near > 0) {
          const fw = (30 + 40 * Math.min(1.2, q.flame)) * near;
          const fan = ctx.createLinearGradient(q.x - fw, 0, q.x + fw, 0);
          fan.addColorStop(0, rgb3(c.out, 0)); fan.addColorStop(0.5, rgb3(c.mid, 0.42 * near)); fan.addColorStop(1, rgb3(c.out, 0));
          ctx.fillStyle = fan; ctx.beginPath(); ctx.ellipse(q.x, q.pad.y - 1, fw, 2.5 + 1.5 * q.flame, 0, 0, 6.2832); ctx.fill();
        }
        ctx.restore();
      }
      ctx.save(); ctx.globalAlpha = q.alpha; ctx.translate(q.x, q.y); ctx.scale(sc, sc);
      plumeV2(q, h.r, h.atom, T);
      hullV2(q, accent, h.atom);
      ctx.restore();
    });
    drawScrap2(sc, T);

    for (const p of R.parts2) {
      if (p.loc !== loc) continue;
      const k = 1 - p.t / p.max;
      if (p.glow) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        if (p.trail && p.px !== undefined) {
          ctx.strokeStyle = rgb3(p.rgb, 0.7 * k); ctx.lineWidth = p.size;
          ctx.beginPath(); ctx.moveTo(p.px - (p.x - p.px) * 2, p.py - (p.y - p.py) * 2); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        ctx.fillStyle = rgb3(p.rgb, 0.9 * k); ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + 0.6 * k), 0, 6.2832); ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = rgb3(p.rgb, 0.85 * k); ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + 0.7 * k), 0, 6.2832); ctx.fill();
      }
    }
  }

  function drawScrap2(sc, T) {
    const SC = (C.rocketFx || {}).scrap || {}, s = sc * (SC.size || 1), loc = S.g.loc;
    for (const b of R.scrap2) {
      if (b.loc !== loc) continue;
      const fall = Math.min(1, b.t / 0.22), fade = SC.fade || 0.9;
      const a = b.t > b.max - fade ? Math.max(0, (b.max - b.t) / fade) : 1;
      const land = b.t - 0.22, sq = land > 0 && land < 0.3 ? Math.sin(land / 0.3 * Math.PI) * 0.12 : 0;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(b.x, b.y - 22 * s * (1 - fall * fall));
      ctx.scale(s * (1 + sq), s * (1 - sq));
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 3.2, 0, 0, 6.2832); ctx.fill();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';

      const sack = function () {
        ctx.beginPath();
        ctx.moveTo(-13, 0);
        ctx.bezierCurveTo(-19, -2, -19, -14, -9, -17);
        ctx.quadraticCurveTo(-3, -18, -1.6, -21);
        ctx.lineTo(1.6, -21);
        ctx.quadraticCurveTo(3, -18, 9, -17);
        ctx.bezierCurveTo(19, -14, 19, -2, 13, 0);
        ctx.closePath();
      };
      const chunk = function (pts, fill) {
        ctx.fillStyle = fill; ctx.strokeStyle = '#27313c'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      };

      ctx.save();
      sack(); ctx.fillStyle = '#3a4550'; ctx.fill(); ctx.clip();
      chunk([-17, 0, -16, -9, -8, -12, -4, -3, -8, 1], '#7d8894');
      chunk([1, 1, -1, -9, 7, -15, 17, -8, 15, 1], '#a3adb8');
      chunk([-9, -8, -5, -18, 4, -18, 5, -9], '#a0674a');
      chunk([-4, -3, -1, -9, 4, -7, 3, 1], '#c4ccd4');
      ctx.strokeStyle = '#5c6875'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(-14, -4); ctx.quadraticCurveTo(-13, -13, -6, -15); ctx.stroke();

      ctx.strokeStyle = 'rgba(206,186,138,0.75)'; ctx.lineWidth = 0.8;
      for (let d = -40; d <= 40; d += 7) {
        ctx.beginPath(); ctx.moveTo(d - 25, 3); ctx.lineTo(d + 5, -27); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(d + 25, 3); ctx.lineTo(d - 5, -27); ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(214,196,150,1)'; ctx.lineWidth = 1.3;
      sack(); ctx.stroke();
      ctx.fillStyle = 'rgba(214,196,150,1)';
      ctx.beginPath(); ctx.ellipse(0, -21.5, 2.6, 1.6, 0, 0, 6.2832); ctx.fill();
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.ellipse(0, -25, 2, 2.6, 0, 0, 6.2832); ctx.stroke();
      if (land > 0) {
        const g1 = Math.max(0, Math.sin(T * 3.1 + b.seed)), g2 = Math.max(0, Math.sin(T * 2.3 + b.seed * 1.7 + 2));
        [[8, -11, g1], [-9, -5, g2]].forEach(function (g) {
          if (g[2] < 0.6) return;
          const k = (g[2] - 0.6) / 0.4, r = 3.2 * k;
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * k).toFixed(3) + ')'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(g[0] - r, g[1]); ctx.lineTo(g[0] + r, g[1]);
          ctx.moveTo(g[0], g[1] - r); ctx.lineTo(g[0], g[1] + r); ctx.stroke();
        });
      }
      ctx.restore();
    }
  }

  function drawRockets(T) {
    const F = C.rocketFx || {};
    if (F.enabled && rocketV2()) {
      if (R.rockets.length || R.smoke2.length || R.parts2.length || R.scrap2.length) drawRocketsV2(T || 0);
      return;
    }
    if (!F.enabled || (!R.rockets.length && !R.smoke.length)) return;
    const M = F.smoke || {};

    for (const p of R.smoke) {
      if (p.loc !== S.g.loc) continue;
      const k = p.t / p.max;
      ctx.fillStyle = 'rgba(' + (p.color || M.color || '200,204,210') + ',' + (0.38 * (1 - k)).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r0 + (M.grow || 26) * k, 0, Math.PI * 2);
      ctx.fill();
    }
    const rt = C.nodeTypes.rocket;
    const accent = (rt && C.iconColor) ? C.iconColor(rt) : '#ff7eb6';
    for (const r of R.rockets) {
      if (r.loc !== S.g.loc) continue;
      const q = rocketPose(r), atom = atomOf(r), lit = atom || '255,170,80';

      if (q.low && q.flame > 0.05) {
        const gl = ctx.createRadialGradient(q.pad.x, q.pad.y, 0, q.pad.x, q.pad.y, 70);
        gl.addColorStop(0, 'rgba(' + lit + ',' + (0.35 * Math.min(1, q.flame) * q.alpha).toFixed(3) + ')');
        gl.addColorStop(1, 'rgba(' + lit + ',0)');
        ctx.fillStyle = gl;
        ctx.beginPath(); ctx.arc(q.pad.x, q.pad.y, 70, 0, Math.PI * 2); ctx.fill();
      }
      drawRocketShape(q.x, q.y, q.flame, q.alpha, accent, atom);
    }
  }

  function stepWaves(dt) {
    for (let i = R.waves.length - 1; i >= 0; i--) {
      R.waves[i].t += dt;
      if (R.waves[i].t >= R.waves[i].max) R.waves.splice(i, 1);
    }
  }

  function drawWaves() {
    if (!C.siteFx.ring.on) return;
    for (const w of R.waves) {

      const s = w.site, box = S.siteBox(s);

      const k = w.t / C.siteFx.ring.sec;
      if (k >= 1) continue;
      const reach = Math.hypot(box.w, box.h);
      ctx.save();
      sitePath(s, box, wavesOn(s)); ctx.clip();
      for (let ring = 0; ring < 2; ring++) {
        const rk = k - ring * 0.18;
        if (rk <= 0 || rk >= 1) continue;
        ctx.globalAlpha = (1 - rk) * 0.55;
        ctx.strokeStyle = '#bcd68c';
        ctx.lineWidth = 3 * (1 - rk) + 0.6;
        ctx.beginPath();
        ctx.arc(w.x, w.y, rk * reach, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  function stepParticles(dt) {
    stepBits(dt);
    for (let i = R.particles.length - 1; i >= 0; i--) {
      const p = R.particles[i];
      p.life += dt;
      if (p.life >= p.max) { R.particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 130 * dt;
      p.vx *= (1 - 1.6 * dt); p.vy *= (1 - 0.5 * dt);
    }
  }

  const demoFx = [];
  R.demolishFx = function (n) {
    const D = (C.ui || {}).demolishDust;
    if (!D || !D.enabled || !n) return;
    const t = S.type(n), sz = S.sizeOf(n), k = D.scale || 1.6, N = D.puffs || 34;
    const fx = { x: n.x, y: n.y, w: sz.w, h: sz.h, color: (t && t.color) || '#8aa0b8', loc: n.loc, age: 0, puffs: [] };
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random());
      fx.puffs.push({ x: n.x + Math.cos(a) * d * sz.w * 0.45, y: n.y + Math.sin(a) * d * sz.h * 0.45,
        vx: Math.cos(a) * (30 + Math.random() * 50) * k, vy: (Math.sin(a) * (20 + Math.random() * 30) - 12) * k,
        life: 0.8 + Math.random() * 0.5, age: 0, r: (4 + Math.random() * 6) * k });
    }
    demoFx.push(fx);
  };

  const cfx = [], tillDrain = new Map();
  const crnd = (a, b) => a + Math.random() * (b - a);
  R.collectFx = function (n, side, kind, color, amount) {
    const o = (C.ui || {}).collectFx;
    if (!o || !o.enabled || !n) return;
    const r = R.collectRect(n, side), k = o.amount || 1, N = v => Math.max(2, Math.round(v * k)), loc = n.loc;
    tillDrain.set(n.id + '|' + (side || ''), { from: amount || 0, age: 0 });
    const P = p => { p.loc = loc; p.life = p.life || 0; cfx.push(p); };
    if (kind === 'coins') for (let i = 0; i < N(11); i++) P({ k: 'coin', x: r.x + crnd(0.15, 0.85) * r.w, y: r.y + r.h / 2,
      vx: crnd(-70, 70), vy: crnd(-230, -150), floor: r.y, spin: crnd(0, 6), spinV: crnd(9, 16), max: crnd(0.9, 1.2), size: crnd(4.2, 5.6), color: color });
    else if (kind === 'fire') for (let i = 0; i < N(12); i++) P({ k: 'flick', x: r.x + crnd(0.1, 0.9) * r.w, y: r.y + r.h / 2,
      vx: crnd(-35, 35), vy: crnd(-175, -115), sway: crnd(0, 6), max: crnd(0.8, 1.15), size: crnd(4, 6.5), color: Math.random() < 0.55 ? '#ffb347' : '#ff7a3c' });
    else if (kind === 'leaves') for (let i = 0; i < N(12); i++) P({ k: 'leaf', x: r.x + crnd(0.1, 0.9) * r.w, y: r.y + r.h / 2,
      vx: crnd(-50, 50), vy: crnd(-170, -110), rot: crnd(0, 6), rotV: crnd(-5, 5), sway: crnd(0, 6), max: crnd(1.1, 1.5), size: crnd(4, 6),
      color: Math.random() < 0.5 ? '#7ee0a0' : '#62d4e3' });
    else if (kind === 'prisms' && o.prismLook) {

      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      P({ k: 'ring', x: cx, y: cy, max: 0.5, color: (C.currencies.prism || {}).color || '#c99bff' });
      for (let i = 0; i < N(6); i++) P({ k: 'prismBit', x: cx + crnd(-0.3, 0.3) * r.w, y: cy, life: -i * 0.04,
        vx: crnd(-70, 70), vy: crnd(-240, -150), rot: crnd(-0.3, 0.3), rotV: crnd(-2, 2), size: crnd(15, 21), max: crnd(0.95, 1.25) });
    }
    else {

      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, rb = kind === 'prisms' && C.prism ? C.prism.rainbow : null;
      const col = i => rb ? rb[i % rb.length] : color;
      P({ k: 'ring', x: cx, y: cy, max: 0.5, color: rb ? '#d77bff' : color });
      for (let i = 0; i < 3; i++) P({ k: 'star', x: cx + crnd(-r.w / 2.4, r.w / 2.4), y: cy + crnd(-18, 4), life: -i * 0.08, max: 0.55, size: crnd(7, 11), color: col(i * 2) });
      for (let i = 0; i < N(rb ? 12 : 9); i++) { const a = crnd(-Math.PI, 0), sp = crnd(80, 170);
        P({ k: 'shard', x: cx + crnd(-30, 30), y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, rot: crnd(0, 6), rotV: crnd(-8, 8), max: crnd(0.7, 1), size: crnd(3.5, 5), color: col(i) }); }
    }
    if (cfx.length > 500) cfx.splice(0, cfx.length - 500);
  };

  const hireFill = new Map();
  R.hireFx = function (n, from, to) {
    const o = (C.ui || {}).hireFx;
    if (!o || !o.enabled || !n) return;
    if (o.fill && to > from) hireFill.set(n.id, { from: from, to: to, age: 0 });
    if (o.workers > 0 && S.portsOf(n, 'out').some(p => p.id === 'wf')) {
      for (let i = 0; i < o.workers; i++) cfx.push({ k: 'man', n: n, loc: n.loc, life: -0.08 - i * 0.13, max: 0.85,
        fx0: (i + 1) / (o.workers + 1) + crnd(-0.04, 0.04), hop: crnd(0.8, 1.2) });
      cfx.push({ k: 'sock', n: n, loc: n.loc, life: -0.08 - 0.85, max: 0.6 });
    }
  };

  const sfx = [];

  let findPulse = null;
  R.findPulse = function (n, sec) { findPulse = n ? { id: n.id, t0: performance.now(), sec: sec || 2.4 } : null; };
  function drawFindPulse() {
    if (!findPulse) return;
    const k = (performance.now() - findPulse.t0) / (findPulse.sec * 1000);
    const n = k < 1 ? S.node(findPulse.id) : null;
    if (!n) { findPulse = null; return; }
    if (n.loc && n.loc !== S.g.loc) return;
    const sz = S.sizeOf(n), sc = S.g.camera.scale, g = (6 + 12 * k) / sc;
    const a = (1 - k) * (0.6 + 0.4 * Math.sin(k * Math.PI * 6));
    ctx.save();
    ctx.lineWidth = 3 / sc;
    ctx.strokeStyle = 'rgba(255,255,255,' + Math.max(0, a).toFixed(3) + ')';
    ctx.beginPath();
    ctx.roundRect(n.x - sz.w / 2 - g, n.y - sz.h / 2 - g, sz.w + g * 2, sz.h + g * 2, 10 + g);
    ctx.stroke();
    ctx.restore();
  }

  const prismRings = [];
  R.prismFx = function (n, big) { if (n) prismRings.push({ id: n.id, t0: performance.now(), big: !!big }); };
  function prismGrad(x0, y0, x1, y1, shift) {
    const cols = C.prism.rainbow, g = ctx.createLinearGradient(x0, y0, x1, y1);
    cols.forEach((c, i) => g.addColorStop(((i / cols.length) + shift) % 1, c));
    return g;
  }

  function prismUnder() { return ((C.prism || {}).look || {}).under !== false; }
  function prismRimKind() { return ((C.prism || {}).look || {}).rim || 'outline'; }

  function prismBar(n, t, x, y, sz, time) {
    const Sm = GG.sim, full = Sm.prismFull(n), share = Math.min(1, n.prisms / Sm.prismSlots(t));
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, sz.w, sz.h, 12); ctx.clip();
    ctx.globalAlpha = full ? 1 : 0.7;
    ctx.fillStyle = prismGrad(x, y, x + sz.w, y, full ? (time * 0.25) % 1 : 0);
    ctx.fillRect(x, y, sz.w * share, 3);
    ctx.restore();
  }
  function prismRim(n, t, x, y, sz, time) {
    const Sm = GG.sim, drop = GG.ui && GG.ui.prismDrop;
    if (n === drop) {
      ctx.strokeStyle = prismGrad(x, y, x + sz.w, y + sz.h, (time * 0.5) % 1);
      ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x - 9, y - 9, sz.w + 18, sz.h + 18, 15); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (n.prisms > 0 && Sm.prismCan(t) && prismRimKind() === 'outline') {
      const full = Sm.prismFull(n);
      ctx.globalAlpha = full ? 0.95 : 0.4;
      ctx.strokeStyle = prismGrad(x, y, x + sz.w, y + sz.h, full ? (time * 0.25) % 1 : 0);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x - 3, y - 3, sz.w + 6, sz.h + 6, 12); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  function prismEach(nRect, fn) {
    const drop = GG.ui && GG.ui.prismDrop;
    S.machinesHere().forEach(function (n) {
      if (!(n.prisms > 0) && n !== drop) return;
      if (nRect && !inRect(nRect, n.x, n.y)) return;
      const t = C.nodeTypes[n.type], sz = S.sizeOf(n);
      fn(n, t, n.x - sz.w / 2, n.y - sz.h / 2, sz);
    });
  }
  function drawPrismUnder(time, nRect) {
    const P = C.prism;
    if (!P || !P.enabled || !GG.sim.prismCan || !prismUnder()) return;
    prismEach(nRect, function (n, t, x, y, sz) { ctx.save(); prismRim(n, t, x, y, sz, time); ctx.restore(); });
  }
  let prismPaths = null;
  function prismCrystal(cx, cy, h, on, time, i) {
    if (!prismPaths) prismPaths = ((IC.paths || {}).prism || []).map(d => new Path2D(d));
    if (!prismPaths.length) return;
    const k = h / 20;
    ctx.save();
    ctx.translate(cx - 12 * k, cy - 12 * k); ctx.scale(k, k);
    if (on) {
      const sh = ((time || 0) * 0.35 + i * 0.13) % 1, cols = C.prism.rainbow;
      const g = ctx.createLinearGradient(7, 2, 17, 22);
      cols.forEach((c, j) => g.addColorStop(((j / cols.length) + sh) % 1, c));
      ctx.shadowColor = 'rgba(215,170,255,0.7)'; ctx.shadowBlur = 6;
      ctx.fillStyle = g; ctx.fill(prismPaths[0]);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    } else {
      ctx.fillStyle = 'rgba(20,22,30,0.95)'; ctx.fill(prismPaths[0]);
      ctx.strokeStyle = 'rgba(150,160,180,0.75)'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    }
    prismPaths.forEach(pth => ctx.stroke(pth));
    ctx.restore();
  }
  function drawPrismFx(time, nRect) {
    const P = C.prism, Sm = GG.sim;
    if (!P || !P.enabled || !Sm.prismCan) return;
    prismEach(nRect, function (n, t, x, y, sz) {
      ctx.save();
      if (!prismUnder()) prismRim(n, t, x, y, sz, time);
      if (n.prisms > 0 && Sm.prismCan(t)) {
        if (prismRimKind() === 'bar') prismBar(n, t, x, y, sz, time);
        const need = Sm.prismSlots(t), have = Math.min(need, n.prisms);
        const L = P.look || {}, h = L.crystal || 16, gap = L.gap || 12;
        for (let i = 0; i < need; i++) prismCrystal(x + 20 + i * gap, y - 2, h, i < have, time, i);
      }
      ctx.restore();
    });
    const now = performance.now();
    for (let i = prismRings.length - 1; i >= 0; i--) {
      const f = prismRings[i], L = f.big ? 1100 : 700, k = (now - f.t0) / L, n = S.node(f.id);
      if (k >= 1 || !n) { prismRings.splice(i, 1); continue; }
      if (n.loc && n.loc !== S.g.loc) continue;
      ctx.save();
      ctx.globalAlpha = 1 - k; ctx.lineWidth = f.big ? 3 : 2;
      ctx.strokeStyle = prismGrad(n.x - 100, n.y, n.x + 100, n.y, (time * 0.5) % 1);
      ctx.beginPath(); ctx.arc(n.x, n.y, 40 + (f.big ? 260 : 140) * k, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  function prismRowTag(n, t, r) {
    const P = C.prism, Sm = GG.sim;
    if (!P || !P.enabled || !Sm.prismFull || !Sm.prismFull(n) || !r.port) return null;
    if (r.kind === 'out') {
      if (r.port.virtual || r.port.id === 'pass') return null;
      if ((C.resources[r.port.res] || {}).flow !== 'material') return null;
      return P.outMul.toFixed(1) + 'x';
    }
    if (r.kind === 'in' && Sm.prismSupply(t).indexOf(r.port.res) >= 0) return P.drainMul.toFixed(1) + 'x';
    return null;
  }
  function prismRowText(txt, x, y) {
    const cols = C.prism.rainbow, w = ctx.measureText(txt).width;
    const sh = (performance.now() / 1000 * 0.45) % 1;
    const g = ctx.createLinearGradient(x - w * 0.5, 0, x + w * 1.5, 0);
    cols.forEach((c, j) => g.addColorStop(((j / cols.length) + sh) % 1, c));
    ctx.save();
    ctx.shadowColor = 'rgba(215,170,255,0.55)'; ctx.shadowBlur = 5;
    ctx.fillStyle = g; ctx.fillText(txt, x, y);
    ctx.restore();
  }

  R.startFx = function (n, kind, fuelRes) {
    const o = (C.ui || {}).startFx;
    if (!o || !o.enabled || !n) return false;
    const res = C.resources[fuelRes] || {}, atomic = !!res.radioactive;
    const P = (p, d) => { p.n = n; p.loc = n.loc; p.life = -(d || 0); sfx.push(p); };
    if (kind === 'fission') {
      const col = atomic ? res.color : '#e8c44b', fcol = res.color || '#e8c44b';
      const lag = o.fuelIn ? 0.55 : 0, port = fuelRes || 'rod';
      if (o.fuelIn) for (let i = 0; i < 3; i++) P({ k: 'rod', port: port, col: fcol, max: 0.55 }, i * 0.1);
      if (o.fill) P({ k: 'fill', col: col, max: 0.7 }, lag);
      if (o.core) { P({ k: 'core', col: col, max: 0.8 }, lag); P({ k: 'pulse', port: 'kw', col: col, max: 0.6 }, lag + 0.35); }
      if (o.steam) for (let i = 0; i < 9; i++)
        P({ k: 'steam', max: crnd(1.1, 1.6), fx0: crnd(0.1, 0.9), drift: crnd(-18, 18), size: crnd(5, 9) }, lag + i * 0.07);
    } else {
      const fl = atomic ? [res.color, '#c9ffd9'] : ['#ffd27a', '#ff9f5a'];
      const at = (C.rocketFx || {}).atomic || {};
      const smoke = atomic && at.smoke ? 'rgb(' + at.smoke + ')' : '#9aa3ad';
      if (o.fill) P({ k: 'flash', col: atomic ? res.color : '#ff9f5a', max: 0.75 });
      if (o.ignite) {
        for (let i = 0; i < 14; i++) P({ k: 'flame', max: crnd(0.45, 0.75), fx0: crnd(0.1, 0.9), vx: crnd(-25, 25),
          vy: crnd(110, 190), size: crnd(4, 7), col: Math.random() < 0.5 ? fl[0] : fl[1] }, crnd(0, 0.25));
        for (let i = 0; i < 10; i++) {
          const side = i % 2 ? 1 : -1;
          P({ k: 'smoke', max: crnd(1, 1.5), side: side, vx: side * crnd(40, 110), size: crnd(6, 11), col: smoke }, 0.12 + crnd(0, 0.3));
        }
        if (atomic) for (let i = 0; i < 10; i++) {
          const a = crnd(Math.PI * 0.15, Math.PI * 0.85), sp = crnd(70, 140);
          P({ k: 'spark', max: crnd(0.5, 0.8), fx0: crnd(0.2, 0.8), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, col: res.color }, crnd(0, 0.3));
        }
      }
      if (o.crew) for (let i = 0; i < 3; i++) P({ k: 'crew', max: 0.75, fx0: 0.25 + i * 0.25 + crnd(-0.04, 0.04), hop: crnd(0.8, 1.2) }, i * 0.12);
      if (o.ring) P({ k: 'ring', col: S.type(n).color || '#ff7eb6', max: 0.6 });
    }
    if (sfx.length > 400) sfx.splice(0, sfx.length - 400);
    return true;
  };
  function sfxEase(p) { p = Math.max(0, Math.min(1, p)); return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function sfxMan(x, y, u) {
    ctx.strokeStyle = '#8fc4ff'; ctx.shadowColor = 'rgba(98,170,255,.8)'; ctx.shadowBlur = 8;
    ctx.lineWidth = 1.9; ctx.lineCap = 'round'; ctx.fillStyle = 'rgba(18,28,44,.85)';
    ctx.beginPath(); ctx.arc(x, y - u * 0.55, u * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + u * 0.75, u * 0.78, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  }
  function drawStartFx(dt) {
    for (let i = sfx.length - 1; i >= 0; i--) {
      const f = sfx[i]; f.life += dt;
      if (f.life < 0) continue;
      if (f.life >= f.max || !S.node(f.n.id)) { sfx.splice(i, 1); continue; }
      if (f.loc && f.loc !== S.g.loc) continue;
      const p = f.life / f.max, age = f.life, n = f.n, b = R.collectRect(n), z = S.sizeOf(n);
      ctx.save();
      if (f.k === 'fill' || f.k === 'flash') {
        ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 6); ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        let q, k;
        if (f.k === 'flash') {
          if (p < 0.25) { ctx.fillStyle = 'rgba(255,240,250,' + (0.7 * (1 - p / 0.25)).toFixed(3) + ')'; ctx.fillRect(b.x, b.y, b.w, b.h); }
          q = Math.max(0, (p - 0.15) / 0.85); k = 1 - q;
        } else { q = p / 0.7; k = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3; }
        const head = b.x + b.w * sfxEase(q);
        const g = ctx.createLinearGradient(b.x, 0, Math.max(b.x + 1, head), 0);
        g.addColorStop(0, rgba(f.col, (0.06 * k).toFixed(3))); g.addColorStop(1, rgba(f.col, (0.58 * k).toFixed(3)));
        ctx.fillStyle = g; ctx.fillRect(b.x, b.y, head - b.x, b.h);
        ctx.fillStyle = 'rgba(255,246,225,' + (0.88 * k).toFixed(3) + ')'; ctx.fillRect(head - 1.5, b.y, 3, b.h);
      } else if (f.k === 'rod') {
        const s0 = R.portPos(n, 'in', f.port);
        if (s0) {
          const tx = b.x + b.w / 2, ty = b.y + b.h / 2, e = sfxEase(p);
          const x = s0.x + (tx - s0.x) * e, y = s0.y + (ty - s0.y) * e - Math.sin(Math.PI * e) * 18;
          ctx.globalAlpha = p > 0.85 ? (1 - p) / 0.15 : 1;
          ctx.fillStyle = f.col; ctx.shadowColor = f.col; ctx.shadowBlur = 10;
          ctx.translate(x, y); ctx.rotate(-0.5 + e * 0.5);
          ctx.beginPath(); ctx.roundRect(-2.5, -7, 5, 14, 2.5); ctx.fill();
        }
      } else if (f.k === 'core') {
        const cx = n.x - z.w / 2 + 24, cy = n.y - z.h / 2 + 24, e = 1 - Math.pow(1 - p, 2.4);
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 34);
        g.addColorStop(0, rgba(f.col, (0.55 * (1 - p)).toFixed(3))); g.addColorStop(1, rgba(f.col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = rgba(f.col, (0.85 * (1 - p)).toFixed(3)); ctx.lineWidth = 2; ctx.shadowColor = f.col; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(cx, cy, 10 + 40 * e, 0, Math.PI * 2); ctx.stroke();
      } else if (f.k === 'pulse') {
        const c = R.portPos(n, 'out', f.port);
        if (c) {
          ctx.strokeStyle = rgba(f.col, (0.9 * (1 - p)).toFixed(3)); ctx.lineWidth = 2; ctx.shadowColor = f.col; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(c.x, c.y, 6 + 18 * sfxEase(p), 0, Math.PI * 2); ctx.stroke();
        }
      } else if (f.k === 'steam') {
        ctx.globalAlpha = 0.45 * Math.min(1, p * 5) * (1 - p);
        ctx.fillStyle = '#e8f0f6'; ctx.beginPath();
        ctx.arc(b.x + b.w * f.fx0 + f.drift * p, b.y - 70 * (1 - Math.pow(1 - p, 2)), f.size * (0.6 + 1.4 * p), 0, Math.PI * 2); ctx.fill();
      } else if (f.k === 'flame') {
        const s = f.size * (1 - p * 0.6);
        ctx.globalAlpha = Math.min(1, (1 - p) * 2);
        ctx.translate(b.x + b.w * f.fx0 + f.vx * age, b.y + b.h + f.vy * age * (1 - p * 0.4)); ctx.rotate(Math.PI);
        ctx.fillStyle = f.col; ctx.beginPath(); ctx.moveTo(0, -s * 1.7);
        ctx.quadraticCurveTo(s * 1.05, -s * 0.2, 0, s); ctx.quadraticCurveTo(-s * 1.05, -s * 0.2, 0, -s * 1.7); ctx.fill();
        ctx.fillStyle = 'rgba(255,244,200,.85)'; ctx.beginPath(); ctx.ellipse(0, s * 0.25, s * 0.32, s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      } else if (f.k === 'smoke') {
        const x0 = f.side < 0 ? b.x + b.w * 0.2 : b.x + b.w * 0.8;
        ctx.globalAlpha = 0.5 * Math.min(1, p * 4) * (1 - p); ctx.fillStyle = f.col;
        ctx.beginPath(); ctx.arc(x0 + f.vx * (1 - Math.pow(1 - p, 2)) * 1.2, b.y + b.h + 26 - 14 * p, f.size * (0.7 + 1.6 * p), 0, Math.PI * 2); ctx.fill();
      } else if (f.k === 'spark') {
        ctx.globalAlpha = 1 - p; ctx.fillStyle = f.col; ctx.shadowColor = f.col; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(b.x + b.w * f.fx0 + f.vx * age, b.y + b.h + f.vy * age + 60 * age * age, 1.8, 0, Math.PI * 2); ctx.fill();
      } else if (f.k === 'crew') {
        const x0 = b.x + b.w * f.fx0, y0 = b.y + b.h / 2, x1 = n.x, y1 = n.y - z.h / 2 - 18;
        const e = sfxEase(p), q = 1 - e;
        const mx = (x0 + x1) / 2 + (x0 - x1) * 0.4, my = Math.min(y0, y1) - (30 + 24 * f.hop);
        const u = 10 * (p < 0.15 ? p / 0.15 : 1) * (p > 0.7 ? 1 - (p - 0.7) / 0.3 * 0.8 : 1);
        ctx.globalAlpha = p > 0.85 ? (1 - p) / 0.15 : 1;
        sfxMan(q * q * x0 + 2 * q * e * mx + e * e * x1, q * q * y0 + 2 * q * e * my + e * e * y1, u);
      } else if (f.k === 'ring') {
        const u = 1 - Math.pow(1 - p, 2);
        ctx.globalAlpha = 0.8 * (1 - p); ctx.strokeStyle = f.col; ctx.lineWidth = 2; ctx.shadowColor = f.col; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, 20 + u * 120, 6 + u * 30, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function hireShown(n) {
    const d = hireFill.get(n.id);
    if (!d) return null;
    const k = Math.min(1, d.age / 0.4), e = k * k * (3 - 2 * k);
    return { pct: d.from + (d.to - d.from) * e, from: d.from, glow: d.age < 0.55 ? 1 - Math.max(0, d.age - 0.4) / 0.15 : 0 };
  }

  function tillShown(n, side) {
    const d = tillDrain.get(n.id + '|' + (side || ''));
    if (!d) return null;
    const k = Math.min(1, d.age / 0.35);
    return { val: d.from * (1 - k * k * (3 - 2 * k)) + ((side === 'B' ? n.tillB : n.till) || 0), sweep: d.age < 0.4 ? d.age / 0.4 : -1 };
  }
  function cfxGem(x, y, r, rot, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(-r, -r * 0.35); ctx.lineTo(-r * 0.5, -r); ctx.lineTo(r * 0.5, -r); ctx.lineTo(r, -r * 0.35); ctx.lineTo(0, r); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.moveTo(-r * 0.5, -r); ctx.lineTo(0, -r * 0.35); ctx.lineTo(-r, -r * 0.35); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function cfxHire(p) {
    const n = p.n;
    if (!S.node(n.id)) { p.life = p.max; return; }
    const pp = R.portPos(n, 'out', 'wf'), u = p.life / p.max;
    ctx.save();
    ctx.strokeStyle = '#8fc4ff'; ctx.shadowColor = 'rgba(98,170,255,.8)';
    if (p.k === 'sock') {
      const e = 1 - Math.pow(1 - u, 2.2);
      ctx.globalAlpha = 0.9 * (1 - u); ctx.lineWidth = 2; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(pp.x, pp.y, 6 + 18 * e, 0, Math.PI * 2); ctx.stroke();
      ctx.restore(); return;
    }
    const r = R.collectRect(n);
    const x0 = r.x + r.w * p.fx0, y0 = r.y + r.h / 2;
    const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, q = 1 - e;
    const mx = (x0 + pp.x) / 2, my = Math.min(y0, pp.y) - (40 + 30 * p.hop);
    const x = q * q * x0 + 2 * q * e * mx + e * e * pp.x, y = q * q * y0 + 2 * q * e * my + e * e * pp.y;
    const s = 10 * (u < 0.15 ? u / 0.15 : 1) * (u > 0.75 ? 1 - (u - 0.75) / 0.25 * 0.6 : 1);
    ctx.globalAlpha = u > 0.85 ? (1 - u) / 0.15 : 1;
    ctx.lineWidth = 1.9; ctx.lineCap = 'round'; ctx.shadowBlur = 8; ctx.fillStyle = 'rgba(18,28,44,.85)';
    ctx.beginPath(); ctx.arc(x, y - s * 0.55, s * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + s * 0.75, s * 0.78, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    ctx.restore();
  }
  function drawCollectFx(dt) {
    for (const [key, d] of tillDrain) { d.age += dt; if (d.age > 0.45) tillDrain.delete(key); }
    for (const [key, d] of hireFill) { d.age += dt; if (d.age > 0.6) hireFill.delete(key); }
    for (let i = cfx.length - 1; i >= 0; i--) {
      const p = cfx[i]; p.life += dt;
      if (p.life < 0) continue;
      if (p.life >= p.max) { cfx.splice(i, 1); continue; }
      if (p.k === 'coin') { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.spin += p.spinV * dt;
        if (!p.bounced && p.vy > 0 && p.y > p.floor) { p.y = p.floor; p.vy *= -0.38; p.vx *= 0.6; p.bounced = true; } }
      else if (p.k === 'flick') { p.sway += dt * 6; p.x += (p.vx + Math.sin(p.sway) * 22) * dt; p.y += p.vy * dt;
        p.vy = Math.min(p.vy + 90 * dt, -25); p.vx *= (1 - 1.5 * dt); }
      else if (p.k === 'leaf') { p.sway += dt * 5; p.x += (p.vx + Math.sin(p.sway) * 40) * dt; p.y += p.vy * dt;
        p.vy = Math.min(p.vy + 120 * dt, 38); p.vx *= (1 - 1.5 * dt); p.rot += p.rotV * dt; }
      else if (p.k === 'shard' || p.k === 'prismBit') { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.k === 'prismBit' ? 300 : 260) * dt; p.rot += p.rotV * dt; }
      if (p.loc && p.loc !== S.g.loc) continue;
      const k = 1 - p.life / p.max;
      if (p.k === 'coin') {
        const w = Math.max(0.18, Math.abs(Math.cos(p.spin))), s = p.size;
        ctx.globalAlpha = Math.min(1, k * 2.2); ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, s * w, s, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(245,225,255,.85)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, s * w * 0.62, s * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (p.k === 'flick') {
        const s = p.size * (0.45 + 0.55 * k);
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.sway) * 0.25);
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(0, -s * 1.7);
        ctx.quadraticCurveTo(s * 1.05, -s * 0.2, 0, s); ctx.quadraticCurveTo(-s * 1.05, -s * 0.2, 0, -s * 1.7); ctx.fill();
        ctx.fillStyle = 'rgba(255,236,170,.85)'; ctx.beginPath(); ctx.ellipse(0, s * 0.25, s * 0.32, s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (p.k === 'leaf') {
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(10,30,20,.5)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(-p.size, 0); ctx.lineTo(p.size, 0); ctx.stroke(); ctx.restore();
      } else if (p.k === 'ring') {
        const u = 1 - k; ctx.globalAlpha = k * 0.8; ctx.strokeStyle = p.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 20 + u * 110, 6 + u * 26, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (p.k === 'star') {
        const s = p.size * Math.sin(Math.PI * p.life / p.max);
        if (s > 0) { ctx.globalAlpha = 1; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fff0f7'; ctx.beginPath();
          ctx.moveTo(p.x, p.y - s); ctx.quadraticCurveTo(p.x, p.y, p.x + s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s);
          ctx.quadraticCurveTo(p.x, p.y, p.x - s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s); ctx.fill(); ctx.restore(); }
      } else if (p.k === 'shard') { ctx.globalAlpha = Math.min(1, k * 2); cfxGem(p.x, p.y, p.size, p.rot, p.color); }
      else if (p.k === 'prismBit') {
        const rb = (C.prism && C.prism.rainbow) || ['#ff5f7e', '#ffa14d', '#ffe156', '#6ef08a', '#4fd6ff', '#7c7cff', '#d77bff'];
        const g = ctx.createLinearGradient(4, 2, 20, 22);
        rb.forEach((c, j) => g.addColorStop(j / (rb.length - 1), c));
        ctx.save(); ctx.globalAlpha = Math.min(1, k * 2); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.shadowColor = (C.currencies.prism || {}).color || '#c99bff'; ctx.shadowBlur = 8;
        IC.drawIcon(ctx, 'prism', 0, 0, p.size, g, 1.9); ctx.restore();
      }
      else if (p.k === 'man' || p.k === 'sock') cfxHire(p);
    }
    ctx.globalAlpha = 1;
  }
  function drawDemolish(dt) {
    for (let i = demoFx.length - 1; i >= 0; i--) {
      const fx = demoFx[i];
      fx.age += dt;
      if (fx.age > 1.6) { demoFx.splice(i, 1); continue; }
      if (fx.loc && fx.loc !== S.g.loc) continue;
      if (fx.age < 0.2) {
        const k = fx.age / 0.2, sc = 1 - 0.12 * k;
        ctx.save(); ctx.globalAlpha = 1 - k;
        ctx.translate(fx.x, fx.y); ctx.scale(sc, sc);
        const x0 = -fx.w / 2, y0 = -fx.h / 2, r = 12;
        ctx.beginPath(); ctx.moveTo(x0 + r, y0); ctx.arcTo(x0 + fx.w, y0, x0 + fx.w, y0 + fx.h, r);
        ctx.arcTo(x0 + fx.w, y0 + fx.h, x0, y0 + fx.h, r); ctx.arcTo(x0, y0 + fx.h, x0, y0, r);
        ctx.arcTo(x0, y0, x0 + fx.w, y0, r); ctx.closePath();
        ctx.fillStyle = '#161e2a'; ctx.fill(); ctx.clip();
        ctx.fillStyle = fx.color; ctx.fillRect(x0, y0, fx.w, 6);
        ctx.restore();
      }
      for (const p of fx.puffs) {
        p.age += dt;
        if (p.age > p.life) continue;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.95; p.vy *= 0.95;
        const f = p.age / p.life, rad = p.r * (1 + f * 1.6);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        g.addColorStop(0, 'rgba(190,178,158,' + (0.34 * (1 - f)).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(190,178,158,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function drawParticles() {
    drawBits();
    for (const p of R.particles) {
      const k = 1 - p.life / p.max;
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + k * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  R.toScreen = function (wx, wy) {
    const c = S.g.camera;
    return { x: (wx - c.x) * c.scale + W / 2, y: (wy - c.y) * c.scale + H / 2 };
  };
  R.toWorld = function (sx, sy) {
    const c = S.g.camera;
    return { x: (sx - W / 2) / c.scale + c.x, y: (sy - H / 2) / c.scale + c.y };
  };
  R.size = function () { return { w: W, h: H }; };

  function viewRect(pad) {
    const a = R.toWorld(0, 0), b = R.toWorld(W, H);
    return { x0: Math.min(a.x, b.x) - pad, y0: Math.min(a.y, b.y) - pad,
             x1: Math.max(a.x, b.x) + pad, y1: Math.max(a.y, b.y) + pad };
  }
  function inRect(r, x, y) { return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1; }

  let nightK = 0;

  R.nightHold = null;
  function nightTarget() {
    const N = C.night;
    if (R.nightHold) return R.nightHold === 'night' ? 1 : 0;
    if (!N || !N.enabled || !GG.sim || GG.sim.sunAnchor() === null) return 0;
    const ph = GG.sim.solarPhase({ loc: S.g.loc });
    return (ph.on || ph.heat) ? 0 : 1;
  }
  function stepNight(dt) {

    const tau = R.nightHold ? 0.3 : Math.max(0.1, ((C.night && C.night.fadeSec) || 20) / 3);
    nightK += (nightTarget() - nightK) * (1 - Math.exp(-dt / tau));
    if (nightK < 0.002) nightK = 0;
  }
  R.nightK = function () { return nightK; };

  function drawStars(time) {
    const St = C.night && C.night.stars, sc = S.g.camera.scale || 1;
    if (!St || !St.enabled || nightK <= 0.01 || sc < St.minScale) return;
    const fadeZ = Math.min(1, (sc - St.minScale) / 0.15), r = viewRect(0), cell = St.cell || 220;
    for (let cx = Math.floor(r.x0 / cell); cx <= Math.floor(r.x1 / cell); cx++) {
      for (let cy = Math.floor(r.y0 / cell); cy <= Math.floor(r.y1 / cell); cy++) {
        for (let i = 0; i < (St.perCell || 2); i++) {
          const id = cx * 73 + cy * 9151 + i * 17;
          const x = (cx + wxHash(id, 1)) * cell, y = (cy + wxHash(id, 2)) * cell;
          const tw = 0.55 + 0.45 * Math.sin(time * (0.6 + wxHash(id, 5) * 1.4) + wxHash(id, 4) * 6.283);
          ctx.fillStyle = 'rgba(210,225,255,' + (St.alpha * nightK * tw * fadeZ).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(x, y, (0.5 + wxHash(id, 3) * 1.1) / sc, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }

  function drawNightShade() {
    const N = C.night, sh = N && N.shade;
    if (!sh || nightK <= 0) return;
    const r = viewRect(40);
    ctx.fillStyle = 'rgba(0,0,0,' + (sh.dark * nightK).toFixed(3) + ')';
    ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
    ctx.fillStyle = 'rgba(' + sh.blue + ',' + (sh.tint * nightK).toFixed(3) + ')';
    ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
  }

  const siteChip = {};
  function nightSitesOn() { const N = C.night; return !!(N && N.shade && ((N.siteLift || 0) > 0 || (N.siteRim || 0) > 0)); }
  function drawNightSites() {
    const N = C.night, sh = N.shade, k = nightK;
    if (k <= 0) return;
    const keep = 1 - Math.min(1, Math.max(0, N.siteLift || 0));
    S.sitesHere().forEach(function (s) {
      const t = S.type(s), box = S.siteBox(s);
      if (keep > 0) {
        sitePath(s, box, []);
        ctx.fillStyle = 'rgba(0,0,0,' + (sh.dark * k * keep).toFixed(3) + ')'; ctx.fill();
        ctx.fillStyle = 'rgba(' + sh.blue + ',' + (sh.tint * k * keep).toFixed(3) + ')'; ctx.fill();
      }
      if (N.siteRim > 0) {
        const sk = t.skin || C.nodeTypes.trashSite.skin, lw = 2 / Math.max(0.35, S.g.camera.scale);
        ctx.save();
        const cp = siteChip[s.id];
        if (cp) {
          const p = 6 + lw;
          ctx.beginPath();
          ctx.rect(s.x - box.w, s.y - box.h, box.w * 2, box.h * 2);
          ctx.rect(cp.x - p, cp.y - p, cp.w + p * 2, cp.h + p * 2);
          ctx.clip('evenodd');
        }
        sitePath(s, box, []);
        ctx.strokeStyle = 'rgba(' + (sk.edge2 || sk.edge || '190,210,255') + ',' + (N.siteRim * k).toFixed(3) + ')';
        ctx.lineWidth = lw; ctx.stroke();
        ctx.restore();
      }
    });
  }

  function drawNightGlow(nRect) {
    const g1 = C.night && C.night.glow, gd = (C.night && C.night.dayGlow) || 0;

    const g0 = (g1 || 0) * nightK + gd * (1 - nightK);
    if (!(g0 > 0)) return;
    S.machinesHere().forEach(function (n) {
      if (nRect && !inRect(nRect, n.x, n.y)) return;
      const t = S.type(n);
      if (!liveWorking(n, R.headPill(n, t))) return;
      const sz = rowLayout(n).size, R0 = sz.w * 0.85;
      const g = ctx.createRadialGradient(n.x, n.y, sz.w * 0.2, n.x, n.y, R0);
      g.addColorStop(0, rgba(t.color, g0.toFixed(3))); g.addColorStop(1, rgba(t.color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, R0, 0, Math.PI * 2); ctx.fill();
    });
  }

  function nightPacket(pt, r, col) {
    const a = C.night && C.night.packetGlow;
    if (!a || nightK <= 0) return;
    ctx.fillStyle = rgba(col, (a * 0.45 * nightK).toFixed(3));
    ctx.beginPath(); ctx.arc(pt.x, pt.y, r * 2.6, 0, Math.PI * 2); ctx.fill();
  }

  function nightCard(n) {
    const N = C.night;
    if (!N || nightK <= 0) return;
    const t = S.type(n), sz = rowLayout(n).size, x = n.x - sz.w / 2, y = n.y - sz.h / 2;
    if (N.restDim && t.id === 'solarPanel' && !GG.sim.solarOn(n)) {
      ctx.fillStyle = 'rgba(6,9,16,' + (N.restDim * nightK).toFixed(3) + ')';
      cardPath(n, t, x, y, sz.w, sz.h, 12, sz.w); ctx.fill();
    }
    if (N.moon) {
      ctx.strokeStyle = 'rgba(190,210,255,' + (N.moon * nightK).toFixed(3) + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 12, y + 0.5); ctx.lineTo(x + sz.w - 12, y + 0.5); ctx.stroke();
    }
  }

  R.viewWorld = function () { return (W > 0 && H > 0) ? viewRect(0) : null; };

  function boxHits(r, ax, ay, bx, by) {
    return Math.min(ax, bx) <= r.x1 && Math.max(ax, bx) >= r.x0 &&
           Math.min(ay, by) <= r.y1 && Math.max(ay, by) >= r.y0;
  }

  R.contentBox = function (loc) {
    const id = loc || S.g.loc;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, n = 0;
    S.g.nodes.forEach(function (nd) {
      if (nd.loc !== id) return;
      const t = S.type(nd);
      const box = t && t.site ? S.siteBox(nd) : S.sizeOf(nd);
      const w = (box && box.w) || 220, h = (box && box.h) || 120;
      minX = Math.min(minX, nd.x - w / 2); maxX = Math.max(maxX, nd.x + w / 2);
      minY = Math.min(minY, nd.y - h / 2); maxY = Math.max(maxY, nd.y + h / 2);
      n++;
    });
    if (!n) return null;
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY,
             cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
             w: maxX - minX, h: maxY - minY, count: n };
  };

  function rowLayout(node) {
    const t = S.type(node);
    const size = S.sizeOf(node);
    const M = S.METRICS;
    const top = node.y - size.h / 2 + M.HEAD + S.capRows(t, node) * M.CAP_ROW;
    const rows = S.rowsOf(node);
    rows.forEach((r, i) => { r.cy = top + i * M.ROW + M.ROW / 2; });
    return { rows: rows, size: size, t: t };
  }

  R.portFace = function (node, kind) {
    const out = kind === 'out' ? 1 : -1;
    return (C.ui.flipPorts !== false && node && node.flip) ? -out : out;
  };

  R.canFlip = function (node) {
    const t = S.type(node);
    if (C.ui.flipPorts === false || !t || t.kind !== 'machine') return false;
    return C.ui.flipAll !== false || !!t.flippable;
  };

  R.portPos = function (node, dir, portId) {
    const L = rowLayout(node);
    const row = L.rows.find(r => r.kind === dir && r.port && r.port.id === portId);
    const cy = row ? row.cy : node.y;
    const f = R.portFace(node, dir);
    return { x: node.x + L.size.w / 2 * f, y: cy, face: f };
  };

  R.hitPort = function (wx, wy, pad, dir) {
    const reach = 13 + (pad > 0 ? pad : 0);
    let best = null, bestD = Infinity;
    for (const n of S.machinesHere()) {
      const L = rowLayout(n);
      for (const r of L.rows) {
        if (r.kind === 'vout') continue;
        if (dir && r.kind !== dir) continue;
        const x = n.x + L.size.w / 2 * R.portFace(n, r.kind);
        const d = Math.hypot(wx - x, wy - r.cy);
        if (d > reach) continue;
        if (!(pad > 0)) return { node: n, dir: r.kind, port: r.port };
        if (d < bestD) { bestD = d; best = { node: n, dir: r.kind, port: r.port }; }
      }
    }
    return best;
  };

  R.hitNode = function (wx, wy) {
    const ms = S.machinesHere();
    for (let i = ms.length - 1; i >= 0; i--) {
      const n = ms[i], s = S.sizeOf(n);
      if (Math.abs(wx - n.x) <= s.w / 2 && Math.abs(wy - n.y) <= s.h / 2) return n;
    }
    return null;
  };

  function bendCfg() { return (C.wire && C.wire.bends) || {}; }
  R.bendsOn = function () {
    if (bendCfg().enabled === false) return false;
    const u = (C.ui || {}).wireBends;
    if (!u || u.enabled === false) return true;
    return ((GG.menu && GG.menu.wireBends) || u.def) === 'on';
  };
  R.bendPts = function (l, a) {
    if (!R.bendsOn() || !l || !l.bends || !l.bends.length || !a) return null;
    return l.bends.map(q => ({ x: a.x + q.dx, y: a.y + q.dy }));
  };
  R.linkPts = function (l, a, b) {
    const p0 = R.portPos(a, 'out', l.fromPort), p1 = R.portPos(b, 'in', l.toPort);
    const bp = R.bendPts(l, a);
    if (bp) p0.bends = bp;
    return [p0, p1];
  };
  function bent(p0) { return !!(p0 && p0.bends && p0.bends.length); }
  function legsOf(p0, p1) {
    const pts = [p0].concat(p0.bends, [p1]), out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const s0 = pts[i], e0 = pts[i + 1];
      const a = i === 0 ? { x: p0.x, y: p0.y, face: p0.face }
                        : { x: s0.x, y: s0.y, face: e0.x >= s0.x ? 1 : -1 };
      const b = i === pts.length - 2 ? p1 : { x: e0.x, y: e0.y, face: s0.x <= e0.x ? -1 : 1 };
      out.push([a, b]);
    }
    return out;
  }
  function curveLen(a, b) {
    let L = 0, prev = a;
    for (let i = 1; i <= 12; i++) { const q = bezier(a, b, i / 12); L += Math.hypot(q.x - prev.x, q.y - prev.y); prev = q; }
    return L;
  }
  R.wireLen = function (p0, p1, ortho) {
    if (ortho) return R.wireSegs(p0, p1).total;
    if (!bent(p0)) return curveLen(p0, p1);
    return legsOf(p0, p1).reduce((t, g) => t + curveLen(g[0], g[1]), 0);
  };

  R.bendSlot = function (l, wx, wy) {
    const a = S.node(l.from), b = S.node(l.to);
    if (!a || !b) return 0;
    const [p0, p1] = R.linkPts(l, a, b), sq = R.wireOrtho(l);
    if (!bent(p0)) return 0;

    const N = 240, pts = [];
    for (let k = 0; k <= N; k++) pts.push(R.wireAt(p0, p1, sq, k / N));
    const near = (x, y) => { let bi = 0, bd = Infinity;
      pts.forEach((q, k) => { const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; bi = k; } });
      return bi; };
    const at = near(wx, wy);
    return p0.bends.filter(q => near(q.x, q.y) < at).length;
  };

  R.hitBend = function (wx, wy) {
    if (!R.bendsOn()) return null;
    const grab = bendCfg().grab || 10;
    for (const l of S.g.links) {
      if (!l.bends || !l.bends.length) continue;
      const a = S.node(l.from);
      if (!a || !S.here(a)) continue;
      const pts = R.bendPts(l, a);
      for (let i = 0; i < pts.length; i++) {
        if (Math.hypot(wx - pts[i].x, wy - pts[i].y) <= grab) return { link: l, i: i };
      }
    }
    return null;
  };

  function dotCfg() { return (C.wire && C.wire.reroute) || {}; }
  R.dotsOn = function () { return dotCfg().enabled !== false && R.bendsOn(); };
  R.hitDot = function (wx, wy) {
    if (!R.dotsOn()) return null;
    const grab = dotCfg().grab || 12;
    for (const n of S.machinesHere()) {
      if (!n.dots) continue;
      for (const pid in n.dots) {
        const d = n.dots[pid];
        if (Math.hypot(wx - (n.x + d.dx), wy - (n.y + d.dy)) <= grab) return { node: n, port: pid, d: d };
      }
    }
    return null;
  };
  function drawDots(ui) {
    if (!R.dotsOn()) return;
    const r = dotCfg().r || 7, hov = ui && ui.hoverDot;
    S.machinesHere().forEach(function (n) {
      if (!n.dots) return;
      Object.keys(n.dots).forEach(function (pid) {
        const d = n.dots[pid], x = n.x + d.dx, y = n.y + d.dy;
        const port = S.portsOf(n, 'out').find(p => p.id === pid);
        const res = port ? (S.portRes ? S.portRes(n, port, 'out') : port.res) : null;
        const col = (C.resources[res] || C.resources[port && port.res] || {}).color || '#cfd8e3';
        const big = hov && hov.node === n && hov.port === pid;
        ctx.beginPath(); ctx.arc(x, y, big ? r + 2 : r, 0, Math.PI * 2);
        ctx.fillStyle = '#0d1116'; ctx.fill();
        ctx.lineWidth = big ? 3.5 : 2.6; ctx.strokeStyle = col; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      });
    });
  }

  function segDist(x, y, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
    const k = L > 0 ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / L)) : 0;
    return Math.hypot(x - (a.x + k * dx), y - (a.y + k * dy));
  }
  R.hitLink = function (wx, wy) {
    for (const l of S.g.links) {
      const a = S.node(l.from), b = S.node(l.to);
      if (!a || !b || !S.here(a)) continue;
      const [p0, p1] = R.linkPts(l, a, b);
      const sq = R.wireOrtho(l);

      const steps = bent(p0)
        ? GG.util.clamp(Math.round(R.wireLen(p0, p1, sq) / 10), 16, 240)
        : sq ? GG.util.clamp(Math.round(R.wireSegs(p0, p1).total / 10), 16, 96) : 16;

      const whole = ((C.wire || {}).hitWhole) !== false;
      let prev = null;
      for (let i = 0; i <= steps; i++) {
        const pt = R.wireAt(p0, p1, sq, i / steps);
        if (Math.hypot(wx - pt.x, wy - pt.y) < 9) return l;
        if (whole && prev && segDist(wx, wy, prev, pt) < 9) return l;
        prev = pt;
      }
    }
    return null;
  };

  function faceOf(p, dflt) { return p && p.face !== undefined ? p.face : dflt; }
  function ctrl(p0, p1) {
    const d = Math.max(55, Math.abs(p1.x - p0.x) * 0.5);
    return [{ x: p0.x + d * faceOf(p0, 1), y: p0.y },
            { x: p1.x + d * faceOf(p1, -1), y: p1.y }];
  }

  function orthoCfg() { return (C.wire && C.wire.ortho) || {}; }
  R.wireOrtho = function (l) { return !!(l && l.ortho && orthoCfg().enabled !== false); };

  function orthoPts(p0, p1) {
    const o = orthoCfg();
    const stub = o.stub === undefined ? 26 : o.stub;
    const f0 = faceOf(p0, 1), f1 = faceOf(p1, -1);

    const ax = p0.x + stub * f0, bx = p1.x + stub * f1;

    if (f0 !== f1 && (bx - ax) * f0 >= 0) {
      const mx = (ax + bx) / 2;
      return [p0, { x: mx, y: p0.y }, { x: mx, y: p1.y }, p1];
    }

    const jog = o.minJog === undefined ? 26 : o.minJog;
    let my = (p0.y + p1.y) / 2;
    if (Math.abs(p1.y - p0.y) < jog * 2) my = p0.y + jog * 2;
    return [p0, { x: ax, y: p0.y }, { x: ax, y: my },
            { x: bx, y: my }, { x: bx, y: p1.y }, p1];
  }

  function orthoBentPts(p0, p1) {
    const o = orthoCfg(), stub = o.stub === undefined ? 26 : o.stub;
    const s0 = { x: p0.x + stub * faceOf(p0, 1), y: p0.y };
    const e0 = { x: p1.x + stub * faceOf(p1, -1), y: p1.y };
    const raw = [p0, s0];
    let cur = s0;
    p0.bends.concat([e0]).forEach(function (t) {
      raw.push({ x: t.x, y: cur.y }, { x: t.x, y: t.y, bend: t !== e0 });
      cur = t;
    });
    raw.push(p1);
    const pts = [];
    raw.forEach(function (q) {
      const last = pts[pts.length - 1];
      if (last && Math.abs(last.x - q.x) < 0.5 && Math.abs(last.y - q.y) < 0.5) return;
      const prev = pts[pts.length - 2];
      if (prev && last && ((Math.abs(prev.x - last.x) < 0.5 && Math.abs(last.x - q.x) < 0.5) ||
                           (Math.abs(prev.y - last.y) < 0.5 && Math.abs(last.y - q.y) < 0.5))) {
        pts[pts.length - 1] = q;
        return;
      }
      pts.push(q);
    });
    return pts;
  }
  R.wireSegs = function (p0, p1) {
    const pts = bent(p0) ? orthoBentPts(p0, p1) : orthoPts(p0, p1);
    const r0 = orthoCfg().radius === undefined ? 12 : orthoCfg().radius;
    const segs = [];
    let at = pts[0];
    for (let i = 1; i < pts.length - 1; i++) {
      const c = pts[i], nx = pts[i + 1];
      const din = Math.hypot(c.x - at.x, c.y - at.y) || 1;
      const dout = Math.hypot(nx.x - c.x, nx.y - c.y) || 1;

      const rb = orthoCfg().bendRadius || 0;
      const r = Math.min(c.bend ? rb : r0, din / 2, dout / 2);
      const a = { x: c.x + (at.x - c.x) / din * r, y: c.y + (at.y - c.y) / din * r };
      const b = { x: c.x + (nx.x - c.x) / dout * r, y: c.y + (nx.y - c.y) / dout * r };
      segs.push({ a: at, b: a });
      if (r > 0) segs.push({ a: a, c: c, b: b });
      at = b;
    }
    segs.push({ a: at, b: pts[pts.length - 1] });
    let total = 0;
    segs.forEach(function (g) {

      g.len = g.c
        ? (Math.hypot(g.c.x - g.a.x, g.c.y - g.a.y) + Math.hypot(g.b.x - g.c.x, g.b.y - g.c.y) +
           Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y)) / 2
        : Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y);
      g.at = total; total += g.len;
    });
    segs.total = total;
    return segs;
  };

  function wirePath(p0, p1, ortho) {
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    if (!ortho && bent(p0)) {
      legsOf(p0, p1).forEach(function (g) {
        const [c0, c1] = ctrl(g[0], g[1]);
        ctx.bezierCurveTo(c0.x, c0.y, c1.x, c1.y, g[1].x, g[1].y);
      });
      return;
    }
    if (!ortho) {
      const [c0, c1] = ctrl(p0, p1);
      ctx.bezierCurveTo(c0.x, c0.y, c1.x, c1.y, p1.x, p1.y);
      return;
    }
    R.wireSegs(p0, p1).forEach(function (g) {
      if (g.c) ctx.quadraticCurveTo(g.c.x, g.c.y, g.b.x, g.b.y);
      else ctx.lineTo(g.b.x, g.b.y);
    });
  }

  R.wireAt = function (p0, p1, ortho, t) {
    if (!ortho && bent(p0)) {
      const legs = legsOf(p0, p1), lens = legs.map(g => curveLen(g[0], g[1]));
      let d = GG.util.clamp(t, 0, 1) * lens.reduce((x, y) => x + y, 0);
      for (let i = 0; i < legs.length; i++) {
        if (d <= lens[i] || i === legs.length - 1) return bezier(legs[i][0], legs[i][1], lens[i] > 0 ? GG.util.clamp(d / lens[i], 0, 1) : 0);
        d -= lens[i];
      }
    }
    if (!ortho) return bezier(p0, p1, t);
    const segs = R.wireSegs(p0, p1);
    const d = GG.util.clamp(t, 0, 1) * segs.total;
    for (let i = 0; i < segs.length; i++) {
      const g = segs[i];
      if (d > g.at + g.len && i < segs.length - 1) continue;
      const u = g.len > 0 ? GG.util.clamp((d - g.at) / g.len, 0, 1) : 0;
      if (!g.c) return { x: g.a.x + (g.b.x - g.a.x) * u, y: g.a.y + (g.b.y - g.a.y) * u };
      const v = 1 - u;
      return { x: v * v * g.a.x + 2 * v * u * g.c.x + u * u * g.b.x,
               y: v * v * g.a.y + 2 * v * u * g.c.y + u * u * g.b.y };
    }
    return p1;
  };
  function bezier(p0, p1, t) {
    const [c0, c1] = ctrl(p0, p1);
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * c0.x + 3 * u * t * t * c1.x + t * t * t * p1.x,
      y: u * u * u * p0.y + 3 * u * u * t * c0.y + 3 * u * t * t * c1.y + t * t * t * p1.y,
    };
  }

  R.collectRect = function (node, side) {
    const t = S.type(node);
    if (!t.collect && !t.action) return null;
    const size = S.sizeOf(node), M = S.METRICS;
    const rows = S.rowsOf(node).length;
    const top = node.y - size.h / 2 + M.HEAD + S.capRows(t, node) * M.CAP_ROW + rows * M.ROW;
    const x = node.x - size.w / 2 + 13, w = size.w - 26;

    if (t.collectB) {
      const gap = 6, half = (w - gap) / 2;
      return { x: side === 'B' ? x + half + gap : x, y: top + 4, w: half, h: 22 };
    }

    if (side === 'H' || side === 'G') return { x: x, y: top + 4 + M.COLLECT, w: w, h: 22 };
    return { x: x, y: top + 4, w: w, h: 22 };
  };

  R.hitCollectAt = function (wx, wy) {
    for (const n of S.machinesHere()) {
      const sides = GG.sim.sides(S.type(n));
      for (const side of (S.feedRow(S.type(n)) ? sides.concat('G') : sides)) {
        const r = R.collectRect(n, side);
        if (r && wx >= r.x && wx < r.x + r.w && wy >= r.y && wy < r.y + r.h)
          return { node: n, side: side };
      }
    }
    return null;
  };

  R.hitCollect = function (wx, wy) {
    const h = R.hitCollectAt(wx, wy);
    return h ? h.node : null;
  };

  R.pillFlipRect = function (n) {
    const F = C.diagnose.pillFlip || {};
    if (!F.enabled) return null;
    const t = S.type(n);
    if (!t || t.kind === 'site') return null;
    const hp = R.headPill(n, t);
    if (!hp.flip) return null;
    const size = S.sizeOf(n);
    return { x: n.x + size.w / 2 - hp.w - 12, y: n.y - size.h / 2 + 13, w: hp.w, h: 16 };
  };

  R.cyclePill = function (n) {
    const t = S.type(n);
    if (!t) return;
    const hp = R.headPill(n, t);
    const len = hp.cands;
    if (!hp.flip || len < 2) return;
    const next = ((n.pillAlt | 0) + 1) % len;
    if (next) n.pillAlt = next; else delete n.pillAlt;
  };

  R.hitPillFlip = function (wx, wy, pad) {
    const p = pad || 0;
    for (const n of S.machinesHere()) {
      const r = R.pillFlipRect(n);
      if (r && wx >= r.x - p && wx < r.x + r.w + p &&
               wy >= r.y - p && wy < r.y + r.h + p) return n;
    }
    return null;
  };

  let lastTime = 0;

  let travel = null;
  const travelCv = document.createElement('canvas'), travelTmp = document.createElement('canvas');
  R.travelStart = function () {
    const o = (C.ui || {}).travelFx;
    if (!o || !o.enabled || !cv || !cv.width) return false;
    travelCv.width = cv.width; travelCv.height = cv.height;
    travelCv.getContext('2d').drawImage(cv, 0, 0);
    travel = { t0: performance.now(), sec: o.sec || 0.42 };
    return true;
  };
  function drawTravel() {
    if (!travel) return;
    const o = C.ui.travelFx, u = (performance.now() - travel.t0) / (travel.sec * 1000);
    if (u >= 1) { travel = null; return; }
    const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const pw = cv.width, ph = cv.height, split = o.split || 0.45;
    let img, s, a;
    if (u < split) { const e = ease(u / split); img = travelCv; s = 1 - (o.pullBack || 0.1) * e; a = 1 - e; }
    else {
      const e = ease((u - split) / (1 - split));
      if (travelTmp.width !== pw || travelTmp.height !== ph) { travelTmp.width = pw; travelTmp.height = ph; }
      const tg = travelTmp.getContext('2d'); tg.clearRect(0, 0, pw, ph); tg.drawImage(cv, 0, 0);
      img = travelTmp; s = 1 + (o.dropIn || 0.12) * (1 - e); a = e;
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.fillStyle = o.dark || '#0a0e14'; ctx.fillRect(0, 0, pw, ph);
    ctx.globalAlpha = a; ctx.drawImage(img, pw / 2 * (1 - s), ph / 2 * (1 - s), pw * s, ph * s);
    ctx.restore();
  }

  R.draw = function (time, ui) {
    S.clearSlotCache();

    if (cv.clientWidth && cv.clientHeight &&
        (cv.clientWidth !== W || cv.clientHeight !== H)) R.resize();
    const dt = Math.min(0.1, Math.max(0, time - lastTime));
    lastTime = time;
    stepParticles(dt);
    stepWaves(dt);
    stepFalls(dt);
    stepRockets(dt);
    stepHeal(dt);
    stepRevive(dt);
    stepNight(dt);
    const cam = S.g.camera;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);

    if (R.reviveOn()) {
      const k = R.reviveK();
      const SG = strongOn() ? C.revive.stronger.groundClean : C.revive.ground.clean;
      bg.addColorStop(0, mix(C.revive.ground.dirty[0], SG[0], k));
      bg.addColorStop(1, mix(C.revive.ground.dirty[1], SG[1], k));
    } else if (C.heal && C.heal.enabled) {
      const k = R.healK();
      bg.addColorStop(0, mix(C.heal.skyDirty[0], C.heal.skyClean[0], k));
      bg.addColorStop(1, mix(C.heal.skyDirty[1], C.heal.skyClean[1], k));
    } else {
      bg.addColorStop(0, '#0d1219'); bg.addColorStop(1, '#090d13');
    }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    drawGrid(cam);
    baseT = ctx.getTransform();

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(cam.scale, cam.scale);
    ctx.translate(-cam.x, -cam.y);

    boostMarks = (C.boostFx && C.boostFx.enabled) ? GG.sim.boostMarks() : {};

    drawStars(time);
    drawGroundCover();
    drawLife(time);
    const nightSites = nightSitesOn();
    if (nightSites) drawNightShade();

    if (nightSites) drawAir(time);
    drawGridDots();
    drawRockMarks(dt);

    const up = R.lifted || null;
    S.sitesHere().forEach(s => { if (!up || s !== up.site) drawSite(s, time, ui); });
    if (nightSites) drawNightSites();
    if (GG.halloween) GG.halloween.under(ctx, time);

    drawAurora(time);
    drawPetMist(time);
    drawCoreWaves(time);
    if (R.labUnder) R.labUnder(ctx, time, dt);
    drawWaves();
    drawBeaconRange(ui);
    if (!nightSites) { drawNightShade(); drawAir(time); }

    const hotWires = (GG.tutor && GG.tutor.hotWires) ? GG.tutor.hotWires() : null;

    const cull = (C.ui && C.ui.cull) || {};
    const nRect = cull.enabled ? viewRect(cull.nodePad === undefined ? 260 : cull.nodePad) : null;
    const lRect = cull.enabled ? viewRect(cull.wirePad === undefined ? 340 : cull.wirePad) : null;
    drawNightGlow(nRect);

    S.g.links.forEach(function (l) {
      if (up && (up.ids.has(l.from) || up.ids.has(l.to))) return;
      if (lRect) {
        const a = S.node(l.from), b = S.node(l.to);
        if (!a || !b) return;
        let x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
        const bp = R.bendPts(l, a);
        if (bp) bp.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
        if (!boxHits(lRect, x0, y0, x1, y1)) return;
      }
      drawLink(l, time, ui, hotWires);
    });
    drawDots(ui);
    drawAlignFlash(time);
    drawCutFx();
    if (ui.wire) drawPendingWire(ui);
    drawPrismUnder(time, nRect);
    S.machinesHere().forEach(function (n) {
      if (up && up.ids.has(n.id)) return;
      if (nRect && !inRect(nRect, n.x, n.y)) return;
      drawNode(n, time, ui);
      nightCard(n);
    });
    if (up) {
      drawSite(up.site, time, ui);
      S.g.links.forEach(function (l) { if (up.ids.has(l.from) || up.ids.has(l.to)) drawLink(l, time, ui, hotWires); });
      S.machinesHere().forEach(function (n) { if (up.ids.has(n.id)) { drawNode(n, time, ui); nightCard(n); } });
    }
    drawPrismFx(time, nRect);
    drawGridSparks(time, nRect);
    drawWxMarks(time, nRect);
    drawShieldFx(time, nRect);
    if (ui.band) drawBand(ui.band);
    drawParticles();
    drawRockPuffs(dt);
    drawCollectFx(dt);
    drawStartFx(dt);
    drawFindPulse();
    drawDemolish(dt);
    drawRockets(time);
    drawFalls();
    drawArms(time);
    stepFlies(dt);
    drawCursor();
    drawFlies();
    stepCritters(dt);
    drawCritters();
    drawLevelFx();
    drawEventFx();
    drawVisitor(time);
    drawGust();
    drawGolden(time);
    drawStar(time);
    drawMoonlight(time);
    drawNotes(time);
    drawGroundGems(time);
    drawCon(time);
    drawPetFloats(time);
    drawCore(time);
    if (GG.halloween) GG.halloween.over(ctx, time, dt);

    if (R.labOver) R.labOver(ctx, time, dt);

    if (ui.ghost) drawGhost(ui);

    ctx.restore();

    drawBirds(time);

    drawSmog(time);
    drawMudWind(dt);

    drawWeather(time, dt);
    drawTravel();
  };

  const armShow = new WeakMap();
  function armTime(a, time) {
    if ((C.ui || {}).armSmooth === false) return a.t;
    const tick = 1 / ((C.sim && C.sim.tickRate) || 20) * ((GG.ui && GG.ui.speed) || 1);
    let d = armShow.get(a);
    if (!d) { d = { t: a.t, at: time }; armShow.set(a, d); }
    d.t += Math.max(0, time - d.at);
    d.at = time;
    d.t = Math.min(Math.max(d.t, a.t), a.t + tick, a.dur);
    return d.t;
  }

  function drawArms(time) {
    S.machinesHere().forEach(function (n) {
      const t = C.nodeTypes[n.type];
      if (!t || !t.gemArm) return;
      const size = S.sizeOf(n);
      const hx = n.x, hy = n.y - size.h / 2;
      const a = n.arm;
      const style = (C.ui || {}).armStyle || 'zigzag';
      if (style !== 'zigzag') { drawArm2(n, t, a, hx, hy, time, style); return; }
      const open = a ? 1 : 0;

      ctx.save();
      ctx.fillStyle = 'rgba(20,28,40,.95)';
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(hx - 13, hy - 7 - open * 3, 26, 9 + open * 3, 3);
      ctx.fill(); ctx.stroke();
      if (!a) { ctx.restore(); return; }
      const half = a.dur / 2, at = armTime(a, time);
      let e = at < half ? at / half : Math.max(0, (a.dur - at) / half);
      e = e * e * (3 - 2 * e);
      const tx = hx + (a.x - hx) * e, ty = (hy - 6) + (a.y - (hy - 6)) * e;
      const dx = tx - hx, dy = ty - (hy - 6), len = Math.hypot(dx, dy) || 1;
      const segs = Math.max(2, Math.min(12, Math.ceil(Math.hypot(a.x - hx, a.y - hy) / 140)));
      const nx = -dy / len, ny = dx / len;

      const amp = Math.min(22, len / segs) * (1 - e * 0.85);
      const pts = [];
      for (let i = 0; i <= segs; i++) {
        const f = i / segs, zig = (i === 0 || i === segs) ? 0 : (i % 2 ? 1 : -1);
        pts.push([hx + dx * f + nx * amp * zig, hy - 6 + dy * f + ny * amp * zig]);
      }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(8,12,18,.85)'; ctx.lineWidth = 9;
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.stroke();
      ctx.strokeStyle = t.color; ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = '#d8f5ec';
      pts.forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 3.2, 0, 6.2832); ctx.fill(); });

      const ang = Math.atan2(dy, dx), claw = a.grabbed ? 0.35 : 0.8;
      ctx.strokeStyle = t.color; ctx.lineWidth = 3.5;
      [-1, 1].forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(tx, ty);
        ctx.lineTo(tx + Math.cos(ang + s * claw) * 13, ty + Math.sin(ang + s * claw) * 13);
        ctx.stroke();
      });
      if (a.grabbed) GG.icons.drawIcon(ctx, 'diamond', tx + Math.cos(ang) * 12,
                                       ty + Math.sin(ang) * 12, 26, '#bfe9ff');
      ctx.restore();
    });
  }

  function armEase(at, dur, pause) {
    const half = dur / 2;
    if (at < half) { const u = Math.min(1, at / (half * 0.86)); return { e: 1 - Math.pow(1 - u, 3), out: true, u: at / half }; }
    const v = (at - half) / half, hold = pause ? 0.14 : 0;
    if (v < hold) return { e: 1, out: false, u: v };
    const w = (v - hold) / (1 - hold);
    return { e: 1 - w * w * (3 - 2 * w), out: false, u: v };
  }
  function armClaw(x, y, ang, op, col, scale) {

    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [-1, 0, 1].forEach(function (f) {
      const sp = f * (0.18 + 0.62 * op), a1 = ang + sp, a2 = ang + sp - f * (0.55 - 0.35 * op);
      const x1 = x + Math.cos(a1) * 9 * scale, y1 = y + Math.sin(a1) * 9 * scale;
      const x2 = x1 + Math.cos(a2) * 7 * scale, y2 = y1 + Math.sin(a2) * 7 * scale;
      ctx.strokeStyle = 'rgba(8,12,18,.9)'; ctx.lineWidth = 5 * scale;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 2.6 * scale;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    ctx.fillStyle = '#d8f5ec'; ctx.beginPath(); ctx.arc(x, y, 3.6 * scale, 0, 6.2832); ctx.fill();
  }
  function armStroke(pts, w, col) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath();
    pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
    ctx.stroke();
  }
  function drawArm2(n, t, a, hx, hy, time, style) {
    const FX = (C.ui || {}).armFx || {}, col = t.color;
    const gemCol = ((C.currencies || {}).diamond || {}).color || '#ff5c8a';
    ctx.save();

    const gap = a ? 9 : 0;
    ctx.fillStyle = 'rgba(20,28,40,.95)'; ctx.strokeStyle = col; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(hx - 16, hy - 9, 32, 11, 3); ctx.fill(); ctx.stroke();
    if (FX.doors !== false) {
      ctx.fillStyle = 'rgba(40,56,70,1)';
      ctx.fillRect(hx - 14, hy - 7, 14 - gap, 7); ctx.fillRect(hx + gap, hy - 7, 14 - gap, 7);
      if (gap) { ctx.fillStyle = 'rgba(126,224,192,.35)'; ctx.fillRect(hx - gap, hy - 7, gap * 2, 7); }
    }
    if (!a) { ctx.restore(); return; }
    const at = armTime(a, time), M = armEase(at, a.dur, FX.pause !== false), e = M.e;
    const ox = hx, oy = hy - 4;
    const tx = ox + (a.x - ox) * e, ty = oy + (a.y - oy) * e;
    const dx = tx - ox, dy = ty - oy, len = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
    const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;

    const lift = FX.shadow === false ? 0 : 3 + 16 * Math.sin(Math.PI * Math.min(1, e));
    let pts;
    if (style === 'boom') {

      const arch = Math.min(120, len * 0.35) * (0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, e)));

      let px = nx, py = ny;
      if (py > 0.2 || (Math.abs(py) <= 0.2 && px > 0)) { px = -px; py = -py; }
      const cx = ox + dx * 0.5 + px * arch, cy = oy + dy * 0.5 + py * arch;
      const steps = Math.max(4, Math.min(80, Math.round(len / 14)));
      pts = [];
      for (let i = 0; i <= steps; i++) {
        const f = i / steps, q = 1 - f;
        pts.push([q * q * ox + 2 * q * f * cx + f * f * tx, q * q * oy + 2 * q * f * cy + f * f * ty]);
      }
    } else {

      const D = Math.hypot(a.x - ox, a.y - oy) || 1, r = Math.max(1, len);
      const L1 = Math.max(46, Math.min(260, D * 0.42)), L2 = Math.max(40, 40 + (D * 0.62 - 40) * e);
      const c = Math.max(-1, Math.min(1, (L1 * L1 + r * r - L2 * L2) / (2 * L1 * r)));
      const th = ang - Math.acos(c);
      pts = [[ox, oy], [ox + Math.cos(th) * L1, oy + Math.sin(th) * L1], [tx, ty]];
    }

    if (lift > 0) {
      ctx.save(); ctx.translate(lift * 0.6, lift); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      armStroke(pts, style === 'boom' ? 9 : 10, 'rgba(0,0,0,' + (0.32 - lift * 0.008).toFixed(3) + ')');
      ctx.restore();
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (style === 'boom') {
      armStroke(pts, 10, 'rgba(8,12,18,.9)');
      armStroke(pts, 4, col);

      for (let i = 1; i < pts.length - 1; i++) {
        const p = pts[i], q = pts[i + 1], an = Math.atan2(q[1] - p[1], q[0] - p[0]);
        ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(an);
        ctx.fillStyle = 'rgba(20,28,40,.95)'; ctx.strokeStyle = col; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.roundRect(-4, -6, 8, 12, 2.5); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    } else {
      const E = pts[1], T = pts[2];

      armStroke([pts[0], E], 12, 'rgba(8,12,18,.9)'); armStroke([pts[0], E], 7, col);

      const fl = Math.hypot(T[0] - E[0], T[1] - E[1]) || 1, fx = (T[0] - E[0]) / fl, fy = (T[1] - E[1]) / fl;

      const sec = [[0, Math.min(fl, 44), 10, 5.5]];
      if (fl > 40) {
        const nT = Math.max(1, Math.min(5, Math.ceil((fl - 36) / 70))), step = (fl - 36) / nT;
        for (let k = 0; k < nT; k++) sec.push([36 + k * step - (k ? 8 : 0), 36 + (k + 1) * step, 8 - k * 1, 4.2 - k * 0.45]);
      }
      sec.forEach(function (sg) {
        const a0 = [E[0] + fx * sg[0], E[1] + fy * sg[0]], a1 = [E[0] + fx * sg[1], E[1] + fy * sg[1]];
        armStroke([a0, a1], sg[2], 'rgba(8,12,18,.9)'); armStroke([a0, a1], sg[3], col);
      });

      [pts[0], E].forEach(function (p, i) {
        ctx.fillStyle = 'rgba(20,28,40,1)'; ctx.beginPath(); ctx.arc(p[0], p[1], i ? 6 : 7.5, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#d8f5ec'; ctx.beginPath(); ctx.arc(p[0], p[1], 2.2, 0, 6.2832); ctx.fill();
      });
    }

    const end = pts[pts.length - 1], pre = pts[pts.length - 2];
    const ca = Math.atan2(end[1] - pre[1], end[0] - pre[0]);
    let op;
    if (M.out) op = Math.min(1, Math.max(0, (M.u - 0.45) / 0.4));
    else op = a.grabbed ? 0 : (a.empty ? 0.9 : 0.6);
    if (a.grabbed) {
      const gx = end[0] + Math.cos(ca) * 10, gy = end[1] + Math.sin(ca) * 10;
      if (FX.glow !== false) {
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 22);
        g.addColorStop(0, 'rgba(255,92,138,.35)'); g.addColorStop(1, 'rgba(255,92,138,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, 22, 0, 6.2832); ctx.fill();
      }
      GG.icons.drawIcon(ctx, 'diamond', gx, gy, 24, gemCol);
    }
    armClaw(end[0], end[1], ca, op, col, 1.1);

    if (FX.sparkle !== false && a.grabbed) {
      const k = (at - a.dur / 2) / 0.35;
      if (k >= 0 && k < 1) {
        const gx = end[0] + Math.cos(ca) * 10, gy = end[1] + Math.sin(ca) * 10;
        ctx.strokeStyle = 'rgba(255,220,235,' + (1 - k).toFixed(3) + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(gx, gy, 8 + 22 * k, 0, 6.2832); ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const ra = i / 6 * 6.2832 + 0.3, r0 = 10 + 14 * k, r1 = r0 + 7 * (1 - k);
          ctx.beginPath(); ctx.moveTo(gx + Math.cos(ra) * r0, gy + Math.sin(ra) * r0);
          ctx.lineTo(gx + Math.cos(ra) * r1, gy + Math.sin(ra) * r1); ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function drawWeather(time, dt) {
    const F = C.weather.fx2;
    if (F && F.enabled) return drawWeather2(time, dt, F);

    const w = GG.sim.weather();
    const flash = GG.sim.wxFlashOf();

    if (!w && flash <= 0) return;

    ctx.save();
    if (w) {
      if (w.id === 'rain') drawRain(time, 150, 'rgba(150,200,235,0.34)', 0.10, w.color);
      else if (w.id === 'storm') drawRain(time, 320, 'rgba(170,160,225,0.40)', 0.20, w.color);
      else if (w.id === 'lightning') drawLightning(time, w.color);
      else if (w.id === 'heat') drawHeat(time, w.color);
    }

    if (flash > 0) {
      const k = flash / C.weather.fadeSec;
      const c = w ? w.color : '#cfe3ff';
      ctx.globalAlpha = k * 0.45;
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawRain(time, n, streak, tint, color) {
    ctx.fillStyle = rgba(color, tint);
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = streak;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const lean = W * 0.06;
    for (let i = 0; i < n; i++) {
      const sp = 900 + (i % 7) * 190;
      const x = ((i * 977) % 1000) / 1000 * (W + lean) - lean;
      const y = ((i * 613) % 1000) / 1000 * H + time * sp;
      const py = y % (H + 80) - 40;
      const len = 16 + (i % 5) * 7;
      ctx.moveTo(x, py);
      ctx.lineTo(x + lean * (len / 60), py + len);
    }
    ctx.stroke();
  }

  function drawLightning(time, color) {
    ctx.fillStyle = 'rgba(8,10,20,0.55)';
    ctx.fillRect(0, 0, W, H);

    const beat = (time * 3) % 1;
    const strike = beat < 0.09 ? 1 - beat / 0.09 : 0;
    if (strike > 0) {
      ctx.fillStyle = rgba(color, 0.30 * strike);
      ctx.fillRect(0, 0, W, H);

      const seed = Math.floor(time * 3);
      let x = ((seed * 7919) % 1000) / 1000 * W;
      ctx.strokeStyle = rgba(color, 0.9 * strike);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x, -10);
      for (let y = 0; y < H; y += H / 9) {
        x += (((seed * 31 + y) % 100) / 100 - 0.5) * 90;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function drawHeat(time, color) {
    ctx.fillStyle = rgba(color, 0.13);
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rgba(color, 0.05);
    for (let i = 0; i < 9; i++) {
      const y = ((i * 137 + time * 26) % (H + 60)) - 30;
      const h = 10 + (i % 3) * 7;
      ctx.fillRect(0, y + Math.sin(time * 1.4 + i) * 4, W, h);
    }
  }

  const wx2 = { k: 0, id: null, loc: null, spl: [], acc: 0, strikes: [], sparks: [], next: 0 };
  const LAB_AREA = 595 * 335;
  R.wxFx = function () { return wx2; };
  function wxHash(i, k) { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); }
  function wxSmooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  function drawWeather2(time, dt, F) {
    const w = GG.sim.weather(), want = w ? w.id : null;
    if (wx2.loc !== S.g.loc) {
      wx2.loc = S.g.loc; wx2.k = 0; wx2.id = null; wx2.spl = []; wx2.strikes = []; wx2.sparks = [];
      wx2.lt0 = undefined; wx2.lastP = undefined;
    }

    const ramp = F.rampSec || 1.6;
    const stepIn = dt / Math.max(0.05, F.rampIn || ramp), stepOut = dt / Math.max(0.05, F.rampOut || ramp);
    if (!wx2.id && want) wx2.id = want;
    if (wx2.id && want === wx2.id) wx2.k = Math.min(1, wx2.k + stepIn);
    else if (wx2.id) {
      wx2.k = Math.max(0, wx2.k - stepOut);
      if (wx2.k <= 0) { wx2.id = want; wx2.spl = []; wx2.strikes = []; wx2.sparks = []; wx2.lt0 = undefined; wx2.lastP = undefined; }
    }
    if (!wx2.id || wx2.k <= 0) return;
    const ev = (C.weather.events || []).find(e => e.id === wx2.id);
    const color = ev ? ev.color : '#cfe3ff', k = wxSmooth(wx2.k);
    const mul = Math.max(1, Math.min(F.densityMax || 1, (W * H) / LAB_AREA));
    ctx.save();
    if (wx2.id === 'rain' && F.rain) wxRain(time, dt, k, mul);
    else if (wx2.id === 'storm' && F.storm) { wxStorm(time, dt, k, mul); wxRadStorm(time, dt, k, mul); }
    else if (wx2.id === 'lightning' && F.lightning) wxLightning(time, dt, k, mul, F);
    else if (wx2.id === 'heat' && F.heat) wxHeat(time, k, mul, F);
    else {
      ctx.globalAlpha = k;
      if (wx2.id === 'rain') drawRain(time, 150, 'rgba(150,200,235,0.34)', 0.10, color);
      else if (wx2.id === 'storm') drawRain(time, 320, 'rgba(170,160,225,0.40)', 0.20, color);
      else if (wx2.id === 'lightning') drawLightning(time, color);
      else if (wx2.id === 'heat') drawHeat(time, color);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function wxStreaks(time, o) {
    const n = Math.round(o.n);
    if (n <= 0) return;
    ctx.strokeStyle = 'rgba(' + o.col + ',' + o.a + ')'; ctx.lineWidth = o.w; ctx.lineCap = 'round';
    ctx.beginPath();
    const span = W + H * Math.abs(o.slope) + 60;
    for (let i = 0; i < n; i++) {
      const sp = o.sp * (0.8 + wxHash(i, o.seed + 1) * 0.4);
      const L = o.len * (0.75 + wxHash(i, o.seed + 3) * 0.5);
      const y = (wxHash(i, o.seed + 2) * (H + 80) + time * sp) % (H + 80) - 40;
      const x = wxHash(i, o.seed) * span - H * Math.max(0, o.slope) - 30 + y * o.slope;
      ctx.moveTo(x, y); ctx.lineTo(x + L * o.slope, y + L);
    }
    ctx.stroke();
  }

  function wxSplashes(dt, rate, k, col, stretch) {
    wx2.acc += rate * dt * k;
    const cam = S.g.camera, ms = wx2.acc >= 1 ? S.machinesHere() : null;
    while (wx2.acc >= 1) {
      wx2.acc -= 1;
      let x = Math.random() * W, y = H * (0.08 + Math.random() * 0.92);
      if (ms && ms.length && Math.random() < 0.35) {
        const n = ms[Math.floor(Math.random() * ms.length)], s = S.sizeOf(n);
        const p = R.toScreen(n.x - s.w / 2 + Math.random() * s.w, n.y - s.h / 2 + Math.random() * s.h);
        if (p.x > 0 && p.x < W && p.y > 0 && p.y < H) { x = p.x; y = p.y; }
      }
      if (wx2.spl.length < 400) wx2.spl.push({ x: x, y: y, t: 0, life: 0.32 + Math.random() * 0.12,
        s: (0.8 + Math.random() * 0.5) * Math.max(0.7, Math.min(1.2, cam.scale || 1)) });
    }
    ctx.lineWidth = 1;
    for (let i = wx2.spl.length - 1; i >= 0; i--) {
      const p = wx2.spl[i]; p.t += dt;
      const f = p.t / p.life;
      if (f >= 1 || f < 0) { wx2.spl.splice(i, 1); continue; }
      const rad = (1.5 + 6 * f) * p.s, al = 0.5 * (1 - f) * k;
      ctx.strokeStyle = 'rgba(' + col + ',' + al + ')';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, rad * (stretch || 1), rad * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
      if (f < 0.6) {
        const hop = Math.sin(f / 0.6 * Math.PI) * 5 * p.s;
        ctx.fillStyle = 'rgba(' + col + ',' + al + ')';
        ctx.fillRect(p.x - rad * 1.3, p.y - hop, 1.3, 1.3); ctx.fillRect(p.x + rad * 1.2, p.y - hop * 0.8, 1.3, 1.3);
      }
    }
  }
  function wxRain(time, dt, k, mul) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(30,60,95,' + 0.26 * k + ')'); g.addColorStop(1, 'rgba(55,105,145,' + 0.09 * k + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    wxStreaks(time, { n: 120 * k * mul, sp: 520, len: 9, w: 0.8, a: 0.20, col: '170,205,235', slope: 0.10, seed: 10 });
    wxStreaks(time, { n: 70 * k * mul, sp: 880, len: 17, w: 1.1, a: 0.30, col: '180,212,240', slope: 0.10, seed: 20 });
    wxStreaks(time, { n: 24 * k * mul, sp: 1350, len: 32, w: 1.7, a: 0.42, col: '205,228,248', slope: 0.10, seed: 30 });
    wxSplashes(dt, 36 * mul, k, '205,228,248', 1);
  }
  function wxGust(t) { return Math.max(0, Math.min(1, 0.5 + 0.32 * Math.sin(t * 0.9) + 0.18 * Math.sin(t * 2.3 + 1))); }
  function wxStorm(time, dt, k, mul) {
    const gs = wxGust(time);
    ctx.fillStyle = 'rgba(10,8,28,' + 0.26 * k + ')'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(62,48,125,' + 0.30 * k + ')'); g.addColorStop(1, 'rgba(40,32,90,' + 0.08 * k + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const clouds = Math.round(6 * Math.sqrt(mul));
    for (let j = 0; j < clouds; j++) {
      const rx = 150 + wxHash(j, 53) * 150;
      const x = ((wxHash(j, 50) * (W + 2 * rx) + time * (30 + wxHash(j, 51) * 25)) % (W + 2 * rx)) - rx;
      const y = wxHash(j, 52) * H * 0.34 - 10;
      ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.4);
      const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      cg.addColorStop(0, 'rgba(12,9,30,' + 0.70 * k + ')'); cg.addColorStop(1, 'rgba(12,9,30,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    const slope = 0.22 + 0.5 * gs;
    wxStreaks(time, { n: 160 * k * mul, sp: 720, len: 12, w: 0.9, a: 0.22, col: '185,175,235', slope: slope, seed: 40 });
    wxStreaks(time, { n: 105 * k * mul, sp: 1120, len: 22, w: 1.2, a: 0.32, col: '198,190,240', slope: slope, seed: 50 });
    wxStreaks(time, { n: 40 * k * mul, sp: 1650, len: 40, w: 1.9, a: 0.44, col: '218,212,248', slope: slope, seed: 60 });
    ctx.lineCap = 'round';
    const lines = Math.round(8 * Math.sqrt(mul));
    for (let j = 0; j < lines; j++) {
      const ph = (time * 0.5 + wxHash(j, 40)) % 1;
      if (ph > 0.4) continue;
      const p = ph / 0.4, len = 70 + wxHash(j, 42) * 130;
      const x = -len + p * (W + 2 * len), y = H * (0.08 + wxHash(j, 41) * 0.84);
      ctx.strokeStyle = 'rgba(225,220,250,' + 0.22 * gs * k * Math.sin(p * Math.PI) + ')'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len * 0.5, y - 5, x + len, y + 2); ctx.stroke();
    }
    wxSplashes(dt, 44 * mul, k, '215,210,248', 1.3 + gs * 0.6);
  }

  const rad = { specks: [], loc: null };
  R.radWaste = function (loc) {
    const o = C.weather.radStorm || {}, ss = S.sites().filter(s => s.loc === loc && s.type === o.site);
    if (!ss.length) return 0;
    const full = s => Math.max(s.full || 0, (C.nodeTypes[s.type] || {}).reserve || 1);
    return ss.reduce((a, s) => a + Math.max(0, s.reserve || 0), 0) / ss.reduce((a, s) => a + full(s), 0);
  };
  function wxRadStorm(time, dt, k, mul) {
    const o = C.weather.radStorm;
    if (!o || !o.enabled || (o.locs || []).indexOf(S.g.loc) < 0) return;
    if (rad.loc !== S.g.loc) { rad.loc = S.g.loc; rad.specks = []; }
    const left = R.radWaste(S.g.loc);
    if (left <= 1e-6) { rad.specks = []; return; }
    k *= o.fade ? 0.25 + 0.75 * Math.sqrt(left) : 1;
    const gs = wxGust(time), slope = 0.22 + 0.5 * gs, G1 = '170,255,96', G2 = '226,255,170';
    const dens = Math.max(1, (W * H) / 900000);
    ctx.save();
    if (o.sky > 0) {
      const a = o.sky * k;
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = 'rgba(110,190,50,' + (0.42 * a).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(90,150,30,' + (0.16 * a).toFixed(3) + ')');
      g.addColorStop(0.6, 'rgba(60,110,20,' + (0.04 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(60,110,20,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    if (o.plume > 0) {
      const sc = S.g.camera.scale, a = o.plume * k;
      S.sitesHere().forEach((s, si) => {
        if (s.type !== o.site || !((s.reserve || 0) > 1e-6)) return;
        const fill = Math.min(1, (s.reserve || 0) / Math.max(s.full || 0, (C.nodeTypes[s.type] || {}).reserve || 1));
        const b = S.siteBox(s), c = R.toScreen(s.x, s.y), bw = b.w * sc, bh = b.h * sc;
        const pulse = 0.75 + 0.25 * Math.sin(time * 3.1 + si);
        const halo = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.max(bw, bh) * 0.85);
        halo.addColorStop(0, 'rgba(' + G1 + ',' + (0.16 * a * pulse * (0.5 + 0.5 * fill)).toFixed(3) + ')');
        halo.addColorStop(1, 'rgba(' + G1 + ',0)');
        ctx.fillStyle = halo; ctx.fillRect(c.x - bw * 1.5, c.y - bh * 1.5, bw * 3, bh * 3);
        for (let j = 0; j < 9; j++) {
          const ph = (time * (0.16 + wxHash(j, si + 4) * 0.08) + wxHash(j, si)) % 1;
          const x0 = c.x + (wxHash(j, si + 1) - 0.5) * bw * 0.8, y0 = c.y + (wxHash(j, si + 2) - 0.3) * bh * 0.6;
          const x = x0 + ph * (120 + 260 * gs) * sc * 1.6, y = y0 - ph * 150 * sc;
          const r = (30 + ph * 90) * sc * (0.7 + wxHash(j, si + 3) * 0.6);
          const al = Math.sin(ph * Math.PI) * 0.14 * a * (0.4 + 0.6 * fill);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, 'rgba(' + G1 + ',' + al.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + G1 + ',0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
      });
    }
    if (o.rain > 0) {
      const n = Math.round(70 * o.rain * k * dens), span = W + H * slope + 60;
      ctx.lineCap = 'round';
      [[1.2, 0.20, 18, 900, 0], [2.2, 0.10, 26, 1250, 1]].forEach(L => {
        ctx.strokeStyle = 'rgba(' + G1 + ',' + L[1] + ')'; ctx.lineWidth = L[0];
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const sp = L[3] * (0.8 + wxHash(i, 71 + L[4]) * 0.4), len = L[2] * (0.75 + wxHash(i, 73 + L[4]) * 0.5);
          const y = (wxHash(i, 72 + L[4]) * (H + 80) + time * sp) % (H + 80) - 40;
          const x = wxHash(i, 70 + L[4]) * span - H * slope - 30 + y * slope;
          ctx.moveTo(x, y); ctx.lineTo(x + len * slope, y + len);
        }
        ctx.stroke();
      });
    }

    const want = o.fall > 0 ? Math.round(110 * o.fall * k * dens) : 0, wind = 70 + 160 * gs, P = rad.specks;
    while (P.length < want) P.push({ x: Math.random() * W, y: Math.random() * H, s: 0.6 + Math.random() * 1.6,
      v: 0.6 + Math.random() * 0.8, ph: Math.random() * 6.3, life: 0 });
    if (P.length > want) P.length = want;
    P.forEach((p, i) => {
      p.x += wind * p.v * dt; p.y += (18 + 26 * p.v) * dt + Math.sin(time * 2 + p.ph) * 12 * dt; p.life += dt;
      if (p.x > W + 10) { p.x = -10; p.y = Math.random() * H; p.life = 0; }
      if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; p.life = 0; }
      const a = 0.7 * (0.55 + 0.45 * Math.sin(time * (5 + (i % 7)) + p.ph)) * Math.min(1, p.life * 2) * k, r = p.s * 2.6;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, 'rgba(' + G2 + ',' + a.toFixed(3) + ')'); g.addColorStop(0.4, 'rgba(' + G1 + ',' + (a * 0.5).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + G1 + ',0)');
      ctx.fillStyle = g; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
    });
    ctx.restore();
  }
  function wxBolt(x0, y0, x1, y1, disp, depth) {
    let pts = [{ x: x0, y: y0 }, { x: x1, y: y1 }];
    for (let d = 0; d < depth; d++) {
      const nx = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        nx.push({ x: (a.x + b.x) / 2 + (Math.random() - 0.5) * disp,
                  y: (a.y + b.y) / 2 + (Math.random() - 0.5) * disp * 0.25 }, b);
      }
      pts = nx; disp *= 0.55;
    }
    return pts;
  }
  function wxLine(pts) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); }
  function wxLightning(time, dt, k, mul, F) {
    ctx.fillStyle = 'rgba(6,8,18,' + 0.42 * k + ')'; ctx.fillRect(0, 0, W, H);
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, Math.hypot(W, H) / 2);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,' + 0.38 * k + ')');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    wxStreaks(time, { n: 60 * k * mul, sp: 700, len: 10, w: 0.8, a: 0.14, col: '200,205,225', slope: 0.08, seed: 70 });

    const strike = function (t, small) {
      let x0 = W * (0.15 + 0.7 * Math.random()), x1 = x0 + (Math.random() - 0.5) * W * 0.25;
      let y1 = H * (0.62 + 0.3 * Math.random());

      const aim = typeof R.boltAim === 'function' ? R.boltAim() : null;
      if (aim) { x1 = aim.x; y1 = aim.y; x0 = x1 + (Math.random() - 0.5) * W * 0.12; }
      const main = wxBolt(x0, -10, x1, y1, W * 0.09, 6), branches = [];
      for (let b = 0; b < (small ? 1 : 2); b++) {
        const p = main[Math.floor(main.length * (0.3 + Math.random() * 0.35))];
        branches.push(wxBolt(p.x, p.y, p.x + (Math.random() - 0.5) * W * 0.3, p.y + H * (0.1 + 0.18 * Math.random()), W * 0.05, 5));
      }
      wx2.strikes.push({ t: t, main: main, branches: branches, hit: { x: x1, y: y1 }, m: small ? 0.5 : 1 });
      for (let i = 0; i < (small ? 6 : 16); i++) wx2.sparks.push({ x: x1, y: y1, vx: (Math.random() - 0.5) * 240,
        vy: -(60 + Math.random() * 170), life: 0.45 + Math.random() * 0.4, age: -0.09 });
    };
    const TS = F.thunderSync;
    if (TS && TS.enabled) {

      const clk = GG.audio && GG.audio.ambienceClock ? GG.audio.ambienceClock() : null;
      let P;
      if (clk && clk.id === 'lightning') P = clk.t;
      else if (clk && clk.id === 'lightningEnd') P = TS.firstLen + clk.t;
      else { if (wx2.lt0 === undefined) wx2.lt0 = time; P = time - wx2.lt0; }
      if (wx2.lastP === undefined || P < wx2.lastP) wx2.lastP = P - 1e-6;

      if (P - wx2.lastP > 0.5) wx2.lastP = P - 1e-6;
      const at0 = 0.09 - (TS.offset || 0);
      TS.claps.forEach(function (c) {
        const at = c[0] - at0;
        if (wx2.lastP < at && P >= at && k > 0.3) strike(time, !c[1]);
      });
      wx2.lastP = P;
    } else {
      const gap = F.strikeGap || [2.6, 5];
      if (!(wx2.next > time - 10)) wx2.next = time + 0.8;
      while (time >= wx2.next) {
        if (k > 0.5) strike(wx2.next, false);
        wx2.next += gap[0] + Math.random() * (gap[1] - gap[0]);
      }
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = wx2.strikes.length - 1; i >= 0; i--) {
      const st = wx2.strikes[i], s = time - st.t;
      if (s > 1.5 || s < 0) { if (s > 1.5 || s < -1) wx2.strikes.splice(i, 1); continue; }
      if (s < 0.05) { ctx.strokeStyle = 'rgba(240,230,150,0.25)'; ctx.lineWidth = 1; wxLine(st.main); }
      if (s >= 0.09 && s < 1.3) {
        const b = 1 - (s - 0.09) / 1.21;
        const hg = ctx.createRadialGradient(st.hit.x, st.hit.y, 0, st.hit.x, st.hit.y, 70);
        hg.addColorStop(0, 'rgba(255,238,160,' + 0.38 * b + ')'); hg.addColorStop(1, 'rgba(255,238,160,0)');
        ctx.fillStyle = hg; ctx.fillRect(st.hit.x - 70, st.hit.y - 70, 140, 140);
      }
      if (s >= 0.09 && s < 0.5) {
        const a = 1 - (s - 0.09) / 0.41;
        const m = st.m || 1;
        ctx.fillStyle = 'rgba(235,230,205,' + 0.13 * a * a * m + ')'; ctx.fillRect(0, 0, W, H);
        ctx.shadowColor = 'rgba(240,226,74,0.9)'; ctx.shadowBlur = 16 * m;
        ctx.strokeStyle = 'rgba(250,240,160,' + 0.55 * a * m + ')'; ctx.lineWidth = 3.4 * m; wxLine(st.main);
        ctx.lineWidth = 2 * m; st.branches.forEach(wxLine);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,253,235,' + a + ')'; ctx.lineWidth = 1.4 * (0.6 + 0.4 * m); wxLine(st.main);
        ctx.lineWidth = 0.8; st.branches.forEach(wxLine);
      }
    }
    ctx.lineWidth = 1.2;
    for (let i = wx2.sparks.length - 1; i >= 0; i--) {
      const p = wx2.sparks[i]; p.age += dt;
      if (p.age < 0) continue;
      if (p.age > p.life) { wx2.sparks.splice(i, 1); continue; }
      p.vy += 380 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.strokeStyle = 'rgba(255,240,170,' + (1 - p.age / p.life) + ')';
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025); ctx.stroke();
    }
  }

  let wxHeatBuf = null;

  function wxWedge(sx, sy, an, w, len, a) {
    const g = ctx.createLinearGradient(sx, sy, sx + Math.cos(an) * len, sy + Math.sin(an) * len);
    g.addColorStop(0, 'rgba(255,215,150,0)'); g.addColorStop(0.08, 'rgba(255,215,150,' + a + ')');
    g.addColorStop(1, 'rgba(255,215,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(an - w / 2) * len, sy + Math.sin(an - w / 2) * len);
    ctx.lineTo(sx + Math.cos(an + w / 2) * len, sy + Math.sin(an + w / 2) * len); ctx.closePath(); ctx.fill();
  }
  function wxHeat(time, k, mul, F) {
    const o = F.heatWobble || { a0: 0.15, a1: 0.65, speed: 0.5 };
    if (o.a1 > 0) {
      const Wd = cv.width, Hd = cv.height, d = Wd / Math.max(1, W);
      if (!wxHeatBuf || wxHeatBuf.width !== Wd || wxHeatBuf.height !== Hd) {
        wxHeatBuf = document.createElement('canvas'); wxHeatBuf.width = Wd; wxHeatBuf.height = Hd;
      }
      const b = wxHeatBuf.getContext('2d');
      b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, Wd, Hd); b.drawImage(cv, 0, 0);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const strip = Math.max(2, Math.round(3 * d)), sp = o.speed || 1;
      for (let y = 0; y < Hd; y += strip) {
        const yc = y / d, amp = (o.a0 + (o.a1 - o.a0) * (yc / H)) * d * k;
        const off = Math.sin(yc * 0.045 + time * 2.6 * sp) * amp + Math.sin(yc * 0.11 - time * 1.7 * sp) * amp * 0.4;
        ctx.drawImage(wxHeatBuf, 0, y, Wd, strip, off, y, Wd, strip);
      }
      ctx.restore();
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(240,144,74,' + 0.05 * k + ')'); g.addColorStop(1, 'rgba(240,118,50,' + 0.17 * k + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const sx = W * 0.93, sy = -H * 0.06, rad = H * 0.95, pulse = 0.9 + 0.1 * Math.sin(time * 0.8);
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
    sg.addColorStop(0, 'rgba(255,220,150,' + 0.42 * k * pulse + ')'); sg.addColorStop(0.35, 'rgba(255,175,95,' + 0.12 * k + ')');
    sg.addColorStop(1, 'rgba(255,160,80,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    if (F.heatRays === 'soft') {

      for (let j = 0; j < 11; j++) {
        const an = 1.62 + wxHash(j, 90) * 0.95 + Math.sin(time * 0.07 + j * 2.1) * 0.025;
        const w = 0.025 + wxHash(j, 91) * 0.06, len = rad * (0.9 + wxHash(j, 92) * 0.7);
        const a = 0.1 * k * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * (0.35 + wxHash(j, 93) * 0.3) + j * 1.7)));
        wxWedge(sx, sy, an, w, len, a * 0.45);
        wxWedge(sx, sy, an, w * 0.55, len * 0.95, a * 0.45);
        wxWedge(sx, sy, an, w * 0.22, len * 0.9, a * 0.5);
      }
    } else {
      for (let j = 0; j < 6; j++) {
        const an = Math.PI * 0.55 + j * 0.13 + Math.sin(time * 0.15 + j) * 0.03;
        const rg = ctx.createLinearGradient(sx, sy, sx + Math.cos(an) * rad * 1.2, sy + Math.sin(an) * rad * 1.2);
        rg.addColorStop(0, 'rgba(255,215,150,' + 0.07 * k + ')'); rg.addColorStop(1, 'rgba(255,215,150,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(an - 0.035) * rad * 1.3, sy + Math.sin(an - 0.035) * rad * 1.3);
        ctx.lineTo(sx + Math.cos(an + 0.035) * rad * 1.3, sy + Math.sin(an + 0.035) * rad * 1.3); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
    const motes = Math.round(28 * mul);
    for (let j = 0; j < motes; j++) {
      const y = H - ((wxHash(j, 80) * (H + 20) + time * (12 + wxHash(j, 81) * 16)) % (H + 20));
      const x = wxHash(j, 82) * W + Math.sin(time * 0.6 + j) * 10;
      ctx.fillStyle = 'rgba(255,205,150,' + 0.22 * k * Math.min(1, y / H * 1.4) + ')';
      ctx.beginPath(); ctx.arc(x, y, 1 + wxHash(j, 83) * 1.4, 0, Math.PI * 2); ctx.fill();
    }
  }

  let gridDot = null, baseT = null;

  function drawGridDots() {
    const G = gridDot, D = C.world.gridDots; gridDot = null;
    if (!G || !D || !baseT) return;
    const m = /rgba?\(([^)]+)\)/.exec(G.col || ''), p = m ? m[1].split(',').map(s => s.trim()) : ['120', '160', '190', '0.05'];
    const a = Math.min(D.max || 0.55, (+p[3] || 0.05) * (D.strength || 4.5)), r = Math.max(0.8, Math.min(1.6, G.step / 28));
    ctx.save(); ctx.setTransform(baseT);
    ctx.fillStyle = 'rgba(' + p.slice(0, 3).join(',') + ',' + a.toFixed(3) + ')';
    for (let x = G.ox; x < W; x += G.step) for (let y = G.oy; y < H; y += G.step) ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
  function drawAir(time) { if (GG.gas && baseT) GG.gas.draw(ctx, baseT, S.g.camera, W, H, time, nightK); }
  function drawGrid(cam) {
    gridDot = null;
    const step = C.world.grid * cam.scale;
    if (step < 6) return;
    const ox = (W / 2 - cam.x * cam.scale) % step;
    const oy = (H / 2 - cam.y * cam.scale) % step;
    ctx.strokeStyle = R.reviveOn()
      ? (strongOn() ? gridBlend(R.reviveK())
                    : (R.reviveK() > 0.5 ? C.revive.grid.clean : C.revive.grid.dirty))
      : (C.heal && C.heal.enabled)
        ? (R.healK() > 0.5 ? C.heal.grid.clean : C.heal.grid.dirty)
        : 'rgba(120,160,190,0.05)';

    const hot = ((C.ui || {}).gridSnap || {}).hot || 0;
    if (hot > 0 && GG.input && GG.input.snapping && GG.input.snapping()) {
      ctx.strokeStyle = 'rgba(120,160,190,' + hot + ')';
    }

    if (R.gridDraw && R.gridDraw(ctx, cam, step, ox, oy, W, H, ctx.strokeStyle)) return;

    const GD = C.world.gridDots, GS = (C.ui || {}).gridStyle || {};
    const dots = GD && GD.enabled && GS.enabled !== false && ((GG.menu && GG.menu.gridStyle) || GS.def) === 'dots';
    if (dots) { gridDot = { col: ctx.strokeStyle, step: step, ox: ox, oy: oy }; return; }
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = ox; x < W; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (let y = oy; y < H; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.stroke();
  }

  function lerpCol(a, b, k) {
    if (typeof a !== 'string' || typeof b !== 'string' || a === b) return a;
    if (a[0] === '#' && b[0] === '#' && a.length === 7 && b.length === 7) {
      let out = '#';
      for (let i = 1; i < 7; i += 2) {
        const va = parseInt(a.substr(i, 2), 16), vb = parseInt(b.substr(i, 2), 16);
        out += ('0' + Math.round(va + (vb - va) * k).toString(16)).slice(-2);
      }
      return out;
    }
    const NUM = /-?\d*\.?\d+/g;
    const na = a.match(NUM), nb = b.match(NUM);
    if (!na || !nb || na.length !== nb.length) return a;
    let i = 0;
    return a.replace(NUM, function (tok) {
      const va = +na[i], vb = +nb[i]; i++;
      const v = va + (vb - va) * k;
      return tok.indexOf('.') >= 0 ? v.toFixed(3) : String(Math.round(v));
    });
  }

  const skinCache = new Map();

  const siteDigAt = new Map();
  function siteDigging(s, time) {
    let st = siteDigAt.get(s.id);
    if (!st) { st = { r: s.reserve, t: -1e9 }; siteDigAt.set(s.id, st); }
    if (s.reserve < st.r - 1e-9) st.t = time;
    st.r = s.reserve;
    return time - st.t < 0.6;
  }
  function drawTrashFill(s, x, y, w, h, topY, frac, time, SF, surf) {
    const clean = 1 - frac;
    if (SF.fill) {
      const fg = ctx.createLinearGradient(0, topY, 0, y + h);
      fg.addColorStop(0, SF.fill[0]); fg.addColorStop(1, SF.fill[1]);
      ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(x, y + h);
      for (const px of spanSteps(w, 8)) ctx.lineTo(x + px, surf(px));
      ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
    }
    if (topY > y + 1) {
      ctx.fillStyle = 'rgba(70,110,72,' + (0.12 * clean).toFixed(3) + ')';
      ctx.fillRect(x, y, w, topY - y + 3);
    }
    const dg = ctx.createLinearGradient(0, topY, 0, y + h);
    dg.addColorStop(0, 'rgba(20,12,4,0)'); dg.addColorStop(1, 'rgba(20,12,4,0.3)');
    ctx.fillStyle = dg; ctx.fillRect(x, topY - 4, w, y + h - topY + 4);
    const style = SF.style || 'calm';
    if (style === 'calm') {
      ctx.strokeStyle = 'rgba(235,195,130,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath();
      for (const px of spanSteps(w, 8)) { const py = surf(px) + 1; px ? ctx.lineTo(x + px, py) : ctx.moveTo(x + px, py); }
      ctx.stroke();
    } else if (style === 'layers') {
      const band = function (top, a0, a1) {
        const g = ctx.createLinearGradient(0, top, 0, y + h);
        g.addColorStop(0, 'rgba(70,48,25,' + a0 + ')'); g.addColorStop(1, 'rgba(50,34,18,' + a1 + ')');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y + h);
        for (const px of spanSteps(w, 8)) ctx.lineTo(x + px, top + Math.sin(px * 0.05 + time * 0.7 + top * 0.01) * 2.5);
        ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
      };
      band(topY + (y + h - topY) * 0.38, 0.28, 0.34);
      band(topY + (y + h - topY) * 0.72, 0.34, 0.42);
      const n = Math.round(w * (y + h - topY) / 3500);
      ctx.fillStyle = 'rgba(210,180,130,0.32)';
      for (let i = 0; i < n; i++) {
        const px = x + ((wxHash(i, 40) * w + time * (4 + wxHash(i, 41) * 6)) % w);
        const py = topY + 8 + wxHash(i, 42) * Math.max(0, y + h - topY - 12) + Math.sin(time + i) * 2;
        ctx.fillRect(px, py, 2.4, 2.4);
      }
    } else if (style === 'stirred' && siteDigging(s, time)) {
      const cols = ['#8a6d45', '#6f7a84', '#5b7fa0', '#4f8a5a'], n = Math.max(4, Math.round(w / 24));
      for (let i = 0; i < n; i++) {
        const px = x + 10 + wxHash(i, 50) * (w - 20), py = surf(px - x) - 2;
        ctx.save(); ctx.translate(px, py); ctx.rotate(Math.sin(time * 1.5 + i) * 0.4);
        ctx.fillStyle = cols[i % 4]; ctx.fillRect(-4, -2, 8, 4); ctx.restore();
      }
      ctx.lineWidth = 1.4;
      S.onSiteMachines(s).forEach(function (m, j) {
        for (let k = 0; k < 3; k++) {
          const ph = (time * 0.8 + k / 3 + j * 0.17) % 1, r = 8 + ph * 60;
          ctx.strokeStyle = 'rgba(235,200,140,' + (0.5 * (1 - ph)).toFixed(3) + ')';
          ctx.beginPath(); ctx.ellipse(m.x, surf(m.x - x), r, r * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
        }
      });
    }
  }

  function surfY(px, time, PW, stir) {
    if (!PW) return Math.sin(px * 0.045 + time * 1.1) * 3.2;
    const a = PW.amp * (1 + (PW.stir || 0) / Math.max(1e-6, PW.amp) * (stir || 0));
    return Math.sin(px * 0.045 + time * PW.speed) * a +
           Math.sin(px * 0.017 - time * PW.speed * 0.7) * a * 0.35 * (stir || 0);
  }

  function mixSkin(sk, k) {
    if (!sk || !sk.clean) return sk;
    k = Math.max(0, Math.min(1, k || 0));
    const q = Math.round(k * 100);
    let hit = skinCache.get(sk);
    if (hit && hit.q === q) return hit.v;
    const out = {};
    Object.keys(sk).forEach(function (key) {
      if (key === 'clean') return;
      out[key] = sk.clean[key] === undefined ? sk[key] : lerpCol(sk[key], sk.clean[key], q / 100);
    });
    skinCache.set(sk, { q: q, v: out });
    return out;
  }
  R.mixSkin = mixSkin;

  function rockShine(s, x, y, w, h, time, ws) {
    const SH = (C.asteroid && C.asteroid.shine) || {};
    if (SH.enabled === false) return;
    const col = SH.color || '255,226,150';

    ctx.save();
    sitePath(s, { w: w, h: h }, ws); ctx.clip();

    if (SH.sweep) {
    const period = SH.sec || 3.4, cross = SH.sweepSec || 0.9;
    const ph = (time % period) / cross;
    if (ph <= 1) {
      const band = (SH.width || 0.30) * (w + h);
      const span = w + h + band * 2;
      const at = -band + ph * span;
      const g = ctx.createLinearGradient(x + at - band, y, x + at + band, y + h);
      g.addColorStop(0, 'rgba(' + col + ',0)');
      g.addColorStop(0.5, 'rgba(' + col + ',' + (SH.alpha || 0.26) + ')');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    }
    }

    const n = SH.glints === undefined ? 5 : SH.glints;
    if (n > 0) {
      let hash = 0;
      const id = String(s.id || '');
      for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
      const rnd = i => { const v = Math.sin(hash * 0.0001 + i * 12.9898) * 43758.5453;
                         return v - Math.floor(v); };
      const size = SH.glintSize || 8;

      ctx.fillStyle = 'rgba(' + col + ',1)';
      for (let i = 0; i < n; i++) {

        const inner = SH.glintInner === undefined ? 0.30 : SH.glintInner;
        const outer = SH.glintOuter === undefined ? 0.94 : SH.glintOuter;
        const ang = (i + rnd(i) * 0.85) * (6.2832 / n);
        const rad = inner + rnd(i + 99) * (outer - inner);
        const gx = x + w / 2 + Math.cos(ang) * (w / 2) * rad;
        const gy = y + h / 2 + Math.sin(ang) * (h / 2) * rad;
        const beat = (time * (0.6 + rnd(i + 7) * 0.5) + rnd(i + 13) * 6.283) % 6.283;
        const k = Math.max(0, Math.sin(beat));
        const a = k * k * (SH.glintAlpha === undefined ? 0.5 : SH.glintAlpha);
        if (a < 0.02) continue;

        const vr = SH.glintSizeVar === undefined ? 0.35 : SH.glintSizeVar;
        const own = size * (1 + (rnd(i + 41) * 2 - 1) * vr);
        const r = own * (0.45 + k * 0.55);
        const waist = r * (SH.glintWaist || 0.16);

        if (SH.glintGlow) {
          const gr = r * SH.glintGlow;
          const halo = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
          halo.addColorStop(0, 'rgba(' + col + ',' + (a * (SH.glowAlpha || 0.45)).toFixed(3) + ')');
          halo.addColorStop(1, 'rgba(' + col + ',0)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = halo;
          ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 6.2832); ctx.fill();
          ctx.fillStyle = 'rgba(' + col + ',1)';
        }
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.moveTo(gx, gy - r);
        ctx.quadraticCurveTo(gx + waist, gy - waist, gx + r, gy);
        ctx.quadraticCurveTo(gx + waist, gy + waist, gx, gy + r);
        ctx.quadraticCurveTo(gx - waist, gy + waist, gx - r, gy);
        ctx.quadraticCurveTo(gx - waist, gy - waist, gx, gy - r);
        ctx.fill();

        ctx.globalAlpha = a * 0.9;
        ctx.beginPath();
        ctx.arc(gx, gy, Math.max(0.6, r * 0.16), 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function radHash(n) { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
  function radSeed(s) {
    const id = String(s.id); let h = 7;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
    return h;
  }
  function radiationFx(s, RD, x, y, w, h, frac, time, ws) {
    const col = RD.color || '214,246,120';
    const seed = radSeed(s);
    const box = S.siteBox(s);
    const topY = y + h * (1 - frac);
    const G = RD.glow;
    const pulse = G && G.on ? 0.5 + 0.5 * Math.sin(time * 2 * Math.PI / (G.sec || 3) + seed) : 0;
    ctx.save();

    if (G && G.on) {
      ctx.strokeStyle = 'rgba(' + col + ',' + (G.edge * pulse).toFixed(3) + ')';
      ctx.lineWidth = 5;
      sitePath(s, box, ws); ctx.stroke();
    }
    sitePath(s, box, ws); ctx.clip();

    if (G && G.on) {
      const a = G.min + (G.max - G.min) * pulse;
      const cy = (topY + y + h) / 2, rr = Math.max(w, h) * 0.6;
      const gr = ctx.createRadialGradient(s.x, cy, 0, s.x, cy, rr);
      gr.addColorStop(0, 'rgba(' + col + ',' + a.toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = gr;
      ctx.fillRect(x, y, w, h);
    }

    const MO = RD.motes;
    if (MO && MO.on) {
      for (let i = 0; i < MO.count; i++) {
        const r1 = radHash(seed + i * 13.1), r2 = radHash(seed + i * 7.7), r3 = radHash(seed + i * 3.3);
        const life = MO.riseSec * (0.7 + 0.6 * r3);
        const p = ((time / life) + r2) % 1;
        const mx = x + 10 + r1 * (w - 20) + Math.sin(time * 1.3 + i) * 4;
        const my = (y + h - 6) - p * (h * 0.85);
        const a = Math.sin(p * Math.PI) * MO.alpha;
        ctx.fillStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(mx, my, MO.size * (0.6 + 0.8 * r3), 0, Math.PI * 2); ctx.fill();
      }
    }

    const SP = RD.sparks;
    if (SP && SP.on && SP.perSec > 0) {
      const per = 1 / SP.perSec;
      const slot = Math.floor((time + seed) / per), into = (time + seed) - slot * per;
      if (into < SP.sec && radHash(seed + slot * 5.1) < 0.8) {
        const k = 1 - into / SP.sec;
        const sx = x + 16 + radHash(seed + slot * 1.37) * (w - 32);
        const sy = y + 16 + radHash(seed + slot * 2.71) * (h - 32);
        const L = 4 + 7 * (1 - k);
        ctx.fillStyle = 'rgba(' + col + ',' + (0.45 * k).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(sx, sy, 3 + 5 * (1 - k), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(245,255,205,' + (0.9 * k).toFixed(3) + ')';
        ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx - L, sy); ctx.lineTo(sx + L, sy);
        ctx.moveTo(sx, sy - L); ctx.lineTo(sx, sy + L);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function lookHash(i, k) { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); }
  function poolLooks(s, phase, x, y, w, h, topY, seamY, frac, time, surf, cleanF) {
    const L = C.pool && C.pool.looks;
    if (!L || !L.enabled || (L.types || []).indexOf(s.type) < 0) return;
    const seed = (parseInt(String(s.id).replace(/\D/g, ''), 10) || 0) * 7;
    const hh = (i, k) => lookHash(i + seed, k);
    const oil = s.type === 'oilSite', TAU = Math.PI * 2, bottom = y + h;
    if (phase === 'dirty') {
      if (bottom - seamY < 14) return;
      if (oil) {
        for (let i = 0; i < 5; i++) {
          const k = (time * 0.01 + hh(i, 41)) % 1, px = 20 + k * (w - 40), py = seamY + 12 + hh(i, 42) * (bottom - seamY - 20);
          ctx.fillStyle = 'rgba(20,14,6,0.22)';
          ctx.beginPath(); ctx.ellipse(x + px, py, 14 + hh(i, 43) * 12, 4 + hh(i, 44) * 3, 0, 0, TAU); ctx.fill();
        }
        const cols = ['rgba(140,100,220,0.30)', 'rgba(70,180,200,0.30)', 'rgba(180,210,90,0.26)', 'rgba(230,150,70,0.30)'];
        for (let i = 0; i < 6; i++) {
          const k = (time * (0.008 + hh(i, 51) * 0.006) + hh(i, 52)) % 1;
          const cx = x + 16 + k * (w - 32), cy = seamY + 10 + hh(i, 53) * (bottom - seamY - 20);
          const rx = 16 + hh(i, 54) * 18, ry = 2 + hh(i, 55) * 2.5;
          const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
          cols.forEach((c, j) => g.addColorStop(j / 3, c));
          ctx.globalAlpha = Math.sin(k * Math.PI); ctx.strokeStyle = g; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, Math.sin(i) * 0.12, 0, TAU); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else {
        for (let i = 0; i < 4; i++) {
          const k = (time * 0.009 + hh(i, 61)) % 1, px = 20 + k * (w - 40), py = seamY + 12 + hh(i, 62) * (bottom - seamY - 22);
          const g = ctx.createRadialGradient(x + px, py, 0, x + px, py, 22 + hh(i, 63) * 14);
          g.addColorStop(0, 'rgba(40,52,16,0.30)'); g.addColorStop(1, 'rgba(40,52,16,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + px, py, 36, 0, TAU); ctx.fill();
        }
        for (let i = 0; i < 10; i++) {
          const k = (time * (0.08 + hh(i, 21) * 0.06) + hh(i, 22)) % 1;
          const bx = x + 14 + hh(i, 23) * (w - 28) + Math.sin(time * 2 + i) * 1.5, by = bottom - 6 - k * (bottom - seamY - 10);
          ctx.strokeStyle = 'rgba(210,228,150,' + (0.45 * Math.sin(k * Math.PI)).toFixed(3) + ')'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(bx, by, 1.2 + hh(i, 24) * 1.6, 0, TAU); ctx.stroke();
        }
      }
    } else if (phase === 'clean') {
      if (seamY - topY < 14) return;
      const CL = C.pool.clean || {}, k0 = CL.strength === undefined ? 1 : CL.strength;
      if (CL.rays) cleanRays(x, w, topY, seamY, time, k0, hh);
      if (CL.ripples) cleanRipples(x, w, topY, seamY, time, k0);
      if (CL.sheen) cleanSheen(x, w, topY, seamY, time, k0, surf);
      if (CL.front && bottom - seamY > 2) cleanFront(x, w, topY, seamY, time, k0, hh, oil);
      ctx.strokeStyle = 'rgba(210,245,255,' + (CL.lines === undefined ? 0.07 : CL.lines) + ')'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const by = topY + 8 + (i + 0.5) * (seamY - topY - 12) / 4;
        ctx.beginPath();
        for (const px of spanSteps(w, 10)) {
          const py = by + Math.sin(px * 0.06 + time * 0.8 + i * 1.9) * 2.5;
          px ? ctx.lineTo(x + px, py) : ctx.moveTo(x + px, py);
        }
        ctx.stroke();
      }
    } else if (phase === 'top') {
      const CL = C.pool.clean || {}, sp = !!CL.sparkle && cleanF > 0.001;
      if (frac >= 0.97 && !sp) return;
      ctx.strokeStyle = 'rgba(235,250,255,' + (oil ? 0.55 : 0.65) + ')'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      for (let i = 0; i < (oil ? 5 : 6); i++) {
        const k = (time * 0.05 + hh(i, 11)) % 1, px = 8 + k * (w - 16);
        ctx.globalAlpha = Math.sin(k * Math.PI);
        const py = surf(px) + 4 + hh(i, 12) * 5;
        ctx.beginPath(); ctx.moveTo(x + px - 5, py); ctx.lineTo(x + px + 5, py); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.lineCap = 'butt';
      if (sp) cleanSparkles(x, w, time, CL.strength === undefined ? 1 : CL.strength, hh, surf);
    }
  }

  function cleanRipples(x, w, topY, seamY, time, k0) {
    const depth = seamY - topY, a = v => (v * k0).toFixed(3);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, topY, 0, seamY);
    g.addColorStop(0, 'rgba(190,240,255,' + a(0.11) + ')');
    g.addColorStop(Math.min(1, 70 / depth), 'rgba(190,240,255,' + a(0.06) + ')');
    g.addColorStop(Math.min(1, 200 / depth), 'rgba(190,240,255,0)');
    g.addColorStop(1, 'rgba(190,240,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 1;
    const gap = 22, slope = 0.5, drift = time * 3;
    [1, -1].forEach(function (dir) {
      ctx.beginPath();
      const from = dir > 0 ? -slope * w : 0, to = dir > 0 ? depth : depth + slope * w;
      for (let c = from - gap + (drift % gap); c < to + gap; c += gap) {
        for (const px of spanSteps(w, 10)) {
          const py = topY + c + dir * slope * px +
            Math.sin(px * 0.11 + time * 1.2 * dir + c * 0.27) * 4.5 +
            Math.sin(px * 0.043 - time * 0.7 + c * 0.19) * 3.5 +
            Math.sin(px * 0.19 + time * 1.9 + c * 0.5) * 1.5;
          px ? ctx.lineTo(x + px, py) : ctx.moveTo(x + px, py);
        }
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  function cleanSheen(x, w, topY, seamY, time, k0, surf) {
    const depth = seamY - topY, period = 6, p = (time % period) / period;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (p < 0.7) {
      const ang = -0.35, ux = Math.cos(ang), uy = Math.sin(ang), L = 260;
      const cx = x - 80 + (p / 0.7) * (w + 160), cy = topY + depth / 2;
      const g = ctx.createLinearGradient(cx - ux * L / 2, cy - uy * L / 2, cx + ux * L / 2, cy + uy * L / 2);
      const a = (0.14 * k0).toFixed(3);
      g.addColorStop(0, 'rgba(225,248,255,0)'); g.addColorStop(0.44, 'rgba(225,248,255,0)');
      g.addColorStop(0.5, 'rgba(225,248,255,' + a + ')');
      g.addColorStop(0.56, 'rgba(225,248,255,0)'); g.addColorStop(1, 'rgba(225,248,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x, topY - 6, w, depth + 12);
    }
    ctx.strokeStyle = 'rgba(230,250,255,' + ((0.22 + 0.06 * Math.sin(time * 0.9)) * k0).toFixed(3) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const px of spanSteps(w, 8)) { const py = surf(px) + 4; px ? ctx.lineTo(x + px, py) : ctx.moveTo(x + px, py); }
    ctx.stroke();
    ctx.restore();
  }
  function cleanFront(x, w, topY, seamY, time, k0, hh, oil) {
    const band = 20, a = ((0.15 + 0.04 * Math.sin(time * 0.8)) * k0).toFixed(3);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, seamY - band, 0, seamY + 2);
    g.addColorStop(0, 'rgba(200,248,255,0)'); g.addColorStop(1, 'rgba(200,248,255,' + a + ')');
    ctx.fillStyle = g; ctx.fillRect(x, seamY - band, w, band + 4);
    ctx.restore();
    const n = Math.max(4, Math.round(w / 24)), depth = seamY - topY;
    for (let i = 0; i < n; i++) {
      const k = (time * (0.04 + hh(i, 31) * 0.03) + hh(i, 32)) % 1;
      const px = x + 8 + hh(i, 33) * (w - 16) + Math.sin(time * 0.7 + i * 1.3) * 3;
      const py = topY + 6 + k * (depth - 8);
      const al = 0.55 * Math.sin(k * Math.PI) * Math.min(1, k0);
      ctx.fillStyle = (oil ? 'rgba(46,34,16,' : 'rgba(58,70,30,') + al.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(px, py, 1.1 + hh(i, 34) * 0.9, 0, Math.PI * 2); ctx.fill();
    }
  }
  function cleanRays(x, w, topY, seamY, time, k0, hh) {
    const depth = seamY - topY, reach = Math.min(depth, 280), slant = reach * 0.35;
    const n = Math.max(2, Math.round(w / 80));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const bx = x + (i + 0.3 + hh(i, 91) * 0.4) * w / n + Math.sin(time * 0.22 + i * 2.1) * w * 0.07;
      const bw = 12 + hh(i, 92) * 16, al = (0.075 + 0.045 * Math.sin(time * 0.55 + i * 1.7)) * k0;
      const g = ctx.createLinearGradient(0, topY, 0, topY + reach);
      g.addColorStop(0, 'rgba(205,242,255,' + al.toFixed(3) + ')');
      g.addColorStop(1, 'rgba(205,242,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(bx, topY - 6); ctx.lineTo(bx + bw, topY - 6);
      ctx.lineTo(bx + bw * 2.2 + slant, topY + reach); ctx.lineTo(bx + slant, topY + reach);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function cleanSparkles(x, w, time, k0, hh, surf) {
    const n = Math.max(3, Math.round(w / 40));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const t = time * (0.3 + hh(i, 71) * 0.25) + hh(i, 72), cyc = Math.floor(t), k = t - cyc;
      if (k > 0.35) continue;
      const I = Math.sin(k / 0.35 * Math.PI) * k0;
      const px = 10 + lookHash(i * 13 + cyc, 73) * (w - 20), py = surf(px) + 2 + lookHash(i + cyc, 74) * 7;
      const r = 2.5 + 4 * I;
      ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(1, 0.85 * I).toFixed(3) + ')'; ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x + px - r, py); ctx.lineTo(x + px + r, py);
      ctx.moveTo(x + px, py - r * 0.7); ctx.lineTo(x + px, py + r * 0.7);
      ctx.stroke();
    }
    ctx.restore();
  }

  function groveLeaves(s, x, y, w, h, topY, time, sw) {
    const G = C.grove && C.grove.leaves;
    if (!G || !G.enabled || (G.types || []).indexOf(s.type) < 0) return;
    const bottom = y + h;
    if (bottom - topY < 16) return;
    const seed = (parseInt(String(s.id).replace(/\D/g, ''), 10) || 0) * 7;
    const hh = (i, k) => lookHash(i + seed, k);
    const n = Math.round((G.count || 7) * h / 348);
    for (let i = 0; i < n; i++) {
      const k = (time * (0.04 + hh(i, 81) * 0.03) + hh(i, 82)) % 1;
      const dr = sw ? (sw.o.drift || 0) : 0;
      const px = x + 16 + hh(i, 83) * (w - 32) + Math.sin(time * 1.1 + i * 2) * 8 + (sw ? sw.ox * dr : 0);
      const py = topY + 6 + k * (bottom - topY - 12) + (sw ? sw.oy * dr : 0);
      ctx.save();
      ctx.translate(px, py); ctx.rotate(Math.sin(time * 1.4 + i) * 0.9 + (sw ? sw.wash * Math.sin(time * 9 + i * 1.7) * 1.2 : 0));
      ctx.globalAlpha = Math.sin(k * Math.PI);
      ctx.fillStyle = G.color || 'rgba(130,220,160,0.55)';
      ctx.beginPath(); ctx.ellipse(0, 0, 4.2, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = G.vein || 'rgba(30,70,45,0.6)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.stroke();
      ctx.restore();
    }
  }

  function siteDepth(s, x, y, w, h, topY, surf) {
    const D = C.siteDepth;
    if (!D || !D.enabled || (D.types || []).indexOf(s.type) < 0) return;
    const side = D.side || 22, dark = D.dark || 'rgba(10,14,8,0.35)', clear = 'rgba(10,14,8,0)';
    let g = ctx.createLinearGradient(x, 0, x + side, 0);
    g.addColorStop(0, dark); g.addColorStop(1, clear);
    ctx.fillStyle = g; ctx.fillRect(x, topY, side, y + h - topY);
    g = ctx.createLinearGradient(x + w, 0, x + w - side, 0);
    g.addColorStop(0, dark); g.addColorStop(1, clear);
    ctx.fillStyle = g; ctx.fillRect(x + w - side, topY, side, y + h - topY);
    const fl = D.floor || 40;
    g = ctx.createLinearGradient(0, y + h, 0, y + h - fl);
    g.addColorStop(0, dark); g.addColorStop(1, clear);
    ctx.fillStyle = g; ctx.fillRect(x, y + h - fl, w, fl);
    ctx.beginPath();
    for (const px of spanSteps(w, 8)) { const py = surf(px); px ? ctx.lineTo(x + px, py) : ctx.moveTo(x + px, py); }
    for (let px = w; px >= 0; px -= 8) ctx.lineTo(x + px, surf(px) + 10);
    ctx.closePath();
    g = ctx.createLinearGradient(0, topY, 0, topY + 10);
    g.addColorStop(0, D.light || 'rgba(220,235,180,0.12)'); g.addColorStop(1, 'rgba(220,235,180,0)');
    ctx.fillStyle = g; ctx.fill();
  }

  const bloomK = new Map();

  const bW = { s: 0, o: null };

  let bC = null;
  function swayOf(s) { const L = GG.lifter; return L && L.swayOf ? L.swayOf(s) : null; }
  function bCarryLeaf(a, t, i) {
    if (!bC) return 0;
    const o = bC.o, d = Math.atan2(Math.sin(Math.atan2(bC.oy, bC.ox) - a), Math.cos(Math.atan2(bC.oy, bC.ox) - a));
    return Math.min(1, bC.mag / (o.max || 34)) * (o.lean || 0) * d + bC.wash * (o.flutter || 0) * Math.sin(t * (o.flutterHz || 16) + i * 1.9);
  }

  function bCarryBow(u, t, i) {
    if (!bC) return null;
    const b = Math.sin(Math.PI * u) * (bC.o.stem || 0), q = bC.wash * 1.2 * Math.sin(t * 13 + i * 0.7);
    return { x: bC.ox * b + q, y: bC.oy * b + q };
  }
  function bStorm(time) {
    const o = C.revive && C.revive.bloom && C.revive.bloom.storm;
    if (!o || !o.enabled || wx2.id !== 'storm' || wx2.loc !== S.g.loc || !(wx2.k > 0)) return 0;
    const calm = o.calm == null ? 0.35 : o.calm;
    return wxSmooth(wx2.k) * (calm + (1 - calm) * wxGust(time));
  }

  function bLeafWind(a, t, i) {
    if (!bW.s) return 0;
    const o = bW.o, d = Math.atan2(Math.sin(-a), Math.cos(-a));
    return bW.s * ((o.lean || 0) * d + (o.flutter || 0) * Math.sin(t * (o.flutterHz || 14) + i * 1.9));
  }

  function bLianaWind(t, ph) { return bW.s ? bW.s * (bW.o.liana || 0) * (0.75 + 0.25 * Math.sin(t * 4.2 + ph)) : 0; }

  function bTorn(P, b, t, seed, n) {
    if (!bW.s || !n) return;
    const a0 = ctx.globalAlpha, path = new Path2D();
    for (let i = 0; i < n; i++) {
      const fr = bRng(seed + i * 31), sp = 160 + fr() * 140, span = b.w + 40;
      const px = b.x - 20 + ((t * sp + fr() * span) % span);
      const py = b.y + 14 + (b.h - 28) * fr() + Math.sin(t * 5 + i) * 10;
      bLeafPath(path, px, py, 5 + fr() * 2, t * (6 + fr() * 6) + i);
    }
    ctx.globalAlpha = a0 * Math.min(1, bW.s * 1.4);
    ctx.fillStyle = P.leaf2; ctx.fill(path);
    ctx.globalAlpha = a0;
  }
  function bHash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
  function bRng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let q = Math.imul(seed ^ seed >>> 15, 1 | seed);
    q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; }; }
  const bR = (r, a, b) => a + r() * (b - a);
  const bIn = (v, lo, size) => Math.max(lo + 14, Math.min(lo + size - 14, v));

  function bPerim(b, d) {
    const L = 2 * (b.w + b.h); d = ((d % L) + L) % L;
    const rc = 14, sw = b.w - 2 * rc, sh = b.h - 2 * rc, arc = Math.PI * rc / 2;
    let u = d / L * (2 * sw + 2 * sh + 4 * arc);

    const seg = [[sw, 0], [arc, 1], [sh, 2], [arc, 3], [sw, 4], [arc, 5], [sh, 6], [arc, 7]];
    for (let i = 0; i < 8; i++) {
      const len = seg[i][0];
      if (u > len && i < 7) { u -= len; continue; }
      const k = Math.min(1, u / Math.max(1e-6, len));
      switch (i) {
        case 0: return { x: b.x + rc + sw * k, y: b.y, tx: 1, ty: 0, nx: 0, ny: 1 };
        case 2: return { x: b.x + b.w, y: b.y + rc + sh * k, tx: 0, ty: 1, nx: -1, ny: 0 };
        case 4: return { x: b.x + b.w - rc - sw * k, y: b.y + b.h, tx: -1, ty: 0, nx: 0, ny: -1 };
        case 6: return { x: b.x, y: b.y + b.h - rc - sh * k, tx: 0, ty: -1, nx: 1, ny: 0 };
      }

      const c = [[b.x + b.w - rc, b.y + rc, -Math.PI / 2], [b.x + b.w - rc, b.y + b.h - rc, 0],
                 [b.x + rc, b.y + b.h - rc, Math.PI / 2], [b.x + rc, b.y + rc, Math.PI]][(i - 1) / 2];
      const a = c[2] + k * Math.PI / 2, ox = Math.cos(a), oy = Math.sin(a);
      return { x: c[0] + ox * rc, y: c[1] + oy * rc, tx: -oy, ty: ox, nx: -ox, ny: -oy };
    }
    return { x: b.x + rc, y: b.y, tx: 1, ty: 0, nx: 0, ny: 1 };
  }

  function bLeafPath(path, px, py, sz, ang) {
    const c = Math.cos(ang), s = Math.sin(ang), X = (u, v) => px + u * c - v * s, Y = (u, v) => py + u * s + v * c;
    path.moveTo(px, py);
    path.quadraticCurveTo(X(sz * 0.5, -sz * 0.45), Y(sz * 0.5, -sz * 0.45), X(sz, 0), Y(sz, 0));
    path.quadraticCurveTo(X(sz * 0.5, sz * 0.45), Y(sz * 0.5, sz * 0.45), px, py);
  }
  function bFlower(P, px, py, sz) {
    ctx.fillStyle = P.flower;
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(px + Math.cos(a) * sz, py + Math.sin(a) * sz, sz * 0.7, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = P.heart; ctx.beginPath(); ctx.arc(px, py, sz * 0.55, 0, Math.PI * 2); ctx.fill();
  }

  const PH = { stem: 0.5, lianaFrom: 0.1, strand: 0.62, leaf: 0.55 };
  const bClamp = v => Math.max(0, Math.min(1, v));
  const layoutCache = new Map();
  function bLayout(s, look, b, chip) {

    const key = s.id + '|' + look + '|' + Math.round(b.x) + ',' + Math.round(b.y) + '|' + b.w + 'x' + b.h + '|' +
                (chip ? Math.round(chip.x) + ',' + Math.round(chip.w) : '');
    let L = layoutCache.get(s.id);
    if (L && L.key === key) return L;
    const r = bRng(bHash(s.id)), per = 2 * (b.w + b.h), n = 5;
    const cover = look === 'fireflies' ? 0.6 : 1, flowers = look === 'blossom' ? 0.4 : 0;
    L = { key: key, runs: [], lianas: [], lilies: [] };
    const o = bR(r, 0, per);
    for (let i = 0; i < n; i++) {
      const d0 = o + i * per / n, len = per / n * cover * bR(r, 0.8, 0.92), ph = bR(r, 0, 6);
      const run = { pts: [], leaves: [], flowers: [] };
      for (let d = 0; d <= len; d += 6) {
        const p = bPerim(b, d0 + d), off = Math.sin((d0 + d) * 0.06 + ph) * 5 + Math.sin((d0 + d) * 0.021) * 3;
        run.pts.push({ x: p.x + p.nx * off, y: p.y + p.ny * off, p: p });
      }
      const m = run.pts.length;
      if (m < 2) continue;
      run.pts.forEach(function (q, j) {
        if (j % 2) return;
        const side = (j / 2) % 2 ? 1 : -1;
        run.leaves.push({ x: q.x, y: q.y, sz: bR(r, 6, 9), a: Math.atan2(q.p.ty, q.p.tx) + side, u: j / (m - 1), c: r() < 0.5 ? 0 : 1 });
        if (flowers && r() < flowers) run.flowers.push({ x: q.x + q.p.nx * 4, y: q.y + q.p.ny * 4, sz: bR(r, 1.6, 2.3), u: j / (m - 1) });
      });

      const e0 = run.pts[0], e1 = run.pts[1], z0 = run.pts[m - 1], z1 = run.pts[m - 2];
      run.leaves.push({ x: e0.x, y: e0.y, sz: 7, a: Math.atan2(e0.y - e1.y, e0.x - e1.x), u: 0, c: 0 });
      run.leaves.push({ x: z0.x, y: z0.y, sz: 7, a: Math.atan2(z0.y - z1.y, z0.x - z1.x), u: 1, c: 1 });
      L.runs.push(run);
    }
    if (look === 'lianas') {
      const tagL = chip ? chip.x - 8 : b.x + b.w / 2, tagR = chip ? chip.x + chip.w + 8 : b.x + b.w / 2;
      [-1, 1].forEach(function (side) {
        const cx = side < 0 ? b.x : b.x + b.w, room = side < 0 ? tagL - b.x : b.x + b.w - tagR;
        if (room < 20) return;
        for (let i = 0; i < 2; i++) {
          const along = Math.max(20, Math.min(room, bR(r, 36, 70)) * (i ? 0.55 : 1)), down = bR(r, 60, 110) * (i ? 0.6 : 1);
          const li = { ax: cx - side * along, ay: b.y, bx: cx, by: b.y + down,
                       mx: cx - side * along * 0.95, my: b.y + down + 8, ph: i + side, leaves: [], strand: i === 0 ? bR(r, 18, 30) : 0 };
          for (let j = 1; j < 6; j++) li.leaves.push({ u: j / 6, sz: bR(r, 5, 7), a: bR(r, 0.8, 2.3), c: j % 2 ? 0 : 1 });
          L.lianas.push(li);
        }
      });
    }
    if (look === 'fish') {
      for (let i = 0, tries = 0; i < 5 && tries < 40; tries++) {
        const px = bR(r, b.x + 30, b.x + b.w - 30), py = bR(r, b.y + 50, b.y + b.h - 30), rr = bR(r, 6, 9), rot = bR(r, 0, 6.3);
        if (L.lilies.some(q => Math.hypot(q.x - px, q.y - py) < 30)) continue;
        L.lilies.push({ x: px, y: py, rr: rr, rot: rot, flower: i === 1 }); i++;
      }
    }
    layoutCache.set(s.id, L);
    return L;
  }

  function leafScale(k, u) { return bClamp(((k - PH.leaf) / (1 - PH.leaf) - u * 0.55) / 0.45); }
  function bRuns(P, L, k, t) {
    const sk = bClamp(k / PH.stem);
    ctx.strokeStyle = P.stem; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    L.runs.forEach(function (run) {
      const pts = run.pts, f = sk * (pts.length - 1), whole = Math.floor(f);
      if (f <= 0) return;
      const m1 = Math.max(1, pts.length - 1), P2 = function (j) {
        const p = pts[j], d = bCarryBow(j / m1, t, j); return d ? { x: p.x + d.x, y: p.y + d.y } : p; };
      const p0 = P2(0);
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y);
      for (let j = 1; j <= whole; j++) { const p = P2(j); ctx.lineTo(p.x, p.y); }
      if (whole < pts.length - 1) { const a = P2(whole), c = P2(whole + 1), q = f - whole;
        ctx.lineTo(a.x + (c.x - a.x) * q, a.y + (c.y - a.y) * q); }
      ctx.stroke();
    });
    if (k <= PH.leaf) return;
    const lA = new Path2D(), lB = new Path2D();
    L.runs.forEach(function (run) {
      run.leaves.forEach(function (lf, i) {
        const sc = leafScale(k, lf.u);
        const d = bCarryBow(lf.u, t, Math.round(lf.u * 40));
        if (sc > 0) bLeafPath(lf.c ? lB : lA, lf.x + (d ? d.x : 0), lf.y + (d ? d.y : 0), lf.sz * sc,
                              lf.a + Math.sin(t * 1.3 + i) * 0.12 + bLeafWind(lf.a, t, i) + bCarryLeaf(lf.a, t, i));
      });
    });
    ctx.fillStyle = P.leaf; ctx.fill(lA);
    ctx.fillStyle = P.leaf2; ctx.fill(lB);
    L.runs.forEach(function (run) {
      run.flowers.forEach(function (fl) { const sc = leafScale(k, Math.min(1, fl.u + 0.2)), d = bCarryBow(fl.u, t, Math.round(fl.u * 40));
        if (sc > 0) bFlower(P, fl.x + (d ? d.x : 0), fl.y + (d ? d.y : 0), fl.sz * sc); });
    });
  }
  function bLianas(P, L, k, t) {
    const lk = bClamp((k - PH.lianaFrom) / (PH.stem - PH.lianaFrom));
    if (lk <= 0) return;
    const lA = new Path2D(), lB = new Path2D();
    ctx.strokeStyle = P.stem; ctx.lineCap = 'round';
    L.lianas.forEach(function (li) {
      const cl = bC ? bC.o.liana || 0 : 0, cx = bC ? bC.ox * cl + bC.wash * 3 * Math.sin(t * 11 + li.ph) : 0, cy = bC ? bC.oy * cl : 0;
      const sw = Math.sin(t * 0.9 + li.ph) * 2.5 + bLianaWind(t, li.ph) + cx, mx = li.mx + sw, my = li.my + cy;
      const at = function (u) { const q = 1 - u; return { x: q * q * li.ax + 2 * q * u * mx + u * u * li.bx, y: q * q * li.ay + 2 * q * u * my + u * u * li.by }; };

      ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(li.ax, li.ay);
      for (let j = 1; j <= 16; j++) { const p = at(lk * j / 16); ctx.lineTo(p.x, p.y); }
      ctx.stroke();
      li.leaves.forEach(function (lf) {
        const sc = leafScale(k, lf.u);
        if (sc > 0) { const p = at(lf.u); bLeafPath(lf.c ? lB : lA, p.x, p.y, lf.sz * sc, lf.a + bLeafWind(lf.a, t, lf.u * 40) + bCarryLeaf(lf.a, t, lf.u * 40)); }
      });

      if (li.strand && k > PH.stem) {
        let lo = at(0), lu = 0;
        for (let j = 1; j <= 20; j++) { const p = at(j / 20); if (p.y > lo.y) { lo = p; lu = j / 20; } }
        const gk = bClamp((k - PH.stem) / (PH.strand - PH.stem));
        if (lu > 0 && lu < 1 && gk > 0) {

          const len = li.strand * gk, tx = lo.x + sw * 0.8 * gk, ty = lo.y + len * (1 - bW.s * ((bW.o && bW.o.strandLift) || 0)) + cy * 0.8 * gk;
          ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(lo.x, lo.y); ctx.quadraticCurveTo(lo.x + sw * 0.3 * gk, lo.y + len * 0.5, tx, ty); ctx.stroke();
          const sc = leafScale(k, 1);
          if (sc > 0) bLeafPath(lA, tx, ty, 6 * sc, Math.PI / 2 + sw * 0.1);
        }
      }
    });
    ctx.fillStyle = P.leaf; ctx.fill(lA);
    ctx.fillStyle = P.leaf2; ctx.fill(lB);
  }

  function bGlow(rgb, px, py, rr, a) {
    [[1, 0.18], [0.62, 0.3], [0.32, 0.5]].forEach(function (c) {
      ctx.fillStyle = 'rgba(' + rgb + ',' + (a * c[1]).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(px, py, rr * c[0], 0, Math.PI * 2); ctx.fill();
    });
  }

  function bIntro(e, i, n) { const a = bClamp((e - (n > 1 ? i / (n - 1) : 0) * 0.6) / 0.4); return a * a * (3 - 2 * a); }
  function bFireflies(P, b, t, seed, n, e) {
    for (let i = 0; i < n; i++) {
      const fr = bRng(seed + i);
      const push = bW.s * ((bW.o && bW.o.push) || 0) * (0.7 + 0.3 * Math.sin(t * 3 + i));
      const px = bIn(b.x + b.w * (0.1 + 0.8 * fr()) + Math.sin(t * 0.5 + i) * 18 + push, b.x, b.w), py = bIn(b.y + b.h * (0.1 + 0.8 * fr()) + Math.cos(t * 0.37 + i * 2) * 14, b.y, b.h);
      const on = Math.max(0, Math.sin(t * 1.4 + i * 1.7)), a = bIntro(e, i, n);

      const k = a < 1 ? Math.max(on * on, Math.sin(a * Math.PI)) * a : on * on;
      if (k < 0.02) continue;
      bGlow(P.glow, px, py, 9 * (0.5 + 0.5 * a), 0.8 * k);
      ctx.fillStyle = 'rgba(255,250,210,' + k.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(px, py, 1.4, 0, Math.PI * 2); ctx.fill();
    }
  }
  function bPetals(P, b, t, seed, n, e) {
    const a0 = ctx.globalAlpha;
    for (let i = 0; i < n; i++) {
      const fr = bRng(seed + i), sp = 12 + fr() * 10, span = b.w - 16;
      const px = b.x + 8 + ((t * sp + fr() * span) % span), py = b.y + 18 + (b.h - 36) * fr() + Math.sin(t * 1.4 + i) * 8;
      const a = bIntro(e, i, n);
      if (a <= 0) continue;
      ctx.globalAlpha = a0 * a * Math.max(0, Math.min(1, (px - b.x - 8) / 30, (b.x + b.w - 8 - px) / 30)) * 0.9;
      ctx.fillStyle = P.flower; ctx.beginPath(); ctx.ellipse(px, py, 2.6 * a, 1.5 * a, t * 2 + i, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = a0;
  }
  function bLilies(P, L, e) {
    const n = L.lilies.length;
    L.lilies.forEach(function (q, i) {
      const a = bIntro(e * 1.4, i, n);
      if (a <= 0) return;
      ctx.fillStyle = P.pad; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.arc(q.x, q.y, q.rr * a, q.rot + 0.35, q.rot + Math.PI * 2 - 0.1); ctx.closePath(); ctx.fill();
      if (q.flower && a > 0.6) bFlower(P, q.x, q.y, 2 * (a - 0.6) / 0.4);
    });
  }

  function bFish(b, t, seed, n, e) {
    const a0 = ctx.globalAlpha;
    ctx.globalAlpha = a0 * bClamp((e - 0.55) / 0.45);
    if (ctx.globalAlpha <= 0) { ctx.globalAlpha = a0; return; }
    for (let i = 0; i < n; i++) {
      const per = 3.5 + i * 0.9, k = Math.floor(t / per + i * 0.3), u = (t / per + i * 0.3) % 1;
      const fr = bRng(seed + i * 97 + k), px = b.x + b.w * (0.15 + 0.7 * fr()), py = b.y + b.h * (0.2 + 0.65 * fr());
      if (u < 0.08) { ctx.fillStyle = 'rgba(220,245,255,0.8)'; ctx.beginPath(); ctx.arc(px, py - 3 * Math.sin(u / 0.08 * Math.PI), 1.8, 0, Math.PI * 2); ctx.fill(); }
      for (let j = 0; j < 2; j++) { const v = u - j * 0.12; if (v <= 0 || v > 0.7) continue;
        ctx.strokeStyle = 'rgba(200,238,255,' + (0.5 * (1 - v / 0.7)).toFixed(3) + ')'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.ellipse(px, py, 3 + v * 30, (3 + v * 30) * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.globalAlpha = a0;
  }
  function bPlankton(P, b, t, seed, n, e) {
    for (let i = 0; i < n; i++) {
      const fr = bRng(seed + i), cx = b.x + b.w * (0.2 + 0.6 * fr()), cy = b.y + b.h * (0.2 + 0.6 * fr());
      const a = t * 0.12 * (0.5 + fr()) + fr() * 6.3;
      const px = bIn(cx + Math.sin(a) * b.w * 0.22 + Math.sin(a * 2.3) * 8, b.x, b.w), py = bIn(cy + Math.cos(a * 0.8) * b.h * 0.18, b.y, b.h);
      const ai = bIntro(e, i, n);
      if (ai <= 0) continue;
      const k = (0.4 + 0.6 * Math.max(0, Math.sin(t * 0.9 + i * 1.3))) * ai;
      bGlow(P.plankton, px, py, 7 * (0.4 + 0.6 * ai), 0.55 * k);
      ctx.fillStyle = 'rgba(210,255,245,' + (0.8 * k).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(px, py, 1.1, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawBloom(s, t, x, y, w, h, time, finished, chip) {
    const o = C.revive && C.revive.bloom;
    const look = o && o.enabled && o.looks && o.looks[s.type];
    if (!look) return;
    let rec = bloomK.get(s.id);
    if (!rec) { rec = { k: finished ? 1 : 0, e: finished ? 1 : 0, at: time }; bloomK.set(s.id, rec); }
    const dt = Math.max(0, Math.min(0.1, time - rec.at)); rec.at = time;
    rec.k = Math.max(0, Math.min(1, rec.k + (finished ? 1 : -1) * dt / Math.max(0.01, o.growSec || 3)));

    rec.e = rec.k >= 1 ? Math.min(1, (rec.e || 0) + dt / Math.max(0.01, o.extrasSec || 1.5)) : 0;
    if (rec.k <= 0) return;
    const k = rec.k, tt = o.motion === false ? 0 : time, P = o.colors, seed = bHash(s.id);
    const b = { x: x, y: y, w: w, h: h }, L = bLayout(s, look, b, chip);
    bW.s = tt ? bStorm(time) : 0; bW.o = o.storm || {};
    bC = tt ? swayOf(s) : null;

    rec.pt = (rec.pt === undefined ? time : rec.pt) + dt * (1 + bW.s * (bW.o.petalRush || 0));
    ctx.save();
    ctx.beginPath(); roundRect(x - 16, y - 16, w + 32, h + 32, 20); ctx.clip();
    bRuns(P, L, k, tt);
    if (look === 'lianas') bLianas(P, L, k, tt);
    const e = rec.e;
    if (k >= 1 && e > 0) {
      const dr = bC ? bC.o.drift || 0 : 0;
      if (dr) { ctx.save(); ctx.translate(bC.ox * dr, bC.oy * dr); }
      if (look === 'fireflies') bFireflies(P, b, tt, seed + 500, 9, e);
      else if (look === 'blossom') bPetals(P, b, tt ? rec.pt : 0, seed + 400, 16, e);
      else if (look === 'fish') { bLilies(P, L, e); bFish(b, tt, seed + 600, 4, e); }
      else if (look === 'plankton') bPlankton(P, b, tt, seed + 50, 22, e);
      if (dr) ctx.restore();
    }
    if (k >= 1 && look !== 'fish' && look !== 'plankton') bTorn(P, b, tt, seed + 900, bW.o.torn || 0);
    ctx.restore();
    bC = null;
  }
  R.bloomWind = function () { return bW.s; };
  R.bloomLevel = function (id) { const rec = bloomK.get(id); return rec ? rec.k : 0; };

  R.bloomReplay = function (id) { let n = 0; bloomK.forEach(function (rec, key) { if (id == null || key === id) { rec.k = 0; rec.e = 0; n++; } }); return n; };

  function drawSite(s, time, ui) {
    const t = S.type(s);
    const grow = !!t.grow;

    const layeredSite = !!(t.volume && C.pool && C.pool.layers);
    const skinK = grow && !(layeredSite && C.pool && C.pool.tintGround === false)
      ? GG.sim.growFrac(s) : 0;
    const rk = rockLook(s);
    const sk = mixSkin((rk && rk.skin) || t.skin || C.nodeTypes.trashSite.skin, skinK);

    const box = S.siteBox(s);
    const w = box.w, h = box.h;
    const x = s.x - w / 2, y = s.y - h / 2;

    const maxRes = grow ? GG.sim.growCap(s) : (s.full || t.reserve);
    const shown = Math.max(0, s.shown === undefined ? (grow ? s.grown : s.reserve) : s.shown);

    const layered = layeredSite;
    let dirtyF = 0, cleanF = 0, stir = 0;
    const PW = (C.pool && C.pool.wave) || { amp: 0, speed: 1, seamAmp: 0, seamSpeed: 1,
                                            stir: 0, stirSec: 1 };
    if (layered) {
      const vol = GG.sim.poolVolume(s);
      dirtyF = vol > 0 ? Math.min(1, GG.sim.poolDirty(s) / vol) : 0;
      cleanF = vol > 0 ? Math.min(1 - dirtyF, GG.sim.poolClean(s) / vol) : 0;

      const lvl = dirtyF + cleanF;
      if (s.wasLvl === undefined) s.wasLvl = lvl;
      if (Math.abs(lvl - s.wasLvl) > 1e-7) s.stirT = PW.stirSec;
      else s.stirT = Math.max(0, (s.stirT || 0) - 0.016);
      s.wasLvl = lvl;
      stir = PW.stirSec > 0 ? (s.stirT || 0) / PW.stirSec : 0;
    }

    const sw = swayOf(s), SO = sw ? sw.o : null;
    const slosh = sw ? px => -sw.ox * (SO.tilt || 0) * (px - w / 2) / Math.max(1, w / 2) +
                             sw.wash * (SO.ripple || 0) * Math.sin(px * 0.13 + time * 9) : () => 0;
    if (sw && layered) stir = Math.max(stir, sw.wash);
    const frac = layered ? dirtyF + cleanF
               : t.fillFull ? 1 : (maxRes > 0 ? Math.min(1, shown / maxRes) : 0);
    const empty = !grow && s.reserve <= 1e-6;

    const RS = (C.revive && C.revive.restored) || {};
    const restored = empty && !!RS.enabled && (RS.types || []).indexOf(s.type) >= 0;

    const gt = ui.ghost && ui.ghost.type ? C.nodeTypes[ui.ghost.type] : null;
    const targeting = !!gt && !!gt.siteType && S.fitsSite(gt, s);
    const glow = targeting ? 0.5 + 0.5 * Math.sin(time * 3) : 0;

    ctx.save();
    if (s.fade) ctx.globalAlpha = Math.max(0, 1 - s.fade / t.fadeSec);

    const fa = fallOf(s);
    if (fa) {
      const A = C.asteroid || {}, F = A.fall || {};
      if (fa.t < fa.hit) {
        ctx.globalAlpha *= rk ? 0 : 0.12;
      } else {
        const k = Math.min(1, (fa.t - fa.hit) / ((F.settleSec || 0.55)));
        ctx.globalAlpha *= 0.12 + 0.88 * k;
        const sc = 1.10 - 0.10 * k;
        ctx.translate(s.x, s.y); ctx.scale(sc, sc); ctx.translate(-s.x, -s.y);
      }
    }

    const ws = wavesOn(s);
    if (rk) {
      rockRim(x, y, w, h, rk);
      if (s.fade && !rockPuffed.has(s)) {
        rockPuffed.add(s);
        R.rockPuffs.push({ id: s.id, x: s.x, y: s.y, w: w, loc: s.loc, t: 0, dust: rk.dust });
      }
    }

    ctx.fillStyle = sk.pit;
    sitePath(s, box, ws); ctx.fill();
    if (restored) { ctx.fillStyle = RS.fill; sitePath(s, box, ws); ctx.fill(); }

    if (frac > 0.001) {
      ctx.save();
      sitePath(s, box, ws); ctx.clip();
      const topY = y + h * (1 - frac);
      const g = ctx.createLinearGradient(0, topY, 0, y + h);
      g.addColorStop(0, sk.fillTop);
      g.addColorStop(1, sk.fillBot);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, topY);
      for (const px of spanSteps(w, 8)) {
        ctx.lineTo(x + px, topY + surfY(px, time, layered ? PW : null, stir) +
                              flowSurf(ws, x + px) + slosh(px));
      }
      ctx.lineTo(x + w, y + h);
      ctx.closePath(); ctx.fill();
      const SF = C.siteFill;
      if (SF && SF.enabled && s.type === 'trashSite' && !layered)
        drawTrashFill(s, x, y, w, h, topY, frac, time, SF, px => topY + surfY(px, time, null, 0) + flowSurf(ws, x + px) + slosh(px));
      const lookSurf = px => topY + surfY(px, time, layered ? PW : null, stir) + flowSurf(ws, x + px) + slosh(px);
      if (layered) poolLooks(s, 'dirty', x, y, w, h, topY, y + h * (1 - dirtyF), frac, time, lookSurf);
      else if (grow) groveLeaves(s, x, y, w, h, topY, time, sw);
      else siteDepth(s, x, y, w, h, topY, lookSurf);

      if (layered && cleanF > 0.001) {
        const seamY = y + h * (1 - dirtyF);
        const cs = mixSkin(t.skin || C.nodeTypes.trashSite.skin, 1);
        const cg = ctx.createLinearGradient(0, topY, 0, seamY);
        cg.addColorStop(0, cs.fillTop);
        cg.addColorStop(1, cs.fillBot);
        ctx.fillStyle = cg;

        const seamAt = px => seamY + Math.sin(px * 0.031 + time * PW.seamSpeed) *
                                     (PW.seamAmp * (1 + stir)) + slosh(px) * 0.6;
        ctx.beginPath();
        ctx.moveTo(x, seamAt(0));
        for (const px of spanSteps(w, 8)) ctx.lineTo(x + px, seamAt(px));
        ctx.lineTo(x + w, topY);
        for (let px = w; px >= 0; px -= 8) {
          ctx.lineTo(x + px, topY + surfY(px, time, PW, stir) + flowSurf(ws, x + px) + slosh(px));
        }
        ctx.closePath();
        const CLE = C.pool.clean || {};
        if (CLE.clear) {
          const bg = ctx.createLinearGradient(0, topY, 0, seamY);
          bg.addColorStop(0, CLE.clearTop || 'rgba(10,32,48,0.88)');
          bg.addColorStop(1, CLE.clearBot || 'rgba(10,32,48,0.62)');
          ctx.fillStyle = bg; ctx.fill(); ctx.fillStyle = cg;
        }
        ctx.fill();
        const CLN = C.pool.clean || {}, clipClean = !!(CLN.ripples || CLN.rays || CLN.sheen || CLN.front);
        if (clipClean) { ctx.save(); ctx.clip(); }
        poolLooks(s, 'clean', x, y, w, h, topY, seamY, frac, time, lookSurf);
        if (clipClean) ctx.restore();

        if (dirtyF > 0.001) {
          ctx.strokeStyle = cs.line || 'rgba(255,255,255,0.25)';
          ctx.globalAlpha = C.pool.seamAlpha;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, seamAt(0));
          for (const px of spanSteps(w, 8)) ctx.lineTo(x + px, seamAt(px));
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      const FL = C.siteFx.flow;
      for (const wv of ws) {
        const k = wv.t / FL.sec;
        if (k >= 1) continue;
        const a = (1 - k) * FL.bandAlpha;
        ctx.strokeStyle = sk.band + a.toFixed(3) + ')';
        ctx.lineWidth = 2;
        for (let b = 0; b < FL.bands; b++) {
          const by = topY + (b + 1) * ((y + h) - topY) / (FL.bands + 1);
          const drift = wv.t * FL.bandSpeed * (b % 2 ? -1 : 1);
          ctx.beginPath();
          for (const px of spanSteps(w, 8)) {
            const py = by + Math.sin((px + drift) * 0.05 + b * 1.7) * FL.bandAmp * (1 - k);
            px ? ctx.lineTo(x + px, py) : ctx.moveTo(x + px, py);
          }
          ctx.stroke();
        }
      }

      ctx.strokeStyle = sk.surface;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (const px of spanSteps(w, 8)) {
        const py = topY + Math.sin(px * 0.045 + time * 1.1) * 3.2 + flowSurf(ws, x + px) + slosh(px);
        px ? ctx.lineTo(x + px, py) : ctx.moveTo(x + px, py);
      }
      ctx.stroke();
      if (layered) poolLooks(s, 'top', x, y, w, h, topY, 0, frac, time, lookSurf, cleanF);

      ctx.restore();
    }

    if ((C.ui || {}).siteMark) IC.drawIcon(ctx, sk.markIcon, s.x, s.y + h * 0.30, 96,
      empty ? 'rgba(150,158,140,0.07)' : sk.mark, 1.1);

    const rv = s.rare && GG.sim.rockVariantById(s.rare);
    if (rk) { if (!empty) rockGlints(s, x, y, w, h, frac, time, rk); }
    else if (rv && rv.radiation && !empty) radiationFx(s, rv.radiation, x, y, w, h, frac, time, ws);
    else if (s.rare && !empty) rockShine(s, x, y, w, h, time, ws);

    if (t.radiation && !empty) radiationFx(s, t.radiation, x, y, w, h, frac, time, ws);

    const edge = sk.edge;
    const edge2 = sk.edge2;
    ctx.strokeStyle = restored ? 'rgba(' + RS.edge + ',' + (0.42 + glow * 0.4).toFixed(3) + ')'
      : empty ? 'rgba(150,158,140,0.28)'
      : 'rgba(' + edge + ',' + (0.34 + glow * 0.5).toFixed(3) + ')';
    ctx.lineWidth = 1.5 + glow;
    sitePath(s, box, ws); ctx.stroke();

    collar('sites', s.type, x, y, w, h, 18, time);

    ctx.strokeStyle = restored ? 'rgba(' + RS.edge + ',' + (0.62 + glow * 0.3).toFixed(3) + ')'
      : empty ? 'rgba(150,158,140,0.4)' : 'rgba(' + edge2 + ',' + (0.6 + glow * 0.4).toFixed(3) + ')';
    ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const B = 26;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx2, sy2]) => {
      const cx2 = s.x + sx2 * (w / 2 - 2), cy2 = s.y + sy2 * (h / 2 - 2);
      ctx.beginPath();
      ctx.moveTo(cx2 - sx2 * B, cy2); ctx.lineTo(cx2 - sx2 * 6, cy2);
      ctx.moveTo(cx2, cy2 - sy2 * B); ctx.lineTo(cx2, cy2 - sy2 * 6);
      ctx.stroke();
    });
    ctx.lineCap = 'butt';

    const cs = S.slotSize(s.type);
    const taken = S.onSiteMachines(s);
    S.slotsOf(s).forEach(sl => {
      if (taken.some(c => Math.abs(c.x - sl.x) < 4 && Math.abs(c.y - sl.y) < 4)) return;

      if (R.labSlot && R.labSlot(ctx, s, sl, cs, { edge: edge2, glow: glow, label: GG.i18n.ins(sk.slotLabel), icon: t.icon, time: time })) return;
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = 'rgba(' + edge2 + ',' + (0.22 + glow * 0.4).toFixed(3) + ')';
      ctx.lineWidth = 1.4;
      roundRect(sl.x - cs.w / 2, sl.y - cs.h / 2, cs.w, cs.h, 12); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(' + edge2 + ',0.28)';
      ctx.font = '600 10px ' + FONT_UI;
      ctx.textAlign = 'center';

      ctx.fillText(GG.i18n.ins(sk.slotLabel), sl.x, sl.y + 4);
      ctx.textAlign = 'left';
    });

    const doneLabel = grow && t.doneName && (C.revive || {}).doneNames !== false && GG.sim.growFrac(s) >= 0.999;
    const label = (s.rare === 'pluto' && C.ui.puRockChip && C.resources.pluto)
      ? C.resources.pluto.name.toUpperCase()
      : (rk && s.rare === 'rare' && t.rareName ? t.rareName : doneLabel ? t.doneName : t.name).toUpperCase();
    let amount;

    const doneFrac = grow ? GG.sim.growFrac(s) : 0;
    const done = grow && doneFrac >= 0.999;
    if (grow) {
      const cap = GG.sim.growCap(s), got = Math.max(0, s.grown || 0);
      const pct = (done ? 100 : Math.min(99, Math.floor(doneFrac * 100))) + '%';
      amount = t.readout === 'ci'    ? GG.util.fmt(got) + ' / ' + GG.util.fmt(cap)
             : t.readout === 'ciPct' ? GG.util.fmt(got) + ' / ' + GG.util.fmt(cap) + '  ' + pct
             : pct;

    } else amount = GG.i18n.ins(GG.util.kg(Math.max(0, s.reserve)));
    ctx.font = '600 11px ' + FONT_UI;
    const tw = ctx.measureText(label).width;
    ctx.font = '600 11px ' + FONT_MONO;

    const shownTxt = restored ? GG.i18n.ins('RESTORED') : empty ? GG.i18n.ins('EMPTY') : amount;
    const aw = ctx.measureText(shownTxt).width;

    const plate = ((C.ui || {}).groundBadge || {}).style === 'plate';
    let pw = 0;
    if (plate) {
      ctx.font = '600 9.5px ' + FONT_UI; const tw2 = ctx.measureText(label).width;
      ctx.font = '700 16px ' + FONT_MONO; pw = Math.max(tw2, ctx.measureText(shownTxt).width) + 62;
    }
    const cw = plate ? pw : tw + aw + 46, ch = plate ? 42 : 26, cx = s.x - cw / 2, cy = y - ch / 2;
    siteChip[s.id] = { x: cx, y: cy, w: cw, h: ch };

    drawBloom(s, t, x, y, w, h, time, grow ? GG.sim.growFrac(s) >= 0.999 : empty, siteChip[s.id]);
    if (GG.halloween) GG.halloween.onPlot(ctx, s, x, y, w, h, time);

    if (R.labChip && R.labChip(ctx, s, { x: x, y: y, w: w, h: h, cx: cx, cy: cy, cw: cw, ch: ch, label: label, shown: shownTxt,
        icon: t.icon, sk: sk, edge: restored ? RS.edge : edge, empty: empty, restored: restored, done: done, grow: grow,
        frac: grow ? doneFrac : (s.full ? Math.max(0, s.reserve) / s.full : 0), time: time })) { ctx.restore(); return; }
    const valCol = restored ? RS.word : empty ? '#e08a8a' : (done ? sk.chipIcon : sk.chipVal);
    if (plate) {
      const ed = restored ? RS.edge : empty ? '150,158,140' : edge, dx = cx + 22, dy = cy + 21;
      ctx.fillStyle = 'rgba(14,20,15,0.95)'; roundRect(cx, cy, cw, ch, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(' + ed + ',0.5)'; ctx.lineWidth = 1; roundRect(cx, cy, cw, ch, 12); ctx.stroke();
      ctx.fillStyle = 'rgba(' + ed + ',0.16)'; ctx.beginPath(); ctx.arc(dx, dy, 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(' + ed + ',0.55)'; ctx.stroke();
      IC.drawIcon(ctx, t.icon, dx, dy, 15, empty ? '#9aa28e' : sk.chipIcon, 2);
      ctx.textBaseline = 'middle';
      ctx.font = '600 9.5px ' + FONT_UI; ctx.fillStyle = empty ? '#9aa28e' : sk.chipName;
      ctx.globalAlpha *= 0.8; ctx.fillText(label, cx + 44, cy + 13); ctx.globalAlpha /= 0.8;
      ctx.font = '700 16px ' + FONT_MONO; ctx.fillStyle = valCol; ctx.fillText(shownTxt, cx + 44, cy + 29);
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
      return;
    }
    ctx.fillStyle = 'rgba(14,20,15,0.94)';
    roundRect(cx, cy, cw, ch, 13); ctx.fill();
    ctx.strokeStyle = restored ? 'rgba(' + RS.edge + ',0.5)'
      : empty ? 'rgba(150,158,140,0.35)' : 'rgba(' + edge + ',0.45)';
    ctx.lineWidth = 1;
    roundRect(cx, cy, cw, ch, 13); ctx.stroke();

    IC.drawIcon(ctx, t.icon, cx + 16, cy + ch / 2, 14,
      empty ? '#9aa28e' : sk.chipIcon, 2);
    ctx.textBaseline = 'middle';
    ctx.font = '600 11px ' + FONT_UI;
    ctx.fillStyle = empty ? '#9aa28e' : sk.chipName;
    ctx.fillText(label, cx + 27, cy + ch / 2 + 0.5);
    ctx.font = '600 11px ' + FONT_MONO;
    ctx.fillStyle = restored ? RS.word : empty ? '#e08a8a' : (done ? sk.chipIcon : sk.chipVal);
    ctx.fillText(shownTxt, cx + 27 + tw + 9, cy + ch / 2 + 0.5);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  function drawBand(b) {
    const x = Math.min(b.x0, b.x1), y = Math.min(b.y0, b.y1);
    const w = Math.abs(b.x1 - b.x0), h = Math.abs(b.y1 - b.y0);
    ctx.save();
    ctx.fillStyle = 'rgba(232,176,75,0.10)';
    ctx.strokeStyle = 'rgba(232,176,75,0.85)';
    ctx.lineWidth = 1.6 / S.g.camera.scale;
    ctx.setLineDash([7 / S.g.camera.scale, 5 / S.g.camera.scale]);
    ctx.beginPath(); ctx.rect(x, y, w, h);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  let alignGlow = null;
  function drawAlignFlash(time) {
    const W = (C.ui || {}).wireAlign || {}, sec = W.flash || 0;
    if (!sec) return;
    const id = GG.input && GG.input.aligned && GG.input.aligned();
    if (id) alignGlow = { id: id, until: time + sec };
    if (!alignGlow || time > alignGlow.until) return;
    const l = S.g.links.find(k => k.id === alignGlow.id), a = l && S.node(l.from), b = l && S.node(l.to);
    if (!a || !b || !S.here(a)) return;
    const [p0, p1] = R.linkPts(l, a, b), sq = R.wireOrtho(l), f = Math.min(1, (alignGlow.until - time) / sec);
    ctx.save(); ctx.globalAlpha = 0.35 + 0.55 * f; ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.lineJoin = 'round'; ctx.shadowColor = '#e8b04b'; ctx.shadowBlur = 14; ctx.beginPath();
    for (let j = 0; j <= 24; j++) { const q = R.wireAt(p0, p1, sq, j / 24); j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }
    ctx.stroke(); ctx.restore();
  }

  function drawLink(l, time, ui, hotWires) {
    const a = S.node(l.from), b = S.node(l.to);
    if (!a || !b || !S.here(a)) return;
    const [p0, p1] = R.linkPts(l, a, b);

    const sq = R.wireOrtho(l);

    if (hotWires && hotWires.has(l.id)) {
      const fx = C.tutorial.wireFx;
      const k = 0.5 - 0.5 * Math.cos(time * Math.PI * 2 / (fx.periodSec || 1.5));
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(' + fx.color + ', ' +
        (fx.alphaMin + (fx.alphaMax - fx.alphaMin) * k).toFixed(3) + ')';
      ctx.lineWidth = fx.widthMin + (fx.widthMax - fx.widthMin) * k;
      wirePath(p0, p1, sq);
      ctx.stroke();
      ctx.restore();
    }

    const hot = ui.hoverLink === l.id;
    const active = l.flow > 1e-6;
    const port = S.portsOf(a, 'out').find(p => p.id === l.fromPort);
    const col = port ? C.resources[port.res].color : '#7aa';

    const gl = C.wire.glow;
    const rres = port && gl && gl.enabled && active && !l.muted ? S.portRes(a, port, 'out') : null;
    const radio = !!(rres && C.resources[rres] && C.resources[rres].radioactive);
    const rcol = radio ? C.resources[rres].color : col;
    if (radio) {
      const k = 0.5 - 0.5 * Math.cos(time * Math.PI * 2 / (gl.periodSec || 2.4));
      const al = gl.alpha * (1 - gl.breathe + gl.breathe * k);
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(rcol, al.toFixed(3));
      ctx.lineWidth = gl.width;
      wirePath(p0, p1, sq); ctx.stroke();
      ctx.strokeStyle = rgba(rcol, (al * 1.5).toFixed(3));
      ctx.lineWidth = gl.width * 0.45;
      wirePath(p0, p1, sq); ctx.stroke();
      ctx.restore();
    }

    if (l.muted) ctx.setLineDash([6, 7]);
    ctx.strokeStyle = hot ? '#ff7a7a'
      : (l.muted ? 'rgba(150,170,192,0.4)' : (active ? col : 'rgba(120,150,175,0.26)'));
    const FP = C.wire.flowPackets, fl = FP && FP.enabled && active ? flowLevel(l, time, FP) : null;
    ctx.lineWidth = hot ? 4 : (fl ? FP.width[0] + fl.lv * (FP.width[1] - FP.width[0]) : 2.6);
    ctx.globalAlpha = active ? 0.9 : 1;

    ctx.lineJoin = 'round';
    wirePath(p0, p1, sq);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    if (bent(p0)) {
      const r0 = bendCfg().dot || 3.5, hb = ui.hoverBend;

      const segs = sq && orthoCfg().bendRadius ? R.wireSegs(p0, p1) : null;
      p0.bends.forEach(function (q0, i) {
        const g = segs && segs.find(s => s.c && Math.abs(s.c.x - q0.x) < 0.5 && Math.abs(s.c.y - q0.y) < 0.5);
        const q = g ? { x: 0.25 * g.a.x + 0.5 * g.c.x + 0.25 * g.b.x, y: 0.25 * g.a.y + 0.5 * g.c.y + 0.25 * g.b.y } : q0;
        const big = hb && hb.link === l.id && hb.i === i;
        ctx.fillStyle = hot ? '#ff7a7a' : (active ? col : 'rgba(150,175,200,0.7)');
        ctx.beginPath(); ctx.arc(q.x, q.y, big ? r0 * 1.6 : r0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(8,12,18,0.85)'; ctx.lineWidth = 1.2; ctx.stroke();
      });
    }

    if (l.muted) {
      const mid = R.wireAt(p0, p1, sq, 0.5);
      ctx.font = '700 9px ' + FONT_UI;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(180,200,220,0.7)';
      ctx.fillText(GG.i18n.ins('HELD WIRE'), mid.x, mid.y - 6);
      ctx.textAlign = 'left';
    }

    if (radio) {
      const len = gl.sweepLen || 0.2, N = 14;
      const head = ((time / (gl.sweepSec || 1.8)) % 1) * (1 + len);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i <= N; i++) {
        const tt = head - len * i / N;
        if (tt < 0 || tt > 1) continue;
        const f = 1 - i / N, pt = R.wireAt(p0, p1, sq, tt);
        ctx.fillStyle = rgba(rcol, (0.55 * f).toFixed(3));
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 2 + gl.width * 0.42 * f, 0, Math.PI * 2); ctx.fill();
        if (i < 3) {
          ctx.fillStyle = 'rgba(255,255,255,' + (0.7 * f).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.2 * f + 0.8, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (fl) {
      const n = Math.round(FP.count[0] + fl.lv * (FP.count[1] - FP.count[0]));
      const r = FP.size[0] + fl.lv * (FP.size[1] - FP.size[0]);
      const tr = (S.g.camera.scale || 1) < (FP.trailMinZoom || 0) ? 0 : (FP.trail || 0);
      for (let i = 0; i < n; i++) {
        const t = (fl.ph + i / n) % 1;
        for (let q = tr; q >= 1; q--) {
          const tt = t - q * 0.02;
          if (tt < 0) continue;
          const pq = R.wireAt(p0, p1, sq, tt);
          ctx.fillStyle = rgba(col, (0.2 * (tr + 1 - q)).toFixed(3));
          ctx.beginPath(); ctx.arc(pq.x, pq.y, r * (1 - q * 0.2), 0, Math.PI * 2); ctx.fill();
        }
        const pt = R.wireAt(p0, p1, sq, t);
        nightPacket(pt, r, col);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, r * 0.44, 0, Math.PI * 2); ctx.fill();
      }
    } else if (active) {
      for (let i = 0; i < 4; i++) {
        const t = (time * 0.32 + i / 4) % 1;
        const pt = R.wireAt(p0, p1, sq, t);
        nightPacket(pt, 3.2, col);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 1.4, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  const flowSt = new Map();
  function flowLevel(l, time, FP) {
    let st = flowSt.get(l.id);
    if (!st) {
      if (flowSt.size > S.g.links.length * 2 + 64) flowSt.clear();
      st = { v: l.flow, ph: Math.random(), t: time }; flowSt.set(l.id, st);
    }
    const dt = Math.max(0, Math.min(0.1, time - st.t)); st.t = time;
    st.v += (l.flow - st.v) * Math.min(1, dt / Math.max(0.05, FP.smoothSec || 1));
    const lo = Math.log10(FP.min), hi = Math.log10(FP.max);
    const lv = Math.max(0, Math.min(1, (Math.log10(Math.max(st.v, 1e-9)) - lo) / (hi - lo)));
    st.ph = (st.ph + dt * (FP.speed[0] + lv * (FP.speed[1] - FP.speed[0]))) % 1;
    return { lv: lv, ph: st.ph };
  }
  R.flowLevel = function (id) { const st = flowSt.get(id); return st ? st.v : null; };

  function drawPendingWire(ui) {
    const w = ui.wire;

    const p0 = w.back ? w.to : w.from, p1 = w.back ? w.from : w.to;
    const port = w.back ? w.toPort : w.fromPort;
    ctx.strokeStyle = w.valid ? C.resources[port.res].color : 'rgba(230,140,140,0.85)';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.setLineDash([7, 6]);

    wirePath(p0, p1, R.wireOrtho(w));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function cardProngs(n, t, w) {
    if (!t.interestPct || n.agencySpot === false || !C.nodeTypes.hiringAgency ||
        !S.isUnlocked('hiringAgency')) return null;
    const as = S.sizeOf('hiringAgency');
    return { pw: (w - as.w) / 2 - 4, ph: as.h + C.nodeTypes.hiringAgency.autoHire.gap };
  }

  function cardPath(n, t, X, Y, W, H, R, cardW) {
    const P = cardProngs(n, t, cardW);
    if (!P) return roundRect(X, Y, W, H, R);
    const g = (W - cardW) / 2;
    const pw = P.pw + 2 * g, py = Y - P.ph, pr = Math.max(1, 7 + g), ri = Math.max(1, 6 - g);
    ctx.beginPath();
    ctx.moveTo(X, py + pr);
    ctx.arcTo(X, py, X + pw, py, pr);
    ctx.arcTo(X + pw, py, X + pw, Y, pr);
    ctx.arcTo(X + pw, Y, X + W - pw, Y, ri);
    ctx.arcTo(X + W - pw, Y, X + W - pw, py, ri);
    ctx.arcTo(X + W - pw, py, X + W, py, pr);
    ctx.arcTo(X + W, py, X + W, Y + H, pr);
    ctx.arcTo(X + W, Y + H, X, Y + H, R);
    ctx.arcTo(X, Y + H, X, py, R);
    ctx.closePath();
  }

  function wxBadge(n, x, y, w, time) {
    const M = C.weather.marks;
    const m = GG.sim.wxMark(n);
    if (!m) return;

    const txt = m.shield ? GG.i18n.t('wx.shielded') : GG.ui.wxMulText(m.mul);
    const col = m.shield || m.mul > 1 ? (M.up || '#6fdc8c') : (M.down || '#ff7a6b');
    ctx.save();
    ctx.font = '700 10.5px ' + FONT_MONO;
    const tw = ctx.measureText(txt).width;
    const h = 18, bw = tw + 30, bx = x + w - bw - 10, by = y - h / 2;

    const k = 0.5 + 0.5 * Math.sin(time * Math.PI * 2 / 1.6);
    ctx.shadowColor = rgba(col, 0.35 + 0.35 * k);
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(14,19,27,0.96)';
    roundRect(bx, by, bw, h, 6); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(col, 0.75 + 0.25 * k);
    ctx.lineWidth = 1.4;
    roundRect(bx, by, bw, h, 6); ctx.stroke();
    IC.drawIcon(ctx, m.shield ? 'shield' : m.ev.icon, bx + 11, by + h / 2, 12, m.shield ? col : m.ev.color, 2);
    ctx.fillStyle = col;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, bx + 21, by + h / 2 + 0.5);
    ctx.restore();
  }

  function sparkHash(a, b) {
    let h = (a * 374761393 + b * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function starShape(x, y, r) {
    const i = r * 0.28;
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + i, y - i); ctx.lineTo(x + r, y);
    ctx.lineTo(x + i, y + i); ctx.lineTo(x, y + r); ctx.lineTo(x - i, y + i);
    ctx.lineTo(x - r, y); ctx.lineTo(x - i, y - i); ctx.closePath();
  }
  function drawGridSparks(time, nRect) {
    const G = C.weather && C.weather.gridTrip, F = G && G.sparks;
    if (!F || !F.enabled) return;

    if (GG.sim.gridDownLeft(S.g.loc) <= 0 && !GG.sim.wxIn(S.g.loc)) return;
    const col = F.color || '#f0e24a', life = F.lifeSec || 1.6;
    ctx.save();
    S.machinesHere().forEach(function (n) {
      if (nRect && !inRect(nRect, n.x, n.y)) return;
      if (!GG.sim.isGenerator(C.nodeTypes[n.type])) return;

      const k = 1 - Math.min(1, GG.sim.wxEnergy(n) * GG.sim.gridMul(n));
      if (k <= 0.01) return;
      const size = S.sizeOf(n), w = size.w, h = size.h;
      const x0 = n.x - w / 2, y0 = n.y - h / 2;
      const count = Math.max(1, Math.round((F.count || 4) * k));
      let seed = 0;
      for (let c = 0; c < n.id.length; c++) seed = (seed * 31 + n.id.charCodeAt(c)) | 0;
      for (let i = 0; i < count; i++) {

        const ph = time / life + sparkHash(seed, i * 7919);
        const cyc = Math.floor(ph), t = ph - cyc;
        const r1 = sparkHash(seed + i * 104729, cyc), r2 = sparkHash(seed + i * 31, cyc + 7);

        let d = r1 * 2 * (w + h), bx, by, nx, ny;
        if (d < w)              { bx = x0 + d;     by = y0;         nx = 0;  ny = -1; }
        else if ((d -= w) < h)  { bx = x0 + w;     by = y0 + d;     nx = 1;  ny = 0; }
        else if ((d -= h) < w)  { bx = x0 + w - d; by = y0 + h;     nx = 0;  ny = 1; }
        else { d -= w;            bx = x0;         by = y0 + h - d; nx = -1; ny = 0; }
        const spread = (r2 - 0.5) * 1.1;
        const dx = nx * Math.cos(spread) - ny * Math.sin(spread);
        const dy = ny * Math.cos(spread) + nx * Math.sin(spread);
        const dist = (F.fly || 30) * (0.7 + 0.6 * r2) * (1 - (1 - t) * (1 - t));
        const x = bx + dx * dist, y = by + dy * dist;
        const a = Math.sin(Math.PI * t) * (0.45 + 0.55 * k);
        const tw = 0.75 + 0.25 * Math.sin((time + r1 * 5) * 14);
        const r = (F.size || 4.5) * (1 - 0.45 * t) * tw;
        ctx.shadowColor = rgba(col, a * 0.9); ctx.shadowBlur = 7;
        ctx.fillStyle = rgba(col, a);
        starShape(x, y, r); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = rgba('#ffffff', a * 0.9);
        ctx.beginPath(); ctx.arc(x, y, Math.max(0.6, r * 0.22), 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.restore();
  }

  let shieldAt = null;
  const shieldSeen = {};
  function drawShieldFx(time, nRect) {
    const F = C.weather && C.weather.arrestorFx;
    if (!F || !F.enabled || !F.cards) return;
    const loc = S.g.loc, w = GG.sim.wxState(loc);
    if (w && w.id && GG.sim.wxBlocked(loc) && shieldSeen[loc] !== w.evt) {
      shieldSeen[loc] = w.evt;
      shieldAt = { t0: time, loc: loc };
    }
    if (!shieldAt || shieldAt.loc !== loc) return;
    const dur = F.cardsSec || 1.6, age = time - shieldAt.t0;
    if (age < 0 || age > dur) { if (age > dur) shieldAt = null; return; }
    const col = F.color || '#78d2ff', sc = S.g.camera.scale || 1;
    const ease = p => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 2.2);
    let i = 0;
    ctx.save();
    S.machinesHere().forEach(function (n) {
      const t = C.nodeTypes[n.type];
      if (!t || !(GG.sim.isGenerator(t) || t.store)) return;
      const k0 = age - (i++) * 0.07;
      if (k0 < 0 || (nRect && !inRect(nRect, n.x, n.y))) return;
      const p = Math.min(1, k0 / (dur * 0.8)), k = 1 - p;
      if (k <= 0) return;
      const size = S.sizeOf(n), grow = 6 + 10 * ease(p);
      ctx.shadowColor = rgba(col, 0.9 * k); ctx.shadowBlur = 18;
      ctx.strokeStyle = rgba(col, 0.95 * k); ctx.lineWidth = 2.5 / sc;
      roundRect(n.x - size.w / 2 - grow, n.y - size.h / 2 - grow, size.w + grow * 2, size.h + grow * 2, 10 + grow);
      ctx.stroke();
      ctx.shadowBlur = 0;
      const sy = n.y - size.h / 2 - 18 - 30 * ease(p);
      IC.drawIcon(ctx, 'shield', n.x, sy, 26 + 6 * p, rgba(col, k), 2);
    });
    ctx.restore();
  }

  R.wxBadgeOn = function (n, time) {
    const M = C.weather && C.weather.marks;
    if (!M || !M.enabled || !GG.sim.wxIn(S.g.loc)) return;
    if (GG.ui.wxHintsOn && !GG.ui.wxHintsOn()) return;
    const cam = S.g.camera, size = S.sizeOf(n);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(cam.scale, cam.scale); ctx.translate(-cam.x, -cam.y);
    wxBadge(n, n.x - size.w / 2, n.y - size.h / 2, size.w, time);
    ctx.restore();
  };
  function drawWxMarks(time, nRect) {
    const M = C.weather && C.weather.marks;
    if (!M || !M.enabled || !GG.sim.wxIn(S.g.loc)) return;
    if (GG.ui.wxHintsOn && !GG.ui.wxHintsOn()) return;
    if (M.sites) S.sitesHere().forEach(function (s) {
      const box = S.siteBox(s);
      wxBadge(s, s.x - box.w / 2, s.y - box.h / 2, box.w, time);
    });
    S.machinesHere().forEach(function (n) {
      if (nRect && !inRect(nRect, n.x, n.y)) return;
      const size = S.sizeOf(n);
      wxBadge(n, n.x - size.w / 2, n.y - size.h / 2, size.w, time);
    });
  }

  const popAt = new Map(), cutFxs = [];
  function bfx() { return (C.ui && C.ui.buildFx) || {}; }
  R.placeFx = function (n) {
    const P = bfx().place;
    if (P && P.enabled && n) popAt.set(n.id, performance.now() / 1000);
  };
  function popOf(n) {
    const t0 = popAt.get(n.id);
    if (t0 === undefined) return null;
    const P = bfx().place || {}, u = (performance.now() / 1000 - t0) / (P.sec || 0.34);
    if (!(u >= 0 && u < 1)) { popAt.delete(n.id); return null; }
    const c1 = 1.70158, back = 1 + (c1 + 1) * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2), from = P.from || 0.82;
    return { s: from + (1 - from) * back, a: Math.min(1, u * 3) };
  }
  R.cutFx = function (l, wx, wy) {
    const K = bfx().cut;
    if (!K || !K.enabled || !l) return;
    const a = S.node(l.from), b = S.node(l.to);
    if (!a || !b || !S.here(a)) return;
    const [p0, p1] = R.linkPts(l, a, b), sq = R.wireOrtho(l), pts = [];
    for (let k = 0; k <= 40; k++) pts.push(R.wireAt(p0, p1, sq, k / 40));
    let ki = 20;
    if (wx !== undefined) {
      let bd = Infinity;
      pts.forEach((q, i) => { const d = Math.hypot(q.x - wx, q.y - wy); if (d < bd) { bd = d; ki = i; } });
    }
    ki = Math.max(2, Math.min(38, ki));
    const port = S.portsOf(a, 'out').find(p => p.id === l.fromPort);
    const col = ((C.resources[port ? S.portRes(a, port, 'out') : ''] || {}).color) || '#9fb0c2';
    cutFxs.push({ t0: performance.now() / 1000, pts: pts, k: ki, col: col });
    if (K.sparks > 0) R.burst(pts[ki].x, pts[ki].y, { color: col, count: K.sparks, speed: 80, lift: 30, size: 2 });
  };

  R.wireFx = function (l, end) {
    const W = bfx().wire;
    if (!W || !W.enabled || !l || !(W.sparks > 0)) return;
    const a = S.node(l.from), b = S.node(l.to);
    if (!a || !b || !S.here(a)) return;
    const q = R.linkPts(l, a, b)[end === 'from' ? 0 : 1];
    const port = S.portsOf(a, 'out').find(p => p.id === l.fromPort);
    const col = ((C.resources[port ? S.portRes(a, port, 'out') : ''] || {}).color) || '#9fb0c2';
    R.burst(q.x, q.y, { color: col, count: W.sparks, speed: W.speed || 70, lift: W.lift || 24, size: W.size || 1.8 });
  };

  const bumpAt = new Map(), lvlFxs = [];
  function mfx() { return (C.ui && C.ui.momentFx) || {}; }
  R.btnFx = function (n, side, col) {
    const B = mfx().btn;
    if (!B || !B.enabled || !n) return false;
    bumpAt.set(n.id, performance.now() / 1000);
    const r = R.collectRect(n, side);
    if (r && B.sparks > 0) [r.x + 4, r.x + r.w - 4].forEach(x =>
      R.burst(x, r.y + r.h / 2, { color: col, count: B.sparks, speed: 75, lift: 30, size: 1.9 }));
    return true;
  };
  function bumpOf(n) {
    const t0 = bumpAt.get(n.id);
    if (t0 === undefined) return null;
    const B = mfx().btn || {}, u = (performance.now() / 1000 - t0) / (B.sec || 0.26);
    if (!(u >= 0 && u < 1)) { bumpAt.delete(n.id); return null; }
    return { s: 1 + (B.bump || 0.04) * Math.sin(Math.PI * u), a: 1 };
  }
  R.levelFx = function (nodes) {
    const L = mfx().level;
    if (!L || !L.enabled) return false;
    const t = performance.now() / 1000;
    (nodes || []).forEach((n, i) => lvlFxs.push({ id: n.id, t0: t + i * 0.04 }));
    return true;
  };
  function drawLevelFx() {
    if (!lvlFxs.length) return;
    const L = mfx().level || {}, T = L.sec || 0.75, gap = L.gap || 0.15, t = performance.now() / 1000;
    const col = (C.currencies.ci || {}).color || '#62d4e3';
    for (let i = lvlFxs.length - 1; i >= 0; i--) {
      const f = lvlFxs[i], n = S.node(f.id), age = t - f.t0;
      if (!n || age > T + gap * 2) { lvlFxs.splice(i, 1); continue; }
      if (age < 0 || !S.here(n)) continue;
      const y0 = n.y - S.sizeOf(n).h / 2 + 6;
      ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 3;
      for (let j = 0; j < 3; j++) {
        const u = (age - j * gap) / T; if (u < 0 || u >= 1) continue;
        const cy = y0 - (L.rise || 46) * (1 - Math.pow(1 - u, 3)), a = u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8, w = 13;
        ctx.strokeStyle = rgba(col, a);
        ctx.beginPath(); ctx.moveTo(n.x - w, cy + w * 0.6); ctx.lineTo(n.x, cy - w * 0.4); ctx.lineTo(n.x + w, cy + w * 0.6); ctx.stroke();
      }
      ctx.restore();
    }
  }

  const evFxs = [];
  R.eventFx = function (kind, o, count) {
    const E = mfx()[kind];
    if (!E || !E.enabled || !o) return false;
    if (kind === 'array' && E.types && E.types.indexOf(o.type) < 0) return false;
    const t0 = performance.now() / 1000;
    evFxs.push({ kind: kind, t0: t0, o: o, id: o.id, loc: o.loc || S.g.loc });
    if (kind === 'dug') {
      R.burst(o.x, o.y, { color: '#8a7a66', count: 26, speed: 110, lift: 50, size: 5, spread: 60, life: 1.1 });
      R.burst(o.x, o.y, { color: '#c7b79a', count: 14, speed: 60, lift: 70, size: 3, spread: 40, life: 1.2 });
    }
    if ((kind === 'array' || kind === 'recruit') && S.here(o) && GG.ui.spark) {
      const col = (C.resources[E.res] || {}).color || '#9fb0c2', b = S.sizeOf(o);
      setTimeout(() => {
        if (!S.node(o.id) || !S.here(o)) return;
        const p = R.toScreen(o.x + 40, o.y - b.h / 2 - 30), d = GG.ui.spark(p.x, p.y, '+' + (count || 1), 'pop');
        if (d) { d.style.color = col; d.style.textShadow = '0 0 10px ' + rgba(col, 0.55) + ', 0 2px 6px rgba(0,0,0,.85)'; }
      }, 200);
    }
    return true;
  };
  function drawEventFx() {
    if (!evFxs.length) return;
    const M = mfx(), t = performance.now() / 1000, eo = u => 1 - Math.pow(1 - u, 3);
    const rr = (X, Y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(X, Y, w, h, r); else ctx.rect(X, Y, w, h); };
    for (let i = evFxs.length - 1; i >= 0; i--) {
      const f = evFxs[i], age = t - f.t0, E = M[f.kind] || {};
      const o = f.id !== undefined ? (S.node(f.id) || (f.kind === 'strip' ? (S.g.sites || []).find(s => s.id === f.id) : null)) || (f.kind === 'strip' ? f.o : null) : f.o;
      let alive = false;
      if (o && f.loc === S.g.loc) {
        const z = f.kind === 'strip' ? S.siteBox(o) : (f.kind === 'dug' ? null : S.sizeOf(o));
        ctx.save();
        if (f.kind === 'array' || f.kind === 'recruit') {
          const u = age / 0.9;
          if (u < 1) {
            const col = (C.resources[E.res] || {}).color || '#9fb0c2';
            const rise = 34 * eo(Math.min(1, u * 2)), bob = Math.sin(Math.min(1, u * 1.6) * Math.PI * 2) * 3;
            const a = u < 0.15 ? u / 0.15 : u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1;
            ctx.globalAlpha *= a; ctx.shadowColor = col; ctx.shadowBlur = 8;
            GG.icons.drawIcon(ctx, E.icon || 'player', o.x, o.y - z.h / 2 - 4 - rise + bob, 30, col, 2.2);
            alive = true;
          }
        } else if (f.kind === 'dug') {
          const u = age / 1.1;
          if (u < 1) {
            for (let j = 0; j < 8; j++) {
              const a = j / 8 * Math.PI * 2 + 0.3, d = 30 + 50 * eo(Math.min(1, u * 1.6)), hop = Math.abs(Math.sin(u * Math.PI * 2.2)) * 26 * (1 - u);
              ctx.fillStyle = rgba(j % 2 ? '#6d6257' : '#9a8b78', 1 - u);
              ctx.beginPath(); ctx.arc(o.x + Math.cos(a) * d, o.y + Math.sin(a) * d * 0.5 - hop, 4 + (j % 3), 0, Math.PI * 2); ctx.fill();
            }
            alive = true;
          }
        } else if (f.kind === 'strip') {
          const u = age / 0.9, v = age / 1.5;
          if (v < 1) {
            const X = o.x - z.w / 2, Y = o.y - z.h / 2, per = 2 * (z.w + z.h), g = '#7ff0b0';
            ctx.strokeStyle = rgba(g, 0.9 * (1 - Math.max(0, v - 0.5) * 2)); ctx.lineWidth = 3; ctx.shadowColor = g; ctx.shadowBlur = 14;
            ctx.setLineDash([per * Math.min(1, u), per]); rr(X, Y, z.w, z.h, 14); ctx.stroke();
            alive = true;
          }
        } else if (f.kind === 'rocket') {
          const H = E.sec || 2, u = age / 0.6, col = (S.type(o) || {}).color || '#9fb0c2';
          if (age < H) {
            const X = o.x - z.w / 2, Y = o.y - z.h / 2;
            if (u < 1) {
              const pad = 3 + 18 * eo(u);
              ctx.strokeStyle = rgba(col, 0.9 * (1 - u)); ctx.lineWidth = 1 + 3 * (1 - u); ctx.shadowColor = col; ctx.shadowBlur = 16 * (1 - u);
              rr(X - pad, Y - pad, z.w + pad * 2, z.h + pad * 2, 12 + pad * 0.4); ctx.stroke();
            }
            const a = age < 0.15 ? age / 0.15 : Math.max(0, 1 - (age - H * 0.75) / (H * 0.25));
            const word = GG.i18n.t('ui.builtBadge');
            ctx.font = '800 12px Inter, system-ui, sans-serif';
            const bw = Math.max(64, ctx.measureText(word).width + 22);
            ctx.globalAlpha *= a; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.fillStyle = '#0d1820'; ctx.strokeStyle = col; ctx.lineWidth = 1.6;
            rr(X + z.w - bw - 10, Y - 12, bw, 22, 11); ctx.fill(); ctx.stroke();
            ctx.shadowBlur = 0; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(word, X + z.w - 10 - bw / 2, Y - 1);
            alive = true;
          }
        }
        ctx.restore();
      } else alive = o && age < 3;
      if (!alive) evFxs.splice(i, 1);
    }
  }
  function drawCutFx() {
    if (!cutFxs.length) return;
    const K = bfx().cut || {}, t = performance.now() / 1000;
    const seg = (P, i0, i1) => { if (i1 - i0 < 1) return; ctx.beginPath(); ctx.moveTo(P[i0].x, P[i0].y);
      for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(P[i].x, P[i].y); ctx.stroke(); };
    for (let i = cutFxs.length - 1; i >= 0; i--) {
      const f = cutFxs[i], u = (t - f.t0) / (K.sec || 0.4);
      if (!(u >= 0 && u < 1)) { cutFxs.splice(i, 1); continue; }
      const e = 1 - Math.pow(1 - u, 3), N = f.pts.length - 1;
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = K.width || 2.6;
      ctx.strokeStyle = rgba(f.col, 0.9 * (1 - u * 0.5));
      seg(f.pts, 0, Math.round(f.k * (1 - e)));
      seg(f.pts, Math.round(f.k + (N - f.k) * e), N);
      ctx.restore();
    }
  }
  function drawNode(n, time, ui) {
    const lh = (R.labNode && R.labNode(n, time)) || (popAt.size ? popOf(n) : null) || (bumpAt.size ? bumpOf(n) : null) ||
               (gustSeen ? gustBumpOf(n) : null);
    if (!lh) return drawNodeBody(n, time, ui);
    ctx.save();
    ctx.globalAlpha *= lh.a === undefined ? 1 : lh.a;
    ctx.translate(n.x, n.y); if (lh.r) ctx.rotate(lh.r); ctx.scale(lh.s || 1, lh.s || 1); ctx.translate(-n.x, -n.y);
    drawNodeBody(n, time, ui);
    ctx.restore();
  }
  function drawNodeBody(n, time, ui) {
    const L = rowLayout(n);
    const t = L.t, size = L.size;
    const x = n.x - size.w / 2, y = n.y - size.h / 2;
    const M = S.METRICS;
    const hovered = ui.hoverNode === n.id;
    const pulse = n.pulse || 0;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    cardPath(n, t, x + 3, y + 6, size.w, size.h, 12, size.w); ctx.fill();

    const grad = ctx.createLinearGradient(0, y, 0, y + size.h);
    grad.addColorStop(0, '#1a2331'); grad.addColorStop(1, '#121924');
    ctx.fillStyle = grad;
    cardPath(n, t, x, y, size.w, size.h, 12, size.w); ctx.fill();

    ctx.strokeStyle = hovered ? rgba(t.color, 0.75) : 'rgba(255,255,255,0.09)';
    ctx.lineWidth = hovered ? 1.8 : 1.2;
    cardPath(n, t, x, y, size.w, size.h, 12, size.w); ctx.stroke();

    if (GG.ui.isSelected(n.id)) {
      ctx.strokeStyle = 'rgba(232,176,75,0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -time * 14;
      cardPath(n, t, x - 4, y - 4, size.w + 8, size.h + 8, 14, size.w); ctx.stroke();
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
    }

    collar('machines', t.id, x, y, size.w, size.h, 12, time);

    if (pulse > 0) {
      ctx.strokeStyle = rgba(t.color, pulse * 0.85);
      ctx.lineWidth = 2 + pulse * 3;
      cardPath(n, t, x - pulse * 4, y - pulse * 4, size.w + pulse * 8, size.h + pulse * 8, 14, size.w); ctx.stroke();
    }

    ctx.save();
    cardPath(n, t, x, y, size.w, size.h, 12, size.w); ctx.clip();
    ctx.fillStyle = t.color;

    const prong = cardProngs(n, t, size.w);
    if (prong) {
      ctx.fillRect(x, y - prong.ph, size.w, 3);
      ctx.fillRect(x + prong.pw, y, size.w - 2 * prong.pw, 3);
    } else ctx.fillRect(x, y, size.w, 3);
    ctx.restore();

    const isz = 28, ix = x + 13, iy = y + 11;
    ctx.fillStyle = rgba(t.color, 0.13);
    roundRect(ix, iy, isz, isz, 8); ctx.fill();
    ctx.strokeStyle = rgba(t.color, 0.30); ctx.lineWidth = 1;
    roundRect(ix, iy, isz, isz, 8); ctx.stroke();
    const hp = R.headPill(n, t);
    const mot = motionOf(t);
    if (mot && liveWorking(n, hp)) liveIcon(t, mot, ix, iy, isz, time, n);
    else IC.drawIcon(ctx, t.icon, ix + isz / 2, iy + isz / 2, 17, C.iconColor(t), 1.9);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#e2ecf6';

    const pillW = hp.w;

    const dgMark = (C.diagnose.card && C.diagnose.cardMark && !C.diagnose.cardWord &&
                    !GG.sim.muted(n)) ? hp.dg : null;
    const markW = dgMark ? 17 : 0;
    const nameW = size.w - 50 - 12 - (pillW ? pillW + 8 : 0) - markW;
    const shownName = GG.sim.nameOf ? GG.sim.nameOf(n) : t.name;
    fitNameFont(shownName, nameW);
    const nameTxt = clipText(shownName, nameW);
    ctx.fillText(nameTxt, x + 50, y + 29);

    if (dgMark) {
      const mx = x + 50 + Math.min(ctx.measureText(nameTxt).width, nameW) + 6, my = y + 22;
      const col = dgMark.level === 'stop' ? C.diagnose.stopColor : C.diagnose.slowColor;
      ctx.fillStyle = rgba(col, 0.95);
      ctx.beginPath();
      ctx.moveTo(mx + 5.5, my - 5);
      ctx.lineTo(mx + 11, my + 4.5);
      ctx.lineTo(mx, my + 4.5);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = '#151d29';
      ctx.fillRect(mx + 4.8, my - 1.6, 1.4, 3.4);
      ctx.fillRect(mx + 4.8, my + 2.6, 1.4, 1.4);
    }

    const dg = hp.dg;
    const pillHot = ui && ui.hoverFlip === n.id;
    if (hp.word) {
      drawTag(x, y, size, GG.i18n.ins(dg.word),
              dg.level === 'stop' ? C.diagnose.stopColor : C.diagnose.slowColor, 0,
              hp, pillHot, 'warn');
    } else {

    if (hp.pick === 'solar') drawSolarPhase(n, x, y, size, hp, pillHot);

    if (hp.pick === 'fert') {
      const need = GG.sim.recipeNeed(n, 'fert');

      drawTag(x, y, size, '×' + GG.util.fmt(GG.sim.plantMul(n), 1), '#b98a4a',
              GG.sim.plantMaxed(n) ? 1 : (need > 0 ? (n.buf.fert || 0) / need : 0),
              hp, pillHot);
    }

    if (hp.pick === 'filter') {
      const held = n.buf.filter || 0;
      drawTag(x, y, size, GG.util.fmt(held, 2) + ' kg', t.color, held / t.buffer,
              hp, pillHot);
    }

    if (hp.pick === 'power') {
      drawTag(x, y, size, powerTag(n), C.resources[t.powerUp.res].color,
              GG.sim.powerFrac(n), hp, pillHot);
    }

    if (hp.pick === 'drain') {
      drawTag(x, y, size, ciDrainTag(n), C.currencies.ci.color,
              n.ciShare === undefined ? 1 : n.ciShare, hp, pillHot);
    }
    }

    if (dg && C.diagnose.cardFrame) {
      const col = dg.level === 'stop' ? C.diagnose.stopColor : C.diagnose.slowColor;
      ctx.save();
      cardPath(n, t, x, y, size.w, size.h, 12, size.w); ctx.clip();
      ctx.fillStyle = rgba(col, C.diagnose.tintAlpha);
      ctx.fillRect(x, y - 400, size.w, size.h + 400);
      ctx.restore();
      ctx.strokeStyle = rgba(col, C.diagnose.frameAlpha);
      ctx.lineWidth = dg.level === 'stop' ? 2 : 1.4;
      cardPath(n, t, x + 1, y + 1, size.w - 2, size.h - 2, 11, size.w); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 12, y + M.HEAD - 3.5); ctx.lineTo(x + size.w - 12, y + M.HEAD - 3.5); ctx.stroke();

    const bands = S.capRows(t, n);
    if (bands > 0) {

      warnBand = (hp.onBand && dg)
        ? { word: dg.word,
            col: dg.level === 'stop' ? C.diagnose.stopColor : C.diagnose.slowColor }
        : null;
      const bandY = i => y + M.HEAD + 4 + i * M.CAP_ROW;
      if (t.recruit) {

        band(x, bandY(0), size.w, 'WORKFORCE', n.wfPool || 0,
             GG.sim.recruitNeed(n, 'wf'), 'WF', C.resources.wf.color);
        band(x, bandY(1), size.w, 'ENERGY', n.kwPool || 0,
             GG.sim.recruitNeed(n, 'kw'), 'KW', C.resources.energy.color);
      } else if (t.print) {

        const pl = GG.sim.printPlan(n), P = t.print;
        const needP = pl ? pl.paper : P.paper, needM = pl ? pl.kg : 0;
        const held = Math.min(needP, n.buf.paper || 0) +
                     (pl ? Math.min(needM, n.buf[pl.res] || 0) : 0);
        band(x, bandY(0), size.w, 'PARTS', held, needP + needM, 'kg', t.color);
        band(x, bandY(1), size.w, 'PRINTING', n.kwPool || 0,
             pl ? pl.kw : P.kw, 'KW', C.resources.energy.color);
      } else if (t.recipe) {

        const R = t.recipe, keys = Object.keys(R.inputs);

        if (R.wf || R.kw) {
          let held = 0, need = 0;
          keys.forEach(function (k) {
            const want = GG.sim.recipeNeed(n, k);
            need += want; held += Math.min(want, n.buf[k] || 0);
          });
          const SBr = C.ui.splitBars;
          if (SBr && SBr.enabled && SBr.capacity && keys.length > 1) {
            bandSplit(x, bandY(0), size.w, 'PARTS', keys.map(function (k) {
              const want = GG.sim.recipeNeed(n, k);
              return { res: k, held: Math.min(want, n.buf[k] || 0), cap: want };
            }), 'kg', false);
          } else band(x, bandY(0), size.w, 'PARTS', held, need, 'kg', t.color);
          if (bands > 1) {
            if (R.wf) {
              band(x, bandY(1), size.w, 'ASSEMBLY',
                   n.wfPool || 0, GG.sim.recipeWf(n), 'WF', C.resources.wf.color);
            } else {
              band(x, bandY(1), size.w, 'PRESSING',
                   n.kwPool || 0, GG.sim.recipeKw(n), 'KW', C.resources.energy.color);
            }
          }
        } else {
          keys.slice(0, bands).forEach(function (k, i) {
            band(x, bandY(i), size.w, C.resources[k].name.toUpperCase(),
                 n.buf[k] || 0, GG.sim.recipeNeed(n, k), 'kg', C.resources[k].color);
          });
        }
      } else if (t.lanes) {

        t.lanes.slice(0, bands).forEach(function (L, i) {
          const gr = n.lg && n.lg[L];
          const res = gr ? C.resources[gr] : null;
          band(x, bandY(i), size.w, res ? res.name.toUpperCase() : 'SHELF ' + (i + 1),
               GG.sim.laneHeld(n, L), GG.sim.laneCap(n), 'kg', res ? res.color : t.color);
        });
      } else if (t.collectB) {

        const sum = o => { let v = 0; for (const k in (o || {})) v += o[k] || 0; return v; };
        band(x, bandY(0), size.w, 'SELLING', sum(n.buf),
             GG.sim.stat(t.id, 'buffer'), 'kg', C.currencies[t.collect.cur].color);
        band(x, bandY(1), size.w, 'BURNING', sum(n.bufB),
             GG.sim.stat(t.id, 'bufferB'), 'kg', C.currencies[t.collectB.cur].color);
      } else {

        const held = GG.sim.heldOf(n);
        const waiting = GG.sim.outHeldOf(n);
        const row = S.outletRow(t) && bands > 1;
        const idle = (n.rates.work || 0) <= (C.ui.outletBandWorkEps || 0);
        if (!row && C.ui.outletBand !== false && idle && held <= 1e-6 && waiting > 1e-6) {
          band(x, bandY(0), size.w, 'WAITING', waiting, GG.sim.outCapOf(n), 'kg', t.color);
        } else {
          const SB = C.ui.splitBars, sOn = SB && SB.enabled;
          const cp = sOn && SB.capacity ? capParts(n, t) : null;
          if (cp) bandSplit(x, bandY(0), size.w, 'CAPACITY', cp, GG.sim.capUnit(n), false);
          else band(x, bandY(0), size.w, t.store ? 'CHARGE' : 'CAPACITY',
                    held, GG.sim.capOf(n), GG.sim.capUnit(n), t.color);
          const op = row && sOn && SB.outlet ? outParts(n, t) : null;
          if (op) bandSplit(x, bandY(1), size.w, 'OUTLET', op, 'kg', true);
          else if (row) band(x, bandY(1), size.w, 'OUTLET', waiting, GG.sim.outCapOf(n), 'kg',
                             (C.resources.rtrash || t).color || t.color);

          else if (S.powerUpRow(t, n)) {
            const pu = t.powerUp, res = C.resources[pu.res] || {};
            band(x, bandY(1), size.w, (res.name || pu.res).toUpperCase(),
                 n.buf[pu.res] || 0, GG.sim.powerLoad(n), 'kg', res.color || t.color);
          }
        }
      }
    }

    warnBand = null;

    L.rows.forEach(r => drawRow(n, t, r, x, size));

    const OF = C.ui.outFill;
    if (OF && OF.enabled && (OF.types || []).indexOf(t.id) >= 0 && (OF.style === 'row' || OF.style === 'tank')) {
      const capO = GG.sim.stat(t.id, 'outBuffer') || t.outBuffer || 0;
      L.rows.forEach(r => {
        if (r.kind !== 'out' || !capO || (C.resources[r.port.res] || {}).flow !== 'material') return;
        const pct = Math.min(1, (n.obuf[r.port.id] || 0) / capO), full = pct >= 0.999;
        const col = full ? '#e8b04b' : C.resources[S.portRes(n, r.port, 'out')].color;
        if (OF.style === 'row') {
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          roundRect(x + 13, r.cy + 6.5, size.w - 26, 2.5, 1.25); ctx.fill();
          if (pct > 0) { ctx.fillStyle = col; roundRect(x + 13, r.cy + 6.5, Math.max(2, (size.w - 26) * pct), 2.5, 1.25); ctx.fill(); }
        } else {

          const gx = n.x + size.w / 2 * R.portFace(n, 'out') - 9.5 * R.portFace(n, 'out'), gh = 13;
          ctx.fillStyle = 'rgba(255,255,255,0.10)';
          roundRect(gx - 1.5, r.cy - gh / 2, 3, gh, 1.5); ctx.fill();
          if (pct > 0) { ctx.fillStyle = col; roundRect(gx - 1.5, r.cy + gh / 2 - Math.max(2, gh * pct), 3, Math.max(2, gh * pct), 1.5); ctx.fill(); }
        }
      });
    }

    if (t.cardGroups && C.ui.cardGroups !== false && L.rows.length > 1) {
      const gOf = r => (r.kind === 'vout' ? r.v.group : r.port.group);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.10)';
      ctx.lineWidth = 1;
      for (let i = 1; i < L.rows.length; i++) {
        if (gOf(L.rows[i]) === gOf(L.rows[i - 1])) continue;
        const my = Math.round((L.rows[i - 1].cy + L.rows[i].cy) / 2) + 0.5;
        ctx.beginPath();
        ctx.moveTo(n.x - size.w / 2 + 14, my);
        ctx.lineTo(n.x + size.w / 2 - 14, my);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (t.collect) drawCollect(n, t, ui);
    else if (t.action) drawAction(n, t, ui);

    const FS = C.ui.fullSocket;
    L.rows.forEach(r => {
      if (r.kind === 'vout') return;
      const px = n.x + size.w / 2 * R.portFace(n, r.kind);
      const hot = ui.hoverPort && ui.hoverPort.node.id === n.id &&
        ui.hoverPort.port.id === r.port.id && ui.hoverPort.dir === r.kind;

      const col = C.resources[S.portRes(n, r.port, r.kind)].color;
      const wired = r.kind === 'out'
        ? S.linksFrom(n.id).some(l => l.fromPort === r.port.id)
        : !!S.linkInto(n.id, r.port.id);
      const sz = hot ? 13 : 11;
      ctx.fillStyle = wired ? col : '#0e141c';
      roundRect(px - sz / 2, r.cy - sz / 2, sz, sz, 3.5); ctx.fill();
      ctx.strokeStyle = hot ? '#ffffff' : col;
      ctx.lineWidth = 2;
      roundRect(px - sz / 2, r.cy - sz / 2, sz, sz, 3.5); ctx.stroke();

      if (FS && FS.enabled && r.kind === 'out' && t.outBuffer && !t.holdLock &&
          (C.resources[r.port.res] || {}).flow === 'material' &&
          (n.obuf[r.port.id] || 0) >= (GG.sim.stat(t.id, 'outBuffer') || t.outBuffer) - GG.util.EPS) {
        const o = sz + FS.pad * 2;
        ctx.strokeStyle = FS.color;
        ctx.lineWidth = FS.width;
        roundRect(px - o / 2, r.cy - o / 2, o, o, 5); ctx.stroke();
      }
    });
  }

  let warnBand = null;

  function band(x, cy, w, label, held, cap, unit, color) {
    const pct = cap > 0 ? Math.min(1, held / cap) : 0;
    const full = pct >= 0.999;

    const warn = warnBand; warnBand = null;

    const wi = warn && { x: x, cy: cy, w: w, h: S.METRICS.CAP_ROW, word: GG.i18n.ins(warn.word), col: warn.col };
    const labW = !warn ? 0 : R.labWarn ? R.labWarn(ctx, wi) : freshLook('statusMark') ? statusCaption(wi) : 0;
    if (warn && !labW && C.diagnose.bandTint > 0) {
      ctx.fillStyle = rgba(warn.col, C.diagnose.bandTint);

      roundRect(x + 6, cy - 2, w - 12, S.METRICS.CAP_ROW - 2, 5); ctx.fill();
    }

    const text = GG.i18n.ins(warn ? warn.word : label);
    const val = GG.i18n.ins(GG.util.fmt(held, 2) + ' / ' + GG.util.fmt(cap) + ' ' + unit);

    ctx.font = '11px ' + FONT_MONO;
    const vw = warn ? ctx.measureText(val).width : 0;
    ctx.font = (warn ? '700 9.5px ' : '600 9.5px ') + FONT_UI;
    const showVal = !warn || (labW || ctx.measureText(text).width) <= w - 26 - vw - 8;
    ctx.textAlign = 'left';
    ctx.fillStyle = warn ? warn.col : 'rgba(150,170,192,0.8)';
    if (!labW) ctx.fillText(clipText(text, w - 26 - (showVal ? vw + 8 : 0)), x + 13, cy + 8);
    if (showVal) {
      ctx.textAlign = 'right';
      ctx.font = '11px ' + FONT_MONO;
      ctx.fillStyle = full ? '#e8b04b' : 'rgba(220,232,244,0.9)';

      ctx.fillText(val, x + w - 13, cy + 8);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    roundRect(x + 13, cy + 12, w - 26, 4, 2); ctx.fill();
    ctx.fillStyle = full ? '#e8b04b' : color;
    roundRect(x + 13, cy + 12, Math.max(2, (w - 26) * pct), 4, 2); ctx.fill();
  }

  function capParts(n, t) {
    if (t.store || t.bank) return null;
    const ins = S.portsOf(n, 'in').filter(p => (C.resources[p.res] || {}).flow === 'material' &&
      !p.optional && !(t.powerUp && t.powerUp.port === p.id));
    const cap = GG.sim.capOf(n);
    if (t.convert) {
      const own = ins.filter(p => t.convert.inputs[p.res] !== undefined);
      if (own.length < 2) return null;
      let sum = 0;
      own.forEach(p => { sum += GG.sim.convNeed(n, p.res); });
      return own.map(p => ({ res: p.res, held: n.buf[p.res] || 0,
                             cap: sum > 0 ? cap * GG.sim.convNeed(n, p.res) / sum : cap / own.length }));
    }
    if (t.mix && C.mixer && C.mixer.splitHopper) {
      const own = ins.filter(p => t.mix.indexOf(p.res) !== -1);
      if (own.length < 2) return null;
      return own.map(p => ({ res: p.res, held: n.buf[p.res] || 0, cap: cap / t.mix.length }));
    }
    return null;
  }
  function outParts(n, t) {
    const outs = S.portsOf(n, 'out').filter(p => (C.resources[p.res] || {}).flow === 'material');
    if (outs.length < 2) return null;
    const cap = GG.sim.stat(t.id, 'outBuffer') || t.outBuffer || 0;
    return outs.map(p => ({ res: S.portRes(n, p, 'out'), held: n.obuf[p.id] || 0, cap: cap }));
  }
  function shadeHex(hex, k) {
    if (!hex || hex[0] !== '#' || hex.length < 7) return hex;
    const v = parseInt(hex.slice(1, 7), 16), ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    return '#' + ch.map(c => Math.round(k < 1 ? c * k : c + (255 - c) * (k - 1)))
      .map(c => ('0' + Math.max(0, Math.min(255, c)).toString(16)).slice(-2)).join('');
  }
  function bandSplit(x, cy, w, label, segs, unit, isOut) {
    const SB = C.ui.splitBars, EPS = GG.util.EPS;
    const warn = warnBand; warnBand = null;
    const labOn = !!R.labWarn || freshLook('statusMark');
    if (warn && !labOn && C.diagnose.bandTint > 0) {
      ctx.fillStyle = rgba(warn.col, C.diagnose.bandTint);
      roundRect(x + 6, cy - 2, w - 12, S.METRICS.CAP_ROW - 2, 5); ctx.fill();
    }
    let held = 0, cap = 0;
    segs.forEach(s => { held += s.held; cap += s.cap; });
    const full = s => s.cap > 0 && s.held >= s.cap * 0.999;
    const allFull = segs.every(full);

    let miss = -1;
    if (!isOut && SB.nameShort && segs.some(full))
      miss = segs.findIndex(s => s.cap > 0 && s.held <= s.cap * (SB.emptyAt || 0.02) + EPS);
    let text, col = 'rgba(150,170,192,0.8)', bold = false;
    if (warn) { text = GG.i18n.ins(warn.word); col = warn.col; bold = true; }
    else if (miss >= 0) {
      const r = segs[miss].res, nm = GG.i18n.resGen(r) || (C.resources[r] || {}).name || r;
      text = GG.i18n.t('ui.notEnough').replace('%s', nm.toUpperCase());
      col = C.diagnose.stopColor; bold = true;
    } else text = GG.i18n.ins(label);
    const val = GG.i18n.ins(GG.util.fmt(held, 2) + ' / ' + GG.util.fmt(cap) + ' ' + unit);
    ctx.font = '11px ' + FONT_MONO;
    const vw = ctx.measureText(val).width;
    ctx.font = (bold ? '700 9.5px ' : '600 9.5px ') + FONT_UI;
    const wi = { x: x, cy: cy, w: w, h: S.METRICS.CAP_ROW, word: text, col: col };
    const labW = bold && labOn ? (R.labWarn ? R.labWarn(ctx, wi) : statusCaption(wi)) : 0;
    ctx.font = (bold ? '700 9.5px ' : '600 9.5px ') + FONT_UI;
    const showVal = !bold || (labW || ctx.measureText(text).width) <= w - 26 - vw - 8;
    ctx.textAlign = 'left';
    ctx.fillStyle = col;
    if (!labW) ctx.fillText(clipText(text, w - 26 - (showVal ? vw + 8 : 0)), x + 13, cy + 8);
    if (showVal) {
      ctx.textAlign = 'right';
      ctx.font = '11px ' + FONT_MONO;
      ctx.fillStyle = allFull ? '#e8b04b' : 'rgba(220,232,244,0.9)';
      ctx.fillText(val, x + w - 13, cy + 8);
    }
    ctx.textAlign = 'left';
    const gap = 2, sw = ((w - 26) - gap * (segs.length - 1)) / segs.length;
    const cols = segs.map(s => (C.resources[s.res] || {}).color || '#8aa0b8');
    const steps = SB.shadeSteps || [1, 0.6, 1.3, 0.8, 1.15];
    let bx = x + 13;
    segs.forEach((s, i) => {
      let c = cols[i];
      if (SB.shade) {
        const same = cols.map((d, j) => d === c ? j : -1).filter(j => j >= 0);
        if (same.length > 1) c = shadeHex(c, steps[same.indexOf(i)] || 1);
      }
      const pct = s.cap > 0 ? Math.min(1, s.held / s.cap) : 0;
      ctx.fillStyle = rgba(c, 0.16);
      roundRect(bx, cy + 12, sw, 4, 2); ctx.fill();
      if (pct > 0.001) {
        ctx.fillStyle = full(s) ? '#e8b04b' : c;
        roundRect(bx, cy + 12, Math.max(2, sw * pct), 4, 2); ctx.fill();
      }
      bx += sw + gap;
    });
  }

  function drawRow(n, t, r, x, size) {
    const U = GG.util;
    let label, value, col, key;

    if (r.kind === 'vout') {
      const cur = C.currencies[r.v.cur];
      key = 'v:' + (r.vi || 0);
      label = (r.n > 1 ? 'OUT ' + (r.idx + 1) : 'OUT') + '  ' + r.v.label;
      value = U.fmt(n.rates[key] || 0) + ' ' + cur.rate;

      if ((C.ui || {}).gemEta !== false && (t.recipe || {}).gem) {
        const sec = GG.sim.gemEta(n);
        value = sec === null ? '—'
          : GG.i18n.t('ui.gemIn').replace('%n', GG.sim.gemYield(n))
              .replace('%c', cur.short).replace('%t', GG.i18n.dur(sec, true));
      }
      col = cur.color;

      if (t.print) {
        const pl = GG.sim.printPlan(n), pb = pl && pl.boost && GG.sim.boostById(pl.boost);
        if (pb) { label = 'OUT  ' + pb.name; col = pb.color || col; }
        const sec = GG.sim.printEta(n);
        value = sec === null ? '—'
          : pb ? GG.i18n.t('ui.printIn').replace('%t', GG.i18n.dur(sec, true))
               : GG.i18n.t('ui.gemIn').replace('%n', pl.gem)
                   .replace('%c', cur.short).replace('%t', GG.i18n.dur(sec, true));
      }
    } else {

      const res = C.resources[S.portRes(n, r.port, r.kind)];
      key = r.kind + ':' + r.port.id;
      const tag = r.kind === 'in' ? 'IN' : 'OUT';
      label = (r.n > 1 ? tag + ' ' + (r.idx + 1) : tag) + '  ' +
              S.portLabel(n, r.port, r.kind);
      value = U.fmt(n.rates[key] || 0) + ' ' + res.rate;

      if (r.kind === 'out' && GG.sim.showsSupply(n, r.port))
        value = U.fmt(n.rates[key] || 0) + ' / ' +
                U.fmt(GG.sim.supplyAt(n, r.port.id)) + ' ' + res.rate;

      const OF = C.ui.outFill;
      if (OF && OF.enabled && OF.style === 'number' && r.kind === 'out' && (OF.types || []).indexOf(t.id) >= 0 &&
          (n.obuf[r.port.id] || 0) > 1e-3 && !((n.rates[key] || 0) > 1e-6))
        value = U.fmt(n.obuf[r.port.id], 1) + ' / ' + U.fmt(GG.sim.stat(t.id, 'outBuffer') || t.outBuffer) + ' kg';
      col = res.color;
    }

    value = GG.i18n.ins(value);
    const active = (n.rates[key] || 0) > 1e-6 ||
      (r.kind === 'out' && GG.sim.showsSupply(n, r.port) && GG.sim.supplyAt(n, r.port.id) > 1e-6);

    let valPx = 12.5;
    const twin = r.kind === 'out' && r.port && GG.sim.showsSupply(n, r.port);
    ctx.font = '600 9.5px ' + FONT_UI;
    const labW = ctx.measureText(label).width;
    ctx.font = '600 12.5px ' + FONT_MONO;
    let valW = ctx.measureText(value).width;
    while (twin && valPx > 9.5 && labW > size.w - 26 - valW - 8) {
      valPx -= 1;
      ctx.font = '600 ' + valPx + 'px ' + FONT_MONO;
      valW = ctx.measureText(value).width;
    }

    const ptag = prismRowTag(n, t, r);
    let tagW = 0;
    if (ptag) { ctx.font = '800 10.5px ' + FONT_MONO; tagW = ctx.measureText(ptag).width + 6; }
    ctx.font = '600 9.5px ' + FONT_UI;
    ctx.textAlign = 'left';
    ctx.fillStyle = active ? 'rgba(190,208,226,0.85)' : 'rgba(150,170,192,0.5)';

    const room = size.w - 26 - valW - 8 - tagW, more = / \+\d+$/.exec(label);
    const shownLab = more && ctx.measureText(label).width > room
      ? clipText(label.slice(0, more.index), room - ctx.measureText(more[0]).width) + more[0]
      : clipText(label, room);
    ctx.fillText(shownLab, x + 13, r.cy + 3.5);
    if (ptag) {
      const lx = x + 13 + ctx.measureText(shownLab).width + 6;
      ctx.font = '800 10.5px ' + FONT_MONO;
      prismRowText(ptag, lx, r.cy + 3.5);
    }

    ctx.font = '600 ' + valPx + 'px ' + FONT_MONO;
    ctx.textAlign = 'right';
    ctx.fillStyle = active ? col : 'rgba(150,170,192,0.4)';
    ctx.fillText(value, x + size.w - 13, r.cy + 3.5);
    ctx.textAlign = 'left';
  }

  function btnPath(r, lw) {
    const i = lw / 2;
    roundRect(r.x + i, r.y + i, r.w - lw, r.h - lw, Math.max(0, 6 - i));
  }

  function drawCollect(n, t, ui) {
    for (const side of GG.sim.sides(t)) drawTill(n, t, ui, side);
    if (S.feedRow(t)) drawFeed(n, t, ui);
  }

  function drawFeed(n, t, ui) {

    const r = R.collectRect(n, 'G'), per = t.recipe.handGems, need = GG.sim.gemCap(n) || per, v = Math.floor(n.gemsIn || 0);

    if (R.labFeed && R.labFeed(ctx, n, t, ui, r)) return;
    const hot = ui.hoverCollect === n.id && ui.hoverCollectSide === 'G';
    const full = v >= need, col = (C.currencies.diamond || {}).color || '#ff5c8a';
    const lw = hot ? 2 : 1.2;
    const slots = C.ui.gemSlots && need <= 8;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();
    if (!slots) {
      ctx.save(); btnPath(r, lw); ctx.clip();
      ctx.fillStyle = rgba(col, 0.3);
      ctx.fillRect(r.x, r.y, r.w * Math.min(1, v / need), r.h);
      ctx.restore();
    }
    ctx.strokeStyle = full ? rgba(col, 0.5) : rgba(col, hot ? 1 : 0.85);
    ctx.lineWidth = lw; btnPath(r, lw); ctx.stroke();
    const I = GG.i18n;
    ctx.font = '700 10.5px ' + FONT_UI; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    if (slots) {

      const word = I.ins(full ? 'DIAMONDS IN' : 'ADD'), ww = ctx.measureText(word).width;
      const sz = 12, step = 15, gap = 9, groups = Math.ceil(need / per);
      const stonesW = need * step - (step - sz) + (groups - 1) * gap;
      let x = r.x + r.w / 2 - (ww + 10 + stonesW) / 2;
      const cy = r.y + r.h / 2;
      ctx.fillStyle = full ? 'rgba(251,233,255,0.7)' : '#fbe9ff';
      ctx.fillText(word, x, cy + 0.5); x += ww + 10;
      for (let i = 0; i < need; i++) {
        if (i > 0 && i % per === 0) {
          const lx = x + gap / 2 - (step - sz) / 2 - 1;
          ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(lx, r.y + 5); ctx.lineTo(lx, r.y + r.h - 5); ctx.stroke();
          x += gap;
        }
        const on = i < v, cx = x + sz / 2;
        if (on) { ctx.fillStyle = rgba(col, 0.35); ctx.beginPath(); ctx.arc(cx, cy, sz / 2 + 1, 0, Math.PI * 2); ctx.fill(); }
        IC.drawIcon(ctx, 'diamond', cx, cy, sz, on ? col : 'rgba(251,233,255,0.28)', 1.8);
        x += step;
      }
      ctx.textBaseline = 'alphabetic';
      return;
    }
    const label = I.ins(full ? 'DIAMONDS IN' : 'ADD') + '  ' + v + ' / ' + need;
    const tw = ctx.measureText(label).width, ic = 12, gx = r.x + r.w / 2 - (tw + ic + 5) / 2;
    IC.drawIcon(ctx, 'diamond', gx + ic / 2, r.y + r.h / 2, ic, col, 1.8);
    ctx.fillStyle = full ? 'rgba(251,233,255,0.7)' : '#fbe9ff';
    ctx.fillText(label, gx + ic + 5, r.y + r.h / 2 + 0.5);
    ctx.textBaseline = 'alphabetic';
  }

  function drawTill(n, t, ui, side) {
    const r = R.collectRect(n, side);
    const def = GG.sim.sideDef(t, side);
    const split = !!t.collectB;
    const cur = C.currencies[def.cur];
    const shown = tillShown(n, side);
    const till = shown ? shown.val : ((side === 'B' ? n.tillB : n.till) || 0);
    const cap = GG.sim.collectCap(t, n, side);
    const pct = Math.min(1, till / cap);
    const full = !shown && pct >= 0.999;
    const ready = till > 1e-6;
    const hot = ui.hoverCollect === n.id && (ui.hoverCollectSide || undefined) === side;
    const lw = hot ? 2 : 1.2;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();

    ctx.save();
    btnPath(r, lw); ctx.clip();
    ctx.fillStyle = full ? 'rgba(232,176,75,0.40)' : rgba(cur.color, 0.32);
    ctx.fillRect(r.x, r.y, r.w * pct, r.h);
    if (shown && shown.sweep >= 0) {
      const sx = r.x + r.w * shown.sweep, sg = ctx.createLinearGradient(sx - 30, 0, sx + 6, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(255,255,255,0.35)');
      ctx.fillStyle = sg; ctx.fillRect(sx - 30, r.y, 36, r.h);
    }
    ctx.restore();

    ctx.strokeStyle = full ? '#e8b04b' : (ready ? rgba(cur.color, hot ? 1 : 0.75) : 'rgba(255,255,255,0.12)');
    ctx.lineWidth = lw;
    btnPath(r, lw); ctx.stroke();

    ctx.font = '700 10.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = ready ? '#f2e9ff' : 'rgba(190,208,226,0.45)';
    const cid = def.cur, verb = def.label || 'COLLECT';

    const txt = split
      ? (full ? GG.i18n.ins('FULL') + ' ' + GG.util.cur(cid, till, 0)
              : verb + '  ' + GG.util.cur(cid, till, 0))
      : (full ? GG.i18n.ins('FULL') + ' — ' + verb + ' ' + GG.util.cur(cid, till, 2)
              : verb + '  ' + GG.util.curRange(cid, till, cap, 2));

    ctx.save();
    if (split) { btnPath(r, lw); ctx.clip(); }
    ctx.fillText(GG.i18n.ins(txt), r.x + r.w / 2, r.y + r.h / 2 + 0.5);
    ctx.restore();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  function drawLicence(n, t, ui) {
    const r = R.collectRect(n);
    const hot = ui.hoverCollect === n.id;
    const left = GG.sim.licenceLeft(n), on = left > 0;

    const dry = !on && !((n.buf.oil || 0) > 1e-9);
    const pct = Math.min(1, left / t.licence.sec);
    const lw = hot ? 2 : 1.2;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();
    ctx.save();
    btnPath(r, lw); ctx.clip();
    ctx.fillStyle = rgba(t.color, 0.32);
    ctx.fillRect(r.x, r.y, r.w * pct, r.h);
    ctx.restore();

    ctx.strokeStyle = dry ? 'rgba(255,255,255,0.12)'
      : (on ? rgba(t.color, hot ? 1 : 0.8) : rgba('#62d4e3', hot ? 1 : 0.5));
    ctx.lineWidth = lw;
    btnPath(r, lw); ctx.stroke();

    ctx.font = '700 10.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = dry ? 'rgba(190,208,226,0.45)' : (on ? '#ffe9cc' : '#cfe9ee');
    const mm = Math.floor(left / 60), ss = Math.floor(left % 60);
    const txt = on
      ? GG.i18n.ins('RUNNING') + '  ' + mm + ':' + String(ss).padStart(2, '0')
      : (dry ? GG.i18n.ins('NO OIL IN THE TANK')
        : t.action.label + '  ' + GG.util.cur(t.licence.cur, GG.sim.licenceCost(t)));
    ctx.fillText(GG.i18n.ins(txt), r.x + r.w / 2, r.y + r.h / 2 + 0.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  function drawFission(n, t, ui) {
    const r = R.collectRect(n);
    const hot = ui.hoverCollect === n.id;
    const F = GG.sim.reactorFuel(n), left = GG.sim.licenceLeft(n), on = left > 0;
    const dry = !on && !((n.buf[F.res || 'rod'] || 0) + 1e-9 >= F.kg);
    const pct = Math.min(1, left / F.sec);
    const lw = hot ? 2 : 1.2;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();
    ctx.save();
    btnPath(r, lw); ctx.clip();
    ctx.fillStyle = rgba(t.color, 0.32);
    ctx.fillRect(r.x, r.y, r.w * pct, r.h);
    ctx.restore();

    const fuelRes = (GG.sim.reactorFuel ? GG.sim.reactorFuel(n).res : 'rod') || 'rod';
    const fuelCol = (C.resources[fuelRes] || C.resources.rod).color;
    ctx.strokeStyle = dry ? 'rgba(255,255,255,0.12)'
      : (on ? rgba(t.color, hot ? 1 : 0.8) : rgba(fuelCol, hot ? 1 : 0.6));
    ctx.lineWidth = lw;
    btnPath(r, lw); ctx.stroke();

    ctx.font = '700 10.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = dry ? 'rgba(190,208,226,0.45)' : (on ? '#fff3cc' : '#d6f7ee');
    const mm = Math.floor(left / 60), ss = Math.floor(left % 60);
    const txt = on
      ? GG.i18n.ins('RUNNING') + '  ' + mm + ':' + String(ss).padStart(2, '0')
      : (dry ? GG.i18n.ins(fuelRes === 'rod' ? 'NO RODS' : 'NO PELLETS') : GG.i18n.ins(t.action.label));
    ctx.fillText(txt, r.x + r.w / 2, r.y + r.h / 2 + 0.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  function drawHold(n, t, ui) {
    const r = R.collectRect(n, 'H'), cap = GG.sim.rocketHoldCap(n), v = Math.floor(n.gemHold || 0);
    const hot = ui.hoverCollect === n.id && ui.hoverCollectSide === 'H';
    const full = cap > 0 && v >= cap, col = full ? '#ff6b6b' : ((C.currencies.diamond || {}).color || '#d0a6f5');
    const lw = hot ? 2 : 1.2;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();
    ctx.save(); btnPath(r, lw); ctx.clip();
    ctx.fillStyle = rgba(col, 0.3);
    ctx.fillRect(r.x, r.y, r.w * (cap > 0 ? Math.min(1, v / cap) : 0), r.h);
    ctx.restore();
    ctx.strokeStyle = v ? rgba(col, hot ? 1 : 0.85) : 'rgba(255,255,255,0.14)';
    ctx.lineWidth = lw; btnPath(r, lw); ctx.stroke();
    const I = GG.i18n;
    ctx.font = '700 10.5px ' + FONT_UI; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const label = (v ? I.ins(full ? 'HOLD FULL' : 'COLLECT') + '  ' : '') + v + ' / ' + cap;
    const tw = ctx.measureText(label).width, ic = 12, gx = r.x + r.w / 2 - (tw + ic + 5) / 2;
    IC.drawIcon(ctx, 'diamond', gx + ic / 2, r.y + r.h / 2, ic, v ? col : 'rgba(190,208,226,0.6)', 1.8);
    ctx.fillStyle = v ? (full ? '#ffd6d6' : '#fbe9ff') : 'rgba(190,208,226,0.6)';
    ctx.fillText(label, gx + ic + 5, r.y + r.h / 2 + 0.5);
    ctx.textBaseline = 'alphabetic';
  }

  function drawLaunch(n, t, ui) {
    const r = R.collectRect(n);
    const hot = ui.hoverCollect === n.id && ui.hoverCollectSide !== 'H';
    if (S.holdRow(t)) drawHold(n, t, ui);
    const st = GG.sim.rocketState(n), F = t.rocket.flight;
    const ready = st.state === 'ready', flying = st.state === 'flying';
    const lw = hot ? 2 : 1.2;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();
    ctx.save();
    btnPath(r, lw); ctx.clip();
    ctx.fillStyle = rgba(flying ? '#ff9f5a' : t.color, 0.3);
    ctx.fillRect(r.x, r.y, r.w * Math.min(1, st.pct), r.h);
    ctx.restore();

    ctx.strokeStyle = ready ? rgba(t.color, hot ? 1 : 0.85)
      : (flying ? rgba('#ff9f5a', 0.8) : 'rgba(255,255,255,0.14)');
    ctx.lineWidth = lw;
    btnPath(r, lw); ctx.stroke();

    ctx.font = '700 10.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = ready ? '#ffe3f0' : (flying ? '#fff0e0' : 'rgba(190,208,226,0.7)');
    const U = GG.util, I = GG.i18n;
    let txt;
    if (flying) {
      const mm = Math.floor(st.left / 60), ss = Math.floor(st.left % 60);
      txt = I.ins('IN FLIGHT') + '  ' + mm + ':' + String(ss).padStart(2, '0');
    } else if (st.state === 'building') txt = I.ins('BUILDING ' + Math.floor(st.pct * 100) + '%');
    else if (st.state === 'hold') txt = I.ins('EMPTY THE HOLD');
    else if (st.state === 'fuel' && t.rocket.crewWithFuel && st.crew + U.EPS < st.crewNeed) {

      const fu = I.ins('FUEL ' + U.small(st.have) + '/' + st.need + ' kg');
      const cr = I.ins('CREW ' + Math.floor(st.crew) + '/' + st.crewNeed);
      const room = r.w - 12;
      txt = fu + ' · ' + cr;
      if (ctx.measureText(txt).width > room)
        txt = st.have / st.need <= st.crew / st.crewNeed
          ? I.ins('FUEL ' + U.small(st.have) + ' / ' + st.need + ' kg')
          : I.ins('CREW ' + Math.floor(st.crew) + ' / ' + F.wf + ' WF');
    }
    else if (st.state === 'fuel') txt = I.ins('FUEL ' + U.small(st.have) + ' / ' + st.need + ' kg');
    else if (st.state === 'crew') txt = I.ins('CREW ' + Math.floor(st.have) + ' / ' + F.wf + ' WF');
    else if (st.state === 'ci') txt = I.ins('NOT ENOUGH CI');
    else txt = I.ins(t.action.label);
    ctx.fillText(txt, r.x + r.w / 2, r.y + r.h / 2 + 0.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  function drawPull(n, t, ui) {
    const r = R.collectRect(n);
    const hot = ui.hoverCollect === n.id;
    const cost = GG.sim.beaconCost(t), have = n.bank || 0;
    const ready = have >= cost - 1e-9;

    const block = ready && GG.sim.beaconBlocked ? GG.sim.beaconBlocked(n) : false;
    const full = !!block;
    const pct = cost > 0 ? Math.min(1, have / cost) : 0;
    const lw = hot ? 2 : 1.2;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();
    ctx.save();
    btnPath(r, lw); ctx.clip();
    ctx.fillStyle = rgba(t.color, ready ? 0.34 : 0.22);
    ctx.fillRect(r.x, r.y, r.w * pct, r.h);
    ctx.restore();

    ctx.strokeStyle = (ready && !full) ? rgba(t.color, hot ? 1 : 0.78) : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = lw;
    btnPath(r, lw); ctx.stroke();

    ctx.font = '700 10.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = (ready && !full) ? '#eaf3ff' : 'rgba(190,208,226,0.45)';
    const txt = full ? GG.i18n.ins(typeof block === 'string' ? block : 'SKY FULL')
      : ready ? t.action.label
      : GG.i18n.ins(GG.util.small(have) + ' / ' + GG.util.small(cost) + ' KW');
    ctx.fillText(GG.i18n.ins(txt), r.x + r.w / 2, r.y + r.h / 2 + 0.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  function drawAction(n, t, ui) {
    if (t.action.kind === 'licence') return drawLicence(n, t, ui);
    if (t.action.kind === 'fission') return drawFission(n, t, ui);
    if (t.action.kind === 'launch') return drawLaunch(n, t, ui);
    if (t.action.kind === 'pull') return drawPull(n, t, ui);
    const r = R.collectRect(n);
    const hot = ui.hoverCollect === n.id;
    const crew = GG.sim.crewOf(n), room = GG.sim.hireRoom(n);
    const max = GG.sim.hireMax(n);
    const fill = hireShown(n);
    const pct = fill ? Math.min(fill.pct, crew / max) : crew / max;
    const lw = hot ? 2 : 1.2;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();
    ctx.save();
    btnPath(r, lw); ctx.clip();
    ctx.fillStyle = rgba(t.color, 0.30);
    ctx.fillRect(r.x, r.y, r.w * pct, r.h);
    if (fill && fill.glow > 0 && pct > fill.from) {
      const x0 = r.x + r.w * fill.from, head = r.x + r.w * pct;
      const g = ctx.createLinearGradient(x0, 0, Math.max(x0 + 1, head), 0);
      g.addColorStop(0, 'rgba(143,196,255,' + (0.10 * fill.glow).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(190,225,255,' + (0.55 * fill.glow).toFixed(3) + ')');
      ctx.fillStyle = g; ctx.fillRect(x0, r.y, head - x0, r.h);
      ctx.fillStyle = 'rgba(235,245,255,' + (0.9 * fill.glow).toFixed(3) + ')';
      ctx.fillRect(head - 1.5, r.y, 3, r.h);
    }
    ctx.restore();

    const price = GG.sim.hirePrice(n, 1), wallet = S.bank(t.hire.currency);
    const look = (C.ui || {}).hireAfford;
    const poor = !!look && room > 0 && !GG.util.canAfford(wallet, price);
    const grey = poor && look !== 'red';
    if (poor && look === 'line') {
      ctx.save(); btnPath(r, lw); ctx.clip();
      ctx.fillStyle = rgba(C.currencies[t.hire.currency].color, 0.85);
      ctx.fillRect(r.x, r.y + r.h - 2.5, r.w * Math.max(0, Math.min(1, wallet / price)), 2.5);
      ctx.restore();
    }

    ctx.strokeStyle = room > 0 && !grey ? rgba(t.color, hot ? 1 : 0.75) : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = lw;
    btnPath(r, lw); ctx.stroke();

    ctx.font = '700 10.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = room > 0 && !grey ? '#eaf3ff' : 'rgba(190,208,226,0.45)';
    const cy = r.y + r.h / 2 + 0.5, tail = '   ' + crew + '/' + max;
    if (poor && look === 'red') {
      const a = GG.i18n.ins(t.action.label + '  '), b = GG.util.cur(t.hire.currency, price);
      const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width, wc = ctx.measureText(tail).width;
      let x = r.x + r.w / 2 - (wa + wb + wc) / 2;
      ctx.textAlign = 'left';
      ctx.fillText(a, x, cy); x += wa;
      ctx.fillStyle = '#ff7a6b'; ctx.fillText(b, x, cy); x += wb;
      ctx.fillStyle = '#eaf3ff'; ctx.fillText(tail, x, cy);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      return;
    }
    const txt = room > 0
      ? (poor && look === 'have'
        ? GG.util.cur(t.hire.currency, Math.floor(wallet)) + ' / ' + GG.util.cur(t.hire.currency, price)
        : t.action.label + '  ' + GG.util.cur(t.hire.currency, price)) + tail
      : GG.i18n.ins('FULL CREW') + '  ' + crew + '/' + max + '  ' +
        Math.ceil(GG.sim.crewLeft(n)) + 's';
    ctx.fillText(GG.i18n.ins(txt), r.x + r.w / 2, cy);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  function liveWorking(n, hp) {
    if (hp && hp.dg && hp.dg.level === 'stop') return false;
    if (GG.sim.digFull(n)) return false;
    const r = n.rates || {}, eps = 1e-4, t = S.type(n);

    const kit = t.powerUp && t.powerUp.port;

    const LI = (C.ui && C.ui.liveIcons) || {};
    if (!(t.lightSplit && LI.sortsUnfed !== false)) {
      const needs = S.portsOf(n, 'in').filter(p => !p.optional && p.id !== kit &&
        (C.resources[p.res] || {}).flow === 'rate');
      const got = needs.filter(p => (r['in:' + p.id] || 0) > eps).length;
      const any = (LI.anySupply || []).indexOf(t.id) >= 0;
      if (any ? (needs.length && !got) : got < needs.length) return false;
    }
    for (const k in r) if (r[k] > eps && (k === 'work' || k.indexOf('in:') === 0 ||
                                        k.indexOf('out:') === 0 || k.indexOf('v:') === 0)) return true;
    return false;
  }
  R.liveWorking = function (n) { return liveWorking(n, R.headPill(n, S.type(n))); };

  function motionOf(t) {
    const LI = C.ui.liveIcons;
    if (!LI || !LI.enabled || !t) return null;
    const tab = (LI.update14 === false && LI.motionsBefore14) ? LI.motionsBefore14 : LI.motions;
    return (tab && tab[t.id]) || null;
  }
  R.motionOf = motionOf;
  const livePath = new Map();

  const SUN_RAYS = [[12, 3.6], [5.35, 6.85], [18.65, 6.85], [3.7, 12.2], [20.3, 12.2]];
  const PUFF_AT = { reactor: [12, 5.6], oilgen: [9.6, 3.4] };

  const bladeSpin = new Map();
  function bladeAngle(n, ph, time) {
    const B = C.ui.liveIcons.bladesWx, base = 3.2;
    if (!B || !B.enabled || !n.id) return ph * base;
    const want = Math.max(0, Math.min(B.maxMul || 4, GG.sim.mulJoin([GG.sim.wxEnergy(n), GG.sim.gustMul(n)])));
    let s = bladeSpin.get(n.id);
    if (!s) { s = { a: ph * base, m: want, t: time }; bladeSpin.set(n.id, s); }
    const dt = Math.max(0, Math.min(0.1, time - s.t));
    s.t = time;
    s.m += (want - s.m) * Math.min(1, dt / (B.easeSec || 0.8));
    s.a += base * s.m * dt;
    return s.a;
  }

  function shovelPose(Sv, k) {
    const K = Sv.keys, e = x => x * x * (3 - 2 * x);
    let i = 0; while (i < K.length - 2 && k > K[i + 1][0]) i++;
    const a = K[i], b = K[i + 1], f = e(Math.max(0, Math.min(1, (k - a[0]) / ((b[0] - a[0]) || 1))));
    const pose = kk => {
      let j = 0; while (j < K.length - 2 && kk > K[j + 1][0]) j++;
      const p = K[j], q = K[j + 1], g = e(Math.max(0, Math.min(1, (kk - p[0]) / ((q[0] - p[0]) || 1))));
      return { al: p[1] + (q[1] - p[1]) * g, rot: p[2] + (q[2] - p[2]) * g };
    };
    const al = a[1] + (b[1] - a[1]) * f, rot = a[2] + (b[2] - a[2]) * f, pv = Sv.pivot;
    const xf = (pt, P) => { const c = Math.cos(P.rot), s = Math.sin(P.rot), x = pt[0] - pv[0], y = pt[1] - pv[1];
      return { x: pv[0] + x * c - y * s + Sv.dir[0] * P.al, y: pv[1] + x * s + y * c + Sv.dir[1] * P.al }; };
    const out = { Sv: Sv, dx: Sv.dir[0] * al, dy: Sv.dir[1] * al, a: rot, dirt: [] }, D = Sv.dirt || {};
    if (D.ride && k >= D.ride[0] && k < D.fly[1]) {
      (D.clods || []).forEach((c, n) => {
        let p;
        if (k < D.fly[0]) p = xf(c, { al: al, rot: rot });
        else {
          const s0 = xf(c, pose(D.fly[0])), tt = (k - D.fly[0]) * Sv.sec;
          p = { x: s0.x + D.v[0] * tt * (1 + n * 0.15), y: s0.y + D.v[1] * tt + 0.5 * D.grav * tt * tt };
        }
        const fade = k < D.fly[0] ? Math.min(1, (k - D.ride[0]) / 0.06) : 1 - (k - D.fly[0]) / (D.fly[1] - D.fly[0]);
        out.dirt.push({ x: p.x, y: p.y, r: c[2] || 0.9, a: Math.max(0, fade) * 0.95 });
      });
    }
    (D.spray || []).forEach(t0 => {
      const u = (k - t0) / (D.sprayLen || 0.18);
      if (u <= 0 || u >= 1) return;
      for (let n = 0; n < 4; n++) { const vx = (n - 1.5) * 2.2, vy = -5 - (n % 2) * 1.5, tt = u * 0.9;
        out.dirt.push({ x: D.at[0] + vx * tt, y: D.at[1] + vy * tt + 7 * tt * tt, r: 1.0, a: 0.95 * (1 - u) }); }
    });
    return out;
  }
  R.shovelPose = shovelPose;
  R.bladeSpin = function (id) { const s = bladeSpin.get(id); return s ? { mul: s.m, angle: s.a } : null; };
  function liveIcon(t, m, bx, by, isz, time, n) {
    const col = C.iconColor(t), cx = bx + isz / 2, cy = by + isz / 2;
    const seed = n.id ? (parseInt(String(n.id).replace(/\D/g, ''), 10) || 0) : 0;
    const ph = time + seed * 1.7, TAU = Math.PI * 2;
    let raw = livePath.get(t.icon);
    if (!raw) { raw = (IC.paths[t.icon] || []).map(d => ({ d: d, p: new Path2D(d) })); livePath.set(t.icon, raw); }
    ctx.save();
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, isz, isz, 8) : ctx.rect(bx, by, isz, isz); ctx.clip();
    let blades = null, shovel = null;
    if (m === 'shovel') {
      const Sv = C.ui.liveIcons.shovel, k = (ph % Sv.sec) / Sv.sec, e = x => x * x * (3 - 2 * x);
      const up = k < Sv.up ? e(k / Sv.up) : k < 1 - Sv.down ? 1 : 1 - e((k - 1 + Sv.down) / Sv.down);
      shovel = { Sv: Sv, dx: Sv.dir[0] * Sv.lift * up, dy: Sv.dir[1] * Sv.lift * up, a: Sv.tilt * up };
    } else if (typeof m === 'string' && m.indexOf('shovel') === 0 && C.ui.liveIcons[m] && C.ui.liveIcons[m].keys) {
      shovel = shovelPose(C.ui.liveIcons[m], (ph % C.ui.liveIcons[m].sec) / C.ui.liveIcons[m].sec);
    } else if (m === 'blades' || m === 'bladesGust') blades = { hub: t.icon === 'stormTurbine' ? [14, 12] : [12, 12], a: bladeAngle(n, ph, time) };
    else if (m === 'spin') { ctx.translate(cx, cy); ctx.rotate(ph * 0.9); ctx.translate(-cx, -cy); }
    else if (m === 'hover') ctx.translate(0, Math.sin(ph * 3) * 1.6);
    else if (m === 'sift') ctx.translate(Math.sin(ph * 9) * 1.8, 0);
    else if (m === 'dig') { const k = (ph % 1.3) / 1.3, d = Math.sin(Math.min(1, k / 0.6) * Math.PI);
      ctx.translate(cx, cy + d * 2.56); ctx.rotate(-0.448 * d); ctx.translate(-cx, -cy); }
    else if (m === 'press') { const k = (ph % 1.2) / 1.2, d = k < 0.12 ? k / 0.12 : k < 0.3 ? 1 - (k - 0.12) / 0.18 : 0;
      ctx.translate(cx, cy + d * 3.2); ctx.scale(1 + d * 0.08, 1 - d * 0.256); ctx.translate(-cx, -cy); }
    else if (m === 'grow') {
      const sc = 1 + Math.sin(ph * 1.5) * 0.12;
      ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
    }

    else if (m === 'breathe') { const b = 0.5 + 0.5 * Math.sin(ph * 2.1), fy = by + isz - 4;
      ctx.translate(cx, fy); ctx.scale(1 + b * 0.03, 1 + b * 0.085); ctx.translate(-cx, -fy); }

    const fork = (k, up) => {
      if (k < 0.22) return { x: 2.5 + 4.5 * k / 0.22, y: 12 };
      const yE = up ? 5 : 19;
      if (k < 0.68) { const u = (k - 0.22) / 0.46, v = 1 - u;
        return { x: v * v * v * 7 + 3 * v * v * u * 10 + 3 * v * u * u * 11 + u * u * u * 14, y: v * v * v * 12 + 3 * v * v * u * 12 + 3 * v * u * u * yE + u * u * u * yE }; }
      return { x: 14 + 5.5 * (k - 0.68) / 0.32, y: yE };
    };

    const merge = (k, top) => {
      const y0 = top ? 5 : 19;
      if (k < 0.2) return { x: 2.5 + 4.5 * k / 0.2, y: y0 };
      if (k < 0.65) { const u = (k - 0.2) / 0.45, v = 1 - u;
        return { x: v * v * v * 7 + 3 * v * v * u * 10 + 3 * v * u * u * 11 + u * u * u * 14, y: v * v * v * y0 + 3 * v * v * u * y0 + 3 * v * u * u * 12 + u * u * u * 12 }; }
      return { x: 14 + 5.5 * (k - 0.65) / 0.35, y: 12 };
    };

    const PM = (m && typeof m === 'object' && m.parts) ? m
      : (typeof m === 'string' && C.ui.liveIcons[m] && C.ui.liveIcons[m].parts) ? C.ui.liveIcons[m] : null;
    const byPath = {}; if (PM) PM.parts.forEach(pt => (pt.paths || []).forEach(j => { byPath[j] = pt; }));
    const partStroke = (pt, q) => {
      const sec = pt.sec || 2, k = ((ph / sec) + (pt.phase || 0)) % 1, w = 0.5 - 0.5 * Math.cos(TAU * k), a = pt.amp === undefined ? 1 : pt.amp;
      const pv = pt.pivot || [12, 12], dir = pt.dir || [0, 1];
      ctx.save();
      if (pt.type === 'slide') ctx.translate(dir[0] * a * w, dir[1] * a * w);
      else if (pt.type === 'shake') ctx.translate(Math.sin(TAU * k * 4) * a * 0.5, 0);
      else if (pt.type === 'spin' || pt.type === 'swing' || pt.type === 'pulse' || pt.type === 'squash') {
        ctx.translate(pv[0], pv[1]);
        if (pt.type === 'spin') ctx.rotate(TAU * k * (pt.ccw ? -1 : 1));
        else if (pt.type === 'swing') ctx.rotate(a * Math.sin(TAU * k));
        else if (pt.type === 'squash') ctx.scale(1 + a * w * 0.6, 1 - a * w);
        else ctx.scale(1 + a * w, 1 + a * w);
        ctx.translate(-pv[0], -pv[1]);
      } else if (pt.type === 'blink') ctx.globalAlpha = 0.25 + 0.75 * w;
      else if (pt.type === 'rise') { ctx.translate(dir[0] * a * k, dir[1] * a * k); ctx.globalAlpha = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8; }
      else if (pt.type === 'dash') { ctx.setLineDash([1.6, 1.9]); ctx.lineDashOffset = -k * 7 * (pt.ccw ? -1 : 1); }
      else if (pt.type === 'fill') { ctx.fillStyle = rgba(pt.color || col, ((pt.alpha || 0.5) * w).toFixed(3)); ctx.fill(q.p); }
      ctx.stroke(q.p); ctx.restore();
    };
    const partFx = f => {

      if (f.type === 'twinkle') {
        const P = f.points || [], sec = f.sec || 1.6, R = f.r || 1.8;
        ctx.strokeStyle = f.color || lighten(col, 0.6); ctx.lineWidth = 0.8;
        P.forEach((pt, j) => { const k = ((ph / sec) + j / P.length) % 1, z = Math.sin(Math.PI * Math.min(1, k / 0.45));
          if (k >= 0.45 || z <= 0.02) return;
          const r = R * z; ctx.globalAlpha = z;
          ctx.beginPath(); ctx.moveTo(pt[0] - r, pt[1]); ctx.lineTo(pt[0] + r, pt[1]); ctx.moveTo(pt[0], pt[1] - r); ctx.lineTo(pt[0], pt[1] + r);
          ctx.moveTo(pt[0] - r * 0.4, pt[1] - r * 0.4); ctx.lineTo(pt[0] + r * 0.4, pt[1] + r * 0.4); ctx.moveTo(pt[0] + r * 0.4, pt[1] - r * 0.4); ctx.lineTo(pt[0] - r * 0.4, pt[1] + r * 0.4);
          ctx.stroke(); });
        ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.lineWidth = 1.9 / (fit ? fit.f : 1);
        return;
      }
      if (f.type !== 'dots') return;
      const nn = f.n || 3, sec = f.sec || 1.4, to = f.to || [f.from];
      ctx.fillStyle = f.color || lighten(col, 0.45);
      for (let j = 0; j < nn; j++) { const u = ph / sec + j / nn, k = u % 1, tg = to[(Math.floor(u) + j) % to.length];
        ctx.globalAlpha = Math.min(1, k / 0.1, (1 - k) / 0.15);
        ctx.beginPath(); ctx.arc(f.from[0] + (tg[0] - f.from[0]) * k, f.from[1] + (tg[1] - f.from[1]) * k, f.r || 1.2, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    };

    const lighten = (hex, f) => { const v = parseInt(String(hex).slice(1), 16); if (isNaN(v)) return hex;
      const ch = sh => { const c = (v >> sh) & 255; return Math.round(c + (255 - c) * f); };
      return 'rgb(' + ch(16) + ',' + ch(8) + ',' + ch(0) + ')'; };

    const glance = () => { const k = (ph % 4) / 4, e = x => x * x * (3 - 2 * x), seg = Math.floor(k * 4), f = e(Math.min(1, (k * 4 - seg) / 0.35));
      const at = [0, -0.75, 0, 0.75, 0]; return at[seg] + (at[seg + 1] - at[seg]) * f; };

    const size = 17, s = size / 24, fit = IC.fitOf(t.icon);
    ctx.save(); ctx.translate(cx - size / 2, cy - size / 2); ctx.scale(s, s);
    if (fit) { ctx.translate(12, 12); ctx.scale(fit.f, fit.f); ctx.translate(-fit.cx, -fit.cy); }
    ctx.strokeStyle = col; ctx.lineWidth = 1.9 / (fit ? fit.f : 1); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (m === 'charge') {
      const k = (ph * 0.3) % 1, e = x => x * x * (3 - 2 * x), f = k < 0.45 ? e(k / 0.45) : k < 0.55 ? 1 : 1 - e((k - 0.55) / 0.45);
      ctx.fillStyle = rgba(col, 0.55); ctx.fillRect(5.3, 9.3, 10.4 * f, 5.4);
    }
    raw.forEach(function (q, i) {
      if (byPath[i]) { partStroke(byPath[i], q); return; }
      if (shovel && shovel.Sv.paths.indexOf(i) >= 0) {
        const pv = shovel.Sv.pivot;
        ctx.save(); ctx.translate(shovel.dx + pv[0], shovel.dy + pv[1]); ctx.rotate(shovel.a);
        ctx.translate(-pv[0], -pv[1]); ctx.stroke(q.p); ctx.restore();
      } else if (blades && /^M1[24] 12/.test(q.d) && !/^M1[24] 12V2/.test(q.d)) {
        ctx.save(); ctx.translate(blades.hub[0], blades.hub[1]); ctx.rotate(blades.a);
        ctx.translate(-blades.hub[0], -blades.hub[1]); ctx.stroke(q.p); ctx.restore();
      } else if (m === 'waves' && i >= 2) {
        const k = (ph * 0.55 + (i - 2) * 0.5) % 1;
        ctx.save(); ctx.globalAlpha = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85; ctx.translate(k * 4, 0); ctx.stroke(q.p); ctx.restore();
      } else if (m === 'brew' && i >= 4) {
        const k = (ph * 0.6 + (i - 4) / 3) % 1;
        ctx.save(); ctx.globalAlpha = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8; ctx.translate(0, 1.5 - k * 4); ctx.stroke(q.p); ctx.restore();
      } else if (m === 'eyes' && (i === 3 || i === 4)) {
        ctx.save(); ctx.translate(glance(), 0); ctx.stroke(q.p); ctx.restore();
      } else if (m === 'absorb' && (i === 3 || i === 4)) {

      } else if (m === 'absorb' && i <= 2) {
        const k = (ph * 0.45 + i * 0.2) % 1, mid = SUN_RAYS[i];
        ctx.save(); ctx.globalAlpha = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
        ctx.translate((12 - mid[0]) * k * 0.45, (17.9 - mid[1]) * k * 0.45); ctx.stroke(q.p); ctx.restore();
      } else if (m === 'bladesGust' && (i === 5 || i === 6)) {
        ctx.save(); ctx.translate(Math.sin(ph * 2.6 + i * 1.7) * 1.3, 0); ctx.stroke(q.p); ctx.restore();
      } else if (m === 'bladeOut' && (i === 4 || i === 5)) {
        const d = 2.4 * (0.5 - 0.5 * Math.cos(ph * 1.8));
        ctx.save(); ctx.translate(0.68 * d, -0.73 * d); ctx.stroke(q.p); ctx.restore();
      } else if (m === 'pour' && i === 2) {
        ctx.save(); ctx.setLineDash([1.6, 1.9]); ctx.lineDashOffset = -ph * 7; ctx.stroke(q.p); ctx.restore();
      } else if (m === 'glaze' && i === 0) {
        const k = (ph * 0.4) % 1, w = Math.min(1, k / 0.7);
        ctx.save(); ctx.beginPath(); ctx.rect(3, 6, 18 * w, 11); ctx.clip(); ctx.fillStyle = rgba(col, (0.42 * (k < 0.9 ? 1 : (1 - k) / 0.1)).toFixed(3));
        ctx.fill(q.p); ctx.restore(); ctx.stroke(q.p);
      } else ctx.stroke(q.p);
    });
    if (m === 'mergeDots') {
      ctx.fillStyle = lighten(col, 0.45);
      for (let i = 0; i < 4; i++) { const k = (ph * 0.5 + i / 4) % 1, p = merge(k, i % 2 === 0);
        ctx.globalAlpha = Math.min(1, k / 0.08, (1 - k) / 0.12); ctx.beginPath(); ctx.arc(p.x, p.y, 1.75, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (PM) (PM.fx || []).forEach(f => partFx(f));
    if (m === 'splitDots' || m === 'prioDots') {

      ctx.fillStyle = lighten(col, 0.45);
      for (let i = 0; i < 4; i++) { const k = (ph * 0.5 + i / 4) % 1, p = fork(k, m === 'prioDots' || i % 2 === 0);
        ctx.globalAlpha = Math.min(1, k / 0.08, (1 - k) / 0.12); ctx.beginPath(); ctx.arc(p.x, p.y, 1.75, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (m === 'sparks') {

      ctx.lineWidth = 1.1;

      for (let i = 0; i < 6; i++) { const k = (ph * 0.9 + i / 6) % 1, a = -0.25 - i * 0.14, v = 13 + (i % 2) * 3;
        const at = kk => ({ x: 20 + Math.cos(a) * v * kk, y: 9 + Math.sin(a) * v * kk + 14 * kk * kk });
        const p = at(k), q = at(Math.max(0, k - 0.08));
        ctx.globalAlpha = Math.min(1, (1 - k) * 1.4); ctx.strokeStyle = ctx.fillStyle = i % 2 ? '#fff6d0' : '#ffd36a';
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.beginPath(); ctx.arc(p.x, p.y, 1.8 - k * 0.7, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.lineWidth = 1.9 / (fit ? fit.f : 1);
    }
    if (m === 'brew') {
      for (let i = 0; i < 3; i++) { const k = (ph * 0.9 + i / 3) % 1;
        ctx.globalAlpha = 0.8 * (1 - k); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(8 + i * 4, 6.2 - k * 3, 0.7 + k * 0.6, 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.lineWidth = 1.9 / (fit ? fit.f : 1);
    }
    if (shovel && shovel.dirt) {
      shovel.dirt.forEach(d => { ctx.fillStyle = 'rgba(206,160,104,' + d.a.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill(); });
    }
    ctx.restore();
    ctx.restore();

    ctx.save();
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, isz, isz, 8) : ctx.rect(bx, by, isz, isz); ctx.clip();
    if (m === 'hover') {
      const w = 5 + Math.abs(Math.sin(ph * 30)) * 3, y = by + 5 + Math.sin(ph * 3) * 1.6;
      ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(cx - 7 - w / 2, y); ctx.lineTo(cx - 7 + w / 2, y); ctx.moveTo(cx + 7 - w / 2, y); ctx.lineTo(cx + 7 + w / 2, y); ctx.stroke();
    } else if (m === 'puff') {

      const at = PUFF_AT[t.icon], ox = at ? cx - size / 2 + s * (fit ? 12 + fit.f * (at[0] - fit.cx) : at[0]) : cx + 3,
        oy = at ? cy - size / 2 + s * (fit ? 12 + fit.f * (at[1] - fit.cy) : at[1]) : by + 12;
      for (let i = 0; i < 3; i++) { const k = ((ph * 0.6 + i / 3) % 1);
        ctx.fillStyle = 'rgba(200,200,205,' + (0.35 * (1 - k)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(ox + Math.sin(k * 5 + i) * 2, oy - k * (at ? oy - by - 1 : 11), 1.5 + k * 3, 0, TAU); ctx.fill(); }
    } else if (m === 'bubble') {
      for (let i = 0; i < 4; i++) { const k = ((ph * 0.7 + i / 4) % 1), hx = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
        ctx.strokeStyle = rgba(col, (0.7 * (1 - k * 0.6)).toFixed(3)); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(bx + 7 + (hx - Math.floor(hx)) * 14, by + isz - 3 - k * (isz - 6), 1 + k * 1.2, 0, TAU); ctx.stroke(); }
    } else if (m === 'signal') {
      for (let i = 0; i < 2; i++) { const k = ((ph * 0.7 + i / 2) % 1);
        ctx.strokeStyle = rgba(col, (0.6 * (1 - k)).toFixed(3)); ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.arc(cx, by + 7, 2 + k * 11, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
    } else if (m === 'sift') {
      for (let i = 0; i < 3; i++) { const k = ((ph * 1.1 + i / 3) % 1);
        ctx.fillStyle = i % 2 ? 'rgba(140,145,155,' + (1 - k).toFixed(3) + ')' : 'rgba(225,205,160,' + (1 - k).toFixed(3) + ')';
        ctx.fillRect(cx - 1 + (i - 1) * 3, by + isz - 8 + k * 7, 2, 2); }
    } else if (m === 'dig') {
      const k = (ph % 1.3) / 1.3;
      if (k > 0.25 && k < 0.7) { const f = (k - 0.25) / 0.45;
        for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(170,135,90,' + (1 - f).toFixed(3) + ')';
          ctx.fillRect(cx + (i - 1.5) * 3 * (1 + f), by + isz - 4 - f * 9 + Math.abs(i - 1.5) * f * 3, 2, 2); } }
    } else if (m === 'press') {
      const k = (ph % 1.2) / 1.2;
      if (k > 0.1 && k < 0.45) { const f = (k - 0.1) / 0.35;
        ctx.strokeStyle = rgba(col, (0.7 * (1 - f)).toFixed(3)); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, by + isz - 5, 4 + f * 10, 1.2 + f * 2.5, 0, 0, TAU); ctx.stroke(); }
    } else if (m === 'flow') {
      ctx.strokeStyle = rgba(col, 0.85); ctx.lineWidth = 1.3;
      for (let i = 0; i < 3; i++) { const k = ((ph * 0.7 + i / 3) % 1), x = bx + 2 + k * (isz - 4), y = by + isz - 5;
        ctx.globalAlpha = Math.sin(k * Math.PI);
        ctx.beginPath(); ctx.moveTo(x - 2, y - 2.5); ctx.lineTo(x + 1, y); ctx.lineTo(x - 2, y + 2.5); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  R.liveIconOn = function (c2, t, bx, by, isz, time) {
    const m = motionOf(t);
    if (!m) return false;
    const keep = ctx;
    ctx = c2;
    try { liveIcon(t, m, bx, by, isz, time, { id: '' }); } finally { ctx = keep; }
    return true;
  };

  function fitNameFont(text, budget) {
    const F = (C.ui && C.ui.nameFit) || {};
    const steps = (F.enabled !== false && F.steps && F.steps.length) ? F.steps : [13.5];
    for (let i = 0; i < steps.length; i++) {
      ctx.font = '600 ' + steps[i] + 'px ' + FONT_DISPLAY;
      if (ctx.measureText(text).width <= budget) return steps[i];
    }
    ctx.font = '600 ' + steps[0] + 'px ' + FONT_DISPLAY;
    return steps[0];
  }

  function clipText(s, max) {
    if (max <= 0) return '';
    if (ctx.measureText(s).width <= max) return s;
    let out = s;
    while (out.length > 1 && ctx.measureText(out + '…').width > max) out = out.slice(0, -1);
    return out.replace(/\s+$/, '') + '…';
  }

  function stateKinds(n, t) {
    const out = [];
    if (t.id === 'solarPanel') out.push('solar');
    if (t.recipe && t.recipe.boost && S.portsOf(n, 'in').some(p => p.id === 'fert'))
      out.push('fert');

    if (t.ciPerKg && t.buffer) out.push('filter');
    if (t.powerUp && GG.sim.powerShow(n)) out.push('power');
    if (t.ciPerKw && (n.ciDrain || 0) < 0) out.push('drain');
    return out;
  }

  function stateWidth(n, t, kind, pad) {
    pad = pad || 0;
    if (kind === 'solar')  return solarPill(n, pad).w;
    if (kind === 'fert')   return tagW('×' + GG.util.fmt(GG.sim.plantMul(n), 1)) + pad;
    if (kind === 'filter') return tagW(GG.util.fmt(n.buf.filter || 0, 2) + ' kg') + pad;
    if (kind === 'power')  return tagW(powerTag(n)) + pad;
    if (kind === 'drain')  return tagW(ciDrainTag(n)) + pad;
    return 0;
  }

  R.headPill = function (n, t) {
    const font = ctx.font;
    const dg = (C.diagnose.card && !GG.sim.muted(n)) ? GG.sim.diagnose(n) : null;
    const kinds = stateKinds(n, t);

    const onBand = !!(C.diagnose.cardBand && S.capRows(t, n) > 0);
    const canWord = !!(dg && C.diagnose.cardWord && !onBand);
    const F = C.diagnose.pillFlip || {};

    const cands = (canWord ? ['word'] : []).concat(kinds);
    const flip = !!(cands.length > 1 && F.enabled);
    const idx = flip ? ((n.pillAlt | 0) % cands.length + cands.length) % cands.length : 0;
    const pick = cands[idx] || null;
    const word = pick === 'word';

    const pad = flip ? (F.pad || 0) : 0;
    const out = { dg: dg, word: word, flip: flip, pad: pad,
                  onBand: onBand, kinds: kinds, cands: cands.length,
                  pick: word ? null : pick,
                  w: word ? tagW(GG.i18n.ins(dg.word)) + pad
                          : (pick ? stateWidth(n, t, pick, pad) : 0) };
    ctx.font = font;
    return out;
  };

  function ciDrainTag(n) {
    return GG.util.fmt(n.ciDrain || 0) + ' ' + C.currencies.ci.rate;
  }

  function powerTag(n) {
    const p = S.type(n).powerUp;

    if (p && p.solarShare) {
      return GG.i18n.ins('+' + GG.util.fmt(GG.sim.panelKw(n), 1) + ' ' +
                         C.resources.energy.rate);
    }
    return '×' + GG.util.fmt(GG.sim.powerMul(n), 2);
  }

  function drawPillFlip(n, hp, ui) {
    const r = R.pillFlipRect(n);
    if (!r) return;
    const hot = ui && ui.hoverFlip === n.id;
    const col = hp.word
      ? (hp.dg.level === 'stop' ? C.diagnose.stopColor : C.diagnose.slowColor)
      : '#9fb0d6';
    ctx.fillStyle = rgba(col, hot ? 0.26 : 0.13);
    roundRect(r.x, r.y, r.w, r.h, 5); ctx.fill();
    ctx.strokeStyle = rgba(col, hot ? 0.85 : 0.40); ctx.lineWidth = 1;
    roundRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 4.5); ctx.stroke();
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    ctx.strokeStyle = rgba(col, hot ? 1 : 0.72);
    ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 1.9, cy - 3.3);
    ctx.lineTo(cx + 1.9, cy);
    ctx.lineTo(cx - 1.9, cy + 3.3);
    ctx.stroke();
    ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  }

  function tagW(text) {
    ctx.font = '700 10px ' + FONT_MONO;
    return Math.max(30, ctx.measureText(text).width + 14);
  }

  function freshLook(k) { return !!((C.ui || {}).freshLooks || {})[k]; }
  function statusMark(cx, cy, r, col, stop) {
    ctx.save();
    if (stop) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#141008'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.5); ctx.lineTo(cx, cy + r * 0.1); ctx.stroke();
      ctx.fillStyle = '#141008'; ctx.beginPath(); ctx.arc(cx, cy + r * 0.48, 0.9, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.55); ctx.lineTo(cx, cy); ctx.lineTo(cx + r * 0.45, cy + r * 0.2); ctx.stroke();
    }
    ctx.restore();
  }
  function isStopCol(col) { return String(col).toLowerCase() === String(C.diagnose.stopColor).toLowerCase(); }
  function statusCaption(i) {
    const X = i.x + 13, base = i.cy + 8;
    ctx.save();
    ctx.font = '700 9.5px ' + FONT_UI;
    const tw = ctx.measureText(i.word).width;
    ctx.fillStyle = rgba(i.col, 0.12); roundRect(i.x + 6, i.cy - 2, i.w - 12, i.h - 2, 5); ctx.fill();
    statusMark(X + 5, base - 3.5, 5, i.col, isStopCol(i.col));
    ctx.fillStyle = i.col; ctx.textAlign = 'left'; ctx.fillText(i.word, X + 14, base);
    ctx.restore();
    return tw + 14;
  }
  function drawTag(x, y, size, text, color, frac, hp, hot, kind) {
    const pad = hp && hp.flip ? hp.pad : 0;
    const w = tagW(text) + pad, h = 16;
    const px = x + size.w - w - 12, py = y + 13;

    if (R.labTag && R.labTag(ctx, { px: px, py: py, w: w, h: h, pad: pad, text: text, color: color, frac: frac, hot: hot, kind: kind || 'chip' })) {
      if (pad) drawChevron(px + w - pad / 2, py + h / 2, color, hot);
      return;
    }
    if (kind === 'warn' ? freshLook('statusMark') : freshLook('chipRing')) {
      const cy = py + h / 2, tx = px + (w - pad) / 2;
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (kind === 'warn') {
        ctx.fillStyle = rgba(color, hot ? 0.28 : 0.18); roundRect(px, py, w, h, 8); ctx.fill();
        ctx.strokeStyle = rgba(color, hot ? 0.9 : 0.5); ctx.lineWidth = 1; roundRect(px + 0.5, py + 0.5, w - 1, h - 1, 7.5); ctx.stroke();
        ctx.font = '700 8.5px ' + FONT_UI;
        statusMark(px + 8, cy, 4.5, color, isStopCol(color));
        ctx.fillStyle = color; ctx.fillText(text, tx + 5, cy + 0.5);
      } else {
        const f = GG.util.clamp(frac || 0, 0, 1);
        ctx.fillStyle = 'rgba(14,20,26,0.85)'; roundRect(px, py, w, h, 8); ctx.fill();
        ctx.strokeStyle = rgba(color, hot ? 0.9 : 0.4); ctx.lineWidth = 1; roundRect(px + 0.5, py + 0.5, w - 1, h - 1, 7.5); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = rgba(color, 0.25); ctx.beginPath(); ctx.arc(px + 8, cy, 4, 0, Math.PI * 2); ctx.stroke();
        if (f > 0) { ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(px + 8, cy, 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); ctx.stroke(); }
        ctx.font = '600 9.5px ' + FONT_MONO; ctx.fillStyle = color; ctx.fillText(text, tx + 5, cy + 0.5);
      }
      ctx.restore();
      if (pad) drawChevron(px + w - pad / 2, py + h / 2, color, hot);
      return;
    }
    ctx.fillStyle = rgba(color, hot ? 0.28 : 0.18);
    roundRect(px, py, w, h, 8); ctx.fill();
    if (frac > 0) {
      ctx.save();
      roundRect(px, py, w, h, 8); ctx.clip();
      ctx.fillStyle = rgba(color, 0.30);
      ctx.fillRect(px, py, w * GG.util.clamp(frac, 0, 1), h);
      ctx.restore();
    }
    ctx.strokeStyle = rgba(color, hot ? 0.9 : 0.5); ctx.lineWidth = 1;
    roundRect(px + 0.5, py + 0.5, w - 1, h - 1, 7.5); ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, px + (w - pad) / 2, py + h / 2 + 0.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (pad) drawChevron(px + w - pad / 2, py + h / 2, color, hot);
  }

  function drawChevron(cx, cy, color, hot) {
    ctx.strokeStyle = rgba(color, hot ? 1 : 0.7);
    ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 1.7, cy - 3.1);
    ctx.lineTo(cx + 1.7, cy);
    ctx.lineTo(cx - 1.7, cy + 3.1);
    ctx.stroke();
    ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  }

  function solarPill(n, pad) {
    const ph = GG.sim.solarPhase(n);

    const txt = GG.i18n.ins((ph.on ? 'DAY ' : 'NIGHT ') + Math.ceil(ph.remaining) + 's');
    ctx.font = '700 9px ' + FONT_UI;

    const right = (pad || 0) ? 0 : 9;
    return { ph: ph, txt: txt,
             w: Math.max(58, 19 + ctx.measureText(txt).width + right) + (pad || 0) };
  }

  function drawSolarPhase(n, x, y, size, hp, hot) {
    const pad = hp && hp.flip ? hp.pad : 0;
    const pill = solarPill(n, pad), ph = pill.ph, txt = pill.txt;
    const w = pill.w, h = 16, px = x + size.w - w - 12, py = y + 13;
    ctx.fillStyle = ph.on ? 'rgba(240,192,74,0.18)' : 'rgba(90,110,150,0.20)';
    roundRect(px, py, w, h, 8); ctx.fill();
    ctx.strokeStyle = ph.on ? 'rgba(240,192,74,' + (hot ? 0.9 : 0.5) + ')'
                            : 'rgba(120,140,180,' + (hot ? 0.85 : 0.4) + ')';
    ctx.lineWidth = 1; roundRect(px + 0.5, py + 0.5, w - 1, h - 1, 7.5); ctx.stroke();

    ctx.save(); roundRect(px, py, w, h, 8); ctx.clip();
    ctx.fillStyle = ph.on ? 'rgba(240,192,74,0.22)' : 'rgba(120,140,180,0.18)';
    ctx.fillRect(px, py, w * GG.util.clamp(ph.frac, 0, 1), h);
    ctx.restore();
    IC.drawIcon(ctx, ph.on ? 'solar' : 'battery', px + 10, py + h / 2, 11,
      ph.on ? '#f0c04a' : '#9fb0d6', 1.8);
    ctx.font = '700 9px ' + FONT_UI;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = ph.on ? '#f0c04a' : '#9fb0d6';
    ctx.fillText(txt, px + 19, py + h / 2 + 0.5);
    ctx.textBaseline = 'alphabetic';
    if (pad) drawChevron(px + w - pad / 2, py + h / 2,
                         ph.on ? '#f0c04a' : '#9fb0d6', hot);
  }

  function drawBeaconRange(ui) {
    if (!GG.sim.beaconLocal || !GG.sim.beaconLocal()) return;
    const list = [];
    S.machinesHere().forEach(function (n) {
      const t = C.nodeTypes[n.type];
      if (t.pullCost && GG.ui.isSelected(n.id)) list.push({ x: n.x, y: n.y, t: t });
    });
    const gh = ui.ghost;
    if (gh && !gh.bp && !gh.mv && gh.type && C.nodeTypes[gh.type].pullCost)
      list.push({ x: gh.x, y: gh.y, t: C.nodeTypes[gh.type] });
    list.forEach(function (o) {
      const r = GG.sim.beaconRange(o.t);
      if (!(r > 0)) return;
      ctx.save();
      ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(o.t.color, 0.05); ctx.fill();
      ctx.strokeStyle = rgba(o.t.color, 0.6); ctx.lineWidth = 2;
      ctx.setLineDash([16, 12]); ctx.stroke();
      ctx.restore();
    });
  }

  function drawGhost(ui) {
    if (ui.ghost.bp) { drawBlueprintGhost(ui); return; }
    if (ui.ghost.mv) { drawMoveGhost(ui); return; }
    const t = C.nodeTypes[ui.ghost.type];
    const ok = ui.ghost.ok;
    const size = S.sizeOf(ui.ghost.type);
    const x = ui.ghost.x - size.w / 2, y = ui.ghost.y - size.h / 2;
    ctx.fillStyle = ok ? rgba(t.color, 0.14) : 'rgba(220,110,110,0.14)';
    roundRect(x, y, size.w, size.h, 12); ctx.fill();
    ctx.strokeStyle = ok ? t.color : '#e08a8a';
    ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
    roundRect(x, y, size.w, size.h, 12); ctx.stroke();
    ctx.setLineDash([]);
    IC.drawIcon(ctx, t.icon, ui.ghost.x, ui.ghost.y - 12, 26, ok ? C.iconColor(t) : '#e08a8a', 1.9);
    ctx.fillStyle = ok ? '#dff3e7' : '#f0c0c0';
    ctx.font = '600 12px ' + FONT_UI;
    ctx.textAlign = 'center';

    ctx.fillText(ok ? t.name : GG.i18n.msg(ui.ghost.why || 'Blocked'),
                 ui.ghost.x, ui.ghost.y + 20);
    ctx.textAlign = 'left';
  }

  function drawPackGhost(items, links, gx, gy, ok, label, wire) {
    const bad = '#e08a8a';

    ctx.strokeStyle = ok ? wire : 'rgba(224,138,138,0.4)';
    ctx.lineWidth = 2;
    links.forEach(function (l) {
      const a = items[l.a], b = items[l.b];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(gx + a.dx, gy + a.dy);
      ctx.lineTo(gx + b.dx, gy + b.dy);
      ctx.stroke();
    });

    ctx.setLineDash([8, 6]);
    let foot = -Infinity;
    items.forEach(function (it) {
      const t = C.nodeTypes[it.type];
      const size = S.sizeOf(it.type);
      const x = gx + it.dx - size.w / 2, y = gy + it.dy - size.h / 2;
      foot = Math.max(foot, it.dy + size.h / 2);
      ctx.fillStyle = ok ? rgba(t.color, 0.14) : 'rgba(220,110,110,0.14)';
      roundRect(x, y, size.w, size.h, 12); ctx.fill();
      ctx.strokeStyle = ok ? t.color : bad;
      ctx.lineWidth = 2;
      roundRect(x, y, size.w, size.h, 12); ctx.stroke();
      IC.drawIcon(ctx, t.icon, gx + it.dx, gy + it.dy, 26, ok ? C.iconColor(t) : bad, 1.9);
    });
    ctx.setLineDash([]);

    ctx.fillStyle = ok ? '#dff3e7' : '#f0c0c0';
    ctx.font = '600 13px ' + FONT_UI;
    ctx.textAlign = 'center';
    ctx.fillText(label, gx, gy + (foot > -Infinity ? foot : 0) + 20);
    ctx.textAlign = 'left';
  }

  function drawBlueprintGhost(ui) {
    const bp = ui.ghost.bp, ok = ui.ghost.ok;
    drawPackGhost(bp.nodes, bp.links, ui.ghost.x, ui.ghost.y, ok,
      ok ? bp.name : GG.i18n.msg(ui.ghost.why || 'Blocked'), 'rgba(232,176,75,0.45)');
  }

  function drawMoveGhost(ui) {
    const pack = ui.ghost.mv, ok = ui.ghost.ok;

    let items = S.moveItems(pack);
    const plan = S.onSitePlan ? S.onSitePlan(pack, ui.ghost.x, ui.ghost.y) : null;
    if (plan && plan.length) {
      items = items.concat(plan.map(function (it) {
        return { id: it.id, type: it.type, dx: it.x - ui.ghost.x, dy: it.y - ui.ghost.y };
      }));
    }
    const idx = {};
    items.forEach(function (it, i) { idx[it.id] = i; });

    const links = S.g.links
      .filter(l => idx[l.from] !== undefined && idx[l.to] !== undefined)
      .map(l => ({ a: idx[l.from], b: idx[l.to] }));
    const label = ok
      ? (items.length === 1 ? GG.i18n.t('ui.movingOne')
                            : GG.i18n.t('ui.movingN').replace('%', items.length))
      : GG.i18n.msg(ui.ghost.why || 'Blocked');
    drawPackGhost(items, links, ui.ghost.x, ui.ghost.y, ok, label, 'rgba(98,212,227,0.5)');
  }

  function rgba(hex, a) {
    const v = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')';
  }

  let healCur = null, healPin = null;

  function healTarget() {
    const H2 = C.heal;
    if (!H2 || !H2.enabled) return 1;
    const total = (S.g && S.g.totalCI) || 0;
    const k = Math.max(0, Math.min(1, total / (H2.full || 25000)));
    return Math.pow(k, H2.gamma || 1);
  }

  R.healK = function () {
    if (healPin !== null) return healPin;
    if (!C.heal || !C.heal.enabled) return 1;
    return healCur === null ? healTarget() : healCur;
  };

  R.healPreview = function (k) {
    healPin = (k === null || k === undefined) ? null : Math.max(0, Math.min(1, k));
    return R.healK();
  };

  function stepHeal(dt) {
    const want = healTarget();
    if (healCur === null) { healCur = want; return; }
    const ease = (C.heal && C.heal.ease) || 1.5;
    healCur += (want - healCur) * Math.min(1, dt / ease);
  }

  R.reviveOn = function () { return GG.sim.reviveOn(); };

  let revCur = null, revLoc = null, revPin = null;

  function reviveTarget() {
    const st = GG.sim.reviveStages();
    const stage = revPin !== null ? revPin : GG.sim.reviveStage(S.g.loc);

    return st > 0 ? Math.max(0, Math.min(1, stage / st)) : 1;
  }

  R.reviveK = function () {
    if (!R.reviveOn()) return 0;
    return revCur === null ? reviveTarget() : revCur;
  };

  R.revivePreview = function (stage) {
    revPin = (stage === null || stage === undefined) ? null
      : Math.max(0, Math.min(GG.sim.reviveStages(), Math.round(stage)));
    return R.reviveK();
  };

  function strongOn() { return !!(C.revive && C.revive.stronger && C.revive.stronger.enabled); }
  function gridBlend(k) {
    const G = C.revive.stronger.grid, a = G.dirty, b = G.clean;
    const m = function (i) { return a[i] + (b[i] - a[i]) * k; };
    return 'rgba(' + Math.round(m(0)) + ',' + Math.round(m(1)) + ',' + Math.round(m(2)) + ',' +
           m(3).toFixed(3) + ')';
  }

  function stepRevive(dt) {
    if (!R.reviveOn()) { revCur = null; revLoc = null; return; }
    const want = reviveTarget();

    if (revCur === null || revLoc !== S.g.loc) { revCur = want; revLoc = S.g.loc; return; }
    revCur += (want - revCur) * Math.min(1, dt / (C.revive.ease || 1.2));
  }

  function drawGroundCover() {
    if (!R.reviveOn()) return;
    const strong = strongOn();
    const P = strong ? Object.assign({}, C.revive.patch, C.revive.stronger.patch) : C.revive.patch;
    if (!P || !P.max) return;
    const k = R.reviveK();
    if (k <= 0.001) return;
    const slice = 1 / P.max;
    const seed = hashStr(S.g.loc || '');

    const cb = strong && P.spread ? R.contentBox() : null;
    ctx.save();
    for (let i = 0; i < P.max; i++) {

      const a = Math.max(0, Math.min(1, (k - i * slice) / slice));
      if (a <= 0.01) continue;
      const h1 = ((seed + i * 2654435761) >>> 0) / 4294967296;
      const h2 = ((seed + i * 1597334677 + 977) >>> 0) / 4294967296;
      const h3 = ((seed + i * 40503 + 7919) >>> 0) / 4294967296;

      const pd = cb ? (P.pad || 0) : 0;
      const x = cb ? cb.minX - pd + h1 * (cb.w + 2 * pd) : (h1 - 0.5) * 2200;
      const y = cb ? cb.minY - pd + h2 * (cb.h + 2 * pd) : (h2 - 0.5) * 1500;
      const r = P.r * (0.7 + h3 * 0.7);
      const g2 = ctx.createRadialGradient(x, y, 0, x, y, r);
      g2.addColorStop(0, rgba(P.color, P.alpha * a));
      g2.addColorStop(1, rgba(P.color, 0));
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }

  function h01(seed, ix, iy, salt) {
    let h = (seed ^ Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(salt, 1274126177)) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function lifeField(seed, x, y, cell) {
    const gx = x / cell, gy = y / cell, ix = Math.floor(gx), iy = Math.floor(gy);
    const fx = gx - ix, fy = gy - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = h01(seed, ix, iy, 91), b = h01(seed, ix + 1, iy, 91);
    const c = h01(seed, ix, iy + 1, 91), d = h01(seed, ix + 1, iy + 1, 91);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }

  function lifeCfg() {
    const L = C.revive && C.revive.life;
    return (L && L.enabled && R.reviveOn()) ? L : null;
  }

  function lifeMeadow(L, d) {
    const t = Math.max(0, Math.min(1, (d - L.bare) / Math.max(0.05, L.full - L.bare)));
    return t * t * (3 - 2 * t);
  }

  function lifeTh(start, u) { return start + u * (1 - start) * 0.9; }

  const LIFE_CH = 8;
  const lifeChunks = new Map();
  let lifeSig = '';
  function lifeChunk(L, seed, big, cx, cy) {
    const key = seed + (big ? ':b:' : ':s:') + cx + ':' + cy;
    let list = lifeChunks.get(key);
    if (list) return list;
    list = [];
    const cs = big ? L.bigCell : L.cell, ST = L.starts;
    for (let ix = cx * LIFE_CH; ix < cx * LIFE_CH + LIFE_CH; ix++) {
      for (let iy = cy * LIFE_CH; iy < cy * LIFE_CH + LIFE_CH; iy++) {
        if (!big) {
          const dens = lifeMeadow(L, lifeField(seed, ix * cs, iy * cs, L.patchCell));
          if (h01(seed, ix, iy, 1) > L.small * (L.floor + (1 - L.floor) * dens)) continue;
          const p = { x: (ix + h01(seed, ix, iy, 2)) * cs, y: (iy + h01(seed, ix, iy, 3)) * cs,
                      u: h01(seed, ix, iy, 5), v: h01(seed, ix, iy, 6) };
          const kind = h01(seed, ix, iy, 4);
          if (kind < 0.62) {
            p.t = 0; p.th = lifeTh(ST.grass, p.u); p.bl = [];
            const blades = 3 + Math.floor(p.v * 3);
            for (let b = 0; b < blades; b++) p.bl.push(0.7 + 0.3 * h01(seed, ix, iy, 10 + b));
          } else if (kind < 0.82) {
            p.t = 1; p.th = lifeTh(ST.sprout, p.u);
          } else {
            p.t = 2; p.th = lifeTh(ST.flower, p.u);
            p.hi = Math.floor(h01(seed, ix, iy, 7) * L.colors.flowers.length) % L.colors.flowers.length;
          }
          list.push(p);
        } else {
          const x = (ix + h01(seed, ix, iy, 22)) * cs, y = (iy + h01(seed, ix, iy, 23)) * cs;
          const dens = lifeMeadow(L, lifeField(seed, x, y, L.patchCell));
          if (h01(seed, ix, iy, 21) > L.big * (L.floor * 0.5 + (1 - L.floor * 0.5) * dens)) continue;
          const p = { x: x, y: y, u: h01(seed, ix, iy, 25), v: h01(seed, ix, iy, 26) };
          if (h01(seed, ix, iy, 24) < L.bushShare) {
            p.t = 3; p.th = lifeTh(ST.shrub, p.u); p.rr = [];
            const n = 3 + Math.floor(p.v * 3);
            for (let b = 0; b < n; b++) p.rr.push(0.8 + 0.4 * h01(seed, ix, iy, 30 + b));
          } else {
            p.t = h01(seed, ix, iy, 27) < 0.55 ? 4 : 5;
            p.th = lifeTh(ST.tree, p.u);
          }
          list.push(p);
        }
      }
    }
    if (lifeChunks.size > 800) lifeChunks.clear();
    lifeChunks.set(key, list);
    return list;
  }

  function drawLife(time) {
    const L = lifeCfg();
    if (!L) return;
    const k = R.reviveK();
    if (k <= L.starts.grass) return;
    const sc = S.g.camera.scale, F = L.farFade;

    const far = F ? Math.max(0, Math.min(1, (sc - F[0]) / (F[1] - F[0]))) : 1;
    if (far <= 0) return;
    const sig = [L.cell, L.bigCell, L.patchCell, L.small, L.big, L.bare, L.full, L.floor,
                 L.bushShare, L.colors.flowers.length, JSON.stringify(L.starts)].join('|');
    if (sig !== lifeSig) { lifeChunks.clear(); lifeSig = sig; }
    const seed = hashStr('life:' + (S.g.loc || ''));
    const vr = viewRect(40);
    const growOf = function (th) { return Math.max(0, Math.min(1, (k - th) / L.grow)); };
    const swayAt = function (x, y) { return L.sway * Math.sin(time * 1.3 + x * 0.013 + y * 0.007); };
    const P = { grass: new Path2D(), dark: new Path2D(), sprout: new Path2D(),
                shrub: new Path2D(), trunk: new Path2D(), crown: new Path2D(), stem: new Path2D() };
    const heads = L.colors.flowers.map(function () { return new Path2D(); });

    const keepOut = S.sitesHere().map(function (s) {
      const b = S.siteBox(s), p = L.siteGap;
      return { x0: s.x - b.w / 2 - p, x1: s.x + b.w / 2 + p, y0: s.y - b.h / 2 - p, y1: s.y + b.h / 2 + p * 3 };
    });
    const blocked = function (x, y) {
      for (let i = 0; i < keepOut.length; i++) {
        const r = keepOut[i];
        if (x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) return true;
      }
      return false;
    };

    const eachChunk = function (big, fn) {
      const span = (big ? L.bigCell : L.cell) * LIFE_CH, pad = big ? 100 : 20;
      for (let cx = Math.floor((vr.x0 - pad) / span); cx <= Math.floor((vr.x1 + pad) / span); cx++) {
        for (let cy = Math.floor((vr.y0 - pad) / span); cy <= Math.floor((vr.y1 + pad) / span); cy++) {
          const list = lifeChunk(L, seed, big, cx, cy);
          for (let i = 0; i < list.length; i++) {
            const p = list[i];
            if (p.x < vr.x0 - pad || p.x > vr.x1 + pad || p.y < vr.y0 || p.y > vr.y1 + pad) continue;
            if (k <= p.th || blocked(p.x, p.y)) continue;
            fn(p, growOf(p.th));
          }
        }
      }
    };

    if (sc >= L.smallFrom) eachChunk(false, function (p, g) {
      const x = p.x, y = p.y, u = p.u, v = p.v;
      if (p.t === 0) {
        const path = v < 0.5 ? P.grass : P.dark;
        const n = p.bl.length, hgt = (9 + 9 * u) * g, lean0 = swayAt(x, y) * hgt * 0.14;
        for (let b = 0; b < n; b++) {
          const off = (b - (n - 1) / 2) * 2.4, lean = off * 0.9 + lean0, bh = hgt * p.bl[b];
          path.moveTo(x + off, y);
          path.quadraticCurveTo(x + off + lean * 0.3, y - bh * 0.6, x + off + lean, y - bh);
        }
      } else if (p.t === 1) {
        const hgt = (6 + 5 * v) * g, top = y - hgt, sw = swayAt(x, y) * 1.2 * g;
        P.sprout.moveTo(x, y); P.sprout.quadraticCurveTo(x, y - hgt * 0.6, x + sw, top);

        const lf = 5 * g, bx = x + sw, by = top + 1;
        for (let s = -1; s <= 1; s += 2) {
          P.sprout.moveTo(bx, by);
          P.sprout.quadraticCurveTo(bx + s * lf * 0.2, by - lf * 0.9, bx + s * lf * 1.3, by - lf * 0.7);
          P.sprout.quadraticCurveTo(bx + s * lf * 0.9, by + lf * 0.1, bx, by);
        }
      } else {
        const hgt = (7 + 5 * v) * g, sw = swayAt(x, y) * 1.5 * g;
        P.stem.moveTo(x, y); P.stem.quadraticCurveTo(x + sw * 0.4, y - hgt * 0.6, x + sw, y - hgt);
        const hp = heads[p.hi];

        const r = 1.5 * g, cx = x + sw, cy = y - hgt - r;
        for (let q = 0; q < 5; q++) {
          const a = q * 1.2566 + u * 6.28, px = cx + Math.cos(a) * r * 1.3, py = cy + Math.sin(a) * r * 1.3;
          hp.moveTo(px + r, py); hp.arc(px, py, r, 0, 6.2832);
        }
      }
    });

    eachChunk(true, function (p, g) {
      const x = p.x, y = p.y, u = p.u, v = p.v;
      if (p.t === 3) {
        const n = p.rr.length, r = (7 + 4 * u) * g;
        for (let b = 0; b < n; b++) {
          const cx = x + (b - (n - 1) / 2) * r * 1.05, rr = r * p.rr[b];
          P.shrub.moveTo(cx + rr, y); P.shrub.arc(cx, y, rr, 0, Math.PI, true);
        }
        P.shrub.moveTo(x - r * n * 0.6, y); P.shrub.lineTo(x + r * n * 0.6, y);
        return;
      }

      const hgt = (L.treeH[0] + (L.treeH[1] - L.treeH[0]) * v) * g, sw = swayAt(x, y) * 2 * g, top = y - hgt;
      P.trunk.moveTo(x, y); P.trunk.lineTo(x + sw * 0.3, top + hgt * 0.35);
      if (p.t === 4) {

        const r = hgt * 0.34, cx = x + sw, cy = top + r * 0.95, ph = u * 6.28;
        const bumps = 5 + Math.floor(v * 3);
        for (let s = 0; s <= 28; s++) {
          const a = s / 28 * 6.2832, sa = Math.sin(a);
          const rr = r * (1 + 0.13 * Math.sin(a * bumps + ph));
          const px = cx + Math.cos(a) * rr, py = cy + sa * rr * (sa > 0 ? 0.78 : 1);
          if (s === 0) P.crown.moveTo(px, py); else P.crown.lineTo(px, py);
        }
        P.crown.closePath();

        const fy = top + hgt * 0.5;
        P.trunk.moveTo(x + sw * 0.3, fy); P.trunk.lineTo(cx - r * 0.35, cy);
        P.trunk.moveTo(x + sw * 0.3, fy + hgt * 0.06); P.trunk.lineTo(cx + r * 0.3, cy - r * 0.1);
      } else {
        const w = hgt * 0.3;
        for (let t2 = 0; t2 < 3; t2++) {
          const ty = top + t2 * hgt * 0.2, tw = w * (0.55 + t2 * 0.25);
          P.crown.moveTo(x + sw - tw, ty + hgt * 0.24);
          P.crown.lineTo(x + sw, ty);
          P.crown.lineTo(x + sw + tw, ty + hgt * 0.24);
        }
      }
    });

    const Cc = L.colors;
    ctx.save();
    ctx.globalAlpha = L.alpha * far;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = L.line;
    if (L.fill) { ctx.fillStyle = rgba(Cc.crown, L.fill); ctx.fill(P.crown); ctx.fillStyle = rgba(Cc.shrub, L.fill); ctx.fill(P.shrub); }
    [['dark', Cc.grassDark], ['grass', Cc.grass], ['sprout', Cc.sprout], ['stem', Cc.sprout],
     ['shrub', Cc.shrub], ['trunk', Cc.trunk], ['crown', Cc.crown]].forEach(function (e) {
      ctx.strokeStyle = e[1]; ctx.stroke(P[e[0]]);
    });
    heads.forEach(function (hp, i) { ctx.fillStyle = Cc.flowers[i]; ctx.fill(hp); });
    ctx.restore();
  }

  const flies = [];
  let fliesLoc = null, fliesWait = 0, fliesClock = 0;
  function bfCfg() { return (C.revive && C.revive.butterflies) || {}; }
  function bfRnd(a, b) { return a + Math.random() * (b - a); }
  function bfStage() {
    if (!GG.sim.reviveOn()) return 0;
    return revPin !== null ? revPin : GG.sim.reviveStage(S.g.loc);
  }
  function bfFinished(s) {
    const t = S.type(s);
    if (s.type === 'meteorite') return false;
    return t.grow ? GG.sim.growFrac(s) >= 0.999 : (s.reserve || 0) <= GG.util.EPS;
  }
  function bfWorking(n) {
    try { return liveWorking(n, R.headPill(n, S.type(n))); } catch (e) { return false; }
  }

  function bfNeedsHelp(n) {
    if (GG.sim.muted && GG.sim.muted(n)) return false;
    try { const d = GG.sim.diagnose(n); return !!(d && d.level === 'stop' && !d.wait); } catch (e) { return false; }
  }
  function bfMachineOk(n) {
    const m = bfCfg().onMachines;
    if (m === false) return false;
    return m === 'working' ? bfWorking(n) : bfNeedsHelp(n);
  }
  function bfWant() {
    const B = bfCfg();
    if (S.g.practice) return 0;
    if (GG.halloween && GG.halloween.replacesButterflies()) return 0;
    if (nightK > (B.nightK === undefined ? 0.35 : B.nightK)) return 0;
    const w = GG.sim.weather();
    if (w && (B.hideWeather || []).indexOf(w.id) >= 0) return 0;
    const st = bfStage();
    if (st < (B.fromStage || 4)) return 0;
    const c = B.count || {};
    return c[st] !== undefined ? c[st] : (c[5] || 0);
  }

  const idle = { at: performance.now(), cx: null, cy: null };
  function ivCfg() { return (C.revive && C.revive.idleVisitor) || {}; }
  ['mousemove', 'mousedown', 'wheel', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (ev === 'mousemove' && e.clientX === idle.cx && e.clientY === idle.cy) return;
      idle.at = performance.now();
      if (e.clientX !== undefined) { idle.cx = e.clientX; idle.cy = e.clientY; }
    }, { passive: true, capture: true });
  });

  R.idlePoint = function () {
    const V = ivCfg();
    if (!V.enabled || idle.cx === null || document.hidden || !cv || !S.g || S.g.practice) return null;
    if (GG.menu && GG.menu.isOpen && GG.menu.isOpen()) return null;
    if ((performance.now() - idle.at) / 1000 < (V.idleSec || 60)) return null;
    if (document.elementFromPoint(idle.cx, idle.cy) !== cv) return null;
    const r = cv.getBoundingClientRect(), z = R.uiZoom();
    return R.toWorld((idle.cx - r.left) / z, (idle.cy - r.top) / z);
  };
  R.idleReset = function () { idle.at = performance.now(); };

  const cur = { css: null, img: null, ok: false, hx: 0, hy: 0, bx: 0, by: 0, hid: false };
  function curLoad(css) {
    cur.css = css; cur.ok = false;
    const m = /url\("(.+?)"\)\s*([\d.]+)?\s*([\d.]+)?/.exec(css || '');
    if (!m) return;
    const img = new Image();
    img.onload = function () {
      if (cur.css !== css) return;
      const w = img.naturalWidth || 32, h = img.naturalHeight || 32, oc = document.createElement('canvas');
      oc.width = w; oc.height = h;
      const o = oc.getContext('2d'); o.drawImage(img, 0, 0, w, h);
      const d = o.getImageData(0, 0, w, h).data;
      let by = -1, xs = 0, n = 0;
      for (let y = h - 1; y >= 0 && by < 0; y--) {
        for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 200) { xs += x; n++; }
        if (n) by = y;
      }
      Object.assign(cur, { img: img, ok: true, w: w, h: h, hx: +m[2] || 0, hy: +m[3] || 0, bx: n ? xs / n : 0, by: by < 0 ? 0 : by + 1 });
    };
    img.src = m[1];
  }
  function curHide(on) {
    if (cur.hid === on) return;
    cur.hid = on; document.body.classList.toggle('iv-hide', on);
  }
  ['mousemove', 'mousedown', 'wheel', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (cur.hid && R.idlePoint() === null) curHide(false); }, { passive: true });
  });

  function curStep(at) {
    const visiting = !!at && (flies.some(function (f) { return f.visitor; }) ||
                              !!(GG.halloween && GG.halloween.visitor && GG.halloween.visitor()));
    if (!visiting) { curHide(false); return; }
    if (!cur.hid) {
      const css = getComputedStyle(cv).cursor;
      if (css !== cur.css) curLoad(css);
      if (cur.ok && cur.css === css) curHide(true);
    }
  }

  function curBox(p) {
    const k = 1 / ((S.g.camera.scale || 1) * R.uiZoom());
    return { x: p.x - cur.hx * k, y: p.y - cur.hy * k, w: cur.w * k, h: cur.h * k,
             bottom: { x: p.x + (cur.bx - cur.hx) * k, y: p.y + (cur.by - cur.hy) * k } };
  }

  R.cursorBottom = function () {
    const p = R.idlePoint();
    if (!p) return null;
    return cur.ok ? curBox(p).bottom : p;
  };
  function drawCursor() {
    const p = cur.hid && R.idlePoint();
    if (!p || !cur.ok) return;
    const b = curBox(p);
    ctx.drawImage(cur.img, b.x, b.y, b.w, b.h);
  }

  function ivSpot(p, look) {
    const k = 1 / (S.g.camera.scale || 1);
    if (look === 'beside') return { x: p.x + 15 * k, y: p.y + 13 * k };
    if (look === 'circle') { const a = fliesClock * 2.2; return { x: p.x + Math.cos(a) * 26 * k, y: p.y + Math.sin(a) * 16 * k - 6 * k }; }
    return { x: p.x, y: p.y - 2 * k };
  }
  function bfPerchPos(p) {
    if (p.kind === 'pointer') { const q = R.idlePoint(); if (q) p.last = ivSpot(q, ivCfg().look); return p.last || null; }
    const n = S.node(p.id);
    if (!n || n.loc !== S.g.loc) return null;
    return { x: n.x + p.ox, y: n.y + p.oy };
  }
  function bfPerchAlive(p) {
    if (p.kind === 'pointer') return !!R.idlePoint();
    const n = S.node(p.id);
    if (!n || n.loc !== S.g.loc) return false;
    if (p.kind === 'site') return bfFinished(n);
    return !GG.ui.isSelected(n.id) && bfMachineOk(n);
  }
  function bfPerches() {
    const B = bfCfg(), out = [];
    if (B.onMachines !== false) S.machinesHere().forEach(function (n) {
      if (GG.ui.isSelected(n.id) || !bfMachineOk(n)) return;
      const z = S.sizeOf(n);
      out.push({ kind: 'node', id: n.id, ox: bfRnd(-0.36, 0.36) * z.w, oy: -z.h / 2 + bfRnd(0, 4) });
    });

    if (B.onGrounds !== false) S.sitesHere().filter(bfFinished).forEach(function (s) {
      const b = S.siteBox(s), inset = 3;
      for (let k = 0; k < 3; k++) {
        let ox, oy;
        const side = Math.floor(Math.random() * 3);
        if (side === 0) { ox = bfRnd(-0.46, 0.46) * b.w; oy = b.h / 2 - inset; }
        else { oy = bfRnd(-0.3, 0.46) * b.h; ox = (side === 1 ? 1 : -1) * (b.w / 2 - inset); }
        out.push({ kind: 'site', id: s.id, ox: ox, oy: oy });
      }
    });
    return out;
  }
  function bfPick(f, away) {
    const list = bfPerches().filter(function (p) {
      const q = bfPerchPos(p); if (!q) return false;
      if (f.perch && p.id === f.perch.id && (away || Math.random() < 0.7)) return false;
      if (away && Math.hypot(q.x - away.x, q.y - away.y) < away.r) return false;
      return !flies.some(function (o) {
        if (o === f || !o.perch) return false;
        const r = bfPerchPos(o.perch);
        return r && Math.hypot(r.x - q.x, r.y - q.y) < 90;
      });
    });

    const mach = list.filter(function (p) { return p.kind === 'node'; });
    if (mach.length && Math.random() < (bfCfg().machineFirst || 0)) return mach[Math.floor(Math.random() * mach.length)];
    return list.length ? list[Math.floor(Math.random() * list.length)] : null;
  }
  function bfEdge() {
    const v = viewRect(60 / Math.max(0.05, S.g.camera.scale)), s = Math.floor(Math.random() * 4);
    if (s === 0) return { x: v.x0, y: bfRnd(v.y0, v.y1) };
    if (s === 1) return { x: v.x1, y: bfRnd(v.y0, v.y1) };
    if (s === 2) return { x: bfRnd(v.x0, v.x1), y: v.y0 };
    return { x: bfRnd(v.x0, v.x1), y: v.y1 };
  }

  function bfFlyTo(f, perch, dest, fast) {
    f.p0 = { x: f.x, y: f.y };
    f.perch = perch; f.dest = dest || null;
    const to = perch ? bfPerchPos(perch) : dest, d = Math.hypot(to.x - f.x, to.y - f.y);
    const nx = -(to.y - f.y) / (d || 1), ny = (to.x - f.x) / (d || 1), bend = bfRnd(-0.45, 0.45) * d;
    f.c = { x: (f.x + to.x) / 2 + nx * bend, y: (f.y + to.y) / 2 + ny * bend - d * 0.15 };
    f.t = 0; f.dur = Math.max(fast ? 0.8 : 1.2, d / ((bfCfg().speed || 70) * (fast ? 1.6 : 1)));
    f.mode = dest ? 'leave' : 'fly'; f.fast = !!fast;
  }
  function bfLeave(f, fast) { if (f.mode !== 'leave') bfFlyTo(f, null, bfEdge(), fast); }
  function bfHop(f, away) {
    const p = bfPick(f, away);
    if (p) bfFlyTo(f, p, null, !!away); else bfLeave(f, !!away);
  }
  function bfSpawn() {
    const B = bfCfg(), cols = B.colors || ['#f4d35e'], e = bfEdge();
    const f = { x: e.x, y: e.y, col: cols[Math.floor(Math.random() * cols.length)], flap: bfRnd(0, 6),
                ang: 0, sit: 0, born: fliesClock, seed: Math.random() * 100, turnIn: bfRnd(2, 5) };
    const p = bfPick(f);
    if (!p) return;
    bfFlyTo(f, p);
    flies.push(f);
  }
  function bfAng(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }

  R.scareFlies = function (wx, wy) {
    const r = bfCfg().scareR || 90;
    flies.forEach(function (f) {
      if (f.mode === 'leave' || Math.hypot(f.x - wx, f.y - wy) > r) return;
      bfHop(f, { x: wx, y: wy, r: r });
    });
    crScare(wx, wy);
    if (GG.halloween) GG.halloween.click(wx, wy);
  };
  R.flies = function () { return flies; };

  function stepFlies(dt) {
    const B = bfCfg();
    if (!B.enabled) { flies.length = 0; return; }
    if (fliesLoc !== S.g.loc) { flies.length = 0; fliesLoc = S.g.loc; fliesWait = 1; }
    fliesClock += dt;

    const V = ivCfg(), idleAt = R.idlePoint();
    flies.forEach(function (f) {
      if (f.visitor && !idleAt) { f.visitor = false; bfHop(f, { x: f.x, y: f.y, r: 80 }); }
    });
    if (idleAt && !flies.some(function (f) { return f.visitor; }) && !(GG.halloween && GG.halloween.on())
        && (V.night || nightK <= 0.35)) {
      const cols = B.colors || ['#f4d35e'], e = bfEdge();
      const f = { x: e.x, y: e.y, col: cols[Math.floor(Math.random() * cols.length)], flap: bfRnd(0, 6), visitor: true,
                  ang: 0, sit: 0, born: fliesClock, seed: Math.random() * 100, turnIn: bfRnd(2, 5) };
      bfFlyTo(f, { kind: 'pointer' });
      f.dur = Math.min(f.dur, 3.5);
      flies.push(f);
    }
    curStep(idleAt);
    const want = bfWant();
    const staying = flies.filter(function (f) { return f.mode !== 'leave' && !f.visitor; });
    if (staying.length > want) bfLeave(staying.sort(function (a, b) { return a.born - b.born; })[0]);
    fliesWait -= dt;
    if (staying.length < want && fliesWait <= 0) { fliesWait = bfRnd(1.2, 2.6); bfSpawn(); }
    const hz = B.flapHz || 6, sit = B.sitSec || [6, 14];
    for (let i = flies.length - 1; i >= 0; i--) {
      const f = flies[i];
      if (f.mode === 'sit') {
        const q = f.perch && bfPerchPos(f.perch);
        if (!q) { bfHop(f); continue; }
        f.x = q.x; f.y = q.y;
        f.sit -= dt; f.flap += dt * (f.visitor && V.look === 'circle' ? hz * Math.PI * 2 : 1.6);
        f.turnIn -= dt;
        if (f.turnIn <= 0) { f.turnIn = bfRnd(2, 5); f.turnTo = f.ang + bfRnd(-0.6, 0.6); }
        if (f.turnTo !== undefined) f.ang += (f.turnTo - f.ang) * Math.min(1, dt * 3);
        if (!bfPerchAlive(f.perch)) {
          const n = S.node(f.perch.id);
          bfHop(f, n ? { x: f.x, y: f.y, r: 40 } : null);
        } else if (f.sit <= 0) bfHop(f);
        continue;
      }
      f.t += dt / f.dur;
      const to = f.perch ? bfPerchPos(f.perch) : f.dest;
      if (!to) { flies.splice(i, 1); continue; }
      if (f.perch && f.mode === 'fly' && !bfPerchAlive(f.perch)) { bfHop(f); continue; }
      const k = Math.min(1, f.t), e = k < 0.8 ? k : 0.8 + (1 - Math.pow(1 - (k - 0.8) / 0.2, 2)) * 0.2, u = 1 - e;
      const x = u * u * f.p0.x + 2 * u * e * f.c.x + e * e * to.x;
      const y = u * u * f.p0.y + 2 * u * e * f.c.y + e * e * to.y;
      const dx = 2 * u * (f.c.x - f.p0.x) + 2 * e * (to.x - f.c.x), dy = 2 * u * (f.c.y - f.p0.y) + 2 * e * (to.y - f.c.y);
      const dl = Math.hypot(dx, dy) || 1, wob = Math.sin(fliesClock * 7 + f.seed) * 7 * Math.sin(Math.PI * k);
      f.x = x - dy / dl * wob; f.y = y + dx / dl * wob;
      f.ang += bfAng(Math.atan2(dx, -dy) + Math.sin(fliesClock * 3 + f.seed) * 0.25, f.ang) * Math.min(1, dt * 8);
      f.flap += dt * hz * (f.fast ? 1.5 : 1) * Math.PI * 2;
      if (k >= 1) {
        if (f.mode === 'leave') { flies.splice(i, 1); continue; }
        f.mode = 'sit'; f.fast = false; f.sit = f.visitor ? 1e9 : bfRnd(sit[0], Math.max(sit[0], sit[1])); f.ang += bfRnd(-0.7, 0.7);
      }
    }
  }

  const BF_UP = [[0.06, -0.10], [0.30, -0.95, 0.98, -1.00, 0.94, -0.48], [0.90, -0.14, 0.50, 0.02, 0.06, 0.02]];
  const BF_LO = [[0.06, 0.06], [0.50, 0.06, 0.78, 0.36, 0.62, 0.64], [0.46, 0.88, 0.14, 0.62, 0.05, 0.26]];
  function bfWings(open, s) {
    ctx.beginPath();
    [-1, 1].forEach(function (side) {
      [BF_UP, BF_LO].forEach(function (P) {
        const m = function (x, y) { return [side * x * open * s, y * s]; };
        let q = m(P[0][0], P[0][1]); ctx.moveTo(q[0], q[1]);
        for (let i = 1; i < P.length; i++) {
          const c = P[i], a = m(c[0], c[1]), b = m(c[2], c[3]), d = m(c[4], c[5]);
          ctx.bezierCurveTo(a[0], a[1], b[0], b[1], d[0], d[1]);
        }
        ctx.closePath();
      });
    });
  }

  function drawFlies() {
    if (!flies.length) return;
    const B = bfCfg(), sc = S.g.camera.scale || 1;
    const s0 = Math.max(B.size || 11, (B.minPx === undefined ? 6 : B.minPx) / sc), lw0 = Math.max(1 / sc, s0 * 0.14);

    const zf = B.zoomFade, px = s0 * sc, s = s0;
    const za0 = zf ? Math.max(0, Math.min(1, (px - zf[1]) / Math.max(0.01, zf[0] - zf[1]))) : 1;
    const vs = Math.max(s, (ivCfg().minPx || 0) / sc);
    flies.forEach(function (f) {
      const za = f.visitor ? 1 : za0, s = f.visitor ? vs : s0, lw = f.visitor ? Math.max(1 / sc, vs * 0.14) : lw0;
      if (za <= 0) return;
      const sitting = f.mode === 'sit';
      const open = sitting ? 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(f.flap)) : 0.2 + 0.8 * Math.abs(Math.cos(f.flap));
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (za < 1) ctx.globalAlpha *= za;
      if (B.shadow !== false) {
        const off = sitting ? s * 0.25 : s * 0.9;
        ctx.save(); ctx.translate(f.x + off * 0.5, f.y + off); ctx.rotate(f.ang);
        bfWings(Math.max(0.4, open), s);
        ctx.fillStyle = 'rgba(0,0,0,' + (sitting ? 0.35 : 0.22) + ')'; ctx.fill();
        ctx.restore();
      }
      ctx.translate(f.x, f.y); ctx.rotate(f.ang);
      bfWings(open, s);
      ctx.fillStyle = rgba(f.col, 0.24); ctx.fill();
      ctx.strokeStyle = rgba(f.col, 0.95); ctx.lineWidth = lw; ctx.stroke();
      ctx.strokeStyle = rgba(f.col, 1); ctx.lineWidth = lw * 1.5;
      ctx.beginPath(); ctx.moveTo(0, -0.32 * s); ctx.lineTo(0, 0.5 * s); ctx.stroke();
      ctx.lineWidth = Math.max(0.8 / sc, lw * 0.7);
      ctx.beginPath(); ctx.moveTo(0, -0.32 * s); ctx.quadraticCurveTo(-0.08 * s, -0.62 * s, -0.24 * s, -0.78 * s);
      ctx.moveTo(0, -0.32 * s); ctx.quadraticCurveTo(0.08 * s, -0.62 * s, 0.24 * s, -0.78 * s); ctx.stroke();
      ctx.restore();
    });
  }

  const crit = { fireflies: [], bees: [], snail: [] };
  let critLoc = null, critClock = 0;
  function crCfg() { return (C.revive && C.revive.critters) || {}; }
  function crPick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function crBox(s) { const z = S.siteBox(s); return { x: s.x - z.w / 2, y: s.y - z.h / 2, w: z.w, h: z.h }; }
  function crLayout(s) {
    const o = C.revive && C.revive.bloom, look = o && o.enabled && o.looks && o.looks[s.type];
    return look ? bLayout(s, look, crBox(s), siteChip[s.id]) : null;
  }
  function crSite(id) { const n = S.node(id); return n && n.loc === S.g.loc ? n : null; }
  function crAllowed(k) {
    const c = crCfg(), o = c[k];
    if (!c.enabled || !o || !o.enabled || S.g.practice) return false;
    if (bfStage() < (c.fromStage || 4)) return false;
    const w = GG.sim.weather();
    if (w && (c.hideWeather || []).indexOf(w.id) >= 0) return false;
    if (w && w.id === 'rain' && !o.rainStay) return false;
    const night = nightK > 0.35;
    if (k === 'fireflies') return night;
    if (k === 'snail' && o.night) return true;
    return !night;
  }

  function crFireflyHome(o) {
    const sites = S.sitesHere().filter(function (s) { return bfFinished(s) && (o.skip || []).indexOf(s.type) < 0; });
    if (!sites.length) return null;
    const b = crBox(crPick(sites)), p = bPerim(b, bfRnd(0, 2 * (b.w + b.h)));
    if (p.ny > 0.5) return null;
    const out = bfRnd(-25, 45);
    return { x: p.x - p.nx * out, y: p.y - p.ny * out };
  }
  function crStepFireflies(dt) {
    const o = crCfg().fireflies || {}, L = crit.fireflies, want = crAllowed('fireflies') ? (o.count || 0) : 0;
    const stay = L.filter(function (c) { return !c.leaving; });
    if (stay.length > want) stay[0].leaving = true;
    if (stay.length < want && Math.random() < dt * 1.5) {
      const h = crFireflyHome(o), bs = o.blinkSec || [2.2, 4.5];
      if (h) L.push({ x: h.x + bfRnd(-20, 20), y: h.y + bfRnd(-20, 20), hx: h.x, hy: h.y, vx: 0, vy: 0, a: 0,
                      seed: bfRnd(0, 100), per: bfRnd(bs[0], bs[1]), ph: bfRnd(0, 6), boost: 0 });
    }
    for (let i = L.length - 1; i >= 0; i--) {
      const c = L[i];
      c.a = c.leaving ? c.a - dt * 0.6 : Math.min(1, c.a + dt * 0.5);
      if (c.leaving && c.a <= 0) { L.splice(i, 1); continue; }
      const ang = Math.sin(critClock * 0.7 + c.seed) * 3 + Math.sin(critClock * 0.31 + c.seed * 2) * 2;
      const sp = (o.speed || 10) + c.boost * 60;
      c.vx += (Math.cos(ang) * sp - c.vx) * Math.min(1, dt * 1.2);
      c.vy += (Math.sin(ang) * sp - c.vy) * Math.min(1, dt * 1.2);
      const dx = c.hx - c.x, dy = c.hy - c.y, d = Math.hypot(dx, dy);
      if (d > (o.tether || 55) && c.boost <= 0) { c.vx += dx / d * 20 * dt; c.vy += dy / d * 20 * dt; }
      c.x += c.vx * dt; c.y += c.vy * dt;
      c.boost = Math.max(0, c.boost - dt * 0.8);
    }
  }
  function crDrawFirefly(c, s, o) {
    const tt = ((critClock + c.ph) % c.per) / c.per;
    const glow = tt < 0.12 ? tt / 0.12 : tt < 0.45 ? 1 - (tt - 0.12) / 0.33 : 0;
    const a = c.a * (0.15 + 0.85 * glow) * (c.boost > 0 ? 0.4 : 1);
    if (a <= 0.01) return;
    const R = 9 * s, g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, R), gl = o.glow || '214,255,140';
    g.addColorStop(0, 'rgba(' + gl + ',' + (0.55 * a).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + gl + ',0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(' + (o.core || '240,255,200') + ',' + Math.min(1, a * 1.2).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(c.x, c.y, 1.4 * s, 0, Math.PI * 2); ctx.fill();
  }

  function crFlowers(s) {
    const L = crLayout(s); if (!L) return [];
    const out = []; L.runs.forEach(function (r) { r.flowers.forEach(function (f) { out.push(f); }); });
    return out;
  }
  function crBeeTarget(c, far) {
    const s = crSite(c.site); if (!s) return null;
    const fl = crFlowers(s); if (!fl.length) return null;
    const near = fl.filter(function (f) { const d = Math.hypot(f.x - c.x, f.y - c.y); return far ? d > 120 : d > 10 && d < 160; });
    return crPick(near.length ? near : fl);
  }
  function crStepBees(dt) {
    const o = crCfg().bees || {}, L = crit.bees, ok = crAllowed('bees');
    const gs = S.sitesHere().filter(function (s) { return s.type === 'treeSite' && bfFinished(s); });
    gs.forEach(function (s) {
      const mine = L.filter(function (c) { return c.site === s.id && !c.leaving; }), want = ok ? (o.perGrove || 0) : 0;
      if (mine.length > want) mine[0].leaving = true;
      if (mine.length < want && Math.random() < dt * 0.6) {
        const hw = S.siteBox(s).w / 2 + bfRnd(150, 260);
        const c = { site: s.id, x: s.x + (Math.random() < 0.5 ? -hw : hw), y: bfRnd(s.y - 120, s.y + 120),
                    vx: 0, vy: 0, mode: 'fly', hover: 0, seed: bfRnd(0, 100), ang: 0 };
        c.to = crBeeTarget(c, true); if (c.to) L.push(c);
      }
    });
    L.forEach(function (c) { if (!gs.some(function (s) { return s.id === c.site; })) c.leaving = true; });
    const hs = o.hoverSec || [1.5, 4];
    for (let i = L.length - 1; i >= 0; i--) {
      const c = L[i];
      if (c.leaving && !c.exit) { const s = crSite(c.site); c.exit = { x: c.x + (s && c.x < s.x ? -420 : 420), y: c.y - 80 }; c.mode = 'fly'; }
      const to = c.exit || c.to;
      if (!to) { L.splice(i, 1); continue; }
      if (c.mode === 'hover') {
        c.hover -= dt;
        c.x = to.x + Math.sin(critClock * 6 + c.seed) * 1.5; c.y = to.y - 2 + Math.cos(critClock * 7.3 + c.seed) * 1.2;
        if (c.hover <= 0) { c.to = crBeeTarget(c, false); c.mode = 'fly'; }
        continue;
      }
      const dx = to.x - c.x, dy = to.y - c.y, d = Math.hypot(dx, dy);
      const sp = (c.exit ? 160 : c.rush ? 150 : (o.speed || 55)) * Math.min(1, 0.35 + d / 60);
      const dir = Math.atan2(dy, dx) + Math.sin(critClock * 9 + c.seed) * 0.9 * Math.min(1, d / 50);
      c.vx += (Math.cos(dir) * sp - c.vx) * Math.min(1, dt * 6); c.vy += (Math.sin(dir) * sp - c.vy) * Math.min(1, dt * 6);
      c.x += c.vx * dt; c.y += c.vy * dt; c.ang = Math.atan2(c.vy, c.vx);
      if (c.exit) { if (d < 30) L.splice(i, 1); continue; }
      if (d < 4) { c.mode = 'hover'; c.hover = bfRnd(hs[0], hs[1]); c.rush = false; }
    }
  }
  function crDrawBee(c, s, o) {
    ctx.save(); ctx.translate(c.x, c.y);
    if (c.exit) ctx.globalAlpha *= Math.max(0, Math.min(1, Math.hypot(c.exit.x - c.x, c.exit.y - c.y) / 200));
    ctx.rotate(c.mode === 'hover' ? Math.sin(critClock * 2 + c.seed) * 0.4 : c.ang);
    const L = 2.6 * s, Wd = 1.6 * s, f = Math.abs(Math.sin(critClock * 60 + c.seed));
    ctx.fillStyle = 'rgba(' + (o.wing || '230,240,255') + ',' + (0.35 + 0.25 * f).toFixed(3) + ')';
    [-1, 1].forEach(function (sd) { ctx.beginPath(); ctx.ellipse(-0.2 * L, sd * Wd * (0.9 + 0.5 * f), L * 0.55, Wd * 0.75, sd * 0.4, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = o.body || '#f2c230'; ctx.beginPath(); ctx.ellipse(0, 0, L, Wd, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = o.stripe || '#1c1609'; ctx.lineWidth = 0.55 * s;
    [-0.5, 0.5].forEach(function (q) { ctx.beginPath(); ctx.moveTo(q * L, -Wd * 0.95); ctx.lineTo(q * L, Wd * 0.95); ctx.stroke(); });
    ctx.fillStyle = o.stripe || '#1c1609'; ctx.beginPath(); ctx.arc(L * 0.95, 0, Wd * 0.62, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function crStepSnail(dt) {
    const o = crCfg().snail || {}, L = crit.snail;
    const ts = S.sitesHere().filter(function (s) { return s.type === 'trashSite' && bfFinished(s); });
    const want = crAllowed('snail') ? Math.min(o.count || 0, ts.length) : 0;
    const out = L.filter(function (c) { return !c.leaving; });
    if (out.length > want) out[0].leaving = true;
    if (out.length < want && Math.random() < dt * 0.5) {
      const free = ts.filter(function (s) { return !L.some(function (c) { return c.site === s.id && !c.leaving; }); });
      if (free.length) {
        const s = crPick(free), lay = crLayout(s);

        const runs = lay ? lay.runs.filter(function (r) { return r.pts.length > 6 && r.pts[Math.floor(r.pts.length / 2)].p.ny < 0.5; }) : [];
        if (runs.length) { const r = crPick(runs);
          L.push({ site: s.id, run: lay.runs.indexOf(r), j: bfRnd(2, r.pts.length - 3), dir: Math.random() < 0.5 ? -1 : 1, a: 0, hide: 0, pause: 0 }); }
      }
    }
    const ps = o.pauseSec || [4, 10];
    for (let i = L.length - 1; i >= 0; i--) {
      const c = L[i], s = crSite(c.site);
      if (!s || !bfFinished(s)) { L.splice(i, 1); continue; }
      c.a = c.leaving ? c.a - dt * 0.5 : Math.min(1, c.a + dt * 0.4);
      if (c.leaving && c.a <= 0) { L.splice(i, 1); continue; }
      if (c.hide > 0) { c.hide -= dt; continue; }
      if (c.pause > 0) { c.pause -= dt; continue; }
      const lay = crLayout(s), run = lay && lay.runs[c.run];
      if (!run) { L.splice(i, 1); continue; }
      c.j += c.dir * (o.speed || 1.6) * dt / 6;
      if (c.j < 0.5 || c.j > run.pts.length - 1.5) { c.dir = -c.dir; c.j = Math.max(0.5, Math.min(run.pts.length - 1.5, c.j)); c.pause = bfRnd(3, 6); }
      else if (Math.random() < dt * 0.04) c.pause = bfRnd(ps[0], ps[1]);
    }
  }
  function crSnailPos(c) {
    const s = crSite(c.site), lay = s && crLayout(s), run = lay && lay.runs[c.run];
    if (!run) return null;
    const P = run.pts, j = Math.floor(c.j), q = c.j - j, a = P[j], b = P[Math.min(P.length - 1, j + 1)];
    return { x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q, ang: Math.atan2(b.y - a.y, b.x - a.x) + (c.dir < 0 ? Math.PI : 0) };
  }
  function crDrawSnail(c, q, u, o) {
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.ang); ctx.globalAlpha *= c.a;
    if (!(c.hide > 0)) {
      const body = o.body || '#b9a98a', wig = Math.sin(critClock * 1.3) * 0.3;
      ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(1.2 * u, 0, 4.6 * u, 1.5 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = body; ctx.lineWidth = 0.45 * u;
      [-1, 1].forEach(function (sd) {
        ctx.beginPath(); ctx.moveTo(4.8 * u, sd * 0.5 * u); ctx.lineTo(7 * u, sd * (1.8 + wig) * u); ctx.stroke();
        ctx.fillStyle = o.shellEdge || '#4a2e18'; ctx.beginPath(); ctx.arc(7 * u, sd * (1.8 + wig) * u, 0.4 * u, 0, Math.PI * 2); ctx.fill();
      });
    }
    ctx.fillStyle = o.shell || '#8a5a34'; ctx.strokeStyle = o.shellEdge || '#4a2e18'; ctx.lineWidth = 0.5 * u;
    ctx.beginPath(); ctx.arc(-0.6 * u, -0.6 * u, 3.1 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    for (let t = 0; t < 9; t += 0.3) {
      const r = 2.6 * u * (1 - t / 10.5), x = -0.6 * u + Math.cos(t) * r, y = -0.6 * u + Math.sin(t) * r;
      if (t) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = o.spiral || '#d2a56a'; ctx.stroke();
    ctx.restore();
  }

  function crScare(wx, wy) {
    const r = bfCfg().scareR || 90, near = function (x, y) { return Math.hypot(x - wx, y - wy) <= r; };
    crit.fireflies.forEach(function (c) {
      if (!near(c.x, c.y)) return;
      const d = Math.hypot(c.x - wx, c.y - wy) || 1;
      c.boost = 1; c.vx = (c.x - wx) / d * 70; c.vy = (c.y - wy) / d * 70;
    });
    crit.bees.forEach(function (c) { if (near(c.x, c.y) && !c.leaving) { c.to = crBeeTarget(c, true); c.mode = 'fly'; c.rush = true; } });
    const hs = (crCfg().snail || {}).hideSec || [4, 7];
    crit.snail.forEach(function (c) { const q = crSnailPos(c); if (q && near(q.x, q.y)) c.hide = bfRnd(hs[0], hs[1]); });
  }
  R.critters = function () { return crit; };

  function stepCritters(dt) {
    if (!crCfg().enabled || critLoc !== S.g.loc) {
      crit.fireflies.length = 0; crit.bees.length = 0; crit.snail.length = 0; critLoc = S.g.loc;
      if (!crCfg().enabled) return;
    }
    critClock += dt;
    crStepFireflies(dt); crStepBees(dt); crStepSnail(dt);
  }

  function drawCritters() {
    const c = crCfg();
    if (!c.enabled || !(crit.fireflies.length || crit.bees.length || crit.snail.length)) return;
    const sc = S.g.camera.scale || 1, zf = c.zoomFade;
    const fade = function (half) { return zf ? Math.max(0, Math.min(1, (half * sc - zf[1]) / Math.max(0.01, zf[0] - zf[1]))) : 1; };
    const each = function (list, size, half, fn) {
      if (!list.length) return;
      const a = fade(half * size); if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      list.forEach(fn); ctx.restore();
    };
    const so = c.snail || {}, bo = c.bees || {}, fo = c.fireflies || {};
    each(crit.snail, so.size || 1.1, 4.5, function (k) { const q = crSnailPos(k); if (q) crDrawSnail(k, q, so.size || 1.1, so); });
    each(crit.bees, bo.size || 1.2, 2.6, function (k) { crDrawBee(k, bo.size || 1.2, bo); });
    each(crit.fireflies, fo.size || 1, 4, function (k) { crDrawFirefly(k, fo.size || 1, fo); });
  }

  const mud = { gust: null, next: null, specks: [], loc: null };
  function mudLevel(M) {
    if (GG.practice && GG.practice.active) return null;
    if (GG.sim.reviveOn && !GG.sim.reviveOn()) return null;
    const st = revPin !== null ? revPin : GG.sim.reviveStage(S.g.loc);
    const amt = M.strength[st] || 0, k = Math.max(0, Math.min(1, 1 - st / (M.fadeStages || 3)));
    return amt > 0 && k > 0 ? { amt: amt, k: k } : null;
  }
  function mudEnv(g) {
    const ease = u => u * u * (3 - 2 * u);
    return g.t < 1.2 ? ease(g.t / 1.2) : g.t > g.dur - 1.8 ? ease(Math.max(0, Math.min(1, (g.dur - g.t) / 1.8))) : 1;
  }
  function drawMudWind(dt) {
    const M = C.mudWind;
    if (!M || !M.enabled) { mud.specks.length = 0; mud.gust = null; return; }
    dt = Math.max(0, Math.min(0.1, dt || 0));
    if (mud.loc !== S.g.loc) { mud.loc = S.g.loc; mud.specks.length = 0; mud.gust = null; mud.next = null; }
    const rnd = (a, b) => a + Math.random() * (b - a);
    if (mud.next === null) mud.next = M.everySec * rnd(0.5, 1);
    const lv = mudLevel(M);
    if (mud.gust) { mud.gust.t += dt; if (mud.gust.t >= mud.gust.dur) mud.gust = null; }
    else if (lv) {
      mud.next -= dt;
      if (mud.next <= 0) {
        const d = M.dir === 0 ? (Math.random() < 0.5 ? 1 : -1) : (M.dir < 0 ? -1 : 1);
        mud.gust = { t: 0, dur: M.sec, dir: d };
        mud.next = M.everySec * rnd(0.75, 1.25);
      }
    }
    const k = lv ? lv.k : 0, amt = lv ? lv.amt : 0;
    const e = mud.gust ? mudEnv(mud.gust) * k : 0, dir = mud.gust ? mud.gust.dir : 1;
    if (e > 0) {
      const want = (M.rate || 220) * e * amt * dt, n = Math.floor(want) + (Math.random() < want % 1 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const big = Math.random() < 0.08;
        mud.specks.push({ x: dir > 0 ? rnd(-60, -10) : rnd(W + 10, W + 60), y: rnd(-20, H + 20),
          vx: dir * rnd(700, 1250) * (big ? 0.7 : 1), vy: rnd(-40, 70), r: big ? rnd(3, 5.5) : rnd(0.8, 2.2),
          big: big, rot: rnd(0, 6), life: 0, ph: rnd(0, 6) });
      }
    }
    const clock = (mud.clock = (mud.clock || 0) + dt);
    mud.specks.forEach(p => { p.life += dt; p.x += p.vx * dt; p.y += (p.vy + Math.sin(clock * 6 + p.ph) * 50) * dt; p.rot += dt * 6; });
    mud.specks = mud.specks.filter(p => p.x > -80 && p.x < W + 80 && p.life < 4);
    if (!mud.specks.length) return;
    const a = Math.max(0, Math.min(1, Math.max(e, 0.3) * k * 1.3)) * Math.min(1, amt);
    if (a <= 0) return;
    const rgb = c => c[0] + ',' + c[1] + ',' + c[2];
    ctx.save();
    ctx.lineCap = 'round';
    mud.specks.forEach(p => {
      const len = Math.min(60, Math.abs(p.vx) * 0.028) * (p.big ? 0.4 : 1);
      ctx.strokeStyle = 'rgba(' + rgb(M.streak) + ',' + (0.55 * a).toFixed(3) + ')'; ctx.lineWidth = p.r * 0.9;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - Math.sign(p.vx) * len, p.y - p.vy * 0.02); ctx.stroke();
      ctx.fillStyle = 'rgba(' + rgb(p.big ? M.big : M.colour) + ',' + (0.85 * a).toFixed(3) + ')';
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * (p.big ? 0.7 : 0.9), 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
    ctx.restore();
  }

  R.mudGust = function () { const M = C.mudWind; if (M) mud.next = 0; return mud; };

  function drawBirds(time) {
    const L = lifeCfg();
    if (!L || !L.birds) return;
    const on = Math.max(0, Math.min(1, (R.reviveK() - L.starts.birds) / L.grow));
    if (on <= 0) return;
    const seed = hashStr('birds:' + (S.g.loc || ''));
    ctx.save();
    ctx.strokeStyle = rgba(L.colors.bird, L.birdAlpha * on);
    ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let f = 0; f < L.birds; f++) {
      const per = 30 + h01(seed, f, 0, 1) * 30, cross = 14 + h01(seed, f, 0, 2) * 8;
      const u = ((time + h01(seed, f, 0, 3) * per) % per) / cross;
      if (u > 1) continue;
      const dir = h01(seed, f, 0, 4) < 0.5 ? 1 : -1;
      const x0 = dir > 0 ? -60 + u * (W + 120) : W + 60 - u * (W + 120);
      const y0 = H * (0.1 + h01(seed, f, 0, 5) * 0.4) + Math.sin(u * 5 + f) * 16;
      const n = 1 + Math.floor(h01(seed, f, 0, 6) * 4);
      for (let b = 0; b < n; b++) {
        const x = x0 - dir * b * 16 * (0.8 + h01(seed, f, b, 7) * 0.5);
        const y = y0 + (b % 2 ? 1 : -1) * b * 7 + h01(seed, f, b, 8) * 6;
        const s = 5 + h01(seed, f, b, 9) * 3;
        const flap = Math.sin(time * (7 + h01(seed, f, b, 10) * 3) + b * 2);
        ctx.moveTo(x - s, y - s * 0.5 * flap);
        ctx.quadraticCurveTo(x - s * 0.45, y - s * 0.35 - s * 0.3 * flap, x, y);
        ctx.quadraticCurveTo(x + s * 0.45, y - s * 0.35 - s * 0.3 * flap, x + s, y - s * 0.5 * flap);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const o = [];
    for (let i = 2; i >= 0; i--) {
      const sh = i * 8;
      const x = (pa >> sh) & 255, y = (pb >> sh) & 255;
      o.push(Math.round(x + (y - x) * t));
    }
    return 'rgb(' + o[0] + ',' + o[1] + ',' + o[2] + ')';
  }

  function drawSmog(time) {
    const H2 = C.heal;
    if (!H2 || !H2.enabled) return;
    const dirty = 1 - R.healK();
    if (dirty <= 0.002) return;

    ctx.save();
    const g = ctx.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, Math.hypot(W, H) * 0.62);
    g.addColorStop(0, rgba(H2.smog.color, H2.smog.alpha * dirty * 0.45));
    g.addColorStop(1, rgba(H2.smog.color, H2.smog.alpha * dirty));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const M = H2.motes, n = Math.round(M.count * dirty);
    ctx.fillStyle = rgba(M.color, 0.5 * dirty);
    for (let i = 0; i < n; i++) {
      const sx = (i * 97.13) % 1, sy = (i * 41.77) % 1;
      const x = ((sx * W) + time * M.speed * (0.5 + sx)) % (W + 40) - 20;
      const y = (sy * H + Math.sin(time * 0.25 + i) * 9 + H) % H;
      ctx.beginPath();
      ctx.arc(x, y, M.size * (0.6 + sy * 0.8), 0, 6.283);
      ctx.fill();
    }
    ctx.restore();
  }
})(window.GG);
