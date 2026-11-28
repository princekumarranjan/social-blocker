-- Wapas extension account-linking system.
-- Run this entire file in Supabase SQL Editor.
-- Requires Supabase Auth and the pgcrypto extension.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.extension_pair_codes (
  code_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.extension_sessions (
  token_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz
);

alter table public.extension_pair_codes enable row level security;
alter table public.extension_sessions enable row level security;
revoke all on public.extension_pair_codes from anon, authenticated;
revoke all on public.extension_sessions from anon, authenticated;

create or replace function public.create_extension_pair_code()
returns text
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  delete from public.extension_pair_codes where expires_at < now() or consumed_at is not null;
  v_code := encode(gen_random_bytes(16), 'hex');
  insert into public.extension_pair_codes(code_hash, user_id, expires_at)
  values (encode(digest(v_code, 'sha256'), 'hex'), auth.uid(), now() + interval '5 minutes');
  return v_code;
end;
$$;

create or replace function public.redeem_extension_pair_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid;
  v_token text;
begin
  if p_code is null or p_code !~ '^[a-f0-9]{32}$' then
    raise exception 'Invalid or expired connection code';
  end if;

  select user_id into v_user_id
  from public.extension_pair_codes
  where code_hash = encode(digest(p_code, 'sha256'), 'hex')
    and expires_at > now()
    and consumed_at is null
  for update;

  if v_user_id is null then
    raise exception 'Invalid or expired connection code';
  end if;

  update public.extension_pair_codes
  set consumed_at = now()
  where code_hash = encode(digest(p_code, 'sha256'), 'hex');

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.extension_sessions(token_hash, user_id)
  values (encode(digest(v_token, 'sha256'), 'hex'), v_user_id);

  return jsonb_build_object('session_token', v_token, 'user_id', v_user_id);
end;
$$;

create or replace function public.validate_extension_session(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('valid', false);
  end if;

  select user_id into v_user_id
  from public.extension_sessions
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and revoked_at is null;

  if v_user_id is null then
    return jsonb_build_object('valid', false);
  end if;

  update public.extension_sessions
  set last_seen_at = now()
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and revoked_at is null;

  return jsonb_build_object('valid', true, 'user_id', v_user_id);
end;
$$;

create or replace function public.revoke_extension_session(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  update public.extension_sessions
  set revoked_at = now()
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and revoked_at is null;
  return found;
end;
$$;

revoke all on function public.create_extension_pair_code() from public, anon;
revoke all on function public.redeem_extension_pair_code(text) from public;
revoke all on function public.validate_extension_session(text) from public;
revoke all on function public.revoke_extension_session(text) from public;
grant execute on function public.create_extension_pair_code() to authenticated;
grant execute on function public.redeem_extension_pair_code(text) to anon, authenticated;
grant execute on function public.validate_extension_session(text) to anon, authenticated;
grant execute on function public.revoke_extension_session(text) to anon, authenticated;
