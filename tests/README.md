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
- Homepage: all 29 prior directory records preserved; the total of 48 exact source/fallback entries includes 26 game links. Tests actual markup and script for successful enhancement and offline, invalid-content and HTTP-error fallbacks, categories, Chinese/English search, expand/collapse, empty state, reset/clear focus, safe external links, and random-game destinations.
- Legacy games: unchanged independent 100 ordered multiplication/口诀 fixtures; 7,800 generated questions and answer choices; production handlers for addition/multiplication including full rounds, correct/wrong/invalid inputs, learning flow, range selection, restart, bilingual state, speech, mute, missing voices, denied storage and interruption.
- Static checks include local assets and matching SHA-256 cache keys, script order/defer, title/language/viewport/noscript markup, page/home links, focus styles, responsive breakpoints and reduced-motion CSS gating.

`homepage-baseline.json` was captured from the previously published math-update directory, independently of this update's new four-game entries. `mnemonic-fixtures.json` preserves the earlier independently prepared fixture set. Earlier 1–9 九九 phrases were cross-checked against the multiplication review table on printed page 39 (PDF page 9): https://file.xdf.cn/uploads/200410/1113_200410133116b7ehyQUiRSq7NJi2.pdf .

## Scope and remaining manual checks

`quest-dom.cjs` is a small dependency-free HTML/DOM adapter, not a browser or jsdom. It parses actual production HTML and all re-rendered markup, and models attributes, selector matching, event bubbling, disabled buttons, detached elements and focus. It does not reimplement game rules. The legacy math tests retain their established DOM fixture adapter.

These passing tests do not verify pixel layout, touch hit-testing, native keyboard behavior, a browser accessibility tree, screen-reader speech timing or actual device audio. These dependency-free checks do not launch a browser. Separate real-browser release checks do not replace device-specific testing.

Before claiming device-level visual/accessibility QA, check:

- Chromium/Safari at 1440, 768, 390 and 320px: no horizontal overflow, clipped controls, overlapping planets or unreadable SVG labels.
- iPhone Safari: all four new games by tap, focus/scroll after Next, map navigation, cart steppers, English return-word controls, science configuration/prediction, completion/replay.
- Keyboard and screen reader: clear button names, map selection, live feedback announced once, newly selected mission discoverable, and visible focus.
- Existing math games on iPhone: answer/read/replay/mute/language/full-round narration, including 7×7 and 10×10.

No browser/device QA claim is made by this test suite.

## Public review checks

Also run `python tests/test_reviews_static.py`, `node tests/test_reviews_api.mjs` and `node tests/test_reviews_widget.cjs`. The static check covers exactly 26 actual game pages, excludes placeholder/gallery pages, verifies widget script paths/cache hashes and client-secret absence. API tests execute the deployed handler with mocked network responses and a fresh random test-only answer. Widget tests execute the actual shared frontend through the existing DOM adapter and cover gating, XSS-safe text, pending acknowledgement, offline draft retention, duplicate clicks, answer clearing, and navigation interruption. They make no browser rendering claim.

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

These use actual production runtime/catalogs and application handlers. They cover zh → en → fr → zh reversibility, saved language and denied-storage URL fallback, live mutations and translated attributes, all 32 adventure missions and feedback, the existing game pages including collection modes, partial answers/cart/prediction/timer/score preservation, instructional-language content, homepage search/filter preservation, and review draft/admin session/confirmation preservation without additional network calls. Existing `test_math_flow.cjs` also checks French UI, pluralizations, fr-CA addition speech and Chinese multiplication mnemonics.

`test_legacy_learning_i18n.cjs` is an optional Playwright/Chromium test for a permitted browser environment. It is separate from the dependency-free suite and must not be interpreted as a completed browser check when the environment does not allow browser launch. Use the cloud browser for published-page smoke checks; mobile visual testing remains a separate check when viewport control is available.


## Bilingual-game catalog integration

Homepage tests also cover all three new game links in fetched and offline catalogs, first-card placement, English/French/Chinese search keywords, accent-insensitive French search, empty results, clear/focus and language-switch preservation. Review API/static tests now require exactly 26 canonical game IDs and matching administrator links. `test_bilingual_review_migration.mjs` applies the unchanged original migration plus the new constraint migration in local Postgres, compares the historical 23-ID state, preserves an existing row and role grants, accepts all 23 historical IDs and rejects an unknown ID. No remote reviews or test accounts are created.

## Shared English–French word games

```sh
python tools/build_word_bank.py --check
node tests/test_word_bank.cjs
node tests/test_vocabulary_shared_bank.cjs
node tests/test_word_core.cjs
node tests/test_word_flow.cjs
```

The core checks use independent generated fixtures, every shared-bank theme, all 500 word pairs, the unchanged 32 sentence pairs, and the 32-word fallback when the shared bank is absent. They cover exact opposite-language identity matching, unique shuffled cards, duplicate/rapid clicks, explicit mismatch and hint locks, fresh rounds, sanitized progress, and repeated sampling across each topic and the whole bank. Mixed rounds reject duplicate English or French surface forms while replay coverage checks that no word is permanently hidden by filtering. `test_word_bank.cjs` also validates the canonical JSON, generated-asset parity, metadata, and the shared sampling API.

