# Beginner Chinese shared bank

This bank starts from a child who has **just begun Chinese**. The three practice
levels are gentle learning stages, not the reading level of a native-speaking
8–10-year-old, school grades, or official HSK levels. Familiar everyday meanings
matter more than character stroke counts. Learners should preview a small group,
hear the words when speech is available, and keep pinyin and meaning support.

## Exact scope and count

- **300 distinct written learning entries**, with no duplicate `hanzi` or IDs.
- **154 one-character entries**, **142 two-character entries**, and **4
  three-character entries**. This is 300 vocabulary entries, not a promise of
  exactly 300 different characters. There are **337 distinct Chinese characters**.
- The entries include everyday single-character words, longer words, and a few
  common expressions such as 你好 and 对不起. Meaningful compounds are separate
  entries when their meanings differ, for example 米 (uncooked rice), 米饭 (cooked
  rice), 书 (book), and 书包 (schoolbag). A spelling or alternate translation is
  not added as another copy of the same entry.
- **15 themes of 20 entries**. Theme lists are browse collections, not 20-word
  test requirements. Games should split them into short groups of 4–6.
- Levels: **121 at level 1**, **138 at level 2**, **41 at level 3**. Later stages
  still teach beginner daily concepts; they add longer words, relations, simple
  descriptions, and a few useful quantity words.
- **24 existing local SVG picture references**. No images, fonts, pronunciation
  recordings, or dictionaries are fetched by the bank at runtime.
- **20 separate word/phrase-building targets**, excluded from the 300 total.
  Each combines two individual character entries already in the first 100.

The first 20 entries, in order, are 水、火、山、人、手、口、大、小、上、下、太阳、月亮、
门、开、关、米、吃、喝、狗、猫. The first four are water, fire, mountain, and person.
No advanced reading passage, idiom, abstract character-origin explanation, or
native-primary-school exercise is required to begin.

## Themes

| ID | Chinese | English | French | Entries |
|---|---|---|---|---:|
| first | 最初的词 | First words | Premiers mots | 20 |
| animals | 动物 | Animals | Animaux | 20 |
| nature | 颜色和自然 | Colors and nature | Couleurs et nature | 20 |
| food | 食物和饮料 | Food and drinks | Aliments et boissons | 20 |
| home | 在家里 | At home | À la maison | 20 |
| people | 我和家人 | Me and my family | Moi et ma famille | 20 |
| numbers | 数字和数量 | Numbers and amounts | Nombres et quantités | 20 |
| body | 身体和衣服 | Body and clothes | Corps et vêtements | 20 |
| school | 在学校 | At school | À l’école | 20 |
| actions | 每天的动作 | Everyday actions | Actions du quotidien | 20 |
| time | 一天的生活 | My day and time | Ma journée et le temps | 20 |
| places | 位置和出行 | Places and getting around | Lieux et déplacements | 20 |
| play | 玩和运动 | Play and sports | Jeux et sports | 20 |
| describing | 感觉和反义词 | Feelings and opposites | Sensations et contraires | 20 |
| everyday | 常用的话 | Everyday words | Mots de tous les jours | 20 |

## Schema and use

`data/chinese-bank.json` is the editorial source. `assets/chinese-bank.js` is
generated from it and exposes the same object as `window.KrisChineseBank` and
CommonJS `module.exports`. The synchronous local asset works without fetching
the JSON over the network.

```js
{
  version: 1,
  entries: [{
    id: 'zh001', hanzi: '水', pinyin: 'shuǐ',
    en: 'water', fr: 'eau', theme: 'first', level: 1,
    cue: '💧', picture: 'water'
  }],
  themes: [{id: 'first', zh: '最初的词', en: 'First words', fr: 'Premiers mots'}],
  buildingTargets: [{
    id: 'build01', hanzi: '喝水', pinyin: 'hē shuǐ',
    en: 'to drink water', fr: "boire de l'eau", cue: '💧',
    kind: 'phrase', theme: 'first', parts: ['zh018', 'zh001']
  }]
}
```

- `picture` is optional and is a safe, bare filename stem under
  `assets/learning-pictures/`, without `.svg`.
- `cue` is always a string and may be empty. Abstract meanings deliberately have
  no forced emoji. Cues are supporting hints, not unique semantic definitions.
- `buildingTargets.parts` contains entry IDs, not extra vocabulary. Resolve each
  component from `entries`, preview it, and display the full target's own pinyin.
- `kind` distinguishes the building targets that are nouns from short phrases.
  The first four targets are 喝水、开门、小手、小狗. 大小 and 山水 are last and
  optional; their whole meanings are taught rather than guessed literally.
