


(function (GG) {
  'use strict';
  const C = GG.config, S = GG.state;

  let last = 0, acc = 0, saveAcc = 0, markAcc = 0, clock = 0;
  const STEP = 1 / C.sim.tickRate;

  









  const seen = Object.create(null);
  GG.crashes = [];

  function guardCfg() {
    const g = C.crashGuard || {};
    return { enabled: g.enabled !== false, banner: g.banner !== false,
             maxSame: g.maxSame === undefined ? 3 : g.maxSame,
             saveOnError: g.saveOnError !== false };
  }

  function onCrash(where, err) {
    const cfg = guardCfg();
    const msg = (err && err.message) || String(err);
    const key = where + '|' + msg;
    seen[key] = (seen[key] || 0) + 1;
    const n = seen[key];

    

    if (cfg.saveOnError && n === 1) {
      try { if (GG.menu && GG.menu.started()) S.save(false); } catch (e) {}
    }

    if (n <= cfg.maxSame) {
      GG.crashes.push({ where: where, message: msg, stack: err && err.stack, at: Date.now() });
      
      console.error('[Earth ReGen] ' + where + ' threw:', err);
      if (n === cfg.maxSame) console.error('[Earth ReGen] ...further "' + msg + '" in ' + where + ' will be counted, not printed');
    }
    if (cfg.banner) showBanner(where, msg, n);
  }

  


  let bannerEl = null, bannerHidden = null;

  



  function noticeStack() {
    let st = document.getElementById('notice-stack');
    if (!st) { st = document.createElement('div'); st.id = 'notice-stack'; document.body.appendChild(st); }
    return st;
  }

  function showBanner(where, msg, n) {
    const key = where + '|' + msg;
    




    if (bannerHidden === key) return;
    try {
      const I = GG.i18n;
      if (!bannerEl || !bannerEl.isConnected) {
        bannerEl = document.createElement('div');
        bannerEl.className = 'crash-bar';
        bannerEl.innerHTML = '<b></b><span></span><i></i><button type="button"></button>';
        bannerEl.querySelector('button').onclick = function () {
          bannerHidden = key;
          bannerEl.remove(); bannerEl = null;
        };
        noticeStack().appendChild(bannerEl);
      }
      bannerEl.querySelector('b').textContent = I ? I.t('err.title') : 'Something went wrong';
      bannerEl.querySelector('span').textContent = I ? I.t('err.saved') : 'Your run has been saved and is still running.';
      bannerEl.querySelector('i').textContent = where + ' — ' + msg + (n > 1 ? '  (x' + n + ')' : '');
      bannerEl.querySelector('button').textContent = I ? I.t('err.close') : 'Dismiss';
    } catch (e) {  }
  }

  


  function phase(where, fn) {
    if (!guardCfg().enabled) { fn(); return true; }
    try { fn(); return true; }
    catch (e) { onCrash(where, e); return false; }
  }

  




  


  let lastFrameAt = performance.now(), stallMuted = false;
  GG.frameWatch = { stalled: function () { return stallMuted; } };

  function frame(now) {
    lastFrameAt = performance.now();
    if (stallMuted) { stallMuted = false; try { GG.audio.resume(); } catch (e) {} }
    




    if (!guardCfg().enabled) { frameBody(now); requestAnimationFrame(frame); return; }
    try { frameBody(now); }
    catch (e) { onCrash('the frame', e); }
    finally { requestAnimationFrame(frame); }
  }

  function frameBody(now) {
    const t = now / 1000;
    let dt = last ? t - last : 0;
    last = t;
    if (dt > C.sim.maxCatchupSec) dt = C.sim.maxCatchupSec;
    clock += dt;

    



    



    if (GG.menu && GG.menu.isOpen()) { acc = 0; return; }

    const speed = (GG.ui && GG.ui.speed) || 1;
    const step = STEP * speed;
    acc += dt;
    const ok = phase('the simulation', function () {
      let guard = 0;
      while (acc >= STEP && guard++ < 60) {
        GG.sim.tick(step);
        acc -= STEP;
      }
    });
    
    
    if (!ok) acc = 0;

    


    saveAcc += dt;
    
    
    if (saveAcc >= C.sim.autosaveSec) { saveAcc = 0; phase('the autosave', function () { S.save(false); }); }

    phase('the renderer', function () { GG.render.draw(clock, GG.input.view); });
    phase('the interface', function () { GG.ui.tick(); });
    
    phase('the tutorial', function () { GG.tutor.tick(); });

    


    markAcc += dt;
    if (markAcc >= C.sim.autosaveMarkSec) { markAcc = 0; phase('the autosave badge', function () { GG.ui.autosaveMark(); }); }
  }

  















  let hiddenAt = 0;

  function bgCfg() {
    const b = C.background || {};
    return { enabled: b.enabled !== false, card: b.card !== false,
             saveOnHide: b.saveOnHide !== false };
  }

  function onHide() {
    
    
    if (!bgCfg().enabled) { hiddenAt = 0; return; }
    
    if (!(GG.menu && GG.menu.started())) { hiddenAt = 0; return; }
    hiddenAt = Date.now();
    
    
    if (bgCfg().saveOnHide) phase('the autosave', function () { S.save(false); });
  }

  function onShow() {
    const at = hiddenAt;
    hiddenAt = 0;
    last = 0;                       
    if (!bgCfg().enabled) return;
    if (!at || !(GG.menu && GG.menu.started())) return;
    const awaySec = (Date.now() - at) / 1000;
    phase('the catch-up', function () {
      
      
      const rep = GG.sim.offline(awaySec);
      if (rep && bgCfg().card) GG.ui.offlineCard(rep);
    });
  }

  function boot() {
    S.init();
    GG.sim.invalidate();
    GG.render.init(document.getElementById('board'));
    GG.input.init(document.getElementById('board'));
    GG.ui.init();
    GG.tutor.init();
    GG.menu.init();           
    


    if (window.desktop && window.desktop.autoplay && GG.config.audio.desktopAutoplay !== false) {
      try { GG.audio.unlock(); } catch (e) { console.warn('desktop autoplay', e); }
    }

    



    

    document.addEventListener('visibilitychange', function () {
      




      const mute = !C.background || C.background.muteWhenHidden !== false;
      if (document.hidden) {
        if (mute) phase('the audio', function () { GG.audio.suspend(); });
        onHide();
      } else {
        onShow();
        if (mute) phase('the audio', function () { GG.audio.resume(); });
      }
    });

    setInterval(function () {
      const B = C.background || {};
      if (B.muteWhenStalled === false || stallMuted || GG.audio.suspended()) return;
      if (performance.now() - lastFrameAt < (B.stallSec || 1.5) * 1000) return;
      stallMuted = true;
      phase('the audio', function () { GG.audio.suspend(); });
    }, 500);

    if (guardCfg().enabled) {
      window.addEventListener('error', function (e) {
        onCrash('an event handler', e.error || new Error(e.message || 'unknown error'));
      });
      window.addEventListener('unhandledrejection', function (e) {
        onCrash('a background task', e.reason || new Error('unhandled rejection'));
      });
    }

    
    
    window.addEventListener('beforeunload', function () {
      if (GG.menu.started()) S.save(true);
    });

    



    requestAnimationFrame(frame);
    console.log('%cEarth ReGen — step 2', 'color:#6fdda0;font-weight:bold');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.GG);
