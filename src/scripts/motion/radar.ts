/**
 * Barrido del radar normativo (ver RadarNormativo.astro).
 *
 * El haz gira solo; cuando cruza un punto, el punto y su número se encienden
 * y, si tiene ficha, la ficha también, con una línea que va del punto a ella.
 * Cada vez que el haz pasa por el norte sale un ping desde el centro, y el
 * encabezado lleva la lectura del azimut. Dos maneras de tomar el control:
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
    punto: g.querySelector<SVGCircleElement>('[data-radar-punto]')!,
    rotulo: raiz.querySelector<HTMLElement>(`[data-radar-rotulo="${g.dataset.radarBlip}"]`),
  }))
  const ping = raiz.querySelector<SVGCircleElement>('[data-radar-ping]')
  const az = raiz.querySelector<HTMLElement>('[data-radar-az]')
  const lienzo = raiz.querySelector<SVGSVGElement>('[data-radar-enlaces]')
  const enlaces = [...raiz.querySelectorAll<SVGPathElement>('[data-radar-enlace]')]
  const fichas = [...raiz.querySelectorAll<HTMLElement>('[data-radar-ficha]')]
  const apagados = new Map<HTMLElement, number>()

  // Arranca justo antes del primer punto con ficha para que el primer destello
  // llegue en cuanto el radar aparece, no a los 5 s.
  let angulo = normalizar((blips.find((b) => b.ficha !== null)?.angulo ?? 0) - 25)
  /** Modo: girando solo, apuntando a una ficha, o siguiendo al cursor. */
  let modo: 'barrido' | 'ficha' | 'cursor' = 'barrido'
  let objetivoCursor = angulo
  let giro: gsap.core.Tween | null = null

  let lectura = -1
  const pintar = () => {
    haz.style.setProperty('--haz', `${angulo.toFixed(2)}deg`)
    // El texto solo se toca cuando cambia el grado entero, no en cada fotograma.
    const g = Math.floor(angulo)
    if (az && g !== lectura) {
      lectura = g
      az.textContent = String(g).padStart(3, '0')
    }
  }
  pintar()

  /**
   * Línea del punto a su ficha. Se calcula al momento con las cajas reales,
   * así sirve para cualquier ancho; si el lienzo está oculto (móvil), no hace nada.
   */
  const enlazar = (i: number, quedarse: boolean) => {
    const path = enlaces[i]
    const b = blips.find((x) => x.ficha === i)
    const f = fichas[i]
    if (!lienzo || !path || !b || !f || lienzo.getClientRects().length === 0) return
    const base = lienzo.getBoundingClientRect()
    const p = b.punto.getBoundingClientRect()
    const r = f.getBoundingClientRect()
    // Sale justo después del número, a la altura del punto: no tacha el rótulo.
    const n = b.rotulo?.getBoundingClientRect()
    const x1 = (n ? n.right + 6 : p.left + p.width / 2) - base.left
    const y1 = p.top + p.height / 2 - base.top
    const x2 = r.left - base.left
    const y2 = r.top + r.height / 2 - base.top
    const curva = Math.max(40, (x2 - x1) * 0.45)
    path.setAttribute('d', `M${x1},${y1} C${x1 + curva},${y1} ${x2 - curva},${y2} ${x2},${y2}`)
    const largo = path.getTotalLength()
    gsap.killTweensOf(path)
    const tl = gsap.timeline()
    tl.fromTo(path, { opacity: 0.9, strokeDasharray: `${largo} ${largo}`, strokeDashoffset: largo }, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' })
      // Dibujada, pasa a punteada: queda como guía sin pesar más que el texto.
      .set(path, { strokeDasharray: '3 4', strokeDashoffset: 0 })
    if (!quedarse) tl.to(path, { opacity: 0, duration: 0.6, ease: 'power1.in' }, ENCENDIDO_MS / 1000 - 0.3)
  }
  const desenlazar = (i: number) => {
    const path = enlaces[i]
    if (!path) return
    gsap.killTweensOf(path)
    gsap.to(path, { opacity: 0, duration: 0.3 })
  }

  const encender = (i: number) => {
    const f = fichas[i]
    if (!f) return
    f.classList.add('is-hit')
    clearTimeout(apagados.get(f))
    apagados.set(f, window.setTimeout(() => f.classList.remove('is-hit'), ENCENDIDO_MS))
    if (modo !== 'ficha') enlazar(i, false)
  }

  const latido = () => {
    if (!ping) return
    gsap.fromTo(ping, { attr: { r: 2 }, opacity: 0.55 }, { attr: { r: 100 }, opacity: 0, duration: 2.4, ease: 'power1.out' })
  }

  const destello = (b: (typeof blips)[number]) => {
    gsap.fromTo(b.onda, { attr: { r: 1.5 }, opacity: 0.9 }, { attr: { r: b.ficha !== null ? 8 : 5 }, opacity: 0, duration: 1.1, ease: 'power2.out' })
    // Como en un radar de verdad: el punto se enciende al pasar el haz y se va apagando.
    // El número lo acompaña, pero nunca baja tanto que deje de leerse.
    gsap.fromTo(b.g, { opacity: 1 }, { opacity: b.ficha !== null ? 0.85 : 0.4, duration: 2.6, ease: 'power1.in' })
    if (b.rotulo) gsap.fromTo(b.rotulo, { opacity: 1 }, { opacity: b.ficha !== null ? 0.9 : 0.55, duration: 2.6, ease: 'power1.in' })
    if (b.ficha !== null) encender(b.ficha)
  }

  /** Avanza el haz de `antes` a `angulo` y hace destellar lo que haya cruzado. */
  const avanzar = (antes: number) => {
    for (const b of blips) if (cruzo(antes, angulo, b.angulo)) destello(b)
    if (cruzo(antes, angulo, 0)) latido()
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
    enlaces.forEach((_, j) => j !== i && desenlazar(j))
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
      // Mientras alguien lee la ficha, la línea se queda.
      onComplete: () => enlazar(i, true),
    })
  }

  const soltar = () => {
    giro?.kill()
    giro = null
    modo = 'barrido'
    enlaces.forEach((_, j) => desenlazar(j))
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
    gsap.killTweensOf([...enlaces, ping, ...blips.map((b) => b.rotulo)].filter(Boolean))
    enlaces.forEach((p) => { p.removeAttribute('style'); p.removeAttribute('d') })
    // Solo la opacidad: el `style` del rótulo también lleva su posición.
    blips.forEach((b) => b.rotulo && gsap.set(b.rotulo, { clearProps: 'opacity' }))
  }
}
