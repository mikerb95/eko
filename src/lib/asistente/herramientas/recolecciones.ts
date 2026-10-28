// Consulta de órdenes de recolección (tabla `orders`, src/lib/ops.ts).
//
// Columnas nombradas, nunca `SELECT *`: la orden guarda correo, teléfono y la
// prueba de consentimiento (IP incluida), y nada de eso le sirve al modelo.
// La dirección solo sale si la orden es de una empresa.

import { z } from 'zod'
import { ORDER_STATUSES, STATUS_LABELS } from '../../ops.ts'
import { siEmpresa } from '../limpieza.ts'
import { fallo, fechaBogota, like, num, ok, str, textoSeguro, type Herramienta } from './tipos.ts'

const COLUMNAS = `id, consecutive, status, first_name, last_name, company, address, address2, city,
  waste_type, estimated_quantity, message, source, assigned_to, scheduled_at, internal_notes, created_at, updated_at`

export function aOrden(r: any, conDetalle = false) {
  const empresa = !!str(r.company).trim()
  const direccion = [str(r.address), str(r.address2), str(r.city)].filter(Boolean).join(', ')
  const estado = str(r.status) as (typeof ORDER_STATUSES)[number]
  return {
    id: num(r.id),
    consecutivo: str(r.consecutive),
    estado,
    estadoTexto: STATUS_LABELS[estado] ?? estado,
    solicitante: `${str(r.first_name)} ${str(r.last_name)}`.trim(),
    empresa: str(r.company) || null,
    ciudad: str(r.city) || null,
    direccion: empresa ? direccion || null : siEmpresa(direccion, false),
    tipoResiduo: str(r.waste_type) || null,
    cantidadEstimada: str(r.estimated_quantity) || null,
    asignadaA: str(r.assigned_to) || null,
    programadaPara: str(r.scheduled_at) || null,
    creada: fechaBogota(r.created_at),
    enlace: `/admin?tab=recolecciones&id=${num(r.id)}`,
    ...(conDetalle
      ? {
          notasInternas: textoSeguro(r.internal_notes, 1000),
          origen: str(r.source),
          escritoPorTerceros: { mensaje: textoSeguro(r.message) },
        }
      : {}),
  }
}

const esquema = z.object({
  id: z.number().int().positive().optional().describe('Id de una orden para ver su detalle e historial'),
  consecutivo: z.string().trim().max(40).optional().describe('Consecutivo de la orden, por ejemplo REC-2026-0012'),
  estado: z.enum(ORDER_STATUSES).optional().describe('Filtra por estado'),
  buscar: z.string().trim().max(80).optional().describe('Texto en empresa, solicitante, ciudad o tipo de residuo'),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Creadas desde esta fecha (AAAA-MM-DD)'),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Creadas hasta esta fecha (AAAA-MM-DD)'),
  limite: z.number().int().min(1).max(50).optional().describe('Máximo de órdenes (por defecto 20)'),
})

export const RECOLECCIONES: Herramienta = {
  nombre: 'recolecciones',
  area: 'recolecciones',
  descripcion:
    'Órdenes de recolección de residuos: lista filtrada por estado, texto o fechas, con el conteo por estado; o el detalle de una orden (id o consecutivo) con su historial. Úsela para "¿qué recolecciones están pendientes?", "¿qué hay programado esta semana?" o "¿cómo va la REC-2026-0012?".',
  esquema,
  async ejecutar(args: z.infer<typeof esquema>, { db }) {
    if (args.id || args.consecutivo) {
      const r = await db.execute({
        sql: `SELECT ${COLUMNAS} FROM orders WHERE ${args.id ? 'id = ?' : 'consecutive = ?'} LIMIT 1`,
        args: [args.id ?? args.consecutivo!.toUpperCase()],
      })
      if (!r.rows.length) return fallo('No existe esa orden.')
      const orden = aOrden(r.rows[0], true)
      const ev = await db.execute({
        sql: 'SELECT user, from_status, to_status, note, at FROM order_events WHERE order_id = ? ORDER BY id ASC LIMIT 50',
        args: [orden.id],
      })
      return ok({
        orden,
        historial: ev.rows.map((e: any) => ({
          fecha: fechaBogota(e.at),
          quien: str(e.user),
          de: str(e.from_status) || null,
          a: str(e.to_status),
          nota: textoSeguro(e.note, 300),
        })),
      })
    }

    const where: string[] = []
    const params: (string | number)[] = []
    if (args.estado) {
      where.push('status = ?')
      params.push(args.estado)
    }
    if (args.buscar) {
      where.push(`(company LIKE ? ESCAPE '\\' OR first_name || ' ' || last_name LIKE ? ESCAPE '\\' OR city LIKE ? ESCAPE '\\' OR waste_type LIKE ? ESCAPE '\\')`)
      const q = like(args.buscar)
      params.push(q, q, q, q)
    }
    if (args.desde) {
      where.push('substr(created_at, 1, 10) >= ?')
      params.push(args.desde)
    }
    if (args.hasta) {
      where.push('substr(created_at, 1, 10) <= ?')
      params.push(args.hasta)
    }
    const filtro = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const limite = args.limite ?? 20
    const [filas, total, conteo] = await Promise.all([
      db.execute({ sql: `SELECT ${COLUMNAS} FROM orders ${filtro} ORDER BY id DESC LIMIT ?`, args: [...params, limite] }),
      db.execute({ sql: `SELECT COUNT(*) AS n FROM orders ${filtro}`, args: params }),
      db.execute('SELECT status, COUNT(*) AS n FROM orders GROUP BY status'),
    ])
    const porEstado: Record<string, number> = {}
    for (const r of conteo.rows as any[]) porEstado[str(r.status)] = num(r.n)
    const n = num(total.rows[0]?.n)
    return ok({
      total: n,
      mostradas: filas.rows.length,
      ...(n > filas.rows.length ? { aviso: `Hay ${n} órdenes con ese filtro; se muestran las ${filas.rows.length} más recientes.` } : {}),
      porEstado,
      ordenes: filas.rows.map((r) => aOrden(r)),
    })
  },
}
