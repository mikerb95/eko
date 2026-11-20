import { expect, test, type Page } from '@playwright/test'
import { TALLER_1 } from '../src/lib/talleres/taller1'

// PC vinculado y práctica guiada de Zoho (docs/ideas-talleres.md, idea 1):
// quien dicta llega a la escena de Zoho; el participante, ya en la sala del
// celular, pide "Abrir en mi PC", escribe en /pc el código de dos números y
// el PC queda siguiendo la escena y el paso. El celular muestra cada paso con
// su maqueta. El código sirve una sola vez y el PC no puede votar.

const ZOHO = TALLER_1.escenas.findIndex((e) => e.id === 'zoho')

async function entrar(page: Page, username: string, password: string) {
  const r = await page.request.post('/api/admin/login', { data: { username, password } })
  expect(r.ok()).toBeTruthy()
}

test('PC vinculado con el código del celular sigue la práctica guiada', async ({ browser }) => {
  test.setTimeout(240_000)
  const ctxAdmin = await browser.newContext({ viewport: { width: 1600, height: 900 } })
  const proyector = await ctxAdmin.newPage()
  await entrar(proyector, 'admin', 'ekosolv2026*')
  await proyector.goto(`/academia/taller/1#${ZOHO + 1}.0`)
  await expect(proyector.locator('.tl-escena.activa')).toHaveAttribute('data-escena', 'zoho')
  await expect(proyector.locator('.activa .cx-paso.actual')).toHaveAttribute('data-cx-k', '0')
  await proyector.waitForTimeout(1500)
  await proyector.screenshot({ path: 'test-results/zoho-proyector-0.png' })

  // Celular: registro (en desarrollo el enlace vuelve en la respuesta).
  const ctxCel = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const cel = await ctxCel.newPage()
  const r = await cel.request.post('/api/academia/sala', { data: { accion: 'registrar', nombre: 'Ana', apellido: 'Rojas', correo: 'ana.rojas@ekosolv.com', area: 'logistica' } })
  expect(r.ok(), await r.text()).toBeTruthy()
  await cel.goto((await r.json()).enlace)
  await expect(cel.locator('[data-sl-escena]')).toHaveText('Práctica final · antes de empezar')
  await expect(cel.locator('.sl-guia .mq-objetivo')).toBeVisible()

  // Abrir en mi PC: código de dos números.
  await cel.getByRole('button', { name: 'Abrir en mi PC' }).click()
  const codigo = cel.locator('[data-sl-pc-codigo]')
  await expect(codigo).toHaveText(/^\d{2}$/)
  await expect(cel.locator('[data-sl-pc-vence]')).toContainText('Sirve una vez')
  await cel.waitForTimeout(1200)
  await cel.screenshot({ path: 'test-results/zoho-celular-0.png', fullPage: true })
  expect(await cel.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  const numero = (await codigo.textContent())!

  // PC: sin cuenta, la presentación pide login; con el código, abre y sigue.
  const ctxPC = await browser.newContext({ viewport: { width: 1440, height: 810 } })
  const pc = await ctxPC.newPage()
  await pc.goto('/academia/taller/1')
  await expect(pc).toHaveURL(/\/admin\/login/)
  await pc.goto('/pc')
  const otro = numero === '10' ? '11' : '10'
  await pc.getByLabel('Código').fill(otro)
  await expect(pc.locator('[data-pc-estado]')).toContainText('no sirve')
  await pc.getByLabel('Código').fill(numero)
  await expect(pc).toHaveURL(/\/academia\/taller\/1/)
  await expect(pc.locator('.tl-escena.activa')).toHaveAttribute('data-escena', 'zoho', { timeout: 8000 })
  // El celular se entera de que el código ya se usó.
  await expect(cel.locator('[data-sl-pc-vence]')).toContainText('su PC ya quedó abierto', { timeout: 8000 })
  await expect(cel.getByRole('button', { name: 'Abrir en otro PC' })).toBeVisible()
  // El código ya se usó.
  const ctxPC2 = await browser.newContext()
  expect((await ctxPC2.request.post('/api/academia/pc', { data: { codigo: numero } })).status()).toBe(400)
  await ctxPC2.close()
  // El PC no vota ni pregunta: su pase vive en otra cookie.
  expect((await pc.request.post('/api/academia/sala', { data: { accion: 'preguntar', texto: 'Hola desde el PC' } })).status()).toBe(401)
  // El teclado del PC no mueve nada.
  await pc.keyboard.press('ArrowRight')
  await expect(pc.locator('.activa .cx-paso.actual')).toHaveAttribute('data-cx-k', '0')

  // Quien dicta avanza: el celular y el PC siguen el paso.
  for (let k = 1; k <= 9; k++) {
    await proyector.bringToFront()
    await proyector.keyboard.press('ArrowRight')
    await expect(proyector.locator('.activa .cx-paso.actual')).toHaveAttribute('data-cx-k', String(k))
    await expect(cel.locator('[data-sl-escena]')).toContainText(`Paso ${k} de 9`, { timeout: 8000 })
    await expect(pc.locator('.activa .cx-paso.actual')).toHaveAttribute('data-cx-k', String(k), { timeout: 8000 })
    await proyector.waitForTimeout(2600)
    await proyector.screenshot({ path: `test-results/zoho-proyector-${k}.png` })
    await cel.waitForTimeout(400)
    await cel.screenshot({ path: `test-results/zoho-celular-${k}.png`, fullPage: true })
  }
  await pc.screenshot({ path: 'test-results/zoho-pc-9.png' })
  await ctxAdmin.close()
  await ctxCel.close()
  await ctxPC.close()
})
