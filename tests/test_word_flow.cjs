/* Runs real HTML, production scripts and delegated handlers through the existing
 * dependency-free DOM adapter. Does not claim browser/layout/device verification. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {makeDOM, ROOT} = require('./quest-dom.cjs');
const pages = {memory: 'bilingual-memory', bridge: 'word-bridge', sentences: 'sentence-match'};
const copy = value => JSON.parse(JSON.stringify(value));
function createGame(mode, options = {}) {
  const file = path.join(ROOT, 'games', pages[mode] + '.html');
  const document = makeDOM(fs.readFileSync(file, 'utf8'));
  const store = options.store || new Map(), writes = [], rounds = [], roundInputs = [], records = [], timers = [], listeners = {};
  const storage = {
    getItem(key) { if (options.deniedRead) throw Error('Storage read blocked'); return store.get(key) ?? null; },
    setItem(key, value) { if (options.deniedWrite) throw Error('Storage write blocked'); if (key.startsWith('kris-word-')) writes.push([key, value]); store.set(key, value); },
    removeItem(key) { store.delete(key); }
  };
  let seed = options.seed || 192837;
  const math = Object.create(Math); math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const context = {document, console, Math: math, URL,
    location: {href: `https://example.test/games/${pages[mode]}.html${options.language ? '?lang=' + options.language : ''}`, origin: 'https://example.test'},
    addEventListener(type, listener) { (listeners[type] ??= []).push(listener); },
    setTimeout(fn) { timers.push(fn); return timers.length; }, setInterval(fn) { timers.push(fn); return timers.length; }, clearTimeout() {}, clearInterval() {}
  };
  context.window = context;
  Object.defineProperty(context, 'localStorage', {get() { if (options.deniedGetter) throw Error('Storage getter blocked'); return storage; }});
  vm.createContext(context);
  const scripts = document.querySelectorAll('script[src]');
  // Browser semantics: parser-blocking scripts before the deferred application scripts.
  for (const script of [...scripts.filter(s => !s.hasAttribute('defer')), ...scripts.filter(s => s.hasAttribute('defer'))]) {
    const src = script.getAttribute('src');
    if (options.skipBank && src.split('?')[0].endsWith('/word-bank.js')) continue;
    vm.runInContext(fs.readFileSync(path.resolve(path.dirname(file), src.split('?')[0]), 'utf8'), context, {filename: src});
    if (src.split('?')[0].endsWith('/word-core.js')) {
      const createRound = context.BilingualCore.createRound, recordProgress = context.BilingualCore.recordProgress;
      context.BilingualCore.createRound = (...args) => { const round = createRound(...args); rounds.push(round); roundInputs.push(args[0]); return round; };
      context.BilingualCore.recordProgress = (...args) => { records.push(copy(args.slice(1))); return recordProgress(...args); };
    }
  }
  document.readyState = 'interactive'; document.dispatch('DOMContentLoaded');
  const $ = selector => document.querySelector(selector), all = selector => document.querySelectorAll(selector);
  const button = (act, value) => all('button[data-act]').find(b => b.dataset.act === act && (value === undefined || b.dataset.value === String(value)));
  const click = (act, value) => { const b = button(act, value); assert(b, `Missing ${mode} ${act}:${value ?? ''}`); b.click(); };
  return {mode, file, document, context, store, writes, records, rounds, roundInputs, timers, $, all, button, click, get state() { return rounds.at(-1); }, key: 'kris-word-v1-' + mode + (options.skipBank && mode !== 'sentences' ? '-fallback' : '')};
}
function assertStateUI(g) {
  const s = g.state;
  assert(s, 'production core creates a round');
  assert.equal(g.all('button[data-act="card"]').length, s.cards.length);
  assert.equal(new Set(g.all('button[data-act="card"]').map(b => b.dataset.value)).size, s.cards.length);
  for (const card of s.cards) {
    const b = g.button('card', card.key); assert(b); assert.equal(b.getAttribute('type'), 'button');
    assert(b.textContent.trim() || b.getAttribute('aria-label'), `accessible card ${card.key}`);
    if (s.matched.includes(card.id)) assert(b.disabled, 'matched cards cannot be scored again');
    if (['mismatch','hint','complete'].includes(s.phase)) assert(b.disabled, 'locked round cards cannot be clicked');
  }
  const ids = g.all('[id]').map(n => n.id); assert.equal(ids.length, new Set(ids).size, 'rendered IDs stay unique');
  assert.equal(g.timers.length, 0, 'no hidden countdown or delayed lock');
  assert(!/\b(?:undefined|NaN)\b/.test(g.$('#word-app').textContent), 'expanded themes never render missing values');
  assert.equal(g.$('[data-stat="matched"]').textContent, `${s.matched.length} / ${s.pairs.length}`);
  assert.equal(g.$('[data-stat="moves"]').textContent, String(s.moves));
  assert.equal(g.$('[data-stat="hints"]').textContent, String(s.hints));
  assert.equal(g.$('[role="progressbar"]').getAttribute('aria-valuenow'), String(s.matched.length));
  assert.equal(g.$('[role="progressbar"]').getAttribute('aria-valuemax'), String(s.pairs.length));
  assert.equal(g.all('.word-card.is-matched').length, s.matched.length * 2);
  assert.equal(g.all('.word-card.is-selected').length, s.selected.length);
  assert.equal(g.all('.word-card.is-hinted').length, s.hintIds.length * 2);
}
function stamps(g) { return Number(g.$('[data-stat="stamps"]').textContent.split('/')[0]); }
function solve(g) {
  for (const pair of [...g.state.pairs]) if (!g.state.matched.includes(pair.id)) {
    g.click('card', pair.id + ':en'); g.click('card', pair.id + ':fr');
  }
  assert.equal(g.state.phase, 'complete'); assertStateUI(g);
  assert.equal(g.document.activeElement, g.button('next-topic'), 'win focuses the next available action');
}
function topic(g) { return g.all('button[data-act="topic"]').find(b => b.getAttribute('aria-pressed') === 'true')?.dataset.value; }
function language(g, value) {
  const before = copy(g.state), current = g.state, beforeTopic = topic(g);
  const cardOrder = g.all('button[data-act="card"]').map(b => b.dataset.value);
  const previousWrites = g.writes.length, previousRounds = g.rounds.length;
  g.context.KrisI18n.setLanguage(value);
  assert.equal(g.document.documentElement.lang, {zh:'zh-CN',en:'en',fr:'fr-CA'}[value]);
  assert.equal(g.state, current, 'language does not construct a new round');
  assert.deepEqual(copy(g.state), before, 'language preserves phase, choices, matches, hints, moves and shuffled order');
  assert.deepEqual(g.all('button[data-act="card"]').map(b => b.dataset.value), cardOrder);
  assert.equal(topic(g), beforeTopic); assert.equal(g.rounds.length, previousRounds); assert.equal(g.writes.length, previousWrites);
  assertStateUI(g);
}

let campaignRounds = 0;
for (const mode of Object.keys(pages)) {
  const g = createGame(mode);
  const topics = g.all('button[data-act="topic"]').map(b => b.dataset.value);
  const levels = g.all('button[data-act="level"]').map(b => Number(b.dataset.value));
  const curriculum = g.context.BilingualData[mode === 'sentences' ? 'sentenceTopics' : 'wordGameTopics'];
  assert.deepEqual(topics, Array.from(curriculum, t => t.id));
  assert.equal(new Set(topics).size, topics.length);
  assert.equal(g.context.BilingualData.wordTopics, g.context.KrisWordBank.topics, 'real wrapper uses the shared bank');
  assert.equal(g.context.KrisWordBank.topics.reduce((n,t) => n + t.items.length, 0), 500);
  if (mode !== 'sentences') assert.equal(topic(g), 'all-words', 'word games default to the complete shared bank');
  assert(levels.length >= 2 && levels.every(n => Number.isInteger(n) && n >= 2 && n <= 8));
  assert.equal(new Set(levels).size, levels.length); assertStateUI(g);
  let completed = 0;
  for (const theme of topics) for (const count of levels) {
    g.click('topic', theme); g.click('level', count);
    assert.equal(topic(g), theme); assert.equal(g.state.pairs.length, count);
    assert.equal(g.state.moves, 0); assert.equal(g.state.hints, 0); assert.equal(g.state.matched.length, 0);
    assert.equal(g.state.phase, 'active');
    const initialButtons = g.all('button[data-act="card"]');
    solve(g); campaignRounds++; completed++;
    assert.equal(g.state.moves, count, 'perfect play needs exactly one move per pair');
    const data = JSON.parse(g.store.get(g.key));
    assert.equal(stamps(g), Object.keys(data).length);
    assert.equal(g.$('[data-stat="best"]').textContent, String(count));
    assert.deepEqual(data[`${theme}:${count}`], {rounds:1, best:count});
    assert.equal(g.writes.length, completed);
    const current = copy(g.state), writes = g.writes.length, records = g.records.length;
    for (const old of initialButtons) old.click();
    for (const card of g.state.cards) g.click('card', card.key);
    if (g.button('hint')) g.click('hint');
    assert.deepEqual(copy(g.state), current); assert.equal(g.writes.length, writes); assert.equal(g.records.length, records);
    assert(g.button('next-topic'), 'complete round has a next-topic path');
    language(g, 'en'); assert(!/[\u3400-\u9fff]/u.test(g.$('#word-app').textContent), `${mode}/${theme}/${count} English UI`);
    language(g, 'fr'); assert(!/[\u3400-\u9fff]/u.test(g.$('#word-app').textContent), `${mode}/${theme}/${count} French UI`);
    language(g, 'zh');
  }
  const completedKeys = Object.keys(JSON.parse(g.store.get(g.key)));
  assert.equal(completedKeys.length, topics.length * levels.length);
  const lastTheme = topic(g), lastCount = g.state.pairs.length, writes = g.writes.length;
  g.click('restart'); assert.equal(topic(g), lastTheme); assert.equal(g.state.pairs.length, lastCount);
  assert.equal(g.state.moves, 0); assert.equal(g.state.matched.length, 0); assert.equal(g.writes.length, writes);
  solve(g); assert.equal(g.writes.length, writes + 1);
  assert.deepEqual(JSON.parse(g.store.get(g.key))[`${lastTheme}:${lastCount}`], {rounds:2,best:lastCount});
  assert.equal(Object.keys(JSON.parse(g.store.get(g.key))).length, completedKeys.length, 'replay adds a round, not a new passport stamp');
  const resumed = createGame(mode, {store:g.store});
  assert.equal(stamps(resumed), topics.length * levels.length);
  assert.equal(resumed.writes.length, 0, 'restore does not rewrite progress'); assert.equal(resumed.state.matched.length, 0);
  assert.equal(resumed.state.moves, 0); assert.equal(resumed.state.phase, 'active');
  const oldNext = g.button('next-topic'); oldNext.click();
  assert.equal(topic(g), topics[(topics.indexOf(lastTheme) + 1) % topics.length]);
  assert.equal(g.state.phase, 'active'); const nextRound = g.state; oldNext.click(); assert.equal(g.state, nextRound, 'detached Next cannot skip themes');
}
console.log(`PASS: ${campaignRounds} complete topic/difficulty rounds through real wrappers, once-only writes, repeat-round best scores, restored progress, next-topic and stale completion clicks.`);

for (const mode of Object.keys(pages)) {
  const g = createGame(mode);
  const [a,b,c] = g.state.pairs;
  const first = g.button('card', a.id + ':en');
  // A child span bubbles to the same real delegated handler.
  (first.children[0] || first).click();
  assert.deepEqual(copy(g.state.selected), [a.id + ':en']); assert.equal(g.state.moves, 0);
  const oldFirst = first, selected = copy(g.state);
  oldFirst.click(); g.click('card', a.id + ':en'); assert.deepEqual(copy(g.state), selected, 'same-card rapid repeat ignored');
  for (const lang of ['en','fr','zh']) language(g, lang);
  g.click('card', a.id + ':fr'); assert.equal(g.state.matched.length, 1); assert.equal(g.state.moves, 1);
  for (const lang of ['fr','en','zh']) language(g, lang);
  g.click('card', b.id + ':en'); g.click('card', c.id + ':fr');
  assert.equal(g.state.phase, 'mismatch'); assert.equal(g.document.activeElement, g.button('continue')); assert.equal(g.state.moves, 2); assert.equal(g.state.matched.length, 1);
  assertStateUI(g);
  const mismatch = copy(g.state), beforeWrites = g.writes.length;
  for (const card of g.state.cards) g.click('card', card.key);
  g.click('hint'); assert.deepEqual(copy(g.state), mismatch); assert.equal(g.writes.length, beforeWrites);
  for (const lang of ['en','fr','zh']) language(g, lang);
  const staleContinue = g.button('continue'); assert(staleContinue); staleContinue.click();
  assert.equal(g.state.phase, 'active'); assert.equal(g.state.selected.length, 0); assert.equal(g.state.moves, 2);
  assert.equal(g.state.matched.length, 1);
  g.click('card', b.id + ':fr'); const moves = g.state.moves;
  g.click('hint'); assert.equal(g.state.phase, 'hint'); assert.equal(g.document.activeElement, g.button('continue')); assert.equal(g.state.hints, 1);
  assert.deepEqual(copy(g.state.hintIds), [b.id]); assert.equal(g.state.matched.length, 1); assert.equal(g.state.moves, moves);
  assertStateUI(g);
  const hint = copy(g.state);
  for (const card of g.state.cards) g.click('card', card.key);
  g.click('hint'); staleContinue.click(); assert.deepEqual(copy(g.state), hint, 'old mismatch Continue cannot dismiss current hint');
  for (const lang of ['en','fr','zh']) language(g, lang);
  g.click('continue'); assert.equal(g.state.phase, 'active'); assert.equal(g.document.activeElement, g.button('hint')); assert.equal(g.state.hintIds.length, 0); assert.equal(g.state.matched.length, 1);
  g.click('card', b.id + ':en'); g.click('card', b.id + ':fr'); assert.equal(g.state.matched.length, 2); assert.equal(g.state.moves, moves + 1);
  solve(g); assert.equal(g.writes.length, 1); assert.equal(g.state.hints, 1);
  const record = JSON.parse(g.store.get(g.key))[`${topic(g)}:${g.state.pairs.length}`];
  assert.equal(record.best, g.state.pairs.length + 1, 'a mismatch adds exactly one move; hint adds none');
  // Fresh round controls must not carry selected/locked/completed state across resets.
  for (const phase of ['selected','mismatch','hint','complete']) {
    g.click('restart'); const [x,y] = g.state.pairs;
    if (phase === 'selected') g.click('card', x.id + ':en');
    if (phase === 'mismatch') { g.click('card', x.id + ':en'); g.click('card', y.id + ':fr'); }
    if (phase === 'hint') g.click('hint');
    if (phase === 'complete') solve(g);
    const oldCard = g.button('card', x.id + ':en'), restart = g.button('restart'), oldContinue = g.button('continue');
    const writeCount = g.writes.length; restart.click(); const reset = g.state, saved = copy(reset);
    oldCard.click(); restart.click(); oldContinue?.click();
    assert.equal(g.state, reset); assert.deepEqual(copy(g.state), saved, `stale ${phase} controls ignored after reset`);
    assert.equal(g.state.phase, 'active'); assert.equal(g.state.moves, 0); assert.equal(g.state.hints, 0);
    assert.equal(g.state.selected.length, 0); assert.equal(g.state.matched.length, 0); assert.equal(g.state.hintIds.length, 0);
    assert.equal(g.writes.length, writeCount); assert.equal(g.document.activeElement, g.$('#round-title')); assertStateUI(g);
  }
}
console.log('PASS: nested/rapid/detached clicks, partial-match language changes, mismatch and hint Continue locks, hint without credit, all reset phases, unchanged bilingual card order and state in Chinese/English/French.');

for (const mode of ['bridge','sentences']) {
  const g = createGame(mode), [a,b] = g.state.pairs;
  g.click('card', a.id + ':en'); g.click('card', b.id + ':en');
  assert.equal(g.state.moves, 0); assert.deepEqual(copy(g.state.selected), [b.id + ':en']);
  g.click('card', b.id + ':fr'); assert.equal(g.state.moves, 1); assert.deepEqual(copy(g.state.matched), [b.id]);
  for (const lang of ['en','fr','zh']) {
    language(g, lang);
    for (const card of g.state.cards) {
      assert(g.button('card', card.key).textContent.includes(card.text), `${mode}/${lang} keeps ${card.language} teaching text`);
    }
  }
}
{
  const g = createGame('memory'), [a,b] = g.state.pairs;
  for (const card of g.state.cards) assert(!g.button('card', card.key).textContent.includes(card.text), 'face-down word is not revealed');
  g.click('card', a.id + ':en'); assert(g.button('card', a.id + ':en').textContent.includes(a.en));
  g.click('card', b.id + ':en'); assert.equal(g.state.phase, 'mismatch'); assert.equal(g.state.moves, 1);
  assert(g.button('card', a.id + ':en').textContent.includes(a.en)); assert(g.button('card', b.id + ':en').textContent.includes(b.en));
  g.click('continue'); assert(!g.button('card', a.id + ':en').textContent.includes(a.en));
  g.click('hint'); const pair = g.state.pairs.find(p => g.state.hintIds.includes(p.id));
  for (const lang of ['en','fr','zh']) { language(g, lang); assert(g.button('card', pair.id + ':en').textContent.includes(pair.en)); assert(g.button('card', pair.id + ':fr').textContent.includes(pair.fr)); }
  g.click('continue'); assert(!g.button('card', pair.id + ':en').textContent.includes(pair.en));
}
console.log('PASS: bridge/sentence same-side replacement without a move; memory face-down concealment, persistent mismatch reveal, explicit hide, and one-pair bilingual hint.');

let storageCampaigns = 0;
for (const mode of Object.keys(pages)) {
  for (const options of [{deniedGetter:true}, {deniedRead:true}, {deniedWrite:true}, {deniedRead:true,deniedWrite:true}]) {
    const g = createGame(mode, options);
    const themes = g.all('button[data-act="topic"]').map(b => b.dataset.value), counts = g.all('button[data-act="level"]').map(b => Number(b.dataset.value));
    assert.equal(stamps(g), 0);
    for (const theme of themes) for (const count of counts) {
      g.click('topic', theme); g.click('level', count); g.click('hint'); g.click('continue'); solve(g); storageCampaigns++;
      assert.equal(stamps(g), g.records.length);
      assert.equal(g.$('[data-stat="best"]').textContent, String(count));
      for (const lang of ['en','fr','zh']) language(g, lang);
      const expectedWrites = options.deniedGetter || options.deniedWrite ? 0 : g.records.length;
      assert.equal(g.writes.length, expectedWrites);
      const beforeRecords = g.records.length;
      for (const card of g.state.cards) g.click('card', card.key);
      assert.equal(g.records.length, beforeRecords, 'failed persistence does not lead to duplicate completion recording');
    }
    if (options.deniedGetter || options.deniedWrite) assert(g.$('.storage-note').textContent.includes('浏览器未能保存'));
    const round = g.state; g.click('restart'); assert.notEqual(g.state, round); assert.equal(stamps(g), themes.length * counts.length);
  }
  const probe = createGame(mode), theme = topic(probe), count = probe.state.pairs.length, progressKey = `${theme}:${count}`;
  const corruptValues = ['broken', 'null', 'true', '42', '"string"', '[]', '[0,1]'];
  for (const value of corruptValues) {
    const g = createGame(mode, {store:new Map([[probe.key,value]])});
    assert.equal(stamps(g), 0); solve(g); assert.deepEqual(JSON.parse(g.store.get(g.key)), {[progressKey]:{rounds:1,best:count}});
  }
  const otherThemes = probe.all('button[data-act="topic"]').map(b => b.dataset.value).filter(value => value !== theme);
  const data = {[progressKey]:{rounds:5,best:count+2,extra:'discard'}, [`${theme}:999`]:{rounds:5,best:999}, [`${otherThemes[0]}:${count}`]:{rounds:-1,best:count}, [`${otherThemes[1]}:${count}`]:{rounds:1,best:count-1}, 'unknown:4':{rounds:1,best:4}, constructor:{rounds:1,best:4}};
  const g = createGame(mode, {store:new Map([[probe.key,JSON.stringify(data)]])});
  assert.equal(stamps(g), 1); assert.equal(g.$('[data-stat="best"]').textContent, String(count+2));
  solve(g); assert.equal(stamps(g), 1); assert.deepEqual(JSON.parse(g.store.get(g.key)), {[progressKey]:{rounds:6,best:count}});
  assert.equal({}.polluted, undefined);
  const french = createGame(mode, {language:'fr'}); assert.equal(french.context.KrisI18n.language, 'fr');
  assert.equal(french.document.documentElement.lang, 'fr-CA'); assert(!/[\u3400-\u9fff]/u.test(french.$('#word-app').textContent));
}
console.log(`PASS: ${storageCampaigns} complete topic/difficulty rounds with denied storage getter/read/write; in-memory passport and best scores, no retry scoring, corrupt/mixed schema sanitization, initial French interface.`);

// Focus, persistent announcements and displayed score are checked independently of state internals.
for (const mode of Object.keys(pages)) {
  const g = createGame(mode), announcement = g.$('#word-announcement');
  assert(announcement && !g.$('#word-app').contains(announcement));
  assert.equal(announcement.getAttribute('role'), 'status'); assert.equal(announcement.getAttribute('aria-live'), 'polite');
  assert.equal(announcement.textContent, '', 'no unsolicited initial announcement');
  const [a,b] = g.state.pairs;
  g.click('card', a.id + ':en'); assert.equal(g.document.activeElement, g.button('card', a.id + ':en'));
  assert.equal(g.$('#word-announcement'), announcement); assert.equal(announcement.textContent, g.$('#word-feedback').textContent);
  g.click('card', a.id + ':fr'); assert.equal(g.document.activeElement.dataset.act, 'card'); assert(!g.document.activeElement.disabled);
  assert(g.$('#word-app').contains(g.document.activeElement));
  assert.equal(announcement.textContent, g.$('#word-feedback').textContent);
  const previous = announcement.textContent; language(g, 'fr'); assert.equal(g.$('#word-announcement'), announcement);
  assert.equal(announcement.textContent, previous, 'language change does not reannounce a match');
  g.click('card', b.id + ':en'); assert(!/[\u3400-\u9fff]/u.test(announcement.textContent), 'next user action announces in current language');
  g.click('hint'); assert.equal(g.document.activeElement, g.button('continue')); assert.equal(announcement.textContent, g.$('#word-feedback').textContent);
}
console.log('PASS: displayed scores/progress/matched states; actionable keyboard focus; persistent polite live region without duplicate win announcements.');

const crypto = require('node:crypto');
for (const [mode, slug] of Object.entries(pages)) {
  const file = path.join(ROOT, 'games', slug + '.html'), source = fs.readFileSync(file,'utf8'), doc = makeDOM(source);
  assert.equal(doc.body.dataset.wordGame, mode); assert(doc.querySelector('#word-app')); assert(doc.querySelector('noscript'));
  assert(doc.querySelector('meta[name="viewport"]')); assert(doc.querySelector('title').textContent.trim());
  assert.equal(doc.querySelectorAll('kris-reviews').length, 1); assert.equal(doc.querySelector('kris-reviews').dataset.game, slug);
  const sources = doc.querySelectorAll('script[src]').map(s => s.getAttribute('src').split('?')[0]);
  for (const asset of ['i18n.js','i18n-site.js','i18n-reviews.js','word-bank.js','word-data.js','word-core.js','word-games.js','reviews/config.js','reviews/reviews.js']) assert(sources.includes('../assets/' + asset));
  assert(sources.indexOf('../assets/word-bank.js') < sources.indexOf('../assets/word-data.js'), 'shared bank loads before game data');
  assert(sources.indexOf('../assets/word-data.js') < sources.indexOf('../assets/word-games.js'));
  assert(sources.indexOf('../assets/word-core.js') < sources.indexOf('../assets/word-games.js'));
  for (const element of doc.querySelectorAll('script[src],link[href]')) {
    const url = element.getAttribute('src') || element.getAttribute('href');
    assert(!/^https?:|^\/\//.test(url), 'local runtime dependencies only');
    const asset = path.resolve(path.dirname(file), url.split('?')[0]); assert(fs.existsSync(asset), url);
    if (url.includes('?v=')) assert.equal(url.split('?v=')[1], crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex').slice(0,12));
  }
  const g = createGame(mode);
  for (const anchor of g.all('a[href]')) {
    const href = anchor.getAttribute('href');
    if (href.startsWith('#')) assert(g.document.getElementById(href.slice(1)), href);
    else if (!/^https?:|^\/\//.test(href)) assert(fs.existsSync(path.resolve(path.dirname(file), href.split('#')[0].split('?')[0])), href);
  }
  for (const other of Object.values(pages).filter(s => s !== slug)) assert(g.$(`a[href="${other}.html"]`), 'links to both sibling games');
  const backend = fs.readFileSync(path.join(ROOT, 'supabase/functions/game-reviews/core.mjs'),'utf8');
  assert(backend.includes(`'${slug}'`), 'review backend recognizes canonical game ID');
}
const css = fs.readFileSync(path.join(ROOT,'assets/word-games.css'),'utf8');
for (const cls of ['topic-button','level-button','word-card','primary-button','hint-button','quiet-button']) {
  const sizes = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([,selector]) => selector.split(',').some(value => value.trim() === '.' + cls)).flatMap(([, ,body]) => [...body.matchAll(/min-height\s*:\s*(\d+(?:\.\d+)?)px/g)].map(m => Number(m[1])));
  assert(sizes.length && sizes.every(n => n >= 44), `${cls} has no target height below 44px`);
}
assert(/\.level-button\{[^}]*min-width\s*:\s*44px/.test(css), 'difficulty buttons must have a 44px minimum width as well as height');
assert(css.includes(':focus-visible')); assert(css.includes('@media(prefers-reduced-motion:no-preference)'));
assert(css.includes('@media(max-width:700px)')); assert(css.includes('@media(max-width:360px)')); assert(css.includes('overflow-wrap:anywhere'));
const gameCode = fs.readFileSync(path.join(ROOT,'assets/word-games.js'),'utf8');
assert(!/\b(?:setTimeout|setInterval|fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/.test(gameCode), 'matching gameplay has no timers or network calls');
console.log('PASS: wrapper IDs, local assets and available cache hashes, sibling/home links, review integration, focus/reduced-motion/responsive CSS and 44px target declarations. DOM/static testing only; no browser, layout, touch or screen-reader QA claim.');

for (const mode of Object.keys(pages)) for (const phase of ['selected','mismatch','hint']) for (const action of ['topic','level']) {
  const g = createGame(mode), [a,b,c] = g.state.pairs;
  g.click('card', a.id + ':en'); g.click('card', a.id + ':fr');
  if (phase === 'selected') g.click('card', b.id + ':en');
  if (phase === 'mismatch') { g.click('card', b.id + ':en'); g.click('card', c.id + ':fr'); }
  if (phase === 'hint') g.click('hint');
  const oldCard = g.button('card', b.id + ':en'), oldContinue = g.button('continue'), oldRound = g.state;
  const values = g.all(`button[data-act="${action}"]`).map(button => button.dataset.value);
  const destination = values[1]; g.click(action, destination);
  assert.notEqual(g.state, oldRound); assert.equal(g.state.phase, 'active'); assert.equal(g.state.matched.length, 0);
  assert.equal(g.state.moves, 0); assert.equal(g.state.hints, 0); assert.equal(g.state.selected.length, 0);
  assert.equal(g.state.hintIds.length, 0); assert.equal(g.writes.length, 0); assert.equal(stamps(g), 0);
  assert.equal(g.document.activeElement, g.$('#round-title'));
  if (action === 'topic') assert.equal(topic(g), destination); else assert.equal(g.state.pairs.length, Number(destination));
  const current = copy(g.state); oldCard.click(); oldContinue?.click(); assert.deepEqual(copy(g.state), current);
  assertStateUI(g);
}
console.log('PASS: theme/difficulty navigation interrupts partial selection, mismatch and hint phases cleanly, with no accidental scoring or stale controls.');

for (const mode of ['memory','bridge']) {
  const g = createGame(mode), seen = new Set(), themes = new Set(), decks = new Set();
  const mixed = g.context.BilingualData.wordGameTopics[0];
  assert.equal(mixed.id, 'all-words'); assert.equal(mixed.items.length, 500);
  for (let replay = 0; replay < 100; replay++) {
    assert.equal(topic(g), 'all-words'); assert.equal(g.roundInputs.at(-1), mixed.items, 'real UI passes all 500 bank entries to the sampler');
    for (const pair of g.state.pairs) { seen.add(pair.id); themes.add(pair.theme); }
    decks.add(g.state.pairs.map(p => p.id).sort().join(','));
    g.click('restart');
  }
  assert(seen.size > 64, `real ${mode} replay does not remain within the former compact vocabulary`);
  assert(themes.size >= Math.min(4, g.context.KrisWordBank.topics.length), `real ${mode} replay mixes bank themes`);
  assert(decks.size > 90, `real ${mode} replay shuffles to fresh subsets`);
  assert.equal(stamps(g), 0); assert.equal(g.writes.length, 0, 'shuffle alone never earns progress');
}
console.log('PASS: 200 real whole-bank reset actions use the complete 500-entry pool, draw changing mixed-theme subsets, and do not award progress.');

for (const mode of ['memory','bridge']) {
  const key = 'kris-word-v1-' + mode;
  const existing = JSON.stringify({'animals:4':{rounds:2,best:4}, 'numbers:8':{rounds:7,best:9}, 'all-words:4':{rounds:3,best:4}});
  const store = new Map([[key, existing]]), g = createGame(mode, {skipBank:true, store});
  assert.equal(g.context.KrisWordBank, undefined, 'failed bank request leaves no shared bank API');
  assert.equal(g.context.BilingualData.wordTopics.reduce((n,t) => n + t.items.length, 0), 32);
  assert.equal(g.roundInputs.at(-1).length, 32); assert.equal(topic(g), 'all-words');
  assert.equal(g.key, key + '-fallback'); assert.equal(stamps(g), 0, 'fallback progress does not adopt only a subset of the full-bank passport');
  const themes = g.all('button[data-act="topic"]').map(b => b.dataset.value), counts = g.all('button[data-act="level"]').map(b => Number(b.dataset.value));
  assert.equal(themes.length, 5);
  for (const theme of themes) for (const count of counts) {
    g.click('topic', theme); g.click('level', count); solve(g);
    assert.equal(store.get(key), existing, 'fallback completion never overwrites full-bank saved progress');
    assert(g.writes.every(([destination]) => destination === key + '-fallback'));
  }
  assert.equal(stamps(g), themes.length * counts.length);
  const fallbackProgress = store.get(key + '-fallback'); assert(fallbackProgress);
  const fullBank = createGame(mode, {store});
  assert.equal(fullBank.roundInputs.at(-1).length, 500); assert.equal(stamps(fullBank), 3);
  assert.equal(store.get(key), existing); assert.equal(store.get(key + '-fallback'), fallbackProgress);
}
{
  const key = 'kris-word-v1-sentences', store = new Map([[key, JSON.stringify({'morning:3':{rounds:2,best:3}})]]);
  const g = createGame('sentences', {skipBank:true, store});
  assert.equal(g.key, key); assert.equal(g.context.BilingualData.sentenceTopics.reduce((n,t) => n + t.items.length, 0), 32);
  assert.equal(stamps(g), 1); solve(g); assert.deepEqual(JSON.parse(store.get(key))['morning:3'], {rounds:3,best:3});
  assert.equal(store.has(key + '-fallback'), false, 'sentence progress remains independent of word-bank loading');
}
console.log('PASS: omitted bank asset keeps all 32 fallback words playable, isolates fallback storage from full-bank passports, and preserves ordinary sentence progress.');
