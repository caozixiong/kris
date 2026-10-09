(function (root) {
  'use strict';
  const apply = (value, op) => op[0] === '+' ? value + op[1] : op[0] === '−' ? value - op[1] : op[0] === '×' ? value * op[1] : value / op[1];
  const route = (level, picks) => picks.reduce((values, index) => [...values, apply(values[values.length - 1], level.ops[index])], [level.start]);
  const mathCorrect = (level, picks) => picks.length === level.steps && new Set(picks).size === picks.length && picks.every(i => Number.isInteger(i) && i >= 0 && i < level.ops.length) && route(level,picks).slice(1).every(n => Number.isInteger(n) && n >= 0) && route(level,picks).at(-1) === level.target;
  const normalize = text => String(text).normalize('NFC').toLowerCase().trim();
  const sentenceCorrect = (words, actual) => words.length === actual.length && words.every((word,i) => normalize(word) === normalize(actual[i]));
  const sentencePrefix = (words,actual) => {let n=0;while(n<actual.length&&n<words.length&&normalize(words[n])===normalize(actual[n]))n++;return n;};
  const frenchQuantity = (product,quantity) => `${quantity===1?product.gender:['zéro','un','deux','trois','quatre','cinq'][quantity]||quantity} ${quantity===1?product.name:product.plural}`;
  const cartCorrect = (want, cart) => [...new Set([...Object.keys(want),...Object.keys(cart)])].every(id => (want[id] || 0) === (cart[id] || 0));
  const lampOn = (material,closed) => Boolean(material && material.conducts && closed);
  const scienceCorrect = (level,material,closed,prediction) => Boolean(material && (level.anyConductor ? material.conducts : material.id === level.material) && closed === level.closed && prediction === lampOn(material,closed));
  function shuffle(array,random=Math.random) {const copy=[...array];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
  function readProgress(storage,key,length) {try {const raw=JSON.parse(storage.getItem(key));return Array.isArray(raw)?[...new Set(raw.filter(n=>Number.isInteger(n)&&n>=0&&n<length))]:[];}catch{return [];}}
  const core={apply,route,mathCorrect,sentenceCorrect,sentencePrefix,frenchQuantity,cartCorrect,lampOn,scienceCorrect,shuffle,readProgress};
  if(typeof module!=='undefined'&&module.exports)module.exports=core;else root.QuestCore=core;
})(typeof window!=='undefined'?window:globalThis);
