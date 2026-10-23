(function (GG) {
  'use strict';
  const H = {};
  GG.halloween = H;
  let C, S, R;
  const cfg = () => (C && C.halloween) || {};
  const rnd = s => { const v = Math.sin(s * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function inDates(F) {
    const d = new Date(), m = d.getMonth() + 1, day = d.getDate(), k = m * 100 + day;
    return k >= F.from[0] * 100 + F.from[1] && k <= F.to[0] * 100 + F.to[1];
  }
  H.on = function () {
    C = GG.config; S = GG.state; R = GG.render;
    const F = cfg();
    if (!F.enabled || !S || !S.g || (GG.practice && GG.practice.active)) return false;
    if (F.force === true) return true;
    if (F.force === false) return false;
    return inDates(F);
  };
  H.replacesButterflies = function () { return H.on() && cfg().bats.replaceButterflies !== false; };
  const night = () => R.nightK() > 0.5;
  const trashSites = () => S.sitesHere().filter(s => s.type === 'trashSite');

  const bats = [];
  let batLoc = null, perchAt = -1, perches = [], area = null;
  function refresh(time) {
    if (time - perchAt < 2 && perches.length) return;
    perchAt = time; perches = [];
    const all = [];
    S.machinesHere().forEach(n => {
      const z = S.sizeOf(n);
      [-0.3, 0.25].forEach(f => perches.push({ x: n.x + z.w * f, y: n.y + z.h / 2 }));
      all.push([n.x - z.w / 2, n.y - z.h / 2, n.x + z.w / 2, n.y + z.h / 2]);
    });
    S.sitesHere().forEach(s => { const z = S.siteBox(s); all.push([s.x - z.w / 2, s.y - z.h / 2, s.x + z.w / 2, s.y + z.h / 2]); });
    area = all.length ? { x0: Math.min(...all.map(a => a[0])), y0: Math.min(...all.map(a => a[1])),
                          x1: Math.max(...all.map(a => a[2])), y1: Math.max(...all.map(a => a[3])) } : null;
  }
  function freePerch(r, me) {
    const taken = q => bats.some(o => o !== me && ((o.mode === 'hang' && o.perch === q) || (o.fly && o.fly.to === q)));
    const free = perches.filter(q => !taken(q)), L = free.length ? free : perches;
    return L.length ? L[Math.floor(r * L.length) % L.length] : null;
  }
  function makeBats() {
    bats.length = 0;
    const B = cfg().bats, n = Math.max(B.day || 0, B.night || 0), A = area;
    if (!A) return;
    for (let i = 0; i < n; i++) {
      const seed = i + 1, home = { x: A.x0 + (A.x1 - A.x0) * rnd(seed * 3.1), y: A.y0 - 40 + (A.y1 - A.y0) * rnd(seed * 5.7) };
      bats.push({ i, seed, x: home.x, y: home.y, vx: 0, vy: 0, home, tx: home.x, ty: home.y, retarget: 0, scare: 0, alpha: 0,
                  mode: 'fly', perch: null, sit: 10 + rnd(seed) * 14, fly: null, ang: rnd(seed * 2.2) * 6.28, phase: rnd(seed * 4.4) * 6.28 });
    }
  }

  function behOf(b) { return night() ? (b.i % 2 ? 'C' : 'A') : 'B'; }
  function stepBats(dt, time) {
    if (batLoc !== S.g.loc) { batLoc = S.g.loc; perchAt = -1; refresh(time); makeBats(); }
    refresh(time);
    const B = cfg().bats, A = area, want = night() ? B.night : B.day;
    if (!A) return;
    bats.forEach((b, idx) => {
      const beh = behOf(b), on = idx < want && (beh !== 'B' || perches.length > 0);
      b.alpha += ((on ? 1 : 0) - b.alpha) * Math.min(1, dt * 2.5);
      b.phase += dt * (b.mode === 'hang' ? 0 : 16);
      if (b.scare > 0) {
        b.scare -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 0.97; b.vy *= 0.97;
        if (b.scare <= 0 && beh === 'B') { b.mode = 'fly'; b.fly = null; }
        return;
      }
      if (beh !== 'B' && b.mode === 'hang') { b.mode = 'fly'; b.fly = null; b.vx = 0; b.vy = -60; }
      if (beh === 'A') {
        b.retarget -= dt;
        if (b.retarget <= 0) {
          b.retarget = 0.35 + rnd(b.seed + time) * 0.6;
          const r = 170;
          b.tx = clamp(b.home.x + (rnd(b.seed * 7 + time) - 0.5) * 2 * r, A.x0 - 60, A.x1 + 60);
          b.ty = clamp(b.home.y + (rnd(b.seed * 11 + time) - 0.5) * 2 * r * 0.6, A.y0 - 160, A.y1);
        }
        const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy) || 1, sp = 190;
        b.vx += (dx / d * sp - b.vx) * Math.min(1, dt * 6); b.vy += (dy / d * sp - b.vy) * Math.min(1, dt * 6);
        b.x += b.vx * dt; b.y += b.vy * dt + Math.sin(time * 11 + b.seed) * 0.6;
      } else if (beh === 'B') {
        if (!b.alpha && b.mode !== 'hang') {
          const p = freePerch(rnd(b.seed * 9.3), b); if (p) { b.mode = 'hang'; b.perch = p; b.x = p.x; b.y = p.y; }
        }
        if (b.mode === 'hang' && b.perch) {
          b.x = b.perch.x; b.y = b.perch.y; b.sit -= dt;
          if (b.sit <= 0) { b.mode = 'fly'; b.fly = null; }
        } else {
          if (!b.fly) {
            const to = freePerch(rnd(b.seed * 13 + time), b); if (!to) return;
            b.fly = { x0: b.x, y0: b.y, to, t: 0, T: 1.3 + rnd(b.seed + time) * 1.2, up: 120 + rnd(b.seed * 3 + time) * 120 };
          }
          const f = b.fly; f.t += dt; const u = Math.min(1, f.t / f.T), e = u * u * (3 - 2 * u);
          b.x = f.x0 + (f.to.x - f.x0) * e + Math.sin(u * 9 + b.seed) * 14;
          b.y = f.y0 + (f.to.y - f.y0) * e - Math.sin(u * Math.PI) * f.up;
          if (u >= 1) { b.mode = 'hang'; b.perch = f.to; b.sit = 10 + rnd(b.seed + time) * 14; b.fly = null; }
        }
      } else {
        const ts = trashSites(), s = ts[b.i % Math.max(1, ts.length)];
        if (!s) return;
        const z = S.siteBox(s);
        b.ang += dt * (0.9 + rnd(b.seed) * 0.5) * (b.i % 2 ? 1 : -1);
        const tx = s.x + Math.cos(b.ang) * z.w * 0.42, ty = s.y - z.h / 2 - 90 + Math.sin(b.ang * 2) * 28 + Math.sin(b.ang) * 40;
        b.x += (tx - b.x) * Math.min(1, dt * 3); b.y += (ty - b.y) * Math.min(1, dt * 3);
      }
    });
  }
  function drawBat(x, b, s) {
    x.save();
    x.globalAlpha *= b.alpha;
    x.translate(b.x, b.y);
    const nk = R.nightK();
    x.lineJoin = 'round'; x.lineWidth = Math.max(0.8, s * 0.07);
    x.fillStyle = '#231b2d'; x.strokeStyle = 'rgba(176,150,214,' + (0.55 + 0.3 * nk) + ')';
    if (b.mode === 'hang' && b.scare <= 0) {
      x.rotate(Math.sin(performance.now() / 700 + b.seed) * 0.12);
      x.beginPath(); x.moveTo(-s * 0.06, 0); x.lineTo(-s * 0.06, s * 0.12); x.moveTo(s * 0.06, 0); x.lineTo(s * 0.06, s * 0.12); x.stroke();
      x.beginPath(); x.ellipse(0, s * 0.5, s * 0.24, s * 0.4, 0, 0, Math.PI * 2); x.fill(); x.stroke();
      x.beginPath(); x.moveTo(-s * 0.13, s * 0.86); x.lineTo(-s * 0.2, s * 1.08); x.lineTo(-s * 0.04, s * 0.92);
      x.moveTo(s * 0.13, s * 0.86); x.lineTo(s * 0.2, s * 1.08); x.lineTo(s * 0.04, s * 0.92); x.fill(); x.stroke();
      x.fillStyle = nk > 0.4 ? '#ffb347' : '#c98b52';
      x.beginPath(); x.arc(-s * 0.08, s * 0.76, s * 0.04, 0, 6.3); x.arc(s * 0.08, s * 0.76, s * 0.04, 0, 6.3); x.fill();
      x.restore(); return;
    }
    const a = Math.sin(b.phase);
    [-1, 1].forEach(side => {
      x.beginPath();
      x.moveTo(side * s * 0.12, -s * 0.08);
      x.lineTo(side * s * 1.0, -s * 0.2 - s * 0.45 * a);
      x.quadraticCurveTo(side * s * 0.88, s * 0.05 - s * 0.25 * a, side * s * 0.72, s * 0.12 - s * 0.2 * a);
      x.quadraticCurveTo(side * s * 0.6, s * 0.0 - s * 0.12 * a, side * s * 0.46, s * 0.16 - s * 0.12 * a);
      x.quadraticCurveTo(side * s * 0.32, s * 0.04, side * s * 0.12, s * 0.18);
      x.closePath(); x.fill(); x.stroke();
    });
    x.beginPath(); x.ellipse(0, s * 0.04, s * 0.15, s * 0.24, 0, 0, Math.PI * 2); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(-s * 0.12, -s * 0.16); x.lineTo(-s * 0.15, -s * 0.36); x.lineTo(-s * 0.03, -s * 0.2);
    x.moveTo(s * 0.12, -s * 0.16); x.lineTo(s * 0.15, -s * 0.36); x.lineTo(s * 0.03, -s * 0.2); x.fill(); x.stroke();
    x.fillStyle = nk > 0.4 ? '#ffb347' : '#c98b52';
    x.beginPath(); x.arc(-s * 0.06, -s * 0.1, s * 0.035, 0, 6.3); x.arc(s * 0.06, -s * 0.1, s * 0.035, 0, 6.3); x.fill();
    x.restore();
  }
  let lastClick = '';

  H.click = function (wx, wy) {
    if (!H.on() || !bats.length) return;
    const B = cfg().bats, r = B.scareR || 120, hitR = Math.max(B.size * 1.3, (B.hitPx || 26) / S.g.camera.scale);
    if (bats.some(b => b.alpha > 0.3 && Math.hypot(b.x - wx, b.y - wy) <= hitR)) {
      const L = (cfg().sounds || {}).click || [];
      const pick = L.length > 1 ? L.filter(k => k !== lastClick) : L;
      if (pick.length) { lastClick = pick[Math.floor(Math.random() * pick.length)]; GG.audio.play(lastClick); }
      S.g.batsHit = (S.g.batsHit || 0) + 1;
    }
    bats.forEach(b => {
      const dx = b.x - wx, dy = b.y - wy, d = Math.hypot(dx, dy);
      if (d > r) return;
      b.scare = 1.3; const k = 1 / Math.max(1, d);
      b.vx = dx * k * 420 + (Math.random() - 0.5) * 120; b.vy = dy * k * 420 - 160;
      if (b.mode === 'hang') { b.mode = 'fly'; b.fly = null; b.sit = 0; }
    });
  };
  H.bats = function () { return bats; };

  let visitor = null;
  function stepVisitor(dt, time) {
    const V = (C.revive && C.revive.idleVisitor) || {}, p = R.idlePoint ? R.idlePoint() : null, k = 1 / (S.g.camera.scale || 1);
    if (p && !visitor) {
      const sz = R.size ? R.size() : { w: 1200, h: 800 }, left = Math.random() < 0.5;
      const e = R.toWorld(left ? -60 : sz.w + 60, sz.h * (0.15 + Math.random() * 0.5));
      visitor = { x: e.x, y: e.y, x0: e.x, y0: e.y, t: 0, mode: 'come', alpha: 1, phase: 0, scare: 0, seed: 7, i: 99, ang: 0 };
    }
    if (!visitor) return;
    const v = visitor;
    if (!p && v.mode !== 'go') { v.mode = 'go'; v.t = 0; v.x0 = v.x; v.y0 = v.y; v.dir = Math.random() < 0.5 ? -1 : 1; }
    v.t += dt; v.phase += dt * 16;
    if (v.mode === 'go') {
      v.x = v.x0 + v.dir * v.t * 260 * k; v.y = v.y0 - v.t * 200 * k + Math.sin(v.t * 9) * 6 * k;
      v.alpha = Math.max(0, 1 - v.t / 1.2);
      if (v.alpha <= 0) visitor = null;
      return;
    }
    const spot = V.bat === 'circle'
      ? { x: p.x + Math.cos(time * 2.4) * 30 * k, y: p.y + Math.sin(time * 2.4) * 18 * k - 8 * k }
      : (R.cursorBottom && R.cursorBottom()) || { x: p.x, y: p.y };
    if (v.mode === 'come') {
      const u = Math.min(1, v.t / 2.4), e = u * u * (3 - 2 * u);
      v.x = v.x0 + (spot.x - v.x0) * e + Math.sin(u * 8) * 10 * k * (1 - u);
      v.y = v.y0 + (spot.y - v.y0) * e - Math.sin(u * Math.PI) * 60 * k;
      if (u >= 1) v.mode = V.bat === 'circle' ? 'circle' : 'hang';
      return;
    }
    v.x = spot.x; v.y = spot.y;
  }
  function drawVisitor(x) {
    if (!visitor) return;
    const B = cfg().bats || {}, s = Math.max(B.size || 13, 12 / (S.g.camera.scale || 1));
    drawBat(x, visitor, s);
  }
  H.visitor = function () { return visitor; };

  function drawPumpkin(x, cx, by, r, seed, face, nk, time) {
    x.save();
    x.translate(cx, by - r * 0.78);
    x.rotate((rnd(seed * 3.3) - 0.5) * 0.25);
    x.scale(0.9 + rnd(seed * 1.7) * 0.25, 1);
    x.lineWidth = Math.max(0.8, r * 0.09); x.strokeStyle = '#8a3f10';
    const lobe = (ox, rx, c) => { x.beginPath(); x.ellipse(ox, 0, rx, r * 0.78, 0, 0, Math.PI * 2); x.fillStyle = c; x.fill(); x.stroke(); };
    lobe(-r * 0.42, r * 0.5, '#d9661f'); lobe(r * 0.42, r * 0.5, '#d9661f');
    lobe(-r * 0.18, r * 0.5, '#e8792b'); lobe(r * 0.18, r * 0.5, '#e8792b');
    lobe(0, r * 0.42, '#f08a34');
    x.beginPath(); x.moveTo(-r * 0.04, -r * 0.74); x.quadraticCurveTo(r * 0.02, -r * 1.05, r * 0.2, -r * 1.12);
    x.lineWidth = Math.max(1.2, r * 0.17); x.strokeStyle = '#5f6a2e'; x.lineCap = 'round'; x.stroke();
    if (face) {
      const lit = nk > 0.35, fl = 0.8 + 0.2 * Math.sin(time * 9 + seed * 5) * Math.sin(time * 3.7 + seed);
      x.fillStyle = lit ? 'rgba(255,214,90,' + (0.75 + 0.25 * fl) + ')' : '#3c1b07';
      if (lit) { x.shadowColor = '#ffb030'; x.shadowBlur = r * 1.2 * fl; }
      x.beginPath();
      x.moveTo(-r * 0.42, -r * 0.12); x.lineTo(-r * 0.16, -r * 0.12); x.lineTo(-r * 0.29, -r * 0.38); x.closePath();
      x.moveTo(r * 0.42, -r * 0.12); x.lineTo(r * 0.16, -r * 0.12); x.lineTo(r * 0.29, -r * 0.38); x.closePath();
      x.moveTo(-r * 0.46, r * 0.14); x.lineTo(-r * 0.3, r * 0.26); x.lineTo(-r * 0.15, r * 0.16); x.lineTo(0, r * 0.3);
      x.lineTo(r * 0.15, r * 0.16); x.lineTo(r * 0.3, r * 0.26); x.lineTo(r * 0.46, r * 0.14);
      x.quadraticCurveTo(0, r * 0.62, -r * 0.46, r * 0.14); x.closePath();
      x.fill();
    }
    x.restore();
  }

  H.under = function (x, time) {
    if (!H.on()) return;
    const P = cfg().pumpkins || {}, N = P.count || 0, nk = R.nightK();
    trashSites().forEach((s, si) => {
      const z = S.siteBox(s), top = s.y - z.h / 2, r = clamp(z.w * 0.035, 8, 18) * (P.size || 1);
      for (let i = 0; i < N; i++) {
        const seed = si * 31 + i + 1;
        const keep = Math.min(z.w * 0.3, 78) + r, side = i % 2 ? 1 : -1, nSide = side < 0 ? Math.ceil(N / 2) : Math.floor(N / 2);
        const j = Math.floor(i / 2), span = z.w / 2 - keep - r * 0.6;
        const f = (j + 0.5) / nSide + (rnd(seed * 2.9) - 0.5) * 0.4 / nSide;
        drawPumpkin(x, s.x + side * (keep + span * (1 - f)), top + 1, r * (0.75 + rnd(seed * 4.1) * 0.5), seed, P.faces !== false, nk, time);
      }
    });
  };

  function drawWeb(x, cx, cy, r, dirX, time, seed, nk, spider) {

    x.save(); x.translate(cx, cy);
    x.strokeStyle = 'rgba(220,226,235,.55)'; x.lineWidth = Math.max(0.5, r * 0.025);
    const dirs = [];
    for (let i = 0; i < 5; i++) { const a = (i / 4) * Math.PI / 2; dirs.push([dirX * Math.cos(a), Math.sin(a)]); }
    x.beginPath(); dirs.forEach(([dx, dy]) => { x.moveTo(0, 0); x.lineTo(dx * r, dy * r); }); x.stroke();
    [0.3, 0.55, 0.8].forEach(q => {
      x.beginPath();
      dirs.forEach(([dx, dy], i) => {
        const X = dx * r * q, Y = dy * r * q;
        if (!i) x.moveTo(X, Y);
        else { const [px, py] = dirs[i - 1]; x.quadraticCurveTo((px + dx) * r * q * 0.42, (py + dy) * r * q * 0.42, X, Y); }
      });
      x.stroke();
    });
    if (spider) {

      const tx = dirX * r * 0.13, ty = r * 0.18, drop = r * (0.45 + 0.15 * Math.sin(time * 1.3 + seed));
      x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx, ty + drop); x.stroke();
      x.fillStyle = '#1d1a22'; x.beginPath(); x.arc(tx, ty + drop, r * 0.05, 0, 6.3); x.fill();
      x.strokeStyle = '#1d1a22'; x.lineWidth = Math.max(0.4, r * 0.015);
      for (let k = -1; k <= 1; k += 2) for (let j = 0; j < 3; j++) { x.beginPath(); x.moveTo(tx, ty + drop); x.lineTo(tx + k * r * 0.09, ty + drop - r * 0.03 + j * r * 0.035); x.stroke(); }
      const er = Math.max(0.6, r * 0.018), ey = ty + drop + r * 0.012, glow = Math.max(0, (nk - 0.2) / 0.8);
      x.fillStyle = glow > 0 ? 'rgba(255,60,50,' + (0.6 + 0.4 * glow) + ')' : '#8a1f1a';
      if (glow > 0) { x.shadowColor = '#ff2a20'; x.shadowBlur = r * 0.12 * glow + 2 * glow; }
      x.beginPath(); x.arc(tx - er * 1.3, ey, er, 0, 6.3); x.arc(tx + er * 1.3, ey, er, 0, 6.3); x.fill();
      x.shadowBlur = 0;
    }
    x.restore();
  }

  H.onPlot = function (x, s, bx, by, w, h, time) {
    if (s.type !== 'treeSite' || !H.on()) return;
    const W = cfg().webs || {}, r = Math.min(w, h) * 0.3 * (W.size || 1), nk = R.nightK();
    drawWeb(x, bx + 3, by + 3, r, 1, time, 1, nk, W.spider !== false);
    drawWeb(x, bx + w - 3, by + 3, r, -1, time, 2, nk, false);
  };

  function owlPath(u, L) {
    if (u < 0.4) { const e = u / 0.4, k = 1 - (1 - e) * (1 - e); return { x: -L * 0.8 * (1 - k), y: -320 + 210 * k, flap: 3.5 + 2.5 * e }; }
    if (u < 0.62) return { x: Math.sin((u - 0.4) * 30) * 6, y: -110 + Math.sin((u - 0.4) * 22) * 7, flap: 7 };
    const e = (u - 0.62) / 0.38; return { x: L * 0.75 * e * e, y: -110 - 300 * e, flap: 5 };
  }
  const OWL_T = 3.4, OWL_DROP = 0.52;
  const owlF = () => { const O = cfg().owl || {}; return clamp(S.g.camera.scale, O.minScale || 0.45, O.maxScale || 1.6); };
  let owl = null, hootTurn = 0;
  const hold = on => document.body.classList.toggle('hw-hold', !!on);
  function stageW() { const st = document.getElementById('stage'); return (st && st.clientWidth) || 1200; }
  function reveal() {
    hold(false);
    const g = S.g.gem, o = owl;
    owl = o ? Object.assign(o, { landed: true }) : null;
    if (!g || !o || g !== o.gem) return;
    S.g.gem = null; GG.ui.syncGem(); S.g.gem = g; GG.ui.syncGem();
    GG.audio.play('gemDrop');
  }

  H.owlDeliver = function () {
    const O = cfg().owl || {}, g = S && S.g && S.g.gem;
    if (!H.on() || O.enabled === false || !g || g.x === undefined || g.loc !== S.g.loc || document.hidden) return false;
    const gy = R.toScreen(g.x, g.y).y, dropH = -owlPath(OWL_DROP, 1).y;
    owl = { t: 0, gem: g, dropped: false, fall: null, landed: false, hooted: false,
            fy: clamp((gy - 95) / (dropH * owlF()), 0.35, 1) };
    hold(true);
    const sp = O.speed || 1, me = owl;
    setTimeout(function () { if (owl === me && !me.landed) reveal(); }, (OWL_T / sp + 1.5) * 1000);
    return true;
  };
  function hoot() {
    const L = (cfg().sounds || {}).hoot || [];
    if (L.length) GG.audio.play(L[hootTurn++ % L.length]);
  }
  function stepOwl(dt) {
    if (!owl) return;
    if (!S.g.gem || S.g.gem !== owl.gem || owl.gem.loc !== S.g.loc) { if (!owl.landed) reveal(); owl = null; return; }
    const sp = (cfg().owl || {}).speed || 1;
    owl.t += dt * sp;
    const u = owl.t / OWL_T;
    if (!owl.hooted && u >= 0.08) { owl.hooted = true; hoot(); }
    if (!owl.dropped && u >= OWL_DROP) {
      owl.dropped = true;
      owl.fall = { y: owlPath(OWL_DROP, 1).y * owl.fy + 26, vy: 0 };
    }
    if (owl.fall && !owl.landed) {
      owl.fall.vy += 1500 * dt * sp; owl.fall.y += owl.fall.vy * dt * sp;
      if (owl.fall.y >= -18) reveal();
    }
    if (u >= 1 && owl.landed) owl = null;
  }
  function drawGemShape(x, cx, cy, s) {
    x.save(); x.translate(cx, cy);
    x.shadowColor = '#ff5c8a'; x.shadowBlur = s * 0.9;
    x.beginPath(); x.moveTo(0, s * 0.55); x.lineTo(-s * 0.5, -s * 0.05); x.lineTo(-s * 0.25, -s * 0.4); x.lineTo(s * 0.25, -s * 0.4); x.lineTo(s * 0.5, -s * 0.05); x.closePath();
    x.fillStyle = '#ff5c8a'; x.fill();
    x.shadowBlur = 0; x.lineWidth = s * 0.06; x.strokeStyle = '#ffd0de';
    x.beginPath(); x.moveTo(-s * 0.5, -s * 0.05); x.lineTo(s * 0.5, -s * 0.05); x.moveTo(-s * 0.12, -s * 0.4); x.lineTo(0, s * 0.55); x.lineTo(s * 0.12, -s * 0.4); x.stroke();
    x.restore();
  }
  function drawOwlBody(x, S2, a, carry, time) {

    x.lineJoin = 'round'; x.lineWidth = Math.max(0.8, S2 * 0.05); x.strokeStyle = '#2e2116';
    [-1, 1].forEach(side => {
      x.beginPath();
      x.moveTo(side * S2 * 0.3, -S2 * 0.2);
      x.quadraticCurveTo(side * S2 * 0.9, -S2 * 0.55 - S2 * 0.5 * a, side * S2 * 1.45, -S2 * 0.25 - S2 * 0.75 * a);
      x.quadraticCurveTo(side * S2 * 1.25, S2 * 0.0 - S2 * 0.4 * a, side * S2 * 1.1, S2 * 0.18 - S2 * 0.35 * a);
      x.quadraticCurveTo(side * S2 * 0.9, S2 * 0.1 - S2 * 0.2 * a, side * S2 * 0.75, S2 * 0.3 - S2 * 0.25 * a);
      x.quadraticCurveTo(side * S2 * 0.5, S2 * 0.32, side * S2 * 0.3, S2 * 0.3);
      x.closePath(); x.fillStyle = '#5e4430'; x.fill(); x.stroke();
      x.beginPath(); x.lineWidth = Math.max(0.6, S2 * 0.03);
      x.moveTo(side * S2 * 0.6, -S2 * 0.12 - S2 * 0.25 * a); x.lineTo(side * S2 * 1.05, -S2 * 0.12 - S2 * 0.5 * a);
      x.moveTo(side * S2 * 0.6, S2 * 0.08 - S2 * 0.15 * a); x.lineTo(side * S2 * 0.95, S2 * 0.05 - S2 * 0.3 * a); x.stroke();
      x.lineWidth = Math.max(0.8, S2 * 0.05);
    });
    x.beginPath(); x.ellipse(0, 0, S2 * 0.42, S2 * 0.58, 0, 0, Math.PI * 2); x.fillStyle = '#7a5a40'; x.fill(); x.stroke();
    x.beginPath(); x.ellipse(0, S2 * 0.14, S2 * 0.27, S2 * 0.36, 0, 0, Math.PI * 2); x.fillStyle = '#c9a77e'; x.fill();
    x.strokeStyle = 'rgba(122,90,64,.7)'; x.lineWidth = Math.max(0.6, S2 * 0.03);
    for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-S2 * 0.12, S2 * (0.05 + i * 0.12)); x.quadraticCurveTo(0, S2 * (0.1 + i * 0.12), S2 * 0.12, S2 * (0.05 + i * 0.12)); x.stroke(); }
    x.strokeStyle = '#2e2116'; x.lineWidth = Math.max(0.8, S2 * 0.05);
    x.beginPath(); x.moveTo(-S2 * 0.3, -S2 * 0.42); x.lineTo(-S2 * 0.36, -S2 * 0.68); x.lineTo(-S2 * 0.14, -S2 * 0.5);
    x.moveTo(S2 * 0.3, -S2 * 0.42); x.lineTo(S2 * 0.36, -S2 * 0.68); x.lineTo(S2 * 0.14, -S2 * 0.5); x.fillStyle = '#7a5a40'; x.fill(); x.stroke();
    x.fillStyle = '#e6d2ae';
    x.beginPath(); x.arc(-S2 * 0.16, -S2 * 0.28, S2 * 0.18, 0, 6.3); x.arc(S2 * 0.16, -S2 * 0.28, S2 * 0.18, 0, 6.3); x.fill();
    x.fillStyle = '#ffc93c';
    if (Math.sin(time * 1.3) > 0.985) { x.fillRect(-S2 * 0.26, -S2 * 0.29, S2 * 0.2, S2 * 0.03); x.fillRect(S2 * 0.06, -S2 * 0.29, S2 * 0.2, S2 * 0.03); }
    else {
      x.beginPath(); x.arc(-S2 * 0.16, -S2 * 0.28, S2 * 0.105, 0, 6.3); x.arc(S2 * 0.16, -S2 * 0.28, S2 * 0.105, 0, 6.3); x.fill();
      x.fillStyle = '#1a1206'; x.beginPath(); x.arc(-S2 * 0.16, -S2 * 0.27, S2 * 0.055, 0, 6.3); x.arc(S2 * 0.16, -S2 * 0.27, S2 * 0.055, 0, 6.3); x.fill();
    }
    x.beginPath(); x.moveTo(-S2 * 0.05, -S2 * 0.2); x.lineTo(S2 * 0.05, -S2 * 0.2); x.lineTo(0, -S2 * 0.07); x.closePath(); x.fillStyle = '#e09a3a'; x.fill();
    x.strokeStyle = '#e09a3a'; x.lineWidth = Math.max(0.7, S2 * 0.04); x.lineCap = 'round';
    x.beginPath(); x.moveTo(-S2 * 0.1, S2 * 0.56); x.lineTo(-S2 * 0.12, S2 * 0.7); x.moveTo(S2 * 0.1, S2 * 0.56); x.lineTo(S2 * 0.12, S2 * 0.7); x.stroke();
    if (carry) drawGemShape(x, 0, S2 * 0.86, S2 * 0.42);
  }
  function drawOwl(x, time) {
    if (!owl) return;
    const k = 1 / S.g.camera.scale, f = owlF(), L = stageW() * 0.6;
    const u = Math.min(1, owl.t / OWL_T), p = owlPath(u, L), gx = owl.gem.x, gy = owl.gem.y;
    if (u < 1) {
      x.save();
      x.translate(gx + p.x * k, gy + p.y * owl.fy * f * k);
      drawOwlBody(x, 30 * f * k, Math.sin(owl.t * p.flap * 6.283), !owl.dropped, time);
      x.restore();
    }
    if (owl.fall && !owl.landed) {
      const dp = owlPath(OWL_DROP, L);
      drawGemShape(x, gx + dp.x * k, gy + owl.fall.y * f * k, 13 * f * k);
    }
  }
  H.owl = function () { return owl; };

  H.over = function (x, time, dt) {
    if (!H.on()) { if (owl && !owl.landed) reveal(); owl = null; visitor = null; bats.length = 0; batLoc = null; return; }
    dt = Math.min(0.1, Math.max(0, dt || 0));
    stepBats(dt, time);
    const sz = cfg().bats.size || 13;
    bats.forEach(b => { if (b.alpha > 0.01) drawBat(x, b, sz); });
    stepVisitor(dt, time); drawVisitor(x);
    stepOwl(dt); drawOwl(x, time);
  };

  H.season = function () {
    const F = (GG.config && GG.config.halloween) || {};
    if (!F.enabled) return false;
    if (F.force === true) return true;
    if (F.force === false) return false;
    return inDates(F);
  };

  H.newsCard = function (box, opt) {
    const card = box.querySelector('.mn-news-card');
    if (!card) return;
    opt = opt || {};
    box.classList.add('hw-news');
    const inner = document.createElement('canvas'), front = document.createElement('canvas');
    inner.className = 'hw-news-inner'; front.className = 'hw-news-front';
    card.insertBefore(inner, card.firstChild); box.appendChild(front);
    const glow = card.querySelector('.hw-news-glow');
    const bat = { x: 0, y: 0, alpha: 1, mode: 'hang', scare: 0, seed: 3, phase: 0, i: 0, away: 0, x0: 0, y0: 0 };
    let last = performance.now();
    const fit = (c, w, h, dpr) => {
      const W = Math.round(w * dpr), Hh = Math.round(h * dpr);
      if (c.width !== W || c.height !== Hh) { c.width = W; c.height = Hh; c.style.width = w + 'px'; c.style.height = h + 'px'; }
    };
    const zoom = () => (GG.render && GG.render.uiZoom ? GG.render.uiZoom() : 1);
    function cardRect() {
      const b = box.getBoundingClientRect(), c = card.getBoundingClientRect(), z = zoom();
      return { x: (c.left - b.left) / z + box.scrollLeft, y: (c.top - b.top) / z + box.scrollTop, w: card.offsetWidth, h: card.offsetHeight };
    }
    function step(now) {
      if (!box.isConnected) { box.removeEventListener('pointerdown', onDown, true); return; }
      requestAnimationFrame(step);
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
      const time = now / 1000, dpr = window.devicePixelRatio || 1, cr = cardRect();
      fit(inner, card.clientWidth, card.clientHeight, dpr); fit(front, box.clientWidth, box.clientHeight, dpr);
      const xi = inner.getContext('2d'), xf = front.getContext('2d');
      [xi, xf].forEach(x => { x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, x.canvas.width, x.canvas.height); });
      if (glow) {
        const fl = 0.8 + 0.2 * Math.sin(time * 9 + 5) * Math.sin(time * 3.7 + 1);
        glow.style.textShadow = '0 0 ' + (6 + 8 * fl).toFixed(1) + 'px rgba(255,160,40,' + (0.55 + 0.4 * fl).toFixed(2) + ')';
      }
      if (opt.web) drawWeb(xi, cr.w - 3, 3, 84, -1, time, 1, 1, true);
      if (opt.bat) stepCardBat(dt, time, cr, xf);
    }
    function stepCardBat(dt, time, cr, x) {
      const px = cr.x + cr.w * 0.74, py = cr.y + cr.h, b = bat;
      if (b.mode === 'hang') { b.x = px; b.y = py; b.alpha = 1; }
      else if (b.mode === 'away') {
        b.away += dt; b.phase += dt * 16;
        b.x += 240 * dt; b.y -= 170 * dt + Math.sin(time * 9) * 1.5; b.alpha = Math.max(0, 1 - b.away / 1.2);
        if (b.away > 3.5) { b.mode = 'back'; b.away = 0; b.x0 = -40; b.y0 = cr.y - 60; }
      } else if (b.mode === 'back') {
        b.away += dt; b.phase += dt * 16; b.alpha = 1;
        const u = Math.min(1, b.away / 2.2), e = u * u * (3 - 2 * u);
        b.x = b.x0 + (px - b.x0) * e; b.y = b.y0 + (py - b.y0) * e - Math.sin(u * Math.PI) * 80;
        if (u >= 1) b.mode = 'hang';
      }
      if (b.alpha > 0.01) H.art.bat(x, Object.assign({}, b, { mode: b.mode === 'hang' ? 'hang' : 'fly' }), 24, 1);
    }
    function onDown(e) {
      if (!opt.bat || bat.mode !== 'hang') return;
      const b = box.getBoundingClientRect(), z = zoom();
      const mx = (e.clientX - b.left) / z + box.scrollLeft, my = (e.clientY - b.top) / z + box.scrollTop;
      if (Math.hypot(mx - bat.x, my - (bat.y + 13)) > 26) return;
      const L = (((GG.config.halloween || {}).sounds) || {}).click || [];
      if (L.length) GG.audio.play(L[Math.floor(Math.random() * L.length)]);
      bat.mode = 'away'; bat.away = 0;
      e.stopPropagation(); e.preventDefault();
    }
    box.addEventListener('pointerdown', onDown, true);
    requestAnimationFrame(step);
  };

  H.art = {
    bat: function (x, b, s, nk) {
      const r0 = R;
      R = { nightK: () => (nk === undefined ? GG.render.nightK() : nk) };
      try { drawBat(x, b, s); } finally { R = r0; }
    },
    web: drawWeb,
    pumpkin: drawPumpkin,
  };
})(window.GG);
