// Talento humano: pinta el tablero, el equipo, las novedades, la capacitación,
// el desempeño y los cargos, y envía los cambios a /api/admin/talento. Cada
// escritura devuelve el estado completo ya recalculado (saldos y avisos), así
// que aquí no se recalcula nada que importe: solo se pinta.
import { $, $$, esc, svg, fmtDate, fmtCorto, avatar, estado as pastilla, crearLista } from './comun.js'

const T = window.__TALENTO__ || {}
const C = T.catalogos
const FESTIVOS = new Set(T.festivos || [])
const API = '/api/admin/talento'
let E = T.estado || { hoy: new Date().toISOString().slice(0, 10), ajustes: { sabadoHabil: false, evaluacionMeses: 12 }, personas: [], cargos: [], documentos: [], novedades: [], cursos: [], formaciones: [], evaluaciones: [], saldos: {}, avisos: [] }

/* ---------- Utilidades ---------- */
const et = (lista, id) => (Array.isArray(lista) ? lista.find((o) => o.id === id)?.etiqueta : lista[id]) || id || ''
const opciones = (lista, actual, vacio) =>
  (vacio !== undefined ? `<option value="">${esc(vacio)}</option>` : '') +
  lista.map((o) => `<option value="${esc(o.id)}"${String(o.id) === String(actual ?? '') ? ' selected' : ''}>${esc(o.etiqueta ?? o.nombre)}</option>`).join('')
const persona = (id) => E.personas.find((p) => p.usuario_id === Number(id))
const nombreDe = (id) => persona(id)?.nombre || 'Persona sin cuenta'
const cargoDe = (id) => E.cargos.find((c) => c.id === Number(id))
const num = (n) => (Number(n) || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })
const dia = 864e5
const utc = (iso) => { const [a, m, d] = iso.split('-').map(Number); return Date.UTC(a, m - 1, d) }
const diasEntre = (a, b) => Math.round((utc(b) - utc(a)) / dia)
const masDias = (iso, n) => new Date(utc(iso) + n * dia).toISOString().slice(0, 10)
const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '')

const activo = (p) => !!p?.ficha && (!p.ficha.fecha_retiro || p.ficha.fecha_retiro >= E.hoy)
const situacion = (p) => (!p.ficha ? 'sin_ficha' : activo(p) ? 'activo' : 'retirado')
const SITUACION = { activo: ['activa', 'Activa'], sin_ficha: ['borrador', 'Sin ficha'], retirado: ['inactiva', 'Retirada'] }
const NOVEDAD_PUNTO = { solicitada: 'solicitada', aprobada: 'activa', rechazada: 'cancelada', cancelada: 'cerrada' }
const rango = (a, b) => (a === b ? fmtCorto(a) : `${fmtCorto(a)} al ${fmtCorto(b)}`)

function antiguedad(desde) {
  if (!esFecha(desde) || desde > E.hoy) return ''
  const [a1, m1, d1] = desde.split('-').map(Number)
  const [a2, m2, d2] = E.hoy.split('-').map(Number)
  let meses = (a2 - a1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0)
  const anios = Math.floor(meses / 12)
  meses %= 12
  if (!anios && !meses) return 'Menos de un mes'
  return [anios && `${anios} ${anios === 1 ? 'año' : 'años'}`, meses && `${meses} ${meses === 1 ? 'mes' : 'meses'}`].filter(Boolean).join(' y ')
}

/** Los mismos días hábiles que calcula el servidor, para mostrarlos mientras se escribe. */
function contarDias(desde, hasta) {
  if (!esFecha(desde) || !esFecha(hasta) || hasta < desde) return { habiles: 0, calendario: 0 }
  let habiles = 0, calendario = 0
  for (let t = utc(desde); t <= utc(hasta); t += dia) {
    calendario++
    const d = new Date(t)
    const sem = d.getUTCDay()
    if (sem === 0 || (sem === 6 && !E.ajustes.sabadoHabil)) continue
    if (FESTIVOS.has(d.toISOString().slice(0, 10))) continue
    habiles++
  }
  return { habiles, calendario }
}

function chipFecha(dias) {
  if (dias === null || dias === undefined) return ''
  if (dias < 0) return `<span class="plazo-chip vencido">Venció hace ${-dias} ${-dias === 1 ? 'día' : 'días'}</span>`
  if (dias === 0) return '<span class="plazo-chip vencido">Vence hoy</span>'
  if (dias === 1) return '<span class="plazo-chip urgente">Vence mañana</span>'
  return `<span class="plazo-chip ${dias <= 15 ? 'urgente' : ''}">En ${dias} días</span>`
}
const chipVence = (iso) => (esFecha(iso) ? chipFecha(diasEntre(E.hoy, iso)) : '')

function avisoError(e) {
  // Sin diálogos del navegador: el error se muestra arriba del contenido.
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

/** Envía un formulario con el botón ocupado y el error en su sitio. */
async function conBoton(btn, errEl, fn) {
  if (errEl) errEl.textContent = ''
  if (btn) btn.disabled = true
  try { return await fn() } catch (e) { if (errEl) errEl.textContent = e.message; else avisoError(e); return null } finally { if (btn) btn.disabled = false }
}

/* ---------- Pestañas y paneles laterales ---------- */
const irA = (tab) => {
  const t = $(`.subtab[data-tab="${tab}"]`)
  if (!t) return
  $$('.subtabs:not(.th-pestanas) .subtab').forEach((x) => x.classList.toggle('is-active', x === t))
  $$('.panel').forEach((x) => x.classList.toggle('is-active', x.id === 'panel-' + tab))
}
$$('.subtab[data-tab]').forEach((t) => t.addEventListener('click', () => irA(t.dataset.tab)))
document.addEventListener('click', (e) => { const b = e.target.closest('[data-ir-sub]'); if (b) irA(b.dataset.irSub) })

const abrir = (d) => { d.hidden = false }
const cerrar = (d) => { d.hidden = true; if (d.id === 'persona-drawer') personaAbierta = null }
$$('.drawer').forEach((d) => $$('[data-close]', d).forEach((x) => x.addEventListener('click', () => cerrar(d))))
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return
  const abiertos = $$('.drawer').filter((d) => !d.hidden)
  if (abiertos.length) cerrar(abiertos[abiertos.length - 1])
})

/* ---------- Tablero ---------- */
let filtroAviso = 'todos'
const PARA_PESTANA = { documento: 'documentos', formacion: 'formacion', contrato: 'ficha', prueba: 'ficha', vacaciones: 'novedades', evaluacion: 'desempeno' }

