/**
 * La sala del celular sin cuenta: quién es la persona según su pase firmado
 * (cookie eko_sala) y si ese pase sirve para la capacitación en curso. Solo
 * servidor; lo usan /academia/sala y /api/academia/sala.
 */
import { verificarPaseSala } from '../auth.ts'
import { hoyEnBogota } from '../agente/diasHabiles.ts'
import { tallerDe } from './index.ts'
import { asistenteDe, tallerEnCurso, type Asistente, type EstadoTaller } from './datos.ts'
import type { Taller } from './tipos.ts'

export interface SalaActual {
  /** La capacitación en curso, si hay. */
  estado: EstadoTaller | null
  t: Taller | null
  /** La persona registrada, solo si su pase es de esta capacitación y de hoy. */
  asistente: Asistente | null
}

export async function salaActual(token: string | undefined | null): Promise<SalaActual> {
  const estado = await tallerEnCurso()
  const t = estado ? (tallerDe(estado.taller) ?? null) : null
  if (!estado || !t) return { estado: null, t: null, asistente: null }
  const pase = await verificarPaseSala(token)
  if (!pase || pase.t !== t.n || pase.f !== hoyEnBogota()) return { estado, t, asistente: null }
  const asistente = await asistenteDe(pase.a)
  return { estado, t, asistente: asistente && asistente.taller === t.n ? asistente : null }
}
