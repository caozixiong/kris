# Kris learning adventure regression checks

Run from the repository root using Node 18+ and Python 3 with lxml:

```sh
python tests/test_quest_static.py
node tests/test_quest_core.cjs
node tests/test_quest_flow.cjs
node tests/test_homepage.cjs
node tests/test_math_core.cjs
node tests/test_math_flow.cjs
```

The static check refreshes the two legacy HTML fixtures before the legacy flow test. No network or browser is required. No runtime dependency was added to the website.

## Coverage

- All four 8-mission curricula have solutions. Enumerates every exact-length permutation of arithmetic modules with an independent arithmetic oracle, and rejects repeated modules, wrong step counts, invalid indices, and fractional/negative intermediate results.
- Executes the actual `quest-data.js`, `quest-core.js`, and `quest.js` loaded from each real HTML wrapper. Covers all 32 successful missions, incorrect answers, undo/reset, hints, map selection, partial completion, final badge, replay/retry, stale detached Check/Next clicks, unique earned stamps, saved/restored/corrupt progress, plus 12 full campaigns with storage getter/read/write failure.
- Checks 21 reachable arithmetic moves that would create a negative number or fraction.
- English: every wrong reversed order, shuffled token identities, removing and undoing words, duplicate The/the acceptance, canonical success capitalization, question punctuation.
- French: all eight exact carts, equal-total wrong-color carts, zero/five quantity limits for each product, glossary and reset. The six-item final cart is supported; the cap is per product.
- Science: all 192 combinations of mission, six materials, switch position and prediction through real UI handlers. Observed light state follows conductivity and switch position even when the mission answer is wrong. Wrong predictions can be corrected, and configuration changes reset the observation.
- Rendered controls retain names/types and unique IDs; intended focus changes are asserted. The persistent live region survives rerenders and receives feedback.
- Homepage: all 29 prior directory records preserved; the new total of 33 exact source/fallback entries includes 11 game links. Tests actual markup and script for successful enhancement and offline, invalid-content and HTTP-error fallbacks, categories, Chinese/English search, expand/collapse, empty state, reset/clear focus, safe external links, and random-game destinations.
- Legacy games: unchanged independent 100 ordered multiplication/口诀 fixtures; 7,800 generated questions and answer choices; production handlers for addition/multiplication including full rounds, correct/wrong/invalid inputs, learning flow, range selection, restart, bilingual state, speech, mute, missing voices, denied storage and interruption.
- Static checks include local assets and matching SHA-256 cache keys, script order/defer, title/language/viewport/noscript markup, page/home links, focus styles, responsive breakpoints and reduced-motion CSS gating.

`homepage-baseline.json` was captured from the previously published math-update directory, independently of this update's new four-game entries. `mnemonic-fixtures.json` preserves the earlier independently prepared fixture set. Earlier 1–9 九九 phrases were cross-checked against the multiplication review table on printed page 39 (PDF page 9): https://file.xdf.cn/uploads/200410/1113_200410133116b7ehyQUiRSq7NJi2.pdf .

## Scope and remaining manual checks

`quest-dom.cjs` is a small dependency-free HTML/DOM adapter, not a browser or jsdom. It parses actual production HTML and all re-rendered markup, and models attributes, selector matching, event bubbling, disabled buttons, detached elements and focus. It does not reimplement game rules. The legacy math tests retain their established DOM fixture adapter.

These passing tests do not verify pixel layout, touch hit-testing, native keyboard behavior, a browser accessibility tree, screen-reader speech timing or actual device audio. Browser launching was intentionally not attempted because that execution route was denied. jsdom/linkedom/happy-dom were not locally installed.

Before claiming device-level visual/accessibility QA, check:

- Chromium/Safari at 1440, 768, 390 and 320px: no horizontal overflow, clipped controls, overlapping planets or unreadable SVG labels.
- iPhone Safari: all four new games by tap, focus/scroll after Next, map navigation, cart steppers, English return-word controls, science configuration/prediction, completion/replay.
- Keyboard and screen reader: clear button names, map selection, live feedback announced once, newly selected mission discoverable, and visible focus.
- Existing math games on iPhone: answer/read/replay/mute/language/full-round narration, including 7×7 and 10×10.

No browser/device QA claim is made by this test suite.
