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

/**
 * Zona visible del radar, en unidades de radio con el centro en (0, 0). El
 * disco es más grande que la card: su lado izquierdo se pierde detrás del borde
 * y arriba y abajo pasa por detrás del encabezado y del pie. Todos los puntos
 * caen dentro de esta caja para que ningún número quede cortado o tapado.
 */
export const ZONA = { xMin: -0.06, yMin: -0.5, yMax: 0.54, rMin: 0.26, rMax: 0.9 }
/** Arco que recorren los puntos: el lado derecho del disco, con un margen hacia arriba y abajo. */
const ARCO: [number, number] = [-8, 188]

/**
 * Caja del rótulo (número y año, a la derecha del punto) en unidades de radio,
 * medida con el radar en su tamaño más chico (190 px de radio, en móvil). Si no
 * chocan ahí, en escritorio tampoco: los puntos se separan y el rótulo no crece.
 */
export const ROTULO = { dx: 7 / 190, dy: 9 / 190, ancho: 52 / 190, alto: 26 / 190, holgura: 4 / 190 }

/** Radio máximo en un ángulo sin salirse de la zona visible. */
export function radioMaximo(angulo: number): number {
  const t = (angulo * Math.PI) / 180
  const s = Math.sin(t)
  const c = Math.cos(t)
  let r = ZONA.rMax
  if (c > 0) r = Math.min(r, -ZONA.yMin / c)
  if (c < 0) r = Math.min(r, ZONA.yMax / -c)
  if (s < 0) r = Math.min(r, -ZONA.xMin / -s)
  return r
}

/** Cuántos choques hay entre dos puntos con rótulo: rótulo contra rótulo y rótulo tapando un punto. */
export function choques(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const caja = (p: { x: number; y: number }) => ({
    l: p.x + ROTULO.dx,
    r: p.x + ROTULO.dx + ROTULO.ancho,
    t: p.y - ROTULO.dy,
    b: p.y - ROTULO.dy + ROTULO.alto,
  })
  const tapa = (c: ReturnType<typeof caja>, p: { x: number; y: number }) =>
    p.x > c.l - ROTULO.holgura && p.x < c.r && p.y > c.t - ROTULO.holgura && p.y < c.b + ROTULO.holgura
  const A = caja(a)
  const B = caja(b)
  let n = 0
  if (A.l < B.r && B.l < A.r && A.t < B.b && B.t < A.b) n++
  if (tapa(A, b)) n++
  if (tapa(B, a)) n++
  return n
}

export function normalizar(angulo: number): number {
  return ((angulo % 360) + 360) % 360
}

/**
 * Un punto por norma vigilada, todos con rótulo, repartidos a ángulos parejos
 * por el arco visible. El radio de cada uno se elige para que su rótulo no
 * choque con los anteriores (y, empatados, para quedar lo más lejos posible).
 * Las `destacadas` (las que tienen ficha) ocupan posiciones espaciadas, para
 * que el haz las visite a ritmo parejo; van primero en la lista.
 */
export function blipsRadar(total: number, destacadas: number): Blip[] {
  const n = Math.max(0, Math.floor(total))
  const d = Math.min(Math.max(0, Math.floor(destacadas)), n)
  const fichaDe = new Map<number, number>()
  for (let k = 0; k < d; k++) fichaDe.set(Math.floor(((k + 0.5) * n) / d), k)

  const puestos: (Blip & { x: number; y: number })[] = []
  for (let i = 0; i < n; i++) {
    const angulo = n === 1 ? 90 : ARCO[0] + ((ARCO[1] - ARCO[0]) * i) / (n - 1)
    const tope = radioMaximo(angulo)
    let mejor: { r: number; choques: number; holgura: number } | null = null
    for (let r = ZONA.rMin; r <= tope + 1e-9; r += 0.01) {
      const p = polar(angulo, r, 1)
      let c = 0
      let h = Infinity
      for (const q of puestos) {
        c += choques(p, q)
        h = Math.min(h, Math.hypot(p.x - q.x, p.y - q.y))
      }
      if (!mejor || c < mejor.choques || (c === mejor.choques && h > mejor.holgura)) mejor = { r, choques: c, holgura: h }
    }
    const radio = Math.round(mejor!.r * 100) / 100
    puestos.push({ angulo: Math.round(normalizar(angulo) * 10) / 10, radio, destacado: fichaDe.get(i) ?? null, ...polar(angulo, radio, 1) })
  }
  return puestos
    .map(({ angulo, radio, destacado }) => ({ angulo, radio, destacado }))
    .sort((a, b) => (a.destacado ?? n) - (b.destacado ?? n))
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
