GG.overlay = (function () {
  'use strict';
  const O = {};
  const C = GG.config, S = GG.state, R = GG.render, U = GG.util, IC = GG.icons;
  const T = k => GG.i18n.t(k);
  const cfg = () => C.overlay || {};
  const OPEN_KEY = 'earthregen.overlayOpen', GONE_KEY = 'earthregen.overlayGone';

  let mode = 'off', res = 'energy', lastMat = null, chainId = null, legSig = '';
  const look = k => ((cfg().look || {})[k]) || 'old';
  const wasteOn = () => !!(cfg().waste && cfg().waste.enabled);
  const chainOn = () => !!(cfg().chain && cfg().chain.enabled);
  let bar = null, tip = null, findOpen = false, findQ = '', hoverLink = null, sig = '';
  let open = (function () { try { return localStorage.getItem(OPEN_KEY) !== 'shut'; } catch (e) { return true; } })();

  let gone = (function () { try { return localStorage.getItem(GONE_KEY) === 'gone'; } catch (e) { return false; } })();
  const canHide = () => cfg().hideButton !== false;

  O.on = function () { return cfg().enabled !== false; };

  O.ready = function () {
    const g = S.g, rv = C.reveal;
    if (!g) return false;
    if (!rv || rv.enabled === false || !(rv.items || {}).overlay) return true;
    return !!(g.seenUi || {}).overlay;
  };
  const live = () => O.on() && O.ready();
  O.mode = function () { return mode; };
  O.set = function (m, r) { mode = m; if (r) res = r; sig = ''; };
  O.res = function () { return res; };

  let litNow = [];
  O.lit = function () { return litNow; };

  O.chain = function (id) { if (id !== undefined) { chainId = id; legSig = ''; } return chainId; };

  function storeRes(n) {
    const t = S.type(n);
    if (!t || !t.mergeLock || n.grade) return undefined;
    return Object.keys(n.buf || {}).find(r => (n.buf[r] || 0) > 1e-9 && C.resources[r]) || null;
  }
  function resAt(n, p, dir) {
    const u = storeRes(n);
    if (u !== undefined) return u;
    return (S.portRes && S.portRes(n, p, dir)) || p.res;
  }
  function wireRes(l) {
    const a = S.node(l.from); if (!a) return null;
    const p = S.portsOf(a, 'out').find(q => q.id === l.fromPort); if (!p) return null;
    return resAt(a, p, 'out');
  }
  function resHere() {
    const count = {};
    S.g.links.forEach(l => { const a = S.node(l.from); if (!a || !S.here(a)) return; const r = wireRes(l); if (r) count[r] = (count[r] || 0) + 1; });
    const rank = r => r === 'energy' ? 0 : r === 'wf' ? 1 : 2;
    return Object.keys(count).sort((x, y) => rank(x) - rank(y) || count[y] - count[x]).map(r => [r, count[r]]);
  }
  const resName = r => T((C.resources[r] || {}).name || r);
  const resCol = r => (C.resources[r] || {}).color || '#7ee0c0';
  function gives(n, r) {
    return S.portsOf(n, 'out').some(p => resAt(n, p, 'out') === r);
  }
  function litFor(r, nodes, mine) {
    const outOnly = (cfg().outputsOnly || []).indexOf(r) >= 0, ids = new Set();
    mine.forEach(l => { ids.add(l.from); if (!outOnly) ids.add(l.to); });
    nodes.forEach(n => { if (outOnly ? gives(n, r) : machineUses(n, r)) ids.add(n.id); });
    return nodes.filter(n => ids.has(n.id));
  }

  O.litHere = function (r) {
    const links = S.g.links.filter(l => { const a = S.node(l.from); return a && S.here(a); });
    return litFor(r, S.machinesHere(), links.filter(l => wireRes(l) === r));
  };
  function machineUses(n, r) {
    return ['in', 'out'].some(dir => S.portsOf(n, dir).some(p => resAt(n, p, dir) === r ||
      (dir === 'in' && (p.accepts || []).length === 1 && p.accepts[0] === r)));
  }
  function stateOf(n) {
    const d = GG.sim.diagnose ? GG.sim.diagnose(n) : null;
    const busy = Object.keys(n.rates || {}).some(key => (n.rates[key] || 0) > 1e-3);
    return { kind: d ? (d.level === 'stop' ? 'stop' : 'slow') : (busy ? 'work' : 'idle'), why: d ? d.why : '' };
  }
  const KIND = { work: ['ui.ov.work', '#6fd08c'], slow: ['ui.ov.slow', '#f0b36a'], stop: ['ui.ov.stop', '#e06c6c'], idle: ['ui.ov.idle', '#8a97a6'] };
  const WASTE_COL = '#ff9a40';

  function wasteOf(n) {
    const t = S.type(n), Sim = GG.sim, o = { kw: 0, wf: 0, gkw: (n.rateIn && n.rateIn.kw) || 0, gwf: (n.rateIn && n.rateIn.wf) || 0, why: '' };
    if (t.store) {
      const d = Sim.diagnose ? Sim.diagnose(n) : null;
      if (d && d.word === 'FULL' && Sim.storeIn) { const inn = Sim.storeIn(n); o.gkw = inn; o.kw = Math.max(0, inn - (n.outRate || 0)); o.why = 'ui.ov.wFull'; }
      return o;
    }
    if (t.splitter || t.merge || t.ways) return o;
    const making = Object.keys(n.rates || {}).some(q => (q.indexOf('out:') === 0 || q.indexOf('v:') === 0 || q === 'work') && n.rates[q] > 1e-6);
    const kind = stateOf(n).kind;
    if ((kind === 'stop' || kind === 'idle' || !making) && (o.gkw > 1e-6 || o.gwf > 1e-6)) { o.kw = o.gkw; o.wf = o.gwf; o.why = 'ui.ov.wIdle'; return o; }
    const stat = f => (Sim.stat ? Sim.stat(t.id, f) : t[f]) || 0;
    const matIn = S.portsOf(n, 'in').reduce((a, p) => { const r = (S.portRes && S.portRes(n, p, 'in')) || p.res;
      return a + ((C.resources[r] || {}).flow === 'material' ? ((n.rates || {})['in:' + p.id] || 0) : 0); }, 0);

    if (t.wasteRule === 'twoPull') {
      const PP = Sim.prismPer ? Sim.prismPer(n) : 1;
      if (matIn > 1e-9 && o.gwf <= 1e-6) { const need = 2 * stat('energyPerKg') * matIn * PP; if (o.gkw > need * 1.02 + 1e-6) { o.kw = o.gkw - need; o.why = 'ui.ov.wMore'; } }
      if (matIn > 1e-9 && o.gkw <= 1e-6) { const need = 2 * stat('wfPerKg') * matIn * PP; if (o.gwf > need * 1.02 + 1e-6) { o.wf = o.gwf - need; o.why = 'ui.ov.wMoreWf'; } }
      return o;
    }
    const soak = Sim.powerSoak ? Sim.powerSoak(n) : null;
    if (soak !== null && o.gkw > soak * 1.02 + 1e-6) { o.kw = o.gkw - soak; o.why = 'ui.ov.wCap'; }
    else if (t.energyPerKg) { const need = stat('energyPerKg') * matIn; if (o.gkw > need * 1.02 + 1e-6) { o.kw = o.gkw - need; o.why = 'ui.ov.wMore'; } }
    if (t.wfPerKg) { const need = stat('wfPerKg') * matIn; if (o.gwf > need * 1.02 + 1e-6) { o.wf = o.gwf - need; o.why = o.why || 'ui.ov.wMoreWf'; } }
    return o;
  }
  const wShare = w => Math.max(w.gkw > 0 ? w.kw / w.gkw : 0, w.gwf > 0 ? w.wf / w.gwf : 0);
  function wasteHere() {
    const m = new Map(), min = (cfg().waste || {}).minShare || 0;
    S.machinesHere().forEach(n => { const w = wasteOf(n); if ((w.kw > 1e-6 || w.wf > 1e-6) && wShare(w) >= min) m.set(n.id, w); });
    return m;
  }
  O.wasteHere = wasteHere;

  function chainSet() {
    if (!chainOn() || !chainId || !S.g) return null;
    const c = S.node(chainId);
    if (!c || !S.here(c)) { chainId = null; return null; }
    const L = S.g.links.filter(l => { const a = S.node(l.from); return a && S.here(a); });
    const nodes = new Set([c.id]), links = new Set(), dir = (cfg().chain || {}).dir || 'both';
    const walk = up => { const q = [c.id], seen = new Set(q);
      while (q.length) { const id = q.shift();
        L.forEach(l => { if ((up ? l.to : l.from) !== id) return; links.add(l.id);
          const nx = up ? l.from : l.to; if (!seen.has(nx)) { seen.add(nx); nodes.add(nx); q.push(nx); } }); } };
    if (dir !== 'down') walk(true);
    if (dir !== 'up') walk(false);
    return { nodes, links, sel: c.id };
  }
  let chainHooked = false;
  function hookChain() {
    if (chainHooked || !R.canvas) return;
    chainHooked = true;
    R.canvas.addEventListener('mousedown', function (e) {
      if (!chainOn() || !live()) return;
      if (e.button === 0) { if (chainId) { chainId = null; legSig = ''; } return; }
      if (e.button !== 2) return;
      const v = GG.input && GG.input.view;
      if ((v && (v.wire || v.ghost)) || (GG.lifter && GG.lifter.placing && GG.lifter.placing())) return;
      const rc = R.canvas.getBoundingClientRect(), z = (R.uiZoom && R.uiZoom()) || 1;
      const w = R.toWorld((e.clientX - rc.left) / z, (e.clientY - rc.top) / z);
      const onWire = (R.hitDot && R.hitDot(w.x, w.y)) || (R.hitBend && R.hitBend(w.x, w.y)) || (R.hitLink && R.hitLink(w.x, w.y));
      const n = R.hitNode ? R.hitNode(w.x, w.y) : null;
      if (!n || onWire || S.type(n).kind === 'site') { if (!n && chainId) { chainId = null; legSig = ''; } return; }
      e.stopImmediatePropagation(); e.preventDefault();
      chainId = chainId === n.id ? null : n.id; legSig = '';
      GG.audio.play('click');
    }, true);
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && chainId) { chainId = null; legSig = ''; } }, true);
  }

  function kbd(k) {
    const key = (cfg().keys || {})[k];
    if (!key || !(C.ui || {}).keyHints || (GG.input && GG.input.touchUi && GG.input.touchUi())) return '';
    return '<kbd>' + key + '</kbd>';
  }
  function icon(names, size) { const n = names.find(x => IC.has(x)); return n ? IC.svg(n, size) : ''; }
  function build() {
    if (bar || !O.on()) return;
    const rail = document.getElementById('left-rail');
    if (!rail) return;
    bar = document.createElement('div'); bar.className = 'ov-bar';
    rail.appendChild(bar);
    tip = document.createElement('div'); tip.className = 'ov-tip'; document.body.appendChild(tip);
    window.addEventListener('mousemove', hoverTip, true);
    hookChain();
  }
  function paint() {
    if (!bar) return;
    const mats = resHere().map(x => x[0]).filter(r => r !== 'energy' && r !== 'wf');
    const isMat = mode === 'res' && res !== 'energy' && res !== 'wf';
    const dot = c => '<span class="sw" style="background:' + c + '"></span>';
    const items = [
      ['power', dot(resCol('energy')), resName('energy'), mode === 'res' && res === 'energy'],
      ['crew', dot(resCol('wf')), resName('wf'), mode === 'res' && res === 'wf'],
      ['mat', dot(isMat ? resCol(res) : '#9aa7b4'), isMat ? resName(res) : T('ui.ov.mat'), isMat],
      ['status', icon(['attention', 'warn', 'help'], 14), T('ui.ov.status'), mode === 'status'],
      ['flow', icon(['split'], 14), T('ui.ov.flow'), mode === 'flow'],
    ].concat(wasteOn() ? [['waste', icon(['ovWaste'], 14), T('ui.ov.waste'), mode === 'waste']] : []).concat([
      ['off', icon(['close'], 13), T('ui.ov.off'), mode === 'off'],
    ]);
    const now = mode === 'off' ? 'transparent' : mode === 'res' ? resCol(res) : mode === 'status' ? '#f0b36a' : mode === 'waste' ? WASTE_COL : '#62d4e3';
    const btn = i => '<button type="button" data-k="' + i[0] + '" class="' + (i[3] ? 'on' : '') + '">' + i[1] + i[2] + kbd(i[0]) + '</button>';

    const fold = !canHide();
    bar.classList.toggle('shut', fold && !open);
    bar.classList.toggle('gone', gone && canHide());
    bar.classList.toggle('has-hide', canHide());
    const ha = cfg().hideAnim || {};
    if (ha.ms !== undefined) bar.style.setProperty('--ovh-ms', ha.ms + 'ms');
    if (ha.ease) bar.style.setProperty('--ovh-ease', ha.ease);
    bar.innerHTML = '<div class="ov-top"><button class="ov-head" type="button">' + (fold ? '<span class="ov-chev">' + icon(['chevron'], 14) +
      '</span>' : '') + '<span class="ov-lbl">' + T('ui.ov.head') + '</span><span class="ov-now" style="background:' + now + '"></span></button>' +
      (canHide() ? '<button class="ov-hide" type="button" title="' + T(gone ? 'ui.ov.show' : 'ui.ov.hide') + '">' + icon(['chevron'], 14) + '</button>' : '') +
      '</div>' +
      '<div class="ov-list"><div>' + items.map(i => i[0] !== 'mat' ? btn(i) :
        '<div class="ov-row">' + btn(i) + '<button class="ov-find' + (findOpen ? ' on' : '') + '" type="button" title="' + T('ui.ov.find') + '">' +
        icon(['find'], 14) + '</button></div>' +
        '<div class="ov-search' + (findOpen ? ' on' : '') + '"><input type="text" placeholder="' + T('ui.ov.find') +
        '" spellcheck="false" autocomplete="off"><div class="ov-hits"></div></div>').join('') + '</div></div>';
    bar.onmousedown = e => e.stopPropagation();
    legSig = '';
    bar.querySelector('.ov-head').onclick = function (e) {
      if (!fold) { e.stopPropagation(); bar.querySelector('.ov-hide').click(); return; }
      e.stopPropagation(); open = !open; GG.audio.play('click');
      try { localStorage.setItem(OPEN_KEY, open ? 'open' : 'shut'); } catch (x) {  }
      bar.classList.toggle('shut', !open);
    };
    const hide = bar.querySelector('.ov-hide');
    if (hide) hide.onclick = function (e) {
      e.stopPropagation(); gone = !gone; GG.audio.play('click');
      try { localStorage.setItem(GONE_KEY, gone ? 'gone' : 'here'); } catch (x) {  }
      bar.classList.toggle('gone', gone); hide.title = T(gone ? 'ui.ov.show' : 'ui.ov.hide');
      if (gone && tip) tip.style.display = 'none';
    };
    bar.querySelectorAll('.ov-list button[data-k]').forEach(b => b.onclick = function (e) {
      e.stopPropagation(); const k = b.dataset.k;

      const showing = (k === 'power' && mode === 'res' && res === 'energy') || (k === 'crew' && mode === 'res' && res === 'wf') ||
                      (k === 'mat' && isMat) || (k === mode);
      if (showing) mode = 'off';
      else if (k === 'off') mode = 'off';
      else if (k === 'power') { mode = 'res'; res = 'energy'; }
      else if (k === 'crew') { mode = 'res'; res = 'wf'; }
      else if (k === 'mat') { if (!mats.length) return; const i = isMat ? (mats.indexOf(res) + 1) % mats.length : 0; mode = 'res'; res = mats[i]; }
      else mode = k;
      if (mode === 'res' && res !== 'energy' && res !== 'wf') lastMat = res;
      GG.audio.play('click'); sig = '';
    });
    const box = bar.querySelector('.ov-search'), input = box.querySelector('input');
    input.value = findQ;
    fillHits();
    bar.querySelector('.ov-find').onclick = function (e) {
      e.stopPropagation(); findOpen = !findOpen; GG.audio.play('click');
      box.classList.toggle('on', findOpen); this.classList.toggle('on', findOpen);
      if (findOpen) { input.focus(); input.select(); fillHits(); }
    };
    input.oninput = () => { findQ = input.value; fillHits(); };
    input.onkeydown = function (e) {
      e.stopPropagation();
      if (e.key === 'Escape') { findOpen = false; sig = ''; }
      if (e.key === 'Enter') { const first = box.querySelector('.ov-hits button'); if (first) first.click(); }
    };
  }

  function fillHits() {
    const hits = bar && bar.querySelector('.ov-hits'); if (!hits) return;
    const q = findQ.trim().toLowerCase();
    const list = resHere().filter(([r]) => r !== 'energy' && r !== 'wf')
      .filter(([r]) => !q || resName(r).toLowerCase().includes(q) || r.toLowerCase().includes(q));
    hits.innerHTML = list.length ? list.map(([r, n]) => '<button type="button" data-r="' + r + '" class="' + (mode === 'res' && res === r ? 'on' : '') +
      '"><span class="sw" style="background:' + resCol(r) + '"></span>' + resName(r) + '<span class="n">' + n + '</span></button>').join('')
      : '<div class="none">' + T('ui.ov.none') + '</div>';
    hits.querySelectorAll('button').forEach(b => b.onclick = function (e) {
      e.stopPropagation(); mode = 'res'; res = lastMat = b.dataset.r; findOpen = false; findQ = ''; GG.audio.play('click'); sig = '';
    });
  }

  let roomAt = 0;
  function fitRoom() {
    const now = performance.now(); if (!bar || now - roomAt < 200) return; roomAt = now;
    const inner = bar.querySelector('.ov-list > div');
    if (!inner) return;

    const top0 = inner.getBoundingClientRect().top;
    const tops = ['minimap', 'boost-launch'].map(id => document.getElementById(id)).filter(e => e && e.offsetHeight)
      .map(e => e.getBoundingClientRect()).filter(r => r.left < bar.getBoundingClientRect().right && r.top > top0).map(r => r.top);
    if (!tops.length) { inner.style.removeProperty('max-height'); return; }
    const gz = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gz')) || 1;
    const room = Math.max(56, (Math.min.apply(null, tops) - 10 - top0) / gz);
    inner.style.maxHeight = Math.floor(room) + 'px';
  }

  function sync() {
    if (!bar) build();
    if (!bar) return;
    const s = [GG.i18n.lang ? GG.i18n.lang() : '', S.g && S.g.loc, mode, res, S.g ? S.g.links.length : 0].join('|');
    if (s === sig) return;
    if (tip) tip.style.display = 'none';
    if (mode === 'res' && S.g) { const here = resHere().map(x => x[0]); if (here.length && here.indexOf(res) < 0) res = here[0]; }
    sig = s; paint();
  }

  function onKey(e) {
    if (!live() || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (GG.menu && GG.menu.isOpen && GG.menu.isOpen()) return;
    const keys = cfg().keys || {}, k = Object.keys(keys).find(x => keys[x] && keys[x] === e.key);
    if (!k || (k === 'waste' && !wasteOn())) return;
    e.preventDefault(); e.stopPropagation();
    const isMat = mode === 'res' && res !== 'energy' && res !== 'wf';
    const showing = (k === 'power' && mode === 'res' && res === 'energy') || (k === 'crew' && mode === 'res' && res === 'wf') ||
                    (k === 'mat' && isMat) || (k === mode);
    if (showing) mode = 'off';
    else if (k === 'power') { mode = 'res'; res = 'energy'; }
    else if (k === 'crew') { mode = 'res'; res = 'wf'; }
    else if (k === 'mat') {
      const mats = resHere().map(x => x[0]).filter(r => r !== 'energy' && r !== 'wf');
      if (!mats.length) { GG.audio.play('deny'); return; }
      mode = 'res'; res = lastMat && mats.indexOf(lastMat) >= 0 ? lastMat : mats[0]; lastMat = res;
    } else mode = k;
    GG.audio.play('click'); sig = '';
  }
  window.addEventListener('keydown', onKey, true);

  function showTip(e, html) {
    tip.innerHTML = html; tip.style.display = 'block';
    const z = (R.uiZoom && R.uiZoom()) || 1;
    const x = e.clientX / z + 16, y = e.clientY / z + 14, vw = window.innerWidth / z, vh = window.innerHeight / z;
    tip.style.left = Math.max(4, Math.min(x, vw - tip.offsetWidth - 8)) + 'px';
    tip.style.top = Math.max(4, Math.min(y, vh - tip.offsetHeight - 8)) + 'px';
  }
  function hoverTip(e) {
    if (!tip) return;
    hoverLink = null;
    if ((mode !== 'status' && mode !== 'flow' && mode !== 'waste') || e.target !== R.canvas) { tip.style.display = 'none'; return; }
    const r = R.canvas.getBoundingClientRect(), z = R.uiZoom ? R.uiZoom() : 1;
    const w = R.toWorld((e.clientX - r.left) / z, (e.clientY - r.top) / z);
    if (mode === 'waste') {
      const n = R.hitNode ? R.hitNode(w.x, w.y) : null, ws = n && wasteHere().get(n.id);
      if (!ws) { tip.style.display = 'none'; return; }

      const line = (rr, g, l) => '<div>' + T('ui.ov.wLine').replace('%r', resName(rr)).replace('%g', U.fmt(g)).replace('%l', U.fmt(l)) + '</div>';
      showTip(e, '<b>' + T(S.type(n).name) + '</b><span class="ov-st" style="color:' + WASTE_COL + '">' + T('ui.ov.wasting') + '</span><div>' +
        T(ws.why) + '</div>' + (ws.kw > 0 ? line('energy', ws.gkw, ws.kw) : '') + (ws.wf > 0 ? line('wf', ws.gwf, ws.wf) : ''));
      return;
    }
    if (mode === 'flow') {

      const l = R.hitLink ? R.hitLink(w.x, w.y) : null;
      if (!l) { tip.style.display = 'none'; return; }
      hoverLink = l.id;
      const rr = wireRes(l) || 'trash', unit = (C.resources[rr] || {}).rate || '', a = S.node(l.from), b = S.node(l.to), f = l.flow || 0;
      showTip(e, '<b><span style="color:' + resCol(rr) + '">●</span> ' + resName(rr) + '</b>' +
        '<span class="ov-amt' + (f > 1e-6 ? '' : ' dim') + '">' + (f > 1e-6 ? U.fmt(f) + ' ' + GG.i18n.ins(unit) : T('ui.ov.empty')) + '</span>' +
        '<div>' + (a ? T(S.type(a).name) : '?') + ' → ' + (b ? T(S.type(b).name) : '?') + '</div>');
      return;
    }
    const n = R.hitNode ? R.hitNode(w.x, w.y) : null;
    if (!n) { tip.style.display = 'none'; return; }
    const s = stateOf(n), k = KIND[s.kind];

    const why = s.why ? GG.i18n.ins(s.why) : T(s.kind === 'work' ? 'ui.ov.workWhy' : 'ui.ov.idleWhy');
    showTip(e, '<b>' + T(S.type(n).name) + '</b><span class="ov-st" style="color:' + k[1] + '">' + T(k[0]) + '</span><div>' + why + '</div>');
  }

  function cardRect(n, P, k) {
    const z = S.sizeOf(n), q = P(n.x - z.w / 2, n.y - z.h / 2);
    return { x: q.x, y: q.y, w: z.w * k, h: z.h * k };
  }
  function wirePts(l, P) {
    const a = S.node(l.from), b = S.node(l.to);
    if (!a || !b || !S.here(a)) return null;
    const pp = R.linkPts(l, a, b), sq = R.wireOrtho(l), out = [];
    for (let i = 0; i <= 32; i++) { const w = R.wireAt(pp[0], pp[1], sq, i / 32); out.push(P(w.x, w.y)); }
    return out;
  }
  function stroke(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); }
  function rgba(hex, a) {
    const h = String(hex).replace('#', ''), n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function shade(ctx, cw, ch, holes, a) {
    ctx.beginPath(); ctx.rect(0, 0, cw, ch);
    holes.forEach(r => ctx.rect(r.x - 3, r.y - 3, r.w + 6, r.h + 6));
    ctx.fillStyle = 'rgba(4,7,11,' + a + ')'; ctx.fill('evenodd');
  }
  function dots(ctx, pts, t, k) {
    ctx.fillStyle = '#ffffff';
    for (let j = 0; j < 3; j++) {
      const u = (t * 0.35 + j / 3) % 1, i = Math.min(pts.length - 2, Math.floor(u * (pts.length - 1))), f = u * (pts.length - 1) - i;
      ctx.beginPath(); ctx.arc(pts[i].x + (pts[i + 1].x - pts[i].x) * f, pts[i].y + (pts[i + 1].y - pts[i].y) * f, Math.max(2, 4 * k), 0, 6.2832); ctx.fill();
    }
  }

  let wireBuf = null;
  function grabWires(ls, P, k) {
    const cv = R.canvas, dpr = cv.width / cv.clientWidth;
    if (!wireBuf) wireBuf = document.createElement('canvas');
    if (wireBuf.width !== cv.width || wireBuf.height !== cv.height) { wireBuf.width = cv.width; wireBuf.height = cv.height; }
    const g = wireBuf.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, cv.width, cv.height);
    if (!ls.length) return null;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#fff'; g.lineWidth = Math.max(5, 9 * k);
    ls.forEach(l => { const pts = wirePts(l, P); if (pts) stroke(g, pts); });
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.drawImage(cv, 0, 0); g.globalCompositeOperation = 'source-over';
    return wireBuf;
  }
  function putWires(ctx, buf) { if (!buf) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(buf, 0, 0); ctx.restore(); }
  function grey(ctx, cw, ch, cards, P, k) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, cw, ch);
    cards.forEach(n => { const r = cardRect(n, P, k); ctx.rect(r.x - 3, r.y - 3, r.w + 6, r.h + 6); });
    ctx.clip('evenodd');
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(6,9,13,' + (cfg().grey === undefined ? 0.38 : cfg().grey) + ')'; ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
  }
  function ring(ctx, n, P, k, col, lw, glow) {
    const r = cardRect(n, P, k);
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.shadowColor = col; ctx.shadowBlur = glow;
    ctx.beginPath(); ctx.roundRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6, 12 * k + 3); ctx.stroke(); ctx.shadowBlur = 0;
  }

  function badPorts(n) {
    const d = GG.sim.diagnose ? GG.sim.diagnose(n) : null;
    if (!d || d.level !== 'stop') return [];
    const t = S.type(n), out = [], word = String(d.word || ''), why = String(d.why || '');
    if (/BLOCKED|NO WIRE|FULL/.test(word)) {
      S.portsOf(n, 'out').forEach(p => {
        const wired = S.linksFrom(n.id).some(l => l.fromPort === p.id), full = n.obuf && t.outBuffer && (n.obuf[p.id] || 0) >= t.outBuffer - 1e-6;
        if (!wired || full) out.push(['out', p]);
      });
      return out;
    }
    const byName = x => Object.keys(C.resources).find(r => r.toLowerCase() === x.toLowerCase() || String(C.resources[r].name || '').toLowerCase() === x.toLowerCase());
    let want = null;
    const m = /Waiting on (.+)$/i.exec(why);
    if (m) want = byName(m[1].trim()) || (/work|crew/i.test(m[1]) ? 'wf' : /power|energy/i.test(m[1]) ? 'energy' : null);
    if (!want && /POWER|ENERGY/.test(word)) want = 'energy';
    if (!want && /CREW|WORK/.test(word)) want = 'wf';
    if (!want && /^NO /.test(word)) want = byName(word.slice(3));
    const pu = t.powerUp && t.powerUp.port;
    S.portsOf(n, 'in').forEach(p => {
      if (p.id === pu) return;
      const r = (S.portRes && S.portRes(n, p, 'in')) || p.res, acc = p.accepts || [r];
      if (want) { if (r === want || acc.indexOf(want) >= 0) out.push(['in', p]); return; }
      const l = S.linkInto(n.id, p.id);
      if (!l || !((l.flow || 0) > 1e-6)) out.push(['in', p]);
    });
    return out;
  }
  O.badPorts = badPorts;
  function sockets(ctx, P, k, t, only) {
    S.machinesHere().filter(n => !only || only.has(n.id)).forEach(n => badPorts(n).forEach(([dir, p], i) => {
      const w = R.portPos(n, dir, p.id), q = P(w.x, w.y), r0 = Math.max(5, 7 * k), u = (t * 1.1 + i * 0.3) % 1;
      ctx.strokeStyle = 'rgba(255,92,92,' + (1 - u).toFixed(3) + ')'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(q.x, q.y, r0 * (1 + 1.4 * u), 0, 6.2832); ctx.stroke();
      ctx.fillStyle = 'rgba(255,92,92,' + (0.55 + 0.35 * Math.sin(t * 6.2832)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(q.x, q.y, r0 * 0.75, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = '#ffd0d0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, r0 * 0.75, 0, 6.2832); ctx.stroke();
    }));
  }

  function legendHTML(tr) {
    const row = (sw, txt) => '<div class="lr">' + sw + '<span>' + txt + '</span></div>', note = s2 => '<div class="lr note">' + s2 + '</div>';
    const ringSw = (c, glow) => '<i class="ring" style="border-color:' + c + (glow ? ';box-shadow:0 0 ' + glow + 'px ' + c : '') + '"></i>';
    if (tr) return '<div class="hd">' + T('ui.ov.lgChain') + '</div>' + row(ringSw('#ffffff', 6), T('ui.ov.lgPicked')) +
      row(ringSw('#9fd8ff', 5), T('ui.ov.lgLinked')) + note(T('ui.ov.lgBack'));
    if (mode === 'off') return chainOn() ? note(T('ui.ov.lgHint')) : '';
    if (mode === 'res') {
      const c = resCol(res), outOnly = (cfg().outputsOnly || []).indexOf(res) >= 0;
      return row(ringSw(c, look('res') === 'old' ? 0 : 6), T(outOnly ? 'ui.ov.lgGives' : 'ui.ov.lgUses').replace('%r', resName(res))) +
        row('<i class="ln" style="border-color:' + c + '"></i>', T('ui.ov.lgCarry')) +
        (look('res') === 'old' ? row('<i class="dash" style="border-color:' + rgba(c, 0.6) + '"></i>', T('ui.ov.lgNothing')) : '');
    }
    if (mode === 'status') {
      const pr = look('status') === 'problems';
      let h = (pr ? ['slow', 'stop'] : ['work', 'slow', 'stop', 'idle']).map(k => row(ringSw(KIND[k][1], pr ? 6 : 0), T(KIND[k][0]))).join('');
      if (pr) h += note(T('ui.ov.lgGrey'));
      if (cfg().sockets !== false) h += row('<i class="pulse"></i>', T('ui.ov.lgSock'));
      return h + note(T('ui.ov.lgHoverM'));
    }
    if (mode === 'flow') return row('<i class="ln" style="border-top-width:2px;border-color:#62d4e3"></i>', T('ui.ov.lgLittle')) +
      row('<i class="ln" style="border-top-width:7px;border-color:#62d4e3"></i>', T('ui.ov.lgLot')) +
      row('<i class="dash" style="border-color:#8ca0b4"></i>', T('ui.ov.lgNothing')) + note(T('ui.ov.lgHoverW'));
    if (mode === 'waste') return row(ringSw('#ffaa3c', 3), T('ui.ov.lgWLittle')) + row(ringSw('#ff823c', 9), T('ui.ov.lgWMost')) +
      ((cfg().waste || {}).wires !== false ? row('<i class="ln" style="border-color:#c9d3dd"></i>', T('ui.ov.lgWWires')) : '') + note(T('ui.ov.lgHoverN'));
    return '';
  }
  function syncLegend(tr) {
    if (!bar) return;
    const list = bar.querySelector('.ov-list > div'); if (!list) return;
    let el = list.querySelector('.ov-legend');
    const s2 = [cfg().legend !== false, mode, res, tr ? tr.sel : '', GG.i18n.lang ? GG.i18n.lang() : ''].join('|');
    if (el && s2 === legSig) return;
    legSig = s2;
    const html = cfg().legend === false ? '' : legendHTML(tr);
    if (!html) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.className = 'ov-legend'; list.appendChild(el); }
    el.innerHTML = html;
  }

  function badgesOnTop(time) {
    if (cfg().wxOnTop === false || !litNow.length || !R.wxBadgeOn) return;
    litNow.forEach(n => R.wxBadgeOn(n, time));
  }
  O.draw = function (time) {
    litNow = [];
    if (!live()) { if (mode !== 'off' || chainId) { mode = 'off'; chainId = null; sig = ''; legSig = ''; } return; }
    const tr = chainSet();
    if (mode === 'off' && !tr) { syncLegend(null); return; }
    const cv = R.canvas, ctx = cv.getContext('2d'), dpr = cv.width / cv.clientWidth;
    const P = (x, y) => R.toScreen(x, y), k = P(1, 0).x - P(0, 0).x, t = (window.performance ? performance.now() : Date.now()) / 1000;
    const cw = cv.clientWidth, ch = cv.clientHeight, dim = cfg().dim || 0.7;
    ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const nodes = S.machinesHere(), links = S.g.links.filter(l => { const a = S.node(l.from); return a && S.here(a); });
    if (tr) {

      const mine = nodes.filter(n => tr.nodes.has(n.id)), buf = grabWires(links.filter(l => tr.links.has(l.id)), P, k);
      grey(ctx, cw, ch, mine, P, k); putWires(ctx, buf); litNow = mine;
      mine.forEach(n => { const me = n.id === tr.sel;
        if (mode === 'status') ring(ctx, n, P, k, KIND[stateOf(n).kind][1], me ? 3.5 : 2, me ? 20 : 10);
        else ring(ctx, n, P, k, me ? '#ffffff' : '#9fd8ff', me ? 3 : 2, me ? 18 : 10); });
      if (mode === 'status' && cfg().sockets !== false) sockets(ctx, P, k, t, tr.nodes);
      ctx.restore(); badgesOnTop(time); syncLegend(tr); return;
    }
    if (mode === 'res' && look('res') !== 'old') {
      const lit = litFor(res, nodes, links.filter(l => wireRes(l) === res)), col = resCol(res);
      const buf = grabWires(links.filter(l => wireRes(l) === res), P, k);
      grey(ctx, cw, ch, lit, P, k); putWires(ctx, buf); litNow = lit;
      lit.forEach(n => ring(ctx, n, P, k, col, 2.5, 14));
    } else if (mode === 'res') {
      const col = resCol(res), mine = links.filter(l => wireRes(l) === res);

      const lit = litFor(res, nodes, mine); litNow = lit;
      shade(ctx, cw, ch, lit.map(n => cardRect(n, P, k)), dim);
      mine.forEach(l => {
        const pts = wirePts(l, P); if (!pts) return;
        const on = (l.flow || 0) > 1e-6;
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(col, 0.22); ctx.lineWidth = Math.max(6, 14 * k); stroke(ctx, pts);
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = on ? col : rgba(col, 0.5); ctx.lineWidth = Math.max(2, 4 * k);
        if (!on) ctx.setLineDash([8, 7]);
        stroke(ctx, pts); ctx.setLineDash([]);
        if (on && cfg().dots !== false) dots(ctx, pts, t + l.id.length, k);
      });
      lit.forEach(n => { const r = cardRect(n, P, k); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6, 12 * k + 3); ctx.stroke(); });
    }
    if (mode === 'status' && look('status') !== 'old') {

      const pr = look('status') === 'problems', kinds = new Map(nodes.map(n => [n.id, stateOf(n).kind]));
      const keep = nodes.filter(n => pr ? (kinds.get(n.id) === 'slow' || kinds.get(n.id) === 'stop') : kinds.get(n.id) !== 'idle');
      grey(ctx, cw, ch, keep, P, k); litNow = keep;
      keep.forEach(n => { const kd = kinds.get(n.id), col = KIND[kd][1];
        if (kd === 'work') ring(ctx, n, P, k, rgba(col, 0.75), 1.5, 0); else ring(ctx, n, P, k, col, kd === 'stop' ? 3 : 2.5, kd === 'stop' ? 18 : 12); });
      if (!pr) nodes.filter(n => kinds.get(n.id) === 'idle').forEach(n => ring(ctx, n, P, k, rgba(KIND.idle[1], 0.6), 1.5, 0));
    } else if (mode === 'status') {
      shade(ctx, cw, ch, [], dim * (cfg().statusDim || 0.55));
      nodes.forEach(n => {
        const kind = stateOf(n).kind, r = cardRect(n, P, k), col = KIND[kind][1];
        ctx.fillStyle = rgba(col, kind === 'work' ? 0.16 : 0.26); ctx.strokeStyle = col; ctx.lineWidth = kind === 'work' ? 2 : 3;
        ctx.beginPath(); ctx.roundRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, 12 * k + 2); ctx.fill(); ctx.stroke();
      });
    }
    if (mode === 'status' && cfg().sockets !== false) sockets(ctx, P, k, t, null);
    if (mode === 'flow' && look('flow') !== 'old') {

      grey(ctx, cw, ch, [], P, k);
      const max = Math.max(1e-6, ...links.map(l => l.flow || 0));
      links.slice().sort((a, b) => (a.flow || 0) - (b.flow || 0)).forEach(l => {
        const pts = wirePts(l, P); if (!pts) return;
        const f = (l.flow || 0) / max, hot = l.id === hoverLink;
        if (f <= 1e-4) { ctx.strokeStyle = hot ? 'rgba(255,255,255,.8)' : 'rgba(150,165,180,.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 6]); stroke(ctx, pts); ctx.setLineDash([]); return; }
        const sf = Math.sqrt(f), lw = Math.max(2, (2 + 14 * sf) * Math.min(1.5, k * 2));
        if (hot) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = lw + 5; stroke(ctx, pts); }
        ctx.strokeStyle = resCol(wireRes(l) || 'trash'); ctx.lineWidth = lw; stroke(ctx, pts);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, lw * 0.28);
        ctx.setLineDash([Math.max(5, 10 * k), Math.max(10, 20 * k)]); ctx.lineDashOffset = -t * (20 + 90 * sf); stroke(ctx, pts);
        ctx.setLineDash([]); ctx.lineDashOffset = 0;
      });
    } else if (mode === 'flow') {
      shade(ctx, cw, ch, [], dim);
      const max = Math.max(1e-6, ...links.map(l => l.flow || 0));
      links.slice().sort((a, b) => (a.flow || 0) - (b.flow || 0)).forEach(l => {
        const pts = wirePts(l, P); if (!pts) return;
        const f = (l.flow || 0) / max, col = resCol(wireRes(l) || 'trash'), hot = l.id === hoverLink;
        if (f <= 1e-4) { ctx.strokeStyle = hot ? 'rgba(255,255,255,.8)' : 'rgba(140,160,180,.25)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]); stroke(ctx, pts); ctx.setLineDash([]); return; }
        const lw = Math.max(2, (2 + 16 * Math.sqrt(f)) * Math.min(1.5, k * 2));
        if (hot) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = lw + 5; stroke(ctx, pts); }
        ctx.strokeStyle = rgba(col, 0.85); ctx.lineWidth = lw; stroke(ctx, pts);
      });
    }
    if (mode === 'waste') {

      const ws = wasteHere(), mine = nodes.filter(n => ws.has(n.id));
      const feeds = (cfg().waste || {}).wires === false ? [] : links.filter(l => { const w = ws.get(l.to); if (!w) return false;
        const r = wireRes(l); return (r === 'energy' && w.kw > 0) || (r === 'wf' && w.wf > 0); });
      const buf = grabWires(feeds, P, k);
      grey(ctx, cw, ch, mine, P, k); putWires(ctx, buf); litNow = mine;
      mine.forEach(n => { const a = Math.min(1, wShare(ws.get(n.id))); ring(ctx, n, P, k, 'rgb(255,' + Math.round(170 - 40 * a) + ',60)', 2 + 1.5 * a, 8 + 16 * a); });
    }
    ctx.restore();
    badgesOnTop(time);
    syncLegend(null);
  };

  function drawMini() {
    const cv = document.querySelector('#minimap canvas'); if (!cv || !cv.width) return;
    const o = (C.ui || {}).minimap || {}, Wm = o.w || 200, Hm = o.h || 130, dpr = cv.width / Wm, box = R.contentBox && R.contentBox();
    if (!box) return;
    const mg = o.margin === undefined ? 0.06 : o.margin, kk = Math.min(Wm / Math.max(1, box.w * (1 + 2 * mg)), Hm / Math.max(1, box.h * (1 + 2 * mg)));
    const px = a => Wm / 2 + (a - box.cx) * kk, py = b => Hm / 2 + (b - box.cy) * kk;
    const g = cv.getContext('2d'); g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = 'rgba(4,7,11,0.62)'; g.fillRect(0, 0, Wm, Hm);
    const L = S.g.links.filter(l => { const a = S.node(l.from); return a && S.here(a); }), nodes = S.machinesHere(), dot = o.minDot || 2, tr = chainSet();
    const rect = (n, c) => { const sz = S.sizeOf(n), w = Math.max(dot, sz.w * kk), h = Math.max(dot, sz.h * kk); g.fillStyle = c; g.fillRect(px(n.x) - w / 2, py(n.y) - h / 2, w, h); };
    const line = (l, c, lw) => { const a = S.node(l.from), b = S.node(l.to); if (!a || !b) return; g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.moveTo(px(a.x), py(a.y)); g.lineTo(px(b.x), py(b.y)); g.stroke(); };
    if (tr) {
      L.filter(l => tr.links.has(l.id)).forEach(l => line(l, resCol(wireRes(l) || 'trash'), 1.5));
      nodes.filter(n => tr.nodes.has(n.id)).forEach(n => rect(n, n.id === tr.sel ? '#ffffff' : (mode === 'status' ? KIND[stateOf(n).kind][1] : '#9fd8ff')));
    } else if (mode === 'res') {
      const c = resCol(res), mine = L.filter(l => wireRes(l) === res), lit = new Set(litFor(res, nodes, mine).map(n => n.id));
      mine.forEach(l => line(l, c, 1.3)); nodes.filter(n => lit.has(n.id)).forEach(n => rect(n, c));
    } else if (mode === 'status') {
      const pr = look('status') === 'problems';
      nodes.forEach(n => { const kd = stateOf(n).kind; if (!pr || kd === 'slow' || kd === 'stop') rect(n, KIND[kd][1]); });
    } else if (mode === 'flow') {
      const max = Math.max(1e-6, ...L.map(l => l.flow || 0));
      L.forEach(l => { const f = (l.flow || 0) / max; if (f > 1e-4) line(l, rgba(resCol(wireRes(l) || 'trash'), 0.9), 0.8 + 3 * Math.sqrt(f)); });
    } else if (mode === 'waste') {
      const ws = wasteHere(); nodes.filter(n => ws.has(n.id)).forEach(n => rect(n, 'rgba(255,150,60,' + (0.5 + 0.5 * Math.min(1, wShare(ws.get(n.id)))) + ')'));
    }
    const v = R.viewWorld && R.viewWorld();
    if (v) { g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.5; g.strokeRect(px(v.x0), py(v.y0), (v.x1 - v.x0) * kk, (v.y1 - v.y0) * kk); }
    g.restore();
  }
  if (GG.ui && GG.ui.syncMinimap) {
    const mmCore = GG.ui.syncMinimap;
    let mmWas = false;
    GG.ui.syncMinimap = function (force) {
      const on = live() && cfg().minimap !== false && (mode !== 'off' || !!chainSet());
      const r = mmCore.call(this, force || on || mmWas);
      mmWas = on;
      if (on) { try { drawMini(); } catch (e) { if (window.console) console.error(e); } }
      return r;
    };
  }

  setInterval(function () {
    if (!GG.audio || !GG.audio.duck) return;
    GG.audio.duck(live() && mode !== 'off' && !(GG.menu && GG.menu.isOpen && GG.menu.isOpen()));
  }, 200);

  const core = R.draw;
  R.draw = function (time, ui) {
    core(time, ui);
    try { sync(); fitRoom(); O.draw(time); } catch (e) { if (window.console) console.error(e); }
  };
  return O;
})();
