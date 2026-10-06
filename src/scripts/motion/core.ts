/**
 * Núcleo del motion del sitio. Registra GSAP una sola vez y resuelve el ciclo
 * de vida con `ClientRouter`: cada página monta su motion en `astro:page-load`
 * y lo desmonta en `astro:before-swap`, para que no queden ScrollTriggers ni
 * bucles de la página anterior corriendo sobre un DOM que ya no existe.
 *
 * Regla de la casa (fail-open): el HTML del servidor es el estado final. El
 * script fija el estado inicial y anima hacia el final; si algo falla, se
 * revierte todo y la página queda como la pintó el servidor.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

export { gsap, ScrollTrigger, SplitText }

export const reducido = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Curva de la casa: la misma que usan las transiciones CSS del sitio (.2,.7,.2,1). */
export const CURVA = 'power3.out'

type Limpieza = () => void

/**
 * Monta el motion de la página cuyo contenedor cumple `selector`. `montar` corre
 * dentro de un `gsap.context`, así que todo tween, ScrollTrigger y SplitText que
 * cree se revierte solo; lo que no sea GSAP (observers, listeners) lo limpia la
 * función que devuelva.
 */
export function montarPagina(selector: string, montar: (raiz: HTMLElement) => Limpieza | void): void {
  let limpiar: Limpieza | null = null

  const init = () => {
    const raiz = document.querySelector<HTMLElement>(selector)
    if (!raiz || raiz.dataset.motion === 'on') return
    raiz.dataset.motion = 'on'
    let extra: Limpieza | void
    // El contexto se crea antes de montar: si `montar` lanza, igual hay qué revertir.
    const ctx = gsap.context(() => {}, raiz)
    try {
      ctx.add(() => {
        extra = montar(raiz)
      })
    } catch (e) {
      ctx.revert()
      delete raiz.dataset.motion
      throw e
    }
    limpiar = () => {
      try { extra?.() } finally {
        ctx.revert()
        delete raiz.dataset.motion
      }
    }
    // Las medidas cambian cuando llegan las fuentes (Instrument Serif es ancha).
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }

  const seguro = () => {
    try {
      init()
    } catch (e) {
      console.error('[motion]', e)
      limpiar?.()
      limpiar = null
    }
  }

  document.addEventListener('astro:page-load', seguro)
  document.addEventListener('astro:before-swap', () => {
    limpiar?.()
    limpiar = null
  })
  // El módulo puede evaluarse después del primer page-load; la bandera evita
  // montar dos veces.
  if (document.readyState !== 'loading') seguro()
}

/**
 * Llama a `activar`/`desactivar` según el elemento esté en pantalla y la
 * pestaña visible. Es el interruptor de todos los bucles: fuera de vista no se
 * gasta ni un fotograma.
 */
export function mientrasSeVea(
  el: Element,
  activar: () => void,
  desactivar: () => void,
  margen = '0px',
): Limpieza {
  let enVista = false
  let activo = false
  const sync = () => {
    const debe = enVista && document.visibilityState === 'visible'
    if (debe === activo) return
    activo = debe
    debe ? activar() : desactivar()
  }
  const io = new IntersectionObserver(([en]) => {
    enVista = en.isIntersecting
    sync()
  }, { rootMargin: margen })
  io.observe(el)
  document.addEventListener('visibilitychange', sync)
  return () => {
    io.disconnect()
    document.removeEventListener('visibilitychange', sync)
    if (activo) desactivar()
  }
}

/**
 * Ejecuta `fn` una vez cuando `el` entra en pantalla. Ayudante con bandera en
 * vez de `once: true`, que se autodestruye dentro del refresh de otro trigger y
 * deja secciones sin entrar.
 */
export function alEntrar(el: Element, fn: () => void, start = 'top 82%'): void {
  let hecho = false
  ScrollTrigger.create({
    trigger: el,
    start,
    onEnter: () => {
      if (hecho) return
      hecho = true
      fn()
    },
  })
}
