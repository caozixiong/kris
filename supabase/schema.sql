-- Current review-table schema snapshot, including the beginner-Chinese and bilingual game IDs.
-- Migration history lives in supabase/migrations; no past migration is rewritten.
begin;
create schema if not exists review_private;
revoke all on schema review_private from public, anon, authenticated;
grant usage on schema review_private to service_role;

create table public.game_reviews (
  id uuid primary key default gen_random_uuid(),
  game_id text not null check (game_id in (
    'chinese-first-words','chinese-picture-match','chinese-word-builder',
    'bilingual-memory','word-bridge','sentence-match',
    'addition_game','multiplication_game','shape_sorter_math','vocabulary_quiz',
    'chinese_character_quiz','chinese_game1','circuit-lab','english-ruins','french-market','math-orbit',
    'math1','math10','math234','math567','math8','math9','math_addition_subtraction','math_chinese','math_english','math_visual_game'
  )),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_on date not null default (now() at time zone 'UTC')::date
);
create index game_reviews_public_listing on public.game_reviews (game_id, created_on desc) where status = 'approved';
alter table public.game_reviews enable row level security;
revoke all on public.game_reviews from public, anon, authenticated, service_role;
grant select (game_id, body, created_on) on public.game_reviews to anon, authenticated;
create policy "Approved reviews are public" on public.game_reviews for select to anon, authenticated using (status = 'approved');
-- The Edge Function can only supply these two insert columns. It cannot publish.
grant insert (game_id, body) on public.game_reviews to service_role;
grant select (status) on public.game_reviews to service_role;
-- Bound unmoderated storage even if a distributed bot learns the weak answer.
create function review_private.limit_pending_reviews()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(684237109);
  if (select count(status) from public.game_reviews where status = 'pending') >= 1000 then
    raise exception 'Review queue is full';
  end if;
  return new;
end;
$$;
revoke all on function review_private.limit_pending_reviews() from public, anon, authenticated;
grant execute on function review_private.limit_pending_reviews() to service_role;
create trigger guard_pending_review_capacity before insert on public.game_reviews
for each row execute function review_private.limit_pending_reviews();
comment on table public.game_reviews is 'Anonymous game feedback. Dashboard owner reviews pending rows and changes status to approved or rejected. Do not put surnames, names, IP addresses, or contact details in this table.';

create table review_private.rate_limits (
  bucket text not null check (bucket ~ '^[0-9a-f]{64}$'),
  scope text not null check (scope in ('global','attempts','submissions')),
  window_start timestamptz not null,
  hits integer not null check (hits > 0),
  expires_at timestamptz not null,
  primary key (bucket, scope)
);
create index review_rate_limit_expiry on review_private.rate_limits(expires_at);
alter table review_private.rate_limits enable row level security;
revoke all on review_private.rate_limits from public, anon, authenticated, service_role;
grant select, insert, update, delete on review_private.rate_limits to service_role;

create function public.consume_review_limit(p_bucket text, p_scope text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  v_now timestamptz := clock_timestamp();
  window_seconds integer;
  maximum integer;
  current_window timestamptz;
  used integer;
begin
  if p_bucket is null or p_bucket !~ '^[0-9a-f]{64}$' then raise exception 'Invalid rate bucket'; end if;
  case p_scope
    when 'global' then window_seconds := 600; maximum := 200;
    when 'attempts' then window_seconds := 600; maximum := 10;
    when 'submissions' then window_seconds := 3600; maximum := 3;
    else raise exception 'Invalid rate scope';
  end case;
  current_window := to_timestamp(floor(extract(epoch from v_now) / window_seconds) * window_seconds);
  -- Automatic bounded retention: no more than one day plus the current window.
  delete from review_private.rate_limits where expires_at < v_now;
  insert into review_private.rate_limits as limits(bucket, scope, window_start, hits, expires_at)
    values(p_bucket, p_scope, current_window, 1, v_now + interval '24 hours')
  on conflict (bucket, scope) do update set
    hits = case when limits.window_start = current_window then least(limits.hits + 1, maximum + 1) else 1 end,
    window_start = current_window,
    expires_at = v_now + interval '24 hours'
  returning hits into used;
  return used <= maximum;
end;
$$;
revoke all on function public.consume_review_limit(text,text) from public, anon, authenticated;
grant execute on function public.consume_review_limit(text,text) to service_role;
comment on function public.consume_review_limit(text,text) is 'Service-only atomic fixed-window abuse counter. Hash buckets rotate each UTC day. No raw IP or answer is stored. Calendar-day rotation can reset the hourly submission allowance at midnight.';
commit;
