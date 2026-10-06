/**
 * Geometría del radar normativo de la portada. Sin DOM: la usa el componente
 * para pintar los puntos en el servidor y el script para saber cuándo el haz
 * pasa por cada uno. Los tests están en `radarGeom.test.ts`.
 *
 * Ángulos en grados, 0 arriba y creciendo en sentido horario (como un radar de
 * verdad y como `rotate()` en CSS). El radio va de 0 (centro) a 1 (borde).
 */

export interface Blip {
  /** Ángulo en grados, [0, 360). */
  angulo: number
  /** Distancia al centro, (0, 1). */
  radio: number
  /** Índice de la ficha que representa, o null si es una norma sin ficha. */
  destacado: number | null
}

/** Ángulos fijos de las fichas destacadas: repartidas para que el haz las visite a ritmo parejo. */
const ANGULOS_DESTACADOS = [52, 172, 292]
const RADIO_DESTACADOS = [0.62, 0.42, 0.72]

/** Ángulo dorado: reparte el resto de normas sin que se amontonen ni dibujen un patrón. */
const DORADO = 137.508

export function normalizar(angulo: number): number {
  return ((angulo % 360) + 360) % 360
}

/**
 * Un punto por norma vigilada. Las `destacadas` primeras llevan ficha; el resto
 * se reparte en espiral dorada lejos de ellas, para que el total de puntos
 * coincida con la cifra "normativas bajo seguimiento".
 */
export function blipsRadar(total: number, destacadas: number): Blip[] {
  const n = Math.max(0, Math.floor(total))
  const d = Math.min(Math.max(0, Math.floor(destacadas)), ANGULOS_DESTACADOS.length, n)
  const blips: Blip[] = []
  for (let i = 0; i < d; i++) {
    blips.push({ angulo: ANGULOS_DESTACADOS[i], radio: RADIO_DESTACADOS[i], destacado: i })
  }
  let k = 0
  while (blips.length < n) {
    const angulo = normalizar(20 + k * DORADO)
    // Radio entre 0.28 y 0.88: ni pegado al centro ni cortado por el borde.
    const radio = 0.28 + ((k * 0.381966) % 1) * 0.6
    k++
    // Lejos de las destacadas, para que el destello de una ficha no se confunda.
    const choca = blips.some(
      (b) => b.destacado !== null && distanciaAngular(b.angulo, angulo) < 14 && Math.abs(b.radio - radio) < 0.2,
    )
    if (!choca || k > n * 20) blips.push({ angulo: Math.round(angulo * 10) / 10, radio: Math.round(radio * 100) / 100, destacado: null })
  }
  return blips
}

/** Distancia más corta entre dos ángulos, [0, 180]. */
export function distanciaAngular(a: number, b: number): number {
  const d = Math.abs(normalizar(a) - normalizar(b))
  return d > 180 ? 360 - d : d
}

/**
 * ¿El haz pasó por `objetivo` al ir de `antes` a `despues`? El haz solo avanza
 * en sentido horario; `despues` puede haber dado la vuelta (359 → 3).
 */
export function cruzo(antes: number, despues: number, objetivo: number): boolean {
  const a = normalizar(antes)
  const recorrido = normalizar(despues - antes)
  if (recorrido === 0) return false
  const hasta = normalizar(objetivo - a)
  return hasta > 0 && hasta <= recorrido
}

/** Coordenadas en un viewBox centrado en 0 con radio `r`. */
export function polar(angulo: number, radio: number, r = 100): { x: number; y: number } {
  const t = (angulo * Math.PI) / 180
  // `+ 0` convierte -0 en 0: en un atributo SVG da igual, en una comparación no.
  return {
    x: Math.round(Math.sin(t) * radio * r * 100) / 100 + 0,
    y: Math.round(-Math.cos(t) * radio * r * 100) / 100 + 0,
  }
}

/**
 * Giro que debe recorrer el haz para apuntar a `objetivo` siempre hacia
 * adelante (sentido horario), con una vuelta mínima de `minimo` grados para
 * que el gesto se lea como "va a buscarla".
 */
export function giroHacia(actual: number, objetivo: number, minimo = 0): number {
  let g = normalizar(objetivo - actual)
  while (g < minimo) g += 360
  return g
}
