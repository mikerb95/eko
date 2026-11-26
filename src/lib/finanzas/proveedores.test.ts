import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compraDeSiigo, cxpDeSiigo, egresoDeSiigo, normDoc, normNit, revisar, verificarPago, type Compra, type CuentaPorPagar, type Egreso } from './proveedores.ts'

const HOY = '2026-11-25'
const compra = (o: Partial<Compra>): Compra => ({ id: o.nombre ?? 'x', nombre: 'FC-1-1', fecha: '2026-11-01', proveedor: '900111222', facturaProveedor: '', total: 1_000_000, saldo: 1_000_000, ...o })
const cxp = (o: Partial<CuentaPorPagar>): CuentaPorPagar => ({ documento: 'FC-1-1', cuota: 1, vence: '2026-12-31', saldo: 1_000_000, proveedor: '900111222', proveedorNombre: 'Transportes Andinos SAS', centroCosto: '', ...o })
const egreso = (o: Partial<Egreso>): Egreso => ({ id: o.nombre ?? 'e', nombre: 'RP-1-1', fecha: '2026-11-10', proveedor: '900111222', valor: 500_000, aplicado: [], ...o })
const tipos = (r: ReturnType<typeof revisar>) => r.alertas.map((a) => a.tipo)

test('normaliza documentos y NIT', () => {
  assert.equal(normDoc('FC-01-073'), normDoc('fc 1 73'))
  assert.equal(normDoc(''), '')
  assert.equal(normNit('900.111.222'), '900111222')
  assert.equal(normNit('0900111222'), '900111222')
})

test('factura del proveedor registrada dos veces es grave', () => {
  const r = revisar({
    compras: [compra({ nombre: 'FC-1-10', facturaProveedor: 'FE-55' }), compra({ nombre: 'FC-1-11', facturaProveedor: 'fe 55', fecha: '2026-11-20' })],
    cxp: [],
    egresos: [],
    hoy: HOY,
  })
  assert.deepEqual(tipos(r), ['factura_repetida'])
  assert.equal(r.alertas[0]!.grave, true)
  assert.equal(r.totales.graves, 1)
})

test('mismo valor y fecha cercana sin número de factura: revisar; con números distintos: normal', () => {
  const sinNumero = revisar({ compras: [compra({ nombre: 'FC-1-10' }), compra({ nombre: 'FC-1-11', fecha: '2026-11-03' })], cxp: [], egresos: [], hoy: HOY })
  assert.deepEqual(tipos(sinNumero), ['posible_duplicado'])
  assert.equal(sinNumero.alertas[0]!.grave, false)
  const distintas = revisar({ compras: [compra({ nombre: 'FC-1-10', facturaProveedor: 'FE-1' }), compra({ nombre: 'FC-1-11', facturaProveedor: 'FE-2', fecha: '2026-11-03' })], cxp: [], egresos: [], hoy: HOY })
  assert.deepEqual(tipos(distintas), [])
  const lejos = revisar({ compras: [compra({ nombre: 'FC-1-10' }), compra({ nombre: 'FC-1-11', fecha: '2026-11-20' })], cxp: [], egresos: [], hoy: HOY })
  assert.deepEqual(tipos(lejos), [])
  const otroProveedor = revisar({ compras: [compra({ nombre: 'FC-1-10' }), compra({ nombre: 'FC-1-11', proveedor: '800999888' })], cxp: [], egresos: [], hoy: HOY })
  assert.deepEqual(tipos(otroProveedor), [])
})

test('la factura repetida no se cuenta además como posible duplicado', () => {
  const r = revisar({ compras: [compra({ nombre: 'FC-1-10', facturaProveedor: 'FE-55' }), compra({ nombre: 'FC-1-11', facturaProveedor: 'FE-55' })], cxp: [], egresos: [], hoy: HOY })
  assert.deepEqual(tipos(r), ['factura_repetida'])
})

