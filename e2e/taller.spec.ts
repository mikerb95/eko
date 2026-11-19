import { expect, test, type Page } from '@playwright/test'

// Capacitación en vivo de punta a punta: quien dicta mueve la presentación
// (proyector y vista de presentador sincronizados), una persona entra a la
// sala desde el celular con nombre, cargo y área (sin contraseña), queda en la
// lista de registrados, responde la evaluación y su voto llega al proyector. La demo con IA cae en la respuesta guardada
// (modelo simulado), y fuera del ancho de proyector la página es un documento.

test.describe.configure({ mode: 'serial' })

const PARTICIPANTE = { username: 'luis.mora', password: 'clave-segura-2', name: 'Luis Mora' }
const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())

async function entrar(page: Page, username: string, password: string) {
  const r = await page.request.post('/api/admin/login', { data: { username, password } })
  expect(r.ok()).toBeTruthy()
}

async function admin(page: Page, accion: string, datos: Record<string, unknown>) {
  const r = await page.request.post('/api/admin/academia', { data: { accion, ...datos } })
  expect(r.ok(), await r.text()).toBeTruthy()
}

test('presentación, sala, votos y asistencia', async ({ browser }) => {
  const ctxAdmin = await browser.newContext({ viewport: { width: 1600, height: 900 } })
  const proyector = await ctxAdmin.newPage()
  await entrar(proyector, 'admin', 'ekosolv2026*')
  await admin(proyector, 'guardar_inscripcion', { area: 'operaciones', crear: PARTICIPANTE })
  await admin(proyector, 'guardar_sesion', { titulo: 'Capacitación general', fecha: hoy, hora: '08:00', horas: 4, modulos: ['general'] })

  // Proyector: modo presentación, una escena a la vez.
  await proyector.goto('/academia/taller/1')
  await expect(proyector.locator('body')).toHaveClass(/tl-on/)
  await expect(proyector.locator('.tl-escena.activa')).toHaveAttribute('data-escena', 'portada')
  await proyector.keyboard.press('ArrowRight')
  await expect(proyector.locator('.tl-escena.activa')).toHaveAttribute('data-escena', 'sala')
  await expect(proyector).toHaveURL(/#2\.0$/)

  // Vista de presentador: se sincroniza al abrir y mueve el proyector.
  const presentador = await ctxAdmin.newPage()
  await presentador.goto('/academia/taller/1/presentador')
  await expect(presentador.locator('[data-titulo]')).toHaveText(/Saque el celular/)
  await presentador.getByRole('button', { name: 'Siguiente →' }).click()
  await expect(proyector.locator('.tl-escena.activa')).toHaveAttribute('data-escena', 'pre')
  await expect(presentador.locator('[data-notas] li').first()).toContainText('No es un examen')

  // Celular: el QR abre la sala sin usuario ni contraseña. Nombres y
  // apellidos quedan con mayúscula inicial mientras se escriben.
  const ctxCel = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const cel = await ctxCel.newPage()
  await cel.goto('/academia/sala')
  await expect(cel).toHaveURL(/\/academia\/sala$/)
  await expect(cel.getByRole('heading', { name: 'Antes de empezar, ¿quién es usted?' })).toBeVisible()
  await cel.getByRole('button', { name: 'Entrar a la sala' }).click()
  await expect(cel.locator('[data-sl-estado]')).toHaveText('Escriba su nombre.')
  await cel.getByLabel('Nombres').pressSequentially('luis')
  await expect(cel.getByLabel('Nombres')).toHaveValue('Luis')
  await cel.getByLabel('Apellidos').pressSequentially('MORA')
  await expect(cel.getByLabel('Apellidos')).toHaveValue('Mora')
  await cel.getByLabel('Cargo').fill('Coordinador de operaciones')
  await cel.getByLabel('Área').selectOption('operaciones')
  await cel.screenshot({ path: 'test-results/taller-registro-celular.png', fullPage: true })
  expect(await cel.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await cel.getByRole('button', { name: 'Entrar a la sala' }).click()

  await expect(cel.locator('[data-sl-kicker]')).toHaveText('Asistencia registrada · Luis Mora')
  await expect(cel.getByRole('heading', { name: 'Antes de empezar: cinco preguntas' })).toBeVisible()
  const op = cel.locator('[data-pregunta="e1"] [data-op="b"]')
  await op.click()
  await expect(op).toHaveAttribute('aria-pressed', 'true')
  await cel.screenshot({ path: 'test-results/taller-sala-celular.png', fullPage: true })

  // El voto y el registro llegan al proyector y al presentador. Como el
  // nombre coincide con una cuenta inscrita, también queda su asistencia.
  await proyector.bringToFront()
  await expect(proyector.locator('.activa [data-respondieron]')).toHaveText('1', { timeout: 8000 })
  const panel = await (await proyector.request.get('/api/academia/taller?que=panel&n=1')).json()
  expect(panel).toMatchObject({ sala: 1, asistentes: 1, lista: [{ nombre: 'Luis Mora', cargo: 'Coordinador de operaciones', area: 'Operaciones', cuenta: true }] })

  // Registrarse otra vez con el mismo nombre (otro celular) no duplica.
  const otro = await browser.newContext()
  const r2 = await otro.request.post('/api/academia/sala', { data: { accion: 'registrar', nombre: 'LUIS', apellido: 'mora', cargo: 'Coordinador', area: 'operaciones' } })
  expect(r2.ok()).toBeTruthy()
  expect((await (await proyector.request.get('/api/academia/taller?que=panel&n=1')).json()).asistentes).toBe(1)
  // Ese segundo celular queda con el mismo registro: su voto reemplaza, no suma.
  expect((await otro.request.post('/api/academia/sala', { data: { accion: 'votar', interaccion: 'pre', pregunta: 'e1', valor: 'b' } })).status()).toBe(200)
  await otro.close()
  await expect(proyector.locator('.activa [data-respondieron]')).toHaveText('1')
  // Sin registro no se vota, y el pase de la sala no abre nada más.
  const anonimo = await browser.newContext()
  expect((await anonimo.request.post('/api/academia/sala', { data: { accion: 'votar', interaccion: 'pre', pregunta: 'e1', valor: 'b' } })).status()).toBe(401)
  await anonimo.close()
  const cerrada = await cel.request.post('/api/academia/sala', { data: { accion: 'votar', interaccion: 'post', pregunta: 'e1', valor: 'b' } })
  expect(cerrada.status()).toBe(409)
  expect((await cel.request.get('/api/academia/taller?que=resultados&n=1&i=pre')).status()).toBe(401)
  await cel.goto('/academia/taller/1')
  await expect(cel).toHaveURL(/\/admin\/login/)

  // Una cuenta de la academia tampoco ve la presentación mientras está en
  // curso (tiene las respuestas) ni puede moverla o usar la IA.
  const ctxPart = await browser.newContext()
  const part = await ctxPart.newPage()
  await entrar(part, PARTICIPANTE.username, PARTICIPANTE.password)
  await part.goto('/academia/taller/1')
  await expect(part.getByRole('heading', { name: 'La capacitación está en curso' })).toBeVisible()
  expect((await part.request.post('/api/academia/taller', { data: { accion: 'estado', taller: 1, escena: 'portada' } })).status()).toBe(403)
  expect((await part.request.post('/api/academia/taller', { data: { accion: 'ia', taller: 1, demo: 'auto', version: 'v1' } })).status()).toBe(403)
  await ctxPart.close()

  // Ningún QR de la presentación lleva a un login: se abren sin sesión.
  const urlsQr = await proyector.$$eval('.qr[aria-label]', (els) => [...new Set(els.map((e) => e.getAttribute('aria-label')!.replace('Código QR de ', '')))])
  expect(urlsQr.length).toBeGreaterThanOrEqual(2)
  const sinSesion = await browser.newContext()
  for (const u of urlsQr) {
    const pg = await sinSesion.newPage()
    await pg.goto(new URL(u).pathname)
    expect(pg.url(), u).not.toContain('/admin/login')
    await pg.close()
  }
  await sinSesion.close()

  // Ejemplo del área en el celular según la escena, y preguntas a quien dicta.
  await proyector.request.post('/api/academia/taller', { data: { accion: 'estado', taller: 1, escena: 'tokens' } })
  await cel.goto('/academia/sala')
  await expect(cel.locator('[data-sl-ej-area]')).toHaveText('En Operaciones', { timeout: 8000 })
  await expect(cel.locator('[data-sl-ej-titulo]')).toHaveText('Un auto de 40 páginas')
  await expect(cel.locator("[data-sl-titulo]")).toHaveText("La IA no lee letras ni palabras: lee tokens")
  await cel.getByLabel('¿Tiene una pregunta?').fill('¿Un auto escaneado también se parte en tokens?')
  await cel.getByRole('button', { name: 'Enviar pregunta' }).click()
  await expect(cel.locator('[data-sl-duda-estado]')).toHaveText('Enviada. Quien dicta la ve en su pantalla.')
  expect(await cel.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await cel.screenshot({ path: 'test-results/taller-ejemplo-celular.png', fullPage: true })
  await proyector.request.post('/api/academia/taller', { data: { accion: 'estado', taller: 1, escena: 'metodo' } })
  await expect(cel.locator('[data-sl-ej-titulo]')).toHaveText('Las cuatro partes en su trabajo', { timeout: 8000 })
  await expect(cel.locator('[data-sl-titulo]')).toHaveText('Una buena instrucción tiene cuatro partes')
  await presentador.bringToFront()
  const duda = presentador.locator('[data-dudas] li').first()
  await expect(duda).toContainText('¿Un auto escaneado también se parte en tokens?', { timeout: 8000 })
  await expect(duda).toContainText('Luis Mora · Operaciones · en "La IA no lee letras ni palabras: lee tokens"')
  await expect(presentador.locator('[data-n-dudas]')).toHaveText('1')
  await presentador.screenshot({ path: 'test-results/taller-dudas-presentador.png' })
  await duda.getByRole('button', { name: 'Respondida' }).click()
  await expect(presentador.locator('[data-dudas] li')).toHaveCount(0)
  await expect(presentador.locator('[data-n-dudas]')).toHaveText('0')
  expect((await (await proyector.request.get('/api/academia/taller?que=panel&n=1')).json()).preguntas).toEqual([])

  // Práctica guiada: en esa escena la sala del celular es el revisor.
  await proyector.request.post('/api/academia/taller', { data: { accion: 'estado', taller: 1, escena: 'practica' } })
  await cel.goto('/academia/sala')
  await expect(cel.getByRole('heading', { name: 'Revise su instrucción' })).toBeVisible({ timeout: 8000 })
  await cel.getByLabel('Su instrucción').fill('Soy analista de Ekosolv. Resume este certificado en una tabla con fecha y gestor.')
  await cel.getByRole('button', { name: 'Revisar mi instrucción' }).click()
  await expect(cel.locator('.ac-revision')).toContainText('Así quedó su instrucción')
  await cel.screenshot({ path: 'test-results/taller-practica-celular.png', fullPage: true })

  // Demo con IA: con el modelo simulado sale la respuesta guardada, marcada.
  const constructor = await proyector.$$eval('.tl-escena', (els) => els.findIndex((e) => (e as HTMLElement).dataset.escena === 'constructor') + 1)
  await proyector.goto(`/academia/taller/1#${constructor}.0`)
  await proyector.reload()
  await expect(proyector.locator('.tl-escena.activa')).toHaveAttribute('data-escena', 'constructor')
  await expect(proyector.locator('.activa [data-fuente]')).toHaveText('Sin respuesta todavía')
  await proyector.getByRole('button', { name: 'Preguntarle a Claude' }).click()
  await expect(proyector.locator('.activa [data-fuente]')).toHaveText('Respuesta guardada')
  await expect(proyector.locator('.activa [data-texto-ia]')).toContainText('Planta de Ejemplo')
  await proyector.keyboard.press('ArrowRight')
  await expect(proyector.locator('.activa [data-instr="1"]')).toBeVisible()
  await expect(proyector.locator('.activa [data-fuente]')).toHaveText('Sin respuesta todavía')
  await proyector.screenshot({ path: 'test-results/taller-constructor.png' })

  // La tarjeta resumen.
  await proyector.goto('/academia/taller/1/resumen')
  await expect(proyector.getByRole('heading', { name: 'Inteligencia artificial, por dentro' })).toBeVisible()

  await ctxCel.close()
  await ctxAdmin.close()
})

test('en pantalla angosta la presentación es un documento completo', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await entrar(page, 'admin', 'ekosolv2026*')
  await page.goto('/academia/taller/1')
  await expect(page.locator('body')).not.toHaveClass(/tl-on/)
  await expect(page.locator('.pend')).toHaveCount(0)
  await expect(page.locator('#escena-semaforo')).toBeVisible()
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(ancho).toBeLessThanOrEqual(390)
  await ctx.close()
})
