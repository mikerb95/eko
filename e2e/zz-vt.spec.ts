import { test, expect } from '@playwright/test'
test('view transitions', async ({ browser }) => {
  const pg = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage()
  await pg.request.post('/api/admin/login', { data: { username: 'admin', password: 'ekosolv2026*' } })
  await pg.goto('/academia/taller/1#5.3')
  await expect(pg.locator('.tl-escena.activa')).toHaveAttribute('data-escena', 'reglas')
  await pg.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove())
  await pg.waitForTimeout(1500)
  const vts: string[] = []
  await pg.exposeFunction('anotar', (s: string) => vts.push(s))
  await pg.evaluate(() => {
    const o = (document as any).startViewTransition.bind(document)
    ;(document as any).startViewTransition = (fn: any) => { (window as any).anotar(document.documentElement.dataset.tlDir); return o(fn) }
  })
  await pg.keyboard.press('ArrowRight')
  for (const ms of [60, 200, 350]) { await pg.waitForTimeout(ms === 60 ? 60 : 140); await pg.screenshot({ path: `e2e-tmp/vt-${ms}.png` }) }
  await expect(pg.locator('.tl-escena.activa')).toHaveAttribute('data-escena', 'perillas')
  await pg.waitForTimeout(800)
  await pg.keyboard.press('ArrowLeft')
  await pg.waitForTimeout(200)
  await pg.screenshot({ path: 'e2e-tmp/vt-atras.png' })
  await expect(pg.locator('.tl-escena.activa')).toHaveAttribute('data-escena', 'reglas')
  // Clics rápidos: termina en la escena correcta.
  for (let n = 0; n < 6; n++) await pg.keyboard.press('ArrowRight')
  await pg.waitForTimeout(1200)
  console.log('VT', JSON.stringify(vts), await pg.locator('.tl-escena.activa').getAttribute('data-escena'), await pg.locator('.tl-escena.activa').count(), pg.url().split('#')[1])
})