function renderTablero() {
  const activos = E.personas.filter(activo)
  const sinFicha = E.personas.filter((p) => !p.ficha && p.cuentaActiva).length
  const vencidos = E.avisos.filter((a) => a.nivel === 'vencido').length
  const pronto = E.avisos.filter((a) => a.nivel === 'urgente' || a.nivel === 'pronto').length
  const hoy = E.novedades.filter((n) => n.estado === 'aprobada' && n.desde <= E.hoy && n.hasta >= E.hoy)
  $('#th-kpis').innerHTML = `
    <button type="button" class="kpi" style="--c:#1f8a8a" data-kpi="equipo"><span class="kpi-lbl">Personas activas</span><span class="kpi-num">${activos.length}</span><span class="kpi-sub">${sinFicha ? `${sinFicha} ${sinFicha === 1 ? 'cuenta' : 'cuentas'} sin ficha` : 'Todas con ficha'}</span></button>
    <button type="button" class="kpi${vencidos ? ' is-alerta' : ''}" style="--c:#d8453a" data-kpi="vencido"><span class="kpi-lbl">Vencidos</span><span class="kpi-num">${vencidos}</span><span class="kpi-sub">Documentos, cursos o trámites</span></button>
    <button type="button" class="kpi${pronto ? ' is-alerta' : ''}" style="--c:#e8920c" data-kpi="pronto"><span class="kpi-lbl">Vencen en 30 días</span><span class="kpi-num">${pronto}</span><span class="kpi-sub">Hay tiempo de renovar</span></button>
    <button type="button" class="kpi" style="--c:#2f80c9" data-kpi="novedades"><span class="kpi-lbl">Ausentes hoy</span><span class="kpi-num">${hoy.length}</span><span class="kpi-sub">Vacaciones, permisos e incapacidades</span></button>`

  const chips = [['todos', 'Todos', () => true], ['vencido', 'Vencidos', (a) => a.nivel === 'vencido'], ['pronto', '30 días o menos', (a) => a.nivel === 'urgente' || a.nivel === 'pronto'], ['proximo', '90 días o menos', (a) => a.nivel === 'proximo']]
  $('#aviso-chips').innerHTML = chips.map(([id, lbl, f]) => `<button type="button" class="chip${filtroAviso === id ? ' is-on' : ''}" data-chip="${id}">${lbl} <b>${E.avisos.filter(f).length}</b></button>`).join('')
  const lista = E.avisos.filter(chips.find((c) => c[0] === filtroAviso)[2])
  $('#th-avisos').innerHTML = lista.length
    ? `<ul class="th-avisos">${lista.map((a) => `
        <li><button type="button" data-aviso="${esc(a.clave)}">
          ${avatar(nombreDe(a.usuario_id), 'sm')}
          <span class="th-aviso-txt"><b>${esc(a.titulo)}</b><small>${esc(nombreDe(a.usuario_id))} · ${esc(a.detalle)}</small></span>
          ${a.fecha ? chipFecha(a.dias) : '<span class="plazo-chip">Revisar</span>'}
        </button></li>`).join('')}</ul>`
    : `<div class="vacio"><b>${E.avisos.length ? 'Nada en este filtro' : 'Nada por vencer'}</b>${E.avisos.length ? 'Pruebe con otro.' : 'Cuando un documento, curso o contrato se acerque a su fecha, aparece aquí.'}</div>`

  const hasta = masDias(E.hoy, 14)
  const ausencias = E.novedades.filter((n) => n.estado === 'aprobada' && n.desde <= hasta && n.hasta >= E.hoy).sort((a, b) => a.desde.localeCompare(b.desde))
  $('#th-ausencias').innerHTML = ausencias.length
    ? `<ul class="th-mini">${ausencias.map((n) => `
        <li><button type="button" data-novedad="${n.id}">${avatar(nombreDe(n.usuario_id), 'sm')}
          <span class="th-aviso-txt"><b>${esc(nombreDe(n.usuario_id))}</b><small>${esc(et(C.novedades, n.tipo))} · ${rango(n.desde, n.hasta)}</small></span>
          ${n.desde <= E.hoy ? '<span class="th-hoy">Hoy</span>' : ''}</button></li>`).join('')}</ul>`
    : '<p class="muted th-vacio-mini">Nadie ausente en estas dos semanas.</p>'

  const pendientes = E.novedades.filter((n) => n.estado === 'solicitada').sort((a, b) => a.desde.localeCompare(b.desde))
  $('#th-pendientes').innerHTML = pendientes.length
    ? `<ul class="th-mini">${pendientes.map((n) => `
        <li class="th-pend">${avatar(nombreDe(n.usuario_id), 'sm')}
          <span class="th-aviso-txt"><b>${esc(nombreDe(n.usuario_id))}</b><small>${esc(et(C.novedades, n.tipo))} · ${rango(n.desde, n.hasta)} · ${num(n.dias_habiles)} días hábiles</small></span>
          <span class="acciones"><button type="button" class="btn-mini is-main" data-decidir="aprobada" data-id="${n.id}">Aprobar</button><button type="button" class="btn-mini danger" data-decidir="rechazada" data-id="${n.id}">Rechazar</button></span></li>`).join('')}</ul>`
    : '<p class="muted th-vacio-mini">No hay solicitudes esperando.</p>'

  const mes = E.hoy.slice(5, 7)
  const cumple = activos.filter((p) => esFecha(p.ficha.fecha_nacimiento) && p.ficha.fecha_nacimiento.slice(5, 7) === mes)
    .sort((a, b) => a.ficha.fecha_nacimiento.slice(8).localeCompare(b.ficha.fecha_nacimiento.slice(8)))
  $('#th-cumple').innerHTML = cumple.length
    ? `<ul class="th-mini">${cumple.map((p) => {
        const d = Number(p.ficha.fecha_nacimiento.slice(8))
        const esHoy = p.ficha.fecha_nacimiento.slice(5) === E.hoy.slice(5)
        return `<li><button type="button" data-persona="${p.usuario_id}">${avatar(p.nombre, 'sm')}<span class="th-aviso-txt"><b>${esc(p.nombre)}</b><small>${d} de ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][Number(mes) - 1]}</small></span>${esHoy ? '<span class="th-hoy">Hoy</span>' : ''}</button></li>`
      }).join('')}</ul>`
    : '<p class="muted th-vacio-mini">Nadie cumple años este mes, o faltan fechas de nacimiento en las fichas.</p>'
}

$('#aviso-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-chip]'); if (b) { filtroAviso = b.dataset.chip; renderTablero() } })
$('#th-kpis').addEventListener('click', (e) => {
  const k = e.target.closest('[data-kpi]')?.dataset.kpi
  if (!k) return
  if (k === 'equipo') { irA('equipo'); listaEquipo.chip('activos') }
  else if (k === 'novedades') { irA('novedades'); listaNovedades.chip('en_curso') }
  else { filtroAviso = k; renderTablero(); $('#th-avisos').scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }
})
$('#panel-tablero').addEventListener('click', async (e) => {
  const av = e.target.closest('[data-aviso]')
  if (av) {
    const a = E.avisos.find((x) => x.clave === av.dataset.aviso)
    if (a?.tipo === 'evaluacion') return abrirEval(null, a.usuario_id)
    if (a) abrirPersona(a.usuario_id, PARA_PESTANA[a.tipo])
    return
  }
  const per = e.target.closest('[data-persona]')
  if (per) return abrirPersona(Number(per.dataset.persona))
  const nov = e.target.closest('[data-novedad]')
  if (nov) return abrirNovedad(E.novedades.find((n) => n.id === Number(nov.dataset.novedad)))
  const dec = e.target.closest('[data-decidir]')
  if (dec) await conBoton(dec, null, () => enviar('decidir_novedad', { id: Number(dec.dataset.id), estado: dec.dataset.decidir }))
})

/* ---------- Equipo ---------- */
const avisosDe = (id) => E.avisos.filter((a) => a.usuario_id === id)
const listaEquipo = crearLista({
  el: '#equipo-list', buscador: '#equipo-q', chipsEl: '#equipo-chips',
  datos: () => E.personas,
  texto: (p) => [p.nombre, p.username, cargoDe(p.ficha?.cargo_id)?.nombre, et(C.areas, p.ficha?.area), p.ficha?.jefe].join(' '),
  vacio: ['Todavía no hay cuentas', 'Cree los usuarios del equipo en la sección Usuarios.'],
  chips: [
    { id: 'activos', lbl: 'Activas', f: activo },
    { id: 'sin_ficha', lbl: 'Sin ficha', f: (p) => !p.ficha && p.cuentaActiva, siHay: true },
    { id: 'retirados', lbl: 'Retiradas', f: (p) => situacion(p) === 'retirado', siHay: true },
    { id: 'todos', lbl: 'Todas', f: () => true },
  ],
  columnas: [
    { k: 'nombre', lbl: 'Persona', orden: (p) => p.nombre.toLowerCase(),
      html: (p) => `<div class="persona">${avatar(p.nombre, 'sm')}<div><div class="t1">${esc(p.nombre)}</div><div class="t2">${esc(cargoDe(p.ficha?.cargo_id)?.nombre || (p.ficha ? 'Sin cargo' : p.username))}</div></div></div>` },
    { k: 'area', lbl: 'Área', orden: (p) => et(C.areas, p.ficha?.area || 'zzz'), html: (p) => (p.ficha?.area ? esc(et(C.areas, p.ficha.area)) : '<span class="muted">Sin área</span>') },
    { k: 'contrato', lbl: 'Contrato', orden: (p) => p.ficha?.fecha_ingreso || '9999',
      html: (p) => (p.ficha?.tipo_contrato ? `<div class="nw">${esc(et(C.contratos, p.ficha.tipo_contrato))}</div>` : '<span class="muted">Sin definir</span>') + (p.ficha?.fecha_ingreso ? `<div class="t2">${esc(antiguedad(p.ficha.fecha_ingreso) || `Ingresa el ${fmtDate(p.ficha.fecha_ingreso)}`)}</div>` : '') },
    { k: 'vac', lbl: 'Vacaciones', cls: 'num', orden: (p) => -(E.saldos[p.usuario_id]?.saldo ?? -999),
      html: (p) => { const s = E.saldos[p.usuario_id]; return !s || !s.aplica ? '<span class="muted">No aplica</span>' : s.sinIngreso ? '<span class="muted">Falta ingreso</span>' : `<b class="${s.saldo >= 30 ? 'th-alto' : ''}">${num(s.saldo)}</b> <span class="t2">días</span>` } },
    { k: 'avisos', lbl: 'Avisos', cls: 'num', orden: (p) => -avisosDe(p.usuario_id).length,
      html: (p) => { const a = avisosDe(p.usuario_id); return a.length ? `<b class="cuenta-alertas" title="${esc(a.map((x) => x.titulo).join(', '))}">${a.length}</b>` : '<span class="muted">0</span>' } },
    { k: 'estado', lbl: 'Estado', orden: (p) => situacion(p), html: (p) => pastilla(...SITUACION[situacion(p)]) },
  ],
  abrir: (id) => abrirPersona(Number(id)),
})

