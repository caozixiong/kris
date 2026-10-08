  const hints = {
    noun: {
      zh: '把法语名词和冠词一起记。un / une 表示单数，des 表示复数；du / de la / de l’ 常用于不逐个计数的事物。语法性别不等于真实事物的性别。',
      en: 'Learn French nouns with their articles. Un / une mark singular nouns, des marks plurals, and du / de la / de l’ often describe uncounted amounts. Grammatical gender is a feature of the word.',
      fr: 'Apprends les noms avec leur article : un / une au singulier, des au pluriel, et du / de la / de l’ pour certaines quantités. Le genre grammatical appartient au mot.'
    },
    actions: {
      zh: '这些动词用原形：英语常以 to 开头，法语用不定式。se 或 s’ 表示动作与主语自身有关。',
      en: 'These verbs use the infinitive: English begins with to. French se or s’ can show an action involving the person doing it.',
      fr: 'Ces verbes sont à l’infinitif. En anglais, ils commencent par to. En français, se ou s’ peut indiquer une action qui concerne le sujet lui-même.'
    },
    descriptions: {
      zh: '形容词通常给出法语阳性单数基本形式；在句子里可能随名词改变。括号限定这里练习的词义。',
      en: 'French adjectives usually show the masculine singular form; they can change with the noun in a sentence. Parentheses identify the meaning being practised.',
      fr: 'Les adjectifs sont généralement au masculin singulier ; ils peuvent changer avec le nom dans une phrase. Les parenthèses précisent le sens étudié.'
    },
    numbers: {
      zh: '把英语数字和法语数字配对。这里练习数字本身；放在名词前时，one 对应的 un 有时变为 une。',
      en: 'Match English and French number words. These are numbers on their own; before a feminine noun, un changes to une.',
      fr: 'Associe les nombres anglais et français. Devant un nom féminin, un devient une.'
    },
    position: {
      zh: '这些常用词或短语表示位置、时间或回应。先记整个意思，放进句子时可能需要其他词。',
      en: 'These useful words and phrases describe position, time or a response. Learn the whole meaning; a sentence may need other words too.',
      fr: 'Ces mots et expressions indiquent une position, un moment ou une réponse. Retiens leur sens ; une phrase peut demander d’autres mots.'
    }
  };
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  }
  function normalize(value) {
    return String(value).normalize('NFC').toLocaleLowerCase('en').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  }
  function allowed(value, wanted) {
    return wanted === undefined || wanted === null || (Array.isArray(wanted) ? wanted.includes(value) : wanted === value);
  }
  function filter(options = {}) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Filters must be an object');
    const excluded = new Set(options.excludeIds || []);
    return source.words.filter(word => allowed(word.theme, options.theme) && allowed(word.pos, options.pos) && allowed(word.level, options.level)
      && (options.maxLevel === undefined || word.level <= options.maxLevel)
      && (options.hasEmoji === undefined || Boolean(word.emoji) === options.hasEmoji)
      && !excluded.has(word.id));
  }
  function sample(count, options = {}, random = Math.random) {
    if (!Number.isInteger(count) || count < 0) throw new RangeError('Sample count must be a nonnegative integer');
    if (typeof random !== 'function') throw new TypeError('Random must be a function');
    const pool = filter(options);
    for (let i = pool.length - 1; i > 0; i--) {
      const n = random();
      if (!Number.isFinite(n) || n < 0 || n >= 1) throw new RangeError('Random values must be in [0, 1)');
      const j = Math.floor(n * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const chosen = [], seenEnglish = new Set(), seenFrench = new Set();
    for (const word of pool) {
      if (chosen.length === count) break;
      const en = normalize(word.en), fr = normalize(word.fr);
      if (seenEnglish.has(en) || seenFrench.has(fr)) continue;
      chosen.push(word); seenEnglish.add(en); seenFrench.add(fr);
    }
    if (chosen.length !== count) throw new RangeError('Not enough distinct words for this sample');
    return chosen;
  }
  const byId = new Map(source.words.map(word => [word.id, word]));
  const topics = source.topics.map(topic => ({...topic,
    hints: hints[topic.id] || (topic.id === 'colors_shapes' ? hints.descriptions : hints.noun),
    items: source.words.filter(word => word.theme === topic.id)
  }));
  freeze(source); freeze(topics);
  const api = Object.freeze({version: source.version, locale: source.locale, ageRange: source.ageRange,
    levelMeaning: source.levelMeaning, words: source.words, entries: source.words, topics,
    get: id => byId.get(id), getTopics: () => topics, filter, sample, normalize});
  root.KrisWordBank = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
