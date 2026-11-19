import { test } from '@playwright/test'
import { TALLER_1 } from '../src/lib/talleres/taller1'
test('capturas celular', async ({ browser }) => {
  test.setTimeout(300_000)
  const a = await (await browser.newContext()).newPage()
  await a.request.post('/api/admin/login', { data: { username: 'admin', password: 'ekosolv2026*' } })
  await a.request.post('/api/academia/taller', { data: { accion: 'estado', taller: 1, escena: 'portada' } })
  const cel = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage()
  await cel.request.post('/api/academia/sala', { data: { accion: 'registrar', nombre: 'Ana', apellido: 'Ruiz', cargo: 'Analista', area: 'logistica' } })
  let k = 0
  for (const e of TALLER_1.escenas) {
    k++
    await a.request.post('/api/academia/taller', { data: { accion: 'estado', taller: 1, escena: e.id } })
    await cel.goto('/academia/sala')
    await cel.waitForTimeout(1500)
    await cel.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove())
    await cel.screenshot({ path: `e2e-tmp/${String(k).padStart(2, '0')}-${e.id}.png`, fullPage: true })
  }
})
