/* Interface translations for the original counting, visual maths and word games.
 * Exercise answers retain their teaching language via translate="no".
 * Translate DOM text without rerendering or restarting an active question.
 */
(function () {
    'use strict';
    const i18n = window.KrisI18n;
    if (!i18n) return;

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
