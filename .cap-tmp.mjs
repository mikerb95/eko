import { chromium } from '@playwright/test'
const b = await chromium.launch()
let p = await b.newPage({ viewport:{width:1440,height:900} })
await p.goto('http://localhost:4321/ia'); await p.waitForTimeout(800)
await p.locator('#area-general').screenshot({ path: '/tmp/claude-1000/-home-mike-dev-work-github-com-eko/53c2914a-df57-4259-b9cb-7bf6c1e23b21/scratchpad/gen.png' })
p = await b.newPage({ viewport:{width:390,height:900} })
await p.goto('http://localhost:4321/ia'); await p.waitForTimeout(800)
await p.locator('#programa').screenshot({ path: '/tmp/claude-1000/-home-mike-dev-work-github-com-eko/53c2914a-df57-4259-b9cb-7bf6c1e23b21/scratchpad/pm.png' })
await b.close()
