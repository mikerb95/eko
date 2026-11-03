// Academia de IA en el panel: participantes, entregas, lecciones, sábados y
// certificados. Cada escritura va a /api/admin/academia y devuelve el estado
// completo ya recalculado (avance y requisitos incluidos): aquí solo se pinta.
import { $, $$, esc, fmtDate, fmtCorto, avatar, estado as pastilla, crearLista } from './comun.js'

const A = window.__ACADEMIA__ || {}
const C = A.catalogos || { modulos: [], colores: {}, sitio: '' }
const API = '/api/admin/academia'
let E = A.estado || { hoy: new Date().toISOString().slice(0, 10), personas: [], cuentas: [], lecciones: [], sesiones: [], entregas: [], certificados: [], areas: [] }

/* ---------- Utilidades ---------- */
const nombreModulo = (id) => C.modulos.find((m) => m.id === id)?.etiqueta || id
const color = (id) => C.colores[id] || '#124E7D'
const punto = (id) => `<i class="ac-dot" style="--c:${color(id)}" aria-hidden="true"></i>`
const opciones = (lista, actual, vacio) =>
  (vacio !== undefined ? `<option value="">${esc(vacio)}</option>` : '') +
  lista.map((o) => `<option value="${esc(o.id)}"${String(o.id) === String(actual ?? '') ? ' selected' : ''}>${esc(o.etiqueta ?? o.nombre)}</option>`).join('')
const horas = (n) => `${(Number(n) || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })} h`
const ESTADO_ENTREGA = { enviada: ['solicitada', 'Por revisar'], aprobada: ['activa', 'Aprobada'], devuelta: ['borrador', 'Devuelta'] }

function avisoError(e) {
  const el = document.createElement('div')
  el.className = 'banner-error'
  el.textContent = e?.message || 'Ocurrió un error'
  document.querySelector('.admin-main').prepend(el)
  setTimeout(() => el.remove(), 6000)
}

/** Borrar pide un segundo clic en vez de un diálogo del navegador. */
function confirmarClic(btn, accion) {
  if (btn.dataset.confirmando) { delete btn.dataset.confirmando; btn.textContent = btn.dataset.texto; return accion() }
  btn.dataset.texto = btn.textContent
  btn.dataset.confirmando = '1'
  btn.textContent = '¿Seguro? Clic de nuevo'
  setTimeout(() => { if (btn.dataset.confirmando) { delete btn.dataset.confirmando; btn.textContent = btn.dataset.texto } }, 3500)
}

async function enviar(accion, datos = {}) {
  const res = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accion, ...datos }) })
  const r = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(r.error || 'Ocurrió un error')
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
  $$('.subtabs .subtab').forEach((x) => x.classList.toggle('is-active', x.dataset.tab === tab))
  $$('.panel').forEach((x) => x.classList.toggle('is-active', x.id === 'panel-' + tab))
}
$$('.subtab[data-tab]').forEach((t) => t.addEventListener('click', () => irA(t.dataset.tab)))
const abrir = (d) => { d.hidden = false }
const cerrar = (d) => { d.hidden = true }
$$('.drawer').forEach((d) => $$('[data-close]', d).forEach((x) => x.addEventListener('click', () => cerrar(d))))
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return
  const abiertos = $$('.drawer').filter((d) => !d.hidden)
  if (abiertos.length) cerrar(abiertos[abiertos.length - 1])
})

/* ---------- Participantes ---------- */
function estadoCert(p) {
  if (p.certificado) return pastilla('activa', 'Emitido')
  if (p.requisitos.elegible) return pastilla('solicitada', 'Listo para emitir')
  return '<span class="muted">En curso</span>'
}

