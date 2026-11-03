import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

// Academia de IA de punta a punta: el admin inscribe a una persona, publica
// lecciones y programa los sábados; la persona estudia, practica con el
// revisor (modelo simulado) y entrega; el admin aprueba y sale el certificado,
// verificable en público y registrado en Talento humano.

test.describe.configure({ mode: 'serial' })

const PARTICIPANTE = { username: 'ana.ruiz', password: 'clave-segura-1', name: 'Ana Ruiz' }

async function entrarAdmin(page: Page) {
  const r = await page.request.post('/api/admin/login', { data: { username: 'admin', password: 'ekosolv2026*' } })
  expect(r.ok()).toBeTruthy()
}

async function admin(req: APIRequestContext, accion: string, datos: Record<string, unknown> = {}) {
  const r = await req.post('/api/admin/academia', { data: { accion, ...datos } })
  const j = await r.json()
  expect(r.ok(), JSON.stringify(j)).toBeTruthy()
  return j
}

let codigo = ''

test('panel: inscribir, publicar y programar', async ({ page }) => {
  await entrarAdmin(page)
  await page.goto('/admin/academia')
  await expect(page.getByRole('heading', { name: 'Academia de IA' })).toBeVisible()
  await expect(page.locator('#persona-list')).toContainText('Nadie inscrito todavía')

  // Inscribir con cuenta nueva desde el formulario.
  await page.getByRole('button', { name: '+ Inscribir persona' }).click()
  const f = page.locator('#insc-form')
  await f.locator('[name=name]').fill(PARTICIPANTE.name)
  await f.locator('[name=username]').fill(PARTICIPANTE.username)
  await f.locator('[name=password]').fill(PARTICIPANTE.password)
  await f.locator('[name=area]').selectOption('logistica')
  await f.getByRole('button', { name: 'Inscribir' }).click()
  await expect(page.locator('#persona-list')).toContainText('Ana Ruiz')

  // Las lecciones vienen sembradas y sin publicar.
  await page.locator('.subtab[data-tab=lecciones]').click()
  await expect(page.locator('#leccion-list')).toContainText('Cómo pedir: contexto, tarea, formato y ejemplos')
  await page.screenshot({ path: 'test-results/academia-admin-lecciones.png', fullPage: true })

  const est = await (await page.request.get('/api/admin/academia')).json()
  const generales = est.lecciones.filter((l: any) => l.modulo === 'general')
  for (const l of generales) await admin(page.request, 'publicar_leccion', { id: l.id, publicada: true })
  // La entrega de Logística no tiene contenido, pero sí ejercicio: se puede publicar.
  const entregaLog = est.lecciones.find((l: any) => l.modulo === 'logistica' && l.ejercicio)
  await admin(page.request, 'publicar_leccion', { id: entregaLog.id, publicada: true })
  // Un tema sin contenido ni ejercicio no se publica.
  const temaVacio = est.lecciones.find((l: any) => l.modulo === 'logistica' && !l.ejercicio)
  const r = await page.request.post('/api/admin/academia', { data: { accion: 'publicar_leccion', id: temaVacio.id, publicada: true } })
  expect(r.status()).toBe(400)

  // Sábados: general para todos y un bloque de Logística.
  const s1 = (await admin(page.request, 'guardar_sesion', { titulo: 'Capacitación general', fecha: '2026-11-14', hora: '08:00', horas: 4, modulos: ['general'] })).resultado
  await admin(page.request, 'guardar_sesion', { titulo: 'Taller de Logística', fecha: '2026-11-21', hora: '09:00', horas: 1.5, modulos: ['logistica'], lugar: 'Oficina Ekosolv' })
  const uid = est.personas.find((p: any) => p.username === PARTICIPANTE.username).id
  await admin(page.request, 'guardar_asistencia', { sesion_id: s1, usuario_ids: [uid] })

  await page.reload()
  await page.locator('.subtab[data-tab=sesiones]').click()
  await expect(page.locator('#sesion-list')).toContainText('1/1 asistieron')
  await page.screenshot({ path: 'test-results/academia-admin-sabados.png', fullPage: true })
})

test('participante: solo entra a la academia', async ({ page }) => {
  const r = await page.request.post('/api/admin/login', { data: { username: PARTICIPANTE.username, password: PARTICIPANTE.password } })
  expect(r.ok()).toBeTruthy()
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/academia$/)
  expect((await page.request.get('/api/admin/users')).status()).toBe(403)
  expect((await page.request.get('/api/admin/academia')).status()).toBe(403)

  await expect(page.getByRole('heading', { name: /Hola, Ana/ })).toBeVisible()
  await expect(page.locator('.ac-modulos')).toContainText('Taller de Logística')
  await expect(page.locator('.ac-cert')).toContainText('falta asistencia a 1 bloque')
  await page.screenshot({ path: 'test-results/academia-inicio.png', fullPage: true })
})

