/* One isolated, dependency-free review widget for every game. */
(function () {
  'use strict';
  if (!window.customElements || customElements.get('kris-reviews')) return;
  const endpoint = window.KRIS_REVIEWS_CONFIG && window.KRIS_REVIEWS_CONFIG.endpoint;
  if (typeof endpoint !== 'string' || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/game-reviews$/.test(endpoint)) return;
  const css = `
    :host{display:block;clear:both;flex:0 0 auto;width:min(760px,calc(100% - 32px));margin:36px auto;position:relative;z-index:1;text-align:left;user-select:text;-webkit-user-select:text;touch-action:auto;color:#29372c;font:16px/1.65 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:normal}
    *{box-sizing:border-box} [hidden]{display:none!important} section{background:#fffdf6;border:1px solid #dbe2cd;border-radius:24px;padding:clamp(20px,5vw,34px);box-shadow:0 8px 24px #344b2510}
    h2{font-size:1.5rem;margin:0;color:#294c35}h3{font-size:1.05rem;margin:0 0 12px}p{margin:8px 0}.intro{color:#60715e;font-size:.94rem}.top{display:flex;justify-content:space-between;gap:16px;align-items:center}.spark{font-size:2rem;color:#b46d26}
    .public{padding:24px 0;border-bottom:1px solid #dfe5d5;margin-bottom:24px}.list{display:grid;gap:12px;margin:0;padding:0;list-style:none}.review{background:#f1f5e9;border-radius:14px;padding:14px 16px}.review p{white-space:pre-wrap;overflow-wrap:anywhere;margin:4px 0}.byline{font-size:.8rem;color:#52634f}.byline time{margin-left:10px}.note{font-size:.83rem;color:#596951}.quiet{color:#657360;font-size:.92rem}
    form{margin:0}label{display:block;font-weight:700;margin-bottom:8px}input,textarea,button{font:inherit}input,textarea{width:100%;min-height:48px;border:1px solid #b5c3a7;background:#fff;color:#27382c;border-radius:12px;padding:11px 13px}textarea{display:block;min-height:125px;resize:vertical;line-height:1.6}input:focus-visible,textarea:focus-visible,button:focus-visible{outline:3px solid #d79b30;outline-offset:3px}button{cursor:pointer;border:0;background:#345941;color:#fff;border-radius:999px;min-height:44px;padding:10px 20px;font-weight:700}button:disabled{opacity:.55;cursor:wait}.secondary{background:#e9efdf;color:#355340;font-size:.86rem;padding:8px 14px}.row{display:flex;gap:12px;align-items:center;margin-top:12px;flex-wrap:wrap}.count{margin-left:auto;color:#63735e;font-size:.8rem}.status{min-height:1.65em;font-weight:600;font-size:.9rem;color:#385c3c}.status[data-error="true"]{color:#963e2d}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    @media(max-width:380px){:host{width:calc(100% - 20px)}section{padding:18px}.row button{width:100%}.count{margin-left:0}.top{gap:8px}h2{font-size:1.3rem}}
  `;
  class KrisReviews extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this._busy = false;
      this._answer = '';
      this._game = this.getAttribute('data-game');
      const root = this.attachShadow({ mode: 'open' });
      // This template is constant. All remote/user text below uses textContent.
      root.innerHTML = `<style>${css}</style><section aria-labelledby="reviews-title" lang="zh-CN"><div class="top"><div><h2 id="reviews-title">玩家评价</h2><p class="intro">哪里有趣？还想玩什么？说说你的发现。</p></div><span class="spark" aria-hidden="true">✦</span></div><div class="public"><div class="top"><h3>大家的游戏体验</h3><button class="secondary" id="refresh" type="button">刷新评价</button></div><p id="list-state" class="quiet" role="status" aria-live="polite">正在加载…</p><ol id="reviews-list" class="list"></ol><p class="note">只展示审核通过的评价，最多显示最近 50 条。</p></div><form id="gate"><label for="answer">Kris 的 last name 是什么？</label><input id="answer" type="text" maxlength="120" required autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="privacy gate-help"><p id="gate-help" class="note">答对这个小问题，就可以写评价。</p><div class="row"><button id="verify" type="submit">验证答案 →</button></div></form><form id="compose" hidden><label for="review">写下你的游戏体验</label><textarea id="review" maxlength="500" required aria-describedby="privacy count" placeholder="例如：这一关很好玩，我还想挑战更难的题！"></textarea><div class="row"><button id="submit" type="submit">提交，等待审核</button><button id="cancel" class="secondary" type="button">返回验证</button><span id="count" class="count">0 / 500</span></div></form><p id="status" class="status" role="status" aria-live="polite" aria-atomic="true"></p><p id="privacy" class="note">无需姓名或账号。评价会发送至本站的 Supabase 服务，审核通过后匿名公开。请勿填写姓名、联系方式等个人信息。验证答案仅用于即时核对，不保存到评价记录。</p></section>`;
      this.$ = selector => root.querySelector(selector);
      this.$('#gate').addEventListener('submit', event => { event.preventDefault(); this.verify(); });
      this.$('#compose').addEventListener('submit', event => { event.preventDefault(); this.submit(); });
      this.$('#cancel').addEventListener('click', () => { if (!this._busy) { this.lock(); this.status(''); this.$('#answer').focus(); } });
      this.$('#refresh').addEventListener('click', () => this.load());
      this.$('#review').addEventListener('input', () => { this.$('#count').textContent = `${this.$('#review').value.length} / 500`; });
      this._onPageHide = () => { this._generation = (this._generation || 0) + 1; this.lock(); this.setBusy(false); };
      window.addEventListener('pagehide', this._onPageHide);
      this.load();
    }
    disconnectedCallback() { window.removeEventListener('pagehide', this._onPageHide); }
    status(message, error = false) { this.$('#status').textContent = message; this.$('#status').setAttribute('data-error', String(error)); }
    setBusy(value) { this._busy = value; ['#verify', '#submit', '#cancel'].forEach(id => { this.$(id).disabled = value; }); }
    lock() { this._answer = ''; this.$('#answer').value = ''; this.$('#gate').hidden = false; this.$('#compose').hidden = true; }
    message(code) {
      return ({ answer: '答案还不对，再想一想。', rate_limited: '尝试有点频繁，请稍后再来。', review: '请填写 1–500 字的评价。', request: '内容没有提交成功，请检查后重试。' })[code] || '暂时连接不上，内容还在，请稍后重试。';
    }
    async request(options = {}) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(options.body ? endpoint : `${endpoint}?game=${encodeURIComponent(this._game)}`, {
          method: options.body ? 'POST' : 'GET', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: controller.signal,
          ...(options.body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options.body) } : {})
        });
        const data = await response.json();
        if (!response.ok) throw new Error(this.message(data.code));
        return data;
      } catch (error) {
        if (error instanceof Error && Object.values({ a: this.message('answer'), b: this.message('rate_limited'), c: this.message('review'), d: this.message('request') }).includes(error.message)) throw error;
        throw new Error(this.message());
      } finally { clearTimeout(timer); }
    }
    async load() {
      if (this._loading) return;
      this._loading = true; this.$('#refresh').disabled = true;
      this.$('#list-state').textContent = '正在加载…';
      try {
        const data = await this.request();
        if (!Array.isArray(data.reviews)) throw new Error('invalid list');
        const list = this.$('#reviews-list'); list.replaceChildren();
        data.reviews.slice(0, 50).forEach(review => {
          if (typeof review.body !== 'string' || typeof review.date !== 'string') return;
          const item = document.createElement('li'); item.className = 'review';
          const byline = document.createElement('div'); byline.className = 'byline'; byline.textContent = '匿名玩家';
          if (/^\d{4}-\d{2}-\d{2}$/.test(review.date)) { const date = document.createElement('time'); date.setAttribute('datetime', review.date); date.textContent = review.date; byline.append(date); }
          const text = document.createElement('p'); text.textContent = review.body.slice(0, 500);
          item.append(byline, text); list.append(item);
        });
        this.$('#list-state').textContent = list.children.length ? '' : '还没有公开评价。来分享你的第一份游戏体验吧！';
      } catch { this.$('#list-state').textContent = '评价暂时没有加载出来，可以稍后点“刷新评价”。'; }
      finally { this._loading = false; this.$('#refresh').disabled = false; }
    }
    async verify() {
      if (this._busy) return;
      const answer = this.$('#answer').value.trim();
      if (!answer) { this.status('先回答这个小问题吧。', true); this.$('#answer').focus(); return; }
      this.setBusy(true); this.status('正在验证…');
      const generation = this._generation || 0;
      try {
        const result = await this.request({ body: { action: 'verify', game: this._game, answer } });
        if ((this._generation || 0) !== generation) return;
        if (result.ok !== true) throw new Error(this.message());
        this._answer = answer; this.$('#answer').value = '';
        this.$('#gate').hidden = true; this.$('#compose').hidden = false;
        this.status('答对了！提交后会先进入审核。'); this.$('#review').focus();
      } catch (error) { if ((this._generation || 0) === generation) this.status(error.message, true); }
      finally { if ((this._generation || 0) === generation) this.setBusy(false); }
    }
    async submit() {
      if (this._busy) return;
      if (!this._answer) { this.lock(); this.status('请先验证答案。', true); return; }
      const body = this.$('#review').value.trim();
      if (!body || body.length > 500) { this.status(this.message('review'), true); this.$('#review').focus(); return; }
      this.setBusy(true); this.status('正在提交…');
      const generation = this._generation || 0;
      try {
        const result = await this.request({ body: { action: 'submit', game: this._game, answer: this._answer, body } });
        if ((this._generation || 0) !== generation) return;
        if (result.status !== 'pending' || result.ok !== true) throw new Error(this.message());
        this.$('#review').value = ''; this.$('#count').textContent = '0 / 500'; this.lock();
        this.status('已收到，谢谢你！评价审核通过后会公开显示。');
      } catch (error) { if ((this._generation || 0) === generation) this.status(error.message, true); }
      finally { if ((this._generation || 0) === generation) this.setBusy(false); }
    }
  }
  customElements.define('kris-reviews', KrisReviews);
}());
