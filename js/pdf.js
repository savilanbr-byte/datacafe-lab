// Reportes en PDF de un café o de un lote. Se generan en el mismo equipo (funciona sin internet)
// con la librería pdf-lib (licencia MIT, en js/vendor/), que se carga solo cuando se pide un reporte.
import { data } from './db.js';
import { cafeInfo, loteInfo, nombreProductor } from './model.js';
import {
  ATRIBUTOS, TAZAS, num, fmtKg, fmt2, fmtCOP, fmtFecha, hoyISO, precioCarga, puntajeCatacion, clasificacion, nombreProducto,
} from './calc.js';

const C = {
  verde: [0.184, 0.365, 0.227], terracota: [0.71, 0.337, 0.184], tinta: [0.169, 0.129, 0.094],
  gris: [0.42, 0.357, 0.294], linea: [0.886, 0.839, 0.765], crema: [0.957, 0.929, 0.882], blanco: [1, 1, 1],
  verdeSuave: [0.894, 0.922, 0.867],
};

// Las fuentes estándar del PDF solo traen caracteres latinos; se reemplaza lo demás.
function limpio(s) {
  return String(s ?? '')
    .replace(/[−‐‑]/g, '-').replace(/[  ]/g, ' ')
    .replace(/[^ -~¡-ÿ–—‘’“”•…€]/g, '');
}

class Reporte {
  constructor(lib, pdf, fuentes, titulo) {
    Object.assign(this, { lib, pdf, f: fuentes, titulo });
    this.W = 595.28; this.H = 841.89; this.M = 42; // A4, márgenes
    this.paginas = [];
    this.nuevaPagina(true);
  }

  color(c) { return this.lib.rgb(c[0], c[1], c[2]); }

  nuevaPagina(primera = false) {
    this.page = this.pdf.addPage([this.W, this.H]);
    this.paginas.push(this.page);
    if (primera) {
      this.page.drawRectangle({ x: 0, y: this.H - 78, width: this.W, height: 78, color: this.color(C.verde) });
      this.texto('DataCafe', this.M, this.H - 44, { font: this.f.serifB, size: 20, color: C.crema });
      const w = this.f.serifB.widthOfTextAtSize('DataCafe', 20);
      this.texto('|', this.M + w + 4, this.H - 44, { font: this.f.serif, size: 20, color: [0.88, 0.54, 0.38] });
      this.texto('Laboratorio', this.M + w + 14, this.H - 44, { font: this.f.serifI, size: 20, color: C.crema });
      this.texto(this.titulo, this.W - this.M, this.H - 40, { font: this.f.sansB, size: 11, color: C.crema, align: 'right' });
      this.texto(`Generado el ${fmtFecha(hoyISO())}`, this.W - this.M, this.H - 56, { size: 9, color: C.crema, align: 'right' });
      this.y = this.H - 108;
    } else {
      this.texto(this.titulo, this.M, this.H - 30, { font: this.f.sansB, size: 9, color: C.gris });
      this.page.drawLine({ start: { x: this.M, y: this.H - 38 }, end: { x: this.W - this.M, y: this.H - 38 }, thickness: 0.6, color: this.color(C.linea) });
      this.y = this.H - 60;
    }
  }

  espacio(h) { if (this.y - h < 56) this.nuevaPagina(); }

  texto(s, x, y, { font = this.f.sans, size = 10, color = C.tinta, align = 'left' } = {}) {
    const t = limpio(s);
    const w = font.widthOfTextAtSize(t, size);
    const xx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    this.page.drawText(t, { x: xx, y, size, font, color: this.color(color) });
    return w;
  }

  partir(s, font, size, ancho) {
    const palabras = limpio(s).split(/\s+/).filter(Boolean);
    const lineas = []; let actual = '';
    for (const p of palabras) {
      const prueba = actual ? actual + ' ' + p : p;
      if (font.widthOfTextAtSize(prueba, size) <= ancho || !actual) actual = prueba;
      else { lineas.push(actual); actual = p; }
    }
    if (actual) lineas.push(actual);
    return lineas.length ? lineas : [''];
  }

  parrafo(s, { font = this.f.sans, size = 10, color = C.tinta, ancho = this.W - 2 * this.M, x = this.M, interlinea = 1.35 } = {}) {
    for (const l of this.partir(s, font, size, ancho)) {
      this.espacio(size * interlinea);
      this.texto(l, x, this.y - size, { font, size, color });
      this.y -= size * interlinea;
    }
  }

