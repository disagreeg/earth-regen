GG.codexGrid = (function () {
  'use strict';
  const W = window, D = document;
  let G = null;
  const opt = { anim: 'a', flip: 'deck', arrows: 'on', ratios: 'b' };
  const CFG = () => (GG.config.ui && GG.config.ui.codexGrid) || {};
  const dur = () => CFG().openMs || 300, flipDur = () => CFG().flipMs || 300;
  const ru = () => GG.i18n.lang && GG.i18n.lang() === 'ru';

  function L(k) {
    let s = GG.i18n.t('cg.' + k);
    for (let i = 1; i < arguments.length; i++) s = s.split('%' + i).join(arguments[i]);
    return s;
  }

  const lbl = en => {
    const m = /^After (\d+) loads$/.exec(en);
    if (m) return L('l.afterLoads', m[1]);
    const k = 'cg.l.' + en, v = GG.i18n.t(k);
    return v === k ? GG.i18n.ins(en) : v;
  };

  const LOCK = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const CHEV = d => '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="' + (d < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7') + '"/></svg>';

  function srcInfo(it) {
    const C = G.config, id = it.dataset.cx || null, t = id ? C.nodeTypes[id] : null;
    const nm = it.querySelector('.cx-name');
    const name = t ? t.name : (nm && nm.firstChild ? nm.firstChild.textContent : '?');
    const ic = it.querySelector('.cx-ic');
    const color = t ? C.iconColor(t) : (ic && ic.style.getPropertyValue('--c')) || '#888';
    const dev = it.classList.contains('cx-dev'), locked = it.classList.contains('cx-locked');

    const devT = dev && it.dataset.dev ? C.nodeTypes[it.dataset.dev] : null;
    return { it, id, t, name, color, dev, locked, icon: t ? t.icon : devT ? devT.icon : null };
  }
  function tileFor(inf) {
    const b = D.createElement('button');
    b.type = 'button';
    b.className = 'lgx-tile' + (inf.locked ? ' lgx-locked' : '') + (inf.dev ? ' lgx-dev' : '');
    b.style.setProperty('--c', inf.color);
    if (inf.id) b.dataset.cx = inf.id;
    const icon = inf.t ? G.icons.svg(inf.t.icon, 26) : (inf.it.querySelector('.cx-ic') || {}).innerHTML || '';
    b.innerHTML = '<span class="cx-ic" style="--c:' + inf.color + '">' + icon + '</span><span class="lgx-nm">' + inf.name + '</span>' +
      ((inf.locked || inf.dev) ? '<span class="lgx-lock">' + LOCK + '</span>' : '');
    b._src = inf;
    b.onclick = function (e) { e.stopPropagation(); G.audio.play('click'); openCard(b); };

    if (inf.t && G.render.motionOf && G.render.motionOf(inf.t) && G.render.liveIconOn) {
      let raf = 0, cv = null;
      b.addEventListener('mouseenter', () => {
        const box = b.querySelector('.cx-ic'), sv = box && box.querySelector('svg'); if (!box) return;
        cv = cv || Object.assign(D.createElement('canvas'), { className: 'lgx-hovic' });
        if (sv) sv.style.display = 'none';
        box.appendChild(cv);
        W.cancelAnimationFrame(raf);
        const loop = () => { drawLive(cv, inf.t); raf = W.requestAnimationFrame(loop); };
        loop();
      });
      b.addEventListener('mouseleave', () => {
        W.cancelAnimationFrame(raf);
        if (cv) cv.remove();
        const sv = b.querySelector('.cx-ic svg'); if (sv) sv.style.display = '';
      });
    }
    return b;
  }
  function build(w) {
    w.querySelectorAll('.lgx-grid, .lgx-base').forEach(g => g.remove());
    w.classList.add('lgx-done');
    w.style.setProperty('--cg-hover', CFG().hover || 1.08);
    w.querySelectorAll('.cx-grp').forEach(g => {
      const grid = D.createElement('div'); grid.className = 'lgx-grid';
      g.querySelectorAll(':scope > .cx-item').forEach(it => grid.appendChild(tileFor(srcInfo(it))));
      g.insertBefore(grid, g.firstChild);
    });
    const base = D.createElement('p'); base.className = 'cx-intro lgx-base';
    base.textContent = L('base');
    w.insertBefore(base, w.firstChild);
    sync();
  }

  function sync() {
    D.querySelectorAll('.lgx-tile').forEach(t => t.classList.toggle('lgx-gone', !!(t._src && t._src.it.classList.contains('cx-miss'))));
  }
  function tiles() { return [...D.querySelectorAll('.cx-wrap .lgx-tile')].filter(t => t.offsetParent && !t.classList.contains('lgx-gone')); }

  function back() {
    let b = D.getElementById('lgx-back');
    if (b) return b;
    const wd = +(CFG().width || 660);
    b = D.createElement('div'); b.id = 'lgx-back';
    b.style.setProperty('--cg-w', wd + 'px');

    b.innerHTML = '<button class="lgx-arw" data-d="-1">' + CHEV(-1) + '</button>' +
      '<div id="lgx-card"></div>' +
      '<button class="lgx-arw" data-d="1">' + CHEV(1) + '</button>';
    b.addEventListener('click', e => {
      const a = e.target.closest('.lgx-arw');
      if (a) { e.stopPropagation(); step(+a.dataset.d); return; }
      if (e.target.closest('.lgx-x') || !e.target.closest('#lgx-card')) { e.stopPropagation(); closeCard(); return; }
      const tr = e.target.closest('[data-try]');
      if (tr) { e.stopPropagation(); const id = tr.dataset.try; closeCard(true); G.ui.closePanel(); G.ui.tryMachine(id); }
    });
    D.body.appendChild(b);
    return b;
  }
  const MAIN = ['Takes', 'Makes', 'Pays', 'Gives', 'Sells', 'Burns', 'Prints', 'Hires', 'Hires at'];
  const strip = h => String(h || '').replace(/<[^>]+>/g, '');
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let tintCache = null;
  function tintTable() {
    const C = G.config, lang = GG.i18n.lang ? GG.i18n.lang() : '';
    if (tintCache && tintCache.lang === lang) return tintCache;
    const list = [];
    Object.values(C.nodeTypes).forEach(t => { if (t.name && !/^prac/.test(t.id)) list.push([t.name, t.kind === 'machine' ? C.iconColor(t) : (t.color || '#cfd9e4')]); });
    Object.keys(C.resources).forEach(k => C.resources[k].name && list.push([C.resources[k].name, C.resources[k].color]));
    Object.keys(C.currencies).forEach(k => C.currencies[k].name && list.push([C.currencies[k].name, C.currencies[k].color]));
    list.push([L('w.power'), C.resources.energy.color]);
    list.push([L('w.crew'), C.resources.wf.color]);
    if (C.resources.hazard) list.push([L('w.hazardous'), C.resources.hazard.color]);
    list.sort((x, y) => y[0].length - x[0].length);
    const col = {}; list.forEach(x => { const k = x[0].toLowerCase(); if (!col[k]) col[k] = x[1]; });
    const tail = lang === 'ru' ? '(\\p{L}{0,3})' : '(s?)';
    const names = new RegExp('(?<![\\p{L}])(' + list.map(x => reEsc(x[0])).join('|') + ')' + tail + '(?![\\p{L}])', 'giu');

    const bank = C.nodeTypes.bank ? C.nodeTypes.bank.name : 'Bank', caseOnly = {}; caseOnly[bank.toLowerCase()] = bank;
    const units = /(?<![\p{L}\d.,])((?:\d[\d,]*(?:\.\d+)?\s?)?)(KW|WF|CI|кВт|РС|ИЧ)(\/(?:h|ч))?(?![\p{L}])/gu;
    const ucol = { KW: C.resources.energy.color, WF: C.resources.wf.color, CI: C.currencies.ci.color };
    ucol['кВт'] = ucol.KW; ucol['РС'] = ucol.WF; ucol['ИЧ'] = ucol.CI;
    const dollars = /(?<![\p{L}\d.])(\$\s?\d[\d,]*(?:\.\d+)?(?:\/(?:h|ч))?|\d[\d,]*(?:\.\d+)?\s?\$(?:\/(?:h|ч))?|\$\/(?:h|ч))(?![\p{L}\d])/gu;
    return (tintCache = { lang, col, names, units, ucol, dollars, caseOnly, money: C.iconColor(C.nodeTypes.market) });
  }
  function tint(html) {
    const X = tintTable(), paint = (txt, c) => '<b class="lgc-res" style="color:' + c + '">' + txt + '</b>';
    const pass = (h, fn) => String(h).split(/(<[^>]+>)/).map(p => p[0] === '<' ? p : fn(p)).join('');

    let out = pass(html, p => p.replace(X.names, (m, n, pl) => { const lc = n.toLowerCase();
      return (X.caseOnly[lc] && n !== X.caseOnly[lc]) ? m : paint(n + pl, X.col[lc] || 'inherit'); }));
    out = pass(out, p => p.replace(X.units, (m, num, u, ph) => paint(num + u + (ph || ''), X.ucol[u])));
    out = pass(out, p => p.replace(X.dollars, m => paint(m, X.money)));
    return out;
  }

  function specSplit(t) {
    let rows = [];
    try { rows = G.config.specCard(t) || []; } catch (e) { rows = []; }
    const main = [], rest = [];
    rows.forEach(r => ((MAIN.indexOf(r[0]) >= 0 && /\d/.test(strip(r[1])) && strip(r[1]).length <= 70) ? main : rest).push(r));
    return { main, rest };
  }

  let curRates = { in: {}, out: {}, batch: false };
  function rateMap(t) {
    const C = G.config, U = G.util, m = { in: {}, out: {}, batch: !!t.recipe };
    const n = v => (v >= 1000 ? String(Math.round(v)) : U.small(v));

    if (t.id === 'treePlanter' || t.id === 'seedDrill') { m.batch = false; m.in.wf = '1 WF/h'; m.out.ci = n(t.ciPerWF) + ' CI/h'; return m; }
    if (t.recipe && t.recipe.inputs) {
      Object.keys(t.recipe.inputs).forEach(k => { m.in[k] = n(t.recipe.inputs[k]) + ' kg'; });
      if (t.recipe.kw) m.in.energy = n(t.recipe.kw) + ' KW';
      if (t.recipe.wf) m.in.wf = n(t.recipe.wf) + ' WF';
      if (t.recipe.handGems) m.in.diamond = n(t.recipe.handGems) + ' ' + ((C.currencies.diamond || {}).short || '');
      if (t.recipe.out) m.out[t.recipe.out.res] = n(t.recipe.out.kg || 1) + ' kg';
      if (t.recipe.gem) m.out[t.recipe.gem.cur] = n(t.recipe.gem.base) + ' ' + ((C.currencies[t.recipe.gem.cur] || {}).short || '');
      if (t.recipe.ci) m.out.ci = n(t.recipe.ci) + ' CI/h';

      if (!Object.keys(m.out).length) {
        let fl = [];
        try { fl = C.gradeFlow(t) || []; } catch (e) { fl = []; }
        fl.forEach(f => { const g = f.gives || {};
          if (g.kw) m.out.energy = n(g.kw) + ' KW/h'; if (g.wf) m.out.wf = n(g.wf) + ' WF/h';
          if (g.ci) m.out.ci = n(g.ci) + ' CI/h'; if (g.money) m.out.money = n(g.money) + ' $/h'; });
      }
      return m;
    }
    if (t.recruit) return m;
    if (t.overdrive && t.overdrive.enabled) {
      const wf = t.wfRate, k = t.kwPerWf;
      m.in.energy = n(wf * k) + ' KW/h'; m.out.wf = n(wf) + ' WF/h';
      return m;
    }
    let flows = [];
    try { flows = C.gradeFlow(t) || []; } catch (e) { return m; }
    (t.fuelSwitch ? flows.slice(0, 1) : flows).forEach(f => {
      if (!Object.keys(f.out || {}).length && !Object.keys(f.gives || {}).length) return;
      Object.keys(f.in || {}).forEach(r => { m.in[r] = n(f.in[r]) + ' kg/h'; });
      if (f.kw) m.in.energy = n(f.kw) + ' KW/h';
      if (f.wf) m.in.wf = n(f.wf) + ' WF/h';
      Object.keys(f.out || {}).forEach(r => { m.out[r] = n(f.out[r]) + ' kg/h'; });
      Object.keys(f.side || {}).forEach(r => { m.out[r] = n(f.side[r]) + ' kg/h'; });
      const g = f.gives || {};
      if (g.kw) m.out.energy = n(g.kw) + ' KW/h';
      if (g.wf) m.out.wf = n(g.wf) + ' WF/h';
      if (g.ci) m.out.ci = n(g.ci) + ' CI/h';
      if (g.money) m.out.money = n(g.money) + ' $/h';
    });

    if (t.fission) Object.keys(m.in).forEach(k => { m.in[k] = m.in[k].replace(' kg/h', ' kg ' + L('aLoad')); });
    return m;
  }

  const rateOf = (side, res) => {
    const m = curRates[side === 'out' ? 'out' : 'in'];
    return (res && m && m[res]) ? '<b class="lgc-rate">' + GG.i18n.ins(m[res]) + '</b>' : '';
  };
  const hasRates = () => Object.keys(curRates.in).length + Object.keys(curRates.out).length > 0;

  const row = (en, txt) => [en, txt, true];

  function extraRows(t) {
    const U = G.util, pct = v => Math.round(v * 100) + '%', rows = [];
    const H = t.hire;
    if (H && t.id === 'hiringPost') {
      rows.push(row('Price', L('r.hirePrice', pct(H.priceRatio))));
      rows.push(row('Next hand', L('r.nextHand', pct(H.growth - 1))));
      const bd = (H.bulkDiscount || []).map((d, i) => d > 0 ? L('r.bulk', i + 1, pct(d)) : '').filter(Boolean);
      if (bd.length) rows.push(row('Discount', bd.join(', ')));
    }
    if (H && t.id === 'labourExchange') {
      rows.push(row('Price', L('r.exPrice', U.small(H.mult), Math.round(H.unitSec / 60))));
      rows.push(row('Next hand', L('r.nextHand', pct(H.growth - 1))));
      rows.push(row('Discount', L('r.exDiscount', Math.round(H.longSec / 60), pct(H.longOff), H.manyAt, pct(H.manyOff))));
    }
    if (t.overdrive && t.overdrive.enabled) {
      rows.push(row('Overdrive', L('r.overdrive', U.small(t.overdrive.out), U.small(t.overdrive.drain))));
      if (t.bank) rows.push(row('Charge cell', L('r.cell', U.small(t.bank))));
    }
    return rows;
  }
  function skillOf(t) { return G.config.skills.find(s => !s.retired && (s.unlocks || []).indexOf(t.id) >= 0) || null; }

  function sides(t) {
    const C = G.config, S = G.state, Sim = G.sim;
    const hid = r => { const R = C.resources[r]; return !!(R && R.hideUntil && !(S.g && S.g.objectives && S.g.objectives[R.hideUntil])); };
    const one = list => {
      const seen = {}, order = [];
      (list || []).filter(p => (!p.requires || S.hasSkill(p.requires)) && !(p.fuelAlt && !Sim.fuelSwitchOpen(t)) &&
                               !(p.rockOut && p.res === 'gold' && !rareSeen()) &&
                               !(p.res && (Sim.demoRes(p.res) || hid(p.res)))).forEach(p => {
        const r = C.resources[p.res] || C.currencies[p.res] || {};
        const label = (p.fuelAlt ? L('or') + ' ' : '') + (p.label ? GG.i18n.ins(p.label) : (r.name || p.res)) + (p.lane ? ' ' + p.lane.toUpperCase() : '');
        if (!seen[label]) { seen[label] = { col: r.color || '#9fb0c2', n: 0, res: p.res }; order.push(label); }
        seen[label].n++;
      });

      return order.map(l => ({ label: l, col: seen[l].col, res: seen[l].res, n: seen[l].n }));
    };
    const ins = one((t.ports || {}).in), outs = one((t.ports || {}).out);
    (t.virtualOut || []).forEach(v => { const c = C.currencies[v.cur] || C.resources[v.res] || {};
      outs.push({ label: v.label ? GG.i18n.ins(v.label) : c.name, col: c.color || '#9fb0c2', res: v.cur || v.res }); });
    return { ins, outs };
  }
  const chip = (c, side) => '<span class="lgc-chip" style="--c:' + c.col + '"><i></i><span>' + c.label + rateOf(side === 'out' ? 'out' : 'in', c.res) + '</span></span>';
  const track = (cols, cls) => '<span class="lgc-tr' + (cls ? ' ' + cls : '') + '">' + [0, 1, 2].map(j =>
    '<i style="background:' + (cols[j % cols.length] || '#9fb0c2') + ';animation-delay:' + (-j * 0.4).toFixed(2) + 's"></i>').join('') + '</span>';

  function fan(n, col, out, cls) {
    const FW = 64, FH = Math.max(40, n * 11), mid = FH / 2;
    let d = '', dots = '';
    for (let j = 0; j < n; j++) {
      const y = n === 1 ? mid : 5 + j * (FH - 10) / (n - 1);
      const p = out ? 'M0 ' + mid + ' C' + FW * 0.5 + ' ' + mid + ' ' + FW * 0.5 + ' ' + y + ' ' + FW + ' ' + y
                    : 'M0 ' + y + ' C' + FW * 0.5 + ' ' + y + ' ' + FW * 0.5 + ' ' + mid + ' ' + FW + ' ' + mid;
      d += '<path d="' + p + '" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1.6"/>';
      dots += '<circle r="3" fill="' + col + '"><animateMotion dur="1.3s" begin="' + (-j * 0.26).toFixed(2) + 's" repeatCount="indefinite" path="' + p + '"/></circle>';
    }
    return '<svg class="lgc-fan' + (cls ? ' ' + cls : '') + '" width="' + FW + '" height="' + FH + '" viewBox="0 0 ' + FW + ' ' + FH + '">' + d + dots + '</svg>';
  }
  const machBox = t => '<span class="lgc-mach" style="--c:' + G.config.iconColor(t) + '">' + G.icons.svg(t.icon, 26, G.config.iconColor(t)) + '<em>' + t.name + '</em></span>';
  const bar = (k, col, label, side, res) => '<span class="lgc-bar"><span class="lgc-bl">' + label + rateOf(side || 'in', res) + '</span><span class="lgc-bt"><i data-k="' + k +
    '" style="background:' + col + '"></i></span><b data-n="' + k + '"></b></span>';
  function flowRow(t, opts) {
    const s = sides(t), o = opts || {};
    const many = list => list.length === 1 && list[0].n > 1;
    const Lh = !s.ins.length ? '' : '<span class="lgc-col">' + s.ins.map(c => chip(c, 'in')).join('') + '</span>' +
      (many(s.ins) ? fan(s.ins[0].n, s.ins[0].col, false) : track(s.ins.map(c => c.col), o.inCls));
    const Rh = !s.outs.length ? '' : (many(s.outs) ? fan(s.outs[0].n, s.outs[0].col, true) : track(s.outs.map(c => c.col), o.outCls)) +
      '<span class="lgc-col">' + (o.outs || s.outs.map(c => chip(c, 'out')).join('')) + '</span>';
    const fed = feedsOf(t);
    const F2 = fed ? track([s.outs.length ? s.outs[0].col : '#9fb0c2']) + machBox(fed) : '';
    return '<div class="lgc-flow">' + Lh + machBox(t) + Rh + F2 + '</div>';
  }

  function special(t) {
    const C = G.config, Sim = G.sim, R = C.resources, NR = ((C.tutorial.guide || {}).noteRows) || {};
    const moment = '<div class="lgc-moment"></div>';
    const setMoment = (root, s) => { const m = root.querySelector('.lgc-moment'); if (m && m.textContent !== s) m.textContent = s; };
    const setBar = (root, k, f, txt) => { const i = root.querySelector('[data-k="' + k + '"]'); if (i) i.style.width = (100 * Math.max(0, Math.min(1, f))) + '%';
      const n = root.querySelector('[data-n="' + k + '"]'); if (n && txt !== undefined) n.textContent = txt; };
    const ease = (now, per) => { const p = (now % per) / per; return 1 - Math.pow(1 - Math.min(1, p / 0.45), 3); };
    const s = sides(t), oc = (s.outs[0] || {}).col || '#9fb0c2', ic = (s.ins[0] || {}).col || '#9fb0c2';
    const U = G.util, kg = v => GG.i18n.ins(v + ' kg'), kw = v => GG.i18n.ins(v + ' KW'), wfu = v => GG.i18n.ins(v + ' WF');
    const ciu = v => GG.i18n.ins(v + ' CI'), perH = v => GG.i18n.ins(v);
    const num = v => v >= 1000 ? Math.round(v).toLocaleString('en') : U.small(v);

    if (t.id === 'treePlanter' || t.id === 'seedDrill') {
      const ci = C.currencies.ci, till = !!t.collect;
      const inChip = c => c.res === 'fert' ? '<span class="lgc-chip lgc-opt" style="--c:' + c.col + '"><i></i><span>' + c.label + '<em>' + L('optional') + '</em></span></span>' : chip(c, 'in');
      return { html: moment + '<div class="lgc-flow"><span class="lgc-col">' + s.ins.map(inChip).join('') + '</span>' +
          track(s.ins.map(c => c.col), 'lgc-in') + machBox(t) + track([ci.color], 'lgc-in') +
          '<span class="lgc-col">' + chip({ label: ci.name, col: ci.color, res: 'ci' }, 'out') + '</span>' +
          (till ? '<span class="lgc-till"><span class="lgc-tl">' + L('till') + '</span><span class="lgc-bt"><i data-k="till" style="background:' + ci.color + '"></i></span>' +
          '<span class="lgc-collect">' + L('collect') + '</span></span>' : '') + '</div>',
        tick(now, root) { if (!till) { setMoment(root, L('m.drill')); return; }
          const per = 5200, p = (now % per) / per, btn = root.querySelector('.lgc-collect');
          setMoment(root, p < 0.55 ? L('m.planting') : p < 0.85 ? L('m.plantFull') : L('m.collectEmpties'));
          setBar(root, 'till', p < 0.55 ? p / 0.55 : p < 0.85 ? 1 : 0);
          root.querySelectorAll('.lgc-tr.lgc-in').forEach(tr => tr.classList.toggle('lgc-off', p >= 0.55 && p < 0.85));
          if (btn) btn.classList.toggle('on', p >= 0.7 && p < 0.9); } };
    }

    if (t.strikeCharge) {
      const ev = ((C.weather || {}).events || []).find(e => e.id === t.strikeEvent) || {}, col = C.iconColor(t);
      return { html: moment + '<div class="lgc-flow"><span class="lgc-boltsky">' + G.icons.svg(ev.icon || 'bolt', 28, '#ffe066') + '</span>' +
          '<span class="lgc-tr lgc-strike"></span><span class="lgc-batt" style="--c:' + col + '"><span class="lgc-bfill"></span>' + G.icons.svg(t.icon, 22, col) +
          '<em>' + t.name + '</em></span>' + track([R.energy.color], 'lgc-out') + '<span class="lgc-col">' + chip({ label: R.energy.name, col: R.energy.color }, 'out') + '</span></div>' +
          '<p class="lgc-cap">' + L('c.vault', kw(U.small(t.strikeCharge)), kw(U.small(t.store))) + '</p>',
        tick(now, root) { const per = 7000, p = (now % per) / per, sky = root.querySelector('.lgc-boltsky'), fl = root.querySelector('.lgc-bfill'),
            out = root.querySelector('.lgc-out'), st = root.querySelector('.lgc-strike'), half = t.strikeCharge / t.store;
          const f1 = p < 0.06, f2 = p >= 0.4 && p < 0.46;
          let lvl = p < 0.4 ? half : p < 0.55 ? Math.min(1, 2 * half) : Math.max(0, Math.min(1, 2 * half) * (1 - (p - 0.55) / 0.45));
          if (p < 0.06) lvl = half * p / 0.06;
          if (sky) sky.classList.toggle('on', f1 || f2); if (st) st.classList.toggle('on', f1 || f2);
          if (fl) fl.style.height = (lvl * 100) + '%'; if (out) out.classList.toggle('lgc-off', p < 0.55);
          setMoment(root, p < 0.4 ? L('m.strike', kw(U.small(t.strikeCharge))) : p < 0.55 ? L('m.strike2') : L('m.vaultOut')); } };
    }

    if (t.recipe && t.recipe.gem && t.recipe.kw) {
      const r = t.recipe, gc = C.currencies[r.gem.cur] || {}, dia = C.currencies.diamond, prism = !!r.handGems;
      const keys = Object.keys(r.inputs), N = 6;
      const amt = (k, made) => kg(U.small(Math.round((r.inputs[k] + ((r.growth || {})[k] || 0) * made) * 100) / 100));
      const kwOf = made => kw(U.small(r.kw + ((r.growth || {}).kw || 0) * made));
      const gemsOf = made => r.gem.base + (isFinite(r.gem.every) ? Math.floor(made / r.gem.every) : 0);
      const pbar = (k, col, label, a) => '<span class="lgc-bar"><span class="lgc-bl">' + label + '<b class="lgc-rate" data-a="' + k + '">' + a + '</b></span>' +
        '<span class="lgc-bt"><i data-k="' + k + '" style="background:' + col + '"></i></span><b></b></span>';
      const html = moment + '<div class="lgc-flow"><span class="lgc-col">' +
          keys.map(k => pbar('in' + k, (R[k] || {}).color, (R[k] || {}).name, amt(k, 0))).join('') +
          (prism ? pbar('ingem', dia.color, L('byHand', dia.name), U.small(r.handGems) + ' ' + dia.short) : '') +
          pbar('kwp', R.energy.color, R.energy.name, kwOf(0)) + '</span>' +
          track(keys.map(k => (R[k] || {}).color).concat([R.energy.color])) + machBox(t) + track([gc.color], 'lgc-out') +
          '<span class="lgc-col"><span class="lgc-pop" style="--c:' + gc.color + '">' + gc.name + '<b class="lgc-rate lgc-gems">' + gemsOf(0) + ' ' + gc.short +
          '</b></span></span></div>' +
          '<p class="lgc-cap">' + (prism ? L('c.prism') : L('c.press', r.gem.every)) + '</p>';
      return { html,
        tick(now, root) { const per = 2800, k = Math.floor(now / per) % N, p = (now % per) / per;
          const fm = Math.min(1, p / 0.4), fk = Math.max(0, Math.min(1, (p - 0.4) / 0.35)), g = gemsOf(k);
          root.querySelectorAll('[data-a]').forEach(b => { const a = b.dataset.a;
            b.textContent = a === 'kwp' ? kwOf(k) : a === 'ingem' ? U.small(r.handGems) + ' ' + dia.short : amt(a.slice(2), k); });
          root.querySelectorAll('[data-k^="in"]').forEach(i => { i.style.width = (p < 0.75 ? 100 * fm : 0) + '%'; });
          const kb = root.querySelector('[data-k="kwp"]'); if (kb) kb.style.width = (p < 0.75 ? 100 * fk : 0) + '%';
          const gb = root.querySelector('.lgc-gems'); if (gb) gb.textContent = g + ' ' + gc.short;
          const pop = root.querySelector('.lgc-pop'), out2 = root.querySelector('.lgc-out');
          if (pop) pop.classList.toggle('on', p >= 0.75); if (out2) out2.classList.toggle('lgc-off', p < 0.75);
          const what = p < 0.4 ? (prism ? L('m.prismFirst') : L('m.pressFirst')) : p < 0.75 ? L('m.pressPower', kwOf(k)) :
            L('m.pressDone', g + ' ' + gc.short) + (!prism && k > 0 && k % r.gem.every === 0 ? L('m.oneMore') : '');
          setMoment(root, L('m.batch', k + 1, what)); } };
    }

    if (t.print) {
      const P = t.print, B = Object.keys(P.boosts), dia = C.currencies.diamond;
      const M = B.map(k => { const b = (C.boosts || []).find(x => x.id === P.boosts[k].boost) || {};
        return { mat: (R[k] || {}).name, col: (R[k] || {}).color, kg: kg(U.small(P.boosts[k].kg)), out: b.name || P.boosts[k].boost, ocol: '#e8a0c8', icon: b.icon };
      }).concat([{ mat: L('anyMat'), col: '#9fb0c2', kg: '', out: '1 ' + dia.name, ocol: dia.color, icon: null }]);
      const pbar = (k, col, label, a) => '<span class="lgc-bar"><span class="lgc-bl"><span data-l="' + k + '">' + label + '</span><b class="lgc-rate" data-a="' + k + '">' + a + '</b></span>' +
        '<span class="lgc-bt"><i data-k="' + k + '" style="background:' + col + '"></i></span><b></b></span>';
      const html = moment + '<div class="lgc-flow"><span class="lgc-col">' + pbar('inpaper', R.paper.color, R.paper.name, kg(U.small(P.paper))) +
          pbar('inmat', M[0].col, M[0].mat, M[0].kg) + pbar('kwp', R.energy.color, R.energy.name, kw(U.small(P.kw))) + '</span>' +
          track([R.paper.color, R.energy.color]) + machBox(t) + track(['#e8a0c8'], 'lgc-out') +
          '<span class="lgc-col"><span class="lgc-pop lgc-print" style="--c:' + M[0].ocol + '"><span class="lgc-pi">' + G.icons.svg(M[0].icon || 'diamond', 14, M[0].ocol) +
          '</span><span class="lgc-pn">' + M[0].out + '</span></span></span></div>' +
          '<p class="lgc-cap">' + L('c.print') + '</p>';
      return { html,
        tick(now, root) { const per = 2600, k = Math.floor(now / per) % M.length, m = M[k], p = (now % per) / per;
          const fm = Math.min(1, p / 0.4), fk = Math.max(0, Math.min(1, (p - 0.4) / 0.35));
          const lb = root.querySelector('[data-l="inmat"]'), ab = root.querySelector('[data-a="inmat"]'), ib = root.querySelector('[data-k="inmat"]');
          if (lb && lb.textContent !== m.mat) { lb.textContent = m.mat; ab.textContent = m.kg; ib.style.background = m.col;
            const pop = root.querySelector('.lgc-print'); pop.style.setProperty('--c', m.ocol); pop.querySelector('.lgc-pn').textContent = m.out;
            pop.querySelector('.lgc-pi').innerHTML = G.icons.svg(m.icon || 'diamond', 14, m.ocol); }
          ['inpaper', 'inmat'].forEach(x => { const i = root.querySelector('[data-k="' + x + '"]'); if (i) i.style.width = (p < 0.75 ? 100 * fm : 0) + '%'; });
          const kb = root.querySelector('[data-k="kwp"]'); if (kb) kb.style.width = (p < 0.75 ? 100 * fk : 0) + '%';
          const pop = root.querySelector('.lgc-print'), out2 = root.querySelector('.lgc-out');
          if (pop) pop.classList.toggle('on', p >= 0.75); if (out2) out2.classList.toggle('lgc-off', p < 0.75);
          setMoment(root, p < 0.4 ? L('m.printIn', k < B.length ? m.mat : L('anyMatLower')) : p < 0.75 ? L('m.printPower') : L('m.printed', m.out)); } };
    }

    if (t.rocket) {
      const RK = t.rocket, F = RK.flight, A = RK.flightAlt, ci = C.currencies.ci, dia = C.currencies.diamond;
      const alt = !!(A && Sim.fuelSwitchOpen(t)), bk = Object.keys(RK.build);
      const fuels = [{ res: 'turbofuel', kg: F.fuel, h: Math.round(F.sec / 60), ex: (F.exhaustCi || 0) * F.fuel }]
        .concat(alt ? [{ res: A.res, kg: A.fuel, h: Math.round(A.sec / 60), ex: 0 }] : []);
      const pbar = (k, col, label, a) => '<span class="lgc-bar"><span class="lgc-bl"><span data-l="' + k + '">' + label + '</span><b class="lgc-rate" data-a="' + k + '">' + a + '</b></span>' +
        '<span class="lgc-bt"><i data-k="' + k + '" style="background:' + col + '"></i></span><b></b></span>';
      const prow = (k, title, inner) => '<div class="lgc-prow" data-p="' + k + '"><span class="lgc-pl">' + title + '</span><div class="lgc-flow">' + inner + '</div></div>';
      const f0 = fuels[0], R0 = R[f0.res];
      const html = moment + '<div class="lgc-pump">' +
        prow(1, L('p.builtOnce'), '<span class="lgc-col">' + bk.map(k => pbar('b' + k, (R[k] || {}).color, (R[k] || {}).name, kg(U.small(RK.build[k])))).join('') + '</span>' +
          track(bk.map(k => (R[k] || {}).color), 'lgc-r1') + machBox(t)) +
        prow(2, L('p.everyFlight'), '<span class="lgc-col">' + pbar('ffuel', R0.color, R0.name, kg(U.small(f0.kg))) + pbar('fwf', R.wf.color, R.wf.name, wfu(U.small(F.wf))) + '</span>' +
          track([R0.color, R.wf.color], 'lgc-r2') + machBox(t) + track([ci.color, dia.color], 'lgc-r3') +
          '<span class="lgc-col"><span class="lgc-pop lgc-exh" style="--c:#e8706a">' + L('exhaust') + '<b class="lgc-rate"></b></span><span class="lgc-bar lgc-away"><span class="lgc-bl">' +
          L('away') + '<b class="lgc-rate" data-a="away">' + L('gameHours', f0.h) + '</b></span>' +
          '<span class="lgc-bt"><i data-k="away" style="background:' + G.config.iconColor(t) + '"></i></span><b></b></span>' +
          '<span class="lgc-pop lgc-home" style="--c:' + ci.color + '">' + ci.name + '<b class="lgc-rate">' + ciu(num(F.ci)) + '</b></span>' +
          '<span class="lgc-pop lgc-home" style="--c:' + dia.color + '">' + dia.name + '<b class="lgc-rate">' + U.small(F.gems) + ' ' + dia.short + '</b></span></span>') + '</div>';
      return { html,
        tick(now, root) { const per = 9000, cyc = Math.floor(now / per), p = (now % per) / per, f = fuels[cyc % fuels.length], first = cyc === 0;
          const Rf = R[f.res], seg = (a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));
          const fb = root.querySelector('[data-l="ffuel"]');
          if (fb && fb.textContent !== Rf.name) { fb.textContent = Rf.name; root.querySelector('[data-a="ffuel"]').textContent = kg(U.small(f.kg));
            root.querySelector('[data-k="ffuel"]').style.background = Rf.color; root.querySelector('[data-a="away"]').textContent = L('gameHours', f.h); }

          const bf = first ? seg(0, 0.22) : 1;
          root.querySelectorAll('[data-k^="b"]').forEach(i => { i.style.width = (100 * bf) + '%'; });
          const fl = seg(first ? 0.25 : 0, first ? 0.45 : 0.25);
          ['ffuel', 'fwf'].forEach(x => { const i = root.querySelector('[data-k="' + x + '"]'); if (i) i.style.width = (p < 0.5 || !first && p < 0.3 ? 100 * fl : 0) + '%'; });
          const a0 = first ? 0.5 : 0.3, aw = seg(a0, 0.85), home = p >= 0.85;
          const ab = root.querySelector('[data-k="away"]'); if (ab) ab.style.width = (p >= a0 && !home ? 100 * aw : 0) + '%';
          root.querySelectorAll('.lgc-home').forEach(x => x.classList.toggle('on', home));
          root.querySelectorAll('.lgc-prow').forEach(r => r.classList.toggle('lgc-dim', r.dataset.p === '1' ? !(first && p < 0.25) : first && p < 0.25));
          root.querySelectorAll('.lgc-r1').forEach(x => x.classList.toggle('lgc-off', !(first && p < 0.25)));
          root.querySelectorAll('.lgc-r2').forEach(x => x.classList.toggle('lgc-off', !(p >= (first ? 0.25 : 0) && p < a0)));
          root.querySelectorAll('.lgc-r3').forEach(x => x.classList.toggle('lgc-off', p < a0));

          const ex = root.querySelector('.lgc-exh');
          if (ex) { ex.querySelector('b').textContent = f.ex > 0 ? '-' + ciu(num(f.ex)) : L('none');
            ex.classList.toggle('on', f.ex > 0 && p >= a0 && !home); ex.style.opacity = p >= a0 && !home ? 1 : 0.3; }
          setMoment(root, first && p < 0.25 ? L('m.rocketBuild') : p < a0 ? L('m.rocketLoad', Rf.name) :
            !home ? L('m.rocketAway', f.h) : L('m.rocketHome', ciu(num(F.ci)), U.small(F.gems) + ' ' + dia.short)); } };
    }

    if (t.id === 'waterPump') {
      const ci = C.currencies.ci, perKw = Sim.stat(t.id, 'pumpPerKw') || t.pumpPerKw, kwh = 1 / perKw;
      const ground = id => { const st = C.nodeTypes[id], w = R[st.water] || {};
        return { id, name: st.name, col: st.color, water: w.name, wcol: w.color, per: Math.round(st.capacity / st.volume) }; };
      const GR = [ground('waterSite')].concat(blackmereOpen() ? [ground('oilSite')] : []);
      const rt = txt => '<b class="lgc-rate">' + txt + '</b>';
      const ch = (label, col, rate, cls) => '<span class="lgc-chip' + (cls ? ' ' + cls : '') + '" style="--c:' + col + '"><i></i><span>' + label + rt(rate) + '</span></span>';
      const prow = (k, title, Lh, mid, Rh) => '<div class="lgc-prow" data-p="' + k + '"><span class="lgc-pl">' + title + '</span><div class="lgc-flow">' + Lh + mid + Rh + '</div></div>';
      const g0 = GR[0];
      const html = moment + '<div class="lgc-pump">' +
        prow(1, L('p.pumpOut'), ch(R.energy.name, R.energy.color, perH(U.small(kwh) + ' KW/h')), track([R.energy.color], 'lgc-p1') + machBox(t) + track([g0.wcol], 'lgc-p1 lgc-pw'),
          ch(g0.water, g0.wcol, perH('1 kg/h'), 'lgc-dirty')) +
        prow(2, L('p.pumpBack'), ch(R.water.name, R.water.color, perH('1 kg/h')), track([R.water.color], 'lgc-p2') + machBox(t) + track([ci.color], 'lgc-p2'),
          ch(ci.name, ci.color, perH(g0.per + ' CI/h'), 'lgc-pay')) +
        '<p class="lgc-cap">' + L('c.pump') + '</p></div>';
      return { html,
        tick(now, root) { const per = 6400, gi = Math.floor(now / per) % GR.length, g = GR[gi], p = (now % per) / per;
          const one = p < 0.5;
          setMoment(root, (g.id === 'oilSite' ? L('m.onSpill', g.name) : L('m.onPool', g.name)) + (one ? L('m.pump1', g.water) : L('m.pump2', ciu(g.per))));
          root.querySelectorAll('.lgc-prow').forEach(r => r.classList.toggle('lgc-dim', (r.dataset.p === '1') !== one));
          root.querySelectorAll('.lgc-p1').forEach(tr => tr.classList.toggle('lgc-off', !one));
          root.querySelectorAll('.lgc-p2').forEach(tr => tr.classList.toggle('lgc-off', one));
          const dch = root.querySelector('.lgc-dirty');
          if (dch && dch.dataset.g !== String(gi)) {
            dch.dataset.g = gi; dch.style.setProperty('--c', g.wcol); dch.querySelector('span').innerHTML = g.water + rt(perH('1 kg/h'));
            root.querySelectorAll('.lgc-pw i').forEach(i => { i.style.background = g.wcol; });
            const pay = root.querySelector('.lgc-pay .lgc-rate'); if (pay) pay.textContent = perH(g.per + ' CI/h');
          } } };
    }

    if (t.overdrive && t.overdrive.enabled) {
      const wf = t.wfRate, kwr = wf * t.kwPerWf, O = t.overdrive;
      const M = [[L('m.normal'), kwr, wf], [L('m.overdrive'), kwr * O.drain, wf * O.out]];
      const kmax = kwr * O.drain, wmax = wf * O.out;
      return { html: moment + '<div class="lgc-flow"><span class="lgc-col">' + bar('kw', R.energy.color, R.energy.name) + '</span>' + track([R.energy.color], 'lgc-in') +
          machBox(t) + track([R.wf.color]) + '<span class="lgc-col">' + bar('wf', R.wf.color, R.wf.name) + '</span></div>',
        tick(now, root) { const m = M[Math.floor(now / 2400) % M.length], e = ease(now, 2400), tin = root.querySelector('.lgc-tr.lgc-in');
          setMoment(root, L('m.robot', m[0], perH(U.small(m[1]) + ' KW/h'), perH(U.small(m[2]) + ' WF/h')));
          setBar(root, 'kw', e * m[1] / kmax, ''); setBar(root, 'wf', e * m[2] / wmax, '');
          if (tin) tin.classList.toggle('lgc-off', m[1] === 0); } };
    }

    if (t.id === 'oreDigger' && Sim.rockMix) {
      const total = Object.values((C.gradeFlow(t)[0] || {}).out || {}).reduce((a, b) => a + b, 0) || 1;
      const avgMix = v => { const base = (v ? v.mix : (C.asteroid || {}).mix) || {}, fill = (v && v.fill) || 'steel', m = {};
        let sum = 0; Object.keys(base).forEach(k => { if (k !== fill) { m[k] = base[k]; sum += base[k]; } }); m[fill] = Math.max(0, 1 - sum); return m; };
      const rv = Sim.rockVariantById && Sim.rockVariantById('rare');
      const M = [[L('m.rockCommon'), avgMix(null)]];
      if (rareSeen() && rv) M.push([L('m.rockRare'), avgMix(rv)]);
      const ORDER = ['steel', 'alu', 'lead', 'gold'];
      const outs = mix => ORDER.filter(r => (mix[r] || 0) > 0).map(r => '<span class="lgc-chip" style="--c:' + (R[r] || {}).color + '"><i></i><span>' +
        (R[r] || {}).name + '<b class="lgc-rate">' + perH(U.small(Math.round(mix[r] * total * 100) / 100) + ' kg/h') + '</b></span></span>').join('');
      return { html: moment + '<div class="lgc-flow"><span class="lgc-col">' + s.ins.map(c => chip(c, 'in')).join('') + '</span>' +
          track(s.ins.map(c => c.col)) + machBox(t) + track(['steel', 'alu', 'lead'].map(r => (R[r] || {}).color)) +
          '<span class="lgc-col lgc-ore" data-k="0">' + outs(M[0][1]) + '</span></div>',
        tick(now, root) { const i = Math.floor(now / 2600) % M.length, box = root.querySelector('.lgc-ore');
          setMoment(root, M[i][0]);
          if (box && box.dataset.k !== String(i)) { box.dataset.k = i; box.innerHTML = outs(M[i][1]); box.classList.remove('lgc-pop2'); void box.offsetWidth; box.classList.add('lgc-pop2'); } } };
    }

    if (t.splitter && !t.priority && !(t.ways > 2) && s.outs.length === 2) {
      const list = NR.ratios || [[1, 1], [2, 1], [1, 3]];
      return { html: flowRow(t, { outs: bar('a', oc, s.outs[0].label) + bar('b', oc, s.outs[1].label) }),
        tick(now, root) { const r = list[Math.floor(now / 1700) % list.length], sum = r[0] + r[1];
          setBar(root, 'a', r[0] / sum, r[0]); setBar(root, 'b', r[1] / sum, r[1]); } };
    }

    if (t.splitter && t.priority && s.outs.length === 2) {
      const idle = t.passesEnergy ? L('c.idlePower') : L('c.idleCrew');
      return { html: moment + flowRow(t, { outs: bar('a', oc, s.outs[0].label + ' ★') + bar('b', oc, s.outs[1].label) }) +
          '<p class="lgc-cap">' + idle + '</p>',
        tick(now, root) { const busy = Math.floor(now / 2200) % 2 === 0, e = ease(now, 2200);
          setMoment(root, busy ? L('m.prioBusy') : L('m.prioIdle'));
          setBar(root, 'a', busy ? e : 1 - e, ''); setBar(root, 'b', busy ? 1 - e : e, ''); } };
    }

    if (t.lightSplit) {
      const field = Sim.splitField ? Sim.splitField(t.id) : 'energyPerKg', need = Sim.stat(t.id, field) || 1;
      const steps = [1, 0.5, 0];
      const o1 = s.outs[0] || { label: R.light.name, col: R.light.color }, o2 = s.outs[1] || { label: R.heavy.name, col: R.heavy.color };
      return { html: moment + '<div class="lgc-flow">' + '<span class="lgc-col">' + chip(s.ins.find(c => c.res !== 'energy') || s.ins[0]) +
          bar('kw', R.energy.color, R.energy.name, 'in', 'energy') + '</span>' + track([ic]) + machBox(t) + track([o1.col, o2.col]) +
          '<span class="lgc-col">' + bar('light', o1.col, o1.label) + bar('heavy', o2.col, o2.label) + '</span></div>',
        tick(now, root) { const f = steps[Math.floor(now / 1800) % steps.length], e = ease(now, 1800);
          const sh = Sim.lightShare(f * need, 1, t.id);
          setMoment(root, f >= 1 ? L('m.splitEven') : f > 0 ? L('m.splitShort', o2.label) : L('m.splitNone', o2.label));
          setBar(root, 'kw', f * e, Math.round(f * 100) + '%');
          const r2 = v => U.small(Math.round(v * 100) / 100);
          setBar(root, 'light', sh * e, r2(sh)); setBar(root, 'heavy', (1 - sh) * e, r2(1 - sh)); } };
    }

    if (t.id === 'rubbleSorter' && Sim.rubbleSplit) {
      const wpk = Sim.stat(t.id, 'wfPerKg'), epk = Sim.stat(t.id, 'energyPerKg');
      const M = [[L('m.crewOnly'), 2 * wpk, 0], [L('m.crewPower'), wpk, epk], [L('m.powerOnly'), 0, 2 * epk]];
      return { html: moment + '<div class="lgc-flow"><span class="lgc-col">' + chip({ label: R.heavy.name, col: R.heavy.color }) +
          bar('wf', R.wf.color, R.wf.name, 'in', 'wf') + bar('kw', R.energy.color, R.energy.name, 'in', 'energy') + '</span>' + track([R.heavy.color]) + machBox(t) +
          track([R.glass.color, R.aggregate.color]) + '<span class="lgc-col">' + bar('glass', R.glass.color, R.glass.name, 'out', 'glass') +
          bar('agg', R.aggregate.color, R.aggregate.name, 'out', 'aggregate') + '</span></div>',
        tick(now, root) { const m = M[Math.floor(now / 1800) % M.length], e = ease(now, 1800), r = Sim.rubbleSplit(m[1], m[2], 1, t.id);
          setMoment(root, m[0]); setBar(root, 'wf', e * m[1] / (2 * wpk), ''); setBar(root, 'kw', e * m[2] / (2 * epk), '');
          setBar(root, 'glass', e * r.worked * r.glass, ''); setBar(root, 'agg', e * r.worked * (1 - r.glass), ''); } };
    }

    if (t.id === 'recycler' && s.outs.length >= 2) {
      const steps = [1, 0.5, 0.2];
      return { html: moment + '<div class="lgc-flow"><span class="lgc-col">' + chip(s.ins.find(c => c.res !== 'energy') || s.ins[0]) +
          bar('kw', R.energy.color, R.energy.name, 'in', 'energy') + '</span>' + track([ic]) + machBox(t) + track(s.outs.map(c => c.col)) +
          '<span class="lgc-col">' + bar('done', s.outs[0].col, s.outs[0].label, 'out', s.outs[0].res) + bar('pass', s.outs[1].col, s.outs[1].label) + '</span></div>',
        tick(now, root) { const f = steps[Math.floor(now / 1800) % steps.length], e = ease(now, 1800);
          setMoment(root, f >= 1 ? L('m.recAll') : L('m.recShort'));
          setBar(root, 'kw', f * e, Math.round(f * 100) + '%'); setBar(root, 'done', f * e, ''); setBar(root, 'pass', (1 - f) * e, ''); } };
    }

    if (t.store) {
      const nIn = (s.ins[0] && s.ins[0].n) || 1;
      return { html: moment + '<div class="lgc-flow"><span class="lgc-col">' + chip(s.ins[0] || { label: R.energy.name, col: R.energy.color }, 'in') + '</span>' +
          (nIn > 1 ? fan(nIn, R.energy.color, false, 'lgc-in') : track([R.energy.color], 'lgc-in')) + '<span class="lgc-batt" style="--c:' + G.config.iconColor(t) +
          '"><span class="lgc-bfill"></span>' + G.icons.svg(t.icon, 22, G.config.iconColor(t)) + '<em>' + t.name + '</em></span>' + track([R.energy.color]) +
          '<span class="lgc-col">' + chip(s.outs[0] || { label: R.energy.name, col: R.energy.color }, 'out') + '</span></div>',
        tick(now, root) { const per = 7000, p = (now % per) / per, fl = root.querySelector('.lgc-bfill'), tin = root.querySelector('.lgc-in');
          let lvl, msg, on;
          if (p < 0.4) { lvl = p / 0.4; msg = L('m.battIn'); on = true; }
          else if (p < 0.6) { lvl = 1; msg = L('m.battFull'); on = true; }
          else { lvl = 1 - (p - 0.6) / 0.4; msg = L('m.battOut'); on = false; }
          setMoment(root, msg); if (fl) fl.style.height = (lvl * 100) + '%'; if (tin) tin.classList.toggle('lgc-off', !on); } };
    }

    if (t.id === 'solarPanel') {
      return { html: moment + '<div class="lgc-flow"><span class="lgc-sky"><i class="lgc-sun"></i><i class="lgc-moon"></i></span>' +
          '<span class="lgc-tr lgc-light"></span>' + machBox(t) + track([R.energy.color], 'lgc-out') + '<span class="lgc-col">' + bar('kw', R.energy.color, R.energy.name, 'out', 'energy') + '</span></div>',
        tick(now, root) { const day = Math.floor(now / 2600) % 2 === 0, e = ease(now, 2600), sky = root.querySelector('.lgc-sky'), out = root.querySelector('.lgc-out');
          setMoment(root, day ? L('m.day') : L('m.night'));
          if (sky) sky.classList.toggle('night', !day); if (out) out.classList.toggle('lgc-off', !day);
          setBar(root, 'kw', day ? e : 1 - e, '');
          const rt = root.querySelector('.lgc-bar .lgc-rate');
          if (rt) { rt.dataset.day = rt.dataset.day || rt.textContent; rt.textContent = day ? rt.dataset.day : perH('0 KW/h'); } } };
    }

    if (t.collect && !t.autoCollect && !(t.recipe && t.recipe.inputs)) {
      return { html: moment + '<div class="lgc-flow"><span class="lgc-col">' + s.ins.map(c => chip(c, 'in')).join('') + '</span>' + track(s.ins.map(c => c.col), 'lgc-in') + machBox(t) +
          '<span class="lgc-till"><span class="lgc-tl">' + L('till') + '</span><span class="lgc-bt"><i data-k="till" style="background:' + oc + '"></i></span>' +
          '<span class="lgc-collect">' + L('collect') + '</span></span></div>',
        tick(now, root) { const per = 5200, p = (now % per) / per, tin = root.querySelector('.lgc-tr.lgc-in'), btn = root.querySelector('.lgc-collect');
          const lvl = p < 0.55 ? p / 0.55 : p < 0.85 ? 1 : 0;
          setMoment(root, p < 0.55 ? L('m.selling') : p < 0.85 ? L('m.tillFull') : L('m.collectEmpties'));
          setBar(root, 'till', lvl); if (tin) tin.classList.toggle('lgc-off', p >= 0.55 && p < 0.85);
          if (btn) btn.classList.toggle('on', p >= 0.7 && p < 0.9); } };
    }

    if (t.recipe && t.recipe.inputs) {
      const keys = Object.keys(t.recipe.inputs);
      const gem = t.recipe.gem && C.currencies[t.recipe.gem.cur];
      const out = t.recipe.out ? (R[t.recipe.out.res] || {}) : gem ? gem : (t.collect && C.currencies[t.collect.cur]) || null;
      const outRes = t.recipe.out ? t.recipe.out.res : t.recipe.gem ? t.recipe.gem.cur : t.recipe.ci ? 'ci' : (Object.keys(curRates.out)[0] || null);

      const many = !t.recipe.out && !t.recipe.gem && s.outs.length > 1;
      return { html: moment + '<div class="lgc-flow"><span class="lgc-col">' + keys.map(k => bar('in' + k, (R[k] || {}).color || '#9fb0c2', (R[k] || {}).name || k, 'in', k)).join('') +
          (t.recipe.kw ? bar('inkw', R.energy.color, R.energy.name, 'in', 'energy') : '') + (t.recipe.wf ? bar('inwf', R.wf.color, R.wf.name, 'in', 'wf') : '') +
          (t.recipe.handGems ? bar('ingem', C.currencies.diamond.color, C.currencies.diamond.name, 'in', 'diamond') : '') + '</span>' +
          track(s.ins.map(c => c.col)) + machBox(t) + track(many ? s.outs.map(c => c.col) : [out ? out.color : oc], 'lgc-out') +
          '<span class="lgc-col">' + (many ? s.outs.map(c => '<span class="lgc-pop" style="--c:' + c.col + '">' + c.label + rateOf('out', c.res) + '</span>').join('')
            : '<span class="lgc-pop" style="--c:' + (out ? out.color : oc) + '">' + (s.outs[0] ? s.outs[0].label : (out ? out.name : '')) +
          rateOf('out', outRes) + '<b class="lgc-cnt">0</b></span>') + '</span></div>' + (hasRates() ? '<p class="lgc-cap">' + L('c.batch') + '</p>' : ''),
        tick(now, root) { const crew = !!t.recipe.wf, per = crew ? 4800 : 3600, p = (now % per) / per, n = Math.floor(now / per), f = Math.min(1, p / 0.75);
          const fm = crew ? Math.min(1, p / 0.42) : f, fw = crew ? Math.max(0, Math.min(1, (p - 0.42) / 0.33)) : f;
          setMoment(root, p >= 0.75 ? L('m.batchDone') : !crew ? L('m.gathering') : p < 0.42 ? L('m.matsFirst') : L('m.crewBuilds'));
          root.querySelectorAll('[data-k^="in"]').forEach(i => { i.style.width = (100 * (p < 0.75 ? (i.dataset.k === 'inwf' ? fw : fm) : 0)) + '%'; });
          const out2 = root.querySelector('.lgc-out');
          if (out2) out2.classList.toggle('lgc-off', p < 0.75);
          root.querySelectorAll('.lgc-pop').forEach(pop => { pop.classList.toggle('on', p >= 0.75);
            const cn = pop.querySelector('.lgc-cnt'); if (cn) cn.textContent = n + (p >= 0.75 ? 1 : 0); }); } };
    }

    if (t.hire) {
      return { html: moment + '<div class="lgc-flow">' + machBox(t) + track([R.wf.color]) + '<span class="lgc-hands"></span></div>',
        tick(now, root) { const per = 900, max = (t.hire.max || 3), n = Math.floor(now / per) % (max + 2), box = root.querySelector('.lgc-hands');
          if (n > max) { setMoment(root, L('m.handsFull', max)); return; }
          setMoment(root, n ? L('m.handCosts') : L('m.newShift'));
          if (box && box.dataset.n !== String(n)) { box.dataset.n = n; let h = '';
            for (let j = 0; j < n; j++) h += '<span class="lgc-hand">' + G.icons.svg('player', 16, R.wf.color) + '<i style="transform:scale(' + (0.7 + j * 0.18).toFixed(2) + ')">$</i></span>';
            box.innerHTML = h; } } };
    }

    if (t.recruit) {
      const need = Sim.hubNeed ? Sim.hubNeed(t) : (t.need || 1), grow = Sim.hubGrowth ? Sim.hubGrowth(t) : 1;
      const poolBar = (k, col, label) => '<span class="lgc-bar lgc-pool"><span class="lgc-bl">' + label + '</span><span class="lgc-bt"><i data-k="' + k +
        '" style="background:' + col + '"></i></span><b data-n="' + k + '"></b></span>';
      return { html: moment + '<div class="lgc-flow"><span class="lgc-col">' + poolBar('wf', R.wf.color, R.wf.name) + poolBar('kw', R.energy.color, R.energy.name) +
          '</span>' + track([R.wf.color, R.energy.color]) + machBox(t) + track([R.wf.color], 'lgc-out') +
          '<span class="lgc-col"><span class="lgc-pop" style="--c:' + R.wf.color + '">' + L('recruits') + '<b class="lgc-cnt">0</b></span></span></div>',
        tick(now, root) { const per = 3600, p = (now % per) / per, k = Math.floor(now / per) % 5, f = Math.min(1, p / 0.75);
          const nd = need * Math.pow(grow, k), shown = U.small(Math.round(nd * 10) / 10);
          setMoment(root, p < 0.75 ? (k ? L('m.hubBigger', shown) : L('m.hubFill', shown)) : L('m.hubSigns'));
          setBar(root, 'wf', p < 0.75 ? f : 0, ''); setBar(root, 'kw', p < 0.75 ? f * 0.92 : 0, '');
          root.querySelectorAll('.lgc-pool b').forEach(b => { b.textContent = shown; });
          const pop = root.querySelector('.lgc-pop'), out2 = root.querySelector('.lgc-out');
          if (out2) out2.classList.toggle('lgc-off', p < 0.75);
          if (pop) { pop.classList.toggle('on', p >= 0.75); pop.querySelector('.lgc-cnt').textContent = k + (p >= 0.75 ? 1 : 0); } } };
    }
    return null;
  }

  function header(inf) {
    const C = G.config, t = inf.t, cat = t ? (C.categories.find(c => c.id === t.category) || {}).name : '';
    const moving = t && G.render.motionOf && G.render.motionOf(t) && G.render.liveIconOn;
    const icon = moving ? '<canvas class="lgc-live" data-t="' + t.id + '"></canvas>' : (inf.icon ? G.icons.svg(inf.icon, 34, inf.color) : '');
    const tags = (inf.dev ? '<span class="cx-tag cx-devtag">' + GG.i18n.t('ui.inDev') + '</span>' : inf.locked ? '<span class="cx-tag">' + GG.i18n.t('ui.locked') + '</span>' : '');
    return '<div class="lgx-hd">' +
      '<span class="cx-ic lgc-ic" style="--c:' + inf.color + '">' + icon + '</span>' +
      '<div class="lgx-in lgc-who"><h3>' + inf.name + '</h3><small>' + (cat || '') + '</small>' + (tags ? '<div class="lgc-tags">' + tags + '</div>' : '') + '</div>' +
      '<button class="lgx-x" type="button" aria-label="close">&times;</button></div>';
  }
  const sec = (cls, label, html) => '<div class="' + cls + '"><span>' + label + '</span>' + html + '</div>';

  function fit(card) {
    card.querySelectorAll('.lgc-flow').forEach(f => {
      f.style.zoom = '';
      if (f.scrollWidth > f.clientWidth + 1) f.style.zoom = Math.max(0.8, f.clientWidth / f.scrollWidth).toFixed(3);
    });
  }
  function fill(card, tile) {
    try { fillCard(card, tile); fit(card); }
    catch (e) {
      card._tick = null;
      card.innerHTML = header(tile._src) + '<div class="lgx-bd"><div class="lgc-err">' + L('failed') + String(e.message).replace(/</g, '&lt;') + '</div></div>';
    }
  }
  const has = k => GG.i18n.t('cg.' + k) !== 'cg.' + k;
  function fillCard(card, tile) {
    const inf = tile._src, C = G.config, S = G.state, Sim = G.sim, T = GG.i18n.t, t = inf.t, src = inf.it;
    card.style.setProperty('--c', inf.color);
    card._tick = null; card._t0 = W.performance.now();
    if (!t) {
      card.innerHTML = header(inf) + '<div class="lgx-bd lgx-in"><div class="cx-desc">' + T('ui.inDevNote') + '</div></div>';
      return;
    }
    const known = S.isUnlocked(t.id), owner = C.ownerSkill && C.ownerSkill(t.id);
    const mystery = !known && C.ui.codexMystery !== false && owner && !Sim.skillAvailable(owner);
    const shape = known || C.ui.codexHidePorts === false;
    const sp = shape && !mystery ? cardRows(t, specSplit(t)) : { main: [], rest: [] };
    curRates = shape && !mystery ? rateMap(t) : { in: {}, out: {}, batch: false };

    const pic = shape && !mystery ? special(t) : null, picHtml = shape && !mystery ? (pic ? pic.html : flowRow(t)) : '';

    const drawn = [...picHtml.matchAll(/class="lgc-rate">([^<]*)</g)].map(m => m[1]);
    const shown = drawn.join(' ').match(/\d+(\.\d+)?/g) || [];
    const covered = r => (strip(r[1]).match(/\d+(\.\d+)?/g) || []).every(x => shown.indexOf(x) >= 0);
    sp.rest = (t.category === 'manufacture' ? sp.main : sp.main.filter(r => !covered(r))).concat(sp.rest);
    sp.rest = sp.rest.concat(shape && !mystery ? extraRows(t).concat(ownRows(t), priceRows(t), t.category === 'manufacture' || USED_ON[t.id] ? usedRows(t) : []) : []);
    const sk = skillOf(t);
    let body = '';
    if (mystery) body = '<div class="cx-desc">' + T('cx.machineUnknown') + '</div>';
    else {

      body += sec('lgc-what', L('secWhat'), '<p>' + tint(whatText(t, sk)) + '</p>');
      const why = src.querySelector('.cx-why'), watch = src.querySelector('.cx-watch');
      const words = h => ru() ? h : (WORDS[t.id] || []).reduce((x, w) => x.replace(w[0], w[1]), h);
      if (why && !NO_WHY[t.id]) body += tint(words(why.outerHTML));
      else if (has('why.' + t.id)) body += tint(sec('cx-why', T('cx.whyBuild'), L('why.' + t.id)));

      const W2 = watchText(t);
      if ((watch || W2) && !NO_WATCH[t.id]) body += tint(W2 ? sec('cx-watch', T('cx.watchOut'), W2) : watch.outerHTML);
      if (shape && !NO_PIC[t.id]) body += '<div class="lgc-pic">' + picHtml + '</div>';
      card._tick = pic ? pic.tick : null;

      const notes2 = [has('note.' + t.id) ? L('note.' + t.id) : null, t.fuelSwitch && Sim.fuelSwitchOpen(t) ? L('fuelNote') : null,
        PRICED[t.id] ? L('priceNote') : null].filter(Boolean);

      const goTo = PRICED[t.id] ? '<button class="lgc-goto" type="button" data-tab="resources">' + G.icons.svg('materials', 13) + L('openMat') + '</button>' : '';
      if (notes2.length) body += sec('cx-note lgc-labnote', T('cx.noteLbl'), notes2.map(x => '<p>' + tint(x) + '</p>').join('') + goTo);

      if (shape && t.autoHire) {
        const A = t.autoHire, m = Math.round(A.sec / 60);
        body += sec('lgc-what', L('s.manualT'), '<p>' + tint(L('s.manual')) + '</p>') +
                sec('lgc-what', L('s.autoT'), '<p>' + tint(L('s.auto', A.hands, m, A.budgetCap)) + '</p>');
      }

      if (NO_ROWS[t.id]) body += notesHtml(sp.rest.filter(r => r[0] === 'Price' || r[0] === 'Used by'), []);
      else {
        const note = src.querySelector('.cx-note');
        let tips = has('tips.' + t.id) ? L('tips.' + t.id).split('\n') : NO_TIPS[t.id] ? [] : (note ? [...note.querySelectorAll('p')].map(p => p.innerHTML) : []);

        const mv = MOVE_TO_TIPS[t.id] || [];
        tips = sp.rest.filter(r => mv.indexOf(r[0]) >= 0).map(r => cap1(r[2] ? r[1] : GG.i18n.ins(r[1])) + '.').concat(tips);
        sp.rest = sp.rest.filter(r => mv.indexOf(r[0]) < 0);
        if (CUT_TIPS[t.id]) tips = tips.filter(p => !CUT_TIPS[t.id].test(strip(p)));
        body += notesHtml(NO_TIPS[t.id] ? sp.rest.filter(r => GROUP[r[0]] !== 'tips') : sp.rest, tips);
      }
    }
    const tryB = src.querySelector('.cx-try');
    let foot = '';
    if (tryB) foot = tryB.outerHTML;
    else if (!known && !mystery && sk) foot = '<div class="lgc-unlock">' + G.icons.svg(sk.icon || 'lock', 15, '#9fb0c2') + L('unlockedBy', sk.name) + '</div>';
    card.innerHTML = header(inf) + '<div class="lgx-bd lgx-in">' + body + (foot ? '<div class="lgc-foot">' + foot + '</div>' : '') + '</div>';
  }

  const PRICED = { market: 1, tradePost: 1, tradingFloor: 1, landfill: 1, incinerator: 1, burnYard: 1, clearingHouse: 1 };
  const MOVE_TO_TIPS = { biodome: ['Then'] };
  const USED_ON = { cleaner: 1, droneCleaner: 1, recycler: 1, weightSorter: 1, oreDigger: 1, wasteCleaner: 1, puDigger: 1, pyrolysisPlant: 1, acidWorks: 1 };
  const KEEP_ROWS = { fluidTank: ['Holds'], gemCollector: [], depot: ['Holds'] };
  const NO_PIC = { hiringAgency: 1, gemCollector: 1, groundLifter: 1 };
  const NO_BURN_NOTE = { pyrolysisPlant: 1 };

  const WORDS = { fluidTank: [[/\bBank oil\b/, 'Store oil']] };

  const CUT_TIPS = { biodome: /^(One dome, paying|Один купол)/i, rocket: /^(Built once; each flight|Строится один раз; каждый полёт)/i };
  const NO_WATCH = { solarPanel: 1, cleaner: 1, depot: 1, hiringAgency: 1 }, NO_WHY = { oilGenerator: 1, cleaner: 1, meteorBeacon: 1, depot: 1 };
  const DROP_ROWS = { powerStorage: ['Gives', 'To bank it'], powerVault: ['Gives', 'To bank it'], oreDigger: ['Makes'],
    market: ['Takes'], tradePost: ['Takes'], tradingFloor: ['Takes'], landfill: ['Takes'], incinerator: ['Takes'], burnYard: ['Takes'],
    treePlanter: ['Also takes', 'Which does'], seedDrill: ['Also takes', 'Which does'], strikeVault: ['To bank it', 'Gives'] };
  const NO_ROWS = { uniSplitter: 1, hiringAgency: 1, fluidSplitter: 1, crewJunction: 1, crewSplitter: 1, prioCrewSplitter: 1, prioPowerSplitter: 1,
    powerSplitter: 1, cleaner: 1, salvageSplitter: 1 };
  const NO_TIPS = { player: 1, brewVat: 1, panelWorks: 1, windTurbine: 1, stormTurbine: 1, bladeWorks: 1, etchingWorks: 1, glazingWorks: 1,
    droneCleaner: 1, recycler: 1, weightSorter: 1, wasteCleaner: 1, puDigger: 1, oreDigger: 1,
    treePlanter: 1, waterPump: 1, repository: 1,
    magnetSeparator: 1, hazardPlant: 1, fertilizerPlant: 1, cellAssembler: 1, paperMill: 1, fibrePress: 1, leachingPlant: 1, circuitWorks: 1,
    rubbleSorter: 1, gearWorks: 1, rodWorks: 1, turbofuelRefinery: 1,
    waterCleaner: 1, oilSeparator: 1, pyrolysisPlant: 1, acidWorks: 1, diamondPress: 1, prismPress: 1, seedDrill: 1, fuelPlant: 1 };
  function whatText(t, sk) {
    if (has('what.' + t.id)) return L('what.' + t.id);
    if (sk && sk.desc) return sk.desc;
    return descFor(t);
  }
  function watchText(t) {
    if (t.id === 'fluidTank') return L('watch.fluidTank', GG.i18n.ins(G.util.small(t.outRate) + ' kg/h'));
    return has('watch.' + t.id) ? L('watch.' + t.id) : '';
  }

  function descFor(t) {
    const base = t.desc || '';
    if (!t.descMore) return base;
    const k = kitPort(t);
    return (k && !kitOn(t)) ? base : base + ' ' + t.descMore;
  }
  function rareSeen() { const g = G.state.g; return !!(g && g.rareFirstAt !== undefined); }

  function blackmereOpen() { const P = (G.config.locations || []).find(l => l.id === 'blackmere'); return !!(P && G.state.locOpen(P)); }

  function ownRows(t) {
    const C = G.config, U = G.util, Sim = G.sim, rows = [], I = GG.i18n;
    if (t.id === 'treePlanter' || t.id === 'seedDrill') {
      const r = t.recipe, fert = (C.resources.fert || {}).name, open = G.state.hasSkill('fertilising');
      const loads = Math.round((r.boostMax - 1) / r.boost);
      let kgAll = 0; for (let i = 0; i < loads; i++) kgAll += r.inputs.fert + r.growth.fert * i;
      if (t.collect) rows.push(row('Till', open ? L('r.tillGrows', I.ins(U.small(t.collect.cap) + ' CI'), fert) : L('r.till', I.ins(U.small(t.collect.cap) + ' CI'))));
      if (open) {
        rows.push(row('One load', L('r.fertLoad', I.ins(U.small(r.inputs.fert) + ' kg'), fert, I.ins(U.small(r.growth.fert) + ' kg'))));
        rows.push(row('Each load', L('r.fertEach', Math.round(r.boost * 100) + '%', I.ins(U.small(r.boost * t.ciPerWF) + ' CI/h'), I.ins('1 WF/h'))));
        rows.push(row('Most', L('r.fertMost', U.small(r.boostMax), loads, I.ins(U.small(kgAll) + ' kg'))));
      }
    }
    if (t.id === 'waterPump') {
      const R = C.resources, kwh = 1 / (Sim.stat(t.id, 'pumpPerKw') || t.pumpPerKw), bm = blackmereOpen();
      const P = C.nodeTypes.waterSite, O = C.nodeTypes.oilSite, per = st => Math.round(st.capacity / st.volume);
      rows.push(row('Pumping out', bm ? L('r.pumpOut2', I.ins(U.small(kwh) + ' KW/h'), I.ins('1 kg/h'), R.dirtyWater.name, R.oilyWater.name)
                                      : L('r.pumpOut', I.ins(U.small(kwh) + ' KW/h'), I.ins('1 kg/h'), R.dirtyWater.name)));
      rows.push(row('Putting back', L('r.pumpBack', R.water.name)));
      rows.push(row('Pays back', bm ? L('r.payBack2', I.ins(per(P) + ' CI'), P.name, I.ins(per(O) + ' CI'), O.name) : L('r.payBack', I.ins(per(P) + ' CI'), P.name)));
      rows.push(row('Limit', L('r.pumpLimit')));
    }

    if (t.gemArm) rows.push(row('Till', L('r.gemTill', U.small(t.collect.cap))));
    if (t.id === 'biodome' && t.recipe && t.recipe.ci) rows.push(row('Each dome', L('r.dome', I.ins(U.small(t.recipe.ci) + ' CI/h'))));

    if (t.rocket) {
      const RK = t.rocket, F = RK.flight, A = RK.flightAlt, R = C.resources, h = sec2 => Math.round(sec2 / 60);
      rows.push(row('Build', L('r.build', Object.keys(RK.build).map(k => I.ins(U.small(RK.build[k]) + ' kg') + ' ' + (R[k] || {}).name).join(' + '))));
      rows.push(row('Crew', L('r.crew', I.ins(U.small(F.wf) + ' WF'))));
      const ex = (F.exhaustCi || 0) * F.fuel, fuelRow = (res, kgv, x, s2) => row('Fuel', L('r.fuel', I.ins(U.small(kgv) + ' kg'), (R[res] || {}).name,
        x > 0 ? '-' + I.ins(Math.round(x).toLocaleString('en') + ' CI') : I.ins('0 CI'), h(s2)));
      rows.push(fuelRow('turbofuel', F.fuel, ex, F.sec));
      if (A && Sim.fuelSwitchOpen(t)) rows.push(fuelRow(A.res, A.fuel, 0, A.sec));
      rows.push(row('Hold', L('r.hold', RK.holdGems)));
    }
    return rows;
  }

  function madeBy(t) {
    const C = G.config, out = [];
    let fl = []; try { fl = C.gradeFlow(t) || []; } catch (e) { fl = []; }
    fl.forEach(f => Object.keys(f.out || {}).concat(Object.keys(f.side || {})).forEach(r => { if (out.indexOf(r) < 0) out.push(r); }));
    if (t.recipe && t.recipe.out && out.indexOf(t.recipe.out.res) < 0) out.push(t.recipe.out.res);
    return out.filter(r => C.resources[r] && C.resources[r].flow !== 'rate' && !G.sim.demoRes(r) && shownRes(t, r));
  }

  function shownRes(t, r) { const s = sides(t); return s.outs.some(c => c.res === r) || !!(t.recipe && t.recipe.out && t.recipe.out.res === r); }

  function priceRows(t) {
    const C = G.config, U = G.util, acc = id => [].concat(...(((C.nodeTypes[id] || {}).ports || {}).in || []).map(p => p.accepts || [p.res]));
    const sells = acc('market'), burns = acc('landfill');
    const num = v => v >= 1000 ? Math.round(v).toLocaleString('en') : U.small(v);
    return madeBy(t).map(r => {
      const nm = C.resources[r].name, v = C.gradeValue[r];
      if (sells.indexOf(r) < 0 || v === undefined) return row('Price', L('r.noSale', nm));
      return row('Price', burns.indexOf(r) >= 0 ? L('r.sellBurn', nm, '$' + num(v), GG.i18n.ins(num(v) + ' CI'))
                                                : L('r.sell', nm, '$' + num(v)) + (NO_BURN_NOTE[t.id] ? L('r.noBurn') : ''));
    });
  }

  function usedRows(t) {
    const C = G.config, S = G.state, Sim = G.sim;
    return madeBy(t).map(r => {
      const users = Object.values(C.nodeTypes).filter(o => o.kind === 'machine' && o.id !== t.id && !PRICED[o.id] && !/^prac/.test(o.id) &&
        !Sim.demoNode(o.id) && eats(o, r));
      if (!users.length) return null;
      const known = users.filter(o => S.isUnlocked(o.id)).map(o => o.name), hidden = users.length - known.length;
      const tailTxt = hidden ? (hidden === 1 ? L('r.lockedOne') : L('r.lockedMany', hidden)) : '';
      const list = known.concat(tailTxt ? [tailTxt] : []);
      const joined = list.length > 1 ? list.slice(0, -1).join(', ') + L('and') + list[list.length - 1] : list[0];
      return row('Used by', (madeBy(t).length > 1 ? C.resources[r].name + ': ' : '') + joined);
    }).filter(Boolean);
  }

  function eats(o, r) {
    let fl = []; try { fl = G.config.gradeFlow(o) || []; } catch (e) { fl = []; }
    return fl.some(f => (f.in || {})[r] !== undefined) || !!(o.recipe && o.recipe.inputs && o.recipe.inputs[r] !== undefined) ||
      !!(o.powerUp && o.powerUp.res === r) || !!(o.fission && o.fission.res === r) || !!(o.fuelAlt && o.fuelAlt.res === r) ||
      !!(o.fissionAlt && o.fissionAlt.res === r);
  }
  function kitPort(t) { return t.powerUp ? ((t.ports || {}).in || []).find(p => p.id === t.powerUp.port) : null; }
  function kitOn(t) { const p = kitPort(t); return !p || !p.requires || G.state.hasSkill(p.requires); }

  function feedsOf(t) {
    const C = G.config, outs = ((t.ports || {}).out || []).map(p => p.res).concat(t.convert && t.convert.out ? [t.convert.out.res] : []);
    return Object.values(C.nodeTypes).find(o => o.powerUp && outs.indexOf(o.powerUp.res) >= 0 && kitOn(o)) || null;
  }

  function loadGain(o) {
    const U = G.util, P = o.powerUp, unit = { wfRate: ' WF/h', energyRate: ' KW/h' }[P.stat] || '', base = o[P.stat];
    return base ? ' (+' + GG.i18n.ins(U.small(P.boost * base) + unit) + ')' : '';
  }

  function kitRows(o) {
    const U = G.util, P = o.powerUp, rows = [], I = GG.i18n;
    rows.push(row('Feeds', o.name));
    rows.push(row('One load', L('r.kitLoad', I.ins(U.small(P.kg) + ' kg'), I.ins(U.small(P.growth) + ' kg'))));
    if (P.boost) rows.push(row('Each load', L('r.kitEach', Math.round(P.boost * 100) + '%', o.name) + loadGain(o)));
    if (P.solarShare) rows.push(row('Each load', L('r.kitSolar', Math.round(P.solarShare * 100) + '%', o.name)));
    if (P.loadsMax) rows.push(row('After ' + P.loadsMax + ' loads', L('r.kitSun', (o.overdrive || {}).sunName || o.name)));
    else if (P.boostMax == null) rows.push(row('Loads', L('r.noLimit')));
    return rows;
  }
  function cardRows(t, sp) {
    const U = G.util, Sim = G.sim, I = GG.i18n;
    const both = fn => { sp.main = fn(sp.main); sp.rest = fn(sp.rest); };
    const KIT = ['Also takes', 'Which does'];
    if (t.powerUp && !kitOn(t)) {

      both(a => a.filter(r => !(KIT.indexOf(r[0]) >= 0 || (t.powerUp.loadsMax && r[0] === 'Then'))));
    }
    if (t.overdrive && t.overdrive.enabled) {

      both(a => a.filter(r => !(r[0] === 'Takes' || r[0] === 'Makes' || (r[0] === 'Then' && t.powerUp && t.powerUp.loadsMax))));
      sp.rest.unshift(row('Power', L('r.robotPower', I.ins(U.small(t.kwPerWf) + ' KW'), I.ins('1 WF'))));
      if (t.powerUp && t.powerUp.loadsMax && kitOn(t)) sp.rest.push(row('After ' + t.powerUp.loadsMax + ' loads', L('r.robotSun', t.overdrive.sunName)));
    }
    if (t.powerUp && t.powerUp.boost && kitOn(t)) {
      both(a => a.map(r => r[0] === 'Which does' ? row(r[0], L('r.loadAdds', Math.round(t.powerUp.boost * 100) + '%') + loadGain(t) +
        L('r.loadAfter', I.ins(U.small(t.powerUp.growth) + ' kg'))) : r));
    }

    if (t.id === 'trashJunction') both(a => a.filter(r => ['needs', 'gives'].indexOf(groupOf(r[0])) < 0));
    if (t.lightSplit && t.category !== 'manufacture') both(a => a.filter(r => r[0] !== 'Makes'));
    if (DROP_ROWS[t.id]) both(a => a.filter(r => DROP_ROWS[t.id].indexOf(r[0]) < 0));

    if (t.id === 'waterPump') { sp.main = []; sp.rest = []; }

    if (t.id === 'meteorBeacon') both(a => a.map(r => r[0] === 'Makes' ? row(r[0], L('r.beacon', I.ins(U.small(t.pullCost) + ' KW'))) : r));
    if (KEEP_ROWS[t.id]) both(a => a.filter(r => KEEP_ROWS[t.id].indexOf(r[0]) >= 0));

    if (t.print) both(a => a.map(r => r[0] === 'Otherwise' && !r[2] ? row(r[0], I.ins(r[1]).replace(/ at \d+(\.\d+)? times the cost/, '')
      .replace(/, но в \d+(\.\d+)? раза дороже/, '')) : r));

    if (t.rocket) both(a => a.filter(r => !(r[0] === 'Takes' || r[0] === 'Costs')));
    if (t.fuelSwitch && Sim.fuelSwitchOpen(t)) {
      const R = G.config.resources;
      if (t.fuelAlt) {
        sp.rest.unshift(row('Other fuel', L('r.otherFuel', I.ins('1 kg'), (R[t.fuelAlt.res] || {}).name, I.ins(U.small(t.fuelAlt.kw) + ' KW/h'))));
        both(a => a.map(r => r[0] === 'Costs' ? row(r[0], (r[2] ? r[1] : I.ins(r[1])) + L('r.eitherFuel')) : r));
      }
      if (t.fissionAlt) {
        const A = t.fissionAlt, m = Math.round(A.sec / 60);
        sp.rest.unshift(row('Other fuel', L('r.otherFission', I.ins(U.small(A.kg) + ' kg'), (R[A.res] || {}).name, m, I.ins(U.small(A.kw) + ' KW/h'))));
      }
    }
    const o = feedsOf(t);
    if (o) sp.rest = sp.rest.concat(kitRows(o));
    return sp;
  }

  function gameTime(h) {
    if (ru()) return String(h);
    return String(h)
      .replace(/(?<![(\d.])(\d+(?:\.\d+)?) real minutes?/, (m, a) => a + ' game hours (' + a + ' real minutes)')
      .replace(/while the sun is up, (\d+(?:\.\d+)?)s on and (\d+(?:\.\d+)?)s off/, (m, a, b) =>
        'it works while the sun is up: ' + (a / 60) + ' game hours of day, then ' + (b / 60) + ' of night (' + (a / 60) + ' and ' + (b / 60) + ' real minutes)');
  }

  const GROUP = { 'Takes': 'needs', 'Also takes': 'kit', 'Which does': 'kit', 'Crew': 'needs', 'Costs': 'needs', 'To bank it': 'needs',
    'Makes': 'gives', 'Gives': 'gives', 'Pays': 'gives', 'Pays back': 'gives', 'Prints': 'gives', 'Also out': 'gives', 'Then': 'gives',
    'Otherwise': 'gives', 'Sells': 'gives', 'Burns': 'gives', 'Most power': 'gives', 'Every strike': 'gives', 'Holds': 'gives',
    'Hires': 'crew', 'Hires at': 'crew', 'Pays with': 'crew', 'Each hand': 'crew', 'Next hand': 'crew',
    'Discount': 'crew', 'On a Bank': 'crew', 'Note': 'tips',
    'Feeds': 'kit', 'One load': 'kit', 'Each load': 'kit', 'Loads': 'kit', 'Power': 'rules', 'Other fuel': 'needs',
    'Build': 'needs', 'Fuel': 'needs', 'Hold': 'gives', 'Till': 'gives', 'Most': 'kit', 'Pumping out': 'needs', 'Putting back': 'needs',
    'Each dome': 'gives', 'Price': 'gives', 'Used by': 'gives' };
  const groupOf = label => GROUP[label] || (/^After \d+ loads$/.test(label) ? 'kit' : 'rules');
  const GROUPS = ['needs', 'gives', 'kit', 'crew', 'rules', 'tips'];

  const cap1 = h => String(h).replace(/^((?:<[^>]+>)*)(\p{Ll})(?!\d)/u, (m, tags, ch) => tags + ch.toUpperCase());
  function notesHtml(rest, notes) {
    if (!rest.length && !notes.length) return '';
    const rows = rest.map(r => ({ g: groupOf(r[0]), label: lbl(r[0]), html: tint(r[2] ? r[1] : GG.i18n.ins(gameTime(r[1]))) }));

    const exact = rest.some(r => r[0] === 'Next hand');
    notes.filter(p => !(exact && /(costs more|стоит дороже)/i.test(strip(p)))).forEach(p => rows.push({ g: 'tips', label: '', html: tint(cap1(gameTime(p))) }));
    return '<div class="lgc-groups">' + GROUPS.map(g => {
      const list = rows.filter(r => r.g === g); if (!list.length) return '';
      return '<div class="lgc-grp"><span class="lgc-gh">' + L('grp.' + g) + '</span>' + list.map(r => r.label
        ? '<div class="lgc-row"><span>' + r.label + '</span><div>' + cap1(r.html) + '</div></div>'
        : '<div class="lgc-row lgc-tip"><div>' + r.html + '</div></div>').join('') + '</div>';
    }).join('') + '</div>';
  }

  let rafOn = false;
  function cardLoop() {
    const card = D.getElementById('lgx-card');
    if (!card || !D.getElementById('lgx-back')) { rafOn = false; return; }
    if (!G.ui.panelKind || G.ui.panelKind() !== 'codex') { closeCard(true); rafOn = false; return; }
    const now = W.performance.now();
    const cv = card.querySelector('canvas.lgc-live');
    if (cv) drawLive(cv, G.config.nodeTypes[cv.dataset.t]);
    if (card._tick) { try { card._tick(now - (card._t0 || 0), card); } catch (e) { card._tick = null; } }
    W.requestAnimationFrame(cardLoop);
  }
  function drawLive(cv, t) {
    const z = zoom(), dpr = W.devicePixelRatio || 1, css = cv.clientWidth || 64, px = Math.round(css * dpr * z);
    if (cv.width !== px) { cv.width = px; cv.height = px; }
    const c2 = cv.getContext('2d'), k = px / 28;
    c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, px, px); c2.setTransform(k, 0, 0, k, 0, 0);
    try { G.render.liveIconOn(c2, t, 0, 0, 28, W.performance.now() / 1000); } catch (e) {}
  }
  function startLoop() { if (!rafOn) { rafOn = true; W.requestAnimationFrame(cardLoop); } }
  function zoom() { return (G.render.uiZoom && G.render.uiZoom()) || 1; }
  function fromTile(card, tile, even) {

    const z = zoom(), a = tile.getBoundingClientRect(), b = card.getBoundingClientRect();
    const dx = ((a.left + a.width / 2) - (b.left + b.width / 2)) / z, dy = ((a.top + a.height / 2) - (b.top + b.height / 2)) / z;
    const sx = a.width / b.width, sy = even ? sx : a.height / b.height;
    return 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';
  }
  function startPose(card, tile, even) {
    if (tile && tile.offsetParent) return { t: fromTile(card, tile, even), o: 1 };
    return { t: 'scale(.86)', o: 0 };
  }
  let curTile = null, busy = false;

  function openCard(tile) {
    if (busy) return;
    const b = back(), card = D.getElementById('lgx-card');
    curTile = tile;
    fill(card, tile); startLoop();
    card.classList.add('lgx-hide');
    card.style.transition = 'none';
    const p = startPose(card, tile);
    card.style.transform = p.t; card.style.opacity = p.o;
    void card.offsetWidth;
    tile.classList.add('lgx-lift');
    card.style.transition = 'transform ' + dur() + 'ms cubic-bezier(.2,.8,.2,1), opacity ' + Math.round(dur() * .7) + 'ms ease';
    b.classList.add('on');
    card.classList.remove('lgx-hide');
    card.style.transform = 'none'; card.style.opacity = 1;
    card.scrollTop = 0;
    arrows();
  }
  function closeCard(now) {
    const b = D.getElementById('lgx-back'); if (!b || !b.classList.contains('on')) return;
    const card = D.getElementById('lgx-card'), tile = curTile;
    dropGhost();
    const done = () => { b.remove(); if (tile) tile.classList.remove('lgx-lift'); busy = false; };
    if (now) { done(); return; }
    busy = true;

    const T = Math.round(dur() * .8);
    const p = startPose(card, tile, true);
    if (tile) tile.classList.remove('lgx-lift');
    card.style.transition = 'transform ' + T + 'ms cubic-bezier(.4,0,.6,1), opacity ' + Math.round(T * .8) + 'ms ease-in ' + Math.round(T * .2) + 'ms';
    card.style.transform = p.t; card.style.opacity = 0;
    b.classList.remove('on');
    setTimeout(done, T + 30);
  }

  let ghost = null, ghostT = 0;
  function dropGhost() { if (ghost) { ghost.remove(); ghost = null; } clearTimeout(ghostT); }
  function step(d) {
    const list = tiles(), i = list.indexOf(curTile), n = list[i + d];
    if (!n) return;
    const card = D.getElementById('lgx-card'), b = D.getElementById('lgx-back');
    dropGhost();

    const z = zoom(), r = card.getBoundingClientRect();
    ghost = card.cloneNode(true); ghost.removeAttribute('id'); ghost.className = 'lgx-ghost';
    ghost.style.cssText = card.style.cssText + ';position:fixed;margin:0;left:' + (r.left / z) + 'px;top:' + (r.top / z) + 'px;width:' +
      (r.width / z) + 'px;height:' + (r.height / z) + 'px;transform:none;opacity:1;transition:none';
    ghost.scrollTop = card.scrollTop;

    const cs = card.querySelectorAll('canvas'), gs = ghost.querySelectorAll('canvas');
    cs.forEach((c, j) => { if (gs[j]) { gs[j].width = c.width; gs[j].height = c.height; gs[j].getContext('2d').drawImage(c, 0, 0); } });
    b.appendChild(ghost);
    if (curTile) curTile.classList.remove('lgx-lift');
    curTile = n;
    n.classList.add('lgx-lift');
    n.scrollIntoView({ block: 'nearest' });
    fill(card, n); card.scrollTop = 0; startLoop();
    const T = flipDur(), w = r.width / z;
    card.style.transition = 'none'; card.style.transform = 'scale(.9) translateY(14px)'; card.style.opacity = 0;
    card.style.zIndex = '0'; ghost.style.zIndex = '1';
    void card.offsetWidth;
    ghost.style.transition = 'transform ' + T + 'ms cubic-bezier(.4,0,.9,.6), opacity ' + T + 'ms ease';
    ghost.style.transform = 'translateX(' + (-d * w * .9) + 'px) rotate(' + (-d * 9) + 'deg)'; ghost.style.opacity = 0;
    const inDelay = Math.round(T * .25);
    card.style.transition = 'transform ' + T + 'ms cubic-bezier(.2,.8,.2,1) ' + inDelay + 'ms, opacity ' + T + 'ms ease ' + inDelay + 'ms';
    card.style.transform = 'none'; card.style.opacity = 1;
    ghostT = setTimeout(dropGhost, T + 40);
    G.audio.play('click');
    arrows();
  }
  function arrows() {
    const list = tiles(), i = list.indexOf(curTile);
    D.querySelectorAll('.lgx-arw').forEach(a => { a.disabled = (+a.dataset.d < 0 ? i <= 0 : i >= list.length - 1); });
  }

  W.addEventListener('keydown', e => {
    if (!D.getElementById('lgx-back')) return;
    if (e.key === 'Escape') closeCard();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    e.stopImmediatePropagation(); e.preventDefault();
  }, true);

  D.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.lgc-goto'); if (!b) return;
    e.stopPropagation(); e.preventDefault();
    closeCard(true);
    const name = GG.i18n.t('cx.materials');
    const tab = [...D.querySelectorAll('#panel .cx-tabs .pn-tab')].find(x => x.textContent.trim() === name);
    if (tab) tab.click();
  }, true);
  const stopIn = e => { if (e.target.closest && e.target.closest('#lgx-back')) e.stopPropagation(); };
  ['pointerdown', 'mousedown', 'mouseup', 'touchstart', 'wheel'].forEach(k => D.addEventListener(k, stopIn, true));

  return {
    on: () => CFG().enabled !== false,

    after(wrap) {
      G = GG;
      if (!wrap || CFG().enabled === false) return;
      tintCache = null;
      build(wrap);
    },
    sync,
    close: () => closeCard(true),

    tileOf: id => D.querySelector('.cx-wrap .lgx-tile[data-cx="' + id + '"]'),
    open(tile) { if (tile) { busy = false; dropGhost(); const b = D.getElementById('lgx-back'); if (b) b.remove(); openCard(tile); } },
  };
})();
