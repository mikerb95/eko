// EKOSOLV CMS — client logic
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

let posts = window.__POSTS__ || []
let norms = window.__NORMS__ || []
let orders = window.__ORDERS__ || []
let contacts = window.__CONTACTS__ || []
let users = window.__USERS__ || []
const role = window.__ROLE__ || ''

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/* ---------- Tabs ---------- */
$$('.tab').forEach((t) => t.addEventListener('click', () => {
  $$('.tab').forEach((x) => x.classList.remove('is-active'))
  $$('.panel').forEach((x) => x.classList.remove('is-active'))
  t.classList.add('is-active')
  $('#panel-' + t.dataset.tab).classList.add('is-active')
}))

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
const STATUS_PILL = {
  solicitada: 'feat', confirmada: 'deep', programada: 'deep', en_ruta: 'clay',
  recolectada: 'forest', certificada: 'forest', cerrada: '', cancelada: '',
}
const WASTE_TYPE_LABELS = {
  raee_computo: 'RAEE · Cómputo y periféricos',
  raee_telco: 'RAEE · Telecomunicaciones',
  raee_datacenter: 'RAEE · Infraestructura de data center',
  baterias: 'Baterías y pilas',
  otro: 'Otro',
}
const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d) ? iso : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function renderOrders() {
  const el = $('#order-list')
  const filter = $('#order-filter').value
  const rows = filter ? orders.filter((o) => o.status === filter) : orders
  if (!rows.length) { el.innerHTML = '<div class="empty">Sin órdenes de recolección todavía. Las solicitudes del formulario público aparecen aquí.</div>'; return }
  el.innerHTML = rows.map((o) => `
    <div class="row-card">
      <div class="main">
        <div class="title">${esc(o.consecutive)} — ${esc(o.first_name)} ${esc(o.last_name)}${o.company ? ' · ' + esc(o.company) : ''}</div>
        <div class="meta">
          <span class="pill ${STATUS_PILL[o.status] || ''}">${STATUS_LABELS[o.status] || esc(o.status)}</span>
          <span>${esc(o.city)}</span>
          <span>·</span><span>Solicitada ${fmtDate(o.created_at)}</span>
          ${o.scheduled_at ? `<span>·</span><span>Programada ${fmtDate(o.scheduled_at)}</span>` : ''}
          ${o.assigned_to ? `<span>·</span><span>Resp: ${esc(o.assigned_to)}</span>` : ''}
        </div>
      </div>
      <div class="row-actions">
        <button class="icon-btn" data-open-order="${o.id}">Gestionar</button>
      </div>
    </div>`).join('')
  $$('[data-open-order]', el).forEach((b) => b.addEventListener('click', () => openOrder(Number(b.dataset.openOrder))))
}
$('#order-filter').addEventListener('change', renderOrders)

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
  $('#order-client').innerHTML = `
    <div class="row-card"><div class="main">
      <div class="title">${esc(o.first_name)} ${esc(o.last_name)}${o.company ? ' · ' + esc(o.company) : ''}</div>
      <div class="meta">
        <span>${esc(o.email)}</span><span>·</span><span>${esc(o.phone)}</span><span>·</span>
        <span>${esc(o.address)}${o.address2 ? ', ' + esc(o.address2) : ''}, ${esc(o.city)}${o.postal_code ? ' (' + esc(o.postal_code) + ')' : ''}, ${esc(o.country)}</span>
      </div>
      ${(o.waste_type || o.estimated_quantity) ? `<div class="meta" style="margin-top:6px">${o.waste_type ? esc(WASTE_TYPE_LABELS[o.waste_type] || o.waste_type) : ''}${o.waste_type && o.estimated_quantity ? ' · ' : ''}${o.estimated_quantity ? esc(o.estimated_quantity) : ''}</div>` : ''}
      ${o.message ? `<div class="meta" style="margin-top:6px">“${esc(o.message)}”</div>` : ''}
    </div></div>`
  $('#order-events').innerHTML = '<div class="empty">Cargando historial…</div>'
  openDrawer('#order-drawer')
  try {
    const res = await fetch('/api/admin/recolecciones?id=' + id)
    const j = await res.json()
    const evs = j.events || []
    $('#order-events').innerHTML = evs.length ? evs.map((ev) => `
      <div class="row-card"><div class="main">
        <div class="meta">
          <span class="pill">${STATUS_LABELS[ev.to_status] || esc(ev.to_status)}</span>
          <span>${fmtDate(ev.at)}</span><span>·</span><span>${esc(ev.user)}</span>
          ${ev.note ? `<span>·</span><span>${esc(ev.note)}</span>` : ''}
        </div>
      </div></div>`).join('') : '<div class="empty">Sin eventos.</div>'
  } catch {
    $('#order-events').innerHTML = '<div class="empty">No se pudo cargar el historial.</div>'
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

function renderContacts() {
  const el = $('#contact-list')
  if (!el) return
  const filter = $('#contact-filter').value
  const rows = filter ? contacts.filter((c) => c.status === filter) : contacts
  if (!rows.length) {
    el.innerHTML = '<div class="empty">Sin mensajes de contacto todavía. Los envíos del formulario público aparecen aquí.</div>'
    return
  }
  el.innerHTML = rows.map((c) => `
    <div class="row-card">
      <div class="main">
        <div class="title">${esc(c.name)}${c.company ? ' · ' + esc(c.company) : ''}</div>
        <div class="meta">
          <span class="pill ${c.status === 'nuevo' ? 'feat' : 'forest'}">${CONTACT_STATUS_LABELS[c.status] || esc(c.status)}</span>
          <span>${esc(c.email)}</span>${c.phone ? `<span>·</span><span>${esc(c.phone)}</span>` : ''}
          <span>·</span><span>${fmtDate(c.created_at)}</span>
        </div>
        ${c.sector ? `<div class="meta" style="margin-top:6px">Sector: ${esc(c.sector)}</div>` : ''}
        ${c.service_lines ? `<div class="meta" style="margin-top:6px">Líneas: ${esc(c.service_lines)}</div>` : ''}
        ${c.message ? `<div class="meta" style="margin-top:6px">“${esc(c.message)}”</div>` : ''}
      </div>
      <div class="row-actions">
        <button class="icon-btn" data-contact-toggle="${c.id}" data-to="${c.status === 'nuevo' ? 'atendido' : 'nuevo'}">
          ${c.status === 'nuevo' ? 'Marcar atendido' : 'Reabrir'}
        </button>
      </div>
    </div>`).join('')
  $$('[data-contact-toggle]', el).forEach((b) =>
    b.addEventListener('click', () => toggleContact(Number(b.dataset.contactToggle), b.dataset.to)),
  )
}

async function toggleContact(id, to) {
  try {
    const res = await fetch('/api/admin/contactos?id=' + id, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: to }),
    })
    const j = await res.json()
    if (res.ok && j.contact) {
      const idx = contacts.findIndex((c) => c.id === id)
      if (idx >= 0) contacts[idx] = j.contact
      renderContacts()
    }
  } catch { /* silencioso: el usuario puede reintentar */ }
}

