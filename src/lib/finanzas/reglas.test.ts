import { test } from 'node:test'
import assert from 'node:assert/strict'
import { avisoDelDia, avisosDelDia, claveAviso, nivel, resumenesDeHoy, textoPlazo } from './avisos.ts'
import { chequear, listaVerificacion, listoParaAprobar, listoParaPagar, pesos, puedeAprobar, verificacionCompleta, type Cuenta, type Entidad, type ObligacionControl, type PagoControl } from './control.ts'
import { puedeAvanzar, puedeDevolver, secuencia, siguiente, soporteExigido } from './estados.ts'

// ---------------------------------------------------------------- estados

test('secuencia con y sin pago', () => {
  assert.deepEqual(secuencia({ con_pago: true }), ['pendiente', 'borrador_listo', 'revisado', 'aprobado', 'pagado', 'presentado'])
  assert.deepEqual(secuencia({ con_pago: false }), ['pendiente', 'borrador_listo', 'revisado', 'aprobado', 'presentado'])
  assert.equal(siguiente({ estado: 'aprobado', con_pago: false, valor_borrador: null }), 'presentado')
  assert.equal(siguiente({ estado: 'presentado', con_pago: true, valor_borrador: 1 }), null)
})

test('nada avanza sin su soporte', () => {
  const o = { estado: 'pendiente' as const, con_pago: true, valor_borrador: 1000 }
  assert.deepEqual(puedeAvanzar(o, 'borrador_listo', 'finanzas', []), { ok: false, motivo: 'Falta el soporte: borrador de la declaración.' })
  assert.deepEqual(puedeAvanzar(o, 'borrador_listo', 'finanzas', ['borrador']), { ok: true })
  assert.equal(puedeAvanzar(o, 'revisado', 'finanzas', ['borrador', 'formulario']).ok, false, 'no se salta pasos')
})

test('el borrador con pago exige valor', () => {
  const o = { estado: 'pendiente' as const, con_pago: true, valor_borrador: null }
  assert.equal(puedeAvanzar(o, 'borrador_listo', 'finanzas', ['borrador']).ok, false)
  assert.equal(puedeAvanzar({ ...o, con_pago: false }, 'borrador_listo', 'finanzas', ['borrador']).ok, true)
})

test('quién mueve cada paso', () => {
  const rev = { estado: 'revisado' as const, con_pago: false, valor_borrador: null }
  assert.equal(puedeAvanzar(rev, 'aprobado', 'finanzas', []).ok, false)
  assert.equal(puedeAvanzar(rev, 'aprobado', 'admin', []).ok, false, 'el admin técnico no aprueba')
  assert.equal(puedeAvanzar(rev, 'aprobado', 'gerencia', []).ok, true)
  assert.equal(puedeAvanzar({ ...rev, con_pago: true }, 'aprobado', 'gerencia', ['recibo']).ok, false, 'con pago se aprueba el pago')
  assert.equal(puedeAvanzar({ estado: 'pendiente', con_pago: true, valor_borrador: 5 }, 'borrador_listo', 'gerencia', ['borrador']).ok, false)
  assert.equal(puedeAvanzar({ estado: 'aprobado', con_pago: true, valor_borrador: 5 }, 'pagado', 'finanzas', ['comprobante']).ok, false, 'pagado va por el registro del pago')
  assert.equal(soporteExigido('aprobado', { con_pago: false }), null)
})

test('solo se devuelve antes de aprobar', () => {
  assert.equal(puedeDevolver({ estado: 'revisado', con_pago: true, valor_borrador: 1 }, 'finanzas').ok, true)
  assert.equal(puedeDevolver({ estado: 'aprobado', con_pago: true, valor_borrador: 1 }, 'finanzas').ok, false)
  assert.equal(puedeDevolver({ estado: 'revisado', con_pago: true, valor_borrador: 1 }, 'lectura').ok, false)
})

// ---------------------------------------------------------------- control

