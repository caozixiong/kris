'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const bank = require('../assets/chinese-bank.js');
const source = JSON.parse(fs.readFileSync(path.join(root, 'data/chinese-bank.json'), 'utf8'));
assert.deepEqual(bank, source, 'Generated CommonJS bank equals canonical source');
const browser = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/chinese-bank.js'), 'utf8'), browser);
assert.equal(JSON.stringify(browser.window.KrisChineseBank), JSON.stringify(source), 'Browser bank equals source');
execFileSync('python', [path.join(root, 'tools/build_chinese_bank.py'), '--check'], {stdio: 'pipe'});

assert.equal(bank.version, 1);
assert.equal(bank.entries.length, 300);
assert.equal(new Set(bank.entries.map(e => e.id)).size, 300);
assert.equal(new Set(bank.entries.map(e => e.hanzi.normalize('NFC'))).size, 300);
assert.equal(bank.themes.length, 15);
assert.equal(new Set(bank.themes.map(t => t.id)).size, 15);
assert.deepEqual(bank.entries.slice(0, 20).map(e => e.hanzi), [
  '水','火','山','人','手','口','大','小','上','下','太阳','月亮','门','开','关','米','吃','喝','狗','猫'
]);
assert(bank.entries.slice(0, 20).every(e => e.level === 1));
const tones = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u;
for (const [i, e] of bank.entries.entries()) {
  assert.equal(e.id, `zh${String(i + 1).padStart(3, '0')}`);
  assert.match(e.hanzi, /^[\u4e00-\u9fff]{1,4}$/u);
  assert.match(e.pinyin, /^[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+(?: [a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+)*$/u);
  assert(tones.test(e.pinyin), `${e.hanzi} has a marked full tone`);
  assert.equal(e.pinyin.split(' ').length, [...e.hanzi].length, `${e.hanzi}: one syllable per character`);
  assert(e.en.trim() && e.fr.trim(), `${e.hanzi} has both support languages`);
  assert([1, 2, 3].includes(e.level));
  assert(bank.themes.some(t => t.id === e.theme));
  assert.equal(typeof e.cue, 'string');
  assert(!/[<>]|https?:/u.test(e.cue));
}
for (const t of bank.themes) {
  assert(t.zh && t.en && t.fr);
  assert.equal(bank.entries.filter(e => e.theme === t.id).length, 20);
}
const byWord = new Map(bank.entries.map(e => [e.hanzi, e]));
// Regression fixtures include common neutral syllables and polyphonic readings.
const pronunciation = {
  '月亮':'yuè liang', '兔子':'tù zi', '猴子':'hóu zi', '狮子':'shī zi',
  '石头':'shí tou', '星星':'xīng xing', '葡萄':'pú tao', '窗户':'chuāng hu',
  '勺子':'sháo zi', '妈妈':'mā ma', '爸爸':'bà ba', '哥哥':'gē ge',
  '姐姐':'jiě jie', '弟弟':'dì di', '妹妹':'mèi mei', '爷爷':'yé ye',
  '奶奶':'nǎi nai', '孩子':'hái zi', '朋友':'péng you', '我们':'wǒ men',
  '眼睛':'yǎn jing', '耳朵':'ěr duo', '头发':'tóu fa', '衣服':'yī fu',
  '学生':'xué sheng', '风筝':'fēng zheng', '故事':'gù shi', '睡觉':'shuì jiào',
  '音乐':'yīn yuè', '长':'cháng', '脏':'zāng', '只':'zhī', '谁':'shéi',
  '谢谢':'xiè xie', '对不起':'duì bu qǐ', '没关系':'méi guān xi',
  '喜欢':'xǐ huan', '什么':'shén me', '怎么':'zěn me', '绿':'lǜ'
};
for (const [word, pinyin] of Object.entries(pronunciation)) assert.equal(byWord.get(word).pinyin, pinyin, word);
const pictureWords = {
  water:'水', fire:'火', mountain:'山', person:'人', hand:'手', mouth:'口',
  big:'大', small:'小', up:'上', down:'下', sun:'太阳', moon:'月亮', fish:'鱼',
  tree:'树', field:'田', soil:'土', apple:'苹果', banana:'香蕉', one:'一',
  two:'二', three:'三', eye:'眼睛', middle:'中', car:'车'
};
assert.equal(bank.entries.filter(e => e.picture).length, 24);
for (const [picture, word] of Object.entries(pictureWords)) {
  assert.equal(byWord.get(word).picture, picture);
  assert(fs.existsSync(path.join(root, 'assets/learning-pictures', `${picture}.svg`)));
}
const byId = new Map(bank.entries.map(e => [e.id, e]));
assert.equal(bank.buildingTargets.length, 20);
assert.equal(new Set(bank.buildingTargets.map(t => t.hanzi)).size, 20);
for (const target of bank.buildingTargets) {
  assert(!byWord.has(target.hanzi), `${target.hanzi} is not counted twice`);
  assert(['noun', 'phrase'].includes(target.kind));
  const components = target.parts.map(id => byId.get(id));
  assert(components.every(e => e && Number(e.id.slice(2)) <= 100));
  assert(components.every(e => [...e.hanzi].length === 1));
  assert.equal(components.map(e => e.hanzi).join(''), target.hanzi);
  assert.equal(target.hanzi === '大人' ? 'dà ren' : components.map(e => e.pinyin).join(' '), target.pinyin);
  assert(target.en && target.fr);
}
// Deliberately mixed entry lengths: the total is learning entries, not 300 unique characters.
assert(bank.entries.some(e => e.hanzi.length === 1));
assert(bank.entries.some(e => e.hanzi.length > 1));
const uniqueCharacters = new Set(bank.entries.flatMap(e => [...e.hanzi])).size;
console.log(`Chinese bank: 300 unique entries, ${uniqueCharacters} distinct Hanzi, 15 × 20 themes, 24 local pictures, 20 separate building targets. Source, UMD, pinyin and component checks passed.`);
