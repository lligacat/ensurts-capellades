// Permet instal·lar el joc i obrir-lo sense connexió. La pàgina es demana primer a la xarxa perquè les noves versions arribin de seguida.
const CACHE = 'ensurts-v8';
const FITXERS = ['./', 'index.html', 'colla.webp', 'colla-festa.webp', 'ramon.wav', 'hula.wav', 'mentens.wav', 'calent.wav', 'conduir.m4a', 'manifest.webmanifest', 'icona-192.png', 'icona-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FITXERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(claus => Promise.all(claus.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const desa = res => { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return res; };
  if (req.mode === 'navigate' || req.url.endsWith('.html')) {
    e.respondWith(fetch(req).then(desa).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(desa)));
  }
});
