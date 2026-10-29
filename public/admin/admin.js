// EKOSOLV · panel (CRM): navegación, inicio, listas y editores del cliente.
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

let posts = window.__POSTS__ || []
let norms = window.__NORMS__ || []
let orders = window.__ORDERS__ || []
let contacts = window.__CONTACTS__ || []
let users = window.__USERS__ || []
const role = window.__ROLE__ || ''

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
// Para buscar sin importar tildes ni mayúsculas.
const plano = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const ICO = {
  editar: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  borrar: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  camion: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  mensaje: '<path d="M4 5h16v11H8l-4 4z"/>',
  correo: '<path d="M3 6h18v12H3z"/><path d="M3 7l9 6 9-6"/>',
}
const svg = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICO[n]}</svg>`

/* ---------- Fechas ---------- */
// Las fechas sin hora (YYYY-MM-DD) se leen como locales para que no se
// corran un día por la zona horaria.
const aFecha = (iso) => {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(iso)
  return isNaN(d) ? null : d
}
// Mismo estilo que las fechas del blog: "14 abr 2025". La corta omite el
// año cuando es el actual.
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fmtDate = (iso) => {
  const d = aFecha(iso)
  return d ? `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}` : (iso || '')
}
const fmtCorto = (iso) => {
  const d = aFecha(iso)
  if (!d) return iso || ''
  return d.getFullYear() === new Date().getFullYear() ? `${d.getDate()} ${MES[d.getMonth()]}` : fmtDate(iso)
}
const inicioDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const diasDesde = (iso) => {
  const d = aFecha(iso)
  return d ? Math.round((inicioDia(new Date()) - inicioDia(d)) / 864e5) : null
}
const fmtRel = (iso) => {
  const n = diasDesde(iso)
  if (n === null) return ''
  if (n === 0) return 'Hoy'
  if (n === 1) return 'Ayer'
  if (n > 1 && n < 7) return `Hace ${n} días`
  if (n === -1) return 'Mañana'
  if (n < -1 && n > -7) return `En ${-n} días`
  return fmtCorto(iso)
}
// "14 abr 2025" (fecha del blog, texto libre) a número para ordenar.
const fechaTexto = (s) => {
  const m = /(\d{1,2})\s+([a-zñ]{3})\w*\.?\s+(\d{4})/i.exec(plano(s))
  return m ? new Date(+m[3], MES.indexOf(m[2]), +m[1]).getTime() || 0 : 0
}

/* ---------- Personas ---------- */
const iniciales = (nombre) => String(nombre || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
const TINTES = ['#1f8a8a', '#46a85b', '#e8920c', '#2f80c9', '#8b5cf6', '#c2557a']
const tinte = (s) => TINTES[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTES.length]
const avatar = (nombre, cls = '') => {
  const c = tinte(nombre)
  return `<span class="avatar ${cls}" style="background:color-mix(in oklab, ${c} 15%, #fff);color:color-mix(in oklab, ${c} 80%, #1a1f1d)" aria-hidden="true">${esc(iniciales(nombre))}</span>`
}
const estado = (clave, texto) => `<span class="estado c-${esc(clave)}">${esc(texto)}</span>`

/* ---------- Listas con búsqueda, filtros y orden ---------- */
// Cada sección arma una lista con: datos(), texto(fila) para el buscador,
// chips [{ id, lbl, f }], columnas [{ k, lbl, html, orden?, cls? }] y qué
// hacer al abrir una fila o pulsar una acción (data-acc).
function crearLista(cfg) {
  const st = { q: '', chip: cfg.chips?.[0]?.id ?? '', orden: null, dir: 1 }
  const cont = $(cfg.el)
  const buscador = $(cfg.buscador)
  if (!cont) return { pintar() {}, chip() {} }
  buscador?.addEventListener('input', () => { st.q = plano(buscador.value.trim()); pintar() })

  function pintar() {
    const todas = cfg.datos()
    const chipsEl = $(cfg.chipsEl)
    if (chipsEl && cfg.chips) {
      chipsEl.hidden = !!cfg.ocultarChips?.()
      chipsEl.innerHTML = cfg.chips.map((c) => {
        const n = todas.filter(c.f).length
        if (c.siHay && !n && st.chip !== c.id) return ''
        return `<button type="button" class="chip${c.id === st.chip ? ' is-on' : ''}" data-chip="${c.id}">${esc(c.lbl)} <b>${n}</b></button>`
      }).join('')
    }
    const chip = cfg.chips?.find((c) => c.id === st.chip)
    let filas = todas.filter((r) => (!chip || cfg.ocultarChips?.() ? true : chip.f(r)))
    if (st.q) filas = filas.filter((r) => plano(cfg.texto(r)).includes(st.q))
    if (st.orden) {
      const col = cfg.columnas.find((c) => c.k === st.orden)
      filas = [...filas].sort((a, b) => {
        const x = col.orden(a), y = col.orden(b)
        return (x > y ? 1 : x < y ? -1 : 0) * st.dir
      })
    }
    if (!todas.length) { cont.innerHTML = `<div class="vacio"><b>${esc(cfg.vacio[0])}</b>${esc(cfg.vacio[1])}</div>`; return }
    if (!filas.length) { cont.innerHTML = '<div class="vacio"><b>Nada coincide</b>Pruebe con otra búsqueda o quite el filtro.</div>'; return }
    const propio = cfg.pintarPropio?.(filas)
    if (propio != null) { cont.innerHTML = propio; return }
    const th = cfg.columnas.map((c) => {
      const on = st.orden === c.k
      const flecha = c.orden ? `<span class="flecha">${on ? (st.dir > 0 ? '↑' : '↓') : '↕'}</span>` : ''
      return `<th${c.orden ? ` data-orden="${c.k}"` : ''} class="${c.cls || ''}${on ? ' is-orden' : ''}"${c.orden ? ` aria-sort="${on ? (st.dir > 0 ? 'ascending' : 'descending') : 'none'}"` : ''}>${c.lbl}${flecha}</th>`
    }).join('')
    const tr = filas.map((r) => `<tr${cfg.abrir ? ` data-fila="${esc(r.id)}"` : ''}>${cfg.columnas.map((c) => `<td class="${c.cls || ''}">${c.html(r)}</td>`).join('')}</tr>`).join('')
    cont.innerHTML = `<div class="tabla-wrap"><table class="tabla"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>
      <div class="tabla-pie"><span>${filas.length === todas.length ? `${todas.length} en total` : `Mostrando ${filas.length} de ${todas.length}`}</span>${cfg.pie ? `<span>${cfg.pie}</span>` : ''}</div></div>`
  }

  $(cfg.chipsEl)?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-chip]')
    if (b) { st.chip = b.dataset.chip; pintar() }
  })
  cont.addEventListener('click', (e) => {
    const acc = e.target.closest('[data-acc]')
    if (acc) { cfg.acciones?.[acc.dataset.acc]?.(acc.dataset.id, acc); return }
    const th = e.target.closest('th[data-orden]')
    if (th) {
      if (st.orden === th.dataset.orden) st.dir = -st.dir
      else { st.orden = th.dataset.orden; st.dir = 1 }
      pintar()
      return
    }
    const fila = e.target.closest('[data-fila]')
    if (fila && !e.target.closest('a,button')) cfg.abrir?.(fila.dataset.fila)
  })
  return { pintar, chip(id) { st.chip = id; pintar() } }
}

/* ---------- Navegación ---------- */
// Las pestañas viven en la barra lateral. La sección activa queda en la URL
// (?tab=) para que un guardado, que recarga la página, vuelva al mismo sitio.
// Los enlaces con aspecto de pestaña (Cumplimiento) navegan a otra página.
const crumb = $('#crm-crumb')
function ir(tab, { url = true } = {}) {
  const boton = $(`.tab[data-tab="${CSS.escape(tab)}"]`)
  const panel = $('#panel-' + tab)
  if (!boton || !panel) return false
  $$('.tab').forEach((x) => x.classList.remove('is-active'))
  $$('.panel').forEach((x) => x.classList.remove('is-active'))
  boton.classList.add('is-active')
  panel.classList.add('is-active')
  if (crumb) crumb.textContent = boton.querySelector('.lbl')?.textContent || ''
  document.body.classList.remove('side-abierta')
  if (url) {
    const u = new URL(location.href)
    u.searchParams.delete('id')
    if (tab === 'inicio') u.searchParams.delete('tab'); else u.searchParams.set('tab', tab)
    history.replaceState(null, '', u)
  }
  window.scrollTo({ top: 0 })
  return true
}
$$('.tab[data-tab]').forEach((t) => t.addEventListener('click', () => ir(t.dataset.tab)))
$('.side-abrir')?.addEventListener('click', () => document.body.classList.add('side-abierta'))
$('[data-side-cerrar]')?.addEventListener('click', () => document.body.classList.remove('side-abierta'))

/* ---------- Logout ---------- */
$('#logout').addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' })
  location.href = '/admin/login'
})

/* ---------- Recolecciones ---------- */
const STATUS_LABELS = {
  solicitada: 'Solicitada', confirmada: 'Confirmada', programada: 'Programada',
  en_ruta: 'En ruta', recolectada: 'Recolectada', certificada: 'Certificada',
  cerrada: 'Cerrada', cancelada: 'Cancelada',
}
const FLUJO = ['solicitada', 'confirmada', 'programada', 'en_ruta', 'recolectada', 'certificada']
const FINALES = ['cerrada', 'cancelada']
const WASTE_TYPE_LABELS = {
  raee_computo: 'RAEE · Cómputo y periféricos',
  raee_telco: 'RAEE · Telecomunicaciones',
  raee_datacenter: 'RAEE · Infraestructura de data center',
  baterias: 'Baterías y pilas',
  otro: 'Otro',
}
// Versión corta para la tabla y el tablero, donde no cabe la etiqueta entera.
const WASTE_CORTO = {
  raee_computo: 'RAEE cómputo', raee_telco: 'RAEE telecom', raee_datacenter: 'RAEE data center',
  baterias: 'Baterías y pilas', otro: 'Otro',
}
const residuo = (o) => WASTE_CORTO[o.waste_type] || o.waste_type || ''
const cliente = (o) => `${o.first_name || ''} ${o.last_name || ''}`.trim()
const abierta = (o) => !FINALES.includes(o.status)
let vistaOrdenes = 'tabla'

const listaOrdenes = crearLista({
  el: '#order-list', buscador: '#order-q', chipsEl: '#order-chips',
  datos: () => orders,
  texto: (o) => [o.consecutive, cliente(o), o.company, o.city, o.assigned_to, o.email, WASTE_TYPE_LABELS[o.waste_type]].join(' '),
  vacio: ['Sin órdenes de recolección todavía', 'Las solicitudes del formulario público aparecen aquí.'],
  chips: [
    { id: 'abiertas', lbl: 'Abiertas', f: abierta },
    ...FLUJO.map((s) => ({ id: s, lbl: STATUS_LABELS[s], f: (o) => o.status === s })),
    ...FINALES.map((s) => ({ id: s, lbl: STATUS_LABELS[s], f: (o) => o.status === s, siHay: true })),
    { id: 'todas', lbl: 'Todas', f: () => true },
  ],
  ocultarChips: () => vistaOrdenes === 'tablero',
  columnas: [
    { k: 'consecutivo', lbl: 'Orden', cls: 'num', html: (o) => esc(o.consecutive), orden: (o) => o.consecutive },
    { k: 'cliente', lbl: 'Cliente', orden: (o) => plano(o.company || cliente(o)),
      html: (o) => `<div class="persona">${avatar(o.company || cliente(o), 'sm')}<div><div class="t1">${esc(o.company || cliente(o))}</div><div class="t2">${o.company ? esc(cliente(o)) : esc(o.email)}</div></div></div>` },
    { k: 'ciudad', lbl: 'Ciudad', cls: 'nw', html: (o) => esc(o.city), orden: (o) => plano(o.city) },
    { k: 'residuo', lbl: 'Residuo', html: (o) => `<div class="nw">${esc(residuo(o))}</div>${o.estimated_quantity ? `<div class="t2">${esc(o.estimated_quantity)}</div>` : ''}`, orden: (o) => o.waste_type || '' },
    { k: 'estado', lbl: 'Estado', html: (o) => estado(o.status, STATUS_LABELS[o.status] || o.status), orden: (o) => [...FLUJO, ...FINALES].indexOf(o.status) },
    { k: 'solicitada', lbl: 'Solicitada', cls: 'nw', html: (o) => `<span title="${esc(fmtDate(o.created_at))}">${esc(fmtRel(o.created_at))}</span>`, orden: (o) => o.created_at || '' },
    { k: 'programada', lbl: 'Programada', cls: 'nw', html: (o) => (o.scheduled_at ? esc(fmtCorto(o.scheduled_at)) : '<span class="muted">Sin fecha</span>'), orden: (o) => o.scheduled_at || '9999' },
    { k: 'resp', lbl: 'Responsable', cls: 'nw', html: (o) => (o.assigned_to ? esc(o.assigned_to) : '<span class="muted">Sin asignar</span>'), orden: (o) => plano(o.assigned_to || 'zzz') },
  ],
  abrir: (id) => openOrder(Number(id)),
  pintarPropio: (filas) => (vistaOrdenes === 'tablero' ? tableroOrdenes(filas) : null),
})

function tableroOrdenes(filas) {
  const etapas = [...FLUJO, ...FINALES.filter((s) => filas.some((o) => o.status === s))]
  return `<div class="tablero">${etapas.map((s) => {
    const enEtapa = filas.filter((o) => o.status === s)
    return `<section class="columna c-${s}">
      <header class="columna-head"><span class="punto"></span>${esc(STATUS_LABELS[s])}<b>${enEtapa.length}</b></header>
      ${enEtapa.map((o) => `
        <button type="button" class="ficha" data-acc="abrir" data-id="${o.id}">
          <span class="ficha-top"><span>${esc(o.consecutive)}</span><span>${esc(fmtRel(o.created_at))}</span></span>
          <span class="ficha-tit">${esc(o.company || cliente(o))}</span>
          <span class="ficha-sub">${esc(o.city)}${o.waste_type ? ' · ' + esc(residuo(o)) : ''}</span>
          ${(o.scheduled_at || o.assigned_to) ? `<span class="ficha-pie">${o.assigned_to ? avatar(o.assigned_to, 'sm') : ''}<span>${o.scheduled_at ? 'Recolección ' + esc(fmtCorto(o.scheduled_at)) : 'Sin fecha'}</span></span>` : ''}
        </button>`).join('') || '<div class="columna-vacia">Sin órdenes</div>'}
    </section>`
  }).join('')}</div>`
}
// Las fichas del tablero se abren con la misma acción que las filas.
$('#order-list')?.addEventListener('click', (e) => {
  const f = e.target.closest('.ficha[data-id]')
  if (f) openOrder(Number(f.dataset.id))
})

function vistaRecolecciones(v) {
  vistaOrdenes = v
  $$('#panel-recolecciones .seg [data-vista]').forEach((b) => b.classList.toggle('is-on', b.dataset.vista === v))
  listaOrdenes.pintar()
}
$$('#panel-recolecciones .seg [data-vista]').forEach((b) => b.addEventListener('click', () => vistaRecolecciones(b.dataset.vista)))

const of = $('#order-form')
async function openOrder(id) {
  const o = orders.find((x) => x.id === id)
  if (!o) return
  of.reset()
  $('#order-err').textContent = ''
  $('#order-drawer-title').textContent = `${o.consecutive} · ${STATUS_LABELS[o.status] || o.status}`
  of.id.value = o.id
  of.status.value = o.status
  of.assigned_to.value = o.assigned_to || ''
  of.scheduled_at.value = (o.scheduled_at || '').slice(0, 10)
  of.internal_notes.value = o.internal_notes || ''
  of.note.value = ''
  const direccion = [o.address, o.address2, o.city + (o.postal_code ? ` (${o.postal_code})` : ''), o.country].filter(Boolean).map(esc).join(', ')
  $('#order-client').innerHTML = `
    <div class="ficha-cliente">
      <div class="ficha-cliente-top">${avatar(o.company || cliente(o))}<div><b>${esc(o.company || cliente(o))}</b><small>${o.company ? esc(cliente(o)) + ' · ' : ''}Solicitada ${esc(fmtDate(o.created_at))}</small></div></div>
      <dl class="datos-ficha">
        <dt>Correo</dt><dd><a href="mailto:${esc(o.email)}">${esc(o.email)}</a></dd>
        <dt>Teléfono</dt><dd>${esc(o.phone)}</dd>
        <dt>Dirección</dt><dd>${direccion}</dd>
        ${o.waste_type ? `<dt>Residuo</dt><dd>${esc(WASTE_TYPE_LABELS[o.waste_type] || o.waste_type)}</dd>` : ''}
        ${o.estimated_quantity ? `<dt>Cantidad</dt><dd>${esc(o.estimated_quantity)}</dd>` : ''}
      </dl>
      ${o.message ? `<p class="cita">${esc(o.message)}</p>` : ''}
    </div>`
  $('#order-events').innerHTML = '<p class="muted">Cargando historial…</p>'
  openDrawer('#order-drawer')
  try {
    const res = await fetch('/api/admin/recolecciones?id=' + id)
    const j = await res.json()
    const evs = j.events || []
    $('#order-events').innerHTML = evs.length ? `<ol class="linea-tiempo">${evs.map((ev) => `
      <li class="c-${esc(ev.to_status)}">
        <b>${STATUS_LABELS[ev.to_status] || esc(ev.to_status)}</b>
        <small>${fmtDate(ev.at)} · ${esc(ev.user)}</small>
        ${ev.note ? `<p>${esc(ev.note)}</p>` : ''}
      </li>`).join('')}</ol>` : '<p class="muted">Sin eventos.</p>'
  } catch {
    $('#order-events').innerHTML = '<p class="muted">No se pudo cargar el historial.</p>'
  }
}
of.addEventListener('submit', async (e) => {
  e.preventDefault()
  const btn = of.querySelector('button[type=submit]'), t = btn.querySelector('.t')
  btn.disabled = true; t.textContent = 'Guardando…'; $('#order-err').textContent = ''
  const payload = {
    status: of.status.value,
    assigned_to: of.assigned_to.value,
    scheduled_at: of.scheduled_at.value,
    internal_notes: of.internal_notes.value,
    note: of.note.value,
  }
  const res = await fetch('/api/admin/recolecciones?id=' + of.id.value, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  })
  const j = await res.json()
  if (res.ok) location.reload()
  else { $('#order-err').textContent = j.error || 'Error al guardar'; btn.disabled = false; t.textContent = 'Guardar' }
})

/* ---------- Contactos ---------- */
const CONTACT_STATUS_LABELS = { nuevo: 'Nuevo', atendido: 'Atendido' }

const listaContactos = crearLista({
  el: '#contact-list', buscador: '#contact-q', chipsEl: '#contact-chips',
  datos: () => contacts,
  texto: (c) => [c.name, c.company, c.email, c.phone, c.sector, c.service_lines, c.message].join(' '),
  vacio: ['Sin mensajes de contacto todavía', 'Los envíos del formulario público aparecen aquí.'],
  chips: [
    { id: 'nuevo', lbl: 'Sin atender', f: (c) => c.status === 'nuevo' },
    { id: 'atendido', lbl: 'Atendidos', f: (c) => c.status === 'atendido' },
    { id: 'todos', lbl: 'Todos', f: () => true },
  ],
  columnas: [
    { k: 'nombre', lbl: 'Contacto', orden: (c) => plano(c.name),
      html: (c) => `<div class="persona">${avatar(c.name, 'sm')}<div><div class="t1">${esc(c.name)}</div><div class="t2">${esc(c.company || c.email)}</div></div></div>` },
    { k: 'mensaje', lbl: 'Mensaje', html: (c) => `${c.sector ? `<div>${esc(c.sector)}</div>` : ''}<div class="t2 clip">${esc(c.message || c.service_lines || '')}</div>` },
    { k: 'canal', lbl: 'Correo y teléfono', html: (c) => `<div class="nw">${esc(c.email)}</div>${c.phone ? `<div class="t2">${esc(c.phone)}</div>` : ''}` },
    { k: 'estado', lbl: 'Estado', html: (c) => estado(c.status, CONTACT_STATUS_LABELS[c.status] || c.status), orden: (c) => c.status },
    { k: 'fecha', lbl: 'Recibido', cls: 'nw', html: (c) => `<span title="${esc(fmtDate(c.created_at))}">${esc(fmtRel(c.created_at))}</span>`, orden: (c) => c.created_at || '' },
    { k: 'acc', lbl: '', cls: 'der', html: (c) => `<button type="button" class="btn-mini" data-acc="alternar" data-id="${c.id}">${c.status === 'nuevo' ? 'Marcar atendido' : 'Reabrir'}</button>` },
  ],
  abrir: (id) => openContact(Number(id)),
  acciones: { alternar: (id) => toggleContact(Number(id)) },
})

// Número para WhatsApp: los celulares colombianos de 10 cifras llevan el 57.
const whatsapp = (tel) => {
  const d = String(tel || '').replace(/\D/g, '')
  if (!d) return ''
  return d.length === 10 && d[0] === '3' ? '57' + d : d
}

function openContact(id) {
  const c = contacts.find((x) => x.id === id)
  if (!c) return
  $('#contact-drawer-title').textContent = c.name
  const wa = whatsapp(c.phone)
  $('#contact-body').innerHTML = `
    <div class="ficha-cliente">
      <div class="ficha-cliente-top">${avatar(c.name)}<div><b>${esc(c.name)}</b><small>${c.company ? esc(c.company) + ' · ' : ''}Recibido ${esc(fmtDate(c.created_at))}</small></div></div>
      <dl class="datos-ficha">
        <dt>Estado</dt><dd>${estado(c.status, CONTACT_STATUS_LABELS[c.status] || c.status)}</dd>
        <dt>Correo</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd>
        ${c.phone ? `<dt>Teléfono</dt><dd>${esc(c.phone)}</dd>` : ''}
        ${c.sector ? `<dt>Sector</dt><dd>${esc(c.sector)}</dd>` : ''}
        ${c.service_lines ? `<dt>Líneas de interés</dt><dd>${esc(c.service_lines)}</dd>` : ''}
      </dl>
      ${c.message ? `<p class="cita">${esc(c.message)}</p>` : ''}
    </div>
    <div class="contacto-acciones">
      <a class="btn-ghost" href="mailto:${esc(c.email)}">Responder por correo</a>
      ${wa ? `<a class="btn-ghost" href="https://wa.me/${wa}" target="_blank" rel="noopener">Escribir por WhatsApp</a>` : ''}
    </div>
    <div class="drawer-actions">
      <button type="button" class="btn-ghost" data-close>Cerrar</button>
      <button type="button" class="btn-primary" id="contact-toggle">${c.status === 'nuevo' ? 'Marcar como atendido' : 'Reabrir'}</button>
    </div>`
  $('#contact-body [data-close]').addEventListener('click', closeDrawers)
  $('#contact-toggle').addEventListener('click', async () => { await toggleContact(id); openContact(id) })
  openDrawer('#contact-drawer')
}

async function toggleContact(id) {
  const c = contacts.find((x) => x.id === id)
  if (!c) return
  try {
    const res = await fetch('/api/admin/contactos?id=' + id, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: c.status === 'nuevo' ? 'atendido' : 'nuevo' }),
    })
    const j = await res.json()
    if (res.ok && j.contact) {
      const idx = contacts.findIndex((x) => x.id === id)
      if (idx >= 0) contacts[idx] = j.contact
      listaContactos.pintar()
      pintarInicio()
      contarPendientes()
    }
  } catch { /* silencioso: el usuario puede reintentar */ }
}

// El número de la barra lateral sigue al estado real de los contactos.
function contarPendientes() {
  const n = contacts.filter((c) => c.status === 'nuevo').length
  const b = $('.tab[data-tab="contactos"] .count')
  if (!b) return
  b.classList.toggle('is-alert', n > 0)
  b.textContent = n > 0 ? n : contacts.length
}

/* ---------- Usuarios (solo admin) ---------- */
const ROLE_LABELS = {
  admin: 'Administrador', operaciones: 'Operaciones', logistica: 'Logística',
  consultor: 'Consultor', finanzas: 'Finanzas', lectura: 'Solo lectura',
}
const uf = $('#user-form')

const listaUsuarios = crearLista({
  el: '#user-list', buscador: '#user-q', chipsEl: '#user-chips',
  datos: () => users,
  texto: (u) => [u.name, u.username, ROLE_LABELS[u.role]].join(' '),
  vacio: ['Sin usuarios', 'Cree el primero con el botón de arriba.'],
  chips: [
    { id: 'todos', lbl: 'Todos', f: () => true },
    { id: 'activos', lbl: 'Activos', f: (u) => !!u.active },
    { id: 'inactivos', lbl: 'Inactivos', f: (u) => !u.active, siHay: true },
  ],
  columnas: [
    { k: 'nombre', lbl: 'Persona', orden: (u) => plano(u.name),
      html: (u) => `<div class="persona">${avatar(u.name, 'sm')}<div><div class="t1">${esc(u.name)}</div><div class="t2">${esc(u.username)}</div></div></div>` },
    { k: 'rol', lbl: 'Rol', html: (u) => `<span class="pill ${u.role === 'admin' ? 'deep' : ''}">${esc(ROLE_LABELS[u.role] || u.role)}</span>`, orden: (u) => u.role },
    { k: 'estado', lbl: 'Cuenta', html: (u) => (u.active ? estado('activa', 'Activa') : estado('inactiva', 'Inactiva')), orden: (u) => (u.active ? 0 : 1) },
    { k: 'acc', lbl: '', cls: 'der', html: (u) => `<span class="acciones">
        <button type="button" class="btn-ico" data-acc="editar" data-id="${u.id}" title="Editar" aria-label="Editar ${esc(u.username)}">${svg('editar')}</button>
        <button type="button" class="btn-ico danger" data-acc="borrar" data-id="${u.id}" title="Eliminar" aria-label="Eliminar ${esc(u.username)}">${svg('borrar')}</button>
      </span>` },
  ],
  abrir: (id) => openUser(users.find((u) => u.id == id)),
  acciones: {
    editar: (id) => openUser(users.find((u) => u.id == id)),
    borrar: (id) => delUser(id, users.find((u) => u.id == id)?.username),
  },
})

function openUser(u) {
  uf.reset()
  $('#user-err').textContent = ''
  $('#user-drawer-title').textContent = u ? 'Editar usuario' : 'Nuevo usuario'
  uf.id.value = u?.id || ''
  uf.username.value = u?.username || ''
  uf.name.value = u?.name || ''
  uf.role.value = u?.role || 'lectura'
  uf.password.value = ''
  uf.password.placeholder = u ? 'Dejar vacío para no cambiarla' : 'Mín. 8 caracteres'
  uf.password.required = !u
  uf.active.checked = u ? !!u.active : true
  openDrawer('#user-drawer')
}

if (uf) {
  uf.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = uf.querySelector('button[type=submit]'), t = btn.querySelector('.t')
    btn.disabled = true; t.textContent = 'Guardando…'; $('#user-err').textContent = ''
    const payload = {
      id: uf.id.value || undefined,
      username: uf.username.value,
      name: uf.name.value,
      role: uf.role.value,
      active: uf.active.checked,
      password: uf.password.value || undefined,
    }
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    const j = await res.json()
    if (res.ok) location.reload()
    else { $('#user-err').textContent = j.error || 'Error al guardar'; btn.disabled = false; t.textContent = 'Guardar' }
  })
}
async function delUser(id, username) {
  if (!confirm(`¿Eliminar el usuario "${username}"? Perderá el acceso al panel.`)) return
  const res = await fetch('/api/admin/users?id=' + id, { method: 'DELETE' })
  const j = await res.json().catch(() => ({}))
  if (res.ok) location.reload(); else alert(j.error || 'No se pudo eliminar')
}
$('#new-user')?.addEventListener('click', () => openUser(null))

/* ---------- Blog ---------- */
const listaPosts = crearLista({
  el: '#post-list', buscador: '#post-q', chipsEl: '#post-chips',
  datos: () => posts,
  texto: (p) => [p.title, p.category, p.slug, p.lede].join(' '),
  vacio: ['Sin artículos todavía', 'Cree el primero con el botón de arriba.'],
  chips: [
    { id: 'todos', lbl: 'Todos', f: () => true },
    { id: 'publicados', lbl: 'Publicados', f: (p) => !p.borrador },
    { id: 'borradores', lbl: 'Borradores', f: (p) => !!p.borrador, siHay: true },
    { id: 'destacados', lbl: 'Destacados', f: (p) => !!p.featured, siHay: true },
    { id: 'sinimagen', lbl: 'Sin imagen', f: (p) => !p.image, siHay: true },
  ],
  pie: 'Los artículos sin imagen se ven genéricos al compartirlos en redes.',
  columnas: [
    { k: 'titulo', lbl: 'Artículo', orden: (p) => plano(p.title),
      html: (p) => `<div class="t1">${esc(p.title)}${p.featured ? ' <span class="pill feat">Destacado</span>' : ''}</div><div class="t2">/blog/${esc(p.slug)}</div>` },
    { k: 'cat', lbl: 'Categoría', html: (p) => `<span class="pill ${esc(p.accent)}">${esc(p.category)}</span>`, orden: (p) => plano(p.category) },
    { k: 'estado', lbl: 'Estado', html: (p) => `<div class="tags">${p.borrador ? estado('borrador', 'Borrador') : estado('publicado', 'Publicado')}${p.image ? '' : '<span class="pill warn">Sin imagen</span>'}</div>`, orden: (p) => (p.borrador ? 1 : 0) },
    { k: 'fecha', lbl: 'Fecha', cls: 'nw', html: (p) => esc(p.date), orden: (p) => fechaTexto(p.date) },
    { k: 'lectura', lbl: 'Lectura', cls: 'nw', html: (p) => esc(p.readtime), orden: (p) => parseInt(p.readtime) || 0 },
    { k: 'acc', lbl: '', cls: 'der', html: (p) => `<span class="acciones">
        <a class="btn-ico" href="/blog/${esc(p.slug)}" target="_blank" title="Ver en el sitio" aria-label="Ver en el sitio"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg></a>
        <button type="button" class="btn-ico" data-acc="editar" data-id="${p.id}" title="Editar" aria-label="Editar">${svg('editar')}</button>
        <button type="button" class="btn-ico danger" data-acc="borrar" data-id="${p.id}" title="Eliminar" aria-label="Eliminar">${svg('borrar')}</button>
      </span>` },
  ],
  abrir: (id) => openPost(posts.find((p) => p.id == id)),
  acciones: {
    editar: (id) => openPost(posts.find((p) => p.id == id)),
    borrar: (id) => delPost(id, posts.find((p) => p.id == id)?.title),
  },
})

/* ---------- Normativas ---------- */
const listaNorms = crearLista({
  el: '#norm-list', buscador: '#norm-q', chipsEl: '#norm-chips',
  datos: () => norms,
  texto: (n) => [n.code, n.title, n.body, ...(n.tags || [])].join(' '),
  vacio: ['Sin normativas todavía', 'Cree la primera con el botón de arriba.'],
  chips: [
    { id: 'todas', lbl: 'Todas', f: () => true },
    { id: 'c1', lbl: 'Columna 1', f: (n) => n.col !== 2 },
    { id: 'c2', lbl: 'Columna 2', f: (n) => n.col === 2 },
    { id: 'borradores', lbl: 'Borradores', f: (n) => !!n.borrador, siHay: true },
  ],
  columnas: [
    { k: 'codigo', lbl: 'Código', cls: 'num', html: (n) => esc(n.code), orden: (n) => plano(n.code) },
    { k: 'titulo', lbl: 'Normativa', orden: (n) => plano(n.title), html: (n) => `<div class="t1">${esc(n.title)}</div>${n.body ? `<div class="t2 clip">${esc(n.body)}</div>` : ''}` },
    { k: 'tags', lbl: 'Etiquetas', html: (n) => `<div class="tags">${(n.tags || []).map((t) => `<span class="pill">${esc(t)}</span>`).join('')}</div>` },
    { k: 'pos', lbl: 'Ubicación', cls: 'nw', html: (n) => `Col. ${n.col === 2 ? 2 : 1} · #${esc(n.position)}`, orden: (n) => (n.col === 2 ? 1000 : 0) + Number(n.position || 0) },
    { k: 'estado', lbl: 'Estado', html: (n) => (n.borrador ? estado('borrador', 'Borrador') : estado('publicado', 'Publicada')), orden: (n) => (n.borrador ? 1 : 0) },
    { k: 'acc', lbl: '', cls: 'der', html: (n) => `<span class="acciones">
        <button type="button" class="btn-ico" data-acc="editar" data-id="${n.id}" title="Editar" aria-label="Editar">${svg('editar')}</button>
        <button type="button" class="btn-ico danger" data-acc="borrar" data-id="${n.id}" title="Eliminar" aria-label="Eliminar">${svg('borrar')}</button>
      </span>` },
  ],
  abrir: (id) => openNorm(norms.find((n) => n.id == id)),
  acciones: {
    editar: (id) => openNorm(norms.find((n) => n.id == id)),
    borrar: (id) => delNorm(id, norms.find((n) => n.id == id)?.code),
  },
})

