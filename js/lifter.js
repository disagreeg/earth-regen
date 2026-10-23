GG.lifter = (function () {
  'use strict';
  const L = {};
  const C = GG.config, S = GG.state, R = GG.render, U = GG.util, IC = GG.icons;
  const cfg = () => C.lifter || {};

  L.on = function () { return cfg().enabled !== false; };
  L.cardHere = function () {
    return S.machinesHere().find(n => n.type === 'groundLifter') || null;
  };

  L.moneyPerCI = function () {
    const Sim = GG.sim;
    const ci = Sim.valueOf({ type: 'landfill' }, 'trash');
    const cash = Sim.valueOf({ type: 'market' }, 'trash');
    return ci > 0 ? cash / ci : 1;
  };

  L.potential = function (s) {
    const t = C.nodeTypes[s.type] || {};
    if (t.deplete) return (s.full || s.reserve || t.reserve || 0) * Math.max(0, GG.sim.valueOf({ type: 'landfill' }, 'trash'));
    const cap = s.capacity !== undefined ? s.capacity : t.capacity;
    return cap || 0;
  };
  L.price = function (s) {
    return Math.max(0, Math.round(L.potential(s) * (cfg().share || 0) * L.moneyPerCI()));
  };
  const money = v => U.cur('money', v);

  let picked = null;
  let ghost = null;
  let flight = null;
  let btn = null;
  const dust = [];

  L.busy = function () { return !!(ghost || flight); };

  L.sfx = function (id, on) {
    if (id === 'liftHover') { if (GG.audio.loop) GG.audio.loop(id, on !== false); return; }
    if (on !== false) GG.audio.play(id);
  };
  L.placing = function () { return !!ghost; };
  L.ghostOk = function () { return !!(ghost && ghost.ok); };

  function boxOf(s, x, y) {
    const b = S.siteBox(s);
    return { x: (x === undefined ? s.x : x) - b.w / 2, y: (y === undefined ? s.y : y) - b.h / 2, w: b.w, h: b.h };
  }
  function hit(a, b, m) { return a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m; }
  function fits(s, x, y, riders) {
    const me = boxOf(s, x, y), mine = new Set(riders.map(n => n.id)), gap = cfg().gap || 12;
    for (const o of S.sitesHere()) if (o !== s && hit(me, boxOf(o), gap)) return false;
    for (const n of S.machinesHere()) {
      if (mine.has(n.id)) continue;
      const z = S.sizeOf(n);
      if (hit(me, { x: n.x - z.w / 2, y: n.y - z.h / 2, w: z.w, h: z.h }, gap)) return false;
    }
    return true;
  }
  function liftable(s) { return s && s.type !== 'meteorite' && (C.nodeTypes[s.type] || {}).kind === 'site'; }

  function button() {
    if (btn) return btn;
    btn = document.createElement('button');
    btn.className = 'lift-btn';
    btn.type = 'button';
    btn.onmousedown = e => e.stopPropagation();
    btn.onclick = function (e) {
      e.stopPropagation();
      if (!picked || flight) return;
      const s = picked;
      unpick();
      ghost = { s: s, riders: S.onSiteMachines(s), x: s.x, y: s.y, ok: true, why: '' };
      GG.audio.play('click');
      GG.ui.toast(GG.i18n.t('ui.lift.hint'));
    };
    document.body.appendChild(btn);
    return btn;
  }
  function pick(s) {
    picked = s;
    const b = button();
    b.textContent = GG.i18n.t('ui.lift.btn') + '  ' + money(L.price(s));
    b.style.display = 'block';
    place();
  }
  function unpick() { picked = null; if (btn) btn.style.display = 'none'; }
  function place() {
    if (!btn || !picked) return;
    if (picked.loc !== S.g.loc || !L.cardHere()) { unpick(); return; }

    const b = boxOf(picked), top = R.toScreen(picked.x, b.y), r = R.canvas.getBoundingClientRect();
    const z = (R.uiZoom && R.uiZoom()) || 1;
    btn.style.left = (r.left / z + top.x - btn.offsetWidth / 2) + 'px';
    btn.style.top = (r.top / z + top.y - btn.offsetHeight - 10) + 'px';
  }

  L.tap = function (wx, wy, button) {
    if (!L.on() || flight) return false;
    if (ghost) {
      if (button === 2) { cancel(); return true; }
      if (button !== 0) return true;
      if (!ghost.ok) { GG.audio.play('deny'); GG.ui.toast(ghost.why, true); return true; }
      const price = L.price(ghost.s);
      if ((S.g.money || 0) < price) { GG.audio.play('deny'); GG.ui.toast(GG.i18n.t('ui.lift.money').replace('%p', money(price)), true); return true; }
      S.g.money -= price;
      S.g.liftMoves = (S.g.liftMoves || 0) + 1;
      start(ghost);
      ghost = null;
      return true;
    }
    if (button !== 0 || !L.cardHere()) { if (picked) unpick(); return false; }
    const s = S.siteAt(wx, wy);
    if (liftable(s)) { pick(s); return false; }
    if (picked) unpick();
    return false;
  };
  L.hover = function (wx, wy) {
    if (!ghost) return;
    const sn = S.snapTo ? S.snapTo : (v => Math.round(v / 20) * 20);
    ghost.x = sn(wx); ghost.y = sn(wy);
    const price = L.price(ghost.s);
    if (!fits(ghost.s, ghost.x, ghost.y, ghost.riders)) { ghost.ok = false; ghost.why = GG.i18n.t('ui.lift.overlap'); }
    else if ((S.g.money || 0) < price) { ghost.ok = false; ghost.why = GG.i18n.t('ui.lift.money').replace('%p', money(price)); }
    else { ghost.ok = true; ghost.why = ''; }
  };
  function cancel() { ghost = null; unpick(); GG.audio.play('click'); }
  L.escape = function () {
    if (ghost || picked) { cancel(); return true; }
    return false;
  };

  const ease = u => u * u * (3 - 2 * u);
  function now() { return (window.performance ? performance.now() : Date.now()) / 1000; }
  function start(gh) {
    const s = gh.s, d = Math.hypot(gh.x - s.x, gh.y - s.y), F = cfg().flight || {};
    flight = { s: s, list: gh.riders, x0: s.x, y0: s.y, x1: gh.x, y1: gh.y, t0: now(), card: L.cardHere(),
      T: { to: F.to || 0.9, lift: F.lift || 0.35, carry: Math.max(F.carryMin || 0.7, Math.min(F.carryMax || 2.4, d / (F.speed || 520))),
           drop: F.drop || 0.35, back: F.back || 0.9 } };
    L.sfx('liftOff');
    L.sfx('liftHover');
  }
  function phaseOf(f) {
    const t = now() - f.t0, T = f.T;
    const a = T.to, b = a + T.lift, c = b + T.carry, d = c + T.drop, e = d + T.back;
    if (t < a) return { t, phase: 'to', k: 0, alt: 0, a, b, c, d, e };
    if (t < b) return { t, phase: 'lift', k: 0, alt: ease((t - a) / T.lift), a, b, c, d, e };
    if (t < c) return { t, phase: 'carry', k: ease((t - b) / T.carry), alt: 1, a, b, c, d, e };
    if (t < d) return { t, phase: 'drop', k: 1, alt: 1 - ease((t - c) / T.drop), a, b, c, d, e };
    if (t < e) return { t, phase: 'back', k: 1, alt: 0, a, b, c, d, e };
    return { t, phase: 'done', k: 1, alt: 0, a, b, c, d, e };
  }

  function land(f) {
    const dx = f.x1 - f.s.x, dy = f.y1 - f.s.y;
    f.list.forEach(n => { n.x += dx; n.y += dy; });
    f.s.x = f.x1; f.s.y = f.y1;
    f.s.moved = true;
    f.landed = true;
    GG.sim.invalidate();
    landDust(f.s);
    L.sfx('liftLand');
    S.save(false);
  }

  const sway = new Map();
  let swayAt = 0;
  function washOf(f, st) {
    if (!st) return 0;
    if (st.phase === 'to') { const u = ease(st.t / f.T.to); return 0.6 * u * u; }
    if (st.phase === 'back') { const u = 1 - ease((st.t - st.d) / f.T.back); return 0.6 * u * u; }
    return st.phase === 'done' ? 0 : 1;
  }
  function swayStep(st) {
    const o = cfg().sway || {};
    if (!o.enabled) { sway.clear(); return; }

    const t = now(), real = Math.max(0, t - (swayAt || t)), dt = Math.min(0.25, real); swayAt = t;
    if (flight && st) {
      const f = flight, s = f.s;
      const ax = f.landed ? s.x : f.x0 + (f.x1 - f.x0) * st.k, ay = f.landed ? s.y : f.y0 + (f.y1 - f.y0) * st.k;
      let sp = sway.get(s.id);
      if (!sp) { sp = { s: s, x: ax, y: ay, z: 0, vx: 0, vy: 0, vz: 0, ax: ax, ay: ay, az: 0, wash: 0 }; sway.set(s.id, sp); }
      sp.nx = ax; sp.ny = ay; sp.nz = (o.lift || 0) * (f.landed ? 0 : st.alt); sp.nw = washOf(f, st) * (o.wash == null ? 1 : o.wash);
    }
    sway.forEach(function (sp, id) {
      if (!flight || flight.s !== sp.s) { sp.nx = sp.s.x; sp.ny = sp.s.y; sp.nz = 0; sp.nw = 0; }
      if (!dt) return;
      const w = o.follow || 9, z = o.damp == null ? 0.45 : o.damp;
      const va = { x: (sp.nx - sp.ax) / real, y: (sp.ny - sp.ay) / real };
      sp.ax = sp.nx; sp.ay = sp.ny; sp.az = sp.nz;
      const tx = sp.ax - va.x * (o.drag || 0), ty = sp.ay - va.y * (o.drag || 0);
      for (let n = Math.ceil(dt / 0.008), h = dt / n, i = 0; i < n; i++) {
        sp.vx += (w * w * (tx - sp.x) - 2 * z * w * sp.vx) * h; sp.x += sp.vx * h;
        sp.vy += (w * w * (ty - sp.y) - 2 * z * w * sp.vy) * h; sp.y += sp.vy * h;
        sp.vz += (w * w * (sp.az - sp.z) - 2 * z * w * sp.vz) * h; sp.z += sp.vz * h;
      }
      sp.wash += (sp.nw - sp.wash) * Math.min(1, dt * 5);

      const m = o.max || 30, ox = sp.x - sp.ax, oy = sp.y - sp.ay + (sp.az - sp.z), d = Math.hypot(ox, oy);
      const g = d > 1e-6 ? m * Math.tanh(d / m) / d : 1;
      sp.ox = ox * g; sp.oy = oy * g; sp.mag = d * g;
      if ((!flight || flight.s !== sp.s) && d < 0.05 && Math.hypot(sp.vx, sp.vy, sp.vz) < 0.05 && sp.wash < 0.01) sway.delete(id);
    });
  }

  L.swayOf = function (s) {
    const sp = sway.size ? sway.get(s.id) : null;
    return sp && sp.ox !== undefined ? { ox: sp.ox, oy: sp.oy, mag: sp.mag, wash: sp.wash, o: cfg().sway } : null;
  };
  L.step = function () {
    const st = flight ? phaseOf(flight) : null;
    swayStep(st);
    if (!flight) return null;
    if (!flight.hooked && st.phase !== 'to') { flight.hooked = true; L.sfx('liftHook'); }
    if (!flight.landed && (st.phase === 'back' || st.phase === 'done')) land(flight);
    if (st.phase === 'done') { flight = null; L.sfx('liftHover', false); return null; }
    return st;
  };

  L.drawShift = function (st) {
    if (!flight || flight.landed || !st) return null;
    const f = flight, x = f.x0 + (f.x1 - f.x0) * st.k, y = f.y0 + (f.y1 - f.y0) * st.k;
    const dx = x - f.s.x, dy = y - f.s.y;
    if (!dx && !dy) return null;
    f.s.x += dx; f.s.y += dy;
    f.list.forEach(n => { n.x += dx; n.y += dy; });
    return { dx, dy, f };
  };
  L.drawUnshift = function (sh) {
    if (!sh) return;
    sh.f.s.x -= sh.dx; sh.f.s.y -= sh.dy;
    sh.f.list.forEach(n => { n.x -= sh.dx; n.y -= sh.dy; });
  };
  function landDust(s) {
    const bx = boxOf(s);
    for (let i = 0; i < 26; i++) {
      const side = i % 4, f = Math.random();
      const x = side < 2 ? bx.x + f * bx.w : (side === 2 ? bx.x : bx.x + bx.w);
      const y = side >= 2 ? bx.y + f * bx.h : (side === 0 ? bx.y : bx.y + bx.h);
      const ang = Math.atan2(y - s.y, x - s.x), v = 30 + Math.random() * 50;
      dust.push({ x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, life: 0.7 + Math.random() * 0.4, age: 0, r: 4 + Math.random() * 6 });
    }
  }

  function hexA(hex, a) {
    const h = String(hex || '#7ee0c0').replace('#', ''), n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a.toFixed(3) + ')';
  }
  let lastT = 0;
  L.draw = function (st) {
    const t0 = now(), dt = Math.min(0.1, t0 - (lastT || t0)); lastT = t0;
    const card = L.cardHere();
    if (!picked && !ghost && !flight && !dust.length && !card) return;
    const cv = R.canvas, ctx = cv.getContext('2d'), dpr = cv.width / cv.clientWidth;
    const P = (x, y) => R.toScreen(x, y), k = P(1, 0).x - P(0, 0).x;
    ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const lc = (C.nodeTypes.groundLifter || {}).color || '#7ee0c0';
    if (picked) {
      const b = boxOf(picked), q = P(b.x, b.y);
      ctx.strokeStyle = lc; ctx.setLineDash([8, 6]); ctx.lineWidth = 2;
      ctx.strokeRect(q.x - 4, q.y - 4, b.w * k + 8, b.h * k + 8); ctx.setLineDash([]);
      place();
    }
    if (ghost) drawGhost(ctx, P, k);

    if (card && !(flight && flight.card === card)) {
      const ib = iconBox(card);
      drawBox(ctx, P, k, ib);
      drawDroneAt(ctx, P, k, ib.x + 14, ib.y + 14, PARK, null, false, t0);
    }
    if (flight && flight.card && flight.card.loc === S.g.loc) {
      if (st && st.phase !== 'back') {
        const f = flight, b = boxOf(f.s, f.x1, f.y1), q = P(b.x, b.y);
        ctx.strokeStyle = hexA((C.nodeTypes[f.s.type] || {}).color, 0.3 + 0.2 * Math.sin(t0 * 6));
        ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.roundRect(q.x, q.y, b.w * k, b.h * k, 14 * k); ctx.stroke(); ctx.setLineDash([]);
      }
      drawHome(ctx, P, k, flight.card);
      if (st) drawDrone(ctx, P, k, st, t0);
    }
    for (let i = dust.length - 1; i >= 0; i--) {
      const p = dust[i]; p.age += dt;
      if (p.age > p.life) { dust.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
      const q = P(p.x, p.y), a = 1 - p.age / p.life;
      ctx.fillStyle = 'rgba(160,150,130,' + (0.35 * a) + ')';
      ctx.beginPath(); ctx.arc(q.x, q.y, p.r * k * (1 + p.age), 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  };

  function drawGhost(ctx, P, k) {
    const s = ghost.s, t = C.nodeTypes[s.type] || {}, ok = ghost.ok, bad = '#e08a8a';
    const col = t.color || '#7ee0c0', b = boxOf(s, ghost.x, ghost.y), q = P(b.x, b.y);
    ctx.setLineDash([8, 6]); ctx.lineWidth = 2;
    ctx.fillStyle = ok ? hexA(col, 0.14) : 'rgba(220,110,110,0.14)'; ctx.strokeStyle = ok ? col : bad;
    ctx.beginPath(); ctx.roundRect(q.x, q.y, b.w * k, b.h * k, 14 * k); ctx.fill(); ctx.stroke();
    ghost.riders.forEach(function (m) {
      const mt = C.nodeTypes[m.type], z = S.sizeOf(m), mx = ghost.x + (m.x - s.x), my = ghost.y + (m.y - s.y);
      const mq = P(mx - z.w / 2, my - z.h / 2), mc = P(mx, my);
      ctx.fillStyle = ok ? hexA(mt.color, 0.14) : 'rgba(220,110,110,0.14)'; ctx.strokeStyle = ok ? mt.color : bad;
      ctx.beginPath(); ctx.roundRect(mq.x, mq.y, z.w * k, z.h * k, 12 * k); ctx.fill(); ctx.stroke();
      IC.drawIcon(ctx, mt.icon, mc.x, mc.y, 26 * k, ok ? C.iconColor(mt) : bad, 1.9);
    });
    ctx.setLineDash([]);
    const top = P(ghost.x, b.y + 22);
    IC.drawIcon(ctx, t.icon, top.x, top.y, 26 * k, ok ? col : bad, 1.9);
    const foot = P(ghost.x, b.y + b.h + 20);
    ctx.fillStyle = ok ? '#dff3e7' : '#f0c0c0';
    ctx.font = '600 ' + Math.max(9, 13 * k).toFixed(1) + 'px Inter, system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(ok ? GG.i18n.t(t.name || s.type) + '  ' + money(L.price(s)) : ghost.why, foot.x, foot.y);
    ctx.textAlign = 'left';
  }

  function iconBox(card) {
    const z = S.sizeOf(card);
    return { x: card.x - z.w / 2 + 13, y: card.y - z.h / 2 + 11, w: 28 };
  }
  function drawHome(ctx, P, k, card) {
    const ib = iconBox(card), q = P(ib.x, ib.y), w = ib.w * k;
    ctx.fillStyle = '#121a21'; ctx.beginPath(); ctx.roundRect(q.x - 1, q.y - 1, w + 2, w + 2, 8 * k); ctx.fill();
    ctx.fillStyle = 'rgba(126,224,192,.13)'; ctx.beginPath(); ctx.roundRect(q.x, q.y, w, w, 8 * k); ctx.fill();
    ctx.strokeStyle = 'rgba(126,224,192,.55)'; ctx.setLineDash([3, 3]); ctx.lineWidth = Math.max(1, 1.4 * k);
    ctx.beginPath(); ctx.arc(q.x + w / 2, q.y + w / 2, 8 * k, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
  }
  const PARK = 0.3, AIR = 2.2;
  function drawBox(ctx, P, k, ib) {
    const q = P(ib.x, ib.y), w = ib.w * k;
    ctx.fillStyle = '#121a21'; ctx.beginPath(); ctx.roundRect(q.x - 1, q.y - 1, w + 2, w + 2, 8 * k); ctx.fill();
    ctx.fillStyle = 'rgba(126,224,192,.13)'; ctx.beginPath(); ctx.roundRect(q.x, q.y, w, w, 8 * k); ctx.fill();
  }

  function drawDrone(ctx, P, k0, st, t0) {
    const f = flight, s = f.s, ib = iconBox(f.card), home = { x: ib.x + 14, y: ib.y + 14 };
    const gx = f.landed ? s.x : f.x0 + (f.x1 - f.x0) * st.k, gy = f.landed ? s.y : f.y0 + (f.y1 - f.y0) * st.k;
    let wx, wy, sz = AIR;
    if (st.phase === 'to') {
      const u = ease(st.t / f.T.to);
      wx = home.x + (f.x0 - home.x) * u; wy = home.y + (f.y0 - 30 - home.y) * u; sz = PARK + (AIR - PARK) * Math.min(1, u * 2.5);
    } else if (st.phase === 'back') {
      const u = ease((st.t - st.d) / f.T.back);
      wx = f.x1 + (home.x - f.x1) * u; wy = f.y1 - 30 + (home.y - (f.y1 - 30)) * u; sz = PARK + (AIR - PARK) * Math.min(1, (1 - u) * 2.5);
    } else { wx = gx; wy = gy - 30 - 26 * st.alt; }
    const hooked = st.phase === 'lift' || st.phase === 'carry' || st.phase === 'drop';
    drawDroneAt(ctx, P, k0, wx, wy, sz, hooked ? boxOf(s, gx, gy) : null, true, t0);
  }

  function drawDroneAt(ctx, P, k0, wx, wy, sz, cables, air, t0) {
    const k = k0 * sz, q = P(wx, wy);
    if (air) {
      const sh = P(wx + 60, wy + 130);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(sh.x, sh.y, 30 * k, 12 * k, 0, 0, 6.2832); ctx.fill();
    }
    if (cables) {
      const b = cables;
      ctx.strokeStyle = 'rgba(200,240,228,.75)'; ctx.lineWidth = Math.max(1, 1.6 * k);
      [[b.x + 14, b.y + 14], [b.x + b.w - 14, b.y + 14], [b.x + 14, b.y + b.h - 14], [b.x + b.w - 14, b.y + b.h - 14]].forEach(c => {
        const p = P(c[0], c[1]); ctx.beginPath(); ctx.moveTo(q.x, q.y + 6 * k); ctx.lineTo(p.x, p.y); ctx.stroke();
      });
    }
    const R4 = 34 * k, arms = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    ctx.strokeStyle = '#0a1016'; ctx.lineWidth = 7 * k;
    arms.forEach(d => { ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + d[0] * R4 * 0.75, q.y + d[1] * R4 * 0.75); ctx.stroke(); });
    ctx.strokeStyle = '#7ee0c0'; ctx.lineWidth = 3.5 * k;
    arms.forEach(d => { ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + d[0] * R4 * 0.75, q.y + d[1] * R4 * 0.75); ctx.stroke(); });
    arms.forEach(function (d, i) {
      const rx = q.x + d[0] * R4 * 0.75, ry = q.y + d[1] * R4 * 0.75;
      if (air) { ctx.fillStyle = 'rgba(180,240,225,.16)'; ctx.beginPath(); ctx.arc(rx, ry, 15 * k, 0, 6.2832); ctx.fill(); }
      ctx.strokeStyle = '#7ee0c0'; ctx.lineWidth = Math.max(1, 2.2 * k); ctx.beginPath(); ctx.arc(rx, ry, 13 * k, 0, 6.2832); ctx.stroke();
      const a = air ? t0 * 38 + i : 0.6 + i * 1.57;
      ctx.strokeStyle = 'rgba(220,255,245,.7)'; ctx.lineWidth = Math.max(1, 2 * k);
      ctx.beginPath(); ctx.moveTo(rx - Math.cos(a) * 14 * k, ry - Math.sin(a) * 14 * k); ctx.lineTo(rx + Math.cos(a) * 14 * k, ry + Math.sin(a) * 14 * k); ctx.stroke();
    });
    ctx.fillStyle = '#12201d'; ctx.strokeStyle = '#7ee0c0'; ctx.lineWidth = Math.max(1, 2 * k);
    ctx.beginPath(); ctx.roundRect(q.x - 14 * k, q.y - 11 * k, 28 * k, 22 * k, 6 * k); ctx.fill(); ctx.stroke();
    ctx.fillStyle = cables ? '#ffd166' : '#7ee0c0'; ctx.beginPath(); ctx.arc(q.x, q.y, 3.5 * k, 0, 6.2832); ctx.fill();
  }

  const core = R.draw;
  R.draw = function (time, ui) {
    const st = L.step(), sh = L.drawShift(st);

    R.lifted = sh && cfg().carryOnTop !== false ? { site: sh.f.s, ids: new Set(sh.f.list.map(n => n.id)) } : null;
    try { core(time, ui); } finally { R.lifted = null; L.drawUnshift(sh); }
    L.draw(st);
  };

  L.finishNow = function () { if (flight && !flight.landed) land(flight); if (flight) L.sfx('liftHover', false); flight = null; ghost = null; unpick(); };

  return L;
})();
