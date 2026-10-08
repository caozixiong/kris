/* Pure bilingual matching rules. No clocks, network, DOM or storage required. */
(function (root) {
  'use strict';
  function shuffle(values, random = Math.random) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  const validPair = pair => pair && typeof pair.id === 'string' && pair.id.trim() && typeof pair.en === 'string' && pair.en.trim() && typeof pair.fr === 'string' && pair.fr.trim();
  function uniquePairs(entries, count, random = Math.random) {
    if (!Array.isArray(entries) || !entries.every(validPair) || !Number.isInteger(count) || count < 1) throw new Error('Invalid vocabulary');
    const en = new Set(), fr = new Set(), result = [];
    const normalize = value => String(value).normalize('NFC').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
    for (const pair of shuffle(entries, random)) {
      const a = normalize(pair.en), b = normalize(pair.fr);
      if (!a || !b || en.has(a) || fr.has(b)) continue;
      en.add(a); fr.add(b); result.push(pair);
      if (result.length === count) return result;
    }
    throw new Error('Not enough unambiguous vocabulary pairs');
  }
  function createRound(entries, count, mode, random = Math.random) {
    if (!Array.isArray(entries) || !entries.every(validPair) || !['memory', 'bridge', 'sentences'].includes(mode) || !Number.isInteger(count) || count < 1 || count > entries.length || new Set(entries.map(e => e.id)).size !== entries.length) throw new Error('Invalid round');
    const pairs = uniquePairs(entries, count, random);
    const cards = pairs.flatMap(pair => ['en', 'fr'].map(language => ({key: pair.id + ':' + language, id: pair.id, language, text: pair[language]})));
    return {mode, pairs, cards: shuffle(cards, random), selected: [], matched: [], phase: 'active', moves: 0, hints: 0, hintIds: []};
  }
  function choose(state, key) {
    if (state.phase !== 'active') return 'ignored';
    const card = state.cards.find(c => c.key === key);
    if (!card || state.matched.includes(card.id) || state.selected.includes(key)) return 'ignored';
    const first = state.cards.find(c => c.key === state.selected[0]);
    if (first && state.mode !== 'memory' && first.language === card.language) {
      state.selected = [key]; return 'selected';
    }
    state.selected.push(key);
    if (!first) return 'selected';
    state.moves++;
    if (first.id === card.id && first.language !== card.language) {
      state.matched.push(card.id); state.selected = [];
      if (state.matched.length === state.pairs.length) state.phase = 'complete';
      return 'match';
    }
    state.phase = 'mismatch'; return 'mismatch';
  }
  function dismiss(state) {
    if (!['mismatch', 'hint'].includes(state.phase)) return false;
    state.selected = []; state.hintIds = []; state.phase = 'active'; return true;
  }
  function hint(state) {
    if (state.phase !== 'active') return null;
    const picked = state.cards.find(c => c.key === state.selected[0]);
    const pair = state.pairs.find(p => p.id === picked?.id) || state.pairs.find(p => !state.matched.includes(p.id));
    if (!pair) return null;
    state.hints++; state.selected = []; state.hintIds = [pair.id]; state.phase = 'hint'; return pair;
  }
  function readProgress(storage, key, validKeys) {
    try {
      const data = JSON.parse(storage?.getItem(key) || '{}');
      if (!data || Array.isArray(data) || typeof data !== 'object') return {};
      const result = {};
      for (const name of validKeys) {
        const record = data[name];
        if (record && Number.isInteger(record.rounds) && record.rounds > 0 && record.rounds <= 99999 && Number.isInteger(record.best) && record.best >= Number(name.split(':').pop()) && record.best <= 99999) result[name] = {rounds: record.rounds, best: record.best};
      }
      return result;
    } catch (_) { return {}; }
  }
  function recordProgress(progress, key, moves) {
    const old = progress[key];
    progress[key] = {rounds: Math.min(99999, (old?.rounds || 0) + 1), best: Math.min(old?.best || 99999, moves)};
  }
  const api = {shuffle, uniquePairs, createRound, choose, dismiss, hint, readProgress, recordProgress};
  root.BilingualCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
