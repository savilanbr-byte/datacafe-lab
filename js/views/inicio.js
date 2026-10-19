import { tablero } from '../model.js';
import { fmtKg, fmtCOP } from '../calc.js';
import { esc, icon, toast } from '../ui.js';
import { cargarEjemplo } from '../seed.js';

const COLORES = ['var(--v1)', 'var(--v2)', 'var(--v3)', 'var(--v4)', 'var(--v5)'];

export async function render(root) {
  const t = tablero();
  const head = `<header class="appbar">
      <div class="wordmark">DataCafe<span class="pipe">|</span><span class="lab">Laboratorio</span></div>
      <div style="display:flex;align-items:center;gap:.25rem">
        <span class="pill">${icon('phone', 'ic-sm')}Guardado aquí</span>
        <a class="icon-btn" href="#/ajustes" aria-label="Ajustes">${icon('settings')}</a>
      </div>
    </header>`;

  if (t.vacio) {
    root.innerHTML = `${head}
      <div class="stack">
        <div><h1 style="font-size:2.125rem">Inicio</h1><p class="sub">Aún no hay cafés registrados.</p></div>
        <div class="card stack-sm">
          <h2>Empecemos</h2>
          <p class="muted">Registra el primer café que entra a bodega. Si solo quieres conocer la app, carga unos datos de ejemplo y luego los puedes borrar desde Ajustes.</p>
          <a class="btn btn-accent btn-lg btn-block mt-sm" href="#/registrar">${icon('plus')}Registrar café</a>
          <button class="btn btn-block" type="button" id="demo">Cargar datos de ejemplo</button>
        </div>
      </div>`;
    root.querySelector('#demo').onclick = async () => {
      await cargarEjemplo();
      toast('Datos de ejemplo cargados');
      render(root);
    };
    return;
  }

  const maxB = Math.max(1, ...t.bodegas.map((b) => b.kg));
  const totalV = t.variedades.reduce((s, v) => s + v.kg, 0) || 1;
  const pct = (kg) => Math.round((100 * kg) / totalV);
  const p = t.precios;
  const precio = (label, v, unidad = ' /kg') => `<div><div class="small muted">${label}</div><div style="font-size:1.25rem;font-weight:600">${v ? fmtCOP(v) : '—'}${v && unidad ? `<span class="small muted" style="font-weight:400">${unidad}</span>` : ''}</div></div>`;

  root.innerHTML = `${head}
    <div class="stack">
      <div><h1 style="font-size:2.125rem">Inicio</h1><p class="sub">Así va tu café hoy</p></div>

      <a class="hero" href="#/inventario" style="text-decoration:none">
        <div class="label">Pergamino disponible</div>
        <div class="big-num">${fmtKg(t.pergamino)} <small>kg</small></div>
        <div class="small" style="opacity:.92">${t.nCafes} ${t.nCafes === 1 ? 'café' : 'cafés'} con kilos en bodega</div>
      </a>

      <div class="grid-2">
        <a class="card" href="#/trilla" style="text-decoration:none;color:inherit">
          <div class="small muted">Excelso</div>
          <div class="mid-num">${fmtKg(t.excelso)} <small>kg</small></div>
          <div class="small muted">${t.nLotesExcelso} ${t.nLotesExcelso === 1 ? 'lote' : 'lotes'}</div>
        </a>
        <a class="card" href="#/trilla" style="text-decoration:none;color:inherit">
          <div class="small muted">Pasilla</div>
          <div class="mid-num">${fmtKg(t.pasilla)} <small>kg</small></div>
          <div class="small muted">${t.nLotesPasilla} ${t.nLotesPasilla === 1 ? 'lote' : 'lotes'}</div>
        </a>
      </div>

      <section class="card">
        <div class="card-title">${icon('warehouse')}<h2>Bodegas</h2></div>
        <div class="stack-sm">
          ${t.bodegas.map((b) => `<div>
            <div style="display:flex;justify-content:space-between;font-size:.9375rem;margin-bottom:.375rem"><span>${esc(b.nombre)}</span><strong style="font-weight:600">${fmtKg(b.kg)} kg</strong></div>
            <div class="bar" role="img" aria-label="${esc(b.nombre)}: ${fmtKg(b.kg)} kg"><span style="width:${(100 * b.kg) / maxB}%"></span></div>
          </div>`).join('')}
        </div>
      </section>

      <section class="card">
        <div class="card-title">${icon('bean')}<h2>Variedades</h2></div>
        ${t.variedades.length ? `
          <div class="stackbar" aria-hidden="true">${t.variedades.map((v, i) => `<div style="width:${(100 * v.kg) / totalV}%;background:${COLORES[i]}"></div>`).join('')}</div>
          <div class="legend">${t.variedades.map((v, i) => `<div><span class="sw" style="background:${COLORES[i]}"></span><span>${esc(v.nombre)}</span><strong>${pct(v.kg)}%</strong></div>`).join('')}</div>
          <p class="small muted mt-sm">Porcentaje de los kilos de pergamino disponibles.</p>` : '<p class="muted">Sin kilos disponibles.</p>'}
      </section>

      <section class="card">
        <h2 style="margin-bottom:.75rem">Precios promedio</h2>
        <div class="grid-2">
          ${precio('Compra pergamino', p.compra)}
          ${precio('Carga (125 kg)', p.carga, '')}
          ${precio('Venta excelso', p.excelso)}
          ${precio('Venta pasilla', p.pasilla)}
        </div>
      </section>

      <a class="btn btn-accent btn-lg btn-block" href="#/registrar">${icon('plus')}Registrar café</a>
    </div>`;
}
