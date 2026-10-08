/* Three relaxed English–French games; interface language never changes a round. */
(() => {
  'use strict';
  const C = window.BilingualCore, D = window.BilingualData, I = window.KrisI18n;
  const mode = document.body.dataset.wordGame, root = document.getElementById('word-app');
  if (!C || !D || !I || !root || !['memory','bridge','sentences'].includes(mode)) return;
  const t = (zh,en,fr) => I.t(zh,en,fr);
  const topics = mode === 'sentences' ? D.sentenceTopics : D.wordGameTopics;
  const levels = mode === 'sentences' ? [3,4,6] : [4,6,8];
  const key = 'kris-word-v1-' + mode + (mode !== 'sentences' && !D.usingSharedBank ? '-fallback' : '');
  let storage; try { storage = window.localStorage; } catch (_) { storage = null; }
  const validKeys = topics.flatMap(topic => levels.map(n => topic.id + ':' + n));
  const progress = C.readProgress(storage, key, validKeys);
  let topicIndex = 0, count = levels[0], state, recorded = false, feedback = 'ready', latestPair = null, saved = !!storage;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button = (act,value,label,cls='',disabled=false,extra='') => `<button type="button" data-act="${act}" data-value="${esc(value)}" class="${cls}" ${disabled?'disabled':''} ${extra}>${label}</button>`;
  const label = value => value[I.language] || value.zh;
  const titles = {memory:['双语翻翻乐','Bilingual Memory','Mémoire bilingue'],bridge:['单词搭桥','Word Bridge','Le pont des mots'],sentences:['句子对对碰','Sentence Match','Paires de phrases']};
  function title() { return t(...titles[mode]); }
  function reset() { state = C.createRound(topics[topicIndex].items,count,mode); recorded = false; feedback = 'ready'; latestPair = null; }
  function save() {
    if (recorded || state.phase !== 'complete') return;
    recorded = true; C.recordProgress(progress, topics[topicIndex].id + ':' + count, state.moves);
    try { if (!storage) throw new Error('No storage'); storage.setItem(key, JSON.stringify(progress)); saved = true; } catch (_) { saved = false; }
  }
  function pairHTML(pair) { return `<span lang="en">${esc(pair.en)}</span><span class="pair-equals" aria-hidden="true">↔</span><span lang="fr">${esc(pair.fr)}</span>`; }
  function instructions() {
    return mode === 'memory' ? t('每次翻开两张卡片，把意思相同的英文和法文配成一对。记住位置，慢慢来。','Turn over two cards. Match the English and French with the same meaning. Remember their places and take your time.','Retourne deux cartes. Associe l’anglais et le français qui ont le même sens. Retiens leur place et prends ton temps.') : t('先选一张英文卡，再选意思相同的法文卡；也可以先选法文。不用拖动。','Choose an English card and its French match, or start in French. Just click or tap; no dragging.','Choisis une carte en anglais et son équivalent en français, ou commence en français. Clique ou touche les cartes, sans les glisser.');
  }
  function cardHTML(card,index) {
    const matched = state.matched.includes(card.id), selected = state.selected.includes(card.key), hinted = state.hintIds.includes(card.id);
    const face = mode !== 'memory' || matched || selected || hinted;
    const blocked = matched || state.phase !== 'active';
    const name = face ? `${card.language==='en'?'English':'Français'}: ${card.text}${matched?' ✓':''}` : t(`第 ${index+1} 张，${card.language==='en'?'英文':'法文'}，翻开卡片`,`Card ${index+1}, ${card.language==='en'?'English':'French'}, turn over`,`Carte ${index+1}, ${card.language==='en'?'anglais':'français'}, retourner`);
    const cls = `word-card ${face?'face-up':'face-down'} ${matched?'is-matched':''} ${selected?'is-selected':''} ${hinted?'is-hinted':''} ${state.phase==='mismatch'&&selected?'is-miss':''}`;
    const content = `<span class="card-language" lang="${card.language}">${card.language==='en'?'EN · English':'FR · Français'}</span>${face?`<span class="card-word" lang="${card.language}">${esc(card.text)}</span>`:'<span class="card-mark" aria-hidden="true">✦</span>'}<span class="card-bottom">${matched?t('✓ 已配对','✓ Matched','✓ Associée'):hinted?t('提示','Hint','Indice'):face?'↔':String(index+1).padStart(2,'0')}</span>`;
    return button('card',card.key,content,cls,blocked,`aria-label="${esc(name)}" aria-pressed="${selected}"`);
  }
  function columnCards(language) {
    const cards = state.cards.filter(card => card.language === language);
    if (language !== 'fr' || state.phase !== 'complete') return cards;
    // Once the puzzle is solved, make each row a correct bilingual study pair.
    return state.cards.filter(card => card.language === 'en').map(card => cards.find(match => match.id === card.id));
  }
  function feedbackHTML() {
    if (state.phase === 'hint') return `<strong>${t('看清这一对，再试着找回来','Notice this pair, then find it yourself','Observe cette paire, puis retrouve-la')}</strong><div class="feedback-pair">${pairHTML(latestPair)}</div><p>${t('提示不会自动得分。','Hints do not automatically earn a match.','Un indice ne valide pas la paire.')}</p>${button('continue','',t('记住了，继续','Got it, continue','J’ai compris, continuer'),'primary-button')}`;
    if (state.phase === 'mismatch') return `<strong>${t('这两张意思不同，再试一次','Different meanings. Try again','Ces cartes ont des sens différents. Réessaie')}</strong><p>${t('先读一读卡片，再继续。没有时间限制。','Read both cards before continuing. There is no time limit.','Lis les deux cartes avant de continuer. Il n’y a pas de limite de temps.')}</p>${button('continue','',t('继续配对','Keep matching','Continuer'),'primary-button')}`;
    if (state.phase === 'complete') return `<strong>${t('太棒了，这一组全部配对！','Lovely work! Every pair found','Bravo ! Toutes les paires sont réunies')}</strong><p>${t(`完成 ${count} 对，用了 ${state.moves} 次尝试和 ${state.hints} 次提示。`,`You matched ${count} pairs in ${state.moves} tries with ${state.hints} hints.`,`${count} paires trouvées en ${state.moves} essais, avec ${state.hints} indices.`)}</p><div class="finish-actions">${button('restart','',t('洗牌再玩','Shuffle & play again','Mélanger et rejouer'),'primary-button')}${button('next-topic','',t('下一个主题 →','Next theme →','Thème suivant →'),'quiet-button')}</div>`;
    if (feedback === 'match' && latestPair) return `<strong>${t('意思相同，配对成功！','Same meaning. A perfect pair!','Même sens. Une paire réussie !')}</strong><div class="feedback-pair">${pairHTML(latestPair)}</div>`;
    if (state.selected.length) return `<strong>${t('现在找意思相同的另一张','Now find the same meaning','Trouve maintenant le même sens')}</strong><p>${mode==='memory'?t('一张英文，一张法文。','One English card, one French card.','Une carte en anglais, une carte en français.'):t('在另一栏选择；再点同一栏可换一个词。','Choose from the other column. Another card in this column changes your choice.','Choisis dans l’autre colonne. Une autre carte de cette colonne change ton choix.')}</p>`;
    return `<strong>${t('准备好了？从任意一张开始','Ready? Start with any card','Prêt ? Commence par une carte')}</strong><p>${t('不计时，不扣分。每一次尝试都在学习。','No timer and no lost points. Every try is practice.','Pas de chrono ni de points perdus. Chaque essai aide à apprendre.')}</p>`;
  }
  function render(focus) {
    const topic = topics[topicIndex], stampKey = topic.id+':'+count, best = progress[stampKey]?.best;
    document.title = title() + ' · Kris';
    const announcement = document.getElementById('word-announcement');
    root.innerHTML = `<header class="word-hero"><div><span class="eyebrow">${t('双语小旅行 · 8–10 岁','A LITTLE BILINGUAL JOURNEY · AGES 8–10','UNE PETITE AVENTURE BILINGUE · 8–10 ANS')}</span><h1>${title()}</h1><p>${mode==='memory'?t('一份记忆，两种语言。翻开小卡片，发现新朋友。','One memory, two languages. Turn little cards into new connections.','Une mémoire, deux langues. Retourne les cartes et fais de nouvelles découvertes.'):mode==='bridge'?t('让英文和法文牵起手，把词语搭成一座桥。','Bring English and French together, one word at a time.','Relie l’anglais et le français, un mot à la fois.'):t('从日常小句子出发，发现不同语言里的相同意思。','Find the same idea in two languages, one everyday sentence at a time.','Retrouve la même idée dans deux langues, une petite phrase à la fois.')}</p>${mode!=='sentences'?`<p class="bank-size">${t(`共享词库 · ${D.wordTopics.reduce((n,topic)=>n+topic.items.length,0)} 个词`,`Shared word bank · ${D.wordTopics.reduce((n,topic)=>n+topic.items.length,0)} words`,`Banque commune · ${D.wordTopics.reduce((n,topic)=>n+topic.items.length,0)} mots`)}</p>`:''}</div><div class="hero-cards" aria-hidden="true"><span>hello<small>EN</small></span><span>bonjour<small>FR</small></span><b>✦</b></div></header>
    <div class="word-layout"><aside class="settings-panel"><span class="panel-kicker">${t('你的学习路线','YOUR LEARNING PATH','TON PARCOURS')}</span><h2>${t('选一个主题','Choose a theme','Choisis un thème')}</h2><div class="topic-buttons">${topics.map((item,i)=>button('topic',item.id,`<span aria-hidden="true">${['✿','☀','✎','✦'][i%4]}</span>${esc(label(item.labels))}`,'topic-button'+(i===topicIndex?' current':''),false,`aria-pressed="${i===topicIndex}"`)).join('')}</div><h2>${t('挑战大小','Choose your challenge','Choisis ton défi')}</h2><div class="level-buttons">${levels.map(n=>button('level',n,`${n}<small>${t('对','pairs','paires')}</small>`,'level-button'+(n===count?' current':''),false,`aria-pressed="${n===count}"`)).join('')}</div><p class="setting-note">${t('切换主题或大小会开始新的一局。','Changing theme or size starts a new round.','Changer de thème ou de taille lance une nouvelle manche.')}</p><div class="passport"><span aria-hidden="true">✹</span><div><strong data-stat="stamps">${Object.keys(progress).length} / ${validKeys.length}</strong><small>${t('主题挑战印章','theme challenge stamps','défis validés')}</small></div></div><p class="storage-note">${saved?t('已完成的挑战保存在这台设备。','Completed challenges stay on this device.','Les défis terminés sont gardés sur cet appareil.'):t('进度暂存在本页；浏览器未能保存。','Progress is kept for this visit; browser saving is unavailable.','Les progrès restent sur cette page ; le navigateur ne peut pas les enregistrer.')}</p></aside>
    <section class="play-panel" aria-labelledby="round-title"><div class="round-heading"><div><span class="panel-kicker" lang="en">ENGLISH ↔ FRANÇAIS</span><h2 id="round-title" tabindex="-1">${esc(label(topic.labels))}</h2></div><span class="round-size">${count} ${t('对','pairs','paires')}</span></div><p class="how-to">${instructions()}</p><div class="round-stats"><div><strong data-stat="matched">${state.matched.length} / ${count}</strong><span>${t('已配对','matched','réunies')}</span></div><div><strong data-stat="moves">${state.moves}</strong><span>${t('尝试','tries','essais')}</span></div><div><strong data-stat="hints">${state.hints}</strong><span>${t('提示','hints','indices')}</span></div><div><strong data-stat="best">${best||'—'}</strong><span>${t('本组最少尝试','best tries here','meilleur score ici')}</span></div></div><div class="pair-progress" role="progressbar" aria-label="${t('配对进度','Matching progress','Progression des paires')}" aria-valuenow="${state.matched.length}" aria-valuemin="0" aria-valuemax="${count}"><span style="width:${state.matched.length/count*100}%"></span></div>
    ${mode==='memory'?`<div class="memory-board" aria-label="${t('英法记忆卡片','English–French memory cards','Cartes mémoire anglais–français')}">${state.cards.map(cardHTML).join('')}</div>`:`<div class="match-board ${mode==='sentences'?'sentence-board':''}">${['en','fr'].map(language=>`<section class="language-column"><h3 lang="${language}"><span>${language==='en'?'EN':'FR'}</span>${language==='en'?'English':'Français'}</h3><div>${columnCards(language).map(c=>cardHTML(c,state.cards.indexOf(c))).join('')}</div></section>`).join('')}</div>`}
    <div class="round-feedback ${state.phase==='complete'?'complete':''}" id="word-feedback">${feedbackHTML()}</div><div class="board-tools">${button('hint','',t('✧ 看一对提示','✧ Show one pair','✧ Voir une paire'),'hint-button',state.phase!=='active')}${button('restart','',t('↻ 洗牌重来','↻ New shuffled round','↻ Nouvelle manche'),'quiet-button')}</div><details class="learning-note"><summary>${t('小小语言发现','A little language discovery','Une petite découverte linguistique')}</summary><p>${esc(label(topic.hints))}</p></details>${state.matched.length?`<section class="found-pairs"><h3>${t('已经认识的好搭档','Pairs you have discovered','Les paires découvertes')}</h3><ul>${state.pairs.filter(p=>state.matched.includes(p.id)).map(p=>`<li>${pairHTML(p)}</li>`).join('')}</ul></section>`:''}</section></div>
    <nav class="more-word-games" aria-label="${t('更多英法游戏','More English–French games','D’autres jeux anglais–français')}"><span>${t('继续双语小旅行','Keep exploring in two languages','Continue l’aventure bilingue')}</span>${[['memory','bilingual-memory'],['bridge','word-bridge'],['sentences','sentence-match']].filter(([name])=>name!==mode).map(([name,path])=>`<a href="${path}.html">${t(...titles[name])} ↗</a>`).join('')}</nav>`;
    // Only announced after a user action; translating the UI never repeats a win or saves twice.
    if (announcement && focus) announcement.textContent = root.querySelector('#word-feedback').textContent;
    if (focus) {
      let target = root.querySelector(focus);
      if (!target || target.disabled) target = state.phase==='complete'?root.querySelector('button[data-act="next-topic"]'):root.querySelector('button[data-act="card"]:not([disabled])');
      target?.focus({preventScroll:true});
    }
  }
  root.setAttribute('data-i18n-skip','');
  root.addEventListener('click', event => {
    const target = event.target.closest('button[data-act]');
    if (!target || target.disabled || !root.contains(target)) return;
    const {act,value} = target.dataset;
    let focus = `button[data-act="${act}"][data-value="${value}"]`;
    if (act === 'card') {
      const card = state.cards.find(c=>c.key===value); if (!card) return;
      const result = C.choose(state,value); if (result === 'ignored') return;
      feedback = result; latestPair = result==='match'?state.pairs.find(p=>p.id===card.id):null;
      if (state.phase==='mismatch') focus='button[data-act="continue"]';
      if (state.phase==='complete') {save();focus='button[data-act="next-topic"]';}
    } else if (act === 'hint') { latestPair=C.hint(state); if (!latestPair) return; focus='button[data-act="continue"]'; }
    else if (act === 'continue') { if(!C.dismiss(state))return; feedback='ready';latestPair=null;focus='button[data-act="hint"]'; }
    else if (act === 'restart') { reset(); focus='#round-title'; }
    else if (act === 'topic') { const next=topics.findIndex(p=>p.id===value); if(next<0)return; topicIndex=next; reset(); focus='#round-title'; }
    else if (act === 'level') { const n=Number(value); if(!levels.includes(n))return; count=n;reset();focus='#round-title'; }
    else if (act === 'next-topic' && state.phase==='complete') {topicIndex=(topicIndex+1)%topics.length;reset();focus='#round-title';}
    else return;
    render(focus);
  });
  I.onChange(()=>render());
  reset(); render();
})();