/* ---------- Novedades ---------- */
const listaNovedades = crearLista({
  el: '#novedad-list', buscador: '#novedad-q', chipsEl: '#novedad-chips',
  datos: () => E.novedades,
  texto: (n) => [nombreDe(n.usuario_id), et(C.novedades, n.tipo), n.motivo, et(C.estadosNovedad, n.estado)].join(' '),
  vacio: ['Sin novedades todavía', 'Registre vacaciones, permisos, licencias o incapacidades con el botón de arriba.'],
  chips: [
    { id: 'por_aprobar', lbl: 'Por aprobar', f: (n) => n.estado === 'solicitada' },
    { id: 'en_curso', lbl: 'En curso hoy', f: (n) => n.estado === 'aprobada' && n.desde <= E.hoy && n.hasta >= E.hoy },
    { id: 'proximas', lbl: 'Próximas', f: (n) => n.estado === 'aprobada' && n.desde > E.hoy },
    { id: 'historial', lbl: 'Historial', f: (n) => (n.estado === 'aprobada' && n.hasta < E.hoy) || n.estado === 'rechazada' || n.estado === 'cancelada' },
    { id: 'todas', lbl: 'Todas', f: () => true },
  ],
  columnas: [
    { k: 'p', lbl: 'Persona', orden: (n) => nombreDe(n.usuario_id).toLowerCase(), html: (n) => `<div class="persona">${avatar(nombreDe(n.usuario_id), 'sm')}<div class="t1">${esc(nombreDe(n.usuario_id))}</div></div>` },
    { k: 'tipo', lbl: 'Tipo', orden: (n) => n.tipo, html: (n) => `<div class="nw">${esc(et(C.novedades, n.tipo))}</div>${n.motivo ? `<div class="t2 clip">${esc(n.motivo)}</div>` : ''}` },
    { k: 'fechas', lbl: 'Fechas', cls: 'nw', orden: (n) => n.desde, html: (n) => esc(rango(n.desde, n.hasta)) },
    { k: 'dias', lbl: 'Días', cls: 'num', orden: (n) => n.dias_habiles, html: (n) => `${num(n.dias_habiles)} <span class="t2">háb.</span><div class="t2">${n.dias_calendario} calendario</div>` },
    { k: 'estado', lbl: 'Estado', orden: (n) => n.estado, html: (n) => pastilla(NOVEDAD_PUNTO[n.estado] || n.estado, et(C.estadosNovedad, n.estado)) + (n.decidido_por ? `<div class="t2">${esc(n.decidido_por)}</div>` : '') },
    { k: 'acc', lbl: '', cls: 'der', html: (n) => `<span class="acciones">${n.estado === 'solicitada' ? `<button type="button" class="btn-mini is-main" data-acc="aprobar" data-id="${n.id}">Aprobar</button><button type="button" class="btn-mini danger" data-acc="rechazar" data-id="${n.id}">Rechazar</button>` : ''}<button type="button" class="btn-ico" data-acc="editar" data-id="${n.id}" title="Editar" aria-label="Editar">${svg('editar')}</button></span>` },
  ],
  abrir: (id) => abrirNovedad(E.novedades.find((n) => n.id === Number(id))),
  acciones: {
    editar: (id) => abrirNovedad(E.novedades.find((n) => n.id === Number(id))),
    aprobar: (id, b) => conBoton(b, null, () => enviar('decidir_novedad', { id: Number(id), estado: 'aprobada' })),
    rechazar: (id, b) => conBoton(b, null, () => enviar('decidir_novedad', { id: Number(id), estado: 'rechazada' })),
  },
})

const novDrawer = $('#novedad-drawer')
const novForm = $('#novedad-form')
let novEditando = null
function abrirNovedad(n, usuario_id) {
  novEditando = n || null
  novForm.reset()
  $('#novedad-err').textContent = ''
  $('#novedad-titulo').textContent = n ? 'Editar novedad' : 'Registrar novedad'
  const candidatos = E.personas.filter((p) => activo(p) || p.usuario_id === n?.usuario_id || p.usuario_id === usuario_id)
  novForm.elements.usuario_id.innerHTML = opciones(candidatos.map((p) => ({ id: p.usuario_id, etiqueta: p.nombre + (p.ficha ? '' : ' (sin ficha)') })), n?.usuario_id ?? usuario_id, 'Elija la persona')
  novForm.elements.tipo.innerHTML = opciones(C.novedades, n?.tipo ?? 'vacaciones')
  novForm.elements.estado.innerHTML = opciones(C.estadosNovedad, n?.estado ?? 'aprobada')
  for (const k of ['id', 'desde', 'hasta', 'motivo', 'enlace']) novForm.elements[k].value = n ? (n[k] ?? '') : ''
  $('#novedad-borrar').hidden = !n
  calcularNovedad()
  abrir(novDrawer)
}
function calcularNovedad() {
  const f = novForm.elements
  const { habiles, calendario } = contarDias(f.desde.value, f.hasta.value)
  const el = $('#novedad-calculo')
  if (!calendario) { el.innerHTML = f.desde.value && f.hasta.value ? '<p class="th-mal">La fecha de fin es anterior a la de inicio.</p>' : '<p class="muted">Elija las fechas para ver los días.</p>'; return }
  let extra = ''
  const s = E.saldos[Number(f.usuario_id.value)]
  if (f.tipo.value === 'vacaciones' && s?.aplica && !s.sinIngreso) {
    // Si se está editando unas vacaciones que ya descontaban, se devuelven al saldo antes de comparar.
    const yaDescontaba = novEditando && novEditando.tipo === 'vacaciones' && novEditando.estado === 'aprobada' && novEditando.usuario_id === Number(f.usuario_id.value) ? novEditando.dias_habiles : 0
    const queda = s.saldo + yaDescontaba - habiles
    extra = `<span>Saldo disponible: <b>${num(s.saldo + yaDescontaba)}</b> días · después: <b class="${queda < 0 ? 'th-mal' : ''}">${num(queda)}</b></span>${queda < 0 ? '<small class="th-mal">Quedaría en negativo: sería un anticipo de vacaciones. Si es así, déjelo constar en el motivo.</small>' : ''}`
  } else if (f.tipo.value === 'vacaciones' && s && !s.aplica) {
    extra = '<small class="th-mal">El tipo de contrato de esta persona no causa vacaciones.</small>'
  }
  el.innerHTML = `<div class="th-dias"><b>${habiles}</b> ${habiles === 1 ? 'día hábil' : 'días hábiles'} <span class="muted">· ${calendario} calendario${E.ajustes.sabadoHabil ? '' : ' · sin sábados'}</span></div>${extra}`
}
novForm.addEventListener('input', calcularNovedad)
novForm.addEventListener('change', (e) => {
  // Al elegir "desde" sin "hasta", se propone el mismo día.
  if (e.target.name === 'desde' && !novForm.elements.hasta.value) novForm.elements.hasta.value = e.target.value
  calcularNovedad()
})
novForm.addEventListener('submit', (ev) => {
  ev.preventDefault()
  const datos = Object.fromEntries(new FormData(novForm))
  conBoton(novForm.querySelector('[type=submit]'), $('#novedad-err'), async () => { await enviar('guardar_novedad', datos); cerrar(novDrawer) })
})
$('#novedad-borrar').addEventListener('click', (e) => confirmarClic(e.currentTarget, () => conBoton(e.currentTarget, $('#novedad-err'), async () => { await enviar('eliminar_novedad', { id: novEditando.id }); cerrar(novDrawer) })))
$('#nueva-novedad').addEventListener('click', () => abrirNovedad(null))

