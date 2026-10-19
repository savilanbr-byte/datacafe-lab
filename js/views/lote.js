// Crear o editar un lote de trilla: cafés que entran, preparación, proyección y resultado real.
import { data, put, del, nextCode, byId } from '../db.js';
import { resumenLote, disponibleCafe, nombreProducto, num, fmtKg, fmt2, fmtFecha, hoyISO, puntajeCatacion, factor, proyeccionExcelso } from '../calc.js';
import { esc, icon, topbar, seg, bindSeg, field, textarea, toast, go } from '../ui.js';
import { loteInfo, catacionesDe } from '../model.js';

export async function render(root, { parts }) {
  const id = decodeURIComponent(parts[1] || 'nuevo');
  const nuevo = id === 'nuevo';
  const existente = nuevo ? null : data.lotes.find((l) => l.id === id);
  if (!nuevo && !existente) { root.innerHTML = `${topbar('Lote', '#/trilla')}<p class="empty">No se encontró el lote ${esc(id)}.</p>`; return; }

  const l = {
    nombre: '', fecha: hoyISO(), preparacion: 'UGQ', items: [], corte: '', muestraG: '', def1: '', def2: '', quakers: '', kgExcelso: '', kgPasilla: '', comentarios: '',
    ...(existente ? JSON.parse(JSON.stringify(existente)) : {}),
  };
  const cafes = byId('cafes');
  const dispDe = (cafeId) => (cafes[cafeId] ? disponibleCafe(cafes[cafeId], data.lotes, data.ventas, existente ? existente.id : null) : 0);
  const vendido = (tipo) => (existente ? data.ventas.filter((v) => v.tipo === tipo && v.ref === existente.id).reduce((s, v) => s + num(v.kg), 0) : 0);
  const info = existente ? loteInfo(existente) : null;

  root.innerHTML = `
    ${topbar(nuevo ? 'Nuevo lote' : `Lote ${id}`, '#/trilla')}
    <form id="form" class="stack" novalidate>
      <section class="card stack-sm">
        <div class="grid-2">
          ${field('fecha', 'Fecha de trilla', l.fecha, 'type="date"')}
          ${field('nombre', 'Nombre (opcional)', l.nombre, 'placeholder="Ej.: Mezcla Huila"')}
        </div>
        <div class="field"><div class="label">Preparación <span class="muted" style="font-weight:400">(para todo el lote)</span></div>${seg('prep', ['UGQ', 'EP'], l.preparacion)}</div>
      </section>

      <div id="items" class="stack-sm"></div>

      <section class="card stack-sm">
        <div class="field"><label for="add-cafe">Agregar café del inventario</label><select class="input" id="add-cafe"></select></div>
        <button type="button" class="btn btn-dashed" id="add">${icon('plus')}Agregar al lote</button>
      </section>

      <section class="hero grid-3" aria-live="polite" style="gap:.5rem">
        <div><div class="small">Pergamino</div><div class="mid-num" style="font-size:1.5rem" id="t-kg"></div><div class="small">kg</div></div>
        <div><div class="small">Excelso proy.</div><div class="mid-num" style="font-size:1.5rem" id="t-proy"></div><div class="small">kg</div></div>
        <div><div class="small">Factor lote</div><div class="mid-num" style="font-size:1.5rem" id="t-f"></div><div class="small" id="t-prep"></div></div>
      </section>

      <section class="card stack-sm">
        <h2>Resultado de la trilla</h2>
        <p class="small muted">Llénalo cuando el lote ya esté trillado.</p>
        <div class="grid-2">
          ${field('kgExcelso', 'Kg de excelso', l.kgExcelso, 'inputmode="decimal"')}
          ${field('kgPasilla', 'Kg de pasilla', l.kgPasilla, 'inputmode="decimal"')}
          ${field('corte', 'Corte de trilla', l.corte, 'inputmode="numeric"')}
          ${field('muestraG', 'Muestra (g)', l.muestraG, 'inputmode="numeric"')}
        </div>
        <div class="grid-3">
          ${field('def1', 'Defectos 1er grupo', l.def1, 'inputmode="numeric"')}
          ${field('def2', 'Defectos 2do grupo', l.def2, 'inputmode="numeric"')}
          ${field('quakers', 'Quakers', l.quakers, 'inputmode="numeric"')}
        </div>
        <div class="note" style="display:flex;justify-content:space-between;align-items:center;gap:.75rem" aria-live="polite">
          <div><div class="small">Factor real</div><div class="mid-num" style="font-size:1.5rem;color:var(--ink)" id="f-real">—</div></div>
          <div class="small" style="text-align:right;max-width:12rem;color:var(--ink)" id="dif"></div>
        </div>
        ${textarea('comentarios', 'Comentarios', l.comentarios)}
      </section>

      <div id="errores" aria-live="assertive"></div>
      <button type="submit" class="btn btn-accent btn-lg btn-block">Guardar lote</button>
    </form>

    ${info ? `
      <section class="card stack-sm mt">
        <h2>Catación del lote</h2>
        ${info.cataciones.length ? `
          <div class="row plain"><span>Puntaje promedio</span><strong>${fmt2(info.puntaje)}</strong></div>
          ${info.perfil.length ? `<div class="chips">${info.perfil.map((d) => `<span class="chip static">${esc(d.label)}${d.count > 1 ? ` (x${d.count})` : ''}</span>`).join('')}</div>` : ''}
          ${catacionesDe('lote', id).map((k) => `<div class="row plain"><span>${esc(fmtFecha(k.fecha))} · Mesa ${esc(k.mesa || '1')}</span><strong>${fmt2(puntajeCatacion(k))}</strong></div>`).join('')}`
          : '<p class="muted">Aún no se ha catado este lote.</p>'}
        <a class="btn btn-outline-green" href="#/catacion?tipo=lote&ref=${encodeURIComponent(id)}">${icon('cup-plain')}Catar este lote</a>
      </section>
      ${vendido('Excelso') + vendido('Pasilla') > 0 ? '' : `<button type="button" class="btn btn-danger btn-block mt" id="borrar">${icon('trash')}Borrar lote</button>`}` : ''}`;

  const $ = (s) => root.querySelector(s);
  const form = $('#form');

  function opcionesAgregar() {
    const ya = new Set(l.items.map((i) => i.cafeId));
    const ops = Object.values(cafes).filter((c) => !ya.has(c.id) && dispDe(c.id) > 0.001).sort((a, b) => (a.id < b.id ? 1 : -1));
    $('#add-cafe').innerHTML = ops.length
      ? ops.map((c) => `<option value="${esc(c.id)}">${esc(c.id)} · ${esc(nombreProducto(c))} — ${fmtKg(dispDe(c.id))} kg</option>`).join('')
      : '<option value="">No hay más cafés con kilos disponibles</option>';
    $('#add').disabled = !ops.length;
  }

  function pintarItems() {
    $('#items').innerHTML = l.items.length ? l.items.map((it, i) => {
      const c = cafes[it.cafeId];
      return `<section class="card stack-sm" data-i="${i}">
        <div style="display:flex;justify-content:space-between;gap:.5rem;align-items:flex-start">
          <div><div class="small muted">${esc(it.cafeId)} · disponible ${fmtKg(dispDe(it.cafeId))} kg</div>
          <div class="item-name">${esc(c ? nombreProducto(c) : 'Café borrado')}</div></div>
          <button type="button" class="icon-btn" data-quitar="${i}" aria-label="Quitar ${esc(it.cafeId)} del lote">${icon('close')}</button>
        </div>
        <div style="display:grid;grid-template-columns:7rem minmax(0,1fr) minmax(0,1fr);gap:.625rem;align-items:end">
          <div class="field"><label for="kg-${i}">Kg al lote</label><input class="input" id="kg-${i}" data-kg="${i}" inputmode="decimal" value="${esc(it.kg)}"></div>
          <div><div class="small muted">Factor ${esc(l.preparacion)}</div><div style="font-size:1.125rem;font-weight:600;padding-bottom:.75rem" id="f-${i}"></div></div>
          <div><div class="small muted">Excelso proy.</div><div style="font-size:1.125rem;font-weight:600;padding-bottom:.75rem" id="p-${i}"></div></div>
        </div>
        <div class="alert" id="x-${i}" hidden></div>
      </section>`;
    }).join('') : '<p class="note">Agrega los cafés que van a este lote.</p>';
    opcionesAgregar();
    calcular();
  }

  function calcular() {
    const r = resumenLote(l, cafes);
    l.items.forEach((it, i) => {
      const c = cafes[it.cafeId];
      const f = c ? factor(c, l.preparacion) : null;
      const fe = $('#f-' + i), pe = $('#p-' + i), xe = $('#x-' + i);
      if (fe) fe.textContent = f ? fmt2(f) : 'Sin análisis';
      if (pe) pe.textContent = f ? `${fmt2(proyeccionExcelso(it.kg, f))} kg` : '—';
      const d = dispDe(it.cafeId);
      if (xe) { xe.hidden = !(num(it.kg) > d + 0.001); xe.textContent = `Solo hay ${fmtKg(d)} kg disponibles de este café.`; }
    });
    $('#t-kg').textContent = fmtKg(r.kgPergamino);
    $('#t-proy').textContent = fmt2(r.proyeccion);
    $('#t-f').textContent = r.factorLote ? fmt2(r.factorLote) : '—';
    $('#t-prep').textContent = l.preparacion;
    $('#f-real').textContent = r.factorReal ? fmt2(r.factorReal) : '—';
    $('#dif').textContent = r.diferencia === null ? 'Anota los kg de excelso para comparar con lo proyectado.'
      : Math.abs(r.diferencia) < 0.5 ? 'Salió justo lo proyectado.'
      : `Salieron ${fmt2(Math.abs(r.diferencia))} kg ${r.diferencia < 0 ? 'menos' : 'más'} de lo proyectado.`;
  }

  bindSeg(root, 'prep', (val) => { l.preparacion = val; pintarItems(); });

  form.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.kg !== undefined) { l.items[Number(el.dataset.kg)].kg = el.value; calcular(); return; }
    if (el.name && el.name in l) { l[el.name] = el.value; if (el.name === 'kgExcelso') calcular(); }
  });
  form.addEventListener('click', (e) => {
    const q = e.target.closest('[data-quitar]');
    if (q) { l.items.splice(Number(q.dataset.quitar), 1); pintarItems(); }
  });
  $('#add').addEventListener('click', () => {
    const cid = $('#add-cafe').value;
    if (!cid) return;
    l.items.push({ cafeId: cid, kg: String(Math.round(dispDe(cid) * 100) / 100) });
    pintarItems();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = [];
    if (!l.items.length) err.push('Agrega al menos un café al lote.');
    for (const it of l.items) {
      if (!(num(it.kg) > 0)) err.push(`Escribe los kg de ${it.cafeId}.`);
      else if (num(it.kg) > dispDe(it.cafeId) + 0.001) err.push(`${it.cafeId}: solo hay ${fmtKg(dispDe(it.cafeId))} kg disponibles.`);
    }
    const r = resumenLote(l, cafes);
    if (num(l.kgExcelso) > r.kgPergamino) err.push('Los kg de excelso no pueden ser más que los kg de pergamino.');
    if (num(l.kgExcelso) < vendido('Excelso') - 0.001) err.push(`Ya se vendieron ${fmtKg(vendido('Excelso'))} kg de excelso de este lote.`);
    if (num(l.kgPasilla) < vendido('Pasilla') - 0.001) err.push(`Ya se vendieron ${fmtKg(vendido('Pasilla'))} kg de pasilla de este lote.`);
    if (err.length) { $('#errores').innerHTML = `<div class="alert" role="alert">${err.map(esc).join('<br>')}</div>`; return; }
    const lid = existente ? existente.id : await nextCode('L', 3);
    await put('lotes', { ...l, id: lid, items: l.items.map((it) => ({ cafeId: it.cafeId, kg: num(it.kg) })) });
    toast(existente ? 'Lote guardado' : `Lote ${lid} creado`);
    go(`#/lote/${encodeURIComponent(lid)}`);
  });

  const borrar = $('#borrar');
  if (borrar) borrar.onclick = async () => {
    if (!confirm(`¿Borrar el lote ${id}? Los kilos vuelven al inventario.`)) return;
    for (const k of catacionesDe('lote', id)) await del('cataciones', k.id);
    await del('lotes', id);
    toast(`Lote ${id} borrado`);
    go('#/trilla');
  };

  pintarItems();
}
