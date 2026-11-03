// Escritura del asistente: marcar mensajes del formulario como atendidos (o
// devolverlos a nuevos) y ponerles o quitarles responsable. Misma tabla y
// campos que PATCH /api/admin/contactos.
// La tarjeta muestra quién escribió, nunca el correo ni el mensaje completo:
// también viaja al historial guardado de la conversación.

import { z } from 'zod'
import { CONTACT_STATUSES } from '../../contactos.ts'
import { num, str, textoSeguro } from '../herramientas/tipos.ts'
import { aPropuesta, errores, type Escritura, type Preparada } from './cambio.ts'

export const esquemaContacto = z.object({
  contactoIds: z.array(z.number().int().positive()).min(1).max(30).describe('Ids de los mensajes (salen de la herramienta contactos)'),
  estado: z.enum(CONTACT_STATUSES).optional().describe('atendido, o nuevo para devolverlo a la bandeja; solo si se pidió cambiarlo'),
  responsable: z.string().trim().max(100).optional().describe('Persona del equipo que lo atiende; vacío para quitar el responsable'),
})

type Datos = { ids: number[]; estado?: (typeof CONTACT_STATUSES)[number]; responsable?: string }

const ETIQUETA = { nuevo: 'Nuevo', atendido: 'Atendido' } as const

async function preparar(entrada: unknown, { db }: Parameters<Escritura['preparar']>[1]): Promise<Preparada<Datos>> {
  const p = esquemaContacto.safeParse(entrada ?? {})
  if (!p.success) return { ok: false, error: errores(p.error.issues) }
  const { estado, responsable } = p.data
  if (!estado && responsable === undefined) return { ok: false, error: 'No hay nada que cambiar: diga el estado o el responsable.' }
  const pedidos = [...new Set(p.data.contactoIds)]
  const r = await db.execute({
    sql: `SELECT id, name, company, status, assigned_to FROM contacts WHERE id IN (${pedidos.map(() => '?').join(',')})`,
    args: pedidos,
  })
  // Solo los que de verdad cambian en algo.
  const filas = r.rows.filter((f: any) => (estado && str(f.status) !== estado) || (responsable !== undefined && str(f.assigned_to) !== responsable))
  if (!filas.length) return { ok: false, error: 'Ninguno de esos mensajes existe o ya está así.' }
  const faltan = pedidos.filter((id) => !filas.some((f: any) => num(f.id) === id))
  const quien = (f: any) => [textoSeguro(f.name, 80), str(f.company)].filter(Boolean).join(', ') || 'Sin nombre'
  const ambos = !!estado && responsable !== undefined
  const cambios = filas.flatMap((f: any) => [
    ...(estado && str(f.status) !== estado
      ? [{ campo: ambos ? `${quien(f)}: estado` : quien(f), antes: ETIQUETA[str(f.status) as keyof typeof ETIQUETA] ?? str(f.status), despues: ETIQUETA[estado] }]
      : []),
    ...(responsable !== undefined && str(f.assigned_to) !== responsable
      ? [{ campo: ambos ? `${quien(f)}: responsable` : quien(f), antes: str(f.assigned_to) || null, despues: responsable || null }]
      : []),
  ])
  const titulo = estado
    ? estado === 'atendido' ? 'Marcar como atendido' : 'Devolver a nuevos'
    : responsable ? `Asignar a ${responsable}` : 'Quitar el responsable'
  return {
    ok: true,
    datos: { ids: filas.map((f: any) => num(f.id)), estado, responsable },
    vista: {
      tipo: 'cambio',
      rotulo: filas.length === 1 ? 'Contacto' : `${filas.length} contactos`,
      titulo: ambos ? `${titulo} y asignar a ${responsable || 'nadie'}` : titulo,
      contexto: faltan.length ? `Ya estaban así o no existen: ${faltan.join(', ')}` : null,
      cambios,
      avisos: [],
      boton: filas.length === 1 ? 'Aprobar y guardar' : 'Aprobar y guardar todos',
      nota: 'Quien escribió no se entera: solo cambia la bandeja del panel.',
    },
  }
}

export const ACTUALIZAR_CONTACTO: Escritura = {
  nombre: 'actualizar_contacto',
  area: 'contactos',
  descripcion:
    'Marca uno o varios mensajes del formulario como atendidos (o los devuelve a nuevos) y/o les pone o quita responsable. No se ejecuta sola: la persona ve cuáles y decide. Busque antes los ids con la herramienta contactos.',
  esquema: esquemaContacto as unknown as Escritura['esquema'],
  async preparar(entrada, ctx) {
    const p = await preparar(entrada, ctx)
    return p.ok === true ? aPropuesta(p.vista) : p
  },
  async ejecutar(entrada, ctx) {
    try {
      const p = await preparar(entrada, ctx)
      if (p.ok === false) return p
      const { ids, estado, responsable } = p.datos
      const sets: string[] = []
      const args: (string | number)[] = []
      if (estado) { sets.push('status = ?'); args.push(estado) }
      if (responsable !== undefined) { sets.push('assigned_to = ?'); args.push(responsable) }
      const r = await ctx.db.execute({
        sql: `UPDATE contacts SET ${sets.join(', ')}, updated_at = ? WHERE id IN (${ids.map(() => '?').join(',')})`,
        args: [...args, new Date().toISOString(), ...ids],
      })
      const n = r.rowsAffected
      const que = [estado && `marcado${n === 1 ? '' : 's'} como ${estado}`, responsable !== undefined && (responsable ? `asignado${n === 1 ? '' : 's'} a ${responsable}` : `sin responsable`)].filter(Boolean).join(' y ')
      return {
        ok: true,
        datos: { hecho: true, resumen: `${n === 1 ? '1 contacto' : `${n} contactos`} ${que}`, enlace: '/admin?tab=contactos', cambiados: n },
      }
    } catch (err) {
      console.error('[asistente] actualizar_contacto', err)
      return { ok: false, error: 'No se pudieron marcar los contactos.' }
    }
  },
}
