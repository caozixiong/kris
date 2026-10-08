/* Actual vocabulary page and word-bank integration through the DOM adapter.
 * This verifies handlers, sampling, translations and focus; not browser layout.
 * Run: node tests/test_vocabulary_shared_bank.cjs
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { create, noChineseUI } = require('./test_legacy_learning_i18n_dom.cjs');
const plain = value => JSON.parse(JSON.stringify(value));
const normalize = value => value.normalize('NFC').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const g = create('vocabulary_quiz.html', { seed: 42017 });
const { $, all, run, click, language } = g;
const bank = g.context.KrisWordBank;
assert.equal(bank.words.length, 500, 'The quiz must use the real, complete shared bank');
assert.equal(run('quizMode'), 'translation', 'Shared English→French mode is the default');
assert.equal($('#mode-translation').getAttribute('aria-pressed'), 'true');
assert.equal($('#mode-definition').getAttribute('aria-pressed'), 'false');
assert.equal($('#bank-status').hidden, true);
assert.equal($('.home-link').getAttribute('href'), 'index.html');
assert.match($('#quiz-description').textContent, /500.*15/);
const firstRound = plain(run('roundWords.map(word => word.id)'));
assert.equal(firstRound.length, 15);
assert.equal(new Set(firstRound).size, 15);
assert(firstRound.every(id => bank.get(id)));
assert(new Set(firstRound.map(id => bank.get(id).theme)).size > 1, 'Default round mixes themes');
assert.equal($('#word').getAttribute('lang'), 'en');
assert(all('#options button').every(button => button.getAttribute('lang') === 'fr' && button.getAttribute('translate') === 'no'));

// Every word must be usable, including less-common word types. Distractors
// cannot repeat the answer or an ambiguous visible source/target label.
const choices = plain(run('sharedWords.map(entry => ({ id: entry.id, distractors: translationDistractors(entry).map(word => word.id) }))'));
for (const choice of choices) {
  const answer = bank.get(choice.id), distractors = choice.distractors.map(id => bank.get(id));
  assert.equal(distractors.length, 2, answer.id);
  assert.equal(new Set([answer.id, ...choice.distractors]).size, 3, answer.id);
  assert.equal(new Set([answer.fr, ...distractors.map(word => word.fr)].map(normalize)).size, 3, answer.id);
  assert(distractors.every(word => normalize(word.en) !== normalize(answer.en)), answer.id);
  const eligible = bank.words.filter(word => word.id !== answer.id && normalize(word.en) !== normalize(answer.en) && normalize(word.fr) !== normalize(answer.fr) && normalize(word.lemmaFr) !== normalize(answer.lemmaFr));
  if (eligible.filter(word => word.pos === answer.pos).length >= 2) assert(distractors.every(word => word.pos === answer.pos), answer.id + ': same word type');
  if (eligible.filter(word => word.pos === answer.pos && word.theme === answer.theme).length >= 2) assert(distractors.every(word => word.theme === answer.theme), answer.id + ': same theme');
}

// Practice state and selected answer survive every interface-language change.
click('#check-answer');
assert.equal($('#message').textContent, '请选择一个选项。');
assert.equal(g.document.activeElement, $('#options button'));
const answer = run('correctAnswer');
all('#options button').find(button => button.dataset.answer === answer).click();
const firstOption = $('#options .selected'), firstWord = $('#word').textContent;
const optionOrder = all('#options button').map(button => button.textContent);
for (const lang of ['en', 'fr', 'zh']) {
  language(lang);
  if (lang !== 'zh') noChineseUI(g);
  assert.equal($('#word').textContent, firstWord);
  assert.equal($('#options .selected'), firstOption);
  assert.equal(firstOption.getAttribute('aria-pressed'), 'true');
  assert.deepEqual(all('#options button').map(button => button.textContent), optionOrder);
  assert.deepEqual(plain(run('roundWords.map(word => word.id)')), firstRound);
}
click('#check-answer');
assert.equal(run('correctCount'), 1);
assert.equal($('#message').textContent, '正确！');
assert.equal(g.document.activeElement, $('#next-word'));
assert(all('#options button').every(button => button.disabled));
run('checkAnswer(); checkAnswer()');
assert.equal(run('correctCount'), 1, 'Repeated checking cannot earn extra credit');
language('fr');
assert.equal($('#message').textContent, 'Bonne réponse !');
assert.equal($('#quiz-score').textContent, 'Bonnes réponses : 1 / 15');
assert.equal($('#options .selected'), firstOption);
click('#next-word');
assert.equal($('#message').textContent, '');
assert.equal($('#options .selected'), null);
assert.equal(g.document.activeElement, $('#options button'));
firstOption.onclick();
assert.equal($('#options .selected'), null, 'Detached previous-question controls cannot change the new answer');
const secondAnswer = run('correctAnswer');
all('#options button').find(button => button.dataset.answer !== secondAnswer).click();
click('#check-answer');
assert.equal(run('correctCount'), 1);
assert.equal($('#message').textContent, `Mauvaise réponse. La bonne réponse était : « ${secondAnswer} »`);
language('en');
assert.equal($('#message').textContent, `Incorrect. The correct answer was: “${secondAnswer}”`);

// Finish all 15 questions, preserve the results in French, then resample.
for (let index = 1; index < 15; index++) click('#next-word');
assert.equal(run('quizFinished'), true);
assert.equal($('#word').textContent, 'Quiz finished!');
assert.equal(all('#options button').length, 0);
assert.equal($('#check-answer').style.display, 'none');
assert.equal(g.document.activeElement, $('#next-word'));
language('fr');
assert.equal($('#word').textContent, 'Quiz terminé !');
assert.equal($('#quiz-score').textContent, 'Bonnes réponses : 1 / 15');
assert.equal($('#next-word').textContent, 'Recommencer le quiz');
click('#next-word');
assert.equal(run('quizFinished'), false);
assert.equal(run('correctCount'), 0);
assert.equal(run('currentWordIndex'), 0);
assert.notDeepEqual(plain(run('roundWords.map(word => word.id)')), firstRound, 'Restart samples a fresh round');
assert.equal(all('#options button').length, 3);

// Repeated actual restarts can reach the entire 500-entry pool, always 15
// distinct cards. A fixed seed makes this coverage deterministic.
const coverage = plain(run(`(() => {
  const seen = new Set();
  let distinct = true;
  for (let i = 0; i < 700; i++) {
    startQuiz();
    if (roundWords.length !== 15 || new Set(roundWords.map(word => word.id)).size !== 15) distinct = false;
    roundWords.forEach(word => seen.add(word.id));
  }
  return { ids: [...seen], distinct };
})()`));
assert.equal(coverage.distinct, true);
assert.equal(coverage.ids.length, 500, 'Every shared word remains reachable across rounds');

// The original set is an explicitly selected, separately labelled mode.
click('#mode-definition');
assert.equal(run('quizMode'), 'definition');
assert.equal($('#word').textContent, 'Apple');
assert.equal($('#mode-definition').getAttribute('aria-pressed'), 'true');
assert.equal($('#quiz-description').textContent, 'Entraînement original : choisis la définition anglaise de chacun des 15 mots anglais.');
assert.deepEqual(plain(run('roundWords.map(word => word.word)')), ['Apple', 'Ball', 'Book', 'Cat', 'Dog', 'Sun', 'Run', 'Big', 'Happy', 'Tree', 'Water', 'House', 'Jump', 'Friend', 'School']);
assert(all('#options button').every(button => button.getAttribute('lang') === 'en'));
const originalOptions = all('#options button').map(button => button.textContent).sort();
assert.deepEqual(originalOptions, ['A round fruit with red or green skin.', 'A yellow, long fruit', 'A type of vegetable'].sort());
all('#options button')[0].click();
click('#mode-translation');
assert.equal(run('quizMode'), 'translation');
assert.equal(run('currentWordIndex'), 0);
assert.equal(run('correctCount'), 0);
assert.equal($('#options .selected'), null);
assert.equal($('#mode-translation').getAttribute('aria-pressed'), 'true');

// A failed shared asset remains honest and playable via the labelled original.
const missing = create('vocabulary_quiz.html', { missingBank: true });
assert.equal(missing.run('quizMode'), 'definition');
assert.equal(missing.$('#mode-translation').disabled, true);
assert.equal(missing.$('#bank-status').hidden, false);
assert.equal(missing.$('#word').textContent, 'Apple');
missing.language('fr');
noChineseUI(missing);
assert.match(missing.$('#bank-status').textContent, /n’a pas pu se charger/);
missing.run("setQuizMode('translation')");
assert.equal(missing.run('quizMode'), 'definition');
const html = fs.readFileSync(path.join(__dirname, '../vocabulary_quiz.html'), 'utf8');
assert.match(html, /focus-visible/);
assert.match(html, /min-height: 44px/);
assert.match(html, /aria-live="polite"/);
assert.match(html, /src="assets\/word-bank\.js(?:\?v=[^"]+)?"/);
console.log('PASS: shared 500-word vocabulary quiz, all distractors, unique 15-word rounds, every entry reachable, scoring, focus, stale handlers, zh/en/fr state, original 15-word mode and missing-bank fallback.');
