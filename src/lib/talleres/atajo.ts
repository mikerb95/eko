/**
 * Atajos cortos de quien dicta (/proyector y /control). Sin número llevan a la
 * capacitación en curso, o a la primera publicada si no hay ninguna; con
 * número (/proyector/2) llevan a esa. La página de destino exige la sesión.
 */
import { TALLERES } from './index'
import { tallerEnCurso } from './datos'

export async function numeroAtajo(param: string | undefined): Promise<number> {
  const pedido = Number(param)
  if (param && TALLERES[pedido]) return pedido
  const actual = await tallerEnCurso().catch(() => null)
  if (actual && TALLERES[actual.taller]) return actual.taller
  return Math.min(...Object.keys(TALLERES).map(Number))
}
