import { chromium } from 'playwright'
const out = process.argv[2]
const rutas = process.argv.slice(3)
const b = await chromium.launch()
for (const [name, vp] of [['desk', { width: 1440, height: 900 }], ['movil', { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp, baseURL: 'http://localhost:4399', reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  await p.request.post('/api/admin/login', { data: { username: 'admin', password: 'ekosolv2026*' } })
  for (const r of rutas) {
    const errs = []
    p.removeAllListeners('pageerror'); p.on('pageerror', e => errs.push(e.message))
    const res = await p.goto(r, { waitUntil: 'networkidle' })
    await p.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important}' })
    await p.evaluate(() => document.fonts.ready)
    const info = await p.evaluate(() => {
      const sw = document.documentElement.scrollWidth
      const fam = getComputedStyle(document.querySelector('h1, h2') || document.body).fontFamily
      const ok = document.fonts.check('600 40px "Bricolage Grotesque"')
      return { sw, fam: fam.split(',')[0], ok }
    })
    console.log(name, r, res.status(), JSON.stringify(info), errs.length ? errs : '')
    const slug = r === '/' ? 'home' : r.replace(/\//g, '_')
    await p.screenshot({ path: `${out}/pg-${name}${slug}.png`, fullPage: false })
  }
  await ctx.close()
}
await b.close()
