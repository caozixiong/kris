(function () {
  "use strict";

  // Learning text stays English/French regardless of the interface language.
  // Every item ID is shared by its two language cards and is globally unique.
  // BEGIN GENERATED WORD BANK FALLBACK
  const wordTopics = [
    {
      "id": "animals",
      "labels": {
        "zh": "动物",
        "en": "Animals",
        "fr": "Les animaux"
      },
      "hints": {
        "zh": "把法语名词和冠词一起记。un / une 表示单数，des 表示复数；du / de la / de l’ 常用于不逐个计数的事物。语法性别不等于真实事物的性别。",
        "en": "Learn French nouns with their articles. Un / une mark singular nouns, des marks plurals, and du / de la / de l’ often describe uncounted amounts. Grammatical gender is a feature of the word.",
        "fr": "Apprends les noms avec leur article : un / une au singulier, des au pluriel, et du / de la / de l’ pour certaines quantités. Le genre grammatical appartient au mot."
      },
      "items": [
        {
          "id": "word_animals_cat",
          "theme": "animals",
          "level": 1,
          "pos": "noun",
          "en": "a cat",
          "fr": "un chat",
          "lemmaEn": "cat",
          "lemmaFr": "chat",
          "zh": "猫",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "🐱"
        },
        {
          "id": "word_animals_dog",
          "theme": "animals",
          "level": 1,
          "pos": "noun",
          "en": "a dog",
          "fr": "un chien",
          "lemmaEn": "dog",
          "lemmaFr": "chien",
          "zh": "狗",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "🐶"
        },
        {
          "id": "word_animals_rabbit",
          "theme": "animals",
          "level": 1,
          "pos": "noun",
          "en": "a rabbit",
          "fr": "un lapin",
          "lemmaEn": "rabbit",
          "lemmaFr": "lapin",
          "zh": "兔子",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "🐰"
        },
        {
          "id": "word_animals_bird",
          "theme": "animals",
          "level": 1,
          "pos": "noun",
          "en": "a bird",
          "fr": "un oiseau",
          "lemmaEn": "bird",
          "lemmaFr": "oiseau",
          "zh": "鸟",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "🐦"
        },
        {
          "id": "word_animals_fish",
          "theme": "animals",
          "level": 1,
          "pos": "noun",
          "en": "a fish",
          "fr": "un poisson",
          "lemmaEn": "fish",
          "lemmaFr": "poisson",
          "zh": "鱼",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "🐟"
        },
        {
          "id": "word_animals_horse",
          "theme": "animals",
          "level": 1,
          "pos": "noun",
          "en": "a horse",
          "fr": "un cheval",
          "lemmaEn": "horse",
          "lemmaFr": "cheval",
          "zh": "马",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "🐴"
        },
        {
          "id": "word_animals_cow",
          "theme": "animals",
          "level": 1,
          "pos": "noun",
          "en": "a cow",
          "fr": "une vache",
          "lemmaEn": "cow",
          "lemmaFr": "vache",
          "zh": "奶牛",
          "enArticle": "a",
          "article": "une",
          "gender": "f",
          "number": "singular",
          "emoji": "🐮"
        },
        {
          "id": "word_animals_duck",
          "theme": "animals",
          "level": 1,
          "pos": "noun",
          "en": "a duck",
          "fr": "un canard",
          "lemmaEn": "duck",
          "lemmaFr": "canard",
          "zh": "鸭子",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "🦆"
        }
      ]
    },
    {
      "id": "food",
      "labels": {
        "zh": "食物与饮品",
        "en": "Food and drinks",
        "fr": "Les aliments et les boissons"
      },
      "hints": {
        "zh": "把法语名词和冠词一起记。un / une 表示单数，des 表示复数；du / de la / de l’ 常用于不逐个计数的事物。语法性别不等于真实事物的性别。",
        "en": "Learn French nouns with their articles. Un / une mark singular nouns, des marks plurals, and du / de la / de l’ often describe uncounted amounts. Grammatical gender is a feature of the word.",
        "fr": "Apprends les noms avec leur article : un / une au singulier, des au pluriel, et du / de la / de l’ pour certaines quantités. Le genre grammatical appartient au mot."
      },
      "items": [
        {
          "id": "word_food_apple",
          "theme": "food",
          "level": 1,
          "pos": "noun",
          "en": "an apple",
          "fr": "une pomme",
          "lemmaEn": "apple",
          "lemmaFr": "pomme",
          "zh": "苹果",
          "enArticle": "an",
          "article": "une",
          "gender": "f",
          "number": "singular",
          "emoji": "🍎"
        },
        {
          "id": "word_food_banana",
          "theme": "food",
          "level": 1,
          "pos": "noun",
          "en": "a banana",
          "fr": "une banane",
          "lemmaEn": "banana",
          "lemmaFr": "banane",
          "zh": "香蕉",
          "enArticle": "a",
          "article": "une",
          "gender": "f",
          "number": "singular",
          "emoji": "🍌"
        },
        {
          "id": "word_food_orange",
          "theme": "food",
          "level": 1,
          "pos": "noun",
          "en": "an orange",
          "fr": "une orange",
          "lemmaEn": "orange",
          "lemmaFr": "orange",
          "zh": "橙子",
          "enArticle": "an",
          "article": "une",
          "gender": "f",
          "number": "singular",
          "emoji": "🍊"
        },
        {
          "id": "word_food_carrot",
          "theme": "food",
          "level": 1,
          "pos": "noun",
          "en": "a carrot",
          "fr": "une carotte",
          "lemmaEn": "carrot",
          "lemmaFr": "carotte",
          "zh": "胡萝卜",
          "enArticle": "a",
          "article": "une",
          "gender": "f",
          "number": "singular",
          "emoji": "🥕"
        },
        {
          "id": "word_food_tomato",
          "theme": "food",
          "level": 1,
          "pos": "noun",
          "en": "a tomato",
          "fr": "une tomate",
          "lemmaEn": "tomato",
          "lemmaFr": "tomate",
          "zh": "西红柿",
          "enArticle": "a",
          "article": "une",
          "gender": "f",
          "number": "singular",
          "emoji": "🍅"
        },
        {
          "id": "word_food_egg",
          "theme": "food",
          "level": 1,
          "pos": "noun",
          "en": "an egg",
          "fr": "un œuf",
          "lemmaEn": "egg",
          "lemmaFr": "œuf",
          "zh": "鸡蛋",
          "enArticle": "an",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "🥚"
        },
        {
          "id": "word_food_strawberry",
          "theme": "food",
          "level": 1,
          "pos": "noun",
          "en": "a strawberry",
          "fr": "une fraise",
          "lemmaEn": "strawberry",
          "lemmaFr": "fraise",
          "zh": "草莓",
          "enArticle": "a",
          "article": "une",
          "gender": "f",
          "number": "singular",
          "emoji": "🍓"
        },
        {
          "id": "word_food_cake",
          "theme": "food",
          "level": 1,
          "pos": "noun",
          "en": "a cake",
          "fr": "un gâteau",
          "lemmaEn": "cake",
          "lemmaFr": "gâteau",
          "zh": "蛋糕",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "🎂"
        }
      ]
    },
    {
      "id": "school",
      "labels": {
        "zh": "学校用品与学习",
        "en": "School and learning",
        "fr": "L'école et les études"
      },
      "hints": {
        "zh": "把法语名词和冠词一起记。un / une 表示单数，des 表示复数；du / de la / de l’ 常用于不逐个计数的事物。语法性别不等于真实事物的性别。",
        "en": "Learn French nouns with their articles. Un / une mark singular nouns, des marks plurals, and du / de la / de l’ often describe uncounted amounts. Grammatical gender is a feature of the word.",
        "fr": "Apprends les noms avec leur article : un / une au singulier, des au pluriel, et du / de la / de l’ pour certaines quantités. Le genre grammatical appartient au mot."
      },
      "items": [
        {
          "id": "word_school_book",
          "theme": "school",
          "level": 1,
          "pos": "noun",
          "en": "a book",
          "fr": "un livre",
          "lemmaEn": "book",
          "lemmaFr": "livre",
          "zh": "书",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "📖"
        },
        {
          "id": "word_school_pencil",
          "theme": "school",
          "level": 1,
          "pos": "noun",
          "en": "a pencil",
          "fr": "un crayon",
          "lemmaEn": "pencil",
          "lemmaFr": "crayon",
          "zh": "铅笔",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "✏️"
        },
        {
          "id": "word_school_pen",
          "theme": "school",
          "level": 1,
          "pos": "noun",
          "en": "a pen",
          "fr": "un stylo",
          "lemmaEn": "pen",
          "lemmaFr": "stylo",
          "zh": "钢笔或圆珠笔",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "🖊️"
        },
        {
          "id": "word_school_notebook",
          "theme": "school",
          "level": 1,
          "pos": "noun",
          "en": "a notebook",
          "fr": "un cahier",
          "lemmaEn": "notebook",
          "lemmaFr": "cahier",
          "zh": "练习本",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "📓"
        },
        {
          "id": "word_school_ruler",
          "theme": "school",
          "level": 1,
          "pos": "noun",
          "en": "a ruler",
          "fr": "une règle",
          "lemmaEn": "ruler",
          "lemmaFr": "règle",
          "zh": "尺子",
          "enArticle": "a",
          "article": "une",
          "gender": "f",
          "number": "singular",
          "emoji": "📏"
        },
        {
          "id": "word_school_eraser",
          "theme": "school",
          "level": 1,
          "pos": "noun",
          "en": "an eraser",
          "fr": "une gomme à effacer",
          "lemmaEn": "eraser",
          "lemmaFr": "gomme à effacer",
          "zh": "橡皮擦",
          "enArticle": "an",
          "article": "une",
          "gender": "f",
          "number": "singular"
        },
        {
          "id": "word_school_schoolbag",
          "theme": "school",
          "level": 1,
          "pos": "noun",
          "en": "a schoolbag",
          "fr": "un sac d'école",
          "lemmaEn": "schoolbag",
          "lemmaFr": "sac d'école",
          "zh": "书包",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "🎒"
        },
        {
          "id": "word_school_chair",
          "theme": "school",
          "level": 1,
          "pos": "noun",
          "en": "a chair",
          "fr": "une chaise",
          "lemmaEn": "chair",
          "lemmaFr": "chaise",
          "zh": "椅子",
          "enArticle": "a",
          "article": "une",
          "gender": "f",
          "number": "singular",
          "emoji": "🪑"
        }
      ]
    },
    {
      "id": "nature",
      "labels": {
        "zh": "大自然",
        "en": "Nature",
        "fr": "La nature"
      },
      "hints": {
        "zh": "把法语名词和冠词一起记。un / une 表示单数，des 表示复数；du / de la / de l’ 常用于不逐个计数的事物。语法性别不等于真实事物的性别。",
        "en": "Learn French nouns with their articles. Un / une mark singular nouns, des marks plurals, and du / de la / de l’ often describe uncounted amounts. Grammatical gender is a feature of the word.",
        "fr": "Apprends les noms avec leur article : un / une au singulier, des au pluriel, et du / de la / de l’ pour certaines quantités. Le genre grammatical appartient au mot."
      },
      "items": [
        {
          "id": "word_nature_tree",
          "theme": "nature",
          "level": 1,
          "pos": "noun",
          "en": "a tree",
          "fr": "un arbre",
          "lemmaEn": "tree",
          "lemmaFr": "arbre",
          "zh": "树",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "🌳"
        },
        {
          "id": "word_nature_flower",
          "theme": "nature",
          "level": 1,
          "pos": "noun",
          "en": "a flower",
          "fr": "une fleur",
          "lemmaEn": "flower",
          "lemmaFr": "fleur",
          "zh": "花",
          "enArticle": "a",
          "article": "une",
          "gender": "f",
          "number": "singular",
          "emoji": "🌸"
        },
        {
          "id": "word_nature_leaf",
          "theme": "nature",
          "level": 1,
          "pos": "noun",
          "en": "a leaf",
          "fr": "une feuille",
          "lemmaEn": "leaf",
          "lemmaFr": "feuille",
          "zh": "树叶",
          "enArticle": "a",
          "article": "une",
          "gender": "f",
          "number": "singular",
          "emoji": "🍃"
        },
        {
          "id": "word_nature_mountain",
          "theme": "nature",
          "level": 1,
          "pos": "noun",
          "en": "a mountain",
          "fr": "une montagne",
          "lemmaEn": "mountain",
          "lemmaFr": "montagne",
          "zh": "山",
          "enArticle": "a",
          "article": "une",
          "gender": "f",
          "number": "singular",
          "emoji": "⛰️"
        },
        {
          "id": "word_nature_river",
          "theme": "nature",
          "level": 1,
          "pos": "noun",
          "en": "a river",
          "fr": "une rivière",
          "lemmaEn": "river",
          "lemmaFr": "rivière",
          "zh": "河流",
          "enArticle": "a",
          "article": "une",
          "gender": "f",
          "number": "singular"
        },
        {
          "id": "word_nature_cloud",
          "theme": "nature",
          "level": 1,
          "pos": "noun",
          "en": "a cloud",
          "fr": "un nuage",
          "lemmaEn": "cloud",
          "lemmaFr": "nuage",
          "zh": "云",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "☁️"
        },
        {
          "id": "word_nature_star",
          "theme": "nature",
          "level": 1,
          "pos": "noun",
          "en": "a star",
          "fr": "une étoile",
          "lemmaEn": "star",
          "lemmaFr": "étoile",
          "zh": "星星",
          "enArticle": "a",
          "article": "une",
          "gender": "f",
          "number": "singular",
          "emoji": "⭐"
        },
        {
          "id": "word_nature_rainbow",
          "theme": "nature",
          "level": 1,
          "pos": "noun",
          "en": "a rainbow",
          "fr": "un arc-en-ciel",
          "lemmaEn": "rainbow",
          "lemmaFr": "arc-en-ciel",
          "zh": "彩虹",
          "enArticle": "a",
          "article": "un",
          "gender": "m",
          "number": "singular",
          "emoji": "🌈"
        }
      ]
    }
  ];
  // END GENERATED WORD BANK FALLBACK

  const sentenceTopics = [
    {
      id: "morning",
      labels: { zh: "早晨日常", en: "Morning routine", fr: "La routine du matin" },
      hints: {
        zh: "先想象整句话的动作。醒来和离开床是两个动作；法语里，给自己做的动作常出现 me 或 m'。",
        en: "Picture the whole action. Waking up and getting out of bed are different actions. French often uses me or m' for things you do to yourself.",
        fr: "Imagine l'action entière. Se réveiller et sortir du lit sont deux actions différentes. Me ou m' accompagne souvent une action faite sur soi."
      },
      items: [
        { id: "sentence_morning_wake", en: "I wake up.", fr: "Je me réveille." },
        { id: "sentence_morning_get_up", en: "I get up.", fr: "Je me lève." },
        { id: "sentence_morning_face", en: "I wash my face.", fr: "Je me lave le visage." },
        { id: "sentence_morning_teeth", en: "I brush my teeth.", fr: "Je me brosse les dents." },
        { id: "sentence_morning_dressed", en: "I get dressed.", fr: "Je m'habille." },
        { id: "sentence_morning_breakfast", en: "I eat breakfast.", fr: "Je prends mon petit déjeuner." },
        { id: "sentence_morning_water", en: "I drink water.", fr: "Je bois de l'eau." },
        { id: "sentence_morning_school", en: "I go to school.", fr: "Je vais à l'école." }
      ]
    },
    {
      id: "classroom",
      labels: { zh: "在学校", en: "At school", fr: "À l'école" },
      hints: {
        zh: "先找动作，再看物品。je 在元音音素前通常缩写成 j'；mon 和 ma 会随法语名词变化。",
        en: "Look for the action first, then the object. Je usually becomes j' before a vowel sound; mon and ma change with the French noun.",
        fr: "Cherche d'abord l'action, puis l'objet. Je devient généralement j' devant un son voyelle ; mon et ma dépendent du nom."
      },
      items: [
        { id: "sentence_classroom_open_book", en: "I open my book.", fr: "J'ouvre mon livre." },
        { id: "sentence_classroom_first_name", en: "I write my first name.", fr: "J'écris mon prénom." },
        { id: "sentence_classroom_read", en: "I read a story.", fr: "Je lis une histoire." },
        { id: "sentence_classroom_draw", en: "I draw a house.", fr: "Je dessine une maison." },
        { id: "sentence_classroom_hand", en: "I raise my hand.", fr: "Je lève la main." },
        { id: "sentence_classroom_listen", en: "I listen to the lesson.", fr: "J'écoute la leçon." },
        { id: "sentence_classroom_question", en: "I ask a question.", fr: "Je pose une question." },
        { id: "sentence_classroom_close_notebook", en: "I close my notebook.", fr: "Je ferme mon cahier." }
      ]
    },
    {
      id: "home",
      labels: { zh: "在家里", en: "At home", fr: "À la maison" },
      hints: {
        zh: "按整句话的意思配对，不必逐字翻译。法语 les 表示复数，后面的名词通常以 s 结尾。",
        en: "Match the meaning of the whole phrase instead of translating word by word. French les marks a plural; the noun often ends in s.",
        fr: "Associe le sens de toute la phrase plutôt que de traduire mot à mot. Les indique le pluriel ; le nom se termine souvent par s."
      },
      items: [
        { id: "sentence_home_hands", en: "I wash my hands.", fr: "Je me lave les mains." },
        { id: "sentence_home_table", en: "I set the table.", fr: "Je mets la table." },
        { id: "sentence_home_apple", en: "I eat an apple.", fr: "Je mange une pomme." },
        { id: "sentence_home_room", en: "I tidy my room.", fr: "Je range ma chambre." },
        { id: "sentence_home_cat", en: "I feed my cat.", fr: "Je nourris mon chat." },
        { id: "sentence_home_dog", en: "I play with my dog.", fr: "Je joue avec mon chien." },
        { id: "sentence_home_plants", en: "I water the plants.", fr: "J'arrose les plantes." },
        { id: "sentence_home_bed", en: "I go to bed.", fr: "Je vais me coucher." }
      ]
    },
    {
      id: "friends",
      labels: { zh: "朋友之间", en: "With friends", fr: "Avec les amis" },
      hints: {
        zh: "这些句子用于和一位朋友说话。法语用 tu 表示熟悉的“你”；问句的词序可能和英语不同。",
        en: "These phrases are for talking to one friend. French tu is the familiar, singular you. Questions can have a different word order from English.",
        fr: "Ces phrases s'adressent à un seul ami. Tu désigne une personne que l'on connaît bien. L'ordre des mots des questions peut changer entre les langues."
      },
      items: [
        { id: "sentence_friends_hello", en: "Hello!", fr: "Bonjour !" },
        { id: "sentence_friends_name_question", en: "What is your name?", fr: "Comment t'appelles-tu ?" },
        { id: "sentence_friends_name_answer", en: "My name is Alex.", fr: "Je m'appelle Alex." },
        { id: "sentence_friends_how_are_you", en: "How are you?", fr: "Comment vas-tu ?" },
        { id: "sentence_friends_fine", en: "I'm fine, thank you.", fr: "Je vais bien, merci." },
        { id: "sentence_friends_play", en: "Do you want to play?", fr: "Tu veux jouer ?" },
        { id: "sentence_friends_turn", en: "It's your turn.", fr: "C'est ton tour." },
        { id: "sentence_friends_tomorrow", en: "See you tomorrow!", fr: "À demain !" }
      ]
    }
  ];

  // The shared school vocabulary bank is the single source when loaded.
  // The compact fallback keeps these games playable if the bank asset is unavailable.
  const sharedTopics = window.KrisWordBank?.topics;
  const usingSharedBank = Array.isArray(sharedTopics) && sharedTopics.length > 0;
  const activeWordTopics = usingSharedBank ? sharedTopics : wordTopics;
  const allWords = {
    id: 'all-words',
    labels: {zh: '全部词库', en: 'Whole word bank', fr: 'Toute la banque'},
    hints: {
      zh: '从全部主题随机抽词。注意名词前的 un、une 或 des，也观察词语的含义。每局都会避开容易混淆的重复写法。',
      en: 'Explore words from every theme. Notice un, une or des before French nouns and think about the meaning. Each round avoids repeated spellings that could make a match unclear.',
      fr: 'Explore les mots de tous les thèmes. Observe un, une ou des devant les noms et cherche le sens. Chaque manche évite les mots identiques qui rendraient les paires ambiguës.'
    },
    items: activeWordTopics.flatMap(topic => topic.items)
  };
  window.BilingualData = {
    wordTopics: activeWordTopics,
    usingSharedBank,
    wordGameTopics: [allWords, ...activeWordTopics],
    sentenceTopics
  };
})();
