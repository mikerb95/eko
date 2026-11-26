// Consulta de Siigo (contabilidad de Ekosolv) para el asistente del panel.
// Solo lectura y solo para admin, finanzas y gerencia (permisos.ts): son
// cifras de dinero y saldos con proveedores.
//
// Las reglas (vencidas, duplicados, pagos de más) las calcula
// src/lib/finanzas/proveedores.ts, nunca el modelo. Cada llamada gasta
// peticiones del tope de Siigo (100 por minuto), así que hay una sola
// herramienta con un `que` y no una por listado.

import { z } from 'zod'
import { siigoConfigurado, siigoTodas } from '../../siigo.ts'
import { cifrasDelMes, revisionProveedores, traerProveedores } from '../../finanzas/siigo.ts'
import { compraDeSiigo, normNit, verificarPago } from '../../finanzas/proveedores.ts'
import { fallo, ok, type Herramienta } from './tipos.ts'

const ENLACE = '/admin/finanzas'

const esquema = z.object({
  que: z
    .enum(['cuentas_por_pagar', 'alertas', 'cifras_mes', 'compras', 'ventas', 'verificar_pago'])
    .describe('Qué consultar en Siigo'),
  proveedor: z.string().trim().max(80).optional().describe('NIT (solo números) o parte del nombre del proveedor, para filtrar'),
  mes: z.string().regex(/^\d{4}-\d{2}$/).optional().describe('Mes AAAA-MM para cifras_mes, compras o ventas (por defecto el actual)'),
  factura: z.string().trim().max(40).optional().describe('Solo verificar_pago: número de la factura del proveedor o comprobante de Siigo (FC-1-73)'),
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
    'Contabilidad de Ekosolv en Siigo Nube, solo lectura: cuentas por pagar a proveedores con vencimientos, alertas de posibles pagos o registros dobles, cifras de un mes (ventas, compras, pagos a proveedores), facturas de compra o de venta de un mes, y verificar_pago (antes de pagarle a un proveedor: factura registrada una vez, saldo, valor y pagos iguales recientes). Úsela para "¿qué le debemos a X?", "¿qué está vencido con proveedores?", "¿cuánto facturamos en octubre?" o "¿puedo pagarle la factura FE-123 a X por $Y?". No registra ni paga nada.',
  esquema,
  async ejecutar(args: z.infer<typeof esquema>, { hoy }) {
    if (!siigoConfigurado()) return fallo('Siigo no está conectado todavía: faltan las credenciales de la API.')
    const mes = args.mes || hoy.slice(0, 7)
    const filtroProv = args.proveedor ? (args.proveedor.replace(/\D/g, '').length >= 5 ? { nit: normNit(args.proveedor) } : { nombre: plano(args.proveedor) }) : null
    const coincide = (nit: string, nombre: string) =>
      !filtroProv || ('nit' in filtroProv ? normNit(nit) === filtroProv.nit : plano(nombre).includes(filtroProv.nombre!))

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

    if (args.que === 'compras' || args.que === 'ventas') {
      const { desde, hasta } = rangoMes(mes)
      const r = await siigoTodas(args.que === 'compras' ? '/v1/purchases' : '/v1/invoices', { date_start: desde, date_end: hasta }, 5)
      const filas =
        args.que === 'compras'
          ? r.filas.map(compraDeSiigo).filter((c) => coincide(c.proveedor, '')).map((c) => ({ comprobante: c.nombre, fecha: c.fecha, proveedorNit: c.proveedor, facturaProveedor: c.facturaProveedor || null, total: c.total, saldo: c.saldo }))
          : r.filas
              .filter((f: any) => !f?.annulled)
              .map((f: any) => ({ factura: String(f.name || ''), fecha: String(f.date || ''), clienteNit: String(f.customer?.identification || ''), total: Number(f.total) || 0, saldo: Number(f.balance) || 0 }))
              .filter((f) => coincide(f.clienteNit, ''))
      return ok({ mes, enlace: ENLACE, incompleto: r.truncado, cantidad: filas.length, total: Math.round(filas.reduce((a, f) => a + f.total, 0)), documentos: filas.slice(0, 50) })
    }

    // verificar_pago
    if (!args.proveedor || !args.factura || !args.valor) return fallo('Para verificar un pago necesito el NIT del proveedor, la factura y el valor.')
    const d = await traerProveedores(hoy)
    return ok({ enlace: ENLACE, ...verificarPago({ nit: args.proveedor, factura: args.factura, valor: args.valor, compras: d.compras, cxp: d.cxp, egresos: d.egresos, hoy }) })
  },
}
