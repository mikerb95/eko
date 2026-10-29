// Agente de cumplimiento: pinta alertas, expedientes, reglas e historial, y
// envía los cambios a /api/admin/cumplimiento. Mismo estilo que admin.js.
import { $, $$, esc, svg, fmtDate, fmtRel, avatar, estado as pastilla, crearLista } from './comun.js'

const estado = window.__AGENTE__ || { alertas: [], expedientes: [], reglas: [], actos: [], puedeEscribir: false }
const API = '/api/admin/cumplimiento'

// Mismo formato de fecha que el resto del panel: "1 nov 2026".
const fmtFecha = fmtDate

async function api(path, opts = {}) {
  const res = await fetch(API + path, opts)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Ocurrió un error')
  return data
}
const jsonOpts = (method, body) => ({ method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

/* ---------- Pestañas ---------- */
// Las secciones de cumplimiento van en una fila de subpestañas; la barra
// lateral es la del panel (AdminLayout.astro).
const irA = (tab) => {
  const t = $(`.subtab[data-tab="${tab}"]`)
  if (!t) return
  $$('.subtab').forEach((x) => x.classList.toggle('is-active', x === t))
  $$('.panel').forEach((x) => x.classList.toggle('is-active', x.id === 'panel-' + tab))
}
$$('.subtab').forEach((t) => t.addEventListener('click', () => irA(t.dataset.tab)))
$$('[data-ir-sub]').forEach((b) => b.addEventListener('click', () => irA(b.dataset.irSub)))
$$('.kpi[data-filtro]').forEach((b) => b.addEventListener('click', () => listaAlertas.chip(b.dataset.filtro)))

/* ---------- Alertas ---------- */
const TIPO = {
  requerimiento: 'Requerimiento', sancionatorio: 'Sancionatorio', seguimiento: 'Seguimiento',
  otorgamiento: 'Otorgamiento', negacion: 'Negación', modificacion: 'Modificación',
  cobro: 'Cobro', archivo: 'Archivo', otro: 'Otro',
}
const ESTADO_ALERTA = { abierta: 'Abierta', en_curso: 'En curso', cerrada: 'Cerrada', descartada: 'Descartada' }

function chipPlazo(a) {
  if (!a.vence_el) return ''
  const r = a.restantes
  if (r === null || r === undefined) return ''
  if (r < 0) return `<span class="plazo-chip vencido">Vencido hace ${-r} ${-r === 1 ? 'día hábil' : 'días hábiles'}</span>`
  if (r === 0) return '<span class="plazo-chip vencido">Vence hoy</span>'
  return `<span class="plazo-chip ${r <= 5 ? 'urgente' : ''}">Quedan ${r} ${r === 1 ? 'día hábil' : 'días hábiles'}</span>`
}

function expedienteDe(id) {
  return estado.expedientes.find((e) => e.id === id)
}

const activa = (a) => a.estado === 'abierta' || a.estado === 'en_curso'
const ESTADO_PUNTO = { abierta: 'solicitada', en_curso: 'programada', cerrada: 'atendido', descartada: 'cerrada' }

function tarjetaAlerta(a) {
  const exp = expedienteDe(a.expediente_id)
  const cerrada = !activa(a)
  const doc = `<a class="btn-mini" href="${API}/archivo?id=${a.acto_id}" target="_blank" rel="noopener">Ver documento</a>`
  const acciones = estado.puedeEscribir ? `
    <div class="alerta-acciones">
      ${a.estado === 'abierta' ? `<button class="btn-mini is-main" data-estado="en_curso" data-id="${a.id}">Tomar</button>` : ''}
      ${!cerrada ? `<button class="btn-mini" data-estado="cerrada" data-id="${a.id}">Cerrar</button>` : `<button class="btn-mini" data-estado="abierta" data-id="${a.id}">Reabrir</button>`}
      ${!cerrada ? `<button class="btn-mini danger" data-estado="descartada" data-id="${a.id}">Descartar</button>` : ''}
      <input data-nota="${a.id}" placeholder="Nota para el equipo" value="${esc(a.nota)}" aria-label="Nota para el equipo" />
      ${doc}
      <button class="btn-mini" data-reprocesar="${a.acto_id}" title="Volver a leer el documento">Reprocesar</button>
    </div>` : `<div class="alerta-acciones">${doc}</div>`
  return `
  <article class="alerta ${cerrada ? 'cerrada' : ''}" id="alerta-${a.id}">
    <div class="alerta-top">
      <span class="pri ${esc(a.prioridad)}">${esc(a.prioridad)}</span>
      <span class="alerta-tipo">${esc(TIPO[a.tipo_acto] || a.tipo_acto)}</span>
      ${pastilla(ESTADO_PUNTO[a.estado] || a.estado, ESTADO_ALERTA[a.estado] || a.estado)}
      <span class="sp" title="${esc(fmtFecha(a.created_at))}">Recibida ${esc(fmtRel(a.created_at).toLowerCase())}</span>
    </div>
    <h3>${esc(a.titulo)}</h3>
    ${a.que_pide ? `<p class="que">${esc(a.que_pide)}</p>` : ''}
    <dl class="datos">
      <dt>Expediente</dt><dd>${exp ? `${esc(exp.cliente)} · ${esc(exp.autoridad)} · <span class="mono">${esc(exp.numero)}</span>` : '<span class="muted">Sin identificar</span>'}</dd>
      ${a.norma ? `<dt>Norma</dt><dd>${esc(a.norma)}</dd>` : ''}
      <dt>Plazo</dt><dd>${a.plazo_texto ? esc(a.plazo_texto) : '<span class="muted">Sin plazo</span>'}${a.vence_el ? ` · vence el ${fmtFecha(a.vence_el)}` : ''}${chipPlazo(a)}</dd>
      ${a.accion ? `<dt>Acción sugerida</dt><dd>${esc(a.accion)}</dd>` : ''}
      ${a.responsable ? `<dt>Responsable</dt><dd>${esc(a.responsable)}</dd>` : ''}
    </dl>
    ${a.por_confirmar && !cerrada ? `
      <div class="confirmar"><span><b>Por confirmar:</b> ${esc(a.motivo_confirmar)}</span>
      ${estado.puedeEscribir ? `<button class="btn-mini" data-confirmar="${a.id}">Ya lo revisé</button>` : ''}</div>` : ''}
    ${acciones}
  </article>`
}

const listaAlertas = crearLista({
  el: '#alerta-list', buscador: '#alerta-q', chipsEl: '#alerta-chips',
  datos: () => estado.alertas,
  texto: (a) => {
    const e = expedienteDe(a.expediente_id)
    return [a.titulo, a.que_pide, a.norma, a.responsable, a.accion, TIPO[a.tipo_acto], e?.cliente, e?.numero, e?.autoridad].join(' ')
  },
  vacio: ['Sin alertas todavía', 'Cuando suba un acto administrativo, la alerta aparece aquí.'],
  chips: [
    { id: 'activas', lbl: 'Abiertas y en curso', f: activa },
    { id: 'confirmar', lbl: 'Por confirmar', f: (a) => a.por_confirmar && activa(a) },
    { id: 'cerradas', lbl: 'Cerradas y descartadas', f: (a) => !activa(a) },
    { id: 'todas', lbl: 'Todas', f: () => true },
  ],
  columnas: [],
  pintarPropio: (filas) => filas.map(tarjetaAlerta).join(''),
})
const renderAlertas = () => listaAlertas.pintar()

async function recargarAlertas() {
  const { alertas } = await api('/alertas')
  estado.alertas = alertas
  renderAlertas()
}

$('#alerta-list').addEventListener('click', async (ev) => {
  const b = ev.target.closest('button')
  if (!b) return
  try {
    if (b.dataset.estado) {
      b.disabled = true
      await api('/alertas', jsonOpts('PATCH', { id: Number(b.dataset.id), estado: b.dataset.estado }))
      await recargarAlertas()
    } else if (b.dataset.confirmar) {
      b.disabled = true
      await api('/alertas', jsonOpts('PATCH', { id: Number(b.dataset.confirmar), por_confirmar: false }))
      await recargarAlertas()
    } else if (b.dataset.reprocesar) {
      b.disabled = true
      b.textContent = 'Leyendo…'
      await api('/reprocesar', jsonOpts('POST', { id: Number(b.dataset.reprocesar) }))
      await recargarAlertas()
    }
  } catch (e) {
    alertaError(e)
    b.disabled = false
  }
})
$('#alerta-list').addEventListener('change', async (ev) => {
  const i = ev.target.closest('input[data-nota]')
  if (!i) return
  try {
    await api('/alertas', jsonOpts('PATCH', { id: Number(i.dataset.nota), nota: i.value }))
  } catch (e) {
    alertaError(e)
  }
})

function alertaError(e) {
  // Sin diálogos del navegador: el error se muestra arriba de la lista.
  const el = document.createElement('div')
  el.className = 'banner-error'
  el.textContent = e.message || 'Ocurrió un error'
  document.querySelector('.admin-main').prepend(el)
  setTimeout(() => el.remove(), 6000)
}

/* ---------- Subir ---------- */
const subir = $('#subir-form')
if (subir) {
  subir.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    const btn = subir.querySelector('button[type=submit]')
    const info = $('#subir-estado')
    $('#subir-err').textContent = ''
    btn.disabled = true
    info.className = 'leyendo muted'
    info.textContent = 'Leyendo el documento con IA, puede tardar unos segundos…'
    try {
      const r = await api('/actos', { method: 'POST', body: new FormData(subir) })
      info.className = 'muted'
      info.textContent = r.duplicado ? 'Ese documento ya se había subido.' : 'Listo.'
      subir.reset()
      await Promise.all([recargarAlertas(), recargarActos()])
      irA('alertas')
      listaAlertas.chip('activas')
    } catch (e) {
      info.className = 'muted'
      info.textContent = ''
      $('#subir-err').textContent = e.message
    } finally {
      btn.disabled = false
    }
  })
}

