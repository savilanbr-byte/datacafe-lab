// Datos de ejemplo (inventados) para conocer la app. Se pueden borrar desde Ajustes.
import { clearAll, put, uid } from './db.js';
import { hoyISO } from './calc.js';

export async function cargarEjemplo() {
  await clearAll();
  const d = (n) => hoyISO(-n); // fecha de hace n días

  const b1 = { id: 'b-principal', nombre: 'Bodega principal' };
  const b2 = { id: 'b-pitalito', nombre: 'Acopio Pitalito' };
  for (const b of [b1, b2]) await put('bodegas', b);

  const P = [
    ['p-ana', 'Ana', 'Gómez', '12345678'], ['p-luis', 'Luis', 'Ríos', '87654321'], ['p-marta', 'Marta', 'Cárdenas', '11223344'],
    ['p-jorge', 'Jorge', 'Muñoz', '55667788'], ['p-rosa', 'Rosa', 'Imbachí', '99887766'],
  ];
  for (const [id, nombre, apellido, cedula] of P) await put('productores', { id, nombre, apellido, cedula, autorizacion: true, fechaAutorizacion: d(30) });

  const base = { departamento: 'Huila', gramos: 300, comentarios: '' };
  const C = [
    { id: 'C-0001', productorId: 'p-ana', finca: 'La Esperanza', municipio: 'Pitalito', vereda: 'El Cedro', variedades: ['Castillo', 'Caturra'], proceso: 'Lavado', tipoFermentacion: 'Tanque cerrado', tiempoFermentacion: '36 h', tipoSecado: 'Marquesina', tiempoSecado: '15 días', humedad: 10.8, m15: 120, p15: 8, m14: 135, p14: 6, m0: 11, precioKg: 20000, kgTotales: 500, bodegaId: b1.id, fechaRegistro: d(17) },
    { id: 'C-0002', productorId: 'p-luis', finca: 'El Mirador', municipio: 'Acevedo', vereda: 'San Isidro', variedades: ['Pink Bourbon'], proceso: 'Natural', tipoFermentacion: 'Cereza en bolsa sellada', tiempoFermentacion: '120 h', tipoSecado: 'Cama africana', tiempoSecado: '25 días', humedad: 11.2, m15: 155, p15: 5, m14: 98, p14: 4, m0: 9, precioKg: 24000, kgTotales: 300, bodegaId: b2.id, fechaRegistro: d(15) },
    { id: 'C-0003', productorId: 'p-marta', finca: 'Los Naranjos', municipio: 'Garzón', vereda: 'Zuluaga', variedades: ['Castillo'], proceso: 'Honey', tipoFermentacion: 'Mucílago en secado', tiempoFermentacion: '24 h', tipoSecado: 'Marquesina', tiempoSecado: '18 días', humedad: 11, m15: 130, p15: 7, m14: 120, p14: 6, m0: 12, precioKg: 21500, kgTotales: 210, bodegaId: b1.id, fechaRegistro: d(12) },
    { id: 'C-0004', productorId: 'p-jorge', finca: 'La Cumbre', municipio: 'Pitalito', vereda: 'Bruselas', variedades: ['Geisha'], proceso: 'Lavado', tipoFermentacion: 'Tanque abierto', tiempoFermentacion: '48 h', tipoSecado: 'Cama africana', tiempoSecado: '20 días', humedad: 10.5, m15: 160, p15: 4, m14: 90, p14: 3, m0: 10, precioKg: 32000, kgTotales: 160, bodegaId: b2.id, fechaRegistro: d(10) },
    { id: 'C-0005', productorId: 'p-rosa', finca: 'Buenavista', municipio: 'La Plata', vereda: 'Belén', variedades: ['Caturra'], proceso: 'Lavado', tipoFermentacion: 'Tanque cerrado', tiempoFermentacion: '30 h', tipoSecado: 'Patio', tiempoSecado: '12 días', humedad: 11.5, m15: 110, p15: 9, m14: 138, p14: 8, m0: 14, precioKg: 19500, kgTotales: 180, bodegaId: b1.id, fechaRegistro: d(9) },
    { id: 'C-0006', productorId: 'p-ana', finca: 'La Esperanza', municipio: 'Pitalito', vereda: 'El Cedro', variedades: ['Castillo'], proceso: 'Natural', tipoFermentacion: 'Cereza en tanque', tiempoFermentacion: '72 h', tipoSecado: 'Marquesina', tiempoSecado: '22 días', humedad: 11.1, m15: 125, p15: 7, m14: 128, p14: 6, m0: 11, precioKg: '', kgTotales: 150, bodegaId: b1.id, fechaRegistro: d(7) },
    { id: 'C-0007', productorId: 'p-luis', finca: 'San Luis', municipio: 'Acevedo', vereda: 'San Isidro', variedades: ['Pink Bourbon'], proceso: 'Honey', tipoFermentacion: 'Mucílago en secado', tiempoFermentacion: '24 h', tipoSecado: 'Cama africana', tiempoSecado: '19 días', humedad: 10.9, m15: 150, p15: 6, m14: 102, p14: 5, m0: 9, precioKg: 25000, kgTotales: 210, bodegaId: b2.id, fechaRegistro: d(5) },
    { id: 'C-0008', productorId: 'p-marta', finca: 'Villa Rica', municipio: 'Garzón', vereda: 'Zuluaga', variedades: ['Castillo'], proceso: 'Lavado', tipoFermentacion: 'Tanque abierto', tiempoFermentacion: '30 h', tipoSecado: 'Patio', tiempoSecado: '14 días', humedad: 11.6, gramos: '', m15: '', p15: '', m14: '', p14: '', m0: '', precioKg: '', kgTotales: 250, bodegaId: b1.id, fechaRegistro: d(2) },
    { id: 'C-0009', productorId: 'p-jorge', finca: 'Las Brisas', municipio: 'Pitalito', vereda: 'Bruselas', variedades: ['Caturra'], proceso: 'Lavado', tipoFermentacion: 'Tanque cerrado', tiempoFermentacion: '36 h', tipoSecado: 'Marquesina', tiempoSecado: '16 días', humedad: 11, m15: 128, p15: 7, m14: 126, p14: 6, m0: 12, precioKg: 21000, kgTotales: 320, bodegaId: b2.id, fechaRegistro: d(20) },
  ];
  for (const c of C) await put('cafes', { ...base, ...c, creado: new Date().toISOString() });

  const at = (a, s, r, ac, ba, cu, g) => ({ aroma: a, sabor: s, residual: r, acidez: ac, balance: ba, cuerpo: cu, general: g });
  const K = [
    ['pergamino', 'C-0001', d(13), '1', 'Catador A', at(8.25, 8.25, 8, 7.75, 7.75, 8, 8.5), ['Manzana roja', 'Caramelo', 'Pasas', 'Amareto'], 'Buen café'],
    ['pergamino', 'C-0001', d(13), '2', 'Catador B', at(8, 8.25, 7.75, 8, 7.75, 7.75, 8.25), ['Manzana roja', 'Pasas', 'Panela'], ''],
    ['pergamino', 'C-0002', d(12), '1', 'Catador A', at(8.5, 8.5, 8.25, 8, 8, 8.25, 8.5), ['Fresa', 'Chocolate', 'Vino'], 'Natural limpio'],
    ['pergamino', 'C-0003', d(9), '1', 'Catador C', at(8, 8, 7.75, 7.75, 7.75, 8, 8), ['Panela', 'Miel', 'Durazno'], ''],
    ['pergamino', 'C-0004', d(8), '1', 'Catador D', at(8.75, 8.75, 8.5, 8.5, 8.25, 8, 8.75), ['Jazmín', 'Floral', 'Mandarina'], 'Muy floral'],
    ['pergamino', 'C-0005', d(6), '1', 'Catador A', at(7.75, 7.75, 7.5, 7.75, 7.5, 7.75, 7.75), ['Chocolate', 'Nuez'], ''],
    ['pergamino', 'C-0006', d(5), '1', 'Catador B', at(8, 8, 7.75, 7.75, 8, 8, 8), ['Frutos rojos', 'Panela'], ''],
    ['pergamino', 'C-0007', d(3), '1', 'Catador C', at(8.25, 8.25, 8, 8, 8, 8, 8.25), ['Fresa', 'Caramelo'], ''],
    ['pergamino', 'C-0009', d(18), '1', 'Catador D', at(7.75, 7.75, 7.5, 7.5, 7.5, 7.75, 7.75), ['Chocolate', 'Panela'], ''],
    ['lote', 'L-001', d(3), '1', 'Catador A', at(8, 8, 7.75, 7.75, 7.75, 8, 8.25), ['Caramelo', 'Manzana roja', 'Fresa'], ''],
  ];
  for (const [tipo, ref, fecha, mesa, catador, atributos, descriptores, comentarios] of K) {
    await put('cataciones', { id: uid('k'), tipo, ref, fecha, mesa, catador, atributos, uniformidad: 5, tazaLimpia: 5, dulzura: 5, defectos: 0, descriptores, comentarios });
  }

  await put('lotes', { id: 'L-001', nombre: 'Mezcla Huila', fecha: d(4), preparacion: 'UGQ', items: [{ cafeId: 'C-0001', kg: 400 }, { cafeId: 'C-0002', kg: 200 }], corte: '1', muestraG: '350', def1: '3', def2: '12', quakers: '2', kgExcelso: 470, kgPasilla: 35, comentarios: '' });
  await put('lotes', { id: 'L-002', nombre: '', fecha: d(16), preparacion: 'UGQ', items: [{ cafeId: 'C-0009', kg: 320 }], corte: '2', muestraG: '350', def1: '2', def2: '9', quakers: '1', kgExcelso: 255, kgPasilla: 22, comentarios: '' });

  const V = [
    [d(2), 'Excelso', 'L-001', 'Tostadora Ejemplo', 300, 45000],
    [d(2), 'Pasilla', 'L-001', 'Cliente Ejemplo 2', 20, 9000],
    [d(3), 'Pergamino', 'C-0002', 'Cliente Ejemplo 3', 50, 24000],
  ];
  for (const [fecha, tipo, ref, cliente, kg, precioKg] of V) await put('ventas', { id: uid('v'), fecha, tipo, ref, cliente, kg, precioKg, comentarios: '' });

  await put('meta', { id: 'seq-C', value: 9 });
  await put('meta', { id: 'seq-L', value: 2 });
}
