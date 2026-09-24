


























window.GG = window.GG || {};
GG.audio = (function () {
  'use strict';

  const A = {};
  let ctx = null, master = null;
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
      master.connect(ctx.destination);
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

  
  let noiseBuf = null;
  function noise() {
    if (!noiseBuf) {
      const n = Math.floor(ctx.sampleRate * 0.4);
      noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    return src;
  }

  function note(n, at) {
    const t0 = at + (n.t || 0);
    const dur = n.d || 0.12;
    const gain = ctx.createGain();
    const peak = (n.g === undefined ? 0.5 : n.g);

    
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + Math.min(0.02, dur * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    let src;
    if (n.w === 'noise') {
      src = noise();
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(n.f, t0);
      if (n.to) bp.frequency.exponentialRampToValueAtTime(n.to, t0 + dur);
      bp.Q.value = n.q || 1.2;
      src.connect(bp); bp.connect(gain);
    } else {
      src = ctx.createOscillator();
      src.type = n.w || 'sine';
      src.frequency.setValueAtTime(n.f, t0);
      if (n.to) src.frequency.exponentialRampToValueAtTime(n.to, t0 + dur);
      src.connect(gain);
    }
    gain.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  

  const lastAt = {};

  




  const pools = {}, broken = {};

  function elementFor(url) {
    if (broken[url]) return null;
    let p = pools[url];
    if (!p) {
      p = pools[url] = [];
      for (let i = 0; i < 3; i++) {
        const a = new Audio(url);
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

  



  function synth(def) {
    if (!def.notes || !def.notes.length) return;
    if (!ensure()) return;
    const c = cfg();
    master.gain.value = c.volume;
    const now = ctx.currentTime;
    const g = def.gain === undefined ? 1 : def.gain;
    def.notes.forEach(n => note(g === 1 ? n : Object.assign({}, n, {
      g: (n.g === undefined ? 0.5 : n.g) * g,
    }), now));
  }

  A.play = function (id) {
    
    if (suspended) return;
    const c = cfg();
    if (!c.enabled) return;
    const def = c.sounds[id];
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
  function ambLevel(def) {
    const a = ambCfg();
    return GG.util.clamp((a.volume === undefined ? 0.5 : a.volume) *
                         (def.gain === undefined ? 1 : def.gain), 0, 1);
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

  A.ambience = function (id) {
    if (suspended) return;                   
    const c = cfg(), a = ambCfg();
    const def = id && a.sounds && a.sounds[id];
    if (!c.enabled || !def || broken[def.file]) { A.ambienceStop(); return; }
    if (amb.id === id && amb.el && !amb.el.paused) return;   
    A.ambienceStop(0);

    const el = new Audio(def.file);
    el.preload = 'auto';
    el.loop = !!def.loop;                    
    


















    if (!el.loop && def.then) {
      el.addEventListener('ended', function () {
        if (amb.el === el) A.ambience(def.then);
      });
    }
    el.volume = 0;
    el.addEventListener('error', function () { broken[def.file] = true; });
    amb.el = el; amb.id = id;
    const p = el.play();
    



    if (p && p.catch) p.catch(function () {});
    ramp(el, ambLevel(def), def.fadeIn === undefined ? a.fadeIn : def.fadeIn, amb);
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
    ramp(el, 0, f, {}, function () { try { el.pause(); } catch (e) {} });
  };
  A.ambiencePlaying = function () { return amb.id; };

  













  let suspended = false, musWasOn = false;
  A.suspend = function () {
    if (suspended) return;
    suspended = true;
    musWasOn = !!(mus && !mus.paused);
    if (mus) { try { mus.pause(); } catch (e) {} }
    A.ambienceStop(0);              
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

    const el = new Audio(src);
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

  A.setEnabled = function (on) {
    GG.config.audio.enabled = !!on;
    


    if (on) { ensure(); A.musicStart(); if (GG.ui && GG.ui.syncWeatherSound) GG.ui.syncWeatherSound(); }
    else { stopMusic(); A.ambienceStop(0); }   
    return GG.config.audio.enabled;
  };
  A.toggle = function () { return A.setEnabled(!GG.config.audio.enabled); };
  A.setVolume = function (v) {
    GG.config.audio.volume = GG.util.clamp(v, 0, 1);
    if (master) master.gain.value = GG.config.audio.volume;
  };

  return A;
})();