const OB: ObligacionControl = { id: 1, tipo: 'retefuente', concepto: 'Retención', entidad: 'DIAN', periodo: 'Octubre 2026', formulario: '350', estado: 'revisado', valor_borrador: 6_000_000 }
const CUENTAS: Cuenta[] = [
  { id: 10, alias: 'Corriente principal', banco: 'Bancolombia', tipo: 'corriente', ultimos: '4521', activa: true },
  { id: 11, alias: 'Vieja', banco: 'Davivienda', tipo: 'ahorros', ultimos: '0001', activa: false },
]
const ENTIDADES: Entidad[] = [
  { codigo: 'DIAN', nombre: 'DIAN', nit: '800197268-4', medio: 'PSE', formulario_pago: 'Recibo 490', activa: true },
  { codigo: 'SDH', nombre: 'Secretaría Distrital de Hacienda', nit: '899999061-9', medio: 'PSE', formulario_pago: 'Formulario de pago', activa: true },
]
const PAGO: PagoControl = { obligacion_id: 1, valor: 6_000_000, entidad: 'DIAN', referencia: '4910012345678', cuenta_id: 10, preparado_por: 'ana' }
const ok = (ch: ReturnType<typeof chequear>, id: string) => ch.find((c) => c.id === id)!.ok

test('pago correcto: listo para aprobar, no para pagar sin visto bueno', () => {
  const ch = chequear({ obligacion: OB, pago: PAGO, otrosPagos: [], cuentas: CUENTAS, entidades: ENTIDADES })
  assert.equal(listoParaAprobar(ch), true)
  assert.equal(listoParaPagar(ch), false)
  assert.equal(ok(ch, 'aprobacion'), null)
  const aprobado = chequear({ obligacion: OB, pago: { ...PAGO, aprobado_por: 'gerente', aprobado_rol: 'gerencia' }, otrosPagos: [], cuentas: CUENTAS, entidades: ENTIDADES })
  assert.equal(listoParaPagar(aprobado), true)
})

test('pago duplicado: misma obligación, mismo periodo en otra obligación o referencia repetida', () => {
  const otro = { id: 7, obligacion_id: 1, tipo: 'retefuente', periodo: 'Octubre 2026', referencia: 'X999999', estado: 'pagado' }
  assert.equal(ok(chequear({ obligacion: OB, pago: PAGO, otrosPagos: [otro], cuentas: CUENTAS, entidades: ENTIDADES }), 'no_pagado'), false)
  const doble = { ...otro, obligacion_id: 2 }
  assert.equal(ok(chequear({ obligacion: OB, pago: PAGO, otrosPagos: [doble], cuentas: CUENTAS, entidades: ENTIDADES }), 'no_pagado'), false)
  const rechazado = { ...otro, estado: 'rechazado' }
  assert.equal(ok(chequear({ obligacion: OB, pago: PAGO, otrosPagos: [rechazado], cuentas: CUENTAS, entidades: ENTIDADES }), 'no_pagado'), true, 'un pago rechazado no cuenta')
  const mismaRef = { ...otro, obligacion_id: 3, tipo: 'iva', periodo: 'x', referencia: '491-0012345678', estado: 'aprobado' }
  assert.equal(ok(chequear({ obligacion: OB, pago: PAGO, otrosPagos: [mismaRef], cuentas: CUENTAS, entidades: ENTIDADES }), 'referencia_unica'), false)
  assert.equal(ok(chequear({ obligacion: { ...OB, estado: 'pagado' }, pago: PAGO, otrosPagos: [], cuentas: CUENTAS, entidades: ENTIDADES }), 'no_pagado'), false)
})

test('valor distinto al borrador, entidad equivocada y cuenta no autorizada', () => {
  const ch = chequear({ obligacion: OB, pago: { ...PAGO, valor: 6_000_001, entidad: 'SDH', cuenta_id: 11 }, otrosPagos: [], cuentas: CUENTAS, entidades: ENTIDADES })
  assert.equal(ok(ch, 'valor'), false)
  assert.match(ch.find((c) => c.id === 'valor')!.detalle, /diferencia de \$1/)
  assert.equal(ok(ch, 'entidad'), false)
  assert.equal(ok(ch, 'cuenta'), false)
  assert.equal(listoParaAprobar(ch), false)
  assert.equal(ok(chequear({ obligacion: OB, pago: { ...PAGO, cuenta_id: 99 }, otrosPagos: [], cuentas: CUENTAS, entidades: ENTIDADES }), 'cuenta'), false)
  assert.equal(ok(chequear({ obligacion: OB, pago: { ...PAGO, referencia: '12' }, otrosPagos: [], cuentas: CUENTAS, entidades: ENTIDADES }), 'referencia'), false)
})

