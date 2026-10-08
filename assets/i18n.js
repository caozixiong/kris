/* Site-wide language preference. Translation changes text, never game state. */
(() => {
 'use strict';
 const languages = ['zh','en','fr'], locale = {zh:'zh-CN',en:'en',fr:'fr-CA'};
 const entries = new Map(), reverse = new Map(), patterns = [], sources = new WeakMap(), attrSources = new WeakMap(), roots = new Set(), listeners = new Set();
 let storage = null, language = 'zh', observer, scheduled = false;
 try { const candidate = window.localStorage; candidate.setItem('kris-language-check','1'); candidate.removeItem('kris-language-check'); storage = candidate; } catch (_) {}
 try { if (!storage) { const candidate = window.sessionStorage; candidate.setItem('kris-language-check','1'); candidate.removeItem('kris-language-check'); storage = candidate; } } catch (_) {}
 try { const saved = storage?.getItem('kris-site-language') || storage?.getItem('kris-math-language'); if (languages.includes(saved)) language = saved; } catch (_) {}
 try { const requested = new URL(window.location.href).searchParams.get('lang'); if (languages.includes(requested)) { language = requested; try { storage?.setItem('kris-site-language',language); } catch (_) { storage = null; } } } catch (_) {}
 const t = (zh,en,fr) => ({zh,en,fr})[language] ?? zh;
 function translate(value) {
  if (typeof value !== 'string' || !value.trim()) return value;
  const before = value.match(/^\s*/)[0], after = value.match(/\s*$/)[0], trimmed = value.trim();
  const source = entries.has(trimmed) ? trimmed : reverse.get(trimmed) || trimmed;
  const direct = entries.get(source);
  if (direct) return before + (language === 'zh' ? source : direct[language === 'en' ? 0 : 1]) + after;
  for (const item of patterns) {
   item.pattern.lastIndex = 0; const match = source.match(item.pattern);
   if (match) { const target = item[language]; if (target !== undefined) return before + (typeof target === 'function' ? target(...match.slice(1)) : target) + after; }
  }
  return value;
 }
 const skip = element => element?.closest?.('[data-i18n-skip],[data-no-i18n],[translate="no"]');
 function textNode(node) {
  if (skip(node.parentElement)) return;
  const old = sources.get(node), current = node.nodeValue;
  const source = old && current === old.output ? old.source : current;
  const output = translate(source); sources.set(node,{source,output}); if (current !== output) node.nodeValue = output;
 }
 function walk(node) {
  if (!node) return;
  if (node.nodeType === 3) { textNode(node); return; }
  if (node.nodeType === 1) {
   if (skip(node) || ['SCRIPT','STYLE','NOSCRIPT','CODE','PRE'].includes(node.tagName)) return;
   const attrs = ['title','placeholder','aria-label','alt'];
   if (node.tagName === 'META' && node.getAttribute('name') === 'description') attrs.push('content');
   let saved = attrSources.get(node); if (!saved) { saved = {}; attrSources.set(node,saved); }
   for (const name of attrs) { const current = node.getAttribute(name); if (current === null) continue; const old = saved[name]; const source = old && current === old.output ? old.source : current; const output = translate(source); saved[name] = {source,output}; if (current !== output) node.setAttribute(name,output); }
   if (node.tagName === 'TEXTAREA' || node.tagName === 'INPUT') return;
  }
  for (const child of Array.from(node.childNodes || [])) walk(child);
 }
 function refresh(root) { if (root) walk(root); else for (const item of roots) walk(item); }
 function queueRefresh() { if (scheduled) return; scheduled = true; Promise.resolve().then(() => { scheduled = false; refresh(); }); }
 function watch(root) { roots.add(root); if (observer) observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label','alt','content']}); refresh(root); return () => roots.delete(root); }
 function syncControls() {
  document.documentElement.lang = locale[language];
  document.querySelectorAll('[data-site-language]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.siteLanguage === language)));
  const bar = document.getElementById('kris-language-bar'); if (bar) bar.setAttribute('aria-label',t('网站语言','Website language','Langue du site'));
 }
 function setLanguage(value) {
  if (!languages.includes(value)) return;
  language = value; try { storage?.setItem('kris-site-language',value); } catch (_) { storage = null; }
  try { const url = new URL(window.location.href); if (!storage || url.searchParams.has('lang')) { url.searchParams.set('lang',value); window.history?.replaceState(window.history.state,'',url.href); } } catch (_) {}
  syncControls(); refresh();
  for (const listener of listeners) listener(value);
  refresh();
 }
 function localizeURL(value) {
  if (storage) return value;
  try { const url = new URL(value,window.location.href); if (url.origin === window.location.origin && !value.startsWith('#')) { url.searchParams.set('lang',language); return url.href; } } catch (_) {}
  return value;
 }
 function start() {
  const bar = document.createElement('nav'); bar.id = 'kris-language-bar'; bar.className = 'kris-language-bar'; bar.setAttribute('data-i18n-skip','');
  const inner = document.createElement('div'); inner.className = 'kris-language-inner';
  for (const [value,label] of [['zh','中文'],['en','English'],['fr','Français']]) { const button = document.createElement('button'); button.type = 'button'; button.dataset.siteLanguage = value; button.lang = locale[value]; button.textContent = label; button.addEventListener('click',() => setLanguage(value)); inner.append(button); }
  bar.append(inner); document.body.prepend(bar);
  if (window.MutationObserver) observer = new MutationObserver(queueRefresh);
  for (const root of roots) if (observer) observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label','alt','content']});
  watch(document.documentElement); syncControls();
  document.addEventListener('click',event => { if (storage) return; const anchor = event.target.closest?.('a[href]'); if (anchor && !anchor.hasAttribute('download')) anchor.href = localizeURL(anchor.getAttribute('href')); },true);
 }
 window.KrisI18n = { get language(){return language;}, get locale(){return locale[language];}, t, translate, setLanguage, refresh, watch, localizeURL,
  register(catalog){for(const [source,values] of Object.entries(catalog)){entries.set(source,values);for(const value of values) if(typeof value==='string' && !reverse.has(value)) reverse.set(value,source);}refresh();},
  registerPatterns(values){patterns.push(...values);refresh();},
  onChange(fn){listeners.add(fn);return()=>listeners.delete(fn);}
 };
 document.documentElement.lang = locale[language];
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
 window.addEventListener('storage',event => {if(event.key === 'kris-site-language' && languages.includes(event.newValue)) setLanguage(event.newValue);});
})();
