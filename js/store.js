(function () {
  const GG = window.GG = window.GG || {};
  const Store = GG.store = {};
  const DB = 'earthregen', OS = 'saves';
  const mem = Object.create(null);
  let db = null, ready = false, unloading = false;

  window.addEventListener('beforeunload', function () { unloading = true; });
  window.addEventListener('pagehide', function () { unloading = true; });

  const cfg = () => (GG.config && GG.config.saveStore) || {};
  const prefix = () => (GG.config && GG.config.saveKey) || 'earthregen.save';
  Store.isSaveKey = function (k) { return typeof k === 'string' && k.indexOf(prefix()) === 0; };
  Store.ready = function () { return ready; };
  Store.mode = function () { return ready ? 'indexeddb' : 'localstorage'; };
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { localStorage.setItem(k, v); },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  const playOf = function (t) {
    try { const d = JSON.parse(t); return (d && d.g && d.g.playtime) || 0; } catch (e) { return -1; }
  };

  function idbPut(k, v, done) {
    try {
      const tx = db.transaction(OS, 'readwrite');
      if (v === null) tx.objectStore(OS).delete(k); else tx.objectStore(OS).put(v, k);
      tx.oncomplete = function () { if (done) done(true); };
      tx.onerror = tx.onabort = function () { if (done) done(false, tx.error); };
    } catch (e) { if (done) done(false, e); }
  }

  function failed(k, v, err) {
    console.warn('[ReGen] IndexedDB write failed, using localStorage', err);
    try { if (v === null) ls.del(k); else ls.set(k, v); }
    catch (e) {
      const S = GG.state;
      if (S && Store.isSaveKey(k) && k.indexOf('.bak') < 0) {
        S.saveFailed = true;
        if (GG.ui && GG.ui.saveWarn) { try { GG.ui.saveWarn(); } catch (e2) {} }
      }
    }
  }

  Store.get = function (k) {
    if (ready && Store.isSaveKey(k)) return (k in mem) ? mem[k] : ls.get(k);
    return ls.get(k);
  };
  Store.set = function (k, v) {
    v = String(v);
    if (!(ready && Store.isSaveKey(k))) { ls.set(k, v); return; }
    mem[k] = v;

    if (unloading) { try { ls.set(k, v); } catch (e) {} }
    idbPut(k, v, function (ok, err) {
      if (!ok) return failed(k, v, err);

      if (cfg().freeLocal !== false && mem[k] === v) ls.del(k);
    });
  };
  Store.remove = function (k) {
    if (ready && Store.isSaveKey(k)) { delete mem[k]; idbPut(k, null); }
    ls.del(k);
  };

  Store.keys = function () { return Object.keys(mem); };

  Store.init = function (cb) {
    let called = false;
    const go = function () { if (!called) { called = true; cb(); } };
    const c = cfg();
    if (c.enabled === false || !window.indexedDB || (window.desktop && c.desktop === false)) return go();
    const timer = setTimeout(go, c.timeoutMs || 3000);
    let req;
    try { req = indexedDB.open(DB, 1); } catch (e) { clearTimeout(timer); return go(); }
    req.onupgradeneeded = function () { try { req.result.createObjectStore(OS); } catch (e) {} };
    req.onerror = req.onblocked = function () { clearTimeout(timer); go(); };
    req.onsuccess = function () {
      if (called) { try { req.result.close(); } catch (e) {} return; }
      db = req.result;
      try {
        const tx = db.transaction(OS, 'readonly'), os = tx.objectStore(OS);
        const cur = os.openCursor();
        cur.onsuccess = function () {
          const k = cur.result;
          if (k) { mem[k.key] = k.value; k.continue(); return; }

          ready = true;
          let moved = 0;
          const lsKeys = [];
          for (let i = 0; i < localStorage.length; i++) lsKeys.push(localStorage.key(i));
          for (const key of lsKeys) {
            if (!Store.isSaveKey(key)) continue;
            const v = ls.get(key);
            if (v == null) continue;
            if (!(key in mem) || playOf(v) > playOf(mem[key]) + 1) { Store.set(key, v); moved++; }
            else if (c.freeLocal !== false) ls.del(key);
          }
          if (moved) console.log('[ReGen] moved ' + moved + ' save(s) into IndexedDB');
          clearTimeout(timer);
          go();
        };
        cur.onerror = function () { ready = false; clearTimeout(timer); go(); };
      } catch (e) { ready = false; clearTimeout(timer); go(); }
    };
  };
})();
