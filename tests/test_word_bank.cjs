'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const bank = require('../assets/word-bank.js');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/word-bank.json'), 'utf8'));
cp.execFileSync('python', [path.join(root, 'tools/build_word_bank.py'), '--check']);
assert.equal(bank.version, 1);
assert.equal(bank.words.length, 500);
assert.equal(bank.topics.length, 17);
assert.deepEqual(bank.words, data.words);
assert.equal(new Set(bank.words.map(w => w.id)).size, 500);
assert.equal(new Set(bank.words.map(w => bank.normalize(w.en))).size, 500);
assert.equal(new Set(bank.words.map(w => bank.normalize(w.fr))).size, 500);
const validPos = new Set(['noun','verb','adjective','number','adverb','expression']);
for (const word of bank.words) {
  assert.match(word.id, /^word_[a-z0-9_]+$/);
  for (const key of ['en','fr','lemmaEn','lemmaFr','zh','theme']) assert.ok(typeof word[key] === 'string' && word[key].trim());
  assert.ok(validPos.has(word.pos));
  assert.ok([1,2,3].includes(word.level));
  assert.ok(Object.isFrozen(word));
  assert.equal(bank.get(word.id), word);
  if (word.pos === 'noun') {
    assert.ok(['m','f'].includes(word.gender));
    assert.ok(['un','une','des','du','de la',"de l'",'le','la',"l'",null].includes(word.article));
    if (word.article === 'un' || word.article === 'du') assert.equal(word.gender,'m');
    if (word.article === 'une' || word.article === 'de la') assert.equal(word.gender,'f');
    if (word.article) assert.ok(word.fr.startsWith(word.article));
    if (word.enArticle) assert.ok(word.en.startsWith(word.enArticle + ' '));
    assert.ok(['singular','plural'].includes(word.number));
  } else {
    assert.equal(word.gender,null);
    assert.equal(word.article,null);
  }
  assert.equal(word.en, word.en.normalize('NFC'));
  assert.equal(word.fr, word.fr.normalize('NFC'));
}
for (const topic of bank.topics) {
  assert.ok(topic.items.length >= 8);
  assert.ok(topic.items.every(word => word.theme === topic.id && bank.get(word.id) === word));
  for (const lang of ['zh','en','fr']) assert.ok(topic.labels[lang] && topic.hints[lang]);
}
assert.equal(bank.topics.reduce((n,t) => n+t.items.length,0),500);
// Historical entry IDs remain stable through improved Canadian-French wording.
for (const id of ['word_animals_cat','word_food_apple','word_school_schoolbag','word_school_eraser','word_nature_rainbow']) assert.ok(bank.get(id));
assert.equal(bank.get('word_weather_time_hour').en,'an hour');
assert.equal(bank.get('word_weather_time_lightning').en,'a flash of lightning');
assert.ok(bank.words.some(w => w.fr.includes('œ')));
assert.ok(bank.words.some(w => w.fr.includes('é')));
assert.ok(bank.words.some(w => w.fr.includes('à')));
const snapshot = JSON.stringify(bank.words);
function seeded(seed) { let n=seed>>>0; return () => { n=(Math.imul(n,1664525)+1013904223)>>>0; return n/4294967296; }; }
function checkSample(sample, count) {
  assert.equal(sample.length,count);
  assert.equal(new Set(sample.map(w=>w.id)).size,count);
  assert.equal(new Set(sample.map(w=>bank.normalize(w.en))).size,count);
  assert.equal(new Set(sample.map(w=>bank.normalize(w.fr))).size,count);
}
for (const topic of bank.topics) {
  for (const count of [4,6,8]) {
    for (let seed=1; seed<=30; seed++) {
      const picked=bank.sample(count,{theme:topic.id},seeded(seed));
      checkSample(picked,count); assert.ok(picked.every(w=>w.theme===topic.id));
    }
  }
}
const coverage = new Set();
for (let seed=1; seed<=2000; seed++) {
  const picked=bank.sample(15,{},seeded(seed)); checkSample(picked,15); picked.forEach(w=>coverage.add(w.id));
}
assert.equal(coverage.size,500,'All entries must remain reachable');
checkSample(bank.sample(500,{},seeded(9)),500);
for (const level of [1,2,3]) assert.ok(bank.filter({level}).every(w=>w.level===level));
assert.ok(bank.filter({maxLevel:1}).length>80);
assert.ok(bank.filter({maxLevel:1}).every(w=>w.level===1));
const pictures=bank.filter({pos:'noun',hasEmoji:true});
assert.ok(pictures.length>80); assert.ok(pictures.every(w=>w.emoji && w.pos==='noun'));
assert.equal(bank.filter({theme:'missing'}).length,0);
assert.ok(bank.filter({theme:['animals','food'],pos:'noun'}).every(w=>['animals','food'].includes(w.theme)&&w.pos==='noun'));
const excluded=bank.words.slice(0,25).map(w=>w.id);
assert.ok(bank.sample(100,{excludeIds:excluded},seeded(4)).every(w=>!excluded.includes(w.id)));
assert.deepEqual(bank.sample(0),[]);
assert.throws(()=>bank.sample(501),RangeError);
assert.throws(()=>bank.sample(1,{theme:'missing'}),RangeError);
assert.throws(()=>bank.sample(-1),RangeError);
assert.throws(()=>bank.sample(1.5),RangeError);
assert.throws(()=>bank.sample(1,{},()=>1),RangeError);
assert.throws(()=>bank.sample(1,{},()=>-0.1),RangeError);
assert.throws(()=>bank.sample(1,{},()=>NaN),RangeError);
assert.throws(()=>bank.filter(null),TypeError);
assert.equal(JSON.stringify(bank.words),snapshot);
assert.equal(bank.getTopics(),bank.topics);
assert.equal(bank.entries,bank.words);
// Browser bootstrap works with no fetch, network, storage, or DOM.
const win={};
for (const key of ['fetch','localStorage']) Object.defineProperty(win,key,{get(){throw new Error(key+' unavailable');}});
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/word-bank.js'),'utf8'),{window:win});
assert.equal(win.KrisWordBank.words.length,500);
assert.equal(win.KrisWordBank.sample(15).length,15);
// The reduced asset-error fallback is generated, never a second hand-edited bank.
const fallbackFile = path.join(root,'assets/word-data.js');
if (fs.existsSync(fallbackFile)) {
  const window = {};
  vm.runInNewContext(fs.readFileSync(fallbackFile,'utf8'),{window});
  const fallback = window.BilingualData.wordTopics;
  assert.equal(fallback.reduce((n,t)=>n+t.items.length,0),32);
  for (const topic of fallback) {
    const canonical = bank.topics.find(t=>t.id===topic.id);
    assert.deepEqual(JSON.parse(JSON.stringify(topic.labels)),canonical.labels);
    assert.deepEqual(JSON.parse(JSON.stringify(topic.hints)),canonical.hints);
    for (const word of topic.items) assert.deepEqual(JSON.parse(JSON.stringify(word)),bank.get(word.id));
  }
}
console.log('Shared word bank passed: 500 entries, 17 themes, metadata, source parity, 3 levels, filtered and duplicate-free random sampling, full reachability, offline browser bootstrap.');
