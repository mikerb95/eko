/**
 * Fuente única de verdad para las cifras públicas de Ekosolv.
 *
 * Cualquier dato que aparezca en más de una página —o en español y en inglés—
 * vive aquí. No escribir estas cifras a mano en los .astro: se desincronizan.
 */

export const FOUNDED_YEAR = 2013

/** Años de trayectoria, calculados. No fijar a mano. */
export const yearsActive = new Date().getFullYear() - FOUNDED_YEAR

/** Cifras del hero y del bloque "Por los números". */
export const stats = {
  /** Toneladas de RAEE gestionadas desde FOUNDED_YEAR. PENDIENTE-DATO: actualizar a 2026. */
  tonnesManaged: 1000,
  /** Porcentaje de radicaciones aprobadas ante la ANLA. */
  approvalRate: 98,
  /** Sanciones en firme entre clientes activos. */
  sanctions: 0,
  /** Líneas de servicio integradas: EKONSULTING, EKORAEE, EKOPARTNER, EKOTRADING. */
  serviceLines: 4,
} as const

/** Números escritos, para titulares donde el dígito queda mal tipográficamente. */
const SPELLED_ES: Record<number, string> = {
  10: 'Diez', 11: 'Once', 12: 'Doce', 13: 'Trece', 14: 'Catorce',
  15: 'Quince', 16: 'Dieciséis', 17: 'Diecisiete', 18: 'Dieciocho',
  19: 'Diecinueve', 20: 'Veinte',
}

const SPELLED_EN: Record<number, string> = {
  10: 'Ten', 11: 'Eleven', 12: 'Twelve', 13: 'Thirteen', 14: 'Fourteen',
  15: 'Fifteen', 16: 'Sixteen', 17: 'Seventeen', 18: 'Eighteen',
  19: 'Nineteen', 20: 'Twenty',
}

/** "Trece" / "Thirteen". Cae al dígito fuera del rango cubierto. */
export function yearsSpelled(lang: 'es' | 'en' = 'es'): string {
  const table = lang === 'en' ? SPELLED_EN : SPELLED_ES
  return table[yearsActive] ?? String(yearsActive)
}

/**
 * "1.000+" / "1,000+". El separador de miles cambia entre es-CO y en —
 * escribirlo a mano en cada plantilla es cómo se cuelan las erratas.
 */
export function tonnesManaged(lang: 'es' | 'en' = 'es'): string {
  const locale = lang === 'en' ? 'en-US' : 'es-CO'
  return `${stats.tonnesManaged.toLocaleString(locale)}+`
}