function renderKpis() {
  const porRevisar = E.entregas.filter((e) => e.estado === 'enviada').length
  const emitidos = E.certificados.filter((c) => !c.revocado_at).length
  const proximos = E.sesiones.filter((s) => s.fecha >= E.hoy)
  const prox = proximos[0]
  const prom = E.personas.length ? Math.round(E.personas.reduce((t, p) => t + p.avance.porcentaje, 0) / E.personas.length) : 0
  $('#ac-kpis').innerHTML = `
    <div class="kpi" style="--c:#1f8a8a"><span class="kpi-lbl">Participantes</span><span class="kpi-num">${E.personas.length}</span><span class="kpi-sub">Avance promedio ${prom}%</span></div>
    <button type="button" class="kpi${porRevisar ? ' is-alerta' : ''}" style="--c:#e8920c" data-ir="entregas"><span class="kpi-lbl">Entregas por revisar</span><span class="kpi-num">${porRevisar}</span><span class="kpi-sub">${porRevisar ? 'Esperan su revisión' : 'Todo al día'}</span></button>
    <button type="button" class="kpi" style="--c:#2f80c9" data-ir="sesiones"><span class="kpi-lbl">Próximo bloque</span><span class="kpi-num ac-kpi-txt">${prox ? esc(fmtCorto(prox.fecha)) : 'Sin fecha'}</span><span class="kpi-sub">${prox ? esc(prox.titulo) : 'Programe los sábados'}</span></button>
    <button type="button" class="kpi" style="--c:#46a85b" data-ir="certificados"><span class="kpi-lbl">Certificados</span><span class="kpi-num">${emitidos}</span><span class="kpi-sub">${E.personas.filter((p) => !p.certificado && p.requisitos.elegible).length} listos para emitir</span></button>`
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-ir]'); if (b) irA(b.dataset.ir) })

const listaPersonas = crearLista({
  el: '#persona-list',
  buscador: '#persona-q',
  chipsEl: '#persona-chips',
  datos: () => E.personas,
  texto: (p) => [p.nombre, p.username, nombreModulo(p.area)].join(' '),
  chips: [
    { id: 'todas', lbl: 'Todas', f: () => true },
    { id: 'revisar', lbl: 'Con entregas por revisar', f: (p) => p.avance.porRevisar > 0, siHay: true },
    { id: 'listos', lbl: 'Listos para certificado', f: (p) => !p.certificado && p.requisitos.elegible, siHay: true },
    { id: 'certificados', lbl: 'Certificados', f: (p) => !!p.certificado, siHay: true },
  ],
  vacio: ['Nadie inscrito todavía', 'Use "Inscribir persona" para crear las cuentas del equipo.'],
  abrir: (id) => abrirInscripcion(E.personas.find((p) => String(p.id) === String(id))),
  columnas: [
    { k: 'nombre', lbl: 'Persona', html: (p) => `<span class="persona">${avatar(p.nombre)}<span><b>${esc(p.nombre)}</b><small>${esc(p.username)}${p.rol !== 'participante' ? ' · cuenta del panel' : ''}${p.activa ? '' : ' · inactiva'}</small></span></span>`, orden: (p) => p.nombre },
    { k: 'area', lbl: 'Área', html: (p) => `<span class="ac-area">${punto(p.area)}${esc(nombreModulo(p.area))}</span>`, orden: (p) => p.area },
    { k: 'avance', lbl: 'Lecciones', html: (p) => `<span class="ac-barra" style="--p:${p.avance.porcentaje}"><i></i></span><small class="muted">${p.avance.vistas}/${p.avance.lecciones}</small>`, orden: (p) => p.avance.porcentaje },
    { k: 'entregas', lbl: 'Entregas', cls: 'nw', html: (p) => `${p.avance.aprobadas}/${p.avance.ejercicios}${p.avance.porRevisar ? ` <span class="pill warn">${p.avance.porRevisar} por revisar</span>` : ''}`, orden: (p) => p.avance.aprobadas },
    { k: 'asistencia', lbl: 'Asistencia', cls: 'nw', html: (p) => `${p.avance.asistidas}/${p.avance.sesiones} · ${horas(p.avance.horas)}`, orden: (p) => p.avance.asistidas },
    { k: 'practicas', lbl: 'Prácticas IA', cls: 'nw', html: (p) => String(p.practicas), orden: (p) => p.practicas },
    { k: 'cert', lbl: 'Certificado', cls: 'nw', html: (p) => estadoCert(p) + (!p.certificado && p.requisitos.elegible ? ` <button type="button" class="link-btn" data-acc="emitir" data-id="${p.id}">Emitir</button>` : ''), orden: (p) => (p.certificado ? 2 : p.requisitos.elegible ? 1 : 0) },
  ],
  acciones: {
    emitir: (id, btn) => conBoton(btn, null, () => enviar('emitir_certificado', { usuario_id: Number(id) })),
  },
})

/* ---------- Inscripción ---------- */
const inscDrawer = $('#insc-drawer')
const inscForm = $('#insc-form')
let modoInsc = 'nueva'
let inscribiendo = null

