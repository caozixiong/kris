# Admin authentication client

`supabase-2.117.3.js` is the unmodified official UMD distribution of `@supabase/supabase-js@2.117.3` from npm, self-hosted so the admin page does not execute a mutable CDN script. The MIT license is included in `supabase-LICENSE.txt`.

The exact package version and dependency integrity hashes are pinned in `tools/admin-vendor/package.json` and `package-lock.json`. To reproduce, run `npm ci && npm run vendor` in that directory. No npm install or build is needed for GitHub Pages.

The SDK is loaded only on `admin.html`; ordinary game pages and the public review widget remain dependency-free. The admin page's CSP permits scripts only from this site and API connections only to the Kris-reviews project.
