-- Reviewed admin schema reference; apply only after the base review schema.
-- The matching timestamped migration records the approved remote deployment.
-- No account is created and the allowlist starts empty. Add only the separately
-- approved auth.users UUID through a trusted owner connection, never by email or
-- user-editable metadata. Keep review_private OUT of Data API exposed schemas.
-- Sources reviewed 2026-10-08:
-- https://supabase.com/docs/guides/auth/sessions
-- https://supabase.com/docs/guides/database/functions
-- https://supabase.com/docs/guides/database/postgres/row-level-security
begin;

-- Existing service_role schema usage and game_reviews column ACLs are preserved.
-- USAGE permits calling the guarded private implementations, not reading tables.
revoke all on schema review_private from public, anon, authenticated;
grant usage on schema review_private to authenticated;

create table review_private.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default pg_catalog.now()
);
alter table review_private.admins enable row level security;
revoke all on review_private.admins from public, anon, authenticated, service_role;
comment on table review_private.admins is 'Owner-managed review-moderator UUID allowlist. No client grants or policies. Never authorize by email or user_metadata.';

-- JWT claims identify the caller/session, but do not grant moderator access.
-- Authenticated permission alone is insufficient. Look up live server-owned rows
-- on EVERY call, including after sign-out, allowlist removal, bans and deletion.
create function review_private.review_admin_status()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_session_text text := auth.jwt() ->> 'session_id';
begin
  if v_user_id is null or v_session_text is null
     or v_session_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return exists (
    select 1
    from review_private.admins as a
    join auth.users as u on u.id = a.user_id
    join auth.sessions as s on s.user_id = u.id
    where a.user_id = v_user_id
      and s.id = v_session_text::uuid
      and (s.not_after is null or s.not_after > pg_catalog.clock_timestamp())
      and u.email_confirmed_at is not null
      and (u.banned_until is null or u.banned_until <= pg_catalog.clock_timestamp())
      and u.deleted_at is null
      and u.is_anonymous is false
  );
end;
$$;
revoke all on function review_private.review_admin_status() from public, anon, authenticated, service_role;
grant execute on function review_private.review_admin_status() to authenticated;

create function review_private.review_admin_list(
  p_status text default 'pending',
  p_game_id text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_result jsonb;
begin
  if not review_private.review_admin_status() then
    raise exception using errcode = '42501', message = 'Review administrator access required';
  end if;
  if p_status is not null and p_status not in ('pending', 'approved', 'rejected') then
    raise exception using errcode = '22023', message = 'Invalid review status filter';
  end if;
  if p_game_id is not null and (pg_catalog.char_length(p_game_id) < 1 or pg_catalog.char_length(p_game_id) > 100) then
    raise exception using errcode = '22023', message = 'Invalid game filter';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100
     or p_offset is null or p_offset < 0 or p_offset > 100000 then
    raise exception using errcode = '22023', message = 'Invalid review page';
  end if;

  -- Counts and page use one statement/snapshot. Counts respect only game filter.
  -- JSON preserves total/counts even when this page contains no rows.
  with game_rows as materialized (
    select r.id, r.game_id, r.body, r.status, r.created_on
    from public.game_reviews as r
    where p_game_id is null or r.game_id = p_game_id
  ), counts as (
    select pg_catalog.count(*) as all_count,
      pg_catalog.count(*) filter (where g.status = 'pending') as pending_count,
      pg_catalog.count(*) filter (where g.status = 'approved') as approved_count,
      pg_catalog.count(*) filter (where g.status = 'rejected') as rejected_count,
      pg_catalog.count(*) filter (where p_status is null or g.status = p_status) as total_count
    from game_rows as g
  ), page as (
    select g.id, g.game_id, g.body, g.status, g.created_on
    from game_rows as g
    where p_status is null or g.status = p_status
    order by g.created_on desc, g.id desc
    limit p_limit offset p_offset
  )
  select pg_catalog.jsonb_build_object(
    'items', coalesce((select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) order by p.created_on desc, p.id desc) from page as p), '[]'::jsonb),
    'total', c.total_count,
    'counts', pg_catalog.jsonb_build_object('pending', c.pending_count, 'approved', c.approved_count, 'rejected', c.rejected_count, 'all', c.all_count),
    'limit', p_limit,
    'offset', p_offset
  ) into v_result from counts as c;
  return v_result;
