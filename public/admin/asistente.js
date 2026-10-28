// Caja "Pregunte o busque algo" del panel (docs/plan-asistente.md, fase 8).
//
// Mientras se escribe, busca SIN IA (/api/admin/asistente/buscar). Al enviar,
// pregunta al asistente y lee la transmisión en vivo (SSE): pasos, respuesta
// y, si propone un cambio, la tarjeta para aprobarlo.
//
// Todo se construye con nodos y textContent, nunca con innerHTML: la respuesta
// la escribe un modelo que leyó mensajes de terceros, y un enlace o una
// etiqueta inyectados en su texto no pueden volverse HTML del panel.

const $ = (s, r = document) => r.querySelector(s)
const ASIS = window.__ASIS__ || {}

const form = $('#asis-form')
const caja = $('#asis-q')
const hilo = $('#asis-hilo')
const resultados = $('#asis-resultados')

let conversacion = null
let ocupado = false
let tarjetaAbierta = null

// ── Utilidades de DOM ───────────────────────────────────────────────────

function el(tag, attrs = {}, ...hijos) {
  const n = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue
    if (k === 'class') n.className = v
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v)
    else n.setAttribute(k, v === true ? '' : v)
  }
  for (const h of hijos.flat()) if (h != null && h !== false) n.append(h instanceof Node ? h : document.createTextNode(String(h)))
  return n
}

