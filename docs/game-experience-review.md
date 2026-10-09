# All-game experience review

Review scope: the 23 actual game pages linked by the homepage. Both ten-game math collections and the smaller three-/four-game collections were inspected beyond their first mode. Gallery pages, placeholders, review administration, database policies and unrelated directory entries are outside this change.

## Review criteria

- Give each game an interaction or visible result that follows its learning mechanic.
- Keep the answer, feedback, concrete objects and score mathematically consistent.
- Make progress encouraging without requiring speed or punishing exploration.
- Support button-based touch and keyboard play, narrow layouts and reduced motion.
- Keep Chinese, English and Canadian French interface changes from restarting a round or revealing a hidden answer.
- Keep the shared 500-word bank, one-second bilingual-memory mismatch and review security intact.

## Per-game audit

The starting issues below came from reading the actual page/runtime and reproducing relevant handlers. Visual descriptions refer to implemented markup, CSS and artwork; they are not claims of device-level rendering verification.

| Game | Starting issue or missed opportunity | Improvement to verify | Main regression evidence |
|---|---|---|---|
| Addition Orchard (`addition_game`) | Counting baskets and earned stars worked, but the scene had little visible growth and no alternate ten-frame manipulation. | Growing orchard rewards; a gather/return ten-frame model shows the exact two quantities. | Math core/flow/i18n; independent scene/count/round-state checks. |
| Multiplication Planet (`multiplication_game`) | Group counting and Chinese mnemonics were sound; the planet did not develop, and rows/columns could not be compared. | Growing planet rewards; transpose the same star array while keeping factors and answer unchanged. | Independent 100 ordered multiplication/mnemonic fixtures; math flow; array checks. |
| Shape Addition and Subtraction (`shape_sorter_math`) | Addition was drag-only and could generate an impossible pool; completion timers could initialize the wrong mode after a switch. | Native tap/keyboard shapes, solvable pool, undo, manual next and earned shape collection. | Independent subset-sum oracle across 1,000 rounds; mode/reset/undo/stale-action checks. |
| Vocabulary Quiz (`vocabulary_quiz`) | The shared bank worked, but the quiz had little journey feedback and no focused retry of mistakes. | Word passport and targeted end-round review while retaining both quiz modes. | 500-word shared-bank checks; quiz exact choices, repeated checks and retry selection. |
| Bilingual Memory (`bilingual-memory`) | Memory rules were sound; the completion payoff was primarily a counter. | Matched pairs light a sky map; earned stars can revisit only discovered pairs. | Existing deterministic 999/1,000 ms clock tests; independent hidden-word/marker/revisit checks. |
| Word Bridge (`word-bridge`) | Matching worked, but the bridge metaphor did not change with progress. | Each match builds a plank and moves the fox toward the far bank. | Word core/flow; marker counts and review-without-score checks. |
| Sentence Match (`sentence-match`) | Matching worked, but the dialogue metaphor lacked a visible exchange. | Two characters exchange the selected and then correctly paired sentences. | Exact bilingual sentence fixtures; scene and language-preservation checks. |
| Picture Chinese Quiz (`chinese_character_quiz`) | All three question files were text placeholders saved with PNG filenames, so no valid question images were rendered; only three fixed questions and forced auto-advance. | Original local illustrations, a larger illustrated deck, locked answers and manual continuation. | Every local image resolves; answer/restart/next and language-state checks. |
| Chinese Treasure Memory (`chinese_game1`) | Twenty SVGs and audio references were absent; fixed 8×100px board overflowed small screens; div cards and stale timers compromised play. | Original illustrations, 6/12/20-pair difficulty, native cards, responsive grid and cancellable reveal timers. | All difficulty sizes; hidden-face accessibility, complete matching and interruption checks. |
| Math Orbit (`math-orbit`) | Route planning worked but undoing a long route required repeated clicks; scene changes were limited. | Tap any prior energy node to rewind; fuel/distance telemetry and successful docking. | All eight independent arithmetic solutions; exact-prefix rewind and no unearned stamps. |
| English Ruins (`english-ruins`) | Corrective text identified a mismatch but words/scene gave little spatial feedback. | Runes distinguish the verified prefix and next mismatch; solved doors yield relics. | All eight word orders, case-equivalent duplicates; rune edit-clearing and relic counts. |
| French Market (`french-market`) | Quantities appeared chiefly as stepper values, with no tangible packed basket. | Visible quantity-correct basket, remove-one action and delivery stamp. | Exact carts and wrong-color rejection; six products' singular/plural labels and unpack focus. |
| Circuit Lab (`circuit-lab`) | Observation was truthful but could not be compared across material/switch experiments. | Current/readout presentation plus a notebook of the 12 observed configurations. | 192 mission/configuration/prediction cases; notebook records physics and never earns stamps. |
| Counting Shapes (`math1`) | Misleading short countdown, fixed passive objects and forced new round. | Tap-to-mark objects, manual next/restart and a collection journey. | Real handlers; exact counted shapes and preserved state on language change. |
| Math Games 2–4 (`math234`) | Div-based choices, time pressure, uncancelled callbacks and repeated bound listeners; little shared progression. | Native choices, relaxed play, separate gathering/detective/bowling models and stamp trails. | Every submode boots/plays; bowling correctness, language state and switch cancellation. |
| Math Adventures 5–7 (`math567`) | Time pressure and uncancelled feedback callbacks; models not linked to answers; remote texture dependencies. | Separate collection/potion/jump/market models and stamp journeys; local CSS star textures. | All four submodes; missing-addend slots, exact paths, fruit/change scenarios and interruption. |
| Alien Countdown (`math8`) | Repeating an answer could award multiple points; repeated Next queued new rounds. | Step-by-step flight model, stamp route and once-only/cancellable round handlers. | Repeated real clicks and deterministic Next timing. |
| Arithmetic Hero (`math9`) | `parseInt` accepted partial inputs; repeated submits changed score/lives; pending game-over could outlive restart; appearance depended on a remote runtime CSS compiler, icon font and random photographs. | City-building journey, concrete model, strict integer validation, cancelled stale feedback, self-contained local styles and original SVG mascots. | Invalid suffixes/decimals, double submit and restart/menu interruption; local class coverage and hidden/modal lifecycle. |
| Kids' Arithmetic (`math10`) | Automatic next could overwrite a manually selected question; no explicit round lock. | Robot-building trail, concrete models and cancelled previous-round callbacks. | Manual-next race, answer lock and operation/range correctness. |
| Within-20 Practice (`math_addition_subtraction`) | Required time limit and mostly numeric feedback made practice repetitive. | Calm default, optional reminder, eight-step journey and explicit round handling. | Correct/wrong/zero arithmetic, optional timer and language-state checks. |
| Visual Math (`math_visual_game`) | Larger amounts were not represented as individually countable objects; required timer. | Real countable objects, calm practice and theme-aware eight-step journey. | Exact operand/object counts, both themes, reminder behavior and score lock. |
| Chinese Math Collection (`math_chinese`) | Ten subgames inherited div controls, input/score/timer races and minimal mechanic-specific feedback. | Ten concrete models with native controls and safe callbacks; each mechanic receives its own theme. | All ten models/modes, strict hero input, repeated jumps and inactive-round cancellation. |
| English Math Collection (`math_english`) | Same ten-mode defects, with English-source strings also needing reversible localization. | Same ten mechanic-specific models and safe controls, fully reversible three-language UI. | All ten modes and partial-state preservation across Chinese/English/French. |

