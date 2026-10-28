// Consulta del blog y de las normativas (tablas `posts` y `normativas`,
// src/lib/cms.ts), con los borradores marcados.

import { z } from 'zod'
import { like, num, ok, str, textoSeguro, type Herramienta } from './tipos.ts'

function etiquetas(v: unknown): string[] {
  try {
    const t = JSON.parse(str(v) || '[]')
    return Array.isArray(t) ? t.map(String) : []
  } catch {
    return []
  }
}

const esquema = z.object({
  tipo: z.enum(['articulos', 'normativas']).describe('Qué consultar'),
  buscar: z.string().trim().max(80).optional().describe('Texto en título, categoría, código o etiquetas'),
  soloBorradores: z.boolean().optional().describe('Solo lo que está en borrador, sin publicar'),
  limite: z.number().int().min(1).max(50).optional().describe('Máximo de filas (por defecto 20)'),
})

export const CONTENIDO: Herramienta = {
  nombre: 'contenido',
  area: 'contenido',
  descripcion:
    'Artículos del blog y normativas publicadas en el sitio, incluidos los borradores. Úsela para "¿qué normativas tenemos sobre RAEE?", "¿qué artículos hay en borrador?" o antes de redactar uno nuevo, para no repetir un tema.',
  esquema,
  async ejecutar(args: z.infer<typeof esquema>, { db }) {
    const limite = args.limite ?? 20
    const where: string[] = []
    const params: (string | number)[] = []
    if (args.soloBorradores) where.push(`estado = 'borrador'`)
    const q = args.buscar ? like(args.buscar) : null

    if (args.tipo === 'articulos') {
      if (q) {
        where.push(`(title LIKE ? ESCAPE '\\' OR category LIKE ? ESCAPE '\\' OR lede LIKE ? ESCAPE '\\')`)
        params.push(q, q, q)
      }
      const r = await db.execute({
        sql: `SELECT id, slug, category, date, title, lede, estado FROM posts ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
              ORDER BY id DESC LIMIT ?`,
        args: [...params, limite],
      })
      return ok({
        articulos: r.rows.map((p: any) => ({
          id: num(p.id),
          titulo: str(p.title),
          categoria: str(p.category),
          fecha: str(p.date),
          entradilla: textoSeguro(p.lede, 300),
          borrador: str(p.estado) === 'borrador',
          url: str(p.estado) === 'borrador' ? null : `/blog/${str(p.slug)}`,
          enlace: `/admin?tab=blog&id=${num(p.id)}`,
        })),
      })
    }

    if (q) {
      where.push(`(code LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\' OR tags LIKE ? ESCAPE '\\')`)
      params.push(q, q, q)
    }
    const r = await db.execute({
      sql: `SELECT id, code, title, body, tags, estado FROM normativas ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
            ORDER BY col ASC, position ASC, id ASC LIMIT ?`,
      args: [...params, limite],
    })
    return ok({
      normativas: r.rows.map((n: any) => ({
        id: num(n.id),
        codigo: str(n.code),
        titulo: str(n.title),
        descripcion: textoSeguro(n.body, 400),
        etiquetas: etiquetas(n.tags),
        borrador: str(n.estado) === 'borrador',
        enlace: `/admin?tab=normativas&id=${num(n.id)}`,
      })),
    })
  },
}
