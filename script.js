/* Progressive enhancement: the complete directory is readable without JavaScript.
 * content.md remains the source of truth. Only its heading/link-list format is
 * parsed; external HTML is never injected and no third-party runtime is needed.
 */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const gameGrid = $('#game-grid');
  const resourceGrid = $('#resource-grid');
  const familyGrid = $('#family-grid');
  if (!gameGrid || !resourceGrid || !familyGrid) return;

  const categories = {
    '游戏 (Games)': { key: 'games', label: '趣味游戏', icon: 'shapes' },
    '阅读 (Reading)': { key: 'reading', label: '阅读识字', icon: 'book' },
    '科学 (Science)': { key: 'science', label: '科学探索', icon: 'planet' },
    '工具 (Tools)': { key: 'tools', label: '创意工具', icon: 'palette' },
    '本地生活 (Local Life)': { key: 'life', label: '本地生活', icon: 'heart' },
    '医疗健康 (Medical/Health)': { key: 'health', label: '医疗健康', icon: 'heart' }
  };
  const gameStyles = {
    './shape_sorter_math.html': ['peach', 'shapes', '动手学数学'],
    './addition_game.html': ['mint', 'math', '加法小挑战'],
    './vocabulary_quiz.html': ['lavender', 'words', '词语大挑战'],
    './games/chinese_character_quiz.html': ['yellow', 'chinese', '认识新汉字'],
    './games/math_addition_subtraction.html': ['blue', 'timer', '算一算 · 练一练'],
    './games/math_visual_game.html': ['pink', 'chick', '边看边学']
  };
  const state = { category: 'all', expanded: false };
  const search = $('#resource-search');
  const showMore = $('#show-more');
  const clearSearch = $('#clear-search');
  const status = $('#results-status');
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
  const localURL = (url) => /^\.\/(?!\/)[^?#]+\.html(?:[?#].*)?$/i.test(url);
  const safeURL = (url) => localURL(url) || /^https?:\/\//i.test(url);

  function parseDirectory(markdown) {
    let category = '';
    let subgroup = '';
    const entries = [];
    for (const line of markdown.split(/\r?\n/)) {
      if (line.startsWith('## ')) {
        category = line.slice(3).trim();
        subgroup = '';
      } else if (line.startsWith('### ')) {
        subgroup = line.slice(4).trim();
      } else {
        const match = line.match(/^\s*[-*]\s+\[([^\]]+)\]\((\S+)\)\s*-\s*(.+)$/);
        if (match && safeURL(match[2])) {
          entries.push({ title: match[1], url: match[2], description: match[3], category, subgroup });
        }
      }
    }
    if (!entries.length) throw new Error('No readable directory entries');
    return entries;
  }

  function createGame(entry) {
    const [theme, art, tag] = gameStyles[entry.url] || ['mint', 'shapes', '一起玩一玩'];
    const link = document.createElement('a');
    link.className = `game-card theme-${theme}`;
    link.href = entry.url;
    link.setAttribute('data-game', '');
    link.innerHTML = `<div class="game-art">${icon(art)}<span class="art-spark spark-one">✦</span><span class="art-spark spark-two">✧</span><span class="game-tag">${tag}</span></div><div class="game-copy"><div class="game-title-row"><h3></h3><span class="round-arrow">${icon('arrow')}</span></div><p></p><span class="game-link">开始玩 ${icon('arrow')}</span></div>`;
    link.querySelector('h3').textContent = entry.title;
    link.querySelector('p').textContent = entry.description;
    return link;
  }

  function createResource(entry) {
    const category = categories[entry.category] || { key: 'other', label: '更多发现', icon: 'book' };
    const link = document.createElement('a');
    link.className = `resource-card category-${category.key}`;
    link.href = entry.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.dataset.category = category.key;
    link.dataset.resourceTitle = entry.title;
    link.innerHTML = `<span class="resource-icon">${icon(category.icon)}</span><div class="resource-copy"><div class="resource-meta"></div><h3></h3><p></p></div><span class="sr-only">（外部网站，在新标签页打开）</span>`;
    const meta = link.querySelector('.resource-meta');
    meta.textContent = category.label;
    if (entry.subgroup) {
      const language = document.createElement('span');
      language.className = 'language-tag';
      language.textContent = 'English';
      language.title = entry.subgroup;
      meta.append(language);
      const subgroup = document.createElement('span');
      subgroup.className = 'sr-only';
      subgroup.textContent = entry.subgroup;
      meta.append(subgroup);
    }
    link.querySelector('h3').textContent = entry.title + ' ';
    link.querySelector('h3').insertAdjacentHTML('beforeend', icon('external'));
    link.querySelector('p').textContent = entry.description;
    return link;
  }

  function renderDirectory(entries) {
    const games = document.createDocumentFragment();
    const resources = document.createDocumentFragment();
    const family = document.createDocumentFragment();
    let gameCount = 0;
    for (const entry of entries) {
      if (localURL(entry.url)) {
        games.append(createGame(entry));
        gameCount += 1;
      } else if (['life', 'health'].includes(categories[entry.category]?.key)) {
        family.append(createResource(entry));
      } else {
        resources.append(createResource(entry));
      }
    }
    gameGrid.replaceChildren(games);
    resourceGrid.replaceChildren(resources);
    familyGrid.replaceChildren(family);
    $('#game-count').textContent = String(gameCount);
    $('#surprise-button').hidden = gameCount === 0;
    applyFilters();
  }

  function applyFilters() {
    const query = search.value.trim().toLocaleLowerCase();
    const cards = Array.from(resourceGrid.querySelectorAll('.resource-card'));
    const matches = cards.filter((card) => {
      const categoryMatches = state.category === 'all' || card.dataset.category === state.category;
      return categoryMatches && (!query || card.textContent.toLocaleLowerCase().includes(query));
    });
    const limitResults = state.category === 'all' && !query && !state.expanded;
    const visible = new Set(limitResults ? matches.slice(0, 6) : matches);
    cards.forEach((card) => { card.hidden = !visible.has(card); });
    document.querySelectorAll('[data-filter]').forEach((button) => {
      const active = button.dataset.filter === state.category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    clearSearch.hidden = search.value.length === 0;
    $('#empty-state').hidden = matches.length !== 0;
    status.textContent = visible.size < matches.length
      ? `共 ${matches.length} 个学习资源，先来探索这 ${visible.size} 个吧`
      : `找到 ${matches.length} 个学习资源`;
    showMore.hidden = state.category !== 'all' || Boolean(query) || matches.length <= 6;
    showMore.setAttribute('aria-expanded', String(state.expanded));
    showMore.setAttribute('aria-controls', 'resource-grid');
    showMore.textContent = state.expanded ? '收起资源 ↑' : `探索全部 ${matches.length} 个资源 ↓`;
  }

  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      state.category = button.dataset.filter;
      state.expanded = false;
      applyFilters();
    });
  });
  search.addEventListener('input', () => { state.expanded = false; applyFilters(); });
  clearSearch.addEventListener('click', () => { search.value = ''; applyFilters(); search.focus(); });
  $('#reset-filters').addEventListener('click', () => {
    search.value = '';
    state.category = 'all';
    state.expanded = false;
    applyFilters();
    $('[data-filter="all"]').focus();
  });
  showMore.addEventListener('click', () => { state.expanded = !state.expanded; applyFilters(); });
  $('#surprise-button').addEventListener('click', () => {
    const games = Array.from(gameGrid.querySelectorAll('[data-game]'));
    if (games.length) window.location.assign(games[Math.floor(Math.random() * games.length)].getAttribute('href'));
  });
  $('#resource-toolbar').hidden = false;
  $('#surprise-button').hidden = gameGrid.childElementCount === 0;
  applyFilters();

  fetch('content.md')
    .then((response) => {
      if (!response.ok) throw new Error(`Content HTTP ${response.status}`);
      return response.text();
    })
    .then(parseDirectory)
    .then(renderDirectory)
    .catch(() => {
      // The embedded complete directory is intentionally kept as a fallback.
      const message = $('#content-status');
      message.textContent = '暂时无法更新资源，已显示现有内容。你可以继续探索，或稍后刷新。';
      message.hidden = false;
    });
})();
