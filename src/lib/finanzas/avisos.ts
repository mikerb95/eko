/**
 * Qué aviso le toca a cada obligación hoy. Módulo PURO.
 *
 * Promesa de la oferta: avisos por correo a 15, 7, 3 y 1 día hábil. Si a 3
 * días la obligación sigue sin cerrarse, el aviso también le llega a Gerencia.
 *
 * - Cada umbral se avisa una sola vez (clave `ob:<id>:<umbral>` en fin_avisos).
 * - Si un día no corre la tarea, o la obligación se crea tarde, se envía el
 *   umbral más cercano que aplique, no todos los atrasados juntos.
 * - "Vence hoy" (0 días) cuenta como el aviso de 1 día si no salió antes.
 * - Las vencidas no generan aviso diario: salen en el resumen del lunes.
 */
import { habilesRestantes } from '../agente/diasHabiles.ts'
import { cerrada } from './estados.ts'

export const UMBRALES = [15, 7, 3, 1] as const
export const ESCALA_DESDE = 3

export interface ObligacionAviso {
  id: number
  vence: string
  estado: string
}

export interface AvisoDelDia {
  obligacion_id: number
  umbral: number
  restantes: number
  escalar: boolean
  clave: string
}

export const claveAviso = (id: number, umbral: number) => `ob:${id}:${umbral}`

export function avisoDelDia(o: ObligacionAviso, hoy: string, enviados: ReadonlySet<string>): AvisoDelDia | null {
  if (cerrada(o) || !/^\d{4}-\d{2}-\d{2}$/.test(o.vence)) return null
  const restantes = habilesRestantes(hoy, o.vence)
  if (restantes < 0 || restantes > UMBRALES[0]) return null
  const umbral = Math.min(...UMBRALES.filter((u) => restantes <= u))
  const clave = claveAviso(o.id, umbral)
  if (enviados.has(clave)) return null
  return { obligacion_id: o.id, umbral, restantes, escalar: umbral <= ESCALA_DESDE, clave }
}

export function avisosDelDia(obs: readonly ObligacionAviso[], hoy: string, enviados: ReadonlySet<string>): AvisoDelDia[] {
  return obs.map((o) => avisoDelDia(o, hoy, enviados)).filter((a): a is AvisoDelDia => !!a)
}

/** Nivel para pintar en el panel y contar en el menú. */
export function nivel(o: ObligacionAviso, hoy: string): 'cerrada' | 'vencida' | 'urgente' | 'pronto' | 'al_dia' | 'sin_fecha' {
  if (cerrada(o)) return 'cerrada'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.vence)) return 'sin_fecha'
  const r = habilesRestantes(hoy, o.vence)
  if (r < 0) return 'vencida'
  if (r <= ESCALA_DESDE) return 'urgente'
  if (r <= UMBRALES[0]) return 'pronto'
  return 'al_dia'
}

/** Texto del plazo: "Vence hoy", "Falta 1 día hábil", "Vencida hace 3 días hábiles". */
export function textoPlazo(restantes: number): string {
  if (restantes === 0) return 'Vence hoy'
  if (restantes === 1) return 'Falta 1 día hábil'
  if (restantes > 1) return `Faltan ${restantes} días hábiles`
  if (restantes === -1) return 'Vencida hace 1 día hábil'
  return `Vencida hace ${-restantes} días hábiles`
}

/** ¿Hoy toca resumen semanal (lunes) o mensual (día 1)? */
export function resumenesDeHoy(hoy: string): { semanal: boolean; mensual: boolean } {
  const d = new Date(`${hoy}T12:00:00Z`)
  return { semanal: d.getUTCDay() === 1, mensual: d.getUTCDate() === 1 }
}

/** Suma días calendario a `AAAA-MM-DD`. */
export function masDias(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
