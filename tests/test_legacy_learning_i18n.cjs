/* Browser regression tests for the seven original learning games.
 * Run: node tests/test_legacy_learning_i18n.cjs
 * Requires Playwright and Chromium. No third-party requests are made.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const pages = [
  'games/math1.html', 'games/math_addition_subtraction.html',
  'games/math_visual_game.html', 'games/chinese_character_quiz.html',
  'games/chinese_game1.html', 'shape_sorter_math.html', 'vocabulary_quiz.html'
];
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end();
  }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html; charset=utf-8');
  res.end(fs.readFileSync(file));
});
let browser;
async function language(page, lang) {
  await page.evaluate(value => window.KrisI18n.setLanguage(value), lang);
  await page.evaluate(() => Promise.resolve());
}
async function text(page, selector) { return page.locator(selector).textContent(); }
async function noChineseUI(page) {
  const remaining = await page.evaluate(() => {
    const texts = [], walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (n.parentElement.closest('script,style,[translate="no"],[data-i18n-skip],[data-no-i18n],kris-reviews,noscript')) continue;
      if (/[\u3400-\u9fff]/.test(n.nodeValue)) texts.push(n.nodeValue.trim());
    }
    return texts;
  });
  assert.deepEqual(remaining, [], 'All interface text must follow the chosen language');
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  for (const file of pages) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/assets/reviews/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.route('https://**', route => route.abort());
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.goto(base + file + '?lang=zh');
    assert.equal(await page.locator('#kris-language-bar').count(), 1, `${file}: exactly one shared switch`);
    const initialTitle = await page.title();
    await language(page, 'en');
    assert.notEqual(await page.title(), initialTitle, `${file}: English title`);
    await noChineseUI(page);
    await language(page, 'fr');
    await noChineseUI(page);
    assert.equal(await page.locator('[data-site-language="fr"]').getAttribute('aria-pressed'), 'true');
    await language(page, 'zh');
    assert.equal(await page.title(), initialTitle, `${file}: Chinese title restored`);

    if (file.endsWith('/math1.html')) {
      const initial = await page.evaluate(() => ({ count: gameState.currentCount, shapes: shapesContainer.innerHTML, timer: gameState.timerValue }));
      await language(page, 'fr');
      assert.deepEqual(await page.evaluate(() => ({ count: gameState.currentCount, shapes: shapesContainer.innerHTML, timer: gameState.timerValue })), initial);
      await page.evaluate(() => checkAnswer((gameState.currentCount + 1) % 11));
      assert.match(await text(page, '#message'), /Pas tout à fait/);
      await language(page, 'en');
      assert.match(await text(page, '#message'), /Not quite/);
      await language(page, 'zh');
      assert.match(await text(page, '#message'), /答错了/);
      await page.clock.runFor(2100);
      await page.locator('#count-next').click();
      await page.evaluate(() => checkAnswer(gameState.currentCount));
      await language(page, 'fr');
      assert.equal(await text(page, '#message'), 'Bonne réponse !');
      assert.equal(await text(page, '#score'), '1');
    }
    if (file.includes('math_addition_subtraction') || file.includes('math_visual_game')) {
      await page.locator('#start-game').click();
      const initial = { problem: await text(page, '#problem-display'), answers: await page.locator('.answer-options button').allTextContents(), score: await text(page, '#score'), time: await text(page, '#time-left') };
      await language(page, 'fr');
      assert.deepEqual(await page.locator('.answer-options button').allTextContents(), initial.answers);
      assert.equal(await text(page, '#time-left'), initial.time);
      assert.equal(await text(page, '#score'), initial.score);
      if (file.includes('math_addition_subtraction')) assert.equal(await text(page, '#problem-display'), initial.problem);
      await page.locator('#ans1').click();
      assert.match(await text(page, '#feedback-message'), /Bonne réponse|Mauvaise réponse/);
      await language(page, 'en');
      assert.match(await text(page, '#feedback-message'), /Correct|Incorrect/);
      await page.locator('#next-question').click();
      await page.clock.runFor(10100);
      assert.equal(await text(page, '#feedback-message'), '');
      await page.locator('#timer-mode').click(); await page.clock.runFor(10100);
      assert.match(await text(page, '#feedback-message'), /Take your time/);
      await language(page, 'fr');
      assert.match(await text(page, '#feedback-message'), /Prends ton temps/);
      if (file.includes('math_visual_game')) {
        await page.locator('#theme-chicks').click();
        await noChineseUI(page);
        await page.locator('#theme-matchsticks').click();
        await noChineseUI(page);
      }
    }
    if (file.includes('chinese_character_quiz')) {
      assert.equal(await page.locator('.beginner-word-card').count(), 4);
      assert.equal(await page.locator('#picture-study').isVisible(), true);
      const options = await page.locator('#options-container button').allTextContents();
      await language(page, 'fr');
      assert.deepEqual(await page.locator('#options-container button').allTextContents(), options);
      await page.locator('#picture-start').click();
      await page.evaluate(() => selectAnswer(questions[0].options[1]));
      assert.equal(await text(page, '#feedback-message'), 'Presque ! Regarde la carte du mot et réessaie.');
      assert.equal(await page.locator('#picture-next').isVisible(), false);
      await page.evaluate(() => selectAnswer(questions[0].correctAnswer));
      assert.equal(await text(page, '#feedback-message'), 'Bravo !');
      await language(page, 'en');
      assert.equal(await text(page, '#score-display'), 'Score: 1');
      await page.locator('#picture-review').click(); await page.locator('#picture-start').click();
      assert.equal(await page.evaluate(() => score), 1);
      await page.clock.runFor(1500);
      assert.equal(await page.evaluate(() => currentQuestionIndex), 0);
      await page.locator('#picture-next').click();
      for (let i = 1; i < 4; i++) {
        await page.evaluate(() => selectAnswer(questions[currentQuestionIndex].correctAnswer));
        await page.locator('#picture-next').click();
      }
      assert.equal(await text(page, '#feedback-message'), 'Game over! Your total score: 4 / 4');
      await language(page, 'fr');
      assert.equal(await text(page, '#feedback-message'), 'Partie terminée ! Ton score : 4 / 4');
      await page.locator('#options-container button').click();
      assert.equal(await text(page, '#score-display'), 'Score : 0');
      assert.equal(await page.locator('#picture-study').isVisible(), true);
    }
    if (file.includes('chinese_game1')) {
      assert.equal(await page.locator('.card').count(), 8);
      assert.equal(await page.locator('#memory-study').isVisible(), true);
      await page.locator('#memory-start').click();
      const cardIds = await page.locator('.card').evaluateAll(cards => cards.map(c => c.dataset.id));
      await page.locator('.card').first().click();
      await language(page, 'fr');
      assert.deepEqual(await page.locator('.card').evaluateAll(cards => cards.map(c => c.dataset.id)), cardIds);
      assert.equal(await page.locator('.card.flipped').count(), 1);
      await page.locator('#memory-review').click(); await page.locator('#memory-start').click();
      assert.equal(await page.locator('.card.flipped').count(), 1);
      await page.locator('#restart-button').click();
      await page.locator('#pairs-20').click(); await page.locator('#memory-start').click();
      const ids = await page.locator('.card').evaluateAll(cards => [...new Set(cards.map(c => c.dataset.id))]);
      for (const id of ids) {
        await page.locator(`.card[data-id="${id}"]`).nth(0).click();
        await page.locator(`.card[data-id="${id}"]`).nth(1).click();
        await page.clock.runFor(220);
      }
      assert.equal(await text(page, '#score'), '200');
      assert.equal(await text(page, '#attempts'), '20');
      assert.equal(await text(page, '#final-attempts'), '20');
      await noChineseUI(page);
      await language(page, 'en');
      assert.match(await text(page, '#win-message'), /You found every pair/);
      assert.equal(await page.locator('.matched').count(), 40);
    }
    if (file === 'shape_sorter_math.html') {
      assert.equal(await page.locator('#current-sum-display-addition').count(), 1);
      await page.evaluate(() => {
        const shape = draggableShapes[0];
        handleDropAddition({ preventDefault() {}, dataTransfer: { getData: () => shape.id } });
      });
      const state = await page.evaluate(() => ({ target: targetSum, sum: currentSumInMachineAddition, ids: draggableShapes.map(s => s.id) }));
      await language(page, 'fr');
      assert.equal(await text(page, '#current-sum-display-addition'), `Somme : ${state.sum}`);
      assert.deepEqual(await page.evaluate(() => ({ target: targetSum, sum: currentSumInMachineAddition, ids: draggableShapes.map(s => s.id) })), state);
      await page.locator('#subtraction-mode-btn').click();
      const subtraction = await page.evaluate(() => ({ target: targetSum, sum: currentSumSubtraction, ids: shapesInMachineSubtraction.map(s => s.id) }));
      await language(page, 'en');
      assert.equal(await text(page, '#target-label'), 'Target to reach');
      assert.deepEqual(await page.evaluate(() => ({ target: targetSum, sum: currentSumSubtraction, ids: shapesInMachineSubtraction.map(s => s.id) })), subtraction);
      await page.locator('#sorting-machine .shape').first().click();
      await language(page, 'fr');
      await noChineseUI(page);
      await page.locator('#addition-mode-btn').click();
      assert.equal(await text(page, '#current-sum-display-addition'), 'Somme : 0');
      await page.locator('#reset-button').click();
      assert.equal(await page.locator('#current-sum-display-addition').count(), 1);
    }
    if (file === 'vocabulary_quiz.html') {
      await page.locator('#mode-definition').click();
      await language(page, 'fr');
      await page.locator('.action-buttons button').first().click();
      assert.equal(await text(page, '#message'), 'Choisis une réponse.');
      await page.locator('#options button').filter({ hasText: 'A round fruit with red or green skin.' }).click();
      const selected = await text(page, '#options .selected');
      await language(page, 'zh');
      assert.equal(await text(page, '#word'), 'Apple');
      assert.equal(await text(page, '#options .selected'), selected);
      await page.locator('.action-buttons button').first().click();
      assert.equal(await text(page, '#message'), '正确！');
      await language(page, 'en');
      assert.equal(await text(page, '#message'), 'Correct!');
      for (let i = 0; i < 15; i++) await page.locator('#next-word').click();
      assert.equal(await text(page, '#word'), 'Quiz finished!');
      await language(page, 'fr');
      assert.equal(await text(page, '#word'), 'Quiz terminé !');
      assert.equal(await text(page, '#next-word'), 'Recommencer le quiz');
      await page.locator('#next-word').click();
      assert.equal(await text(page, '#word'), 'Apple', 'Restart must not depend on translated label');
      await page.locator('#options button').filter({ hasText: 'A yellow, long fruit' }).click();
      await page.locator('.action-buttons button').first().click();
      assert.equal(await text(page, '#message'), 'Mauvaise réponse. La bonne réponse était : « A round fruit with red or green skin. »');
    }
    assert.deepEqual(errors, [], `${file}: no JavaScript errors`);
    console.log(`PASS ${file}: three languages, live feedback and state preservation`);
    await page.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
});
