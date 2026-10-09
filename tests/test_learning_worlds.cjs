/* Real seven-page handlers; deterministic clock and DOM model, no browser claims. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {create,noChineseUI}=require('./test_legacy_learning_i18n_dom.cjs');
const plain=v=>JSON.parse(JSON.stringify(v));
function languages(g, snapshot){const before=plain(snapshot());for(const lang of ['en','fr','zh']){g.language(lang);assert.deepEqual(plain(snapshot()),before);if(lang!=='zh')noChineseUI(g);}}
// Counting: every amount 1–10 appears exactly once; marks and score cannot duplicate.
{
 const g=create('games/math1.html',{seed:381}),counts=[];
 assert(g.all('.number,.shape').every(b=>b.tagName==='BUTTON'));
 const first=g.$('.shape');g.click('.shape');g.click('.shape');assert.equal(g.run('gameState.marked'),1);
 languages(g,()=>g.run('gameState'));
 for(let i=0;i<10;i++){
  counts.push(g.run('gameState.currentCount'));
  assert.equal(g.all('.shape').length,counts[i]);
  g.run('checkAnswer(gameState.currentCount);checkAnswer(gameState.currentCount)');
  assert.equal(g.run('gameState.score'),i+1);
  g.advance(100000);assert.equal(g.run('gameState.round'),i+1);
  g.click('#count-next');
 }
 assert.deepEqual(counts.sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9,10]);
 assert.match(g.$('#message').textContent,/花园完成/);assert.equal(g.run('gameState.playing'),false);
 g.click('#count-restart');assert.equal(g.run('gameState.score'),0);first.click();assert.equal(g.run('gameState.marked'),0,'Detached counting objects have no effect');
}
// Both arithmetic editions: eight alternating +/− questions, including 0–20,
// real quantity graphics, harmless reminders, stateful themes and final restart.
for(const file of ['games/math_addition_subtraction.html','games/math_visual_game.html']){
 const g=create(file,{seed:9951}),snap=()=>g.context.KrisLearningMath.snapshot();
 assert.equal(snap().timed,false);g.click('#start-game');g.advance(90000);assert.equal(snap().answered,false);
 g.click('#timer-mode');g.advance(10100);assert(g.all('.answer-options button').every(b=>!b.disabled));assert.equal(snap().score,0);
 languages(g,snap);
 if(file.includes('visual')){
  const state=plain(snap());g.click('#theme-chicks');assert.deepEqual(plain(snap().currentProblem),state.currentProblem);assert.equal(snap().score,state.score);
  for(const theme of ['matchsticks','chicks'])for(let n=0;n<=20;n++){
   const html=g.context.KrisLearningMath.quantity(n,theme);
   assert.equal((html.match(/class="quantity-item/g)||[]).length,n||1,`${theme} ${n} visual count`);
   assert(!/\[火柴棒|\[小鸡/.test(html));
  }
  g.click('#theme-matchsticks');
 }
 for(let i=0;i<8;i++){
  const p=snap().currentProblem;assert.equal(p.operator,i%2===0?'+':'−');
  assert.equal(p.correctAnswer,p.operator==='+'?p.num1+p.num2:p.num1-p.num2);assert(p.correctAnswer>=0&&p.correctAnswer<=20);
  const buttons=g.all('.answer-options button');assert.equal(new Set(buttons.map(b=>b.textContent)).size,3);
  const b=buttons.find(b=>Number(b.textContent)===p.correctAnswer);b.click();b.click();assert.equal(snap().score,i+1);
  assert.equal(g.$('#math-tools').hidden,false);assert.equal(g.$('.number-line .landing').textContent,String(p.correctAnswer));
  languages(g,snap);g.click('#next-question');
 }
 assert.equal(snap().gameActive,false);assert.match(g.$('#feedback-message').textContent,/8 \/ 8/);g.click('#start-game');assert.equal(snap().score,0);assert.equal(snap().round,0);
}
// Every picture refers to authored local art; each choice locks once; every
// prompt, reading, result and restart remains under manual learner control.
{
 const g=create('games/chinese_character_quiz.html',{seed:743}),questions=plain(g.run('questions'));
 assert.equal(questions.length,6);
 const stale=g.$('#options-container button');
 for(let i=0;i<questions.length;i++){
  const q=questions[i];assert(fs.readFileSync(path.resolve(__dirname,'../games',q.image),'utf8').includes('<svg'));
  assert.equal(new Set(q.options).size,4);assert(q.options.includes(q.correctAnswer));
  g.run('selectAnswer(questions[currentQuestionIndex].correctAnswer);selectAnswer(questions[currentQuestionIndex].correctAnswer)');
  assert.equal(g.run('score'),i+1);assert.match(g.$('#picture-reading').textContent,new RegExp(q.correctAnswer));
  languages(g,()=>g.run('({currentQuestionIndex,score,pictureAnswered})'));
  g.advance(50000);assert.equal(g.run('currentQuestionIndex'),i);g.click('#picture-next');
 }
 assert.match(g.$('#feedback-message').textContent,/6 \/ 6/);g.click('#options-container button');stale.click();assert.equal(g.run('pictureAnswered'),false,'Old picture choices cannot answer a new campaign');
}
// All memory sizes: each character has exactly one picture, hidden faces are
// inaccessible, mismatches auto-return and cancelled timers cannot erase a
// new board. All20 original concepts and illustrations remain reachable.
{
 const g=create('games/chinese_game1.html',{seed:36});
 for(const size of [6,12,20]){
  if(size!==6)g.click('#pairs-'+size);
  const cards=g.all('.card');assert.equal(cards.length,size*2);assert(cards.every(c=>c.tagName==='BUTTON'));
  assert(cards.every(c=>c.querySelector('.card-front').getAttribute('aria-hidden')==='true'));
  const a=cards[0],b=cards.find(c=>c.dataset.id!==a.dataset.id);a.click();b.click();
  const ids=cards.map(c=>c.dataset.id);languages(g,()=>g.all('.card').map(c=>[c.dataset.id,c.className]));
  g.advance(999);assert.equal(g.all('.card.flipped').length,2);g.advance(1);assert.equal(g.all('.card.flipped').length,0);
  a.click();b.click();g.click('#restart-button');g.click('.card');g.advance(2000);assert.equal(g.all('.card.flipped').length,1,'Old mismatch cannot reset new flipped state');
  g.click('#restart-button');
  for(const id of new Set(g.all('.card').map(c=>c.dataset.id))){const pair=g.all('.card').filter(c=>c.dataset.id===id);assert.equal(pair.length,2);assert.notEqual(pair[0].dataset.type,pair[1].dataset.type);pair.forEach(c=>c.click());g.advance(220);}
  assert.equal(g.$('#score').textContent,String(size*10));assert.equal(g.all('#memory-collection span').length,size);
  for(const img of g.all('.card img'))assert(fs.existsSync(path.resolve(__dirname,'../games',img.getAttribute('src'))));
  assert.equal(g.document.activeElement,g.$('#play-again-button'));
 }
}
function subset(values,target){for(let mask=1;mask<1<<values.length;mask++){let sum=0;const selected=[];for(let i=0;i<values.length;i++)if(mask>>i&1){sum+=values[i];selected.push(i);}if(sum===target)return selected;}return null;}
// The known all2s/target3 failure is covered by a seed sweep, independent
// subset-sum oracle, native tap solutions, undo and completed-mode switches.
{
 const g=create('shape_sorter_math.html',{seed:1937});
 for(let n=0;n<1000;n++){g.click('#reset-button');const state=plain(g.run('({target:targetSum,values:draggableShapes.map(s=>Number(s.dataset.value))})'));assert(subset(state.values,state.target),'Solvable addition round '+n);}
 for(const mode of ['addition','subtraction']){
  if(mode==='subtraction')g.click('#subtraction-mode-btn');else g.click('#reset-button');
  const selector=mode==='addition'?'#shapes-area .shape':'#sorting-machine .shape',buttons=g.all(selector);assert(buttons.every(b=>b.tagName==='BUTTON'));
  const sumName=mode==='addition'?'currentSumInMachineAddition':'currentSumSubtraction',before=g.run(sumName);
  const target=g.run('targetSum'),values=buttons.map(b=>Number(b.dataset.value));
  const moves=subset(values,mode==='addition'?target:before-target);assert(moves);
  buttons[moves[0]].click();const changed=g.run(sumName);assert.notEqual(changed,before);
  if(!g.run('shapeSolved')){g.click('#undo-shape');assert.equal(g.run(sumName),before);buttons[moves[0]].click();}
  for(const i of moves.slice(1))buttons[i].click();assert.equal(g.run('shapeSolved'),true);assert.equal(g.run(sumName),target);
  const stamps=g.run('shapeStamps');buttons[moves[0]].click();assert.equal(g.run('shapeStamps'),stamps);
  languages(g,()=>g.run('({currentGameMode,targetSum,currentSumInMachineAddition,currentSumSubtraction,shapeStamps})'));
  g.advance(100000);assert.equal(g.run('shapeSolved'),true,'Solved robot waits for Next');
  g.click(mode==='addition'?'#subtraction-mode-btn':'#addition-mode-btn');const state=plain(g.run('({currentGameMode,targetSum,shapeVersion})'));g.advance(3000);assert.deepEqual(plain(g.run('({currentGameMode,targetSum,shapeVersion})')),state);
 }
}
// Passport's retry loop contains only wrong/skipped words and works in both
// shared500 and original15 modes without changing the canonical bank.
for(const missingBank of [false,true]){
 const g=create('vocabulary_quiz.html',{seed:971,missingBank});
 const first=plain(g.run('roundWords'));
 for(let i=0;i<15;i++){
  if(i%3===0){const answer=g.run('correctAnswer');g.all('#options button').find(b=>b.dataset.answer===answer).click();g.click('#check-answer');}
  g.click('#next-word');
 }
 assert.equal(g.$('#review-words').hidden,false);assert.equal(g.run('missedWords.length'),10);assert.equal(g.all('#word-passport .earned').length,5);
 g.click('#review-words');assert.equal(g.run('roundWords.length'),10);assert.equal(g.run('correctCount'),0);languages(g,()=>g.run('({roundWords,currentWordIndex,correctCount})'));
 const expected=first.filter((_,i)=>i%3!==0);assert.deepEqual(plain(g.run('roundWords')),expected);
 for(let i=0;i<10;i++){const answer=g.run('correctAnswer');g.all('#options button').find(b=>b.dataset.answer===answer).click();g.click('#check-answer');g.click('#next-word');}
 assert.equal(g.$('#review-words').hidden,true);assert.equal(g.run('correctCount'),10);assert.equal(g.run('missedWords.length'),0);
}
const css=fs.readFileSync(path.join(__dirname,'../assets/learning-worlds.css'),'utf8');
for(const rule of ['min-height:44px','focus-visible','prefers-reduced-motion','max-width:360px','repeat(auto-fit,minmax(70px,1fr))'])assert(css.includes(rule));
console.log('PASS learning worlds: all seven campaigns, every mode, local pictures, nonpunitive reminders, manual progress, native controls, stale locks,1000 solvable robots, trilingual state and targeted vocabulary replay. DOM/static checks only.');
