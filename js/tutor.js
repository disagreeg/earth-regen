

















(function (GG) {
  'use strict';
  const C = GG.config, S = GG.state, Sim = GG.sim, U = GG.util, IC = GG.icons;

  const T = {};
  GG.tutor = T;

  let el = {};
  let hintQueue = [];      
  


  let hintQueued = Object.create(null);
  let activeHint = null;
  

  let softHint = null, softUntil = 0, softDom = null;
  let camStart = null;     
  let firedAction = {};    

  T.init = function () {
    const wrap = document.createElement('div');
    wrap.id = 'tutor-layer';
    wrap.innerHTML =
      '<div id="tutor-ring" class="hidden"></div>' +
      '<div id="tutor-soft" class="hidden"><b></b><span></span></div>' +
      '<div id="tutor-card" class="hidden">' +
        '<div class="tc-head"><span class="tc-ic"></span><b class="tc-title"></b>' +
          '<span class="tc-step"></span></div>' +
        '<div class="tc-text"></div>' +
        


        '<button class="tut-try hidden" type="button"></button>' +
        '<div class="tc-choices hidden"></div>' +
        '<div class="tc-bar hidden"><i></i><span></span></div>' +
        '<div class="tc-foot">' +
          '<button class="tc-skip"></button>' +
          '<button class="tc-next"></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    el = {
      layer: wrap,
      ring: wrap.querySelector('#tutor-ring'),
      soft: wrap.querySelector('#tutor-soft'),
      softTitle: wrap.querySelector('#tutor-soft b'),
      softText: wrap.querySelector('#tutor-soft span'),
      card: wrap.querySelector('#tutor-card'),
      ic: wrap.querySelector('.tc-ic'),
      title: wrap.querySelector('.tc-title'),
      step: wrap.querySelector('.tc-step'),
      text: wrap.querySelector('.tc-text'),
      choices: wrap.querySelector('.tc-choices'),
      bar: wrap.querySelector('.tc-bar'),
      barFill: wrap.querySelector('.tc-bar i'),
      barTxt: wrap.querySelector('.tc-bar span'),
      next: wrap.querySelector('.tc-next'),
      skip: wrap.querySelector('.tc-skip'),
      try: wrap.querySelector('.tut-try'),
    };

    


    el.try.onclick = function () {
      const id = el.try.dataset.try;
      if (!id) return;
      dismissHint('never');
      GG.ui.tryMachine(id);
    };

    el.next.onclick = function () {
      GG.audio.play('click');
      
      if (activeHint) { dismissHint('never'); return; }
      advance();
    };
    el.skip.onclick = function () {
      GG.audio.play('click');
      
      if (activeHint) { dismissHint('later'); return; }
      



      T.finish();
    };
    camStart = null;
  };

  
  function steps() { return C.tutorial.steps; }
  function idx() { return S.g.tutorStep || 0; }
  function current() { return steps()[idx()] || null; }
  function running() {
    return C.tutorial.enabled && !S.g.tutorDone && idx() < steps().length;
  }
  function atFirst() { return idx() === 0; }
  function atLast() { return idx() >= steps().length - 1; }

  T.running = running;
  

  T.finish = function (quiet) {
    S.g.tutorDone = true;
    




    S.g.tutorSkipped = !!quiet;
    hide();
    
    if (!quiet) GG.ui.toast(GG.config.ui.tutorReplay
      ? 'Tutorial closed. Replay it from the Codex' : 'Tutorial closed');
  };
  T.restart = function () {
    S.g.tutorDone = false;
    S.g.tutorSkipped = false;      
    S.g.tutorStep = 0;
    S.g.hintsSeen = {};
    S.g.tutorChoice = null;
    T.sync();
  };

  



  T.sync = function () {
    hintQueue = []; hintQueued = Object.create(null); activeHint = null; firedAction = {}; camStart = null;
    lastText = null; choiceSig = null;
    endSoft();
    hide();
  };

  

  T.hintState = function () {
    return { queued: hintQueued, queue: hintQueue.map(h => h.node || h.id),
             showing: activeHint ? (activeHint.node || activeHint.id) : null,
             soft: softHint ? (softHint.node || softHint.id) : null };
  };

  


  T.holdGem = function () {
    



    if (GG.practice && GG.practice.active) return true;
    if (!running()) return false;
    const at = steps().findIndex(s => s.id === 'diamond');
    return at >= 0 && idx() < at;
  };

  function advance() {
    if (atLast()) { T.finish(); return; }
    S.g.tutorStep = idx() + 1;
    camStart = null;
    lastText = null;             
    GG.audio.play('skill');
  }

  



  const DONE = {
    
    camera: function () {
      const c = S.g.camera;
      if (!camStart) { camStart = { x: c.x, y: c.y, s: c.scale }; return false; }
      return Math.hypot(c.x - camStart.x, c.y - camStart.y) > 40 ||
             Math.abs(c.scale - camStart.s) > 0.05;
    },
    
    ci: function (d) { return U.canAfford(S.g.ci, ciGoal(d)); },
    skill: function (d) { return S.hasSkill(d.skill); },
    skillLevel: function (d) { return S.skillLevel(d.skill) > 0; },
    node: function (d) { return S.machines().some(n => n.type === d.node); },
    selected: function () { return !!GG.ui.selectedId(); },
    link: function (d) {
      return S.g.links.some(function (l) {
        const a = S.node(l.from), b = S.node(l.to);
        return a && b && a.type === d.from && b.type === d.to;
      });
    },
    counter: function (d) { return (S.g[d.key] || 0) >= (d.goal || 1e-9); },
    claimed: function () { return Object.keys(S.g.objectives || {}).length > 0; },
    

    panel: function (d) { return GG.ui.panelKind && GG.ui.panelKind() === d.panel; },
    boosted: function () { return Object.keys(S.g.boostUses || {}).length > 0; },
    


    cut: function () { return (S.g.wiresCut || 0) > 0; },
  };

  function ciGoal(d) {
    if (d.forSkill) {
      const sk = Sim.skillById(d.forSkill);
      return sk ? Sim.costOf(sk, 0) : (d.goal || 1);
    }
    return d.goal || 1;
  }

  function stepDone(st) {
    if (!st.done) return false;               
    const fn = DONE[st.done.kind];
    return fn ? fn(st.done) : false;
  }

  



  function waiting(st) {
    if (!st.waitFor) return false;
    const d = st.waitFor;
    return !U.canAfford(d.kind === 'money' ? S.g.money : S.g.ci, ciGoal(d));
  }

  

  function progressOf(st) {
    if (st.waitFor && !waiting(st)) return null;
    const d = st.waitFor || (st.done && st.done.kind === 'ci' ? st.done : null);
    if (!d) return null;
    const goal = ciGoal(d);
    const cur = d.kind === 'money' ? S.g.money : S.g.ci;
    const unit = d.kind === 'money' ? '$' : ' CI';
    return { cur: cur, goal: goal,
             txt: d.kind === 'money'
               ? '$' + U.fmt(cur, 2) + ' / $' + U.fmt(goal)
               : U.fmt(cur, 2) + ' / ' + U.fmt(goal) + unit };
  }

  




  function resolve(anchor) {
    for (const a of (anchor || [])) {
      const r = one(a);
      if (r) return r;
    }
    return null;
  }

  






  function touchAnchor(o) {
    if (!o || !o.anchorTouch) return null;
    return (GG.input && GG.input.touchUi && GG.input.touchUi()) ? o.anchorTouch : null;
  }
  T.stepAnchor = function (o) { return (o && touchAnchor(o)) || (o && o.anchor); };

  function one(a) {
    if (a.chosenBoost) return chosenBoostEl();
    if (a.el) {
      const node = document.querySelector(a.el);
      if (!node || !node.offsetParent) return null;      
      return { rect: node.getBoundingClientRect(), dom: node };
    }
    const st = GG.render && document.getElementById('stage');
    if (!st) return null;
    const sr = st.getBoundingClientRect();
    




    const z = (GG.render.uiZoom ? GG.render.uiZoom() : 1);
    function box(wx, wy, w, h) {
      const c = S.g.camera.scale * z;
      const p = GG.render.toScreen(wx, wy);
      const px = sr.left + p.x * z, py = sr.top + p.y * z;
      return { rect: { left: px - w * c / 2, top: py - h * c / 2,
                       width: w * c, height: h * c,
                       right: px + w * c / 2, bottom: py + h * c / 2 } };
    }
    


    if (a.site) {
      const s = typeof a.site === 'string'
        ? S.sitesHere().find(x => x.type === a.site && (!a.rare || x.rare === 'rare') &&
                                  (x.reserve === undefined || x.reserve > 0))
        : S.sitesHere()[0];
      if (!s) return null;
      const b = S.siteBox(s);      
      return box(s.x, s.y, b.w, b.h);
    }
    if (a.node) {
      const n = S.machinesHere().find(x => x.type === a.node);
      if (!n) return null;
      const sz = S.sizeOf(n);
      return box(n.x, n.y, sz.w, sz.h);
    }
    if (a.collect) {
      const n = S.machinesHere().find(x => x.type === a.collect);
      if (!n) return null;
      const r = GG.render.collectRect(n);
      if (!r) return null;
      return box(r.x + r.w / 2, r.y + r.h / 2, r.w + 8, r.h + 8);
    }
    if (a.port) {
      const n = S.machinesHere().find(x => x.type === a.port.type);
      if (!n) return null;
      const p = GG.render.portPos(n, a.port.dir, a.port.port);
      return box(p.x, p.y, 34, 34);
    }
    return null;
  }

  

  function chosenBoostEl() {
    if (!S.g.tutorChoice) return null;
    const n = document.querySelector('#pn-body .pn-row[data-id="' + S.g.tutorChoice + '"] .pn-buy');
    return (n && n.offsetParent) ? { rect: n.getBoundingClientRect(), dom: n } : null;
  }

  











  const NO_WIRES = new Set();
  let hotSig = null, hotSet = NO_WIRES;

  function wireHot(l, spec) {
    const a = S.node(l.from), b = S.node(l.to);
    if (!a || !b || !S.here(a)) return false;
    if (spec.from && a.type !== spec.from) return false;
    if (spec.to && b.type !== spec.to) return false;
    return true;
  }

  





  T.hotWires = function () {
    const fx = C.tutorial.wireFx;
    if (!fx || fx.enabled === false) return NO_WIRES;
    const live = activeHint || (running() ? current() : null);
    const specs = live && live.wires;
    

    const ta = !!touchAnchor(live);
    const off = !specs || ta || (!activeHint && waiting(live));
    const sig = off ? null : (live.id + '|' + S.g.links.length + '|' + S.g.loc);
    if (sig === hotSig) return hotSet;
    hotSig = sig;
    hotSet = NO_WIRES;
    if (off) return hotSet;
    const out = new Set();
    for (const l of S.g.links)
      for (const spec of specs)
        if (wireHot(l, spec)) { out.add(l.id); break; }
    hotSet = out;
    return hotSet;
  };

  





  function wireBox() {
    const ids = T.hotWires();
    if (!ids.size) return null;
    const st = document.getElementById('stage');
    if (!st || !GG.render) return null;
    const sr = st.getBoundingClientRect();
    const z = (GG.render.uiZoom ? GG.render.uiZoom() : 1);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const l of S.g.links) {
      if (!ids.has(l.id)) continue;
      const a = S.node(l.from), b = S.node(l.to);
      if (!a || !b) continue;
      const p = GG.render.portPos(a, 'out', l.fromPort);
      const q = GG.render.portPos(b, 'in', l.toPort);
      for (const w of [p, q]) {
        const sc = GG.render.toScreen(w.x, w.y);
        const px = sr.left + sc.x * z, py = sr.top + sc.y * z;
        if (px < x0) x0 = px; if (px > x1) x1 = px;
        if (py < y0) y0 = py; if (py > y1) y1 = py;
      }
    }
    if (!isFinite(x0)) return null;
    const g = (C.tutorial.wireFx && C.tutorial.wireFx.cardGap) || 0;
    return { left: x0 - g, top: y0 - g, width: (x1 - x0) + g * 2,
             height: (y1 - y0) + g * 2, right: x1 + g, bottom: y1 + g };
  }

  




  function ringSpace(r) {
    const z = (GG.render.uiZoom ? GG.render.uiZoom() : 1);
    if (!r || z === 1) return r;
    return { left: r.left / z, top: r.top / z, width: r.width / z, height: r.height / z,
             right: (r.right !== undefined ? r.right : r.left + r.width) / z,
             bottom: (r.bottom !== undefined ? r.bottom : r.top + r.height) / z };
  }

  
  function hide() {
    el.card.classList.add('hidden');
    el.ring.classList.add('hidden');
  }

  


















  function place(rect, quiet, side, avoid) {
    if (quiet) { el.card.style.left = ''; el.card.style.top = ''; return; }
    const z = (GG.render.uiZoom ? GG.render.uiZoom() : 1);
    const cw = el.card.offsetWidth || 340, ch = el.card.offsetHeight || 160;
    const M = 14, W = window.innerWidth / z, H = window.innerHeight / z;
    let x, y;
    





    if (avoid) {
      const cy = rect ? rect.top + rect.height / 2 - ch / 2 : avoid.top;
      const cand = [
        [avoid.left + avoid.width / 2 - cw / 2, avoid.bottom + M],
        [avoid.left + avoid.width / 2 - cw / 2, avoid.top - ch - M],
        [avoid.right + M, cy],
        [avoid.left - cw - M, cy],
      ].map(function (p) {
        const px = U.clamp(p[0], M, Math.max(M, W - cw - M));
        const py = U.clamp(p[1], M, Math.max(M, H - ch - M));
        const ox = Math.max(0, Math.min(px + cw, avoid.right) - Math.max(px, avoid.left));
        const oy = Math.max(0, Math.min(py + ch, avoid.bottom) - Math.max(py, avoid.top));
        return { x: px, y: py, hit: ox * oy };
      });
      const best = cand.find(function (c) { return c.hit === 0; }) ||
                   cand.slice().sort(function (a, b) { return a.hit - b.hit; })[0];
      el.card.style.left = best.x + 'px';
      el.card.style.top = best.y + 'px';
      return;
    }
    if (!rect) {
      x = (W - cw) / 2; y = (H - ch) / 2;
    } else if (side) {
      
      const right = rect.right + M;
      x = (right + cw < W - M) ? right : rect.left - cw - M;
      y = rect.top + rect.height / 2 - ch / 2;
    } else {
      x = rect.left + rect.width / 2 - cw / 2;
      const below = rect.bottom + M;
      y = (below + ch < H - M) ? below : rect.top - ch - M;
    }
    el.card.style.left = U.clamp(x, M, Math.max(M, W - cw - M)) + 'px';
    el.card.style.top = U.clamp(y, M, Math.max(M, H - ch - M)) + 'px';
  }

  

  let lastText = null, choiceSig = null;

  function html(s) {
    return s.split('\n\n')
      .map(p => '<p>' + p.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</p>').join('');
  }

  

  function bodyText(o) {
    



    if (o.textDrag && GG.input && GG.input.dragSweep && GG.input.dragSweep()) return o.textDrag;
    



    if (o.textTouch && GG.input && GG.input.touchUi && GG.input.touchUi()) return o.textTouch;
    



    if (o.textNoMachine && Sim.trialMachines && !Sim.trialMachines()) return o.textNoMachine;
    const pick = o.boost || (o.choices ? S.g.tutorChoice : null);
    if (!pick) return o.text;
    const b = Sim.boostById(pick);
    return (o.textChosen || o.text).replace('%s', b ? b.name : 'it');
  }

  

  function buildChoices(o) {
    const sig = o.choices ? o.id + '|' + (S.g.tutorChoice || '') : '';
    if (sig === choiceSig) return;
    choiceSig = sig;
    el.choices.innerHTML = '';
    if (!o.choices || S.g.tutorChoice) { el.choices.classList.add('hidden'); return; }
    el.choices.classList.remove('hidden');
    o.choices.forEach(function (c) {
      const b = Sim.boostById(c.boost);
      if (!b) return;
      const btn = document.createElement('button');
      btn.className = 'tc-choice';
      btn.style.setProperty('--c', b.color);
      btn.innerHTML = '<span class="tcc-ic">' + IC.svg(b.icon, 18) + '</span>' +
        '<span class="tcc-txt"><b>' + b.name + '</b><i>' + c.desc + '</i></span>';
      btn.onclick = function () {
        S.g.tutorChoice = c.boost;
        GG.audio.play('click');
        GG.ui.openPanel('boosts');
      };
      el.choices.appendChild(btn);
    });
  }

  function paint(o, rect, n, total, prog, quiet, side, noRing, avoid) {
    el.card.classList.remove('hidden');
    el.card.classList.toggle('hint', !!activeHint);
    el.card.classList.toggle('quiet', !!quiet);
    el.ic.innerHTML = IC.svg(activeHint ? 'help' : 'goals', 17);
    el.title.textContent = (quiet && o.quietTitle) ? o.quietTitle : o.title;
    



    el.step.textContent = activeHint
      ? GG.i18n.t(activeHint.whyNode ? 'cx.whyBuild' : 'tut.tip')
      : (n + ' / ' + total);

    








    const txt = activeHint ? bodyText(o)
      : ((quiet && o.quietText) ? o.quietText : bodyText(o));
    if (txt !== lastText) { el.text.innerHTML = html(txt); lastText = txt; }

    









    const tryId = activeHint ? (activeHint.tryNode || activeHint.whyNode || activeHint.node) : null;   
    const canTry = !!(tryId && GG.practice && GG.practice.canPractise &&
                      GG.practice.canPractise(tryId));
    el.try.classList.toggle('hidden', !canTry);
    if (canTry) {
      el.try.dataset.try = tryId;
      el.try.innerHTML = GG.practice.tryFace(tryId);   
    } else delete el.try.dataset.try;

    buildChoices(activeHint ? {} : o);

    if (prog) {
      el.bar.classList.remove('hidden');
      el.barFill.style.width = U.clamp(prog.cur / prog.goal, 0, 1) * 100 + '%';
      el.barTxt.textContent = prog.txt;
    } else el.bar.classList.add('hidden');

    
    

    const sn = !!(activeHint && activeHint.snooze);
    el.next.textContent = GG.i18n.t(sn ? 'tut.iKnow' : 'tut.gotIt');
    el.next.classList.toggle('hidden', !activeHint && !!o.done);
    el.skip.textContent = GG.i18n.t(sn ? 'tut.remindLater' : (activeHint ? 'tut.gotIt' : 'tut.skip'));
    el.skip.classList.toggle('hidden', !!activeHint && !sn);

    



    if (rect && !quiet && !noRing) {
      el.ring.classList.remove('hidden');
      


      el.ring.classList.toggle('nodim', !!(activeHint && activeHint.nodim));
      el.ring.style.left = rect.left + 'px';
      el.ring.style.top = rect.top + 'px';
      el.ring.style.width = rect.width + 'px';
      el.ring.style.height = rect.height + 'px';
    } else el.ring.classList.add('hidden');

    place(rect, quiet, side, avoid);
  }

  

  function wireClear(rect, to) {
    const st = document.getElementById('stage');
    if (!rect || !to || !st || !GG.render) return null;
    const sr = st.getBoundingClientRect();
    const z = (GG.render.uiZoom ? GG.render.uiZoom() : 1);
    const c = S.g.camera.scale * z;
    let x0 = rect.left, y0 = rect.top, x1 = rect.left + rect.width, y1 = rect.top + rect.height;
    const ns = S.machinesHere().filter(function (n) { return n.type === to; });
    if (!ns.length) return null;
    ns.forEach(function (n) {
      const sz = S.sizeOf(n), p = GG.render.toScreen(n.x, n.y);
      const px = sr.left + p.x * z, py = sr.top + p.y * z;
      x0 = Math.min(x0, px - sz.w * c / 2); x1 = Math.max(x1, px + sz.w * c / 2);
      y0 = Math.min(y0, py - sz.h * c / 2); y1 = Math.max(y1, py + sz.h * c / 2);
    });
    const g = 8;
    return ringSpace({ left: x0 - g, top: y0 - g, width: x1 - x0 + g * 2, height: y1 - y0 + g * 2,
                       right: x1 + g, bottom: y1 + g });
  }

  



  


  









  

















  let whyList = null;
  function whyHints() {
    if (C.tutorial.whyCards === false) return [];
    if (whyList) return whyList;
    whyList = Object.keys(C.nodeTypes).map(k => C.nodeTypes[k]).filter(t => t.why)
      .map(function (t) {
        return { id: 'why:' + t.id, whyNode: t.id,
                 get title() { return C.nodeTypes[t.id].name; },
                 get text() { return C.nodeTypes[t.id].why; } };
      });
    return whyList;
  }

  const whenBad = Object.create(null);
  function hintReady(h) {
    


    if (h.whyNode) {
      const wt = C.nodeTypes[h.whyNode];
      if (wt && wt.whyNeeds && GG.sim && GG.sim.demoNode && GG.sim.demoNode(wt.whyNeeds)) return false;
      return S.isUnlocked(h.whyNode);
    }
    

    const until = S.g.hintSnooze && S.g.hintSnooze[h.node || h.id];
    if (until && (S.g.playtime || 0) < until) return false;
    







    if (h.node) {
      const mn = C.tutorial.machineNotes;
      if (mn && mn.onBuild) return S.peakBuiltOf(h.node) > 0;
      return S.isUnlocked(h.node);
    }
    if (h.loc) return S.g.loc === h.loc;
    if (h.when) {
      try { return !!h.when(S.g, GG.sim, S); }
      catch (e) {
        



        if (!whenBad[h.id]) { whenBad[h.id] = 1; console.warn('[ReGen] hint "' + h.id + '" when() threw', e); }
        return false;
      }
    }
    return false;
  }

  





  let lastScan = 0, lastWhen = 0;
  T.checkUnlocks = function () {
    if (!C.tutorial.hints) return;
    S.g.hintsSeen = S.g.hintsSeen || {};
    const now = Date.now();
    const every = (C.tutorial.hintScanSec === undefined ? 1 : C.tutorial.hintScanSec) * 1000;
    const gap = (C.tutorial.hintGapSec === undefined ? 45 : C.tutorial.hintGapSec) * 1000;
    let doWhen = now - lastScan >= every;
    if (doWhen) lastScan = now;
    



    if (doWhen && lastWhen && now - lastWhen < gap) doWhen = false;
    





    if (running()) doWhen = false;
    
    C.tutorial.hintList.concat(whyHints()).forEach(function (h) {
      const key = h.node || h.id;
      





      if (h.off) return;
      if (h.needsTutor && S.g.tutorSkipped) return;
      



      if (h.node) {
        const keep = C.tutorial.machineNotes && C.tutorial.machineNotes.keep;
        if (keep && keep.indexOf(h.node) < 0) return;
      }
      if (!key || S.g.hintsSeen[key] || hintQueued[key]) return;
      if (h.when && !doWhen) return;
      if (!hintReady(h)) return;
      hintQueued[key] = true;                
      if (h.when) { lastWhen = now; doWhen = false; }
      hintQueue.push(h);
    });
  };

  function dismissHint(mode) {
    const h = activeHint;
    





    if (h && h.snooze && mode === 'later') {
      const key = h.node || h.id;
      if (S.g.hintsSeen) delete S.g.hintsSeen[key];
      



      delete hintQueued[key];
      S.g.hintSnooze = S.g.hintSnooze || {};
      const cw = GG.config.ciWarn || {};
      S.g.hintSnooze[key] = (S.g.playtime || 0) + (h.snoozeSec || cw.snoozeSec || 300);
    }
    activeHint = null;
    hide();
  }

  




  function fireHintAction(h) {
    if (!h || !h.action) return;
    if (h.action === 'rain') {
      const loc = h.loc || S.g.loc;
      
      if (!Sim.wxState(loc).id) Sim.startWeather('rain', loc);
    }
  }

  















  


  function showSoft(h) {
    const secs = C.tutorial.hintSoftSec === undefined ? 5 : C.tutorial.hintSoftSec;
    if (!(secs > 0)) return false;         
    softHint = h;
    el.soft.classList.remove('hidden');
    softUntil = Date.now() + secs * 1000;
    placeSoft();
    return true;
  }

  

  let softText = null;
  function placeSoft() {
    





    if (softHint && softHint.text !== softText) {
      softText = softHint.text;
      el.softTitle.textContent = softHint.title || '';
      el.softText.textContent = softHint.text || '';
    }
    const found = (softHint && softHint.anchor) ? resolve(softHint.anchor) : null;
    const dom = (found && found.dom) || null;
    if (dom !== softDom) {
      if (softDom) softDom.classList.remove('hint-glow');
      softDom = dom;
      if (softDom) softDom.classList.add('hint-glow');
    }
    const rect = found ? ringSpace(found.rect) : null;
    
    
    const z = (GG.render.uiZoom ? GG.render.uiZoom() : 1);
    const w = el.soft.offsetWidth || 300, h = el.soft.offsetHeight || 80;
    const M = 14, W = window.innerWidth / z, H = window.innerHeight / z;
    let x, y;
    if (!rect) { x = (W - w) / 2; y = M; }
    else {
      x = rect.left + rect.width / 2 - w / 2;
      


      const above = rect.top - h - M;
      y = above > M ? above : rect.bottom + M;
    }
    el.soft.style.left = U.clamp(x, M, Math.max(M, W - w - M)) + 'px';
    el.soft.style.top = U.clamp(y, M, Math.max(M, H - h - M)) + 'px';
  }

  function endSoft() {
    softHint = null; softUntil = 0; softText = null;
    if (el.soft) el.soft.classList.add('hidden');
    if (softDom) { softDom.classList.remove('hint-glow'); softDom = null; }
  }

  
  T.tick = function () {
    if (!el.card) return;
    







    if (GG.practice && GG.practice.active) { hide(); return; }
    T.checkUnlocks();

    

    if (softUntil) {
      if (Date.now() >= softUntil) endSoft();
      else placeSoft();
    }

    
    if (!activeHint && !softHint && hintQueue.length && !running()) {
      const next = hintQueue.shift();
      




      S.g.hintsSeen[next.node || next.id] = true;
      if (next.sound) GG.audio.play(next.sound);
      fireHintAction(next);
      if (!next.soft || !showSoft(next)) activeHint = next;
    }
    if (activeHint) {
      




      const ha = T.stepAnchor(activeHint);
      const hr = ha ? resolve(ha) : null;
      const hw = (!hr && activeHint.wires) ? wireBox() : null;
      paint(activeHint, hr ? ringSpace(hr.rect) : (hw ? ringSpace(hw) : null),
            0, 0, null, false, false, !!hw);
      return;
    }

    



    let guard = steps().length + 1;
    while (running() && guard-- > 0) {
      const st = current();
      if (!st) break;

      
      const quiet = waiting(st);

      
      if (!quiet && st.where === 'map') {
        const tree = document.getElementById('skilltree');
        if (tree && !tree.classList.contains('hidden')) GG.ui.toggleSkillTree();
      }
      
      
      if (st.boost && S.g.tutorChoice !== st.boost) S.g.tutorChoice = st.boost;

      
      if (st.action && !firedAction[st.id]) {
        firedAction[st.id] = true;
        if (st.action === 'spawnGem' && !S.g.gem) {
          S.g.gem = { fx: 0.5, fy: 0.42 };
          S.g.gemTimer = 0;
          Sim.events.push({ kind: 'gem' });
        }
      }

      if (stepDone(st)) { advance(); continue; }

      const found = quiet ? null : resolve(T.stepAnchor(st));
      

      const side = !!(found && found.dom && found.dom.closest && found.dom.closest('.skill'));
      


      const wb = (!found && !quiet && st.wires) ? wireBox() : null;
      
      const clear = (found && !quiet && C.tutorial.cardClearsWire !== false &&
                     st.done && st.done.kind === 'link' && st.done.to)
        ? wireClear(found.rect, st.done.to) : null;
      paint(st, found ? ringSpace(found.rect) : (wb ? ringSpace(wb) : null),
            idx() + 1, steps().length, progressOf(st), quiet, side, !!wb, clear);
      return;
    }
    if (!running()) hide();
  };
})(window.GG);