test('quien prepara no aprueba', () => {
  assert.equal(puedeAprobar(PAGO, 'ana', 'gerencia').ok, false)
  assert.equal(puedeAprobar(PAGO, 'gerente', 'admin').ok, false)
  assert.equal(puedeAprobar({ ...PAGO, estado: 'por_aprobar' }, 'gerente', 'gerencia').ok, true)
  assert.equal(puedeAprobar({ ...PAGO, estado: 'rechazado' }, 'gerente', 'gerencia').ok, false)
  const mismo = chequear({ obligacion: OB, pago: { ...PAGO, aprobado_por: 'ana', aprobado_rol: 'gerencia' }, otrosPagos: [], cuentas: CUENTAS, entidades: ENTIDADES })
  assert.equal(ok(mismo, 'aprobacion'), false)
})

test('lista de verificación con los datos exactos', () => {
  const pasos = listaVerificacion({ obligacion: OB, pago: PAGO, cuenta: CUENTAS[0]!, entidad: ENTIDADES[0]!, nit: '900659506', dv: '9' })
  assert.ok(pasos.some((p) => p.texto.includes('900659506-9')))
  assert.ok(pasos.some((p) => p.texto.includes('$6.000.000')))
  assert.ok(pasos.some((p) => p.texto.includes('terminada en 4521')))
  assert.equal(verificacionCompleta(pasos, pasos.slice(1).map((p) => p.id)), false)
  assert.equal(verificacionCompleta(pasos, pasos.map((p) => p.id)), true)
  assert.equal(pesos(1234567), '$1.234.567')
})

// ---------------------------------------------------------------- avisos

test('avisos a 15, 7, 3 y 1 día hábil, con escalamiento desde 3', () => {
  // Vence el jueves 19 de noviembre de 2026.
  const o = { id: 5, vence: '2026-11-19', estado: 'pendiente' }
  const nada = new Set<string>()
  assert.equal(avisoDelDia(o, '2026-10-26', nada), null, 'más de 15 días hábiles')
  assert.deepEqual(avisoDelDia(o, '2026-10-27', nada), { obligacion_id: 5, umbral: 15, restantes: 15, escalar: false, clave: 'ob:5:15' })
  assert.equal(avisoDelDia(o, '2026-10-28', new Set([claveAviso(5, 15)])), null, 'no repite')
  assert.equal(avisoDelDia(o, '2026-11-10', nada)!.umbral, 7)
  const a3 = avisoDelDia(o, '2026-11-13', nada)!
  assert.equal(a3.umbral, 3)
  assert.equal(a3.escalar, true)
  assert.equal(avisoDelDia(o, '2026-11-18', nada)!.umbral, 1)
  assert.equal(avisoDelDia(o, '2026-11-19', nada)!.umbral, 1, 'vence hoy cuenta como el de 1 día')
  assert.equal(avisoDelDia(o, '2026-11-20', nada), null, 'vencida: va en el resumen')
  assert.equal(avisoDelDia({ ...o, estado: 'presentado' }, '2026-11-13', nada), null, 'cerrada no avisa')
})

test('si la tarea no corrió, se envía el umbral más cercano, no todos', () => {
  const o = { id: 9, vence: '2026-11-19', estado: 'revisado' }
  const avisos = avisosDelDia([o], '2026-11-16', new Set())
  assert.equal(avisos.length, 1)
  assert.equal(avisos[0]!.umbral, 3)
})

test('niveles, textos y días de resumen', () => {
  assert.equal(nivel({ id: 1, vence: '2026-11-19', estado: 'pendiente' }, '2026-11-17'), 'urgente')
  assert.equal(nivel({ id: 1, vence: '2026-11-19', estado: 'pendiente' }, '2026-11-20'), 'vencida')
  assert.equal(nivel({ id: 1, vence: '', estado: 'pendiente' }, '2026-11-20'), 'sin_fecha')
  assert.equal(textoPlazo(0), 'Vence hoy')
  assert.equal(textoPlazo(-3), 'Vencida hace 3 días hábiles')
  assert.deepEqual(resumenesDeHoy('2026-11-30'), { semanal: true, mensual: false })
  assert.deepEqual(resumenesDeHoy('2026-12-01'), { semanal: false, mensual: true })
})
