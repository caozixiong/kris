/* Runs the actual pages, production scripts and real delegated handlers using
 * the shared dependency-free DOM adapter. This is not browser/layout evidence. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {makeDOM,ROOT}=require('./quest-dom.cjs');
const pages={first:'chinese-first-words',match:'chinese-picture-match',builder:'chinese-word-builder'};
const snap=x=>JSON.stringify(x),copy=x=>JSON.parse(snap(x));
function createGame(mode,options={}){
 const file=path.join(ROOT,'games',pages[mode]+'.html'),document=makeDOM(fs.readFileSync(file,'utf8'));
 const store=options.store||new Map(),writes=[],states=[],listeners={},speech=[];let seed=12345;
 const storage={getItem(key){if(options.deniedRead)throw Error('blocked read');return store.get(key)??null;},setItem(key,value){if(options.deniedWrite)throw Error('blocked write');if(key==='kris-chinese-progress-v1')writes.push(value);store.set(key,value);},removeItem(key){store.delete(key);}};
 const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const context={document,console,Math:math,URL,location:{href:'https://example.test/games/'+pages[mode]+'.html'+(options.language?'?lang='+options.language:''),origin:'https://example.test'},addEventListener(type,fn){(listeners[type]??=[]).push(fn);},setTimeout(){throw Error('No automatic game or speech timers');},setInterval(){throw Error('No recurring timers');}};context.window=context;
 if(options.voices){context.speechSynthesis={getVoices:()=>options.voices,cancel(){speech.push('cancel');},speak(u){speech.push(u);}};context.SpeechSynthesisUtterance=function(text){this.text=text;};}
 Object.defineProperty(context,'localStorage',{get(){if(options.deniedGetter)throw Error('blocked getter');return storage;}});vm.createContext(context);
 const scripts=document.querySelectorAll('script[src]');for(const script of [...scripts.filter(s=>!s.hasAttribute('defer')),...scripts.filter(s=>s.hasAttribute('defer'))]){
  const src=script.getAttribute('src').split('?')[0];if(options.missing&&src.includes(options.missing))continue;
  vm.runInContext(fs.readFileSync(path.resolve(path.dirname(file),src),'utf8'),context,{filename:src});
  if(src.endsWith('/chinese-core.js'))for(const name of ['createStudy','createMatch','createBuilder']){const original=context.KrisChineseCore[name];context.KrisChineseCore[name]=(...args)=>{const s=original(...args);states.push(s);return s;};}
 }
 document.readyState='interactive';document.dispatch('DOMContentLoaded');
 const $=s=>document.querySelector(s),all=s=>document.querySelectorAll(s),button=(act,value='')=>$(`button[data-act="${act}"][data-value="${value}"]`);
 const click=(act,value='')=>{const b=button(act,value);assert(b,`Missing button ${act}:${value}`);b.click();};
 return {context,document,store,writes,states,listeners,speech,$,all,button,click,get state(){return states.at(-1);},event(type){for(const fn of listeners[type]||[])fn({type});}};
}
function begin(g){if(g.state.mode==='first')while(g.state.studyIndex<g.state.entries.length-1)g.click('preview-next');g.click('begin');}
function finish(g){begin(g);while(g.state.phase!=='complete'){
 if(g.state.mode==='first'){g.click('answer',g.state.questions[g.state.question].id);g.click('next');}
 else if(g.state.mode==='match'){const e=g.state.entries.find(e=>!g.state.matched.includes(e.id));g.click('match','left:'+e.id);g.click('match','right:'+e.id);}
 else{if(g.state.phase==='study')g.click('begin');g.click('tile',0);g.click('tile',1);g.click('next');}
}}
for(const mode of Object.keys(pages)){
 const g=createGame(mode,{language:'en'});assert.equal(g.state.phase,'study');assert(g.$('h1').textContent.length>0);assert(g.$('kris-reviews').getAttribute('data-game')===pages[mode]);
 assert.equal(g.state.entries.length,mode==='builder'?2:4);assert(g.$('.hero-promises').textContent.includes('No Chinese reading needed'));
 // Switching language and hiding pinyin preserve the exact lesson and its phase.
 const initial=g.state,initialSnap=snap(initial);g.context.KrisI18n.setLanguage('fr');assert.equal(g.state,initial);assert.equal(snap(g.state),initialSnap);assert(g.$('h1').textContent.match(/chinois|amis/));
 g.click('pinyin');assert.equal(g.all('.pinyin').length,0);assert.equal(snap(g.state),initialSnap);g.click('pinyin');
 for(const e of g.all('.hanzi, .inline-hanzi')){assert.equal(e.getAttribute('lang'),'zh-CN');assert.equal(e.getAttribute('translate'),'no');}
 begin(g);let held;
 if(mode==='first'){const q=g.state.questions[0],wrong=q.choices.find(id=>id!==q.id);g.click('answer',wrong);assert.equal(g.state.feedback,'retry');assert(g.$('.hint-box'));held=snap(g.state);g.context.KrisI18n.setLanguage('zh');assert.equal(snap(g.state),held);assert.equal(g.$('.answer-card.is-selected').dataset.value,wrong);}
 if(mode==='match'){const a=g.state.entries[0].id,b=g.state.entries[1].id;g.click('match','left:'+a);held=snap(g.state);g.context.KrisI18n.setLanguage('zh');assert.equal(snap(g.state),held);g.click('match','right:'+b);assert.equal(g.state.phase,'retry');assert(g.$('.hint-box'));g.click('retry');}
 if(mode==='builder'){g.click('tile',1);assert.equal(g.state.feedback,'retry');assert(g.$('.hint-box'));g.click('tile',0);held=snap(g.state);g.context.KrisI18n.setLanguage('zh');assert.equal(snap(g.state),held);assert.equal(g.state.picks.length,1);}
 // A detached button and a stale forged bubbled event cannot change a new render.
 const stale=g.button('restart');g.click('pinyin');held=snap(g.state);stale.click();for(const fn of g.$('#chinese-app').listeners.click)fn({target:stale});assert.equal(snap(g.state),held);
 g.click('restart');assert.equal(g.state.phase,'study');finish(g);assert.equal(g.state.phase,'complete');assert.equal(g.writes.length,1);assert(g.$('.finish-panel'));
 const completed=g.state;g.context.KrisI18n.setLanguage('fr');assert.equal(g.state,completed);assert.equal(g.writes.length,1);
 g.click('restart');finish(g);assert.equal(g.writes.length,2);const saved=JSON.parse(g.writes.at(-1));assert.equal(saved.lessons.length,1);assert(saved.known.length>0);
 const beforeNext=g.state;g.click('lesson-next');assert.notEqual(g.state,beforeNext);assert.equal(g.state.phase,'study');g.click('lesson-prev');assert.deepEqual(g.state.entries.map(e=>e.id),beforeNext.entries.map(e=>e.id));
 // Navigation lifecycle cannot let a hidden page keep responding or start audio.
 g.event('pagehide');held=snap(g.state);g.click('restart');assert.equal(snap(g.state),held);g.event('pageshow');g.click('restart');assert.equal(g.state.phase,'study');
 const reloaded=createGame(mode,{store:g.store});assert(reloaded.$('.progress-copy').textContent.includes(String(saved.known.length)));
 for(const options of [{deniedRead:true},{deniedWrite:true},{deniedGetter:true},{store:new Map([['kris-chinese-progress-v1','{corrupt']])}]){const bad=createGame(mode,options);finish(bad);assert.equal(bad.state.phase,'complete');assert(bad.$('.finish-panel'));}
 for(const missing of ['chinese-bank.js','chinese-core.js']){const bad=createGame(mode,{missing});assert(bad.$('#chinese-app').textContent.includes('Lesson not loaded'));}
 // Local optional voice never plays by itself and ignores remote-only voices.
 const voice=createGame(mode,{voices:[{lang:'zh-CN',localService:true}]});assert.equal(voice.speech.filter(x=>typeof x==='object').length,0);const speakButton=voice.all('button[data-act="speak"]')[0];speakButton.click();const utterance=voice.speech.find(x=>typeof x==='object');assert(utterance);assert.equal(utterance.lang,'zh-CN');assert.equal(utterance.voice.localService,true);
 voice.context.KrisI18n.setLanguage('fr');assert.equal(voice.speech.filter(x=>typeof x==='object').length,1);voice.click('restart');const safe=snap(voice.state);utterance.onerror();assert.equal(snap(voice.state),safe);assert(!voice.$('.voice-note').textContent.includes('pas été lu'));
 const remote=createGame(mode,{voices:[{lang:'zh-CN',localService:false}]});remote.all('button[data-act="speak"]')[0].click();assert.equal(remote.speech.filter(x=>typeof x==='object').length,0);assert(remote.$('.voice-note').textContent.includes('本地中文语音'));
 const noVoice=createGame(mode);noVoice.all('button[data-act="speak"]')[0].click();assert(noVoice.$('.voice-note').textContent.includes('本地中文语音'));
}
// Walk all production lesson-navigation handlers, proving every bank entry is reachable.
for(const mode of ['first','match']){
 const g=createGame(mode);g.click('scope','all');if(mode==='match')g.click('size',6);const seen=[];
 for(;;){seen.push(...g.state.entries.map(e=>e.id));const next=g.button('lesson-next');if(next.disabled)break;next.click();}
 assert.deepEqual([...new Set(seen)].sort(),copy(g.context.KrisChineseBank.entries.map(e=>e.id).sort()));
 g.click('theme','animals');assert(g.state.entries.every(e=>e.theme==='animals'));g.click('scope','first');assert(g.state.entries.every(e=>g.context.KrisChineseBank.entries.slice(0,20).includes(e)));
}
const g=createGame('first');assert(g.$('.illustrated-cue img').getAttribute('src').includes('/water.svg'));g.click('lesson-next');assert(g.state.entries.some(e=>e.hanzi==='大'));g.click('preview-next');g.click('preview-next');assert(g.$('.illustrated-cue img').getAttribute('src').includes('/big.svg'));
console.log('Chinese page flows: all three games, languages, state preservation, retries, saved progress, blocked storage, no-voice fallback, stale clicks, navigation and all 300 reachable words passed.');
