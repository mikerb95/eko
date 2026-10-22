// Agente de cumplimiento: pinta alertas, expedientes, reglas e historial, y
// envía los cambios a /api/admin/cumplimiento. Mismo estilo que admin.js.
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const estado = window.__AGENTE__ || { alertas: [], expedientes: [], reglas: [], actos: [], puedeEscribir: false }
const API = '/api/admin/cumplimiento'

const fmtFecha = (iso) => {
  if (!iso) return ''
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
  return isNaN(d) ? iso : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function api(path, opts = {}) {
  const res = await fetch(API + path, opts)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Ocurrió un error')
  return data
}
const jsonOpts = (method, body) => ({ method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

/* ---------- Pestañas ---------- */
$$('.tab').forEach((t) => t.addEventListener('click', () => {
  $$('.tab').forEach((x) => x.classList.remove('is-active'))
  $$('.panel').forEach((x) => x.classList.remove('is-active'))
  t.classList.add('is-active')
  $('#panel-' + t.dataset.tab).classList.add('is-active')
}))
const irA = (tab) => $(`.tab[data-tab="${tab}"]`)?.click()

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

function renderAlertas() {
  const el = $('#alerta-list')
  const f = $('#alerta-filtro').value
  const filas = estado.alertas.filter((a) => {
    if (f === 'activas') return a.estado === 'abierta' || a.estado === 'en_curso'
    if (f === 'confirmar') return a.por_confirmar && (a.estado === 'abierta' || a.estado === 'en_curso')
    if (f === 'cerradas') return a.estado === 'cerrada' || a.estado === 'descartada'
    return true
  })
  if (!filas.length) {
    el.innerHTML = `<div class="empty">${f === 'activas' ? 'No hay alertas abiertas. Cuando subas un acto, la alerta aparece aquí.' : 'No hay alertas en este filtro.'}</div>`
    return
  }
  el.innerHTML = filas.map((a) => {
    const exp = expedienteDe(a.expediente_id)
    const cerrada = a.estado === 'cerrada' || a.estado === 'descartada'
    const acciones = estado.puedeEscribir ? `
      <div class="alerta-acciones">
        ${a.estado === 'abierta' ? `<button class="icon-btn" data-estado="en_curso" data-id="${a.id}">Tomar</button>` : ''}
        ${!cerrada ? `<button class="icon-btn" data-estado="cerrada" data-id="${a.id}">Cerrar</button>` : `<button class="icon-btn" data-estado="abierta" data-id="${a.id}">Reabrir</button>`}
        ${!cerrada ? `<button class="icon-btn danger" data-estado="descartada" data-id="${a.id}">Descartar</button>` : ''}
        <input data-nota="${a.id}" placeholder="Nota para el equipo" value="${esc(a.nota)}" />
        <a class="icon-btn" href="${API}/archivo?id=${a.acto_id}" target="_blank" rel="noopener">Ver documento</a>
        <button class="icon-btn" data-reprocesar="${a.acto_id}" title="Volver a leer el documento">Reprocesar</button>
      </div>` : `<div class="alerta-acciones"><a class="icon-btn" href="${API}/archivo?id=${a.acto_id}" target="_blank" rel="noopener">Ver documento</a></div>`
    return `
    <article class="alerta ${cerrada ? 'cerrada' : ''}">
      <div class="alerta-top">
        <span class="pri ${esc(a.prioridad)}">${esc(a.prioridad)}</span>
        <span>${esc(TIPO[a.tipo_acto] || a.tipo_acto)}</span>
        <span>·</span><span>${esc(ESTADO_ALERTA[a.estado] || a.estado)}</span>
        <span class="sp">${fmtFecha(a.created_at)}</span>
      </div>
      <h3>${esc(a.titulo)}</h3>
      ${a.que_pide ? `<p class="que">${esc(a.que_pide)}</p>` : ''}
      <dl class="datos">
        <dt>Expediente</dt><dd>${exp ? `${esc(exp.autoridad)} · ${esc(exp.numero)}` : '<span class="muted">Sin identificar</span>'}</dd>
        ${a.norma ? `<dt>Norma</dt><dd>${esc(a.norma)}</dd>` : ''}
        <dt>Plazo</dt><dd>${a.plazo_texto ? esc(a.plazo_texto) : '<span class="muted">Sin plazo</span>'}${a.vence_el ? ` · vence el ${fmtFecha(a.vence_el)}` : ''}${chipPlazo(a)}</dd>
        ${a.accion ? `<dt>Acción sugerida</dt><dd>${esc(a.accion)}</dd>` : ''}
        ${a.responsable ? `<dt>Responsable</dt><dd>${esc(a.responsable)}</dd>` : ''}
      </dl>
      ${a.por_confirmar && !cerrada ? `
        <div class="confirmar"><span><b>Por confirmar:</b> ${esc(a.motivo_confirmar)}</span>
        ${estado.puedeEscribir ? `<button class="icon-btn" data-confirmar="${a.id}">Ya lo revisé</button>` : ''}</div>` : ''}
      ${acciones}
    </article>`
  }).join('')
}

async function recargarAlertas() {
  const { alertas } = await api('/alertas')
  estado.alertas = alertas
  renderAlertas()
}

$('#alerta-filtro').addEventListener('change', renderAlertas)
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
function renderExpedientes() {
  const el = $('#exp-list')
  if (!estado.expedientes.length) {
    el.innerHTML = '<div class="empty">Todavía no hay expedientes. Agrega los de cada cliente para que el agente pueda asignar los autos.</div>'
    return
  }
  el.innerHTML = estado.expedientes.map((e) => `
    <div class="row-card">
      <div class="main">
        <div class="title">${esc(e.cliente)} · ${esc(e.numero)}</div>
        <div class="meta">
          ${e.autoridad ? `<span>${esc(e.autoridad)}</span>` : ''}
          ${e.tipo_permiso ? `<span>${esc(e.tipo_permiso)}</span>` : ''}
          ${e.responsable ? `<span>Responsable: ${esc(e.responsable)}</span>` : ''}
          ${e.activo ? '<span class="pill forest">Vigilado</span>' : '<span class="pill">Inactivo</span>'}
        </div>
      </div>
      ${estado.puedeEscribir ? `<div class="row-actions"><button class="icon-btn" data-editar="${e.id}">Editar</button></div>` : ''}
    </div>`).join('')
}

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
$('#nuevo-exp')?.addEventListener('click', () => abrirExpediente(null))
$('#exp-list').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-editar]')
  if (b) abrirExpediente(estado.expedientes.find((e) => e.id === Number(b.dataset.editar)))
})
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
      <label>${esc(TIPO[r.tipo_acto] || r.tipo_acto)}<input name="nombre" value="${esc(r.nombre)}" ${dis} /></label>
      <label>Prioridad
        <select name="prioridad" ${dis}>
          ${['alta', 'media', 'baja'].map((p) => `<option value="${p}" ${p === r.prioridad ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </label>
      <label>Alta si quedan<input name="umbral_alta" type="number" min="0" value="${r.umbral_alta}" ${dis} /></label>
      ${estado.puedeEscribir ? '<button class="btn-ghost" type="submit">Guardar</button>' : '<span></span>'}
      <label class="accion">Acción sugerida<textarea name="accion" rows="2" ${dis}>${esc(r.accion)}</textarea></label>
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
function renderActos() {
  const el = $('#acto-list')
  if (!estado.actos.length) {
    el.innerHTML = '<div class="empty">Todavía no se ha recibido ningún documento.</div>'
    return
  }
  el.innerHTML = estado.actos.map((a) => `
    <div class="row-card">
      <div class="main">
        <div class="title">${esc(a.archivo_nombre || 'Documento ' + a.id)}</div>
        <div class="meta">
          <span class="pill estado-acto ${esc(a.estado)}">${esc(ESTADO_ACTO[a.estado] || a.estado)}</span>
          <span>${fmtFecha(a.created_at)}</span>
          ${a.fecha_notificacion ? `<span>Notificado el ${fmtFecha(a.fecha_notificacion)}</span>` : ''}
          ${a.subido_por ? `<span>Subido por ${esc(a.subido_por)}</span>` : ''}
          ${a.tokens_entrada ? `<span>${a.tokens_entrada.toLocaleString('es-CO')} + ${a.tokens_salida.toLocaleString('es-CO')} tokens · ${esc(a.modelo)}</span>` : ''}
        </div>
        ${a.error ? `<div class="meta" style="color:var(--danger)">${esc(a.error)}</div>` : ''}
        ${a.resumen ? `<div class="meta">${esc(a.resumen)}</div>` : ''}
      </div>
      <div class="row-actions">
        <a class="icon-btn" href="${API}/archivo?id=${a.id}" target="_blank" rel="noopener">Ver</a>
        ${estado.puedeEscribir ? `<button class="icon-btn" data-reprocesar="${a.id}">Reprocesar</button>` : ''}
      </div>
    </div>`).join('')
}
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
