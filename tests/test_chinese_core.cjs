'use strict';
const assert=require('node:assert/strict');
const C=require('../assets/chinese-core.js'),B=require('../assets/chinese-bank.js');
const copy=x=>JSON.parse(JSON.stringify(x)),snap=x=>JSON.stringify(x);
const initial=snap(B),allIds=B.entries.map(e=>e.id).sort();
for(const size of [4,6]){
 const all=C.lessons(B,'all','all',size);assert.deepEqual(all.flat().map(e=>e.id).sort(),allIds);assert(all.every(l=>l.length>0&&l.length<=size));
 assert.deepEqual(C.lessons(B,'first','all',size).flat().map(e=>e.id),B.entries.slice(0,20).map(e=>e.id));
 for(const theme of B.themes)assert.deepEqual(C.lessons(B,'all',theme.id,size).flat().map(e=>e.id),B.entries.filter(e=>e.theme===theme.id).map(e=>e.id));
}
// Every quiz previews its exact answer associations before it can begin.
for(const entries of C.lessons(B,'all')){
 const s=C.createStudy(entries,()=>.3);assert.equal(C.begin(s),false);assert.equal(C.answer(s,entries[0].id),'ignored');
 const bad=snap(s);assert.equal(C.preview(s,-1),false);assert.equal(C.preview(s,99),false);assert.equal(snap(s),bad);
 for(let i=1;i<entries.length;i++)assert(C.preview(s,1));assert(C.begin(s));assert.equal(C.begin(s),false);
 for(let i=0;i<entries.length;i++){
  const q=s.questions[s.question];assert.equal(q.choices.length,2);assert(q.choices.every(id=>entries.some(e=>e.id===id)));
  assert.equal(C.answer(s,'not-in-this-lesson'),'ignored');const wrong=q.choices.find(id=>id!==q.id);
  assert.equal(C.answer(s,wrong),'retry');assert.equal(s.phase,'active');assert.equal(s.selected,wrong);
  assert.equal(C.answer(s,q.id),'correct');const answered=snap(s);assert.equal(C.answer(s,wrong),'ignored');assert.equal(snap(s),answered);assert(C.next(s));
 }
 assert.equal(s.phase,'complete');assert.equal(C.next(s),false);
}
// Matching never guesses from an ambiguous emoji; identity is the bilingual meaning.
for(const count of [4,6])for(const entries of C.lessons(B,'all','all',count)){
 const s=C.createMatch(entries,()=>.3);assert.equal(C.chooseMatch(s,'left',entries[0].id),'ignored');assert(C.begin(s));
 assert.equal(C.chooseMatch(s,'left',entries[0].id),'selected');assert.equal(C.chooseMatch(s,'right',entries[1].id),'retry');
 assert.equal(s.phase,'retry');const paused=snap(s);assert.equal(C.chooseMatch(s,'right',entries[0].id),'ignored');assert.equal(snap(s),paused);assert(C.retry(s));
 for(const e of entries){assert.equal(C.chooseMatch(s,'right',e.id),'selected');assert.equal(C.chooseMatch(s,'left',e.id),'correct');assert.equal(C.chooseMatch(s,'left',e.id),'ignored');}
 assert.equal(s.phase,'complete');assert.equal(new Set(s.matched).size,entries.length);
}
const targets=C.builderTargets(B);assert(targets.length>=10);assert.deepEqual(targets.map(e=>e.hanzi),B.buildingTargets.map(e=>e.hanzi));
for(const lesson of C.builderLessons(B,'all')){
 assert(lesson.length<=2);assert(new Set(lesson.flatMap(e=>[e.id,...e.components.map(p=>p.id)])).size<=6);
 const s=C.createBuilder(lesson,()=>.2);
 for(const e of lesson){assert.equal(s.phase,'study');assert.equal(C.chooseTile(s,0),'ignored');assert(C.begin(s));assert(e.components.every(p=>s.introduced.includes(p.id)));
  if(e.parts[0]!==e.parts[1]){assert.equal(C.chooseTile(s,1),'retry');assert.equal(s.picks.length,0);}
  assert.equal(C.chooseTile(s,0),'correct');assert.equal(C.chooseTile(s,0),'ignored');assert.equal(C.chooseTile(s,1),'correct');assert.equal(s.phase,'answered');assert(C.next(s));
 }
 assert.equal(s.phase,'complete');
}
for(const e of C.builderLessons(B).flat())assert(e.components.every(p=>B.entries.slice(0,20).some(x=>x.id===p.id)));
// Repeated-character words still need two distinct physical tiles.
const twin={id:'twin',hanzi:'人人',parts:['人','人'],components:[B.entries[3],B.entries[3]]};
const tw=C.createBuilder([twin]);C.begin(tw);assert.equal(C.chooseTile(tw,1),'correct');assert.equal(C.chooseTile(tw,1),'ignored');assert.equal(C.chooseTile(tw,0),'correct');
// Storage is untrusted and can be blocked, corrupt or from an older version.
for(const value of [null,'bad','{}','[]','{"version":999}',JSON.stringify({version:1,known:'x',lessons:{}})])assert.deepEqual(C.readProgress({getItem:()=>value},'test',B),{version:1,known:[],lessons:[]});
assert.deepEqual(C.readProgress(null,'test',B),{version:1,known:[],lessons:[]});
assert.deepEqual(C.readProgress({getItem(){throw Error('denied');}},'test',B),{version:1,known:[],lessons:[]});
const p=C.readProgress({getItem:()=>JSON.stringify({version:1,known:['zh001','zh001','missing',null,12],lessons:['first|first|all|4|zh001','<script>','first|first|all|4|zh001']})},'test',B);
assert.deepEqual(p,{version:1,known:['zh001'],lessons:['first|first|all|4|zh001']});C.record(p,'first|first|all|4|zh001',[B.entries[0],B.entries[1]]);C.record(p,'first|first|all|4|zh001',[B.entries[0]]);assert.deepEqual(p.known,['zh001','zh002']);assert.equal(p.lessons.length,1);
assert.equal(snap(B),initial,'Curriculum must remain unchanged');
console.log('Chinese core: all 300 words, preview gates, retries, complete flows, safe builder components and resilient progress passed.');
