/* Production-handler checks for the four mechanic-specific adventure upgrades.
 * The DOM adapter does not establish pixel layout or real-device behavior. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createQuest}=require('./quest-dom.cjs');
const D=require('../assets/quest-data.js');
const C=require('../assets/quest-core.js');
const stampCount=g=>Number(g.$('.passport strong').textContent.split('/')[0]);
const setLanguage=(g,lang)=>g.context.KrisI18n.setLanguage(lang);
const profile=g=>({stamps:stampCount(g),energy:g.$('.planet-number strong')?.textContent,placed:g.all('.word.placed').map(n=>n.textContent),basket:g.all('.basket-label').map(n=>n.textContent),observations:g.$('.notebook-toggle strong')?.textContent});
function allTranslated(g){
  const chinese=[];
  function visit(n){
    if(n.nodeType===3){if(/[\u3400-\u9fff]/u.test(n.textContent))chinese.push(n.textContent);return;}
    if(['SCRIPT','STYLE','NOSCRIPT'].includes(n.tagName)||n.hasAttribute('data-i18n-skip'))return;
    for(const attr of ['aria-label','title','alt'])if(/[\u3400-\u9fff]/u.test(n.getAttribute(attr)||''))chinese.push(n.getAttribute(attr));
    n.childNodes.forEach(visit);
  }
  visit(g.document.body);assert.deepEqual(chinese,[]);
}
function cycleLanguages(g){const before=profile(g);for(const language of ['en','fr','zh']){setLanguage(g,language);assert.deepEqual(profile(g),before,'language switching preserves gameplay and evidence');if(language!=='zh')allTranslated(g);}}
{
  const g=createQuest('math');
  assert.equal(g.$('.flight-console strong').textContent,'0 / 2');
  assert(g.button('rewind',0).disabled);
  g.click('op',0);g.click('op',1);
  assert.equal(g.$('.flight-console strong').textContent,'2 / 2');
  assert.equal(g.all('.fuel-cells .used').length,2);
  assert.equal(g.$('.flight-console').textContent.includes('目标能量已匹配'),true);
  assert.equal(stampCount(g),0,'reaching energy does not replace the required check');
  assert.equal(g.$('.is-docked'),null);
  cycleLanguages(g);
  const stale=g.button('rewind',0);
  g.click('rewind',1);
  assert.equal(g.$('.planet-number strong').textContent,'7');
  assert.equal(g.all('.route-step').length,1);
  assert(g.button('op',0).disabled);assert(!g.button('op',1).disabled);
  assert.equal(g.document.activeElement,g.button('check'));
  stale.click();assert.equal(g.$('.planet-number strong').textContent,'7','detached rewind cannot erase newer route');
  g.click('rewind',0);assert.equal(g.$('.planet-number strong').textContent,'3');
  assert.equal(g.all('.route-step').length,0);
  g.click('op',0);g.click('op',1);g.click('check');assert(g.$('.space-window.is-docked'));
  assert(g.all('[data-act="rewind"]').every(b=>b.disabled));assert.equal(stampCount(g),1);
  cycleLanguages(g);g.click('retry');assert.equal(g.$('.is-docked'),null);
  g.click('level',2);[0,1,2].forEach(id=>g.click('op',id));g.click('rewind',1);
  assert.equal(g.$('.planet-number strong').textContent,'10');assert.equal(g.all('.route-step').length,1);
  assert(!g.button('op',1).disabled);assert(!g.button('op',2).disabled,'rewind releases every later module');
  g.click('op',3);assert.equal(g.$('.planet-number strong').textContent,'5');
}
{
  assert.equal(C.sentencePrefix(['The','key'],['the','key']),2);
  assert.equal(C.sentencePrefix(['The','key'],['key','the']),0);
  const g=createQuest('english');assert.equal(g.all('.relic-token.collected').length,0);
  [0,1,3,2].forEach(id=>g.click('word',id));assert.equal(g.all('.rune.confirmed').length,0,'no hidden answer checks while arranging');
  g.click('check');assert.equal(g.all('.rune.confirmed').length,2);assert.equal(g.all('.rune.revisit').length,1);
  assert.equal(g.all('.word-confirmed').length,2);assert.equal(g.$('.word-revisit').textContent,'jump');
  cycleLanguages(g);
  g.click('return',2);assert.equal(g.all('.rune.confirmed').length,0);assert.equal(g.all('.rune.revisit').length,0,'editing invalidates positional feedback');
  g.click('word',3);g.click('check');assert(g.$('.feedback.success'));
  assert.equal(g.all('.rune.confirmed').length,4);assert.equal(g.all('.relic-token.collected').length,1);
  assert.equal(g.$('.ruin-relic').textContent,'🤖','the solved door reveals the level artifact');
  assert(g.$('.ruin-scene.relic-found'));cycleLanguages(g);
  g.click('retry');assert.equal(g.all('.relic-token.collected').length,1,'replaying keeps the relic collection');
  [0,1,2,3].forEach(id=>g.click('word',id));g.click('check');assert.equal(g.all('.relic-token.collected').length,1);
  const resumed=createQuest('english',{store:g.store});assert.equal(resumed.all('.relic-token.collected').length,1);
  for(let i=1;i<8;i++){g.click('level',i);D.english[i].words.forEach((_,id)=>g.click('word',id));g.click('check');assert.equal(g.all('.relic-token.collected').length,i+1);}
  g.click('next');assert(g.$('.finish-panel'));assert.equal(stampCount(g),8);
}
{
  const frenchNumbers=['','', 'deux','trois','quatre','cinq'];
  const g=createQuest('french');assert(g.$('.empty-basket'));
  for(const product of D.products){
    g.click('reset');
    for(let quantity=1;quantity<=5;quantity++){
      g.click('plus',product.id);
      const expected=quantity===1?`${product.gender} ${product.name}`:`${frenchNumbers[quantity]} ${product.plural}`;
      assert.equal(g.$('.basket-label').textContent,expected);
      assert.equal(g.$('.basket-label').lang,'fr');
      assert.equal(g.$('.basket-picture').textContent,product.icon.repeat(quantity));
      cycleLanguages(g);
    }
    assert(g.button('plus',product.id).disabled);
    const stale=g.button('unpack',product.id);g.click('unpack',product.id);stale.click();
    assert.equal(g.$('.basket-label').textContent,`quatre ${product.plural}`,'detached basket control cannot remove again');
    for(let n=0;n<4;n++)g.click('unpack',product.id);
    assert(g.$('.empty-basket'));assert.equal(g.document.activeElement,g.button('plus',product.id));
  }
  g.click('plus','apple-green');g.click('check');assert.equal(stampCount(g),0,'visible basket does not weaken color checking');
  g.click('unpack','apple-green');g.click('plus','apple-red');g.click('check');assert(g.$('.packing-basket.delivered'));
  assert.equal(g.$('.order-sign').textContent,'MERCI !');assert(g.button('unpack','apple-red').disabled);cycleLanguages(g);
  g.click('level',7);for(const [id,n]of Object.entries(D.french[7].want))for(let j=0;j<n;j++)g.click('plus',id);
  assert.equal(g.all('.basket-item').length,2);assert.deepEqual(g.all('.basket-label').map(x=>x.textContent),['deux livres rouges','quatre crayons bleus']);
  g.click('check');assert(g.$('.feedback.success'),'six-item final delivery is unchanged');
}
{
  const g=createQuest('science');
  assert.equal(g.$('.notebook-toggle strong').textContent,'0 / 12');
  assert(g.$('#notebook-results').hidden);const staleNotebook=g.button('notebook');g.click('notebook');assert(!g.$('#notebook-results').hidden);assert.equal(g.document.activeElement,g.button('notebook'));staleNotebook.click();assert(!g.$('#notebook-results').hidden,'detached notebook control cannot toggle new state');
  assert.equal(g.all('.notebook-cell').length,12);assert.equal(g.all('.notebook-cell.observed').length,0);
  g.click('material','copper');g.click('switch');g.click('check');assert.equal(g.all('.notebook-cell.observed').length,0,'no observation without a prediction');
  assert(g.$('.circuit-readout').textContent.includes('先预测'));
  g.click('predict','no');g.click('check');assert(g.$('.circuit-scene.is-lit'));
  assert.equal(g.all('.notebook-cell.observed').length,1);assert.equal(g.all('.notebook-cell.lit').length,1);assert.equal(stampCount(g),0,'truthful observations do not grant a mission for wrong prediction');
  g.click('check');assert.equal(g.all('.notebook-cell.observed').length,1,'repeating a test cannot inflate notebook coverage');
  cycleLanguages(g);assert.equal(g.button('notebook').getAttribute('aria-expanded'),'true');
  g.click('material','plastic');assert.equal(g.$('.circuit-scene.is-lit'),null);assert.equal(g.all('.notebook-cell.observed').length,1,'configuration clears current observation, not past evidence');
  g.click('check');assert.equal(g.all('.notebook-cell.observed').length,2);assert(g.$('.circuit-readout').textContent.includes('材料处不导电'));
  g.click('switch');g.click('check');assert(g.$('.circuit-readout').textContent.includes('开关处断开'));
  for(const mat of D.materials)for(const closed of [false,true]){
    g.click('level',0);g.click('material',mat.id);if(closed)g.click('switch');g.click('predict',mat.conducts&&closed?'yes':'no');g.click('check');
  }
  assert.equal(g.$('.notebook-toggle strong').textContent,'12 / 12');assert.equal(g.all('.notebook-cell.observed').length,12);
  assert.equal(g.all('.notebook-cell.lit').length,3,'only three closed conductor circuits light');
  assert.equal(stampCount(g),1,'all twelve experiments only solve the requested copper mission');
  cycleLanguages(g);g.click('level',0);g.click('material','copper');g.click('switch');g.click('predict','yes');g.click('check');g.click('retry');assert.equal(g.all('.notebook-cell.observed').length,12);
  const resumed=createQuest('science',{store:g.store});assert.equal(resumed.$('.notebook-toggle strong').textContent,'0 / 12','session-only evidence accurately clears on reload');assert.equal(stampCount(resumed),1);
}
for(const kind of ['math','english','french','science']){
  const g=createQuest(kind,{deniedGetter:true});cycleLanguages(g);
  if(kind==='french'){g.click('plus','pencil-blue');g.click('unpack','pencil-blue');assert(g.$('.empty-basket'));}
  if(kind==='science'){g.click('material','copper');g.click('predict','no');g.click('check');assert.equal(g.$('.notebook-toggle strong').textContent,'1 / 12');}
  for(const b of g.all('#quest-app button')){assert.equal(b.getAttribute('type'),'button');assert(b.getAttribute('aria-label')||b.textContent.trim());}
}
const css=fs.readFileSync(path.join(__dirname,'../assets/quest.css'),'utf8');
for(const name of ['.route-node','.unpack-button','.notebook-toggle']){const block=css.match(new RegExp(name.replace('.','\\.')+'\\{([^}]+)\\}'))?.[1];assert(block,`${name} has style rules`);assert(/min-height:(44|48|50)px/.test(block),`${name} has a 44px or larger touch target`);}
assert.match(css,/@media\(prefers-reduced-motion:no-preference\)\{\.is-docked/,'all new animations are opt-in for motion');
assert.match(css,/@media\(max-width:600px\)[\s\S]*notebook-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(css,/button:focus-visible/);
console.log('PASS: four distinct adventure upgrades; route rewinds and stale controls; rune/prefix feedback and persistent 8-relic collection; all 30 French quantity forms, basket removal, color checking and six-item delivery; 12 truthful unique circuit experiments, navigation/reload boundaries, language/state preservation, storage denial, static touch/focus/reduced-motion rules. DOM-model checks only.');