function modo(m) {
  modoInsc = m
  $$('#insc-modo button').forEach((b) => b.classList.toggle('is-on', b.dataset.modo === m))
  $$('[data-solo]', inscForm).forEach((f) => { f.hidden = f.dataset.solo !== m })
}
$$('#insc-modo button').forEach((b) => b.addEventListener('click', () => modo(b.dataset.modo)))

function abrirInscripcion(p) {
  inscribiendo = p || null
  inscForm.reset()
  $('#insc-err').textContent = ''
  const inscritos = new Set(E.personas.map((x) => x.id))
  const libres = E.cuentas.filter((c) => c.activa && (!inscritos.has(c.id) || c.id === p?.id))
  inscForm.usuario_id.innerHTML = opciones(libres.map((c) => ({ id: c.id, etiqueta: `${c.nombre} (${c.username})` })), p?.id, 'Elija una cuenta')
  inscForm.area.innerHTML = opciones(E.areas, p?.area, 'Elija el área')
  $('#insc-titulo').textContent = p ? p.nombre : 'Inscribir persona'
  $('#insc-modo').hidden = !!p
  modo(p ? 'existente' : 'nueva')
  inscForm.usuario_id.disabled = !!p
  $('#insc-quitar').hidden = !p
  inscForm.querySelector('[type=submit] .t').textContent = p ? 'Guardar' : 'Inscribir'
  abrir(inscDrawer)
}
$('#nueva-inscripcion').addEventListener('click', () => abrirInscripcion(null))

inscForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const f = inscForm
  const datos = { area: f.area.value }
  if (modoInsc === 'nueva' && !inscribiendo) datos.crear = { name: f.name.value, username: f.username.value, password: f.password.value }
  else datos.usuario_id = Number(inscribiendo?.id || f.usuario_id.value)
  conBoton(f.querySelector('[type=submit]'), $('#insc-err'), async () => {
    await enviar('guardar_inscripcion', datos)
    cerrar(inscDrawer)
  })
})
$('#insc-quitar').addEventListener('click', (e) => confirmarClic(e.currentTarget, () => conBoton(null, $('#insc-err'), async () => {
  await enviar('quitar_inscripcion', { usuario_id: inscribiendo.id })
  cerrar(inscDrawer)
})))

/* ---------- Entregas ---------- */
const listaEntregas = crearLista({
  el: '#entrega-list',
  buscador: '#entrega-q',
  chipsEl: '#entrega-chips',
  datos: () => E.entregas,
  texto: (x) => [x.nombre, x.leccion, nombreModulo(x.modulo)].join(' '),
  chips: [
    { id: 'enviada', lbl: 'Por revisar', f: (x) => x.estado === 'enviada' },
    { id: 'devuelta', lbl: 'Devueltas', f: (x) => x.estado === 'devuelta' },
    { id: 'aprobada', lbl: 'Aprobadas', f: (x) => x.estado === 'aprobada' },
    { id: 'todas', lbl: 'Todas', f: () => true },
  ],
  vacio: ['Aún no hay entregas', 'Aparecen aquí cuando alguien envía el ejercicio de una lección.'],
  abrir: (id) => abrirEntrega(E.entregas.find((x) => String(x.id) === String(id))),
  columnas: [
    { k: 'persona', lbl: 'Persona', html: (x) => `<span class="persona">${avatar(x.nombre)}<b>${esc(x.nombre)}</b></span>`, orden: (x) => x.nombre },
    { k: 'leccion', lbl: 'Lección', html: (x) => `<span class="ac-area">${punto(x.modulo)}${esc(x.leccion)}</span>`, orden: (x) => x.leccion },
    { k: 'estado', lbl: 'Estado', cls: 'nw', html: (x) => pastilla(...(ESTADO_ENTREGA[x.estado] || ['borrador', x.estado])), orden: (x) => x.estado },
    { k: 'fecha', lbl: 'Enviada', cls: 'nw', html: (x) => esc(fmtDate(x.updated_at.slice(0, 10))), orden: (x) => x.updated_at },
  ],
})

