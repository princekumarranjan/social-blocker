-- Wapas: signup table. Run in Supabase > SQL Editor.
create table
  if not exists public.signups (
    id uuid primary key default gen_random_uuid (),
    name text not null check (char_length(btrim (name)) between 1 and 60),
    profession text not null check (
      profession in (
        'school_student',
        'college_student',
        'working_professional',
        'freelancer',
        'other'
      )
    ),
    age smallint not null check (age between 8 and 100),
    reel_nudge_every smallint not null default 10 check (reel_nudge_every between 3 and 50),
    instagram_min smallint not null default 0 check (instagram_min between 0 and 600),
    youtube_min smallint not null default 0 check (youtube_min between 0 and 600),
    snapchat_min smallint not null default 0 check (snapchat_min between 0 and 600),
    other_min smallint not null default 0 check (other_min between 0 and 600),
    created_at timestamptz not null default now ()
  );

-- Security: lock the table down, then allow ONLY inserts from the public (anon) key.
alter table public.signups enable row level security;

revoke all on public.signups
from
  anon,
  authenticated;

grant insert on public.signups to anon;

drop policy if exists "anon can insert signups" on public.signups;

create policy "anon can insert signups" on public.signups for insert to anon
with
  check (true);

-- column CHECK constraints above validate the data
-- No select/update/delete policies exist, so nobody with the public key can read or change data.
-- View signups only from the Supabase dashboard (or with the service_role key on a server).