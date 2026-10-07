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
 if(!options.unsupported){context.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};context.speechSynthesis={getVoices:()=>[{lang:'zh-CN'},{lang:'en-US'}],cancel(){},speak:u=>said.push(u),addEventListener(){},removeEventListener(){}};}
 vm.createContext(context);vm.runInContext(core,context);if(options.deck)context.KrisMath.makeDeck=()=>options.deck;vm.runInContext(script,context);
 const $=id=>document.getElementById(id), click=id=>$(id).fire('click'), change=(id,value)=>{$(id).value=value;$(id).fire('change');};
 const q=()=>{const [a,b]=$('equation').textContent.match(/\d+/g).map(Number);return{a,b,answer:mode==='addition'?a+b:a*b};};
 const answer=v=>{$('answer').value=String(v);$('answer-form').fire('submit');};
 return{$,click,change,q,answer,document,said,storage,context,html,timers};
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
 const oldEquation=$('equation').textContent;click('language');assert.equal($('equation').textContent,oldEquation);assert.equal(g.document.documentElement.lang,'en');assert.equal($('star-count').textContent,'1');assert.equal($('result').hidden,false);click('replay');assert.equal(g.said.at(-1).lang,mode==='multiplication'?'zh-CN':'en-US');click('language');
 click('mute');assert.equal($('replay').disabled,true);assert.equal($('mute').getAttribute('aria-pressed'),'true');click('replay');let speakCount=g.said.length;click('next');assert.equal($('result').hidden,true);assert.equal($('feedback').textContent,'');assert.equal($('answer').value,'');assert.equal($('hint-text').hidden,true);assert.equal($('answer').disabled,false);assert.equal(g.document.activeElement,$('equation'));
 click('learn');assert.equal($('star-count').textContent,'1');assert.equal(g.said.length,speakCount);assert($('result-equation').textContent.endsWith(String(q().answer)));click('mute');assert.equal($('replay').disabled,false);click('replay');assert.equal(g.said.length,++speakCount);click('next');
 for(let i=2;i<6;i++){answer(q().answer);assert.equal(g.said.length,++speakCount);if(i===5){g.said.at(-1).onstart();assert($('speech-status').textContent.includes('朗读'));}click('next');if(i===5){assert.equal(g.said.length,++speakCount);g.said.at(-1).onend();}}
 assert.equal($('summary').hidden,false);assert.equal($('play-panel').hidden,true);assert.equal($('star-count').textContent,'5');assert.equal($('review-list').children.length,6);assert.equal($('summary-stars').textContent,'★★★★★☆');assert.equal($('progress').children[1].className,'progress-step learned');assert.equal($('speech-status').textContent,'每题完成后会朗读。没听到？点「再听一次」。');
 click('next');assert.equal($('review-list').children.length,6,'no seventh question');$('review-list').children[0].fire('click');assert.equal(g.said.length,++speakCount);click('language');assert($('summary-title').textContent.includes('explorer'));assert.equal($('review-list').children.length,6);click('play-again');assert.equal($('summary').hidden,true);assert.equal($('star-count').textContent,'0');assert.equal(g.document.activeElement,$('equation'));
 g.change('range',mode==='addition'?'10':'7');for(let i=0;i<6;i++){if(mode==='addition'){assert(q().a<=10&&q().b<=10);}else assert.equal(q().a,7);click('learn');click('next');}
 click('restart');assert.equal($('summary').hidden,true);assert.equal($('range').value,mode==='addition'?'10':'7');
 g.document.hidden=true;g.document.listeners.visibilitychange();assert(g.context);g.context.document.hidden=false;
}
for(const mode of ['addition','multiplication']){
 const g=createGame(mode,{unsupported:true,deniedStorage:true});assert(g.$('speech-status').textContent.includes('不支持'));g.answer(g.q().answer);assert.equal(g.$('replay').disabled,true);assert.equal(g.$('star-count').textContent,'1');g.click('language');assert(g.$('speech-status').textContent.includes('cannot'));g.click('restart');
}
const g=createGame('multiplication');g.change('range','10');for(let i=0;i<6;i++){g.answer(g.q().answer);assert(g.$('mnemonic').textContent.startsWith('十乘'));assert(g.$('result-label').textContent.includes('算式'));g.click('next');}
console.log('PASS: real handlers for both six-question games; correct/wrong/invalid/learn flows; keyboard focus; no double-scoring; grouping; hints; progress; summary/review; table/range switching; restart; bilingual state; speech and muted/unsupported/blocked-storage fallbacks. DOM simulation, not browser/device QA.');

{ const deck=[{a:7,b:7,answer:49},{a:7,b:10,answer:70},{a:10,b:7,answer:70},{a:10,b:10,answer:100},{a:1,b:1,answer:1},{a:7,b:7,answer:49}];const g=createGame('multiplication',{deck});for(const fact of deck){g.answer(fact.answer);assert.equal(g.$('mnemonic').textContent,g.said.at(-1).text);if(fact.a===7&&fact.b===7)assert.equal(g.said.at(-1).text,'七七四十九');assert.equal(g.$('objects').children.length,fact.a);assert.equal(g.$('objects').children.flatMap(x=>x.children.find(e=>e.className==='units').children).length,fact.answer);g.click('next');}assert.equal(g.said.length,7,'six answers plus round-end repetition');assert.equal(g.said.at(-1).text,'七七四十九');g.said.at(-1).onstart();g.document.hidden=true;g.document.listeners.visibilitychange();assert.equal(g.$('speech-status').textContent,'每题完成后会朗读。没听到？点「再听一次」。');}
console.log('PASS: exact 7×7 voice; 7×10,10×7,10×10 boundaries; 100-star rendering; final-round mnemonic repeated synchronously; interrupted speech status resets.');
