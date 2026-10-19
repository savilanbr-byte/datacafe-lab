// Service worker: guarda la app en el celular para que abra sin internet.
// Cada versión se guarda completa y por separado, para que nunca se mezclen archivos de versiones distintas.
// Para publicar una versión nueva usa: node scripts/version.mjs 0.6.0
const CACHE = 'datacafe-lab-v0.6.0';
const FONTS = 'datacafe-fonts-v1';

const APP = [
  './', './index.html', './manifest.webmanifest', './css/styles.css',
  './js/app.js', './js/version.js', './js/db.js', './js/calc.js', './js/ui.js', './js/model.js', './js/listas.js', './js/seed.js',
  './js/views/inicio.js', './js/views/inventario.js', './js/views/registrar.js', './js/views/ficha.js', './js/views/catacion.js',
  './js/views/trilla.js', './js/views/lote.js', './js/views/ventas.js', './js/views/ajustes.js', './js/views/pendientes.js',
  './icons/favicon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' obliga a descargar del servidor y no de copias viejas del navegador.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP.map((u) => new Request(u, { cache: 'reload' })))));
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

  // Archivos de la app: siempre los de esta versión. Las versiones nuevas llegan con un sw.js nuevo
  // y la app muestra el aviso "Actualizar".
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const index = await c.match('./index.html');
      if (index) return index;
    }
    try { return await fetch(req); } catch (err) { return Response.error(); }
  }));
});
