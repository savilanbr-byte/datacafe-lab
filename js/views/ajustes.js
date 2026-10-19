// Ajustes: apariencia, bodegas, exportar a Excel, respaldo y datos de ejemplo.
import { data, put, del, uid, exportAll, importAll, clearAll } from '../db.js';
import { esc, icon, topbar, seg, bindSeg, toast, download, toCSV } from '../ui.js';
import { cafeInfo, loteInfo, nombreReferencia } from '../model.js';
import { ATRIBUTOS, TAZAS, puntajeCatacion, num, nombreProducto, precioCarga, hoyISO } from '../calc.js';
import { cargarEjemplo } from '../seed.js';
import { VERSION } from '../version.js';

function leer(k, def) { try { return localStorage.getItem(k) || def; } catch (e) { return def; } }
function guardar(k, val) { try { localStorage.setItem(k, val); } catch (e) { /* sin almacenamiento */ } }

export function aplicarTema(t) {
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

export async function render(root) {
  const tema = leer('dc-tema', 'auto');
  const escala = leer('dc-escala', '1');

  root.innerHTML = `
    ${topbar('Ajustes', '#/inicio')}
    <div class="stack">
      <section class="card stack">
        <h2>Apariencia</h2>
        <div class="field"><div class="label">Tema</div>${seg('tema', [['light', 'Claro'], ['dark', 'Oscuro'], ['auto', 'Automático']], tema)}
          <div class="hint">Automático cambia a oscuro cuando el celular está en modo oscuro.</div></div>
        <div class="field"><div class="label">Tamaño de letra</div>${seg('escala', [['1', 'Normal'], ['1.2', 'Grande'], ['1.4', 'Muy grande']], escala)}</div>
      </section>

      <section class="card stack-sm">
        <h2>Bodegas</h2>
        <div id="bodegas"></div>
        <div style="display:flex;gap:.5rem">
          <label class="sr" for="nueva-bodega">Nueva bodega</label>
          <input class="input" id="nueva-bodega" placeholder="Nombre de la nueva bodega" autocomplete="off">
          <button class="btn" type="button" id="add-bodega">Agregar</button>
        </div>
      </section>

      <section class="card stack-sm">
        <h2>Exportar a Excel</h2>
        <p class="small muted">Descarga archivos .csv que se abren en Excel o Google Sheets.</p>
        <div class="grid-2">
          <button class="btn" type="button" data-exp="inventario">${icon('download', 'ic-sm')}Inventario</button>
          <button class="btn" type="button" data-exp="cataciones">${icon('download', 'ic-sm')}Cataciones</button>
          <button class="btn" type="button" data-exp="trilla">${icon('download', 'ic-sm')}Trilla</button>
          <button class="btn" type="button" data-exp="ventas">${icon('download', 'ic-sm')}Ventas</button>
        </div>
      </section>

      <section class="card stack-sm">
        <h2>Respaldo</h2>
        <p class="note">Por ahora la información se guarda <strong>solo en este celular</strong>. Si borras los datos del navegador o cambias de celular, se pierde. Descarga un respaldo de vez en cuando.</p>
        <button class="btn" type="button" id="respaldo">${icon('download', 'ic-sm')}Descargar respaldo</button>
        <label class="btn" for="restaurar" style="cursor:pointer">${icon('upload', 'ic-sm')}Restaurar un respaldo</label>
        <input type="file" id="restaurar" accept=".json,application/json" class="sr">
      </section>

      <section class="card stack-sm">
        <h2>Datos</h2>
        <button class="btn" type="button" id="demo">Cargar datos de ejemplo</button>
        <button class="btn btn-danger" type="button" id="borrar">${icon('trash', 'ic-sm')}Borrar toda la información</button>
      </section>

      <p class="small muted center">DataCafe|Laboratorio · versión ${esc(VERSION)} (prototipo)<br>Hecho por Sancocho Glorioso</p>
    </div>`;

  const $ = (s) => root.querySelector(s);

  bindSeg(root, 'tema', (val) => { guardar('dc-tema', val); aplicarTema(val); });
  bindSeg(root, 'escala', (val) => { guardar('dc-escala', val); document.documentElement.style.setProperty('--scale', val); });

  function pintarBodegas() {
    $('#bodegas').innerHTML = data.bodegas.map((b) => {
      const n = data.cafes.filter((c) => c.bodegaId === b.id).length;
      return `<div class="row plain" style="align-items:center">
        <span>${esc(b.nombre)} <span class="small muted">· ${n} ${n === 1 ? 'café' : 'cafés'}</span></span>
        <span style="display:flex;gap:.25rem">
          <button class="icon-btn" type="button" data-ren="${esc(b.id)}" aria-label="Cambiar nombre de ${esc(b.nombre)}">${icon('edit', 'ic-sm')}</button>
          ${n === 0 && data.bodegas.length > 1 ? `<button class="icon-btn" type="button" data-delb="${esc(b.id)}" aria-label="Borrar ${esc(b.nombre)}">${icon('trash', 'ic-sm')}</button>` : ''}
        </span></div>`;
    }).join('');
  }
  $('#bodegas').addEventListener('click', async (e) => {
    const r = e.target.closest('[data-ren]');
    if (r) {
      const b = data.bodegas.find((x) => x.id === r.dataset.ren);
      const nombre = prompt('Nuevo nombre de la bodega', b.nombre);
      if (nombre && nombre.trim()) { await put('bodegas', { ...b, nombre: nombre.trim() }); pintarBodegas(); }
      return;
    }
    const d = e.target.closest('[data-delb]');
    if (d && confirm('¿Borrar esta bodega?')) { await del('bodegas', d.dataset.delb); pintarBodegas(); }
  });
  $('#add-bodega').addEventListener('click', async () => {
    const nombre = $('#nueva-bodega').value.trim();
    if (!nombre) return;
    await put('bodegas', { id: uid('b'), nombre });
    $('#nueva-bodega').value = '';
    pintarBodegas();
    toast(`Bodega "${nombre}" agregada`);
  });

  root.querySelectorAll('[data-exp]').forEach((b) => b.addEventListener('click', () => exportar(b.dataset.exp)));

  $('#respaldo').addEventListener('click', () => {
    download(`datacafe-respaldo-${hoyISO()}.json`, JSON.stringify(exportAll(), null, 2), 'application/json');
  });
  $('#restaurar').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const obj = JSON.parse(await file.text());
      if (!obj || !Array.isArray(obj.cafes)) throw new Error('El archivo no parece un respaldo de DataCafe.');
      if (!confirm('Esto reemplaza toda la información de este celular por la del respaldo. ¿Continuar?')) return;
      await importAll(obj);
      toast('Respaldo restaurado');
      render(root);
    } catch (er) { toast('No se pudo restaurar: ' + er.message); }
  });

  $('#demo').addEventListener('click', async () => {
    if (data.cafes.length && !confirm('Esto reemplaza la información actual por datos de ejemplo. ¿Continuar?')) return;
    await cargarEjemplo();
    toast('Datos de ejemplo cargados');
    render(root);
  });
  $('#borrar').addEventListener('click', async () => {
    if (!confirm('¿Borrar TODA la información de este celular? No se puede deshacer.')) return;
    if (!confirm('¿Seguro? Te recomendamos descargar un respaldo antes.')) return;
    await clearAll();
    await put('bodegas', { id: uid('b'), nombre: 'Bodega principal' });
    toast('Información borrada');
    render(root);
  });

  pintarBodegas();
}

