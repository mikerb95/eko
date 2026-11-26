import { chromium } from '@playwright/test'
const B='http://localhost:4321'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:1600,height:900} })
await ctx.request.post(B+'/api/admin/login',{data:{username:'admin',password:'ekosolv2026*'},headers:{origin:B}})
const p = await ctx.newPage()
let errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160))})
const rutas=[]
for (const n of [1,2,5]) rutas.push(`/academia/taller/${n}`,`/academia/taller/${n}/presentador`,`/academia/taller/${n}/control`,`/academia/taller/${n}/resumen`)
rutas.push('/academia/taller/1/entregables','/atajos','/admin/academia','/admin/presentaciones','/admin/presentacion/finanzas','/academia/sala','/pc','/proyector/5','/control/5')
for (const r of rutas){ errs=[]; const resp=await p.goto(B+r,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1500)
  const txt = await p.evaluate(()=>document.title)
  console.log(resp.status(), r, '|', txt, errs.length? ' ERR: '+errs.join(' / '):'') }
// textos clave
await p.goto(B+'/academia/taller/1#16.9'); await p.waitForTimeout(2000)
console.log('t1 inventa:', await p.evaluate(()=>document.querySelector('[data-inventa-sigue]')?.textContent.trim().slice(0,70)))
console.log('t1 botón:', await p.evaluate(()=>document.querySelector('[data-ver-doc]')?.textContent))
await p.goto(B+'/academia/taller/5#11.0'); await p.waitForTimeout(2000)
console.log('t5 botón:', await p.evaluate(()=>document.querySelector('[data-ver-doc]')?.textContent))
await p.click('[data-ver-doc]').catch(e=>console.log('clic',e.message)); await p.waitForTimeout(500)
console.log('t5 botón abierto:', await p.evaluate(()=>document.querySelector('[data-ver-doc]')?.textContent))
await p.goto(B+'/academia/taller/5/resumen'); console.log('resumen kicker:', await p.evaluate(()=>document.querySelector('.kicker')?.textContent))
// recorrido con teclado
errs=[]; await p.goto(B+'/academia/taller/5#1.0'); await p.waitForTimeout(2000)
for (let i=0;i<60;i++){ await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250) }
console.log('tras 60 flechas:', await p.evaluate(()=>location.hash), errs.join(' / '))
await b.close()
