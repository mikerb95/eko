// Genera los PDF de las hojas impresas de una capacitación (checklist y guía
// rápida por área) desde la vista previa /academia/taller/<n>/entregables, y
// los deja en public/recursos/, de donde los descarga el banco de recursos.
// Volver a correrlo cada vez que cambie src/lib/talleres/entregables<n>.ts.
//
// Uso (con el servidor de desarrollo corriendo):
//   BASE=http://localhost:4321 ADMIN_USER=admin ADMIN_PASS=... node scripts/entregables-pdf.mjs 1
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const n = Number(process.argv[2] || 1)
const BASE = (process.env.BASE || 'http://localhost:4321').replace(/\/$/, '')
const { ADMIN_USER, ADMIN_PASS } = process.env
if (!ADMIN_USER || !ADMIN_PASS) {
  console.error('Faltan ADMIN_USER y ADMIN_PASS (la vista previa es solo para admin).')
  process.exit(1)
}

const salida = new URL('../public/recursos/', import.meta.url)
await mkdir(salida, { recursive: true })

const navegador = await chromium.launch()
const pagina = await navegador.newPage()
const login = await pagina.request.post(`${BASE}/api/admin/login`, { data: { username: ADMIN_USER, password: ADMIN_PASS }, headers: { origin: BASE } })
if (!login.ok()) throw new Error(`No se pudo entrar como admin (${login.status()})`)

await pagina.goto(`${BASE}/academia/taller/${n}/entregables`, { waitUntil: 'networkidle' })
await pagina.evaluate(() => document.fonts.ready)
const areas = await pagina.$$eval('section.area', (s) => s.map((x) => x.dataset.area))

for (const area of areas) {
  for (const hoja of ['checklist', 'guia']) {
    await pagina.evaluate(
      ([a, h]) => {
        document.body.classList.remove('todas')
        document.querySelectorAll('section.area').forEach((s) => s.classList.toggle('activa', s.dataset.area === a))
        document.body.classList.toggle('solo-checklist', h === 'checklist')
        document.body.classList.toggle('solo-guia', h === 'guia')
      },
      [area, hoja],
    )
    const archivo = new URL(`taller${n}-${area}-${hoja}.pdf`, salida)
    await pagina.pdf({ path: archivo.pathname, preferCSSPageSize: true, printBackground: true })
    console.log('✓', archivo.pathname.split('/public/')[1])
  }
}
await navegador.close()
