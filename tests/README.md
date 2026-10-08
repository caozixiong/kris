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

## Public review checks

Also run `python tests/test_reviews_static.py`, `node tests/test_reviews_api.mjs` and `node tests/test_reviews_widget.cjs`. The static check covers exactly 20 actual game pages, excludes placeholder/gallery pages, verifies widget script paths/cache hashes and client-secret absence. API tests execute the deployed handler with mocked network responses and a fresh random test-only answer. Widget tests execute the actual shared frontend through the existing DOM adapter and cover gating, XSS-safe text, pending acknowledgement, offline draft retention, duplicate clicks, answer clearing, and navigation interruption. They make no browser rendering claim.

`test_reviews_database.mjs` executes the production SQL in PostgreSQL via the optional development-only `@electric-sql/pglite@0.5.8`. Set `PGLITE_MODULE` to its installed `dist/index.js` path. Tests verify RLS and column permissions using real database roles, deny public writes/RPCs and server-side publishing, check quota boundaries, expired-counter cleanup and pending capacity. See `docs/reviews.md` for deployment and moderation details.

## Admin review checks

Run `python tests/test_admin_static.py`, `node tests/test_admin_ui.cjs`, `node tests/test_admin_auth_sdk.cjs`, and `PGLITE_MODULE=<installed-pglite-dist/index.js> node tests/test_admin_database.mjs`. These cover the pinned client/CSP/asset checks, actual UI handlers through a DOM adapter, and 13 PostgreSQL role/session/ACL groups. `tools/admin-vendor` pins the self-hosted official SDK with a lockfile. No administrator email, password, UID or token belongs in a test fixture or production source. Only synthetic local account/session fixtures are used by database tests.

An actual owner email-link sign-in and a real review moderation remain separate deployment checks; local fixtures cannot establish email delivery. The admin role starts empty until the separately approved real Auth account exists and its UID is bound through trusted owner access.

`test_admin_auth_sdk.cjs` uses the actual pinned Supabase AuthClient in isolated browser-like contexts with mocked HTTP and BroadcastChannel. It verifies callback history cleanup before network access, expired-link messaging, isolated-tab magic-link sign-in, and permanent local UI locks after successful or failed logout. It does not contact real accounts or establish real-browser behavior.

## Three-language regression checks

Run after `python tools/update_asset_hashes.py`:

```sh
node tests/test_site_i18n.cjs
node tests/test_quest_i18n.cjs
node tests/test_legacy_math_i18n.cjs
node tests/test_legacy_learning_i18n_dom.cjs
```

These use actual production runtime/catalogs and application handlers. They cover zh → en → fr → zh reversibility, saved language and denied-storage URL fallback, live mutations and translated attributes, all 32 adventure missions and feedback, all 20 game pages including collection modes, partial answers/cart/prediction/timer/score preservation, instructional-language content, homepage search/filter preservation, and review draft/admin session/confirmation preservation without additional network calls. Existing `test_math_flow.cjs` also checks French UI, pluralizations, fr-CA addition speech and Chinese multiplication mnemonics.

`test_legacy_learning_i18n.cjs` is an optional Playwright/Chromium test for a permitted browser environment. It is separate from the dependency-free suite and must not be interpreted as a completed browser check when the environment does not allow browser launch. Use the cloud browser for published-page smoke checks; mobile visual testing remains a separate check when viewport control is available.
