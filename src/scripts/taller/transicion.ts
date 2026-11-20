/**
 * Cálculos puros de la cortina entre escenas (ver cortina.ts). Sin DOM, para
 * poder probarlos con node --test.
 */

export type Curva = [number, number, number, number]

const bez = (p1: number, p2: number, u: number) => 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u * u * p2 + u ** 3

/**
 * Fracción del tiempo (0..1) en la que una curva cubic-bezier llega a la
 * posición `y` (0..1). Sirve para saber cuándo pasa el borde de la cortina
 * por encima de una palabra.
 */
export function tiempoPara(c: Curva, y: number): number {
  if (y <= 0) return 0
  if (y >= 1) return 1
  let lo = 0
  let hi = 1
  for (let n = 0; n < 40; n++) {
    const u = (lo + hi) / 2
    if (bez(c[1], c[3], u) < y) lo = u
    else hi = u
  }
  return bez(c[0], c[2], (lo + hi) / 2)
}

const norma = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') || w
const esNumero = (w: string) => /^\d+$/.test(norma(w))

export interface Emparejo {
  /** Palabras que siguen en la escena nueva: [índice viejo, índice nuevo]. */
  pares: [number, number][]
  /** Números que cambian en el mismo lugar ("Idea 3" → "Idea 4"): ruedan. */
  numeros: [number, number][]
}

/**
 * Empareja las palabras de dos textos en orden (subsecuencia común más
 * larga, sin mayúsculas ni signos). Con `todas` en falso, una palabra corta
 * ("de", "la") solo cuenta si va pegada a otra que también se queda, para que
 * no salga volando sola de un extremo al otro del título.
 */
export function emparejar(a: string[], b: string[], todas = false): Emparejo {
  const na = a.map(norma)
  const nb = b.map(norma)
  const m = a.length
  const n = b.length
  const t = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) t[i]![j] = na[i] === nb[j] ? t[i + 1]![j + 1]! + 1 : Math.max(t[i + 1]![j]!, t[i]![j + 1]!)
  }
  const lcs: [number, number][] = []
  for (let i = 0, j = 0; i < m && j < n; ) {
    if (na[i] === nb[j]) {
      lcs.push([i, j])
      i++
      j++
    } else if (t[i + 1]![j]! >= t[i]![j + 1]!) i++
    else j++
  }
  const pegada = (k: number) => {
    const [i, j] = lcs[k]!
    const p = lcs[k - 1]
    const s = lcs[k + 1]
    return (p !== undefined && p[0] === i - 1 && p[1] === j - 1) || (s !== undefined && s[0] === i + 1 && s[1] === j + 1)
  }
  const pares = todas ? lcs : lcs.filter(([i], k) => na[i]!.length >= 4 || esNumero(a[i]!) || pegada(k))

  const numeros: [number, number][] = []
  const anclas: [number, number][] = [[-1, -1], ...pares, [m, n]]
  for (let k = 0; k < anclas.length - 1; k++) {
    const [i0, j0] = anclas[k]!
    const [i1, j1] = anclas[k + 1]!
    const vi: number[] = []
    const nj: number[] = []
    for (let i = i0 + 1; i < i1; i++) if (esNumero(a[i]!)) vi.push(i)
    for (let j = j0 + 1; j < j1; j++) if (esNumero(b[j]!)) nj.push(j)
    for (let q = 0; q < Math.min(vi.length, nj.length); q++) numeros.push([vi[q]!, nj[q]!])
  }
  return { pares, numeros }
}
