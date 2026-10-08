/* Runs production catalogs and all quest handlers; no real-browser/layout claim. */
'use strict';
const assert=require('node:assert/strict'),D=require('../assets/quest-data.js');
const {createQuest}=require('./quest-dom.cjs');
const {solutions}=require('./test_quest_core.cjs');
function untranslated(g){
 const found=[];
 function walk(node){
  if(node.nodeType===3){if(/[\u3400-\u9fff]/u.test(node.textContent))found.push(node.textContent.trim());return;}
  if(['SCRIPT','STYLE','NOSCRIPT'].includes(node.tagName)||node.hasAttribute('data-i18n-skip'))return;
  for(const name of ['title','aria-label','placeholder','alt','content']){const value=node.getAttribute(name);if(value&&/[\u3400-\u9fff]/u.test(value))found.push(`${name}: ${value}`);}
  node.childNodes.forEach(walk);
 }
 walk(g.document.documentElement);return found;
}
function localized(g,language){g.context.KrisI18n.setLanguage(language);assert.deepEqual(untranslated(g),[],`${g.kind}/${language}: untranslated UI`);assert.equal(g.document.documentElement.lang,language==='fr'?'fr-CA':'en');}
function solve(g,i){const l=D[g.kind][i];
 if(g.kind==='math')solutions[i].forEach(id=>g.click('op',id));
 if(g.kind==='english')l.words.forEach((_,id)=>g.click('word',id));
 if(g.kind==='french')for(const[id,n]of Object.entries(l.want))for(let j=0;j<n;j++)g.click('plus',id);
 if(g.kind==='science'){const mat=D.materials.find(m=>m.id===l.material||(l.anyConductor&&m.conducts));g.click('material',mat.id);if(l.closed)g.click('switch');g.click('predict',mat.conducts&&l.closed?'yes':'no');}
 g.click('check');assert(g.$('.feedback.success'));
}
for(const kind of ['math','english','french','science']){
 const g=createQuest(kind);localized(g,'en');localized(g,'fr');
 for(let i=0;i<8;i++){
  g.click('level',i);g.click('hint');
  localized(g,'en');localized(g,'fr');g.click('check');localized(g,'en');localized(g,'fr');
  assert(!g.$('#hint-text').hidden);
  solve(g,i);const completed=g.$('.passport strong').textContent;
  const feedbackNode=g.$('.feedback p');const announcement=g.$('#quest-announcement');
  localized(g,'en');assert.equal(g.$('.feedback p'),feedbackNode,'language switch preserves live DOM/game state');assert.equal(announcement.textContent,feedbackNode.textContent,'live feedback uses the selected language');
  localized(g,'fr');assert.equal(g.$('.passport strong').textContent,completed);assert(g.$('.feedback.success'));assert.equal(announcement.textContent,feedbackNode.textContent);
 }
 g.click('next');assert(g.$('.finish-panel'));localized(g,'en');localized(g,'fr');
 const resumed=createQuest(kind,{store:g.store});assert.equal(resumed.context.KrisI18n.language,'fr');assert.equal(resumed.$('.passport strong').textContent,'8 / 8');assert.deepEqual(untranslated(resumed),[]);
}
{
 const g=createQuest('math');g.click('op',0);g.click('hint');g.click('check');const before=g.$('.planet-number strong').textContent;
 localized(g,'fr');assert.equal(g.$('.planet-number strong').textContent,before);assert.equal(g.all('.route-step').length,1);assert(g.$('.feedback.try-again'));assert.equal(g.$('#hint-text').hidden,false);
 g.click('op',1);g.click('check');assert(g.$('.feedback.success'));
}
{
 const g=createQuest('english');g.click('word',2);g.click('hint');localized(g,'en');localized(g,'fr');assert.deepEqual(g.all('.word.placed').map(b=>b.textContent),['can']);
 g.click('word',0);g.click('word',1);g.click('word',3);g.click('check');localized(g,'en');localized(g,'fr');assert(g.$('.feedback.try-again'));
 g.click('reset');[0,1,3,2].forEach(id=>g.click('word',id));g.click('check');localized(g,'en');localized(g,'fr');
}
{
 const g=createQuest('french');g.click('plus','apple-green');g.click('gloss');g.click('hint');g.click('check');localized(g,'en');localized(g,'fr');assert.equal(g.all('output')[1].textContent,'1');assert.equal(g.all('.translation-note').length,6);assert(g.$('.feedback.try-again'));
 assert.equal(g.$('.market-order p').textContent,D.french[0].order);assert.deepEqual(g.all('.product-name').map(x=>x.textContent),D.products.map(x=>x.name));
 g.click('plus','apple-green');g.click('check');localized(g,'en');localized(g,'fr');
}
{
 const g=createQuest('science');g.click('material','copper');g.click('switch');g.click('predict','no');g.click('check');localized(g,'en');localized(g,'fr');assert(g.$('.circuit-scene.is-lit'));assert(g.button('material','copper').classList.contains('selected'));assert(g.button('predict','no').classList.contains('selected'));assert(g.$('.feedback.try-again'));
 g.click('material','plastic');g.click('check');localized(g,'en');localized(g,'fr');g.click('switch');g.click('check');localized(g,'en');localized(g,'fr');
}
for(const kind of ['math','english','french','science']){const g=createQuest(kind,{deniedGetter:true});localized(g,'en');localized(g,'fr');}
console.log('PASS: all 32 missions, hints, names, help, metadata, accessibility labels, success and failure feedback in English/French; preserved in-flight choices, carts, glossary, hints, observations, live regions, stamps and final badges; target English/French unchanged; shared saved language and denied-storage fallback.');
