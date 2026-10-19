// Catación (formato SCA clásico). Cada catador registra en su propio celular; la app promedia.
import { data, put, uid } from '../db.js';
import { ATRIBUTOS, TAZAS, puntajeCatacion, clasificacion, fmt2, fmtFecha, hoyISO, nombreProducto } from '../calc.js';
import { esc, icon, seg, bindSeg, toast, go, field, textarea } from '../ui.js';
import { DESCRIPTORES } from '../listas.js';
import { cafesOrdenados, lotesOrdenados, nombreReferencia } from '../model.js';

let ultimoCatador = '';

export async function render(root, { q }) {
  let tipo = q.get('tipo') === 'lote' ? 'lote' : 'pergamino';
  let ref = q.get('ref') || '';
  const fijo = !!ref;

  const c = {
    fecha: hoyISO(), mesa: '1', catador: ultimoCatador,
    atributos: Object.fromEntries(ATRIBUTOS.map(([k]) => [k, 7.5])),
    uniformidad: 5, tazaLimpia: 5, dulzura: 5, defectos: 0, descriptores: [], comentarios: '',
  };
  const usados = data.cataciones.flatMap((x) => x.descriptores || []);
  let opciones = [...new Set([...DESCRIPTORES, ...usados])];

  const volver = fijo ? (tipo === 'lote' ? `#/lote/${encodeURIComponent(ref)}` : `#/cafe/${encodeURIComponent(ref)}`) : null;

  function opcionesRef() {
    if (tipo === 'lote') return lotesOrdenados().map((l) => [l.id, l.nombre ? `${l.id} · ${l.nombre}` : l.id]);
    return cafesOrdenados().map((x) => [x.id, `${x.id} · ${nombreProducto(x)}`]);
  }

  const recientes = [...data.cataciones].sort((a, b) => (a.fecha + a.actualizado < b.fecha + b.actualizado ? 1 : -1)).slice(0, 6);

  root.innerHTML = `
    ${volver
      ? `<header class="topbar"><a class="icon-btn" href="${volver}" aria-label="Volver">${icon('back')}</a><h1>Nueva catación</h1></header>`
      : `<header class="page-head"><div><h1>Catación</h1><p class="sub">Califica un café o un lote trillado</p></div></header>`}
    <form id="form" class="stack" novalidate>
      <section class="card stack-sm">
        ${fijo
          ? `<div class="small muted">${tipo === 'lote' ? 'Lote trillado' : 'Café en pergamino'} · ${esc(ref)}</div>
             <div class="item-name">${esc(nombreReferencia(tipo === 'lote' ? 'Excelso' : 'Pergamino', ref))}</div>`
          : `<div class="field"><div class="label">¿Qué vas a catar?</div>${seg('tipo', [['pergamino', 'Café en pergamino'], ['lote', 'Lote trillado']], tipo)}</div>
             <div class="field"><label for="ref">${tipo === 'lote' ? 'Lote' : 'Café'}</label><select class="input" id="ref"></select></div>`}
        <div class="grid-2">
          ${field('fecha', 'Fecha', c.fecha, 'type="date"')}
          ${field('mesa', 'Mesa', c.mesa, 'inputmode="numeric"')}
        </div>
        ${field('catador', 'Catador (opcional)', c.catador, 'autocomplete="name"')}
      </section>

      <section class="hero score" aria-live="polite">
        <div><div class="label">Puntaje final</div><div style="font-weight:600;margin-top:.125rem" id="cat"></div></div>
        <div class="val" id="score"></div>
      </section>

      <section class="card">
        <h2>Atributos</h2>
        <p class="small muted" style="margin:.125rem 0 .375rem">Toca − o + para subir o bajar de a 0,25 (de 6 a 10)</p>
        ${ATRIBUTOS.map(([k, label]) => `
          <div class="stepper-row">
            <span class="name">${label}</span>
            <button type="button" class="step-btn" data-attr="${k}" data-d="-0.25" aria-label="Bajar ${label}">−</button>
            <span class="step-val" id="v-${k}">${fmt2(c.atributos[k])}</span>
            <button type="button" class="step-btn" data-attr="${k}" data-d="0.25" aria-label="Subir ${label}">+</button>
          </div>`).join('')}
      </section>

      <section class="card">
        <h2>Tazas buenas</h2>
        <p class="small muted" style="margin:.125rem 0 .375rem">Toca las tazas que salieron bien (de 5)</p>
        ${TAZAS.map(([k, label]) => `
          <div class="cup-row">
            <div class="cup-head"><span>${label}</span><strong id="n-${k}">${c[k]}/5</strong></div>
            <div class="cups">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="cup" data-taza="${k}" data-n="${n}" aria-label="${label}: taza ${n}" aria-pressed="${n <= c[k]}">${icon('cup-plain')}</button>`).join('')}</div>
          </div>`).join('')}
      </section>

      <section class="card" style="display:flex;align-items:center;gap:.625rem">
        <div style="flex:1"><div>Defectos</div><div class="small muted">Puntos a descontar</div></div>
        <button type="button" class="step-btn" data-def="-1" aria-label="Bajar defectos">−</button>
        <span class="step-val" id="v-def">0</span>
        <button type="button" class="step-btn" data-def="1" aria-label="Subir defectos">+</button>
      </section>

      <section class="card stack-sm">
        <h2>Descriptores</h2>
        <div class="chips" id="desc"></div>
        <div style="display:flex;gap:.5rem">
          <label class="sr" for="otro-desc">Otro descriptor</label>
          <input class="input" id="otro-desc" placeholder="Otro descriptor" autocomplete="off">
          <button type="button" class="btn" id="add-desc">Agregar</button>
        </div>
        ${textarea('comentarios', 'Comentarios', '')}
      </section>

      <div id="errores" aria-live="assertive"></div>
      <button type="submit" class="btn btn-green btn-lg btn-block">Guardar catación</button>
    </form>

    ${!fijo && recientes.length ? `<section class="mt stack-sm">
      <h2 style="font-size:1.25rem">Últimas cataciones</h2>
      ${recientes.map((k) => `<a class="item" href="${k.tipo === 'lote' ? '#/lote/' : '#/cafe/'}${encodeURIComponent(k.ref)}">
        <div class="item-top"><span>${esc(fmtFecha(k.fecha))} · ${k.tipo === 'lote' ? 'Lote' : 'Pergamino'} · Mesa ${esc(k.mesa || '1')}</span><span class="badge">${fmt2(puntajeCatacion(k))}</span></div>
        <div class="item-name">${esc(nombreReferencia(k.tipo === 'lote' ? 'Excelso' : 'Pergamino', k.ref))}</div>
      </a>`).join('')}
    </section>` : ''}`;

  const $ = (s) => root.querySelector(s);

  function pintarRef() {
    const sel = $('#ref');
    if (!sel) return;
    const ops = opcionesRef();
    if (!ops.find(([id]) => id === ref)) ref = ops.length ? ops[0][0] : '';
    sel.innerHTML = ops.length
      ? ops.map(([id, n]) => `<option value="${esc(id)}" ${id === ref ? 'selected' : ''}>${esc(n)}</option>`).join('')
      : `<option value="">${tipo === 'lote' ? 'No hay lotes todavía' : 'No hay cafés todavía'}</option>`;
  }

  function pintarDesc() {
    $('#desc').innerHTML = opciones.map((d) => `<button type="button" class="chip accent" data-d="${esc(d)}" aria-pressed="${c.descriptores.includes(d)}">${esc(d)}</button>`).join('');
  }

  function puntaje() {
    const p = puntajeCatacion(c);
    $('#score').textContent = fmt2(p);
    $('#cat').textContent = clasificacion(p);
  }

  if (!fijo) {
    bindSeg(root, 'tipo', (val) => { tipo = val; root.querySelector('label[for="ref"]').textContent = tipo === 'lote' ? 'Lote' : 'Café'; ref = ''; pintarRef(); });
    $('#ref').addEventListener('change', (e) => { ref = e.target.value; });
    pintarRef();
  }

  $('#form').addEventListener('click', (e) => {
    const a = e.target.closest('[data-attr]');
    if (a) {
      const k = a.dataset.attr;
      c.atributos[k] = Math.min(10, Math.max(6, c.atributos[k] + Number(a.dataset.d)));
      $('#v-' + k).textContent = fmt2(c.atributos[k]);
      puntaje(); return;
    }
    const t = e.target.closest('[data-taza]');
    if (t) {
      const k = t.dataset.taza, n = Number(t.dataset.n);
      c[k] = c[k] === n ? n - 1 : n;
      root.querySelectorAll(`[data-taza="${k}"]`).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.n) <= c[k])));
      $('#n-' + k).textContent = `${c[k]}/5`;
      puntaje(); return;
    }
    const d = e.target.closest('[data-def]');
    if (d) {
      c.defectos = Math.max(0, c.defectos + Number(d.dataset.def));
      $('#v-def').textContent = String(c.defectos);
      puntaje(); return;
    }
    const ch = e.target.closest('#desc [data-d]');
    if (ch) {
      const x = ch.dataset.d;
      c.descriptores = c.descriptores.includes(x) ? c.descriptores.filter((y) => y !== x) : [...c.descriptores, x];
      ch.setAttribute('aria-pressed', String(c.descriptores.includes(x)));
    }
  });

  $('#add-desc').addEventListener('click', () => {
    const x = $('#otro-desc').value.trim();
    if (!x) return;
    if (!opciones.includes(x)) opciones = [...opciones, x];
    if (!c.descriptores.includes(x)) c.descriptores.push(x);
    $('#otro-desc').value = '';
    pintarDesc();
  });

  $('#form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!ref) { $('#errores').innerHTML = `<div class="alert" role="alert">Primero elige qué café o lote vas a catar.</div>`; return; }
    c.fecha = $('#fecha').value || hoyISO();
    c.mesa = $('#mesa').value.trim() || '1';
    c.catador = $('#catador').value.trim();
    c.comentarios = $('#comentarios').value.trim();
    ultimoCatador = c.catador;
    await put('cataciones', { id: uid('k'), tipo, ref, ...c, puntaje: puntajeCatacion(c) });
    toast(`Catación guardada: ${fmt2(puntajeCatacion(c))} puntos`);
    go(tipo === 'lote' ? `#/lote/${encodeURIComponent(ref)}` : `#/cafe/${encodeURIComponent(ref)}`);
  });

  pintarDesc();
  puntaje();
}
