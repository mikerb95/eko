// Escritura del asistente: atender una alerta de cumplimiento (cambiar su
// estado, posponer el vencimiento, asignar responsable o agregar una nota).
// Mismos campos que actualizarAlerta (src/lib/agente/datos.ts).
//
// La nota se AGREGA al final con fecha y firma; no reemplaza la anterior, que
// puede ser la única constancia de qué se hizo con un requerimiento.

import { z } from 'zod'
import { ESTADOS_ALERTA } from '../../agente/datos.ts'
import { num, str } from '../herramientas/tipos.ts'
import { aPropuesta, errores, firma, soloDistintos, type Escritura, type Preparada } from './cambio.ts'

export const esquemaAlerta = z.object({
  alertaId: z.number().int().positive().describe('Id de la alerta (sale de la herramienta cumplimiento)'),
  estado: z.enum(ESTADOS_ALERTA).optional().describe('Estado nuevo, solo si se pidió cambiarlo'),
  venceEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Nueva fecha de vencimiento AAAA-MM-DD (posponer), solo si la dieron'),
  responsable: z.string().trim().max(200).optional().describe('Persona del equipo que la atiende'),
  nota: z.string().trim().min(1).max(1000).optional().describe('Nota que se agrega a la alerta'),
})
type Entrada = z.infer<typeof esquemaAlerta>

type Datos = { entrada: Entrada; id: number; antes: { estado: string; vence: string; responsable: string; nota: string } }

const ETIQUETA: Record<string, string> = { abierta: 'Abierta', en_curso: 'En curso', cerrada: 'Cerrada', descartada: 'Descartada' }

async function preparar(entrada: unknown, { db }: Parameters<Escritura['preparar']>[1]): Promise<Preparada<Datos>> {
  const p = esquemaAlerta.safeParse(entrada ?? {})
  if (!p.success) return { ok: false, error: errores(p.error.issues) }
  const e = p.data
  if (!e.estado && !e.venceEl && e.responsable === undefined && !e.nota) {
    return { ok: false, error: 'No hay nada que cambiar: diga el estado, la fecha, el responsable o la nota.' }
  }
  const r = await db.execute({
    sql: `SELECT a.id, a.titulo, a.estado, a.vence_el, a.responsable, a.nota, a.por_confirmar, x.cliente, x.numero
          FROM alertas a LEFT JOIN expedientes x ON x.id = a.expediente_id WHERE a.id = ? LIMIT 1`,
    args: [e.alertaId],
  })
  const a: any = r.rows[0]
  if (!a) return { ok: false, error: 'No existe esa alerta.' }
  const antes = { estado: str(a.estado), vence: str(a.vence_el), responsable: str(a.responsable), nota: str(a.nota) }

  const cambios = soloDistintos([
    ...(e.estado ? [{ campo: 'Estado', antes: ETIQUETA[antes.estado] ?? antes.estado, despues: ETIQUETA[e.estado] ?? e.estado }] : []),
    ...(e.venceEl ? [{ campo: 'Vence el', antes: antes.vence || null, despues: e.venceEl }] : []),
    ...(e.responsable !== undefined ? [{ campo: 'Responsable', antes: antes.responsable || null, despues: e.responsable || null }] : []),
  ])
  if (e.nota) cambios.push({ campo: 'Nota que se agrega', antes: null, despues: e.nota })
  if (!cambios.length) return { ok: false, error: 'La alerta ya está así; no hay nada que cambiar.' }

  const avisos: string[] = []
  if (e.venceEl && antes.vence && e.venceEl > antes.vence) {
    avisos.push('Mover el vencimiento no cambia el plazo que fijó la autoridad: solo cambia cuándo avisa el panel.')
  }
  if (e.estado === 'cerrada' && num(a.por_confirmar) === 1) {
    avisos.push('Esta alerta tiene datos sin confirmar contra el documento original.')
  }
  return {
    ok: true,
    datos: { entrada: e, id: num(a.id), antes },
    vista: {
      tipo: 'cambio',
      rotulo: 'Alerta de cumplimiento',
      titulo: str(a.titulo) || `Alerta ${num(a.id)}`,
      contexto: a.numero ? `Expediente ${str(a.numero)} (${str(a.cliente)})` : null,
      cambios,
      avisos,
      boton: 'Aprobar y guardar',
      nota: 'El cambio se ve de inmediato en Cumplimiento.',
    },
  }
}

export const ACTUALIZAR_ALERTA: Escritura = {
  nombre: 'actualizar_alerta',
  area: 'cumplimiento',
  descripcion:
    'Atiende una alerta de cumplimiento: cambia su estado (en curso, cerrada, descartada), pospone el vencimiento del aviso, asigna responsable o agrega una nota. No se ejecuta sola: la persona ve el cambio y decide. Busque antes el id con la herramienta cumplimiento.',
  esquema: esquemaAlerta as unknown as Escritura['esquema'],
  async preparar(entrada, ctx) {
    const p = await preparar(entrada, ctx)
    return p.ok === true ? aPropuesta(p.vista) : p
  },
  async ejecutar(entrada, ctx) {
    try {
      const p = await preparar(entrada, ctx)
      if (p.ok === false) return p
      const { entrada: e, id, antes } = p.datos
      const nota = e.nota ? [antes.nota, `${ctx.hoy}, ${firma(ctx)}: ${e.nota}`].filter(Boolean).join('\n').slice(-2000) : antes.nota
      const r = await ctx.db.execute({
        sql: `UPDATE alertas SET estado = ?, vence_el = ?, responsable = ?, nota = ?, updated_at = ?
              WHERE id = ? AND estado = ? AND vence_el = ? AND nota = ?`,
        args: [e.estado ?? antes.estado, e.venceEl ?? antes.vence, e.responsable ?? antes.responsable, nota, new Date().toISOString(), id, antes.estado, antes.vence, antes.nota],
      })
      if (!r.rowsAffected) return { ok: false, error: 'La alerta cambió mientras tanto. Vuelva a consultarla antes de proponer otra vez.' }
      return { ok: true, datos: { hecho: true, resumen: 'Alerta actualizada', enlace: `/admin/cumplimiento?alerta=${id}` } }
    } catch (err) {
      console.error('[asistente] actualizar_alerta', err)
      return { ok: false, error: 'No se pudo guardar el cambio en la alerta.' }
    }
  },
}
