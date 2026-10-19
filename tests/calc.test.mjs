// Pruebas de las fórmulas acordadas. Ejecutar con: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  num, factor, excelsoGramos, proyeccionExcelso, precioCarga, puntajeCatacion, promedioPuntaje, perfilTexto,
  disponibleCafe, resumenLote, disponibleLote, fmtNum, nombreProducto, clasificacion,
} from '../js/calc.js';

const cerca = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);

// Ejemplo real dado por el equipo: 120 / 8 / 135 / 6 / 11 sobre 300 g  ->  70 / (241/300)
const muestra = { m15: 120, p15: 8, m14: 135, p14: 6, m0: 11, gramos: 300 };

test('num entiende formatos colombianos', () => {
  assert.equal(num('10,8'), 10.8);
  assert.equal(num('1.200'), 1200);
  assert.equal(num('1.200,5'), 1200.5);
  assert.equal(num(''), 0);
  assert.equal(num('abc'), 0);
});

test('factor UGQ con el ejemplo del equipo = 87,14', () => {
  assert.equal(excelsoGramos(muestra, 'UGQ'), 241);
  cerca(factor(muestra, 'UGQ'), 87.1369);
});

test('factor EP (propuesta por confirmar) usa solo malla 15', () => {
  assert.equal(excelsoGramos(muestra, 'EP'), 112);
  cerca(factor(muestra, 'EP'), 187.5);
});

test('factor sin datos devuelve null', () => {
  assert.equal(factor({ gramos: 300 }), null);
  assert.equal(factor({ m15: 100 }), null);
});

test('proyección de excelso = kg × 70 / factor', () => {
  cerca(proyeccionExcelso(400, factor(muestra)), 321.33);
});

test('precio de la carga = precio kg × 125', () => {
  assert.equal(precioCarga(20000), 2500000);
});

test('puntaje de catación del ejemplo = 86,5', () => {
  const c = {
    atributos: { aroma: 8.25, sabor: 8.25, residual: 8, acidez: 7.75, balance: 7.75, cuerpo: 8, general: 8.5 },
    uniformidad: 5, tazaLimpia: 5, dulzura: 5, defectos: 0,
  };
  assert.equal(puntajeCatacion(c), 86.5);
  assert.equal(puntajeCatacion({ ...c, defectos: 2 }), 84.5);
  assert.equal(clasificacion(86.5), 'Excelente');
});

test('promedio y perfil con (xN)', () => {
  const a = { atributos: { aroma: 8, sabor: 8, residual: 8, acidez: 8, balance: 8, cuerpo: 8, general: 8 }, uniformidad: 5, tazaLimpia: 5, dulzura: 5, descriptores: ['Manzana roja', 'Caramelo', 'Pasas'] };
  const b = { ...a, atributos: { ...a.atributos, general: 9 }, descriptores: ['manzana roja', 'Pasas', 'Panela'] };
  assert.equal(promedioPuntaje([a, b]), 86.5);
  assert.equal(perfilTexto([a, b]), 'Manzana roja (x2), Pasas (x2), Caramelo, Panela');
  assert.equal(promedioPuntaje([]), null);
});

test('kilos disponibles de un café', () => {
  const cafe = { id: 'C-0001', kgTotales: 500 };
  const lotes = [{ id: 'L-001', items: [{ cafeId: 'C-0001', kg: 400 }] }];
  const ventas = [{ tipo: 'Pergamino', ref: 'C-0001', kg: 30 }, { tipo: 'Excelso', ref: 'C-0001', kg: 99 }];
  assert.equal(disponibleCafe(cafe, lotes, ventas), 70);
  assert.equal(disponibleCafe(cafe, lotes, ventas, 'L-001'), 470); // al editar el mismo lote
});

test('resumen de lote: factor ponderado y factor real', () => {
  const cafes = { A: { id: 'A', ...muestra }, B: { id: 'B', m15: 155, p15: 5, m14: 98, p14: 4, gramos: 300 } };
  const lote = { preparacion: 'UGQ', items: [{ cafeId: 'A', kg: 400 }, { cafeId: 'B', kg: 200 }], kgExcelso: 470 };
  const r = resumenLote(lote, cafes);
  assert.equal(r.kgPergamino, 600);
  cerca(r.proyeccion, 484);
  cerca(r.factorLote, 86.78);
  cerca(r.factorReal, 89.36);
  cerca(r.diferencia, -14);
});

test('disponible de excelso y pasilla en un lote', () => {
  const lote = { id: 'L-001', kgExcelso: 470, kgPasilla: 35 };
  const ventas = [{ tipo: 'Excelso', ref: 'L-001', kg: 300 }, { tipo: 'Pasilla', ref: 'L-001', kg: 20 }];
  assert.equal(disponibleLote(lote, ventas, 'Excelso'), 170);
  assert.equal(disponibleLote(lote, ventas, 'Pasilla'), 15);
});

test('formato y nombre del producto', () => {
  assert.equal(fmtNum(2500000), '2.500.000');
  assert.equal(fmtNum(87.1369, 2), '87,14');
  assert.equal(nombreProducto({ finca: 'La Esperanza', variedades: ['Castillo', 'Caturra'], proceso: 'Lavado' }), 'La Esperanza - Castillo, Caturra - Lavado');
});