const entDrawer = $('#entrega-drawer')
const entForm = $('#entrega-form')
function abrirEntrega(x) {
  if (!x) return
  entForm.reset()
  entForm.id.value = x.id
  entForm.comentario.value = x.comentario || ''
  $('#entrega-err').textContent = ''
  $('#entrega-kicker').textContent = nombreModulo(x.modulo)
  $('#entrega-titulo').textContent = x.nombre
  $('#entrega-sub').textContent = x.leccion
  const l = E.lecciones.find((y) => y.id === x.leccion_id)
  $('#entrega-cuerpo').innerHTML = `
    ${l?.ejercicio ? `<p class="ac-ej"><b>Ejercicio:</b> ${esc(l.ejercicio)}</p>` : ''}
    <div class="ac-entrega-txt">${x.texto ? esc(x.texto) : '<span class="muted">Sin texto</span>'}</div>
    ${x.enlace ? `<p><a href="${esc(x.enlace)}" target="_blank" rel="noopener noreferrer">Abrir el resultado ↗</a></p>` : ''}
    <p class="muted">Estado: ${esc(ESTADO_ENTREGA[x.estado]?.[1] || x.estado)}${x.revisado_por ? ` · Revisó ${esc(x.revisado_por)} el ${esc(fmtDate(x.revisado_at.slice(0, 10)))}` : ''}</p>`
  abrir(entDrawer)
}
$$('[data-revisar]', entForm).forEach((b) => b.addEventListener('click', () => conBoton(b, $('#entrega-err'), async () => {
  await enviar('revisar_entrega', { id: Number(entForm.id.value), estado: b.dataset.revisar, comentario: entForm.comentario.value })
  cerrar(entDrawer)
})))

/* ---------- Lecciones ---------- */
let filtroModulo = 'general'

function renderLecciones() {
  const chips = $('#leccion-chips')
  chips.innerHTML = C.modulos.map((m) => {
    const ls = E.lecciones.filter((l) => l.modulo === m.id)
    const pub = ls.filter((l) => l.publicada).length
    return `<button type="button" class="chip${m.id === filtroModulo ? ' is-on' : ''}" data-modulo="${m.id}">${punto(m.id)}${esc(m.etiqueta)} <b>${pub}/${ls.length}</b></button>`
  }).join('')
  const ls = E.lecciones.filter((l) => l.modulo === filtroModulo).sort((a, b) => a.orden - b.orden || a.id - b.id)
  const cont = $('#leccion-list')
  if (!ls.length) { cont.innerHTML = '<div class="vacio"><b>Sin lecciones en este módulo</b>Cree la primera con "Nueva lección".</div>'; return }
  cont.innerHTML = `<ol class="ac-lista-lec" style="--c:${color(filtroModulo)}">${ls.map((l, i) => `
    <li data-leccion="${l.id}">
      <span class="ac-orden">
        <button type="button" data-mover="-1" aria-label="Subir"${i === 0 ? ' disabled' : ''}>↑</button>
        <button type="button" data-mover="1" aria-label="Bajar"${i === ls.length - 1 ? ' disabled' : ''}>↓</button>
      </span>
      <span class="ac-lec-num">${String(i + 1).padStart(2, '0')}</span>
      <button type="button" class="ac-lec-info" data-editar>
        <b>${esc(l.titulo)}</b>
        <span class="ac-lec-tags">
          ${l.contenido ? '' : '<span class="pill warn">Sin contenido</span>'}
          ${l.practica_consigna ? '<span class="pill forest">Práctica IA</span>' : ''}
          ${l.ejercicio ? '<span class="pill deep">Entrega</span>' : ''}
          ${l.prompts.length ? `<span class="pill">${l.prompts.length} ${l.prompts.length === 1 ? 'instrucción' : 'instrucciones'}</span>` : ''}
          ${l.minutos ? `<span class="muted">${l.minutos} min</span>` : ''}
        </span>
      </button>
      <label class="switch ac-pub" title="${l.publicada ? 'Publicada' : 'Borrador'}">
        <input type="checkbox" data-publicar${l.publicada ? ' checked' : ''} />
        <span class="switch-ui" aria-hidden="true"></span>
        <span class="switch-txt"><b>${l.publicada ? 'Publicada' : 'Borrador'}</b></span>
      </label>
    </li>`).join('')}</ol>`
}
$('#leccion-chips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-modulo]')
  if (b) { filtroModulo = b.dataset.modulo; renderLecciones() }
})
$('#leccion-list').addEventListener('click', (e) => {
  const li = e.target.closest('[data-leccion]')
  if (!li) return
  const id = Number(li.dataset.leccion)
  const mov = e.target.closest('[data-mover]')
  if (mov) return conBoton(mov, null, () => enviar('mover_leccion', { id, dir: Number(mov.dataset.mover) }))
  if (e.target.closest('[data-editar]')) abrirLeccion(E.lecciones.find((l) => l.id === id))
})
$('#leccion-list').addEventListener('change', (e) => {
  const cb = e.target.closest('[data-publicar]')
  if (!cb) return
  const id = Number(cb.closest('[data-leccion]').dataset.leccion)
  conBoton(null, null, async () => {
    try { await enviar('publicar_leccion', { id, publicada: cb.checked }) } catch (err) { cb.checked = !cb.checked; throw err }
  })
})
const areaDePrevia = () => (filtroModulo === 'general' ? (E.areas[0]?.id || 'operaciones') : filtroModulo)
$('#previa-modulo').addEventListener('click', () => window.open(`/academia?area=${areaDePrevia()}`, '_blank'))