/* ---------- Persona (ficha y pestañas) ---------- */
const perDrawer = $('#persona-drawer')
const fichaForm = $('#ficha-form')
let personaAbierta = null
let pestanaPersona = 'ficha'

function abrirPersona(id, pestana = 'ficha') {
  const p = persona(id)
  if (!p) return avisoError(new Error('Esa persona ya no tiene cuenta en el panel.'))
  personaAbierta = p.usuario_id
  llenarFicha(p)
  verPestana(pestana)
  abrir(perDrawer)
}
function cabeceraPersona(p) {
  $('#persona-titulo').textContent = p.nombre
  const partes = [cargoDe(p.ficha?.cargo_id)?.nombre, p.ficha?.area && et(C.areas, p.ficha.area), SITUACION[situacion(p)][1]].filter(Boolean)
  $('#persona-sub').textContent = partes.join(' · ')
}
function llenarFicha(p) {
  cabeceraPersona(p)
  fichaForm.reset()
  $('#ficha-err').textContent = ''
  const f = p.ficha || {}
  const el = fichaForm.elements
  el.usuario_id.value = p.usuario_id
  el.cargo_id.innerHTML = opciones(E.cargos.map((c) => ({ id: c.id, etiqueta: c.nombre })), f.cargo_id, 'Sin cargo')
  el.area.innerHTML = opciones(C.areas, f.area, 'Sin área')
  el.tipo_contrato.innerHTML = opciones(C.contratos, f.tipo_contrato, 'Sin definir')
  for (const k of ['documento', 'jefe', 'fecha_ingreso', 'fecha_fin_contrato', 'fecha_retiro', 'fecha_nacimiento', 'telefono', 'correo_personal', 'emergencia_nombre', 'emergencia_telefono', 'eps', 'pension', 'cesantias', 'arl', 'caja', 'notas']) el[k].value = f[k] ?? ''
  el.salario.value = f.salario ? Number(f.salario).toLocaleString('es-CO') : ''
  el.vacaciones_ajuste.value = f.vacaciones_ajuste ? String(f.vacaciones_ajuste).replace('.', ',') : ''
}
fichaForm.elements.salario.addEventListener('blur', (e) => {
  const n = Number(e.target.value.replace(/[^\d]/g, ''))
  e.target.value = n ? n.toLocaleString('es-CO') : ''
})
fichaForm.addEventListener('submit', (ev) => {
  ev.preventDefault()
  const datos = Object.fromEntries(new FormData(fichaForm))
  datos.vacaciones_ajuste = String(datos.vacaciones_ajuste || '0').replace(',', '.')
  const btn = fichaForm.querySelector('[type=submit]')
  conBoton(btn, $('#ficha-err'), async () => {
    await enviar('guardar_ficha', datos)
    const t = btn.querySelector('.t')
    t.textContent = 'Guardada'
    setTimeout(() => { t.textContent = 'Guardar ficha' }, 1500)
  })
})

$('#persona-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-ptab]'); if (b) verPestana(b.dataset.ptab) })
function verPestana(tab) {
  pestanaPersona = tab
  $$('#persona-tabs .subtab').forEach((b) => b.classList.toggle('is-active', b.dataset.ptab === tab))
  fichaForm.hidden = tab !== 'ficha'
  $('#persona-vista').hidden = tab === 'ficha'
  if (tab !== 'ficha') pintarVistaPersona()
}

/** Después de cada escritura: la ficha abierta se refresca sin perder la pestaña. */
function refrescarPersona() {
  if (!personaAbierta || perDrawer.hidden) return
  const p = persona(personaAbierta)
  if (!p) { cerrar(perDrawer); return }
  cabeceraPersona(p)
  if (pestanaPersona === 'ficha') {
    // Los selects dependen de los cargos; el resto del formulario se respeta.
    const actual = fichaForm.elements.cargo_id.value
    fichaForm.elements.cargo_id.innerHTML = opciones(E.cargos.map((c) => ({ id: c.id, etiqueta: c.nombre })), actual, 'Sin cargo')
  } else pintarVistaPersona()
}

