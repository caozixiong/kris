import assert from 'node:assert/strict';
import fs from 'node:fs';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
await db.exec(fs.readFileSync(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
const as = async(role,sql) => {await db.exec(`set role ${role}`);try{return await db.query(sql);}finally{await db.exec('reset role');}};
const denied = async(role,sql) => {await assert.rejects(()=>as(role,sql),/permission denied/);};
await db.exec("insert into public.game_reviews(game_id,body,status) values ('addition_game','pending-secret','pending'),('addition_game','approved-public','approved'),('addition_game','rejected-secret','rejected');");
for(const role of ['anon','authenticated']) {
 const {rows}=await as(role,'select game_id,body,created_on from public.game_reviews');assert.equal(rows.length,1);assert.equal(rows[0].body,'approved-public');
 for(const sql of ["select id from public.game_reviews","select status from public.game_reviews","insert into public.game_reviews(game_id,body) values('addition_game','forged')","update public.game_reviews set status='approved'","delete from public.game_reviews","select public.consume_review_limit(repeat('a',64),'attempts')","select * from review_private.rate_limits"]) await denied(role,sql);
}
await as('service_role',"insert into public.game_reviews(game_id,body) values('addition_game','backend-pending')");
assert.equal((await db.query("select status from public.game_reviews where body='backend-pending'")).rows[0].status,'pending');
for(const sql of ["select body from public.game_reviews","insert into public.game_reviews(game_id,body,status) values('addition_game','forged','approved')","update public.game_reviews set status='approved'","delete from public.game_reviews"]) await denied('service_role',sql);
for(const [scope,limit] of [['attempts',10],['submissions',3],['global',200]]) {
 const results=await Promise.all(Array.from({length:limit+3},()=>as('service_role',`select public.consume_review_limit(repeat('a',64),'${scope}') as allowed`)));
 assert.equal(results.filter(result=>result.rows[0].allowed).length,limit);
}
await db.exec("insert into review_private.rate_limits values(repeat('b',64),'attempts',now()-interval '2 days',1,now()-interval '1 day')");
await as('service_role',"select public.consume_review_limit(repeat('c',64),'attempts')");
assert.equal((await db.query("select count(*)::int as n from review_private.rate_limits where bucket=repeat('b',64)")).rows[0].n,0);
await db.exec("insert into public.game_reviews(game_id,body) select 'math1','capacity test' from generate_series(1,998)");
assert.equal((await db.query("select count(*)::int as n from public.game_reviews where status='pending'")).rows[0].n,1000);
await assert.rejects(()=>as('service_role',"insert into public.game_reviews(game_id,body) values('math1','over capacity')"),/queue is full/);
await db.close();
console.log('PASS: actual Postgres schema execution; approved-only RLS/column grants; denied direct writes/RPC/private access; service cannot publish/read text; atomic quota caps; opportunistic expiry cleanup; pending queue cap1000.');
