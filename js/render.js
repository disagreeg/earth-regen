







(function (GG) {
  'use strict';
  const C = GG.config, S = GG.state, IC = GG.icons;

  
  const FONT_UI = "'Inter', ui-sans-serif, system-ui, sans-serif";
  const FONT_DISPLAY = "'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif";
  const FONT_MONO = "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace";

  const R = {};
  GG.render = R;

  let cv, ctx, dpr = 1, W = 0, H = 0;

  


  let boostMarks = {};

  




  function collar(kind, typeId, x, y, w, h, r, time) {
    const F = C.boostFx;
    if (!F || !F.enabled || !F[kind]) return;
    const list = boostMarks[typeId];
    if (!list || !list.length) return;
    
    const k = 0.5 + 0.5 * Math.sin(time * (Math.PI * 2) / F.pulseSec);
    const a = F.alphaLow + (F.alpha - F.alphaLow) * k;
    ctx.save();
    list.slice(0, F.maxStack).forEach(function (b, i) {
      const p = F.pad * (i + 1);
      ctx.strokeStyle = rgba(b.color, a);
      ctx.lineWidth = F.width;
      ctx.shadowColor = rgba(b.color, a * 0.8);
      ctx.shadowBlur = F.glow;
      roundRect(x - p, y - p, w + p * 2, h + p * 2, r + p); ctx.stroke();
    });
    ctx.restore();
  }

  R.init = function (canvas) {
    cv = canvas;
    ctx = cv.getContext('2d');
    R.canvas = cv;
    window.addEventListener('resize', R.resize);
    R.resize();
  };

  


  R.uiZoom = function () {
    const z = document.body && document.body.currentCSSZoom;
    if (typeof z === 'number' && z > 0) return z;
    





    if (cv && cv.clientWidth) {
      const r = cv.getBoundingClientRect();
      if (r.width > 0) return r.width / cv.clientWidth;
    }
    return 1;
  };

  R.resize = function () {
    dpr = window.devicePixelRatio || 1;
    const z = R.uiZoom();
    








    W = cv.clientWidth; H = cv.clientHeight;
    if (!W || !H) { const r = cv.getBoundingClientRect(); W = r.width / z; H = r.height / z; }
    cv.width = Math.round(W * z * dpr);
    cv.height = Math.round(H * z * dpr);
    ctx.setTransform(z * dpr, 0, 0, z * dpr, 0, 0);
    




    if (GG.ui && GG.ui.applyLayout) GG.ui.applyLayout();
  };

  


  R.particles = [];
  R.burst = function (wx, wy, opts) {
    opts = opts || {};
    const n = opts.count || 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (opts.speed || 60) * (0.35 + Math.random() * 0.9);
      R.particles.push({
        x: wx + (Math.random() - 0.5) * (opts.spread || 10),
        y: wy + (Math.random() - 0.5) * (opts.spread || 10),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.lift || 40),
        life: 0, max: (opts.life || 0.75) * (0.6 + Math.random() * 0.7),
        size: (opts.size || 3) * (0.5 + Math.random()),
        color: opts.color || '#8de3b4',
      });
    }
    if (R.particles.length > 400) R.particles.splice(0, R.particles.length - 400);
  };

  



  R.siteBurst = function (site, wx, wy, planting) {
    
    
    
    const box = S.siteBox(site), cfg = C.swipe;
    const main = planting ? '#7ff0b0' : '#8de3b4';
    R.burst(wx, wy, { color: main, count: 6, speed: 70, lift: 45, spread: 16 });
    for (let i = 0; i < (cfg.puffs || 0); i++) {
      R.burst(site.x + (Math.random() - 0.5) * box.w * cfg.puffSpread,
              site.y + (Math.random() - 0.5) * box.h * cfg.puffSpread,
              { color: main, count: 4, speed: 55, lift: 38, spread: 24, size: 2.6 });
    }
    R.burst(wx, wy, { color: '#62d4e3', count: 4, speed: 45, lift: 60, size: 2 });
  };

  



  R.waves = [];
  R.ringSec = function () { return C.siteFx.ring.on ? C.siteFx.ring.sec : 0; };
  R.wave = function (site, wx, wy) {
    const F = C.siteFx;
    R.waves.push({ site: site, x: wx, y: wy, t: 0,
                   max: Math.max(R.ringSec(), F.dent.sec, F.flow.sec) });
    if (R.waves.length > 8) R.waves.shift();
  };
  function wavesOn(site) {
    const out = [];
    for (const w of R.waves) if (w.site === site) out.push(w);
    return out;
  }

  


  function dentAmp(w) {
    const D = C.siteFx.dent;
    const k = w.t / D.sec;
    if (k >= 1 || D.depth <= 0) return 0;
    return D.depth * Math.exp(-D.decay * k) * Math.cos(k * D.wobble);
  }

  

  function outlinePoints(x, y, w, h, r, step) {
    const pts = [], x2 = x + w, y2 = y + h;
    function edge(ax, ay, bx, by, nx, ny) {
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
      for (let i = 0; i < n; i++) {
        const k = i / n;
        pts.push({ x: ax + (bx - ax) * k, y: ay + (by - ay) * k, nx: nx, ny: ny });
      }
    }
    function corner(cx, cy, a0, a1) {
      const n = Math.max(2, Math.round(Math.abs(a1 - a0) * r / step));
      for (let i = 0; i < n; i++) {
        const a = a0 + (a1 - a0) * (i / n);
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r,
                   nx: -Math.cos(a), ny: -Math.sin(a) });
      }
    }
    edge(x + r, y, x2 - r, y, 0, 1);                        
    corner(x2 - r, y + r, -Math.PI / 2, 0);
    edge(x2, y + r, x2, y2 - r, -1, 0);                     
    corner(x2 - r, y2 - r, 0, Math.PI / 2);
    edge(x2 - r, y2, x + r, y2, 0, -1);                     
    corner(x + r, y2 - r, Math.PI / 2, Math.PI);
    edge(x, y2 - r, x, y + r, 1, 0);                        
    corner(x + r, y + r, Math.PI, Math.PI * 1.5);
    return pts;
  }

  



  function sitePath(s, box, ws) {
    const x = s.x - box.w / 2, y = s.y - box.h / 2;
    let live = null;
    for (const w of ws) {
      const a = dentAmp(w);
      if (Math.abs(a) < 0.05) continue;
      (live || (live = [])).push({ x: w.x, y: w.y, a: a });
    }
    if (!live) { roundRect(x, y, box.w, box.h, 18); return; }

    const reach = C.siteFx.dent.reach, two = 2 * reach * reach;
    const pts = outlinePoints(x, y, box.w, box.h, 18, 6);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      let push = 0;
      for (const d of live) {
        const dx = p.x - d.x, dy = p.y - d.y;
        push += d.a * Math.exp(-(dx * dx + dy * dy) / two);
      }
      const px = p.x + p.nx * push, py = p.y + p.ny * push;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  


  function flowSurf(ws, px) {
    const F = C.siteFx.flow;
    let d = 0;
    for (const w of ws) {
      const k = w.t / F.sec;
      if (k >= 1) continue;
      const dist = Math.abs(px - w.x);
      d += F.surfAmp * (1 - k) * Math.exp(-dist / F.surfLen) *
           Math.sin(dist / F.surfWave - w.t * F.speed * Math.PI);
    }
    return d;
  }

  











  R.falls = [];
  R.rockFall = function (site) {
    const A = C.asteroid || {}, F = A.fall || {};
    if (!F.enabled || !site) return;
    const dur = (typeof F.sec === 'number' ? F.sec : A.hitDelaySec) || 1.4;
    R.falls.push({ site: site, x: site.x, y: site.y, loc: site.loc,
                   t: 0, hit: dur, max: dur + (F.flash ? F.flash.sec : 0.5) });
    if (R.falls.length > 6) R.falls.shift();
  };
  


  function fallOf(site) {
    for (const f of R.falls) if (f.site === site) return f;
    return null;
  }

  function stepFalls(dt) {
    const F = (C.asteroid || {}).fall || {};
    for (let i = R.falls.length - 1; i >= 0; i--) {
      const f = R.falls[i], was = f.t;
      f.t += dt;
      
      if (was < f.hit && f.t >= f.hit) {
        const d = F.dust || {};
        R.burst(f.x, f.y, { color: d.color || '#cbbb96', count: d.count || 30,
                            speed: d.speed || 165, lift: d.lift || 55,
                            life: d.life || 1.15, size: d.size || 3.4, spread: 26 });
      }
      if (f.t >= f.max) R.falls.splice(i, 1);
    }
  }

  


  function drawFalls() {
    const A = C.asteroid || {}, F = A.fall || {};
    if (!F.enabled || !R.falls.length) return;
    const st = F.streak || {}, fl = F.flash || {};
    for (const f of R.falls) {
      if (f.loc && f.loc !== S.g.loc) continue;
      if (f.t < f.hit) {
        

        const k = f.t / f.hit, e = k * k;
        const from = F.from || 1000, tilt = (F.tilt || 0) * from;
        const hx = f.x - tilt * (1 - e), hy = f.y - from * (1 - e);
        const len = st.len || 120;
        
        const dx = tilt, dy = from, m = Math.hypot(dx, dy) || 1;
        const tx = hx - (dx / m) * len, ty = hy - (dy / m) * len;
        ctx.save();
        ctx.lineCap = 'round';
        const g = ctx.createLinearGradient(tx, ty, hx, hy);
        g.addColorStop(0, 'rgba(255,138,61,0)');
        g.addColorStop(1, st.color || '#ffe6b8');
        ctx.strokeStyle = g;
        ctx.lineWidth = st.w || 6;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.fillStyle = st.color || '#ffe6b8';
        ctx.shadowColor = st.glow || '#ff8a3d';
        ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(hx, hy, (st.head || 9) * (0.55 + 0.45 * e), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        const k = (f.t - f.hit) / (fl.sec || 0.5);          
        if (k >= 1) continue;
        ctx.save();
        ctx.globalAlpha = (1 - k) * 0.85;
        ctx.strokeStyle = 'rgba(' + (fl.color || '255,206,140') + ',1)';
        ctx.lineWidth = 5 * (1 - k) + 1;
        ctx.beginPath(); ctx.arc(f.x, f.y, (fl.r || 210) * k, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }
  }

  








  R.rockets = [];
  R.smoke = [];
  R.smoke2 = [];      
  R.parts2 = [];      
  R.scrap2 = [];      
  let rocketSeen = {}, rocketG = null;
  
  R.rocketFx = function (at, kind, fuel) {
    const F = C.rocketFx || {};
    if (!F.enabled || !at || !S.g) return null;
    
    if (!fuel && at.id && GG.sim.rocketFuel) {
      try { fuel = GG.sim.rocketFuel(at).res; } catch (e) { fuel = null; }
    }
    const rec = { id: at.id || null, x: at.x, y: at.y, loc: at.loc || S.g.loc, kind: kind,
                  t: 0, max: kind === 'land' ? (F.landSec || 3.6) : (F.launchSec || 5),
                  touched: false, puff: 0, spark: 0, fuel: fuel || null };
    R.rockets = R.rockets.filter(r => !(r.id && r.id === rec.id));
    R.rockets.push(rec);
    const snd = (F.sound || {})[kind];
    if (snd && GG.audio) GG.audio.play(snd);
    return rec;
  };
  


  R.rocketHeard = function (n, kind) {
    const F = C.rocketFx || {};
    if (!F.enabled || !n || !S.g || !(F.sound || {})[kind]) return false;
    return (n.loc || C.locations[0].id) === S.g.loc;
  };
  
  function padOf(r) {
    const n = r.id ? S.node(r.id) : null;
    if (n) return { x: n.x, y: n.y - S.sizeOf(n).h / 2 };
    return { x: r.x, y: r.y };
  }
  
  function rocketPose(r) {
    const F = C.rocketFx || {}, p = padOf(r);
    if (r.kind === 'launch') {
      const ig = F.igniteSec || 1;
      if (r.t < ig) {
        const k = r.t / ig;
        return { x: p.x + (F.shake || 0) * (0.4 + 0.6 * k) * (Math.random() * 2 - 1),
                 y: p.y, flame: k, alpha: Math.min(1, r.t / 0.2), pad: p, low: true };
      }
      const u = (r.t - ig) / Math.max(0.01, r.max - ig);
      return { x: p.x, y: p.y - (F.rise || 1500) * Math.pow(u, 2.2), flame: 1 + 0.4 * u,
               alpha: u > 0.75 ? Math.max(0, 1 - (u - 0.75) / 0.25) : 1, pad: p, low: u < 0.25 };
    }
    const ta = (F.touchAt || 0.78) * r.max;
    if (r.t < ta) {
      const k = r.t / ta;
      return { x: p.x, y: p.y - (F.from || 950) * Math.pow(1 - k, 2.4), flame: 0.45 + 0.75 * k,
               alpha: Math.min(1, k / 0.12), pad: p, low: k > 0.7 };
    }
    const k2 = (r.t - ta) / Math.max(0.01, r.max - ta);
    return { x: p.x, y: p.y, flame: Math.max(0, 1 - k2 * 4), alpha: Math.max(0, 1 - k2), pad: p, low: true };
  }
  function puff(r, x, y, vx, vy, big) {
    const M = (C.rocketFx || {}).smoke || {}, AT = (C.rocketFx || {}).atomic || {};
    R.smoke.push({ x: x, y: y, vx: vx, vy: vy, loc: r.loc, t: 0,
                   color: atomOf(r) ? AT.smoke : null,
                   max: (M.life || 2.2) * (0.7 + Math.random() * 0.6),
                   r0: (M.size || 11) * (big ? 1.4 : 1) * (0.6 + Math.random() * 0.8) });
  }
  
  function atomOf(r) {
    const A = (C.rocketFx || {}).atomic || {}, res = r.fuel && C.resources[r.fuel];
    if (!A.enabled || !res || !res.radioactive || !res.color) return null;
    const h = res.color.replace('#', '');
    return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)).join(',');
  }
  function stepRockets(dt) {
    const F = C.rocketFx || {};
    if (!F.enabled || !S.g) { R.rockets.length = 0; R.smoke.length = 0; R.smoke2.length = 0; R.parts2.length = 0; R.scrap2.length = 0; return; }
    if (rocketG !== S.g) { rocketG = S.g; rocketSeen = {}; R.rockets.length = 0; R.smoke.length = 0; R.smoke2.length = 0; R.parts2.length = 0; R.scrap2.length = 0; }
    S.machines().forEach(function (n) {
      const t = S.type(n);
      if (!t || !t.rocket) return;
      const fly = GG.sim.rocketLeft(n) > 0, was = rocketSeen[n.id];
      rocketSeen[n.id] = fly;
      if (was === undefined || was === fly) return;
      if ((n.loc || C.locations[0].id) !== S.g.loc) return;   
      R.rocketFx(n, fly ? 'launch' : 'land');
    });
    const M = F.smoke || {}, D = F.dust || {}, s = F.size || 70;
    const v2 = rocketV2();
    for (let i = R.rockets.length - 1; i >= 0; i--) {
      const r = R.rockets[i];
      r.t += dt;
      if (r.t >= r.max || (r.id && !S.node(r.id))) { R.rockets.splice(i, 1); continue; }
      if (v2) { stepRocketV2(r, dt); continue; }     
      const q = rocketPose(r);
      
      r.puff += dt * (M.perSec || 34) * (q.flame > 0.05 ? 1 : 0);
      while (r.puff >= 1) {
        r.puff -= 1;
        if (q.low) {
          const side = Math.random() < 0.5 ? -1 : 1;
          puff(r, q.pad.x + side * Math.random() * s * 0.2, q.pad.y - 2,
               side * (50 + Math.random() * 110), -(4 + Math.random() * 22), true);
        } else if (r.kind === 'launch') {
          puff(r, q.x + (Math.random() - 0.5) * 6, q.y + s * 0.18,
               (Math.random() - 0.5) * 24, 10 + Math.random() * 25, false);
        }
      }
      
      const atom = atomOf(r), AT = F.atomic || {}, SP = AT.spark || {};
      if (atom && q.flame > 0.05 && q.alpha > 0.05) {
        r.spark += dt * (AT.sparksPerSec || 45);
        while (r.spark >= 1) {
          r.spark -= 1;
          R.burst(q.x + (Math.random() - 0.5) * 8, q.y + s * 0.1,
                  { color: 'rgb(' + atom + ')', count: 1, speed: SP.speed || 110, lift: -30,
                    life: SP.life || 0.8, size: SP.size || 2.2, spread: 6 });
        }
      }
      
      if (r.kind === 'land' && !r.touched && r.t >= (F.touchAt || 0.78) * r.max) {
        r.touched = true;
        if (atom) R.burst(q.pad.x, q.pad.y, { color: 'rgb(' + atom + ')', count: AT.touchSparks || 22,
          speed: 200, lift: 60, life: 1, size: 2.4, spread: 20 });
        R.burst(q.pad.x, q.pad.y, { color: D.color || '#c9bea8', count: D.count || 34,
          speed: D.speed || 170, lift: D.lift || 30, life: D.life || 1.1, size: D.size || 3.2, spread: 30 });
        for (let k = 0; k < 14; k++) {
          const a = Math.PI + (k / 13) * Math.PI;             
          puff(r, q.pad.x, q.pad.y - 2, Math.cos(a) * (90 + Math.random() * 60),
               Math.sin(a) * 18, true);
        }
      }
    }
    for (let i = R.smoke.length - 1; i >= 0; i--) {
      const p = R.smoke[i];
      p.t += dt;
      if (p.t >= p.max) { R.smoke.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= (1 - 1.3 * dt); p.vy *= (1 - 1.3 * dt);
      p.vy -= 9 * dt;                                         
    }
    if (R.smoke.length > 280) R.smoke.splice(0, R.smoke.length - 280);
    stepRocketBits(dt);
  }
  


  function drawRocketShape(x, y, flame, alpha, accent, atom) {
    const s = ((C.rocketFx || {}).size || 70) / 70;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (flame > 0.02) {
      const L = (16 + 30 * flame) * (0.85 + Math.random() * 0.3);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, 0, 0, L);
      if (atom) {                      
        g.addColorStop(0, 'rgba(245,255,245,0.95)');
        g.addColorStop(0.3, 'rgba(' + atom + ',0.9)');
        g.addColorStop(0.7, 'rgba(' + atom + ',0.5)');
        g.addColorStop(1, 'rgba(' + atom + ',0)');
      } else {
        g.addColorStop(0, 'rgba(255,252,235,0.95)');
        g.addColorStop(0.3, 'rgba(255,209,102,0.9)');
        g.addColorStop(0.7, 'rgba(255,122,61,0.55)');
        g.addColorStop(1, 'rgba(255,90,40,0)');
      }
      ctx.fillStyle = g;
      ctx.shadowColor = atom ? 'rgb(' + atom + ')' : '#ff8a3d';
      ctx.shadowBlur = 22;
      const w = 5.5 + 2 * Math.min(1, flame);
      ctx.beginPath();
      ctx.moveTo(-w, 0);
      ctx.quadraticCurveTo(-w - 1.5, L * 0.45, 0, L);
      ctx.quadraticCurveTo(w + 1.5, L * 0.45, w, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    const line = '#8f9bab';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    
    ctx.fillStyle = accent;
    [-1, 1].forEach(function (d) {
      ctx.beginPath();
      ctx.moveTo(11 * d, -8); ctx.lineTo(21 * d, 1); ctx.lineTo(21 * d, -9); ctx.lineTo(11 * d, -27);
      ctx.closePath(); ctx.fill();
    });
    
    ctx.fillStyle = '#5d6672';
    ctx.beginPath();
    ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(4.5, -8); ctx.lineTo(-4.5, -8);
    ctx.closePath(); ctx.fill();
    
    ctx.fillStyle = '#e8ecf1'; ctx.strokeStyle = line;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-11, -52, 22, 45, 4); else ctx.rect(-11, -52, 22, 45);
    ctx.fill(); ctx.stroke();
    
    ctx.fillStyle = accent;
    ctx.fillRect(-11, -20, 22, 4);
    
    ctx.beginPath();
    ctx.moveTo(-11, -51);
    ctx.quadraticCurveTo(-10, -62, 0, -70);
    ctx.quadraticCurveTo(10, -62, 11, -51);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    
    ctx.fillStyle = '#243447';
    ctx.beginPath(); ctx.arc(0, -36, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(-1.6, -37.6, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  









  
  function rgb3(rgb, a) { return 'rgba(' + rgb + ',' + (+a).toFixed(3) + ')'; }
  function rocketV2() { return ((C.rocketFx || {}).style || 'v1') === 'v2'; }
  
  function wob(t, s) {
    return Math.sin(t * 13.1 + s) * 0.5 + Math.sin(t * 29.7 + s * 2.3) * 0.3 + Math.sin(t * 57.3 + s * 4.1) * 0.2;
  }
  function flameRGB(atom) {
    return atom ? { core: '240,255,242', mid: atom, out: atom, lit: atom }
                : { core: '255,250,232', mid: '255,196,92', out: '255,112,52', lit: '255,160,80' };
  }
  function poseV2(r) {
    const F = C.rocketFx || {}, p = padOf(r), ig = F.igniteSec || 1;
    let o;
    if (r.kind === 'launch') {
      if (r.t < ig) {
        const lit = Math.max(0, (r.t - 0.45) / Math.max(0.01, ig - 0.45));
        o = { dx: (F.shake || 0) * 0.55 * lit * wob(r.t, r.seed), dy: 0, flame: Math.pow(lit, 0.8), alpha: 1,
              legs: 1, low: true, squash: 0.6 * lit, heat: lit };
      } else {
        const u = (r.t - ig) / Math.max(0.01, r.max - ig);
        o = { dx: 0, dy: -(F.rise || 1500) * Math.pow(u, 2.2), flame: 1 + 0.45 * u,
              alpha: u > 0.75 ? Math.max(0, 1 - (u - 0.75) / 0.25) : 1,
              legs: Math.max(0, 1 - Math.max(0, u - 0.12) / 0.1), low: u < 0.2, squash: 0, heat: 1 };
      }
    } else {
      const ta = (F.touchAt || 0.78) * r.max;
      if (r.t < ta) {
        const k = r.t / ta, e = Math.min(1, Math.max(0, (k - 0.45) / 0.35));
        o = { dx: 0, dy: -(F.from || 950) * Math.pow(1 - k, 2.4), flame: 0.5 + 0.8 * Math.pow(k, 1.6),
              alpha: Math.min(1, k / 0.12), legs: e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2,
              low: k > 0.72, squash: 0, heat: 1 };
      } else {
        const k2 = (r.t - ta) / Math.max(0.01, r.max - ta);
        const dip = Math.sin(Math.min(1, k2 * 3) * Math.PI) * 2.2 * (1 - k2);
        o = { dx: 0, dy: dip, flame: Math.max(0, 1 - k2 * 5),
              alpha: k2 < 0.55 ? 1 : Math.max(0, 1 - (k2 - 0.55) / 0.45),
              legs: 1, low: true, squash: dip * 0.5, heat: Math.max(0, 1 - k2 * 0.9) };
      }
    }
    o.x = p.x + o.dx; o.y = p.y + o.dy; o.pad = p;
    return o;
  }
  function smoke2(r, o) {
    R.smoke2.push(Object.assign({ t: 0, rot: Math.random() * 6.28, loc: r.loc }, o));
  }
  function part2(r, o) {
    R.parts2.push(Object.assign({ t: 0, loc: r.loc }, o));
  }
  function stepRocketV2(r, dt) {
    const F = C.rocketFx || {}, sc = (F.size || 70) / 70, AT = F.atomic || {};
    if (r.seed === undefined) { r.seed = Math.random() * 100; r.vent = 0; r.cut = -1; }
    const q = poseV2(r), p = q.pad, atom = atomOf(r);
    const smokeRgb = atom ? (AT.smoke || '150,215,165') : '196,200,206';
    
    if (r.kind === 'launch' && r.t < 0.9) {
      r.vent += dt * 26;
      while (r.vent >= 1) {
        r.vent -= 1;
        const d = Math.random() < 0.5 ? -1 : 1;
        smoke2(r, { x: p.x + d * 11 * sc, y: p.y + (-40 + Math.random() * 4) * sc, vx: d * (30 + Math.random() * 40),
                    vy: 12 + Math.random() * 20, r0: 3 + Math.random() * 2, grow: 16, max: 0.9 + Math.random() * 0.6,
                    rgb: '235,240,246', a: 0.55, lit: 0 });
      }
    }
    
    if (r.kind === 'launch' && r.t >= 0.44 && r.t - dt < 0.44) {
      for (let i = 0; i < 26; i++) {
        const a = Math.PI * (0.05 + Math.random() * 0.9);
        part2(r, { x: p.x + (Math.random() - 0.5) * 8, y: p.y + 4, vx: Math.cos(a) * (60 + Math.random() * 160) * (Math.random() < 0.5 ? -1 : 1),
                   vy: -Math.sin(a) * (20 + Math.random() * 60), max: 0.5 + Math.random() * 0.5, size: 1.6,
                   rgb: atom || '255,190,90', glow: 1 });
      }
    }
    
    r.puff += dt * (q.low ? 42 : 26) * Math.min(1.2, q.flame) * (q.flame > 0.06 ? 1 : 0);
    while (r.puff >= 1) {
      r.puff -= 1;
      if (q.low) {
        const d = Math.random() < 0.5 ? -1 : 1;
        smoke2(r, { x: p.x + d * Math.random() * 10, y: p.y - 3 - Math.random() * 4, vx: d * (70 + Math.random() * 150),
                    vy: -(2 + Math.random() * 16), r0: 7 + Math.random() * 7, grow: 30 + Math.random() * 22,
                    max: 2.2 + Math.random() * 1.4, rgb: smokeRgb, a: 0.42, lit: 1 });
      } else if (r.kind === 'launch') {
        smoke2(r, { x: q.x + (Math.random() - 0.5) * 5, y: q.y + (F.size || 70) * 0.3 + Math.random() * 10,
                    vx: (Math.random() - 0.5) * 18, vy: 12 + Math.random() * 18, r0: 4 + Math.random() * 3,
                    grow: 18 + Math.random() * 12, max: 1.6 + Math.random() * 0.9, rgb: smokeRgb,
                    a: 0.42 * q.alpha, lit: 0.6 });
      }
    }
    
    if (q.flame > 0.08 && q.alpha > 0.05) {
      r.spark += dt * (atom ? 60 : 14) * Math.min(1, q.flame);
      while (r.spark >= 1) {
        r.spark -= 1;
        const a = Math.PI / 2 + (Math.random() - 0.5) * 1.1;
        part2(r, { x: q.x + (Math.random() - 0.5) * 6, y: q.y + 12 + Math.random() * 14,
                   vx: Math.cos(a) * (40 + Math.random() * 90), vy: Math.sin(a) * (40 + Math.random() * 110),
                   max: 0.45 + Math.random() * 0.6, size: atom ? 1.8 : 1.3, rgb: atom || '255,176,90', glow: 1, trail: 1 });
      }
    }
    
    if (r.kind === 'land' && !r.touched && r.t >= (F.touchAt || 0.78) * r.max) {
      r.touched = true;
      for (let k = 0; k < 22; k++) {
        const d = k % 2 ? 1 : -1;
        smoke2(r, { x: p.x + d * Math.random() * 12, y: p.y - 2, vx: d * (90 + Math.random() * 130), vy: -(4 + Math.random() * 14),
                    r0: 8 + Math.random() * 6, grow: 34 + Math.random() * 20, max: 1.8 + Math.random() * 1.2,
                    rgb: '201,190,168', a: 0.55, lit: 0.5 });
      }
      for (let i = 0; i < 40; i++) {
        const a = Math.PI * (1 + Math.random());
        part2(r, { x: p.x + (Math.random() - 0.5) * 30, y: p.y - 1, vx: Math.cos(a) * (60 + Math.random() * 170),
                   vy: Math.sin(a) * (30 + Math.random() * 90), max: 0.7 + Math.random() * 0.6, size: 2.2,
                   rgb: '201,190,168', grav: 1 });
      }
      if (atom) for (let i = 0; i < 28; i++) {
        const a = Math.PI * (1 + Math.random());
        part2(r, { x: p.x, y: p.y - 2, vx: Math.cos(a) * (80 + Math.random() * 180), vy: Math.sin(a) * (40 + Math.random() * 110),
                   max: 0.8 + Math.random() * 0.6, size: 1.9, rgb: atom, glow: 1, trail: 1 });
      }
    }
    
    const SC = F.scrap || {};
    if (r.kind === 'land' && r.touched && !r.dropped && SC.enabled &&
        r.t >= (F.touchAt || 0.78) * r.max + (SC.delay || 0)) {
      r.dropped = true;
      const side = r.seed % 2 < 1 ? 1 : -1, bx = p.x + side * (SC.side || 40) * sc;
      R.scrap2.push({ x: bx, y: p.y, loc: r.loc, t: 0, max: (SC.sec || 5), seed: r.seed, side: side });
      if (R.scrap2.length > 6) R.scrap2.shift();
    }
    
    if (r.kind === 'land' && r.touched && r.cut < 0 && q.flame <= 0) {
      r.cut = r.t;
      for (let i = 0; i < 6; i++) smoke2(r, { x: p.x + (Math.random() - 0.5) * 8, y: p.y - 4, vx: (Math.random() - 0.5) * 40,
        vy: -(10 + Math.random() * 16), r0: 5, grow: 20, max: 1.4, rgb: '230,234,240', a: 0.4, lit: 0 });
    }
  }
  function stepRocketBits(dt) {
    for (let i = R.smoke2.length - 1; i >= 0; i--) {
      const p = R.smoke2[i];
      p.t += dt;
      if (p.t >= p.max) { R.smoke2.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= (1 - 1.5 * dt); p.vy *= (1 - 1.2 * dt);
      p.vy -= 10 * dt; p.rot += dt * 0.4;
    }
    if (R.smoke2.length > 320) R.smoke2.splice(0, R.smoke2.length - 320);
    for (let i = R.parts2.length - 1; i >= 0; i--) {
      const p = R.parts2[i];
      p.t += dt;
      if (p.t >= p.max) { R.parts2.splice(i, 1); continue; }
      p.px = p.x; p.py = p.y;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += (p.grav ? 240 : 70) * dt; p.vx *= (1 - 1.4 * dt);
    }
    if (R.parts2.length > 400) R.parts2.splice(0, R.parts2.length - 400);
    for (let i = R.scrap2.length - 1; i >= 0; i--) {
      const b = R.scrap2[i];
      const was = b.t; b.t += dt;
      if (b.t >= b.max) { R.scrap2.splice(i, 1); continue; }
      
      if (was < 0.22 && b.t >= 0.22) {
        for (let k = 0; k < 8; k++) {
          const d = k % 2 ? 1 : -1;
          R.smoke2.push({ t: 0, rot: Math.random() * 6.28, loc: b.loc, x: b.x + d * 6, y: b.y - 2,
            vx: d * (40 + Math.random() * 60), vy: -(3 + Math.random() * 8), r0: 4, grow: 16,
            max: 1 + Math.random() * 0.6, rgb: '201,190,168', a: 0.45, lit: 0 });
        }
      }
    }
  }
  
  function softPuff(x, y, rad, rgb, a, rot) {
    for (let i = 0; i < 3; i++) {
      const ang = rot + i * 2.1, ox = Math.cos(ang) * rad * 0.28, oy = Math.sin(ang) * rad * 0.2, rr = rad * (0.8 + 0.12 * i);
      const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rr);
      g.addColorStop(0, rgb3(rgb, a * 0.55)); g.addColorStop(0.6, rgb3(rgb, a * 0.3)); g.addColorStop(1, rgb3(rgb, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + ox, y + oy, rr, 0, 6.2832); ctx.fill();
    }
  }
  function plumeV2(q, r, atom, T) {
    if (q.flame <= 0.02) return;
    const c = flameRGB(atom), f = q.flame, sd = r.seed || 0;
    const L = (18 + 34 * f) * (1 + 0.08 * wob(T, sd)), w = 5 + 2.4 * Math.min(1, f);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [[1.35, 1.9, c.out, 0.28], [1.0, 1.25, c.mid, 0.55], [0.55, 0.62, c.core, 0.95]].forEach(function (l, i) {
      const len = L * l[0], ww = w * l[1], col = l[2], al = l[3];
      const g = ctx.createLinearGradient(0, 0, 0, len);
      g.addColorStop(0, rgb3(col, al)); g.addColorStop(0.55, rgb3(col, al * 0.55)); g.addColorStop(1, rgb3(col, 0));
      ctx.fillStyle = g;
      const b1 = wob(T * 1.3 + i, sd + i) * ww * 0.18, b2 = wob(T * 1.7 + i * 2, sd - i) * ww * 0.18;
      ctx.beginPath(); ctx.moveTo(-ww * 0.72, 0);
      ctx.bezierCurveTo(-ww * 1.1 + b1, len * 0.3, -ww * 0.55 + b2, len * 0.75, 0, len);
      ctx.bezierCurveTo(ww * 0.55 - b1, len * 0.75, ww * 1.1 - b2, len * 0.3, ww * 0.72, 0);
      ctx.closePath(); ctx.fill();
    });
    if (f > 0.75) {                      
      const k = Math.min(1, (f - 0.75) / 0.3);
      for (let i = 0; i < 3; i++) {
        const y = 6 + i * (L * 0.17), rr = (w * 0.42) * (1 - i * 0.22);
        ctx.fillStyle = rgb3(c.core, 0.6 * k * (1 - i * 0.25));
        ctx.beginPath(); ctx.moveTo(0, y - rr * 1.3); ctx.lineTo(rr, y); ctx.lineTo(0, y + rr * 1.3); ctx.lineTo(-rr, y);
        ctx.closePath(); ctx.fill();
      }
    }
    const gl = ctx.createRadialGradient(0, 4, 0, 0, 4, 34 + 16 * f);
    gl.addColorStop(0, rgb3(c.mid, 0.35 * Math.min(1, f))); gl.addColorStop(1, rgb3(c.mid, 0));
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 4, 34 + 16 * f, 0, 6.2832); ctx.fill();
    ctx.restore();
  }
  
  function hullV2(q, accent, atom) {
    const legs = q.legs, heat = q.heat || 0, c = flameRGB(atom), line = '#8f9bab';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    [-1, 1].forEach(function (d) {        
      const hipX = 8 * d, hipY = -17, footX = (11 + 13 * legs) * d, footY = -22 + 26 * legs - q.squash;
      const kneeX = (10 + 7 * legs) * d, kneeY = -10 + 5 * legs;
      ctx.strokeStyle = '#4c5563'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(kneeX, kneeY); ctx.lineTo(footX, footY); ctx.stroke();
      ctx.strokeStyle = '#8b95a3'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hipX, hipY + 6); ctx.lineTo(kneeX, kneeY); ctx.stroke();
      if (legs > 0.2) { ctx.fillStyle = '#5d6672'; ctx.beginPath(); ctx.ellipse(footX, footY, 3.8 * legs, 1.4, 0, 0, 6.2832); ctx.fill(); }
    });
    ctx.fillStyle = '#5d6672';            
    ctx.beginPath(); ctx.moveTo(-7.2, 0); ctx.lineTo(7.2, 0); ctx.lineTo(4.6, -9); ctx.lineTo(-4.6, -9); ctx.closePath(); ctx.fill();
    if (heat > 0.02) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgb3(atom || '255,120,60', 0.55 * heat);
      ctx.beginPath(); ctx.moveTo(-7.2, 0); ctx.lineTo(7.2, 0); ctx.lineTo(6.2, -3.5); ctx.lineTo(-6.2, -3.5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    [-1, 1].forEach(function (d) {        
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.moveTo(10.5 * d, -7); ctx.lineTo(21 * d, 2); ctx.lineTo(22 * d, -7);
      ctx.quadraticCurveTo(18 * d, -18, 10.5 * d, -30); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgb3(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    });
    ctx.fillStyle = '#e8ecf1'; ctx.strokeStyle = line; ctx.lineWidth = 1.2;     
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-11, -52, 22, 44, 3); else ctx.rect(-11, -52, 22, 44);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgb3(70,80,94,0.55)'; ctx.lineWidth = 0.8;                
    [-31, -42].forEach(function (y) { ctx.beginPath(); ctx.moveTo(-11, y); ctx.lineTo(11, y); ctx.stroke(); });
    ctx.fillStyle = accent; ctx.fillRect(-11, -24, 22, 4.5); ctx.fillRect(-11, -50.5, 22, 2.2);   
    ctx.fillStyle = 'rgb3(60,68,80,0.55)';                                       
    for (let i = -8; i <= 8; i += 4) {
      ctx.beginPath(); ctx.arc(i, -31, 0.55, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(i, -42, 0.55, 0, 6.2832); ctx.fill();
    }
    ctx.strokeStyle = accent; ctx.lineWidth = 1.4;                               
    ctx.beginPath(); ctx.moveTo(-3, -14); ctx.lineTo(0, -11); ctx.lineTo(3, -14); ctx.stroke();
    ctx.fillStyle = '#e8ecf1'; ctx.strokeStyle = line; ctx.lineWidth = 1.2;      
    ctx.beginPath(); ctx.moveTo(-11, -51.5); ctx.bezierCurveTo(-11, -61, -6, -67, 0, -72);
    ctx.bezierCurveTo(6, -67, 11, -61, 11, -51.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.moveTo(-3.2, -68.4); ctx.quadraticCurveTo(0, -73.5, 3.2, -68.4); ctx.quadraticCurveTo(0, -69.6, -3.2, -68.4); ctx.fill();
    ctx.fillStyle = '#5c6674'; ctx.beginPath(); ctx.arc(0, -37, 5.6, 0, 6.2832); ctx.fill();   
    ctx.fillStyle = '#243447'; ctx.beginPath(); ctx.arc(0, -37, 4.4, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgb3(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-1.7, -38.8, 1.5, 1, -0.6, 0, 6.2832); ctx.fill();
    if (q.flame > 0.05) {                 
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgb3(c.lit, 0.16 * Math.min(1, q.flame)); ctx.fillRect(-11, -24, 22, 17);
      ctx.restore();
    }
  }
  function drawRocketsV2(T) {
    const loc = S.g.loc, sc = ((C.rocketFx || {}).size || 70) / 70;
    const rt = C.nodeTypes.rocket, accent = (rt && C.iconColor) ? C.iconColor(rt) : '#ff7eb6';
    const here = R.rockets.filter(function (r) { return r.loc === loc; })
      .map(function (r) { return { r: r, q: poseV2(r), atom: atomOf(r) }; });
    
    for (const p of R.smoke2) {
      if (p.loc !== loc) continue;
      const k = p.t / p.max, rad = p.r0 + p.grow * Math.sqrt(k), a = p.a * (1 - k) * (k < 0.08 ? k / 0.08 : 1);
      softPuff(p.x, p.y, rad, p.rgb, a, p.rot);
      if (!p.lit) continue;
      let near = 0, lit = null;
      here.forEach(function (h) {
        if (h.q.flame <= 0.05 || h.q.alpha <= 0.1) return;
        const v = Math.max(0, 1 - Math.hypot((p.x - h.q.x) * 0.5, p.y - h.q.y) / 120);
        if (v > near) { near = v; lit = flameRGB(h.atom).lit; }
      });
      if (near > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        softPuff(p.x, p.y + rad * 0.2, rad * 0.8, lit, a * 0.28 * near * p.lit, p.rot);
        ctx.restore();
      }
    }
    here.forEach(function (h) {
      const q = h.q, c = flameRGB(h.atom);
      if (q.low && q.flame > 0.05) {      
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gl = ctx.createRadialGradient(q.pad.x, q.pad.y, 0, q.pad.x, q.pad.y, 64);
        gl.addColorStop(0, rgb3(c.lit, 0.26 * Math.min(1, q.flame) * q.alpha)); gl.addColorStop(1, rgb3(c.lit, 0));
        ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(q.pad.x, q.pad.y, 64, 18, 0, 0, 6.2832); ctx.fill();
        const near = Math.max(0, 1 + q.dy / 60);
        if (near > 0) {
          const fw = (30 + 40 * Math.min(1.2, q.flame)) * near;
          const fan = ctx.createLinearGradient(q.x - fw, 0, q.x + fw, 0);
          fan.addColorStop(0, rgb3(c.out, 0)); fan.addColorStop(0.5, rgb3(c.mid, 0.42 * near)); fan.addColorStop(1, rgb3(c.out, 0));
          ctx.fillStyle = fan; ctx.beginPath(); ctx.ellipse(q.x, q.pad.y - 1, fw, 2.5 + 1.5 * q.flame, 0, 0, 6.2832); ctx.fill();
        }
        ctx.restore();
      }
      ctx.save(); ctx.globalAlpha = q.alpha; ctx.translate(q.x, q.y); ctx.scale(sc, sc);
      plumeV2(q, h.r, h.atom, T);
      hullV2(q, accent, h.atom);
      ctx.restore();
    });
    drawScrap2(sc, T);
    
    for (const p of R.parts2) {
      if (p.loc !== loc) continue;
      const k = 1 - p.t / p.max;
      if (p.glow) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        if (p.trail && p.px !== undefined) {
          ctx.strokeStyle = rgb3(p.rgb, 0.7 * k); ctx.lineWidth = p.size;
          ctx.beginPath(); ctx.moveTo(p.px - (p.x - p.px) * 2, p.py - (p.y - p.py) * 2); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        ctx.fillStyle = rgb3(p.rgb, 0.9 * k); ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + 0.6 * k), 0, 6.2832); ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = rgb3(p.rgb, 0.85 * k); ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + 0.7 * k), 0, 6.2832); ctx.fill();
      }
    }
  }

  



  function drawScrap2(sc, T) {
    const SC = (C.rocketFx || {}).scrap || {}, s = sc * (SC.size || 1), loc = S.g.loc;
    for (const b of R.scrap2) {
      if (b.loc !== loc) continue;
      const fall = Math.min(1, b.t / 0.22), fade = SC.fade || 0.9;
      const a = b.t > b.max - fade ? Math.max(0, (b.max - b.t) / fade) : 1;
      const land = b.t - 0.22, sq = land > 0 && land < 0.3 ? Math.sin(land / 0.3 * Math.PI) * 0.12 : 0;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(b.x, b.y - 22 * s * (1 - fall * fall));
      ctx.scale(s * (1 + sq), s * (1 - sq));
      ctx.fillStyle = 'rgba(0,0,0,0.28)';                          
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 3.2, 0, 0, 6.2832); ctx.fill();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      
      const sack = function () {
        ctx.beginPath();
        ctx.moveTo(-13, 0);
        ctx.bezierCurveTo(-19, -2, -19, -14, -9, -17);
        ctx.quadraticCurveTo(-3, -18, -1.6, -21);
        ctx.lineTo(1.6, -21);
        ctx.quadraticCurveTo(3, -18, 9, -17);
        ctx.bezierCurveTo(19, -14, 19, -2, 13, 0);
        ctx.closePath();
      };
      const chunk = function (pts, fill) {
        ctx.fillStyle = fill; ctx.strokeStyle = '#27313c'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      };
      
      ctx.save();
      sack(); ctx.fillStyle = '#3a4550'; ctx.fill(); ctx.clip();
      chunk([-17, 0, -16, -9, -8, -12, -4, -3, -8, 1], '#7d8894');     
      chunk([1, 1, -1, -9, 7, -15, 17, -8, 15, 1], '#a3adb8');         
      chunk([-9, -8, -5, -18, 4, -18, 5, -9], '#a0674a');              
      chunk([-4, -3, -1, -9, 4, -7, 3, 1], '#c4ccd4');                 
      ctx.strokeStyle = '#5c6875'; ctx.lineWidth = 2.2;               
      ctx.beginPath(); ctx.moveTo(-14, -4); ctx.quadraticCurveTo(-13, -13, -6, -15); ctx.stroke();
      
      ctx.strokeStyle = 'rgba(206,186,138,0.75)'; ctx.lineWidth = 0.8;
      for (let d = -40; d <= 40; d += 7) {
        ctx.beginPath(); ctx.moveTo(d - 25, 3); ctx.lineTo(d + 5, -27); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(d + 25, 3); ctx.lineTo(d - 5, -27); ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(214,196,150,1)'; ctx.lineWidth = 1.3;  
      sack(); ctx.stroke();
      ctx.fillStyle = 'rgba(214,196,150,1)';                          
      ctx.beginPath(); ctx.ellipse(0, -21.5, 2.6, 1.6, 0, 0, 6.2832); ctx.fill();
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.ellipse(0, -25, 2, 2.6, 0, 0, 6.2832); ctx.stroke();
      if (land > 0) {                                                
        const g1 = Math.max(0, Math.sin(T * 3.1 + b.seed)), g2 = Math.max(0, Math.sin(T * 2.3 + b.seed * 1.7 + 2));
        [[8, -11, g1], [-9, -5, g2]].forEach(function (g) {
          if (g[2] < 0.6) return;
          const k = (g[2] - 0.6) / 0.4, r = 3.2 * k;
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * k).toFixed(3) + ')'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(g[0] - r, g[1]); ctx.lineTo(g[0] + r, g[1]);
          ctx.moveTo(g[0], g[1] - r); ctx.lineTo(g[0], g[1] + r); ctx.stroke();
        });
      }
      ctx.restore();
    }
  }

  function drawRockets(T) {
    const F = C.rocketFx || {};
    if (F.enabled && rocketV2()) {
      if (R.rockets.length || R.smoke2.length || R.parts2.length || R.scrap2.length) drawRocketsV2(T || 0);
      return;
    }
    if (!F.enabled || (!R.rockets.length && !R.smoke.length)) return;
    const M = F.smoke || {};
    
    for (const p of R.smoke) {
      if (p.loc !== S.g.loc) continue;
      const k = p.t / p.max;
      ctx.fillStyle = 'rgba(' + (p.color || M.color || '200,204,210') + ',' + (0.38 * (1 - k)).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r0 + (M.grow || 26) * k, 0, Math.PI * 2);
      ctx.fill();
    }
    const rt = C.nodeTypes.rocket;
    const accent = (rt && C.iconColor) ? C.iconColor(rt) : '#ff7eb6';
    for (const r of R.rockets) {
      if (r.loc !== S.g.loc) continue;
      const q = rocketPose(r), atom = atomOf(r), lit = atom || '255,170,80';
      
      if (q.low && q.flame > 0.05) {
        const gl = ctx.createRadialGradient(q.pad.x, q.pad.y, 0, q.pad.x, q.pad.y, 70);
        gl.addColorStop(0, 'rgba(' + lit + ',' + (0.35 * Math.min(1, q.flame) * q.alpha).toFixed(3) + ')');
        gl.addColorStop(1, 'rgba(' + lit + ',0)');
        ctx.fillStyle = gl;
        ctx.beginPath(); ctx.arc(q.pad.x, q.pad.y, 70, 0, Math.PI * 2); ctx.fill();
      }
      drawRocketShape(q.x, q.y, q.flame, q.alpha, accent, atom);
    }
  }

  function stepWaves(dt) {
    for (let i = R.waves.length - 1; i >= 0; i--) {
      R.waves[i].t += dt;
      if (R.waves[i].t >= R.waves[i].max) R.waves.splice(i, 1);
    }
  }

  function drawWaves() {
    if (!C.siteFx.ring.on) return;      
    for (const w of R.waves) {
      
      
      
      const s = w.site, box = S.siteBox(s);
      
      
      const k = w.t / C.siteFx.ring.sec;
      if (k >= 1) continue;
      const reach = Math.hypot(box.w, box.h);
      ctx.save();
      sitePath(s, box, wavesOn(s)); ctx.clip();   
      for (let ring = 0; ring < 2; ring++) {
        const rk = k - ring * 0.18;
        if (rk <= 0 || rk >= 1) continue;
        ctx.globalAlpha = (1 - rk) * 0.55;
        ctx.strokeStyle = '#bcd68c';
        ctx.lineWidth = 3 * (1 - rk) + 0.6;
        ctx.beginPath();
        ctx.arc(w.x, w.y, rk * reach, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  function stepParticles(dt) {
    for (let i = R.particles.length - 1; i >= 0; i--) {
      const p = R.particles[i];
      p.life += dt;
      if (p.life >= p.max) { R.particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 130 * dt;              
      p.vx *= (1 - 1.6 * dt); p.vy *= (1 - 0.5 * dt);
    }
  }

  function drawParticles() {
    for (const p of R.particles) {
      const k = 1 - p.life / p.max;
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + k * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  R.toScreen = function (wx, wy) {
    const c = S.g.camera;
    return { x: (wx - c.x) * c.scale + W / 2, y: (wy - c.y) * c.scale + H / 2 };
  };
  R.toWorld = function (sx, sy) {
    const c = S.g.camera;
    return { x: (sx - W / 2) / c.scale + c.x, y: (sy - H / 2) / c.scale + c.y };
  };
  R.size = function () { return { w: W, h: H }; };

  















  function viewRect(pad) {
    const a = R.toWorld(0, 0), b = R.toWorld(W, H);
    return { x0: Math.min(a.x, b.x) - pad, y0: Math.min(a.y, b.y) - pad,
             x1: Math.max(a.x, b.x) + pad, y1: Math.max(a.y, b.y) + pad };
  }
  function inRect(r, x, y) { return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1; }
  


  R.viewWorld = function () { return (W > 0 && H > 0) ? viewRect(0) : null; };
  

  function boxHits(r, ax, ay, bx, by) {
    return Math.min(ax, bx) <= r.x1 && Math.max(ax, bx) >= r.x0 &&
           Math.min(ay, by) <= r.y1 && Math.max(ay, by) >= r.y0;
  }

  


  R.contentBox = function (loc) {
    const id = loc || S.g.loc;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, n = 0;
    S.g.nodes.forEach(function (nd) {
      if (nd.loc !== id) return;
      const t = S.type(nd);
      const box = t && t.site ? S.siteBox(nd) : S.sizeOf(nd);
      const w = (box && box.w) || 220, h = (box && box.h) || 120;
      minX = Math.min(minX, nd.x - w / 2); maxX = Math.max(maxX, nd.x + w / 2);
      minY = Math.min(minY, nd.y - h / 2); maxY = Math.max(maxY, nd.y + h / 2);
      n++;
    });
    if (!n) return null;
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY,
             cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
             w: maxX - minX, h: maxY - minY, count: n };
  };


  
  function rowLayout(node) {
    const t = S.type(node);
    const size = S.sizeOf(node);
    const M = S.METRICS;
    const top = node.y - size.h / 2 + M.HEAD + S.capRows(t, node) * M.CAP_ROW;
    const rows = S.rowsOf(node);
    rows.forEach((r, i) => { r.cy = top + i * M.ROW + M.ROW / 2; });
    return { rows: rows, size: size, t: t };
  }

  

















  R.portFace = function (node, kind) {
    const out = kind === 'out' ? 1 : -1;
    return (C.ui.flipPorts !== false && node && node.flip) ? -out : out;
  };
  





  R.canFlip = function (node) {
    const t = S.type(node);
    if (C.ui.flipPorts === false || !t || t.kind !== 'machine') return false;
    return C.ui.flipAll !== false || !!t.flippable;
  };

  R.portPos = function (node, dir, portId) {
    const L = rowLayout(node);
    const row = L.rows.find(r => r.kind === dir && r.port && r.port.id === portId);
    const cy = row ? row.cy : node.y;
    const f = R.portFace(node, dir);
    return { x: node.x + L.size.w / 2 * f, y: cy, face: f };
  };

  

  






  R.hitPort = function (wx, wy, pad, dir) {
    const reach = 13 + (pad > 0 ? pad : 0);
    let best = null, bestD = Infinity;
    for (const n of S.machinesHere()) {
      const L = rowLayout(n);
      for (const r of L.rows) {
        if (r.kind === 'vout') continue;
        if (dir && r.kind !== dir) continue;
        const x = n.x + L.size.w / 2 * R.portFace(n, r.kind);
        const d = Math.hypot(wx - x, wy - r.cy);
        if (d > reach) continue;
        if (!(pad > 0)) return { node: n, dir: r.kind, port: r.port };
        if (d < bestD) { bestD = d; best = { node: n, dir: r.kind, port: r.port }; }
      }
    }
    return best;
  };

  R.hitNode = function (wx, wy) {
    const ms = S.machinesHere();
    for (let i = ms.length - 1; i >= 0; i--) {
      const n = ms[i], s = S.sizeOf(n);
      if (Math.abs(wx - n.x) <= s.w / 2 && Math.abs(wy - n.y) <= s.h / 2) return n;
    }
    return null;
  };

  
  function segDist(x, y, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
    const k = L > 0 ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / L)) : 0;
    return Math.hypot(x - (a.x + k * dx), y - (a.y + k * dy));
  }
  R.hitLink = function (wx, wy) {
    for (const l of S.g.links) {
      const a = S.node(l.from), b = S.node(l.to);
      if (!a || !b || !S.here(a)) continue;
      const p0 = R.portPos(a, 'out', l.fromPort), p1 = R.portPos(b, 'in', l.toPort);
      const sq = R.wireOrtho(l);
      


      const steps = sq
        ? GG.util.clamp(Math.round(R.wireSegs(p0, p1).total / 10), 16, 96) : 16;
      

      const whole = ((C.wire || {}).hitWhole) !== false;
      let prev = null;
      for (let i = 0; i <= steps; i++) {
        const pt = R.wireAt(p0, p1, sq, i / steps);
        if (Math.hypot(wx - pt.x, wy - pt.y) < 9) return l;
        if (whole && prev && segDist(wx, wy, prev, pt) < 9) return l;
        prev = pt;
      }
    }
    return null;
  };

  



  function faceOf(p, dflt) { return p && p.face !== undefined ? p.face : dflt; }
  function ctrl(p0, p1) {
    const d = Math.max(55, Math.abs(p1.x - p0.x) * 0.5);
    return [{ x: p0.x + d * faceOf(p0, 1), y: p0.y },
            { x: p1.x + d * faceOf(p1, -1), y: p1.y }];
  }

  












  function orthoCfg() { return (C.wire && C.wire.ortho) || {}; }
  R.wireOrtho = function (l) { return !!(l && l.ortho && orthoCfg().enabled !== false); };

  
  function orthoPts(p0, p1) {
    const o = orthoCfg();
    const stub = o.stub === undefined ? 26 : o.stub;
    const f0 = faceOf(p0, 1), f1 = faceOf(p1, -1);
    
    const ax = p0.x + stub * f0, bx = p1.x + stub * f1;
    





    if (f0 !== f1 && (bx - ax) * f0 >= 0) {
      const mx = (ax + bx) / 2;
      return [p0, { x: mx, y: p0.y }, { x: mx, y: p1.y }, p1];
    }
    

    const jog = o.minJog === undefined ? 26 : o.minJog;
    let my = (p0.y + p1.y) / 2;
    if (Math.abs(p1.y - p0.y) < jog * 2) my = p0.y + jog * 2;
    return [p0, { x: ax, y: p0.y }, { x: ax, y: my },
            { x: bx, y: my }, { x: bx, y: p1.y }, p1];
  }

  



  R.wireSegs = function (p0, p1) {
    const pts = orthoPts(p0, p1);
    const r0 = orthoCfg().radius === undefined ? 12 : orthoCfg().radius;
    const segs = [];
    let at = pts[0];
    for (let i = 1; i < pts.length - 1; i++) {
      const c = pts[i], nx = pts[i + 1];
      const din = Math.hypot(c.x - at.x, c.y - at.y) || 1;
      const dout = Math.hypot(nx.x - c.x, nx.y - c.y) || 1;
      
      
      const r = Math.min(r0, din / 2, dout / 2);
      const a = { x: c.x + (at.x - c.x) / din * r, y: c.y + (at.y - c.y) / din * r };
      const b = { x: c.x + (nx.x - c.x) / dout * r, y: c.y + (nx.y - c.y) / dout * r };
      segs.push({ a: at, b: a });
      if (r > 0) segs.push({ a: a, c: c, b: b });
      at = b;
    }
    segs.push({ a: at, b: pts[pts.length - 1] });
    let total = 0;
    segs.forEach(function (g) {
      
      g.len = g.c
        ? (Math.hypot(g.c.x - g.a.x, g.c.y - g.a.y) + Math.hypot(g.b.x - g.c.x, g.b.y - g.c.y) +
           Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y)) / 2
        : Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y);
      g.at = total; total += g.len;
    });
    segs.total = total;
    return segs;
  };

  

  function wirePath(p0, p1, ortho) {
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    if (!ortho) {
      const [c0, c1] = ctrl(p0, p1);
      ctx.bezierCurveTo(c0.x, c0.y, c1.x, c1.y, p1.x, p1.y);
      return;
    }
    R.wireSegs(p0, p1).forEach(function (g) {
      if (g.c) ctx.quadraticCurveTo(g.c.x, g.c.y, g.b.x, g.b.y);
      else ctx.lineTo(g.b.x, g.b.y);
    });
  }

  
  R.wireAt = function (p0, p1, ortho, t) {
    if (!ortho) return bezier(p0, p1, t);
    const segs = R.wireSegs(p0, p1);
    const d = GG.util.clamp(t, 0, 1) * segs.total;
    for (let i = 0; i < segs.length; i++) {
      const g = segs[i];
      if (d > g.at + g.len && i < segs.length - 1) continue;
      const u = g.len > 0 ? GG.util.clamp((d - g.at) / g.len, 0, 1) : 0;
      if (!g.c) return { x: g.a.x + (g.b.x - g.a.x) * u, y: g.a.y + (g.b.y - g.a.y) * u };
      const v = 1 - u;
      return { x: v * v * g.a.x + 2 * v * u * g.c.x + u * u * g.b.x,
               y: v * v * g.a.y + 2 * v * u * g.c.y + u * u * g.b.y };
    }
    return p1;
  };
  function bezier(p0, p1, t) {
    const [c0, c1] = ctrl(p0, p1);
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * c0.x + 3 * u * t * t * c1.x + t * t * t * p1.x,
      y: u * u * u * p0.y + 3 * u * u * t * c0.y + 3 * u * t * t * c1.y + t * t * t * p1.y,
    };
  }

  








  R.collectRect = function (node, side) {
    const t = S.type(node);
    if (!t.collect && !t.action) return null;
    const size = S.sizeOf(node), M = S.METRICS;
    const rows = S.rowsOf(node).length;
    const top = node.y - size.h / 2 + M.HEAD + S.capRows(t, node) * M.CAP_ROW + rows * M.ROW;
    const x = node.x - size.w / 2 + 13, w = size.w - 26;
    





    if (t.collectB) {
      const gap = 6, half = (w - gap) / 2;
      return { x: side === 'B' ? x + half + gap : x, y: top + 4, w: half, h: 22 };
    }
    return { x: x, y: top + 4, w: w, h: 22 };
  };

  




  R.hitCollectAt = function (wx, wy) {
    for (const n of S.machinesHere()) {
      for (const side of GG.sim.sides(S.type(n))) {
        const r = R.collectRect(n, side);
        if (r && wx >= r.x && wx < r.x + r.w && wy >= r.y && wy < r.y + r.h)
          return { node: n, side: side };
      }
    }
    return null;
  };
  

  R.hitCollect = function (wx, wy) {
    const h = R.hitCollectAt(wx, wy);
    return h ? h.node : null;
  };

  







  R.pillFlipRect = function (n) {
    const F = C.diagnose.pillFlip || {};
    if (!F.enabled) return null;
    const t = S.type(n);
    if (!t || t.kind === 'site') return null;
    const hp = R.headPill(n, t);
    if (!hp.flip) return null;
    const size = S.sizeOf(n);
    return { x: n.x + size.w / 2 - hp.w - 12, y: n.y - size.h / 2 + 13, w: hp.w, h: 16 };
  };

  




  R.cyclePill = function (n) {
    const t = S.type(n);
    if (!t) return;
    const hp = R.headPill(n, t);
    const len = hp.cands;                     
    if (!hp.flip || len < 2) return;
    const next = ((n.pillAlt | 0) + 1) % len;
    if (next) n.pillAlt = next; else delete n.pillAlt;
  };

  



  R.hitPillFlip = function (wx, wy, pad) {
    const p = pad || 0;
    for (const n of S.machinesHere()) {
      const r = R.pillFlipRect(n);
      if (r && wx >= r.x - p && wx < r.x + r.w + p &&
               wy >= r.y - p && wy < r.y + r.h + p) return n;
    }
    return null;
  };

  
  let lastTime = 0;
  R.draw = function (time, ui) {
    

















    if (cv.clientWidth && cv.clientHeight &&
        (cv.clientWidth !== W || cv.clientHeight !== H)) R.resize();
    const dt = Math.min(0.1, Math.max(0, time - lastTime));
    lastTime = time;
    stepParticles(dt);
    stepWaves(dt);
    stepFalls(dt);
    stepRockets(dt);      
    stepHeal(dt);
    stepRevive(dt);
    const cam = S.g.camera;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    
    
    
    if (R.reviveOn()) {
      const k = R.reviveK();
      bg.addColorStop(0, mix(C.revive.ground.dirty[0], C.revive.ground.clean[0], k));
      bg.addColorStop(1, mix(C.revive.ground.dirty[1], C.revive.ground.clean[1], k));
    } else if (C.heal && C.heal.enabled) {
      const k = R.healK();
      bg.addColorStop(0, mix(C.heal.skyDirty[0], C.heal.skyClean[0], k));
      bg.addColorStop(1, mix(C.heal.skyDirty[1], C.heal.skyClean[1], k));
    } else {
      bg.addColorStop(0, '#0d1219'); bg.addColorStop(1, '#090d13');
    }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    drawGrid(cam);

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(cam.scale, cam.scale);
    ctx.translate(-cam.x, -cam.y);

    

    boostMarks = (C.boostFx && C.boostFx.enabled) ? GG.sim.boostMarks() : {};

    drawGroundCover();
    S.sitesHere().forEach(s => drawSite(s, time, ui));
    drawWaves();
    drawBeaconRange(ui);   
    


    const hotWires = (GG.tutor && GG.tutor.hotWires) ? GG.tutor.hotWires() : null;

    

    const cull = (C.ui && C.ui.cull) || {};
    const nRect = cull.enabled ? viewRect(cull.nodePad === undefined ? 260 : cull.nodePad) : null;
    const lRect = cull.enabled ? viewRect(cull.wirePad === undefined ? 340 : cull.wirePad) : null;

    S.g.links.forEach(function (l) {
      if (lRect) {
        const a = S.node(l.from), b = S.node(l.to);
        if (!a || !b || !boxHits(lRect, a.x, a.y, b.x, b.y)) return;
      }
      drawLink(l, time, ui, hotWires);
    });
    if (ui.wire) drawPendingWire(ui);
    S.machinesHere().forEach(function (n) {
      if (nRect && !inRect(nRect, n.x, n.y)) return;
      drawNode(n, time, ui);
    });
    if (ui.band) drawBand(ui.band);
    drawParticles();
    drawRockets(time);    
    drawFalls();          
    drawArms(time);       

    if (ui.ghost) drawGhost(ui);

    ctx.restore();

    
    drawSmog(time);

    
    
    drawWeather(time, dt);
  };

  





  







  const armShow = new WeakMap();
  function armTime(a, time) {
    if ((C.ui || {}).armSmooth === false) return a.t;
    const tick = 1 / ((C.sim && C.sim.tickRate) || 20) * ((GG.ui && GG.ui.speed) || 1);
    let d = armShow.get(a);
    if (!d) { d = { t: a.t, at: time }; armShow.set(a, d); }
    d.t += Math.max(0, time - d.at);
    d.at = time;
    d.t = Math.min(Math.max(d.t, a.t), a.t + tick, a.dur);
    return d.t;
  }

  function drawArms(time) {
    S.machinesHere().forEach(function (n) {
      const t = C.nodeTypes[n.type];
      if (!t || !t.gemArm) return;
      const size = S.sizeOf(n);
      const hx = n.x, hy = n.y - size.h / 2;
      const a = n.arm;
      const open = a ? 1 : 0;
      
      ctx.save();
      ctx.fillStyle = 'rgba(20,28,40,.95)';
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(hx - 13, hy - 7 - open * 3, 26, 9 + open * 3, 3);
      ctx.fill(); ctx.stroke();
      if (!a) { ctx.restore(); return; }
      const half = a.dur / 2, at = armTime(a, time);   
      let e = at < half ? at / half : Math.max(0, (a.dur - at) / half);
      e = e * e * (3 - 2 * e);                       
      const tx = hx + (a.x - hx) * e, ty = (hy - 6) + (a.y - (hy - 6)) * e;
      const dx = tx - hx, dy = ty - (hy - 6), len = Math.hypot(dx, dy) || 1;
      const segs = Math.max(2, Math.min(12, Math.ceil(Math.hypot(a.x - hx, a.y - hy) / 140)));
      const nx = -dy / len, ny = dx / len;
      
      const amp = Math.min(22, len / segs) * (1 - e * 0.85);
      const pts = [];
      for (let i = 0; i <= segs; i++) {
        const f = i / segs, zig = (i === 0 || i === segs) ? 0 : (i % 2 ? 1 : -1);
        pts.push([hx + dx * f + nx * amp * zig, hy - 6 + dy * f + ny * amp * zig]);
      }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(8,12,18,.85)'; ctx.lineWidth = 9;
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.stroke();
      ctx.strokeStyle = t.color; ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = '#d8f5ec';
      pts.forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 3.2, 0, 6.2832); ctx.fill(); });
      
      const ang = Math.atan2(dy, dx), claw = a.grabbed ? 0.35 : 0.8;
      ctx.strokeStyle = t.color; ctx.lineWidth = 3.5;
      [-1, 1].forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(tx, ty);
        ctx.lineTo(tx + Math.cos(ang + s * claw) * 13, ty + Math.sin(ang + s * claw) * 13);
        ctx.stroke();
      });
      if (a.grabbed) GG.icons.drawIcon(ctx, 'diamond', tx + Math.cos(ang) * 12,
                                       ty + Math.sin(ang) * 12, 26, '#bfe9ff');
      ctx.restore();
    });
  }

  




  function drawWeather(time, dt) {
    


    const w = GG.sim.weather();
    const flash = GG.sim.wxFlashOf();

    
    
    if (!w && flash <= 0) return;

    ctx.save();
    if (w) {
      if (w.id === 'rain') drawRain(time, 150, 'rgba(150,200,235,0.34)', 0.10, w.color);
      else if (w.id === 'storm') drawRain(time, 320, 'rgba(170,160,225,0.40)', 0.20, w.color);
      else if (w.id === 'lightning') drawLightning(time, w.color);
      else if (w.id === 'heat') drawHeat(time, w.color);
    }
    
    if (flash > 0) {
      const k = flash / C.weather.fadeSec;              
      const c = w ? w.color : '#cfe3ff';
      ctx.globalAlpha = k * 0.45;
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  

  function drawRain(time, n, streak, tint, color) {
    ctx.fillStyle = rgba(color, tint);
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = streak;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const lean = W * 0.06;
    for (let i = 0; i < n; i++) {
      const sp = 900 + (i % 7) * 190;                   
      const x = ((i * 977) % 1000) / 1000 * (W + lean) - lean;
      const y = ((i * 613) % 1000) / 1000 * H + time * sp;
      const py = y % (H + 80) - 40;
      const len = 16 + (i % 5) * 7;
      ctx.moveTo(x, py);
      ctx.lineTo(x + lean * (len / 60), py + len);
    }
    ctx.stroke();
  }

  

  function drawLightning(time, color) {
    ctx.fillStyle = 'rgba(8,10,20,0.55)';
    ctx.fillRect(0, 0, W, H);
    
    const beat = (time * 3) % 1;
    const strike = beat < 0.09 ? 1 - beat / 0.09 : 0;
    if (strike > 0) {
      ctx.fillStyle = rgba(color, 0.30 * strike);
      ctx.fillRect(0, 0, W, H);
      
      const seed = Math.floor(time * 3);
      let x = ((seed * 7919) % 1000) / 1000 * W;
      ctx.strokeStyle = rgba(color, 0.9 * strike);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x, -10);
      for (let y = 0; y < H; y += H / 9) {
        x += (((seed * 31 + y) % 100) / 100 - 0.5) * 90;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  
  function drawHeat(time, color) {
    ctx.fillStyle = rgba(color, 0.13);
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rgba(color, 0.05);
    for (let i = 0; i < 9; i++) {
      const y = ((i * 137 + time * 26) % (H + 60)) - 30;
      const h = 10 + (i % 3) * 7;
      ctx.fillRect(0, y + Math.sin(time * 1.4 + i) * 4, W, h);
    }
  }

  function drawGrid(cam) {
    const step = C.world.grid * cam.scale;
    if (step < 6) return;
    const ox = (W / 2 - cam.x * cam.scale) % step;
    const oy = (H / 2 - cam.y * cam.scale) % step;
    ctx.strokeStyle = R.reviveOn()
      ? (R.reviveK() > 0.5 ? C.revive.grid.clean : C.revive.grid.dirty)
      : (C.heal && C.heal.enabled)
        ? (R.healK() > 0.5 ? C.heal.grid.clean : C.heal.grid.dirty)
        : 'rgba(120,160,190,0.05)';
    





    const hot = ((C.ui || {}).gridSnap || {}).hot || 0;
    if (hot > 0 && GG.input && GG.input.snapping && GG.input.snapping()) {
      ctx.strokeStyle = 'rgba(120,160,190,' + hot + ')';
    }
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = ox; x < W; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (let y = oy; y < H; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.stroke();
  }

  



  








  function lerpCol(a, b, k) {
    if (typeof a !== 'string' || typeof b !== 'string' || a === b) return a;
    if (a[0] === '#' && b[0] === '#' && a.length === 7 && b.length === 7) {
      let out = '#';
      for (let i = 1; i < 7; i += 2) {
        const va = parseInt(a.substr(i, 2), 16), vb = parseInt(b.substr(i, 2), 16);
        out += ('0' + Math.round(va + (vb - va) * k).toString(16)).slice(-2);
      }
      return out;
    }
    const NUM = /-?\d*\.?\d+/g;
    const na = a.match(NUM), nb = b.match(NUM);
    if (!na || !nb || na.length !== nb.length) return a;
    let i = 0;
    return a.replace(NUM, function (tok) {
      const va = +na[i], vb = +nb[i]; i++;
      const v = va + (vb - va) * k;
      return tok.indexOf('.') >= 0 ? v.toFixed(3) : String(Math.round(v));
    });
  }

  



  const skinCache = new Map();
  



  function surfY(px, time, PW, stir) {
    if (!PW) return Math.sin(px * 0.045 + time * 1.1) * 3.2;
    const a = PW.amp * (1 + (PW.stir || 0) / Math.max(1e-6, PW.amp) * (stir || 0));
    return Math.sin(px * 0.045 + time * PW.speed) * a +
           Math.sin(px * 0.017 - time * PW.speed * 0.7) * a * 0.35 * (stir || 0);
  }

  function mixSkin(sk, k) {
    if (!sk || !sk.clean) return sk;
    k = Math.max(0, Math.min(1, k || 0));
    const q = Math.round(k * 100);
    let hit = skinCache.get(sk);
    if (hit && hit.q === q) return hit.v;
    const out = {};
    Object.keys(sk).forEach(function (key) {
      if (key === 'clean') return;
      out[key] = sk.clean[key] === undefined ? sk[key] : lerpCol(sk[key], sk.clean[key], q / 100);
    });
    skinCache.set(sk, { q: q, v: out });
    return out;
  }
  R.mixSkin = mixSkin;

  















  function rockShine(s, x, y, w, h, time, ws) {
    const SH = (C.asteroid && C.asteroid.shine) || {};
    if (SH.enabled === false) return;
    const col = SH.color || '255,226,150';

    ctx.save();
    sitePath(s, { w: w, h: h }, ws); ctx.clip();

    




    if (SH.sweep) {
    const period = SH.sec || 3.4, cross = SH.sweepSec || 0.9;
    const ph = (time % period) / cross;
    if (ph <= 1) {
      const band = (SH.width || 0.30) * (w + h);
      const span = w + h + band * 2;
      const at = -band + ph * span;                     
      const g = ctx.createLinearGradient(x + at - band, y, x + at + band, y + h);
      g.addColorStop(0, 'rgba(' + col + ',0)');
      g.addColorStop(0.5, 'rgba(' + col + ',' + (SH.alpha || 0.26) + ')');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    }
    }

    


    const n = SH.glints === undefined ? 5 : SH.glints;
    if (n > 0) {
      let hash = 0;
      const id = String(s.id || '');
      for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
      const rnd = i => { const v = Math.sin(hash * 0.0001 + i * 12.9898) * 43758.5453;
                         return v - Math.floor(v); };
      const size = SH.glintSize || 8;
      



      ctx.fillStyle = 'rgba(' + col + ',1)';
      for (let i = 0; i < n; i++) {
        
















        const inner = SH.glintInner === undefined ? 0.30 : SH.glintInner;
        const outer = SH.glintOuter === undefined ? 0.94 : SH.glintOuter;
        const ang = (i + rnd(i) * 0.85) * (6.2832 / n);
        const rad = inner + rnd(i + 99) * (outer - inner);
        const gx = x + w / 2 + Math.cos(ang) * (w / 2) * rad;
        const gy = y + h / 2 + Math.sin(ang) * (h / 2) * rad;
        const beat = (time * (0.6 + rnd(i + 7) * 0.5) + rnd(i + 13) * 6.283) % 6.283;
        const k = Math.max(0, Math.sin(beat));
        const a = k * k * (SH.glintAlpha === undefined ? 0.5 : SH.glintAlpha);
        if (a < 0.02) continue;
        




        const vr = SH.glintSizeVar === undefined ? 0.35 : SH.glintSizeVar;
        const own = size * (1 + (rnd(i + 41) * 2 - 1) * vr);
        const r = own * (0.45 + k * 0.55);      
        const waist = r * (SH.glintWaist || 0.16);
        

        if (SH.glintGlow) {
          const gr = r * SH.glintGlow;
          const halo = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
          halo.addColorStop(0, 'rgba(' + col + ',' + (a * (SH.glowAlpha || 0.45)).toFixed(3) + ')');
          halo.addColorStop(1, 'rgba(' + col + ',0)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = halo;
          ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 6.2832); ctx.fill();
          ctx.fillStyle = 'rgba(' + col + ',1)';
        }
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.moveTo(gx, gy - r);
        ctx.quadraticCurveTo(gx + waist, gy - waist, gx + r, gy);
        ctx.quadraticCurveTo(gx + waist, gy + waist, gx, gy + r);
        ctx.quadraticCurveTo(gx - waist, gy + waist, gx - r, gy);
        ctx.quadraticCurveTo(gx - waist, gy - waist, gx, gy - r);
        ctx.fill();
        
        ctx.globalAlpha = a * 0.9;
        ctx.beginPath();
        ctx.arc(gx, gy, Math.max(0.6, r * 0.16), 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  




  function radHash(n) { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
  function radSeed(s) {
    const id = String(s.id); let h = 7;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
    return h;
  }
  function radiationFx(s, RD, x, y, w, h, frac, time, ws) {
    const col = RD.color || '214,246,120';
    const seed = radSeed(s);
    const box = S.siteBox(s);
    const topY = y + h * (1 - frac);
    const G = RD.glow;
    const pulse = G && G.on ? 0.5 + 0.5 * Math.sin(time * 2 * Math.PI / (G.sec || 3) + seed) : 0;
    ctx.save();
    
    if (G && G.on) {
      ctx.strokeStyle = 'rgba(' + col + ',' + (G.edge * pulse).toFixed(3) + ')';
      ctx.lineWidth = 5;
      sitePath(s, box, ws); ctx.stroke();
    }
    sitePath(s, box, ws); ctx.clip();
    
    if (G && G.on) {
      const a = G.min + (G.max - G.min) * pulse;
      const cy = (topY + y + h) / 2, rr = Math.max(w, h) * 0.6;
      const gr = ctx.createRadialGradient(s.x, cy, 0, s.x, cy, rr);
      gr.addColorStop(0, 'rgba(' + col + ',' + a.toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = gr;
      ctx.fillRect(x, y, w, h);
    }
    
    const MO = RD.motes;
    if (MO && MO.on) {
      for (let i = 0; i < MO.count; i++) {
        const r1 = radHash(seed + i * 13.1), r2 = radHash(seed + i * 7.7), r3 = radHash(seed + i * 3.3);
        const life = MO.riseSec * (0.7 + 0.6 * r3);
        const p = ((time / life) + r2) % 1;
        const mx = x + 10 + r1 * (w - 20) + Math.sin(time * 1.3 + i) * 4;
        const my = (y + h - 6) - p * (h * 0.85);
        const a = Math.sin(p * Math.PI) * MO.alpha;
        ctx.fillStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(mx, my, MO.size * (0.6 + 0.8 * r3), 0, Math.PI * 2); ctx.fill();
      }
    }
    
    const SP = RD.sparks;
    if (SP && SP.on && SP.perSec > 0) {
      const per = 1 / SP.perSec;
      const slot = Math.floor((time + seed) / per), into = (time + seed) - slot * per;
      if (into < SP.sec && radHash(seed + slot * 5.1) < 0.8) {
        const k = 1 - into / SP.sec;
        const sx = x + 16 + radHash(seed + slot * 1.37) * (w - 32);
        const sy = y + 16 + radHash(seed + slot * 2.71) * (h - 32);
        const L = 4 + 7 * (1 - k);
        ctx.fillStyle = 'rgba(' + col + ',' + (0.45 * k).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(sx, sy, 3 + 5 * (1 - k), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(245,255,205,' + (0.9 * k).toFixed(3) + ')';
        ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx - L, sy); ctx.lineTo(sx + L, sy);
        ctx.moveTo(sx, sy - L); ctx.lineTo(sx, sy + L);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawSite(s, time, ui) {
    const t = S.type(s);
    const grow = !!t.grow;
    









    










    const layeredSite = !!(t.volume && C.pool && C.pool.layers);
    const skinK = grow && !(layeredSite && C.pool && C.pool.tintGround === false)
      ? GG.sim.growFrac(s) : 0;
    const sk = mixSkin(t.skin || C.nodeTypes.trashSite.skin, skinK);
    
    
    const box = S.siteBox(s);
    const w = box.w, h = box.h;
    const x = s.x - w / 2, y = s.y - h / 2;
    
    
    
    
    const maxRes = grow ? GG.sim.growCap(s) : (s.full || t.reserve);
    const shown = Math.max(0, s.shown === undefined ? (grow ? s.grown : s.reserve) : s.shown);
    




    const layered = layeredSite;
    let dirtyF = 0, cleanF = 0, stir = 0;
    const PW = (C.pool && C.pool.wave) || { amp: 0, speed: 1, seamAmp: 0, seamSpeed: 1,
                                            stir: 0, stirSec: 1 };
    if (layered) {
      const vol = GG.sim.poolVolume(s);
      dirtyF = vol > 0 ? Math.min(1, GG.sim.poolDirty(s) / vol) : 0;
      cleanF = vol > 0 ? Math.min(1 - dirtyF, GG.sim.poolClean(s) / vol) : 0;
      





      const lvl = dirtyF + cleanF;
      if (s.wasLvl === undefined) s.wasLvl = lvl;
      if (Math.abs(lvl - s.wasLvl) > 1e-7) s.stirT = PW.stirSec;
      else s.stirT = Math.max(0, (s.stirT || 0) - 0.016);
      s.wasLvl = lvl;
      stir = PW.stirSec > 0 ? (s.stirT || 0) / PW.stirSec : 0;
    }
    const frac = layered ? dirtyF + cleanF
               : t.fillFull ? 1 : (maxRes > 0 ? Math.min(1, shown / maxRes) : 0);
    const empty = !grow && s.reserve <= 1e-6;
    
    
    
    const gt = ui.ghost && ui.ghost.type ? C.nodeTypes[ui.ghost.type] : null;
    const targeting = !!gt && !!gt.siteType && S.fitsSite(gt, s);
    const glow = targeting ? 0.5 + 0.5 * Math.sin(time * 3) : 0;

    
    ctx.save();
    if (s.fade) ctx.globalAlpha = Math.max(0, 1 - s.fade / t.fadeSec);
    







    const fa = fallOf(s);
    if (fa) {
      const A = C.asteroid || {}, F = A.fall || {};
      if (fa.t < fa.hit) {
        ctx.globalAlpha *= 0.12;
      } else {
        const k = Math.min(1, (fa.t - fa.hit) / ((F.settleSec || 0.55)));
        ctx.globalAlpha *= 0.12 + 0.88 * k;
        const sc = 1.10 - 0.10 * k;
        ctx.translate(s.x, s.y); ctx.scale(sc, sc); ctx.translate(-s.x, -s.y);
      }
    }

    
    const ws = wavesOn(s);

    
    ctx.fillStyle = sk.pit;
    sitePath(s, box, ws); ctx.fill();

    
    if (frac > 0.001) {
      ctx.save();
      sitePath(s, box, ws); ctx.clip();
      const topY = y + h * (1 - frac);
      const g = ctx.createLinearGradient(0, topY, 0, y + h);
      g.addColorStop(0, sk.fillTop);
      g.addColorStop(1, sk.fillBot);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, topY);
      for (let px = 0; px <= w; px += 8) {
        ctx.lineTo(x + px, topY + surfY(px, time, layered ? PW : null, stir) +
                              flowSurf(ws, x + px));
      }
      ctx.lineTo(x + w, y + h);
      ctx.closePath(); ctx.fill();

      





      if (layered && cleanF > 0.001) {
        const seamY = y + h * (1 - dirtyF);      
        const cs = mixSkin(t.skin || C.nodeTypes.trashSite.skin, 1);
        const cg = ctx.createLinearGradient(0, topY, 0, seamY);
        cg.addColorStop(0, cs.fillTop);
        cg.addColorStop(1, cs.fillBot);
        ctx.fillStyle = cg;
        


        const seamAt = px => seamY + Math.sin(px * 0.031 + time * PW.seamSpeed) *
                                     (PW.seamAmp * (1 + stir));
        ctx.beginPath();
        ctx.moveTo(x, seamAt(0));
        for (let px = 0; px <= w; px += 8) ctx.lineTo(x + px, seamAt(px));
        ctx.lineTo(x + w, topY);
        for (let px = w; px >= 0; px -= 8) {
          ctx.lineTo(x + px, topY + surfY(px, time, PW, stir) + flowSurf(ws, x + px));
        }
        ctx.closePath(); ctx.fill();
        
        if (dirtyF > 0.001) {
          ctx.strokeStyle = cs.line || 'rgba(255,255,255,0.25)';
          ctx.globalAlpha = C.pool.seamAlpha;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, seamAt(0));
          for (let px = 0; px <= w; px += 8) ctx.lineTo(x + px, seamAt(px));
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      


      const FL = C.siteFx.flow;
      for (const wv of ws) {
        const k = wv.t / FL.sec;
        if (k >= 1) continue;
        const a = (1 - k) * FL.bandAlpha;
        ctx.strokeStyle = sk.band + a.toFixed(3) + ')';
        ctx.lineWidth = 2;
        for (let b = 0; b < FL.bands; b++) {
          const by = topY + (b + 1) * ((y + h) - topY) / (FL.bands + 1);
          const drift = wv.t * FL.bandSpeed * (b % 2 ? -1 : 1);
          ctx.beginPath();
          for (let px = 0; px <= w; px += 8) {
            const py = by + Math.sin((px + drift) * 0.05 + b * 1.7) * FL.bandAmp * (1 - k);
            px ? ctx.lineTo(x + px, py) : ctx.moveTo(x + px, py);
          }
          ctx.stroke();
        }
      }

      
      ctx.strokeStyle = sk.surface;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let px = 0; px <= w; px += 8) {
        const py = topY + Math.sin(px * 0.045 + time * 1.1) * 3.2 + flowSurf(ws, x + px);
        px ? ctx.lineTo(x + px, py) : ctx.moveTo(x + px, py);
      }
      ctx.stroke();

      ctx.restore();
    }

    
    if ((C.ui || {}).siteMark) IC.drawIcon(ctx, sk.markIcon, s.x, s.y + h * 0.30, 96,
      empty ? 'rgba(150,158,140,0.07)' : sk.mark, 1.1);

    







    
    const rv = s.rare && GG.sim.rockVariantById(s.rare);
    if (rv && rv.radiation && !empty) radiationFx(s, rv.radiation, x, y, w, h, frac, time, ws);
    else if (s.rare && !empty) rockShine(s, x, y, w, h, time, ws);
    
    if (t.radiation && !empty) radiationFx(s, t.radiation, x, y, w, h, frac, time, ws);

    
    const edge = sk.edge;
    const edge2 = sk.edge2;
    ctx.strokeStyle = empty ? 'rgba(150,158,140,0.28)'
      : 'rgba(' + edge + ',' + (0.34 + glow * 0.5).toFixed(3) + ')';
    ctx.lineWidth = 1.5 + glow;
    sitePath(s, box, ws); ctx.stroke();       

    

    collar('sites', s.type, x, y, w, h, 18, time);

    ctx.strokeStyle = empty ? 'rgba(150,158,140,0.4)' : 'rgba(' + edge2 + ',' + (0.6 + glow * 0.4).toFixed(3) + ')';
    ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const B = 26;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx2, sy2]) => {
      const cx2 = s.x + sx2 * (w / 2 - 2), cy2 = s.y + sy2 * (h / 2 - 2);
      ctx.beginPath();
      ctx.moveTo(cx2 - sx2 * B, cy2); ctx.lineTo(cx2 - sx2 * 6, cy2);
      ctx.moveTo(cx2, cy2 - sy2 * B); ctx.lineTo(cx2, cy2 - sy2 * 6);
      ctx.stroke();
    });
    ctx.lineCap = 'butt';

    
    const cs = S.slotSize();
    const taken = S.onSiteMachines(s);
    S.slotsOf(s).forEach(sl => {
      if (taken.some(c => Math.abs(c.x - sl.x) < 4 && Math.abs(c.y - sl.y) < 4)) return;
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = 'rgba(' + edge2 + ',' + (0.22 + glow * 0.4).toFixed(3) + ')';
      ctx.lineWidth = 1.4;
      roundRect(sl.x - cs.w / 2, sl.y - cs.h / 2, cs.w, cs.h, 12); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(' + edge2 + ',0.28)';
      ctx.font = '600 10px ' + FONT_UI;
      ctx.textAlign = 'center';
      
      
      ctx.fillText(GG.i18n.ins(sk.slotLabel), sl.x, sl.y + 4);
      ctx.textAlign = 'left';
    });

    



    
    const label = (s.rare === 'pluto' && C.ui.puRockChip && C.resources.pluto)
      ? C.resources.pluto.name.toUpperCase() : t.name.toUpperCase();
    let amount;
    


















    const doneFrac = grow ? GG.sim.growFrac(s) : 0;
    const done = grow && doneFrac >= 0.999;
    if (grow) {
      const cap = GG.sim.growCap(s), got = Math.max(0, s.grown || 0);
      const pct = (done ? 100 : Math.min(99, Math.floor(doneFrac * 100))) + '%';
      amount = t.readout === 'ci'    ? GG.util.fmt(got) + ' / ' + GG.util.fmt(cap)
             : t.readout === 'ciPct' ? GG.util.fmt(got) + ' / ' + GG.util.fmt(cap) + '  ' + pct
             : pct;
    




    } else amount = GG.i18n.ins(GG.util.kg(Math.max(0, s.reserve)));
    ctx.font = '600 11px ' + FONT_UI;
    const tw = ctx.measureText(label).width;
    ctx.font = '600 11px ' + FONT_MONO;
    const aw = ctx.measureText(amount).width;
    const cw = tw + aw + 46, ch = 26, cx = s.x - cw / 2, cy = y - ch / 2;
    ctx.fillStyle = 'rgba(14,20,15,0.94)';
    roundRect(cx, cy, cw, ch, 13); ctx.fill();
    ctx.strokeStyle = empty ? 'rgba(150,158,140,0.35)' : 'rgba(' + edge + ',0.45)';
    ctx.lineWidth = 1;
    roundRect(cx, cy, cw, ch, 13); ctx.stroke();

    IC.drawIcon(ctx, t.icon, cx + 16, cy + ch / 2, 14,
      empty ? '#9aa28e' : sk.chipIcon, 2);
    ctx.textBaseline = 'middle';
    ctx.font = '600 11px ' + FONT_UI;
    ctx.fillStyle = empty ? '#9aa28e' : sk.chipName;
    ctx.fillText(label, cx + 27, cy + ch / 2 + 0.5);
    ctx.font = '600 11px ' + FONT_MONO;
    ctx.fillStyle = empty ? '#e08a8a' : (done ? sk.chipIcon : sk.chipVal);
    ctx.fillText(empty ? GG.i18n.ins('EMPTY') : amount, cx + 27 + tw + 9, cy + ch / 2 + 0.5);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  



  
  




  function drawBand(b) {
    const x = Math.min(b.x0, b.x1), y = Math.min(b.y0, b.y1);
    const w = Math.abs(b.x1 - b.x0), h = Math.abs(b.y1 - b.y0);
    ctx.save();
    ctx.fillStyle = 'rgba(232,176,75,0.10)';
    ctx.strokeStyle = 'rgba(232,176,75,0.85)';
    ctx.lineWidth = 1.6 / S.g.camera.scale;      
    ctx.setLineDash([7 / S.g.camera.scale, 5 / S.g.camera.scale]);
    ctx.beginPath(); ctx.rect(x, y, w, h);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawLink(l, time, ui, hotWires) {
    const a = S.node(l.from), b = S.node(l.to);
    if (!a || !b || !S.here(a)) return;
    const p0 = R.portPos(a, 'out', l.fromPort), p1 = R.portPos(b, 'in', l.toPort);
    
    const sq = R.wireOrtho(l);

    





    if (hotWires && hotWires.has(l.id)) {
      const fx = C.tutorial.wireFx;
      const k = 0.5 - 0.5 * Math.cos(time * Math.PI * 2 / (fx.periodSec || 1.5));
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(' + fx.color + ', ' +
        (fx.alphaMin + (fx.alphaMax - fx.alphaMin) * k).toFixed(3) + ')';
      ctx.lineWidth = fx.widthMin + (fx.widthMax - fx.widthMin) * k;
      wirePath(p0, p1, sq);
      ctx.stroke();
      ctx.restore();
    }

    const hot = ui.hoverLink === l.id;
    const active = l.flow > 1e-6;
    const port = S.portsOf(a, 'out').find(p => p.id === l.fromPort);
    const col = port ? C.resources[port.res].color : '#7aa';
    

    const gl = C.wire.glow;
    const rres = port && gl && gl.enabled && active && !l.muted ? S.portRes(a, port, 'out') : null;
    const radio = !!(rres && C.resources[rres] && C.resources[rres].radioactive);
    const rcol = radio ? C.resources[rres].color : col;
    if (radio) {
      const k = 0.5 - 0.5 * Math.cos(time * Math.PI * 2 / (gl.periodSec || 2.4));
      const al = gl.alpha * (1 - gl.breathe + gl.breathe * k);
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(rcol, al.toFixed(3));
      ctx.lineWidth = gl.width;
      wirePath(p0, p1, sq); ctx.stroke();
      ctx.strokeStyle = rgba(rcol, (al * 1.5).toFixed(3));
      ctx.lineWidth = gl.width * 0.45;
      wirePath(p0, p1, sq); ctx.stroke();
      ctx.restore();
    }

    
    
    if (l.muted) ctx.setLineDash([6, 7]);
    ctx.strokeStyle = hot ? '#ff7a7a'
      : (l.muted ? 'rgba(150,170,192,0.4)' : (active ? col : 'rgba(120,150,175,0.26)'));
    ctx.lineWidth = hot ? 4 : 2.6;
    ctx.globalAlpha = active ? 0.9 : 1;
    

    ctx.lineJoin = 'round';
    wirePath(p0, p1, sq);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    if (l.muted) {
      const mid = R.wireAt(p0, p1, sq, 0.5);
      ctx.font = '700 9px ' + FONT_UI;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(180,200,220,0.7)';
      ctx.fillText(GG.i18n.ins('HELD WIRE'), mid.x, mid.y - 6);
      ctx.textAlign = 'left';
    }

    

    if (radio) {
      const len = gl.sweepLen || 0.2, N = 14;
      const head = ((time / (gl.sweepSec || 1.8)) % 1) * (1 + len);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i <= N; i++) {
        const tt = head - len * i / N;
        if (tt < 0 || tt > 1) continue;
        const f = 1 - i / N, pt = R.wireAt(p0, p1, sq, tt);
        ctx.fillStyle = rgba(rcol, (0.55 * f).toFixed(3));
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 2 + gl.width * 0.42 * f, 0, Math.PI * 2); ctx.fill();
        if (i < 3) {
          ctx.fillStyle = 'rgba(255,255,255,' + (0.7 * f).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.2 * f + 0.8, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (active) {
      for (let i = 0; i < 4; i++) {
        const t = (time * 0.32 + i / 4) % 1;
        const pt = R.wireAt(p0, p1, sq, t);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 1.4, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function drawPendingWire(ui) {
    const w = ui.wire;
    
    const p0 = w.back ? w.to : w.from, p1 = w.back ? w.from : w.to;
    const port = w.back ? w.toPort : w.fromPort;
    ctx.strokeStyle = w.valid ? C.resources[port.res].color : 'rgba(230,140,140,0.85)';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.setLineDash([7, 6]);
    

    wirePath(p0, p1, R.wireOrtho(w));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  





  function cardProngs(n, t, w) {
    if (!t.interestPct || n.agencySpot === false || !C.nodeTypes.hiringAgency ||
        !S.isUnlocked('hiringAgency')) return null;
    const as = S.sizeOf('hiringAgency');
    return { pw: (w - as.w) / 2 - 4, ph: as.h + C.nodeTypes.hiringAgency.autoHire.gap };
  }
  

  function cardPath(n, t, X, Y, W, H, R, cardW) {
    const P = cardProngs(n, t, cardW);
    if (!P) return roundRect(X, Y, W, H, R);
    const g = (W - cardW) / 2;
    const pw = P.pw + 2 * g, py = Y - P.ph, pr = Math.max(1, 7 + g), ri = Math.max(1, 6 - g);
    ctx.beginPath();
    ctx.moveTo(X, py + pr);
    ctx.arcTo(X, py, X + pw, py, pr);
    ctx.arcTo(X + pw, py, X + pw, Y, pr);
    ctx.arcTo(X + pw, Y, X + W - pw, Y, ri);
    ctx.arcTo(X + W - pw, Y, X + W - pw, py, ri);
    ctx.arcTo(X + W - pw, py, X + W, py, pr);
    ctx.arcTo(X + W, py, X + W, Y + H, pr);
    ctx.arcTo(X + W, Y + H, X, Y + H, R);
    ctx.arcTo(X, Y + H, X, py, R);
    ctx.closePath();
  }

  function drawNode(n, time, ui) {
    const L = rowLayout(n);
    const t = L.t, size = L.size;
    const x = n.x - size.w / 2, y = n.y - size.h / 2;
    const M = S.METRICS;
    const hovered = ui.hoverNode === n.id;
    const pulse = n.pulse || 0;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    cardPath(n, t, x + 3, y + 6, size.w, size.h, 12, size.w); ctx.fill();

    const grad = ctx.createLinearGradient(0, y, 0, y + size.h);
    grad.addColorStop(0, '#1a2331'); grad.addColorStop(1, '#121924');
    ctx.fillStyle = grad;
    cardPath(n, t, x, y, size.w, size.h, 12, size.w); ctx.fill();

    ctx.strokeStyle = hovered ? rgba(t.color, 0.75) : 'rgba(255,255,255,0.09)';
    ctx.lineWidth = hovered ? 1.8 : 1.2;
    cardPath(n, t, x, y, size.w, size.h, 12, size.w); ctx.stroke();

    
    
    if (GG.ui.isSelected(n.id)) {
      ctx.strokeStyle = 'rgba(232,176,75,0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -time * 14;
      cardPath(n, t, x - 4, y - 4, size.w + 8, size.h + 8, 14, size.w); ctx.stroke();
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
    }

    
    
    collar('machines', t.id, x, y, size.w, size.h, 12, time);

    if (pulse > 0) {
      ctx.strokeStyle = rgba(t.color, pulse * 0.85);
      ctx.lineWidth = 2 + pulse * 3;
      cardPath(n, t, x - pulse * 4, y - pulse * 4, size.w + pulse * 8, size.h + pulse * 8, 14, size.w); ctx.stroke();
    }

    ctx.save();
    cardPath(n, t, x, y, size.w, size.h, 12, size.w); ctx.clip();
    ctx.fillStyle = t.color;
    

    const prong = cardProngs(n, t, size.w);
    if (prong) {
      ctx.fillRect(x, y - prong.ph, size.w, 3);
      ctx.fillRect(x + prong.pw, y, size.w - 2 * prong.pw, 3);
    } else ctx.fillRect(x, y, size.w, 3);
    ctx.restore();

    
    const isz = 28, ix = x + 13, iy = y + 11;
    ctx.fillStyle = rgba(t.color, 0.13);
    roundRect(ix, iy, isz, isz, 8); ctx.fill();
    ctx.strokeStyle = rgba(t.color, 0.30); ctx.lineWidth = 1;
    roundRect(ix, iy, isz, isz, 8); ctx.stroke();
    IC.drawIcon(ctx, t.icon, ix + isz / 2, iy + isz / 2, 17, C.iconColor(t), 1.9);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#e2ecf6';
    















    


    const hp = R.headPill(n, t);
    const pillW = hp.w;
    



    const dgMark = (C.diagnose.card && C.diagnose.cardMark && !C.diagnose.cardWord &&
                    !GG.sim.muted(n)) ? hp.dg : null;
    const markW = dgMark ? 17 : 0;
    const nameW = size.w - 50 - 12 - (pillW ? pillW + 8 : 0) - markW;
    const shownName = GG.sim.nameOf ? GG.sim.nameOf(n) : t.name;   
    fitNameFont(shownName, nameW);      
    const nameTxt = clipText(shownName, nameW);
    ctx.fillText(nameTxt, x + 50, y + 29);

    



    if (dgMark) {
      const mx = x + 50 + Math.min(ctx.measureText(nameTxt).width, nameW) + 6, my = y + 22;
      const col = dgMark.level === 'stop' ? C.diagnose.stopColor : C.diagnose.slowColor;
      ctx.fillStyle = rgba(col, 0.95);
      ctx.beginPath();
      ctx.moveTo(mx + 5.5, my - 5);
      ctx.lineTo(mx + 11, my + 4.5);
      ctx.lineTo(mx, my + 4.5);
      ctx.closePath(); ctx.fill();
      
      ctx.fillStyle = '#151d29';
      ctx.fillRect(mx + 4.8, my - 1.6, 1.4, 3.4);
      ctx.fillRect(mx + 4.8, my + 2.6, 1.4, 1.4);
    }

    








    

    const dg = hp.dg;
    const pillHot = ui && ui.hoverFlip === n.id;
    if (hp.word) {
      drawTag(x, y, size, GG.i18n.ins(dg.word),
              dg.level === 'stop' ? C.diagnose.stopColor : C.diagnose.slowColor, 0,
              hp, pillHot);
    } else {
    



    
    if (hp.pick === 'solar') drawSolarPhase(n, x, y, size, hp, pillHot);
    



    if (hp.pick === 'fert') {
      const need = GG.sim.recipeNeed(n, 'fert');
      


      drawTag(x, y, size, '×' + GG.util.fmt(GG.sim.plantMul(n), 1), '#b98a4a',
              GG.sim.plantMaxed(n) ? 1 : (need > 0 ? (n.buf.fert || 0) / need : 0),
              hp, pillHot);
    }
    


    if (hp.pick === 'filter') {
      const held = n.buf.filter || 0;
      drawTag(x, y, size, GG.util.fmt(held, 2) + ' kg', t.color, held / t.buffer,
              hp, pillHot);
    }
    




    if (hp.pick === 'power') {
      drawTag(x, y, size, powerTag(n), C.resources[t.powerUp.res].color,
              GG.sim.powerFrac(n), hp, pillHot);
    }
    




    if (hp.pick === 'drain') {
      drawTag(x, y, size, ciDrainTag(n), C.currencies.ci.color,
              n.ciShare === undefined ? 1 : n.ciShare, hp, pillHot);
    }
    }   

    





    if (dg && C.diagnose.cardFrame) {
      const col = dg.level === 'stop' ? C.diagnose.stopColor : C.diagnose.slowColor;
      ctx.save();
      cardPath(n, t, x, y, size.w, size.h, 12, size.w); ctx.clip();   
      ctx.fillStyle = rgba(col, C.diagnose.tintAlpha);
      ctx.fillRect(x, y - 400, size.w, size.h + 400);
      ctx.restore();
      ctx.strokeStyle = rgba(col, C.diagnose.frameAlpha);
      ctx.lineWidth = dg.level === 'stop' ? 2 : 1.4;
      cardPath(n, t, x + 1, y + 1, size.w - 2, size.h - 2, 11, size.w); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 12, y + M.HEAD - 3.5); ctx.lineTo(x + size.w - 12, y + M.HEAD - 3.5); ctx.stroke();

    
    
    




    const bands = S.capRows(t, n);
    if (bands > 0) {
      


      warnBand = (hp.onBand && dg)
        ? { word: dg.word,
            col: dg.level === 'stop' ? C.diagnose.stopColor : C.diagnose.slowColor }
        : null;
      const bandY = i => y + M.HEAD + 4 + i * M.CAP_ROW;
      if (t.recruit) {
        
        band(x, bandY(0), size.w, 'WORKFORCE', n.wfPool || 0,
             GG.sim.recruitNeed(n, 'wf'), 'WF', C.resources.wf.color);
        band(x, bandY(1), size.w, 'ENERGY', n.kwPool || 0,
             GG.sim.recruitNeed(n, 'kw'), 'KW', C.resources.energy.color);
      } else if (t.print) {
        


        const pl = GG.sim.printPlan(n), P = t.print;
        const needP = pl ? pl.paper : P.paper, needM = pl ? pl.kg : 0;
        const held = Math.min(needP, n.buf.paper || 0) +
                     (pl ? Math.min(needM, n.buf[pl.res] || 0) : 0);
        band(x, bandY(0), size.w, 'PARTS', held, needP + needM, 'kg', t.color);
        band(x, bandY(1), size.w, 'PRINTING', n.kwPool || 0,
             pl ? pl.kw : P.kw, 'KW', C.resources.energy.color);
      } else if (t.recipe) {
        
        
        
        const R = t.recipe, keys = Object.keys(R.inputs);
        



        if (R.wf || R.kw) {
          let held = 0, need = 0;
          keys.forEach(function (k) {
            const want = GG.sim.recipeNeed(n, k);
            need += want; held += Math.min(want, n.buf[k] || 0);
          });
          band(x, bandY(0), size.w, 'PARTS', held, need, 'kg', t.color);
          if (bands > 1) {
            if (R.wf) {
              band(x, bandY(1), size.w, 'ASSEMBLY',
                   n.wfPool || 0, GG.sim.recipeWf(n), 'WF', C.resources.wf.color);
            } else {
              band(x, bandY(1), size.w, 'PRESSING',
                   n.kwPool || 0, GG.sim.recipeKw(n), 'KW', C.resources.energy.color);
            }
          }
        } else {
          keys.slice(0, bands).forEach(function (k, i) {
            band(x, bandY(i), size.w, C.resources[k].name.toUpperCase(),
                 n.buf[k] || 0, GG.sim.recipeNeed(n, k), 'kg', C.resources[k].color);
          });
        }
      } else if (t.lanes) {
        

        t.lanes.slice(0, bands).forEach(function (L, i) {
          const gr = n.lg && n.lg[L];
          const res = gr ? C.resources[gr] : null;
          band(x, bandY(i), size.w, res ? res.name.toUpperCase() : 'SHELF ' + (i + 1),
               GG.sim.laneHeld(n, L), GG.sim.laneCap(n), 'kg', res ? res.color : t.color);
        });
      } else if (t.collectB) {
        



        const sum = o => { let v = 0; for (const k in (o || {})) v += o[k] || 0; return v; };
        band(x, bandY(0), size.w, 'SELLING', sum(n.buf),
             GG.sim.stat(t.id, 'buffer'), 'kg', C.currencies[t.collect.cur].color);
        band(x, bandY(1), size.w, 'BURNING', sum(n.bufB),
             GG.sim.stat(t.id, 'bufferB'), 'kg', C.currencies[t.collectB.cur].color);
      } else {
        













        
















        






        const held = GG.sim.heldOf(n);
        const waiting = GG.sim.outHeldOf(n);
        const row = S.outletRow(t) && bands > 1;
        const idle = (n.rates.work || 0) <= (C.ui.outletBandWorkEps || 0);
        if (!row && C.ui.outletBand !== false && idle && held <= 1e-6 && waiting > 1e-6) {
          band(x, bandY(0), size.w, 'WAITING', waiting, GG.sim.outCapOf(n), 'kg', t.color);
        } else {
          band(x, bandY(0), size.w, t.store ? 'CHARGE' : 'CAPACITY',
               held, GG.sim.capOf(n), GG.sim.capUnit(n), t.color);
          if (row) band(x, bandY(1), size.w, 'OUTLET', waiting, GG.sim.outCapOf(n), 'kg',
                        (C.resources.rtrash || t).color || t.color);
          












          else if (S.powerUpRow(t, n)) {
            const pu = t.powerUp, res = C.resources[pu.res] || {};
            band(x, bandY(1), size.w, (res.name || pu.res).toUpperCase(),
                 n.buf[pu.res] || 0, GG.sim.powerLoad(n), 'kg', res.color || t.color);
          }
        }
      }
    }
    


    warnBand = null;

    
    L.rows.forEach(r => drawRow(n, t, r, x, size));

    




    if (t.cardGroups && C.ui.cardGroups !== false && L.rows.length > 1) {
      const gOf = r => (r.kind === 'vout' ? r.v.group : r.port.group);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.10)';
      ctx.lineWidth = 1;
      for (let i = 1; i < L.rows.length; i++) {
        if (gOf(L.rows[i]) === gOf(L.rows[i - 1])) continue;
        const my = Math.round((L.rows[i - 1].cy + L.rows[i].cy) / 2) + 0.5;
        ctx.beginPath();
        ctx.moveTo(n.x - size.w / 2 + 14, my);
        ctx.lineTo(n.x + size.w / 2 - 14, my);
        ctx.stroke();
      }
      ctx.restore();
    }

    
    if (t.collect) drawCollect(n, t, ui);
    else if (t.action) drawAction(n, t, ui);

    
    const FS = C.ui.fullSocket;
    L.rows.forEach(r => {
      if (r.kind === 'vout') return;
      const px = n.x + size.w / 2 * R.portFace(n, r.kind);
      const hot = ui.hoverPort && ui.hoverPort.node.id === n.id &&
        ui.hoverPort.port.id === r.port.id && ui.hoverPort.dir === r.kind;
      

      const col = C.resources[S.portRes(n, r.port, r.kind)].color;
      const wired = r.kind === 'out'
        ? S.linksFrom(n.id).some(l => l.fromPort === r.port.id)
        : !!S.linkInto(n.id, r.port.id);
      const sz = hot ? 13 : 11;
      ctx.fillStyle = wired ? col : '#0e141c';
      roundRect(px - sz / 2, r.cy - sz / 2, sz, sz, 3.5); ctx.fill();
      ctx.strokeStyle = hot ? '#ffffff' : col;
      ctx.lineWidth = 2;
      roundRect(px - sz / 2, r.cy - sz / 2, sz, sz, 3.5); ctx.stroke();
      
      if (FS && FS.enabled && r.kind === 'out' && t.outBuffer && !t.holdLock &&
          (C.resources[r.port.res] || {}).flow === 'material' &&
          (n.obuf[r.port.id] || 0) >= (GG.sim.stat(t.id, 'outBuffer') || t.outBuffer) - GG.util.EPS) {
        const o = sz + FS.pad * 2;
        ctx.strokeStyle = FS.color;
        ctx.lineWidth = FS.width;
        roundRect(px - o / 2, r.cy - o / 2, o, o, 5); ctx.stroke();
      }
    });
  }

  

  






  let warnBand = null;

  function band(x, cy, w, label, held, cap, unit, color) {
    const pct = cap > 0 ? Math.min(1, held / cap) : 0;
    const full = pct >= 0.999;
    

    const warn = warnBand; warnBand = null;
    if (warn && C.diagnose.bandTint > 0) {
      ctx.fillStyle = rgba(warn.col, C.diagnose.bandTint);
      

      roundRect(x + 6, cy - 2, w - 12, S.METRICS.CAP_ROW - 2, 5); ctx.fill();
    }
    



    const text = GG.i18n.ins(warn ? warn.word : label);
    const val = GG.i18n.ins(GG.util.fmt(held, 2) + ' / ' + GG.util.fmt(cap) + ' ' + unit);
    









    ctx.font = '11px ' + FONT_MONO;
    const vw = warn ? ctx.measureText(val).width : 0;
    ctx.font = (warn ? '700 9.5px ' : '600 9.5px ') + FONT_UI;
    const showVal = !warn || ctx.measureText(text).width <= w - 26 - vw - 8;
    ctx.textAlign = 'left';
    ctx.fillStyle = warn ? warn.col : 'rgba(150,170,192,0.8)';
    ctx.fillText(clipText(text, w - 26 - (showVal ? vw + 8 : 0)), x + 13, cy + 8);
    if (showVal) {
      ctx.textAlign = 'right';
      ctx.font = '11px ' + FONT_MONO;
      ctx.fillStyle = full ? '#e8b04b' : 'rgba(220,232,244,0.9)';
      
      ctx.fillText(val, x + w - 13, cy + 8);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    roundRect(x + 13, cy + 12, w - 26, 4, 2); ctx.fill();
    ctx.fillStyle = full ? '#e8b04b' : color;
    roundRect(x + 13, cy + 12, Math.max(2, (w - 26) * pct), 4, 2); ctx.fill();
  }

  function drawRow(n, t, r, x, size) {
    const U = GG.util;
    let label, value, col, key;

    if (r.kind === 'vout') {
      const cur = C.currencies[r.v.cur];
      key = 'v:' + (r.vi || 0);
      label = (r.n > 1 ? 'OUT ' + (r.idx + 1) : 'OUT') + '  ' + r.v.label;
      value = U.fmt(n.rates[key] || 0) + ' ' + cur.rate;
      








      if ((C.ui || {}).gemEta !== false && (t.recipe || {}).gem) {
        const sec = GG.sim.gemEta(n);
        value = sec === null ? '—'
          : GG.i18n.t('ui.gemIn').replace('%n', GG.sim.gemYield(n))
              .replace('%c', cur.short).replace('%t', GG.i18n.dur(sec, true));
      }
      col = cur.color;
      


      if (t.print) {
        const pl = GG.sim.printPlan(n), pb = pl && pl.boost && GG.sim.boostById(pl.boost);
        if (pb) { label = 'OUT  ' + pb.name; col = pb.color || col; }
        const sec = GG.sim.printEta(n);
        value = sec === null ? '—'
          : pb ? GG.i18n.t('ui.printIn').replace('%t', GG.i18n.dur(sec, true))
               : GG.i18n.t('ui.gemIn').replace('%n', pl.gem)
                   .replace('%c', cur.short).replace('%t', GG.i18n.dur(sec, true));
      }
    } else {
      
      
      const res = C.resources[S.portRes(n, r.port, r.kind)];
      key = r.kind + ':' + r.port.id;
      const tag = r.kind === 'in' ? 'IN' : 'OUT';
      label = (r.n > 1 ? tag + ' ' + (r.idx + 1) : tag) + '  ' +
              S.portLabel(n, r.port, r.kind);
      value = U.fmt(n.rates[key] || 0) + ' ' + res.rate;
      
      if (r.kind === 'out' && GG.sim.showsSupply(n, r.port))
        value = U.fmt(n.rates[key] || 0) + ' / ' +
                U.fmt(GG.sim.supplyAt(n, r.port.id)) + ' ' + res.rate;
      col = res.color;
    }

    value = GG.i18n.ins(value);        
    const active = (n.rates[key] || 0) > 1e-6 ||
      (r.kind === 'out' && GG.sim.showsSupply(n, r.port) && GG.sim.supplyAt(n, r.port.id) > 1e-6);

    











    














    

    let valPx = 12.5;
    const twin = r.kind === 'out' && r.port && GG.sim.showsSupply(n, r.port);
    ctx.font = '600 9.5px ' + FONT_UI;
    const labW = ctx.measureText(label).width;
    ctx.font = '600 12.5px ' + FONT_MONO;
    let valW = ctx.measureText(value).width;
    while (twin && valPx > 9.5 && labW > size.w - 26 - valW - 8) {
      valPx -= 1;
      ctx.font = '600 ' + valPx + 'px ' + FONT_MONO;
      valW = ctx.measureText(value).width;
    }
    ctx.font = '600 9.5px ' + FONT_UI;
    ctx.textAlign = 'left';
    ctx.fillStyle = active ? 'rgba(190,208,226,0.85)' : 'rgba(150,170,192,0.5)';
    ctx.fillText(clipText(label, size.w - 26 - valW - 8), x + 13, r.cy + 3.5);

    ctx.font = '600 ' + valPx + 'px ' + FONT_MONO;
    ctx.textAlign = 'right';
    ctx.fillStyle = active ? col : 'rgba(150,170,192,0.4)';
    ctx.fillText(value, x + size.w - 13, r.cy + 3.5);
    ctx.textAlign = 'left';
  }

  





  function btnPath(r, lw) {
    const i = lw / 2;
    roundRect(r.x + i, r.y + i, r.w - lw, r.h - lw, Math.max(0, 6 - i));
  }

  

  function drawCollect(n, t, ui) {
    for (const side of GG.sim.sides(t)) drawTill(n, t, ui, side);
  }

  function drawTill(n, t, ui, side) {
    const r = R.collectRect(n, side);
    const def = GG.sim.sideDef(t, side);
    const split = !!t.collectB;
    const cur = C.currencies[def.cur];
    const till = (side === 'B' ? n.tillB : n.till) || 0;
    const cap = GG.sim.collectCap(t, n, side);
    const pct = Math.min(1, till / cap);
    const full = pct >= 0.999;
    const ready = till > 1e-6;
    const hot = ui.hoverCollect === n.id && (ui.hoverCollectSide || undefined) === side;
    const lw = hot ? 2 : 1.2;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();

    
    ctx.save();
    btnPath(r, lw); ctx.clip();
    ctx.fillStyle = full ? 'rgba(232,176,75,0.40)' : rgba(cur.color, 0.32);
    ctx.fillRect(r.x, r.y, r.w * pct, r.h);
    ctx.restore();

    ctx.strokeStyle = full ? '#e8b04b' : (ready ? rgba(cur.color, hot ? 1 : 0.75) : 'rgba(255,255,255,0.12)');
    ctx.lineWidth = lw;
    btnPath(r, lw); ctx.stroke();

    ctx.font = '700 10.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = ready ? '#f2e9ff' : 'rgba(190,208,226,0.45)';
    const cid = def.cur, verb = def.label || 'COLLECT';
    




    const txt = split
      ? (full ? GG.i18n.ins('FULL') + ' ' + GG.util.cur(cid, till, 0)
              : verb + '  ' + GG.util.cur(cid, till, 0))
      : (full ? GG.i18n.ins('FULL') + ' — ' + verb + ' ' + GG.util.cur(cid, till, 2)
              : verb + '  ' + GG.util.curRange(cid, till, cap, 2));
    




    ctx.save();
    if (split) { btnPath(r, lw); ctx.clip(); }
    ctx.fillText(GG.i18n.ins(txt), r.x + r.w / 2, r.y + r.h / 2 + 0.5);
    ctx.restore();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  


  function drawLicence(n, t, ui) {
    const r = R.collectRect(n);
    const hot = ui.hoverCollect === n.id;
    const left = GG.sim.licenceLeft(n), on = left > 0;
    
    
    const dry = !on && !((n.buf.oil || 0) > 1e-9);
    const pct = Math.min(1, left / t.licence.sec);
    const lw = hot ? 2 : 1.2;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();
    ctx.save();
    btnPath(r, lw); ctx.clip();
    ctx.fillStyle = rgba(t.color, 0.32);
    ctx.fillRect(r.x, r.y, r.w * pct, r.h);
    ctx.restore();

    ctx.strokeStyle = dry ? 'rgba(255,255,255,0.12)'
      : (on ? rgba(t.color, hot ? 1 : 0.8) : rgba('#62d4e3', hot ? 1 : 0.5));
    ctx.lineWidth = lw;
    btnPath(r, lw); ctx.stroke();

    ctx.font = '700 10.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = dry ? 'rgba(190,208,226,0.45)' : (on ? '#ffe9cc' : '#cfe9ee');
    const mm = Math.floor(left / 60), ss = Math.floor(left % 60);
    const txt = on
      ? GG.i18n.ins('RUNNING') + '  ' + mm + ':' + String(ss).padStart(2, '0')
      : (dry ? GG.i18n.ins('NO OIL IN THE TANK')
        : t.action.label + '  ' + GG.util.cur(t.licence.cur, GG.sim.licenceCost(t)));
    ctx.fillText(GG.i18n.ins(txt), r.x + r.w / 2, r.y + r.h / 2 + 0.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  

  function drawFission(n, t, ui) {
    const r = R.collectRect(n);
    const hot = ui.hoverCollect === n.id;
    const F = GG.sim.reactorFuel(n), left = GG.sim.licenceLeft(n), on = left > 0;   
    const dry = !on && !((n.buf[F.res || 'rod'] || 0) + 1e-9 >= F.kg);
    const pct = Math.min(1, left / F.sec);
    const lw = hot ? 2 : 1.2;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();
    ctx.save();
    btnPath(r, lw); ctx.clip();
    ctx.fillStyle = rgba(t.color, 0.32);
    ctx.fillRect(r.x, r.y, r.w * pct, r.h);
    ctx.restore();

    
    const fuelRes = (GG.sim.reactorFuel ? GG.sim.reactorFuel(n).res : 'rod') || 'rod';
    const fuelCol = (C.resources[fuelRes] || C.resources.rod).color;
    ctx.strokeStyle = dry ? 'rgba(255,255,255,0.12)'
      : (on ? rgba(t.color, hot ? 1 : 0.8) : rgba(fuelCol, hot ? 1 : 0.6));
    ctx.lineWidth = lw;
    btnPath(r, lw); ctx.stroke();

    ctx.font = '700 10.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = dry ? 'rgba(190,208,226,0.45)' : (on ? '#fff3cc' : '#d6f7ee');
    const mm = Math.floor(left / 60), ss = Math.floor(left % 60);
    const txt = on
      ? GG.i18n.ins('RUNNING') + '  ' + mm + ':' + String(ss).padStart(2, '0')
      : (dry ? GG.i18n.ins(fuelRes === 'rod' ? 'NO RODS' : 'NO PELLETS') : GG.i18n.ins(t.action.label));
    ctx.fillText(txt, r.x + r.w / 2, r.y + r.h / 2 + 0.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  


  function drawLaunch(n, t, ui) {
    const r = R.collectRect(n);
    const hot = ui.hoverCollect === n.id;
    const st = GG.sim.rocketState(n), F = t.rocket.flight;
    const ready = st.state === 'ready', flying = st.state === 'flying';
    const lw = hot ? 2 : 1.2;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();
    ctx.save();
    btnPath(r, lw); ctx.clip();
    ctx.fillStyle = rgba(flying ? '#ff9f5a' : t.color, 0.3);
    ctx.fillRect(r.x, r.y, r.w * Math.min(1, st.pct), r.h);
    ctx.restore();

    ctx.strokeStyle = ready ? rgba(t.color, hot ? 1 : 0.85)
      : (flying ? rgba('#ff9f5a', 0.8) : 'rgba(255,255,255,0.14)');
    ctx.lineWidth = lw;
    btnPath(r, lw); ctx.stroke();

    ctx.font = '700 10.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = ready ? '#ffe3f0' : (flying ? '#fff0e0' : 'rgba(190,208,226,0.7)');
    const U = GG.util, I = GG.i18n;
    let txt;
    if (flying) {
      const mm = Math.floor(st.left / 60), ss = Math.floor(st.left % 60);
      txt = I.ins('IN FLIGHT') + '  ' + mm + ':' + String(ss).padStart(2, '0');
    } else if (st.state === 'building') txt = I.ins('BUILDING ' + Math.floor(st.pct * 100) + '%');
    else if (st.state === 'hold') txt = I.ins('EMPTY THE HOLD');
    else if (st.state === 'fuel') txt = I.ins('FUEL ' + U.small(st.have) + ' / ' + st.need + ' kg');
    else if (st.state === 'crew') txt = I.ins('CREW ' + Math.floor(st.have) + ' / ' + F.wf + ' WF');
    else txt = I.ins(t.action.label);
    ctx.fillText(txt, r.x + r.w / 2, r.y + r.h / 2 + 0.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  




  function drawPull(n, t, ui) {
    const r = R.collectRect(n);
    const hot = ui.hoverCollect === n.id;
    const cost = GG.sim.beaconCost(t), have = n.bank || 0;
    const ready = have >= cost - 1e-9;
    
    const block = ready && GG.sim.beaconBlocked ? GG.sim.beaconBlocked(n) : false;
    const full = !!block;
    const pct = cost > 0 ? Math.min(1, have / cost) : 0;
    const lw = hot ? 2 : 1.2;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();
    ctx.save();
    btnPath(r, lw); ctx.clip();
    ctx.fillStyle = rgba(t.color, ready ? 0.34 : 0.22);
    ctx.fillRect(r.x, r.y, r.w * pct, r.h);
    ctx.restore();

    ctx.strokeStyle = (ready && !full) ? rgba(t.color, hot ? 1 : 0.78) : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = lw;
    btnPath(r, lw); ctx.stroke();

    ctx.font = '700 10.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = (ready && !full) ? '#eaf3ff' : 'rgba(190,208,226,0.45)';
    const txt = full ? GG.i18n.ins(typeof block === 'string' ? block : 'SKY FULL')
      : ready ? t.action.label
      : GG.i18n.ins(GG.util.small(have) + ' / ' + GG.util.small(cost) + ' KW');
    ctx.fillText(GG.i18n.ins(txt), r.x + r.w / 2, r.y + r.h / 2 + 0.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  
  function drawAction(n, t, ui) {
    if (t.action.kind === 'licence') return drawLicence(n, t, ui);
    if (t.action.kind === 'fission') return drawFission(n, t, ui);
    if (t.action.kind === 'launch') return drawLaunch(n, t, ui);
    if (t.action.kind === 'pull') return drawPull(n, t, ui);
    const r = R.collectRect(n);
    const hot = ui.hoverCollect === n.id;
    const crew = GG.sim.crewOf(n), room = GG.sim.hireRoom(n);
    const max = GG.sim.hireMax(n);          
    const pct = crew / max;
    const lw = hot ? 2 : 1.2;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    btnPath(r, lw); ctx.fill();
    ctx.save();
    btnPath(r, lw); ctx.clip();
    ctx.fillStyle = rgba(t.color, 0.30);
    ctx.fillRect(r.x, r.y, r.w * pct, r.h);
    ctx.restore();

    ctx.strokeStyle = room > 0 ? rgba(t.color, hot ? 1 : 0.75) : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = lw;
    btnPath(r, lw); ctx.stroke();

    ctx.font = '700 10.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = room > 0 ? '#eaf3ff' : 'rgba(190,208,226,0.45)';
    const txt = room > 0
      ? t.action.label + '  ' + GG.util.cur(t.hire.currency, GG.sim.hirePrice(n, 1)) +
        '   ' + crew + '/' + max
      : GG.i18n.ins('FULL CREW') + '  ' + crew + '/' + max + '  ' +
        Math.ceil(GG.sim.crewLeft(n)) + 's';
    ctx.fillText(GG.i18n.ins(txt), r.x + r.w / 2, r.y + r.h / 2 + 0.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  

  























  function fitNameFont(text, budget) {
    const F = (C.ui && C.ui.nameFit) || {};
    const steps = (F.enabled !== false && F.steps && F.steps.length) ? F.steps : [13.5];
    for (let i = 0; i < steps.length; i++) {
      ctx.font = '600 ' + steps[i] + 'px ' + FONT_DISPLAY;
      if (ctx.measureText(text).width <= budget) return steps[i];
    }
    ctx.font = '600 ' + steps[0] + 'px ' + FONT_DISPLAY;
    return steps[0];
  }

  function clipText(s, max) {
    if (max <= 0) return '';
    if (ctx.measureText(s).width <= max) return s;
    let out = s;
    while (out.length > 1 && ctx.measureText(out + '…').width > max) out = out.slice(0, -1);
    return out.replace(/\s+$/, '') + '…';
  }

  






  















  function stateKinds(n, t) {
    const out = [];
    if (t.id === 'solarPanel') out.push('solar');
    if (t.recipe && t.recipe.boost && S.portsOf(n, 'in').some(p => p.id === 'fert'))
      out.push('fert');
    


    if (t.ciPerKg && t.buffer) out.push('filter');
    if (t.powerUp && GG.sim.powerShow(n)) out.push('power');
    if (t.ciPerKw && (n.ciDrain || 0) < 0) out.push('drain');
    return out;
  }

  







  function stateWidth(n, t, kind, pad) {
    pad = pad || 0;
    if (kind === 'solar')  return solarPill(n, pad).w;              
    if (kind === 'fert')   return tagW('×' + GG.util.fmt(GG.sim.plantMul(n), 1)) + pad;
    if (kind === 'filter') return tagW(GG.util.fmt(n.buf.filter || 0, 2) + ' kg') + pad;
    if (kind === 'power')  return tagW(powerTag(n)) + pad;
    if (kind === 'drain')  return tagW(ciDrainTag(n)) + pad;
    return 0;
  }

  
















  R.headPill = function (n, t) {
    const font = ctx.font;
    const dg = (C.diagnose.card && !GG.sim.muted(n)) ? GG.sim.diagnose(n) : null;
    const kinds = stateKinds(n, t);
    




    const onBand = !!(C.diagnose.cardBand && S.capRows(t, n) > 0);
    const canWord = !!(dg && C.diagnose.cardWord && !onBand);
    const F = C.diagnose.pillFlip || {};
    








    const cands = (canWord ? ['word'] : []).concat(kinds);
    const flip = !!(cands.length > 1 && F.enabled);
    const idx = flip ? ((n.pillAlt | 0) % cands.length + cands.length) % cands.length : 0;
    const pick = cands[idx] || null;
    const word = pick === 'word';
    







    const pad = flip ? (F.pad || 0) : 0;
    const out = { dg: dg, word: word, flip: flip, pad: pad,
                  onBand: onBand, kinds: kinds, cands: cands.length,
                  pick: word ? null : pick,
                  w: word ? tagW(GG.i18n.ins(dg.word)) + pad
                          : (pick ? stateWidth(n, t, pick, pad) : 0) };
    ctx.font = font;
    return out;
  };

  




  

  function ciDrainTag(n) {
    return GG.util.fmt(n.ciDrain || 0) + ' ' + C.currencies.ci.rate;
  }

  

  function powerTag(n) {
    const p = S.type(n).powerUp;
    










    if (p && p.solarShare) {
      return GG.i18n.ins('+' + GG.util.fmt(GG.sim.panelKw(n), 1) + ' ' +
                         C.resources.energy.rate);
    }
    return '×' + GG.util.fmt(GG.sim.powerMul(n), 2);
  }

  















  function drawPillFlip(n, hp, ui) {
    const r = R.pillFlipRect(n);
    if (!r) return;
    const hot = ui && ui.hoverFlip === n.id;
    const col = hp.word
      ? (hp.dg.level === 'stop' ? C.diagnose.stopColor : C.diagnose.slowColor)
      : '#9fb0d6';
    ctx.fillStyle = rgba(col, hot ? 0.26 : 0.13);
    roundRect(r.x, r.y, r.w, r.h, 5); ctx.fill();
    ctx.strokeStyle = rgba(col, hot ? 0.85 : 0.40); ctx.lineWidth = 1;
    roundRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 4.5); ctx.stroke();
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    ctx.strokeStyle = rgba(col, hot ? 1 : 0.72);
    ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 1.9, cy - 3.3);
    ctx.lineTo(cx + 1.9, cy);
    ctx.lineTo(cx - 1.9, cy + 3.3);
    ctx.stroke();
    ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  }

  




  function tagW(text) {
    ctx.font = '700 10px ' + FONT_MONO;
    return Math.max(30, ctx.measureText(text).width + 14);
  }
  



  function drawTag(x, y, size, text, color, frac, hp, hot) {
    const pad = hp && hp.flip ? hp.pad : 0;
    const w = tagW(text) + pad, h = 16;
    const px = x + size.w - w - 12, py = y + 13;
    ctx.fillStyle = rgba(color, hot ? 0.28 : 0.18);
    roundRect(px, py, w, h, 8); ctx.fill();
    if (frac > 0) {
      ctx.save();
      roundRect(px, py, w, h, 8); ctx.clip();
      ctx.fillStyle = rgba(color, 0.30);
      ctx.fillRect(px, py, w * GG.util.clamp(frac, 0, 1), h);
      ctx.restore();
    }
    ctx.strokeStyle = rgba(color, hot ? 0.9 : 0.5); ctx.lineWidth = 1;
    roundRect(px + 0.5, py + 0.5, w - 1, h - 1, 7.5); ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, px + (w - pad) / 2, py + h / 2 + 0.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (pad) drawChevron(px + w - pad / 2, py + h / 2, color, hot);
  }

  





  function drawChevron(cx, cy, color, hot) {
    ctx.strokeStyle = rgba(color, hot ? 1 : 0.7);
    ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 1.7, cy - 3.1);
    ctx.lineTo(cx + 1.7, cy);
    ctx.lineTo(cx - 1.7, cy + 3.1);
    ctx.stroke();
    ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  }

  
  




  function solarPill(n, pad) {
    const ph = GG.sim.solarPhase(n);
    









    const txt = GG.i18n.ins((ph.on ? 'DAY ' : 'NIGHT ') + Math.ceil(ph.remaining) + 's');
    ctx.font = '700 9px ' + FONT_UI;
    









    const right = (pad || 0) ? 0 : 9;
    return { ph: ph, txt: txt,
             w: Math.max(58, 19 + ctx.measureText(txt).width + right) + (pad || 0) };
  }

  function drawSolarPhase(n, x, y, size, hp, hot) {
    const pad = hp && hp.flip ? hp.pad : 0;
    const pill = solarPill(n, pad), ph = pill.ph, txt = pill.txt;
    const w = pill.w, h = 16, px = x + size.w - w - 12, py = y + 13;
    ctx.fillStyle = ph.on ? 'rgba(240,192,74,0.18)' : 'rgba(90,110,150,0.20)';
    roundRect(px, py, w, h, 8); ctx.fill();
    ctx.strokeStyle = ph.on ? 'rgba(240,192,74,' + (hot ? 0.9 : 0.5) + ')'
                            : 'rgba(120,140,180,' + (hot ? 0.85 : 0.4) + ')';
    ctx.lineWidth = 1; roundRect(px + 0.5, py + 0.5, w - 1, h - 1, 7.5); ctx.stroke();
    
    ctx.save(); roundRect(px, py, w, h, 8); ctx.clip();
    ctx.fillStyle = ph.on ? 'rgba(240,192,74,0.22)' : 'rgba(120,140,180,0.18)';
    ctx.fillRect(px, py, w * GG.util.clamp(ph.frac, 0, 1), h);
    ctx.restore();
    IC.drawIcon(ctx, ph.on ? 'solar' : 'battery', px + 10, py + h / 2, 11,
      ph.on ? '#f0c04a' : '#9fb0d6', 1.8);
    ctx.font = '700 9px ' + FONT_UI;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = ph.on ? '#f0c04a' : '#9fb0d6';
    ctx.fillText(txt, px + 19, py + h / 2 + 0.5);
    ctx.textBaseline = 'alphabetic';
    if (pad) drawChevron(px + w - pad / 2, py + h / 2,
                         ph.on ? '#f0c04a' : '#9fb0d6', hot);
  }

  

  function drawBeaconRange(ui) {
    if (!GG.sim.beaconLocal || !GG.sim.beaconLocal()) return;
    const list = [];
    S.machinesHere().forEach(function (n) {
      const t = C.nodeTypes[n.type];
      if (t.pullCost && GG.ui.isSelected(n.id)) list.push({ x: n.x, y: n.y, t: t });
    });
    const gh = ui.ghost;
    if (gh && !gh.bp && !gh.mv && gh.type && C.nodeTypes[gh.type].pullCost)
      list.push({ x: gh.x, y: gh.y, t: C.nodeTypes[gh.type] });
    list.forEach(function (o) {
      const r = GG.sim.beaconRange(o.t);
      if (!(r > 0)) return;
      ctx.save();
      ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(o.t.color, 0.05); ctx.fill();
      ctx.strokeStyle = rgba(o.t.color, 0.6); ctx.lineWidth = 2;
      ctx.setLineDash([16, 12]); ctx.stroke();
      ctx.restore();
    });
  }

  function drawGhost(ui) {
    if (ui.ghost.bp) { drawBlueprintGhost(ui); return; }
    if (ui.ghost.mv) { drawMoveGhost(ui); return; }
    const t = C.nodeTypes[ui.ghost.type];
    const ok = ui.ghost.ok;
    const size = S.sizeOf(ui.ghost.type);
    const x = ui.ghost.x - size.w / 2, y = ui.ghost.y - size.h / 2;
    ctx.fillStyle = ok ? rgba(t.color, 0.14) : 'rgba(220,110,110,0.14)';
    roundRect(x, y, size.w, size.h, 12); ctx.fill();
    ctx.strokeStyle = ok ? t.color : '#e08a8a';
    ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
    roundRect(x, y, size.w, size.h, 12); ctx.stroke();
    ctx.setLineDash([]);
    IC.drawIcon(ctx, t.icon, ui.ghost.x, ui.ghost.y - 12, 26, ok ? C.iconColor(t) : '#e08a8a', 1.9);
    ctx.fillStyle = ok ? '#dff3e7' : '#f0c0c0';
    ctx.font = '600 12px ' + FONT_UI;
    ctx.textAlign = 'center';
    




    ctx.fillText(ok ? t.name : GG.i18n.msg(ui.ghost.why || 'Blocked'),
                 ui.ghost.x, ui.ghost.y + 20);
    ctx.textAlign = 'left';
  }

  





  function drawPackGhost(items, links, gx, gy, ok, label, wire) {
    const bad = '#e08a8a';

    
    ctx.strokeStyle = ok ? wire : 'rgba(224,138,138,0.4)';
    ctx.lineWidth = 2;
    links.forEach(function (l) {
      const a = items[l.a], b = items[l.b];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(gx + a.dx, gy + a.dy);
      ctx.lineTo(gx + b.dx, gy + b.dy);
      ctx.stroke();
    });

    ctx.setLineDash([8, 6]);
    let foot = -Infinity;
    items.forEach(function (it) {
      const t = C.nodeTypes[it.type];
      const size = S.sizeOf(it.type);
      const x = gx + it.dx - size.w / 2, y = gy + it.dy - size.h / 2;
      foot = Math.max(foot, it.dy + size.h / 2);
      ctx.fillStyle = ok ? rgba(t.color, 0.14) : 'rgba(220,110,110,0.14)';
      roundRect(x, y, size.w, size.h, 12); ctx.fill();
      ctx.strokeStyle = ok ? t.color : bad;
      ctx.lineWidth = 2;
      roundRect(x, y, size.w, size.h, 12); ctx.stroke();
      IC.drawIcon(ctx, t.icon, gx + it.dx, gy + it.dy, 26, ok ? C.iconColor(t) : bad, 1.9);
    });
    ctx.setLineDash([]);

    
    ctx.fillStyle = ok ? '#dff3e7' : '#f0c0c0';
    ctx.font = '600 13px ' + FONT_UI;
    ctx.textAlign = 'center';
    ctx.fillText(label, gx, gy + (foot > -Infinity ? foot : 0) + 20);
    ctx.textAlign = 'left';
  }

  function drawBlueprintGhost(ui) {
    const bp = ui.ghost.bp, ok = ui.ghost.ok;
    drawPackGhost(bp.nodes, bp.links, ui.ghost.x, ui.ghost.y, ok,
      ok ? bp.name : GG.i18n.msg(ui.ghost.why || 'Blocked'), 'rgba(232,176,75,0.45)');
  }

  

  function drawMoveGhost(ui) {
    const pack = ui.ghost.mv, ok = ui.ghost.ok;
    








    let items = S.moveItems(pack);
    const plan = S.onSitePlan ? S.onSitePlan(pack, ui.ghost.x, ui.ghost.y) : null;
    if (plan && plan.length) {
      items = items.concat(plan.map(function (it) {
        return { id: it.id, type: it.type, dx: it.x - ui.ghost.x, dy: it.y - ui.ghost.y };
      }));
    }
    const idx = {};
    items.forEach(function (it, i) { idx[it.id] = i; });
    

    const links = S.g.links
      .filter(l => idx[l.from] !== undefined && idx[l.to] !== undefined)
      .map(l => ({ a: idx[l.from], b: idx[l.to] }));
    const label = ok
      ? (items.length === 1 ? GG.i18n.t('ui.movingOne')
                            : GG.i18n.t('ui.movingN').replace('%', items.length))
      : GG.i18n.msg(ui.ghost.why || 'Blocked');
    drawPackGhost(items, links, ui.ghost.x, ui.ghost.y, ok, label, 'rgba(98,212,227,0.5)');
  }

  function rgba(hex, a) {
    const v = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')';
  }

  








  let healCur = null, healPin = null;

  function healTarget() {
    const H2 = C.heal;
    if (!H2 || !H2.enabled) return 1;
    const total = (S.g && S.g.totalCI) || 0;
    const k = Math.max(0, Math.min(1, total / (H2.full || 25000)));
    return Math.pow(k, H2.gamma || 1);
  }

  R.healK = function () {
    if (healPin !== null) return healPin;
    if (!C.heal || !C.heal.enabled) return 1;
    return healCur === null ? healTarget() : healCur;
  };
  
  R.healPreview = function (k) {
    healPin = (k === null || k === undefined) ? null : Math.max(0, Math.min(1, k));
    return R.healK();
  };

  function stepHeal(dt) {
    const want = healTarget();
    if (healCur === null) { healCur = want; return; }
    const ease = (C.heal && C.heal.ease) || 1.5;
    healCur += (want - healCur) * Math.min(1, dt / ease);
  }

  











  


  R.reviveOn = function () { return GG.sim.reviveOn(); };

  let revCur = null, revLoc = null, revPin = null;

  function reviveTarget() {
    const st = GG.sim.reviveStages();
    const stage = revPin !== null ? revPin : GG.sim.reviveStage(S.g.loc);
    
    
    return st > 0 ? Math.max(0, Math.min(1, stage / st)) : 1;
  }

  R.reviveK = function () {
    if (!R.reviveOn()) return 0;
    return revCur === null ? reviveTarget() : revCur;
  };

  

  R.revivePreview = function (stage) {
    revPin = (stage === null || stage === undefined) ? null
      : Math.max(0, Math.min(GG.sim.reviveStages(), Math.round(stage)));
    return R.reviveK();
  };

  function stepRevive(dt) {
    if (!R.reviveOn()) { revCur = null; revLoc = null; return; }
    const want = reviveTarget();
    
    
    if (revCur === null || revLoc !== S.g.loc) { revCur = want; revLoc = S.g.loc; return; }
    revCur += (want - revCur) * Math.min(1, dt / (C.revive.ease || 1.2));
  }

  




  function drawGroundCover() {
    if (!R.reviveOn()) return;
    const P = C.revive.patch;
    if (!P || !P.max) return;
    const k = R.reviveK();
    if (k <= 0.001) return;
    const slice = 1 / P.max;
    const seed = hashStr(S.g.loc || '');
    ctx.save();
    for (let i = 0; i < P.max; i++) {
      
      const a = Math.max(0, Math.min(1, (k - i * slice) / slice));
      if (a <= 0.01) continue;
      const h1 = ((seed + i * 2654435761) >>> 0) / 4294967296;
      const h2 = ((seed + i * 1597334677 + 977) >>> 0) / 4294967296;
      const h3 = ((seed + i * 40503 + 7919) >>> 0) / 4294967296;
      const x = (h1 - 0.5) * 2200, y = (h2 - 0.5) * 1500;
      const r = P.r * (0.7 + h3 * 0.7);
      const g2 = ctx.createRadialGradient(x, y, 0, x, y, r);
      g2.addColorStop(0, rgba(P.color, P.alpha * a));
      g2.addColorStop(1, rgba(P.color, 0));
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const o = [];
    for (let i = 2; i >= 0; i--) {
      const sh = i * 8;
      const x = (pa >> sh) & 255, y = (pb >> sh) & 255;
      o.push(Math.round(x + (y - x) * t));
    }
    return 'rgb(' + o[0] + ',' + o[1] + ',' + o[2] + ')';
  }

  


  function drawSmog(time) {
    const H2 = C.heal;
    if (!H2 || !H2.enabled) return;
    const dirty = 1 - R.healK();
    if (dirty <= 0.002) return;

    ctx.save();
    const g = ctx.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, Math.hypot(W, H) * 0.62);
    g.addColorStop(0, rgba(H2.smog.color, H2.smog.alpha * dirty * 0.45));
    g.addColorStop(1, rgba(H2.smog.color, H2.smog.alpha * dirty));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    
    const M = H2.motes, n = Math.round(M.count * dirty);
    ctx.fillStyle = rgba(M.color, 0.5 * dirty);
    for (let i = 0; i < n; i++) {
      const sx = (i * 97.13) % 1, sy = (i * 41.77) % 1;
      const x = ((sx * W) + time * M.speed * (0.5 + sx)) % (W + 40) - 20;
      const y = (sy * H + Math.sin(time * 0.25 + i) * 9 + H) % H;
      ctx.beginPath();
      ctx.arc(x, y, M.size * (0.6 + sy * 0.8), 0, 6.283);
      ctx.fill();
    }
    ctx.restore();
  }
})(window.GG);
