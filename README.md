# DataCafe|Laboratorio

App para hacer seguimiento a un café en post-cosecha: **inventario de pergamino, catación, trilla y ventas**. Está pensada para productores y comercializadoras, con botones grandes y lenguaje sencillo. **Funciona sin internet.**

Es un prototipo de **Sancocho Glorioso** (versión 0.3.0).

👉 **Probar la app:** https://savilanbr-byte.github.io/datacafe-lab/

## Instalarla en un celular Android

1. Abre el enlace de arriba en **Chrome**.
2. Toca el menú ⋮ y elige **Instalar app** (o **Agregar a la pantalla principal**).
3. Queda con su propio ícono y abre sin internet.

Para conocerla sin escribir nada: en Inicio toca **Cargar datos de ejemplo**. Después los puedes borrar en **Ajustes → Borrar toda la información**.

## Qué hace

| Pantalla | Qué permite |
|---|---|
| **Inicio** | Tablero con kilos disponibles de pergamino, excelso y pasilla; pendientes; kilos por bodega y por variedad; precios promedio. |
| **Pendientes** | Cuatro listas que se actualizan solas con los cafés en bodega a los que les falta **análisis físico**, **catación**, **precio** o la **autorización de datos** del productor. Cada café tiene un botón que abre justo lo que le falta y, al guardar, vuelve a la lista. |
| **Inventario** | Lista de cafés con buscador y filtro por bodega. |
| **Registrar café** | 2 pasos, solo lo esencial: productor (nombre, apellido, cédula), finca, departamento y municipio → kg de pergamino, variedad, proceso, tipo y tiempo de fermentación, tipo y tiempo de secado. El análisis físico (con los factores calculados en vivo), la bodega, el precio, la humedad, la vereda y la autorización de datos se completan después con **Editar**. Los cafés nuevos quedan en la primera bodega mientras no se cambie. |
| **Ficha del café** | Todo lo del café: perfil en taza, cataciones, proceso, análisis físico, movimientos. Se comparte por WhatsApp. |
| **Catación** | Formato SCA: atributos con − y +, tazas, defectos, descriptores. El puntaje se calcula solo. Cada catador usa su celular. |
| **Trilla** | Lotes que juntan uno o varios cafés. De cada café se puede sacar solo una parte (por ejemplo, 100 de 200 kg); el resto sigue disponible en inventario para otro lote o una venta. Cada café guarda sus kg originales y muestra los disponibles. La preparación (UGQ o EP) se elige para todo el lote. Calcula el excelso proyectado y, cuando se anota el resultado, el factor real. |
| **Ventas** | Ventas de pergamino, excelso o pasilla. No deja vender más de lo disponible. |
| **Ajustes** | Tema claro / oscuro / automático, tamaño de letra, bodegas, exportar a Excel (CSV), respaldo y restauración. |

## Fórmulas

- **Nombre del producto** = Finca - Variedad - Proceso
- **Factor UGQ** = 70 ÷ ((malla 15 + malla 14 − pasilla 15 − pasilla 14) ÷ gramos de análisis). La malla 0 (el fondo) se registra pero no entra en el cálculo.
  Ejemplo: 120, 8, 135, 6 en 300 g → 70 ÷ (241 ÷ 300) = **87,14**
- **Factor EP** = 70 ÷ ((malla 15 − pasilla 15) ÷ gramos de análisis). ⚠️ *Fórmula pendiente de confirmar.*
- **Precio de la carga** = precio por kg × 125
- **Excelso proyectado** = kg de pergamino × 70 ÷ factor
- **Factor del lote** = kg de pergamino del lote × 70 ÷ excelso proyectado total. Es un promedio ponderado, no simple.
- **Factor real** = kg de pergamino del lote × 70 ÷ kg de excelso que salieron
- **Puntaje de catación** = suma de los 7 atributos + 2 × (uniformidad + taza limpia + dulzura) − defectos
- **Puntaje de un café o lote** = promedio de sus cataciones. **Perfil** = descriptores de todas las cataciones; los repetidos se marcan con (xN).
- **Kg disponibles de pergamino** = kg totales − kg enviados a trilla − kg de pergamino vendidos
- **Kg disponibles de excelso o pasilla** = kg producidos en el lote − kg vendidos

Las fórmulas están en [`js/calc.js`](js/calc.js) y tienen pruebas en [`tests/calc.test.mjs`](tests/calc.test.mjs).

## Limitaciones del prototipo

- **La información se guarda solo en el celular** donde se usa (IndexedDB del navegador). Todavía no hay sincronización entre celulares ni usuarios. Por eso conviene descargar respaldos desde Ajustes.
- La lista de municipios está incompleta. Los campos aceptan texto libre.
- Exportar genera archivos `.csv`, que se abren en Excel o Google Sheets.

## Estructura del código

No usa librerías ni pasos de compilación: es HTML, CSS y JavaScript puros, y GitHub Pages lo publica tal cual.

```
index.html              Página única con el menú inferior e íconos
css/styles.css          Estilo "Patio de secado", tema oscuro y escala de letra
js/app.js               Arranque y navegación (#/inicio, #/inventario, ...)
js/db.js                Base de datos local (IndexedDB)
js/calc.js              Fórmulas (sin dependencias, con pruebas)
js/model.js             Datos derivados: disponibles, tablero, etc.
js/views/*.js           Una pantalla por archivo
js/seed.js              Datos de ejemplo
js/listas.js            Departamentos, municipios, variedades, descriptores
sw.js                   Modo sin conexión (service worker)
manifest.webmanifest    Datos para instalar la app
```

## Trabajar en el código

```bash
npx serve .           # abre http://localhost:3000
node --test tests/*.test.mjs   # pruebas de las fórmulas
```

**Para publicar una versión nueva**, cambia el número en `js/version.js` y en `CACHE` dentro de `sw.js`. Así los celulares que ya tienen la app instalada descargan la actualización. Luego sube los cambios a la rama `main`.

## Siguientes pasos

1. Confirmar la fórmula del factor EP, el manejo de la pasilla y cómo se nombra un lote que mezcla cafés.
2. Sincronización en la nube y varios usuarios para la versión empresarial.
3. Empaquetar para Play Store (por ejemplo, con Capacitor) usando este mismo código.
