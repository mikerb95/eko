// Escrituras del asistente: redactar un artículo del blog o una ficha de
// normativa EN BORRADOR. No sale en el sitio hasta que alguien la revise en el
// panel y desmarque "Borrador" (src/lib/cms.ts esconde los borradores en todas
// las lecturas públicas y en el sitemap).

import { z } from 'zod'
import { num, str } from '../herramientas/tipos.ts'
import { aPropuesta, errores, type Escritura, type Preparada } from './cambio.ts'

/** Igual que el slugify de /api/admin/posts. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

const recorte = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n)}…` : s)

// ── Artículo ────────────────────────────────────────────────────────────────

export const esquemaArticulo = z.object({
  titulo: z.string().trim().min(5).max(160),
  categoria: z.string().trim().max(60).optional().describe('Categoría del blog; por defecto General'),
  entradilla: z.string().trim().min(10).max(600).describe('Párrafo inicial que resume el artículo'),
  secciones: z
    .array(
      z.object({
        tipo: z.enum(['parrafo', 'subtitulo', 'cita', 'lista']),
        texto: z.string().trim().max(3000).optional().describe('Para parrafo, subtitulo y cita'),
        items: z.array(z.string().trim().min(1).max(500)).max(20).optional().describe('Solo para lista'),
      }),
    )
    .min(1)
    .max(30),
})
type Articulo = z.infer<typeof esquemaArticulo>

const TIPO_SECCION = { parrafo: 'p', subtitulo: 'h2', cita: 'pull', lista: 'list' } as const

function secciones(a: Articulo) {
  return a.secciones
    .map((s) => (s.tipo === 'lista' ? { type: 'list', items: s.items ?? [] } : { type: TIPO_SECCION[s.tipo], text: s.texto ?? '' }))
    .filter((s) => ('items' in s ? s.items.length > 0 : !!s.text))
}

async function slugLibre(db: Parameters<Escritura['preparar']>[1]['db'], base: string): Promise<string> {
  for (let i = 1; i <= 20; i++) {
    const slug = i === 1 ? base : `${base}-${i}`
    const r = await db.execute({ sql: 'SELECT 1 FROM posts WHERE slug = ? LIMIT 1', args: [slug] })
    if (!r.rows.length) return slug
  }
  return `${base}-${Date.now()}`
}

async function prepararArticulo(entrada: unknown, { db }: Parameters<Escritura['preparar']>[1]): Promise<Preparada<{ a: Articulo; slug: string }>> {
  const p = esquemaArticulo.safeParse(entrada ?? {})
  if (!p.success) return { ok: false, error: errores(p.error.issues) }
  const a = p.data
  const base = slugify(a.titulo)
  if (!base) return { ok: false, error: 'El título no sirve para armar la dirección del artículo.' }
  if (!secciones(a).length) return { ok: false, error: 'El artículo no tiene contenido.' }
  const slug = await slugLibre(db, base)
  const palabras = [a.entradilla, ...a.secciones.map((s) => s.texto ?? (s.items ?? []).join(' '))].join(' ').split(/\s+/).filter(Boolean).length
  return {
    ok: true,
    datos: { a, slug },
    vista: {
      tipo: 'cambio',
      rotulo: 'Artículo nuevo (borrador)',
      titulo: a.titulo,
      contexto: `${a.categoria || 'General'} · ${a.secciones.length} secciones · unas ${palabras} palabras`,
      cambios: [
        { campo: 'Dirección', antes: null, despues: `/blog/${slug}` },
        { campo: 'Entradilla', antes: null, despues: recorte(a.entradilla, 300) },
        ...a.secciones.filter((s) => s.tipo === 'subtitulo').map((s) => ({ campo: 'Subtítulo', antes: null, despues: recorte(s.texto ?? '') })),
      ],
      avisos: [],
      boton: 'Aprobar y guardar borrador',
      nota: 'Queda en borrador: no sale en el sitio hasta que lo revise y lo publique desde Blog.',
    },
  }
}

export const CREAR_BORRADOR_ARTICULO: Escritura = {
  nombre: 'crear_borrador_articulo',
  area: 'contenido',
  descripcion:
    'Redacta un artículo del blog y lo guarda EN BORRADOR (no se publica). No se ejecuta sola: la persona ve título, dirección y estructura y decide. Antes consulte contenido para no repetir un tema. Escriba en español de Colombia, sin cifras ni datos que no le hayan dado.',
  esquema: esquemaArticulo as unknown as Escritura['esquema'],
  async preparar(entrada, ctx) {
    const p = await prepararArticulo(entrada, ctx)
    return p.ok === true ? aPropuesta(p.vista) : p
  },
  async ejecutar(entrada, ctx) {
    try {
      const p = await prepararArticulo(entrada, ctx)
      if (p.ok === false) return p
      const { a, slug } = p.datos
      const fecha = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Bogota' })
      const minutos = Math.max(2, Math.round(JSON.stringify(secciones(a)).split(/\s+/).length / 200))
      const r = await ctx.db.execute({
        sql: `INSERT INTO posts (slug, category, date, readtime, accent, featured, title, lede, sections, image, estado, updated_at)
              VALUES (?, ?, ?, ?, 'deep', 0, ?, ?, ?, '', 'borrador', ?)`,
        args: [slug, a.categoria || 'General', fecha, `${minutos} min`, a.titulo, a.entradilla, JSON.stringify(secciones(a)), new Date().toISOString()],
      })
      const id = num(r.lastInsertRowid)
      return { ok: true, datos: { hecho: true, resumen: `Borrador "${a.titulo}" guardado`, enlace: `/admin?tab=blog&id=${id}` } }
    } catch (err) {
      console.error('[asistente] crear_borrador_articulo', err)
      return { ok: false, error: 'No se pudo guardar el borrador.' }
    }
  },
}

// ── Normativa ───────────────────────────────────────────────────────────────

export const esquemaNormativa = z.object({
  codigo: z.string().trim().min(3).max(60).describe('Por ejemplo RES 1297 · 2010'),
  titulo: z.string().trim().min(5).max(200),
  descripcion: z.string().trim().min(10).max(1500).describe('Qué regula y a quién aplica'),
  etiquetas: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  columna: z.union([z.literal(1), z.literal(2)]).optional().describe('Columna de /normativas; por defecto 1'),
})
type Normativa = z.infer<typeof esquemaNormativa>

async function prepararNormativa(entrada: unknown, { db }: Parameters<Escritura['preparar']>[1]): Promise<Preparada<Normativa>> {
  const p = esquemaNormativa.safeParse(entrada ?? {})
  if (!p.success) return { ok: false, error: errores(p.error.issues) }
  const n = p.data
  const r = await db.execute({ sql: 'SELECT id, estado FROM normativas WHERE lower(code) = lower(?) LIMIT 1', args: [n.codigo] })
  if (r.rows.length) {
    return { ok: false, error: `Ya existe una normativa con el código ${n.codigo}${str(r.rows[0]!.estado) === 'borrador' ? ' (en borrador)' : ''}.` }
  }
  return {
    ok: true,
    datos: n,
    vista: {
      tipo: 'cambio',
      rotulo: 'Normativa nueva (borrador)',
      titulo: `${n.codigo}: ${n.titulo}`,
      contexto: n.etiquetas?.length ? n.etiquetas.join(', ') : null,
      cambios: [{ campo: 'Descripción', antes: null, despues: recorte(n.descripcion, 400) }],
      avisos: [],
      boton: 'Aprobar y guardar borrador',
      nota: 'Queda en borrador: no sale en /normativas hasta que la revise y la publique desde Normativas.',
    },
  }
}

export const CREAR_BORRADOR_NORMATIVA: Escritura = {
  nombre: 'crear_borrador_normativa',
  area: 'contenido',
  descripcion:
    'Crea la ficha de una normativa EN BORRADOR para /normativas (no se publica). No se ejecuta sola: la persona la ve y decide. Antes consulte contenido para no duplicarla. Solo con el código y el contenido que le dieron; no invente artículos ni fechas de la norma.',
  esquema: esquemaNormativa as unknown as Escritura['esquema'],
  async preparar(entrada, ctx) {
    const p = await prepararNormativa(entrada, ctx)
    return p.ok === true ? aPropuesta(p.vista) : p
  },
  async ejecutar(entrada, ctx) {
    try {
      const p = await prepararNormativa(entrada, ctx)
      if (p.ok === false) return p
      const n = p.datos
      const pos = await ctx.db.execute({ sql: 'SELECT COALESCE(MAX(position), -1) + 1 AS p FROM normativas WHERE col = ?', args: [n.columna ?? 1] })
      const r = await ctx.db.execute({
        sql: `INSERT INTO normativas (col, position, code, title, body, tags, estado, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'borrador', ?)`,
        args: [n.columna ?? 1, num(pos.rows[0]?.p), n.codigo, n.titulo, n.descripcion, JSON.stringify(n.etiquetas ?? []), new Date().toISOString()],
      })
      return { ok: true, datos: { hecho: true, resumen: `Borrador de ${n.codigo} guardado`, enlace: `/admin?tab=normativas&id=${num(r.lastInsertRowid)}` } }
    } catch (err) {
      console.error('[asistente] crear_borrador_normativa', err)
      return { ok: false, error: 'No se pudo guardar el borrador.' }
    }
  },
}
