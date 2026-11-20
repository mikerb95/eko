/**
 * Cortina entre escenas del proyector (View Transitions).
 *
 * Un borde vertical barre el lienzo en la dirección del avance: lo que queda
 * detrás del borde ya es la escena nueva y lo que está delante sigue siendo la
 * vieja. Cada pieza (fondo de la escena, punto del kicker, cada palabra, el
 * cuerpo y el pie) tiene su propia transición y se recorta con clip-path justo
 * donde pasa el borde, así que todo queda sincronizado con la franja visible.
 *
 * - Dentro del mismo bloque la franja es delgada; las palabras que se repiten
 *   entre los títulos no se borran: se deslizan a su nuevo lugar, y un número
 *   que cambia en el mismo sitio ("Idea 3" → "Idea 4") rueda como un contador.
 * - Al cambiar de bloque la franja es un panel del color del bloque, más ancho
 *   que la pantalla, que frena en el centro con el nombre del bloque.
 *
 * Si llega otro clic a mitad de camino, la transición en curso se termina de
 * golpe y la siguiente arranca cuando el DOM ya cambió.
 */
import { emparejar, tiempoPara, type Curva } from './transicion'

type VT = { skipTransition(): void; finished: Promise<void>; updateCallbackDone: Promise<void> }
type DocVT = Document & { startViewTransition?: (fn: () => void) => VT }

export const soportaTransiciones = () => typeof (document as DocVT).startViewTransition === 'function'

export interface Cambio {
  viejo: HTMLElement
  nuevo: HTMLElement
  adelante: boolean
  /** Solo si la escena nueva abre otro bloque. */
  bloque: { titulo: string; rotulo: string } | null
  /** Palabras del kicker y del título de una escena, ya partidas en elementos. */
  palabras: (escena: HTMLElement) => { kicker: HTMLElement[]; titulo: HTMLElement[] }
  /** Cambia el DOM a la escena nueva (corre dentro de la transición). */
  cambiar: () => void
}

const css = (c: Curva) => `cubic-bezier(${c.join(',')})`
const FINA: { w: number; t: number; curva: Curva } = { w: 0.014, t: 0.95, curva: [0.65, 0, 0.35, 1] }
// El panel de bloque entra rápido, frena en el centro para que se lea el
// nombre y sale rápido.
const PANEL: { w: number; t: number; curva: Curva } = { w: 1.3, t: 1.6, curva: [0.2, 0.85, 0.8, 0.15] }
const LIBRE = 400 // px de holgura arriba, abajo y en el lado que no barre (sombras, descendentes)

