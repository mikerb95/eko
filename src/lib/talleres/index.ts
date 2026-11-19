/**
 * Registro de las capacitaciones presentadas desde el sitio. Para agregar la
 * 2, 3 o 4: crear su archivo (como taller1.ts) y sumarlo aquí. Módulo PURO.
 */
import { TALLER_1 } from './taller1.ts'
import type { Taller } from './tipos.ts'

export const TALLERES: Record<number, Taller> = { 1: TALLER_1 }

export function tallerDe(n: unknown): Taller | null {
  const k = Number(n)
  return Number.isInteger(k) ? (TALLERES[k] ?? null) : null
}