function pintarVistaPersona() {
  const p = persona(personaAbierta)
  if (!p) return
  const v = $('#persona-vista')
  const id = p.usuario_id
  if (pestanaPersona === 'documentos') {
    const docs = E.documentos.filter((d) => d.usuario_id === id)
    v.innerHTML = `
      <div class="th-vista-head"><p class="muted">Contratos, afiliaciones, certificados y licencias. El archivo vive en Drive; aquí va el enlace y la fecha de vencimiento.</p><button type="button" class="btn-primary" data-p="doc-nuevo">+ Agregar documento</button></div>
      ${docs.length ? `<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Documento</th><th>Expedición</th><th>Vencimiento</th><th></th></tr></thead><tbody>
        ${docs.map((d) => `<tr>
          <td><div class="t1">${esc(d.nombre || et(C.documentos, d.tipo))}</div><div class="t2">${esc(et(C.documentos, d.tipo))}</div></td>
          <td class="nw">${d.fecha_expedicion ? esc(fmtDate(d.fecha_expedicion)) : '<span class="muted">Sin fecha</span>'}</td>
          <td class="nw">${d.fecha_vencimiento ? `${esc(fmtDate(d.fecha_vencimiento))} ${chipVence(d.fecha_vencimiento)}` : '<span class="muted">No vence</span>'}</td>
          <td class="der"><span class="acciones">${d.enlace ? `<a class="btn-mini" href="${esc(d.enlace)}" target="_blank" rel="noopener noreferrer">Abrir</a>` : ''}<button type="button" class="btn-ico" data-p="doc-editar" data-id="${d.id}" title="Editar" aria-label="Editar">${svg('editar')}</button></span></td>
        </tr>`).join('')}</tbody></table></div>` : '<div class="vacio"><b>Sin documentos</b>Agregue el contrato, las afiliaciones y los certificados que vencen.</div>'}`
  } else if (pestanaPersona === 'novedades') {
    const s = E.saldos[id]
    const novs = E.novedades.filter((n) => n.usuario_id === id)
    const saldo = !p.ficha
      ? '<div class="th-saldo vacio-saldo">Complete la ficha (tipo de contrato y fecha de ingreso) para calcular las vacaciones.</div>'
      : !s?.aplica ? '<div class="th-saldo vacio-saldo">Con este tipo de contrato no se causan vacaciones.</div>'
      : s.sinIngreso ? '<div class="th-saldo vacio-saldo">Falta la fecha de ingreso en la ficha para calcular las vacaciones.</div>'
      : `<div class="th-saldo">
          <div><span>Causadas</span><b>${num(s.causadas)}</b><small>15 por año desde el ${esc(fmtDate(p.ficha.fecha_ingreso))}</small></div>
          <div><span>Disfrutadas</span><b>${num(s.tomadas + s.ajuste)}</b><small>${s.ajuste ? `${num(s.ajuste)} antes del panel` : 'Aprobadas que ya empezaron'}</small></div>
          <div><span>Programadas</span><b>${num(s.programadas)}</b><small>${s.porAprobar ? `y ${num(s.porAprobar)} por aprobar` : 'Aprobadas a futuro'}</small></div>
          <div class="is-saldo"><span>Saldo</span><b class="${s.saldo < 0 ? 'th-mal' : ''}">${num(s.saldo)}</b><small>Días hábiles disponibles</small></div>
        </div>`
    v.innerHTML = `
      ${saldo}
      <div class="th-vista-head"><p class="muted">Vacaciones, permisos, licencias e incapacidades de ${esc(p.nombre.split(' ')[0])}.</p><button type="button" class="btn-primary" data-p="nov-nueva">+ Registrar novedad</button></div>
      ${novs.length ? `<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Tipo</th><th>Fechas</th><th>Días</th><th>Estado</th></tr></thead><tbody>
        ${novs.map((n) => `<tr data-fila="${n.id}" data-p="nov-editar" data-id="${n.id}"><td><div class="t1">${esc(et(C.novedades, n.tipo))}</div>${n.motivo ? `<div class="t2 clip">${esc(n.motivo)}</div>` : ''}</td><td class="nw">${esc(rango(n.desde, n.hasta))}</td><td class="num">${num(n.dias_habiles)} háb.</td><td>${pastilla(NOVEDAD_PUNTO[n.estado] || n.estado, et(C.estadosNovedad, n.estado))}</td></tr>`).join('')}
      </tbody></table></div>` : '<div class="vacio"><b>Sin novedades</b>Cuando registre vacaciones o permisos, aparecen aquí.</div>'}`
  } else if (pestanaPersona === 'formacion') {
    const forms = E.formaciones.filter((f) => f.usuario_id === id)
    const cursos = E.cursos.filter((c) => c.activo)
    v.innerHTML = `
      <form class="th-inline" data-p="form-registrar">
        <label>Curso<select name="curso_id" required>${opciones(cursos.map((c) => ({ id: c.id, etiqueta: c.nombre })), '', 'Elija el curso')}</select></label>
        <label>Fecha<input type="date" name="fecha" required max="${E.hoy}" /></label>
        <label>Certificado (enlace)<input type="url" name="enlace" placeholder="https://…" /></label>
        <button type="submit" class="btn-primary">Registrar</button>
        <p class="form-error"></p>
      </form>
      ${forms.length ? `<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Curso</th><th>Fecha</th><th>Vigencia</th><th></th></tr></thead><tbody>
        ${forms.map((f) => { const c = E.cursos.find((x) => x.id === f.curso_id); return `<tr>
          <td><div class="t1">${esc(c?.nombre || 'Curso')}</div><div class="t2">${esc(et(C.cursos, c?.tipo))}${c?.horas ? ` · ${num(c.horas)} h` : ''}</div></td>
          <td class="nw">${esc(fmtDate(f.fecha))}</td>
          <td class="nw">${f.vence_el ? `${esc(fmtDate(f.vence_el))} ${chipVence(f.vence_el)}` : '<span class="muted">No vence</span>'}</td>
          <td class="der"><span class="acciones">${f.enlace ? `<a class="btn-mini" href="${esc(f.enlace)}" target="_blank" rel="noopener noreferrer">Certificado</a>` : ''}<button type="button" class="btn-ico danger" data-p="form-borrar" data-id="${f.id}" title="Quitar" aria-label="Quitar">${svg('borrar')}</button></span></td></tr>` }).join('')}
      </tbody></table></div>` : '<div class="vacio"><b>Sin formación registrada</b>Registre los cursos y talleres a los que asistió.</div>'}`
  } else if (pestanaPersona === 'desempeno') {
    const evs = E.evaluaciones.filter((x) => x.usuario_id === id)
    v.innerHTML = `
      <div class="th-vista-head"><p class="muted">${evs.length ? `Última: ${esc(fmtDate(evs[0].fecha))}, promedio ${num(evs[0].promedio)}.` : 'Sin evaluaciones todavía.'}</p><button type="button" class="btn-primary" data-p="eval-nueva">+ Nueva evaluación</button></div>
      ${evs.length ? `<div class="th-evals">${evs.map(tarjetaEval).join('')}</div>` : ''}`
  }
}

$('#persona-vista').addEventListener('click', (e) => {
  const b = e.target.closest('[data-p]')
  if (!b || b.tagName === 'FORM') return
  const id = Number(b.dataset.id)
  const acc = b.dataset.p
  if (acc === 'doc-nuevo') abrirDocumento(null, personaAbierta)
  else if (acc === 'doc-editar') abrirDocumento(E.documentos.find((d) => d.id === id))
  else if (acc === 'nov-nueva') abrirNovedad(null, personaAbierta)
  else if (acc === 'nov-editar') abrirNovedad(E.novedades.find((n) => n.id === id))
  else if (acc === 'eval-nueva') abrirEval(null, personaAbierta)
  else if (acc === 'eval-abrir') abrirEval(E.evaluaciones.find((x) => x.id === id))
  else if (acc === 'form-borrar') confirmarClic(b, () => conBoton(b, null, () => enviar('eliminar_formacion', { id })))
})
$('#persona-vista').addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-p="form-registrar"]')
  if (!f) return
  e.preventDefault()
  const d = Object.fromEntries(new FormData(f))
  conBoton(f.querySelector('button'), f.querySelector('.form-error'), () => enviar('registrar_formaciones', { curso_id: Number(d.curso_id), fecha: d.fecha, enlace: d.enlace, usuario_ids: [personaAbierta] }))
})

/* ---------- Documentos ---------- */
const docDrawer = $('#doc-drawer')
const docForm = $('#doc-form')
let docEditando = null
function abrirDocumento(d, usuario_id) {
  docEditando = d || null
  docForm.reset()
  $('#doc-err').textContent = ''
  $('#doc-titulo').textContent = d ? 'Editar documento' : 'Agregar documento'
  docForm.elements.tipo.innerHTML = opciones(C.documentos, d?.tipo ?? 'contrato')
  for (const k of ['id', 'nombre', 'enlace', 'fecha_expedicion', 'fecha_vencimiento', 'notas']) docForm.elements[k].value = d ? (d[k] ?? '') : ''
  docForm.elements.usuario_id.value = d?.usuario_id ?? usuario_id
  avisoSalud()
  // El botón de eliminar se agrega solo al editar.
  let borrar = $('#doc-borrar')
  if (!borrar) {
    borrar = document.createElement('button')
    borrar.type = 'button'; borrar.id = 'doc-borrar'; borrar.className = 'btn-ghost danger-txt'; borrar.textContent = 'Eliminar'
    docForm.querySelector('.drawer-actions .form-error').after(borrar)
    borrar.addEventListener('click', () => confirmarClic(borrar, () => conBoton(borrar, $('#doc-err'), async () => { await enviar('eliminar_documento', { id: docEditando.id }); cerrar(docDrawer) })))
  }
  borrar.hidden = !d
  abrir(docDrawer)
}
const avisoSalud = () => { $('#doc-aviso-salud').hidden = docForm.elements.tipo.value !== 'examen' }
docForm.elements.tipo.addEventListener('change', avisoSalud)
docForm.addEventListener('submit', (ev) => {
  ev.preventDefault()
  const datos = Object.fromEntries(new FormData(docForm))
  conBoton(docForm.querySelector('[type=submit]'), $('#doc-err'), async () => { await enviar('guardar_documento', datos); cerrar(docDrawer) })
})

