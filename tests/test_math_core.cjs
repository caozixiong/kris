'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../assets/math-core.js');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'mnemonic-fixtures.json'), 'utf8'));
assert.equal(fixture.length, 100);
for (const q of fixture) { assert.equal(q.product, q.a * q.b); assert.equal(M.mnemonic(q.a, q.b), q.mnemonic, `${q.a} × ${q.b}`); }
assert.equal(new Set(fixture.map(q => `${q.a},${q.b}`)).size, 100);
for (const [a, b] of [[0, 1], [11, 1], [1, -2], [1.5, 3], ['7', 7]]) assert.throws(() => M.mnemonic(a, b));
for (const [n, text] of [[0,'零'],[1,'一'],[10,'十'],[11,'十一'],[20,'二十'],[49,'四十九'],[99,'九十九'],[100,'一百']]) assert.equal(M.chineseNumber(n),text);
const coverage = new Set();
let seed = 4587;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
for (const mode of ['addition', 'multiplication']) for (const range of mode === 'addition' ? ['10','20'] : ['all', ...Array.from({length:10},(_,i)=>String(i+1))]) {
  for (let run = 0; run < 100; run++) {
    const deck = M.makeDeck(mode, range, random);
    assert.equal(deck.length, 6);
    assert.equal(new Set(deck.map(q => `${q.a},${q.b}`)).size, 6);
    for (const q of deck) {
      const max = mode === 'addition' ? Number(range) : 10;
      assert(q.a >= 1 && q.a <= max && q.b >= 1 && q.b <= max);
      assert.equal(q.answer, mode === 'addition' ? q.a + q.b : q.a * q.b);
      if (mode === 'multiplication') { coverage.add(`${q.a},${q.b}`); if (range !== 'all') assert.equal(q.a, Number(range)); }
      const choices = M.choices(q.answer, mode === 'addition' ? max * 2 : 100, random);
      assert.equal(choices.length,4);assert.equal(new Set(choices).size,4);assert(choices.includes(q.answer));assert(choices.every(n=>Number.isInteger(n)&&n>=1&&n<=(mode==='addition'?max*2:100)));
    }
  }
}
assert.equal(coverage.size,100);
for (const [input, expected] of [['',null],[' ',null],['7x',null],['4.9',null],['1e2',null],['-3',null],[' 49 ',49],['0',0],['100',100],['1234',null]]) assert.equal(M.parseAnswer(input),expected,input);
function speechHarness(options = {}) {
  const statuses = [], said = [], timers = new Map(); let counter=0, cancellations=0, resumes=0;
  const handlers = {};
  const synth = { paused: options.paused || false, getVoices: () => options.voices ?? [{lang:'en-US',name:'English'},{lang:'zh-CN',name:'Chinese'}], cancel:()=>cancellations++, resume:()=>resumes++, speak:u=>{if(options.throws)throw Error('blocked');said.push(u);}, addEventListener:(t,f)=>handlers[t]=f, removeEventListener:t=>delete handlers[t] };
  const env = {setTimeout:fn=>{timers.set(++counter,fn);return counter;}, clearTimeout:id=>timers.delete(id)};
  if (!options.unsupported) { env.speechSynthesis=synth;env.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}}; }
  return {api:M.createSpeech(env,s=>statuses.push(s)),statuses,said,timers,handlers,get cancellations(){return cancellations;},get resumes(){return resumes;}};
}
{
 const h=speechHarness({paused:true});assert.equal(h.said.length,0,'no autoplay');h.api.speak('七七四十九');assert.equal(h.said[0].lang,'zh-CN');assert.equal(h.said[0].voice.name,'Chinese');assert.equal(h.said[0].text,'七七四十九');assert.equal(h.resumes,1);assert.equal(h.timers.size,1);h.said[0].onstart();assert.equal(h.timers.size,0);assert.equal(h.statuses.at(-1),'speaking');h.said[0].onend();assert.equal(h.statuses.at(-1),'ready');
 h.api.speak('old');const old=h.said.at(-1);h.api.speak('new');old.onerror();assert.equal(h.statuses.at(-1),'starting','old callbacks ignored');h.said.at(-1).onerror();assert.equal(h.statuses.at(-1),'failed');
 h.api.speak('silent');[...h.timers.values()][0]();assert.equal(h.statuses.at(-1),'failed');assert.equal(h.timers.size,0);
 h.api.setMuted(true);let count=h.said.length;assert.equal(h.api.speak('no'),false);assert.equal(h.said.length,count);assert.equal(h.statuses.at(-1),'muted');h.api.setMuted(false);h.api.speak('two plus two','en-US');assert.equal(h.said.at(-1).voice.name,'English');h.api.destroy();assert.equal(Object.keys(h.handlers).length,0);assert.equal(h.timers.size,0);
}
{const h=speechHarness({unsupported:true});assert.equal(h.api.supported,false);assert.equal(h.api.speak('read'),false);assert.equal(h.statuses.at(-1),'unsupported');}
{const h=speechHarness({voices:[]});assert.equal(h.api.speak('测试'),true);assert.equal(h.said[0].lang,'zh-CN');}
{const h=speechHarness({voices:[{lang:'en-US'}]});assert.equal(h.api.speak('测试'),false);assert.equal(h.statuses.at(-1),'noVoice');assert.equal(h.said.length,0);}
{const h=speechHarness({throws:true});assert.equal(h.api.speak('测试'),false);assert.equal(h.statuses.at(-1),'failed');assert.equal(h.timers.size,0);}
console.log('PASS: all 100 independent mnemonic fixtures; 7,800 generated questions and answer choices; strict numeric input; speech callbacks, voice selection, gesture-path synchronous call, mute, cancellation, watchdog, empty voices, missing language, unsupported and error fallbacks.');
