import { expect, test } from '@playwright/test'
import { TALLER_1 } from '../src/lib/talleres/taller1'
import { camposOpinion } from '../src/lib/talleres/opinion'

// Formulario de cierre por área (src/lib/talleres/opinion.ts): cuando quien
// dicta llega a la última escena, el celular pasa solo al formulario de su
// área, con una sugerencia en cada campo. Lo enviado aparece en el panel
// (/admin/academia, pestaña Opiniones), donde se anota cómo se resolvió la
// duda. Va de último (zz-) porque deja registros en la base de la corrida.

const ULTIMA = TALLER_1.escenas.length

test('al final de la presentación cada celular va al formulario de su área', async ({ browser }) => {
  const ctxAdmin = await browser.newContext({ viewport: { width: 1600, height: 900 } })
  const proyector = await ctxAdmin.newPage()
  expect((await proyector.request.post('/api/admin/login', { data: { username: 'admin', password: 'ekosolv2026*' } })).ok()).toBeTruthy()
  // Antes del final, el celular se queda en la sala.
  await proyector.goto(`/academia/taller/1#${ULTIMA - 1}.0`)
  await expect(proyector.locator('.tl-escena.activa')).toHaveAttribute('data-escena', TALLER_1.escenas[ULTIMA - 2]!.id)

  const ctxCel = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const cel = await ctxCel.newPage()
  const r = await cel.request.post('/api/academia/sala', { data: { accion: 'registrar', nombre: 'Marta', apellido: 'Díaz', correo: 'marta.diaz@ekosolv.com', area: 'finanzas' } })
  expect(r.ok(), await r.text()).toBeTruthy()
  await cel.goto((await r.json()).enlace)
  await expect(cel).toHaveURL(/\/academia\/sala$/)
  await expect(cel.locator('[data-sl-kicker]')).toContainText('Marta Díaz')

  // Última escena: el celular cambia solo al formulario de Finanzas.
  await proyector.keyboard.press('ArrowRight')
  await expect(proyector.locator('.tl-escena.activa')).toHaveAttribute('data-escena', 'cierre')
  await expect(cel).toHaveURL(/\/academia\/sala\/opinion$/, { timeout: 10_000 })
  await expect(cel.getByRole('heading', { name: '¿Cómo le fue hoy?' })).toBeVisible()
  await expect(cel.locator('.sl-quien')).toContainText('Finanzas')
  for (const c of camposOpinion('finanzas', 1)) {
    await expect(cel.getByLabel(c.pregunta)).toHaveAttribute('placeholder', c.sugerencia)
  }
  await expect(cel.getByLabel('¿Qué le gustaría ver o solucionar en la siguiente capacitación?')).toBeVisible()
  expect(await cel.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await cel.screenshot({ path: 'test-results/cierre-formulario.png', fullPage: true })

  await cel.getByRole('button', { name: 'Enviar' }).click()
  await expect(cel.locator('[data-op-estado]')).toHaveText('Responda al menos una pregunta.')
  await cel.getByLabel('¿Qué duda le quedó sin resolver?').fill('No me quedó claro qué datos de nómina puedo pegar.')
  await cel.getByLabel('¿Qué le gustaría ver o solucionar en la siguiente capacitación?').fill('Revisar la nómina de Siigo Nube con la IA.')
  await cel.getByRole('button', { name: 'Enviar' }).click()
  await expect(cel.getByRole('heading', { name: 'Gracias' })).toBeVisible()
  await expect(cel.getByRole('link', { name: 'Ver la tarjeta resumen' })).toHaveAttribute('href', '/academia/taller/1/resumen')
  await cel.screenshot({ path: 'test-results/cierre-gracias.png', fullPage: true })

  // Ya enviado: volver a la sala no lo devuelve al formulario.
  await cel.goto('/academia/sala')
  await cel.waitForTimeout(3000)
  await expect(cel).toHaveURL(/\/academia\/sala$/)
  // Y el formulario lo muestra con lo que escribió, para corregirlo.
  await cel.goto('/academia/sala/opinion')
  await cel.getByRole('button', { name: 'Corregir mis respuestas' }).click()
  await expect(cel.getByLabel('¿Qué duda le quedó sin resolver?')).toHaveValue('No me quedó claro qué datos de nómina puedo pegar.')

  // Sin registro, el formulario manda a la sala.
  const anonimo = await browser.newContext()
  const a = await anonimo.newPage()
  await a.goto('/academia/sala/opinion')
  await expect(a.getByRole('heading', { name: 'Primero, entre a la sala' })).toBeVisible()
  expect((await a.request.post('/api/academia/sala', { data: { accion: 'opinion', respuestas: { duda: 'x' } } })).status()).toBe(401)
  await anonimo.close()

  // Panel: la opinión aparece con nombre y área, y se anota la resolución.
  const panel = await ctxAdmin.newPage()
  await panel.goto('/admin/academia')
  await panel.getByRole('button', { name: /Opiniones/ }).click()
  const tarjeta = panel.locator('.ac-opinion', { hasText: 'Marta Díaz' })
  await expect(tarjeta).toContainText('Finanzas · Capacitación 1')
  await expect(tarjeta).toContainText('Revisar la nómina de Siigo Nube con la IA.')
  await expect(tarjeta.locator('.pill')).toHaveText('Duda pendiente')
  await tarjeta.getByLabel('Cómo se resolvió la duda').fill('Se le explicó en la capacitación 2 con la cuenta de Ekosolv.')
  await tarjeta.getByRole('button', { name: 'Guardar' }).click()
  await expect(tarjeta.locator('.pill')).toHaveText('Duda resuelta')
  await panel.reload()
  await panel.getByRole('button', { name: /Opiniones/ }).click()
  await expect(panel.locator('.ac-opinion', { hasText: 'Marta Díaz' })).toContainText('Resuelta el')
  await panel.screenshot({ path: 'test-results/cierre-panel.png', fullPage: true })
  // Fuera del panel nadie más lo lee.
  const ajeno = await browser.newContext()
  expect((await ajeno.request.post('/api/admin/academia', { data: { accion: 'resolver_opinion', id: 1, resolucion: 'x' } })).status()).toBeGreaterThanOrEqual(401)
  await ajeno.close()
})
