// Tarjeta "Reporte en PDF" que se usa en la ficha del café y en el lote.
import { esc, icon, toast, download } from './ui.js';

export function htmlReporte() {
  return `<section class="card stack-sm" id="reporte">
    <h2>Reporte en PDF</h2>
    <label class="check small"><input type="checkbox" id="rep-internos"> Incluir datos internos (cédula, precios y clientes)</label>
    <div class="btn-row">
      <button type="button" class="btn btn-outline-green" id="rep-descargar">${icon('download', 'ic-sm')}Descargar PDF</button>
      <button type="button" class="btn btn-outline-green" id="rep-compartir" hidden>${icon('share', 'ic-sm')}Compartir PDF</button>
    </div>
    <p class="small muted" id="rep-estado" aria-live="polite"></p>
  </section>`;
}

/** generar({internos}) debe devolver {bytes, nombre}. */
export function bindReporte(root, generar) {
  const box = root.querySelector('#reporte');
  if (!box) return;
  const estado = box.querySelector('#rep-estado');
  const btnD = box.querySelector('#rep-descargar');
  const btnC = box.querySelector('#rep-compartir');
  const puedeCompartir = (() => {
    try { return !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'x.pdf', { type: 'application/pdf' })] })); } catch (e) { return false; }
  })();
  btnC.hidden = !puedeCompartir;

  async function hacer(compartir) {
    const internos = box.querySelector('#rep-internos').checked;
    btnD.disabled = btnC.disabled = true;
    estado.textContent = 'Preparando el reporte…';
    try {
      const { bytes, nombre } = await generar({ internos });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      if (compartir) {
        try { await navigator.share({ files: [new File([blob], nombre, { type: 'application/pdf' })], title: nombre }); }
        catch (e) { if (!e || e.name !== 'AbortError') download(nombre, blob); }
      } else {
        download(nombre, blob);
        toast('Reporte descargado');
      }
      estado.textContent = '';
    } catch (e) {
      console.error(e);
      estado.innerHTML = `No se pudo generar el reporte: ${esc(e.message || e)}`;
    } finally {
      btnD.disabled = btnC.disabled = false;
    }
  }
  btnD.addEventListener('click', () => hacer(false));
  btnC.addEventListener('click', () => hacer(true));
}
