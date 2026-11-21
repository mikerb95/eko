/**
 * Motor de Clawd (dibujo en components/taller/Clawd.astro). Cada escena que lo
 * tiene crea un controlador con `clawdDe(el, api)` y lo hace actuar con sus
 * pasos: teclear, saltar, decir algo en un globo, cambiar los ojos, sudar,
 * dormir, pensar entre varios tokens y escoger uno, apilar hojas en la mesa o
 * derrumbarlas. Al salir de la escena todo se apaga solo.
 *
 * Todo se mueve en unidades enteras de la cuadrícula del dibujo (snap) para
 * que siga pareciendo pixel art. Con movimiento reducido no hay movimiento:
 * los globos y los ojos cambian igual (son información), pero sin animación.
 */
import { gsap, reducido } from '../motion/core'
import { consultar } from './comun'
import type { Api } from './escenas'

const azar = (a: number, b: number) => a + Math.random() * (b - a)
const entero = (a: number, b: number) => Math.floor(azar(a, b + 1))

export type Ojos = 'normal' | 'cerrados' | 'entrecerrados' | 'blanco' | 'confundido'
export type Opcion = string | { texto: string; nota?: string }

export interface Clawd {
  /**
   * Teclea en ráfagas hasta que se apague. `alRafaga` corre al final de cada
   * una y `alGolpe` con cada tecla.
   */
  teclear(on: boolean, o?: { alRafaga?: () => void; alGolpe?: () => void; descansos?: boolean }): void
  /** Salto con aterrizaje; con `brazos` los levanta y con `saludo` saluda al bajar. */
  saltar(o?: { brazos?: boolean; saludo?: boolean; alto?: number }): Promise<void>
  /**
   * Globo. Sin `ms` el texto queda fijo; con `ms` se ve ese tiempo y vuelve el
   * fijo. Con `soltar`, si hay otro temporal a la vista, ese no se borra: se
   * vuelve un globo de pensamiento que se va flotando hacia arriba.
   */
  decir(texto: string, o?: { ms?: number; tipo?: 'pregunta' | 'ok'; soltar?: boolean }): void
  callar(): void
  ojos(m: Ojos): void
  mirar(x: number, y: number): void
  sudor(on: boolean): void
  dormir(on: boolean): void
  /**
   * Muestra las opciones sobre la cabeza (con su nota, p. ej. la probabilidad),
   * duda entre ellas y la elegida vuela a `destino`.
   */
  pensar(opciones: Opcion[], elegida: string, destino: Element | null): Promise<void>
  /** Un token sale de detrás de la cabeza y sube hasta la franja `destino`. */
  lanzar(texto: string, clase: string, destino: Element): void
  /**
   * Encierra la palabra `destino` en una ficha que sale de su cabeza y vuela
   * hasta su lugar en el párrafo; al llegar la ficha se suelta y queda la
   * palabra. `alLlegar` corre siempre (también sin animación).
   */
  entregar(destino: HTMLElement, alLlegar: () => void): void
  /** Deja `n` hojas en la pila de la mesa (las nuevas caen si `animar`). */
  apilar(n: number, animar?: boolean): void
  /** Llegan más hojas de las que caben y las de arriba se caen de la mesa. */
  derrumbar(): Promise<void>
  /**
   * Saca la varita y sopla burbujas en bucle (tandas, a veces una gigante, a
   * veces persigue una y la revienta de un cabezazo) hasta que se apague.
   * Solo si el dibujo trae la varita (prop `burbujas` de Clawd.astro).
   */
  burbujas(on: boolean): void
  /** Vuelve a la postura neutra: ojos normales, sin globo, sin sudor, quieto. */
  reposo(): void
  destruir(): void
}

const CLAVE = '_clawd'

/** Controlador de Clawd de la escena (se crea una vez por entrada). */
export function clawdDe(escena: HTMLElement, api: Api): Clawd | null {
  const previo = (escena as any)[CLAVE] as Clawd | undefined
  if (previo) return previo
  const raiz = escena.querySelector<HTMLElement>('[data-clawd]')
  if (!raiz) return null
  const c = crear(escena, raiz)
  ;(escena as any)[CLAVE] = c
  api.limpiar(() => {
    c.destruir()
    ;(escena as any)[CLAVE] = undefined
  })
  return c
}

/**
 * Clawd fuera de las escenas (p. ej. en el aviso "Empezamos en"): vive lo que
 * dure la página, así que no se apaga al cambiar de escena.
 */
export function clawdSuelto(contenedor: HTMLElement): Clawd | null {
  const raiz = contenedor.querySelector<HTMLElement>('[data-clawd]')
  return raiz ? crear(contenedor, raiz) : null
}

/** El de la escena, si ya se creó (para los hooks de paso). */
export const clawdEn = (escena: HTMLElement): Clawd | null => ((escena as any)[CLAVE] as Clawd | undefined) ?? null

