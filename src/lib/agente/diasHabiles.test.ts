import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  domingoDePascua,
  esHabil,
  festivosColombia,
  habilesRestantes,
  hoyEnBogota,
  venceDiasCalendario,
  venceDiasHabiles,
} from './diasHabiles.ts'

test('domingo de Pascua de años conocidos', () => {
  assert.equal(domingoDePascua(2025), '2025-04-20')
  assert.equal(domingoDePascua(2026), '2026-04-05')
  assert.equal(domingoDePascua(2027), '2027-03-28')
})

test('festivos de 2026 coinciden con el calendario oficial', () => {
  const esperados = [
    '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
    '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29',
    '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02',
    '2026-11-16', '2026-12-08', '2026-12-25',
  ]
  assert.deepEqual([...festivosColombia(2026)].sort(), esperados)
})

test('festivos de 2025 coinciden con el calendario oficial', () => {
  const esperados = [
    '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
    '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
    '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
    '2025-12-08', '2025-12-25',
  ]
  // En 2025 San Pedro (29 jun) y Sagrado Corazón caen el mismo lunes 30 de
  // junio: por eso son 17 fechas distintas y no 18.
  assert.deepEqual([...festivosColombia(2025)].sort(), esperados)
})

test('fines de semana y festivos no son hábiles', () => {
  assert.equal(esHabil('2026-10-24'), false) // sábado
  assert.equal(esHabil('2026-10-25'), false) // domingo
  assert.equal(esHabil('2026-11-02'), false) // Todos los Santos, corrido
  assert.equal(esHabil('2026-10-21'), true) // miércoles
})

test('el plazo empieza el día hábil siguiente a la notificación', () => {
  // Notificado el viernes 23 de octubre de 2026: el día 1 es el lunes 26.
  assert.equal(venceDiasHabiles('2026-10-23', 1), '2026-10-26')
})

test('15 días hábiles saltan fines de semana y festivos', () => {
  // Desde el martes 27 de octubre de 2026. En el camino están los festivos
  // del 2 y el 16 de noviembre.
  assert.equal(venceDiasHabiles('2026-10-27', 15), '2026-11-19')
})

test('un plazo que cruza Semana Santa', () => {
  // Notificado el lunes 30 de marzo de 2026; jueves 2 y viernes 3 de abril
  // son festivos.
  assert.equal(venceDiasHabiles('2026-03-30', 5), '2026-04-08')
})

test('un plazo en días calendario que cae en festivo se corre al hábil siguiente', () => {
  // 30 días calendario desde el 3 de octubre de 2026 caen el lunes 2 de
  // noviembre, festivo: vence el martes 3.
  assert.equal(venceDiasCalendario('2026-10-03', 30), '2026-11-03')
})

test('días hábiles restantes', () => {
  assert.equal(habilesRestantes('2026-10-21', '2026-10-21'), 0)
  assert.equal(habilesRestantes('2026-10-21', '2026-10-22'), 1)
  assert.equal(habilesRestantes('2026-10-23', '2026-10-26'), 1) // viernes a lunes
  assert.equal(habilesRestantes('2026-10-30', '2026-11-03'), 1) // salta el festivo del 2
  assert.equal(habilesRestantes('2026-10-26', '2026-10-23'), -1) // vencido
})

test('rechaza plazos y fechas inválidas', () => {
  assert.throws(() => venceDiasHabiles('2026-10-21', 0))
  assert.throws(() => venceDiasHabiles('21/10/2026', 5))
})

test('hoy en Bogotá no se adelanta por la diferencia horaria', () => {
  // 3:00 a. m. UTC del 22 es todavía 21 en Bogotá (UTC-5).
  assert.equal(hoyEnBogota(new Date('2026-10-22T03:00:00Z')), '2026-10-21')
})
