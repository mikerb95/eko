import { chromium } from '@playwright/test'
const b = await chromium.launch()
for (const [n,w] of [['pd',1440],['pm',390]]) {
  const p = await b.newPage({ viewport:{width:w,height:900} })
  const errs=[]; p.on('pageerror',e=>errs.push(e.message))
  await p.goto('http://localhost:4321/ia'); await p.waitForTimeout(800)
  await p.locator('#area-ventas details summary').click()
  await p.locator('#programa').screenshot({ path: '/tmp/claude-1000/-home-mike-dev-work-github-com-eko/53c2914a-df57-4259-b9cb-7bf6c1e23b21/scratchpad/'+n+'.png' })
  console.log(n, errs)
}
await b.close()
