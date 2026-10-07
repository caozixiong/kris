'use strict';
const assert=require('node:assert/strict'),D=require('../assets/quest-data.js'),C=require('../assets/quest-core.js');
const operation=(n,[sign,v])=>({'+':()=>n+v,'−':()=>n-v,'×':()=>n*v,'÷':()=>n/v})[sign]();
function permutations(items,length){if(!length)return [[]];return items.flatMap((x,i)=>permutations(items.filter((_,j)=>i!==j),length-1).map(rest=>[x,...rest]));}
const solutions=[];
for(const [i,l]of D.math.entries()){
 assert(Number.isInteger(l.start)&&l.start>=0&&Number.isInteger(l.target)&&l.target>=0);
 assert(l.steps<=l.ops.length&&l.steps>0);
 for(const [sign,value]of l.ops){assert(['+','−','×','÷'].includes(sign));assert(Number.isInteger(value)&&value>0);}
 const valid=[];
 for(const picks of permutations(l.ops.map((_,j)=>j),l.steps)){
  let n=l.start;const results=picks.map(id=>(n=operation(n,l.ops[id]))),expected=results.every(x=>Number.isInteger(x)&&x>=0)&&n===l.target;
  assert.equal(C.mathCorrect(l,picks),expected,`math ${i+1}, route ${picks}`);assert.deepEqual(C.route(l,picks),[l.start,...results]);if(expected)valid.push(picks);
 }
 assert(valid.length>0,`math ${i+1} must be solvable`);solutions.push(valid[0]);
 assert.equal(C.mathCorrect(l,[]),false);assert.equal(C.mathCorrect(l,valid[0].slice(1)),false);assert.equal(C.mathCorrect(l,[...valid[0],0]),false);
 for(const value of [-1,l.ops.length,1.5,NaN,'0'])assert.equal(C.mathCorrect(l,[value,...valid[0].slice(1)]),false);
 assert.equal(C.mathCorrect(l,Array(l.steps).fill(0)),false,'cannot reuse modules');
}
assert.equal(C.mathCorrect({start:1,target:1,steps:2,ops:[['÷',2],['×',2]]},[0,1]),false,'fractional intermediate cannot be hidden');
assert.equal(C.mathCorrect({start:1,target:1,steps:2,ops:[['−',2],['+',2]]},[0,1]),false,'negative intermediate cannot be hidden');
for(const l of D.english){assert.equal(C.sentenceCorrect(l.words,l.words),true);assert.equal(C.sentenceCorrect(l.words,l.words.map(w=>w.toUpperCase())),true);assert.equal(C.sentenceCorrect(l.words,l.words.slice(1)),false);assert.equal(C.sentenceCorrect(l.words,[...l.words,'extra']),false);assert.equal(C.sentenceCorrect(l.words,[...l.words].reverse()),false);assert(/^[A-Z]/.test(l.words[0]));assert(l.words.every(w=>!/[.?!]/.test(w)));}
assert.equal(C.sentenceCorrect(['café'],['cafe\u0301']),true,'NFC normalization');
const bridge=D.english[3];assert.equal(C.sentenceCorrect(bridge.words,[bridge.words[4],...bridge.words.slice(1,4),bridge.words[0],bridge.words[5]]),true,'capitalization-equivalent repeated word remains usable');
assert.equal(C.sentenceCorrect(['the','the','key'],['the','key','key']),false,'duplicates retain multiplicity');
assert.equal(new Set(D.products.map(p=>p.id)).size,D.products.length);
for(const l of D.french){assert(Object.entries(l.want).every(([id,n])=>D.products.some(p=>p.id===id)&&Number.isInteger(n)&&n>0&&n<=5));assert.equal(C.cartCorrect(l.want,l.want),true);assert.equal(C.cartCorrect(l.want,{}),false);assert.equal(C.cartCorrect(l.want,{...l.want,unexpected:1}),false);assert.equal(C.cartCorrect(l.want,{...l.want,unused:0}),true);const id=Object.keys(l.want)[0];assert.equal(C.cartCorrect(l.want,{...l.want,[id]:l.want[id]+1}),false);assert.equal(C.cartCorrect(l.want,{...l.want,[id]:l.want[id]-1}),false);}
let matrix=0;
for(const l of D.science){let possible=0;for(const m of D.materials)for(const closed of [false,true])for(const prediction of [false,true]){const expected=(l.anyConductor?m.conducts:m.id===l.material)&&closed===l.closed&&prediction===(m.conducts&&closed);assert.equal(C.scienceCorrect(l,m,closed,prediction),expected);assert.equal(C.lampOn(m,closed),m.conducts&&closed);matrix++;if(expected)possible++;}assert(possible>0);assert.equal(C.scienceCorrect(l,null,l.closed,false),false);assert.equal(C.scienceCorrect(l,D.materials[0],l.closed,null),false);}
for(const [value,want]of [[null,[]],['invalid',[]],['{}',[]],['null',[]],['[1,1,0,-1,8,1.5,"2",null,7]',[1,0,7]]])assert.deepEqual(C.readProgress({getItem:()=>value},'key',8),want);
assert.deepEqual(C.readProgress({getItem(){throw Error('denied');}},'key',8),[]);assert.deepEqual(C.readProgress(null,'key',8),[]);
const initial=[1,2,3,4,5],shuffled=C.shuffle(initial,()=>0);assert.deepEqual(initial,[1,2,3,4,5]);assert.deepEqual([...shuffled].sort(),initial);assert.notDeepEqual(shuffled,initial);
for(const kind of ['math','english','french','science']){assert.equal(D[kind].length,8);assert.equal(new Set(D[kind].map(l=>l.name)).size,8);for(const l of D[kind])assert(l.hint&&(l.note||l.lesson));}
console.log(`PASS: all 32 missions solvable; every math module permutation; nonnegative integer intermediate guards; unique/exact steps; capitalization and duplicate words; exact carts/caps; ${matrix} material/switch/prediction cases; corrupt/denied storage; nonmutating shuffle.`);
module.exports={solutions,permutations,operation};
