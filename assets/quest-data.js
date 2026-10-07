/* Original, offline-friendly learning missions. No account or remote services. */
(function (root) {
  'use strict';
  const math = [
    {name:'点火准备',start:3,target:14,steps:2,ops:[['+',4],['×',2],['−',1]],hint:'先把 3 加到 7，再翻一倍。',lesson:'把运算分成小步骤：3 + 4 = 7，7 × 2 = 14。'},
    {name:'月球补给',start:5,target:18,steps:2,ops:[['+',4],['×',2],['−',3]],hint:'试试先补给 4，再让能量翻倍。',lesson:'先加后乘和先乘后加，结果可能不同。'},
    {name:'穿越星云',start:4,target:30,steps:3,ops:[['+',6],['×',2],['+',10],['−',5]],hint:'可以先到 10，再到 20，最后到 30。',lesson:'可以从目标倒推：30 − 10 = 20，20 ÷ 2 = 10。'},
    {name:'陨石绕行',start:20,target:21,steps:3,ops:[['−',8],['÷',2],['+',15],['×',3]],hint:'先减去 8，再平分成 2 份，最后加上 15。',lesson:'除法表示平均分：12 ÷ 2 = 6。'},
    {name:'卫星修理',start:6,target:40,steps:3,ops:[['×',3],['+',2],['×',2],['−',4]],hint:'先得到 18，再到 20，最后翻倍。',lesson:'顺序运算：每一步都使用上一步的结果。'},
    {name:'燃料调配',start:36,target:15,steps:3,ops:[['÷',4],['×',3],['−',12],['+',6]],hint:'36 可以平均分成 4 份；接着乘 3，再减 12。',lesson:'逆向检查：15 + 12 = 27，27 ÷ 3 = 9，9 × 4 = 36。'},
    {name:'深空航线',start:8,target:42,steps:3,ops:[['+',6],['×',4],['−',14],['÷',2]],hint:'先到 14，然后变成它的 4 倍，再减去 14。',lesson:'14 × 4 − 14 相当于留下 3 组 14，也就是 42。'},
    {name:'星港归航',start:48,target:100,steps:3,ops:[['÷',6],['+',12],['×',5],['−',8]],hint:'先平分为 6 份，然后加到 20，最后乘 5。',lesson:'8 + 12 凑成整十数 20，再乘 5 更容易心算。'}
  ];
  const english = [
    {name:'机器人入口',icon:'🤖',zh:'这个机器人会跳。',words:['The','robot','can','jump'],note:'can 后面用动词原形：can jump（会跳）。',hint:'The robot 是主角，can 表示“会”。'},
    {name:'望远镜线索',icon:'🔭',zh:'我看见一颗红色的星星。',words:['I','see','a','red','star'],note:'英语中，颜色通常放在名词前面：a red star。',hint:'先说 I see，再说 a red star。'},
    {name:'森林伙伴',icon:'🦊',zh:'这只狐狸有一条长尾巴。',words:['The','fox','has','a','long','tail'],note:'The fox 是单数，所以用 has；long tail 是“长尾巴”。',hint:'主角 The fox → 拥有 has → a long tail。'},
    {name:'桥下的钥匙',icon:'🗝️',zh:'钥匙在桥的下面。',words:['The','key','is','under','the','bridge'],note:'under 表示“在……下面”。The key is under the bridge.',hint:'The key is 是开头，under the bridge 表示地点。'},
    {name:'海底发现',icon:'🐠',zh:'这些鱼住在海里。',words:['These','fish','live','in','the','sea'],note:'fish 的复数也常用 fish；These fish 后面用 live。',hint:'先 These fish，再 live，最后 in the sea。'},
    {name:'探险队营地',icon:'⛺',zh:'我们需要两本书。',words:['We','need','two','books'],note:'two 是两个，所以 book 变成复数 books。',hint:'We need 表示“我们需要”。'},
    {name:'恐龙的脚印',icon:'🦕',zh:'这只恐龙不吃肉。',words:['This','dinosaur','does','not','eat','meat'],note:'does not 后面使用动词原形 eat，不加 s。',hint:'This dinosaur → does not → eat meat。'},
    {name:'宝箱密码',icon:'🚀',zh:'你能打开门吗？',words:['Can','you','open','the','door'],punct:'?',note:'把 Can 放在开头，就能问“你能……吗？”',hint:'疑问句从 Can you 开始，接着 open the door。'}
  ];
  const products = [
    {id:'apple-red',name:'pomme rouge',plural:'pommes rouges',zh:'红苹果',icon:'🍎',color:'red',gender:'une'},
    {id:'apple-green',name:'pomme verte',plural:'pommes vertes',zh:'青苹果',icon:'🍏',color:'green',gender:'une'},
    {id:'book-blue',name:'livre bleu',plural:'livres bleus',zh:'蓝色的书',icon:'📘',color:'blue',gender:'un'},
    {id:'book-red',name:'livre rouge',plural:'livres rouges',zh:'红色的书',icon:'📕',color:'red',gender:'un'},
    {id:'pencil-yellow',name:'crayon jaune',plural:'crayons jaunes',zh:'黄色铅笔',icon:'✎',color:'yellow',gender:'un'},
    {id:'pencil-blue',name:'crayon bleu',plural:'crayons bleus',zh:'蓝色铅笔',icon:'✎',color:'blue',gender:'un'}
  ];
  const french = [
    {name:'市场初见',order:'Une pomme rouge, s’il te plaît.',want:{'apple-red':1},hint:'请给我一个红苹果。une 表示阴性名词的“一个”。',note:'pomme 是阴性名词：une pomme。rouge 在这里表示红色。'},
    {name:'图书角',order:'Un livre bleu, s’il te plaît.',want:{'book-blue':1},hint:'请给我一本蓝色的书。un 表示阳性名词的“一个”。',note:'livre 是阳性名词：un livre bleu。bleu 表示蓝色。'},
    {name:'野餐篮',order:'Deux pommes vertes, s’il te plaît.',want:{'apple-green':2},hint:'请给我两个青苹果。deux = 2，vertes = 绿色的（阴性复数）。',note:'两个苹果：deux pommes。绿色也配合阴性复数，写成 vertes。'},
    {name:'画家的委托',order:'Trois crayons jaunes, s’il te plaît.',want:{'pencil-yellow':3},hint:'请给我三支黄色铅笔。trois = 3，jaunes = 黄色的（复数）。',note:'三个以上也用复数：trois crayons jaunes。名词和颜色都加 s。'},
    {name:'红色收藏',order:'Deux livres rouges, s’il te plaît.',want:{'book-red':2},hint:'请给我两本红色的书。livres 是书，rouges 是红色的（复数）。',note:'rouge 的阳性、阴性单数同形；复数通常写成 rouges。'},
    {name:'开学清单',order:'Un livre bleu et deux crayons jaunes, s’il te plaît.',want:{'book-blue':1,'pencil-yellow':2},hint:'请给我一本蓝色的书和两支黄色铅笔。et = 和。',note:'et 连接两样物品。分别看清 un（1）和 deux（2）。'},
    {name:'朋友的野餐',order:'Trois pommes rouges et une pomme verte, s’il te plaît.',want:{'apple-red':3,'apple-green':1},hint:'请给我三个红苹果和一个青苹果。注意两种颜色和数量。',note:'rouges 是复数；verte 修饰一只青苹果，用阴性单数。'},
    {name:'探险出发',order:'Deux livres rouges et quatre crayons bleus, s’il te plaît.',want:{'book-red':2,'pencil-blue':4},hint:'请给我两本红色的书和四支蓝色铅笔。quatre = 4。',note:'livres rouges 和 crayons bleus 都是阳性复数。你会读两项清单了！'}
  ];
  const materials = [
    {id:'copper',label:'铜片',en:'copper',icon:'▰',color:'#bb784b',conducts:true},
    {id:'plastic',label:'塑料片',en:'plastic',icon:'▰',color:'#86b7d4',conducts:false},
    {id:'steel',label:'钢片',en:'steel',icon:'▰',color:'#899a9f',conducts:true},
    {id:'rubber',label:'橡胶片',en:'rubber',icon:'▰',color:'#725b7d',conducts:false},
    {id:'wood',label:'干燥木片',en:'dry wood',icon:'▰',color:'#bb9b70',conducts:false},
    {id:'aluminum',label:'铝片',en:'aluminium',icon:'▰',color:'#a5b0b2',conducts:true}
  ];
  const science = [
    {name:'第一束光',goal:'用铜片接通材料位置，闭合开关，让灯泡亮起来。',material:'copper',closed:true,hint:'选铜片，再把开关切到“闭合”。',note:'铜能导电。连接完整而且开关闭合，才形成闭合电路。'},
    {name:'开关的秘密',goal:'选择铜片，断开开关，观察灯泡为什么熄灭。',material:'copper',closed:false,hint:'铜片能导电，但只要断开开关，回路就断了。',note:'开关断开时，回路不完整。即使有导体，灯泡也不会亮。'},
    {name:'塑料侦探',goal:'闭合开关，把铜片换成塑料片，观察结果。',material:'plastic',closed:true,hint:'选塑料片并闭合开关。先想一想塑料能不能导电。',note:'普通塑料是绝缘材料。本模型中，它不能让电流沿回路通过。'},
    {name:'金属新朋友',goal:'使用钢片并闭合开关，让灯泡发光。',material:'steel',closed:true,hint:'钢也是金属。在这个电路中，它能导电。',note:'铜和钢都能导电。导体不只一种材料。'},
    {name:'橡胶观察员',goal:'闭合开关，测试橡胶片，完成一次预测。',material:'rubber',closed:true,hint:'普通橡胶常作为绝缘材料。闭合开关并不会改变这一点。',note:'普通橡胶是绝缘材料。生活中的绝缘层必须完好，不能据此触碰电线。'},
    {name:'木头的小条件',goal:'闭合开关，测试干燥木片。留意“干燥”两个字。',material:'wood',closed:true,hint:'在这个简单模型中，干燥木片不能形成导电通路。',note:'干燥木材通常不易导电，但潮湿会改变情况。不要把木头当成电力安全工具。'},
    {name:'轻金属挑战',goal:'用铝片替换材料，闭合开关，点亮灯泡。',material:'aluminum',closed:true,hint:'铝是金属，也能导电。还要检查开关是否闭合。',note:'铝能导电。本模型只比较通路是否导电，不比较亮度和电阻。'},
    {name:'自由工程师',goal:'自己选一种导体，闭合开关，预测并点亮灯泡。',anyConductor:true,closed:true,hint:'铜、钢、铝任选一种；还要闭合开关。',note:'实验结论：电池、灯泡、导电材料和闭合开关连成完整回路，灯泡才亮。'}
  ];
  const data = {math,english,french,products,science,materials};
  if (typeof module !== 'undefined' && module.exports) module.exports=data;
  else root.QuestData=data;
})(typeof window !== 'undefined' ? window : globalThis);
