// Local Postgres regression/security tests. No project URL, API keys or network calls.
// Example: PGLITE_MODULE=/tmp/kris-db-deps/node_modules/@electric-sql/pglite/dist/index.js node tests/test_admin_database.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';

const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const ADMIN = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const SESSION = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_SESSION = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const REVIEW = '10000000-0000-4000-8000-000000000001';
const APPROVED = '10000000-0000-4000-8000-000000000002';
const REJECTED = '10000000-0000-4000-8000-000000000003';
const GAME2 = '10000000-0000-4000-8000-000000000004';
const adminClaims = { sub: ADMIN, session_id: SESSION, role: 'authenticated' };
const otherClaims = { sub: OTHER, session_id: OTHER_SESSION, role: 'authenticated' };
let groups = 0;

const as = async (role, claims, sql, values = []) => {
  assert.ok(['anon', 'authenticated', 'service_role'].includes(role));
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims || {})]);
  await db.exec(`set role ${role}`);
  try {
    return await db.query(sql, values);
  } finally {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claims', '{}', false)");
  }
};
const errorCode = async (role, claims, sql, values = [], expected = '42501') => {
  await assert.rejects(() => as(role, claims, sql, values), (error) => {
    assert.equal(error.code, expected, `${sql}: ${error.message}`);
    return true;
  });
};
const scalar = async (role, claims, sql, values = []) => (await as(role, claims, sql, values)).rows[0].value;
const rpcStatus = (claims) => scalar('authenticated', claims, 'select public.review_admin_status() as value');
const list = (status = 'pending', game = null, limit = 25, offset = 0) => scalar(
  'authenticated', adminClaims, 'select public.review_admin_list($1,$2,$3,$4) as value', [status, game, limit, offset]);
const setStatus = (id, expected, status) => scalar(
  'authenticated', adminClaims, 'select public.review_admin_set_status($1,$2,$3) as value', [id, expected, status]);
const group = async (name, fn) => {
  await fn();
  groups += 1;
  console.log(`PASS ${groups}: ${name}`);
};
const tableSecurity = async () => (await db.query(`
  select c.relrowsecurity, c.relacl::text as relacl,
    (select jsonb_agg(jsonb_build_object('name', a.attname, 'acl', a.attacl::text) order by a.attnum)
      from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped) as columns,
    (select jsonb_agg(jsonb_build_object('name', p.polname, 'command', p.polcmd,
      'roles', p.polroles::text, 'qual', pg_get_expr(p.polqual,p.polrelid),
      'check', pg_get_expr(p.polwithcheck,p.polrelid)) order by p.polname)
      from pg_policy p where p.polrelid=c.oid) as policies
  from pg_class c where c.oid='public.game_reviews'::regclass
`)).rows;