test('más pagado que el valor de la factura', () => {
  const r = revisar({
    compras: [compra({ nombre: 'FC-1-10', total: 1_000_000 })],
    cxp: [],
    egresos: [
      egreso({ nombre: 'RP-1-1', valor: 600_000, aplicado: [{ documento: 'FC-1-10', valor: 600_000 }] }),
      egreso({ nombre: 'RP-1-2', fecha: '2026-11-20', valor: 600_000, aplicado: [{ documento: 'FC-1-10', valor: 600_000 }] }),
    ],
    hoy: HOY,
  })
  assert.ok(tipos(r).includes('pagada_de_mas'))
  const a = r.alertas.find((x) => x.tipo === 'pagada_de_mas')!
  assert.equal(a.valor, 200_000)
  assert.ok(a.detalle.includes('$200.000'))
})

test('dos egresos iguales en pocos días: pago doble, salvo que paguen facturas distintas', () => {
  const doble = revisar({ compras: [], cxp: [], egresos: [egreso({ nombre: 'RP-1-1' }), egreso({ nombre: 'RP-1-2', fecha: '2026-11-12' })], hoy: HOY })
  assert.deepEqual(tipos(doble), ['egreso_repetido'])
  const distintas = revisar({
    compras: [],
    cxp: [],
    egresos: [egreso({ nombre: 'RP-1-1', aplicado: [{ documento: 'FC-1-1', valor: 500_000 }] }), egreso({ nombre: 'RP-1-2', fecha: '2026-11-11', aplicado: [{ documento: 'FC-1-2', valor: 500_000 }] })],
    hoy: HOY,
  })
  assert.deepEqual(tipos(distintas), [])
  const lejos = revisar({ compras: [], cxp: [], egresos: [egreso({ nombre: 'RP-1-1' }), egreso({ nombre: 'RP-1-2', fecha: '2026-11-20' })], hoy: HOY })
  assert.deepEqual(tipos(lejos), [])
})

test('vencidas, por vencer y resumen por proveedor', () => {
  const r = revisar({
    compras: [],
    cxp: [
      cxp({ documento: 'FC-1-1', vence: '2026-11-20', saldo: 300_000 }),
      cxp({ documento: 'FC-1-2', vence: '2026-11-28', saldo: 200_000 }),
      cxp({ documento: 'FC-1-3', vence: '2027-01-15', saldo: 100_000 }),
      cxp({ documento: 'FC-1-4', vence: '2026-11-01', saldo: 0 }),
      cxp({ documento: 'FC-2-9', vence: '2026-12-20', saldo: 50_000, proveedor: '800999888', proveedorNombre: 'Papelería Centro' }),
    ],
    egresos: [],
    hoy: HOY,
  })
  assert.deepEqual(tipos(r), ['vencida', 'por_vencer'])
  assert.ok(r.alertas[0]!.detalle.includes('venció hace 5 días'))
  assert.deepEqual(r.totales, { porPagar: 650_000, vencido: 300_000, porVencer: 200_000, facturas: 4, graves: 0 })
  assert.equal(r.proveedores[0]!.nombre, 'Transportes Andinos SAS')
  assert.equal(r.proveedores[0]!.vencido, 300_000)
  assert.equal(r.proveedores[0]!.proximoVence, '2026-11-28')
  assert.equal(r.proveedores[1]!.nombre, 'Papelería Centro')
})

test('las alertas graves van primero', () => {
  const r = revisar({
    compras: [compra({ nombre: 'FC-1-10', facturaProveedor: 'FE-55' }), compra({ nombre: 'FC-1-11', facturaProveedor: 'FE-55' })],
    cxp: [cxp({ vence: '2026-11-01' })],
    egresos: [],
    hoy: HOY,
  })
  assert.deepEqual(tipos(r), ['factura_repetida', 'vencida'])
})

test('verificar un pago: todo en verde', () => {
  const v = verificarPago({
    nit: '900.111.222',
    factura: 'FE-55',
    valor: 1_000_000,
    compras: [compra({ nombre: 'FC-1-10', facturaProveedor: 'FE-55' })],
    cxp: [cxp({ documento: 'FC-1-10' })],
    egresos: [],
    hoy: HOY,
  })
  assert.equal(v.ok, true, JSON.stringify(v.chequeos))
  assert.equal(v.proveedorNombre, 'Transportes Andinos SAS')
})

test('verificar un pago: abono menor al saldo es válido; por el comprobante de Siigo también la encuentra', () => {
  const v = verificarPago({ nit: '900111222', factura: 'FC-1-10', valor: 400_000, compras: [compra({ nombre: 'FC-1-10' })], cxp: [cxp({ documento: 'FC-1-10' })], egresos: [], hoy: HOY })
  assert.equal(v.ok, true)
  assert.ok(v.chequeos.find((c) => c.id === 'valor')!.detalle.includes('abono'))
})