const contactFilterEl = $('#contact-filter')
if (contactFilterEl) contactFilterEl.addEventListener('change', renderContacts)
renderContacts()

/* ---------- Usuarios (solo admin) ---------- */
const ROLE_LABELS = {
  admin: 'Administrador', operaciones: 'Operaciones', logistica: 'Logística',
  consultor: 'Consultor', lectura: 'Solo lectura',
}
const uf = $('#user-form')

function renderUsers() {
  const el = $('#user-list')
  if (!el) return
  if (!users.length) { el.innerHTML = '<div class="empty">Sin usuarios.</div>'; return }
  el.innerHTML = users.map((u) => `
    <div class="row-card">
      <div class="main">
        <div class="title">${esc(u.name)} <span class="muted" style="font-weight:400">· ${esc(u.username)}</span></div>
        <div class="meta">
          <span class="pill ${u.role === 'admin' ? 'deep' : ''}">${ROLE_LABELS[u.role] || esc(u.role)}</span>
          ${u.active ? '<span class="pill forest">Activa</span>' : '<span class="pill">Inactiva</span>'}
        </div>
      </div>
      <div class="row-actions">
        <button class="icon-btn" data-edit-user="${u.id}">Editar</button>
        <button class="icon-btn danger" data-del-user="${u.id}" data-name="${esc(u.username)}">Eliminar</button>
      </div>
    </div>`).join('')
  $$('[data-edit-user]', el).forEach((b) => b.addEventListener('click', () => openUser(users.find((u) => u.id == b.dataset.editUser))))
  $$('[data-del-user]', el).forEach((b) => b.addEventListener('click', () => delUser(b.dataset.delUser, b.dataset.name)))
}

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

