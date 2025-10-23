-- Create table to store Expo push tokens per user
BEGIN;

create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  device_id text,
  platform text check (platform in ('ios','android','web')),
  last_seen_at timestamptz default now(),
  revoked boolean default false,
  created_at timestamptz default now(),
  unique(user_id, token)
);

alter table public.user_push_tokens enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_push_tokens' and policyname = 'insert own token'
  ) then
    create policy "insert own token"
    on public.user_push_tokens for insert
    to authenticated
    with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_push_tokens' and policyname = 'select own tokens'
  ) then
    create policy "select own tokens"
    on public.user_push_tokens for select
    to authenticated
    using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_push_tokens' and policyname = 'update own tokens'
  ) then
    create policy "update own tokens"
    on public.user_push_tokens for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end $$;

COMMIT;


