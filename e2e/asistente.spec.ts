import { expect, test, type Page } from '@playwright/test'

// Recorrido del asistente con el modelo simulado (src/lib/asistente/modeloFalso.ts).
// La cuenta fija `admin` existe sin base (users.ts); las demás se crean aquí.

async function entrar(page: Page, usuario: string, clave: string) {
  const r = await page.request.post('/api/admin/login', { data: { username: usuario, password: clave } })
  expect(r.ok()).toBeTruthy()
  await page.goto('/admin')
}

test.describe.configure({ mode: 'serial' })

test('preguntar: ve los pasos y la respuesta', async ({ page }) => {
  await entrar(page, 'admin', 'ekosolv2026*')
  await expect(page.getByRole('heading', { name: /¿En qué le ayudo\?/ })).toBeVisible()
  await page.getByLabel('Pregunte o busque algo').fill('¿Qué hay pendiente?')
  await page.keyboard.press('Enter')
  await expect(page.locator('.asis-pasos li')).toContainText('Revisando las recolecciones')
  await expect(page.locator('.asis-respuesta')).toContainText('Hay 1 órdenes')
  await expect(page).toHaveURL(/[?&]c=/)
})

test('pedir un cambio: tarjeta con antes y después; aprobar lo guarda', async ({ page }) => {
  await entrar(page, 'admin', 'ekosolv2026*')
  await page.getByLabel('Pregunte o busque algo').fill('pase la orden 1 a programada')
  await page.keyboard.press('Enter')
  const card = page.locator('.asis-card')
  await expect(card).toContainText('REC-2026-0001')
  await expect(card.locator('dd')).toContainText('Programada')
  await page.screenshot({ path: 'test-results/asistente-tarjeta.png', fullPage: true })
  await card.getByRole('button', { name: 'Aprobar y guardar' }).click()
  await expect(card).toContainText('Aprobado y guardado')
  await expect(page.locator('.asis-hecho')).toContainText('REC-2026-0001 actualizada')

  // El panel de siempre lo refleja, y el enlace abre la orden.
  await page.locator('.asis-hecho a').click()
  await expect(page.locator('#order-drawer')).toBeVisible()
})

test('descartar no cambia nada', async ({ page }) => {
  await entrar(page, 'admin', 'ekosolv2026*')
  await page.getByLabel('Pregunte o busque algo').fill('pase la orden 1 a cancelada')
  await page.keyboard.press('Enter')
  const card = page.locator('.asis-card')
  await card.getByRole('button', { name: 'Descartar' }).click()
  await expect(card).toContainText('Descartado')
  const r = await page.request.get('/api/admin/recolecciones?id=1')
  expect((await r.json()).order.status).toBe('programada')
})

test('el buscador encuentra sin IA', async ({ page }) => {
  await entrar(page, 'admin', 'ekosolv2026*')
  await page.getByLabel('Pregunte o busque algo').fill('Acme')
  await expect(page.locator('.asis-resultado')).toContainText('REC-2026-0001')
})

test('solo lectura: consulta, no recibe tarjeta ni ve los límites', async ({ page }) => {
  await entrar(page, 'admin', 'ekosolv2026*')
  const crear = await page.request.post('/api/admin/users', {
    data: { username: 'lucia', name: 'Lucía Ruiz', role: 'lectura', active: true, password: 'clave-larga-123' },
  })
  expect(crear.ok()).toBeTruthy()
  await page.context().clearCookies()

  await entrar(page, 'lucia', 'clave-larga-123')
  await expect(page.locator('.asis-nota')).toContainText('solo consulta')
  await expect(page.locator('.tab[data-tab="ia"]')).toHaveCount(0)
  await page.getByLabel('Pregunte o busque algo').fill('pase la orden 1 a cerrada')
  await page.keyboard.press('Enter')
  await expect(page.locator('.asis-respuesta')).toContainText('Con su rol no puedo')
  await expect(page.locator('.asis-card')).toHaveCount(0)
  expect((await page.request.get('/api/admin/asistente/topes')).status()).toBe(403)
})

test('admin: pestaña de límites y consumo', async ({ page }) => {
  await entrar(page, 'admin', 'ekosolv2026*')
  await page.locator('.tab[data-tab="ia"]').click()
  await expect(page.locator('#ia-topes input[name="empresaUsd"]')).toHaveValue('5')
  await expect(page.locator('#ia-consumo')).toContainText('llamadas a la IA')
  await page.locator('#ia-topes input[name="usuarioUsd"]').fill('2')
  await page.getByRole('button', { name: 'Guardar límites' }).click()
  await expect(page.locator('#ia-topes input[name="usuarioUsd"]')).toHaveValue('2')
  await page.screenshot({ path: 'test-results/asistente-limites.png', fullPage: true })
})

test('en celular la caja y la tarjeta caben sin desplazamiento horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await entrar(page, 'admin', 'ekosolv2026*')
  await page.getByLabel('Pregunte o busque algo').fill('pase la orden 1 a confirmada')
  await page.keyboard.press('Enter')
  await expect(page.locator('.asis-card')).toBeVisible()
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(desborde).toBeLessThanOrEqual(0)
  await page.locator('.asis-card').screenshot({ path: 'test-results/asistente-celular.png' })
})

test('el enlace ?alerta= de cumplimiento lleva a la alerta aunque esté cerrada', async ({ page }) => {
  await entrar(page, 'admin', 'ekosolv2026*')
  await page.goto('/admin/cumplimiento?alerta=2')
  await expect(page.locator('#alerta-filtro')).toHaveValue('')
  const alerta = page.locator('#alerta-2')
  await expect(alerta).toHaveClass(/is-destacada/)
  await expect(alerta).toContainText('Seguimiento atendido')
  await expect(alerta).toBeInViewport()

  // Una alerta abierta no cambia el filtro.
  await page.goto('/admin/cumplimiento?alerta=1')
  await expect(page.locator('#alerta-filtro')).toHaveValue('activas')
  await expect(page.locator('#alerta-1')).toHaveClass(/is-destacada/)

  await page.goto('/admin/cumplimiento?alerta=999')
  await expect(page.locator('.banner-error')).toContainText('No se encontró la alerta 999')
})
