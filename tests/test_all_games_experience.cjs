/* Independent 26-page experience regression.
 * Executes production HTML and JS with the dependency-free DOM adapter.
 * This is NOT a browser, layout, touch, screen-reader or real-audio check.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { makeDOM, ROOT } = require('./quest-dom.cjs');
const GAMES = [
  'addition_game', 'multiplication_game', 'shape_sorter_math', 'vocabulary_quiz',
  'bilingual-memory', 'word-bridge', 'sentence-match', 'chinese_character_quiz', 'chinese_game1',
  'chinese-first-words', 'chinese-picture-match', 'chinese-word-builder',
  'math-orbit', 'english-ruins', 'french-market', 'circuit-lab',
  'math1', 'math234', 'math567', 'math8', 'math9', 'math10',
  'math_addition_subtraction', 'math_visual_game', 'math_chinese', 'math_english'
];
const ROOT_GAMES = new Set(['addition_game', 'multiplication_game', 'shape_sorter_math', 'vocabulary_quiz']);
const pagePath = name => `${ROOT_GAMES.has(name) ? '' : 'games/'}${name}.html`;
const plain = value => JSON.parse(JSON.stringify(value));
function boot(name, options = {}) {
  const relative = pagePath(name), file = path.join(ROOT, relative), html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const document = makeDOM(html.replace(/&copy;/g, '©').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ''));
  const proto = Object.getPrototypeOf(document.body), documentEvents = {}, windowEvents = {};
  let context;
  Object.defineProperties(proto, {
    parentNode: { get() { return this.parentElement; } },
    previousElementSibling: { get() { const siblings = this.parentElement?.children || []; return siblings[siblings.indexOf(this) - 1] || null; } },
    nextElementSibling: { get() { const siblings = this.parentElement?.children || []; return siblings[siblings.indexOf(this) + 1] || null; } },
    classList: { get() { const node = this; const change = (items, add) => { const s = new Set(node.className.split(/\s+/).filter(Boolean)); items.forEach(v => add ? s.add(v) : s.delete(v)); node.className = [...s].join(' '); }; return { contains: c => node.className.split(/\s+/).includes(c), add: (...items) => change(items, true), remove: (...items) => change(items, false), toggle: (c, on) => change([c], on === undefined ? !node.className.split(/\s+/).includes(c) : on) }; } }
  });
  for (const attribute of ['src', 'alt', 'type', 'role']) Object.defineProperty(proto, attribute, { get() { return this.getAttribute(attribute) || ''; }, set(value) { this.setAttribute(attribute, value); } });
  const originalClosest = proto.closest;
  proto.closest = function(selector) { for (const part of selector.split(',')) { const result = originalClosest.call(this, part.trim()); if (result) return result; } return null; };
  proto.appendChild = function(node) { this.append(node); return node; };
  proto.removeChild = function(node) { const i = this.childNodes.indexOf(node); if (i >= 0) this.childNodes.splice(i, 1); node.parentElement = null; return node; };
  proto.remove = function() { this.parentElement?.removeChild(this); };
  proto.after = function(node) { const parent = this.parentElement; if (!parent) return; node.remove(); parent.childNodes.splice(parent.childNodes.indexOf(this) + 1, 0, node); node.parentElement = parent; };
  proto.insertBefore = function(node, before) { node.remove(); const i = this.childNodes.indexOf(before); if (i < 0) this.append(node); else { this.childNodes.splice(i, 0, node); node.parentElement = this; } return node; };
  proto.removeAttribute = function(key) { delete this.attributes[key]; };
  proto.removeEventListener = function(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter(f => f !== fn); };
  proto.getElementsByClassName = function(name) { return this.querySelectorAll('.' + name); };
  proto.getBoundingClientRect = () => ({ top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 });
  proto.scrollIntoView = () => {};
  proto.animate = () => ({ cancel() {}, onfinish: null });
  proto.play = () => Promise.resolve();
  proto.pause = () => {};
  proto.click = function() { if (this.disabled) return; const event = { type: 'click', target: this, currentTarget: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, stopPropagation() {} }; if (this.getAttribute('onclick')) vm.runInContext(this.getAttribute('onclick'), context); this.onclick?.(event); for (let node = this; node; node = node.parentElement) for (const fn of node.listeners.click || []) { event.currentTarget = node; fn(event); } };
  const prepareNode = node => {
    node.dataset = new Proxy(node.dataset, { set(data, key, value) { data[key] = String(value); node.attributes['data-' + String(key).replace(/[A-Z]/g, c => '-' + c.toLowerCase())] = String(value); return true; } });
    node.style.setProperty = (key, value) => { node.style[key] = value; };
    node.style.removeProperty = key => { delete node.style[key]; };
    if (node.tagName === 'INPUT') { node.checked = node.hasAttribute('checked'); node.value = node.getAttribute('value') || ''; }
    return node;
  };
  document.querySelectorAll('*').forEach(prepareNode);
  const originalCreate = document.createElement;
  document.createElement = tag => prepareNode(originalCreate(tag));
  document.createTextNode = text => { const element = originalCreate('#text'); element.nodeType = 3; element.nodeValue = text; return element; };
  document.head = document.querySelector('head');
  Object.defineProperty(document, 'title', { get() { return document.querySelector('title').textContent; }, set(value) { document.querySelector('title').textContent = value; } });
  document.addEventListener = (type, fn) => (documentEvents[type] ||= []).push(fn);
  document.removeEventListener = (type, fn) => { documentEvents[type] = (documentEvents[type] || []).filter(f => f !== fn); };
  let now = 0, serial = 0, seed = options.seed ?? 1937;
  const timers = new Map(), history = [], store = new Map(), writes = [], rounds = [];
  const schedule = (fn, delay = 0, interval = 0) => { const task = { id: ++serial, fn, delay, due: now + delay, interval }; timers.set(task.id, task); history.push(task); return task.id; };
  const math = Object.create(Math); math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const storage = { getItem(key) { if (options.deniedStorage) throw Error('Blocked storage'); return store.get(key) ?? null; }, setItem(key, value) { if (options.deniedStorage) throw Error('Blocked storage'); store.set(key, String(value)); writes.push([key, value]); }, removeItem(key) { store.delete(key); } };
  const location = new URL('https://test.invalid/' + relative);
  context = { document, console, URL, Math: math, Promise, tailwind: {}, location,
    localStorage: storage, sessionStorage: storage, history: { replaceState(_a, _b, url) { location.href = String(url); } },
    setTimeout: (fn, ms = 0) => schedule(fn, ms), clearTimeout: id => timers.delete(id),
    setInterval: (fn, ms) => schedule(fn, ms, ms), clearInterval: id => timers.delete(id),
    requestAnimationFrame: fn => schedule(fn, 16), cancelAnimationFrame: id => timers.delete(id),
    matchMedia: () => ({ matches: !!options.reducedMotion, addEventListener() {}, removeEventListener() {} }),
    addEventListener: (type, fn) => (windowEvents[type] ||= []).push(fn),
    removeEventListener: (type, fn) => { windowEvents[type] = (windowEvents[type] || []).filter(f => f !== fn); }
  };
  context.window = context;
  vm.createContext(context);
  function execute(match) {
    const [, attrs, body] = match, src = attrs.match(/\bsrc=["']([^"']+)["']/)?.[1];
    if (src && (/^https?:/.test(src) || src.includes('/reviews/'))) return;
    let source = src ? fs.readFileSync(path.resolve(path.dirname(file), src.split('?')[0]), 'utf8') : body;
    if (!src && ['math_chinese', 'math_english'].includes(name)) source = source.replace('    app.init();', '    window.__legacy = {app, game1, game2, game3, game4, game5, game6, game7, game8, game9, game10};\n    app.init();');
    vm.runInContext(source, context, { filename: src || relative + ' inline' });
    if (src?.split('?')[0].endsWith('/word-core.js')) { const createRound = context.BilingualCore.createRound; context.BilingualCore.createRound = (...args) => { const state = createRound(...args); rounds.push(state); return state; }; }
  }
  scripts.filter(m => !/\bdefer\b/.test(m[1])).forEach(execute);
  scripts.filter(m => /\bdefer\b/.test(m[1])).forEach(execute);
  document.readyState = 'interactive';
  for (const fn of documentEvents.DOMContentLoaded || []) fn();
  for (const fn of windowEvents.DOMContentLoaded || []) fn();
  context.onload?.();
  document.readyState = 'complete';
  const refresh = () => context.KrisI18n?.refresh();
  refresh();
  const $ = selector => document.querySelector(selector), all = selector => document.querySelectorAll(selector);
  const run = source => { const result = vm.runInContext(source, context); refresh(); return result; };
  const click = selector => { assert($(selector), name + ': missing ' + selector); $(selector).click(); refresh(); };
  const advance = elapsed => { const end = now + elapsed; let turns = 0; for (;;) { const task = [...timers.values()].sort((a, b) => a.due - b.due || a.id - b.id)[0]; if (!task || task.due > end) break; assert(++turns < 10000, 'timer loop'); now = task.due; if (task.interval) task.due += task.interval; else timers.delete(task.id); task.fn(); refresh(); } now = end; };
  return { name, file, html, document, context, $, all, run, click, advance, refresh, timers, history, store, writes, get state() { return rounds.at(-1); }, language(lang) { context.KrisI18n.setLanguage(lang); refresh(); }, dispatch(type) { for (const fn of windowEvents[type] || []) fn({ type }); refresh(); } };
}
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log('PASS ' + name); } catch (error) { failed++; console.error('FAIL ' + name + '\n' + error.stack); } }
function assertUniqueIds(g) { const ids = g.all('[id]').map(n => n.id); assert.equal(ids.length, new Set(ids).size, `${g.name} duplicate IDs`); }
function assertTranslatedUI(g) { const missing=[]; function walk(node) { if(node.nodeType===3) { if(!node.parentElement.closest('[translate="no"],[data-i18n-skip],[data-no-i18n],kris-reviews,noscript') && /[\u3400-\u9fff]/.test(node.nodeValue)) missing.push(node.nodeValue.trim()); } else for(const child of node.childNodes) walk(child); } walk(g.document.documentElement); assert.deepEqual(missing,[],g.name+' untranslated UI'); }
function assertLocalImages(g) { for (const img of g.all('img[src]')) { const src = img.getAttribute('src'); if (!/^(?:https?:|data:)/.test(src)) assert(fs.existsSync(path.resolve(path.dirname(g.file), src)), `${g.name} missing image: ${src}`); } }
if (require.main === module) {
  test('exactly 26 canonical games remain review-enabled and linked', () => {
    assert.equal(GAMES.length, 26); assert.equal(new Set(GAMES).size, 26);
    const catalog = fs.readFileSync(path.join(ROOT, 'content.md'), 'utf8');
    for (const name of GAMES) { const file = pagePath(name), html = fs.readFileSync(path.join(ROOT, file), 'utf8'); assert.equal((html.match(/<kris-reviews\b/g) || []).length, 1, name); assert(html.includes(`data-game="${name}"`), name); assert(catalog.includes(file), `${file} missing from homepage catalog`); }
  });
  for (const name of GAMES) test(`${name}: actual page boots, translates and has unique IDs/local images`, () => {
    const g = boot(name); assert(g.context.KrisI18n, name); assert.equal(g.all('[data-site-language]').length, 3); assertUniqueIds(g); assertLocalImages(g);
    const title = g.document.title; for (const lang of ['en', 'fr', 'zh']) { g.language(lang); assert(g.document.title); assertUniqueIds(g); if(lang!=='zh')assertTranslatedUI(g); } assert.equal(g.document.title, title);
  });
  const act = (g, action, value = '') => g.click(`button[data-act="${action}"][data-value="${value}"]`);
  test('shape addition: independent subset oracle finds a solution in every sampled round', () => {
    const g = boot('shape_sorter_math');
    for (let i = 0; i < 1000; i++) {
      g.run('initAdditionMode()');
      const { target, values } = plain(g.run('({target:targetSum,values:draggableShapes.map(s=>Number(s.dataset.value))})'));
      const sums = new Set([0]); for (const value of values) for (const sum of [...sums]) sums.add(sum + value);
      assert(sums.has(target), `unsolvable target ${target} from ${values}`);
    }
  });
  test('math8: repeat answer/Next clicks cannot double-score or queue extra rounds', () => {
    const g = boot('math8'), answer = g.run('correctJumps');
    const button = g.all('.jump-option').find(b => Number(b.dataset.jumps) === answer);
    button.click(); button.click(); assert.equal(g.run('score'), 1);
    g.click('#next-button'); g.click('#next-button'); g.advance(300);
    const state = g.run('[currentPosition,targetPosition,correctJumps,score].join()'); g.advance(1000);
    assert.equal(g.run('[currentPosition,targetPosition,correctJumps,score].join()'), state);
  });
  test('math9: whole-number validation, once-only score, interrupted feedback', () => {
    const g = boot('math9'); g.run('startGame()');
    const answer = g.run('gameState.currentQuestion.answer');
    for (const suffix of ['abc', '.7', 'e2']) { g.$('#answer-input').value = answer + suffix; g.click('#submit-answer'); assert.equal(g.run('gameState.score'), 0, suffix); }
    g.$('#answer-input').value = String(answer); g.click('#submit-answer'); g.click('#submit-answer'); assert.equal(g.run('gameState.score'), 20);
    g.run('backToMainMenu();startGame("addition")'); const state = g.run('JSON.stringify(gameState)'); g.advance(3000); assert.equal(g.run('JSON.stringify(gameState)'), state);
  });
  test('math10: old automatic Next cannot replace a manual new question', () => {
    const g = boot('math10'); g.run('checkAnswer(gameState.currentAnswer)'); g.run('updateProblem()');
    const state = g.run('JSON.stringify(gameState)'); g.advance(2500); assert.equal(g.run('JSON.stringify(gameState)'), state);
  });
  for (const name of ['math_chinese', 'math_english']) test(`${name}: all ten modes have native models and preserve partial state across languages`, () => {
    const g = boot(name), games = g.context.__legacy; assert(games);
    for (let i = 1; i <= 10; i++) {
      g.click('#select-game' + i); if (i >= 9) g.click(`#game${i}-start-game`);
      const game = games['game' + i], host = game.hostElement;
      assert.equal(host.querySelectorAll('.math-arcade').length, 1, `mode ${i}`);
      const open = host.querySelector('.arcade-tool'); open.click(); g.refresh();
      assert.equal(host.querySelector('.arcade-model').hidden, false);
      assert.doesNotMatch(host.querySelector('.arcade-model').textContent, /undefined|NaN/);
      const state = JSON.stringify(game.state, (_key, value) => value?.nodeType ? null : value);
      for (const lang of ['en', 'fr', 'zh']) { g.language(lang); assert.equal(JSON.stringify(game.state, (_key, value) => value?.nodeType ? null : value), state, `mode ${i}`); }
      for (const button of host.querySelectorAll('.game23-number-option,.number,.choice-option,.jump-option')) assert.equal(button.tagName, 'BUTTON', `mode ${i}: native ${button.className}`);
    }
    g.click('#select-game1'); const game1 = games.game1; game1.checkAnswer(game1.state.currentCount); g.click('#select-game2');
    const inactive = JSON.stringify(game1.state); g.advance(4000); assert.equal(JSON.stringify(game1.state), inactive, 'old count round stays inactive');
    g.click('#select-game6'); const game6 = games.game6; game6.handleAnswer(game6.state.correctJumps); game6.handleAnswer(game6.state.correctJumps); assert.equal(game6.state.score, 1);
    g.click('#select-game7'); const game7 = games.game7; game7.elements.answerInput.value = game7.state.currentQuestion.answer + 'abc'; game7.checkAnswer(); assert.equal(game7.state.score, 0);
  });
  for (const name of ['math234', 'math567']) test(`${name}: every contained game gets its own working model`, () => {
    const g = boot(name), ids = name === 'math234' ? [2,3,4] : [2,5,6,7];
    for (const id of ids) {
      g.click('#select-game' + id); const host = g.$('#game' + id + '-host');
      assert.equal(host.querySelectorAll('.math-arcade').length, 1); host.querySelector('.arcade-tool').click(); g.refresh();
      assert.equal(host.querySelector('.arcade-model').hidden, false); assert.doesNotMatch(host.querySelector('.arcade-model').textContent, /undefined|NaN/);
      for (const button of host.querySelectorAll('.game23-number-option,.number-option,.potion-option,.choice-option')) assert.equal(button.tagName, 'BUTTON');
      const before = host.querySelector('.arcade-equation').textContent;
      for (const lang of ['en', 'fr', 'zh']) { g.language(lang); assert.equal(host.querySelector('.arcade-equation').textContent, before); }
    }
  });
  test('math-orbit: rewind restores the exact prefix and never awards a stamp', () => {
    const g = boot('math-orbit'); act(g,'op',0); act(g,'op',1);
    assert.equal(g.all('.route-step').length,2); const old = g.$('[data-act="rewind"][data-value="1"]'); old.click(); g.refresh();
    assert.equal(g.all('.route-step').length,1); assert.equal(g.$('.planet-number strong').textContent,'7');
    assert.equal(g.all('.fuel-cells .used').length,1); assert.equal(g.$('.passport strong').textContent,'0 / 8');
    const before = g.$('.flight-console').textContent; g.language('fr'); assert.equal(g.all('.route-step').length,1); g.language('zh'); assert.equal(g.$('.flight-console').textContent,before);
    act(g,'rewind',0); assert.equal(g.all('.route-step').length,0); assert.equal(g.$('.planet-number strong').textContent,'3');
    old.click(); assert.equal(g.all('.route-step').length,0,'detached rewind cannot restore removed state');
  });
  test('english-ruins: rune feedback marks only the true prefix and clears on edit', () => {
    const g = boot('english-ruins'); const data = g.context.QuestData.english;
    for (let level=0;level<data.length;level++) {
      act(g,'level',level); const words=data[level].words, order=words.map((_,i)=>i);
      let swap=1; while (swap<words.length && words[swap].toLowerCase()===words[0].toLowerCase()) swap++;
      [order[0],order[swap]]=[order[swap],order[0]];
      for(const id of order)act(g,'word',id); assert.equal(g.all('.rune.confirmed').length,0); act(g,'check');
      assert.equal(g.all('.rune.confirmed').length,0); assert.equal(g.all('.rune.revisit').length,1); assert.equal(g.all('.relic-token.collected').length,level);
      act(g,'return',0); assert.equal(g.all('.rune.revisit').length,0); act(g,'reset');
      for(let id=0;id<words.length;id++)act(g,'word',id); act(g,'check'); assert.equal(g.all('.rune.confirmed').length,words.length);
      assert.equal(g.all('.relic-token.collected').length,level+1);
    }
  });
  test('french-market: visible basket quantities agree, unpack removes one, language preserves cart', () => {
    const g=boot('french-market'), examples=[['apple-red','une pomme rouge','deux pommes rouges'],['apple-green','une pomme verte','deux pommes vertes'],['book-blue','un livre bleu','deux livres bleus'],['book-red','un livre rouge','deux livres rouges'],['pencil-yellow','un crayon jaune','deux crayons jaunes'],['pencil-blue','un crayon bleu','deux crayons bleus']];
    for(const [id,one,two]of examples){act(g,'reset');act(g,'plus',id);assert.equal(g.$('.basket-label').textContent,one);act(g,'plus',id);assert.equal(g.$('.basket-label').textContent,two);const counts=g.all('output').map(n=>n.textContent);g.language('fr');g.language('en');assert.deepEqual(g.all('output').map(n=>n.textContent),counts);act(g,'unpack',id);assert.equal(g.$('.basket-label').textContent,one);act(g,'unpack',id);assert.equal(g.all('.basket-item').length,0);assert.equal(g.document.activeElement,g.$(`[data-act="plus"][data-value="${id}"]`));}
  });
  test('circuit-lab: notebook records only observed physics, not predictions or stamps', () => {
    const g=boot('circuit-lab');act(g,'notebook');assert.equal(g.all('.notebook-cell.observed').length,0);
    for(const material of g.context.QuestData.materials)for(const closed of [false,true]){
      act(g,'level',0);act(g,'material',material.id);if(closed)act(g,'switch');act(g,'predict',material.conducts&&closed?'no':'yes');
      const previous=g.all('.notebook-cell.observed').length;assert(!g.$('.circuit-scene.is-lit'));act(g,'check');assert.equal(g.all('.notebook-cell.observed').length,previous+1);assert.equal(Boolean(g.$('.circuit-scene.is-lit')),Boolean(material.conducts&&closed));
      act(g,'check');assert.equal(g.all('.notebook-cell.observed').length,previous+1,'same observation is not duplicated');
    }
    assert.equal(g.all('.notebook-cell.observed').length,12);assert.equal(g.$('.passport strong').textContent,'0 / 8');
    const expectedLit=g.context.QuestData.materials.filter(m=>m.conducts).length;assert.equal(g.all('.notebook-cell.lit').length,expectedLit);
    const count=g.$('.notebook-toggle strong').textContent;for(const lang of ['en','fr','zh']){g.language(lang);assert.equal(g.$('.notebook-toggle strong').textContent,count);}
    assert.equal(g.writes.filter(([key])=>key.startsWith('kris-quest')).length,0);
  });
  for(const [name,mode]of [['bilingual-memory','memory'],['word-bridge','bridge'],['sentence-match','sentences']])test(`${name}: scene earns exactly one marker per match and review does not rescore`,()=>{
    const g=boot(name);assert(g.$('.pair-world.world-'+mode));assert.equal(g.all('.world-token.is-earned').length,0);
    if(mode==='memory')assert(g.state.pairs.every(pair=>!g.$('.pair-world').textContent.includes(pair.en)&&!g.$('.pair-world').textContent.includes(pair.fr)),'sky cannot reveal concealed words');
    act(g,'hint');assert.equal(g.all('.world-token.is-earned').length,0);act(g,'continue');
    for(const [i,pair]of [...g.state.pairs].entries()){act(g,'card',pair.id+':en');act(g,'card',pair.id+':fr');assert.equal(g.all('.world-token.is-earned').length,i+1);}
    assert(g.$('.pair-world.world-complete'));const state=plain(g.state),writes=g.writes.filter(([k])=>k.startsWith('kris-word')).length;
    for(const pair of g.state.pairs){act(g,'revisit',pair.id);assert(g.$('.pair-world').textContent.includes(pair.en));assert(g.$('.pair-world').textContent.includes(pair.fr));}
    for(const lang of ['en','fr','zh']){g.language(lang);assert.deepEqual(plain(g.state),state);}
    assert.equal(g.writes.filter(([k])=>k.startsWith('kris-word')).length,writes);
    act(g,'restart');assert.equal(g.all('.world-token.is-earned').length,0);
  });
  for(const [name,multiply]of [['addition_game',false],['multiplication_game',true]])test(`${name}: concrete model and growing scene follow exact arithmetic`,()=>{
    const g=boot(name), equation=g.$('#equation').textContent, [a,b]=equation.match(/\d+/g).map(Number), answer=multiply?a*b:a+b;
    assert.equal(g.all('.world-stop.is-grown').length,0);
    if(multiply){assert.equal(g.all('.array-star').length,answer);assert.equal(g.all('.array-star.is-lit').length,0);g.$('.object-group').click();assert.equal(g.all('.array-star.is-lit').length,b);g.click('#lab-toggle');assert.equal(Number(g.$('.star-array').dataset.rows),b);assert.equal(Number(g.$('.star-array').dataset.columns),a);assert.equal(g.all('.array-star').length,answer);assert.equal(g.all('.array-star.is-lit').length,b);}
    else{assert.equal(g.all('.harvest-cell.is-filled').length,0);g.$('.object-group').click();assert.equal(g.all('.harvest-cell.is-filled').length,a);g.click('#lab-toggle');assert.equal(g.all('.harvest-cell.is-filled').length,answer);g.click('#lab-toggle');assert.equal(g.all('.harvest-cell.is-filled').length,0);}
    g.$('#answer').value='17';const labClass=g.$('#lab-model').className,filled=g.all(multiply?'.array-star.is-lit':'.harvest-cell.is-filled').length;
    for(const lang of ['en','fr','zh']){g.language(lang);assert.equal(g.$('#equation').textContent,equation);assert.equal(g.$('#answer').value,'17');assert.equal(g.$('#lab-model').className,labClass);assert.equal(g.all(multiply?'.array-star.is-lit':'.harvest-cell.is-filled').length,filled);}
    g.$('#answer').value=String(answer);g.$('#answer-form').dispatch('submit');g.refresh();assert.equal(g.all('.world-stop.is-grown').length,1);assert.equal(g.all('.world-stop.has-fruit').length,1);g.click('#next');
    for(let i=1;i<6;i++){g.click('#learn');g.click('#next');}assert.equal(g.all('.world-stop.is-grown').length,6);assert.equal(g.all('.world-stop.has-fruit').length,1,'learned facts grow without false earned stars');
    g.click('#play-again');assert.equal(g.all('.world-stop.is-grown').length,0);
  });
  test('math1: a full ten-number garden has countable native shapes and manual progression',()=>{
    const g=boot('math1'),seen=[];
    for(let round=0;round<10;round++){
      const n=g.run('gameState.currentCount');seen.push(n);assert.equal(g.all('#shapes-container .shape').length,n);
      for(const button of g.all('#shapes-container .shape')){assert.equal(button.tagName,'BUTTON');button.click();button.click();}assert.equal(g.run('gameState.marked'),n);
      const before=g.run('JSON.stringify(gameState)');g.language('fr');g.language('en');assert.equal(g.run('JSON.stringify(gameState)'),before);
      const answer=g.all('.number').find(b=>Number(b.textContent)===n);answer.click();answer.click();assert.equal(g.run('gameState.score'),round+1);g.advance(5000);assert.equal(g.run('gameState.currentCount'),n,'no forced next round');g.click('#count-next');
    }
    assert.equal(new Set(seen).size,10);assert.equal(g.run('gameState.playing'),false);g.click('#count-restart');assert.equal(g.run('gameState.score'),0);
  });
  for(const name of ['math_addition_subtraction','math_visual_game'])test(`${name}: eight safe arithmetic rounds, exact objects and optional nonpunitive reminder`,()=>{
    const g=boot(name);g.click('#start-game');const snapshot=()=>plain(g.context.KrisLearningMath.snapshot());
    assert.equal(snapshot().timed,false);const first=snapshot();g.advance(120000);assert.deepEqual(snapshot(),first,'calm mode never expires');
    g.click('#timer-mode');g.advance(10001);assert.equal(snapshot().answered,false);assert.equal(snapshot().score,0);assert(g.all('.answer-options button').every(b=>!b.disabled));g.click('#calm-mode');
    for(let round=0;round<8;round++){
      const s=snapshot(),q=s.currentProblem;assert.equal(q.correctAnswer,q.operator==='+'?q.num1+q.num2:q.num1-q.num2);assert(q.correctAnswer>=0&&q.correctAnswer<=20);
      if(name==='math_visual_game'){for(const theme of ['chicks','matchsticks']){g.click('#theme-'+theme);const counts=g.all('.quantity-grid').map(grid=>grid.querySelectorAll('.quantity-item').filter(n=>n.textContent!=='0').length);assert.deepEqual(counts,[q.num1,q.num2]);}}
      const before=snapshot();for(const lang of ['en','fr','zh']){g.language(lang);assert.deepEqual(snapshot(),before);}
      const answer=g.all('.answer-options button').find(b=>Number(b.textContent)===q.correctAnswer);answer.click();answer.click();assert.equal(snapshot().score,round+1);assert.equal(g.all('.journey-stop.earned').length,round+1);g.click('#next-question');
    }
    assert.equal(snapshot().gameActive,false);assert.equal(snapshot().score,8);
  });
  test('picture quiz: four taught shared words, two choices, retry and manual progress',()=>{
    const g=boot('chinese_character_quiz'),questions=plain(g.run('questions'));assert.equal(questions.length,4);
    assert.equal(g.all('.beginner-word-card').length,4);assert.equal(g.$('#picture-practice').hidden,true);g.click('#picture-start');
    for(const [i,q]of questions.entries()){
      assertLocalImages(g);assert.equal(g.$('#picture-reading').textContent,'');assert.equal(q.options.length,2);
      const wrong=g.all('.option-button').find(b=>b.dataset.answer!==q.correctAnswer);wrong.click();assert.equal(g.run('score'),i);assert.equal(g.run('pictureAnswered'),false);assert.equal(g.$('#picture-next').hidden,true);
      const button=g.all('.option-button').find(b=>b.dataset.answer===q.correctAnswer);button.click();button.click();assert.equal(g.run('score'),i+1);assert(g.$('#picture-reading').textContent.includes(q.correctAnswer));
      const current=g.run('currentQuestionIndex');g.advance(6000);assert.equal(g.run('currentQuestionIndex'),current);g.language('fr');assert.equal(g.run('score'),i+1);g.click('#picture-review');g.click('#picture-start');assert.equal(g.run('currentQuestionIndex'),current);g.click('#picture-next');
    }
    assert.equal(g.run('score'),questions.length);g.click('.option-button');assert.equal(g.run('score'),0);assert.equal(g.$('#picture-study').hidden,false);
  });
  test('Chinese memory: study first, 4/6/12/20 native pairs, safe hidden faces and cancelled mismatches',()=>{
    const g=boot('chinese_game1');
    for(const size of [4,6,12,20]){
      g.click('#pairs-'+size);assert.equal(g.all('.card').length,size*2);assertLocalImages(g);assert.equal(g.all('.beginner-word-card').length,size);assert.equal(g.$('#game-board').hidden,true);g.click('#memory-start');
      for(const card of g.all('.card')){assert.equal(card.tagName,'BUTTON');assert.equal(card.querySelector('.card-front').getAttribute('aria-hidden'),'true');assert(!card.getAttribute('aria-label').includes(card.querySelector('.card-front').textContent.trim())||!card.querySelector('.card-front').textContent.trim(),'concealed label does not expose hanzi');}
      const a=g.all('.card')[0],b=g.all('.card').find(c=>c.dataset.id!==a.dataset.id);a.click();b.click();g.advance(1399);assert.equal(g.all('.card.flipped').length,2);g.language('en');g.advance(1);assert.equal(g.all('.card.flipped').length,0);
      a.click();b.click();g.click('#restart-button');const fresh=g.all('.card').map(c=>c.dataset.id);g.advance(2000);assert.deepEqual(g.all('.card').map(c=>c.dataset.id),fresh);assert.equal(g.all('.card.flipped').length,0);g.click('#memory-start');
      for(const id of new Set(g.all('.card').map(c=>c.dataset.id))){for(const card of g.all('.card').filter(c=>c.dataset.id===id))card.click();g.advance(200);}assert.equal(Number(g.$('#score').textContent),size*10);assert.equal(g.all('#memory-collection span').length,size);assert.equal(g.all('.card.matched').length,size*2);
    }
  });
  test('shape modes: tap, undo, true win, new mode and detached actions stay independent',()=>{
    const g=boot('shape_sorter_math');const first=g.all('#shapes-area .shape').find(b=>Number(b.dataset.value)<g.run('targetSum'));assert(first);first.click();g.refresh();assert.equal(g.run('currentSumInMachineAddition'),Number(first.dataset.value));g.click('#undo-shape');assert.equal(g.run('currentSumInMachineAddition'),0);assert.equal(first.disabled,false);
    const values=g.all('#shapes-area .shape'),target=g.run('targetSum');let solution=null;
    for(let mask=1;mask<1<<values.length;mask++){const chosen=values.filter((_,i)=>mask&(1<<i));if(chosen.reduce((n,b)=>n+Number(b.dataset.value),0)===target){solution=chosen;break;}}
    for(const button of solution)button.click();g.refresh();assert.equal(g.run('shapeStamps'),1);assert.equal(g.run('shapeSolved'),true);g.advance(5000);assert.equal(g.run('targetSum'),target);
    g.click('#subtraction-mode-btn');const before=g.run('JSON.stringify({mode:currentGameMode,target:targetSum,sum:currentSumSubtraction})');first.click();g.advance(5000);assert.equal(g.run('JSON.stringify({mode:currentGameMode,target:targetSum,sum:currentSumSubtraction})'),before);
    const removable=g.all('#sorting-machine .shape').find(b=>g.run('currentSumSubtraction')-Number(b.dataset.value)>=g.run('targetSum'));removable.click();g.refresh();if(!g.run('shapeSolved')){const current=g.run('currentSumSubtraction');g.click('#undo-shape');assert.equal(g.run('currentSumSubtraction'),current+Number(removable.dataset.value));}
    g.language('fr');g.language('en');assertUniqueIds(g);
  });
  test('vocabulary passport retries only wrong or skipped words from the same round',()=>{
    const g=boot('vocabulary_quiz'),words=plain(g.run('roundWords')),missed=[words[0],words[1]];
    for(let i=0;i<words.length;i++){
      if(i!==1){const answer=g.run('correctAnswer'),button=g.all('#options button').find(b=>i===0?b.dataset.answer!==answer:b.dataset.answer===answer);button.click();g.click('#check-answer');g.click('#check-answer');}
      g.click('#next-word');
    }
    assert.equal(g.run('correctCount'),words.length-2);assert.equal(g.$('#review-words').hidden,false);g.click('#review-words');assert.deepEqual(plain(g.run('roundWords')),missed);
    assert.equal(g.run('correctCount'),0);assert.equal(g.all('#word-passport .journey-stop').length,2);const state=g.run('JSON.stringify({roundWords,currentWordIndex,correctCount})');g.language('fr');g.language('en');assert.equal(g.run('JSON.stringify({roundWords,currentWordIndex,correctCount})'),state);
  });
  test('math9: local skin preserves hidden/modal lifecycle without remote dependencies',()=>{
    const g=boot('math9'),css=fs.readFileSync(path.join(ROOT,'assets/legacy-math-hero.css'),'utf8');
    assert(!/cdn\.tailwindcss|font-awesome|picsum|fonts\.googleapis|tailwind\.config/.test(g.html));
    for(const cls of ['hidden','fixed','inset-0','opacity-0','opacity-100','scale-95','scale-100','w-full','max-w-md','max-w-2xl'])assert(css.includes(`[class~="${cls}"]`),cls+' local style');
    assert(css.includes('display:none!important'));assert(css.includes('max-height:90vh;overflow:auto'));assert(css.includes('@media(max-width:520px)'));assert(css.includes('prefers-reduced-motion:reduce'));
    assert(g.$('#game-screen').classList.contains('hidden'));for(const id of ['correct-feedback','wrong-feedback','game-over-screen','help-modal'])assert(g.$('#'+id).classList.contains('hidden'));
    g.click('#help-btn');assert(!g.$('#help-modal').classList.contains('hidden'));g.advance(10);assert(g.$('#help-content').classList.contains('opacity-100'));g.click('#close-help');g.advance(300);assert(g.$('#help-modal').classList.contains('hidden'));
    g.click('#start-btn');assert(g.$('#welcome-screen').classList.contains('hidden'));assert(!g.$('#game-screen').classList.contains('hidden'));
    g.$('#answer-input').value=String(g.run('gameState.currentQuestion.answer'));g.click('#submit-answer');g.advance(10);assert(!g.$('#correct-feedback').classList.contains('hidden'));assert(g.$('#correct-modal').classList.contains('opacity-100'));g.click('#next-question');g.advance(300);assert(g.$('#correct-feedback').classList.contains('hidden'));
    g.$('#answer-input').value=String(g.run('gameState.currentQuestion.answer')+1);g.click('#submit-answer');g.advance(10);assert(!g.$('#wrong-feedback').classList.contains('hidden'));assert(g.$('#wrong-modal').classList.contains('opacity-100'));g.click('#try-again');g.advance(300);assert(g.$('#wrong-feedback').classList.contains('hidden'));
    g.run('backToMainMenu()');assert(g.$('#game-screen').classList.contains('hidden'));assert(!g.$('#welcome-screen').classList.contains('hidden'));
    assert(!/https?:\/\//.test(fs.readFileSync(path.join(ROOT,'games/math567.html'),'utf8').match(/<style>([\s\S]*?)<\/style>/)[1]),'math567 textures are local CSS');
  });
  console.log(`Experience checks: ${passed} passed, ${failed} failed. DOM-model checks only; no device/layout claim.`);
  if (failed) process.exitCode = 1;
}
module.exports = { boot, GAMES, pagePath, plain, assertUniqueIds, assertLocalImages };