  tituloPrincipal(nombre, sub) {
    this.parrafo(nombre, { font: this.f.serifB, size: 20, interlinea: 1.2 });
    this.y -= 2;
    if (sub) this.parrafo(sub, { size: 10, color: C.gris });
    this.y -= 12;
  }

  seccion(t) {
    this.espacio(90); // que el título no quede solo al final de la página
    this.y -= 8;
    this.texto(t, this.M, this.y - 13, { font: this.f.serifB, size: 13 });
    this.y -= 20;
    this.page.drawLine({ start: { x: this.M, y: this.y }, end: { x: this.W - this.M, y: this.y }, thickness: 0.8, color: this.color(C.terracota) });
    this.y -= 8;
  }

  /** Cajas de indicadores en una fila. */
  indicadores(items) {
    const h = 52, gap = 8;
    this.espacio(h + 8);
    const ancho = (this.W - 2 * this.M - gap * (items.length - 1)) / items.length;
    items.forEach(([label, valor, destacado], i) => {
      const x = this.M + i * (ancho + gap);
      this.page.drawRectangle({
        x, y: this.y - h, width: ancho, height: h,
        color: this.color(destacado ? C.verde : C.crema), borderColor: this.color(destacado ? C.verde : C.linea), borderWidth: 0.6,
      });
      const col = destacado ? C.crema : C.gris;
      this.texto(label, x + 9, this.y - 16, { size: 8.5, color: col });
      const v = this.partir(valor, this.f.serifB, 15, ancho - 18)[0];
      this.texto(v, x + 9, this.y - 38, { font: this.f.serifB, size: 15, color: destacado ? C.blanco : C.tinta });
    });
    this.y -= h + 10;
  }

  /** Filas etiqueta / valor en dos columnas. */
  datos(pares) {
    const col = (this.W - 2 * this.M - 20) / 2;
    const filas = [];
    for (let i = 0; i < pares.length; i += 2) filas.push(pares.slice(i, i + 2));
    for (const fila of filas) {
      const alto = Math.max(...fila.map(([, v]) => this.partir(v || '—', this.f.sans, 10, col).length)) * 13 + 16;
      this.espacio(alto);
      fila.forEach(([k, v], j) => {
        const x = this.M + j * (col + 20);
        this.texto(k, x, this.y - 10, { size: 8.5, color: C.gris });
        this.partir(v || '—', this.f.sans, 10, col).forEach((l, n) => this.texto(l, x, this.y - 23 - n * 13, { size: 10 }));
      });
      this.y -= alto;
    }
    this.y -= 4;
  }

  /** Tabla con encabezado. cols: [{t, w (fracción), align}] */
  tabla(cols, filas, { total } = {}) {
    const anchoT = this.W - 2 * this.M;
    const ws = cols.map((c) => c.w * anchoT);
    const fila = (celdas, { head = false, zebra = false, bold = false } = {}) => {
      const lineas = celdas.map((c, i) => this.partir(c ?? '', head || bold ? this.f.sansB : this.f.sans, head ? 8 : 9, ws[i] - 8));
      const h = Math.max(...lineas.map((l) => l.length)) * 11 + 8;
      if (head) this.espacio(h + 30); // encabezado junto con al menos una fila
      else if (this.y - h < 56) { this.nuevaPagina(); fila(cols.map((c) => c.t), { head: true }); } // repite el encabezado
      if (head || zebra) this.page.drawRectangle({ x: this.M, y: this.y - h, width: anchoT, height: h, color: this.color(head ? C.verdeSuave : C.crema) });
      let x = this.M;
      lineas.forEach((ls, i) => {
        ls.forEach((l, n) => {
          const a = cols[i].align || 'left';
          const xx = a === 'right' ? x + ws[i] - 4 : x + 4;
          this.texto(l, xx, this.y - 12 - n * 11, { size: head ? 8 : 9, font: head || bold ? this.f.sansB : this.f.sans, color: head ? C.verde : C.tinta, align: a });
        });
        x += ws[i];
      });
      this.y -= h;
    };
    fila(cols.map((c) => c.t), { head: true });
    filas.forEach((f, i) => fila(f, { zebra: i % 2 === 1 }));
    if (total) fila(total, { bold: true });
    this.page.drawLine({ start: { x: this.M, y: this.y }, end: { x: this.W - this.M, y: this.y }, thickness: 0.6, color: this.color(C.linea) });
    this.y -= 10;
  }

