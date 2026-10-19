import { data } from '../db.js';
import { cafeInfo, cafesOrdenados } from '../model.js';
import { fmtKg, fmt2 } from '../calc.js';
import { esc, icon } from '../ui.js';

let filtro = { q: '', bodega: 'todas', agotados: false };

const norm = (s) => String(s || '').toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '');

export async function render(root) {
  root.innerHTML = `
    <header class="page-head">
      <div><h1>Inventario</h1><p class="sub" id="resumen" aria-live="polite"></p></div>
      <a class="icon-btn add" href="#/registrar" aria-label="Registrar café">${icon('plus')}</a>
    </header>
    <div class="stack-sm">
      <div class="search">
        <label class="sr" for="q">Buscar café</label>
        ${icon('search')}
        <input class="input" id="q" type="search" placeholder="Buscar por finca, variedad, productor o código" value="${esc(filtro.q)}">
      </div>
      <div class="chips" id="bodegas" role="group" aria-label="Filtrar por bodega">
        ${[['todas', 'Todas las bodegas'], ...data.bodegas.map((b) => [b.id, b.nombre])].map(([id, n]) =>
          `<button type="button" class="chip" data-id="${esc(id)}" aria-pressed="${filtro.bodega === id}">${esc(n)}</button>`).join('')}
      </div>
      <label class="check small"><input type="checkbox" id="agotados" ${filtro.agotados ? 'checked' : ''}> Mostrar cafés agotados</label>
    </div>
    <div class="stack-sm mt" id="lista"></div>`;

  const lista = root.querySelector('#lista');
  const resumen = root.querySelector('#resumen');
  const todos = cafesOrdenados().map(cafeInfo);

  function pintar() {
    const q = norm(filtro.q);
    const rows = todos.filter((c) =>
      (filtro.bodega === 'todas' || c.cafe.bodegaId === filtro.bodega) &&
      (filtro.agotados || c.disponible > 0.001) &&
      (!q || norm([c.cafe.id, c.nombre, c.productor && c.productor.nombre, c.productor && c.productor.apellido, c.cafe.municipio, c.cafe.vereda].join(' ')).includes(q)));
    const kg = rows.reduce((s, c) => s + Math.max(0, c.disponible), 0);
    resumen.textContent = `${fmtKg(kg)} kg disponibles · ${rows.length} ${rows.length === 1 ? 'café' : 'cafés'}`;
    if (!todos.length) {
      lista.innerHTML = `<div class="empty"><p>Todavía no hay cafés.</p><a class="btn btn-accent mt" href="#/registrar">${icon('plus')}Registrar café</a></div>`;
      return;
    }
    if (!rows.length) { lista.innerHTML = `<p class="empty">No hay cafés que coincidan.</p>`; return; }
    lista.innerHTML = rows.map((c) => {
      const total = Number(c.cafe.kgTotales) || 0;
      const pct = total > 0 ? Math.max(0, Math.min(100, (100 * c.disponible) / total)) : 0;
      return `<a class="item" href="#/cafe/${encodeURIComponent(c.cafe.id)}">
        <div class="item-top"><span>${esc(c.cafe.id)} · ${esc(c.bodega)}</span>
          ${c.puntaje !== null ? `<span class="badge">${icon('cup-plain', 'ic-sm')}${fmt2(c.puntaje)}</span>` : '<span class="badge warn">Sin catar</span>'}
        </div>
        <div class="item-name">${esc(c.nombre)}</div>
        ${c.disponible > 0.001
          ? `<div class="item-bar"><div class="bar"><span style="width:${pct}%"></span></div><span><strong>${fmtKg(c.disponible)}</strong> de ${fmtKg(total)} kg</span></div>`
          : `<div class="small muted">Agotado · se usaron los ${fmtKg(total)} kg</div>`}
      </a>`;
    }).join('');
  }

  root.querySelector('#q').addEventListener('input', (e) => { filtro.q = e.target.value; pintar(); });
  root.querySelector('#agotados').addEventListener('change', (e) => { filtro.agotados = e.target.checked; pintar(); });
  root.querySelector('#bodegas').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-id]');
    if (!b) return;
    filtro.bodega = b.dataset.id;
    root.querySelectorAll('#bodegas button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    pintar();
  });
  pintar();
}
