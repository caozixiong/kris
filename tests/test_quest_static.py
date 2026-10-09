"""Read actual HTML/content/CSS. No browser, network, or rendering claims."""
from pathlib import Path
from lxml import html
import hashlib, json, re, subprocess
R=Path(__file__).resolve().parents[1]
pages={'math':'math-orbit','english':'english-ruins','french':'french-market','science':'circuit-lab'}
rows=lambda text:[dict(title=m[1],url=m[2],description=m[3]) for line in text.splitlines() if (m:=re.match(r'\* \[([^]]+)\]\((\S+)\)\s*-\s*(.*)',line))]
current=rows((R/'content.md').read_text()); baseline=json.loads((R/'tests/homepage-baseline.json').read_text())
assert len(baseline)==29 and len(current)==48
byurl={r['url']:r for r in current};assert len(byurl)==48
for old in baseline:
 expected=dict(old)
 if old['url']=='./games/chinese_character_quiz.html': expected['description']='先看图认识 4 个词，再用两个选项慢慢练习。'
 assert byurl.get(old['url'])==expected,('Original directory entry changed beyond requested Chinese adaptation',old)
index=html.fromstring((R/'index.html').read_text())
cards=index.xpath('//a[@data-game or @data-resource-title]');assert len(cards)==48
for entry in current:
 hits=[a for a in cards if a.get('href')==entry['url']];assert len(hits)==1,entry['url']
 c=hits[0];assert c.xpath('.//h3')[0].text_content().strip()==entry['title'];assert c.xpath('.//p')[0].text_content().strip()==entry['description']
 if not entry['url'].startswith('./'):assert c.get('target')=='_blank' and {'noopener','noreferrer'}<=set(c.get('rel','').split())
assert index.xpath('//*[@id="game-count"]')[0].text=='26'
assert len(index.xpath('//*[@id="game-grid"]/a'))==26
for kind,name in pages.items():
 filename=R/'games'/f'{name}.html';doc=html.fromstring(filename.read_text());assert doc.get('lang')=='zh-CN';assert doc.xpath('//body')[0].get('data-quest')==kind
 ids=doc.xpath('//@id');assert len(ids)==len(set(ids));assert doc.xpath('//meta[@name="viewport"]');assert doc.xpath('//noscript');assert doc.xpath('//main[@id="quest-app"]')
 assert doc.xpath('//*[@id="quest-announcement" and @aria-live="polite"]');assert not doc.xpath('//*[@id="quest-app"]//*[@id="quest-announcement"]'),'live region must survive root rerenders'
 scripts=doc.xpath('//script[@src]')
 assert [x.get('src').split('?')[0] for x in scripts if '/i18n' not in x.get('src')]==['../assets/quest-data.js','../assets/quest-core.js','../assets/quest.js','../assets/reviews/config.js','../assets/reviews/reviews.js']
 assert all('defer' in x.attrib for x in scripts if '/i18n' not in x.get('src'))
 assert [Path(x.get('src').split('?')[0]).name for x in scripts if '/i18n' in x.get('src')]==['i18n.js','i18n-site.js','i18n-adventures.js','i18n-reviews.js']
 for el in doc.xpath('//script[@src]|//link[@href]'):
  src=el.get('src') or el.get('href');assert not src.startswith(('http','//'));asset=(filename.parent/src.split('?')[0]).resolve();assert asset.is_file(),asset
  if '?v=' in src:assert src.split('?v=')[1]==hashlib.sha256(asset.read_bytes()).hexdigest()[:12],src
 for anchor in doc.xpath('//a[@href]'):
  url=anchor.get('href')
  if url.startswith('#'):assert url[1:] in ids
  elif url.startswith('http'):assert anchor.get('target')=='_blank' and {'noopener','noreferrer'}<=set(anchor.get('rel','').split())
  else:assert (filename.parent/url.split('#')[0]).resolve().is_file(),url
 assert f'./games/{name}.html' in byurl
for name in ['addition_game.html','multiplication_game.html']:
 doc=html.fromstring((R/name).read_text());ids=doc.xpath('//@id');assert len(ids)==len(set(ids));assert doc.xpath('//input[@id="answer" and @inputmode="numeric"]');assert doc.xpath('//*[@id="feedback" and @role="status"]')
 def node(e):return {'tag':e.tag,'attrs':dict(e.attrib),'text':e.text or '','children':[node(c) for c in e if isinstance(c.tag,str)]}
 (R/'tests'/f'{name}.json').write_text(json.dumps(node(doc),ensure_ascii=False))
css=(R/'assets/quest.css').read_text();assert ':focus-visible' in css;assert '[hidden]{display:none!important}' in css;assert '@media(prefers-reduced-motion:no-preference)' in css
for width in [950,740,390]:assert f'@media(max-width:{width}px)' in css
script=(R/'assets/quest.js').read_text();assert not re.search(r'\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(',script)
for asset in ['quest-data.js','quest-core.js','quest.js','math-core.js','math-game.js']:
 subprocess.run(['node','--check',str(R/'assets'/asset)],check=True)
subprocess.run(['node','--check',str(R/'script.js')],check=True)
print('PASS: 29 prior directory entries preserved (requested Chinese description updated); 48 exact source/fallback cards; 26 game links; 4 valid new pages, local/hash-matched assets, persistent live regions, no runtime network APIs, CSS narrow/reduced-motion/focus rules; legacy HTML fixtures refreshed.')
