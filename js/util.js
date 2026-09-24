
window.GG = window.GG || {};
GG.util = (function () {
  'use strict';
  const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];

  



  function fmt(v, dec, down) {
    if (v === Infinity) return '∞';
    if (v === null || v === undefined || isNaN(v)) return '0';
    const neg = v < 0; v = Math.abs(v);
    const cut = function (x, d) {
      if (!down || neg) return x.toFixed(d);
      const p = Math.pow(10, d);
      return (Math.floor((x + EPS) * p) / p).toFixed(d);
    };
    let out;
    if (v < 1000) {
      const d = dec !== undefined ? dec : (v < 10 && v % 1 !== 0 ? 2 : (v % 1 !== 0 ? 1 : 0));
      out = cut(v, d);
      if (out.indexOf('.') > -1) out = out.replace(/\.?0+$/, '');
    } else {
      let i = 0;
      while (v >= 1000 && i < SUFFIX.length - 1) { v /= 1000; i++; }
      out = cut(v, v < 10 ? 2 : (v < 100 ? 1 : 0)) + SUFFIX[i];
    }
    return (neg ? '-' : '') + out;
  }

  function time(sec) {
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h ? h + 'h ' : '') + (h || m ? m + 'm ' : '') + s + 's';
  }

  





  function eta(sec) {
    sec = Math.max(0, Math.ceil(sec));
    if (sec < 60) return sec + 's';
    if (sec < 3600) return Math.floor(sec / 60) + 'm ' + (sec % 60) + 's';
    return Math.floor(sec / 3600) + 'h ' + Math.floor((sec % 3600) / 60) + 'm';
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  


  const EPS = 1e-9;
  function canAfford(have, cost) { return have >= cost - EPS; }
  function pay(have, cost) { return Math.max(0, have - cost); }

  

  function kg(v) {
    if (v === Infinity) return '∞ kg';
    if (v < 10) return v.toFixed(2) + ' kg';
    return fmt(v) + ' kg';
  }

  

  function small(v) {
    if (v >= 1) return fmt(v);
    return v.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  }

  


  function cur(id, v, dec) {
    const c = GG.config.currencies[id];
    return c.prefixed ? c.short + fmt(v, dec) : fmt(v, dec) + ' ' + c.short;
  }
  
  function curRange(id, v, cap, dec) {
    const c = GG.config.currencies[id];
    const pair = fmt(v, dec) + ' / ' + fmt(cap);
    return c.prefixed ? c.short + pair : pair + ' ' + c.short;
  }

  
  function gameTime(hours) {
    const hpd = GG.config.time.hoursPerDay;
    const day = Math.floor(hours / hpd) + 1;
    const h = Math.floor(hours % hpd);
    return 'Day ' + day + ' · ' + String(h).padStart(2, '0') + ':00';
  }

  






  let mqNoMouse = null;
  function noMouse() {
    try {
      if (!mqNoMouse) mqNoMouse = matchMedia('(hover: none) and (pointer: coarse)');
      return !!mqNoMouse.matches;
    } catch (e) { return false; }   
  }


  




















  function calc(src) {
    if (typeof src === 'number') return isFinite(src) ? src : null;
    const raw = String(src === null || src === undefined ? '' : src).trim();
    if (!raw) return null;
    
    if (!/^[-+*/()., 0-9]+$/.test(raw)) return null;
    const t = raw.replace(/,/g, '.');
    let i = 0;
    const ws = function () { while (i < t.length && t.charAt(i) === ' ') i++; };
    let expr, term, factor;
    factor = function () {
      ws();
      const c = t.charAt(i);
      if (c === '+') { i++; return factor(); }
      if (c === '-') { i++; const v = factor(); return v === null ? null : -v; }
      if (c === '(') {
        i++;
        const v = expr();
        ws();
        if (v === null || t.charAt(i) !== ')') return null;
        i++;
        return v;
      }
      const m = /^[0-9]*[.]?[0-9]+/.exec(t.slice(i));
      if (!m) return null;
      i += m[0].length;
      return parseFloat(m[0]);
    };
    term = function () {
      let v = factor();
      if (v === null) return null;
      for (;;) {
        ws();
        const op = t.charAt(i);
        if (op !== '*' && op !== '/') return v;
        i++;
        const r = factor();
        if (r === null) return null;
        if (op === '/' && r === 0) return null;   
        v = op === '*' ? v * r : v / r;
      }
    };
    expr = function () {
      let v = term();
      if (v === null) return null;
      for (;;) {
        ws();
        const op = t.charAt(i);
        if (op !== '+' && op !== '-') return v;
        i++;
        const r = term();
        if (r === null) return null;
        v = op === '+' ? v + r : v - r;
      }
    };
    const v = expr();
    ws();
    if (v === null || i !== t.length || !isFinite(v)) return null;   
    return v;
  }

  return { calc: calc,
    fmt: fmt, time: time, eta: eta, clamp: clamp, kg: kg, gameTime: gameTime, small: small,
    cur: cur, curRange: curRange,
    canAfford: canAfford, pay: pay, EPS: EPS,
    noMouse: noMouse,
  };
})();
