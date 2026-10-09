/* Execute the actual seven page scripts with a dependency-free DOM adapter.
 * Checks state, translations and handlers; does not claim browser/layout QA.
 * Run: node tests/test_legacy_learning_i18n_dom.cjs
 */
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const { makeDOM } = require('./quest-dom.cjs');
const root = path.resolve(__dirname, '..');
const files = ['games/math1.html', 'games/math_addition_subtraction.html', 'games/math_visual_game.html', 'games/chinese_character_quiz.html', 'games/chinese_game1.html', 'shape_sorter_math.html', 'vocabulary_quiz.html'];
function create(file, options = {}) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const document = makeDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ''));
  const proto = Object.getPrototypeOf(document.body);
  const originalClosest = proto.closest;
  proto.closest = function(s) { for (const choice of s.split(',')) { const found = originalClosest.call(this, choice.trim()); if (found) return found; } return null; };
  Object.defineProperty(proto, 'id', { get() { return this.getAttribute('id') || ''; }, set(v) { this.setAttribute('id', v); } });
  Object.defineProperty(proto, 'nodeValue', { get() { return this.value; }, set(v) { this.value = v; } });
  Object.defineProperty(proto, 'classList', { get() { const element = this; return { contains: c => element.className.split(/\s+/).includes(c), add: (...names) => { element.className = [...new Set([...element.className.split(/\s+/).filter(Boolean), ...names])].join(' '); }, remove: (...names) => { element.className = element.className.split(/\s+/).filter(c => !names.includes(c)).join(' '); }, toggle: (c, value) => { const set = new Set(element.className.split(/\s+/).filter(Boolean)); (value === undefined ? !set.has(c) : value) ? set.add(c) : set.delete(c); element.className = [...set].join(' '); } }; } });
  proto.appendChild = function(n) { this.append(n); return n; };
  proto.prepend = function(n) { n.parentElement = this; this.childNodes.unshift(n); };
  proto.removeAttribute = function(k) { delete this.attributes[k]; };
  proto.remove = function() { if (this.parentElement) this.parentElement.childNodes = this.parentElement.childNodes.filter(n => n !== this); this.parentElement = null; };
  proto.removeEventListener = function(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter(listener => listener !== fn); };
  proto.animate = () => ({});
  proto.play = () => Promise.resolve();
  let context;
  proto.click = function() { if (this.disabled) return; const event = { type: 'click', target: this, currentTarget: this, preventDefault() {} }; if (this.getAttribute('onclick')) vm.runInContext(this.getAttribute('onclick'), context); this.onclick?.(event); for (let n = this; n; n = n.parentElement) for (const fn of n.listeners.click || []) { event.currentTarget = n; fn(event); } };
  document.getElementById = id => document.querySelector('#' + id);
  const documentEvents = {}, windowEvents = {};
  document.readyState = 'loading';
  document.addEventListener = (type, fn) => (documentEvents[type] ||= []).push(fn);
  let now = 0, serial = 0;
  const timers = new Map(), storage = new Map();
  const storageAPI = { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k) };
  const schedule = (fn, delay, interval) => { const id = ++serial; timers.set(id, { fn, at: now + delay, interval }); return id; };
  context = { document, console, URL, localStorage: storageAPI, sessionStorage: storageAPI, location: { href: 'https://test.invalid/' + file }, setTimeout: (fn, delay = 0) => schedule(fn, delay, 0), clearTimeout: id => timers.delete(id), setInterval: (fn, delay) => schedule(fn, delay, delay), clearInterval: id => timers.delete(id), addEventListener: (type, fn) => (windowEvents[type] ||= []).push(fn) };
  if (options.seed !== undefined) {
    let seed = options.seed >>> 0;
    context.Math = Object.create(Math);
    context.Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  }
  context.window = context;
  vm.createContext(context);
  for (const script of ['assets/i18n.js', 'assets/i18n-site.js', 'assets/i18n-legacy-learning.js']) vm.runInContext(fs.readFileSync(path.join(root, script), 'utf8'), context, { filename: script });
  if (file === 'vocabulary_quiz.html' && !options.missingBank && fs.existsSync(path.join(root, 'assets/word-bank.js'))) vm.runInContext(fs.readFileSync(path.join(root, 'assets/word-bank.js'), 'utf8'), context, { filename: 'assets/word-bank.js' });
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) if (!/\bsrc\s*=/.test(match[1])) vm.runInContext(match[2], context, { filename: file });
  for (const fn of documentEvents.DOMContentLoaded || []) fn();
  for (const fn of windowEvents.DOMContentLoaded || []) fn();
  context.onload?.();
  const refresh = () => context.KrisI18n.refresh();
  const $ = selector => document.querySelector(selector);
  const all = selector => document.querySelectorAll(selector);
  const click = selector => { assert($(selector), selector); $(selector).click(); refresh(); };
  const run = code => { const value = vm.runInContext(code, context); refresh(); return value; };
  const language = lang => { context.KrisI18n.setLanguage(lang); refresh(); };
  const advance = elapsed => { const end = now + elapsed; let turns = 0; while (true) { const next = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0]; if (!next) break; if (++turns > 10000) throw Error('Timer loop'); const [id, t] = next; now = t.at; t.interval ? t.at += t.interval : timers.delete(id); t.fn(); refresh(); } now = end; };
  refresh();
  return { $, all, click, run, language, advance, document, context };
}
function noChineseUI(g) {
  const remaining = [];
  function walk(node) { if (node.nodeType === 3) { if (!node.parentElement.closest('[translate="no"],[data-i18n-skip],[data-no-i18n],kris-reviews,noscript') && /[\u3400-\u9fff]/.test(node.nodeValue)) remaining.push(node.nodeValue.trim()); } else for (const child of node.childNodes) walk(child); }
  walk(g.document.documentElement);
  assert.deepEqual(remaining, []);
}
function plain(value) { return JSON.parse(JSON.stringify(value)); }
if (require.main === module) {
for (const file of files) {
  const g = create(file), { $, all, click, run, language, advance } = g;
  const title = $('title').textContent;
  assert.equal(all('#kris-language-bar').length, 1);
  for (const lang of ['en', 'fr']) { language(lang); noChineseUI(g); assert.notEqual($('title').textContent, title); }
  language('zh'); assert.equal($('title').textContent, title);
  if (file.endsWith('/math1.html')) {
    const initial = plain(run('({ count: gameState.currentCount, timer: gameState.timerValue, score: gameState.score })'));
    language('fr'); assert.deepEqual(plain(run('({ count: gameState.currentCount, timer: gameState.timerValue, score: gameState.score })')), initial);
    run('checkAnswer((gameState.currentCount + 1) % 11)'); assert.match($('#message').textContent, /Pas tout à fait/);
    language('en'); assert.match($('#message').textContent, /Not quite/);
    language('zh'); assert.match($('#message').textContent, /答错了/);
    advance(2100); assert.equal(run('gameState.round'), 1, 'Counting waits for the learner'); click('#count-next'); run('checkAnswer(gameState.currentCount)'); language('fr'); assert.equal($('#message').textContent, 'Bonne réponse !'); assert.equal($('#score').textContent, '1');
  }
  if (file.includes('math_addition_subtraction') || file.includes('math_visual_game')) {
    click('#start-game');
    const answers = all('.answer-options button').map(b => b.textContent), time = $('#time-left').textContent, score = $('#score').textContent;
    language('fr'); assert.deepEqual(all('.answer-options button').map(b => b.textContent), answers); assert.equal($('#time-left').textContent, time); assert.equal($('#score').textContent, score);
    assert.equal($('#decrease-timer').getAttribute('aria-label'), 'Réduire le temps');
    click('#ans1'); assert.match($('#feedback-message').textContent, /Bonne réponse|Mauvaise réponse/);
    language('en'); assert.match($('#feedback-message').textContent, /Correct|Incorrect/);
    click('#next-question'); advance(10100); assert.equal($('#feedback-message').textContent, '', 'Calm mode has no deadline'); click('#timer-mode'); advance(10100); assert.match($('#feedback-message').textContent, /Take your time/); assert(all('.answer-options button').every(b => !b.disabled), 'Reminder never ends a question');
    language('fr'); assert.match($('#feedback-message').textContent, /Prends ton temps/); click('#ans1'); assert.match($('#feedback-message').textContent, /Bonne réponse|Mauvaise réponse/);
    if (file.includes('math_visual_game')) { click('#theme-chicks'); noChineseUI(g); click('#theme-matchsticks'); noChineseUI(g); }
  }
  if (file.includes('chinese_character_quiz')) {
    const options = all('#options-container button').map(b => b.textContent);
    language('fr'); assert.deepEqual(all('#options-container button').map(b => b.textContent), options);
    run('selectAnswer("苹果")'); assert.equal($('#feedback-message').textContent, 'Bravo !');
    language('en'); assert.equal($('#score-display').textContent, 'Score: 1');
    advance(1500); assert.equal(run('currentQuestionIndex'), 0, 'Picture reading stays until Next'); click('#picture-next'); for (let i = 1; i < run('questions.length'); i++) { run('selectAnswer(questions[currentQuestionIndex].correctAnswer)'); click('#picture-next'); }
    assert.equal($('#feedback-message').textContent, 'Game over! Your total score: 6 / 6');
    language('fr'); assert.equal($('#feedback-message').textContent, 'Partie terminée ! Ton score : 6 / 6');
    click('#options-container button'); assert.equal($('#score-display').textContent, 'Score : 0');
    run('selectAnswer("香蕉")'); assert.equal($('#feedback-message').textContent, 'Mauvaise réponse. La bonne réponse est : 苹果');
  }
  if (file.includes('chinese_game1')) {
    const ids = all('.card').map(c => c.dataset.id); click('.card'); language('fr'); assert.deepEqual(all('.card').map(c => c.dataset.id), ids); assert.equal(all('.card.flipped').length, 1);
    click('#restart-button'); assert.equal(all('.card').length, 12); click('#pairs-20');
    for (const id of [...new Set(all('.card').map(c => c.dataset.id))]) {
      for (const card of all('.card').filter(c => c.dataset.id === id)) card.click();
      advance(220);
    }
    assert.equal($('#score').textContent, '200'); assert.equal($('#attempts').textContent, '20'); assert.equal($('#final-attempts').textContent, '20'); noChineseUI(g);
    language('en'); assert.match($('#win-message').textContent, /You found every pair/); assert.equal(all('.matched').length, 40);
  }
  if (file === 'shape_sorter_math.html') {
    assert.equal(all('#current-sum-display-addition').length, 1);
    run('handleDropAddition({ preventDefault() {}, dataTransfer: { getData: () => draggableShapes[0].id } })');
    const state = plain(run('({ target: targetSum, sum: currentSumInMachineAddition, ids: draggableShapes.map(s => s.id) })'));
    language('fr'); assert.equal($('#current-sum-display-addition').textContent, `Somme : ${state.sum}`);
    assert.deepEqual(plain(run('({ target: targetSum, sum: currentSumInMachineAddition, ids: draggableShapes.map(s => s.id) })')), state);
    click('#subtraction-mode-btn'); const sub = plain(run('({ target: targetSum, sum: currentSumSubtraction, ids: shapesInMachineSubtraction.map(s => s.id) })'));
    language('en'); assert.equal($('#target-label').textContent, 'Target to reach'); assert.deepEqual(plain(run('({ target: targetSum, sum: currentSumSubtraction, ids: shapesInMachineSubtraction.map(s => s.id) })')), sub);
    click('#sorting-machine .shape'); language('fr'); noChineseUI(g);
    click('#addition-mode-btn'); assert.equal($('#current-sum-display-addition').textContent, 'Somme : 0'); click('#reset-button'); assert.equal(all('#current-sum-display-addition').length, 1);
    assert.equal($('#reset-button').getAttribute('title'), 'Nouvel exercice');
  }
  if (file === 'vocabulary_quiz.html') {
    click('#mode-definition');
    language('fr'); click('.action-buttons button'); assert.equal($('#message').textContent, 'Choisis une réponse.');
    all('#options button').find(b => b.textContent === 'A round fruit with red or green skin.').click();
    const selected = $('#options .selected').textContent;
    language('zh'); assert.equal($('#word').textContent, 'Apple'); assert.equal($('#options .selected').textContent, selected);
    click('.action-buttons button'); assert.equal($('#message').textContent, '正确！'); language('en'); assert.equal($('#message').textContent, 'Correct!');
    for (let i = 0; i < 15; i++) click('#next-word');
    assert.equal($('#word').textContent, 'Quiz finished!'); language('fr'); assert.equal($('#word').textContent, 'Quiz terminé !'); assert.equal($('#next-word').textContent, 'Recommencer le quiz');
    click('#next-word'); assert.equal($('#word').textContent, 'Apple');
    all('#options button').find(b => b.textContent === 'A yellow, long fruit').click(); click('.action-buttons button');
    assert.equal($('#message').textContent, 'Mauvaise réponse. La bonne réponse était : « A round fruit with red or green skin. »');
  }
  console.log(`PASS ${file}: zh/en/fr UI, real handlers, feedback and state preservation`);
}
console.log('PASS: DOM integration only; layout, audio and native browser behavior are not asserted.');

}
module.exports = { create, noChineseUI };
