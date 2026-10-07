/* Shared, dependency-free math and speech helpers. Also loaded by Node tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KrisMath = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DIGITS = '零一二三四五六七八九';
  function chineseNumber(n) {
    if (!Number.isInteger(n) || n < 0 || n > 100) throw new RangeError('Expected 0–100');
    if (n === 100) return '一百';
    if (n < 10) return DIGITS[n];
    const tens = Math.floor(n / 10), units = n % 10;
    return (tens === 1 ? '' : DIGITS[tens]) + '十' + (units ? DIGITS[units] : '');
  }
  function mnemonic(a, b) {
    if (![a, b].every(n => Number.isInteger(n) && n >= 1 && n <= 10)) throw new RangeError('Factors must be 1–10');
    if (a === 10 || b === 10) return `${chineseNumber(a)}乘${chineseNumber(b)}等于${chineseNumber(a * b)}`;
    const product = a * b;
    return DIGITS[Math.min(a, b)] + DIGITS[Math.max(a, b)] + (product < 10 ? '得' : '') + (product === 10 ? '一十' : chineseNumber(product));
  }
  function shuffle(items, random = Math.random) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function makeDeck(mode, range, random = Math.random) {
    const pool = [];
    const max = mode === 'addition' ? Number(range) : 10;
    if (![10, 20].includes(max)) throw new RangeError('Invalid range');
    const table = mode === 'multiplication' && range !== 'all' ? Number(range) : null;
    if (table !== null && (!Number.isInteger(table) || table < 1 || table > 10)) throw new RangeError('Invalid table');
    for (let a = 1; a <= max; a++) for (let b = 1; b <= max; b++) {
      if (table !== null && a !== table) continue;
      pool.push({ a, b, answer: mode === 'addition' ? a + b : a * b });
    }
    return shuffle(pool, random).slice(0, 6);
  }
  function choices(answer, max, random = Math.random) {
    const values = new Set([answer]);
    for (const offset of shuffle([-10, -2, -1, 1, 2, 10], random)) {
      const n = answer + offset;
      if (n >= 1 && n <= max) values.add(n);
      if (values.size === 4) break;
    }
    for (let n = 1; values.size < 4; n++) values.add(n);
    return shuffle(Array.from(values), random);
  }
  function parseAnswer(value) {
    const text = String(value).trim();
    return /^\d{1,3}$/.test(text) ? Number(text) : null;
  }
  function createSpeech(env, onStatus = () => {}) {
    const synth = env.speechSynthesis;
    const supported = Boolean(synth && env.SpeechSynthesisUtterance);
    let muted = false, current = null, timeout = null, generation = 0, voices = [];
    const timers = { set: env.setTimeout.bind(env), clear: env.clearTimeout.bind(env) };
    function refreshVoices() {
      try { voices = supported ? synth.getVoices() : []; } catch (_) { voices = []; }
    }
    function stop() {
      generation++;
      if (timeout !== null) timers.clear(timeout);
      timeout = null;
      current = null;
      if (supported) { try { synth.cancel(); } catch (_) {} }
      onStatus(muted ? 'muted' : (supported ? 'ready' : 'unsupported'));
    }
    function speak(text, lang = 'zh-CN') {
      stop();
      if (muted) { onStatus('muted'); return false; }
      if (!supported) { onStatus('unsupported'); return false; }
      refreshVoices();
      const token = generation;
      try {
        current = new env.SpeechSynthesisUtterance(text);
        current.lang = lang;
        current.rate = lang.startsWith('zh') ? 0.82 : 0.9;
        current.pitch = 1.08;
        const preferred = voices.find(v => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase()) ||
          voices.find(v => v.lang.toLowerCase().startsWith(lang.slice(0, 2)));
        if (preferred) current.voice = preferred;
        else if (voices.length) { current = null; onStatus('noVoice'); return false; }
        current.onstart = () => { if (token === generation) { timers.clear(timeout); timeout = null; onStatus('speaking'); } };
        current.onend = () => { if (token === generation) { timers.clear(timeout); timeout = null; current = null; onStatus('ready'); } };
        current.onerror = event => {
          if (token === generation) {
            timers.clear(timeout); timeout = null; current = null;
            // Only platform diagnostics: never log the spoken text or user input.
            env.console?.warn?.('Kris math speech unavailable: ' + JSON.stringify({ error: event?.error || 'unknown', availableVoices: voices.length }));
            onStatus('failed');
          }
        };
        onStatus('starting');
        timeout = timers.set(() => { if (token === generation) { stop(); onStatus('failed'); } }, 5000);
        // Synchronous inside answer/replay click or submit: preserves iOS user activation.
        // Never queue speech in a timeout or autoplay on page load.
        if (synth.paused) synth.resume();
        synth.speak(current);
        return true;
      } catch (_) { stop(); onStatus('failed'); return false; }
    }
    refreshVoices();
    if (supported && synth.addEventListener) synth.addEventListener('voiceschanged', refreshVoices);
    return { supported, speak, stop, setMuted(value) { muted = Boolean(value); stop(); onStatus(muted ? 'muted' : (supported ? 'ready' : 'unsupported')); },
      destroy() { stop(); if (supported && synth.removeEventListener) synth.removeEventListener('voiceschanged', refreshVoices); } };
  }
  return { chineseNumber, mnemonic, shuffle, makeDeck, choices, parseAnswer, createSpeech };
}));