try {
  // Auth's server-owned records are stubbed only in this disposable test database.
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (
      id uuid primary key, email text, email_confirmed_at timestamptz,
      banned_until timestamptz, deleted_at timestamptz,
      is_anonymous boolean not null default false,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create table auth.sessions (
      id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
      not_after timestamptz
    );
    create function auth.jwt() returns jsonb language sql stable set search_path = '' as $$
      select coalesce(nullif(pg_catalog.current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
    $$;
    create function auth.uid() returns uuid language sql stable set search_path = '' as $$
      select nullif(auth.jwt()->>'sub', '')::uuid;
    $$;
    grant usage on schema auth to anon, authenticated, service_role;
    revoke all on auth.users, auth.sessions from public, anon, authenticated, service_role;
  `);
  await db.exec(fs.readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));
  const beforeSecurity = await tableSecurity();
  await db.exec(fs.readFileSync(new URL('../supabase/admin-schema.sql', import.meta.url), 'utf8'));

  await group('existing review table RLS, policies and every column ACL remain byte-for-byte unchanged', async () => {
    assert.deepEqual(await tableSecurity(), beforeSecurity);
  });

  await db.query(`insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
    ($1,'owner@example.test',now(),'{}'),
    ($2,'owner@example.test',now(),'{"admin":true,"role":"admin"}')`, [ADMIN, OTHER]);
  await db.query('insert into auth.sessions(id,user_id) values($1,$2),($3,$4)', [SESSION, ADMIN, OTHER_SESSION, OTHER]);
  await db.query(`insert into public.game_reviews(id,game_id,body,status,created_on) values
    ($1,'addition_game','pending-secret','pending','2026-10-01'),
    ($2,'addition_game','approved-public','approved','2026-10-02'),
    ($3,'addition_game','rejected-secret','rejected','2026-10-03'),
    ($4,'multiplication_game','<img src=x onerror=alert(1)>','pending','2026-10-03')`, [REVIEW, APPROVED, REJECTED, GAME2]);

  await group('allowlist starts empty; schema does not grant access to an arbitrary existing account', async () => {
    assert.equal((await db.query('select count(*)::int as n from review_private.admins')).rows[0].n, 0);
    assert.equal(await rpcStatus(adminClaims), false);
    await errorCode('authenticated', adminClaims, 'select public.review_admin_list()');
  });
  await db.query('insert into review_private.admins(user_id) values($1)', [ADMIN]);

  await group('public wrappers are invokers; private implementations are guarded definers with empty search_path and narrow EXECUTE grants', async () => {
    const { rows } = await db.query(`
      select n.nspname, p.proname, p.prosecdef, p.proconfig,
        has_function_privilege('anon',p.oid,'EXECUTE') as anon_exec,
        has_function_privilege('authenticated',p.oid,'EXECUTE') as auth_exec,
        has_function_privilege('service_role',p.oid,'EXECUTE') as service_exec
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where p.proname in ('review_admin_status','review_admin_list','review_admin_set_status')
      order by n.nspname,p.proname`);
    assert.equal(rows.length, 6);
    for (const row of rows) {
      assert.equal(row.prosecdef, row.nspname === 'review_private');
      assert.deepEqual(row.proconfig, ['search_path=""']);
      assert.equal(row.anon_exec, false);
      assert.equal(row.auth_exec, true);
      assert.equal(row.service_exec, false);
    }
    assert.equal((await db.query("select relrowsecurity from pg_class where oid='review_private.admins'::regclass")).rows[0].relrowsecurity, true);
    assert.equal((await db.query("select count(*)::int as n from pg_policy where polrelid='review_private.admins'::regclass")).rows[0].n, 0);
    for (const role of ['anon', 'authenticated', 'service_role']) {
      for (const sql of [
        'select * from review_private.admins',
        `insert into review_private.admins(user_id) values('${OTHER}')`,
        `update review_private.admins set user_id='${OTHER}'`,
        'delete from review_private.admins',
        'select * from auth.sessions',
        'select * from auth.users'
      ]) await errorCode(role, adminClaims, sql);
    }
  });

  await group('anonymous and service roles cannot call any moderation endpoint, including private implementations', async () => {
    for (const role of ['anon', 'service_role']) {
      for (const schema of ['public', 'review_private']) {
        for (const sql of [
          `select ${schema}.review_admin_status()`,
          `select ${schema}.review_admin_list()`,
          `select ${schema}.review_admin_set_status('${REVIEW}','pending','approved')`
        ]) await errorCode(role, adminClaims, sql);
      }
    }
  });

  await group('nonadmins, same-email users, forged metadata and null/mismatched/malformed sessions cannot moderate', async () => {
    for (const claims of [
      otherClaims,
      { ...otherClaims, email: 'owner@example.test', user_metadata: { admin: true, role: 'admin', user_id: ADMIN } },
      { ...otherClaims, app_metadata: { role: 'admin' } },
      {},
      { session_id: SESSION },
      { sub: ADMIN },
      { ...adminClaims, session_id: OTHER_SESSION },
      { ...otherClaims, session_id: SESSION },
      { ...adminClaims, session_id: 'not-a-uuid' },
      { ...adminClaims, session_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }
    ]) {
      assert.equal(await rpcStatus(claims), false);
      for (const schema of ['public', 'review_private']) {
        await errorCode('authenticated', claims, `select ${schema}.review_admin_list()`);
        await errorCode('authenticated', claims, `select ${schema}.review_admin_set_status('${REVIEW}','pending','approved')`);
      }
    }
  });

  await group('valid admin receives bounded pages, stable order, filters and same-snapshot counts with no extra fields', async () => {
    assert.equal(await rpcStatus(adminClaims), true);
    const pending = await list();
    assert.deepEqual(pending.counts, { pending: 2, approved: 1, rejected: 1, all: 4 });
    assert.equal(pending.total, 2);
    assert.equal(pending.limit, 25);
    assert.equal(pending.offset, 0);
    assert.deepEqual(pending.items.map((r) => r.id), [GAME2, REVIEW]);
    assert.deepEqual(Object.keys(pending.items[0]).sort(), ['id', 'game_id', 'body', 'status', 'created_on'].sort());
    assert.equal(pending.items[0].body, '<img src=x onerror=alert(1)>');
    const page = await list(null, null, 1, 1);
    assert.equal(page.total, 4);
    assert.equal(page.items.length, 1);
    assert.equal(page.items[0].id, REJECTED);
    const filtered = await list('approved', 'addition_game');
    assert.equal(filtered.total, 1);
    assert.equal(filtered.items[0].id, APPROVED);
    assert.deepEqual(filtered.counts, { pending: 1, approved: 1, rejected: 1, all: 3 });
    const beyond = await list(null, null, 25, 100);
    assert.deepEqual(beyond.items, []);
    assert.equal(beyond.total, 4);
    const missing = await list(null, 'unknown-game');
    assert.equal(missing.total, 0);
    assert.deepEqual(missing.items, []);
    assert.deepEqual(missing.counts, { pending: 0, approved: 0, rejected: 0, all: 0 });
    assert.equal((await list(null, "x' OR true --")).total, 0);
  });

  await group('invalid filters/pages are rejected rather than becoming unbounded queries', async () => {
    for (const values of [
      ['any', null, 25, 0], ['pending', '', 25, 0], ['pending', 'x'.repeat(101), 25, 0],
      ['pending', null, 0, 0], ['pending', null, 101, 0], ['pending', null, null, 0],
      ['pending', null, 25, -1], ['pending', null, 25, 100001], ['pending', null, 25, null]
    ]) await errorCode('authenticated', adminClaims, 'select public.review_admin_list($1,$2,$3,$4)', values, '22023');
  });

  await group('all moderation states are reversible, only status changes, stale writes conflict, and deletion/text APIs do not exist', async () => {
    const original = (await db.query('select * from public.game_reviews where id=$1', [REVIEW])).rows[0];
    assert.deepEqual(await setStatus(REVIEW, 'pending', 'approved'), { id: REVIEW, status: 'approved' });
    await errorCode('authenticated', adminClaims, 'select public.review_admin_set_status($1,$2,$3)', [REVIEW, 'pending', 'rejected'], '40001');
    assert.deepEqual(await setStatus(REVIEW, 'approved', 'rejected'), { id: REVIEW, status: 'rejected' });
    assert.deepEqual(await setStatus(REVIEW, 'rejected', 'pending'), { id: REVIEW, status: 'pending' });
    assert.deepEqual(await setStatus(REVIEW, 'pending', 'pending'), { id: REVIEW, status: 'pending' });
    assert.deepEqual((await db.query('select * from public.game_reviews where id=$1', [REVIEW])).rows[0], original);
    for (const values of [[null, 'pending', 'approved'], [REVIEW, null, 'approved'], [REVIEW, 'pending', null],
      [REVIEW, 'invalid', 'approved'], [REVIEW, 'pending', 'deleted']]) {
      await errorCode('authenticated', adminClaims, 'select public.review_admin_set_status($1,$2,$3)', values, '22023');
    }
    await errorCode('authenticated', adminClaims, 'select public.review_admin_set_status($1,$2,$3)', ['99999999-9999-4999-8999-999999999999', 'pending', 'approved'], 'P0002');
    await errorCode('authenticated', adminClaims, "select public.review_admin_set_status($1,'pending','approved','replacement text')", [REVIEW], '42883');
    for (const sql of [
      "update public.game_reviews set status='approved'",
      "update public.game_reviews set body='changed'",
      "update public.game_reviews set game_id='math1'",
      "update public.game_reviews set created_on='2020-01-01'",
      `update public.game_reviews set id='${OTHER}'`,
      'delete from public.game_reviews'
    ]) await errorCode('authenticated', adminClaims, sql);
  });

  await group('approval immediately changes only public approved-only visibility', async () => {
    const visible = async () => (await as('anon', {}, 'select body from public.game_reviews order by body')).rows.map((r) => r.body);
    assert.deepEqual(await visible(), ['approved-public']);
    await setStatus(REVIEW, 'pending', 'approved');
    assert.deepEqual(await visible(), ['approved-public', 'pending-secret']);
    await setStatus(REVIEW, 'approved', 'rejected');
    assert.deepEqual(await visible(), ['approved-public']);
    await setStatus(REVIEW, 'rejected', 'pending');
  });

  await group('live session revocation, expiry, allowlist removal, confirmation removal, bans and account deletion all take effect immediately', async () => {
    const blocked = async () => {
      assert.equal(await rpcStatus(adminClaims), false);
      await errorCode('authenticated', adminClaims, 'select public.review_admin_list()');
      await errorCode('authenticated', adminClaims, 'select public.review_admin_set_status($1,$2,$3)', [REVIEW, 'pending', 'approved']);
      assert.equal((await db.query('select status from public.game_reviews where id=$1', [REVIEW])).rows[0].status, 'pending');
    };
    await db.query('delete from auth.sessions where id=$1', [SESSION]);
    await blocked();
    await db.query('insert into auth.sessions(id,user_id,not_after) values($1,$2,now()-interval \'1 second\')', [SESSION, ADMIN]);
    await blocked();
    await db.query('update auth.sessions set not_after=now()+interval \'1 hour\' where id=$1', [SESSION]);
    assert.equal(await rpcStatus(adminClaims), true);
    await db.query('delete from review_private.admins where user_id=$1', [ADMIN]);
    await blocked();
    await db.query('insert into review_private.admins(user_id) values($1)', [ADMIN]);
    for (const [mutation, restore] of [
      ['email_confirmed_at=null', 'email_confirmed_at=now()'],
      ["banned_until=now()+interval '1 hour'", "banned_until=now()-interval '1 hour'"],
      ['deleted_at=now()', 'deleted_at=null'],
      ['is_anonymous=true', 'is_anonymous=false']
    ]) {
      await db.query(`update auth.users set ${mutation} where id=$1`, [ADMIN]);
      await blocked();
      await db.query(`update auth.users set ${restore} where id=$1`, [ADMIN]);
      assert.equal(await rpcStatus(adminClaims), true);
    }
    await db.query('delete from auth.users where id=$1', [ADMIN]);
    await blocked();
    assert.equal((await db.query('select count(*)::int as n from review_private.admins')).rows[0].n, 0);
    await db.query('insert into auth.users(id,email_confirmed_at) values($1,now())', [ADMIN]);
    await db.query('insert into auth.sessions(id,user_id) values($1,$2)', [SESSION, ADMIN]);
    await db.query('insert into review_private.admins(user_id) values($1)', [ADMIN]);
    assert.equal(await rpcStatus(adminClaims), true);
  });

  await group('public roles retain approved-only safe-column reads and cannot insert, mutate, access rate data or invoke service quotas', async () => {
    for (const role of ['anon', 'authenticated']) {
      const { rows } = await as(role, adminClaims, 'select game_id,body,created_on from public.game_reviews');
      assert.equal(rows.length, 1);
      assert.equal(rows[0].body, 'approved-public');
      for (const sql of [
        'select id from public.game_reviews', 'select status from public.game_reviews',
        "insert into public.game_reviews(game_id,body) values('addition_game','forged')",
        "update public.game_reviews set status='approved'", 'delete from public.game_reviews',
        "select public.consume_review_limit(repeat('a',64),'attempts')", 'select * from review_private.rate_limits',
        "select review_private.limit_pending_reviews()"
      ]) await errorCode(role, adminClaims, sql);
    }
  });

  await group('service_role still inserts only pending text and reads status, with no publication/text read/update/delete permission', async () => {
    await as('service_role', {}, "insert into public.game_reviews(game_id,body) values('addition_game','backend-pending')");
    assert.equal((await db.query("select status from public.game_reviews where body='backend-pending'")).rows[0].status, 'pending');
    assert.ok((await as('service_role', {}, 'select status from public.game_reviews')).rows.length > 0);
    for (const sql of [
      'select body from public.game_reviews', 'select id from public.game_reviews',
      "insert into public.game_reviews(game_id,body,status) values('addition_game','forged','approved')",
      "update public.game_reviews set status='approved'", "update public.game_reviews set body='changed'", 'delete from public.game_reviews'
    ]) await errorCode('service_role', {}, sql);
    for (let attempt = 0; attempt < 12; attempt += 1) {
      assert.equal(await scalar('service_role', {}, "select public.consume_review_limit(repeat('e',64),'attempts') as value"), attempt < 10);
    }
  });

  await group('reopening reviews cannot bypass the existing 1,000-pending capacity limit; page output remains capped', async () => {
    await db.exec(`insert into public.game_reviews(game_id,body)
      select 'math1','capacity test' from generate_series(1,1000-(select count(*)::int from public.game_reviews where status='pending'))`);
    await errorCode('authenticated', adminClaims, 'select public.review_admin_set_status($1,$2,$3)', [APPROVED, 'approved', 'pending'], '54000');
    assert.equal((await db.query('select status from public.game_reviews where id=$1', [APPROVED])).rows[0].status, 'approved');
    await assert.rejects(() => as('service_role', {}, "insert into public.game_reviews(game_id,body) values('math1','over capacity')"), /queue is full/);
    const page = await list('pending', null, 100);
    assert.equal(page.items.length, 100);
    assert.equal(page.total, 1000);
    await setStatus(REVIEW, 'pending', 'rejected');
    await setStatus(APPROVED, 'approved', 'pending');
    assert.equal((await list()).total, 1000);
  });

  console.log(`PASS: ${groups} local Postgres moderation/security groups; no remote database or Auth changes.`);
} finally {
  await db.close();
}
