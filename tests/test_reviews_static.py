from pathlib import Path
import hashlib, re
from lxml import html
ROOT=Path(__file__).resolve().parents[1]
expected={'bilingual-memory','word-bridge','sentence-match','addition_game','multiplication_game','shape_sorter_math','vocabulary_quiz','chinese_character_quiz','chinese_game1','circuit-lab','english-ruins','french-market','math-orbit','math1','math10','math234','math567','math8','math9','math_addition_subtraction','math_chinese','math_english','math_visual_game'}
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
assert set(found)==expected and len(found)==23
source=(ROOT/'supabase/functions/game-reviews/core.mjs').read_text()
for game in expected: assert "'"+game+"'" in source
front=(ROOT/'assets/reviews/reviews.js').read_text()
assert 'attachShadow' in front and 'text.textContent = review.body' in front
assert all(s not in front for s in ['localStorage','sessionStorage','SUPABASE_SERVICE_ROLE_KEY','REVIEW_GATE_ANSWER'])
assert not re.search(r'\.innerHTML\s*=\s*(data|review)',front)
assert 'Kris 的 last name 是什么？' in front and '无需姓名或账号' in front
assert not re.search(r'<input[^>]+(?:name|email|tel)\s*=',front)
assert 'REVIEW_GATE_ANSWER' not in (ROOT/'assets/reviews/config.js').read_text()
snapshot=(ROOT/'supabase/schema.sql').read_text()
original=next((ROOT/'supabase/migrations').glob('*_anonymous_moderated_game_reviews.sql')).read_text()
# The current snapshot may only differ from the original in its header and ID check.
def without_header_and_game_check(sql):
 return re.sub(r"game_id text not null check \(game_id in \(.*?\)\)",'<game-id-check>',re.sub(r'^--.*\n','',sql,flags=re.M),flags=re.S)
assert without_header_and_game_check(snapshot)==without_header_and_game_check(original)
new_migrations=list((ROOT/'supabase/migrations').glob('*_add_bilingual_word_game_reviews.sql'))
assert len(new_migrations)==1
migration=new_migrations[0].read_text()
assert 'drop constraint game_reviews_game_id_check' in migration
for game in expected:
 assert "'"+game+"'" in migration and "'"+game+"'" in snapshot
assert not re.search(r'\b(grant|revoke|policy|function|trigger|delete|insert|update)\b',re.sub(r'--[^\n]*','',migration),re.I)
assert set(re.findall(r"'([^']+)'",migration))==expected
print('PASS: all 23 actual game pages have exactly one isolated shared widget, hash-matched scripts, canonical IDs; non-game pages excluded; narrow-screen overflow fixed; no client answer/storage fields.')
