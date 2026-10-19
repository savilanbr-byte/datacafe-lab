// Lista de lotes de trilla.
import { lotesOrdenados, loteInfo } from '../model.js';
import { fmtKg, fmt2, fmtFecha } from '../calc.js';
import { esc, icon } from '../ui.js';

export async function render(root) {
  const lotes = lotesOrdenados().map(loteInfo);
  root.innerHTML = `
    <header class="page-head">
      <div><h1>Trilla</h1><p class="sub">Arma lotes y anota lo que salió</p></div>
      <a class="icon-btn add" href="#/lote/nuevo" aria-label="Nuevo lote">${icon('plus')}</a>
    </header>
    <div class="stack-sm">
      ${lotes.length ? lotes.map((l) => `
        <a class="item" href="#/lote/${encodeURIComponent(l.lote.id)}">
          <div class="item-top">
            <span>${esc(fmtFecha(l.lote.fecha))} · ${esc(l.lote.preparacion)}${l.lote.corte ? ' · Corte ' + esc(l.lote.corte) : ''}</span>
            ${l.trillado ? '<span class="badge">Trillado</span>' : '<span class="badge warn">Por trillar</span>'}
          </div>
          <div class="item-name">${esc(l.nombre)}</div>
          <div class="small">${fmtKg(l.kgPergamino)} kg de pergamino · ${l.items.length} ${l.items.length === 1 ? 'café' : 'cafés'}</div>
          <div class="small muted">${l.trillado
            ? `Excelso disponible: <strong style="color:var(--ink)">${fmtKg(l.excelsoDisp)} kg</strong> · Pasilla: ${fmtKg(l.pasillaDisp)} kg · Factor real ${fmt2(l.factorReal)}`
            : `Excelso proyectado: ${fmtKg(Math.round(l.proyeccion * 100) / 100)} kg · Factor ${fmt2(l.factorLote)}`}</div>
        </a>`).join('')
      : `<div class="empty"><p>Todavía no hay lotes de trilla.</p><p class="small mt-sm">Un lote junta uno o varios cafés del inventario para trillarlos juntos.</p><a class="btn btn-accent mt" href="#/lote/nuevo">${icon('plus')}Nuevo lote</a></div>`}
    </div>`;
}
