import { chromium } from 'playwright'
const b = await chromium.launch()
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const p = await (await b.newContext({ viewport: vp, baseURL: 'http://localhost:4399' })).newPage()
  await p.request.post('/api/admin/login', { data: { username: 'admin', password: 'ekosolv2026*' } })
  for (const r of ['/', '/servicios', '/oportunidades2630', '/docs']) {
    const errs = []; p.removeAllListeners('pageerror'); p.on('pageerror', e => errs.push(e.message))
    await p.goto(r, { waitUntil: 'networkidle' })
    await p.mouse.wheel(0, 4000); await p.waitForTimeout(900)
    const info = await p.evaluate(() => ({
      nav: Math.round(document.getElementById('nav').getBoundingClientRect().top),
      toc: document.querySelector('.toc') ? Math.round(document.querySelector('.toc').getBoundingClientRect().top) : null,
      sw: document.documentElement.scrollWidth,
    }))
    console.log(vp.width, r, JSON.stringify(info), errs)
  }
}
await b.close()
