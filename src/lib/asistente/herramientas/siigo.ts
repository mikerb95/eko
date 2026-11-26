// Consulta de Siigo (contabilidad de Ekosolv) para el asistente del panel.
// Solo lectura y solo para admin y finanzas (permisos.ts): son cifras de
// dinero y saldos con proveedores.
//
// Las reglas (vencidas, duplicados, pagos de más) las calcula
// src/lib/finanzas/proveedores.ts, nunca el modelo. Cada llamada gasta
// peticiones del tope de Siigo (100 por minuto), así que hay una sola
// herramienta con un `que` y no una por listado.
//
// Nombres: los listados de compras y de ventas de Siigo traen solo el NIT del
// tercero. Los nombres de proveedores salen de las cuentas por pagar; los de
// clientes no están, así que en ventas se filtra solo por NIT.

import { z } from 'zod'
import { siigoConfigurado, siigoTodas } from '../../siigo.ts'
import { cifrasDelMes, comprasEntre, revisionProveedores, traerProveedores, DIAS_VERIFICAR } from '../../finanzas/siigo.ts'
import { compraDeSiigo, cxpDeSiigo, normNit, verificarPago } from '../../finanzas/proveedores.ts'
import { fallo, ok, type Herramienta } from './tipos.ts'

const ENLACE = '/admin/finanzas'

const esquema = z.object({
  que: z
    .enum(['cuentas_por_pagar', 'alertas', 'cifras_mes', 'compras', 'ventas', 'verificar_pago'])
    .describe('Qué consultar en Siigo'),
  tercero: z
    .string()
    .trim()
    .max(80)
    .optional()
    .describe('NIT (solo números) o parte del nombre del proveedor, para filtrar. En ventas, solo el NIT del cliente. En verificar_pago, el NIT del proveedor.'),
  mes: z.string().regex(/^\d{4}-\d{2}$/).optional().describe('Mes AAAA-MM para cifras_mes, compras o ventas (por defecto el actual)'),
  factura: z.string().trim().max(40).optional().describe('Solo verificar_pago: número de la factura del proveedor (FE-123) o comprobante de Siigo (FC-1-73)'),
  valor: z.number().positive().optional().describe('Solo verificar_pago: valor en pesos que se piensa pagar'),
})

const plano = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

function rangoMes(mes: string) {
  const [a, m] = mes.split('-').map(Number) as [number, number]
  return { desde: `${mes}-01`, hasta: `${mes}-${String(new Date(Date.UTC(a, m, 0)).getUTCDate()).padStart(2, '0')}` }
}

export const SIIGO: Herramienta = {
  nombre: 'siigo',
  area: 'siigo',
  descripcion:
    'Contabilidad de Ekosolv en Siigo Nube, solo lectura: cuentas por pagar a proveedores con vencimientos, alertas de posibles pagos o registros dobles, cifras de un mes (ventas antes de notas crédito, facturas de compra, egresos), facturas de compra o de venta de un mes, y verificar_pago (antes de pagarle a un proveedor: factura registrada una vez, saldo, valor y pagos iguales recientes). Úsela para "¿qué le debemos a X?", "¿qué está vencido con proveedores?", "¿cuánto facturamos en octubre?" o "¿puedo pagarle la factura FE-123 a X por $Y?". No registra ni paga nada en Siigo.',
  esquema,
  async ejecutar(args: z.infer<typeof esquema>, { hoy }) {
    if (!siigoConfigurado()) return fallo('Siigo no está conectado todavía: faltan las credenciales de la API.')
    const mes = args.mes || hoy.slice(0, 7)
    const t = args.tercero || ''
    const porNit = t.replace(/\D/g, '').length >= 5 ? normNit(t) : ''
    const porNombre = t && !porNit ? plano(t) : ''
    const coincide = (nit: string, nombre: string) => (porNit ? normNit(nit) === porNit : porNombre ? plano(nombre).includes(porNombre) : true)

    if (args.que === 'cuentas_por_pagar' || args.que === 'alertas') {
      const r = await revisionProveedores(hoy)
      if (args.que === 'alertas') {
        return ok({ hoy, enlace: ENLACE, incompleto: r.truncado, alertas: r.alertas.filter((a) => coincide(a.proveedor, a.proveedorNombre)).slice(0, 40) })
      }
      return ok({ hoy, enlace: ENLACE, incompleto: r.truncado, totales: r.totales, proveedores: r.proveedores.filter((p) => coincide(p.proveedor, p.nombre)).slice(0, 40) })
    }

    if (args.que === 'cifras_mes') {
      return ok({ enlace: ENLACE, cifras: await cifrasDelMes(mes, hoy) })
    }

    if (args.que === 'compras') {
      const { desde, hasta } = rangoMes(mes)
      const r = await comprasEntre(desde, hasta, 5)
      // Nombres de proveedor desde lo por pagar (las compras traen solo el NIT).
      const nombres = new Map<string, string>()
      if (r.filas.length) {
        for (const c of (await siigoTodas('/v1/accounts-payable', {}, 5)).filas.map(cxpDeSiigo)) if (c.proveedorNombre) nombres.set(c.proveedor, c.proveedorNombre)
      }
      const filas = r.filas
        .map(compraDeSiigo)
        .map((c) => ({ comprobante: c.nombre, fecha: c.fecha, proveedorNit: c.proveedor, proveedor: nombres.get(c.proveedor) ?? null, facturaProveedor: c.facturaProveedor || null, total: c.total, saldo: c.saldo }))
        .filter((c) => coincide(c.proveedorNit, c.proveedor ?? ''))
      const aviso = porNombre && !filas.length ? 'Ninguna compra coincide por nombre. Los nombres salen de las cuentas por pagar; si el proveedor no tiene saldo, busque por NIT.' : null
      return ok({ mes, enlace: ENLACE, incompleto: r.truncado, aviso, cantidad: filas.length, total: Math.round(filas.reduce((a, f) => a + f.total, 0)), documentos: filas.slice(0, 50) })
    }

    if (args.que === 'ventas') {
      if (porNombre) return fallo('Siigo no trae el nombre del cliente en el listado de ventas: filtre por el NIT del cliente.')
      const { desde, hasta } = rangoMes(mes)
      const r = await siigoTodas('/v1/invoices', { date_start: desde, date_end: hasta }, 5)
      const filas = r.filas
        .filter((f: any) => !f?.annulled)
        .map((f: any) => ({ factura: String(f.name || ''), fecha: String(f.date || ''), clienteNit: normNit(String(f.customer?.identification || '')), total: Number(f.total) || 0, saldo: Number(f.balance) || 0 }))
        .filter((f) => coincide(f.clienteNit, ''))
      return ok({ mes, enlace: ENLACE, incompleto: r.truncado, nota: 'Totales antes de notas crédito.', cantidad: filas.length, total: Math.round(filas.reduce((a, f) => a + f.total, 0)), documentos: filas.slice(0, 50) })
    }

    // verificar_pago
    if (!porNit || !args.factura || !args.valor) return fallo('Para verificar un pago necesito el NIT del proveedor (solo números), la factura y el valor.')
    const d = await traerProveedores(hoy, DIAS_VERIFICAR)
    return ok({ enlace: ENLACE, incompleto: d.truncado, ...verificarPago({ nit: porNit, factura: args.factura, valor: args.valor, compras: d.compras, cxp: d.cxp, egresos: d.egresos, hoy, desde: d.desde }) })
  },
}