/* ---------- Expedientes ---------- */
const abiertasDe = (id) => estado.alertas.filter((a) => a.expediente_id === id && activa(a)).length
const listaExpedientes = crearLista({
  el: '#exp-list', buscador: '#exp-q', chipsEl: '#exp-chips',
  datos: () => estado.expedientes,
  texto: (e) => [e.cliente, e.nit, e.numero, e.autoridad, e.tipo_permiso, e.responsable].join(' '),
  vacio: ['Todavía no hay expedientes', 'Agregue los de cada cliente para que el agente pueda asignar los autos.'],
  chips: [
    { id: 'vigilados', lbl: 'Vigilados', f: (e) => !!e.activo },
    { id: 'inactivos', lbl: 'Inactivos', f: (e) => !e.activo, siHay: true },
    { id: 'todos', lbl: 'Todos', f: () => true },
  ],
  columnas: [
    { k: 'cliente', lbl: 'Cliente', orden: (e) => e.cliente.toLowerCase(),
      html: (e) => `<div class="persona">${avatar(e.cliente, 'sm')}<div><div class="t1">${esc(e.cliente)}</div>${e.nit ? `<div class="t2">NIT ${esc(e.nit)}</div>` : ''}</div></div>` },
    { k: 'numero', lbl: 'Expediente', cls: 'num', html: (e) => esc(e.numero), orden: (e) => e.numero },
    { k: 'autoridad', lbl: 'Autoridad y trámite', orden: (e) => e.autoridad, html: (e) => `<div>${esc(e.autoridad)}</div>${e.tipo_permiso ? `<div class="t2">${esc(e.tipo_permiso)}</div>` : ''}` },
    { k: 'resp', lbl: 'Responsable', html: (e) => (e.responsable ? `<div class="nw">${esc(e.responsable)}</div>${e.responsable_email ? `<div class="t2">${esc(e.responsable_email)}</div>` : ''}` : '<span class="muted">Sin asignar</span>'), orden: (e) => e.responsable || 'zzz' },
    { k: 'alertas', lbl: 'Alertas abiertas', cls: 'num', html: (e) => { const n = abiertasDe(e.id); return n ? `<b class="cuenta-alertas">${n}</b>` : '<span class="muted">0</span>' }, orden: (e) => -abiertasDe(e.id) },
    { k: 'estado', lbl: 'Estado', html: (e) => (e.activo ? pastilla('activa', 'Vigilado') : pastilla('inactiva', 'Inactivo')), orden: (e) => (e.activo ? 0 : 1) },
    ...(estado.puedeEscribir ? [{ k: 'acc', lbl: '', cls: 'der', html: (e) => `<button type="button" class="btn-ico" data-acc="editar" data-id="${e.id}" title="Editar" aria-label="Editar">${svg('editar')}</button>` }] : []),
  ],
  abrir: estado.puedeEscribir ? (id) => abrirExpediente(estado.expedientes.find((e) => e.id === Number(id))) : undefined,
  acciones: { editar: (id) => abrirExpediente(estado.expedientes.find((e) => e.id === Number(id))) },
})
const renderExpedientes = () => listaExpedientes.pintar()

