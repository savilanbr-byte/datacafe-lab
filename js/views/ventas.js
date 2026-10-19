// Registrar ventas de pergamino, excelso o pasilla, y ver las últimas.
import { data, put, del, uid } from '../db.js';
import { num, fmtKg, fmtCOP, fmtFecha, hoyISO } from '../calc.js';
import { esc, icon, seg, bindSeg, field, toast } from '../ui.js';
import { fuentesVenta, nombreReferencia } from '../model.js';

let ultimoTipo = 'Excelso';

export async function render(root) {
  const v = { tipo: ultimoTipo, ref: '', cliente: '', kg: '', precioKg: '', fecha: hoyISO(), comentarios: '' };
  const mes = hoyISO().slice(0, 7);
  const delMes = data.ventas.filter((x) => (x.fecha || '').startsWith(mes));
  const totalMes = delMes.reduce((s, x) => s + num(x.kg) * num(x.precioKg), 0);
  const kgMes = delMes.reduce((s, x) => s + num(x.kg), 0);
  const lista = [...data.ventas].sort((a, b) => ((a.fecha || '') + a.actualizado < (b.fecha || '') + b.actualizado ? 1 : -1));
  const clientes = [...new Set(data.ventas.map((x) => x.cliente).filter(Boolean))];

  root.innerHTML = `
    <header class="page-head"><div><h1>Ventas</h1><p class="sub">Este mes: ${fmtCOP(totalMes)} · ${fmtKg(kgMes)} kg vendidos</p></div></header>
    <form id="form" class="card stack" novalidate>
      <h2>Nueva venta</h2>
      <div class="field"><div class="label">¿Qué vendes?</div>${seg('tipo', ['Pergamino', 'Excelso', 'Pasilla'], v.tipo)}</div>
      <div class="field"><div class="label" id="fuente-label"></div><div id="fuentes" class="stack-sm"></div></div>
      ${field('cliente', 'Cliente', '', 'list="dl-cli" autocomplete="off"')}
      <datalist id="dl-cli">${clientes.map((c) => `<option value="${esc(c)}"></option>`).join('')}</datalist>
      <div class="grid-2">
        ${field('kg', 'Kilos', '', 'inputmode="decimal"')}
        ${field('precioKg', 'Precio por kilo', '', 'inputmode="numeric"')}
      </div>
      ${field('fecha', 'Fecha', v.fecha, 'type="date"')}
      <div class="alert" id="excede" hidden></div>
      <div class="hero" style="display:flex;justify-content:space-between;align-items:center;padding:.875rem 1rem" aria-live="polite">
        <span>Total de la venta</span><span class="mid-num" style="font-size:1.75rem" id="total">$0</span>
      </div>
      <div id="errores" aria-live="assertive"></div>
      <button type="submit" class="btn btn-accent btn-lg btn-block">Registrar venta</button>
    </form>

    <section class="stack-sm mt">
      <h2 style="font-size:1.25rem">Últimas ventas</h2>
      ${lista.length ? lista.slice(0, 30).map((x) => `
        <div class="item" style="flex-direction:row;align-items:center;gap:.5rem">
          <div style="flex:1;min-width:0"><div style="font-weight:600">${esc(x.cliente || 'Sin cliente')}</div>
            <div class="small muted">${esc(fmtFecha(x.fecha))} · ${esc(x.tipo)} ${esc(nombreReferencia(x.tipo, x.ref).split(' · ')[0])} · ${fmtKg(num(x.kg))} kg</div></div>
          <strong>${fmtCOP(num(x.kg) * num(x.precioKg))}</strong>
          <button class="icon-btn" type="button" data-del="${esc(x.id)}" aria-label="Borrar venta a ${esc(x.cliente || 'cliente')}">${icon('trash', 'ic-sm')}</button>
        </div>`).join('') : '<p class="empty">Aún no hay ventas.</p>'}
    </section>`;

  const $ = (s) => root.querySelector(s);
  let fuentes = [];

  function pintarFuentes() {
    fuentes = fuentesVenta(v.tipo);
    $('#fuente-label').textContent = v.tipo === 'Pergamino' ? '¿De cuál café del inventario?' : '¿De cuál lote?';
    if (!fuentes.find((f) => f.id === v.ref)) v.ref = fuentes.length ? fuentes[0].id : '';
    $('#fuentes').innerHTML = fuentes.length
      ? seg('ref', fuentes.map((f) => [f.id, `${f.titulo} — ${fmtKg(f.disp)} kg`, f.sub]), v.ref, 'wrap').replace('class="seg wrap"', 'class="seg wrap" style="grid-template-columns:1fr"')
      : `<p class="note">No hay ${v.tipo.toLowerCase()} disponible para vender.</p>`;
    bindSeg(root, 'ref', (val) => { v.ref = val; sugerirPrecio(); calcular(); });
    sugerirPrecio();
    calcular();
  }

  function sugerirPrecio() {
    const f = fuentes.find((x) => x.id === v.ref);
    if (v.tipo === 'Pergamino' && f && f.precio && !$('#precioKg').dataset.tocado) $('#precioKg').value = String(f.precio);
  }

  function calcular() {
    const kg = num($('#kg').value), pr = num($('#precioKg').value);
    $('#total').textContent = fmtCOP(kg * pr);
    const f = fuentes.find((x) => x.id === v.ref);
    const ex = $('#excede');
    ex.hidden = !(f && kg > f.disp + 0.001);
    if (f) ex.textContent = `Solo hay ${fmtKg(f.disp)} kg disponibles.`;
  }

  bindSeg(root, 'tipo', (val) => { v.tipo = val; ultimoTipo = val; $('#precioKg').dataset.tocado = ''; $('#precioKg').value = ''; pintarFuentes(); });
  $('#kg').addEventListener('input', calcular);
  $('#precioKg').addEventListener('input', (e) => { e.target.dataset.tocado = '1'; calcular(); });

  $('#form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const kg = num($('#kg').value), pr = num($('#precioKg').value);
    const f = fuentes.find((x) => x.id === v.ref);
    const err = [];
    if (!f) err.push('Elige de dónde sale lo que vendes.');
    if (!(kg > 0)) err.push('Escribe los kilos vendidos.');
    else if (f && kg > f.disp + 0.001) err.push(`Solo hay ${fmtKg(f.disp)} kg disponibles.`);
    if (!(pr > 0)) err.push('Escribe el precio por kilo.');
    if (err.length) { $('#errores').innerHTML = `<div class="alert" role="alert">${err.map(esc).join('<br>')}</div>`; return; }
    await put('ventas', {
      id: uid('v'), fecha: $('#fecha').value || hoyISO(), tipo: v.tipo, ref: v.ref,
      cliente: $('#cliente').value.trim(), kg, precioKg: pr, comentarios: '',
    });
    toast(`Venta registrada: ${fmtCOP(kg * pr)}`);
    render(root);
  });

  root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('¿Borrar esta venta? Los kilos vuelven a estar disponibles.')) return;
    await del('ventas', b.dataset.del);
    toast('Venta borrada');
    render(root);
  }));

  pintarFuentes();
}