export function crearCortina(lienzo: HTMLElement, pie: HTMLElement | null) {
  const cortina = document.createElement('div')
  cortina.className = 'tl-cortina'
  cortina.setAttribute('aria-hidden', 'true')
  cortina.innerHTML = '<div class="tl-cortina-panel"><div class="tl-cortina-txt"><span></span><b></b></div></div>'
  lienzo.append(cortina)
  const rotulo = cortina.querySelector('span')!
  const titulo = cortina.querySelector('b')!
  const estilo = document.createElement('style')
  document.head.append(estilo)

  let nombrados: HTMLElement[] = []
  let actual: VT | null = null
  let cola: Promise<unknown> = Promise.resolve()

  const nombrar = (el: HTMLElement, n: string) => {
    el.style.setProperty('view-transition-name', n)
    nombrados.push(el)
  }
  const desnombrar = (dentro: HTMLElement) => {
    nombrados = nombrados.filter((el) => {
      if (!dentro.contains(el)) return true
      el.style.removeProperty('view-transition-name')
      return false
    })
  }
  const limpiar = () => {
    for (const el of nombrados) el.style.removeProperty('view-transition-name')
    nombrados = []
    cortina.className = 'tl-cortina'
    estilo.textContent = ''
  }

  function arrancar(c: Cambio): Promise<unknown> {
    limpiar()
    const doc = document as DocVT
    const modo = c.bloque ? PANEL : FINA
    const { w: W, t: T, curva } = modo
    const ancho = lienzo.offsetWidth
    const recorrido = (1 + W) * ancho
    const anim = `${T}s ${css(curva)} both`
    const reglas: string[] = []

    // Geometría en px del lienzo sin escalar (la misma que ven los pseudo
    // elementos de la transición).
    const L = lienzo.getBoundingClientRect()
    const escala = L.width / ancho
    const local = (el: HTMLElement) => {
      const r = el.getBoundingClientRect()
      return { x: (r.left - L.left) / escala, w: r.width / escala }
    }
    const ins = (t: number, r: number, b: number, l: number) => `${t}px ${r}px ${b}px ${l}px`

    // El borde delantero P recorre de 0 a (1+W)·ancho con la curva; el trasero
    // va W·ancho detrás. Lo viejo se recorta donde pasa P y lo nuevo aparece
    // donde pasa el trasero. El inset varía lineal con P, así que con la misma
    // curva y duración queda pegado al panel (por eso los extremos son exactos:
    // cualquier ajuste rompe la proporción). En el lado que barre, el recorte
    // empieza y termina en el borde del lienzo, así que no corta sombras.
    const borrar = (n: string, el: HTMLElement) => {
      const { x, w } = local(el)
      const [c0, c1] = c.adelante
        ? [ins(-LIBRE, -LIBRE, -LIBRE, -x), ins(-LIBRE, -LIBRE, -LIBRE, recorrido - x)]
        : [ins(-LIBRE, w + x - ancho, -LIBRE, -LIBRE), ins(-LIBRE, w + x - ancho + recorrido, -LIBRE, -LIBRE)]
      reglas.push(`::view-transition-old(${n}){--c0:${c0};--c1:${c1};animation:tl-vt-clip ${anim}}`)
    }
    const revelar = (n: string, el: HTMLElement) => {
      const { x, w } = local(el)
      const [c0, c1] = c.adelante
        ? [ins(-LIBRE, w + x + W * ancho, -LIBRE, -LIBRE), ins(-LIBRE, w + x - ancho, -LIBRE, -LIBRE)]
        : [ins(-LIBRE, -LIBRE, -LIBRE, ancho + W * ancho - x), ins(-LIBRE, -LIBRE, -LIBRE, -x)]
      reglas.push(`::view-transition-new(${n}){--c0:${c0};--c1:${c1};animation:tl-vt-clip ${anim}}`)
    }
    // Momento (s) en que el borde delantero (o el trasero) pasa por el centro de el.
    const paso = (el: HTMLElement, trasero: boolean) => {
      const { x, w } = local(el)
      const xc = x + w / 2
      const p = (c.adelante ? xc : ancho - xc) + (trasero ? W * ancho : 0)
      return tiempoPara(curva, p / recorrido) * T
    }

    // ---- Estado viejo ----
    const pv = c.palabras(c.viejo)
    const pn = c.palabras(c.nuevo)
    const texto = (els: HTMLElement[]) => els.map((e) => e.textContent ?? '')
    const vacio = { pares: [] as [number, number][], numeros: [] as [number, number][] }
    const ek = c.bloque ? vacio : emparejar(texto(pv.kicker), texto(pn.kicker), true)
    const et = c.bloque ? vacio : emparejar(texto(pv.titulo), texto(pn.titulo))

    let cuenta = 0
    const plan: { viejo?: HTMLElement; nuevo?: HTMLElement; tipo: 'queda' | 'numero' | 'sale' | 'entra'; n: string }[] = []
    for (const [grupoV, grupoN, e] of [[pv.kicker, pn.kicker, ek], [pv.titulo, pn.titulo, et]] as const) {
      const usadosV = new Set<number>()
      const usadosN = new Set<number>()
      for (const [i, j] of e.pares) {
        plan.push({ viejo: grupoV[i], nuevo: grupoN[j], tipo: 'queda', n: `tl-p${cuenta++}` })
        usadosV.add(i)
        usadosN.add(j)
      }
      for (const [i, j] of e.numeros) {
        plan.push({ viejo: grupoV[i], tipo: 'numero', n: `tl-nv${cuenta}` })
        plan.push({ nuevo: grupoN[j], tipo: 'numero', n: `tl-nn${cuenta++}` })
        usadosV.add(i)
        usadosN.add(j)
      }
      grupoV.forEach((el, i) => usadosV.has(i) || plan.push({ viejo: el, tipo: 'sale', n: `tl-s${cuenta++}` }))
      grupoN.forEach((el, j) => usadosN.has(j) || plan.push({ nuevo: el, tipo: 'entra', n: `tl-e${cuenta++}` }))
    }

    const piezas = (esc: HTMLElement) => [
      [esc, 'tl-escena'],
      [esc.querySelector<HTMLElement>('.tl-kicker'), 'tl-kicker'],
      [esc.querySelector<HTMLElement>('.tl-cuerpo'), 'tl-cuerpo'],
    ] as const

    for (const [el, n] of piezas(c.viejo)) {
      if (!el) continue
      nombrar(el, n)
      borrar(n, el)
    }
    if (pie) {
      nombrar(pie, 'tl-pie')
      borrar('tl-pie', pie)
    }
    for (const p of plan) {
      if (!p.viejo) continue
      nombrar(p.viejo, p.n)
      if (p.tipo === 'sale') borrar(p.n, p.viejo)
      else if (p.tipo === 'numero') reglas.push(`::view-transition-old(${p.n}){animation:tl-vt-sube .38s cubic-bezier(.55,0,.8,.3) ${paso(p.viejo, false)}s both}::view-transition-group(${p.n}){overflow:clip}`)
    }

    // ---- Estado nuevo (dentro de la transición) ----
    const mostrar = () => {
      desnombrar(c.viejo)
      c.cambiar()
      for (const [el, n] of piezas(c.nuevo)) {
        if (!el) continue
        nombrar(el, n)
        revelar(n, el)
      }
      if (pie) revelar('tl-pie', pie)
      for (const p of plan) {
        if (!p.nuevo) continue
        nombrar(p.nuevo, p.n)
        if (p.tipo === 'entra') revelar(p.n, p.nuevo)
        else if (p.tipo === 'numero') reglas.push(`::view-transition-new(${p.n}){animation:tl-vt-sube-entra .55s cubic-bezier(.16,1,.3,1) ${paso(p.nuevo, true)}s both}::view-transition-group(${p.n}){overflow:clip}`)
        else {
          const r = `animation-duration:${T * 0.8}s;animation-delay:${T * 0.06}s;animation-timing-function:cubic-bezier(.65,0,.35,1)`
          reglas.push(`::view-transition-group(${p.n}){${r}}::view-transition-old(${p.n}),::view-transition-new(${p.n}){${r}}`)
        }
      }
      const color = getComputedStyle(c.nuevo).getPropertyValue('--bloque').trim() || '#179C91'
      cortina.style.setProperty('--w', String(W))
      cortina.style.setProperty('--t', `${T}s`)
      cortina.style.setProperty('--curva', css(curva))
      cortina.style.setProperty('--c', color)
      rotulo.textContent = c.bloque?.rotulo ?? ''
      titulo.textContent = c.bloque?.titulo ?? ''
      cortina.className = `tl-cortina on${c.bloque ? ' bloque' : ''}${c.adelante ? '' : ' atras'}`
      estilo.textContent = reglas.join('\n')
    }

    let t: VT
    try {
      t = doc.startViewTransition!(mostrar)
    } catch (e) {
      console.error('[taller] transición', e)
      limpiar()
      c.cambiar()
      return Promise.resolve()
    }
    actual = t
    t.finished
      .catch(() => {})
      .finally(() => {
        if (actual !== t) return
        actual = null
        limpiar()
      })
    return t.updateCallbackDone.catch(() => {})
  }

  return {
    correr(c: Cambio) {
      actual?.skipTransition()
      cola = cola.then(() => arrancar(c))
    },
  }
}
