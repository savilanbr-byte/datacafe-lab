// Trilla: pestaña de lotes y pestaña del inventario general de pasilla.
import { data } from '../db.js';
import { lotesOrdenados, loteInfo } from '../model.js';
import { fmtKg, fmt2, fmtFecha, fmtCOP, num, disponiblePasilla } from '../calc.js';
import { esc, icon, seg, bindSeg } from '../ui.js';

export async function render(root, { q }) {
  let vista = q.get('vista') === 'pasilla' ? 'pasilla' : 'lotes';
  const pasilla = disponiblePasilla(data.lotes, data.ventas);

  root.innerHTML = `
    <header class="page-head">
      <div><h1>Trilla</h1><p class="sub">Arma lotes, anota lo que salió y lleva la pasilla</p></div>
      <a class="icon-btn add" href="#/lote/nuevo" aria-label="Nuevo lote">${icon('plus')}</a>
    </header>
    <div style="max-width:28rem">${seg('vista', [['lotes', `Lotes (${data.lotes.length})`], ['pasilla', `Pasilla (${fmtKg(Math.max(0, pasilla))} kg)`]], vista)}</div>
    <div id="contenido" class="mt"></div>`;

  const cont = root.querySelector('#contenido');

  function pintarLotes() {
    const lotes = lotesOrdenados().map(loteInfo);
    cont.innerHTML = `<div class="stack-sm cards-grid">
      ${lotes.length ? lotes.map((l) => `
        <a class="item" href="#/lote/${encodeURIComponent(l.lote.id)}">
          <div class="item-top">
            <span>${esc(fmtFecha(l.lote.fecha))} · ${esc(l.lote.preparacion)}${l.lote.corte ? ' · Corte ' + esc(l.lote.corte) : ''}</span>
            ${l.trillado ? '<span class="badge">Trillado</span>' : '<span class="badge warn">Por trillar</span>'}
          </div>
          <div class="item-name">${esc(l.nombre)}</div>
          <div class="small">${fmtKg(l.kgPergamino)} kg de pergamino · ${l.items.length} ${l.items.length === 1 ? 'café' : 'cafés'}</div>
          <div class="small muted">${l.trillado
            ? `Excelso disponible: <strong style="color:var(--ink)">${fmtKg(l.excelsoDisp)} kg</strong> · Pasilla producida: ${fmtKg(num(l.lote.kgPasilla))} kg · Factor real ${fmt2(l.factorReal)}`
            : `Excelso proyectado: ${fmtKg(Math.round(l.proyeccion * 100) / 100)} kg · Factor ${fmt2(l.factorLote)}`}</div>
        </a>`).join('')
      : `<div class="empty"><p>Todavía no hay lotes de trilla.</p><p class="small mt-sm">Un lote junta uno o varios cafés del inventario para trillarlos juntos.</p><a class="btn btn-accent mt" href="#/lote/nuevo">${icon('plus')}Nuevo lote</a></div>`}
    </div>`;
  }

  function pintarPasilla() {
    // Movimientos: entra la pasilla de cada lote trillado y salen las ventas de pasilla.
    const movs = [
      ...data.lotes.filter((l) => num(l.kgPasilla) > 0).map((l) => ({
        fecha: l.fecha, kg: num(l.kgPasilla), txt: `Trilla lote ${l.id}${l.nombre ? ' · ' + l.nombre : ''}`, href: `#/lote/${encodeURIComponent(l.id)}`,
      })),
      ...data.ventas.filter((v) => v.tipo === 'Pasilla').map((v) => ({
        fecha: v.fecha, kg: -num(v.kg), txt: `Venta a ${v.cliente || 'cliente'} · ${fmtCOP(num(v.kg) * num(v.precioKg))}`,
      })),
    ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    const entra = movs.filter((m) => m.kg > 0).reduce((s, m) => s + m.kg, 0);
    const sale = -movs.filter((m) => m.kg < 0).reduce((s, m) => s + m.kg, 0);

    cont.innerHTML = `<div class="split">
      <div class="stack">
        <section class="hero">
          <div class="label">Pasilla disponible</div>
          <div class="big-num">${fmtKg(Math.max(0, pasilla))} <small>kg</small></div>
          <div class="small" style="opacity:.92">Inventario general: se mezcla la pasilla de todas las trillas.</div>
        </section>
        <section class="card">
          <div class="row"><span>Pasilla producida en trillas</span><strong>${fmtKg(entra)} kg</strong></div>
          <div class="row"><span>Pasilla vendida</span><span>${fmtKg(sale)} kg</span></div>
          <div class="row"><span>Disponible</span><strong class="plus">${fmtKg(Math.max(0, pasilla))} kg</strong></div>
        </section>
        ${pasilla > 0.001 ? `<a class="btn btn-accent btn-lg btn-block" href="#/ventas?tipo=Pasilla">${icon('cart')}Vender pasilla</a>` : ''}
        <p class="small muted">La pasilla entra sola cuando anotas los kg de pasilla en el resultado de un lote.</p>
      </div>
      <section class="card mt">
        <h2 style="margin-bottom:.375rem">Movimientos</h2>
        ${movs.length ? movs.map((m) => `<div class="row plain"><span>${esc(fmtFecha(m.fecha))} · ${m.href ? `<a href="${m.href}">${esc(m.txt)}</a>` : esc(m.txt)}</span><strong class="${m.kg < 0 ? 'minus' : 'plus'}">${m.kg < 0 ? '−' : '+'}${fmtKg(Math.abs(m.kg))} kg</strong></div>`).join('')
          : '<p class="muted">Todavía no hay pasilla. Aparece cuando anotas el resultado de una trilla.</p>'}
      </section>
    </div>`;
  }

  function pintar() {
    history.replaceState(null, '', vista === 'pasilla' ? '#/trilla?vista=pasilla' : '#/trilla');
    if (vista === 'pasilla') pintarPasilla(); else pintarLotes();
  }

  bindSeg(root, 'vista', (val) => { vista = val; pintar(); });
  pintar();
}
