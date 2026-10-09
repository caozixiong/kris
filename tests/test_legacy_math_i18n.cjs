/* Dependency-free DOM/state regression tests for legacy maths localization.
 * Uses production HTML/scripts and i18n runtime. No rendering/layout claim. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {makeDOM,ROOT}=require('./quest-dom.cjs');
const PAGES=['math_chinese','math_english','math234','math567','math8','math9','math10'];
function boot(name,language='fr') {
 const filename=path.join(ROOT,'games',name+'.html'), html=fs.readFileSync(filename,'utf8');
 const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
 const document=makeDOM(html.replace(/<(script|style)\b([^>]*)>[\s\S]*?<\/\1>/gi,'<$1$2></$1>'));
 const proto=Object.getPrototypeOf(document.body),events={},timeouts=new Map(),intervals=new Map();let timer=0;
 Object.defineProperties(proto,{
  id:{configurable:true,get(){return this.getAttribute('id')||'';},set(v){this.setAttribute('id',v);}},
  nodeValue:{configurable:true,get(){return this.nodeType===3?this.value:null;},set(v){if(this.nodeType===3)this.value=String(v);}},
  parentNode:{configurable:true,get(){return this.parentElement;}},
  previousElementSibling:{configurable:true,get(){const siblings=this.parentElement?.children||[];return siblings[siblings.indexOf(this)-1]||null;}},
  classList:{configurable:true,get(){const self=this;const change=(values,on)=>{const set=new Set(self.className.split(/\s+/).filter(Boolean));values.forEach(v=>on?set.add(v):set.delete(v));self.className=[...set].join(' ');};return {add:(...v)=>change(v,true),remove:(...v)=>change(v,false),contains:v=>self.className.split(/\s+/).includes(v),toggle:(v,on)=>change([v],on===undefined?!self.className.split(/\s+/).includes(v):on)};}}
 });
 proto.appendChild=function(n){this.append(n);return n;};
 proto.prepend=function(n){n.parentElement=this;this.childNodes.unshift(n);};
 proto.removeChild=function(n){const at=this.childNodes.indexOf(n);if(at>=0)this.childNodes.splice(at,1);n.parentElement=null;return n;};
 proto.remove=function(){this.parentElement?.removeChild(this);};
 proto.after=function(n){const p=this.parentElement;if(!p)return;n.remove();const at=p.childNodes.indexOf(this);p.childNodes.splice(at+1,0,n);n.parentElement=p;};
 proto.getElementsByClassName=function(c){return this.querySelectorAll('.'+c);};
 proto.removeEventListener=function(type,fn){this.listeners[type]=(this.listeners[type]||[]).filter(x=>x!==fn);};
 proto.getBoundingClientRect=()=>({top:0,left:0,right:100,width:100,height:100});
 proto.animate=()=>({onfinish:null});
 proto.click=function(){if(this.disabled)return;const event={type:'click',target:this,preventDefault(){}};this.onclick?.(event);for(const fn of this.listeners.click||[])fn(event);};
 for(const input of document.querySelectorAll('input'))input.checked=input.hasAttribute('checked');
 const create=document.createElement;document.createElement=tag=>{const node=create(tag);node.dataset=new Proxy(node.dataset,{set(data,key,value){data[key]=String(value);node.attributes['data-'+String(key).replace(/[A-Z]/g,c=>'-'+c.toLowerCase())]=String(value);return true;}});return node;};
 document.readyState='loading';
 document.getElementById=id=>document.querySelector('#'+id);
 document.addEventListener=(name,fn)=>(events[name]??=[]).push(fn);
 let seed=9384;const math=Object.create(Math);math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const storage=new Map([['kris-site-language',language]]);
 const context={document,console,Math:math,URL,Promise,tailwind:{},MutationObserver:class{observe(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},location:{href:'https://example.test/games/'+name+'.html',origin:'https://example.test'},setTimeout:(fn)=>{timeouts.set(++timer,fn);return timer;},clearTimeout:id=>timeouts.delete(id),setInterval:fn=>{intervals.set(++timer,fn);return timer;},clearInterval:id=>intervals.delete(id),requestAnimationFrame:fn=>fn()};
 context.window=context;context.addEventListener=(name,fn)=>(events[name]??=[]).push(fn);
 vm.createContext(context);
 for(const [,attrs,source] of scripts){
  const src=attrs.match(/\bsrc="([^"]+)"/)?.[1];
  if(src){if(!/\.\.\/assets\/(?:i18n(?:-legacy-math|-site)?|legacy-math-arcade)\.js/.test(src))continue;vm.runInContext(fs.readFileSync(path.resolve(path.dirname(filename),src.split('?')[0]),'utf8'),context,{filename:src});}
  else vm.runInContext(source.replace('    app.init();','    window.__legacy = {app, game1, game2, game3, game4, game5, game6, game7, game8, game9, game10};\n    app.init();'),context,{filename:name+' inline'});
 }
 assert.ok(context.KrisI18n, name+' has the shared runtime');
 for(const fn of events.DOMContentLoaded||[])fn();document.readyState='complete';context.KrisI18n.refresh();
 return {context,document,intervals,timeouts,run:source=>vm.runInContext(source,context),$:(s)=>document.querySelector(s),all:s=>document.querySelectorAll(s),lang(l){context.KrisI18n.setLanguage(l);},refresh(){context.KrisI18n.refresh();}};
}
const stateJSON=value=>JSON.stringify(value,(_key,val)=>val?.nodeType?{tag:val.tagName,className:val.className}:val);
let count=0;
const test=(name,fn)=>{fn();count++;console.log('ok',name);};
test('every initial UI string and accessibility attribute has a complete catalog entry',()=>{
 const exact=new Set(),patterns=[];
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,'assets/i18n-legacy-math.js'),'utf8'),{window:{KrisI18n:{register(catalog){for(const [zh,values]of Object.entries(catalog)){assert.equal(values.length,2);assert.ok(values.every(v=>typeof v==='string'&&v.length));[zh,...values].forEach(v=>exact.add(v));}},registerPatterns(items){for(const item of items){assert.ok(item.zh&&item.en&&item.fr);patterns.push(item.pattern);}}}}});
 for(const page of PAGES){
  const html=fs.readFileSync(path.join(ROOT,'games',page+'.html'),'utf8').replace(/&copy;/g,'©').replace(/<(script|style)\b([^>]*)>[\s\S]*?<\/\1>/gi,'<$1$2></$1>');
  const doc=makeDOM(html),texts=[];
  const walk=node=>{if(node.nodeType===3)texts.push(node.textContent);else{for(const attr of ['title','placeholder','alt','aria-label']){const v=node.getAttribute?.(attr);if(v)texts.push(v);}node.childNodes?.forEach(walk);}};walk(doc.documentElement);
  for(const raw of texts){const text=raw.replace(/\s+/g,' ').trim();if(!/[\p{L}]/u.test(text)||text==='N')continue;assert.ok(exact.has(text)||patterns.some(pattern=>pattern.test(text)),page+' missing translation: '+text);}
 }
});
for(const page of PAGES)test(page+' loads in all languages and round-trips live text',()=>{
 for(const lang of ['zh','en','fr']) {
  const g=boot(page,lang),title=g.$('title').textContent;
  assert.ok(title.length>0);
  if(lang!=='zh')assert.doesNotMatch(title,/[\u3400-\u9fff]/);
  g.lang('en');g.lang('fr');g.lang(lang);
  assert.equal(g.$('title').textContent,title);
  assert.equal(g.all('[data-site-language]').length,3);
 }
});
for(const page of ['math_chinese','math_english'])test(page+' preserves all ten games during language changes',()=>{
 const g=boot(page);const games=g.context.__legacy;
 for(let n=1;n<=10;n++){
  g.$('#select-game'+n).click();g.refresh();
  const game=games['game'+n];
  if(n>=9){g.$('#game'+n+'-start-game').click();g.refresh();}
  const original=stateJSON(game.state),input=g.$('#game'+n+'-answer-input');if(input)input.value='7';
  for(const lang of ['en','zh','fr']){g.lang(lang);assert.equal(stateJSON(game.state),original,'game '+n+' state');if(input)assert.equal(input.value,'7');}
  if(n===5){assert.match(g.$('#game5-player-money').textContent,/^Tu as 💰\d+ pièces\.$/);const chosen=game.state.correctAnswer.includes('或')||game.state.correctAnswer.includes('or')?game.state.item1.name:game.state.correctAnswer;game.checkAnswer(chosen);g.refresh();assert.equal(game.state.score,1);}
  if(n===6){game.handleAnswer(game.state.correctJumps);g.refresh();assert.equal(g.$('#game6-result-text').textContent,'Atterrissage parfait !');}
  if(n===7){game.state.score=100;game.updateCharacterProgress();g.refresh();assert.equal(g.$('#game7-superman-status').textContent,'Débloqué !');}
 }
});
test('math234 score, minimum timer, timeout and game-over messages',()=>{
 const g=boot('math234');g.run('game2.state.currentTimerDuration = game2.config.MIN_TIMER_DURATION; game2.handleMoreChallenging()');g.refresh();assert.equal(g.$('#game2-more-challenging-btn').textContent,'Temps minimum (2 s) !');
 g.run('game2.showResult(false,true)');g.refresh();assert.equal(g.$('#game2-result-text').textContent,'Temps écoulé !');
 g.run('remainingTries=0; currentScore=12; updateScoreDisplay(); checkGameOver()');g.refresh();assert.equal(g.$('#final-score-display').textContent,'Ton score : 12/50');
 g.lang('en');assert.equal(g.$('#final-score-display').textContent,'Your score: 12/50');g.lang('zh');assert.equal(g.$('#game-over-message').textContent,'游戏结束！');
});
test('math567 potion can render both missing positions and keeps progress',()=>{
 const g=boot('math567');g.$('#select-game5').click();
 for(let n=0;n<20;n++)g.run('game5.startGameCycle()');
 const before=g.run('JSON.stringify(game5.state)');g.lang('en');g.lang('fr');assert.equal(g.run('JSON.stringify(game5.state)'),before);assert.ok(g.$('#game5-val2'));
});
test('math567 jump choices and all fruit/change scenarios remain answerable',()=>{
 const g=boot('math567');g.$('#select-game6').click();g.refresh();assert.match(g.$('#game6-fuel-info').textContent,/^Chaque saut : [+-]\d$/);for(const b of g.all('#game6-jump-options .jump-option'))assert.match(b.textContent,/^\d sauts?$/);
 g.$('#select-game7').click();
 for(let i=0;i<40;i++){
  g.run('gamePausedForFeedback=false; remainingTries=50;game7.startGameCycle()');g.refresh();
  const choices=g.all('#game7-choice-options .choice-option').map(b=>b.dataset.choice);
  const answer=g.run('String(game7.state.correctAnswer)');assert.ok(choices.map(String).includes(answer),'correct fruit option exists: '+answer);
  const before=g.run('currentScore');g.run(`game7.checkAnswer(${JSON.stringify(answer)})`);g.refresh();assert.equal(g.run('currentScore'),before+1);
  for(const lang of ['zh','en','fr'])g.lang(lang);
 }
 assert.equal(g.context.KrisI18n.translate('Buy Apple. Change?'),'Achète une pomme. Quelle monnaie te rend-on ?');
 assert.equal(g.context.KrisI18n.translate('Apple OR Grapes'),'Pomme ou Raisin');
});
test('math8 mid-question and feedback language changes preserve answer and score',()=>{
 const g=boot('math8'),before=g.run('[currentPosition,targetPosition,correctJumps,score].join()');g.lang('en');g.lang('fr');assert.equal(g.run('[currentPosition,targetPosition,correctJumps,score].join()'),before);
 g.run('handleAnswer({target:{dataset:{jumps:correctJumps}}})');g.refresh();assert.equal(g.$('#result-text').textContent,'Atterrissage parfait !');g.lang('zh');assert.equal(g.$('#result-text').textContent,'完美着陆！');assert.equal(g.run('score'),1);
});
test('math9 mode cards use stable keys after translation, keep input, and translate help/toasts',()=>{
 const g=boot('math9');
 for(const [mode,op]of [['addition','+'],['subtraction','-']]){
  g.$('[data-game-mode="'+mode+'"]').click();assert.equal(g.run('gameState.currentQuestion.operation'),op);
  const before=g.run('JSON.stringify(gameState)');g.$('#answer-input').value='6';g.lang('en');g.lang('fr');assert.equal(g.run('JSON.stringify(gameState)'),before);assert.equal(g.$('#answer-input').value,'6');
 }
 assert.equal(g.$('#help-btn').getAttribute('aria-label'),'Aide du jeu');assert.equal(g.$('#close-help').getAttribute('aria-label'),'Fermer l’aide');
 g.run('showToast("恭喜升级到关卡 3！")');g.refresh();assert.ok(g.document.body.textContent.includes('Félicitations ! Tu passes au niveau 3 !'));
 g.run('gameState.correctAnswers=5;updateGameStats();updateCharacterProgress()');g.refresh();assert.equal(g.$('#superman-progress').parentElement.previousElementSibling.textContent,'Débloqué !');
});
test('math10 correct/incorrect feedback and options survive live switching',()=>{
 const g=boot('math10'),before=g.run('JSON.stringify(gameState)');g.lang('en');g.lang('fr');assert.equal(g.run('JSON.stringify(gameState)'),before);
 g.run('checkAnswer(gameState.currentAnswer + 1)');g.refresh();assert.equal(g.$('#message').textContent,'Oups, essaie la question suivante !');g.lang('zh');assert.equal(g.$('#message').textContent,'答错了，再试一次！');
});
test('dynamic pattern pluralization and counters work in every language',()=>{
 const g=boot('math8');for(const [source,fr]of [['1 coin','1 pièce'],['2 coins','2 pièces'],['1 Jump','1 saut'],['4 Jumps','4 sauts'],['Tries: 7','Essais restants : 7'],['Not quite! That was 1 jumps.','Pas tout à fait ! Tu as choisi 1 saut.']])assert.equal(g.context.KrisI18n.translate(source),fr);
 g.lang('zh');assert.equal(g.context.KrisI18n.translate('Alien at: 10'),'外星人位置: 10');assert.equal(g.context.KrisI18n.translate('Buy Pear. Change?'),'买梨，能找回多少金币？');
});
console.log(`${count} legacy math localization tests passed.`);

module.exports={boot};
