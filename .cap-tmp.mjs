import { chromium } from '@playwright/test'
const B='http://localhost:4321'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:1440,height:900} })
await ctx.request.post(B+'/api/admin/login',{data:{username:'admin',password:'ekosolv2026*'},headers:{origin:B}})
const p = await ctx.newPage()
let n=0, errs=[]; ctx.on('request',r=>{ if(r.url().includes('/api/academia/')) n++ }); p.on('pageerror',e=>errs.push(e.message))
await p.goto(B+'/admin/presentaciones')
for (let y=0;y<14000;y+=900){ await p.mouse.wheel(0,900); await p.waitForTimeout(700) }
await p.waitForTimeout(4000); const a=n; await p.waitForTimeout(10000)
console.log('consultas al cargar todo:', a, '| en los 10 s siguientes:', n-a, '| errores:', errs.length)
const p2 = await ctx.newPage(); let m=0; p2.on('request',r=>{ if(r.url().includes('que=resultados')) m++ })
await p2.goto(B+'/academia/taller/5#14.9'); await p2.waitForTimeout(6000); console.log('proyector normal sigue consultando votos:', m)
await b.close()
