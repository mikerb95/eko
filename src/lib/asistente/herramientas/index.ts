// Catálogo de consultas del asistente del panel. SOLO LECTURA, y una prueba
// lo comprueba (asistente.test.ts). Las escrituras viven aparte
// (src/lib/asistente/escrituras/) y el motor se detiene a pedir aprobación
// antes de ejecutar cada una.
//
// Las herramientas de Zoho entran en la fase 6, cuando existan credenciales.

import { puedeConsultar } from '../permisos.ts'
import { CONTACTOS } from './contactos.ts'
import { CONTENIDO } from './contenido.ts'
import { CUMPLIMIENTO } from './cumplimiento.ts'
import { BUSCAR_EN_PANEL } from './panel.ts'
import { RECOLECCIONES } from './recolecciones.ts'
import { fallo, type Contexto, type Herramienta, type Resultado } from './tipos.ts'

export type { Contexto, Herramienta, Resultado }

export const HERRAMIENTAS: readonly Herramienta[] = [RECOLECCIONES, CONTACTOS, CUMPLIMIENTO, CONTENIDO, BUSCAR_EN_PANEL]

export const herramienta = (nombre: string) => HERRAMIENTAS.find((h) => h.nombre === nombre)

/** Las consultas que recibe el modelo según el rol de quien pregunta. */
export const herramientasDe = (rol: string) => HERRAMIENTAS.filter((h) => puedeConsultar(rol, h.area))

/**
 * Valida permiso y entrada, y ejecuta. Nunca lanza: un error de la base o una
 * entrada inválida vuelven como resultado fallido, para que el modelo pueda
 * reaccionar en vez de tumbar la conversación.
 */
export async function ejecutar(nombre: string, entrada: unknown, ctx: Contexto): Promise<Resultado> {
  const h = herramienta(nombre)
  if (!h) return fallo(`Herramienta desconocida: ${nombre}`)
  if (!puedeConsultar(ctx.usuario.rol, h.area)) return fallo('Su rol no tiene acceso a esa información.')
  const parsed = h.esquema.safeParse(entrada ?? {})
  if (!parsed.success) return fallo(`Entrada inválida para ${nombre}: ${parsed.error.issues.map((i) => i.message).join('; ')}`)
  try {
    return await h.ejecutar(parsed.data, ctx)
  } catch (err) {
    console.error(`[asistente] la consulta ${nombre} falló`, err)
    return fallo('La consulta falló. Intente de nuevo en un momento.')
  }
}
