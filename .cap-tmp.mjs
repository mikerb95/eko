import { chromium } from '@playwright/test'
const S = process.argv[2]
const b = await chromium.launch()
const errores = []
for (const [nombre, vp] of [['desk', { width: 1366, height: 860 }], ['movil', { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp })
  p.on('console', (m) => m.type() === 'error' && errores.push(`${nombre}: ${m.text()}`))
  p.on('pageerror', (e) => errores.push(`${nombre}: ${e.message}`))
  await p.goto('http://localhost:4331/propuesta', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove()); await p.waitForTimeout(800)
  await p.screenshot({ path: `${S}/${nombre}-full.png`, fullPage: true })
  const ancho = await p.evaluate(() => document.documentElement.scrollWidth)
  console.log(nombre, 'scrollWidth', ancho)
  // simulador
  await p.click('input[name="plan"][value="p40"]', { force: true })
  await p.click('input[name="cap"][value="s5"]', { force: true })
  await p.locator('#simulador').scrollIntoViewIfNeeded()
  await p.waitForTimeout(400)
  await p.locator('#simulador').screenshot({ path: `${S}/${nombre}-sim.png` })
  // chat
  await p.click('.pp-fab')
  await p.waitForTimeout(300)
  await p.click('[data-sugerida] >> nth=1')
  await p.waitForTimeout(1500)
  await p.fill('[data-chat-form] textarea', '¿Me pueden hacer un descuento?')
  await p.keyboard.press('Enter')
  await p.waitForTimeout(1500)
  await p.screenshot({ path: `${S}/${nombre}-chat.png` })
  await p.close()
}
console.log('errores', errores)
await b.close()
