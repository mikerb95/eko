// Escritura del asistente: marcar mensajes del formulario como atendidos (o
// devolverlos a nuevos). Misma tabla y estados que PATCH /api/admin/contactos.
// La tarjeta muestra quién escribió, nunca el correo ni el mensaje completo:
// también viaja al historial guardado de la conversación.

import { z } from 'zod'
import { CONTACT_STATUSES } from '../../contactos.ts'
import { num, str, textoSeguro } from '../herramientas/tipos.ts'
import { aPropuesta, errores, type Escritura, type Preparada } from './cambio.ts'

export const esquemaContacto = z.object({
  contactoIds: z.array(z.number().int().positive()).min(1).max(30).describe('Ids de los mensajes (salen de la herramienta contactos)'),
  estado: z.enum(CONTACT_STATUSES).describe('atendido, o nuevo para devolverlo a la bandeja'),
})

type Datos = { ids: number[]; estado: (typeof CONTACT_STATUSES)[number] }

const ETIQUETA = { nuevo: 'Nuevo', atendido: 'Atendido' } as const

async function preparar(entrada: unknown, { db }: Parameters<Escritura['preparar']>[1]): Promise<Preparada<Datos>> {
  const p = esquemaContacto.safeParse(entrada ?? {})
  if (!p.success) return { ok: false, error: errores(p.error.issues) }
  const pedidos = [...new Set(p.data.contactoIds)]
  const r = await db.execute({
    sql: `SELECT id, name, company, status FROM contacts WHERE id IN (${pedidos.map(() => '?').join(',')}) AND status <> ?`,
    args: [...pedidos, p.data.estado],
  })
  if (!r.rows.length) return { ok: false, error: `Ninguno de esos mensajes existe o ya está como ${p.data.estado}.` }
  const faltan = pedidos.filter((id) => !r.rows.some((f: any) => num(f.id) === id))
  return {
    ok: true,
    datos: { ids: r.rows.map((f: any) => num(f.id)), estado: p.data.estado },
    vista: {
      tipo: 'cambio',
      rotulo: r.rows.length === 1 ? 'Contacto' : `${r.rows.length} contactos`,
      titulo: p.data.estado === 'atendido' ? 'Marcar como atendido' : 'Devolver a nuevos',
      contexto: faltan.length ? `Ya estaban así o no existen: ${faltan.join(', ')}` : null,
      cambios: r.rows.map((f: any) => ({
        campo: [textoSeguro(f.name, 80), str(f.company)].filter(Boolean).join(', ') || 'Sin nombre',
        antes: ETIQUETA[str(f.status) as keyof typeof ETIQUETA] ?? str(f.status),
        despues: ETIQUETA[p.data.estado],
      })),
      avisos: [],
      boton: r.rows.length === 1 ? 'Aprobar y marcar' : 'Aprobar y marcar todos',
      nota: 'Quien escribió no se entera: solo cambia la bandeja del panel.',
    },
  }
}

export const ACTUALIZAR_CONTACTO: Escritura = {
  nombre: 'actualizar_contacto',
  area: 'contactos',
  descripcion:
    'Marca uno o varios mensajes del formulario como atendidos, o los devuelve a nuevos. No se ejecuta sola: la persona ve cuáles y decide. Busque antes los ids con la herramienta contactos.',
  esquema: esquemaContacto as unknown as Escritura['esquema'],
  async preparar(entrada, ctx) {
    const p = await preparar(entrada, ctx)
    return p.ok === true ? aPropuesta(p.vista) : p
  },
  async ejecutar(entrada, ctx) {
    try {
      const p = await preparar(entrada, ctx)
      if (p.ok === false) return p
      const { ids, estado } = p.datos
      // La condición va también en el UPDATE: el conteo dice lo que de verdad cambió.
      const r = await ctx.db.execute({
        sql: `UPDATE contacts SET status = ?, updated_at = ? WHERE id IN (${ids.map(() => '?').join(',')}) AND status <> ?`,
        args: [estado, new Date().toISOString(), ...ids, estado],
      })
      const n = r.rowsAffected
      return {
        ok: true,
        datos: { hecho: true, resumen: n === 1 ? `1 contacto marcado como ${estado}` : `${n} contactos marcados como ${estado}`, enlace: '/admin?tab=contactos', cambiados: n },
      }
    } catch (err) {
      console.error('[asistente] actualizar_contacto', err)
      return { ok: false, error: 'No se pudieron marcar los contactos.' }
    }
  },
}