function exportar(cual) {
  const f = hoyISO();
  if (cual === 'inventario') {
    const h = ['Código', 'Fecha de registro', 'Productor', 'Apellido', 'Cédula', 'Autorización datos', 'Finca', 'Departamento', 'Municipio', 'Vereda', 'Nombre del producto',
      'Variedad', 'Proceso', 'Tipo de fermentación', 'Tiempo de fermentación', 'Tipo de secado', 'Tiempo de secado', 'Humedad (%)',
      'Peso malla 15', 'Pasilla malla 15', 'Peso malla 14', 'Pasilla malla 14', 'Peso malla 0', 'Gramos de análisis', 'Factor UGQ', 'Factor EP',
      'Precio kg', 'Precio carga', 'Kg totales pergamino', 'Kg disponibles', 'Bodega', 'Puntaje', 'Perfil', 'Comentarios'];
    const rows = data.cafes.map(cafeInfo).map((i) => {
      const c = i.cafe, p = i.productor || {};
      return [c.id, c.fechaRegistro, p.nombre, p.apellido, p.cedula, p.autorizacion ? 'Sí' : 'No', c.finca, c.departamento, c.municipio, c.vereda, nombreProducto(c),
        (c.variedades || []).join(', '), c.proceso, c.tipoFermentacion, c.tiempoFermentacion, c.tipoSecado, c.tiempoSecado, num(c.humedad) || '',
        num(c.m15), num(c.p15), num(c.m14), num(c.p14), num(c.m0), num(c.gramos), i.factorUGQ, i.factorEP,
        num(c.precioKg), precioCarga(c.precioKg), num(c.kgTotales), i.disponible, i.bodega, i.puntaje, i.perfilTexto, c.comentarios];
    });
    download(`datacafe-inventario-${f}.csv`, toCSV(h, rows), 'text/csv');
  }
  if (cual === 'cataciones') {
    const h = ['Tipo', 'Código o lote', 'Café', 'Fecha', 'Mesa', 'Catador', ...ATRIBUTOS.map((a) => a[1]), ...TAZAS.map((t) => t[1]), 'Defectos', 'Descriptores', 'Comentarios', 'Puntaje final'];
    const rows = data.cataciones.map((k) => [k.tipo === 'lote' ? 'Lote' : 'Pergamino', k.ref, nombreReferencia(k.tipo === 'lote' ? 'Excelso' : 'Pergamino', k.ref), k.fecha, k.mesa, k.catador,
      ...ATRIBUTOS.map(([a]) => num((k.atributos || {})[a])), ...TAZAS.map(([t]) => num(k[t])), num(k.defectos), (k.descriptores || []).join(', '), k.comentarios, puntajeCatacion(k)]);
    download(`datacafe-cataciones-${f}.csv`, toCSV(h, rows), 'text/csv');
  }
  if (cual === 'trilla') {
    const h = ['Lote', 'Nombre', 'Fecha de trilla', 'Preparación', 'Código café', 'Café', 'Kg pergamino', 'Factor', 'Proyección excelso',
      'Kg pergamino lote', 'Excelso proyectado lote', 'Factor lote', 'Corte', 'Muestra (g)', 'Defectos 1er grupo', 'Defectos 2do grupo', 'Quakers', 'Kg excelso', 'Kg pasilla', 'Factor real',
      'Kg excelso disponibles', 'Kg pasilla disponibles', 'Puntaje', 'Perfil'];
    const rows = [];
    for (const l of data.lotes.map(loteInfo)) {
      for (const it of l.items) {
        rows.push([l.lote.id, l.lote.nombre, l.lote.fecha, l.lote.preparacion, it.cafeId, it.cafe ? nombreProducto(it.cafe) : '', num(it.kg), it.factor, it.proyeccion,
          l.kgPergamino, l.proyeccion, l.factorLote, l.lote.corte, num(l.lote.muestraG) || '', num(l.lote.def1) || '', num(l.lote.def2) || '', num(l.lote.quakers) || '',
          num(l.lote.kgExcelso) || '', num(l.lote.kgPasilla) || '', l.factorReal, l.excelsoDisp, l.pasillaDisp, l.puntaje, l.perfilTexto]);
      }
    }
    download(`datacafe-trilla-${f}.csv`, toCSV(h, rows), 'text/csv');
  }
  if (cual === 'ventas') {
    const h = ['Fecha', 'Tipo de producto', 'Referencia', 'Nombre del producto', 'Cliente', 'Kg vendidos', 'Precio kg', 'Valor total', 'Comentarios'];
    const rows = data.ventas.map((v) => [v.fecha, v.tipo, v.ref, nombreReferencia(v.tipo, v.ref), v.cliente, num(v.kg), num(v.precioKg), num(v.kg) * num(v.precioKg), v.comentarios]);
    download(`datacafe-ventas-${f}.csv`, toCSV(h, rows), 'text/csv');
  }
  toast('Archivo descargado');
}
