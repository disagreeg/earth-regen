


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
    return !!((GG.menu && GG.menu.isOpen()) || (GG.ui && GG.ui.overlayOpen && GG.ui.overlayOpen()));
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
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
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
  }

  

  I.snapping = function () {
    if (S.snapMode() !== 'grid') return false;
    if (view.ghost) return true;
    return !!(drag && drag.moved && (drag.mode === 'node' || drag.mode === 'tnode'));
  };

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
    const chk = S.canPlace(g.type, mouse.wx, mouse.wy);
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

    
    
    if (e.button === 2) {
      e.preventDefault();
      if (view.ghost) { I.cancelPlacing(); return; }
      const l = R.hitLink(mouse.wx, mouse.wy);
      if (l) { cutLink(l); GG.audio.play('unwire'); if ((C.ui || {}).wireToasts) GG.ui.toast('Wire removed'); return; }
      const n = R.hitNode(mouse.wx, mouse.wy);
      if (n) {
        GG.ui.selectNode(n);
        GG.ui.toast('Use DEMOLISH in the panel on the right');
      }
      return;
    }

    if (e.button === 1) {
      e.preventDefault();
      drag = { mode: 'pan', sx: mouse.x, sy: mouse.y, cx: S.g.camera.x, cy: S.g.camera.y };
      return;
    }
    if (e.button !== 0) return;

    if (view.ghost && view.ghost.mv) {
      const res = S.relocate(view.ghost.mv, view.ghost.x, view.ghost.y);
      if (res.ok) {
        GG.audio.play('build');
        const where = S.locationById(res.loc);
        GG.ui.toast('Moved ' + res.nodes.length + ' machine' +
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
        GG.ui.toast('Stamped ' + bp.name + ' — ' + res.nodes.length + ' machines' +
          (res.price > 0 ? ' (-' + GG.util.cur(res.currency, res.price) + ')' : ''));
        
        if (!e.shiftKey) I.cancelPlacing(); else refreshGhost();
        GG.ui.refreshPalette();
      } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
      return;
    }

    if (view.ghost) {
      const res = S.place(view.ghost.type, mouse.wx, mouse.wy);
      if (res.ok) {
        
        S.undoPush({ kind: 'place', items: [{ id: res.node.id, price: res.price || 0, cur: res.currency }] });
        GG.audio.play('build');
        GG.ui.toast('Built ' + C.nodeTypes[view.ghost.type].name +
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
      if (bt.action && bt.action.kind === 'launch') {    
        const res = GG.sim.rocketLaunch(btnNode);
        if (res.ok) {
          
          if (!R.rocketHeard(btnNode, 'launch')) GG.audio.play('boost');
          R.burst(mouse.wx, mouse.wy, { color: '#ff9f5a', count: 22, speed: 120, lift: 90 });
        } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
        return;
      }
      if (bt.action && bt.action.kind === 'fission') {   
        const res = GG.sim.fissionStart(btnNode);
        if (res.ok) {
          GG.audio.play('boost');
          GG.ui.spark(mouse.x, mouse.y, GG.i18n.ins('-' + GG.util.small(res.kg) + ' kg'));
          R.burst(mouse.wx, mouse.wy, { color: (GG.config.resources[res.res] || GG.config.resources.rod).color, count: 16, speed: 90, lift: 60 });   
        } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
        return;
      }
      if (bt.action && bt.action.kind === 'pull') {      
        const res = GG.sim.beaconPull(btnNode);
        if (res.ok) {
          

          GG.audio.play('rockCall');
          GG.ui.spark(mouse.x, mouse.y, '-' + GG.util.small(res.cost) + ' KW');
          R.burst(mouse.wx, mouse.wy, { color: '#7ee0c0', count: 14, speed: 90, lift: 60 });
        } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
        return;
      }
      if (bt.action) {                       
        const res = GG.sim.hire(btnNode, 1);
        if (res.ok) {
          GG.audio.play('hire');
          GG.ui.spark(mouse.x, mouse.y, '-' + GG.util.cur(res.currency, res.price));
          R.burst(mouse.wx, mouse.wy, { color: '#8fc4ff', count: 12, speed: 80, lift: 50 });
          GG.ui.refreshPalette();
        } else { GG.audio.play('deny'); GG.ui.toast(res.why, true); }
        return;
      }
      
      const res = GG.sim.collect(btnNode, btnHit.side);
      if (res.ok) {
        GG.audio.play(res.currency === 'ci' ? 'burn' : 'collect');
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
        if (l) { cutLink(l); GG.audio.play('unwire'); if ((C.ui || {}).wireToasts) GG.ui.toast('Wire removed'); return; }
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
        GG.ui.toast(now ? 'Wire squared off' : 'Wire curved');
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

    





    








    if (bandOn() && e.shiftKey && !view.ghost) {
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
    }

    
    if (GG.ui.selCount()) GG.ui.clearSelection();

    drag = { mode: 'pan', sx: mouse.x, sy: mouse.y,
             cx: S.g.camera.x, cy: S.g.camera.y, site: deadSite };
  }

  



  let insideSite = null;

  






  function dragSweep() {
    const m = C.swipe.drag && C.swipe.drag.enabled;
    if (m === 'touch') return GG.util.noMouse();
    return !!m;
  }
  I.dragSweep = dragSweep;

  






  

  function bandOn() {
    const v = (GG.config.ui || {}).bandSelect;
    return v === undefined ? true : !!v;
  }

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
    const res = GG.sim.swipe(site);
    if (res.ok) { if (opt.fx !== false) handFx(site, res.plant, res.amount); }
    else if (!opt.quiet) handRefusal(res.why, site);
    return res;
  }

  


  function handFx(site, plant, amount) {
    R.wave(site, mouse.wx, mouse.wy);
    GG.audio.play(plant ? 'plant' : 'sweep');
    
    GG.ui.spark(mouse.x, mouse.y, '+' + GG.util.small(amount) + ' CI');
    R.siteBurst(site, mouse.wx, mouse.wy, plant);
  }

  
  function handRefusal(why, site) {
    











    const ht = site ? S.type(site) : null;
    const worked = ht && ht.handSoundIdleOnly && S.onSiteMachines(site).length > 0;
    if (ht && ht.handSound && !worked) GG.audio.play(ht.handSound);
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
    
    if (view.ghost || drag || view.wire) return;
    payHand(site);
  }

  




  function finishSweep() {
    if (drag.moved <= CLICK_SLOP) {
      const want = Math.max(0, C.swipe.drag.tapEntries | 0);
      for (let i = 0; i < want; i++) if (!payHand(drag.site, { fx: i === 0 }).ok) break;
    } else if (drag.fxSum > 0) {
      handFx(drag.site, drag.plant, drag.fxSum);
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
    w.to = { x: mouse.wx, y: mouse.wy };
    const p = R.hitPort(mouse.wx, mouse.wy);
    const lands = !!(p && p.dir === (w.back ? 'out' : 'in'));
    w.valid = lands && wireEnds(w, p).ok;
    

















    if (lands) w.to.face = R.portFace(p.node, p.dir);
    view.hoverPort = p;
  }

  

  function finishWire() {
    const w = view.wire;
    if (!w) return;
    const p = R.hitPort(mouse.wx, mouse.wy);
    if (p && p.dir === (w.back ? 'out' : 'in')) {
      
      const o = { ortho: !!w.ortho };
      const res = w.back
        ? S.link(p.node.id, p.port.id, w.toNode.id, w.toPort.id, o)
        : S.link(w.fromNode.id, w.fromPort.id, p.node.id, p.port.id, o);
      GG.audio.play(res.ok ? 'wire' : 'deny');
      if (res.ok) S.undoPush({ kind: 'link', id: S.g.links[S.g.links.length - 1].id });   
      
      if (!res.ok || (C.ui || {}).wireToasts) GG.ui.toast(res.ok ? 'Wire connected' : res.why, !res.ok);
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
    cutLink(l);
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
      drag.fxSum += res.amount; drag.plant = res.plant; paid++;
    }
    if (!paid) return;

    


    const t = Date.now();
    if (t - drag.fxAt >= (d.fxMinSec || 0) * 1000) {
      drag.fxAt = t;
      handFx(site, drag.plant, drag.fxSum);
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
    updateSiteHover();
    if (view.ghost) refreshGhost();

    if (drag && drag.mode === 'sweep') { sweepStep(); return; }

    if (drag && drag.mode === 'band') {
      if (Math.hypot(mouse.x - drag.sx, mouse.y - drag.sy) > CLICK_SLOP) drag.moved = true;
      view.band.x1 = mouse.wx; view.band.y1 = mouse.wy;
      return;
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
    

    const keepWire = e.button === 1 && (C.ui || {}).panKeepsWire !== false;
    if (view.wire && !keepWire) { updateMouse(e); finishWire(); }

    if (drag && drag.mode === 'node') {
      







      const sameOne = !e.shiftKey && GG.ui.selCount() === 1 &&
                      GG.ui.isSelected(drag.node.id) && (C.ui || {}).tapToDeselect !== false;
      if (!drag.moved && sameOne) GG.ui.clearSelection();
      else if (!drag.moved) GG.ui.selectNode(drag.node);   
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

    


    if (drag && drag.mode === 'pan' && drag.site &&
        Math.hypot(mouse.x - drag.sx, mouse.y - drag.sy) <= CLICK_SLOP) {
      handRefusal(GG.sim.canSwipe(drag.site).why, drag.site);
    }

    drag = null;
  }

  




  

  function cutLink(l) {
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
    GG.ui.toast('Undone');
  };

  function settleGroup(d) {
    const ids = {};
    d.members.forEach(m => { ids[m.n.id] = 1; });
    

    const docking = (C.ui || {}).groupDocks !== false;
    const isAgency = m => docking && !!S.type(m.n).autoHire;
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
      else if (!n.dock) { n.x = m.startX; n.y = m.startY; }
    });
    S.syncDocks();
    if (docked) GG.ui.toast('Docked to a Bank');
  }

  
  
  function settleNode(n, d) {
    const t = S.type(n);
    

    if (t.autoHire) {
      const b = S.findDock(n.x, n.y, n.id);
      if (b) {
        const was = n.dock;
        n.dock = b.id; S.syncDocks();
        if (was !== b.id) GG.ui.toast('Docked to a Bank');
        return;
      }
      
      if (n.dock) S.syncDocks(); else { n.x = d.startX; n.y = d.startY; }
      GG.ui.toast('It can only stand on a Bank', true);
      return;
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
    


    if (GG.practice && GG.practice.active) { GG.practice.exit(); return; }
    if (view.ghost) I.cancelPlacing();
    else if (GG.ui.selCount()) GG.ui.clearSelection();
    else if (GG.ui.overlayOpen()) GG.ui.closeOverlays();
    else if (fromKey && ((C.ui || {}).hotkeys || {}).escDock !== false && GG.ui.dockBack()) return;
    
    
    else GG.menu.open('home');
  };

  I.mouse = mouse;
})(window.GG);