/* ---------- Render: posts ---------- */
function renderPosts() {
  const el = $('#post-list')
  if (!posts.length) { el.innerHTML = '<div class="empty">Sin artículos todavía.</div>'; return }
  el.innerHTML = posts.map((p) => `
    <div class="row-card">
      <div class="main">
        <div class="title">${esc(p.title)}</div>
        <div class="meta">
          <span class="pill ${esc(p.accent)}">${esc(p.category)}</span>
          ${p.featured ? '<span class="pill feat">Destacado</span>' : ''}
          <span>${esc(p.date)}</span><span>·</span><span>${esc(p.readtime)}</span>
          <span>·</span><span>/blog/${esc(p.slug)}</span>
        </div>
      </div>
      <div class="row-actions">
        <button class="icon-btn" data-edit-post="${p.id}">Editar</button>
        <button class="icon-btn danger" data-del-post="${p.id}" data-title="${esc(p.title)}">Eliminar</button>
      </div>
    </div>`).join('')
  $$('[data-edit-post]', el).forEach((b) => b.addEventListener('click', () => openPost(posts.find((p) => p.id == b.dataset.editPost))))
  $$('[data-del-post]', el).forEach((b) => b.addEventListener('click', () => delPost(b.dataset.delPost, b.dataset.title)))
}

/* ---------- Render: normativas ---------- */
function renderNorms() {
  const el = $('#norm-list')
  if (!norms.length) { el.innerHTML = '<div class="empty">Sin normativas todavía.</div>'; return }
  const cols = { 1: [], 2: [] }
  norms.forEach((n) => (cols[n.col === 2 ? 2 : 1] || cols[1]).push(n))
  el.innerHTML = [1, 2].map((c) => `
    <div class="col-label">Columna ${c}</div>
    ${cols[c].map((n) => `
      <div class="row-card">
        <div class="main">
          <div class="title">${esc(n.code)} — ${esc(n.title)}</div>
          <div class="meta">${(n.tags || []).map((t) => `<span class="pill">${esc(t)}</span>`).join('')}<span>orden ${esc(n.position)}</span></div>
        </div>
        <div class="row-actions">
          <button class="icon-btn" data-edit-norm="${n.id}">Editar</button>
          <button class="icon-btn danger" data-del-norm="${n.id}" data-title="${esc(n.code)}">Eliminar</button>
        </div>
      </div>`).join('') || '<div class="empty">Columna vacía.</div>'}
  `).join('')
  $$('[data-edit-norm]', el).forEach((b) => b.addEventListener('click', () => openNorm(norms.find((n) => n.id == b.dataset.editNorm))))
  $$('[data-del-norm]', el).forEach((b) => b.addEventListener('click', () => delNorm(b.dataset.delNorm, b.dataset.title)))
}

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
    featured: pf.featured.checked, lede: pf.lede.value, sections: collectSections(),
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
  openDrawer('#norm-drawer')
}
nf.addEventListener('submit', async (e) => {
  e.preventDefault()
  const btn = nf.querySelector('button[type=submit]'), t = btn.querySelector('.t')
  btn.disabled = true; t.textContent = 'Guardando…'; $('#norm-err').textContent = ''
  const payload = {
    id: nf.id.value || undefined, code: nf.code.value, col: Number(nf.col.value),
    title: nf.title.value, body: nf.body.value, tags: nf.tags.value, position: Number(nf.position.value),
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
renderOrders()
renderPosts()
renderNorms()
renderUsers()
