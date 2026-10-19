// Vistas derivadas de los datos guardados (lo que la app calcula sola).
import { data, byId } from './db.js';
import {
  num, nombreProducto, disponibleCafe, resumenLote, disponibleLote, promedioPuntaje, perfilTexto, perfil, factor, promedioPonderado,
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
    pasillaDisp: disponibleLote(lote, data.ventas, 'Pasilla'),
    puntaje: promedioPuntaje(cats),
    perfil: perfil(cats),
    perfilTexto: perfilTexto(cats),
    cataciones: cats,
  };
}

export function lotesOrdenados() {
  return [...data.lotes].sort((a, b) => (a.id < b.id ? 1 : -1));
}

/** Datos del tablero de Inicio. */
export function tablero() {
  const cafes = data.cafes.map(cafeInfo);
  const conKg = cafes.filter((c) => c.disponible > 0.001);
  const pergamino = conKg.reduce((s, c) => s + c.disponible, 0);

  const lotes = data.lotes.map(loteInfo);
  const excelso = lotes.reduce((s, l) => s + Math.max(0, l.excelsoDisp), 0);
  const pasilla = lotes.reduce((s, l) => s + Math.max(0, l.pasillaDisp), 0);

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
    nLotesPasilla: lotes.filter((l) => l.pasillaDisp > 0.001).length,
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
  return lotesOrdenados().map(loteInfo)
    .map((l) => ({ id: l.lote.id, titulo: l.nombre, sub: `${l.lote.preparacion}${l.puntaje ? ' · ' + l.puntaje.toFixed(2).replace('.', ',') + ' puntos' : ''}`, disp: tipo === 'Pasilla' ? l.pasillaDisp : l.excelsoDisp, precio: 0 }))
    .filter((f) => f.disp > 0.001);
}

export function nombreReferencia(tipo, ref) {
  if (tipo === 'Pergamino') {
    const c = data.cafes.find((x) => x.id === ref);
    return c ? `${c.id} · ${nombreProducto(c)}` : ref;
  }
  const l = data.lotes.find((x) => x.id === ref);
  return l && l.nombre ? `${l.id} · ${l.nombre}` : ref;
}