const lecDrawer = $('#leccion-drawer')
const lecForm = $('#leccion-form')
let editando = null

const filaPrompt = (p = {}) => `<div class="ac-fila"><input placeholder="Título (ej.: Obligaciones de un auto)" data-k="titulo" value="${esc(p.titulo || '')}" /><textarea rows="4" placeholder="La instrucción, tal cual para copiar" data-k="texto" class="ac-mono">${esc(p.texto || '')}</textarea><button type="button" class="ac-quitar" aria-label="Quitar">×</button></div>`
const filaRecurso = (r = {}) => `<div class="ac-fila ac-fila-linea"><input placeholder="Título" data-k="titulo" value="${esc(r.titulo || '')}" /><input placeholder="https://… (opcional)" data-k="href" type="url" value="${esc(r.href || '')}" /><button type="button" class="ac-quitar" aria-label="Quitar">×</button></div>`
const leerFilas = (cont) => $$('.ac-fila', cont).map((f) => Object.fromEntries($$('[data-k]', f).map((i) => [i.dataset.k, i.value])))
$('#prompt-mas').addEventListener('click', () => $('#leccion-prompts').insertAdjacentHTML('beforeend', filaPrompt()))
$('#recurso-mas').addEventListener('click', () => $('#leccion-recursos').insertAdjacentHTML('beforeend', filaRecurso()))
lecForm.addEventListener('click', (e) => { const q = e.target.closest('.ac-quitar'); if (q) q.closest('.ac-fila').remove() })

function abrirLeccion(l) {
  editando = l || null
  lecForm.reset()
  $('#leccion-err').textContent = ''
  lecForm.id.value = l?.id || ''
  lecForm.modulo.innerHTML = opciones(C.modulos, l?.modulo || filtroModulo)
  for (const k of ['titulo', 'resumen', 'contenido', 'practica_consigna', 'ejercicio', 'entregable']) lecForm[k].value = l?.[k] || ''
  lecForm.minutos.value = l?.minutos || ''
  lecForm.publicada.checked = !!l?.publicada
  $('#leccion-prompts').innerHTML = (l?.prompts || []).map(filaPrompt).join('')
  $('#leccion-recursos').innerHTML = (l?.recursos || []).map(filaRecurso).join('')
  $('#leccion-titulo').textContent = l ? l.titulo : 'Nueva lección'
  $('#leccion-borrar').hidden = !l
  const previa = $('#leccion-previa')
  previa.hidden = !l
  if (l) previa.href = `/academia/leccion/${l.id}?area=${l.modulo === 'general' ? (E.areas[0]?.id || 'operaciones') : l.modulo}`
  abrir(lecDrawer)
}
$('#nueva-leccion').addEventListener('click', () => abrirLeccion(null))

lecForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const f = lecForm
  const datos = {
    id: f.id.value ? Number(f.id.value) : undefined,
    modulo: f.modulo.value,
    titulo: f.titulo.value,
    resumen: f.resumen.value,
    contenido: f.contenido.value,
    minutos: Number(f.minutos.value) || 0,
    practica_consigna: f.practica_consigna.value,
    ejercicio: f.ejercicio.value,
    entregable: f.entregable.value,
    publicada: f.publicada.checked,
    prompts: leerFilas($('#leccion-prompts')),
    recursos: leerFilas($('#leccion-recursos')),
  }
  conBoton(f.querySelector('[type=submit]'), $('#leccion-err'), async () => {
    await enviar('guardar_leccion', datos)
    filtroModulo = datos.modulo
    renderLecciones()
    cerrar(lecDrawer)
  })
})
$('#leccion-borrar').addEventListener('click', (e) => confirmarClic(e.currentTarget, () => conBoton(null, $('#leccion-err'), async () => {
  await enviar('eliminar_leccion', { id: editando.id })
  cerrar(lecDrawer)
})))