/* ---------- Capacitación ---------- */
const asistentesDe = (cursoId) => new Set(E.formaciones.filter((f) => f.curso_id === cursoId).map((f) => f.usuario_id))
const porVencerDe = (cursoId) => E.avisos.filter((a) => a.tipo === 'formacion' && E.formaciones.some((f) => `form-${f.id}` === a.clave && f.curso_id === cursoId)).length
const listaCursos = crearLista({
  el: '#curso-list', buscador: '#curso-q', chipsEl: '#curso-chips',
  datos: () => E.cursos,
  texto: (c) => [c.nombre, c.proveedor, et(C.cursos, c.tipo), c.descripcion].join(' '),
  vacio: ['Sin cursos', 'Cree los cursos que toma el equipo: inducción, alturas, manejo defensivo…'],
  chips: [
    { id: 'activos', lbl: 'Activos', f: (c) => c.activo },
    { id: 'ia', lbl: 'IA', f: (c) => c.tipo === 'ia' && c.activo, siHay: true },
    { id: 'sst', lbl: 'SST', f: (c) => c.tipo === 'sst' && c.activo, siHay: true },
    { id: 'inactivos', lbl: 'Inactivos', f: (c) => !c.activo, siHay: true },
    { id: 'todos', lbl: 'Todos', f: () => true },
  ],
  columnas: [
    { k: 'nombre', lbl: 'Curso', orden: (c) => c.nombre.toLowerCase(), html: (c) => `<div class="t1">${esc(c.nombre)}</div>${c.proveedor || c.descripcion ? `<div class="t2 clip">${esc([c.proveedor, c.descripcion].filter(Boolean).join(' · '))}</div>` : ''}` },
    { k: 'tipo', lbl: 'Tipo', orden: (c) => c.tipo, html: (c) => `<span class="nw">${esc(et(C.cursos, c.tipo))}</span>` },
    { k: 'vig', lbl: 'Vigencia', cls: 'nw', orden: (c) => c.vigencia_meses, html: (c) => (c.vigencia_meses ? `${c.vigencia_meses} ${c.vigencia_meses === 1 ? 'mes' : 'meses'}` : '<span class="muted">No vence</span>') },
    { k: 'asis', lbl: 'Asistentes', cls: 'num', orden: (c) => -asistentesDe(c.id).size, html: (c) => { const n = asistentesDe(c.id).size; return n ? `<b>${n}</b>` : '<span class="muted">0</span>' } },
    { k: 'venc', lbl: 'Por renovar', cls: 'num', orden: (c) => -porVencerDe(c.id), html: (c) => { const n = porVencerDe(c.id); return n ? `<b class="cuenta-alertas">${n}</b>` : '<span class="muted">0</span>' } },
  ],
  abrir: (id) => abrirCurso(E.cursos.find((c) => c.id === Number(id))),
})

const cursoDrawer = $('#curso-drawer')
const cursoForm = $('#curso-form')
let cursoAbierto = null
function abrirCurso(c) {
  cursoAbierto = c?.id ?? null
  cursoForm.reset()
  $('#curso-err').textContent = ''
  $('#curso-titulo').textContent = c ? c.nombre : 'Nuevo curso'
  cursoForm.elements.tipo.innerHTML = opciones(C.cursos, c?.tipo ?? 'interno')
  for (const k of ['id', 'nombre', 'proveedor', 'descripcion']) cursoForm.elements[k].value = c ? (c[k] ?? '') : ''
  cursoForm.elements.horas.value = c?.horas ? String(c.horas).replace('.', ',') : ''
  cursoForm.elements.vigencia_meses.value = c?.vigencia_meses || ''
  cursoForm.elements.activo.checked = c ? c.activo : true
  $('#curso-borrar').hidden = !c || !!c.capacitacion_id
  pintarAsistencia()
  abrir(cursoDrawer)
}
function pintarAsistencia() {
  const el = $('#curso-asistencia')
  const c = E.cursos.find((x) => x.id === cursoAbierto)
  if (!c) { el.innerHTML = '<p class="muted th-nota">Guarde el curso para registrar quién asistió.</p>'; return }
  const forms = E.formaciones.filter((f) => f.curso_id === c.id)
  const activos = E.personas.filter(activo)
  const area = C.areas.find((a) => a.id === c.capacitacion_id)
  el.innerHTML = `
    <form id="asistencia-form"><fieldset class="grupo">
      <legend>Registrar asistencia</legend>
      <div class="grid2">
        <label>Fecha<input type="date" name="fecha" required max="${E.hoy}" /></label>
        <label>Certificado (enlace, opcional)<input type="url" name="enlace" placeholder="https://…" /></label>
      </div>
      <div class="th-quienes-head">
        <span>Quiénes asistieron</span>
        <span class="acciones">${area ? `<button type="button" class="link-btn" data-marcar="area">Los de ${esc(area.etiqueta)}</button>` : ''}<button type="button" class="link-btn" data-marcar="todos">Todos</button><button type="button" class="link-btn" data-marcar="nadie">Ninguno</button></span>
      </div>
      ${activos.length ? `<div class="th-quienes">${activos.map((p) => `<label class="th-check"><input type="checkbox" name="u" value="${p.usuario_id}" data-area="${esc(p.ficha.area)}" />${avatar(p.nombre, 'sm')}<span>${esc(p.nombre)}</span></label>`).join('')}</div>` : '<p class="muted">No hay personas activas con ficha.</p>'}
      <div class="th-acciones-form"><p class="form-error" id="asistencia-err"></p><button type="submit" class="btn-primary">Registrar asistencia</button></div>
    </fieldset></form>
    <fieldset class="grupo">
      <legend>Asistentes <span class="muted">(${forms.length})</span></legend>
      ${forms.length ? `<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Persona</th><th>Fecha</th><th>Vigencia</th><th></th></tr></thead><tbody>
        ${forms.map((f) => `<tr><td><div class="persona">${avatar(nombreDe(f.usuario_id), 'sm')}<span class="t1">${esc(nombreDe(f.usuario_id))}</span></div></td><td class="nw">${esc(fmtDate(f.fecha))}</td><td class="nw">${f.vence_el ? `${esc(fmtDate(f.vence_el))} ${chipVence(f.vence_el)}` : '<span class="muted">No vence</span>'}</td><td class="der"><span class="acciones">${f.enlace ? `<a class="btn-mini" href="${esc(f.enlace)}" target="_blank" rel="noopener noreferrer">Certificado</a>` : ''}<button type="button" class="btn-ico danger" data-quitar="${f.id}" title="Quitar" aria-label="Quitar">${svg('borrar')}</button></span></td></tr>`).join('')}
      </tbody></table></div>` : '<p class="muted">Nadie registrado todavía.</p>'}
    </fieldset>`
}
$('#curso-asistencia').addEventListener('click', (e) => {
  const m = e.target.closest('[data-marcar]')
  if (m) {
    const c = E.cursos.find((x) => x.id === cursoAbierto)
    $$('#asistencia-form input[name=u]').forEach((i) => { i.checked = m.dataset.marcar === 'todos' || (m.dataset.marcar === 'area' && i.dataset.area === c?.capacitacion_id) })
    return
  }
  const q = e.target.closest('[data-quitar]')
  if (q) confirmarClic(q, () => conBoton(q, null, () => enviar('eliminar_formacion', { id: Number(q.dataset.quitar) })))
})
$('#curso-asistencia').addEventListener('submit', (e) => {
  const f = e.target.closest('#asistencia-form')
  if (!f) return
  e.preventDefault()
  const ids = $$('input[name=u]:checked', f).map((i) => Number(i.value))
  const d = Object.fromEntries(new FormData(f))
  conBoton(f.querySelector('[type=submit]'), $('#asistencia-err'), () => enviar('registrar_formaciones', { curso_id: cursoAbierto, fecha: d.fecha, enlace: d.enlace, usuario_ids: ids }))
})
cursoForm.addEventListener('submit', (ev) => {
  ev.preventDefault()
  const d = Object.fromEntries(new FormData(cursoForm))
  d.activo = cursoForm.elements.activo.checked
  d.horas = String(d.horas || '0').replace(',', '.')
  conBoton(cursoForm.querySelector('[type=submit]'), $('#curso-err'), async () => {
    const r = await enviar('guardar_curso', d)
    cursoAbierto = r.resultado
    const c = E.cursos.find((x) => x.id === cursoAbierto)
    if (c) { $('#curso-titulo').textContent = c.nombre; cursoForm.elements.id.value = c.id; $('#curso-borrar').hidden = !!c.capacitacion_id }
    pintarAsistencia()
  })
})
$('#curso-borrar').addEventListener('click', (e) => confirmarClic(e.currentTarget, () => conBoton(e.currentTarget, $('#curso-err'), async () => { await enviar('eliminar_curso', { id: cursoAbierto }); cerrar(cursoDrawer) })))
$('#nuevo-curso').addEventListener('click', () => abrirCurso(null))

