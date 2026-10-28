// Costo de cada llamada del asistente del panel, con el `usage` que devuelve la
// API. Alimenta el tope diario (topes.ts) y el registro de consumo que se le
// factura a Ekosolv (consumo.ts). Es una ESTIMACIÓN: la cifra que manda es la
// de la consola de Claude Platform.
//
// Módulo PURO.

export const MODELO = 'claude-sonnet-5-5'

/**
 * USD por millón de tokens de Claude Sonnet 5.5. Leer de la caché cuesta 0,1x
 * la entrada y escribirla 1,25x. Verificada con la skill claude-api.
 */
export const TARIFA = { entrada: 2, salida: 10, cacheLectura: 0.2, cacheEscritura: 2.5 } as const
export const TARIFA_VIGENTE_DESDE = '2026-10-28'

export type Uso = { entrada: number; salida: number; cacheLectura: number; cacheEscritura: number }

export const USO_CERO: Uso = { entrada: 0, salida: 0, cacheLectura: 0, cacheEscritura: 0 }

type UsageApi = {
  input_tokens?: number | null
  output_tokens?: number | null
  cache_read_input_tokens?: number | null
  cache_creation_input_tokens?: number | null
}

export function sumarUso(a: Uso, u: UsageApi | null | undefined): Uso {
  return {
    entrada: a.entrada + (u?.input_tokens ?? 0),
    salida: a.salida + (u?.output_tokens ?? 0),
    cacheLectura: a.cacheLectura + (u?.cache_read_input_tokens ?? 0),
    cacheEscritura: a.cacheEscritura + (u?.cache_creation_input_tokens ?? 0),
  }
}

export function costoUsd(u: Uso): number {
  const m = 1_000_000
  return (
    (u.entrada * TARIFA.entrada) / m +
    (u.salida * TARIFA.salida) / m +
    (u.cacheLectura * TARIFA.cacheLectura) / m +
    (u.cacheEscritura * TARIFA.cacheEscritura) / m
  )
}

/**
 * Con `fallbacks` activado, si Sonnet declina por una regla de seguridad la
 * API repite la pregunta en otro modelo y la cobra a su tarifa. El costo se
 * calcula con la del modelo que respondió (`message.model`), y si es uno que
 * no está aquí, con la más cara: el tope no puede quedarse corto.
 * Tarifas verificadas con la skill claude-api el 2026-10-28.
 */
const TARIFAS: Record<string, { entrada: number; salida: number; cacheLectura: number; cacheEscritura: number }> = {
  'claude-sonnet-5-5': TARIFA,
  'claude-opus-5-5': { entrada: 4, salida: 20, cacheLectura: 0.2, cacheEscritura: 5 },
  'claude-fable-5-1': { entrada: 10, salida: 50, cacheLectura: 0.25, cacheEscritura: 12.5 },
}
const MAS_CARA = TARIFAS['claude-fable-5-1']!

export function costoUsdModelo(u: Uso, modelo: string | null | undefined): number {
  const t = (modelo && TARIFAS[modelo]) || (modelo === 'falso' ? { entrada: 0, salida: 0, cacheLectura: 0, cacheEscritura: 0 } : MAS_CARA)
  const m = 1_000_000
  return (u.entrada * t.entrada + u.salida * t.salida + u.cacheLectura * t.cacheLectura + u.cacheEscritura * t.cacheEscritura) / m
}
