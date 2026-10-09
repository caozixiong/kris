/* Executes real game code against a DOM model; no layout/native audio claims. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
const core=fs.readFileSync(path.join(root,'assets/math-core.js'),'utf8');
const script=fs.readFileSync(path.join(root,'assets/math-game.js'),'utf8');
function createGame(mode,options={}) {
 let document;
 class Element {
  constructor(tag='div',attrs={},text='') { this.tagName=tag.toUpperCase();this.attributes={...attrs};this.children=[];this.parentElement=null;this.listeners={};this.dataset={};this._text=text;this.hidden='hidden' in attrs;this.disabled='disabled' in attrs;this.value=attrs.value||'';this.className=attrs.class||'';this.style={};for(const[k,v]of Object.entries(attrs)){if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=v;}this.classList={toggle:(name,active)=>{const s=new Set(this.className.split(' ').filter(Boolean));active?s.add(name):s.delete(name);this.className=[...s].join(' ');}};}
  set textContent(v){this.children.forEach(c=>c.parentElement=null);this.children=[];this._text=String(v);}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  append(...items){for(const c of items){c.parentElement=this;this.children.push(c);}}
  replaceChildren(...items){this.children.forEach(c=>c.parentElement=null);this.children=[];this._text='';this.append(...items);}
  setAttribute(k,v){this.attributes[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5)]=String(v);}
  getAttribute(k){return this.attributes[k];}
  addEventListener(t,f){(this.listeners[t]??=[]).push(f);}
  fire(t){if(t==='click'&&this.disabled)return;for(const f of this.listeners[t]||[])f({preventDefault(){},target:this});}
  focus(){document.activeElement=this;}
  scrollIntoView(){}
 }
 function fromNode(node){const e=new Element(node.tag,node.attrs,node.text);e.append(...node.children.map(fromNode));return e;}
 const html=fromNode(JSON.parse(fs.readFileSync(path.join(__dirname,`${mode}_game.html.json`),'utf8')));
 const walk=e=>[e,...e.children.flatMap(walk)];
 document={documentElement:html,hidden:false,activeElement:null,listeners:{},get body(){return walk(html).find(e=>e.tagName==='BODY');},getElementById:id=>walk(html).find(e=>e.attributes.id===id),createElement:t=>new Element(t),querySelectorAll:selector=>walk(html).filter(e=>selector==='[data-i18n]'?'i18n' in e.dataset:selector==='[data-replay], #replay'?'replay' in e.dataset||e.attributes.id==='replay':false),addEventListener(t,f){this.listeners[t]=f;}};
 const said=[],timers=new Map(),eventHandlers={};let serial=0;
 const storage=options.storage||new Map();
 const context={document,console,setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id),localStorage:{getItem:k=>{if(options.deniedStorage)throw Error('denied');return storage.get(k);},setItem:(k,v)=>{if(options.deniedStorage)throw Error('denied');storage.set(k,v);}},addEventListener:(t,f)=>eventHandlers[t]=f};
 context.window=context;
 let language=options.language||'zh';const languageListeners=[];context.KrisI18n={get language(){return language;},onChange(fn){languageListeners.push(fn);},setLanguage(value){language=value;for(const fn of languageListeners)fn();}};
 if(!options.unsupported){context.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};context.speechSynthesis={getVoices:()=>[{lang:'zh-CN'},{lang:'en-US'},{lang:'fr-CA'}],cancel(){},speak:u=>said.push(u),addEventListener(){},removeEventListener(){}};}
 vm.createContext(context);vm.runInContext(core,context);if(options.deck)context.KrisMath.makeDeck=()=>options.deck;vm.runInContext(script,context);
 const $=id=>document.getElementById(id), click=id=>$(id).fire('click'), change=(id,value)=>{$(id).value=value;$(id).fire('change');};
 const q=()=>{const [a,b]=$('equation').textContent.match(/\d+/g).map(Number);return{a,b,answer:mode==='addition'?a+b:a*b};};
 const answer=v=>{$('answer').value=String(v);$('answer-form').fire('submit');};
 return{$,click,change,q,answer,setLanguage:value=>context.KrisI18n.setLanguage(value),document,said,storage,context,html,timers};
}
for(const mode of ['addition','multiplication']){
 const g=createGame(mode);const{$,click,q,answer}=g;
 assert.equal(g.said.length,0,'no load autoplay');assert.equal($('result').hidden,true);assert.equal($('summary').hidden,true);assert.equal($('star-count').textContent,'0');
 assert.equal($('range').value,mode==='addition'?'20':'all');assert.equal($('progress').children.length,6);
 const initial=q();assert.equal($('objects').children.length,mode==='addition'?2:initial.a);
 for(const group of $('objects').children){group.fire('click');assert.equal(group.getAttribute('aria-pressed'),'true');}
 assert($('counting').textContent.includes(String(initial.answer)));$('objects').children[0].fire('click');assert.equal($('objects').children[0].getAttribute('aria-pressed'),'false');
 for(const input of ['', '4.9', '1e2', '7abc']){answer(input);assert($('feedback').textContent.includes('完整'));assert.equal($('star-count').textContent,'0');assert.equal(g.said.length,0);}
 const wrong=$('choices').children.find(b=>Number(b.textContent)!==q().answer);wrong.focus();wrong.fire('click');assert.equal($('hint-text').hidden,false);assert(g.document.activeElement.parentElement===$('choices'),'wrong choice restores focus');assert.equal(g.document.activeElement.disabled,false);assert.equal($('result').hidden,true);
 answer(q().answer);assert.equal($('result').hidden,false);assert.equal($('star-count').textContent,'1');assert.equal(g.said.length,1);assert.equal(g.document.activeElement,$('next'));assert.equal($('answer').disabled,true);assert($('choices').children.every(b=>b.disabled));
 answer(q().answer);click('learn');assert.equal(g.said.length,1,'double submit does not rescore');assert.equal($('star-count').textContent,'1');click('replay');assert.equal(g.said.length,2);
 const oldEquation=$('equation').textContent;g.setLanguage('en');assert.equal($('equation').textContent,oldEquation);assert.equal(g.document.documentElement.lang,'en');assert.equal($('star-count').textContent,'1');assert.equal($('result').hidden,false);click('replay');assert.equal(g.said.at(-1).lang,mode==='multiplication'?'zh-CN':'en-US');g.setLanguage('zh');
 click('mute');assert.equal($('replay').disabled,true);assert.equal($('mute').getAttribute('aria-pressed'),'true');click('replay');let speakCount=g.said.length;click('next');assert.equal($('result').hidden,true);assert.equal($('feedback').textContent,'');assert.equal($('answer').value,'');assert.equal($('hint-text').hidden,true);assert.equal($('answer').disabled,false);assert.equal(g.document.activeElement,$('equation'));
 click('learn');assert.equal($('star-count').textContent,'1');assert.equal(g.said.length,speakCount);assert($('result-equation').textContent.endsWith(String(q().answer)));click('mute');assert.equal($('replay').disabled,false);click('replay');assert.equal(g.said.length,++speakCount);click('next');
 for(let i=2;i<6;i++){answer(q().answer);assert.equal(g.said.length,++speakCount);if(i===5){g.said.at(-1).onstart();assert($('speech-status').textContent.includes('朗读'));}click('next');if(i===5){assert.equal(g.said.length,++speakCount);g.said.at(-1).onend();}}
 assert.equal($('summary').hidden,false);assert.equal($('play-panel').hidden,true);assert.equal($('star-count').textContent,'5');assert.equal($('review-list').children.length,6);assert.equal($('summary-stars').textContent,'★★★★★☆');assert.equal($('progress').children[1].className,'progress-step learned');assert.equal($('speech-status').textContent,'每题完成后会朗读。没听到？点「再听一次」。');
 click('next');assert.equal($('review-list').children.length,6,'no seventh question');$('review-list').children[0].fire('click');assert.equal(g.said.length,++speakCount);g.setLanguage('en');assert($('summary-title').textContent.includes('explorer'));assert.equal($('review-list').children.length,6);click('play-again');assert.equal($('summary').hidden,true);assert.equal($('star-count').textContent,'0');assert.equal(g.document.activeElement,$('equation'));
 g.change('range',mode==='addition'?'10':'7');for(let i=0;i<6;i++){if(mode==='addition'){assert(q().a<=10&&q().b<=10);}else assert.equal(q().a,7);click('learn');click('next');}
 click('restart');assert.equal($('summary').hidden,true);assert.equal($('range').value,mode==='addition'?'10':'7');
 g.document.hidden=true;g.document.listeners.visibilitychange();assert(g.context);g.context.document.hidden=false;
}
for(const mode of ['addition','multiplication']){
 const g=createGame(mode,{unsupported:true,deniedStorage:true});assert(g.$('speech-status').textContent.includes('不支持'));g.answer(g.q().answer);assert.equal(g.$('replay').disabled,true);assert.equal(g.$('star-count').textContent,'1');g.setLanguage('en');assert(g.$('speech-status').textContent.includes('cannot'));g.click('restart');
}
const g=createGame('multiplication');g.change('range','10');for(let i=0;i<6;i++){g.answer(g.q().answer);assert(g.$('mnemonic').textContent.startsWith('十乘'));assert(g.$('result-label').textContent.includes('算式'));g.click('next');}
console.log('PASS: real handlers for both six-question games; correct/wrong/invalid/learn flows; keyboard focus; no double-scoring; grouping; hints; progress; summary/review; table/range switching; restart; shared language state; speech and muted/unsupported/blocked-storage fallbacks. DOM simulation, not browser/device QA.');

{ const deck=[{a:7,b:7,answer:49},{a:7,b:10,answer:70},{a:10,b:7,answer:70},{a:10,b:10,answer:100},{a:1,b:1,answer:1},{a:7,b:7,answer:49}];const g=createGame('multiplication',{deck});for(const fact of deck){g.answer(fact.answer);assert.equal(g.$('mnemonic').textContent,g.said.at(-1).text);if(fact.a===7&&fact.b===7)assert.equal(g.said.at(-1).text,'七七四十九');assert.equal(g.$('objects').children.length,fact.a);assert.equal(g.$('objects').children.flatMap(x=>x.children.find(e=>e.className==='units').children).length,fact.answer);g.click('next');}assert.equal(g.said.length,7,'six answers plus round-end repetition');assert.equal(g.said.at(-1).text,'七七四十九');g.said.at(-1).onstart();g.document.hidden=true;g.document.listeners.visibilitychange();assert.equal(g.$('speech-status').textContent,'每题完成后会朗读。没听到？点「再听一次」。');}
console.log('PASS: exact 7×7 voice; 7×10,10×7,10×10 boundaries; 100-star rendering; final-round mnemonic repeated synchronously; interrupted speech status resets.');

for(const mode of ['addition','multiplication']){
 const g=createGame(mode);const q=g.q();g.$('objects').children[0].fire('click');g.click('hint');g.answer('bad');g.$('answer').value='17';
 g.setLanguage('fr');assert.equal(g.document.documentElement.lang,'fr-CA');assert.deepEqual(g.q(),q);assert.equal(g.$('answer').value,'17');assert.equal(g.$('objects').children[0].getAttribute('aria-pressed'),'true');assert.equal(g.$('hint-text').hidden,false);assert(g.$('feedback').textContent.includes('entier'));assert(g.$('scene-instruction').textContent.includes('Touche'));
 g.answer(q.answer);assert.equal(g.said.at(-1).lang,mode==='multiplication'?'zh-CN':'fr-CA');assert(g.$('result-label').textContent.includes(mode==='multiplication'?'chinois':'voix haute'));const spoken=g.said.length;g.setLanguage('en');g.setLanguage('fr');assert.equal(g.said.length,spoken,'switching language does not autoplay speech');assert.equal(g.$('star-count').textContent,'1');assert.equal(g.$('result').hidden,false);g.click('replay');assert.equal(g.said.at(-1).lang,mode==='multiplication'?'zh-CN':'fr-CA');
 if(mode==='multiplication')assert.equal(g.$('mnemonic').textContent,g.context.KrisMath.mnemonic(q.a,q.b));else assert(g.$('mnemonic').textContent.includes('égale'));
 g.click('next');for(let i=1;i<6;i++){g.click('learn');g.click('next');}assert(g.$('summary-copy').textContent.includes('étoile gagnée'));assert.equal(g.$('review-list').children.length,6);g.setLanguage('zh');g.setLanguage('fr');assert.equal(g.$('review-list').children.length,6);g.$('review-list').children[0].fire('click');assert.equal(g.said.at(-1).lang,mode==='multiplication'?'zh-CN':'fr-CA');
 const resumed=createGame(mode,{language:'fr'});assert.equal(resumed.document.documentElement.lang,'fr-CA');assert.equal(resumed.$('check').textContent,'Vérifier');
}
console.log('PASS: French math interface, hints, invalid feedback, partial typed answer, counted groups, preserved solved/review state, initial French language, fr-CA addition speech and Chinese multiplication mnemonics.');

// The manipulatives share the existing question state and never award points.
const descendants = node => [node,...node.children.flatMap(descendants)];
const withClass = (node,name) => descendants(node).filter(n=>n.className.split(' ').includes(name));
for (let a=1;a<=20;a++) for(let b=1;b<=20;b++) {
 const g=createGame('addition',{deck:Array.from({length:6},()=>({a,b,answer:a+b}))});
 const filled=()=>withClass(g.$('lab-model'),'is-filled');
 assert.equal(filled().length,0);
 g.$('objects').children[1].fire('click');
 assert.equal(filled().length,b); assert(filled().every(n=>n.className.includes('basket-1')),'basket two retains its identity');
 g.click('lab-toggle');
 assert.equal(filled().length,a+b);
 assert.equal(withClass(g.$('lab-model'),'basket-0').length,a);
 assert.equal(withClass(g.$('lab-model'),'basket-1').length,b);
 assert.equal(withClass(g.$('lab-model'),'ten-frame').length,Math.ceil((a+b)/10));
 assert.equal(withClass(g.$('lab-model'),'harvest-cell').length,Math.ceil((a+b)/10)*10);
 assert.equal(g.$('star-count').textContent,'0');assert.equal(g.said.length,0);
 if(a===20&&b===20){for(const lang of ['fr','en','zh']){g.setLanguage(lang);assert.equal(filled().length,40);assert.equal(g.$('lab-toggle').getAttribute('aria-pressed'),'true');}assert(g.$('lab-caption').textContent.includes('4 个十 + 0 个一'));}
 g.click('lab-toggle');assert.equal(filled().length,0);assert.equal(g.$('lab-toggle').getAttribute('aria-pressed'),'false');
}
for(let a=1;a<=10;a++) for(let b=1;b<=10;b++) {
 const g=createGame('multiplication',{deck:Array.from({length:6},()=>({a,b,answer:a*b}))});
 const cells=()=>g.$('lab-model').children;
 assert.equal(cells().length,a*b);assert.equal(g.$('lab-model').getAttribute('data-rows'),String(a));assert.equal(g.$('lab-model').getAttribute('data-columns'),String(b));
 assert.equal(withClass(g.$('lab-model'),'is-lit').length,0);
 g.$('objects').children[0].fire('click');assert.equal(withClass(g.$('lab-model'),'is-lit').length,b);
 g.click('lab-toggle');assert.equal(g.$('lab-model').getAttribute('data-rows'),String(b));assert.equal(g.$('lab-model').getAttribute('data-columns'),String(a));assert.equal(cells().length,a*b);
 assert.equal(withClass(g.$('lab-model'),'is-lit').length,b);assert(cells().filter(n=>n.className.includes('is-lit')).every(n=>n.getAttribute('data-group')==='0'),'rotation preserves original group identity');
 for(const lang of ['fr','en','zh']){g.setLanguage(lang);assert.equal(g.$('lab-model').getAttribute('data-rows'),String(b));assert.equal(g.$('lab-toggle').getAttribute('aria-pressed'),'true');assert.equal(withClass(g.$('lab-model'),'is-lit').length,b);}
 assert.equal(g.$('star-count').textContent,'0');assert.equal(g.said.length,0);
 g.answer(a*b);assert.equal(g.$('mnemonic').textContent,g.context.KrisMath.mnemonic(a,b));g.click('next');
 assert.equal(g.$('lab-model').getAttribute('data-rows'),String(a));assert.equal(g.$('lab-toggle').getAttribute('aria-pressed'),'false');assert.equal(withClass(g.$('lab-model'),'is-lit').length,0);
}
console.log('PASS: all 400 addition pairs preserve basket identities in exact ten-frames; all 100 multiplication arrays transpose without changing counts/group identity/mnemonics; manipulatives never score or autoplay, preserve language state and reset cleanly.');
for(const mode of ['addition','multiplication']) {
 const g=createGame(mode);
 const grown=()=>withClass(g.$('world-stops'),'is-grown');
 assert.equal(g.$('world-stops').children.length,6);assert.equal(grown().length,0);
 const staleGroup=g.$('objects').children[0], staleChoice=g.$('choices').children[0];
 g.click('restart');staleGroup.fire('click');staleChoice.fire('click');
 assert.equal(g.$('counting').textContent,'试着点一点，边看边数。');assert.equal(g.$('feedback').textContent,'');
 g.click('hint');g.answer('bad');g.answer(g.q().answer+101);assert.equal(grown().length,0,'hints and wrong/invalid attempts do not grow the world');
 for(let i=0;i<6;i++) {
   if(i%2)g.click('learn');else g.answer(g.q().answer);
   assert.equal(grown().length,i+1);assert.equal(withClass(g.$('world-stops'),'has-fruit').length,Math.ceil((i+1)/2));
   for(const lang of ['en','fr','zh']){g.setLanguage(lang);assert.equal(grown().length,i+1);}
   g.click('next');
 }
 assert.equal(grown().length,6);assert.equal(g.$('star-count').textContent,'3');
 g.click('play-again');assert.equal(grown().length,0);
}
for(const file of ['assets/math-game.css','assets/word-games.css']) {
 const css=fs.readFileSync(path.join(root,file),'utf8');assert(css.includes('@media(prefers-reduced-motion:no-preference)'));assert(css.includes(':focus-visible'));
}
assert(/\.lab-toggle\{[^}]*min-height:44px/.test(fs.readFileSync(path.join(root,'assets/math-game.css'),'utf8')));
assert(/\.world-token\{[^}]*min-width:44px;min-height:44px/.test(fs.readFileSync(path.join(root,'assets/word-games.css'),'utf8')));
console.log('PASS: orchard/galaxy growth reflects each completed fact, distinguish earned fruit from learned steps, preserve translations, ignore stale groups/answers and reset; new controls declare 44px targets, focus and motion gating.');