/* ---------- Desempeño ---------- */
function tarjetaEval(x) {
  return `<button type="button" class="th-eval" data-p="eval-abrir" data-id="${x.id}">
    <span class="th-eval-top"><b>${esc(x.periodo || fmtDate(x.fecha))}</b>${pastilla(x.estado === 'cerrada' ? 'activa' : 'borrador', x.estado === 'cerrada' ? 'Cerrada' : 'Borrador')}</span>
    <span class="th-barra"><i style="width:${(x.promedio / 5) * 100}%"></i></span>
    <span class="th-eval-pie"><b>${num(x.promedio)}</b> de 5 · ${esc(fmtDate(x.fecha))}${x.evaluador ? ` · ${esc(x.evaluador)}` : ''}</span>
  </button>`
}
const listaEvals = crearLista({
  el: '#eval-list', buscador: '#eval-q', chipsEl: '#eval-chips',
  datos: () => E.evaluaciones,
  texto: (x) => [nombreDe(x.usuario_id), x.cargo, x.periodo, x.evaluador].join(' '),
  vacio: ['Sin evaluaciones', 'Cree la primera con el botón de arriba. Los criterios salen del cargo de la persona.'],
  chips: [
    { id: 'todas', lbl: 'Todas', f: () => true },
    { id: 'borradores', lbl: 'Borradores', f: (x) => x.estado !== 'cerrada', siHay: true },
    { id: 'cerradas', lbl: 'Cerradas', f: (x) => x.estado === 'cerrada', siHay: true },
  ],
  columnas: [
    { k: 'p', lbl: 'Persona', orden: (x) => nombreDe(x.usuario_id).toLowerCase(), html: (x) => `<div class="persona">${avatar(nombreDe(x.usuario_id), 'sm')}<div><div class="t1">${esc(nombreDe(x.usuario_id))}</div>${x.cargo ? `<div class="t2">${esc(x.cargo)}</div>` : ''}</div></div>` },
    { k: 'periodo', lbl: 'Período', orden: (x) => x.periodo, html: (x) => esc(x.periodo || '') || '<span class="muted">Sin período</span>' },
    { k: 'fecha', lbl: 'Fecha', cls: 'nw', orden: (x) => x.fecha, html: (x) => esc(fmtDate(x.fecha)) },
    { k: 'prom', lbl: 'Promedio', orden: (x) => -x.promedio, html: (x) => `<div class="th-prom-celda"><b>${num(x.promedio)}</b><span class="th-barra"><i style="width:${(x.promedio / 5) * 100}%"></i></span></div>` },
    { k: 'estado', lbl: 'Estado', orden: (x) => x.estado, html: (x) => pastilla(x.estado === 'cerrada' ? 'activa' : 'borrador', x.estado === 'cerrada' ? 'Cerrada' : 'Borrador') },
    { k: 'ev', lbl: 'Evaluador', cls: 'nw', orden: (x) => x.evaluador, html: (x) => esc(x.evaluador) },
  ],
  abrir: (id) => abrirEval(E.evaluaciones.find((x) => x.id === Number(id))),
})
function renderPendientesEval() {
  const pend = E.avisos.filter((a) => a.tipo === 'evaluacion' && (a.nivel === 'vencido' || a.nivel === 'urgente' || a.nivel === 'pronto'))
  $('#eval-pendientes').innerHTML = pend.length
    ? `<div class="th-pendientes-eval"><span>Les toca evaluación:</span>${pend.map((a) => `<button type="button" class="chip" data-eval-para="${a.usuario_id}">${esc(nombreDe(a.usuario_id))}${a.nivel === 'vencido' ? ' <b>vencida</b>' : ''}</button>`).join('')}</div>`
    : ''
}
$('#eval-pendientes').addEventListener('click', (e) => { const b = e.target.closest('[data-eval-para]'); if (b) abrirEval(null, Number(b.dataset.evalPara)) })

