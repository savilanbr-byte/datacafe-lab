// Punto de entrada: carga los datos, enruta según la dirección (#/...) y registra el modo sin conexión.
import { loadAll, data, put, uid } from './db.js';
import { getParams, toast } from './ui.js';
import * as inicio from './views/inicio.js';
import * as inventario from './views/inventario.js';
import * as registrar from './views/registrar.js';
import * as ficha from './views/ficha.js';
import * as catacion from './views/catacion.js';
import * as trilla from './views/trilla.js';
import * as lote from './views/lote.js';
import * as ventas from './views/ventas.js';
import * as ajustes from './views/ajustes.js';


// ruta -> [vista, pestaña activa del menú, mostrar menú]
const ROUTES = {
  inicio: [inicio, 'inicio', true],
  inventario: [inventario, 'inventario', true],
  cafe: [ficha, 'inventario', true],
  registrar: [registrar, 'inventario', false],
  catacion: [catacion, 'catacion', true],
  trilla: [trilla, 'trilla', true],
  lote: [lote, 'trilla', true],
  ventas: [ventas, 'ventas', true],
  ajustes: [ajustes, 'inicio', true],
};

const app = document.getElementById('app');

async function render() {
  const { parts, q } = getParams();
  const [view, tab, showNav] = ROUTES[parts[0]] || ROUTES.inicio;
  document.body.classList.toggle('no-nav', !showNav);
  document.querySelectorAll('#nav a').forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  try {
    await view.render(app, { parts, q });
  } catch (e) {
    console.error(e);
    app.innerHTML = `<div class="empty"><p>Algo salió mal al abrir esta pantalla.</p><p class="small mt-sm">${String(e.message || e)}</p><a class="btn mt" href="#/inicio">Volver al inicio</a></div>`;
  }
  window.scrollTo(0, 0);
}

async function init() {
  await loadAll();
  if (!data.bodegas.length) await put('bodegas', { id: uid('b'), nombre: 'Bodega principal' });
  window.addEventListener('hashchange', render);
  if (!location.hash) history.replaceState(null, '', '#/inicio');
  render();
  registerSW();
}

function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) {
          toast('Hay una versión nueva de la app.', { label: 'Actualizar', run: () => w.postMessage('skipWaiting') });
        }
      });
    });
  }).catch((e) => console.warn('Sin modo offline:', e));
  // Solo recarga cuando se reemplaza una versión anterior (no en la primera instalación).
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return; reloaded = true; location.reload();
  });
}

init().catch((e) => {
  console.error(e);
  app.innerHTML = `<div class="empty"><p>No se pudo abrir la base de datos del celular.</p><p class="small mt-sm">Revisa que el navegador no esté en modo incógnito.</p></div>`;
});