/* ---------- Sábados ---------- */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const fechaLarga = (iso) => { const [a, m, d] = iso.split('-').map(Number); const f = new Date(Date.UTC(a, m - 1, d)); return `${DIAS[f.getUTCDay()]} ${d} de ${MESES[m - 1]}${String(a) === E.hoy.slice(0, 4) ? '' : ` de ${a}`}` }
const rutaIncluye = (p, modulos) => modulos.includes('general') || modulos.includes(p.area)

function renderSesiones() {
  const cont = $('#sesion-list')
  if (!E.sesiones.length) { cont.innerHTML = '<div class="vacio"><b>Aún no hay sábados programados</b>Cree un bloque por cada tramo del sábado, con su fecha, sus horas y los módulos que asisten.</div>'; return }
  const porFecha = new Map()
  for (const s of E.sesiones) porFecha.set(s.fecha, [...(porFecha.get(s.fecha) || []), s])
  cont.innerHTML = [...porFecha.entries()].map(([fecha, ss]) => {
    const total = ss.reduce((t, s) => t + s.horas, 0)
    return `<article class="dash-card ac-dia${fecha < E.hoy ? ' is-pasado' : ''}">
      <header class="dash-head"><div><h3>${esc(fechaLarga(fecha))}</h3><p>${ss.length} ${ss.length === 1 ? 'bloque' : 'bloques'} · ${horas(total)}${fecha < E.hoy ? ' · ya pasó' : ''}</p></div></header>
      <ul class="ac-bloques">${ss.map((s) => {
        const esperados = E.personas.filter((p) => rutaIncluye(p, s.modulos))
        return `<li><button type="button" data-sesion="${s.id}">
          <span class="ac-hora">${esc(s.hora || '·')}</span>
          <span class="ac-b-txt"><b>${esc(s.titulo)}</b><span>${s.modulos.map((m) => `<span class="ac-area">${punto(m)}${esc(nombreModulo(m))}</span>`).join('')}</span></span>
          <span class="ac-b-meta">${horas(s.horas)}<small>${s.asistentes.length}/${esperados.length} asistieron</small></span>
        </button></li>`
      }).join('')}</ul>
    </article>`
  }).join('')
}
$('#sesion-list').addEventListener('click', (e) => {
  const b = e.target.closest('[data-sesion]')
  if (b) abrirSesion(E.sesiones.find((s) => s.id === Number(b.dataset.sesion)))
})

const sesDrawer = $('#sesion-drawer')
const sesForm = $('#sesion-form')
const asisForm = $('#asis-form')
let sesion = null

