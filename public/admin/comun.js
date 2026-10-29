// Piezas compartidas del panel (admin.js y cumplimiento.js): utilidades,
// fechas, avatares, estados con punto de color y listas con búsqueda.
export const $ = (s, r = document) => r.querySelector(s)
export const $$ = (s, r = document) => [...r.querySelectorAll(s)]

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
// Para buscar sin importar tildes ni mayúsculas.
export const plano = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const ICO = {
  editar: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  borrar: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  camion: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  mensaje: '<path d="M4 5h16v11H8l-4 4z"/>',
  correo: '<path d="M3 6h18v12H3z"/><path d="M3 7l9 6 9-6"/>',
}
export const svg = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICO[n]}</svg>`

/* ---------- Fechas ---------- */
// Las fechas sin hora (YYYY-MM-DD) se leen como locales para que no se
// corran un día por la zona horaria.
export const aFecha = (iso) => {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(iso)
  return isNaN(d) ? null : d
}
// Mismo estilo que las fechas del blog: "14 abr 2025". La corta omite el
// año cuando es el actual.
export const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const fmtDate = (iso) => {
  const d = aFecha(iso)
  return d ? `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}` : (iso || '')
}
export const fmtCorto = (iso) => {
  const d = aFecha(iso)
  if (!d) return iso || ''
  return d.getFullYear() === new Date().getFullYear() ? `${d.getDate()} ${MES[d.getMonth()]}` : fmtDate(iso)
}
export const inicioDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const diasDesde = (iso) => {
  const d = aFecha(iso)
  return d ? Math.round((inicioDia(new Date()) - inicioDia(d)) / 864e5) : null
}
export const fmtRel = (iso) => {
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
export const fechaTexto = (s) => {
  const m = /(\d{1,2})\s+([a-zñ]{3})\w*\.?\s+(\d{4})/i.exec(plano(s))
  return m ? new Date(+m[3], MES.indexOf(m[2]), +m[1]).getTime() || 0 : 0
}

/* ---------- Personas ---------- */
export const iniciales = (nombre) => String(nombre || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
export const TINTES = ['#1f8a8a', '#46a85b', '#e8920c', '#2f80c9', '#8b5cf6', '#c2557a']
export const tinte = (s) => TINTES[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTES.length]
export const avatar = (nombre, cls = '') => {
  const c = tinte(nombre)
  return `<span class="avatar ${cls}" style="background:color-mix(in oklab, ${c} 15%, #fff);color:color-mix(in oklab, ${c} 80%, #1a1f1d)" aria-hidden="true">${esc(iniciales(nombre))}</span>`
}
export const estado = (clave, texto) => `<span class="estado c-${esc(clave)}">${esc(texto)}</span>`

/* ---------- Listas con búsqueda, filtros y orden ---------- */
// Cada sección arma una lista con: datos(), texto(fila) para el buscador,
// chips [{ id, lbl, f }], columnas [{ k, lbl, html, orden?, cls? }] y qué
// hacer al abrir una fila o pulsar una acción (data-acc).
export function crearLista(cfg) {
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