/* ---------- Inicio ---------- */
// Indicadores, embudo y pendientes salen de los mismos datos que las listas.
function pintarInicio() {
  const kpis = $('#inicio-kpis')
  if (!kpis) return
  const abiertas = orders.filter(abierta)
  const porConfirmar = orders.filter((o) => o.status === 'solicitada')
  const semana = orders.filter((o) => {
    const n = diasDesde(o.scheduled_at)
    return abierta(o) && n !== null && n <= 0 && n >= -7
  })
  const nuevos = contacts.filter((c) => c.status === 'nuevo')
  const terminadas = orders.filter((o) => o.status === 'certificada' || o.status === 'cerrada').length
  const tarjeta = (c, lbl, num, sub, tab, chip, alerta) =>
    `<button type="button" class="kpi${alerta ? ' is-alerta' : ''}" style="--c:${c}" data-ir="${tab}" data-chip="${chip}">
      <span class="kpi-lbl">${lbl}</span><span class="kpi-num">${num}</span><span class="kpi-sub">${sub}</span></button>`
  kpis.innerHTML = [
    tarjeta('#1f8a8a', 'Recolecciones abiertas', abiertas.length, `${terminadas} certificadas o cerradas en total`, 'recolecciones', 'abiertas'),
    tarjeta('#e8920c', 'Por confirmar', porConfirmar.length, porConfirmar.length ? `La más antigua: ${fmtRel(porConfirmar.map((o) => o.created_at).sort()[0]).toLowerCase()}` : 'Todo confirmado', 'recolecciones', 'solicitada', porConfirmar.length > 0),
    tarjeta('#8b5cf6', 'Programadas en 7 días', semana.length, semana.length ? 'Recolecciones con fecha esta semana' : 'Nada agendado esta semana', 'recolecciones', 'programada'),
    tarjeta('#2f80c9', 'Contactos sin atender', nuevos.length, `${contacts.length} mensajes recibidos en total`, 'contactos', 'nuevo', nuevos.length > 0),
  ].join('')

  const max = Math.max(1, ...FLUJO.map((s) => orders.filter((o) => o.status === s).length))
  $('#inicio-embudo').innerHTML = `<div class="embudo">${FLUJO.map((s) => {
    const n = orders.filter((o) => o.status === s).length
    return `<button type="button" class="embudo-fila c-${s}" data-ir="recolecciones" data-chip="${s}">
      <span>${STATUS_LABELS[s]}</span><span class="embudo-barra"><i style="width:${(n / max) * 100}%"></i></span><b>${n}</b></button>`
  }).join('')}</div>`

  const pendientes = [
    ...porConfirmar.map((o) => ({ t: o.created_at, tipo: 'orden', id: o.id, tit: o.company || cliente(o), sub: `${o.consecutive} · ${o.city} · sin confirmar` })),
    ...nuevos.map((c) => ({ t: c.created_at, tipo: 'contacto', id: c.id, tit: c.name, sub: `${c.company ? c.company + ' · ' : ''}mensaje sin responder` })),
  ].sort((a, b) => String(a.t).localeCompare(String(b.t))).slice(0, 6)
  $('#inicio-atencion').innerHTML = pendientes.length ? feed(pendientes) : '<div class="vacio"><b>Todo al día</b>No hay solicitudes ni mensajes esperando respuesta.</div>'

  const recientes = [
    ...orders.map((o) => ({ t: o.created_at, tipo: 'orden', id: o.id, tit: `${o.company || cliente(o)} pidió una recolección`, sub: `${o.consecutive} · ${o.city} · ${STATUS_LABELS[o.status] || o.status}` })),
    ...contacts.map((c) => ({ t: c.created_at, tipo: 'contacto', id: c.id, tit: `${c.name} escribió por el formulario`, sub: c.message || c.company || c.email })),
  ].sort((a, b) => String(b.t).localeCompare(String(a.t))).slice(0, 8)
  $('#inicio-actividad').innerHTML = recientes.length ? feed(recientes) : '<div class="vacio"><b>Sin actividad todavía</b>Las solicitudes y mensajes del sitio aparecen aquí.</div>'
}
function feed(items) {
  return `<ul class="feed">${items.map((x) => `<li><button type="button" data-abrir="${x.tipo}" data-id="${x.id}">
    <span class="feed-ico" style="--c:${x.tipo === 'orden' ? '#1f8a8a' : '#2f80c9'}">${svg(x.tipo === 'orden' ? 'camion' : 'mensaje')}</span>
    <span class="feed-txt"><b>${esc(x.tit)}</b><small>${esc(x.sub)}</small></span>
    <time title="${esc(fmtDate(x.t))}">${esc(fmtRel(x.t))}</time></button></li>`).join('')}</ul>`
}
$('#panel-inicio')?.addEventListener('click', (e) => {
  const a = e.target.closest('[data-abrir]')
  if (a) { (a.dataset.abrir === 'orden' ? openOrder : openContact)(Number(a.dataset.id)); return }
  const b = e.target.closest('[data-ir]')
  if (!b) return
  ir(b.dataset.ir)
  if (b.dataset.vista) vistaRecolecciones(b.dataset.vista)
  else if (b.dataset.chip) {
    if (b.dataset.ir === 'recolecciones') { vistaRecolecciones('tabla'); listaOrdenes.chip(b.dataset.chip) }
    if (b.dataset.ir === 'contactos') listaContactos.chip(b.dataset.chip)
  }
})

