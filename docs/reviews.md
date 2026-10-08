# Moderated anonymous game reviews

All 20 actual game pages load the same dependency-free, Shadow DOM-isolated widget. The surname question is checked on the server before the text form opens, and checked again for every submission. No name, account or email field is used. The existing games and home directory are unchanged apart from loading this widget; two legacy pages allow vertical scrolling so the new section is reachable.

## Owner moderation

Project: `Kris-reviews` (`oxzudyliysixpflfxsye`), region `ap-northeast-1`.

Open [Supabase Table Editor](https://supabase.com/dashboard/project/oxzudyliysixpflfxsye/editor) and select `public.game_reviews`.

1. Filter `status` to `pending`.
2. Read `body` and `game_id`. Remove personal information before approving, or reject the review.
3. Set `status` to `approved` and save to make it public. Use `rejected` to keep it hidden.
4. To hide a published review, change it to `rejected`. Visitors can refresh the page or use “刷新评价”.

The public site has no moderation endpoint. The Edge Function cannot set or change a review status. Dashboard access remains under the project's existing owner/admin accounts. Do not give visitors a service-role/secret key.

## Secret configuration

The owner sets `REVIEW_GATE_ANSWER` in [Edge Function Secrets](https://supabase.com/dashboard/project/oxzudyliysixpflfxsye/functions/secrets). Its value is never committed to source or returned to the browser. Case, surrounding whitespace, and Unicode compatibility-width differences are normalized. Missing/blank configuration disables the API. No production secret was retrieved during implementation.

Abuse identifiers use a domain-separated HKDF/HMAC key derived in runtime memory from the platform-provided server key. No extra saved credential is needed. Rotating the platform key also rotates abuse identifiers. The browser stores the entered answer only in the live widget instance until submission, cancellation, or navigation; no browser storage/cookies are used by the widget. The answer is not a column in either database table and is never sent to the database. Application code does not log request bodies, secrets, or IPs. Supabase may retain its own normal infrastructure/access logs.

A surname is a lightweight participation question, not a strong password or identity proof. Moderation is the control that protects the public page. Instruct visitors not to submit personal information.

## Permissions and abuse limits

- `game_reviews`: RLS enabled. `anon` and `authenticated` can select only game ID, plain text and calendar date from approved rows. They cannot read IDs/status, see pending/rejected rows, or write anything.
- `service_role`: only `INSERT(game_id, body)` and `SELECT(status)` on reviews. Pending is a database default. Status selection is solely for the bounded pending-queue trigger; review text cannot be read with this service role.
- The private rate table has RLS enabled, no public schema access, and no anonymous policies. Only the server role uses its atomic, `SECURITY INVOKER` rate RPC.
- Per observed network signal: 10 verification/submission attempts per fixed 10-minute window and 3 submissions per fixed hour. Failed answers count. There is also a site-wide 200-attempt/10-minute cap and a 1,000-pending-review cap.
- Network identifiers are HMAC hashes rotated each UTC day. Raw IPs, user agents, and fingerprints are not stored. Expired counters are deleted opportunistically on the next submission/verification request; they can remain during inactivity. Day rotation can reset a bucket at midnight.
- Forwarded IP headers are a best-effort signal, not authentication. Supabase examples use the first forwarded IP, but an anti-spoofing guarantee was not established. Shared global/queue caps still bound abuse when IP-based limits are evaded.
- Review bodies: 1–500 UTF-16 code units, no low control characters, plain-text rendering via `textContent`. Requests are bounded to 4,096 bytes. Public listing is limited to the most recent 50 rows by date. No HTML or Markdown is rendered.
- The public Edge endpoint intentionally has `verify_jwt=false`; its server answer check protects every final submission. CORS allows the existing GitHub Pages origin only and is not treated as authentication.

## Deployment and verification

The initial approved schema was applied with Supabase's migration API and deployed as `game-reviews` version 1. The repository migration filename matches the verified remote migration version `20261008013045`. `supabase/schema.sql` is the identical review/test reference, not a second migration to apply. Frontend config contains only the public function URL.

Local verification:

```sh
python tests/test_quest_static.py
node tests/test_quest_core.cjs
node tests/test_quest_flow.cjs
node tests/test_homepage.cjs
node tests/test_math_core.cjs
node tests/test_math_flow.cjs
python tests/test_reviews_static.py
node tests/test_reviews_api.mjs
node tests/test_reviews_widget.cjs
```

For actual PostgreSQL-engine permission/constraint tests, install `@electric-sql/pglite@0.5.8` in a temporary development directory and set `PGLITE_MODULE` to its `dist/index.js` file, then run `node tests/test_reviews_database.mjs`. No package is loaded by the website. This checks the executed SQL, column privileges, approved-only RLS, denied direct writes and RPCs, atomic counters, expired-counter cleanup, and the 1,000-row queue cap.

Hosted verification uses no production answer: public GET succeeds; missing/wrong answers are denied. A transaction containing synthetic approved/pending/rejected rows confirmed only approved rows are readable as `anon`; the transaction was rolled back. A separate rolled-back server-role insertion confirmed the database sets `pending`. Catalog checks confirmed no public insert, public status read, public rate RPC, server text read, or server publish permission. No synthetic review was persisted or made visible outside those uncommitted transactions.

The security advisor reported the expected private rate-table no-policy information item and warnings on Supabase's pre-existing `public.rls_auto_enable` event-trigger function. That built-in function was not changed; direct invocation was checked and PostgreSQL rejected it as an event-trigger return type. No review function uses `SECURITY DEFINER`.

The correct-answer flow is exercised locally with a random, synthetic value; the production value is known only to the owner. The owner can confirm the complete production flow by submitting a real review, then approving it in Table Editor. DOM-adapter tests do not establish visual/device/audio accessibility behavior.

## Current official references

- [Public Edge functions and custom verification](https://supabase.com/docs/guides/functions/auth)
- [Function secrets](https://supabase.com/docs/guides/functions/secrets)
- [Data API security](https://supabase.com/docs/guides/api/securing-your-api)
- [Column-level security](https://supabase.com/docs/guides/database/postgres/column-level-security)
- [Changelog: explicit Data API grants](https://supabase.com/changelog)