function crear(escena: HTMLElement, raiz: HTMLElement): Clawd {
  const anim = !reducido()
  const q = <T extends Element>(s: string) => raiz.querySelector<T>(s)
  const salto = q<SVGGElement>('[data-clawd-salto]')!
  const brazoI = q<SVGGElement>('[data-clawd-brazo="i"]')!
  const brazoD = q<SVGGElement>('[data-clawd-brazo="d"]')!
  const mirada = q<SVGGElement>('[data-clawd-mirada]')!
  const cuerpo = q<SVGRectElement>('[data-clawd-cuerpo]')!
  const globo = q<HTMLElement>('[data-clawd-globo]')!
  const teclas = [...raiz.querySelectorAll<SVGRectElement>('[data-clawd-tecla]')]
  const hojas = [...raiz.querySelectorAll<SVGRectElement>('[data-clawd-hoja]')]
  const colorTecla = teclas[0]?.getAttribute('fill') ?? '#4A6377'
  const respira = q<SVGGElement>('.clawd-respira')!
  const varita = q<SVGGElement>('[data-clawd-varita]')
  const pompa = q<SVGGElement>('[data-clawd-pompa]')
  const boca = q<SVGRectElement>('[data-clawd-boca]')
  const bengala = q<SVGGElement>('[data-clawd-bengala]')
  const punta = q<SVGRectElement>('[data-clawd-punta]')
  const pc = q<SVGGElement>('[data-clawd-pc]')
  const monitor = q<SVGGElement>('[data-clawd-monitor]')
  const tecladoPc = q<SVGGElement>('[data-clawd-teclado-pc]')
  const pantalla = q<SVGRectElement>('[data-clawd-pantalla]')
  const codigo = q<SVGGElement>('[data-clawd-codigo]')
  const cursor = q<SVGRectElement>('[data-clawd-cursor]')
  const colorPunta = punta?.getAttribute('fill') ?? '#5A4A42'
  const colorPantalla = pantalla?.getAttribute('fill') ?? '#0B151B'
  /** Con la varita en la mano el brazo izquierdo queda arriba. */
  let conJuguete = false
  const alturaI = () => (conJuguete ? -2 : 0)

  let vivo = true
  let tecleando = false
  let opcTeclear: { alRafaga?: () => void; alGolpe?: () => void; descansos?: boolean } = {}
  let bucle: gsap.core.Animation | null = null
  let rafagas = 0
  let saltando = false
  let fijo = ''
  let tipoFijo = ''
  let temporal: gsap.core.Tween | null = null
  let enPila = 0
  const sueltos = new Set<Element>()
  const vivos = new Set<gsap.core.Animation>()
  /** Registra una animación para matarla si se sale de la escena. */
  const seguir = <T extends gsap.core.Animation>(a: T): T => {
    vivos.add(a)
    const prev = a.eventCallback('onComplete') as (() => void) | undefined
    a.eventCallback('onComplete', () => {
      vivos.delete(a)
      prev?.()
    })
    return a
  }
  const esperar = (a: gsap.core.Animation) => new Promise<void>((listo) => {
    seguir(a)
    const prev = a.eventCallback('onComplete') as (() => void) | undefined
    a.eventCallback('onComplete', () => {
      prev?.()
      listo()
    })
  })

  /** Escala del lienzo (1600x900 escalado) para pasar de pantalla a escena. */
  const enEscena = (r: DOMRect) => {
    const esc = escena.getBoundingClientRect()
    const k = esc.width / escena.offsetWidth || 1
    return { x: (r.left - esc.left) / k, y: (r.top - esc.top) / k, w: r.width / k, h: r.height / k }
  }

  // ---------- Teclear ----------
  function golpe(k: number) {
    const brazo = k % 2 ? brazoD : brazoI
    gsap.set(brazo, { y: 1 })
    seguir(gsap.delayedCall(0.07, () => gsap.set(brazo, { y: 0 })))
    opcTeclear.alGolpe?.()
    if (!teclas.length) return
    const mitad = Math.floor(teclas.length / 2)
    const lado = k % 2 ? teclas.slice(mitad) : teclas.slice(0, mitad)
    const t = lado[entero(0, lado.length - 1)]
    if (!t) return
    t.setAttribute('fill', '#6fd2c9')
    seguir(gsap.delayedCall(0.12, () => t.setAttribute('fill', colorTecla)))
  }

  function rafaga() {
    if (!vivo || !tecleando || saltando) return
    raiz.classList.remove('quieto')
    const tl = gsap.timeline({
      onComplete: () => {
        if (!vivo || !tecleando) return
        opcTeclear.alRafaga?.()
        rafagas++
        if (opcTeclear.descansos && rafagas % 4 === 0) descansar()
        else bucle = seguir(gsap.delayedCall(azar(0.3, 0.7), rafaga))
      },
    })
    let t = 0
    const n = entero(4, 8)
    for (let k = 0; k < n; k++) {
      tl.call(golpe, [k], t)
      t += azar(0.08, 0.15)
    }
    bucle = seguir(tl)
  }

  function descansar() {
    raiz.classList.add('quieto')
    const dura = azar(1.8, 2.8)
    bucle = seguir(
      gsap
        .timeline({ onComplete: rafaga })
        .call(() => mirar(-1, -1), [], 0.3)
        .call(() => mirar(0, 0), [], dura * 0.6)
        .call(() => mirar(1, 0), [], dura * 0.75)
        .call(() => mirar(0, 0), [], dura * 0.92)
        .call(() => {}, [], dura),
    )
  }

  function teclear(on: boolean, o: { alRafaga?: () => void; alGolpe?: () => void; descansos?: boolean } = {}) {
    if (!anim) return
    if (on) {
      opcTeclear = o
      if (tecleando) return
      tecleando = true
      rafaga()
    } else {
      tecleando = false
      bucle?.kill()
      bucle = null
      gsap.set([brazoI, brazoD], { y: 0 })
      teclas.forEach((t) => t.setAttribute('fill', colorTecla))
      raiz.classList.remove('quieto')
    }
  }

  // ---------- Salto ----------
  function saltar(o: { brazos?: boolean; saludo?: boolean; alto?: number } = {}): Promise<void> {
    if (!anim || !vivo || saltando) return Promise.resolve()
    saltando = true
    bucle?.kill()
    gsap.set(brazoI, { y: alturaI() })
    gsap.set(brazoD, { y: 0 })
    raiz.classList.remove('quieto')
    const alto = o.alto ?? 5
    const snap = { snap: { y: 1 } }
    const tl = gsap.timeline({
      onComplete: () => {
        saltando = false
        gsap.set(salto, { clearProps: 'transform' })
        gsap.set(brazoI, { y: alturaI() })
        gsap.set(brazoD, { y: 0 })
        if (tecleando) rafaga()
      },
    })
    tl.to(salto, { scaleY: 0.86, transformOrigin: '50% 100%', duration: 0.09, ease: 'power2.out' })
      .to(salto, { scaleY: 1, y: -alto, duration: 0.26, ease: 'power2.out', ...snap })
    if (o.brazos) tl.set([brazoI, brazoD], { y: -3 }, '<0.05')
    tl.to(salto, { y: 0, duration: 0.22, ease: 'power2.in', ...snap })
      .to(salto, { scaleY: 0.9, transformOrigin: '50% 100%', duration: 0.06 })
      .to(salto, { scaleY: 1, duration: 0.12, ease: 'back.out(3)' })
    if (o.saludo) {
      tl.set(brazoI, { y: alturaI() })
      for (let k = 0; k < 6; k++) tl.set(brazoD, { y: k % 2 ? -3 : -2 }, '+=0.13')
      tl.set(brazoD, { y: 0 }, '+=0.13')
    }
    return esperar(tl)
  }

  // ---------- Globo ----------
  function pintarGlobo(texto: string, tipo: string) {
    if (!texto) {
      if (anim) gsap.to(globo, { autoAlpha: 0, y: -8, duration: 0.25, ease: 'power1.in' })
      else gsap.set(globo, { autoAlpha: 0 })
      return
    }
    const visible = Number(gsap.getProperty(globo, 'autoAlpha')) > 0.9
    const cambia = globo.textContent !== texto || globo.dataset.tipo !== tipo || !visible
    globo.textContent = texto
    globo.dataset.tipo = tipo
    if (!cambia) return
    gsap.killTweensOf(globo)
    // Si ya estaba a la vista y solo cambia el número, un pulso basta.
    if (anim && visible) gsap.fromTo(globo, { scale: 0.9 }, { scale: 1, autoAlpha: 1, y: 0, duration: 0.25, ease: 'back.out(3)' })
    else if (anim) gsap.fromTo(globo, { autoAlpha: 0, y: 14, scale: 0.6 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(2.4)' })
    else gsap.set(globo, { autoAlpha: 1, y: 0, scale: 1 })
  }

  /** Copia del globo a la vista que se vuelve pensamiento y sube flotando. */
  function soltarGlobo() {
    const r = globo.cloneNode(true) as HTMLElement
    r.removeAttribute('data-clawd-globo')
    r.classList.add('clawd-recuerdo')
    globo.after(r)
    sueltos.add(r)
    gsap.killTweensOf(globo)
    gsap.set(globo, { autoAlpha: 0 })
    gsap.set(r, { autoAlpha: 1, x: 0, y: 0, scale: 1 })
    const dura = 3.6
    const tl = gsap.timeline({
      onComplete: () => {
        sueltos.delete(r)
        r.remove()
      },
    })
    tl.to(r, { scale: 0.92, duration: 0.1, ease: 'power2.out' })
      .to(r, { scale: 1, duration: 0.22, ease: 'back.out(3)' })
      .to(r, { y: -280, scale: 0.72, duration: dura, ease: 'sine.in' }, 0.12)
      .to(r, { keyframes: { x: [0, -16, 10, -24, -6] }, duration: dura, ease: 'sine.inOut' }, 0.12)
      .to(r, { autoAlpha: 0, duration: 1.3, ease: 'power1.in' }, dura - 1.1)
    seguir(tl)
  }

  function decir(texto: string, o: { ms?: number; tipo?: 'pregunta' | 'ok'; soltar?: boolean } = {}) {
    if (!vivo) return
    if (o.ms) {
      const aLaVista = Number(gsap.getProperty(globo, 'autoAlpha')) > 0.5
      if (o.soltar && anim && temporal && aLaVista && globo.textContent !== texto) soltarGlobo()
      temporal?.kill()
      pintarGlobo(texto, o.tipo ?? '')
      temporal = seguir(
        gsap.delayedCall(o.ms / 1000, () => {
          temporal = null
          pintarGlobo(fijo, tipoFijo)
        }),
      )
      return
    }
    // El texto fijo se guarda; si hay uno temporal a la vista, sale cuando ese termine.
    fijo = texto
    tipoFijo = o.tipo ?? ''
    if (!temporal) pintarGlobo(texto, tipoFijo)
  }

  function callar() {
    temporal?.kill()
    temporal = null
    fijo = ''
    tipoFijo = ''
    pintarGlobo('', '')
  }

  // ---------- Cara ----------
  function ojos(m: Ojos) {
    raiz.dataset.ojos = m
  }
  function mirar(x: number, y: number) {
    gsap.set(mirada, { x, y })
  }
  function sudor(on: boolean) {
    raiz.classList.toggle('suda', on)
  }
  function dormir(on: boolean) {
    if (on) teclear(false)
    raiz.classList.toggle('duerme', on)
    ojos(on ? 'cerrados' : 'normal')
  }

  // ---------- Pensar y escoger ----------
  async function pensar(opciones: Opcion[], elegida: string, destino: Element | null): Promise<void> {
    if (!anim || !vivo) return
    const ops = opciones.map((o) => (typeof o === 'string' ? { texto: o, nota: '' } : { texto: o.texto, nota: o.nota ?? '' }))
    const k = Math.max(0, ops.findIndex((o) => o.texto === elegida))
    const caja = document.createElement('div')
    caja.className = 'clawd-piensa'
    const chips = ops.map((o, i) => {
      const s = document.createElement('span')
      s.className = `tk t${i % 4}`
      s.textContent = o.texto
      if (o.nota) {
        const n = document.createElement('small')
        n.textContent = o.nota
        s.append(n)
      }
      caja.append(s)
      return s
    })
    raiz.append(caja)
    sueltos.add(caja)
    mirar(0, -1)
    await esperar(gsap.fromTo(chips, { y: 18, autoAlpha: 0, scale: 0.5 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.25, stagger: 0.05, ease: 'back.out(2)' }))
    if (!vivo) return
    // Duda: el resaltado pasa por las opciones, cada vez más lento, y para en la elegida.
    const tl = gsap.timeline()
    const vueltas = ops.length * 2 + k
    let t = 0
    for (let j = 0; j <= vueltas; j++) {
      tl.call(() => chips.forEach((c, i) => c.classList.toggle('on', i === j % ops.length)), [], t)
      t += 0.05 + j * 0.011
    }
    tl.call(() => {}, [], t + 0.2)
    await esperar(tl)
    if (!vivo) return
    seguir(gsap.to(chips.filter((_, i) => i !== k), { autoAlpha: 0, y: -10, duration: 0.2 }))
    const chip = chips[k]!
    if (destino) {
      const a = enEscena(chip.getBoundingClientRect())
      const b = enEscena(destino.getBoundingClientRect())
      const vuela = chip.cloneNode(true) as HTMLElement
      vuela.querySelector('small')?.remove()
      vuela.classList.add('clawd-vuela')
      escena.append(vuela)
      sueltos.add(vuela)
      chip.style.visibility = 'hidden'
      gsap.set(vuela, { x: a.x, y: a.y })
      await esperar(
        gsap
          .timeline()
          .to(vuela, { x: b.x, duration: 0.55, ease: 'power2.inOut' }, 0)
          .to(vuela, { y: b.y + (b.h - a.h) / 2, duration: 0.55, ease: 'back.in(1.2)' }, 0)
          .to(vuela, { autoAlpha: 0, scale: 1.2, duration: 0.18 }, 0.5),
      )
      vuela.remove()
      sueltos.delete(vuela)
    }
    caja.remove()
    sueltos.delete(caja)
    mirar(0, 0)
  }

  // ---------- Token a la cinta (portada) ----------
  function lanzar(texto: string, clase: string, destino: Element) {
    if (!anim || !vivo || document.hidden) return
    const cab = enEscena(cuerpo.getBoundingClientRect())
    const ci = enEscena(destino.getBoundingClientRect())
    const el = document.createElement('span')
    el.className = `${clase} clawd-tk`
    el.textContent = texto
    escena.append(el)
    sueltos.add(el)
    const w = el.offsetWidth
    const h = el.offsetHeight
    // Nace detrás de la cabeza (Clawd va encima) y asoma al subir.
    const x0 = cab.x + cab.w / 2 - w / 2
    const y0 = cab.y + h * 0.4
    const y1 = ci.y + (ci.h - h) / 2
    gsap.set(el, { x: x0, y: y0, scale: 0.3, autoAlpha: 0 })
    seguir(
      gsap
        .timeline({ onComplete: () => (el.remove(), sueltos.delete(el)) })
        .to(el, { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' }, 0)
        .to(el, { x: x0 - azar(90, 180), duration: 1.15, ease: 'power1.in' }, 0)
        .to(el, { y: y1 + h * 0.35, duration: 1.15, ease: 'power3.out' }, 0)
        .to(el, { autoAlpha: 0, scale: 0.92, duration: 0.35, ease: 'power1.in' }, 0.85),
    )
    mirar(0, -1)
    seguir(gsap.delayedCall(0.8, () => !saltando && mirar(0, 0)))
  }

  function entregar(destino: HTMLElement, alLlegar: () => void) {
    if (!anim || !vivo || document.hidden) return alLlegar()
    const cab = enEscena(cuerpo.getBoundingClientRect())
    const b = enEscena(destino.getBoundingClientRect())
    const estilo = getComputedStyle(destino)
    const el = document.createElement('span')
    el.className = 'clawd-palabra'
    el.textContent = destino.textContent ?? ''
    for (const k of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'] as const) el.style[k] = estilo[k]
    el.style.color = estilo.color
    escena.append(el)
    sueltos.add(el)
    const w = el.offsetWidth
    const h = el.offsetHeight
    // El texto de la ficha queda justo encima de la palabra (la ficha tiene relleno).
    const pad = (w - b.w) / 2
    const x1 = b.x - pad
    const y1 = b.y - (h - b.h) / 2
    const x0 = cab.x + cab.w / 2 - w / 2
    const y0 = cab.y + h * 0.3
    let listo = false
    const llegar = () => {
      if (listo) return
      listo = true
      alLlegar()
    }
    gsap.set(el, { x: x0, y: y0, scale: 0.4, autoAlpha: 0 })
    seguir(
      gsap
        .timeline({ onComplete: () => (el.remove(), sueltos.delete(el)), onInterrupt: llegar })
        .to(el, { autoAlpha: 1, scale: 1, duration: 0.18, ease: 'back.out(2)' }, 0)
        // Sube primero y luego cae en su sitio: arco con dos curvas.
        .to(el, { y: Math.min(y0, y1) - azar(40, 90), duration: 0.38, ease: 'power2.out' }, 0)
        .to(el, { y: y1, duration: 0.42, ease: 'power2.in' }, 0.38)
        .to(el, { x: x1, duration: 0.8, ease: 'power1.inOut' }, 0)
        .call(llegar, [], 0.8)
        .to(el, { '--marco': 0, duration: 0.3, ease: 'power1.out' }, 0.8)
        .to(el, { autoAlpha: 0, duration: 0.12 }, 1.0),
    )
    mirar(b.x < cab.x ? -1 : 1, -1)
    seguir(gsap.delayedCall(0.7, () => !saltando && mirar(0, 0)))
  }

  // ---------- Mesa ----------
  function apilar(n: number, animar = false) {
    gsap.killTweensOf(hojas)
    hojas.forEach((h, k) => {
      gsap.set(h, { clearProps: 'transform,opacity,visibility' })
      h.setAttribute('visibility', k < n ? 'inherit' : 'hidden')
    })
    const nuevas = hojas.slice(enPila, n)
    if (anim && animar && nuevas.length) {
      seguir(gsap.from(nuevas, { y: -9, opacity: 0, duration: 0.35, stagger: 0.09, ease: 'bounce.out', snap: { y: 1 } }))
    }
    enPila = n
  }

  async function derrumbar(): Promise<void> {
    const quedan = 7
    if (!anim) return apilar(quedan)
    apilar(enPila)
    const llegan = hojas.slice(enPila)
    llegan.forEach((h) => h.setAttribute('visibility', 'inherit'))
    await esperar(gsap.from(llegan, { y: -9, opacity: 0, duration: 0.3, stagger: 0.07, ease: 'bounce.out', snap: { y: 1 } }))
    if (!vivo) return
    // Se tambalea y las de arriba se caen por el borde de la mesa.
    const caen = hojas.slice(quedan)
    await esperar(gsap.to(caen, { x: 1, duration: 0.08, repeat: 5, yoyo: true }))
    if (!vivo) return
    await esperar(
      gsap.to(caen, {
        x: (i) => 6 + i * 1.5,
        y: (i) => 14 + i,
        rotation: (i) => 25 + i * 12,
        transformOrigin: '50% 50%',
        opacity: 0,
        duration: 0.7,
        stagger: { each: 0.05, from: 'end' },
        ease: 'power2.in',
      }),
    )
    caen.forEach((h) => h.setAttribute('visibility', 'hidden'))
    gsap.set(caen, { clearProps: 'transform,opacity' })
    enPila = quedan
  }

  // ---------- Burbujas (aviso "Empezamos en") ----------
  /** Posición (centro y caja) de un elemento en coordenadas de `raiz`. */
  const enRaiz = (el: Element) => {
    const r = raiz.getBoundingClientRect()
    const k = r.width / raiz.offsetWidth || 1
    const p = el.getBoundingClientRect()
    return { x: (p.left + p.width / 2 - r.left) / k, y: (p.top + p.height / 2 - r.top) / k, w: p.width / k, h: p.height / k }
  }

  /**
   * Suelta una burbuja desde el aro. Sube ondulando y revienta en gotitas al
   * final del viaje (o antes, al azar). Con `destino` va hasta ese punto y se
   * queda flotando hasta que alguien la reviente.
   */
  function soltarBurbuja(o: { d?: number; destino?: { x: number; y: number }; dura?: number } = {}) {
    const nada = { reventar: () => {} }
    if (!vivo || !pompa || document.hidden || raiz.querySelectorAll('.clawd-burbuja').length > 18) return nada
    const d = o.d ?? azar(14, 36)
    const b = document.createElement('span')
    b.className = 'clawd-burbuja'
    b.style.setProperty('--d', `${d.toFixed(0)}px`)
    b.innerHTML = '<span><i></i><b></b></span>'
    const bola = b.firstElementChild as HTMLElement
    raiz.append(b)
    sueltos.add(b)
    const p = enRaiz(pompa)
    const dura = o.dura ?? azar(3.4, 6)
    // Clawd está cerca del borde de arriba: las sopla hacia la izquierda,
    // sobre el fondo oscuro, y suben poco para que no se salgan de la pantalla.
    const x1 = o.destino ? o.destino.x : p.x - azar(160, 640)
    const y1 = o.destino ? o.destino.y : p.y + azar(-170, 70)
    gsap.set(b, { x: p.x, y: p.y })
    const anims: gsap.core.Animation[] = []
    let reventada = false
    const reventar = () => {
      if (reventada) return
      reventada = true
      anims.forEach((a) => (a.kill(), vivos.delete(a)))
      const quitar = () => (b.remove(), sueltos.delete(b))
      if (!vivo || document.hidden) return quitar()
      // Pop: la bola se infla y desaparece, y salen gotitas cuadradas (pixel).
      const gotas = Array.from({ length: 7 }, () => {
        const g = document.createElement('i')
        g.className = 'clawd-gotita'
        b.append(g)
        return g
      })
      const fin = gsap.timeline({ onComplete: quitar })
      fin
        .to(bola, { scale: 1.35, autoAlpha: 0, duration: 0.12, ease: 'power1.out' }, 0)
        .fromTo(
          gotas,
          { x: 0, y: 0, autoAlpha: 1, scale: 1 },
          {
            x: (k) => Math.cos((k / gotas.length) * Math.PI * 2 + 0.4) * d * azar(0.7, 1.1),
            y: (k) => Math.sin((k / gotas.length) * Math.PI * 2 + 0.4) * d * azar(0.7, 1.1) + 8,
            autoAlpha: 0,
            scale: 0.5,
            duration: 0.42,
            ease: 'power2.out',
          },
          0,
        )
      seguir(fin)
    }
    const viaje = gsap.timeline({ onComplete: () => !o.destino && reventar() })
    viaje
      .fromTo(bola, { scale: 0.15 }, { scale: 1, duration: 0.4, ease: 'back.out(2.2)' }, 0)
      .to(b, { x: x1, duration: dura, ease: 'sine.inOut' }, 0)
      .to(b, { y: y1, duration: dura, ease: o.destino ? 'power2.out' : 'power1.out' }, 0)
    // Bamboleo de gelatina y vaivén de lado a lado mientras sube.
    const gelatina = gsap.to(bola, { scaleX: 1.09, scaleY: 0.92, duration: azar(0.32, 0.5), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 0.4 })
    const vaiven = gsap.to(bola, { x: azar(10, 24) * (Math.random() < 0.5 ? -1 : 1), duration: azar(0.8, 1.3), yoyo: true, repeat: -1, ease: 'sine.inOut' })
    anims.push(viaje, gelatina, vaiven)
    // Algunas no aguantan todo el viaje.
    if (!o.destino && Math.random() < 0.35) anims.push(gsap.delayedCall(azar(1.2, dura * 0.8), reventar))
    anims.forEach((a) => vivos.add(a))
    return { reventar }
  }

  let soplando = false
  let turno = 0
  let vuelta = 0
  let pasoB: gsap.core.Animation | null = null
  const paso = (a: gsap.core.Animation) => ((pasoB = a), esperar(a))
  const pausa = (s: number) => paso(gsap.delayedCall(s, () => {}))

  function sacar() {
    conJuguete = true
    varita!.setAttribute('visibility', 'inherit')
    mirar(-1, -1)
    return gsap
      .timeline()
      .set(brazoI, { y: -1 })
      .set(brazoI, { y: -2 }, 0.06)
      .fromTo(varita, { y: 6 }, { y: 0, duration: 0.4, ease: 'back.out(2.4)', snap: { y: 1 } }, 0)
      .fromTo(pompa, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.3)
      .call(() => {}, [], 0.8)
  }

  function guardar() {
    return gsap
      .timeline({
        onComplete: () => {
          varita!.setAttribute('visibility', 'hidden')
          conJuguete = false
          if (!saltando) gsap.set(brazoI, { y: 0 })
          mirar(0, 0)
        },
      })
      .to(varita, { y: 6, duration: 0.3, ease: 'back.in(2)', snap: { y: 1 } })
  }

  /** Toma aire, sopla una tanda (a veces una gigante) y mira cómo suben. */
  function ronda(gigante: boolean) {
    const tl = gsap.timeline()
    const o = { transformOrigin: '50% 100%' }
    tl.call(() => mirar(-1, 0))
      .to(respira, { scaleY: 1.08, scaleX: 0.97, ...o, duration: 0.45, ease: 'power2.out' })
      .call(() => boca?.setAttribute('visibility', 'inherit'))
    if (gigante) {
      // Sopla despacito y largo: sale una sola, enorme.
      tl.to(respira, { scaleY: 0.96, scaleX: 1.03, ...o, duration: 1.1, ease: 'sine.inOut' })
        .to(pompa, { scale: 1.4, transformOrigin: '50% 50%', duration: 1.1, ease: 'sine.in' }, '<')
        .call(() => void soltarBurbuja({ d: azar(64, 82), dura: azar(6.5, 8) }))
        .set(pompa, { scale: 1, opacity: 0.25 })
    } else {
      tl.to(respira, { scaleY: 0.94, scaleX: 1.05, ...o, duration: 0.16, ease: 'power2.out' })
      const n = entero(3, 6)
      let t = 0
      for (let k = 0; k < n; k++) {
        tl.call(() => void soltarBurbuja(), [], `<${t.toFixed(2)}`)
        tl.fromTo(pompa, { x: -1 }, { x: 0, duration: 0.08, snap: { x: 1 } }, '<')
        t = azar(0.09, 0.2)
      }
      tl.set(pompa, { opacity: 0.25 })
    }
    tl.to(respira, { scaleX: 1, scaleY: 1, duration: 0.35, ease: 'back.out(3)' })
      .call(() => boca?.setAttribute('visibility', 'hidden'), [], '<')
      .call(() => mirar(-1, -1), [], '<')
      .to(pompa, { opacity: 1, duration: 0.5 }, '+=0.3')
      .call(() => mirar(0, -1), [], `+=${azar(0.4, 0.9).toFixed(2)}`)
      .call(() => {}, [], `+=${azar(0.4, 1).toFixed(2)}`)
    return tl
  }

  /** Una burbuja lenta se le para encima y la revienta de un cabezazo. */
  async function cazar(sigue: () => boolean) {
    const cab = enRaiz(cuerpo)
    const u = cab.w / 12
    const d = 36
    const bur = soltarBurbuja({ d, dura: 2.6, destino: { x: cab.x + azar(-u, u), y: cab.y - cab.h / 2 - 5 * u - d * 0.25 } })
    mirar(-1, -1)
    await pausa(1.3)
    if (!sigue()) return bur.reventar()
    mirar(0, -1)
    await pausa(1.5)
    if (!sigue()) return bur.reventar()
    void saltar({ brazos: true })
    await pausa(0.32)
    bur.reventar()
    ojos('entrecerrados')
    await pausa(0.9)
    ojos('normal')
  }

  // ---------- Bengala de chispitas ----------
  let tickChispas: (() => void) | null = null
  let resplandor: HTMLElement | null = null

  function chispa(p: { x: number; y: number }) {
    const s = document.createElement('i')
    s.className = Math.random() < 0.25 ? 'clawd-chispa cruz' : 'clawd-chispa'
    s.style.setProperty('--c', ['#FFF4C2', '#FFD66B', '#FFB347', '#FFFFFF'][entero(0, 3)]!)
    raiz.append(s)
    sueltos.add(s)
    const ang = azar(0, Math.PI * 2)
    const v = azar(16, 58)
    const t = azar(0.25, 0.55)
    gsap.set(s, { x: p.x, y: p.y })
    seguir(
      gsap
        .timeline({ onComplete: () => (s.remove(), sueltos.delete(s)) })
        .to(s, { x: p.x + Math.cos(ang) * v, duration: t, ease: 'power2.out' }, 0)
        // Sale disparada y la gravedad la jala hacia abajo.
        .to(s, { y: p.y + Math.sin(ang) * v + azar(10, 28), duration: t, ease: 'power1.in' }, 0)
        .to(s, { autoAlpha: 0, scale: 0.4, duration: t * 0.6 }, t * 0.4),
    )
  }

  /** Humito gris que sube de la punta cuando la bengala se apaga. */
  function humo() {
    if (!punta) return
    const p = enRaiz(punta)
    for (let k = 0; k < 4; k++) {
      const h = document.createElement('i')
      h.className = 'clawd-humo'
      raiz.append(h)
      sueltos.add(h)
      gsap.set(h, { x: p.x, y: p.y })
      seguir(
        gsap
          .timeline({ delay: k * 0.18, onComplete: () => (h.remove(), sueltos.delete(h)) })
          .fromTo(h, { autoAlpha: 0.75, scale: 0.6 }, { y: p.y - azar(34, 56), x: p.x + azar(-12, 12), scale: 1.6, autoAlpha: 0, duration: 1.3, ease: 'sine.out' }),
      )
    }
  }

  function pararChispas() {
    if (tickChispas) gsap.ticker.remove(tickChispas)
    tickChispas = null
    resplandor?.remove()
    resplandor = null
  }

  /** Saca la bengala, la agita echando chispas, se apaga y la tira. */
  async function chispitas(sigue: () => boolean) {
    if (!bengala || !punta) return
    conJuguete = true
    bengala.setAttribute('visibility', 'inherit')
    mirar(-1, -1)
    await paso(
      gsap
        .timeline()
        .set(brazoI, { y: -1 })
        .set(brazoI, { y: -2 }, 0.06)
        .fromTo(bengala, { y: 6 }, { y: 0, duration: 0.4, ease: 'back.out(2.4)', snap: { y: 1 } }, 0)
        .call(() => {}, [], 0.6),
    )
    if (!sigue()) return
    // Se enciende: brasa amarilla, resplandor y chispas cada cuadro.
    const estado = { fuerza: 1 }
    punta.setAttribute('fill', '#FFF4C2')
    resplandor = document.createElement('span')
    resplandor.className = 'clawd-resplandor'
    raiz.append(resplandor)
    tickChispas = () => {
      if (document.hidden) return
      const p = enRaiz(punta)
      gsap.set(resplandor, { x: p.x, y: p.y, autoAlpha: estado.fuerza })
      const n = Math.random() < estado.fuerza ? (Math.random() < 0.5 ? 2 : 1) : 0
      for (let k = 0; k < n; k++) chispa(p)
    }
    gsap.ticker.add(tickChispas)
    ojos('entrecerrados')
    // La agita: el brazo sube y baja, la bengala va de lado a lado.
    const agita = gsap.timeline()
    const dura = azar(3.5, 4.5)
    for (let t = 0, k = 0; t < dura; t += 0.1, k++) {
      agita.set(brazoI, { y: k % 2 ? -3 : -1 }, t)
      agita.set(bengala, { x: k % 4 < 2 ? -1 : 0 }, t)
      if (k % 10 === 0) agita.call(() => mirar(k % 20 ? 0 : -1, -1), [], t)
    }
    agita.set(brazoI, { y: -2 }).set(bengala, { x: 0 })
    await paso(agita)
    if (!sigue()) return
    // Se apaga: cada vez menos chispas y la brasa pasa a naranja y a gris.
    ojos('normal')
    await paso(
      gsap
        .timeline()
        .to(estado, { fuerza: 0, duration: 1.4, ease: 'power1.in' })
        .call(() => punta.setAttribute('fill', '#FFB347'), [], 0.4)
        .call(() => punta.setAttribute('fill', '#C2552F'), [], 0.9)
        .call(() => punta.setAttribute('fill', '#4A4A4A'), [], 1.3),
    )
    pararChispas()
    humo()
    ojos('confundido')
    mirar(-1, -1)
    await pausa(1)
    if (!sigue()) return
    ojos('normal')
    // La tira por encima del hombro: sube, gira y cae fuera de la tarjeta.
    await paso(
      gsap
        .timeline()
        .set(brazoI, { y: -3 })
        .set(brazoI, { y: -1 }, 0.14)
        .to(bengala, { x: -14, duration: 0.85, ease: 'none' }, 0.14)
        .to(bengala, { y: -5, duration: 0.25, ease: 'power2.out' }, 0.14)
        .to(bengala, { y: 20, duration: 0.6, ease: 'power2.in' }, 0.39)
        .to(bengala, { rotation: -320, transformOrigin: '50% 50%', duration: 0.85, ease: 'none' }, 0.14)
        .to(bengala, { autoAlpha: 0, duration: 0.2 }, 0.8)
        .call(() => mirar(-1, 1), [], 0.5),
    )
    bengala.setAttribute('visibility', 'hidden')
    gsap.set(bengala, { clearProps: 'all' })
    punta.setAttribute('fill', colorPunta)
    conJuguete = false
    if (!saltando) gsap.set(brazoI, { y: 0 })
    await pausa(0.5)
    mirar(0, 0)
  }

  // ---------- PC ----------
  const NS = 'http://www.w3.org/2000/svg'
  const COLORES_CODIGO = ['#6fd2c9', '#F07FA8', '#F2C94C', '#c4d3dc', '#b9a5ff']
  /** Escritura en la pantalla: filas de medio pixel, cada tecla alarga el trozo actual. */
  const pluma = { fila: -1, x: 0, inicio: 0, largo: 0, trozo: null as SVGRectElement | null, meta: 0 }
  const IZQ = -13.5
  const DER = -5.5

  function nuevaLinea() {
    if (!codigo) return
    pluma.fila++
    if (pluma.fila > 5) {
      // Pantalla llena: todo sube una fila y la de arriba sale.
      for (const r of [...codigo.children]) {
        const y = Number(r.getAttribute('y')) - 1
        if (y < -2) r.remove()
        else r.setAttribute('y', String(y))
      }
      pluma.fila = 5
    }
    pluma.inicio = IZQ + entero(0, 2) * 0.75
    pluma.x = pluma.inicio
    pluma.largo = azar(3, 7.5)
    pluma.trozo = null
  }

  function teclaCodigo() {
    if (!codigo) return
    const t = pluma.trozo
    const w = t ? Number(t.getAttribute('width')) : 0
    if (!t || w >= pluma.meta) {
      if (t) pluma.x += w + 0.5
      if (pluma.x - pluma.inicio >= pluma.largo || pluma.x > DER - 0.5) nuevaLinea()
      const r = document.createElementNS(NS, 'rect')
      r.setAttribute('x', String(pluma.x))
      r.setAttribute('y', String(-1.5 + pluma.fila))
      r.setAttribute('height', '.5')
      r.setAttribute('width', '0')
      r.setAttribute('fill', COLORES_CODIGO[entero(0, COLORES_CODIGO.length - 1)]!)
      codigo.append(r)
      pluma.trozo = r
      pluma.meta = Math.min(entero(1, 5) * 0.5, DER - pluma.x)
    }
    const r = pluma.trozo!
    const nw = Math.min(pluma.meta, Number(r.getAttribute('width')) + 0.5)
    r.setAttribute('width', String(nw))
    cursor?.setAttribute('x', String(pluma.x + nw + 0.25))
    cursor?.setAttribute('y', r.getAttribute('y')!)
  }

  function esconderPc() {
    teclear(false)
    pc?.setAttribute('visibility', 'hidden')
    gsap.set([monitor, tecladoPc].filter(Boolean), { clearProps: 'all' })
  }

  /** Aparece un PC, codea unos segundos, queda contento y lo guarda. */
  async function codear(sigue: () => boolean) {
    if (!pc || !monitor || !tecladoPc || !codigo) return
    codigo.replaceChildren()
    pluma.fila = -1
    nuevaLinea()
    cursor?.setAttribute('x', String(pluma.inicio))
    cursor?.setAttribute('y', '-1.5')
    pc.setAttribute('visibility', 'inherit')
    mirar(-1, 0)
    await paso(
      gsap
        .timeline()
        .fromTo(monitor, { y: 12 }, { y: 0, duration: 0.45, ease: 'back.out(1.8)', snap: { y: 1 } }, 0)
        .fromTo(tecladoPc, { y: 5 }, { y: 0, duration: 0.35, ease: 'back.out(2)', snap: { y: 1 } }, 0.1)
        // La pantalla se prende con un destello.
        .call(() => pantalla?.setAttribute('fill', '#3D7C84'), [], 0.5)
        .call(() => pantalla?.setAttribute('fill', colorPantalla), [], 0.6)
        .call(() => {}, [], 0.8),
    )
    if (!sigue()) return esconderPc()
    teclear(true, { alGolpe: teclaCodigo })
    await pausa(azar(5, 7))
    teclear(false)
    if (!sigue()) return esconderPc()
    // Listo: queda contento y da un saltico.
    ojos('entrecerrados')
    void saltar({ alto: 3, brazos: true })
    await pausa(1)
    ojos('normal')
    if (!sigue()) return esconderPc()
    await paso(
      gsap
        .timeline()
        .call(() => pantalla?.setAttribute('fill', '#000'))
        .to(tecladoPc, { y: 5, duration: 0.3, ease: 'back.in(2)', snap: { y: 1 } }, 0.15)
        .to(monitor, { y: 12, duration: 0.4, ease: 'back.in(1.6)', snap: { y: 1 } }, 0.2),
    )
    pantalla?.setAttribute('fill', colorPantalla)
    esconderPc()
    mirar(0, 0)
  }

  async function bucleBurbujas() {
    const yo = ++turno
    const sigue = () => vivo && soplando && turno === yo
    while (sigue()) {
      await paso(sacar())
      const rondas = entero(2, 3)
      for (let r = 0; r < rondas && sigue(); r++) {
        while (saltando && sigue()) await pausa(0.3)
        await paso(ronda(r === rondas - 1 && Math.random() < 0.45))
      }
      if (sigue() && Math.random() < 0.6) await cazar(sigue)
      if (!sigue()) return
      await paso(guardar())
      if (!sigue()) return
      // Una vuelta sí y otra no: bengala de chispitas y luego a codear.
      if (vuelta++ % 2 === 1) {
        await pausa(0.6)
        if (sigue()) await chispitas(sigue)
        if (sigue()) await pausa(0.8)
        if (sigue()) await codear(sigue)
        if (!sigue()) return
      }
      await pausa(azar(2.5, 4.5))
    }
  }

  function apagarBurbujas() {
    soplando = false
    turno++
    pasoB?.kill()
    pasoB = null
    gsap.killTweensOf([varita, pompa, respira, bengala, monitor, tecladoPc].filter(Boolean))
    pararChispas()
    esconderPc()
    bengala?.setAttribute('visibility', 'hidden')
    if (bengala) gsap.set(bengala, { clearProps: 'all' })
    punta?.setAttribute('fill', colorPunta)
    pantalla?.setAttribute('fill', colorPantalla)
    raiz.dataset.ojos = 'normal'
    gsap.set(respira, { clearProps: 'transform' })
    if (pompa) gsap.set(pompa, { clearProps: 'all' })
    varita?.setAttribute('visibility', 'hidden')
    boca?.setAttribute('visibility', 'hidden')
    conJuguete = false
    if (!saltando) gsap.set(brazoI, { y: 0 })
  }

  function burbujas(on: boolean) {
    if (!anim || !varita || !pompa) return
    if (!on) return soplando ? apagarBurbujas() : undefined
    if (soplando) return
    teclear(false)
    soplando = true
    void bucleBurbujas()
  }

  function reposo() {
    teclear(false)
    callar()
    ojos('normal')
    sudor(false)
    raiz.classList.remove('duerme')
    mirar(0, 0)
  }

  function destruir() {
    if (soplando) apagarBurbujas()
    vivo = false
    tecleando = false
    saltando = false
    for (const a of vivos) a.kill()
    vivos.clear()
    temporal?.kill()
    gsap.killTweensOf([salto, brazoI, brazoD, mirada, globo, ...hojas])
    for (const el of sueltos) gsap.killTweensOf(el), el.remove()
    sueltos.clear()
    gsap.set(salto, { clearProps: 'transform' })
    gsap.set(globo, { autoAlpha: 0 })
    gsap.set([brazoI, brazoD], { y: 0 })
    teclas.forEach((t) => t.setAttribute('fill', colorTecla))
    raiz.classList.remove('quieto', 'suda', 'duerme')
    raiz.dataset.ojos = 'normal'
    mirar(0, 0)
    fijo = ''
  }

  ojos('normal')
  return { teclear, saltar, decir, callar, ojos, mirar, sudor, dormir, pensar, lanzar, apilar, derrumbar, burbujas, reposo, destruir, entregar }
}

// ---------- Papeles que se repiten ----------

/**
 * Portada: escribe el subtítulo y la firma palabra por palabra (una por
 * ráfaga de teclas), luego sigue tecleando los tokens de la cinta y celebra
 * cuando entra alguien a la sala.
 */
export function papelPortada(escena: HTMLElement, api: Api): void {
  const c = clawdDe(escena, api)
  if (!c) return
  const cinta = escena.querySelector<HTMLElement>('[data-cinta]')
  // La cinta va duplicada para el bucle: basta la primera mitad. Sin separadores.
  const fichas = cinta ? [...cinta.children].slice(0, cinta.children.length / 2) : []
  const tokens = fichas
    .map((f) => ({ texto: f.textContent ?? '', clase: f.className }))
    .filter((t) => t.texto.trim() && t.texto.trim() !== '·')
  let siguiente = 0
  const aLaCinta = () => {
    c.teclear(true, {
      descansos: true,
      alRafaga: () => {
        if (!cinta || !tokens.length) return
        const tk = tokens[siguiente++ % tokens.length]!
        c.lanzar(tk.texto, tk.clase, cinta)
      },
    })
  }

  // Sin animación (movimiento reducido) el texto ya está completo en el HTML.
  const palabras = reducido() ? [] : [...escena.querySelectorAll<HTMLElement>('[data-escribe] .pal-c')]
  palabras.forEach((p) => p.classList.add('oculta'))
  api.limpiar(() => palabras.forEach((p) => (p.classList.remove('oculta'), gsap.killTweensOf(p), gsap.set(p, { clearProps: 'all' }))))
  let escritas = 0
  if (!palabras.length) aLaCinta()
  else {
    c.teclear(true, {
      alRafaga: () => {
        const p = palabras[escritas++]
        if (p) c.entregar(p, () => p.classList.remove('oculta'))
        if (escritas >= palabras.length) aLaCinta()
      },
    })
  }
  if (!api.admin) return
  let ultimo: number | null = null
  api.sondear(() => {
    consultar({ que: 'panel', n: api.n })
      .then((r) => {
        const n = Number(r?.sala) || 0
        if (ultimo !== null && n > ultimo) {
          c.decir(`+${n - ultimo}`, { ms: 2200 })
          c.saltar({ brazos: true, saludo: true })
        }
        ultimo = n
      })
      .catch(() => {})
  }, 2500)
}

/**
 * Votaciones: le cuenta al presentador cuántos respondieron de los que hay en
 * la sala y salta cuando ya respondieron todos (ya se puede avanzar). Solo con
 * la cuenta admin, que es la que ve los resultados en vivo. Los resultados
 * llegan con el evento `tl:resultados` que emite el sondeo de la escena.
 */
export function papelVotos(escena: HTMLElement, api: Api): void {
  const c = clawdDe(escena, api)
  if (!c || !api.admin) return
  let sala = 0
  let personas = 0
  let todos = false
  const pintar = () => {
    if (!sala) return
    if (personas >= sala) {
      if (todos) return
      todos = true
      c.decir('Respondieron todos', { tipo: 'ok' })
      c.saltar({ brazos: true, saludo: true })
      return
    }
    todos = false
    c.decir(`${personas} de ${sala} respondieron`)
  }
  const alResultados = (ev: Event) => {
    personas = Number((ev as CustomEvent).detail?.personas) || 0
    pintar()
  }
  escena.addEventListener('tl:resultados', alResultados)
  api.limpiar(() => escena.removeEventListener('tl:resultados', alResultados))
  const leerSala = () =>
    consultar({ que: 'panel', n: api.n })
      .then((r) => {
        sala = Number(r?.sala) || 0
        pintar()
      })
      .catch(() => {})
  leerSala()
  api.sondear(leerSala, 4000)
}
