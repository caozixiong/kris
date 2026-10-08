/* Exercises current production homepage HTML/script using the DOM adapter.
 * Tests both fetch-success enhancement and original embedded fallback. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{makeDOM,ROOT}=require('./quest-dom.cjs');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'),source=fs.readFileSync(path.join(ROOT,'script.js'),'utf8'),directory=fs.readFileSync(path.join(ROOT,'content.md'),'utf8');
async function load(mode, hash = ''){
 const document=makeDOM(html),destinations=[],requests=[],listeners={},history=[];
 const fetch=url=>{requests.push(url);if(mode==='offline')return Promise.reject(Error('offline'));if(mode==='bad')return Promise.resolve({ok:true,text:async()=>'<p>unreadable</p>'});if(mode==='http')return Promise.resolve({ok:false,status:500});return Promise.resolve({ok:true,text:async()=>directory});};
 const context={document,console,fetch,window:{location:{hash,assign:url=>destinations.push(url)},addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn)}};context.window.history={pushState(_state,_title,hash){history.push(hash);context.window.location.hash=hash;}};vm.runInNewContext(source,context);await new Promise(resolve=>setImmediate(resolve));
 const $=s=>document.querySelector(s),all=s=>document.querySelectorAll(s),cards=()=>all('#resource-grid .resource-card'),visible=()=>cards().filter(c=>!c.hidden),select=kind=>$(`[data-filter="${kind}"]`).click(),search=text=>{ $('#resource-search').value=text;$('#resource-search').dispatch('input');};
 return {document,$,all,cards,visible,select,search,requests,destinations,history,hash(value){context.window.location.hash=value;for(const fn of listeners.hashchange||[])fn();}};
}
(async()=>{
 for(const mode of ['success','offline','bad','http']){
  const g=await load(mode);assert.equal(g.requests.length,1);assert.equal(g.$('#game-count').textContent,'23');assert.equal(g.all('#game-grid [data-game]').length,23);assert.equal(g.cards().length,19);assert.equal(g.all('#family-grid .resource-card').length,3);assert.equal(g.visible().length,6);assert.equal(g.$('#resource-toolbar').hidden,false);
  const gameVisible=()=>g.all('#game-grid [data-game]').filter(c=>!c.hidden);
  const gameSearch=text=>{g.$('#game-search').value=text;g.$('#game-search').dispatch('input');};
  assert.equal(g.$('#game-toolbar').hidden,false);
  assert.deepEqual(gameVisible().slice(0,3).map(c=>c.getAttribute('href')),['./games/bilingual-memory.html','./games/word-bridge.html','./games/sentence-match.html']);
  for (const term of ['anglais','français','francais','English','FRENCH','双语']) {gameSearch(term);assert.equal(gameVisible().length,3,term);}
  for (const [term,id] of [['memory','bilingual-memory'],['memoire','bilingual-memory'],['bridge','word-bridge'],['pont des mots','word-bridge'],['sentence','sentence-match'],['paires de phrases','sentence-match']]) {gameSearch(term);assert.deepEqual(gameVisible().map(c=>c.getAttribute('href')),[`./games/${id}.html`],term);}
  gameSearch('not-a-word-xxxxx');assert.equal(gameVisible().length,0);assert.match(g.$('#game-results-status').textContent,/没有找到/);
  g.$('#clear-game-search').click();assert.equal(gameVisible().length,23);assert.equal(g.document.activeElement,g.$('#game-search'));assert.equal(g.$('#clear-game-search').hidden,true);
  assert.equal(g.all('#game-categories [data-game-category]').length,4);
  const expected={math:['math-orbit','shape_sorter_math','addition_game','multiplication_game','math_addition_subtraction','math_visual_game','math1','math234','math567','math8','math9','math10','math_chinese','math_english'],chinese:['chinese_character_quiz','chinese_game1'],english:['bilingual-memory','word-bridge','sentence-match','vocabulary_quiz','english-ruins'],french:['bilingual-memory','word-bridge','sentence-match','vocabulary_quiz','french-market']};
  const ids=()=>gameVisible().map(c=>path.basename(c.getAttribute('href'),'.html')).sort();
  for(const [category, entries] of Object.entries(expected)) {
   const button=g.$(`[data-game-category="${category}"]`);button.click();button.click();
   assert.deepEqual(ids(),entries.slice().sort(),`${mode}/${category} complete subject inventory`);
   assert.equal(g.all('[data-game-category]').filter(c=>c.getAttribute('aria-current')==='true').length,1);
   assert.equal(button.getAttribute('aria-current'),'true');assert.equal(g.document.activeElement,g.$('#game-list-title'));
   assert.equal(g.history.at(-1),`#games-${category}`);assert.equal(g.history.filter(h=>h===`#games-${category}`).length,1,'repeated selection adds no duplicate history');assert.equal(button.getAttribute('href'),`#games-${category}`);assert.equal(button.getAttribute('aria-controls'),'game-grid');
   assert.equal(g.visible().length,6,'game category does not change resources');
   for(let i=0;i<10;i++)g.$('#surprise-button').click();
   assert(g.destinations.splice(0).every(url=>entries.includes(path.basename(url,'.html'))),'surprise respects chosen subject');
  }
  assert.equal(g.$('.science-bonus a').getAttribute('href'),'./games/circuit-lab.html');
  assert(!ids().includes('circuit-lab'),'science is not misclassified as French');
  gameSearch('memory');assert.deepEqual(ids(),['bilingual-memory']);
  g.$('[data-game-category="math"]').click();assert.equal(gameVisible().length,0);assert.equal(g.$('#game-empty-state').hidden,false);assert.equal(g.$('#surprise-button').disabled,true);
  g.$('#surprise-button').click();assert.equal(g.destinations.length,0,'empty results never navigate');
  g.$('#clear-game-search').click();assert.equal(gameVisible().length,14,'clear search retains Math');
  gameSearch('not-a-word');g.$('#reset-game-filters').click();assert.equal(gameVisible().length,23);assert.equal(g.$('#game-search').value,'');
  assert.equal(g.$('#surprise-button').disabled,false);assert.equal(g.$('#game-empty-state').hidden,true);
  g.hash('#games-chinese');assert.deepEqual(ids(),expected.chinese.slice().sort());
  g.hash('#games-french');assert.deepEqual(ids(),expected.french.slice().sort());
  g.hash('#games-chinese');assert.deepEqual(ids(),expected.chinese.slice().sort(),'Back restores the earlier subject');
  g.hash('#games-missing');assert.deepEqual(ids(),expected.chinese.slice().sort(),'unknown category cannot corrupt the filter');
  g.hash('#games');assert.equal(gameVisible().length,23);
  g.$('#show-more').click();assert.equal(g.visible().length,19);assert.equal(g.$('#show-more').getAttribute('aria-expanded'),'true');g.$('#show-more').click();assert.equal(g.visible().length,6);
  for(const [category,count]of [['games',5],['reading',6],['science',6],['tools',2]]){g.select(category);assert.equal(g.visible().length,count);assert.equal(g.all('[data-filter]').filter(x=>x.getAttribute('aria-pressed')==='true').length,1);}
  g.select('all');g.search('nasa');assert.equal(g.visible().length,1);g.search('NASA');assert.equal(g.visible().length,1);g.select('reading');assert.equal(g.visible().length,0);assert.equal(g.$('#empty-state').hidden,false);g.$('#reset-filters').click();assert.equal(g.visible().length,6);assert.equal(g.$('#resource-search').value,'');assert.equal(g.document.activeElement,g.$('[data-filter="all"]'));
  g.search('洪恩');assert.equal(g.visible().length,1);g.$('#clear-search').click();assert.equal(g.visible().length,6);assert.equal(g.document.activeElement,g.$('#resource-search'));assert.equal(g.$('#clear-search').hidden,true);
  for(let i=0;i<100;i++)g.$('#surprise-button').click();const games=g.all('#game-grid [data-game]').map(x=>x.getAttribute('href'));assert.equal(g.destinations.length,100);assert(g.destinations.every(url=>games.includes(url)));
  for(const file of ['math-orbit','english-ruins','french-market','circuit-lab','bilingual-memory','word-bridge','sentence-match'])assert(games.includes(`./games/${file}.html`));assert.equal(new Set(games).size,23);
  for(const a of [...g.cards(),...g.all('#family-grid .resource-card')]){assert.equal(a.getAttribute('target'),'_blank');assert.equal(a.getAttribute('rel'),'noopener noreferrer');}
  if(mode==='success')assert(g.$('#content-status').hidden);else{assert.equal(g.$('#content-status').hidden,false);assert(g.$('#content-status').textContent.includes('已显示现有内容'));}
 }
 const deep=await load('success','#games-french');assert.equal(deep.all('#game-grid [data-game]').filter(c=>!c.hidden).length,5,'URL selection survives delayed catalog load');
 const offlineDeep=await load('offline','#games-math');assert.equal(offlineDeep.all('#game-grid [data-game]').filter(c=>!c.hidden).length,14,'URL selection works offline');
 const noScript=makeDOM(html);assert.equal(noScript.querySelectorAll('#game-grid [data-game]').filter(c=>!c.hidden).length,23,'no-JS fallback exposes every game');
 const helpers=source.slice(source.indexOf('  const localURL'),source.indexOf('  function createGame'));
 const parse=input=>vm.runInNewContext(`${helpers};parseDirectory(input)`,{input});
 const parsed=parse(directory);assert.equal(parsed.length,45);assert.equal(parsed.filter(e=>e.url.startsWith('./')).length,23);assert.equal(parsed.filter(e=>e.subgroup).length,9);assert.equal(parse(directory+'\n* [Unsafe](javascript:alert(1)) - block\n* [Unsafe2](data:text/html,test) - block').length,45);assert.throws(()=>parse('unreadable'));
 console.log('PASS: production homepage actual markup and handlers; success/offline/malformed/HTTP failure modes; all 45 entries/23 game links; search, categories, expand/reset/focus, external-link safety and random navigation; original fallback survives all failures. DOM adapter only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