function abrirSesion(s) {
  sesion = s || null
  sesForm.reset()
  $('#sesion-err').textContent = ''
  $('#asis-err').textContent = ''
  sesForm.id.value = s?.id || ''
  for (const k of ['titulo', 'fecha', 'hora', 'lugar', 'notas']) sesForm[k].value = s?.[k] || ''
  sesForm.horas.value = s?.horas || ''
  const mods = s?.modulos || []
  $('#sesion-modulos').innerHTML = `<p class="ac-mini">Módulos que asisten</p>` + C.modulos.map((m) => `<label class="ac-check"><input type="checkbox" value="${m.id}"${mods.includes(m.id) ? ' checked' : ''} />${punto(m.id)}${esc(m.etiqueta)}</label>`).join('')
  $('#sesion-titulo').textContent = s ? s.titulo : 'Nuevo bloque'
  $('#sesion-borrar').hidden = !s
  asisForm.hidden = !s
  if (s) pintarAsistencia(s)
  abrir(sesDrawer)
}
function pintarAsistencia(s) {
  const esperados = E.personas.filter((p) => rutaIncluye(p, s.modulos))
  const otros = E.personas.filter((p) => !rutaIncluye(p, s.modulos) && s.asistentes.includes(p.id))
  const lista = [...esperados, ...otros]
  $('#asis-nota').textContent = lista.length ? 'Marque quién asistió. Cuenta para las horas y para el certificado.' : 'Nadie inscrito tiene este bloque en su ruta.'
  $('#asis-lista').innerHTML = lista.map((p) => `<label class="ac-check"><input type="checkbox" value="${p.id}"${s.asistentes.includes(p.id) ? ' checked' : ''} />${avatar(p.nombre, 'sm')}<span>${esc(p.nombre)}<small>${esc(nombreModulo(p.area))}</small></span></label>`).join('')
}
$('#nueva-sesion').addEventListener('click', () => abrirSesion(null))
sesForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const f = sesForm
  const datos = {
    id: f.id.value ? Number(f.id.value) : undefined,
    titulo: f.titulo.value, fecha: f.fecha.value, hora: f.hora.value, horas: Number(f.horas.value), lugar: f.lugar.value, notas: f.notas.value,
    modulos: $$('#sesion-modulos input:checked').map((i) => i.value),
  }
  conBoton(f.querySelector('[type=submit]'), $('#sesion-err'), async () => {
    const r = await enviar('guardar_sesion', datos)
    // Al crear, se queda abierto para marcar la asistencia.
    const s = E.sesiones.find((x) => x.id === Number(r.resultado))
    if (s) abrirSesion(s)
  })
})
$('#sesion-borrar').addEventListener('click', (e) => confirmarClic(e.currentTarget, () => conBoton(null, $('#sesion-err'), async () => {
  await enviar('eliminar_sesion', { id: sesion.id })
  cerrar(sesDrawer)
})))
$('#asis-todos').addEventListener('click', () => $$('#asis-lista input').forEach((i) => { i.checked = true }))
asisForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const ids = $$('#asis-lista input:checked').map((i) => Number(i.value))
  conBoton(asisForm.querySelector('[type=submit]'), $('#asis-err'), async () => {
    await enviar('guardar_asistencia', { sesion_id: sesion.id, usuario_ids: ids })
    cerrar(sesDrawer)
  })
})

/* ---------- Certificados ---------- */
const listaCert = crearLista({
  el: '#cert-list',
  datos: () => E.certificados,
  texto: (c) => [c.nombre, c.codigo].join(' '),
  vacio: ['Aún no hay certificados', 'Se emiten cuando alguien cumple los requisitos y abre su certificado, o cuando usted pulsa "Emitir" en Participantes.'],
  columnas: [
    { k: 'nombre', lbl: 'Persona', html: (c) => `<b>${esc(c.nombre)}</b>`, orden: (c) => c.nombre },
    { k: 'area', lbl: 'Área', html: (c) => `<span class="ac-area">${punto(c.area)}${esc(nombreModulo(c.area))}</span>`, orden: (c) => c.area },
    { k: 'horas', lbl: 'Horas', cls: 'nw', html: (c) => horas(c.horas), orden: (c) => c.horas },
    { k: 'fecha', lbl: 'Emitido', cls: 'nw', html: (c) => esc(fmtDate(c.emitido_at.slice(0, 10))), orden: (c) => c.emitido_at },
    { k: 'codigo', lbl: 'Código', cls: 'nw', html: (c) => `<a class="mono" href="/verificar/${esc(c.codigo)}" target="_blank">${esc(c.codigo)}</a>`, orden: (c) => c.codigo },
    { k: 'estado', lbl: 'Estado', cls: 'nw', html: (c) => (c.revocado_at ? pastilla('cancelada', 'Revocado') : pastilla('activa', 'Válido') + ` <button type="button" class="link-btn danger-link" data-acc="revocar" data-id="${esc(c.codigo)}">Revocar</button>`), orden: (c) => (c.revocado_at ? 1 : 0) },
  ],
  acciones: {
    revocar: (codigo, btn) => confirmarClic(btn, () => conBoton(btn, null, () => enviar('revocar_certificado', { codigo }))),
  },
})

/* ---------- Todo ---------- */
function renderTodo() {
  renderKpis()
  listaPersonas.pintar()
  listaEntregas.pintar()
  renderLecciones()
  renderSesiones()
  listaCert.pintar()
  const porRevisar = E.entregas.filter((e) => e.estado === 'enviada').length
  const cp = $('[data-cuenta="personas"]'); if (cp) cp.textContent = E.personas.length
  const ce = $('[data-cuenta="entregas"]'); if (ce) ce.textContent = porRevisar
}
renderTodo()
const tab = new URLSearchParams(location.search).get('tab')
if (tab) irA(tab)
