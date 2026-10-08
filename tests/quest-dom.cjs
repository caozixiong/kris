/* Dependency-free DOM adapter for actual production HTML and delegated handlers.
 * Models markup, selector matching, disabled buttons, bubbling and focus only.
 * No layout, native keyboard, browser rendering or accessibility-tree claim.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const pages={math:'math-orbit',english:'english-ruins',french:'french-market',science:'circuit-lab'};
const decode=s=>s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,e)=>e[0]==='#'?String.fromCodePoint(e[1].toLowerCase()==='x'?parseInt(e.slice(2),16):Number(e.slice(1))):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0'})[e]);
const dataName=s=>s.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase());
function makeDOM(html){
 let document;
 class Node{
  constructor(tag,attrs={},value=''){this.tagName=tag.toUpperCase();this.attributes={...attrs};this.childNodes=[];this.parentElement=null;this.listeners={};this.nodeType=tag==='#text'?3:1;this.value=value;this.dataset={};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[dataName(k)]=v;this.style={};}
  get children(){return this.childNodes.filter(n=>n.nodeType===1);}
  get childElementCount(){return this.children.length;}
  get className(){return this.attributes.class||'';}set className(s){this.attributes.class=s;}
  get id(){return this.attributes.id||'';}set id(v){this.attributes.id=String(v);}
  get nodeValue(){return this.nodeType===3?this.value:null;}set nodeValue(v){if(this.nodeType===3)this.value=String(v);}
  get lang(){return this.attributes.lang||'';}set lang(v){this.attributes.lang=String(v);}
  get href(){return this.getAttribute('href');}set href(v){this.setAttribute('href',v);}
  get target(){return this.getAttribute('target');}set target(v){this.setAttribute('target',v);}
  get rel(){return this.getAttribute('rel');}set rel(v){this.setAttribute('rel',v);}
  get title(){return this.getAttribute('title');}set title(v){this.setAttribute('title',v);}
  get classList(){return {contains:c=>this.className.split(/\s+/).includes(c),toggle:(c,on)=>{const set=new Set(this.className.split(/\s+/).filter(Boolean));(on===undefined?!set.has(c):on)?set.add(c):set.delete(c);this.className=[...set].join(' ');}};}
  get disabled(){return 'disabled' in this.attributes;}set disabled(v){v?this.attributes.disabled='':delete this.attributes.disabled;}
  get hidden(){return 'hidden' in this.attributes;}set hidden(v){v?this.attributes.hidden='':delete this.attributes.hidden;}
  get textContent(){return this.nodeType===3?this.value:this.childNodes.map(n=>n.textContent).join('');}
  set textContent(v){if(this.nodeType===3)this.value=String(v);else this.replaceChildren(new Node('#text',{},String(v)));}
  get innerHTML(){return this._html||'';}
  set innerHTML(source){this._html=source;this.replaceChildren(...parse(source));}
  insertAdjacentHTML(position,source){if(position!=='beforeend')throw Error('Unsupported DOM adapter operation');this.append(...parse(source));}
  dispatch(type){const event={type,target:this,preventDefault(){}};for(let n=this;n;n=n.parentElement)for(const fn of n.listeners[type]||[])fn(event);}
  setAttribute(k,v){this.attributes[k]=String(v);if(k.startsWith('data-'))this.dataset[dataName(k)]=String(v);}
  getAttribute(k){return this.attributes[k]??null;}
  hasAttribute(k){return k in this.attributes;}
  append(...items){for(const n of items){if(n.tagName==='#FRAGMENT'){this.append(...n.childNodes);continue;}n.parentElement=this;this.childNodes.push(n);}}
  prepend(...items){for(const n of items)n.parentElement=this;this.childNodes.unshift(...items);}
  replaceChildren(...items){if(document?.activeElement&&this.contains(document.activeElement))document.activeElement=document.body;for(const n of this.childNodes)n.parentElement=null;this.childNodes=[];this.append(...items);}
  contains(n){return n===this||this.childNodes.some(c=>c.contains(n));}
  matches(selector){
   if(selector.includes(','))return selector.split(',').some(s=>this.matches(s.trim()));
   const attrs=[...selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)];let simple=selector.replace(/\[[^\]]+\]/g,'');
   if(attrs.some(([,key,value])=>!(key in this.attributes)||(value!==undefined&&this.attributes[key]!==value)))return false;
   const tag=simple.match(/^[\w-]+/);if(tag&&this.tagName!==tag[0].toUpperCase())return false;
   const id=simple.match(/#([\w-]+)/);if(id&&this.id!==id[1])return false;
   for(const [,cls]of simple.matchAll(/\.([\w-]+)/g))if(!this.classList.contains(cls))return false;
   return true;
  }
  querySelectorAll(selector){
   const alternatives=selector.split(',').map(x=>x.trim());const result=[];
   function matchTree(n,parts){if(!n.matches(parts.at(-1)))return false;let ancestor=n.parentElement;for(let i=parts.length-2;i>=0;i--){while(ancestor&&!ancestor.matches(parts[i]))ancestor=ancestor.parentElement;if(!ancestor)return false;ancestor=ancestor.parentElement;}return true;}
   function walk(n){for(const c of n.children){if(alternatives.some(s=>matchTree(c,s.split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/))))result.push(c);walk(c);}}
   walk(this);return result;
  }
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  closest(s){let n=this;while(n){if(n.matches(s))return n;n=n.parentElement;}return null;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  click(){if(this.disabled)return;const event={type:'click',target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};for(let n=this;n;n=n.parentElement)for(const fn of n.listeners.click||[])fn(event);}
  focus(){if(!this.disabled&&document.documentElement.contains(this))document.activeElement=this;}
 }
 function parse(source){
  const fragment=new Node('#fragment'),stack=[fragment];const voidTags=new Set(['AREA','BASE','BR','COL','EMBED','HR','IMG','INPUT','LINK','META','PARAM','SOURCE','TRACK','WBR']);
  for(const match of source.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+/g)){
   const token=match[0];if(token.startsWith('<!'))continue;
   if(token.startsWith('</')){const name=token.slice(2,-1).trim().toUpperCase();let i=stack.length-1;while(i>0&&stack[i].tagName!==name)i--;if(i)stack.length=i;continue;}
   if(token[0]==='<'){const [,tag,tail]=token.match(/^<([\w-]+)([\s\S]*?)\/?>(?:)$/),attrs={};for(const [,key,dq,sq,bare]of tail.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g))attrs[key]=decode(dq??sq??bare??'');const node=new Node(tag,attrs);stack.at(-1).append(node);if(!voidTags.has(node.tagName)&&!token.endsWith('/>'))stack.push(node);}
   else stack.at(-1).append(new Node('#text',{},decode(token)));
  }
  return fragment.childNodes;
 }
 const fragment=new Node('#fragment');fragment.append(...parse(html));
 document={readyState:'loading',listeners:{},addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);},dispatch(type){for(const fn of this.listeners[type]||[])fn({type});},getElementById:id=>fragment.querySelector('#'+id),documentElement:fragment.querySelector('html'),querySelector:s=>fragment.querySelector(s),querySelectorAll:s=>fragment.querySelectorAll(s),createElement:t=>new Node(t),createDocumentFragment:()=>new Node('#fragment'),activeElement:null};
 document.body=document.querySelector('body');document.activeElement=document.body;
 return document;
}
function createQuest(kind,options={}){
 const filename=path.join(ROOT,'games',pages[kind]+'.html'),document=makeDOM(fs.readFileSync(filename,'utf8'));
 const store=options.store||new Map(),writes=[];const localStorage={getItem:k=>{if(options.deniedRead)throw Error('Storage blocked');return store.get(k)??null;},setItem:(k,v)=>{if(options.deniedWrite)throw Error('Storage blocked');if(k!=='kris-language-check')writes.push([k,v]);store.set(k,v);},removeItem:k=>store.delete(k)};
 let seed=12345;const math=Object.create(Math);math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const context={document,console,Math:math,URL,location:{href:'https://example.test/games/'+pages[kind]+'.html',origin:'https://example.test'},addEventListener(){}};context.window=context;
 Object.defineProperty(context,'localStorage',{get(){if(options.deniedGetter)throw Error('Storage access denied');return localStorage;}});
 vm.createContext(context);const scripts=document.querySelectorAll('script[src]');for(const script of [...scripts.filter(s=>!s.hasAttribute('defer')),...scripts.filter(s=>s.hasAttribute('defer'))])vm.runInContext(fs.readFileSync(path.resolve(path.dirname(filename),script.getAttribute('src').split('?')[0]),'utf8'),context,{filename:script.getAttribute('src')});
 document.readyState='interactive';document.dispatch('DOMContentLoaded');
 const $=s=>document.querySelector(s),all=s=>document.querySelectorAll(s);
 const button=(act,value='')=>$(`button[data-act="${act}"][data-value="${value}"]`);
 const click=(act,value='')=>{const b=button(act,value);if(!b)throw Error(`Missing ${kind} button ${act}:${value}`);b.click();};
 return {document,context,$,all,button,click,store,writes,key:'kris-quest-v1-'+kind,kind};
}
module.exports={createQuest,makeDOM,pages,ROOT};
