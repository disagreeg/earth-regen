(function (GG) {
  'use strict';
  const C = GG.config;

  const State = {};
  GG.state = State;

  function freshGame() {
    const g = {
      ci: C.balance.startCI,
      money: C.balance.startMoney,
      diamond: C.balance.startDiamonds,
      prism: 0,
      totalCI: 0, totalMoney: 0, totalCleaned: 0, totalClicks: 0,
      totalBurns: 0, totalDiamonds: 0, gemsTaken: 0,
      metalSold: 0, diamondSpent: 0,
      licenceCI: 0,
      ciLowSec: 0,
      hintSnooze: {},
      digBy: {},
      pureGlass: false, bpPlaced: false, forgeCycle: false, soldPair: false,
      sorterPerfect: false,
      splitEven: false,
      playtime: 0, gameHours: 0,
      nodes: [], links: [],
      skills: {},
      handKg: 0, powerKg: 0,
      cellsMade: 0,

      printed: {},
      bigHire: false,
      boltBlocked: false,
      solarShift: 0,
      boosts: {},
      boostUses: {},
      goalsHit: {},
      objectives: {},
      gem: null,
      gemTimer: 0,
      builtCount: {},
      caps: {},
      loc: C.locations[0].id,
      locSpawned: {},
      cameras: {},
      sitesDrained: 0,

      wxAt: {},
      wxSeq: 0,
      wxPredicted: {},
      wxSeen: {},
      wxWatched: {},

      rockIntro: {}, rockIntroDone: {},
      blueprints: [],
      tutorStep: 0, tutorDone: false,

      tutorSkipped: false,
      tutorChoice: null,

      storyAt: 0, storyActs: {}, storyClosed: false,
      relocated: 0,

      relocMoved: {},
      hintsSeen: {},

      hintReplay96: 1,
      wiresCut: 0,

      seenNodes: {},

      seenPlaces: {},

      reviveSeen: {},

      skillTold: {},
      camera: { x: 0, y: 0, scale: C.world.startZoom },

      name: '',
      idSeed: 1,
    };
    C.skills.forEach(s => { if (s.owned) g.skills[s.id] = 1; });

    Object.keys(C.nodeTypes).forEach(function (k) {
      const t = C.nodeTypes[k];
      if (t.buildable && t.unlockedFromStart) g.seenNodes[k] = true;
    });

    g.seenPlaces[C.locations[0].id] = true;

    g.buildRules = 1;
    return g;
  }

  State.ensureLocations = function () {
    const g = State.g;
    g.locSpawned = g.locSpawned || {};
    C.locations.forEach(function (L) {
      if (g.locSpawned[L.id]) return;
      if (L.requires && !State.hasSkill(L.requires)) return;
      L.sites.forEach(function (s) { spawnSite(s, L, g); });
      g.locSpawned[L.id] = true;
    });
  };

  function spawnSite(s, L, g) {
    const n = makeNode(s.type, s.x, s.y, g, L.id);

    const kg = C.siteReserve(s, g), cap = C.siteCapacity(s, g);
    if (kg !== undefined) { n.reserve = kg; n.full = kg; n.shown = kg; }

    if (cap !== undefined) n.capacity = cap;

    const vol = C.siteVolume(s, g);
    if (vol !== undefined) n.volume = vol;

    if (s.raisedFrom) n.capRaised = true;

    if (s.w) n.w = s.w;
    if (s.slots) n.slots = s.slots;
    g.nodes.push(n);
    return n;
  }

  State.addSite = function (typeId, x, y, loc, opts) {
    const t = C.nodeTypes[typeId];
    if (!t) return null;
    opts = opts || {};
    const g = State.g;
    const n = makeNode(typeId, x, y, g, loc || g.loc);
    let kg = opts.reserve !== undefined ? opts.reserve : t.reserve;

    if (kg !== undefined && (C.fullCircle || {}).rocks !== false) kg *= C.siteMul(g);
    if (kg !== undefined) { n.reserve = kg; n.full = kg; n.shown = kg; }
    if (opts.mix) n.mix = opts.mix;

    if (opts.rare) n.rare = opts.rare;
    if (t.w) n.w = t.w;
    if (t.slots) n.slots = t.slots;
    g.nodes.push(n);
    return n;
  };

  State.locations = function () { return C.locations; };
  State.locationById = function (id) { return C.locations.find(l => l.id === id); };
  State.locOpen = function (L) { return !L.requires || State.hasSkill(L.requires); };
  State.openLocations = function () { return C.locations.filter(State.locOpen); };

  State.goTo = function (id) {
    const L = State.locationById(id);
    if (!L || !State.locOpen(L)) return { ok: false, why: 'Not open yet' };
    if (State.g.loc === id) return { ok: false, why: 'You are already here' };
    State.g.cameras[State.g.loc] = Object.assign({}, State.g.camera);
    State.g.loc = id;
    State.markPlaceSeen(id);
    const cam = State.g.cameras[id];
    State.g.camera = cam ? Object.assign({}, cam)
                         : { x: 0, y: 0, scale: C.world.startZoom };
    return { ok: true, location: L };
  };

  function makeNode(typeId, x, y, g, loc) {
    const t = C.nodeTypes[typeId];
    const n = {
      id: 'n' + (g.idSeed++),
      type: typeId, x: x, y: y,
      loc: loc || g.loc || C.locations[0].id,
      buf: {}, obuf: {},
      rates: {},

      rateIn: {}, raw: {},
      pulse: 0,

      bornAt: g.playtime || 0,
    };

    if (t.kind === 'site' && !t.grow) { n.reserve = t.reserve; n.full = t.reserve; n.shown = t.reserve; }

    if (t.grow) { n.grown = 0; n.shown = 0; }
    if (t.collect) n.till = 0;
    if (t.collectB) { n.tillB = 0; n.bufB = {}; }
    if (t.store) { n.store = 0; n.demand = 0; n.outRate = 0; }

    if (t.mergeLock) n.grade = null;
    if (t.lanes) State.laneInit(n, t);
    if (t.splitter) { n.wa = t.defaultWeights.a; n.wb = t.defaultWeights.b; }

    if (t.ways) Object.keys(t.defaultWeights).forEach(k => { n['w' + k] = t.defaultWeights[k]; });
    if (t.hire) n.crew = [];

    if (t.autoHire) {
      n.dock = null; n.budget = 0; n.agOrder = 'post';
      n.agHands = t.autoHire.hands; n.agSec = t.autoHire.sec;
    }

    if (t.licence || t.fission) n.runUntil = 0;
    if (t.rocket) { n.built = false; n.wfPool = 0; n.flightUntil = 0; }

    if (t.predict) { n.bank = 0; n.sawSeq = 0; }

    if (t.recruit) { n.wfPool = 0; n.kwPool = 0; n.recruits = 0; }

    if (t.recipe) { n.made = 0; n.wfPool = 0; n.kwPool = 0; }
    return n;
  }

  State.node = function (id) { return State.g.nodes.find(n => n.id === id); };
  State.type = function (node) { return C.nodeTypes[node.type]; };

  State.machines = function () {
    return State.g.nodes.filter(n => C.nodeTypes[n.type].kind === 'machine');
  };
  State.sites = function () {
    return State.g.nodes.filter(n => C.nodeTypes[n.type].kind === 'site');
  };
  State.here = function (n) { return (n.loc || C.locations[0].id) === State.g.loc; };
  State.machinesHere = function () { return State.machines().filter(State.here); };
  State.sitesHere = function () { return State.sites().filter(State.here); };
  State.nodesHere = function () { return State.g.nodes.filter(State.here); };
  State.sitesIn = function (loc) {
    return State.sites().filter(n => (n.loc || C.locations[0].id) === loc);
  };
  State.linksInto = function (id) { return State.g.links.filter(l => l.to === id); };
  State.linksFrom = function (id) { return State.g.links.filter(l => l.from === id); };
  State.linkInto = function (id, portId) {
    return State.g.links.find(l => l.to === id && l.toPort === portId) || null;
  };
  State.hasSkill = function (id) { return (State.g.skills[id] || 0) > 0; };

  let lvlCap = null, lvlCapFor = null;
  State.skillLevel = function (id) {
    const v = State.g.skills[id] || 0;
    if (typeof v !== 'number') return v;
    if (lvlCapFor !== C.skills) {
      lvlCapFor = C.skills; lvlCap = {};
      C.skills.forEach(s => { if (s.maxLevel) lvlCap[s.id] = s.maxLevel; });
    }
    return lvlCap[id] ? Math.min(v, lvlCap[id]) : v;
  };

  State.portsOf = function (nodeOrTypeId, dir) {
    const node = typeof nodeOrTypeId === 'object' ? nodeOrTypeId : null;
    const typeId = node ? node.type : nodeOrTypeId;
    const t = C.nodeTypes[typeId];
    let list = (t.ports && t.ports[dir]) || [];
    list = list.filter(p => !p.requires || State.hasSkill(p.requires));

    if (node && t.powerUp && t.overdrive && t.overdrive.dropKitSocket &&
        GG.sim && GG.sim.robotFree && GG.sim.robotFree(node))
      list = list.filter(p => p.id !== t.powerUp.port);

    if (node && dir === 'in' && t.overdrive && t.overdrive.dropPowerSocket &&
        GG.sim && GG.sim.robotFree && GG.sim.robotFree(node))
      list = list.filter(p => p.res !== 'energy');

    if (t.fuelSwitch && dir === 'in') {
      const alt = !!(node && GG.sim && GG.sim.fuelAlt && GG.sim.fuelAlt(node));
      list = list.filter(p => p.fuelAlt ? alt : (p.id !== t.fuelPort || !alt));
    }
    if (t.rocket && dir === 'in') {
      const B = t.rocket.build, built = !!(node && node.built);
      list = list.filter(p => built ? B[p.res] === undefined : B[p.res] !== undefined);
    }

    if (dir === 'in' && t.recipe && t.recipe.maxMade && GG.sim && GG.sim.roadDone &&
        GG.sim.roadDone(node)) {
      list = list.filter(p => t.recipe.inputs[p.res] === undefined);
    }

    if (dir === 'in' && list.some(p => p.dynamic)) {
      const dyn = list.filter(p => p.dynamic);
      const wired = node ? dyn.filter(p => State.linkInto(node.id, p.id)).length : 0;

      const groups = t.lanes ? t.lanes.map(L => dyn.filter(p => p.lane === L)) : [dyn];
      const shown = new Set();
      groups.forEach(function (grp) {
        const w = t.lanes ? (node ? grp.filter(p => State.linkInto(node.id, p.id)).length : 0) : wired;
        let last = 0;
        if (node) grp.forEach((p, i) => { if (State.linkInto(node.id, p.id)) last = i + 1; });
        const min = t.lanes ? 1 : (t.minInputs || 1);
        const reveal = Math.min(grp.length, Math.max(min, w + 1, last));
        grp.slice(0, reveal).forEach(p => shown.add(p.id));
      });
      list = list.filter(p => !p.dynamic || shown.has(p.id));
    }

    if (t.lanes && node && node.lg) {
      list = list.map(function (p) {
        const gr = p.lane && node.lg[p.lane];
        return gr ? Object.assign({}, p, { res: gr, label: C.resources[gr].name }) : p;
      });
    }

    if (t.mergeLock && node && node.grade) {
      const res = C.resources[node.grade];
      list = list.map(function (p) {
        if (!State.portAdopts(t, p)) return p;
        if (p.accepts && p.accepts.indexOf(node.grade) < 0) return p;
        return Object.assign({}, p, { res: node.grade, label: res.name });
      });
    }

    if (node && node.pracRes && C.resources[node.pracRes]) {
      const pr = C.resources[node.pracRes];
      list = list.map(p => Object.assign({}, p, {
        res: node.pracRes, label: pr.name,
        accepts: p.accepts ? [node.pracRes] : undefined,
      }));
    }

    if (node && list.some(p => p.poolRes)) {
      const site = State.siteOf(node);
      const rid = site && GG.sim ? GG.sim.poolRes(site) : null;
      const res = rid && C.resources[rid];
      if (res) list = list.map(p => (p.poolRes
        ? Object.assign({}, p, { res: rid, label: res.name }) : p));
    }

    const rockCap = C.rockOutCap();
    if (list.some(p => p.rockOut) && isFinite(rockCap)) {
      if (node) {
        const site = State.siteOf(node);
        const mix = (site && GG.sim) ? GG.sim.mixOf(site) : null;
        if (mix) list = list.filter(p => !p.rockOut || (mix[p.res] > 0) ||
                                         ((node.obuf || {})[p.id] || 0) > 1e-9);
      } else {
        let n = 0;
        list = list.filter(p => !p.rockOut || ++n <= rockCap);
      }
    }
    return list;
  };

  State.siteTypes = function (t) {
    if (!t || !t.siteType) return [];
    return Array.isArray(t.siteType) ? t.siteType : [t.siteType];
  };

  State.fitsSite = function (t, site) {
    const want = State.siteTypes(t);
    if (!want.length) return true;
    if (!site || want.indexOf(site.type) < 0) return false;
    return State.rockOk(t, site);
  };

  State.rockOk = function (t, site) {
    if (!site || site.type !== 'meteorite') return true;
    const kind = site.rare || 'common';
    if (t.rockKinds && t.rockKinds.indexOf(kind) < 0) return false;
    if (t.rockNot && t.rockNot.indexOf(kind) >= 0) return false;
    return true;
  };

  State.orList = function (names) {
    names = (names || []).filter(Boolean);
    if (!names.length) return '';
    const t = (GG.i18n && GG.i18n.t) ? GG.i18n.t : null;
    const or = t ? t('ui.or') : ' or ';
    if (names.length === 1) return names[0];
    const sep = t ? t('ui.listSep') : ', ';
    return names.slice(0, -1).join(sep) + or + names[names.length - 1];
  };

  State.siteTypeName = function (t) {
    const names = State.siteTypes(t).map(id => (C.nodeTypes[id] || {}).name);
    return State.orList(names) || 'site';
  };
  State.acceptsRes = function (port, res) {
    return (port.accepts || [port.res]).indexOf(res) >= 0;
  };

  State.carriable = function (t) {
    const seen = {};
    ((t.ports && t.ports.in) || []).forEach(function (p) {
      (p.accepts || [p.res]).forEach(function (r) { seen[r] = 1; });
    });
    return Object.keys(seen);
  };

  State.laneInit = function (n, t) {
    n.lg = n.lg || {}; n.lb = n.lb || {};
    t.lanes.forEach(function (L) {
      if (n.lg[L] === undefined) n.lg[L] = null;
      n.lb[L] = n.lb[L] || {};
    });
  };
  State.portLane = function (t, portId, dir) {
    const p = ((t.ports && t.ports[dir || 'in']) || []).find(x => x.id === portId);
    return p ? (p.lane || null) : null;
  };
  State.laneOutPort = function (t, lane) {
    const p = ((t.ports && t.ports.out) || []).find(x => x.lane === lane);
    return p ? p.id : null;
  };
  State.laneInPorts = function (t, lane) {
    return ((t.ports && t.ports.in) || []).filter(x => x.lane === lane).map(x => x.id);
  };

  State.outUndecided = function (a, portId) {
    const at = C.nodeTypes[a.type];
    if (at.mergeLock) return !a.grade;
    if (at.lanes) {
      const L = State.portLane(at, portId, 'out');
      return !!L && !(a.lg && a.lg[L]);
    }
    return false;
  };

  State.routeBlock = function (nodeId, outPortId, resList, seen) {
    seen = seen || {};
    if (seen[nodeId]) return null;
    seen[nodeId] = 1;
    for (const l of State.linksFrom(nodeId)) {
      if (outPortId && l.fromPort !== outPortId) continue;
      const dst = State.node(l.to);
      if (!dst) continue;
      const dp = State.portsOf(dst, 'in').find(pp => pp.id === l.toPort);
      if (!dp) continue;

      const fits = resList.filter(r => State.acceptsRes(dp, r));
      if (!fits.length) return { label: dp.label, node: dst };
      const dt = C.nodeTypes[dst.type];
      const dLane = dt.lanes ? State.portLane(dt, l.toPort, 'in') : null;
      const open = dt.lanes ? (!!dLane && !(dst.lg && dst.lg[dLane]))
                            : (dt.mergeLock && !dst.grade);
      if (!open) continue;
      const deeper = State.routeBlock(dst.id, dLane ? State.laneOutPort(dt, dLane) : null,
                                      fits, seen);
      if (deeper) return deeper;
    }
    return null;
  };

  const ROW = 19, HEAD = 46, PAD = 11, CAP_ROW = 21, COLLECT = 30;

  State.capRows = function (t, ctx) {
    if (t.recruit) return 2;
    if (t.lanes) return t.lanes.length;

    if (ctx && GG.sim && GG.sim.robotFree && GG.sim.robotFree(ctx)) return 0;

    if (ctx && t.recipe && t.recipe.maxMade && GG.sim && GG.sim.roadDone && GG.sim.roadDone(ctx)) return 0;

    if (t.print) return 2;
    if (t.recipe && t.placement !== 'onSite') {
      return Math.min(2, Object.keys(t.recipe.inputs).length +
                         (t.recipe.wf ? 1 : 0) + (t.recipe.kw ? 1 : 0));
    }

    if (t.capBand === false) return 0;

    if (t.collectB) return 2;

    if (ctx && t.powerUp && (C.ui || {}).powerUpBandGated !== false &&
        !C.driveIns(t).length &&
        !State.portsOf(ctx, 'in').some(p => p.id === t.powerUp.port)) return 0;

    if (State.powerUpRow(t, ctx)) return 2;
    if (State.outletRow(t)) return (t.buffer || t.store || t.bank) ? 2 : 1;
    return (t.buffer || t.store || t.bank) ? 1 : 0;
  };

  State.powerUpRow = function (t, ctx) {
    if ((C.ui || {}).powerUpRow === false) return false;
    if (!t.powerUp || !(t.store || t.bank)) return false;
    if (!ctx) return true;
    if (GG.sim && GG.sim.robotFree && GG.sim.robotFree(ctx)) return false;
    return State.portsOf(ctx, 'in').some(p => p.id === t.powerUp.port);
  };

  State.outletMode = function () {
    const cfg = (C.ui || {}).outletBar;
    if (!cfg || cfg.enabled === false) return 'off';
    const live = GG.menu && GG.menu.outletBar;
    return (cfg.options || []).indexOf(live) >= 0 ? live : (cfg.def || 'off');
  };

  State.snapMode = function () {
    const cfg = (C.ui || {}).gridSnap;
    if (!cfg || cfg.enabled === false) return 'free';
    const live = GG.menu && GG.menu.gridSnap;
    return (cfg.options || []).indexOf(live) >= 0 ? live : (cfg.def || 'free');
  };

  State.snapSize = function () {
    const cfg = (C.ui || {}).gridSnap || {};
    if (State.snapMode() !== 'grid') return C.world.snap;
    return cfg.size || C.world.grid;
  };

  State.snapTo = function (v) {
    const s = State.snapSize();
    return s > 0 ? Math.round(v / s) * s : v;
  };

  State.outletRow = function (t) {
    if (!(C.ui || {}).outletRow) return false;
    if (State.outletMode() !== 'on') return false;
    if (t.placement === 'onSite') return false;
    if (!t.buffer || !t.outBuffer) return false;
    if (t.holdLock || t.collectB || t.store || t.bank) return false;
    if (GG.sim && GG.sim.routingVessel && GG.sim.routingVessel(t)) return false;
    if (t.capBand === false) return false;
    return true;
  };

  State.rowsOf = function (nodeOrTypeId) {
    const typeId = typeof nodeOrTypeId === 'string' ? nodeOrTypeId : nodeOrTypeId.type;
    const t = C.nodeTypes[typeId];

    const node = typeof nodeOrTypeId === 'string' ? null : nodeOrTypeId;
    const ord = node && node.portOrder && ((C.ui || {}).socketOrder || {}).enabled !== false ? node.portOrder : null;
    const sortBy = function (list, o) {
      if (!o || !o.length) return list;
      const rank = p => { const i = o.indexOf(p.id); return i < 0 ? 1e6 : i; };
      return list.slice().sort((a, b) => rank(a) - rank(b));
    };
    const ins = sortBy(State.portsOf(nodeOrTypeId, 'in'), ord && ord.in);
    const outs = sortBy(State.portsOf(nodeOrTypeId, 'out'), ord && ord.out);
    const vouts = t.virtualOut || [];
    const rows = [];
    ins.forEach((p, i) => rows.push({ kind: 'in', port: p, idx: i, n: ins.length }));
    outs.forEach((p, i) => rows.push({ kind: 'out', port: p, idx: i, n: outs.length + vouts.length }));

    vouts.forEach((v, i) => rows.push({ kind: 'vout', v: v, vi: i,
                                        idx: outs.length + i, n: outs.length + vouts.length }));

    if (t.cardGroups && C.ui.cardGroups !== false) {
      const order = t.cardGroups.map(gp => gp.id);
      const at = r => { const g = r.kind === 'vout' ? r.v.group : r.port.group;
                        const i = order.indexOf(g); return i < 0 ? -1 : i; };
      rows.sort((a, b) => at(a) - at(b));
    }
    return rows;
  };

  State.canReorder = function (n, dir) {
    const o = (C.ui || {}).socketOrder;
    if (!o || !o.enabled || !n) return false;
    if (dir === 'out' && o.outputs === false) return false;
    const t = State.type(n);
    if (!t || t.kind !== 'machine') return false;
    const list = State.portsOf(n, dir);
    return list.length >= 2 && !list.some(p => p.dynamic);
  };

  State.portOrderOf = function (n, dir) {
    return State.rowsOf(n).filter(r => r.kind === dir && r.port).map(r => r.port.id);
  };
  State.setPortOrder = function (n, dir, ids) {
    const o = Object.assign({}, n.portOrder || {});
    if (ids) o[dir] = ids.slice(); else delete o[dir];
    if (Object.keys(o).length) n.portOrder = o; else delete n.portOrder;
  };

  State.sizeOf = function (nodeOrTypeId) {
    const typeId = typeof nodeOrTypeId === 'string' ? nodeOrTypeId : nodeOrTypeId.type;
    const t = C.nodeTypes[typeId];
    if (t.kind === 'site') {
      return typeof nodeOrTypeId === 'string'
        ? { w: t.w, h: State.siteHeight(t, t.slots) }
        : State.siteBox(nodeOrTypeId);
    }
    const rows = State.rowsOf(nodeOrTypeId).length;
    return {
      w: t.cardW || C.cardWidth,
      h: HEAD + State.capRows(t, nodeOrTypeId) * CAP_ROW + rows * ROW +
         ((t.collect || t.action) ? COLLECT : 0) + (State.holdRow(t) || State.feedRow(t) ? COLLECT : 0) + PAD,
    };
  };

  State.maxSizeOf = function (typeId) {
    const t = C.nodeTypes[typeId];
    if (t.kind === 'site') return { w: t.w, h: State.siteHeight(t, t.slots) };
    const ins = ((t.ports && t.ports.in) || []).length;

    const decl = (t.ports && t.ports.out) || [];
    const rock = decl.filter(p => p.rockOut).length;
    const outs = decl.length - Math.max(0, rock - C.rockOutCap()) +
                 (t.virtualOut || []).length;
    return {
      w: C.cardWidth,
      h: HEAD + State.capRows(t) * CAP_ROW + (ins + outs) * ROW +
         ((t.collect || t.action) ? COLLECT : 0) + (State.holdRow(t) || State.feedRow(t) ? COLLECT : 0) + PAD,
    };
  };

  State.holdRow = function (t) { return !!(t && t.rocket && t.rocket.holdGems > 0 && t.rocket.flight.cargo === 'gems'); };

  State.feedRow = function (t) { return !!(t && t.recipe && t.recipe.handGems > 0); };
  State.METRICS = { ROW: ROW, HEAD: HEAD, PAD: PAD, CAP_ROW: CAP_ROW, COLLECT: COLLECT };

  let slotCache = {};
  State.clearSlotCache = function () { slotCache = {}; };
  State.slotSize = function (siteType) {
    const k = siteType || '', keep = C.sim.slotCache !== false;
    if (keep && slotCache[k]) return slotCache[k];
    const out = slotSizeOf(siteType);
    if (keep) slotCache[k] = out;
    return out;
  };
  function slotSizeOf(siteType) {
    const per = siteType && (C.ui || {}).slotPerGround !== false;
    let w = 0, h = 0;
    Object.keys(C.nodeTypes).forEach(function (k) {
      const t = C.nodeTypes[k];
      if (t.placement !== 'onSite') return;
      if (per && State.siteTypes(t).indexOf(siteType) < 0) return;
      const s = State.maxSizeOf(k);
      w = Math.max(w, s.w); h = Math.max(h, s.h);
    });
    if (per && !h) return State.slotSize();

    if (per) h = Math.min(State.slotSize().h, h + ((C.ui || {}).slotPad || 0));
    return { w: w, h: h };
  }

  State.siteHeight = function (t, slots) {
    const n = Math.max(1, slots || t.slots || 1);
    const cs = State.slotSize(t.id);
    return n * cs.h + (n - 1) * (t.slotGap || 0) + (t.slotMargin || 24);
  };
  State.siteBox = function (site) {
    const t = C.nodeTypes[site.type];
    return { w: site.w || t.w, h: State.siteHeight(t, State.siteSlots(site)) };
  };
  State.siteSlots = function (site) {
    return site.slots || C.nodeTypes[site.type].slots;
  };

  State.slotsOf = function (site) {
    const t = C.nodeTypes[site.type];
    const cs = State.slotSize(site.type);
    const step = cs.h + t.slotGap;
    const n = State.siteSlots(site);
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({ x: site.x, y: site.y + (i - (n - 1) / 2) * step, index: i });
    }
    return out;
  };

  State.siteAt = function (x, y) {
    return State.sitesHere().find(s => {
      const b = State.siteBox(s);
      return Math.abs(x - s.x) <= b.w / 2 && Math.abs(y - s.y) <= b.h / 2;
    });
  };

  State.onSiteMachines = function (site) {
    const b = State.siteBox(site);
    return State.machines().filter(n => C.nodeTypes[n.type].placement === 'onSite' &&
      (n.loc || C.locations[0].id) === (site.loc || C.locations[0].id) &&
      Math.abs(n.x - site.x) <= b.w / 2 && Math.abs(n.y - site.y) <= b.h / 2);
  };

  State.freeSlot = function (site, x, y, exceptId) {
    const slots = State.slotsOf(site);
    const taken = new Set();
    State.onSiteMachines(site).forEach(c => {
      if (c.id === exceptId) return;
      let best = 0, bestD = Infinity;
      slots.forEach((sl, i) => {
        const d = Math.hypot(c.x - sl.x, c.y - sl.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      taken.add(best);
    });
    const free = slots.filter((sl, i) => !taken.has(i));
    if (!free.length) return null;
    free.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
    return free[0];
  };

  State.siteOf = function (node) {
    return State.sitesIn(node.loc || C.locations[0].id).find(s => {
      const b = State.siteBox(s);
      return Math.abs(node.x - s.x) <= b.w / 2 && Math.abs(node.y - s.y) <= b.h / 2;
    }) || null;
  };

  State.isUnlocked = function (typeId) {
    const t = C.nodeTypes[typeId];
    if (!t || !t.buildable) return false;
    if (t.unlockedFromStart) return true;

    if (t.trial) {
      if (GG.sim && GG.sim.demoNode && GG.sim.demoNode(typeId)) return false;
      return !!(State.g.objectives && State.g.objectives[t.trial]);
    }

    if (t.unlockFlag) {
      if (GG.sim && GG.sim.demoNode && GG.sim.demoNode(typeId)) return false;
      return !!State.g[t.unlockFlag];
    }
    if (t.siteType === 'meteorite') {
      if (GG.sim && GG.sim.demoNode && GG.sim.demoNode(typeId)) return false;
      return (State.g.rocksSeen || 0) > 0;
    }
    return C.skills.some(s => State.hasSkill(s.id) && (s.unlocks || []).includes(typeId));
  };

  State.seedSeenNodes = function () {
    const g = State.g;
    g.seenNodes = g.seenNodes || {};
    Object.keys(C.nodeTypes).forEach(k => { if (State.isUnlocked(k)) g.seenNodes[k] = true; });
  };

  State.seedWeather = function (g) {
    g = g || State.g;
    if (!g.wxAt || typeof g.wxAt !== 'object') g.wxAt = {};
    g.wxSeq = g.wxSeq || g.wxNextSeq || 0;
    const first = ((C.weather.locs || [])[0] || {}).loc;
    if (first && g.wx !== undefined) {
      const had = g.wx || g.wxNext || g.wxRoll;
      if (had && !g.wxAt[first]) {
        g.wxAt[first] = {
          id: g.wx || null, left: g.wxLeft || 0, roll: g.wxRoll || 0,
          next: g.wxNext || null, nextLeft: g.wxNextLeft || 0,
          nextSeq: g.wxNextSeq || 0, flash: 0, blocked: !!g.wxBlocked,
        };
      }
    }
    ['wx', 'wxLeft', 'wxRoll', 'wxNext', 'wxNextLeft', 'wxNextSeq', 'wxFlash', 'wxBlocked']
      .forEach(k => { delete g[k]; });

    const has = {};
    (C.weather.locs || []).forEach(w => { has[w.loc] = 1; });
    Object.keys(g.wxAt).forEach(k => { if (!has[k]) delete g.wxAt[k]; });
  };

  State.seedReviveSeen = function () {
    const g = State.g;
    g.reviveSeen = g.reviveSeen || {};
    C.locations.forEach(function (L) {
      if (g.locSpawned && g.locSpawned[L.id]) g.reviveSeen[L.id] = GG.sim.reviveStage(L.id);
    });
  };

  State.seedSkillTold = function () {
    const g = State.g;
    g.skillTold = g.skillTold || {};
    GG.sim.skillsInReach().forEach(function (sk) { g.skillTold[sk.id] = 1; });
  };

  State.isNewNode = function (typeId) {
    if (!C.dock.newBadge) return false;
    return State.isUnlocked(typeId) && !(State.g.seenNodes && State.g.seenNodes[typeId]);
  };
  State.newNodeCount = function (catId) {
    return Object.keys(C.nodeTypes).filter(k =>
      State.isNewNode(k) && (!catId || C.nodeTypes[k].category === catId)).length;
  };
  State.markNodeSeen = function (typeId) {
    if (!State.g.seenNodes) State.g.seenNodes = {};
    if (State.g.seenNodes[typeId]) return false;
    State.g.seenNodes[typeId] = true;
    return true;
  };

  State.isNewPlace = function (id) {
    if (!C.ui || C.ui.newPlace === false) return false;
    if (id === State.g.loc) return false;
    const L = State.locationById(id);
    return !!(L && State.locOpen(L) && !(State.g.seenPlaces && State.g.seenPlaces[id]));
  };
  State.markPlaceSeen = function (id) {
    if (!State.g.seenPlaces) State.g.seenPlaces = {};
    if (State.g.seenPlaces[id]) return false;
    State.g.seenPlaces[id] = true;
    return true;
  };
  State.seedSeenPlaces = function () {
    const g = State.g;
    g.seenPlaces = g.seenPlaces || {};
    State.openLocations().forEach(L => { g.seenPlaces[L.id] = true; });
  };

  State.portRes = function (node, port, dir) {
    if (!port) return null;
    if (dir !== 'in' || !port.accepts || port.accepts.length < 2) return port.res;
    for (const l of State.linksInto(node.id)) {
      if (l.toPort !== port.id) continue;
      const src = State.node(l.from);
      if (!src) continue;
      const sp = State.portsOf(src, 'out').find(p => p.id === l.fromPort);
      if (sp && C.resources[sp.res]) return sp.res;
    }
    return port.res;
  };

  State.portLabel = function (node, port, dir) {
    if (!port) return '';
    if (dir === 'out' && (C.ui || {}).splitterOutNames && GG.sim && GG.sim.nameOf) {
      const t = C.nodeTypes[node.type];
      if (t && t.ways) {
        const ls = State.g.links.filter(l => l.from === node.id && l.fromPort === port.id);
        const to = ls.length && State.node(ls[0].to);
        if (to) return GG.sim.nameOf(to) + (ls.length > 1 ? ' +' + (ls.length - 1) : '');
      }
    }
    const rid = State.portRes(node, port, dir);
    if (rid !== port.res) {
      const r = C.resources[rid];
      if (r && r.name) return r.name;
    }
    return port.label;
  };

  State.newRun = function (t) {
    const B = C.buildRules;
    return (t && t.newRun && State.g && State.g.buildRules && !(B && B.enabled === false)) ? t.newRun : null;
  };
  State.costOf = function (t) {
    const nr = State.newRun(t);
    return (nr && nr.cost) || (t && t.cost) || null;
  };
  State.priceAtCount = function (typeId, count) {
    const t = C.nodeTypes[typeId];
    const cost = State.costOf(t);
    if (!cost) return 0;
    const free = cost.freeStock || 0;
    if (count < free) return 0;
    return Math.ceil(cost.base * Math.pow(cost.growth, count - free));
  };

  State.priceOf = function (typeId, extra) {
    return State.priceAtCount(typeId, (State.g.builtCount[typeId] || 0) + (extra || 0));
  };

  State.peakBuiltOf = function (typeId) {
    const g = State.g;
    return Math.max(g.builtCount[typeId] || 0, (g.peakBuilt && g.peakBuilt[typeId]) || 0);
  };

  State.buildCap = function (typeId) {
    const t = C.nodeTypes[typeId];
    if (!t || t.cap === undefined) return Infinity;
    const bought = (State.g.caps && State.g.caps[typeId]) || 0;

    return Math.min(t.capMax === undefined ? Infinity : t.capMax,
                    State.baseCap(typeId) + bought * C.capShop.perLevel);
  };

  State.baseCap = function (typeId) {
    const t = C.nodeTypes[typeId];
    const nr = State.newRun(t);
    const cap = (nr && nr.cap !== undefined) ? nr.cap : (t && t.cap);
    if (!t || cap === undefined) return Infinity;
    const F = C.fullCircle || {}, c = (State.g && State.g.cycle) || 0;
    if (!c || (t.capFixed && !F.fixedToo)) return cap;
    return cap * Math.pow(F.capMul || 1, c);
  };
  State.builtOf = function (typeId) { return State.g.builtCount[typeId] || 0; };

  State.builtHere = function (typeId, loc) {
    loc = loc || State.g.loc;
    return State.machines().filter(n => State.capKey(n.type) === typeId &&
      (n.loc || C.locations[0].id) === loc).length;
  };
  State.capRoom = function (typeId) { return State.buildCap(typeId) - State.builtOf(typeId); };
  State.capFull = function (typeId) { return State.capRoom(typeId) <= 0; };

  State.priceCurrencyOf = function (typeId) {
    const cost = State.costOf(C.nodeTypes[typeId]);
    return (cost && cost.currency) || 'ci';
  };

  State.bank = function (cur) { return State.g[cur] || 0; };
  State.spend = function (cur, amount) {
    State.g[cur] = GG.util.pay(State.g[cur] || 0, amount);

    if (cur === 'diamond') State.g.diamondSpent = (State.g.diamondSpent || 0) + amount;
  };
  State.earn = function (cur, amount) {
    State.g[cur] = (State.g[cur] || 0) + amount;
  };

  function S_typeName(node) { return C.nodeTypes[node.type].name; }

  State.snapTarget = function (typeId, x, y) {

    const t = C.nodeTypes[typeId];
    if (t.placement !== 'onSite') return { x: x, y: y, site: null, slot: null };
    const site = State.siteAt(x, y);
    if (!State.fitsSite(t, site)) {
      return { x: x, y: y, site: null, slot: null };
    }
    const slot = State.freeSlot(site, x, y);
    if (!slot) return { x: x, y: y, site: site, slot: null };
    return { x: slot.x, y: slot.y, site: site, slot: slot };
  };

  State.canPlace = function (typeId, x, y) {
    const t = C.nodeTypes[typeId];
    if (!State.isUnlocked(typeId)) return { ok: false, why: 'Not unlocked' };

    if (State.capFull(typeId)) {

      if (t.capFixed || (t.capMax !== undefined && State.buildCap(typeId) >= t.capMax))
        return { ok: false, why: State.buildCap(typeId) > 1
        ? 'There are only ever ' + State.buildCap(typeId)
        : 'There is only ever one' };
      return { ok: false, why: 'All ' + State.buildCap(typeId) + ' are built — raise the ' +
                               'limit in Capacity' };
    }

    if (t.weatherOnly && !GG.sim.wxPlace(State.g.loc)) {
      const names = State.orList(GG.sim.wxLocs()
                      .map(id => (State.locationById(id) || {}).name));

      const head = typeof t.weatherOnly === 'string' ? t.weatherOnly : 'Nothing to read here';
      return { ok: false, why: head + ' — only in ' + (names || 'the weather') };
    }
    if (t.capPerLoc && State.builtHere(typeId) >= t.capPerLoc) {
      return { ok: false, why: 'One to a place, and this one already has ' +
                               (t.capPerLoc > 1 ? t.capPerLoc : 'one') };
    }

    if (t.placement === 'onSite') {
      const want = State.siteTypeName(t);
      const site = State.siteAt(x, y);
      if (!site) return { ok: false, why: 'Must be built on a ' + want };
      if (!State.rockOk(t, site)) {
        return { ok: false, why: t.rockKinds ? 'Only on a plutonium rock' : 'Not on a plutonium rock' };
      }
      if (!State.fitsSite(t, site)) return { ok: false, why: 'Only on a ' + want };
      if (!State.freeSlot(site, x, y)) return { ok: false, why: 'Both slots are taken' };
    } else if (t.autoHire && (!t.autoHire.hybrid || State.findDock(x, y))) {

      if (!State.findDock(x, y)) return { ok: false, why: 'Only on a Bank with room for an Agency' };
    } else {
      const size = State.sizeOf(typeId);

      const clash = State.machinesHere().some(n => {
        const ns = State.sizeOf(n);
        return Math.abs(n.x - x) < (ns.w + size.w) / 2 &&
               Math.abs(n.y - y) < (ns.h + size.h) / 2;
      });
      if (clash) return { ok: false, why: 'Overlaps another machine' };
      const onSite = State.siteAt(x, y);
      if (onSite) return { ok: false, why: 'Cannot build on a ' + S_typeName(onSite) };
    }

    const cur = State.priceCurrencyOf(typeId);
    if (!GG.util.canAfford(State.bank(cur), State.priceOf(typeId))) {
      return { ok: false, why: 'Not enough ' + C.currencies[cur].short };
    }
    return { ok: true };
  };

  const AGENCY = () => Object.values(C.nodeTypes).find(t => t.autoHire);
  State.dockSpot = function (bank) {
    const A = AGENCY();
    const bs = State.sizeOf(bank), as = State.sizeOf(A.id);
    return { x: bank.x, y: bank.y - bs.h / 2 - as.h / 2 - A.autoHire.gap };
  };

  State.bankBound = function (n) { const t = C.nodeTypes[n.type]; return !!(t && t.autoHire && !t.autoHire.hybrid); };
  State.bankAgency = function (bank, exceptId) {
    return State.g.nodes.find(n => n.dock === bank.id && n.id !== exceptId && C.nodeTypes[n.type].autoHire) || null;
  };

  State.findDock = function (x, y, selfId) {
    const A = AGENCY();
    if (!A) return null;
    let best = null, bd = A.autoHire.snapRange;
    State.machinesHere().forEach(function (b) {
      if (!C.nodeTypes[b.type].interestPct || b.agencySpot === false || State.bankAgency(b, selfId)) return;
      const s = State.dockSpot(b), d = Math.hypot(s.x - x, s.y - y);
      if (d <= bd) { bd = d; best = b; }
    });
    return best;
  };

  State.syncDocks = function (skip) {
    State.g.nodes.forEach(function (n) {
      if (!n.dock || !C.nodeTypes[n.type].autoHire) return;
      const b = State.node(n.dock);
      if (!b || !C.nodeTypes[b.type].interestPct || (b.loc || '') !== (n.loc || '')) { n.dock = null; return; }
      if (skip && skip[n.id]) return;
      const s = State.dockSpot(b);
      n.x = s.x; n.y = s.y;
    });
  };

  State.place = function (typeId, x, y) {

    if (State.locked()) return { ok: false, why: 'Nothing can be built in here' };
    const check = State.canPlace(typeId, x, y);
    if (!check.ok) return check;
    const snap = State.snapTarget(typeId, x, y);
    const price = State.priceOf(typeId);
    const cur = State.priceCurrencyOf(typeId);
    State.spend(cur, price);
    const n = makeNode(typeId, snap.x, snap.y, State.g);
    State.g.nodes.push(n);

    const FC = C.fullCircle || {};
    const cc = State.g.circleCarry, cf = FC.carryOn && (FC.carry || {})[typeId];
    if (cc && cf && cc[typeId] > 0 && !State.practice) {
      n[cf] = cc[typeId];
      cc[typeId] = 0;
      if (GG.sim && GG.sim.clearLadder) GG.sim.clearLadder();
    }

    if (C.nodeTypes[typeId].autoHire) {
      const b = State.findDock(x, y, n.id);
      if (b) { n.dock = b.id; State.syncDocks(); }
    }
    State.g.builtCount[typeId] = (State.g.builtCount[typeId] || 0) + 1;

    State.g.peakBuilt = State.g.peakBuilt || {};
    State.g.peakBuilt[typeId] = Math.max(State.g.peakBuilt[typeId] || 0,
                                         State.g.builtCount[typeId]);

    if (C.nodeTypes[typeId].duty && GG.sim) GG.sim.startSolarClock();
    return { ok: true, node: n, price: price, currency: cur };
  };

  State.removeNode = function (id) {

    if (State.locked()) return;
    const n = State.node(id);
    if (!n || C.nodeTypes[n.type].kind === 'site') return;
    const ck = State.capKey(n.type);
    State.g.builtCount[ck] = Math.max(0, (State.g.builtCount[ck] || 1) - 1);
    const cur = State.priceCurrencyOf(n.type);
    const refund = Math.floor(State.priceOf(n.type) * C.balance.refundRatio);
    if (refund > 0) State.earn(cur, refund);
    const dt = C.nodeTypes[n.type];
    if (n.till) State.earn(dt.collect.cur, n.till);
    if (n.tillB) State.earn(dt.collectB.cur, n.tillB);
    State.givePrismsBack(n);
    State.g.links = State.g.links.filter(l => l.from !== id && l.to !== id);
    State.g.nodes = State.g.nodes.filter(x => x.id !== id);
    State.g.nodes.forEach(State.releaseGrade);
    return { amount: refund, currency: cur };
  };

  State.givePrismsBack = function (n) {
    if (n && n.prisms > 0) { State.earn('prism', n.prisms); n.prisms = 0; }
  };

  State.removeSite = function (site) {
    const gone = State.onSiteMachines(site);
    gone.forEach(m => {
      const ck = State.capKey(m.type);
      State.g.builtCount[ck] = Math.max(0, (State.g.builtCount[ck] || 1) - 1);
      State.givePrismsBack(m);
      State.g.links = State.g.links.filter(l => l.from !== m.id && l.to !== m.id);
    });
    const ids = new Set(gone.map(m => m.id).concat([site.id]));
    State.g.nodes = State.g.nodes.filter(n => !ids.has(n.id));
    State.g.nodes.forEach(State.releaseGrade);

    if (!site.drained && C.nodeTypes[site.type].countsDrained !== false)
      State.g.sitesDrained = (State.g.sitesDrained || 0) + 1;
    return { machines: gone.length, loc: site.loc };
  };

  State.freeStanding = function (n) {
    return !!n && C.nodeTypes[n.type].kind === 'machine' &&
           C.nodeTypes[n.type].placement !== 'onSite';
  };

  State.makeBlueprint = function (ids, name) {
    const all = ids.map(State.node).filter(n => n && C.nodeTypes[n.type].kind === 'machine');

    const nodes = all.filter(State.freeStanding).filter(n => !State.bankBound(n));
    if (!nodes.length) {
      return { ok: false, why: 'A blueprint can only hold free-standing machines' };
    }

    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
    const cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
    const cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;

    const idx = {};
    nodes.forEach((n, i) => { idx[n.id] = i; });

    const links = State.g.links
      .filter(l => idx[l.from] !== undefined && idx[l.to] !== undefined)

      .map(l => ({ a: idx[l.from], ap: l.fromPort, b: idx[l.to], bp: l.toPort,
                   sq: l.ortho || undefined,
                   bends: (l.bends && l.bends.length) ? l.bends.map(q => ({ dx: q.dx, dy: q.dy })) : undefined }));

    const bp = {
      id: 'bp' + (State.g.idSeed++),
      name: (name || '').trim() || 'Blueprint ' + ((State.g.blueprints || []).length + 1),

      nodes: nodes.map(function (n) {
        const it = { type: State.capKey(n.type), dx: n.x - cx, dy: n.y - cy };
        const set = {};
        ((C.ui || {}).blueprintSettings || []).forEach(function (k) {
          if (Object.prototype.hasOwnProperty.call(n, k)) set[k] = n[k];
        });
        if (Object.keys(set).length) it.set = set;
        return it;
      }),
      links: links,
    };
    State.g.blueprints = State.g.blueprints || [];
    State.g.blueprints.push(bp);
    return { ok: true, bp: bp, skipped: all.length - nodes.length };
  };

  State.canRelocate = function () { return !!(C.relocate && C.relocate.enabled); };

  State.onSiteMove = function (n) {
    return !!n && C.nodeTypes[n.type].kind === 'machine' &&
           C.nodeTypes[n.type].placement === 'onSite' &&
           !!(C.relocate && C.relocate.carryOnSite);
  };

  State.makeMove = function (ids) {
    if (!State.canRelocate()) return { ok: false, why: 'Moving is switched off' };
    const all = ids.map(State.node).filter(n => n && C.nodeTypes[n.type].kind === 'machine');

    const nodes = all.filter(State.freeStanding).filter(n => !State.bankBound(n));
    const onSite = all.filter(State.onSiteMove);
    if (!nodes.length && !onSite.length) {
      return { ok: false, why: 'Only free-standing machines can be moved' };
    }

    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
    const cx = nodes.length ? (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2 : 0;
    const cy = nodes.length ? (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2 : 0;
    return {
      ok: true,
      skipped: all.length - nodes.length - onSite.length,
      pack: {
        from: (nodes[0] || onSite[0]).loc || C.locations[0].id,
        items: nodes.map(n => ({ id: n.id, type: n.type, dx: n.x - cx, dy: n.y - cy })),
        onSite: onSite.map(n => ({ id: n.id, type: n.type })),
      },
    };
  };

  State.moveOnSite = function (pack) {
    return (pack.onSite || []).filter(it => !!State.node(it.id));
  };

  State.onSitePlan = function (pack, x, y) {
    const live = State.moveOnSite(pack);
    if (!live.length) return [];
    const loc = State.g.loc;
    const moving = {};
    live.forEach(it => { moving[it.id] = true; });
    const taken = [];
    const plan = [];
    for (const it of live) {
      const t = C.nodeTypes[it.type];

      const sites = State.sitesIn(loc)
        .filter(st => State.fitsSite(t, st))
        .sort((a, b) => ((a.x - x) * (a.x - x) + (a.y - y) * (a.y - y)) -
                        ((b.x - x) * (b.x - x) + (b.y - y) * (b.y - y)));
      let got = null;
      for (const st of sites) {
        for (const sl of State.slotsOf(st)) {
          if (taken.some(k => k.site === st && k.index === sl.index)) continue;

          const occupied = State.onSiteMachines(st).some(function (m) {
            if (moving[m.id]) return false;
            const slots = State.slotsOf(st);
            let best = 0, bestD = Infinity;
            slots.forEach(function (s2, i) {
              const d = (m.x - s2.x) * (m.x - s2.x) + (m.y - s2.y) * (m.y - s2.y);
              if (d < bestD) { bestD = d; best = i; }
            });
            return best === sl.index;
          });
          if (occupied) continue;
          got = { site: st, index: sl.index, x: sl.x, y: sl.y };
          break;
        }
        if (got) break;
      }
      if (!got) return null;
      taken.push(got);
      plan.push({ id: it.id, type: it.type, x: got.x, y: got.y });
    }
    return plan;
  };

  State.moveItems = function (pack) {
    return pack.items.filter(it => !!State.node(it.id));
  };

  State.moveSize = function (pack) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    State.moveItems(pack).forEach(function (it) {
      const s = State.sizeOf(it.type);
      x0 = Math.min(x0, it.dx - s.w / 2); x1 = Math.max(x1, it.dx + s.w / 2);
      y0 = Math.min(y0, it.dy - s.h / 2); y1 = Math.max(y1, it.dy + s.h / 2);
    });
    return { w: x1 - x0, h: y1 - y0 };
  };

  State.canMoveTo = function (pack, x, y) {
    if (!State.canRelocate()) return { ok: false, why: 'Moving is switched off' };
    const loc = State.g.loc;
    const live = State.moveItems(pack);
    const onSite = State.moveOnSite(pack);
    if (!live.length && !onSite.length) return { ok: false, why: 'Nothing left to move' };

    if (onSite.length && !State.onSitePlan(pack, x, y)) {
      const t = C.nodeTypes[onSite[0].type];
      const sType = State.siteTypeName(t);
      return { ok: false, why: 'No free slot on a ' + sType + ' here' };
    }

    const moving = {};
    live.forEach(it => { moving[it.id] = true; });

    const want = {};
    for (const it of live.concat(onSite)) {
      const t = C.nodeTypes[it.type];
      if (t.weatherOnly && !GG.sim.wxPlace(loc)) {
        return { ok: false, why: 'A ' + t.name + ' can only stand where the weather is' };
      }
      if (t.capPerLoc) {

        const here = State.machines().filter(n =>
          n.type === it.type && !moving[n.id] &&
          (n.loc || C.locations[0].id) === loc).length;
        want[it.type] = (want[it.type] || 0) + 1;
        if (here + want[it.type] > t.capPerLoc) {
          return { ok: false, why: 'One ' + t.name + ' to a place, and this one has ' +
                                   (here ? 'one already' : 'no room') };
        }
      }
    }

    for (const it of live) {
      const nx = x + it.dx, ny = y + it.dy;
      if (State.siteAt(nx, ny)) return { ok: false, why: 'Overlaps a site' };
      const size = State.sizeOf(it.type);

      const clash = State.machinesHere().some(function (n) {
        if (moving[n.id]) return false;
        const ns = State.sizeOf(n);
        return Math.abs(n.x - nx) < (ns.w + size.w) / 2 &&
               Math.abs(n.y - ny) < (ns.h + size.h) / 2;
      });
      if (clash) return { ok: false, why: 'Overlaps another machine' };
    }
    return { ok: true };
  };

  State.relocate = function (pack, x, y) {

    if (State.locked()) return { ok: false, why: 'Nothing can be moved in here' };
    const chk = State.canMoveTo(pack, x, y);
    if (!chk.ok) return chk;
    const loc = State.g.loc;
    const moved = [];
    State.moveItems(pack).forEach(function (it) {
      const n = State.node(it.id);
      n.x = x + it.dx; n.y = y + it.dy; n.loc = loc;
      moved.push(n);
    });

    (State.onSitePlan(pack, x, y) || []).forEach(function (it) {
      const n = State.node(it.id);
      n.x = it.x; n.y = it.y; n.loc = loc;
      moved.push(n);
    });

    moved.slice().forEach(function (b) {
      if (!C.nodeTypes[b.type].interestPct) return;
      const a = State.bankAgency(b);
      if (a && moved.indexOf(a) < 0) { a.loc = loc; moved.push(a); }
    });
    State.syncDocks();

    const before = State.g.links.length;
    State.g.links = State.g.links.filter(function (l) {
      const a = State.node(l.from), b = State.node(l.to);
      if (!a || !b) return false;
      return (a.loc || C.locations[0].id) === (b.loc || C.locations[0].id);
    });
    const cut = before - State.g.links.length;
    State.g.nodes.forEach(State.releaseGrade);

    State.g.relocated = (State.g.relocated || 0) + 1;

    if (pack.from && pack.from !== loc) State.g.bigMove = Math.max(State.g.bigMove || 0, moved.length);

    if (!State.g.relocMoved) State.g.relocMoved = {};
    moved.forEach(function (n) { State.g.relocMoved[n.type + '@' + loc] = true; });

    if (pack.from && pack.from !== loc && GG.sim && GG.sim.heldOf) {
      moved.forEach(function (n) {
        if (GG.sim.heldOf(n) > 1e-6) {
          State.g.relocHeld = State.g.relocHeld || {};
          State.g.relocHeld[n.type] = true;
        }
      });
    }
    return { ok: true, nodes: moved, cut: cut, loc: loc, from: pack.from };
  };

  State.blueprints = function () { return State.g.blueprints || []; };
  State.blueprintById = function (id) { return State.blueprints().find(b => b.id === id); };
  State.removeBlueprint = function (id) {
    State.g.blueprints = State.blueprints().filter(b => b.id !== id);
  };

  State.blueprintCost = function (bp) {
    const bill = {}, seen = {};
    bp.nodes.forEach(function (it) {
      const cur = State.priceCurrencyOf(it.type);
      const p = State.priceOf(it.type, seen[it.type] || 0);
      seen[it.type] = (seen[it.type] || 0) + 1;
      if (p > 0) bill[cur] = (bill[cur] || 0) + p;
    });
    return bill;
  };

  function bpNorm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9а-яё]/g, ''); }
  function bpLev(a, b) {
    const m = a.length, n = b.length, d = [];
    for (let j = 0; j <= n; j++) d[j] = j;
    for (let i = 1; i <= m; i++) {
      let prev = d[0]; d[0] = i;
      for (let j = 1; j <= n; j++) {
        const t = d[j];
        d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = t;
      }
    }
    return d[n];
  }

  State.passThrough = function (typeId) {
    const t = C.nodeTypes[typeId], p = (t && t.ports) || {};
    const outs = (p.out || []).map(x => x.res);
    if (!outs.length || !(p.in || []).length) return false;
    const ins = {};
    (p.in || []).forEach(x => (x.accepts || [x.res]).forEach(r => { ins[r] = 1; }));
    return outs.every(r => ins[r]);
  };

  State.sellsOrBurns = function (typeId) {
    const t = C.nodeTypes[typeId];
    return !!t && [t.valueGroup || t.id, t.valueGroupB].some(g => g === 'market' || g === 'landfill');
  };
  const bpMakes = id => !State.passThrough(id) && !State.sellsOrBurns(id);
  function bpScore(n, c) {
    if (c.length < 3) return 0;
    let s = 1 - bpLev(n, c) / Math.max(n.length, c.length);
    if (c.length >= 4 && n.indexOf(c) >= 0) s = Math.max(s, 0.95);
    if (n.length >= 5 && c.indexOf(n) >= 0) s = Math.max(s, n.length / c.length);
    return s;
  }
  State.blueprintNamed = function (name, inside) {
    const n = bpNorm(name), B = (C.ui || {}).blueprintMain || {};
    if (n.length < 3) return null;
    let best = null, score = 0;
    const offer = function (id, s) { if (inside && inside[id]) s += 0.001; if (s > score) { score = s; best = id; } };
    const machines = Object.keys(C.nodeTypes).filter(function (id) {
      const t = C.nodeTypes[id];
      return t.kind === 'machine' && t.category !== 'practice';
    });
    machines.forEach(function (id) {
      offer(id, Math.max(bpScore(n, bpNorm(C.nodeTypes[id].name)), bpScore(n, bpNorm(id))));
    });

    const mats = Object.keys(C.resources).map(k => ({ k: k, name: C.resources[k].name }))
      .concat(Object.keys(C.currencies || {}).map(k => ({ k: k, name: C.currencies[k].name })));
    mats.forEach(function (m) {
      const s = Math.max(bpScore(n, bpNorm(m.name)), bpScore(n, bpNorm(m.k)));
      if (s <= score) return;
      const makers = machines.filter(function (id) {
        const t = C.nodeTypes[id];
        if (t.placement === 'onSite' || !bpMakes(id)) return false;
        return ((t.ports && t.ports.out) || []).some(p => p.res === m.k) || (t.virtualOut || []).some(v => v.res === m.k);
      });
      const here = makers.filter(id => inside && inside[id]);
      const pick = here.length ? here : makers;
      if (pick.length === 1 || here.length) offer(pick[0], s);
    });
    return score >= (B.nameMatch || 0.75) ? best : null;
  };
  State.blueprintMain = function (bp) {
    const inside = {};
    bp.nodes.forEach(it => { inside[it.type] = (inside[it.type] || 0) + 1; });
    const named = State.blueprintNamed(bp.name, inside);
    if (named) return named;

    const depth = bp.nodes.map(() => 0);
    for (let pass = 0; pass < bp.nodes.length; pass++) {
      let moved = false;
      bp.links.forEach(function (l) {
        if (depth[l.b] < depth[l.a] + 1 && depth[l.a] + 1 <= bp.nodes.length) { depth[l.b] = depth[l.a] + 1; moved = true; }
      });
      if (!moved) break;
    }
    let pick = -1;
    bp.nodes.forEach(function (it, i) {
      if (!bpMakes(it.type) && bp.nodes.some(o => bpMakes(o.type))) return;
      if (pick < 0 || depth[i] > depth[pick] ||
          (depth[i] === depth[pick] && State.priceOf(it.type, 0) > State.priceOf(bp.nodes[pick].type, 0))) pick = i;
    });
    return pick >= 0 ? bp.nodes[pick].type : bp.nodes[0].type;
  };

  State.blueprintSize = function (bp) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    bp.nodes.forEach(function (it) {
      const s = State.sizeOf(it.type);
      x0 = Math.min(x0, it.dx - s.w / 2); x1 = Math.max(x1, it.dx + s.w / 2);
      y0 = Math.min(y0, it.dy - s.h / 2); y1 = Math.max(y1, it.dy + s.h / 2);
    });
    return { w: x1 - x0, h: y1 - y0 };
  };

  State.canPlaceBlueprint = function (bp, x, y) {
    const want = {};
    for (const it of bp.nodes) {
      if (!State.isUnlocked(it.type)) {
        return { ok: false, why: C.nodeTypes[it.type].name + ' is not unlocked' };
      }

      want[it.type] = (want[it.type] || 0) + 1;
      const room = Math.max(0, State.capRoom(it.type));
      if (want[it.type] > room) {
        return { ok: false, why: room === 0
          ? 'No more ' + C.nodeTypes[it.type].name + 's allowed'
          : 'Only ' + room + ' more ' + C.nodeTypes[it.type].name +
            (room === 1 ? '' : 's') + ' allowed' };
      }
    }
    for (const it of bp.nodes) {
      const nx = x + it.dx, ny = y + it.dy;
      if (State.siteAt(nx, ny)) return { ok: false, why: 'Overlaps a site' };
      const size = State.sizeOf(it.type);

      const clash = State.machinesHere().some(function (m) {
        const ms = State.sizeOf(m);
        return Math.abs(m.x - nx) < (ms.w + size.w) / 2 &&
               Math.abs(m.y - ny) < (ms.h + size.h) / 2;
      });
      if (clash) return { ok: false, why: 'Overlaps another machine' };
    }
    const bill = State.blueprintCost(bp);
    for (const cur in bill) {
      if (!GG.util.canAfford(State.bank(cur), bill[cur])) {
        return { ok: false, why: 'Not enough ' + C.currencies[cur].short };
      }
    }
    return { ok: true };
  };

  State.placeBlueprint = function (bp, x, y) {
    const chk = State.canPlaceBlueprint(bp, x, y);
    if (!chk.ok) return chk;
    const made = [], paid = [];
    let spent = 0, cur = null;
    bp.nodes.forEach(function (it) {
      const res = State.place(it.type, x + it.dx, y + it.dy);

      made.push(res.ok ? res.node : null);

      if (res.ok) paid.push({ id: res.node.id, price: res.price || 0, cur: res.currency });

      if (res.ok && it.set) {
        ((C.ui || {}).blueprintSettings || []).forEach(function (k) {
          if (Object.prototype.hasOwnProperty.call(it.set, k)) res.node[k] = it.set[k];
        });
      }
      if (res.ok && res.price > 0) { spent += res.price; cur = res.currency; }
    });
    bp.links.forEach(function (l) {
      const a = made[l.a], b = made[l.b];
      if (a && b) State.link(a.id, l.ap, b.id, l.bp, { ortho: l.sq, bends: l.bends });
    });

    if (made.filter(Boolean).length) State.g.bpPlaced = true;
    return { ok: true, nodes: made.filter(Boolean), price: spent, currency: cur, paid: paid };
  };

  State.capKey = function (typeId) {
    const t = C.nodeTypes[typeId];
    return (t && t.variantOf) || typeId;
  };
  State.uniNeutral = function (n) { return !!(n && C.nodeTypes[n.type] && C.nodeTypes[n.type].uni); };
  function uniKindOf(list) {
    if (!list.length) return null;
    if (list.indexOf('energy') >= 0) return 'energy';
    if (list.indexOf('wf') >= 0) return 'wf';
    const isFluid = r => (C.resources[r] || {}).flow === 'material' && ALL_FLUIDS().indexOf(r) >= 0;
    if (list.every(isFluid)) return 'fluid';
    return list.some(r => (C.resources[r] || {}).flow === 'material') ? 'material' : null;
  }
  function ALL_FLUIDS() {
    const f = C.nodeTypes.uniSplitter && C.nodeTypes[C.nodeTypes.uniSplitter.uni.fluid];
    return (f && f.ports.in[0].accepts) || [];
  }

  State.uniKind = function (a, fromPort, b, toPort) {
    if (State.uniNeutral(b)) {
      const op = State.portsOf(a, 'out').find(p => p.id === fromPort);
      if (!op) return null;
      return uniKindOf(State.outUndecided(a, fromPort) ? State.carriable(C.nodeTypes[a.type]) : [op.res]);
    }
    const ip = State.portsOf(b, 'in').find(p => p.id === toPort);
    if (!ip) return null;
    return uniKindOf(ip.accepts || [ip.res]);
  };
  State.uniAdopt = function (a, fromPort, b, toPort) {
    const n = State.uniNeutral(a) ? a : (State.uniNeutral(b) ? b : null);
    if (!n) return;
    const kind = State.uniKind(a, fromPort, b, toPort);
    const to = kind && C.nodeTypes[n.type].uni[kind];
    if (!to) return;
    n.type = to;
    if (C.nodeTypes[to].mergeLock) n.grade = null;
    if (GG.sim && GG.sim.invalidate) GG.sim.invalidate();
  };
  State.uniRelease = function (n) {
    const t = n && C.nodeTypes[n.type];
    if (!t || !t.variantOf || !C.nodeTypes[t.variantOf].uni) return;
    if (State.g.links.some(l => l.from === n.id || l.to === n.id)) return;
    const held = [n.buf, n.obuf].reduce((s, b) => s + Object.values(b || {}).reduce((a, v) => a + (v || 0), 0), 0);
    if (held > 1e-6) return;
    n.type = t.variantOf;
    delete n.grade;
    if (GG.sim && GG.sim.invalidate) GG.sim.invalidate();
  };

  State.canLink = function (fromId, fromPort, toId, toPort) {

    if (State.locked()) return { ok: false, why: 'Nothing can be wired in here' };
    if (fromId === toId) return { ok: false, why: 'Cannot wire a machine to itself' };
    const a = State.node(fromId), b = State.node(toId);
    if (!a || !b) return { ok: false, why: 'Missing machine' };
    if ((a.loc || C.locations[0].id) !== (b.loc || C.locations[0].id)) {
      return { ok: false, why: 'A wire cannot cross between two places' };
    }

    if (State.uniNeutral(a) || State.uniNeutral(b)) {
      if (State.uniNeutral(a) && State.uniNeutral(b)) return { ok: false, why: 'Wire one of them to something else first' };
      const n = State.uniNeutral(a) ? a : b;
      const kind = State.uniKind(a, fromPort, b, toPort);
      if (!kind) return { ok: false, why: 'A splitter cannot carry that' };
      const was = n.type;
      n.type = C.nodeTypes[was].uni[kind];
      try { return State.canLink(fromId, fromPort, toId, toPort); } finally { n.type = was; }
    }
    const op = State.portsOf(a, 'out').find(p => p.id === fromPort);
    const ip = State.portsOf(b, 'in').find(p => p.id === toPort);
    if (!op || !ip) return { ok: false, why: 'No such socket' };

    const openRouting = (C.ui || {}).openRouting !== false;
    const at = C.nodeTypes[a.type];
    if (!State.acceptsRes(ip, op.res)) {
      const undecided = openRouting && State.outUndecided(a, fromPort) &&
                        State.carriable(at).some(r => State.acceptsRes(ip, r));
      if (!undecided) {
        return { ok: false, why: ip.label + ' does not take ' + C.resources[op.res].name };
      }
    }

    if (openRouting) {
      const bt0 = C.nodeTypes[b.type];
      const bLane = bt0.lanes ? State.portLane(bt0, toPort, 'in') : null;
      const bOpen = bt0.lanes ? (!!bLane && !(b.lg && b.lg[bLane]))
                              : (bt0.mergeLock && !b.grade && State.portAdopts(bt0, ip));
      if (bOpen) {

        const srcOpen = State.outUndecided(a, fromPort);
        const srcRes = srcOpen ? State.carriable(at) : [op.res];
        const outId = bLane ? State.laneOutPort(bt0, bLane) : null;

        const block = State.routeBlock(toId, outId, srcRes);
        if (block) {
          return { ok: false, why: srcOpen
            ? 'Its output goes to ' + block.label + ', which takes nothing this can carry'
            : 'Its output goes to ' + block.label +
              ', which does not take ' + C.resources[op.res].name };
        }
      }
    }

    const bt = C.nodeTypes[b.type];
    if (bt.mergeLock && b.grade && b.grade !== op.res && State.portAdopts(bt, ip) &&
        !State.noOutlet(bt)) {
      return { ok: false, why: 'This machine is carrying ' + C.resources[b.grade].name };
    }

    if (bt.lanes) {
      const L = State.portLane(bt, toPort, 'in'), gr = L && b.lg && b.lg[L];
      if (gr && gr !== op.res && !State.outUndecided(a, fromPort)) {
        return { ok: false, why: 'This shelf is carrying ' + C.resources[gr].name };
      }
    }
    if (State.linkInto(toId, toPort)) return { ok: false, why: 'That input already has a wire' };
    return { ok: true };
  };

  State.link = function (fromId, fromPort, toId, toPort, opts) {
    const chk = State.canLink(fromId, fromPort, toId, toPort);
    if (!chk.ok) return chk;
    State.uniAdopt(State.node(fromId), fromPort, State.node(toId), toPort);
    const rec = {
      id: 'l' + (State.g.idSeed++),
      from: fromId, fromPort: fromPort, to: toId, toPort: toPort, flow: 0,
    };
    if (opts && opts.ortho) rec.ortho = true;

    if (opts && opts.bends && opts.bends.length) rec.bends = opts.bends.map(q => ({ dx: q.dx, dy: q.dy }));

    const dot = State.dotOf(State.node(fromId), fromPort);
    if (dot && !(rec.bends && State.atDot(rec.bends[0], dot))) rec.bends = [{ dx: dot.dx, dy: dot.dy }].concat(rec.bends || []);
    State.g.links.push(rec);
    const b = State.node(toId);
    const bip = State.portsOf(b, 'in').find(p => p.id === toPort);
    if (C.nodeTypes[b.type].mergeLock && bip && State.portAdopts(C.nodeTypes[b.type], bip) &&
        (!b.grade || State.noOutlet(C.nodeTypes[b.type]))) {
      const a = State.node(fromId);

      const undecided = State.outUndecided(a, fromPort) &&
                        (C.ui || {}).gradeFollowsCargo !== false;
      const op = State.portsOf(a, 'out').find(p => p.id === fromPort);
      if (op && !undecided) b.grade = op.res;
    }
    const btL = C.nodeTypes[b.type];
    if (btL.lanes) {
      const L = State.portLane(btL, toPort, 'in');
      const a2 = State.node(fromId);
      const op2 = State.portsOf(a2, 'out').find(p => p.id === fromPort);
      if (L && !b.lg[L] && op2 && !State.outUndecided(a2, fromPort)) b.lg[L] = op2.res;
    }
    return { ok: true };
  };

  State.dotOf = function (n, portId) {
    if (!n || !n.dots || !portId) return null;
    return n.dots[portId] || null;
  };
  State.atDot = function (q, d) { return !!(q && d && Math.abs(q.dx - d.dx) < 0.5 && Math.abs(q.dy - d.dy) < 0.5); };
  State.dotLinks = function (n, portId) {
    return State.g.links.filter(l => l.from === n.id && l.fromPort === portId);
  };
  State.setDot = function (n, portId, dx, dy) {
    if (!n || !portId) return;
    const old = State.dotOf(n, portId), now = { dx: dx, dy: dy };
    State.dotLinks(n, portId).forEach(function (l) {
      l.bends = l.bends || [];
      if (old && State.atDot(l.bends[0], old)) l.bends[0] = { dx: dx, dy: dy };
      else l.bends.unshift({ dx: dx, dy: dy });
    });
    n.dots = n.dots || {};
    n.dots[portId] = now;
  };
  State.removeDot = function (n, portId) {
    const d = State.dotOf(n, portId);
    if (!d) return;
    State.dotLinks(n, portId).forEach(function (l) {
      if (l.bends && State.atDot(l.bends[0], d)) l.bends.shift();
      if (l.bends && !l.bends.length) delete l.bends;
    });
    delete n.dots[portId];
    if (!Object.keys(n.dots).length) delete n.dots;
  };

  State.wireStyle = function (linkId, ortho) {
    const l = State.g.links.find(x => x.id === linkId);
    if (!l) return null;
    if (ortho) l.ortho = true; else delete l.ortho;
    return !!l.ortho;
  };

  State.noOutlet = function (t) {
    return !!(t && t.mergeLock) && !((t.ports && t.ports.out) || []).length;
  };
  State.portAdopts = function (t, p) {
    return !!(t && t.mergeLock && p) && (!p.accepts || p.accepts.length > 1);
  };

  State.fixedRes = function (t) {
    const ins = (t && t.ports && t.ports.in) || [];
    const open = ins.filter(p => State.portAdopts(t, p));
    const out = [];
    ins.forEach(function (p) {
      if (State.portAdopts(t, p)) return;
      (p.accepts || [p.res]).forEach(function (r) {
        if (!open.some(o => !o.accepts || o.accepts.indexOf(r) >= 0)) out.push(r);
      });
    });
    return out;
  };

  State.fixGrade = function (node) {
    const t = node && C.nodeTypes[node.type];
    if (!t || !t.mergeLock) return;
    const open = (t.ports.in || []).filter(p => State.portAdopts(t, p));
    if (node.grade && !open.some(p => !p.accepts || p.accepts.indexOf(node.grade) >= 0)) {
      node.grade = null;
    }

    if (node.grade && !State.noOutlet(t)) return;
    const l = State.linksInto(node.id).find(x => open.some(p => p.id === x.toPort));
    const a = l && State.node(l.from);
    if (!a || State.outUndecided(a, l.fromPort)) return;
    const op = State.portsOf(a, 'out').find(p => p.id === l.fromPort);
    if (op && open.some(p => State.acceptsRes(p, op.res))) node.grade = op.res;
  };

  State.releaseGrade = function (node) {
    if (node && C.nodeTypes[node.type].lanes) return State.releaseLanes(node);
    if (!node || !C.nodeTypes[node.type].mergeLock) return;
    const rt = C.nodeTypes[node.type];

    if (State.linksInto(node.id).some(l => {
      const p = (rt.ports.in || []).find(x => x.id === l.toPort);
      return !p || State.portAdopts(rt, p);
    })) return;

    if (State.noOutlet(rt)) return;
    if ((C.ui || {}).holdKeepsGrade !== false) {
      let held = 0;

      const fixedOnly = State.fixedRes(rt);
      for (const k in node.buf) if (fixedOnly.indexOf(k) < 0) held += node.buf[k] || 0;
      for (const k in node.obuf) held += node.obuf[k] || 0;
      if (held > 1e-9) return;
    }
    node.grade = null;
  };

  State.releaseLanes = function (node) {
    const t = C.nodeTypes[node.type];
    if (!node.lg) State.laneInit(node, t);
    t.lanes.forEach(function (L) {
      if (!node.lg[L]) return;
      const ins = State.laneInPorts(t, L);
      if (State.linksInto(node.id).some(l => ins.indexOf(l.toPort) >= 0)) return;
      let held = 0;
      const lb = node.lb[L] || {};
      for (const k in lb) held += lb[k] || 0;
      held += node.obuf[State.laneOutPort(t, L)] || 0;
      if (held > 1e-9) return;
      node.lg[L] = null;
    });
  };

  State.unlink = function (linkId, bySim) {

    if (State.locked() && !bySim) return;
    const l = State.g.links.find(x => x.id === linkId);
    const target = l ? State.node(l.to) : null;
    State.g.links = State.g.links.filter(l => l.id !== linkId);

    if (l) State.g.wiresCut = (State.g.wiresCut || 0) + 1;
    State.releaseGrade(target);
    if (l) { State.uniRelease(State.node(l.from)); State.uniRelease(State.node(l.to)); }
  };

  State.undoStack = [];
  function undoCfg() { return (C.ui && C.ui.undo) || {}; }
  State.undoPush = function (e) {
    if (!undoCfg().enabled || !e || !State.g) return;
    e.loc = State.g.loc;
    State.undoStack.push(e);
    const max = undoCfg().max || 20;
    while (State.undoStack.length > max) State.undoStack.shift();
  };
  State.undo = function () {

    if (State.locked()) return { ok: false, why: 'Nothing to undo' };
    if (!undoCfg().enabled) return { ok: false, why: 'Nothing to undo' };
    const e = State.undoStack.pop();
    if (!e) return { ok: false, why: 'Nothing to undo' };
    if ((e.loc || '') !== (State.g.loc || '')) {
      return { ok: false, why: 'That was done in another place' };
    }

    if (e.kind === 'bends') {
      const l = State.g.links.find(x => x.id === e.id);
      if (!l) return { ok: false, why: 'That wire is gone' };
      if (e.prev && e.prev.length) l.bends = e.prev.map(q => ({ dx: q.dx, dy: q.dy }));
      else delete l.bends;
      return { ok: true, kind: 'bends' };
    }
    if (e.kind === 'place') {

      const live = e.items.filter(it => State.node(it.id));
      if (!live.length) return { ok: false, why: 'That machine is gone' };
      live.forEach(function (it) {
        const n = State.node(it.id), dt = C.nodeTypes[n.type];
        const ck = State.capKey(n.type);
        State.g.builtCount[ck] = Math.max(0, (State.g.builtCount[ck] || 1) - 1);
        if (it.price > 0 && it.cur) State.earn(it.cur, it.price);
        if (n.till && dt.collect) State.earn(dt.collect.cur, n.till);
        if (n.tillB && dt.collectB) State.earn(dt.collectB.cur, n.tillB);
        State.givePrismsBack(n);
        State.g.links = State.g.links.filter(l => l.from !== n.id && l.to !== n.id);
        State.g.nodes = State.g.nodes.filter(x => x.id !== n.id);
      });
      State.g.nodes.forEach(State.releaseGrade);
      if (State.syncDocks) State.syncDocks();
      return { ok: true, kind: 'place' };
    }
    if (e.kind === 'move') {
      const items = e.items.filter(it => State.node(it.id));
      if (!items.length) return { ok: false, why: 'That machine is gone' };
      const ids = {};
      items.forEach(it => { ids[it.id] = 1; });
      const blocked = items.some(function (it) {
        const n = State.node(it.id), sz = State.sizeOf(n);
        return State.machinesHere().some(function (o) {
          if (ids[o.id]) return false;
          const os = State.sizeOf(o);
          return Math.abs(o.x - it.x) < (os.w + sz.w) / 2 && Math.abs(o.y - it.y) < (os.h + sz.h) / 2;
        });
      });
      if (blocked) return { ok: false, why: 'No room to put it back' };
      items.forEach(it => { const n = State.node(it.id); n.x = it.x; n.y = it.y; });
      if (State.syncDocks) State.syncDocks();
      return { ok: true, kind: 'move' };
    }

    if (e.kind === 'flip') {
      const items = e.items.filter(it => State.node(it.id));
      if (!items.length) return { ok: false, why: 'That machine is gone' };
      items.forEach(it => { const n = State.node(it.id); if (it.flip) n.flip = 1; else delete n.flip; });
      return { ok: true, kind: 'flip' };
    }
    if (e.kind === 'link') {
      const l = State.g.links.find(x => x.id === e.id);
      if (!l) return { ok: false, why: 'Nothing to undo' };

      State.g.links = State.g.links.filter(x => x.id !== e.id);
      State.releaseGrade(State.node(l.to));
      return { ok: true, kind: 'link' };
    }
    if (e.kind === 'cut') {
      const r = e.rec;
      const res = State.link(r.from, r.fromPort, r.to, r.toPort, { ortho: !!r.ortho, bends: r.bends });
      if (res.ok) res.kind = 'cut';
      return res;
    }
    return { ok: false, why: 'Nothing to undo' };
  };

  function migrateSites(g) {
    C.locations.forEach(function (L) {
      const seen = {};
      L.sites.forEach(function (cfg) {
        const i = (seen[cfg.type] = (seen[cfg.type] === undefined ? 0 : seen[cfg.type] + 1));
        const n = State.sitesIn(L.id).filter(x => x.type === cfg.type)[i];
        if (!n) return;
        const dx = cfg.x - n.x, dy = cfg.y - n.y;

        if ((dx || dy) && !n.moved) {

          State.onSiteMachines(n).forEach(m => { m.x += dx; m.y += dy; });
          n.x = cfg.x; n.y = cfg.y;
        }
        if (n.w) return;
        if (cfg.w) n.w = cfg.w;
        if (cfg.slots) n.slots = cfg.slots;

        const cfgCap = C.siteCapacity(cfg, g);
        const tt0 = C.nodeTypes[n.type] || {};
        if (cfgCap !== undefined && cfg.raisedFrom && tt0.volume &&
            (C.ui || {}).raiseAddsDirt !== false && !n.capRaised) {
          const vol = tt0.volume;
          const was0 = n.capacity !== undefined ? n.capacity : tt0.capacity;
          let from = was0, grown = n.grown || 0;
          if (was0 === cfgCap) { from = cfg.raisedFrom; grown *= from / cfgCap; }
          if (from > 0 && from !== cfgCap) {
            const cleanWas = grown / (from / vol), cleanNow = grown / (cfgCap / vol);
            const base = n.dirty !== undefined ? n.dirty : vol - cleanWas;
            n.dirty = Math.max(0, Math.min(vol - cleanNow, base + cleanWas - cleanNow));
            n.grown = grown;
            if (n.shown !== undefined) n.shown = grown;
          }
          n.capacity = cfgCap;
          n.capRaised = true;
        } else if (cfgCap !== undefined) {

          const tt = C.nodeTypes[n.type] || {};
          const old = n.capacity !== undefined ? n.capacity : tt.capacity;
          if (tt.volume && old > 0 && old !== cfgCap && n.grown > 0) {
            const k = cfgCap / old;
            n.grown *= k;
            if (n.shown !== undefined) n.shown *= k;
          }
          n.capacity = cfgCap;
        }
      });
    });
    raiseGround(g);
  }

  function raiseGround(g) {
    const M = C.groundRaise || {};
    if (!M.enabled) return;
    g.groundRaised = g.groundRaised || {};
    (M.places || []).forEach(function (P) {
      const L = C.locations.find(l => l.id === P.id);
      if (!L) return;

      const key = (P.key || P.id) + (C.demoSized(L, g) ? ':demo' : '');

      if (g.groundRaised[key]) return;
      g.groundRaised[key] = true;
      if (!(g.locSpawned && g.locSpawned[P.id])) return;

      if (P.removeExtra) {
        P.removeExtra.forEach(function (type) {
          const want = L.sites.filter(cfg => cfg.type === type).length;
          const live = State.sitesIn(L.id).filter(x => x.type === type);
          const keep = live.slice(0, want);
          live.slice(want).forEach(function (site) {
            const lost = [];
            State.onSiteMachines(site).forEach(function (m) {
              let slot = null, dest = null;
              for (const k of keep) { slot = State.freeSlot(k, m.x, m.y); if (slot) { dest = k; break; } }
              if (dest) { m.x = slot.x; m.y = slot.y; }
              else lost.push(m);
            });
            lost.forEach(function (m) {
              const ck = State.capKey(m.type);
              State.g.builtCount[ck] = Math.max(0, (State.g.builtCount[ck] || 1) - 1);
              State.g.links = State.g.links.filter(l => l.from !== m.id && l.to !== m.id);
              State.givePrismsBack(m);
            });
            const ids = new Set(lost.map(m => m.id).concat([site.id]));
            State.g.nodes = State.g.nodes.filter(n => !ids.has(n.id));
          });
        });
        State.g.nodes.forEach(State.releaseGrade);
        return;
      }

      if (P.addSites) {
        const have = {};
        L.sites.forEach(function (cfg) {
          if (P.addSites.indexOf(cfg.type) < 0) return;
          const i = (have[cfg.type] = (have[cfg.type] === undefined ? 0 : have[cfg.type] + 1));
          if (!State.sitesIn(L.id).filter(x => x.type === cfg.type)[i]) spawnSite(cfg, L, g);
        });
        return;
      }
      const seen = {};
      L.sites.forEach(function (cfg) {
        const i = (seen[cfg.type] = (seen[cfg.type] === undefined ? 0 : seen[cfg.type] + 1));
        const n = State.sitesIn(L.id).filter(x => x.type === cfg.type)[i];

        if (!n) return;

        const cfgCap = C.siteCapacity(cfg, g), cfgKg = C.siteReserve(cfg, g);
        if (cfgCap !== undefined && n.capacity !== undefined && n.capacity < cfgCap) {
          n.capacity = cfgCap;
        }

        if (P.groveOnly) return;
        const tt = C.nodeTypes[cfg.type] || {};
        const want = cfgKg !== undefined ? cfgKg : tt.reserve;
        if (!n || want === undefined || n.full === undefined) return;
        if (n.full < want) {
          const d = want - n.full;
          n.full += d; n.reserve = (n.reserve || 0) + d; n.shown = (n.shown || 0) + d;
        } else if (P.lower && n.full > want) {
          const dug = Math.max(0, n.full - (n.reserve || 0));
          n.full = want;
          n.reserve = Math.max(0, want - dug);
          n.shown = Math.min(n.shown === undefined ? n.reserve : n.shown, n.reserve);
        }
      });
      if (P.spillAddKg && !P.groveOnly) State.sitesIn(L.id).forEach(function (n) {
        if (n.type === 'oilSite' && n.dirty !== undefined) n.dirty += P.spillAddKg;
      });
    });
  }

  State.resnapOnSite = function () {
    State.sites().forEach(function (s) {
      const slots = State.slotsOf(s);
      const taken = new Set();
      State.onSiteMachines(s).sort((a, b) => a.y - b.y).forEach(function (m) {
        let best = -1, bestD = Infinity;
        slots.forEach(function (sl, i) {
          if (taken.has(i)) return;
          const d = Math.abs(m.y - sl.y);
          if (d < bestD) { bestD = d; best = i; }
        });
        if (best < 0) return;
        taken.add(best);
        m.x = slots[best].x; m.y = slots[best].y;
      });
    });
  };

  State.SLOTS = 3;
  State.slotKey = function (i) { return i <= 1 ? C.saveKey : C.saveKey + '.s' + i; };

  State.sget = function (k) { return GG.store ? GG.store.get(k) : localStorage.getItem(k); };
  State.sset = function (k, v) { if (GG.store) GG.store.set(k, v); else localStorage.setItem(k, v); };
  State.sdel = function (k) { if (GG.store) GG.store.remove(k); else localStorage.removeItem(k); };
  State.slot = 1;

  State.practice = false;

  State.practiceLocked = false;

  State.locked = function () { return !!State.practiceLocked; };

  State.progress = function (g) {
    g = g || State.g;

    const st = C.story;
    if (C.demo && C.demo.enabled && st && st.enabled) {
      let steps = 0;
      (st.acts || []).forEach(function (a) { steps += (a.steps || []).length; });
      if (steps > 0) {
        return Math.max(0, Math.min(1, (g.storyAt || 0) / steps));
      }
    }
    let have = 0, all = 0;
    for (const sk of C.skills) {
      const max = sk.maxLevel || 1;
      all += max;
      const lv = (g.skills && g.skills[sk.id]) || 0;
      have += Math.min(max, lv === true ? 1 : lv);
    }
    return all > 0 ? have / all : 0;
  };

  State.slotMeta = function (i) {
    try {
      const raw = State.sget(State.slotKey(i));
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d || d.v !== C.saveVersion || !d.g) return null;
      return {
        slot: i,

        name: typeof d.g.name === 'string' ? d.g.name : '',
        savedAt: d.t || 0,

        playedSec: d.g.playtime || 0,
        pct: d.m && d.m.pct !== undefined ? d.m.pct : State.progress(d.g),
        shot: (d.m && d.m.shot) || null,
        ci: d.g.totalCI || d.g.ci || 0,
        loc: d.g.loc || C.locations[0].id,
        cycle: d.g.cycle || 0,
      };
    } catch (e) { return null; }
  };

  State.slotSkills = function (i) {
    try {
      const raw = State.sget(State.slotKey(i));
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d || d.v !== C.saveVersion || !d.g) return null;
      return d.g.skills || {};
    } catch (e) { return null; }
  };

  State.deleteSlot = function (i) {
    try { State.sdel(State.slotKey(i)); State.mirror(State.slotKey(i)); return true; }
    catch (e) { return false; }
  };

  State.mirror = function (key, text) {
    const D = window.desktop, G = C.saveGuard || {};
    if (!D || !D.saveWrite || G.fileMirror === false) return;
    try {
      if (text === undefined) text = State.sget(key);
      if (text == null) D.saveRemove(key); else D.saveWrite(key, text);
    } catch (e) {}
  };

  State.snapshot = function () {
    try {
      const src = document.getElementById('board');
      if (!src || !src.width) return null;
      const w = C.ui.shotWidth, h = Math.round(w * src.height / src.width);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(src, 0, 0, w, h);
      return c.toDataURL('image/jpeg', C.ui.shotQuality);
    } catch (e) { return null; }
  };

  State.saveFailed = false;
  State.bakAt = {};
  State.blockedSlot = null;

  State.save = function (withShot) {

    if (State.practice) return false;
    const G = C.saveGuard || {};
    const on = G.enabled !== false;
    const key = State.slotKey(State.slot);
    const put = function (shot) {
      const m = { pct: State.progress(), shot: shot };
      const text = JSON.stringify({ v: C.saveVersion, t: Date.now(), m: m, g: State.g });
      State.sset(key, text);
      State.mirror(key, text);
    };

    if (on && State.g) {
      if (State.blockedSlot === State.slot && G.refuseBroken !== false) return false;
      try {
        const old = State.sget(key);
        if (old) {
          const od = JSON.parse(old);
          const op = (od && od.g && od.g.playtime) || 0;
          const slack = G.olderSlackSec === undefined ? 120 : G.olderSlackSec;
          if (G.refuseOlder !== false && op > (State.g.playtime || 0) + slack) {
            console.warn('[ReGen] save refused: slot ' + State.slot + ' holds a longer run (' +
                         Math.round(op) + ' s against ' + Math.round(State.g.playtime || 0) + ' s)');
            State.saveFailed = true;
            if (G.notice !== false && GG.ui && GG.ui.saveWarn) { try { GG.ui.saveWarn(); } catch (e3) {} }
            return false;
          }
          const every = (G.backupSec === undefined ? 600 : G.backupSec) * 1000;
          if (every > 0 && Date.now() - (State.bakAt[key] || 0) >= every) {
            State.bakAt[key] = Date.now();
            try { State.sset(key + '.bak', old); } catch (e4) {}
          }
        }
      } catch (e5) {}
    }
    const prev = withShot ? null : State.slotMeta(State.slot);
    const shot = withShot ? State.snapshot() : (prev && prev.shot) || null;

    try {
      put(shot);
      State.saveFailed = false;
      return true;
    } catch (e) {

      if (on && G.retryBare !== false && shot) {
        try {
          put(null);
          console.warn('[ReGen] save: quota tight, wrote without the thumbnail', e);
          State.saveFailed = false;
          return true;
        } catch (e2) { e = e2; }
      }
      console.warn('[ReGen] save failed', e);
      State.saveFailed = true;

      if (on && G.notice !== false && GG.ui && GG.ui.saveWarn) {
        try { GG.ui.saveWarn(); } catch (e3) {}
      }
      return false;
    }
  };

  State.load = function () {

    State.loadError = null;
    const prevG = State.g;
    try {
      const raw = State.sget(State.slotKey(State.slot));
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.v !== C.saveVersion || !data.g) {
        State.loadError = { slot: State.slot, message: 'save version ' + (data && data.v) };
        return false;
      }

      State.savedAt = data.t || Date.now();
      State.g = data.g;
      const g = State.g;

      if (C.pacing && !C.pacing.enabled && C.pacing.dropWhenOff !== false) delete g.paceLog;
      g.builtCount = g.builtCount || {};

      if (!g.peakBuilt) { g.peakBuilt = {}; Object.keys(g.builtCount)
        .forEach(k => { g.peakBuilt[k] = g.builtCount[k]; }); }

      if (C.tutorial && C.tutorial.hintReplay !== false && !g.hintReplay96) {
        g.hintReplay96 = 1;
        const seen = g.hintsSeen || {};
        (C.tutorial.hintList || []).forEach(h => { if (h.when) delete seen[h.node || h.id]; });
      }

      const lateAt = C.tutorial && C.tutorial.hintLateAt;
      if (typeof lateAt === 'number' && C.story && C.story.enabled) {
        let planLen = 0;
        (C.story.acts || []).forEach(a => { planLen += (a.steps || []).length; });
        if ((g.storyAt || 0) >= Math.min(lateAt, planLen)) {
          const seen = g.hintsSeen = g.hintsSeen || {};
          (C.tutorial.hintList || []).forEach(h => {
            const id = h.node || h.id;
            if (seen[id]) return;
            let on = false;

            try {

              const mn = C.tutorial.machineNotes;
              on = h.node ? ((mn && mn.onBuild && C.tutorial.lateOnBuild !== false)
                               ? State.peakBuiltOf(h.node) > 0 : State.isUnlocked(h.node))
                 : h.loc  ? g.loc === h.loc
                 : h.when ? !!h.when(g, GG.sim, State) : false;
            } catch (e) { on = false; }
            if (on) seen[id] = 1;
          });
        }
      }
      g.name = typeof g.name === 'string' ? g.name : '';
      g.caps = g.caps || {};
      g.skills = g.skills || {};
      g.camera = g.camera || { x: 0, y: 0, scale: C.world.startZoom };
      g.money = g.money || 0; g.totalMoney = g.totalMoney || 0;
      g.gameHours = g.gameHours || 0; g.totalCleaned = g.totalCleaned || 0;

      g.diamond = g.diamond || 0; g.totalDiamonds = g.totalDiamonds || 0;
      g.totalBurns = g.totalBurns || 0; g.sorterPerfect = !!g.sorterPerfect;
      g.gemsTaken = g.gemsTaken || 0; g.splitEven = !!g.splitEven;
      g.boosts = g.boosts || {}; g.objectives = g.objectives || {};
      g.goalsHit = g.goalsHit || {}; g.handKg = g.handKg || 0;
      g.powerKg = g.powerKg || 0; g.boostUses = g.boostUses || {};
      g.solarShift = g.solarShift || 0;

      if (g.sunAt === undefined) {
        const panels = (g.nodes || []).filter(n => {
          const t = C.nodeTypes[n.type]; return t && t.duty;
        });
        if (panels.length) {
          const stamps = panels.map(n => n.sunAt).filter(v => typeof v === 'number');
          g.sunAt = stamps.length ? Math.min.apply(null, stamps) : -g.solarShift;
        }
      }

      g.metalSold = g.metalSold || 0; g.diamondSpent = g.diamondSpent || 0;

      g.cellsMade = g.cellsMade || 0;

      g.printed = g.printed || {};

      g.licenceCI = g.licenceCI || 0;
      g.ciLowSec = g.ciLowSec || 0;
      g.hintSnooze = g.hintSnooze || {};
      g.digBy = g.digBy || {};
      g.pureGlass = !!g.pureGlass; g.bpPlaced = !!g.bpPlaced;
      g.forgeCycle = !!g.forgeCycle; g.soldPair = !!g.soldPair;
      g.bigHire = !!g.bigHire; g.boltBlocked = !!g.boltBlocked;
      g.wxBlocked = false;

      g.loc = g.loc || C.locations[0].id;
      g.cameras = g.cameras || {};
      g.sitesDrained = g.sitesDrained || 0;
      g.locSpawned = g.locSpawned || {};

      g.wxPredicted = g.wxPredicted || {};
      g.wxSeen = g.wxSeen || {};

      g.wxWatched = g.wxWatched || {};
      g.rockIntro = g.rockIntro || {};

      if (!g.rockIntroDone) {
        g.rockIntroDone = {};
        const had = (g.rocksSeen || 0) > 0;
        Object.keys(((C.asteroid || {}).intro || {}).locs || {}).forEach(function (l) {
          const rocksHere = (g.nodes || []).some(n => n.type === 'meteorite' && n.loc === l);
          if (rocksHere || (had && (!g.seenPlaces || g.seenPlaces[l]))) g.rockIntroDone[l] = true;
        });
      }
      State.seedWeather(g);

      g.blueprints = Array.isArray(g.blueprints) ? g.blueprints : [];
      g.tutorStep = g.tutorStep || 0;
      g.hintsSeen = g.hintsSeen || {};
      g.tutorChoice = g.tutorChoice || null;

      const hadSeen = !!g.seenNodes;
      g.seenNodes = g.seenNodes || {};

      const hadPlaces = !!g.seenPlaces;
      g.seenPlaces = g.seenPlaces || {};

      const hadRevive = !!g.reviveSeen;
      g.reviveSeen = g.reviveSeen || {};

      const hadTold = !!g.skillTold;
      g.skillTold = g.skillTold || {};

      g.tutorDone = g.tutorDone === undefined ? true : g.tutorDone;

      if (!Object.keys(g.locSpawned).length) g.locSpawned[C.locations[0].id] = true;

      Object.keys(g.objectives).forEach(k => { g.goalsHit[k] = true; });
      g.gem = g.gem || null; g.gemTimer = g.gemTimer || 0;
      g.nodes.forEach(n => {
        n.buf = n.buf || {}; n.obuf = n.obuf || {}; n.rates = {}; n.pulse = 0;
        n.rateIn = {}; n.raw = {};
        n.loc = n.loc || C.locations[0].id;
        const t = C.nodeTypes[n.type];
        if (t && t.collect) n.till = n.till || 0;
        if (t && t.collectB) { n.tillB = n.tillB || 0; n.bufB = n.bufB || {}; }

        if (t && t.store) { n.store = n.store || 0; n.demand = 0; n.outRate = 0; }
        if (t && t.mergeLock) n.grade = n.grade || null;
        if (t && t.lanes) State.laneInit(n, t);
        if (t && t.splitter) {

          if (typeof n.wa !== 'number') {
            n.wa = typeof n.split === 'number' ? n.split : t.defaultWeights.a;
            n.wb = typeof n.split === 'number' ? 1 - n.split : t.defaultWeights.b;
          }
          delete n.split;
        }

        if (t && t.hire) n.crew = Array.isArray(n.crew) ? n.crew : [];
        if (t && (t.licence || t.fission)) n.runUntil = n.runUntil || 0;
        if (t && t.rocket) { n.built = !!n.built; n.wfPool = n.wfPool || 0; n.flightUntil = n.flightUntil || 0; }
        if (t && t.predict) { n.bank = n.bank || 0; n.sawSeq = n.sawSeq || 0; }
        if (t && t.recruit) {
          n.wfPool = n.wfPool || 0; n.kwPool = n.kwPool || 0; n.recruits = n.recruits || 0;
        }
        if (t && t.recipe) {
          n.made = n.made || 0; n.wfPool = n.wfPool || 0; n.kwPool = n.kwPool || 0;
        }
        if (t && t.grow) { n.grown = n.grown || 0; n.shown = n.grown; }
        else if (t && t.kind === 'site') {
          if (n.reserve === null || n.reserve === undefined) n.reserve = t.reserve;
          n.full = n.full || t.reserve;
          n.shown = n.reserve; n.fade = 0;
        }
      });

      State.ensureLocations();
      migrateSites(g);

      g.links = g.links.filter(function (l) {
        const b = g.nodes.find(x => x.id === l.to), t = b && C.nodeTypes[b.type];
        return !t || !t.ports || ((t.ports.in || []).some(p => p.id === l.toPort));
      });

      State.resnapOnSite();
      if (!hadSeen) State.seedSeenNodes();
      if (!hadPlaces) State.seedSeenPlaces();

      if (!hadRevive) State.seedReviveSeen();
      if (!hadTold) State.seedSkillTold();

      State.revealCheck();
      return true;
    } catch (e) {
      console.warn('[ReGen] load failed', e);
      State.g = prevG;
      State.loadError = { slot: State.slot, message: (e && e.message) || String(e) };

      try {
        const r = State.sget(State.slotKey(State.slot));
        if (r) State.sset(State.slotKey(State.slot) + '.broken', r);
      } catch (e2) {}
      return false;
    }
  };

  State.revealCheck = function () {
    const g = State.g, R = C.reveal;
    if (!g || !R || R.enabled === false || !R.items) return;
    g.seenUi = g.seenUi || {};
    for (const k in R.items) {
      if (g.seenUi[k]) continue;
      try { if (R.items[k](g)) g.seenUi[k] = true; } catch (e) {}
    }
  };

  State.reset = function () {
    State.sdel(State.slotKey(State.slot));
    State.mirror(State.slotKey(State.slot));
    State.g = freshGame();
    State.ensureLocations();
  };

  State.init = function () {
    if (!State.load()) { State.g = freshGame(); State.ensureLocations(); }
  };

  const CIRCLE_RESET = [
    'ci', 'money', 'skills', 'nodes', 'links',
    'loc', 'locSpawned', 'cameras', 'camera', 'seenPlaces', 'seenNodes', 'skillTold',
    'sitesDrained', 'reviveSeen', 'digBy', 'relocHeld',
    'builtCount', 'peakBuilt', 'printed',
    'gem', 'wxAt', 'wx', 'wxLeft', 'wxRoll', 'wxEvt', 'wxNext', 'wxNextLeft', 'wxNextSeq',
    'wxBlocked', 'gridDown', 'sunAt', 'solarShift',
    'rockIntro', 'rockIntroDone', 'rockAt', 'rockPull', 'rockPullLoc', 'rockPullWithin',
    'rockPullCost', 'rockPullBy', 'rockPullAt',
    'ciLowSec', 'paceLog',
  ];
  State.circleReset = CIRCLE_RESET;
  State.fullCircle = function () {
    const old = State.g, fresh = freshGame();
    const g = Object.assign({}, old);

    const carry = Object.assign({}, old.circleCarry || {});

    const CF = ((C.fullCircle || {}).carryOn && (C.fullCircle || {}).carry) || {};
    Object.keys(CF).forEach(function (type) {
      const best = (old.nodes || []).filter(n => n.type === type)
        .reduce((a, n) => Math.max(a, n[CF[type]] || 0), 0);
      if (best > (carry[type] || 0)) carry[type] = best;
    });
    g.circleCarry = carry;

    (old.nodes || []).forEach(function (n) {
      if (n.prisms) g.prism = (g.prism || 0) + n.prisms;
      const t = C.nodeTypes[n.type];
      if (t && t.collect && t.collect.cur === 'prism' && n.till) g.prism = (g.prism || 0) + n.till;
      if (n.gemsIn) g.diamond = (g.diamond || 0) + n.gemsIn;
    });
    CIRCLE_RESET.forEach(function (k) {
      if (k in fresh) g[k] = fresh[k]; else delete g[k];
    });
    g.cycle = (old.cycle || 0) + 1;
    g.cycleAt = old.playtime || 0;
    g.tutorDone = true;
    g.idSeed = Math.max(old.idSeed || 1, fresh.idSeed);
    State.g = g;
    State.undoStack = [];
    State.ensureLocations();
    return g;
  };

  State.openSlot = function (i, fresh, name, opts) {

    if (GG.practice && GG.practice.active) GG.practice.exit();
    const prevSlot = State.slot;
    State.slot = i;
    if (fresh) State.deleteSlot(i);
    State.savedAt = 0;
    const loaded = State.load();

    const SG = C.saveGuard || {};
    if (!loaded && !fresh && State.loadError && SG.enabled !== false && SG.refuseBroken !== false) {
      State.slot = prevSlot;
      State.blockedSlot = i;
      return null;
    }
    if (!loaded) { State.g = freshGame(); State.ensureLocations(); }

    if (!loaded && name) State.g.name = String(name).trim().slice(0, C.menu.nameMax);

    GG.sim.demoReset();
    GG.sim.invalidate();

    GG.sim.ciPerHour = 0; GG.sim.moneyPerHour = 0;

    State.offlineJob = null;
    State.offlineReport = null;
    State.undoStack = [];
    const awaySec = loaded && State.savedAt ? (Date.now() - State.savedAt) / 1000 : 0;
    if (!awaySec) return State.g;
    if (opts && opts.defer) State.offlineJob = GG.sim.offlineBegin(awaySec);
    else State.offlineReport = GG.sim.offline(awaySec);
    return State.g;
  };

  State.finishOffline = function () {
    if (!State.offlineJob) return null;
    GG.sim.offlineStep(State.offlineJob);
    State.offlineReport = GG.sim.offlineEnd(State.offlineJob);
    State.offlineJob = null;
    return State.offlineReport;
  };

  State.makeNode = makeNode;
  State.freshGame = freshGame;
})(window.GG);