  chips(textos) {
    let x = this.M; const h = 18;
    this.espacio(h + 6);
    for (const t of textos) {
      const w = this.f.sans.widthOfTextAtSize(limpio(t), 9) + 16;
      if (x + w > this.W - this.M) { x = this.M; this.y -= h + 6; this.espacio(h + 6); }
      this.page.drawRectangle({ x, y: this.y - h, width: w, height: h, color: this.color(t.includes('(x') ? C.terracota : C.crema), borderColor: this.color(C.linea), borderWidth: 0.5 });
      this.texto(t, x + 8, this.y - 12.5, { size: 9, color: t.includes('(x') ? C.blanco : C.tinta });
      x += w + 6;
    }
    this.y -= h + 10;
  }

  nota(s) { this.parrafo(s, { size: 8.5, color: C.gris }); this.y -= 4; }

  async terminar() {
    const n = this.paginas.length;
    this.paginas.forEach((p, i) => {
      this.page = p;
      this.texto(`DataCafe|Laboratorio · Prototipo de Sancocho Glorioso`, this.M, 26, { size: 8, color: C.gris });
      this.texto(`Página ${i + 1} de ${n}`, this.W - this.M, 26, { size: 8, color: C.gris, align: 'right' });
    });
    return this.pdf.save();
  }
}

async function crear(titulo, meta) {
  const lib = await import('./vendor/pdf-lib.esm.min.js');
  const pdf = await lib.PDFDocument.create();
  pdf.setTitle(limpio(meta.title)); pdf.setAuthor('DataCafe|Laboratorio'); pdf.setCreator('DataCafe|Laboratorio');
  pdf.setLanguage('es-CO');
  const F = lib.StandardFonts;
  const fuentes = {
    sans: await pdf.embedFont(F.Helvetica), sansB: await pdf.embedFont(F.HelveticaBold),
    serif: await pdf.embedFont(F.TimesRoman), serifB: await pdf.embedFont(F.TimesRomanBold), serifI: await pdf.embedFont(F.TimesRomanItalic),
  };
  return new Reporte(lib, pdf, fuentes, titulo);
}

function tablaCataciones(r, cats) {
  const abrev = { aroma: 'Aro', sabor: 'Sab', residual: 'Res', acidez: 'Aci', balance: 'Bal', cuerpo: 'Cue', general: 'Gen' };
  r.tabla(
    [{ t: 'Fecha', w: 0.12 }, { t: 'Mesa', w: 0.06 }, { t: 'Catador', w: 0.14 },
      ...ATRIBUTOS.map(([k]) => ({ t: abrev[k], w: 0.055, align: 'right' })),
      { t: 'Tazas U/TL/D', w: 0.12, align: 'right' }, { t: 'Def.', w: 0.05, align: 'right' }, { t: 'Puntaje', w: 0.125, align: 'right' }],
    cats.map((k) => [fmtFecha(k.fecha), k.mesa || '1', k.catador || '—',
      ...ATRIBUTOS.map(([a]) => fmt2(num((k.atributos || {})[a]))),
      TAZAS.map(([t]) => num(k[t])).join(' / '), fmt2(num(k.defectos)), fmt2(puntajeCatacion(k))]),
  );
}

