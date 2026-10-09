// Local PostgreSQL validation only. No remote reviews, credentials or user records.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GAME_IDS } from '../supabase/functions/game-reviews/core.mjs';
// Preserve the historical 23-ID migration test independently of later additions.
const BILINGUAL_GAME_IDS = GAME_IDS.filter(id => !['chinese-first-words','chinese-picture-match','chinese-word-builder'].includes(id));
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const files = fs.readdirSync(new URL('../supabase/migrations/', import.meta.url));
const migration = files.filter(file => file.endsWith('_add_bilingual_word_game_reviews.sql'));
assert.equal(migration.length, 1);
const setup = async (source) => {
 const db = new PGlite();
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
 await db.exec(source);
 return db;
};
const security = async db => {
 const { rows: table } = await db.query("select relrowsecurity, relforcerowsecurity, relacl::text from pg_class where oid='public.game_reviews'::regclass");
 const { rows: columns } = await db.query("select attname,attacl::text from pg_attribute where attrelid='public.game_reviews'::regclass and attnum>0 order by attnum");
 const { rows: policies } = await db.query("select policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname='public' and tablename='game_reviews' order by policyname");
 return { table, columns, policies };
};
const constraints = async db => (await db.query("select conname,pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='public.game_reviews'::regclass and contype='c' order by conname")).rows;
const original = files.find(file => file.endsWith('_anonymous_moderated_game_reviews.sql'));
const db = await setup(read('supabase/migrations/' + original));
try {
 const before = await security(db);
 await db.exec("insert into public.game_reviews(game_id,body,status) values('addition_game','Existing approved review','approved')");
 const oldRows = (await db.query('select * from public.game_reviews')).rows;
 await db.exec(read('supabase/migrations/' + migration[0]));
 assert.deepEqual(await security(db), before, 'RLS, policies and all grants must remain unchanged');
 assert.deepEqual((await db.query('select * from public.game_reviews')).rows, oldRows, 'Existing reviews must be preserved');
 const definition = (await constraints(db)).find(row => row.conname==='game_reviews_game_id_check').definition;
 assert.deepEqual([...definition.matchAll(/'([^']+)'::text/g)].map(match=>match[1]).sort(), [...BILINGUAL_GAME_IDS].sort());
 assert.equal(BILINGUAL_GAME_IDS.length,23);
 await db.exec('set role service_role');
 try {
  for (const game of BILINGUAL_GAME_IDS) await db.query('insert into public.game_reviews(game_id,body) values($1,$2)', [game,'Allowed canonical game']);
  await assert.rejects(() => db.query("insert into public.game_reviews(game_id,body) values('invented-game','Must fail')"), error => error.code==='23514');
  await assert.rejects(() => db.query("insert into public.game_reviews(game_id,body,status) values('bilingual-memory','Cannot publish','approved')"), error => error.code==='42501');
 } finally { await db.exec('reset role'); }
 assert.equal((await db.query("select count(*)::int n from public.game_reviews where body='Allowed canonical game' and status='pending'")).rows[0].n,23);
 for (const role of ['anon','authenticated']) {
  await db.exec(`set role ${role}`);
  try {
   assert.deepEqual((await db.query('select game_id,body from public.game_reviews')).rows,[{game_id:'addition_game',body:'Existing approved review'}]);
   await assert.rejects(() => db.query("insert into public.game_reviews(game_id,body) values('word-bridge','No direct write')"),error=>error.code==='42501');
  } finally { await db.exec('reset role'); }
 }
 console.log('PASS: original + historical bilingual migration; all 23 canonical IDs accepted; unknown IDs rejected; existing reviews, RLS, policies and grants preserved; new reviews remain pending.');
} finally { await db.close(); }
