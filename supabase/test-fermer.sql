-- FIN DES TESTS : referme la base (seuls les appareils connectés avec le compte de l'entreprise y accèdent).
-- À coller dans Supabase → SQL Editor → New query, puis « Run ».
-- Puis dans config.js : TEST_SANS_CONNEXION: false

drop policy if exists "test sans connexion" on public.records;
drop policy if exists "test fichiers lecture" on storage.objects;
drop policy if exists "test fichiers ajout" on storage.objects;
drop policy if exists "test fichiers modif" on storage.objects;
drop policy if exists "test fichiers suppression" on storage.objects;