end;
$$;
revoke all on function review_private.review_admin_list(text,text,integer,integer) from public, anon, authenticated, service_role;
grant execute on function review_private.review_admin_list(text,text,integer,integer) to authenticated;

create function review_private.review_admin_set_status(p_id uuid, p_expected_status text, p_status text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_current_status text;
begin
  if not review_private.review_admin_status() then
    raise exception using errcode = '42501', message = 'Review administrator access required';
  end if;
  if p_id is null or p_expected_status is null or p_status is null
     or p_expected_status not in ('pending', 'approved', 'rejected')
     or p_status not in ('pending', 'approved', 'rejected') then
    raise exception using errcode = '22023', message = 'Invalid review status change';
  end if;
  -- Share the existing INSERT queue-cap lock before reopening a review.
  if p_status = 'pending' then
    perform pg_catalog.pg_advisory_xact_lock(684237109);
  end if;
  select r.status into v_current_status
    from public.game_reviews as r where r.id = p_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Review not found';
  end if;
  if v_current_status <> p_expected_status then
    raise exception using errcode = '40001', message = 'Review changed; reload before trying again';
  end if;
  if p_status = 'pending' and v_current_status <> 'pending'
     and (select pg_catalog.count(*) from public.game_reviews as r where r.status = 'pending') >= 1000 then
    raise exception using errcode = '54000', message = 'Review queue is full';
  end if;

  -- Deliberately no caller-controlled column names, body, game, date or deletion.
  -- The row lock makes the expected-status check and write atomic.
  update public.game_reviews as r set status = p_status where r.id = p_id;
  return pg_catalog.jsonb_build_object('id', p_id, 'status', p_status);
end;
$$;
revoke all on function review_private.review_admin_set_status(uuid,text,text) from public, anon, authenticated, service_role;
grant execute on function review_private.review_admin_set_status(uuid,text,text) to authenticated;

-- Only SECURITY INVOKER wrappers are exposed through the public Data API.
-- Each private entry point enforces the same live checks even if called directly.
create function public.review_admin_status()
returns boolean language sql security invoker set search_path = '' as $$
  select review_private.review_admin_status();
$$;
create function public.review_admin_list(
  p_status text default 'pending', p_game_id text default null,
  p_limit integer default 25, p_offset integer default 0
)
returns jsonb language sql security invoker set search_path = '' as $$
  select review_private.review_admin_list(p_status, p_game_id, p_limit, p_offset);
$$;
create function public.review_admin_set_status(p_id uuid, p_expected_status text, p_status text)
returns jsonb language sql security invoker set search_path = '' as $$
  select review_private.review_admin_set_status(p_id, p_expected_status, p_status);
$$;
revoke all on function public.review_admin_status() from public, anon, authenticated, service_role;
revoke all on function public.review_admin_list(text,text,integer,integer) from public, anon, authenticated, service_role;
revoke all on function public.review_admin_set_status(uuid,text,text) from public, anon, authenticated, service_role;
grant execute on function public.review_admin_status() to authenticated;
grant execute on function public.review_admin_list(text,text,integer,integer) to authenticated;
grant execute on function public.review_admin_set_status(uuid,text,text) to authenticated;

-- No new policies or SELECT/UPDATE grants on game_reviews. Public access remains
-- approved-only and excludes id/status; service_role still cannot publish or read
-- body text. The allowlist and auth tables have no client grants from this file.
commit;
