from pathlib import Path
from lxml import html
import hashlib,re,json
root=Path(__file__).resolve().parents[1]
doc=html.fromstring((root/'admin.html').read_text())
assert doc.xpath('//meta[@name="robots"]/@content')==['noindex,nofollow']
assert doc.xpath('//meta[@name="referrer"]/@content')==['no-referrer']
csp=doc.xpath('//meta[@http-equiv="Content-Security-Policy"]/@content')[0]
assert "script-src 'self'" in csp and 'unsafe-inline' not in csp and 'unsafe-eval' not in csp
assert 'connect-src https://oxzudyliysixpflfxsye.supabase.co;' in csp
for asset in doc.xpath('//script[@src]/@src')+doc.xpath('//link[@rel="stylesheet"]/@href'):
 p=root/asset.split('?')[0];assert p.is_file()
 assert asset.split('?v=')[1]==hashlib.sha256(p.read_bytes()).hexdigest()[:12]
assert not doc.xpath('//script[not(@src)]')
assert not doc.xpath('//input[@type="password"]')
assert html.fromstring((root/'index.html').read_text()).xpath('//footer//a[@href="admin.html"]')
source=(root/'assets/admin/admin.js').read_text()
assert 'shouldCreateUser:false' in source
assert 'sessionStorage' in source and 'localStorage' not in source
assert '.innerHTML' not in source and 'eval(' not in source
assert all(t in source for t in ['review_admin_status','review_admin_list','review_admin_set_status','p_expected_status','pagehide','pageshow','SIGNED_OUT'])
assert (root/'supabase/admin-schema.sql').read_text()==next((root/'supabase/migrations').glob('*_secure_review_admin.sql')).read_text()
assert hashlib.sha256((root/'assets/vendor/supabase-2.117.3.js').read_bytes()).hexdigest()=='d6a5c4414a5d4ce646d9c1de223aa7067d3ff664c15394ffeb7fcffc763354a3'
assert json.loads((root/'tools/admin-vendor/package.json').read_text())['dependencies']['@supabase/supabase-js']=='2.117.3'
assert (root/'assets/admin/games.js').read_text().count('"id":')==26
games=json.loads(re.search(r'Object.freeze\((\[.*?\])\);',(root/'assets/admin/games.js').read_text(),re.S)[1])
assert len({g['id'] for g in games})==26
for g in games:
 page=root/g['href'].removeprefix('./');assert page.is_file()
 widgets=html.fromstring(page.read_text()).xpath('//kris-reviews/@data-game');assert widgets==[g['id']]
print('PASS: admin entry, all 26 game labels, strict CSP/referrer, pinned official SDK integrity, local versioned assets, existing-only email login, session-only storage, no raw HTML render, matching migration.')
