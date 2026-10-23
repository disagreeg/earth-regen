(function (GG) {
  'use strict';
  const G = {};
  GG.guide = G;

  let C, S, el = null, busyUntil = 0, t0 = 0, lastSig = '';
  const cfg = () => (C.tutorial && C.tutorial.guide) || {};
  const on = () => !!(cfg().enabled);
  const T = k => GG.i18n.t(k);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  function init() {
    C = GG.config; S = GG.state;
    const mk = (tag, id, html) => { const e = document.createElement(tag); e.id = id; if (html) e.innerHTML = html; document.body.appendChild(e); return e; };
    el = {
      dim: mk('div', 'gd-dim'),
      trail: mk('canvas', 'gd-trail'),
      ghost: mk('div', 'gd-ghost'),
      ripple: mk('div', 'gd-ripple'),
      box: mk('div', 'gd-box'),
      hand: mk('div', 'gd-hand', HAND_SVG),
      wheel: mk('div', 'gd-wheel', WHEEL_SVG),
      mouse: mk('div', 'gd-mouse', MOUSE_SVG),
      caps: mk('div', 'gd-caps'),
    };

    window.addEventListener('pointerdown', function () {
      busyUntil = performance.now() + (((cfg().hand || {}).busySec) || 2.5) * 1000;
    }, true);
  }

  const HAND_SVG =
    '<svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M9 13V4.6a1.6 1.6 0 0 1 3.2 0V11 M12.2 10V8.9a1.6 1.6 0 0 1 3.2 0V11 M15.4 11V10.2a1.6 1.6 0 0 1 3.2 0V15a6.2 6.2 0 0 1-6.2 6.2h-1.3a5.4 5.4 0 0 1-4.3-2.2L4.1 15.3a1.6 1.6 0 0 1 2.5-2L9 15.6"' +
    ' fill="#0b1118" fill-opacity=".82" stroke="#eef6ff" stroke-width="1.8"/></svg>';
  const TIP = { x: 10.6 / 24 * 44, y: 3 / 24 * 44 };
  const WHEEL_SVG = '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#eef6ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="7" y="3" width="10" height="17" rx="5" fill="#0b1118" fill-opacity=".82"/><path d="M12 6.5v3.5"/><path d="M20 8l1.5-2 1.5 2 M20 15l1.5 2 1.5-2" stroke-width="1.4"/></svg>';
  const MOUSE_SVG = '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#eef6ff" stroke-width="1.6" stroke-linejoin="round">' +
    '<rect x="6" y="2.5" width="12" height="19" rx="6" fill="#0b1118" fill-opacity=".85"/>' +
    '<path class="rb" d="M12 2.5a6 6 0 0 1 6 6V10h-6z" fill="#ffb040" fill-opacity=".15" stroke="#ffb040"/><path d="M12 2.5V10H6"/></svg>';

  function z() { return GG.render.uiZoom ? GG.render.uiZoom() : 1; }
  function wv(wx, wy) {
    const st = document.getElementById('stage'), k = z();
    const sr = st.getBoundingClientRect(), p = GG.render.toScreen(wx, wy);
    return { x: (sr.left + p.x * k) / k, y: (sr.top + p.y * k) / k };
  }
  function elAt(sel) {
    const n = document.querySelector(sel);
    if (!n || !n.offsetParent) return null;
    const r = n.getBoundingClientRect(), k = z();
    return { x: (r.left + r.width / 2) / k, y: (r.top + r.height / 2) / k };
  }
  const nodeOf = type => S.machinesHere().find(n => n.type === type);
  const site = () => S.sitesHere()[0];
  function spots() {
    const s = site(); if (!s) return null;
    const b = S.siteBox(s);
    return { vol: { x: s.x - b.w / 2 - 170, y: s.y }, land: { x: s.x + b.w / 2 + 190, y: s.y } };
  }
  const touch = () => !!(GG.input && GG.input.touchUi && GG.input.touchUi());

  function cardEl() { return document.getElementById('tutor-card'); }

  function showing() {
    const card = cardEl();
    if (!card || card.classList.contains('hidden')) return null;
    if (GG.practice && GG.practice.active) return null;
    if (card.classList.contains('hint')) {
      const hs = GG.tutor.hintState && GG.tutor.hintState();
      const key = hs && hs.showing;
      if (!key) return null;
      const h = (C.tutorial.hintList || []).find(x => (x.node || x.id) === key);
      return h ? { kind: 'note', id: key, o: h } : null;
    }
    if (!GG.tutor.running || !GG.tutor.running()) return null;
    const st = C.tutorial.steps[S.g.tutorStep || 0];
    return st ? { kind: 'step', id: st.id, o: st, quiet: card.classList.contains('quiet') } : null;
  }

  function gestureFor(cur) {
    if (!cur) return null;
    if (cur.kind === 'note') return cfg().noteHands && (cfg().noHand || []).indexOf(cur.id) < 0 ? noteGesture(cur) : null;
    if (cur.quiet) return null;
    const st = cur.o, sp = spots(), s = site();
    const dock = t => elAt('.build-card[data-type="' + t + '"]');
    switch (st.id) {
      case 'look': {
        const k = z(), cv = GG.render.canvas.getBoundingClientRect();
        const tb = document.getElementById('topbar'), dk = document.getElementById('dock');
        const top = (tb ? tb.getBoundingClientRect().bottom : cv.top) / k, bot = (dk ? dk.getBoundingClientRect().top : cv.bottom) / k;
        const a = { x: cv.left / k + cv.width / k * 0.12, y: top + (bot - top) * 0.3 };
        return { kind: 'look', from: a, to: { x: a.x + 170, y: a.y } };
      }
      case 'sweep': {
        if (!s) return null;
        const b = S.siteBox(s);

        if (GG.input.dragSweep && GG.input.dragSweep())
          return { kind: 'zigzag', from: wv(s.x - b.w * 0.3, s.y - b.h * 0.25), to: wv(s.x + b.w * 0.3, s.y + b.h * 0.25), pressed: true };

        return { kind: 'cross', l: wv(s.x - b.w / 2, s.y - b.h * 0.32), r: wv(s.x + b.w / 2, s.y - b.h * 0.32),
                 bot: wv(s.x - b.w / 2, s.y + b.h * 0.32) };
      }
      case 'placeVolunteer': {
        const f = dock('player');
        if (!f) { const p = elAt('#tree-close'); return p && { kind: 'tap', at: p }; }
        return sp && { kind: 'drop', from: f, to: wv(sp.vol.x, sp.vol.y), type: 'player' };
      }
      case 'placeCleaner': {
        const f = dock('cleaner'), sl = s && S.freeSlot(s, s.x, s.y);
        return f && sl && { kind: 'drop', from: f, to: wv(sl.x, sl.y), type: 'cleaner' };
      }
      case 'inspect': { const n = nodeOf('cleaner'); return n && { kind: 'tap', at: wv(n.x, n.y) }; }
      case 'wireCrew': return wire('player', 'wf', 'cleaner', 'wf', C.resources.wf.color);
      case 'placeLandfill': { const f = dock('landfill'); return f && sp && { kind: 'drop', from: f, to: wv(sp.land.x, sp.land.y), type: 'landfill' }; }
      case 'wireTrash': return wire('cleaner', 'out', 'landfill', 'in', C.resources.trash.color);
      case 'placeMarket': { const f = dock('market'); return f && sp && { kind: 'drop', from: f, to: wv(sp.land.x, sp.land.y + 230), type: 'market' }; }
      case 'wireMarket': return wire('cleaner', 'out', 'market', 'in', C.resources.trash.color);
      case 'cutWire': {

        if (touch()) { const n = nodeOf('landfill'); if (!n) return null; const p = GG.render.portPos(n, 'in', 'in'); return { kind: 'tap', at: wv(p.x, p.y) }; }
        const l = S.g.links.find(k => { const a = S.node(k.from), b = S.node(k.to); return a && b && a.type === 'cleaner' && b.type === 'landfill'; })
               || S.g.links.find(k => { const a = S.node(k.from); return a && a.type === 'cleaner'; });
        if (!l) return null;
        const a = S.node(l.from), b = S.node(l.to), R = GG.render;
        const [p0, p1] = R.linkPts(l, a, b), sq = R.wireOrtho(l), pts = [];
        for (let j = 0; j <= 32; j++) { const w = R.wireAt(p0, p1, sq, j / 32); pts.push(wv(w.x, w.y)); }
        return { kind: 'cut', pts: pts, at: pts[16] };
      }
      case 'ciWhat': case 'done': return null;
    }

    for (const a of (GG.tutor.stepAnchor(st) || [])) {
      if (a.el) { const p = elAt(a.el); if (p) return { kind: 'tap', at: p }; }
      if (a.collect) { const n = nodeOf(a.collect), r = n && GG.render.collectRect(n); if (r) return { kind: 'tap', at: wv(r.x + r.w / 2, r.y + r.h / 2) }; }
      if (a.node) { const n = nodeOf(a.node); if (n) return { kind: 'tap', at: wv(n.x, n.y) }; }
    }
    return null;
  }
  function wire(fromType, fromPort, toType, toPort, color) {
    const a = nodeOf(fromType), b = nodeOf(toType); if (!a || !b) return null;
    const p = GG.render.portPos(a, 'out', fromPort), q = GG.render.portPos(b, 'in', toPort);
    return { kind: 'wire', from: wv(p.x, p.y), to: wv(q.x, q.y), color: color };
  }

  function nearMiddle(n) {
    const c = S.g.camera;
    return S.machinesHere().filter(m => S.freeStanding ? S.freeStanding(m) : true)
      .sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y)).slice(0, n);
  }

  const more = id => (cfg().morePics || []).indexOf(id) >= 0;
  const MAT_ORDER = ['steel', 'alu', 'lead', 'gold'];
  const byMat = (a, b) => MAT_ORDER.indexOf(a) - MAT_ORDER.indexOf(b);
  const rocksHere = rare => S.sitesHere().filter(n => n.type === 'meteorite' && !!n.rare === !!rare);
  function noteGestureMore(cur) {
    const id = cur.id;
    if (!more(id)) return null;
    if (id === 'codex2') { const p = elAt('#btn-codex'); return p && { kind: 'tap', at: p }; }
    if (id === 'goGreenhaven') {
      const b = elAt('#places .pl-btn[data-loc="greenhaven"]'); if (!b) return null;
      const i = (C.locations || []).findIndex(l => l.id === 'greenhaven');
      return { kind: 'travel', at: b, keys: touch() ? [] : [String(i + 1)] };
    }
    if (id === 'prismFit') {
      const from = elAt('#topbar .cur-block.prism');
      const m = nearMiddle(8).find(n => S.portsOf(n, 'out').some(p => (C.resources[p.res] || {}).flow === 'material'));
      return from && m && { kind: 'drop', from: from, to: wv(m.x, m.y), icon: 'prism', color: '#c99bff' };
    }
    if (id === 'rock2') {
      const r = rocksHere(false)[0] || rocksHere(true)[0], sl = r && S.freeSlot && S.freeSlot(r, r.x, r.y);
      const t = C.nodeTypes.oreDigger;
      const from = elAt('.build-card[data-type="oreDigger"]') || (t && elAt('.dock-sec[data-cat="' + t.category + '"]')) || elAt('#dock-toggle');
      return from && sl && { kind: 'drop', from: from, to: wv(sl.x, sl.y), type: 'oreDigger' };
    }
    if (id === 'manyWires') {
      if (touch()) return null;

      const ms = nearMiddle(14);
      for (const res of ['energy', 'wf', 'trash']) {
        for (const a of ms) {
          const op = S.portsOf(a, 'out').find(p => p.res === res); if (!op) continue;
          const tg = ms.filter(b => b !== a).map(b => ({ b: b, p: S.portsOf(b, 'in').find(q => (q.accepts || [q.res]).indexOf(res) >= 0) }))
            .filter(x => x.p).sort((x, y) => Math.hypot(x.b.x - a.x, x.b.y - a.y) - Math.hypot(y.b.x - a.x, y.b.y - a.y)).slice(0, 3);
          if (tg.length < 2) continue;
          const pp = (n, side, pid) => { const q = GG.render.portPos(n, side, pid); return wv(q.x, q.y); };
          return { kind: 'many', src: pp(a, 'out', op.id), tg: tg.map(x => pp(x.b, 'in', x.p.id)), color: (C.resources[res] || {}).color || '#eef6ff' };
        }
      }
      return null;
    }
    return null;
  }

  function layoutWire(nearCard) {
    const k = z(), cv = GG.render.canvas.getBoundingClientRect();
    const box = { l: cv.left / k, t: cv.top / k, r: cv.right / k, b: cv.bottom / k };
    const seen = (p, loose) => p.x > box.l + 30 && p.x < box.r - 30 && p.y > box.t + 60 && p.y < box.b - (loose ? 60 : 160);
    const card = cardEl(), cr = card && card.getBoundingClientRect();
    const cc = cr ? { x: (cr.left + cr.width / 2) / k, y: (cr.top + cr.height / 2) / k } : null;

    const under = p => cr && p.x > cr.left / k - 30 && p.x < cr.right / k + 30 && p.y > cr.top / k - 30 && p.y < cr.bottom / k + 30;
    const ms = nearMiddle(16), pp = (n, side, pid) => { const q = GG.render.portPos(n, side, pid); return wv(q.x, q.y); };

    let best = null;
    for (const loose of [false, true]) { if (best) break;
    for (const a of ms) for (const op of S.portsOf(a, 'out')) {
      const from = pp(a, 'out', op.id); if (!seen(from, loose) || (!loose && under(from))) continue;
      for (const b of ms) {
        if (b === a || b.x <= a.x + 60) continue;
        const ip = S.portsOf(b, 'in').find(q => (q.accepts || [q.res]).indexOf(op.res) >= 0); if (!ip) continue;
        const to = pp(b, 'in', ip.id); if (!seen(to, loose) || (!loose && under(to))) continue;
        const len = Math.hypot(to.x - from.x, to.y - from.y);
        if (len < 80 || (!loose && Math.abs(to.y - from.y) < 24)) continue;
        const plain = ['energy', 'wf', 'trash'].indexOf(op.res) >= 0 ? 0 : 400;
        const sc = (nearCard && cc ? Math.hypot(from.x - cc.x, from.y - cc.y) + len * 0.3 : len) + plain;
        if (!best || sc < best.sc) best = { sc: sc, from: from, to: to, res: op.res };
      }
    }
    }
    if (!best) return null;
    let lead = null;
    if (nearCard && cr) lead = { x: Math.max(cr.left / k, Math.min(cr.right / k, best.from.x)), y: Math.max(cr.top / k, Math.min(cr.bottom / k, best.from.y)) };
    return { kind: 'square', from: best.from, to: best.to, lead: lead, color: (C.resources[best.res] || {}).color };
  }
  function noteGesture(cur) {
    const g2 = noteGestureMore(cur);
    if (g2) return g2;
    switch (cur.id) {
      case 'group3': if (!more('group3')) return null;

      case 'group2': {
        if (touch()) return null;
        const ms = nearMiddle(3); if (ms.length < 2) return null;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        ms.forEach(m => { const sz = S.sizeOf(m); x0 = Math.min(x0, m.x - sz.w / 2); y0 = Math.min(y0, m.y - sz.h / 2); x1 = Math.max(x1, m.x + sz.w / 2); y1 = Math.max(y1, m.y + sz.h / 2); });
        return { kind: 'box', from: wv(x0 - 40, y0 - 40), to: wv(x1 + 40, y1 + 40) };
      }
      case 'layout2': {
        if (touch()) return null;
        const how = cfg().layoutHand || 'under';
        if (how !== 'under') { const w = layoutWire(how === 'card'); if (w) return w; }
        const ms = nearMiddle(2).sort((a, b) => a.x - b.x); if (ms.length < 2) return null;
        const sa = S.sizeOf(ms[0]), sb = S.sizeOf(ms[1]);
        return { kind: 'square', from: wv(ms[0].x + sa.w / 2, ms[0].y + sa.h / 2 + 40), to: wv(ms[1].x - sb.w / 2, ms[1].y + sb.h / 2 + 40) };
      }
      case 'travel2': { const b = elAt('#places .pl-btn:not(.on)'); return b && { kind: 'travel', at: b }; }
      case 'relocate2': return { kind: 'presses' };
    }
    return null;
  }

  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const seg = (u, a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));
  function put(e, p, ox, oy, op, sc) {
    e.style.opacity = op;
    e.style.transform = 'translate(' + (p.x - ox) + 'px,' + (p.y - oy) + 'px)' + (sc ? ' scale(' + sc + ')' : '');
  }
  function hideAll() {
    ['hand', 'ghost', 'ripple', 'wheel', 'mouse', 'box', 'caps'].forEach(k => { el[k].style.opacity = 0; });
    const cx = el.trail.getContext('2d'); cx.clearRect(0, 0, el.trail.width, el.trail.height);
  }
  function caps(p, list, down, op) {
    const sig = list.join('|');
    if (el.caps.dataset.sig !== sig) { el.caps.innerHTML = list.map(k => '<span class="gd-cap">' + esc(k) + '</span>').join(''); el.caps.dataset.sig = sig; }
    el.caps.querySelectorAll('.gd-cap').forEach((c, i) => c.classList.toggle('down', !!(down && down[i])));
    put(el.caps, p, 0, 0, op);
  }
  function tap(u, at, fade) {
    const p = lerp({ x: at.x + 50, y: at.y + 60 }, at, ease(seg(u, 0.05, 0.4)));
    const press = seg(u, 0.4, 0.5) - seg(u, 0.5, 0.6);
    put(el.hand, p, TIP.x, TIP.y, fade, 1 - 0.12 * press);
    const r = seg(u, 0.45, 0.85);
    if (r > 0 && r < 1) { const d = 10 + 40 * r; el.ripple.style.width = el.ripple.style.height = d + 'px'; put(el.ripple, at, d / 2, d / 2, 1 - r); }
  }
  const DUR = { tap: 1300, drop: 2200, wire: 2000, zigzag: 2600, cross: 3000, look: 3000, cut: 2400, box: 3400, square: 3000, travel: 3000, presses: 4200, many: 5600 };

  function drawHand(g, now) {
    const H = cfg().hand || {};
    const k = z();
    el.trail.width = window.innerWidth / k; el.trail.height = window.innerHeight / k;
    const cx = el.trail.getContext('2d'); cx.clearRect(0, 0, el.trail.width, el.trail.height);
    const sig = (S.g.tutorStep || 0) + '|' + g.kind + '|' + ((showing() || {}).id);
    if (sig !== lastSig) { lastSig = sig; t0 = now; }
    if (g.kind === 'cut') glowWire(cx, g.pts, now);
    const dur = DUR[g.kind] / (H.speed || 1), pause = (H.pauseSec === undefined ? 0.8 : H.pauseSec) * 1000;
    const u = ((now - t0) % (dur + pause)) / dur;
    ['ghost', 'ripple', 'wheel', 'mouse', 'box', 'caps'].forEach(k2 => { el[k2].style.opacity = 0; });
    if (g.kind === 'presses') { el.hand.style.opacity = 0; presses(u); return; }
    if (u > 1) { el.hand.style.opacity = 0; return; }
    const fade = Math.min(seg(u, 0, 0.12), 1 - seg(u, 0.88, 1));

    if (g.kind === 'tap') { tap(u, g.at, fade); return; }
    if (g.kind === 'cut') {
      const p = lerp({ x: g.at.x + 60, y: g.at.y + 70 }, g.at, ease(seg(u, 0.05, 0.4)));
      const press = seg(u, 0.42, 0.5) - seg(u, 0.6, 0.68);
      put(el.hand, p, TIP.x, TIP.y, fade, 1 - 0.12 * press);
      put(el.mouse, { x: g.at.x + 34, y: g.at.y - 34 }, 17, 17, Math.min(fade, seg(u, 0.25, 0.4)));
      el.mouse.querySelector('.rb').setAttribute('fill-opacity', press > 0.3 ? '1' : '.15');
      const r = seg(u, 0.5, 0.85);
      if (r > 0 && r < 1) {
        cx.save(); cx.globalAlpha = 1 - r; cx.strokeStyle = '#ff6b5e'; cx.lineWidth = 3; cx.lineCap = 'round';
        const sz = 8 + 10 * r; cx.beginPath();
        cx.moveTo(g.at.x - sz, g.at.y - sz); cx.lineTo(g.at.x + sz, g.at.y + sz); cx.moveTo(g.at.x + sz, g.at.y - sz); cx.lineTo(g.at.x - sz, g.at.y + sz);
        cx.stroke(); cx.restore();
      }
      return;
    }
    if (g.kind === 'zigzag') {
      const m = seg(u, 0.12, 0.88), passes = 3;
      const at = mm => ({ x: g.from.x + (g.to.x - g.from.x) * (0.5 - 0.5 * Math.cos(mm * Math.PI * passes)), y: g.from.y + (g.to.y - g.from.y) * mm });
      const p = at(m);
      if (g.pressed) {
        put(el.hand, p, TIP.x, TIP.y, fade, 0.88);
        cx.save(); cx.globalAlpha = fade * 0.55; cx.strokeStyle = '#eef6ff'; cx.lineWidth = 3; cx.lineCap = 'round'; cx.beginPath();
        const m0 = Math.max(0, m - 0.25);
        for (let j = 0; j <= 40; j++) { const q = at(m0 + (m - m0) * j / 40); j ? cx.lineTo(q.x, q.y) : cx.moveTo(q.x, q.y); }
        cx.stroke(); cx.restore();
      } else put(el.hand, p, TIP.x, TIP.y, fade);
      return;
    }
    if (g.kind === 'cross') {

      const X = cfg().hand || {}, n = X.crossings || 3, reach = X.crossReach || 55;
      const m = seg(u, 0.1, 0.9), ph = m * n;
      const k = ph % 1, dir = Math.floor(ph) % 2 ? -1 : 1, e = 0.5 - 0.5 * Math.cos(Math.min(k, 1) * Math.PI);
      const x0 = g.l.x - reach, x1 = g.r.x + reach, ax = dir > 0 ? x0 + (x1 - x0) * e : x1 - (x1 - x0) * e;
      const y = g.l.y + (g.bot.y - g.l.y) * m;
      put(el.hand, { x: ax, y: y }, TIP.x, TIP.y, fade);
      cx.save(); cx.globalAlpha = fade * 0.75; cx.strokeStyle = '#eef6ff'; cx.lineWidth = 2; cx.setLineDash([5, 6]);
      cx.lineDashOffset = -now / 50; cx.shadowColor = '#eef6ff'; cx.shadowBlur = 8; cx.beginPath();
      [g.l.x, g.r.x].forEach(ex => { cx.moveTo(ex, g.l.y - 20); cx.lineTo(ex, g.bot.y + 20); });
      cx.stroke(); cx.restore();

      const inX = dir > 0 ? g.l.x : g.r.x, inE = (inX - (dir > 0 ? x0 : x1)) / ((x1 - x0) * dir);
      const tIn = Math.acos(1 - 2 * Math.max(0, Math.min(1, inE))) / Math.PI;
      const r = seg(k, tIn, tIn + 0.3);
      if (m > 0 && m < 1 && r > 0 && r < 1) {
        const d = 10 + 34 * r, yIn = g.l.y + (g.bot.y - g.l.y) * ((Math.floor(ph) + tIn) / n);
        el.ripple.style.width = el.ripple.style.height = d + 'px'; put(el.ripple, { x: inX, y: yIn }, d / 2, d / 2, 1 - r);
      } else el.ripple.style.opacity = 0;
      return;
    }
    if (g.kind === 'look') {
      if (u < 0.6 || touch()) {
        const uu = touch() ? u : u / 0.6, f2 = Math.min(seg(uu, 0, 0.15), 1 - seg(uu, 0.85, 1));
        const press = seg(uu, 0.15, 0.22) - seg(uu, 0.75, 0.82);
        const p = lerp(g.from, g.to, ease(seg(uu, 0.22, 0.75)));
        put(el.hand, p, TIP.x, TIP.y, f2, 1 - 0.12 * press);
        if (press > 0.5) { cx.save(); cx.setLineDash([4, 6]); cx.strokeStyle = 'rgba(238,246,255,.45)'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(g.from.x, g.from.y); cx.lineTo(p.x, p.y); cx.stroke(); cx.restore(); }
      } else {
        el.hand.style.opacity = 0;
        const uu = (u - 0.6) / 0.4, f2 = Math.min(seg(uu, 0, 0.15), 1 - seg(uu, 0.85, 1));
        put(el.wheel, { x: g.to.x, y: g.to.y + Math.sin(uu * Math.PI * 4) * 5 }, 17, 17, f2);
      }
      return;
    }
    if (g.kind === 'box') {

      const drag = ease(seg(u, 0.12, 0.6)), held = seg(u, 0.08, 0.12) - seg(u, 0.64, 0.7);
      const p = lerp(g.from, g.to, drag);
      put(el.hand, p, TIP.x, TIP.y, fade, 1 - 0.12 * held);
      if (u > 0.1 && u < 0.72) { el.box.style.width = Math.abs(p.x - g.from.x) + 'px'; el.box.style.height = Math.abs(p.y - g.from.y) + 'px'; put(el.box, g.from, 0, 0, 1); }
      caps({ x: p.x + 26, y: p.y + 30 }, ['Shift'], [held > 0.5], Math.min(fade, 1 - seg(u, 0.7, 0.76)));
      if (u > 0.74) {
        const v = ease(seg(u, 0.78, 0.94)), off = 60 * v;
        cx.save(); cx.globalAlpha = 0.8; cx.setLineDash([6, 5]); cx.strokeStyle = '#f2c46a'; cx.lineWidth = 1.5;
        cx.strokeRect(g.from.x + off, g.from.y, g.to.x - g.from.x, g.to.y - g.from.y); cx.restore();
        put(el.hand, { x: (g.from.x + g.to.x) / 2 + off, y: (g.from.y + g.to.y) / 2 }, TIP.x, TIP.y, fade, 0.88);
      }
      return;
    }
    if (g.kind === 'square') {

      const m = ease(seg(u, 0.12, 0.8)), mx = (g.from.x + g.to.x) / 2;

      const p = g.lead && u < 0.12 ? lerp(g.lead, g.from, ease(seg(u, 0, 0.11))) : lerp(g.from, g.to, m);
      put(el.hand, p, TIP.x, TIP.y, g.lead ? Math.min(1, 1 - seg(u, 0.88, 1)) : fade, 0.88);
      caps({ x: p.x + 26, y: p.y + 30 }, ['Ctrl'], [true], fade);
      cx.save(); cx.strokeStyle = g.color || C.resources.wf.color; cx.lineWidth = 3; cx.lineCap = 'round'; cx.lineJoin = 'round';
      cx.shadowColor = cx.strokeStyle; cx.shadowBlur = 8; cx.globalAlpha = fade; cx.beginPath(); cx.moveTo(g.from.x, g.from.y);
      const e = g.lead && u < 0.12 ? g.from : p;
      if (e.x < mx) cx.lineTo(e.x, g.from.y); else { cx.lineTo(mx, g.from.y); cx.lineTo(mx, e.y); cx.lineTo(e.x, e.y); }
      cx.stroke(); cx.restore();
      return;
    }
    if (g.kind === 'travel') {
      if (u < 0.55) { tap(seg(u, 0, 0.55), g.at, fade); return; }
      el.hand.style.opacity = 0;
      const v = seg(u, 0.55, 1), ks = g.keys || ['1', '2'];
      if (!ks.length) return;
      caps({ x: g.at.x - 13 * ks.length, y: g.at.y + 34 }, ks, ks.length === 1 ? [v > 0.2 && v < 0.6] : [v > 0.15 && v < 0.4, v > 0.55 && v < 0.8],
           Math.min(seg(v, 0, 0.1), 1 - seg(v, 0.9, 1)));
      return;
    }
    if (g.kind === 'many') {

      const T = [0.12, 0.38, 0.58, 0.78], tg = g.tg, last = tg.length;
      let p;
      if (u < T[0]) p = lerp({ x: g.src.x + 40, y: g.src.y + 50 }, g.src, ease(seg(u, 0, T[0])));
      else if (u < T[1]) p = lerp(g.src, tg[0], ease(seg(u, T[0] + 0.02, T[1])));
      else if (u < T[2] || last < 3) p = lerp(tg[0], tg[1], ease(seg(u, T[1] + 0.03, T[2])));
      else p = lerp(tg[1], tg[2], ease(seg(u, T[2] + 0.03, T[3])));
      put(el.hand, p, TIP.x, TIP.y, fade, 0.9);
      for (let i = 0; i < last; i++) if (u > T[i + 1]) curve(cx, g.src, tg[i], g.color, i === last - 1 ? 1 - seg(u, 0.95, 1) : 1);
      if (u > T[0] && u < T[last]) {
        cx.save(); cx.setLineDash(u > T[1] ? [7, 7] : []); curve(cx, g.src, p, g.color, 0.9); cx.restore();
      }
      for (let i = 0; i < last; i++) {
        const r = seg(u, T[i + 1] - 0.02, T[i + 1] + 0.08);
        if (r > 0 && r < 1) { const d = 10 + 40 * r; el.ripple.style.width = el.ripple.style.height = d + 'px'; put(el.ripple, tg[i], d / 2, d / 2, 1 - r); }
      }
      if (u < T[1] + 0.04) caps({ x: p.x + 26, y: p.y + 30 }, ['Shift'], [u > T[1] - 0.05], fade);
      else if (u > T[last] + 0.04) caps({ x: p.x + 26, y: p.y + 30 }, ['Esc'], [u > T[last] + 0.08 && u < T[last] + 0.16], fade);
      return;
    }

    const press = seg(u, 0.12, 0.2) - seg(u, 0.78, 0.86);
    const p = lerp(g.from, g.to, ease(seg(u, 0.2, 0.78)));
    put(el.hand, p, TIP.x, TIP.y, fade, 1 - 0.12 * press);
    if (g.kind === 'wire') {
      if (u > 0.15) curve(cx, g.from, u < 0.86 ? p : g.to, g.color, u < 0.86 ? 1 : 1 - seg(u, 0.86, 1));
    } else {

      const t = g.type ? C.nodeTypes[g.type] : { icon: g.icon, color: g.color }, gk = g.type || ('ic:' + g.icon);
      if (el.ghost.dataset.type !== gk) { el.ghost.innerHTML = GG.icons.svg(t.icon, 26, t.color); el.ghost.dataset.type = gk; el.ghost.style.borderColor = t.color; }
      if (u > 0.15) put(el.ghost, p, 23, 41, u < 0.86 ? 0.95 : 1 - seg(u, 0.86, 1));
      const r = seg(u, 0.8, 1);
      if (r > 0 && r < 1) { const d = 30 + 50 * r; el.ripple.style.width = el.ripple.style.height = d + 'px'; put(el.ripple, g.to, d / 2, d / 2, 1 - r); }
    }
  }
  function curve(cx, a, b, col, op) {
    const dx = Math.max(40, Math.abs(b.x - a.x) * 0.5);
    cx.save(); cx.globalAlpha = op; cx.lineCap = 'round';
    cx.strokeStyle = col; cx.lineWidth = 3; cx.shadowColor = col; cx.shadowBlur = 8;
    cx.beginPath(); cx.moveTo(a.x, a.y); cx.bezierCurveTo(a.x + dx, a.y, b.x - dx, b.y, b.x, b.y); cx.stroke();
    cx.restore();
  }
  function glowWire(cx, pts, now) {
    const k = 0.5 + 0.5 * Math.sin(now / 260);
    cx.save(); cx.lineCap = 'round'; cx.lineJoin = 'round';
    const path = () => { cx.beginPath(); pts.forEach((q, j) => j ? cx.lineTo(q.x, q.y) : cx.moveTo(q.x, q.y)); };
    path(); cx.strokeStyle = 'rgba(255,176,64,' + (0.25 + 0.3 * k).toFixed(3) + ')'; cx.lineWidth = 14 + 6 * k;
    cx.shadowColor = '#ffb040'; cx.shadowBlur = 18; cx.stroke();
    path(); cx.shadowBlur = 0; cx.strokeStyle = '#ffe1a8'; cx.lineWidth = 2.5; cx.setLineDash([7, 9]); cx.lineDashOffset = -now / 40; cx.stroke();
    cx.restore();
  }

  function presses(u) {
    const els = document.querySelectorAll('#tutor-card .gd-mv .gd-btn, #tutor-card .gd-mv .gd-rk');
    const at = [[0.08, 0.2], [0.3, 0.42], [0.55, 0.67], [0.77, 0.89]];
    els.forEach((e, i) => { const w = at[i]; e.classList.toggle('down', !!w && u > w[0] && u < w[1]); });
  }

  const chip = (col, label) => '<span class="gd-chip" style="--c:' + col + '"><i></i>' + esc(label) + '</span>';
  const ichip = (icon, col, label) => '<span class="gd-chip gd-ichip" style="--c:' + col + '">' + GG.icons.svg(icon, 16, col, 1.6) + esc(label) + '</span>';
  const CUR_ICON = { ci: 'ci', money: 'coin', diamond: 'diamond' };
  const arrow = '<span class="gd-ar">&rarr;</span>';

  function stepStrip(id) {
    const R = C.resources, K = C.currencies, N = C.nodeTypes;
    const it = (icon, col, label) => '<span class="gd-it">' + GG.icons.svg(icon, 26, col) + '<span>' + esc(label) + '</span></span>';
    if (id === 'ciWhat') {

      const ms = (cfg().ciMachines || []).map(m => N[m]).filter(Boolean);
      return '<div class="gd-strip">' + it('ci', K.ci.color, T('gd.yourScore')) + '<span class="gd-ar">&rarr;</span>' +
        '<span class="gd-it"><span class="gd-three">' + ms.map((t, i) => '<span class="gd-mi" style="--c:' + t.color +
        ';animation-delay:' + (0.35 + i * 0.45).toFixed(2) + 's">' + GG.icons.svg(t.icon, 18, t.color) + '</span>').join('') +
        '</span><span>' + esc(T('gd.newMachines')) + '</span></span></div>';
    }
    const rows = {
      placeLandfill: [['bag', R.trash.color, R.trash.name], [N.landfill.icon, N.landfill.color, N.landfill.name], ['ci', K.ci.color, K.ci.name]],
      placeMarket:   [['bag', R.trash.color, R.trash.name], [N.market.icon, N.market.color, N.market.name], ['coin', K.money.color, K.money.name]],
    };
    const row = rows[id];
    return row ? '<div class="gd-strip">' + row.map(r => it(r[0], r[1], r[2])).join('<span class="gd-ar">&rarr;</span>') + '</div>' : '';
  }

  function noteRow(cur) {
    const NR = cfg().noteRows || {};
    if (!NR.enabled) return '';
    const h = cur.o;
    if (cur.id === 'relocate2') {

      const btn = t => '<span class="gd-btn">' + esc(t) + '</span>', cap = t => '<span class="gd-cap gd-rk">' + t + '</span>';
      const or = touch() ? '' : '<span class="gd-or">' + esc(T('gd.or')) + '</span>';
      const loc = (C.locations || []).find(l => l.id === 'greenhaven');
      return '<div class="gd-row gd-mv"><span class="gd-pair">' + btn(T('ui.moveTo')) + (touch() ? '' : or + cap('M')) + '</span>' + arrow +
        '<span class="gd-pair">' + btn(loc ? loc.name : 'Greenhaven') + (touch() ? '' : or + cap('2')) + '</span></div>' +
        (h.rowTail ? '<p class="gd-foot">' + esc(h.rowTail) + '</p>' : '');
    }
    if (cur.id === 'overlays') return overlayChips();
    const extraPic = morePicture(cur.id);
    if (extraPic) return extraPic;
    if (!h.node || (NR.noRow || []).indexOf(h.node) >= 0) return '';
    const id = h.node, t = C.nodeTypes[id]; if (!t) return '';
    const P = t.ports || {}, pu = t.powerUp && t.powerUp.port, relabel = (NR.portLabel || {})[id] || {};

    const side = list => {
      const seen = {}, order = [];
      (list || []).filter(p => !p.requires && p.id !== pu).forEach(p => {
        const r = C.resources[p.res] || C.currencies[p.res] || {};
        const label = relabel[p.id] ? T(relabel[p.id]) : ((p.label || r.name || p.res) + (p.lane ? ' ' + p.lane.toUpperCase() : ''));
        if (!seen[label]) { seen[label] = { col: r.color || '#9fb0c2', n: 0 }; order.push(label); }
        seen[label].n++;
      });
      return order.map(l => chip(seen[l].col, l + (seen[l].n > 1 ? ' x' + seen[l].n : '')));
    };
    const ins = side(P.in);
    let outs = side(P.out);
    (t.virtualOut || []).forEach(v => {
      const o = (NR.outAs || {})[id], cur2 = C.currencies[v.cur] || {};
      outs.push(o ? ichip(o.icon, o.color, T(o.label)) : ichip(CUR_ICON[v.cur] || 'ci', cur2.color || '#9fb0c2', v.label));
    });
    const xo = (NR.extraOut || {})[id];
    if (xo) outs.push(ichip(xo.icon, xo.color, T(xo.label)));
    if ((NR.forGood || []).indexOf(id) >= 0) outs = outs.map(c => '<span class="gd-permw"><b class="gd-perm">&infin; ' + esc(T('gd.forGood')) + '</b>' + c + '</span>');
    const ground = (NR.onSite || {})[id] && C.nodeTypes[NR.onSite[id]];
    const tag = ground ? '<b class="gd-site">' + GG.icons.svg(ground.icon, 11, ground.color) + esc(T('gd.onSite').replace('%s', ground.name)) + '</b>' : '';
    const mid = '<span class="gd-mach" style="--c:' + t.color + '">' + GG.icons.svg(t.icon, 24, t.color) + '<em>' + esc(t.name) + '</em>' + tag + '</span>';
    const col = a => '<span class="gd-col">' + a.join('') + '</span>';
    let html;
    if (id === 'rubbleSorter' && (NR.rubbleSplit || {}).enabled) return rubbleRow(t, mid);
    if (t.splitter && id === 'powerSplitter') {
      const out = k => '<span class="gd-split"><span class="gd-chip" style="--c:' + C.resources.energy.color + '"><i></i>' + esc(P.out.find(p => p.id === k).label) +
        '</span><b class="gd-rn" data-k="' + k + '">1</b><span class="gd-rb"><i data-k="' + k + '"></i></span></span>';
      html = '<div class="gd-row">' + col(ins) + arrow + mid + arrow + '<span class="gd-col">' + out('a') + out('b') + '</span></div>';
    } else {
      html = '<div class="gd-row">' + (ins.length ? col(ins) + arrow : '') + mid + (outs.length ? arrow + col(outs) : '') + '</div>';
    }
    if (h.extra) html += '<p class="gd-foot gd-hl">' + esc(h.extra) + '</p>';

    if (NR.crewLine && t.autoCollect && t.collect)
      html += '<p class="gd-foot gd-hl">' + esc(T(t.collect.cur === 'ci' ? 'gd.crewBurn' : 'gd.crewTill')) + '</p>';
    return html;
  }

  function rubbleRow(t, mid) {
    const R = C.resources, nm = k => (R[k] || {}).name || k;
    const bar = (k, res) => '<span class="gd-split gd-rsp">' + chip((R[res] || {}).color || '#9fb0c2', nm(res)) +
      '<span class="gd-rbl"><i data-k="' + k + '" style="background:' + ((R[res] || {}).color || '#9fb0c2') + '"></i></span></span>';
    return '<div class="gd-moment"></div><div class="gd-row"><span class="gd-col">' + chip(R.heavy.color, nm('heavy')) +
      bar('wf', 'wf') + bar('kw', 'energy') + '</span>' + arrow + mid + arrow +
      '<span class="gd-col">' + bar('glass', 'glass') + bar('agg', 'aggregate') + '</span></div>';
  }
  function rubbleAnim(now) {
    const card = cardEl(), bars = card ? card.querySelectorAll('.gd-rbl i') : [];
    if (!bars.length) return;
    const RS = (cfg().noteRows || {}).rubbleSplit || {}, Sim = GG.sim;
    const wpk = Sim.stat('rubbleSorter', 'wfPerKg'), epk = Sim.stat('rubbleSorter', 'energyPerKg');

    const M = [['gd.crewOnly', 2 * wpk, 0], ['gd.crewPower', wpk, epk], ['gd.powerOnly', 0, 2 * epk]];
    const per = (RS.momentSec || 1.7) * 1000, i = Math.floor(now / per) % M.length, p = Math.min(1, (now % per) / ((RS.fillSec || 0.7) * 1000));
    const m = M[i], r = Sim.rubbleSplit(m[1], m[2], 1), glass = r.worked * r.glass;
    const to = { wf: m[1] / (2 * wpk), kw: m[2] / (2 * epk), glass: glass, agg: r.worked - glass }, e = 1 - Math.pow(1 - p, 3);
    const lab = card.querySelector('.gd-moment'); if (lab && lab.dataset.k !== m[0]) { lab.dataset.k = m[0]; lab.textContent = T(m[0]); }
    bars.forEach(b => { b.style.width = (100 * e * Math.max(0, Math.min(1, to[b.dataset.k] || 0))) + '%'; });
  }

  function morePicture(id) {
    if (!more(id)) return '';
    const R = C.resources, N = C.nodeTypes, ar = '<span class="gd-ar">&rarr;</span>';
    const it = (icon, col, label) => '<span class="gd-it">' + GG.icons.svg(icon, 26, col) + '<span>' + esc(label) + '</span></span>';
    if (id === 'codex2') {

      const tabs = [['site', 'cx.machines'], ['materials', 'cx.materials'], ['storm', 'cx.weather'], ['boost', 'ui.cxBoosts'], ['help', 'cx.controls']];

      return '<div class="gd-ovchips gd-cxchips">' + tabs.map(t => '<span class="gd-ovc">' + GG.icons.svg(t[0], 16, '#9fc6ff') + T(t[1]) + '</span>').join('') + '</div>';
    }
    if (id === 'manyWires') {
      if (touch()) return '';
      return '<div class="gd-row gd-seq"><span class="gd-cap">Shift</span><span class="gd-w">' + esc(T('gd.letGo')) + '</span>' + ar +
        '<span class="gd-w">' + esc(T('gd.click')) + '</span>' + ar + '<span class="gd-w">' + esc(T('gd.click')) + '</span>' + ar + '<span class="gd-cap">Esc</span></div>';
    }
    if (id === 'prismFit') {
      const m = N.recycler, pr = (C.currencies || {}).prism || {};
      return '<div class="gd-strip gd-prism">' + it('prism', '#c99bff', pr.name || 'Prism') + ar +
        '<span class="gd-it"><span class="gd-slots"><i></i><i></i></span><span>' + esc(T('gd.slots')) + '</span></span>' + ar +
        '<span class="gd-it gd-works">' + GG.icons.svg(m.icon, 26, m.color) + '<span>' + esc(T('gd.worksFull')) + '</span></span></div>';
    }
    if (id === 'rock2') {
      const d = N.oreDigger, mt = N.meteorite; if (!d || !mt) return '';
      const rock = rocksHere(false)[0], mix = (rock && GG.sim.mixOf(rock)) || GG.sim.rockMix();
      const chip2 = r => '<span class="gd-chip" style="--c:' + (R[r] || {}).color + '"><i></i>' + esc((R[r] || {}).name || r) + '</span>';
      return '<div class="gd-row"><span class="gd-col">' + chip2('wf') + chip2('energy') + '</span>' + ar +
        '<span class="gd-mach" style="--c:' + d.color + '">' + GG.icons.svg(d.icon, 24, d.color) + '<em>' + esc(d.name) + '</em>' +
        '<b class="gd-site">' + GG.icons.svg(mt.icon, 11, mt.color) + esc(T('gd.onSite').replace('%s', mt.name)) + '</b></span>' + ar +
        '<span class="gd-col">' + Object.keys(mix).sort(byMat).map(chip2).join('') + '</span></div>';
    }
    if (id === 'rare2') {
      const Sim = GG.sim, rv = Sim.rockVariantById && Sim.rockVariantById('rare');
      const common = rocksHere(false)[0], rare = rocksHere(true)[0];
      const cm = (common && Sim.mixOf(common)) || Sim.rockMix(), rm = (rare && Sim.mixOf(rare)) || (rv ? Sim.rockMix(rv) : {});
      const bar = (mix, label) => '<div class="gd-mix"><span class="gd-ml">' + esc(label) + '</span><span class="gd-mb">' +
        Object.keys(mix).sort(byMat).map(r => '<i style="flex:' + Math.max(0.035, mix[r]).toFixed(3) + ';background:' + (R[r] || {}).color + '"' +
          (r === 'gold' ? ' class="gd-gold"' : '') + '></i>').join('') + '</span><span class="gd-mk">' +
        Object.keys(mix).sort(byMat).map(r => '<span class="gd-chip" style="--c:' + (R[r] || {}).color + '"><i></i>' + esc((R[r] || {}).name || r) + '</span>').join('') +
        '</span></div>';
      return '<div class="gd-row gd-rare">' + bar(cm, T('gd.common')) + bar(rm, T('gd.rare')) + '</div>';
    }
    return '';
  }

  function morePicAnim(now) {
    const card = cardEl(); if (!card) return;
    const seq = card.querySelectorAll('.gd-seq > .gd-cap, .gd-seq > .gd-w');
    if (seq.length) {
      const u = (now / 4400) % 1, at = [0.05, 0.2, 0.45, 0.65, 0.85];
      seq.forEach((e, j) => e.classList.toggle(e.classList.contains('gd-cap') ? 'down' : 'lit', u > at[j] && u < (at[j + 1] || 1)));
    }
    const sl = card.querySelectorAll('.gd-slots i');
    if (sl.length) {
      const s = (now / 1000) % 4;
      sl.forEach((e, j) => e.classList.toggle('full', s > 0.8 + j));
      const w = card.querySelector('.gd-works'); if (w) w.classList.toggle('on', s > 0.8 + sl.length);
    }
  }

  function overlayChips() {
    const O = cfg().overlayChips || {};
    if (!O.enabled) return '';
    const btns = document.querySelectorAll('#left-rail .ov-list button[data-k]');
    let html = '';
    btns.forEach(b => {
      if (b.dataset.k === 'off') return;
      const c = b.cloneNode(true), kb = c.querySelector('kbd'), key = kb ? kb.textContent : '';
      if (kb) kb.remove();
      html += '<span class="gd-ovc" data-k="' + esc(b.dataset.k) + '">' + c.innerHTML +
        (key && !touch() ? '<span class="gd-cap">' + esc(key) + '</span>' : '') + '</span>';
    });
    return html ? '<div class="gd-ovchips">' + html + '</div>' : '';
  }
  function chipAnim(now) {
    const card = cardEl(), list = card ? card.querySelectorAll('.gd-ovc') : [];
    if (!list.length) return;
    const i = Math.floor(now / (((cfg().overlayChips || {}).chipSec || 1.3) * 1000)) % list.length;
    list.forEach((e, j) => e.classList.toggle('lit', j === i));
  }
  function splitAnim(now) {
    const NR = cfg().noteRows || {}, list = NR.ratios || [[1, 1]];
    const card = cardEl(); if (!card) return;
    const r = list[Math.floor(now / ((NR.ratioSec || 1.7) * 1000)) % list.length], sum = r[0] + r[1];
    card.querySelectorAll('.gd-rn').forEach(e => { e.textContent = r[e.dataset.k === 'a' ? 0 : 1]; });
    card.querySelectorAll('.gd-rb i').forEach(e => { e.style.width = (100 * r[e.dataset.k === 'a' ? 0 : 1] / sum) + '%'; });
  }

  let picSig = '';
  function paintPicture(cur) {
    const card = cardEl(); if (!card) return;
    const txt = card.querySelector('.tc-text');
    let box = card.querySelector('.gd-pic');
    let html = '', sig = '';
    if (cur && cur.kind === 'step' && cfg().strips && !cur.quiet) { html = stepStrip(cur.id); sig = 'step|' + cur.id; }
    if (cur && cur.kind === 'note') { html = noteRow(cur); sig = 'note|' + cur.id + '|' + GG.i18n.lang() + '|' + touch(); }
    sig += '|' + (html ? 1 : 0);
    if (!html) { if (box) box.remove(); card.classList.remove('gd-wide'); picSig = ''; return; }
    if (box && sig === picSig) return;
    if (box) box.remove();
    box = document.createElement('div'); box.className = 'gd-pic'; box.innerHTML = html;
    txt.insertAdjacentElement('afterend', box);
    card.classList.toggle('gd-wide', cur.kind === 'note');
    picSig = sig;
    if (cfg().fadeIn) { box.classList.remove('gd-in'); void box.offsetWidth; box.classList.add('gd-in'); }
  }

  function keyWords(cur) {
    const card = cardEl(), tc = card && card.querySelector('.tc-text');
    if (!tc || !cur || !cfg().keyWords) return;
    if (tc.querySelector('.gd-key')) return;
    const miss = cur.id + '|' + tc.textContent;
    if (tc.dataset.gdNoKey === miss) return;
    let hit = false;
    String(cur.o.keys || '').split('|').filter(Boolean).forEach(k => {
      tc.querySelectorAll('p').forEach(p => {
        const i = p.innerHTML.indexOf(esc(k));
        if (i < 0 || p.innerHTML.lastIndexOf('<', i) > p.innerHTML.lastIndexOf('>', i)) return;
        p.innerHTML = p.innerHTML.slice(0, i) + '<span class="gd-key">' + esc(k) + '</span>' + p.innerHTML.slice(i + esc(k).length);
        hit = true;
      });
    });
    if (!hit) tc.dataset.gdNoKey = miss;
  }
  let seenText = '';
  function fadeIn() {
    const card = cardEl(); if (!card || !cfg().fadeIn) return;
    const tc = card.querySelector('.tc-text'), ti = card.querySelector('.tc-title');
    const t = (ti ? ti.textContent : '') + '|' + (tc ? tc.textContent : '');
    if (t === seenText) return;
    seenText = t;
    [ti, tc].forEach(e => { if (!e) return; e.classList.remove('gd-in'); void e.offsetWidth; e.classList.add('gd-in'); });
  }
  let shown = null, lastBar = 0, barSig = '';
  function num(s) { const m = /([\d.,]+)\s*([KMB]?)/.exec(s || ''); if (!m) return NaN; return parseFloat(m[1].replace(/,/g, '')) * ({ K: 1e3, M: 1e6, B: 1e9 }[m[2]] || 1); }
  function countUp(now) {
    const CU = cfg().countUp || {}, card = cardEl();
    const bar = card && card.querySelector('.tc-bar'), real = bar && bar.querySelector('span');
    const live = !!(CU.enabled && bar && !bar.classList.contains('hidden') && !card.classList.contains('hidden'));
    if (card) card.classList.toggle('gd-count', live);
    if (!live) { shown = null; return; }
    let mine = bar.querySelector('.gd-num');
    if (!mine) { mine = document.createElement('b'); mine.className = 'gd-num'; bar.appendChild(mine); }
    const parts = real.textContent.split(' / '), money = parts[0].indexOf('$') >= 0, cur = num(parts[0]), goal = num(parts[1]);
    const sig = (card.querySelector('.tc-title') || {}).textContent + '|' + parts[1];
    const dt = lastBar ? Math.min(0.1, (now - lastBar) / 1000) : 0; lastBar = now;
    if (sig !== barSig || shown === null || !isFinite(cur)) { barSig = sig; shown = cur; }
    const gain = cur - shown, share = CU.popShare || 0.08;
    if (goal > 0 && gain > goal * share && !bar.dataset.gdPop) {
      const p = document.createElement('div'); p.className = 'gd-pop';
      p.textContent = (money ? '+$' : '+') + GG.util.fmt(gain, 2); p.style.top = (bar.offsetTop - 4) + 'px';
      card.appendChild(p); setTimeout(() => p.remove(), 1000);
    }
    bar.dataset.gdPop = gain > goal * share ? '1' : '';
    shown += gain * Math.min(1, dt * (CU.ease || 5));
    if (Math.abs(cur - shown) < goal * 0.002) shown = cur;
    mine.textContent = (money ? '$' : '') + GG.util.fmt(shown, 2) + ' / ' + parts[1];
    bar.classList.toggle('gd-rising', cur - shown > goal * 0.01);
  }

  let flySig = '', flyTimer = 0, flyUntil = 0;
  function cardFly() {
    const F = cfg().flyQuiet || {}, card = cardEl();
    if (!card) return;
    const quiet = card.classList.contains('quiet') && !card.classList.contains('hint') && !card.classList.contains('hidden');
    const sig = quiet ? (card.querySelector('.tc-title') || {}).textContent : '';

    const tree = document.getElementById('skilltree');
    const busy = (GG.ui.panelOpen && GG.ui.panelOpen()) || (tree && !tree.classList.contains('hidden'));
    if (sig && F.enabled && sig !== flySig && busy) { card.style.visibility = 'hidden'; return; }
    card.style.visibility = '';
    if (sig === flySig) return;
    flySig = sig;
    clearTimeout(flyTimer);
    card.style.transition = 'none'; card.style.translate = ''; card.style.scale = '';
    el.dim.classList.remove('on');
    if (!sig || !F.enabled) return;
    const r = card.getBoundingClientRect(), k = z();
    card.style.translate = ((window.innerWidth / 2 - (r.left + r.width / 2)) / k) + 'px ' + ((window.innerHeight / 2 - (r.top + r.height / 2)) / k) + 'px';
    card.style.scale = String(F.scale || 1.25);
    if (F.dim) el.dim.classList.add('on');
    flyUntil = performance.now() + ((F.holdSec || 1.2) + (F.glideSec || 0.8)) * 1000;
    flyTimer = setTimeout(function () {
      const g = (F.glideSec || 0.8) + 's cubic-bezier(.55,0,.2,1)';
      card.style.transition = 'translate ' + g + ', scale ' + g;
      card.style.translate = '0px 0px'; card.style.scale = '1';
      el.dim.classList.remove('on');
    }, (F.holdSec || 1.2) * 1000);
  }

  let popTitle = '';
  function popReplay() {
    const P = cfg().cardPop || {}, card = cardEl();
    if (!card || !P.enabled) return;
    const t = card.classList.contains('hidden') ? '' : ((card.querySelector('.tc-title') || {}).textContent || '');
    if (P.replay && t && popTitle && t !== popTitle) { card.style.animation = 'none'; void card.offsetWidth; card.style.animation = ''; }
    popTitle = t;
  }

  G.now = function () { if (!el) return null; const cur = showing(); return { id: cur && cur.id, kind: cur && cur.kind, quiet: !!(cur && cur.quiet), hand: (gestureFor(cur) || {}).kind || null }; };

  G.gestureNow = function () { return gestureFor(showing()); };
  G.tick = function (now) {
    if (!GG.tutor || !GG.render || !document.body) return;
    if (!el) init();
    now = now || performance.now();
    const live = on();
    document.body.classList.toggle('gd-glow', live && !!cfg().glow);
    document.body.classList.toggle('gd-cardpop', live && !!(cfg().cardPop || {}).enabled);
    if (live) popReplay();
    if (!live) { hideAll(); paintPicture(null); return; }
    const cur = showing();
    paintPicture(cur);
    if (cur) { keyWords(cur); fadeIn(); }
    countUp(now); cardFly(); splitAnim(now); rubbleAnim(now); chipAnim(now); morePicAnim(now);
    const H = cfg().hand || {};
    const v = GG.input && GG.input.view;
    if (!cur || !H.enabled || now < busyUntil || now < flyUntil || (v && (v.ghost || v.wire)) || (GG.menu && GG.menu.isOpen && GG.menu.isOpen())) { hideAll(); return; }
    const g = gestureFor(cur);
    if (!g) { hideAll(); return; }
    drawHand(g, now);
  };
})(window.GG);
