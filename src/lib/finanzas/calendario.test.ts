import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  diaHabilDian,
  diaHabilPila,
  dosUltimos,
  faltantesDelAnio,
  nesimoHabil,
  obligacionesDelAnio,
  ultimoDigito,
  venceDian,
  venceDianDetalle,
  venceDianPorRegla,
  type Responsabilidades,
} from './calendario.ts'

// Tablas del calendario oficial DIAN 2026 (Calendario_Tributario_2026.pdf),
// días del mes para los dígitos 1, 2, 3, 4, 5, 6, 7, 8, 9, 0.
const RETENCION_2026: Record<number, number[]> = {
  2: [10, 11, 12, 13, 16, 17, 18, 19, 20, 23],
  3: [10, 11, 12, 13, 16, 17, 18, 19, 20, 24],
  4: [13, 14, 15, 16, 20, 21, 22, 23, 24, 27],
  5: [12, 13, 14, 15, 19, 20, 21, 22, 25, 26],
  6: [10, 11, 12, 16, 17, 18, 19, 22, 23, 24],
  7: [9, 10, 14, 15, 16, 17, 21, 22, 23, 24],
  8: [12, 13, 14, 18, 19, 20, 21, 24, 25, 26],
  9: [9, 10, 11, 14, 15, 16, 17, 18, 21, 22],
  10: [9, 13, 14, 15, 16, 19, 20, 21, 22, 23],
  11: [11, 12, 13, 17, 18, 19, 20, 23, 24, 25],
  12: [10, 11, 14, 15, 16, 17, 18, 21, 22, 23],
}
// Retención de diciembre de 2026, que vence en enero de 2027 (misma tabla del PDF).
const RETENCION_ENE_2027 = [13, 14, 15, 18, 19, 20, 21, 22, 25, 26]
const DIGITOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]

test('venceDian entrega la tabla oficial 2026 dígito por dígito', () => {
  for (const [mes, dias] of Object.entries(RETENCION_2026)) {
    DIGITOS.forEach((d, i) => {
      const esperado = `2026-${String(mes).padStart(2, '0')}-${String(dias[i]).padStart(2, '0')}`
      const v = venceDianDetalle(2026, Number(mes), `90065950${d}`)
      assert.deepEqual(v, { vence: esperado, oficial: true }, `mes ${mes}, dígito ${d}`)
    })
  }
  DIGITOS.forEach((d, i) => {
    assert.equal(venceDian(2027, 1, `90065950${d}`), `2027-01-${String(RETENCION_ENE_2027[i]).padStart(2, '0')}`)
  })
})

test('la regla de días hábiles nunca da una fecha posterior a la oficial (estimado seguro)', () => {
  let iguales = 0
  for (const [mes, dias] of Object.entries(RETENCION_2026)) {
    DIGITOS.forEach((d, i) => {
      const regla = venceDianPorRegla(2026, Number(mes), `1${d}`)
      const oficial = `2026-${String(mes).padStart(2, '0')}-${String(dias[i]).padStart(2, '0')}`
      assert.ok(regla <= oficial, `mes ${mes}, dígito ${d}: regla ${regla} > oficial ${oficial}`)
      if (regla === oficial) iguales++
    })
  }
  // En 2026 coincide en 96 de 110 casos; solo abril y julio se corren.
  assert.equal(iguales, 96)
})

test('sin calendario oficial publicado, la fecha queda marcada como estimada', () => {
  assert.deepEqual(venceDianDetalle(2027, 2, '900659506'), { vence: venceDianPorRegla(2027, 2, '900659506'), oficial: false })
})

test('NIT de Ekosolv: dígito 6, dos últimos 06', () => {
  assert.equal(ultimoDigito('900.659.506'), 6)
  assert.equal(dosUltimos('900659506'), 6)
  assert.equal(diaHabilDian(6), 12)
  assert.equal(diaHabilDian(0), 16)
  assert.equal(diaHabilPila(6), 2)
  assert.equal(diaHabilPila(99), 16)
})

