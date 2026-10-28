// Consulta del agente de cumplimiento: alertas, expedientes y actos
// (src/lib/agente/datos.ts). Los días hábiles que quedan los calcula
// diasHabiles.ts, el mismo módulo del agente, nunca el modelo.
//
// Del expediente no sale el correo del responsable, y el NIT solo si es de
// una empresa. Del acto no sale el texto completo del documento.

import { z } from 'zod'
import { ESTADOS_ALERTA } from '../../agente/datos.ts'
import { habilesRestantes } from '../../agente/diasHabiles.ts'
import { esNitEmpresa, siEmpresa } from '../limpieza.ts'
import { fallo, fechaBogota, like, num, ok, str, textoSeguro, type Herramienta } from './tipos.ts'

export function aAlerta(r: any, hoy: string) {
  const vence = str(r.vence_el)
  let quedan: number | null = null
  if (vence) {
    try {
      quedan = habilesRestantes(hoy, vence)
    } catch {
      quedan = null
    }
  }
  return {
    id: num(r.id),
    titulo: str(r.titulo),
    prioridad: str(r.prioridad),
    estado: str(r.estado),
    tipoActo: str(r.tipo_acto),
    quePide: textoSeguro(r.que_pide, 500),
    norma: str(r.norma) || null,
    plazo: str(r.plazo_texto) || null,
    venceEl: vence || null,
    diasHabilesQuedan: quedan,
    porConfirmar: num(r.por_confirmar) === 1,
    motivoPorConfirmar: str(r.motivo_confirmar) || null,
    accionSugerida: textoSeguro(r.accion, 400),
    responsable: str(r.responsable) || null,
    nota: textoSeguro(r.nota, 600),
    expedienteId: num(r.expediente_id) || null,
    enlace: `/admin/cumplimiento?alerta=${num(r.id)}`,
  }
}

export function aExpediente(r: any) {
  const nit = str(r.nit)
  return {
    id: num(r.id),
    cliente: str(r.cliente),
    nit: siEmpresa(nit, esNitEmpresa(nit)),
    autoridad: str(r.autoridad),
    numero: str(r.numero),
    tipoPermiso: str(r.tipo_permiso) || null,
    responsable: str(r.responsable) || null,
    notas: textoSeguro(r.notas, 400),
    activo: num(r.activo) === 1,
    enlace: `/admin/cumplimiento?expediente=${num(r.id)}`,
  }
}

const esquema = z.object({
  que: z.enum(['alertas', 'expedientes', 'actos']).describe('Qué consultar'),
  estado: z.enum(ESTADOS_ALERTA).optional().describe('Solo alertas: filtra por estado. Sin él, salen abiertas y en curso'),
  venceAntesDe: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Solo alertas: vencen hasta esta fecha (AAAA-MM-DD)'),
  expedienteId: z.number().int().positive().optional().describe('Filtra alertas o actos de un expediente'),
  buscar: z.string().trim().max(80).optional().describe('Texto en cliente, número de expediente o título de la alerta'),
  limite: z.number().int().min(1).max(50).optional().describe('Máximo de filas (por defecto 20)'),
})

export const CUMPLIMIENTO: Herramienta = {
  nombre: 'cumplimiento',
  area: 'cumplimiento',
  descripcion:
    'Agente de cumplimiento ambiental: alertas (qué pide la autoridad, plazo, días hábiles que quedan, prioridad), expedientes vigilados y actos administrativos recibidos. Úsela para "¿qué alertas vencen antes del viernes?", "¿qué expedientes tiene el cliente X?" o "¿qué autos llegaron esta semana?".',
  esquema,
  async ejecutar(args: z.infer<typeof esquema>, { db, hoy }) {
    const limite = args.limite ?? 20
    const q = args.buscar ? like(args.buscar) : null

    if (args.que === 'expedientes') {
      const r = await db.execute({
        sql: `SELECT id, cliente, nit, autoridad, numero, tipo_permiso, responsable, notas, activo FROM expedientes
              ${q ? `WHERE cliente LIKE ? ESCAPE '\\' OR numero LIKE ? ESCAPE '\\'` : ''}
              ORDER BY activo DESC, cliente ASC LIMIT ?`,
        args: q ? [q, q, limite] : [limite],
      })
      return ok({ expedientes: r.rows.map(aExpediente) })
    }

    if (args.que === 'actos') {
      const r = await db.execute({
        sql: `SELECT id, origen, archivo_nombre, fecha_notificacion, expediente_id, estado, created_at FROM actos
              ${args.expedienteId ? 'WHERE expediente_id = ?' : ''} ORDER BY id DESC LIMIT ?`,
        args: args.expedienteId ? [args.expedienteId, limite] : [limite],
      })
      return ok({
        actos: r.rows.map((a: any) => ({
          id: num(a.id),
          archivo: str(a.archivo_nombre),
          notificado: str(a.fecha_notificacion) || null,
          expedienteId: num(a.expediente_id) || null,
          estado: str(a.estado),
          recibido: fechaBogota(a.created_at),
          enlace: `/admin/cumplimiento?acto=${num(a.id)}`,
        })),
      })
    }

    const where: string[] = []
    const params: (string | number)[] = []
    if (args.estado) {
      where.push('estado = ?')
      params.push(args.estado)
    } else {
      where.push(`estado IN ('abierta', 'en_curso')`)
    }
    if (args.venceAntesDe) {
      where.push(`vence_el <> '' AND vence_el <= ?`)
      params.push(args.venceAntesDe)
    }
    if (args.expedienteId) {
      where.push('expediente_id = ?')
      params.push(args.expedienteId)
    }
    if (q) {
      where.push(`(titulo LIKE ? ESCAPE '\\' OR que_pide LIKE ? ESCAPE '\\')`)
      params.push(q, q)
    }
    const r = await db.execute({
      sql: `SELECT id, expediente_id, prioridad, tipo_acto, titulo, que_pide, norma, plazo_texto, vence_el, accion,
              por_confirmar, motivo_confirmar, estado, responsable, nota
            FROM alertas WHERE ${where.join(' AND ')}
            ORDER BY CASE WHEN vence_el = '' THEN 1 ELSE 0 END, vence_el ASC, id DESC LIMIT ?`,
      args: [...params, limite],
    })
    if (!r.rows.length && args.expedienteId) {
      const e = await db.execute({ sql: 'SELECT id FROM expedientes WHERE id = ?', args: [args.expedienteId] })
      if (!e.rows.length) return fallo('No existe ese expediente.')
    }
    return ok({ hoy, alertas: r.rows.map((a) => aAlerta(a, hoy)) })
  },
}
