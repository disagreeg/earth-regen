














(function (GG) {
  'use strict';
  const C = GG.config, S = GG.state, U = GG.util;

  const Sim = { ciPerHour: 0, moneyPerHour: 0, gameHours: 0 };
  GG.sim = Sim;

  Sim.hoursFor = function (realSeconds) { return realSeconds / C.time.secondsPerGameHour; };

  















  Sim.sunAnchor = function () {
    const d = C.nodeTypes.solarPanel.duty;
    
    
    if (!d.startOnFirst) return -(S.g.solarShift || 0);
    return (S.g.sunAt === undefined || S.g.sunAt === null) ? null : S.g.sunAt;
  };
  Sim.solarPhase = function (node) {
    const d = C.nodeTypes.solarPanel.duty;
    

    if (node && node.loc !== undefined && C.weather.heatHoldsNight !== false) {
      const w = Sim.wxState(node.loc);
      if (w && w.heldNight && (w.left || 0) > 0)
        return { on: true, remaining: w.left, frac: 0, heat: true };
    }
    const dd = Sim.solarDuty(), cycle = dd.onSec + dd.offSec;   
    const a = Sim.sunAnchor();
    const t = a === null ? 0 : (S.g.playtime || 0) - a;
    const phase = ((t % cycle) + cycle) % cycle;
    const on = phase < dd.onSec;
    return {
      on: on,
      remaining: on ? dd.onSec - phase : cycle - phase,   
      frac: on ? phase / dd.onSec : (phase - dd.onSec) / dd.offSec,
    };
  };
  


  Sim.solarDuty = function () {
    const d = C.nodeTypes.solarPanel.duty;
    const on = Math.max(30, d.onSec + Sim.bonus('solarPanel.duty.onSec'));
    const off = Math.max(30, d.offSec + Sim.bonus('solarPanel.duty.offSec'));
    return { onSec: on, offSec: off, startOnFirst: d.startOnFirst };
  };
  Sim.solarOn = function (node) { return Sim.solarPhase(node).on; };
  Sim.solarPanels = function () {
    return S.machines().filter(n => n.type === 'solarPanel');
  };
  

  Sim.sunAllUp = function () { return Sim.solarPhase().on; };
  


  Sim.startSolarClock = function () {
    const d = C.nodeTypes.solarPanel.duty;
    if (!d.startOnFirst) return;
    if (S.g.sunAt === undefined || S.g.sunAt === null) S.g.sunAt = S.g.playtime || 0;
  };

  



  let cache = {}, rawCache = {};
  


  Sim.invalidate = function () {
    cache = {}; rawCache = {}; madeCache = null;
    if (Sim.clearLadder) Sim.clearLadder();
  };

  


























  Sim.mulJoin = function (ms) {
    let prod = 1, sum = 1, live = 0, zero = false;
    for (const m of ms) {
      if (m === undefined || m === null || m === 1) continue;
      if (m === 0) zero = true;
      prod *= m; sum += (m - 1); live++;
    }
    if (zero && (!C.stacking || C.stacking.zeroWins !== false)) return 0;
    if (!C.stacking || !C.stacking.additive || live < 2) return prod;
    return Math.max(0, sum);
  };

  
  function statSource(typeId) { return C.nodeTypes[typeId] || C[typeId]; }

  

  

  function hits(e, key) {
    if (e.stat === key) return true;
    return e.stat.charCodeAt(0) === 42  &&
           e.stat.slice(2) === key.slice(key.indexOf('.') + 1);
  }
  Sim.hits = hits;

  


  Sim.boostMul = function (key) {
    const ms = [];
    for (const b of C.boosts) {
      if (!(S.g.boosts && S.g.boosts[b.id] > 0)) continue;
      for (const e of (b.effects || [])) {
        if (hits(e, key) && e.op === 'mul') ms.push(e.value);
      }
    }
    return ms.length ? Sim.mulJoin(ms) : 1;
  };

  Sim.stat = function (typeId, field) {
    const key = typeId + '.' + field;
    if (key in cache) return cache[key];
    let v = statSource(typeId)[field];
    let mul = 1;
    for (const sk of C.skills) {
      const lvl = S.skillLevel(sk.id);
      if (!lvl || !sk.effects) continue;
      for (const e of sk.effects) {
        if (!hits(e, key)) continue;
        if (e.op === 'add') v += e.value * lvl;
        else if (e.op === 'mul') mul *= Math.pow(e.value, lvl);
      }
    }
    rawCache[key] = v * mul;                  
    cache[key] = v * mul * Sim.boostMul(key);
    return cache[key];
  };

  


  Sim.statNoBoost = function (typeId, field) {
    const key = typeId + '.' + field;
    if (!(key in rawCache)) Sim.stat(typeId, field);
    return rawCache[key];
  };

  

  Sim.statWx = function (node, typeId, field, wxKey) {
    const key = typeId + '.' + field;
    return Sim.statNoBoost(typeId, field) *
           Sim.mulJoin([Sim.boostMul(key), Sim.wx(node, wxKey)]);
  };

  






  Sim.energyOut = function (node, typeId, field) {
    const t = typeId || node.type, f = field || 'energyRate';
    return Sim.statNoBoost(t, f) *
           Sim.mulJoin([Sim.boostMul(t + '.' + f), Sim.wxEnergy(node)]) *
           Sim.gridMul(node);
  };

  

  Sim.wxJoinEnergy = function (node, value, key) {
    return value * Sim.mulJoin([key ? Sim.boostMul(key) : 1, Sim.wxEnergy(node)]) *
           Sim.gridMul(node);
  };

  










  Sim.gridDownLeft = function (loc) {
    const G = C.weather.gridTrip;
    if (!G || !G.enabled) return 0;
    return (S.g.gridDown && S.g.gridDown[loc]) || 0;
  };

  




  const genType = {};
  Sim.isGenerator = function (t) {
    if (!t) return false;
    if (genType[t.id] === undefined) {
      const p = t.ports || {};
      genType[t.id] = t.kind === 'machine' &&
        (p.out || []).some(x => x.res === 'energy') &&
        !(p.in || []).some(x => x.res === 'energy');
    }
    return genType[t.id];
  };
  Sim.gridMatters = function (loc) {
    const G = C.weather.gridTrip;
    if (!G || G.onlyWithGenerators === false) return true;
    const home = C.locations[0].id;
    return S.machines().some(n => (n.loc || home) === loc && Sim.isGenerator(C.nodeTypes[n.type]));
  };

  Sim.gridMul = function (node) {
    const G = C.weather.gridTrip;
    if (!G || !G.enabled) return 1;
    const left = Sim.gridDownLeft(node.loc || C.locations[0].id);
    if (left <= 0) return 1;
    const k = 1 - (left / G.recoverSec);          
    const floor = G.floor || 0;
    return floor + (1 - floor) * Math.max(0, Math.min(1, k));
  };

  


  Sim.restartGrid = function (loc) {
    const G = C.weather.gridTrip;
    if (!G || !G.enabled) return { ok: false, why: 'Nothing to restart' };
    loc = loc || S.g.loc;
    if (!Sim.gridDownLeft(loc)) return { ok: false, why: 'The grid is already up' };
    if (S.g.loc !== loc) return { ok: false, why: 'Go there to restart the grid' };
    S.g.gridDown[loc] = 0;
    Sim.events.push({ kind: 'gridUp', loc: loc });
    return { ok: true };
  };

  



  Sim.tripGrid = function (loc) {
    const G = C.weather.gridTrip;
    if (!G || !G.enabled) return;
    if (!S.g.gridDown) S.g.gridDown = {};
    if (!G.restack && S.g.gridDown[loc] > 0) return;
    S.g.gridDown[loc] = G.recoverSec;
    Sim.events.push({ kind: 'gridDown', loc: loc });
  };

  
  function total(bag) { let s = 0; for (const k in bag) s += bag[k] || 0; return s; }

  

  

  Sim.factorNoBoost = function (key) {
    let mul = 1;
    for (const sk of C.skills) {
      const lvl = S.skillLevel(sk.id);
      if (!lvl || !sk.effects) continue;
      for (const e of sk.effects) {
        if (hits(e, key) && e.op === 'mul') mul *= Math.pow(e.value, lvl);
      }
    }
    return mul;
  };
  Sim.factor = function (key) { return Sim.factorNoBoost(key) * Sim.boostMul(key); };

  












  Sim.bonus = function (key) {
    let add = 0;
    for (const sk of C.skills) {
      const lvl = S.skillLevel(sk.id);
      if (!lvl || !sk.effects) continue;
      for (const e of sk.effects) {
        if (hits(e, key) && e.op === 'add') add += e.value * lvl;
      }
    }
    for (const b of C.boosts) {
      if (!(S.g.boosts && S.g.boosts[b.id] > 0)) continue;
      for (const e of (b.effects || [])) {
        if (hits(e, key) && e.op === 'add') add += e.value;
      }
    }
    return add;
  };

  

  


  Sim.skillKey = function (t) { return t.valueGroup || t.id; };

  
















  Sim.sideDef = function (t, side) { return side === 'B' ? t.collectB : t.collect; };
  Sim.sideBuf = function (n, side) {
    if (side !== 'B') return n.buf;
    return (n.bufB = n.bufB || {});
  };
  Sim.sideKey = function (t, side) {
    return (side === 'B' ? t.valueGroupB : t.valueGroup) || t.id;
  };
  


  Sim.sides = function (t) { return t.collectB ? [undefined, 'B'] : [undefined]; };

  Sim.collectCap = function (t, n, side) {
    const def = Sim.sideDef(t, side);
    const key = Sim.sideKey(t, side) + '.collect.cap';
    const base = (def.cap + Sim.bonus(key)) * Sim.factor(key);
    





    if (n && def.scaleWith === 'plantMul') return base * Sim.plantMul(n);
    







    if (n && def.scaleWith === 'gemYield') return base * Sim.gemYield(n);
    return base;
  };

  







  Sim.valueOf = function (t, res, side) {
    const table = t.valuePerKg || C.gradeValue;
    const key = Sim.sideKey(t, side) + '.value.' + res;
    return Math.max(0, (table[res] || 0) + Sim.bonus(key)) * Sim.factor(key);
  };
  



  Sim.valueOfWx = function (t, res, node, wxKey, side) {
    const table = t.valuePerKg || C.gradeValue;
    const key = Sim.sideKey(t, side) + '.value.' + res;
    return Math.max(0, (table[res] || 0) + Sim.bonus(key)) * Sim.factorNoBoost(key) *
           Sim.mulJoin([Sim.boostMul(key), Sim.wx(node, wxKey)]);
  };
  
  Sim.gradesByValue = function () {
    return Object.keys(C.gradeValue).sort((a, b) => C.gradeValue[b] - C.gradeValue[a]);
  };
  



  Sim.portSide = function (t, port) {
    return (t && t.collectB && port && port.mode === 'burn') ? 'B' : undefined;
  };
  










  Sim.gradesTakenBy = function (n, side) {
    const t = S.type(n);
    const ok = {};
    S.portsOf(n, 'in').forEach(function (p) {
      if (C.resources[p.res].flow !== 'material') return;
      if (t && t.collectB && Sim.portSide(t, p) !== side) return;
      (p.accepts || [p.res]).forEach(r => { ok[r] = 1; });
    });
    return Sim.gradesByValue().filter(r => ok[r]);
  };

  








  let madeCache = null;
  









  Sim.rockReachable = function () {
    if (!(C.asteroid || {}).enabled) return false;
    if (Sim.demoNode && Sim.demoNode('oreDigger')) return false;   
    return Sim.rockLocs().some(e => S.g.locSpawned && S.g.locSpawned[e.loc]);
  };
  Sim.gradesMade = function () {
    if (madeCache) return madeCache;
    const out = {};
    Object.keys(C.nodeTypes).forEach(function (k) {
      

      if (!S.isUnlocked(k) &&
          !(C.nodeTypes[k].siteType === 'meteorite' && Sim.rockReachable())) return;
      const t = C.nodeTypes[k];
      ((t.ports && t.ports.out) || []).forEach(function (p) {
        if (C.resources[p.res] && C.resources[p.res].flow === 'material') out[p.res] = 1;
      });
      if (t.recipe && t.recipe.out) out[t.recipe.out.res] = 1;
      if (t.convert && t.convert.out) out[t.convert.out.res] = 1;
    });
    madeCache = out;
    return out;
  };

  



  Sim.gradesPriced = function (n, side) {
    const all = Sim.gradesTakenBy(n, side);
    const P = C.ui.priceRows;
    if (!P || !P.onlyReachable) return all;
    const made = Sim.gradesMade();
    

    const buf = (side === 'B' ? n.bufB : n.buf) || {};
    return all.filter(r => made[r] || buf[r] > 1e-9);
  };

  











  




  Sim.splitField = function (typeId) {
    const t = C.nodeTypes[typeId || 'weightSorter'];
    return (t && t.splitField) || 'energyPerKg';
  };
  Sim.lightShare = function (supply, kg, typeId) {
    if (kg <= 0) return 0;
    const id = typeId || 'weightSorter';
    const needed = Sim.stat(id, Sim.splitField(id)) * kg;
    if (supply <= 0) return 0;                 
    if (supply >= needed) return 0.5;          
    return supply / (supply + needed);
  };
  

















  Sim.rubbleSplit = function (wf, kw, kg, typeId) {
    const id = typeId || 'rubbleSorter';
    if (kg <= 0) return { worked: 0, glass: 0 };
    const a = Math.max(0, wf) / (Sim.stat(id, 'wfPerKg') * kg);
    const b = Math.max(0, kw) / (Sim.stat(id, 'energyPerKg') * kg);
    const sum = a + b;
    if (sum <= 0) return { worked: 0, glass: 0 };
    return { worked: Math.min(1, sum / 2) * kg, glass: a / sum };
  };

  
  Sim.heavyRatio = function (supply, kg, typeId) {
    const l = Sim.lightShare(supply, kg, typeId);
    return l > 0 ? (1 - l) / l : Infinity;
  };
  







  




  Sim.autoSources = function (t) {
    if (!t.autoCollect) return [];
    return Array.isArray(t.autoCollect) ? t.autoCollect : [t.autoCollect];
  };
  









  Sim.autoRate = function (t, port) {
    const src = Sim.autoSources(t).find(s => s.port === port);
    if (!src) return 0;
    const key = t.id + '.auto.' + port;
    const saved = Sim.bonus(key + '.cost');
    if (!saved) return src.perUnit * Sim.factor(key);
    
    const cost = Math.max(0.01, 1 / src.perUnit - saved);
    return (1 / cost) * Sim.factor(key);
  };

  




  








  Sim.outStopped = function (n, t) {
    if (t.throttlesTogether && C.diagnose && C.diagnose.stopWhenThrottled) {
      for (const p of S.portsOf(n, 'out')) {
        if (C.resources[p.res].flow !== 'material') continue;
        if ((n.obuf[p.id] || 0) >= (t.outBuffer || 0) - U.EPS) return true;
      }
    }
    return Sim.outJammed(n, t);
  };

  Sim.outJammed = function (n, t) {
    if (!t.outBuffer) return false;
    let any = false;
    for (const p of S.portsOf(n, 'out')) {
      if (C.resources[p.res].flow !== 'material') continue;
      any = true;
      if ((n.obuf[p.id] || 0) < t.outBuffer - U.EPS) return false;
    }
    return any;
  };

  Sim.energyDemand = function (n, hours, seen) {
    seen = seen || {};
    if (seen[n.id]) return 0;                 
    seen[n.id] = 1;
    const t = S.type(n);
    
    
    
    

















    if (t.store) {
      const room = Math.max(0, Sim.stat(t.id, 'store') - (n.store || 0)) / hours;
      if (C.powerPush && C.powerPush.enabled) {
        





        const cap = Sim.outLimit(n);
        if (isFinite(cap)) return cap + room;
        



        const keeps = !C.powerPush.honestAsk || Sim.autoBank(n) || !Sim.hasEnergyWire(n);
        return Sim.demandOn(n, hours, seen) + (keeps ? room : 0);
      }
      const want = Sim.demandOn(n, hours, seen);
      const pass = Math.min(want, Sim.outLimit(n));
      return Math.min(want, pass + room);
    }
    if (t.passesEnergy) {
      
      if (t.priority) {
        const p = Sim.prioSide(n), o = p === 'a' ? 'b' : 'a';
        const dP = Sim.branchDemand(n, p, hours, seen);
        return dP > 1e-9 ? dP : Sim.branchDemand(n, o, hours, seen);
      }
      

      if (t.splitter && C.splitter && C.splitter.honourRatio)
        return Sim.splitPlan(n, hours, seen).ask;
      return Sim.demandOn(n, hours, seen);
    }
    const d = t.energyDemand;
    if (!d) return 0;
    
    
    
    
    

    if (Sim.outStopped(n, t)) return 0;
    let amount;
    if (d.pool) {
      
      
      
      
      



      const gap = Sim.recruitNeed(n, 'kw') - (n.kwPool || 0);
      if (gap <= U.EPS) return 0;
      const want = gap / hours;
      return Math.max(0, Math.min(want, Sim.stat(t.id, 'intakeRate')));
    }
    





    if (d.kwPool) {
      


      if (t.print) {
        const pl = Sim.printPlan(n);
        if (!pl || !Sim.printReady(n)) return 0;
        const w = (pl.kw - (n.kwPool || 0)) / hours;
        return Math.max(0, Math.min(w, Sim.stat(t.id, 'intakeRate')));
      }
      if (!Sim.recipeReady(n)) return 0;
      const want = (Sim.recipeKw(n) - (n.kwPool || 0)) / hours;
      return Math.max(0, Math.min(want, Sim.stat(t.id, 'intakeRate')));
    }
    if (d.bank) {
      
      
      const room = Sim.stat(t.id, 'bank') - (n.bank || 0);
      return Math.max(0, room) / hours;
    }
    









    if (d.capKw) return Math.max(0, Sim.stat(t.id, 'maxKw'));
    





    if (d.cell) {
      if (Sim.robotFree(n)) return 0;                     
      const room = Math.max(0, Sim.stat(t.id, 'bank') - (n.bank || 0)) / hours;
      


      




      const spend = C.powerPush && C.powerPush.honestAsk ? 0 : Sim.robotOut(n) * Sim.robotDraw(n);
      const want = spend + room - Sim.panelKw(n);
      return Math.max(0, want);
    }
    









    if (d.grow) {
      if (t.stopWhenFull && Sim.siteFull(n)) return 0;
      const perKw = Sim.stat(t.id, 'ciPerKW') / Sim.stat(t.id, 'ciPerKg');   
      if (!(perKw > 0)) return 0;
      const fuel = ((t.ports && t.ports.in) || [])
        .find(p => (C.resources[p.res] || {}).flow === 'material');
      let kg = fuel ? (n.buf[fuel.res] || 0) : 0;
      const bp = C.byProduct(t, Sim.stat(t.id, 'ciPerKg'));
      if (bp && bp.kg > 0) {
        const pid = outPortFor(t, bp.res);
        const room = (t.outBuffer || 0) - (n.obuf[pid] || 0);
        kg = Math.min(kg, Math.max(0, room) / bp.kg);
      }
      return Math.max(0, kg / perKw) / hours;
    }
    if (d.dig) {
      
      const site = S.siteOf(n);
      



      if (t.digMix) {
        if (!site || (site.reserve || 0) <= U.EPS) return 0;
        const kwp = Sim.stat(t.id, 'digKw'), wfp = Sim.stat(t.id, 'digWf');
        if (!(kwp > 0)) return 0;
        const mixD = Sim.mixOf(site), capD = Sim.stat(t.id, 'outBuffer');
        let roomD = Infinity;
        Object.keys(mixD).forEach(function (r) {
          if (!(mixD[r] > 0)) return;
          roomD = Math.min(roomD, Math.max(0, capD - (n.obuf[r] || 0)) / mixD[r]);
        });
        let kgD = Math.min(roomD, site.reserve, Sim.stat(t.id, 'digRate') * hours);
        if (wfp > 0) kgD = Math.min(kgD, (n.rateIn.wf || 0) / wfp * hours);
        const wetD = Sim.wx(n, 'dig');
        if (!(wetD > 0) || !(kgD > 0)) return 0;
        return kgD * kwp / hours;
      }
      const room = Sim.stat(t.id, 'buffer') - (n.obuf.out || 0);
      amount = Math.min(Sim.stat(t.id, 'digRate') * hours, room, site ? site.reserve : 0);
      
      
      
      
      const wet = Sim.wx(n, 'dig');
      if (wet <= 0) return 0;                 
      







      if (C.weather.wetDrawsMore) amount /= wet;
    } else if (d.pump) {
      

      const site = S.siteOf(n);
      const room = (t.outBuffer || 0) - (n.obuf.dirty || 0);
      const can = Math.min(Sim.poolDirty(site), Math.max(0, room));
      const kwh = Math.max(0, can) / Math.max(1e-9, Sim.stat(t.id, 'pumpPerKw'));
      






      return (C.ui || {}).pumpAskPerHour === false ? kwh : kwh / Math.max(1e-9, hours);
    } else if (d.conv) {
      



      const need = Sim.convKw(n);
      if (!(need > 0)) return 0;
      return Sim.convStock(n, hours) * need / hours;
    } else if (Array.isArray(d.res)) {
      
      
      let least = Infinity;
      d.res.forEach(r => { least = Math.min(least, n.buf[r] || 0); });
      amount = Math.min(least, Sim.stat(t.id, 'processRate') * hours);
    } else {
      amount = Math.min(n.buf[d.res] || 0, Sim.stat(t.id, 'processRate') * hours);
    }
    return Math.max(0, amount) * Sim.stat(t.id, 'energyPerKg') / hours;
  };

  























  Sim.powerSoak = function (n) {
    const t = S.type(n), d = t && t.energyDemand;
    if (!d) return null;
    if (d.capKw) { const v = Sim.energyDemand(n, 1); return v >= 0 ? v : null; }
    if (d.cell)  { if (Sim.robotFree(n)) return 0;
                   const v = Sim.robotOut(n) * Sim.robotDraw(n); return v >= 0 ? v : null; }
    return null;
  };

  

  Sim.demandOn = function (n, hours, seen) {
    seen = seen || {};
    seen[n.id] = 1;
    let sum = 0;
    for (const p of S.portsOf(n, 'out')) {
      if (p.res !== 'energy') continue;
      for (const l of S.linksFrom(n.id)) {
        if (l.fromPort !== p.id) continue;
        const dst = S.node(l.to);
        if (dst) sum += Sim.energyDemand(dst, hours, seen);
      }
    }
    return sum;
  };
  


























  function anyRate(n, prefix) {
    for (const k in n.rates) if (k.indexOf(prefix) === 0 && n.rates[k] > 1e-6) return true;
    return false;
  }
  


  function poolFull(n, t, portId) {
    if (t.recruit) {
      const kw = portId === 'kw';
      const pool = kw ? (n.kwPool || 0) : (n.wfPool || 0);
      return pool >= Sim.recruitNeed(n, kw ? 'kw' : 'wf') - U.EPS;
    }
    if (t.recipe && portId === 'kw' && t.recipe.kw)
      return (n.kwPool || 0) >= Sim.recipeKw(n) - U.EPS;
    if (t.recipe && portId === 'wf' && t.recipe.wf)
      return (n.wfPool || 0) >= Sim.recipeWf(n) - U.EPS;
    return false;
  }

  




  function shortOfMaterial(n, t) {
    for (const p of S.portsOf(n, 'in')) {
      if ((C.resources[p.res] || {}).flow !== 'material') continue;
      if (t.recipe && t.recipe.boost) continue;
      if (t.powerUp && t.powerUp.port === p.id) continue;
      if (p.optional) continue;
      if ((n.buf[p.res] || 0) <= 1e-6) return true;
    }
    return false;
  }

  





















  Sim.gathering = function (n) {
    if (!C.diagnose || C.diagnose.batchGathers === false) return false;
    const t = S.type(n);
    if (!t) return false;
    const batch = !!(t.recipe && t.recipe.inputs && !t.recipe.boost);
    if (!batch && !t.recruit) return false;
    
    if ((n.wfPool || 0) > 1e-6 || (n.kwPool || 0) > 1e-6) return true;
    for (const p of S.portsOf(n, 'in')) {
      const flow = (C.resources[p.res] || {}).flow;
      if (flow === 'rate') {
        if ((n.rateIn[p.id] || 0) > 1e-6) return true;
      } else if (flow === 'material') {
        if ((n.buf[p.res] || 0) > 1e-6) return true;
        if ((n.rates['in:' + p.id] || 0) > 1e-6) return true;
      }
    }
    return false;
  };

  Sim.diagnose = function (n) {
    const D = C.diagnose;
    if (!D || !D.enabled) return null;
    const t = S.type(n);
    if (!t || t.kind === 'site') return null;
    
    if (t.lanes) {
      const full = t.lanes.every(L => Sim.laneHeld(n, L) >= Sim.laneCap(n) - 1e-6);
      return full ? { level: 'slow', word: 'FULL', why: 'Every shelf is full' } : null;
    }
    


















    

    if (n.pracOff) return { level: 'slow', word: 'OFF', why: 'Switched off for now' };
    if (!S.linksFrom(n.id).length && !S.linksInto(n.id).length) {
      const grace = D.unwiredSec === undefined ? Infinity : D.unwiredSec;
      const age = n.bornAt === undefined ? Infinity : (S.g.playtime || 0) - n.bornAt;
      if (!(age >= grace)) return null;
    }

    const ins = S.portsOf(n, 'in'), outs = S.portsOf(n, 'out');
    




    





    const vOut = (t.virtualOut || []).some((_, i) => (n.rates['v:' + i] || 0) > 1e-6);
    const producing = anyRate(n, 'out:') || vOut || (n.rates.work || 0) > 1e-6;

    








    if (t.collect && t.collect.cur === 'ci' && t.collect.burns !== false &&
        Sim.wx(n, 'burnRate') <= 0)
      return { level: 'stop', word: 'STORM', why: 'A storm has put the fire out' };
    if (t.store && Sim.wx(n, 'battery') <= 0)
      return { level: 'stop', word: 'STRUCK', why: 'Lightning has frozen the grid' };

    




    if (t.stopWhenFull && Sim.siteFull(n))
      return { level: 'slow', word: 'DONE', why: 'This ground is fully restored' };
    
    if (t.rocket) {
      const st = Sim.rocketState(n), R = t.rocket;
      if (st.state === 'flying') return null;
      if (st.state === 'building') {
        const miss = Object.keys(R.build).find(k => (n.buf[k] || 0) + U.EPS < R.build[k]);
        const arriving = Object.keys(R.build).some(k => (n.rates['in:' + k] || 0) > 1e-6);
        return arriving ? { level: 'slow', word: 'BUILDING', why: 'Gathering the parts to build it' }
          : { level: 'stop', word: 'NO PARTS', why: 'Waiting on ' + C.resources[miss].name };
      }
      if (st.state === 'hold')
        return { level: 'slow', word: 'HOLD FULL', why: 'Empty the metal out before the next flight' };
      if (st.state === 'fuel')
        return { level: 'stop', word: 'NO FUEL', why: 'Waiting on ' + C.resources[Sim.rocketFuel(n).res].name };
      if (st.state === 'crew')
        return (n.rateIn.wf || 0) > 1e-6
          ? { level: 'slow', word: 'CREWING', why: 'The crew is getting it ready' }
          : { level: 'stop', word: 'NO CREW', why: 'Waiting on workforce' };
      return { level: 'slow', word: 'READY', why: 'Ready to fly, press LAUNCH' };
    }
    
    if (t.pullCost && Sim.beaconLocal()) {
      const c = Sim.beaconCheck(n);
      if (c.ok) return null;
      return { level: c.level, word: c.word, why: c.why };
    }
    

    if (t.fission) {
      if (Sim.reactorOn(n)) {
        if (Sim.reactorWx(n) <= 0)
          return { level: 'stop', word: 'STRUCK', why: 'Lightning: the run is paused' };
        return null;
      }
      const RFu = Sim.reactorFuel(n);
      if ((n.buf[RFu.res || 'rod'] || 0) + U.EPS >= RFu.kg)
        return { level: 'slow', word: 'READY', why: 'A load of rods is in, press START' };
    }
    if (t.energyRate && !C.driveIns(t).length && Sim.wxEnergy(n) <= 0)
      return { level: 'stop', word: 'STRUCK', why: 'Lightning has taken the grid down' };
    

    if (t.wastePerWf) {
      const wf = n.rateIn.wf || 0, rs = Sim.robotShare(n);
      if (wf * (1 - rs) > 1e-6 && (n.buf.gear || 0) <= 1e-6) {
        const gn = (GG.i18n.resGen && GG.i18n.resGen('gear')) || C.resources.gear.name;
        return rs > 1e-6
          ? { level: 'slow', word: 'NO GEAR', why: 'Only its robots are digging' }
          : { level: 'stop', word: 'NO ' + gn.toUpperCase(), why: 'Waiting on ' + C.resources.gear.name };
      }
    }

    




    if (t.ciPerKw && Sim.oilCiRate(t) > 0 && n.ciShare !== undefined && n.ciShare < 1 - 1e-6) {
      return n.ciShare <= 1e-6
        ? { level: 'stop', word: 'NO INDEX', why: 'No Clean Index left to spend on power' }
        : { level: 'slow', word: 'SHORT', why: 'Clean Index is short, so it burns less oil' };
    }

    
    if (t.collect) {
      




      const sides = Sim.sides(t);
      const full = sides.filter(sd =>
        (n[sd === 'B' ? 'tillB' : 'till'] || 0) >= Sim.collectCap(t, n, sd) - U.EPS);
      if (full.length && full.length === sides.length)
        return { level: 'stop', word: 'FULL',
                 why: sides.length > 1 ? 'Both tills are full'
                    : 'Till is full, press ' + (t.collect.label || 'COLLECT') };
      if (full.length)
        return { level: 'slow', word: 'FULL',
                 why: 'Till is full, press ' + (Sim.sideDef(t, full[0]).label || 'COLLECT') };
    }

    



    if (t.gemArm && (n.bank || 0) >= t.gemArm.perGem - U.EPS) return null;

    





    if (t.holdLock && Sim.outJammed(n, t)) {
      const held = Sim.heldOf(n);
      if (held >= Sim.capOf(n) - 1e-6)
        return { level: 'slow', word: 'FULL', why: 'Full, and ready to be carried' };
    }

    
    if (Sim.outJammed(n, t)) {
      const matOut = outs.filter(p => (C.resources[p.res] || {}).flow === 'material');
      const wired = matOut.some(p => S.linksFrom(n.id).some(l => l.fromPort === p.id));
      return wired
        ? { level: 'stop', word: 'BLOCKED',
            why: 'Output is full and nothing is taking it' }
        : { level: 'stop', word: 'NO WIRE',
            why: 'Output is full and nothing is wired to it' };
    }

    






    if (t.outBuffer) {
      const mo = outs.filter(p => (C.resources[p.res] || {}).flow === 'material');
      const full = mo.find(p => (n.obuf[p.id] || 0) >= t.outBuffer - U.EPS);
      if (full) {
        const wired = S.linksFrom(n.id).some(l => l.fromPort === full.id);
        
















        if (t.throttlesTogether)
          return wired
            ? { level: 'stop', word: 'BLOCKED',
                why: 'One output is full, so the whole machine has stopped' }
            : { level: 'stop', word: 'NO WIRE',
                why: 'One output has no wire, so the whole machine has stopped' };
        if (producing)
          return { level: 'slow', word: 'BACKED UP',
                   why: 'One output is full, the rest still moves' };
        return wired
          ? { level: 'stop', word: 'BLOCKED',
              why: 'Output is full and nothing is taking it' }
          : { level: 'stop', word: 'NO WIRE',
              why: 'Output is full and nothing is wired to it' };
      }
    }

    






    if (t.store && Sim.autoBanking(n) && (n.store || 0) < Sim.capOf(n) - 1e-6)
      return { level: 'slow', word: 'BANKING',
               why: 'The storage ahead is full, so it is keeping what arrives' };

    

    if (t.autoHire) {
      if (!n.dock) return { level: 'stop', word: 'NO BANK', why: 'It only hires while it sits on a Bank' };
      const tg = Sim.agencyTargets(n);
      if (!tg.posts.length && !tg.exchanges.length)
        return { level: 'slow', word: 'NOTHING TO HIRE', why: 'No Hiring Post or Labour Exchange in this place' };
    }

    

















    const soak = Sim.powerSoak(n);
    if (soak !== null) {
      const slack = D.overSupplySlack === undefined ? 0.02 : D.overSupplySlack;
      if ((n.rateIn.kw || 0) > soak * (1 + slack) + U.EPS)
        return { level: 'slow', word: 'WASTING',
                 why: 'More power than it can use, and the rest is thrown away' };
    }
    





    if (t.store && (n.store || 0) >= Sim.capOf(n) - 1e-6 &&
        Sim.storeIn(n) - (n.outRate || 0) > 1e-6)
      return { level: 'slow', word: 'FULL',
               why: 'Full, and the power arriving above what leaves is being lost' };
    
    if (t.store && !producing && Sim.demandOn(n, 1 / 60) <= 1e-9)
      return { level: 'stop', word: 'NO DEMAND', why: 'Nothing downstream needs power' };
    
    
    if (t.store && Sim.outLimit(n) <= 0)
      return { level: 'stop', word: 'HELD', why: 'The output limit is 0, so nothing leaves' };

    if (!producing) {
      




      const gath = Sim.gathering(n);
      const halt = (word, why) => gath
        ? { level: 'slow', word: 'GATHERING', why: why }
        : { level: 'stop', word: word, why: why };
      
      for (const p of ins) {
        const flow = (C.resources[p.res] || {}).flow;
        if (flow !== 'rate') continue;
        if ((n.rateIn[p.id] || 0) > 1e-6) continue;
        






        const l = S.linkInto(n.id, p.id);
        if (l && l.muted) continue;
        if (poolFull(n, t, p.id)) continue;
        







        if (p.res === 'energy' && C.diagnose.materialFirst &&
            Sim.energyDemand(n, 1 / 60) <= 1e-9 && shortOfMaterial(n, t)) continue;
        return p.res === 'energy'
          ? halt('NO POWER', 'No power coming in')
          : halt('NO CREW', 'No workforce coming in');
      }
      
      for (const p of ins) {
        if ((C.resources[p.res] || {}).flow !== 'material') continue;
        if (t.recipe && t.recipe.boost) continue;          
        




        if (t.powerUp && t.powerUp.port === p.id) continue;
        




        if (p.optional) continue;
        if ((n.buf[p.res] || 0) > 1e-6) continue;
        



        const rn = (GG.i18n.resGen && GG.i18n.resGen(p.res)) || C.resources[p.res].name || '';
        return halt('NO ' + rn.toUpperCase(), 'Waiting on ' + C.resources[p.res].name);
      }
    }

    



    



    if (t.lightSplit) {
      const field = Sim.splitField(t.id);
      const supply = field === 'wfPerKg' ? (n.rateIn.wf || 0) : (n.rateIn.kw || 0);
      const held = ins.reduce((a, p) =>
        (C.resources[p.res] || {}).flow === 'material' ? a + (n.buf[p.res] || 0) : a, 0);
      if (held > 1e-6 && supply > 1e-6) {
        const share = Sim.lightShare(supply, held, t.id);
        if (share < D.slowShare)
          return field === 'wfPerKg'
            ? { level: 'slow', word: 'LOW CREW',
                why: 'Short of workforce, so mostly the cheap half' }
            : { level: 'slow', word: 'LOW POWER',
                why: 'Short of power, so mostly the cheap half' };
      }
    }
    return null;
  };

  



  Sim.muted = function (n) {
    return !!(n && n.quiet) && (C.diagnose || {}).mute !== false;
  };

  








  Sim.stuckNodes = function () {
    const D = C.diagnose;
    if (!D || !D.enabled || !D.counter) return [];
    const out = [];
    for (const n of S.machines()) {
      if (Sim.muted(n)) continue;
      const d = Sim.diagnose(n);
      if (d && (d.level === 'stop' || (D.counterSlow && d.level === 'slow')))
        out.push({ node: n, why: d.why, word: d.word });
    }
    return out;
  };

  





  Sim.branchDemand = function (n, portId, hours, seen0) {
    let sum = 0;
    const seen = {}; if (seen0) for (const k in seen0) seen[k] = seen0[k];
    seen[n.id] = 1;
    for (const l of S.linksFrom(n.id)) {
      if (l.fromPort !== portId) continue;
      const dst = S.node(l.to);
      if (dst) sum += Sim.energyDemand(dst, hours, seen);
    }
    return sum;
  };

  







  Sim.chainOrder = function (list, isFwd) {
    const depth = {};
    function walk(n, seen) {
      if (depth[n.id] !== undefined) return depth[n.id];
      if (seen[n.id]) return 0;
      seen[n.id] = 1;
      let d = 0;
      


      if ((C.ui || {}).hubSelfFeed && C.nodeTypes[n.type].recruit) { depth[n.id] = 0; return 0; }
      for (const l of S.linksInto(n.id)) {
        const src = S.node(l.from);
        if (!src) continue;
        if (isFwd(C.nodeTypes[src.type])) d = Math.max(d, walk(src, seen) + 1);
      }
      depth[n.id] = d;
      return d;
    }
    list.forEach(n => walk(n, {}));
    return list.slice().sort((a, b) => depth[a.id] - depth[b.id]);
  };

  

  Sim.isEnergyFwd = function (t) { return !!(t.store || t.passesEnergy); };
  Sim.isWfFwd = function (t) {
    return !!((t.merge && t.mergeFlow === 'rate') || t.passesWf || t.recruit);
  };
  


  Sim.robotShare = function (n, port) {
    if (!(C.robotShare && C.robotShare.enabled)) return 0;
    port = port || 'wf';
    const r = (n.rateIn && n.rateIn[port]) || 0;
    if (!(r > 1e-9)) return 0;
    return Math.max(0, Math.min(1, ((n.rbIn && n.rbIn[port]) || 0) / r));
  };
  Sim.energyOrder = function (list) { return Sim.chainOrder(list, Sim.isEnergyFwd); };

  





  






  Sim.robotFree = function (n) {
    const t = n && S.type(n), od = t && t.overdrive;
    return !!(od && od.enabled !== false && od.sunDrive && t.powerUp && Sim.powerMaxed(n));
  };
  

  Sim.nameOf = function (n) {
    const t = n && S.type(n);
    if (!t) return '';
    if (t.overdrive && t.overdrive.sunName && Sim.robotFree(n)) return t.overdrive.sunName;
    if (t.doneName && Sim.roadDone(n)) return t.doneName;     
    return t.name;
  };
  

  Sim.roadDone = function (n) {
    

    return (C.ui || {}).roadDoneHides !== false && !!n && typeof n === 'object' &&
           !!C.nodeTypes[n.type] && Sim.roadMaxed(n);
  };
  

  

  Sim.bankFill = function () {
    let best = 0;
    S.machines().forEach(function (n) {
      const t = C.nodeTypes[n.type];
      if (!t || !t.interestPct) return;
      const cap = Sim.stat(t.id, 'buffer');
      if (cap > 0) best = Math.max(best, (n.buf[t.interestRes || 'gold'] || 0) / cap);
    });
    return best;
  };
  


  Sim.agencyTargets = function (ag) {
    const home = ag.loc || C.locations[0].id, posts = [], exchanges = [];
    S.machines().forEach(function (m) {
      const t = C.nodeTypes[m.type];
      if (!t || !t.hire || t.autoHire || (m.loc || C.locations[0].id) !== home) return;
      (t.hire.mult ? exchanges : posts).push(m);
    });
    return { posts: posts, exchanges: exchanges };
  };
  



  Sim.agencyOffer = function (ag, p, anyway) {
    const h = C.nodeTypes[p.type].hire;
    if (!h.mult) {
      if (!anyway && Sim.hireRoom(p) <= 0) return null;
      const sec = Sim.hireSec(p);
      return { count: 1, sec: sec, price: Sim.hirePrice(p, 1, sec) };
    }
    if (!anyway && Sim.crewOf(p) > 0) return null;
    const count = U.clamp(ag.agHands || 1, 1, Sim.hireMax(p));
    const sec = U.clamp(ag.agSec || 600, h.stepSec || 600, Sim.hireMaxSec(p));
    return { count: count, sec: sec, price: Sim.hirePrice(p, count, sec) };
  };
  
  Sim.bankGold = function () {
    let kg = 0;
    S.machines().forEach(function (n) {
      const t = C.nodeTypes[n.type];
      if (t && t.interestPct) kg += n.buf[t.interestRes || 'gold'] || 0;
    });
    return kg;
  };
  

  Sim.storeStock = function () {
    const by = {};
    S.machines().forEach(function (n) {
      if (n.type !== 'trashJunction') return;
      const kg = total(n.buf) + total(n.obuf);
      if (kg <= 1e-9) return;
      const res = n.grade || Object.keys(n.buf).find(r => (n.buf[r] || 0) > 1e-9) || 'trash';
      by[res] = (by[res] || 0) + kg;
    });
    return by;
  };
  
  Sim.warehouseFrac = function (o) {
    const by = Sim.storeStock();
    let sum = 0, kinds = 0;
    Object.keys(by).forEach(function (r) { sum += by[r]; if (by[r] >= (o.minKg || 0) - 1e-6) kinds++; });
    return Math.min(1, sum / o.goal, kinds / (o.kinds || 1));
  };
  Sim.fiveSunsBest = function () {
    let best = 0;
    S.machines().forEach(function (j) {
      if (j.type !== 'crewJunction') return;
      const seen = {};
      S.g.links.forEach(function (l) {
        if (l.to !== j.id) return;
        const r = S.node(l.from);
        if (r && Sim.robotFree(r)) seen[r.id] = 1;
      });
      best = Math.max(best, Object.keys(seen).length);
    });
    return best;
  };
  Sim.robotOn = function (n) {
    const t = S.type(n), od = t && t.overdrive;
    return !!(od && od.enabled !== false && (n.overdrive || Sim.robotFree(n)));
  };
  Sim.robotOut = function (n) {   
    const t = S.type(n);
    return Sim.stat(t.id, 'wfRate') * (Sim.robotOn(n) ? (t.overdrive.out || 1) : 1);
  };
  








  










  Sim.overdriveDrain = function (t) {
    const od = t.overdrive || {};
    const base = od.drain || 1, out = od.out || 1;
    return Math.max(out, base + Sim.bonus(t.id + '.overdrive.drain'));
  };
  Sim.robotDraw = function (n) {  
    const t = S.type(n);
    const per = Sim.stat(t.id, 'kwPerWf');
    if (!Sim.robotOn(n)) return per;
    return per * (Sim.overdriveDrain(t) / (t.overdrive.out || 1));
  };
  

  Sim.robotWf = function (n, hours) {
    const per = Sim.robotDraw(n);
    if (!(per > 0)) return 0;
    if (Sim.robotFree(n)) return Sim.robotOut(n);        
    return Math.min(Sim.robotOut(n), (n.bank || 0) / per / hours);
  };

  







  





















  let ladderMemo = null;
  Sim.clearLadder = function () { ladderMemo = null; };
  Sim.ladderCount = function (n, field) {
    const t = S.type(n);
    if (!t.ladderShared || !(C.permanentLadder || {}).enabled) return n[field] || 0;
    





    if (!n.id || !S.node(n.id)) return n[field] || 0;
    if (!ladderMemo) ladderMemo = {};
    if (ladderMemo[t.id] === undefined)
      ladderMemo[t.id] = S.machines().reduce(
        (a, m) => a + (m.type === t.id ? (m[field] || 0) : 0), 0);
    return ladderMemo[t.id];
  };

  Sim.recruitNeed = function (n, which) {
    const t = S.type(n);
    const base = Sim.stat(t.id, 'need') *
                 Math.pow(Sim.hubGrowth(t), Sim.ladderCount(n, 'recruits'));
    return base * Sim.factor(t.id + '.need.' + which);
  };
  

  Sim.hubGrowth = function (t) {
    if (t.needGrowthPaid !== undefined && Sim.demoOn && !Sim.demoOn()) return t.needGrowthPaid;
    
    if (!S.g) return t.needGrowth;
    return Sim.stat(t.id, 'needGrowth');
  };
  

  Sim.recruitOutput = function (n) {
    return (n.recruits || 0) * Sim.stat('player', 'wfRate');
  };

  









  Sim.convNeed = function (n, res) {
    const t = S.type(n), c = t.convert;
    if (!c || !c.inputs) return 0;
    const base = c.inputs[res];
    if (base === undefined) return 0;
    
    
    const key = t.id + '.convert.' + res;
    return Math.max(0.01, (base + Sim.bonus(key)) * Sim.factor(key));
  };
  



  

  Sim.convCi = function (n) {
    const t = S.type(n), c = t.convert || {};
    if (!c.ci) return 0;
    const key = t.id + '.convert.ci';
    return Math.max(0, (c.ci + Sim.bonus(key)) * Sim.factor(key));
  };
  Sim.convWf = function (n) {
    const t = S.type(n), c = t.convert || {};
    const key = t.id + '.convert.wf';
    return Math.max(0.1, ((c.wf || 0) + Sim.bonus(key)) * Sim.factor(key));
  };
  






  Sim.convKw = function (n) {
    const t = S.type(n), c = t.convert || {};
    if (!(c.kw > 0)) return 0;
    const key = t.id + '.convert.kw';
    return Math.max(0.01, (c.kw + Sim.bonus(key)) * Sim.factor(key));
  };
  


  Sim.convStock = function (n, hours) {
    const t = S.type(n), c = t.convert;
    if (!c) return 0;
    let kg = Infinity;
    Object.keys(c.inputs).forEach(function (k) {
      const need = Sim.convNeed(n, k);
      kg = Math.min(kg, need > 0 ? (n.buf[k] || 0) / need : Infinity);
    });
    if (c.out) {                       
      const pid = outPortFor(t, c.out.res);
      kg = Math.min(kg, ((t.outBuffer || Infinity) - (n.obuf[pid] || 0)) / (c.out.kg || 1));
    }
    return Math.max(0, kg);
  };
  


  Sim.convRate = function (n, hours) {
    const t = S.type(n), c = t.convert;
    if (!c) return { kg: 0 };
    let kg = Infinity, short = null;
    Object.keys(c.inputs).forEach(function (k) {
      const need = Sim.convNeed(n, k);
      const can = need > 0 ? (n.buf[k] || 0) / need : Infinity;
      if (can < kg) { kg = can; short = k; }
    });
    const needWf = c.wf ? Sim.convWf(n) : 0;
    if (needWf > 0) {
      const can = (n.rateIn.wf || 0) * hours / needWf;
      if (can < kg) { kg = can; short = 'wf'; }
    }
    
    const needKw = Sim.convKw(n);
    if (needKw > 0) {
      const can = (n.rateIn.kw || 0) * hours / needKw;
      if (can < kg) { kg = can; short = 'kw'; }
    }
    
    if (!c.out) return { kg: Math.max(0, kg), short: short, port: null };
    const pid = outPortFor(t, c.out.res);
    const room = ((t.outBuffer || Infinity) - (n.obuf[pid] || 0)) / (c.out.kg || 1);
    if (room < kg) { kg = room; short = 'out'; }
    return { kg: Math.max(0, kg), short: short, port: pid };
  };

  




















  Sim.recipeNeed = function (n, res) {
    const t = S.type(n), r = t.recipe;
    if (!r || !r.inputs) return 0;
    const base = r.inputs[res];
    if (base === undefined) return 0;
    
    
    const key = t.id + '.recipe.' + res;
    
    
    
    


    const made = Sim.ladderCount(n, 'made');
    const raw  = r.growthMul ? base * Math.pow(r.growthMul, made)
                             : base + ((r.growth && r.growth[res]) || 0) * made;
    const need = raw * Sim.factor(key) + Sim.bonus(key + '.add');
    return Math.max(0.1, need);
  };
  

  Sim.recipeReady = function (n) {
    const r = S.type(n).recipe;
    return Object.keys(r.inputs).every(k => (n.buf[k] || 0) >= Sim.recipeNeed(n, k) - U.EPS);
  };
  

  Sim.recipeWf = function (n) {
    const t = S.type(n);
    







    if (!t.recipe || !t.recipe.wf) return 0;
    
    
    
    const key = t.id + '.recipe.wf';
    

















    const made = Sim.ladderCount(n, 'made');
    const step = t.recipe.growthMul ? t.recipe.wf * Math.pow(t.recipe.growthMul, made)
                                    : t.recipe.wf + ((t.recipe.growth && t.recipe.growth.wf) || 0) * made;
    return Math.max(0.1, (step + Sim.bonus(key)) * Sim.factor(key));
  };
  











  Sim.recipeKw = function (n) {
    const t = S.type(n), r = t.recipe;
    if (!r || !r.kw) return 0;
    const key = t.id + '.recipe.kw';
    



    const step = r.growthMul ? r.kw * Math.pow(r.growthMul, n.made || 0)
                             : r.kw + ((r.growth && r.growth.kw) || 0) * (n.made || 0);
    const need = (step + Sim.bonus(key)) * Sim.factor(key);
    return Math.max(0.1, need);
  };
  

  Sim.gemYield = function (n) {
    const r = S.type(n).recipe;
    if (!r || !r.gem) return 0;
    return r.gem.base + Math.floor((n.made || 0) / r.gem.every);
  };

  














  function printNice(v) {
    if (v < 1) return Math.round(v * 100) / 100;
    if (v < 10) return Math.round(v * 2) / 2;
    if (v < 100) return Math.round(v / 5) * 5;
    if (v < 1000) return Math.round(v / 10) * 10;
    return Math.round(v / 50) * 50;
  }
  Sim.printCount = function (key) {
    return (S.g.printed && S.g.printed[key]) || 0;
  };
  Sim.printPlan = function (n) {
    const t = S.type(n), p = t && t.print;
    if (!p) return null;
    const res = n.grade;                      
    if (!res) return null;
    const hit = (p.boosts || {})[res];
    const key = hit ? hit.boost : 'gem';
    const made = Sim.printCount(key);
    let kg;
    if (hit) kg = hit.kg + (hit.grow || 0) * made;
    else {
      const price = C.gradeValue[res];
      if (!(price > 0)) return null;          
      kg = printNice(p.value * p.gem.mul * (1 + (p.gem.grow || 0) * made) / price);
    }
    return {
      res: res, key: key,
      boost: hit ? hit.boost : null,
      gem: hit ? 0 : 1,
      kg: kg,
      paper: p.paper,
      

      kw: (p.kw + (p.kwGrow || 0) * made) * Sim.factor(t.id + '.print.kw'),
      made: made,
    };
  };
  

  Sim.printReady = function (n) {
    const pl = Sim.printPlan(n);
    if (!pl) return false;
    return (n.buf.paper || 0) >= pl.paper - U.EPS && (n.buf[pl.res] || 0) >= pl.kg - U.EPS;
  };
  



  Sim.gemRate = function (n) {
    const need = Sim.recipeKw(n);
    if (!(need > 0) || !Sim.recipeReady(n)) return 0;
    return Sim.gemYield(n) * (n.rateIn.kw || 0) / need;
  };
  

























  Sim.gemEta = function (n) {
    const t = S.type(n), r = t.recipe;
    if (!r || !r.gem || !Sim.recipeReady(n)) return null;
    

    if (t.collect) {
      const have = n.till || 0;
      if (have > 0 && Sim.collectCap(t, n) - have < Sim.gemYield(n) - U.EPS) return null;
    }
    let hours = 0;
    const half = function (need, pool, rate) {
      if (!(need > 0)) return 0;                 
      const left = Math.max(0, need - (pool || 0));
      if (left <= U.EPS) return 0;
      return rate > 0 ? left / rate : null;      
    };
    const kw = half(Sim.recipeKw(n), n.kwPool, n.rateIn.kw || 0);
    const wf = half(Sim.recipeWf(n), n.wfPool, n.rateIn.wf || 0);
    if (kw === null || wf === null) return null;
    hours = Math.max(kw, wf);
    return hours * C.time.secondsPerGameHour;    
  };
  

  Sim.plantMul = function (n) {
    const r = S.type(n).recipe;
    const m = 1 + ((r && r.boost) || 0) * (n.made || 0);
    


    return (r && r.boostMax) ? Math.min(r.boostMax, m) : m;
  };
  


  Sim.plantMaxed = function (n) {
    const r = S.type(n).recipe;
    return !!(r && r.boostMax && Sim.plantMul(n) >= r.boostMax - U.EPS);
  };

  












  

  Sim.powerLoad = function (n) {
    const t = S.type(n), p = t.powerUp;
    if (!p) return 0;
    








    const key = t.id + '.powerUp.kg';
    const raw = (p.kg || 1) + (p.growth || 0) * (n.made || 0);
    return Math.max(0.01, (raw + Sim.bonus(key)) * Sim.factor(key));
  };
  

  Sim.powerOn = function (n) { return (n.made || 0) > 0; };
  



  Sim.powerShow = function (n) {
    const p = S.type(n).powerUp;
    return !!p && (Sim.powerOn(n) || (n.buf[p.res] || 0) > 0);
  };
  

  Sim.powerFrac = function (n) {
    const p = S.type(n).powerUp;
    if (!p) return 0;
    const want = Sim.powerLoad(n);
    return want > 0 ? U.clamp((n.buf[p.res] || 0) / want, 0, 1) : 0;
  };
  






  Sim.powerStep = function (typeId) {
    const p = (C.nodeTypes[typeId] || {}).powerUp;
    if (!p) return 0;
    const key = typeId + '.powerUp.boost';
    return Math.max(0, ((p.boost || 0) + Sim.bonus(key)) * Sim.factor(key));
  };
  





  Sim.powerMul = function (n) {
    const p = S.type(n).powerUp;
    if (!p) return 1;
    const m = 1 + Sim.powerStep(n.type) * (n.made || 0);
    


    return p.boostMax ? Math.min(p.boostMax, m) : m;
  };
  


  Sim.powerMaxed = function (n) {
    const p = S.type(n).powerUp;
    if (!p) return false;
    







    if (p.loadsMax && (n.made || 0) >= p.loadsMax) return true;
    return !!(p.boostMax && Sim.powerMul(n) >= p.boostMax - U.EPS);
  };

  
















  Sim.panelKw = function (n) {
    const t = S.type(n), p = t.powerUp;
    if (!p || !p.solarShare) return 0;
    const loads = Math.min(n.made || 0, p.loadsMax || Infinity);
    if (!(loads > 0)) return 0;
    if (p.dayOnly !== false && !Sim.solarOn(n)) return 0;
    const share = Math.max(0, p.solarShare + Sim.bonus(t.id + '.powerUp.solarShare'));
    










    const steady = Sim.stat(t.id, 'wfRate') * Sim.stat(t.id, 'kwPerWf');
    return loads * share * steady;
  };
  
  Sim.powerMulOf = function (typeId) { return 1 + Sim.powerStep(typeId); };

  


  Sim.forgeOutput = function (n) {
    const r = S.type(n).recipe;
    return (n.made || 0) * Sim.stat(r.power, 'energyRate');
  };
  


  Sim.forgeLive = function (n) {
    const r = S.type(n).recipe;
    return Sim.wxJoinEnergy(n, (n.made || 0) * Sim.statNoBoost(r.power, 'energyRate'),
                            r.power + '.energyRate');
  };

  






  Sim.roadCrew = function (n) {
    const r = S.type(n).recipe;
    return (n.made || 0) * Sim.stat(r.crew, 'wfRate');
  };

  















  Sim.domeOutput = function (n) {
    const t = S.type(n), r = t.recipe;
    if (!r || !r.ci) return 0;
    const key = t.id + '.recipe.ci';
    return (n.made || 0) * Math.max(0, (r.ci + Sim.bonus(key)) * Sim.factor(key));
  };
  



  Sim.roadMaxed = function (n) {
    const r = S.type(n).recipe;
    return !!(r && r.maxMade && (n.made || 0) >= r.maxMade);
  };

  

  Sim.splitWeights = function (n) {
    const d = S.type(n).defaultWeights;
    const a = typeof n.wa === 'number' ? n.wa : d.a;
    const b = typeof n.wb === 'number' ? n.wb : d.b;
    return { a: Math.max(0, a), b: Math.max(0, b) };
  };
  













  Sim.outLimit = function (n) {
    const v = n && n.outCap;
    if (typeof v === 'number' && isFinite(v) && v >= 0) return v;
    







    if (v === null) return Infinity;
    const t = n && C.nodeTypes[n.type];
    const d = t && t.outRate;
    return (typeof d === 'number' && isFinite(d) && d >= 0) ? d : Infinity;
  };

  


  



  Sim.drainMode = function (n) {
    const v = n && n.outMul;
    if (v === null) return null;
    if (typeof v === 'number' && isFinite(v) && v >= 0) return v;
    return 'auto';
  };
  


  Sim.drainMul = function (n) {
    const m = Sim.drainMode(n);
    return m === 'auto' ? null : m;
  };
  






  







  function storageBeyond(n, seen) {
    if (seen[n.id]) return true;                 
    seen[n.id] = 1;
    for (const l of S.linksFrom(n.id)) {
      const p = S.portsOf(n, 'out').find(x => x.id === l.fromPort);
      if (!p || p.res !== 'energy') continue;
      const dst = S.node(l.to);
      if (!dst) continue;
      if (!S.type(dst).store) return false;      
      if (!storageBeyond(dst, seen)) return false;
    }
    return true;                                  
  }
  Sim.storageOnly = function (n) {
    let any = false;
    for (const p of S.portsOf(n, 'out')) {
      if (p.res !== 'energy') continue;
      for (const l of S.linksFrom(n.id)) {
        if (l.fromPort !== p.id) continue;
        const dst = S.node(l.to);
        if (!dst) continue;
        any = true;
        if (!S.type(dst).store) return false;
      }
    }
    if (!any) return false;
    return (C.powerPush && C.powerPush.storageDeadEnd === false) ? true
         : storageBeyond(n, {});
  };
  



  Sim.autoBank = function (n) {
    if (!(C.powerPush && C.powerPush.autoBank)) return false;
    return Sim.drainMode(n) === 'auto' && Sim.storageOnly(n);
  };
  





  Sim.autoBanking = function (n) {
    return Sim.autoBank(n) && Sim.storeIn(n) - (n.outRate || 0) > 1e-6;
  };
  



  Sim.storeIn = function (n) {
    let r = 0;
    for (const p of S.portsOf(n, 'in')) r += (n.rateIn && n.rateIn[p.id]) || 0;
    return r;
  };

  





  Sim.storeOutput = function (n, t, hours, inRate, seen) {
    const cap   = Sim.outLimit(n);
    const avail = inRate + (n.store || 0) / hours;   
    const want  = Sim.demandOn(n, hours, seen);
    const mul   = Sim.drainMul(n);
    








    const reach = (mul === null) ? Infinity
                : (mul <= 0)     ? inRate
                : Math.max(inRate * mul, Sim.stat(t.id, 'store'));
    







    






    


    const bank = (C.powerPush && C.powerPush.bankSurplus) || Sim.autoBank(n);
    const floor = bank ? Math.min(want, Math.max(inRate, reach))
                       : Math.max(inRate, Math.min(want, reach));
    return Math.max(0, Math.min(cap, avail, floor));
  };
  Sim.splitShare = function (n) {
    const w = Sim.splitWeights(n);
    const sum = w.a + w.b;
    return sum <= 0 ? 0.5 : w.a / sum;      
  };

  









  
















  Sim.splitPlan = function (n, hours, seen) {
    const sa = Sim.splitShare(n), sb = 1 - sa;
    const dA = Sim.branchDemand(n, 'a', hours, seen);
    const dB = Sim.branchDemand(n, 'b', hours, seen);
    const give = Sim.splitGive(sa, sb, dA, dB, dA + dB);
    return { ga: give.ga, gb: give.gb, ask: dA + dB, dA: dA, dB: dB, sa: sa, sb: sb };
  };

  



  Sim.splitGive = function (sa, sb, dA, dB, supply) {
    let ga = Math.min(dA, supply * sa);
    let gb = Math.min(dB, supply * sb);
    let left = supply - ga - gb;
    if (left > 1e-9) { const t = Math.min(left, dA - ga); ga += t; left -= t; }
    if (left > 1e-9) { const t = Math.min(left, dB - gb); gb += t; left -= t; }
    return { ga: ga, gb: gb };
  };

  



  Sim.prioSide = function (n) { return n.prio === 'b' ? 'b' : 'a'; };

  



  Sim.crewUsable = function (n) {
    const t = S.type(n);
    if (!t) return false;
    if (t.recruit) return (n.wfPool || 0) < Sim.recruitNeed(n, 'wf') - U.EPS;
    if (t.rocket) {
      const F = t.rocket.flight;
      const RF = Sim.rocketFuel(n);
      return !!n.built && !(n.flightUntil > 0) &&
             (n.buf[RF.res] || 0) + U.EPS >= RF.kg &&
             !((n.obuf.metal || 0) > 1e-6) && (n.wfPool || 0) < F.wf - U.EPS;
    }
    if (t.recipe && t.recipe.wf)
      return Sim.recipeReady(n) && (n.wfPool || 0) < Sim.recipeWf(n) - U.EPS;
    return true;
  };

  

  Sim.prioWants = function (n, side, hours, seen) {
    const t = S.type(n);
    if (t.passesEnergy) return Sim.branchDemand(n, side, hours, seen) > 1e-9;
    return S.linksFrom(n.id).some(function (l) {
      if (l.fromPort !== side) return false;
      const dst = S.node(l.to);
      return !!dst && Sim.crewUsable(dst);
    });
  };

  






  let supMemo = {}, supStamp = -1;
  function isPowerFwd(t) { return !!(t && (t.store || (t.splitter && t.passesEnergy))); }
  function supplyTotal(n, seen) {
    const t = S.type(n);
    let sum = 0;
    for (const l of S.g.links) {
      if (l.to !== n.id || l.muted) continue;
      const p = S.portsOf(n, 'in').find(x => x.id === l.toPort);
      if (!p || p.res !== 'energy') continue;
      const src = S.node(l.from);
      if (!src || seen[src.id]) continue;
      const wires = S.linksFrom(src.id).filter(x => x.fromPort === l.fromPort && !x.muted).length || 1;
      sum += Sim.supplyAt(src, l.fromPort, seen) / wires;
    }
    if (t.store) sum = Math.min(sum, Sim.outLimit(n));
    return sum;
  }
  Sim.supplyAt = function (n, portId, seen0) {
    const t = S.type(n);
    if (!isPowerFwd(t)) return (n.rates && n.rates['out:' + portId]) || 0;
    const top = !seen0;
    if (top && supStamp !== S.g.playtime) { supMemo = {}; supStamp = S.g.playtime; }
    if (top && supMemo[n.id] !== undefined) return part(supMemo[n.id]);
    const seen = {}; if (seen0) for (const k in seen0) seen[k] = seen0[k];
    seen[n.id] = 1;
    const total = supplyTotal(n, seen);
    if (top) supMemo[n.id] = total;
    return part(total);
    function part(v) {
      if (t.splitter && !t.priority) {
        const s = Sim.splitShare(n);
        return portId === 'a' ? v * s : portId === 'b' ? v * (1 - s) : v;
      }
      return v;
    }
  };
  Sim.showsSupply = function (n, port) {
    return (C.ui || {}).supplyShown !== false && port && port.res === 'energy' &&
           isPowerFwd(S.type(n));
  };

  Sim.hasEnergyWire = function (n) {
    const outs = S.portsOf(n, 'out').filter(p => p.res === 'energy').map(p => p.id);
    return S.linksFrom(n.id).some(l => outs.indexOf(l.fromPort) > -1);
  };

  function capOf(n, t) { return t.buffer ? Sim.stat(t.id, 'buffer') : 0; }

  


  function outPortFor(t, res) {
    const p = ((t.ports && t.ports.out) || []).find(x => x.res === res);
    return p ? p.id : res;
  }
  Sim.outPortFor = outPortFor;
  

  Sim.laneCap = function (n) { return Sim.stat(S.type(n).id, 'buffer') || 0; };
  Sim.laneHeld = function (n, L) {
    const t = S.type(n);
    return total((n.lb && n.lb[L]) || {}) + (n.obuf[S.laneOutPort(t, L)] || 0);
  };
  
  Sim.laneLimit = function (n, L) {
    const v = n && n['lim' + L];
    return (typeof v === 'number' && isFinite(v) && v >= 0) ? v : Infinity;
  };
  
  Sim.adoptLanes = function (n) {
    const t = S.type(n);
    if ((C.ui || {}).gradeFollowsCargo === false) return;
    t.lanes.forEach(function (L) {
      const lb = n.lb[L] || {};
      const held = Object.keys(lb).filter(r => (lb[r] || 0) > 1e-9);
      if (held.length === 1 && n.lg[L] !== held[0]) n.lg[L] = held[0];
    });
  };
  Sim.heldOf = function (n) {
    const t = S.type(n);
    if (t.lanes) return t.lanes.reduce((a, L) => a + Sim.laneHeld(n, L), 0);   
    if (t.bank) return n.bank || 0;               
    if (t.store) return n.store || 0;             
    if (!t.buffer) return 0;
    




    if (t.holdLock) return total(n.buf) + total(n.obuf);
    


    if (t.collectB) return total(n.buf) + total(Sim.sideBuf(n, 'B'));
    













    if (Sim.routingVessel(t)) return total(n.buf) + total(n.obuf);
    
    return t.placement === 'onSite' ? total(n.obuf) : total(n.buf);
  };
  




  Sim.routingVessel = function (t) {
    if (t.holdLock || !t.buffer || !((C.ui || {}).routingBand)) return false;
    return (t.merge && t.mergeFlow === 'material') || !!t.passesMaterial;
  };
  Sim.capOf = function (n) {
    const t = S.type(n);
    







    if (t.print) {
      const pl = Sim.printPlan(n);
      return pl ? pl.paper + pl.kg : t.print.paper;
    }
    if (t.lanes) return Sim.laneCap(n) * t.lanes.length;       
    
    if (t.fission && (C.ui || {}).fuelLoadBand !== false) return Sim.reactorFuel(n).kg;
    if (t.bank) return Sim.stat(t.id, 'bank');
    if (t.store) return Sim.stat(t.id, 'store');    
    





















    if (t.powerUp && (C.ui || {}).powerUpBand !== false && !C.driveIns(t).length)
      return Sim.powerLoad(n);
    if (t.collectB) return capOf(n, t) + Sim.stat(t.id, 'bufferB');
    
    if (Sim.routingVessel(t)) return capOf(n, t) + (Sim.stat(t.id, 'outBuffer') || 0);
    return capOf(n, t);
  };
  Sim.capUnit = function (n) {
    const t = S.type(n);
    
    return (t.store || t.bank) ? (t.bankRes === 'wf' ? 'WF' : 'KW') : 'kg';
  };

  

















  Sim.outHeldOf = function (n) {
    const t = S.type(n);
    if (!t.outBuffer || t.store || t.bank) return 0;
    
    if (t.holdLock || t.lanes || t.collectB || t.placement === 'onSite' || Sim.routingVessel(t)) return 0;
    return total(n.obuf);
  };
  



  Sim.outCapOf = function (n) {
    const t = S.type(n);
    if (!t.outBuffer) return 0;
    const outs = (t.ports && t.ports.out) || [];
    const mats = outs.filter(p => (C.resources[p.res] || {}).flow === 'material');
    return (Sim.stat(t.id, 'outBuffer') || 0) * Math.max(1, mats.length);
  };

  




  Sim.canSwipe = function (site) {
    if (!site) return { ok: false, why: 'NONE' };
    
    
    if (S.onSiteMachines(site).length) return { ok: false, why: 'MACHINE' };
    



    const t = S.type(site);
    



    if (t.grow) {
      if (t.hand !== 'plant') return { ok: false, why: 'NOHAND' };
      if (Sim.growFrac(site) >= 1) return { ok: false, why: 'FULL' };
      return { ok: true, plant: true };
    }
    








    if (t.hand !== 'sweep') return { ok: false, why: 'NOHAND' };
    if (site.reserve <= U.EPS) return { ok: false, why: 'EMPTY' };
    return { ok: true };
  };

  


  Sim.swipe = function (site) {
    const chk = Sim.canSwipe(site);
    if (!chk.ok) return chk;
    if (chk.plant) return Sim.plant(site);
    
    
    let gain = Sim.statWx(site, 'swipe', 'ciPerEntry', 'sweep');
    
    if (Sim.cycle() > 0) gain *= Math.pow((C.fullCircle || {}).swipeMul || 1, Sim.cycle());
    const take = C.swipe.takesFromReserve ? Math.min(gain, site.reserve) : gain;
    

    if (C.swipe.takesFromReserve && S.type(site).deplete) site.reserve -= take;
    S.g.ci += take;
    S.g.totalCI += take;
    S.g.totalCleaned += take;
    S.g.handKg = (S.g.handKg || 0) + take;   
    S.g.totalClicks++;
    Sim.noteHand('ci', take);                
    return { ok: true, amount: take };
  };

  Sim.plant = function (site) {
    
    
    const gain = Sim.statWx(site, 'plant', 'ciPerEntry', 'plant');
    S.g.ci += gain;
    S.g.totalCI += gain;
    Sim.grow(site, gain);
    S.g.totalClicks++;
    Sim.noteHand('ci', gain);
    return { ok: true, amount: gain, plant: true };
  };

  

  Sim.grow = function (site, ci) {
    if (!site || !S.type(site).grow) return;
    site.grown = Math.min(Sim.growCap(site), (site.grown || 0) + ci);
  };
  


  Sim.growCap = function (site) {
    return site.capacity !== undefined ? site.capacity : S.type(site).capacity;
  };
  Sim.growFrac = function (site) {
    const cap = Sim.growCap(site);
    return cap > 0 ? Math.min(1, (site.grown || 0) / cap) : 0;
  };
  




  Sim.growLeft = function (n) {
    const site = S.siteOf(n);
    if (!site || !S.type(site).grow) return 0;
    return Math.max(0, Sim.growCap(site) - (site.grown || 0));
  };
  













  Sim.siteFull = function (n) {
    const site = S.siteOf(n);
    if (!site || !S.type(site).grow) return Sim.growLeft(n) <= U.EPS;
    const rel = (C.diagnose && C.diagnose.siteFullRel) || 0;
    return Sim.growLeft(n) <= Math.max(U.EPS, Sim.growCap(site) * rel);
  };

  








  Sim.poolVolume = function (site) {
    if (!site) return 0;
    const t = S.type(site);
    return site.volume !== undefined ? site.volume : (t.volume || 0);
  };
  Sim.poolCiPerKg = function (site) {
    const v = Sim.poolVolume(site);
    return v > 0 ? Sim.growCap(site) / v : 0;
  };
  


  Sim.poolDirty = function (site) {
    if (!site || !S.type(site).volume) return 0;
    if (site.dirty === undefined) site.dirty = Sim.poolVolume(site);
    return site.dirty;
  };
  Sim.poolClean = function (site) {
    const per = Sim.poolCiPerKg(site);
    return per > 0 ? (site.grown || 0) / per : 0;
  };

  














  Sim.poolRes = function (site) {
    if (!site) return 'dirtyWater';
    if (site.water) return site.water;
    const t = S.type(site);
    return (t && t.water) || 'dirtyWater';
  };

  

  Sim.collect = function (node, side) {
    const t = S.type(node);
    const def = Sim.sideDef(t, side);
    const fld = side === 'B' ? 'tillB' : 'till';
    if (!def || !node[fld]) return { ok: false, why: 'Nothing to collect' };
    const amount = node[fld];
    node[fld] = 0;
    S.earn(def.cur, amount);
    




    if (def.cur === 'money') S.g.totalMoney += amount;
    else if (def.cur === 'ci') {
      S.g.totalCI += amount;
      



      if (def.burns !== false) S.g.totalBurns++;
    }
    







    node.pulse = 1;
    return { ok: true, amount: amount, currency: def.cur };
  };

  













  Sim.licenceLeft = function (n) {
    return Math.max(0, (n.runUntil || 0) - S.g.playtime);
  };
  Sim.licenceOn = function (n) {
    const t = S.type(n);
    return !!t.licence && Sim.licenceLeft(n) > 0;
  };
  



  Sim.licenceCost = function (t) {
    return Math.max(0, t.licence.cost + Sim.bonus(t.id + '.licence.cost'));
  };
  






  Sim.oilCiRate = function (t) {
    return Math.max(0, (t.ciPerKw || 0) + Sim.bonus(t.id + '.ciPerKw'));
  };

  Sim.licence = function (n) {
    const t = S.type(n);
    if (!t.licence) return { ok: false, why: 'Nothing to run' };
    



    const left = Sim.licenceLeft(n);
    if (left > 0) {
      return { ok: false, why: 'Already running, ' + Math.ceil(left) + 's left' };
    }
    if (!((n.buf.oil || 0) > U.EPS)) return { ok: false, why: 'No oil in the tank' };
    const cur = t.licence.cur, cost = Sim.licenceCost(t);
    const have = cur === 'ci' ? S.g.ci : S.g[cur];
    if (!U.canAfford(have, cost)) {
      return { ok: false, why: 'Not enough ' + C.currencies[cur].short };
    }
    
    
    S.spend(cur, cost);
    
    
    
    if (cur === 'ci') S.g.licenceCI = (S.g.licenceCI || 0) + cost;
    n.runUntil = S.g.playtime + t.licence.sec;
    n.pulse = 1;
    Sim.invalidate();
    return { ok: true, cost: cost, currency: cur, sec: t.licence.sec };
  };

  


  Sim.reactorKw = function (t) {
    return Math.max(0, t.fission.kw + Sim.bonus(t.id + '.fission.kw'));
  };
  


  Sim.reactorWx = function (n) {
    if (C.weather.reactorPauses === false) return 1;
    return Math.max(0, Math.min(1, Sim.wxEnergy(n) * Sim.gridMul(n)));
  };
  

  Sim.fuelSwitchOpen = function (t) {
    return !!(t && t.fuelSwitch && S.g.objectives && S.g.objectives[t.fuelSwitch]);
  };
  Sim.fuelAlt = function (n) {
    const t = S.type(n);
    return Sim.fuelSwitchOpen(t) && n.fuelMode === 'alt';
  };
  
  Sim.reactorFuel = function (n) {
    const t = S.type(n);
    return Sim.fuelAlt(n) ? Object.assign({}, t.fission, t.fissionAlt) : t.fission;
  };
  

  Sim.rocketTime = function () { return Math.max(0.1, Sim.factor('rocket.flight.sec')); };
  
  Sim.rocketMetal = function (n) {
    const t = S.type(n), F = t.rocket.flight;
    return Math.max(0, F.metal + Sim.bonus(t.id + '.flight.metal')) * Sim.factor(t.id + '.flight.metal');
  };
  
  Sim.rocketFuel = function (n) {
    const t = S.type(n), F = t.rocket.flight, A = t.rocket.flightAlt, k = Sim.rocketTime();
    return (Sim.fuelAlt(n) && A) ? { res: A.res, kg: A.fuel, sec: A.sec * k }
                                 : { res: 'turbofuel', kg: F.fuel, sec: F.sec * k };
  };
  Sim.setFuel = function (n, alt) {
    const t = S.type(n);
    if (!Sim.fuelSwitchOpen(t)) return { ok: false, why: 'Not unlocked' };
    if (t.rocket && Sim.rocketLeft(n) > 0) return { ok: false, why: 'Not while it is in flight' };
    if (t.fission && Sim.licenceLeft(n) > 0) return { ok: false, why: 'Not while it is running' };
    const want = alt ? 'alt' : null;
    if ((n.fuelMode || null) === want) return { ok: true };
    n.fuelMode = want;
    
    const shown = S.portsOf(n, 'in').map(p => p.id);
    S.linksInto(n.id).filter(l => shown.indexOf(l.toPort) < 0).forEach(l => S.unlink(l.id));
    Sim.invalidate();
    return { ok: true };
  };
  Sim.reactorOn = function (n) {
    const t = S.type(n);
    return !!(t && t.fission) && Sim.licenceLeft(n) > 0;
  };
  Sim.fissionStart = function (n) {
    const t = S.type(n);
    if (!t || !t.fission) return { ok: false, why: 'Nothing to run' };
    const left = Sim.licenceLeft(n);
    if (left > 0) return { ok: false, why: 'Already running, ' + Math.ceil(left) + 's left' };
    const F = Sim.reactorFuel(n), res = F.res || 'rod';
    const have = n.buf[res] || 0;
    if (!(have + U.EPS >= F.kg)) {
      
      if (have > U.EPS && (C.ui || {}).rodCount !== false)
        return { ok: false, why: (res === 'rod' ? 'Rods: ' : 'Pellets: ') + U.small(have) + ' of ' +
                                 U.small(F.kg) + ' kg loaded' };
      return { ok: false, why: res === 'rod' ? 'No uranium rods loaded' : 'No plutonium pellets loaded' };
    }
    n.buf[res] = Math.max(0, (n.buf[res] || 0) - F.kg);
    n.runUntil = S.g.playtime + F.sec;
    n.pulse = 1;
    S.g.fissionRuns = (S.g.fissionRuns || 0) + 1;   
    return { ok: true, sec: F.sec, kg: F.kg, res: F.res };
  };

  


  Sim.rocketLeft = function (n) {
    return Math.max(0, (n.flightUntil || 0) - S.g.playtime);
  };
  Sim.rocketState = function (n) {
    const t = S.type(n);
    if (!t || !t.rocket) return null;
    const B = t.rocket.build, left = Sim.rocketLeft(n), RF = Sim.rocketFuel(n);
    if (left > 0) return { state: 'flying', pct: left / (n.flightSec || RF.sec), left: left };
    if (!n.built) {
      let have = 0, need = 0;
      Object.keys(B).forEach(k => { have += Math.min(n.buf[k] || 0, B[k]); need += B[k]; });
      return { state: 'building', pct: need > 0 ? have / need : 1 };
    }
    const held = (n.obuf && n.obuf.metal) || 0;
    if (held > 1e-6) return { state: 'hold', pct: 1, held: held };
    const fuel = n.buf[RF.res] || 0, F = t.rocket.flight;
    if (fuel + U.EPS < RF.kg) return { state: 'fuel', pct: fuel / RF.kg, have: fuel, need: RF.kg, res: RF.res };
    const pool = n.wfPool || 0;
    if (pool + U.EPS < F.wf) return { state: 'crew', pct: pool / F.wf, have: pool };
    return { state: 'ready', pct: 1 };
  };
  Sim.rocketLaunch = function (n) {
    const t = S.type(n);
    if (!t || !t.rocket) return { ok: false, why: 'Nothing to launch' };
    const st = Sim.rocketState(n), F = t.rocket.flight;
    if (st.state === 'flying') return { ok: false, why: 'Already in flight, ' + Math.ceil(st.left) + 's left' };
    if (st.state === 'building') return { ok: false, why: 'Not built yet' };
    if (st.state === 'hold') return { ok: false, why: 'Empty the metal out of the hold first' };
    if (st.state === 'fuel') return { ok: false, why: st.res === 'turbofuel' ? 'Not enough turbofuel' : 'Not enough plutonium pellets' };
    if (st.state === 'crew') return { ok: false, why: 'The crew is not ready' };
    const RF = Sim.rocketFuel(n);
    n.buf[RF.res] = Math.max(0, (n.buf[RF.res] || 0) - RF.kg);
    n.wfPool = 0;
    n.flightSec = RF.sec;
    n.flightUntil = S.g.playtime + RF.sec;
    n.pulse = 1;
    Sim.noteFleet(n);
    S.g.launches = (S.g.launches || 0) + 1;         
    return { ok: true, sec: RF.sec };
  };
  

  Sim.noteFleet = function (n) {
    const loc = n.loc || C.locations[0].id;
    const w = Sim.wxIn(loc);
    if (!w || w.id !== 'storm') return;
    const st = Sim.wxState(loc);
    const g = S.g;
    if (!g.stormFleet || g.stormFleet.evt !== st.evt) g.stormFleet = { evt: st.evt, loc: loc, ids: [] };
    if (g.stormFleet.ids.indexOf(n.id) < 0) g.stormFleet.ids.push(n.id);
    const o = (C.objectives || []).find(x => x.id === 'fleetStorm');
    if (o && g.stormFleet.ids.length >= o.goal) g.fleetStorm = true;
  };

  



  Sim.boostById = function (id) { return C.boosts.find(b => b.id === id); };

  



  Sim.boostNodes = function (b) {
    if (b.requires) return b.requires;
    const out = [];
    const add = k => { if (out.indexOf(k) < 0) out.push(k); };
    (b.effects || []).forEach(function (e) {
      const tid = e.stat.split('.')[0];
      if (tid === '*') {
        const field = e.stat.slice(2);
        Object.keys(C.nodeTypes).forEach(k => { if (C.nodeTypes[k][field] !== undefined) add(k); });
      } else if (C.nodeTypes[tid]) add(tid);
    });
    return out;
  };

  




  Sim.boostSites = function (b) {
    const out = [];
    const add = k => { if (out.indexOf(k) < 0) out.push(k); };
    (b.effects || []).forEach(function (e) {
      const root = e.stat.split('.')[0];
      if (root === 'swipe') add('trashSite');
      else if (root === 'plant') add('treeSite');
    });
    return out;
  };
  


  Sim.boostMarks = function () {
    const out = {};
    C.boosts.forEach(function (b) {
      if (!Sim.boostActive(b.id)) return;
      const seen = {};
      const add = function (k) {
        if (!C.nodeTypes[k] || seen[k]) return;
        seen[k] = 1;
        (out[k] = out[k] || []).push(b);
      };
      Sim.boostNodes(b).concat(Sim.boostSites(b), b.marks || []).forEach(function (k) {
        add(k);
        



        Object.keys(C.nodeTypes).forEach(function (o) {
          if (C.nodeTypes[o].valueGroup === k) add(o);
        });
      });
    });
    return out;
  };
  

  Sim.handBoost = function () {
    return C.boosts.find(b => Sim.boostActive(b.id) &&
      (b.effects || []).some(e => { const r = e.stat.split('.')[0]; return r === 'swipe' || r === 'plant'; })) || null;
  };

  

  Sim.boostVisible = function (b) {
    const nodes = Sim.boostNodes(b);
    if (!nodes.length) return true;
    return nodes.some(k => S.isUnlocked(k));
  };
  Sim.visibleBoosts = function () { return C.boosts.filter(Sim.boostVisible); };
  Sim.boostLeft = function (id) { return (S.g.boosts && S.g.boosts[id]) || 0; };
  Sim.boostActive = function (id) { return Sim.boostLeft(id) > 0; };

  
  Sim.boostUses = function (id) { return (S.g.boostUses && S.g.boostUses[id]) || 0; };
  

  Sim.boostUsesTotal = function () {
    let n = 0;
    for (const k in (S.g.boostUses || {})) n += S.g.boostUses[k];
    return n;
  };
  
  Sim.boostDur = function () { return Math.max(1, C.boostSec + Sim.bonus('boost.sec')); };
  Sim.boostFree = function () { return Sim.boostUsesTotal() < (C.boostFirstFree || 0); };
  Sim.boostCost = function (b) {
    if (Sim.boostFree()) return 0;
    return b.cost + Math.floor(Sim.boostUses(b.id) / C.boostUseStep) * C.boostUseSurcharge;
  };

  Sim.buyBoost = function (id) {
    const b = Sim.boostById(id);
    if (!b) return { ok: false, why: 'Unknown boost' };
    if (!Sim.boostVisible(b)) return { ok: false, why: 'Nothing that uses it is unlocked yet' };
    if (b.nightOnly && Sim.sunAllUp()) return { ok: false, why: 'The sun is already up' };
    const price = Sim.boostCost(b);
    if (!U.canAfford(S.bank('diamond'), price)) {
      return { ok: false, why: 'Not enough diamonds' };
    }
    S.spend('diamond', price);
    S.g.boostUses[id] = Sim.boostUses(id) + 1;
    



    S.g.lastBoostAt = S.g.playtime || 0;
    if (b.instant) { Sim.fireInstant(b); return { ok: true, boost: b, instant: true, price: price }; }
    
    S.g.boosts[id] = Sim.boostDur();
    Sim.invalidate();
    return { ok: true, boost: b, price: price };
  };

  




  Sim.boostStock = function (id) { return (S.g.boostStock && S.g.boostStock[id]) || 0; };
  Sim.useStock = function (id) {
    const b = Sim.boostById(id);
    if (!b) return { ok: false, why: 'Unknown boost' };
    if (Sim.boostStock(id) < 1) return { ok: false, why: 'None printed' };
    if (b.nightOnly && Sim.sunAllUp()) return { ok: false, why: 'The sun is already up' };
    S.g.boostStock[id] -= 1;
    if (b.instant) { Sim.fireInstant(b); return { ok: true, boost: b, instant: true, price: 0 }; }
    S.g.boosts[id] = Sim.boostDur();
    Sim.invalidate();
    return { ok: true, boost: b, price: 0 };
  };
  


  Sim.printEta = function (n) {
    const pl = Sim.printPlan(n);
    if (!pl || !Sim.printReady(n)) return null;
    const kw = (n.rates && n.rates['in:kw']) || (n.rateIn && n.rateIn.kw) || 0;
    if (kw <= 1e-6) return null;
    return Math.max(0, (pl.kw - (n.kwPool || 0)) / kw * 60);
  };

  

  Sim.forceSunrise = function () {
    const d = Sim.solarDuty();                                   
    const cycle = d.onSec + d.offSec;
    
    
    Sim.wxLocs().forEach(function (l) { const w = Sim.wxState(l); if (w && w.heldNight) w.heldNight = false; });
    if (d.startOnFirst) { S.g.sunAt = S.g.playtime || 0; return; }
    const phase = ((S.g.playtime || 0) + (S.g.solarShift || 0)) % cycle;
    
    S.g.solarShift = (S.g.solarShift || 0) + (cycle - phase);
  };

  
  Sim.fireInstant = function (b) {
    if (b.id === 'sunrise') Sim.forceSunrise();
  };

  




  



  Sim.cappedTypes = function () {
    return Object.keys(C.nodeTypes)
      .filter(k => C.nodeTypes[k].cap !== undefined && !C.nodeTypes[k].capFixed);
  };
  Sim.visibleCaps = function () { return Sim.cappedTypes().filter(k => S.isUnlocked(k)); };
  Sim.capLevel = function (typeId) { return (S.g.caps && S.g.caps[typeId]) || 0; };
  Sim.capMaxed = function (typeId) { return Sim.capLevel(typeId) >= C.capShop.maxLevel; };
  
  Sim.capCost = function (typeId) {
    if (Sim.capMaxed(typeId)) return null;
    
    const own = C.capShop.costsBy && C.capShop.costsBy[typeId];
    return (own || C.capShop.costs)[Sim.capLevel(typeId)];
  };

  Sim.buyCap = function (typeId) {
    const t = C.nodeTypes[typeId];
    if (!t || t.cap === undefined) return { ok: false, why: 'That machine has no limit' };
    if (Sim.capMaxed(typeId)) return { ok: false, why: 'Already at the highest limit' };
    const cur = C.capShop.currency, price = Sim.capCost(typeId);
    if (!U.canAfford(S.bank(cur), price)) {
      return { ok: false, why: 'Not enough ' + C.currencies[cur].short };
    }
    
    S.spend(cur, price);
    S.g.caps[typeId] = Sim.capLevel(typeId) + 1;
    return { ok: true, name: t.name, cap: S.buildCap(typeId), price: price };
  };

  







  Sim.wxCfg = function () { return C.weather; };
  Sim.wxEventById = function (id) { return C.weather.events.find(e => e.id === id); };

  


  Sim.wxLocs = function () { return (C.weather.locs || []).map(w => w.loc); };
  Sim.wxPlace = function (loc) {
    return (C.weather.locs || []).find(w => w.loc === (loc || S.g.loc)) || null;
  };
  Sim.wxChance = function (loc, e) {
    const p = Sim.wxPlace(loc);
    const over = p && p.chance && p.chance[e.id];
    return over === undefined || over === null ? e.chance : over;
  };

  





  const WX_NONE = { id: null, left: 0, roll: 0, next: null, nextLeft: 0, nextSeq: 0,
                    flash: 0, blocked: false };
  Sim.wxState = function (loc) {
    const g = S.g;
    


    if (!Sim.wxPlace(loc)) return WX_NONE;
    g.wxAt = g.wxAt || {};
    return g.wxAt[loc] || (g.wxAt[loc] = { id: null, left: 0, roll: 0, next: null,
                                           nextLeft: 0, nextSeq: 0, flash: 0,
                                           blocked: false });
  };

  

  Sim.wxReady = function (loc) {
    if (!C.weather.enabled) return false;
    if (loc) {
      if (!Sim.wxPlace(loc)) return false;
      const L = S.locationById(loc);
      return !!L && S.locOpen(L);
    }
    return Sim.wxLocs().some(id => Sim.wxReady(id));
  };

  


  Sim.weather = function (loc) { return Sim.wxIn(loc === undefined ? S.g.loc : loc); };
  Sim.wxLeft = function (loc) {
    return Math.max(0, Sim.wxState(loc === undefined ? S.g.loc : loc).left || 0);
  };
  Sim.wxFlashOf = function (loc) {
    return Math.max(0, Sim.wxState(loc === undefined ? S.g.loc : loc).flash || 0);
  };

  

  Sim.wxIn = function (loc) {
    const w = Sim.wxState(loc || C.locations[0].id);
    if (!w.id || (w.left || 0) <= 0) return null;
    return Sim.wxEventById(w.id) || null;
  };

  
  Sim.wxRunning = function () {
    const out = [];
    Sim.wxLocs().forEach(function (loc) {
      const e = Sim.wxIn(loc);
      if (e) out.push({ loc: loc, event: e, left: Sim.wxLeft(loc) });
    });
    return out;
  };

  

  Sim.blockChance = function () { return Sim.stat('weather', 'blockChance'); };
  




  Sim.chargeStrike = function (eventId, loc) {
    let paid = 0;
    for (const n of S.g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t || !t.strikeCharge || t.strikeEvent !== eventId) continue;
      if (n.loc !== loc) continue;
      const cap = Sim.capOf(n), kw = Sim.stat(t.id, 'strikeCharge');
      const was = n.store || 0;
      n.store = Math.min(cap, was + kw);
      if (n.store > was) {
        paid += n.store - was;
        Sim.events.push({ kind: 'strikeCharge', node: n.id, kw: n.store - was, loc: loc });
      }
    }
    return paid;
  };
  


  Sim.wxBlocked = function (loc) {
    const w = Sim.wxState(loc || C.locations[0].id);
    return !!w.blocked && !!Sim.wxIn(loc);
  };

  


  Sim.wx = function (node, key) {
    const loc = (node && node.loc) || C.locations[0].id;
    const w = Sim.wxIn(loc);
    if (!w || !w.mul || w.mul[key] === undefined) return 1;
    
    if (key === 'battery' && Sim.wxBlocked(loc)) return 1;
    return w.mul[key];
  };

  


  Sim.wxEnergy = function (node) {
    const loc = node.loc || C.locations[0].id;
    const w = Sim.wxIn(loc);
    if (!w || !w.energy) return 1;
    if (Sim.wxBlocked(loc)) return 1;
    if (w.energy[node.type] !== undefined) return w.energy[node.type];
    return w.energy['*'] !== undefined ? w.energy['*'] : 1;
  };

  


  Sim.startWeather = function (id, loc) {
    const e = Sim.wxEventById(id);
    if (!e) return { ok: false, why: 'Unknown weather' };
    loc = loc || S.g.loc;
    if (!Sim.wxPlace(loc)) return { ok: false, why: 'No weather here' };
    const w = Sim.wxState(loc);
    w.id = e.id;
    w.left = e.sec;
    w.roll = 0;
    S.g.wxEvt = (S.g.wxEvt || 0) + 1;
    w.evt = S.g.wxEvt;                        
    w.flash = C.weather.fadeSec;
    
    
    S.g.wxSeen = S.g.wxSeen || {};
    S.g.wxSeen[e.id] = true;
    
    
    w.blocked = !!e.blockable && Math.random() < Sim.blockChance();
    if (w.blocked) {
      S.g.boltBlocked = true;                 
      Sim.events.push({ kind: 'wxBlocked', name: e.name, loc: loc });
    }
    





    Sim.chargeStrike(e.id, loc);
    

    if (e.action === 'sunrise') {
      const hold = C.weather.heatHoldsNight !== false && Sim.sunAnchor() !== null && !Sim.solarOn();
      if (hold) w.heldNight = true; else Sim.forceSunrise();
    }
    Sim.events.push({ kind: 'wx', id: e.id, name: e.name, desc: e.desc, color: e.color,
                      blocked: w.blocked, loc: loc });
    return { ok: true, event: e, blocked: w.blocked };
  };

  Sim.clearWeather = function (loc) {
    loc = loc || S.g.loc;
    const w = Sim.wxState(loc);
    





    const e = w.id ? Sim.wxEventById(w.id) : null;
    

    const wasBlocked = !!w.blocked;
    w.id = null; w.left = 0; w.roll = 0; w.blocked = false; w.heldNight = false;
    w.flash = C.weather.fadeSec;
    
    
    if (e) Sim.events.push({ kind: 'wxEnd', name: e.name, endSound: e.endSound, loc: loc });
    
    if (e && e.trips && !wasBlocked) Sim.tripGrid(loc);
  };

  








  Sim.predictLead = function () {
    return Math.max(0, C.weather.leadSec + Sim.bonus('forecastMast.leadSec'));
  };
  
  Sim.wxIncoming = function (loc) {
    const w = Sim.wxState(loc === undefined ? S.g.loc : loc);
    if (!w.next) return null;
    const e = Sim.wxEventById(w.next);
    return e ? { event: e, left: Math.max(0, w.nextLeft || 0) } : null;
  };
  




  Sim.wxKnown = function (loc) {
    loc = loc || S.g.loc;
    const w = Sim.wxState(loc);
    if (!w.next) return false;
    return S.machines().some(n => S.type(n).predict &&
      (n.loc || C.locations[0].id) === loc && n.sawSeq === w.nextSeq);
  };
  



  Sim.mastCost = function (t) {
    return Math.max(0, t.predict.cost + Sim.bonus(t.id + '.predict.cost'));
  };
  




  Sim.mastPaused = function (n) {
    const t = n && S.type(n);
    return !!(n && n.mastOff) && !!(t && t.predict && t.predict.canPause !== false);
  };

  





  Sim.rollWeather = function (loc) {
    loc = loc || S.g.loc;
    if (!Sim.wxPlace(loc)) return null;
    const w = Sim.wxState(loc);
    let r = Math.random(), acc = 0;
    for (const e of C.weather.events) {
      acc += Sim.wxChance(loc, e);            
      if (r < acc) {
        w.next = e.id;
        w.nextLeft = Sim.predictLead();
        




        S.g.wxSeq = (S.g.wxSeq || 0) + 1;
        w.nextSeq = S.g.wxSeq;
        return { ok: true, queued: e.id, loc: loc };
      }
    }
    return null;
  };

  




  Sim.crewOf = function (n) { return (n.crew || []).filter(e => e > S.g.playtime).length; };

  





  Sim.hireMax = function (n) {
    const t = S.type(n);
    return Math.round(t.hire.max + Sim.bonus(t.id + '.hire.max'));
  };
  Sim.hireRoom = function (n) { return Sim.hireMax(n) - Sim.crewOf(n); };

  







  




  Sim.hireBase = function (n) {
    const h = S.type(n).hire;
    const src = C.nodeTypes[h.priceOf];
    return (S.priceAtCount(h.priceOf, S.peakBuiltOf(h.priceOf)) || src.cost.base) *
           h.priceRatio;
  };

  


  Sim.hireSec = function (n) {
    const t = S.type(n);
    return t.hire.sec + Sim.bonus(t.id + '.hire.sec');
  };
  Sim.hireMaxSec = function (n) {
    const t = S.type(n), h = t.hire;
    
    
    return h.maxSec ? h.maxSec + Sim.bonus(t.id + '.hire.maxSec') : Sim.hireSec(n);
  };

  



  Sim.hireDiscount = function (n, count, sec) {
    const h = S.type(n).hire;
    if (h.bulkDiscount) {
      const tbl = h.bulkDiscount;
      return tbl[Math.min(Math.max(1, count), tbl.length) - 1] || 0;
    }
    let off = 0;
    if (h.longSec && (sec || Sim.hireSec(n)) > h.longSec) off += h.longOff || 0;
    if (h.manyAt && count >= h.manyAt) off += h.manyOff || 0;
    return off;
  };

  






















  Sim.hirePrice = function (n, count, sec) {
    const h = S.type(n).hire;
    const base = Sim.hireBase(n);
    const have = Sim.crewOf(n);
    sec = sec || Sim.hireSec(n);
    let total;
    if (h.mult) {
      const blocks = sec / (h.unitSec || h.sec);
      total = base * h.mult * count * blocks * Math.pow(h.growth || 1, have);
    } else {
      total = 0;
      for (let i = 0; i < count; i++) total += base * Math.pow(h.growth, have + i);
    }
    return Math.max(1, Math.ceil(total * (1 - Sim.hireDiscount(n, count, sec))));
  };

  Sim.hire = function (n, count, sec) {
    const t = S.type(n);
    if (!t.hire) return { ok: false, why: 'Not a Hiring Post' };
    count = Math.max(1, Math.min(count || 1, Sim.hireRoom(n)));
    if (Sim.hireRoom(n) <= 0) {
      return { ok: false, why: 'All ' + Sim.hireMax(n) + ' are already working' };
    }
    sec = Math.max(1, Math.min(sec || Sim.hireSec(n), Sim.hireMaxSec(n)));
    const price = Sim.hirePrice(n, count, sec);
    if (!U.canAfford(S.bank(t.hire.currency), price)) {
      return { ok: false, why: 'Not enough ' + C.currencies[t.hire.currency].short };
    }
    S.spend(t.hire.currency, price);
    n.crew = (n.crew || []).filter(e => e > S.g.playtime);
    for (let i = 0; i < count; i++) n.crew.push(S.g.playtime + sec);
    n.pulse = 1;
    









    const bar = C.goals.fullShiftDeclared === false
      ? { hands: Sim.hireMax(n), sec: Sim.hireMaxSec(n) }
      : { hands: t.hire.max, sec: t.hire.maxSec };
    if (t.hire.maxSec && count >= bar.hands && sec >= bar.sec - 1e-9) {
      S.g.bigHire = true;
    }
    return { ok: true, count: count, price: price, sec: sec, currency: t.hire.currency };
  };

  
  Sim.crewLeft = function (n) {
    const live = (n.crew || []).filter(e => e > S.g.playtime);
    if (!live.length) return 0;
    return Math.min.apply(null, live) - S.g.playtime;
  };

  
  










  Sim.gemSpawn = function () {
    const G = C.gem, R = GG.render;
    const spot = (G.avoidUi && GG.ui && GG.ui.gemSpot) ? GG.ui.gemSpot() : null;
    const size = R && R.size ? R.size() : null;
    let sx, sy;
    if (spot) { sx = spot.x; sy = spot.y; }
    else if (size && size.w && size.h) {
      sx = size.w * (G.padX + Math.random() * (1 - 2 * G.padX));
      sy = size.h * (G.padY + Math.random() * (1 - 2 * G.padY));
    }
    

    if (sx === undefined || !G.worldAnchored || !R || !R.toWorld) {
      return { fx: G.padX + Math.random() * (1 - 2 * G.padX),
               fy: G.padY + Math.random() * (1 - 2 * G.padY) };
    }
    const w = R.toWorld(sx, sy);
    return { x: w.x, y: w.y, loc: S.g.loc };
  };

  



  Sim.gemFollow = function () {
    const g = S.g.gem;
    if (!g || !C.gem.worldAnchored || C.gem.followYou === false) return false;
    if (g.loc === S.g.loc) return false;
    const fresh = Sim.gemSpawn();
    S.g.gem = fresh;
    return true;
  };

  Sim.gemReady = function () { return !!S.g.gem; };
  
  Sim.gemEvery = function () { return Math.max(60, C.gem.everySec + Sim.bonus('gem.everySec')); };
  Sim.gemIn = function () { return Math.max(0, Sim.gemEvery() - (S.g.gemTimer || 0)); };

  Sim.takeGem = function () {
    if (!S.g.gem) return { ok: false, why: 'Nothing to pick up' };
    const amount = C.gem.reward;
    S.g.gem = null;
    S.g.gemTimer = 0;                 
    S.earn('diamond', amount);
    S.g.totalDiamonds += amount;
    S.g.gemsTaken = (S.g.gemsTaken || 0) + 1;   
    return { ok: true, amount: amount };
  };

  



  Sim.goalDone = function (o) {
    const g = S.g;
    switch (o.id) {
      case 'firstSweep':   return (g.totalClicks || 0) >= o.goal;
      case 'firstBurn':    return (g.totalBurns || 0) >= o.goal;
      case 'firstCash':    return (g.totalMoney || 0) > 0;
      case 'firstPower':   return S.isUnlocked('windTurbine') || S.isUnlocked('solarPanel');
      case 'perfectSplit': return !!g.sorterPerfect;
      case 'evenPower':    return !!g.splitEven;
      case 'firstGem':     return (g.gemsTaken || 0) >= o.goal;
      case 'maxedSkill':   return C.skills.some(sk =>
                             sk.tree === 'money' && S.skillLevel(sk.id) >= Sim.maxLevel(sk));
      case 'heavyMerge':   return S.machines().some(function (n) {
        const t = S.type(n);
        return t.mergeLock && n.grade === 'heavy' && S.linksInto(n.id).length >= 2;
      });
      



      case 'acidDrum':     return S.machines().some(function (n) {
        return S.type(n).holdLock && n.grade === 'acid' && Sim.heldOf(n) > 0;
      });
      case 'threeSources': return Sim.bestGridMix() >= o.goal;
      case 'handHundred':  return (g.handKg || 0) >= o.goal;
      
      case 'halfSite':     return (g.sitesDrained || 0) > 0 || S.sites().some(s =>
                             s.full && s.reserve <= s.full * o.goal + U.EPS);
      case 'fullCrew':     return S.machines().some(n =>
                             S.type(n).hire && Sim.crewOf(n) >= o.goal);
      case 'bigCrew':      return S.machines().some(function (n) {
        const t = S.type(n);
        return t.merge && t.mergeFlow === 'rate' && S.linksInto(n.id).length >= o.goal;
      });
      case 'powerKg':      return (g.powerKg || 0) >= o.goal;
      case 'firstMetal':   return (g.metalSold || 0) > 0;
      case 'spendGems':    return (g.diamondSpent || 0) >= o.goal;
      
      case 'drainSite':    return (g.sitesDrained || 0) >= o.goal;
      






      case 'firstRock':
      case 'tenCraters':   return (g.rocksDug || 0) >= o.goal;
      case 'hiredFive':    return Sim.fullPostsOnJunction() >= o.goal;
      case 'firstTree':    return S.machines().some(n => n.type === 'treePlanter');
      case 'newLand':      return S.hasSkill('greenhaven');
      case 'allWeather':   return Sim.wxGoalCount() >= C.weather.events.length;
      
      
      case 'yardBare':     return Sim.yardBare();
      
      case 'firstCells':   return (g.cellsMade || 0) >= o.goal;
      case 'bigArray':     return S.machines().some(n => {
        const r = S.type(n).recipe;
        return r && r.power && Sim.forgeOutput(n) > o.goal;
      });
      case 'bigOutreach':  return S.machines().some(n =>
                             S.type(n).recruit && Sim.recruitOutput(n) > o.goal);
      
      case 'fullVault':    return S.machines().some(n =>
                             S.type(n).store && S.linksInto(n.id).length >= o.goal);
      case 'splitChain':   return Sim.splitterChain() >= o.goal;
      
      case 'bothTimber':   return Object.keys(g.woodWays || {}).length >= o.goal;
      case 'charredWood':  return (g.woodCharred || 0) >= o.goal;
      case 'kiloCI':       return (g.totalCI || 0) >= o.goal;
      case 'kiloMoney':    return (g.totalMoney || 0) >= o.goal;
      case 'boltBlocked':  return !!g.boltBlocked;
      
      
      case 'fullGrove':    return S.sites().some(s => s.type === 'treeSite' &&
                             Sim.growFrac(s) >= 0.999);
      case 'bigHire':      return !!g.bigHire;
      case 'fiveSuns':     return Sim.fiveSunsBest() >= o.goal;    
      case 'robotWaste':   return (g.robotWasteKg || 0) >= o.goal;  
      case 'bankFull':     return Sim.bankFill() >= 0.999999;       
      case 'bankGold':     return Sim.bankGold() >= o.goal - 1e-6;  
      case 'warehouse':    return Sim.warehouseFrac(o) >= 1;              
      case 'fleetStorm':   return !!g.fleetStorm;                         
      


      case 'fullBloom':    return S.machines().some(n =>
                             n.type === 'treePlanter' && Sim.plantMaxed(n));
      
      case 'oilSacrifice': return (g.licenceCI || 0) >= o.goal;
      case 'pureGlass':    return !!g.pureGlass;
      case 'stampBlueprint': return !!g.bpPlaced;
      case 'gemFifty':     return (g.gemsTaken || 0) >= o.goal;
      case 'forgeCycle':   return !!g.forgeCycle;
      case 'soldCells':    return !!g.soldPair;
      
      case 'firstPressed': return (g.gemsMade || 0) >= o.goal;
      


      case 'firstTonic':   return ((g.poweredUp || {}).player || 0) >= o.goal;
      case 'firstBlade':   return ((g.poweredUp || {}).windTurbine || 0) >= o.goal;
      case 'firstGlazing': return ((g.poweredUp || {}).solarPanel  || 0) >= o.goal;
      case 'allPowered':   return Sim.poweredNow('player', C.goals.poweredMul) >= o.goal &&
                                  Sim.poweredNow('windTurbine', C.goals.poweredMul) >= o.goal;
      
      case 'openMire':
      case 'openBlack':
      case 'openGlow':     { const L = S.locationById(o.loc); return !!L && S.locOpen(L); }
      case 'clearPool':
      case 'spillMopped':  return Sim.bestGrow(o.site) >= 0.999;
      case 'fullCircle':   return (g.waterBack || 0) >= o.goal;
      case 'clearSkies':   return Sim.everyPlace(n => n.type === 'airCleaner' &&
                             (n.raw['v:0'] || 0) > 0) >= 1;
      case 'chargedAir':   return ((g.poweredUp || {}).stormTurbine || 0) >= o.goal;
      case 'finePrint':    return ((g.convKg || {}).chip || 0) >= o.goal - U.EPS;
      case 'glassGarden':  return ((g.batches || {}).biodome || 0) >= o.goal;
      case 'domeEverywhere': return Sim.everyPlace(n => n.type === 'biodome' && (n.made || 0) >= 1) >= 1;
      case 'splitAtom':    return (g.fissionRuns || 0) >= o.goal;
      
      case 'rainDance':    return Sim.boostActive('rally') && Sim.boostActive('grove') &&
                             S.machines().some(n => n.type === 'treePlanter' &&
                               (n.raw['v:0'] || 0) > 0 &&
                               ((Sim.wxIn(n.loc) || {}).id === 'rain'));
      case 'offPress':     return Sim.printedKinds() >= 1;
      case 'fullCatalogue': return Sim.printedKinds() >= Sim.printKinds().length;
      
      case 'rareFind': case 'longHaul': case 'tripleStack': case 'greatArray':
      case 'grassroots': case 'diamondMine': case 'goldRush': case 'reactorRow':
      case 'missionControl': case 'strongVolunteer': case 'printingPress': case 'glassCity':
      case 'cleanTide': case 'crewRiver': case 'powerRiver': case 'millionCI':
      case 'weatherStation': case 'fullCapacity': case 'moneyMaster': case 'allBoosts':
      case 'worldReborn': case 'nothingAnywhere': case 'allTrials':
                           return Sim.roadFrac(o) >= 1 - 1e-9;
      case 'printedStone': return Sim.printCount('gem') >= o.goal;
      case 'bottledBolt':  return S.machines().some(n => S.type(n).strikeCharge &&
                             
                             (n.store || 0) >= Sim.capOf(n) * 0.99);
      case 'allForecast':  return C.weather.events.every(e =>
                             !!(g.wxPredicted && g.wxPredicted[e.id]));
      case 'richPlanter':  return S.machines().some(n =>
                             n.type === 'treePlanter' && Sim.plantMul(n) >= o.goal - U.EPS);
      


      case 'allGenerators': {
        const kinds = Object.keys(C.nodeTypes).filter(function (id) {
          const t = C.nodeTypes[id];
          return t.energyRate && !C.driveIns(t).length;
        });
        
        return C.locations.some(L => kinds.every(k =>
          S.machines().filter(n => n.type === k &&
            (n.loc || C.locations[0].id) === L.id).length >= o.goal));
      }
      



      case 'oneCleaner':   if (o.kinds) return Sim.dugProgress(o) >= 1 - 1e-9;
                           return C.locations.some(function (L) {
        const used = Object.keys((g.digBy && g.digBy[L.id]) || {});
        if (used.length !== 1) return false;
        
        
        return Sim.sitesLeft(L.id).length === 0;
      });
      
      case 'twinFeed':     return S.machines().some(function (n) {
        const t = S.type(n);
        if (!t.autoCollect || !t.ports.in) return false;
        const grades = [];
        for (const p of S.portsOf(n, 'in')) {
          if (C.resources[p.res].flow !== 'material') continue;
          const l = S.linkInto(n.id, p.id);
          const src = l && S.node(l.from);
          if (!src) continue;
          const op = S.portsOf(src, 'out').find(x => x.id === l.fromPort);
          if (op) grades.push(op.res);
        }
        return grades.length >= 2 && grades.every(x => x === grades[0]);
      });
    }
    return false;
  };

  

  


  Sim.roadFrac = function (o) {
    const g = S.g, f = v => Math.max(0, Math.min(1, v / o.goal));
    const best = fn => { let b = 0; S.machines().forEach(n => { const v = fn(n, S.type(n)); if (v > b) b = v; }); return b; };
    const share = (list, ok) => list.length ? list.filter(ok).length / list.length : 0;
    switch (o.id) {
      case 'rareFind':     return f(g.rareDug || 0);
      case 'longHaul':     return f(g.bigMove || 0);
      case 'tripleStack':  return f(C.boosts.filter(b => !b.instant && Sim.boostActive(b.id)).length);
      
      case 'greatArray':   return f(best((n, t) => t.recipe && t.recipe.power ?
                             (n.made || 0) * Sim.statNoBoost(t.recipe.power, 'energyRate') : 0));
      case 'grassroots':   return f(best((n, t) => t.recruit ?
                             (n.recruits || 0) * Sim.statNoBoost('player', 'wfRate') : 0));
      case 'strongVolunteer': return f(best((n, t) => t.id === 'player' ?
                             Sim.statNoBoost('player', 'wfRate') * Sim.powerMul(n) : 0));
      case 'diamondMine':  return f(g.gemsMade || 0);
      case 'goldRush':     return f((g.convKg || {}).gold || 0);
      case 'reactorRow':   return f(S.machines().filter(n => Sim.reactorOn(n)).length);
      case 'missionControl': return f(g.launches || 0);
      case 'printingPress': return f(Object.values(g.printed || {}).reduce((a, v) => a + v, 0));
      case 'glassCity':    return f(best((n, t) => t.id === 'biodome' ? (n.made || 0) : 0));
      case 'cleanTide':    return f(g.waterBack || 0);
      
      case 'crewRiver':    return f(best((n, t) => t.merge && t.mergeFlow === 'rate' ?
                             (n.raw['out:out'] || 0) : 0));
      


      case 'powerRiver':   return f(best((n, t) => {
        if (!t.store || t.strikeCharge) return 0;
        const inflow = Object.values(n.rateIn || {}).reduce((a, v) => a + (v || 0), 0);
        return Math.min(n.outRate || 0, inflow);
      }));
      case 'millionCI':    return f(g.totalCI || 0);
      case 'weatherStation': return share(Sim.wxLocs(), loc => S.machines().some(n =>
                             (n.loc || C.locations[0].id) === loc && S.type(n).predict && (n.bank || 0) >= Sim.capOf(n) - U.EPS));
      case 'fullCapacity': return share(Sim.cappedTypes().filter(k => !Sim.demoNode(k)),
                             k => Sim.capLevel(k) >= 1);
      case 'moneyMaster':  return share(C.skills.filter(sk => sk.tree === 'money' && !Sim.demoLocked(sk.id)),
                             sk => S.skillLevel(sk.id) >= Sim.maxLevel(sk));
      case 'allBoosts':    { const bs = C.boosts.filter(b => !b.instant);
                             return share(bs, b => Sim.boostActive(b.id)); }
      case 'worldReborn':  return share(C.locations, L => Sim.reviveStage(L.id) >= Sim.reviveStages());
      
      case 'nothingAnywhere': return share(C.locations, L => S.locOpen(L) &&
                             S.sitesIn(L.id).some(s => s.type === 'trashSite') &&
                             !S.sitesIn(L.id).some(s => s.type === 'trashSite' && s.reserve > U.EPS));
      
      case 'allTrials':    return share(C.objectives.filter(x => x.id !== o.id && !Sim.goalHidden(x) &&
                             x.reward >= C.goals.hardAt),
                             x => Sim.goalPaid(x) || !!(g.goalsHit && g.goalsHit[x.id]));
    }
    return 0;
  };

  
  Sim.bestGrow = function (type) {
    let best = 0;
    S.sites().forEach(s => { if (s.type === type) best = Math.max(best, Sim.growFrac(s)); });
    return best;
  };
  
  Sim.everyPlace = function (test) {
    const L = C.locations;
    if (!L.length) return 0;
    const hit = L.filter(l => S.machines().some(n =>
      (n.loc || L[0].id) === l.id && test(n))).length;
    return hit / L.length;
  };
  
  Sim.printKinds = function () {
    const out = [];
    Object.values(C.nodeTypes).forEach(t => {
      if (!t.print || !t.print.boosts) return;
      Object.values(t.print.boosts).forEach(b => { if (out.indexOf(b.boost) < 0) out.push(b.boost); });
    });
    return out;
  };
  Sim.printedKinds = function () {
    return Sim.printKinds().filter(k => Sim.printCount(k) > 0).length;
  };

  


  






  





  Sim.leadShare = function () {
    const A = C.asteroid || {};
    return Math.max(0, Math.min(0.9, (A.mix && A.mix.lead || 0) + Sim.bonus('asteroid.mix.lead')));
  };

  








  




  

  Sim.rockVariants = function (loc) {
    const e = loc ? Sim.rockPlace(loc) : null;
    
    if (e && e.after && S.g.objectives && S.g.objectives[e.after.goal]) return e.after.variants || [];
    if (e && Array.isArray(e.variants)) return e.variants;
    return (C.asteroid || {}).variants || [];
  };
  Sim.rockVariant = function (loc) {
    const list = Sim.rockVariants(loc);
    let r = Math.random();
    for (const v of list) {
      
      const c = (v.chance || 0) + (v.id === 'rare' && v.chance > 0 ? Sim.bonus('asteroid.rarePct') / 100 : 0);
      if (r < c) return v;
      r -= c;
    }
    return null;                                   
  };
  
  Sim.rockMax = function () {
    return ((C.asteroid || {}).maxDown || 3) + Math.round(Sim.bonus('asteroid.maxDown'));
  };
  Sim.rockVariantById = function (id) {
    const all = ((C.asteroid || {}).variants || []).slice();
    Sim.rockLocs().forEach(e => (e.variants || []).concat((e.after && e.after.variants) || [])
      .forEach(v => all.push(v)));
    return all.find(v => v.id === id) || null;
  };

  






  Sim.rockMix = function (variant) {
    const A = C.asteroid || {};
    const v = variant || {};
    const base = v.mix || A.mix || {};
    const sp = v.spread || (variant ? {} : A.spread) || {};
    const fill = v.fill || 'steel';
    const jit = k => ((Math.random() * 2 - 1) * (sp[k] || 0));

    const mix = {};
    let sum = 0;
    Object.keys(base).forEach(function (k) {
      if (k === fill) return;                      
      const useSkill = (k === 'lead') && (variant ? v.leadSkill === true : true);
      const want = useSkill ? Sim.leadShare() : (base[k] || 0);
      const val = Math.max(0.01, want + jit(k));
      mix[k] = val;
      sum += val;
    });
    if (sum > 0.95) { const k = 0.95 / sum; Object.keys(mix).forEach(r => mix[r] *= k); sum = 0.95; }
    mix[fill] = Math.max(0, 1 - sum);
    return mix;
  };

  
  Sim.mixOf = function (site) {
    return (site && site.mix) || Sim.rockMix();
  };

  Sim.rockLocs = function () { return ((C.asteroid || {}).locs) || []; };
  Sim.rockPlace = function (loc) { return Sim.rockLocs().find(e => e.loc === loc) || null; };
  



  Sim.rockIntroPending = function (loc) {
    const I = (C.asteroid || {}).intro;
    if (!I || !I.enabled || !I.locs || !I.locs[loc]) return false;
    return !(S.g.rockIntroDone && S.g.rockIntroDone[loc]);
  };
  
  Sim.rockOpen = function (loc) {
    return !!(S.g.locSpawned && S.g.locSpawned[loc]) && !Sim.rockIntroPending(loc);
  };
  








  Sim.variantHeld = function (id) {
    const A = C.asteroid || {}, I = A.intro;
    if (!id || !I || !I.enabled || !A.rareHold || !I.locs) return false;
    return Object.keys(I.locs).some(function (l) {
      return I.locs[l].variant === id && Sim.rockIntroPending(l);
    });
  };
  

  Sim.rockView = function (loc) {
    if (loc !== S.g.loc || !GG.render || !GG.render.viewWorld) return null;
    const v = GG.render.viewWorld();
    if (!v) return null;
    







    const I = ((C.asteroid || {}).intro || {}).viewInset || {};
    const w = v.x1 - v.x0, h = v.y1 - v.y0;
    return [{ x0: v.x0 + w * (I.x || 0), x1: v.x1 - w * (I.x || 0),
              y0: v.y0 + h * (I.top || 0), y1: v.y1 - h * (I.bottom || 0) }, v];
  };
  


  let hereLoc = null, hereFor = 0;   
  Sim.rockIntroTick = function (dt) {
    const I = (C.asteroid || {}).intro, g = S.g;
    if (!I || !I.enabled || !I.locs || Sim.catchingUp) return;
    const loc = g.loc, e = I.locs[loc];
    




    if (loc !== hereLoc) { hereLoc = loc; hereFor = 0; }
    hereFor += dt;
    if (!e || !Sim.rockIntroPending(loc)) return;
    if (!g.locSpawned || !g.locSpawned[loc] || !Sim.rockPlace(loc)) return;
    g.rockIntro = g.rockIntro || {};
    g.rockIntro[loc] = (g.rockIntro[loc] || 0) + dt;
    if (g.rockIntro[loc] < (e.afterSec || 0)) return;
    if (hereFor < (I.minStaySec || 0)) return;
    Sim.rockDrop(loc, { variant: e.variant || null, prefer: Sim.rockView(loc), intro: true });
  };
  

  Sim.rocksDown = function (loc) {
    return S.sites().filter(n => n.type === 'meteorite' && (!loc || n.loc === loc) &&
                                 (n.reserve || 0) > U.EPS).length;
  };

  















  



  


  Sim.rockSpot = function (loc, prefer, within) {
    const A = C.asteroid || {}, sp = A.spawn || {};
    const pad = sp.edgePad || 0, tries = sp.tries || 40;
    const t = C.nodeTypes.meteorite;
    const rw = (t.w || 260) / 2, rh = S.siteHeight(t, t.slots || 1) / 2;

    const boxes = [];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    


    S.sitesIn(loc).forEach(function (n) {
      const b = S.siteBox(n);
      boxes.push({ x0: n.x - b.w / 2, x1: n.x + b.w / 2, y0: n.y - b.h / 2, y1: n.y + b.h / 2 });
      x0 = Math.min(x0, n.x - b.w / 2); x1 = Math.max(x1, n.x + b.w / 2);
      y0 = Math.min(y0, n.y - b.h / 2); y1 = Math.max(y1, n.y + b.h / 2);
    });
    





    const free = !!within && sp.beaconNeedsGround === false;
    if (!boxes.length && !free) return null;        

    const machines = S.machines().filter(n => n.loc === loc).map(function (n) {
      const z = S.sizeOf(n);
      return { x0: n.x - z.w / 2, x1: n.x + z.w / 2, y0: n.y - z.h / 2, y1: n.y + z.h / 2 };
    });
    






    const wide = sp.wide !== false && sp.reach !== undefined;
    if (wide) {
      machines.forEach(function (b) {
        x0 = Math.min(x0, b.x0); x1 = Math.max(x1, b.x1);
        y0 = Math.min(y0, b.y0); y1 = Math.max(y1, b.y1);
      });
    }

    const clear = (x, y, gap, list) => list.every(b =>
      x + rw < b.x0 - gap || x - rw > b.x1 + gap ||
      y + rh < b.y0 - gap || y - rh > b.y1 + gap);

    const lo = wide
      ? { x: x0 - sp.reach + rw, x2: x1 + sp.reach - rw, y: y0 - sp.reach + rh, y2: y1 + sp.reach - rh }
      : { x: x0 + pad, x2: x1 - pad, y: y0 + pad, y2: y1 - pad };
    if (!free && (lo.x2 <= lo.x || lo.y2 <= lo.y)) return null;

    if (within) {
      const c = within;
      const v = (wide || !boxes.length)
        ? { x: c.x - c.r + rw, x2: c.x + c.r - rw, y: c.y - c.r + rh, y2: c.y + c.r - rh }
        : { x: Math.max(lo.x, c.x - c.r + rw), x2: Math.min(lo.x2, c.x + c.r - rw),
            y: Math.max(lo.y, c.y - c.r + rh), y2: Math.min(lo.y2, c.y + c.r - rh) };
      if (v.x2 <= v.x || v.y2 <= v.y) return null;
      
      const inside = (x, y) => [[-rw, -rh], [rw, -rh], [-rw, rh], [rw, rh]].every(q =>
        (x + q[0] - c.x) * (x + q[0] - c.x) + (y + q[1] - c.y) * (y + q[1] - c.y) <= c.r * c.r);
      for (const mg of [sp.machineGap || 0, (sp.machineGap || 0) / 2, 0]) {
        for (let i = 0; i < tries * 2; i++) {
          const x = v.x + Math.random() * (v.x2 - v.x);
          const y = v.y + Math.random() * (v.y2 - v.y);
          if (!inside(x, y)) continue;
          if (!clear(x, y, sp.siteGap || 0, boxes)) continue;
          if (!clear(x, y, mg, machines)) continue;
          return { x: Math.round(x), y: Math.round(y) };
        }
      }
      return null;
    }

    


    for (const pref of (Array.isArray(prefer) ? prefer : prefer ? [prefer] : [])) {
      const v = { x: Math.max(lo.x, pref.x0 + rw), x2: Math.min(lo.x2, pref.x1 - rw),
                  y: Math.max(lo.y, pref.y0 + rh), y2: Math.min(lo.y2, pref.y1 - rh) };
      if (v.x2 <= v.x || v.y2 <= v.y) continue;
      for (const mg of [sp.machineGap || 0, (sp.machineGap || 0) / 2, 0]) {
        for (let i = 0; i < tries; i++) {
          const x = v.x + Math.random() * (v.x2 - v.x);
          const y = v.y + Math.random() * (v.y2 - v.y);
          if (!clear(x, y, sp.siteGap || 0, boxes)) continue;
          if (!clear(x, y, mg, machines)) continue;
          return { x: Math.round(x), y: Math.round(y) };
        }
      }
    }

    for (const mg of [sp.machineGap || 0, (sp.machineGap || 0) / 2, 0]) {
      for (let i = 0; i < tries; i++) {
        const x = lo.x + Math.random() * (lo.x2 - lo.x);
        const y = lo.y + Math.random() * (lo.y2 - lo.y);
        if (!clear(x, y, sp.siteGap || 0, boxes)) continue;
        if (mg > 0 && !clear(x, y, mg, machines)) continue;
        if (mg === 0 && !clear(x, y, 0, machines)) continue;   
        return { x: Math.round(x), y: Math.round(y) };
      }
    }
    return null;
  };

  
  Sim.rockSpotClear = function (loc, at) {
    const t = C.nodeTypes.meteorite, sp = (C.asteroid || {}).spawn || {};
    const rw = (t.w || 260) / 2, rh = S.siteHeight(t, t.slots || 1) / 2;
    const hits = (b, gap) => !(at.x + rw < b.x0 - gap || at.x - rw > b.x1 + gap ||
                               at.y + rh < b.y0 - gap || at.y - rh > b.y1 + gap);
    const box = (n, z) => ({ x0: n.x - z.w / 2, x1: n.x + z.w / 2, y0: n.y - z.h / 2, y1: n.y + z.h / 2 });
    return !S.sitesIn(loc).some(n => hits(box(n, S.siteBox(n)), sp.siteGap || 0)) &&
           !S.machines().some(n => n.loc === loc && hits(box(n, S.sizeOf(n)), 0));
  };

  



  Sim.rockDrop = function (loc, opts) {
    opts = opts || {};
    const A = C.asteroid || {};
    if (!A.enabled) return null;
    const e = Sim.rockPlace(loc);
    if (!e) return null;
    if (Sim.rocksDown(loc) >= Sim.rockMax()) return null;
    if (!S.g.locSpawned || !S.g.locSpawned[loc]) return null;    
    

    let at = opts.at && Sim.rockSpotClear(loc, opts.at) ? opts.at : null;
    for (let k = 0; !at && k < (opts.within ? 5 : 1); k++) at = Sim.rockSpot(loc, opts.prefer, opts.within);
    if (!at) return null;
    



    if (opts.variant === undefined) {
      const rolled = Sim.rockVariant(loc);
      opts.variant = (rolled && Sim.variantHeld(rolled.id)) ? null : rolled;
    }
    




    const vr = opts.variant !== undefined
      ? (typeof opts.variant === 'string' ? Sim.rockVariantById(opts.variant) : opts.variant)
      : Sim.rockVariant(loc);
    const site = S.addSite('meteorite', at.x, at.y, loc,
                           { reserve: opts.kg || (((vr && vr.kg) || e.kg || C.nodeTypes.meteorite.reserve) +
                                                  Sim.bonus('asteroid.kg')),        
                             rare: vr ? vr.id : undefined,
                             mix: opts.mix || Sim.rockMix(vr) });
    if (!site) return null;
    

    S.g.rocksSeen = (S.g.rocksSeen || 0) + 1;
    

    if (S.g.rockFirstAt === undefined) S.g.rockFirstAt = S.g.playtime || 0;
    if (site.rare === 'rare' && S.g.rareFirstAt === undefined) S.g.rareFirstAt = S.g.playtime || 0;
    if (site.rare === 'pluto') S.g.plutoSeen = true;      
    (S.g.rockIntroDone = S.g.rockIntroDone || {})[loc] = true;
    Sim.invalidate();
    



    Sim.events.push({ kind: 'rock', loc: loc, site: site, pluto: site.rare === 'pluto', pulled: !!opts.pulled,
                      name: (S.locationById(loc) || {}).name });
    return site;
  };

  


  Sim.beaconCost = function (t) { return Sim.stat(t.id, 'pullCost'); };
  

  Sim.beaconLocal = function () { return !!(C.ui || {}).beaconLocal; };
  Sim.beaconRange = function (t) { return Sim.stat(t.id, 'range') || 0; };
  






  const bcCache = {};
  Sim.beaconCheck = function (n, fresh) {
    const t = S.type(n), A = C.asteroid || {}, g = S.g;
    const max = Sim.rockMax(), loc = n.loc || C.locations[0].id;
    const no = (level, word, why) => ({ ok: false, level: level, word: word, why: why });
    if (!A.enabled || !Sim.rockPlace(loc) || !(g.locSpawned && g.locSpawned[loc]))
      return no('stop', 'NO ROCKS', 'Meteorites never fall here');
    if (!Sim.rockOpen(loc))
      return no('slow', 'NOT YET', 'This place is waiting for its first meteorite');
    if (Sim.rocksDown(loc) >= max)
      return no('slow', 'SKY FULL', 'The sky here is already full');
    if ((g.rockPull || 0) > 0)
      return no('slow', 'ON ITS WAY', 'One is already on its way');
    const now = g.playtime || 0, key = n.id + '@' + n.x + ',' + n.y + '@' + Sim.rocksDown(loc);
    let room = null;
    const hit = bcCache[n.id];
    if (!fresh && hit && hit.key === key && now - hit.at < 1) room = hit.room;
    else {
      

      const within = { x: n.x, y: n.y, r: Sim.beaconRange(t) };
      for (let k = 0; !room && k < 5; k++) room = Sim.rockSpot(loc, null, within);
      bcCache[n.id] = { key: key, at: now, room: room };
    }
    if (!room) return no('stop', 'NO ROOM', 'No room for a meteorite in range');
    if ((n.bank || 0) < Sim.beaconCost(t) - U.EPS)
      return (n.rateIn && n.rateIn.kw > 1e-6)
        ? no('slow', 'CHARGING', 'Not charged yet')
        : no('stop', 'NO POWER', 'Waiting on energy');
    return { ok: true, loc: loc, at: room };
  };
  Sim.beaconBlocked = function (n) {
    if (Sim.beaconLocal() && n) {
      const c = Sim.beaconCheck(n);
      return c.ok || c.word === 'CHARGING' ? false : c.word;
    }
    const max = Sim.rockMax();
    const locs = Sim.rockLocs().map(e => e.loc).filter(Sim.rockOpen);   
    return !locs.length || locs.every(l => Sim.rocksDown(l) >= max) || (S.g.rockPull || 0) > 0;
  };
  Sim.beaconPull = function (n) {
    const t = S.type(n);
    if (!t || !t.pullCost) return { ok: false, why: 'Nothing to pull' };
    const cost = Sim.beaconCost(t);
    if (Sim.beaconLocal()) {
      
      const c = Sim.beaconCheck(n, true);
      if (!c.ok) return { ok: false, why: c.why };
      n.bank = (n.bank || 0) - cost;
      S.g.rockPull = (C.asteroid || {}).pullSec || 4;
      S.g.rockPullLoc = c.loc;
      S.g.rockPullWithin = { x: n.x, y: n.y, r: Sim.beaconRange(t) };
      S.g.rockPullAt = c.at || null;          
      S.g.rockPullBy = n.id;
      S.g.rockPullCost = cost;
      return { ok: true, cost: cost };
    }
    if ((n.bank || 0) < cost - U.EPS) return { ok: false, why: 'Not charged yet' };
    


    const locs = Sim.rockLocs().map(e => e.loc).filter(Sim.rockOpen);   
    if (!locs.length) return { ok: false, why: 'Nowhere for one to fall' };
    if (locs.every(l => Sim.rocksDown(l) >= Sim.rockMax()))
      return { ok: false, why: 'The sky is already full' };
    

    if ((S.g.rockPull || 0) > 0) return { ok: false, why: 'One is already on its way' };
    const loc = locs.filter(l => Sim.rocksDown(l) < Sim.rockMax());
    n.bank = (n.bank || 0) - cost;
    S.g.rockPull = (C.asteroid || {}).pullSec || 4;
    S.g.rockPullLoc = loc[Math.floor(Math.random() * loc.length)];
    return { ok: true, cost: cost };
  };

  Sim.markDig = function (n, site, kg) {
    if (!site) return;
    const loc = site.loc || C.locations[0].id;
    const g = S.g;
    g.digBy = g.digBy || {};
    (g.digBy[loc] = g.digBy[loc] || {})[n.type] = 1;
    
    if (kg > 0) { g.dugKg = g.dugKg || {}; g.dugKg[n.type] = (g.dugKg[n.type] || 0) + kg; }
  };
  


  Sim.dugKg = function (type) {
    const g = S.g, own = (g.dugKg && g.dugKg[type]) || 0;
    return type === 'droneCleaner' ? Math.max(own, g.powerKg || 0) : own;
  };
  Sim.dugProgress = function (o) {
    const k = o.kinds || [];
    if (!k.length) return 0;
    return k.reduce((a, t) => a + Math.min(1, Sim.dugKg(t) / o.goal), 0) / k.length;
  };

  





  Sim.energyOrigins = function (n, seen, out) {
    seen = seen || {}; out = out || {};
    if (seen[n.id]) return out;
    seen[n.id] = 1;
    for (const l of S.linksInto(n.id)) {
      const port = S.portsOf(n, 'in').find(p => p.id === l.toPort);
      if (!port || C.resources[port.res].flow !== 'rate' || port.res !== 'energy') continue;
      const src = S.node(l.from);
      if (!src) continue;
      const t = S.type(src);
      if (t.store) { out.battery = 1; continue; }        
      if (t.passesEnergy) { Sim.energyOrigins(src, seen, out); continue; }
      out[src.type] = 1;
    }
    return out;
  };

  

  Sim.splitterChain = function () {
    const isSplit = n => { const t = S.type(n); return !!(t.splitter && t.passesEnergy); };
    const depth = {};
    function walk(n, seen) {
      if (depth[n.id] !== undefined) return depth[n.id];
      if (seen[n.id]) return 0;
      seen[n.id] = 1;
      let d = 1;
      for (const l of S.linksInto(n.id)) {
        const src = S.node(l.from);
        if (src && isSplit(src)) d = Math.max(d, walk(src, seen) + 1);
      }
      depth[n.id] = d;
      return d;
    }
    let best = 0;
    S.machines().filter(isSplit).forEach(n => { best = Math.max(best, walk(n, {})); });
    return best;
  };

  
  Sim.wxSeenCount = function () { return Object.keys(S.g.wxSeen || {}).length; };
  



  Sim.wxGoalCount = function () {
    const rec = (C.weather && C.weather.watchToCount) ? S.g.wxWatched : S.g.wxSeen;
    return Object.keys(rec || {}).length;
  };

  


  Sim.sitesLeft = function (locId) {
    return S.sitesIn(locId).filter(s => S.type(s).deplete && s.reserve > U.EPS);
  };

  

  Sim.yardBare = function () {
    return (S.g.sitesDrained || 0) > 0 && Sim.sitesLeft(C.locations[0].id).length === 0;
  };

  










  Sim.worldBare = function () {
    if (!((S.g.sitesDrained || 0) > 0)) return false;
    for (const L of (C.locations || [])) {
      if (Sim.demoLoc && Sim.demoLoc(L.id)) continue;   
      if (!S.locOpen(L)) return false;                  
      if (Sim.sitesLeft(L.id).length > 0) return false; 
    }
    return true;
  };

  


  Sim.planRescue = function () {
    return !!(C.planRescue && C.planRescue.enabled) &&
           Sim.storyOn() && !Sim.storyOver() && Sim.worldBare();
  };

  






















  Sim.placesBelowDone = function (sk) {
    const locs = C.locations || [];
    const idx = locs.findIndex(L => L.requires === sk.id);
    if (idx <= 0) return false;                  
    const done = (C.autoOpen && C.autoOpen.doneAt) || 0.999;
    for (let i = 0; i < idx; i++) {
      const L = locs[i];
      if (Sim.demoLoc && Sim.demoLoc(L.id)) continue;   
      if (!S.locOpen(L)) return false;                  
      if (Sim.placeWorked(L.id) < done) return false;   
    }
    return true;
  };

  



  Sim.altUnlocked = function (sk) {
    if (sk.altUnlock === 'yardBare') return Sim.yardBare();
    if (sk.altUnlock === 'placesBelowDone') return Sim.placesBelowDone(sk);
    return false;
  };

  



  Sim.altRescue = function (sk) {
    const A = C.autoOpen;
    return !!(A && A.enabled) && Sim.altUnlocked(sk);
  };

  

  let altList = null;
  function altSkills() {
    if (!altList) altList = C.skills.filter(sk => !!sk.altUnlock);
    return altList;
  }

  









  Sim.autoOpenAlt = function () {
    const A = C.autoOpen;
    if (!A || !A.enabled) return;
    for (const sk of altSkills()) {
      if (S.hasSkill(sk.id)) continue;
      if (Sim.demoLocked(sk)) continue;         
      if (!Sim.altRescue(sk)) continue;
      S.g.skills[sk.id] = 1;
      Sim.invalidate();
      S.ensureLocations();
      


      const L = (C.locations || []).find(x => x.requires === sk.id);
      if (A.announce) Sim.events.push({ kind: 'placeOpened', name: (L && L.name) || sk.name });
    }
  };

  

  Sim.fullPostsOnJunction = function () {
    let best = 0;
    S.machines().forEach(function (n) {
      const t = S.type(n);
      if (!t.merge || t.mergeFlow !== 'rate') return;
      let full = 0;
      S.linksInto(n.id).forEach(function (l) {
        const src = S.node(l.from);
        if (!src) return;
        const st = S.type(src);
        if (st.hire && Sim.crewOf(src) >= Sim.hireMax(src)) full++;
      });
      best = Math.max(best, full);
    });
    return best;
  };
  Sim.goalPaid = function (o) { return !!(S.g.objectives && S.g.objectives[o.id]); };
  

  Sim.goalReady = function (o) { return !!(S.g.goalsHit && S.g.goalsHit[o.id]) && !Sim.goalPaid(o); };

  Sim.claimGoal = function (id) {
    const o = C.objectives.find(x => x.id === id);
    if (!o) return { ok: false, why: 'Unknown objective' };
    if (Sim.goalPaid(o)) return { ok: false, why: 'Already claimed' };
    if (S.g && S.g.practice) return { ok: false, why: 'Nothing here reaches your run' };   
    if (!Sim.goalReady(o)) return { ok: false, why: 'Not done yet' };
    S.g.objectives[o.id] = true;
    S.earn('diamond', o.reward);
    S.g.totalDiamonds += o.reward;
    return { ok: true, name: o.name, reward: o.reward };
  };

  
  Sim.goalProgress = function (o) {
    if (Sim.goalPaid(o) || (S.g.goalsHit && S.g.goalsHit[o.id])) return 1;
    const g = S.g;
    if (o.id === 'firstSweep')  return Math.min(1, (g.totalClicks || 0) / o.goal);
    if (o.id === 'fiveSuns')    return Math.min(1, Sim.fiveSunsBest() / o.goal);
    if (o.id === 'robotWaste')  return Math.min(1, (g.robotWasteKg || 0) / o.goal);
    if (o.id === 'bankFull')    return Math.min(1, Sim.bankFill());
    if (o.id === 'bankGold')    return Math.min(1, Sim.bankGold() / o.goal);
    if (o.id === 'warehouse')   return Sim.warehouseFrac(o);
    if (o.id === 'fleetStorm') {
      const f = g.stormFleet, w = f && Sim.wxIn(f.loc);
      const st = f && Sim.wxState(f.loc);
      return (f && w && w.id === 'storm' && st.evt === f.evt) ? Math.min(1, f.ids.length / o.goal) : 0;
    }
    if (o.id === 'handHundred') return Math.min(1, (g.handKg || 0) / o.goal);
    if (o.id === 'powerKg')     return Math.min(1, (g.powerKg || 0) / o.goal);
    if (o.id === 'oneCleaner' && o.kinds) return Sim.dugProgress(o);
    if (o.id === 'fullCrew') {
      let best = 0;
      S.machines().forEach(n => { if (S.type(n).hire) best = Math.max(best, Sim.crewOf(n)); });
      return Math.min(1, best / o.goal);
    }
    if (o.id === 'bigCrew') {
      let best = 0;
      S.machines().forEach(function (n) {
        const t = S.type(n);
        if (t.merge && t.mergeFlow === 'rate') best = Math.max(best, S.linksInto(n.id).length);
      });
      return Math.min(1, best / o.goal);
    }
    if (o.id === 'threeSources') return Math.min(1, Sim.bestGridMix() / o.goal);
    if (o.id === 'kiloCI')       return Math.min(1, (g.totalCI || 0) / o.goal);
    if (o.id === 'kiloMoney')    return Math.min(1, (g.totalMoney || 0) / o.goal);
    if (o.id === 'firstCells')   return Math.min(1, (g.cellsMade || 0) / o.goal);
    if (o.id === 'bothTimber')   return Math.min(1, Object.keys(g.woodWays || {}).length / o.goal);
    if (o.id === 'charredWood')  return Math.min(1, (g.woodCharred || 0) / o.goal);
    if (o.id === 'splitChain')   return Math.min(1, Sim.splitterChain() / o.goal);
    if (o.id === 'fullVault') {
      let best = 0;
      S.machines().forEach(n => {
        if (S.type(n).store) best = Math.max(best, S.linksInto(n.id).length);
      });
      return Math.min(1, best / o.goal);
    }
    if (o.id === 'bigArray') {
      let best = 0;
      S.machines().forEach(function (n) {
        const r = S.type(n).recipe;
        if (r && r.power) best = Math.max(best, Sim.forgeOutput(n));
      });
      return Math.min(1, best / o.goal);
    }
    if (o.id === 'bigOutreach') {
      let best = 0;
      S.machines().forEach(n => {
        if (S.type(n).recruit) best = Math.max(best, Sim.recruitOutput(n));
      });
      return Math.min(1, best / o.goal);
    }
    if (o.id === 'fullGrove') {
      let best = 0;
      S.sites().forEach(s => { if (s.type === 'treeSite') best = Math.max(best, Sim.growFrac(s)); });
      return best;
    }
    if (o.id === 'allWeather')   return Math.min(1, Sim.wxGoalCount() / C.weather.events.length);
    
    if (o.id === 'clearPool' || o.id === 'spillMopped') return Math.min(1, Sim.bestGrow(o.site));
    if (o.id === 'clearSkies')   return Sim.everyPlace(n => n.type === 'airCleaner' && (n.raw['v:0'] || 0) > 0);
    if (o.id === 'domeEverywhere') return Sim.everyPlace(n => n.type === 'biodome' && (n.made || 0) >= 1);
    if (Sim.roadFrac(o) > 0) return Sim.roadFrac(o);            
    if (o.id === 'fullCatalogue') return Math.min(1, Sim.printedKinds() / Math.max(1, Sim.printKinds().length));
    
    if (o.id === 'allPowered') {
      const m = C.goals.poweredMul;
      return Math.min(1, (Math.min(o.goal, Sim.poweredNow('player', m)) +
                          Math.min(o.goal, Sim.poweredNow('windTurbine', m))) / (o.goal * 2));
    }
    
    
    if (o.id === 'yardBare') {
      const total = C.locations[0].sites.length;
      return total ? Math.min(1, (total - Sim.sitesLeft(C.locations[0].id).length) / total) : 0;
    }
    if (o.id === 'spendGems')    return Math.min(1, (g.diamondSpent || 0) / o.goal);
    if (o.id === 'hiredFive')    return Math.min(1, Sim.fullPostsOnJunction() / o.goal);
    
    
    if (o.id === 'drainSite') {
      if ((g.sitesDrained || 0) > 0) return 1;
      let best = 0;
      S.sites().forEach(function (s) {
        if (!s.full) return;
        best = Math.max(best, (s.full - s.reserve) / s.full);
      });
      return Math.min(1, best);
    }
    if (o.id === 'halfSite') {
      if ((g.sitesDrained || 0) > 0) return 1;
      let best = 0;
      S.sites().forEach(function (s) {
        if (!s.full) return;
        best = Math.max(best, (s.full - s.reserve) / (s.full * (1 - o.goal)));
      });
      return Math.min(1, best);
    }
    return 0;
  };

  








  Sim.poweredNow = function (typeId, mul) {
    const want = mul || 1 + U.EPS;
    return S.machines().filter(n => n.type === typeId &&
                                    Sim.powerMul(n) >= want - U.EPS).length;
  };

  
  Sim.bestGridMix = function () {
    let best = 0;
    S.machines().forEach(function (n) {
      if (!S.type(n).store) return;
      const kinds = {};
      S.linksInto(n.id).forEach(function (l) {
        const src = S.node(l.from);
        
        if (src && !C.driveIns(C.nodeTypes[src.type]).length &&
            C.nodeTypes[src.type].energyRate) kinds[src.type] = 1;
      });
      best = Math.max(best, Object.keys(kinds).length);
    });
    return best;
  };

  
  Sim.events = [];

  








  



  let storyFlat = null, storyFull = null;
  Sim.storySteps = function () {
    const full = !(Sim.demoOn && Sim.demoOn());
    if (storyFlat && storyFull === full) return storyFlat;
    storyFlat = []; storyFull = full;
    const st = C.story;
    if (!st || !st.enabled) return storyFlat;
    (st.acts || []).filter(a => full || a.demo !== false).forEach(function (a, ai) {
      (a.steps || []).forEach(function (s, si) {
        storyFlat.push({ s: s, act: a, ai: ai, si: si, last: si === a.steps.length - 1 });
      });
    });
    return storyFlat;
  };
  Sim.storyOn = function () { return !!(C.story && C.story.enabled) && Sim.storySteps().length > 0; };
  Sim.storyAt = function () { return Math.min(S.g.storyAt || 0, Sim.storySteps().length); };
  Sim.storyOver = function () { return Sim.storyAt() >= Sim.storySteps().length; };
  

  Sim.cycle = function () { return (S.g && S.g.cycle) || 0; };
  Sim.fullCircleOpen = function () {
    const F = C.fullCircle || {};
    if (!F.enabled || Sim.demoOn() || S.practice) return false;
    if (!Sim.storyOn() || !Sim.storyOver()) return false;
    return Sim.cycle() < (F.maxUses === undefined ? 1 : F.maxUses);
  };
  Sim.storyNow = function () {
    const l = Sim.storySteps();
    return Sim.storyOver() ? null : l[Sim.storyAt()];
  };
  

  Sim.storyWhy = function (s) {
    return (s.whyFull && !(Sim.demoOn && Sim.demoOn())) ? s.whyFull : s.why;
  };

  




  function storyRouter(t) {
    return !!(t && (t.merge || t.passesMaterial || t.passesEnergy || t.passesWf ||
                    t.store || t.lanes));
  }
  function storyWalk(n, dir, port) {
    const out = [], seen = {};
    seen[n.id] = true;
    const step = function (node, first) {
      const links = dir === 'up' ? S.linksInto(node.id) : S.linksFrom(node.id);
      links.forEach(function (l) {
        if (first && port && (dir === 'up' ? l.toPort : l.fromPort) !== port) return;
        const m = S.node(dir === 'up' ? l.from : l.to);
        if (!m || seen[m.id]) return;
        seen[m.id] = true;
        if (storyRouter(S.type(m))) step(m, false); else out.push(m);
      });
    };
    step(n, true);
    return out;
  }
  



  function storyBusy(n) {
    const r = n.rates || {};
    return Object.keys(r).some(k => k !== 'in:kw' && k !== 'in:wf' && (r[k] || 0) > 1e-3);
  }

  


  Sim.storyDone = function (step) {
    const g = S.g;
    if (step.goal) {
      const o = C.objectives.find(x => x.id === step.goal);
      return !!o && (!!(g.goalsHit && g.goalsHit[step.goal]) || Sim.goalDone(o));
    }
    const t = String(step.test || '');
    const arg = t.split(':');
    switch (arg[0]) {
      
      case 'node':  return S.machines().some(n => n.type === arg[1]);
      
      case 'count': return S.machines().filter(n => n.type === arg[1]).length >= (+arg[2] || 1);
      
      case 'chain': return S.machines().some(n => n.type === arg[1] &&
                      S.linksInto(n.id).length > 0 && S.linksFrom(n.id).length > 0);
      
      case 'bothOut': return S.machines().some(function (n) {
        if (n.type !== arg[1]) return false;
        const outs = S.portsOf(n, 'out').map(p => p.id);
        const used = {};
        S.linksFrom(n.id).forEach(l => { used[l.fromPort] = true; });
        return outs.length >= 2 && outs.filter(p => used[p]).length >= 2;
      });
      
      case 'mixedBattery': return S.machines().some(function (n) {
        if (!S.type(n).store) return false;
        const kinds = {};
        S.linksInto(n.id).forEach(function (l) {
          const src = S.node(l.from);
          if (src && C.nodeTypes[src.type] && C.nodeTypes[src.type].energyRate) kinds[src.type] = true;
        });
        return Object.keys(kinds).length >= 2;
      });
      case 'hired':   return S.machines().some(n => S.type(n).hire && Sim.crewOf(n) >= 1);
      case 'recruit': return S.machines().some(n => S.type(n).recruit && (n.recruits || 0) >= 1);
      


      case 'staffed': return S.machines().some(function (n) {
        if (!S.type(n).autoCollect) return false;
        if (Sim.crewOf(n) >= 1) return true;
        return S.portsOf(n, 'in').some(p => p.res === 'wf' && S.linkInto(n.id, p.id));
      });
      


      case 'split21': return S.machines().some(function (n) {
        const ty = S.type(n);
        if (!ty.splitter || !ty.passesEnergy) return false;
        const a = +n.wa || 0, b = +n.wb || 0;
        if (a <= 0 || b <= 0) return false;
        const r = Math.max(a, b) / Math.min(a, b);
        return Math.abs(r - 2) < 1e-6 && (n.rateIn.kw || 0) > 0;
      });
      

      case 'grove50': return S.sites().some(x => x.type === 'treeSite' && Sim.growFrac(x) >= 0.5);
      case 'relocated':   return (g.relocated || 0) >= 1;
      


      case 'moved':       return !!(g.relocMoved && g.relocMoved[arg[1] + '@' + arg[2]]);
      case 'weatherSeen': return Sim.wxSeenCount() >= 1;
      case 'array':       return S.machines().some(function (n) {
        const r = S.type(n).recipe;
        return r && r.power && (n.made || 0) >= 1;
      });

      

      
      case 'working': return S.machines().some(n => n.type === arg[1] &&
                      (!arg[2] || n.loc === arg[2]) && storyBusy(n));
      case 'busy':    return S.machines().some(n => n.type === arg[1] && storyBusy(n));
      
      case 'chainAt': return S.machines().some(n => n.type === arg[1] && n.loc === arg[2] &&
                      S.linksInto(n.id).length > 0 && S.linksFrom(n.id).length > 0);
      
      case 'cellFull': return S.machines().some(n => n.type === arg[1] &&
                       (n.bank || 0) >= Sim.stat(arg[1], 'bank') - 1e-6);
      
      case 'forecast': return Object.keys(g.wxPredicted || {}).length >= 1;
      

      case 'line': {
        const chain = arg[1].split('>');
        const back = function (n, i) {
          if (i < 0) return true;
          return storyWalk(n, 'up').some(m => m.type === chain[i] && back(m, i - 1));
        };
        return S.machines().some(n => n.type === chain[chain.length - 1] && storyBusy(n) &&
                                      back(n, chain.length - 2));
      }
      

      case 'atMax': {
        const maxed = (step.skills || []).every(function (id) {
          const sk = Sim.skillById(id);
          return !!sk && (+S.skillLevel(id) || 0) >= (sk.maxLevel || 1);
        });
        if (!maxed) return false;
        const cap = Sim.stat(arg[1], 'maxKw');
        return S.machines().some(n => n.type === arg[1] && cap > 0 &&
                                      (n.rateIn.kw || 0) >= cap - 1e-6);
      }
      
      case 'fedBy': return S.machines().some(n => n.type === arg[1] && storyBusy(n) &&
                    storyWalk(n, 'up', arg[3]).some(m => m.type === arg[2]));
      
      case 'loaded': return S.machines().some(n => n.type === arg[1] && (n.made || 0) >= 1 &&
                     storyWalk(n, 'up').some(m => m.type === arg[2]));
      
      case 'carriedFull': return !!(g.relocHeld && g.relocHeld[arg[1]]);
      

      case 'fullInto': return S.machines().some(n => n.type === arg[1] && n.grade === arg[2] &&
        Sim.heldOf(n) >= Sim.capOf(n) - 1e-6 && Sim.capOf(n) > 0 &&
        S.linksFrom(n.id).some(l => { const m = S.node(l.to); return m && m.type === arg[3]; }));
      
      case 'outFlow': return S.machines().some(n => n.type === arg[1] &&
        S.linksFrom(n.id).some(l => l.fromPort === arg[2]) &&
        (n.rates['out:' + arg[2]] || 0) > 1e-3);
      
      case 'feedsBoth': return S.machines().some(function (n) {
        if (n.type !== arg[1]) return false;
        const down = storyWalk(n, 'down');
        return [arg[2], arg[3]].every(t => down.some(m => m.type === t && storyBusy(m)));
      });
      
      case 'takingAll': return arg[1].split(',').every(function (pair) {
        const q = pair.split('.');
        return S.machines().some(n => n.type === q[0] && (n.rates['in:' + q[1]] || 0) > 1e-3);
      });
      
      case 'kitMul':   return S.machines().some(n => n.type === arg[1] &&
                       Sim.powerMul(n) >= (+arg[2] || 1) - 1e-6);
      
      case 'kitLoads': return S.machines().some(n => n.type === arg[1] &&
                       (n.made || 0) >= (+arg[2] || 1));
      

      case 'acidSplit': return S.machines().some(function (n) {
        if (n.type !== 'fluidSplitter' || n.grade !== 'acid' || !storyBusy(n)) return false;
        if (!storyWalk(n, 'up').some(m => m.type === 'acidWorks')) return false;
        const side = p => { const l = S.linksFrom(n.id).find(x => x.fromPort === p);
                            const m = l && S.node(l.to); return m ? m.type : null; };
        const ab = [side('a'), side('b')];
        return ab.indexOf('etchingWorks') >= 0 && ab.indexOf('fluidTank') >= 0;
      });
      
      case 'prioDome': return S.machines().some(function (n) {
        if (n.type !== 'biodome' || !((n.rateIn.wf || 0) > 0)) return false;
        return S.linksInto(n.id).some(function (l) {
          const m = S.node(l.from);
          return m && m.type === 'prioCrewSplitter' && l.fromPort === Sim.prioSide(m);
        });
      });
      
      case 'domesCi': return S.machines().reduce((a, n) => a + Sim.domeOutput(n), 0) >
                             (+arg[1] || 0);
      
      case 'rocketMetal': return (g.launches || 0) >= 1 && S.machines().some(n =>
        n.type === 'rocket' && S.linksFrom(n.id).some(l => l.fromPort === 'metal') &&
        (n.rates['out:metal'] || 0) > 1e-3);
      
      case 'printLine': return Object.values(g.printed || {}).reduce((a, v) => a + v, 0) >= 1 &&
        S.machines().some(function (n) {
          if (n.type !== 'printWorks') return false;
          return storyWalk(n, 'up').some(m => m.type === 'paperMill' &&
                 storyWalk(m, 'up').some(b => b.type === 'bladeWorks'));
        });
      case 'totalCI': return (g.totalCI || 0) >= (+arg[1] || 0);
    }
    return false;
  };

  


  function markStory() {
    if (!Sim.storyOn()) return;
    const g = S.g;
    if (!g.storyActs) g.storyActs = {};
    let guard = Sim.storySteps().length + 1;
    


    let rescue = null;
    while (guard-- > 0) {
      const cur = Sim.storyNow();
      if (!cur) break;
      if (!Sim.storyDone(cur.s)) {
        
        if (cur.s.noRescue) break;
        if (rescue === null) rescue = Sim.planRescue();
        if (!rescue) break;
      }
      g.storyAt = Sim.storyAt() + 1;
      Sim.events.push({ kind: 'story', step: cur.s.id, text: cur.s.text, act: cur.act.name });
      if (cur.last && !g.storyActs[cur.act.id]) {
        g.storyActs[cur.act.id] = true;
        const money = cur.act.money || 0, gem = cur.act.gem || 0;
        if (money) { S.earn('money', money); }
        if (gem) { S.earn('diamond', gem); g.totalDiamonds = (g.totalDiamonds || 0) + gem; }
        Sim.events.push({ kind: 'storyAct', name: cur.act.name, money: money, gem: gem,
                          done: Sim.storyOver() });
      }
    }
  }

  

  function markGoals() {
    for (const o of C.objectives) {
      if (Sim.goalHidden(o)) continue;         
      if (S.g.goalsHit[o.id] || Sim.goalPaid(o)) continue;
      if (!Sim.goalDone(o)) continue;
      S.g.goalsHit[o.id] = true;
      Sim.events.push({ kind: 'goal', name: o.name, reward: o.reward });
    }
  }

  





  Sim.reviveOn = function () { return !!(C.revive && C.revive.enabled); };
  Sim.reviveStages = function () { return (C.revive && C.revive.stages) || 5; };

  




  Sim.reviveTotal = function (loc) {
    const L = S.locationById(loc);
    if (!L) return 0;
    let total = 0;
    L.sites.forEach(function (s) {
      const t = C.nodeTypes[s.type];
      if (!t || t.revive === false) return;
      




      const cap = C.siteCapacity(s, S.g), kg = C.siteReserve(s, S.g);
      if (t.grow) {
        if (C.revive.countGrove) {
          
          total += (cap !== undefined ? cap : t.capacity) || 0;
        }
      }
      else total += kg !== undefined ? kg : (t.reserve || 0);
    });
    return total;
  };

  










  Sim.placeWorked = function (loc) {
    loc = loc || S.g.loc;
    const total = Sim.reviveTotal(loc);
    if (total <= 0) return 0;
    


    if (!S.g.locSpawned || !S.g.locSpawned[loc]) return 0;
    let remain = 0;
    S.sitesIn(loc).forEach(function (n) {
      const t = S.type(n);
      







      if (!t || t.revive === false) return;
      if (t.grow) {
        if (C.revive.countGrove) remain += Math.max(0, Sim.growCap(n) - (n.grown || 0));
      } else remain += Math.max(0, n.reserve || 0);
    });
    return Math.max(0, Math.min(1, 1 - remain / total));
  };

  
  Sim.reviveProgress = function (loc) {
    return Sim.reviveOn() ? Sim.placeWorked(loc) : 0;
  };

  


















  Sim.reviveStage = function (loc) {
    if (!Sim.reviveOn()) return 0;
    const st = Sim.reviveStages();
    return Math.max(0, Math.min(st, Math.ceil(Sim.reviveProgress(loc) * st)));
  };

  
  let ciAccum = 0, moneyAccum = 0, realWindow = 0, skillTellAcc = 0;
  



  Sim.noteEarned = function (cur, amount) {
    if (!(amount > 0)) return;
    if (cur === 'money') moneyAccum += amount;
    else if (cur === 'ci') ciAccum += amount;
  };
  


  Sim.noteHand = function (cur, amount) {
    const r = (C.ui && C.ui.rate) || {};
    if (r.countHand) Sim.noteEarned(cur, amount);
  };

  Sim.tick = function (dt) {
    const g = S.g;
    

    Sim.clearLadder();
    const hours = Sim.hoursFor(dt);
    g.playtime += dt;
    g.gameHours = (g.gameHours || 0) + hours;
    Sim.gameHours = g.gameHours;

    let ciMade = 0, moneyMade = 0;

    
    for (const n of g.nodes) {
      n.raw = {}; n.rateIn = {}; n.rbIn = {};
      
      
      let w = 0; for (const k in n.obuf) w += n.obuf[k] || 0;
      n.obufWas = w;
      if (n.pulse > 0) n.pulse = Math.max(0, n.pulse - dt * 3);
    }
    for (const l of g.links) l.flow = 0;

    
    
    
    
    
    
    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.recruit) continue;
      for (const p of S.portsOf(n, 'in')) {
        const l = S.linkInto(n.id, p.id);
        if (!l) continue;
        
        
        const kw = p.id === 'kw';
        const pool = kw ? (n.kwPool || 0) : (n.wfPool || 0);
        l.muted = pool >= Sim.recruitNeed(n, kw ? 'kw' : 'wf') - U.EPS;
      }
    }

    



















    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.recipe || !t.recipe.inputs) continue;
      
      const on = (C.wire || {}).holdFull !== false;
      const done = (t.recipe.boost && Sim.plantMaxed(n)) || Sim.roadMaxed(n);
      const full = {};
      let short = false;
      for (const res in t.recipe.inputs) {
        full[res] = (n.buf[res] || 0) >= Sim.recipeNeed(n, res) - U.EPS;
        if (!full[res]) short = true;
      }
      for (const p of S.portsOf(n, 'in')) {
        if ((C.resources[p.res] || {}).flow !== 'material') continue;
        const l = S.linkInto(n.id, p.id);
        if (!l) continue;
        l.muted = on && (done || (short && !!full[p.res]));
      }
    }

    












    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.powerUp || Sim.powerMaxed(n)) continue;
      const p = t.powerUp;
      const load = Sim.powerLoad(n);
      if ((n.buf[p.res] || 0) < load - U.EPS) continue;
      n.buf[p.res] -= load;
      n.made = (n.made || 0) + 1;
      n.pulse = 1;
      
      
      
      if (!g.poweredUp) g.poweredUp = {};
      g.poweredUp[n.type] = (g.poweredUp[n.type] || 0) + 1;
      Sim.events.push({ kind: 'powerUp', node: n.id, type: n.type });
    }

    
    
    
    

    



















    function emit(node, portId, rate, robot, byDemand) {
      node.raw['out:' + portId] = rate;
      const wires = S.linksFrom(node.id).filter(l => l.fromPort === portId && !l.muted);
      if (!wires.length || rate <= 0) return;
      const even = rate / wires.length;
      let give = null;
      if (byDemand && wires.length > 1 && C.powerPush && C.powerPush.shareByDemand) {
        const want = wires.map(function (l) {
          const d = S.node(l.to);
          return d ? Math.max(0, Sim.energyDemand(d, hours, {})) : 0;
        });
        if (want.reduce(function (a, b) { return a + b; }, 0) > 1e-9) {
          


          give = []; let left = rate;
          for (let i = 0; i < wires.length; i++) {
            const g0 = Math.min(even, want[i]); give.push(g0); left -= g0;
          }
          for (let i = 0; i < wires.length && left > 1e-9; i++) {
            const add = Math.min(left, want[i] - give[i]);
            if (add > 0) { give[i] += add; left -= add; }
          }
        }
      }
      const rbTotal = robot > 0 ? Math.min(robot, rate) : 0;
      for (let i = 0; i < wires.length; i++) {
        const l = wires[i];
        const dst = S.node(l.to);
        if (!dst) continue;
        const share = give ? give[i] : even;
        
        const rbShare = rbTotal > 0 ? rbTotal * (rate > 0 ? share / rate : 0) : 0;
        if (rbShare > 0) {
          dst.rbIn = dst.rbIn || {};
          dst.rbIn[l.toPort] = (dst.rbIn[l.toPort] || 0) + rbShare;
        }
        dst.rateIn[l.toPort] = (dst.rateIn[l.toPort] || 0) + share;
        dst.raw['in:' + l.toPort] = dst.rateIn[l.toPort];
        l.flow = share;
      }
    }
    function assignRate(typeId, portId, rateFn) {
      for (const p of g.nodes) if (p.type === typeId) emit(p, portId, rateFn(p));
    }

    
    
    
    
    
    










    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t || C.driveIns(t).length) continue;
      









      if (n.pracRate !== undefined && t.wfRate !== undefined) {
        emit(n, 'wf', Math.max(0, n.pracRate));
        continue;
      }
      if (t.wfRate) { emit(n, 'wf', Sim.stat(t.id, 'wfRate') * Sim.powerMul(n)); continue; }
      if (t.wfMult) emit(n, 'wf', Sim.stat('player', 'wfRate') * t.wfMult * Sim.powerMul(n));
    }
    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      
      
      










      if (n.pracRate !== undefined && t.energyRate !== undefined && !C.driveIns(t).length) {
        emit(n, 'kw', Math.max(0, n.pracRate));
        continue;
      }
      if (!t.energyRate || C.driveIns(t).length) continue;
      
      
      
      const rate = Sim.energyOut(n, t.id, 'energyRate') * Sim.powerMul(n);
      emit(n, 'kw', t.duty ? (Sim.solarOn(n) ? rate : 0) : rate);
    }

    
    
    
    
    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.recipe || !t.recipe.power) continue;
      emit(n, 'kw', Sim.forgeLive(n));
    }

    




    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.kwPerKg) continue;
      const oil = n.buf.oil || 0;
      
      if (oil <= 0 || (t.licence && !Sim.licenceOn(n))) {
        n.ciDrain = 0; emit(n, 'kw', 0); continue;
      }
      const per = Sim.energyOut(n, t.id, 'kwPerKg');
      




      const rate = Sim.oilCiRate(t);
      let share = 1;
      if (rate > 0) {
        const wantCi = oil * per * rate;          
        if (wantCi > U.EPS) {
          const pay = Math.min(wantCi, g.ci);
          share = pay / wantCi;
          if (pay > 0) {
            S.spend('ci', pay);
            
            g.licenceCI = (g.licenceCI || 0) + pay;
            
            ciMade -= pay;
            
            n.ciDrain = -pay / hours;
          }
        }
      }
      if (!(share > 0)) n.ciDrain = 0;      
      const burned = oil * share;
      



      n.ciShare = share;
      n.buf.oil = oil - burned;                   
      
      
      emit(n, 'kw', (burned / hours) * per);
    }

    

    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.fission) continue;
      const on = Sim.reactorOn(n), k = on ? Sim.reactorWx(n) : 0;
      
      if (on && k < 1) n.runUntil += dt * (1 - k);
      emit(n, 'kw', on ? Sim.reactorKw(t) * k : 0);
    }

    
    
    
    
    
    


    S.syncDocks(GG.input && GG.input.draggingIds ? GG.input.draggingIds() : null);
    


    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.autoHire || !n.dock) continue;
      const tg = Sim.agencyTargets(n);
      const kinds = n.agOrder === 'exchange' ? [tg.exchanges, tg.posts] : [tg.posts, tg.exchanges];
      for (const list of kinds) {
        const open = list.map(p => ({ p: p, o: Sim.agencyOffer(n, p) })).filter(x => x.o);
        if (!open.length) continue;
        open.sort((a, b) => a.o.price - b.o.price);
        const best = open[0], cur = C.nodeTypes[best.p.type].hire.currency;
        if ((n.budget || 0) + 1e-9 >= best.o.price && U.canAfford(S.bank(cur), best.o.price)) {
          const res = Sim.hire(best.p, best.o.count, best.o.sec);
          if (res.ok) {
            

            if (!Sim.catchingUp) Sim.events.push({ kind: 'agencyHire', loc: n.loc, count: res.count });
            n.budget = Math.max(0, (n.budget || 0) - res.price);
            
            if (res.currency === 'money' && C.ui.rate && C.ui.rate.netAgency) moneyMade -= res.price;
          }
        }
        break;
      }
    }

    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.hire) continue;
      if (n.crew && n.crew.length) {
        const before = n.crew.length;
        n.crew = n.crew.filter(end => end > g.playtime);
        if (n.crew.length < before) Sim.events.push({ kind: 'hireEnd', n: before - n.crew.length });
      }
      emit(n, 'wf', (n.crew ? n.crew.length : 0) * Sim.stat('player', 'wfRate'));
    }

    









    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.recipe || !t.recipe.crew) continue;
      emit(n, 'wf', Sim.roadCrew(n));
    }

    








    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.kwPerWf) continue;
      const made = Sim.robotWf(n, hours);
      

      if (t.overdrive && t.overdrive.dropKitSocket && t.powerUp && Sim.robotFree(n)) {
        const kl = S.linkInto(n.id, t.powerUp.port);
        
        let pl = null;
        if (t.overdrive.dropPowerSocket) {
          const pp = (t.ports.in || []).find(p => p.res === 'energy');
          pl = pp ? S.linkInto(n.id, pp.id) : null;
        }
        if (kl) S.unlink(kl.id, true);
        if (pl) S.unlink(pl.id, true);
        if (kl || pl) Sim.events.push({ kind: 'kitCut', type: n.type, kit: !!kl, power: !!pl });
      }
      if (!Sim.robotFree(n))                              
        n.bank = Math.max(0, (n.bank || 0) - made * Sim.robotDraw(n) * hours);
      if (made > 0) n.raw.work = (n.raw.work || 0) + made;
      
      emit(n, 'wf', made, (C.robotShare && C.robotShare.enabled) ? made : 0);
    }

    
    
    
    
    const wfChain = Sim.chainOrder(
      g.nodes.filter(n => Sim.isWfFwd(C.nodeTypes[n.type])), Sim.isWfFwd);
    for (const n of wfChain) {
      const t = C.nodeTypes[n.type];
      if (t.merge && t.mergeFlow === 'rate') {
        
        let sum = 0, rb = 0;
        for (const p of S.portsOf(n, 'in')) {
          sum += n.rateIn[p.id] || 0;
          rb += (n.rbIn && n.rbIn[p.id]) || 0;
        }
        emit(n, 'out', sum, rb);
      } else if (t.passesWf) {
        const inRate = n.rateIn.wf || 0;
        const rbIn = (n.rbIn && n.rbIn.wf) || 0;     
        if (t.priority) {
          
          const p = Sim.prioSide(n), o = p === 'a' ? 'b' : 'a';
          const on = Sim.prioWants(n, p, hours);
          n.prioOn = on;
          emit(n, p, on ? inRate : 0, on ? rbIn : 0);
          emit(n, o, on ? 0 : inRate, on ? 0 : rbIn);
          continue;
        }
        const share = Sim.splitShare(n);
        emit(n, 'a', inRate * share, rbIn * share);
        emit(n, 'b', inRate * (1 - share), rbIn * (1 - share));
      } else if (t.recruit) {
        
        
        emit(n, 'out', Sim.recruitOutput(n));
      }
    }

    
    const kgPerWF = Sim.stat('cleaner', 'kgPerWF');
    const cleanerCap = Sim.stat('cleaner', 'buffer');
    for (const n of g.nodes) {
      if (n.type !== 'cleaner') continue;
      
      const kgPerHour = (n.rateIn.wf || 0) * kgPerWF * Sim.wx(n, 'dig');
      if (kgPerHour <= 0) continue;
      const site = S.siteOf(n);
      const room = cleanerCap - (n.obuf.out || 0);
      const avail = site ? site.reserve : 0;
      const take = Math.min(kgPerHour * hours, room, avail);
      if (take > 0) {
        n.obuf.out = (n.obuf.out || 0) + take;
        Sim.markDig(n, site, take);
        if (site && C.nodeTypes.trashSite.deplete) site.reserve -= take;
      }
    }

    




    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t || !t.wastePerWf) continue;
      const site = S.siteOf(n);
      if (!site || !((site.reserve || 0) > U.EPS)) continue;
      const wf = n.rateIn.wf || 0;
      const robotWf = wf * Sim.robotShare(n);
      const humanWf = wf - robotWf;
      const gearPer = Sim.stat(t.id, 'gearPerWf');
      const gearHeld = n.buf.gear || 0;
      const humanCan = gearPer > 0 ? Math.min(humanWf, gearHeld / (gearPer * hours)) : humanWf;
      const want = (robotWf + humanCan) * Sim.stat(t.id, 'wastePerWf') * Sim.wx(n, 'dig') * hours;
      if (!(want > 0)) continue;
      const room = Sim.stat(t.id, 'outBuffer') - (n.obuf.out || 0);
      const take = Math.min(want, room, site.reserve);
      if (!(take > 0)) continue;
      const frac = take / want;
      if (gearPer > 0) n.buf.gear = Math.max(0, gearHeld - humanCan * frac * gearPer * hours);
      n.obuf.out = (n.obuf.out || 0) + take;
      n.raw.work = (n.raw.work || 0) + take;
      Sim.markDig(n, site, take);
      if (C.nodeTypes[site.type].deplete) site.reserve -= take;
      
      if (Sim.robotShare(n) >= 0.999 && t.ports.out[0].res === 'nukeWaste')   
        g.robotWasteKg = (g.robotWasteKg || 0) + take;
    }

    










    const pulls = [], peers = {}, atStart = {};
    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (t.kind !== 'machine') continue;
      




      for (const port of S.portsOf(n, 'in')) {
        if (C.resources[port.res].flow !== 'material') continue;
        const link = S.linkInto(n.id, port.id);
        if (!link) continue;
        const src = S.node(link.from);
        if (!src) continue;
        const srcPort = S.portsOf(src, 'out').find(p => p.id === link.fromPort);
        if (!srcPort) continue;
        const key = link.from + ':' + link.fromPort;
        peers[key] = (peers[key] || 0) + 1;
        if (!(key in atStart)) atStart[key] = src.obuf[link.fromPort] || 0;
        pulls.push({ n: n, t: t, port: port, link: link, src: src, srcPort: srcPort, key: key });
      }
    }

    



    


    function roomIn(n, t, res, port) {
      
      if (t.fission) {
        const F = Sim.reactorFuel(n);
        return res === F.res ? Math.max(0, F.kg - (n.buf[res] || 0)) : 0;
      }
      
      if (t.lanes && port && port.lane) {
        return Math.max(0, Sim.laneCap(n) - Sim.laneHeld(n, port.lane));
      }
      






      if (t.print) {
        const pl = Sim.printPlan(n);
        if (res === 'paper') return Math.max(0, t.print.paper - (n.buf.paper || 0));
        if (!pl || res !== pl.res) return 0;
        return Math.max(0, pl.kg - (n.buf[res] || 0));
      }
      

      if (t.rocket) {
        const R = t.rocket;
        
        const RF = Sim.rocketFuel(n);     
        if (res === RF.res) return n.built ? Math.max(0, RF.kg - (n.buf[res] || 0)) : 0;
        if (res === 'turbofuel' || res === 'nfuel') return 0;
        if (n.built || R.build[res] === undefined) return 0;
        return Math.max(0, R.build[res] - (n.buf[res] || 0));
      }
      

      if (port && port.mode === 'burn') {
        const cap = t.bufferB ? Sim.stat(t.id, 'bufferB') : capOf(n, t);
        return Math.max(0, cap - total(Sim.sideBuf(n, 'B')));
      }
      if (t.recipe) {
        



        if (t.recipe.boost && Sim.plantMaxed(n)) return 0;
        
        if (Sim.roadMaxed(n)) return 0;
        return Math.max(0, Sim.recipeNeed(n, res) - (n.buf[res] || 0));
      }
      





      if (t.convert && t.convert.inputs[res] !== undefined) {
        let sum = 0;
        Object.keys(t.convert.inputs).forEach(k => { sum += Sim.convNeed(n, k); });
        const share = sum > 0 ? Sim.convNeed(n, res) / sum : 1;
        return Math.max(0, capOf(n, t) * share - (n.buf[res] || 0));
      }
      








      if (t.mix && C.mixer && C.mixer.splitHopper && t.mix.indexOf(res) !== -1) {
        return Math.max(0, capOf(n, t) / t.mix.length - (n.buf[res] || 0));
      }
      








      if (t.powerUp && res === t.powerUp.res) {
        if (Sim.powerMaxed(n)) return 0;
        return Math.max(0, Sim.powerLoad(n) - (n.buf[res] || 0));
      }
      



      if (t.holdLock) {
        return Math.max(0, capOf(n, t) - total(n.buf) - total(n.obuf));
      }
      






      if (t.stopWhenFull && t.ciPerKg && res !== 'energy') {
        const perKg = Sim.stat(t.id, 'ciPerKg');
        const need = perKg > 0 ? Sim.growLeft(n) / perKg : 0;
        return Math.max(0, Math.min(capOf(n, t), need) - total(n.buf));
      }
      return capOf(n, t) - total(n.buf);
    }

    






















    const srcOut = {};
    
    function srcLane(p) {
      const st = C.nodeTypes[p.src.type];
      return st.lanes ? S.portLane(st, p.link.fromPort, 'out') : null;
    }
    function srcBudget(p) {
      const L = srcLane(p);
      const lim = L ? Sim.laneLimit(p.src, L) : Sim.outLimit(p.src);
      if (!(isFinite(lim) && lim >= 0)) return Infinity;
      const id = p.src.id + (L ? ':' + L : '');
      if (!(id in srcOut)) srcOut[id] = lim * hours;
      return srcOut[id];
    }
    function srcSpend(p, amount) {
      const L = srcLane(p);
      const id = p.src.id + (L ? ':' + L : '');
      if (id in srcOut) srcOut[id] = Math.max(0, srcOut[id] - amount);
    }

    function pull(p, cap) {
      const avail = p.src.obuf[p.link.fromPort] || 0;
      const room = roomIn(p.n, p.t, p.srcPort.res, p.port);
      const allow = srcBudget(p);
      






      const limit = Sim.stat(p.t.id, 'intakeRate');
      const budget = (isNaN(limit) ? Infinity : limit) * hours - (p.took || 0);
      const take = Math.min(budget, avail, room, cap, allow);
      if (!(take > 0)) return;      
      srcSpend(p, take);
      p.took = (p.took || 0) + take;
      p.src.obuf[p.link.fromPort] = avail - take;
      const dst = (p.port && p.port.lane && p.n.lb) ? (p.n.lb[p.port.lane] = p.n.lb[p.port.lane] || {})
        : Sim.sideBuf(p.n, p.port && p.port.mode === 'burn' ? 'B' : undefined);
      dst[p.srcPort.res] = (dst[p.srcPort.res] || 0) + take;
      const perHour = take / hours;
      p.n.raw['in:' + p.port.id] = (p.n.raw['in:' + p.port.id] || 0) + perHour;
      p.src.raw['out:' + p.link.fromPort] = (p.src.raw['out:' + p.link.fromPort] || 0) + perHour;
      p.link.flow += perHour;
    }

    
    for (const p of pulls) pull(p, atStart[p.key] / peers[p.key]);
    for (const p of pulls) pull(p, Infinity);

    
    
    
    
    
    
    const chain = Sim.energyOrder(g.nodes.filter(function (n) {
      const t = C.nodeTypes[n.type];
      
      
      return t.store || (t.splitter && t.passesEnergy);
    }));
    for (const n of chain) {
      const t = C.nodeTypes[n.type];

      if (t.splitter) {
        const inRate = n.rateIn.kw || 0;
        if (t.priority) {
          
          const p = Sim.prioSide(n), o = p === 'a' ? 'b' : 'a';
          const on = Sim.prioWants(n, p, hours);
          n.prioOn = on;
          emit(n, p, on ? inRate : 0);
          emit(n, o, on ? 0 : inRate);
          continue;
        }
        const share = Sim.splitShare(n);
        let ga = inRate * share, gb = inRate - ga;
        if (C.splitter && C.splitter.honourRatio) {
          




          



          const plan = Sim.splitPlan(n, hours);
          if (!C.splitter.spill) {
            






            ga = inRate * plan.sa; gb = inRate - ga;
            n.giveA = ga; n.giveB = gb;
            emit(n, 'a', ga);
            emit(n, 'b', gb);
            if (inRate > 0 && Math.abs(share - 0.5) < 1e-9) g.splitEven = true;
            continue;
          }
          const give = Sim.splitGive(plan.sa, plan.sb, plan.dA, plan.dB, inRate);
          ga = give.ga; gb = give.gb;
          











          const k = (C.splitter.damp === undefined) ? 1 : C.splitter.damp;
          if (k < 1) {
            if (n.giveA !== undefined) ga = n.giveA + (ga - n.giveA) * k;
            if (n.giveB !== undefined) gb = n.giveB + (gb - n.giveB) * k;
            ga = Math.max(0, Math.min(ga, plan.dA, inRate));
            gb = Math.max(0, Math.min(gb, plan.dB, inRate - ga));
          }
          


          n.giveA = ga; n.giveB = gb;
        } else if (C.splitter && C.splitter.demandAware) {
          

          const wa = Sim.branchDemand(n, 'a', hours), wb = Sim.branchDemand(n, 'b', hours);
          ga = Math.min(ga, wa); gb = Math.min(gb, wb);
          let left = inRate - ga - gb;
          if (left > 0) { const t2 = Math.min(left, wa - ga); ga += t2; left -= t2; }
          if (left > 0) { const t2 = Math.min(left, wb - gb); gb += t2; left -= t2; }
        }
        emit(n, 'a', ga);
        emit(n, 'b', gb);
        
        if (inRate > 0 && Math.abs(share - 0.5) < 1e-9) g.splitEven = true;
        continue;
      }

      
      
      
      if (Sim.wx(n, 'battery') <= 0) {
        n.demand = 0; n.outRate = 0;
        emit(n, 'kw', 0);
        continue;
      }

      
      
      const cap = Sim.stat(t.id, 'store');
      const inRate = Sim.storeIn(n);   
      


      const push = !!(C.powerPush && C.powerPush.enabled);
      if (!push) n.store = Math.min(cap, (n.store || 0) + inRate * hours);  

      if (!Sim.hasEnergyWire(n)) {
        if (push) n.store = Math.min(cap, (n.store || 0) + inRate * hours);
        
        n.store = Math.max(0, n.store - Sim.stat(t.id, 'idleDrain') * hours);
        n.demand = 0; n.outRate = 0;
        emit(n, 'kw', 0);
        continue;
      }
      
      
      if (push) {
        
        n.outRate = Sim.storeOutput(n, t, hours, inRate);
        n.demand = n.outRate;
        



        const fromIn = Math.min(n.outRate, inRate);
        const fromStore = n.outRate - fromIn;
        n.store = Math.max(0, Math.min(cap,
                    (n.store || 0) + (inRate - fromIn) * hours - fromStore * hours));
      } else {
        n.demand = Math.min(Sim.demandOn(n, hours), Sim.outLimit(n));
        n.outRate = Math.min(n.demand, n.store / hours);
        n.store = Math.max(0, n.store - n.outRate * hours);
      }
      
      
      emit(n, 'kw', n.outRate, 0, true);
    }

    
    
    
    
    for (const n of g.nodes) {
      if (n.type !== 'droneCleaner') continue;
      
      
      
      const kgPerHour = (n.rateIn.kw || 0) / Sim.stat('droneCleaner', 'energyPerKg') *
                        Sim.wx(n, 'dig');
      if (kgPerHour <= 0) continue;
      const site = S.siteOf(n);
      const room = Sim.stat('droneCleaner', 'buffer') - (n.obuf.out || 0);
      const take = Math.min(kgPerHour * hours, Sim.stat('droneCleaner', 'digRate') * hours,
                            room, site ? site.reserve : 0);
      if (take > 0) {
        n.obuf.out = (n.obuf.out || 0) + take;
        g.powerKg = (g.powerKg || 0) + take;
        Sim.markDig(n, site, take);
        if (site && C.nodeTypes.trashSite.deplete) site.reserve -= take;
      }
    }

    






    for (const n of g.nodes) {
      if (n.type !== 'oreDigger') continue;
      const site = S.siteOf(n);
      if (!site || (site.reserve || 0) <= U.EPS) continue;
      


      const kw = Sim.stat('oreDigger', 'digKw'), wf = Sim.stat('oreDigger', 'digWf');
      const byKw = kw > 0 ? (n.rateIn.kw || 0) / kw : Infinity;
      const byWf = wf > 0 ? (n.rateIn.wf || 0) / wf : Infinity;
      const kgPerHour = Math.min(byKw, byWf) * Sim.wx(n, 'dig');
      if (!(kgPerHour > 0)) continue;
      


      const mix = Sim.mixOf(site), cap = Sim.stat('oreDigger', 'outBuffer');
      let room = Infinity;
      Object.keys(mix).forEach(function (r) {
        if (!(mix[r] > 0)) return;
        room = Math.min(room, Math.max(0, cap - (n.obuf[r] || 0)) / mix[r]);
      });
      const take = Math.min(kgPerHour * hours, Sim.stat('oreDigger', 'digRate') * hours,
                            room, site.reserve);
      if (!(take > 0)) continue;
      Object.keys(mix).forEach(function (r) {
        if (!(mix[r] > 0)) return;
        n.obuf[r] = (n.obuf[r] || 0) + take * mix[r];
      });
      n.raw.work = (n.raw.work || 0) + take;
      Sim.markDig(n, site, take);
      site.reserve -= take;
    }

    









































    for (const n of g.nodes) {
      const pt = C.nodeTypes[n.type];
      if (!pt || !(pt.ciPerWF || pt.ciPerKW)) continue;
      










      if (pt.stopWhenFull && Sim.siteFull(n)) { n.raw['v:0'] = 0; continue; }
      



      const till = pt.collect ? Sim.collectCap(pt, n) : 0;
      if (pt.collect && (n.till || 0) >= till - U.EPS) { n.raw['v:0'] = 0; continue; }
      








      const byKw = !pt.ciPerWF;
      let supply = byKw ? (n.rateIn.kw || 0) : (n.rateIn.wf || 0);
      








      if (byKw && pt.maxKw) supply = Math.min(supply, Sim.stat(pt.id, 'maxKw'));
      let ci = supply * Sim.statWx(n, pt.id, byKw ? 'ciPerKW' : 'ciPerWF',
                                   pt.wxKey || 'plant') * hours * Sim.plantMul(n);
      



      if (pt.ciPerKg && ci > 0) {
        const res = (pt.ports.in.find(p => C.resources[p.res] &&
                     C.resources[p.res].flow === 'material') || {}).res;
        const perKg = Sim.stat(pt.id, 'ciPerKg');
        const held = res ? (n.buf[res] || 0) : 0;
        let want = perKg > 0 ? ci / perKg : Infinity;
        







        const bp = C.byProduct(pt, perKg);
        if (bp && bp.kg > 0) {
          const room = (pt.outBuffer || 0) - (n.obuf[outPortFor(pt, bp.res)] || 0);
          want = Math.min(want, Math.max(0, room) / bp.kg);
        }
        const take = Math.min(want, held);
        if (!(take > 0)) { n.raw['v:0'] = 0; continue; }
        n.buf[res] = held - take;
        ci = take * perKg;
        
        
        if (bp && bp.kg > 0) {
          const pid = outPortFor(pt, bp.res);
          n.obuf[pid] = (n.obuf[pid] || 0) + take * bp.kg;
        }
      }
      if (ci <= 0) continue;
      









      if (pt.collect) ci = Math.min(ci, till - (n.till || 0));
      if (ci <= 0) { n.raw['v:0'] = 0; continue; }
      if (pt.collect) n.till = (n.till || 0) + ci;
      else { g.ci += ci; g.totalCI += ci; }
      ciMade += ci;
      Sim.grow(S.siteOf(n), ci);
      n.raw['v:0'] = ci / hours;
    }

    





















    for (const n of g.nodes) {
      const pt = C.nodeTypes[n.type];
      if (!pt || !pt.recipe || !pt.recipe.ci) continue;
      const ci = Sim.domeOutput(n) * hours;
      if (ci > 0) { g.ci += ci; g.totalCI += ci; ciMade += ci; }
      n.raw['v:0'] = ci / hours;
    }

    


    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.recipe || !t.recipe.maxMade || !Sim.roadDone(n)) continue;
      const inputs = t.recipe.inputs;
      S.linksInto(n.id).filter(function (l) {
        const p = ((t.ports || {}).in || []).find(x => x.id === l.toPort);
        return p && inputs[p.res] !== undefined;
      }).forEach(l => S.unlink(l.id));
    }

    



    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.rocket) continue;
      const B = t.rocket.build, F = t.rocket.flight;
      if (!n.built) {
        if (Object.keys(B).every(k => (n.buf[k] || 0) + U.EPS >= B[k])) {
          Object.keys(B).forEach(k => { n.buf[k] = Math.max(0, (n.buf[k] || 0) - B[k]); });
          n.built = true; n.pulse = 1;
          
          S.linksInto(n.id).filter(l => B[l.toPort] !== undefined).forEach(l => S.unlink(l.id));
          Sim.events.push({ kind: 'rocketBuilt', type: n.type });
        }
        continue;
      }
      if (n.flightUntil > 0) {
        if (g.playtime >= n.flightUntil) {
          n.flightUntil = 0;
          const haul = Sim.rocketMetal(n);                
          n.obuf.metal = (n.obuf.metal || 0) + haul;
          g.ci += F.ci; g.totalCI = (g.totalCI || 0) + F.ci; ciMade += F.ci;
          g.rocketFlights = (g.rocketFlights || 0) + 1;
          n.pulse = 1;
          Sim.events.push({ kind: 'rocketHome', kg: haul, ci: F.ci, id: n.id });
        }
        continue;
      }
      const RF = Sim.rocketFuel(n);
      if ((n.buf[RF.res] || 0) + U.EPS >= RF.kg && !((n.obuf.metal || 0) > 1e-6) &&
          (n.wfPool || 0) < F.wf) {
        n.wfPool = Math.min(F.wf, (n.wfPool || 0) + (n.rateIn.wf || 0) * hours);
      }
    }

    



    for (const n of g.nodes) {
      const pt = C.nodeTypes[n.type];
      if (!pt || !pt.interestPct) continue;
      const held = n.buf[pt.interestRes || 'gold'] || 0;
      const pay = held * Sim.valueOf(C.nodeTypes.market, pt.interestRes || 'gold') *
                  Sim.stat(pt.id, 'interestPct') / 100 * hours;
      if (pay > 0) {
        g.money += pay; g.totalMoney = (g.totalMoney || 0) + pay; moneyMade += pay;
        n.raw.work = (n.raw.work || 0) + held;
        

        const ag = S.bankAgency(n);
        if (ag) {
          
          let top = 0;
          const tg = Sim.agencyTargets(ag);
          tg.posts.concat(tg.exchanges).forEach(function (p) {
            const o = Sim.agencyOffer(ag, p, true);
            if (o) top = Math.max(top, o.price);
          });
          ag.budget = Math.min(C.nodeTypes[ag.type].autoHire.budgetCap * top, (ag.budget || 0) + pay);
        }
      }
      n.raw['v:0'] = pay / hours;
    }

    














    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.pumpPerKw) continue;
      const site = S.siteOf(n);
      if (!site) continue;

      
      const dirty = Sim.poolDirty(site);
      if (dirty > 0) {
        const per = Sim.stat(t.id, 'pumpPerKw');
        const want = (n.rateIn.kw || 0) * hours * per;
        const room = (t.outBuffer || 0) - (n.obuf.dirty || 0);
        const took = Math.max(0, Math.min(want, dirty, room));
        if (took > 0) {
          site.dirty = dirty - took;
          n.obuf.dirty = (n.obuf.dirty || 0) + took;
          
















          n.raw.work = (n.raw.work || 0) + took / hours;
        }
      }

      
      const have = n.buf.water || 0;
      if (!(have > 0)) n.raw['v:0'] = 0;      
      if (have > 0) {
        const perKg = Sim.poolCiPerKg(site);
        
        const left = perKg > 0 ? Sim.growLeft(n) / perKg : 0;
        const put = Math.max(0, Math.min(have, left));
        if (put > 0) {
          n.buf.water = have - put;
          g.waterBack = (g.waterBack || 0) + put;   
          const ci = put * perKg;
          

          const extra = ci * Sim.bonus(t.id + '.returnBonus') / 100;
          g.ci += ci + extra;
          


          if ((C.ui || {}).pumpCountsTotal !== false) g.totalCI = (g.totalCI || 0) + ci + extra;
          ciMade += ci + extra;
          Sim.grow(site, ci);
          
















          n.raw.work = (n.raw.work || 0) + put / hours;
          





          n.raw['v:0'] = (n.raw['v:0'] || 0) + (ci + extra) / hours;
        }
      }
    }

    






    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.kwPerWf) continue;
      const room = Sim.stat(t.id, 'bank') - (n.bank || 0);
      


      const got = (n.rateIn.kw || 0) + Sim.panelKw(n);
      n.bank = Math.min(Sim.stat(t.id, 'bank'),
                        (n.bank || 0) + Math.max(0, got * hours));
      if (room < 0) n.bank = Sim.stat(t.id, 'bank');
    }

    
    
    
    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.recruit) continue;
      n.wfPool = (n.wfPool || 0) + (n.rateIn.wf || 0) * hours;
      n.kwPool = (n.kwPool || 0) + (n.rateIn.kw || 0) * hours;
      let needWf = Sim.recruitNeed(n, 'wf'), needKw = Sim.recruitNeed(n, 'kw');
      
      while (n.wfPool >= needWf - U.EPS && n.kwPool >= needKw - U.EPS) {
        n.wfPool -= needWf; n.kwPool -= needKw;
        n.recruits = (n.recruits || 0) + 1;
        Sim.clearLadder();   
        n.pulse = 1;
        
        
        if (!g.forgeCycle) {
          const from = Object.keys(Sim.energyOrigins(n));
          if (from.length === 1 && from[0] === 'gridFoundry') g.forgeCycle = true;
        }
        Sim.events.push({ kind: 'recruit', total: n.recruits });
        needWf = Sim.recruitNeed(n, 'wf'); needKw = Sim.recruitNeed(n, 'kw');
      }
    }

    
    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.merge || t.mergeFlow !== 'material') continue;
      Sim.adoptGrade(n);
      const budget = Sim.stat(t.id, 'processRate') * hours;
      let moved = 0;
      for (const res in n.buf) {
        const have = n.buf[res] || 0;
        if (have <= 0) continue;
        










        const cap  = t.holdLock ? Math.min(Sim.capOf(n), Sim.outLimit(n) * hours)
                                : t.outBuffer;
        const room = cap - (n.obuf.out || 0);
        const take = Math.min(have, budget - moved, room);
        if (take <= 0) continue;
        n.obuf.out = (n.obuf.out || 0) + take;
        n.buf[res] = have - take;
        moved += take;
      }
      





      if (t.holdLock) S.releaseGrade(n);
    }

    


    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.lanes) continue;
      if (!n.lg || !n.lb) S.laneInit(n, t);
      Sim.adoptLanes(n);
      for (const L of t.lanes) {
        const out = S.laneOutPort(t, L), lb = n.lb[L];
        const cap = Math.min(Sim.laneCap(n), Sim.laneLimit(n, L) * hours);
        for (const res in lb) {
          const have = lb[res] || 0;
          if (have <= 0) continue;
          const take = Math.min(have, cap - (n.obuf[out] || 0));
          if (take <= 0) break;
          n.obuf[out] = (n.obuf[out] || 0) + take;
          lb[res] = have - take;
        }
      }
      S.releaseLanes(n);
    }

    





    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.passesMaterial) continue;
      











      Sim.adoptGrade(n);
      if (n.grade && !total(n.buf) && !total(n.obuf)) S.releaseGrade(n);
      const share = Sim.splitShare(n);
      for (const res in n.buf) {
        const have = n.buf[res] || 0;
        if (have <= 0) continue;
        let a = have * share, b = have - a;
        const ra = Math.max(0, t.outBuffer - (n.obuf.a || 0));
        const rb = Math.max(0, t.outBuffer - (n.obuf.b || 0));
        if (C.splitter && C.splitter.materialLockstep) {
          
          let k = 1;
          if (a > 0) k = Math.min(k, ra / a);
          if (b > 0) k = Math.min(k, rb / b);
          k = Math.max(0, Math.min(1, k));
          a *= k; b *= k;
        } else {
          

























          a = Math.min(a, ra); b = Math.min(b, rb);
          if (C.splitter && C.splitter.materialSpill) {
            


            let left = have - a - b;
            if (left > 0) { const m = Math.min(left, ra - a); a += m; left -= m; }
            if (left > 0) { const m = Math.min(left, rb - b); b += m; left -= m; }
          }
        }
        if (a > 0) n.obuf.a = (n.obuf.a || 0) + a;
        if (b > 0) n.obuf.b = (n.obuf.b || 0) + b;
        n.buf[res] = have - a - b;
      }
    }

    
    const recOutCap = C.nodeTypes.recycler.outBuffer;
    for (const n of g.nodes) {
      if (n.type !== 'recycler') continue;
      const have = n.buf.trash || 0;
      if (have <= 0) continue;
      let amount = Math.min(have, Sim.stat('recycler', 'processRate') * hours);
      
      
      const covered = (n.rateIn.kw || 0) * hours / Sim.stat('recycler', 'energyPerKg');

      let recycled = Math.min(amount, covered, recOutCap - (n.obuf.rec || 0));
      let passed = Math.min(amount - Math.min(amount, covered),
                            recOutCap - (n.obuf.pass || 0));
      if (recycled > 0) n.obuf.rec = (n.obuf.rec || 0) + recycled;
      if (passed > 0) n.obuf.pass = (n.obuf.pass || 0) + passed;
      n.buf.trash = have - recycled - passed;
    }

    
    for (const n of g.nodes) {
      if (n.type !== 'weightSorter') continue;
      const have = n.buf.rtrash || 0;
      if (have <= 0) continue;
      const outCap = C.nodeTypes.weightSorter.outBuffer;
      const amount = Math.min(have, Sim.stat('weightSorter', 'processRate') * hours);
      const energy = (n.rateIn.kw || 0) * hours;

      let light = amount * Sim.lightShare(energy, amount);
      let heavy = amount - light;

      
      let k = 1;
      if (light > 0) k = Math.min(k, (outCap - (n.obuf.light || 0)) / light);
      if (heavy > 0) k = Math.min(k, (outCap - (n.obuf.heavy || 0)) / heavy);
      k = Math.max(0, Math.min(1, k));
      light *= k; heavy *= k;

      if (light > 0) n.obuf.light = (n.obuf.light || 0) + light;
      if (heavy > 0) n.obuf.heavy = (n.obuf.heavy || 0) + heavy;
      n.buf.rtrash = have - light - heavy;
      
      if (light > 0 && light >= heavy - 1e-9) g.sorterPerfect = true;
    }

    
    
    
    
    for (const n of g.nodes) {
      if (n.type !== 'magnetSeparator') continue;
      const have = n.buf.heavy || 0;
      if (have <= 0) continue;
      const outCap = C.nodeTypes.magnetSeparator.outBuffer;
      const amount = Math.min(have, Sim.stat('magnetSeparator', 'processRate') * hours);
      const covered = (n.rateIn.kw || 0) * hours / Sim.stat('magnetSeparator', 'energyPerKg');
      const made = Math.min(amount, covered, outCap - (n.obuf.metal || 0));
      const passed = Math.min(amount - Math.min(amount, covered),
                              outCap - (n.obuf.pass || 0));
      if (made > 0) n.obuf.metal = (n.obuf.metal || 0) + made;
      if (passed > 0) n.obuf.pass = (n.obuf.pass || 0) + passed;
      n.buf.heavy = have - made - passed;
    }

    




    for (const n of g.nodes) {
      if (n.type !== 'rubbleSorter') continue;
      const have = n.buf.heavy || 0;
      if (have <= 0) continue;
      const outCap = C.nodeTypes.rubbleSorter.outBuffer;
      const amount = Math.min(have, Sim.stat('rubbleSorter', 'processRate') * hours);
      
      const r = Sim.rubbleSplit((n.rateIn.wf || 0) * hours, (n.rateIn.kw || 0) * hours, amount);
      let glass = r.worked * r.glass, agg = r.worked - glass;

      
      let k = 1;
      if (glass > 0) k = Math.min(k, (outCap - (n.obuf.glass || 0)) / glass);
      if (agg > 0) k = Math.min(k, (outCap - (n.obuf.agg || 0)) / agg);
      k = Math.max(0, Math.min(1, k));
      glass *= k; agg *= k;

      if (glass > 0) n.obuf.glass = (n.obuf.glass || 0) + glass;
      if (agg > 0) n.obuf.agg = (n.obuf.agg || 0) + agg;
      
      if (glass > 0 && agg <= U.EPS) g.pureGlass = true;
      n.buf.heavy = have - glass - agg;
    }

    
    
    
    
    for (const n of g.nodes) {
      if (n.type !== 'eddySeparator') continue;
      const have = n.buf.metal || 0;
      if (have <= 0) continue;
      const t = C.nodeTypes.eddySeparator;
      const outCap = t.outBuffer;
      const amount = Math.min(have, Sim.stat(t.id, 'processRate') * hours);
      const energy = (n.rateIn.kw || 0) * hours;

      let alu = amount * Sim.lightShare(energy, amount, t.id);
      let steel = amount - alu;

      
      let k = 1;
      if (alu > 0) k = Math.min(k, (outCap - (n.obuf.alu || 0)) / alu);
      if (steel > 0) k = Math.min(k, (outCap - (n.obuf.steel || 0)) / steel);
      k = Math.max(0, Math.min(1, k));
      alu *= k; steel *= k;

      if (alu > 0) n.obuf.alu = (n.obuf.alu || 0) + alu;
      if (steel > 0) n.obuf.steel = (n.obuf.steel || 0) + steel;
      n.buf.metal = have - alu - steel;
    }

    
    
    
    
    for (const n of g.nodes) {
      if (n.type !== 'hazardPlant') continue;
      const have = n.buf.light || 0;
      if (have <= 0) continue;
      const t = C.nodeTypes.hazardPlant;
      const outCap = t.outBuffer;
      const amount = Math.min(have, Sim.stat(t.id, 'processRate') * hours);
      const covered = (n.rateIn.wf || 0) * hours / Sim.stat(t.id, 'wfPerKg');
      
      const room = (outCap - (n.obuf.haz || 0)) / Sim.stat(t.id, 'hazPerKg');
      const used = Math.max(0, Math.min(amount, covered, room));
      const made = used * Sim.stat(t.id, 'hazPerKg');
      const passed = Math.min(amount - Math.min(amount, covered),
                              outCap - (n.obuf.pass || 0));
      if (made > 0) n.obuf.haz = (n.obuf.haz || 0) + made;
      if (passed > 0) n.obuf.pass = (n.obuf.pass || 0) + passed;
      n.buf.light = have - used - passed;
    }

    
    
    
    for (const n of g.nodes) {
      if (n.type !== 'fineSorter') continue;
      const have = n.buf.light || 0;
      if (have <= 0) continue;
      const t = C.nodeTypes.fineSorter;
      const outCap = t.outBuffer;
      const amount = Math.min(have, Sim.stat(t.id, 'processRate') * hours);
      const crew = (n.rateIn.wf || 0) * hours;

      let plastic = amount * Sim.lightShare(crew, amount, t.id);
      let organic = amount - plastic;

      let k = 1;
      if (plastic > 0) k = Math.min(k, (outCap - (n.obuf.plastic || 0)) / plastic);
      if (organic > 0) k = Math.min(k, (outCap - (n.obuf.organic || 0)) / organic);
      k = Math.max(0, Math.min(1, k));
      plastic *= k; organic *= k;

      if (plastic > 0) n.obuf.plastic = (n.obuf.plastic || 0) + plastic;
      if (organic > 0) n.obuf.organic = (n.obuf.organic || 0) + organic;
      n.buf.light = have - plastic - organic;
    }

    
    
    
    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.mix) continue;
      const outCap = t.outBuffer;
      let least = Infinity;
      t.mix.forEach(r => { least = Math.min(least, n.buf[r] || 0); });
      if (!(least > 0)) continue;
      const covered = (n.rateIn.kw || 0) * hours / Sim.stat(t.id, 'energyPerKg');
      const room = (outCap - (n.obuf.out || 0)) / Sim.stat(t.id, 'fertPerKg');
      const used = Math.max(0, Math.min(least, Sim.stat(t.id, 'processRate') * hours,
                                        covered, room));
      if (used <= 0) continue;
      t.mix.forEach(r => { n.buf[r] = (n.buf[r] || 0) - used; });
      n.obuf.out = (n.obuf.out || 0) + used * Sim.stat(t.id, 'fertPerKg');
    }

    




    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.oilPerKg) continue;
      const have = n.buf.plastic || 0;
      if (have <= 0) continue;
      const per = Sim.stat(t.id, 'oilPerKg');
      const covered = (n.rateIn.kw || 0) * hours / Sim.stat(t.id, 'energyPerKg');
      const room = (t.outBuffer - (n.obuf.out || 0)) / per;      
      const used = Math.max(0, Math.min(have, Sim.stat(t.id, 'processRate') * hours,
                                        covered, room));
      if (used <= 0) continue;
      n.buf.plastic = have - used;
      n.obuf.out = (n.obuf.out || 0) + used * per;
    }

    














    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.yieldPerKg) continue;
      const inPort = (t.ports.in || []).find(p => (C.resources[p.res] || {}).flow === 'material');
      const outPort = (t.ports.out || [])[0];
      if (!inPort || !outPort) continue;
      const res = inPort.res;
      const have = n.buf[res] || 0;
      if (have <= 0) continue;
      const per = Sim.stat(t.id, 'yieldPerKg');
      
      const covered = t.wfPerKg
        ? (n.rateIn.wf || 0) * hours / Sim.stat(t.id, 'wfPerKg')
        : (n.rateIn.kw || 0) * hours / Sim.stat(t.id, 'energyPerKg');
      const room = (t.outBuffer - (n.obuf[outPort.id] || 0)) / per;   
      const used = Math.max(0, Math.min(have, Sim.stat(t.id, 'processRate') * hours,
                                        covered, room));
      if (used <= 0) continue;
      n.buf[res] = have - used;
      n.obuf[outPort.id] = (n.obuf[outPort.id] || 0) + used * per;

      



      if (outPort.res === 'wood') {
        if (!g.woodWays) g.woodWays = {};
        g.woodWays[t.id] = 1;
      }
      if (res === 'wood') g.woodCharred = (g.woodCharred || 0) + used;
    }

    







    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      const cv = t.convert;
      if (!cv) continue;
      
      if (cv.ci) n.raw['v:0'] = 0;
      const r = Sim.convRate(n, hours);
      if (!(r.kg > 0)) continue;
      Object.keys(cv.inputs).forEach(function (k) {
        n.buf[k] = Math.max(0, (n.buf[k] || 0) - r.kg * Sim.convNeed(n, k));
      });
      



      if (cv.ci) {
        const ci = r.kg * Sim.convCi(n);      
        g.ci += ci; g.totalCI += ci; ciMade += ci;
        n.raw['v:0'] = ci / hours;
        n.raw.work = (n.raw.work || 0) + r.kg;
        n.made = (n.made || 0) + r.kg;
        

        g.convKg = g.convKg || {};
        g.convKg[t.id] = (g.convKg[t.id] || 0) + r.kg;
        continue;
      }
      const made = r.kg * (cv.out.kg || 1);
      n.obuf[r.port] = (n.obuf[r.port] || 0) + made;
      
      
      n.made = (n.made || 0) + made;
      Sim.clearLadder();     
      
      
      if (cv.out.res === 'cell') g.cellsMade = (g.cellsMade || 0) + made;
      
      g.convKg = g.convKg || {};
      g.convKg[cv.out.res] = (g.convKg[cv.out.res] || 0) + made;
      




      const bp = C.byProduct(t, 0);
      if (bp && bp.kg > 0) {
        const port = (t.ports.out || []).find(function (o) { return o.res === bp.res; });
        

        const kg = bp.kg + (t.outPerKg ? Sim.bonus(t.id + '.byKg') : 0);
        if (port) n.obuf[port.id] = (n.obuf[port.id] || 0) + made * kg;
      }
    }

    
    
    
    
    
    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      const r = t.recipe;
      if (!r) continue;
      const needWf = Sim.recipeWf(n);
      



      let needKw = Sim.recipeKw(n);
      if (needWf > 0) {
        
        
        if (Sim.recipeReady(n)) n.wfPool = (n.wfPool || 0) + (n.rateIn.wf || 0) * hours;
      }
      if (needKw > 0) {
        if (Sim.recipeReady(n)) n.kwPool = (n.kwPool || 0) + (n.rateIn.kw || 0) * hours;
        
        
        n.raw['v:0'] = Sim.gemRate(n);
      }
      
      for (let guard = 0; guard < 64; guard++) {
        if (!Sim.recipeReady(n)) break;
        if (needWf > 0 && (n.wfPool || 0) < needWf - U.EPS) break;
        if (needKw > 0 && (n.kwPool || 0) < needKw - U.EPS) break;
        
        if (r.out) {
          const room = t.outBuffer - (n.obuf.out || 0);
          if (room < r.out.kg - U.EPS) break;
        }
        




        if (r.gem && t.collect) {
          const have = n.till || 0;
          if (have > 0 && Sim.collectCap(t, n) - have < Sim.gemYield(n) - U.EPS) break;
        }
        Object.keys(r.inputs).forEach(k => { n.buf[k] -= Sim.recipeNeed(n, k); });
        if (needWf > 0) n.wfPool -= needWf;
        if (needKw > 0) n.kwPool -= needKw;
        




        if (r.gem) {
          const cut = Sim.gemYield(n);
          if (t.collect) n.till = (n.till || 0) + cut;
          else S.earn(r.gem.cur, cut);
          g.gemsMade = (g.gemsMade || 0) + cut;
          Sim.events.push({ kind: 'gemMade', n: cut, total: g.gemsMade, type: n.type });
        }
        n.made = (n.made || 0) + 1;
        
        g.batches = g.batches || {};
        g.batches[n.type] = (g.batches[n.type] || 0) + 1;
        
        if (needKw > 0) needKw = Sim.recipeKw(n);
        n.pulse = 1;
        
        
        if (r.out) {
          n.obuf.out = (n.obuf.out || 0) + r.out.kg;
          
          
          if (r.out.res === 'cell') g.cellsMade = (g.cellsMade || 0) + r.out.kg;
        }
        




        if (r.power || r.ci) Sim.events.push({ kind: 'array', total: n.made, type: n.type });
        
        if (r.boost) Sim.events.push({ kind: 'fed', mul: Sim.plantMul(n), type: n.type });
      }
    }

    





    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.print) continue;
      S.fixGrade(n);                          
      const pl = Sim.printPlan(n);
      if (!pl) continue;
      

      if (Sim.printReady(n)) n.kwPool = (n.kwPool || 0) + (n.rateIn.kw || 0) * hours;
      

      n.raw['v:0'] = Sim.printReady(n) && pl.kw > 0 ? (n.rateIn.kw || 0) / pl.kw : 0;
      
      for (let guard = 0; guard < 64; guard++) {
        const p2 = Sim.printPlan(n);
        if (!p2 || !Sim.printReady(n)) break;
        if ((n.kwPool || 0) < p2.kw - U.EPS) break;
        n.buf.paper -= p2.paper;
        n.buf[p2.res] -= p2.kg;
        n.kwPool -= p2.kw;
        S.g.printed = S.g.printed || {};
        S.g.printed[p2.key] = (S.g.printed[p2.key] || 0) + 1;
        n.made = (n.made || 0) + 1;
        n.pulse = 1;
        if (p2.boost) {
          







          const b = Sim.boostById(p2.boost);
          if (t.print.stock !== false) {
            
            S.g.boostStock = S.g.boostStock || {};
            S.g.boostStock[p2.boost] = (S.g.boostStock[p2.boost] || 0) + 1;
          } else if (b && b.instant) Sim.fireInstant(b);
          else if (b) S.g.boosts[p2.boost] = Sim.boostDur();
          Sim.events.push({ kind: 'printed', boost: p2.boost, type: n.type,
                            stocked: t.print.stock !== false });
        } else {
          S.earn(t.print.gem.cur, p2.gem);
          g.gemsMade = (g.gemsMade || 0) + p2.gem;
          



          Sim.events.push({ kind: 'printed', boost: null, n: p2.gem, type: n.type });
        }
        Sim.invalidate();
      }
    }

    
    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.virtualOut || !t.processRate) continue;
      






      for (const side of Sim.sides(t)) {
        const def = Sim.sideDef(t, side);
        const vi  = side === 'B' ? 1 : 0;
        const buf = Sim.sideBuf(n, side);
        const fld = side === 'B' ? 'tillB' : 'till';
        const burns = t.virtualOut[vi].cur === 'ci';
        
























        const fire = (C.weather || {}).stormNeedsTill === false
          ? burns                                   
          : burns && !!def && def.burns !== false;
        if (fire && Sim.wx(n, 'burnRate') <= 0) { n.raw['v:' + vi] = 0; continue; }
        
        const till = def ? Sim.collectCap(t, n, side) : 0;
        if (def && (n[fld] || 0) >= till - U.EPS) { n.raw['v:' + vi] = 0; continue; }
        let budget = Sim.stat(t.id, 'processRate') * hours;
        




















        let roomVal = def ? Math.max(0, Sim.collectCap(t, n, side) - (n[fld] || 0)) : Infinity;
        let value = 0, kg = 0;
        for (const res of Sim.gradesByValue()) {
          if (budget <= 0 || roomVal <= 0) break;
          
          
          const unit = burns ? Sim.valueOfWx(t, res, n, 'burnValue', side) : Sim.valueOf(t, res, side);
          
          const fits = unit > 0 ? roomVal / unit : Infinity;
          const take = Math.min(buf[res] || 0, budget, fits);
          if (take <= 0) continue;
          buf[res] -= take;
          budget -= take;
          kg += take;
          value += take * unit;
          roomVal -= take * unit;
          
          if (res === 'metal') g.metalSold = (g.metalSold || 0) + take;
          
          if (t.id === 'tradingFloor' && (res === 'cell' || res === 'steel')) {
            (n.sold = n.sold || {})[res] = 1;
            if (n.sold.cell && n.sold.steel) g.soldPair = true;
          }
        }
        if (kg <= 0) continue;
        const cur = t.virtualOut[vi].cur;
        
        
        if (cur === 'ci') g.totalCleaned += kg;
        if (def) {
          









          const was = n[fld] || 0;
          n[fld] = Math.min(till, was + value);
          const banked = n[fld] - was;
          if (cur === 'ci') ciMade += banked; else if (cur === 'money') moneyMade += banked;
        } else if (cur === 'ci') {
          g.ci += value; g.totalCI += value; ciMade += value;
        } else {
          g.money += value; g.totalMoney += value; moneyMade += value;
        }
        n.raw['v:' + vi] = value / hours;
      }
    }

    



    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.autoCollect) continue;
      






      for (const side of Sim.sides(t)) {
        const def = Sim.sideDef(t, side);
        const fld = side === 'B' ? 'tillB' : 'till';
        if (!def || !(n[fld] > 0)) continue;
        
        
        if (def.cur === 'ci' && Sim.wx(n, 'burnRate') <= 0) continue;
        let rate = 0;
        for (const src of Sim.autoSources(t)) rate += (n.rateIn[src.port] || 0) * Sim.autoRate(t, src.port);
        if (rate <= 0) continue;
        const take = Math.min(n[fld], rate * hours);
        if (take <= 0) continue;
        n[fld] -= take;
        const cur = def.cur;
        S.earn(cur, take);
        

        if (cur === 'money') { g.totalMoney += take; }
        else { g.totalCI += take; g.totalBurns++; }
      }
    }

    













    for (const n of g.nodes) {
      let now = 0; for (const k in n.obuf) now += n.obuf[k] || 0;
      let pulled = 0;
      for (const k in n.raw) if (k.indexOf('out:') === 0) pulled += (n.raw[k] || 0) * hours;
      const made = now - (n.obufWas || 0) + pulled;
      if (made > 1e-9) n.raw.work = made / hours;
    }

    









    if (!Sim.catchingUp) for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      const A = t && t.gemArm;
      if (!A) continue;
      const cell = Sim.stat(t.id, 'bank');
      n.bank = Math.min(cell, (n.bank || 0) + (n.rateIn.wf || 0) * hours);
      const room = Sim.collectCap(t, n) - (n.till || 0);
      const a = n.arm;
      if (a) {
        a.t += dt;
        if (!a.grabbed && !a.empty && a.t >= a.dur / 2) {
          const gm = g.gem;
          if (gm && gm.loc === n.loc && gm.x === a.x && gm.y === a.y) {
            n.bank = Math.max(0, (n.bank || 0) - A.perGem);   
            g.gem = null;
            g.gemTimer = 0;
            g.gemsTaken = (g.gemsTaken || 0) + 1;
            g.totalDiamonds = (g.totalDiamonds || 0) + C.gem.reward;
            a.grabbed = true;
          } else a.empty = true;                      
        }
        if (a.t >= a.dur) {
          if (a.grabbed) {
            n.till = Math.min(Sim.collectCap(t, n), (n.till || 0) + C.gem.reward);
            Sim.events.push({ kind: 'gemCaught', loc: n.loc });
          }
          n.arm = null;
        }
      }
      if (room < C.gem.reward - U.EPS) continue;       
      



      if ((n.bank || 0) < A.perGem - U.EPS) continue;  
      const gm = g.gem;
      if (!n.arm && gm && gm.loc === n.loc && gm.x !== undefined) {
        const dist = Math.hypot(gm.x - n.x, gm.y - n.y);
        n.arm = { t: 0, dur: A.reachSec + dist / 1000 * A.perThousand, x: gm.x, y: gm.y };
      }
    }

    
    const alpha = 1 - Math.exp(-dt / C.sim.rateSmoothing);
    for (const n of g.nodes) {
      const keys = new Set(Object.keys(n.rates).concat(Object.keys(n.raw)));
      keys.forEach(k => {
        const target = n.raw[k] || 0;
        const cur = n.rates[k] || 0;
        n.rates[k] = Math.abs(target - cur) < 1e-6 ? target : cur + (target - cur) * alpha;
      });
      
      const target = n.grown !== undefined ? n.grown : n.reserve;
      if (target !== undefined) {
        n.shown = n.shown === undefined ? target
          : n.shown + (target - n.shown) * Math.min(1, dt * 3);
      }
    }

    











    for (let i = g.nodes.length - 1; i >= 0; i--) {
      const n = g.nodes[i], t = C.nodeTypes[n.type];
      if (n.reserve === undefined || !t.deplete) continue;
      if (n.reserve > U.EPS) { n.fade = 0; continue; }
      if ((n.shown || 0) > 0.5) continue;                
      if (!n.drained) {
        n.drained = true;
        





        if (t.countsDrained === false) {
          g.rocksDug = (g.rocksDug || 0) + 1;
          
          if (n.rare === 'rare') g.rareDug = (g.rareDug || 0) + 1;
          Sim.events.push({ kind: 'rockDug', loc: n.loc });
        } else {
          g.sitesDrained = (g.sitesDrained || 0) + 1;
          if (!t.vanishWhenEmpty) Sim.events.push({ kind: 'siteEmpty' });
        }
      }
      if (!t.vanishWhenEmpty) continue;                  
      










      if (S.onSiteMachines(n).length) { n.fade = 0; continue; }
      n.fade = (n.fade || 0) + dt;
      if (n.fade < t.fadeSec) continue;
      const res = S.removeSite(n);
      Sim.events.push({ kind: 'siteGone', machines: res.machines });
    }

    




    if (Sim.reviveOn() && C.revive.announce) {
      g.reviveSeen = g.reviveSeen || {};
      for (const L of C.locations) {
        if (!g.locSpawned || !g.locSpawned[L.id]) continue;
        const st = Sim.reviveStage(L.id);
        
        
        if (st <= (g.reviveSeen[L.id] || 0)) continue;
        g.reviveSeen[L.id] = st;
        Sim.events.push({ kind: 'revive', loc: L.id, name: L.name,
                          stage: st, of: Sim.reviveStages() });
      }
    }

    











    if (C.skillAlert && C.skillAlert.enabled && C.skillAlert.toast) {
      skillTellAcc += dt;
      if (skillTellAcc >= (C.skillAlert.checkSec || 0.5)) {
        skillTellAcc = 0;
        g.skillTold = g.skillTold || {};
        for (const sk of Sim.skillsInReach()) {
          if (g.skillTold[sk.id]) continue;
          g.skillTold[sk.id] = 1;
          Sim.events.push({ kind: 'skillReady', id: sk.id });
        }
      }
    }

    
    let expired = false;
    for (const id in g.boosts) {
      g.boosts[id] -= dt;
      if (g.boosts[id] <= 0) {
        delete g.boosts[id];
        expired = true;
        const b = Sim.boostById(id);
        Sim.events.push({ kind: 'boostEnd', name: b ? b.name : id });
      }
    }
    if (expired) Sim.invalidate();

    
    
    
    
    if (!g.gem && !(GG.tutor && GG.tutor.holdGem())) {
      g.gemTimer = (g.gemTimer || 0) + dt;
      if (g.gemTimer >= Sim.gemEvery()) {
        g.gemTimer = 0;
        g.gem = Sim.gemSpawn();
        Sim.events.push({ kind: 'gem' });
      }
    }

    
    
    
    
    
    let heatHold = false;
    Sim.wxLocs().forEach(function (loc) {
      const w = Sim.wxState(loc);
      if (w.flash > 0) w.flash = Math.max(0, w.flash - dt);
      if (w.heldNight && (w.left || 0) > 0) heatHold = true;
      



      if (S.g.gridDown && S.g.gridDown[loc] > 0) {
        S.g.gridDown[loc] = Math.max(0, S.g.gridDown[loc] - dt);
        if (S.g.gridDown[loc] === 0) Sim.events.push({ kind: 'gridUp', loc: loc });
      }
      if (!Sim.wxReady(loc)) return;
      



      if ((w.left || 0) > 0 && w.id && loc === g.loc && !Sim.catchingUp) {
        (g.wxWatched = g.wxWatched || {})[w.id] = true;
      }
      if ((w.left || 0) > 0) {
        w.left -= dt;
        if (w.left <= 0) Sim.clearWeather(loc);
      } else if (w.next) {
        
        w.nextLeft = (w.nextLeft || 0) - dt;
        if (w.nextLeft <= 0) {
          const id = w.next;
          w.next = null; w.nextLeft = 0;
          Sim.startWeather(id, loc);
        }
      } else {
        w.roll = (w.roll || 0) + dt;
        if (w.roll >= C.weather.rollSec) { w.roll = 0; Sim.rollWeather(loc); }
      }
    });
    

    if (heatHold && g.sunAt !== undefined && g.sunAt !== null) g.sunAt += dt;

    







    if ((C.asteroid || {}).enabled) {
      g.rockAt = g.rockAt || {};
      
      Sim.rockIntroTick(dt);
      Sim.rockLocs().forEach(function (e) {
        if (!Sim.rockOpen(e.loc)) return;
        g.rockAt[e.loc] = (g.rockAt[e.loc] || 0) + dt;
        if (g.rockAt[e.loc] < C.weather.rollSec) return;
        g.rockAt[e.loc] = 0;
        
        const ch = (e.chance || 0) > 0 ? e.chance + Sim.bonus('asteroid.chancePct') / 100 : 0;
        if (Math.random() < ch) Sim.rockDrop(e.loc);
      });
      


      if ((g.rockPull || 0) > 0) {
        g.rockPull -= dt;
        if (g.rockPull <= 0) {
          g.rockPull = 0;
          const at = g.rockPullLoc, within = g.rockPullWithin;
          const by = g.rockPullBy, paid = g.rockPullCost || 0, spot = g.rockPullAt;
          g.rockPullLoc = null;
          delete g.rockPullWithin; delete g.rockPullBy; delete g.rockPullCost; delete g.rockPullAt;
          const got = at ? Sim.rockDrop(at, { pulled: true, within: within || undefined, at: spot || undefined }) : null;
          

          if (!got && by) {
            const b = S.node(by);
            if (b && S.type(b).pullCost) {
              b.bank = Math.min(Sim.stat(b.type, 'bank'), (b.bank || 0) + paid);
              
              if (!Sim.catchingUp) Sim.events.push({ kind: 'rockMiss', loc: at });
            }
          }
        }
      }
    }

    



    



    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.pullCost) continue;
      n.bank = Math.min(Sim.stat(t.id, 'bank'), (n.bank || 0) + (n.rateIn.kw || 0) * hours);
      

      if (n.autoPull && Sim.beaconLocal() && Sim.beaconCheck(n).ok) {
        const r = Sim.beaconPull(n);
        if (r.ok && !Sim.catchingUp) Sim.events.push({ kind: 'rockCall', loc: n.loc });
      }
    }

    for (const n of g.nodes) {
      const t = C.nodeTypes[n.type];
      if (!t.predict) continue;
      const cap = Sim.stat(t.id, 'bank');
      n.bank = Math.min(cap, (n.bank || 0) + (n.rateIn.kw || 0) * hours);
      


      if (Sim.mastPaused(n)) continue;
      
      const loc = n.loc || C.locations[0].id;
      if (!Sim.wxPlace(loc)) continue;
      const w = Sim.wxState(loc);
      if (!w.next || n.sawSeq === w.nextSeq) continue;
      const cost = Sim.mastCost(t);
      if (n.bank < cost - U.EPS) continue;
      n.bank -= cost;
      n.sawSeq = w.nextSeq;
      n.pulse = 1;
      
      g.wxPredicted = g.wxPredicted || {};
      g.wxPredicted[w.next] = true;
      Sim.events.push({ kind: 'forecast', name: (Sim.wxEventById(w.next) || {}).name,
                        sec: Math.ceil(w.nextLeft || 0), loc: loc });
    }

    

    Sim.autoOpenAlt();

    





    const practising = !!(g && g.practice);
    
    if (!practising) markGoals();
    
    
    if (!practising) markStory();

    



    ciAccum += ciMade; moneyAccum += moneyMade; realWindow += dt;
    const rc = (C.ui && C.ui.rate) || { sampleSec: 0.4, smoothSec: 0 };
    if (realWindow >= rc.sampleSec) {
      const perHour = C.time.secondsPerGameHour / realWindow;
      const ci = ciAccum * perHour, mo = moneyAccum * perHour;
      
      const k = rc.smoothSec > 0 ? 1 - Math.exp(-realWindow / rc.smoothSec) : 1;
      Sim.ciPerHour += (ci - Sim.ciPerHour) * k;
      Sim.moneyPerHour += (mo - Sim.moneyPerHour) * k;
      




      









      if (C.ciWarn && C.ciWarn.enabled)
        S.g.ciLowSec = ci < 0 ? (S.g.ciLowSec || 0) + realWindow : 0;
      ciAccum = 0; moneyAccum = 0; realWindow = 0;
    }
  };

  


















  










  
  const SINCE_ANCHORS = ['lastBoostAt'];

  
  Sim.offlineRate = function () {
    return Math.max(0.01, C.offline.rate + Sim.bonus('offline.ratePct') / 100);
  };
  Sim.offlineBegin = function (awaySec) {
    const O = C.offline, g = S.g;
    if (!O || !(awaySec > 0) || !g.nodes) return null;
    const away = Math.min(awaySec, O.maxSec);
    if (away < O.minSec) return null;
    const rate = Sim.offlineRate();                    
    const simSec = away * rate;
    if (simSec <= 0) return null;

    const t0 = g.playtime;
    const squash = k => {
      for (const n of g.nodes) {
        if (Array.isArray(n.crew) && n.crew.length) {
          n.crew = n.crew.map(e => g.playtime + (e - g.playtime) * k);
        }
        if (n.runUntil > g.playtime) {
          n.runUntil = g.playtime + (n.runUntil - g.playtime) * k;
        }
        
        if (n.flightUntil > g.playtime) {
          n.flightUntil = g.playtime + (n.flightUntil - g.playtime) * k;
        }
        



      }
      for (const id in g.boosts) g.boosts[id] *= k;
    };
    squash(rate);

    const steps = Math.max(1, Math.min(O.maxSteps || Infinity, Math.ceil(simSec / O.step)));
    return {
      squash: squash, done: 0, steps: steps, step: simSec / steps,
      queued: (function () { const q = Sim.events; Sim.events = []; return q; })(),
      b: { ci: S.g.ci, money: S.g.money, gem: S.g.diamond,
           kg: S.g.totalCleaned, ci0: S.g.totalCI, money0: S.g.totalMoney },
      awaySec: awaySec, countedSec: away, simSec: simSec, t0: t0,
      rate: rate,        
    };
  };

  

  Sim.offlineStep = function (job, n) {
    if (!job) return true;
    const end = n === undefined ? job.steps : Math.min(job.steps, job.done + Math.max(1, n | 0));
    



    Sim.catchingUp = true;
    try {
      for (; job.done < end; job.done++) Sim.tick(job.step);
    } finally { Sim.catchingUp = false; }
    return job.done >= job.steps;
  };

  Sim.offlineEnd = function (job) {
    if (!job) return null;
    const g = S.g, O = C.offline, b = job.b;
    Sim.events = job.queued;
    job.squash(1 / (job.rate || O.rate));
    





    if (g.gridDown) Object.keys(g.gridDown).forEach(k => { g.gridDown[k] = 0; });
    















    const grew = g.playtime - job.t0;
    if (grew > 0) SINCE_ANCHORS.forEach(k => {
      g[k] = Math.min(g.playtime, (g[k] || 0) + grew);
    });
    Sim.invalidate();
    return {
      awaySec: job.awaySec, countedSec: job.countedSec, simSec: job.simSec,
      steps: job.steps, capped: job.awaySec > O.maxSec + 1,
      ci: g.totalCI - b.ci0, money: g.totalMoney - b.money0,
      kg: g.totalCleaned - b.kg, gem: g.diamond - b.gem,
      t0: job.t0,
    };
  };

  

  Sim.offline = function (awaySec) {
    const job = Sim.offlineBegin(awaySec);
    if (!job) return null;
    Sim.offlineStep(job);
    return Sim.offlineEnd(job);
  };

  
  Sim.skillById = function (id) { return C.skills.find(s => s.id === id); };
  Sim.maxLevel = function (sk) { return sk.maxLevel || 1; };
  Sim.costOf = function (sk, level) {
    if (sk.costs) return sk.costs[Math.min(level, sk.costs.length - 1)];
    return sk.cost;
  };
  Sim.nextCost = function (sk) { return Sim.costOf(sk, S.skillLevel(sk.id)); };
  Sim.isMaxed = function (sk) { return S.skillLevel(sk.id) >= Sim.maxLevel(sk); };

  





  Sim.skillGate = function (sk) {
    if (sk.gate) {
      const g = C.nodeTypes[sk.gate];
      if (g && !S.isUnlocked(sk.gate)) return g.name;
    }
    for (const e of (sk.effects || [])) {
      const tid = e.stat.split('.')[0];
      const nt = C.nodeTypes[tid];
      if (nt && nt.buildable && !S.isUnlocked(tid)) return nt.name;
    }
    return null;
  };

  






  














  let demoCache = null;
  function demoMap() {
    if (demoCache) return demoCache;
    const d = C.demo, order = (C.ciPricing && C.ciPricing.order) || [];
    const full = !!(S.g && S.g.fullGame);
    const cut = (d && d.enabled && !full) ? order.indexOf(d.lastCi) : -1;
    const ci = {}, nodes = {}, money = {};
    if (cut >= 0) {
      for (let i = cut + 1; i < order.length; i++) {
        ci[order[i]] = true;
        const sk = C.skills.find(x => x.id === order[i]);
        (sk && sk.unlocks || []).forEach(function (id) { nodes[id] = true; });
      }
      











      Object.keys(C.nodeTypes).forEach(function (id) {
        if (C.nodeTypes[id].demo === false) nodes[id] = true;
      });
      






      C.skills.forEach(function (sk) {
        if ((sk.tree || 'ci') !== 'money') return;
        

        if (sk.demo === false) { money[sk.id] = true; return; }
        if (sk.gate) { if (nodes[sk.gate]) money[sk.id] = true; return; }
        const ids = [];
        (sk.effects || []).forEach(function (e) {
          const tid = e.stat.split('.')[0];
          if (C.nodeTypes[tid] && C.nodeTypes[tid].buildable) ids.push(tid);
        });
        if (ids.length && ids.every(function (id) { return nodes[id]; })) money[sk.id] = true;
      });
    }
    




    const res = {};
    if (cut >= 0) {
      const madeBy = {};
      Object.keys(C.nodeTypes).forEach(function (id) {
        const t = C.nodeTypes[id];
        function put(r) { if (r) (madeBy[r] = madeBy[r] || []).push(id); }
        (((t.ports || {}).out) || []).forEach(function (p) {
          put(p.res);
          







          if (p.poolRes) Object.keys(C.nodeTypes).forEach(function (sid) {
            const st = C.nodeTypes[sid];
            if (st.kind === 'site' && st.water) put(st.water);
          });
        });
        if (t.outPerKg) put(t.outPerKg.res);
        if (t.outPerCI) put(t.outPerCI.res);
        if (t.convert && t.convert.out) put(t.convert.out.res);
        if (t.recipe && t.recipe.out) put(t.recipe.out.res);
      });
      Object.keys(C.resources).forEach(function (r) {
        if (C.resources[r].flow !== 'material') return;
        const p = madeBy[r] || [];
        if (p.length && p.every(function (id) { return nodes[id]; })) res[r] = true;
      });
    }
    demoCache = { cut: cut, ci: ci, nodes: nodes, money: money, res: res };
    return demoCache;
  }
  Sim.demoReset = function () { demoCache = null; };
  Sim.demoOn = function () { return demoMap().cut >= 0; };
  
  









  Sim.adoptGrade = function (n) {
    const t = C.nodeTypes[n.type];
    if (!t || !t.mergeLock || (C.ui || {}).gradeFollowsCargo === false) return;
    const held = Object.keys(n.buf || {}).filter(r => (n.buf[r] || 0) > 1e-9);
    if (held.length === 1 && n.grade !== held[0]) n.grade = held[0];
  };

  Sim.demoLocked = function (sk) {
    const id = (typeof sk === 'string') ? sk : (sk && sk.id);
    const m = demoMap();
    return !!(m.ci[id] || m.money[id]);
  };
  




  Sim.demoNode = function (typeId) {
    const t = C.nodeTypes[typeId];
    if (t && t.demo === false && Sim.demoOn()) return true;
    return !!demoMap().nodes[typeId];
  };
  Sim.demoRes = function (resId) { return !!demoMap().res[resId]; };
  


  Sim.demoLoc = function (locId) {
    const L = (C.locations || []).find(function (x) { return x.id === locId; });
    return !!(L && L.requires && Sim.demoLocked(L.requires));
  };
  



  Sim.demoGoal = function (o) { return Sim.demoOn() && o && o.demo === false; };

  








  Sim.goalOff = function (o) { return !!(o && o.off === true); };
  


  Sim.goalHidden = function (o) { return Sim.goalOff(o) || Sim.demoGoal(o); };

  












  Sim.goalMachine = function (o) {
    const id = typeof o === 'string' ? o : (o && o.id);
    if (!id) return null;
    for (const k in C.nodeTypes) {
      const t = C.nodeTypes[k];
      if (t.trial === id) return Sim.demoNode(t.id) ? null : t;
    }
    return null;
  };

  







  Sim.trialMachines = function () {
    for (const k in C.nodeTypes) {
      const t = C.nodeTypes[k];
      if (t.trial && Sim.goalMachine(t.trial)) return true;
    }
    return false;
  };

  Sim.skillAvailable = function (sk) {
    if (Sim.isMaxed(sk)) return false;
    if (Sim.demoLocked(sk)) return false;      
    if (Sim.skillGate(sk)) return false;
    



    if (Sim.altRescue(sk)) return true;
    return (sk.req || []).every(r => S.hasSkill(r));
  };

  






  Sim.skillsInReach = function () {
    const A = C.skillAlert;
    if (!A || !A.enabled) return [];
    const out = [];
    for (const sk of C.skills) {
      const money = (sk.currency || 'ci') === 'money';
      if (money && !A.money) continue;
      if (!Sim.skillAvailable(sk)) continue;
      if (Sim.altUnlocked(sk)) { out.push(sk); continue; }   
      const have = money ? S.g.money : S.g.ci;
      if (U.canAfford(have, Sim.nextCost(sk))) out.push(sk);
    }
    return out;
  };

  Sim.buySkill = function (id) {
    const sk = Sim.skillById(id);
    if (!sk) return { ok: false, why: 'Unknown skill' };
    if (Sim.isMaxed(sk)) return { ok: false, why: 'Already at max level' };
    if (Sim.demoLocked(sk)) return { ok: false, why: 'Not in this build yet' };
    const gate = Sim.skillGate(sk);
    if (gate) return { ok: false, why: 'Unlock the ' + gate + ' first' };
    if (!Sim.skillAvailable(sk)) return { ok: false, why: 'Locked' };
    const cur = sk.currency || 'ci';
    const cost = Sim.nextCost(sk);
    const have = cur === 'money' ? S.g.money : S.g.ci;
    const free = Sim.altUnlocked(sk);          
    if (!free && !U.canAfford(have, cost)) {
      return { ok: false, why: 'Not enough ' + C.currencies[cur].short };
    }
    



    const fx = C.levelFx || {};
    const before = fx.enabled ? statSnapshot(sk) : null;

    
    if (cur === 'money' && !free) S.g.money = U.pay(S.g.money, cost);
    S.g.skills[id] = S.skillLevel(id) + 1;
    Sim.invalidate();
    
    S.ensureLocations();

    const res = { ok: true, skill: sk, level: S.skillLevel(id), cost: cost, currency: cur, free: free };
    if (before) {
      res.deltas = Sim.levelDeltas(sk, before, statSnapshot(sk));
      res.targets = Sim.skillTargets(sk);
    }
    return res;
  };

  const FIELD_LABELS = {
    clickYield: 'kg per click', buffer: 'buffer', kgPerWF: 'kg/h per WF/h',
    wfRate: 'workforce', energyRate: 'energy', intakeRate: 'wire intake',
    processRate: 'throughput', ciPerEntry: 'yield',
    ciPerWF: 'CI per WF/h', ciPerKW: 'CI per KW/h', ciPerKg: 'CI per kg burned',
    store: 'charge', need: 'recruit cost',
    
    kwPerKg: 'energy per kg', licence: 'a shift costs', blockChance: 'grid spared',
    




    ciPerKw: 'CI spent per KW/h', pumpPerKw: 'water per KW/h',
    


    maxKw: 'most power it uses',
    


    kwPerWf: 'power per WF/h', bank: 'charge cell',
    interestPct: 'interest a minute',     
    
    returnBonus: 'CI on water put back', byKg: 'oil per kg cleaned',
  };
  Sim.FIELD_LABELS = FIELD_LABELS;

  

  const FIELD_UNITS = {
    wfRate: 'WF/h', energyRate: 'KW/h', store: 'KW', kgPerWF: 'kg/h',
    ciPerWF: 'CI/h', ciPerKW: 'CI/h', ciPerKg: 'CI', ciPerEntry: 'CI',
    intakeRate: 'KW/h', processRate: 'kg/h',
    kwPerKg: 'KW/h', licence: 'CI',
    ciPerKw: 'CI', pumpPerKw: 'kg',
    



    buffer: 'kg',
    maxKw: 'KW/h',
    kwPerWf: 'KW/h', bank: 'KW',
    interestPct: '%',
    returnBonus: '%', byKg: 'kg',
  };

  function statLabel(stat) {
    const parts = stat.split('.');
    
    if (parts[1] === 'value') {
      const res = C.resources[parts[2]];
      return (res ? res.name : parts[2]) + ' ' + GG.i18n.t('sk.value');
    }
    if (parts[1] === 'collect') return GG.i18n.t('sk.tillCap');
    




    if (parts[1] === 'hire') {
      if (parts[2] === 'sec') return GG.i18n.t('sk.shiftLen');
      if (parts[2] === 'maxSec') return GG.i18n.t('sk.longestShift');
      return GG.i18n.t('sk.handsAtOnce');
    }
    if (parts[1] === 'need') return GG.i18n.t(parts[2] === 'kw' ? 'sk.kwPerRecruit' : 'sk.wfPerRecruit');
    

    if (parts[1] === 'overdrive') return GG.i18n.t('sk.odDrain');
    
    
    
    if (parts[1] === 'recipe' && parts[2] !== 'ci') {
      const res = C.resources[parts[2] === 'kw' ? 'energy' : parts[2]];
      return (res ? res.name : parts[2]) + ' ' + GG.i18n.t('sk.perBatch');
    }
    



    if (parts[1] === 'powerUp') {
      if (parts[2] === 'kg') return GG.i18n.t('sk.kitPerLoad');
      return GG.i18n.t('sk.powerMul');
    }
    
    if (parts[1] === 'convert' && parts[2] === 'ci') return GG.i18n.t('sk.ciPerKgBuried');  
    
    if (parts[0] === 'bank' && parts[1] === 'buffer') return GG.i18n.t('sk.goldHeld');
    if (parts[1] === 'convert') {
      const res = C.resources[parts[2]];
      return (res ? res.name : parts[2]) + ' ' + GG.i18n.t('sk.perKgMade');
    }
    
    if (parts[1] === 'auto') {
      return GG.i18n.t('sk.banked') + ' ' + (parts[2] === 'kw' ? 'KW/h' : 'WF/h');
    }
    if (parts[1] === 'leadSec') return GG.i18n.t('sk.warnLead');
    if (parts[1] === 'fission') return GG.i18n.t('sk.reactorKw');     
    
    if (parts[1] === 'print') return C.resources.energy.name + ' ' + GG.i18n.t('sk.perPrint');
    
    if (parts[1] === 'flight') return GG.i18n.t(parts[2] === 'sec' ? 'sk.flightTime' : 'sk.metalPerFlight');
    if (parts[1] === 'recipe' && parts[2] === 'ci') return GG.i18n.t('sk.ciPerDome');
    
    const EV = { 'asteroid.chancePct': 'sk.rockChance', 'asteroid.rarePct': 'sk.rareChance',
                 'asteroid.kg': 'sk.rockKg', 'asteroid.maxDown': 'sk.rockMax',
                 'solarPanel.duty': parts[2] === 'offSec' ? 'sk.nightLen' : 'sk.dayLen',
                 'gem.everySec': 'sk.gemEvery', 'boost.sec': 'sk.boostLen',
                 'offline.ratePct': 'sk.offlineRate' }[parts[0] + '.' + parts[1]];
    if (EV) return GG.i18n.t(EV);
    const lab = FIELD_LABELS[parts[1]];
    return lab ? GG.i18n.t('sk.f.' + parts[1]) : parts[1];
  }

  

  function statUnit(stat) {
    const parts = stat.split('.');
    if (parts[1] === 'value') {
      const t = C.nodeTypes[parts[0]];
      const cur = t && t.virtualOut ? t.virtualOut[0].cur : null;
      return cur ? C.currencies[cur].short + '/kg' : '/kg';
    }
    if (parts[1] === 'collect') {
      const t = C.nodeTypes[parts[0]];
      return t && t.collect ? C.currencies[t.collect.cur].short : '';
    }
    
    if (parts[1] === 'auto') {
      const t = C.nodeTypes[parts[0]];
      return t && t.collect ? C.currencies[t.collect.cur].short : '';
    }
    
    
    if (parts[1] === 'recipe') {
      if (parts[2] === 'ci') return 'CI/h';
      return parts[2] === 'wf' ? 'WF' : (parts[2] === 'kw' ? 'KW' : 'kg');
    }
    if (parts[1] === 'convert') return parts[2] === 'wf' ? 'WF/h' : (parts[2] === 'ci' ? 'CI' : 'kg');
    
    if (parts[1] === 'powerUp') return '';
    if (parts[1] === 'leadSec') return 's';
    if (parts[1] === 'fission') return 'KW/h';                         
    if (parts[1] === 'print') return 'KW';                             
    if (parts[1] === 'flight') return parts[2] === 'metal' ? 'kg' : '';    
    
    if (/Pct$/.test(parts[1])) return '%';
    if (parts[0] === 'asteroid' && parts[1] === 'kg') return 'kg';
    if (parts[1] === 'duty' || parts[1] === 'everySec' || (parts[0] === 'boost' && parts[1] === 'sec')) return 's';
    
    if (parts[1] === 'hire' && (parts[2] === 'sec' || parts[2] === 'maxSec')) return 's';
    return FIELD_UNITS[parts[1]] || '';
  }

  Sim.describeEffects = function (sk) {
    const out = [];
    const lvl = S.skillLevel(sk.id);
    
    const per = Sim.maxLevel(sk) > 1 ? ' ' + GG.i18n.t('sk.perLevel') : '';
    (sk.effects || []).forEach(e => {
      if (e.quiet) return;   
      













      const rid = /^market\.value\.(\w+)$/.exec(e.stat);
      if (rid && Sim.demoRes && Sim.demoRes(rid[1])) return;
      const tid = e.stat.split('.')[0];
      









      if (Sim.demoNode && Sim.demoNode(tid)) return;
      
      const NM = { asteroid: 'sk.meteors', gem: 'sk.diamonds', boost: 'sk.boosts', offline: 'sk.away' };
      const tn = C.nodeTypes[tid] ? C.nodeTypes[tid].name
        : (tid === 'swipe' ? GG.i18n.t('sk.handSweep') : (tid === 'plant' ? GG.i18n.t('sk.handPlant')
          : (NM[tid] ? GG.i18n.t(NM[tid]) : tid)));
      const label = statLabel(e.stat);
      if (e.op === 'mul') {
        const pct = Math.round((e.value - 1) * 100);
        
        out.push(tn + ': ' + label + ' ' + (pct < 0 ? '' : '+') + pct + '%' + per);
        if (lvl > 0) {
          out.push(GG.i18n.t('sk.now') + ' ×' + GG.util.fmt(Math.pow(e.value, lvl), 2) +
            (Sim.isMaxed(sk) ? '' : ' → ×' + GG.util.fmt(Math.pow(e.value, lvl + 1), 2)));
        }
      } else {
        
        
        




        const unit = GG.i18n.ins(statUnit(e.stat));
        





        const sign = v => (v < 0 ? '' : '+') + GG.util.small(v) + (unit ? ' ' + unit : '');
        const each = sign(e.value);
        out.push(tn + ': ' + label + ' ' + each + per);
        if (lvl > 0) {
          out.push(GG.i18n.t('sk.now') + ' ' + sign(e.value * lvl) +
            (Sim.isMaxed(sk) ? '' : ' → ' + sign(e.value * (lvl + 1))));
        }
      }
    });
    (sk.unlocks || []).forEach(u => {
      const t = C.nodeTypes[u];
      if (t && t.buildable) out.push(GG.i18n.t('sk.unlocks') + ' ' + t.name);
    });

    Object.keys(C.nodeTypes).forEach(tid => {
      const t = C.nodeTypes[tid];
      ((t.ports && t.ports.in) || []).forEach(p => {
        if (p.requires === sk.id) out.push(t.name + ': ' + GG.i18n.t('sk.gains').replace('%r', C.resources[p.res].name));
      });
    });
    return out;
  };

  















  Sim.statNow = function (stat) {
    const parts = stat.split('.');
    const tid = parts[0], field = parts[1];
    if (tid === '*') return null;            
    const t = C.nodeTypes[tid];
    const label = statLabel(stat), unit = statUnit(stat);
    const wrap = v => (typeof v === 'number' && isFinite(v)) ? { value: v, label: label, unit: unit } : null;

    
    if (field === 'value')   return (t && parts[2]) ? wrap(Sim.valueOf(t, parts[2])) : null;
    if (field === 'collect') return (t && t.collect) ? wrap(Sim.collectCap(t)) : null;
    if (field === 'licence') return (t && t.licence) ? wrap(Sim.licenceCost(t)) : null;
    if (field === 'fission') return (t && t.fission) ? wrap(Sim.reactorKw(t)) : null;   
    if (field === 'hire') {
      if (!t || !t.hire) return null;
      const n = { type: tid };
      if (parts[2] === 'max')    return wrap(Sim.hireMax(n));
      if (parts[2] === 'sec')    return wrap(Sim.hireSec(n));
      if (parts[2] === 'maxSec') return wrap(Sim.hireMaxSec(n));
      return null;
    }
    
    if (field === 'need') return t ? wrap(Sim.recruitNeed({ type: tid, recruits: 0 }, parts[2])) : null;
    


    if (field === 'recipe') {
      if (!t || !t.recipe) return null;
      
      
      
      
      if (parts[2] === 'wf') return wrap(Sim.recipeWf({ type: tid }));
      if (parts[2] === 'kw') return wrap(Sim.recipeKw({ type: tid, made: 0 }));
      return wrap(Sim.recipeNeed({ type: tid, made: 0 }, parts[2]));
    }
    


    



    


    if (field === 'powerUp') {
      if (!t || !t.powerUp) return null;
      if (parts[2] === 'kg') return wrap(Sim.powerLoad({ type: tid, made: 0 }));
      return wrap(Sim.powerMulOf(tid));
    }
    if (field === 'convert') {
      if (!t || !t.convert) return null;
      if (parts[2] === 'wf') return wrap(Sim.convWf({ type: tid }));
      return wrap(Sim.convNeed({ type: tid }, parts[2]));
    }
    
    
    if (field === 'auto') return t ? wrap(Sim.autoRate(t, parts[2])) : null;
    if (field === 'leadSec') return (t && t.predict) ? wrap(Sim.predictLead()) : null;
    
    if (field === 'returnBonus') return t ? wrap(Sim.bonus(stat)) : null;
    if (field === 'byKg') return (t && t.outPerKg) ? wrap(t.outPerKg.kg + Sim.bonus(stat)) : null;

    
    const src = statSource(tid);
    if (!src || typeof src[field] !== 'number') return null;
    return wrap(Sim.stat(tid, field));
  };

  



  Sim.statOwner = function (tid) {
    const t = C.nodeTypes[tid];
    if (t) return { name: t.name, icon: t.icon, color: t.color };
    if (tid === 'swipe')   return { name: GG.i18n.t('sk.handSweep'),  icon: 'player' };
    if (tid === 'plant')   return { name: GG.i18n.t('sk.handPlant'),  icon: 'tree' };
    if (tid === 'weather') return { name: GG.i18n.t('sk.weatherStat'), icon: 'storm' };
    return { name: tid, icon: 'plus' };
  };

  



  Sim.skillTargets = function (sk) {
    const out = Sim.boostNodes({ effects: sk.effects || [] });
    Object.keys(C.nodeTypes).forEach(function (k) {
      const vg = C.nodeTypes[k].valueGroup;
      if (vg && out.indexOf(vg) >= 0 && out.indexOf(k) < 0) out.push(k);
    });
    return out;
  };

  

  function statSnapshot(sk) {
    const snap = {};
    (sk.effects || []).forEach(function (e) {
      if (snap[e.stat] === undefined) snap[e.stat] = Sim.statNow(e.stat);
    });
    return snap;
  }

  

  Sim.levelDeltas = function (sk, before, after) {
    const rows = [];
    (sk.effects || []).forEach(function (e) {
      const a = before[e.stat], b = after[e.stat];
      if (!a || !b || Math.abs(b.value - a.value) < 1e-12) return;
      if (rows.some(r => r.stat === e.stat)) return;
      const tid = e.stat.split('.')[0];
      rows.push({
        stat: e.stat,
        node: Sim.statOwner(tid).name,
        label: b.label, unit: b.unit,
        from: a.value, to: b.value,
        up: b.value > a.value,
      });
    });
    return rows;
  };
})(window.GG);
