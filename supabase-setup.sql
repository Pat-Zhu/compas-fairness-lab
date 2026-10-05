-- COMPAS Fairness Lab realtime classroom backend
-- Run once in Supabase SQL Editor.

create table if not exists public.class_responses (
  session_code text not null check (session_code ~ '^[A-Z0-9]{6}$'),
  participant_id text not null,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (session_code, participant_id)
);

alter table public.class_responses enable row level security;

drop policy if exists "classroom anonymous read" on public.class_responses;
create policy "classroom anonymous read"
on public.class_responses
for select
to anon
using (session_code ~ '^[A-Z0-9]{6}$');

drop policy if exists "classroom anonymous insert" on public.class_responses;
create policy "classroom anonymous insert"
on public.class_responses
for insert
to anon
with check (
  session_code ~ '^[A-Z0-9]{6}$'
  and char_length(participant_id) between 20 and 80
);

drop policy if exists "classroom anonymous update" on public.class_responses;
create policy "classroom anonymous update"
on public.class_responses
for update
to anon
using (
  session_code ~ '^[A-Z0-9]{6}$'
  and char_length(participant_id) between 20 and 80
)
with check (
  session_code ~ '^[A-Z0-9]{6}$'
  and char_length(participant_id) between 20 and 80
);

-- Enable realtime for the table. If Supabase reports that the table is
-- already in the publication, that message can be ignored.
alter publication supabase_realtime add table public.class_responses;
