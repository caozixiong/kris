# Moderated anonymous game reviews

All 23 actual game pages load the same dependency-free, Shadow DOM-isolated widget. The surname question is checked on the server before the text form opens, and checked again for every submission. No name, account or email field is used. The existing games and home directory are unchanged apart from loading this widget; two legacy pages allow vertical scrolling so the new section is reachable.

## Owner moderation on the website

Open [Admin · 评价管理](https://caozixiong.github.io/kris/admin.html), also linked in the homepage footer. Sign in with the authorized administrator's email using the one-time email link. There is no public account registration in this page.

1. Choose 待审核, 已通过, 已拒绝, or 全部, and optionally filter by game.
2. Read the plain-text review. Reject reviews that include names, contact details, or other personal information.
3. Choose 通过并公开, then 确认公开. The review becomes public on its game page.
4. Use 拒绝 / 下架并拒绝 to hide it, or 重新待审 to return it to the queue. Confirmations explain the effect. No deletion or text-editing action is offered.
5. Exit with 退出登录 when finished. Review text is cleared on logout/navigation. Only the current browser tab stores its login session. Magic links open in a new tab correctly; cross-tab Auth events never substitute another tab's credentials.

### One-time owner setup

Project: `Kris-reviews` (`oxzudyliysixpflfxsye`). Creating a Supabase project owner does not automatically create a website Auth account.

- Add the exact `https://caozixiong.github.io/kris/admin.html` URL to Auth's permitted redirect URLs. Keep unrelated URL settings unchanged.
- Invite the approved administrator using Supabase Auth. If an invite cannot specify a redirect, the admin page can send a fresh sign-in link to the already-created account with the correct redirect. Never paste tokens, magic-link URLs, passwords, or secret keys into source or chat.
- Disable public signup. Admin login calls `signInWithOtp` with `shouldCreateUser: false`; visitors can still submit anonymous reviews without Auth.
- Through a trusted owner connection, add only the separately approved `auth.users.id` to `review_private.admins`. The migration starts with an empty allowlist. Do not use `user_metadata` or a client-side email comparison to authorize.
- Confirm delivery and a real owner login before calling setup complete. Default Supabase SMTP only sends to organization-team emails and has low limits. Other recipient emails require an already-configured SMTP provider. No SMTP credential was retrieved or configured by this feature.

### Server-enforced authorization

The authenticated UI uses three narrow RPCs: `review_admin_status`, `review_admin_list`, and `review_admin_set_status`. Each is a `SECURITY INVOKER` public wrapper around a private, guarded implementation with an empty search path and explicit grants. Keep `review_private` outside Data API exposed schemas.

Every list/status/mutation checks the current Auth UID against the private allowlist, the server's live matching session row, explicit session expiry, email confirmation, non-anonymous status, deletion and bans. Removing an allowlist entry or revoking the session blocks further operations without waiting for JWT expiry. The code does not independently emulate plan-specific inactivity/timebox settings, which Auth enforces on refresh.

Only `status` can be updated, to pending/approved/rejected. Expected-status checking under a row lock prevents a stale page from overwriting a different moderation result. Reopening a review obeys the existing 1,000-pending queue cap. Pagination is bounded to 100 at the server (25 in the UI); counts respect the selected game. There is no new direct table grant and the existing anonymous submission service still cannot publish or read review bodies. No account email/UID or server secret is included in frontend files.

The admin page uses a self-hosted, version-pinned official Supabase client, a restrictive CSP, no external fonts/analytics/CDN scripts, text-only review rendering, no-referrer, and noindex. SessionStorage means closing the tab removes the local session, but this is not a server-side revocation; use the exit button. If remote signout fails, the page stays locked and explicitly reports that the server logout could not be confirmed.

## Secret configuration

The owner sets `REVIEW_GATE_ANSWER` in [Edge Function Secrets](https://supabase.com/dashboard/project/oxzudyliysixpflfxsye/functions/secrets). Its value is never committed to source or returned to the browser. Case, surrounding whitespace, and Unicode compatibility-width differences are normalized. Missing/blank configuration disables the API. No production secret was retrieved during implementation.

Abuse identifiers use a domain-separated HKDF/HMAC key derived in runtime memory from the platform-provided server key. No extra saved credential is needed. Rotating the platform key also rotates abuse identifiers. The browser stores the entered answer only in the live widget instance until submission, cancellation, or navigation; no browser storage/cookies are used by the widget. The answer is not a column in either database table and is never sent to the database. Application code does not log request bodies, secrets, or IPs. Supabase may retain its own normal infrastructure/access logs.

A surname is a lightweight participation question, not a strong password or identity proof. Moderation is the control that protects the public page. Instruct visitors not to submit personal information.

## Permissions and abuse limits

- `game_reviews`: RLS enabled. `anon` and `authenticated` can select only game ID, plain text and calendar date from approved rows. They cannot read IDs/status, see pending/rejected rows, or write anything.
- `review_private.admins`: RLS enabled, no policies or client table grants. Only trusted owner tooling manages the UID allowlist. Authenticated schema USAGE and narrow function EXECUTE grants do not permit table reads.
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

## Admin deployment and checks

The approved admin schema was applied to the same project as migration `20261008021632_secure_review_admin`. `supabase/admin-schema.sql` is the matching review/test reference, not an additional migration to apply. The original public Edge Function is unchanged. Account invitation, email delivery, and the real owner's first login are separate setup checks and must not be inferred from local tests.

Run `node tests/test_admin_ui.cjs` for the actual front-end handlers with a DOM adapter. It covers signed-out/nonadmin lock, safe text rendering, existing-user-only email login, resend cooldown, confirmation/cancel, repeated clicks, filtering and reversible statuses, stale writes, remote denials, signout errors, navigation and delayed responses. This does not establish real-browser layout or actual email delivery.

Run `PGLITE_MODULE=<path-to-pglite-dist/index.js> node tests/test_admin_database.mjs` with `@electric-sql/pglite@0.5.8` for the 13 actual PostgreSQL-engine security groups. They include forged metadata, unrelated UID/sessions, account bans/deletion, live revocation, preserved table grants, no text editing/deletion, stale status conflicts and queue capacity.

Hosted checks confirmed anonymous RPC execution is denied and a simulated authenticated nonadmin (including forged admin metadata) cannot list or mutate reviews. The allowlist starts empty. These checks do not create a test Auth account, persist synthetic feedback, expose tokens, or establish the real owner's end-to-end login.

Security advisor: the only new notice is the expected RLS-without-policy information item on the closed private allowlist. Existing warnings on `public.rls_auto_enable` remain pre-existing. See [RLS no-policy explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) and [function execution warning](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).


## Adding English–French games

The `add_bilingual_word_game_reviews` migration expands only `game_reviews_game_id_check` to accept `bilingual-memory`, `word-bridge` and `sentence-match`. The current schema snapshot and Edge Function allowlist include the same 23 IDs. Existing migration files, moderation behavior, quotas, grants, policies and authentication stay unchanged. Deploy the constraint migration and the matching function before publishing the new game wrappers; preserve the existing function configuration.
