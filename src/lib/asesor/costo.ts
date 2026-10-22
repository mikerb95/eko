// Costo de una pregunta al asesor, con el `usage` de cada respuesta de la API.
// Alimenta el tope de gasto diario (presupuesto.ts). La cifra que manda es la
// de la consola de Claude; esto es la estimación para no pasarse.
//
// Módulo PURO.

export const MODELO = 'claude-haiku-5-5'

/**
 * USD por millón de tokens (Haiku 5.5, prompts de hasta 100K tokens, que es
 * siempre el caso aquí). Leer de la caché cuesta 0,1x la entrada y escribirla
 * 1,25x. Tarifa verificada el 2026-10-21.
 */
export const TARIFA = { entrada: 0.1, salida: 0.5, cacheLectura: 0.01, cacheEscritura: 0.125 } as const

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