function nombreArchivo(base) {
  return limpio(base).replace(/ · /g, ' - ').replace(/[\\/:*?"<>|·]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) + '.pdf';
}

// ---------- Reporte de un café ----------
export async function reporteCafe(id, { internos = false } = {}) {
  const cafe = data.cafes.find((c) => c.id === id);
  const c = cafeInfo(cafe);
  const total = num(cafe.kgTotales);
  const r = await crear('Reporte de café', { title: `${cafe.id} · ${c.nombre}` });
  const origen = [cafe.vereda && `Vereda ${cafe.vereda}`, cafe.municipio, cafe.departamento].filter(Boolean).join(', ');
  r.tituloPrincipal(c.nombre, [cafe.id, nombreProductor(c.productor), origen].filter(Boolean).join(' · '));

  r.indicadores([
    ['Disponible', `${fmtKg(c.disponible)} kg`, true],
    ['Kg originales', `${fmtKg(total)} kg`],
    ['Puntaje SCA', c.puntaje !== null ? fmt2(c.puntaje) : 'Sin catar'],
    ['Factor UGQ', c.factorUGQ ? fmt2(c.factorUGQ) : 'Sin análisis'],
  ]);

  r.seccion('Origen y proceso');
  const datos = [
    ['Productor', nombreProductor(c.productor)], ['Finca', cafe.finca],
    ['Origen', origen], ['Fecha de registro', fmtFecha(cafe.fechaRegistro)],
    ['Variedad', (cafe.variedades || []).join(', ')], ['Proceso', cafe.proceso],
    ['Fermentación', [cafe.tipoFermentacion, cafe.tiempoFermentacion].filter(Boolean).join(' · ')],
    ['Secado', [cafe.tipoSecado, cafe.tiempoSecado].filter(Boolean).join(' · ')],
    ['Humedad', cafe.humedad ? `${String(cafe.humedad).replace('.', ',')} %` : ''], ['Bodega', c.bodega],
  ];
  if (internos) datos.push(['Cédula del productor', (c.productor && c.productor.cedula) || ''], ['Autorización de datos', c.productor && c.productor.autorizacion ? 'Sí' : 'No registrada']);
  r.datos(datos);

  r.seccion('Análisis físico');
  if (c.factorUGQ === null && !num(cafe.gramos)) r.nota('Este café todavía no tiene análisis físico.');
  else {
    r.tabla(
      [{ t: 'Gramos de análisis', w: 0.18, align: 'right' }, { t: 'Malla 15', w: 0.12, align: 'right' }, { t: 'Pasilla 15', w: 0.12, align: 'right' },
        { t: 'Malla 14', w: 0.12, align: 'right' }, { t: 'Pasilla 14', w: 0.12, align: 'right' }, { t: 'Fondo', w: 0.1, align: 'right' },
        { t: 'Factor UGQ', w: 0.12, align: 'right' }, { t: 'Factor EP*', w: 0.12, align: 'right' }],
      [[fmtKg(num(cafe.gramos)), fmtKg(num(cafe.m15)), fmtKg(num(cafe.p15)), fmtKg(num(cafe.m14)), fmtKg(num(cafe.p14)), fmtKg(num(cafe.m0)), fmt2(c.factorUGQ), fmt2(c.factorEP)]],
    );
    r.nota('Valores en gramos. Factor = 70 ÷ (gramos de excelso ÷ gramos de análisis). *Fórmula del factor EP por confirmar.');
  }

  r.seccion('Catación');
  if (!c.cataciones.length) r.nota('Este café todavía no tiene cataciones.');
  else {
    r.datos([['Puntaje promedio', `${fmt2(c.puntaje)} · ${clasificacion(c.puntaje)}`], ['Cataciones', String(c.cataciones.length)]]);
    if (c.perfil.length) r.chips(c.perfil.map((d) => (d.count > 1 ? `${d.label} (x${d.count})` : d.label)));
    tablaCataciones(r, c.cataciones);
    r.nota('Formato SCA: suma de 7 atributos + 2 × (uniformidad + taza limpia + dulzura) − defectos.');
  }

  r.seccion('Kilos y movimientos');
  const movs = [{ f: cafe.fechaRegistro, t: 'Ingreso a bodega', kg: total }];
  for (const l of data.lotes) for (const it of l.items || []) if (it.cafeId === id) movs.push({ f: l.fecha, t: `Trilla lote ${l.id}${l.nombre ? ' · ' + l.nombre : ''}`, kg: -num(it.kg) });
  for (const v of data.ventas) if (v.tipo === 'Pergamino' && v.ref === id) movs.push({ f: v.fecha, t: internos ? `Venta a ${v.cliente || 'cliente'} · ${fmtCOP(num(v.kg) * num(v.precioKg))}` : 'Venta en pergamino', kg: -num(v.kg) });
  movs.sort((a, b) => (a.f < b.f ? -1 : 1));
  r.tabla([{ t: 'Fecha', w: 0.16 }, { t: 'Movimiento', w: 0.64 }, { t: 'Kg', w: 0.2, align: 'right' }],
    movs.map((m) => [fmtFecha(m.f), m.t, `${m.kg < 0 ? '-' : '+'}${fmtKg(Math.abs(m.kg))}`]),
    { total: ['', 'Disponible', fmtKg(c.disponible)] });

  if (internos) {
    r.seccion('Precio de compra');
    r.datos([['Precio por kg', num(cafe.precioKg) ? fmtCOP(num(cafe.precioKg)) : 'Sin precio'], ['Precio por carga (125 kg)', num(cafe.precioKg) ? fmtCOP(precioCarga(cafe.precioKg)) : '—']]);
    if (cafe.comentarios) { r.seccion('Comentarios'); r.parrafo(cafe.comentarios); }
  }
  return { bytes: await r.terminar(), nombre: nombreArchivo(`Reporte ${cafe.id} ${c.nombre}`) };
}

// ---------- Reporte de un lote ----------
export async function reporteLote(id, { internos = false } = {}) {
  const lote = data.lotes.find((l) => l.id === id);
  const l = loteInfo(lote);
  const r = await crear('Reporte de lote', { title: `Lote ${l.nombre}` });
  r.tituloPrincipal(`Lote ${l.nombre}`, [`Trilla del ${fmtFecha(lote.fecha)}`, `Preparación ${lote.preparacion}`, lote.corte ? `Corte ${lote.corte}` : ''].filter(Boolean).join(' · '));

  r.indicadores([
    ['Pergamino', `${fmtKg(l.kgPergamino)} kg`],
    ['Excelso proyectado', `${fmt2(l.proyeccion)} kg`],
    ['Excelso real', l.trillado ? `${fmtKg(num(lote.kgExcelso))} kg` : 'Por trillar', l.trillado],
    ['Puntaje SCA', l.puntaje !== null ? fmt2(l.puntaje) : 'Sin catar'],
  ]);

  r.seccion('Cafés del lote');
  r.tabla(
    [{ t: 'Código', w: 0.11 }, { t: 'Café', w: 0.41 }, { t: 'Kg pergamino', w: 0.15, align: 'right' }, { t: `Factor ${lote.preparacion}`, w: 0.14, align: 'right' }, { t: 'Excelso proy.', w: 0.19, align: 'right' }],
    l.items.map((it) => [it.cafeId, it.cafe ? nombreProducto(it.cafe) : 'Café borrado', fmtKg(num(it.kg)), it.factor ? fmt2(it.factor) : 'Sin análisis', `${fmt2(it.proyeccion)} kg`]),
    { total: ['', 'Total del lote', fmtKg(l.kgPergamino), l.factorLote ? fmt2(l.factorLote) : '—', `${fmt2(l.proyeccion)} kg`] },
  );
  r.nota('El factor del lote es un promedio ponderado: kg de pergamino × 70 ÷ excelso proyectado.');

  r.seccion('Resultado de la trilla');
  if (!l.trillado) r.nota('Este lote todavía no tiene resultado de trilla.');
  else {
    r.datos([
      ['Kg de excelso', `${fmtKg(num(lote.kgExcelso))} kg`], ['Kg de pasilla', `${fmtKg(num(lote.kgPasilla))} kg (al inventario general)`],
      ['Factor real', fmt2(l.factorReal)], ['Diferencia con lo proyectado', `${l.diferencia >= 0 ? '+' : '-'}${fmt2(Math.abs(l.diferencia))} kg de excelso`],
      ['Muestra', lote.muestraG ? `${lote.muestraG} g` : ''], ['Defectos 1er / 2do grupo', [lote.def1 || '0', lote.def2 || '0'].join(' / ')],
      ['Quakers', lote.quakers || '0'], ['Excelso disponible', `${fmtKg(l.excelsoDisp)} kg`],
    ]);
  }

  r.seccion('Catación del lote');
  if (!l.cataciones.length) r.nota('Este lote todavía no tiene cataciones.');
  else {
    r.datos([['Puntaje promedio', `${fmt2(l.puntaje)} · ${clasificacion(l.puntaje)}`], ['Cataciones', String(l.cataciones.length)]]);
    if (l.perfil.length) r.chips(l.perfil.map((d) => (d.count > 1 ? `${d.label} (x${d.count})` : d.label)));
    tablaCataciones(r, l.cataciones);
  }

  if (internos) {
    const ventas = data.ventas.filter((v) => v.tipo === 'Excelso' && v.ref === id).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
    r.seccion('Ventas de excelso de este lote');
    if (!ventas.length) r.nota('Todavía no hay ventas de este lote.');
    else {
      r.tabla([{ t: 'Fecha', w: 0.15 }, { t: 'Cliente', w: 0.37 }, { t: 'Kg', w: 0.14, align: 'right' }, { t: 'Precio kg', w: 0.15, align: 'right' }, { t: 'Valor', w: 0.19, align: 'right' }],
        ventas.map((v) => [fmtFecha(v.fecha), v.cliente || '—', fmtKg(num(v.kg)), fmtCOP(num(v.precioKg)), fmtCOP(num(v.kg) * num(v.precioKg))]),
        { total: ['', 'Total', fmtKg(ventas.reduce((s, v) => s + num(v.kg), 0)), '', fmtCOP(ventas.reduce((s, v) => s + num(v.kg) * num(v.precioKg), 0))] });
    }
    if (lote.comentarios) { r.seccion('Comentarios'); r.parrafo(lote.comentarios); }
  }
  return { bytes: await r.terminar(), nombre: nombreArchivo(`Reporte lote ${l.nombre}`) };
}