test('participante: estudia, practica con IA y entrega', async ({ page }) => {
  await page.request.post('/api/admin/login', { data: { username: PARTICIPANTE.username, password: PARTICIPANTE.password } })
  await page.goto('/academia')
  await page.getByRole('link', { name: /Cómo pedir/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Cómo pedir/ })).toBeVisible()
  await expect(page.locator('.ac-prompt').first()).toContainText('Contexto:')

  await page.locator('#practica-txt').fill('Resume el auto del cliente y escribe a juan@cliente.co')
  await page.getByRole('button', { name: 'Revisar mi instrucción' }).click()
  await expect(page.locator('#practica-res')).toContainText('Así quedó su instrucción')
  await expect(page.locator('#practica-res .n-falta').first()).toBeVisible()
  await expect(page.locator('#practica-res')).toContainText('Se ocultaron')
  await page.screenshot({ path: 'test-results/academia-practica.png', fullPage: true })

  await page.getByRole('button', { name: /Marcar como vista/ }).click()
  await expect(page).toHaveURL(/\/academia\/leccion\/\d+$/)

  // Entregas: la general y la de Logística.
  for (const nombre of [/Entrega: una tarea real/, /Entrega del taller de Logística/]) {
    await page.goto('/academia')
    await page.getByRole('link', { name: nombre }).click()
    await page.locator('#entrega-form textarea').fill('Usé la plantilla de cuatro partes con un certificado anonimizado y verifiqué los kilos contra el original.')
    await page.locator('#entrega-form [name=enlace]').fill('https://drive.google.com/ejemplo')
    await page.getByRole('button', { name: 'Enviar entrega' }).click()
    await expect(page.locator('.ac-entrega-estado')).toContainText('Por revisar')
  }
  const malo = await page.request.post('/api/academia', { data: { accion: 'entregar', leccion_id: 999999, texto: 'x'.repeat(30) } })
  expect(malo.status()).toBe(404)
})

test('panel: revisar entregas y asistencia completa', async ({ page }) => {
  await entrarAdmin(page)
  await page.goto('/admin/academia?tab=entregas')
  await expect(page.locator('#entrega-list')).toContainText('Ana Ruiz')
  await page.locator('#entrega-list tr[data-fila]').first().click()
  // Devolver sin comentario no se permite.
  await page.getByRole('button', { name: 'Devolver para ajustar' }).click()
  await expect(page.locator('#entrega-err')).toContainText('escriba qué debe ajustar')
  await page.locator('#entrega-form [name=comentario]').fill('Muy bien: verificó las cifras.')
  await page.getByRole('button', { name: 'Aprobar' }).click()
  await expect(page.locator('#entrega-drawer')).toBeHidden()

  const est = await (await page.request.get('/api/admin/academia')).json()
  for (const e of est.entregas.filter((x: any) => x.estado === 'enviada')) await admin(page.request, 'revisar_entrega', { id: e.id, estado: 'aprobada', comentario: '' })
  const uid = est.personas[0].id
  const s2 = est.sesiones.find((s: any) => s.modulos.includes('logistica'))
  await admin(page.request, 'guardar_asistencia', { sesion_id: s2.id, usuario_ids: [uid] })
  await page.goto('/admin/academia')
  await expect(page.locator('#persona-list')).toContainText('Listo para emitir')
})

test('participante: obtiene el certificado y se verifica en público', async ({ page, browser }) => {
  await page.request.post('/api/admin/login', { data: { username: PARTICIPANTE.username, password: PARTICIPANTE.password } })
  await page.goto('/academia/certificado')
  await expect(page.locator('.ac-dip-nombre')).toHaveText('Ana Ruiz')
  await expect(page.locator('.ac-diploma')).toContainText('5,5 horas')
  codigo = (await page.locator('.ac-dip-pie .mono').textContent())!.trim()
  expect(codigo).toMatch(/^EKO-IA-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
  await page.screenshot({ path: 'test-results/academia-certificado.png', fullPage: true })

  // Sin sesión.
  const anon = await browser.newContext()
  const p2 = await anon.newPage()
  await p2.goto(`/verificar/${codigo}`)
  await expect(p2.getByRole('heading', { name: 'Certificado válido' })).toBeVisible()
  await expect(p2.locator('.ac-ver-caja')).toContainText('Taller de Logística')
  const r = await p2.goto('/verificar/EKO-IA-AAAA-AAAA')
  expect(r?.status()).toBe(404)
  await anon.close()
})

test('panel: el certificado queda en Talento humano y se puede revocar', async ({ page }) => {
  await entrarAdmin(page)
  const th = await (await page.request.get('/api/admin/talento')).json()
  const formaciones = th.formaciones.filter((f: any) => f.enlace.includes(codigo))
  expect(formaciones.length).toBe(2)
  await admin(page.request, 'revocar_certificado', { codigo })
  await page.goto(`/verificar/${codigo}`)
  await expect(page.getByRole('heading', { name: 'Certificado revocado' })).toBeVisible()
})
