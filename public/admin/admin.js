// EKOSOLV CMS — client logic
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

let posts = window.__POSTS__ || []
let norms = window.__NORMS__ || []

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
renderPosts()
renderNorms()
