// Consulta de mensajes del formulario de contacto (tabla `contacts`,
// src/lib/contactos.ts). Sin correo, teléfono ni prueba de consentimiento.

import { z } from 'zod'
import { CONTACT_STATUSES } from '../../contactos.ts'
import { fechaBogota, like, num, ok, str, textoSeguro, type Herramienta } from './tipos.ts'

const COLUMNAS = 'id, name, company, sector, service_lines, message, source, status, created_at'

export function aContacto(r: any) {
  return {
    id: num(r.id),
    nombre: str(r.name),
    empresa: str(r.company) || null,
    sector: str(r.sector) || null,
    lineasDeServicio: str(r.service_lines) || null,
    estado: str(r.status),
    recibido: fechaBogota(r.created_at),
    origen: str(r.source),
    enlace: `/admin?tab=contactos&id=${num(r.id)}`,
    escritoPorTerceros: { mensaje: textoSeguro(r.message) },
  }
}

const esquema = z.object({
  estado: z.enum(CONTACT_STATUSES).optional().describe('nuevo = sin atender'),
  buscar: z.string().trim().max(80).optional().describe('Texto en nombre, empresa, sector o mensaje'),
  limite: z.number().int().min(1).max(50).optional().describe('Máximo de mensajes (por defecto 20)'),
})

export const CONTACTOS: Herramienta = {
  nombre: 'contactos',
  area: 'contactos',
  descripcion:
    'Mensajes del formulario de contacto del sitio, con su estado (nuevo o atendido) y el conteo. Úsela para "¿qué contactos no se han atendido?" o "¿quién escribió por RAEE esta semana?".',
  esquema,
  async ejecutar(args: z.infer<typeof esquema>, { db }) {
    const where: string[] = []
    const params: (string | number)[] = []
    if (args.estado) {
      where.push('status = ?')
      params.push(args.estado)
    }
    if (args.buscar) {
      where.push(`(name LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\' OR sector LIKE ? ESCAPE '\\' OR message LIKE ? ESCAPE '\\')`)
      const q = like(args.buscar)
      params.push(q, q, q, q)
    }
    const filtro = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const [filas, conteo] = await Promise.all([
      db.execute({ sql: `SELECT ${COLUMNAS} FROM contacts ${filtro} ORDER BY id DESC LIMIT ?`, args: [...params, args.limite ?? 20] }),
      db.execute('SELECT status, COUNT(*) AS n FROM contacts GROUP BY status'),
    ])
    const porEstado: Record<string, number> = {}
    for (const r of conteo.rows as any[]) porEstado[str(r.status)] = num(r.n)
    return ok({ porEstado, contactos: filas.rows.map(aContacto) })
  },
}
