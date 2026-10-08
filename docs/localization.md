# Chinese, English and French

Every game, the homepage, review/admin interface and the two picture-gallery pages use the same top-of-page language controls. French uses `fr-CA` for document and speech metadata. Default language is Chinese; an existing math-language preference is migrated on read.

`assets/i18n.js` owns the preference and controls. It prefers localStorage, falls back to sessionStorage, and propagates `?lang=` on internal navigation when both are unavailable. An explicit URL language is remembered. The query is kept current after a switch, including reloads. Language storage failures never stop a game.

Catalogs are split into site, adventures, legacy math, legacy learning, reviews, admin and gallery files. `register` takes Chinese-source keys and English/French values. Exact translations are reversible, including English-source legacy pages. Bounded `registerPatterns` cover dynamic numeric feedback, with optional Chinese formatters for English-source patterns. Source strings are tracked per text node and translated attribute. Dynamic mutations and the reviews shadow root are observed without replacing UI elements.

Teaching material remains in its intended language: Chinese characters and multiplication mnemonics, English vocabulary and sentence exercises, French shopping-list vocabulary. Mark these elements `data-i18n-skip` or `translate="no"`. User-written reviews and account identity are also excluded. Language changes must never resubmit a review, repeat an Auth call, change authorization or reset a running game. Modern addition narration follows the chosen interface language; Chinese multiplication narration intentionally remains Chinese with an explanation.

For a new string, add all three versions to the relevant catalog and cover its dynamic branch. Do not use rendered translated text as a state key. No libraries or translation service are needed at runtime. Existing Supabase schema, keys, role grants and authentication behavior are unchanged.

Run `python tools/update_asset_hashes.py` after editing scripts/styles. Run the regression commands in `tests/README.md` before publication. The DOM tests execute real application handlers but do not establish native browser rendering, mobile touch or actual voice availability. Browser checks must be reported separately.