/** Solo rutas internas del panel: nada de javascript:, dominios externos ni //. */
const rutaSegura = (href) => /^\/(?!\/)[\w\-./?=&#%]*$/.test(String(href)) && String(href).startsWith('/admin')

/** Negrita y enlaces [texto](/admin...) dentro de una línea, como nodos. */
function enLinea(texto) {
  const partes = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let i = 0
  let m
  while ((m = re.exec(texto))) {
    if (m.index > i) partes.push(texto.slice(i, m.index))
    if (m[1]) partes.push(el('strong', {}, m[1]))
    else partes.push(rutaSegura(m[3]) ? el('a', { href: m[3] }, m[2]) : m[2])
    i = re.lastIndex
  }
  if (i < texto.length) partes.push(texto.slice(i))
  return partes
}

/** Párrafos y listas con "- ". */
function bloques(texto) {
  const frag = document.createDocumentFragment()
  for (const parrafo of String(texto).trim().split(/\n{2,}/)) {
    const lineas = parrafo.split('\n')
    if (lineas.every((l) => /^\s*[-•]\s+/.test(l))) {
      frag.append(el('ul', {}, lineas.map((l) => el('li', {}, enLinea(l.replace(/^\s*[-•]\s+/, ''))))))
    } else {
      const p = el('p')
      lineas.forEach((l, k) => { if (k) p.append(el('br')); p.append(...enLinea(l)) })
      frag.append(p)
    }
  }
  return frag
}

// Rayas largas y medias como puntuación: el modelo las pone igual; se quitan al mostrar.
const RAYAS = new RegExp('\\s*[' + String.fromCharCode(8211, 8212) + ']\\s*', 'g')
const sinRayas = (t) => String(t).replace(RAYAS, ', ')

// ── Pasos en lenguaje natural ───────────────────────────────────────────

const cita = (v, max = 40) => { const s = String(v ?? '').trim(); return s.length > max ? s.slice(0, max) + '…' : s }
const PASOS = {
  recolecciones: (e) => (e.id || e.consecutivo ? `Abriendo la orden ${cita(e.consecutivo || e.id)}` : 'Revisando las recolecciones'),
  contactos: () => 'Revisando los mensajes de contacto',
  cumplimiento: (e) => (e.que === 'expedientes' ? 'Revisando los expedientes' : e.que === 'actos' ? 'Revisando los actos recibidos' : 'Revisando las alertas de cumplimiento'),
  contenido: (e) => (e.tipo === 'normativas' ? 'Revisando las normativas' : 'Revisando los artículos del blog'),
  buscar_en_panel: (e) => `Buscando «${cita(e.consulta)}» en el panel`,
  actualizar_recoleccion: () => 'Guardando el cambio en la orden',
  actualizar_contacto: () => 'Marcando los contactos',
  actualizar_alerta: () => 'Guardando el cambio en la alerta',
  crear_borrador_articulo: () => 'Guardando el borrador del artículo',
  crear_borrador_normativa: () => 'Guardando el borrador de la normativa',
}
const textoPaso = (h, e = {}) => (PASOS[h] ? PASOS[h](e) : 'Consultando')

// ── Turnos ──────────────────────────────────────────────────────────────

function nuevoTurno(pregunta) {
  const t = {
    nodo: el('article', { class: 'asis-turno' }),
    pasos: el('ul', { class: 'asis-pasos' }),
    cuerpo: el('div', { class: 'asis-respuesta' }),
  }
  t.nodo.append(el('p', { class: 'asis-pregunta' }, pregunta), t.pasos, t.cuerpo)
  hilo.append(t.nodo)
  return t
}

const pensando = (t, si) => t.nodo.classList.toggle('is-pensando', si)

function tarjeta(t, propuesta, soloLectura = false) {
  const v = propuesta.vista || {}
  const card = el('div', { class: 'asis-card', role: 'group', 'aria-label': 'Cambio propuesto' })
  card.append(
    el('div', { class: 'asis-card-head' }, el('span', { class: 'asis-punto' }), el('span', { class: 'asis-card-rotulo' }, v.rotulo || 'Cambio propuesto')),
    el('p', { class: 'asis-card-titulo' }, v.titulo || propuesta.origen || ''),
  )
  if (v.contexto) card.append(el('p', { class: 'asis-card-contexto' }, v.contexto))
  if (Array.isArray(v.cambios) && v.cambios.length) {
    card.append(el('dl', { class: 'asis-cambios' }, v.cambios.map((c) => [
      el('dt', {}, c.campo),
      el('dd', {}, c.antes != null ? el('s', {}, c.antes) : null, c.antes != null ? ' → ' : null, el('span', { class: 'asis-despues' }, c.despues ?? 'vacío')),
    ])))
  }
  for (const a of v.avisos || []) card.append(el('p', { class: 'asis-aviso' }, a))
  if (v.nota) card.append(el('p', { class: 'asis-card-nota' }, v.nota))

  const acciones = el('div', { class: 'asis-card-acciones' })
  if (soloLectura) {
    acciones.append(el('p', { class: 'asis-card-nota' }, 'Esperando la decisión de quien la pidió.'))
  } else {
    acciones.append(
      el('button', { type: 'button', class: 'btn-primary', 'data-asis-aprobar': true, onclick: () => decidir(true) }, v.boton || 'Aprobar'),
      el('button', { type: 'button', class: 'btn-ghost', 'data-asis-descartar': true, onclick: () => decidir(false) }, 'Descartar'),
      el('span', { class: 'asis-card-nota' }, 'O escriba abajo qué cambiar.'),
    )
  }
  card.append(acciones)
  t.cuerpo.append(card)
  tarjetaAbierta = { card, turno: t }
}

function sellar(texto, aprobado) {
  if (!tarjetaAbierta) return
  const { card } = tarjetaAbierta
  card.classList.add(aprobado ? 'is-aprobada' : 'is-descartada')
  card.querySelector('.asis-card-acciones').replaceChildren(el('p', { class: 'asis-sello' }, texto))
  tarjetaAbierta = null
}

const error = (t, mensaje) => t.cuerpo.append(el('p', { class: 'asis-error' }, mensaje))

// ── Transmisión en vivo ─────────────────────────────────────────────────

async function leer(respuesta, t) {
  const lector = respuesta.body.getReader()
  const dec = new TextDecoder()
  let buffer = ''
  let cerrado = false
  while (true) {
    const { value, done } = await lector.read()
    if (done) break
    buffer += dec.decode(value, { stream: true })
    let corte
    while ((corte = buffer.indexOf('\n\n')) >= 0) {
      const crudo = buffer.slice(0, corte)
      buffer = buffer.slice(corte + 2)
      const linea = crudo.split('\n').find((l) => l.startsWith('data: '))
      if (!linea) continue
      let ev
      try { ev = JSON.parse(linea.slice(6)) } catch { continue }
      if (evento(ev, t)) cerrado = true
    }
  }
  // La conexión se cortó, pero la tarea sigue en el servidor y queda guardada.
  if (!cerrado) error(t, 'Se cortó la conexión. La respuesta queda guardada: recargue para verla.')
}

/** Devuelve true si el evento cierra el turno. */
function evento(ev, t) {
  switch (ev.tipo) {
    case 'conversacion':
      if (conversacion !== ev.id) {
        conversacion = ev.id
        const url = new URL(location.href)
        url.searchParams.set('c', ev.id)
        history.replaceState(null, '', url)
      }
      return false
    case 'paso':
      t.pasos.append(el('li', {}, textoPaso(ev.herramienta, ev.entrada)))
      return false
    case 'dato':
      if (ev.datos && ev.datos.hecho) {
        sellar('Aprobado y guardado.', true)
        t.cuerpo.append(el('p', { class: 'asis-hecho' }, ev.datos.resumen + '. ', rutaSegura(ev.datos.enlace) ? el('a', { href: ev.datos.enlace }, 'Ver') : null))
      }
      return false
    case 'texto':
      t.cuerpo.append(bloques(sinRayas(ev.texto)))
      return false
    case 'aprobacion':
      pensando(t, false)
      tarjeta(t, ev)
      return false
    case 'decision':
      if (tarjetaAbierta) sellar(ev.aprobado ? 'Aprobado.' : 'Descartado.', ev.aprobado)
      return false
    case 'fin':
      pensando(t, false)
      if (ev.estado === 'fallida' && ev.error) {
        error(t, ev.error)
        conversacion = null
      }
      return true
    case 'error':
      pensando(t, false)
      error(t, 'Algo falló al responder. Intente de nuevo.')
      return true
    default:
      return false
  }
}

async function enviar(url, cuerpo, t) {
  ocupado = true
  form.classList.add('is-ocupado')
  pensando(t, true)
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) })
    if (!r.ok || !(r.headers.get('content-type') || '').includes('event-stream')) {
      const j = await r.json().catch(() => ({}))
      pensando(t, false)
      error(t, j.error || 'No se pudo responder.')
      if (j.nueva) conversacion = null
      return
    }
    await leer(r, t)
  } catch {
    pensando(t, false)
    error(t, 'Sin conexión con el panel. Revise su internet e intente de nuevo.')
  } finally {
    ocupado = false
    form.classList.remove('is-ocupado')
    caja.focus()
  }
}

