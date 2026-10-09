/* Complete UI catalog for the legacy maths collections and standalone games.
 * Only display strings are translated. Numeric state, fruit choice keys, game
 * modes and timers remain untouched when the shared language changes. */
(function () {
    'use strict';
    const i18n = window.KrisI18n;
    if (!i18n) return;
    const rows = [
    ["请输入完整的非负整数。", "Enter a whole number, zero or above.", "Saisis un nombre entier égal ou supérieur à zéro."],
    ["开始游戏后可探索模型。", "Start the game to explore its model.", "Commence le jeu pour explorer son modèle."],
    ["自由探索，无倒计时", "Free exploration, no countdown", "Exploration libre, sans compte à rebours"],
    [
        "图形探险队",
        "Shape explorers",
        "Explorateurs de formes"
    ],
    [
        "点一点，给每个图形做记号，再选出总数。",
        "Tap each shape to mark it, then choose the total.",
        "Touche chaque forme pour la marquer, puis choisis le total."
    ],
    [
        "双篮采集站",
        "Two-basket treasure hunt",
        "Les deux paniers au trésor"
    ],
    [
        "分别数出两篮宝物，再把它们合在一起。",
        "Count the treasures in each basket, then put them together.",
        "Compte les trésors de chaque panier, puis réunis-les."
    ],
    [
        "图形侦探社",
        "Shape detective agency",
        "Les détectives des formes"
    ],
    [
        "先按种类分组，再找到两组的总数。",
        "Sort by shape first, then find the total of both groups.",
        "Trie les formes, puis trouve le total des deux groupes."
    ],
    [
        "星光保龄球",
        "Starlight bowling",
        "Bowling des étoiles"
    ],
    [
        "先数球瓶，滚球后看看还站着多少。",
        "Count the pins, roll the ball, and see how many remain standing.",
        "Compte les quilles, lance la boule et regarde combien restent debout."
    ],
    [
        "彩虹药水实验室",
        "Rainbow potion lab",
        "Le labo des potions arc-en-ciel"
    ],
    [
        "已知的一份加上神秘的一份，刚好装满药水。",
        "The known part and the mystery part fill the potion exactly.",
        "La partie connue et la partie mystère remplissent la potion."
    ],
    [
        "森林小集市",
        "Woodland mini-market",
        "Le petit marché de la forêt"
    ],
    [
        "用金币模型比较价格，看看预算够不够。",
        "Compare prices with coin models. What can your budget buy?",
        "Compare les prix avec les pièces. Que permet ton budget ?"
    ],
    [
        "星球航线规划师",
        "Planet route planner",
        "Pilote des planètes"
    ],
    [
        "试走一步，看看每次跳跃让位置怎样变化。",
        "Try one jump and see how each jump changes your position.",
        "Essaie un saut et observe comment ta position change."
    ],
    [
        "点亮英雄城",
        "Light up Hero City",
        "Illumine la ville des héros"
    ],
    [
        "解开算式，为城市点亮一扇新窗。",
        "Solve an equation to light up another part of the city.",
        "Résous un calcul pour illuminer un autre coin de la ville."
    ],
    [
        "机器人建造工坊",
        "Robot builder workshop",
        "L’atelier des robots"
    ],
    [
        "加法合并，减法拿走，乘法排成相同的组。",
        "Add by combining, subtract by taking away, multiply with equal groups.",
        "Additionne en réunissant, soustrais en retirant, multiplie avec des groupes égaux."
    ],
    [
        "二十格数字桥",
        "Twenty-space number bridge",
        "Le pont de vingt cases"
    ],
    [
        "用十格框看清数量，慢慢想也没关系。",
        "Use the counting frames to see the amounts. Take your time.",
        "Utilise les cadres pour voir les quantités. Prends ton temps."
    ],
    [
        "小鸡与火柴工作室",
        "Chick and matchstick studio",
        "L’atelier des poussins et des allumettes"
    ],
    [
        "切换实物模型，看看同一个算式的不同样子。",
        "Switch objects to see the same equation in different ways.",
        "Change d’objets pour voir le même calcul autrement."
    ],
    [
        "给物品做记号",
        "Mark object",
        "Marquer l’objet"
    ],
    [
        "收起模型",
        "Hide model",
        "Masquer le modèle"
    ],
    [
        "打开探索模型",
        "Explore the model",
        "Explorer le modèle"
    ],
    [
        "重置模型",
        "Reset model",
        "Réinitialiser le modèle"
    ],
    [
        "试走一步",
        "Try one jump",
        "Essayer un saut"
    ],
    [
        "药水总量",
        "Total potion",
        "Potion totale"
    ],
    [
        "空格还需要多少滴？",
        "How many drops fill the empty spaces?",
        "Combien de gouttes pour remplir les espaces vides ?"
    ],
    [
        "探险印章",
        "Adventure stamps",
        "Tampons d’exploration"
    ],
    [
        "本段旅程",
        "This journey",
        "Cette étape"
    ],
    [
        "五枚印章！下一段旅程出发。",
        "Five stamps! A new journey awaits.",
        "Cinq tampons ! Une nouvelle étape t’attend."
    ],
    [
        "新印章到手！看看你的解题模型。",
        "A new stamp! Explore the model of your solution.",
        "Un nouveau tampon ! Explore le modèle de ta solution."
    ],
    [
        "试着用模型找一找，再继续探索。",
        "Try the model, then keep exploring.",
        "Essaie le modèle, puis continue à explorer."
    ]
,

    [
        "儿童互动数学游戏",
        "Interactive Math Games for Kids",
        "Jeux de maths interactifs pour enfants"
    ],
    [
        "这里有多少个图形？",
        "How many shapes are there?",
        "Combien y a-t-il de formes ?"
    ],
    [
        "加油，Kris！",
        "You can do it, Kris!",
        "Tu peux y arriver, Kris !"
    ],
    [
        "得分:",
        "Score:",
        "Score :"
    ],
    [
        "更具挑战性",
        "More Challenging",
        "Plus difficile"
    ],
    [
        "开始",
        "Start",
        "Commencer"
    ],
    [
        "水果摊游戏",
        "Fruit Stand Fun",
        "Le marché aux fruits"
    ],
    [
        "苹果",
        "Apple",
        "Pomme"
    ],
    [
        "香蕉",
        "Banana",
        "Banane"
    ],
    [
        "橘子",
        "Orange",
        "Orange"
    ],
    [
        "葡萄",
        "Grapes",
        "Raisin"
    ],
    [
        "梨",
        "Pear",
        "Poire"
    ],
    [
        "你能买什么？",
        "What can you buy?",
        "Que peux-tu acheter ?"
    ],
    [
        "你能买得起什么？",
        "What can you afford?",
        "Que peux-tu acheter avec tes pièces ?"
    ],
    [
        "两个都要",
        "Both",
        "Les deux"
    ],
    [
        "什么也买不了",
        "Nothing",
        "Rien"
    ],
    [
        "帮助外星人跳回目标星球！",
        "Help the Alien reach the Planet by jumping back!",
        "Aide l’extraterrestre à rejoindre sa planète en sautant en arrière !"
    ],
    [
        "需要跳几步才能到星球？",
        "How many jumps to the planet?",
        "Combien de sauts faut-il pour atteindre la planète ?"
    ],
    [
        "正确!",
        "Correct!",
        "Bravo !"
    ],
    [
        "答对了！",
        "Correct!",
        "Bravo !"
    ],
    [
        "下一程",
        "Next Trip",
        "Prochain voyage"
    ],
    [
        "等级",
        "Level",
        "Niveau"
    ],
    [
        "分数",
        "Score",
        "Score"
    ],
    [
        "生命",
        "Lives",
        "Vies"
    ],
    [
        "快回答，小英雄！",
        "Answer quickly, little hero!",
        "Réponds vite, petit héros !"
    ],
    [
        "输入答案",
        "Enter answer",
        "Saisis ta réponse"
    ],
    [
        "提交答案",
        "Submit Answer",
        "Valider la réponse"
    ],
    [
        "可解锁的英雄",
        "Unlockable Heroes",
        "Héros à débloquer"
    ],
    [
        "英雄 1",
        "Hero 1",
        "Héros 1"
    ],
    [
        "英雄 2",
        "Hero 2",
        "Héros 2"
    ],
    [
        "英雄 3",
        "Hero 3",
        "Héros 3"
    ],
    [
        "超人克拉克",
        "Clark the Super",
        "Superman Clark"
    ],
    [
        "大黄蜂",
        "Bumblebee Bot",
        "Bumblebee"
    ],
    [
        "钢铁侠",
        "Iron Avenger",
        "Iron Man"
    ],
    [
        "太棒了！",
        "Excellent!",
        "Excellent !"
    ],
    [
        "太棒了!",
        "Great Job!",
        "Super !"
    ],
    [
        "真棒！",
        "Super Job!",
        "Bravo !"
    ],
    [
        "做得好，Kris！",
        "Good Job Kris!",
        "Bien joué, Kris !"
    ],
    [
        "回答正确！你获得了20分！",
        "Your answer is correct! You earned 20 points!",
        "Bonne réponse ! Tu gagnes 20 points !"
    ],
    [
        "下一题",
        "Next Question",
        "Question suivante"
    ],
    [
        "再试一次！",
        "Try Again!",
        "Réessaie !"
    ],
    [
        "再试一次!",
        "Try again!",
        "Réessaie !"
    ],
    [
        "正确答案是",
        "The correct answer was",
        "La bonne réponse était"
    ],
    [
        "。别灰心！",
        ". Don't give up!",
        ". Ne te décourage pas !"
    ],
    [
        "继续挑战",
        "Continue",
        "Continuer"
    ],
    [
        "游戏结束！",
        "Game Over!",
        "Partie terminée !"
    ],
    [
        "游戏结束!",
        "Game Over!",
        "Partie terminée !"
    ],
    [
        "最终得分:",
        "Final Score:",
        "Score final :"
    ],
    [
        "再玩一次",
        "Play Again",
        "Rejouer"
    ],
    [
        "儿童算术游戏",
        "Kids' Arithmetic Game",
        "Calcul pour les enfants"
    ],
    [
        "小朋友算术游戏",
        "Children’s Arithmetic Game",
        "Le jeu de calcul des enfants"
    ],
    [
        "加法",
        "Addition",
        "Addition"
    ],
    [
        "减法",
        "Subtraction",
        "Soustraction"
    ],
    [
        "乘法",
        "Multiplication",
        "Multiplication"
    ],
    [
        "20以内加减法",
        "Practice within 20",
        "Addition et soustraction jusqu’à 20"
    ],
    [
        "时间限制:",
        "Time Limit:",
        "Temps limite :"
    ],
    [
        "秒",
        "s",
        "s"
    ],
    [
        "点击“开始游戏”",
        "Click \"Start Game\"",
        "Clique sur « Commencer la partie »"
    ],
    [
        "剩余时间:",
        "Time Left:",
        "Temps restant :"
    ],
    [
        "尚未开始",
        "N/A",
        "Pas encore commencé"
    ],
    [
        "开始游戏",
        "Start Game",
        "Commencer la partie"
    ],
    [
        "趣味视觉数学",
        "Fun Visual Math",
        "Les maths en images"
    ],
    [
        "选择主题:",
        "Choose Theme:",
        "Choisis un thème :"
    ],
    [
        "火柴棒",
        "Matchsticks",
        "Allumettes"
    ],
    [
        "小鸡",
        "Chicks",
        "Poussins"
    ],
    [
        "时间到！",
        "Time is up!",
        "Temps écoulé !"
    ],
    [
        "时间到了！",
        "Time's Up!",
        "Temps écoulé !"
    ],
    [
        "完美着陆！",
        "Perfect Landing!",
        "Atterrissage parfait !"
    ],
    [
        "已解锁!",
        "Unlocked!",
        "Débloqué !"
    ],
    [
        "已解锁！",
        "Unlocked!",
        "Débloqué !"
    ],
    [
        "答错了，再试一次！",
        "Oops, try the next one!",
        "Oups, essaie la question suivante !"
    ],
    [
        "选择一个主题然后开始游戏！",
        "Select a theme and start!",
        "Choisis un thème, puis commence !"
    ],
    [
        "一年级数学游戏",
        "First Grade Math Games",
        "Jeux de maths du CP"
    ],
    [
        "恭喜你得到50分！",
        "Congratulations! You reached 50 points!",
        "Félicitations ! Tu as atteint 50 points !"
    ],
    [
        "没有剩余次数了！",
        "No more tries!",
        "Il ne reste plus d’essais !"
    ],
    [
        "一年级数学冒险 V2",
        "First Grade Math Adventures V2",
        "Aventures mathématiques du CP V2"
    ],
    [
        "数图形",
        "Shapes Count",
        "Compter les formes"
    ],
    [
        "魔药小助手",
        "Potion Helper",
        "L’apprenti sorcier"
    ],
    [
        "外星人跳跃",
        "Alien Jumps",
        "Les sauts de l’extraterrestre"
    ],
    [
        "水果金币",
        "Fruit Money",
        "Les pièces et les fruits"
    ],
    [
        "帮助外星人到达目标星球！",
        "Help the Alien reach the Target Planet!",
        "Aide l’extraterrestre à atteindre la planète cible !"
    ],
    [
        "需要跳几步？",
        "How many jumps?",
        "Combien de sauts faut-il ?"
    ],
    [
        "🎉 太棒了！你达到50分了！🎉",
        "🎉 Awesome! You reached 50! 🎉",
        "🎉 Super ! Tu as atteint 50 points ! 🎉"
    ],
    [
        "游戏结束！再试一次？",
        "Game Over! Try again?",
        "Partie terminée ! Tu veux réessayer ?"
    ],
    [
        "外星人倒数跳跃！",
        "Alien Countdown Jumps!",
        "Les sauts à rebours de l’extraterrestre !"
    ],
    [
        "帮助外星人每次后退一步，跳回目标星球！",
        "Help the Alien reach the Planet by jumping back one step at a time!",
        "Aide l’extraterrestre à rejoindre sa planète en reculant d’une case à chaque saut !"
    ],
    [
        "超级算术小英雄",
        "Super Arithmetic Heroes",
        "Les petits héros du calcul"
    ],
    [
        "准备好成为数学小英雄了吗？",
        "Ready to become a math hero?",
        "Prêt à devenir un héros des maths ?"
    ],
    [
        "加入超人和变形金刚的队伍，通过解决数学问题来拯救世界！答对越多问题，获得的能量就越多！",
        "Join Superman and the Transformers to save the world with maths! Every correct answer gives you more energy!",
        "Rejoins Superman et les Transformers pour sauver le monde grâce aux maths ! Chaque bonne réponse te donne plus d’énergie !"
    ],
    [
        "加法挑战",
        "Addition Challenge",
        "Défi d’addition"
    ],
    [
        "10以内的加法题目",
        "Addition within 10",
        "Additions jusqu’à 10"
    ],
    [
        "减法挑战",
        "Subtraction Challenge",
        "Défi de soustraction"
    ],
    [
        "10以内的减法题目",
        "Subtraction within 10",
        "Soustractions jusqu’à 10"
    ],
    [
        "混合挑战",
        "Mixed Challenge",
        "Défi mixte"
    ],
    [
        "加法和减法混合",
        "Mixed addition and subtraction",
        "Additions et soustractions mélangées"
    ],
    [
        "超人",
        "Superman",
        "Superman"
    ],
    [
        "变形金刚",
        "Transformer",
        "Transformer"
    ],
    [
        "开始冒险",
        "Start the Adventure",
        "Commencer l’aventure"
    ],
    [
        "当前关卡",
        "Current Level",
        "Niveau actuel"
    ],
    [
        "生命值",
        "Lives",
        "Vies"
    ],
    [
        "超人1",
        "Superman 1",
        "Superman 1"
    ],
    [
        "变形金刚1",
        "Transformer 1",
        "Transformer 1"
    ],
    [
        "超级英雄",
        "Superhero",
        "Super-héros"
    ],
    [
        "你的答案完全正确，获得20分！",
        "That is exactly right! You earn 20 points!",
        "Bonne réponse ! Tu gagnes 20 points !"
    ],
    [
        "别灰心，你可以做得更好！",
        "Don't give up! You can do it!",
        "Ne te décourage pas, tu peux y arriver !"
    ],
    [
        "你完成了挑战",
        "You completed the challenge",
        "Tu as terminé le défi"
    ],
    [
        "正确题数",
        "Correct Answers",
        "Bonnes réponses"
    ],
    [
        "错误题数",
        "Incorrect Answers",
        "Mauvaises réponses"
    ],
    [
        "返回菜单",
        "Back to Menu",
        "Retour au menu"
    ],
    [
        "游戏帮助",
        "Game Help",
        "Aide du jeu"
    ],
    [
        "关闭帮助",
        "Close Help",
        "Fermer l’aide"
    ],
    [
        "游戏规则",
        "How to Play",
        "Règles du jeu"
    ],
    [
        "你需要回答10以内的加法和减法数学题。每答对一题获得20分，答错一题扣5分。你有3条生命值，连续答对5题可以获得额外生命值。",
        "Solve addition and subtraction questions within 10. Each correct answer earns 20 points; each wrong answer costs 5 points. You start with 3 lives and earn an extra life after 5 correct answers in a row.",
        "Résous des additions et des soustractions jusqu’à 10. Chaque bonne réponse rapporte 20 points et chaque erreur coûte 5 points. Tu commences avec 3 vies et gagnes une vie après 5 bonnes réponses de suite."
    ],
    [
        "角色解锁",
        "Unlocking Heroes",
        "Débloquer les héros"
    ],
    [
        "答对5题收集超人克拉克，答对10题收集大黄蜂，答对20题收集钢铁侠。进度条会记录你的收集进展。",
        "Collect Clark the Super after 5 correct answers, Bumblebee Bot after 10, and Iron Avenger after 20. The bars track your collection progress.",
        "Collectionne Superman Clark après 5 bonnes réponses, Bumblebee après 10 et Iron Man après 20. Les barres suivent ta collection."
    ],
    [
        "关卡提升",
        "Leveling Up",
        "Passer au niveau suivant"
    ],
    [
        "每答对3题提升一个关卡，记录你的练习进度。所有关卡都练习10以内的加减法。",
        "Every 3 correct answers adds a level to record your practice progress. Every level uses addition and subtraction within 10.",
        "Chaque série de 3 bonnes réponses ajoute un niveau pour suivre tes progrès. Tous les niveaux proposent des additions et soustractions jusqu’à 10."
    ],
    [
        "明白了",
        "Got It",
        "J’ai compris"
    ],
    [
        "超级算术小英雄 © 2025",
        "Super Arithmetic Heroes © 2025",
        "Les petits héros du calcul © 2025"
    ],
    [
        "让每个孩子都成为数学小天才！",
        "Help every child become a maths star!",
        "Pour que chaque enfant devienne un champion des maths !"
    ],
    [
        "连续答对5题！额外获得1条生命！",
        "5 correct answers in a row! You earned an extra life!",
        "5 bonnes réponses de suite ! Tu gagnes une vie !"
    ],
    [
        "减少时间",
        "Decrease Time",
        "Réduire le temps"
    ],
    [
        "增加时间",
        "Increase Time",
        "Augmenter le temps"
    ]
];
    i18n.register(Object.fromEntries(rows.map(([zh, en, fr]) => [zh, [en, fr]])));
    const fruitNames = [
        ['苹果', 'Apple', 'Pomme'], ['香蕉', 'Banana', 'Banane'],
        ['橘子', 'Orange', 'Orange'], ['葡萄', 'Grapes', 'Raisin'], ['梨', 'Pear', 'Poire']
    ];
    const fruit = (name, lang) => {
        const row = fruitNames.find(values => values.includes(name));
        return row ? row[{zh:0, en:1, fr:2}[lang]] : name;
    };
    const frenchPurchase = name => {
        const label = fruit(name, 'fr').toLowerCase();
        return label === 'raisin' ? 'du raisin' : `une ${label}`;
    };
    const jumps = (n, lang) => lang === 'zh' ? `${n} 步` : lang === 'en' ? `${n} jump${Number(n) === 1 ? '' : 's'}` : `${n} saut${Number(n) > 1 ? 's' : ''}`;
    const coins = (n, lang) => lang === 'zh' ? `${n} 金币` : lang === 'en' ? `${n} coin${Number(n) === 1 ? '' : 's'}` : `${n} pièce${Number(n) > 1 ? 's' : ''}`;
    i18n.registerPatterns([
        {pattern:/^(?:得分|分数|Score)\s*[:：]\s*(\d+(?:\/\d+)?)$/, zh:n=>`得分: ${n}`, en:n=>`Score: ${n}`, fr:n=>`Score : ${n}`},
        {pattern:/^(?:尝试次数|Tries)\s*[:：]\s*(\d+)$/, zh:n=>`尝试次数: ${n}`, en:n=>`Tries: ${n}`, fr:n=>`Essais restants : ${n}`},
        {pattern:/^(?:你的得分|Your score)\s*[:：]\s*(\d+(?:\/\d+)?)$/, zh:n=>`你的得分: ${n}`, en:n=>`Your score: ${n}`, fr:n=>`Ton score : ${n}`},
        {pattern:/^(?:你有\s*💰|You have 💰)(\d+)(?:个金币。| coins?\.)$/, zh:n=>`你有 💰${n}个金币。`, en:n=>`You have 💰${coins(n,'en')}.`, fr:n=>`Tu as 💰${coins(n,'fr')}.`},
        {pattern:/^(\d+)\s*(?:金币|coins?)$/, zh:n=>coins(n,'zh'), en:n=>coins(n,'en'), fr:n=>coins(n,'fr')},
        {pattern:/^(?:外星人位置|Alien at)\s*[:：]\s*(\d+)$/, zh:n=>`外星人位置: ${n}`, en:n=>`Alien at: ${n}`, fr:n=>`Position de l’extraterrestre : ${n}`},
        {pattern:/^(?:目标星球|Target Planet)\s*[:：]\s*(\d+)$/, zh:n=>`目标星球: ${n}`, en:n=>`Target Planet: ${n}`, fr:n=>`Planète cible : ${n}`},
        {pattern:/^(?:目标|Target)\s*[:：]\s*(\d+)$/, zh:n=>`目标: ${n}`, en:n=>`Target: ${n}`, fr:n=>`Cible : ${n}`},
        {pattern:/^(?:每步|Each Jump)\s*[:：]\s*([+−-]\d+)$/, zh:n=>`每步: ${n}`, en:n=>`Each Jump: ${n}`, fr:n=>`Chaque saut : ${n}`},
        {pattern:/^(\d+) (?:步|Jumps?)$/, zh:n=>jumps(n,'zh'), en:n=>`${n} Jump${Number(n) === 1 ? '' : 's'}`, fr:n=>jumps(n,'fr')},
        {pattern:/^(?:哎呀！答案是 |错误！答案是 |Oops! The answer was )(\d+)$/, zh:n=>`哎呀！答案是 ${n}`, en:n=>`Oops! The answer was ${n}`, fr:n=>`Oups ! La bonne réponse était ${n}`},
        {pattern:/^(?:时间到！答案是 |Time's up! The answer was )(\d+)$/, zh:n=>`时间到！答案是 ${n}`, en:n=>`Time's up! The answer was ${n}`, fr:n=>`Temps écoulé ! La bonne réponse était ${n}`},
        {pattern:/^(?:不对哦！正确答案是 |Not quite! The correct answer was )(\d+)(?: 步。| jumps?\.)$/, zh:n=>`不对哦！正确答案是 ${n} 步。`, en:n=>`Not quite! The correct answer was ${jumps(n,'en')}.`, fr:n=>`Pas tout à fait ! Il fallait ${jumps(n,'fr')}.`},
        {pattern:/^(?:不对哦！你跳了 |Not quite! That was )(\d+)(?: 步。| jumps?\.)$/, zh:n=>`不对哦！你跳了 ${n} 步。`, en:n=>`Not quite! That was ${jumps(n,'en')}.`, fr:n=>`Pas tout à fait ! Tu as choisi ${jumps(n,'fr')}.`},
        {pattern:/^(?:最短时间\s*\(|Min Time \()(\d+)(?:秒|s)\)!$/, zh:n=>`最短时间 (${n}秒)!`, en:n=>`Min Time (${n}s)!`, fr:n=>`Temps minimum (${n} s) !`},
        {pattern:/^(?:得分|Score )(\d+)(?:解锁| to unlock)$/, zh:n=>`得分${n}解锁`, en:n=>`Score ${n} to unlock`, fr:n=>`${n} points pour débloquer`},
        {pattern:/^答对(\d+)题即可解锁$/, zh:n=>`答对${n}题即可解锁`, en:n=>`Unlock after ${n} correct answers`, fr:n=>`Débloque ce héros après ${n} bonnes réponses`},
        {pattern:/^(?:游戏 |Game )(\d+)$/, zh:n=>`游戏 ${n}`, en:n=>`Game ${n}`, fr:n=>`Jeu ${n}`},
        {pattern:/^恭喜升级到关卡 (\d+)！$/, zh:n=>`恭喜升级到关卡 ${n}！`, en:n=>`Congratulations! You reached level ${n}!`, fr:n=>`Félicitations ! Tu passes au niveau ${n} !`},
        {pattern:/^(Apple|Banana|Orange|Grapes|Pear|苹果|香蕉|橘子|葡萄|梨) (?:OR|or|或) (Apple|Banana|Orange|Grapes|Pear|苹果|香蕉|橘子|葡萄|梨)$/, zh:(a,b)=>`${fruit(a,'zh')} 或 ${fruit(b,'zh')}`, en:(a,b)=>`${fruit(a,'en')} or ${fruit(b,'en')}`, fr:(a,b)=>`${fruit(a,'fr')} ou ${fruit(b,'fr')}`},
        {pattern:/^Buy (Apple|Banana|Orange|Grapes|Pear)\. Change\?$/, zh:n=>`买${fruit(n,'zh')}，能找回多少金币？`, en:n=>`Buy ${n}. Change?`, fr:n=>`Achète ${frenchPurchase(n)}. Quelle monnaie te rend-on ?`}
    ]);
})();
