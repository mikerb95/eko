/**
 * Barrido del radar normativo (ver RadarNormativo.astro).
 *
 * El haz gira solo; cuando cruza un punto, el punto emite una onda y, si tiene
 * ficha, la ficha se enciende un momento. Dos maneras de tomar el control:
 * - Apuntar o enfocar una ficha: el haz va a buscar su punto y se queda ahí.
 *   Nada se mueve bajo el cursor mientras alguien lee la ficha.
 * - Mover el cursor sobre la pantalla del radar: el haz sigue al cursor.
 * Fuera de pantalla o con la pestaña oculta, el bucle no corre.
 */
import { gsap, mientrasSeVea } from './core'
import { cruzo, giroHacia, normalizar } from '../../lib/radarGeom'

/** Grados por segundo: una vuelta cada 6 s, lo bastante lenta para leer cada destello. */
const VELOCIDAD = 60
/** Cuánto se queda encendida una ficha después de que el haz la toca. */
const ENCENDIDO_MS = 1500

export function montarRadar(raiz: HTMLElement): () => void {
  const pantalla = raiz.querySelector<HTMLElement>('[data-radar-pantalla]')
  const haz = raiz.querySelector<HTMLElement>('[data-radar-haz]')
  if (!pantalla || !haz) return () => {}

  const blips = [...raiz.querySelectorAll<SVGGElement>('[data-radar-blip]')].map((g) => ({
    g,
    angulo: Number(g.dataset.angulo),
    ficha: g.dataset.ficha !== undefined ? Number(g.dataset.ficha) : null,
    onda: g.querySelector<SVGCircleElement>('.rd-onda')!,
  }))
  const fichas = [...raiz.querySelectorAll<HTMLElement>('[data-radar-ficha]')]
  const apagados = new Map<HTMLElement, number>()

  // Arranca justo antes del primer punto con ficha para que el primer destello
  // llegue en cuanto el radar aparece, no a los 5 s.
  let angulo = normalizar((blips.find((b) => b.ficha !== null)?.angulo ?? 0) - 25)
  /** Modo: girando solo, apuntando a una ficha, o siguiendo al cursor. */
  let modo: 'barrido' | 'ficha' | 'cursor' = 'barrido'
  let objetivoCursor = angulo
  let giro: gsap.core.Tween | null = null

  const pintar = () => haz.style.setProperty('--haz', `${angulo.toFixed(2)}deg`)
  pintar()

  const encender = (i: number) => {
    const f = fichas[i]
    if (!f) return
    f.classList.add('is-hit')
    clearTimeout(apagados.get(f))
    apagados.set(f, window.setTimeout(() => f.classList.remove('is-hit'), ENCENDIDO_MS))
  }

  const destello = (b: (typeof blips)[number]) => {
    gsap.fromTo(b.onda, { attr: { r: 3 }, opacity: 0.9 }, { attr: { r: b.ficha !== null ? 16 : 10 }, opacity: 0, duration: 1.1, ease: 'power2.out' })
    // Como en un radar de verdad: el punto se enciende al pasar el haz y se va apagando.
    gsap.fromTo(b.g, { opacity: 1 }, { opacity: b.ficha !== null ? 0.85 : 0.4, duration: 2.6, ease: 'power1.in' })
    if (b.ficha !== null) encender(b.ficha)
  }

  /** Avanza el haz de `antes` a `angulo` y hace destellar lo que haya cruzado. */
  const avanzar = (antes: number) => {
    for (const b of blips) if (cruzo(antes, angulo, b.angulo)) destello(b)
    pintar()
  }

  const tick = (_t: number, dt: number) => {
    const antes = angulo
    if (modo === 'barrido') {
      angulo = normalizar(angulo + (VELOCIDAD * Math.min(dt, 64)) / 1000)
    } else if (modo === 'cursor') {
      // Sigue al cursor con inercia, siempre en sentido horario para que los destellos sigan valiendo.
      const falta = giroHacia(angulo, objetivoCursor)
      if (falta > 0.5 && falta < 359.5) angulo = normalizar(angulo + Math.min(falta * 0.12, 14))
    } else {
      return // 'ficha': lo mueve el tween de `apuntar`.
    }
    avanzar(antes)
  }

  const apuntar = (i: number) => {
    const b = blips.find((x) => x.ficha === i)
    if (!b) return
    modo = 'ficha'
    giro?.kill()
    const proxy = { a: angulo }
    const destino = angulo + giroHacia(angulo, b.angulo)
    giro = gsap.to(proxy, {
      a: destino,
      duration: 0.5 + giroHacia(angulo, b.angulo) / 600,
      ease: 'power3.inOut',
      onUpdate: () => {
        const antes = angulo
        angulo = normalizar(proxy.a)
        avanzar(antes)
      },
    })
  }

  const soltar = () => {
    giro?.kill()
    giro = null
    modo = 'barrido'
  }

  const limpiezas: (() => void)[] = []
  const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, ev: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(ev, fn as EventListener)
    limpiezas.push(() => el.removeEventListener(ev, fn as EventListener))
  }

  fichas.forEach((f, i) => {
    on(f, 'pointerenter', () => apuntar(i))
    on(f, 'focus', () => apuntar(i))
    on(f, 'pointerleave', () => { if (document.activeElement !== f) soltar() })
    on(f, 'blur', soltar)
  })

  // En táctil no hay "pasar por encima": el haz no se queda pegado a un dedo.
  if (matchMedia('(pointer: fine)').matches) {
    on(pantalla, 'pointermove', (e) => {
      const r = pantalla.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      objetivoCursor = normalizar((Math.atan2(dx, -dy) * 180) / Math.PI)
      if (modo !== 'ficha') modo = 'cursor'
    })
    on(pantalla, 'pointerleave', () => { if (modo === 'cursor') modo = 'barrido' })
  }

  limpiezas.push(
    mientrasSeVea(
      raiz,
      () => gsap.ticker.add(tick),
      () => gsap.ticker.remove(tick),
    ),
  )

  return () => {
    limpiezas.forEach((fn) => fn())
    giro?.kill()
    apagados.forEach((t) => clearTimeout(t))
    fichas.forEach((f) => f.classList.remove('is-hit'))
    haz.style.removeProperty('--haz')
  }
}
