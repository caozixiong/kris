"""Refresh local JS/CSS cache keys after editing assets; no network or publication."""
from pathlib import Path
import hashlib
import re
root = Path(__file__).resolve().parents[1]
for page in root.rglob('*.html'):
    if '.git' in page.parts or 'node_modules' in page.parts:
        continue
    text = page.read_text()
    def version(match):
        target = match[2].split('?')[0]
        asset = page.parent / target
        if target.startswith(('http:', 'https:', '//')) or not asset.is_file():
            return match[0]
        return match[1] + target + '?v=' + hashlib.sha256(asset.read_bytes()).hexdigest()[:12] + match[3]
    text = re.sub(r'''((?:src|href)=["'])([^"']+\.(?:js|css)(?:\?v=[^"']+)?)(["'])''', version, text)
    page.write_text(text)