const drawer = $('#exp-drawer')
const expForm = $('#exp-form')
function abrirExpediente(e) {
  expForm.reset()
  $('#exp-err').textContent = ''
  $('#exp-titulo').textContent = e ? 'Editar expediente' : 'Nuevo expediente'
  for (const k of ['id', 'cliente', 'nit', 'autoridad', 'numero', 'tipo_permiso', 'responsable', 'responsable_email', 'notas']) {
    expForm.elements[k].value = e ? (e[k] ?? '') : ''
  }
  expForm.elements.activo.checked = e ? e.activo : true
  drawer.hidden = false
}
$$('[data-close]', drawer).forEach((x) => x.addEventListener('click', () => (drawer.hidden = true)))
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') drawer.hidden = true })
$('#nuevo-exp')?.addEventListener('click', () => abrirExpediente(null))
expForm.addEventListener('submit', async (ev) => {
  ev.preventDefault()
  const datos = Object.fromEntries(new FormData(expForm))
  datos.activo = expForm.elements.activo.checked
  try {
    await api('/expedientes', jsonOpts('POST', datos))
    const { expedientes } = await api('/expedientes')
    estado.expedientes = expedientes
    renderExpedientes()
    renderAlertas()
    drawer.hidden = true
  } catch (e) {
    $('#exp-err').textContent = e.message
  }
})