The flow checks execute real wrapper HTML, application scripts, and the shared language runtime through `quest-dom.cjs`. They cover every exposed topic/difficulty, repeated completion and passport records, getter/read/write-denied storage campaigns, omitted-bank fallback storage isolation, corrupt progress, Chinese/English/French state preservation, face-down memory, hints without credit, keyboard-focus targets, persistent live announcements, stale detached controls, interrupted theme/difficulty changes, sibling/home links, review IDs, and static responsive/focus/44px target CSS. These are DOM-model and static assertions, not browser rendering, touch hit-testing, screen-reader, or device validation.

## Subject browsing and automatic memory reset

The homepage lists all 26 actual game pages in both the embedded and fetched catalogs. Four primary subject entrances cover Math (14), Chinese (5), English (5), and French (5); four English–French games appear in both language categories. Circuit Lab stays reachable as a separate science bonus and in All games. The language of a math edition does not change its subject. The existing 22 external resource/family entries and their filters remain unchanged.

`test_homepage.cjs` covers exact category membership, all nine restored legacy links, search/category intersection, repeated selections, shareable category hashes and Back restoration, deep-link restoration before asynchronous content loads, focus targets, visible-only random games, empty results, reset, no-JavaScript fallback, and fetched/offline/malformed/HTTP fallback catalogs. `test_site_i18n.cjs` verifies every added label/description in Chinese, English and French and preserves the active subject across language changes.

`test_word_flow.cjs` uses a deterministic clock with the real production handlers: mismatched memory cards stay face-up through 999 ms, turn back at 1,000 ms, and do not change again afterward. It verifies blocked third/repeated clicks, preserved matches and scores, unchanged deadlines on language switches, timer cancellation on restart/theme/size/page exit, stale callbacks and detached clicks, back/forward-cache return, and focus preservation. Bridge/sentence mismatches and hints still use their original manual Continue action.

These automated tests model the DOM and statically inspect responsive CSS. They do not establish mobile-device rendering or screen-reader timing. No backend, authentication, permissions or review data is modified by these changes.

## All-game experience refresh

After refreshing cache keys with `python tools/update_asset_hashes.py`, run the existing suites above plus:

```sh
node tests/test_all_games_experience.cjs
node tests/test_quest_experience.cjs
node tests/test_legacy_math_arcade.cjs
node tests/test_learning_worlds.cjs
```

The independent all-game harness boots all 26 actual wrappers and inspects every mode of the three-, four-, and ten-game math collections. New regression cases cover impossible shape pools using an independent subset-sum oracle over 1,000 rounds, malformed number input, repeated answer/Next clicks, stale callbacks after navigation, native answer controls, and language-state preservation. `docs/game-experience-review.md` contains the page-by-page before/after audit.

Mechanic-specific checks cover route-node rewinding, English sentence runes and relics, correct French quantity phrases and removable baskets, all 12 unique circuit observations, match-built word scenes and score-neutral pair review, all 400 addition ten-frame pairs and all 100 multiplication transpositions, garden marking, real 0–20 object groups, calm/optional-reminder rounds, all 24 original local illustrations, four study-first Chinese picture prompts, 4/6/12/20-pair Chinese memory, shape undo, and vocabulary mistake-only retry. Bilingual-memory mismatch remains exactly 1,000 ms, with timer cancellation and hidden-word accessibility checks.

These suites execute production scripts in the dependency-free DOM model. They do not launch a browser or establish device rendering, native touch/keyboard behavior, screen-reader announcements or actual speech output. Optional Playwright/device and local PostgreSQL suites remain separate checks. The experience update does not change review/backend/authentication files.


## Chinese from the very beginning

The Chinese level is independent of age. Nothing in these games assumes native Chinese primary-school reading, existing pinyin knowledge, or sentence-reading ability. The initial lesson contains four familiar concepts, with pictures and English/French meanings shown before practice. The first 20 words are separated from the full 300-entry collection.

Run:

```sh
node tests/test_chinese_bank.cjs
node tests/test_chinese_core.cjs
node tests/test_chinese_flow.cjs
PGLITE_MODULE=<installed-pglite-dist/index.js> node tests/test_chinese_review_migration.mjs
python tests/test_reviews_static.py
python tests/test_admin_static.py
```

- The bank has 300 distinct written entries: 154 single-character entries and 146 multi-character entries, spanning 337 distinct characters. The 20 guided building examples are separate and are not counted again. See `docs/chinese-bank.md` for editorial choices, tone conventions and checks.
- Chinese First Steps previews one word at a time before two-choice recognition. Picture–Word Friends keeps matching cards face-up. Chinese Word Builder explicitly previews both component characters before guided assembly.
- English/French meanings remain available and pinyin is optional. Sound plays only on request, uses a local Mandarin voice where available, and has a text/visual fallback. No external fonts, speech API or remote word-bank request is required.
- Existing picture recognition also previews four words before two-choice practice with retry. Existing Chinese memory starts with four pairs, larger 14px support text and optional 6/12/20-pair sets. Both share the canonical bank and retain four-word local fallbacks if it fails to load.
- New wrappers participate in all 26-game homepage/review/admin inventories. The ID-only database migration preserves existing rows, grants, policies, rate limits and moderation. Live read-only review smoke checks are separate from the local tests; no real reviews are created for QA.
- Automated checks exercise production code through the dependency-free DOM model and pure rules. They do not establish native speech output, phone touch behavior or screen-reader behavior.
