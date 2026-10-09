/* Interface translations for the original counting, visual maths and word games.
 * Exercise answers retain their teaching language via translate="no".
 * Translate DOM text without rerendering or restarting an active question.
 */
(function () {
    'use strict';
    const i18n = window.KrisI18n;
    if (!i18n) return;

    i18n.register({
        "点一点图形，做上数数标记。收集十颗种子，种满你的花园！": [
                "Tap each shape to mark your count. Collect seeds to fill your ten-plot garden!",
                "Touche chaque forme pour la compter. Récolte des graines pour les dix cases de ton jardin !"
        ],
        "标记一个图形": [
                "Mark one shape",
                "Marquer une forme"
        ],
        "走进图画小镇，找到图片对应的汉字。每答一题，收藏一张词语卡！": [
                "Explore Picture Town and match each picture to its Chinese word. Collect a word card at every stop!",
                "Explore le village des images et trouve le mot chinois correspondant. Collectionne une carte à chaque étape !"
        ],
        "旅程进度": [
                "Journey progress",
                "Progression du voyage"
        ],
        "用十格盘观察小鸡和火柴棒，解开八个图画谜题。": [
                "Count chicks and matchsticks in groups of ten to solve eight picture puzzles.",
                "Compte les poussins et les allumettes par groupes de dix pour résoudre huit énigmes."
        ],
        "给数字小火车装上八节车厢！看数轴，发现加减法的路线。": [
                "Build an eight-car number train! Explore addition and subtraction along the number line.",
                "Construis un train de huit wagons ! Explore les additions et les soustractions sur la ligne des nombres."
        ],
        "轻松探索": [
                "Explore at your pace",
                "Explore à ton rythme"
        ],
        "温柔计时提醒": [
                "Gentle timer reminder",
                "Rappel de temps tout doux"
        ],
        "提醒间隔:": [
                "Reminder interval:",
                "Intervalle du rappel :"
        ],
        "提醒倒计时:": [
                "Reminder in:",
                "Prochain rappel :"
        ],
        "打开数学工具": [
                "Open maths tools",
                "Ouvrir les outils maths"
        ],
        "收起数学工具": [
                "Hide maths tools",
                "Fermer les outils maths"
        ],
        "数轴": [
                "Number line",
                "Ligne des nombres"
        ],
        "慢慢来，时间不影响得分。你可以继续思考。": [
                "Take your time. The timer does not affect your score. Keep thinking!",
                "Prends ton temps. Le chrono ne change pas ton score. Tu peux continuer à réfléchir !"
        ],
        "翻开一张汉字卡，再找它的图画朋友。把找到的汉字收藏进灯笼小巷。": [
                "Find each Chinese character’s picture partner. Collect your discoveries in Lantern Lane.",
                "Trouve l’image de chaque caractère chinois. Collectionne tes découvertes dans la ruelle des lanternes."
        ],
        "卡片数量": [
                "Number of cards",
                "Nombre de cartes"
        ],
        "6 对 · 小巷": [
                "6 pairs · Lane",
                "6 paires · Ruelle"
        ],
        "12 对 · 花园": [
                "12 pairs · Garden",
                "12 paires · Jardin"
        ],
        "20 对 · 全部汉字": [
                "20 pairs · All characters",
                "20 paires · Tous les caractères"
        ],
        "先翻汉字或图片，再寻找它的朋友。": [
                "Turn over a character or picture, then find its partner.",
                "Retourne un caractère ou une image, puis trouve sa paire."
        ],
        "再翻一张，找出配对。": [
                "Turn over one more card to find a pair.",
                "Retourne une autre carte pour trouver la paire."
        ],
        "记住这两个位置，再试一次。": [
                "Remember these two places and try again.",
                "Mémorise ces deux positions et réessaie."
        ],
        "喂饱数字机器人！点击或拖动积木，让总数正好等于目标。走错一步可以撤回。": [
                "Feed the number robot! Tap or drag blocks to reach the exact target. You can undo a move.",
                "Nourris le robot des nombres ! Touche ou glisse les blocs pour atteindre la cible exacte. Tu peux annuler un déplacement."
        ],
        "机器人徽章": [
                "Robot badges",
                "Badges du robot"
        ],
        "撤回一步": [
                "Undo one move",
                "Annuler un déplacement"
        ],
        "机器人充满能量！": [
                "The robot is fully powered!",
                "Le robot a fait le plein d’énergie !"
        ],
        "点击积木或拖到这里": [
                "Tap a block or drop it here",
                "Touche un bloc ou dépose-le ici"
        ],
        "这块太大了，试试另一块。": [
                "That block is too big. Try another one.",
                "Ce bloc est trop grand. Essaie un autre bloc."
        ],
        "带着词语护照去旅行！每五个词到达一站，最后可以重练需要帮助的词。": [
                "Travel with a word passport! Reach a new stop every five words, then revisit words that need practice.",
                "Voyage avec ton passeport de mots ! Une étape tous les cinq mots, puis révise ceux qui demandent de l’entraînement."
        ],
        "词语护照": [
                "Word passport",
                "Passeport de mots"
        ],
        "重练这些词": [
                "Practise these words again",
                "Revoir ces mots"
        ]
});

    i18n.register({
        '一年级数字游戏': ['First-grade counting game', 'Jeu de nombres pour le CP'],
        '数一数有多少个图形？': ['How many shapes can you count?', 'Combien de formes comptes-tu ?'],
        'Kris，加油！': ['You can do it, Kris!', 'Vas-y, Kris !'],
        '得分:': ['Score:', 'Score :'],
        '答对了！': ['Correct!', 'Bonne réponse !'],
        '20以内加减法练习': ['Addition and subtraction up to 20', 'Additions et soustractions jusqu’à 20'],
        '时间限制:': ['Time limit:', 'Temps par question :'],
        '秒': ['s', 's'],
        '减少时间': ['Decrease time', 'Réduire le temps'],
        '增加时间': ['Increase time', 'Augmenter le temps'],
        '剩余秒数': ['Seconds remaining', 'Secondes restantes'],
        '剩余时间:': ['Time left:', 'Temps restant :'],
        '点击“开始游戏”': ['Click “Start game”', 'Clique sur « Jouer »'],
        '开始游戏': ['Start game', 'Jouer'],
        '下一题': ['Next question', 'Question suivante'],
        '正确!': ['Correct!', 'Bonne réponse !'],
        '趣味视觉数学练习': ['Visual maths practice', 'Les maths en images'],
        '选择主题:': ['Choose a theme:', 'Choisis un thème :'],
        '火柴棒': ['Matchsticks', 'Allumettes'],
        '小鸡': ['Chicks', 'Poussins'],
        '选择主题后，点击开始游戏': ['Choose a theme, then click Start game', 'Choisis un thème, puis clique sur Jouer'],
        '看图识字': ['Chinese picture quiz', 'Les mots chinois en images'],
        '题目图片': ['Quiz picture', 'Image de la question'],
        '太棒了!': ['Great!', 'Bravo !'],
        '再玩一次': ['Play again', 'Rejouer'],
        '汉字寻宝翻翻乐': ['Chinese character matching', 'Les paires de caractères chinois'],
        '| 尝试次数:': ['| Attempts:', '| Essais :'],
        '尝试次数:': ['Attempts:', 'Nombre d’essais :'],
        '重新开始': ['Restart', 'Recommencer'],
        '恭喜你！全部找到了！': ['Well done! You found every pair!', 'Bravo ! Tu as trouvé toutes les paires !'],
        '形状加减法': ['Shape Sorter Math', 'Additions et soustractions avec les formes'],
        '加法模式': ['Addition mode', 'Mode addition'],
        '减法模式': ['Subtraction mode', 'Mode soustraction'],
        '目标总和': ['Target sum', 'Somme à atteindre'],
        '目标数值': ['Target to reach', 'Nombre à atteindre'],
        '初始总和:': ['Initial sum:', 'Somme de départ :'],
        '当前总和:': ['Current sum:', 'Somme actuelle :'],
        '拖到这里！': ['Drop here!', 'Dépose les formes ici !'],
        '新题目': ['New problem', 'Nouvel exercice'],
        '词汇测验': ['Vocabulary Quiz', 'Quiz de vocabulaire'],
        '返回首页': ['Back to home', 'Retour à l’accueil'],
        '练习模式': ['Practice mode', 'Mode d’entraînement'],
        '答案选项': ['Answer options', 'Réponses possibles'],
        '英译法 · 共享词库': ['English → French · Shared word bank', 'Anglais → français · Banque de mots'],
        '原版英语释义 · 15 词': ['Original English definitions · 15 words', 'Définitions anglaises originales · 15 mots'],
        '原版练习：为 15 个英语单词选择正确的英语释义。': ['Original practice: choose the English definition for each of 15 English words.', 'Entraînement original : choisis la définition anglaise de chacun des 15 mots anglais.'],
        '共享词库未能加载。你仍可练习原版 15 词；刷新页面可重试。': ['The shared word bank could not load. You can still practise the original 15 words; refresh to try again.', 'La banque de mots n’a pas pu se charger. Tu peux pratiquer les 15 mots originaux ; actualise la page pour réessayer.'],
        '请启用 JavaScript 来玩词汇测验。': ['Please enable JavaScript to play the vocabulary quiz.', 'Active JavaScript pour jouer au quiz de vocabulaire.'],
        '检查答案': ['Check answer', 'Vérifier la réponse'],
        '下一个单词': ['Next word', 'Mot suivant'],
        '测验完成！': ['Quiz finished!', 'Quiz terminé !'],
        '你已完成所有单词！': ['You have completed all the words!', 'Tu as terminé tous les mots !'],
        '重新测验': ['Restart quiz', 'Recommencer le quiz'],
        '请选择一个选项。': ['Please select an option.', 'Choisis une réponse.'],
        '正确！': ['Correct!', 'Bonne réponse !']
    });

    i18n.registerPatterns([
        {pattern:/^花园完成！收集了 (\d+) 颗种子。$/,en:n=>`Garden complete! You collected ${n} seeds.`,fr:n=>`Jardin terminé ! Tu as récolté ${n} graines.`},
        {pattern:/^旅程完成！答对 (\d+) \/ 8 题。$/,en:n=>`Journey complete! ${n} / 8 correct.`,fr:n=>`Voyage terminé ! ${n} / 8 bonnes réponses.`},
        {pattern:/^未翻开的卡片 (\d+)$/,en:n=>`Face-down card ${n}`,fr:n=>`Carte cachée ${n}`},
        {pattern:/^汉字卡: (.+)$/,en:s=>`Character card: ${s}`,fr:s=>`Carte caractère : ${s}`},
        {pattern:/^图片卡: (.+)$/,en:s=>`Picture card: ${s}`,fr:s=>`Carte image : ${s}`},
        {pattern:/^找到 (\d+) \/ (\d+) 对！$/,en:(n,t)=>`Found ${n} / ${t} pairs!`,fr:(n,t)=>`${n} / ${t} paires trouvées !`},
        {pattern:/^数值 (\d+) 的积木$/,en:n=>`Block with value ${n}`,fr:n=>`Bloc de valeur ${n}`},
        {pattern:/^还差 (\d+)，继续试一试。$/,en:n=>`${n} to go. Keep exploring!`,fr:n=>`Encore ${n}. Continue à explorer !`},
        {pattern:/^已完成 (\d+) 个机器人$/,en:n=>`${n} robots completed`,fr:n=>`${n} robots terminés`},
        {pattern:/^旅行站点 (\d+) \/ (\d+)$/,en:(n,t)=>`Travel stop ${n} / ${t}`,fr:(n,t)=>`Étape du voyage ${n} / ${t}`},
        {pattern:/^再练 (\d+) 个词，把它们记得更牢！$/,en:n=>`Practise these ${n} words again to remember them!`,fr:n=>`Revois ces ${n} mots pour mieux les retenir !`},

        {
            pattern: /^从 (\d+) 个英法词汇中随机抽取 (\d+) 题。请选择对应的法语。$/,
            en: (count, total) => `${total} random questions from ${count} English–French words. Choose the French translation.`,
            fr: (count, total) => `${total} questions au hasard parmi ${count} mots anglais–français. Choisis la traduction française.`
        },
        {
            pattern: /^题目: (\d+) \/ (\d+)$/,
            en: (number, total) => `Question: ${number} / ${total}`,
            fr: (number, total) => `Question : ${number} / ${total}`
        },
        {
            pattern: /^答对: (\d+) \/ (\d+)$/,
            en: (number, total) => `Correct: ${number} / ${total}`,
            fr: (number, total) => `Bonnes réponses : ${number} / ${total}`
        },
        {
            pattern: /^答错了，正确答案是 (\d+)$/,
            en: n => `Not quite. The correct answer is ${n}`,
            fr: n => `Pas tout à fait. La bonne réponse est ${n}`
        },
        {
            pattern: /^时间到！答案是 (\d+)$/,
            en: n => `Time’s up! The answer is ${n}`,
            fr: n => `Temps écoulé ! La réponse est ${n}`
        },
        {
            pattern: /^错误！答案是 (\d+)$/,
            en: n => `Incorrect. The answer is ${n}`,
            fr: n => `Mauvaise réponse. La réponse est ${n}`
        },
        {
            pattern: /^\[火柴棒 (\d+)\]$/,
            en: n => `[${n} ${Number(n) === 1 ? 'matchstick' : 'matchsticks'}]`,
            fr: n => `[${n} ${Number(n) > 1 ? 'allumettes' : 'allumette'}]`
        },
        {
            pattern: /^\[小鸡 (\d+)\]$/,
            en: n => `[${n} ${Number(n) === 1 ? 'chick' : 'chicks'}]`,
            fr: n => `[${n} ${Number(n) > 1 ? 'poussins' : 'poussin'}]`
        },
        {
            pattern: /^得分: (\d+)$/,
            en: n => `Score: ${n}`,
            fr: n => `Score : ${n}`
        },
        {
            pattern: /^游戏结束! 你的总分是: (\d+) \/ (\d+)$/,
            en: (n, total) => `Game over! Your total score: ${n} / ${total}`,
            fr: (n, total) => `Partie terminée ! Ton score : ${n} / ${total}`
        },
        {
            pattern: /^错误! 正确的是: (.+)$/,
            en: word => `Incorrect. The correct answer is: ${word}`,
            fr: word => `Mauvaise réponse. La bonne réponse est : ${word}`
        },
        {
            pattern: /^总和: (\d+)$/,
            en: n => `Sum: ${n}`,
            fr: n => `Somme : ${n}`
        },
        {
            pattern: /^不正确。正确答案是：“(.+)”$/,
            en: definition => `Incorrect. The correct answer was: “${definition}”`,
            fr: definition => `Mauvaise réponse. La bonne réponse était : « ${definition} »`
        }
    ]);
})();
