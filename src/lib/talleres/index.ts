/**
 * Registro de las capacitaciones presentadas desde el sitio. Para agregar la
 * 2, 3 o 4: crear su archivo (como taller1.ts) y sumarlo aquí. Módulo PURO.
 * Las presentaciones aparte (el refuerzo de la 1) van del 5 en adelante para
 * no ocupar el número de una capacitación del programa, y llevan `nombre`.
 */
import { TALLER_1 } from './taller1.ts'
import { TALLER_2 } from './taller2.ts'
import { REFUERZO_1 } from './refuerzo1.ts'
import type { Taller } from './tipos.ts'

export const TALLERES: Record<number, Taller> = { 1: TALLER_1, 2: TALLER_2, 5: REFUERZO_1 }

/** Cómo se nombra en pantalla: "Capacitación 2" o, si tiene, su nombre propio. */
export const nombreTaller = (t: Taller) => t.nombre ?? `Capacitación ${t.n}`

export function tallerDe(n: unknown): Taller | null {
  const k = Number(n)
  return Number.isInteger(k) ? (TALLERES[k] ?? null) : null
}
