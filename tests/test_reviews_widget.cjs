'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {makeDOM}=require('./quest-dom.cjs');
const code=fs.readFileSync('assets/reviews/reviews.js','utf8');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function harness(options={}) {
 const document=makeDOM('<html><body></body></html>');let Constructor;const calls=[],listeners={};
 class Element {getAttribute(name){return name==='data-game'?'addition_game':null;}attachShadow(){return document.body;}}
 const context={document,HTMLElement:Element,AbortController,setTimeout,clearTimeout,console,Error,fetch:async(url,init)=>{calls.push({url,init});return options.fetch?options.fetch(url,init):Response.json(init.method==='GET'?{reviews:options.list||[]}:{ok:true,...(JSON.parse(init.body).action==='submit'?{status:'pending'}:{})});},KRIS_REVIEWS_CONFIG:{endpoint:options.endpoint===undefined?'https://test-project.supabase.co/functions/v1/game-reviews':options.endpoint},customElements:{get:()=>Constructor,define:(_,C)=>{Constructor=C;}},addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener:name=>delete listeners[name]};context.window=context;
 Object.defineProperty(context,'localStorage',{get(){throw Error('No storage access permitted');}});Object.defineProperty(context,'sessionStorage',{get(){throw Error('No storage access permitted');}});
 vm.runInNewContext(code,context);const widget=Constructor?new Constructor():null;if(widget)widget.connectedCallback();return {widget,document,calls,listeners,$:s=>document.querySelector(s)};
}
(async()=>{
 assert.equal(harness({endpoint:''}).widget,null);assert.equal(harness({endpoint:'https://evil.test'}).widget,null);
 const h=harness({list:[{body:'<img src=x onerror=alert(1)>',date:'2026-10-08'}]});await settle();assert.equal(h.$('#reviews-list').children.length,1);assert.equal(h.$('#reviews-list').querySelector('img'),null);assert.ok(h.$('#reviews-list').textContent.includes('<img'));
 assert.equal(h.$('#compose').hidden,true);await h.widget.verify();assert.equal(h.calls.length,1);assert.match(h.$('#status').textContent,/先回答/);
 h.$('#answer').value='test-input-only';await h.widget.verify();assert.equal(h.$('#gate').hidden,true);assert.equal(h.$('#compose').hidden,false);assert.equal(h.$('#answer').value,'');assert.equal(h.document.activeElement,h.$('#review'));
 h.$('#review').value=' My experience ';h.$('#review').dispatch('input');assert.equal(h.$('#count').textContent,'15 / 500');await h.widget.submit();assert.equal(h.$('#compose').hidden,true);assert.equal(h.$('#review').value,'');assert.equal(h.widget._answer,'');assert.match(h.$('#status').textContent,/审核通过/);assert.equal(h.$('#reviews-list').children.length,1);assert.equal(JSON.parse(h.calls.at(-1).init.body).answer,'test-input-only');assert.equal(h.calls.at(-1).init.credentials,'omit');
 const bad=harness({fetch:async(url,init)=>Response.json(init.method==='GET'?{reviews:[]}:{code:'answer'},{status:init.method==='GET'?200:403})});await settle();bad.$('#answer').value='wrong';await bad.widget.verify();assert.equal(bad.$('#compose').hidden,true);assert.match(bad.$('#status').textContent,/还不对/);assert.equal(bad.$('#verify').disabled,false);
 let finish;const delayed=harness({fetch:async(url,init)=>init.method==='GET'?Response.json({reviews:[]}):new Promise(resolve=>{finish=resolve;})});await settle();delayed.$('#answer').value='test-only';const first=delayed.widget.verify();await delayed.widget.verify();assert.equal(delayed.calls.length,2);delayed.listeners.pagehide();finish(Response.json({ok:true}));await first;assert.equal(delayed.$('#compose').hidden,true);assert.equal(delayed.widget._answer,'');assert.equal(delayed.$('#verify').disabled,false);
 const offline=harness({fetch:async(url,init)=>{if(init.method==='GET')return Response.json({reviews:[]});throw new Error('network');}});await settle();offline.widget._answer='test-only';offline.$('#compose').hidden=false;offline.$('#review').value='Do not lose my draft';await offline.widget.submit();assert.equal(offline.$('#review').value,'Do not lose my draft');assert.equal(offline.$('#submit').disabled,false);assert.match(offline.$('#status').textContent,/内容还在/);
 offline.$('#cancel').click();assert.equal(offline.widget._answer,'');assert.equal(offline.$('#compose').hidden,true);assert.equal(offline.$('#review').value,'Do not lose my draft');
 assert.ok(!/innerHTML\s*=\s*(review|data)/.test(code));assert.ok(!/localStorage|sessionStorage|document\.cookie/.test(code));
 console.log('PASS: actual widget handlers via DOM adapter; XSS-safe display; gate/submit; duplicate clicks; navigation-interrupted verification; pending-only acknowledgement; offline draft retention; answer clearing; config fail-closed. No real-browser/layout claim.');
})().catch(error=>{console.error(error);process.exit(1);});