async function preguntar(pregunta) {
  if (ocupado || !pregunta || !ASIS.ia) return
  ocultarResultados()
  // Escribir con una tarjeta abierta es pedir cambios: el servidor la descarta.
  if (tarjetaAbierta) sellar('Pidió cambios.', false)
  const t = nuevoTurno(pregunta)
  await enviar('/api/admin/asistente', { pregunta, id: conversacion }, t)
}

async function decidir(aprobado) {
  if (ocupado || !tarjetaAbierta || !conversacion) return
  const t = tarjetaAbierta.turno
  tarjetaAbierta.card.querySelectorAll('button').forEach((b) => (b.disabled = true))
  await enviar('/api/admin/asistente/decision', { id: conversacion, aprobado }, t)
}

// ── Buscador sin IA ─────────────────────────────────────────────────────

let temporizador = null
let ultimaBusqueda = ''

function ocultarResultados() {
  resultados.hidden = true
  resultados.replaceChildren()
}

async function buscar(q) {
  ultimaBusqueda = q
  const r = await fetch('/api/admin/asistente/buscar?q=' + encodeURIComponent(q)).catch(() => null)
  if (!r || !r.ok || ultimaBusqueda !== q) return
  const d = await r.json()
  const items = [
    ...(d.secciones || []).map((s) => ({ tipo: 'Sección', titulo: s.titulo, enlace: s.enlace })),
    ...(d.fichas || []),
  ].filter((x) => rutaSegura(x.enlace))
  if (!items.length) return ocultarResultados()
  resultados.replaceChildren(
    ...items.slice(0, 8).map((x) => el('a', { href: x.enlace, class: 'asis-resultado' }, el('span', { class: 'asis-res-tipo' }, x.tipo), el('span', {}, x.titulo))),
    ASIS.ia ? el('p', { class: 'asis-res-pie' }, 'Enter para preguntarle a la IA') : null,
  )
  resultados.hidden = false
}

caja.addEventListener('input', () => {
  caja.style.height = 'auto'
  caja.style.height = Math.min(caja.scrollHeight, 200) + 'px'
  clearTimeout(temporizador)
  const q = caja.value.trim()
  if (q.length < 2 || q.length > 80) return ocultarResultados()
  temporizador = setTimeout(() => buscar(q), 220)
})

