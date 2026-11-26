/**
 * Lo que Finanzas le pide a Siigo: cifras del mes, la revisión de pagos a
 * proveedores, el chequeo de un pago antes de hacerlo y el balance de prueba
 * en Excel. Solo lectura: nada aquí crea, cambia ni borra información
 * contable en Siigo. Las reglas viven en proveedores.ts (puro); esto solo trae
 * los datos.
 *
 * Gasto de peticiones (tope de Siigo: 100 por minuto): una revisión completa
 * hace 3 listados de hasta 20 páginas de 100; en una empresa como Ekosolv son
 * de 3 a 10 peticiones. Por eso se pide con un botón o una vez por semana,
 * nunca al abrir el panel ni con sondeo.
 */
import { siigoConfigurado, siigoFetch, siigoTodas } from '../siigo.ts'
import { compraDeSiigo, cxpDeSiigo, egresoDeSiigo, revisar, verificarPago, type Compra, type CuentaPorPagar, type Egreso } from './proveedores.ts'

export { siigoConfigurado }

/** Cuántos días hacia atrás se miran compras y egresos para buscar duplicados. */
export const DIAS_ATRAS = 120

const masDias = (iso: string, d: number) => {
  const x = new Date(`${iso}T12:00:00Z`)
  x.setUTCDate(x.getUTCDate() + d)
  return x.toISOString().slice(0, 10)
}

export interface DatosProveedores {
  compras: Compra[]
  cxp: CuentaPorPagar[]
  egresos: Egreso[]
  /** Algún listado llegó al tope de páginas: los totales pueden estar incompletos. */
  truncado: boolean
  desde: string
}

export async function traerProveedores(hoy: string): Promise<DatosProveedores> {
  const desde = masDias(hoy, -DIAS_ATRAS)
  // En serie y no en paralelo: son pocas peticiones y así no se acercan al tope por minuto.
  const compras = await siigoTodas('/v1/purchases', { date_start: desde, date_end: hoy })
  const cxp = await siigoTodas('/v1/accounts-payable')
  // Los egresos solo se filtran por fecha de creación; se corta por la del documento después.
  const egresos = await siigoTodas('/v1/payment-receipts', { created_start: desde })
  return {
    compras: compras.filas.map(compraDeSiigo),
    cxp: cxp.filas.map(cxpDeSiigo),
    egresos: egresos.filas.map(egresoDeSiigo).filter((e) => !e.fecha || e.fecha >= desde),
    truncado: compras.truncado || cxp.truncado || egresos.truncado,
    desde,
  }
}

export async function revisionProveedores(hoy: string) {
  const d = await traerProveedores(hoy)
  return { ...revisar({ compras: d.compras, cxp: d.cxp, egresos: d.egresos, hoy }), truncado: d.truncado, desde: d.desde, consultado: new Date().toISOString() }
}

export async function verificarPagoProveedor(hoy: string, p: { nit: string; factura: string; valor: number }) {
  const d = await traerProveedores(hoy)
  return verificarPago({ ...p, compras: d.compras, cxp: d.cxp, egresos: d.egresos, hoy })
}

export interface CifrasSiigo {
  mes: string
  ventas: number
  facturasVenta: number
  compras: number
  facturasCompra: number
  pagadoProveedores: number
  egresos: number
  porPagar: number
  porPagarVencido: number
  truncado: boolean
}

const suma = (xs: any[], f: (x: any) => number) => Math.round(xs.reduce((a, x) => a + (f(x) || 0), 0))

/** Cifras de un mes (`AAAA-MM`). Lo por pagar es a hoy. `null` si Siigo no está conectado. */
export async function cifrasDelMes(mes: string, hoy: string): Promise<CifrasSiigo | null> {
  if (!siigoConfigurado()) return null
  const [a, m] = mes.split('-').map(Number) as [number, number]
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate()
  const desde = `${mes}-01`
  const hasta = `${mes}-${String(ultimo).padStart(2, '0')}`
  const ventas = await siigoTodas('/v1/invoices', { date_start: desde, date_end: hasta })
  const compras = await siigoTodas('/v1/purchases', { date_start: desde, date_end: hasta })
  // Un egreso del mes se pudo crear después (registro tardío): se mira un mes más de creación.
  const egresos = await siigoTodas('/v1/payment-receipts', { created_start: desde, created_end: masDias(hasta, 31) })
  const cxp = await siigoTodas('/v1/accounts-payable')
  const validas = ventas.filas.filter((f) => !f?.annulled)
  const egMes = egresos.filas.map(egresoDeSiigo).filter((e) => e.fecha >= desde && e.fecha <= hasta)
  const pend = cxp.filas.map(cxpDeSiigo)
  return {
    mes,
    ventas: suma(validas, (f) => Number(f.total)),
    facturasVenta: validas.length,
    compras: suma(compras.filas, (f) => Number(f.total)),
    facturasCompra: compras.filas.length,
    pagadoProveedores: suma(egMes, (e) => e.valor),
    egresos: egMes.length,
    porPagar: suma(pend, (c) => c.saldo),
    porPagarVencido: suma(pend.filter((c) => c.vence && c.vence < hoy), (c) => c.saldo),
    truncado: ventas.truncado || compras.truncado || egresos.truncado || cxp.truncado,
  }
}

/**
 * Balance de prueba en Excel. Siigo lo genera y devuelve un enlace de
 * descarga; no cambia nada en la contabilidad. Con `nit`, es el balance por
 * tercero de ese NIT. `mes_fin` 13 es el periodo de cierre.
 */
export async function balancePrueba(p: { anio: number; mesInicio: number; mesFin: number; nit?: string; cuentaDesde?: string; cuentaHasta?: string }): Promise<{ url: string; id: string }> {
  const cuerpo: Record<string, unknown> = {
    year: p.anio,
    month_start: p.mesInicio,
    month_end: p.mesFin,
    includes_tax_difference: false,
  }
  if (p.cuentaDesde) cuerpo.account_start = p.cuentaDesde
  if (p.cuentaHasta) cuerpo.account_end = p.cuentaHasta
  const porTercero = !!p.nit
  if (porTercero) cuerpo.customer = { identification: p.nit }
  const r = await siigoFetch(porTercero ? '/v1/test-balance-report-by-thirdparty' : '/v1/test-balance-report', { metodo: 'POST', cuerpo })
  if (!r?.file_url) throw new Error('Siigo no devolvió el enlace del balance.')
  return { url: String(r.file_url), id: String(r.file_id || '') }
}
