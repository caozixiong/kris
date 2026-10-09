/* Mechanic-specific exploration tools for the original math games.
 * All progress is local to the page. Models never submit an answer or spend a try. */
(function () {
    'use strict';
    const t = text => window.KrisI18n ? window.KrisI18n.translate(text) : text;
    const THEMES = {
        count: ['🔎', '图形探险队', '点一点，给每个图形做记号，再选出总数。'],
        shapes: ['🎒', '双篮采集站', '分别数出两篮宝物，再把它们合在一起。'],
        mixed: ['🧩', '图形侦探社', '先按种类分组，再找到两组的总数。'],
        bowling: ['🎳', '星光保龄球', '先数球瓶，滚球后看看还站着多少。'],
        potion: ['🧪', '彩虹药水实验室', '已知的一份加上神秘的一份，刚好装满药水。'],
        fruit: ['🍓', '森林小集市', '用金币模型比较价格，看看预算够不够。'],
        jumps: ['🛸', '星球航线规划师', '试走一步，看看每次跳跃让位置怎样变化。'],
        hero: ['🏙️', '点亮英雄城', '解开算式，为城市点亮一扇新窗。'],
        arithmetic: ['🤖', '机器人建造工坊', '加法合并，减法拿走，乘法排成相同的组。'],
        practice: ['🌉', '二十格数字桥', '用十格框看清数量，慢慢想也没关系。'],
        visual: ['🐥', '小鸡与火柴工作室', '切换实物模型，看看同一个算式的不同样子。']
    };
    const node = (tag, className, text) => {
        const el = document.createElement(tag); el.className = className || '';
        if (text !== undefined) el.textContent = text;
        if (tag === 'button') el.type = 'button';
        return el;
    };
    const safe = value => Math.max(0, Math.min(100, Number(value) || 0));
    function equation(data, reveal) {
        if (data.kind === 'bowling' && data.rolling) return `${data.a} − ? = ?`;
        if (data.kind === 'count') return reveal ? String(data.a) : '?';
        if (data.kind === 'jumps') return `${data.a} ${data.op} ${data.b} × ${reveal ? data.answer : '?'} = ${data.target}`;
        if (data.kind === 'fruit') return `💰 ${data.money} · ${data.icon1} ${data.price1} · ${data.icon2} ${data.price2}`;
        if (data.kind === 'potion') return data.missing === 0 ? `${reveal ? data.answer : '?'} + ${data.b} = ${data.total}` : `${data.a} + ${reveal ? data.answer : '?'} = ${data.total}`;
        return `${data.a} ${data.op || '+'} ${data.b} = ${reveal ? data.answer : '?'}`;
    }
    function read(game, kind) {
        const s = game.state, q = s.currentQuestion || s.currentProblem || {};
        let data = {kind};
        if (kind === 'count') return {...data, a:s.currentCount, answer:s.currentCount};
        if (kind === 'shapes' || kind === 'mixed') return {...data,a:s.count1,b:s.count2,op:'+',answer:s.sumCount,icon1:s.currentShape1,icon2:s.currentShape2};
        if (kind === 'bowling') {const rolling=!game.elements.mValueSpan?.textContent;const fallen=rolling?0:s.M;return {...data,a:s.N,b:fallen,op:'−',answer:s.N-fallen,rolling};}
        if (kind === 'potion') return {...data,a:s.val1,b:s.val2,total:s.total,missing:s.missingPosition,answer:s.missingVal};
        if (kind === 'fruit') return {...data,money:s.playerMoney,price1:s.item1.price,price2:s.item2.price,icon1:s.item1.icon,icon2:s.item2.icon,answer:s.correctAnswer};
        if (kind === 'jumps') return {...data,a:s.currentPos ?? s.currentPosition,target:s.targetPos ?? s.targetPosition,b:s.jumpVal || 1,op:s.jumpOp || '−',answer:s.correctJumps};
        if (kind === 'arithmetic') {
            const matches = game.elements.problemElement.textContent.match(/(\d+)\s*([+×−-])\s*(\d+)/);
            return {...data,a:Number(matches?.[1] || 0),b:Number(matches?.[3] || 0),op:matches?.[2] || '+',answer:s.currentAnswer};
        }
        return {...data,a:q.num1 || 0,b:q.num2 || 0,op:q.operator || q.operation || '+',answer:q.correctAnswer ?? q.answer,icon:s.currentTheme === 'chicks' ? '🐥' : '▰'};
    }
    function make({host,kind,read:readData}) {
        const [icon,title,instruction] = THEMES[kind];
        const panel = node('section',`math-arcade arcade-${kind}`);
        panel.setAttribute('aria-label',t(title));
        const heading = node('h2','arcade-title'), intro = node('p','arcade-intro');
        const route = node('div','arcade-route'); route.setAttribute('aria-hidden','true');
        const progress = node('p','arcade-progress');
        const status = node('p','arcade-status'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
        const tools = node('div','arcade-tools'), hint = node('button','arcade-tool'), reset = node('button','arcade-tool');
        const model = node('div','arcade-model'); model.id = `arcade-model-${host.id || kind}`;
        hint.setAttribute('aria-controls',model.id);
        tools.append(hint,reset); panel.append(heading,intro,route,progress,tools,model,status); host.prepend(panel);
        host.classList.add('arcade-host'); host.setAttribute('data-arcade-kind',kind);
        const c = {host,kind,panel,earned:0,round:0,credited:false,attempted:false,revealed:false,cursor:0,marks:new Set(),pending:new Set(),epoch:0};
        function tokens(parent,amount,iconText,removed=0) {
            const tray = node('div','arcade-token-tray');
            for(let i=0;i<safe(amount);i++) {
                const key = `${parent.dataset.group || 'one'}:${i}`;
                const item = node('button','arcade-token'+(i>=amount-removed?' is-removed':''),iconText || '●');
                item.setAttribute('aria-label',`${t('给物品做记号')} ${i+1}`);
                item.setAttribute('aria-pressed',String(c.marks.has(key)));
                item.classList.toggle('is-marked',c.marks.has(key));
                item.onclick=()=>{if(c.marks.has(key))c.marks.delete(key);else c.marks.add(key);item.setAttribute('aria-pressed',String(c.marks.has(key)));item.classList.toggle('is-marked',c.marks.has(key));};
                tray.append(item);
            }
            if(!amount)tray.append(node('span','arcade-zero','0'));
            parent.append(tray);
        }
        function group(label,index) {const el=node('div','arcade-group');el.dataset.group=String(index);el.append(node('strong','arcade-group-label',label));model.append(el);return el;}
        c.renderModel=()=>{
            model.innerHTML=''; model.hidden=!c.revealed;
            hint.textContent=t(c.revealed?'收起模型':'打开探索模型');hint.setAttribute('aria-expanded',String(c.revealed));reset.textContent=t('重置模型');reset.hidden=!c.revealed;
            if(!c.revealed)return;
            const d=readData();
            if(d.answer===undefined){model.append(node('p','arcade-model-tip',t('开始游戏后可探索模型。')));return;}
            model.append(node('p','arcade-equation',equation(d,c.credited)));
            if(kind==='jumps') {
                const path=node('div','arcade-flight');
                for(let i=0;i<=d.answer;i++){
                    const value=d.a+(d.op==='+'?1:-1)*d.b*i;
                    const planet=node('span','arcade-planet'+(i===c.cursor?' is-current':''),`${i===c.cursor?'🛸 ':i===d.answer?'🌍 ':''}${value}`);
                    path.append(planet);
                }
                model.append(path);
                const jump=node('button','arcade-jump',t('试走一步'));jump.disabled=c.cursor>=d.answer;
                jump.onclick=()=>{c.cursor=Math.min(d.answer,c.cursor+1);c.renderModel();model.querySelector('.arcade-jump')?.focus();};model.append(jump);
            } else if(kind==='potion') {
                const known=d.missing===0?d.b:d.a;
                const flask=group(`🧪 ${t('药水总量')} ${d.total}`,0);flask.classList.add('arcade-flask');
                for(let i=0;i<d.total;i++)flask.append(node('span','arcade-drop'+(i<known?' is-filled':''),i<known?'●':'○'));
                model.append(node('p','arcade-model-tip',t('空格还需要多少滴？')));
            } else if(kind==='fruit') {
                tokens(group(`💰 ${d.money}`,0),d.money,'🟡');
                tokens(group(`${d.icon1} ${d.price1}`,1),d.price1,'●');tokens(group(`${d.icon2} ${d.price2}`,2),d.price2,'●');
            } else if(kind==='count') tokens(group('🔎',0),d.a,'◆');
            else if(d.op==='×') {
                for(let i=0;i<d.a;i++)tokens(group(`${i+1}`,i),d.b,'🔩');
                if(!d.a)model.append(node('span','arcade-zero','0'));
            } else if(d.op==='-'||d.op==='−') tokens(group(kind==='bowling'?'🎳':'−',0),d.a,kind==='bowling'?'♟':kind==='visual'?d.icon:'●',d.b);
            else {
                tokens(group(d.icon1||'+',0),d.a,d.icon1|| (kind==='visual'?d.icon:'●'));
                tokens(group(d.icon2||'+',1),d.b,d.icon2|| (kind==='visual'?d.icon:'●'));
            }
        };
        c.render=()=>{
            heading.textContent=`${icon} ${t(title)}`;intro.textContent=t(instruction);
            panel.setAttribute('aria-label',t(title));
            route.innerHTML='';
            const themes=kind==='hero'?['🏠','🏢','🏥','🏫','🏰']:kind==='arithmetic'?['🦿','🦿','🦾','🦾','🤖']:kind==='jumps'?['🌙','🪐','🌎','☄️','⭐']:kind==='fruit'?['🍓','🍎','🍐','🍇','🧺']:['🔹','🌱','🌼','🌈','🏆'];
            const completed=c.earned===0?0:((c.earned-1)%5)+1;
            themes.forEach((emoji,i)=>route.append(node('span','arcade-stop'+(i<completed?' is-earned':''),emoji)));
            progress.textContent=`${t('探险印章')} ${c.earned} · ${t('本段旅程')} ${completed}/5`;
            c.renderModel();
        };
        c.cancel=()=>{c.epoch++;c.pending.forEach(id=>clearTimeout(id));c.pending.clear();};
        c.later=(fn,ms)=>{const epoch=c.epoch;const id=setTimeout(()=>{c.pending.delete(id);if(epoch===c.epoch&&host.style.display!=='none')fn();},ms);c.pending.add(id);return id;};
        c.begin=()=>{c.cancel();c.round++;c.credited=false;c.attempted=false;c.cursor=0;c.marks.clear();status.textContent='';c.render();};
        c.invalid=()=>{status.textContent=t('请输入完整的非负整数。');};
        c.answer=correct=>{
            if(c.credited)return;
            if(correct){c.credited=true;c.earned++;}
            c.revealed=true;c.render();
            const message=correct?(c.earned%5===0?'五枚印章！下一段旅程出发。':'新印章到手！看看你的解题模型。'):'试着用模型找一找，再继续探索。';
            status.textContent=t(message);
            const data=readData();
            host.querySelectorAll('.arcade-feedback-detail').forEach(el=>{el.textContent=`${t(message)} ${equation(data,true)}`;});
        };
        hint.onclick=()=>{c.revealed=!c.revealed;c.renderModel();};
        reset.onclick=()=>{c.cursor=0;c.marks.clear();c.renderModel();};
        window.KrisI18n?.onChange(()=>c.render());
        window.addEventListener('pagehide',()=>c.cancel());
        c.render(); return c;
    }
    function mount(game,kind) {
        const c=make({host:game.hostElement,kind,read:()=>read(game,kind)});game.arcade=c;game.later=c.later;
        const rounds=['startNewRound','startGameCycle','setupRound','setupNewProblem','generateQuestion','updateProblem','nextQuestion'];
        for(const name of rounds)if(typeof game[name]==='function'){
            const original=game[name];game[name]=function(...args){c.cancel();const result=original.apply(this,args);if(kind==='count'){clearInterval(this.state.timerInterval);this.state.timerInterval=null;if(this.elements.timerElement)this.elements.timerElement.textContent='∞';}c.begin();return result;};
        }
        // These are exploration games: taking time never removes an answer or a try.
        if(game.startTimer)game.startTimer=function(){if(this.cleanupTimer)this.cleanupTimer();else if(this.state.timerInterval)clearInterval(this.state.timerInterval);this.state.timerInterval=null;this.state.timeLeft=86400;const el=this.elements.timerDisplay||this.elements.timeLeftDisplay;if(el){el.textContent='∞';el.setAttribute('aria-label',t('自由探索，无倒计时'));}};
        if(game.startCountdown)game.startCountdown=function(){this.elements.countdownDisplay.style.display='none';this.elements.startButton.disabled=false;};
        const cleanup=game.cleanup;if(cleanup)game.cleanup=function(...args){c.cancel();return cleanup.apply(this,args);};
        const init=game.init;game.init=function(...args){c.cancel();const result=init.apply(this,args);this.hostElement.querySelectorAll('.timer-controls, .timer-area, [id$="more-challenging-btn"]').forEach(el=>el.hidden=true);this.hostElement.querySelectorAll('.arcade-feedback-detail').forEach(el=>el.remove());
            for(const key of ['resultPopup','resultDiv','feedbackArea','correctFeedback','wrongFeedback']){const popup=this.elements[key];if(popup)popup.append(node('p','arcade-feedback-detail'));}
            c.render();return result;};
        const method=game.handleAnswer?'handleAnswer':'checkAnswer',check=game[method];
        if(check)game[method]=function(...args){
            if(this.hostElement.style.display==='none'||c.credited)return;
            if(['hero','arithmetic','practice','visual','jumps'].includes(kind)&&c.attempted)return;
            const s=this.state,d=read(this,kind);let correct;
            if(kind==='hero'){const raw=this.elements.answerInput?.value;if(!/^\d+$/.test(String(raw).trim())){c.invalid();return;}correct=Number(raw)===d.answer;}
            else if(kind==='practice'||kind==='visual') {if(!s.gameActive)return;correct=Number(args[0].textContent)===d.answer;}
            else if(kind==='shapes'||kind==='mixed'){if(s.gamePaused)return;correct=s.selectedNumbers[0]===s.count1&&s.selectedNumbers[1]===s.count2&&s.selectedNumbers[2]===s.sumCount;}
            else if(kind==='fruit'){if(s.gamePaused)return;const answer=String(s.correctAnswer);correct=String(args[0])===answer||(/ OR | or | 或 /.test(answer)&&answer.split(/ OR | or | 或 /).includes(String(args[0])));}
            else correct=Number(args[0])===d.answer;
            if(['hero','arithmetic','practice','visual','jumps'].includes(kind))c.attempted=true;
            const result=check.apply(this,args);c.answer(correct);return result;
        };
        if(game.setTheme){const theme=game.setTheme;game.setTheme=function(...args){const result=theme.apply(this,args);c.render();return result;};}
        if(game.knockPins){const knock=game.knockPins;game.knockPins=function(){const result=knock.call(this);c.render();return result;};}
        return c;
    }
    window.KrisMathArcade={make,mount,read,equation};
})();
