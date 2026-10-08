import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createReviewHandler, answersMatch, GAME_IDS } from '../supabase/functions/game-reviews/core.mjs';
const answer = randomUUID(); // Arbitrary ephemeral test value; never a real answer.
const vars = { SUPABASE_URL: 'https://test-project.supabase.co', SUPABASE_SECRET_KEYS: JSON.stringify({default:'sb_secret_TEST_ONLY_'+randomUUID()}), SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({default:'sb_publishable_TEST_ONLY'}), REVIEW_GATE_ANSWER: answer };
const origin = 'https://caozixiong.github.io';
const makeRequest = (data, options = {}) => new Request('https://test-project.supabase.co/functions/v1/game-reviews'+(options.query || ''), { method: options.method || 'POST', headers: { origin, 'content-type': 'application/json', 'x-forwarded-for': options.ip || '192.0.2.1', ...(options.headers || {}) }, ...(options.method === 'GET' ? {} : {body: typeof data === 'string' ? data : JSON.stringify(data)}) });
function harness(options = {}) {
  const calls = [], counters = new Map(), rows = [];
  const env = {...vars,...options.vars};
  const handler = createReviewHandler({ env: k => env[k], now: () => new Date('2026-10-08T01:00:00Z'), fetchImpl: async(url, init) => {
    const body = init.body ? JSON.parse(init.body) : null; calls.push({url,init,body});
    if (options.dbError) return new Response('private error must not be returned', {status:500});
    if(url.includes('rpc/')) {
      assert.match(body.p_bucket,/^[a-f0-9]{64}$/); assert.ok(!body.p_bucket.includes('192.0.2'));
      const key=body.p_scope+body.p_bucket; const count=(counters.get(key)||0)+1; counters.set(key,count);
      return Response.json(options.badRateResponse ? {allowed:true} : count <= ({global:200,attempts:10,submissions:3}[body.p_scope]));
    }
    if(init.method==='POST') { rows.push(body);return new Response(null,{status:204}); }
    assert.equal(init.headers.apikey,'sb_publishable_TEST_ONLY'); assert.ok(!init.headers.Authorization);
    assert.ok(!url.includes('status=')); assert.ok(url.includes('select=body,created_on'));
    return Response.json(options.list || [{body:'<img src=x onerror=alert(1)>',created_on:'2026-10-08',id:'private',status:'approved'}]);
  }});
  return {handler,calls,rows,counters};
}
assert.equal(GAME_IDS.length,23); assert.equal(new Set(GAME_IDS).size,23);
for(const game of ['bilingual-memory','word-bridge','sentence-match']) {
 const h=harness();assert.ok(GAME_IDS.includes(game));
 assert.equal((await h.handler(makeRequest(undefined,{method:'GET',query:`?game=${game}`}))).status,200);
 const response=await h.handler(makeRequest({action:'submit',game,answer,body:'Bilingual game test'}));
 assert.equal(response.status,202);assert.deepEqual(h.rows,[{game_id:game,body:'Bilingual game test'}]);
}
assert.equal(await answersMatch(' '+answer.toUpperCase()+' ',answer),true);
for(const bad of ['',null,0,'bad','x'.repeat(121)]) assert.equal(await answersMatch(bad,answer),false);
assert.equal(await answersMatch(answer,''),false);
{
 const h=harness();const response=await h.handler(makeRequest({action:'submit',game:'addition_game',answer,body:'  Nice game!  ',status:'approved',id:'forged',author:'forged',created_on:'2000-01-01'}));
 assert.equal(response.status,202);assert.deepEqual(await response.json(),{ok:true,status:'pending'});assert.deepEqual(h.rows,[{game_id:'addition_game',body:'Nice game!'}]);
 assert.equal(JSON.stringify(h.calls).includes(answer),false); // Only server-memory comparison receives answer.
}
for(const bad of [undefined,'','wrong-answer']) {
 const h=harness();const response=await h.handler(makeRequest({action:'submit',game:'addition_game',answer:bad,body:'hello'}));assert.equal(response.status,403);assert.equal(h.rows.length,0);assert.equal(h.calls.length,2);assert.deepEqual(await response.json(),{code:'answer'});
}
for(const vars of [{REVIEW_GATE_ANSWER:''},{SUPABASE_SECRET_KEYS:'{}',SUPABASE_SERVICE_ROLE_KEY:''},{SUPABASE_PUBLISHABLE_KEYS:'{}',SUPABASE_ANON_KEY:''}]) {
 const h=harness({vars});assert.equal((await h.handler(makeRequest({action:'verify',game:'addition_game',answer}))).status,503);assert.equal(h.calls.length,0);
}
{
 const h=harness();const response=await h.handler(makeRequest(undefined,{method:'GET',query:'?game=addition_game&status=eq.pending&select=*'}));
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{reviews:[{body:'<img src=x onerror=alert(1)>',date:'2026-10-08'}]});assert.equal(h.calls.length,1);
 assert.equal((await h.handler(makeRequest(undefined,{method:'GET',query:'?game=not-a-game'}))).status,400);
}
for(const body of ['', ' '.repeat(3), 'x'.repeat(501), '\u0000bad', null]) {const h=harness();assert.equal((await h.handler(makeRequest({action:'submit',game:'addition_game',answer,body}))).status,400);assert.equal(h.rows.length,0);}
for(const body of ['{bad json', 'x'.repeat(4097), JSON.stringify({action:'submit',game:'invented',answer,body:'ok'})]) {const h=harness();assert.equal((await h.handler(makeRequest(body))).status,400);assert.equal(h.rows.length,0);assert.equal(h.calls.length,2);}
{
 const h=harness();const responses=await Promise.all(Array.from({length:20},()=>h.handler(makeRequest({action:'verify',game:'addition_game',answer:'wrong'}))));
 assert.equal(responses.filter(r=>r.status===403).length,10);assert.equal(responses.filter(r=>r.status===429).length,10);
}
{
 const h=harness();const responses=[];for(let i=0;i<4;i++) responses.push(await h.handler(makeRequest({action:'submit',game:'addition_game',answer,body:'review'})));
 assert.deepEqual(responses.map(r=>r.status),[202,202,202,429]);assert.equal(h.rows.length,3);
}
{
 const h=harness();const responses=await Promise.all(Array.from({length:210},(_,i)=>h.handler(makeRequest({action:'verify',game:'addition_game',answer:'wrong'},{ip:`spoofed-${i}`}))));
 assert.equal(responses.filter(r=>r.status===429).length,10);
}
for(const options of [{dbError:true},{badRateResponse:true}]) {const h=harness(options);const response=await h.handler(makeRequest({action:'submit',game:'addition_game',answer,body:'hello'}));assert.ok([503,429].includes(response.status));assert.equal(h.rows.length,0);assert.ok(!(await response.text()).includes('private error'));}
{
 const h=harness();assert.equal((await h.handler(makeRequest({},{headers:{origin:'https://example.com'}}))).status,403);assert.equal((await h.handler(makeRequest({},{headers:{origin:''}}))).status,403);assert.equal((await h.handler(makeRequest({},{headers:{'content-type':'text/plain'}}))).status,415);assert.equal((await h.handler(makeRequest({},{method:'DELETE'}))).status,405);assert.equal(h.calls.length,0);
 const preflight=await h.handler(new Request('https://test-project.supabase.co/functions/v1/game-reviews',{method:'OPTIONS',headers:{origin}}));assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),origin);
}
console.log('PASS: review API validation, 23-game allowlist, server answer check, pending-only insertion, minimal public data, quotas, secret-free fail-closed errors, method/origin checks.');
