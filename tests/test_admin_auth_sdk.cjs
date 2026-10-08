'use strict';
// Runs production admin.js against the actual pinned Supabase AuthClient.
// Browser DOM/history/BroadcastChannel and HTTP are modeled locally; no network,
// live accounts, production tokens, or real-browser claims are involved.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { makeDOM } = require('./quest-dom.cjs');

const html = fs.readFileSync('admin.html', 'utf8');
const script = fs.readFileSync('assets/admin/admin.js', 'utf8');
const vendor = fs.readFileSync('assets/vendor/supabase-2.117.3.js', 'utf8');
const pageURL = 'https://caozixiong.github.io/kris/admin.html';
const sessionKey = 'kris-review-admin-session';
const tabs = [];
const channels = new Set();
const broadcasts = [];

class LocalBroadcastChannel {
  constructor(name) { this.name = name; this.listeners = []; channels.add(this); }
  addEventListener(type, listener) { if (type === 'message') this.listeners.push(listener); }
  postMessage(data) {
    broadcasts.push(data.event);
    for (const channel of channels) {
      if (channel === this || channel.name !== this.name) continue;
      const copy = structuredClone(data);
      setImmediate(() => { for (const listener of channel.listeners) listener({ data: copy }); });
    }
  }
  close() { channels.delete(this); this.listeners = []; }
}

function syntheticSession() {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  // No token is signed or accepted by a real server. Never print its payload.
  const access_token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    sub: '11111111-1111-4111-8111-111111111111',
    exp: Math.floor(Date.now() / 1000) + 3600
  })}.dGVzdC1vbmx5`;
  return { access_token, refresh_token: 'synthetic-test-only-refresh' };
}

function callbackURL() {
  return `${pageURL}#${new URLSearchParams({ ...syntheticSession(), expires_in: '3600', token_type: 'bearer', type: 'magiclink' })}`;
}

