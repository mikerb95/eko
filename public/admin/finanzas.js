// Finanzas: pinta el calendario, los expedientes, los pagos con su control,
// los documentos leídos con IA, los resúmenes y los ajustes, y envía los
// cambios a /api/admin/finanzas. Cada escritura devuelve el estado completo
// ya recalculado (plazos, chequeos del control), así que aquí no se decide
// nada que importe: el servidor vuelve a validar todo.
import { $, $$, esc, fmtDate, fmtCorto, estado as pastilla, crearLista } from './comun.js'

const API = '/api/admin/finanzas'
const API_ARCHIVO = '/api/admin/finanzas/archivo'
let E = window.__FIN__ || null
if (!E) throw new Error('Sin datos de Finanzas')

/* ---------- Utilidades ---------- */
const pesos = (n) => (n == null || n === '' ? 'sin valor' : '$' + Math.round(Number(n)).toLocaleString('es-CO').replace(/,/g, '.'))
const soloDigitos = (s) => String(s ?? '').replace(/\D/g, '')
const ob = (id) => E.obligaciones.find((o) => o.id === Number(id))
const pago = (id) => E.pagos.find((p) => p.id === Number(id))
const cuentaTxt = (id) => { const c = E.cuentas.find((x) => x.id === Number(id)); return c ? `${c.banco} ${c.tipo} terminada en ${c.ultimos}` : 'Sin cuenta' }
const opciones = (lista, actual, vacio) => (vacio !== undefined ? `<option value="">${esc(vacio)}</option>` : '') + lista.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(actual ?? '') ? ' selected' : ''}>${esc(t)}</option>`).join('')
const ESTADO_PUNTO = { pendiente: 'pendiente', borrador_listo: 'borrador_listo', revisado: 'revisado', aprobado: 'aprobado', pagado: 'pagado', presentado: 'presentado' }
const PAGO_TXT = { por_aprobar: 'Por aprobar', aprobado: 'Aprobado, por pagar', pagado: 'Pagado', rechazado: 'Devuelto', anulado: 'Anulado' }
const SOPORTE_TXT = { borrador: 'Borrador de la declaración', formulario: 'Formulario diligenciado', recibo: 'Recibo de pago (490 o el de la entidad)', comprobante: 'Comprobante del banco', acuse: 'Acuse de la entidad', otro: 'Otro soporte' }
const DOC_TXT = { declaracion: 'Declaración', recibo_pago: 'Recibo de pago', comprobante_banco: 'Comprobante del banco', acuse: 'Acuse', requerimiento: 'Requerimiento', otro: 'Otro documento' }
const P = () => E.puede

function avisoError(e) {
  const t = document.createElement('div')
  t.className = 'fin-toast'
  t.textContent = e.message || String(e)
  document.body.append(t)
  setTimeout(() => t.remove(), 6000)
}
function avisoOk(msg) {
  const t = document.createElement('div')
  t.className = 'fin-toast ok'
  t.textContent = msg
  document.body.append(t)
  setTimeout(() => t.remove(), 3500)
}

async function enviar(accion, datos = {}) {
  const res = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accion, ...datos }) })
  const r = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(r.error || 'Ocurrió un error')
  if (r.estado) { E = r.estado; renderTodo() }
  return r
}
async function subir(fd) {
  const res = await fetch(API_ARCHIVO, { method: 'POST', body: fd })
  const r = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(r.error || 'No se pudo subir el archivo')
  if (r.estado) { E = r.estado; renderTodo() }
  return r
}
async function conBoton(btn, errEl, fn) {
  if (errEl) errEl.textContent = ''
  if (btn) btn.disabled = true
  try { return await fn() } catch (e) { if (errEl) errEl.textContent = e.message; else avisoError(e); return null } finally { if (btn) btn.disabled = false }
}

/* ---------- Pestañas y paneles laterales ---------- */
const irA = (tab) => {
  const t = $(`.subtab[data-tab="${tab}"]`)
  if (!t) return
  $$('.subtabs .subtab').forEach((x) => x.classList.toggle('is-active', x === t))
  $$('.panel').forEach((x) => x.classList.toggle('is-active', x.id === 'panel-' + tab))
}
$$('.subtab[data-tab]').forEach((t) => t.addEventListener('click', () => irA(t.dataset.tab)))
document.addEventListener('click', (e) => { const b = e.target.closest('[data-ir]'); if (b) irA(b.dataset.ir) })
let abierto = { ob: null, pago: null }
const abrir = (d) => { d.hidden = false }
const cerrar = (d) => { d.hidden = true; if (d.id === 'ob-drawer') abierto.ob = null; if (d.id === 'pago-drawer') abierto.pago = null }
$$('.drawer').forEach((d) => $$('[data-close]', d).forEach((x) => x.addEventListener('click', () => cerrar(d))))
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return
  const abiertos = $$('.drawer').filter((d) => !d.hidden)
  if (abiertos.length) cerrar(abiertos[abiertos.length - 1])
})

/* ---------- Avisos de configuración ---------- */
function renderAvisosConfig() {
  const av = []
  if (!E.config.confirmado) av.push(['warn', 'Las responsabilidades del RUT están por confirmar. El calendario se armó con valores de arranque: revise los Ajustes.', 'ajustes'])
  if (!E.obligaciones.length) av.push(['warn', 'Todavía no hay obligaciones. Cargue el calendario del año en Ajustes.', 'ajustes'])
  for (const r of E.revisionCalendario.filter((x) => x.porConfirmar > 0 && Number(x.anio) <= Number(E.hoy.slice(0, 4)) + 1)) {
    av.push(['warn', r.revision
      ? `${r.porConfirmar} fecha${r.porConfirmar === 1 ? '' : 's'} de ${r.anio} sigue${r.porConfirmar === 1 ? '' : 'n'} por confirmar (estimadas, cambiadas después de la revisión del contador o con el RUT sin confirmar). Están marcadas en el calendario.`
      : `El contador no ha revisado el calendario de ${r.anio}: las ${r.abiertas} fechas abiertas son de apoyo hasta que las compare con el calendario oficial.`, 'ajustes'])
  }
  if (!E.cuentas.some((c) => c.activa)) av.push(['warn', 'No hay cuentas de origen autorizadas: sin ellas el control antes de pagar no deja preparar pagos.', 'ajustes'])
  if (E.sesion.rol === 'admin' && !E.entorno.cron) av.push(['info', 'Para que los avisos salgan solos cada día falta la variable CRON_SECRET en Vercel.', null])
  if (E.sesion.rol === 'admin' && !E.entorno.correo) av.push(['info', 'El correo no está configurado en este entorno (RESEND_API_KEY): los avisos no se enviarán.', null])
  $('#fin-avisos-config').innerHTML = av.map(([t, txt, ir]) => `<div class="fin-aviso ${t}"><span>${esc(txt)}</span>${ir ? `<button type="button" class="link-btn" data-ir="${ir}">Ir a Ajustes</button>` : ''}</div>`).join('')
}

/* ---------- Calendario ---------- */
function renderKpis() {
  const abiertas = E.obligaciones.filter((o) => o.nivel !== 'cerrada')
  const k = [
    ['Vencidas sin presentar', abiertas.filter((o) => o.nivel === 'vencida').length, 'vencidas', '#d8453a', 'Requieren atención hoy'],
    ['Vencen en 3 días hábiles', abiertas.filter((o) => o.nivel === 'urgente').length, 'urgentes', '#e8920c', 'Avisan también a Gerencia'],
    ['Próximos 15 días hábiles', abiertas.filter((o) => o.nivel === 'pronto').length, 'pronto', '#1f8a8a', 'Con aviso por correo'],
    ['Pagos por aprobar', E.pagos.filter((p) => p.estado === 'por_aprobar').length, null, '#2f80c9', 'Esperan a Gerencia'],
  ]
  $('#fin-kpis').innerHTML = k.map(([l, n, chip, c, sub]) => `<button type="button" class="kpi${(chip === 'vencidas' || chip === 'urgentes') && n ? ' is-alerta' : ''}" style="--c:${c}" ${chip ? `data-chip-ir="${chip}"` : 'data-ir="pagos"'}><span class="kpi-lbl">${esc(l)}</span><span class="kpi-num">${n}</span><span class="kpi-sub">${esc(sub)}</span></button>`).join('')
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-chip-ir]'); if (b) { irA('calendario'); listaOb.chip(b.dataset.chipIr) } })

const mesActual = () => E.hoy.slice(0, 7)
const plazoHtml = (o) => `<span class="fin-plazo n-${o.nivel}">${esc(o.nivel === 'cerrada' ? 'Cerrada' : o.plazo)}</span>`
const listaOb = crearLista({
  el: '#ob-list', buscador: '#ob-q', chipsEl: '#ob-chips',
  datos: () => E.obligaciones,
  texto: (o) => [o.concepto, o.periodo, o.entidad, o.tipoTexto, o.estadoTexto, o.responsable].join(' '),
  vacio: ['Sin obligaciones', 'Cargue el calendario del año desde Ajustes o cree una a mano.'],
  chips: [
    { id: 'abiertas', lbl: 'Abiertas', f: (o) => o.nivel !== 'cerrada' },
    { id: 'urgentes', lbl: 'Urgentes', f: (o) => o.nivel === 'urgente' },
    { id: 'vencidas', lbl: 'Vencidas', f: (o) => o.nivel === 'vencida', siHay: true },
    { id: 'pronto', lbl: 'Próximas', f: (o) => o.nivel === 'pronto' },
    { id: 'mes', lbl: 'Este mes', f: (o) => o.vence.startsWith(mesActual()) },
    { id: 'porconfirmar', lbl: 'Fecha por confirmar', f: (o) => o.motivos.length > 0, siHay: true },
    { id: 'cerradas', lbl: 'Presentadas', f: (o) => o.nivel === 'cerrada' },
    { id: 'todas', lbl: 'Todas', f: () => true },
  ],
  columnas: [
    { k: 'ob', lbl: 'Obligación', html: (o) => `<div class="t1">${esc(o.concepto)}</div><div class="t2">${esc(o.periodo)} · ${esc(o.entidad)}${o.formulario ? ` · ${esc(o.formulario)}` : ''}</div>`, orden: (o) => o.concepto },
    { k: 'vence', lbl: 'Vence', cls: 'nw', html: (o) => `<div class="t1">${esc(o.vence ? fmtDate(o.vence) : 'Sin fecha')}</div><div class="t2">${plazoHtml(o)}</div>${o.motivos.length ? '<div class="fin-porconf">Fecha por confirmar</div>' : ''}`, orden: (o) => o.vence || '9999' },
    { k: 'estado', lbl: 'Estado', html: (o) => pastilla(ESTADO_PUNTO[o.estado], o.estadoTexto), orden: (o) => E.catalogos.estados.indexOf(o.estado) },
    { k: 'resp', lbl: 'Responsable', html: (o) => esc(o.responsable || 'Sin asignar'), orden: (o) => o.responsable },
    { k: 'sop', lbl: 'Soportes', cls: 'num der', html: (o) => String(o.soportes.length), orden: (o) => o.soportes.length },
  ],
  abrir: (id) => abrirOb(Number(id)),
})

/* ---------- Expediente ---------- */
const obDrawer = $('#ob-drawer')
function abrirOb(id) {
  abierto.ob = id
  renderOb()
  abrir(obDrawer)
}

function pasosHtml(o) {
  const seq = E.catalogos.estados.filter((e) => o.con_pago || e !== 'pagado')
  const i = seq.indexOf(o.estado)
  const exige = { borrador_listo: 'borrador', revisado: 'formulario', aprobado: o.con_pago ? 'recibo' : null, pagado: 'comprobante', presentado: 'acuse' }
  return `<ol class="fin-pasos">${seq.map((e, j) => {
    const sop = exige[e]
    const tiene = sop && o.soportes.some((s) => s.tipo === sop)
    const cls = j < i ? 'hecho' : j === i ? 'actual' : ''
    return `<li class="${cls}"><span class="fin-paso-punto"></span><div><b>${esc(E.catalogos.estadoTexto[e])}</b>${sop ? `<small class="${tiene ? 'ok' : ''}">${tiene ? 'Soporte: ' : 'Exige: '}${esc(SOPORTE_TXT[sop].toLowerCase())}</small>` : e === 'aprobado' ? '<small>Visto bueno de Gerencia</small>' : ''}</div></li>`
  }).join('')}</ol>`
}

function renderOb() {
  const o = ob(abierto.ob)
  if (!o) { cerrar(obDrawer); return }
  $('#ob-kicker').textContent = `${o.tipoTexto} · ${o.entidad}`
  $('#ob-titulo').textContent = o.concepto
  $('#ob-sub').innerHTML = `${esc(o.periodo)} · vence ${esc(o.vence ? fmtDate(o.vence) : 'sin fecha')} · ${plazoHtml(o)}`
  const prep = P().preparar
  const antesDeAprobar = ['pendiente', 'borrador_listo', 'revisado'].includes(o.estado)
  const pagosOb = E.pagos.filter((p) => p.obligacion_id === o.id)
  const docs = E.documentos.filter((d) => d.obligacion_id === o.id || d.creada_obligacion_id === o.id)
  const eventos = E.eventos.filter((e) => e.obligacion_id === o.id)
  const sig = o.siguiente
  let accion = ''
  if (sig === 'aprobado' && o.con_pago) {
    const vigente = pagosOb.find((p) => ['por_aprobar', 'aprobado'].includes(p.estado))
    accion = vigente
      ? `<button type="button" class="btn-primary" data-ver-pago="${vigente.id}">Ver el pago ${esc(PAGO_TXT[vigente.estado].toLowerCase())}</button>`
      : prep ? `<button type="button" class="btn-primary" id="ob-preparar">Preparar pago</button>` : '<p class="muted">Finanzas prepara el pago.</p>'
  } else if (sig === 'aprobado') {
    accion = P().aprobar ? `<button type="button" class="btn-primary" data-avanzar="aprobado">Dar visto bueno</button>` : '<p class="muted">Espera el visto bueno de Gerencia.</p>'
  } else if (sig === 'pagado') {
    const ap = pagosOb.find((p) => p.estado === 'aprobado')
    accion = ap ? `<button type="button" class="btn-primary" data-ver-pago="${ap.id}">Pagar con la lista de verificación</button>` : ''
  } else if (sig && prep) {
    accion = `<button type="button" class="btn-primary" data-avanzar="${sig}">Pasar a ${esc(E.catalogos.estadoTexto[sig].toLowerCase())}</button>`
  }
  const devolver = o.anterior && antesDeAprobar && o.estado !== 'pendiente' && (prep || P().aprobar) ? `<button type="button" class="btn-ghost" id="ob-devolver">Devolver un paso</button>` : ''

  const porConfirmar = o.motivos.length
    ? `<div class="fin-porconf-caja"><b>Fecha por confirmar.</b> Antes de contar con esta fecha:<ul>${o.motivos.map((m) => `<li>${esc(m.texto)}</li>`).join('')}</ul><small>La fecha que vale es la del calendario oficial de la DIAN o de Hacienda.</small></div>`
    : ''
  $('#ob-cuerpo').innerHTML = `
    ${porConfirmar}
    ${pasosHtml(o)}
    <div class="fin-accion">${accion}${devolver}<p class="form-error" id="ob-err"></p></div>
    <div id="ob-extra"></div>

    <fieldset class="grupo">
      <legend>Soportes</legend>
      ${o.soportes.length ? `<ul class="fin-soportes">${o.soportes.map((s) => `<li><span class="fin-sop-tipo">${esc(SOPORTE_TXT[s.tipo] || s.tipo)}</span><a href="${API_ARCHIVO}?soporte=${s.id}" target="_blank" rel="noopener">${esc(s.nombre)}</a><small>${esc(s.subido_por)} · ${esc(fmtCorto(s.created_at.slice(0, 10)))}</small></li>`).join('')}</ul>` : '<p class="muted">Sin soportes todavía.</p>'}
      ${prep ? `<form class="fin-subir-sop" id="sop-form">
        <select name="tipo">${opciones(E.catalogos.soportes.map((t) => [t, SOPORTE_TXT[t]]), o.soporteSiguiente || 'otro')}</select>
        <input type="file" name="archivo" accept="application/pdf,image/png,image/jpeg" required />
        <button type="submit" class="btn-ghost btn-sm">Subir soporte</button>
        <p class="form-error" id="sop-err"></p>
      </form>` : ''}
    </fieldset>

    <form class="grupo" id="ob-datos">
      <legend>Datos</legend>
      <div class="grid2">
        <label>Vence<input type="date" name="vence" value="${esc(o.vence)}" ${prep ? '' : 'disabled'} /></label>
        <label>Responsable<select name="responsable_id" ${prep ? '' : 'disabled'}>${opciones(E.personas.filter((p) => p.rol === 'finanzas' || p.rol === 'admin').map((p) => [p.id, p.nombre]), o.responsable_id, 'Sin asignar')}</select></label>
      </div>
      ${o.con_pago ? `<label>Valor a pagar según el borrador<input name="valor_borrador" inputmode="numeric" value="${o.valor_borrador ?? ''}" ${prep && o.estado === 'pendiente' ? '' : 'disabled'} placeholder="Solo números, en pesos" /><small class="muted">${o.estado === 'pendiente' ? 'Se fija antes de pasar a borrador listo. Es contra este valor que el control revisa el pago.' : `Fijado en ${esc(pesos(o.valor_borrador))}. Para cambiarlo, devuelva la obligación a pendiente.`}</small></label>` : '<p class="muted">Esta obligación no lleva pago: se cierra con el acuse de la entidad.</p>'}
      <label>Notas<textarea name="notas" rows="2" ${prep ? '' : 'disabled'}>${esc(o.notas)}</textarea></label>
      <p class="muted fin-fuente">Fecha: ${esc(o.fuente)}</p>
      ${prep ? `<div class="drawer-actions"><p class="form-error" id="datos-err"></p>${o.estado === 'pendiente' && !o.soportes.length ? '<button type="button" class="btn-ghost danger-txt" id="ob-borrar">Eliminar</button>' : ''}<button type="submit" class="btn-primary">Guardar datos</button></div>` : ''}
    </form>

    ${pagosOb.length ? `<fieldset class="grupo"><legend>Pagos</legend><ul class="fin-lista">${pagosOb.map((p) => `<li><button type="button" class="link-btn" data-ver-pago="${p.id}">Pago #${p.id}</button> ${esc(pesos(p.valor))} · ${pastilla(p.estado, PAGO_TXT[p.estado])}</li>`).join('')}</ul></fieldset>` : ''}
    ${docs.length ? `<fieldset class="grupo"><legend>Documentos leídos</legend><ul class="fin-lista">${docs.map((d) => `<li><a href="${API_ARCHIVO}?documento=${d.id}" target="_blank" rel="noopener">${esc(d.nombre)}</a> · ${esc(DOC_TXT[d.tipo] || 'Documento')}${d.diferencias.some((x) => x.grave) ? ' · <span class="fin-mal">con diferencias</span>' : ''}</li>`).join('')}</ul></fieldset>` : ''}
    ${eventos.length ? `<fieldset class="grupo"><legend>Historial</legend><ul class="fin-hist">${eventos.map((e) => `<li><b>${esc(e.usuario)}</b> ${esc(e.detalle || e.accion)}<small>${esc(new Date(e.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }))}</small></li>`).join('')}</ul></fieldset>` : ''}
  `
  const err = $('#ob-err')
  $$('[data-avanzar]', obDrawer).forEach((b) => b.addEventListener('click', () => conBoton(b, err, () => enviar('avanzar', { id: o.id, destino: b.dataset.avanzar }))))
  $('#ob-devolver')?.addEventListener('click', () => formDevolver(o))
  $('#ob-preparar')?.addEventListener('click', () => formPreparar(o))
  $('#sop-form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const f = e.currentTarget
    const fd = new FormData(f)
    fd.set('obligacion_id', String(o.id))
    fd.set('destino', 'soporte')
    conBoton(f.querySelector('button'), $('#sop-err'), () => subir(fd))
  })
  $('#ob-datos').addEventListener('submit', (e) => {
    e.preventDefault()
    const f = e.currentTarget
    const datos = { id: o.id, vence: f.vence.value, responsable_id: f.responsable_id.value || null, notas: f.notas.value }
    if (f.valor_borrador && !f.valor_borrador.disabled) datos.valor_borrador = soloDigitos(f.valor_borrador.value) ? Number(soloDigitos(f.valor_borrador.value)) : null
    conBoton(f.querySelector('[type=submit]'), $('#datos-err'), async () => { await enviar('editar_obligacion', datos); avisoOk('Datos guardados') })
  })
  $('#ob-borrar')?.addEventListener('click', (e) => confirmar(e.currentTarget, () => conBoton(null, $('#datos-err'), async () => { await enviar('eliminar_obligacion', { id: o.id }); cerrar(obDrawer) })))
}

function confirmar(btn, accion) {
  if (btn.dataset.confirmando) { delete btn.dataset.confirmando; btn.textContent = btn.dataset.texto; return accion() }
  btn.dataset.texto = btn.textContent
  btn.dataset.confirmando = '1'
  btn.textContent = '¿Seguro? Clic de nuevo'
  setTimeout(() => { if (btn.dataset.confirmando) { delete btn.dataset.confirmando; btn.textContent = btn.dataset.texto } }, 3500)
}

function formDevolver(o) {
  $('#ob-extra').innerHTML = `<form class="grupo fin-mini" id="dev-form"><legend>Devolver a ${esc(E.catalogos.estadoTexto[o.anterior].toLowerCase())}</legend>
    <label>¿Qué hay que corregir?<textarea name="motivo" rows="2" required></textarea></label>
    <div class="drawer-actions"><p class="form-error" id="dev-err"></p><button type="submit" class="btn-primary">Devolver</button></div></form>`
  $('#dev-form').addEventListener('submit', (e) => {
    e.preventDefault()
    conBoton(e.currentTarget.querySelector('button'), $('#dev-err'), () => enviar('devolver', { id: o.id, motivo: e.currentTarget.motivo.value }))
  })
}

const CHEQUEO_ICO = (ok) => (ok === true ? '<span class="fin-ck ok" aria-label="Bien">✓</span>' : ok === false ? '<span class="fin-ck mal" aria-label="Falla">✕</span>' : '<span class="fin-ck pend" aria-label="Pendiente">•</span>')
const chequeosHtml = (ch) => `<ul class="fin-chequeos">${ch.map((c) => `<li class="${c.ok === false ? 'mal' : ''}">${CHEQUEO_ICO(c.ok)}<div><b>${esc(c.titulo)}</b><small>${esc(c.detalle)}</small></div></li>`).join('')}</ul>`

function formPreparar(o) {
  const cuentas = E.cuentas.filter((c) => c.activa)
  const ent = E.entidades.filter((x) => x.activa)
  $('#ob-extra').innerHTML = `<form class="grupo fin-mini" id="prep-form"><legend>Preparar pago</legend>
    <p class="muted">Copie los datos del recibo de pago que generó en el portal. El sistema los revisa antes de enviarlos a Gerencia.</p>
    <div class="grid2">
      <label>Valor a pagar<input name="valor" inputmode="numeric" value="${o.valor_borrador ?? ''}" required /><small class="muted" id="prep-valor"></small></label>
      <label>Entidad<select name="entidad">${opciones(ent.map((x) => [x.codigo, x.nombre]), o.entidad)}</select></label>
      <label>Referencia de pago<input name="referencia" placeholder="Número del recibo 490 o del formulario" required /></label>
      <label>Cuenta de origen<select name="cuenta_id" required>${opciones(cuentas.map((c) => [c.id, `${c.alias} (${c.banco} …${c.ultimos})`]), '', 'Elija la cuenta')}</select></label>
    </div>
    <div id="prep-chequeos"></div>
    <div class="drawer-actions"><p class="form-error" id="prep-err"></p><button type="submit" class="btn-primary">Revisar y enviar a Gerencia</button></div></form>`
  const f = $('#prep-form')
  const pinta = () => { $('#prep-valor').textContent = soloDigitos(f.valor.value) ? pesos(soloDigitos(f.valor.value)) : '' }
  f.valor.addEventListener('input', pinta)
  pinta()
  f.addEventListener('submit', (e) => {
    e.preventDefault()
    conBoton(f.querySelector('[type=submit]'), $('#prep-err'), async () => {
      const r = await enviar('preparar_pago', { obligacion_id: o.id, valor: Number(soloDigitos(f.valor.value)), entidad: f.entidad.value, referencia: f.referencia.value, cuenta_id: Number(f.cuenta_id.value) || null })
      if (!r.resultado?.creado) {
        $('#prep-chequeos').innerHTML = `<p class="fin-mal">El control encontró problemas. Corrija antes de enviar:</p>${chequeosHtml(r.resultado.chequeos.filter((c) => c.id !== 'aprobacion'))}`
        return
      }
      avisoOk('Pago enviado a Gerencia para su visto bueno')
      abrirPago(r.resultado.id)
    })
  })
}

/* ---------- Pagos ---------- */
const listaPagos = crearLista({
  el: '#pago-list', chipsEl: '#pago-chips',
  datos: () => E.pagos,
  texto: (p) => [p.obligacion?.concepto, p.referencia, p.preparadoNombre].join(' '),
  vacio: ['Sin pagos', 'Los pagos se preparan desde cada obligación revisada.'],
  chips: [
    { id: 'por_aprobar', lbl: 'Por aprobar', f: (p) => p.estado === 'por_aprobar' },
    { id: 'aprobado', lbl: 'Por pagar', f: (p) => p.estado === 'aprobado' },
    { id: 'pagado', lbl: 'Pagados', f: (p) => p.estado === 'pagado' },
    { id: 'otros', lbl: 'Devueltos y anulados', f: (p) => p.estado === 'rechazado' || p.estado === 'anulado', siHay: true },
    { id: 'todos', lbl: 'Todos', f: () => true },
  ],
  columnas: [
    { k: 'ob', lbl: 'Obligación', html: (p) => `<div class="t1">${esc(p.obligacion?.concepto || 'Obligación eliminada')}</div><div class="t2">${esc(p.obligacion?.periodo || '')}</div>`, orden: (p) => p.obligacion?.concepto || '' },
    { k: 'valor', lbl: 'Valor', cls: 'num der', html: (p) => esc(pesos(p.valor)), orden: (p) => p.valor },
    { k: 'cuenta', lbl: 'Cuenta', html: (p) => esc(cuentaTxt(p.cuenta_id)) },
    { k: 'prep', lbl: 'Preparó', html: (p) => esc(p.preparadoNombre), orden: (p) => p.preparadoNombre },
    { k: 'control', lbl: 'Control', html: (p) => { const ch = p.control?.chequeos || []; const ok = ch.filter((c) => c.ok === true).length; return `<span class="fin-control ${ch.some((c) => c.ok === false) ? 'mal' : ''}">${ok} de ${ch.length}</span>` } },
    { k: 'estado', lbl: 'Estado', html: (p) => pastilla(p.estado, PAGO_TXT[p.estado]), orden: (p) => p.estado },
  ],
  abrir: (id) => abrirPago(Number(id)),
})

const pagoDrawer = $('#pago-drawer')
function abrirPago(id) {
  abierto.pago = id
  renderPago()
  abrir(pagoDrawer)
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-ver-pago]'); if (b) abrirPago(Number(b.dataset.verPago)) })

function renderPago() {
  const p = pago(abierto.pago)
  if (!p) { cerrar(pagoDrawer); return }
  const o = ob(p.obligacion_id)
  $('#pago-titulo').textContent = `${pesos(p.valor)} · ${p.obligacion?.concepto || ''}`
  $('#pago-sub').innerHTML = `${esc(p.obligacion?.periodo || '')} · ${pastilla(p.estado, PAGO_TXT[p.estado])}`
  const yo = E.sesion.usuario
  const ch = p.control?.chequeos || []
  let acciones = ''
  if (p.estado === 'por_aprobar') {
    if (P().aprobar && p.preparado_por !== yo) {
      acciones = `<div class="fin-accion"><button type="button" class="btn-primary" id="pago-aprobar" ${p.control?.listoParaAprobar ? '' : 'disabled'}>Aprobar el pago</button><button type="button" class="btn-ghost" id="pago-rechazar">Devolver a Finanzas</button><p class="form-error" id="pago-err"></p></div><div id="pago-extra"></div>`
    } else if (P().aprobar) {
      acciones = '<p class="fin-aviso warn">Usted preparó este pago: lo debe aprobar otra persona de Gerencia.</p>'
    } else {
      acciones = `<p class="muted">Esperando el visto bueno de Gerencia.</p>${P().preparar ? `<div class="fin-accion"><button type="button" class="btn-ghost" id="pago-anular">Anular para corregir</button><p class="form-error" id="pago-err"></p></div>` : ''}`
    }
  } else if (p.estado === 'aprobado') {
    const pasos = p.control?.pasos || []
    const grupos = [...new Set(pasos.map((x) => x.pantalla))]
    const tieneComprobante = o?.soportes.some((s) => s.tipo === 'comprobante' && s.created_at >= p.aprobado_at)
    acciones = P().preparar ? `
      <form class="grupo" id="verif-form">
        <legend>Lista de verificación antes de confirmar</legend>
        <p class="muted">Pague en el portal y en el banco como siempre. En cada pantalla compare con estos datos y marque. Si algo no coincide, no confirme el pago.</p>
        ${grupos.map((g) => `<div class="fin-verif-grupo"><h4>${esc(g)}</h4>${pasos.filter((x) => x.pantalla === g).map((x) => `<label class="fin-check"><input type="checkbox" name="v" value="${esc(x.id)}" /><span>${esc(x.texto)}</span></label>`).join('')}</div>`).join('')}
        <div class="fin-verif-grupo"><h4>Comprobante del banco</h4>
          ${tieneComprobante ? '<p class="fin-bien">Comprobante subido.</p>' : `<div class="fin-subir-sop"><input type="file" id="comp-archivo" accept="application/pdf,image/png,image/jpeg" /><button type="button" class="btn-ghost btn-sm" id="comp-subir">Subir comprobante</button></div>`}
        </div>
        <div class="drawer-actions"><p class="form-error" id="verif-err"></p><button type="submit" class="btn-primary">Registrar el pago</button></div>
      </form>` : '<p class="muted">Aprobado: Finanzas paga con la lista de verificación.</p>'
  } else if (p.estado === 'rechazado') {
    acciones = `<p class="fin-aviso warn">Devuelto por Gerencia: ${esc(p.motivo_rechazo)}</p>${P().preparar && o?.estado === 'revisado' ? '<button type="button" class="btn-primary" id="pago-rehacer">Preparar de nuevo</button>' : ''}`
  } else if (p.estado === 'pagado') {
    acciones = `<p class="fin-aviso ok">Pagado y registrado el ${esc(fmtDate(p.pagado_at.slice(0, 10)))}. ${o && o.estado === 'pagado' ? 'Falta subir el acuse de la entidad en el expediente para cerrar la obligación.' : ''}</p>`
  }
  $('#pago-cuerpo').innerHTML = `
    <dl class="fin-dl">
      <dt>Valor</dt><dd>${esc(pesos(p.valor))}</dd>
      <dt>Entidad</dt><dd>${esc(E.entidades.find((x) => x.codigo === p.entidad)?.nombre || p.entidad)}</dd>
      <dt>Referencia</dt><dd class="mono">${esc(p.referencia)}</dd>
      <dt>Cuenta de origen</dt><dd>${esc(cuentaTxt(p.cuenta_id))}</dd>
      <dt>Preparó</dt><dd>${esc(p.preparadoNombre)} · ${esc(fmtCorto(p.preparado_at.slice(0, 10)))}</dd>
      ${p.aprobadoNombre ? `<dt>Aprobó</dt><dd>${esc(p.aprobadoNombre)} · ${esc(fmtCorto(p.aprobado_at.slice(0, 10)))}</dd>` : ''}
    </dl>
    <fieldset class="grupo"><legend>Control antes de pagar</legend>${chequeosHtml(ch)}</fieldset>
    ${acciones}
    ${o ? `<p><button type="button" class="link-btn" data-ver-ob="${o.id}">Abrir el expediente de la obligación</button></p>` : ''}
  `
  const err = $('#pago-err')
  $('#pago-aprobar')?.addEventListener('click', (e) => conBoton(e.currentTarget, err, async () => { await enviar('aprobar_pago', { id: p.id }); avisoOk('Pago aprobado. Finanzas ya puede pagar.') }))
  $('#pago-rechazar')?.addEventListener('click', () => {
    $('#pago-extra').innerHTML = `<form class="grupo fin-mini" id="rech-form"><legend>Devolver a Finanzas</legend><label>Motivo<textarea name="motivo" rows="2" required></textarea></label><div class="drawer-actions"><p class="form-error" id="rech-err"></p><button type="submit" class="btn-primary">Devolver</button></div></form>`
    $('#rech-form').addEventListener('submit', (e) => { e.preventDefault(); conBoton(e.currentTarget.querySelector('button'), $('#rech-err'), () => enviar('rechazar_pago', { id: p.id, motivo: e.currentTarget.motivo.value })) })
  })
  $('#pago-anular')?.addEventListener('click', (e) => confirmar(e.currentTarget, () => conBoton(null, err, () => enviar('anular_pago', { id: p.id }))))
  $('#pago-rehacer')?.addEventListener('click', () => { cerrar(pagoDrawer); abrirOb(o.id); formPreparar(o) })
  $('#comp-subir')?.addEventListener('click', (e) => {
    const file = $('#comp-archivo').files[0]
    if (!file) { $('#verif-err').textContent = 'Elija el archivo del comprobante.'; return }
    const marcados = $$('#verif-form input[name=v]:checked').map((x) => x.value)
    const fd = new FormData()
    fd.set('archivo', file); fd.set('obligacion_id', String(p.obligacion_id)); fd.set('tipo', 'comprobante'); fd.set('destino', 'soporte')
    conBoton(e.currentTarget, $('#verif-err'), async () => {
      await subir(fd)
      // Repintar borra lo marcado: se restaura.
      marcados.forEach((v) => { const i = $(`#verif-form input[value="${v}"]`); if (i) i.checked = true })
    })
  })
  $('#verif-form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const marcados = $$('#verif-form input[name=v]:checked').map((x) => x.value)
    conBoton(e.currentTarget.querySelector('[type=submit]'), $('#verif-err'), async () => { await enviar('registrar_pago', { id: p.id, verificacion: marcados }); avisoOk('Pago registrado') })
  })
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-ver-ob]'); if (b) { cerrar(pagoDrawer); abrirOb(Number(b.dataset.verOb)) } })

