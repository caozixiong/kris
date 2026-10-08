/* Independent fixtures and action oracles for the production bilingual rules. */
'use strict';
const assert = require('node:assert/strict');
const C = require('../assets/word-core.js');
const modes = ['memory', 'bridge', 'sentences'];
const entries = Array.from({length: 10}, (_, i) => ({id: `pair-${i}`, en: `English ${i}`, fr: `Français ${i}`}));
const snapshot = value => JSON.stringify(value);
function rng(initial) { let seed = initial >>> 0; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
function invariant(s) {
  assert.equal(s.cards.length, s.pairs.length * 2);
  assert.equal(new Set(s.cards.map(c => c.key)).size, s.cards.length);
  assert.equal(new Set(s.matched).size, s.matched.length);
  assert(s.matched.every(id => s.pairs.some(p => p.id === id)));
  assert(s.selected.every(key => s.cards.some(c => c.key === key && !s.matched.includes(c.id))));
  assert.equal(new Set(s.selected).size, s.selected.length);
  assert(s.selected.length <= 2);
  assert(Number.isInteger(s.moves) && s.moves >= 0);
  assert(Number.isInteger(s.hints) && s.hints >= 0);
  assert.equal(s.phase === 'complete', s.matched.length === s.pairs.length);
}

// Shuffling and selection never mutate the curriculum or manufacture cards.
const before = snapshot(entries), orders = new Set(), subsets = new Set();
for (const mode of modes) for (let count = 1; count <= entries.length; count++) for (let run = 1; run <= 80; run++) {
  const s = C.createRound(entries, count, mode, rng(run));
  invariant(s); assert.equal(s.phase, 'active'); assert.deepEqual(s.selected, []); assert.deepEqual(s.matched, []);
  assert.equal(s.moves, 0); assert.equal(s.hints, 0); assert.deepEqual(s.hintIds, []);
  assert.equal(s.pairs.length, count); assert.equal(new Set(s.pairs.map(p => p.id)).size, count);
  for (const pair of s.pairs) {
    const pairCards = s.cards.filter(c => c.id === pair.id);
    assert.deepEqual(pairCards.map(c => c.language).sort(), ['en', 'fr']);
    assert(pairCards.every(c => c.text === pair[c.language] && c.key === `${pair.id}:${c.language}`));
  }
  orders.add(s.cards.map(c => c.key).join(','));
  if (count === 4) subsets.add(s.pairs.map(p => p.id).sort().join(','));
  for (const pair of s.pairs) {
    const [first, second] = run % 2 ? [`${pair.id}:en`, `${pair.id}:fr`] : [`${pair.id}:fr`, `${pair.id}:en`];
    assert.equal(C.choose(s, first), 'selected');
    const selected = snapshot(s);
    for (const invalid of [first, '', 'missing:fr', `${pair.id}:zh`]) { assert.equal(C.choose(s, invalid), 'ignored'); assert.equal(snapshot(s), selected); }
    assert.equal(C.choose(s, second), 'match');
    const matched = snapshot(s);
    for (let rapid = 0; rapid < 4; rapid++) { assert.equal(C.choose(s, first), 'ignored'); assert.equal(C.choose(s, second), 'ignored'); assert.equal(snapshot(s), matched); }
    invariant(s);
  }
  assert.equal(s.moves, count); assert.equal(s.matched.length, count); assert.equal(s.phase, 'complete');
  const finished = snapshot(s);
  assert.equal(C.hint(s), null); assert.equal(C.dismiss(s), false); assert.equal(snapshot(s), finished);
}
assert.equal(snapshot(entries), before, 'source entries remain immutable');
assert(orders.size > 500, 'many independently shuffled card orders');
assert(subsets.size > 20, 'many randomly selected vocabulary subsets');
for (const [count, mode] of [[0,'memory'], [-1,'memory'], [11,'memory'], [1.5,'memory'], ['4','memory'], [2,'unknown']]) assert.throws(() => C.createRound(entries, count, mode));
assert.throws(() => C.createRound([entries[0], entries[0]], 2, 'memory'));
for (const invalidEntries of [null, undefined, {}, 'words', [null], [undefined], [4], [{}],
  [{id:null,en:'cat',fr:'chat'}], [{id:1,en:'cat',fr:'chat'}], [{id:' ',en:'cat',fr:'chat'}],
  [{id:'cat',en:null,fr:'chat'}], [{id:'cat',en:4,fr:'chat'}], [{id:'cat',en:' ',fr:'chat'}],
  [{id:'cat',en:'cat',fr:null}], [{id:'cat',en:'cat',fr:4}], [{id:'cat',en:'cat',fr:' '}],
  [{id:'cat',en:'cat'}], [{id:'cat',fr:'chat'}], [{en:'cat',fr:'chat'}]]) {
  assert.throws(() => C.createRound(invalidEntries, 1, 'memory'), 'malformed cards are rejected before rendering');
  assert.throws(() => C.uniquePairs(invalidEntries, 1), 'direct ambiguity filtering rejects malformed cards');
}
for (const count of [undefined, null, 0, -1, 1.5, '4', entries.length + 1]) assert.throws(() => C.uniquePairs(entries, count));


// Matching is by identity plus opposite language, not by equal-looking text.
for (const mode of modes) {
  const s = C.createRound([{id:'one',en:'first word',fr:'premier mot'},{id:'two',en:'second word',fr:'deuxième mot'}], 2, mode, rng(17));
  // Identity tests must not depend on the surface-form ambiguity guard at round creation.
  for (const card of s.cards) card.text = 'orange';
  assert.equal(C.choose(s, 'one:en'), 'selected'); assert.equal(C.choose(s, 'two:fr'), 'mismatch');
  assert.deepEqual(s.matched, []); assert.equal(s.moves, 1); assert.deepEqual(s.selected, ['one:en', 'two:fr']);
  const mismatch = snapshot(s);
  for (const card of s.cards) assert.equal(C.choose(s, card.key), 'ignored');
  assert.equal(C.hint(s), null); assert.equal(snapshot(s), mismatch, 'mismatch stays locked until explicit dismissal');
  assert.equal(C.dismiss(s), true); assert.equal(s.phase, 'active'); assert.deepEqual(s.selected, []); assert.equal(s.moves, 1);
  assert.equal(C.dismiss(s), false);
  C.choose(s, 'one:fr'); assert.equal(C.choose(s, 'one:en'), 'match'); assert.deepEqual(s.matched, ['one']);
  C.choose(s, 'two:en'); assert.equal(C.choose(s, 'two:fr'), 'match'); assert.equal(s.phase, 'complete'); assert.equal(s.moves, 3);
}

// Same-side interactions differ intentionally between face-down memory and columns.
for (const mode of modes) {
  const s = C.createRound(entries, 4, mode, rng(31));
  const [a,b] = s.pairs;
  C.choose(s, `${a.id}:en`); const result = C.choose(s, `${b.id}:en`);
  if (mode === 'memory') {
    assert.equal(result, 'mismatch'); assert.equal(s.moves, 1); assert.equal(s.selected.length, 2); C.dismiss(s);
  } else {
    assert.equal(result, 'selected'); assert.equal(s.moves, 0); assert.deepEqual(s.selected, [`${b.id}:en`]);
    assert.equal(C.choose(s, `${b.id}:fr`), 'match'); assert.equal(s.moves, 1);
  }
  invariant(s);
}

// Hints reveal one exact pair, never award it, never add a move, and cannot stack.
for (const mode of modes) for (const startSelected of [false, true]) {
  const s = C.createRound(entries, 4, mode, rng(72));
  const first = s.pairs[0], next = s.pairs[1];
  C.choose(s, `${first.id}:en`); C.choose(s, `${first.id}:fr`);
  if (startSelected) C.choose(s, `${next.id}:fr`);
  const previousMoves = s.moves;
  const shown = C.hint(s);
  assert.equal(shown.id, next.id); assert.equal(s.phase, 'hint'); assert.equal(s.hints, 1);
  assert.equal(s.moves, previousMoves); assert.deepEqual(s.matched, [first.id]); assert.deepEqual(s.selected, []); assert.deepEqual(s.hintIds, [next.id]);
  const held = snapshot(s);
  assert.equal(C.hint(s), null); for (const card of s.cards) assert.equal(C.choose(s, card.key), 'ignored'); assert.equal(snapshot(s), held);
  assert.equal(C.dismiss(s), true); assert.deepEqual(s.hintIds, []); assert.equal(s.phase, 'active'); assert.equal(s.hints, 1);
  C.choose(s, `${next.id}:fr`); C.choose(s, `${next.id}:en`); assert.equal(s.matched.length, 2); assert.equal(s.moves, previousMoves + 1);
  const reset = C.createRound(entries, 4, mode, rng(72));
  assert.equal(reset.moves, 0); assert.equal(reset.hints, 0); assert.equal(reset.phase, 'active'); assert.deepEqual(reset.matched, []); assert.deepEqual(reset.selected, []);
  assert.equal(s.matched.length, 2, 'constructing another round does not mutate old round'); invariant(reset);
}

// Storage is a small allowlisted schema. Corrupt, oversized and unknown records are ignored.
const key = 'kris-word-v1-memory', validKeys = ['animals:4','animals:6','food:4'];
function read(value, keys = validKeys) { return C.readProgress({getItem: received => {assert.equal(received, key); return value;}}, key, keys); }
assert.deepEqual(C.readProgress(null, key, validKeys), {});
assert.deepEqual(C.readProgress({getItem(){throw Error('blocked');}}, key, validKeys), {});
for (const value of ['', 'bad json', 'null', '[]', '[1,2]', '1', 'true', '"hello"']) assert.deepEqual(read(value), {});
for (const rounds of [0, -1, 1.5, '2', null, 100000]) assert.deepEqual(read(JSON.stringify({'animals:4': {rounds,best:4}})), {});
for (const best of [0, 3, -1, 4.5, '4', null, 100000]) assert.deepEqual(read(JSON.stringify({'animals:4': {rounds:1,best}})), {});
assert.deepEqual(read(JSON.stringify({'animals:4': {rounds:2,best:5,untrusted:'ignored'}, 'animals:6': {rounds:99999,best:99999}, 'food:4': {rounds:1,best:4}, 'unknown:4': {rounds:8,best:4}, '__proto__':{polluted:true}})), {'animals:4':{rounds:2,best:5}, 'animals:6':{rounds:99999,best:99999}, 'food:4':{rounds:1,best:4}});
assert.deepEqual(read('{"animals:4":{"rounds":1,"best":4},"__proto__":{"polluted":true},"constructor":{"rounds":1,"best":4}}'), {'animals:4':{rounds:1,best:4}});
assert.equal({}.polluted, undefined);
const progress = {};
C.recordProgress(progress, 'animals:4', 8); assert.deepEqual(progress, {'animals:4': {rounds:1,best:8}});
C.recordProgress(progress, 'animals:4', 11); assert.deepEqual(progress['animals:4'], {rounds:2,best:8});
C.recordProgress(progress, 'animals:4', 4); assert.deepEqual(progress['animals:4'], {rounds:3,best:4});
C.recordProgress(progress, 'food:4', 5); assert.deepEqual(progress['food:4'], {rounds:1,best:5});
progress['animals:4'].rounds = 99999; C.recordProgress(progress, 'animals:4', 6); assert.equal(progress['animals:4'].rounds, 99999);
assert.equal(progress['animals:4'].best, 4);
console.log('PASS: 2,400 generated rounds across three modes and 1–10 pairs; unique shuffled identities; opposite-language matching; duplicate/rapid clicks; explicit mismatch/hint locks; hint without credit; fresh rounds; allowlisted corrupt/blocked storage; best-move and repeat-round records.');

// Production curricula and the no-bank fallback are independent load paths.
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const dataSource = fs.readFileSync(path.join(__dirname, '../assets/word-data.js'), 'utf8');
function curriculum(bankSource) {
  const context = {window:{}}; vm.createContext(context);
  if (bankSource) vm.runInContext(bankSource, context, {filename:'word-bank.js'});
  vm.runInContext(dataSource, context, {filename:'word-data.js'});
  return context.window;
}
const fallback = curriculum().BilingualData;
assert.deepEqual(Array.from(fallback.wordTopics, t => t.id), ['animals', 'food', 'school', 'nature']);
assert.deepEqual(Array.from(fallback.sentenceTopics, t => t.id), ['morning', 'classroom', 'home', 'friends']);
assert.equal(fallback.wordTopics.reduce((n,t) => n + t.items.length, 0), 32);
assert.equal(fallback.sentenceTopics.reduce((n,t) => n + t.items.length, 0), 32);
function validateCurriculum(data) {
  const allIds = new Set(); let productionRounds = 0;
  for (const family of ['wordTopics','sentenceTopics']) {
    const topics = data[family];
    assert.equal(new Set(topics.map(t => t.id)).size, topics.length, `${family} unique theme IDs`);
    for (const topic of topics) {
      assert(/^[a-z][a-z0-9_-]*$/.test(topic.id));
      assert(topic.items.length >= 8, `${topic.id} supports the full eight-pair challenge`);
      for (const language of ['zh','en','fr']) { assert(topic.labels[language]?.trim()); assert(topic.hints[language]?.trim()); }
      for (const language of ['en','fr']) {
        const normalized = topic.items.map(item => item[language].normalize('NFC').replace(/[’‘]/g, "'").trim().replace(/\s+/g,' ').toLowerCase());
        assert.equal(new Set(normalized).size, topic.items.length, `${topic.id} has unambiguous ${language} cards`);
      }
      for (const item of topic.items) {
        assert(/^[a-z][a-z0-9_-]*$/.test(item.id)); assert(!allIds.has(item.id), `globally unique item ${item.id}`); allIds.add(item.id);
        for (const language of ['en','fr']) assert.equal(typeof item[language], 'string');
        assert(item.en.trim() && item.fr.trim());
        if (family === 'sentenceTopics') assert(/[.!?]$/.test(item.en) && /[.!?]$/.test(item.fr), `${item.id} sentence punctuation`);
      }
      for (const mode of family === 'wordTopics' ? ['memory','bridge'] : ['sentences']) for (let count = 1; count <= topic.items.length; count++) {
        const s = C.createRound(topic.items, count, mode, rng(count));
        for (const pair of s.pairs) { assert.equal(C.choose(s, pair.id + ':en'), 'selected'); assert.equal(C.choose(s, pair.id + ':fr'), 'match'); }
        assert.equal(s.phase, 'complete'); assert.equal(s.moves, count); invariant(s); productionRounds++;
      }
    }
  }
  return {pairs:allIds.size, rounds:productionRounds};
}
const fallbackResult = validateCurriculum(fallback);
assert.equal(fallbackResult.pairs, 64);
console.log(`PASS: no-bank fallback retains 32 words + 32 sentences and ${fallbackResult.rounds} complete curriculum rounds.`);
const bankPath = path.join(__dirname, '../assets/word-bank.js');
assert(fs.existsSync(bankPath), 'shared 500-word bank is required for the combined release');
const loaded = curriculum(fs.readFileSync(bankPath,'utf8')), D = loaded.BilingualData, bank = loaded.KrisWordBank;
assert.equal(bank.version, 1); assert.equal(D.wordTopics, bank.topics, 'games consume the shared bank instead of a private copy');
assert.equal(bank.topics.reduce((n,t) => n + t.items.length, 0), 500, 'shared primary-school bank contains exactly 500 word pairs');
assert.deepEqual(JSON.parse(JSON.stringify(D.sentenceTopics)), JSON.parse(JSON.stringify(fallback.sentenceTopics)), '32 sentence pairs remain unchanged');
const canonicalById = new Map(bank.topics.flatMap(topic => topic.items).map(item => [item.id,item]));
for (const topic of fallback.wordTopics) for (const item of topic.items) {
  const canonical = canonicalById.get(item.id); assert(canonical, `${item.id} fallback uses a canonical shared-bank identity`);
  for (const field of ['en','fr']) assert.equal(item[field], canonical[field], `${item.id} fallback ${field} stays identical to reviewed canonical vocabulary`);
  for (const field of ['lemmaEn','lemmaFr','zh','pos','level','theme','article','gender','enArticle','number']) {
    if (Object.hasOwn(item, field)) assert.equal(item[field], canonical[field], `${item.id} fallback ${field} matches canonical metadata`);
  }
}

for (const topic of bank.topics) for (const item of topic.items) {
  for (const field of ['id','en','fr','lemmaEn','lemmaFr','zh','pos','level','theme','article','gender']) assert(Object.hasOwn(item, field), `${item.id} supplies ${field}`);
  for (const field of ['en','fr','lemmaEn','lemmaFr','zh','pos']) assert(typeof item[field] === 'string' && item[field].trim(), `${item.id} ${field} is useful text`);
  assert.equal(item.theme, topic.id, `${item.id} theme matches its enclosing topic`);
  assert(Number.isInteger(item.level) && [1,2,3].includes(item.level), `${item.id} has a supported primary-school level`);
  assert(item.article === null || typeof item.article === 'string' && item.article.trim(), `${item.id} article is text or null`);
  assert(['m','f',null].includes(item.gender), `${item.id} gender is m, f, or null`);

  if (item.pos === 'noun') {
    // Weekday labels are naturally bare in both languages; French le lundi would mean a recurring Monday.
    const weekdays = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
    assert(item.article || weekdays.includes(item.lemmaFr), `${item.id} has a French article or is a bare weekday label`);
    const article = item.article?.replace(/[’‘]/g, "'");
    const expectedFrench = (article ? article + (article.endsWith("'") ? '' : ' ') : '') + item.lemmaFr;
    assert.equal(item.fr.replace(/[’‘]/g, "'"), expectedFrench, `${item.id} French noun display retains its article and lemma`);
    assert(item.enArticle === null || typeof item.enArticle === 'string' && item.enArticle.trim(), `${item.id} English article metadata is explicit`);
    const expectedEnglish = (item.enArticle ? item.enArticle + ' ' : '') + item.lemmaEn;
    assert.equal(item.en, expectedEnglish, `${item.id} English display matches its countable/mass/plural article metadata`);
    // English countability need not match French: bread, stairs, pants and hair can correctly be bare.
  }
}
const bankResult = validateCurriculum(D); assert.equal(bankResult.pairs, 532);
let shuffledRounds = 0;
for (const topic of bank.topics) for (const mode of ['memory','bridge']) {
  const seen = new Set(), subsets = new Set(), random = rng(76543);
  const count = Math.min(4, topic.items.length), repetitions = Math.max(250, topic.items.length * 15);
  for (let round = 0; round < repetitions; round++) {
    const state = C.createRound(topic.items, count, mode, random); invariant(state);
    for (const pair of state.pairs) seen.add(pair.id);
    subsets.add(state.pairs.map(p => p.id).sort().join(',')); shuffledRounds++;
  }
  assert.equal(seen.size, topic.items.length, `${mode}/${topic.id} repeated rounds sample the entire bank topic`);
  assert(subsets.size > 10, `${mode}/${topic.id} replays change the selected subset`);
}
console.log(`PASS: exactly 500 shared words + 32 unchanged sentences, ${bank.topics.length} word themes, ${bankResult.rounds} full curriculum rounds, and ${shuffledRounds} shuffled replays covering every bank word in both matching modes.`);

assert.equal(typeof C.uniquePairs, 'function', 'core exposes its ambiguity filter');
for (const mode of ['memory','bridge']) {
  const ambiguous = [{id:'same_en_a',en:'a cat',fr:'un chat'}, {id:'same_en_b',en:' A CAT ',fr:'un chaton'}];
  assert.throws(() => C.createRound(ambiguous, 2, mode), 'same English surface cannot form two answer pairs');
  const ambiguousFrench = [{id:'same_fr_a',en:'a bike',fr:'un vélo'}, {id:'same_fr_b',en:'a bicycle',fr:' UN VÉLO '}];
  assert.throws(() => C.createRound(ambiguousFrench, 2, mode), 'same French surface cannot form two answer pairs');
  for (const [first, second] of [["l'arbre", 'l’arbre'], ['un café', 'un cafe\u0301'], ['un  petit chat', 'un petit chat']]) {
    assert.throws(() => C.createRound([{id:'variant_a',en:'first meaning',fr:first},{id:'variant_b',en:'second meaning',fr:second}], 2, mode), 'normalized punctuation, Unicode and spacing cannot create ambiguous cards');
  }
  const meaningfulAccent = C.createRound([{id:'accent_a',en:'on',fr:'sur'},{id:'accent_b',en:'sure',fr:'sûr'}], 2, mode);
  assert.equal(meaningfulAccent.pairs.length, 2, 'diacritics remain meaningful word content');

  const mixed = D.wordGameTopics.find(t => t.id === 'all-words');
  assert(mixed && mixed.items.length === 500, 'default mixed theme contains the entire shared bank');
  const seen = new Set(), random = rng(49073), topicSets = new Set();
  const normalize = text => text.normalize('NFC').replace(/[’‘]/g, "'").trim().replace(/\s+/g,' ').toLowerCase();
  for (let round = 0; round < 1200; round++) {
    const state = C.createRound(mixed.items, 8, mode, random); invariant(state);
    for (const language of ['en','fr']) assert.equal(new Set(state.pairs.map(p => normalize(p[language]))).size, 8, `mixed ${mode} has no ambiguous ${language} matches`);
    for (const pair of state.pairs) seen.add(pair.id);
    topicSets.add(state.pairs.map(p => p.theme).sort().join(','));
  }
  assert.equal(seen.size, 500, `mixed ${mode} replays eventually expose every bank entry, including variants with duplicate surface forms`);
  assert(topicSets.size > 500, `mixed ${mode} samples across distinct thematic combinations`);
}
console.log('PASS: default whole-bank theme, English/French ambiguity rejection, and 2,400 mixed-bank replays exposing all 500 words without ambiguous cards.');