caja.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    form.requestSubmit()
  }
  if (e.key === 'Escape') ocultarResultados()
})

form.addEventListener('submit', (e) => {
  e.preventDefault()
  const q = caja.value.trim()
  if (!q) return
  if (!ASIS.ia) return buscar(q)
  caja.value = ''
  caja.style.height = 'auto'
  preguntar(q)
})

document.addEventListener('click', (e) => {
  if (!form.contains(e.target)) ocultarResultados()
})

for (const b of document.querySelectorAll('[data-atajo]')) {
  b.addEventListener('click', () => preguntar(b.dataset.atajo))
}

// ── Conversación abierta desde ?c= ──────────────────────────────────────

const ini = ASIS.inicial
if (ini) {
  conversacion = ini.ajena || ini.estado === 'fallida' ? null : ini.id
  if (ini.ajena) hilo.append(el('p', { class: 'asis-ajena' }, `Conversación de ${ini.dueno}. Solo lectura.`))
  let ultimo = null
  for (const turno of ini.turnos || []) {
    const t = nuevoTurno(turno.pregunta)
    for (const p of turno.pasos || []) t.pasos.append(el('li', {}, textoPaso(p)))
    if (turno.respuesta) t.cuerpo.append(bloques(turno.respuesta))
    ultimo = t
  }
  if (ini.propuesta && ultimo) tarjeta(ultimo, ini.propuesta, ini.ajena)
  if (ini.estado === 'fallida' && ini.error && ultimo) error(ultimo, `${ini.error} Empiece una conversación nueva.`)
  if (ultimo) ultimo.nodo.scrollIntoView({ block: 'nearest' })
}

// ── Pestaña de límites y consumo (solo admin) ───────────────────────────

const fTopes = $('#ia-topes')
if (fTopes && ASIS.esAdmin) {
  const usd = (n) => 'US$' + Number(n || 0).toFixed(2)
  const cargarTopes = async () => {
    const r = await fetch('/api/admin/asistente/topes')
    if (!r.ok) return
    const d = await r.json()
    fTopes.empresaUsd.value = d.empresaUsd
    fTopes.usuarioUsd.value = d.usuarioUsd
    $('#ia-hoy').textContent = `Hoy la empresa lleva ${usd(d.gastoEmpresaUsd)} de ${usd(d.empresaUsd)}.`
  }
  fTopes.addEventListener('submit', async (e) => {
    e.preventDefault()
    $('#ia-err').textContent = ''
    const r = await fetch('/api/admin/asistente/topes', {
      method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ empresaUsd: Number(fTopes.empresaUsd.value), usuarioUsd: Number(fTopes.usuarioUsd.value) }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) $('#ia-err').textContent = j.error || 'No se pudo guardar'
    else cargarTopes()
  })

  const mes = $('#ia-mes')
  mes.value = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date()).slice(0, 7)
  const cargarConsumo = async () => {
    $('#ia-csv').href = `/api/admin/asistente/consumo?mes=${mes.value}&formato=csv`
    const r = await fetch('/api/admin/asistente/consumo?mes=' + mes.value)
    const destino = $('#ia-consumo')
    if (!r.ok) return destino.replaceChildren(el('p', { class: 'form-error' }, 'No se pudo cargar el consumo.'))
    const d = await r.json()
    destino.replaceChildren(
      el('p', { class: 'ia-total' }, el('strong', {}, usd(d.totalUsd)), ` en ${d.llamadas} llamadas a la IA y ${d.conversaciones} conversaciones`),
      d.porUsuario.length
        ? el('table', { class: 'ia-tabla' },
            el('thead', {}, el('tr', {}, el('th', {}, 'Persona'), el('th', {}, 'Conversaciones'), el('th', {}, 'Estimado'))),
            el('tbody', {}, d.porUsuario.map((u) => el('tr', {}, el('td', {}, u.usuario), el('td', {}, String(u.conversaciones)), el('td', {}, usd(u.usd))))))
        : el('p', { class: 'muted' }, 'Sin consumo este mes.'),
      el('p', { class: 'muted ia-nota' }, d.nota),
    )
  }
  mes.addEventListener('change', cargarConsumo)
  document.querySelector('.tab[data-tab="ia"]')?.addEventListener('click', () => { cargarTopes(); cargarConsumo() }, { once: true })
}
