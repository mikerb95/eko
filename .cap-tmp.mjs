import { chromium } from 'playwright'
const out = process.argv[2]
const b = await chromium.launch()
for (const [name, vp] of [['desk', { width: 1440, height: 900 }], ['movil', { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp, baseURL: 'http://localhost:4399', reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  const errs = []; p.on('pageerror', e => errs.push(e.message))
  await p.request.post('/api/admin/login', { data: { username: 'admin', password: 'ekosolv2026*' } })
  await p.goto('/oportunidades2630', { waitUntil: 'networkidle' })
  await p.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important}' })
  await p.evaluate(() => document.fonts.ready)
  const h = await p.evaluate(() => document.documentElement.scrollHeight)
  console.log(name, 'sw', await p.evaluate(() => document.documentElement.scrollWidth), 'alto', h, errs)
  await p.locator('#esencial').screenshot({ path: `${out}/n-${name}-esencial.png` })
  await p.locator('.opps').scrollIntoViewIfNeeded()
  await p.locator('.opps').screenshot({ path: `${out}/n-${name}-opps.png` })
  // navegar con el índice
  await p.click('.toc a[data-toc="encaje"]'); await p.waitForTimeout(1200)
  await p.screenshot({ path: `${out}/n-${name}-encaje.png` })
  console.log(name, 'activo', await p.evaluate(() => document.querySelector('.toc a[aria-current]')?.textContent))
  await ctx.close()
}
await b.close()