- Keep this count separate from the existing English/French word bank. That
  bank's size does not count toward these 300 Chinese entries.

## Pinyin and meaning conventions

Pinyin has tone marks, lower-case letters, and **one space per syllable** for
beginner readability. The spacing is pedagogical; it is not a claim that each
syllable is a separate word. Neutral-tone syllables are unmarked, for example
妈妈 `mā ma`, 朋友 `péng you`, 衣服 `yī fu`, and 葡萄 `pú tao`.

Underlying dictionary tones are retained in combinations such as 你好 and 小手;
the bank does not mechanically respell third-tone sandhi. Likewise 一 and 不 are
shown in their citation tones as individual entries. Playback of natural words
may differ from those citation tones. Compound pronunciation is independent of
the isolated component: 人 is `rén`, while the adult sense of 大人 is taught as
`dà ren`. Both 太阳 `tài yáng` and 干净 `gān jìng` retain full dictionary tones.
谁 uses the common `shéi` pronunciation; `shuí` is also valid.

English and French glosses give the selected daily meaning, not every dictionary
sense. For example 只 is the animal measure word `zhī`, 长 is `cháng` (long),
脏 is `zāng` (dirty), 月 is month, and 月亮 is moon. 爷爷/奶奶 explicitly identify
the paternal grandparents. 大小 means size, rather than being mistranslated as
only “big and small.”

### Quiz ambiguity guardrails

- 他 and 她 are both `tā`. Never use one as the other's sole-audio distractor.
  Compare pinyin when choosing audio answer options.
- Many cues are intentionally shared: 汤/碗, 球/足球, 书/读/故事, 听/耳朵,
  太阳/中午, 看/看见, 睡觉/累, and 你好/再见. An emoji-only question must not
  pretend these are distinct pictures. Keep text and context, or choose verified
  unambiguous local picture entries.
- 开门/关门 share a door cue; 上山/下山 share a mountain. The full text teaches
  the action. 米/大米 have no plant emoji, because standing grain is not shelled
  uncooked rice. 起床 has no bed-only cue, because that can suggest sleeping.

## Editorial review and sources

All 300 entries and 20 targets were read independently for simplified spelling,
pinyin, natural beginner meaning, English/French wording, and image ambiguity.
Dictionary spot checks were used for uncertain or variable neutral tones; this
is not a claim that every entry was individually fetched from a dictionary.
The translations are concise editorial glosses, not copied dictionary articles.

Primary dictionary checks:

- [CC-CEDICT via MDBG: 窗户](https://www.mdbg.net/chinese/dictionary?page=worddict&wdqb=%E7%AA%97%E6%88%B7&wdrst=0)
  confirms `chuāng hu`.
- [CC-CEDICT via MDBG: 葡萄](https://www.mdbg.net/chinese/dictionary?page=worddict&wdqb=%E8%91%A1%E8%90%84&wdrst=0)
  confirms `pú tao`.
- [CC-CEDICT via MDBG: 学生](https://www.mdbg.net/chinese/dictionary?page=worddict&wdqb=%E5%AD%A6%E7%94%9F&wdrst=0)
  confirms `xué sheng`.
- [CC-CEDICT via MDBG: 大人](https://www.mdbg.net/chinese/dictionary?page=worddict&wdqb=%E5%A4%A7%E4%BA%BA&wdrst=0)
  supports the neutral-tone adult reading `dà ren` used here.
- [汉典: 太阳](https://zdic.net/hans/%E5%A4%AA%E9%98%B3) and
  [CC-CEDICT via MDBG: 干净](https://www.mdbg.net/chinese/dictionary?page=worddict&wdqb=%E5%B9%B2%E5%87%80)
  support their displayed full tones.

No external dictionary or pronunciation service is a runtime dependency.

## Build and tests

```sh
python tools/build_chinese_bank.py
python tools/build_chinese_bank.py --check
node tests/test_chinese_bank.cjs
```

Checks cover exact counts, stable unique IDs, unique Hanzi strings, all theme
labels/translations, stage values, the first 20 core entries, valid syllable
counts and tone-mark encoding, selected neutral/polyphonic pronunciation
fixtures, 24 real local image files, CommonJS/browser equality, generated-source
freshness, and the 20 targets' first-100 component IDs and exact character order.
Natural compound tone changes are checked explicitly, not rejected by blindly
concatenating isolated-character pinyin.

These data tests do not establish browser speech quality, native voice
availability, or device-level touch/accessibility behavior.
