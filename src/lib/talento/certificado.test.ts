import { test } from 'node:test'
import assert from 'node:assert/strict'
import { armarCertificado, enLetras, fechaLarga, pesosEnLetras } from './certificado.ts'

test('números en letras', () => {
  assert.equal(enLetras(1), 'uno')
  assert.equal(enLetras(21), 'veintiuno')
  assert.equal(enLetras(100), 'cien')
  assert.equal(enLetras(115), 'ciento quince')
  assert.equal(enLetras(1000), 'mil')
  assert.equal(enLetras(21000), 'veintiún mil')
  assert.equal(enLetras(1_750_905), 'un millón setecientos cincuenta mil novecientos cinco')
  assert.equal(enLetras(3_201_000), 'tres millones doscientos un mil')
  assert.equal(pesosEnLetras(2_000_000), 'dos millones de pesos')
  assert.equal(pesosEnLetras(1_423_500), 'un millón cuatrocientos veintitrés mil quinientos pesos')
  assert.equal(pesosEnLetras(21), 'veintiún pesos')
})

const base = {
  nombre: 'Carlos Bodega', documento: '1.020.304', cargo: 'Coordinador logístico', tipo_contrato: 'indefinido',
  fecha_ingreso: '2024-03-01', fecha_retiro: '', salario: 2_500_000, conSalario: true, hoy: '2026-11-26',
  empresa: 'Ekosolv S.A.S.', nit: '900.659.506-9', ciudad: 'Bogotá D.C.',
}

test('certificado de quien sigue trabajando, con salario', () => {
  const c = armarCertificado(base)
  assert.deepEqual(c.faltan, [])
  assert.equal(c.parrafos[0], 'Que Carlos Bodega, identificado(a) con cédula de ciudadanía No. 1.020.304, labora en Ekosolv S.A.S. desde el 1 de marzo de 2024 hasta la fecha, mediante contrato de trabajo a término indefinido, en el cargo de Coordinador logístico.')
  assert.equal(c.parrafos[1], 'Actualmente devenga un salario mensual de DOS MILLONES QUINIENTOS MIL PESOS M/CTE ($2.500.000).')
  assert.equal(c.expedicion, 'Se expide a solicitud del interesado(a) en Bogotá D.C., a los veintiséis (26) días del mes de noviembre de 2026.')
})

test('certificado de quien se retiró, sin salario, y datos que faltan', () => {
  const c = armarCertificado({ ...base, fecha_retiro: '2026-10-31', conSalario: false })
  assert.match(c.parrafos[0]!, /laboró en Ekosolv S\.A\.S\. desde el 1 de marzo de 2024 hasta el 31 de octubre de 2026/)
  assert.equal(c.parrafos.length, 1)
  assert.deepEqual(armarCertificado({ ...base, documento: '', fecha_ingreso: '' }).faltan, ['el documento de identidad', 'la fecha de ingreso'])
  assert.equal(fechaLarga('2026-01-01'), '1 de enero de 2026')
})
