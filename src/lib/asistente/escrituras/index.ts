// Escrituras del asistente del panel. Ninguna se ejecuta sola: el motor se
// detiene en cada una, enseña la tarjeta y espera el "Aprobar". No están en el
// catálogo de consultas (herramientas/index.ts).
//
// Todas siguen la misma forma: `preparar` lee la base y arma la tarjeta sin
// escribir; `ejecutar` vuelve a preparar (entre la propuesta y el clic pudo
// cambiar la base) y solo entonces escribe, con la condición en el UPDATE.
//
// Las de Zoho entran en la fase 6.

import { puedeProponer } from '../permisos.ts'
import { ACTUALIZAR_ALERTA } from './alerta.ts'
import { CREAR_BORRADOR_ARTICULO, CREAR_BORRADOR_NORMATIVA } from './borrador.ts'
import type { ContextoEscritura, Escritura, PropuestaPreparada, ResultadoEscritura } from './cambio.ts'
import { ACTUALIZAR_CONTACTO } from './contacto.ts'
import { ACTUALIZAR_RECOLECCION } from './recoleccion.ts'
import type { Contexto } from '../herramientas/tipos.ts'

export type { Escritura }

export const ESCRITURAS: readonly Escritura[] = [
  ACTUALIZAR_RECOLECCION,
  ACTUALIZAR_CONTACTO,
  ACTUALIZAR_ALERTA,
  CREAR_BORRADOR_ARTICULO,
  CREAR_BORRADOR_NORMATIVA,
]

export const escritura = (nombre: string) => ESCRITURAS.find((e) => e.nombre === nombre)

/** Las acciones que el modelo puede proponer según el rol de quien pregunta. */
export const escriturasDe = (rol: string) => ESCRITURAS.filter((e) => puedeProponer(rol, e.area))

const SIN_PERMISO = 'Su rol no puede hacer ese cambio. Dígale a la persona qué rol puede hacerlo o dónde se hace en el panel.'

/** Arma la tarjeta con chequeo de permiso. Nunca lanza. */
export async function prepararEscritura(nombre: string, entrada: unknown, ctx: Contexto): Promise<PropuestaPreparada> {
  const e = escritura(nombre)
  if (!e) return { ok: false, error: `${nombre} no es una acción que se pueda proponer.` }
  if (!puedeProponer(ctx.usuario.rol, e.area)) return { ok: false, error: SIN_PERMISO }
  try {
    return await e.preparar(entrada, ctx)
  } catch (err) {
    console.error(`[asistente] no se pudo preparar ${nombre}`, err)
    return { ok: false, error: 'No se pudo preparar la propuesta. Intente de nuevo en un momento.' }
  }
}

/**
 * Ejecuta una escritura YA APROBADA. `ctx.usuario` es quien hizo clic, con su
 * rol leído de nuevo de la base (motor): si perdió el permiso desde que se
 * propuso, no se escribe.
 */
export async function ejecutarEscritura(nombre: string, entrada: unknown, ctx: ContextoEscritura): Promise<ResultadoEscritura> {
  const e = escritura(nombre)
  if (!e) return { ok: false, error: `${nombre} no es una acción conocida.` }
  if (!puedeProponer(ctx.usuario.rol, e.area)) return { ok: false, error: SIN_PERMISO }
  return e.ejecutar(entrada, ctx)
}