const evalDrawer = $('#eval-drawer')
const evalForm = $('#eval-form')
let evalEditando = null
let evalCriterios = []
function criteriosPara(usuario_id) {
  const p = persona(usuario_id)
  const c = cargoDe(p?.ficha?.cargo_id)
  if (c?.criterios?.length) return { cargo: c.nombre, criterios: c.criterios, nota: `Criterios del cargo ${c.nombre}.` }
  return { cargo: c?.nombre || '', criterios: C.criteriosBase, nota: c ? `El cargo ${c.nombre} no tiene criterios propios: se usan los sugeridos. Puede definirlos en la pestaña Cargos.` : 'La persona no tiene cargo: se usan los criterios sugeridos. Asígnele un cargo en su ficha para usar los propios.' }
}
function abrirEval(x, usuario_id) {
  evalEditando = x || null
  evalForm.reset()
  $('#eval-err').textContent = ''
  $('#eval-titulo').textContent = x ? `Evaluación de ${nombreDe(x.usuario_id)}` : 'Nueva evaluación'
  const candidatos = E.personas.filter((p) => activo(p) || p.usuario_id === x?.usuario_id)
  const sel = evalForm.elements.usuario_id
  sel.innerHTML = opciones(candidatos.map((p) => ({ id: p.usuario_id, etiqueta: p.nombre })), x?.usuario_id ?? usuario_id, 'Elija la persona')
  sel.disabled = !!x
  evalForm.elements.id.value = x?.id ?? ''
  evalForm.elements.periodo.value = x?.periodo ?? ''
  evalForm.elements.fecha.value = x?.fecha ?? E.hoy
  for (const k of ['fortalezas', 'mejoras', 'metas']) evalForm.elements[k].value = x?.[k] ?? ''
  if (x) {
    evalCriterios = x.calificaciones.map((c) => ({ ...c }))
    evalForm.elements.cargo.value = x.cargo
    $('#eval-cargo').textContent = x.cargo ? `Cargo al evaluar: ${x.cargo}.` : ''
  } else cargarCriterios()
  $('#eval-borrar').hidden = !x
  pintarCriterios()
  abrir(evalDrawer)
}
function cargarCriterios() {
  const id = Number(evalForm.elements.usuario_id.value)
  if (!id) { evalCriterios = []; $('#eval-cargo').textContent = ''; evalForm.elements.cargo.value = ''; return }
  const { cargo, criterios, nota } = criteriosPara(id)
  evalCriterios = criterios.map((c) => ({ id: c.id, nombre: c.nombre, descripcion: c.descripcion, nota: 0, comentario: '' }))
  evalForm.elements.cargo.value = cargo
  $('#eval-cargo').textContent = nota
}
function pintarCriterios() {
  const el = $('#eval-criterios')
  if (!evalCriterios.length) { el.innerHTML = '<p class="muted">Elija la persona para cargar los criterios.</p>'; $('#eval-promedio').innerHTML = ''; return }
  el.innerHTML = evalCriterios.map((c, i) => `
    <div class="th-criterio">
      <div class="th-criterio-txt"><b>${esc(c.nombre)}</b>${c.descripcion ? `<small>${esc(c.descripcion)}</small>` : ''}</div>
      <div class="th-notas" role="radiogroup" aria-label="${esc(c.nombre)}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="${c.nota === n}" class="${c.nota === n ? 'is-on' : ''}" data-crit="${i}" data-nota="${n}">${n}</button>`).join('')}</div>
      <input class="th-coment" data-coment="${i}" value="${esc(c.comentario)}" placeholder="Comentario (opcional)" aria-label="Comentario sobre ${esc(c.nombre)}" />
    </div>`).join('')
  pintarPromedio()
}
function pintarPromedio() {
  const notas = evalCriterios.map((c) => c.nota).filter((n) => n >= 1)
  const prom = notas.length ? notas.reduce((a, n) => a + n, 0) / notas.length : 0
  $('#eval-promedio').innerHTML = `<span>Promedio</span><b>${num(Math.round(prom * 100) / 100)}</b><span class="muted">${notas.length} de ${evalCriterios.length} criterios calificados</span>`
}
$('#eval-criterios').addEventListener('click', (e) => {
  const b = e.target.closest('[data-crit]')
  if (!b) return
  evalCriterios[Number(b.dataset.crit)].nota = Number(b.dataset.nota)
  $$(`[data-crit="${b.dataset.crit}"]`).forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', String(on)) })
  pintarPromedio()
})
$('#eval-criterios').addEventListener('input', (e) => { const i = e.target.dataset.coment; if (i !== undefined) evalCriterios[Number(i)].comentario = e.target.value })
evalForm.elements.usuario_id.addEventListener('change', () => { if (!evalEditando) { cargarCriterios(); pintarCriterios() } })
evalForm.addEventListener('submit', (ev) => {
  ev.preventDefault()
  const estado = ev.submitter?.dataset.estado || 'borrador'
  const d = Object.fromEntries(new FormData(evalForm))
  d.usuario_id = evalEditando?.usuario_id ?? d.usuario_id
  d.estado = estado
  d.calificaciones = evalCriterios.map(({ id, nombre, nota, comentario }) => ({ id, nombre, nota, comentario }))
  conBoton(ev.submitter, $('#eval-err'), async () => { await enviar('guardar_evaluacion', d); cerrar(evalDrawer) })
})
$('#eval-borrar').addEventListener('click', (e) => confirmarClic(e.currentTarget, () => conBoton(e.currentTarget, $('#eval-err'), async () => { await enviar('eliminar_evaluacion', { id: evalEditando.id }); cerrar(evalDrawer) })))
$('#nueva-eval').addEventListener('click', () => abrirEval(null))

/* ---------- Cargos ---------- */
function renderCargos() {
  const el = $('#cargo-list')
  if (!E.cargos.length) { el.innerHTML = '<div class="vacio"><b>Sin cargos</b>Cree los cargos de la empresa con sus criterios de evaluación.</div>'; return }
  el.innerHTML = E.cargos.map((c) => {
    const gente = E.personas.filter((p) => activo(p) && p.ficha.cargo_id === c.id)
    return `<button type="button" class="th-cargo" data-cargo="${c.id}">
      <span class="th-cargo-top"><b>${esc(c.nombre)}</b>${c.area ? `<span class="muted">${esc(et(C.areas, c.area))}</span>` : ''}</span>
      ${c.descripcion ? `<span class="th-cargo-desc">${esc(c.descripcion)}</span>` : ''}
      <span class="th-cargo-crit">${c.criterios.length ? c.criterios.map((k) => `<i>${esc(k.nombre)}</i>`).join('') : '<span class="th-mal">Sin criterios de evaluación</span>'}</span>
      <span class="th-cargo-pie">${gente.length ? gente.map((p) => avatar(p.nombre, 'sm')).join('') + `<span>${gente.length} ${gente.length === 1 ? 'persona' : 'personas'}</span>` : '<span class="muted">Nadie en este cargo</span>'}</span>
    </button>`
  }).join('')
}
$('#cargo-list').addEventListener('click', (e) => { const b = e.target.closest('[data-cargo]'); if (b) abrirCargo(cargoDe(b.dataset.cargo)) })

const cargoDrawer = $('#cargo-drawer')
const cargoForm = $('#cargo-form')
let cargoEditando = null
let cargoCriterios = []
function abrirCargo(c) {
  cargoEditando = c || null
  cargoForm.reset()
  $('#cargo-err').textContent = ''
  $('#cargo-titulo').textContent = c ? c.nombre : 'Nuevo cargo'
  cargoForm.elements.area.innerHTML = opciones(C.areas, c?.area, 'Sin área')
  for (const k of ['id', 'nombre', 'descripcion']) cargoForm.elements[k].value = c ? (c[k] ?? '') : ''
  cargoCriterios = (c ? c.criterios : C.criteriosBase).map((k) => ({ ...k }))
  $('#cargo-borrar').hidden = !c
  pintarCriteriosCargo()
  abrir(cargoDrawer)
}
function pintarCriteriosCargo() {
  $('#cargo-criterios').innerHTML = cargoCriterios.length
    ? cargoCriterios.map((k, i) => `
      <div class="th-crit-fila">
        <input data-ck="${i}" data-campo="nombre" value="${esc(k.nombre)}" placeholder="Criterio" aria-label="Nombre del criterio" />
        <input data-ck="${i}" data-campo="descripcion" value="${esc(k.descripcion)}" placeholder="Qué se espera (opcional)" aria-label="Descripción del criterio" />
        <button type="button" class="btn-ico danger" data-quitar-crit="${i}" title="Quitar" aria-label="Quitar">${svg('borrar')}</button>
      </div>`).join('')
    : '<p class="muted">Sin criterios. Agregue al menos uno para poder evaluar a quien tenga este cargo.</p>'
}
$('#cargo-criterios').addEventListener('input', (e) => { const i = e.target.dataset.ck; if (i !== undefined) cargoCriterios[Number(i)][e.target.dataset.campo] = e.target.value })
$('#cargo-criterios').addEventListener('click', (e) => { const b = e.target.closest('[data-quitar-crit]'); if (b) { cargoCriterios.splice(Number(b.dataset.quitarCrit), 1); pintarCriteriosCargo() } })
$('#criterio-mas').addEventListener('click', () => { cargoCriterios.push({ id: '', nombre: '', descripcion: '' }); pintarCriteriosCargo(); $$('#cargo-criterios [data-campo="nombre"]').pop()?.focus() })
$('#criterio-base').addEventListener('click', () => { cargoCriterios = C.criteriosBase.map((k) => ({ ...k })); pintarCriteriosCargo() })
cargoForm.addEventListener('submit', (ev) => {
  ev.preventDefault()
  const d = Object.fromEntries(new FormData(cargoForm))
  d.criterios = cargoCriterios.filter((k) => k.nombre.trim())
  conBoton(cargoForm.querySelector('[type=submit]'), $('#cargo-err'), async () => { await enviar('guardar_cargo', d); cerrar(cargoDrawer) })
})
$('#cargo-borrar').addEventListener('click', (e) => confirmarClic(e.currentTarget, () => conBoton(e.currentTarget, $('#cargo-err'), async () => { await enviar('eliminar_cargo', { id: cargoEditando.id }); cerrar(cargoDrawer) })))
$('#nuevo-cargo').addEventListener('click', () => abrirCargo(null))

/* ---------- Ajustes ---------- */
const ajustesForm = $('#ajustes-form')
function llenarAjustes() {
  ajustesForm.elements.sabadoHabil.checked = !!E.ajustes.sabadoHabil
  ajustesForm.elements.evaluacionMeses.value = E.ajustes.evaluacionMeses
}
ajustesForm.addEventListener('submit', (ev) => {
  ev.preventDefault()
  const btn = ajustesForm.querySelector('[type=submit]')
  conBoton(btn, $('#ajustes-err'), async () => {
    await enviar('guardar_ajustes', { sabadoHabil: ajustesForm.elements.sabadoHabil.checked, evaluacionMeses: Number(ajustesForm.elements.evaluacionMeses.value) })
    const t = btn.querySelector('.t'); t.textContent = 'Guardado'; setTimeout(() => { t.textContent = 'Guardar' }, 1500)
  })
})
$('#enviar-resumen').addEventListener('click', (e) => {
  const b = e.currentTarget
  conBoton(b, $('#resumen-err'), async () => {
    await enviar('enviar_resumen')
    b.textContent = 'Enviado'
    setTimeout(() => { b.textContent = 'Enviar el resumen ahora' }, 2500)
  })
})

/* ---------- Todo junto ---------- */
function renderTodo() {
  // crearLista abre filas por `id`: se expone el usuario_id con ese nombre.
  for (const p of E.personas) p.id = p.usuario_id
  renderTablero()
  listaEquipo.pintar()
  listaNovedades.pintar()
  listaCursos.pintar()
  listaEvals.pintar()
  renderPendientesEval()
  renderCargos()
  llenarAjustes()
  const cuenta = (k, v) => { const c = $(`[data-cuenta="${k}"]`); if (c) c.textContent = v }
  cuenta('equipo', E.personas.filter(activo).length)
  cuenta('novedades', E.novedades.filter((n) => n.estado === 'solicitada').length)
  refrescarPersona()
  if (!cursoDrawer.hidden) pintarAsistencia()
}
renderTodo()

/* ---------- Abrir desde la URL ---------- */
// El asistente enlaza a /admin/talento?persona=<id> (y opcionalmente &ver=<pestaña>).
;(() => {
  const q = new URLSearchParams(location.search)
  const tab = q.get('tab')
  if (tab) irA(tab)
  const id = Number(q.get('persona'))
  if (id) abrirPersona(id, q.get('ver') || 'ficha')
})()
