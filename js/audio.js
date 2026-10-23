window.GG = window.GG || {};
GG.audio = (function () {
  'use strict';

  const A = {};
  let ctx = null, master = null, lp = null;

  const duck = { on: false, k: { music: 1, fx: 1, wx: 1 }, els: new Set(), timer: null };

  const vol = typeof HTMLMediaElement !== 'undefined' && typeof WeakRef !== 'undefined' &&
              Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'volume');
  function duckCfg() { return (GG.config.overlay || {}).sound || {}; }
  function own(el, kind) {
    if (!vol || duckCfg().enabled === false) return el;
    let want = 1;
    Object.defineProperty(el, 'volume', {
      configurable: true,
      get() { return want; },
      set(v) { want = v; vol.set.call(el, Math.max(0, Math.min(1, v * duck.k[kind]))); },
    });
    duck.els.add(new WeakRef(el));
    return el;
  }
  A.duck = function (on) {
    on = !!on && duckCfg().enabled !== false;
    if (on === duck.on) return;
    duck.on = on;
    const d = duckCfg(), tgt = on ? { music: d.music, fx: d.fx, wx: d.weather } : { music: 1, fx: 1, wx: 1 };
    const sec = d.fadeSec === undefined ? 0.5 : d.fadeSec;
    if (lp) lp.frequency.setTargetAtTime(on ? (d.muffleHz || 900) : 22000, ctx.currentTime, Math.max(0.01, sec / 3));
    clearInterval(duck.timer);
    const from = Object.assign({}, duck.k), t0 = Date.now();
    duck.timer = setInterval(function () {
      const u = sec > 0 ? Math.min(1, (Date.now() - t0) / (sec * 1000)) : 1, e = u * u * (3 - 2 * u);
      ['music', 'fx', 'wx'].forEach(function (n) { duck.k[n] = from[n] + ((tgt[n] === undefined ? 1 : tgt[n]) - from[n]) * e; });
      duck.els.forEach(function (r) { const el = r.deref(); if (el) el.volume = el.volume; else duck.els.delete(r); });
      if (u >= 1) { clearInterval(duck.timer); duck.timer = null; }
    }, 30);
  };
  A.ducking = function () { return { on: duck.on, music: duck.k.music, fx: duck.k.fx, weather: duck.k.wx, hz: lp ? lp.frequency.value : null }; };
  let ready = false;

  let unlocked = false;

  function cfg() { return GG.config.audio; }

  function ensure() {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = cfg().volume;
      lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = duck.on ? (duckCfg().muffleHz || 900) : 22000;
      master.connect(lp); lp.connect(ctx.destination);
      ready = true;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  A.ready = function () { return ready; };

  A.unlock = function () {
    const first = !unlocked;
    ensure();
    unlocked = true;

    if (first) for (const k in broken) delete broken[k];
    if (!cfg().enabled) return;

    if (mus && mus.paused) stopMusic();
    A.musicStart();

    if (first && GG.ui && GG.ui.syncWeatherSound) GG.ui.syncWeatherSound();
  };

  const noiseBufs = new WeakMap();
  function noise(c) {
    c = c || ctx;
    let buf = noiseBufs.get(c);
    if (!buf) {
      const n = Math.floor(c.sampleRate * 0.4);
      buf = c.createBuffer(1, n, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      noiseBufs.set(c, buf);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
  }

  const rooms = new WeakMap();
  function roomOf(c, out) {
    let conv = rooms.get(c);
    if (!conv) {
      const s2 = cfg().synth2 || {}, R2 = s2.reverb || {};
      const len = Math.max(1, Math.floor(c.sampleRate * (R2.sec || 1.1)));
      const buf = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, R2.decay || 3.2);
      }
      conv = c.createConvolver();
      conv.buffer = buf;
      const lvl = c.createGain();
      lvl.gain.value = R2.level === undefined ? 0.5 : R2.level;
      conv.connect(lvl); lvl.connect(out);
      rooms.set(c, conv);
    }
    return conv;
  }

  function note(n, at, c, out) {
    c = c || ctx; out = out || master;
    const t0 = at + (n.t || 0);
    const dur = n.d || 0.12;
    const gain = c.createGain();
    const peak = (n.g === undefined ? 0.5 : n.g);
    const atk = n.a === undefined ? Math.min(0.02, dur * 0.25) : Math.max(0.001, Math.min(n.a, dur * 0.9));

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + atk);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    let head = gain;
    if (n.lp) {
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(n.lp, t0);
      if (n.lpTo) lp.frequency.exponentialRampToValueAtTime(n.lpTo, t0 + dur);
      lp.Q.value = n.lq || 0.7;
      lp.connect(gain);
      head = lp;
    }

    const srcs = [];
    if (n.w === 'noise') {
      const src = noise(c);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(n.f, t0);
      if (n.to) bp.frequency.exponentialRampToValueAtTime(n.to, t0 + dur);
      bp.Q.value = n.q || 1.2;
      src.connect(bp); bp.connect(head);
      srcs.push(src);
    } else {
      const k = Math.max(1, Math.floor(n.uni || 1));
      for (let i = 0; i < k; i++) {
        const o = c.createOscillator();
        o.type = n.w || 'sine';
        o.frequency.setValueAtTime(n.f, t0);
        if (n.to) o.frequency.exponentialRampToValueAtTime(n.to, t0 + dur);
        let dest = head;
        if (k > 1) {
          o.detune.value = (n.det === undefined ? 8 : n.det) * (i / (k - 1) * 2 - 1);
          const share = c.createGain();
          share.gain.value = 1 / k;
          share.connect(head);
          dest = share;
        }
        if (n.fm) {
          const m = c.createOscillator();
          m.type = 'sine';
          m.frequency.setValueAtTime(n.f * n.fm.r, t0);
          if (n.to) m.frequency.exponentialRampToValueAtTime(n.to * n.fm.r, t0 + dur);
          const depth = c.createGain();
          const dev = n.f * (n.fm.i === undefined ? 1 : n.fm.i);
          depth.gain.setValueAtTime(Math.max(0.01, dev), t0);
          depth.gain.exponentialRampToValueAtTime(
            Math.max(0.01, dev * (n.fm.end === undefined ? 0.05 : n.fm.end)), t0 + dur);
          m.connect(depth); depth.connect(o.frequency);
          srcs.push(m);
        }
        o.connect(dest);
        srcs.push(o);
      }
    }

    let post = gain;
    if (n.pan && c.createStereoPanner) {
      const p = c.createStereoPanner();
      p.pan.value = GG.util.clamp(n.pan, -1, 1);
      gain.connect(p);
      post = p;
    }
    post.connect(out);
    if (n.rev) {
      const send = c.createGain();
      send.gain.value = n.rev;
      post.connect(send);
      send.connect(roomOf(c, out));
    }
    srcs.forEach(function (s) { s.start(t0); s.stop(t0 + dur + 0.02); });
  }

  const lastAt = {};

  const pools = {}, broken = {};

  function elementFor(url) {
    if (broken[url]) return null;
    let p = pools[url];
    if (!p) {
      p = pools[url] = [];
      for (let i = 0; i < 3; i++) {
        const a = own(new Audio(url), 'fx');
        a.preload = 'auto';
        a.addEventListener('error', function () { broken[url] = true; });
        p.push(a);
      }
    }

    return p.find(a => a.paused || a.ended) || p[0];
  }

  function fileOf(e) { return typeof e === 'string' ? e : e.file; }
  function gainOf(e) { return (typeof e === 'string' || e.gain === undefined) ? 1 : e.gain; }
  function pickFile(def) {
    if (def.files && def.files.length) {
      let list = def.files.filter(e => !broken[fileOf(e)]);
      if (!list.length) list = def.files;
      let total = 0;
      for (const e of list) total += (typeof e === 'string' ? 1 : (e.weight === undefined ? 1 : e.weight));
      let r = Math.random() * total;
      for (const e of list) {
        r -= (typeof e === 'string' ? 1 : (e.weight === undefined ? 1 : e.weight));
        if (r <= 0) return { url: fileOf(e), gain: gainOf(e) };
      }
      const last = list[list.length - 1];
      return { url: fileOf(last), gain: gainOf(last) };
    }
    return def.file ? { url: def.file, gain: 1 } : null;
  }

  function playFile(url, vol, onFail) {
    const a = elementFor(url);
    if (!a) return false;
    a.volume = GG.util.clamp(vol, 0, 1);
    try { a.currentTime = 0; } catch (e) {  }
    const p = a.play();
    if (p && p.catch) {
      p.catch(function (err) {

        const name = err && err.name;
        if (name !== 'NotAllowedError' && name !== 'AbortError') {
          if (unlocked) broken[url] = true;
        }
        if (onFail) onFail();
      });
    }
    return true;
  }

  function synthOn(def, c, out, at) {
    const g = def.gain === undefined ? 1 : def.gain;
    def.notes.forEach(n => note(g === 1 ? n : Object.assign({}, n, {
      g: (n.g === undefined ? 0.5 : n.g) * g,
    }), at, c, out));
  }

  function synth(def) {
    if (!def.notes || !def.notes.length) return;
    if (!ensure()) return;
    const c = cfg();
    master.gain.value = c.volume;
    synthOn(def, ctx, master, ctx.currentTime);
  }

  A.defOf = function (id, which) {
    const c = cfg(), base = c.sounds[id];
    const v2 = c.sounds2 && c.sounds2[id];
    const useNew = which === 'new' || (which === undefined && c.synth2 && c.synth2.enabled);
    if (!base || !v2 || !useNew || which === 'old') return base;
    const d = Object.assign({}, base, v2);
    d.file = v2.file; d.files = v2.files;
    return d;
  };

  A.playDef = function (def) {
    if (!def) return;
    ensure(); unlocked = true;
    synth(def);
  };

  A.render = function (def, sec) {
    const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC || !def || !def.notes) return Promise.resolve(null);
    const sr = 48000;
    const c = new OC(2, Math.ceil(sr * (sec || 2)), sr);
    const out = c.createGain();
    out.gain.value = 1;
    out.connect(c.destination);
    synthOn(def, c, out, 0.005);
    return c.startRendering();
  };

  A.play = function (id) {

    if (suspended) return;
    const c = cfg();
    if (!c.enabled) return;
    const def = A.defOf(id);
    if (!def) return;

    const now = (window.performance ? performance.now() : Date.now()) / 1000;
    const gap = def.minGap === undefined ? c.minGap : def.minGap;
    if (lastAt[id] !== undefined && now - lastAt[id] < gap) return;
    lastAt[id] = now;

    if (def.also) def.also.forEach(function (x) { A.play(x); });

    const pick = pickFile(def);
    if (pick && playFile(pick.url,
                         c.volume * (def.gain === undefined ? 1 : def.gain) * pick.gain,
                         function () { synth(def); })) return;
    synth(def);
  };

  const amb = { el: null, id: null, timer: null };

  function ambCfg() { return cfg().ambience || { sounds: {} }; }
  function ambLevel(def, fileGain) {
    const a = ambCfg();
    return GG.util.clamp((a.volume === undefined ? 0.5 : a.volume) *
                         (def.gain === undefined ? 1 : def.gain) * (fileGain === undefined ? 1 : fileGain), 0, 1);
  }

  function ramp(el, to, sec, hold, done) {
    if (hold.timer) { clearInterval(hold.timer); hold.timer = null; }
    if (!(sec > 0)) { el.volume = GG.util.clamp(to, 0, 1); if (done) done(); return; }
    const from = el.volume, steps = Math.max(1, Math.round(sec * 20));
    let i = 0;
    hold.timer = setInterval(function () {
      i++;
      el.volume = GG.util.clamp(from + (to - from) * (i / steps), 0, 1);
      if (i >= steps) { clearInterval(hold.timer); hold.timer = null; if (done) done(); }
    }, sec * 1000 / steps);
  }

  A.ambience = function (id, at) {
    if (suspended) return;
    const c = cfg(), a = ambCfg();
    const def = id && a.sounds && a.sounds[id];

    const pick = def && pickFile(def);
    if (!c.enabled || !def || !pick || (!def.files && broken[pick.url])) { A.ambienceStop(); return; }
    if (amb.id === id && amb.el && !amb.el.paused) return;

    if (amb.el && !amb.el.paused && amb.id) {
      for (let d = def, n = 0; d && d.then && n < 8; d = a.sounds[d.then], n++) {
        if (d.then === amb.id) return;
      }
    }
    A.ambienceStop(0);

    const el = own(new Audio(pick.url), 'wx');
    el.preload = 'auto';
    el.loop = !!def.loop;

    if (!el.loop && def.then) {
      el.addEventListener('ended', function () {
        if (amb.el === el) A.ambience(def.then);
      });
    }
    el.volume = 0;
    el.addEventListener('error', function () { broken[pick.url] = true; });
    amb.el = el; amb.id = id;
    const resume = a.resume !== false && at > 1;
    if (resume) {
      const seek = function () {
        const d = el.duration;
        if (!(d > 0)) return;
        if (el.loop) el.currentTime = at % d;
        else if (at < d - 0.5) el.currentTime = at;
        else if (amb.el === el) A.ambienceStop(0);
      };
      if (el.readyState >= 1) seek(); else el.addEventListener('loadedmetadata', seek, { once: true });
    }
    const p = el.play();

    if (p && p.catch) p.catch(function () {});
    const fin = resume && a.leaveFade !== undefined ? a.leaveFade : (def.fadeIn === undefined ? a.fadeIn : def.fadeIn);
    ramp(el, ambLevel(def, pick.gain), fin, amb);
  };

  A.ambienceStop = function (sec) {
    const el = amb.el;
    if (!el) return;
    const a = ambCfg();
    const def = (a.sounds && a.sounds[amb.id]) || {};
    if (amb.timer) { clearInterval(amb.timer); amb.timer = null; }
    amb.el = null; amb.id = null;
    const f = sec === undefined ? (def.fadeOut === undefined ? a.fadeOut : def.fadeOut) : sec;
    if (!(f > 0)) { try { el.pause(); } catch (e) {} return; }

    const h = {}; fading.set(el, h);
    ramp(el, 0, f, h, function () { fading.delete(el); try { el.pause(); } catch (e) {} });
  };
  const fading = new Map();
  A.ambiencePlaying = function () { return amb.id; };

  A.leaveFade = function () { return ambCfg().leaveFade; };

  A.leaveWeather = function () {
    const f = A.leaveFade();
    if (f === undefined) { A.ambienceStop(); return; }
    A.cutWeather();
    nightStop(f);
  };

  A.cutWeather = function () {
    const f = A.leaveFade();
    if (f === undefined) { A.ambienceStop(); return; }
    A.ambienceStop(f);
    fading.forEach(function (h, el) {
      ramp(el, 0, f, h, function () { fading.delete(el); try { el.pause(); } catch (e) {} });
    });
  };

  const nbed = { el: null, timer: null, on: false, level: -1 };
  let nightAt = 0;
  function nightCfg() { return cfg().night || {}; }
  function nightStop(sec) {
    const el = nbed.el;
    nbed.on = false; nbed.level = -1;
    if (!el) return;
    if (!(sec > 0)) { if (nbed.timer) { clearInterval(nbed.timer); nbed.timer = null; }
                      el.volume = 0; try { el.pause(); } catch (e) {} return; }
    ramp(el, 0, sec, nbed, function () { if (!nbed.on) { try { el.pause(); } catch (e) {} } });
  }
  A.nightTick = function (isNight) {
    const now = (window.performance ? performance.now() : Date.now()) / 1000;
    if (now - nightAt < 0.25) return;
    nightAt = now;
    const N = nightCfg(), c = cfg();
    const want = !!isNight && !!N.enabled && !!N.file && !!c.enabled && !suspended &&
                 unlocked && musMode === 'game' && !broken[N.file];
    if (!want) { if (nbed.on) nightStop(N.fadeOut === undefined ? 6 : N.fadeOut); return; }
    const duck = amb.id ? (N.duckWeather === undefined ? 0.35 : N.duckWeather) : 1;
    const level = GG.util.clamp((N.volume === undefined ? 0.2 : N.volume) * (c.volume || 0) * duck, 0, 1);

    if (nbed.el && nbed.file !== N.file) {
      try { nbed.el.pause(); } catch (e) {}
      if (nbed.timer) { clearInterval(nbed.timer); nbed.timer = null; }
      nbed.el = null; nbed.on = false; nbed.level = -1;
    }
    if (!nbed.el) {
      nbed.file = N.file;
      const el = own(new Audio(N.file), 'wx');
      el.preload = 'auto'; el.loop = true; el.volume = 0;
      el.addEventListener('error', function () { broken[N.file] = true; });
      nbed.el = el;
    }
    if (!nbed.on) {
      nbed.on = true;
      const p = nbed.el.play();
      if (p && p.catch) p.catch(function () {});
      nbed.level = level;
      ramp(nbed.el, level, N.fadeIn === undefined ? 8 : N.fadeIn, nbed);
    } else if (Math.abs(level - nbed.level) > 0.002) {

      nbed.level = level;
      ramp(nbed.el, level, 1.5, nbed);
    }
  };
  A.nightState = function () {
    return { on: nbed.on, level: nbed.el ? +nbed.el.volume.toFixed(3) : 0,
             target: +nbed.level.toFixed(3), playing: !!(nbed.el && !nbed.el.paused) };
  };

  A.ambienceClock = function () {
    const el = amb.el;
    if (!el || el.paused || suspended || !(el.readyState >= 2)) return null;
    return { id: amb.id, t: el.currentTime };
  };

  let suspended = false, musWasOn = false;

  const loops = {};
  A.loop = function (id, on) {
    const def = A.defOf(id), c = cfg();
    const L = loops[id] || (loops[id] = { a: null, timer: null });
    const ramp = function (to, sec, done) {
      clearInterval(L.timer);
      const a = L.a; if (!a) return;
      const from = a.volume, t0 = Date.now(), ms = Math.max(1, (sec || 0) * 1000);
      L.timer = setInterval(function () {
        const u = Math.min(1, (Date.now() - t0) / ms);
        a.volume = GG.util.clamp(from + (to - from) * u, 0, 1);
        if (u >= 1) { clearInterval(L.timer); L.timer = null; if (done) done(); }
      }, 30);
    };
    if (on === false) {
      if (!L.a || L.a.paused) return;
      const a = L.a;
      ramp(0, def ? def.fadeOut : 0.5, function () { try { a.pause(); } catch (e) {} });
      return;
    }
    if (suspended || !c.enabled || !def) return;
    const pick = pickFile(def);
    if (!pick) return;
    if (!L.a || L.a.src.indexOf(pick.url) < 0) { L.a = own(new Audio(pick.url), 'fx'); L.a.loop = true; }
    if (!L.a.paused && !L.timer) return;
    const vol = GG.util.clamp(c.volume * (def.gain === undefined ? 1 : def.gain) * pick.gain, 0, 1);
    L.a.volume = 0;
    const p = L.a.play(); if (p && p.catch) p.catch(function () {});
    ramp(vol, def.fadeIn || 0.3);
  };
  function loopsSilence() {
    Object.keys(loops).forEach(function (id) {
      const L = loops[id]; clearInterval(L.timer); L.timer = null;
      if (L.a) { try { L.a.pause(); } catch (e) {} }
    });
  }

  A.suspend = function () {
    if (suspended) return;
    suspended = true;
    loopsSilence();
    musWasOn = !!(mus && !mus.paused);
    if (mus) { try { mus.pause(); } catch (e) {} }
    A.ambienceStop(0);
    bedSilence();
    nightStop(0);
  };
  A.resume = function () {
    if (!suspended) return;
    suspended = false;
    if (musWasOn && mus) { const p = mus.play(); if (p && p.catch) p.catch(function () {}); }
    musWasOn = false;

    if (GG.ui && GG.ui.syncWeatherSound) GG.ui.syncWeatherSound();
  };
  A.suspended = function () { return suspended; };

  let mus = null, musIdx = -1, musGap = null, fadeTimer = null, musMode = 'game';

  function musCfg() { return cfg().music || { tracks: [] }; }

  function musList() {
    const m = musCfg();
    if (musMode === 'menu' && m.menu && m.menu.length) return m.menu;
    return m.tracks || [];
  }

  function nextTrack() {
    const list = musList();
    if (!list.length) return null;
    if (musCfg().shuffle && list.length > 1) {
      let i = musIdx;
      while (i === musIdx) i = Math.floor(Math.random() * list.length);
      musIdx = i;
    } else {
      musIdx = (musIdx + 1) % list.length;
    }
    return list[musIdx];
  }

  function stopMusic() {
    if (musGap) { clearTimeout(musGap); musGap = null; }
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
    if (mus) { try { mus.pause(); } catch (e) {} mus = null; }
  }

  function useLite(track) {
    return !!(track && track.lite && musCfg().liteOnTouch && GG.util.noMouse());
  }
  function trackFile(track) { return useLite(track) ? track.lite : track.file; }
  function trackGain(track) {
    if (!track) return 1;
    const g = useLite(track) ? track.liteGain : track.gain;
    return g === undefined ? 1 : g;
  }
  A.trackFile = trackFile;
  A.trackGain = trackGain;

  function musicLevel(track) {
    const c = cfg();
    return GG.util.clamp(c.musicVolume * trackGain(track), 0, 1);
  }

  function fade(el, to, sec, done) {
    if (fadeTimer) clearInterval(fadeTimer);
    const from = el.volume, steps = Math.max(1, Math.round(sec * 20));
    let i = 0;
    fadeTimer = setInterval(function () {
      i++;
      el.volume = GG.util.clamp(from + (to - from) * (i / steps), 0, 1);
      if (i >= steps) { clearInterval(fadeTimer); fadeTimer = null; if (done) done(); }
    }, sec * 1000 / steps);
  }

  function playNext() {
    stopMusic();
    const c = cfg();
    if (!c.enabled || !musCfg().enabled) return;
    const track = nextTrack();
    if (!track) return;

    const src = trackFile(track);
    if (broken[src]) return;

    const el = own(new Audio(src), 'music');
    el.preload = 'auto';
    el.volume = musCfg().fadeSec > 0 ? 0 : musicLevel(track);
    el.addEventListener('error', function () {
      broken[src] = true;
      console.warn('[ReGen] music file missing:', src);
    });
    el.addEventListener('ended', function () {
      musGap = setTimeout(playNext, (musCfg().gapSec || 0) * 1000);
    });

    el.addEventListener('timeupdate', function () {
      const f = musCfg().fadeSec || 0;
      if (f > 0 && el.duration && el.duration - el.currentTime < f && !fadeTimer) {
        fade(el, 0, el.duration - el.currentTime);
      }
    });
    mus = el;
    const p = el.play();
    if (p && p.catch) p.catch(function (err) {

      if (mus === el) { try { el.pause(); } catch (e) {} mus = null; }
      const name = err && err.name;
      if (name === 'NotAllowedError' || name === 'AbortError') return;
      broken[src] = true;
    });
    if (musCfg().fadeSec > 0) fade(el, musicLevel(track), musCfg().fadeSec);
  }

  A.musicStart = function () {
    if (mus || musGap) return;
    playNext();
  };

  A.musicTry = function () {
    if (unlocked || mus || musGap) return false;
    if (!cfg().enabled || !musCfg().enabled) return false;
    ensure();
    playNext();
    return !!mus;
  };
  A.musicStop = stopMusic;
  A.musicSkip = function () { playNext(); };
  A.musicPlaying = function () {
    return mus ? (musList()[musIdx] || null) : null;
  };
  A.setMusicVolume = function (v) {
    cfg().musicVolume = GG.util.clamp(v, 0, 1);
    if (mus && !fadeTimer) mus.volume = musicLevel(musList()[musIdx]);
  };

  A.musicMode = function (mode) {
    mode = (mode === 'menu') ? 'menu' : 'game';
    if (mode === 'menu') { bedSilence(); nightStop(A.leaveFade() === undefined ? 1.5 : A.leaveFade()); }
    if (mode === musMode) return musMode;
    musMode = mode;
    musIdx = -1;
    if (!cfg().enabled || !musCfg().enabled) return musMode;
    if (musGap) { clearTimeout(musGap); musGap = null; playNext(); return musMode; }
    if (!mus) return musMode;
    const sec = musCfg().switchFadeSec;
    if (!(sec > 0)) { playNext(); return musMode; }
    fade(mus, 0, sec, function () { playNext(); });
    return musMode;
  };
  A.musicModeNow = function () { return musMode; };

  const bedBufs = new WeakMap();
  function bedNoise(c) {
    let buf = bedBufs.get(c);
    if (!buf) {

      const n = Math.floor(c.sampleRate * 4);
      buf = c.createBuffer(1, n, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      bedBufs.set(c, buf);
    }
    const s = c.createBufferSource();
    s.buffer = buf; s.loop = true;
    return s;
  }
  function bedCfg() { return cfg().placeBed || {}; }
  function bedBuild(c, out, t0) {
    const B = bedCfg(), Wd = B.wind || {}, P = B.pad || {};
    const main = c.createGain(); main.gain.value = 0; main.connect(out);
    const srcs = [];

    const nz = bedNoise(c);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = Wd.f || 380; bp.Q.value = Wd.q || 0.7;
    const sweep = c.createOscillator(); sweep.frequency.value = Wd.sweepHz || 0.06;
    const sweepG = c.createGain(); sweepG.gain.value = Wd.sweep || 180;
    sweep.connect(sweepG); sweepG.connect(bp.frequency);
    const gust = c.createGain(); gust.gain.value = 1;
    const gustL = c.createOscillator(); gustL.frequency.value = Wd.gustHz || 0.11;
    const gustD = c.createGain(); gustD.gain.value = Wd.gust || 0.45;
    gustL.connect(gustD); gustD.connect(gust.gain);
    const windG = c.createGain(); windG.gain.value = 0;
    nz.connect(bp); bp.connect(gust); gust.connect(windG); windG.connect(main);
    srcs.push(nz, sweep, gustL);

    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = (P.lp || [350, 1100])[0]; lp.Q.value = 0.5;
    const swell = c.createGain(); swell.gain.value = 1;
    const swL = c.createOscillator(); swL.frequency.value = P.swellHz || 0.05;
    const swD = c.createGain(); swD.gain.value = P.swell || 0.25;
    swL.connect(swD); swD.connect(swell.gain);
    const padG = c.createGain(); padG.gain.value = 0;
    lp.connect(swell); swell.connect(padG); padG.connect(main);
    const notes = P.notes || [110, 164.8, 246.9];
    notes.forEach(function (f, i) {
      [-1, 1].forEach(function (side) {
        const o = c.createOscillator();
        o.type = P.w || 'triangle';
        o.frequency.value = f;
        o.detune.value = side * (P.det || 6) + i;
        const g = c.createGain(); g.gain.value = 1 / (notes.length * 2);
        o.connect(g); g.connect(lp);
        srcs.push(o);
      });
    });
    srcs.push(swL);
    srcs.forEach(function (s) { s.start(t0 || 0); });
    return { c: c, main: main, windG: windG, padG: padG, lp: lp, srcs: srcs };
  }

  function bedLevels(b, k, gainOn, snap) {
    const B = bedCfg(), Wd = B.wind || {}, P = B.pad || {};
    const lerp = function (a, z) { return a + (z - a) * k; };
    const vals = [
      [b.main.gain, gainOn],
      [b.windG.gain, lerp(Wd.dirty === undefined ? 0.22 : Wd.dirty, Wd.clean === undefined ? 0.06 : Wd.clean)],
      [b.padG.gain, lerp(P.dirty || 0, P.clean === undefined ? 0.1 : P.clean)],
      [b.lp.frequency, lerp((P.lp || [350, 1100])[0], (P.lp || [350, 1100])[1])],
    ];
    const now = b.c.currentTime, tau = (B.fadeSec || 2.5) / 3;
    vals.forEach(function (v) {
      if (snap) v[0].setValueAtTime(v[1], now);
      else v[0].setTargetAtTime(v[1], now, tau);
    });
  }
  let bed = null, bedAt = 0, bedK = 0;
  function bedSilence() { if (bed) bedLevels(bed, bedK, 0); }

  A.bedTick = function (k) {
    const B = bedCfg(), c = cfg();
    const now = (window.performance ? performance.now() : Date.now()) / 1000;
    if (now - bedAt < 0.25) return;
    bedAt = now;
    bedK = Math.max(0, Math.min(1, +k || 0));
    const want = !!B.enabled && !!c.enabled && !suspended && unlocked && musMode === 'game';
    if (!want) { bedSilence(); return; }
    if (!bed) { if (!ensure()) return; bed = bedBuild(ctx, master, ctx.currentTime); }
    const duck = amb.id ? (B.duckWeather === undefined ? 0.4 : B.duckWeather) : 1;
    bedLevels(bed, bedK, (B.volume === undefined ? 0.35 : B.volume) * duck);
  };

  A.bedState = function () {
    return bed ? { built: true, k: +bedK.toFixed(2), level: +bed.main.gain.value.toFixed(3),
                   wind: +bed.windG.gain.value.toFixed(3), pad: +bed.padG.gain.value.toFixed(3) }
               : { built: false };
  };

  let labBed = null;
  A.bedLab = function (k) {
    if (k === null || k === undefined) { if (labBed) bedLevels(labBed, 0, 0); return; }
    if (!ensure()) return;
    unlocked = true;
    if (!labBed) labBed = bedBuild(ctx, master, ctx.currentTime);
    master.gain.value = cfg().volume;
    bedLevels(labBed, k, bedCfg().volume === undefined ? 0.35 : bedCfg().volume);
  };

  A.bedRender = function (k, sec) {
    const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return Promise.resolve(null);
    const c = new OC(2, Math.ceil(48000 * (sec || 6)), 48000);
    const b = bedBuild(c, c.destination, 0);
    bedLevels(b, k, bedCfg().volume === undefined ? 0.35 : bedCfg().volume, true);
    return c.startRendering();
  };

  A.setEnabled = function (on) {
    GG.config.audio.enabled = !!on;

    if (on) { ensure(); A.musicStart(); if (GG.ui && GG.ui.syncWeatherSound) GG.ui.syncWeatherSound(); }
    else { stopMusic(); A.ambienceStop(0); bedSilence(); nightStop(0); }
    return GG.config.audio.enabled;
  };
  A.toggle = function () { return A.setEnabled(!GG.config.audio.enabled); };
  A.setVolume = function (v) {
    GG.config.audio.volume = GG.util.clamp(v, 0, 1);
    if (master) master.gain.value = GG.config.audio.volume;
  };

  return A;
})();
