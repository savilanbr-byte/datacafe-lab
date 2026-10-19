// Registrar un café (2 pasos, solo lo esencial) o editarlo (4 pasos, con los datos complementarios).
import { data, put, nextCode, uid } from '../db.js';
import { factor, excelsoGramos, num, fmt2, fmtCOP, precioCarga, nombreProducto, hoyISO, disponibleCafe } from '../calc.js';
import { esc, icon, field, textarea, seg, bindSeg, toast, go } from '../ui.js';
import { DEPARTAMENTOS, MUNICIPIOS, VARIEDADES, PROCESOS } from '../listas.js';
import { nombreProductor } from '../model.js';

const PASOS_NUEVO = ['Productor y finca', 'El café'];
const PASOS_EDITAR = ['Productor y finca', 'El café', 'Análisis físico', 'Bodega, precio y otros'];

export async function render(root, { q }) {
  const editId = q.get('id');
  const existente = editId ? data.cafes.find((c) => c.id === editId) : null;
  if (editId && !existente) { root.innerHTML = `<p class="empty">No se encontró el café ${esc(editId)}.</p>`; return; }
  const PASOS = existente ? PASOS_EDITAR : PASOS_NUEVO;
  const N = PASOS.length;

  const prod = existente ? data.productores.find((p) => p.id === existente.productorId) : null;
  const v = {
    productorId: null, nombre: '', apellido: '', cedula: '', autorizacion: false,
    finca: '', departamento: '', municipio: '', vereda: '',
    variedades: [], proceso: '', tipoFermentacion: '', tiempoFermentacion: '', tipoSecado: '', tiempoSecado: '',
    gramos: '', m15: '', p15: '', m14: '', p14: '', m0: '',
    kgTotales: '', humedad: '', bodegaId: data.bodegas[0] ? data.bodegas[0].id : '', precioKg: '', fechaRegistro: hoyISO(), comentarios: '',
    ...(existente || {}),
  };
  if (existente) {
    v.variedades = [...(existente.variedades || [])];
    Object.assign(v, {
      nombre: (prod && prod.nombre) || '', apellido: (prod && prod.apellido) || '', cedula: (prod && prod.cedula) || '',
      autorizacion: prod ? !!prod.autorizacion : false,
    });
  }
  let paso = existente ? Math.min(N, Math.max(1, Number(q.get('paso')) || 1)) : 1;
  const volver = q.get('volver');
  const salir = volver ? `#/pendientes?lista=${encodeURIComponent(volver)}` : existente ? `#/cafe/${encodeURIComponent(existente.id)}` : '#/inventario';

  root.innerHTML = `
    <header class="topbar">
      <a class="icon-btn" href="${salir}" id="cancelar" aria-label="Cancelar">${icon('close')}</a>
      <div style="flex:1"><h1>${existente ? 'Editar ' + esc(existente.id) : 'Registrar café'}</h1><div class="small muted" id="paso-txt"></div></div>
    </header>
    <div class="steps" style="grid-template-columns:repeat(${N},minmax(0,1fr))" aria-hidden="true">${PASOS.map(() => '<span></span>').join('')}</div>
    <form id="form" novalidate>
      <div id="paso" class="stack"></div>
      <div id="errores" class="mt" aria-live="assertive"></div>
      <div class="btn-row mt">
        <button type="button" class="btn btn-lg" id="atras">Atrás</button>
        <button type="submit" class="btn btn-accent btn-lg grow" id="siguiente">Siguiente</button>
      </div>
      ${existente ? '<button type="button" class="btn btn-green btn-block mt" id="guardar-ya">Guardar cambios</button>' : ''}
    </form>`;

  const $ = (s) => root.querySelector(s);
  const pasoEl = $('#paso');

  $('#cancelar').addEventListener('click', (e) => {
    if (!confirm('¿Salir sin guardar los cambios?')) e.preventDefault();
  });

  // Cualquier campo con name actualiza el estado.
  pasoEl.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.name) return;
    v[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    if (['nombre', 'apellido', 'cedula'].includes(el.name)) v.productorId = null;
    if (el.name === 'departamento') pintarMunicipios();
    actualizarCalculos();
  });
  pasoEl.addEventListener('change', (e) => { if (e.target.type === 'checkbox' && e.target.name) v[e.target.name] = e.target.checked; });

  function pintarMunicipios() {
    const dl = root.querySelector('#dl-mun');
    if (dl) dl.innerHTML = (MUNICIPIOS[v.departamento] || []).map((m) => `<option value="${esc(m)}"></option>`).join('');
  }

  function actualizarCalculos() {
    const fu = $('#f-ugq'), fe = $('#f-ep'), ex = $('#f-exc'), aviso = $('#aviso-mallas');
    if (fu) {
      const u = factor(v, 'UGQ'), e = factor(v, 'EP');
      fu.textContent = u ? fmt2(u) : '—';
      fe.textContent = e ? fmt2(e) : '—';
      ex.textContent = `Excelso en la muestra: ${fmt2(Math.max(0, excelsoGramos(v, 'UGQ')))} g de ${fmt2(num(v.gramos))} g`;
      const suma = num(v.m15) + num(v.m14) + num(v.m0);
      aviso.hidden = !(num(v.gramos) > 0 && suma > num(v.gramos));
    }
    const carga = $('#carga');
    if (carga) carga.textContent = num(v.precioKg) > 0 ? fmtCOP(precioCarga(v.precioKg)) : '—';
    const np = $('#nombre-prod');
    if (np) np.textContent = nombreProducto(v);
  }

  function htmlPaso() {
    if (paso === 1) {
      const recientes = [...data.productores].sort((a, b) => (a.actualizado < b.actualizado ? 1 : -1)).slice(0, 8);
      return `
        ${recientes.length ? `<div class="card" style="padding:.875rem">
          <div class="small muted" style="margin-bottom:.5rem">¿Ya está registrado? Elígelo:</div>
          <div class="chips" id="prods">${recientes.map((p) => `<button type="button" class="chip" data-id="${esc(p.id)}" aria-pressed="${v.productorId === p.id}">${esc(nombreProductor(p))}</button>`).join('')}</div>
        </div>` : ''}
        <div class="grid-2">
          ${field('nombre', 'Nombre del productor', v.nombre, 'autocomplete="off" required')}
          ${field('apellido', 'Apellido', v.apellido, 'autocomplete="off"')}
        </div>
        ${field('cedula', 'Cédula', v.cedula, 'inputmode="numeric" autocomplete="off"')}
        ${field('finca', 'Finca', v.finca, 'autocomplete="off" required')}
        <div class="grid-2">
          ${field('departamento', 'Departamento', v.departamento, 'list="dl-dep" autocomplete="off"')}
          ${field('municipio', 'Municipio', v.municipio, 'list="dl-mun" autocomplete="off"')}
        </div>
        <datalist id="dl-dep">${DEPARTAMENTOS.map((d) => `<option value="${esc(d)}"></option>`).join('')}</datalist>
        <datalist id="dl-mun"></datalist>`;
    }
    if (paso === 2) {
      const todas = [...new Set([...VARIEDADES, ...v.variedades])];
      return `
        ${field('kgTotales', 'Kilos de pergamino', v.kgTotales, 'inputmode="decimal" required')}
        <div class="field"><div class="label">Variedad <span class="muted" style="font-weight:400">(puedes elegir varias)</span></div>
          <div class="chips" id="vars">${todas.map((x) => `<button type="button" class="chip" data-v="${esc(x)}" aria-pressed="${v.variedades.includes(x)}">${esc(x)}</button>`).join('')}</div>
          <div style="display:flex;gap:.5rem;margin-top:.625rem">
            <label class="sr" for="otra-var">Otra variedad</label>
            <input class="input" id="otra-var" placeholder="Otra variedad" autocomplete="off">
            <button type="button" class="btn" id="add-var">Agregar</button>
          </div>
        </div>
        <div class="field"><div class="label">Proceso</div>${seg('proceso', PROCESOS, v.proceso)}</div>
        ${textarea('tipoFermentacion', 'Tipo de fermentación', v.tipoFermentacion, 'placeholder="Ej.: tanque cerrado, cereza en bolsa sellada"')}
        ${field('tiempoFermentacion', 'Tiempo de fermentación', v.tiempoFermentacion, 'placeholder="Ej.: 36 h"')}
        ${textarea('tipoSecado', 'Tipo de secado', v.tipoSecado, 'placeholder="Ej.: marquesina, cama africana"')}
        ${field('tiempoSecado', 'Tiempo de secado', v.tiempoSecado, 'placeholder="Ej.: 15 días"')}
        <section class="card stack-sm">
          <div class="small muted">Así quedará guardado</div>
          <div class="item-name" id="nombre-prod"></div>
          ${existente ? '' : '<div class="small muted">El análisis físico, el precio y la bodega se pueden agregar después desde la ficha del café.</div>'}
        </section>`;
    }
    if (paso === 3) {
      return `
        <p class="muted">Anota los gramos de cada malla. Los factores se calculan solos.</p>
        ${field('gramos', 'Gramos de análisis', v.gramos, 'inputmode="decimal" placeholder="Ej.: 300"')}
        <div class="grid-2">
          ${field('m15', 'Malla 15', v.m15, 'inputmode="decimal"')}
          ${field('p15', 'Pasilla malla 15', v.p15, 'inputmode="decimal"')}
          ${field('m14', 'Malla 14', v.m14, 'inputmode="decimal"')}
          ${field('p14', 'Pasilla malla 14', v.p14, 'inputmode="decimal"')}
          ${field('m0', 'Malla 0 (fondo)', v.m0, 'inputmode="decimal"')}
        </div>
        <div class="alert warn" id="aviso-mallas" hidden>Las mallas suman más que los gramos de análisis. Revisa los números.</div>
        <section class="result grid-2" aria-live="polite">
          <div><div class="small">Factor UGQ</div><div class="mid-num" id="f-ugq">—</div></div>
          <div><div class="small">Factor EP <span style="font-size:.75rem">(por confirmar)</span></div><div class="mid-num" id="f-ep">—</div></div>
          <div class="span-2 small" id="f-exc"></div>
        </section>`;
    }
    return `
      <div class="field"><div class="label">¿En qué bodega está?</div>
        ${seg('bodegaId', data.bodegas.map((b) => [b.id, b.nombre, ' ']), v.bodegaId, 'wrap')}
        <div class="hint">Puedes crear o renombrar bodegas en Ajustes.</div>
      </div>
      <div class="grid-2">
        ${field('precioKg', 'Precio por kilo (COP)', v.precioKg, 'inputmode="numeric"')}
        ${field('humedad', 'Humedad (%)', v.humedad, 'inputmode="decimal"')}
      </div>
      <div class="row plain"><span>Precio carga (125 kg)</span><strong id="carga">—</strong></div>
      ${field('vereda', 'Vereda', v.vereda, 'autocomplete="off"')}
      ${field('fechaRegistro', 'Fecha de registro', v.fechaRegistro, 'type="date"')}
      <label class="check"><input type="checkbox" name="autorizacion" ${v.autorizacion ? 'checked' : ''}> El productor autorizó el uso de sus datos personales (Ley 1581 de 2012)</label>
      ${textarea('comentarios', 'Comentarios', v.comentarios)}`;
  }

  function pintar() {
    $('#paso-txt').textContent = `Paso ${paso} de ${N} · ${PASOS[paso - 1]}`;
    root.querySelectorAll('.steps span').forEach((s, i) => s.classList.toggle('on', i < paso));
    pasoEl.innerHTML = htmlPaso();
    $('#errores').innerHTML = '';
    $('#atras').hidden = paso === 1;
    const ultimo = paso === N;
    $('#siguiente').textContent = ultimo ? (existente ? 'Guardar cambios' : 'Guardar café') : 'Siguiente';
    $('#siguiente').classList.toggle('btn-green', ultimo);
    $('#siguiente').classList.toggle('btn-accent', !ultimo);
    const ya = $('#guardar-ya');
    if (ya) ya.hidden = ultimo;

    if (paso === 1) {
      pintarMunicipios();
      const prods = $('#prods');
      if (prods) prods.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-id]');
        if (!b) return;
        const p = data.productores.find((x) => x.id === b.dataset.id);
        const ult = [...data.cafes].filter((c) => c.productorId === p.id).sort((a, b2) => (a.id < b2.id ? 1 : -1))[0];
        Object.assign(v, { productorId: p.id, nombre: p.nombre || '', apellido: p.apellido || '', cedula: p.cedula || '', autorizacion: !!p.autorizacion });
        if (ult) Object.assign(v, { finca: ult.finca || '', departamento: ult.departamento || '', municipio: ult.municipio || '', vereda: ult.vereda || '' });
        pintar();
      });
    }
    if (paso === 2) {
      $('#vars').addEventListener('click', (e) => {
        const b = e.target.closest('button[data-v]');
        if (!b) return;
        const x = b.dataset.v;
        v.variedades = v.variedades.includes(x) ? v.variedades.filter((y) => y !== x) : [...v.variedades, x];
        b.setAttribute('aria-pressed', String(v.variedades.includes(x)));
        actualizarCalculos();
      });
      $('#add-var').addEventListener('click', () => {
        const x = $('#otra-var').value.trim();
        if (!x) return;
        if (!v.variedades.includes(x)) v.variedades.push(x);
        pintar();
      });
      bindSeg(root, 'proceso', (val) => { v.proceso = val; actualizarCalculos(); });
    }
    if (paso === 4) bindSeg(root, 'bodegaId', (val) => { v.bodegaId = val; pintar(); });
    actualizarCalculos();
  }

  // Valida un paso; los pasos 1 y 2 tienen los datos obligatorios.
  function validar(p) {
    const err = [];
    if (p === 1) {
      if (!String(v.nombre).trim()) err.push('Escribe el nombre del productor.');
      if (!String(v.finca).trim()) err.push('Escribe el nombre de la finca.');
    }
    if (p === 2) {
      if (!(num(v.kgTotales) > 0)) err.push('Escribe los kilos de pergamino.');
      else if (existente) {
        const usados = num(existente.kgTotales) - disponibleCafe(existente, data.lotes, data.ventas);
        if (num(v.kgTotales) < usados) err.push(`Ya se usaron ${usados} kg de este café en trillas o ventas; los kilos no pueden ser menos.`);
      }
      if (!v.variedades.length) err.push('Elige al menos una variedad.');
      if (!v.proceso) err.push('Elige el proceso.');
    }
    return err;
  }

  async function guardar() {
    // Productor: usa el elegido, o busca uno igual por cédula o nombre, o crea uno nuevo.
    const t = (x) => String(x ?? '').trim();
    let p = v.productorId ? data.productores.find((x) => x.id === v.productorId) : null;
    if (!p && t(v.cedula)) p = data.productores.find((x) => x.cedula && t(x.cedula) === t(v.cedula));
    if (!p) p = data.productores.find((x) => t(x.nombre).toLowerCase() === t(v.nombre).toLowerCase() && t(x.apellido).toLowerCase() === t(v.apellido).toLowerCase());
    p = await put('productores', {
      ...(p || { id: uid('p') }),
      nombre: t(v.nombre), apellido: t(v.apellido), cedula: t(v.cedula),
      autorizacion: !!v.autorizacion,
      fechaAutorizacion: v.autorizacion ? (p && p.fechaAutorizacion) || hoyISO() : null,
    });
    const id = existente ? existente.id : await nextCode('C', 4);
    const campos = ['finca', 'departamento', 'municipio', 'vereda', 'proceso', 'tipoFermentacion', 'tiempoFermentacion', 'tipoSecado', 'tiempoSecado',
      'gramos', 'm15', 'p15', 'm14', 'p14', 'm0', 'kgTotales', 'humedad', 'bodegaId', 'precioKg', 'fechaRegistro', 'comentarios'];
    const cafe = { ...(existente || {}), id, productorId: p.id, variedades: v.variedades };
    for (const k of campos) cafe[k] = typeof v[k] === 'string' ? v[k].trim() : v[k];
    if (!existente) cafe.creado = new Date().toISOString();
    await put('cafes', cafe);
    toast(existente ? 'Cambios guardados' : `Café ${id} registrado`);
    go(volver ? `#/pendientes?lista=${encodeURIComponent(volver)}` : `#/cafe/${encodeURIComponent(id)}`);
  }

  async function intentarGuardar() {
    for (const p of [1, 2]) {
      const err = validar(p);
      if (err.length) {
        if (paso !== p) { paso = p; pintar(); }
        $('#errores').innerHTML = `<div class="alert" role="alert">${err.map(esc).join('<br>')}</div>`;
        return;
      }
    }
    $('#siguiente').disabled = true;
    try { await guardar(); } catch (er) { $('#siguiente').disabled = false; $('#errores').innerHTML = `<div class="alert">No se pudo guardar: ${esc(er.message)}</div>`; }
  }

  $('#form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = validar(paso);
    if (err.length) { $('#errores').innerHTML = `<div class="alert" role="alert">${err.map(esc).join('<br>')}</div>`; return; }
    if (paso < N) { paso++; pintar(); window.scrollTo(0, 0); return; }
    intentarGuardar();
  });
  $('#atras').addEventListener('click', () => { paso--; pintar(); window.scrollTo(0, 0); });
  const ya = $('#guardar-ya');
  if (ya) ya.addEventListener('click', intentarGuardar);

  pintar();
}
