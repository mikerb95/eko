import { chromium } from '@playwright/test'
const B='http://localhost:4321'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:1440,height:900} })
await ctx.request.post(B+'/api/admin/login',{data:{username:'admin',password:'ekosolv2026*'},headers:{origin:B}})
const p = await ctx.newPage()
const errs=[]; p.on('pageerror',e=>errs.push(e.message))
await p.goto(B+'/admin/presentaciones'); await p.waitForTimeout(9000)
await p.screenshot({path:'/tmp/claude-1000/-home-mike-dev-work-github-com-eko/8ad77e49-3c33-4191-aaf9-9d009624caa2/scratchpad/mesa1.png'})
await p.goto(B+'/admin/presentaciones#finanzas'); await p.waitForTimeout(9000)
await p.screenshot({path:'/tmp/claude-1000/-home-mike-dev-work-github-com-eko/8ad77e49-3c33-4191-aaf9-9d009624caa2/scratchpad/mesa2.png'})
console.log(errs.join('\n'))
await b.close()
