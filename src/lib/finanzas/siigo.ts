/**
 * Lo que Finanzas le pide a Siigo: cifras del mes, la revisión de pagos a
 * proveedores, el chequeo de un pago antes de hacerlo y el balance de prueba
 * en Excel. Nada aquí crea, cambia ni borra información contable en Siigo; el
 * balance es un reporte que Siigo genera. Las reglas viven en proveedores.ts
 * (puro); esto solo trae los datos.
 *
 * Gasto de peticiones (tope de Siigo: 100 por minuto): una consulta completa
 * hace 5 listados (compras, cuentas por pagar, egresos, ventas y compras del
 * mes) de hasta 20 páginas de 100; en una empresa como Ekosolv son unas 5 a
 * 15 peticiones. Por eso se pide con un botón o una vez por semana, nunca al
 * abrir el panel ni con sondeo.
 *
 * Fechas: Siigo acepta en los listados `yyyy-MM-dd` o fecha y hora UTC
 * `yyyy-MM-ddTHH:mm:ssZ`. El listado de compras no está en la referencia
 * pública y un cliente comunitario que lo probó solo usa fecha y hora, así
 * que a compras se le manda fecha y hora y, si Siigo responde 400, se
 * reintenta una vez con la fecha sola.
 */
import { SiigoError, siigoConfigurado, siigoFetch, siigoTodas } from '../siigo.ts'
import { compraDeSiigo, cxpDeSiigo, egresoDeSiigo, revisar, verificarPago, type Compra, type CuentaPorPagar, type Egreso } from './proveedores.ts'

export { siigoConfigurado }

/** Días hacia atrás de compras y egresos para buscar duplicados. */
export const DIAS_ATRAS = 120
/** Para verificar un pago se mira más atrás: una factura vieja puede seguir con saldo. */
export const DIAS_VERIFICAR = 400

const masDias = (iso: string, d: number) => {
  const x = new Date(`${iso}T12:00:00Z`)
  x.setUTCDate(x.getUTCDate() + d)
  return x.toISOString().slice(0, 10)
}

/** Compras por fecha del documento, con el respaldo de formato descrito arriba. */
export async function comprasEntre(desde: string, hasta: string, maxPaginas?: number) {
  try {
    return await siigoTodas('/v1/purchases', { date_start: `${desde}T00:00:00Z`, date_end: `${hasta}T23:59:59Z` }, maxPaginas)
  } catch (e) {
    if (!(e instanceof SiigoError) || e.status !== 400) throw e
    return siigoTodas('/v1/purchases', { date_start: desde, date_end: hasta }, maxPaginas)
  }
}

export interface DatosProveedores {
  compras: Compra[]
  cxp: CuentaPorPagar[]
  egresos: Egreso[]
  /** Algún listado llegó al tope de páginas: los totales pueden estar incompletos. */
  truncado: boolean
  desde: string
}

