/* Connexion à la base en ligne (Supabase).
   Collez ici l'adresse du projet et la clé « anon public » (Project Settings → API).
   Tant que ces deux valeurs sont vides, l'application fonctionne seule sur l'appareil, sans partage. */
window.CONFIG = {
  SUPABASE_URL: 'https://lguzbhnsbagzhepzyltb.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_4WrYCqHcEi_qJoePMPQMqA__rLzfZ2f',
  MAIL_COMMANDES: 'derouach@ader-bardage.fr',
  /* PÉRIODE DE TEST : pas d'écran « compte entreprise ».
     Remettre à false (et lancer supabase/test-fermer.sql) avant d'y mettre les vraies données. */
  TEST_SANS_CONNEXION: true
};