test('n-ésimo día hábil salta festivos y fines de semana', () => {
  // Abril de 2026: 2 y 3 son Jueves y Viernes Santo.
  assert.equal(nesimoHabil(2026, 4, 1), '2026-04-01')
  assert.equal(nesimoHabil(2026, 4, 2), '2026-04-06')
  assert.throws(() => nesimoHabil(2026, 2, 30))
})

const EKOSOLV: Responsabilidades = {
  nit: '900659506',
  dv: '9',
  retencion: true,
  iva: 'bimestral',
  renta: true,
  granContribuyente: false,
  activosExterior: false,
  exogena: true,
  pila: true,
  ica: 'bimestral',
  reteica: false,
}

test('siembra 2026 de Ekosolv con las fechas del dígito 6', () => {
  const obs = obligacionesDelAnio(EKOSOLV, 2026)
  const por = (c: string) => obs.find((o) => o.clave === c)
  assert.equal(por('retefuente:2026-10')?.vence, '2026-11-19')
  assert.equal(por('retefuente:2025-12')?.vence, '2026-01-20')
  assert.equal(por('iva:2026-B5')?.vence, '2026-11-19')
  assert.equal(por('iva:2025-B6')?.periodo, 'Noviembre a diciembre 2025')
  assert.equal(por('renta:2025-cuota1')?.vence, '2026-05-20')
  assert.equal(por('renta:2025-cuota1')?.formulario, '110')
  assert.equal(por('renta:2025-cuota2')?.vence, '2026-07-17')
  assert.equal(por('exogena:2025')?.vence, '2026-05-15')
  assert.equal(por('exogena:2025')?.con_pago, false)
  assert.equal(por('ica:2026-B5')?.vence, '2026-12-11')
  assert.equal(por('ica:2026-B6'), undefined, 'el sexto bimestre vence en 2027')
  assert.equal(por('pila:2026-12')?.vence, '2026-12-02')
  assert.equal(obs.filter((o) => o.tipo === 'retefuente').length, 12)
  assert.equal(obs.filter((o) => o.tipo === 'iva').length, 6)
  // Ordenadas por fecha y sin claves repetidas.
  assert.deepEqual([...obs].sort((a, b) => a.vence.localeCompare(b.vence)).map((o) => o.vence), obs.map((o) => o.vence))
  assert.equal(new Set(obs.map((o) => o.clave)).size, obs.length)
})

test('2027: la DIAN se calcula; exógena e ICA posteriores a febrero quedan como faltantes', () => {
  const obs = obligacionesDelAnio(EKOSOLV, 2027)
  assert.equal(obs.find((o) => o.clave === 'retefuente:2026-12')?.vence, '2027-01-20')
  assert.equal(obs.find((o) => o.clave === 'retefuente:2026-12')?.fuente, 'Calendario oficial de la DIAN')
  assert.match(obs.find((o) => o.clave === 'retefuente:2027-01')!.fuente, /^Estimada/)
  assert.equal(obs.find((o) => o.clave === 'ica:2026-B6')?.vence, '2027-02-12')
  assert.equal(obs.some((o) => o.tipo === 'exogena'), false)
  assert.ok(faltantesDelAnio(EKOSOLV, 2027).some((f) => f.includes('exógena')))
})

test('IVA cuatrimestral y gran contribuyente', () => {
  const obs = obligacionesDelAnio({ ...EKOSOLV, iva: 'cuatrimestral', granContribuyente: true, activosExterior: true }, 2026)
  assert.deepEqual(obs.filter((o) => o.tipo === 'iva').map((o) => o.clave), ['iva:2025-C3', 'iva:2026-C1', 'iva:2026-C2'])
  assert.equal(obs.filter((o) => o.tipo === 'renta').length, 3)
  // Gran contribuyente, dígito 6: 17 feb, 21 abr, 18 jun (tabla oficial 2026).
  assert.deepEqual(obs.filter((o) => o.tipo === 'renta').map((o) => o.vence), ['2026-02-17', '2026-04-21', '2026-06-18'])
  assert.equal(obs.find((o) => o.tipo === 'activos_exterior')?.vence, '2026-04-21')
})
