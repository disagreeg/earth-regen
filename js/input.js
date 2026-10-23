(function (GG) {
  'use strict';
  const C = GG.config, S = GG.state, R = GG.render;

  const I = {};
  GG.input = I;

  const view = {
    ghost: null,
    wire: null,
    hoverNode: null, hoverPort: null, hoverLink: null, hoverCollect: null,
    hoverCollectSide: null,
  };
  I.view = view;

  I.clampCamera = function () {
    const cfg = C.camera || {};
    if (cfg.clamp === false) return false;
    const box = R.contentBox();
    if (!box) return false;
    const c = S.g.camera, sz = R.size();
    if (!sz.w || !sz.h || !c.scale) return false;
    const mx = (sz.w / 2) / c.scale * (cfg.margin == null ? 0.9 : cfg.margin);
    const my = (sz.h / 2) / c.scale * (cfg.margin == null ? 0.9 : cfg.margin);
    const x = Math.min(Math.max(c.x, box.minX - mx), box.maxX + mx);
    const y = Math.min(Math.max(c.y, box.minY - my), box.maxY + my);
    const moved = x !== c.x || y !== c.y;
    c.x = x; c.y = y;
    return moved;
  };

  I.cameraLost = function () {
    const box = R.contentBox();
    if (!box) return false;
    const c = S.g.camera, sz = R.size();
    if (!sz.w || !sz.h || !c.scale) return false;
    const hw = (sz.w / 2) / c.scale, hh = (sz.h / 2) / c.scale;
    return box.maxX < c.x - hw || box.minX > c.x + hw ||
           box.maxY < c.y - hh || box.minY > c.y + hh;
  };

  I.centreView = function () {
    const box = R.contentBox();
    const c = S.g.camera;
    if (!box) { c.x = 0; c.y = 0; return; }
    c.x = box.cx; c.y = box.cy;
  };

  let drag = null;
  let mouse = { x: 0, y: 0, wx: 0, wy: 0 };
  const CLICK_SLOP = 4;

  function blocked() {
    return !!((GG.menu && GG.menu.isOpen()) || (GG.ui && GG.ui.overlayOpen && GG.ui.overlayOpen()) ||
              (GG.planetView && GG.planetView.isOpen()));
  }

  function blockedMouse() { return blocked(); }
  function blockedKeys() { return !!(GG.menu && GG.menu.isOpen()); }

  I.init = function (cv) {

    const wake = function () { GG.audio.unlock(); };
    window.addEventListener('pointerdown', wake, true);
    window.addEventListener('mousedown', wake, true);
    window.addEventListener('touchstart', wake, true);
    window.addEventListener('keydown', wake, true);
    cv.addEventListener('mousedown', onDown);
    cv.addEventListener('dblclick', onDblBend);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && ptr) ptr.inside = false; });
    cv.addEventListener('wheel', onWheel, { passive: false });

    const wantTouch = (C.swipe.drag && C.swipe.drag.touchEvents !== false) ||
                      (C.touch && C.touch.enabled);
    if (wantTouch) {
      cv.addEventListener('touchstart', onTouchStart, { passive: false });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchEnd);

      cv.style.touchAction = 'none';

      ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (g) {
        cv.addEventListener(g, function (e) { e.preventDefault(); }, { passive: false });
      });
    }

    document.addEventListener('contextmenu', function (e) {
      if (C.ui && C.ui.noContextMenu === false) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
    });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keydown', panKeyDown);
    window.addEventListener('keyup', panKeyUp);
    window.addEventListener('blur', panClear);

    const wireMod = function (e) {
      if (!view.wire) return;
      if (e.key !== 'Control' && e.key !== 'Meta') return;
      view.wire.ortho = wantOrtho(e);
    };
    window.addEventListener('keydown', wireMod);
    window.addEventListener('keyup', wireMod);
  };

  I.startPlacing = function (typeId) {
    if (!S.isUnlocked(typeId)) return;
    view.ghost = { type: typeId, x: mouse.wx, y: mouse.wy, ok: false };
    refreshGhost();
  };

  I.startBlueprint = function (id) {
    const bp = S.blueprintById(id);
    if (!bp) return;
    view.ghost = { bp: bp, x: mouse.wx, y: mouse.wy, ok: false };
    refreshGhost();
    GG.ui.refreshPalette();
  };

  I.startMove = function (ids) {
    const res = S.makeMove(ids);
    if (!res.ok) { GG.audio.play('deny'); GG.ui.toast(res.why, true); return res; }
    view.ghost = { mv: res.pack, x: mouse.wx, y: mouse.wy, ok: false };
    refreshGhost();
    GG.ui.refreshPalette();
    return res;
  };
  I.movingGhost = function () { return !!(view.ghost && view.ghost.mv); };

  I.draggingIds = function () {
    const o = {};
    if (drag && drag.node) o[drag.node.id] = 1;
    if (drag && drag.members) drag.members.forEach(m => { o[m.n.id] = 1; });
    return o;
  };

  function followDocks() {
    if ((C.ui || {}).dockFollowDrag !== false) S.syncDocks(I.draggingIds());
  }
  I.cancelPlacing = function () { view.ghost = null; GG.ui.refreshPalette(); };

  let dockPress = null, dockSwallow = false, ptr = null, edgeT = 0, edgeSide = '';
  I.dockPress = function (typeId, e) {
    const cfg = (C.ui || {}).dockDrag;
    dockSwallow = false;
    if (!cfg || !cfg.enabled || e.button !== 0) return;
    dockPress = { type: typeId, sx: e.clientX, sy: e.clientY, started: false };
  };

  I.dockClickSwallowed = function () { const s = dockSwallow; dockSwallow = false; return s; };
  function dockMove(e) {
    const d = dockPress;
    if (!d || d.started) return;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < ((C.ui.dockDrag || {}).slopPx || 6)) return;
    d.started = true;
    S.markNodeSeen(d.type);
    if (!(view.ghost && view.ghost.type === d.type)) { I.startPlacing(d.type); GG.audio.play('click'); }
    GG.ui.refreshPalette();
  }
  function dockDrop(e) {
    updateMouse(e);
    const r = mapRect(e.clientX), onMap = e.target === R.canvas &&
      e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!onMap || !view.ghost) { I.cancelPlacing(); return; }
    onDown({ button: 0, clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey, preventDefault: function () {} });
  }

  function mapRect(x) {
    const cv = R.canvas.getBoundingClientRect();
    let top = cv.top, bottom = cv.bottom, right = cv.right;
    const tb = document.getElementById('topbar'), dk = document.getElementById('dock'), ins = document.getElementById('inspector');
    if (tb) { const b = tb.getBoundingClientRect(); if (b.height && b.bottom > top && b.top <= cv.top + 4) top = b.bottom; }
    const span = !!((C.ui || {}).edgeScroll || {}).dockSpan && x !== undefined;
    if (dk) { const b = dk.getBoundingClientRect(); if (b.height && b.top < bottom && b.bottom >= cv.bottom - 4 &&
              (!span || (x >= b.left && x <= b.right))) bottom = b.top; }
    if (ins && !ins.classList.contains('hidden')) {
      const b = ins.getBoundingClientRect(); if (b.width && b.left > cv.left + cv.width / 2) right = b.left;
    }
    return { left: cv.left, right: right, top: top, bottom: bottom };
  }
  function edgeHeld(cfg) {
    if (cfg.ghost && (view.ghost || (GG.lifter && GG.lifter.placing()))) return true;
    if (cfg.wire && view.wire) return true;
    return !!(cfg.node && drag && drag.mode === 'node' && drag.moved);
  }

  I.edgeTick = function (dt) {
    const cfg = (C.ui || {}).edgeScroll;
    if (!cfg || !cfg.enabled || !ptr || !ptr.inside || !dt || blockedMouse() || !edgeHeld(cfg)) { edgeT = 0; return; }
    const r = mapRect(ptr.x), z = cfg.zonePx;

    if (ptr.x < r.left || ptr.x > r.right || ptr.y < r.top || ptr.y > r.bottom) { edgeT = 0; return; }
    const f = function (d) { return d >= z ? 0 : Math.pow(1 - Math.max(0, d) / z, 2); };
    const dx = f(r.right - ptr.x) - f(ptr.x - r.left), dy = f(r.bottom - ptr.y) - f(ptr.y - r.top);
    if (!dx && !dy) { edgeT = 0; return; }
    const side = Math.sign(dx) + ',' + Math.sign(dy);
    if (side !== edgeSide) { edgeSide = side; edgeT = 0; }
    edgeT += dt;
    if (edgeT < cfg.waitSec) return;
    const c = S.g.camera, uz = R.uiZoom ? R.uiZoom() : 1;
    c.x += dx * cfg.speed * dt / uz / c.scale;
    c.y += dy * cfg.speed * dt / uz / c.scale;
    I.clampCamera();
    onMove(ptr.ev);
  };

  const PAN_DIR = { KeyW: [0, -1], KeyA: [-1, 0], KeyS: [0, 1], KeyD: [1, 0],
                    ArrowUp: [0, -1], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowRight: [1, 0] };
  const panHeld = new Set();
  let panShift = false, panVx = 0, panVy = 0;
  function panCfg() { const k = (C.ui || {}).keyPan; return k && k.enabled ? k : null; }
  function panKeyDown(e) {
    panShift = e.shiftKey;
    const cfg = panCfg(), d = PAN_DIR[e.code];
    if (!cfg || !d || (!cfg.arrows && /^Arrow/.test(e.code))) return;
    if (e.ctrlKey || e.metaKey || e.altKey || blockedKeys()) return;
    const t = e.target;
    if (t && (/input|textarea|select/i.test(t.tagName) || t.isContentEditable)) return;
    if (GG.ui && GG.ui.overlayOpen && GG.ui.overlayOpen()) return;
    if (GG.planetView && GG.planetView.covering()) return;
    e.preventDefault();
    panHeld.add(e.code);
  }
  function panKeyUp(e) { panShift = e.shiftKey; panHeld.delete(e.code); }
  function panClear() { panHeld.clear(); panShift = false; }

  I.keyPanTick = function (dt) {
    const cfg = panCfg();
    if (!cfg || !dt || blockedKeys()) { panClear(); panVx = panVy = 0; return; }
    if (!panHeld.size && !panVx && !panVy) return;
    let dx = 0, dy = 0;
    panHeld.forEach(function (c) { dx += PAN_DIR[c][0]; dy += PAN_DIR[c][1]; });
    dx = Math.sign(dx); dy = Math.sign(dy);
    const len = Math.hypot(dx, dy) || 1;
    const sp = cfg.speed * (panShift ? (cfg.shiftMul || 1) : 1);
    const k = cfg.glideSec > 0 ? Math.min(1, dt / cfg.glideSec * 3) : 1;
    panVx += (dx / len * sp - panVx) * k;
    panVy += (dy / len * sp - panVy) * k;
    if (!panHeld.size && Math.abs(panVx) < 0.5 && Math.abs(panVy) < 0.5) { panVx = panVy = 0; return; }
    const c = S.g.camera, uz = R.uiZoom ? R.uiZoom() : 1;
    c.x += panVx * dt / uz / c.scale;
    c.y += panVy * dt / uz / c.scale;
    I.clampCamera();

    if (ptr && ptr.inside && !(drag && drag.mode === 'pan')) onMove(ptr.ev);
  };

  function snap(v) { return S.snapTo(v); }

  function dragMembers(d) {
    const ms = d.members;
    if (!ms || !ms.length) return;
    let a = null;
    for (const m of ms) if (m.n === d.node) { a = m; break; }
    if (!a) a = ms[0];
    const dx = snap(mouse.wx + a.ox) - a.startX;
    const dy = snap(mouse.wy + a.oy) - a.startY;
    for (const m of ms) { m.n.x = m.startX + dx; m.n.y = m.startY + dy; }
    wireAlign(ms);
  }

  let aligned = null;
  function wireAlign(ms) {
    aligned = null;
    const W = (C.ui || {}).wireAlign || {};
    if (!W.enabled || !ms.length) return;

    const pick = (W.setting !== false && GG.menu && GG.menu.wireAlign) || W.def || 'on';
    if (pick !== 'on') return;
    const moving = new Set(ms.map(m => m.n.id));
    let best = null;
    for (const l of S.g.links) {
      const fm = moving.has(l.from), tm = moving.has(l.to);
      const bn = l.bends && l.bends.length;
      if (fm === tm || (bn && !W.bends)) continue;
      const a = S.node(l.from), b = S.node(l.to); if (!a || !b) continue;
      const p = R.portPos(a, 'out', l.fromPort), q = R.portPos(b, 'in', l.toPort);
      if (!p || !q) continue;

      const from = bn ? { y: a.y + l.bends[bn - 1].dy } : p;
      const need = fm ? q.y - from.y : from.y - q.y;
      if (Math.abs(need) <= (W.reach || 20) && (!best || Math.abs(need) < Math.abs(best.need))) best = { need: need, id: l.id };
    }
    if (!best) return;
    if (Math.abs(best.need) > 1e-6) for (const m of ms) m.n.y += best.need;
    aligned = best.id;
  }
  I.aligned = function () { return drag && drag.moved && (drag.mode === 'node' || drag.mode === 'tnode') ? aligned : null; };

  I.snapping = function () {
    if (S.snapMode() !== 'grid') return false;
    if (view.ghost) return true;
    return !!(drag && drag.moved && (drag.mode === 'node' || drag.mode === 'tnode'));
  };

  function placePoint(type) {
    const t = C.nodeTypes[type];
    return t.placement === 'onSite' ? { x: mouse.wx, y: mouse.wy } : { x: snap(mouse.wx), y: snap(mouse.wy) };
  }

  function refreshGhost() {
    if (!view.ghost) return;
    const g = view.ghost;
    if (g.bp) {
      g.x = snap(mouse.wx); g.y = snap(mouse.wy);
      const chk = S.canPlaceBlueprint(g.bp, g.x, g.y);
      g.ok = chk.ok; g.why = chk.why;
      return;
    }
    if (g.mv) {
      g.x = snap(mouse.wx); g.y = snap(mouse.wy);
      const chk = S.canMoveTo(g.mv, g.x, g.y);
      g.ok = chk.ok; g.why = chk.why;
      return;
    }

    const target = S.snapTarget(g.type, mouse.wx, mouse.wy);
    if (target.slot) { g.x = target.x; g.y = target.y; }
    else { g.x = snap(mouse.wx); g.y = snap(mouse.wy); }
    const pp = placePoint(g.type);
    const chk = S.canPlace(g.type, pp.x, pp.y);
    g.ok = chk.ok; g.why = chk.why;
  }

  function updateMouse(e) {
    const r = R.canvas.getBoundingClientRect();

    const z = R.uiZoom ? R.uiZoom() : 1;
    mouse.x = (e.clientX - r.left) / z;
    mouse.y = (e.clientY - r.top) / z;
    const w = R.toWorld(mouse.x, mouse.y);
    mouse.wx = w.x; mouse.wy = w.y;
  }

  function onDown(e) {
    if (blockedMouse()) return;
    updateMouse(e);
    if (R.scareFlies) R.scareFlies(mouse.wx, mouse.wy);
    if (e.button === 0 && R.visitorClick && R.visitorClick(mouse.wx, mouse.wy)) { e.preventDefault(); return; }
    if (e.button === 0 && R.starClick && R.starClick(mouse.wx, mouse.wy)) { e.preventDefault(); return; }
    if (e.button === 0 && R.conClick && R.conClick(mouse.wx, mouse.wy)) { e.preventDefault(); return; }
    if (e.button === 0 && R.noteClick && R.noteClick(mouse.wx, mouse.wy)) { e.preventDefault(); return; }
    if (e.button === 0 && R.groundGemClick && R.groundGemClick(mouse.wx, mouse.wy, e)) { e.preventDefault(); return; }

    if (GG.lifter && GG.lifter.placing()) {
      drag = { mode: 'pan', sx: mouse.x, sy: mouse.y, cx: S.g.camera.x, cy: S.g.camera.y, lift: e.button };
      return;
    }

    if (view.wire && view.wire.held && e.button !== 1) {
      e.preventDefault();
      const p = e.button === 0 && heldAlive() ? R.hitPort(mouse.wx, mouse.wy, 0, 'in') : null;
      if (p) landWire(view.wire, p);
      else view.wire = null;
      return;
    }

    if (e.button === 2) {
      e.preventDefault();
      if (view.ghost) { I.cancelPlacing(); return; }

      const hdot = (R.hitDot && !R.hitNode(mouse.wx, mouse.wy)) ? R.hitDot(mouse.wx, mouse.wy) : null;
      if (hdot) {
        S.removeDot(hdot.node, hdot.port);
        view.hoverDot = null;
        GG.audio.play('click');
        return;
      }

      const hb = R.hitBend(mouse.wx, mouse.wy);
      if (hb) {
        S.undoPush({ kind: 'bends', id: hb.link.id, prev: bendCopy(hb.link) });
        hb.link.bends.splice(hb.i, 1);
        if (!hb.link.bends.length) delete hb.link.bends;
        view.hoverBend = null;
        GG.audio.play('click');
        return;
      }
      const l = R.hitLink(mouse.wx, mouse.wy);
      if (l) { cutLink(l, true); GG.audio.play('unwire'); if ((C.ui || {}).wireToasts) GG.ui.toast('Wire removed'); return; }
      const n = R.hitNode(mouse.wx, mouse.wy);
      if (n) {
        GG.ui.selectNode(n);
        GG.ui.toast('Use DEMOLISH in the panel on the right');
        return;
      }

      if (boxDrag()) drag = { mode: 'pan', sx: mouse.x, sy: mouse.y, cx: S.g.camera.x, cy: S.g.camera.y };
      return;
    }

    if (e.button === 1) {
      e.preventDefault();

      drag = { mode: 'pan', sx: mouse.x, sy: mouse.y, cx: S.g.camera.x, cy: S.g.camera.y,
               mid: true, wx: mouse.wx, wy: mouse.wy };
      return;
    }
    if (e.button !== 0) return;

    if (view.ghost && view.ghost.mv) {
      const res = S.relocate(view.ghost.mv, view.ghost.x, view.ghost.y);
      if (res.ok) {
        GG.audio.play('build');
        const where = S.locationById(res.loc);
        if (res.cut || !GG.ui.quiet('moved')) GG.ui.toast('Moved ' + res.nodes.length + ' machine' +
          (res.nodes.length === 1 ? '' : 's') +
          (res.loc !== res.from && where ? ' to ' + where.name : '') +
          (res.cut ? ' — ' + res.cut + ' wire' + (res.cut === 1 ? '' : 's') +
                     ' cut, they could not follow' : ''));
        I.cancelPlacing();
        GG.ui.clearSelection();
        GG.ui.refreshPalette();
      } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
      return;
    }

    if (view.ghost && view.ghost.bp) {
      const bp = view.ghost.bp;
      const res = S.placeBlueprint(bp, view.ghost.x, view.ghost.y);
      if (res.ok) {
        S.undoPush({ kind: 'place', items: res.paid || [] });
        GG.audio.play('build');
        if (R.placeFx) (res.nodes || []).forEach(n => R.placeFx(n));
        if (!GG.ui.quiet('stamped')) GG.ui.toast('Stamped ' + bp.name + ' — ' + res.nodes.length + ' machines' +
          (res.price > 0 ? ' (-' + GG.util.cur(res.currency, res.price) + ')' : ''));

        if (!e.shiftKey) I.cancelPlacing(); else refreshGhost();
        GG.ui.refreshPalette();
      } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
      return;
    }

    if (view.ghost) {
      const pp = placePoint(view.ghost.type);
      const res = S.place(view.ghost.type, pp.x, pp.y);
      if (res.ok) {

        S.undoPush({ kind: 'place', items: [{ id: res.node.id, price: res.price || 0, cur: res.currency }] });
        GG.audio.play('build');
        if (R.placeFx) R.placeFx(res.node);
        if (!GG.ui.quiet('built')) GG.ui.toast('Built ' + C.nodeTypes[view.ghost.type].name +
          (res.price ? ' (-' + GG.util.fmt(res.price) + ' ' + C.currencies[res.currency].short + ')'
                     : ' (free)'));
        if (!e.shiftKey) I.cancelPlacing(); else refreshGhost();
        GG.ui.refreshPalette();
      } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
      return;
    }

    const flipNode = R.hitPillFlip(mouse.wx, mouse.wy, flipPad());
    if (flipNode) {

      R.cyclePill(flipNode);
      GG.audio.play('click');
      return;
    }

    const btnHit = R.hitCollectAt(mouse.wx, mouse.wy);
    const btnNode = btnHit ? btnHit.node : null;
    if (btnNode) {
      const bt = S.type(btnNode);
      if (bt.action && bt.action.kind === 'licence') {
        const res = GG.sim.licence(btnNode);
        if (res.ok) {
          GG.audio.play('boost');
          GG.ui.spark(mouse.x, mouse.y, '-' + GG.util.cur(res.currency, res.cost));
          R.burst(mouse.wx, mouse.wy, { color: '#e09a3c', count: 14, speed: 85, lift: 55 });
        } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
        return;
      }
      if (btnHit.side === 'G') {
        const res = GG.sim.feedGem(btnNode);
        if (res.ok) {
          GG.audio.play('gemTake');
          GG.ui.spark(mouse.x, mouse.y - 6, '-' + GG.util.cur('diamond', 1, 0), 'pop c-diamond');
          const gc = (GG.config.currencies.diamond || {}).color || '#ff5c8a';
          if (!R.btnFx(btnNode, 'G', gc)) R.burst(mouse.wx, mouse.wy, { color: gc, count: 10, speed: 70, lift: 40 });
        } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
        return;
      }
      if (btnHit.side === 'H') {
        const res = GG.sim.rocketCollect(btnNode);
        if (res.ok) {
          const cc = (GG.config.currencies.diamond || {}).color || '#d0a6f5';
          GG.audio.play('gemTake');
          if (R.collectFx) R.collectFx(btnNode, 'H', 'gems', cc, res.amount);
          GG.ui.spark(mouse.x, mouse.y - 6, '+' + GG.util.cur('diamond', res.amount, 0), 'pop c-diamond');
          if (GG.ui.collectFly) GG.ui.collectFly('diamond', mouse.x, mouse.y - 20, res.amount);
        } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
        return;
      }
      if (bt.action && bt.action.kind === 'launch') {
        const res = GG.sim.rocketLaunch(btnNode);
        if (res.ok) {

          if (!R.rocketHeard(btnNode, 'launch')) GG.audio.play('boost');
          const cp = ((C.ui || {}).momentFx || {}).cost;
          if (res.cost > 0) GG.ui.spark(mouse.x, mouse.y - (cp && cp.enabled ? 6 : 0), '-' + GG.util.cur('ci', res.cost), cp && cp.enabled ? 'pop c-ci' : undefined);

          if (!R.startFx(btnNode, 'launch', res.fuel))
            R.burst(mouse.wx, mouse.wy, { color: '#ff9f5a', count: 22, speed: 120, lift: 90 });
        } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
        return;
      }
      if (bt.action && bt.action.kind === 'fission') {
        const res = GG.sim.fissionStart(btnNode);
        if (res.ok) {
          GG.audio.play('boost');
          const cp = ((C.ui || {}).momentFx || {}).cost;
          const sd = GG.ui.spark(mouse.x, mouse.y - (cp && cp.enabled ? 6 : 0), GG.i18n.ins('-' + GG.util.small(res.kg) + ' kg'), cp && cp.enabled ? 'pop' : undefined);
          if (sd && cp && cp.enabled) sd.style.color = (GG.config.resources[res.res] || GG.config.resources.rod || {}).color || '';
          if (!R.startFx(btnNode, 'fission', res.res || 'rod'))
            R.burst(mouse.wx, mouse.wy, { color: (GG.config.resources[res.res] || GG.config.resources.rod).color, count: 16, speed: 90, lift: 60 });
        } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
        return;
      }
      if (bt.action && bt.action.kind === 'pull') {
        const res = GG.sim.beaconPull(btnNode);
        if (res.ok) {

          GG.audio.play('rockCall');

          if (R.btnFx(btnNode, undefined, '#7ee0c0')) GG.ui.spark(mouse.x, mouse.y - 6, '-' + GG.util.small(res.cost) + ' KW', 'pop c-pull');
          else {
            GG.ui.spark(mouse.x, mouse.y, '-' + GG.util.small(res.cost) + ' KW');
            R.burst(mouse.wx, mouse.wy, { color: '#7ee0c0', count: 14, speed: 90, lift: 60 });
          }
        } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
        return;
      }
      if (bt.action) {
        const before = GG.sim.crewOf(btnNode);
        const res = GG.sim.hire(btnNode, 1);
        if (res.ok) {
          GG.audio.play('hire');
          const hx = (C.ui || {}).hireFx;
          if (hx && hx.enabled) {

            const max = GG.sim.hireMax(btnNode);
            GG.ui.spark(mouse.x, mouse.y - 6, '-' + GG.util.cur(res.currency, res.price), 'pop c-money');
            R.hireFx(btnNode, before / max, GG.sim.crewOf(btnNode) / max);
            GG.ui.refreshPalette();
            return;
          }
          GG.ui.spark(mouse.x, mouse.y, '-' + GG.util.cur(res.currency, res.price));
          R.burst(mouse.wx, mouse.wy, { color: '#8fc4ff', count: 12, speed: 80, lift: 50 });
          GG.ui.refreshPalette();
        } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
        return;
      }

      const res = GG.sim.collect(btnNode, btnHit.side);
      if (res.ok) {
        const till = (btnHit.side === 'B' ? bt.collectB : bt.collect) || {};
        const fire = res.currency === 'ci' &&
          (C.audio.burnSoundOnlyForBurns === false || till.burns !== false);
        const fx = (C.ui || {}).collectFx;
        if (fx && fx.enabled) {

          const kind = res.currency === 'money' ? 'coins' : res.currency === 'diamond' ? 'gems'
            : res.currency === 'prism' ? 'prisms'
            : res.currency !== 'ci' ? 'gems'
            : (till.burns !== false ? 'fire' : 'leaves');
          const cc = (GG.config.currencies[res.currency] || {}).color || '#d0a6f5';
          GG.audio.play(res.currency === 'diamond' || res.currency === 'prism' ? 'gemTake' : (fire ? 'burn' : 'collect'));
          R.collectFx(btnNode, btnHit.side, kind, cc, res.amount);
          GG.ui.spark(mouse.x, mouse.y - 6, '+' + GG.util.cur(res.currency, res.amount, res.currency === 'diamond' || res.currency === 'prism' ? 0 : 2),
                      'pop c-' + res.currency);
          GG.ui.collectFly(res.currency, mouse.x, mouse.y - 20, res.amount);
          return;
        }
        GG.audio.play(fire ? 'burn' : 'collect');
        GG.ui.spark(mouse.x, mouse.y, '+' + GG.util.cur(res.currency, res.amount, 2));
        R.burst(mouse.wx, mouse.wy, {

          color: res.currency === 'ci' ? '#8ce4f0'
               : (res.currency === 'money' ? '#d0a6f5'
                 : (GG.config.currencies[res.currency] || {}).color || '#d0a6f5'),
          count: 14, speed: 90, lift: 55,
        });
      } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
      return;
    }

    const port = R.hitPort(mouse.wx, mouse.wy);

    if (port && S.locked()) { GG.audio.play('deny'); return; }
    if (port) {
      if (port.dir === 'out') {
        view.wire = {
          fromNode: port.node, fromPort: port.port,
          from: R.portPos(port.node, 'out', port.port.id),
          to: { x: mouse.wx, y: mouse.wy }, valid: false, ortho: wantOrtho(e),
        };
      } else {

        const l = S.linkInto(port.node.id, port.port.id);
        if (l) { cutLink(l, true); GG.audio.play('unwire'); if ((C.ui || {}).wireToasts) GG.ui.toast('Wire removed'); return; }
        view.wire = {
          back: true, toNode: port.node, toPort: port.port,
          from: R.portPos(port.node, 'in', port.port.id),
          to: { x: mouse.wx, y: mouse.wy }, valid: false, ortho: wantOrtho(e),
        };
      }
      return;
    }

    if (wantOrtho(e)) {
      const wl = R.hitLink(mouse.wx, mouse.wy);
      if (wl) {
        const now = S.wireStyle(wl.id, !wl.ortho);
        GG.audio.play('wire');
        if (!GG.ui.quiet('wireShape')) GG.ui.toast(now ? 'Wire squared off' : 'Wire curved');
        return;
      }
    }

    if (R.bendsOn() && !view.ghost && !e.shiftKey && !R.hitNode(mouse.wx, mouse.wy)) {

      const hd = R.hitDot ? R.hitDot(mouse.wx, mouse.wy) : null;
      if (hd) {
        drag = { mode: 'dot', hit: hd, sx: mouse.x, sy: mouse.y, moved: false };
        return;
      }
      const hb = R.hitBend(mouse.wx, mouse.wy);
      if (hb) {
        drag = { mode: 'bend', link: hb.link, i: hb.i, sx: mouse.x, sy: mouse.y, moved: false,
                 prev: bendCopy(hb.link) };
        return;
      }
      const wl2 = ((C.wire.bends || {}).addBy || 'drag') === 'drag' ? R.hitLink(mouse.wx, mouse.wy) : null;
      if (wl2 && (wl2.bends || []).length < ((C.wire.bends || {}).max || 12)) {
        drag = { mode: 'bendNew', link: wl2, sx: mouse.x, sy: mouse.y, moved: false, prev: bendCopy(wl2) };
        return;
      }
    }

    const node = R.hitNode(mouse.wx, mouse.wy);
    if (node) {

      if (e.shiftKey || (GG.ui.addMode && GG.ui.addMode())) {
        GG.ui.toggleNode(node); GG.audio.play('click'); return;
      }

      const inGroup = GG.ui.selCount() > 1 && GG.ui.isSelected(node.id);
      if (!inGroup && GG.ui.selCount() > 1) GG.ui.clearSelection();
      const members = inGroup
        ? GG.ui.selectedIds().map(S.node).filter(m => m && S.freeStanding(m))
        : [node];
      drag = {
        mode: 'node', node: node, group: inGroup,
        members: members.map(m => ({ n: m, ox: m.x - mouse.wx, oy: m.y - mouse.wy,
                                     startX: m.x, startY: m.y })),
        sx: mouse.x, sy: mouse.y, moved: false,
        startX: node.x, startY: node.y,
      };
      return;
    }

    const boxHere = !e.shiftKey && !view.ghost && boxDrag() && !(dragSweep() && (function () {
      const s = S.siteAt(mouse.wx, mouse.wy);
      return !!(s && GG.sim.canSwipe(s).ok);
    })());
    if (bandOn() && (e.shiftKey || boxHere) && !view.ghost) {
      if (boxHere && GG.ui.selCount()) GG.ui.clearSelection();
      drag = { mode: 'band', sx: mouse.x, sy: mouse.y, moved: false };
      view.band = { x0: mouse.wx, y0: mouse.wy, x1: mouse.wx, y1: mouse.wy };
      return;
    }

    let deadSite = null;
    if (dragSweep()) {
      const site = S.siteAt(mouse.wx, mouse.wy);
      if (site) {
        if (GG.sim.canSwipe(site).ok) {
          if (GG.ui.selCount()) GG.ui.clearSelection();
          drag = { mode: 'sweep', site: site, sx: mouse.x, sy: mouse.y,
                   px: mouse.x, py: mouse.y, inSite: true,
                   run: 0, moved: 0, fxAt: 0, fxSum: 0, plant: false };
          return;
        }
        deadSite = site;
      }
    } else if ((C.ui || {}).hoverRefusalQuiet !== false) {

      const site = S.siteAt(mouse.wx, mouse.wy);
      if (site && !GG.sim.canSwipe(site).ok) deadSite = site;
    }

    if (GG.ui.selCount()) GG.ui.clearSelection();

    drag = { mode: 'pan', sx: mouse.x, sy: mouse.y,
             cx: S.g.camera.x, cy: S.g.camera.y, site: deadSite };
  }

  let insideSite = null;

  function dragSweep() {
    const m = C.swipe.drag && C.swipe.drag.enabled;
    if (m === 'touch') return GG.util.noMouse() || sweepChoice() === 'drag';
    return !!m;
  }
  I.dragSweep = dragSweep;

  function sweepChoice() {
    const c = (C.ui || {}).sweepGesture;
    if (!c || c.enabled === false) return 'hover';
    return (GG.menu && GG.menu.sweepGesture) || c.def || 'hover';
  }

  function bandOn() {
    const v = (GG.config.ui || {}).bandSelect;
    return v === undefined ? true : !!v;
  }

  function boxDrag() {
    const c = (C.ui || {}).dragSelect;
    if (!c || c.enabled === false || touchUi() || !bandOn()) return false;
    return ((GG.menu && GG.menu.dragSelect) || c.def || 'pan') === 'box';
  }
  I.boxDrag = boxDrag;

  function touchUi() {
    if ((C.touch || {}).enabled === false) return false;
    return GG.util.noMouse();
  }
  I.touchUi = touchUi;

  function flipPad() {
    return touchUi() ? ((C.diagnose.pillFlip || {}).padTouch || 0) : 0;
  }

  function payHand(site, opt) {
    opt = opt || {};
    if (R.scareFlies) R.scareFlies(mouse.wx, mouse.wy);
    const res = GG.sim.swipe(site);
    if (res.ok) { if (opt.fx !== false) handFx(site, res.plant, res.amount, res.night); }
    if (res.ok && res.luck && GG.ui.luckyCoin) GG.ui.luckyCoin(mouse.x, mouse.y, res.luck);
    else if (!opt.quiet) handRefusal(res.why, site);
    return res;
  }

  function handFx(site, plant, amount, night) {
    R.wave(site, mouse.wx, mouse.wy);
    GG.audio.play(plant ? 'plant' : 'sweep');

    const SF = C.ui.sweepFx;
    if (SF && SF.enabled && GG.ui.sweepSpark) GG.ui.sweepSpark(mouse.x, mouse.y, amount, night);
    else GG.ui.spark(mouse.x, mouse.y, '+' + GG.util.small(amount) + ' CI');
    R.siteBurst(site, mouse.wx, mouse.wy, plant);
  }

  function handRefusal(why, site, soundOnly) {

    const ht = site ? S.type(site) : null;
    const worked = ht && ht.handSoundIdleOnly && S.onSiteMachines(site).length > 0;

    const bare = ht && ht.handSoundQuietBare && ht.deplete && (site.reserve || 0) <= GG.util.EPS;
    if (ht && ht.handSound && !worked && !bare) GG.audio.play(ht.handSound);
    if (soundOnly) return;
    if (why === 'MACHINE')     GG.ui.toast('A machine already works this site', true);
    else if (why === 'EMPTY')  GG.ui.toast('This site is stripped bare', true);
    else if (why === 'FULL')   GG.ui.toast('This plot is fully grown', true);
    else if (why === 'NOHAND') GG.ui.toast('Only a machine can clean this', true);
  }

  function updateSiteHover() {
    const site = S.siteAt(mouse.wx, mouse.wy);
    if (site === insideSite) return;
    const entered = site && site !== insideSite;
    insideSite = site;
    if (!entered) return;
    if (dragSweep()) return;

    if (view.ghost || drag || view.wire || (GG.lifter && GG.lifter.busy())) return;

    const quiet = (C.ui || {}).hoverRefusalQuiet !== false;
    const res = payHand(site, { quiet: quiet });
    if (quiet && !res.ok) handRefusal(res.why, site, true);
  }

  function finishSweep() {
    if (drag.moved <= CLICK_SLOP) {
      const want = Math.max(0, C.swipe.drag.tapEntries | 0);
      for (let i = 0; i < want; i++) if (!payHand(drag.site, { fx: i === 0 }).ok) break;
    } else if (drag.fxSum > 0) {
      handFx(drag.site, drag.plant, drag.fxSum, drag.night);
    }
  }

  function touchPoint(e) {
    const t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches || [])[0];
    if (!t) return false;
    updateMouse({ clientX: t.clientX, clientY: t.clientY });
    return true;
  }

  let pinch = null;
  function touchDist(a, b) { return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
  function touchMid(a, b) {
    return { clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 };
  }

  function refreshWire() {
    const w = view.wire;
    if (!w) return;
    if (w.held && !heldAlive()) { view.wire = null; return; }
    w.to = { x: mouse.wx, y: mouse.wy };
    const p = R.hitPort(mouse.wx, mouse.wy);
    const lands = !!(p && p.dir === (w.back ? 'out' : 'in'));
    w.valid = lands && wireEnds(w, p).ok;

    if (lands) w.to.face = R.portFace(p.node, p.dir);
    view.hoverPort = p;
  }

  function landWire(w, p) {

    const o = { ortho: !!w.ortho };
    const res = w.back
      ? S.link(p.node.id, p.port.id, w.toNode.id, w.toPort.id, o)
      : S.link(w.fromNode.id, w.fromPort.id, p.node.id, p.port.id, o);
    GG.audio.play(res.ok ? 'wire' : 'deny');
    if (res.ok) S.undoPush({ kind: 'link', id: S.g.links[S.g.links.length - 1].id });
    if (res.ok && R.wireFx) R.wireFx(S.g.links[S.g.links.length - 1], w.back ? 'from' : 'to');

    if (!res.ok || (C.ui || {}).wireToasts) GG.ui.toast(res.ok ? 'Wire connected' : res.why, !res.ok);
    return res;
  }

  function heldAlive() {
    const w = view.wire, n = w && S.node(w.fromNode.id);
    return !!(n && n.loc === S.g.loc);
  }
  function finishWire(e) {
    const w = view.wire;
    if (!w) return;
    const p = R.hitPort(mouse.wx, mouse.wy);
    let res = null;
    if (p && p.dir === (w.back ? 'out' : 'in')) res = landWire(w, p);

    if (res && res.ok && !w.back && e && e.shiftKey && ((C.ui || {}).keepWire || {}).enabled) {
      w.held = true; w.valid = false;
      return;
    }
    view.wire = null;
  }

  function onTouchStart(e) {
    if (blockedMouse()) return;
    const T = C.touch || {};

    if (T.enabled && T.pinch && e.touches.length === 2) {
      e.preventDefault();
      const a = e.touches[0], b = e.touches[1];
      updateMouse(touchMid(a, b));
      const w = R.toWorld(mouse.x, mouse.y);

      pinch = { d0: touchDist(a, b), s0: S.g.camera.scale, ax: w.x, ay: w.y };
      drag = null;
      return;
    }
    if (e.touches.length !== 1) return;
    if (pinch || view.ghost || view.wire || drag) return;
    if (!touchPoint(e)) return;

    if (dragSweep()) {
      const site = S.siteAt(mouse.wx, mouse.wy);
      if (site && GG.sim.canSwipe(site).ok) {
        e.preventDefault();
        if (GG.ui.selCount()) GG.ui.clearSelection();
        drag = { mode: 'sweep', site: site, sx: mouse.x, sy: mouse.y,
                 px: mouse.x, py: mouse.y, inSite: true, touch: true,
                 run: 0, moved: 0, fxAt: 0, fxSum: 0, plant: false };
        return;
      }
    }

    if (!T.enabled) return;

    const port = R.hitPort(mouse.wx, mouse.wy);
    const node = port ? null : R.hitNode(mouse.wx, mouse.wy);
    if (!T.pan && !port && !node) return;
    drag = { mode: 'tpending', touch: true, port: port, node: node,
             sx: mouse.x, sy: mouse.y, cx: S.g.camera.x, cy: S.g.camera.y,
             moved: 0, live: false };
  }

  function beginPending() {
    const d = drag;
    d.live = true;

    if (d.port && S.locked()) { d.mode = 'tpan'; return; }
    if (d.port) {

      if (d.port.dir === 'out') {
        view.wire = { fromNode: d.port.node, fromPort: d.port.port,
                      from: R.portPos(d.port.node, 'out', d.port.port.id),
                      to: { x: mouse.wx, y: mouse.wy }, valid: false };
      } else {
        const l = S.linkInto(d.port.node.id, d.port.port.id);
        if (l) { cutLink(l); GG.audio.play('unwire'); }
        view.wire = { back: true, toNode: d.port.node, toPort: d.port.port,
                      from: R.portPos(d.port.node, 'in', d.port.port.id),
                      to: { x: mouse.wx, y: mouse.wy }, valid: false };
      }
      d.mode = 'twire';
      return;
    }

    if (d.node && !S.locked()) {
      const inGroup = GG.ui.selCount() > 1 && GG.ui.isSelected(d.node.id);
      if (!inGroup && GG.ui.selCount() > 1) GG.ui.clearSelection();
      const members = inGroup
        ? GG.ui.selectedIds().map(S.node).filter(m => m && S.freeStanding(m))
        : [d.node];
      d.members = members.map(m => ({ n: m, ox: m.x - mouse.wx, oy: m.y - mouse.wy,
                                      startX: m.x, startY: m.y }));
      d.group = inGroup;
      d.startX = d.node.x; d.startY = d.node.y;
      d.mode = 'tnode';
      return;
    }
    d.mode = 'tpan';
  }

  function onTouchMove(e) {
    if (pinch) {
      if (e.touches.length < 2) return;
      e.preventDefault();
      const a = e.touches[0], b = e.touches[1], c = S.g.camera;
      updateMouse(touchMid(a, b));
      if (pinch.d0 > 0) {
        c.scale = GG.util.clamp(pinch.s0 * (touchDist(a, b) / pinch.d0),
                                C.world.minZoom, C.world.maxZoom);
      }

      const at = R.toWorld(mouse.x, mouse.y);
      c.x += pinch.ax - at.x;
      c.y += pinch.ay - at.y;
      I.clampCamera();
      if (view.ghost) refreshGhost();
      return;
    }
    if (!drag || !drag.touch) return;
    if (!touchPoint(e)) return;

    if (drag.mode === 'sweep') { e.preventDefault(); sweepStep(); return; }

    drag.moved = Math.hypot(mouse.x - drag.sx, mouse.y - drag.sy);
    if (!drag.live) {
      if (drag.moved <= (C.touch.tapSlop || 0)) return;
      beginPending();
    }
    e.preventDefault();

    if (drag.mode === 'twire') { refreshWire(); return; }

    if (drag.mode === 'tnode') {
      dragMembers(drag);
      followDocks();
      return;
    }

    if (drag.mode === 'tpan') {
      const c = S.g.camera;
      c.x = drag.cx - (mouse.x - drag.sx) / c.scale;
      c.y = drag.cy - (mouse.y - drag.sy) / c.scale;
      I.clampCamera();
    }
  }

  function tapCut(e) {
    const T = C.touch || {};
    if (T.cutTap === false) return false;

    if (S.locked()) return false;
    const p = R.hitPort(mouse.wx, mouse.wy, T.portPad || 0, 'in');
    if (!p) return false;
    const l = S.linkInto(p.node.id, p.port.id);
    if (!l) return false;
    cutLink(l, true);
    GG.audio.play('unwire');
    if ((C.ui || {}).wireToasts) GG.ui.toast('Wire removed');
    if (e && e.cancelable) e.preventDefault();
    return true;
  }

  function onTouchEnd(e) {
    if (pinch) { if (!e.touches || e.touches.length < 2) pinch = null; return; }
    if (!drag || !drag.touch) return;
    touchPoint(e);
    if (drag.mode === 'tpending' && !drag.live && tapCut(e)) { drag = null; return; }
    if (drag.mode === 'sweep') finishSweep();
    else if (drag.mode === 'twire') finishWire();
    else if (drag.mode === 'tnode') {
      if (drag.group) settleGroup(drag); else settleNode(drag.node, drag);
      recordMove(drag);
    }

    drag = null;
  }

  function sweepStep() {
    const d = C.swipe.drag, site = drag.site;
    const wasIn = drag.inSite;
    const isIn = S.siteAt(mouse.wx, mouse.wy) === site;
    const step = Math.hypot(mouse.x - drag.px, mouse.y - drag.py);
    drag.px = mouse.x; drag.py = mouse.y; drag.inSite = isIn;
    drag.moved += step;
    if (!wasIn || !isIn) return;

    drag.run += step;
    const per = d.perPx > 0 ? d.perPx : 120;
    let n = Math.floor(drag.run / per);
    if (n <= 0) return;

    if (n > d.maxPerMove) { n = d.maxPerMove; drag.run = 0; }
    else drag.run -= n * per;

    let paid = 0;
    for (let i = 0; i < n; i++) {
      const res = payHand(site, { quiet: true, fx: false });
      if (!res.ok) { drag.run = 0; break; }
      drag.fxSum += res.amount; drag.plant = res.plant; drag.night = res.night; paid++;
    }
    if (!paid) return;

    const t = Date.now();
    if (t - drag.fxAt >= (d.fxMinSec || 0) * 1000) {
      drag.fxAt = t;
      handFx(site, drag.plant, drag.fxSum, drag.night);
      drag.fxSum = 0;
    }
  }

  function setCursor(v) {
    R.canvas.style.cursor = (v === null) ? '' : v;
  }

  function handCursor() {
    if (document.body.classList.contains('boost-hand')) return null;

    if (drag && drag.mode === 'sweep') {
      return GG.sim.canSwipe(drag.site).plant ? 'var(--cur-plant)' : 'var(--cur-sweep)';
    }
    if (view.ghost || drag || view.wire) return 'var(--cur-arrow)';
    const site = S.siteAt(mouse.wx, mouse.wy);
    if (!site) return 'var(--cur-arrow)';
    const chk = GG.sim.canSwipe(site);
    if (!chk.ok) return 'var(--cur-arrow)';
    return chk.plant ? 'var(--cur-plant)' : 'var(--cur-sweep)';
  }

  function onMove(e) {
    if (blockedMouse()) return;
    updateMouse(e);

    ptr = { x: e.clientX, y: e.clientY, inside: true, ev: { clientX: e.clientX, clientY: e.clientY, target: e.target,
            shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey } };
    dockMove(e);
    if (GG.lifter) GG.lifter.hover(mouse.wx, mouse.wy);

    if (!drag && GG.ui && GG.ui.overMinimap && GG.ui.overMinimap(e.target)) {
      insideSite = null;
      return;
    }
    updateSiteHover();
    if (view.ghost) refreshGhost();

    if (drag && drag.mode === 'sweep') { sweepStep(); return; }

    if (drag && drag.mode === 'band') {
      if (Math.hypot(mouse.x - drag.sx, mouse.y - drag.sy) > CLICK_SLOP) drag.moved = true;
      view.band.x1 = mouse.wx; view.band.y1 = mouse.wy;
      return;
    }

    if (drag && drag.mode === 'bendNew' && Math.hypot(mouse.x - drag.sx, mouse.y - drag.sy) > CLICK_SLOP) {
      const l = drag.link;
      l.bends = l.bends || [];
      let at = R.bendSlot(l, mouse.wx, mouse.wy);

      const dot0 = S.dotOf(S.node(l.from), l.fromPort);
      if (dot0 && S.atDot(l.bends[0], dot0) && at < 1) at = 1;
      l.bends.splice(at, 0, { dx: 0, dy: 0 });
      drag = { mode: 'bend', link: l, i: at, sx: drag.sx, sy: drag.sy, moved: true, prev: drag.prev };
    }
    if (drag && drag.mode === 'bend') {
      const a = S.node(drag.link.from);
      if (Math.hypot(mouse.x - drag.sx, mouse.y - drag.sy) > CLICK_SLOP) drag.moved = true;
      if (a && drag.link.bends && drag.link.bends[drag.i]) {
        drag.link.bends[drag.i] = { dx: S.snapTo(mouse.wx) - a.x, dy: S.snapTo(mouse.wy) - a.y };
      }
      return;
    }
    if (drag && drag.mode === 'bendNew') return;

    if (drag && drag.mode === 'dot') {
      if (Math.hypot(mouse.x - drag.sx, mouse.y - drag.sy) > CLICK_SLOP) drag.moved = true;
      if (drag.moved) S.setDot(drag.hit.node, drag.hit.port, S.snapTo(mouse.wx) - drag.hit.node.x,
                               S.snapTo(mouse.wy) - drag.hit.node.y);
      return;
    }

    if (!drag && R.bendsOn()) {
      const hd = R.hitDot ? R.hitDot(mouse.wx, mouse.wy) : null;
      view.hoverDot = hd ? { node: hd.node, port: hd.port } : null;
      const hb = hd ? null : R.hitBend(mouse.wx, mouse.wy);
      view.hoverBend = hb ? { link: hb.link.id, i: hb.i } : null;
    }

    if (drag && drag.mode === 'pan') {
      const c = S.g.camera;
      c.x = drag.cx - (mouse.x - drag.sx) / c.scale;
      c.y = drag.cy - (mouse.y - drag.sy) / c.scale;
      I.clampCamera();

      if (view.wire && (C.ui || {}).panKeepsWire !== false) {
        const w = R.toWorld(mouse.x, mouse.y);
        mouse.wx = w.x; mouse.wy = w.y;
        view.wire.ortho = wantOrtho(e);
        refreshWire();
      }
      return;
    }

    if (drag && drag.mode === 'node') {

      if (Math.hypot(mouse.x - drag.sx, mouse.y - drag.sy) > CLICK_SLOP && !S.locked())
        drag.moved = true;
      if (drag.moved) {

        dragMembers(drag);
        followDocks();
      }
      return;
    }

    if (view.wire) {

      view.wire.ortho = wantOrtho(e);
      refreshWire();
      return;
    }

    view.hoverPort = R.hitPort(mouse.wx, mouse.wy);

    const fn = view.hoverPort ? null : R.hitPillFlip(mouse.wx, mouse.wy, flipPad());
    view.hoverFlip = fn ? fn.id : null;
    const ch = (view.hoverPort || fn) ? null : R.hitCollectAt(mouse.wx, mouse.wy);
    const cn = ch ? ch.node : null;
    view.hoverCollect = cn ? cn.id : null;

    view.hoverCollectSide = ch ? ch.side : null;
    const n = (view.hoverPort || fn || cn) ? null : R.hitNode(mouse.wx, mouse.wy);
    view.hoverNode = n ? n.id : null;
    const l = (view.hoverPort || fn || cn || n) ? null : R.hitLink(mouse.wx, mouse.wy);
    view.hoverLink = l ? l.id : null;
    setCursor(view.hoverPort ? 'crosshair'
      : (fn || cn || n ? 'var(--cur-point)'
      : (view.hoverLink ? 'var(--cur-no)' : handCursor())));
  }

  function wireEnds(w, p) {
    return w.back
      ? S.canLink(p.node.id, p.port.id, w.toNode.id, w.toPort.id)
      : S.canLink(w.fromNode.id, w.fromPort.id, p.node.id, p.port.id);
  }

  function onUp(e) {
    if (blockedMouse()) return;
    if (dockPress) {
      const d = dockPress; dockPress = null;
      if (d.started && e.button === 0) { dockSwallow = true; dockDrop(e); return; }
    }

    const keepWire = e.button === 1 && (C.ui || {}).panKeepsWire !== false;
    if (view.wire && !keepWire && !view.wire.held) { updateMouse(e); finishWire(e); }

    if (drag && drag.mode === 'node') {

      const sameOne = !e.shiftKey && GG.ui.selCount() === 1 &&
                      GG.ui.isSelected(drag.node.id) && (C.ui || {}).tapToDeselect !== false;
      if (!drag.moved && sameOne) GG.ui.clearSelection();
      else if (!drag.moved) { GG.ui.selectNode(drag.node); GG.audio.play('select'); }
      else { if (drag.group) settleGroup(drag); else settleNode(drag.node, drag); recordMove(drag); }
    }

    if (drag && drag.mode === 'sweep') finishSweep();

    if (drag && drag.mode === 'band') {
      if (drag.moved && view.band) {
        const b = view.band;
        const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1);
        const y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
        let caught = 0;
        S.machinesHere().forEach(function (n) {
          if (GG.ui.isSelected(n.id)) return;
          const sz = S.sizeOf(n);
          const a0 = n.x - sz.w / 2, a1 = n.x + sz.w / 2;
          const c0 = n.y - sz.h / 2, c1 = n.y + sz.h / 2;

          if (a0 <= x1 && a1 >= x0 && c0 <= y1 && c1 >= y0) { GG.ui.toggleNode(n, true); caught++; }
        });
        if (caught) GG.audio.play('click');
      }
      view.band = null;
    }

    if (drag && drag.mode === 'bend') {
      if (drag.moved) {
        GG.audio.play('click');
        S.undoPush({ kind: 'bends', id: drag.link.id, prev: drag.prev });
      }
      drag = null;
      return;
    }
    if (drag && drag.mode === 'bendNew') {
      if (GG.ui.selCount()) GG.ui.clearSelection();
      drag = null;
      return;
    }

    if (drag && drag.mode === 'dot') {
      const hd = drag.hit, n = S.node(hd.node.id), moved = drag.moved;
      drag = null;
      if (moved) { GG.audio.play('click'); return; }
      if (n && !S.locked()) {
        const port = S.portsOf(n, 'out').find(p => p.id === hd.port), d = S.dotOf(n, hd.port);
        if (port && d) {
          view.wire = { fromNode: n, fromPort: port, from: { x: n.x + d.dx, y: n.y + d.dy },
                        to: { x: mouse.wx, y: mouse.wy }, valid: false, ortho: false, held: true };
          GG.audio.play('click');
        }
      }
      return;
    }
    if (drag && drag.mode === 'pan' && drag.mid && R.bendsOn() &&
        Math.hypot(mouse.x - drag.sx, mouse.y - drag.sy) <= CLICK_SLOP) {
      const hb = R.hitBend(drag.wx, drag.wy);
      const l = hb ? hb.link : R.hitLink(drag.wx, drag.wy);
      if (l && l.bends && l.bends.length) {
        S.undoPush({ kind: 'bends', id: l.id, prev: bendCopy(l) });

        const d0 = S.dotOf(S.node(l.from), l.fromPort);
        if (d0 && S.atDot(l.bends[0], d0)) l.bends = [l.bends[0]];
        else delete l.bends;
        GG.audio.play('click');
        if ((C.ui || {}).wireToasts) GG.ui.toast('Wire straightened');
      }
    }

    if (drag && drag.mode === 'pan' && GG.lifter &&
        Math.hypot(mouse.x - drag.sx, mouse.y - drag.sy) <= CLICK_SLOP &&
        GG.lifter.tap(mouse.wx, mouse.wy, drag.lift !== undefined ? drag.lift : e.button)) { drag = null; return; }

    if (drag && drag.mode === 'pan' && drag.site &&
        Math.hypot(mouse.x - drag.sx, mouse.y - drag.sy) <= CLICK_SLOP) {
      handRefusal(GG.sim.canSwipe(drag.site).why, drag.site);
    }

    drag = null;
  }

  function bendCopy(l) { return (l.bends || []).map(q => ({ dx: q.dx, dy: q.dy })); }
  function onDblBend(e) {
    const B = (C.wire && C.wire.bends) || {};

    if (R.dotsOn && R.dotsOn() && !blockedMouse() && !S.locked()) {
      updateMouse(e);
      if (!R.hitNode(mouse.wx, mouse.wy) && !R.hitDot(mouse.wx, mouse.wy)) {
        const l = R.hitLink(mouse.wx, mouse.wy), a = l && S.node(l.from);
        if (l && a) {
          S.setDot(a, l.fromPort, S.snapTo(mouse.wx) - a.x, S.snapTo(mouse.wy) - a.y);
          GG.audio.play('wire');
          return;
        }
      }
    }
    if (!R.bendsOn() || B.addBy !== 'dblclick' || blockedMouse()) return;
    updateMouse(e);
    if (R.hitNode(mouse.wx, mouse.wy) || R.hitBend(mouse.wx, mouse.wy)) return;
    const l = R.hitLink(mouse.wx, mouse.wy), a = l && S.node(l.from);
    if (!l || !a || (l.bends || []).length >= (B.max || 12)) return;
    S.undoPush({ kind: 'bends', id: l.id, prev: bendCopy(l) });
    l.bends = l.bends || [];
    l.bends.splice(R.bendSlot(l, mouse.wx, mouse.wy), 0,
                   { dx: S.snapTo(mouse.wx) - a.x, dy: S.snapTo(mouse.wy) - a.y });
    GG.audio.play('click');
  }

  function cutLink(l, fx) {
    if (fx && R.cutFx) R.cutFx(l, mouse.wx, mouse.wy);
    S.undoPush({ kind: 'cut', rec: Object.assign({}, l) });
    S.unlink(l.id);
  }
  function recordMove(d) {
    const items = d.group
      ? d.members.map(m => ({ id: m.n.id, x: m.startX, y: m.startY, n: m.n }))
      : [{ id: d.node.id, x: d.startX, y: d.startY, n: d.node }];
    const moved = items.filter(it => Math.abs(it.n.x - it.x) > 0.5 || Math.abs(it.n.y - it.y) > 0.5);
    if (!moved.length) return;
    S.undoPush({ kind: 'move', items: items.map(it => ({ id: it.id, x: it.x, y: it.y })) });
  }
  I.undo = function () {
    if (view.wire || (drag && drag.moved)) return;
    if (view.ghost) I.cancelPlacing();
    const res = S.undo();
    if (!res.ok) { GG.audio.play('deny'); GG.ui.toast(res.why, true); return; }
    GG.audio.play(res.kind === 'link' ? 'unwire' : res.kind === 'cut' ? 'wire' : 'click');
    if (res.kind === 'place') GG.ui.clearSelection();
    GG.sim.invalidate();
    GG.ui.refreshPalette();
    if (GG.ui.rebuildInspector) GG.ui.rebuildInspector();
    if (!GG.ui.quiet('undone')) GG.ui.toast('Undone');
  };

  function settleGroup(d) {
    const ids = {};
    d.members.forEach(m => { ids[m.n.id] = 1; });

    const docking = (C.ui || {}).groupDocks !== false;
    const isAgency = m => docking && S.bankBound(m.n);
    const bad = d.members.some(function (m) {
      if (isAgency(m)) return false;
      const size = S.sizeOf(m.n);
      if (S.siteAt(m.n.x, m.n.y)) return true;
      return S.machinesHere().some(function (o) {
        if (ids[o.id]) return false;
        const os = S.sizeOf(o);
        return Math.abs(o.x - m.n.x) < (os.w + size.w) / 2 &&
               Math.abs(o.y - m.n.y) < (os.h + size.h) / 2;
      });
    });
    if (bad) {
      d.members.forEach(m => { m.n.x = m.startX; m.n.y = m.startY; });
      GG.ui.toast('No room for the whole group there', true);
    }
    if (docking) settleAgencies(d, ids, bad);
  }

  function settleAgencies(d, ids, reverted) {
    let docked = 0;
    d.members.forEach(function (m) {
      const n = m.n;
      if (!S.type(n).autoHire) return;
      if (reverted || (n.dock && ids[n.dock])) return;
      const b = S.findDock(n.x, n.y, n.id);
      if (b) { if (n.dock !== b.id) docked++; n.dock = b.id; }
      else if (!S.bankBound(n)) n.dock = null;
      else if (!n.dock) { n.x = m.startX; n.y = m.startY; }
    });
    S.syncDocks();
    if (docked && !GG.ui.quiet('docked')) GG.ui.toast('Docked to a Bank');
  }

  function settleNode(n, d) {
    const t = S.type(n);

    if (t.autoHire) {
      const b = S.findDock(n.x, n.y, n.id);
      if (b) {
        const was = n.dock;
        n.dock = b.id; S.syncDocks();
        if (was !== b.id && !GG.ui.quiet('docked')) GG.ui.toast('Docked to a Bank');
        return;
      }

      if (t.autoHire.hybrid) n.dock = null;
      else {

        if (n.dock) S.syncDocks(); else { n.x = d.startX; n.y = d.startY; }
        GG.ui.toast('It can only stand on a Bank', true);
        return;
      }
    }
    if (t.placement === 'onSite') {
      const site = S.siteAt(n.x, n.y);
      const right = S.fitsSite(t, site);
      const slot = right ? S.freeSlot(site, n.x, n.y, n.id) : null;
      if (slot) { n.x = slot.x; n.y = slot.y; }
      else {
        n.x = d.startX; n.y = d.startY;
        GG.ui.toast(right ? 'Both slots are taken'
          : t.name + ' must sit in a ' + S.siteTypeName(t) + ' slot', true);
      }
      return;
    }

    const size = S.sizeOf(n);
    const bad = S.siteAt(n.x, n.y) || S.machinesHere().some(m => {
      if (m.id === n.id) return false;
      const ms = S.sizeOf(m);
      return Math.abs(m.x - n.x) < (ms.w + size.w) / 2 && Math.abs(m.y - n.y) < (ms.h + size.h) / 2;
    });
    if (bad) { n.x = d.startX; n.y = d.startY; GG.ui.toast('No room there', true); }
  }

  function onWheel(e) {
    if (blockedMouse()) return;
    e.preventDefault();
    const c = S.g.camera;
    const before = R.toWorld(mouse.x, mouse.y);
    c.scale = GG.util.clamp(c.scale * Math.pow(1.0015, -e.deltaY), C.world.minZoom, C.world.maxZoom);
    const after = R.toWorld(mouse.x, mouse.y);
    c.x += before.x - after.x;
    c.y += before.y - after.y;
    I.clampCamera();
    if (view.ghost) refreshGhost();
  }

  function onKey(e) {
    if (blockedKeys()) return;
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;

    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey &&
        (e.code === 'KeyZ' || e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      I.undo();
      return;
    }

    const sa = (C.ui || {}).selectAll || {};
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && sa.enabled && sa.key &&
        (String(e.key).toLowerCase() === String(sa.key).toLowerCase() ||
         e.code === 'Key' + String(sa.key).toUpperCase()) &&
        !(GG.ui && GG.ui.overlayOpen && GG.ui.overlayOpen())) {
      e.preventDefault();
      if (GG.ui && GG.ui.selectAllHere) GG.ui.selectAllHere();
      return;
    }

    const dk = (C.dev || {}).unlockKey;
    if (dk && e.ctrlKey && e.shiftKey && !e.altKey && e.code === 'Key' + String(dk).toUpperCase() &&
        (!C.dev.unlockLocalOnly || location.protocol === 'file:')) {
      e.preventDefault();
      C.dev.enabled = !C.dev.enabled;
      if (!C.dev.enabled && GG.ui.setSpeed) GG.ui.setSpeed(1);
      GG.ui.buildDevBar();
      GG.ui.setDevHidden(!C.dev.enabled, false);
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') {
      I.escape(true);
    } else if (e.key === '`' || e.key === '~' || e.key === 'ё' || e.key === 'Ё') {

      if (GG.ui.devHidden && GG.ui.devHidden()) { GG.ui.setDevHidden(false); }
    } else if ((e.key === 'Home' || e.key === 'h' || e.key === 'H') &&
               (C.camera || {}).recentre !== false) {
      I.centreView();
    } else if (e.key === 't' || e.key === 'T') {
      GG.ui.toggleSkillTree();
    } else if (hk().demolish &&
               e.key.toLowerCase() === String(hk().demolish).toLowerCase()) {

      GG.ui.demolishSelection();
    } else if (hk().flip && e.key.toLowerCase() === String(hk().flip).toLowerCase()) {

      GG.ui.flipSelection();
    } else if (hk().codex && !e.shiftKey && (e.key.toLowerCase() === String(hk().codex).toLowerCase() ||
               e.code === 'Key' + String(hk().codex).toUpperCase())) {

      if (!document.body.classList.contains('rv-codex')) return;
      const t = GG.ui.selectedIds().map(S.node).filter(Boolean).map(n => C.nodeTypes[n.type])
        .find(tt => tt && tt.kind === 'machine');
      if (t) GG.ui.codexAt(t.id);
      else { GG.audio.play('click'); GG.ui.openPanel('codex'); }
    } else if (hk().move && e.key.toLowerCase() === String(hk().move).toLowerCase()) {

      GG.ui.moveSelection();
    } else {

      const plain = (!e.shiftKey && e.key >= '1' && e.key <= '9') ? +e.key : 0;
      const shift = (e.shiftKey && /^Digit[1-9]$/.test(e.code || '')) ? +e.code.slice(5) : 0;
      const n = plain || shift;
      if (!n) return;
      const want = plain ? 'digit' : 'shift-digit';
      if (hk().places === want) {
        GG.ui.flyToIndex(n - 1);
      } else if (hk().dock === want) {
        const pick = GG.ui.hotkeyOrder()[n - 1];
        if (pick) { I.startPlacing(pick); GG.ui.refreshPalette(); }
      }
    }
  }

  function orthoOn() {
    const o = (C.wire && C.wire.ortho) || {};
    return o.enabled !== false;
  }
  function wantOrtho(e) { return orthoOn() && !!(e && (e.ctrlKey || e.metaKey)); }

  function hk() {
    const h = (C.ui || {}).hotkeys || {};
    return (h.enabled === false) ? {} : h;
  }

  I.escape = function (fromKey) {

    if (view.band) { view.band = null; drag = null; return; }
    if (view.wire && view.wire.held) { view.wire = null; return; }
    if (GG.lifter && GG.lifter.escape()) return;

    if (GG.practice && GG.practice.active) { GG.practice.exit(); return; }
    if (view.ghost) I.cancelPlacing();
    else if (GG.ui.selCount()) GG.ui.clearSelection();
    else if (GG.ui.overlayOpen()) GG.ui.closeOverlays();
    else if (fromKey && ((C.ui || {}).hotkeys || {}).escDock !== false && GG.ui.dockBack()) return;

    else GG.menu.open('home');
  };

  I.mouse = mouse;
})(window.GG);
