






































(function (GG) {
  const C = GG.config, S = GG.state, Sim = GG.sim, I = GG.i18n, U = GG.util;
  const P = {};
  GG.practice = P;

  

  P.active = false;
  

  P.typeId = null;

  let snapshot = null;          
  let bar = null;               
  let room = null;              
  let runSpeed = 1;             
  P.state = null;               

  function cfg() { return C.practice || {}; }
  

  function snd(id) { try { if (GG.audio) GG.audio.play(id); } catch (e) {} }
  P.on = function () { return cfg().enabled !== false; };
  
  P.locked = function () { return P.active && cfg().locked !== false; };

  










  
  P.recommend = function (typeId) {
    const r = cfg().recommend;
    if (!r || r.enabled === false) return null;
    if ((r.top || []).indexOf(typeId) >= 0) return 'top';
    if ((r.good || []).indexOf(typeId) >= 0) return 'good';
    return null;
  };
  
  P.tryFace = function (typeId) {
    const lv = P.recommend(typeId);
    return '<span>' + I.t('practice.try') + '</span>' + (lv ? '<span class="pr-rec ' + lv + '">' +
      I.t(lv === 'top' ? 'practice.recTop' : 'practice.recGood') + '</span>' : '');
  };

  P.canPractise = function (typeId) {
    if (!P.on()) return false;
    const t = C.nodeTypes[typeId];
    if (!t || t.kind !== 'machine' || t.buildable === false) return false;
    if (!S.isUnlocked(typeId)) return false;
    if ((cfg().noRoom || []).indexOf(typeId) >= 0) return false;      
    
    if (sceneOf(typeId)) return true;
    








    if (t.placement === 'onSite' || t.weatherOnly) return false;
    const ins = ((t.ports && t.ports.in) || [])
      .filter(function (p) { return !(t.powerUp && t.powerUp.port === p.id); });
    return ins.length > 0;
  };

  

  

  function makeRoom(typeId) {
    const g = S.freshGame();
    


    g.locSpawned = {};
    C.locations.forEach(function (L) { g.locSpawned[L.id] = true; });
    

    const sc = sceneOf(typeId);
    g.loc = (sc && sc.loc) || C.locations[0].id;
    if (sc && sc.loc) { g.rockIntroDone = {}; g.rockIntroDone[sc.loc] = true; }
    


    const ft = C.nodeTypes[typeId];
    if (ft && ft.fuelSwitch && S.g && S.g.objectives && S.g.objectives[ft.fuelSwitch]) {
      g.objectives = g.objectives || {};
      g.objectives[ft.fuelSwitch] = 1;
    }
    

    g.fullGame = !!(S.g && S.g.fullGame);
    

    g.tutorDone = true;
    g.tutorSkipped = true;
    g.name = '';
    g.practice = true;          
    return g;
  }

  

  










  function furnish(g, typeId) {
    const t = C.nodeTypes[typeId];
    if (!t || !S.makeNode) return null;
    
    const fuelAlt = !!(room && room.fuelAlt);
    const sc = sceneOf(typeId);
    if (sc) {
      const m = furnishScene(g, typeId, sc);
      if (room) room.fuelAlt = fuelAlt;
      return m;
    }
    const L = (cfg().layout || {});
    const inX = L.inX === undefined ? -430 : L.inX;
    const outX = L.outX === undefined ? 430 : L.outX;
    const gapY = L.gapY === undefined ? 200 : L.gapY;

    const main = S.makeNode(typeId, 0, 0, g, g.loc);
    g.nodes.push(main);
    if (fuelAlt) main.fuelMode = 'alt';     

    const ins = S.portsOf(main, 'in').filter(function (q) {
      return !(t.powerUp && q.id === t.powerUp.port);
    });
    const outs = S.portsOf(main, 'out');

    const spread = function (list, x, make) {
      const top = -((list.length - 1) * gapY) / 2;
      list.forEach(function (q, i) { make(q, x, top + i * gapY); });
    };

    const feeds = [];
    spread(ins, inX, function (q, x, y) {
      




      const kind = q.res === 'energy' ? 'kw' : (q.res === 'wf' ? 'wf' : 'kg');
      const type = kind === 'kw' ? 'pracPower' : (kind === 'wf' ? 'pracCrew' : 'pracFeed');
      const n = S.makeNode(type, x, y, g, g.loc);
      n.pracRes = q.res;
      if (kind !== 'kg') n.pracRate = 0;   
      g.nodes.push(n);
      S.link(n.id, kind === 'kg' ? 'out' : kind, main.id, q.id);
      feeds.push({ node: n, port: q, kind: kind });
    });

    




    const kit = kitOf(t);
    let consumer = null;
    const extra = [];
    spread(outs, outX, function (q, x, y) {
      
      if (q.virtual) return;
      if (kit && q.id === kit.port.id) {
        const ct = kit.type;
        



        const kp = ((ct.ports && ct.ports.in) || []).find(function (p) { return p.id === ct.powerUp.port; });
        if (kp && kp.requires) { g.skills = g.skills || {}; g.skills[kp.requires] = true; Sim.invalidate(); }
        consumer = S.makeNode(ct.id, x, y, g, g.loc);
        g.nodes.push(consumer);
        S.link(main.id, q.id, consumer.id, ct.powerUp.port);
        const cx = x + (outX - inX) / 2;
        S.portsOf(consumer, 'out').forEach(function (co, i) {
          if (co.virtual) return;
          const d = S.makeNode('pracDrain', cx, y + i * gapY, g, g.loc);
          d.pracRes = co.res;
          g.nodes.push(d);
          S.link(consumer.id, co.id, d.id, 'in');
        });
        

        S.portsOf(consumer, 'in').forEach(function (ci) {
          if (ci.id === ct.powerUp.port || ci.res !== 'energy') return;
          const pw = S.makeNode('pracPower', x, y + gapY, g, g.loc);
          pw.pracRes = ci.res;
          pw.pracRate = 2 * (Sim.stat(ct.id, 'wfRate') || 1) * (Sim.stat(ct.id, 'kwPerWf') || 1);
          g.nodes.push(pw);
          S.link(pw.id, 'kw', consumer.id, ci.id);
          extra.push(pw.id);
        });
        return;
      }
      const n = S.makeNode('pracDrain', x, y, g, g.loc);
      n.pracRes = q.res;
      g.nodes.push(n);
      S.link(main.id, q.id, n.id, 'in');
    });

    room = { main: main.id, feeds: feeds, typeId: typeId, fuelAlt: fuelAlt,
             consumer: consumer ? consumer.id : null, extra: extra,
             

             wires: JSON.parse(JSON.stringify(g.links)) };
    return main;
  }

  




  function sceneOf(typeId) { return (cfg().scenes || {})[typeId] || null; }

  function furnishScene(g, typeId, sc) {
    if (sc.kind === 'battery') return furnishBattery(g, typeId, sc);
    if (sc.kind) return furnishKind(g, typeId, sc);
    const L = cfg().layout || {};
    const inX = L.inX === undefined ? -430 : L.inX;
    const outX = L.outX === undefined ? 430 : L.outX;
    const gapY = L.gapY === undefined ? 200 : L.gapY;
    const kindOf = function (res) { return res === 'energy' ? 'kw' : 'wf'; };
    const feedOf = function (kind) { return kind === 'kw' ? 'pracPower' : 'pracCrew'; };
    const portFor = function (n, res) {
      return S.portsOf(n, 'in').find(function (p) { return p.res === res; });
    };

    


    [typeId, sc.prio, sc.other].forEach(function (id) {
      ((C.nodeTypes[id].ports || {}).in || []).forEach(function (p) {
        if (p.requires) { g.skills = g.skills || {}; g.skills[p.requires] = true; }
      });
    });
    Sim.invalidate();

    const main = S.makeNode(typeId, 0, 0, g, g.loc);
    g.nodes.push(main);
    const inP = S.portsOf(main, 'in')[0];
    const res = inP.res, kind = kindOf(res);
    const feed = S.makeNode(feedOf(kind), inX, 0, g, g.loc);
    feed.pracRes = res; feed.pracRate = 0;
    g.nodes.push(feed);
    S.link(feed.id, kind, main.id, inP.id);
    const feeds = [{ node: feed, port: inP, kind: kind, role: 'main' }];

    
    const a = S.makeNode(sc.prio, outX, -gapY, g, g.loc);
    g.nodes.push(a);
    S.link(main.id, 'a', a.id, portFor(a, res).id);
    S.portsOf(a, 'in').forEach(function (p, i) {
      if (p.res === res || (p.res !== 'energy' && p.res !== 'wf')) return;
      const k = kindOf(p.res);
      const tr = S.makeNode(feedOf(k), 0, -gapY * 1.6 - i * gapY * 0.5, g, g.loc);
      tr.pracRes = p.res; tr.pracRate = 0;
      g.nodes.push(tr);
      S.link(tr.id, k, a.id, p.id);
      feeds.push({ node: tr, port: p, kind: k, role: 'trickle' });
    });

    
    const bt = C.nodeTypes[sc.other];
    let site = null, bx = outX, by = gapY * 1.1;
    if (bt.placement === 'onSite') {
      site = S.addSite(S.siteTypes(bt)[0], outX, by, g.loc);
      const slot = site && S.freeSlot(site, site.x, site.y);
      if (slot) { bx = slot.x; by = slot.y; }
    }
    const b = S.makeNode(sc.other, bx, by, g, g.loc);
    g.nodes.push(b);
    S.link(main.id, 'b', b.id, portFor(b, res).id);
    S.portsOf(b, 'out').forEach(function (q, i) {
      if (q.virtual || (C.resources[q.res] || {}).flow !== 'material') return;
      const d = S.makeNode('pracDrain', outX * 2, (site ? site.y : by) + i * gapY, g, g.loc);
      d.pracRes = q.res;
      g.nodes.push(d);
      S.link(b.id, q.id, d.id, 'in');
    });

    room = { main: main.id, feeds: feeds, typeId: typeId, consumer: null, extra: [],
             scene: sc, res: res, sideA: a.id, sideB: b.id, site: site ? site.id : null,
             wires: JSON.parse(JSON.stringify(g.links)) };
    fillScenePool();
    return main;
  }

  



  function furnishBattery(g, typeId, sc) {
    const L = cfg().layout || {};
    const inX = L.inX === undefined ? -430 : L.inX;
    const outX = L.outX === undefined ? 430 : L.outX;
    const gapY = L.gapY === undefined ? 200 : L.gapY;
    const main = S.makeNode(typeId, 0, 0, g, g.loc);
    g.nodes.push(main);
    const pw = S.makeNode('pracPower', inX, 0, g, g.loc);
    pw.pracRes = 'energy'; pw.pracRate = 0;
    g.nodes.push(pw);
    S.link(pw.id, 'kw', main.id, S.portsOf(main, 'in')[0].id);

    const ct = C.nodeTypes[sc.consumer];
    const con = S.makeNode(ct.id, outX, 0, g, g.loc);
    g.nodes.push(con);
    const cin = S.portsOf(con, 'in');
    const kwIn = cin.find(function (p) { return p.res === 'energy'; });
    S.link(main.id, S.portsOf(main, 'out')[0].id, con.id, kwIn.id);
    const kg = cfg().supplyKg || 20;
    cin.forEach(function (p) {
      if (p.res === 'energy') return;
      const f = S.makeNode('pracFeed', outX - 60, -gapY, g, g.loc);
      f.pracRes = p.res; f.pracMul = (sc.kgPerHour || kg) / kg;
      g.nodes.push(f);
      S.link(f.id, 'out', con.id, p.id);
    });
    S.portsOf(con, 'out').forEach(function (q, i) {
      if (q.virtual) return;
      const d = S.makeNode('pracDrain', outX * 2, (i - 0.5) * gapY, g, g.loc);
      d.pracRes = q.res;
      g.nodes.push(d);
      S.link(con.id, q.id, d.id, 'in');
    });
    const want = (sc.kgPerHour || kg) * (Sim.stat(ct.id, 'energyPerKg') || 1);
    room = { main: main.id, feeds: [{ node: pw, kind: 'kw', role: 'cycle' }], typeId: typeId,
             consumer: null, extra: [], scene: sc, battery: true, power: pw.id, sideB: con.id,
             want: want, supply: want * (sc.supplyMul || 2), clock: 0, reserve: 'use',
             wires: JSON.parse(JSON.stringify(g.links)) };
    main.outMul = null;          
    pw.pracRate = room.supply;   
    return main;
  }
  
  function lay() {
    const L = cfg().layout || {};
    return { inX: L.inX === undefined ? -430 : L.inX, outX: L.outX === undefined ? 430 : L.outX,
             gapY: L.gapY === undefined ? 200 : L.gapY };
  }
  function put(g, type, x, y) { const n = S.makeNode(type, x, y, g, g.loc); g.nodes.push(n); return n; }
  function feed(g, type, res, x, y, to, port) {
    const n = put(g, type, x, y);
    n.pracRes = res;
    S.link(n.id, type === 'pracFeed' ? 'out' : (type === 'pracPower' ? 'kw' : 'wf'), to.id, port);
    return n;
  }
  
  function drains(g, n, x, y0, gapY) {
    S.portsOf(n, 'out').forEach(function (q, i) {
      if (q.virtual) return;
      const d = put(g, 'pracDrain', x, y0 + i * gapY);
      d.pracRes = q.res;
      S.link(n.id, q.id, d.id, 'in');
    });
  }
  
  function consumerAt(g, main, sc, x, gapY) {
    const ct = C.nodeTypes[sc.consumer];
    const con = put(g, ct.id, x, 0);
    const cin = S.portsOf(con, 'in');
    const kwIn = cin.find(function (p) { return p.res === 'energy'; });
    S.link(main.id, S.portsOf(main, 'out')[0].id, con.id, kwIn.id);
    const kg = cfg().supplyKg || 20;
    cin.forEach(function (p) {
      if (p.res === 'energy') return;
      const f = feed(g, 'pracFeed', p.res, x - 60, -gapY, con, p.id);
      f.pracMul = (sc.kgPerHour || kg) / kg;
    });
    drains(g, con, x * 2, -gapY / 2, gapY);
    return { con: con, want: (sc.kgPerHour || kg) * (Sim.stat(ct.id, 'energyPerKg') || 1) };
  }

  function furnishKind(g, typeId, sc) {
    const P0 = lay(), t = C.nodeTypes[typeId], kg = cfg().supplyKg || 20;
    const base = { feeds: [], typeId: typeId, consumer: null, extra: [], scene: sc, kind: sc.kind };
    let main;
    if (sc.kind === 'beacon') {
      main = put(g, typeId, 0, 0);
      const pw = feed(g, 'pracPower', 'energy', P0.inX, 0, main, 'kw');
      pw.pracRate = Sim.beaconCost(t) * (sc.perHour || 1);
      
      room = Object.assign(base, { main: main.id, power: pw.id });
    } else if (sc.kind === 'strike') {
      main = put(g, typeId, 0, 0);
      const c = consumerAt(g, main, sc, P0.outX, P0.gapY);
      room = Object.assign(base, { main: main.id, sideB: c.con.id, want: c.want });
    } else if (sc.kind === 'agency') {
      g.money = sc.money || 0;
      


      if (t.trial) { g.objectives = g.objectives || {}; g.objectives[t.trial] = 1; }
      const bank = put(g, 'bank', 0, 0);
      const gf = feed(g, 'pracFeed', 'gold', P0.inX, 0, bank, 'gold');
      gf.pracMul = (sc.goldKg || 1) / kg;
      main = put(g, typeId, 0, -160);
      main.dock = bank.id;
      
      if (sc.hands) main.agHands = sc.hands;
      if (sc.sec) main.agSec = sc.sec;
      S.syncDocks();
      const hirers = [];
      for (let i = 0; i < (sc.posts || 0); i++) hirers.push(put(g, 'hiringPost', P0.outX, (i - 1) * P0.gapY));
      for (let i = 0; i < (sc.exchanges || 0); i++)
        hirers.push(put(g, 'labourExchange', P0.outX, ((sc.posts || 0) + i - 1) * P0.gapY));
      hirers.forEach(function (h) { drains(g, h, P0.outX * 2, h.y, 0); });
      room = Object.assign(base, { main: main.id, bank: bank.id, hirers: hirers.map(function (h) { return h.id; }) });
    } else if (sc.kind === 'robot') {
      

      main = put(g, typeId, 0, 0);
      const pw = feed(g, 'pracPower', 'energy', P0.inX, 0, main, 'kw');
      pw.pracRate = 0;
      drains(g, main, P0.outX, 0, 0);
      room = Object.assign(base, { main: main.id, power: pw.id, kwMul: 1, drive: false });
    } else if (sc.kind === 'rocket') {
      main = put(g, typeId, 0, 0);
      
      if (room && room.fuelAlt) main.fuelMode = 'alt';
      if (room && room.keepBuilt) main.built = true;
      const B = t.rocket.build, ins = S.portsOf(main, 'in').filter(function (p) { return B[p.id] !== undefined; });
      const top = -((ins.length - 1) * P0.gapY) / 2;
      const parts = ins.map(function (p, i) {
        const f = feed(g, 'pracFeed', p.res, P0.inX, top + i * P0.gapY, main, p.id);
        f.pracMul = B[p.id] * (sc.perHour || 1) / kg;
        return f.id;
      });
      drains(g, main, P0.outX, 0, 0);
      room = Object.assign(base, { main: main.id, parts: parts, stage2: false });
    } else if (sc.kind === 'print') {
      main = put(g, typeId, 0, 0);
      const res = room && room.pickRes ? room.pickRes : ((sc.states[0] || {}).res);
      const paper = feed(g, 'pracFeed', 'paper', P0.inX, -P0.gapY, main, 'paper');
      const mat = feed(g, 'pracFeed', res, P0.inX, 0, main, 'mat');
      const pw = feed(g, 'pracPower', 'energy', P0.inX, P0.gapY, main, 'kw');
      const pl = Sim.printPlan(main) || { paper: t.print.paper, kg: 1, kw: t.print.kw };
      const ph = sc.perHour || 1;
      paper.pracMul = pl.paper * ph / kg;
      mat.pracMul = pl.kg * ph / kg;
      pw.pracRate = pl.kw * ph;
      room = Object.assign(base, { main: main.id, pickRes: res, power: pw.id });
    }
    room.wires = JSON.parse(JSON.stringify(g.links));
    return main;
  }

  



  function rebuildRoom(keep) {
    const typeId = room.typeId, cam = S.g.camera, st = P.state;
    const g = makeRoom(typeId);
    g.camera = cam;
    S.g = g;
    const was = S.practiceLocked;
    S.practiceLocked = false;       
    try { room = keep || null; furnish(g, typeId); } finally { S.practiceLocked = was; }
    applyStartFull();
    if (st) P.setState(st, true);
    Sim.invalidate();
    try { if (GG.ui && GG.ui.selectNode) GG.ui.selectNode(null); } catch (e) {}
  }

  
  function applyStartFull() {
    if (!room) return;
    const n = S.node(room.main), what = (cfg().startFull || {})[room.typeId];
    if (n && what === 'bank') n.bank = Sim.stat(n.type, 'bank') || 0;
    if (n && what === 'halfBank') n.bank = (Sim.stat(n.type, 'bank') || 0) / 2;   
  }

  

  function fuelOpen(typeId) {
    const t = C.nodeTypes[typeId];
    return !!(t && t.fuelSwitch && cfg().fuelStates && Sim.fuelSwitchOpen(t));
  }
  
  function fuelRes(typeId, alt) {
    const t = C.nodeTypes[typeId];
    if (alt) return (t.fissionAlt && t.fissionAlt.res) || (t.rocket && t.rocket.flightAlt.res) || 'nfuel';
    const p = ((t.ports && t.ports.in) || []).find(function (q) { return q.id === t.fuelPort; });
    return p ? p.res : '';
  }

  

  function rocketStage2() {
    const n = S.node(room.main), t = C.nodeTypes[n.type], sc = room.scene, kg = cfg().supplyKg || 20;
    const gone = new Set(room.parts);
    S.g.links = S.g.links.filter(function (l) { return !gone.has(l.from) && !gone.has(l.to); });
    S.g.nodes = S.g.nodes.filter(function (x) { return !gone.has(x.id); });
    const P0 = lay(), RF = Sim.rocketFuel(n), ph = sc.perHour || 1;
    const was = S.practiceLocked;
    S.practiceLocked = false;
    try {
      const ins = S.portsOf(n, 'in');
      const fp = ins.find(function (p) { return p.res === RF.res; });
      const wp = ins.find(function (p) { return p.res === 'wf'; });
      if (fp) feed(S.g, 'pracFeed', RF.res, P0.inX, -P0.gapY / 2, n, fp.id).pracMul = RF.kg * ph / kg;
      if (wp) feed(S.g, 'pracCrew', 'wf', P0.inX, P0.gapY / 2, n, wp.id).pracRate = t.rocket.flight.wf * ph;
    } finally { S.practiceLocked = was; }
    room.stage2 = true;
    Sim.invalidate();
  }

  


  function actionsFor(typeId) {
    const sc = sceneOf(typeId);
    return (sc && sc.actions) || (cfg().actions || {})[typeId] || [];
  }
  function actionBusy(id) {
    if (id === 'gem') return !!S.g.gem;
    if (id === 'bolt') return !!(Sim.wxIn && Sim.wxIn(S.g.loc));
    return false;
  }
  P.act = function (id) {
    if (!P.active || !room) return { ok: false, why: 'Not in the practice room' };
    if (actionBusy(id)) return { ok: false, why: 'Wait for the last one to end' };
    const n = S.node(room.main);
    if (id === 'gem' && n) {
      



      const far = cfg().gemFar || 600;
      let best = null, bd = -1;
      for (let i = 0; i < 30; i++) {
        const s = Sim.gemSpawn();
        if (!s || s.x === undefined) continue;
        const d = Math.hypot(s.x - n.x, s.y - n.y);
        if (d > bd) { bd = d; best = s; }
        if (d >= far) break;
      }
      if (!best) {
        const a = Math.random() * Math.PI * 2;
        best = { x: n.x + Math.cos(a) * far, y: n.y + Math.sin(a) * far * 0.5, loc: S.g.loc };
      }
      S.g.gem = best;
    } else if (id === 'bolt') {
      const r = Sim.startWeather('lightning', S.g.loc);
      if (!r || r.ok === false) return r || { ok: false };
    }
    syncActions();
    return { ok: true };
  };
  function syncActions() {
    if (!bar) return;
    bar.querySelectorAll('.pr-act').forEach(function (b) { b.disabled = actionBusy(b.dataset.act); });
  }

  


  function robotPower() {
    const m = S.node(room.main), pw = S.node(room.power);
    if (!m || !pw) return;
    pw.pracRate = (room.kwMul || 0) * Sim.robotOut(m) * Sim.robotDraw(m);
  }

  
  function batteryOn() {
    const sc = room.scene, on = sc.onHours || 1, off = sc.offHours || 1;
    return (room.clock % (on + off)) < on;
  }

  



  function fillScenePool() {
    if (!room || !room.scene || !room.scene.startFull) return;
    const a = S.node(room.sideA);
    if (!a || !C.nodeTypes[a.type].recruit) return;
    if (room.res === 'energy') a.wfPool = Sim.recruitNeed(a, 'wf');
    else a.kwPool = Sim.recruitNeed(a, 'kw');
  }

  





  




  function convBatches(t, kg) {
    const ins = t.convert.inputs || {};
    let b = Infinity;
    Object.keys(ins).forEach(function (k) { if (ins[k] > 0) b = Math.min(b, kg / ins[k]); });
    return isFinite(b) ? b : kg / ((t.convert.out && t.convert.out.kg) || 1);
  }

  







  function recipeShare(t) {
    const ins = (t.convert && t.convert.inputs) || (t.recipe && t.recipe.inputs) || null;
    const out = {};
    if (!ins) return out;
    let max = 0;
    Object.keys(ins).forEach(function (k) { if (ins[k] > max) max = ins[k]; });
    if (max > 0) Object.keys(ins).forEach(function (k) { if (ins[k] > 0) out[k] = ins[k] / max; });
    return out;
  }

  function kwNeeded(typeId) {
    const t = C.nodeTypes[typeId] || {};
    const kg = cfg().supplyKg || 20;
    if (t.energyPerKg) return kg * t.energyPerKg;
    if (t.convert && t.convert.kw) return t.convert.kw * convBatches(t, kg);
    if (t.recipe && t.recipe.kw) return t.recipe.kw;
    return kg;
  }

  



  function wfNeeded(typeId) {
    const t = C.nodeTypes[typeId] || {};
    const kg = cfg().supplyKg || 20;
    if (t.wfPerKg) return kg * t.wfPerKg;
    if (t.convert && t.convert.wf) return t.convert.wf * convBatches(t, kg);
    if (t.recipe && t.recipe.wf) return t.recipe.wf;
    return kg;
  }

  






  P.supplyKind = function () {
    if (!room) return null;
    if (room.feeds.some(function (f) { return f.kind === 'kw'; })) return 'kw';
    if (room.feeds.some(function (f) { return f.kind === 'wf'; })) return 'wf';
    return null;
  };

  

  P.setState = function (id) {
    if (!P.active || !room) return { ok: false, why: 'Not in the practice room' };
    const list = P.statesFor(room.typeId);
    const st = list.find(function (s) { return s.id === id; }) || list[0];
    if (!st) return { ok: false, why: 'No states declared' };
    if ('alt' in st && fuelOpen(room.typeId)) {
      

      P.state = st.id;
      if (!!room.fuelAlt !== !!st.alt) {
        const rk = S.node(room.main);
        rebuildRoom({ fuelAlt: !!st.alt, keepBuilt: !!(rk && rk.built) });
      }
      Sim.invalidate();
      showBar();
      return { ok: true, state: st.id, alt: !!room.fuelAlt };
    }
    if (room.kind === 'robot') {
      

      const m = S.node(room.main);
      if ('kw' in st) { room.kwMul = st.kw; P.state = st.id; }
      if ('drive' in st) { room.drive = !!st.drive; if (m) m.overdrive = !!st.drive; }
      robotPower();
      Sim.invalidate();
      showBar();
      return { ok: true, state: P.state, drive: room.drive };
    }
    if (room.kind) {
      
      const m = S.node(room.main);
      if (room.kind === 'beacon' && m) m.autoPull = !!st.auto;
      if (room.kind === 'agency' && m) m.agOrder = st.order;
      const prev = P.state;
      P.state = st.id;
      if (room.kind === 'print' && st.res) {
        let res = st.res;
        if (res === 'other') {
          
          
          const acc = (C.nodeTypes[room.typeId].ports.in.find(function (q) { return q.id === 'mat'; }) || {}).accepts || [];
          const L = (room.scene.otherRes || []).filter(function (r) { return acc.indexOf(r) >= 0; });
          const i = L.indexOf(room.pickRes);
          res = (prev === st.id && !arguments[1]) ? L[(i + 1) % L.length] : (i >= 0 ? room.pickRes : L[0]);
        }
        if (res !== room.pickRes) rebuildRoom({ pickRes: res });
        P.state = st.id;
      }
      Sim.invalidate();
      showBar();
      return { ok: true, state: P.state };
    }
    if (room.battery) {
      

      const m = S.node(room.main);
      if ('limit' in st) {
        if (m) m.outCap = st.limit === null ? null : room.supply * st.limit;
        P.state = st.id;
      }
      if (st.reserve) {
        room.reserve = st.reserve;
        if (m) m.outMul = st.reserve === 'hold' ? 0 : null;
      }
      Sim.invalidate();
      try { if (GG.ui && GG.ui.rebuildInspector) GG.ui.rebuildInspector(); } catch (e) {}
      showBar();
      return { ok: true, state: P.state, reserve: room.reserve, limit: m && Sim.outLimit(m) };
    }
    if (room.scene) {
      


      const sc = room.scene, a = S.node(room.sideA);
      const need = Sim.stat(a.type, 'need') || 1;
      room.sceneRate = need * (sc.perHour || 3);
      room.feeds.forEach(function (f) {
        f.node.pracRate = room.sceneRate * (f.role === 'trickle' ? (sc.trickle || 0.5) : 1);
      });
      const m = S.node(room.main);
      if (m) m.prio = st.prio === 'b' ? 'b' : 'a';
      P.state = st.id;
      Sim.invalidate();
      showBar();
      return { ok: true, state: st.id, prio: m && m.prio, rate: room.sceneRate };
    }
    


    
    const one = st.kwMul !== undefined ? st.kwMul : (st.all !== undefined ? st.all : 1);
    const mul = { kw: st.kw === undefined ? one : st.kw, wf: st.wf === undefined ? one : st.wf };
    const full = { kw: kwNeeded(room.typeId), wf: wfNeeded(room.typeId) };
    const t = C.nodeTypes[room.typeId] || {};
    const fr = st.filter === undefined ? null : filterRes(t);
    let R = recipeShare(t);
    



    const G = (cfg().groups || {})[groupOf(t.id)] || {};
    if (G.perHour) {
      const kg = cfg().supplyKg || 20;
      if (t.recruit) { full.kw = full.wf = (Sim.stat(t.id, 'need') || 0) * G.perHour; }
      if (t.recipe) {
        if (t.recipe.kw) full.kw = t.recipe.kw * G.perHour;
        if (t.recipe.wf) full.wf = t.recipe.wf * G.perHour;
        R = {};
        Object.keys(t.recipe.inputs || {}).forEach(function (k) {
          R[k] = (t.recipe.inputs[k] * G.perHour) / kg;
        });
      }
    }
    const allMul = st.all === undefined ? 1 : st.all;
    room.feeds.forEach(function (f) {
      if (f.kind === 'kw' || f.kind === 'wf') { f.node.pracRate = full[f.kind] * mul[f.kind]; return; }
      

      const share = R[f.port.res] === undefined ? 1 : R[f.port.res];
      f.node.pracMul = share * allMul * ((fr && f.port.res === fr) ? st.filter : 1) *
                       ((st.mat && st.mat[f.port.res]) || 1);   
    });
    
    if ('limit' in st) {
      const m = S.node(room.main), kg = cfg().supplyKg || 20;
      const inKg = room.feeds.reduce(function (a, f) {
        return a + (f.kind === 'kg' ? kg * (f.node.pracMul === undefined ? 1 : f.node.pracMul) : 0);
      }, 0);
      if (m) m.outCap = st.limit === null ? null : inKg * st.limit;
      room.inKg = inKg;
      try { if (GG.ui && GG.ui.rebuildInspector) GG.ui.rebuildInspector(); } catch (e) {}
    }
    const mulKw = mul.kw;
    P.state = st.id;
    Sim.invalidate();
    showBar();
    return { ok: true, state: st.id, kind: P.supplyKind(),
             kw: full.kw * mulKw, fullKw: full.kw, wf: full.wf * mul.wf, fullWf: full.wf };
  };

  







  function topUp(hours) {
    if (!P.active || !room) return;
    const kg = cfg().supplyKg || 20;
    

    


    


    if (room.kind === 'strike' && !Sim.wxReady(S.g.loc)) {
      const w = Sim.wxState(S.g.loc);
      if ((w.left || 0) > 0) { w.left -= hours * 60; if (w.left <= 0) Sim.clearWeather(S.g.loc); }
    }
    if (room.kind === 'rocket' && !room.stage2) {
      const rk = S.node(room.main);
      if (rk && rk.built) rocketStage2();
    }
    
    if (room.kind === 'rocket' && room.scene.flightSec) {
      const rk = S.node(room.main), left = rk ? Sim.rocketLeft(rk) : 0;
      if (left > room.scene.flightSec + 1e-6) {
        room.realSec = rk.flightSec;
        rk.flightUntil = S.g.playtime + room.scene.flightSec;
        rk.flightSec = room.scene.flightSec;
      }
    }
    if (room.kind === 'robot') robotPower();            
    if (room.battery) {
      const pw = S.node(room.power);
      if (pw) { pw.pracRate = batteryOn() ? room.supply : 0; pw.pracOff = !batteryOn(); }
      room.clock += hours;
    }
    for (const n of S.g.nodes) {
      if (n.type === 'pracFeed') {
        n.obuf = n.obuf || {};
        n.obuf.out = kg * hours * (n.pracMul === undefined ? 1 : n.pracMul);   
        continue;
      }
      






      if (n.type === 'pracDrain') { n.buf = {}; n.obuf = {}; continue; }
      
      if (room.site && n.id === room.site) { n.reserve = n.full; n.shown = n.full; }
    }
  }

  
  const realTick = Sim.tick;
  Sim.tick = function (dt) {
    if (P.active) { try { topUp((dt || 0) / 60); } catch (e) {  } }
    return realTick.apply(this, arguments);
  };

  








  function afterSwap(centre) {
    const t = function (f) { try { f(); } catch (e) { console.warn('[ReGen] practice:', e); } };
    t(function () { Sim.demoReset(); });
    t(function () { Sim.invalidate(); });
    Sim.ciPerHour = 0; Sim.moneyPerHour = 0;
    S.undoStack = [];           
    t(function () { if (GG.input && GG.input.cancelPlacing) GG.input.cancelPlacing(); });
    t(function () { if (GG.ui && GG.ui.closeOverlays) GG.ui.closeOverlays(); });
    t(function () { if (GG.ui && GG.ui.selectNode) GG.ui.selectNode(null); });
    t(function () { if (GG.ui && GG.ui.refreshPalette) GG.ui.refreshPalette(); });
    t(function () { if (GG.ui && GG.ui.syncLaunchers) GG.ui.syncLaunchers(); });
    t(function () { if (GG.ui && GG.ui.rebuildInspector) GG.ui.rebuildInspector(); });
    if (centre) t(function () { if (GG.input && GG.input.centreView) GG.input.centreView(); });
  }

  

  P.enter = function (typeId) {
    if (!P.on()) return { ok: false, why: 'config.practice.enabled is false' };
    if (P.active) return { ok: false, why: 'Already in the practice room' };
    if (!S.g || !S.g.nodes) return { ok: false, why: 'No run is open' };
    if (GG.menu && GG.menu.isOpen && GG.menu.isOpen()) return { ok: false, why: 'The menu is open' };

    



    let wrote = false;
    try { wrote = S.save(true); } catch (e) { wrote = false; }
    if (!wrote) return { ok: false, why: 'Could not save your run first' };

    let text = null;
    try { text = JSON.stringify(S.g); } catch (e) { text = null; }
    if (!text) return { ok: false, why: 'Could not copy your run' };

    snapshot = text;
    
    runSpeed = (GG.ui && GG.ui.speed) || 1;
    P.speed = 1;
    if (GG.ui) GG.ui.speed = 1;
    S.g = makeRoom(typeId);
    P.active = true;
    P.typeId = typeId || null;
    
    S.practice = true;
    room = null; P.state = null;
    if (typeId) {
      try { furnish(S.g, typeId); } catch (e) {
        console.warn('[ReGen] practice: could not furnish the room', e);
        room = null;
      }
      applyStartFull();                                   
      if (room) P.setState(groupOf(room.typeId) ? P.statesFor(room.typeId)[0].id
                                                  : (cfg().def || (P.statesFor(room.typeId)[0] || {}).id));
    }
    






    S.practiceLocked = P.locked();
    document.body.classList.toggle('pr-locked', S.practiceLocked);
    afterSwap(true);            
    showBar();
    return { ok: true, typeId: P.typeId, furnished: !!room };
  };

  P.exit = function () {
    if (!P.active) return { ok: false, why: 'Not in the practice room' };
    const text = snapshot;
    try {
      




      hideBar();
      if (GG.input && GG.input.cancelPlacing) GG.input.cancelPlacing();
    } catch (e) {
      console.warn('[ReGen] practice: leaving threw, the run is still being restored', e);
    } finally {
      
      S.g = JSON.parse(text);
      snapshot = null;
      if (GG.ui) GG.ui.speed = runSpeed;           
      P.speed = 1;
      P.active = false;
      P.typeId = null;
      room = null;
      P.state = null;
      S.practice = false;
      
      S.practiceLocked = false;
      document.body.classList.remove('pr-locked');
      afterSwap(false);         
      try { S.save(false); } catch (e) {}
    }
    return { ok: true };
  };

  

  function showBar() {
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'practice-bar';
      document.body.appendChild(bar);
    }
    

    bar.innerHTML =
      '<span class="pr-tag"></span>' +
      '<span class="pr-sub"></span>' +
      (room ? '<span class="pr-states"></span>' : '') +
      '<button class="pr-leave" type="button"></button>';
    if (room) {
      const box = bar.querySelector('.pr-states');
      P.statesFor(room.typeId).forEach(function (s) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pr-state' + (isOn(s) ? ' on' : '') + (s.reserve || 'drive' in s ? ' pr-res' : '');
        b.dataset.state = s.id;
        b.onclick = function () { snd('click'); P.setState(s.id); };
        box.appendChild(b);
      });
      actionsFor(room.typeId).forEach(function (id) {       
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pr-state pr-act';
        b.dataset.act = id;
        b.onclick = function () { const r = P.act(id); if (r && r.ok === false) snd('deny'); };
        box.appendChild(b);
      });
      {                                                       
        const a = document.createElement('button');
        a.type = 'button';
        a.className = 'pr-state pr-again';
        a.onclick = function () { snd('click'); P.restart(); };
        box.appendChild(a);
      }
      
      const sp = document.createElement('span');
      sp.className = 'pr-speeds';
      (cfg().speeds || []).forEach(function (v) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pr-speed' + (v === P.speed ? ' on' : '');
        b.textContent = v + 'x';
        b.onclick = function () { snd('click'); P.setSpeed(v); };
        sp.appendChild(b);
      });
      box.appendChild(sp);
    }
    


    
    bar.classList.toggle('pr-two', !!room &&
      P.statesFor(room.typeId).length + actionsFor(room.typeId).length +
      (cfg().speeds || []).length >= (cfg().rowAt || 99));
    bar.querySelector('.pr-leave').onclick = function () { snd('click'); P.exit(); };
    P.relabel();
    bar.hidden = false;
    document.body.classList.add('practice');
  }

  
  function isOn(s) {
    if (room && room.battery && s.reserve) return s.reserve === room.reserve;
    if (room && room.kind === 'robot' && 'drive' in s) return !!s.drive === !!room.drive;   
    return s.id === P.state;
  }

  


  P.speed = 1;
  P.setSpeed = function (v) {
    if (!P.active) return { ok: false, why: 'Not in the practice room' };
    P.speed = v;
    if (GG.ui) GG.ui.speed = v;
    if (bar) bar.querySelectorAll('.pr-speed').forEach(function (b) {
      b.classList.toggle('on', b.textContent === v + 'x');
    });
    return { ok: true, speed: v };
  };

  



  






  







  function permLine(n, t) {
    const unit = (cfg().units || {})[t.id] || 'unit';
    const count = t.recruit ? (n.recruits || 0) : (n.made || 0);
    const name = Sim.nameOf ? Sim.nameOf(n) : t.name;
    const done = t.recipe && t.recipe.maxMade && count >= t.recipe.maxMade;
    

    let gain = null;
    if (t.recruit) gain = rateStr('wf', count * (Sim.stat('player', 'wfRate') || 0));
    else if (t.recipe && t.recipe.ci && Sim.domeOutput)   
      gain = U.small(Sim.domeOutput(n)) + ' ' + I.ins((C.currencies.ci || {}).rate || 'CI/h');
    else if (t.recipe && t.recipe.power && !t.recipe.maxMade && Sim.forgeOutput)
      gain = rateStr('energy', Sim.forgeOutput(n));
    const head = I.t(gain ? 'practice.perm' : 'practice.permBare')
      .replace('%name', name).replace('%n', plural(count, 'practice.u.' + unit))
      .replace('%gain', gain || '');
    if (done) return head + ' ' + I.t('practice.kitMax');
    
    const parts = [], fr = [];
    if (t.recruit) {
      ['wf', 'kw'].forEach(function (w) {
        const need = Sim.recruitNeed(n, w), have = w === 'wf' ? (n.wfPool || 0) : (n.kwPool || 0);
        parts.push(U.small(need) + ' ' + (w === 'wf' ? 'WF' : 'KW'));
        fr.push(need > 0 ? Math.max(0, Math.min(1, have / need)) : 1);
      });
    } else if (t.recipe) {
      Object.keys(t.recipe.inputs || {}).forEach(function (k) {
        const need = Sim.recipeNeed(n, k);
        
        const nm = I.resGen(k) || (C.resources[k] || {}).name || k;
        parts.push(I.ins(U.kg(need)) + ' ' + nm.toLowerCase());
        fr.push(need > 0 ? Math.max(0, Math.min(1, (n.buf[k] || 0) / need)) : 1);
      });
      [['kw', 'KW', Sim.recipeKw, 'kwPool'], ['wf', 'WF', Sim.recipeWf, 'wfPool']].forEach(function (x) {
        if (!t.recipe[x[0]] || !x[2]) return;
        const need = x[2](n);
        if (!(need > 0)) return;
        parts.push(U.small(need) + ' ' + x[1]);
        fr.push(Math.max(0, Math.min(1, (n[x[3]] || 0) / need)));
      });
    }
    const pct = fr.length ? Math.floor(100 * fr.reduce(function (a, b) { return a + b; }, 0) / fr.length) : 0;
    

    let wait = '';
    const st = P.statesFor(t.id).find(function (x) { return x.id === P.state; });
    if (st && st.mat && t.recipe && fr.some(function (v) { return v >= 1; })) {
      const ks = Object.keys(t.recipe.inputs || {}), i = fr.findIndex(function (v) { return v < 1; });
      if (i >= 0 && ks[i]) wait = ' ' + I.t('practice.permWait').replace('%res',
        (I.resGen(ks[i]) || (C.resources[ks[i]] || {}).name || ks[i]).toLowerCase());
    }
    return head + ' ' + I.t('practice.permNext').replace('%need', I.ins(parts.join(' + ')))
                                                 .replace('%pct', pct + '%') + wait;
  }

  



  function storeLine(n) {
    const lim = Sim.outLimit(n);
    const held = Sim.heldOf(n) || 0, cap = Sim.capOf(n) || 0;
    const res = (n.grade && C.resources[n.grade]) ? n.grade : 'trash';
    const inKg = room.inKg || 0;
    const full = cap > 0 && held >= cap - 0.01;
    const hc = I.ins(U.kg(held)) + ' / ' + I.ins(U.kg(cap));
    let key;
    if (!isFinite(lim)) key = 'practice.limNone';
    else if (lim <= 0) key = full ? 'practice.limZeroFull' : 'practice.limZero';
    else key = full ? 'practice.limFull' : 'practice.limSome';
    return I.t(key).replace('%in', rateStr(res, inKg))
      .replace('%out', rateStr(res, isFinite(lim) ? Math.min(lim, inKg) : inKg))
      .replace('%keep', rateStr(res, Math.max(0, inKg - (isFinite(lim) ? lim : inKg))))
      .replace('%held', hc);
  }

  


  function batteryLine(n) {
    const pw = S.node(room.power), con = S.node(room.sideB);
    const on = !!(pw && pw.pracRate > 0);
    
    let inR = Object.values(n.rateIn || {}).reduce(function (a, v) { return a + (v || 0); }, 0);
    
    let out = n.outRate || 0;
    if (on && !Object.keys(n.rateIn || {}).length) {
      inR = pw.pracRate;
      out = Math.min(inR, Sim.outLimit(n));
    }
    const held = Sim.heldOf(n) || 0, cap = Sim.capOf(n) || 0;
    const kw = function (v) { return rateStr('energy', v); };
    const hc = Math.round(held) + ' / ' + Math.round(cap) + ' ' + I.ins('KW');   
    let key;
    if (on) {
      const shut = out <= 1e-6, full = held >= cap - 0.05 && inR - out > 1e-6;
      if (held < 0.01 && out >= inR - 1e-6) key = 'practice.batOnPass';
      

      else if (out >= inR - 1e-6) key = room.reserve === 'hold' ? 'practice.batOnKeepHold' : 'practice.batOnKeep';
      else if (full) key = shut ? 'practice.batOnShutFull' : 'practice.batOnFull';
      else key = shut ? 'practice.batOnShut' : 'practice.batOnBank';
    } else if (held <= 0.01) key = 'practice.batOffEmpty';
    else if (room.reserve === 'hold') key = 'practice.batOffHold';
    else if (out <= 1e-6) key = 'practice.batOffShut';
    else key = 'practice.batOffUse';
    
    const sc = room.scene, onH = sc.onHours || 1, per = onH + (sc.offHours || 1);
    const ph = room.clock % per, leftH = ph < onH ? onH - ph : per - ph;
    const sec = Math.max(1, Math.ceil(leftH * 60 / (P.speed || 1))) + I.ins('s');
    return I.t(key).replace('%sec', sec).replace('%name', con ? C.nodeTypes[con.type].name : '')
      .replace('%in', kw(inR)).replace('%out', kw(out)).replace('%want', kw(room.want))
      .replace('%bank', kw(Math.max(0, inR - out))).replace('%waste', kw(Math.max(0, inR - out)))
      .replace('%held', hc);
  }

  
  function secAt(realSec) {          
    return Math.max(0, Math.ceil(realSec / (P.speed || 1))) + I.ins('s');
  }
  function kindLine(n) {
    const t = C.nodeTypes[n.type];
    const cur = function (id, v) { return U.cur ? U.cur(id, v) : U.small(v); };
    if (room.kind === 'beacon') {
      const key = n.autoPull ? 'practice.bcAuto' : 'practice.bcManual';
      const s = I.t(key).replace('%cost', U.small(Sim.beaconCost(t)) + ' ' + I.ins('KW'))
        .replace('%held', U.small(n.bank || 0) + ' / ' + U.small(Sim.stat(t.id, 'bank')) + ' ' + I.ins('KW'));
      if (Sim.rocksDown(S.g.loc) >= Sim.rockMax())
        return I.t('practice.bcFull').replace('%n', Sim.rockMax());
      return (S.g.rockPull || 0) > 0 ? s + ' ' + I.t('practice.bcComing') : s;
    }
    if (room.kind === 'robot') {
      
      const cap = Sim.stat(t.id, 'bank') || 0, have = n.bank || 0;
      const held = U.small(have) + ' / ' + U.small(cap) + ' ' + I.ins('KW');
      const wf = rateStr('wf', (n.rates && n.rates['out:wf']) || 0);
      let key;
      if (room.kwMul <= 0) key = have > 0.01 ? 'practice.rbNone' : 'practice.rbEmpty';
      else if (room.kwMul > 1) key = have >= cap - 0.01 ? 'practice.rbFull' : 'practice.rbMore';
      else key = 'practice.rbEnough';
      let s = I.t(key).replace('%held', held).replace('%wf', wf);
      if (room.drive) {
        const od = t.overdrive || {};
        s += ' ' + I.t('practice.rbOver').replace('%out', U.small(od.out || 1))
          .replace('%drain', U.small(Sim.overdriveDrain(t)));
      }
      return s;
    }
    if (room.kind === 'strike') {
      const con = S.node(room.sideB), held = Sim.heldOf(n) || 0, cap = Sim.capOf(n) || 0;
      const hc = Math.round(held) + ' / ' + Math.round(cap) + ' ' + I.ins('KW');   
      const w = Sim.wxIn(S.g.loc);
      const key = w ? 'practice.stkNow' : (held > 0.01 ? 'practice.stkRun' : 'practice.stkEmpty');
      return I.t(key).replace('%name', con ? C.nodeTypes[con.type].name : '')
        .replace('%out', rateStr('energy', n.outRate || 0)).replace('%held', hc)
        .replace('%kw', U.small(Sim.stat(t.id, 'strikeCharge')) + ' ' + I.ins('KW'));
    }
    if (room.kind === 'agency') {
      let top = 0, p = 0, e = 0;
      (room.hirers || []).forEach(function (id) {
        const h = S.node(id);
        if (!h) return;
        const o = Sim.agencyOffer(n, h, true);
        if (o) top = Math.max(top, o.price);
        const k = (h.crew || []).length;
        if (C.nodeTypes[h.type].hire.mult) e += k; else p += k;
      });
      const capB = C.nodeTypes[n.type].autoHire.budgetCap * top;
      return I.t('practice.agLine').replace('%budget', cur('money', n.budget || 0))
        .replace('%cap', cur('money', capB)).replace('%p', p).replace('%e', e);
    }
    if (room.kind === 'rocket') {
      const st = Sim.rocketState(n) || {};
      const F = t.rocket.flight;
      if (st.state === 'building') return I.t('practice.rkBuild').replace('%pct', Math.floor(st.pct * 100) + '%');
      if (st.state === 'fuel') return I.t('practice.rkFuel').replace('%res', String((C.resources[st.res] || {}).name || '').toLowerCase())
        .replace('%have', I.ins(U.kg(st.have))).replace('%need', I.ins(U.kg(st.need)));
      if (st.state === 'crew') return I.t('practice.rkCrew').replace('%have', U.small(st.have)).replace('%need', U.small(F.wf));
      if (st.state === 'ready') return I.t('practice.rkReady');
      if (st.state === 'flying') return I.t('practice.rkFly').replace('%sec', secAt(st.left))
        .replace('%kg', I.ins(U.kg(Sim.rocketMetal(n))))
        .replace('%real', Math.round((room.realSec || Sim.rocketFuel(n).sec) / 60) + ' ' + I.t('cx.min'));
      if (st.state === 'hold') return I.t('practice.rkHold').replace('%kg', I.ins(U.kg(st.held)));
      return I.t('practice.idle');
    }
    if (room.kind === 'print') {
      const pl = Sim.printPlan(n);
      if (!pl) return I.t('practice.idle');
      const bo = pl.boost && (C.boosts || []).find(function (x) { return x.id === pl.boost; });
      const what = bo ? bo.name : I.t('practice.pr.gems');
      return I.t(pl.gem ? 'practice.prOther' : 'practice.prLine').replace(/%what/g, what).replace('%n', pl.made)
        .replace('%paper', I.ins(U.kg(pl.paper))).replace('%kg', I.ins(U.kg(pl.kg)))
        .replace(/%res/g, String(I.resGen(pl.res) || (C.resources[pl.res] || {}).name || '').toLowerCase())
        .replace('%kw', U.small(pl.kw) + ' ' + I.ins('KW'));
    }
    return I.t('practice.idle');
  }
  
  function gemLine(n, t) {
    const A = t.gemArm, cell = Sim.stat(t.id, 'bank'), bank = n.bank || 0;
    const room2 = Sim.collectCap(t, n) - (n.till || 0);
    let key;
    if (room2 < C.gem.reward - U.EPS) key = 'practice.gemFull';
    else if (n.arm && !n.arm.empty) key = 'practice.gemReach';
    else if (S.g.gem && bank < A.perGem - U.EPS) key = 'practice.gemShort';
    else key = 'practice.gemIdle';
    return I.t(key).replace('%per', U.small(A.perGem) + ' WF')
      .replace('%bank', U.small(bank) + ' / ' + U.small(cell) + ' WF').replace('%till', U.small(n.till || 0));
  }

  
  function plural(k, key) {
    const f = String(I.t(key || 'practice.loadForms')).split('|');
    let w = f[f.length - 1];
    if (f.length === 2) w = k === 1 ? f[0] : f[1];
    else if (f.length === 3) {
      const a = k % 10, b = k % 100;
      w = (a === 1 && b !== 11) ? f[0] : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? f[1] : f[2];
    }
    return k + ' ' + w;
  }
  function rateStr(res, v) {
    const r = C.resources[res] || {};
    if (r.flow === 'material' || !r.rate) return I.ins(U.kg(v) + '/h');
    return U.small(v) + ' ' + I.ins(r.rate);
  }

  

  function kitOf(t) {
    const outs = (t && t.ports && t.ports.out) || [];
    for (const o of outs) {
      const c = Object.values(C.nodeTypes).find(function (x) {
        return x.kind === 'machine' && x.powerUp && x.powerUp.res === o.res &&
               x.buildable !== false && x.placement !== 'onSite';
      });
      if (c) return { port: o, type: c };
    }
    return null;
  }

  






  P.restart = function () {
    if (!P.active || !room) return { ok: false, why: 'Nothing to restart' };
    if (room.kind) {                    
      
      const keep = { fuelAlt: !!room.fuelAlt }, drive = room.drive;
      if (room.kind === 'print') keep.pickRes = room.pickRes;
      rebuildRoom(keep);
      if (room.kind === 'robot' && drive) {
        const d = P.statesFor(room.typeId).find(function (s) { return s.drive === true; });
        if (d) P.setState(d.id);
      }
      showBar();
      return { ok: true };
    }
    S.g.nodes.forEach(function (n) {
      n.buf = {}; n.obuf = {};
      if (n.lb) Object.keys(n.lb).forEach(function (k) { n.lb[k] = {}; });
      ['made', 'wfPool', 'kwPool', 'recruits', 'bank', 'store', 'till', 'tillB', 'outRate']
        .forEach(function (k) { if (typeof n[k] === 'number') n[k] = 0; });
      n.rates = {}; n.raw = {}; n.rateIn = {};
    });
    room.fullOut = 0;
    room.clock = 0;                                   
    if (room.battery && S.node(room.power)) {
      S.node(room.power).pracRate = room.supply; S.node(room.power).pracOff = false;
    }
    S.g.links.forEach(function (l) { if (l.muted) l.muted = false; });   
    

    (room.wires || []).forEach(function (w) {
      if (!S.g.links.some(function (l) { return l.id === w.id; })) S.g.links.push(Object.assign({}, w));
    });
    fillScenePool();                                   
    applyStartFull();                                  
    Sim.invalidate();
    P.relabel();
    return { ok: true };
  };

  
  function groupOf(typeId) {
    const G = cfg().groups || {};
    for (const k in G) if ((G[k].machines || []).indexOf(typeId) >= 0) return k;
    return null;
  }
  P.statesFor = function (typeId) {
    if (fuelOpen(typeId)) return cfg().fuelStates;      
    const sc = sceneOf(typeId);
    if (sc) return sc.states || [];
    const g = groupOf(typeId), G = cfg().groups || {};
    return (g && G[g].states) || cfg().states || [];
  };
  

  function filterRes(t) {
    const ins = (t.ports && t.ports.in) || [];
    const p = ins.find(function (q) {
      return (C.resources[q.res] || {}).flow === 'material' && FLUIDS().indexOf(q.res) < 0;
    });
    return p ? p.res : null;
  }
  function fluidRes(t) {
    const ins = (t.ports && t.ports.in) || [];
    const p = ins.find(function (q) { return FLUIDS().indexOf(q.res) >= 0; });
    return p ? p.res : null;
  }
  function FLUIDS() { return cfg().fluids || []; }

  
  function lessonKind(t) {
    const c = cfg();
    if (c.lessons === false || !t) return 'plain';
    if ((c.sorters || []).indexOf(t.id) >= 0) return 'sorter';
    if (groupOf(t.id) === 'rubble') return 'rubble';   
    if (groupOf(t.id) === 'filter') return 'conv';     
    if (t.store || t.splitter || t.merge || t.mergeLock || t.lanes || t.recipe ||
        t.recruit || t.print || t.rocket) return 'plain';
    const ins = (t.ports && t.ports.in) || [];
    const outs = ((t.ports && t.ports.out) || []).filter(function (o) { return !o.virtual; });
    const flows = function (r) { return (C.resources[r] || {}).flow === 'material'; };
    
    if (!outs.some(function (o) { return flows(o.res); })) return 'plain';
    if (outs.some(function (o) {
      return flows(o.res) && ins.some(function (i) { return i.res === o.res; });
    })) return 'pass';
    return 'conv';
  }
  


  function heldBy(n, t) {
    let k = null;
    if (t.convert && Sim.convRate) k = Sim.convRate(n, 0.05 / 60).short;
    else if (P.state !== 'ideal') k = P.supplyKind();
    

    const first = (P.statesFor(t.id)[0] || {}).id;
    if (P.state === first && groupOf(t.id) !== 'filter') k = null;   
    else if (P.state === 'ideal' && (k === 'kw' || k === 'wf') && t.convert) {
      const ins = t.convert.inputs || {};
      let best = Infinity; k = null;
      Object.keys(ins).forEach(function (r) {
        if (!(ins[r] > 0)) return;
        const can = (n.buf[r] || 0) / Sim.convNeed(n, r);
        if (can < best) { best = can; k = r; }
      });
    }
    if (P.state === 'ideal' && groupOf(t.id) === 'filter') k = fluidRes(t) || k;   
    heldBy.rate = (k === 'kw' || k === 'wf');
    heldBy.key = k;   
    if (!k || k === 'out') return '';
    if (k === 'kw') k = 'energy';
    return (C.resources[k] || {}).name || '';
  }

  function lessonLine() {
    if (!room) return I.t('practice.sub');
    const n = S.node(room.main);
    if (!n || !C.nodeTypes[n.type]) return I.t('practice.sub');
    const t = C.nodeTypes[n.type];
    if (room.battery) return batteryLine(n);
    if (room.kind) return kindLine(n);
    
    if (room.scene) {
      const side = Sim.prioSide(n);
      const pn = S.node(side === 'a' ? room.sideA : room.sideB);
      const on = S.node(side === 'a' ? room.sideB : room.sideA);
      const nm = function (x) { return x ? (Sim.nameOf ? Sim.nameOf(x) : C.nodeTypes[x.type].name) : ''; };
      const res = room.res;
      return I.t(n.prioOn === false ? 'practice.prioOff' : 'practice.prioOn')
        .replace('%name', nm(pn)).replace('%other', nm(on))
        .replace('%res', String((C.resources[res] || {}).name || '').toLowerCase())
        .replace('%gen', I.resGen(res) || '')
        .replace('%rate', rateStr(res, room.sceneRate || 0));
    }
    
    const c = room.consumer && S.node(room.consumer);
    if (c) {
      const ct = C.nodeTypes[c.type], pu = ct.powerUp;
      const loads = c.made || 0;
      
      const tail = ' ' + (Sim.powerMaxed && Sim.powerMaxed(c) ? I.t('practice.kitMax')
        : I.t('practice.kitNext').replace('%next', I.ins(U.kg(Sim.powerLoad(c)))));
      if (pu.solarShare) {
        const full = (Sim.stat(ct.id, 'wfRate') || 0) * (Sim.stat(ct.id, 'kwPerWf') || 0);
        const draw = Math.max(0, full - (Sim.panelKw ? Sim.panelKw(c) : 0));
        return I.t('practice.kitRobot').replace('%name', ct.name).replace('%n', plural(loads))
          .replace('%draw', U.small(draw)).replace('%full', rateStr('energy', full)) + tail;
      }
      const res = pu.stat === 'wfRate' ? 'wf' : 'energy';
      const base = Sim.stat(ct.id, pu.stat) || 0;
      return I.t('practice.kit').replace('%name', ct.name).replace('%n', plural(loads))
        .replace('%now', rateStr(res, base * Sim.powerMul(c))).replace('%base', U.small(base)) + tail;
    }
    

    const grp = groupOf(t.id);
    if (grp === 'hub' || grp === 'perm' || grp === 'forge') return permLine(n, t);   
    if (grp === 'store') return storeLine(n);
    if (cfg().actions && cfg().actions[t.id] && t.gemArm) return gemLine(n, t);
    const outs = S.portsOf(n, 'out').filter(function (q) { return !q.virtual; });
    const rate = function (q) { return (n.rates && n.rates['out:' + q.id]) || 0; };

    





    if (!outs.length && t.virtualOut && t.virtualOut.length) {
      const cur = C.currencies[t.virtualOut[0].cur] || {};
      const v = (n.rates && n.rates['v:0']) || 0;
      if (v <= 1e-6) return I.t('practice.idle');
      return I.t('practice.making').replace('%total', U.small(v) + ' ' + I.ins(cur.rate || ''))
                                   .replace('%res', t.virtualOut[0].label || cur.name || '');
    }

    let total = outs.reduce(function (a, q) { return a + rate(q); }, 0);
    let outRes = outs[0] && S.portRes(n, outs[0], 'out');
    const unit = C.resources[cfg().supplyRes || outRes];
    let kgStr = rateStr(outRes, total);

    






    if (total <= 1e-6 && Sim.gathering && Sim.gathering(n)) return I.t('practice.batch');

    
    const kind = lessonKind(t);
    if (kind === 'rubble') {
      
      const r2 = function (res) {
        const q = outs.find(function (o) { return S.portRes(n, o, 'out') === res; });
        return q ? rate(q) : 0;
      };
      return I.t('practice.rubble').replace('%g', rateStr('glass', r2('glass')))
                                   .replace('%a', rateStr('aggregate', r2('aggregate')));
    }
    if (kind === 'pass') {
      


      const ins = S.portsOf(n, 'in');
      const pass = outs.find(function (o) { return ins.some(function (i) { return i.res === o.res; }); });
      const raw = ins.find(function (i) { return i.res === pass.res; });
      const inKg = (n.rates && n.rates['in:' + raw.id]) || 0;
      if (inKg <= 1e-6) return I.t('practice.idle');
      const left = Math.min(inKg, rate(pass)), res = S.portRes(n, raw, 'in');
      return I.t('practice.pass').replace('%done', U.small(inKg - left))
                                 .replace('%total', rateStr(res, inKg))
                                 .replace('%left', rateStr(res, left));
    }
    if (kind === 'conv' && t.convert && t.convert.out) {
      


      const mp = outs.find(function (o) { return S.portRes(n, o, 'out') === t.convert.out.res; });
      if (mp) { total = rate(mp); outRes = t.convert.out.res; kgStr = rateStr(outRes, total); }
    }
    if (kind === 'conv') {
      


      if (total <= 1e-6 && P.state !== 'ideal') {
        return I.t('practice.convSome').replace('%made', kgStr).replace('%res', heldBy(n, t));
      }
      if (total <= 1e-6) return I.t('practice.idle');
      if (P.state === 'ideal') room.fullOut = Math.max(room.fullOut || 0, total);
      const by = heldBy(n, t);
      

      const st = Object.assign({}, P.statesFor(t.id).find(function (s) { return s.id === P.state; }) || {});
      const fgrp = groupOf(t.id) === 'filter';
      const rateBound = fgrp ? (heldBy.key === filterRes(t)) : heldBy.rate === true;
      if (fgrp) st.kwMul = st.filter;   
      


      const full = room.fullOut > 0 ? room.fullOut
                 : (rateBound && st.kwMul > 0 ? total / st.kwMul : 0);
      if (full > 0 && total < full * 0.97) {
        return I.t('practice.conv').replace('%made', U.small(total))
                                   .replace('%full', rateStr(outRes, full)).replace('%res', by);
      }
      return by ? I.t('practice.convTop').replace('%made', kgStr).replace('%res', by)
                : I.t('practice.convFree').replace('%made', kgStr);
    }

    
    if (outs.length === 2) {
      const a = rate(outs[0]), b = rate(outs[1]);
      const nameOf = function (q) { return (C.resources[S.portRes(n, q, 'out')] || {}).name; };
      if (total <= 1e-6) return I.t('practice.idle');
      const lo = Math.min(a, b), hi = Math.max(a, b);
      if (lo <= total * 0.001)
        return I.t('practice.allOne').replace('%total', kgStr)
                                     .replace('%res', nameOf(a > b ? outs[0] : outs[1]));
      return I.t('practice.split').replace('%total', kgStr)
                                  .replace('%ratio', '1 : ' + (hi / lo).toFixed(2));
    }
    if (total <= 1e-6) return I.t('practice.idle');
    return I.t('practice.making').replace('%total', kgStr)
                                 .replace('%res', (unit || {}).name || '');
  }

  function hideBar() {
    if (bar) bar.hidden = true;
    document.body.classList.remove('practice');
  }

  


  P.relabel = function () {
    if (!bar) return;
    const tag = bar.querySelector('.pr-tag'), sub = bar.querySelector('.pr-sub');
    const leave = bar.querySelector('.pr-leave');
    if (tag) tag.textContent = room ? (C.nodeTypes[room.typeId] || {}).name || I.t('practice.tag')
                                    : I.t('practice.tag');
    if (sub) sub.textContent = lessonLine();
    if (leave) leave.textContent = I.t('practice.leave');
    



    const grp = room ? groupOf(room.typeId) : null;
    const kind = grp ? ((cfg().groups || {})[grp].labels || grp)
                     : (P.supplyKind() === 'wf' ? 'stw' : 'st');
    

    const fr = grp && room ? filterRes(C.nodeTypes[room.typeId] || {}) : null;
    const fName = fr ? ((C.resources[fr] || {}).name || '') : '';
    const fGen = fr ? (I.resGen(fr) || fName) : '';
    const again = bar.querySelector('.pr-again');
    if (again) again.textContent = I.t('practice.again');
    bar.querySelectorAll('.pr-act').forEach(function (b) {    
      b.textContent = I.t('practice.act.' + b.dataset.act);
    });
    syncActions();
    bar.querySelectorAll('.pr-state:not(.pr-again):not(.pr-act)').forEach(function (b) {
      if (room && fuelOpen(room.typeId)) {
        
        const st = cfg().fuelStates.find(function (s) { return s.id === b.dataset.state; }) || {};
        const rn = (C.resources[fuelRes(room.typeId, !!st.alt)] || {}).name || '';
        b.textContent = I.t('practice.fuelPick').replace('%res', String(rn).toUpperCase());
        b.classList.toggle('on', !!st.alt === !!room.fuelAlt);
        return;
      }
      if (room && room.kind) {
        const st = room.scene.states.find(function (s) { return s.id === b.dataset.state; }) || {};
        if (room.kind === 'robot') {                                   
          b.textContent = I.t('practice.robot.' + st.id);
          b.classList.toggle('on', isOn(st));
          return;
        }
        if (room.kind === 'print') {
          
          const hit = C.nodeTypes[room.typeId].print.boosts[st.res];
          const bo = hit && (C.boosts || []).find(function (x) { return x.id === hit.boost; });
          const what = bo ? bo.name : I.t('practice.pr.gems');
          const rn = st.res === 'other' ? I.t('practice.pr.anyOther') : (C.resources[st.res] || {}).name;
          b.textContent = I.t('practice.pr.pick').replace('%res', String(rn || '').toUpperCase())
            .replace('%what', String(what).toUpperCase());
        } else b.textContent = I.t('practice.' + room.kind + '.' + st.id);
        b.classList.toggle('on', b.dataset.state === P.state);
        return;
      }
      if (room && room.battery) {
        
        const st = room.scene.states.find(function (s) { return s.id === b.dataset.state; }) || {};
        b.textContent = I.t((st.reserve ? 'practice.res.' : 'practice.lim.') + st.id);
        b.classList.toggle('on', isOn(st));
        return;
      }
      if (room && room.scene) {
        
        const st = room.scene.states.find(function (s) { return s.id === b.dataset.state; }) || {};
        const x = S.node(st.prio === 'b' ? room.sideB : room.sideA);
        b.textContent = I.t('practice.prioPick')
          .replace('%name', String(x ? C.nodeTypes[x.type].name : '').toUpperCase());
        b.classList.toggle('on', b.dataset.state === P.state);
        return;
      }
      b.textContent = I.t('practice.' + kind + '.' + b.dataset.state)
        .replace('%res', fName.toUpperCase()).replace('%gen', fGen.toUpperCase());
      b.classList.toggle('on', b.dataset.state === P.state);
    });
  };

  



  setInterval(function () {
    if (!P.active || !bar || bar.hidden) return;
    const sub = bar.querySelector('.pr-sub');
    if (sub) sub.textContent = lessonLine();
    syncActions();
  }, 250);

  

  

  P.report = function () {
    return {
      enabled: P.on(),
      active: P.active,
      typeId: P.typeId,
      savesBlocked: !!S.practice,
      locked: !!S.practiceLocked,
      snapshotBytes: snapshot ? snapshot.length : 0,
      slot: S.slot,
      runOnDisk: !!(localStorage.getItem(S.slotKey(S.slot))),
      furnished: !!room,
      state: P.state,
      reading: room ? lessonLine() : null,
    };
  };
})(window.GG);
