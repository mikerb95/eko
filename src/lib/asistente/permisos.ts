// Qué puede consultar y qué puede proponer cada rol desde el asistente del
// panel (matriz de docs/plan-asistente.md, decidida por Mike el 2026-10-28).
//
// Las áreas del panel salen de WRITE_RULES (src/lib/reglasEscritura.ts), la
// misma tabla del middleware: quien puede escribir en un área desde el panel
// puede proponer cambios en ella desde el chat, y nadie más. Las de Zoho no
// tienen pantalla en el panel y se fijan aquí.
//
// Defensa en profundidad: esta matriz decide qué herramientas recibe el
// modelo, y el motor la vuelve a mirar al ejecutar y al aprobar.
//
// Módulo PURO.

import type { Role } from '../users.ts'
import { rolesQueEscriben } from '../reglasEscritura.ts'

export const AREAS = [
  'panel',
  'recolecciones',
  'contactos',
  'cumplimiento',
  'contenido',
  'zoho_crm',
  'zoho_books',
  'zoho_workdrive',
  'zoho_campaigns',
] as const
export type Area = (typeof AREAS)[number]

const TODOS: readonly Role[] = ['admin', 'operaciones', 'logistica', 'consultor', 'finanzas', 'lectura']
const ZOHO_PROPONEN: readonly Role[] = ['admin', 'operaciones', 'logistica', 'consultor']

/** Roles de la tabla del middleware, con el tipo de rol. */
const escriben = (prefix: string) => rolesQueEscriben(prefix) as readonly Role[]

/** Comunes a artículos y normativas: el asistente solo propone si puede escribir en ambos. */
const contenido = escriben('/api/admin/posts').filter((r) => escriben('/api/admin/normativas').includes(r))

export const MATRIZ: Record<Area, { consultan: readonly Role[]; proponen: readonly Role[] }> = {
  // buscar_en_panel: todos buscan; no tiene escrituras.
  panel: { consultan: TODOS, proponen: [] },
  // En el panel todo GET es de cualquier sesión, así que todos consultan.
  recolecciones: { consultan: TODOS, proponen: escriben('/api/admin/recolecciones') },
  contactos: { consultan: TODOS, proponen: escriben('/api/admin/contactos') },
  cumplimiento: { consultan: TODOS, proponen: escriben('/api/admin/cumplimiento') },
  contenido: { consultan: TODOS, proponen: contenido },
  zoho_crm: { consultan: TODOS, proponen: ZOHO_PROPONEN },
  zoho_workdrive: { consultan: TODOS, proponen: ZOHO_PROPONEN },
  zoho_campaigns: { consultan: TODOS, proponen: ZOHO_PROPONEN },
  // Books es dinero: solo admin y finanzas lo ven y proponen en él.
  zoho_books: { consultan: ['admin', 'finanzas'], proponen: ['admin', 'finanzas'] },
}

export const puedeConsultar = (rol: string, area: Area) => (MATRIZ[area].consultan as readonly string[]).includes(rol)
export const puedeProponer = (rol: string, area: Area) => (MATRIZ[area].proponen as readonly string[]).includes(rol)

/** ¿Es un rol conocido? Una sesión con un rol raro no recibe ninguna herramienta. */
export const esRol = (rol: string): rol is Role => (TODOS as readonly string[]).includes(rol)
