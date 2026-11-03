import { expect, test, type Page } from '@playwright/test'

// Casos para el taller: el equipo deja archivos y contexto en /ia, el panel
// los muestra por área, los descarga y al final borra todo. Corre con
// CASOS_ALMACEN=local (playwright.config.ts): los archivos van a data/taller.

async function entrar(page: Page) {
  const r = await page.request.post('/api/admin/login', { data: { username: 'admin', password: 'ekosolv2026*' } })
  expect(r.ok()).toBeTruthy()
}

test.describe.configure({ mode: 'serial' })

test('cerrados: /ia avisa y la API rechaza', async ({ page }) => {
  await page.goto('/ia#casos')
  await expect(page.getByRole('heading', { name: 'Pronto podrá dejar sus casos aquí' })).toBeVisible()
  const r = await page.request.put('/api/diagnostico-casos/subir?ruta=taller/0f3a9c2e-1b2c-4d5e/x.pdf', { data: 'x' })
  expect(r.status()).toBe(403)
})

test('panel: abrir la recepción de casos', async ({ page }) => {
  await entrar(page)
  await page.goto('/admin/diagnostico')
  await expect(page.getByRole('heading', { name: 'Casos sin abrir' })).toBeVisible()
  await page.getByRole('button', { name: 'Recibir casos' }).click()
  await expect(page.getByRole('heading', { name: 'Recibiendo casos' })).toBeVisible()
})

test('equipo: deja un caso con dos archivos y luego otro', async ({ page }) => {
  await page.goto('/ia#casos')
  const form = page.locator('#caso-form')
  await expect(form).toBeVisible()

  await form.getByLabel('Su nombre').fill('Laura Gómez')
  await form.getByLabel('Su área').selectOption('logistica')
  await page.locator('#cx-input').setInputFiles([
    { name: 'Recolecciones octubre.xlsx', mimeType: '', buffer: Buffer.from('kilos;gestor\n120;Gestor Uno') },
    { name: 'Certificado gestor.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 prueba') },
  ])
  // Un tipo no aceptado no entra a la lista.
  await page.locator('#cx-input').setInputFiles({ name: 'macro.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') })
  await expect(page.locator('#cx-error')).toContainText('no es un tipo de archivo aceptado')
  await expect(page.locator('.cx-arch.is-listo')).toHaveCount(2)

  // Enviar sin contexto: lo pide.
  await form.getByRole('button', { name: 'Enviar caso' }).click()
  await expect(page.locator('#cx-error')).toContainText('Cuente un poco más')

  await form.getByLabel('¿Qué hace con estos archivos?').fill(
    'Cruzo los kilos del Excel contra el certificado del gestor, reviso en la CAR que su licencia esté vigente y armo el correo al cliente.',
  )
  await form.getByLabel(/Consulta páginas web/).fill('Página de la CAR')
  await form.getByText('Correo o mensaje').click()
  await form.getByText('Tabla o Excel').click()
  await form.getByText('Tiene datos reales de clientes').click()
  await form.getByText(/Autorizo que Ekosolv use estos archivos/).click()
  await page.screenshot({ path: 'test-results/casos-form.png', fullPage: false })
  await form.getByRole('button', { name: 'Enviar caso' }).click()
  await expect(page.getByRole('heading', { name: 'Caso recibido' })).toBeVisible()

  // Otro caso: conserva nombre y área, limpia lo demás.
  await page.getByRole('button', { name: 'Agregar otro caso' }).click()
  await expect(form.getByLabel('Su nombre')).toHaveValue('Laura Gómez')
  await expect(form.getByLabel('Su área')).toHaveValue('logistica')
  await expect(page.locator('.cx-arch')).toHaveCount(0)
  await page.locator('#cx-input').setInputFiles({ name: 'Ruta semanal.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b') })
  await form.getByLabel('¿Qué hace con estos archivos?').fill('Con esta ruta programo las recolecciones de la semana y aviso a cada cliente.')
  await form.getByText('No tiene datos de clientes, o ya los tapé').click()
  await form.getByText(/Autorizo que Ekosolv use estos archivos/).click()
  await form.getByRole('button', { name: 'Enviar caso' }).click()
  await expect(page.getByRole('heading', { name: 'Caso recibido' })).toBeVisible()
})

test('API: no acepta rutas que no se subieron', async ({ page }) => {
  const r = await page.request.post('/api/diagnostico-casos', {
    data: {
      nombre: 'Intruso', area: 'ventas', contexto: 'Un caso con un archivo que nunca se subió al almacén.',
      privacidad: 'sin_datos', consent: 'true', archivos: [{ ruta: 'taller/0f3a9c2e-1b2c-4d5e/fantasma.pdf', nombre: 'fantasma.pdf' }],
    },
  })
  expect(r.status()).toBe(400)
  expect((await r.json()).error).toContain('no terminó de subir')
})

test('panel: ve los casos, descarga un archivo y borra todo', async ({ page }) => {
  await entrar(page)
  await page.goto('/admin/diagnostico#casos')
  const casos = page.locator('.dx-caso')
  await expect(casos).toHaveCount(2)
  const primero = casos.filter({ hasText: '2 archivo(s)' })
  await expect(primero).toContainText('Datos de clientes')
  await primero.locator('summary').click()
  await expect(primero).toContainText('Cruzo los kilos del Excel')
  await expect(primero).toContainText('Tabla o Excel, Correo o mensaje')
  await page.screenshot({ path: 'test-results/casos-panel.png', fullPage: true })

  const enlace = primero.getByRole('link', { name: 'Recolecciones octubre.xlsx' })
  const href = (await enlace.getAttribute('href'))!
  const r = await page.request.get(href)
  expect(r.ok()).toBeTruthy()
  expect(await r.text()).toContain('Gestor Uno')
  expect(r.headers()['content-disposition']).toContain('attachment')

  page.on('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Borrar todos los casos y archivos' }).click()
  await expect(page.getByText('Todavía no hay casos')).toBeVisible()
  expect((await page.request.get(href)).status()).toBe(404)
})

test('sin sesión no se descarga nada', async ({ request }) => {
  const r = await request.get('/api/admin/diagnostico/casos?caso=1&i=0')
  expect([401, 403]).toContain(r.status())
})
