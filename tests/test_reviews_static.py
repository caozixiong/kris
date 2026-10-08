from pathlib import Path
import hashlib, re
from lxml import html
ROOT=Path(__file__).resolve().parents[1]
expected={'addition_game','multiplication_game','shape_sorter_math','vocabulary_quiz','chinese_character_quiz','chinese_game1','circuit-lab','english-ruins','french-market','math-orbit','math1','math10','math234','math567','math8','math9','math_addition_subtraction','math_chinese','math_english','math_visual_game'}
found=[]
for page in ROOT.rglob('*.html'):
 if '.git' in page.parts: continue
 doc=html.fromstring(page.read_text().strip() or '<html></html>')
 widgets=doc.xpath('//kris-reviews')
 if page.stem not in expected:
  assert not widgets, page
  continue
 assert len(widgets)==1,page
 assert widgets[0].get('data-game')==page.stem
 found.append(page.stem)
 scripts=doc.xpath('//script[contains(@src,"assets/reviews/")]')
 assert [Path(s.get('src').split('?')[0]).name for s in scripts]==['config.js','reviews.js']
 for s in scripts:
  assert 'defer' in s.attrib
  source=s.get('src');asset=(page.parent/source.split('?')[0]).resolve()
  assert asset.is_file() and source.split('?v=')[1]==hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
 if page.stem in ['shape_sorter_math','math8']:
  assert 'overflow-y: auto' in page.read_text()
assert set(found)==expected and len(found)==20
source=(ROOT/'supabase/functions/game-reviews/core.mjs').read_text()
for game in expected: assert "'"+game+"'" in source
front=(ROOT/'assets/reviews/reviews.js').read_text()
assert 'attachShadow' in front and 'text.textContent = review.body' in front
assert all(s not in front for s in ['localStorage','sessionStorage','SUPABASE_SERVICE_ROLE_KEY','REVIEW_GATE_ANSWER'])
assert not re.search(r'\.innerHTML\s*=\s*(data|review)',front)
assert 'Kris 的 last name 是什么？' in front and '无需姓名或账号' in front
assert not re.search(r'<input[^>]+(?:name|email|tel)\s*=',front)
assert 'REVIEW_GATE_ANSWER' not in (ROOT/'assets/reviews/config.js').read_text()
assert (ROOT/'supabase/schema.sql').read_text()==next((ROOT/'supabase/migrations').glob('*_anonymous_moderated_game_reviews.sql')).read_text()
print('PASS: all20 actual game pages have exactly one isolated shared widget, hash-matched scripts, canonical IDs; non-game pages excluded; narrow-screen overflow fixed; no client answer/storage fields.')
