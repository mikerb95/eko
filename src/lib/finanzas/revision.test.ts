import { test } from 'node:test'
import assert from 'node:assert/strict'
import { motivosFecha, resumenRevision, type Revisiones } from './revision.ts'

const OFICIAL = 'Calendario oficial de la DIAN'
const base = { tipo: 'retefuente', fuente: OFICIAL, vence: '2026-12-15', created_at: '2026-11-01T10:00:00.000Z', fecha_cambiada_at: '' }
const REV: Revisiones = { '2026': { anio: 2026, contador: 'Ana Gómez', registradoPor: 'finanzas1', fecha: '2026-11-20T15:00:00.000Z', nota: '' } }
const ids = (m: { id: string }[]) => m.map((x) => x.id)

test('fecha oficial, RUT confirmado y calendario revisado: nada por confirmar', () => {
  assert.deepEqual(motivosFecha(base, { confirmado: true }, REV), [])
})

test('sin revisión del contador se marca, con el año', () => {
  const m = motivosFecha(base, { confirmado: true }, {})
  assert.deepEqual(ids(m), ['sin_revision'])
  assert.match(m[0]!.texto, /2026/)
})

test('estimada y por verificar se marcan aunque el contador haya revisado', () => {
  assert.deepEqual(ids(motivosFecha({ ...base, fuente: 'Estimada con la regla del Decreto 2229 de 2023: confirmar' }, { confirmado: true }, REV)), ['estimada'])
  assert.deepEqual(ids(motivosFecha({ ...base, tipo: 'ica', fuente: 'Calendario distrital de Hacienda Bogotá, por verificar con la resolución' }, { confirmado: true }, REV)), ['por_verificar'])
})

test('RUT sin confirmar: IVA con el motivo de la periodicidad; requerimientos y manuales no dependen del RUT', () => {
  const iva = motivosFecha({ ...base, tipo: 'iva' }, { confirmado: false }, REV)
  assert.deepEqual(ids(iva), ['rut'])
  assert.match(iva[0]!.texto, /bimestral o cuatrimestral/)
  assert.deepEqual(ids(motivosFecha({ ...base, tipo: 'otra', fuente: 'Cargada a mano' }, { confirmado: false }, REV)), [])
})

test('plazo de un requerimiento: siempre por confirmar, sin depender de la revisión anual', () => {
  const m = motivosFecha({ ...base, tipo: 'requerimiento', fuente: 'Calculado por el sistema desde el requerimiento (documento #3)' }, { confirmado: false }, {})
  assert.deepEqual(ids(m), ['calculada'])
})

test('cargada o cambiada después de la revisión del contador', () => {
  assert.deepEqual(ids(motivosFecha({ ...base, created_at: '2026-11-21T09:00:00.000Z' }, { confirmado: true }, REV)), ['cambio_posterior'])
  assert.deepEqual(ids(motivosFecha({ ...base, fecha_cambiada_at: '2026-11-22T09:00:00.000Z', fuente: 'Cambiada a mano en el panel (antes 2026-12-14); confírmela con el calendario oficial' }, { confirmado: true }, REV)), ['cambio_posterior'])
  // Cambiada antes de la revisión: el contador ya la vio.
  assert.deepEqual(ids(motivosFecha({ ...base, fecha_cambiada_at: '2026-11-10T09:00:00.000Z' }, { confirmado: true }, REV)), [])
})

test('la revisión de un año no cubre el siguiente', () => {
  assert.deepEqual(ids(motivosFecha({ ...base, vence: '2027-01-20' }, { confirmado: true }, REV)), ['sin_revision'])
})

test('resumen por año: abiertas y por confirmar, sin contar presentadas ni requerimientos', () => {
  const obs = [
    { ...base, estado: 'pendiente' },
    { ...base, fuente: 'Estimada con la regla', estado: 'pendiente' },
    { ...base, estado: 'presentado', fuente: 'Estimada con la regla' },
    { ...base, tipo: 'requerimiento', fuente: 'Calculado por el sistema', estado: 'pendiente' },
    { ...base, vence: '2027-01-20', estado: 'pendiente' },
  ]
  const r = resumenRevision(obs, { confirmado: true }, REV)
  assert.deepEqual(r.map((x) => [x.anio, x.abiertas, x.porConfirmar, !!x.revision]), [['2026', 2, 1, true], ['2027', 1, 1, false]])
})
