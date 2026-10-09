// Disposable local PostgreSQL validation only. No remote records or credentials.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GAME_IDS } from '../supabase/functions/game-reviews/core.mjs';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const files = fs.readdirSync(new URL('supabase/migrations/', root));
const suffix = '_add_beginner_chinese_game_reviews.sql';
const migrations = files.filter(file => file.endsWith(suffix));
// A draft SQL path supports local validation before MCP assigns the migration version.
const sql = process.env.CHINESE_MIGRATION_SQL
 ? fs.readFileSync(process.env.CHINESE_MIGRATION_SQL, 'utf8')
 : (assert.equal(migrations.length, 1), read('supabase/migrations/' + migrations[0]));
const NEW_IDS = ['chinese-first-words', 'chinese-picture-match', 'chinese-word-builder'];
assert.equal(GAME_IDS.length, 26);
assert.equal(new Set(GAME_IDS).size, 26);
const historical = read('supabase/migrations/' + files.find(file => file.endsWith('_add_bilingual_word_game_reviews.sql')));
const oldIDs = [...historical.matchAll(/'([^']+)'/g)].map(match => match[1]);
assert.equal(oldIDs.length, 23);
assert.deepEqual([...GAME_IDS].sort(), [...oldIDs, ...NEW_IDS].sort(), 'Preserve every historical ID and add only the three new IDs');
assert.deepEqual([...sql.matchAll(/'([^']+)'/g)].map(match => match[1]).sort(), [...GAME_IDS].sort());
assert.doesNotMatch(sql.replace(/--[^\n]*/g, ''), /\b(grant|revoke|policy|function|trigger|delete|insert|update)\b/i);
const setup = async source => {
 const db = new PGlite();
 // Stub only server-owned Auth structure in this disposable local database.
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
 await db.exec(source);
 await db.exec(read('supabase/admin-schema.sql'));
 return db;
};
const security = async db => {
 const { rows: tables } = await db.query("select n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','review_private') and c.relkind='r' order by n.nspname,c.relname");
 const { rows: columns } = await db.query("select c.relname,a.attname,a.attacl::text from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','review_private') and c.relkind='r' and a.attnum>0 and not a.attisdropped order by n.nspname,c.relname,a.attnum");
 const { rows: policies } = await db.query("select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname in ('public','review_private') order by schemaname,tablename,policyname");
 const { rows: functions } = await db.query("select n.nspname,p.proname,p.prosecdef,p.proacl::text,p.proconfig,pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','review_private') order by n.nspname,p.proname");
 const { rows: triggers } = await db.query("select tgname,pg_get_triggerdef(oid) as definition from pg_trigger where tgrelid='public.game_reviews'::regclass and not tgisinternal order by tgname");
 return { tables, columns, policies, functions, triggers };
};
const constraints = async db => (await db.query("select conname,pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='public.game_reviews'::regclass and contype='c' order by conname")).rows;
const original = files.find(file => file.endsWith('_anonymous_moderated_game_reviews.sql'));
const db = await setup(read('supabase/migrations/' + original));
try {
 await db.exec(historical);
 for (const game of oldIDs) await db.query('insert into public.game_reviews(game_id,body,status) values($1,$2,$3)', [game,'Existing '+game,'approved']);
 const beforeSecurity = await security(db);
 const beforeConstraints = await constraints(db);
 const beforeRows = (await db.query('select * from public.game_reviews order by id')).rows;
 await db.exec(sql);
 assert.deepEqual(await security(db), beforeSecurity, 'RLS, grants, policies, functions and triggers must remain unchanged');
 assert.deepEqual((await db.query('select * from public.game_reviews order by id')).rows, beforeRows, 'All historical reviews must remain unchanged');
 const nonGameConstraints = items => items.filter(row => row.conname !== 'game_reviews_game_id_check');
 assert.deepEqual(nonGameConstraints(await constraints(db)), nonGameConstraints(beforeConstraints));
 const definition = (await constraints(db)).find(row => row.conname === 'game_reviews_game_id_check').definition;
 assert.deepEqual([...definition.matchAll(/'([^']+)'::text/g)].map(match => match[1]).sort(), [...GAME_IDS].sort());
 const snapshot = await setup(read('supabase/schema.sql'));
 try {
  assert.deepEqual(await constraints(snapshot), await constraints(db), 'Current schema snapshot must equal the entire migration chain');
  assert.deepEqual(await security(snapshot), await security(db), 'Snapshot preserves access and moderation, including the existing admin schema');
 } finally { await snapshot.close(); }
 await db.exec('set role service_role');
 try {
  for (const game of GAME_IDS) await db.query('insert into public.game_reviews(game_id,body) values($1,$2)', [game,'New pending review']);
  await assert.rejects(() => db.query("insert into public.game_reviews(game_id,body) values('invented-game','Must fail')"), error => error.code === '23514');
  await assert.rejects(() => db.query("insert into public.game_reviews(game_id,body,status) values('chinese-first-words','Cannot publish','approved')"), error => error.code === '42501');
 } finally { await db.exec('reset role'); }
 assert.equal((await db.query("select count(*)::int n from public.game_reviews where body='New pending review' and status='pending'")).rows[0].n,26);
 for (const role of ['anon', 'authenticated']) {
  await db.exec(`set role ${role}`);
  try {
   assert.deepEqual((await db.query('select game_id,body from public.game_reviews order by game_id')).rows, oldIDs.sort().map(game => ({game_id:game, body:'Existing '+game})));
   for (const game of NEW_IDS) await assert.rejects(() => db.query('insert into public.game_reviews(game_id,body) values($1,$2)', [game,'No direct write']), error => error.code === '42501');
  } finally { await db.exec('reset role'); }
 }
 console.log('PASS: historical 23 + beginner Chinese 3 = 26 canonical IDs; migration matches snapshot; all old reviews, RLS, grants, policies, functions and triggers unchanged; unknown IDs and direct writes rejected; new reviews stay pending.');
} finally { await db.close(); }
