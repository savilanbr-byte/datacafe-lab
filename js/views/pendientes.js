// Listas de pendientes: cafés con kilos en bodega a los que les falta análisis físico, catación o precio.
import { pendientes } from '../model.js';
import { fmtKg } from '../calc.js';
import { esc, icon, topbar, seg, bindSeg } from '../ui.js';

export async function render(root, { q }) {
  const listas = pendientes();
  let actual = listas.find((l) => l.id === q.get('lista')) ? q.get('lista') : (listas.find((l) => l.cafes.length) || listas[0]).id;

  root.innerHTML = `
    ${topbar('Pendientes', '#/inicio')}
    <p class="sub" style="margin:-.25rem 0 1rem">Cafés con kilos en bodega a los que les falta información. Las listas se actualizan solas.</p>
    ${seg('lista', listas.map((l) => [l.id, `${l.titulo} (${l.cafes.length})`]), actual, 'wrap')}
    <div id="lista" class="stack-sm mt cards-grid"></div>`;

  function pintar() {
    const l = listas.find((x) => x.id === actual);
    history.replaceState(null, '', `#/pendientes?lista=${l.id}`);
    root.querySelector('#lista').innerHTML = l.cafes.length ? l.cafes.map((c) => `
      <div class="item">
        <div class="item-top"><span>${esc(c.cafe.id)} · ${esc(c.bodega)} · ${fmtKg(c.disponible)} kg</span><span class="badge warn">${esc(l.falta)}</span></div>
        <a class="item-name" href="#/cafe/${encodeURIComponent(c.cafe.id)}" style="color:inherit;text-decoration:none">${esc(c.nombre)}</a>
        <a class="btn btn-outline-green" href="${l.href(c)}&volver=${l.id}">${icon(l.icono, 'ic-sm')}${esc(l.accion)}</a>
      </div>`).join('')
      : `<div class="empty">${icon('check', 'ic-lg')}<p class="mt-sm">No hay cafés pendientes de ${esc(l.titulo.toLowerCase())}.</p></div>`;
  }

  bindSeg(root, 'lista', (val) => { actual = val; pintar(); });
  pintar();
}
