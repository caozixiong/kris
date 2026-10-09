/* Small, pure learning rules shared by the three zero-beginner Mandarin games. */
(function (root) {
  'use strict';
  function shuffle(items, random = Math.random) { const a = [...items]; for (let i=a.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  const chunks = (items, size) => Array.from({length:Math.ceil(items.length/size)},(_,i)=>items.slice(i*size,(i+1)*size));
  function lessons(bank, scope='first', theme='all', size=4) {
    let entries=scope==='first'?bank.entries.slice(0,20):bank.entries;
    if(theme!=='all')entries=entries.filter(e=>e.theme===theme);
    return chunks(entries,size===6?6:4);
  }
  function builderTargets(bank) {
    const singles = new Map(bank.entries.filter(e=>Array.from(e.hanzi).length===1).map(e=>[e.hanzi,e]));
    const supplied=Array.isArray(bank.buildingTargets)?bank.buildingTargets:bank.entries;
    return supplied.filter(e=>Array.from(e.hanzi).length===2).map(e=>({...e,parts:Array.from(e.hanzi)})).filter(e=>e.parts.every(p=>singles.has(p))).map((e,i)=>({...e,id:e.id||'build-'+i,components:e.parts.map(p=>singles.get(p))}));
  }
  function builderLessons(bank,scope='first',theme='all') {
    const first=new Set(bank.entries.slice(0,20).map(e=>e.id));
    let targets=builderTargets(bank);
    if(scope==='first')targets=targets.filter(e=>e.components.every(p=>first.has(p.id)));
    if(theme!=='all')targets=targets.filter(e=>e.theme===theme||e.components.some(p=>p.theme===theme));
    return chunks(targets,2);
  }
  function createStudy(entries,random=Math.random) {
    const items=[...entries];
    return {mode:'first',entries:items,phase:'study',studyIndex:0,seen:items.length?[items[0].id]:[],question:0,questions:items.map((e,i)=>({id:e.id,choices:shuffle([e.id,items[(i+1)%items.length].id].filter((id,j,a)=>a.indexOf(id)===j),random)})),selected:null,feedback:'',hint:false};
  }
  function preview(s, direction) {
    if(s.mode!=='first'||s.phase!=='study')return false;
    const index=s.studyIndex+direction;if(!Number.isInteger(index)||index<0||index>=s.entries.length)return false;
    s.studyIndex=index;if(!s.seen.includes(s.entries[index].id))s.seen.push(s.entries[index].id);return true;
  }
  function createMatch(entries,random=Math.random) {return {mode:'match',entries:[...entries],phase:'study',left:shuffle(entries.map(e=>e.id),random),right:shuffle(entries.map(e=>e.id),random),matched:[],selected:null,attempt:null,feedback:'',hint:false};}
  function createBuilder(targets,random=Math.random) {return {mode:'builder',entries:[...targets],phase:'study',question:0,picks:[],tiles:shuffle([0,1],random),introduced:[],feedback:'',hint:false};}
  function begin(s) {
    if(s.phase!=='study'||!s.entries.length)return false;
    if(s.mode==='first'&&s.seen.length!==s.entries.length)return false;
    if(s.mode==='builder')for(const e of s.entries[s.question].components)if(!s.introduced.includes(e.id))s.introduced.push(e.id);
    s.phase='active';s.feedback='';return true;
  }
  function answer(s,id) {
    if(s.mode!=='first'||s.phase!=='active'||!s.questions[s.question].choices.includes(id))return 'ignored';
    s.selected=id;s.feedback=id===s.questions[s.question].id?'correct':'retry';
    if(s.feedback==='correct')s.phase='answered';return s.feedback;
  }
  function chooseMatch(s,side,id) {
    if(s.mode!=='match'||s.phase!=='active'||!['left','right'].includes(side)||!s.entries.some(e=>e.id===id)||s.matched.includes(id))return 'ignored';
    if(!s.selected||s.selected.side===side){s.selected=s.selected?.id===id&&s.selected?.side===side?null:{side,id};s.feedback='';return 'selected';}
    s.attempt=[s.selected,{side,id}];
    if(s.selected.id===id){s.matched.push(id);s.selected=null;s.feedback='correct';s.hint=false;if(s.matched.length===s.entries.length)s.phase='complete';return 'correct';}
    s.phase='retry';s.feedback='retry';return 'retry';
  }
  function retry(s) {if(s.mode!=='match'||s.phase!=='retry')return false;s.phase='active';s.selected=null;s.attempt=null;s.feedback='';return true;}
  function chooseTile(s,index) {
    if(s.mode!=='builder'||s.phase!=='active'||![0,1].includes(index)||s.picks.includes(index))return 'ignored';
    const target=s.entries[s.question];
    if(!target.components.every(e=>s.introduced.includes(e.id)))return 'ignored';
    if(target.parts[index]!==target.parts[s.picks.length]){s.feedback='retry';s.hint=true;return 'retry';}
    s.picks.push(index);s.feedback='correct';if(s.picks.length===2)s.phase='answered';return 'correct';
  }
  function next(s,random=Math.random) {
    if(s.phase!=='answered'||!['first','builder'].includes(s.mode))return false;
    if(s.question+1===s.entries.length){s.phase='complete';return true;}
    s.question++;s.selected=null;s.feedback='';s.hint=false;
    if(s.mode==='builder'){s.phase='study';s.picks=[];s.tiles=shuffle([0,1],random);}else s.phase='active';return true;
  }
  function readProgress(storage,key,bank) {
    const empty={version:1,known:[],lessons:[]};
    try {const raw=JSON.parse(storage.getItem(key));if(!raw||raw.version!==1)return empty;const ids=new Set(bank.entries.map(e=>e.id));return {version:1,known:Array.isArray(raw.known)?[...new Set(raw.known.filter(id=>ids.has(id)))]:[],lessons:Array.isArray(raw.lessons)?[...new Set(raw.lessons.filter(id=>typeof id==='string'&&/^((first|match|builder)\|)[a-zA-Z0-9_|:,.-]{1,500}$/.test(id)))].slice(-1000):[]};}catch(_){return empty;}
  }
  function record(progress,key,entries) {if(!progress.lessons.includes(key))progress.lessons.push(key);for(const e of entries)if(!progress.known.includes(e.id))progress.known.push(e.id);}
  const core={shuffle,chunks,lessons,builderTargets,builderLessons,createStudy,preview,createMatch,createBuilder,begin,answer,chooseMatch,retry,chooseTile,next,readProgress,record};
  if(typeof module!=='undefined'&&module.exports)module.exports=core;else root.KrisChineseCore=core;
})(typeof window!=='undefined'?window:globalThis);
