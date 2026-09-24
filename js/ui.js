


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
    set('#btn-goals span:not(.gb-ic):not(.tl-badge)', T('ui.goals'));
    set('#btn-save', T('ui.save'));
    set('#btn-menu', T('ui.menu'));
    const cx = document.getElementById('btn-codex');
    if (cx) cx.title = T('ui.codexTip');
    
    set('.dock-toggle .dt-label', T('ui.build'));
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
    document.querySelectorAll('#tree-close, #pn-close').forEach(function (b) {
      b.innerHTML = T('ui.close') + ' <kbd>Esc</kbd>';
    });
    
    set('#pn-title', T('ui.boostsCaps'));
    
    ['ci-rate', 'money-rate'].forEach(function (k) {
      const e = document.getElementById(k);
      if (e) e.title = T('ui.afkTip');
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
      gemValue: id('gem-value'), btnGoals: id('btn-goals'),
      gemLayer: id('gem-layer'), boostBar: id('boost-bar'), stage: id('stage'),
      panel: id('panel'), pnTitle: id('pn-title'), pnBank: id('pn-bank'),
      pnBody: id('pn-body'), pnNote: id('pn-note'), pnIc: document.querySelector('.pn-ic'),
      goalBadge: id('goal-badge'), ciBadge: id('ci-badge'), btnSound: id('btn-sound'),
    };

    el.btnCodex.innerHTML = IC.svg('help', 16);
    el.dockToggle.querySelector('.dt-chev').innerHTML = IC.svg('chevron', 15);
    UI.relabel();          

    
    const CUR_ICON = { ci: 'ci', money: 'coin', gem: 'diamond' };
    document.querySelectorAll('#topbar .cur-block').forEach(function (b) {
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
    el.dockToggle.onclick = function () {
      dockOpen = !dockOpen;
      el.dock.classList.toggle('open', dockOpen);
      
      
      fitLaunchers();
      


      const a = (C.ui || {}).dockAnim || {};
      const ms = (dockOpen ? a.openMs : a.closeMs);
      setTimeout(fitLaunchers, (ms === undefined ? 220 : ms) + 40);
    };
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
        b.title = e.desc;
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
    const key = open.map(l => l.id).join(',') + '|' + S.g.loc + '|' + stg +
                '|' + isNew + '|' + GG.i18n.lang();
    if (key === placesKey) return;
    placesKey = key;
    
    bar.classList.toggle('hidden', open.length < 2);
    bar.innerHTML = '';
    open.forEach(function (L) {
      const b = document.createElement('button');
      


      b.className = 'pl-btn' + (L.id === S.g.loc ? ' on' : '') +
                    (S.isNewPlace(L.id) ? ' pl-new' : '');
      b.title = L.desc;
      
      const st = Sim.reviveOn()
        ? '<span class="pl-st">' + Sim.reviveStage(L.id) + '/' + Sim.reviveStages() + '</span>'
        : '';
      b.innerHTML = '<span class="pl-ic">' + IC.svg(L.icon, 18) + '</span>' + L.name + st +
                    (S.isNewPlace(L.id)
                      ? '<span class="pl-tag">' + GG.i18n.t('ui.newTag') + '</span>' : '');
      b.style.setProperty('--c', L.color);
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

  UI.syncWeatherSound = function () {
    


    if (GG.menu && GG.menu.isOpen()) { GG.audio.ambienceStop(); return; }
    
    
    const devLoc = document.querySelector('.dv-wx-loc');
    if (devLoc) {
      const l = S.locationById(Sim.wxPlace(S.g.loc) ? S.g.loc : Sim.wxLocs()[0]);
      devLoc.textContent = (l ? l.name : '—').toUpperCase();
    }
    
    
    const w = Sim.weather();
    if (w && w.sound) GG.audio.ambience(w.sound);
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
  };
  UI.gotoStuck = function () {
    stuckList = Sim.stuckNodes();
    if (!stuckList.length) return;
    stuckIdx = (stuckIdx + 1) % stuckList.length;
    const hit = stuckList[stuckIdx], n = hit.node;
    const loc = n.loc || C.locations[0].id;
    if (loc !== S.g.loc) UI.flyTo(loc);          
    const size = S.sizeOf(n);
    S.g.camera.x = n.x + size.w / 2;
    S.g.camera.y = n.y + size.h / 2;
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
    stage.classList.remove('flying');
    void stage.offsetWidth;                    
    stage.classList.add('flying');
    setTimeout(() => stage.classList.remove('flying'), 480);
    if (C.ui.arriveToast) UI.toast('Arrived at ' + res.location.name);
    


    Sim.gemFollow();
    UI.syncGem();
  };

  
  function buildableTypes() {
    return Object.keys(C.nodeTypes).filter(k => C.nodeTypes[k].buildable && S.isUnlocked(k));
  }

  
  UI.hotkeyOrder = function () {
    const out = [];
    const cats = (UI.dockTiered() && dockSection !== null)
      ? C.categories.filter(c => c.id === dockSection)
      : C.categories;
    cats.forEach(cat => {
      buildableTypes().forEach(k => { if (C.nodeTypes[k].category === cat.id) out.push(k); });
    });
    return out;
  };

  



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
    const types = buildableTypes();
    el.palette.innerHTML = '';

    if (!types.length) {
      el.palette.innerHTML = '<div class="dock-empty">No machines unlocked yet.</div>';
      return;
    }

    if (UI.dockTiered() && dockSection === null) { buildSections(types); return; }

    const cats = UI.dockTiered()
      ? C.categories.filter(c => c.id === dockSection)
      : C.categories;

    if (UI.dockTiered()) {
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
        b.title = C.descOf(t);
        if (isNew) b.classList.add('is-new');
        b.onclick = function () {
          
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
      b.style.setProperty('--accent', cat.color);
      

      const fresh = S.newNodeCount(cat.id);
      b.innerHTML =
        '<span class="ds-ic">' + IC.svg(C.dock.sectionIcons[cat.id], 26, cat.color) + '</span>' +
        '<span class="ds-name">' + cat.name + '</span>' +
        '<span class="ds-n">' + n + ' ' + GG.i18n.t('ui.machines') + '</span>' +
        (fresh ? '<span class="ds-new">' + fresh + ' ' + GG.i18n.t('ui.newTag') + '</span>' : '');
      b.onclick = function () { showDockView(cat.id); };
      wrap.appendChild(b);
    });
    el.palette.appendChild(wrap);
  }

  UI.syncPalette = function () {
    el.palette.querySelectorAll('.build-card').forEach(function (b) {
      const k = b.dataset.type;
      const price = S.priceOf(k);
      const cur = S.priceCurrencyOf(k);
      
      const capped = C.nodeTypes[k].cap !== undefined;
      const full = capped && S.capFull(k);
      b.classList.toggle('poor', full || (price > 0 && !U.canAfford(S.bank(cur), price)));
      b.classList.toggle('capped', full);
      b.classList.toggle('active', !!(GG.input.view.ghost && GG.input.view.ghost.type === k));
      const c = b.querySelector('.bc-cost');
      
      const freeTxt = C.dock.showFree === false ? '' : 'FREE';
      const txt = full ? S.builtOf(k) + ' / ' + S.buildCap(k)
        : (price === 0 ? freeTxt
          : (cur === 'money' ? '$' + U.fmt(price) : U.fmt(price) + ' ' + GG.i18n.t('ui.ciAbbr')));
      if (c.textContent !== txt) c.textContent = txt;
      c.classList.toggle('money', !full && cur === 'money' && price > 0);
      
      let lim = b.querySelector('.bc-lim');
      if (capped && !lim) {
        lim = document.createElement('span');
        lim.className = 'bc-lim';
        b.appendChild(lim);
      }
      if (lim) {
        const t2 = S.builtOf(k) + '/' + S.buildCap(k);
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

  UI.renderInspector = function () {
    
    selected = selected.filter(id => !!S.node(id));
    if (selected.length > 1) { renderGroup(); return; }
    const n = selected.length ? S.node(selected[0]) : null;
    if (!n) { el.inspector.classList.add('hidden'); inspBuilt = null; return; }
    el.inspector.classList.remove('hidden');
    const t = S.type(n);
    let rows = [];

    



    const diag = C.diagnose.inspector ? Sim.diagnose(n) : null;
    if (diag) rows.push([diag.level === 'stop' ? 'Stopped' : 'Held back', diag.why]);

    
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
          if (gp && gp.label) rows.push([gp.label, '']);   
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
        rows.push([r.v.label, vv]);
      } else {
        const res = C.resources[r.port.res];
        const key = r.kind + ':' + r.port.id;
        






        let val = U.fmt(n.rates[key] || 0) + ' ' + res.rate;
        if (r.kind === 'out' && t.outBuffer) {
          const held = n.obuf[r.port.id] || 0;
          




          if (held >= 0.005) val += ' · ' + U.fmt(held, 2) + ' kg waiting';
        }
        if (!(roadDone && r.kind === 'in'))
          rows.push([(r.kind === 'in' ? 'In · ' : 'Out · ') + S.portLabel(n, r.port, r.kind), val]);
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
      const made = (n.rates['out:plastic'] || 0) + (n.rates['out:organic'] || 0);
      const wf = n.rates['in:wf'] || 0;
      const need = Sim.stat('fineSorter', 'wfPerKg') * made;
      rows.push(['Crew needed', U.fmt(need, 2) + ' WF/h']);
      if (made <= 0) {
        rows.push(['Split', 'idle']);
      } else {
        const share = Sim.lightShare(wf, made, 'fineSorter');
        rows.push(['Split', Math.round(share * 100) + '% plastic / ' +
                            Math.round((1 - share) * 100) + '% organic']);
        rows.push(['Status', wf >= need ? 'Best split, a bigger crew is wasted'
          : U.fmt(Sim.heavyRatio(wf, made, 'fineSorter'), 2) + '× more organic than plastic']);
      }
    }

    if (t.mix) {
      const per = Sim.stat(t.id, 'energyPerKg');
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
          rows.push([C.resources[res].name,
                     U.fmt(Sim.valueOf(t, res, side), 2) + ' ' + cur + '/kg']);
        });
      });
    }
    if (t.id === 'weightSorter') {
      
      
      const rec = (n.rates['out:light'] || 0) + (n.rates['out:heavy'] || 0);
      const kw = n.rates['in:kw'] || 0;
      const need = Sim.stat('weightSorter', 'energyPerKg') * rec;
      rows.push(['Energy needed', U.fmt(need, 2) + ' KW/h']);
      if (rec <= 0) {
        rows.push(['Split', 'idle']);
      } else {
        const share = Sim.lightShare(kw, rec);
        rows.push(['Split', Math.round(share * 100) + '% light / ' +
                            Math.round((1 - share) * 100) + '% heavy']);
        rows.push(['Status', kw >= need ? 'Best split, extra energy is wasted'
          : U.fmt(Sim.heavyRatio(kw, rec), 2) + '× more heavy than light']);
      }
    }
    if (t.id === 'rubbleSorter') {
      
      
      const made = (n.rates['out:glass'] || 0) + (n.rates['out:agg'] || 0);
      const wf = n.rates['in:wf'] || 0, kw = n.rates['in:kw'] || 0;
      const kg = made > 0 ? made : (n.buf.heavy || 0);
      rows.push(['For a full kilo', U.fmt(Sim.stat(t.id, 'wfPerKg'), 1) + ' WF + ' +
                                    U.fmt(Sim.stat(t.id, 'energyPerKg'), 1) + ' KW']);
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
        .replace('%p', U.fmt(Sim.reactorKw(t), 1))]);
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
      }
      rows.push(['A flight', GG.i18n.t('ui.rocketFlight')
        .replace('%m', Math.round(Sim.rocketFuel(n).sec / 60)).replace('%k', U.kg(Sim.rocketMetal(n)))
        .replace('%c', U.fmt(R.flight.ci, 0))]);
      if ((n.obuf.metal || 0) > 1e-6) rows.push(['In the hold', U.kg(n.obuf.metal)]);
      rows.push(['Status', st.state === 'flying' ? 'In flight, ' + Math.ceil(st.left) + 's left'
        : st.state === 'building' ? 'Being built' : st.state === 'hold' ? 'Empty the hold'
        : st.state === 'fuel' ? 'Waiting for fuel' : st.state === 'crew' ? 'Waiting for crew'
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
      
      
      const made = (n.rates['out:alu'] || 0) + (n.rates['out:steel'] || 0);
      const kw = n.rates['in:kw'] || 0;
      const need = Sim.stat('eddySeparator', 'energyPerKg') * made;
      rows.push(['Energy needed', U.fmt(need, 2) + ' KW/h']);
      if (made <= 0) {
        rows.push(['Split', 'idle']);
      } else {
        const share = Sim.lightShare(kw, made, 'eddySeparator');
        rows.push(['Split', Math.round(share * 100) + '% aluminium / ' +
                            Math.round((1 - share) * 100) + '% steel']);
        rows.push(['Status', kw >= need ? 'Best split, extra energy is wasted'
          : U.fmt(Sim.heavyRatio(kw, made, 'eddySeparator'), 2) + '× more steel than aluminium']);
      }
    }

    if (t.id === 'hazardPlant') {
      const light = n.rates['in:light'] || 0;
      const wf = n.rates['in:wf'] || 0;
      const per = Sim.stat('hazardPlant', 'wfPerKg');
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
      const per = Sim.stat('magnetSeparator', 'energyPerKg');
      rows.push(['Energy per kg', U.fmt(per, 2) + ' KW/h']);
      rows.push(['Could lift', U.fmt(kw / per, 2) + ' kg/h']);
      rows.push(['Status', made > 1e-6 ? 'Pulling metal'
        : (kw <= 1e-6 ? 'No power' : 'No heavy trash')]);
    }

    


    



    










    const sig = n.id + '|' + rows.map(r => r[0]).join(',') + '|' + GG.i18n.lang() +
                (t.overdrive ? '|od' + Sim.overdriveDrain(t) : '') +
                

                '|' + Sim.nameOf(n);
    rows = rows.map(r => [GG.i18n.ins(r[0]), GG.i18n.ins(r[1])]);
    if (sig === inspBuilt) {
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
        '<span><b>' + Sim.nameOf(n) + '</b></span>' +
        '<button class="insp-x" title="' + GG.i18n.t('ui.close') + '"></button>' +
      '</div>' +
      







      (function () {
        

        





        const spec = C.specCard(t, { node: n });
        if (!spec.length) return '<div class="insp-desc">' + C.descOf(t) + '</div>';
        return '<div class="insp-spec">' + spec.map(r =>
          '<div class="sp"><span>' + GG.i18n.ins(r[0]) + '</span><b>' +
          GG.i18n.ins(r[1]) + '</b></div>').join('') + '</div>';
      })() +
      '<div class="insp-rows">' +
      rows.map(r => '<div class="row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join('') +
      '</div>';
    const x = el.inspector.querySelector('.insp-x');
    x.innerHTML = IC.svg('close', 13);
    x.onclick = function () { UI.selectNode(null); };
    if (t.splitter) buildSplitControls(n, t);
    if (t.store) buildStoreControls(n, t);
    if (t.holdLock) buildFlowControls(n, t);
    if (t.lanes) t.lanes.forEach((L, i) => buildLaneControls(n, t, L, i));   
    if (Sim.fuelSwitchOpen(t)) buildFuelSwitch(n, t);                       
    if (t.hire) buildHireControls(n, t);
    if (t.autoHire) buildAgencyControls(n, t);     
    if (t.interestPct) buildBankControls(n, t);    
    if (t.predict) buildMastControls(n, t);
    if (t.pullCost && GG.sim.beaconLocal()) buildBeaconControls(n, t);   
    if (t.overdrive) buildRobotControls(n, t);
    buildFlip(n);
    if (t.kind !== 'site') buildQuiet(n);
    buildSelectMore();
    buildCodexLink(t);                             
    buildMove([n.id]);
    buildDemolish(n, t);
    liftControls();
    el.inspector.scrollTop = keepScroll;   
  };

  






























  function liftControls() {
    if ((C.ui || {}).cardCtlFirst === false) return;
    let at = el.inspector.querySelector('.insp-head');
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
    box.className = 'cxl-ctl';
    box.innerHTML = '<button class="cxl-btn">' + GG.i18n.t('ui.codex') + '</button>';
    el.inspector.appendChild(box);
    box.querySelector('.cxl-btn').onclick = function () { UI.codexAt(t.id); };
  }
  

  UI.codexAt = function (typeId) {
    GG.audio.play('click');
    codexTab = 'machines';
    
    const tt = C.nodeTypes[typeId];
    if (tt && cxFolded[tt.category]) { delete cxFolded[tt.category]; cxFoldSave(); }
    UI.openPanel('codex');                 
    const item = el.panel.querySelector('.cx-item[data-cx="' + typeId + '"]');
    const sc = el.panel.querySelector('.pn-card');
    if (!item || !sc) return false;
    




    const top = function (e) { let y = 0; for (; e; e = e.offsetParent) y += e.offsetTop; return y; };
    const y = top(item) - top(sc) - sc.clientTop;
    sc.scrollTop = Math.max(0, y - Math.max(0, (sc.clientHeight - item.offsetHeight) / 2));
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
    box.className = 'move-ctl';
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

  




  function renderGroup() {
    el.inspector.classList.remove('hidden');
    const nodes = selected.map(S.node).filter(Boolean);
    const sig = 'group|' + selected.join(',') + '|' + (addMode ? 1 : 0);
    if (sig === inspBuilt) return;
    inspBuilt = sig;
    splitRefresh = null;

    
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
      '<div class="insp-rows">' +
        Object.keys(counts).map(k =>
          '<div class="row"><span>' + C.nodeTypes[k].name + '</span><b>&times;' +
          counts[k] + '</b></div>').join('') +
        '<div class="row"><span>' + GG.i18n.t('ui.selWires') + '</span><b>' + inner + '</b></div>' +
      '</div>';

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
      UI.toast('Blueprint saved: ' + res.bp.name +
        (res.skipped ? ' — ' + res.skipped + ' on-site machine' +
                       (res.skipped === 1 ? '' : 's') + ' left out' : ''));
      UI.syncLaunchers();
      if (panelKind === 'blueprints') UI.renderPanel();
    };

    

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
      selected.slice().forEach(function (id) {
        const r = S.removeNode(id);
        if (r && r.amount > 0) { back += r.amount; cur = r.currency; }
      });
      GG.audio.play('demolish');
      UI.toast('Demolished ' + nodes.length + ' machines' +
        (back > 0 ? ' (+' + U.cur(cur, back) + ')' : ''));
      UI.clearSelection();
      UI.refreshPalette();
    });
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

  








  function buildFlip(n) {
    if (!GG.render.canFlip(n)) return;
    const box = document.createElement('div');
    box.className = 'quiet-ctl';
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
    able.forEach(n => { if (n.flip) delete n.flip; else n.flip = 1; });
    GG.audio.play('click');
    UI.rebuildInspector();
    return true;
  };

  function buildQuiet(n) {
    if ((C.diagnose || {}).mute === false) return;
    const box = document.createElement('div');
    box.className = 'quiet-ctl';
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
    const btn = el.inspector && el.inspector.querySelector('.demo-btn');
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
      const name = t.name;
      const r = S.removeNode(n.id);
      GG.audio.play('demolish');
      UI.toast('Demolished ' + name + (r && r.amount > 0
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

  function buildSplitControls(n, t) {
    if (t.priority) return buildPrioControls(n);
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl';
    box.innerHTML =
      '<div class="sc-head">' + GG.i18n.t('ui.splitHead') + '</div>' +
      '<div class="sc-pair">' +
        '<label>A<input type="text" inputmode="text" data-side="a" title="' +
          GG.i18n.t('ui.calcHint') + '"></label>' +
        '<label>B<input type="text" inputmode="text" data-side="b" title="' +
          GG.i18n.t('ui.calcHint') + '"></label>' +
      '</div>' +
      '<div class="sc-out"></div>' +
      '<button class="sc-even">' + GG.i18n.t('ui.splitEven') + '</button>';
    el.inspector.appendChild(box);

    const ins = box.querySelectorAll('input');
    const out = box.querySelector('.sc-out');
    function show() {
      ins.forEach(function (f) {
        if (f === document.activeElement) return;         
        f.value = calcText(f.dataset.side === 'a' ? n.wa : n.wb);
      });
      const share = Sim.splitShare(n);
      const ip = S.portsOf(n, 'in')[0];
      const rate = (n.rateIn && ip) ? (n.rateIn[ip.id] || 0) : 0;
      






      const gA = (n.giveA !== undefined) ? n.giveA : rate * share;
      const gB = (n.giveB !== undefined) ? n.giveB : rate * (1 - share);
      out.textContent = rate > 0
        ? U.fmt(gA, 2) + ' / ' + U.fmt(gB, 2) + ' ' + C.resources[ip.res].rate
        : Math.round(share * 100) + '% / ' + Math.round((1 - share) * 100) + '%';
    }
    ins.forEach(function (f) {
      f.oninput = function () {
        


        const v = U.calc(f.value);
        if (v === null || v < 0) return;                   
        if (f.dataset.side === 'a') n.wa = v; else n.wb = v;
        show();
      };
      onCalcEnter(f, function (v) {
        if (f.dataset.side === 'a') n.wa = v; else n.wb = v;
      }, show);
      f.onblur = show;
    });
    box.querySelector('.sc-even').onclick = function () {
      n.wa = 1; n.wb = 1; show(); GG.audio.play('click');
    };
    show();
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

  


  function buildFuelSwitch(n, t) {
    const box = document.createElement('div');
    box.className = 'split-ctl insp-ctl fuel-sw';
    const base = t.rocket ? C.resources.turbofuel.name : C.resources.rod.name;
    box.innerHTML =
      '<div class="sc-head">' + GG.i18n.t('ui.fuelHead') + '</div>' +
      '<div class="sc-drain">' +
        '<button class="sc-chip" data-alt="0">' + base + '</button>' +
        '<button class="sc-chip" data-alt="1">' + C.resources.nfuel.name + '</button>' +
      '</div>' +
      '<div class="sc-out"></div>';
    el.inspector.appendChild(box);
    const out = box.querySelector('.sc-out');
    function show() {
      const alt = Sim.fuelAlt(n);
      box.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('on', (b.dataset.alt === '1') === alt);
      });
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
    const box = document.createElement('div');
    box.className = 'split-ctl hire-ctl insp-ctl';
    box.innerHTML =
      '<div class="sc-head">' + GG.i18n.t('ui.hireHead') + '</div>' +
      '<div class="hc-row">' +
        '<button class="hc-step" data-d="-1">&minus;</button>' +
        '<span class="hc-n"></span>' +
        '<button class="hc-step" data-d="1">+</button>' +
      '</div>' +
      (timed
        ? '<div class="hc-row">' +
            '<button class="hc-step hc-t" data-t="-1">&minus;</button>' +
            '<span class="hc-n hc-time"></span>' +
            '<button class="hc-step hc-t" data-t="1">+</button>' +
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
        if (b.dataset.t) secs += parseInt(b.dataset.t, 10) * (t.hire.stepSec || 600);
        else want += parseInt(b.dataset.d, 10);
        GG.audio.play('click'); show();
      };
    });
    box.querySelector('.hc-go').onclick = function () {
      const res = Sim.hire(n, want, secs);
      if (res.ok) { GG.audio.play('hire'); UI.toast('Hired ' + res.count + ' for ' + clock(res.sec)); }
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
      '<div class="hc-row">' +
        '<button class="hc-step" data-d="-1">&minus;</button>' +
        '<span class="hc-n"></span>' +
        '<button class="hc-step" data-d="1">+</button>' +
      '</div>' +
      '<div class="hc-row">' +
        '<button class="hc-step hc-t" data-t="-1">&minus;</button>' +
        '<span class="hc-n hc-time"></span>' +
        '<button class="hc-step hc-t" data-t="1">+</button>' +
      '</div>' +
      '<div class="sc-out hc-note"></div>';
    el.inspector.appendChild(box);
    const wrap = box.querySelector('.ag-order');
    [['post', 'ui.agPosts'], ['exchange', 'ui.agExchanges']].forEach(function (p) {
      const b = document.createElement('button');
      b.className = 'sc-chip';
      b.textContent = GG.i18n.t(p[1]);
      b._v = p[0];
      b.onclick = function () { n.agOrder = p[0]; GG.audio.play('click'); show(); };
      wrap.appendChild(b);
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

  













  let wxSig = null;
  function syncWxBed() {
    const w = Sim.weather();
    const sig = (w ? w.id : '-') + '|' + S.g.loc;
    if (sig === wxSig) return;
    wxSig = sig;
    UI.syncWeatherSound();
  }

  UI.tick = function () {
    syncHome();
    fitTopbar();
    
    const down = C.ui.balanceDown !== false;
    el.ci.textContent = U.fmt(S.g.ci, undefined, down);
    
    el.ciRate.textContent = U.fmt(Sim.ciPerHour) + ' ' + GG.i18n.t('ui.ciPerH');
    el.money.textContent = U.fmt(S.g.money, undefined, down);
    el.moneyRate.textContent = U.fmt(Sim.moneyPerHour) + ' $/h';

    
    el.gemValue.textContent = U.fmt(S.bank('diamond'), undefined, down);
    UI.syncReveal();         
    UI.syncStuck();          
    syncWxBed();             
    
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
      gemEl.title = 'A diamond! Click to pick it up.';
      gemEl.innerHTML = IC.svg('diamond', 30);
      









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
        UI.toast('Diamond collected — ' + res.amount + ' ◆');
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
  UI.syncBoostBar = function () {
    const live = C.boosts.filter(b => Sim.boostActive(b.id));
    

    const F = C.boostFx;
    document.body.classList.toggle('boost-hand',
      !!(F && F.enabled && F.cursor && Sim.handBoost()));
    











    const wxs = Sim.wxRunning().filter(w => UI.wxTold(w.loc));
    

    const soon = Sim.wxKnown(S.g.loc) ? Sim.wxIncoming(S.g.loc) : null;
    


    const down = (C.weather.gridTrip && C.weather.gridTrip.enabled)
      ? Sim.wxLocs().filter(l => Sim.gridDownLeft(l) > 0 && Sim.gridMatters(l)) : [];
    const key = live.map(b => b.id).join(',') + '|' +
                wxs.map(w => w.loc + ':' + w.event.id).join(',') +
                '|' + (soon ? 'soon' + soon.event.id : '') +
                
                
                '|down' + down.map(l => l + (l === S.g.loc ? '!' : '')).join(',') +
                


                '|' + GG.i18n.lang();
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
        d.style.setProperty('--c', w.event.color);
        d.title = w.event.desc;
        d.innerHTML = '<span class="bp-ic">' + IC.svg(w.event.icon, 15) + '</span>' +
                      w.event.name + ' <i>' + (S.locationById(w.loc) || {}).name +
                      '</i> <b></b>';
        el.boostBar.appendChild(d);
      });
      if (soon) {
        const d = document.createElement('div');
        d.className = 'bp bp-soon';
        d.style.setProperty('--c', soon.event.color);
        d.title = soon.event.desc;
        d.innerHTML = '<span class="bp-ic">' + IC.svg(soon.event.icon, 15) + '</span>' +
                      soon.event.name + ' <i>' + GG.i18n.t('ui.incoming') + '</i> <b></b>';
        el.boostBar.appendChild(d);
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
    el.boostBar.querySelectorAll('.bp-grid').forEach(function (pill) {
      const loc = pill.dataset.grid, left = Sim.gridDownLeft(loc);
      const R = C.weather.gridTrip.recoverSec;
      
      
      
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
  function goalOrder(kind) {
    const trials = kind === 'trials';
    



    return C.objectives.filter(o => isTrial(o) === trials && !Sim.goalHidden(o))
      .map((o, i) => ({ o: o, i: i }))
      .sort((a, b) => goalRank(a.o) - goalRank(b.o) || a.i - b.i)   
      .map(x => x.o);
  }

  

  function panelSig() {
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
        if (act.gem) bonus += (bonus ? ' + ' : '') + act.gem + ' ◆';
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
    const line = (ic, cls, txt) =>
      '<div class="of-row ' + cls + '"><span class="of-ic">' + IC.svg(ic, 15) + '</span>' +
      '<b>' + txt + '</b></div>';
    const T = GG.i18n.t, D = GG.i18n.dur;
    if (rep.ci > 0.005) rows.push(line('ci', 'ci', '+' + U.fmt(rep.ci) + ' ' + T('ui.ciAbbr')));
    if (rep.money > 0.005) rows.push(line('money', 'money', '+$' + U.fmt(rep.money)));
    if (rep.kg > 0.005) rows.push(line('bag', 'trash', GG.i18n.ins(U.kg(rep.kg)) + ' ' + T('of.cleaned')));
    






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
    box.innerHTML =
      '<div class="of-head">' + T('of.head') + '</div>' +
      '<div class="of-time">' + D(rep.awaySec) + ' ' + T('of.away') +
      (rep.capped ? ' <i>(' + T('of.counted') + ' ' + D(rep.countedSec) + ')</i>' : '') + '</div>' +
      '<div class="of-rows">' + rows.join('') + '</div>' +
      '<div class="of-foot">' +
      T('of.slower').replace('%n', Math.round(1 / Sim.offlineRate())) + '</div>';
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
    if (t.rocket) bits.push(GG.i18n.t('ui.rocketFlight')                  
      .replace('%m', Math.round(t.rocket.flight.sec / 60)).replace('%k', U.kg(t.rocket.flight.metal))
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

  







  function cxTry(t) {
    if (!GG.practice || !GG.practice.canPractise || !GG.practice.canPractise(t.id)) return '';
    return '<button class="cx-try" type="button" data-try="' + t.id + '">' +
           IC.svg('help', 13) + GG.practice.tryFace(t.id) + '</button>';
  }

  
  function cxNote(t) {
    const rows = C.specProse(t);
    if (!rows.length) return '';
    return '<div class="cx-note"><span>' + GG.i18n.t('cx.noteLbl') + '</span>' +
           rows.map(r => '<p>' + GG.i18n.ins(r[1]) + '</p>').join('') + '</div>';
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
          html += '<div class="cx-item cx-dev">' +
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
        html += '<div class="cx-item' + (known ? '' : ' cx-locked') + '" data-cx="' + t.id + '">' +
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
    return html;
  }

  function cxResources() {
    let html = '<h3 class="cx-cat">' + GG.i18n.t('cx.currencies') + '</h3>';
    Object.keys(C.currencies).forEach(function (k) {
      const c = C.currencies[k];
      html += '<div class="cx-line"><b style="color:' + c.color + '">' + c.name + '</b>' +
              '<span>' + (c.short || '') + '</span></div>';
    });
    html += '<h3 class="cx-cat">' + GG.i18n.t('cx.materialsHead') + '</h3>';
    Object.keys(C.resources).forEach(function (k) {
      const r = C.resources[k];
      
      if (r.hideUntil && !(S.g && S.g.objectives && S.g.objectives[r.hideUntil])) return;
      
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
    return html;
  }

  function cxWeather() {
    



    
    const locs = Sim.wxLocs().filter(id => !Sim.demoLoc(id));
    const names = locs.map(id => '<b>' + ((S.locationById(id) || {}).name || id) + '</b>');
    let html = '<p class="cx-intro">' + GG.i18n.t('cx.wxIntro')
      .replace('%p', names.join(' ' + GG.i18n.t('cx.wxAnd') + ' ')) + '</p>';
    C.weather.events.forEach(function (e) {
      const odds = locs.map(function (id) {
        const p = Math.round(Sim.wxChance(id, e) * 100);
        return (locs.length > 1 ? ((S.locationById(id) || {}).name + ' ') : '') + p + '%';
      }).join(' &middot; ');
      html += '<div class="cx-item"><div class="cx-ic" style="--c:' + e.color + '">' +
        IC.svg(e.icon, 20) + '</div><div class="cx-body">' +
        '<div class="cx-name">' + e.name +
          '<span class="cx-tag">' + odds + ' &middot; ' + e.sec + 's</span></div>' +
        '<div class="cx-desc">' + e.desc + '</div></div></div>';
    });
    
    html += '<p class="cx-intro cx-note">' + GG.i18n.t('cx.wxStack') + '</p>';
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
           !(GG.input && GG.input.touchUi && GG.input.touchUi()) ? [['ctlBand']] : []),
       ['ctlWire'],
       



       ...((((C.wire || {}).ortho || {}).enabled !== false) &&
           !(GG.input && GG.input.touchUi && GG.input.touchUi())
             ? [['ctlSquare'], ['ctlSquare2']] : []),
       [(GG.input && GG.input.touchUi && GG.input.touchUi()) ? 'ctlCutTouch' : 'ctlCut'],
       

       ...((((C.ui || {}).undo || {}).enabled !== false) &&
           !(GG.input && GG.input.touchUi && GG.input.touchUi()) ? [['ctlUndo']] : []),
       ['ctlZoom'], ['ctlMmb'],
       




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
    el.pnBank.textContent = '';
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
    el.pnBody.appendChild(wrap);

    const tut = wrap.querySelector('#cx-tutor');
    if (tut) tut.onclick = function () {
      GG.tutor.restart(); UI.closePanel(); UI.toast('Tutorial restarted');
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
  }

  UI.openPanel = function (kind) {
    panelKind = kind;
    el.panel.classList.remove('hidden');
    UI.renderPanel();
    











    const sc = el.panel.querySelector('.pn-card');
    if (sc) { sc.scrollTop = 0; sc.scrollLeft = 0; }
  };
  UI.closePanel = function () { panelKind = null; el.panel.classList.add('hidden'); };
  UI.panelOpen = function () { return !!panelKind; };
  
  UI.panelKind = function () { return panelKind; };

  





  let planKey = null, planClosedSession = false;
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
    if (key === planKey) return;
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

  UI.renderPanel = function () {
    if (!panelKind) return;
    if (panelKind === 'codex') { renderCodex(); return; }
    if (panelKind === 'blueprints') { renderBlueprints(); return; }
    if (panelKind === 'caps') { renderCaps(); return; }
    if (panelKind === 'plan') { renderPlan(); return; }
    const trials = panelKind === 'trials';
    const goals = panelKind === 'goals' || trials;
    el.pnTitle.textContent = GG.i18n.t(trials ? 'ui.trials' : (goals ? 'ui.objectives' : 'ui.boostsCaps'));
    el.pnIc.innerHTML = IC.svg(trials ? 'diamond' : (goals ? 'goals' : 'boost'), 22);
    el.pnNote.textContent = trials
      ? GG.i18n.t('ui.trialsNote') + ' ' + C.goals.hardAt + ' ◆.'
      : goals ? ''
      : GG.i18n.t('ui.boostNote').replace('%t', clock(Sim.boostDur()))
          .replace('%n', C.boostUseStep).replace('%d', C.boostUseSurcharge) +
        (Sim.boostFree() ? '  ' + GG.i18n.t('ui.boostFirstFree') : '');
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
        side.innerHTML = '<span class="pn-reward">+' + o.reward + ' ◆</span>';
        const btn = document.createElement('button');
        btn.className = 'pn-buy pn-claim';
        btn.onclick = function () {
          const res = Sim.claimGoal(o.id);
          if (res.ok) {
            GG.audio.play('claim');
            const won = Sim.goalMachine(o);
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
          const res = Sim.buyBoost(o.id);
          if (res.ok) {
            GG.audio.play('boost');
            UI.toast(res.instant ? res.boost.name + ' — the sun is back up'
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
            UI.toast(res.instant ? res.boost.name + ' — the sun is back up'
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
          UI.toast(res.name + ': you may now build ' + res.cap);
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

      const row = document.createElement('div');
      row.className = 'pn-row';
      row.dataset.id = bp.id;
      row.style.setProperty('--c', 'var(--gold)');
      row.innerHTML =
        '<span class="pr-ic">' + IC.svg('merge', 24) + '</span>' +
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
      row.querySelector('.pn-drop').onclick = function () {
        S.removeBlueprint(bp.id);
        GG.audio.play('unwire');
        UI.toast('Blueprint deleted');
        UI.syncLaunchers();
        UI.renderPanel();
      };
      el.pnBody.appendChild(row);
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
  };

  
  UI.syncPanel = function () {
    if (!panelKind) return;
    
    
    if (panelKind === 'codex') return;
    if (panelKind === 'plan') { if (panelKey !== panelSig()) UI.renderPanel(); return; }
    if (panelSig() !== panelKey) { UI.renderPanel(); return; }   
    if (panelKind === 'blueprints') return;                      
    el.pnBank.textContent = U.fmt(S.bank('diamond')) + ' ◆';

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
        btn.textContent = maxed ? GG.i18n.t('ui.max') : ('+' + C.capShop.perLevel + '  ' + price + ' ◆');
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
        btn.textContent = (paid ? GG.i18n.t('ui.claimed') : GG.i18n.t('ui.claim')) + '  +' + o.reward + ' ◆';
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
        
        
        
        btn.textContent = GG.i18n.t(b.instant ? 'ui.boostUse'
                                    : (on ? 'ui.boostRestart' : 'ui.boostGo')) + '  ' + tag;
        btn.disabled = !U.canAfford(S.bank('diamond'), price) || night;
        const pr = row.querySelector('.pn-printed'), have = Sim.boostStock(b.id);
        if (pr) {
          pr.style.display = have > 0 ? '' : 'none';
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
    rocketBuilt: 'build', rocketHome: 'build', array: 'build', gemMade: 'claim',
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
        GG.audio.play('goal');
        UI.toast('Objective ready to claim: ' + e.name + '  +' + e.reward + ' ◆');
      } else if (e.kind === 'story') {
        
        UI.toast(GG.i18n.t('ui.planStep') + ' ' + GG.i18n.ins(e.text));
      } else if (e.kind === 'storyAct') {
        GG.audio.play('skill');
        let pay = e.money ? U.cur('money', e.money) : '';
        if (e.gem) pay += (pay ? ' + ' : '') + e.gem + ' ◆';
        




        UI.actCard(e, pay);
        UI.toast((e.done ? GG.i18n.t('ui.planAllDone') : GG.i18n.t('ui.planAct')) + ' ' +
                 GG.i18n.ins(e.name) + (pay ? '  +' + pay : ''));
      } else if (e.kind === 'boostEnd') {
        GG.audio.play('boostOff');
        UI.toast(e.name + ' has worn off', true);
      } else if (e.kind === 'gem') {
        GG.audio.play('gemDrop');
        UI.toast('A diamond appeared on the map');
      } else if (e.kind === 'skillReady') {
        
        const sk = Sim.skillById(e.id);
        if (sk) {
          GG.audio.play('goal');
          UI.toast('Within reach: ' + sk.name + ' — ' + U.fmt(Sim.nextCost(sk)) + ' ' +
                   C.currencies[sk.currency || 'ci'].short);
        }
      } else if (e.kind === 'placeOpened') {
        




        GG.audio.play('goal');
        UI.toast(e.name + ' is open. There is nothing left to strip here.');
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
        UI.toast('The meteorite is dug out');
        UI.refreshPalette();
      } else if (e.kind === 'siteEmpty') {
        
        
        
        GG.audio.play('burn');
        UI.toast('A Trash Site is stripped bare — nothing left in it');
        UI.refreshPalette();
      } else if (e.kind === 'siteGone') {
        GG.audio.play('demolish');
        UI.toast('A Trash Site is stripped bare and gone' +
          (e.machines ? ' — ' + e.machines + ' machine' + (e.machines === 1 ? '' : 's') +
                        ' went with it' : ''), true);
        UI.refreshPalette();
      } else if (e.kind === 'recruit') {
        GG.audio.play('hire');
        UI.toast('Someone joined the cause — ' + e.total +
                 (e.total === 1 ? ' recruit' : ' recruits'));
      } else if (e.kind === 'agencyHire') {
        
        
        if (e.loc === S.g.loc) GG.audio.play('hire');
      } else if (e.kind === 'gemCaught') {
        
        
        GG.audio.play('gemTake');
      } else if (e.kind === 'kitCut') {
        
        
        UI.toast(e.power && e.kit !== false
          ? (e.kit ? 'A robot has every Solar Kit now, so its kit and power wires were removed'
                   : 'A robot has every Solar Kit now, so its power wire was removed')
          : 'A robot has every Solar Kit now, so its kit wire was removed');
      } else if (e.kind === 'rocketBuilt') {
        
        GG.audio.play('build');
        UI.toast('The Skytrawler is built, now it needs turbofuel and crew');
      } else if (e.kind === 'rocketHome') {
        
        
        if (!GG.render.rocketHeard(e.id && S.node(e.id), 'land')) GG.audio.play('build');
        UI.toast('A Skytrawler is back with ' + Math.round(e.kg) + ' kg of metal');
      } else if (e.kind === 'array') {
        GG.audio.play('build');
        













        const at = C.nodeTypes[e.type] || {}, ar = at.recipe || {};
        const an = at.name || 'Grid Foundry';
        






        UI.toast(ar.ci
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
        UI.toast('A ' + (ft.name || 'Tree Planter') + ' took its fertilizer — it now grows ×' +
                 U.fmt(e.mul, 2));
      } else if (e.kind === 'hireEnd') {
        UI.toast(e.n === 1 ? 'A hired hand went home' : e.n + ' hired hands went home', true);
      } else if (e.kind === 'forecast') {
        









        if (mastTold(e.loc)) {
          GG.audio.play('forecast');
          UI.toast(e.name + ' incoming over ' + locName(e.loc) + ' — ' + e.sec + 's');
        }
      } else if (e.kind === 'revive') {
        



        GG.audio.play('skill');
        



        UI.toast(e.name + ' — coming back, stage ' + e.stage + ' of ' + e.of);
      } else if (e.kind === 'wx') {
        

        UI.syncWeatherSound();
        

        if (UI.wxTold(e.loc)) UI.toast(C.weather.shortNotice !== false
          ? e.name + ' over ' + locName(e.loc)
          : e.name + ' over ' + locName(e.loc) + ' — ' + e.desc);
      } else if (e.kind === 'wxBlocked') {
        


        if (UI.wxTold(e.loc)) {
          GG.audio.play('skill');
          UI.toast('Your Surge Arrestors caught it — the grid is untouched');
        }
      } else if (e.kind === 'strikeCharge') {
        


        if (UI.wxTold(e.loc)) {
          GG.audio.play('skill');
          UI.toast('The Strike Vault took the bolt: %c KW banked'
                   .replace('%c', GG.util.small(e.kw)));
        }
      } else if (e.kind === 'wxEnd') {
        


        GG.audio.ambienceStop();
        
        if (e.endSound && S.g.loc === e.loc) GG.audio.ambience(e.endSound);
        if (UI.wxTold(e.loc))
          UI.toast('The ' + e.name.toLowerCase() + ' has passed over ' + locName(e.loc), true);
      


      








      } else if (e.kind === 'gridDown') {
        if (UI.wxTold(e.loc) && Sim.gridMatters(e.loc))
          UI.toast('The grid in ' + locName(e.loc) + ' is down — go there and restart it', true);
      } else if (e.kind === 'gridUp') {
        if (UI.wxTold(e.loc) && Sim.gridMatters(e.loc)) {
          GG.audio.play('skill');
          UI.toast('The grid in ' + locName(e.loc) + ' is back up');
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
           UI.fullCircleOpen();
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
    



    if (activeTree === 'summary') { renderTreeSummary(); return; }
    el.treeInner.classList.remove('summary');
    const sum = el.treeInner.querySelector('.ts-wrap');
    if (sum) sum.remove();
    const list = skillsOfTree();
    const byId = {};
    C.skills.forEach(s => byId[s.id] = s);

    el.treeNote.textContent = activeTree === 'money'
      ? GG.i18n.t('ui.moneyTreeNote')
      : GG.i18n.t('ui.ciTreeNote');

    
    
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
        '</div>';
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
  UI.toast = function (msg, bad) {
    


    msg = GG.i18n.msg(msg);
    const now = performance.now();
    if (msg === lastToast.msg && now - lastToast.at < 700) return;
    lastToast = { msg: msg, at: now };
    const d = document.createElement('div');
    d.className = 'toast' + (bad ? ' bad' : '');
    






    d.dataset.kind = GG.i18n.t(bad ? 'ui.toastBad' : 'ui.toastNote');
    d.textContent = msg;
    el.toasts.appendChild(d);
    setTimeout(() => d.classList.add('out'), 1600);
    setTimeout(() => d.remove(), 2100);
  };

  
  UI.spark = function (x, y, text, bad) {
    const d = document.createElement('div');
    d.className = 'spark' + (bad ? (bad === true ? ' bad' : ' ' + bad) : '');
    d.textContent = text;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    el.sparks.appendChild(d);
    setTimeout(() => d.remove(), 900);
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
                    (e.gem ? '<b class="ax-chip gem">+' + e.gem + ' ◆</b>' : '');
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