/* ---------- Documentos ---------- */
function renderDocumentos() {
  const f = $('#doc-form')
  f.obligacion_id.innerHTML = opciones(E.obligaciones.filter((o) => o.nivel !== 'cerrada' || o.vence >= E.hoy.slice(0, 4)).map((o) => [o.id, `${o.concepto} · ${o.periodo}`]), f.obligacion_id.value, 'Ninguna (o es un requerimiento nuevo)')
  f.hidden = !P().preparar
  $('#doc-ia').textContent = E.ia.activa
    ? `Lectura con IA activa. Gasto de este mes: US$${E.ia.gastoMes.toFixed(2)} de US$${E.ia.tope}.`
    : 'La lectura con IA no está activa en este entorno: los documentos se guardan para revisarlos a mano.'
  const cont = $('#doc-list')
  if (!E.documentos.length) { cont.innerHTML = '<div class="vacio"><b>Sin documentos leídos</b>Suba una declaración, un recibo o un requerimiento.</div>'; return }
  cont.innerHTML = E.documentos.map((d) => {
    const x = d.extraccion
    const graves = d.diferencias.filter((z) => z.grave)
    const filas = x ? [
      ['Tipo', DOC_TXT[x.tipo_documento]], ['Entidad', x.entidad], ['NIT', x.nit], ['Formulario', x.formulario], ['Concepto', x.concepto], ['Periodo', x.periodo],
      ['Valor', x.valor_total == null ? '' : pesos(x.valor_total)], ['Referencia', x.referencia], ['Fecha', x.fecha_documento], ['Notificación', x.fecha_notificacion],
      ['Plazo', x.plazo_cantidad ? `${x.plazo_cantidad} ${({ dias_habiles: 'días hábiles', dias_calendario: 'días calendario', meses: 'meses' })[x.plazo_unidad] || ''}` : ''], ['Qué pide', x.que_pide],
    ].filter(([, v]) => v) : []
    const estadoTxt = { leido: graves.length ? 'Con diferencias' : 'Leído', pendiente: 'Leyendo', sin_clave: 'Revisión manual', tope: 'Tope del mes', error: 'Error' }[d.estado]
    const punto = { leido: graves.length ? 'cancelada' : 'activa', pendiente: 'solicitada', sin_clave: 'borrador', tope: 'borrador', error: 'cancelada' }[d.estado]
    const obRel = ob(d.obligacion_id)
    const req = x?.tipo_documento === 'requerimiento'
    return `<article class="dash-card fin-doc">
      <header class="dash-head"><div><h3><a href="${API_ARCHIVO}?documento=${d.id}" target="_blank" rel="noopener">${esc(d.nombre)}</a></h3><p>${esc(x?.resumen || d.error || '')}</p></div>${pastilla(punto, estadoTxt)}</header>
      ${filas.length ? `<dl class="fin-dl">${filas.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
      ${d.diferencias.length ? `<ul class="fin-difs">${d.diferencias.map((z) => `<li class="${z.grave ? 'mal' : ''}"><b>${esc(z.campo)}</b>: se esperaba ${esc(z.esperado)} y el documento dice ${esc(z.encontrado)}</li>`).join('')}</ul>` : d.estado === 'leido' ? '<p class="fin-bien">No encontré diferencias con lo esperado.</p><p class="muted fin-nota">La lectura la hace la IA: compare igual con el documento original.</p>' : ''}
      <div class="fin-doc-pie">
        ${obRel ? `<span>Obligación: <button type="button" class="link-btn" data-ver-ob="${obRel.id}">${esc(obRel.concepto)} · ${esc(obRel.periodo)}</button></span>` : ''}
        ${d.creada_obligacion_id ? `<span class="fin-bien">Alerta creada: <button type="button" class="link-btn" data-ver-ob="${d.creada_obligacion_id}">ver la obligación</button></span>` : ''}
        ${req && !d.creada_obligacion_id && P().preparar ? `<form class="fin-inline" data-req="${d.id}"><label>Fecha de notificación<input type="date" name="fecha" value="${esc(x.fecha_notificacion)}" required /></label><button class="btn-primary btn-sm">Calcular plazo y crear alerta</button></form>` : ''}
        ${P().preparar && !req ? `<form class="fin-inline" data-asociar="${d.id}"><select name="obligacion_id">${opciones(E.obligaciones.map((o) => [o.id, `${o.concepto} · ${o.periodo}`]), d.obligacion_id, 'Sin asociar')}</select><button class="btn-ghost btn-sm">Comparar con esta</button></form>` : ''}
        ${P().preparar && ['sin_clave', 'tope', 'error'].includes(d.estado) ? `<button type="button" class="btn-ghost btn-sm" data-reintentar="${d.id}">Leer de nuevo</button>` : ''}
        <small class="muted">${esc(fmtCorto(d.created_at.slice(0, 10)))}${d.costo_usd ? ` · US$${d.costo_usd.toFixed(3)}` : ''}</small>
      </div>
    </article>`
  }).join('')
}
$('#doc-form').addEventListener('submit', (e) => {
  e.preventDefault()
  const f = e.currentTarget
  const fd = new FormData(f)
  fd.set('destino', 'documento')
  conBoton(f.querySelector('[type=submit]'), $('#doc-err'), async () => { await subir(fd); f.reset(); avisoOk('Documento leído') })
})
$('#doc-list').addEventListener('submit', (e) => {
  const f = e.target
  e.preventDefault()
  if (f.dataset.req) conBoton(f.querySelector('button'), null, async () => { await enviar('requerimiento_alerta', { id: Number(f.dataset.req), fecha_notificacion: f.fecha.value }); avisoOk('Alerta creada en el calendario') })
  if (f.dataset.asociar) conBoton(f.querySelector('button'), null, () => enviar('asociar_documento', { id: Number(f.dataset.asociar), obligacion_id: Number(f.obligacion_id.value) || null }))
})
$('#doc-list').addEventListener('click', (e) => { const b = e.target.closest('[data-reintentar]'); if (b) conBoton(b, null, () => enviar('reintentar_documento', { id: Number(b.dataset.reintentar) })) })

/* ---------- Proveedores (Siigo) ---------- */
// La revisión no viene en el estado del panel: se pide a Siigo con el botón
// (cada consulta gasta peticiones del tope de Siigo, 100 por minuto).
let SG = null // { revision, cifras }
let sgCargando = false
const ALERTA_PUNTO = { factura_repetida: 'cancelada', egreso_repetido: 'cancelada', pagada_de_mas: 'cancelada', posible_duplicado: 'solicitada', vencida: 'borrador', por_vencer: 'activa' }
const ALERTA_CORTO = { factura_repetida: 'Factura doble', egreso_repetido: 'Pago doble', pagada_de_mas: 'Pagada de más', posible_duplicado: 'Revisar', vencida: 'Vencida', por_vencer: 'Por vencer' }
const puedeSiigo = () => P().preparar || P().aprobar

async function consultarSiigo() {
  if (sgCargando) return
  sgCargando = true
  renderSiigo()
  try {
    const r = await enviar('siigo_revisar', { mes: $('#sg-mes').value || E.hoy.slice(0, 7) })
    SG = r.resultado
  } catch (e) { avisoError(e) } finally { sgCargando = false; renderSiigo() }
}

function sinDatos(txt) {
  $('#sg-kpis').innerHTML = ''
  for (const id of ['#sg-alertas', '#sg-proveedores', '#sg-cifras']) $(id).innerHTML = `<p class="muted">${esc(txt)}</p>`
}

function renderSiigo() {
  const conectado = E.entorno.siigo
  const est = $('#sg-estado')
  const fb = $('#sg-balance')
  if (!$('#sg-mes').value) $('#sg-mes').value = E.hoy.slice(0, 7)
  if (!fb.anio.value) { fb.anio.value = E.hoy.slice(0, 4); fb.mes_fin.value = Number(E.hoy.slice(5, 7)) }
  $$('#sg-verificar, #sg-balance').forEach((f) => { f.hidden = !conectado || !puedeSiigo() })
  if (!conectado) {
    est.innerHTML = `<div class="fin-aviso info"><span>${E.sesion.rol === 'admin'
      ? 'Siigo no está conectado en este entorno. Faltan SIIGO_USERNAME y SIIGO_ACCESS_KEY en Vercel. Se generan en Siigo Nube: menú Alianzas, botón Mi credencial API (en versiones recientes, Configuración, Alianzas e integraciones, Credenciales de integración).'
      : 'Siigo todavía no está conectado. Cuando el administrador agregue las credenciales, aquí aparecerán las cuentas por pagar.'}</span></div>`
    sinDatos('Sin conexión con Siigo.')
    return
  }
  const rv = SG?.revision
  const cuando = rv ? new Date(rv.consultado).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }) : ''
  const txt = sgCargando ? 'Consultando Siigo…' : rv ? `Consultado el ${cuando} · compras y pagos desde el ${fmtCorto(rv.desde)}` : 'Siigo conectado. Consulte para ver las cuentas por pagar y las alertas.'
  est.innerHTML = `<div class="fin-sg-barra"><span>${esc(txt)}</span>${puedeSiigo() ? `<button type="button" class="btn-primary btn-sm" id="sg-consultar" ${sgCargando ? 'disabled' : ''}>${rv ? 'Consultar de nuevo' : 'Consultar Siigo'}</button>` : ''}</div>${rv?.truncado ? '<div class="fin-aviso warn"><span>Siigo devolvió más documentos de los que se leen en una consulta: los totales pueden estar incompletos.</span></div>' : ''}`
  const cuenta = $('[data-cuenta="proveedores"]')
  if (cuenta) { cuenta.hidden = !rv?.totales.graves; cuenta.textContent = rv?.totales.graves || '' }
  if (!rv) { sinDatos('Todavía no se ha consultado.'); return }
  const t = rv.totales
  const k = [
    ['Por pagar a proveedores', pesos(t.porPagar), '#2f80c9', `${t.facturas} factura${t.facturas === 1 ? '' : 's'} con saldo`, false],
    ['Vencido', pesos(t.vencido), '#d8453a', 'Saldo con fecha pasada', t.vencido > 0],
    ['Vence en 7 días', pesos(t.porVencer), '#e8920c', 'Para programar el pago', false],
    ['Posibles dobles', t.graves, '#8b5cf6', 'Facturas o pagos repetidos', t.graves > 0],
  ]
  $('#sg-kpis').innerHTML = k.map(([l, n, c, sub, alerta]) => `<div class="kpi${alerta ? ' is-alerta' : ''}" style="--c:${c}"><span class="kpi-lbl">${esc(l)}</span><span class="kpi-num">${esc(n)}</span><span class="kpi-sub">${esc(sub)}</span></div>`).join('')
  $('#sg-alertas').innerHTML = rv.alertas.length
    ? `<ul class="fin-sg-alertas">${rv.alertas.slice(0, 60).map((a) => `<li class="${a.grave ? 'mal' : ''}"><div class="fin-sg-alerta-head">${pastilla(ALERTA_PUNTO[a.tipo], ALERTA_CORTO[a.tipo])}<b>${esc(a.proveedorNombre)}</b><span class="fin-sg-valor">${esc(pesos(a.valor))}</span></div><small>${esc(a.detalle)}</small></li>`).join('')}</ul>${rv.alertas.length > 60 ? `<p class="muted fin-nota">Y ${rv.alertas.length - 60} más.</p>` : ''}`
    : `<p class="fin-bien">Siigo no muestra alertas con lo consultado (compras y pagos desde el ${esc(fmtCorto(rv.desde))}).</p><p class="muted fin-nota">Solo se revisa lo registrado en Siigo: no reemplaza la revisión de Finanzas.</p>`
  $('#sg-proveedores').innerHTML = rv.proveedores.length
    ? `<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Proveedor</th><th class="num">Por pagar</th><th class="num">Vencido</th><th class="num">Facturas</th><th>Próximo vencimiento</th></tr></thead><tbody>${rv.proveedores.map((p) => `<tr><td><div class="t1">${esc(p.nombre)}</div><div class="t2">NIT ${esc(p.proveedor)}</div></td><td class="num">${esc(pesos(p.porPagar))}</td><td class="num${p.vencido ? ' fin-mal' : ''}">${p.vencido ? esc(pesos(p.vencido)) : '-'}</td><td class="num">${p.facturas}</td><td class="nw">${p.proximoVence ? esc(fmtCorto(p.proximoVence)) : '-'}</td></tr>`).join('')}</tbody></table></div>`
    : '<p class="muted">No hay cuentas por pagar con saldo en Siigo.</p>'
  const c = SG.cifras
  $('#sg-cifras').innerHTML = c
    ? `<dl class="fin-dl"><dt>Ventas facturadas</dt><dd>${esc(pesos(c.ventas))} <span class="muted">en ${c.facturasVenta} facturas</span></dd><dt>Facturas de compra</dt><dd>${esc(pesos(c.compras))} <span class="muted">en ${c.facturasCompra} facturas</span></dd><dt>Pagos registrados</dt><dd>${esc(pesos(c.pagos))} <span class="muted">en ${c.egresos} egresos</span></dd></dl><p class="muted fin-nota">Ventas antes de notas crédito. Los pagos son los recibos de pago o egreso del mes, a cualquier tercero.</p>${c.truncado ? '<p class="muted fin-nota">Hay más documentos de los que se leen: las cifras pueden estar incompletas.</p>' : ''}`
    : '<p class="muted">Sin cifras.</p>'
}
document.addEventListener('click', (e) => { if (e.target.closest('#sg-consultar')) consultarSiigo() })
$('#sg-mes').addEventListener('change', () => { if (SG) consultarSiigo() })
$('#sg-verificar').addEventListener('submit', (e) => {
  e.preventDefault()
  const f = e.currentTarget
  const out = $('#sg-verificacion')
  conBoton(f.querySelector('[type=submit]'), $('#sg-verificar-err'), async () => {
    out.innerHTML = '<p class="muted">Revisando en Siigo…</p>'
    try {
      const r = await enviar('siigo_verificar_pago', { nit: soloDigitos(f.nit.value), factura: f.factura.value, valor: soloDigitos(f.valor.value) })
      const v = r.resultado
      out.innerHTML = `${v.incompleto ? '<p class="muted fin-nota">Siigo devolvió más documentos de los que se leen: la revisión puede estar incompleta.</p>' : ''}<p class="${v.ok ? 'fin-bien' : 'fin-mal'} fin-sg-veredicto">${v.ok ? `No encontré problemas en Siigo con estos datos para ${esc(v.proveedorNombre)}. Esto no reemplaza su revisión: compare la factura, el valor y la cuenta del proveedor antes de pagar.` : 'No pague todavía: revise lo marcado.'}</p>${chequeosHtml(v.chequeos)}`
    } catch (err) { out.innerHTML = ''; throw err }
  })
})
$('#sg-balance').addEventListener('submit', (e) => {
  e.preventDefault()
  const f = e.currentTarget
  conBoton(f.querySelector('[type=submit]'), $('#sg-balance-err'), async () => {
    const r = await enviar('siigo_balance', { anio: Number(f.anio.value), mes_inicio: Number(f.mes_inicio.value), mes_fin: Number(f.mes_fin.value), nit: soloDigitos(f.nit.value) })
    $('#sg-balance-out').innerHTML = `<p class="fin-bien">Listo. <a href="${esc(r.resultado.url)}" target="_blank" rel="noopener">Descargar el balance en Excel</a></p><p class="muted fin-nota">El enlace lo genera Siigo y puede vencer: descárguelo ahora.</p>`
  })
})

/* ---------- Resúmenes ---------- */
const masDias = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const filasResumen = (obs) => obs.length ? `<ul class="fin-lista">${obs.map((o) => `<li><button type="button" class="link-btn" data-ver-ob="${o.id}">${esc(o.concepto)}</button> <span class="muted">${esc(o.periodo)}</span> · ${esc(fmtCorto(o.vence))} · ${plazoHtml(o)}</li>`).join('')}</ul>` : '<p class="muted">Nada.</p>'
function renderResumenes() {
  const abiertas = E.obligaciones.filter((o) => o.nivel !== 'cerrada' && o.vence)
  const hasta = masDias(E.hoy, 14)
  $('#res-semanal').innerHTML = `<h4 class="fin-h4 mal">Atrasadas</h4>${filasResumen(abiertas.filter((o) => o.vence < E.hoy))}<h4 class="fin-h4">Próximas dos semanas</h4>${filasResumen(abiertas.filter((o) => o.vence >= E.hoy && o.vence <= hasta))}`
  const fuentes = [E.entorno.siigo && 'Siigo (ventas, compras, egresos y cuentas por pagar)', E.entorno.books && 'Zoho Books (facturación, recaudo y cartera)'].filter(Boolean)
  $('#res-mensual').innerHTML = `<p>${fuentes.length ? `El resumen trae las cifras de ${fuentes.join(' y de ')}.` : 'Siigo y Zoho Books todavía no están conectados: el resumen sale con el estado de las obligaciones y sin cifras.'}</p>`
  const av = E.avisos
  $('#res-avisos').innerHTML = av.length ? `<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Aviso</th><th>Para</th><th>Cuándo</th><th>Envío</th></tr></thead><tbody>${av.map((a) => {
    const o = a.obligacion_id ? ob(a.obligacion_id) : null
    const que = o ? `${o.concepto} · ${o.periodo} (a ${a.umbral} día${a.umbral === 1 ? '' : 's'} hábil${a.umbral === 1 ? '' : 'es'})` : a.clave.startsWith('semanal') ? 'Resumen del lunes' : 'Resumen del mes'
    return `<tr><td><div class="t1">${esc(que)}</div>${a.escalado ? '<div class="t2 fin-mal">Con Gerencia</div>' : ''}</td><td class="t2">${esc(a.destinatarios)}</td><td class="nw">${esc(new Date(a.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }))}</td><td>${a.enviado ? pastilla('activa', 'Enviado') : pastilla('cancelada', 'No salió')}</td></tr>`
  }).join('')}</tbody></table></div>` : '<p class="muted">Todavía no se ha enviado ningún aviso.</p>'
  $('#res-bitacora').innerHTML = E.eventos.length ? `<ul class="fin-hist">${E.eventos.slice(0, 80).map((e) => `<li><b>${esc(e.usuario)}</b> ${esc(e.detalle || e.accion)}${e.obligacion_id ? ` <button type="button" class="link-btn" data-ver-ob="${e.obligacion_id}">ver</button>` : ''}<small>${esc(new Date(e.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }))}</small></li>`).join('')}</ul>` : '<p class="muted">Sin movimientos.</p>'
  $$('[data-resumen]').forEach((b) => { b.hidden = !(P().preparar || P().aprobar) })
}
$$('[data-resumen]').forEach((b) => b.addEventListener('click', () => conBoton(b, null, async () => { await enviar('enviar_resumen', { tipo: b.dataset.resumen }); avisoOk('Resumen enviado') })))

/* ---------- Revisión del contador ---------- */
function renderRevision() {
  const cont = $('#revision')
  if (!cont) return
  const anioHoy = Number(E.hoy.slice(0, 4))
  const anios = [...new Set([...E.revisionCalendario.map((r) => Number(r.anio)), anioHoy, anioHoy + 1])].filter((a) => a >= anioHoy - 1).sort()
  const filas = anios.map((a) => {
    const r = E.revisionCalendario.find((x) => Number(x.anio) === a)
    const rev = r?.revision
    const estado = rev
      ? `Revisado por ${esc(rev.contador)} · constancia del ${esc(fmtCorto(rev.fecha.slice(0, 10)))}`
      : r?.abiertas ? '<span class="fin-mal">Sin revisión del contador</span>' : '<span class="muted">Sin obligaciones cargadas</span>'
    const pend = r?.porConfirmar ? ` · <span class="fin-porconf">${r.porConfirmar} por confirmar</span>` : ''
    return `<li><b>${a}</b> ${estado}${pend}</li>`
  }).join('')
  cont.innerHTML = `<ul class="fin-lista fin-rev-lista">${filas}</ul>
    ${P().revision ? `<form id="revision-form" class="fin-form">
      <div class="grid2"><label>Año<select name="anio">${opciones(anios.map((a) => [a, String(a)]), anioHoy)}</select></label><label>Contador que revisó<input name="contador" required minlength="3" maxlength="120" /></label></div>
      <label>Nota (opcional)<input name="nota" maxlength="500" placeholder="Por ejemplo: revisó IVA, retención e ICA" /></label>
      <label class="fin-check"><input type="checkbox" name="confirmo" required /><span>El contador comparó las fechas de ese año con el calendario oficial de la DIAN y de la Secretaría de Hacienda.</span></label>
      <button type="submit" class="btn-primary">Dejar constancia</button>
      <p class="form-error" id="revision-err"></p>
    </form>` : '<p class="muted">La constancia la deja Finanzas o Gerencia.</p>'}`
  $('#revision-form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const f = e.currentTarget
    conBoton(f.querySelector('[type=submit]'), $('#revision-err'), async () => {
      await enviar('registrar_revision', { anio: Number(f.anio.value), contador: f.contador.value, nota: f.nota.value, confirmo: f.confirmo.checked })
      avisoOk('Constancia guardada')
    })
  })
}

/* ---------- Ajustes ---------- */
function renderAjustes() {
  const c = E.config
  const dis = P().configurar ? '' : 'disabled'
  const ck = (k, t) => `<label class="fin-check"><input type="checkbox" name="${k}" ${c[k] ? 'checked' : ''} ${dis} /><span>${esc(t)}</span></label>`
  $('#config-form').innerHTML = `
    <div class="grid2"><label>NIT (sin dígito de verificación)<input name="nit" value="${esc(c.nit)}" inputmode="numeric" ${dis} /></label><label>Dígito de verificación<input name="dv" value="${esc(c.dv)}" maxlength="1" inputmode="numeric" ${dis} /></label></div>
    <p class="muted fin-nota">Las fechas de la DIAN dependen del último dígito (${esc(String(c.nit).slice(-1))}); la exógena y la PILA, de los dos últimos (${esc(String(c.nit).slice(-2))}).</p>
    <div class="fin-checks">
      ${ck('retencion', 'Agente de retención en la fuente (mensual)')}
      ${ck('renta', 'Declara renta como persona jurídica')}
      ${ck('granContribuyente', 'Gran contribuyente (renta en tres cuotas)')}
      ${ck('activosExterior', 'Declara activos en el exterior')}
      ${ck('exogena', 'Reporta información exógena')}
      ${ck('pila', 'Paga seguridad social de empleados (PILA)')}
      ${ck('rub', 'Informante de beneficiarios finales (RUB)')}
      ${ck('reteica', 'Agente de retención de ICA en Bogotá')}
    </div>
    <div class="grid2">
      <label>IVA<select name="iva" ${dis}>${opciones([['bimestral', 'Bimestral'], ['cuatrimestral', 'Cuatrimestral'], ['no', 'No responsable']], c.iva)}</select></label>
      <label>ICA Bogotá<select name="ica" ${dis}>${opciones([['bimestral', 'Bimestral'], ['anual', 'Anual'], ['no', 'No declara']], c.ica)}</select></label>
    </div>
    <label>Tope mensual de la lectura con IA (dólares)<input name="topeIaUsd" type="number" min="0" step="1" value="${esc(c.topeIaUsd)}" ${E.sesion.rol === 'admin' ? '' : 'disabled'} /><small class="muted">Gasto de este mes: US$${E.ia.gastoMes.toFixed(2)}. Si se llega al tope, los documentos se revisan a mano hasta el mes siguiente.</small></label>
    ${ck('confirmado', 'Las responsabilidades están confirmadas con el RUT')}
    ${P().configurar ? '<div class="drawer-actions"><p class="form-error" id="config-err"></p><button type="submit" class="btn-primary">Guardar ajustes</button></div>' : '<p class="muted">Los ajustes los cambia Gerencia.</p>'}`

  const anio = Number(E.hoy.slice(0, 4))
  $('#sembrar-form').innerHTML = `
    <label>Año<select name="anio">${opciones([[anio, String(anio)], [anio + 1, String(anio + 1)]], anio + (E.hoy.slice(5, 7) >= '11' ? 1 : 0))}</select></label>
    <label>Responsable<select name="responsable_id">${opciones(E.personas.filter((p) => p.rol === 'finanzas').map((p) => [p.id, p.nombre]), E.personas.find((p) => p.rol === 'finanzas')?.id, 'Sin asignar')}</select></label>
    <button type="submit" class="btn-primary" ${P().preparar || P().aprobar ? '' : 'disabled'}>Cargar el año</button>
    <p class="form-error" id="sembrar-err"></p>`
  $('#faltantes').innerHTML = E.faltantes.length ? `<div class="fin-faltan"><b>Se cargan a mano cuando salgan:</b><ul>${E.faltantes.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''

  const ds = E.destinos
  const grupo = (g, t) => `<h4 class="fin-h4">${t}</h4><ul class="fin-destinos">${ds.filter((d) => d.grupo === g).map((d) => `<li class="${d.activo ? '' : 'off'}">
      <div><b>${esc(d.nombre || 'Correo agregado')}</b><small>${esc(d.correo || 'Sin correo: su usuario no es un correo')}</small></div>
      <div class="fin-dest-acc">
        <button type="button" class="link-btn" data-dest-edit="${g}|${d.usuario_id ?? ''}|${d.ajuste_id ?? ''}|${esc(d.correo)}">${d.correo ? 'Cambiar' : 'Escribir correo'}</button>
        ${d.origen === 'usuario' ? `<button type="button" class="link-btn" data-dest-toggle="${g}|${d.usuario_id}|${d.activo ? 0 : 1}|${esc(d.correo)}">${d.activo ? 'Quitar de avisos' : 'Volver a avisar'}</button>` : `<button type="button" class="link-btn danger-txt" data-dest-del="${d.ajuste_id}">Quitar</button>`}
      </div></li>`).join('') || '<li class="muted">Nadie todavía.</li>'}</ul>
    <form class="fin-inline" data-dest-add="${g}"><input type="email" name="correo" placeholder="otro@correo.com" required /><button class="btn-ghost btn-sm">Agregar</button></form>`
  $('#destinos').innerHTML = grupo('finanzas', 'Finanzas (todos los avisos)') + grupo('gerencia', 'Gerencia (escalamiento a 3 días, pagos por aprobar y resúmenes)')

  const aut = P().autorizar
  $('#nueva-cuenta').hidden = !aut
  $('#nueva-entidad').hidden = !aut
  $('#cuentas').innerHTML = E.cuentas.length ? `<ul class="fin-destinos">${E.cuentas.map((c) => `<li class="${c.activa ? '' : 'off'}"><div><b>${esc(c.alias)}</b><small>${esc(c.banco)} · ${esc(c.tipo)} · terminada en ${esc(c.ultimos)}${c.activa ? '' : ' · desactivada'}</small></div>${aut ? `<button type="button" class="link-btn" data-cuenta="${c.id}">Editar</button>` : ''}</li>`).join('')}</ul>` : '<p class="muted">Sin cuentas autorizadas.</p>'
  $('#entidades').innerHTML = `<ul class="fin-destinos">${E.entidades.map((x) => `<li class="${x.activa ? '' : 'off'}"><div><b>${esc(x.nombre)}</b><small>${esc(x.codigo)}${x.nit ? ` · NIT ${esc(x.nit)}` : ''} · ${esc(x.formulario_pago)}</small></div>${aut ? `<button type="button" class="link-btn" data-entidad="${esc(x.codigo)}">Editar</button>` : ''}</li>`).join('')}</ul>`
}

$('#config-form').addEventListener('submit', (e) => {
  e.preventDefault()
  const f = e.currentTarget
  const config = { nit: f.nit.value, dv: f.dv.value, iva: f.iva.value, ica: f.ica.value, topeIaUsd: Number(f.topeIaUsd.value) }
  for (const k of ['retencion', 'renta', 'granContribuyente', 'activosExterior', 'exogena', 'pila', 'reteica', 'rub', 'confirmado']) config[k] = f[k].checked
  conBoton(f.querySelector('[type=submit]'), $('#config-err'), async () => { await enviar('guardar_config', { config }); avisoOk('Ajustes guardados') })
})
$('#sembrar-form').addEventListener('submit', (e) => {
  e.preventDefault()
  const f = e.currentTarget
  conBoton(f.querySelector('button'), $('#sembrar-err'), async () => {
    const r = await enviar('sembrar_anio', { anio: Number(f.anio.value), responsable_id: Number(f.responsable_id.value) || null })
    avisoOk(r.resultado.nuevas ? `${r.resultado.nuevas} obligaciones nuevas en el calendario` : 'El calendario de ese año ya estaba cargado')
  })
})
$('#destinos').addEventListener('click', (e) => {
  const ed = e.target.closest('[data-dest-edit]')
  if (ed) {
    const [grupo, uid, ajuste, correo] = ed.dataset.destEdit.split('|')
    // Sin diálogos del navegador: el correo se edita en línea.
    const li = ed.closest('li')
    li.querySelector('small').outerHTML = `<form class="fin-inline" data-dest-save="${grupo}|${uid}|${ajuste}"><input type="email" name="correo" value="${esc(correo)}" required /><button class="btn-primary btn-sm">Guardar</button></form>`
    return
  }
  const tg = e.target.closest('[data-dest-toggle]')
  if (tg) {
    const [grupo, uid, activo, correo] = tg.dataset.destToggle.split('|')
    conBoton(tg, null, () => enviar('guardar_destinatario', { grupo, usuario_id: Number(uid), correo, activo: activo === '1' }))
    return
  }
  const del = e.target.closest('[data-dest-del]')
  if (del) confirmar(del, () => conBoton(null, null, () => enviar('eliminar_destinatario', { id: Number(del.dataset.destDel) })))
})
$('#destinos').addEventListener('submit', (e) => {
  e.preventDefault()
  const f = e.target
  if (f.dataset.destAdd) conBoton(f.querySelector('button'), null, () => enviar('guardar_destinatario', { grupo: f.dataset.destAdd, correo: f.correo.value }))
  if (f.dataset.destSave) {
    const [grupo, uid, ajuste] = f.dataset.destSave.split('|')
    const datos = uid ? { grupo, usuario_id: Number(uid), correo: f.correo.value, activo: true } : { id: Number(ajuste), grupo, correo: f.correo.value, activo: true }
    conBoton(f.querySelector('button'), null, () => enviar('guardar_destinatario', datos))
  }
})

const autDrawer = $('#aut-drawer')
function abrirCuenta(c) {
  $('#aut-titulo').textContent = c ? 'Editar cuenta' : 'Nueva cuenta autorizada'
  $('#aut-form').innerHTML = `<input type="hidden" name="tipoForm" value="cuenta" /><input type="hidden" name="id" value="${c?.id ?? ''}" />
    <label>Nombre corto<input name="alias" value="${esc(c?.alias || '')}" placeholder="Corriente principal" /></label>
    <div class="grid2"><label>Banco<input name="banco" value="${esc(c?.banco || '')}" required /></label>
    <label>Tipo<select name="tipo">${opciones([['corriente', 'Corriente'], ['ahorros', 'Ahorros']], c?.tipo || 'corriente')}</select></label></div>
    <label>Últimos 4 dígitos<input name="ultimos" value="${esc(c?.ultimos || '')}" maxlength="4" inputmode="numeric" required /><small class="muted">El número completo no se guarda.</small></label>
    ${c ? `<label class="fin-check"><input type="checkbox" name="activa" ${c.activa ? 'checked' : ''} /><span>Autorizada para pagar impuestos</span></label>` : ''}
    <div class="drawer-actions"><p class="form-error" id="aut-err"></p><button type="submit" class="btn-primary">Guardar</button></div>`
  abrir(autDrawer)
}
function abrirEntidad(x) {
  $('#aut-titulo').textContent = x ? `Editar ${x.nombre}` : 'Nueva entidad autorizada'
  $('#aut-form').innerHTML = `<input type="hidden" name="tipoForm" value="entidad" />
    <div class="grid2"><label>Código<input name="codigo" value="${esc(x?.codigo || '')}" ${x ? 'readonly' : ''} required placeholder="DIAN" /></label><label>NIT de la entidad<input name="nit" value="${esc(x?.nit || '')}" /></label></div>
    <label>Nombre<input name="nombre" value="${esc(x?.nombre || '')}" required /></label>
    <label>Cómo se paga<input name="medio" value="${esc(x?.medio || '')}" placeholder="PSE desde el portal" /></label>
    <label>Documento de pago<input name="formulario_pago" value="${esc(x?.formulario_pago || '')}" placeholder="Recibo oficial de pago 490" /></label>
    <label class="fin-check"><input type="checkbox" name="activa" ${!x || x.activa ? 'checked' : ''} /><span>Autorizada</span></label>
    <div class="drawer-actions"><p class="form-error" id="aut-err"></p><button type="submit" class="btn-primary">Guardar</button></div>`
  abrir(autDrawer)
}
$('#nueva-cuenta').addEventListener('click', () => abrirCuenta(null))
$('#nueva-entidad').addEventListener('click', () => abrirEntidad(null))
$('#cuentas').addEventListener('click', (e) => { const b = e.target.closest('[data-cuenta]'); if (b) abrirCuenta(E.cuentas.find((c) => c.id === Number(b.dataset.cuenta))) })
$('#entidades').addEventListener('click', (e) => { const b = e.target.closest('[data-entidad]'); if (b) abrirEntidad(E.entidades.find((x) => x.codigo === b.dataset.entidad)) })
$('#aut-form').addEventListener('submit', (e) => {
  e.preventDefault()
  const f = e.currentTarget
  const btn = f.querySelector('[type=submit]')
  if (f.tipoForm.value === 'cuenta') {
    conBoton(btn, $('#aut-err'), async () => { await enviar('guardar_cuenta', { id: Number(f.id.value) || null, alias: f.alias.value, banco: f.banco.value, tipo: f.tipo.value, ultimos: f.ultimos.value, activa: f.activa ? f.activa.checked : true }); cerrar(autDrawer) })
  } else {
    conBoton(btn, $('#aut-err'), async () => { await enviar('guardar_entidad', { codigo: f.codigo.value, nombre: f.nombre.value, nit: f.nit.value, medio: f.medio.value, formulario_pago: f.formulario_pago.value, activa: f.activa.checked }); cerrar(autDrawer) })
  }
})

/* ---------- Nueva obligación ---------- */
const nuevaDrawer = $('#nueva-drawer')
$('#nueva-obligacion').addEventListener('click', () => {
  $('#nueva-form').innerHTML = `
    <label>Concepto<input name="concepto" required placeholder="Ej.: Impuesto predial del inmueble" /></label>
    <div class="grid2">
      <label>Tipo<select name="tipo">${opciones(Object.entries(E.catalogos.tipos), 'otra')}</select></label>
      <label>Entidad<select name="entidad">${opciones(E.entidades.filter((x) => x.activa).map((x) => [x.codigo, x.nombre]), 'DIAN')}</select></label>
      <label>Periodo<input name="periodo" placeholder="Año gravable 2026" /></label>
      <label>Formulario<input name="formulario" /></label>
      <label>Vence<input type="date" name="vence" required /></label>
      <label>Responsable<select name="responsable_id">${opciones(E.personas.filter((p) => p.rol === 'finanzas' || p.rol === 'admin').map((p) => [p.id, p.nombre]), '', 'Sin asignar')}</select></label>
    </div>
    <label class="fin-check"><input type="checkbox" name="con_pago" checked /><span>Lleva pago</span></label>
    <label>Notas<textarea name="notas" rows="2"></textarea></label>
    <div class="drawer-actions"><p class="form-error" id="nueva-err"></p><button type="submit" class="btn-primary">Crear</button></div>`
  abrir(nuevaDrawer)
})
$('#nueva-form').addEventListener('submit', (e) => {
  e.preventDefault()
  const f = e.currentTarget
  conBoton(f.querySelector('[type=submit]'), $('#nueva-err'), async () => {
    const r = await enviar('crear_obligacion', { concepto: f.concepto.value, tipo: f.tipo.value, entidad: f.entidad.value, periodo: f.periodo.value, formulario: f.formulario.value, vence: f.vence.value, responsable_id: Number(f.responsable_id.value) || null, con_pago: f.con_pago.checked, notas: f.notas.value })
    cerrar(nuevaDrawer)
    abrirOb(r.resultado.id)
  })
})

/* ---------- Todo ---------- */
function renderTodo() {
  $('#nueva-obligacion').hidden = !P().preparar
  const n = (k, v) => { const el = $(`[data-cuenta="${k}"]`); if (el) el.textContent = v }
  n('calendario', E.obligaciones.filter((o) => o.nivel !== 'cerrada').length)
  n('pagos', E.pagos.filter((p) => p.estado === 'por_aprobar').length)
  renderAvisosConfig()
  renderKpis()
  listaOb.pintar()
  listaPagos.pintar()
  renderSiigo()
  renderDocumentos()
  renderResumenes()
  renderAjustes()
  renderRevision()
  if (abierto.ob) renderOb()
  if (abierto.pago) renderPago()
}
renderTodo()
// Gerencia entra a revisar pagos; Finanzas, al calendario.
if (E.sesion.rol === 'gerencia' && E.pagos.some((p) => p.estado === 'por_aprobar')) { irA('pagos') }
const q = new URLSearchParams(location.search)
if (q.get('ob')) abrirOb(Number(q.get('ob')))
if (q.get('pago')) { irA('pagos'); abrirPago(Number(q.get('pago'))) }
