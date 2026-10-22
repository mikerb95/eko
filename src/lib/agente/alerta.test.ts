import { test } from 'node:test'
import assert from 'node:assert/strict'
import { armarAlerta, buscarExpediente, normalizarNit, normalizarNumero, obligacionPrincipal, type ExpedienteRef } from './alerta.ts'
import { normalizarExtraccion, type Extraccion } from './extraccion.ts'
import { decidirPrioridad, REGLAS_INICIALES } from './reglas.ts'
import { venceMeses } from './diasHabiles.ts'

const exp = (o: Partial<ExpedienteRef>): ExpedienteRef => ({
  id: 1,
  cliente: 'Cliente de ejemplo S.A.S.',
  nit: '900123456-7',
  autoridad: 'CAR Cundinamarca',
  numero: 'LAM-1234',
  numero_norm: normalizarNumero(o.numero ?? 'LAM-1234'),
  responsable: 'Laura',
  activo: true,
  ...o,
})

const base: Extraccion = normalizarExtraccion({
  tipo_acto: 'requerimiento',
  autoridad: 'CAR Cundinamarca',
  numero_expediente: 'LAM 1234',
  numero_acto: 'Auto 03562',
  fecha_acto: '2026-10-20',
  titular: 'Cliente de ejemplo S.A.S.',
  nit: '900123456',
  resumen: 'Requiere información adicional del permiso de vertimientos.',
  obligaciones: [
    { que: 'Caracterización actualizada del vertimiento', plazo_cantidad: 15, plazo_unidad: 'dias_habiles', plazo_texto: 'quince (15) días hábiles' },
    { que: 'Ajustes al plan de manejo', plazo_cantidad: 30, plazo_unidad: 'dias_habiles', plazo_texto: 'treinta (30) días hábiles' },
  ],
  normas: ['Decreto 1076 de 2015'],
  accion_sugerida: 'Programar muestreo.',
  confianza: 'alta',
  motivo_confianza: '',
})

test('normaliza números de expediente y NIT', () => {
  assert.equal(normalizarNumero('lam-1234 / 2024'), 'LAM12342024')
  assert.equal(normalizarNit('900.123.456-7'), '900123456')
  assert.equal(normalizarNit('900123456'), '900123456')
})

test('encuentra el expediente por número aunque cambie el formato', () => {
  const r = buscarExpediente({ numero_expediente: 'LAM 1234', nit: '' }, [exp({})])
  assert.equal(r.expediente?.id, 1)
  assert.equal(r.por, 'numero')
})

test('acepta un número con sufijo de año si no hay ambigüedad', () => {
  const r = buscarExpediente({ numero_expediente: 'LAM-1234-2024', nit: '' }, [exp({})])
  assert.equal(r.expediente?.id, 1)
})

test('no asigna por NIT si el cliente tiene varios expedientes', () => {
  const lista = [exp({ id: 1, numero: 'LAM-1234' }), exp({ id: 2, numero: 'PV-0099' })]
  const r = buscarExpediente({ numero_expediente: '', nit: '900123456-7' }, lista)
  assert.equal(r.expediente, null)
})

test('asigna por NIT si el cliente tiene un solo expediente', () => {
  const r = buscarExpediente({ numero_expediente: '', nit: '900.123.456-7' }, [exp({})])
  assert.equal(r.por, 'nit')
})

test('ignora expedientes inactivos', () => {
  const r = buscarExpediente({ numero_expediente: 'LAM-1234', nit: '' }, [exp({ activo: false })])
  assert.equal(r.expediente, null)
})

test('la obligación principal es la que vence primero', () => {
  const p = obligacionPrincipal(base.obligaciones, '2026-10-21')
  assert.equal(p?.plazo_cantidad, 15)
})

test('arma una alerta completa con vencimiento en días hábiles', () => {
  const a = armarAlerta({ extraccion: base, expedientes: [exp({})], reglas: REGLAS_INICIALES, fechaNotificacion: '2026-10-27', hoy: '2026-10-27' })
  assert.equal(a.expediente_id, 1)
  assert.equal(a.vence_el, '2026-11-19')
  assert.equal(a.plazo_texto, 'quince (15) días hábiles')
  assert.equal(a.prioridad, 'media') // quedan 15 hábiles, el umbral es 10
  assert.equal(a.por_confirmar, false)
  assert.equal(a.responsable, 'Laura')
  assert.match(a.titulo, /Requerimiento de información · Cliente de ejemplo/)
})

test('sube a prioridad alta cuando el plazo está cerca', () => {
  const a = armarAlerta({ extraccion: base, expedientes: [exp({})], reglas: REGLAS_INICIALES, fechaNotificacion: '2026-10-27', hoy: '2026-11-10' })
  assert.equal(a.prioridad, 'alta') // quedan 7 hábiles
})

test('sin fecha de notificación usa la del acto y pide confirmar', () => {
  const a = armarAlerta({ extraccion: base, expedientes: [exp({})], reglas: REGLAS_INICIALES, fechaNotificacion: '', hoy: '2026-10-21' })
  assert.equal(a.vence_el !== '', true)
  assert.equal(a.por_confirmar, true)
  assert.match(a.motivo_confirmar, /fecha de notificación/)
})

test('pide confirmar si no encuentra el expediente o la lectura no es confiable', () => {
  const dudosa = { ...base, confianza: 'baja' as const, motivo_confianza: 'Página 3 borrosa.' }
  const a = armarAlerta({ extraccion: dudosa, expedientes: [], reglas: REGLAS_INICIALES, fechaNotificacion: '2026-10-27', hoy: '2026-10-27' })
  assert.equal(a.expediente_id, 0)
  assert.equal(a.por_confirmar, true)
  assert.match(a.motivo_confirmar, /expediente/)
  assert.match(a.motivo_confirmar, /borrosa/)
})

test('un sancionatorio es alta aunque no tenga plazo', () => {
  const s = { ...base, tipo_acto: 'sancionatorio' as const, obligaciones: [] }
  const a = armarAlerta({ extraccion: s, expedientes: [exp({})], reglas: REGLAS_INICIALES, fechaNotificacion: '2026-10-27', hoy: '2026-10-27' })
  assert.equal(a.prioridad, 'alta')
  assert.equal(a.vence_el, '')
})

test('decidirPrioridad: vencido siempre es alta', () => {
  const otorgamiento = REGLAS_INICIALES.find((r) => r.tipo_acto === 'otorgamiento')!
  assert.equal(decidirPrioridad(otorgamiento, -1), 'alta')
  assert.equal(decidirPrioridad(otorgamiento, 3), 'baja')
})

test('normalizarExtraccion limpia datos inválidos sin lanzar', () => {
  const n = normalizarExtraccion({
    tipo_acto: 'inventado',
    fecha_acto: '2026-02-31',
    confianza: 'quizás',
    obligaciones: [{ que: '', plazo_cantidad: 5 }, { que: 'Entregar informe', plazo_cantidad: -2, plazo_unidad: 'dias_habiles' }],
  })
  assert.equal(n.tipo_acto, 'otro')
  assert.equal(n.fecha_acto, '')
  assert.equal(n.confianza, 'baja')
  assert.equal(n.obligaciones.length, 1)
  assert.equal(n.obligaciones[0].plazo_unidad, 'sin_plazo')
  assert.deepEqual(normalizarExtraccion(null).obligaciones, [])
})

test('plazo en meses corre al hábil siguiente y respeta fin de mes', () => {
  assert.equal(venceMeses('2026-01-31', 1), '2026-03-02') // 28 feb es sábado
  assert.equal(venceMeses('2026-10-21', 2), '2026-12-21')
})
