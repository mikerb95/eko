/**
 * El PC vinculado (/pc): el participante abre la presentación en su PC con el
 * código de dos números que le muestra el celular, y el PC sigue la escena de
 * quien dicta. Solo servidor; lo usan el middleware, /academia/taller/<n>,
 * /pc y /api/academia/pc.
 */
import { verificarPaseSala, type PaseSala } from '../auth.ts'
import { hoyEnBogota } from '../agente/diasHabiles.ts'
import { tallerEnCurso, type EstadoTaller } from './datos.ts'

/** El pase del PC, si es de hoy (sin consultar la base: sirve en el middleware). */
export async function pasePC(token: string | undefined | null): Promise<PaseSala | null> {
  const pase = await verificarPaseSala(token)
  return pase && pase.f === hoyEnBogota() ? pase : null
}

/** La capacitación que puede seguir este PC: la del pase, si está en curso ahora. */
export async function vistaPC(token: string | undefined | null): Promise<{ pase: PaseSala; estado: EstadoTaller } | null> {
  const pase = await pasePC(token)
  if (!pase) return null
  const estado = await tallerEnCurso()
  return estado && estado.taller === pase.t ? { pase, estado } : null
}