/* ---------- Reglas ---------- */
function renderReglas() {
  const el = $('#regla-list')
  const dis = estado.puedeEscribir ? '' : 'disabled'
  el.innerHTML = estado.reglas.map((r) => `
    <form class="regla" data-regla="${r.id}">
      <p class="regla-tipo">${esc(TIPO[r.tipo_acto] || r.tipo_acto)}</p>
      <label>Nombre<input name="nombre" value="${esc(r.nombre)}" ${dis} /></label>
      <label>Prioridad
        <select name="prioridad" ${dis}>
          ${['alta', 'media', 'baja'].map((p) => `<option value="${p}" ${p === r.prioridad ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </label>
      <label>Alta si quedan<input name="umbral_alta" type="number" min="0" value="${r.umbral_alta}" ${dis} /></label>
      <label class="accion">Acción sugerida<textarea name="accion" rows="2" ${dis}>${esc(r.accion)}</textarea></label>
      ${estado.puedeEscribir ? '<div class="regla-pie"><button class="btn-mini" type="submit">Guardar</button></div>' : ''}
    </form>`).join('')
}
$('#regla-list').addEventListener('submit', async (ev) => {
  ev.preventDefault()
  const f = ev.target
  const btn = f.querySelector('button')
  const datos = Object.fromEntries(new FormData(f))
  try {
    btn.disabled = true
    await api('/reglas', jsonOpts('POST', { id: Number(f.dataset.regla), ...datos }))
    btn.textContent = 'Guardado'
    setTimeout(() => { btn.textContent = 'Guardar'; btn.disabled = false }, 1500)
  } catch (e) {
    alertaError(e)
    btn.disabled = false
  }
})

/* ---------- Historial ---------- */
const ESTADO_ACTO = { procesado: 'Procesado', error: 'Error', sin_clave: 'Esperando clave de IA', pendiente: 'Pendiente' }
const ESTADO_ACTO_PUNTO = { procesado: 'publicado', error: 'cancelada', sin_clave: 'borrador', pendiente: 'solicitada' }
const listaActos = crearLista({
  el: '#acto-list', buscador: '#acto-q', chipsEl: '#acto-chips',
  datos: () => estado.actos,
  texto: (a) => [a.archivo_nombre, a.resumen, a.subido_por, a.error].join(' '),
  vacio: ['Todavía no se ha recibido ningún documento', 'Los actos que se suban quedan aquí con su lectura.'],
  chips: [
    { id: 'todos', lbl: 'Todos', f: () => true },
    ...Object.keys(ESTADO_ACTO).map((k) => ({ id: k, lbl: ESTADO_ACTO[k], f: (a) => a.estado === k, siHay: true })),
  ],
  columnas: [
    { k: 'doc', lbl: 'Documento', orden: (a) => (a.archivo_nombre || '').toLowerCase(),
      html: (a) => `<div class="t1">${esc(a.archivo_nombre || 'Documento ' + a.id)}</div>${a.error ? `<div class="t2 clip error">${esc(a.error)}</div>` : a.resumen ? `<div class="t2 clip">${esc(a.resumen)}</div>` : ''}` },
    { k: 'estado', lbl: 'Estado', html: (a) => pastilla(ESTADO_ACTO_PUNTO[a.estado] || a.estado, ESTADO_ACTO[a.estado] || a.estado), orden: (a) => a.estado },
    { k: 'recibido', lbl: 'Recibido', cls: 'nw', html: (a) => `<span title="${esc(fmtFecha(a.created_at))}">${esc(fmtRel(a.created_at))}</span>`, orden: (a) => a.created_at || '' },
    { k: 'notif', lbl: 'Notificado', cls: 'nw', html: (a) => (a.fecha_notificacion ? esc(fmtFecha(a.fecha_notificacion)) : '<span class="muted">Sin fecha</span>'), orden: (a) => a.fecha_notificacion || '' },
    { k: 'por', lbl: 'Subido por', cls: 'nw', html: (a) => esc(a.subido_por || ''), orden: (a) => a.subido_por || '' },
    { k: 'tokens', lbl: 'Lectura', cls: 'nw', html: (a) => (a.tokens_entrada ? `<span class="num">${(a.tokens_entrada + a.tokens_salida).toLocaleString('es-CO')} tokens</span><div class="t2">${esc(a.modelo)}</div>` : '<span class="muted">Sin leer</span>') },
    { k: 'acc', lbl: '', cls: 'der', html: (a) => `<span class="acciones">
        <a class="btn-mini" href="${API}/archivo?id=${a.id}" target="_blank" rel="noopener">Ver</a>
        ${estado.puedeEscribir ? `<button type="button" class="btn-mini" data-reprocesar="${a.id}">Reprocesar</button>` : ''}
      </span>` },
  ],
})
const renderActos = () => listaActos.pintar()

async function recargarActos() {
  const { actos } = await api('/actos')
  estado.actos = actos.map(({ extraccion, ...a }) => ({ ...a, resumen: extraccion?.resumen ?? '' }))
  renderActos()
}
$('#acto-list').addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-reprocesar]')
  if (!b) return
  b.disabled = true
  b.textContent = 'Leyendo…'
  try {
    await api('/reprocesar', jsonOpts('POST', { id: Number(b.dataset.reprocesar) }))
    await Promise.all([recargarActos(), recargarAlertas()])
  } catch (e) {
    alertaError(e)
    b.disabled = false
    b.textContent = 'Reprocesar'
  }
})
$('#procesar-pendientes')?.addEventListener('click', async (ev) => {
  const b = ev.currentTarget
  b.disabled = true
  b.textContent = 'Procesando…'
  try {
    const r = await api('/reprocesar', jsonOpts('POST', {}))
    b.textContent = r.procesados ? `${r.procesados} procesados` : 'No había pendientes'
    await Promise.all([recargarActos(), recargarAlertas()])
  } catch (e) {
    alertaError(e)
    b.textContent = 'Procesar pendientes'
  } finally {
    setTimeout(() => { b.disabled = false; b.textContent = 'Procesar pendientes' }, 2500)
  }
})

renderAlertas()
renderExpedientes()
renderReglas()
renderActos()

/* ---------- Abrir desde la URL ---------- */
// Los enlaces del asistente apuntan a /admin/cumplimiento?alerta=<id>: se
// abre la pestaña, se cambia el filtro si la alerta no cabe en el actual y se
// lleva la vista hasta ella resaltada.
;(() => {
  const id = Number(new URLSearchParams(location.search).get('alerta'))
  if (!id) return
  irA('alertas')
  const a = estado.alertas.find((x) => x.id === id)
  if (!a) {
    alertaError(new Error(`No se encontró la alerta ${id}. Puede que ya no exista.`))
    return
  }
  let el = $('#alerta-' + id)
  if (!el) {
    listaAlertas.chip('todas')
    el = $('#alerta-' + id)
  }
  if (!el) return
  el.classList.add('is-destacada')
  el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  setTimeout(() => el.classList.remove('is-destacada'), 4000)
})()
