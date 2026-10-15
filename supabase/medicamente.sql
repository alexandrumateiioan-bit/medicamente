-- =============================================================
-- Tabelul pentru aplicația „Medicamente"
-- -------------------------------------------------------------
-- Folosește ACELAȘI proiect Supabase ca aplicația Frigider:
-- aceleași conturi și aceeași listă a casei (tabelul members).
-- Rulează o singură dată: SQL Editor → New query → lipești → Run.
-- =============================================================

create table public.meds (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  form        text check (char_length(form) <= 30),
  quantity    text check (char_length(quantity) <= 40),
  expires_on  date,                       -- ultima zi a lunii de pe cutie
  symptoms    text[] not null default '{}',
  note        text check (char_length(note) <= 120),
  added_by    text default (auth.jwt() ->> 'email'),
  created_at  timestamptz not null default now()
);

-- Doar voi doi vedeți și modificați lista (aceeași regulă ca la Frigider).
alter table public.meds enable row level security;

create policy "doar membrii casei" on public.meds
  for all to authenticated using (public.is_member()) with check (public.is_member());

-- Sincronizare imediată între telefoane.
alter publication supabase_realtime add table public.meds;
