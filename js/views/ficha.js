// Ficha de un café: todo lo que se sabe de él, sus cataciones y movimientos.
import { data, del } from '../db.js';
import { cafeInfo, nombreProductor } from '../model.js';
import { fmtKg, fmt2, fmtCOP, fmtFecha, precioCarga, num, puntajeCatacion, clasificacion } from '../calc.js';
import { esc, icon, topbar, toast, go, shareText } from '../ui.js';

export async function render(root, { parts }) {
  const id = decodeURIComponent(parts[1] || '');
  const cafe = data.cafes.find((c) => c.id === id);
  if (!cafe) { root.innerHTML = `${topbar('Café', '#/inventario')}<p class="empty">No se encontró el café ${esc(id)}.</p>`; return; }
  const c = cafeInfo(cafe);
  const total = num(cafe.kgTotales);
  const lugar = [cafe.vereda && 'Vereda ' + cafe.vereda, cafe.municipio].filter(Boolean).join(', ') + (cafe.departamento ? ` (${cafe.departamento})` : '');
  const prodTxt = [nombreProductor(c.productor), lugar.trim()].filter(Boolean).join(' · ');

  // Movimientos: ingreso, salidas a trilla y ventas de pergamino.
  const movs = [{ fecha: cafe.fechaRegistro, txt: 'Ingreso', kg: total }];
  for (const l of data.lotes) for (const it of l.items || []) if (it.cafeId === id) movs.push({ fecha: l.fecha, txt: `Trilla lote ${l.id}`, kg: -num(it.kg), href: `#/lote/${encodeURIComponent(l.id)}` });
  for (const v of data.ventas) if (v.tipo === 'Pergamino' && v.ref === id) movs.push({ fecha: v.fecha, txt: `Venta a ${v.cliente || 'cliente'}`, kg: -num(v.kg) });
  movs.sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const tieneMovs = movs.length > 1;

  root.innerHTML = `
    ${topbar('Ficha del café', '#/inventario', `<a class="icon-btn boxed" href="#/registrar?id=${encodeURIComponent(id)}" aria-label="Editar café">${icon('edit')}</a>`)}
    <div class="stack">
      <section class="hero stack-sm" style="gap:.375rem">
        <div class="small" style="opacity:.92">${esc(cafe.id)} · Registrado el ${esc(fmtFecha(cafe.fechaRegistro))}</div>
        <div style="font-family:var(--font-display);font-size:1.45rem;font-weight:600;line-height:1.2">${esc(c.nombre)}</div>
        ${prodTxt ? `<div style="font-size:.9375rem;opacity:.92">${esc(prodTxt)}</div>` : ''}
      </section>

      <div class="grid-3">
        <div class="card" style="padding:.75rem"><div class="small muted">Disponible</div><div class="mid-num" style="font-size:1.375rem">${fmtKg(c.disponible)} kg</div><div class="small muted">de ${fmtKg(total)} kg</div></div>
        <div class="card" style="padding:.75rem"><div class="small muted">Puntaje</div><div class="mid-num" style="font-size:1.375rem">${c.puntaje !== null ? fmt2(c.puntaje) : '—'}</div><div class="small muted">${c.cataciones.length} ${c.cataciones.length === 1 ? 'catación' : 'cataciones'}</div></div>
        <div class="card" style="padding:.75rem"><div class="small muted">Bodega</div><div style="font-weight:600;margin-top:.25rem;line-height:1.25">${esc(c.bodega)}</div></div>
      </div>

      <section class="card stack-sm">
        <h2>Perfil en taza</h2>
        ${c.perfil.length ? `<div class="chips">${c.perfil.map((d) => `<span class="chip static" ${d.count > 1 ? 'style="background:var(--accent);color:var(--accent-ink);border-color:var(--accent)"' : ''}>${esc(d.label)}${d.count > 1 ? ` (x${d.count})` : ''}</span>`).join('')}</div>` : '<p class="muted">Aún no tiene cataciones.</p>'}
        ${c.cataciones.length ? `<div>${c.cataciones.map((k) => `
          <div class="row plain" style="align-items:center">
            <span>${esc(fmtFecha(k.fecha))} · Mesa ${esc(k.mesa || '1')}${k.catador ? ' · ' + esc(k.catador) : ''}</span>
            <span style="display:flex;align-items:center;gap:.25rem"><strong title="${esc(clasificacion(puntajeCatacion(k)))}">${fmt2(puntajeCatacion(k))}</strong>
              <button class="icon-btn" type="button" data-del-cat="${esc(k.id)}" aria-label="Borrar catación del ${esc(fmtFecha(k.fecha))}">${icon('trash', 'ic-sm')}</button></span>
          </div>`).join('')}</div>` : ''}
        <a class="btn btn-outline-green" href="#/catacion?tipo=pergamino&ref=${encodeURIComponent(id)}">${icon('cup-plain')}Catar este café</a>
      </section>

      <section class="card">
        <h2 style="margin-bottom:.375rem">Proceso</h2>
        <div class="row"><span>Variedad</span><span>${esc((cafe.variedades || []).join(', ') || '—')}</span></div>
        <div class="row"><span>Proceso</span><span>${esc(cafe.proceso || '—')}</span></div>
        <div class="row"><span>Fermentación</span><span>${esc([cafe.tipoFermentacion, cafe.tiempoFermentacion].filter(Boolean).join(' · ') || '—')}</span></div>
        <div class="row"><span>Secado</span><span>${esc([cafe.tipoSecado, cafe.tiempoSecado].filter(Boolean).join(' · ') || '—')}</span></div>
        <div class="row"><span>Humedad</span><span>${cafe.humedad ? esc(String(cafe.humedad).replace('.', ',')) + ' %' : '—'}</span></div>
        <div class="row"><span>Cédula del productor</span><span>${esc((c.productor && c.productor.cedula) || '—')}</span></div>
        <div class="row"><span>Autorización de datos</span><span>${c.productor && c.productor.autorizacion ? 'Sí' : 'No registrada'}</span></div>
      </section>

      <section class="card stack-sm">
        <h2>Análisis físico <span class="small muted" style="font-family:var(--font-body);font-weight:400">· ${fmtKg(num(cafe.gramos))} g</span></h2>
        <div class="grid-3 small center">
          <div style="background:var(--surface-2);border-radius:.75rem;padding:.5rem .25rem"><div class="muted">Malla 15</div><strong style="font-size:1rem">${fmtKg(num(cafe.m15))} g</strong><div class="muted">pasilla ${fmtKg(num(cafe.p15))} g</div></div>
          <div style="background:var(--surface-2);border-radius:.75rem;padding:.5rem .25rem"><div class="muted">Malla 14</div><strong style="font-size:1rem">${fmtKg(num(cafe.m14))} g</strong><div class="muted">pasilla ${fmtKg(num(cafe.p14))} g</div></div>
          <div style="background:var(--surface-2);border-radius:.75rem;padding:.5rem .25rem"><div class="muted">Fondo</div><strong style="font-size:1rem">${fmtKg(num(cafe.m0))} g</strong></div>
        </div>
        <div class="grid-2">
          <div class="card" style="padding:.625rem .75rem"><div class="small muted">Factor UGQ</div><div class="mid-num" style="font-size:1.5rem">${fmt2(c.factorUGQ)}</div></div>
          <div class="card" style="padding:.625rem .75rem"><div class="small muted">Factor EP</div><div class="mid-num" style="font-size:1.5rem">${fmt2(c.factorEP)}</div></div>
        </div>
      </section>

      <section class="card">
        <h2 style="margin-bottom:.375rem">Precio y movimientos</h2>
        <div class="row"><span>Precio</span><span>${num(cafe.precioKg) ? `${fmtCOP(num(cafe.precioKg))} /kg · ${fmtCOP(precioCarga(cafe.precioKg))} la carga` : '—'}</span></div>
        ${movs.map((m) => `<div class="row plain"><span>${esc(fmtFecha(m.fecha))} · ${m.href ? `<a href="${m.href}">${esc(m.txt)}</a>` : esc(m.txt)}</span><strong class="${m.kg < 0 ? 'minus' : 'plus'}">${m.kg < 0 ? '−' : '+'}${fmtKg(Math.abs(m.kg))} kg</strong></div>`).join('')}
        ${cafe.comentarios ? `<div class="note mt-sm">${esc(cafe.comentarios)}</div>` : ''}
      </section>

      <button class="btn btn-accent btn-lg btn-block" type="button" id="compartir">${icon('share')}Compartir ficha por WhatsApp</button>
      ${tieneMovs ? '' : `<button class="btn btn-danger btn-block" type="button" id="borrar">${icon('trash')}Borrar este café</button>`}
    </div>`;

  root.querySelector('#compartir').onclick = () => {
    const lineas = [
      `☕ ${c.nombre}`, `Código: ${cafe.id}`,
      nombreProductor(c.productor) ? `Productor: ${nombreProductor(c.productor)}` : null,
      [cafe.municipio, cafe.departamento].filter(Boolean).length ? `Origen: ${[cafe.vereda, cafe.municipio, cafe.departamento].filter(Boolean).join(', ')}` : null,
      `Proceso: ${cafe.proceso}${cafe.tiempoFermentacion ? ' · fermentación ' + cafe.tiempoFermentacion : ''}`,
      c.puntaje !== null ? `Puntaje SCA: ${fmt2(c.puntaje)} (${clasificacion(c.puntaje)})` : null,
      c.perfilTexto ? `Perfil: ${c.perfilTexto}` : null,
      c.factorUGQ ? `Factor UGQ: ${fmt2(c.factorUGQ)}` : null,
      `Disponible: ${fmtKg(c.disponible)} kg de pergamino`,
      '', 'Enviado desde DataCafe|Laboratorio',
    ].filter((x) => x !== null);
    shareText(c.nombre, lineas.join('\n'));
  };

  root.querySelectorAll('[data-del-cat]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('¿Borrar esta catación?')) return;
    await del('cataciones', b.dataset.delCat);
    toast('Catación borrada');
    render(root, { parts });
  }));

  const borrar = root.querySelector('#borrar');
  if (borrar) borrar.onclick = async () => {
    if (!confirm(`¿Borrar el café ${id}? Esta acción no se puede deshacer.`)) return;
    for (const k of c.cataciones) await del('cataciones', k.id);
    await del('cafes', id);
    toast(`Café ${id} borrado`);
    go('#/inventario');
  };
}
