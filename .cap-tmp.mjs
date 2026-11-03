import { chromium } from '@playwright/test'
const b = await chromium.launch()
for (const [n,w,h] of [['desk',1600,700],['mob',390,800]]) {
  const p = await b.newPage({ viewport:{width:w,height:h} })
  await p.goto('http://localhost:4321/ia'); await p.waitForTimeout(800)
  await p.screenshot({ fullPage: true, path: '/tmp/claude-1000/-home-mike-dev-work-github-com-eko/53c2914a-df57-4259-b9cb-7bf6c1e23b21/scratchpad/'+n+'.png' })
}
await b.close()
