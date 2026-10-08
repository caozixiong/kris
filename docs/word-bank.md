# Shared English–French word bank

The site has **500 curated lexical pairs** for primary-school learners, grouped into 17 themes. The selection is original, rather than a copied proprietary frequency list. Multiword vocabulary items such as “pencil case” count as one lexical pair. All translations refer to the particular sense shown, not every possible meaning of a word.

## Canonical data and offline use

- `data/word-bank.json` is the editable, machine-readable source.
- `tools/build_word_bank.py` generates `assets/word-bank.js`; do not edit the generated asset.
- `tools/word-bank-runtime.js` contains the filtering and sampling implementation.
- Run `python tools/build_word_bank.py` after editing the JSON (Python 3 and Node 18+, no third-party dependencies). The same command refreshes the generated 32-word emergency fallback region in `word-data.js`; its entries and teaching hints are checked against the full bank, so there is no separately edited vocabulary copy.
- Run `python tools/build_word_bank.py --check` and `node tests/test_word_bank.cjs` before publishing.

The browser loads a normal, versioned local script. It does not fetch the JSON or require an account, network API, storage permission, package, or database. Once the static assets are available, vocabulary selection works offline. The JSON is also a directly downloadable record of the collection.

## Fields and teaching conventions

Each entry has a stable `id`, `theme`, `level` (1–3), `pos`, English and French display phrases (`en`, `fr`), plain lexical forms (`lemmaEn`, `lemmaFr`), Chinese meaning (`zh`), English article (`enArticle`), French article (`article`), noun `gender` (`m` / `f`), and French grammatical `number` (not the English number). Optional emoji are visual aids, not unique definitions or a guarantee that an item is suitable for a picture-only quiz.

The three levels mean familiar everyday words, growing vocabulary, and slightly more challenging vocabulary. These are editorial teaching bands, not a formal curriculum certification. Matching-game 4/6/8-pair difficulty controls the size of a round independently of lexical level.

French noun articles are included deliberately. Singular count nouns normally use un/une; mass nouns may use du/de la/de l’; lexical plurals may use des. Some English plurals correspond to singular French nouns, such as pants/un pantalon. Gender describes the French word. Person words distinguish male/female meanings where needed; a grammatical noun gender does not assign a real person's gender.

Adjectives normally appear in their masculine singular dictionary form, and verbs in the infinitive. Parentheses disambiguate a meaning. Ready-made phrases such as “to be hungry / avoir faim” are labelled as expressions rather than presented as literal adjective substitutions. Accents, apostrophes, and œ are preserved.

## Shared synchronous API

`window.KrisWordBank` (also available through CommonJS in tests) exposes:

- `words` / `entries`: the same immutable 500-entry array.
- `topics` / `getTopics()`: localized topic labels, teaching hints, and their item references.
- `get(id)`: stable-ID lookup.
- `filter({theme, pos, level, maxLevel, hasEmoji, excludeIds})`: a fresh eligible array. Theme, POS and level may be one value or an array. No fallback silently changes requested filters.
- `sample(count, filters, random)`: a fresh random sample, without repeated IDs or equal normalized English/French display labels. Optional injected random function supports deterministic testing. Insufficient eligible entries raise RangeError.

For example, `sample(8, {theme:'animals', maxLevel:2})` returns eight animal pairs; `sample(6, {pos:'noun', hasEmoji:true})` restricts candidates for a future illustrated game. Consumers must still ensure their particular visual task makes each answer unambiguous. Random selection never mutates the source.

## Games and boundaries

Bilingual Memory and Word Bridge use the full shared bank, with mixed and theme-specific rounds. Vocabulary Quiz adds shared-bank English→French practice, 15 different questions per round, while retaining its original 15 English-definition questions as a separately labelled mode. Restart starts a new sample, rather than changing questions when the interface language changes.

Sentence Match retains its 32 authored sentence pairs. English Ruins retains its grammar curriculum, and French Market retains its authored noun/adjective agreement and quantity missions. Chinese literacy lessons, arithmetic fruit props, and circuit material models have their own learning objectives. Randomly replacing those models with isolated English/French words would break their questions. They therefore are not pooled word-translation games. Future generated sentences need reviewed templates and explicit morphology; adding “s” universally or injecting random nouns is not supported.

## Editorial review references

The collection was independently reviewed for basic translations, grammatical metadata and Canadian-French usage. Reference dictionaries were used for questionable entries, not to reproduce a dictionary list or its definitions.

- Université de Sherbrooke, Usito: [cartable](https://usito.usherbrooke.ca/d%C3%A9finitions/cartable), [gomme](https://usito.usherbrooke.ca/d%C3%A9finitions/gomme), [pastèque](https://usito.usherbrooke.ca/d%C3%A9finitions/past%C3%A8que).
- Office québécois de la langue française: [vocabulary of office supplies](https://www.oqlf.gouv.qc.ca/ressources/bibliotheque/dictionnaires/VocabulairesPDF/vocabulaire-articles-bureau.pdf).
- Larousse: [hungry](https://www.larousse.fr/dictionnaires/anglais-francais/hungry/587422) and [thirsty](https://www.larousse.fr/dictionnaires/anglais-francais/thirsty/618124); Cambridge: [tall](https://dictionary.cambridge.org/dictionary/english-french/tall), [soft](https://dictionary.cambridge.org/dictionary/english-french/soft), and [lettuce](https://dictionary.cambridge.org/dictionary/english/lettuce).
- Government of Canada: [Language Portal reference tools](https://nos-langues.canada.ca/fr/index).

Automated tests verify count, unique labels and IDs, source/build agreement, minimum theme size, metadata, accents, immutability, filter boundaries, injected randomness, whole-bank reachability, and operation without fetch or local storage. These tests do not establish a formal educational level or replace editorial review.
