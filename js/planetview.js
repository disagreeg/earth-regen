(function (GG) {
  'use strict';
  const C = GG.config, S = GG.state;
  const PV = {};
  GG.planetView = PV;

  function cfg() { return (C.ui && C.ui.planetView) || {}; }

  PV.on = function () {
    const c = cfg();
    return !!(c.enabled && GG.menu && GG.menu.planetView === 'on' && GG.menu.earthSnapshot);
  };
  const T = function (k) { return GG.i18n.t(k); };
  const STAGES = function () { return (C.menu.earth && C.menu.earth.stages) || 10; };
  function stageNow() { return Math.max(1, Math.min(STAGES(), Math.round(S.progress() * (STAGES() - 1)) + 1)); }
  const share = function (s) { return (s - 1) / (STAGES() - 1); };
  function ease(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

  let pop = null, popUntil = 0, pending = null, view = null, rot = -0.3, snapCv = null, snapKey = '', lastPoll = 0;
  let arriving = null;

  function thumb(size, s) {
    const snap = GG.menu.earthSnapshot(size * 2, share(s), rot);
    const c = document.createElement('canvas');
    c.width = c.height = size * 2; c.style.width = c.style.height = size + 'px';
    if (snap) c.getContext('2d').drawImage(snap, 0, 0, size * 2, size * 2);
    return c;
  }
  function clearPop() { if (pop) pop.remove(); pop = null; }
  function showPop(from, to) {
    clearPop();
    pending = { from: from, to: to };
    const el = document.createElement('div');
    el.className = 'pv-card';
    el.appendChild(thumb(46, to));
    const t = document.createElement('div');
    t.innerHTML = '<div class="pv-card-h">' + T('pv.healing') + '</div><div class="pv-card-s">' +
      T('pv.stageFromTo').replace('%a', from).replace('%b', '<b>' + to + '</b>').replace('%n', STAGES()) + '</div>';
    el.appendChild(t);
    const b = document.createElement('button');
    b.className = 'pv-see'; b.textContent = T('pv.see');
    b.onclick = function () { PV.open(from, to); };
    el.appendChild(b);
    const x = document.createElement('div');
    x.className = 'pv-x'; x.textContent = '×'; x.onclick = clearPop;
    el.appendChild(x);
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('pv-in'); });
    popUntil = performance.now() + (cfg().popupSec || 15) * 1000;
    pop = el;
  }

  PV.isOpen = function () { return !!view; };

  PV.covering = function () { return !!(view && !(view.land && landT() > 0.66)); };
  function landT() { return view && view.land ? (performance.now() - view.land.t0) / 1000 / (cfg().landSec || 2.6) : 0; }

  PV.open = function (from, to) {
    if (view || !GG.menu.earthSnapshot) return;
    clearPop();
    to = to || stageNow(); from = from || to;
    const ov = document.createElement('div');
    ov.className = 'pv-view';
    const cv = document.createElement('canvas');
    ov.appendChild(cv);
    const cap = document.createElement('div'); cap.className = 'pv-cap'; ov.appendChild(cap);
    const tag = document.createElement('div'); tag.className = 'pv-tag'; tag.textContent = T('pv.prototype'); ov.appendChild(tag);
    const back = document.createElement('button'); back.className = 'pv-back'; back.textContent = T('pv.back');
    back.onclick = function () { PV.close(); };
    ov.appendChild(back);
    const hint = document.createElement('div'); hint.className = 'pv-hint'; hint.textContent = T('pv.hint'); ov.appendChild(hint);
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('pv-in'); });
    const min = Math.min(window.innerWidth, window.innerHeight);
    view = { ov: ov, cv: cv, ctx: cv.getContext('2d'), cap: cap, R: min * 0.36, from: from, to: to,
             t0: performance.now(), land: null, drag: null, hits: [], clock: 0 };
    cv.addEventListener('pointerdown', function (e) {
      if (!view) return;
      const p = hitPlace(e.clientX, e.clientY);
      if (p && !view.land) { landOn(p); return; }
      view.drag = { x: e.clientX, rot: rot }; cv.style.cursor = 'grabbing'; cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', function (e) {
      if (!view) return;
      if (view.drag && !view.land) { rot = view.drag.rot + (e.clientX - view.drag.x) / view.R * 1.1; view.lastMove = performance.now(); }
      cv.style.cursor = view.drag ? 'grabbing' : (hitPlace(e.clientX, e.clientY) ? 'pointer' : 'grab');
    });
    cv.addEventListener('pointerup', function () { if (view) { view.drag = null; cv.style.cursor = 'grab'; } });
    cv.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (!view || view.land) return;
      const m = Math.min(window.innerWidth, window.innerHeight);
      view.R = Math.max(m * 0.2, Math.min(m * (cfg().closest || 0.5), view.R * Math.pow(1.0015, -e.deltaY)));
      view.lastMove = performance.now();
    }, { passive: false });
  };
  PV.close = function () {
    if (!view) return;
    const ov = view.ov;
    ov.classList.remove('pv-in');
    setTimeout(function () { ov.remove(); }, 450);
    view = null;
  };

  function places() {
    const W = cfg().where || {};
    return C.locations.filter(function (L) { return W[L.id]; }).map(function (L) {
      return { L: L, open: S.locOpen(L), lon: W[L.id][0], lat: W[L.id][1] };
    }).filter(function (p) { return p.open || cfg().showLocked !== false; });
  }
  function hitPlace(x, y) {
    let best = null, bd = 22;
    (view ? view.hits : []).forEach(function (h) {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d < bd && h.p.open) { bd = d; best = h.p; }
    });
    return best;
  }
  function landOn(p) {
    const l = { p: p, t0: performance.now(), rot0: rot, rotT: -p.lon * Math.PI / 180, R0: view.R, done: false, puffs: null };
    while (l.rotT - l.rot0 > Math.PI) l.rotT -= 2 * Math.PI;
    while (l.rotT - l.rot0 < -Math.PI) l.rotT += 2 * Math.PI;

    const snap = GG.menu.earthSnapshot(1024, share(view.to), l.rotT, view.clock);
    const dc = document.createElement('canvas'); dc.width = dc.height = 1024;
    if (snap) dc.getContext('2d').drawImage(snap, 0, 0);
    l.dive = dc;
    view.land = l;
    view.cap.textContent = T('pv.landing').replace('%s', p.L.name.toUpperCase());
    snapKey = '';
  }
  function arrive(p) {
    const c = S.g.camera;
    S.goTo(p.L.id);
    const box = GG.render.contentBox ? GG.render.contentBox() : null;
    if (box) { c.x = box.cx; c.y = box.cy; }
    arriving = { t0: performance.now(), s0: 0.08, s1: Math.max(0.35, c.scale || 0.6) };
    c.scale = arriving.s0;
  }

  function draw(now) {
    const v = view, k = cfg(), dpr = window.devicePixelRatio || 1, w = window.innerWidth, h = window.innerHeight;
    if (v.cv.width !== Math.round(w * dpr) || v.cv.height !== Math.round(h * dpr)) {
      v.cv.width = Math.round(w * dpr); v.cv.height = Math.round(h * dpr);
    }
    const ctx = v.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const kk = ease((now - v.t0) / 1000 / (k.slideSec || 2.2)), sNow = v.from + (v.to - v.from) * kk;
    const dt = v.lastT ? Math.min(0.05, (now - v.lastT) / 1000) : 0; v.lastT = now;
    v.clock += dt * (k.cloudWind === undefined ? 8 : k.cloudWind);
    const spinning = (k.spinSec || 0) > 0 && !v.drag && !v.land;
    if (spinning) rot += dt * 2 * Math.PI / k.spinSec;
    let R = v.R, cx = w / 2, cy = h / 2 + 10, cloudA = 0, Tl = 0;
    if (!v.land) {
      v.cap.textContent = v.from !== v.to && kk < 1
        ? T('pv.healingCap').replace('%a', v.from).replace('%b', v.to)
        : T('pv.stageCap').replace('%a', Math.round(sNow)).replace('%n', STAGES());
    } else {

      Tl = landT();
      rot = v.land.rot0 + (v.land.rotT - v.land.rot0) * ease(Tl / 0.4);
      const q = GG.menu.earthProject(v.land.p.lon, v.land.p.lat, rot);
      const z = ease((Tl - 0.25) / 0.45);
      R = v.land.R0 * Math.pow(2.3, z);
      cx = w / 2 - q.x * R * z; cy = h / 2 + 10 - q.y * R * z;
      cloudA = ease((Tl - 0.38) / 0.28) * (1 - ease((Tl - 0.7) / 0.3));
      if (Tl > 0.66 && !v.land.done) { v.land.done = true; arrive(v.land.p); v.ov.classList.add('pv-clear'); v.cap.textContent = ''; }
      if (Tl >= 1) { v.ov.remove(); view = null; return; }
      if (v.land.done) { clouds(ctx, w, h, cloudA, Tl, v.land, v.to); return; }
    }

    const sQ = Math.round(sNow * 20) / 20;
    const moving = !!(v.drag || (kk < 1 && v.from !== v.to) || (now - (v.lastMove || 0) < 160) || (v.land && Tl < 0.4));
    const N = moving ? 512 : spinning ? 640 : Math.min(768, Math.max(256, Math.ceil(R * 2 * dpr / 256) * 256));
    if (v.land && Tl >= 0.4) { snapCv = v.land.dive; snapKey = 'dive'; v.paintRot = v.land.rotT; }
    else {
      const base = N + '|' + sQ, live = spinning || (k.cloudWind || 0) > 0;
      const due = base !== snapKey || (!spinning && rot !== v.paintRot) ||
                  (live && now - (v.lastPaint || 0) >= 1000 / (k.paintHz || 15));
      if (due) { snapCv = GG.menu.earthSnapshot(N, share(sQ), rot, v.clock); snapKey = base; v.lastPaint = now; v.paintRot = rot; }
    }
    const pRot = v.paintRot === undefined ? rot : v.paintRot;
    const air = sNow < 5 ? '179,149,90' : '121,194,255';
    const g = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.16);
    g.addColorStop(0, 'rgba(' + air + ',.45)'); g.addColorStop(1, 'rgba(' + air + ',0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.16, 0, Math.PI * 2); ctx.fill();
    if (snapCv) { ctx.imageSmoothingQuality = 'high'; ctx.drawImage(snapCv, cx - R, cy - R, R * 2, R * 2); }
    v.hits = [];
    if (!v.land || Tl < 0.35) places().forEach(function (p) {
      const q = GG.menu.earthProject(p.lon, p.lat, pRot);
      if (!q.front) return;
      const x = cx + q.x * R, y = cy + q.y * R, col = p.L.color || '#7ee0c0', a = p.open ? 1 : 0.35;
      v.hits.push({ x: x, y: y, p: p });
      ctx.globalAlpha = a;
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      if (p.open) {
        const pr = (now / 1400) % 1;
        ctx.globalAlpha = (1 - pr) * 0.6; ctx.beginPath(); ctx.arc(x, y, 7 + pr * 12, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = a;
      }
      if (k.names !== false) {
        ctx.font = '600 12px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const t = p.L.name + (p.open ? '' : '  (' + T('pv.notOpen') + ')');
        ctx.fillStyle = 'rgba(4,7,11,.7)'; ctx.fillRect(x + 12, y - 9, ctx.measureText(t).width + 10, 18);
        ctx.fillStyle = '#e6eef6'; ctx.fillText(t, x + 17, y);
      }
      ctx.globalAlpha = 1;
    });
    if (cloudA > 0) clouds(ctx, w, h, cloudA, Tl, v.land, v.to);
  }

  function clouds(ctx, w, h, a, Tl, land, to) {
    if (a <= 0) return;
    const s = share(to), col = s < 0.45 ? [196, 172, 128] : s < 0.75 ? [214, 214, 206] : [236, 243, 249];
    const rgba = function (al) { return 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + al + ')'; };
    ctx.fillStyle = rgba(a * 0.92); ctx.fillRect(0, 0, w, h);
    const p = Math.max(0, (Tl - 0.3) / 0.7), big = Math.max(w, h), small = Math.min(w, h);
    if (!land.puffs) {
      land.puffs = [];
      for (let i = 0; i < 34; i++) {
        land.puffs.push({ a: Math.random() * Math.PI * 2, d: Math.random() * 0.9, s: 0.35 + Math.random() * 0.65, sp: 0.8 + Math.random() * 0.8 });
      }
    }
    land.puffs.forEach(function (f) {
      const d = (f.d + p * f.sp * 1.4) * big * 0.55, r = f.s * small * (0.25 + p * 1.1);
      const x = w / 2 + Math.cos(f.a) * d, y = h / 2 + Math.sin(f.a) * d;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(a * 0.85)); g.addColorStop(1, rgba(0));
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });
  }

  PV.tick = function () {
    const now = performance.now();
    if (view) draw(now);
    if (arriving) {
      const t = ease((now - arriving.t0) / 1000 / 1.1), c = S.g.camera;
      c.scale = arriving.s0 * Math.pow(arriving.s1 / arriving.s0, t);
      if (t >= 1) arriving = null;
    }
    if (pop && now > popUntil) clearPop();
    if (!PV.on()) { if (pop) clearPop(); return; }
    if (now - lastPoll < 1000) return;
    lastPoll = now;

    const g = S.g, s = stageNow();
    if (g.pvSeen === undefined || g.pvSeen === null) { g.pvSeen = s; return; }
    if (s > g.pvSeen && !view && !pop) { showPop(g.pvSeen, s); g.pvSeen = s; }
    else if (s < g.pvSeen) g.pvSeen = s;
  };

  PV.test = function () {
    const s = stageNow();
    showPop(Math.max(1, s - 1), Math.max(2, s));
  };

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && view && !view.land) { e.stopImmediatePropagation(); e.preventDefault(); PV.close(); }
  }, true);
})(window.GG);
