(function (GG) {
  'use strict';
  const C = GG.config, S = GG.state, Sim = GG.sim, U = GG.util, IC = GG.icons;

  const UI = {};
  GG.ui = UI;

  let el = {};
  let selected = [];
  let treeOpen = false;
  let dockOpen = true;
  let activeTree = 'ci';

  const treePan = { x: 0, y: 0, z: 1 };
  const TREE_ZOOM = { min: 0.35, max: 1.3, step: 1.0015 };
  function applyTreePan() {
    if (!el.treeInner) return;
    el.treeInner.style.transformOrigin = '0 0';
    el.treeInner.style.transform =
      'translate(' + treePan.x + 'px,' + treePan.y + 'px) scale(' + treePan.z + ')';
    if (el.treeZoom) el.treeZoom.textContent = Math.round(treePan.z * 100) + '%';
  }

  let treeRoot = null;
  UI.centreTree = function () {
    const r = treeRoot, sc = el.treeScroll;
    if (!r || !sc) return;
    if (UI.stopTreeGlide) UI.stopTreeGlide();
    sc.scrollLeft = Math.max(0, treePan.x + (r.x + HEX_W / 2) * treePan.z - sc.clientWidth / 2);
    sc.scrollTop  = Math.max(0, treePan.y + (r.y + HEX_H / 2) * treePan.z - sc.clientHeight / 2);
  };

  let treeGlide = null;
  UI.stopTreeGlide = function () {
    if (treeGlide) { cancelAnimationFrame(treeGlide.raf); treeGlide = null; }
  };
  UI.glideTreeTo = function (sx, sy) {
    const sc = el.treeScroll, cfg = (C.ui || {}).treeRecentre || {};
    if (!sc || cfg.enabled === false) return;
    const maxL = Math.max(0, sc.scrollWidth - sc.clientWidth);
    const maxT = Math.max(0, sc.scrollHeight - sc.clientHeight);
    const toL = U.clamp(treePan.x + (sx + HEX_W / 2) * treePan.z - sc.clientWidth / 2, 0, maxL);
    const toT = U.clamp(treePan.y + (sy + HEX_H / 2) * treePan.z - sc.clientHeight / 2, 0, maxT);
    const fromL = sc.scrollLeft, fromT = sc.scrollTop;
    const dx = toL - fromL, dy = toT - fromT;

    const dead = (cfg.deadZone || 0) * Math.min(sc.clientWidth, sc.clientHeight);
    if (Math.abs(dx) <= dead && Math.abs(dy) <= dead) return;
    UI.stopTreeGlide();
    const ms = Math.max(1, cfg.ms || 420), t0 = performance.now();
    treeGlide = { raf: 0 };
    const step = function (now) {
      const k = Math.min(1, (now - t0) / ms);

      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      sc.scrollLeft = fromL + dx * e;
      sc.scrollTop = fromT + dy * e;
      if (k < 1) treeGlide.raf = requestAnimationFrame(step);
      else treeGlide = null;
    };
    treeGlide.raf = requestAnimationFrame(step);
  };

  UI.glideTreeToSkill = function (id) {
    const s = C.skills.find(x => x.id === id);
    if (!s || (s.tree || 'ci') !== activeTree) return;
    UI.glideTreeTo(s.x, s.y);
  };

  UI.treeZoomBy = function (factor, cx, cy) {
    const z0 = treePan.z;
    const z1 = U.clamp(z0 * factor, TREE_ZOOM.min, TREE_ZOOM.max);
    if (z1 === z0) return;
    UI.stopTreeGlide();

    treePan.x = cx - (cx - treePan.x) * (z1 / z0);
    treePan.y = cy - (cy - treePan.y) * (z1 / z0);
    treePan.z = z1;
    applyTreePan();
  };

  function treeStartZoom() {
    const z = (C.ui || {}).treeZoom || {};
    const touch = !!(GG.input && GG.input.touchUi && GG.input.touchUi());
    let v = (touch && z.touch != null) ? z.touch : z.def;
    if (typeof v !== 'number' || !isFinite(v) || v <= 0) v = 1;
    return U.clamp(v, TREE_ZOOM.min, TREE_ZOOM.max);
  }
  UI.treeStartZoom = treeStartZoom;
  UI.treeZoomReset = function () {
    const z = treeStartZoom();
    treePan.x = 0; treePan.y = 0; treePan.z = z; applyTreePan();

    if (z !== 1) UI.centreTree();
  };

  UI.relabel = function () {

    setTimeout(function () { if (UI.fitTreeHead) UI.fitTreeHead(); }, 0);

    if (GG.practice && GG.practice.relabel) GG.practice.relabel();
    const T = GG.i18n.t;
    const set = function (sel, txt) {
      const e = document.querySelector(sel);
      if (e) e.textContent = txt;
    };

    set('#topbar .cur-block.ci .cur-label', C.currencies.ci.name.toUpperCase());
    set('#topbar .cur-block.money .cur-label', C.currencies.money.name.toUpperCase());
    set('#topbar .cur-block.gem .cur-label', T('ui.diamonds'));
    set('#topbar .cur-block.prism .cur-label', T('ui.prisms'));
    set('#btn-goals span:not(.gb-ic):not(.tl-badge)', T('ui.goals'));
    set('#btn-save', T('ui.save'));
    set('#btn-menu', T('ui.menu'));
    const cx = document.getElementById('btn-codex');
    if (cx) cx.title = T('ui.codexTip');
    set('#btn-codex .cx-word', T('ui.codexWord'));
    set('#btn-find .fd-word', T('ui.findWord'));
    const fb = document.getElementById('btn-find');
    if (fb) fb.title = T('ui.findTip');
    const fi = document.querySelector('#find-pop input');
    if (fi) fi.placeholder = T('ui.findPh');

    set('.dock-toggle .dt-label', T('ui.build'));
    const find = document.getElementById('dock-find-input');
    if (find) { find.placeholder = T('ui.dockFind'); find.title = T('ui.dockFindTip'); }
    set('#tree-launch .tl-btn.ci .tl-label', T('ui.ciSkills'));
    set('#tree-launch .tl-btn.money .tl-label', T('ui.moneySkills'));
    set('#boost-launch .tl-btn.gem .tl-label', T('ui.boosts'));
    set('#bp-launch .tl-label', T('ui.blueprints'));

    set('#skilltree .tree-head h2', T('ui.skillTree'));
    set('.tree-tab[data-tree="ci"]', C.currencies.ci.name);
    set('.tree-tab[data-tree="money"]', C.currencies.money.name);
    set('#tree-tab-sum', T('ts.tab'));

    const sumTab = document.getElementById('tree-tab-sum');
    if (sumTab) sumTab.classList.toggle('hidden', !(C.treeSummary && C.treeSummary.enabled));
    set('.tz-btn.wide', T('ui.fit'));
    const closeKind = (C.ui && C.ui.closeButton) || 'chip';
    const closeTouch = GG.input && GG.input.touchUi && GG.input.touchUi();
    document.querySelectorAll('#tree-close, #pn-close').forEach(function (b) {
      b.innerHTML = closeKind === 'icon' ? GG.icons.svg('close', 16)
        : T('ui.close') + (closeKind === 'chip' ? ' <kbd>Esc</kbd>' : '');
      b.title = (closeKind === 'icon' || closeKind === 'tooltip') && !closeTouch ? T('ui.close') + ' (Esc)' : '';
      b.classList.toggle('close-x', closeKind === 'icon');
      if (closeKind === 'icon') b.setAttribute('aria-label', T('ui.close')); else b.removeAttribute('aria-label');
    });

    set('#pn-title', T('ui.boostsCaps'));

    ['ci-rate', 'money-rate'].forEach(function (k) {
      const e = document.getElementById(k);

      const st = !!(((C.ui || {}).stats) || {}).enabled;
      if (e) { e.title = T('ui.afkTip') + (st ? ' ' + T('ui.statsTip') : ''); e.classList.toggle('st-link', st); }
    });
  };

  UI.init = function () {
    const id = x => document.getElementById(x);
    el = {
      ci: id('ci-value'), ciRate: id('ci-rate'),
      money: id('money-value'), moneyRate: id('money-rate'),
      palette: id('palette'), dock: id('dock'), dockToggle: id('dock-toggle'),
      inspector: id('inspector'), toasts: id('toasts'), sparks: id('sparks'),
      tree: id('skilltree'), treeInner: id('tree-inner'), treeSvg: id('tree-links'),
      treeCI: id('tree-ci'), treeMoney: id('tree-money'), treeNote: id('tree-note'),
      treeZoom: id('tree-zoom-pct'),
      btnCodex: id('btn-codex'),
      gemValue: id('gem-value'), prismValue: id('prism-value'), btnGoals: id('btn-goals'),
      gemLayer: id('gem-layer'), boostBar: id('boost-bar'), stage: id('stage'),
      panel: id('panel'), pnTitle: id('pn-title'), pnBank: id('pn-bank'),
      pnBody: id('pn-body'), pnNote: id('pn-note'), pnIc: document.querySelector('.pn-ic'),
      goalBadge: id('goal-badge'), ciBadge: id('ci-badge'), btnSound: id('btn-sound'),
    };

    const tq = (C.ui || {}).tbQuiet;
    if (tq && tq.enabled && tq.rates !== false) {
      document.body.classList.add('tb-quiet');
      [el.ciRate, el.moneyRate].forEach(function (r) {
        const box = r && r.previousElementSibling;
        if (box) box.appendChild(r);
      });
    }
    el.btnCodex.innerHTML = tq && tq.enabled && tq.codexWord !== false
      ? IC.svg('codexBook', 16) + '<span class="cx-word"></span>' : IC.svg('help', 16);
    if (tq && tq.enabled && tq.codexWord !== false) el.btnCodex.classList.add('cx-worded');
    const fbtn = document.getElementById('btn-find');
    if (fbtn) fbtn.innerHTML = IC.svg('find', 16);
    el.dockToggle.querySelector('.dt-chev').innerHTML = IC.svg('chevron', 15);
    UI.relabel();
    initDockTip();

    const CUR_ICON = { ci: 'ci', money: 'coin', gem: 'diamond' };
    document.querySelectorAll('#topbar .cur-block').forEach(function (b) {
      if (b.classList.contains('prism')) {
        b.querySelector('.cur-ic').innerHTML = UI.prismSvg(22);
        b.addEventListener('pointerdown', prismDragStart);
        return;
      }
      const key = Object.keys(CUR_ICON).find(k => b.classList.contains(k));
      b.querySelector('.cur-ic').innerHTML = IC.svg(CUR_ICON[key], 21);
    });
    el.btnGoals.querySelector('.gb-ic').innerHTML = IC.svg('goals', 15);
    el.btnGoals.onclick = function () { UI.openPanel(UI.goalsHome()); };

    function paintSound() {
      const on = C.audio.enabled;
      el.btnSound.innerHTML = IC.svg(on ? 'sound' : 'mute', 16);
      el.btnSound.classList.toggle('off', !on);
    }
    el.btnSound.onclick = function () {
      GG.audio.toggle();
      paintSound();
      if (C.audio.enabled) GG.audio.play('click');
    };
    paintSound();

    document.querySelectorAll('#tree-launch .tl-btn[data-tree]').forEach(function (b) {
      const tree = b.dataset.tree;
      b.querySelector('.tl-ic').innerHTML = IC.svg(tree === 'money' ? 'money' : 'recycler', 20);
      b.onclick = function () { UI.openTree(tree); };
    });
    UI.applyGlass();
    UI.applySkin();
    document.body.classList.toggle('cur-one', (C.ui || {}).oneCursor !== false);
    UI.applyLayout();

    document.addEventListener('wheel', wheelX, { passive: false });

    const PANEL_ICON = { goals: 'goals', boosts: 'boost', blueprints: 'merge' };
    document.querySelectorAll('.tl-btn[data-panel]').forEach(function (b) {
      const kind = b.dataset.panel;
      b.querySelector('.tl-ic').innerHTML = IC.svg(PANEL_ICON[kind] || 'boost', 20);
      b.onclick = function () { UI.openPanel(kind); };
    });
    UI.syncLaunchers();

    if (C.tutorial && C.tutorial.dim !== undefined) {
      document.documentElement.style.setProperty('--tutor-dim', String(C.tutorial.dim));
    }
    UI.applyDockAnim();
    UI.applyToastSkin();
    id('pn-close').onclick = UI.closePanel;
    el.panel.addEventListener('mousedown', function (e) {
      if (e.target === el.panel) UI.closePanel();
    });

    id('btn-stuck').onclick = UI.gotoStuck;
    id('btn-save').onclick = function () { S.save(true); UI.toast('Saved'); };
    id('btn-home').onclick = function () { GG.input.centreView(); };

    id('btn-menu').onclick = function () { GG.audio.play('click'); GG.input.escape(); };
    id('tree-close').onclick = UI.toggleSkillTree;
    el.btnCodex.onclick = function () { GG.audio.play('click'); UI.openPanel('codex'); };
    initFind();
    el.dockToggle.onclick = function () {

      if (dockOpen && ((C.ui || {}).dockBack || {}).buildAgain && UI.dockBack()) return;
      setDockOpen(!dockOpen);
    };
    document.body.classList.toggle('dock-pin', !!((C.ui || {}).dockBack || {}).pin);
    el.ciRate.onclick = UI.openStats;
    el.moneyRate.onclick = UI.openStats;
    initDockFind();
    document.querySelectorAll('.tree-tab').forEach(function (b) {
      b.onclick = function () { UI.showTree(b.dataset.tree); };
    });

    const scroll = document.querySelector('.tree-scroll');
    el.treeScroll = scroll;
    let treeDrag = null;
    scroll.addEventListener('mousedown', function (e) {
      const onHex = e.target && e.target.closest && e.target.closest('.skill');
      if (e.button !== 1 && !(e.button === 0 && !onHex)) return;
      e.preventDefault();
      UI.stopTreeGlide();

      treeDrag = (activeTree === 'summary')
        ? { x: e.clientX, y: e.clientY, sl: scroll.scrollLeft, st: scroll.scrollTop, doc: true }
        : { x: e.clientX, y: e.clientY, ox: treePan.x, oy: treePan.y };
      scroll.classList.add('grabbing');
    });
    window.addEventListener('mousemove', function (e) {
      if (!treeDrag) return;
      if (treeDrag.doc) {
        scroll.scrollLeft = treeDrag.sl - (e.clientX - treeDrag.x);
        scroll.scrollTop  = treeDrag.st - (e.clientY - treeDrag.y);
        return;
      }
      treePan.x = treeDrag.ox + (e.clientX - treeDrag.x);
      treePan.y = treeDrag.oy + (e.clientY - treeDrag.y);
      applyTreePan();
    });
    window.addEventListener('mouseup', function () {
      if (!treeDrag) return;
      treeDrag = null;
      scroll.classList.remove('grabbing');
    });
    scroll.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault(); });

    function boardPoint(cx, cy) {
      const r = scroll.getBoundingClientRect();
      return { x: cx - r.left + scroll.scrollLeft, y: cy - r.top + scroll.scrollTop };
    }
    const fingerGap = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const fingerMid = (a, b) =>
      boardPoint((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);

    let boardTouch = null;
    const touchOn = () => { const T = C.touch || {}; return !!(T.enabled && T.board); };

    if (touchOn()) scroll.style.touchAction = 'none';

    scroll.addEventListener('touchstart', function (e) {
      if (!touchOn()) return;
      UI.stopTreeGlide();
      if (e.touches.length === 2) {
        e.preventDefault();
        const a = e.touches[0], b = e.touches[1];
        boardTouch = { mode: 'pinch', d0: fingerGap(a, b), z0: treePan.z,
                       mid: fingerMid(a, b) };
        return;
      }
      if (e.touches.length !== 1 || (boardTouch && boardTouch.mode === 'pinch')) return;
      const t = e.touches[0];

      if (t.target && t.target.closest && t.target.closest('.skill')) return;
      boardTouch = { mode: 'maybe', x: t.clientX, y: t.clientY,
                     ox: treePan.x, oy: treePan.y, moved: 0 };
    }, { passive: false });

    scroll.addEventListener('touchmove', function (e) {
      if (!boardTouch || !touchOn()) return;

      if (boardTouch.mode === 'pinch') {
        if (e.touches.length < 2) return;
        e.preventDefault();
        const a = e.touches[0], b = e.touches[1];
        const mid = fingerMid(a, b);

        treePan.x += mid.x - boardTouch.mid.x;
        treePan.y += mid.y - boardTouch.mid.y;
        boardTouch.mid = mid;
        applyTreePan();
        if (boardTouch.d0 > 0) {
          const want = U.clamp(boardTouch.z0 * (fingerGap(a, b) / boardTouch.d0),
                               TREE_ZOOM.min, TREE_ZOOM.max);

          if (want !== treePan.z) UI.treeZoomBy(want / treePan.z, mid.x, mid.y);
        }
        return;
      }

      const t = e.touches[0];
      if (!t) return;
      boardTouch.moved = Math.max(boardTouch.moved,
        Math.hypot(t.clientX - boardTouch.x, t.clientY - boardTouch.y));
      if (boardTouch.moved <= ((C.touch || {}).tapSlop || 0)) return;
      e.preventDefault();
      if (boardTouch.mode !== 'pan') { boardTouch.mode = 'pan'; scroll.classList.add('grabbing'); }
      treePan.x = boardTouch.ox + (t.clientX - boardTouch.x);
      treePan.y = boardTouch.oy + (t.clientY - boardTouch.y);
      applyTreePan();
    }, { passive: false });

    function endBoardTouch(e) {
      if (!boardTouch) return;

      if (boardTouch.mode === 'pinch' && e.touches && e.touches.length >= 2) return;
      boardTouch = null;
      scroll.classList.remove('grabbing');
    }
    scroll.addEventListener('touchend', endBoardTouch);
    scroll.addEventListener('touchcancel', endBoardTouch);

    scroll.addEventListener('wheel', function (e) {
      if (activeTree === 'summary') return;
      const zoomMode = ((C.ui || {}).treeWheel) !== 'scroll';

      if (zoomMode === !!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const r = scroll.getBoundingClientRect();
      UI.treeZoomBy(Math.pow(TREE_ZOOM.step, -e.deltaY),
                    e.clientX - r.left + scroll.scrollLeft,
                    e.clientY - r.top + scroll.scrollTop);
    }, { passive: false });
    document.querySelectorAll('#tree-zoom [data-z]').forEach(function (b) {
      b.onclick = function () {
        const r = el.treeScroll.getBoundingClientRect();
        const cx = r.width / 2 + el.treeScroll.scrollLeft;
        const cy = r.height / 2 + el.treeScroll.scrollTop;
        if (b.dataset.z === 'reset') UI.treeZoomReset();
        else UI.treeZoomBy(parseFloat(b.dataset.z), cx, cy);
        GG.audio.play('click');
      };
    });

    UI.buildDevBar();
    UI.buildPlaces();
    UI.refreshPalette();
    UI.buildTree();
    UI.renderInspector();
  };

  UI.speed = 1;

  let devHidden = false;
  UI.devHidden = function () { return devHidden; };
  UI.setDevHidden = function (v, persist) {
    devHidden = !!v;
    const bar = document.getElementById('devbar');
    if (bar) bar.classList.toggle('hidden', devHidden || !C.dev.enabled);

    if (GG.render && GG.render.resize) GG.render.resize();
    if (persist !== false && GG.menu && GG.menu.saveSettings) GG.menu.saveSettings();
  };
  UI.devBar = function (on) { UI.setDevHidden(!on); };

  UI.buildDevBar = function () {
    const bar = document.getElementById('devbar');
    if (!C.dev.enabled) { bar.classList.add('hidden'); return; }
    bar.innerHTML = '<span class="dv-label">DEV &middot; GAME SPEED</span>';
    C.dev.speeds.forEach(function (s) {
      const b = document.createElement('button');
      b.className = 'dv-btn';
      b.dataset.speed = s;
      b.textContent = s + '×';
      b.onclick = function () { UI.setSpeed(s); GG.audio.play('click'); };
      bar.appendChild(b);
    });
    const note = document.createElement('span');
    note.className = 'dv-note';
    note.textContent = 'scales the simulation clock only';
    bar.appendChild(note);

    if ((C.dev.grants || []).length) {
      const lab = document.createElement('span');
      lab.className = 'dv-label dv-sep';
      lab.textContent = 'GRANT';
      bar.appendChild(lab);
      C.dev.grants.forEach(function (gr) {
        const cur = C.currencies[gr.cur];
        const b2 = document.createElement('button');
        b2.className = 'dv-btn dv-gr';
        b2.style.setProperty('--c', cur.color || '#8296ab');

        b2.innerHTML = '+' + U.cur(gr.cur, gr.amount);
        b2.title = 'Add ' + U.fmt(gr.amount) + ' ' + cur.name + ' to the bank';
        b2.onclick = function () {
          GG.audio.play('claim');
          S.earn(gr.cur, gr.amount);

          Sim.invalidate(); UI.refreshPalette(); UI.buildTree();
          UI.toast('+' + U.cur(gr.cur, gr.amount));
        };
        bar.appendChild(b2);
      });
    }

    if (GG.pace && GG.pace.on()) {
      const lab = document.createElement('span');
      lab.className = 'dv-label dv-sep';
      lab.textContent = 'PACING';
      bar.appendChild(lab);

      const proj = document.createElement('button');
      proj.className = 'dv-btn dv-pace';
      const hrs = (C.pacing.forwardHours || 20);
      proj.textContent = 'PROJECT ' + hrs + 'h';
      proj.title = 'Run the real simulation forward ' + hrs + ' hours on a COPY of this ' +
                   'save, buying greedily and building nothing, then print when each ' +
                   'skill first became affordable. Your run is not touched.';
      proj.onclick = function () {
        GG.audio.play('click');
        UI.toast('Projecting ' + hrs + 'h — this freezes for a moment');

        setTimeout(function () {
          const r = GG.pace.forward(hrs);
          if (!r.ok) { UI.toast(r.why, true); return; }
          GG.pace.report(r);
          UI.toast('Projected ' + hrs + 'h in ' + r.msTaken + 'ms — ' +
                   r.levels + '/' + r.maxLevels + ' levels. See the console.');
        }, 30);
      };
      bar.appendChild(proj);

      const dump = document.createElement('button');
      dump.className = 'dv-btn dv-pace';
      dump.textContent = 'LOG';
      dump.title = 'Print the pacing this run has ACTUALLY recorded as you played it';
      dump.onclick = function () {
        GG.audio.play('click');
        const r = GG.pace.report();
        UI.toast(r.reached + ' levels reached, ' + r.unreached + ' still out of reach');
      };
      bar.appendChild(dump);
    }

    if (GG.devinfo && GG.devinfo.on()) {
      const lab = document.createElement('span');
      lab.className = 'dv-label dv-sep';
      lab.textContent = 'DATA';
      bar.appendChild(lab);
      const b3 = document.createElement('button');
      b3.className = 'dv-btn dv-data';
      b3.textContent = 'MACHINE DATA';
      b3.title = 'Every machine and material with the numbers worked out: ratios, what a ' +
                 'kilogram costs to make and what it sells for, the whole chain back to the ' +
                 'ground, and what the next batch of a recipe machine wants';
      b3.onclick = function () { GG.audio.play('click'); GG.devinfo.toggle(); };
      bar.appendChild(b3);
    }

    if (C.dev.weather) {
      const lab = document.createElement('span');
      lab.className = 'dv-label dv-sep';

      lab.innerHTML = 'WEATHER &middot; <i class="dv-wx-loc">?</i>';
      bar.appendChild(lab);
      C.weather.events.forEach(function (e) {
        const b = document.createElement('button');
        b.className = 'dv-btn dv-wx';
        b.dataset.wx = e.id;
        b.style.setProperty('--c', e.color);
        b.innerHTML = '<span class="dv-wx-ic">' + IC.svg(e.icon, 13) + '</span>' + e.name;
        b.title = Sim.wxDesc(e);
        b.onclick = function () {
          GG.audio.play('click');

          const loc = Sim.wxPlace(S.g.loc) ? S.g.loc : Sim.wxLocs()[0];
          Sim.clearWeather(loc);
          Sim.startWeather(e.id, loc);
        };
        bar.appendChild(b);
      });
      const clr = document.createElement('button');
      clr.className = 'dv-btn';
      clr.textContent = 'Clear';
      clr.onclick = function () { GG.audio.play('click'); Sim.clearWeather(); };
      bar.appendChild(clr);

      const sky = document.createElement('span');
      sky.className = 'dv-label dv-sep'; sky.textContent = 'SKY';
      bar.appendChild(sky);
      [['day', 'Day'], ['night', 'Night'], [null, 'Real']].forEach(function (p) {
        const b = document.createElement('button');
        b.className = 'dv-btn'; b.textContent = p[1];
        b.title = 'Hold the map in ' + (p[0] || 'the real sun') + '. The picture only: solar panels keep the real sun';
        b.onclick = function () { GG.audio.play('click'); GG.render.nightHold = p[0]; };
        bar.appendChild(b);
      });

      const rk = document.createElement('button');
      rk.className = 'dv-btn dv-wx';
      rk.style.setProperty('--c', '#cbbb96');
      rk.innerHTML = '<span class="dv-wx-ic">' + IC.svg('meteor', 13) + '</span>Drop';
      rk.title = 'Drop a meteorite where they fall (the three-at-once cap still applies)';
      rk.onclick = function () {
        GG.audio.play('click');
        const here = Sim.rockPlace(S.g.loc) ? S.g.loc
                   : (Sim.rockLocs().map(function (e) { return e.loc; })
                      .filter(function (l) { return S.g.locSpawned && S.g.locSpawned[l]; })[0]);
        if (!here) return UI.toast('Nowhere for one to fall', true);
        if (!Sim.rockDrop(here)) UI.toast('No room for another one', true);
      };
      bar.appendChild(rk);
    }

    const x = document.createElement('button');
    x.className = 'dv-btn dv-x';
    x.textContent = '✕';
    x.title = 'Hide the dev strip — press ` to bring it back';
    x.onclick = function () {
      GG.audio.play('click');
      UI.setDevHidden(true);
      UI.toast(GG.i18n.t('ui.devHidden'));
    };
    bar.appendChild(x);
    bar.classList.toggle('hidden', devHidden);
    UI.setSpeed(1);
  };
  UI.setSpeed = function (s) {
    UI.speed = s;
    document.querySelectorAll('#devbar .dv-btn').forEach(function (b) {
      b.classList.toggle('on', parseFloat(b.dataset.speed) === s);
    });
  };

  let placesKey = '';

  UI.applyGlass = function () {
    document.body.classList.toggle('glass', (C.ui || {}).glass !== false);
  };

  UI.skinChoice = function () {
    const cfg = (C.ui || {}).skinChoice;
    if (!cfg || cfg.enabled === false) return 'new';
    const live = GG.menu && GG.menu.skinChoice;
    return (cfg.options || []).indexOf(live) >= 0 ? live : (cfg.def || 'new');
  };

  UI.applySkin = function () {
    const s = (C.ui || {}).skin || {};

    const on = s.enabled !== false && UI.skinChoice() === 'new';
    const cl = document.body.classList, r = document.documentElement.style;

    cl.toggle('sk-corners', on && s.corners !== false);
    cl.toggle('sk-cornerlist', on && s.corners !== false && s.cornerList === true);
    cl.toggle('sk-edges',   on && s.edges   !== false);
    cl.toggle('sk-grain',   on && s.grain   !== false);

    cl.toggle('try-loud', (C.ui || {}).tryQuiet === false);

    const tintOn = (s.tint !== undefined ? s.tint : s.warm) !== false;
    cl.toggle('sk-tint',    on && tintOn);
    cl.toggle('sk-display', on && s.display !== false);

    const WARM = ['bg', 'panel', 'panel2', 'text', 'muted', 'tbA', 'tbB', 'tcA', 'tcB',
                  'panelRgb', 'panel2Rgb', 'raiseRgb', 'floorRgb', 'sunkRgb',
                  'voidRgb', 'bgRgb'];
    const wkey = k => '--skw-' + k.replace(/[A-Z]/g, c => '-' + c.toLowerCase());

    const keys = ['--sk-r1', '--sk-r2', '--sk-r3', '--sk-r4',
                  '--sk-seam', '--sk-crown', '--sk-grain-img'].concat(WARM.map(wkey));
    if (!on) { keys.forEach(k => r.removeProperty(k)); return; }

    const w = Object.assign({}, ((s.tones || {})[s.tone] || {}), s.warmth || {});
    WARM.forEach(k => {
      if (w[k] === undefined) r.removeProperty(wkey(k));
      else r.setProperty(wkey(k), w[k]);
    });

    const rad = s.radius || {};
    if (rad.r1 !== undefined) r.setProperty('--sk-r1', rad.r1 + 'px');
    if (rad.r2 !== undefined) r.setProperty('--sk-r2', rad.r2 + 'px');
    if (rad.r3 !== undefined) r.setProperty('--sk-r3', rad.r3 + 'px');
    if (rad.r4 !== undefined) r.setProperty('--sk-r4', rad.r4 + 'px');
    if (s.seam)  r.setProperty('--sk-seam',  s.seam);
    if (s.crown) r.setProperty('--sk-crown', s.crown);

    const t = s.grainTile || 140, a = s.grainAlpha, f = s.grainFreq, oc = s.grainOctaves;
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + t + "' height='" + t +
      "'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='" +
      (f === undefined ? 0.82 : f) + "' numOctaves='" + (oc === undefined ? 3 : oc) +
      "' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23g)' opacity='" +
      (a === undefined ? 0.035 : a) + "'/></svg>";
    r.setProperty('--sk-grain-img', 'url("data:image/svg+xml;utf8,' + svg + '")');
  };

  UI.colourBlind = function () {
    const cfg = (C.ui || {}).colourBlind;
    if (!cfg || cfg.enabled === false) return 'off';
    const live = GG.menu && GG.menu.colourBlind;
    return (cfg.options || []).indexOf(live) >= 0 ? live : (cfg.def || 'off');
  };
  let cbSpots = null, cbTokens = null, cbNow = 'off';
  function cbRecord() {
    const cfg = C.ui.colourBlind, seen = new WeakSet(), HEX = /^#[0-9a-f]{6}$/i;
    cbSpots = [];
    (function walk(o, d) {
      if (!o || typeof o !== 'object' || seen.has(o) || d > 10 || o === cfg) return;
      seen.add(o);
      Object.keys(o).forEach(function (k) {
        const v = o[k];
        if (typeof v === 'string' && HEX.test(v)) cbSpots.push([o, k, v, v.toLowerCase()]);
        else if (v && typeof v === 'object') walk(v, d + 1);
      });
    })(C, 0);
    const cs = getComputedStyle(document.documentElement);
    cbTokens = (cfg.tokens || []).map(function (n) { return [n, (cs.getPropertyValue(n) || '').trim().toLowerCase()]; })
      .filter(function (x) { return HEX.test(x[1]); });
  }
  UI.applyColourBlind = function () {
    const mode = UI.colourBlind();
    if (mode === cbNow) return;
    if (!cbSpots) cbRecord();
    cbNow = mode;
    const map = (C.ui.colourBlind.palettes || {})[mode] || {}, r = document.documentElement.style;
    cbSpots.forEach(function (s) { s[0][s[1]] = map[s[3]] || s[2]; });
    cbTokens.forEach(function (t) { if (map[t[1]]) r.setProperty(t[0], map[t[1]]); else r.removeProperty(t[0]); });
    try { if (el && el.palette) UI.refreshPalette(); } catch (e) {}
    try { UI.rebuildInspector(); } catch (e) {}
  };

  UI.applyLayout = function () {
    const bl = document.getElementById('boost-launch'), pos = (C.ui || {}).boostLauncher;
    if (bl && pos) {
      if (pos.left !== undefined)   bl.style.left = pos.left + 'px';
      if (pos.bottom !== undefined) bl.style.bottom = pos.bottom + 'px';
    }
    const rail = document.getElementById('left-rail'), lr = (C.ui || {}).leftRail;
    if (rail && lr) {
      if (lr.left !== undefined)      rail.style.setProperty('--rail-left', lr.left + 'px');
      if (lr.top !== undefined)       rail.style.setProperty('--rail-top', lr.top + 'px');
      if (lr.gap !== undefined)       rail.style.setProperty('--rail-gap', lr.gap + 'px');
      if (lr.planWidth !== undefined) rail.style.setProperty('--plan-w', lr.planWidth + 'px');
      rail.style.setProperty('--plan-top', planTop() + 'px');
    }
    fitLaunchMatch();

    if (UI.fitTreeHead) UI.fitTreeHead();
    if (UI.fitHud) UI.fitHud();
    return { boostLauncher: C.ui.boostLauncher, leftRail: C.ui.leftRail,
             planTopNow: planTop() };
  };

  function planTop() {
    const lr = (C.ui || {}).leftRail || {};
    const want = lr.planTop === undefined ? 58 : lr.planTop;
    const bar = document.getElementById('places'), stage = document.getElementById('stage');
    if (!bar || !stage || bar.classList.contains('hidden')) return want;
    const z = GG.render.uiZoom ? GG.render.uiZoom() : 1;
    const bb = bar.getBoundingClientRect(), sb = stage.getBoundingClientRect();
    if (!bb.width) return want;
    const left = (lr.left === undefined ? 16 : lr.left);
    const barLeft = (bb.left - sb.left) / z;
    if (barLeft >= left + (lr.planWidth === undefined ? 320 : lr.planWidth)) return want;
    const clear = (bb.bottom - sb.top) / z - (lr.top === undefined ? 14 : lr.top) + 4;
    return Math.max(want, Math.round(clear));
  }

  UI.buildPlaces = function () {
    const bar = document.getElementById('places');
    const open = S.openLocations();

    const stg = Sim.reviveOn() ? open.map(l => Sim.reviveStage(l.id)).join('') : '';

    const isNew = open.map(l => S.isNewPlace(l.id) ? '1' : '0').join('');

    const bars = ((C.ui || {}).placeBars || {}).enabled && Sim.reviveOn();
    const pcts = bars ? open.map(l => Math.floor(Sim.reviveProgress(l.id) * 100)).join(',') : '';
    const key = open.map(l => l.id).join(',') + '|' + S.g.loc + '|' + stg + '|' + pcts +
                '|' + isNew + '|' + GG.i18n.lang();
    if (key === placesKey) return;
    placesKey = key;

    bar.classList.toggle('hidden', open.length < 2);
    bar.classList.toggle('pl-equal', !!(bars && (C.ui.placeBars || {}).equal));
    bar.innerHTML = '';
    open.forEach(function (L) {
      const b = document.createElement('button');

      b.className = 'pl-btn' + (L.id === S.g.loc ? ' on' : '') +
                    (S.isNewPlace(L.id) ? ' pl-new' : '') + (bars ? ' pl-bars' : '');
      b.title = L.desc;
      if (bars) {

        const pct = Math.floor(Sim.reviveProgress(L.id) * 100), done = Sim.reviveProgress(L.id) >= 0.999;
        b.classList.toggle('done', done);
        b.title = L.desc + '  ' + GG.i18n.t('ui.healedPct').replace('%p', pct);
        b.innerHTML = '<span class="pl-ic">' + IC.svg(L.icon, 18) +
          (S.isNewPlace(L.id) ? '<i class="pl-dot"></i>' : '') + '</span>' + L.name +
          (done ? '<span class="pl-ok">' + IC.svg('tick', 11, null, 3) + '</span>' : '') +
          '<span class="pl-bar"><i style="width:' + pct + '%"></i></span>';
        b.style.setProperty('--c', L.color);
        b.dataset.loc = L.id;
        b.onclick = function () { UI.flyTo(L.id); };
        bar.appendChild(b);
        return;
      }

      const st = Sim.reviveOn()
        ? '<span class="pl-st">' + Sim.reviveStage(L.id) + '/' + Sim.reviveStages() + '</span>'
        : '';
      b.innerHTML = '<span class="pl-ic">' + IC.svg(L.icon, 18) + '</span>' + L.name + st +
                    (S.isNewPlace(L.id)
                      ? '<span class="pl-tag">' + GG.i18n.t('ui.newTag') + '</span>' : '');
      b.style.setProperty('--c', L.color);
      b.dataset.loc = L.id;
      b.onclick = function () { UI.flyTo(L.id); };
      bar.appendChild(b);
    });

    UI.applyLayout();
  };

  UI.wxTold = function (loc) {
    const w = C.wxNotice;
    if (!w || w.enabled === false) return true;
    const mode = (GG.menu && GG.menu.wxNotice) || w.def;
    if (mode === 'off') return false;
    if (mode === 'here') return loc === S.g.loc;
    return true;
  };

  function mastTold(loc) {
    const w = C.wxNotice;
    if (!w || w.enabled === false || w.mast === false) return true;
    return UI.wxTold(loc);
  }

  let wxSoundLoc = null;
  UI.syncWeatherSound = function () {

    if (GG.menu && GG.menu.isOpen()) { GG.audio.leaveWeather(); wxSoundLoc = null; return; }

    if (wxSoundLoc !== null && wxSoundLoc !== S.g.loc && GG.audio.cutWeather) GG.audio.cutWeather();
    wxSoundLoc = S.g.loc;

    const devLoc = document.querySelector('.dv-wx-loc');
    if (devLoc) {
      const l = S.locationById(Sim.wxPlace(S.g.loc) ? S.g.loc : Sim.wxLocs()[0]);
      devLoc.textContent = (l ? l.name : '—').toUpperCase();
    }

    const w = Sim.weather();

    if (w && w.sound) GG.audio.ambience(w.sound, Math.max(0, (w.sec || 0) - Sim.wxLeft()));
    else GG.audio.ambienceStop();
  };

  let stuckList = [], stuckAt = 0, stuckIdx = -1;
  UI.syncStuck = function (force) {
    const el2 = document.getElementById('btn-stuck');
    if (!el2) return;
    if (!C.diagnose.enabled || !C.diagnose.counter) { el2.classList.add('hidden'); return; }

    const now = performance.now();

    if (!force && now - stuckAt < C.diagnose.scanSec * 1000) return;
    stuckAt = now;
    stuckList = Sim.stuckNodes();
    const n = stuckList.length;
    el2.classList.toggle('hidden', n === 0);
    if (!n) { stuckIdx = -1; return; }
    document.getElementById('stuck-count').textContent = n;
    document.getElementById('stuck-label').textContent = GG.i18n.t('ui.stopped');
    el2.title = GG.i18n.t('ui.stoppedTip');

    const ai = !!((C.ui || {}).freshLooks || {}).attnIcon;
    if (ai && !el2.querySelector('.attn-ic')) {
      const sp = document.createElement('span'); sp.className = 'attn-ic'; sp.innerHTML = IC.svg('attention', 15);
      el2.insertBefore(sp, el2.firstChild);
    }
    el2.classList.toggle('attn-icon', ai);
  };
  UI.gotoStuck = function () {
    stuckList = Sim.stuckNodes();
    if (!stuckList.length) return;
    stuckIdx = (stuckIdx + 1) % stuckList.length;
    const hit = stuckList[stuckIdx], n = hit.node;
    const loc = n.loc || C.locations[0].id;
    if (loc !== S.g.loc) UI.flyTo(loc);

    S.g.camera.x = n.x;
    S.g.camera.y = n.y;
    UI.selectNode(n);
    UI.toast(GG.i18n.ins(hit.why));
  };

  UI.flyTo = function (id) {
    const res = S.goTo(id);
    if (!res.ok) return;
    GG.audio.play('travel');
    UI.syncWeatherSound();
    UI.selectNode(null);

    if (!GG.input.movingGhost()) GG.input.cancelPlacing();
    placesKey = '';
    UI.buildPlaces();
    UI.refreshPalette();
    const stage = document.getElementById('stage');

    if (!GG.render.travelStart()) {
      stage.classList.remove('flying');
      void stage.offsetWidth;
      stage.classList.add('flying');
      setTimeout(() => stage.classList.remove('flying'), 480);
    }
    if (C.ui.arriveToast) UI.toast('Arrived at ' + res.location.name);

    Sim.gemFollow();
    UI.syncGem();
  };

  function buildableTypes() {
    return Object.keys(C.nodeTypes).filter(k => C.nodeTypes[k].buildable && S.isUnlocked(k));
  }

  UI.hotkeyOrder = function () {
    const out = [];
    const q = findQuery();
    const cats = (!q && UI.dockTiered() && dockSection !== null)
      ? C.categories.filter(c => c.id === dockSection)
      : C.categories;
    const types = buildableTypes().filter(k => !q || findMatch(k, q));
    cats.forEach(cat => {
      types.forEach(k => { if (C.nodeTypes[k].category === cat.id) out.push(k); });
    });
    return out;
  };

  let dockQuery = '';
  function findCfg() { return (C.ui && C.ui.dockSearch) || {}; }
  function dockFindOn() {
    const o = findCfg();
    return !!o.enabled && buildableTypes().length >= (o.minMachines || 0);
  }
  function findNorm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е'); }
  function findQuery() { return dockFindOn() ? findNorm(dockQuery.trim()) : ''; }
  function findMatch(k, q) {
    const t = C.nodeTypes[k];
    const cat = C.categories.find(c => c.id === t.category);
    return findNorm(t.name).indexOf(q) >= 0 || (!!cat && findNorm(cat.name).indexOf(q) >= 0);
  }

  function syncFind() {
    const box = document.getElementById('dock-find');
    if (!box) return;
    const on = dockFindOn();
    box.classList.toggle('hidden', !on);
    box.style.setProperty('--df-w', (findCfg().width || 150) + 'px');
    const clr = box.querySelector('.df-clear');
    if (clr) clr.classList.toggle('hidden', !dockQuery);
  }
  function setFind(v) {
    dockQuery = v;
    const inp = document.getElementById('dock-find-input');
    if (inp && inp.value !== v) inp.value = v;
    if (v && !dockOpen) setDockOpen(true);
    UI.refreshPalette();
    if (el.palette) el.palette.scrollLeft = 0;
  }
  function initDockFind() {
    const inp = document.getElementById('dock-find-input');
    if (!inp) return;
    inp.addEventListener('input', function () { setFind(inp.value); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        if (inp.value) setFind(''); else inp.blur();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const first = UI.hotkeyOrder()[0];
        if (!first || !findQuery()) return;
        S.markNodeSeen(first);
        GG.input.startPlacing(first);
        GG.audio.play('click');
        inp.blur();
        UI.refreshPalette();
      }
    });
    const clr = document.querySelector('#dock-find .df-clear');
    if (clr) clr.addEventListener('click', function () { setFind(''); inp.focus(); });
  }
  function setDockOpen(open) {
    dockOpen = open;
    el.dock.classList.toggle('open', dockOpen);

    fitLaunchers();

    const a = (C.ui || {}).dockAnim || {};
    const ms = (dockOpen ? a.openMs : a.closeMs);
    setTimeout(fitLaunchers, (ms === undefined ? 220 : ms) + 40);
  }
  UI.dockFind = function (v) { if (v !== undefined) setFind(String(v)); return dockQuery; };

  let dockSection = null;
  UI.dockTiered = function () { return S.hasSkill(C.dock.tierAfter); };

  function showDockView(id) {
    dockSection = id;
    GG.audio.play('click');
    UI.refreshPalette();
    if (el.palette) el.palette.scrollLeft = 0;
  }

  UI.dockBack = function () {
    if (!dockOpen || !UI.dockTiered() || dockSection === null) return false;
    showDockView(null);
    return true;
  };

  UI.refreshPalette = function () {
    buildPalette();
    fitScrollers();
    fitDock();
  };

  function buildPalette() {
    const all = buildableTypes();
    el.palette.innerHTML = '';
    syncFind();

    if (!all.length) {
      el.palette.innerHTML = '<div class="dock-empty">No machines unlocked yet.</div>';
      return;
    }

    const q = findQuery();
    const types = q ? all.filter(k => findMatch(k, q)) : all;
    if (q && !types.length) {
      el.palette.innerHTML = '<div class="dock-empty">' + GG.i18n.t('ui.dockNone') + '</div>';
      return;
    }

    if (!q && UI.dockTiered() && dockSection === null) { buildSections(types); return; }

    const cats = (!q && UI.dockTiered())
      ? C.categories.filter(c => c.id === dockSection)
      : C.categories;

    if (!q && UI.dockTiered()) {
      const back = document.createElement('button');
      back.className = 'dock-back';
      back.innerHTML = IC.svg('chevron', 16) + '<span>' + GG.i18n.t('ui.allSections') + '</span>';
      back.onclick = function () { showDockView(null); };
      el.palette.appendChild(back);
    }

    let key = 0;
    cats.forEach(function (cat) {
      const inCat = types.filter(k => C.nodeTypes[k].category === cat.id);
      if (!inCat.length) return;

      const group = document.createElement('div');
      group.className = 'dock-group';
      group.style.setProperty('--accent', cat.color);

      group.innerHTML = '<div class="dg-head"><span class="dg-dot"></span>' +
        cat.name + (cat.sub ? '<i>' + cat.sub + '</i>' : '') + '</div>';

      const row = document.createElement('div');
      row.className = 'dg-row';
      inCat.forEach(function (k) {
        const t = C.nodeTypes[k];
        key++;
        const b = document.createElement('button');
        b.className = 'build-card';
        b.dataset.type = k;
        b.style.setProperty('--accent', t.color);

        const isNew = S.isNewNode(k);
        b.innerHTML =
          '<span class="bc-key">' + key + '</span>' +
          '<span class="bc-icon">' + IC.svg(t.icon, 26, C.iconColor(t)) + '</span>' +
          '<span class="bc-name">' + t.name + '</span>' +
          '<span class="bc-cost">0</span>' +
          (isNew ? '<span class="bc-new">' + GG.i18n.t('ui.newTag') + '</span>' : '');
        const tipText = C.descOf(t) +

          (perPlaceOn() && t.capPerLoc ? '\n' + perPlaceTip(t) : '');
        if (dockTipOn()) b.dataset.tip = tipText; else b.title = tipText;
        if (isNew) b.classList.add('is-new');

        b.onmousedown = function (e) { if (e.button === 0) e.preventDefault(); GG.input.dockPress(k, e); };
        b.onclick = function () {
          if (GG.input.dockClickSwallowed()) return;

          S.markNodeSeen(k);
          const active = GG.input.view.ghost && GG.input.view.ghost.type === k;
          if (active) GG.input.cancelPlacing(); else { GG.input.startPlacing(k); GG.audio.play('click'); }
          UI.refreshPalette();
        };
        row.appendChild(b);
      });
      group.appendChild(row);
      el.palette.appendChild(group);
    });

    UI.syncPalette();
  }

  function buildSections(types) {
    const wrap = document.createElement('div');
    wrap.className = 'dock-sections';
    C.categories.forEach(function (cat) {
      const n = types.filter(k => C.nodeTypes[k].category === cat.id).length;
      if (!n) return;
      const b = document.createElement('button');
      b.className = 'dock-sec';
      b.dataset.cat = cat.id;
      b.style.setProperty('--accent', cat.color);

      const fresh = S.newNodeCount(cat.id);
      b.innerHTML =
        '<span class="ds-ic">' + IC.svg(C.dock.sectionIcons[cat.id], 26, cat.color) + '</span>' +
        '<span class="ds-name">' + cat.name + '</span>' +

        '<span class="ds-n">' + n + ' ' + ((C.ui || {}).dockCountPlural ? keepPlural(n, 'ui.machinesN') : GG.i18n.t('ui.machines')) + '</span>' +
        (fresh ? '<span class="ds-new">' + fresh + ' ' + GG.i18n.t('ui.newTag') + '</span>' : '');
      b.onclick = function () { showDockView(cat.id); };
      wrap.appendChild(b);
    });
    el.palette.appendChild(wrap);
  }

  function perPlaceOn() { return ((C.ui || {}).perPlace) !== false; }
  function perPlaceTip(t) {
    return t.capPerLoc > 1 ? GG.i18n.t('ui.maxPerPlaceTip').replace('%n', t.capPerLoc)
                           : GG.i18n.t('ui.onePerPlaceTip');
  }

  UI.syncPalette = function () {
    el.palette.querySelectorAll('.build-card').forEach(function (b) {
      const k = b.dataset.type;
      const price = S.priceOf(k);
      const cur = S.priceCurrencyOf(k);

      const capped = C.nodeTypes[k].cap !== undefined;

      const perLoc = !capped && perPlaceOn() && C.nodeTypes[k].capPerLoc;
      const hereN = perLoc ? S.builtHere(k) : 0;

      const full = !!((capped && S.capFull(k)) || (perLoc && hereN >= perLoc));
      b.classList.toggle('poor', full || (price > 0 && !U.canAfford(S.bank(cur), price)));
      b.classList.toggle('capped', full);
      b.classList.toggle('active', !!(GG.input.view.ghost && GG.input.view.ghost.type === k));
      const c = b.querySelector('.bc-cost');

      const freeTxt = C.dock.showFree === false ? '' : 'FREE';
      const txt = full ? (perLoc ? hereN + ' / ' + perLoc : S.builtOf(k) + ' / ' + S.buildCap(k))
        : (price === 0 ? freeTxt
          : (cur === 'money' ? '$' + U.fmt(price) : U.fmt(price) + ' ' + GG.i18n.t('ui.ciAbbr')));
      if (c.textContent !== txt) c.textContent = txt;
      c.classList.toggle('money', !full && cur === 'money' && price > 0);

      let lim = b.querySelector('.bc-lim');
      if ((capped || perLoc) && !lim) {
        lim = document.createElement('span');
        lim.className = 'bc-lim';
        b.appendChild(lim);
      }
      if (lim) {
        const t2 = perLoc ? hereN + '/' + perLoc + ' ' + GG.i18n.t('ui.here')
                          : S.builtOf(k) + '/' + S.buildCap(k);
        if (lim.textContent !== t2) lim.textContent = t2;
      }
    });
  };

  let inspBuilt = null;

  let inspLive = [];
  UI.liveInspector = function (fn) { inspLive.push(fn); };
  UI.selectedId = function () { return selected[0] || null; };
  UI.selectedIds = function () { return selected.slice(); };
  UI.selCount = function () { return selected.length; };
  UI.isSelected = function (id) { return selected.indexOf(id) >= 0; };

  UI.selectNode = function (n) {
    if (!n) addMode = false;
    selected = n ? [n.id] : [];
    inspBuilt = null;
    splitRefresh = null;
    UI.renderInspector();
  };

  UI.toggleNode = function (n, viaBand) {
    if (!n) return;
    const at = selected.indexOf(n.id);
    if (at >= 0) selected.splice(at, 1); else selected.push(n.id);
    if (!viaBand && at < 0 && S.g) {
      S.g.handPicks = Math.max(S.g.handPicks | 0, selected.length);
    }
    inspBuilt = null;
    splitRefresh = null;
    UI.renderInspector();
  };
  UI.clearSelection = function () { UI.selectNode(null); };

  function selAllIds() {
    return S.machinesHere().filter(function (n) {
      const t = S.type(n);
      return t && t.buildable !== false;
    }).map(n => n.id);
  }
  UI.selectAllOn = function () { return !!(((C.ui || {}).selectAll) || {}).enabled; };
  UI.selectAllHere = function () {
    if (!UI.selectAllOn()) return 0;
    const ids = selAllIds();
    if (!ids.length) { UI.toast(GG.i18n.t('ui.selAllNone')); return 0; }
    selected = ids;
    inspBuilt = null;
    splitRefresh = null;
    UI.renderInspector();
    GG.audio.play('click');
    if (!UI.quiet('selectAll')) UI.toast(GG.i18n.t('ui.selAllDone').replace('%n', ids.length));
    return ids.length;
  };
  function buildSelectAll() {
    const o = (C.ui || {}).selectAll || {};
    if (!o.enabled || o.button === false) return;
    const ids = selAllIds();

    if (ids.length < 2 || ids.every(id => selected.indexOf(id) >= 0)) return;
    const touch = GG.input && GG.input.touchUi && GG.input.touchUi();
    const kb = (o.key && (C.ui || {}).keyHints && !touch)
      ? ' <kbd>Ctrl+' + String(o.key).toUpperCase() + '</kbd>' : '';
    const box = document.createElement('div');
    box.className = 'more-ctl selall-ctl'; box.dataset.tool = 'selall';
    box.innerHTML = '<button class="more-btn selall-btn">' + GG.i18n.t('ui.selAll') + kb + '</button>';
    el.inspector.appendChild(box);
    box.querySelector('.selall-btn').onclick = function () { UI.selectAllHere(); };
  }

  let addMode = false;
  UI.addMode = function () { return addMode; };
  UI.setAddMode = function (on) {
    on = !!on;
    if (on === addMode) return;
    addMode = on;
    inspBuilt = null;
    UI.renderInspector();
  };

  UI.selectMoreOn = function () {
    const m = (C.ui || {}).selectMore;
    if (m === 'touch') return !!(GG.input && GG.input.touchUi && GG.input.touchUi());
    return !!m;
  };

  UI.rebuildInspector = function () {
    inspBuilt = null;
    splitRefresh = null;
    UI.renderInspector();
  };

  function tag(row, meta) { if (meta) row.meta = meta; return row; }
  function tidyOn(t) {
    const o = (C.ui || {}).inspTidy;
    return !!(o && o.enabled) && t.kind !== 'site';
  }

  const BAR_RX = /^\s*\$?([\d.,]+)\s*([KMB])?\b[^/\d]*\/\s*\$?([\d.,]+)\s*([KMB])?/;
  function barFrac(v) {
    const m = BAR_RX.exec(v || ''); if (!m) return null;
    const k = { K: 1e3, M: 1e6, B: 1e9 };
    const a = parseFloat(m[1].replace(',', '.')) * (k[m[2]] || 1), b = parseFloat(m[3].replace(',', '.')) * (k[m[4]] || 1);
    return b > 0 && isFinite(a) ? Math.max(0, Math.min(1, a / b)) : null;
  }
  let pricesOpen = false;
  function stripState(n, t, rows) {
    const d = rows.find(r => r.meta && r.meta.diag), st = rows.find(r => r.meta && r.meta.status);
    if (d) return { cls: d.meta.diag.level === 'stop' ? 'stop' : 'wait',
                    word: d.meta.diag.word ? GG.i18n.ins(d.meta.diag.word) : d[0], text: d[1] };

    const R = n.rates || {};
    const outs = Object.keys(R).filter(k => k.indexOf('out:') === 0 || k.indexOf('v:') === 0);
    const going = (outs.length ? outs.some(k => R[k] > 0.005) : (R.work || 0) > 0.005) ||
      !!(Sim.gathering && Sim.gathering(n));
    return { cls: going ? 'ok' : 'idle', word: GG.i18n.t(going ? 'ui.stWorking' : 'ui.stIdle'), text: st ? st[1] : '' };
  }
  function tidyRows(n, t, rows) {
    const T = GG.i18n.t, S0 = stripState(n, t, rows);
    const hasDiag = rows.some(r => r.meta && r.meta.diag);
    const colOf = m => m.cur ? (C.currencies[m.cur] || {}).color : ((C.resources[m.res] || {}).color || 'var(--muted)');
    const val = i => '<b data-ri="' + i + '">' + rows[i][1] + '</b>';

    const subOf = {};

    const cut = v => { const k = String(v).indexOf(' · '); return k < 0 ? [v, ''] : [v.slice(0, k), v.slice(k + 3)]; };
    const line = i => { const m = rows[i].meta, sub = subOf[i], pp = cut(rows[i][1]);
      return '<div class="ln-row"><i style="--rc:' + colOf(m) + '"></i><span>' + GG.i18n.ins(m.name) + '</span>' +
        '<b data-ri="' + i + '" data-part="0">' + pp[0] + '</b>' +
        '<em class="ln-note" data-ri="' + i + '" data-part="1">' + pp[1] + '</em>' +
        (sub !== undefined ? '<em data-ri="' + sub + '">' + rows[sub][1] + '</em>' : '') + '</div>'; };
    const plain = i => '<div class="row"><span>' + rows[i][0] + '</span>' + val(i) + '</div>';
    const sec = w => '<div class="ln-sec">' + w + '</div>';
    const ins = [], outs = [], bars = [], other = [], prices = [];
    let ordered = null;
    if (rows.some(r => r.meta && r.meta.head)) ordered = [];
    rows.forEach((r, i) => { const m = r.meta || {};
      if (m.diag || m.status) return;
      if (m.price) prices.push(i);
      else if (ordered && (m.head || m.io)) ordered.push(i);
      else if (m.io === 'in') ins.push(i);
      else if (m.io === 'out') outs.push(i);
      else if (barFrac(r[1]) !== null) bars.push(i);
      else other.push(i); });
    for (let j = other.length - 1; j >= 0; j--) {
      const oi = other[j], hit = ins.find(i => GG.i18n.ins(rows[i].meta.name) === rows[oi][0] && subOf[i] === undefined);
      if (hit !== undefined) { subOf[hit] = oi; other.splice(j, 1); }
    }
    const st = rows.findIndex(r => r.meta && r.meta.status);
    let h = '<div class="ln-strip"><div class="ln-st ' + S0.cls + '"><i></i><b>' + S0.word + '</b><span class="ln-st-t">' +
      (S0.text || '') + '</span></div>' +
      (hasDiag && st >= 0 ? '<div class="ln-why" data-ri="' + st + '">' + rows[st][1] + '</div>' : '') + '</div>';
    h += '<div class="insp-rows ln-tidy" style="--accent:' + t.color + '">';
    if (ordered) h += ordered.map(i => rows[i].meta.head ? sec(rows[i][0]) : line(i)).join('');
    else {
      if (ins.length) h += sec(T('ui.secIn')) + ins.map(line).join('');
      if (outs.length) h += sec(T('ui.secOut')) + outs.map(line).join('');
    }
    if (bars.length) h += sec(T('ui.secInside')) + bars.map(i =>
      '<div class="ln-bar" data-bi="' + i + '"><span>' + rows[i][0] + '</span>' + val(i) +
      '<u><s style="width:' + (barFrac(rows[i][1]) * 100).toFixed(1) + '%"></s></u></div>').join('');
    if (other.length) h += sec(T('ui.secDetails')) + other.map(plain).join('');
    if (prices.length) {
      const coming = rows.filter(r => r.meta && r.meta.io === 'in').map(r => r.meta.res);
      const now = prices.filter(i => coming.indexOf(rows[i].meta.price) >= 0);
      if (now.length) h += sec(T('ui.secSelling')) + now.map(i =>
        '<div class="ln-row"><i style="--rc:' + colOf({ res: rows[i].meta.price }) + '"></i><span>' + rows[i][0] + '</span>' + val(i) + '</div>').join('');
      h += '<details class="ln-more"' + (pricesOpen ? ' open' : '') + '><summary>' +
        T('ui.allPrices').replace('%n', prices.length) + '</summary>' +
        prices.map(i => '<div class="row"><span>' + rows[i][0] + '</span><b data-ri="' + i + '" data-dup="1">' + rows[i][1] + '</b></div>').join('') + '</details>';
    }
    return h + '</div>';
  }
  function tidyPatch(n, t, rows) {
    for (const b of el.inspector.querySelectorAll('[data-ri]')) {
      const r = rows[+b.dataset.ri]; if (!r) continue;
      let v = r[1];
      if (b.dataset.part) { const k = String(v).indexOf(' · ');
        v = b.dataset.part === '0' ? (k < 0 ? v : v.slice(0, k)) : (k < 0 ? '' : v.slice(k + 3)); }
      if (b.textContent !== v) b.textContent = v;
    }
    for (const b of el.inspector.querySelectorAll('[data-bi]')) {
      const r = rows[+b.dataset.bi], f = r && barFrac(r[1]), s = b.querySelector('s');
      if (s && f !== null) s.style.width = (f * 100).toFixed(1) + '%';
    }
    const s0 = stripState(n, t, rows), box = el.inspector.querySelector('.ln-st');
    if (box) {
      box.className = 'ln-st ' + s0.cls;
      const b = box.querySelector('b'), sp = box.querySelector('.ln-st-t');
      if (b.textContent !== s0.word) b.textContent = s0.word;
      if (sp.textContent !== (s0.text || '')) sp.textContent = s0.text || '';
    }
  }

  const TOOL_ICON = { flip: 'toolSockets', alerts: 'toolBell', selall: 'toolSelAll', codex: 'help', move: 'toolMove' };
  function tidyTools() {
    const o = (C.ui || {}).inspTidy || {};
    const touch = GG.input && GG.input.touchUi && GG.input.touchUi();
    if (touch && !o.toolsOnTouch) return;

    const keep = o.moveButton !== false ? el.inspector.querySelector('[data-tool="move"]') : null;
    const boxes = [...el.inspector.querySelectorAll('[data-tool]')].filter(b => b !== keep);
    const demo0 = el.inspector.querySelector('.demo-ctl');
    if (keep) {
      if (demo0) demo0.before(keep); else el.inspector.appendChild(keep);

      const note = keep.querySelector('.sc-out'), btn = keep.querySelector('.move-btn');
      if (note && btn) { btn.title = note.textContent; note.style.display = 'none'; }
    }
    if (!boxes.length) return;
    const bar = document.createElement('div');
    bar.className = 'ln-tools';
    boxes.forEach(function (box) {
      const src = box.querySelector('button');
      if (!src) return;
      const kind = box.dataset.tool, b = document.createElement('button');
      b.className = 'ln-t';
      const sync = function () {
        const off = src.classList.contains('off');
        const icon = kind === 'alerts' && off ? 'toolBellOff' : TOOL_ICON[kind];
        if (b.dataset.ic !== icon) { b.innerHTML = IC.svg(icon, 17); b.dataset.ic = icon; }
        b.classList.toggle('off', off);

        const tip = [...box.children].map(function (c) {
          const k = c.cloneNode(true);
          k.querySelectorAll('kbd').forEach(x => { x.textContent = ' (' + x.textContent + ')'; });
          return k.textContent.replace(/\s+/g, ' ').trim();
        }).filter(Boolean).join(' · ');
        if (b.title !== tip) b.title = tip;
      };
      b.onclick = function () { src.click(); sync(); };
      sync();
      inspLive.push(sync);
      box.style.display = 'none';
      bar.appendChild(b);
    });
    const demo = keep || el.inspector.querySelector('.demo-ctl');
    if (demo) demo.before(bar); else el.inspector.appendChild(bar);
  }

  UI.renderInspector = function () {

    selected = selected.filter(id => !!S.node(id));
    if (selected.length > 1) { renderGroup(); return; }
    const n = selected.length ? S.node(selected[0]) : null;
    if (!n) { el.inspector.classList.add('hidden'); inspBuilt = null; cardTint(null); return; }
    el.inspector.classList.remove('hidden');
    const t = S.type(n);
    cardTint(t);
    let rows = [];

    const diag = C.diagnose.inspector ? Sim.diagnose(n) : null;
    if (diag) rows.push(tag([diag.level === 'stop' ? 'Stopped' : 'Held back', diag.why], { diag: diag }));

    const roadDone = Sim.roadDone && Sim.roadDone(n);
    if (t.buffer && !roadDone) rows.push(['Capacity', U.fmt(Sim.heldOf(n), 2) + ' / ' + U.fmt(Sim.capOf(n)) + ' kg']);

    if (t.ciPerKw && Sim.oilCiRate(t) > 0)
      rows.push(['Clean Index', U.fmt(n.ciDrain || 0) + ' ' + C.currencies.ci.rate]);

    let lastGroup;
    S.rowsOf(n).forEach(function (r) {
      if (t.cardGroups && C.ui.cardGroups !== false) {
        const g = r.kind === 'vout' ? r.v.group : r.port.group;
        if (g && g !== lastGroup) {
          const gp = t.cardGroups.find(x => x.id === g);
          if (gp && gp.label) rows.push(tag([gp.label, ''], { head: true }));
        }
        lastGroup = g;
      }
      if (r.kind === 'vout') {
        const cur = C.currencies[r.v.cur];

        let vv = U.fmt(n.rates['v:' + (r.vi || 0)] || 0) + ' ' + cur.rate;
        if ((C.ui || {}).gemEta !== false && (t.recipe || {}).gem) {
          const sec = Sim.gemEta(n);
          vv = sec === null ? '—'
            : GG.i18n.t('ui.gemIn').replace('%n', Sim.gemYield(n))
                .replace('%c', cur.short).replace('%t', GG.i18n.dur(sec, true));
        }
        rows.push(tag([r.v.label, vv], { io: 'out', cur: r.v.cur, name: r.v.label }));
      } else {
        const res = C.resources[r.port.res];
        const key = r.kind + ':' + r.port.id;

        let val = U.fmt(n.rates[key] || 0) + ' ' + res.rate;
        if (r.kind === 'out' && t.outBuffer) {
          const held = n.obuf[r.port.id] || 0;

          if (held >= 0.005) val += ' · ' + U.fmt(held, 2) + ' kg waiting';
        }
        if (!(roadDone && r.kind === 'in'))
          rows.push(tag([(r.kind === 'in' ? 'In · ' : 'Out · ') + S.portLabel(n, r.port, r.kind), val],
            { io: r.kind, name: S.portLabel(n, r.port, r.kind),
              res: (S.portRes && S.portRes(n, r.port, r.kind)) || r.port.res }));
      }
    });

    if (t.id === 'cleaner' || t.id === 'droneCleaner') {
      const site = S.siteOf(n);
      rows.push(['Site left', site ? U.kg(Math.max(0, site.reserve)) : '—']);
      const port = t.id === 'cleaner' ? 'wf' : 'kw';
      if (!S.linkInto(n.id, port)) {
        rows.push(['Status', t.id === 'cleaner' ? 'Needs a Volunteer wired in'
                                                : 'Needs energy wired in']);
      }
    }
    if (t.id === 'treePlanter') {
      const site = S.siteOf(n);
      const mul = Sim.plantMul(n);
      rows.push(['Per WF/h', U.fmt(Sim.stat('treePlanter', 'ciPerWF') * mul, 2) + ' ' + GG.i18n.t('ui.ciPerH')]);
      rows.push(['Plot grown', site ? Math.floor(Sim.growFrac(site) * 100) + '%' : '—']);

      if (S.portsOf(n, 'in').some(p => p.id === 'fert')) {
        rows.push(['Fertilizer', U.fmt(n.buf.fert || 0, 2) + ' / ' +
                   U.fmt(Sim.recipeNeed(n, 'fert'), 2) + ' kg']);
        rows.push(['Loads taken', (n.made || 0) + '  (×' + U.fmt(mul, 2) + ')']);
      }
      if (!S.linkInto(n.id, 'wf')) rows.push(['Status', 'Needs workforce wired in']);
    }

    if (t.powerUp && S.portsOf(n, 'in').some(p => p.id === t.powerUp.port)) {
      const p = t.powerUp;

      rows.push(['One load is worth', '×' + U.fmt(Sim.powerMulOf(t.id), 2)]);
      rows.push(['The next load wants', U.small(Sim.powerLoad(n)) + ' kg']);
      rows.push(['Fed so far', Sim.powerOn(n)
        ? '×' + U.fmt(Sim.powerMul(n), 2) + ' · ' + (n.made || 0) + ((n.made || 0) === 1 ? ' load' : ' loads')
        : 'nothing yet']);
    }

    if (t.id === 'fineSorter') {

      const PP = Sim.prismPer(n), PO = Sim.prismOut(n);
      const made = ((n.rates['out:plastic'] || 0) + (n.rates['out:organic'] || 0)) / PO;
      const wf = (n.rates['in:wf'] || 0) / PP;
      const need = Sim.stat('fineSorter', 'wfPerKg') * made * PP;
      rows.push(['Crew needed', U.fmt(need, 2) + ' WF/h']);
      if (made <= 0) {
        rows.push(['Split', 'idle']);
      } else {
        const share = Sim.lightShare(wf, made, 'fineSorter');
        rows.push(['Split', Math.round(share * 100) + '% plastic / ' +
                            Math.round((1 - share) * 100) + '% organic']);
        rows.push(['Status', wf * PP >= need - 1e-9 ? 'Best split, a bigger crew is wasted'
          : U.fmt(Sim.heavyRatio(wf, made, 'fineSorter'), 2) + '× more organic than plastic']);
      }
    }

    if (t.mix) {
      const per = Sim.stat(t.id, 'energyPerKg') * Sim.prismPer(n);
      let least = Infinity;
      t.mix.forEach(r => { least = Math.min(least, n.buf[r] || 0); });
      t.mix.forEach(r => {
        rows.push([C.resources[r].name, U.fmt(n.buf[r] || 0, 2) + ' kg']);
      });
      const kw = n.rates['in:kw'] || 0;
      rows.push(['Energy per kg', U.fmt(per, 2) + ' KW/h']);
      rows.push(['Could cook', U.fmt(kw / per, 2) + ' kg/h']);
      rows.push(['Status', least <= 1e-9 ? 'Waiting on ' +
          C.resources[t.mix[(n.buf[t.mix[0]] || 0) <= (n.buf[t.mix[1]] || 0) ? 0 : 1]].name.toLowerCase()
        : (kw <= 1e-6 ? 'No power' : 'Cooking')]);
    }
    if (t.collect) {
      rows.push([t.collect.holdLabel || 'Till',
                 U.curRange(t.collect.cur, n.till || 0, Sim.collectCap(t, n), 2)]);

      if (t.collectB)
        rows.push([t.collectB.holdLabel || 'Till',
                   U.curRange(t.collectB.cur, n.tillB || 0, Sim.collectCap(t, n, 'B'), 2)]);
      if (t.autoCollect) {

        let rate = 0;
        Sim.autoSources(t).forEach(function (src) {
          const got = n.rateIn[src.port] || 0;
          rate += got * src.perUnit;
          if (Sim.autoSources(t).length < 2) return;
          rows.push([C.resources[src.port === 'kw' ? 'energy' : 'wf'].name,
                     U.fmt(got, 2) + ' → ' + U.fmt(got * src.perUnit, 2) + ' ' +
                     C.currencies[t.collect.cur].rate]);
        });

        rows.push(['Emptying', rate > 0
          ? U.fmt(rate, 2) + ' ' + C.currencies[t.collect.cur].rate +
            (t.collectB ? ' + ' + U.fmt(rate, 2) + ' ' + C.currencies[t.collectB.cur].rate : '')
          : 'nothing wired in']);
      }
    }
    if (t.virtualOut && t.processRate) {

      const thru = Sim.stat(t.id, 'processRate');
      if (isFinite(thru)) rows.push(['Max throughput', U.fmt(thru) + ' kg/h']);

      Sim.sides(t).forEach((side, i) => {
        const cur = C.currencies[t.virtualOut[i].cur].short;
        Sim.gradesPriced(n, side).forEach(res => {
          rows.push(tag([C.resources[res].name,
                     U.fmt(Sim.valueOf(t, res, side), 2) + ' ' + cur + '/kg'], { price: res }));
        });
      });
    }
    if (t.id === 'weightSorter') {

      const PP = Sim.prismPer(n), PO = Sim.prismOut(n);
      const rec = ((n.rates['out:light'] || 0) + (n.rates['out:heavy'] || 0)) / PO;
      const kw = (n.rates['in:kw'] || 0) / PP;
      const need = Sim.stat('weightSorter', 'energyPerKg') * rec * PP;
      rows.push(['Energy needed', U.fmt(need, 2) + ' KW/h']);
      if (rec <= 0) {
        rows.push(['Split', 'idle']);
      } else {
        const share = Sim.lightShare(kw, rec);
        rows.push(['Split', Math.round(share * 100) + '% light / ' +
                            Math.round((1 - share) * 100) + '% heavy']);
        rows.push(['Status', kw * PP >= need - 1e-9 ? 'Best split, extra energy is wasted'
          : U.fmt(Sim.heavyRatio(kw, rec), 2) + '× more heavy than light']);
      }
    }
    if (t.id === 'rubbleSorter') {

      const PP = Sim.prismPer(n), PO = Sim.prismOut(n);
      const made = ((n.rates['out:glass'] || 0) + (n.rates['out:agg'] || 0)) / PO;
      const wf = (n.rates['in:wf'] || 0) / PP, kw = (n.rates['in:kw'] || 0) / PP;
      const kg = made > 0 ? made : (n.buf.heavy || 0);
      rows.push(['For a full kilo', U.fmt(Sim.stat(t.id, 'wfPerKg') * PP, 1) + ' WF + ' +
                                    U.fmt(Sim.stat(t.id, 'energyPerKg') * PP, 1) + ' KW']);
      if (kg <= 0 || (wf <= 0 && kw <= 0)) {
        rows.push(['Split', 'idle']);
      } else {
        const r = Sim.rubbleSplit(wf, kw, kg, t.id);
        rows.push(['Split', Math.round(r.glass * 100) + '% glass / ' +
                            Math.round((1 - r.glass) * 100) + '% aggregate']);
        rows.push(['Working', U.fmt(r.worked, 2) + ' of ' + U.fmt(kg, 2) + ' kg/h']);
        rows.push(['Status', r.worked >= kg - 1e-9
          ? 'Both inputs cover it, the surplus is wasted'
          : (wf <= 0 ? 'No crew, so pure aggregate'
            : (kw <= 0 ? 'No power, so pure glass' : 'Short of both, so it works less trash'))]);
      }
    }
    if (t.predict) {
      const cap = Sim.capOf(n), cost = Sim.mastCost(t);
      const mloc = n.loc || C.locations[0].id;
      const soon = Sim.wxIncoming(mloc);
      const mine = !!Sim.wxPlace(mloc);
      rows.push(['Charge', U.fmt(n.bank || 0, 1) + ' / ' + U.fmt(cap, 0) + ' KW']);
      rows.push(['A warning costs', U.fmt(cost, 0) + ' KW']);
      rows.push(['Warning', U.fmt(Sim.predictLead(), 0) + 's ahead']);
      rows.push(['Status', !mine ? 'Nothing to read here'
        : ((n.bank || 0) < cost ? 'Too little charge to read anything'
          : (soon && n.sawSeq === Sim.wxState(mloc).nextSeq
            ? soon.event.name + ' in ' + Math.ceil(soon.left) + 's'
            : 'Watching, the sky is clear'))]);
    }
    if (t.licence) {
      const left = Sim.licenceLeft(n), fuel = n.buf.oil || 0;
      rows.push(['Licence', left > 0 ? Math.ceil(left) + 's left' : 'not running']);
      rows.push(['A shift costs', GG.i18n.t('ui.licenceFor')
        .replace('%c', U.cur(t.licence.cur, Sim.licenceCost(t)))
        .replace('%m', Math.round(t.licence.sec / 60))]);
      rows.push(['In the tank', U.small(fuel) + ' kg']);
      rows.push(['Burning', U.fmt(n.rates['in:oil'] || 0, 2) + ' kg/h of oil']);
      rows.push(['Status', left > 0
        ? ((n.rates['in:oil'] || 0) > 0 ? 'Generating' : 'Running, but no oil is arriving')
        : (fuel > 1e-9 ? 'Stopped, press RUN' : 'Stopped, no oil to burn')]);
    }
    if (t.fission) {
      const F = Sim.reactorFuel(n), left = Sim.licenceLeft(n), held = n.buf[F.res || 'rod'] || 0;
      rows.push(['One load', GG.i18n.t('ui.fissionLoad')
        .replace('%k', U.small(F.kg)).replace('%m', Math.round(F.sec / 60))
        .replace('%p', U.fmt(Sim.reactorKw(t, n), 1))]);
      rows.push(['Loaded', U.small(held) + ' kg']);
      rows.push(['Status', left > 0 ? 'Running, ' + Math.ceil(left) + 's left'
        : (held + 1e-9 >= F.kg ? 'Stopped, press START'
          : (F.res === 'rod' ? 'Stopped, no uranium rods' : 'Stopped, no plutonium pellets'))]);
    }
    if (t.rocket) {
      const R = t.rocket, st = Sim.rocketState(n);
      if (!n.built) {
        rows.push(['Built', Math.floor(st.pct * 100) + '%']);
        const miss = Object.keys(R.build).filter(k => (n.buf[k] || 0) + 1e-9 < R.build[k])
          .map(k => U.small(R.build[k] - (n.buf[k] || 0)) + ' kg ' + C.resources[k].name);
        if (miss.length) rows.push(['Still needed', miss.join(' + ')]);
      } else {

        const RF = Sim.rocketFuel(n);
        rows.push(['Fuel', U.small(n.buf[RF.res] || 0) + ' / ' + RF.kg + ' kg ' + C.resources[RF.res].name]);
        rows.push(['Crew', Math.floor(n.wfPool || 0) + ' / ' + R.flight.wf + ' WF']);
        const ex = Sim.rocketExhaust(n);
        if (ex > 0) rows.push(['Exhaust', U.fmt(ex, 0) + ' CI a launch']);
      }
      const RG = R.flight.cargo === 'gems' ? Sim.rocketGems(n) : null;
      rows.push(['A flight', GG.i18n.t(RG ? 'ui.rocketFlightGems' : 'ui.rocketFlight')
        .replace('%m', Math.round(Sim.rocketFuel(n).sec / 60))
        .replace('%k', RG ? (RG.chance > 0 ? RG.sure + '-' + (RG.sure + 1) : String(RG.sure)) : U.kg(Sim.rocketMetal(n)))
        .replace('%c', U.fmt(R.flight.ci, 0))]);
      if ((n.obuf.metal || 0) > 1e-6) rows.push(['In the hold', U.kg(n.obuf.metal)]);
      if (S.holdRow(t)) rows.push(['In the hold', GG.i18n.t('ui.holdGems')
        .replace('%n', Math.floor(n.gemHold || 0)).replace('%c', Sim.rocketHoldCap(n))]);
      rows.push(['Status', st.state === 'flying' ? 'In flight, ' + Math.ceil(st.left) + 's left'
        : st.state === 'building' ? 'Being built' : st.state === 'hold' ? 'Empty the hold'
        : st.state === 'fuel' ? 'Waiting for fuel' : st.state === 'crew' ? 'Waiting for crew'
        : st.state === 'ci' ? 'Not enough CI for the exhaust'
        : 'Ready, press LAUNCH']);
    }
    if (t.id === 'solarPanel') {
      const ph = Sim.solarPhase(n);
      rows.push(['Now', ph.on ? 'Working (day)' : 'Resting (night)']);
      rows.push([ph.on ? 'Rests in' : 'Wakes in', Math.ceil(ph.remaining) + 's']);
    }
    if (t.store) {
      rows.push(['Charge', U.fmt(n.store || 0, 2) + ' / ' + U.fmt(Sim.capOf(n), 2) + ' KW']);
      const wired = Sim.hasEnergyWire(n);

      const want = n.demand || 0, out = n.outRate || 0;
      rows.push(['Demand', wired ? U.fmt(want, 2) + ' KW/h' : '—']);
      rows.push(['Output', U.fmt(n.rates['out:kw'] || 0, 2) + ' KW/h']);
      rows.push(['Status', !wired
        ? 'Wired to nothing, bleeding ' + U.small(Sim.stat(t.id, 'idleDrain')) + ' KW/h'
        : (want <= 1e-6 ? 'Nothing is asking for energy'
          : (out < want - 1e-6 ? 'Running dry, supplying ' + Math.round(out / want * 100) + '%'
            : 'Meeting demand'))]);
    }

    if (t.lanes) {
      t.lanes.forEach(function (L, i) {
        const gr = n.lg && n.lg[L];
        rows.push(['Shelf ' + (i + 1), (gr ? C.resources[gr].name : GG.i18n.t('ui.laneEmpty')) +
          ', ' + U.fmt(Sim.laneHeld(n, L), 1) + ' / ' + U.fmt(Sim.laneCap(n)) + ' kg']);
      });
    }
    if (t.mergeLock) {
      rows.push(['Carrying', n.grade ? C.resources[n.grade].name : 'nothing yet, any grade']);

      if (t.maxInputs) {
        rows.push(['Wires in', S.linksInto(n.id).length + ' / ' + t.maxInputs]);
      }
    }

    if (t.recruit) {

      const needWf = Sim.recruitNeed(n, 'wf'), needKw = Sim.recruitNeed(n, 'kw');
      rows.push(['Recruits', String(n.recruits || 0)]);
      rows.push(['Next recruit at', U.fmt(needWf, 1) + ' WF + ' + U.fmt(needKw, 1) + ' KW']);
      rows.push(['Workforce pool', U.fmt(n.wfPool || 0, 2) + ' / ' + U.fmt(needWf, 1) + ' WF']);
      rows.push(['Energy pool', U.fmt(n.kwPool || 0, 2) + ' / ' + U.fmt(needKw, 1) + ' KW']);
      const wf = n.rateIn.wf || 0, kw = n.rateIn.kw || 0;
      rows.push(['Status', (wf <= 1e-6 && kw <= 1e-6) ? 'Nothing coming in'
        : (wf <= 1e-6 ? 'Waiting on workforce'
          : (kw <= 1e-6 ? 'Waiting on energy' : 'Campaigning'))]);
    }

    if (t.id === 'eddySeparator') {

      const PP = Sim.prismPer(n), PO = Sim.prismOut(n);
      const made = ((n.rates['out:alu'] || 0) + (n.rates['out:steel'] || 0)) / PO;
      const kw = (n.rates['in:kw'] || 0) / PP;
      const need = Sim.stat('eddySeparator', 'energyPerKg') * made * PP;
      rows.push(['Energy needed', U.fmt(need, 2) + ' KW/h']);
      if (made <= 0) {
        rows.push(['Split', 'idle']);
      } else {
        const share = Sim.lightShare(kw, made, 'eddySeparator');
        rows.push(['Split', Math.round(share * 100) + '% aluminium / ' +
                            Math.round((1 - share) * 100) + '% steel']);
        rows.push(['Status', kw * PP >= need - 1e-9 ? 'Best split, extra energy is wasted'
          : U.fmt(Sim.heavyRatio(kw, made, 'eddySeparator'), 2) + '× more steel than aluminium']);
      }
    }

    if (t.id === 'hazardPlant') {
      const light = n.rates['in:light'] || 0;
      const wf = n.rates['in:wf'] || 0;
      const per = Sim.stat('hazardPlant', 'wfPerKg') * Sim.prismPer(n);
      rows.push(['Crew needed', U.fmt(light * per, 2) + ' WF/h']);
      rows.push(['Crew covers', U.fmt(wf / per, 2) + ' kg/h']);
      rows.push(['Status', wf <= 1e-6 ? 'No crew, so everything passes through'
        : (light <= 1e-6 ? 'No light trash'
          : (wf >= light * per - 1e-6 ? 'Working all of it'
            : 'Short-handed, so the rest passes through'))]);
    }

    if (t.convert) {
      const cv = t.convert;
      const r = Sim.convRate(n, 1);

      const perKg = (cv.out && cv.out.kg) || 1;
      Object.keys(cv.inputs).forEach(function (k) {
        rows.push([C.resources[k].name, U.fmt(n.buf[k] || 0, 2) + ' kg · ' +
                   U.fmt(Sim.convNeed(n, k) / perKg, 2) + ' per kg']);
      });
      if (cv.wf) {
        rows.push(['Labour', U.fmt(n.rateIn.wf || 0, 2) + ' / ' +
                             U.fmt(Sim.convWf(n) / perKg, 2) + ' WF/h per kg']);
      }

      if (cv.ci) rows.push(['Making', U.fmt(r.kg * Sim.convCi(n), 2) + ' CI/h']);
      else {
        rows.push(['Making', U.fmt(r.kg * perKg, 2) + ' kg/h']);
        rows.push(['Stack', U.fmt(n.obuf[r.port] || 0, 2) + ' / ' + U.fmt(t.outBuffer) + ' kg']);
      }

      const shortRes = r.short === 'kw' ? 'energy' : r.short;
      rows.push(['Status', r.kg <= 1e-9
        ? (r.short === 'out' ? 'The stack is full and nothing is taking them'
          : (r.short === 'wf' ? 'No workforce'
            : 'Waiting on ' + (C.resources[shortRes] || { name: 'materials' }).name.toLowerCase()))
        : (r.short === 'out' ? 'Throttled, the stack is nearly full'
          : (r.short === 'wf' ? 'Short-handed, so the crew sets the rate'
            : 'Short of ' + (C.resources[shortRes] || { name: 'materials' }).name.toLowerCase()))]);
    }

    if (t.wastePerWf) {
      rows.push(['Robots', Math.round(Sim.robotShare(n) * 100) + '%']);
      rows.push([C.resources.gear.name, U.fmt(n.buf.gear || 0, 2) + ' kg']);
    }

    if (t.recipe && !t.recipe.boost) {
      const R = t.recipe;
      if (!roadDone) Object.keys(R.inputs).forEach(function (k) {
        rows.push([C.resources[k].name,
                   U.fmt(n.buf[k] || 0, 2) + ' / ' + U.fmt(Sim.recipeNeed(n, k), 2) + ' kg']);
      });

      if (R.handGems > 0) rows.push(['Diamonds', Math.floor(n.gemsIn || 0) + ' / ' + Sim.gemCap(n)]);
      const needWf = Sim.recipeWf(n);
      if (needWf > 0) {
        rows.push(['Assembly', U.fmt(n.wfPool || 0, 2) + ' / ' + U.fmt(needWf, 2) + ' WF']);
      }

      const needKw = Sim.recipeKw(n);
      if (needKw > 0) {
        rows.push(['Pressing', U.fmt(n.kwPool || 0, 2) + ' / ' + U.fmt(needKw, 2) + ' KW']);
      }
      if (R.gem) {

        const cur = C.currencies[R.gem.cur];
        rows.push(['Batches pressed', U.fmt(n.made || 0)]);
        rows.push(['Next batch', U.fmt(Sim.gemYield(n)) + ' ' + cur.short]);

      }
      if (R.out) {
        rows.push(['Built', U.fmt(n.made || 0) + ' × ' + U.fmt(R.out.kg, 2) + ' kg']);
        rows.push(['Stack', U.fmt(n.obuf.out || 0, 2) + ' / ' + U.fmt(t.outBuffer) + ' kg']);
      }

      if (R.power && R.crew) {
        rows.push(['Road laid', String(n.made || 0) +
                   (R.maxMade ? ' / ' + R.maxMade + ' stretches' : ' stretches')]);
        rows.push(['Each stretch', U.fmt(Sim.stat(R.power, 'energyRate'), 2) + ' KW/h + ' +
                                   U.fmt(Sim.stat(R.crew, 'wfRate'), 2) + ' WF/h']);
        rows.push(['Output', U.fmt(n.rates['out:kw'] || 0, 2) + ' KW/h + ' +
                             U.fmt(n.rates['out:wf'] || 0, 2) + ' WF/h']);
      } else if (R.power) {
        rows.push(['Arrays standing', String(n.made || 0)]);
        rows.push(['Each array', U.fmt(Sim.stat(R.power, 'energyRate'), 2) + ' KW/h']);
        rows.push(['Output', U.fmt(n.rates['out:kw'] || 0, 2) + ' KW/h']);
      }
      const ready = Sim.recipeReady(n);

      const tillFull = R.gem && t.collect &&
        (n.till || 0) > 0 && Sim.collectCap(t, n) - (n.till || 0) < Sim.gemYield(n) - 1e-9;
      const jammed = R.out && (n.obuf.out || 0) > t.outBuffer - R.out.kg + 1e-9;

      if (Sim.roadMaxed && Sim.roadMaxed(n)) rows.push(['Status', 'The road is finished']);
      else if (tillFull) rows.push(['Status', 'Till is full, press COLLECT']);
      else rows.push(['Status', jammed ? 'The stack is full and nothing is taking them'
        : (!ready ? 'Gathering parts'
          : (needWf > 0 && (n.rateIn.wf || 0) <= 1e-6 ? 'Parts are ready, it needs workforce'
            : (needKw > 0 && (n.rateIn.kw || 0) <= 1e-6 ? 'Carbon is ready, it needs power'
              : 'Building')))]);
    }

    if (t.id === 'magnetSeparator') {
      const made = n.rates['out:metal'] || 0;
      const kw = n.rates['in:kw'] || 0;
      const per = Sim.stat('magnetSeparator', 'energyPerKg') * Sim.prismPer(n);
      rows.push(['Energy per kg', U.fmt(per, 2) + ' KW/h']);
      rows.push(['Could lift', U.fmt(kw / per, 2) + ' kg/h']);
      rows.push(['Status', made > 1e-6 ? 'Pulling metal'
        : (kw <= 1e-6 ? 'No power' : 'No heavy trash')]);
    }

    const sig = n.id + '|' + rows.map(r => r[0]).join(',') + '|' + GG.i18n.lang() +
                (t.overdrive ? '|od' + Sim.overdriveDrain(t) : '') +

                '|' + Sim.nameOf(n) +
                (t.autoHire ? '|dock' + (n.dock ? 1 : 0) : '') +
                (Sim.prismCan(t) ? '|pr' + (n.prisms || 0) + (Sim.prismSeen() ? 's' : '') : '');
    rows = rows.map(r => tag([GG.i18n.ins(r[0]), GG.i18n.ins(r[1])],
      r.meta || (r[0] === 'Status' ? { status: true } : undefined)));
    const tidy = tidyOn(t);
    if (sig === inspBuilt) {
      if (tidy) { tidyPatch(n, t, rows); for (const f of inspLive) f(); return; }
      const bs = el.inspector.querySelectorAll('.insp-rows .row b');
      rows.forEach(function (r, i) {
        if (bs[i] && bs[i].textContent !== r[1]) bs[i].textContent = r[1];
      });

      for (const f of inspLive) f();
      return;
    }

    const keepScroll = (inspBuilt && inspBuilt.slice(0, inspBuilt.indexOf('|')) === String(n.id))
      ? el.inspector.scrollTop : 0;
    inspBuilt = sig;
    inspLive = [];

    el.inspector.innerHTML =
      '<div class="insp-head" style="--accent:' + t.color + '">' +
        '<span class="insp-ic">' + IC.svg(t.icon, 20, C.iconColor(t)) + '</span>' +
        headName(n, t) +
        '<button class="insp-x" title="' + GG.i18n.t('ui.close') + '"></button>' +
      '</div>' +

      (function () {

        const spec = C.specCard(t, { node: n });
        if (!spec.length) return '<div class="insp-desc">' + C.descOf(t) + '</div>';
        return '<div class="insp-spec">' + spec.map(r =>
          '<div class="sp"><span>' + GG.i18n.ins(r[0]) + '</span><b>' +
          prismSpec(n, t, r) + '</b></div>').join('') + '</div>';
      })() +
      (tidy ? tidyRows(n, t, rows) :
      '<div class="insp-rows">' +
      rows.map(r => '<div class="row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join('') +
      '</div>');
    if (tidy) {
      const st = el.inspector.querySelector('.ln-strip');
      if (st) el.inspector.querySelector('.insp-head').after(st);
      const fold = el.inspector.querySelector('.ln-more');
      if (fold) fold.ontoggle = function () { pricesOpen = fold.open; };
    }
    const x = el.inspector.querySelector('.insp-x');
    x.innerHTML = IC.svg('close', 13);
    x.onclick = function () { UI.selectNode(null); };
    if (t.ways > 2) buildWaysControls(n, t);
    else if (t.splitter) buildSplitControls(n, t);
    if (t.store) buildStoreControls(n, t);
    if (t.holdLock) buildFlowControls(n, t);
    if (t.crewLimit) buildCrewLimit(n, t);
    if (t.lanes) t.lanes.forEach((L, i) => buildLaneControls(n, t, L, i));
    if (Sim.fuelSwitchOpen(t)) buildFuelSwitch(n, t);
    if (Sim.prismCan(t) && (Sim.prismSeen() || n.prisms > 0)) buildPrismControls(n, t);
    if ((t.rocket || t.fission) && (C.ui || {}).autoRun !== false) buildAutoRun(n, t);
    if (t.hire) buildHireControls(n, t);

    if (t.autoHire) (t.autoHire.hybrid && !n.dock ? buildAgencyManual : buildAgencyControls)(n, t);
    if (t.interestPct) buildBankControls(n, t);
    if (t.predict) buildMastControls(n, t);
    if (t.pullCost && GG.sim.beaconLocal()) buildBeaconControls(n, t);
    if (nameInHeader()) wireNameEdit(n, t);
    else if (((C.ui || {}).machineNames || {}).enabled !== false) buildNameBox(n, t);
    if (t.overdrive) buildRobotControls(n, t);
    buildSocketOrder(n);
    buildFlip(n);
    if (t.kind !== 'site') buildQuiet(n);
    if (t.kind !== 'site') buildSelectAll();
    buildSelectMore();
    buildCodexLink(t);
    buildMove([n.id]);
    buildDemolish(n, t);
    liftControls();
    if (tidy) tidyTools();
    el.inspector.scrollTop = keepScroll;
  };

  function liftControls() {
    if ((C.ui || {}).cardCtlFirst === false) return;
    let at = el.inspector.querySelector('.ln-strip') || el.inspector.querySelector('.insp-head');
    if (!at) return;
    for (const box of el.inspector.querySelectorAll('.insp-ctl')) {
      at.after(box);
      at = box;
    }
  }

  function buildSelectMore() {
    if (!UI.selectMoreOn()) return;
    const box = document.createElement('div');
    box.className = 'more-ctl';
    box.innerHTML = '<button class="more-btn"></button>' +
      '<div class="sc-out">' + GG.i18n.t('ui.selMoreNote') + '</div>';
    el.inspector.appendChild(box);
    const btn = box.querySelector('.more-btn');
    btn.textContent = GG.i18n.t(addMode ? 'ui.selMoreDone' : 'ui.selMore');
    btn.classList.toggle('armed', addMode);
    btn.onclick = function () {
      GG.audio.play('click');
      UI.setAddMode(!addMode);
    };
  }

  function keyHint(action) {
    const U2 = C.ui || {}, H = U2.hotkeys || {};
    if (!U2.keyHints || H.enabled === false || !H[action]) return '';
    if (GG.input && GG.input.touchUi && GG.input.touchUi()) return '';
    const k = String(H[action]);
    return ' <kbd>' + (k.length === 1 ? k.toUpperCase() : k) + '</kbd>';
  }

  function buildCodexLink(t) {
    if ((C.ui || {}).codexLink === false || t.kind !== 'machine') return;
    const box = document.createElement('div');
    box.className = 'cxl-ctl'; box.dataset.tool = 'codex';
    box.innerHTML = '<button class="cxl-btn">' + GG.i18n.t('ui.codex') + keyHint('codex') + '</button>';
    el.inspector.appendChild(box);
    box.querySelector('.cxl-btn').onclick = function () { UI.codexAt(t.id); };
  }

  UI.codexAt = function (typeId) {
    GG.audio.play('click');
    codexTab = 'machines';

    const tt = C.nodeTypes[typeId];
    if (tt && cxFolded[tt.category]) { delete cxFolded[tt.category]; cxFoldSave(); }
    UI.openPanel('codex');

    const grid = GG.codexGrid && GG.codexGrid.on() ? GG.codexGrid.tileOf(typeId) : null;
    const item = grid || el.panel.querySelector('.cx-item[data-cx="' + typeId + '"]');
    const sc = el.panel.querySelector('.pn-card');
    if (!item || !sc) return false;

    const top = function (e) { let y = 0; for (; e; e = e.offsetParent) y += e.offsetTop; return y; };
    const y = top(item) - top(sc) - sc.clientTop;
    sc.scrollTop = Math.max(0, y - Math.max(0, (sc.clientHeight - item.offsetHeight) / 2));
    if (grid) { GG.codexGrid.open(grid); return true; }
    item.classList.remove('cx-flash'); void item.offsetWidth; item.classList.add('cx-flash');
    return true;
  };

  function buildMove(ids) {

    if (S.locked()) return;
    if (!S.canRelocate()) return;
    if (S.openLocations().length < 2) return;

    const free = ids.map(S.node).filter(n => S.freeStanding(n) || S.onSiteMove(n));
    if (!free.length) return;
    const T = GG.i18n.t;
    const box = document.createElement('div');
    box.className = 'move-ctl'; box.dataset.tool = 'move';
    box.innerHTML = '<button class="move-btn">' + T('ui.moveTo') + keyHint('move') + '</button>' +
      '<div class="sc-out">' + T('ui.moveNote') + '</div>';
    el.inspector.appendChild(box);
    box.querySelector('.move-btn').onclick = function () { UI.moveSelection(); };
  }

  UI.moveSelection = function () {
    const T = GG.i18n.t;
    if (!S.canRelocate()) return false;
    const ids = UI.selectedIds();
    if (!ids.length) { GG.audio.play('deny'); UI.toast(T('ui.moveNone'), true); return false; }
    if (S.openLocations().length < 2) {
      GG.audio.play('deny'); UI.toast(T('ui.moveAlone'), true); return false;
    }
    const free = ids.map(S.node).filter(n => S.freeStanding(n) || S.onSiteMove(n));
    if (!free.length) { GG.audio.play('deny'); UI.toast(T('ui.moveStuck'), true); return false; }
    const res = GG.input.startMove(free.map(n => n.id));
    if (!res || !res.ok) return false;
    GG.audio.play('click');
    UI.toast(T('ui.moveHint') +
      (res.skipped ? ' — ' + res.skipped + ' ' + T('ui.moveOnSite') : ''));
    return true;
  };

  UI.flyToIndex = function (i) {
    const open = S.openLocations();
    if (i < 0 || i >= open.length) return false;
    if (open[i].id === S.g.loc) return false;
    UI.flyTo(open[i].id);
    return true;
  };

  function cardTint(t) {
    const T = (C.ui || {}).cardTint || {}, ins = el.inspector;
    const hex = t && T.enabled ? String((C.iconColor ? C.iconColor(t) : t.color) || '') : '';
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    ins.classList.toggle('mc-tint', !!m);
    if (!m) return;
    const v = parseInt(m[1], 16);
    ins.style.setProperty('--mc-rgb', (v >> 16 & 255) + ',' + (v >> 8 & 255) + ',' + (v & 255));
    ins.style.setProperty('--mc-wash', String(T.wash === undefined ? 0.16 : T.wash));
    ins.style.setProperty('--mc-edge', String(T.edge === undefined ? 0.55 : T.edge));
  }

  function renderGroup() {
    cardTint(null);
    el.inspector.classList.remove('hidden');
    const nodes = selected.map(S.node).filter(Boolean);
    const sig = 'group|' + selected.join(',') + '|' + (addMode ? 1 : 0);
    if (sig === inspBuilt) return;
    inspBuilt = sig;
    splitRefresh = null;
    inspLive = [];
    const tidy = !!((C.ui || {}).inspTidy || {}).enabled;

    const counts = {};
    nodes.forEach(n => { counts[n.type] = (counts[n.type] || 0) + 1; });
    const onSite = nodes.filter(n => !S.freeStanding(n)).length;

    const inner = S.g.links.filter(l =>
      selected.indexOf(l.from) >= 0 && selected.indexOf(l.to) >= 0).length;

    let refund = 0, refCur = null;
    const spent = {};
    nodes.forEach(function (n) {

      spent[n.type] = (spent[n.type] || 0) + 1;
      const p = S.priceOf(n.type, -spent[n.type]);
      if (p > 0) { refund += Math.floor(p * C.balance.refundRatio); refCur = S.priceCurrencyOf(n.type); }
    });

    el.inspector.innerHTML =
      '<div class="insp-head" style="--accent:var(--gold)">' +
        '<span class="insp-ic">' + IC.svg('split', 20, 'var(--gold)') + '</span>' +
        '<span><b>' + GG.i18n.t('ui.selCount').replace('%n', nodes.length) + '</b></span>' +
        '<button class="insp-x" title="' + GG.i18n.t('ui.selClear') + '"></button>' +
      '</div>' +
      '<div class="insp-desc">' + GG.i18n.t('ui.selDesc') + '</div>' +
      (tidy

        ? '<div class="insp-rows ln-tidy" style="--accent:var(--gold)">' +
          '<div class="ln-sec">' + GG.i18n.t('ui.secMachines') + '</div>' +
          Object.keys(counts).map(k =>
            '<div class="ln-row"><i style="--rc:' + C.nodeTypes[k].color + '"></i><span>' +
            C.nodeTypes[k].name + '</span><b>&times;' + counts[k] + '</b><em class="ln-note"></em></div>').join('') +
          '<div class="ln-sec">' + GG.i18n.t('ui.secDetails') + '</div>' +
          '<div class="row"><span>' + GG.i18n.t('ui.selWires') + '</span><b>' + inner + '</b></div>' +
          '</div>'
        : '<div class="insp-rows">' +
          Object.keys(counts).map(k =>
            '<div class="row"><span>' + C.nodeTypes[k].name + '</span><b>&times;' +
            counts[k] + '</b></div>').join('') +
          '<div class="row"><span>' + GG.i18n.t('ui.selWires') + '</span><b>' + inner + '</b></div>' +
          '</div>');

    const x = el.inspector.querySelector('.insp-x');
    x.innerHTML = IC.svg('close', 13);
    x.onclick = function () { UI.clearSelection(); };

    const bpBox = document.createElement('div');
    bpBox.className = 'split-ctl bp-save';
    bpBox.innerHTML =
      '<div class="sc-head">' + GG.i18n.t('ui.saveBlueprint') + '</div>' +
      '<input class="bp-name" type="text" maxlength="28" placeholder="' +
        GG.i18n.t('ui.bpName') + '">' +
      '<button class="pn-buy bp-go">' +
        (nodes.length - onSite === 1
          ? GG.i18n.t('ui.bpSaveOne')
          : GG.i18n.t('ui.bpSave').replace('%n', nodes.length - onSite)) +
      '</button>' +
      '<div class="sc-out">' +
        (onSite ? GG.i18n.t('ui.bpOnSite').replace('%n', onSite) : GG.i18n.t('ui.bpKeeps')) +
      '</div>';
    el.inspector.appendChild(bpBox);
    const nameBox = bpBox.querySelector('.bp-name');
    bpBox.querySelector('.bp-go').onclick = function () {
      const res = S.makeBlueprint(selected, nameBox.value);
      if (!res.ok) { GG.audio.play('deny'); UI.toast(res.why, true); return; }
      GG.audio.play('skill');
      if (res.skipped || !UI.quiet('bpSaved')) UI.toast('Blueprint saved: ' + res.bp.name +
        (res.skipped ? ' — ' + res.skipped + ' on-site machine' +
                       (res.skipped === 1 ? '' : 's') + ' left out' : ''));
      UI.syncLaunchers();
      if (panelKind === 'blueprints') UI.renderPanel();
    };

    buildSelectAll();
    buildSelectMore();

    buildMove(selected.slice());

    const box = document.createElement('div');
    box.className = 'demo-ctl';
    box.innerHTML = '<button class="demo-btn"></button>';
    el.inspector.appendChild(box);
    const btn = box.querySelector('.demo-btn');
    armDemolish(box, btn, nodes,
      () => GG.i18n.t('ui.demolishAll') + (refund > 0 ? '   +' + U.cur(refCur, refund) : ''),
      () => GG.i18n.t('ui.demoConfirmAll').replace('%n', nodes.length),
      function () {
      let back = 0, cur = null;
      const live = selected.filter(id => S.node(id));
      if (!live.length) return;
      live.forEach(function (id) {
        if (GG.render.demolishFx) GG.render.demolishFx(S.node(id));
        const r = S.removeNode(id);
        if (r && r.amount > 0) { back += r.amount; cur = r.currency; }
      });
      GG.audio.play('demolish');
      if (!UI.quiet('demolished')) UI.toast('Demolished ' + nodes.length + ' machines' +
        (back > 0 ? ' (+' + U.cur(cur, back) + ')' : ''));
      UI.clearSelection();
      UI.refreshPalette();
    });
    if (tidy) tidyTools();
  }

  function buildMastControls(n, t) {
    if (!t.predict || t.predict.canPause === false) return;
    const box = document.createElement('div');
    box.className = 'quiet-ctl insp-ctl';
    box.innerHTML = '<span></span><button class="quiet-btn"></button>';
    el.inspector.appendChild(box);

    const lab = box.querySelector('span');
    const btn = box.querySelector('.quiet-btn');
    function paint() {
      lab.textContent = GG.i18n.t('ui.forecast');
      btn.textContent = GG.i18n.t(n.mastOff ? 'ui.mastCharging' : 'ui.mastWatching');
      btn.classList.toggle('off', !!n.mastOff);
    }
    btn.onclick = function () {

      if (n.mastOff) delete n.mastOff; else n.mastOff = 1;
      paint();
      GG.audio.play('click');
    };
    paint();
  }

  function buildBeaconControls(n, t) {
    const box = document.createElement('div');
    box.className = 'quiet-ctl insp-ctl';
    box.innerHTML = '<span></span><button class="quiet-btn"></button>';
    el.inspector.appendChild(box);
    const lab = box.querySelector('span');
    const btn = box.querySelector('.quiet-btn');
    function paint() {
      lab.textContent = GG.i18n.t('ui.meteorites');
      btn.textContent = GG.i18n.t(n.autoPull ? 'ui.autoPull' : 'ui.byHand');
      btn.classList.toggle('off', !n.autoPull);
    }
    btn.onclick = function () {
      if (n.autoPull) delete n.autoPull; else n.autoPull = 1;
      paint();
      GG.audio.play('click');
    };
    paint();
  }

  function buildRobotControls(n, t) {
    const od = t.overdrive;
    if (!od || od.enabled === false) return;
    if (GG.sim.robotFree(n)) return;
    const box = document.createElement('div');
    box.className = 'quiet-ctl insp-ctl';
    box.innerHTML = '<span></span><button class="quiet-btn"></button>';
    el.inspector.appendChild(box);

    const lab = box.querySelector('span');
    const btn = box.querySelector('.quiet-btn');
    function paint() {
      lab.textContent = GG.i18n.t('ui.overdrive')
        .replace('%o', GG.util.small(od.out || 1))
        .replace('%d', GG.util.small(GG.sim.overdriveDrain(t)));
      btn.textContent = GG.i18n.t(n.overdrive ? 'ui.odOn' : 'ui.odOff');
      btn.classList.toggle('off', !n.overdrive);
    }
    btn.onclick = function () {
      if (n.overdrive) delete n.overdrive; else n.overdrive = 1;
      paint();
      GG.sim.invalidate();
      GG.audio.play('click');
    };
    paint();
  }

  function buildSocketOrder(n) {
    const dirs = ['in', 'out'].filter(d => S.canReorder(n, d));
    if (!dirs.length) return;
    const T = GG.i18n.t;
    const box = document.createElement('div');
    box.className = 'split-ctl so-ctl';
    const redo = function () { GG.audio.play('click'); inspBuilt = null; UI.renderInspector(); };
    let h = '';
    dirs.forEach(function (d) {
      const ids = S.portOrderOf(n, d), ports = S.portsOf(n, d);
      h += '<div class="sc-head">' + T(d === 'in' ? 'ui.sockOrderIn' : 'ui.sockOrderOut') + '</div>';
      ids.forEach(function (id, k) {
        const p = ports.find(q => q.id === id), res = C.resources[S.portRes(n, p, d) || p.res] || {};
        h += '<div class="so-row"><i style="--rc:' + (res.color || 'var(--muted)') + '"></i><span>' + S.portLabel(n, p, d) + '</span>' +
          '<button data-so="' + d + ',' + k + ',-1"' + (k === 0 ? ' disabled' : '') + '>▲</button>' +
          '<button data-so="' + d + ',' + k + ',1"' + (k === ids.length - 1 ? ' disabled' : '') + '>▼</button></div>';
      });
    });
    h += '<button class="so-untangle">' + T('ui.untangle') + '</button>';
    if (n.portOrder) h += '<button class="so-reset">' + T('ui.sockUsual') + '</button>';
    box.innerHTML = h;
    el.inspector.appendChild(box);
    box.querySelectorAll('[data-so]').forEach(function (b) {
      b.onclick = function () {
        const parts = b.dataset.so.split(','), d = parts[0], i = +parts[1], j = i + (+parts[2]);
        const ids = S.portOrderOf(n, d);
        if (j < 0 || j >= ids.length) return;
        const tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp;
        S.setPortOrder(n, d, ids); redo();
      };
    });
    box.querySelector('.so-untangle').onclick = function () {
      dirs.forEach(function (d) {
        const ids = S.portOrderOf(n, d);
        const far = function (id) {
          const ls = S.g.links.filter(l => d === 'in' ? (l.to === n.id && l.toPort === id) : (l.from === n.id && l.fromPort === id));
          const ys = ls.map(function (l) {
            const o = S.node(d === 'in' ? l.from : l.to);
            return o ? GG.render.portPos(o, d === 'in' ? 'out' : 'in', d === 'in' ? l.fromPort : l.toPort).y : null;
          }).filter(y => y !== null);
          return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : null;
        };
        const wired = ids.filter(id => far(id) !== null).sort((a, b) => far(a) - far(b));
        S.setPortOrder(n, d, wired.concat(ids.filter(id => far(id) === null)));
      });
      redo();
    };
    const rs = box.querySelector('.so-reset');
    if (rs) rs.onclick = function () { delete n.portOrder; redo(); };
  }

  function buildFlip(n) {
    if (!GG.render.canFlip(n)) return;
    const box = document.createElement('div');
    box.className = 'quiet-ctl'; box.dataset.tool = 'flip';
    box.innerHTML = '<span></span><button class="quiet-btn"></button>';
    el.inspector.appendChild(box);

    const lab = box.querySelector('span');
    const btn = box.querySelector('.quiet-btn');
    function paint() {
      lab.innerHTML = GG.i18n.t('ui.sockets') + keyHint('flip');
      btn.textContent = GG.i18n.t(n.flip ? 'ui.socketsFlipped' : 'ui.socketsNormal');
      btn.classList.toggle('off', !!n.flip);
    }
    btn.onclick = function () {
      S.undoPush({ kind: 'flip', items: [{ id: n.id, flip: n.flip ? 1 : 0 }] });
      if (n.flip) delete n.flip; else n.flip = 1;
      paint();
      GG.audio.play('click');
    };
    paint();
  }

  UI.flipSelection = function () {
    const T = GG.i18n.t;
    const ids = UI.selectedIds();
    if (!ids.length) { GG.audio.play('deny'); UI.toast(T('ui.flipNone'), true); return false; }
    const able = ids.map(S.node).filter(n => n && GG.render.canFlip(n));
    if (!able.length) { GG.audio.play('deny'); UI.toast(T('ui.flipStuck'), true); return false; }
    S.undoPush({ kind: 'flip', items: able.map(n => ({ id: n.id, flip: n.flip ? 1 : 0 })) });
    able.forEach(n => { if (n.flip) delete n.flip; else n.flip = 1; });
    GG.audio.play('click');
    UI.rebuildInspector();
    return true;
  };

  function buildQuiet(n) {
    if ((C.diagnose || {}).mute === false) return;
    const box = document.createElement('div');
    box.className = 'quiet-ctl'; box.dataset.tool = 'alerts';
    box.innerHTML = '<span></span><button class="quiet-btn"></button>';
    el.inspector.appendChild(box);

    const lab = box.querySelector('span');
    const btn = box.querySelector('.quiet-btn');
    function paint() {
      lab.textContent = GG.i18n.t('ui.alerts');
      btn.textContent = n.quiet ? GG.i18n.t('ui.alertsMuted') : GG.i18n.t('ui.alertsOn');
      btn.classList.toggle('off', !!n.quiet);
    }
    btn.onclick = function () {

      if (n.quiet) delete n.quiet; else n.quiet = 1;
      paint();
      GG.audio.play('click');
      UI.syncStuck(true);
    };
    paint();
  }

  UI.demolishSelection = function () {
    const T = GG.i18n.t;

    const open = el.inspector && !el.inspector.classList.contains('hidden') && selected.some(id => S.node(id));
    const btn = open && el.inspector.querySelector('.demo-btn');
    if (!btn) {
      GG.audio.play('deny');
      UI.toast(T('ui.demolishNone'), true);
      return false;
    }
    btn.click();
    return true;
  };

  const LOSS_KEYS = ['rocket', 'flight', 'kw', 'wf', 'kg', 'recruits', 'arrays', 'stretches', 'loads', 'batches',
                     'domes', 'kits', 'crew', 'licence', 'work'];
  function demoLoss(nodes) {
    const sum = {}, tills = {};
    const add = (k, v) => { if (v > 1e-6) sum[k] = (sum[k] || 0) + v; };
    const kgIn = o => Object.keys(o || {}).reduce((a, k) => a + (typeof o[k] === 'number' ? o[k] : 0), 0);
    nodes.forEach(n => {
      const t = n && S.type(n);
      if (!t) return;
      add(t.bankRes === 'wf' ? 'wf' : 'kw', (t.store ? n.store || 0 : 0) + (t.bank ? n.bank || 0 : 0));
      if (!t.store && !t.bank) add('kg', kgIn(n.buf) + kgIn(n.obuf) + kgIn(n.bufB));
      add('recruits', n.recruits || 0);

      if (t.rocket && (C.ui || {}).rocketLoss !== false) {
        if (n.built) add('rocket', 1);
        if (Sim.rocketLeft(n) > 0) add('flight', 1);
      }

      const R = t.recipe || {};
      if (!t.convert) add(R.power ? (R.crew ? 'stretches' : 'arrays') : R.boost ? 'loads'
                          : R.ci ? 'domes' : R.gem ? 'batches' : t.powerUp ? 'kits' : 'batches',
                          n.made || 0);
      add('crew', Sim.crewOf(n));
      if (t.licence) add('licence', Sim.licenceLeft(n));
      if ((n.wfPool || 0) > 1e-6 || (n.kwPool || 0) > 1e-6) add('work', 1);
      [['till', t.collect], ['tillB', t.collectB]].forEach(function (p) {
        if (p[1] && (n[p[0]] || 0) > 1e-6) tills[p[1].cur] = (tills[p[1].cur] || 0) + n[p[0]];
      });
    });
    const T = GG.i18n.t, I = GG.i18n, facts = [];
    LOSS_KEYS.forEach(function (k) {
      const v = sum[k];
      if (!v) return;
      const val = k === 'kw' ? I.ins(U.fmt(v) + ' KW') : k === 'wf' ? I.ins(U.fmt(v) + ' WF')
                : k === 'kg' ? I.ins(U.kg(v))
                : k === 'licence' ? I.ins(Math.ceil(v) + 's') : String(Math.round(v));
      facts.push(T('ui.loss.' + k) + (k === 'work' || k === 'flight' ? '' : ': ' + val));
    });
    Object.keys(tills).forEach(c => facts.push(T('ui.loss.till') + ': ' + U.cur(c, tills[c])));
    const routing = nodes.every(function (n) {
      const t = n && S.type(n);
      return t && (t.merge || t.splitter) && !t.store && !t.bank && !t.holdLock;
    });
    return { facts: facts, quick: routing && !facts.length };
  }

  function keepPlural(k, key) {
    const f = String(GG.i18n.t(key)).split('|');
    if (f.length === 1) return f[0];
    if (f.length === 2) return k === 1 ? f[0] : f[1];
    const a = k % 10, b = k % 100;
    return (a === 1 && b !== 11) ? f[0] : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? f[1] : f[2];
  }
  function keepLoss(nodes) {
    const K = (C.ui || {}).keepAsk || {};
    if (K.enabled === false) return [];
    const out = [];
    nodes.forEach(function (n) {
      const t = n && S.type(n);
      if (!t) return;
      if (t.powerUp && K.kits !== false) {
        const v = Math.round(n.made || 0), r = C.resources[t.powerUp.res] || {};
        if (v > 0) out.push({ t: t, what: GG.i18n.t(r.name || t.powerUp.res) + ' × ' + v });
        return;
      }
      const kind = (K.types || {})[t.id];
      if (!kind) return;
      if (kind === 'gold') {
        const g = (n.buf && n.buf.gold) || 0;
        if (g > 1e-6) out.push({ t: t, what: GG.i18n.ins(U.kg(g)) + ' ' + GG.i18n.t('ui.keep.gold') });
        return;
      }
      const v = Math.round(kind === 'recruits' ? n.recruits || 0 : n.made || 0);
      if (v > 0) out.push({ t: t, what: v + ' ' + keepPlural(v, 'ui.keep.' + kind) });
    });
    return out;
  }
  let keepBox = null;
  UI.keepAskOpen = function () { return !!(keepBox && keepBox.isConnected); };
  function closeKeep() { if (keepBox) keepBox.remove(); keepBox = null; }
  window.addEventListener('keydown', function (ev) {
    if (!UI.keepAskOpen()) return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    if (ev.key === 'Escape' || ev.key === 'Enter') { GG.audio.play('click'); closeKeep(); }
  }, true);
  function openKeep(nodes, lost, refundText, run) {
    closeKeep();
    const T = GG.i18n.t, K = (C.ui || {}).keepAsk || {};
    const k = nodes.length;
    const title = k === 1 ? T('ui.keep.title') : keepPlural(k, 'ui.keep.titleN').replace('%n', k);
    const canMove = K.moveBtn !== false && S.canRelocate() && S.openLocations().length > 1;
    keepBox = document.createElement('div');
    keepBox.className = 'fc-wrap keep-wrap';
    keepBox.innerHTML =
      '<div class="fc-card keep-card">' +
        '<div class="fc-head"><span class="fc-ic">' + IC.svg(lost[0].t.icon, 20, lost[0].t.color) + '</span>' +
          '<span class="fc-title">' + title + '</span>' +
          '<button class="fc-x" type="button">' + IC.svg('close', 14) + '</button></div>' +
        '<div class="fc-body">' +
          '<div class="fc-sec fc-bad"><h4>' + T('ui.keep.lost') + '</h4>' +
            lost.map(x => '<div class="keep-row"><span class="keep-ic">' + IC.svg(x.t.icon, 16, x.t.color) +
              '</span><span class="keep-name">' + T(x.t.name) + '</span><span class="keep-what">' + x.what +
              '</span></div>').join('') +
          '</div>' +
          '<p class="keep-hint">' + T('ui.keep.hint') + '</p>' +
        '</div>' +
        '<div class="fc-foot">' +
          '<button class="fc-go keep-go" type="button">' + T(k > 1 ? 'ui.keep.goAll' : 'ui.keep.go') +
            refundText + '</button>' +
          (canMove ? '<button class="fc-cancel keep-move" type="button">' + T('ui.keep.move') + '</button>' : '') +
          '<button class="fc-cancel keep-keep" type="button">' + T('ui.keep.keep') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(keepBox);
    const keep = function () { GG.audio.play('click'); closeKeep(); };
    keepBox.querySelector('.fc-x').onclick = keep;
    keepBox.querySelector('.keep-keep').onclick = keep;
    keepBox.onclick = function (ev) { if (ev.target === keepBox) keep(); };
    const mv = keepBox.querySelector('.keep-move');
    if (mv) mv.onclick = function () { closeKeep(); UI.moveSelection(); };
    keepBox.querySelector('.keep-go').onclick = function () { closeKeep(); run(); };
    keepBox.querySelector('.keep-keep').focus();
  }

  function armDemolish(box, btn, nodes, idle, armedText, run) {

    if (S.locked()) { box.remove(); return; }
    const D = (C.ui || {}).demolishConfirm || {}, on = D.enabled !== false;
    const why = document.createElement('div');
    why.className = 'demo-why';
    why.hidden = true;
    box.appendChild(why);
    let armed = false, timer = null;
    function paint() {
      btn.innerHTML = (armed ? armedText() : idle()) + keyHint('demolish');
      btn.classList.toggle('armed', armed);
      why.hidden = !(armed && on);
    }
    btn.onclick = function () {

      const lost = keepLoss(nodes);
      if (lost.length) {
        clearTimeout(timer); armed = false; paint();
        GG.audio.play('click');
        const m = /(\s+\+.*)$/.exec(idle());
        openKeep(nodes, lost, m ? m[1] : '', run);
        return;
      }
      const loss = on ? demoLoss(nodes) : { facts: [], quick: false };
      if (!armed && !loss.quick) {
        armed = true;
        if (on) {
          const T = GG.i18n.t;
          const name = nodes.length === 1 ? S.type(nodes[0]).name
                     : T('ui.demoGroup').replace('%n', nodes.length);
          why.textContent = loss.facts.length
            ? T('ui.demoWhy').replace('%s', name).replace('%l', loss.facts.join(', '))
            : T('ui.demoWhyNone').replace('%s', name);
        }
        paint(); GG.audio.play('click');
        timer = setTimeout(function () { armed = false; paint(); },
                           (on ? (D.armSec || 5) : 3) * 1000);
        return;
      }
      clearTimeout(timer);
      run();
    };
    paint();
  }

  function buildDemolish(n, t) {

    const refund = Math.floor(S.priceOf(t.id, -1) * C.balance.refundRatio);
    const cur = S.priceCurrencyOf(t.id);
    const box = document.createElement('div');
    box.className = 'demo-ctl';
    box.innerHTML = '<button class="demo-btn"></button>';
    el.inspector.appendChild(box);

    const btn = box.querySelector('.demo-btn');
    armDemolish(box, btn, [n],
      () => GG.i18n.t('ui.demolish') + (refund > 0 ? '   +' + U.cur(cur, refund) : ''),
      () => GG.i18n.t('ui.demolishSure'),
      function () {
      if (!S.node(n.id)) return;
      const name = t.name;
      if (GG.render.demolishFx) GG.render.demolishFx(n);
      const r = S.removeNode(n.id);
      GG.audio.play('demolish');
      if (!UI.quiet('demolished')) UI.toast('Demolished ' + name + (r && r.amount > 0
        ? ' (+' + U.cur(r.currency, r.amount) + ')' : ''));
      UI.selectNode(null);
      UI.refreshPalette();
    });
  }

  function onCalcEnter(f, apply, show) {
    f.onkeydown = function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const v = U.calc(f.value);
      if (v !== null && v >= 0) apply(v);

      f.blur();
      show();
      GG.audio.play('click');
    };
  }

  function calcText(v) {
    if (typeof v !== 'number' || !isFinite(v)) return '';
    return String(+v.toFixed(4));
  }

  function buildPrioControls(n) {
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl';
    box.innerHTML =
      '<div class="sc-head">' + GG.i18n.t('ui.prioHead') + '</div>' +
      '<div class="sc-drain"></div>' +
      '<div class="sc-out"></div>';
    el.inspector.appendChild(box);
    const wrap = box.querySelector('.sc-drain');
    const out = box.querySelector('.sc-out');
    const name = s => GG.i18n.t('ui.prioSide').replace('%s', s.toUpperCase());
    ['a', 'b'].forEach(function (s) {
      const b = document.createElement('button');
      b.className = 'sc-chip';
      b.textContent = name(s);
      b._v = s;
      b.onclick = function () { n.prio = s; show(); GG.audio.play('click'); };
      wrap.appendChild(b);
    });
    function show() {
      const p = GG.sim.prioSide(n), o = p === 'a' ? 'b' : 'a';
      for (const b of wrap.children) b.classList.toggle('on', b._v === p);
      out.textContent = n.prioOn === false
        ? GG.i18n.t('ui.prioOff').replace('%s', name(p)).replace('%s', name(o))
        : GG.i18n.t('ui.prioOn').replace('%s', name(p));
    }
    show();
    splitRefresh = show;
  }

  function amountOn() { const A = C.splitter && C.splitter.amount; return !!(A && A.enabled); }
  function modeChips() {
    if (!amountOn()) return '';
    return '<div class="sc-drain sc-mode">' +
      '<button class="sc-chip" data-mode="ratio">' + GG.i18n.t('ui.splitByRatio') + '</button>' +
      '<button class="sc-chip" data-mode="amount">' + GG.i18n.t('ui.splitByAmount') + '</button></div>';
  }
  function bindModeChips(box, n, keys, redraw) {
    box.querySelectorAll('[data-mode]').forEach(function (b) {
      b.classList.toggle('on', (n.splitMode === 'amount') === (b.dataset.mode === 'amount'));
      b.onclick = function () {
        const want = b.dataset.mode === 'amount' ? 'amount' : 'ratio';
        if ((n.splitMode === 'amount') === (want === 'amount')) return;
        if (want === 'amount') {

          keys.slice(0, -1).forEach(function (k) {
            const now = (n.rates && n.rates['out:' + k]) || 0;
            if (typeof n['x' + k] !== 'number') n['x' + k] = Math.round(now * 100) / 100;
          });
        }
        n.splitMode = want === 'amount' ? 'amount' : undefined;
        if (!n.splitMode) delete n.splitMode;
        GG.audio.play('click');
        redraw();
      };
    });
  }

  function amtLine(n, keys) {
    const r = n.rates || {}, moving = keys.some(k => (r['out:' + k] || 0) > 1e-6);
    return (moving
      ? keys.map(k => U.fmt(r['out:' + k] || 0, 2))
      : keys.map((k, i) => i < keys.length - 1 ? U.fmt(n['x' + k] || 0, 2) : GG.i18n.t('ui.splitRest'))
    ).join(' / ') + ' ' + splitUnit(n);
  }
  function splitUnit(n) {
    const ip = S.portsOf(n, 'in')[0];
    const r = ip && C.resources[ip.res];
    return r && r.rate ? GG.i18n.ins(r.rate) : '';
  }

  function buildWaysControls(n, t) {
    const keys = Object.keys(t.defaultWeights || {});
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl';
    el.inspector.appendChild(box);
    let ins, out;
    function draw() {
      const amt = Sim.splitFixed(n);
      box.innerHTML =
        '<div class="sc-head">' + GG.i18n.t(amt ? 'ui.splitHeadAmt5' : 'ui.splitHead5') + '</div>' +
        modeChips() +
        '<div class="sc-pair sc-five">' + keys.map((k, i) => amt && i === keys.length - 1
          ? '<label>' + k.toUpperCase() + '<span class="sc-rest">' + GG.i18n.t('ui.splitRest') + '</span></label>'
          : '<label>' + k.toUpperCase() + '<input type="text" inputmode="text" data-side="' + k +
            '" title="' + GG.i18n.t('ui.calcHint') + '"></label>').join('') + '</div>' +
        '<div class="sc-out"></div>' +
        (amt ? '' : '<button class="sc-even">' + GG.i18n.t('ui.splitEven') + '</button>');
      bindModeChips(box, n, keys, draw);
      ins = box.querySelectorAll('input');
      out = box.querySelector('.sc-out');
      const fld = amt ? 'x' : 'w';
      ins.forEach(function (f) {
        f.oninput = function () {
          const v = U.calc(f.value);
          if (v === null || v < 0) return;
          n[fld + f.dataset.side] = v;
          show();
        };
        onCalcEnter(f, function (v) { n[fld + f.dataset.side] = v; }, show);
        f.onblur = show;
      });
      const ev = box.querySelector('.sc-even');
      if (ev) ev.onclick = function () {
        keys.forEach(k => { n['w' + k] = 1; }); show(); GG.audio.play('click');
      };
      show();
    }
    function show() {
      const fld = Sim.splitFixed(n) ? 'x' : 'w';
      ins.forEach(function (f) {
        if (f === document.activeElement) return;
        f.value = calcText(n[fld + f.dataset.side] || 0);
      });
      const fr = Sim.waysFracs(n), ip = S.portsOf(n, 'in')[0];
      const rate = (n.rateIn && ip) ? (n.rateIn[ip.id] || 0) : 0;
      const unit = ip && C.resources[ip.res] && S.type(n).splitter ? C.resources[ip.res].rate : '';
      out.textContent = rate > 0 && n.give
        ? keys.map(k => U.fmt(n.give[k] || 0, 2)).join(' / ') + ' ' + unit
        : Sim.splitFixed(n) ? amtLine(n, keys)
        : keys.map(k => Math.round(fr[k] * 100) + '%').join(' / ');
    }
    draw();
    splitRefresh = show;
  }

  function buildSplitControls(n, t) {
    if (t.priority) return buildPrioControls(n);
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl';
    el.inspector.appendChild(box);
    let ins, out;
    function draw() {
      const amt = Sim.splitFixed(n);
      box.innerHTML =
        '<div class="sc-head">' + GG.i18n.t(amt ? 'ui.splitHeadAmt' : 'ui.splitHead') + '</div>' +
        modeChips() +
        '<div class="sc-pair">' +
          '<label>A<input type="text" inputmode="text" data-side="a" title="' +
            GG.i18n.t('ui.calcHint') + '"></label>' +
          (amt
            ? '<label>B<span class="sc-rest">' + GG.i18n.t('ui.splitRest') + '</span></label>'
            : '<label>B<input type="text" inputmode="text" data-side="b" title="' +
              GG.i18n.t('ui.calcHint') + '"></label>') +
        '</div>' +
        '<div class="sc-out"></div>' +
        (amt ? '' : '<button class="sc-even">' + GG.i18n.t('ui.splitEven') + '</button>');
      bindModeChips(box, n, ['a', 'b'], draw);
      ins = box.querySelectorAll('input');
      out = box.querySelector('.sc-out');
      ins.forEach(function (f) {
        const put = function (v) {
          if (Sim.splitFixed(n)) n.xa = v;
          else if (f.dataset.side === 'a') n.wa = v; else n.wb = v;
        };
        f.oninput = function () {

          const v = U.calc(f.value);
          if (v === null || v < 0) return;
          put(v);
          show();
        };
        onCalcEnter(f, put, show);
        f.onblur = show;
      });
      const ev = box.querySelector('.sc-even');
      if (ev) ev.onclick = function () { n.wa = 1; n.wb = 1; show(); GG.audio.play('click'); };
      show();
    }
    function show() {
      const amt = Sim.splitFixed(n);
      ins.forEach(function (f) {
        if (f === document.activeElement) return;
        f.value = calcText(amt ? (n.xa || 0) : f.dataset.side === 'a' ? n.wa : n.wb);
      });
      const share = Sim.splitShare(n);
      const ip = S.portsOf(n, 'in')[0];
      const rate = (n.rateIn && ip) ? (n.rateIn[ip.id] || 0) : 0;

      const gA = (n.giveA !== undefined) ? n.giveA : rate * share;
      const gB = (n.giveB !== undefined) ? n.giveB : rate * (1 - share);
      out.textContent = rate > 0
        ? U.fmt(gA, 2) + ' / ' + U.fmt(gB, 2) + ' ' + C.resources[ip.res].rate
        : amt ? amtLine(n, ['a', 'b'])
        : Math.round(share * 100) + '% / ' + Math.round((1 - share) * 100) + '%';
    }
    draw();
    splitRefresh = show;
  }

  function push() { return !!(C.powerPush && C.powerPush.enabled); }

  function buildStoreControls(n, t) {
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl';
    box.innerHTML =
      '<div class="sc-head">' + GG.i18n.t('ui.outLimitHead') + '</div>' +
      '<div class="sc-pair sc-one">' +
        '<label>' + GG.i18n.ins('KW/h') + '<input type="text" inputmode="text" class="sc-cap" title="' +
          GG.i18n.t('ui.calcHint') + '"></label>' +
      '</div>' +
      '<div class="sc-out"></div>' +
      '<button class="sc-even">' + GG.i18n.t('ui.outLimitOff') + '</button>' +

      (push() ? '<div class="sc-head sc-head2">' + GG.i18n.t('ui.drainHead') + '</div>' +
                '<div class="sc-drain"></div>' +
                '<div class="sc-out sc-drain-note"></div>' : '');
    el.inspector.appendChild(box);

    const f = box.querySelector('.sc-cap');
    const out = box.querySelector('.sc-out');

    const drainWrap = box.querySelector('.sc-drain');
    const drainNote = box.querySelector('.sc-drain-note');
    if (drainWrap) {
      const steps = (C.powerPush && C.powerPush.drainSteps) || [null, 0];
      for (const v of steps) {
        const b = document.createElement('button');
        b.className = 'sc-chip';
        b.textContent = v === 'auto' ? GG.i18n.t('ui.drainAuto')
                      : v === null   ? GG.i18n.t('ui.drainFull')
                      : v === 0      ? GG.i18n.t('ui.drainHold')
                      : v + '×';
        b.onclick = function () { n.outMul = v; show(); GG.audio.play('click'); };
        b._v = v;
        drainWrap.appendChild(b);
      }
    }

    function show() {
      if (f !== document.activeElement) {
        f.value = (Sim.outLimit(n) === Infinity) ? '' : calcText(Sim.outLimit(n));
      }
      if (drainWrap) {

        const cur = Sim.drainMode(n);
        for (const b of drainWrap.children) b.classList.toggle('on', b._v === cur);
        drainNote.textContent =
            cur === 'auto' ? (Sim.autoBanking(n) ? GG.i18n.t('ui.drainAutoNow')
                                                 : GG.i18n.t('ui.drainAutoNote'))
          : cur === 0      ? GG.i18n.t('ui.drainHoldNote')
                           : GG.i18n.t('ui.drainFullNote');
      }
      const lim = Sim.outLimit(n);
      out.textContent = lim === Infinity
        ? GG.i18n.t('ui.outLimitNone')
        : GG.i18n.t('ui.outLimitAt').replace('%s', U.fmt(lim, 2)) +
          ' — ' + GG.i18n.ins(U.fmt(n.outRate || 0, 2) + ' KW/h');
    }
    f.oninput = function () {

      const v = U.calc(f.value);

      n.outCap = (v === null || v < 0) ? null : v;
      show();
    };
    onCalcEnter(f, function (v) { n.outCap = v; }, show);
    f.onblur = show;
    box.querySelector('.sc-even').onclick = function () {
      n.outCap = null; show(); GG.audio.play('click');
    };
    show();

    UI.liveInspector(show);
  }

  function buildFlowControls(n, t) {
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl';
    box.innerHTML =
      '<div class="sc-head">' + GG.i18n.t('ui.flowLimitHead') + '</div>' +
      '<div class="sc-pair sc-one">' +
        '<label>' + GG.i18n.ins('kg/h') + '<input type="text" inputmode="text" class="sc-cap" title="' +
          GG.i18n.t('ui.calcHint') + '"></label>' +
      '</div>' +
      '<div class="sc-out"></div>' +
      '<button class="sc-even">' + GG.i18n.t('ui.flowLimitOff') + '</button>';
    el.inspector.appendChild(box);

    const f = box.querySelector('.sc-cap');
    const out = box.querySelector('.sc-out');

    function show() {
      const lim = Sim.outLimit(n);
      if (f !== document.activeElement) f.value = (lim === Infinity) ? '' : calcText(lim);
      out.textContent = lim === Infinity
        ? GG.i18n.t('ui.flowLimitNone')
        : GG.i18n.t('ui.flowLimitAt').replace('%s', U.fmt(lim, 2)) +
          ' — ' + GG.i18n.ins(U.fmt((n.rates && n.rates['out:out']) || 0, 2) + ' kg/h');
    }
    f.oninput = function () {

      const v = U.calc(f.value);

      n.outCap = (v === null || v < 0) ? null : v;
      show();
    };
    onCalcEnter(f, function (v) { n.outCap = v; }, show);
    f.onblur = show;
    box.querySelector('.sc-even').onclick = function () {
      n.outCap = null; show(); GG.audio.play('click');
    };
    show();

    UI.liveInspector(show);
    splitRefresh = show;
  }

  function buildCrewLimit(n, t) {
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl';
    const unit = ' ' + GG.i18n.ins('WF/h');
    box.innerHTML =
      '<div class="sc-head">' + GG.i18n.t('ui.flowLimitHead') + '</div>' +
      '<div class="sc-pair sc-one">' +
        '<label>' + GG.i18n.ins('WF/h') + '<input type="text" inputmode="text" class="sc-cap" title="' +
          GG.i18n.t('ui.calcHint') + '"></label>' +
      '</div>' +
      '<div class="sc-out"></div>' +
      '<button class="sc-even">' + GG.i18n.t('ui.flowLimitOff') + '</button>';
    el.inspector.appendChild(box);
    const f = box.querySelector('.sc-cap');
    const out = box.querySelector('.sc-out');
    function show() {
      const lim = Sim.outLimit(n);
      if (f !== document.activeElement) f.value = (lim === Infinity) ? '' : calcText(lim);
      if (lim === Infinity) { out.textContent = GG.i18n.t('ui.crewLimitNone'); return; }
      const lost = n.wfLost || 0;
      out.textContent = GG.i18n.t('ui.crewLimitAt').replace('%s', U.fmt(lim, 2) + unit) +
        (lost > 0.005 ? '. ' + GG.i18n.t('ui.crewLimitLost').replace('%s', U.fmt(lost, 2) + unit) : '');
    }
    f.oninput = function () {
      const v = U.calc(f.value);
      n.outCap = (v === null || v < 0) ? null : v;
      show();
    };
    onCalcEnter(f, function (v) { n.outCap = v; }, show);
    f.onblur = show;
    box.querySelector('.sc-even').onclick = function () {
      n.outCap = null; show(); GG.audio.play('click');
    };
    show();
    UI.liveInspector(show);
    splitRefresh = show;
  }

  function nameInHeader() {
    const M = (C.ui || {}).machineNames || {};
    return M.enabled !== false && !!M.inHeader;
  }
  function headName(n, t) {
    const M = (C.ui || {}).machineNames || {};
    if (!nameInHeader()) return '<span><b>' + Sim.nameOf(n) + '</b></span>';
    return '<span class="nl-wrap"><span class="nl-row">' +
      '<b class="nl-name' + (M.clickName ? ' nl-click' : '') + '">' + Sim.nameOf(n) + '</b>' +
      '<button class="nl-pen" title="' + GG.i18n.t('ui.rename') + '">' + IC.svg('pen', 13) + '</button></span>' +
      (M.kindUnder && n.label ? '<i>' + t.name + '</i>' : '') + '</span>';
  }
  function wireNameEdit(n, t) {
    const M = C.ui.machineNames || {};
    const head = el.inspector.querySelector('.insp-head');
    const pen = head && head.querySelector('.nl-pen'), b = head && head.querySelector('.nl-name');
    if (!pen || !b) return;
    document.body.classList.toggle('nl-hover', !!M.hoverPen);
    let inp = null;
    const done = function (keep) {
      if (!inp) return;
      const v = inp.value.replace(/\s+/g, ' ').trim().slice(0, M.maxLen || 24);
      inp = null;
      if (keep && (v || null) !== (n.label || null)) { if (v) n.label = v; else delete n.label; }
      UI.rebuildInspector();
    };
    const start = function () {
      if (inp) return;
      inp = document.createElement('input');
      inp.className = 'nl-in'; inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false;
      inp.maxLength = M.maxLen || 24; inp.value = n.label || ''; inp.placeholder = t.name;
      b.replaceWith(inp);
      pen.innerHTML = IC.svg('tick', 13); pen.classList.add('ed'); pen.title = GG.i18n.t('ui.renameKeep');
      inp.addEventListener('keydown', function (e) {
        e.stopPropagation();
        if (e.key === 'Enter') done(true);
        if (e.key === 'Escape') done(false);
      });
      inp.addEventListener('keyup', function (e) { e.stopPropagation(); });
      inp.addEventListener('blur', function () { if (inp && inp.isConnected) done(true); });
      inp.focus(); inp.select();
      GG.audio.play('click');
    };
    pen.onmousedown = function (e) { e.preventDefault(); };
    pen.onclick = function () { if (inp) done(true); else start(); };
    if (M.clickName) b.onclick = start;
  }

  function buildNameBox(n, t) {
    const M = C.ui.machineNames || {};
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl name-ctl';
    box.innerHTML = '<div class="sc-head">' + GG.i18n.t('ui.nameHead') + '</div>' +
      '<div class="sc-pair sc-one"><label class="nm-lab"><input type="text" class="nm-in" autocomplete="off" spellcheck="false"></label></div>';
    const inp = box.querySelector('input');
    inp.maxLength = M.maxLen || 24;
    inp.value = n.label || '';
    inp.placeholder = t.name;
    inp.title = GG.i18n.t('ui.nameTip');
    const commit = function () {
      const v = inp.value.replace(/\s+/g, ' ').trim().slice(0, M.maxLen || 24);
      if ((v || null) === (n.label || null)) return;
      if (v) n.label = v; else delete n.label;
      UI.rebuildInspector();
    };
    inp.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') inp.blur();
      if (e.key === 'Escape') { inp.value = n.label || ''; inp.blur(); }
    });
    inp.addEventListener('blur', commit);
    const head = el.inspector.querySelector('.insp-head');
    if (head) head.after(box); else el.inspector.appendChild(box);
  }

  let prismGid = 0;
  UI.prismSvg = function (size) {
    const P = IC.paths.prism || [], id = 'prg' + (prismGid++);
    const cols = (C.prism && C.prism.rainbow) || ['#ff5f7e', '#ffa14d', '#ffe156', '#6ef08a', '#4fd6ff', '#7c7cff', '#d77bff'];
    const stops = cols.map((c, i) => '<stop offset="' + (i / (cols.length - 1)).toFixed(2) + '" stop-color="' + c + '"/>').join('');
    return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="' + id + '" x1="0.1" y1="0" x2="0.9" y2="1">' +
      stops + '</linearGradient></defs><path d="' + P[0] + '" fill="url(#' + id + ')" opacity=".9"/>' +
      '<g stroke="#ffffff" stroke-opacity=".9" stroke-width="1.3">' + P.map(d => '<path d="' + d + '"/>').join('') + '</g></svg>';
  };

  function dockTipOn() { return ((C.ui || {}).dockTip || {}).enabled !== false; }
  let dockTipEl = null, dockTipCard = null, dockTipTimer = 0;
  function dockTipHide() {
    clearTimeout(dockTipTimer); dockTipTimer = 0; dockTipCard = null;
    if (dockTipEl) dockTipEl.classList.add('hidden');
  }
  function dockTipShow(card) {
    if (!card.isConnected || !card.dataset.tip) return;
    if (!dockTipEl) {
      dockTipEl = document.createElement('div');
      dockTipEl.id = 'dock-tip'; dockTipEl.className = 'hidden';
      document.body.appendChild(dockTipEl);
    }
    dockTipEl.textContent = card.dataset.tip;
    dockTipEl.classList.remove('hidden');

    const z = GG.render.uiZoom ? GG.render.uiZoom() : 1, r = card.getBoundingClientRect();
    const w = dockTipEl.offsetWidth, h = dockTipEl.offsetHeight, vw = window.innerWidth / z;
    dockTipEl.style.left = U.clamp((r.left + r.width / 2) / z - w / 2, 8, Math.max(8, vw - w - 8)) + 'px';
    dockTipEl.style.top = Math.max(8, r.top / z - h - 10) + 'px';
  }
  function initDockTip() {
    document.addEventListener('mouseover', function (e) {
      const card = e.target && e.target.closest ? e.target.closest('.build-card[data-tip]') : null;
      if (card === dockTipCard) return;
      dockTipHide();
      if (!card || !dockTipOn() || (GG.input && GG.input.touchUi && GG.input.touchUi())) return;
      dockTipCard = card;
      dockTipTimer = setTimeout(function () { dockTipShow(card); }, ((C.ui || {}).dockTip || {}).delayMs || 0);
    });
    document.addEventListener('mousedown', dockTipHide, true);
    document.addEventListener('wheel', dockTipHide, { capture: true, passive: true });
  }

  UI.prismDrop = null;
  let prismChip = null;
  function prismOver(e) {
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    if (!hit) return null;
    if (el.inspector.contains(hit) && !el.inspector.classList.contains('hidden') && UI.selCount() === 1) {
      return { card: true, n: S.node(UI.selectedId()) };
    }
    if (hit !== GG.render.canvas) return null;
    const r = GG.render.canvas.getBoundingClientRect(), z = GG.render.uiZoom ? GG.render.uiZoom() : 1;
    const w = GG.render.toWorld((e.clientX - r.left) / z, (e.clientY - r.top) / z);
    const n = GG.render.hitNode(w.x, w.y);
    return n ? { n: n } : null;
  }
  function prismChipAt(e) {
    const z = GG.render.uiZoom ? GG.render.uiZoom() : 1;
    prismChip.style.left = (e.clientX / z - 18) + 'px';
    prismChip.style.top = (e.clientY / z - 18) + 'px';
  }
  function prismDragStart(e) {
    if (!Sim.prismSeen() || (e.button !== undefined && e.button !== 0)) return;
    e.preventDefault();
    if (!U.canAfford(S.bank('prism'), 1)) { UI.toast('No Prism left'); GG.audio.play('deny'); return; }
    prismChip = document.createElement('div');
    prismChip.className = 'prism-chip';
    prismChip.innerHTML = UI.prismSvg(26);
    document.body.appendChild(prismChip);
    prismChipAt(e);
    window.addEventListener('pointermove', prismDragMove, true);
    window.addEventListener('pointerup', prismDragEnd, true);
    window.addEventListener('pointercancel', prismDragEnd, true);
  }
  function prismDragMove(e) {
    if (!prismChip) return;
    prismChipAt(e);
    const o = prismOver(e), ok = !!(o && o.n && Sim.prismCan(S.type(o.n)));
    UI.prismDrop = ok ? o.n : null;
    el.inspector.classList.toggle('prism-drop', ok && !!o.card);
  }
  function prismDragEnd(e) {
    window.removeEventListener('pointermove', prismDragMove, true);
    window.removeEventListener('pointerup', prismDragEnd, true);
    window.removeEventListener('pointercancel', prismDragEnd, true);
    if (prismChip) prismChip.remove();
    prismChip = null; UI.prismDrop = null;
    el.inspector.classList.remove('prism-drop');
    if (e.type === 'pointercancel') return;
    const o = prismOver(e);
    if (o && o.n) UI.fitPrism(o.n);
  }
  UI.fitPrism = function (n) {
    const res = Sim.fitPrism(n);
    if (!res.ok) { UI.toast(res.why); GG.audio.play('deny'); return res; }
    GG.audio.play(res.full ? 'unlock' : 'build');
    if (GG.render.prismFx) GG.render.prismFx(n, res.full);
    Sim.invalidate();
    UI.rebuildInspector();
    return res;
  };
  UI.takePrism = function (n, k) {
    const res = Sim.takePrism(n, k);
    if (!res.ok) return res;
    GG.audio.play('click');
    Sim.invalidate();
    UI.rebuildInspector();
    return res;
  };

  const PR_ROWS = { Takes: 'in', Makes: 'out', 'Also out': 'out' };
  function prismNum(v) { return String(+v.toFixed(4)); }
  function prismSpec(n, t, r) {
    const P = C.prism || {}, side = PR_ROWS[r[0]];
    if (!side || P.specRows === false || !Sim.prismFull(n)) return GG.i18n.ins(r[1]);
    return String(r[1]).split(' + ').map(function (part) {
      const m = /^(\d+(?:\.\d+)?) (kg|KW|WF)\b/.exec(part);
      let mul = 1;
      if (m && side === 'out' && m[2] === 'kg') mul = P.outMul || 1;
      if (m && side === 'in' && (m[2] === 'KW' || m[2] === 'WF')) mul = P.drainMul || 1;
      if (m && side === 'in' && m[2] === 'kg' && t.wastePerWf) mul = P.drainMul || 1;
      if (mul === 1) return GG.i18n.ins(part);
      const txt = GG.i18n.ins(prismNum(+m[1] * mul) + part.slice(m[1].length));
      return txt.replace(/^[\d.,]+/, function (d) { return '<span class="pr-up">' + d + '</span>'; });
    }).join(' + ');
  }
  function buildPrismControls(n, t) {
    const P = C.prism, T = k => GG.i18n.t(k);
    const need = Sim.prismSlots(t), have = Math.min(need, n.prisms || 0), full = Sim.prismFull(n);
    const sup = Sim.prismSupply(t), kw = sup.indexOf('energy') >= 0, wf = sup.indexOf('wf') >= 0;
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl prism-ctl' + (full ? ' on' : '');
    let slots = '';
    for (let i = 0; i < need; i++) {
      slots += i < have
        ? '<button class="pr-slot full" title="' + T('ui.prismSlotOut') + '">' + UI.prismSvg(18) + '</button>'
        : '<span class="pr-slot"></span>';
    }
    const bar = function (label, v, col) {
      const x = full ? v : 1;
      return '<div class="pr-l"><span>' + label + '</span><b style="color:' + (full ? col : 'var(--muted)') + '">x' +
        x.toFixed(2) + '</b></div><div class="pr-bar"><i style="width:' + Math.round(100 * Math.min(1, x / 3)) +
        '%;background:' + (full ? col : '#3a4a5e') + '"></i></div>';
    };
    box.innerHTML =
      '<div class="sc-head">' + T('ui.prismHead') + ' · ' + have + ' / ' + need +
        (full ? ' · ' + T('ui.prismWorking') : have ? ' · ' + T('ui.prismWait').replace('%n', need - have) : '') + '</div>' +
      '<div class="pr-slots">' + slots + '</div>' +
      (P.cardBars ? bar(T('ui.prismOut'), P.outMul, P.outColor) +
        bar(T(kw && wf ? 'ui.prismBoth' : kw ? 'ui.prismPower' : 'ui.prismCrew'), P.drainMul, P.drainColor) : '') +
      (have < need ? '<div class="sc-out">' + T('ui.prismDrag') + '</div>' : '') +
      (have ? '<div class="sc-drain"><button class="sc-chip pr-out">' + T('ui.prismTake').replace('%n', have) + '</button></div>' : '');
    el.inspector.appendChild(box);
    box.querySelectorAll('.pr-slot.full').forEach(function (b) { b.onclick = function () { UI.takePrism(n, 1); }; });
    const out = box.querySelector('.pr-out');
    if (out) out.onclick = function () { UI.takePrism(n, n.prisms || 0); };
  }

  function findOn() { return ((C.ui || {}).machineFind || {}).enabled !== false; }
  let findSel = 0, findHits = [];
  function findEsc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  UI.findMachines = function (q) {
    const w = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!w.length) return [];
    const locName = id => (C.locations.find(l => l.id === id) || {}).name || '';
    const hits = S.g.nodes.filter(n => { const t = S.type(n); return t && t.kind === 'machine' && t.buildable !== false; })
      .map(n => ({ n: n, h: [n.label, Sim.nameOf(n), S.type(n).name, locName(n.loc)].filter(Boolean).join(' ').toLowerCase() }))
      .filter(x => w.every(k => x.h.indexOf(k) >= 0));
    hits.sort((a, b) => (!!b.n.label - !!a.n.label) || ((b.n.loc === S.g.loc) - (a.n.loc === S.g.loc)));
    return hits.slice(0, (C.ui.machineFind || {}).max || 8).map(x => x.n);
  };
  UI.findGo = function (n) {
    const F = C.ui.machineFind || {};
    const loc = n.loc || C.locations[0].id;
    UI.closeFind();
    const land = function () {
      const tx = n.x, ty = n.y, cam = S.g.camera;
      if (loc !== S.g.loc || !(F.glideMs > 0)) { cam.x = tx; cam.y = ty; }
      else {
        const x0 = cam.x, y0 = cam.y, t0 = performance.now();
        const step = function () {
          const k = Math.min(1, (performance.now() - t0) / F.glideMs), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          cam.x = x0 + (tx - x0) * e; cam.y = y0 + (ty - y0) * e;
          if (k < 1) requestAnimationFrame(step);
        };
        step();
      }
      UI.selectNode(n);
      if (GG.render.findPulse) GG.render.findPulse(n, F.pulseSec || 2.4);
    };
    if (loc !== S.g.loc) { UI.flyTo(loc); setTimeout(land, 60); } else land();
  };
  function findPaint(q) {
    const pop = document.getElementById('find-pop'), list = pop.querySelector('.fd-list');
    findHits = UI.findMachines(q); findSel = 0;
    if (String(q).trim() && !findHits.length) { list.innerHTML = '<div class="fd-none">' + GG.i18n.t('ui.findNone') + '</div>'; return; }
    list.innerHTML = findHits.map(function (n, i) {
      const t = S.type(n), L = C.locations.find(l => l.id === n.loc) || {};
      return '<button class="fd-hit" data-i="' + i + '">' + IC.svg(t.icon, 18, C.iconColor(t)) +
        '<b>' + findEsc(Sim.nameOf(n)) + '</b>' + (n.label ? '<i>' + findEsc(t.name) + '</i>' : '') +
        '<span class="fd-loc">' + (n.loc === S.g.loc ? GG.i18n.t('ui.findHere') : findEsc(L.name || '')) + '</span></button>';
    }).join('');
    list.querySelectorAll('.fd-hit').forEach(function (b) {
      b.onmouseenter = function () { findSel = +b.dataset.i; findMark(); };
      b.onclick = function () { GG.audio.play('click'); UI.findGo(findHits[+b.dataset.i]); };
    });
    findMark();
  }
  function findMark() {
    document.querySelectorAll('#find-pop .fd-hit').forEach((b, i) => b.classList.toggle('on', i === findSel));
  }
  UI.findOpen = function () { const p = document.getElementById('find-pop'); return !!p && !p.classList.contains('hidden'); };
  UI.openFind = function () {
    if (!findOn() || (GG.practice && GG.practice.active) || (GG.menu && GG.menu.isOpen())) return;
    const pop = document.getElementById('find-pop'), btn = document.getElementById('btn-find');
    const r = btn.getBoundingClientRect(), z = GG.render.uiZoom ? GG.render.uiZoom() : 1;
    pop.classList.remove('hidden');
    pop.style.top = (r.bottom / z + 8) + 'px';
    pop.style.left = Math.max(8, (r.right / z) - pop.offsetWidth) + 'px';
    const inp = pop.querySelector('input');
    inp.value = ''; findPaint('');
    setTimeout(function () { inp.focus(); }, 0);
  };
  UI.closeFind = function () {
    const pop = document.getElementById('find-pop');
    if (!pop || pop.classList.contains('hidden')) return false;
    pop.classList.add('hidden'); pop.querySelector('input').blur();
    return true;
  };
  function initFind() {
    const btn = document.getElementById('btn-find');
    if (!btn) return;
    document.body.classList.toggle('no-find', !findOn());
    const pop = document.createElement('div');
    pop.id = 'find-pop'; pop.className = 'hidden';
    pop.innerHTML = '<input type="text" autocomplete="off" spellcheck="false"><div class="fd-list"></div>';
    document.body.appendChild(pop);
    const inp = pop.querySelector('input');
    inp.placeholder = GG.i18n.t('ui.findPh');
    inp.addEventListener('input', function () { findPaint(inp.value); });
    inp.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Escape') { UI.closeFind(); return; }
      if (!findHits.length) return;
      if (e.key === 'ArrowDown') { findSel = (findSel + 1) % findHits.length; findMark(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { findSel = (findSel - 1 + findHits.length) % findHits.length; findMark(); e.preventDefault(); }
      else if (e.key === 'Enter') { GG.audio.play('click'); UI.findGo(findHits[findSel]); }
    });
    btn.onclick = function () { GG.audio.play('click'); if (!UI.closeFind()) UI.openFind(); };

    document.addEventListener('mousedown', function (e) {
      if (UI.findOpen() && !pop.contains(e.target) && !btn.contains(e.target)) UI.closeFind();
    }, true);
    window.addEventListener('keydown', function (e) {
      if (!findOn() || UI.findOpen()) return;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
      if (GG.menu && GG.menu.isOpen()) return;
      if (UI.overlayOpen && UI.overlayOpen()) return;
      if (((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) || (e.key === '/' && !e.ctrlKey)) {
        e.preventDefault(); e.stopImmediatePropagation(); UI.openFind();
      }
    }, true);
  }

  function buildAutoRun(n, t) {
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl auto-run';
    box.innerHTML = '<div class="sc-head">' + GG.i18n.t(t.rocket ? 'ui.autoLaunch' : 'ui.autoStart') + '</div>' +
      '<div class="sc-drain">' +
        '<button class="sc-chip" data-v="0">' + GG.i18n.t('ui.agSoundOff') + '</button>' +
        '<button class="sc-chip" data-v="1">' + GG.i18n.t('ui.agSoundOn') + '</button>' +
      '</div>';
    el.inspector.appendChild(box);
    function show() {
      box.querySelectorAll('button').forEach(b => b.classList.toggle('on', (b.dataset.v === '1') === !!n.autoRun));
    }
    box.querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { n.autoRun = b.dataset.v === '1'; GG.audio.play('click'); show(); };
    });
    show();
  }

  function buildFuelSwitch(n, t) {
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl fuel-sw';

    const inP = (t.ports.in || []), altP = inP.find(p => p.fuelAlt), baseP = inP.find(p => p.id === t.fuelPort);
    const base = baseP ? C.resources[baseP.res].name : C.resources.rod.name;
    const altName = altP ? C.resources[altP.res].name : C.resources.nfuel.name;
    box.innerHTML =
      '<div class="sc-head">' + GG.i18n.t('ui.fuelHead') + '</div>' +
      '<div class="sc-drain">' +
        '<button class="sc-chip" data-alt="0">' + base + '</button>' +
        '<button class="sc-chip" data-alt="1">' + altName + '</button>' +
      '</div>' +
      '<div class="sc-out"></div>';
    el.inspector.appendChild(box);
    const out = box.querySelector('.sc-out');
    function show() {
      const alt = Sim.fuelAlt(n);
      box.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('on', (b.dataset.alt === '1') === alt);
      });
      if (t.kwPerKg) {
        const per = Sim.energyOut(n, t.id, 'kwPerKg') + (alt && t.fuelAlt ? t.fuelAlt.kw - t.kwPerKg : 0);
        out.textContent = GG.i18n.t('ui.fuelOil').replace('%k', U.small(per));
        return;
      }
      const F = t.rocket ? Sim.rocketFuel(n) : Sim.reactorFuel(n);
      out.textContent = GG.i18n.t(t.rocket ? 'ui.fuelRocket' : 'ui.fuelReactor')
        .replace('%k', U.small(F.kg)).replace('%m', Math.round(F.sec / 60));
    }
    box.querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        const res = Sim.setFuel(n, b.dataset.alt === '1');
        if (!res.ok) { UI.toast(res.why); GG.audio.play('deny'); return; }
        GG.audio.play('click');
        UI.rebuildInspector();
      };
    });
    show();
  }

  function buildLaneControls(n, t, L, i) {
    const key = 'lim' + L, outId = S.laneOutPort(t, L);
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl';
    box.innerHTML =
      '<div class="sc-head">' + GG.i18n.t('ui.laneLimitHead').replace('%n', i + 1) + '</div>' +
      '<div class="sc-pair sc-one">' +
        '<label>' + GG.i18n.ins('kg/h') + '<input type="text" inputmode="text" class="sc-cap" title="' +
          GG.i18n.t('ui.calcHint') + '"></label>' +
      '</div>' +
      '<div class="sc-out"></div>' +
      '<button class="sc-even">' + GG.i18n.t('ui.flowLimitOff') + '</button>';
    el.inspector.appendChild(box);
    const f = box.querySelector('.sc-cap');
    const out = box.querySelector('.sc-out');
    function show() {
      const lim = Sim.laneLimit(n, L);
      if (f !== document.activeElement) f.value = (lim === Infinity) ? '' : calcText(lim);
      out.textContent = lim === Infinity
        ? GG.i18n.t('ui.flowLimitNone')
        : GG.i18n.t('ui.flowLimitAt').replace('%s', U.fmt(lim, 2)) +
          ' — ' + GG.i18n.ins(U.fmt((n.rates && n.rates['out:' + outId]) || 0, 2) + ' kg/h');
    }
    f.oninput = function () {
      const v = U.calc(f.value);
      n[key] = (v === null || v < 0) ? null : v;
      show();
    };
    onCalcEnter(f, function (v) { n[key] = v; }, show);
    f.onblur = show;
    box.querySelector('.sc-even').onclick = function () {
      n[key] = null; show(); GG.audio.play('click');
    };
    show();
    UI.liveInspector(show);
  }

  function buildHireControls(n, t) {
    let want = 1;
    let secs = Sim.hireSec(n);
    const timed = !!t.hire.maxSec && t.hire.maxSec > t.hire.sec;

    const mx = timed && (C.ui || {}).hireMaxBtns !== false;
    const maxBtn = k => mx ? '<button class="hc-step hc-max" data-max="' + k + '">' + GG.i18n.t('ui.max') + '</button>' : '';
    const box = document.createElement('div');
    box.className = 'split-ctl hire-ctl insp-ctl';
    box.innerHTML =
      '<div class="sc-head">' + GG.i18n.t('ui.hireHead') + '</div>' +
      '<div class="hc-row">' +
        '<button class="hc-step" data-d="-1">&minus;</button>' +
        '<span class="hc-n"></span>' +
        '<button class="hc-step" data-d="1">+</button>' + maxBtn('n') +
      '</div>' +
      (timed
        ? '<div class="hc-row">' +
            '<button class="hc-step hc-t" data-t="-1">&minus;</button>' +
            '<span class="hc-n hc-time"></span>' +
            '<button class="hc-step hc-t" data-t="1">+</button>' + maxBtn('t') +
          '</div>'
        : '') +
      '<button class="pn-buy hc-go"></button>' +
      '<div class="sc-out hc-note"></div>';
    el.inspector.appendChild(box);

    function show() {
      const room = Sim.hireRoom(n);
      want = U.clamp(want, 1, Math.max(1, room));
      if (timed) {
        const step = t.hire.stepSec || 600;
        secs = U.clamp(secs, step, Sim.hireMaxSec(n));
        box.querySelector('.hc-time').textContent =
          GG.i18n.t('ui.hireShift').replace('%s', clock(secs));
      } else secs = Sim.hireSec(n);
      const price = Sim.hirePrice(n, want, secs);
      box.querySelector('.hc-n').textContent =
        GG.i18n.t(want === 1 ? 'ui.hireHand' : 'ui.hireHands').replace('%n', want);
      const go = box.querySelector('.hc-go');
      go.textContent = room > 0
        ? GG.i18n.t('ui.hireGo').replace('%n', want).replace('%c', U.cur(t.hire.currency, price))
        : GG.i18n.t('ui.hireFull').replace('%n', Sim.hireMax(n));
      go.disabled = room <= 0 || !U.canAfford(S.bank(t.hire.currency), price);
      const left = Sim.crewLeft(n);
      const disc = Sim.hireDiscount(n, want, secs);
      box.querySelector('.hc-note').textContent =
        (disc > 0 ? GG.i18n.t('ui.hireOff').replace('%n', Math.round(disc * 100)) + ' · ' : '') +
        (left > 0 ? GG.i18n.t('ui.hireEnds').replace('%s', clock(left))
                  : GG.i18n.t('ui.hireWorks').replace('%s', clock(secs)));
    }

    UI.liveInspector(show);
    box.querySelectorAll('.hc-step').forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.max === 't') secs = Sim.hireMaxSec(n);
        else if (b.dataset.max === 'n') want = Math.max(1, Sim.hireRoom(n));
        else if (b.dataset.t) secs += parseInt(b.dataset.t, 10) * (t.hire.stepSec || 600);
        else want += parseInt(b.dataset.d, 10);
        GG.audio.play('click'); show();
      };
    });
    box.querySelector('.hc-go').onclick = function () {
      const res = Sim.hire(n, want, secs);
      if (res.ok) { GG.audio.play('hire'); if (!UI.quiet('hired')) UI.toast('Hired ' + res.count + ' for ' + clock(res.sec)); }
      else { GG.audio.play('deny'); UI.toast(res.why, true); }
      show();
    };
    show();
    splitRefresh = show;
  }
  let splitRefresh = null;

  function buildAgencyControls(n, t) {
    const H = C.nodeTypes.labourExchange.hire;
    const box = document.createElement('div');
    box.className = 'split-ctl hire-ctl insp-ctl';
    box.innerHTML =
      '<div class="sc-head">' + GG.i18n.t('ui.agOrderHead') + '</div>' +
      '<div class="sc-drain ag-order"></div>' +
      '<div class="sc-head sc-head2">' + GG.i18n.t('ui.agContract') + '</div>' +
      (t.autoHire.hybrid ? '<div class="sc-drain ag-mode"></div>' : '') +
      '<div class="hc-row ag-hands">' +
        '<button class="hc-step" data-d="-1">&minus;</button>' +
        '<span class="hc-n"></span>' +
        '<button class="hc-step" data-d="1">+</button>' +
      '</div>' +
      '<div class="hc-row">' +
        '<button class="hc-step hc-t" data-t="-1">&minus;</button>' +
        '<span class="hc-n hc-time"></span>' +
        '<button class="hc-step hc-t" data-t="1">+</button>' +
      '</div>' +
      '<div class="sc-out hc-note"></div>' +
      ((C.ui || {}).agencySoundSwitch !== false
        ? '<div class="sc-head sc-head2">' + GG.i18n.t('ui.agSound') + '</div><div class="sc-drain ag-sound"></div>' : '');
    el.inspector.appendChild(box);
    const swrap = box.querySelector('.ag-sound');
    if (swrap) [[false, 'ui.agSoundOn'], [true, 'ui.agSoundOff']].forEach(function (p) {
      const b = document.createElement('button');
      b.className = 'sc-chip'; b.textContent = GG.i18n.t(p[1]); b._v = p[0];
      b.onclick = function () { n.agQuiet = p[0]; GG.audio.play('click'); show(); };
      swrap.appendChild(b);
    });
    const wrap = box.querySelector('.ag-order');
    [['post', 'ui.agPosts'], ['exchange', 'ui.agExchanges']].forEach(function (p) {
      const b = document.createElement('button');
      b.className = 'sc-chip';
      b.textContent = GG.i18n.t(p[1]);
      b._v = p[0];
      b.onclick = function () { n.agOrder = p[0]; GG.audio.play('click'); show(); };
      wrap.appendChild(b);
    });

    const mwrap = box.querySelector('.ag-mode');
    if (mwrap) [['once', 'ui.agOnce'], ['each', 'ui.agEach']].forEach(function (p) {
      const b = document.createElement('button');
      b.className = 'sc-chip'; b.textContent = GG.i18n.t(p[1]); b._v = p[0];
      b.onclick = function () { n.agMode = p[0]; GG.audio.play('click'); show(); };
      mwrap.appendChild(b);
    });

    function agFoundLine(tg) {
      const T = GG.i18n.t, p = tg.posts.length, e = tg.exchanges.length;
      if ((C.ui || {}).agencyPlural === false)
        return T('ui.agFound').replace('%p', p).replace('%e', e);
      return T('ui.agFound2')
        .replace('%p', T(p === 1 ? 'ui.agPost1' : 'ui.agPostN').replace('%n', p))
        .replace('%e', T(e === 1 ? 'ui.agEx1' : 'ui.agExN').replace('%n', e));
    }
    function show() {
      n.agHands = U.clamp(n.agHands || 1, 1, H.max);
      n.agSec = U.clamp(n.agSec || H.sec, H.stepSec || 600, H.maxSec);
      const order = n.agOrder === 'exchange' ? 'exchange' : 'post';
      for (const b of wrap.children) b.classList.toggle('on', b._v === order);
      if (swrap) for (const b of swrap.children) b.classList.toggle('on', b._v === !!n.agQuiet);
      if (mwrap) {
        const mode = Sim.agencyMode(n);
        for (const b of mwrap.children) b.classList.toggle('on', b._v === mode);
        box.querySelector('.ag-hands').style.display = mode === 'each' ? 'none' : '';
      }
      box.querySelector('.hc-n').textContent =
        GG.i18n.t(n.agHands === 1 ? 'ui.hireHand' : 'ui.hireHands').replace('%n', n.agHands);
      box.querySelector('.hc-time').textContent = GG.i18n.t('ui.hireShift').replace('%s', clock(n.agSec));
      const tg = Sim.agencyTargets(n);
      box.querySelector('.hc-note').textContent = !n.dock ? GG.i18n.t('ui.agNoDock')
        : agFoundLine(tg) +
          ' · ' + GG.i18n.t('ui.agSaved').replace('%b', U.cur('money', n.budget || 0));
    }
    UI.liveInspector(show);
    box.querySelectorAll('.hc-step').forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.t) n.agSec += parseInt(b.dataset.t, 10) * (H.stepSec || 600);
        else n.agHands += parseInt(b.dataset.d, 10);
        GG.audio.play('click'); show();
      };
    });
    show();
  }

  function buildAgencyManual(n, t) {
    const H = C.nodeTypes.labourExchange.hire, P = C.nodeTypes.hiringPost.hire, T = GG.i18n.t;
    const step = (cls, d) => '<button class="hc-step ' + cls + '" data-d="' + d + '">' + (d < 0 ? '&minus;' : '+') + '</button>';
    const row = cls => '<div class="hc-row">' + step(cls, -1) + '<span class="hc-n ' + cls + '-v"></span>' + step(cls, 1) + '</div>';
    const box = document.createElement('div');
    box.className = 'split-ctl hire-ctl insp-ctl ag-man';
    box.innerHTML =
      '<div class="sc-head">' + T('ui.agPostsHead') + '</div>' +
      row('ag-p') +
      '<button class="pn-buy hc-go ag-posts"></button>' +
      '<div class="sc-head sc-head2">' + T('ui.agExHead') + '</div>' +
      row('ag-k') + row('ag-h') + row('ag-s') +
      '<button class="pn-buy hc-go ag-ex"></button>' +
      '<div class="sc-out hc-note"></div>';
    el.inspector.appendChild(box);
    function agFound(tg) {
      const p = tg.posts.length, e = tg.exchanges.length;
      return T('ui.agFound2')
        .replace('%p', T(p === 1 ? 'ui.agPost1' : 'ui.agPostN').replace('%n', p))
        .replace('%e', T(e === 1 ? 'ui.agEx1' : 'ui.agExN').replace('%n', e));
    }
    function show() {
      const tg = Sim.agencyTargets(n);
      const postRoom = Math.max(1, tg.posts.reduce((a, p) => a + Math.max(0, Sim.hireRoom(p)), 0));
      n.agPostHands = U.clamp(n.agPostHands || postRoom, 1, postRoom);
      n.agK = U.clamp(n.agK || 1, 1, Math.max(1, tg.exchanges.length));
      n.agHandsM = U.clamp(n.agHandsM || H.max, 1, H.max);
      const maxS = tg.exchanges.length ? Sim.hireMaxSec(tg.exchanges[0]) : H.maxSec;
      n.agSecM = U.clamp(n.agSecM || H.sec, H.stepSec || 600, maxS);
      box.querySelector('.ag-p-v').textContent = T(n.agPostHands === 1 ? 'ui.hireHand' : 'ui.hireHands').replace('%n', n.agPostHands);
      box.querySelector('.ag-k-v').textContent = T(n.agK === 1 ? 'ui.agEx1' : 'ui.agExN').replace('%n', n.agK);
      box.querySelector('.ag-h-v').textContent = T(n.agHandsM === 1 ? 'ui.hireHand' : 'ui.hireHands').replace('%n', n.agHandsM);
      box.querySelector('.ag-s-v').textContent = T('ui.hireShift').replace('%s', clock(n.agSecM));
      const money = S.bank('money');
      const pp = Sim.agencyPlan(n, 'posts', 0, n.agPostHands), bp = box.querySelector('.ag-posts');
      bp.textContent = pp.count ? T('ui.hireGo').replace('%n', pp.count).replace('%c', U.cur('money', pp.price))
                                : T(tg.posts.length ? 'ui.agPostsFull' : 'ui.agNoPosts');
      bp.disabled = !pp.count || !U.canAfford(money, Math.min.apply(null, pp.list.map(x => Sim.hirePrice(x.p, 1, x.sec))));
      const ep = Sim.agencyPlan(n, 'ex', n.agK, n.agHandsM, n.agSecM), be = box.querySelector('.ag-ex');
      be.textContent = ep.count ? T('ui.hireGo').replace('%n', ep.count).replace('%c', U.cur('money', ep.price))
                                : T(tg.exchanges.length ? 'ui.agExFull' : 'ui.agNoEx');
      be.disabled = !ep.count || !U.canAfford(money, Math.min.apply(null, ep.list.map(x => Sim.hirePrice(x.p, 1, x.sec))));
      box.querySelector('.hc-note').textContent = agFound(tg) + ' · ' + T('ui.agManualNote');
    }
    UI.liveInspector(show);
    box.querySelectorAll('.hc-step').forEach(function (b) {
      b.onclick = function () {
        const d = parseInt(b.dataset.d, 10), st = H.stepSec || 600;
        if (b.classList.contains('ag-p')) n.agPostHands += d;
        else if (b.classList.contains('ag-k')) n.agK += d;
        else if (b.classList.contains('ag-h')) n.agHandsM += d;
        else n.agSecM += d * st;
        GG.audio.play('click'); show();
      };
    });
    const press = function (kind) {
      const res = kind === 'posts' ? Sim.agencyHire(n, 'posts', 0, n.agPostHands)
                                   : Sim.agencyHire(n, 'ex', n.agK, n.agHandsM, n.agSecM);
      if (res.ok) { GG.audio.play('hire'); if (!UI.quiet('hired')) UI.toast('Hired ' + res.count + ' for ' + U.cur('money', res.price)); }
      else { GG.audio.play('deny'); UI.toast(res.why, true); }
      show();
    };
    box.querySelector('.ag-posts').onclick = function () { press('posts'); };
    box.querySelector('.ag-ex').onclick = function () { press('ex'); };
    show();
    void P;
  }

  function buildBankControls(n, t) {
    if (!C.nodeTypes.hiringAgency || !S.isUnlocked('hiringAgency')) return;
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl';
    box.innerHTML = '<div class="sc-head">' + GG.i18n.t('ui.bankSpot') + '</div>' +
                    '<div class="sc-drain bank-spot"></div>';
    el.inspector.appendChild(box);
    const wrap = box.querySelector('.bank-spot');
    function show() {
      for (const b of wrap.children) b.classList.toggle('on', b._v === (n.agencySpot !== false));
    }
    [[true, 'ui.bankSpotYes'], [false, 'ui.bankSpotNo']].forEach(function (p) {
      const b = document.createElement('button');
      b.className = 'sc-chip';
      b.textContent = GG.i18n.t(p[1]);
      b._v = p[0];
      b.onclick = function () {
        if (!p[0] && S.bankAgency(n)) { GG.audio.play('deny'); UI.toast('An Agency stands on it', true); return; }
        n.agencySpot = p[0]; GG.audio.play('click'); show();
      };
      wrap.appendChild(b);
    });
    show();
  }

  function syncHome() {
    const b = document.getElementById('btn-home');
    if (!b) return;
    const on = (C.camera || {}).recentre !== false &&
               GG.menu.started() && !GG.menu.isOpen() &&
               GG.input.cameraLost && GG.input.cameraLost();
    if (on === !b.classList.contains('hidden')) return;
    b.classList.toggle('hidden', !on);
    if (on) b.textContent = GG.i18n.t('cam.back');
  }

  function curClipped() {
    const bs = document.querySelectorAll('#topbar .cur-block');
    for (let i = 0; i < bs.length; i++) if (bs[i].scrollWidth > bs[i].clientWidth + 4) return true;
    return false;
  }

  function fitTopbar() {
    const bar = document.getElementById('topbar');
    if (!bar) return;
    const over = function () { return rowsIn(bar) > 1 || curClipped(); };
    bar.classList.remove('tb-tight', 'tb-tight2');
    if (!over()) return;
    bar.classList.add('tb-tight');
    if (!over()) return;

    const was = { rows: rowsIn(bar), clip: curClipped() };
    bar.classList.add('tb-tight2');
    if (!over()) return;
    if (rowsIn(bar) < was.rows) return;
    if (was.clip && !curClipped()) return;
    bar.classList.remove('tb-tight2');

  }
  UI.fitTopbar = fitTopbar;

  const HEAD_ROWS = 2;

  function rowsIn(el) {
    if (!el) return 0;
    const boxes = Array.prototype.filter.call(el.children, function (c) {
      return c.offsetParent !== null;
    }).map(function (c) { return c.getBoundingClientRect(); })
      .sort(function (a, b) { return a.top - b.top; });
    let rows = 0, bottom = -Infinity;
    for (const b of boxes) {
      if (b.top >= bottom - 1) { rows++; bottom = b.bottom; }
      else bottom = Math.max(bottom, b.bottom);
    }
    return rows;
  }
  function headRows() { return rowsIn(document.querySelector('.tree-head')); }
  function fitTreeHead() {
    const h = document.querySelector('.tree-head');

    const t = document.getElementById('skilltree');
    if (!h || !t || t.classList.contains('hidden')) return;
    h.classList.remove('th-tight', 'th-tight2');
    if (headRows() <= HEAD_ROWS) return;
    h.classList.add('th-tight');
    if (headRows() <= HEAD_ROWS) return;
    h.classList.add('th-tight2');
  }
  UI.fitTreeHead = fitTreeHead;

  function wheelX(e) {
    if (((C.ui || {}).wheelScrollX) === false) return;
    if (e.ctrlKey) return;
    const step = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (!step) return;
    for (let el2 = e.target; el2 && el2 !== document.body; el2 = el2.parentElement) {
      const sw = el2.scrollWidth - el2.clientWidth;
      const sh = el2.scrollHeight - el2.clientHeight;
      if (sw <= 2 || sh > 2) continue;

      const ox = getComputedStyle(el2).overflowX;
      if (ox !== 'auto' && ox !== 'scroll') continue;
      const was = el2.scrollLeft;
      el2.scrollLeft = Math.max(0, Math.min(sw, was + step));
      if (el2.scrollLeft !== was) e.preventDefault();
      return;
    }
  }
  UI.wheelX = wheelX;

  function fitPalette() {
    const node = el.palette;
    if (!node) return;
    const max = (C.ui || {}).dockMaxCards;
    const items = node.querySelectorAll('.build-card').length
      ? node.querySelectorAll('.build-card')
      : node.querySelectorAll('.dock-sec');
    if (!max || items.length <= max) { node.style.removeProperty('max-width'); return; }
    const row = items[0].parentElement;
    const gap = parseFloat(getComputedStyle(row).columnGap || getComputedStyle(row).gap) || 0;
    const drop = (items.length - max) * (items[0].offsetWidth + gap);
    const cap = Math.max(0, node.scrollWidth - drop);
    node.style.maxWidth = 'min(calc((100vw - 40px) / var(--gz, 1)), ' + cap + 'px)';
  }
  UI.fitPalette = fitPalette;

  function fitScrollers() {
    fitPalette();
    const slop = (C.ui || {}).scrollSlop;
    const tol = slop === undefined ? 3 : slop;
    [el.palette, document.getElementById('places')].forEach(function (node) {
      if (!node) return;
      node.style.overflowX = 'auto';
      const over = node.scrollWidth - node.clientWidth;
      node.style.overflowX = over > tol ? 'auto' : 'hidden';
    });
  }
  UI.fitScrollers = fitScrollers;

  function applyDockAnim() {
    const a = (C.ui || {}).dockAnim || {};
    const r = document.documentElement.style;
    const keys = ['--dock-open-ms', '--dock-close-ms', '--dock-open-ease',
                  '--dock-close-ease', '--dock-lift'];

    document.body.classList.toggle('dock-anim', a.enabled !== false);
    if (a.enabled === false) { keys.forEach(k => r.removeProperty(k)); return; }
    if (a.openMs    !== undefined) r.setProperty('--dock-open-ms',  a.openMs + 'ms');
    if (a.closeMs   !== undefined) r.setProperty('--dock-close-ms', a.closeMs + 'ms');
    if (a.openEase)                r.setProperty('--dock-open-ease',  a.openEase);
    if (a.closeEase)               r.setProperty('--dock-close-ease', a.closeEase);
    if (a.lift      !== undefined) r.setProperty('--dock-lift', a.lift + 'px');
  }
  UI.applyDockAnim = applyDockAnim;

  function applyToastSkin() {
    document.body.classList.toggle('toast-skin', (C.ui || {}).toastSkin !== false);
  }
  UI.applyToastSkin = applyToastSkin;

  function fitDock() {
    const a = (C.ui || {}).dockAnim || {};
    const dock = el.dock, body = document.getElementById('dock-body');
    if (!dock || !body) return;
    if (a.enabled === false || a.measure === false) {
      dock.style.removeProperty('--dock-h');
      return;
    }
    const wasOpen = dock.classList.contains('open');
    const prevTr = body.style.transition, prevMax = body.style.maxHeight;
    body.style.transition = 'none';
    if (!wasOpen) dock.classList.add('open');
    body.style.maxHeight = 'none';
    const h = Math.ceil(body.scrollHeight);
    body.style.maxHeight = prevMax;
    if (!wasOpen) dock.classList.remove('open');
    void body.offsetHeight;
    body.style.transition = prevTr;
    const cap = a.maxPx === undefined ? 220 : a.maxPx;
    dock.style.setProperty('--dock-h', Math.min(h, cap) + 'px');
  }
  UI.fitDock = fitDock;

  const NARROW_MAP = 520;
  function fitHud() {
    const stage = document.getElementById('stage');
    const narrow = !!(stage && stage.clientWidth > 0 && stage.clientWidth < NARROW_MAP);
    document.body.classList.toggle('hud-narrow', narrow);

    const rail = document.getElementById('left-rail');
    if (rail) {
      const lr = (C.ui || {}).leftRail || {};
      const base = lr.planWidth === undefined ? 320 : lr.planWidth;
      rail.style.setProperty('--plan-w', (narrow ? Math.min(base, 210) : base) + 'px');
    }
    fitLaunchers();
    fitCard();
    fitScrollers();
  }
  UI.fitHud = fitHud;

  const CARD_TOP = 16, CARD_RIGHT = 16, CARD_FLOOR = 134, CARD_GAP = 8, CARD_MIN = 110;
  function fitCard() {
    const card = document.getElementById('inspector'), stage = document.getElementById('stage');
    if (!card || !stage) return;
    card.style.removeProperty('--card-top');
    card.style.removeProperty('--card-floor');
    const sb = stage.getBoundingClientRect();
    if (!sb.width) return;

    const w = parseFloat(getComputedStyle(card).getPropertyValue('--card-w')) || 246;
    const right = sb.right - CARD_RIGHT, left = right - w;
    const shares = function (e) {
      if (!e || !e.offsetParent) return null;
      const b = e.getBoundingClientRect();
      return (b.right > left && b.left < right) ? b : null;
    };

    let top = CARD_TOP, floor = CARD_FLOOR;
    const pb = shares(document.getElementById('places'));
    if (pb) top = Math.max(top, Math.round(pb.bottom - sb.top) + CARD_GAP);

    const mb = shares(document.getElementById('minimap'));
    if (mb) top = Math.max(top, Math.round(mb.bottom - sb.top) + CARD_GAP);
    for (const id of ['tree-launch', 'boost-launch', 'bp-launch']) {
      const b = shares(document.getElementById(id));
      if (b) floor = Math.max(floor, Math.round(sb.bottom - b.top) + CARD_GAP);
    }
    if (sb.height - top - floor < CARD_MIN) floor = CARD_FLOOR;
    if (top   > CARD_TOP)   card.style.setProperty('--card-top', top + 'px');
    if (floor > CARD_FLOOR) card.style.setProperty('--card-floor', floor + 'px');
  }
  UI.fitCard = fitCard;

  function fitLaunchers() {
    const dock = document.getElementById('dock');
    if (!dock || dock.offsetParent === null) return;
    const t = document.getElementById('tree-launch');
    const b = document.getElementById('boost-launch');

    if (t) t.style.bottom = '';
    if (b) b.style.bottom = (((C.ui || {}).boostLauncher || {}).bottom || 0) + 'px';

    const d = dock.getBoundingClientRect();
    let hit = false;
    [t, b].forEach(function (e) {
      if (!e || e.offsetParent === null) return;
      const r = e.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      if (Math.min(r.right, d.right) - Math.max(r.left, d.left) > 1 &&
          Math.min(r.bottom, d.bottom) - Math.max(r.top, d.top) > 1) hit = true;
    });
    if (!hit) return;

    const lift = Math.round(d.height) + 8 + 'px';
    if (t) t.style.bottom = lift;
    if (b) b.style.bottom = lift;
  }
  UI.fitLaunchers = fitLaunchers;

  function fitLaunchMatch() {
    const lm = (C.ui || {}).launchMatch || {};
    const body = document.body, on = !!lm.enabled;
    body.classList.toggle('launch-match', on);
    if (!on) return;
    body.style.setProperty('--lm-h', (lm.h || 46) + 'px');
    body.style.setProperty('--lm-gap', (lm.gap === undefined ? 10 : lm.gap) + 'px');
    body.classList.remove('launch-match');
    let w = lm.w || 178;
    document.querySelectorAll('#tree-launch .tl-btn, #boost-launch .tl-btn').forEach(function (b) {
      if (b.offsetParent) w = Math.max(w, Math.ceil(b.getBoundingClientRect().width / ((GG.render.uiZoom && GG.render.uiZoom()) || 1)));
    });
    body.classList.add('launch-match');
    body.style.setProperty('--lm-w', w + 'px');
  }
  UI.fitLaunchMatch = fitLaunchMatch;

  const MM_KEY = 'earthregen.minimap';
  const mm = { el: null, cv: null, base: null, drawnAt: 0, sig: '', lang: '', folded: false, drag: false, frame: null, placed: '' };
  function mmCfg() { return (C.ui && C.ui.minimap) || {}; }
  function mmInit() {
    mm.el = document.getElementById('minimap');
    mm.cv = document.getElementById('mm-canvas');
    if (!mm.el || !mm.cv) return;

    const bl = document.getElementById('boost-launch');
    if (mmCfg().corner !== 'topRight' && bl) { bl.insertBefore(mm.el, bl.firstChild); mm.el.classList.add('mm-bl'); }
    try { mm.folded = localStorage.getItem(MM_KEY) === 'folded'; } catch (e) { mm.folded = false; }
    mm.el.querySelector('.mm-toggle').addEventListener('click', function () {
      mm.folded = !mm.folded;
      try { localStorage.setItem(MM_KEY, mm.folded ? 'folded' : 'open'); } catch (e) {  }
      mm.sig = ''; mm.lang = ''; mm.placed = '';
      UI.syncMinimap(true);
    });
    const aim = function (e) {
      const f = mm.frame;
      if (!f) return;
      const r = mm.cv.getBoundingClientRect();
      if (!r.width) return;

      const sx = (e.clientX - r.left) / r.width * f.w, sy = (e.clientY - r.top) / r.height * f.h;
      const cam = S.g.camera;
      cam.x = f.x0 + (sx - f.ox) / f.k;
      cam.y = f.y0 + (sy - f.oy) / f.k;
      if (GG.input && GG.input.clampCamera) GG.input.clampCamera();
      UI.syncMinimap(true);
    };
    mm.cv.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      mm.drag = true;
      try { mm.cv.setPointerCapture(e.pointerId); } catch (x) {  }
      aim(e);
    });
    mm.cv.addEventListener('pointermove', function (e) { if (mm.drag) aim(e); });
    const end = function () { mm.drag = false; };
    mm.cv.addEventListener('pointerup', end);
    mm.cv.addEventListener('pointercancel', end);
  }

  function mmPlace(show, sb, z) {
    let top = 16;
    const pb = document.getElementById('places');
    if (show && sb && pb && pb.offsetParent && !mm.el.classList.contains('mm-bl')) {
      const b = pb.getBoundingClientRect(), w = ((mmCfg().w || 200) + 34) * z;
      const right = sb.right - 16 * z;
      if (b.width && b.right > right - w && b.left < right) top = Math.max(top, Math.round((b.bottom - sb.top) / z) + 8);
    }
    const want = top > 16 ? top + 'px' : '';
    if (mm.el.style.getPropertyValue('--mm-top') !== want) {
      if (want) mm.el.style.setProperty('--mm-top', want); else mm.el.style.removeProperty('--mm-top');
    }
    const key = show + '|' + top + '|' + mm.folded;
    if (key !== mm.placed) { mm.placed = key; fitCard(); }
  }

  UI.overMinimap = function (target) {
    return !!(mm.el && target && target.closest && target.closest('#minimap'));
  };

  UI.syncMinimap = function (force) {
    const o = mmCfg();
    if (!mm.el) mmInit();
    if (!mm.el) return;
    const stage = document.getElementById('stage');
    const sb = stage ? stage.getBoundingClientRect() : null;
    const z = (GG.render && GG.render.uiZoom) ? GG.render.uiZoom() : 1;
    const ms = o.minStage || {};
    const room = !!sb && sb.width / z >= (ms.w || 0) && sb.height / z >= (ms.h || 0);

    const show = !!o.enabled && room && !!S.g && (o.afterTutorial === false || !!S.g.tutorDone);
    mm.el.classList.toggle('hidden', !show);
    mm.el.classList.toggle('mm-folded', mm.folded);

    const cw = (o.w || 200) + 'px', ch = (o.h || 130) + 'px';
    if (mm.cv.style.width !== cw || mm.cv.style.height !== ch) {
      mm.cv.style.width = cw; mm.cv.style.height = ch; mm.placed = '';
    }
    mmPlace(show, sb, z);
    if (!show) return;

    const lang = GG.i18n.lang() + (mm.folded ? 'f' : 'o');
    if (mm.lang !== lang) {
      mm.lang = lang;
      mm.el.querySelector('.mm-title').textContent = GG.i18n.t('ui.minimap');
      const tg = mm.el.querySelector('.mm-toggle');
      tg.textContent = mm.folded ? '+' : '–';
      tg.title = GG.i18n.t(mm.folded ? 'ui.minimapShow' : 'ui.minimapHide');
      mm.cv.title = GG.i18n.t('ui.minimapTip');
    }
    if (mm.folded) return;

    const R = GG.render, cam = S.g.camera;
    const now = performance.now();
    const sig = [S.g.loc, cam.x.toFixed(1), cam.y.toFixed(1), cam.scale.toFixed(4)].join('|');
    const stale = force || now - mm.drawnAt >= (o.redrawMs || 250) || !mm.base;
    if (!stale && sig === mm.sig) return;
    mm.sig = sig;

    const W = o.w || 200, H = o.h || 130;
    const dpr = window.devicePixelRatio || 1;
    const PW = Math.round(W * dpr), PH = Math.round(H * dpr);
    if (mm.cv.width !== PW || mm.cv.height !== PH) {
      mm.cv.width = PW; mm.cv.height = PH;
      mm.cv.style.width = W + 'px'; mm.cv.style.height = H + 'px';
    }
    if (stale) { mm.drawnAt = now; mmBase(o, W, H, dpr); }
    const g = mm.cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, PW, PH);
    if (!mm.frame) return;
    g.drawImage(mm.base, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const f = mm.frame, k = f.k, col = o.colors || {};
    const px = function (wx) { return f.ox + (wx - f.x0) * k; };
    const py = function (wy) { return f.oy + (wy - f.y0) * k; };

    const v = R.viewWorld && R.viewWorld();
    if (v) {
      const x = px(v.x0), y = py(v.y0), w = (v.x1 - v.x0) * k, h = (v.y1 - v.y0) * k;
      g.fillStyle = col.viewFill || 'rgba(255,255,255,0.07)';
      g.fillRect(x, y, w, h);
      g.strokeStyle = col.view || 'rgba(255,255,255,0.85)';
      g.lineWidth = 1.5;
      g.strokeRect(x, y, w, h);
    }
  };

  function mmBase(o, W, H, dpr) {
    const R = GG.render;
    if (!mm.base) mm.base = document.createElement('canvas');
    mm.base.width = Math.round(W * dpr); mm.base.height = Math.round(H * dpr);
    const g = mm.base.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);

    const box = R.contentBox();
    if (!box) { mm.frame = null; return; }
    const m = o.margin === undefined ? 0.06 : o.margin;
    const bw = Math.max(1, box.w * (1 + 2 * m)), bh = Math.max(1, box.h * (1 + 2 * m));
    const k = Math.min(W / bw, H / bh);

    const f = { k: k, w: W, h: H, x0: box.cx, y0: box.cy, ox: W / 2, oy: H / 2 };
    mm.frame = f;
    const px = function (wx) { return f.ox + (wx - f.x0) * k; };
    const py = function (wy) { return f.oy + (wy - f.y0) * k; };

    const here = S.g.nodes.filter(function (n) { return n.loc === S.g.loc; });
    const byId = {};
    here.forEach(function (n) { byId[n.id] = n; });
    const col = o.colors || {};

    if (UI.labMm && UI.labMm(g, { here: here, byId: byId, f: f, px: px, py: py, o: o })) return;

    here.forEach(function (n) {
      const t = S.type(n);
      if (!t || !t.site) return;
      const b = S.siteBox(n);
      const edge = (t.skin && t.skin.edge) || '130,150,170';
      g.fillStyle = 'rgba(' + edge + ',0.16)';
      g.strokeStyle = 'rgba(' + edge + ',0.55)';
      g.lineWidth = 1;
      g.fillRect(px(n.x - b.w / 2), py(n.y - b.h / 2), b.w * k, b.h * k);
      g.strokeRect(px(n.x - b.w / 2) + 0.5, py(n.y - b.h / 2) + 0.5, Math.max(1, b.w * k - 1), Math.max(1, b.h * k - 1));
    });

    const fresh = !!((C.ui || {}).freshLooks || {}).mmWires;
    if (o.wires !== false && fresh) {
      g.lineWidth = 1.2;
      (S.g.links || []).forEach(function (l) {
        const a = byId[l.from], b = byId[l.to];
        if (!a || !b) return;
        const p = S.portsOf(a, 'out').find(function (q) { return q.id === l.fromPort; });
        const rc = ((C.resources[p ? S.portRes(a, p, 'out') : ''] || {}).color) || '#8fa3b8';
        g.strokeStyle = rc; g.globalAlpha = 0.6;
        g.beginPath(); g.moveTo(px(a.x), py(a.y)); g.lineTo(px(b.x), py(b.y)); g.stroke();
      });
      g.globalAlpha = 1;
    } else if (o.wires !== false) {
      g.strokeStyle = col.wire || 'rgba(143,163,184,0.28)';
      g.lineWidth = 1;
      g.beginPath();
      (S.g.links || []).forEach(function (l) {
        const a = byId[l.from], b = byId[l.to];
        if (!a || !b) return;
        g.moveTo(px(a.x), py(a.y)); g.lineTo(px(b.x), py(b.y));
      });
      g.stroke();
    }
    const dot = o.minDot || 2;
    here.forEach(function (n) {
      const t = S.type(n);
      if (!t || t.site) return;
      const s = S.sizeOf(n);
      const w = Math.max(dot + (fresh ? 1 : 0), s.w * k), h = Math.max(dot + (fresh ? 1 : 0), s.h * k);
      g.fillStyle = UI.isSelected(n.id) ? (col.selected || '#fff') : (t.color || '#8296ab');
      if (fresh && g.roundRect) {
        g.beginPath(); g.roundRect(px(n.x) - w / 2, py(n.y) - h / 2, w, h, Math.min(2, w / 3)); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 0.8; g.stroke();
      } else g.fillRect(px(n.x) - w / 2, py(n.y) - h / 2, w, h);
    });
  }

  let wxSig = null;
  function syncWxBed() {
    const w = Sim.weather();
    const sig = (w ? w.id : '-') + '|' + S.g.loc;
    if (sig === wxSig) return;
    wxSig = sig;
    UI.syncWeatherSound();
  }

  function balFmt(v, down) {
    if ((C.ui || {}).balanceFixed === false || !(v > 0) || v >= 1000) return U.fmt(v, undefined, down);
    return U.fmt(v, v < 10 ? 2 : (v < 100 ? 1 : 0), down, true);
  }

  UI.tick = function () {
    syncHome();
    fitTopbar();
    if (dockTipCard && !dockTipCard.isConnected) dockTipHide();

    const down = C.ui.balanceDown !== false;

    el.ci.textContent = balFmt(S.g.ci - UI.flyPending('ci'), down);

    el.ciRate.textContent = balFmt(Sim.ciPerHour) + ' ' + GG.i18n.t('ui.ciPerH');
    el.money.textContent = balFmt(S.g.money - UI.flyPending('money'), down);
    el.moneyRate.textContent = balFmt(Sim.moneyPerHour) + ' $/h';

    el.gemValue.textContent = U.fmt(S.bank('diamond') - UI.flyPending('diamond'), undefined, down);
    if (el.prismValue) el.prismValue.textContent = U.fmt(S.bank('prism') - UI.flyPending('prism'), undefined, down);
    UI.syncReveal();
    UI.syncStuck();
    syncWxBed();

    GG.audio.bedTick(GG.render.reviveOn() ? GG.render.reviveK() : 0);

    GG.audio.nightTick(Sim.sunAnchor() !== null && !Sim.solarPhase({ loc: S.g.loc }).on);

    const ready = C.objectives.filter(o => Sim.goalReady(o)).length;
    el.goalBadge.textContent = String(ready);
    el.goalBadge.classList.toggle('hidden', ready === 0);

    const inReach = (C.skillAlert && C.skillAlert.enabled && C.skillAlert.badge)
      ? Sim.skillsInReach().length : 0;
    el.ciBadge.textContent = String(inReach);
    el.ciBadge.classList.toggle('hidden', inReach === 0);
    UI.syncPlanTicker();

    drainEvents();
    UI.buildPlaces();
    UI.syncLaunchers();
    UI.syncGem();
    UI.syncMinimap();
    UI.syncBoostBar();
    UI.syncPanel();

    if (selected.length) UI.renderInspector();
    if (treeOpen) UI.refreshTreeState();
    UI.syncPalette();
  };

  function clock(sec) {
    sec = Math.max(0, Math.ceil(sec));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  let gemEl = null;
  UI.syncGem = function () {
    const g = S.g.gem;
    if (!g) {
      if (gemEl) { gemEl.remove(); gemEl = null; }
      return;
    }
    if (!gemEl) {
      gemEl = document.createElement('div');
      gemEl.className = 'gem';

      if (C.gem.halo) gemEl.classList.add('halo');
      gemEl.title = 'A diamond! Click to pick it up.';
      gemEl.innerHTML = IC.svg('diamond', 30);

      const FX = C.gem.fx || {};
      if (FX.enabled) {
        if (FX.appear === 'drop') gemEl.classList.add('fx-drop');
        const ring = document.createElement('b');
        ring.className = FX.appear === 'drop' ? 'gshadow' : 'gring';
        ring.addEventListener('animationend', function () { ring.remove(); });
        setTimeout(function () { ring.remove(); }, 1500);
        gemEl.appendChild(ring);
      }

      const GS = (C.gem && C.gem.shine) || {};
      gemEl.classList.toggle('sweep', !!GS.sweep);
      if (GS.enabled !== false && (GS.stars || 0) > 0) {
        const n = GS.stars, size = GS.size || 7;
        const vr = GS.sizeVar === undefined ? 0.35 : GS.sizeVar;
        const inner = GS.inner === undefined ? 0.55 : GS.inner;
        const outer = GS.outer === undefined ? 1.15 : GS.outer;
        const sec = GS.sec || 2.6;
        for (let i = 0; i < n; i++) {
          const sp = document.createElement('i');
          sp.className = 'gsp';

          const place = function (rand) {
            const ang = rand ? Math.random() * 6.2832 : (i + 0.35) * (6.2832 / n);
            const rad = inner + (rand ? Math.random() : ((i * 0.37) % 1)) * (outer - inner);
            const own = size * (1 + ((rand ? Math.random() : ((i * 0.53) % 1)) * 2 - 1) * vr);
            sp.style.setProperty('--sp', own.toFixed(2) + 'px');
            sp.style.setProperty('--sx', (Math.cos(ang) * 15 * rad).toFixed(2) + 'px');
            sp.style.setProperty('--sy', (Math.sin(ang) * 15 * rad).toFixed(2) + 'px');
          };
          place(!!GS.random);
          if (GS.random) {
            sp.style.setProperty('--sd', (sec * (0.7 + Math.random() * 0.7)).toFixed(2) + 's');
            sp.style.setProperty('--sdl', (Math.random() * sec).toFixed(2) + 's');
            sp.addEventListener('animationiteration', function () { place(true); });
          } else {
            sp.style.setProperty('--sd', sec.toFixed(2) + 's');
            sp.style.setProperty('--sdl', (i * sec / n).toFixed(2) + 's');
          }
          sp.style.setProperty('--sa', String(GS.alpha === undefined ? 0.95 : GS.alpha));
          sp.style.setProperty('--sc', GS.color || '255,247,214');
          gemEl.appendChild(sp);
        }
      }
      gemEl.onmousedown = function (e) {
        e.stopPropagation();
        e.preventDefault();
        const res = Sim.takeGem();
        if (!res.ok) return;
        GG.audio.play('gemTake');
        UI.spark(e.clientX, e.clientY - el.stage.getBoundingClientRect().top,
                 '+' + res.amount + ' ◆', 'gem');
        if (!UI.quiet('gemCollected')) UI.toast('Diamond collected: ' + res.amount + ' ◆');

        const FX = C.gem.fx || {};

        if (FX.enabled && FX.take === 'home' && UI.syncReveal) UI.syncReveal();
        if (FX.enabled && gemEl && FX.take === 'home' && UI.gemHome(gemEl, res.amount)) {
          gemEl.remove(); gemEl = null;
        } else if (FX.enabled && gemEl) {
          const old = gemEl;
          gemEl = null;
          old.onmousedown = null;
          old.classList.add('taken');
          const ring = document.createElement('b');
          ring.className = 'gring';
          old.appendChild(ring);
          setTimeout(function () { old.remove(); }, FX.takeMs || 320);
        }
        UI.syncGem();
      };
      el.gemLayer.appendChild(gemEl);
    }
    const r = el.stage.getBoundingClientRect();
    const sw = el.stage.clientWidth || r.width, sh = el.stage.clientHeight || r.height;

    if (g.fx !== undefined && g.x === undefined && C.gem.worldAnchored && GG.render.toWorld) {
      const w = GG.render.toWorld(g.fx * sw, g.fy * sh);
      g.x = w.x; g.y = w.y; g.loc = S.g.loc;
      delete g.fx; delete g.fy;
    }

    let x, y;
    if (g.x !== undefined) {
      const p = GG.render.toScreen(g.x, g.y);
      x = p.x; y = p.y;
    } else {

      x = g.fx * sw; y = g.fy * sh;
    }

    const pad = C.gem.clearPx;

    const away = g.loc !== undefined && g.loc !== S.g.loc;
    const off = away || x < -pad || y < -pad || x > sw + pad || y > sh + pad;
    gemEl.style.display = off ? 'none' : '';
    gemEl.style.left = x + 'px';
    gemEl.style.top = y + 'px';

    if (C.gem.scaleWithZoom !== false) {
      const cam = (S.g.camera || {}).scale || C.world.startZoom;
      const s = Math.max(C.gem.minScale, Math.min(C.gem.maxScale, cam / C.world.startZoom));
      gemEl.style.setProperty('--gs', s.toFixed(3));
    } else {
      gemEl.style.removeProperty('--gs');
    }
  };

  UI.gemSpot = function () {
    const G = C.gem, st = el.stage;
    if (!st) return null;
    const sr = st.getBoundingClientRect();
    const z = GG.render.uiZoom ? GG.render.uiZoom() : 1;
    const sw = st.clientWidth || sr.width / z, sh = st.clientHeight || sr.height / z;
    if (!sw || !sh) return null;

    const blocks = [];
    for (const id of G.uiIds) {
      const e = document.getElementById(id);
      if (!e || !e.offsetParent) continue;
      const b = e.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      blocks.push({ l: (b.left - sr.left) / z, t: (b.top - sr.top) / z,
                    r: (b.right - sr.left) / z, b: (b.bottom - sr.top) / z });
    }

    const pad = G.clearPx;
    const x0 = sw * G.padX, x1 = sw * (1 - G.padX);
    const y0 = sh * G.padY, y1 = sh * (1 - G.padY);
    let last = null;
    for (let i = 0; i < G.tries; i++) {
      const x = x0 + Math.random() * (x1 - x0);
      const y = y0 + Math.random() * (y1 - y0);
      last = { x: x, y: y };
      let hit = false;
      for (const b of blocks) {
        if (x + pad > b.l && x - pad < b.r && y + pad > b.t && y - pad < b.b) { hit = true; break; }
      }
      if (!hit) return { x: x, y: y, free: true };
    }

    return last;
  };

  let pillKey = '';

  let wxInfoOpen = '';

  UI.wxMulText = function (m) {
    if (m <= 0) return GG.i18n.t('ui.wxStop');
    if (Math.abs(m - 1 / 3) < 1e-6) return '×1/3';
    return '×' + (Math.round(m * 100) / 100);
  };

  UI.wxHintsOn = function () {
    const u = (C.ui || {}).wxHints;
    if (!u || u.enabled === false) return true;
    const mode = (GG.menu && GG.menu.wxHints) || u.def || 'auto';
    if (mode === 'on') return true;
    if (mode === 'off') return false;
    return !(S.g && S.g.tutorSkipped);
  };

  function wxInfoPanel(e) {
    const W = C.weather, M = W.marks || {};
    const icons = { crew: C.nodeTypes.player.icon, plant: C.nodeTypes.treePlanter.icon, dig: C.nodeTypes.cleaner.icon,
                    sweep: C.nodeTypes.trashSite.icon, burnRate: C.nodeTypes.landfill.icon,
                    burnValue: C.nodeTypes.landfill.icon, battery: C.nodeTypes.powerStorage.icon };
    const d = document.createElement('div');
    d.className = 'bp-info';
    d.style.setProperty('--c', e.color);
    d.innerHTML = Sim.wxEffects(e).map(function (f) {
      const name = f.key === 'node' ? C.nodeTypes[f.node].name : GG.i18n.t('wx.fx.' + f.key);
      const col = f.mul > 1 ? (M.up || '#6fdc8c') : (M.down || '#ff7a6b');
      return '<div class="bpi-row"><span class="bpi-ic">' + IC.svg(f.icon || icons[f.key], 14) +
             '</span><span class="bpi-n">' + name + '</span><b style="--k:' + col + '">' +
             UI.wxMulText(f.mul) + '</b></div>';
    }).join('') +
      (e.trips && C.weather.gridTrip && C.weather.gridTrip.enabled
        ? '<div class="bpi-note">' + GG.i18n.t('wx.fx.trips') + '</div>' : '');
    return d;
  }

  function wxInfoPill(d, id) {
    if (!(C.weather.info && C.weather.info.enabled) || !UI.wxHintsOn()) return;
    d.classList.add('bp-press');
    if (wxInfoOpen === id) d.classList.add('open');
    d.title = GG.i18n.t('ui.wxInfo');
    d.onclick = function () {
      wxInfoOpen = wxInfoOpen === id ? '' : id;
      pillKey = '';
      GG.audio.play('click');
    };
  }
  UI.syncBoostBar = function () {
    const live = C.boosts.filter(b => Sim.boostActive(b.id));

    const F = C.boostFx;
    document.body.classList.toggle('boost-hand',
      !!(F && F.enabled && F.cursor && Sim.handBoost()));

    const wxs = Sim.wxRunning().filter(w => UI.wxTold(w.loc));

    const soon = Sim.wxKnown(S.g.loc) ? Sim.wxIncoming(S.g.loc) : null;

    const down = (C.weather.gridTrip && C.weather.gridTrip.enabled)
      ? Sim.wxLocs().filter(l => Sim.gridDownLeft(l) > 0 && Sim.gridMatters(l)) : [];

    const AF = C.weather.arrestorFx;
    const safe = w => !!(AF && AF.enabled && AF.pill && Sim.wxBlocked(w.loc));

    const moon = Sim.moonOn({ loc: S.g.loc }) && S.machinesHere().some(n => n.type === 'solarPanel');
    const aur = Sim.auroraOn && Sim.auroraOn();
    const con = GG.render.conState ? GG.render.conState() : null;
    const pet = Sim.petGrounds().length > 0;
    const key = live.map(b => b.id).join(',') + '|' +
                wxs.map(w => w.loc + ':' + w.event.id + (safe(w) ? '!safe' : '')).join(',') +
                '|' + (soon ? 'soon' + soon.event.id : '') +

                '|down' + down.map(l => l + (l === S.g.loc ? '!' : '')).join(',') +

                '|' + GG.i18n.lang() + '|' + wxInfoOpen + (UI.wxHintsOn() ? '|h' : '') + (moon ? '|moon' + S.g.loc : '') + (aur ? '|aur' + S.g.loc : '') + (con ? '|con' + con.id : '') + (pet ? '|pet' + S.g.loc : '');
    if (key !== pillKey) {
      pillKey = key;
      el.boostBar.innerHTML = '';
      down.forEach(function (loc) {
        const here = loc === S.g.loc;
        const d = document.createElement('div');
        d.className = 'bp bp-grid' + (here ? ' bp-grid-here' : '');
        d.dataset.grid = loc;
        d.style.setProperty('--c', '#f0e24a');
        d.innerHTML = '<span class="bp-ic">' + IC.svg('bolt', 15) + '</span>' +
          GG.i18n.t('ui.gridDown') + ' <i>' +
          ((S.locationById(loc) || {}).name || '') + '</i> <b></b>' +
          (here ? '<button class="bp-go">' + GG.i18n.t('ui.restart') + '</button>' : '');
        if (here) d.querySelector('.bp-go').onclick = function (ev) {
          ev.stopPropagation();
          const r = Sim.restartGrid(loc);
          if (r.ok) { GG.audio.play('build'); UI.toast(GG.i18n.t('ui.gridBack')); }
          else { GG.audio.play('deny'); UI.toast(r.why, true); }
        };
        el.boostBar.appendChild(d);
      });
      wxs.forEach(function (w) {
        const d = document.createElement('div');
        d.className = 'bp bp-wx';
        d.dataset.wx = w.event.id;
        d.dataset.loc = w.loc;
        const ok = safe(w);
        d.style.setProperty('--c', ok ? (C.weather.marks.up || '#6fdc8c') : w.event.color);
        d.title = ok ? GG.i18n.t('wx.gridSafeTip') : Sim.wxDesc(w.event);
        d.innerHTML = '<span class="bp-ic">' + IC.svg(ok ? 'shield' : w.event.icon, 15) + '</span>' +
                      (ok ? GG.i18n.t('wx.gridSafe').replace('%s', w.event.name) : w.event.name) +
                      ' <i>' + (S.locationById(w.loc) || {}).name + '</i> <b></b>';
        el.boostBar.appendChild(d);
        wxInfoPill(d, 'wx:' + w.loc);
        if (d.classList.contains('open')) el.boostBar.appendChild(wxInfoPanel(w.event));
      });
      if (con) {
        const d = document.createElement('div');
        d.className = 'bp bp-wx bp-con';
        d.style.setProperty('--c', '#fff1b8');
        const pz = con.prize && Sim.boostById(con.prize);
        d.innerHTML = '<span class="bp-ic" style="color:#fff1b8">' + IC.svg('msConstellation', 15) + '</span>' + GG.i18n.t('con.' + con.id) +
                      ' <i></i> <b></b>' + (pz ? ' <span class="bp-ic bp-prize" title="' + pz.name + '">' + IC.svg(pz.icon, 15, pz.color) + '</span>' : '');
        el.boostBar.appendChild(d);
      }
      if (pet) {
        const d = document.createElement('div');
        d.className = 'bp bp-wx bp-pet';
        d.style.setProperty('--c', '#62d4e3');
        d.innerHTML = '<span class="bp-ic" style="color:#62d4e3">' + IC.svg('msPetrichor', 15) + '</span>' + GG.i18n.t('ui.petrichor') +
                      ' <i>' + ((S.locationById(S.g.loc) || {}).name || '') + '</i> <b></b>';
        el.boostBar.appendChild(d);
      }
      if (aur) {
        const d = document.createElement('div');
        d.className = 'bp bp-wx bp-aurora';
        d.style.setProperty('--c', '#4cffb0');
        d.innerHTML = '<span class="bp-ic" style="color:#4cffb0">' + IC.svg('auroraPill', 15) + '</span>' + GG.i18n.t('ui.aurora') +
                      ' <i>' + ((S.locationById(S.g.loc) || {}).name || '') + '</i> <b></b>';
        el.boostBar.appendChild(d);
      }
      if (moon) {
        const d = document.createElement('div');
        d.className = 'bp bp-wx bp-moon';
        d.style.setProperty('--c', '#c8d6ff');
        d.innerHTML = '<span class="bp-ic" style="color:#c8d6ff">' + IC.svg('moonFull', 15) + '</span>' + GG.i18n.t('ui.fullMoon') +
                      ' <i>' + ((S.locationById(S.g.loc) || {}).name || '') + '</i> <b></b>';
        el.boostBar.appendChild(d);
      }
      if (soon) {
        const d = document.createElement('div');
        d.className = 'bp bp-soon';
        d.style.setProperty('--c', soon.event.color);
        d.title = Sim.wxDesc(soon.event);
        d.innerHTML = '<span class="bp-ic">' + IC.svg(soon.event.icon, 15) + '</span>' +
                      soon.event.name + ' <i>' + GG.i18n.t('ui.incoming') + '</i> <b></b>';
        el.boostBar.appendChild(d);
        wxInfoPill(d, 'soon');
        if (d.classList.contains('open')) el.boostBar.appendChild(wxInfoPanel(soon.event));
      }
      live.forEach(function (b) {
        const d = document.createElement('div');
        d.className = 'bp';
        d.dataset.id = b.id;
        d.style.setProperty('--c', b.color);
        d.innerHTML = '<span class="bp-ic">' + IC.svg(b.icon, 15) + '</span>' +
                      b.name + ' <b></b>';
        el.boostBar.appendChild(d);
      });
    }
    const soonPill = el.boostBar.querySelector('.bp-soon');
    if (soonPill && soon) {
      soonPill.querySelector('b').textContent = GG.i18n.t('ui.pillIn').replace('%s', Math.ceil(soon.left));
      soonPill.style.setProperty('--left',
        (soon.left / Math.max(1, Sim.predictLead()) * 100) + '%');
    }
    const conPill = el.boostBar.querySelector('.bp-con');
    if (conPill && con) {
      const left = Math.ceil(con.left);
      conPill.querySelector('i').textContent = con.got + ' / ' + con.n;
      conPill.querySelector('b').textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
      conPill.style.setProperty('--left', (con.left / (con.sec || C.constellation.sec) * 100) + '%');
    }
    const petPill = el.boostBar.querySelector('.bp-pet');
    if (petPill && pet) {
      const left = Math.max(0, Math.ceil(Sim.wxLeft(S.g.loc))), rs = (C.weather.events.find(e => e.id === 'rain') || {}).sec || 30;
      petPill.querySelector('b').textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
      petPill.style.setProperty('--left', Math.min(100, Sim.wxLeft(S.g.loc) / rs * 100) + '%');
    }
    const aurPill = el.boostBar.querySelector('.bp-aurora');
    if (aurPill && aur) {
      const left = Math.ceil(Sim.auroraLeft());
      aurPill.querySelector('b').textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
      aurPill.style.setProperty('--left', (Sim.auroraLeft() / C.aurora.sec * 100) + '%');
    }
    const moonPill = el.boostBar.querySelector('.bp-moon');
    if (moonPill && moon) {
      const ph = Sim.solarPhase({ loc: S.g.loc }), left = Math.max(0, Math.ceil(ph.remaining || 0));
      moonPill.querySelector('b').textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
      moonPill.style.setProperty('--left', ((1 - (ph.frac || 0)) * 100) + '%');
    }
    el.boostBar.querySelectorAll('.bp-grid').forEach(function (pill) {
      const loc = pill.dataset.grid, left = Sim.gridDownLeft(loc);
      const R = Sim.gridRecoverSec();

      pill.querySelector('b').textContent =
        Math.round((1 - left / R) * 100) + '%';
      pill.style.setProperty('--left', (left / R * 100) + '%');
    });
    el.boostBar.querySelectorAll('.bp-wx').forEach(function (pill) {
      const w = wxs.find(x => x.loc === pill.dataset.loc);
      if (!w) return;
      const left = Sim.wxLeft(w.loc);
      pill.querySelector('b').textContent = Math.ceil(left) + 's';
      pill.style.setProperty('--left', (left / w.event.sec * 100) + '%');
    });

    el.boostBar.querySelectorAll('.bp[data-id]').forEach(function (d) {
      const left = Sim.boostLeft(d.dataset.id);
      d.querySelector('b').textContent = clock(left);
      d.style.setProperty('--left', (left / Sim.boostDur() * 100) + '%');
    });
  };

  let panelKind = null;

  let panelKey = '';

  function goalRank(o) {
    if (Sim.goalReady(o)) return 0;
    if (Sim.goalPaid(o)) return 2;
    return 1;
  }

  function isTrial(o) { return (o.reward || 0) >= C.goals.hardAt; }
  function savedBadge() { return (C.ui.savedBoost || 'badge') === 'badge'; }
  function goalOrder(kind) {
    const trials = kind === 'trials';

    return C.objectives.filter(o => isTrial(o) === trials && !Sim.goalHidden(o))
      .map((o, i) => ({ o: o, i: i }))
      .sort((a, b) => goalRank(a.o) - goalRank(b.o) || a.i - b.i)
      .map(x => x.o);
  }

  function panelSig() {

    if (panelKind === 'stats') {
      const st = (S.g && S.g.stats) || [];
      return 'stats:' + st.length + ':' + (st.length ? st[st.length - 1][0] : 0) + ':' + GG.i18n.lang();
    }
    if (panelKind === 'goals' || panelKind === 'trials') {
      return panelKind + ':' + goalOrder(panelKind).map(o => o.id).join(',');
    }
    if (panelKind === 'blueprints') return S.blueprints().map(b => b.id).join(',');

    if (panelKind === 'plan') {
      return 'plan:' + Sim.storyAt() + ':' + Sim.cycle() + ':' +
             C.objectives.filter(o => Sim.goalReady(o)).length;
    }

    if (panelKind === 'caps') {
      return Sim.visibleCaps().map(k => k + ':' + Sim.capLevel(k)).join(',');
    }
    return Sim.visibleBoosts().map(b => b.id).join(',');
  }

  function tabStrip(list) {
    const wrap = document.createElement('div');
    wrap.className = 'pn-tabs';
    list.forEach(function (t) {
      const b = document.createElement('button');
      b.className = 'pn-tab' + (panelKind === t[0] ? ' on' : '');
      b.dataset.kind = t[0];
      const n = t[3] || 0;
      b.innerHTML = IC.svg(t[2], 15) + '<span>' + t[1] + '</span>' +
        (n ? '<span class="pn-tab-badge">' + n + '</span>' : '');
      b.onclick = function () { GG.audio.play('click'); UI.openPanel(t[0]); };
      wrap.appendChild(b);
    });
    return wrap;
  }
  function shopTabs() {
    return tabStrip([['boosts', GG.i18n.t('ui.boostsCaps'), 'boost'], ['caps', GG.i18n.t('ui.capacity'), 'plus']]);
  }

  function goalTabs() {
    const tabs = [];
    if (Sim.storyOn()) tabs.push(['plan', GG.i18n.t('ui.plan'), 'goals']);

    const ready = k => goalOrder(k).filter(o => Sim.goalReady(o)).length;
    tabs.push(['goals', GG.i18n.t('ui.objectives'), 'goals', ready('goals')],
              ['trials', GG.i18n.t('ui.trials'), 'diamond', ready('trials')]);
    return tabStrip(tabs);
  }

  UI.goalsHome = function () { return (Sim.storyOn() && !Sim.storyOver()) ? 'plan' : 'goals'; };

  function renderPlan() {
    el.pnTitle.textContent = GG.i18n.t('ui.plan');
    el.pnIc.innerHTML = IC.svg('goals', 22);
    el.pnNote.classList.remove('hidden');
    el.pnNote.textContent = GG.i18n.t('ui.planNote');
    el.pnBody.innerHTML = '';
    panelKey = panelSig();
    el.pnBody.appendChild(goalTabs());

    const at = Sim.storyAt(), list = Sim.storySteps();
    if (Sim.storyOver()) {
      el.pnBody.insertAdjacentHTML('beforeend',
        '<div class="pn-empty">' + GG.i18n.t('ui.planDone') + '</div>');

      const m = U.small((C.fullCircle || {}).siteMul || 1);
      if (Sim.fullCircleOpen()) {
        const box = document.createElement('div');
        box.className = 'fc-plan';
        box.innerHTML = '<b>' + GG.i18n.t('fc.title') + '</b>' +
          '<span>' + GG.i18n.t('fc.planLead').replace('%m', m) + '</span>' +
          '<button type="button">' + GG.i18n.t('fc.planBtn') + '</button>';
        box.querySelector('button').onclick = function () {
          GG.audio.play('click'); UI.fullCircle();
        };
        el.pnBody.appendChild(box);
      } else if (Sim.cycle() > 0) {
        el.pnBody.insertAdjacentHTML('beforeend', '<div class="fc-plan after"><span>' +
          GG.i18n.t('fc.planAfter').replace('%m', m) + '</span></div>');
      }
    }
    let act = null;
    list.forEach(function (e, i) {
      if (e.act !== act) {
        act = e.act;
        const paid = !!(S.g.storyActs || {})[act.id];
        let bonus = act.money ? U.cur('money', act.money) : '';
        if (act.gem) bonus += (bonus ? ' + ' : '') + UI.gemText(act.gem + ' ◆');
        el.pnBody.insertAdjacentHTML('beforeend',
          '<div class="pl-act' + (paid ? ' done' : '') + '">' +
            '<span>' + GG.i18n.ins(act.name) + '</span>' +
            '<b>' + bonus + '</b></div>');
      }
      const done = i < at, now = i === at;

      const txt = (done || now) ? GG.i18n.ins(e.s.text) : '— — —';
      const row = document.createElement('div');
      row.className = 'pl-step' + (done ? ' done' : now ? ' now' : ' later');
      row.innerHTML = '<i></i><span><div class="pl-txt">' + txt + '</div>' +
        (now && e.s.why ? '<div class="pl-why">' + GG.i18n.ins(Sim.storyWhy(e.s)) + '</div>' : '') +
        '</span>';
      el.pnBody.appendChild(row);
    });
  }

  UI.autosaveMark = function () {

    if (S.practice) return;
    S.save(true);
    let box = document.getElementById('autosave');
    if (!box) {
      box = document.createElement('div');
      box.id = 'autosave';
      document.body.appendChild(box);
    }
    box.innerHTML = '<span class="as-ic">' + IC.svg('save', 16) + '</span>' +
      '<span class="as-txt"><b>' + GG.i18n.t('ui.autosaving') + '</b>' +
      '<i>' + GG.i18n.t('ui.autosaveHold') + '</i></span>';
    box.classList.remove('as-out');
    void box.offsetWidth;
    box.classList.add('as-in');
    clearTimeout(box._t);
    box._t = setTimeout(function () {
      box.classList.remove('as-in');
      box.classList.add('as-out');
    }, C.sim.autosaveMarkHold * 1000);
  };

  let svBar = null, svHidden = 0;
  UI.saveWarn = function () {
    const G = C.saveGuard || {};
    if (G.enabled === false || G.notice === false) return;
    const gap = (G.repeatSec === undefined ? 120 : G.repeatSec) * 1000;
    if (svHidden && Date.now() - svHidden < gap) return;
    svHidden = 0;
    if (svBar && svBar.isConnected) return;
    svBar = document.createElement('div');
    svBar.className = 'save-bar';
    svBar.innerHTML = '<b></b><span></span><button type="button"></button>';
    svBar.querySelector('b').textContent = GG.i18n.t('sv.title');
    svBar.querySelector('span').textContent = GG.i18n.t('sv.body');
    const btn = svBar.querySelector('button');
    btn.textContent = GG.i18n.t('err.close');
    btn.onclick = function () { svHidden = Date.now(); svBar.remove(); svBar = null; };
    let st = document.getElementById('notice-stack');
    if (!st) { st = document.createElement('div'); st.id = 'notice-stack'; document.body.appendChild(st); }
    st.appendChild(svBar);
  };

  UI.syncReveal = function () {
    const R = C.reveal, items = (R && R.items) || {};
    const off = !R || R.enabled === false;
    if (!off) S.revealCheck();
    const seen = (S.g && S.g.seenUi) || {};
    for (const k in items) document.body.classList.toggle('rv-' + k, off || !!seen[k]);
  };

  UI.offlineCard = function (rep) {
    if (!rep) return;
    let rows = [];
    const T = GG.i18n.t, D = GG.i18n.dur;
    const v2 = C.offline.cardV2 !== false;
    if (v2) {

      const line = (ic, cls, label, val) =>
        '<div class="of-row ' + cls + '"><span class="of-ic">' + IC.svg(ic, 14) + '</span>' +
        '<span class="of-lbl">' + label + '</span><b>' + val + '</b></div>';
      if (rep.ci > 0.005) rows.push(line('ci', 'ci', C.currencies.ci.name, '+' + U.fmt(rep.ci)));
      if (rep.money > 0.005) rows.push(line('money', 'money', C.currencies.money.name, '+' + U.fmt(rep.money)));
      if (rep.kg > 0.005) rows.push(line('bag', 'trash', T('of.trash'), GG.i18n.ins(U.kg(rep.kg))));
    } else {
      const line = (ic, cls, txt) =>
        '<div class="of-row ' + cls + '"><span class="of-ic">' + IC.svg(ic, 15) + '</span>' +
        '<b>' + txt + '</b></div>';
      if (rep.ci > 0.005) rows.push(line('ci', 'ci', '+' + U.fmt(rep.ci) + ' ' + T('ui.ciAbbr')));
      if (rep.money > 0.005) rows.push(line('money', 'money', '+$' + U.fmt(rep.money)));
      if (rep.kg > 0.005) rows.push(line('bag', 'trash', GG.i18n.ins(U.kg(rep.kg)) + ' ' + T('of.cleaned')));
    }

    if (!rows.length) {
      if (C.offline.hideWhenEmpty) return;
      rows.push('<div class="of-row"><b>' + T('of.nothing') + '</b></div>');
    }

    let box = document.getElementById('offline-card');
    if (!box) {
      box = document.createElement('div');
      box.id = 'offline-card';
      box.onclick = function () { box.classList.remove('of-in'); box.classList.add('of-out'); };
      document.body.appendChild(box);
    }
    box.classList.toggle('v2', v2);

    const DA = function (sec) {
      if (!(C.offline.hourNoSec !== false && sec >= 3600)) return D(sec);
      return D(Math.floor(sec / 60) * 60).replace(/\s0[sс]$/, '');
    };
    box.innerHTML =
      '<div class="of-head">' + T('of.head') + '</div>' +
      '<div class="of-time">' + DA(rep.awaySec) + ' ' + T('of.away') +
      (rep.capped ? ' <i>(' + T('of.counted') + ' ' + DA(rep.countedSec) + ')</i>' : '') + '</div>' +
      '<div class="of-rows">' + rows.join('') + '</div>' +
      '<div class="of-foot">' +
      T('of.slower').replace('%n', Math.round(1 / Sim.offlineRate())) + '</div>';

    box.style.top = '';
    const pl = document.getElementById('places');
    if (C.offline.belowPlaces !== false && pl && pl.offsetParent) {
      const z = (GG.render.uiZoom && GG.render.uiZoom()) || 1;
      const bottom = pl.getBoundingClientRect().bottom / z;
      if (bottom > 0) box.style.top = Math.round(bottom + (C.offline.placesGap || 10)) + 'px';
    }
    box.classList.remove('of-out');
    void box.offsetWidth;
    box.classList.add('of-in');
    clearTimeout(box._t);
    box._t = setTimeout(function () {
      box.classList.remove('of-in'); box.classList.add('of-out');
    }, C.offline.showSec * 1000);
  };

  let codexTab = 'machines';

  const FOLD_KEY = 'earthregen.codexFold';
  let cxFolded = {};
  try { cxFolded = JSON.parse(localStorage.getItem(FOLD_KEY) || '{}') || {}; } catch (e) { cxFolded = {}; }
  function cxFoldOn() { return (C.ui || {}).codexFold !== false; }
  function cxFoldSave() { try { localStorage.setItem(FOLD_KEY, JSON.stringify(cxFolded)); } catch (e) {} }

  function cxRate(t) {

    const bits = [];

    if (t.wfRate) bits.push(GG.i18n.ins(t.wfRate + ' WF/h'));
    if (t.energyRate) bits.push(GG.i18n.ins(t.energyRate + ' KW/h'));
    if (t.kgPerWF) bits.push(t.kgPerWF + ' ' + GG.i18n.t('ui.kgPerWf'));
    if (t.energyPerKg) bits.push(t.energyPerKg + ' ' + GG.i18n.t('ui.kwPerKg'));
    if (t.wfPerKg) bits.push(t.wfPerKg + ' ' + GG.i18n.t('ui.wfPerKg'));

    if (t.convert && t.convert.inputs) {
      bits.push(Object.keys(t.convert.inputs)
        .map(k => U.small(t.convert.inputs[k]) + ' ' + GG.i18n.t('ui.kgOf') + ' ' +
                  ((C.resources[k] || {}).name || k)).join(' + ') +
        (t.convert.wf ? ' + ' + t.convert.wf + ' WF/h' : '') +
        (t.convert.kw ? ' + ' + t.convert.kw + ' KW/h' : '') +
        ' ' + GG.i18n.t('sk.perKgMade'));
    }
    if (t.ciPerWF) bits.push(t.ciPerWF + ' ' + GG.i18n.t('ui.ciPerWf'));
    if (t.ciPerKW) bits.push(t.ciPerKW + ' ' + GG.i18n.t('ui.ciPerKw'));

    if (t.ciPerKw) bits.push(t.ciPerKw + ' ' + GG.i18n.t('ui.ciCostPerKw'));

    if (t.ciPerKg) bits.push(t.ciPerKg + ' ' + GG.i18n.t('ui.ciPerKgBurn'));

    const bp = C.byProduct(t, t.ciPerKg);
    if (bp) {
      bits.push(U.small(bp.kg) + ' ' + GG.i18n.t('ui.kgOf') + ' ' +
        (C.resources[bp.res] ? C.resources[bp.res].name.toLowerCase() : bp.res) +
        ' ' + GG.i18n.t('ui.perKgBurned'));
    }
    if (t.store) bits.push(t.store + ' ' + GG.i18n.t('ui.kwStore'));
    if (t.processRate && isFinite(t.processRate)) {
      bits.push(GG.i18n.t('ui.upTo').replace('%n', GG.i18n.ins(t.processRate + ' kg/h')));
    }
    if (t.recipe && t.recipe.inputs) {

      bits.push(Object.keys(t.recipe.inputs)
        .map(k => t.recipe.inputs[k] + ' ' + GG.i18n.t('ui.kgOf') + ' ' +
                  (C.resources[k] ? C.resources[k].name.toLowerCase() : k))
        .join(' + ') +
        (t.recipe.kw ? ' + ' + t.recipe.kw + ' ' + GG.i18n.t('ui.kwOf') : '') +

        (t.recipe.wf ? ' + ' + t.recipe.wf + ' ' + GG.i18n.t('ui.wfOf') : '') +
        ' ' + GG.i18n.t('ui.aBatch'));

      if (t.recipe.ci) {
        bits.push(GG.i18n.t('ui.paysCi')
          .replace('%n', GG.i18n.ins(t.recipe.ci + ' CI/h')));
      }
      if (t.recipe.gem) {
        bits.push(GG.i18n.t('ui.pressesGem')
          .replace('%n', t.recipe.gem.base)
          .replace('%c', C.currencies[t.recipe.gem.cur].short)
          .replace('%e', t.recipe.gem.every));
      }
    }

    if (t.convert && t.convert.inputs) {
      const bill = Object.keys(t.convert.inputs)
        .map(k => t.convert.inputs[k] + ' kg/h ' +
                  (C.resources[k] ? C.resources[k].name.toLowerCase() : k))
        .join(' + ') + (t.convert.wf ? ' + ' + t.convert.wf + ' WF/h' : '');

      bits.push(GG.i18n.ins(bill) + ' ' + GG.i18n.t('ui.makes') + ' ' +
                (t.convert.out
                  ? GG.i18n.ins(t.convert.out.kg + ' kg/h') + ' ' +
                    (C.resources[t.convert.out.res] || {}).name.toLowerCase()
                  : GG.i18n.ins(t.convert.ci + ' CI/h')));
    }

    if (t.oilPerKg) bits.push(U.small(t.oilPerKg) + ' ' + GG.i18n.t('ui.kgOutPerIn'));
    if (t.hazPerKg) bits.push(U.small(t.hazPerKg) + ' ' + GG.i18n.t('ui.kgOutPerIn'));
    if (t.yieldPerKg) bits.push(U.small(t.yieldPerKg) + ' ' + GG.i18n.t('ui.kgOutPerIn'));
    if (t.fertPerKg) bits.push(U.small(t.fertPerKg) + ' ' + GG.i18n.t('ui.kgOutPerIn'));
    if (t.kwPerKg) bits.push(t.kwPerKg + ' ' + GG.i18n.t('ui.kwPerKgBurn'));
    if (t.rocket) bits.push(GG.i18n.t(t.rocket.flight.cargo === 'gems' ? 'ui.rocketFlightGems' : 'ui.rocketFlight')
      .replace('%m', Math.round(t.rocket.flight.sec / 60))
      .replace('%k', t.rocket.flight.cargo === 'gems' ? String(t.rocket.flight.gems) : U.kg(t.rocket.flight.metal))
      .replace('%c', U.fmt(t.rocket.flight.ci, 0)));
    if (t.fission) bits.push(GG.i18n.t('ui.fissionLoad')
      .replace('%k', U.small(t.fission.kg)).replace('%m', Math.round(t.fission.sec / 60))
      .replace('%p', U.fmt(Sim.reactorKw(t), 1)));
    if (t.collect) bits.push(GG.i18n.t('ui.tillOf') + ' ' + U.cur(t.collect.cur, t.collect.cap));

    Sim.autoSources(t).forEach(function (src) {

      bits.push(GG.i18n.ins(src.perUnit + ' ' + C.currencies[t.collect.cur].short + '/h') +
                ' ' + GG.i18n.t('ui.per') + ' ' +
                (src.port === 'kw' ? C.resources.energy.rate : C.resources.wf.rate));
    });
    if (t.licence) {
      bits.push(GG.i18n.t('ui.licenceFor')
                  .replace('%c', U.cur(t.licence.cur, Sim.licenceCost(t)))
                  .replace('%m', Math.round(t.licence.sec / 60)));
    }

    if (t.powerUp && !Sim.demoRes(t.powerUp.res)) {
      bits.push(GG.i18n.t('ui.powerUpBy')
                  .replace('%k', U.small(t.powerUp.kg))
                  .replace('%r', (C.resources[t.powerUp.res] || {}).name || t.powerUp.res)
                  .replace('%m', U.small(t.powerUp.boost))
                  .replace('%g', U.small(t.powerUp.growth)));
    }
    if (t.cap) bits.push(GG.i18n.t('ui.maxAtOnce').replace('%n', S.baseCap(t.id)));
    if (t.capPerLoc && perPlaceOn()) bits.push(t.capPerLoc > 1
      ? GG.i18n.t('ui.maxPerPlace').replace('%n', t.capPerLoc) : GG.i18n.t('ui.onePerPlace'));
    return bits.join(' &middot; ');
  }

  function cxRateMap(t) {
    const m = { in: {}, out: {} };
    let flows = [];
    try { flows = C.gradeFlow(t) || []; } catch (e) { return m; }

    if (t.recipe || t.recruit) return m;
    const U = GG.util;
    const n = v => (v >= 1000 ? String(Math.round(v)) : U.small(v));
    const kgh = v => n(v) + ' kg/h';
    flows.forEach(f => {

      if (!Object.keys(f.out || {}).length && !Object.keys(f.gives || {}).length) return;
      Object.keys(f.in || {}).forEach(r => { m.in[r] = kgh(f.in[r]); });
      if (f.kw) m.in.energy = n(f.kw) + ' KW/h';
      if (f.wf) m.in.wf     = n(f.wf) + ' WF/h';
      Object.keys(f.out || {}).forEach(r => { m.out[r] = kgh(f.out[r]); });
      Object.keys(f.side || {}).forEach(r => { m.out[r] = kgh(f.side[r]); });
      const g = f.gives || {};
      if (g.kw)      m.out.energy  = n(g.kw) + ' KW/h';
      if (g.wf)      m.out.wf      = n(g.wf) + ' WF/h';
      if (g.ci)      m.out.ci      = n(g.ci) + ' CI/h';
      if (g.diamond) m.out.diamond = n(g.diamond) + ' ◆';
      if (g.money)   m.out.money   = n(g.money) + ' $/h';
    });
    return m;
  }

  function cxPorts(t) {
    const T = GG.i18n.t;
    const rate = cxRateMap(t);
    const none = '<em class="cx-none">' + T('cx.none') + '</em>';

    const hid = r => { const R = C.resources[r]; return !!(R && R.hideUntil && !(S.g && S.g.objectives && S.g.objectives[R.hideUntil])); };
    const shown = p => !(p.res && (Sim.demoRes(p.res) || hid(p.res)));
    const tag = (label, r, d) => {
      const v = r && rate[d][r];
      return '<em>' + label + (v ? '<b>' + GG.i18n.ins(v) + '</b>' : '') + '</em>';
    };
    const side = d => ((t.ports && t.ports[d]) || []).filter(shown)
      .map(p => tag(p.label, p.res, d)).join(', ') || none;
    const virt = (t.virtualOut || []).map(v => tag(v.label, v.cur || v.res, 'out')).join(', ');
    return '<div class="cx-ports"><span>' + T('cx.in') + '</span>' + side('in') +
           '<span>' + T('cx.out') + '</span>' +
           (side('out') === none && virt ? virt : side('out')) +
           '</div>';
  }

  function cxWatch(t) {
    const M = (C.tutorial && C.tutorial.machineNotes) || {};
    if (M.keep && M.keep.indexOf(t.id) < 0) return '';
    const h = (C.tutorial.hintList || []).filter(x => x.node === t.id)[0];
    if (!h || !h.text) return '';
    return '<div class="cx-watch"><span>' + GG.i18n.t('cx.watchOut') + '</span>' +
           GG.i18n.ins(h.text) + '</div>';
  }

  function cxWhy(t) {
    if (!t.why) return '';
    if (t.whyNeeds && Sim.demoNode && Sim.demoNode(t.whyNeeds)) return '';
    return '<div class="cx-why"><span>' + GG.i18n.t('cx.whyBuild') + '</span>' +
           GG.i18n.ins(t.why) + '</div>';
  }

  function skillTryRow(s) {
    if (!C.ui.skillTry || !GG.practice || !GG.practice.canPractise || !S.hasSkill(s.id)) return '';
    const ids = (s.unlocks || []).filter(id => GG.practice.canPractise(id));
    if (!ids.length) return '';
    return '<div class="sk-try">' + ids.map(id => '<button class="cx-try" type="button" data-try="' + id + '">' +
      IC.svg('help', 13) + GG.practice.tryFace(id) +
      (ids.length > 1 ? '<span>' + C.nodeTypes[id].name + '</span>' : '') + '</button>').join('') + '</div>';
  }

  function cxTry(t) {
    if (!GG.practice || !GG.practice.canPractise || !GG.practice.canPractise(t.id)) return '';
    return '<button class="cx-try" type="button" data-try="' + t.id + '">' +
           IC.svg('help', 13) + GG.practice.tryFace(t.id) + '</button>';
  }

  function cxNote(t) {
    const rows = C.specProse(t).map(r => GG.i18n.ins(r[1]));
    if (t.capPerLoc && perPlaceOn()) rows.push(perPlaceTip(t));
    if (!rows.length) return '';
    return '<div class="cx-note"><span>' + GG.i18n.t('cx.noteLbl') + '</span>' +
           rows.map(r => '<p>' + r + '</p>').join('') + '</div>';
  }

  let cxQuery = '';
  function cxFindKey(t, cat) {
    return findNorm(t.name + ' ' + cat.name).replace(/"/g, '');
  }
  function cxFindApply(wrap) {
    const q = findNorm(cxQuery.trim());
    let any = false;
    wrap.querySelectorAll('.cx-item[data-find]').forEach(function (it) {
      const hit = !q || it.dataset.find.indexOf(q) >= 0;
      it.classList.toggle('cx-miss', !hit);
      if (hit) any = true;
    });

    wrap.querySelectorAll('.cx-grp').forEach(function (g) {
      const hits = g.querySelectorAll('.cx-item[data-find]:not(.cx-miss)').length;
      g.classList.toggle('cx-open', !!q && hits > 0);
      g.classList.toggle('cx-miss', !!q && !hits);
      const h = wrap.querySelector('.cx-fold[data-cat="' + g.dataset.cat + '"]');
      if (h) h.classList.toggle('cx-miss', !!q && !hits);
    });
    const none = wrap.querySelector('.cx-none');
    if (none) none.classList.toggle('hidden', !q || any);
    if (GG.codexGrid) GG.codexGrid.sync();
  }
  function cxFindBox(wrap) {
    const box = document.createElement('label');
    box.className = 'cx-find';
    box.innerHTML = IC.svg('find', 14) +
      '<input type="text" autocomplete="off" spellcheck="false" placeholder="' +
        GG.i18n.t('ui.dockFind') + '">' +
      '<button type="button" class="df-clear' + (cxQuery ? '' : ' hidden') + '">&times;</button>';
    const inp = box.querySelector('input'), clr = box.querySelector('.df-clear');
    inp.value = cxQuery;
    function set(v) {
      cxQuery = v;
      if (inp.value !== v) inp.value = v;
      clr.classList.toggle('hidden', !v);
      cxFindApply(wrap);
    }
    inp.addEventListener('input', function () { set(inp.value); });
    inp.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); if (inp.value) set(''); else inp.blur(); }
    });
    clr.addEventListener('click', function (e) { e.preventDefault(); set(''); inp.focus(); });
    return box;
  }

  function cxMachines() {

    let html = '';
    C.categories.forEach(function (cat) {
      const list = Object.keys(C.nodeTypes)
        .map(k => C.nodeTypes[k])
        .filter(t => t.category === cat.id && t.kind === 'machine');
      if (!list.length) return;
      const fold = cxFoldOn(), shut = fold && !!cxFolded[cat.id];
      html += fold
        ? '<button type="button" class="cx-cat cx-fold' + (shut ? ' shut' : '') + '" data-cat="' + cat.id + '">' +
          '<span class="cx-chev">' + IC.svg('chevron', 13) + '</span>' + cat.name +
          '<i>' + list.length + '</i></button><div class="cx-grp' + (shut ? ' shut' : '') + '" data-cat="' + cat.id + '">'
        : '<h3 class="cx-cat">' + cat.name + '</h3>';
      list.forEach(function (t) {

        if (Sim.demoNode(t.id)) {
          html += '<div class="cx-item cx-dev" data-dev="' + t.id + '" data-find="' + cxFindKey(t, cat) + '">' +
            '<div class="cx-ic" style="--c:' + C.iconColor(t) + '">' + IC.svg(t.icon, 20) + '</div>' +
            '<div class="cx-body"><div class="cx-name">' + t.name +
              '<span class="cx-tag cx-devtag">' + GG.i18n.t('ui.inDev') + '</span></div>' +
            '<div class="cx-desc">' + GG.i18n.t('ui.inDevNote') + '</div></div></div>';
          return;
        }

        const known = S.isUnlocked(t.id);

        const owner = C.ownerSkill && C.ownerSkill(t.id);
        const mystery = !known && (C.ui || {}).codexMystery !== false &&
                        owner && !Sim.skillAvailable(owner);
        const rate  = mystery ? '' : (C.ui.codexRate ? cxRate(t) : '');
        const watch = mystery ? '' : cxWatch(t);
        const note  = mystery ? '' : cxNote(t);
        const why   = mystery ? '' : cxWhy(t);
        html += '<div class="cx-item' + (known ? '' : ' cx-locked') + '" data-cx="' + t.id +
          '" data-find="' + cxFindKey(t, cat) + '">' +
          '<div class="cx-ic" style="--c:' + C.iconColor(t) + '">' + IC.svg(t.icon, 20) + '</div>' +
          '<div class="cx-body">' +
            '<div class="cx-name">' + t.name +
              (known ? '' : '<span class="cx-tag">' + GG.i18n.t('ui.locked') + '</span>') + '</div>' +
            (known || C.ui.codexHidePorts === false ? cxPorts(t) : '') +
            '<div class="cx-desc">' +
              (mystery ? GG.i18n.t('cx.machineUnknown') : C.codexDescOf(t)) + '</div>' +
            (rate ? '<div class="cx-rate">' + rate + '</div>' : '') +
            why + watch + note + cxTry(t) +
          '</div></div>';
      });
      if (cxFoldOn()) html += '</div>';
    });
    return html + '<p class="cx-intro cx-none hidden">' + GG.i18n.t('ui.findNone') + '</p>';
  }

  function cxMetOn() { return !!(C.ui && C.ui.codexMet); }
  function cxMadeNow() {
    const out = { trash: 1 };
    Object.keys(C.nodeTypes).forEach(function (k) {
      if (!S.isUnlocked(k)) return;
      const t = C.nodeTypes[k];
      ((t.ports && t.ports.out) || []).forEach(function (p) { out[p.res] = 1; });
      if (t.recipe && t.recipe.out) out[t.recipe.out.res] = 1;
      if (t.convert && t.convert.out) out[t.convert.out.res] = 1;
    });
    return out;
  }
  function cxCurMet(k) {
    const seen = (S.g && S.g.seenUi) || {}, R = C.reveal;
    if (!R || R.enabled === false) return true;
    if (k === 'money') return !!seen.money;
    if (k === 'diamond') return !!seen.gems;
    return true;
  }

  function cxResources() {
    const met = cxMetOn(), made = met ? cxMadeNow() : null;
    let hidden = 0;
    let html = '<h3 class="cx-cat">' + GG.i18n.t('cx.currencies') + '</h3>';
    Object.keys(C.currencies).forEach(function (k) {
      if (met && !cxCurMet(k)) return;
      const c = C.currencies[k];
      html += '<div class="cx-line"><b style="color:' + c.color + '">' + c.name + '</b>' +
              '<span>' + (c.short || '') + '</span></div>';
    });
    html += '<h3 class="cx-cat">' + GG.i18n.t('cx.materialsHead') + '</h3>';
    Object.keys(C.resources).forEach(function (k) {
      const r = C.resources[k];

      if (r.hideUntil && !(S.g && S.g.objectives && S.g.objectives[r.hideUntil])) return;
      if (made && !made[k]) { hidden++; return; }

      if (Sim.demoRes(k)) {
        html += '<div class="cx-line cx-dev"><b style="color:' + r.color + '">' + r.name +
                '</b><span>' + GG.i18n.t('ui.inDev') + '</span></div>';
        return;
      }
      const val = C.gradeValue[k];
      html += '<div class="cx-line"><b style="color:' + r.color + '">' + r.name + '</b>' +
        '<span>' + r.rate + (val !== undefined ? ' &middot; ' + GG.i18n.t('cx.worth').replace('%v', val) : '') +
        ' &middot; ' + (r.flow === 'rate' ? GG.i18n.t('cx.flowRate') : GG.i18n.t('cx.flowMaterial')) + '</span></div>';
    });
    if (hidden) html += '<p class="cx-intro cx-note">' + GG.i18n.t('cx.moreMat') + '</p>';
    return html;
  }

  function cxWeather() {

    const locs = Sim.wxLocs().filter(id => !Sim.demoLoc(id));

    const seenWx = cxMetOn() ? ((S.g && S.g.wxSeen) || {}) : null;
    const shown = C.weather.events.filter(e => !seenWx || seenWx[e.id]);
    if (!shown.length) return '<p class="cx-intro">' + GG.i18n.t('cx.moreWx') + '</p>';
    const names = locs.map(id => '<b>' + ((S.locationById(id) || {}).name || id) + '</b>');
    let html = '<p class="cx-intro">' + GG.i18n.t('cx.wxIntro')
      .replace('%p', names.join(' ' + GG.i18n.t('cx.wxAnd') + ' ')) + '</p>';
    shown.forEach(function (e) {
      const odds = locs.map(function (id) {
        const p = Math.round(Sim.wxChance(id, e) * 100);
        return (locs.length > 1 ? ((S.locationById(id) || {}).name + ' ') : '') + p + '%';
      }).join(' &middot; ');
      html += '<div class="cx-item"><div class="cx-ic" style="--c:' + e.color + '">' +
        IC.svg(e.icon, 20) + '</div><div class="cx-body">' +
        '<div class="cx-name">' + e.name +
          '<span class="cx-tag">' + odds + ' &middot; ' + e.sec + 's</span></div>' +
        '<div class="cx-desc">' + Sim.wxDesc(e) + '</div></div></div>';
    });

    html += '<p class="cx-intro cx-note">' + GG.i18n.t('cx.wxStack') + '</p>';
    if (shown.length < C.weather.events.length)
      html += '<p class="cx-intro cx-note">' + GG.i18n.t('cx.moreWx') + '</p>';
    return html;
  }

  function cxBoosts() {
    let html = '<p class="cx-intro">' + GG.i18n.t('cx.boostIntro') + '</p>';
    C.boosts.forEach(function (b) {
      html += '<div class="cx-item"><div class="cx-ic" style="--c:var(--gem)">' +
        IC.svg(b.icon || 'boost', 20) + '</div><div class="cx-body">' +
        '<div class="cx-name">' + b.name + '<span class="cx-tag">' + b.cost + ' &#9670;' +
          (b.sec ? ' &middot; ' + Math.round(b.sec / 60) + ' ' + GG.i18n.t('cx.min') : ' &middot; ' + GG.i18n.t('ui.instant')) +
        '</span></div><div class="cx-desc">' + (b.desc || '') + '</div></div></div>';
    });
    html += '<h3 class="cx-cat">' + GG.i18n.t('cx.objectivesHead') + '</h3>';
    C.objectives.forEach(function (o) {
      if (Sim.goalHidden(o)) return;
      const done = Sim.goalPaid(o);
      html += '<div class="cx-line' + (done ? ' cx-done' : '') + '"><b>' + o.name +
        (done ? ' &check;' : '') + '</b><span>' + (o.desc || '') +
        ' &middot; ' + o.reward + ' &#9670;' +
        (Sim.goalMachine(o) ? ' &middot; ' + Sim.goalMachine(o).name : '') + '</span></div>';
    });
    return html;
  }

  function cxKeyRows() {
    const h = (C.ui || {}).hotkeys || {};
    if (h.enabled === false) return [];
    const rows = [];
    const digits = function (kind) {
      return kind === 'digit' ? '1 &hellip; 9'
           : kind === 'shift-digit' ? 'Shift + 1 &hellip; 9' : null;
    };
    const many = S.openLocations().length > 1;
    const pk = digits(h.places);
    if (pk && many) rows.push(['ctlPlaces', pk]);

    if (h.move && many && S.canRelocate()) {
      rows.push(['ctlMove', String(h.move).toUpperCase()]);
    }

    if (h.demolish) rows.push(['ctlDemolish', String(h.demolish).toUpperCase()]);

    if (h.flip && (C.ui || {}).flipPorts !== false) {
      rows.push(['ctlFlip', String(h.flip).toUpperCase()]);
    }
    const dk = digits(h.dock);
    if (dk) rows.push(['ctlDock', dk]);
    return rows;
  }

  function cxControlsKeys() {
    return '' +
      '<div class="cx-keys">' +

      [[(GG.input && GG.input.dragSweep && GG.input.dragSweep()) ? 'ctlSweepDrag' : 'ctlSweep'],
       ['ctlClick'],
       [(GG.input && GG.input.touchUi && GG.input.touchUi()) ? 'ctlShiftTouch' : 'ctlShift'],

       ...(((C.ui || {}).bandSelect !== false) &&
           !(GG.input && GG.input.touchUi && GG.input.touchUi())
             ? [[(GG.input.boxDrag && GG.input.boxDrag()) ? 'ctlBandBox' : 'ctlBand']] : []),

       ...((((C.ui || {}).selectAll || {}).enabled && ((C.ui || {}).selectAll || {}).key) &&
           !(GG.input && GG.input.touchUi && GG.input.touchUi())
             ? [['ctlSelAll', 'Ctrl + ' + String(C.ui.selectAll.key).toUpperCase()]] : []),
       ['ctlWire'],

       ...((((C.wire || {}).ortho || {}).enabled !== false) &&
           !(GG.input && GG.input.touchUi && GG.input.touchUi())
             ? [['ctlSquare'], ['ctlSquare2']] : []),

       ...((((C.ui || {}).keepWire || {}).enabled) &&
           !(GG.input && GG.input.touchUi && GG.input.touchUi()) ? [['ctlKeepWire']] : []),

       ...((GG.render.bendsOn && GG.render.bendsOn() && !(GG.input && GG.input.touchUi && GG.input.touchUi()))
             ? [['ctlBend']].concat(GG.render.dotsOn && GG.render.dotsOn() ? [['ctlDot']] : []) : []),
       [(GG.input && GG.input.touchUi && GG.input.touchUi()) ? 'ctlCutTouch' : 'ctlCut'],

       ...((((C.ui || {}).undo || {}).enabled !== false) &&
           !(GG.input && GG.input.touchUi && GG.input.touchUi()) ? [['ctlUndo']] : []),
       ...((GG.input && GG.input.boxDrag && GG.input.boxDrag()) ? [['ctlZoomBox'], ['ctlMmbBox']]
                                                               : [['ctlZoom'], ['ctlMmb']]),

       ...((((C.ui || {}).keyPan || {}).enabled) && !(GG.input && GG.input.touchUi && GG.input.touchUi())
             ? [[C.ui.keyPan.arrows ? 'ctlKeyPan' : 'ctlKeyPanW', null, 'ctlKeyPanV']] : []),

       ...(!(GG.input && GG.input.touchUi && GG.input.touchUi())
             ? [['ctlBoardWheel', null,
                 ((C.ui || {}).treeWheel) === 'zoom' ? 'ctlBoardWheelZV' : 'ctlBoardWheelV']]
             : []),
       ['ctlHome'],

       ...cxKeyRows(),
       ['ctlT'], ['ctlEsc']].map(function (k) {

        return '<div class="cx-line"><b>' + (k[1] || GG.i18n.t('cx.' + k[0] + 'K')) +
               '</b><span>' + GG.i18n.t('cx.' + (k[2] || (k[0] + 'V'))) + '</span></div>';
      }).join('') +
      '</div>' +
      '<p class="cx-intro">' + GG.i18n.t('cx.hourNote') + '</p>';
  }

  UI.controlsHtml = cxControlsKeys;

  function cxControls() {
    return cxControlsKeys() +

      (C.ui.tutorReplay
        ? '<button id="cx-tutor" class="pn-buy">' + GG.i18n.t('cx.replay') + '</button>'
        : '');
  }

  function cxTabs() {
    return [
      ['machines', GG.i18n.t('cx.machines'), 'site', cxMachines],
      ['resources', GG.i18n.t('cx.materials'), 'materials', cxResources],
      ['weather', GG.i18n.t('cx.weather'), 'storm', cxWeather],
      ['boosts', GG.i18n.t('ui.cxBoosts'), 'boost', cxBoosts],
      ['controls', GG.i18n.t('cx.controls'), 'help', cxControls],
    ];
  }

  function renderCodex() {
    el.pnTitle.textContent = GG.i18n.t('ui.codex');
    el.pnIc.innerHTML = IC.svg('help', 22);
    el.pnBank.textContent = ''; delete el.pnBank.dataset.face;
    el.pnBody.innerHTML = '';

    const tabs = document.createElement('div');
    tabs.className = 'pn-tabs cx-tabs';
    cxTabs().forEach(function (t) {
      const b = document.createElement('button');
      b.className = 'pn-tab' + (codexTab === t[0] ? ' on' : '');
      b.innerHTML = IC.svg(t[2], 15) + '<span>' + t[1] + '</span>';
      b.onclick = function () { GG.audio.play('click'); codexTab = t[0]; renderCodex(); };
      tabs.appendChild(b);
    });
    el.pnBody.appendChild(tabs);

    const wrap = document.createElement('div');
    wrap.className = 'cx-wrap';
    const tab = cxTabs().find(t => t[0] === codexTab) || cxTabs()[0];
    wrap.innerHTML = tab[3]();

    const was = document.activeElement, typing = !!(was && was.closest && was.closest('.cx-find'));
    const caret = typing ? was.selectionStart : 0;
    if (tab[0] === 'machines') {
      const box = cxFindBox(wrap);
      el.pnBody.appendChild(box);
      if (typing) { const i = box.querySelector('input'); i.focus(); i.setSelectionRange(caret, caret); }
    }
    el.pnBody.appendChild(wrap);
    if (tab[0] === 'machines') cxFindApply(wrap);

    const tut = wrap.querySelector('#cx-tutor');
    if (tut) tut.onclick = function () {
      GG.tutor.restart(); UI.closePanel(); if (!UI.quiet('tutorRestart')) UI.toast('Tutorial restarted');
    };

    wrap.querySelectorAll('.cx-try').forEach(function (b) {
      b.onclick = function () { UI.tryMachine(b.dataset.try); };
    });

    wrap.querySelectorAll('.cx-fold').forEach(function (h) {
      h.onclick = function () {
        GG.audio.play('click');
        const id = h.dataset.cat, shut = !cxFolded[id];
        if (shut) cxFolded[id] = true; else delete cxFolded[id];
        cxFoldSave();
        h.classList.toggle('shut', shut);
        const g = wrap.querySelector('.cx-grp[data-cat="' + id + '"]');
        if (g) g.classList.toggle('shut', shut);
      };
    });

    el.pnNote.textContent = '';
    el.pnNote.classList.add('hidden');

    if (tab[0] === 'machines' && GG.codexGrid && GG.codexGrid.on()) GG.codexGrid.after(wrap);
  }

  UI.openPanel = function (kind) {

    if (kind === 'boosts' && panelKind !== 'boosts' && panelKind !== 'caps' && S.g && !S.g.practice)
      S.g.boostOpens = (S.g.boostOpens || 0) + 1;
    panelKind = kind;
    if (kind === 'goals' || kind === 'plan') el.btnGoals.classList.remove('trial-glow');
    el.panel.classList.remove('hidden');
    UI.renderPanel();

    const sc = el.panel.querySelector('.pn-card');
    if (sc) { sc.scrollTop = 0; sc.scrollLeft = 0; }
  };
  UI.closePanel = function () { panelKind = null; el.panel.classList.add('hidden'); playTrialQueue(); };

  const trialQueue = [];
  UI.trialFxOn = function () { const F = C.ui.trialFx; return !!(F && F.enabled); };
  function trialColor() { const c = C.categories.find(x => x.id === 'trials'); return c ? c.color : '#7ee0c0'; }
  function trialBanner(icon, kick, name, sub, sec, then) {
    document.querySelectorAll('.trialfx').forEach(b => b.remove());
    const b = document.createElement('div');
    b.className = 'trialfx';
    b.style.setProperty('--tc', trialColor());
    b.innerHTML = '<div class="tf-ray"></div><span class="tf-medal">' + IC.svg(icon, 20) + '</span>' +
      '<div class="tf-txt"><div class="tf-kick">' + kick + '</div><div class="tf-name">' + name + '</div>' +
      '<div class="tf-sub">' + sub + '</div></div>';
    b.onclick = function () { b.classList.add('out'); };

    const z = GG.render.uiZoom ? GG.render.uiZoom() : 1;
    let low = 70;
    ['topbar', 'places', 'plan-tick'].forEach(function (id) {
      const e = document.getElementById(id);
      if (e && e.offsetParent !== null) low = Math.max(low, e.getBoundingClientRect().bottom / z);
    });
    b.style.top = Math.round(low + 10) + 'px';
    document.body.appendChild(b);
    requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('in')));
    setTimeout(() => { if (then) then(b); b.classList.add('out'); }, sec * 1000);
    setTimeout(() => b.remove(), sec * 1000 + 700);
    return b;
  }
  UI.trialDone = function (o) {
    const T = GG.i18n.t, m = Sim.goalMachine(o);
    const pay = '<b class="tf-gem">+' + UI.gemText(o.reward + ' ◆') + '</b>' + (m ? ' ' + T('ui.andA') + ' <i>' + m.name + '</i>' : '');
    trialBanner(o.icon, T('ui.trialDone'), o.name, T('ui.trialWaiting').replace('%r', pay).replace('%g', T('ui.goals')),
                (C.ui.trialFx.bannerSec || 5));
    el.btnGoals.classList.add('trial-glow');
    el.btnGoals.style.setProperty('--tc', trialColor());
  };
  function playTrialQueue() {
    if (!trialQueue.length) return;
    const o = trialQueue.shift(), T = GG.i18n.t, m = Sim.goalMachine(o);
    const next = () => setTimeout(playTrialQueue, 400);
    if (!m) {
      trialBanner(o.icon, T('ui.trialClaimed'), o.name, '<b class="tf-gem">+' + UI.gemText(o.reward + ' ◆') + '</b>', 2.6, next);
      return;
    }
    const cat = C.categories.find(x => x.id === 'trials');
    trialBanner(m.icon, T('ui.trialNewMachine'), m.name, T('ui.trialInDock').replace('%g', cat ? cat.name : 'Trials'),
                (C.ui.trialFx.claimSec || 2.4), function (b) { flyToDock(m, b.querySelector('.tf-medal')); next(); });
  }
  function flyToDock(m, from) {
    const dockOpen = document.getElementById('dock').classList.contains('open');
    const target = (dockOpen && document.querySelector('.dock-sec[data-cat="trials"]')) ||
                   document.getElementById('dock-toggle') || document.getElementById('dock');
    if (!from || !target) return;
    const z = GG.render.uiZoom ? GG.render.uiZoom() : 1;
    const a = from.getBoundingClientRect(), t = target.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'tf-fly';
    f.style.setProperty('--tc', trialColor());
    f.innerHTML = IC.svg(m.icon, 40);
    f.style.left = (a.left / z) + 'px'; f.style.top = (a.top / z) + 'px';
    document.body.appendChild(f);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      f.style.left = ((t.left + t.width / 2) / z - 20) + 'px'; f.style.top = ((t.top + 4) / z) + 'px';
      f.style.transform = 'scale(.45)';
    }));
    setTimeout(() => {
      f.style.opacity = 0; GG.audio.play('build');
      target.style.setProperty('--tc', trialColor());
      target.classList.add('trial-land');
      setTimeout(() => target.classList.remove('trial-land'), 3200);
    }, 900);
    setTimeout(() => f.remove(), 1300);
  }
  UI.panelOpen = function () { return !!panelKind; };

  UI.panelKind = function () { return panelKind; };

  let planKey = null, planClosedSession = false, planAt = -1, planHold = false;
  UI.planClose = function () {
    if (((C.story || {}).ticker || {}).remember === 'session') planClosedSession = true;
    else S.g.storyClosed = true;
    planKey = null;
  };
  UI.planReopen = function () { planClosedSession = false; S.g.storyClosed = false; planKey = null; };
  UI.planHidden = function () {
    return planClosedSession || !!S.g.storyClosed;
  };
  UI.syncPlanTicker = function () {
    const cfg = (C.story || {}).ticker || {};
    const tutorRunning = !S.g.tutorDone;

    const inRoom = !!(GG.practice && GG.practice.active);
    const on = Sim.storyOn() && cfg.show !== false && !tutorRunning && !inRoom &&
               !UI.planHidden() && !Sim.storyOver();
    const cur = on ? Sim.storyNow() : null;

    const key = on ? (cur.act.id + '|' + cur.s.id + '|' + GG.i18n.lang()) : 'off';
    if (planHold) return;
    if (key === planKey) return;

    const at = Sim.storyAt(), old = document.getElementById('plan-tick');
    if (rfx('stepTick') && old && planAt >= 0 && at === planAt + 1 && on) {
      const was = Sim.storySteps()[planAt];
      planAt = at; planHold = true;
      tickOut(old, was, function () {
        planHold = false; UI.syncPlanTicker();
        const nb = document.getElementById('plan-tick');
        if (nb) { nb.classList.remove('rfx-in'); void nb.offsetWidth; nb.classList.add('rfx-in'); }
      });
      return;
    }
    planAt = at;
    planKey = key;
    let box = document.getElementById('plan-tick');
    if (!on) { if (box) box.remove(); return; }
    if (!box) {
      box = document.createElement('div');
      box.id = 'plan-tick';

      (document.getElementById('left-rail') ||
       document.getElementById('stage') || document.body).appendChild(box);
    }
    box.innerHTML =
      '<span class="pt-act">' + GG.i18n.ins(cur.act.name) + '</span>' +
      '<span class="pt-txt">' + GG.i18n.ins(cur.s.text) + '</span>' +
      (rfx('stepBar') ? '<span class="pt-bar">' + cur.act.steps.map((x, k) =>
        '<i' + (k < cur.si ? ' class="on"' : '') + '></i>').join('') + '</span>' : '') +
      '<button class="pt-x" title="' + GG.i18n.t('ui.planHide') + '">&times;</button>';
    box.querySelector('.pt-x').onclick = function () {
      GG.audio.play('click');
      UI.planClose();
      UI.toast(GG.i18n.t('ui.planHidden'));
    };
    box.onclick = function (e) {
      if (e.target.closest('.pt-x')) return;
      GG.audio.play('click');
      UI.openPanel('plan');
    };
  };

  function statsOn() { return !!(((C.ui || {}).stats) || {}).enabled; }
  function renderStats() {
    const o = (C.ui || {}).stats || {};
    const T = GG.i18n.t;
    el.pnTitle.textContent = T('ui.stats');
    el.pnIc.innerHTML = IC.svg('stats', 22);
    el.pnBank.textContent = ''; delete el.pnBank.dataset.face;
    el.pnNote.classList.remove('hidden');
    el.pnNote.textContent = T('ui.statsNote').replace('%s', o.sampleSec || 10).replace('%m', o.keepMin || 60);
    el.pnBody.innerHTML = '';
    panelKey = panelSig();
    const list = (S.g && S.g.stats) || [];
    if (list.length < 2) {
      el.pnBody.innerHTML = '<div class="pn-empty">' +
        T('ui.statsWait').replace('%s', (o.sampleSec || 10) * (2 - list.length)) + '</div>';
      return;
    }
    [['ci', 1, T('ui.statsCi'), 'var(--ci)', function (v) { return U.fmt(v) + ' ' + T('ui.ciPerH'); }],
     ['money', 2, T('ui.statsMoney'), 'var(--money)', function (v) { return '$' + U.fmt(v) + '/h'; }]]
      .forEach(function (g) {
        const vals = list.map(r => r[g[1]]);
        const now = vals[vals.length - 1];
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const peak = Math.max.apply(null, vals);
        const card = document.createElement('div');
        card.className = 'st-card';
        card.innerHTML =
          '<div class="st-head"><span class="st-name">' + g[2] + '</span>' +
          '<span class="st-nums"><b>' + T('ui.statsNow') + '</b> ' + g[4](now) +
          '<b>' + T('ui.statsAvg') + '</b> ' + g[4](avg) +
          '<b>' + T('ui.statsPeak') + '</b> ' + g[4](peak) + '</span></div>' +
          '<canvas class="st-graph"></canvas>' +
          '<div class="st-axis"><span></span><span></span></div>';
        el.pnBody.appendChild(card);
        const span = list[list.length - 1][0] - list[0][0];
        const ax = card.querySelectorAll('.st-axis span');
        ax[0].textContent = T('ui.statsAgo').replace('%m', Math.max(1, Math.round(span / 60)));
        ax[1].textContent = T('ui.statsNowX');
        drawStat(card.querySelector('canvas'), list, g[1], getComputedStyle(card).getPropertyValue(
          g[1] === 1 ? '--ci' : '--money').trim() || '#62d4e3', o.h || 130);
      });
  }

  function drawStat(cv, list, col, colour, H) {
    const par = cv.parentElement, ps = getComputedStyle(par);
    const W = Math.max(200, (par.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight)) || 480);
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t0 = list[0][0], t1 = list[list.length - 1][0];
    let lo = 0, hi = 0;
    list.forEach(function (r) { lo = Math.min(lo, r[col]); hi = Math.max(hi, r[col]); });
    if (hi - lo < 1e-9) hi = lo + 1;
    const pad = 4;
    const x = function (t) { return pad + (t - t0) / Math.max(1, t1 - t0) * (W - 2 * pad); };
    const y = function (v) { return H - pad - (v - lo) / (hi - lo) * (H - 2 * pad); };

    g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, y(0) + 0.5); g.lineTo(W, y(0) + 0.5); g.stroke();
    g.beginPath(); g.moveTo(0, y(hi) + 0.5); g.lineTo(W, y(hi) + 0.5); g.stroke();
    const gapSec = ((((C.ui || {}).stats) || {}).sampleSec || 10) * 3;

    const runs = [[]];
    list.forEach(function (r, i) {
      if (i && r[0] - list[i - 1][0] > gapSec) runs.push([]);
      runs[runs.length - 1].push(r);
    });
    runs.forEach(function (run) {
      if (!run.length) return;
      g.beginPath();
      run.forEach(function (r, i) { if (i) g.lineTo(x(r[0]), y(r[col])); else g.moveTo(x(r[0]), y(r[col])); });
      g.lineTo(x(run[run.length - 1][0]), y(0)); g.lineTo(x(run[0][0]), y(0)); g.closePath();
      g.globalAlpha = 0.16; g.fillStyle = colour; g.fill(); g.globalAlpha = 1;
      g.beginPath();
      run.forEach(function (r, i) { if (i) g.lineTo(x(r[0]), y(r[col])); else g.moveTo(x(r[0]), y(r[col])); });
      if (run.length === 1) g.lineTo(x(run[0][0]) + 1, y(run[0][col]));
      g.strokeStyle = colour; g.lineWidth = 1.8; g.lineJoin = 'round'; g.stroke();
    });
  }
  UI.openStats = function () {
    if (!statsOn()) return;
    GG.audio.play('click');
    UI.openPanel('stats');
  };

  UI.renderPanel = function () {
    if (!panelKind) return;
    if (panelKind === 'stats') { renderStats(); return; }
    if (panelKind === 'codex') { renderCodex(); return; }
    if (panelKind === 'blueprints') { renderBlueprints(); return; }
    if (panelKind === 'caps') { renderCaps(); return; }
    if (panelKind === 'plan') { renderPlan(); return; }
    const trials = panelKind === 'trials';
    const goals = panelKind === 'goals' || trials;
    el.pnTitle.textContent = GG.i18n.t(trials ? 'ui.trials' : (goals ? 'ui.objectives' : 'ui.boostsCaps'));
    el.pnIc.innerHTML = IC.svg(trials ? 'diamond' : (goals ? 'goals' : 'boost'), 22);
    el.pnNote.innerHTML = UI.gemText(trials
      ? GG.i18n.t('ui.trialsNote') + ' ' + C.goals.hardAt + ' ◆.'
      : goals ? ''
      : GG.i18n.t('ui.boostNote').replace('%t', clock(Sim.boostDur()))
          .replace('%n', C.boostUseStep).replace('%d', C.boostUseSurcharge) +
        (Sim.boostFree() ? '  ' + GG.i18n.t('ui.boostFirstFree') : ''), 12);
    el.pnNote.classList.toggle('hidden', goals && !trials);
    el.pnBody.innerHTML = '';

    const list = goals ? goalOrder(panelKind) : Sim.visibleBoosts();
    panelKey = panelSig();
    el.pnBody.appendChild(goals ? goalTabs() : shopTabs());
    list.forEach(function (o) {
      const row = document.createElement('div');
      row.className = 'pn-row';
      row.dataset.id = o.id;
      row.style.setProperty('--c', goals ? 'var(--muted)' : o.color);
      row.innerHTML =
        '<span class="pr-ic">' + IC.svg(o.icon, 24) + '</span>' +
        '<span class="pr-txt">' +
          '<div class="pr-name">' + o.name +

            (goals && Sim.goalMachine(o)
              ? '<span class="pr-prize">' + IC.svg(Sim.goalMachine(o).icon, 12) +
                Sim.goalMachine(o).name + '</span>' : '') +
          '</div>' +
          '<div class="pr-desc">' + o.desc + '</div>' +
          (goals ? '<div class="pr-bar"><i></i></div>' : '') +
        '</span>' +
        '<span class="pr-side"></span>';

      const side = row.querySelector('.pr-side');
      if (goals) {
        side.innerHTML = '<span class="pn-reward">+' + UI.gemText(o.reward + ' ◆') + '</span>';
        const btn = document.createElement('button');
        btn.className = 'pn-buy pn-claim';
        btn.onclick = function () {
          const at = rfx('claimBurst') ? pageBox(btn) : null;
          const res = Sim.claimGoal(o.id);
          if (res.ok) {
            GG.audio.play('claim');
            const won = Sim.goalMachine(o);
            if (UI.trialFxOn() && isTrial(o)) { trialQueue.push(o); UI.renderPanel(); return; }
            if (at) UI.claimFx(o, at);
            if (won || (!at && !UI.quiet('claimed')))
              UI.toast('Claimed ' + res.name + ' — +' + res.reward + ' ◆' +
                       (won ? ' ' + GG.i18n.t('ui.andA') + ' ' + won.name : ''));
          }
          else { GG.audio.play('deny'); UI.toast(res.why, true); }
          UI.renderPanel();
        };
        side.appendChild(btn);
        const st = document.createElement('span');
        st.className = 'pn-state';
        side.appendChild(st);
      } else {
        const btn = document.createElement('button');
        btn.className = 'pn-buy';
        btn.onclick = function () {

          const res = savedBadge() && Sim.boostStock(o.id) > 0 ? Sim.useStock(o.id) : Sim.buyBoost(o.id);
          if (res.ok) {
            GG.audio.play('boost');
            if (!UI.quiet('boostOn')) UI.toast(res.instant ? res.boost.name + ' — the sun is back up'
                                 : res.boost.name + ' running — ' + clock(Sim.boostDur()));
          } else { GG.audio.play('deny'); UI.toast(res.why, true); }
          UI.renderPanel();
        };
        side.appendChild(btn);

        const pr = document.createElement('button');
        pr.className = 'pn-buy pn-printed';
        pr.style.display = 'none';
        pr.onclick = function () {
          const res = Sim.useStock(o.id);
          if (res.ok) {
            GG.audio.play('boost');
            if (!UI.quiet('boostOn')) UI.toast(res.instant ? res.boost.name + ' — the sun is back up'
                                 : res.boost.name + ' running — ' + clock(Sim.boostDur()));
          } else { GG.audio.play('deny'); UI.toast(res.why, true); }
          UI.renderPanel();
        };
        side.appendChild(pr);
        const t = document.createElement('span');
        t.className = 'pn-timer';
        side.appendChild(t);
      }
      el.pnBody.appendChild(row);
    });
    UI.syncPanel();
  };

  function renderCaps() {
    const list = Sim.visibleCaps();
    el.pnTitle.textContent = GG.i18n.t('ui.capacity');
    el.pnIc.innerHTML = IC.svg('plus', 22);

    const wantNote = (C.ui || {}).capsNote === true;
    el.pnNote.textContent = wantNote
      ? GG.i18n.t('ui.capsNote')
          .replace('%n', C.capShop.perLevel).replace('%c', C.capShop.costs.join(' / '))
      : '';
    el.pnNote.classList.toggle('hidden', !wantNote);
    el.pnBody.innerHTML = '';
    panelKey = panelSig();
    el.pnBody.appendChild(shopTabs());

    if (!list.length) {
      el.pnBody.insertAdjacentHTML('beforeend',
        '<div class="pn-empty">' + GG.i18n.t('ui.capsEmpty') + '</div>');
      return;
    }

    let secs = [{ cat: null, ids: list }];
    if ((C.ui || {}).capsByCategory !== false) {
      secs = [];
      C.categories.forEach(function (cat) {
        const ids = list.filter(k => C.nodeTypes[k].category === cat.id);
        if (ids.length) secs.push({ cat: cat, ids: ids });
      });

      const seen = {};
      secs.forEach(sc => sc.ids.forEach(k => { seen[k] = 1; }));
      const rest = list.filter(k => !seen[k]);
      if (rest.length) secs.push({ cat: null, ids: rest });
    }

    secs.forEach(function (sc) {
      if (sc.cat && secs.length > 1) {
        const h = document.createElement('div');
        h.className = 'pn-sec';
        h.style.setProperty('--c', sc.cat.color);
        h.innerHTML = '<span>' + sc.cat.name + '</span>' +
                      (sc.cat.sub ? '<i>' + GG.i18n.ins(sc.cat.sub) + '</i>' : '');
        el.pnBody.appendChild(h);
      }
      sc.ids.forEach(capRow);
    });
    UI.syncPanel();

    function capRow(k) {
      const t = C.nodeTypes[k];
      const row = document.createElement('div');
      row.className = 'pn-row';
      row.dataset.id = k;
      row.style.setProperty('--c', t.color);
      row.innerHTML =
        '<span class="pr-ic" style="color:' + C.iconColor(t) + '">' + IC.svg(t.icon, 24) + '</span>' +
        '<span class="pr-txt">' +
          '<div class="pr-name">' + t.name + '</div>' +
          '<div class="pr-desc">' + C.descOf(t) + '</div>' +
          '<div class="pr-bar"><i></i></div>' +
        '</span>' +
        '<span class="pr-side"></span>';
      const side = row.querySelector('.pr-side');
      const btn = document.createElement('button');
      btn.className = 'pn-buy';
      btn.onclick = function () {
        const res = Sim.buyCap(k);
        if (res.ok) {
          GG.audio.play('skill');
          if (!UI.quiet('capBought')) UI.toast(res.name + ': you may now build ' + res.cap);
          UI.refreshPalette();
        } else { GG.audio.play('deny'); UI.toast(res.why, true); }
        UI.renderPanel();
      };
      side.appendChild(btn);
      const st = document.createElement('span');
      st.className = 'pn-state';
      side.appendChild(st);
      el.pnBody.appendChild(row);
    }
  }

  function renderBlueprints() {
    const list = S.blueprints();
    el.pnTitle.textContent = 'BLUEPRINTS';
    el.pnIc.innerHTML = IC.svg('merge', 22);
    el.pnNote.classList.remove('hidden');
    el.pnNote.textContent = 'Shift-click machines on the map to select a group, then save it ' +
      'from the panel on the right. Stamping one down costs the same as building every part ' +
      'of it, and it wires itself up.';
    el.pnBody.innerHTML = '';
    panelKey = panelSig();

    if (!list.length) {
      el.pnBody.innerHTML = '<div class="pn-empty">No blueprints yet. Shift-click two or more ' +
        'machines on the map and the panel on the right will offer to save them.</div>';
      return;
    }

    list.forEach(function (bp) {
      const bill = S.blueprintCost(bp);
      const cost = Object.keys(bill).map(c => U.cur(c, bill[c])).join(' + ') || 'free';
      const kinds = {};
      bp.nodes.forEach(it => { kinds[it.type] = (kinds[it.type] || 0) + 1; });
      const parts = Object.keys(kinds)
        .map(k => (kinds[k] > 1 ? kinds[k] + '× ' : '') + C.nodeTypes[k].name).join(', ');
      const locked = bp.nodes.filter(it => !S.isUnlocked(it.type))
        .map(it => C.nodeTypes[it.type].name);

      const BM = C.ui.blueprintMain || {};
      const main = BM.enabled ? C.nodeTypes[S.blueprintMain(bp)] : null;
      const row = document.createElement('div');
      row.className = 'pn-row';
      row.dataset.id = bp.id;
      row.style.setProperty('--c', main ? main.color : 'var(--gold)');
      row.innerHTML =
        '<span class="pr-ic">' + IC.svg(main ? main.icon : 'merge', 24) + '</span>' +
        '<span class="pr-txt">' +
          '<div class="pr-name">' + esc(bp.name) + '</div>' +
          '<div class="pr-desc">' + esc(parts) + ' &middot; ' + bp.links.length +
            (bp.links.length === 1 ? ' wire' : ' wires') +
            (locked.length ? ' &middot; <b>locked: ' + esc(locked.join(', ')) + '</b>' : '') +
          '</div>' +
        '</span>' +
        '<span class="pr-side">' +
          '<span class="pn-reward">' + cost + '</span>' +
          '<button class="pn-buy bp-place">PLACE</button>' +
          '<button class="pn-drop" title="Delete this blueprint">&times;</button>' +
        '</span>';

      row.querySelector('.bp-place').disabled = locked.length > 0;
      row.querySelector('.bp-place').onclick = function () {
        GG.audio.play('click');
        UI.closePanel();
        GG.input.startBlueprint(bp.id);
      };

      if (BM.enabled && BM.rename) {
        const nm = row.querySelector('.pr-name');
        nm.title = GG.i18n.t('ui.bpRename'); nm.style.cursor = 'text';
        nm.onclick = function () {
          const box = document.createElement('input');
          box.className = 'bp-name'; box.type = 'text'; box.maxLength = 28; box.value = bp.name;
          nm.replaceWith(box); box.focus(); box.select();
          let gone = false;
          const done = function (keep) {
            if (gone) return; gone = true;
            const v = box.value.trim();
            if (keep && v) bp.name = v;
            UI.renderPanel();
          };
          box.onblur = function () { done(true); };
          box.onkeydown = function (e) {
            if (e.key === 'Enter') { e.preventDefault(); done(true); }
            else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false); }
          };
        };
      }
      row.querySelector('.pn-drop').onclick = function () {
        S.removeBlueprint(bp.id);
        GG.audio.play('unwire');
        if (!UI.quiet('bpDeleted')) UI.toast('Blueprint deleted');
        UI.syncLaunchers();
        UI.renderPanel();
      };
      el.pnBody.appendChild(row);
    });
    bpAfford();
  }

  function bpAfford() {
    const BM = C.ui.blueprintMain || {};
    el.pnBody.querySelectorAll('.pn-row[data-id]').forEach(function (row) {
      const bp = S.blueprintById(row.dataset.id), place = row.querySelector('.bp-place');
      if (!bp || !place) return;
      const locked = bp.nodes.some(it => !S.isUnlocked(it.type));
      let miss = null;
      if (BM.enabled && BM.afford) {
        const bill = S.blueprintCost(bp), out = [];
        Object.keys(bill).forEach(function (c) {
          const have = S.bank(c);
          if (!U.canAfford(have, bill[c])) out.push(U.cur(c, bill[c] - have));
        });
        miss = out.length ? out.join(' + ') : null;
      }
      place.disabled = locked || !!miss;
      place.classList.toggle('bp-short', !!miss);
      let note = row.querySelector('.bp-need');
      if (miss) {
        if (!note) { note = document.createElement('div'); note.className = 'bp-need'; row.querySelector('.pn-reward').after(note); }
        const txt = GG.i18n.t('ui.bpNeed').replace('%s', miss);
        if (note.textContent !== txt) note.textContent = txt;
      } else if (note) note.remove();
    });
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  UI.tryMachine = function (typeId) {
    if (!GG.practice || !GG.practice.canPractise || !GG.practice.canPractise(typeId)) return;
    GG.audio.play('click');
    const r = GG.practice.enter(typeId);
    if (r && r.ok) { UI.closePanel(); return; }
    GG.audio.play('deny');
    UI.toast((r && r.why) || 'Could not open the practice room', true);
  };

  UI.syncLaunchers = function () {
    const b = document.getElementById('bp-launch');
    if (!b) return;
    const n = S.blueprints().length;
    b.classList.toggle('hidden', n === 0);
    const badge = b.querySelector('.tl-badge');
    if (badge) badge.textContent = n;
    fitLaunchMatch();
  };

  UI.gemIc = function (size) {
    const f = C.ui.gemIcon || {};
    if (!f.enabled) return '◆';
    return '<span class="gem-ic">' + IC.svg('diamond', size || f.size || 13) + '</span>';
  };
  UI.gemText = function (s, size) {
    s = String(s);
    return (C.ui.gemIcon || {}).enabled ? s.replace(/ ?◆/g, ' ' + UI.gemIc(size)) : s;
  };

  const SIGN_IC = { '◆': 'diamond', '✦': 'prism' };
  UI.signIcons = function (node, text, size) {
    const f = C.ui.gemIcon || {};
    if (!f.enabled || !f.pops || !/[◆✦]/.test(text)) return false;
    const esc = String(text).replace(/(\d)\.00(?= ?✦)/g, '$1').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
    node.innerHTML = esc.replace(/ ?([◆✦])/g, (m, g) => {
      const col = (C.currencies[SIGN_IC[g]] || {}).color || '#ff5c8a';
      return ' <span class="sign-ic" style="color:' + col + '">' + IC.svg(SIGN_IC[g], size || 16, col) + '</span>';
    });
    return true;
  };
  function setFace(node, html) {
    if (node.dataset.face === html) return;
    node.dataset.face = html;
    node.innerHTML = html;
  }

  UI.syncPanel = function () {
    if (!panelKind) return;

    if (panelKind === 'codex') return;
    if (panelKind === 'plan') { if (panelKey !== panelSig()) UI.renderPanel(); return; }
    if (panelKind === 'stats') { if (panelKey !== panelSig()) UI.renderPanel(); return; }
    if (panelSig() !== panelKey) { UI.renderPanel(); return; }
    if (panelKind === 'blueprints') { bpAfford(); return; }
    setFace(el.pnBank, UI.gemText(U.fmt(S.bank('diamond')) + ' ◆'));

    if (panelKind === 'caps') {
      el.pnBody.querySelectorAll('.pn-row').forEach(function (row) {
        const k = row.dataset.id;
        const cap = S.buildCap(k), built = S.builtOf(k), price = Sim.capCost(k);
        const maxed = Sim.capMaxed(k);
        row.classList.toggle('done', maxed);
        row.classList.toggle('on', S.capFull(k));
        row.querySelector('.pr-bar i').style.width = Math.min(1, built / cap) * 100 + '%';
        row.querySelector('.pn-state').textContent = built + ' / ' + cap + ' ' + GG.i18n.t('ui.built');
        const btn = row.querySelector('.pn-buy');
        setFace(btn, maxed ? GG.i18n.t('ui.max') : UI.gemText('+' + C.capShop.perLevel + '  ' + price + ' ◆'));
        btn.disabled = maxed || !U.canAfford(S.bank('diamond'), price);
      });
      return;
    }

    const goals = panelKind === 'goals' || panelKind === 'trials';
    el.pnBody.querySelectorAll('.pn-row').forEach(function (row) {
      const id = row.dataset.id;
      if (goals) {
        const o = C.objectives.find(x => x.id === id);
        const paid = Sim.goalPaid(o), ready = Sim.goalReady(o);
        row.classList.toggle('done', paid);
        row.classList.toggle('on', ready);
        row.style.setProperty('--c', paid ? 'var(--trash)' : (ready ? 'var(--gem)' : 'var(--muted)'));
        row.querySelector('.pr-bar i').style.width = (Sim.goalProgress(o) * 100) + '%';
        const btn = row.querySelector('.pn-claim');
        setFace(btn, UI.gemText((paid ? GG.i18n.t('ui.claimed') : GG.i18n.t('ui.claim')) + '  +' + o.reward + ' ◆'));
        btn.disabled = !ready;
        row.querySelector('.pn-state').textContent =
          paid ? '' : (ready ? 'ready' : Math.round(Sim.goalProgress(o) * 100) + '%');
      } else {
        const b = Sim.boostById(id);
        const left = Sim.boostLeft(id);
        const on = left > 0;
        row.classList.toggle('on', on);
        const btn = row.querySelector('.pn-buy');
        const night = b.nightOnly && Sim.solarPhase().on;
        const price = Sim.boostCost(b);

        const tag = price > 0 ? price + ' ◆' : GG.i18n.t('ui.free');

        setFace(btn, UI.gemText(GG.i18n.t(b.instant ? 'ui.boostUse'
                                    : (on ? 'ui.boostRestart' : 'ui.boostGo')) + '  ' + tag));
        btn.disabled = !U.canAfford(S.bank('diamond'), price) || night;
        const pr = row.querySelector('.pn-printed'), have = Sim.boostStock(b.id);

        const ic = row.querySelector('.pr-ic');
        let badge = ic && ic.querySelector('.pr-saved');
        if (savedBadge() && have > 0) {
          if (!badge) { badge = document.createElement('i'); badge.className = 'pr-saved'; ic.appendChild(badge); }
          badge.textContent = have;
          setFace(btn, GG.i18n.t(b.instant ? 'ui.boostUse' : (on ? 'ui.boostRestart' : 'ui.boostGo')) + '  ' + GG.i18n.t('ui.saved'));
          btn.disabled = night;
        } else if (badge) badge.remove();
        if (pr) {
          pr.style.display = have > 0 && !savedBadge() ? '' : 'none';
          pr.textContent = GG.i18n.t('ui.usePrinted').replace('%n', have);
          pr.disabled = night;
        }
        const used = Sim.boostUses(b.id);
        row.querySelector('.pn-timer').textContent =
          b.instant ? (night ? GG.i18n.t('ui.sunIsUp') : GG.i18n.t('ui.instant'))
                    : (on ? GG.i18n.t('ui.boostLeft').replace('%t', clock(left))
                          : (used ? GG.i18n.t('ui.boostUsed').replace('%n', used) : ''));
      }
    });
  };

  function locName(id) {
    const L = S.locationById(id || (C.locations[0] || {}).id);
    return L ? L.name : '';
  }

  const PRACTICE_SOUND = { agencyHire: 'hire', recruit: 'hire', gemCaught: 'gemTake',
    rocketBuilt: 'build', rocketHome: 'build', array: 'build', gemMade: 'claim', prismMade: 'claim',
    printed: 'claim', powerUp: 'boost', fed: 'skill', strikeCharge: 'skill',
    rockCall: 'rockCall', gem: 'gemDrop' };
  function practiceEvents() {
    const on = (C.practice || {}).sounds !== false;
    while (on && Sim.events.length) {
      const e = Sim.events.shift();
      if (e.loc && e.loc !== S.g.loc) continue;
      if (e.kind === 'rock') {
        GG.render.rockFall(e.site);
        if (!(e.pulled && C.asteroid.pullOneWhistle)) GG.audio.play('rockFall');
        setTimeout(function () { GG.audio.play('rockHit'); },
                   ((C.asteroid || {}).hitDelaySec || 1.4) * 1000);
      } else if (e.kind === 'wx') {
        UI.syncWeatherSound();
      } else if (e.kind === 'wxEnd') {
        GG.audio.ambienceStop();
        if (e.endSound) GG.audio.ambience(e.endSound);
      } else if (e.kind === 'rocketHome' && GG.render.rocketHeard(e.id && S.node(e.id), 'land')) {

      } else if (PRACTICE_SOUND[e.kind]) GG.audio.play(PRACTICE_SOUND[e.kind]);
    }
    Sim.events.length = 0;
  }

  function drainEvents() {

    if (GG.practice && GG.practice.active) { practiceEvents(); return; }
    while (Sim.events.length) {
      const e = Sim.events.shift();
      if (e.kind === 'goal') {
        const tob = UI.trialFxOn() && C.objectives.find(o => o.id === e.id);

        if (tob && tob.reward >= C.goals.hardAt) { GG.audio.play(C.audio.sounds.trial ? 'trial' : 'skill'); UI.trialDone(tob); continue; }
        GG.audio.play('goal');
        const rob = rfx('readyPill') && C.objectives.find(o => o.id === e.id);
        if (rob) UI.readyPill(rob);
        else if (!UI.quiet('goalReady')) UI.toast('Objective ready to claim: ' + e.name + '  +' + e.reward + ' ◆');
      } else if (e.kind === 'story') {

        if (!UI.quiet('planStep') && !(rfx('stepTick') && document.getElementById('plan-tick')))
          UI.toast(GG.i18n.t('ui.planStep') + ' ' + GG.i18n.ins(e.text));
      } else if (e.kind === 'storyAct') {
        GG.audio.play('skill');
        let pay = e.money ? U.cur('money', e.money) : '';
        if (e.gem) pay += (pay ? ' + ' : '') + e.gem + ' ◆';

        UI.actCard(e, pay);
        if (!UI.quiet('planAct')) UI.toast((e.done ? GG.i18n.t('ui.planAllDone') : GG.i18n.t('ui.planAct')) + ' ' +
                 GG.i18n.ins(e.name) + (pay ? '  +' + pay : ''));
      } else if (e.kind === 'boostEnd') {
        GG.audio.play('boostOff');
        if (!UI.quiet('boostEnd')) UI.toast(e.name + ' has worn off', true);
      } else if (e.kind === 'gem') {

        if (!(GG.halloween && GG.halloween.owlDeliver())) GG.audio.play('gemDrop');
        UI.toast('A diamond appeared on the map');
      } else if (e.kind === 'skillReady') {

        const sk = Sim.skillById(e.id);
        if (sk) {
          GG.audio.play('goal');
          if (!UI.quiet('skillReady')) UI.toast('Within reach: ' + sk.name + ' — ' + U.fmt(Sim.nextCost(sk)) + ' ' +
                   C.currencies[sk.currency || 'ci'].short);
        }
      } else if (e.kind === 'placeOpened') {

        GG.audio.play('goal');
        if (!UI.placeBanner(e.name)) UI.toast(e.name + ' is open. There is nothing left to strip here.');
        UI.refreshPalette();
        UI.buildPlaces();
        if (activeTree === 'ci' &&!document.getElementById('skilltree').classList.contains('hidden')) {
          UI.buildTree();
        }
      } else if (e.kind === 'rockCall') {

        if (e.loc === S.g.loc) GG.audio.play('rockCall');
      } else if (e.kind === 'rockMiss') {

        if (e.loc === S.g.loc) UI.toast('The meteorite found nowhere to land. Charge returned', true);
      } else if (e.kind === 'rock') {

        GG.render.rockFall(e.site);
        if (C.asteroid.notice && UI.wxTold(e.loc)) {
          if (!(e.pulled && C.asteroid.pullOneWhistle)) GG.audio.play('rockFall');

          setTimeout(function () { GG.audio.play('rockHit'); },
                     ((C.asteroid || {}).hitDelaySec || 1.4) * 1000);
          UI.toast(GG.i18n.msg(e.pluto ? 'A plutonium rock came down in %s'
                                       : 'A meteorite came down in %s').replace('%s', e.name || e.loc));
        }
        UI.refreshPalette();
      } else if (e.kind === 'rockDug') {
        GG.audio.play('burn');
        if (e.x !== undefined && e.loc === S.g.loc) GG.render.eventFx('dug', { x: e.x, y: e.y, loc: e.loc });
        UI.toast('The meteorite is dug out');
        UI.refreshPalette();
      } else if (e.kind === 'siteEmpty') {

        GG.audio.play('burn');
        const es = e.id !== undefined && S.node(e.id);
        if (es && e.loc === S.g.loc) GG.render.eventFx('strip', es);
        if (!UI.quiet('siteEmpty', e.loc)) UI.toast('A Trash Site is stripped bare — nothing left in it');
        UI.refreshPalette();
      } else if (e.kind === 'siteGone') {
        GG.audio.play('demolish');
        UI.toast('A Trash Site is stripped bare and gone' +
          (e.machines ? ' — ' + e.machines + ' machine' + (e.machines === 1 ? '' : 's') +
                        ' went with it' : ''), true);
        UI.refreshPalette();
      } else if (e.kind === 'recruit') {
        GG.audio.play('hire');
        if (e.id && S.node(e.id)) GG.render.eventFx('recruit', S.node(e.id));
        if (!UI.quiet('recruit')) UI.toast('Someone joined the cause — ' + e.total +
                 (e.total === 1 ? ' recruit' : ' recruits'));
      } else if (e.kind === 'agencyHire') {

        const ag = e.id && S.node(e.id);
        const hush = ag && ag.agQuiet && (C.ui || {}).agencySoundSwitch !== false;
        if (e.loc === S.g.loc && !hush) GG.audio.play('hire');
      } else if (e.kind === 'gemCaught') {

        GG.audio.play('gemTake');
      } else if (e.kind === 'kitCut') {

        UI.toast(e.power && e.kit !== false
          ? (e.kit ? 'A robot has every Solar Kit now, so its kit and power wires were removed'
                   : 'A robot has every Solar Kit now, so its power wire was removed')
          : 'A robot has every Solar Kit now, so its kit wire was removed');
      } else if (e.kind === 'rocketBuilt') {

        GG.audio.play('build');
        if (e.id && S.node(e.id)) GG.render.eventFx('rocket', S.node(e.id));
        UI.toast('The Skytrawler is built, now it needs turbofuel and crew');
      } else if (e.kind === 'autoRun') {

        const an = S.node(e.id);
        if (an && e.loc === S.g.loc) {
          if (e.what !== 'launch' || !GG.render.rocketHeard(an, 'launch')) GG.audio.play('boost');
          if (GG.render.startFx) GG.render.startFx(an, e.what, e.fuel);
        }
      } else if (e.kind === 'rocketHome') {

        if (!GG.render.rocketHeard(e.id && S.node(e.id), 'land')) GG.audio.play('build');
        if (e.held) {
          if (e.lost > 0 && !e.gems) UI.toast('A Skytrawler is back, but its hold is full', true);
          else UI.toast('A Skytrawler is back with ' + e.gems + ' diamonds');
        } else if (e.gems) {
          UI.toast('A Skytrawler is back with ' + e.gems + ' diamonds');
          const rn = e.id && S.node(e.id);
          if (rn && rn.loc === S.g.loc && UI.collectFly && GG.render.toScreen) {
            const p = GG.render.toScreen(rn.x, rn.y), cv = document.getElementById('board').getBoundingClientRect();
            const z = GG.render.uiZoom ? GG.render.uiZoom() : 1;
            UI.collectFly('diamond', cv.left / z + p.x, cv.top / z + p.y, e.gems);
          }
        } else UI.toast('A Skytrawler is back with ' + Math.round(e.kg) + ' kg of metal');
      } else if (e.kind === 'array') {
        GG.audio.play('build');
        if (e.id && S.node(e.id)) GG.render.eventFx('array', S.node(e.id));

        const at = C.nodeTypes[e.type] || {}, ar = at.recipe || {};
        const an = at.name || 'Grid Foundry';

        if (!UI.quiet('array')) UI.toast(ar.ci
          ? 'A ' + an + ' is finished, ' + e.total + ' now standing'
          : ar.crew
          ? 'A ' + an + ' laid a stretch — ' + e.total +
            (ar.maxMade ? ' / ' + ar.maxMade : '')
          : 'A ' + an + ' raised an array — ' + e.total + ' now standing');
      } else if (e.kind === 'gemMade') {

        GG.audio.play('claim');

        const gt = C.nodeTypes[e.type] || {}, gn = 'A ' + (gt.name || 'Diamond Press');
        UI.toast(e.n === 1 ? gn + ' cut a diamond — press COLLECT'
                           : gn + ' cut ' + e.n + ' diamonds — press COLLECT');
      } else if (e.kind === 'prismMade') {

        GG.audio.play('claim');
        const pt = C.nodeTypes[e.type] || {}, pn = 'A ' + (pt.name || 'Prism Press');
        UI.toast(e.n === 1 ? pn + ' made a Prism. Press COLLECT.' : pn + ' made ' + e.n + ' Prisms. Press COLLECT.');
      } else if (e.kind === 'printed') {

        GG.audio.play('claim');
        const pt = C.nodeTypes[e.type] || {}, pn = pt.name || 'Print Works';
        if (e.boost) {
          const pb = Sim.boostById(e.boost);
          UI.toast(pn + ' printed ' + ((pb && pb.name) || e.boost) +
                   (e.stocked ? ', it waits in Boosts' : ''));
        } else {
          UI.toast(e.n === 1 ? pn + ' printed a diamond'
                             : pn + ' printed ' + e.n + ' diamonds');
        }
      } else if (e.kind === 'powerUp') {

        GG.audio.play('boost');
      } else if (e.kind === 'fed') {
        GG.audio.play('skill');

        const ft = C.nodeTypes[e.type] || {};
        if (!UI.quiet('fed')) UI.toast('A ' + (ft.name || 'Tree Planter') + ' took its fertilizer — it now grows ×' +
                 U.fmt(e.mul, 2));
      } else if (e.kind === 'hireEnd') {
        UI.toast(e.n === 1 ? 'A hired hand went home' : e.n + ' hired hands went home', true);
      } else if (e.kind === 'groundGem') {
        GG.render.groundGemRise(e.spot);
      } else if (e.kind === 'banknote') {
        if (e.loc === S.g.loc) GG.render.noteDrop(e.delay);
      } else if (e.kind === 'coreAlarm') {

        if (e.on) coreAlarms[e.id] = true; else delete coreAlarms[e.id];
        GG.audio.loop('coreAlarm', Object.keys(coreAlarms).length > 0);
      } else if (e.kind === 'meltdown') {
        delete coreAlarms[e.id];
        if (!Object.keys(coreAlarms).length) GG.audio.loop('coreAlarm', false);
        const mn = S.node(e.id);
        if (mn && S.here(mn)) GG.audio.play('coreBreak');
      } else if (e.kind === 'secondWind') {

        const hp = e.id && S.node(e.id);
        if (hp && S.here(hp) && GG.render.eventFx('recruit', hp, e.n)) GG.audio.play('hire');
      } else if (e.kind === 'forecast') {

        if (mastTold(e.loc)) {
          GG.audio.play('forecast');
          UI.toast(e.name + ' incoming over ' + locName(e.loc) + ' — ' + e.sec + 's');
        }
      } else if (e.kind === 'revive') {

        GG.audio.play('skill');

        if (!UI.quiet('revive')) UI.toast(e.name + ' — coming back, stage ' + e.stage + ' of ' + e.of);
      } else if (e.kind === 'wx') {

        UI.syncWeatherSound();

        if (UI.wxTold(e.loc) && !UI.quiet('wx', e.loc)) UI.toast(C.weather.shortNotice !== false
          ? e.name + ' over ' + locName(e.loc)
          : e.name + ' over ' + locName(e.loc) + ' — ' + e.desc);
      } else if (e.kind === 'wxBlocked') {

        if (UI.wxTold(e.loc)) {
          GG.audio.play('skill');
          UI.toast('Your Surge Arrestors caught it. The grid is untouched');
        }
      } else if (e.kind === 'strikeCharge') {

        if (UI.wxTold(e.loc)) {
          GG.audio.play('skill');
          UI.toast('The Strike Vault took the bolt: %c KW banked'
                   .replace('%c', GG.util.small(e.kw)));
        }
      } else if (e.kind === 'wxEnd') {

        if (!e.loc || S.g.loc === e.loc) {
          GG.audio.ambienceStop();

          if (e.endSound) GG.audio.ambience(e.endSound);
        }
        if (UI.wxTold(e.loc) && !UI.quiet('wxEnd'))
          UI.toast('The ' + e.name.toLowerCase() + ' has passed over ' + locName(e.loc), true);

      } else if (e.kind === 'gridDown') {
        if (UI.wxTold(e.loc) && Sim.gridMatters(e.loc))
          UI.toast('The grid in ' + locName(e.loc) + ' is down — go there and restart it', true);
      } else if (e.kind === 'gridUp') {
        if (UI.wxTold(e.loc) && Sim.gridMatters(e.loc)) {
          GG.audio.play('skill');
          if (!UI.quiet('gridUp')) UI.toast('The grid in ' + locName(e.loc) + ' is back up');
        }
      }
    }
  }

  UI.showTree = function (id) {
    activeTree = id;
    document.querySelectorAll('.tree-tab').forEach(x =>
      x.classList.toggle('active', x.dataset.tree === id));

    if (el.tree) el.tree.classList.toggle('summary-tab',
      id === 'summary' && ((C.ui || {}).treeZoomHideOnSummary !== false));

    if (el.tree) el.tree.classList.toggle('no-zoom-btns', (C.ui || {}).treeZoomButtons === false);
    treePan.x = 0; treePan.y = 0; treePan.z = treeStartZoom(); applyTreePan();

    UI.buildTree({ centre: true });
  };

  UI.openTree = function (id) {
    treeOpen = true;
    el.tree.classList.remove('hidden', 'opening');
    void el.tree.offsetWidth;
    el.tree.classList.add('opening');
    setTimeout(() => el.tree.classList.remove('opening'), 400);
    UI.showTree(id);
    fitTreeHead();
  };

  function treeCard() {

    const TS = C.ui && C.ui.treeNoteStrip, strip = !!(TS && TS.enabled);
    const head = el.tree.querySelector('.tree-head'), scroll = el.tree.querySelector('.tree-scroll');
    if (strip && head && el.treeNote.previousElementSibling !== head) head.after(el.treeNote);
    if (!strip && scroll && el.treeNote.parentElement !== scroll) scroll.appendChild(el.treeNote);
    el.treeNote.classList.toggle('tree-strip', strip);
    const old = strip && ((S.g && S.g.playtime) || 0) >= (TS.hideAfterMin || 0) * 60;
    const on = !strip && !!(C.ui && C.ui.treeNoteCard) && (activeTree === 'ci' || activeTree === 'money');
    el.treeNote.classList.toggle('hidden', old || (!strip && !!(C.ui && C.ui.treeNoteCard)) ||
      (strip && activeTree !== 'ci' && activeTree !== 'money'));
    let card = document.getElementById('tree-card');
    const seen = (S.g && S.g.treeNoteSeen) || {};
    if (!on || seen[activeTree]) { if (card) card.remove(); return; }
    if (!card) {
      card = document.createElement('div');
      card.id = 'tree-card';
      card.innerHTML = '<div class="tc-head"><b class="tc-title"></b></div><div class="tc-text"></div>' +
        '<div class="tc-foot"><button class="tc-next" type="button"></button></div>';
      el.tree.appendChild(card);
      card.querySelector('.tc-next').onclick = function () {
        const id = card.dataset.tree;
        S.g.treeNoteSeen = S.g.treeNoteSeen || {};
        S.g.treeNoteSeen[id] = true;
        card.remove();
      };
    }
    card.dataset.tree = activeTree;
    card.querySelector('.tc-title').textContent = GG.i18n.t(activeTree === 'money' ? 'ui.moneySkills' : 'ui.ciSkills');
    card.querySelector('.tc-text').textContent = el.treeNote.textContent;
    card.querySelector('.tc-next').textContent = GG.i18n.t('tut.gotIt');
  }

  UI.toggleSkillTree = function () {
    if (treeOpen) {
      treeOpen = false; el.tree.classList.add('hidden');

      UI.flushLevelPulse();
    }
    else UI.openTree(activeTree);
  };
  UI.closeOverlays = function () {
    if (treeOpen) UI.toggleSkillTree();
    if (panelKind) UI.closePanel();
    if (GG.devinfo && GG.devinfo.isOpen()) GG.devinfo.close();
    UI.closeFullCircle();
  };

  UI.overlayOpen = function () {
    return treeOpen || !!panelKind || !!(GG.devinfo && GG.devinfo.isOpen()) ||
           UI.fullCircleOpen() || UI.keepAskOpen();
  };

  const HEX_W = 130, HEX_H = 146;

  function allOfTree() { return C.skills.filter(s => (s.tree || 'ci') === activeTree); }

  function hexEdge(cx, cy, dx, dy) {
    const hw = HEX_W / 2, hh = HEX_H / 2;

    const pts = [[0, -hh], [hw, -hh / 2], [hw, hh / 2], [0, hh], [-hw, hh / 2], [-hw, -hh / 2]];

    let best = Infinity;
    for (let i = 0; i < 6; i++) {
      const a = pts[i], b = pts[(i + 1) % 6];

      let nx = b[1] - a[1], ny = -(b[0] - a[0]);
      let c = nx * a[0] + ny * a[1];
      if (c < 0) { nx = -nx; ny = -ny; c = -c; }
      const den = nx * dx + ny * dy;
      if (den <= 1e-9) continue;
      best = Math.min(best, c / den);
    }
    if (!isFinite(best)) best = 0;
    return [cx + dx * best, cy + dy * best];
  }

  function inHex(px, py, cx, cy) {
    const hw = HEX_W / 2, hh = HEX_H / 2;
    const V = [[0, -hh], [hw, -hh / 2], [hw, hh / 2], [0, hh], [-hw, hh / 2], [-hw, -hh / 2]];
    const x = px - cx, y = py - cy;
    let inside = false;
    for (let i = 0, j = 5; i < 6; j = i++) {
      const xi = V[i][0], yi = V[i][1], xj = V[j][0], yj = V[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function treeEdge(p, s, others) {
    const GAP = 5;
    const x0 = p.x + HEX_W / 2, y0 = p.y + HEX_H / 2;
    const x1 = s.x + HEX_W / 2, y1 = s.y + HEX_H / 2;
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;

    const F = ((C.ui || {}).treeFlow || {})[activeTree];
    const vert = F ? !(Math.abs(Math.abs(dx) - F.dx) < 1) && Math.abs(Math.abs(dy) - F.dy) < 1
                   : Math.abs(dy) >= Math.abs(dx);

    const tx = F ? (vert ? 0 : Math.sign(dx) || 1) : ux;
    const ty = F ? (vert ? Math.sign(dy) || 1 : 0) : uy;
    const a = hexEdge(x0, y0, tx, ty);
    const b = hexEdge(x1, y1, -tx, -ty);
    const ax = a[0] + tx * GAP, ay = a[1] + ty * GAP;
    const bx = b[0] - tx * GAP, by = b[1] - ty * GAP;
    const k = Math.min(110, Math.max(28, (vert ? Math.abs(by - ay) : Math.abs(bx - ax)) * 0.42));

    const lo = { x: Math.min(ax, bx) - HEX_W, y: Math.min(ay, by) - HEX_H };
    const hi = { x: Math.max(ax, bx) + HEX_W, y: Math.max(ay, by) + HEX_H };
    const near = [];
    for (const o of others) {
      if (o.id === p.id || o.id === s.id) continue;
      const cx = o.x + HEX_W / 2, cy = o.y + HEX_H / 2;
      if (cx >= lo.x && cx <= hi.x && cy >= lo.y && cy <= hi.y) near.push([cx, cy]);
    }

    const perp = [-uy, ux];
    let best = null;

    const BOWS = F ? [0] : [0, 34, -34, 62, -62, 92, -92, 126, -126, 165, -165, 210, -210];
    for (const bow of BOWS) {
      const c1 = vert ? [ax, ay + Math.sign(dy || 1) * k] : [ax + Math.sign(dx || 1) * k, ay];
      const c2 = vert ? [bx, by - Math.sign(dy || 1) * k] : [bx - Math.sign(dx || 1) * k, by];
      c1[0] += perp[0] * bow; c1[1] += perp[1] * bow;
      c2[0] += perp[0] * bow; c2[1] += perp[1] * bow;
      let clear = true;
      if (near.length) {
        for (let i = 1; i < 24 && clear; i++) {
          const t = i / 24, u = 1 - t;
          const qx = u * u * u * ax + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * bx;
          const qy = u * u * u * ay + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * by;
          for (const n of near) if (inHex(qx, qy, n[0], n[1])) { clear = false; break; }
        }
      }
      if (!best) best = [c1, c2];
      if (clear) { best = [c1, c2]; break; }
    }

    const r = n => Math.round(n * 10) / 10;

    const TL = (C.ui || {}).treeLines;
    if (F && TL && TL.enabled !== false &&
        ((TL.setting !== false && GG.menu && GG.menu.treeLines) || TL.def) === 'straight') {
      const q = TL.corner || 0;
      if (vert) {
        const my = (ay + by) / 2, sx = Math.sign(bx - ax), sy = Math.sign(by - ay) || 1;
        const c = Math.min(q, Math.abs(bx - ax) / 2, Math.abs(my - ay));
        if (!sx || !c) return 'M' + r(ax) + ',' + r(ay) + ' L' + r(ax) + ',' + r(my) + ' L' + r(bx) + ',' + r(my) + ' L' + r(bx) + ',' + r(by);
        return 'M' + r(ax) + ',' + r(ay) + ' L' + r(ax) + ',' + r(my - sy * c) +
          ' Q' + r(ax) + ',' + r(my) + ' ' + r(ax + sx * c) + ',' + r(my) +
          ' L' + r(bx - sx * c) + ',' + r(my) + ' Q' + r(bx) + ',' + r(my) + ' ' + r(bx) + ',' + r(my + sy * c) +
          ' L' + r(bx) + ',' + r(by);
      }
      const mx = (ax + bx) / 2, sy = Math.sign(by - ay), sx = Math.sign(bx - ax) || 1;
      const c = Math.min(q, Math.abs(by - ay) / 2, Math.abs(mx - ax));
      if (!sy || !c) return 'M' + r(ax) + ',' + r(ay) + ' L' + r(mx) + ',' + r(ay) + ' L' + r(mx) + ',' + r(by) + ' L' + r(bx) + ',' + r(by);
      return 'M' + r(ax) + ',' + r(ay) + ' L' + r(mx - sx * c) + ',' + r(ay) +
        ' Q' + r(mx) + ',' + r(ay) + ' ' + r(mx) + ',' + r(ay + sy * c) +
        ' L' + r(mx) + ',' + r(by - sy * c) + ' Q' + r(mx) + ',' + r(by) + ' ' + r(mx + sx * c) + ',' + r(by) +
        ' L' + r(bx) + ',' + r(by);
    }
    return 'M' + r(ax) + ',' + r(ay) + ' C' + r(best[0][0]) + ',' + r(best[0][1]) + ' ' +
           r(best[1][0]) + ',' + r(best[1][1]) + ' ' + r(bx) + ',' + r(by);
  }

  function treeBaseline() {
    const keys = {};
    C.skills.forEach(function (sk) {
      if (!S.skillLevel(sk.id)) return;
      (sk.effects || []).forEach(function (e) { keys[e.stat] = 1; });
    });
    const list = Object.keys(keys);
    const now = {}, base = {};
    list.forEach(function (k) { now[k] = Sim.statNow(k); });

    const keep = S.g.skills;
    S.g.skills = {};
    Sim.invalidate();
    try { list.forEach(function (k) { base[k] = Sim.statNow(k); }); }
    finally { S.g.skills = keep; Sim.invalidate(); }
    return { list: list, base: base, now: now };
  }

  function treeSpend() {
    let spent = 0, levels = 0, owned = 0, ciSkills = 0;
    C.skills.forEach(function (sk) {
      const lv = S.skillLevel(sk.id);
      if (!lv) return;
      owned++; levels += lv;
      if ((sk.tree || 'ci') === 'ci') { ciSkills++; return; }
      for (let i = 0; i < lv; i++) spent += Sim.costOf(sk, i) || 0;
    });
    return { spent: spent, levels: levels, owned: owned, ciSkills: ciSkills };
  }

  function renderTreeSummary() {
    const T = GG.i18n.t;
    el.treeInner.classList.add('summary');
    el.treeSvg.innerHTML = '';

    el.treeInner.style.width = '';
    el.treeInner.style.height = '';

    if (el.treeScroll) { el.treeScroll.scrollLeft = 0; el.treeScroll.scrollTop = 0; }
    el.treeNote.textContent = T('ts.note');

    const tot = treeSpend();
    const maxLevels = C.skills.reduce(function (a, s) { return a + Sim.maxLevel(s); }, 0);
    let html =
      '<div class="ts-top">' +
        '<div class="ts-stat"><b>' + tot.owned + ' <s>/ ' + C.skills.length + '</s></b><span>' + T('ts.skills') + '</span></div>' +
        '<div class="ts-stat"><b>' + tot.levels + ' <s>/ ' + maxLevels + '</s></b><span>' + T('ts.levels') + '</span></div>' +
        '<div class="ts-stat"><b>$' + U.fmt(tot.spent) + '</b><span>' + T('ts.spent') + '</span></div>' +
        '<div class="ts-stat"><b>' + tot.ciSkills + '</b><span>' + T('ts.ciSkills') + '</span></div>' +
      '</div>';

    const B = treeBaseline();
    const min = (C.treeSummary && C.treeSummary.minChange) || 1e-9;

    const order = Object.keys(C.nodeTypes);
    const groups = {};
    B.list.forEach(function (k) {
      const a = B.base[k], b = B.now[k];
      if (!a || !b || Math.abs(b.value - a.value) < min) return;
      const tid = k.split('.')[0];
      (groups[tid] = groups[tid] || []).push({ label: b.label, unit: b.unit, from: a.value, to: b.value });
    });
    const ids = Object.keys(groups).sort(function (x, y) {
      const ix = order.indexOf(x), iy = order.indexOf(y);
      return (ix < 0 ? 999 : ix) - (iy < 0 ? 999 : iy);
    });

    if (!ids.length) {
      html += '<div class="ts-empty">' + T('ts.empty') + '</div>';
    } else {
      ids.forEach(function (tid) {
        const own = Sim.statOwner(tid);
        html += '<div class="ts-group"><div class="ts-gh">' +
          '<span class="ts-ic">' + IC.svg(own.icon, 22, C.nodeTypes[tid] ? C.iconColor(C.nodeTypes[tid]) : own.color) + '</span>' + own.name + '</div>';
        groups[tid].forEach(function (r) {
          const unit = r.unit ? ' ' + r.unit : '';

          const mul = r.from > 0 ? '<i>×' + U.fmt(r.to / r.from, 2) + '</i>' : '';
          html += '<div class="ts-row"><span>' + GG.i18n.ins(r.label) + '</span><b>' +
            U.small(r.from) + '<em>→</em><u>' + GG.i18n.ins(U.small(r.to) + unit) + '</u>' + mul +
            '</b></div>';
        });
        html += '</div>';
      });
    }

    let wrap = el.treeInner.querySelector('.ts-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'ts-wrap';
      el.treeInner.appendChild(wrap);
    }
    wrap.innerHTML = html;
  }

  function skillsOfTree() {
    const list = allOfTree();
    if (activeTree !== 'money') return list;
    return list.filter(s => S.skillLevel(s.id) > 0 || (s.req || []).every(r => S.hasSkill(r)));
  }

  UI.buildTree = function (opts) {
    const keepSc = el.treeScroll;
    const keepL = keepSc ? keepSc.scrollLeft : 0, keepT = keepSc ? keepSc.scrollTop : 0;
    el.treeInner.querySelectorAll('.skill').forEach(n => n.remove());

    if (activeTree === 'summary') { treeCard(); renderTreeSummary(); return; }
    el.treeInner.classList.remove('summary');
    const sum = el.treeInner.querySelector('.ts-wrap');
    if (sum) sum.remove();
    const list = skillsOfTree();
    const byId = {};
    C.skills.forEach(s => byId[s.id] = s);

    el.treeNote.textContent = activeTree === 'money'
      ? GG.i18n.t('ui.moneyTreeNote')
      : GG.i18n.t('ui.ciTreeNote');
    treeCard();

    const all = allOfTree();
    const w = Math.max.apply(null, all.map(s => s.x + HEX_W)) + 60;
    const h = Math.max.apply(null, all.map(s => s.y + HEX_H)) + 60;
    el.treeInner.style.width = w + 'px';
    el.treeInner.style.height = h + 'px';
    el.treeSvg.setAttribute('width', w);
    el.treeSvg.setAttribute('height', h);

    treeRoot = list.find(s => !(s.req || []).length) || list[0] || null;
    if (opts && opts.centre) UI.centreTree();
    else if (keepSc) { keepSc.scrollLeft = keepL; keepSc.scrollTop = keepT; }

    let paths = '';
    list.forEach(s => {
      (s.req || []).forEach(rid => {
        const p = byId[rid]; if (!p) return;
        const owned = S.hasSkill(s.id);
        const open = !owned && Sim.skillAvailable(s);
        paths += '<path d="' + treeEdge(p, s, list) +
          '" class="tl ' + (owned ? 'own' : (open ? 'open' : '')) + '"/>';
      });
    });
    el.treeSvg.innerHTML = paths;

    list.forEach(s => {
      const d = document.createElement('div');
      d.className = 'skill';
      d.style.left = s.x + 'px';
      d.style.top = s.y + 'px';
      d.dataset.id = s.id;
      const maxLvl = Sim.maxLevel(s);
      d.innerHTML =
        '<div class="hex"><div class="hex-in">' + IC.svg(s.icon || 'plus', 34) + '</div></div>' +
        (maxLvl > 1 ? '<div class="sk-lvl"></div>' : '') +
        '<div class="sk-name">' + s.name + '</div>' +
        '<div class="sk-cost"></div>' +
        '<div class="sk-tip"><b>' + s.name + '</b><i>' +
          (UI.skillHidden(s) ? GG.i18n.t('sk.unknown') : C.treeDescOf(s)) + '</i>' +
          '<div class="sk-fx"></div>' +

          (C.ui.skillBuyRow === false ? '' : '<div class="sk-buy"></div>') +
          skillTryRow(s) +
        '</div>';

      d.querySelectorAll('.sk-try .cx-try').forEach(function (b) {
        b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
        b.addEventListener('click', function (e) { e.stopPropagation(); UI.tryMachine(b.dataset.try); });
      });
      d.onclick = function () {
        const res = Sim.buySkill(s.id);
        if (res.ok) {
          GG.audio.play('skill');
          UI.refreshPalette();
          UI.buildTree();

          UI.glideTreeToSkill(s.id);

          if (!UI.levelUp(res)) {
            UI.toast('Unlocked: ' + s.name + (Sim.maxLevel(s) > 1 ? ' (level ' + res.level + ')' : ''));
          }
        } else { GG.audio.play('deny'); UI.toast(res.why, true); }
      };
      el.treeInner.appendChild(d);
    });
    UI.refreshTreeState();
  };

  UI.skillHidden = function (s) {
    const M = C.skillMystery;
    if (!M || !M.enabled) return false;
    if (S.skillLevel(s.id)) return false;

    if (Sim.demoLocked(s)) return true;
    if ((s.tree || 'ci') === 'money' && !M.money) return false;
    return !Sim.skillAvailable(s);
  };

  UI.refreshTreeState = function () {
    el.treeCI.textContent = U.fmt(S.g.ci) + ' ' + GG.i18n.t('ui.ciAbbr');
    el.treeMoney.textContent = '$' + U.fmt(S.g.money);
    el.treeInner.querySelectorAll('.skill').forEach(d => {
      const s = C.skills.find(x => x.id === d.dataset.id);
      const lvl = S.skillLevel(s.id);
      const maxLvl = Sim.maxLevel(s);
      const maxed = Sim.isMaxed(s);
      const avail = Sim.skillAvailable(s);
      const cur = C.currencies[s.currency || 'ci'];
      const cost = Sim.nextCost(s);
      const have = (s.currency === 'money') ? S.g.money : S.g.ci;
      const afford = U.canAfford(have, cost);

      const gate = Sim.skillGate(s);
      const free = Sim.altUnlocked(s);

      d.classList.toggle('owned', maxed);
      d.classList.toggle('partial', lvl > 0 && !maxed);

      const ring = C.ui.skillRing && maxLvl > 1 && lvl > 0 && !maxed;
      d.classList.toggle('ringed', !!ring);
      if (ring) d.style.setProperty('--p', (lvl / maxLvl).toFixed(3));

      const inDev = Sim.demoLocked(s);
      d.classList.toggle('available', !maxed && avail && (afford || free));
      d.classList.toggle('pending', !maxed && avail && !afford && !free);
      d.classList.toggle('locked', !maxed && !avail && !inDev);
      d.classList.toggle('gated', !!gate && !maxed && !inDev);
      d.classList.toggle('indev', inDev);

      const lvlEl = d.querySelector('.sk-lvl');
      if (lvlEl) lvlEl.textContent = GG.i18n.t('sk.lv') + ' ' + lvl + ' / ' + maxLvl;

      const oneLevel = maxLvl <= 1 && !C.ui.ownedMaxLabel;
      d.querySelector('.sk-cost').textContent = maxed ? (oneLevel ? '' : GG.i18n.t('ui.max'))
        : inDev ? GG.i18n.t('ui.inDev')
        : gate ? GG.i18n.t('ui.locked')
        : free ? GG.i18n.t('ui.free')
        : (cur.short === '$' ? '$' + U.fmt(cost) : U.fmt(cost) + ' ' + cur.short);

      d.querySelector('.sk-fx').innerHTML =
        (inDev ? '<span class="sk-dev">' + GG.i18n.t('ui.inDevNote') + '</span>' : '') +

        (gate && !inDev ? '<span class="sk-gate">' +
           GG.i18n.t('sk.gate').replace('%s', gate) + '</span>' : '') +
        (free ? '<span class="sk-free">' +
           GG.i18n.t(s.altUnlock === 'placesBelowDone' ? 'sk.freeWorked' : 'sk.freeBare') +
           '</span>' : '') +
        (UI.skillHidden(s) ? ''
          : Sim.describeEffects(s).map(x => '<span>' + x + '</span>').join(''));

      const buyEl = d.querySelector('.sk-buy');
      if (buyEl) {
        const money = cur.short === '$';
        const amt = v => money ? '$' + U.fmt(v) : U.fmt(v) + ' ' + cur.short;
        if (maxed) {
          buyEl.className = 'sk-buy done';
          buyEl.innerHTML = oneLevel ? ''
            : '<span class="sk-price">' + GG.i18n.t('ui.max') + '</span>';
        } else if (inDev) {

          buyEl.className = 'sk-buy off';
          buyEl.innerHTML = '<span class="sk-price">' + GG.i18n.t('ui.inDev') + '</span>';
        } else if (gate) {
          buyEl.className = 'sk-buy off';
          buyEl.innerHTML = '<span class="sk-price">' + GG.i18n.t('ui.locked') + '</span>';
        } else if (free) {
          buyEl.className = 'sk-buy ok';
          buyEl.innerHTML = '<span class="sk-price">' + GG.i18n.t('ui.free') + '</span>';
        } else {
          buyEl.className = 'sk-buy' + (afford ? ' ok' : ' short');
          buyEl.innerHTML =
            '<span class="sk-price">' + amt(cost) + '</span>' +
            '<span class="sk-have">' + GG.i18n.t('ui.youHave') + ' ' + amt(have) + '</span>' +
            (afford ? '' : '<span class="sk-gap">' + GG.i18n.t('ui.shortBy') + ' ' +
                            amt(cost - have) + '</span>');
        }
      }
    });
  };

  let lastToast = { msg: '', at: 0 };

  UI.quiet = function (key, loc) {
    const q = (C.ui || {}).quietToasts;
    if (!q || !q.enabled) return false;
    if ((q.cut || []).indexOf(key) >= 0) return true;
    return (q.elsewhere || []).indexOf(key) >= 0 && (loc === undefined || loc === S.g.loc);
  };

  UI.toast = function (msg, bad) {

    msg = GG.i18n.msg(msg);
    const now = performance.now();
    if (msg === lastToast.msg && now - lastToast.at < 700) return;
    lastToast = { msg: msg, at: now };
    const d = document.createElement('div');
    d.className = 'toast' + (bad ? ' bad' : '');

    d.dataset.kind = GG.i18n.t(bad ? 'ui.toastBad' : 'ui.toastNote');
    if (!UI.signIcons(d, msg, 13)) d.textContent = msg;
    el.toasts.appendChild(d);
    setTimeout(() => d.classList.add('out'), 1600);
    setTimeout(() => d.remove(), 2100);
  };

  const flying = [];
  let flyLayer = null;
  const coreAlarms = {};
  const FLY_BLOCK = { ci: 'ci', money: 'money', diamond: 'gem', prism: 'prism' };
  UI.flyPending = function (cur) {
    const now = performance.now(); let p = 0;
    for (let i = flying.length - 1; i >= 0; i--) {
      if (flying[i].at <= now) flying.splice(i, 1); else if (flying[i].cur === cur) p += flying[i].share;
    }
    return p;
  };
  UI.collectFly = function (cur, sx, sy, amount) {
    const o = (C.ui || {}).collectFx;
    if (!o || !o.enabled || !(o.fly > 0) || !(amount > 0)) return;
    const block = document.querySelector('#topbar .cur-block.' + FLY_BLOCK[cur]);
    const ic = block && block.querySelector('.cur-ic');
    if (!ic || !ic.offsetParent) return;
    if (!flyLayer) { flyLayer = document.createElement('div'); flyLayer.id = 'cfx-layer'; document.body.appendChild(flyLayer); }
    const z = GG.render.uiZoom ? GG.render.uiZoom() : 1;
    const st = el.stage.getBoundingClientRect(), tr = ic.getBoundingClientRect();
    const x0 = st.left / z + sx, y0 = st.top / z + sy;
    const tx = (tr.left + tr.width / 2) / z, ty = (tr.top + tr.height / 2) / z;
    const n = Math.max(1, Math.round(o.fly * (o.amount || 1))), share = amount / n, t0 = performance.now();
    const look = cur === 'money' ? 'coin' : cur === 'diamond' ? 'gem' : cur === 'prism' ? 'prism' : 'mote';
    for (let i = 0; i < n; i++) {
      const delay = ((o.flyDelay || 0.3) + i * 0.045) * 1000, dur = (0.62 + Math.random() * 0.18) * 1000;
      const sx0 = x0 + (Math.random() - 0.5) * 60, sy0 = y0 + (Math.random() - 0.5) * 14;
      const mx = (sx0 + tx) / 2 + (Math.random() - 0.5) * 160, my = Math.min(sy0, ty) - 40 - Math.random() * 80;
      const rec = { cur: cur, share: share, at: t0 + delay + dur };
      flying.push(rec);
      const d = document.createElement('i');
      d.className = 'cfx-t ' + look; d.style.opacity = '0';
      flyLayer.appendChild(d);
      const last = i === n - 1;
      const land = function () {
        if (!d.parentNode) return;
        d.remove();
        block.classList.remove('cfx-hit'); void block.offsetWidth; block.classList.add('cfx-hit');
        if (last) {
          const g = document.createElement('span'); g.className = 'cfx-gain';
          const gt = '+' + U.cur(cur, amount, cur === 'diamond' || cur === 'prism' ? 0 : 2);
          if (!UI.signIcons(g, gt, 12)) g.textContent = gt;
          block.appendChild(g); setTimeout(() => g.remove(), 1150);
        }
      };
      const step = function (now) {
        if (!d.parentNode) return;
        const u = (now - t0 - delay) / dur;
        if (u >= 1) { land(); return; }
        if (u >= 0) {
          const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, q = 1 - e;
          const x = q * q * sx0 + 2 * q * e * mx + e * e * tx, y = q * q * sy0 + 2 * q * e * my + e * e * ty;
          d.style.opacity = '1';
          d.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (1 - 0.35 * e).toFixed(3) + ')';
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      setTimeout(land, delay + dur + 400);
    }
  };

  UI.savedFly = function (b, from) {
    const btn = document.querySelector('#boost-launch [data-panel="boosts"]');
    if (!btn || !btn.offsetParent) return;
    if (!flyLayer) { flyLayer = document.createElement('div'); flyLayer.id = 'cfx-layer'; document.body.appendChild(flyLayer); }
    const z = GG.render.uiZoom ? GG.render.uiZoom() : 1, r = btn.getBoundingClientRect();
    const x0 = from.x / z, y0 = from.y / z, x1 = (r.left + r.width / 2) / z, y1 = (r.top + r.height / 2) / z;
    const d = document.createElement('i'); d.className = 'sv-fly'; d.style.setProperty('--c', b.color);
    d.innerHTML = IC.svg(b.icon, 20, b.color); flyLayer.appendChild(d);
    const t0 = performance.now(), hop = 320, fly = 750;
    let landed = false;
    function land() {
      if (landed) return; landed = true; d.remove();
      if (btn.animate) btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 380 });
      const p = document.createElement('i'); p.className = 'sv-plus'; p.style.setProperty('--c', b.color);
      p.style.left = x1 + 'px'; p.style.top = (y1 - 26) + 'px';
      p.innerHTML = IC.svg(b.icon, 15, b.color) + '<span>+1 ' + b.name + '</span>';
      flyLayer.appendChild(p); setTimeout(() => p.remove(), 1700);
    }
    (function step() {
      if (landed) return;
      const e = performance.now() - t0;
      if (e < hop) {
        const u = e / hop;
        d.style.left = x0 + 'px'; d.style.top = (y0 - 26 * Math.sin(Math.PI * u)) + 'px';
        d.style.transform = 'scale(' + (0.4 + 0.6 * (1 - Math.pow(1 - u, 3))) + ')';
      } else if (e < hop + fly) {
        const u = 1 - Math.pow(1 - (e - hop) / fly, 3);
        d.style.left = (x0 + (x1 - x0) * u) + 'px'; d.style.top = (y0 + (y1 - y0) * u - Math.sin(Math.PI * u) * 60) + 'px';
        d.style.transform = 'scale(' + (1 - 0.35 * u) + ')';
      } else return land();
      requestAnimationFrame(step);
    })();
    setTimeout(land, hop + fly + 400);
  };

  const LUCK_HOP = { up: 0.32, fall: 0.62, fly: 0.74, h: 44 };
  const NOTE_SVG = '<svg viewBox="0 0 30 16" width="30" height="16" fill="rgba(8,14,22,.85)" stroke="#b478e8" stroke-width="1.6" stroke-linejoin="round">' +
    '<rect x="1" y="1" width="28" height="14" rx="2"/><rect x="3.5" y="3.5" width="23" height="9" rx="1.2" stroke-width=".8" fill="none" opacity=".6"/><circle cx="15" cy="8" r="3.2" fill="none"/></svg>';
  UI.luckyCoin = function (x, y, amount, kind) {
    const block = document.querySelector('#topbar .cur-block.' + FLY_BLOCK.money);
    const ic = block && block.querySelector('.cur-ic');
    if (!ic || !ic.offsetParent) return;
    if (!flyLayer) { flyLayer = document.createElement('div'); flyLayer.id = 'cfx-layer'; document.body.appendChild(flyLayer); }
    const z = GG.render.uiZoom ? GG.render.uiZoom() : 1, st = el.stage.getBoundingClientRect();
    const x0 = st.left / z + x, y0 = st.top / z + y, H = kind === 'note' ? { up: 0, fall: 0, fly: 0, h: 0 } : LUCK_HOP, dur = 620, t0 = performance.now();
    const rec = { cur: 'money', share: amount, at: t0 + (H.fly * 1000) + dur };
    flying.push(rec);
    const d = document.createElement('i'); d.className = 'cfx-t ' + (kind === 'note' ? 'note' : 'luck'); flyLayer.appendChild(d);
    if (kind === 'note') d.innerHTML = NOTE_SVG;
    const hopY = a => a < H.up ? H.h * (1 - Math.pow(1 - a / H.up, 2))
      : a < H.fall ? H.h * (1 - Math.pow((a - H.up) / (H.fall - H.up), 2)) : 7 * Math.sin(Math.min(1, (a - H.fall) / (H.fly - H.fall)) * Math.PI);
    let tx = 0, ty = 0, mx = 0, my = 0, aimed = false;
    const land = function () {
      if (!d.parentNode) return;
      d.remove(); rec.at = 0;
      GG.audio.play('collect');
      flashBlock(block);
      const g = document.createElement('span'); g.className = 'cfx-gain ' + (kind === 'note' ? 'note' : 'luck'); g.textContent = '+' + U.cur('money', amount, 2);
      block.appendChild(g); setTimeout(() => g.remove(), 1150);
    };
    const step = function (now) {
      if (!d.parentNode) return;
      const a = (now - t0) / 1000;
      if (a < H.fly) d.style.transform = 'translate(' + x0.toFixed(1) + 'px,' + (y0 - hopY(a)).toFixed(1) + 'px)';
      else {
        if (!aimed) { const tr = ic.getBoundingClientRect(); tx = (tr.left + tr.width / 2) / z; ty = (tr.top + tr.height / 2) / z;
          mx = (x0 + tx) / 2 + (Math.random() - 0.5) * 120; my = Math.min(y0, ty) - 40 - Math.random() * 60; aimed = true; }
        const u = (now - t0 - H.fly * 1000) / dur;
        if (u >= 1) { land(); return; }
        const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, q = 1 - e;
        const px = q * q * x0 + 2 * q * e * mx + e * e * tx, py = q * q * y0 + 2 * q * e * my + e * e * ty;
        d.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px) scale(' + (1 - 0.35 * e).toFixed(3) + ')';
      }
      requestAnimationFrame(step);
    };
    d.style.transform = 'translate(' + x0.toFixed(1) + 'px,' + y0.toFixed(1) + 'px)';
    requestAnimationFrame(step);
    setTimeout(land, H.fly * 1000 + dur + 400);
  };

  let swpRects = null;
  function flashBlock(block) {
    block.classList.remove('cfx-hit');
    setTimeout(() => block.classList.add('cfx-hit'), 0);
  }
  UI.sweepSpark = function (x, y, amount, night) {
    const F = C.ui.sweepFx, life = F.life || 1.1, size = F.size || 18, drift = F.drift || 0;
    const d = document.createElement('div');
    d.className = 'spark swp' + (F.glow ? ' glow' : '') + (night ? ' night' : '');
    if (night && C.swipe.moonIcon) d.innerHTML = GG.icons.svg(C.swipe.moonIcon, Math.round(size * 0.95)) + '<span>+' + U.small(amount) + ' CI</span>';
    else d.textContent = '+' + U.small(amount) + ' CI';
    d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.fontSize = size + 'px';
    const dx = (Math.random() * 2 - 1) * drift;
    d.style.setProperty('--life', life + 's'); d.style.setProperty('--rise', Math.round(size * 3) + 'px');
    d.style.setProperty('--dx', Math.round(dx) + 'px');
    d.style.setProperty('--rot', ((Math.random() * 2 - 1) * Math.min(8, drift / 6)).toFixed(1) + 'deg');
    el.sparks.appendChild(d);
    setTimeout(() => d.remove(), life * 1000 + 100);
    const block = document.querySelector('#topbar .cur-block.' + FLY_BLOCK.ci);
    const ic = block && block.querySelector('.cur-ic');
    if (!(F.dots > 0) || !ic) return;
    if (!flyLayer) { flyLayer = document.createElement('div'); flyLayer.id = 'cfx-layer'; document.body.appendChild(flyLayer); }
    const z = GG.render.uiZoom ? GG.render.uiZoom() : 1, nowT = performance.now();
    if (!swpRects || nowT - swpRects.at > 250) swpRects = { at: nowT, st: el.stage.getBoundingClientRect(), tr: ic.getBoundingClientRect() };
    const st = swpRects.st, tr = swpRects.tr;
    if (!(tr.width > 0)) return;
    const x0 = st.left / z + x, y0 = st.top / z + y, tx = (tr.left + tr.width / 2) / z, ty = (tr.top + tr.height / 2) / z;
    for (let i = 0; i < F.dots; i++) {
      const m = document.createElement('i'); m.className = 'cfx-t mote'; flyLayer.appendChild(m);
      const sx = x0 + (Math.random() - 0.5) * 20, sy = y0 + (Math.random() - 0.5) * 10;
      const mx = (sx + tx) / 2 + (Math.random() - 0.5) * 140, my = Math.min(sy, ty) - 30 - Math.random() * 70;
      const t0 = performance.now() + i * 50, dur = (F.flySec || 0.6) * 1000 * (0.87 + Math.random() * 0.26);
      const land = function () {
        if (!m.parentNode) return;
        m.remove();
        flashBlock(block);
      };
      const step = function (now) {
        if (!m.parentNode) return;
        const u = (now - t0) / dur;
        if (u >= 1) { land(); return; }
        const e = u <= 0 ? 0 : u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, q = 1 - e;
        const px = q * q * sx + 2 * q * e * mx + e * e * tx, py = q * q * sy + 2 * q * e * my + e * e * ty;
        m.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px) scale(' + (1 - 0.35 * e).toFixed(3) + ')';
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      setTimeout(land, i * 50 + dur + 400);
    }
  };

  UI.groundGemHome = function (sx, sy, amount) {
    const t = document.createElement('div'); t.className = 'gem';
    t.style.cssText = 'left:' + sx + 'px;top:' + sy + 'px;animation:none;opacity:0';
    t.innerHTML = IC.svg('diamond', 30); el.gemLayer.appendChild(t);
    const ok = UI.gemHome(t, amount); t.remove(); return ok;
  };
  UI.gemHome = function (g, amount) {
    const FX = C.gem.fx || {};
    const block = document.querySelector('#topbar .cur-block.gem');
    const ic = block && block.querySelector('.cur-ic');
    if (!ic || !ic.offsetParent || !g || !g.animate) return false;
    if (!flyLayer) { flyLayer = document.createElement('div'); flyLayer.id = 'cfx-layer'; document.body.appendChild(flyLayer); }
    const z = GG.render.uiZoom ? GG.render.uiZoom() : 1;

    const r = g.getBoundingClientRect(), w = g.offsetWidth, h = g.offsetHeight, tr = ic.getBoundingClientRect();
    const cx = (r.left + r.width / 2) / z, cy = (r.top + r.height / 2) / z;
    const dx = (tr.left + tr.width / 2) / z - cx, dy = (tr.top + tr.height / 2) / z - cy;
    const gs = parseFloat(getComputedStyle(g).getPropertyValue('--gs')) || 1;
    const d = document.createElement('div');
    d.className = 'gem-home';
    d.style.cssText = 'left:' + (cx - w / 2) + 'px;top:' + (cy - h / 2) + 'px;width:' + w + 'px;height:' + h + 'px';
    d.innerHTML = IC.svg('diamond', 30);
    const sv = d.querySelector('svg'); if (sv) sv.style.width = sv.style.height = (30 * gs) + 'px';
    flyLayer.appendChild(d);
    const ms = FX.homeMs || 560;
    flying.push({ cur: 'diamond', share: amount, at: performance.now() + ms });
    const land = function () {
      if (!d.parentNode) return;
      d.remove();
      block.classList.remove('cfx-hit'); void block.offsetWidth; block.classList.add('cfx-hit');
    };
    const a = d.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + (dx * 0.35).toFixed(1) + 'px,' + (dy * 0.35 - 30).toFixed(1) + 'px) scale(.7)', opacity: 1, offset: 0.4 },
      { transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(.35)', opacity: 0.9 },
    ], { duration: ms, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards' });
    a.onfinish = land;
    setTimeout(land, ms + 400);
    return true;
  };

  function rfx(key) { const o = (C.ui || {}).rewardFx; return !!(o && o.enabled && o[key]); }
  UI.rewardFxOn = rfx;
  function pageBox(node) {
    const r = node.getBoundingClientRect(), z = GG.render.uiZoom ? GG.render.uiZoom() : 1;
    return { x: r.left / z, y: r.top / z, w: r.width / z, h: r.height / z, cx: (r.left + r.width / 2) / z, cy: (r.top + r.height / 2) / z };
  }
  function fxNode(cls, html, parent) {
    const d = document.createElement('div'); d.className = cls; if (html) d.innerHTML = html;
    (parent || document.body).appendChild(d); return d;
  }

  function flyFrom(cur, cx, cy, amount, delay) {
    const o = (C.ui || {}).collectFx;
    if (!o) return;
    const st = pageBox(el.stage), was = o.flyDelay;
    o.flyDelay = delay == null ? 0.05 : delay;
    try { UI.collectFly(cur, cx - st.x, cy - st.y, amount); } finally { o.flyDelay = was; }
  }

  function rfxBurst(cx, cy, color) {
    const r = fxNode('rfx-ring');
    r.style.left = cx + 'px'; r.style.top = cy + 'px'; r.style.setProperty('--c', color);
    setTimeout(() => r.remove(), 900);
    for (let i = 0; i < 10; i++) {
      const s = fxNode('rfx-spark'), a = (i / 10) * Math.PI * 2 + Math.random() * 0.4, d = 42 + Math.random() * 30;
      s.style.left = cx + 'px'; s.style.top = cy + 'px'; s.style.setProperty('--c', color);
      s.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px'); s.style.setProperty('--dy', (Math.sin(a) * d).toFixed(1) + 'px');
      setTimeout(() => s.remove(), 900);
    }
  }

  let pills = [];
  UI.readyPill = function (o) {
    const btn = el.btnGoals;
    if (!btn || !btn.offsetParent) return;
    btn.classList.remove('rfx-bounce'); void btn.offsetWidth; btn.classList.add('rfx-bounce');
    const p = fxNode('rfx-pill',
      '<span class="rfx-pill-ic">' + IC.svg(o.icon, 18) + '</span>' +
      '<span class="rfx-pill-t"><b>' + GG.i18n.t('ui.objDone') + '</b><span>' + o.name + '</span></span>' +
      '<span class="rfx-pill-r">+' + UI.gemText(o.reward + ' ◆') + '</span>');
    pills.push(p);
    const place = () => {
      const b = pageBox(btn), z = GG.render.uiZoom ? GG.render.uiZoom() : 1;
      pills.forEach((q, i) => {
        q.style.top = (b.y + b.h + 10 + i * 58) + 'px';
        q.style.left = Math.max(10, Math.min(window.innerWidth / z - 310, b.cx - 150)) + 'px';
      });
    };
    place();
    p.onclick = () => { GG.audio.play('click'); UI.openPanel(UI.goalsHome()); };
    setTimeout(() => {
      p.classList.add('out');
      setTimeout(() => { p.remove(); pills = pills.filter(q => q !== p); place(); }, 400);
    }, (C.ui.rewardFx.pillSec || 4.2) * 1000);
  };

  UI.claimFx = function (o, b) {
    rfxBurst(b.cx, b.cy, 'var(--gem)');
    const g = fxNode('rfx-gain', '+' + UI.gemText(o.reward + ' ◆'));
    g.style.left = b.cx + 'px'; g.style.top = (b.cy - 16) + 'px';
    setTimeout(() => g.remove(), 1300);
    flyFrom('diamond', b.cx, b.cy, o.reward, 0.15);
  };

  function tickOut(box, cur, then) {
    const txt = box.querySelector('.pt-txt');
    box.classList.add('rfx-done');
    if (txt) {
      txt.innerHTML = '<span class="rfx-check"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.5"/>' +
        '<path d="M6 10.3l2.7 2.7L14.2 7.4"/></svg></span><span class="rfx-strike">' + txt.innerHTML + '</span>';
    }
    const bar = box.querySelector('.pt-bar');
    if (bar && cur && bar.children[cur.si]) bar.children[cur.si].className = 'on now';
    GG.audio.play('goal');
    const hold = (C.ui.rewardFx.stepHoldSec || 1.5) * 1000;
    setTimeout(() => box.classList.add('rfx-out'), hold - 350);
    setTimeout(() => { box.classList.remove('rfx-done', 'rfx-out'); then(); }, hold);
  }
  function countUp(chip, cur, to, ms) {
    const t0 = performance.now();
    const f = function (now) {
      const u = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - u, 3);
      chip.innerHTML = '+' + (cur === 'diamond' ? UI.gemText(Math.round(to * e) + ' ◆') : U.cur('money', to * e));
      if (u < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
    setTimeout(() => f(t0 + ms), ms + 300);
  }

  function actAlive(wrap, e) {
    wrap.classList.add('rfx-alive');
    [...wrap.querySelectorAll('.ax-track i')].forEach((s, i) => { s.style.animationDelay = (0.35 + i * 0.09) + 's'; });
    const money = wrap.querySelector('.ax-chip.money'), gem = wrap.querySelector('.ax-chip.gem');
    if (money && e.money) setTimeout(() => countUp(money, 'money', e.money, 900), 650);
    if (gem && e.gem) setTimeout(() => countUp(gem, 'diamond', e.gem, 700), 800);
    setTimeout(() => {
      if (money && e.money && money.offsetParent) { const b = pageBox(money); rfxBurst(b.cx, b.cy, 'var(--gold)'); flyFrom('money', b.cx, b.cy, e.money, 0); }
      if (gem && e.gem && gem.offsetParent) { const b = pageBox(gem); rfxBurst(b.cx, b.cy, 'var(--gem)'); flyFrom('diamond', b.cx, b.cy, e.gem, 0.1); }
    }, 1750);
  }

  UI.placeBanner = function (name) {
    const P = ((C.ui || {}).momentFx || {}).place;
    if (!P || !P.enabled) return false;
    const z = GG.render.uiZoom ? GG.render.uiZoom() : 1;
    const bar = document.getElementById('places'), tb = document.getElementById('topbar');
    const ref = bar && bar.offsetParent ? bar : tb;
    const d = document.createElement('div');
    d.className = 'np-banner';
    d.style.top = Math.round((ref ? ref.getBoundingClientRect().bottom / z : 64) + 26) + 'px';
    const tag = document.createElement('b'), nm = document.createElement('strong'), sub = document.createElement('span');
    tag.textContent = GG.i18n.t('ui.newPlaceTag'); nm.textContent = GG.i18n.ins(name); sub.textContent = GG.i18n.t('ui.newPlaceOpen');
    d.append(tag, nm, sub, document.createElement('i'));
    document.body.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('in')));
    setTimeout(() => d.classList.remove('in'), (P.sec || 2.8) * 1000);
    setTimeout(() => d.remove(), (P.sec || 2.8) * 1000 + 600);
    return true;
  };

  UI.spark = function (x, y, text, bad) {
    const d = document.createElement('div');
    d.className = 'spark' + (bad ? (bad === true ? ' bad' : ' ' + bad) : '');
    if (!UI.signIcons(d, text)) d.textContent = text;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    el.sparks.appendChild(d);
    setTimeout(() => d.remove(), 900);
    return d;
  };

  let pendingPulse = null;

  function deltaRow(r) {
    const from = U.small(r.from), to = U.small(r.to);

    let pct = '';
    if (r.from > 0) {
      const p = (r.to / r.from - 1) * 100;
      if (Math.abs(p) >= 0.05) pct = '<i>' + (p > 0 ? '+' : '') + U.fmt(p, 1) + '%</i>';
    }

    const unit = r.unit ? ' ' + r.unit : '';
    return '<div class="lvl-row"><span>' +
      GG.i18n.ins(r.node + ' · ' + r.label) + '</span><b>' +
      from + '<em>→</em><u>' + GG.i18n.ins(to + unit) + '</u>' + pct +
      '</b></div>';
  }

  UI.levelUp = function (res) {
    const F = C.levelFx || {};
    if (!F.enabled) return false;
    const sk = res.skill, maxLvl = Sim.maxLevel(sk);

    const rows = (F.delta && res.deltas) ? res.deltas : [];
    let body = rows.map(deltaRow).join('');

    if (!body) body = '<div class="lvl-desc">' + C.treeDescOf(sk) + '</div>';

    const opens = (sk.unlocks || [])
      .map(u => C.nodeTypes[u])
      .filter(t => t && t.buildable)
      .map(t => '<div class="lvl-open">' + GG.i18n.t('sk.unlocks') + ' ' + t.name + '</div>')
      .join('');

    let pips = '';
    if (maxLvl > 1) {
      for (let i = 1; i <= maxLvl; i++) pips += '<i' + (i <= res.level ? ' class="on"' : '') + '></i>';
      pips = '<div class="lvl-pips">' + pips + '</div>';
    }

    const d = F.card === false ? null : document.createElement('div');
    if (d) { d.className = 'lvlup';
    d.innerHTML =
      '<div class="lvl-head">' +
        '<span class="lvl-ic">' + IC.svg(sk.icon || 'plus', 26) + '</span>' +
        '<span class="lvl-ttl"><b>' + sk.name + '</b>' +
          '<span class="lvl-tag">' + GG.i18n.t(maxLvl > 1 ? 'lv.up' : 'lv.new') +
          (maxLvl > 1 ? ' ' + res.level + '/' + maxLvl : '') + '</span></span>' +
      '</div>' + pips +
      '<div class="lvl-rows">' + body + opens + '</div>';
      el.toasts.appendChild(d);
      const sec = (F.cardSec || 4.2) * 1000;
      setTimeout(() => d.classList.add('out'), sec);
      setTimeout(() => d.remove(), sec + 500);
    }

    if (F.hex) {

      const hex = el.treeInner && el.treeInner.querySelector('.skill[data-id="' + sk.id + '"]');
      if (hex) {
        hex.classList.add('just-bought');
        setTimeout(() => hex.classList.remove('just-bought'), 900);
      }
    }

    if (F.mapPulse && res.targets && res.targets.length) {
      pendingPulse = { types: res.targets, rows: rows };

      if (!F.holdForBoard) UI.flushLevelPulse();
    }
    return true;
  };

  UI.actCard = function (e, pay) {
    const st = C.story || {};
    if (st.celebrate === false) return null;

    const acts = [];
    Sim.storySteps().forEach(e => { if (acts.indexOf(e.act) < 0) acts.push(e.act); });
    const i = acts.findIndex(a => GG.i18n.ins(a.name) === GG.i18n.ins(e.name));
    const next = (i >= 0 && acts[i + 1]) ? acts[i + 1] : null;
    const T = GG.i18n.t;

    document.querySelectorAll('.actfx').forEach(el => el.remove());

    const wrap = document.createElement('div');
    wrap.className = 'actfx';

    const premise = e.done && !Sim.demoOn() && st.premise !== false;
    const demoEnd = e.done && Sim.demoOn();
    if (st.cardV2 !== false) {
      wrap.className = 'actfx v2';
      const seg = acts.map((a, k) => '<i class="' +
        (k < i ? 'on' : k === i ? 'on now' : '') + '"></i>').join('');
      const chips = (e.money ? '<b class="ax-chip money">+' + U.cur('money', e.money) + '</b>' : '') +
                    (e.gem ? '<b class="ax-chip gem">+' + UI.gemText(e.gem + ' ◆') + '</b>' : '');
      wrap.innerHTML =
        '<div class="actfx-card">' +
          '<div class="actfx-ray"></div>' +
          '<div class="ax-head">' +
            '<span class="ax-ic">' + IC.svg('goals', 16) + '</span>' +
            '<span class="ax-kick">' + (e.done ? T('ui.planComplete') : T('ui.actDone')) + '</span>' +
            (i >= 0 ? '<span class="ax-count">' + (i + 1) + ' / ' + acts.length + '</span>' : '') +
          '</div>' +
          '<div class="ax-body">' +
            '<div class="ax-name">' + GG.i18n.ins(e.name) + '</div>' +
            (i >= 0 ? '<div class="ax-track">' + seg + '</div>' : '') +
            (chips ? '<div class="ax-pay"><span class="ax-lbl">' + T('ui.actReward') + '</span>' +
                     chips + '</div>' : '') +
            (e.done ? '<div class="ax-done">' + T('ui.planDone') + '</div>' : '') +
            (premise ? '<div class="ax-premise">' + T('ui.premise') + '</div>' : '') +
            (demoEnd
              ? '<div class="actfx-demo"><b>' + T('ui.demoEndTitle') + '</b>' +
                '<span>' + T('ui.demoEndText') + '</span>' +
                ((C.demo || {}).followNote !== false && !window.desktop
                  ? '<span class="follow">' + T('ui.demoEndFollow') + '</span>' : '') + '</div>'
              : '') +
          '</div>' +
          '<div class="ax-foot">' +
            (e.done ? (demoEnd || premise ? '<span class="ax-go">' + T('ui.demoEndGo') + '</span>' : '') +
                      (premise && Sim.fullCircleOpen()
                        ? '<button class="ax-circle" type="button">' + T('fc.planBtn') + '</button>' : '')
                    : (next ?'<span class="ax-lbl">' + T('ui.actNext') + '</span>' +
                              '<span class="ax-next">' + GG.i18n.ins(next.name) + '</span>' : '')) +
          '</div>' +
        '</div>';
    } else wrap.innerHTML =
      '<div class="actfx-card">' +
        '<div class="actfx-ray"></div>' +
        '<div class="actfx-kicker">' + (e.done ? T('ui.planAllDone') : T('ui.actDone')) +
          (i >= 0 ? '<i>' + (i + 1) + ' / ' + acts.length + '</i>' : '') + '</div>' +
        '<div class="actfx-name">' + GG.i18n.ins(e.name) + '</div>' +
        (pay ? '<div class="actfx-pay">' + T('ui.actReward') + ' <b>+' + pay + '</b></div>' : '') +
        (next ? '<div class="actfx-next">' + T('ui.actNext') + ' &middot; ' +
                GG.i18n.ins(next.name) + '</div>'
              : '<div class="actfx-next">' + T('ui.planDone') + '</div>') +

        (e.done && Sim.demoOn()
          ? '<div class="actfx-demo"><b>' + T('ui.demoEndTitle') + '</b>' +
            '<span>' + T('ui.demoEndText') + '</span>' +
            ((C.demo || {}).followNote !== false && !window.desktop
              ? '<span class="follow">' + T('ui.demoEndFollow') + '</span>' : '') +
            '<i class="actfx-go">' + T('ui.demoEndGo') + '</i></div>' : '') +
      '</div>';
    document.body.appendChild(wrap);

    let gone = false;
    function close() {
      if (gone) return; gone = true;
      wrap.classList.add('out');
      setTimeout(() => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 420);
    }
    wrap.querySelector('.actfx-card').onclick = close;

    const fcBtn = wrap.querySelector('.ax-circle');
    if (fcBtn) fcBtn.onclick = function (ev) {
      ev.stopPropagation(); close(); GG.audio.play('click'); UI.fullCircle();
    };
    if (rfx('actAlive') && st.cardV2 !== false) actAlive(wrap, e);
    const last = demoEnd || (premise && st.cardV2 !== false);
    if (last) { wrap.classList.add('wait'); wrap.onclick = close; }
    else setTimeout(close, (st.celebrateSec || 4.2) * 1000);

    if (C.levelFx && C.levelFx.sparks) {
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      for (let k = 0; k < 10; k++) {
        UI.spark(cx + (Math.random() - 0.5) * 320, cy + (Math.random() - 0.5) * 150, '✦', 'act');
      }
    }
    return wrap;
  };

  let fcBox = null;
  UI.fullCircleOpen = function () { return !!(fcBox && fcBox.isConnected); };
  UI.closeFullCircle = function () { if (fcBox) fcBox.remove(); fcBox = null; };
  UI.fullCircle = function () {
    if (!Sim.fullCircleOpen()) return false;
    UI.closeFullCircle();
    const F = C.fullCircle, T = GG.i18n.t;
    const cap = S.baseCap('player'), after = cap * (F.capMul || 1);
    const li = ks => '<ul>' + ks.map(k => '<li>' + T(k) + '</li>').join('') + '</ul>';
    const sec = (cls, head, ks) => '<div class="fc-sec ' + cls + '"><h4>' + T(head) + '</h4>' +
      li(ks) + '</div>';
    fcBox = document.createElement('div');
    fcBox.className = 'fc-wrap';
    fcBox.innerHTML =
      '<div class="fc-card">' +
        '<div class="fc-head"><span class="fc-ic">' + IC.svg('goals', 18) + '</span>' +
          '<span class="fc-title">' + T('fc.title') + '</span>' +
          '<button class="fc-x" type="button">' + IC.svg('close', 14) + '</button></div>' +
        '<div class="fc-body">' +
          '<p class="fc-lead">' + T('fc.lead') + '</p>' +
          sec('fc-happens', 'fc.happens', ['fc.h1', 'fc.h2', 'fc.h3']) +
          sec('fc-keep', 'fc.keep', ['fc.k1', 'fc.k2'].concat(F.carryOn ? ['fc.k5'] : [], ['fc.k3', 'fc.k4'])) +
          sec('fc-change', 'fc.change', ['fc.c1', 'fc.c2', 'fc.c3']) +
          '<div class="fc-pair">' +
            sec('fc-good', 'fc.good', ['fc.g1', 'fc.g2', 'fc.g3']) +
            sec('fc-bad', 'fc.bad', ['fc.b1', 'fc.b2', 'fc.b3']) +
          '</div>' +
        '</div>' +
        '<div class="fc-foot">' +
          '<button class="fc-cancel" type="button">' + T('fc.cancel') + '</button>' +
          '<button class="fc-go" type="button">' + T('fc.go') + '</button>' +
        '</div>' +
      '</div>';
    fcBox.innerHTML = fcBox.innerHTML
      .split('%m').join(U.small(F.siteMul)).split('%c').join(U.small(F.capMul))
      .split('%a').join(cap).split('%b').join(after)
      .split('%w').join(U.small(F.swipeMul || 1));
    document.body.appendChild(fcBox);
    const close = function () { GG.audio.play('click'); UI.closeFullCircle(); };
    fcBox.querySelector('.fc-x').onclick = close;
    fcBox.querySelector('.fc-cancel').onclick = close;

    fcBox.onclick = function (ev) { if (ev.target === fcBox) close(); };
    const go = fcBox.querySelector('.fc-go');
    let armed = false, timer = null;
    go.onclick = function () {
      if (!armed) {
        armed = true;
        go.classList.add('armed');
        go.textContent = T('fc.arm');
        GG.audio.play('click');
        timer = setTimeout(function () {
          armed = false; go.classList.remove('armed'); go.textContent = T('fc.go');
        }, (F.armSec || 4) * 1000);
        return;
      }
      clearTimeout(timer);
      UI.doFullCircle();
    };
    return true;
  };

  UI.doFullCircle = function () {
    if (!Sim.fullCircleOpen()) return false;
    UI.closeFullCircle();
    document.querySelectorAll('.actfx').forEach(n => n.remove());
    UI.closeOverlays();
    GG.input.cancelPlacing();
    UI.selectNode(null);
    S.fullCircle();
    Sim.invalidate();
    Sim.ciPerHour = 0; Sim.moneyPerHour = 0;
    GG.input.centreView();
    UI.refreshPalette();
    UI.buildTree();
    UI.buildPlaces();
    if (GG.tutor && GG.tutor.sync) GG.tutor.sync();
    S.save(true);
    GG.audio.play('travel');
    UI.toast(GG.i18n.t('fc.done'));
    return true;
  };

  UI.flushLevelPulse = function () {
    const F = C.levelFx || {};
    const q = pendingPulse;
    pendingPulse = null;
    if (!q || !F.enabled || !F.mapPulse) return 0;

    const hit = S.machinesHere().filter(n => q.types.indexOf(n.type) >= 0);
    const lim = Math.min(hit.length, F.maxPulse || 14);

    if (GG.render.levelFx && GG.render.levelFx(hit.slice(0, lim))) return lim;

    for (let i = 0; i < lim; i++) {
      const n = hit[i];
      n.pulse = 1;
      if (F.sparks) {
        const p = GG.render.toScreen(n.x, n.y);
        UI.spark(p.x, p.y - 18, '▲', 'lvl');
      }
    }
    return lim;
  };
})(window.GG);