function makeTab(options = {}) {
  const document = makeDOM(html);
  const $ = id => document.querySelector(`#${id}`);
  const proto = Object.getPrototypeOf(document.body);
  proto.remove = function () {
    if (this.parentElement) {
      this.parentElement.childNodes = this.parentElement.childNodes.filter(child => child !== this);
      this.parentElement = null;
    }
  };
  proto.checkValidity = function () { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.value); };
  proto.reportValidity = function () { return this.checkValidity(); };
  document.getElementById = $;
  document.createTextNode = text => { const node = document.createElement('span'); node.textContent = text; return node; };
  document.visibilityState = 'visible';
  const events = new Map();
  const on = (name, listener) => {
    if (!events.has(name)) events.set(name, new Set());
    events.get(name).add(listener);
  };
  const off = (name, listener) => events.get(name)?.delete(listener);
  document.addEventListener = on;
  document.removeEventListener = off;
  $('game-filter').value = '';
  const storage = new Map();
  const historyEntries = [options.href || pageURL];
  const effects = [];
  const calls = [];
  let currentURL = new URL(historyEntries[0]);
  const location = {
    get href() { return currentURL.href; },
    get hash() { return currentURL.hash; },
    set hash(value) {
      const next = new URL(currentURL); next.hash = value;
      if (next.href !== currentURL.href) historyEntries.push(next.href);
      currentURL = next;
    },
    reload() { calls.push('reload'); }
  };
  const history = {
    state: null,
    replaceState(state, title, href) {
      this.state = state;
      currentURL = new URL(href, currentURL);
      historyEntries[historyEntries.length - 1] = currentURL.href;
      effects.push('replace-history');
    }
  };
  let auth;
  const context = {
    document, location, history, console, URL, URLSearchParams, Headers, Response, Request,
    AbortController, crypto: webcrypto, navigator: {},
    setTimeout: (fn, delay, ...args) => {
      const timer = setTimeout(fn, delay, ...args); timer.unref?.(); return timer;
    },
    clearTimeout, setInterval, clearInterval,
    addEventListener: on, removeEventListener: off,
    BroadcastChannel: LocalBroadcastChannel,
    sessionStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    },
    KRIS_ADMIN_CONFIG: { url: 'https://oxzudyliysixpflfxsye.supabase.co', publishableKey: 'sb_publishable_test_only' },
    KRIS_ADMIN_GAMES: [{ id: 'addition_game', name: '加法果园', href: './addition_game.html' }]
  };
  context.window = context;
  context.fetch = async input => {
    const url = new URL(input);
    effects.push('fetch');
    calls.push(url.pathname);
    if (url.pathname === '/auth/v1/user') {
      if (options.userGate) await options.userGate;
      return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111', email: 'admin@example.test' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.pathname === '/auth/v1/logout') {
      return options.failLogout
        ? new Response(JSON.stringify({ message: 'Test-only unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
        : new Response(null, { status: 204 });
    }
    throw new Error('Unexpected mocked Auth request');
  };
  vm.createContext(context);
  vm.runInContext(vendor, context);
  const actualSDK = context.supabase;
  context.supabase = {
    createClient(url, key, options) {
      auth = new actualSDK.AuthClient({ ...options.auth, url: `${url}/auth/v1`, headers: { apikey: key }, fetch: context.fetch });
      return {
        auth,
        rpc: async name => {
          calls.push(name);
          if (name === 'review_admin_status') return { data: true };
          if (name === 'review_admin_list') return { data: { items: [], total: 0, counts: { pending: 0, approved: 0, rejected: 0, all: 0 } } };
          throw new Error('Unexpected mocked moderation request');
        }
      };
    }
  };
  vm.runInContext(script, context);
  const tab = { $, auth: () => auth, storage, historyEntries, effects, calls, events };
  tabs.push(tab);
  return tab;
}

async function settle() {
  for (let index = 0; index < 12; index++) await new Promise(resolve => setTimeout(resolve, 1));
}

(async () => {
  try {
    const original = makeTab();
    await settle();
    assert.equal(original.$('login').hidden, false);

    let releaseUser;
    const userGate = new Promise(resolve => { releaseUser = resolve; });
    const callback = makeTab({ href: callbackURL(), userGate });
    await settle();
    assert.equal(callback.effects[0], 'replace-history', 'Scrub callback before any Auth HTTP request');
    assert.equal(callback.historyEntries.length, 1);
    assert.ok(callback.historyEntries.every(entry => entry === pageURL), 'No auth parameters remain in modeled history');
    releaseUser();
    await settle();
    assert.equal(callback.$('workspace').hidden, false, 'Magic-link tab authenticates');
    assert.equal(original.$('workspace').hidden, true);
    assert.equal(original.$('login').hidden, false);
    assert.equal(original.storage.has(sessionKey), false, 'Session remains isolated to callback tab');
    assert.equal(broadcasts.filter(event => event === 'SIGNED_OUT').length, 0, 'Original tab must not sign out the callback tab');
    assert.ok(callback.historyEntries.every(entry => entry === pageURL), 'SDK hash clearing must not restore a secret history entry');

    const expired = makeTab({ href: `${pageURL}#error=access_denied&error_code=otp_expired&error_description=Expired` });
    await settle();
    assert.equal(expired.$('workspace').hidden, true);
    assert.match(expired.$('notice').textContent, /登录链接已失效/);
    assert.equal(expired.historyEntries.length, 1);
    assert.ok(expired.historyEntries.every(entry => entry === pageURL));
    assert.equal(expired.calls.length, 0, 'Expired callback performs no private RPC or Auth HTTP request');

    callback.$('logout').click();
    await settle();
    assert.equal(callback.storage.has(sessionKey), false);
    assert.equal(callback.$('workspace').hidden, true);
    assert.match(callback.$('notice').textContent, /已退出登录/);
    const rpcCount = callback.calls.filter(call => call.startsWith('review_admin_')).length;
    // A subsequent valid SDK event must not re-enter a deliberately locked page.
    assert.equal((await callback.auth().setSession(syntheticSession())).error, null);
    await settle();
    assert.equal(callback.$('workspace').hidden, true);
    assert.equal(callback.calls.filter(call => call.startsWith('review_admin_')).length, rpcCount);

    const unavailable = makeTab({ href: callbackURL(), failLogout: true });
    await settle();
    assert.equal(unavailable.$('workspace').hidden, false);
    unavailable.$('logout').click();
    await settle();
    assert.equal(unavailable.storage.has(sessionKey), false);
    assert.equal(unavailable.$('workspace').hidden, true);
    assert.match(unavailable.$('notice').textContent, /未能确认服务器退出/);
    const failedLogoutRPCs = unavailable.calls.filter(call => call.startsWith('review_admin_')).length;
    assert.equal((await unavailable.auth().setSession(syntheticSession())).error, null);
    await settle();
    assert.equal(unavailable.$('workspace').hidden, true);
    assert.equal(unavailable.calls.filter(call => call.startsWith('review_admin_')).length, failedLogoutRPCs);

    console.log('PASS: actual pinned Auth SDK: callback scrubbing before network, history replacement, expired-link guidance, isolated-tab magic-link login, manual logout lock, and failed logout lock. No network or live accounts used.');
  } finally {
    for (const tab of tabs) await tab.auth()?.dispose();
  }
})().catch(error => {
  // Do not serialize SDK sessions or assertion operands that could contain tokens.
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});