test('verificar un pago: factura no registrada, ya pagada, valor mayor o pago reciente igual', () => {
  const base = { nit: '900111222', compras: [compra({ nombre: 'FC-1-10', facturaProveedor: 'FE-55' })], hoy: HOY }
  const noEsta = verificarPago({ ...base, factura: 'FE-99', valor: 1_000_000, cxp: [], egresos: [] })
  assert.equal(noEsta.chequeos.find((c) => c.id === 'registrada')!.ok, false)
  assert.equal(noEsta.ok, false)

  const pagada = verificarPago({ ...base, compras: [compra({ nombre: 'FC-1-10', facturaProveedor: 'FE-55', saldo: 0 })], factura: 'FE-55', valor: 1_000_000, cxp: [], egresos: [] })
  assert.equal(pagada.chequeos.find((c) => c.id === 'saldo')!.ok, false)

  const demas = verificarPago({ ...base, factura: 'FE-55', valor: 1_500_000, cxp: [cxp({ documento: 'FC-1-10' })], egresos: [] })
  const ch = demas.chequeos.find((c) => c.id === 'valor')!
  assert.equal(ch.ok, false)
  assert.ok(ch.detalle.includes('$500.000'))

  const reciente = verificarPago({ ...base, factura: 'FE-55', valor: 1_000_000, cxp: [cxp({ documento: 'FC-1-10' })], egresos: [egreso({ nombre: 'RP-1-7', fecha: '2026-11-24', valor: 1_000_000 })] })
  assert.equal(reciente.chequeos.find((c) => c.id === 'sin_pago_reciente')!.ok, false)
})

test('verificar un pago: factura dos veces en Siigo', () => {
  const v = verificarPago({
    nit: '900111222',
    factura: 'FE-55',
    valor: 1_000_000,
    compras: [compra({ nombre: 'FC-1-10', facturaProveedor: 'FE-55' }), compra({ nombre: 'FC-1-11', facturaProveedor: 'FE-55' })],
    cxp: [cxp({ documento: 'FC-1-10' })],
    egresos: [],
    hoy: HOY,
  })
  assert.equal(v.chequeos.find((c) => c.id === 'unica')!.ok, false)
})

test('mapea las respuestas de Siigo (formato del blueprint oficial)', () => {
  const c = compraDeSiigo({ id: 'g1', name: 'FC-1-73', date: '2026-11-03', supplier: { identification: '900111222', branch_office: 0 }, provider_invoice: { prefix: 'FE', number: '1234' }, total: 2546.05, balance: 2546.05 })
  assert.deepEqual(c, { id: 'g1', nombre: 'FC-1-73', fecha: '2026-11-03', proveedor: '900111222', facturaProveedor: 'FE-1234', total: 2546.05, saldo: 2546.05 })
  assert.equal(compraDeSiigo({ provider_invoice: null }).facturaProveedor, '')

  const x = cxpDeSiigo({ due: { prefix: 'FC-1', consecutive: 68, quote: 1, date: '2026-12-01', balance: 119000 }, provider: { identification: '209048401', name: 'Raul Perez ' }, cost_center: { code: '13-1', name: 'Principal' } })
  assert.deepEqual(x, { documento: 'FC-1-68', cuota: 1, vence: '2026-12-01', saldo: 119000, proveedor: '209048401', proveedorNombre: 'Raul Perez', centroCosto: 'Principal' })

  const e = egresoDeSiigo({ id: 'r1', name: 'RP-2-22', date: '2026-11-15', supplier: { identification: '209048401' }, items: [{ due: { prefix: 'FC-1', consecutive: 68, quote: 1 }, value: 119000 }], payment: { id: 5636, name: 'Bancolombia', value: 119000 } })
  assert.deepEqual(e, { id: 'r1', nombre: 'RP-2-22', fecha: '2026-11-15', proveedor: '209048401', valor: 119000, aplicado: [{ documento: 'FC-1-68', valor: 119000 }] })
  // El egreso FC-1-68 se cruza con la compra FC-1-68.
  assert.equal(normDoc(e.aplicado[0]!.documento), normDoc('FC-1-68'))
})
