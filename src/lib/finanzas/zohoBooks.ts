/**
 * Cifras de Zoho Books para el resumen mensual: facturación, recaudo y
 * cartera. Solo lectura. Usa el cliente de src/lib/zoho.ts; si faltan las
 * credenciales (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN,
 * ZOHO_BOOKS_ORG_ID), devuelve `null` y el resumen sale sin cifras.
 *
 * Permiso mínimo del self client: ZohoBooks.invoices.READ y
 * ZohoBooks.customerpayments.READ.
 */
import { booksConfigured, booksFetch } from '../zoho.ts'

export interface CifrasBooks {
  mes: string
  facturado: number
  facturas: number
  recaudado: number
  cartera: number
  carteraVencida: number
}

const MAX_PAGINAS = 10

/** Recorre las páginas de un listado de Books (200 por página). */
async function todas(path: string, clave: string): Promise<any[]> {
  const out: any[] = []
  for (let page = 1; page <= MAX_PAGINAS; page++) {
    const sep = path.includes('?') ? '&' : '?'
    const r = await booksFetch(`${path}${sep}per_page=200&page=${page}`)
    if (r.status !== 200 || r.body?.code !== 0) throw new Error(`Zoho Books respondió ${r.status}: ${r.body?.message || 'sin detalle'}`)
    out.push(...(r.body?.[clave] ?? []))
    if (!r.body?.page_context?.has_more_page) break
  }
  return out
}

const suma = (xs: any[], campo: string) => Math.round(xs.reduce((a, x) => a + (Number(x?.[campo]) || 0), 0))

/** Cifras de un mes (`AAAA-MM`). La cartera es a hoy. */
export async function cifrasDelMes(mes: string): Promise<CifrasBooks | null> {
  if (!booksConfigured()) return null
  const [a, m] = mes.split('-').map(Number) as [number, number]
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate()
  const desde = `${mes}-01`
  const hasta = `${mes}-${String(ultimo).padStart(2, '0')}`
  const [facturas, pagos, pendientes, vencidas] = await Promise.all([
    todas(`invoices?date_start=${desde}&date_end=${hasta}`, 'invoices'),
    todas(`customerpayments?date_start=${desde}&date_end=${hasta}`, 'customerpayments'),
    todas('invoices?filter_by=Status.Unpaid', 'invoices'),
    todas('invoices?filter_by=Status.Overdue', 'invoices'),
  ])
  const validas = facturas.filter((f) => !['void', 'draft'].includes(String(f.status)))
  return {
    mes,
    facturado: suma(validas, 'total'),
    facturas: validas.length,
    recaudado: suma(pagos, 'amount'),
    cartera: suma(pendientes, 'balance'),
    carteraVencida: suma(vencidas, 'balance'),
  }
}
