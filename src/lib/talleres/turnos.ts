/**
 * Turnos de acompañamiento de la práctica (capacitación 2, Mike 2026-11-25):
 * quien dicta pasa 15 minutos con cada persona en su puesto. El presentador
 * arma la fila con los registrados del día, empieza y termina cada turno; el
 * proyector muestra a quién acompaña y quién sigue, y el celular le avisa a
 * cada uno cuando le sigue. Módulo PURO (los datos viven en datos.ts).
 */

export type EstadoTurno = 'espera' | 'ahora' | 'hecho'

export interface Turno {
  id: number
  asistente_id: number
  orden: number
  estado: EstadoTurno
  /** Marca (ms del servidor) de cuando empezó; 0 si no ha empezado. */
  inicio: number
}

export const ordenarTurnos = <T extends Turno>(ts: T[]): T[] => [...ts].sort((a, b) => a.orden - b.orden || a.id - b.id)

/** El turno en curso, si hay. */
export const turnoActual = <T extends Turno>(ts: T[]): T | null => ordenarTurnos(ts).find((t) => t.estado === 'ahora') ?? null

/** El siguiente en la fila (el primero que espera). */
export const turnoSiguiente = <T extends Turno>(ts: T[]): T | null => ordenarTurnos(ts).find((t) => t.estado === 'espera') ?? null

export interface MiTurno {
  estado: EstadoTurno
  /** Personas que esperan antes que usted (sin contar al que está en turno). */
  delante: number
  /** Posición en la fila completa, desde 1. */
  posicion: number
  total: number
  /** true si es el siguiente en la fila. */
  sigue: boolean
  /** Minutos aproximados para que empiece su turno (0 si ya es su turno o ya pasó). */
  minutos: number
}

/**
 * Lo que ve una persona en el celular. La espera aproximada cuenta lo que le
 * falta al turno en curso más un turno completo por cada persona delante.
 */
export function miTurno(ts: Turno[], asistenteId: number, minutosTurno: number, ahora = Date.now()): MiTurno | null {
  const fila = ordenarTurnos(ts)
  const k = fila.findIndex((t) => t.asistente_id === asistenteId)
  if (k < 0) return null
  const yo = fila[k]!
  const delante = fila.slice(0, k).filter((t) => t.estado === 'espera').length
  const actual = fila.find((t) => t.estado === 'ahora')
  const restaActual = actual ? Math.max(0, minutosTurno - Math.floor((ahora - actual.inicio) / 60_000)) : 0
  return {
    estado: yo.estado,
    delante,
    posicion: k + 1,
    total: fila.length,
    sigue: yo.estado === 'espera' && delante === 0,
    minutos: yo.estado === 'espera' ? restaActual + delante * minutosTurno : 0,
  }
}

/** Texto del aviso en el celular. */
export function avisoTurno(t: MiTurno | null): { titulo: string; texto: string; tono: 'ahora' | 'sigue' | 'espera' | 'hecho' } | null {
  if (!t) return null
  if (t.estado === 'ahora') return { titulo: 'Es su turno', texto: 'Quien dicta va para su puesto. Tenga a la mano su caso y el reto en el que va.', tono: 'ahora' }
  if (t.estado === 'hecho') return { titulo: 'Acompañamiento hecho', texto: 'Siga con los retos que le faltan. Si le surge una duda, envíela por aquí.', tono: 'hecho' }
  if (t.sigue) return { titulo: 'Le sigue a usted', texto: `Su turno empieza en unos ${Math.max(1, t.minutos)} minutos. Deje abierto lo que quiere mostrar.`, tono: 'sigue' }
  return { titulo: `Turno ${t.posicion} de ${t.total}`, texto: `Hay ${t.delante} ${t.delante === 1 ? 'persona' : 'personas'} antes que usted (unos ${t.minutos} minutos). Mientras tanto, siga con los retos.`, tono: 'espera' }
}

/** Cuántas personas marcaron cada reto como hecho. */
export function conteoRetos(ids: string[], avances: { retos: string[] }[]): Record<string, number> {
  const c: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]))
  for (const a of avances) for (const r of new Set(a.retos)) if (r in c) c[r]!++
  return c
}

/** El caso que trae la persona: una línea, sin espacios de sobra. */
export const MAX_CASO = 200
export function validarCaso(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/\s+/g, ' ').trim()
  return t.length >= 3 && t.length <= MAX_CASO ? t : null
}
