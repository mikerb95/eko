import { expect, test } from '@playwright/test'

// Banco de recursos (docs/plan-recursos.md): destino del QR de la guía rápida
// impresa. Regla: ningún QR lleva a un login, así que todo se prueba sin sesión.
const AREAS = ['gerencia', 'finanzas', 'operaciones', 'logistica', 'ventas', 'mercadeo']

test('las seis áreas abren sin sesión, con su contenido y sus PDF', async ({ page, request }) => {
  for (const area of AREAS) {
    const r = await page.goto(`/academia/recursos/${area}`)
    expect(r?.status(), area).toBe(200)
    expect(page.url()).not.toContain('/admin/login')
    await expect(page.locator('.instr article').first()).toBeVisible()
    expect(await page.locator('.faq details').count(), area).toBeGreaterThan(10)
    expect(await page.locator('.glosario div').count(), area).toBeGreaterThan(10)
    for (const href of await page.locator('a[download]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) {
      expect((await request.get(href)).status(), href).toBe(200)
    }
  }
})

test('el inicio del banco abre sin sesión y lleva a las seis rutas', async ({ page }) => {
  const r = await page.goto('/academia/recursos')
  expect(r?.status()).toBe(200)
  await expect(page.locator('.rc-rutas a')).toHaveCount(AREAS.length)
  await page.locator('.rc-rutas a', { hasText: 'Finanzas' }).click()
  await expect(page).toHaveURL(/\/academia\/recursos\/finanzas$/)
})

test('un área que no existe lleva al inicio del banco, no a un 404', async ({ page }) => {
  const r = await page.goto('/academia/recursos/no-existe')
  expect(r?.status()).toBe(200)
  await expect(page).toHaveURL(/\/academia\/recursos$/)
})

test('el botón Copiar copia la instrucción', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/academia/recursos/operaciones')
  const primera = page.locator('.instr article').first()
  await primera.getByRole('button', { name: 'Copiar' }).click()
  await expect(primera.getByRole('button', { name: 'Copiada' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await primera.locator('pre').textContent())
})
