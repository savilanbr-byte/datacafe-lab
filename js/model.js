// Vistas derivadas de los datos guardados (lo que la app calcula sola).
import { data, byId } from './db.js';
import {
  num, nombreProducto, disponibleCafe, resumenLote, disponibleLote, disponiblePasilla, PASILLA_REF, promedioPuntaje, perfilTexto, perfil, factor, promedioPonderado,
} from './calc.js';

export function productorDe(cafe) {
  return data.productores.find((p) => p.id === cafe.productorId) || null;
}

export function nombreProductor(p) {
  return p ? [p.nombre, p.apellido].filter(Boolean).join(' ') : '';
}

export function bodegaNombre(id) {
  const b = data.bodegas.find((x) => x.id === id);
  return b ? b.nombre : 'Sin bodega';
}

export function catacionesDe(tipo, ref) {
  return data.cataciones.filter((c) => c.tipo === tipo && c.ref === ref).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export function cafeInfo(cafe) {
  const cats = catacionesDe('pergamino', cafe.id);
  return {
    cafe,
    nombre: nombreProducto(cafe),
    productor: productorDe(cafe),
    disponible: disponibleCafe(cafe, data.lotes, data.ventas),
    puntaje: promedioPuntaje(cats),
    perfil: perfil(cats),
    perfilTexto: perfilTexto(cats),
    cataciones: cats,
    factorUGQ: factor(cafe, 'UGQ'),
    factorEP: factor(cafe, 'EP'),
    bodega: bodegaNombre(cafe.bodegaId),
  };
}

export function cafesOrdenados() {
  return [...data.cafes].sort((a, b) => (a.id < b.id ? 1 : -1));
}

export function loteInfo(lote) {
  const cats = catacionesDe('lote', lote.id);
  const r = resumenLote(lote, byId('cafes'));
  return {
    lote, ...r,
    nombre: lote.nombre ? `${lote.id} · ${lote.nombre}` : lote.id,
    excelsoDisp: disponibleLote(lote, data.ventas, 'Excelso'),
    puntaje: promedioPuntaje(cats),
    perfil: perfil(cats),
    perfilTexto: perfilTexto(cats),
    cataciones: cats,
  };
}

export function lotesOrdenados() {
  return [...data.lotes].sort((a, b) => (a.id < b.id ? 1 : -1));
}

// ---------- Pendientes ----------
// Solo cuentan los cafés que todavía tienen kilos en bodega.
export const LISTAS_PENDIENTES = [
  { id: 'analisis', titulo: 'Análisis físico', falta: 'Sin análisis físico', accion: 'Agregar análisis', icono: 'funnel',
    pendiente: (c) => c.factorUGQ === null, href: (c) => `#/registrar?id=${encodeURIComponent(c.cafe.id)}&paso=3` },
  { id: 'catacion', titulo: 'Catación', falta: 'Sin catar', accion: 'Catar', icono: 'cup-plain',
    pendiente: (c) => c.cataciones.length === 0, href: (c) => `#/catacion?tipo=pergamino&ref=${encodeURIComponent(c.cafe.id)}` },
  { id: 'precio', titulo: 'Precio', falta: 'Sin precio', accion: 'Poner precio', icono: 'cart',
    pendiente: (c) => !(num(c.cafe.precioKg) > 0), href: (c) => `#/registrar?id=${encodeURIComponent(c.cafe.id)}&paso=4` },
  { id: 'autorizacion', titulo: 'Autorización', falta: 'Sin autorización de datos', accion: 'Registrar autorización', icono: 'edit',
    pendiente: (c) => !(c.productor && c.productor.autorizacion), href: (c) => `#/registrar?id=${encodeURIComponent(c.cafe.id)}&paso=4` },
];

export function pendientes() {
  const activos = cafesOrdenados().map(cafeInfo).filter((c) => c.disponible > 0.001);
  return LISTAS_PENDIENTES.map((l) => ({ ...l, cafes: activos.filter(l.pendiente) }));
}

export function pendientesDe(info) {
  return LISTAS_PENDIENTES.filter((l) => l.pendiente(info));
}

/** Datos del tablero de Inicio. */
export function tablero() {
  const cafes = data.cafes.map(cafeInfo);
  const conKg = cafes.filter((c) => c.disponible > 0.001);
  const pergamino = conKg.reduce((s, c) => s + c.disponible, 0);

  const lotes = data.lotes.map(loteInfo);
  const excelso = lotes.reduce((s, l) => s + Math.max(0, l.excelsoDisp), 0);
  const pasilla = Math.max(0, disponiblePasilla(data.lotes, data.ventas));

  const bodegas = data.bodegas.map((b) => ({
    nombre: b.nombre,
    kg: conKg.filter((c) => c.cafe.bodegaId === b.id).reduce((s, c) => s + c.disponible, 0),
  }));
  const sinBodega = conKg.filter((c) => !data.bodegas.some((b) => b.id === c.cafe.bodegaId)).reduce((s, c) => s + c.disponible, 0);
  if (sinBodega > 0) bodegas.push({ nombre: 'Sin bodega', kg: sinBodega });

  // Si un café tiene varias variedades, sus kilos se reparten en partes iguales.
  const vmap = new Map();
  for (const c of conKg) {
    const vs = c.cafe.variedades && c.cafe.variedades.length ? c.cafe.variedades : ['Sin variedad'];
    for (const v of vs) vmap.set(v, (vmap.get(v) || 0) + c.disponible / vs.length);
  }
  let variedades = [...vmap.entries()].map(([nombre, kg]) => ({ nombre, kg })).sort((a, b) => b.kg - a.kg);
  if (variedades.length > 5) {
    const otras = variedades.slice(4).reduce((s, v) => s + v.kg, 0);
    variedades = [...variedades.slice(0, 4), { nombre: 'Otras', kg: otras }];
  }

  const compra = promedioPonderado(data.cafes.map((c) => [c.precioKg, c.kgTotales]));
  const ventaPor = (tipo) => promedioPonderado(data.ventas.filter((v) => v.tipo === tipo).map((v) => [v.precioKg, v.kg]));

  return {
    pergamino, nCafes: conKg.length, excelso, pasilla,
    nLotesExcelso: lotes.filter((l) => l.excelsoDisp > 0.001).length,
    nLotesPasilla: data.lotes.filter((l) => num(l.kgPasilla) > 0).length,
    bodegas, variedades,
    precios: { compra, carga: compra ? compra * 125 : null, excelso: ventaPor('Excelso'), pasilla: ventaPor('Pasilla'), pergamino: ventaPor('Pergamino') },
    vacio: data.cafes.length === 0,
  };
}

/** Opciones de origen para una venta según el tipo de producto. */
export function fuentesVenta(tipo) {
  if (tipo === 'Pergamino') {
    return cafesOrdenados().map(cafeInfo).filter((c) => c.disponible > 0.001)
      .map((c) => ({ id: c.cafe.id, titulo: `${c.cafe.id} · ${c.cafe.finca}`, sub: nombreProducto(c.cafe), disp: c.disponible, precio: num(c.cafe.precioKg) }));
  }
  if (tipo === 'Pasilla') {
    const disp = disponiblePasilla(data.lotes, data.ventas);
    return disp > 0.001 ? [{ id: PASILLA_REF, titulo: 'Inventario general de pasilla', sub: 'Mezcla de la pasilla de todas las trillas', disp, precio: 0 }] : [];
  }
  return lotesOrdenados().map(loteInfo)
    .map((l) => ({ id: l.lote.id, titulo: l.nombre, sub: `${l.lote.preparacion}${l.puntaje ? ' · ' + l.puntaje.toFixed(2).replace('.', ',') + ' puntos' : ''}`, disp: l.excelsoDisp, precio: 0 }))
    .filter((f) => f.disp > 0.001);
}

export function nombreReferencia(tipo, ref) {
  if (tipo === 'Pasilla') return 'Pasilla general';
  if (tipo === 'Pergamino') {
    const c = data.cafes.find((x) => x.id === ref);
    return c ? `${c.id} · ${nombreProducto(c)}` : ref;
  }
  const l = data.lotes.find((x) => x.id === ref);
  return l && l.nombre ? `${l.id} · ${l.nombre}` : ref;
}
