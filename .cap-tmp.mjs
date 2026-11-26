import { chromium } from '@playwright/test'
const B='http://localhost:4321'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:1440,height:900} })
await ctx.request.post(B+'/api/admin/login',{data:{username:'admin',password:'ekosolv2026*'},headers:{origin:B}})
const p = await ctx.newPage()
let on=false,n=0; ctx.on('request',r=>{ if(on && r.url().includes('/api/')) n++ })
await p.goto(B+'/admin/presentaciones')
for (let y=0;y<14000;y+=900){ await p.mouse.wheel(0,900); await p.waitForTimeout(700) }
await p.waitForTimeout(20000); on=true; await p.waitForTimeout(20000)
console.log('consultas en 20 s con todo cargado:', n)
await b.close()
