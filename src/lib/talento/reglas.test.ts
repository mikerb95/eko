import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  contarDias,
  cumpleanosDelMes,
  dias360,
  esFecha,
  finPeriodoPrueba,
  masMeses,
  promedioNotas,
  saldoVacaciones,
  vencimientos,
  AJUSTES_BASE,
  type DatosVencimientos,
  type Empleado,
  type Novedad,
} from './reglas.ts'

const emp = (p: Partial<Empleado> = {}): Empleado => ({
  usuario_id: 1,
  tipo_contrato: 'indefinido',
  fecha_ingreso: '2025-01-01',
  fecha_fin_contrato: '',
  fecha_retiro: '',
  fecha_nacimiento: '',
  vacaciones_ajuste: 0,
  cargo_id: null,
  ...p,
})

const nov = (p: Partial<Novedad>): Novedad => ({
  id: 1, usuario_id: 1, tipo: 'vacaciones', desde: '2025-06-02', hasta: '2025-06-06',
  dias_habiles: 5, dias_calendario: 5, estado: 'aprobada', ...p,
})

test('fechas: valida AAAA-MM-DD reales', () => {
  assert.ok(esFecha('2026-02-28'))
  assert.ok(!esFecha('2026-02-31'))
  assert.ok(!esFecha('2026-2-1'))
  assert.ok(!esFecha(''))
  assert.equal(masMeses('2026-01-31', 1), '2026-02-28')
  assert.equal(masMeses('2024-01-31', 1), '2024-02-29')
})

test('año comercial: un año completo son 360 días', () => {
  assert.equal(dias360('2025-01-01', '2025-12-31'), 360)
  assert.equal(dias360('2025-02-01', '2025-02-28'), 30)
  assert.equal(dias360('2025-03-01', '2025-03-31'), 30)
  assert.equal(dias360('2025-01-15', '2025-01-15'), 1)
})

test('vacaciones: 15 días hábiles por año trabajado, menos lo disfrutado', () => {
  const s = saldoVacaciones(emp(), [nov({})], '2025-12-31')
  assert.equal(s.causadas, 15)
  assert.equal(s.tomadas, 5)
  assert.equal(s.saldo, 10)

  // Medio año: 7,5 días.
  assert.equal(saldoVacaciones(emp(), [], '2025-06-30').causadas, 7.5)

  // Las programadas (aprobadas a futuro) descuentan; las solicitadas no.
  const s2 = saldoVacaciones(emp(), [nov({ desde: '2026-02-02', hasta: '2026-02-06' }), nov({ id: 2, estado: 'solicitada', dias_habiles: 3 })], '2025-12-31')
  assert.equal(s2.programadas, 5)
  assert.equal(s2.porAprobar, 3)
  assert.equal(s2.saldo, 10)

  // El ajuste son días disfrutados antes de llevar el registro.
  assert.equal(saldoVacaciones(emp({ vacaciones_ajuste: 4 }), [], '2025-12-31').saldo, 11)

  // Las vacaciones de otra persona no cuentan.
  assert.equal(saldoVacaciones(emp(), [nov({ usuario_id: 2 })], '2025-12-31').saldo, 15)
})

test('vacaciones: se dejan de causar con el retiro; prestación y aprendizaje no causan', () => {
  assert.equal(saldoVacaciones(emp({ fecha_retiro: '2025-06-30' }), [], '2026-06-30').causadas, 7.5)
  assert.equal(saldoVacaciones(emp({ tipo_contrato: 'prestacion' }), [], '2026-01-01').aplica, false)
  assert.equal(saldoVacaciones(emp({ tipo_contrato: 'aprendizaje' }), [], '2026-01-01').aplica, false)
  assert.equal(saldoVacaciones(emp({ fecha_ingreso: '' }), [], '2026-01-01').sinIngreso, true)
})

test('días hábiles: sin domingos ni festivos; el sábado según la empresa', () => {
  // Lunes 29 jun 2026 (San Pedro, festivo) a domingo 5 jul 2026.
  assert.deepEqual(contarDias('2026-06-29', '2026-07-05', false), { habiles: 4, calendario: 7 })
  assert.deepEqual(contarDias('2026-06-29', '2026-07-05', true), { habiles: 5, calendario: 7 })
  // Rango al revés: cero.
  assert.deepEqual(contarDias('2026-07-05', '2026-06-29', false), { habiles: 0, calendario: 0 })
  // Semana Santa 2026: jueves 2 y viernes 3 de abril son festivos.
  assert.equal(contarDias('2026-03-30', '2026-04-03', false).habiles, 3)
})

