/* Production UI mechanics, not browser rendering. */
'use strict';
const assert=require('node:assert/strict');
const {boot,plain}=require('./test_all_games_experience.cjs');
const snapshot=value=>JSON.stringify(value,(_key,val)=>val?.nodeType?{tag:val.tagName,text:val.textContent}:val);
let tests=0;
const test=(name,fn)=>{fn();tests++;console.log('PASS '+name);};
for(const page of ['math234','math567','math8','math9','math10','math_chinese','math_english'])test(page+' exploration panel, language stability and native choices',()=>{
 const g=boot(page);assert(g.$('.math-arcade'));assert.doesNotMatch(g.html,/<(?:script|link|img)\b[^>]*(?:src|href)="https?:/);
 const modes=g.all('button').filter(el=>/^select-game\d+$/.test(el.id));
 for(const selector of modes.length?modes:[null]) {
  selector?.click();g.refresh();
  const host=selector?g.$('#'+selector.id.replace('select-','')+'-host'):g.$('.arcade-host');
  const panel=host.querySelector('.math-arcade');assert(panel);
  const hint=panel.querySelector('.arcade-tool');hint.click();
  assert.equal(hint.getAttribute('aria-expanded'),'true');
  const model=panel.querySelector('.arcade-model');assert.equal(model.hidden,false);
  const before=model.textContent;
  for(const lang of ['en','fr','zh'])g.language(lang);
  assert.equal(model.textContent,before);
  const answerClasses=['.number-option','.game23-number-option','.potion-option','.choice-option','.jump-option','.option'];
  for(const cls of answerClasses)for(const button of host.querySelectorAll(cls))assert.equal(button.tagName,'BUTTON');
 }
});
for(const page of ['math_chinese','math_english'])test(page+' all ten mechanics earn one stamp, cancel callbacks and never time out',()=>{
 const g=boot(page),games=g.context.__legacy;
 for(let n=1;n<=10;n++){
  g.click('#select-game'+n);const game=games['game'+n],c=game.arcade;
  if(n>=9)game.startGame();
  const before=JSON.parse(snapshot(game.state)),score=game.state.score;
  if(n!==4){g.advance(61000);assert.equal(game.state.score,score,'no timeout score change '+n);assert.equal(game.state.currentCount,before.currentCount);}
  if(n===1)game.checkAnswer(game.state.currentCount);
  if(n===2||n===3){game.state.selectedNumbers=[game.state.count1,game.state.count2,game.state.sumCount];game.checkAnswer();}
  if(n===4){game.knockPins();game.checkAnswer(game.state.correctAnswer);}
  if(n===5){const answer=String(game.state.correctAnswer);game.checkAnswer(answer.includes('或')||answer.includes('or')?game.state.item1.name:game.state.correctAnswer);}
  if(n===6)game.handleAnswer(game.state.correctJumps);
  if(n===7){game.elements.answerInput.value=String(game.state.currentQuestion.answer);game.checkAnswer();game.checkAnswer();}
  if(n===8){game.checkAnswer(game.state.currentAnswer);game.checkAnswer(game.state.currentAnswer);}
  if(n>=9){const button=game.elements.answerButtons.find(b=>Number(b.textContent)===game.state.currentProblem.correctAnswer);game.checkAnswer(button);game.checkAnswer(button);}
  assert.equal(c.earned,1,'exactly one earned stamp '+n);
  const pending=[...g.timers.values()].filter(t=>c.pending.has(t.id));
  games.app.switchGame(n===1?'game2':'game1');const frozen=snapshot(game.state);
  g.advance(10000);assert.equal(snapshot(game.state),frozen,'inactive state remains frozen '+n);
  for(const task of pending)task.fn();assert.equal(snapshot(game.state),frozen,'stale callback is harmless '+n);
 }
});
test('potion respects missing position and exact drop quantities',()=>{
 const g=boot('math567');g.click('#select-game5');g.$('#game5-host .arcade-tool').click();
 for(let i=0;i<40;i++){
  g.run('game5.startGameCycle()');const s=g.run('game5.state');
  assert.equal(g.all('#game5-host .arcade-drop').length,s.total);
  assert.equal(g.all('#game5-host .arcade-drop.is-filled').length,s.missingPosition===0?s.val2:s.val1);
  assert.equal(s.val1+s.val2,s.total);
 }
});
test('bowling preview never uses fallen pins from a previous round',()=>{
 const g=boot('math234');g.click('#select-game4');g.$('#game4-host .arcade-tool').click();g.run('game4.knockPins();game4.setupRound()');
 assert.equal(g.all('#game4-host .arcade-token.is-removed').length,0);assert.match(g.$('#game4-host .arcade-equation').textContent,/− \? = \?/);
 assert.equal(g.$('#start-button').disabled,false);
});
test('jump simulator models every signed step without awarding a score',()=>{
 const g=boot('math567');g.click('#select-game6');g.$('#game6-host .arcade-tool').click();
 for(let round=0;round<20;round++){
  g.run('game6.startGameCycle()');const s=g.run('game6.state'),score=g.run('currentScore');
  for(let i=0;i<s.correctJumps;i++)g.$('#game6-host .arcade-jump').click();
  assert.equal(g.$('#game6-host .arcade-planet.is-current').textContent,'🛸 '+s.targetPos);
  assert(g.$('#game6-host .arcade-jump').disabled);assert.equal(g.run('currentScore'),score);
  g.language('fr');assert.equal(g.$('#game6-host .arcade-planet.is-current').textContent,'🛸 '+s.targetPos);
 }
});
test('standalone math8 awards once and resets exactly once after repeated Next',()=>{
 const g=boot('math8');g.run('handleAnswer({target:{dataset:{jumps:correctJumps}}});handleAnswer({target:{dataset:{jumps:correctJumps}}})');
 assert.equal(g.run('score'),1);assert.equal(g.run('arcade.earned'),1);
 g.click('#next-button');g.click('#next-button');g.advance(300);assert.equal(g.run('arcade.round'),2);
});
test('math9 rejects partial numeric input, repeat submits and stale game-over',()=>{
 const g=boot('math9');g.run("startGame('mixed')");
 for(const suffix of ['abc','.0','e0']){g.run('answerInput.value=String(gameState.currentQuestion.answer)+'+JSON.stringify(suffix)+';checkAnswer()');assert.equal(g.run('gameState.score'),0);}
 g.run('answerInput.value=String(gameState.currentQuestion.answer);checkAnswer();checkAnswer()');assert.equal(g.run('gameState.score'),20);
 g.run('generateQuestion();gameState.lives=1;answerInput.value=String(gameState.currentQuestion.answer+1);checkAnswer();startGame()');g.advance(3000);
 assert(g.$('#game-over-screen').classList.contains('hidden'));assert.equal(g.run('gameState.score'),0);
});
test('math10 manual Next cancels auto-next; old buttons cannot answer new rounds',()=>{
 const g=boot('math10');const old=g.all('#options .option').find(b=>Number(b.textContent)===g.run('gameState.currentAnswer'));
 old.click();const timer=[...g.timers.values()].find(t=>t.delay===1500);g.click('#next-btn');const before=g.run('JSON.stringify(gameState)');
 old.click();timer.fn();g.advance(2000);assert.equal(g.run('JSON.stringify(gameState)'),before);
 assert.equal(g.run('arcade.earned'),1);
});
test('every arithmetic model matches operands including zero and multiplication',()=>{
 const g=boot('math10');g.$('.arcade-tool').click();
 for(const [a,b,op,answer] of [[0,0,'+',0],[5,0,'×',0],[0,8,'×',0],[10,10,'×',100],[18,9,'-',9],[9,9,'+',18]]){
  g.run(`gameState.currentProblem={a:${a},b:${b},op:${JSON.stringify(op)}};gameState.currentAnswer=${answer};arcade.begin()`);
  assert.equal(g.all('.arcade-token').length,op==='×'?a*b:op==='-'?a:a+b);
  assert.equal(g.all('.arcade-token.is-removed').length,op==='-'?b:0);
 }
});
test('math9 all three modes and five-stamp city journeys keep exact arithmetic',()=>{
 const g=boot('math9');
 for(const mode of ['addition','subtraction','mixed']){
  g.run(`startGame('${mode}')`);
  for(let i=0;i<5;i++){
   const q=g.run('gameState.currentQuestion');assert.equal(q.answer,q.operation==='+'?q.num1+q.num2:q.num1-q.num2);
   if(mode!=='mixed')assert.equal(q.operation,mode==='addition'?'+':'-');
   g.run('answerInput.value=String(gameState.currentQuestion.answer);checkAnswer()');
   g.run('generateQuestion()');
  }
 }
 assert.equal(g.run('arcade.earned'),15);
 assert.equal(g.all('.arcade-stop.is-earned').length,5);
});
for(const page of ['math10','math_chinese','math_english'])test(page+' operation filters and visual theme switches retain exact questions',()=>{
 const g=boot(page);const collection=page!=='math10';
 if(collection)g.click('#select-game8');
 for(const [type,op]of [['addition','+'],['subtraction','-'],['multiplication','×']]){
  const prefix=collection?'#game8-':'#';
  for(const name of ['addition','subtraction','multiplication'])g.$(prefix+name).checked=name===type;
  if(collection)g.context.__legacy.game8.checkOperations();else g.run('checkOperations()');
  for(let i=0;i<12;i++){
   const game=collection?g.context.__legacy.game8:null;
   if(collection)game.updateProblem();else g.run('updateProblem()');
   const text=g.$(collection?'#game8-problem':'#problem').textContent;
   const match=text.match(/(\d+)\s*([+×−-])\s*(\d+)/);assert.equal(match[2],op);
   const [a,b]=[Number(match[1]),Number(match[3])];const answer=op==='+'?a+b:op==='-'?a-b:a*b;
   assert.equal(collection?game.state.currentAnswer:g.run('gameState.currentAnswer'),answer);
  }
 }
 if(collection){
  g.click('#select-game10');const game=g.context.__legacy.game10;game.startGame();game.arcade.revealed=true;game.arcade.render();
  const question=snapshot(game.state.currentProblem);
  for(const theme of ['chicks','matchsticks','chicks']){game.setTheme(theme);assert.equal(snapshot(game.state.currentProblem),question);}
  assert(g.$('#game10-host .arcade-model').textContent.includes('🐥'));
 }
});
test('hero page is fully local and every finite class has a local style',()=>{
 const fs=require('node:fs'),path=require('node:path');const root=path.join(__dirname,'..');
 const html=fs.readFileSync(path.join(root,'games/math9.html'),'utf8');const css=fs.readFileSync(path.join(root,'assets/legacy-math-hero.css'),'utf8');
 assert.doesNotMatch(html,/<(?:script|link|img)\b[^>]*(?:src|href)="https?:/);
 assert.doesNotMatch(html,/tailwind|picsum|font-awesome/);
 const classes=new Set([...html.matchAll(/class="([^"]*)"/g)].flatMap(match=>match[1].split(/\s+/)));
 for(const name of classes)assert(css.includes(`[class~="${name}"]`)||['container','hero-symbol','hero-mascot','card-hover'].includes(name),'missing local class '+name);
 assert.match(css,/\[class~="hidden"\]\{display:none!important/);assert.match(css,/@media\(min-width:768px\)/);assert.match(css,/@media\(max-width:520px\)/);
 const source=fs.readFileSync(path.join(root,'games/math567.html'),'utf8');assert.doesNotMatch(source,/transparenttextures/);
 const g=boot('math9');g.run('startGame();answerInput.value=String(gameState.currentQuestion.answer);checkAnswer()');g.advance(20);
 assert(!g.$('#correct-feedback').classList.contains('hidden'));g.click('#next-question');g.advance(300);assert(g.$('#correct-feedback').classList.contains('hidden'));
});
console.log(`${tests} legacy arcade checks passed. DOM-model checks only.`);
