/* Service worker : l'application s'ouvre même sans réseau sur le chantier.
   Les fichiers de l'application et les bibliothèques sont gardés en cache ;
   les échanges avec Supabase (données, plans, photos) ne passent jamais par ce cache. */
const VERSION = 'chantier-v1';
const COEUR = ['./', './index.html', './styles.css', './app.js', './config.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/polygon-clipping@0.15.7/dist/polygon-clipping.umd.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all([c.addAll(COEUR), ...LIBS.map(u => c.add(u).catch(()=>{}))])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if(req.method !== 'GET' || url.hostname.endsWith('supabase.co')) return;
  if(url.origin === location.origin){
    /* Fichiers de l'application : réseau d'abord (mises à jour), cache si pas de réseau */
    e.respondWith(fetch(req).then(r => { const copie = r.clone(); caches.open(VERSION).then(c => c.put(req, copie)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  } else if(LIBS.includes(req.url)){
    /* Bibliothèques à version fixe : cache d'abord */
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const copie = res.clone(); caches.open(VERSION).then(c => c.put(req, copie)); return res; })));
  }
});
