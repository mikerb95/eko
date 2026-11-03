import { expect, test, type Page } from '@playwright/test'

// Diagnóstico de IA por área: abrir la encuesta desde el panel, responderla
// con el enlace como lo haría el equipo y ver el resumen por área.

async function entrar(page: Page) {
  const r = await page.request.post('/api/admin/login', { data: { username: 'admin', password: 'ekosolv2026*' } })
  expect(r.ok()).toBeTruthy()
}

test.describe.configure({ mode: 'serial' })

let enlace = ''

test('sin código válido la encuesta no se muestra', async ({ page }) => {
  await page.goto('/diagnostico-ia?c=inventado')
  await expect(page.getByRole('heading', { name: 'Este enlace no está activo' })).toBeVisible()
  const r = await page.request.post('/api/diagnostico?c=inventado', { data: { nombre: 'X' } })
  expect(r.status()).toBe(403)
})

test('panel: abrir la encuesta crea el enlace', async ({ page }) => {
  await entrar(page)
  await page.goto('/admin/diagnostico')
  await expect(page.getByRole('heading', { name: 'Encuesta sin abrir' })).toBeVisible()
  await page.getByRole('button', { name: 'Abrir encuesta' }).click()
  await expect(page.getByRole('heading', { name: 'Encuesta abierta' })).toBeVisible()
  enlace = await page.locator('#dx-url').inputValue()
  expect(enlace).toMatch(/\/diagnostico-ia\?c=[\w-]+$/)
})

test('equipo: responde la encuesta con el paso de su área', async ({ page }) => {
  await page.goto(new URL(enlace).pathname + new URL(enlace).search)
  const siguiente = () => page.locator('.tf-next').click()
  const activo = page.locator('.tf-step.is-active')

  await activo.getByLabel(/Nombre/).fill('Laura Gómez')
  await activo.getByLabel(/Cargo/).fill('Consultora ambiental')
  await siguiente()

  // Elegir el área avanza solo y muestra las tareas de esa área.
  await activo.getByRole('button', { name: /Ventas/ }).click()
  await expect(activo).toContainText('Pasar un Brief de Zoho CRM a propuesta')
  await expect(activo.locator('.tf-step-count')).toContainText('03 / 09')
  await page.locator('.tf-back').click()
  await expect(activo.locator('.tf-step-count')).toContainText('02 / 09')
  await activo.getByRole('button', { name: /Ventas/ }).click()
  await page.locator('.tf-back').click()
  await activo.getByRole('button', { name: /Operaciones/ }).click()
  await expect(activo).toContainText('Cruzar certificados de recolección y de disposición final')
  await activo.getByRole('button', { name: /Leer autos/ }).click()
  await activo.getByRole('button', { name: /Revisar o preparar ICA/ }).click()
  await page.screenshot({ path: 'test-results/diagnostico-tareas.png', fullPage: true })
  await siguiente()

  await activo.getByRole('button', { name: 'Entre 5 y 10 horas' }).click()
  await activo.getByLabel(/La tarea que más tiempo le quita/).fill('Leer autos de la CAR y pasar los plazos a Excel')
  await siguiente()

  await activo.getByRole('button', { name: /PDF escaneados/ }).click()
  await activo.getByRole('button', { name: 'Zoho WorkDrive' }).click()
  await siguiente()

  await activo.getByRole('button', { name: 'La he probado algunas veces' }).click()
  await activo.getByRole('button', { name: 'ChatGPT' }).click()
  await siguiente()

  await activo.getByRole('button', { name: 'Que invente datos o normas' }).click()
  await siguiente()

  await activo.getByLabel(/La tarea que le gustaría resolver/).fill('Sacar obligaciones y plazos de un auto')
  await activo.getByRole('button', { name: 'Sí, puedo traer uno' }).click()
  await activo.getByLabel(/¿Cuál documento\?/).fill('Auto de seguimiento de la CAR')
  await siguiente()

  await activo.getByRole('button', { name: 'Virtual' }).click()
  await activo.getByLabel(/sábado/).fill('El 21 de noviembre')
  await siguiente()
  await expect(page.locator('.tf-error')).toContainText('autorización')
  await activo.locator('.tf-check').check()
  await siguiente()

  await expect(page.getByRole('heading', { name: 'Gracias, quedó registrado' })).toBeVisible()
})

test('panel: resumen por área y respuesta individual', async ({ page }) => {
  await entrar(page)
  await page.goto('/admin/diagnostico')
  await expect(page.locator('.kpi').first()).toContainText('1')
  await expect(page.locator('.dx-orden li').first()).toContainText('Operaciones')
  await expect(page.locator('.dx-orden li').first()).toContainText('7,5 h')
  const ops = page.locator('.dx-area-card').filter({ hasText: 'Operaciones' })
  await expect(ops).toContainText('Leer autos, resoluciones y requerimientos')
  await expect(ops).toContainText('Sacar obligaciones y plazos de un auto')
  // Lo del paso de Ventas que se vio y se abandonó no quedó guardado.
  await expect(page.locator('.dx-vacia').filter({ hasText: 'Ventas' })).toContainText('sin respuestas todavía')
  await page.screenshot({ path: 'test-results/diagnostico-panel.png', fullPage: true })

  const csv = await page.request.get('/api/admin/diagnostico?formato=csv')
  expect(csv.headers()['content-type']).toContain('text/csv')
  expect(await csv.text()).toContain('Laura Gómez')
})

test('panel: cerrar la encuesta deja el enlace inactivo', async ({ page }) => {
  await entrar(page)
  await page.goto('/admin/diagnostico')
  await page.getByRole('button', { name: 'Cerrar encuesta' }).click()
  await expect(page.getByRole('heading', { name: 'Encuesta cerrada' })).toBeVisible()
  await page.goto(new URL(enlace).pathname + new URL(enlace).search)
  await expect(page.getByRole('heading', { name: 'Este enlace no está activo' })).toBeVisible()
})
