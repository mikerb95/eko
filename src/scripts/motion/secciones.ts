/**
 * Piezas de sección de la portada: titulares, anillos del ciclo de servicios,
 * luz que sigue al cursor y el trazo de la EKORUTA. Cada función devuelve su
 * limpieza; lo que es GSAP lo revierte el contexto de `montarPagina`.
 */
import { CURVA, ScrollTrigger, SplitText, alEntrar, gsap } from './core'

/** Titular de sección línea por línea; el antetítulo y la nota lateral entran detrás. */
export function cabeceras(raiz: HTMLElement): void {
  raiz.querySelectorAll<HTMLElement>('[data-cabecera]').forEach((cab) => {
    const h2 = cab.querySelector('h2')
    const otros = cab.querySelectorAll('.eyebrow, .meta')
    const split = h2 ? SplitText.create(h2, { type: 'lines', mask: 'lines' }) : null
    if (split) gsap.set(split.lines, { yPercent: 105 })
    gsap.set(otros, { opacity: 0, y: 14 })
    alEntrar(cab, () => {
      if (split) gsap.to(split.lines, { yPercent: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out' })
      gsap.to(otros, { opacity: 1, y: 0, duration: 0.9, stagger: 0.15, delay: 0.2, ease: CURVA, clearProps: 'transform,opacity' })
    }, 'top 85%')
  })
}

/**
 * Anillos del ciclo: al entrar la rejilla, cada punto sale de arriba y recorre
 * el ciclo hasta su tramo, uno detrás de otro. Al apuntar una carta, su punto
 * da la vuelta completa: la línea es un momento de un ciclo que se cierra.
 */
export function ciclos(raiz: HTMLElement): () => void {
  const limpiezas: (() => void)[] = []
  raiz.querySelectorAll<HTMLElement>('[data-luz-rejilla]').forEach((rejilla) => {
    const anillos = [...rejilla.querySelectorAll<SVGSVGElement>('[data-ciclo]')]
    if (!anillos.length) return
    const giros = anillos.map((svg) => {
      const g = svg.querySelector<SVGGElement>('.ciclo-giro')!
      const reposo = Number(g.dataset.reposo)
      gsap.set(g, { rotation: 0, svgOrigin: '0 0' })
      return { svg, g, reposo }
    })
    alEntrar(rejilla, () => {
      giros.forEach(({ g, reposo }, i) => {
        gsap.to(g, { rotation: reposo, duration: 0.9 + reposo / 300, delay: 0.15 + i * 0.12, ease: 'power2.inOut' })
      })
    }, 'top 75%')

    giros.forEach(({ svg, g }) => {
      const carta = svg.closest<HTMLElement>('.svc')
      if (!carta) return
      let girando = false
      const vuelta = () => {
        if (girando || gsap.isTweening(g)) return
        girando = true
        gsap.to(g, { rotation: '+=360', duration: 1.1, ease: 'power2.inOut', onComplete: () => { girando = false } })
      }
      carta.addEventListener('pointerenter', vuelta)
      carta.addEventListener('focus', vuelta)
      limpiezas.push(() => {
        carta.removeEventListener('pointerenter', vuelta)
        carta.removeEventListener('focus', vuelta)
      })
    })
  })
  return () => limpiezas.forEach((fn) => fn())
}

/** Escribe la posición del cursor en cada carta de la rejilla (el halo es CSS). */
export function luz(raiz: HTMLElement): () => void {
  if (!matchMedia('(pointer: fine)').matches) return () => {}
  const limpiezas: (() => void)[] = []
  raiz.querySelectorAll<HTMLElement>('[data-luz-rejilla]').forEach((rejilla) => {
    const cartas = [...rejilla.querySelectorAll<HTMLElement>('.svc')]
    let marco = 0
    let x = 0
    let y = 0
    const pintar = () => {
      marco = 0
      for (const c of cartas) {
        const r = c.getBoundingClientRect()
        c.style.setProperty('--fx', `${x - r.left}px`)
        c.style.setProperty('--fy', `${y - r.top}px`)
      }
    }
    const mover = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!marco) marco = requestAnimationFrame(pintar)
    }
    rejilla.addEventListener('pointermove', mover)
    limpiezas.push(() => {
      rejilla.removeEventListener('pointermove', mover)
      cancelAnimationFrame(marco)
    })
  })
  return () => limpiezas.forEach((fn) => fn())
}

/**
 * EKORUTA: el trazo baja con el scroll y cada paso pasa por pendiente → en
 * curso → hecho cuando el trazo lo alcanza. Al llegar al último, cae el sello
 * de ciclo cerrado. Mide con offsetTop (maquetación), no con
 * getBoundingClientRect: la sección entra desplazada por `.reveal` y esas
 * medidas saldrían corridas.
 */
export function ruta(raiz: HTMLElement): () => void {
  const caja = raiz.querySelector<HTMLElement>('[data-ruta]')
  if (!caja) return () => {}
  const linea = caja.querySelector<HTMLElement>('.ruta-linea')!
  const progreso = caja.querySelector<HTMLElement>('.ruta-progreso')!
  const pasos = [...caja.querySelectorAll<HTMLElement>('[data-ruta-paso]')]
  const nodos = pasos.map((p) => p.querySelector<HTMLElement>('.ruta-nodo')!)
  const sello = raiz.querySelector<HTMLElement>('[data-ruta-sello]')
  if (!pasos.length) return () => {}

  let posiciones: number[] = []
  const medir = () => {
    // Los nodos son `position: relative` dentro de `.ruta` (también relativa): su offsetTop ya es local.
    const centros = nodos.map((n) => {
      let y = n.offsetHeight / 2
      let el: HTMLElement | null = n
      while (el && el !== caja) {
        y += el.offsetTop
        el = el.offsetParent as HTMLElement | null
      }
      return y
    })
    const alto = Math.max(1, centros[centros.length - 1] - centros[0])
    linea.style.top = `${centros[0]}px`
    linea.style.height = `${alto}px`
    posiciones = centros.map((c) => (c - centros[0]) / alto)
  }

  caja.classList.add('is-viva')
  medir()

  const estado = (p: number) => {
    let actual = -1
    posiciones.forEach((pos, i) => { if (p + 0.001 >= pos) actual = i })
    pasos.forEach((paso, i) => {
      paso.dataset.estado = i < actual || p >= 0.999 ? 'hecho' : i === actual ? 'actual' : 'pendiente'
    })
  }

  let selloTl: gsap.core.Tween | null = null
  if (sello) {
    gsap.set(sello, { opacity: 0, scale: 1.5, rotation: -12 })
    selloTl = gsap.to(sello, { opacity: 1, scale: 1, rotation: -3, duration: 0.45, ease: 'back.out(2.2)', paused: true })
  }

  gsap.set(progreso, { scaleY: 0 })
  estado(-1)
  gsap.to(progreso, {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: linea,
      start: 'top 62%',
      end: 'bottom 62%',
      scrub: 0.5,
      onUpdate: (st) => {
        estado(st.progress)
        if (selloTl) st.progress >= 0.999 ? selloTl.play() : selloTl.reverse()
      },
      invalidateOnRefresh: true,
    },
  })

  const ro = new ResizeObserver(() => {
    medir()
    ScrollTrigger.refresh()
  })
  ro.observe(caja)

  return () => {
    ro.disconnect()
    caja.classList.remove('is-viva')
    pasos.forEach((p) => delete p.dataset.estado)
    linea.style.removeProperty('top')
    linea.style.removeProperty('height')
  }
}