test('período de prueba: dos meses, o la quinta parte de un fijo corto', () => {
  assert.equal(finPeriodoPrueba(emp({ fecha_ingreso: '2026-01-15' })), '2026-03-14')
  // Fijo de 6 meses (181 días): quinta parte = 36 días.
  assert.equal(finPeriodoPrueba(emp({ tipo_contrato: 'fijo', fecha_ingreso: '2026-01-01', fecha_fin_contrato: '2026-06-30' })), '2026-02-05')
  // Fijo de un año: tope de dos meses.
  assert.equal(finPeriodoPrueba(emp({ tipo_contrato: 'fijo', fecha_ingreso: '2026-01-01', fecha_fin_contrato: '2026-12-31' })), '2026-02-28')
  assert.equal(finPeriodoPrueba(emp({ tipo_contrato: 'prestacion' })), null)
})

const datos = (p: Partial<DatosVencimientos>): DatosVencimientos => ({
  empleados: [emp()],
  documentos: [],
  formaciones: [],
  novedades: [],
  evaluaciones: [],
  cursos: new Map(),
  cargosConCriterios: new Set(),
  ajustes: AJUSTES_BASE,
  ...p,
})

test('vencimientos: documentos, solo el más reciente de cada tipo', () => {
  const avisos = vencimientos(datos({
    documentos: [
      { id: 1, usuario_id: 1, tipo: 'examen', nombre: '', fecha_vencimiento: '2026-01-10' },
      { id: 2, usuario_id: 1, tipo: 'examen', nombre: '', fecha_vencimiento: '2027-01-10' },
      { id: 3, usuario_id: 1, tipo: 'licencia', nombre: '', fecha_vencimiento: '2026-01-20' },
      { id: 4, usuario_id: 1, tipo: 'alturas', nombre: '', fecha_vencimiento: '2025-12-01' },
    ],
  }), '2026-01-05')
  assert.deepEqual(avisos.map((a) => [a.clave, a.nivel]), [['doc-4', 'vencido'], ['doc-3', 'urgente']])
})

test('vencimientos: las personas retiradas no generan avisos', () => {
  const avisos = vencimientos(datos({
    empleados: [emp({ fecha_retiro: '2025-12-31' })],
    documentos: [{ id: 1, usuario_id: 1, tipo: 'licencia', nombre: '', fecha_vencimiento: '2026-01-20' }],
  }), '2026-01-05')
  assert.deepEqual(avisos, [])
})

test('vencimientos: preaviso del término fijo 30 días antes', () => {
  const [a] = vencimientos(datos({ empleados: [emp({ tipo_contrato: 'fijo', fecha_ingreso: '2025-03-01', fecha_fin_contrato: '2026-02-28' })] }), '2026-01-20')
  assert.equal(a!.tipo, 'contrato')
  assert.equal(a!.fecha, '2026-01-29')
  assert.equal(a!.nivel, 'urgente')
})

test('vencimientos: vacaciones acumuladas y evaluación pendiente', () => {
  const avisos = vencimientos(datos({
    empleados: [emp({ fecha_ingreso: '2023-01-01', cargo_id: 7 })],
    cargosConCriterios: new Set([7]),
  }), '2026-01-05')
  assert.ok(avisos.some((a) => a.tipo === 'vacaciones'))
  const ev = avisos.find((a) => a.tipo === 'evaluacion')
  assert.equal(ev?.nivel, 'vencido')
  assert.equal(ev?.fecha, '2024-01-01')

  // Con una evaluación cerrada reciente, ya no toca.
  const avisos2 = vencimientos(datos({
    empleados: [emp({ fecha_ingreso: '2023-01-01', cargo_id: 7 })],
    cargosConCriterios: new Set([7]),
    evaluaciones: [{ id: 1, usuario_id: 1, fecha: '2025-11-01', estado: 'cerrada' }],
  }), '2026-01-05')
  assert.ok(!avisos2.some((a) => a.tipo === 'evaluacion'))
})

test('cumpleaños del mes y promedio de notas', () => {
  const lista = cumpleanosDelMes([
    { fecha_nacimiento: '1990-03-20' }, { fecha_nacimiento: '1985-03-02' }, { fecha_nacimiento: '1992-04-01' }, { fecha_nacimiento: '' },
  ], '2026-03-10')
  assert.deepEqual(lista.map((e) => e.fecha_nacimiento), ['1985-03-02', '1990-03-20'])
  assert.equal(promedioNotas([4, 5, 3]), 4)
  assert.equal(promedioNotas([4, 0, 9]), 4)
  assert.equal(promedioNotas([]), 0)
})
