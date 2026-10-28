// "¿Dónde veo...?": el menú del panel con palabras clave y fichas de la base
// (órdenes, contactos, expedientes, artículos). La parte del menú es pura y la
// usa también el buscador sin IA de la caja (fase 8).

import { z } from 'zod'
import { like, num, ok, str, type Herramienta } from './tipos.ts'

export type EntradaMenu = { titulo: string; enlace: string; claves: string[]; soloAdmin?: boolean }

export const MENU: readonly EntradaMenu[] = [
  { titulo: 'Recolecciones', enlace: '/admin?tab=recolecciones', claves: ['ordenes', 'recoleccion', 'raee', 'residuos', 'rutas', 'programar'] },
  { titulo: 'Contactos', enlace: '/admin?tab=contactos', claves: ['mensajes', 'formulario', 'clientes', 'prospectos'] },
  { titulo: 'Blog', enlace: '/admin?tab=blog', claves: ['articulos', 'publicaciones', 'notas', 'borradores'] },
  { titulo: 'Normativas', enlace: '/admin?tab=normativas', claves: ['normas', 'leyes', 'decretos', 'resoluciones'] },
  { titulo: 'Cumplimiento', enlace: '/admin/cumplimiento', claves: ['alertas', 'expedientes', 'autos', 'actos', 'anla', 'plazos', 'agente'] },
  { titulo: 'Usuarios', enlace: '/admin?tab=usuarios', claves: ['roles', 'permisos', 'cuentas', 'contraseñas'], soloAdmin: true },
]

/** Quita tildes y pasa a minúsculas para comparar. */
export const normalizar = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

export function buscarEnMenu(consulta: string, rol: string): EntradaMenu[] {
  const palabras = normalizar(consulta).split(/\s+/).filter((p) => p.length > 2)
  if (!palabras.length) return []
  return MENU.filter((m) => !m.soloAdmin || rol === 'admin').filter((m) => {
    const texto = normalizar([m.titulo, ...m.claves].join(' '))
    return palabras.some((p) => texto.includes(p) || p.includes(normalizar(m.titulo)))
  })
}

const esquema = z.object({
  consulta: z.string().trim().min(1).max(80).describe('Qué busca: una sección del panel, un consecutivo, una empresa, un expediente'),
})

export const BUSCAR_EN_PANEL: Herramienta = {
  nombre: 'buscar_en_panel',
  area: 'panel',
  descripcion:
    'Encuentra dónde está algo en el panel: secciones y fichas de órdenes, contactos, expedientes o artículos, con su enlace. Úsela para "¿dónde veo...?" o "lléveme a...".',
  esquema,
  async ejecutar(args: z.infer<typeof esquema>, { db, usuario }) {
    const q = like(args.consulta)
    const [ordenes, contactos, expedientes, articulos] = await Promise.all([
      db.execute({ sql: `SELECT id, consecutive, company, city FROM orders WHERE consecutive LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\' ORDER BY id DESC LIMIT 5`, args: [q, q] }),
      db.execute({ sql: `SELECT id, name, company FROM contacts WHERE name LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\' ORDER BY id DESC LIMIT 5`, args: [q, q] }),
      db.execute({ sql: `SELECT id, cliente, numero FROM expedientes WHERE cliente LIKE ? ESCAPE '\\' OR numero LIKE ? ESCAPE '\\' ORDER BY id DESC LIMIT 5`, args: [q, q] }),
      db.execute({ sql: `SELECT id, title FROM posts WHERE title LIKE ? ESCAPE '\\' ORDER BY id DESC LIMIT 5`, args: [q] }),
    ])
    return ok({
      secciones: buscarEnMenu(args.consulta, usuario.rol).map(({ titulo, enlace }) => ({ titulo, enlace })),
      fichas: [
        ...ordenes.rows.map((r: any) => ({ tipo: 'Orden', titulo: `${str(r.consecutive)} ${str(r.company)}`.trim(), enlace: `/admin?tab=recolecciones&id=${num(r.id)}` })),
        ...contactos.rows.map((r: any) => ({ tipo: 'Contacto', titulo: [str(r.name), str(r.company)].filter(Boolean).join(', '), enlace: `/admin?tab=contactos&id=${num(r.id)}` })),
        ...expedientes.rows.map((r: any) => ({ tipo: 'Expediente', titulo: `${str(r.numero)} (${str(r.cliente)})`, enlace: `/admin/cumplimiento?expediente=${num(r.id)}` })),
        ...articulos.rows.map((r: any) => ({ tipo: 'Artículo', titulo: str(r.title), enlace: `/admin?tab=blog&id=${num(r.id)}` })),
      ],
    })
  },
}
