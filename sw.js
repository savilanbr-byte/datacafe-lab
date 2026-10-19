// Service worker: guarda la app en el celular para que abra sin internet.
// Al publicar una versión nueva, cambia CACHE (y VERSION en js/version.js).
const CACHE = 'datacafe-lab-v0.3.0';
const FONTS = 'datacafe-fonts-v1';

const APP = [
  './', './index.html', './manifest.webmanifest', './css/styles.css',
  './js/app.js', './js/version.js', './js/db.js', './js/calc.js', './js/ui.js', './js/model.js', './js/listas.js', './js/seed.js',
  './js/views/inicio.js', './js/views/inventario.js', './js/views/registrar.js', './js/views/ficha.js', './js/views/catacion.js',
  './js/views/trilla.js', './js/views/lote.js', './js/views/ventas.js', './js/views/ajustes.js', './js/views/pendientes.js',
  './icons/favicon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Tipografías de Google: se guardan la primera vez que se descargan.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); c.put(req, res.clone()); return res; } catch (err) { return Response.error(); }
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Archivos de la app: primero lo guardado; se actualiza en segundo plano.
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: true });
    const red = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) return hit;
    const res = await red;
    if (res) return res;
    if (req.mode === 'navigate') return c.match('./index.html');
    return Response.error();
  }));
});
