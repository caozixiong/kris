'use strict';
const assert=require('node:assert/strict'),D=require('../assets/quest-data.js'),{createQuest}=require('./quest-dom.cjs'),{solutions,permutations,operation}=require('./test_quest_core.cjs');
const count=g=>Number(g.$('.passport strong').textContent.split('/')[0]);
const title=g=>g.$('#mission-title')?.textContent;
const success=g=>Boolean(g.$('.feedback.success'));
const feed=g=>g.$('.feedback').textContent;
function solve(g,i){
 const l=D[g.kind][i];
 if(g.kind==='math')for(const id of solutions[i])g.click('op',id);
 if(g.kind==='english')for(let id=0;id<l.words.length;id++)g.click('word',id);
 if(g.kind==='french')for(const [id,n]of Object.entries(l.want))for(let j=0;j<n;j++)g.click('plus',id);
 if(g.kind==='science'){const mat=D.materials.find(m=>m.id===l.material||(l.anyConductor&&m.conducts));g.click('material',mat.id);if(l.closed)g.click('switch');g.click('predict',mat.conducts&&l.closed?'yes':'no');}
 g.click('check');assert(success(g),`${g.kind} ${i+1} should solve: ${feed(g)}`);
}
function complete(g){for(let i=0;i<8;i++){assert.equal(title(g),D[g.kind][i].name);solve(g,i);assert.equal(count(g),i+1);assert.equal(g.document.activeElement,g.button('next'));const next=g.button('next');g.click('next');if(i<7){assert.equal(title(g),D[g.kind][i+1].name);next.click();assert.equal(title(g),D[g.kind][i+1].name,'detached old Next cannot skip levels');}else assert(g.$('.finish-panel'));}assert.equal(count(g),8);}
for(const kind of ['math','english','french','science']){
 const g=createQuest(kind);assert.equal(count(g),0);assert.equal(g.all('[data-act="level"]').length,8);assert.equal(g.$('[aria-current="step"]').dataset.value,'0');assert.equal(g.$('#hint-text').hidden,true);g.click('hint');assert.equal(g.$('#hint-text').hidden,false);assert.equal(g.button('hint').getAttribute('aria-expanded'),'true');g.click('hint');assert.equal(g.$('#hint-text').hidden,true);
 const announcement=g.$('#quest-announcement');g.click('check');assert.equal(success(g),false);assert(g.$('.feedback.try-again'));assert.equal(g.$('#quest-announcement'),announcement,'live region node persists');assert(announcement.textContent.length>0);assert.equal(count(g),0);
 complete(g);assert.equal(g.writes.length,8);assert.equal(new Set(JSON.parse(g.store.get(g.key))).size,8);assert.equal(g.document.activeElement,g.button('replay'));
 g.click('replay');assert.equal(title(g),D[kind][0].name);assert.equal(count(g),8,'replay preserves earned local stamps');assert.equal(g.$('.finish-panel'),null);solve(g,0);assert.equal(g.writes.length,8,'replaying completion does not double-save/score');g.click('retry');assert.equal(title(g),D[kind][0].name);assert.equal(success(g),false);solve(g,0);assert.equal(g.writes.length,8);
 const resumed=createQuest(kind,{store:g.store});assert.equal(count(resumed),8);assert.equal(title(resumed),D[kind][0].name);assert.equal(resumed.all('.map-stop.complete').length,8);
 for(const opts of [{deniedGetter:true},{deniedRead:true,deniedWrite:true},{deniedWrite:true}]){const denied=createQuest(kind,opts);complete(denied);assert.equal(count(denied),8,'storage failure never blocks complete play');}
 const corrupt=createQuest(kind,{store:new Map([[g.key,'[0,0,7,-1,8,1.5,"3",null]']])});assert.equal(count(corrupt),2);assert.equal(corrupt.all('.map-stop.complete').length,2);
 const malformed=createQuest(kind,{store:new Map([[g.key,'bad json']])});assert.equal(count(malformed),0);solve(malformed,0);assert.deepEqual(JSON.parse(malformed.store.get(g.key)),[0]);
 const skip=createQuest(kind);skip.click('level',7);assert.equal(title(skip),D[kind][7].name);assert.equal(skip.document.activeElement,skip.$('#mission-title'));solve(skip,7);assert(skip.button('next').textContent.includes('未完成'));skip.click('next');assert.equal(title(skip),D[kind][0].name);assert.equal(skip.$('.finish-panel'),null,'last mission alone cannot earn final badge');
}
{
 const g=createQuest('math');g.click('op',0);assert.equal(g.$('.planet-number strong').textContent,'7');const duplicate=g.button('op',0);assert(duplicate.disabled);duplicate.click();assert.equal(g.all('.route-step').length,1);g.click('undo');assert.equal(g.all('.route-step').length,0);assert(g.button('undo').disabled);
 // Exercise a nested span target through the real delegated event listener.
 g.button('op',0).children[0].click();assert.equal(g.all('.route-step').length,1);g.click('reset');assert.equal(g.$('.planet-number strong').textContent,'3');assert.equal(g.document.activeElement,g.button('check'));
 g.click('op',1);g.click('op',0);assert(g.all('[data-act="op"]').every(b=>b.disabled));g.click('check');assert.equal(success(g),false);assert(feed(g).includes('目标'));g.click('undo');assert.equal(g.all('.route-step').length,1);g.click('reset');solve(g,0);assert(g.all('[data-act="op"]').every(b=>b.disabled));
 let guards=0;
 for(let i=0;i<D.math.length;i++){const l=D.math[i];for(let length=0;length<l.steps;length++)for(const prefix of permutations(l.ops.map((_,j)=>j),length)){let value=l.start;let valid=true;for(const id of prefix){value=operation(value,l.ops[id]);if(!Number.isInteger(value)||value<0)valid=false;}if(!valid)continue;for(let id=0;id<l.ops.length;id++){if(prefix.includes(id))continue;const n=operation(value,l.ops[id]);if(Number.isInteger(n)&&n>=0)continue;g.click('level',i);for(const p of prefix)g.click('op',p);g.click('op',id);assert.equal(g.all('.route-step').length,prefix.length);assert.equal(Number(g.$('.planet-number strong').textContent),value);assert(feed(g).includes('非负整数'));guards++;}}}
 assert(guards>0);console.log(`PASS: math UI blocks ${guards} reachable negative/fractional moves, reuse and extra steps; nested clicks, undo/reset/wrong-order retry.`);
}
{
 const g=createQuest('english');for(let i=0;i<8;i++){g.click('level',i);const l=D.english[i];assert.equal(new Set(g.all('[data-act="word"]').map(b=>b.dataset.value)).size,l.words.length);for(let id=l.words.length-1;id>=0;id--)g.click('word',id);assert.equal(g.all('.word.placed').length,l.words.length);assert(g.all('[data-act="word"]').every(b=>b.disabled));g.click('check');assert.equal(success(g),false);assert(feed(g).includes('位置'));g.click('return',1);assert.equal(g.all('.word.placed').length,l.words.length-1);assert.equal(g.all('[data-act="word"]').filter(b=>!b.disabled).length,1);g.click('undo');assert.equal(g.all('.word.placed').length,l.words.length-2);g.click('reset');assert.equal(g.all('.word.placed').length,0);solve(g,i);assert.equal(g.$('.sentence-slots b').textContent,l.punct||'.');}
 g.click('level',3);for(const id of [4,1,2,3,0,5])g.click('word',id);g.click('check');assert(success(g),'equivalent The/the tokens accepted');assert.deepEqual(g.all('.word.placed').map(b=>b.textContent),D.english[3].words,'winning display canonicalizes capitalization');assert(g.all('[data-act="return"]').every(b=>b.disabled));
 console.log('PASS: English real UI all 8 reversed/wrong sequences, return/undo/reset, shuffled unique tile identities, duplicate The/the and question punctuation.');
}
{
 const g=createQuest('french');for(let i=0;i<8;i++){g.click('level',i);const l=D.french[i],n=Object.values(l.want).reduce((a,b)=>a+b,0);const wrong=D.products.find(p=>!l.want[p.id]).id;for(let j=0;j<Math.min(n,5);j++)g.click('plus',wrong);if(n>5){const extra=D.products.find(p=>p.id!==wrong&&!l.want[p.id]).id;for(let j=0;j<n-5;j++)g.click('plus',extra);}g.click('check');assert.equal(success(g),false);assert(feed(g).includes('总数对了'));g.click('reset');solve(g,i);assert(g.all('.step-button').every(b=>b.disabled));}
 g.click('level',0);const id=D.products[0].id;assert(g.button('minus',id).disabled);g.click('minus',id);for(let i=0;i<8;i++)g.click('plus',id);assert.equal(g.all('output')[0].textContent,'5');assert(g.button('plus',id).disabled);for(let i=0;i<8;i++)g.click('minus',id);assert.equal(g.all('output')[0].textContent,'0');g.click('gloss');assert.equal(g.all('.translation-note').length,6);assert.equal(g.button('gloss').getAttribute('aria-pressed'),'true');g.click('gloss');assert.equal(g.all('.translation-note').length,0);g.click('reset');assert(g.all('output').every(e=>e.textContent==='0'));
 console.log('PASS: French all 8 exact carts and wrong-color same-total rejection, six products, 0–5 per-product limits, reset and live glossary.');
}
{
 const g=createQuest('science');g.click('check');assert(feed(g).includes('先选'));g.click('material','copper');g.click('check');assert(feed(g).includes('先预测'));assert.equal(g.$('.is-lit'),null);let n=0;
 for(let i=0;i<8;i++)for(const mat of D.materials)for(const closed of [false,true])for(const prediction of [false,true]){g.click('level',i);g.click('material',mat.id);if(closed)g.click('switch');g.click('predict',prediction?'yes':'no');assert(g.$('.svg-label').textContent);g.click('check');const l=D.science[i],lit=mat.conducts&&closed,expected=(l.anyConductor?mat.conducts:mat.id===l.material)&&closed===l.closed&&prediction===lit;assert.equal(success(g),expected,`science ${i+1} ${mat.id} closed=${closed} prediction=${prediction}`);assert.equal(Boolean(g.$('.circuit-scene.is-lit')),lit,'observation follows physics even on wrong setup');n++;}
 g.click('level',0);g.click('material','copper');g.click('switch');g.click('predict','no');g.click('check');assert.equal(success(g),false);assert(g.$('.circuit-scene.is-lit'));assert(feed(g).includes('调整你的预测'));g.click('predict','yes');g.click('check');assert(success(g),'wrong prediction can be corrected');
 g.click('retry');g.click('material','plastic');g.click('switch');g.click('predict','no');g.click('check');assert.equal(success(g),false);assert(feed(g).includes('要求的材料'));g.click('material','copper');assert(g.$('.circuit-scene').textContent.includes('等待观察'));assert.equal(g.$('.circuit-scene.is-lit'),null);g.click('predict','yes');g.click('check');assert(success(g));
 console.log(`PASS: science UI ${n} material/switch/prediction combinations, required inputs, truthful observations, changing configurations and retrying incorrect predictions.`);
}
console.log('PASS: 4 complete eight-level campaigns, once-only stamp persistence, replay/retry, map skip/return, stale Next clicks, restored/corrupt progress, and 12 full storage-denied campaigns. DOM adapter only; no real-browser/device QA.');
