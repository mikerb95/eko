import { chromium } from 'playwright'
const out = process.argv[2]
const base = `h1,h2,h3,h4,.display,.rival-name,.line-role,.caps .v,.stat .n,.dont-t,.rival-msg{font-weight:600!important;letter-spacing:-0.03em!important}
  em,.rival-msg{font-style:normal!important}
  h1 em,h2 em{color:var(--forest)!important}`
const opciones = {
  actual: '/* actual */',
  a_geist: `:root{--font-display:"Geist",sans-serif}` + base,
  b_bricolage: `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&display=swap');:root{--font-display:"Bricolage Grotesque",sans-serif}` + base,
  c_schibsted: `@import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400..800&display=swap');:root{--font-display:"Schibsted Grotesk",sans-serif}` + base,
}
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, baseURL: 'http://localhost:4399' })
const p = await ctx.newPage()
await p.request.post('/api/admin/login', { data: { username: 'admin', password: 'ekosolv2026*' } })
await p.goto('/oportunidades2630', { waitUntil: 'networkidle' })
await p.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important}' })
let tag = null
for (const [n, css] of Object.entries(opciones)) {
  if (tag) await tag.evaluate(e => e.remove())
  tag = await p.addStyleTag({ content: css })
  await p.waitForTimeout(1500)
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.locator('.page-head').screenshot({ path: `${out}/f-${n}-hero.png` })
  await p.locator('.rival').first().scrollIntoViewIfNeeded()
  await p.locator('.rival').first().screenshot({ path: `${out}/f-${n}-card.png` })
}
await b.close()