/* ---------- Drawers ---------- */
function openDrawer(id) { $(id).hidden = false }
function closeDrawers() { $$('.drawer').forEach((d) => (d.hidden = true)) }
$$('[data-close]').forEach((b) => b.addEventListener('click', closeDrawers))
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawers() })

/* ---------- Sections editor ---------- */
const PLACEHOLDER = { p: 'Párrafo…', h2: 'Subtítulo', pull: 'Cita destacada', list: 'Un ítem por línea' }
function addSection(type, data) {
  const wrap = document.createElement('div')
  wrap.className = 'sec-row'
  wrap.dataset.type = type
  const value = type === 'list' ? (data?.items || []).join('\n') : (data?.text || '')
  wrap.innerHTML = `
    <select class="sec-type">
      ${['p', 'h2', 'pull', 'list'].map((t) => `<option value="${t}"${t === type ? ' selected' : ''}>${({ p: 'Párrafo', h2: 'Subtítulo', pull: 'Cita', list: 'Lista' })[t]}</option>`).join('')}
    </select>
    <textarea class="sec-text" rows="${type === 'p' || type === 'list' ? 4 : 2}" placeholder="${PLACEHOLDER[type]}"></textarea>
    <button type="button" class="sec-del" title="Eliminar">×</button>`
  wrap.querySelector('.sec-text').value = value
  wrap.querySelector('.sec-type').addEventListener('change', (e) => {
    wrap.dataset.type = e.target.value
    wrap.querySelector('.sec-text').placeholder = PLACEHOLDER[e.target.value]
  })
  wrap.querySelector('.sec-del').addEventListener('click', () => wrap.remove())
  $('#sections').appendChild(wrap)
}
function collectSections() {
  return $$('#sections .sec-row').map((row) => {
    const type = row.querySelector('.sec-type').value
    const text = row.querySelector('.sec-text').value
    if (type === 'list') return { type, items: text.split('\n').map((x) => x.trim()).filter(Boolean) }
    return { type, text: text.trim() }
  }).filter((s) => (s.type === 'list' ? s.items.length : s.text))
}
$$('[data-add]').forEach((b) => b.addEventListener('click', () => addSection(b.dataset.add)))

