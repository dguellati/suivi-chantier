-- PÉRIODE DE TEST : ouvre la base sans connexion (n'importe qui ayant l'adresse de l'app peut lire et modifier).
-- À coller dans Supabase → SQL Editor → New query, puis « Run ».
-- N'y mettez que des données de test. Pour refermer : test-fermer.sql

drop policy if exists "test sans connexion" on public.records;
create policy "test sans connexion" on public.records for all to anon using (true) with check (true);

drop policy if exists "test fichiers lecture" on storage.objects;
drop policy if exists "test fichiers ajout" on storage.objects;
drop policy if exists "test fichiers modif" on storage.objects;
drop policy if exists "test fichiers suppression" on storage.objects;
create policy "test fichiers lecture"     on storage.objects for select to anon using (bucket_id = 'fichiers');
create policy "test fichiers ajout"       on storage.objects for insert to anon with check (bucket_id = 'fichiers');
create policy "test fichiers modif"       on storage.objects for update to anon using (bucket_id = 'fichiers');
create policy "test fichiers suppression" on storage.objects for delete to anon using (bucket_id = 'fichiers');
