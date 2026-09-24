

































(function (GG) {
  'use strict';

  const P = GG.pace = {};
  const C = GG.config, S = GG.state, Sim = GG.sim, U = GG.util;

  const cfg = function () { return C.pacing || {}; };
  P.on = function () { return !!(C.pacing && C.pacing.enabled); };

  



  function log() {
    const g = S.g;
    if (!g.paceLog) g.paceLog = { aff: {}, buy: {}, samples: [], every: 0 };
    if (!g.paceLog.aff) g.paceLog.aff = {};
    if (!g.paceLog.buy) g.paceLog.buy = {};
    if (!Array.isArray(g.paceLog.samples)) g.paceLog.samples = [];
    return g.paceLog;
  }
  P.log = log;

  



  




  function lvOf(id) { const v = Number(S.skillLevel(id)); return v > 0 ? Math.floor(v) : 0; }
  P.lvOf = lvOf;

  P.affordable = function (sk) {
    if (!Sim.skillAvailable(sk)) return false;
    if (Sim.altUnlocked(sk)) return true;
    const cur = sk.currency || 'ci';
    const have = cur === 'money' ? S.g.money : S.g.ci;
    return U.canAfford(have, Sim.nextCost(sk));
  };

  
  let acc = 0;

  



  function stampAffordable() {
    const L = log(), t = S.g.playtime;
    for (const sk of C.skills) {
      const lv = lvOf(sk.id);
      if (lv >= Sim.maxLevel(sk)) continue;
      if (!P.affordable(sk)) continue;
      const row = L.aff[sk.id] || (L.aff[sk.id] = []);
      if (row[lv] === undefined || row[lv] === null) row[lv] = +t.toFixed(2);
    }
  }

  

  function sample() {
    const L = log(), g = S.g;
    L.samples.push({
      t: +g.playtime.toFixed(1),
      ci: +(g.ci || 0).toFixed(2), money: +(g.money || 0).toFixed(2),
      tci: +(g.totalCI || 0).toFixed(2), tmoney: +(g.totalMoney || 0).toFixed(2),
      kg: +(g.totalCleaned || 0).toFixed(2),
      cih: +(Sim.ciPerHour || 0).toFixed(3), mh: +(Sim.moneyPerHour || 0).toFixed(3),
      lv: C.skills.reduce((a, s) => a + lvOf(s.id), 0),
      nodes: (g.nodes || []).length,
    });
    



    const max = cfg().maxSamples || 4000;
    if (L.samples.length > max) {
      L.samples = L.samples.filter((_, i) => i % 2 === 0);
      L.every = (L.every || cfg().sampleSec || 30) * 2;
    }
  }

  



  let affAcc = 0;
  P.tick = function (dt) {
    if (!P.on()) return;
    affAcc += dt; acc += dt;
    if (affAcc >= (cfg().affordSec || 0.5)) { affAcc = 0; stampAffordable(); }
    if (acc < (log().every || Math.max(0.25, cfg().sampleSec || 30))) return;
    acc = 0;
    sample();
  };

  




  P.forward = function (hours, opts) {
    opts = opts || {};
    if (!P.on()) return { ok: false, why: 'config.pacing.enabled is false' };
    if (!S.g || !S.g.nodes) return { ok: false, why: 'No run is open' };

    const K = cfg();
    const step = opts.step || K.forwardStep || 0.5;
    const autoBuy = opts.autoBuy !== undefined ? opts.autoBuy : (K.autoBuy !== false);
    const secs = Math.max(0, (hours || K.forwardHours || 20) * 3600);
    const steps = Math.min(K.maxSteps || 400000, Math.ceil(secs / step));

    const snapshot = JSON.stringify(S.g);
    const queued = Sim.events;
    const t0 = S.g.playtime;
    const wall = performance.now();
    let bought = 0, out = null;

    try {
      Sim.events = [];                     
      for (let i = 0; i < steps; i++) {
        Sim.tick(step);
        if (autoBuy) bought += buyEverythingAffordable();
      }
      const L = log();
      out = {
        ok: true, hours: secs / 3600, steps: steps, step: step,
        autoBuy: autoBuy, bought: bought,
        fromPlaytime: +t0.toFixed(1), toPlaytime: +S.g.playtime.toFixed(1),
        ci: +(S.g.totalCI || 0).toFixed(1), money: +(S.g.totalMoney || 0).toFixed(1),
        levels: C.skills.reduce((a, s) => a + lvOf(s.id), 0),
        maxLevels: C.skills.reduce((a, s) => a + Sim.maxLevel(s), 0),
        aff: JSON.parse(JSON.stringify(L.aff)),
        buy: JSON.parse(JSON.stringify(L.buy)),
        samples: JSON.parse(JSON.stringify(L.samples)),
        msTaken: +(performance.now() - wall).toFixed(0),
      };
    } finally {
      S.g = JSON.parse(snapshot);          
      Sim.events = queued;
      Sim.invalidate();
      acc = 0;
    }
    return out;
  };

  



  function buyEverythingAffordable() {
    let total = 0;
    for (let pass = 0; pass < 40; pass++) {
      const ready = C.skills.filter(P.affordable)
        .sort((a, b) => (Sim.nextCost(a) || 0) - (Sim.nextCost(b) || 0));
      if (!ready.length) return total;
      let did = 0;
      for (const sk of ready) {
        if (!P.affordable(sk)) continue;   
        const res = Sim.buySkill(sk.id);   
        if (!res.ok) continue;
        did++; total++;
      }
      if (!did) return total;
    }
    return total;
  }

  P.noteBuy = function (id, level) {
    if (!P.on()) return;
    const lv = Number(level) > 0 ? Math.floor(Number(level)) : 0;
    const L = log();
    const row = L.buy[id] || (L.buy[id] = []);
    if (row[lv] === undefined || row[lv] === null) row[lv] = +S.g.playtime.toFixed(2);
  };

  
  const hm = function (sec) {
    if (sec === undefined || sec === null) return '—';
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h ? h + 'h ' + String(m).padStart(2, '0') + 'm' : m + 'm ' +
           String(Math.floor(sec % 60)).padStart(2, '0') + 's';
  };
  P.hm = hm;
  const nz = function (v) { return (v === null || v === undefined) ? undefined : v; };

  

  P.rows = function (src) {
    const L = src || log();
    const rows = [];
    for (const sk of C.skills) {
      const n = Sim.maxLevel(sk);
      for (let lv = 0; lv < n; lv++) {
        


        const aff = nz((L.aff[sk.id] || [])[lv]);
        const buy = nz((L.buy[sk.id] || [])[lv]);
        if (aff === undefined && buy === undefined) continue;
        rows.push({
          skill: sk.name, id: sk.id, tree: sk.tree || 'ci',
          level: lv + 1, cost: Sim.costOf(sk, lv),
          cur: (sk.currency || 'ci') === 'money' ? '$' : 'CI',
          affordableAt: hm(aff), boughtAt: hm(buy),
          affSec: aff === undefined ? Infinity : aff,
        });
      }
    }
    rows.sort((a, b) => a.affSec - b.affSec);
    return rows;
  };

  

  P.unreached = function (src) {
    const L = src || log();
    const out = [];
    for (const sk of C.skills) {
      const n = Sim.maxLevel(sk);
      for (let lv = 0; lv < n; lv++) {
        if (nz((L.aff[sk.id] || [])[lv]) !== undefined) continue;
        out.push({ skill: sk.name, id: sk.id, tree: sk.tree || 'ci',
                   level: lv + 1, cost: Sim.costOf(sk, lv),
                   cur: (sk.currency || 'ci') === 'money' ? '$' : 'CI' });
      }
    }
    return out;
  };

  




  P.curve = function (src, bucketMin) {
    const L = src || log();
    const span = Math.max(1, (bucketMin || 60)) * 60;
    const rows = P.rows(L).filter(r => r.affSec < Infinity);
    const last = L.samples.length ? L.samples[L.samples.length - 1].t : 0;
    const out = [];
    for (let i = 1; (i - 1) * span <= last; i++) {
      const from = (i - 1) * span, to = i * span;
      const inSlice = rows.filter(r => r.affSec >= from && r.affSec < to);
      const s = L.samples.filter(x => x.t <= to).pop();
      out.push({
        at: hm(to),
        newLevels: inSlice.length,
        ciSkills: inSlice.filter(r => r.tree !== 'money').length,
        moneySkills: inSlice.filter(r => r.tree === 'money').length,
        totalCI: s ? s.tci : 0, totalMoney: s ? s.tmoney : 0,
        ciPerH: s ? s.cih : 0, moneyPerH: s ? s.mh : 0,
        levelsOwned: s ? s.lv : 0, machines: s ? s.nodes : 0,
      });
    }
    return out;
  };

  


  P.dump = function (bucketMin, src) {
    const L = src || log();
    const rows = P.rows(L), reached = rows.filter(r => r.affSec < Infinity);
    const un = P.unreached(L);
    const g = S.g;
    const own = C.skills.reduce((a, s) => a + lvOf(s.id), 0);
    const max = C.skills.reduce((a, s) => a + Sim.maxLevel(s), 0);
    const out = [];
    out.push('=== EARTH REGEN PACING DUMP ===');
    out.push('playtime ' + hm(g.playtime) + '  |  levels ' + own + '/' + max +
             '  |  machines ' + (g.nodes || []).filter(n => C.nodeTypes[n.type] &&
               C.nodeTypes[n.type].kind !== 'site').length +
             '  |  samples ' + L.samples.length);
    out.push('totalCI ' + Math.round(g.totalCI || 0) + '  totalMoney ' +
             Math.round(g.totalMoney || 0) + '  heldCI ' + Math.round(g.ci || 0) +
             '  heldMoney ' + Math.round(g.money || 0) + '  gems ' + (g.diamond || 0) +
             '  kg ' + Math.round(g.totalCleaned || 0));
    out.push('reached ' + reached.length + ' levels, ' + un.length + ' still out of reach');
    out.push('');
    out.push('-- CURVE (' + (bucketMin || 10) + ' min buckets) --');
    out.push('at | new | ci | $ | totalCI | totalMoney | CI/h | $/h | levels | machines');
    P.curve(L, bucketMin || 10).forEach(c => out.push([c.at, c.newLevels, c.ciSkills,
      c.moneySkills, c.totalCI, c.totalMoney, c.ciPerH, c.moneyPerH,
      c.levelsOwned, c.machines].join(' | ')));
    out.push('');
    out.push('-- REACHED (in order) --');
    reached.forEach(r => out.push(r.affordableAt + '  ' + r.id + ' L' + r.level +
      '  ' + r.cur + r.cost + '  bought ' + r.boughtAt));
    out.push('');
    out.push('-- NOT REACHED (' + un.length + ') --');
    out.push(un.map(u => u.id + ' L' + u.level + ' ' + u.cur + u.cost).join(', '));
    return out.join('\n');
  };

  P.report = function (src) {
    const L = src || log();
    const rows = P.rows(L), un = P.unreached(L);
    
    console.log('%c PACING — ' + rows.length + ' skill levels reached, ' +
                un.length + ' still out of reach', 'font-weight:bold');
    console.table(P.curve(L));
    console.table(rows.map(r => ({ skill: r.skill, tree: r.tree, lv: r.level,
      cost: r.cur + ' ' + r.cost, affordable: r.affordableAt, bought: r.boughtAt })));
    if (un.length) console.table(un.slice(0, 60));
    return { reached: rows.length, unreached: un.length };
  };

  P.csv = function (src) {
    const rows = P.rows(src);
    return 'skill,id,tree,level,currency,cost,affordable_sec,affordable,bought\n' +
      rows.map(r => [r.skill, r.id, r.tree, r.level, r.cur, r.cost,
                     r.affSec === Infinity ? '' : r.affSec,
                     r.affordableAt, r.boughtAt].join(',')).join('\n');
  };

  P.reset = function () {
    S.g.paceLog = { aff: {}, buy: {}, samples: [], every: 0 };
    acc = 0;
    return 'pacing log cleared';
  };

  




  const _tick = Sim.tick;
  Sim.tick = function (dt) { _tick(dt); P.tick(dt); };

  const _buy = Sim.buySkill;
  Sim.buySkill = function (id) {
    const before = S.skillLevel(id);
    const res = _buy(id);
    if (res && res.ok) P.noteBuy(id, before);
    return res;
  };
})(window.GG);
