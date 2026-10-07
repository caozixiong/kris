/* Exercises current production homepage HTML/script using the DOM adapter.
 * Tests both fetch-success enhancement and original embedded fallback. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{makeDOM,ROOT}=require('./quest-dom.cjs');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'),source=fs.readFileSync(path.join(ROOT,'script.js'),'utf8'),directory=fs.readFileSync(path.join(ROOT,'content.md'),'utf8');
async function load(mode){
 const document=makeDOM(html),destinations=[],requests=[];
 const fetch=url=>{requests.push(url);if(mode==='offline')return Promise.reject(Error('offline'));if(mode==='bad')return Promise.resolve({ok:true,text:async()=>'<p>unreadable</p>'});if(mode==='http')return Promise.resolve({ok:false,status:500});return Promise.resolve({ok:true,text:async()=>directory});};
 const context={document,console,fetch,window:{location:{assign:url=>destinations.push(url)}}};vm.runInNewContext(source,context);await new Promise(resolve=>setImmediate(resolve));
 const $=s=>document.querySelector(s),all=s=>document.querySelectorAll(s),cards=()=>all('#resource-grid .resource-card'),visible=()=>cards().filter(c=>!c.hidden),select=kind=>$(`[data-filter="${kind}"]`).click(),search=text=>{ $('#resource-search').value=text;$('#resource-search').dispatch('input');};
 return {document,$,all,cards,visible,select,search,requests,destinations};
}
(async()=>{
 for(const mode of ['success','offline','bad','http']){
  const g=await load(mode);assert.equal(g.requests.length,1);assert.equal(g.$('#game-count').textContent,'11');assert.equal(g.all('#game-grid [data-game]').length,11);assert.equal(g.cards().length,19);assert.equal(g.all('#family-grid .resource-card').length,3);assert.equal(g.visible().length,6);assert.equal(g.$('#resource-toolbar').hidden,false);
  g.$('#show-more').click();assert.equal(g.visible().length,19);assert.equal(g.$('#show-more').getAttribute('aria-expanded'),'true');g.$('#show-more').click();assert.equal(g.visible().length,6);
  for(const [category,count]of [['games',5],['reading',6],['science',6],['tools',2]]){g.select(category);assert.equal(g.visible().length,count);assert.equal(g.all('[data-filter]').filter(x=>x.getAttribute('aria-pressed')==='true').length,1);}
  g.select('all');g.search('nasa');assert.equal(g.visible().length,1);g.search('NASA');assert.equal(g.visible().length,1);g.select('reading');assert.equal(g.visible().length,0);assert.equal(g.$('#empty-state').hidden,false);g.$('#reset-filters').click();assert.equal(g.visible().length,6);assert.equal(g.$('#resource-search').value,'');assert.equal(g.document.activeElement,g.$('[data-filter="all"]'));
  g.search('洪恩');assert.equal(g.visible().length,1);g.$('#clear-search').click();assert.equal(g.visible().length,6);assert.equal(g.document.activeElement,g.$('#resource-search'));assert.equal(g.$('#clear-search').hidden,true);
  for(let i=0;i<100;i++)g.$('#surprise-button').click();const games=g.all('#game-grid [data-game]').map(x=>x.getAttribute('href'));assert.equal(g.destinations.length,100);assert(g.destinations.every(url=>games.includes(url)));
  for(const file of ['math-orbit','english-ruins','french-market','circuit-lab'])assert(games.includes(`./games/${file}.html`));assert.equal(new Set(games).size,11);
  for(const a of [...g.cards(),...g.all('#family-grid .resource-card')]){assert.equal(a.getAttribute('target'),'_blank');assert.equal(a.getAttribute('rel'),'noopener noreferrer');}
  if(mode==='success')assert(g.$('#content-status').hidden);else{assert.equal(g.$('#content-status').hidden,false);assert(g.$('#content-status').textContent.includes('已显示现有内容'));}
 }
 const helpers=source.slice(source.indexOf('  const localURL'),source.indexOf('  function createGame'));
 const parse=input=>vm.runInNewContext(`${helpers};parseDirectory(input)`,{input});
 const parsed=parse(directory);assert.equal(parsed.length,33);assert.equal(parsed.filter(e=>e.url.startsWith('./')).length,11);assert.equal(parsed.filter(e=>e.subgroup).length,9);assert.equal(parse(directory+'\n* [Unsafe](javascript:alert(1)) - block\n* [Unsafe2](data:text/html,test) - block').length,33);assert.throws(()=>parse('unreadable'));
 console.log('PASS: production homepage actual markup and handlers; success/offline/malformed/HTTP failure modes; all 33 entries/11 game links; search, categories, expand/reset/focus, external-link safety and random navigation; original fallback survives all failures. DOM adapter only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
