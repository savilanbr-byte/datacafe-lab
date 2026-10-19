// Cálculos de DataCafe|Laboratorio.
// Funciones puras (sin acceso a la pantalla ni a la base de datos) para poder probarlas con `node --test`.

/** Convierte texto del usuario ("10,8", "1.200", "") a número. Vacío o inválido = 0. */
export function num(x) {
  if (x === null || x === undefined || x === '') return 0;
  if (typeof x === 'number') return Number.isFinite(x) ? x : 0;
  let s = String(x).trim().replace(/\s/g, '');
  // "1.200,5" -> 1200.5 ; "1200,5" -> 1200.5 ; "1200.5" -> 1200.5
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

// ---------- Análisis físico y factor de rendimiento ----------

/** Gramos de excelso en la muestra según la preparación. */
export function excelsoGramos(c, prep = 'UGQ') {
  const m15 = num(c.m15), p15 = num(c.p15), m14 = num(c.m14), p14 = num(c.p14);
  if (prep === 'EP') return m15 - p15; // POR CONFIRMAR: solo lo retenido en malla 15
  return m15 + m14 - p15 - p14;        // UGQ: mallas 15 y 14 sin pasillas
}

/** Factor de rendimiento = 70 / (gramos de excelso / gramos de análisis). Null si faltan datos. */
export function factor(c, prep = 'UGQ') {
  const g = num(c.gramos);
  const ex = excelsoGramos(c, prep);
  if (!(g > 0) || !(ex > 0)) return null;
  return 70 / (ex / g);
}

/** Kg de excelso esperados a partir de kg de pergamino y un factor. */
export function proyeccionExcelso(kgPergamino, f) {
  return f ? (num(kgPergamino) * 70) / f : 0;
}

export const precioCarga = (precioKg) => num(precioKg) * 125;

// ---------- Catación (formato SCA clásico) ----------

export const ATRIBUTOS = [
  ['aroma', 'Aroma'], ['sabor', 'Sabor'], ['residual', 'Residual'], ['acidez', 'Acidez'],
  ['balance', 'Balance'], ['cuerpo', 'Cuerpo'], ['general', 'General'],
];
export const TAZAS = [['uniformidad', 'Uniformidad'], ['tazaLimpia', 'Taza limpia'], ['dulzura', 'Dulzura']];

/** Puntaje final = suma de los 7 atributos + 2 × (uniformidad + taza limpia + dulzura) − defectos. */
export function puntajeCatacion(c) {
  const a = c.atributos || {};
  const suma = ATRIBUTOS.reduce((s, [k]) => s + num(a[k]), 0);
  const tazas = TAZAS.reduce((s, [k]) => s + num(c[k]), 0);
  return suma + 2 * tazas - num(c.defectos);
}

export function clasificacion(p) {
  if (p >= 90) return 'Excepcional';
  if (p >= 85) return 'Excelente';
  if (p >= 80) return 'Muy bueno';
  return 'Por debajo de especialidad';
}

/** Promedio de los puntajes de varias cataciones (null si no hay). */
export function promedioPuntaje(cataciones) {
  if (!cataciones || !cataciones.length) return null;
  return cataciones.reduce((s, c) => s + puntajeCatacion(c), 0) / cataciones.length;
}

/** Descriptores de varias cataciones contados; los repetidos se marcan "(xN)". Orden: más repetidos primero. */
export function perfil(cataciones) {
  const map = new Map();
  let orden = 0;
  for (const c of cataciones || []) {
    for (const raw of c.descriptores || []) {
      const label = String(raw).trim();
      if (!label) continue;
      const key = label.toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (!map.has(key)) map.set(key, { label, count: 0, orden: orden++ });
      map.get(key).count++;
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.orden - b.orden);
}

export function perfilTexto(cataciones) {
  return perfil(cataciones).map((d) => (d.count > 1 ? `${d.label} (x${d.count})` : d.label)).join(', ');
}

// ---------- Inventario, trilla y ventas ----------

export function nombreProducto(cafe) {
  const variedades = (cafe.variedades || []).join(', ');
  return [cafe.finca || '[finca]', variedades || '[variedad]', cafe.proceso || '[proceso]'].join(' - ');
}

/** Kg de pergamino disponibles de un café = totales − enviados a trilla − pergamino vendido. */
export function disponibleCafe(cafe, lotes, ventas, excluirLoteId = null) {
  const enTrilla = (lotes || [])
    .filter((l) => l.id !== excluirLoteId)
    .reduce((s, l) => s + (l.items || []).filter((i) => i.cafeId === cafe.id).reduce((a, i) => a + num(i.kg), 0), 0);
  const vendido = (ventas || [])
    .filter((v) => v.tipo === 'Pergamino' && v.ref === cafe.id)
    .reduce((s, v) => s + num(v.kg), 0);
  return num(cafe.kgTotales) - enTrilla - vendido;
}

/** Resumen de un lote de trilla: kg, proyección, factor del lote (ponderado) y factor real. */
export function resumenLote(lote, cafesById) {
  const prep = lote.preparacion || 'UGQ';
  let kg = 0, proy = 0;
  const items = (lote.items || []).map((i) => {
    const cafe = cafesById[i.cafeId];
    const f = cafe ? factor(cafe, prep) : null;
    const k = num(i.kg);
    const p = proyeccionExcelso(k, f);
    kg += k; proy += p;
    return { ...i, cafe, factor: f, proyeccion: p };
  });
  const kgExcelso = num(lote.kgExcelso);
  return {
    items,
    kgPergamino: kg,
    proyeccion: proy,
    factorLote: proy > 0 ? (kg * 70) / proy : null,
    factorReal: kgExcelso > 0 && kg > 0 ? (kg * 70) / kgExcelso : null,
    diferencia: kgExcelso > 0 ? kgExcelso - proy : null,
    trillado: kgExcelso > 0,
  };
}

/** Kg de excelso o pasilla disponibles de un lote = producidos − vendidos. */
export function disponibleLote(lote, ventas, tipo /* 'Excelso' | 'Pasilla' */) {
  const producido = tipo === 'Pasilla' ? num(lote.kgPasilla) : num(lote.kgExcelso);
  const vendido = (ventas || []).filter((v) => v.tipo === tipo && v.ref === lote.id).reduce((s, v) => s + num(v.kg), 0);
  return producido - vendido;
}

/** Promedio ponderado: sum(valor × peso) / sum(peso). */
export function promedioPonderado(pares) {
  let s = 0, w = 0;
  for (const [v, p] of pares) { if (num(p) > 0 && num(v) > 0) { s += num(v) * num(p); w += num(p); } }
  return w > 0 ? s / w : null;
}

// ---------- Formato colombiano ----------

export function fmtNum(n, dec = 0) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  const neg = n < 0;
  const [ent, frac] = Math.abs(n).toFixed(dec).split('.');
  const miles = ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '−' : '') + miles + (frac ? ',' + frac : '');
}
export const fmtKg = (n) => fmtNum(n, Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2);
export const fmtCOP = (n) => (n === null || n === undefined ? '—' : '$' + fmtNum(n, 0));
export const fmt2 = (n) => fmtNum(n, 2);

export function fmtFecha(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function hoyISO(offsetDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