export async function traerProveedores(hoy: string, diasAtras = DIAS_ATRAS): Promise<DatosProveedores> {
  const desde = masDias(hoy, -diasAtras)
  // En serie y no en paralelo: son pocas peticiones y así no se acercan al tope por minuto.
  const compras = await comprasEntre(desde, hoy)
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

/** Máximo de terceros que se buscan por NIT para ponerle nombre a una alerta. */
const MAX_NOMBRES = 10

/** Nombre del tercero en Siigo (`name` es una lista: razón social o nombres y apellidos). */
async function nombreTercero(nit: string): Promise<string> {
  const r = await siigoFetch('/v1/customers', { query: { identification: nit } })
  const t = Array.isArray(r?.results) ? r.results[0] : null
  const nombre = Array.isArray(t?.name) ? t.name.filter(Boolean).join(' ') : String(t?.name || '')
  return (nombre || String(t?.commercial_name || '')).trim()
}

async function revisionDe(d: DatosProveedores, hoy: string) {
  const entrada = { compras: d.compras, cxp: d.cxp, egresos: d.egresos, hoy }
  let r = revisar(entrada)
  // Las alertas de proveedores sin saldo pendiente no traen nombre (sale de lo
  // por pagar): se buscan por NIT, pocos y sin tumbar la revisión si fallan.
  const sinNombre = [...new Set(r.alertas.filter((a) => a.proveedorNombre === `NIT ${a.proveedor}`).map((a) => a.proveedor))].slice(0, MAX_NOMBRES)
  if (sinNombre.length) {
    const nombres = new Map<string, string>()
    for (const nit of sinNombre) {
      try {
        const n = await nombreTercero(nit)
        if (n) nombres.set(nit, n)
      } catch (e: any) {
        console.error('[finanzas/siigo] nombre del tercero', e?.message || e)
        break
      }
    }
    if (nombres.size) r = revisar({ ...entrada, nombres })
  }
  return { ...r, truncado: d.truncado, desde: d.desde, consultado: new Date().toISOString() }
}

export async function revisionProveedores(hoy: string) {
  return revisionDe(await traerProveedores(hoy), hoy)
}

/** Lo que muestra la pestaña Proveedores: revisión y cifras del mes, sin pedir dos veces lo por pagar. */
export async function revisionYCifras(hoy: string, mes: string) {
  const d = await traerProveedores(hoy)
  return { revision: await revisionDe(d, hoy), cifras: await cifrasDelMes(mes, hoy, d.cxp) }
}

export async function verificarPagoProveedor(hoy: string, p: { nit: string; factura: string; valor: number }) {
  const d = await traerProveedores(hoy, DIAS_VERIFICAR)
  return { ...verificarPago({ ...p, compras: d.compras, cxp: d.cxp, egresos: d.egresos, hoy, desde: d.desde }), incompleto: d.truncado }
}

export interface CifrasSiigo {
  mes: string
  /** Facturas de venta no anuladas, antes de notas crédito. */
  ventas: number
  facturasVenta: number
  /** Facturas de compra registradas (no incluye documentos soporte). */
  compras: number
  facturasCompra: number
  /** Recibos de pago o egreso del mes, a cualquier tercero. */
  pagos: number
  egresos: number
  porPagar: number
  porPagarVencido: number
  truncado: boolean
}

const suma = (xs: any[], f: (x: any) => number) => Math.round(xs.reduce((a, x) => a + (f(x) || 0), 0))

/**
 * Cifras de un mes (`AAAA-MM`). Lo por pagar es a hoy. `null` si Siigo no
 * está conectado. `pendientes` evita volver a pedir las cuentas por pagar.
 */
export async function cifrasDelMes(mes: string, hoy: string, pendientes?: CuentaPorPagar[]): Promise<CifrasSiigo | null> {
  if (!siigoConfigurado()) return null
  const [a, m] = mes.split('-').map(Number) as [number, number]
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate()
  const desde = `${mes}-01`
  const hasta = `${mes}-${String(ultimo).padStart(2, '0')}`
  const ventas = await siigoTodas('/v1/invoices', { date_start: desde, date_end: hasta })
  const compras = await comprasEntre(desde, hasta)
  // Un egreso del mes se pudo crear después (registro tardío): se mira un mes más de creación.
  const egresos = await siigoTodas('/v1/payment-receipts', { created_start: desde, created_end: masDias(hasta, 31) })
  let pend = pendientes
  let cxpTruncado = false
  if (!pend) {
    const cxp = await siigoTodas('/v1/accounts-payable')
    pend = cxp.filas.map(cxpDeSiigo)
    cxpTruncado = cxp.truncado
  }
  const validas = ventas.filas.filter((f) => !f?.annulled)
  const egMes = egresos.filas.map(egresoDeSiigo).filter((e) => e.fecha >= desde && e.fecha <= hasta)
  return {
    mes,
    ventas: suma(validas, (f) => Number(f.total)),
    facturasVenta: validas.length,
    compras: suma(compras.filas, (f) => Number(f.total)),
    facturasCompra: compras.filas.length,
    pagos: suma(egMes, (e) => e.valor),
    egresos: egMes.length,
    porPagar: suma(pend, (c) => c.saldo),
    porPagarVencido: suma(pend.filter((c) => c.vence && c.vence < hoy), (c) => c.saldo),
    truncado: ventas.truncado || compras.truncado || egresos.truncado || cxpTruncado,
  }
}

/**
 * Balance de prueba en Excel. Siigo lo genera y devuelve un enlace de
 * descarga; no cambia nada en la contabilidad. Con `nit`, es el balance por
 * tercero de ese NIT. `mesFin` 13 es el periodo de cierre.
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