/* ---------- Post editor ---------- */
const pf = $('#post-form')
function openPost(post) {
  pf.reset()
  $('#post-err').textContent = ''
  $('#sections').innerHTML = ''
  $('#post-drawer-title').textContent = post ? 'Editar artículo' : 'Nuevo artículo'
  pf.id.value = post?.id || ''
  pf.title.value = post?.title || ''
  pf.slug.value = post?.slug || ''
  pf.category.value = post?.category || ''
  pf.date.value = post?.date || ''
  pf.readtime.value = post?.readtime || ''
  pf.accent.value = post?.accent || 'deep'
  pf.featured.checked = !!post?.featured
  pf.borrador.checked = !!post?.borrador
  pf.lede.value = post?.lede || ''
  pf.image.value = post?.image || ''
  ;(post?.sections || [{ type: 'p' }]).forEach((s) => addSection(s.type || 'p', s))
  openDrawer('#post-drawer')
}
pf.addEventListener('submit', async (e) => {
  e.preventDefault()
  const btn = pf.querySelector('button[type=submit]'), t = btn.querySelector('.t')
  btn.disabled = true; t.textContent = 'Guardando…'; $('#post-err').textContent = ''
  const payload = {
    id: pf.id.value || undefined,
    title: pf.title.value, slug: pf.slug.value, category: pf.category.value,
    date: pf.date.value, readtime: pf.readtime.value, accent: pf.accent.value,
    featured: pf.featured.checked, borrador: pf.borrador.checked, lede: pf.lede.value, image: pf.image.value,
    sections: collectSections(),
  }
  const res = await fetch('/api/admin/posts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  const j = await res.json()
  if (res.ok) location.reload()
  else { $('#post-err').textContent = j.error || 'Error al guardar'; btn.disabled = false; t.textContent = 'Guardar' }
})
async function delPost(id, title) {
  if (!confirm(`¿Eliminar el artículo "${title}"? Esta acción no se puede deshacer.`)) return
  const res = await fetch('/api/admin/posts?id=' + id, { method: 'DELETE' })
  if (res.ok) location.reload(); else alert('No se pudo eliminar')
}
$('#new-post').addEventListener('click', () => openPost(null))

/* ---------- Normativa editor ---------- */
const nf = $('#norm-form')
function openNorm(norm) {
  nf.reset(); $('#norm-err').textContent = ''
  $('#norm-drawer-title').textContent = norm ? 'Editar normativa' : 'Nueva normativa'
  nf.id.value = norm?.id || ''
  nf.code.value = norm?.code || ''
  nf.col.value = String(norm?.col || 1)
  nf.title.value = norm?.title || ''
  nf.body.value = norm?.body || ''
  nf.tags.value = (norm?.tags || []).join(', ')
  nf.position.value = norm?.position ?? 0
  nf.borrador.checked = !!norm?.borrador
  openDrawer('#norm-drawer')
}
nf.addEventListener('submit', async (e) => {
  e.preventDefault()
  const btn = nf.querySelector('button[type=submit]'), t = btn.querySelector('.t')
  btn.disabled = true; t.textContent = 'Guardando…'; $('#norm-err').textContent = ''
  const payload = {
    id: nf.id.value || undefined, code: nf.code.value, col: Number(nf.col.value),
    title: nf.title.value, body: nf.body.value, tags: nf.tags.value, position: Number(nf.position.value),
    borrador: nf.borrador.checked,
  }
  const res = await fetch('/api/admin/normativas', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  const j = await res.json()
  if (res.ok) location.reload()
  else { $('#norm-err').textContent = j.error || 'Error al guardar'; btn.disabled = false; t.textContent = 'Guardar' }
})
async function delNorm(id, code) {
  if (!confirm(`¿Eliminar la normativa "${code}"?`)) return
  const res = await fetch('/api/admin/normativas?id=' + id, { method: 'DELETE' })
  if (res.ok) location.reload(); else alert('No se pudo eliminar')
}
$('#new-norm').addEventListener('click', () => openNorm(null))


/* ---------- Init ---------- */
listaOrdenes.pintar()
listaContactos.pintar()
listaPosts.pintar()
listaNorms.pintar()
listaUsuarios.pintar()
pintarInicio()

/* ---------- Abrir desde la URL ---------- */
// Los enlaces del asistente apuntan a /admin?tab=<pestaña>&id=<id>: se abre
// la sección y, si hay ficha, su editor o su detalle. El id se quita de la
// URL para que un guardado posterior no vuelva a abrir la misma ficha.
;(() => {
  const params = new URLSearchParams(location.search)
  const tab = params.get('tab')
  const id = Number(params.get('id'))
  if (!tab || !ir(tab, { url: false })) return
  if (!id) return
  if (tab === 'recolecciones') openOrder(id)
  else if (tab === 'contactos') openContact(id)
  else if (tab === 'blog') { const p = posts.find((x) => x.id == id); if (p) openPost(p) }
  else if (tab === 'normativas') { const n = norms.find((x) => x.id == id); if (n) openNorm(n) }
  else if (tab === 'usuarios') { const u = users.find((x) => x.id == id); if (u) openUser(u) }
  const u = new URL(location.href)
  u.searchParams.delete('id')
  history.replaceState(null, '', u)
})()
