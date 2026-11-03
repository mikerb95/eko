import { chromium } from 'playwright'
const out = process.argv[2]
const b = await chromium.launch()
for (const [name, vp] of [['desk', { width: 1440, height: 900 }], ['movil', { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp, baseURL: 'http://localhost:4399', reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', e => errs.push(e.message))
  const r = await p.request.post('/api/admin/login', { data: { username: 'admin', password: 'ekosolv2026*' } })
  console.log('login', r.status())
  await p.goto('/oportunidades2630', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in', 'is-in', 'visible')))
  await p.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important}' })
  const sw = await p.evaluate(() => document.documentElement.scrollWidth)
  console.log(name, 'scrollWidth', sw, 'errores', errs)
  await p.screenshot({ path: `${out}/${name}.png`, fullPage: true })
  for (const sel of ['.pos', '.rivals', '.dont']) {
    const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded()
    await el.screenshot({ path: `${out}/${name}-${sel.slice(1)}.png` })
  }
  await ctx.close()
}
await b.close()
