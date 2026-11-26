import { chromium } from '@playwright/test'
const B='http://localhost:4321'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:1440,height:900} })
await ctx.request.post(B+'/api/admin/login',{data:{username:'admin',password:'ekosolv2026*'},headers:{origin:B}})
const p = await ctx.newPage()
let on=false; ctx.on('request',r=>{ if(on && r.url().includes('/api/')) console.log(r.url().replace(B,''), '<-', r.frame()?.url().replace(B,'')) })
await p.goto(B+'/admin/presentaciones')
for (let y=0;y<14000;y+=900){ await p.mouse.wheel(0,900); await p.waitForTimeout(700) }
await p.waitForTimeout(4000); on=true; await p.waitForTimeout(10000)
await b.close()
