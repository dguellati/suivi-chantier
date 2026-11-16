-- Suivi Chantier : création de la base
-- À coller dans Supabase → SQL Editor → New query, puis « Run ».
-- On peut le relancer sans risque : rien n'est effacé.

-- 1. Une seule table pour toutes les données (chantiers, plans, dessins, pointages, photos, zones…)
create table if not exists public.records (
  id         text primary key,          -- "<type>:<identifiant>"
  kind       text not null,             -- chantiers, plans, dessins, pointages…
  data       jsonb not null,
  deleted    boolean not null default false,
  updated_at timestamptz not null default clock_timestamp()
);
create index if not exists records_updated_idx on public.records (updated_at);

-- L'heure de modification est toujours celle du serveur (sert à la synchronisation des téléphones)
create or replace function public.records_touch() returns trigger language plpgsql as $$
begin new.updated_at := clock_timestamp(); return new; end $$;
drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
  for each row execute function public.records_touch();

-- 2. Seuls les appareils connectés avec le compte de l'entreprise accèdent aux données
alter table public.records enable row level security;
drop policy if exists "entreprise" on public.records;
create policy "entreprise" on public.records for all to authenticated using (true) with check (true);

-- 3. Stockage privé des plans et des photos
insert into storage.buckets (id, name, public) values ('fichiers', 'fichiers', false)
  on conflict (id) do nothing;
drop policy if exists "fichiers lecture" on storage.objects;
drop policy if exists "fichiers ajout" on storage.objects;
drop policy if exists "fichiers modif" on storage.objects;
drop policy if exists "fichiers suppression" on storage.objects;
create policy "fichiers lecture"     on storage.objects for select to authenticated using (bucket_id = 'fichiers');
create policy "fichiers ajout"       on storage.objects for insert to authenticated with check (bucket_id = 'fichiers');
create policy "fichiers modif"       on storage.objects for update to authenticated using (bucket_id = 'fichiers');
create policy "fichiers suppression" on storage.objects for delete to authenticated using (bucket_id = 'fichiers');
