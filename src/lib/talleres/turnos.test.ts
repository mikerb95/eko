import { test } from 'node:test'
import assert from 'node:assert/strict'
import { avisoTurno, conteoRetos, miTurno, turnoActual, turnoSiguiente, validarCaso, type Turno } from './turnos.ts'
import { TALLER_2 } from './taller2.ts'
import { AREA_IDS } from '../academia/reglas.ts'
import { SKILL_AREA, rutaSkill } from './retos2.ts'

const T = (id: number, orden: number, estado: Turno['estado'], inicio = 0): Turno => ({ id, asistente_id: id * 10, orden, estado, inicio })

test('turno actual y siguiente respetan el orden', () => {
  const ts = [T(3, 3, 'espera'), T(1, 1, 'hecho'), T(2, 2, 'ahora', 1)]
  assert.equal(turnoActual(ts)?.id, 2)
  assert.equal(turnoSiguiente(ts)?.id, 3)
  assert.equal(turnoSiguiente([T(1, 1, 'hecho')]), null)
})

test('miTurno: posición, quién sigue y espera aproximada', () => {
  const ahora = 10 * 60_000
  const ts = [T(1, 1, 'ahora', ahora - 5 * 60_000), T(2, 2, 'espera'), T(3, 3, 'espera')]
  const b = miTurno(ts, 20, 15, ahora)!
  assert.equal(b.sigue, true)
  assert.equal(b.delante, 0)
  assert.equal(b.minutos, 10)
  const c = miTurno(ts, 30, 15, ahora)!
  assert.equal(c.sigue, false)
  assert.equal(c.delante, 1)
  assert.equal(c.posicion, 3)
  assert.equal(c.minutos, 25)
  assert.equal(miTurno(ts, 10, 15, ahora)!.minutos, 0)
  assert.equal(miTurno(ts, 99, 15, ahora), null)
  // Pasado de tiempo: no da minutos negativos.
  assert.equal(miTurno([T(1, 1, 'ahora', 0), T(2, 2, 'espera')], 20, 15, 60 * 60_000)!.minutos, 0)
})

test('avisoTurno dice qué hacer en cada estado', () => {
  assert.equal(avisoTurno(null), null)
  assert.equal(avisoTurno({ estado: 'ahora', delante: 0, posicion: 1, total: 3, sigue: false, minutos: 0 })!.tono, 'ahora')
  assert.match(avisoTurno({ estado: 'espera', delante: 0, posicion: 2, total: 3, sigue: true, minutos: 0 })!.texto, /1 minutos/)
  assert.match(avisoTurno({ estado: 'espera', delante: 1, posicion: 3, total: 3, sigue: false, minutos: 25 })!.texto, /1 persona antes/)
})

test('conteo de retos y caso', () => {
  assert.deepEqual(conteoRetos(['a', 'b'], [{ retos: ['a', 'a', 'x'] }, { retos: ['a', 'b'] }]), { a: 2, b: 1 })
  assert.equal(validarCaso('  Auto de   la CAR  '), 'Auto de la CAR')
  assert.equal(validarCaso('ab'), null)
  assert.equal(validarCaso(5), null)
  assert.equal(validarCaso('x'.repeat(201)), null)
})

test('capacitación 2: cada reto tiene pasos y petición para las seis áreas, y cada área su skill', () => {
  for (const r of TALLER_2.retos!) {
    assert.ok(r.pasos.length >= 3, r.id)
    assert.deepEqual(Object.keys(r.peticion).sort(), [...AREA_IDS].sort(), `${r.id}: áreas`)
    assert.ok(!/[–—]/.test(JSON.stringify(r)), `${r.id}: guion largo`)
  }
  for (const a of AREA_IDS) assert.match(rutaSkill(a), /^\/academia\/skills\/[a-z-]+\.zip$/, a)
  assert.equal(Object.keys(SKILL_AREA).length, AREA_IDS.length)
  const carrera = TALLER_2.carreras![0]!
  for (const m of ['opus', 'sonnet', 'haiku'] as const) assert.ok(carrera.respaldos[m].length > 100, m)
  assert.ok(TALLER_2.escenas.find((e) => e.tipo === 'carrera')?.datos?.carrera === carrera.id)
})
