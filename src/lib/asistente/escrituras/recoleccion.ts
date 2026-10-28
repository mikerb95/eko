// Escritura del asistente: cambiar estado, fecha programada o responsable de
// una orden de recolección y dejar una nota en su historial. Misma semántica
// que PATCH /api/admin/recolecciones (updateOrder en src/lib/ops.ts): un cambio
// de estado o una nota quedan en `order_events`.
//
// Hoy cambiar el estado no le avisa nada al cliente (updateOrder no envía
// correos). Si algún día lo hace, va en `avisos`.

import { z } from 'zod'
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from '../../ops.ts'
import { num, str } from '../herramientas/tipos.ts'
import { aPropuesta, errores, firma, soloDistintos, type Escritura, type Preparada } from './cambio.ts'

export const esquemaRecoleccion = z.object({
  recoleccionId: z.number().int().positive().describe('Id de la orden (sale de la herramienta recolecciones)'),
  estado: z.enum(ORDER_STATUSES).optional().describe('Estado nuevo, solo si se pidió cambiarlo'),
  programadaPara: z.string().trim().max(40).optional().describe('Fecha (y hora, si la dieron) de la recolección, por ejemplo 2026-11-04 08:00'),
  asignadaA: z.string().trim().max(100).optional().describe('Persona o vehículo asignado'),
  nota: z.string().trim().min(1).max(1000).optional().describe('Nota para el historial de la orden'),
})
type Entrada = z.infer<typeof esquemaRecoleccion>

type Datos = { entrada: Entrada; id: number; estadoAntes: string; consecutivo: string }

const etiqueta = (s: string) => STATUS_LABELS[s as OrderStatus] ?? s

async function preparar(entrada: unknown, { db }: Parameters<Escritura['preparar']>[1]): Promise<Preparada<Datos>> {
  const p = esquemaRecoleccion.safeParse(entrada ?? {})
  if (!p.success) return { ok: false, error: errores(p.error.issues) }
  const e = p.data
  if (!e.estado && e.programadaPara === undefined && e.asignadaA === undefined && !e.nota) {
    return { ok: false, error: 'No hay nada que cambiar: diga el estado, la fecha, el responsable o la nota.' }
  }
  const r = await db.execute({
    sql: 'SELECT id, consecutive, status, company, first_name, last_name, scheduled_at, assigned_to FROM orders WHERE id = ? LIMIT 1',
    args: [e.recoleccionId],
  })
  const o: any = r.rows[0]
  if (!o) return { ok: false, error: 'No existe esa orden.' }

  const cambios = soloDistintos([
    ...(e.estado ? [{ campo: 'Estado', antes: etiqueta(str(o.status)), despues: etiqueta(e.estado) }] : []),
    ...(e.programadaPara !== undefined ? [{ campo: 'Programada para', antes: str(o.scheduled_at) || null, despues: e.programadaPara || null }] : []),
    ...(e.asignadaA !== undefined ? [{ campo: 'Asignada a', antes: str(o.assigned_to) || null, despues: e.asignadaA || null }] : []),
  ])
  if (e.nota) cambios.push({ campo: 'Nota en el historial', antes: null, despues: e.nota })
  if (!cambios.length) return { ok: false, error: 'La orden ya está así; no hay nada que cambiar.' }

  const quien = str(o.company) || `${str(o.first_name)} ${str(o.last_name)}`.trim()
  return {
    ok: true,
    datos: { entrada: e, id: num(o.id), estadoAntes: str(o.status), consecutivo: str(o.consecutive) },
    vista: {
      tipo: 'cambio',
      rotulo: 'Orden de recolección',
      titulo: str(o.consecutive),
      contexto: quien || null,
      cambios,
      avisos: [],
      boton: 'Aprobar y guardar',
      nota: 'El cambio queda en el historial de la orden a su nombre.',
    },
  }
}

export const ACTUALIZAR_RECOLECCION: Escritura = {
  nombre: 'actualizar_recoleccion',
  area: 'recolecciones',
  descripcion:
    'Cambia el estado, la fecha programada o el responsable de una orden de recolección, o deja una nota en su historial. No se ejecuta sola: la persona ve el cambio y decide. Busque antes el id con la herramienta recolecciones.',
  esquema: esquemaRecoleccion as unknown as Escritura['esquema'],
  async preparar(entrada, ctx) {
    const p = await preparar(entrada, ctx)
    return p.ok ? aPropuesta(p.vista) : p
  },
  async ejecutar(entrada, ctx) {
    try {
      const p = await preparar(entrada, ctx)
      if (!p.ok) return p
      const { entrada: e, id, estadoAntes, consecutivo } = p.datos
      const estado = e.estado ?? estadoAntes
      const ahora = new Date().toISOString()
      const sets = ['status = ?', 'updated_at = ?']
      const args: (string | number)[] = [estado, ahora]
      if (e.programadaPara !== undefined) {
        sets.push('scheduled_at = ?')
        args.push(e.programadaPara)
      }
      if (e.asignadaA !== undefined) {
        sets.push('assigned_to = ?')
        args.push(e.asignadaA)
      }
      // El estado de antes va también en el WHERE: si otra persona la movió
      // entre la propuesta y el clic, no se pisa su cambio.
      const r = await ctx.db.execute({ sql: `UPDATE orders SET ${sets.join(', ')} WHERE id = ? AND status = ?`, args: [...args, id, estadoAntes] })
      if (!r.rowsAffected) return { ok: false, error: 'La orden cambió mientras tanto. Vuelva a consultarla antes de proponer otra vez.' }
      if (estado !== estadoAntes || e.nota) {
        await ctx.db.execute({
          sql: 'INSERT INTO order_events (order_id, user, from_status, to_status, note, at) VALUES (?,?,?,?,?,?)',
          args: [id, firma(ctx), estadoAntes, estado, e.nota ?? '', ahora],
        })
      }
      return { ok: true, datos: { hecho: true, resumen: `Orden ${consecutivo} actualizada`, enlace: `/admin?tab=recolecciones&id=${id}` } }
    } catch (err) {
      console.error('[asistente] actualizar_recoleccion', err)
      return { ok: false, error: 'No se pudo guardar el cambio en la orden.' }
    }
  },
}
