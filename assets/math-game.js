(() => {
  'use strict';
  const M = window.KrisMath;
  const $ = id => document.getElementById(id);
  const mode = document.body.dataset.mode;
  const multiply = mode === 'multiplication';
  const total = 6;
  const copy = {
    zh: {
      home: '回到乐园', playground: '的学习乐园', soundOn: '声音开', soundOff: '已静音', addition: '加法果园', multiplication: '乘法星球',
      mission: '今天的小任务', stars: '颗星星', rangeLabel: '练习范围', restart: '重新开始 ↻', hint: '💡 换个思路',
      typeAnswer: '也可以输入答案', check: '检查', learn: '一起看答案', replay: '🔊 再听一次', next: '下一题 →', finish: '看看收获 →',
      playAgain: '再来一轮 ↻', otherGames: '回乐园玩别的游戏', review: '点一点，再听一遍', footer: '让好奇心发芽',
      gentle: '不用抢时间，想一想、数一数，每次尝试都在进步。',
      description: multiply ? '把小星星分成组，听一句口诀，点亮一颗星球。' : '把两篮果子合起来，收集属于你的星星。',
      all: '混合练习 · 1–10', easy: '轻松练习 · 1–10', challenge: '进阶练习 · 1–20', table: n => `${n} 的乘法 · ×1 到 ×10`,
      round: n => `第 ${n} / ${total} 题`, completed: '这轮完成啦', progress: (n, state) => `第${n}题，${state === 'correct' ? '获得星星' : state === 'learned' ? '已学习' : state === 'current' ? '正在挑战' : '等待挑战'}`,
      sceneTag: multiply ? '小星星，一组一组数' : '小果子，合在一起数',
      sceneTitle: (a, b) => multiply ? `${a} 组星星，每组 ${b} 颗` : '两篮果子，一共有多少？',
      sceneInstruction: multiply ? '点亮每一组，看看数量怎样增加。' : '点一点两只篮子，看看数量怎样增加。',
      group: (i, b) => `第${i}组，${b}颗星星`, basket: (i, n) => `第${i}篮，${n}个果子`, groupShort: n => `第 ${n} 组`, basketShort: n => `第 ${n} 篮`,
      counting: (n, sum) => multiply ? `已点亮 ${n} 组，共 ${sum} 颗星星` : `已数 ${n} 篮，共 ${sum} 个果子`,
      countingStart: '试着点一点，边看边数。', thinking: '想一想，再选一选', help: '选一个答案，或在下面输入。', choiceLabel: '选择答案',
      invalid: '先输入一个完整的数字吧。', wrong: '还差一点！试试点亮小图案，再数一数。', correct: '答对啦！又收集到一颗星星 ★', learned: '一起学会这一题，下次一定更熟练。',
      resultLabel: (a, b) => multiply ? (a === 10 || b === 10 ? '跟着读一遍算式' : '跟着读一遍口诀') : '跟着读一遍，记住新发现',
      summaryTitle: '小小探险家，做到了！', summaryCopy: n => `完成了 ${total} 道练习，收集了 ${n} 颗星星。每一次尝试都算数！`,
      hintMultiply: (a, b) => `每组都是 ${b} 颗，连续加 ${a} 次：${Array(a).fill(b).join(' + ')}。`,
      hintAddition: (a, b) => { const high = Math.max(a, b), low = Math.min(a, b), gap = 10 - high % 10; return high % 10 && low >= gap ? `试试凑整十：先给 ${high} 加 ${gap}，再加剩下的 ${low - gap}。` : `从 ${high} 开始，再向上数 ${low} 个。`; },
      ready: '每题完成后会朗读。没听到？点「再听一次」。', starting: '正在准备语音…', speaking: '正在朗读，跟着轻轻念一遍吧。', muted: '声音已关闭，文字提示依然在。',
      unsupported: '这个浏览器不支持朗读。可以看着文字一起读，游戏照常进行。', failed: '语音暂时没响，点「再听一次」试试；也可以看着文字读。', noVoice: '设备暂未提供这种语言的语音，请看文字朗读，或在设备上添加相应语音。',
      rangeTitle: '更换范围会开始新一轮', replayTitle: '重新朗读这一题', mutedReplay: '先打开声音，再播放', unsupportedReplay: '浏览器不支持语音'
    },
    fr: {
      home: 'Retour au parc', playground: 'Parc des découvertes', soundOn: 'Son activé', soundOff: 'Son coupé', addition: 'Verger des additions', multiplication: 'Planète des multiplications',
      mission: 'Ta petite mission', stars: 'étoiles', rangeLabel: 'Entraînement', restart: 'Recommencer ↻', hint: '💡 Un petit indice',
      typeAnswer: 'Tu peux aussi écrire ta réponse', check: 'Vérifier', learn: 'Découvrons la réponse', replay: '🔊 Réécouter', next: 'Suivante →', finish: 'Voir tes étoiles →',
      playAgain: 'Une autre partie ↻', otherGames: 'Découvrir les autres jeux', review: 'Touche une réponse pour la réécouter', footer: 'Fais grandir ta curiosité',
      gentle: 'Prends ton temps. Réfléchis, compte et savoure chaque petite découverte.',
      description: multiply ? 'Forme des groupes d’étoiles, apprends une formule en chinois et illumine une planète.' : 'Réunis les fruits de deux paniers et collectionne les étoiles.',
      all: 'Tables mélangées · 1 à 10', easy: 'Pour commencer · 1 à 10', challenge: 'Un peu plus loin · 1 à 20', table: n => `Table de ${n} · de ×1 à ×10`,
      round: n => `Question ${n} / ${total}`, completed: 'Partie terminée', progress: (n, state) => `Question ${n} : ${state === 'correct' ? 'étoile gagnée' : state === 'learned' ? 'réponse découverte ensemble' : state === 'current' ? 'en cours' : 'à venir'}`,
      sceneTag: multiply ? 'Compte un groupe à la fois' : 'Réunis tous les fruits',
      sceneTitle: (a, b) => multiply ? `${a} ${a === 1 ? 'groupe' : 'groupes'} de ${b} ${b === 1 ? 'étoile' : 'étoiles'}` : 'Combien y a-t-il de fruits en tout ?',
      sceneInstruction: multiply ? 'Touche chaque groupe et regarde le total augmenter.' : 'Touche chaque panier et regarde le total augmenter.',
      group: (i, b) => `Groupe ${i}, ${b} ${b === 1 ? 'étoile' : 'étoiles'}`, basket: (i, n) => `Panier ${i}, ${n} ${n === 1 ? 'fruit' : 'fruits'}`, groupShort: n => `Groupe ${n}`, basketShort: n => `Panier ${n}`,
      counting: (n, sum) => multiply ? `${n} ${n === 1 ? 'groupe allumé' : 'groupes allumés'}, ${sum} ${sum === 1 ? 'étoile' : 'étoiles'} en tout` : `${n} ${n === 1 ? 'panier compté' : 'paniers comptés'}, ${sum} ${sum === 1 ? 'fruit' : 'fruits'} en tout`,
      countingStart: 'Touche une image pour compter.', thinking: 'RÉFLÉCHIS · COMPTE · CHOISIS', help: 'Choisis une réponse ou écris-la ci-dessous.', choiceLabel: 'Choisir une réponse',
      invalid: 'Écris d’abord un nombre entier.', wrong: 'Presque ! Touche les images et compte encore une fois.', correct: 'Bravo ! Tu as gagné une étoile de plus ★', learned: 'Nous avons trouvé ensemble. Continue tes découvertes !',
      resultLabel: (a, b) => multiply ? (a === 10 || b === 10 ? 'Lis le calcul en chinois' : 'Écoute la formule de multiplication en chinois') : 'Dis le calcul à voix haute pour t’en souvenir',
      summaryTitle: 'Bravo, mission accomplie !', summaryCopy: n => `${total} questions explorées et ${n} ${n === 1 ? 'étoile gagnée' : 'étoiles gagnées'}. Chaque essai te fait progresser !`,
      hintMultiply: (a, b) => `Il y a ${b} ${b === 1 ? 'étoile' : 'étoiles'} par groupe. Additionne ce nombre ${a} fois : ${Array(a).fill(b).join(' + ')}.`,
      hintAddition: (a, b) => { const high = Math.max(a, b), low = Math.min(a, b), gap = 10 - high % 10; return high % 10 && low >= gap ? `Rejoins la dizaine suivante : ajoute ${gap} à ${high}, puis ajoute les ${low - gap} restants.` : `Pars de ${high}, puis compte encore ${low}.`; },
      ready: 'Les réponses sont lues à voix haute. Touche « Réécouter » pour les entendre à nouveau.', starting: 'Préparation de la voix…', speaking: 'Écoute, puis répète à voix haute.', muted: 'Le son est coupé. Tu peux toujours lire les réponses.',
      unsupported: 'Ce navigateur ne peut pas lire à voix haute. Lis les mots et continue à jouer.', failed: 'La lecture n’a pas démarré. Touche « Réécouter » ou lis les mots à voix haute.', noVoice: 'Aucune voix dans cette langue n’est disponible sur cet appareil. Lis le texte ou ajoute la voix correspondante à ton appareil.',
      rangeTitle: 'Changer d’entraînement commence une nouvelle partie', replayTitle: 'Relire cette réponse à voix haute', mutedReplay: 'Active le son pour écouter', unsupportedReplay: 'Lecture vocale indisponible'
    },
    en: {
      home: 'Back home', playground: 'Playground', soundOn: 'Sound on', soundOff: 'Muted', addition: 'Addition Orchard', multiplication: 'Multiplication Planet',
      mission: 'Your little mission', stars: 'stars', rangeLabel: 'Practice', restart: 'Start over ↻', hint: '💡 Try a hint',
      typeAnswer: 'Or type your answer', check: 'Check', learn: 'Let’s learn the answer', replay: '🔊 Hear it again', next: 'Next →', finish: 'See your stars →',
      playAgain: 'Play another round ↻', otherGames: 'Explore other games', review: 'Tap to listen again', footer: 'Let curiosity grow',
      gentle: 'No racing the clock. Think, count, and enjoy each little discovery.',
      description: multiply ? 'Make groups of stars, learn a Chinese rhyme, and light up a planet.' : 'Bring two baskets together and collect a sky full of stars.',
      all: 'Mixed practice · 1–10', easy: 'Easy practice · 1–10', challenge: 'Extra challenge · 1–20', table: n => `${n} times table · ×1 to ×10`,
      round: n => `Question ${n} / ${total}`, completed: 'Round complete', progress: (n, state) => `Question ${n}: ${state === 'correct' ? 'star earned' : state === 'learned' ? 'learned together' : state === 'current' ? 'in progress' : 'up next'}`,
      sceneTag: multiply ? 'Count a group at a time' : 'Bring the fruit together',
      sceneTitle: (a, b) => multiply ? `${a} ${a === 1 ? 'group' : 'groups'}, ${b} ${b === 1 ? 'star' : 'stars'} in each` : 'How much fruit in both baskets?',
      sceneInstruction: multiply ? 'Tap each group and watch the total grow.' : 'Tap each basket and watch the total grow.',
      group: (i, b) => `Group ${i}, ${b} ${b === 1 ? 'star' : 'stars'}`, basket: (i, n) => `Basket ${i}, ${n} ${n === 1 ? 'piece' : 'pieces'} of fruit`, groupShort: n => `Group ${n}`, basketShort: n => `Basket ${n}`,
      counting: (n, sum) => multiply ? `${n} ${n === 1 ? 'group' : 'groups'} lit up, ${sum} ${sum === 1 ? 'star' : 'stars'} in all` : `${n} ${n === 1 ? 'basket' : 'baskets'} counted, ${sum} ${sum === 1 ? 'piece' : 'pieces'} of fruit`,
      countingStart: 'Tap a picture to count along.', thinking: 'THINK · COUNT · CHOOSE', help: 'Choose an answer, or type it below.', choiceLabel: 'Choose an answer',
      invalid: 'Please enter a whole number first.', wrong: 'Not quite yet. Tap the pictures and count again!', correct: 'You got it! One more star for you ★', learned: 'We learned this one together. Keep exploring!',
      resultLabel: (a, b) => multiply ? (a === 10 || b === 10 ? 'Say the equation in Chinese' : 'Listen to the Chinese times-table rhyme') : 'Say it together and remember your discovery',
      summaryTitle: 'You did it, little explorer!', summaryCopy: n => `${total} questions explored and ${n} stars collected. Every try helps you grow!`,
      hintMultiply: (a, b) => `There are ${b} in each group. Add it ${a} times: ${Array(a).fill(b).join(' + ')}.`,
      hintAddition: (a, b) => { const high = Math.max(a, b), low = Math.min(a, b), gap = 10 - high % 10; return high % 10 && low >= gap ? `Make the next ten: add ${gap} to ${high}, then add the remaining ${low - gap}.` : `Start at ${high}, then count up ${low} more.`; },
      ready: 'Answers are read aloud. Tap “Hear it again” if you don’t hear them.', starting: 'Getting the voice ready…', speaking: 'Listen, then say it together.', muted: 'Sound is off. You can still read every answer.',
      unsupported: 'This browser cannot read aloud. Read the words together and keep playing.', failed: 'The voice did not start. Tap “Hear it again”, or read the words together.', noVoice: 'This language’s voice is not available on this device. Read the words, or add a matching device voice.',
      rangeTitle: 'Changing practice starts a new round', replayTitle: 'Read this answer again', mutedReplay: 'Turn sound on to listen', unsupportedReplay: 'Speech is not supported'
    }
  };
  // These scenes use the same live state as the question, never a second score.
  Object.assign(copy.zh, {
    worldTitle: multiply ? '建造你的星系' : '种出你的小果园',
    worldCopy: n => multiply ? `探索 ${n} / ${total} 个星空站点。每学会一题，就点亮一站。` : `种下 ${n} / ${total} 棵小树。每学会一题，果园都在长大。`,
    labTitle: multiply ? '星星阵列实验室' : '十格收获盘',
    labDescription: multiply ? '点亮上面的星星组，再旋转阵列，看看总数会不会变。' : '点篮子把果子放进十格盘。同一篮的果子用同一种颜色。',
    labToggle: multiply ? '↻ 旋转阵列' : '把两篮合在一起',
    labReturn: multiply ? '↻ 转回原来的方向' : '把果子放回篮子',
    labCaption: (rows,cols) => `${rows} 行 × ${cols} 列；${rows} × ${cols} = ${cols} × ${rows}`,
    harvestCaption: n => `${n} = ${Math.floor(n/10)} 个十 + ${n%10} 个一`,
    harvestLabel: n => `十格盘里有 ${n} 个果子`,
    arrayLabel: (a,b,n) => `${a} 行，每行 ${b} 颗星星；点亮了 ${n} 颗`
  });
  Object.assign(copy.en, {
    worldTitle: multiply ? 'Build your galaxy' : 'Grow your little orchard',
    worldCopy: n => multiply ? `${n} / ${total} space stops explored. Each fact lights another stop.` : `${n} / ${total} trees planted. Every fact helps your orchard grow.`,
    labTitle: multiply ? 'Star array lab' : 'Ten-frame harvest',
    labDescription: multiply ? 'Light the groups above, then turn the array. Does the total change?' : 'Tap baskets to move fruit into ten-frames. Fruit from the same basket keeps its color.',
    labToggle: multiply ? '↻ Turn the array' : 'Bring both baskets together',
    labReturn: multiply ? '↻ Turn the array back' : 'Put the fruit back',
    labCaption: (rows,cols) => `${rows} rows × ${cols} columns; ${rows} × ${cols} = ${cols} × ${rows}`,
    harvestCaption: n => `${n} = ${Math.floor(n/10)} tens + ${n%10} ones`,
    harvestLabel: n => `${n} pieces of fruit in ten-frames`,
    arrayLabel: (a,b,n) => `${a} rows of ${b} stars; ${n} stars lit`
  });
  Object.assign(copy.fr, {
    worldTitle: multiply ? 'Construis ta galaxie' : 'Fais pousser ton petit verger',
    worldCopy: n => multiply ? `${n} / ${total} étapes spatiales explorées. Chaque calcul illumine une étape.` : `${n} / ${total} arbres plantés. Chaque calcul fait grandir ton verger.`,
    labTitle: multiply ? 'Le tableau des étoiles' : 'La récolte par dizaines',
    labDescription: multiply ? 'Allume les groupes, puis tourne le tableau. Le total change-t-il ?' : 'Touche les paniers pour remplir les grilles de dix. Les fruits d’un panier gardent la même couleur.',
    labToggle: multiply ? '↻ Tourner le tableau' : 'Réunir les deux paniers',
    labReturn: multiply ? '↻ Revenir au premier sens' : 'Remettre les fruits dans les paniers',
    labCaption: (rows,cols) => `${rows} lignes × ${cols} colonnes ; ${rows} × ${cols} = ${cols} × ${rows}`,
    harvestCaption: n => `${n} = ${Math.floor(n/10)} ${Math.floor(n/10)===1?'dizaine':'dizaines'} + ${n%10} ${n%10===1?'unité':'unités'}`,
    harvestLabel: n => `${n} ${n===1?'fruit':'fruits'} dans les grilles de dix`,
    arrayLabel: (a,b,n) => `${a} ${a===1?'ligne':'lignes'} de ${b} ${b===1?'étoile':'étoiles'} ; ${n} ${n===1?'étoile allumée':'étoiles allumées'}`
  });
  const readPreference = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; } };
  const savePreference = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
  let language = window.KrisI18n?.language || 'zh';
  let muted = readPreference('kris-math-muted', 'false') === 'true';
  let range = multiply ? 'all' : '20';
  let deck = [], round = 0, stars = 0, results = [], solved = false, completed = false;
  let counted = new Set(), wrong = new Set(), feedback = '', showingHint = false, rotated = false;
  let speechState = 'ready';
  const t = () => copy[language];
  const speech = M.createSpeech(window, status => { speechState = status; $('speech-status').textContent = t()[status]; });
  function resultText(question) {
    return multiply ? M.mnemonic(question.a, question.b) : language === 'zh'
      ? `${M.chineseNumber(question.a)}加${M.chineseNumber(question.b)}等于${M.chineseNumber(question.answer)}`
      : language === 'fr' ? `${question.a} plus ${question.b} égale ${question.answer}`
      : `${question.a} plus ${question.b} equals ${question.answer}`;
  }
  function sayResult(question) { speech.speak(resultText(question), multiply || language === 'zh' ? 'zh-CN' : language === 'fr' ? 'fr-CA' : 'en-US'); }
  function updateSound() {
    $('mute').setAttribute('aria-pressed', String(muted));
    $('mute').textContent = (muted ? '🔇 ' : '🔊 ') + t()[muted ? 'soundOff' : 'soundOn'];
    document.querySelectorAll('[data-replay], #replay').forEach(button => {
      button.disabled = muted || !speech.supported;
      button.title = t()[muted ? 'mutedReplay' : !speech.supported ? 'unsupportedReplay' : 'replayTitle'];
    });
  }
  function renderProgress() {
    $('round-label').textContent = completed ? t().completed : t().round(round + 1);
    $('star-count').textContent = stars;
    $('progress').replaceChildren();
    for (let i = 0; i < total; i++) {
      const state = results[i]?.earned ? 'correct' : results[i] ? 'learned' : i === round && !completed ? 'current' : 'waiting';
      const item = document.createElement('li');
      item.className = `progress-step ${state}`;
      item.textContent = state === 'correct' ? '★' : state === 'learned' ? '✓' : i + 1;
      item.setAttribute('aria-label', t().progress(i + 1, state));
      if (state === 'current') item.setAttribute('aria-current', 'step');
      $('progress').append(item);
    }
    renderWorld();
  }
  function renderWorld() {
    $('discovery-title').textContent = t().worldTitle;
    $('discovery-caption').textContent = t().worldCopy(results.length);
    $('world-stops').replaceChildren();
    for (let i = 0; i < total; i++) {
      const result = results[i], active = !completed && i === round && !result;
      const item = document.createElement('li');
      item.className = `world-stop ${result ? 'is-grown' : active ? 'is-growing' : 'is-seed'} ${result?.earned ? 'has-fruit' : ''}`;
      item.setAttribute('aria-label', t().progress(i+1,result?.earned?'correct':result?'learned':active?'current':'waiting'));
      if (active) item.setAttribute('aria-current','step');
      const picture = document.createElement('span'); picture.className='world-stop-picture'; picture.setAttribute('aria-hidden','true');
      picture.textContent = multiply ? (result ? ['🪐','🌎','🌕','🔴','🌑','☀️'][i] : active ? '🚀' : '·') : (result ? result.earned ? '🌳' : '🌿' : active ? '🌱' : '·');
      const number = document.createElement('small'); number.textContent = String(i+1);
      item.append(picture,number); $('world-stops').append(item);
    }
  }
  function renderLab() {
    const q = deck[round], n = multiply ? counted.size*q.b : [...counted].reduce((sum,i)=>sum+(i===0?q.a:q.b),0);
    const model = $('lab-model'); model.replaceChildren();
    $('lab-title').textContent = t().labTitle; $('lab-description').textContent = t().labDescription;
    $('lab-toggle').textContent = t()[multiply ? rotated?'labReturn':'labToggle' : counted.size===2?'labReturn':'labToggle'];
    $('lab-toggle').setAttribute('aria-pressed',String(multiply ? rotated : counted.size===2));
    if (multiply) {
      const rows = rotated?q.b:q.a, columns = rotated?q.a:q.b;
      model.className='lab-model star-array'; model.style.gridTemplateColumns=`repeat(${columns}, minmax(0, 1fr))`;
      model.setAttribute('data-rows',rows); model.setAttribute('data-columns',columns);
      model.setAttribute('aria-label',t().arrayLabel(rows,columns,n));
      for(let row=0;row<rows;row++) for(let col=0;col<columns;col++) {
        const cell=document.createElement('span'), group=rotated?col:row;
        cell.className='array-star'+(counted.has(group)?' is-lit':''); cell.textContent='★';cell.setAttribute('aria-hidden','true');cell.setAttribute('data-group',group);model.append(cell);
      }
      $('lab-caption').textContent=t().labCaption(rows,columns);
    } else {
      model.className='lab-model ten-frames'; model.setAttribute('aria-label',t().harvestLabel(n));
      // Concatenation preserves basket identity even when only basket two is selected.
      const fruit=[...(counted.has(0)?Array(q.a).fill(0):[]),...(counted.has(1)?Array(q.b).fill(1):[])];
      for(let frame=0;frame<Math.max(1,Math.ceil(n/10));frame++) {
        const tray=document.createElement('span');tray.className='ten-frame';tray.setAttribute('aria-hidden','true');
        for(let i=0;i<10;i++) {const cell=document.createElement('span'),basket=fruit[frame*10+i];cell.className='harvest-cell'+(basket===undefined?'':' is-filled basket-'+basket);cell.textContent=basket===undefined?'':basket===0?'●':'◆';tray.append(cell);}
        model.append(tray);
      }
      $('lab-caption').textContent=t().harvestCaption(n);
    }
  }
  function renderCounting() {
    const q = deck[round];
    const sum = multiply ? counted.size * q.b : [...counted].reduce((n, i) => n + (i === 0 ? q.a : q.b), 0);
    $('counting').textContent = counted.size ? t().counting(counted.size, sum) : t().countingStart;
    renderLab();
  }
  function renderObjects() {
    const q = deck[round];
    $('objects').replaceChildren();
    $('objects').className = 'objects ' + (multiply ? 'star-groups' : 'baskets');
    const sizes = multiply ? Array(q.a).fill(q.b) : [q.a, q.b];
    sizes.forEach((size, i) => {
      const group = document.createElement('button');
      group.type = 'button';
      group.className = `object-group ${counted.has(i) ? 'counted' : ''}`;
      group.setAttribute('aria-pressed', String(counted.has(i)));
      group.setAttribute('aria-label', multiply ? t().group(i + 1, size) : t().basket(i + 1, size));
      const label = document.createElement('span');
      label.className = 'group-label';
      label.textContent = multiply ? t().groupShort(i + 1) : t().basketShort(i + 1);
      const units = document.createElement('span');
      units.className = 'units';
      units.setAttribute('aria-hidden', 'true');
      for (let n = 0; n < size; n++) {
        const dot = document.createElement('span');
        dot.className = 'unit';
        if (multiply) dot.textContent = '★';
        units.append(dot);
      }
      const number = document.createElement('strong');
      number.className = 'group-number';
      number.textContent = size;
      group.append(label, units, number);
      group.addEventListener('click', () => {
        if (deck[round] !== q || ![...$('objects').children].includes(group) || completed) return;
        if (counted.has(i)) counted.delete(i); else counted.add(i);
        group.classList.toggle('counted', counted.has(i));
        group.setAttribute('aria-pressed', String(counted.has(i)));
        renderCounting();
      });
      $('objects').append(group);
    });
    renderCounting();
  }
  function renderHint() {
    $('hint-text').hidden = !showingHint;
    $('hint').setAttribute('aria-expanded', String(showingHint));
    $('hint').setAttribute('aria-controls', 'hint-text');
    const q = deck[round];
    $('hint-text').textContent = multiply ? t().hintMultiply(q.a, q.b) : t().hintAddition(q.a, q.b);
  }
  function renderResult() {
    const q = deck[round];
    $('result').hidden = !solved;
    $('learn').hidden = solved;
    $('answer').disabled = solved;
    $('check').disabled = solved;
    $('feedback').textContent = feedback ? t()[feedback] : '';
    $('feedback').className = 'feedback ' + (feedback === 'correct' ? 'success' : feedback === 'wrong' || feedback === 'invalid' ? 'try-again' : '');
    if (solved) {
      $('result-label').textContent = t().resultLabel(q.a, q.b);
      $('result-equation').textContent = `${q.a} ${multiply ? '×' : '+'} ${q.b} = ${q.answer}`;
      $('mnemonic').textContent = resultText(q);
      $('mnemonic').lang = multiply || language === 'zh' ? 'zh-CN' : language === 'fr' ? 'fr-CA' : 'en';
      $('next').textContent = t()[round === total - 1 ? 'finish' : 'next'];
    }
    updateSound();
  }
  function renderQuestion() {
    const q = deck[round];
    $('scene-tag').textContent = t().sceneTag;
    $('scene-title').textContent = t().sceneTitle(q.a, q.b);
    $('scene-instruction').textContent = t().sceneInstruction;
    $('question-label').textContent = t().thinking;
    $('question-help').textContent = t().help;
    $('equation').textContent = `${q.a} ${multiply ? '×' : '+'} ${q.b} = ?`;
    $('choices').setAttribute('aria-label', t().choiceLabel);
    $('choices').replaceChildren();
    q.options.forEach(value => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice' + (wrong.has(value) ? ' was-wrong' : '') + (solved && value === q.answer ? ' is-correct' : '');
      button.textContent = value;
      button.disabled = solved || wrong.has(value);
      button.addEventListener('click', () => { if (deck[round]===q && [...$('choices').children].includes(button)) submitAnswer(value, true); });
      $('choices').append(button);
    });
    renderObjects();
    renderHint();
    renderResult();
  }
  function submitAnswer(value, fromChoice = false) {
    if (solved || completed) return;
    if (value === null) { feedback = 'invalid'; renderResult(); return; }
    if (value !== deck[round].answer) {
      wrong.add(value);
      feedback = 'wrong';
      showingHint = true;
      renderQuestion();
      if (fromChoice) [...$('choices').children].find(button => !button.disabled)?.focus({ preventScroll: true });
      return;
    }
    finishQuestion(true);
  }
  function finishQuestion(earned) {
    if (solved || completed) return;
    solved = true;
    if (earned) stars++;
    feedback = earned ? 'correct' : 'learned';
    results.push({ ...deck[round], earned });
    renderProgress();
    renderQuestion();
    // Called directly by a trusted click or form submit. Do not delay this call.
    sayResult(deck[round]);
    $('next').focus({ preventScroll: true });
  }
  function nextQuestion() {
    if (!solved || completed) return;
    speech.stop();
    if (round === total - 1) {
      completed = true;
      $('play-panel').hidden = true;
      $('summary').hidden = false;
      renderSummary();
      renderProgress();
      // The round-end button is also a fresh user gesture: repeat the last fact.
      sayResult(deck[round]);
      $('summary-title').focus({ preventScroll: true });
      $('summary').scrollIntoView?.({ block: 'start', behavior: 'auto' });
      return;
    }
    round++;
    resetQuestion();
    renderProgress();
    renderQuestion();
    $('equation').focus({ preventScroll: true });
  }
  function resetQuestion() {
    solved = false; counted = new Set(); wrong = new Set(); feedback = ''; showingHint = false; rotated = false;
    $('answer').value = '';
    speechState = muted ? 'muted' : speech.supported ? 'ready' : 'unsupported';
    $('speech-status').textContent = t()[speechState];
  }
  function renderSummary() {
    $('summary-title').textContent = t().summaryTitle;
    $('summary-copy').textContent = t().summaryCopy(stars);
    $('summary-stars').textContent = '★'.repeat(stars) + '☆'.repeat(total - stars);
    $('review-list').replaceChildren();
    results.forEach(q => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'review-item';
      button.setAttribute('data-replay', '');
      const equation = document.createElement('strong');
      equation.textContent = `${q.a} ${multiply ? '×' : '+'} ${q.b} = ${q.answer}`;
      const rhyme = document.createElement('span');
      rhyme.setAttribute('data-i18n-skip', '');
      rhyme.textContent = resultText(q);
      rhyme.lang = multiply || language === 'zh' ? 'zh-CN' : language === 'fr' ? 'fr-CA' : 'en';
      button.append(equation, rhyme);
      button.addEventListener('click', () => sayResult(q));
      $('review-list').append(button);
    });
    updateSound();
  }
  function restart(fromInteraction = false) {
    speech.stop();
    deck = M.makeDeck(mode, range).map(q => ({ ...q, options: M.choices(q.answer, multiply ? 100 : Number(range) * 2) }));
    round = 0; stars = 0; results = []; completed = false;
    $('play-panel').hidden = false;
    $('summary').hidden = true;
    resetQuestion();
    renderProgress();
    renderQuestion();
    if (fromInteraction) {
      $('equation').focus({ preventScroll: true });
      $('game').scrollIntoView?.({ block: 'start', behavior: 'auto' });
    }
  }
  function applyLanguage() {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language === 'fr' ? 'fr-CA' : 'en';
    document.title = t()[mode] + ' · Kris';
    document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t()[node.dataset.i18n]; });
    $('game-title').textContent = t()[mode] + ' ✦';
    $('game-description').textContent = t().description;
    $('journey').setAttribute('aria-label', language === 'zh' ? '练习进度' : language === 'fr' ? 'Progression de l’entraînement' : 'Practice progress');
    const description = document.querySelector?.('meta[name="description"]');
    if (description) description.setAttribute('content', t().description);
    $('range').replaceChildren();
    const settings = multiply ? [['all', t().all], ...Array.from({ length: 10 }, (_, i) => [String(i + 1), t().table(i + 1)])] : [['10', t().easy], ['20', t().challenge]];
    settings.forEach(([value, text]) => { const option = document.createElement('option'); option.value = value; option.textContent = text; $('range').append(option); });
    $('range').value = range;
    $('range').title = t().rangeTitle;
    $('speech-status').textContent = t()[speechState];
    updateSound();
  }
  $('answer-form').addEventListener('submit', event => { event.preventDefault(); submitAnswer(M.parseAnswer($('answer').value)); });
  $('hint').addEventListener('click', () => { showingHint = !showingHint; renderHint(); });
  $('lab-toggle').addEventListener('click', () => {
    if (completed) return;
    if (multiply) { rotated=!rotated; renderLab(); }
    else { counted=counted.size===2?new Set():new Set([0,1]); renderObjects(); }
  });
  $('learn').addEventListener('click', () => finishQuestion(false));
  $('next').addEventListener('click', nextQuestion);
  $('replay').addEventListener('click', () => { if (solved) sayResult(deck[round]); });
  $('restart').addEventListener('click', () => restart(true));
  $('play-again').addEventListener('click', () => restart(true));
  $('range').addEventListener('change', () => { range = $('range').value; restart(); });
  window.KrisI18n?.onChange(() => {
    speech.stop();
    language = window.KrisI18n.language;
    speechState = muted ? 'muted' : speech.supported ? 'ready' : 'unsupported';
    applyLanguage(); renderProgress(); if (completed) renderSummary(); else renderQuestion();
  });
  $('mute').addEventListener('click', () => { muted = !muted; savePreference('kris-math-muted', String(muted)); speech.setMuted(muted); updateSound(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) speech.stop(); });
  window.addEventListener('pagehide', () => speech.stop());
  speech.setMuted(muted);
  applyLanguage();
  restart();
})();
