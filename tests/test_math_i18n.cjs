/* Shared runtime plus production math DOM/handlers, with simulated speech only. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {makeDOM,ROOT}=require('./quest-dom.cjs');
function createMath(mode,options={}){
 const filename=path.join(ROOT,mode+'_game.html'),document=makeDOM(fs.readFileSync(filename,'utf8'));
 Object.defineProperty(document,'title',{get:()=>document.querySelector('title').textContent,set:value=>{document.querySelector('title').textContent=value;}});
 const store=options.store||new Map(),said=[],timers=new Map();let serial=0;
 const context={document,console,URL,location:{href:'https://example.test/'+mode+'_game.html',origin:'https://example.test'},addEventListener(){},setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id),localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}};
 context.window=context;
 context.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
 context.speechSynthesis={getVoices:()=>[{lang:'zh-CN'},{lang:'en-US'},{lang:'fr-CA'}],cancel(){},speak:u=>said.push(u),addEventListener(){},removeEventListener(){}};
 vm.createContext(context);const scripts=document.querySelectorAll('script[src]');
 for(const script of [...scripts.filter(s=>!s.hasAttribute('defer')),...scripts.filter(s=>s.hasAttribute('defer'))])vm.runInContext(fs.readFileSync(path.resolve(ROOT,script.getAttribute('src').split('?')[0]),'utf8'),context,{filename:script.getAttribute('src')});
 document.readyState='interactive';document.dispatch('DOMContentLoaded');
 const $=id=>document.getElementById(id),click=id=>$(id).click();
 const answer=value=>{$('answer').value=String(value);$('answer-form').dispatch('submit');};
 const fact=()=>{const[a,b]=$('equation').textContent.match(/\d+/g).map(Number);return{a,b,answer:mode==='addition'?a+b:a*b};};
 return{$,click,answer,fact,context,document,store,said,language:lang=>context.KrisI18n.setLanguage(lang)};
}
function noChinese(g){
 const found=[];
 function walk(n){
  if(n.nodeType===3){if(/[\u3400-\u9fff]/.test(n.textContent))found.push(n.textContent);return;}
  if(['SCRIPT','STYLE','NOSCRIPT'].includes(n.tagName)||n.hasAttribute('data-i18n-skip'))return;
  for(const attr of ['title','placeholder','aria-label','alt','content']){const value=n.getAttribute(attr);if(value&&/[\u3400-\u9fff]/.test(value))found.push(value);}
  n.childNodes.forEach(walk);
 }
 walk(g.document.documentElement);assert.deepEqual(found,[]);
}
for(const mode of ['addition','multiplication']){
 const g=createMath(mode),q=g.fact();
 g.$('objects').children[0].click();g.$('choices').children.find(n=>Number(n.textContent)!==q.answer).click();g.$('answer').value='12';
 for(const language of ['en','fr','en','fr']){
  g.language(language);noChinese(g);assert.deepEqual(g.fact(),q);assert.equal(g.$('answer').value,'12');assert(g.$('choices').children.some(n=>n.classList.contains('was-wrong')));assert.equal(g.$('objects').children[0].getAttribute('aria-pressed'),'true');assert(!g.$('hint-text').hidden);
 }
 g.answer(q.answer);g.context.KrisI18n.refresh();noChinese(g);assert.equal(g.said.at(-1).lang,mode==='addition'?'fr-CA':'zh-CN');const answered=g.$('mnemonic').textContent;
 g.language('zh');g.language('en');g.language('fr');assert.equal(g.$('mnemonic').textContent,answered);noChinese(g);assert.equal(g.$('star-count').textContent,'1');
 g.click('next');for(let i=1;i<6;i++){g.click('learn');g.click('next');}
 for(const language of ['en','fr','zh','fr']){g.language(language);if(language!=='zh')noChinese(g);assert.equal(g.$('review-list').children.length,6);}
 g.$('review-list').children[0].click();assert.equal(g.said.at(-1).lang,mode==='addition'?'fr-CA':'zh-CN');
 const reloaded=createMath(mode,{store:g.store});assert.equal(reloaded.context.KrisI18n.language,'fr');noChinese(reloaded);
}
console.log('PASS: actual shared i18n runtime and both math wrappers; all visible/accessibility/metadata states localize; wrong choices, typed input, counted groups, hint, score and review survive repeated switches; French speech and shared reload preference verified.');
