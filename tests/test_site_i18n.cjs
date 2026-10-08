/* Site-wide i18n regression tests using actual runtime/catalog/application code.
 * Dependency-free DOM adapter; no browser rendering or network claims.
 * Run: node tests/test_site_i18n.cjs
 */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { makeDOM } = require('./quest-dom.cjs');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const settle = async () => { for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve)); };
function harness(html, options = {}) {
  const document = makeDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ''));
  const proto = Object.getPrototypeOf(document.body), originalClosest = proto.closest;
  const observers = [], documentEvents = {}, windowEvents = {}, calls = [], timers = new Map();
  let timerId = 0;
  function notify(node) { for (const observer of observers) if (observer.roots.some(r => r === node || r.contains(node))) { if (!observer.queued) { observer.queued = true; Promise.resolve().then(() => { observer.queued = false; observer.callback([]); }); } } }
  function dataset(node) {
    if (node._boundDataset) return; node._boundDataset = true;
    node.dataset = new Proxy({}, { get: (_, key) => node.getAttribute('data-' + String(key).replace(/[A-Z]/g, c => '-' + c.toLowerCase())) ?? undefined, set: (_, key, value) => { node.setAttribute('data-' + String(key).replace(/[A-Z]/g, c => '-' + c.toLowerCase()), value); return true; } });
    for (const child of node.childNodes) dataset(child);
  }
  proto.closest = function(s) { for (const selector of s.split(',')) { const found = originalClosest.call(this, selector.trim()); if (found) return found; } return null; };
  Object.defineProperty(proto, 'id', { get() { return this.getAttribute('id') || ''; }, set(v) { this.setAttribute('id', v); } });
  Object.defineProperty(proto, 'nodeValue', { get() { return this.value; }, set(v) { this.value = v; notify(this); } });
  Object.defineProperty(proto, 'classList', { get() { const el = this; return { contains: c => el.className.split(/\s+/).includes(c), add: (...names) => { el.className = [...new Set([...el.className.split(/\s+/).filter(Boolean), ...names])].join(' '); }, remove: (...names) => { el.className = el.className.split(/\s+/).filter(c => !names.includes(c)).join(' '); }, toggle: (c, value) => { const set = new Set(el.className.split(/\s+/).filter(Boolean)); (value === undefined ? !set.has(c) : value) ? set.add(c) : set.delete(c); el.className = [...set].join(' '); } }; } });
  proto.setAttribute = function(k, v) { const old = this.attributes[k]; this.attributes[k] = String(v); if (!this._boundDataset && k.startsWith('data-')) this.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(v); if (old !== String(v) && ['title', 'placeholder', 'aria-label', 'alt', 'content'].includes(k)) notify(this); };
  const originalAppend = proto.append;
  proto.append = function(...items) { originalAppend.apply(this, items); for (const n of items) dataset(n); notify(this); };
  const originalReplace = proto.replaceChildren;
  proto.replaceChildren = function(...items) { originalReplace.apply(this, items); notify(this); };
  proto.appendChild = function(n) { this.append(n); return n; };
  proto.prepend = function(n) { n.parentElement = this; this.childNodes.unshift(n); dataset(n); notify(this); };
  proto.removeAttribute = function(k) { delete this.attributes[k]; notify(this); };
  proto.remove = function() { const parent = this.parentElement; if (parent) parent.childNodes = parent.childNodes.filter(n => n !== this); this.parentElement = null; if (parent) notify(parent); };
  proto.removeEventListener = function(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter(listener => listener !== fn); };
  proto.checkValidity = function() { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.value); };
  proto.reportValidity = proto.checkValidity;
  const createElement = document.createElement, createFragment = document.createDocumentFragment;
  document.createElement = tag => { const element = createElement(tag); dataset(element); return element; };
  document.createDocumentFragment = () => { const fragment = createFragment(); dataset(fragment); return fragment; };
  document.createTextNode = value => { const e = document.createElement('span'); e.textContent = value; return e.childNodes[0]; };
  document.getElementById = id => document.querySelector('#' + id);
  document.addEventListener = (type, fn) => (documentEvents[type] ||= []).push(fn);
  document.readyState = 'loading'; dataset(document.documentElement);
  const local = options.local || new Map(), session = options.session || new Map();
  function storage(map, type) { return { getItem: key => { calls.push(['get', type, key]); return map.get(key) ?? null; }, setItem: (key, value) => { if (options.denyWrite?.(type, key)) throw Error('blocked write'); calls.push(['set', type, key]); map.set(key, String(value)); }, removeItem: key => { calls.push(['remove', type, key]); map.delete(key); } }; }
  const context = { document, console, URL, Error, AbortController, location: { href: options.url || 'https://example.test/kris/index.html', origin: new URL(options.url || 'https://example.test/kris/index.html').origin, assign: value => calls.push(['navigate', value]), reload: () => calls.push(['reload']) }, history: { replaceState(_state, _title, value) { const url = new URL(value, context.location.href); context.location.href = url.href; context.location.origin = url.origin; calls.push(['replaceState', url.href]); } }, setTimeout: (fn, ms) => { const id = ++timerId; timers.set(id, { fn, ms }); return id; }, clearTimeout: id => timers.delete(id), addEventListener: (type, fn) => (windowEvents[type] ||= []).push(fn), removeEventListener: (type, fn) => { windowEvents[type] = (windowEvents[type] || []).filter(f => f !== fn); }, MutationObserver: class { constructor(callback) { this.callback = callback; this.roots = []; observers.push(this); } observe(root) { if (!this.roots.includes(root)) this.roots.push(root); } disconnect() { this.roots = []; } } };
  context.window = context;
  for (const [type, map] of [['local', local], ['session', session]]) Object.defineProperty(context, type + 'Storage', { get() { if (options['deny' + type[0].toUpperCase() + type.slice(1)]) throw Error('blocked storage'); return storage(map, type); } });
  vm.createContext(context);
  const execute = file => vm.runInContext(read(file), context, { filename: file });
  execute('assets/i18n.js');
  for (const catalog of options.catalogs || []) execute(catalog);
  const start = () => { document.readyState = 'interactive'; for (const fn of documentEvents.DOMContentLoaded || []) fn(); };
  const language = lang => context.KrisI18n.setLanguage(lang);
  if (!options.deferStart) start();
  return { document, context, execute, language, start, local, session, calls, observers, documentEvents, windowEvents, timers, $: s => document.querySelector(s), all: s => document.querySelectorAll(s) };
}
const fixture = '<html><head><title>测试标题</title><meta name="description" content="测试说明"></head><body><p id="copy">原始文字</p><p id="dynamic">得分: 4</p><input id="input" placeholder="输入文字" aria-label="输入文字"><textarea id="draft"></textarea><img id="image" alt="测试图片" title="测试图片"><div translate="no" id="instruction">原始文字</div><a id="local" href="./game.html#question">原始文字</a><a id="external" href="https://external.test/">外部</a><a id="download" href="./file.txt" download>下载</a></body></html>';
function register(g) {
  g.context.KrisI18n.register({ '测试标题': ['Test title', 'Titre du test'], '测试说明': ['Test description', 'Description du test'], '原始文字': ['Original text', 'Texte original'], '输入文字': ['Enter text', 'Saisir du texte'], '测试图片': ['Test picture', 'Image du test'] });
  g.execute('assets/i18n-legacy-learning.js');
}
(async () => {
  const g = harness(fixture); register(g);
  g.$('#input').value = '原始文字'; g.$('#draft').value = 'My draft, mon brouillon, 我的草稿';
  const node = g.$('#copy'), input = g.$('#input'), textNode = node.childNodes[0];
  for (const [lang, copy, score] of [['en','Original text','Score: 4'], ['fr','Texte original','Score : 4'], ['zh','原始文字','得分: 4']]) {
    g.language(lang); await settle(); assert.equal(node.textContent, copy); assert.equal(g.$('#dynamic').textContent, score); assert.equal(node.childNodes[0], textNode); assert.equal(g.$('#input'), input); assert.equal(input.value, '原始文字'); assert.equal(g.$('#draft').value, 'My draft, mon brouillon, 我的草稿'); assert.equal(g.$('#instruction').textContent, '原始文字');
  }
  g.language('fr'); assert.equal(g.$('[data-site-language="fr"]').getAttribute('aria-pressed'), 'true'); assert.equal(g.$('[data-site-language="en"]').getAttribute('aria-pressed'), 'false'); assert.equal(input.getAttribute('placeholder'), 'Saisir du texte'); assert.equal(input.getAttribute('aria-label'), 'Saisir du texte'); assert.equal(g.$('#image').getAttribute('alt'), 'Image du test'); assert.equal(g.$('meta').getAttribute('content'), 'Description du test');
  // Mutations after startup must be translated without an explicit refresh.
  g.$('#dynamic').textContent = '得分: 8'; g.$('#image').setAttribute('alt', '原始文字'); await settle(); assert.equal(g.$('#dynamic').textContent, 'Score : 8'); assert.equal(g.$('#image').getAttribute('alt'), 'Texte original');
  g.language('zh'); assert.equal(g.$('#dynamic').textContent, '得分: 8'); assert.equal(g.$('#image').getAttribute('alt'), '原始文字');
  assert.equal(g.local.get('kris-site-language'), 'zh'); g.language('fr');
  const reload = harness(fixture, { local: g.local }); register(reload); assert.equal(reload.context.KrisI18n.language, 'fr'); assert.equal(reload.$('#copy').textContent, 'Texte original');
  const urlWins = harness(fixture, { local: g.local, url: 'https://example.test/kris/game.html?lang=en' }); register(urlWins); assert.equal(urlWins.context.KrisI18n.language, 'en');
  const afterExplicitURL = harness(fixture, { local: urlWins.local, url: 'https://example.test/kris/next.html' }); register(afterExplicitURL); assert.equal(afterExplicitURL.context.KrisI18n.language, 'en', 'Explicit URL language persists to a plain next-page URL');
  const legacyPreference = harness(fixture, { local: new Map([['kris-math-language','en']]) }); register(legacyPreference); assert.equal(legacyPreference.context.KrisI18n.language, 'en');
  g.language('xx'); assert.equal(g.context.KrisI18n.language, 'fr');
  for (const listener of g.windowEvents.storage) listener({ key: 'kris-site-language', newValue: 'en' }); assert.equal(g.context.KrisI18n.language, 'en');
  console.log('PASS runtime: three-way text/attribute restoration, live mutations, input identity/drafts, stored preference and cross-tab updates');

  const fallback = harness(fixture, { denyLocal: true }); register(fallback); fallback.language('fr'); assert.equal(fallback.session.get('kris-site-language'), 'fr'); assert.equal(fallback.context.KrisI18n.localizeURL('./game.html'), './game.html');
  const fallbackReload = harness(fixture, { denyLocal: true, session: fallback.session }); register(fallbackReload); assert.equal(fallbackReload.context.KrisI18n.language, 'fr');
  const blocked = harness(fixture, { denyLocal: true, denySession: true }); register(blocked); blocked.language('fr');
  assert.equal(blocked.context.KrisI18n.localizeURL('./game.html#question'), 'https://example.test/kris/game.html?lang=fr#question');
  assert.equal(blocked.context.KrisI18n.localizeURL('https://external.test/'), 'https://external.test/'); assert.equal(blocked.context.KrisI18n.localizeURL('#question'), '#question');
  for (const fn of blocked.documentEvents.click) fn({ target: blocked.$('#local') }); assert.equal(blocked.$('#local').href, 'https://example.test/kris/game.html?lang=fr#question');
  for (const fn of blocked.documentEvents.click) fn({ target: blocked.$('#download') }); assert.equal(blocked.$('#download').href, './file.txt');
  const blockedNext = harness(fixture, { denyLocal: true, denySession: true, url: blocked.$('#local').href }); register(blockedNext); assert.equal(blockedNext.context.KrisI18n.language, 'fr');
  let writeBlocked = false; const lateFailure = harness(fixture, { denyWrite: (_, key) => writeBlocked && key === 'kris-site-language' }); register(lateFailure); writeBlocked = true; lateFailure.language('fr'); assert.match(lateFailure.context.KrisI18n.localizeURL('./game.html'), /lang=fr/);
  console.log('PASS storage: session fallback, all-storage-denied URL navigation, query restoration and late write failure');

  const foreign = harness('<html><body><p id="a">You have 💰1 coins.</p><p id="b">Buy Apple. Change?</p><p id="c">Alien at: 6</p></body></html>', { catalogs: ['assets/i18n-legacy-math.js'] });
  assert.equal(foreign.$('#a').textContent, '你有 💰1个金币。');
  foreign.language('en'); assert.equal(foreign.$('#a').textContent, 'You have 💰1 coin.'); assert.equal(foreign.$('#b').textContent, 'Buy Apple. Change?');
  foreign.language('fr'); assert.equal(foreign.$('#a').textContent, 'Tu as 💰1 pièce.'); assert.equal(foreign.$('#b').textContent, 'Achète une pomme. Quelle monnaie te rend-on ?'); assert.equal(foreign.$('#c').textContent, 'Position de l’extraterrestre : 6');
  foreign.language('zh'); assert.equal(foreign.$('#a').textContent, '你有 💰1个金币。'); assert.equal(foreign.$('#b').textContent, '买苹果，能找回多少金币？'); assert.equal(foreign.$('#c').textContent, '外星人位置: 6');
  console.log('PASS foreign-source patterns: English initial strings translate and round-trip through Chinese, English and French');

  for (const offline of [false, true]) {
    const home = harness(read('index.html'), { catalogs: ['assets/i18n-site.js'] });
    home.context.fetch = async () => { if (offline) throw Error('offline'); return { ok: true, text: async () => read('content.md') }; };
    home.execute('script.js'); await settle();
    assert.equal(home.all('#game-grid [data-game]').length, 11);
    home.$('#show-more').click(); home.$('#resource-search').value = 'NASA'; home.$('#resource-search').dispatch('input'); await settle();
    const visible = home.all('#resource-grid .resource-card').filter(c => !c.hidden), input = home.$('#resource-search');
    assert.equal(visible.length, 1);
    for (const lang of ['en', 'fr', 'zh']) { home.language(lang); await settle(); assert.equal(home.$('#resource-search'), input); assert.equal(input.value, 'NASA'); assert.deepEqual(home.all('#resource-grid .resource-card').filter(c => !c.hidden), visible); }
    home.language('fr'); assert.match(home.$('#results-status').textContent, /1 ressource/); assert.ok(!/[\u3400-\u9fff]/.test(home.$('h1').textContent));
    if (offline) assert.ok(!/[\u3400-\u9fff]/.test(home.$('#content-status').textContent));
  }
  console.log('PASS homepage: directory/fallback translations and search/filter/input state survive language changes');

  const session = new Map([['kris-review-admin-session','test-session-marker']]);
  const admin = harness(read('admin.html'), { session, catalogs: ['assets/i18n-site.js','assets/i18n-admin.js'] }), rpcCalls = [];
  let authListener;
  const auth = { initialize: async () => ({}), getSession: async () => ({ data: { session: { user: { id: 'admin-test' } } } }), getUser: async () => ({ data: { user: { id: 'admin-test', email: 'admin@example.test' } } }), onAuthStateChange: fn => { authListener = fn; return { data: { subscription: { unsubscribe() {} } } }; }, stopAutoRefresh: () => rpcCalls.push(['stop']), signOut: async () => { rpcCalls.push(['signout']); return {}; }, signInWithOtp: async () => { rpcCalls.push(['signin']); return {}; } };
  admin.context.KRIS_ADMIN_CONFIG = { url: 'https://oxzudyliysixpflfxsye.supabase.co', publishableKey: 'sb_publishable_test' };
  admin.context.KRIS_ADMIN_GAMES = [{ id: 'addition_game', name: '加法果园', href: './addition_game.html' }];
  admin.$('#game-filter').value = '';
  admin.context.supabase = { createClient: (_, __, options) => { assert.equal(options.auth.storageKey, 'kris-review-admin-session'); return { auth, rpc: async (name, args) => { rpcCalls.push([name,args]); return { data: name === 'review_admin_status' ? true : { items: [{ id: 'review-1', game_id: 'addition_game', body: '玩家评价', status: 'pending', created_on: '2026-10-08' }], total: 1, counts: { pending: 1, approved: 0, rejected: 0, all: 1 } } }; } }; } };
  admin.execute('assets/admin/admin.js'); await settle(); assert.equal(admin.$('#workspace').hidden, false);
  admin.$('#email').value = 'draft@example.test'; admin.$('#game-filter').value = 'addition_game'; admin.$('.review-actions .primary').click(); await settle();
  const confirm = admin.$('.confirm-action'), card = admin.$('.review-card'), callCount = rpcCalls.length;
  for (const lang of ['en', 'fr', 'zh']) { admin.language(lang); await settle(); assert.equal(admin.$('.confirm-action'), confirm); assert.equal(admin.$('.review-card'), card); assert.equal(admin.$('.review-body').textContent, '玩家评价'); assert.equal(admin.$('#email').value, 'draft@example.test'); assert.equal(admin.$('#game-filter').value, 'addition_game'); assert.equal(admin.$('#workspace').hidden, false); assert.equal(admin.$('#account-label').textContent, 'admin@example.test'); assert.equal(session.get('kris-review-admin-session'), 'test-session-marker'); assert.equal(rpcCalls.length, callCount); }
  admin.language('fr'); assert.equal(confirm.getAttribute('aria-label'), 'Confirmer l’action de modération'); assert.equal(admin.$('#list-summary').textContent, '1 avis · Affichage de 1 à 1'); assert.equal(admin.$('#page-label').textContent, 'Page 1 / 1'); assert.equal(typeof authListener, 'function');
  console.log('PASS administration: session/account, filters, email draft, confirmation pane and private review text preserved; no extra RPC/auth calls');

  const reviews = harness('<html><body><kris-reviews data-game="addition_game"></kris-reviews></body></html>', { catalogs: ['assets/i18n-reviews.js'], deferStart: true }), reviewCalls = [];
  let Constructor, finishVerify;
  class Element { getAttribute(name) { return name === 'data-game' ? 'addition_game' : null; } attachShadow() { this.shadowRoot = reviews.document.createDocumentFragment(); return this.shadowRoot; } }
  reviews.context.HTMLElement = Element;
  reviews.context.customElements = { get: () => Constructor, define: (_, C) => { Constructor = C; } };
  reviews.context.KRIS_REVIEWS_CONFIG = { endpoint: 'https://test-project.supabase.co/functions/v1/game-reviews' };
  reviews.context.fetch = async (_, init) => { reviewCalls.push(init); if (init.method === 'GET') return Response.json({ reviews: [{ body: '玩家评价', date: '2026-10-08' }] }); return new Promise(resolve => { finishVerify = resolve; }); };
  reviews.execute('assets/reviews/reviews.js'); const widget = new Constructor(); widget.connectedCallback(); reviews.start(); await settle();
  const $ = widget.$, shadow = widget.shadowRoot;
  assert(reviews.observers.some(o => o.roots.includes(shadow)), 'Root registered before DOMContentLoaded must be observed');
  $('#answer').value = 'test-answer'; $('#review').value = '玩家评价 / My unchanged draft';
  const originalTextarea = $('#review'), originalArticle = $('#reviews-list').children[0];
  const verifying = widget.verify(); await settle(); assert.equal(widget._busy, true);
  reviews.language('fr'); await settle(); assert.equal($('#verify').disabled, true); assert.equal($('#answer').value, 'test-answer'); assert.equal($('#status').textContent, 'Vérification…');
  finishVerify(Response.json({ ok: true })); await verifying; await settle();
  assert.equal($('#compose').hidden, false); assert.equal(widget._answer, 'test-answer');
  for (const lang of ['en', 'fr', 'zh']) { reviews.language(lang); await settle(); assert.equal($('#review'), originalTextarea); assert.equal($('#review').value, '玩家评价 / My unchanged draft'); assert.equal(widget._answer, 'test-answer'); assert.equal($('#compose').hidden, false); assert.equal($('#reviews-list').children[0], originalArticle); assert.equal($('#reviews-list p').textContent, '玩家评价'); assert.equal(reviewCalls.length, 2); }
  reviews.language('fr'); assert.equal($('#reviews-title').textContent, 'Avis des joueurs'); assert.equal($('section').lang, 'fr-CA'); assert.ok($('#review').getAttribute('placeholder').startsWith('Par exemple')); assert.equal($('#status').textContent, 'Bonne réponse ! Ton avis sera vérifié avant sa publication.');
  console.log('PASS review shadow root: early registration, live async status translation, verified gate and draft/list identity preserved without requests');
  // A language selected on a query-bearing page must survive reload.
  const queryPage = harness(fixture, { url: 'https://example.test/kris/game.html?lang=en' }); register(queryPage); queryPage.language('fr');
  const queryReload = harness(fixture, { local: queryPage.local, url: queryPage.context.location.href }); register(queryReload);
  assert.equal(queryReload.context.KrisI18n.language, 'fr', 'A stale lang query must not override the newly selected persisted language');
  const deniedQuery = harness(fixture, { denyLocal: true, denySession: true, url: 'https://example.test/kris/game.html?lang=en' }); register(deniedQuery); deniedQuery.language('fr');
  const deniedReload = harness(fixture, { denyLocal: true, denySession: true, url: deniedQuery.context.location.href }); register(deniedReload);
  assert.equal(deniedReload.context.KrisI18n.language, 'fr', 'URL fallback must preserve a new selection on reload');
  const surprise = harness(read('index.html'), { denyLocal: true, denySession: true, catalogs: ['assets/i18n-site.js'] });
  surprise.context.fetch = async () => ({ ok: true, text: async () => read('content.md') }); surprise.execute('script.js'); await settle(); surprise.language('fr'); surprise.$('#surprise-button').click();
  const navigation = surprise.calls.find(call => call[0] === 'navigate'); assert(navigation, 'Surprise button should navigate');
  assert.equal(new URL(navigation[1], surprise.context.location.href).searchParams.get('lang'), 'fr', 'Programmatic game navigation must preserve a storage-denied language');
  console.log('PASS navigation: language changes survive query-bearing reloads and Surprise me with storage denied');
  console.log('PASS: production code under DOM simulation; no browser/layout/audio assertion.');
})().catch(error => { console.error(error); process.exitCode = 1; });
