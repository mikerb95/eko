import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcular, cifrasPermitidas, combinaciones, pesos } from './datos.ts'
import { conocimiento, mensajesApi, pulirSalida, systemPrompt, validarEntradaChat } from './ia.ts'

test('calcular: plan de 20 con 4 sábados lleva precio especial', () => {
  const k = calcular({ plan: 'p20', capacitacion: 's4' })
  assert.equal(k.mensual, 1_185_000)
  assert.equal(k.mensualDespues, 785_000)
  assert.equal(k.valorCapacitacion, 1_200_000)
  assert.equal(k.ahorroCapacitacion, 480_000)
  assert.equal(k.alFirmar, 500_000 + 600_000)
  assert.equal(k.totalAutomatizacion18, 500_000 + 1_185_000 * 18)
  assert.equal(k.total18, 500_000 + 1_185_000 * 18 + 1_200_000)
})

test('calcular: solo capacitación cobra el precio sin automatización y sin anticipo', () => {
  const k = calcular({ plan: null, capacitacion: 's5' })
  assert.equal(k.valorCapacitacion, 2_100_000)
  assert.equal(k.anticipo, 0)
  assert.equal(k.mensual, 0)
  assert.equal(k.alFirmar, 1_050_000)
  assert.equal(k.total18, 2_100_000)
})

test('combinaciones: 3 planes x 3 opciones + 2 de solo capacitación', () => {
  assert.equal(combinaciones().length, 11)
})

test('pesos: formato colombiano con puntos', () => {
  assert.equal(pesos(1185000), '$1.185.000')
  assert.equal(pesos(0), '$0')
})

test('guardia: deja pasar cifras de la propuesta y totales calculados', () => {
  const total = calcular({ plan: 'p40', capacitacion: 's5' }).total18
  const r = pulirSalida({ respuesta: `Son ${pesos(1_400_000)} al mes y en total ${pesos(total)}. Las semanas 1 a 8 cuestan $0.`, pasar_a_mike: false, motivo: 'x', seccion: 'inversion' })
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.equal(r.salida.motivo, '')
    assert.equal(r.salida.seccion, 'inversion')
  }
  assert.ok(cifrasPermitidas().includes(total))
})

test('guardia: rechaza un descuento inventado', () => {
  const r = pulirSalida({ respuesta: 'Se lo dejamos en $1.000.000 al mes con el plan de 40.', pasar_a_mike: false, motivo: '', seccion: 'ninguna' })
  // $1.000.000 es la mensualidad del plan de 40 desde el mes 19: está permitida.
  assert.equal(r.ok, true)
  const r2 = pulirSalida({ respuesta: 'Le hacemos un precio de $950.000 al mes.', pasar_a_mike: false, motivo: '', seccion: 'ninguna' })
  assert.equal(r2.ok, false)
  const r3 = pulirSalida({ respuesta: 'Quedaría en 1,6 millones.', pasar_a_mike: false, motivo: '', seccion: 'ninguna' })
  assert.equal(r3.ok, false)
})

test('guardia: horas, días y porcentajes no son dinero', () => {
  const r = pulirSalida({ respuesta: 'Son 16 h en 4 sábados, 50% al confirmar y 2 rondas en 30 días.', pasar_a_mike: false, motivo: '', seccion: 'ninguna' })
  assert.equal(r.ok, true)
})

test('pulir: quita rayas y voseo', () => {
  const r = pulirSalida({ respuesta: 'Mirá — el plan incluye soporte.', pasar_a_mike: true, motivo: 'Pide algo', seccion: 'ninguna' })
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.ok(!r.salida.respuesta.includes('—'))
    assert.equal(r.salida.pasarAMike, true)
    assert.equal(r.salida.seccion, null)
  }
})

test('validar: exige sesión y que el último mensaje sea del gerente', () => {
  const base = { sesion: 'abc12345-xyz', mensajes: [{ rol: 'gerente', texto: '¿Qué incluye?' }] }
  assert.ok(validarEntradaChat(base))
  assert.equal(validarEntradaChat({ ...base, sesion: 'x' }), null)
  assert.equal(validarEntradaChat({ ...base, mensajes: [{ rol: 'ia', texto: 'hola' }] }), null)
  assert.equal(validarEntradaChat({ ...base, mensajes: [{ rol: 'gerente', texto: 'a'.repeat(801) }] }), null)
  assert.equal(validarEntradaChat({ ...base, extra: 1 }), null)
})

test('mensajesApi: arranca por el usuario y une turnos seguidos', () => {
  const m = mensajesApi({
    sesion: 'abc12345',
    mensajes: [
      { rol: 'ia', texto: 'saludo' },
      { rol: 'gerente', texto: 'uno' },
      { rol: 'gerente', texto: 'dos' },
      { rol: 'ia', texto: 'resp' },
      { rol: 'gerente', texto: 'tres' },
    ],
  })
  assert.deepEqual(m.map((x) => x.role), ['user', 'assistant', 'user'])
  assert.equal(m[0]!.content, 'uno\n\ndos')
})

test('prompt: trae los precios vigentes y ninguna raya', () => {
  const s = systemPrompt()
  for (const c of ['$1.185.000', '$1.400.000', '$1.700.000', '$785.000', '$1.200.000', '$2.100.000', '$500.000', '$25.000']) assert.ok(s.includes(c), c)
  assert.ok(!/[—–]/.test(s))
  assert.ok(conocimiento().includes('Totales ya calculados'))
})