## Independent reproductions

Before implementation, the independent DOM harness reproduced:

- Shape sorter target 3 from eight tokens of value 2, with no subset solution.
- Alien Countdown awarding 2 points for two clicks on the same correct answer.
- Arithmetic Hero awarding 20 points for the correct number followed by `abc`.
- Broken picture-quiz image references in the text checkout and missing Chinese-memory images. Remote inspection established that the three quiz PNG filenames contain plain-text placeholders rather than PNG image data; the 20 Chinese-memory SVGs are absent remotely.

These cases are retained as regressions rather than relying only on the pre-existing suite.

## Verified results

- `node tests/test_all_games_experience.cjs`: 49 independent groups passed, covering every page and all 27 modes inside the four collection pages.
- `node tests/test_legacy_math_arcade.cjs`: 21 additional focused groups passed.
- `node tests/test_legacy_math_i18n.cjs`: 17 localization groups passed after the local hero skin change.
- All 24 new SVG illustrations were independently rasterized with installed Inkscape and visually inspected together. The illustrations are recognizable and complete; this checks artwork only.
- Diff review confirmed no changes to review/admin frontend logic, backend/schema/permissions, or the shared word-bank data and matching core.

### Local hero skin review

Static review confirms the finite local stylesheet covers structural display, responsive sizing, spacing, colors and the hidden/opacity/scale states used by the page. Modal overlays have padding and vertical scrolling; inner panels have a 90vh height cap. Narrow-screen rules reduce nested padding, and old decorative animation/hover/gradient utility tokens do not control content visibility. Generic hover/focus rules and a local body gradient remain. Math Adventures’ star textures now use CSS gradients. These are source-level checks, not measurements in a rendered browser.

## Verification boundaries

Run the complete commands in `tests/README.md` plus `node tests/test_all_games_experience.cjs` and the feature-specific suites added with this update. The independent harness reads actual HTML and runs production scripts; it models timers, disabled controls, focus, translation and state transitions. Its geometry stubs do not verify layout.

Still separate from those automated checks: native browser layout at 320/390/768/1440px, Safari/Chrome touch hit-testing, native keyboard traversal, screen-reader announcements and actual audio. No browser launch or security restriction is bypassed. A public-page smoke check does not establish full mobile or accessibility coverage.

The review widget, review authentication, backend policies and administrator permissions are unchanged by this experience work.
