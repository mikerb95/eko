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
  /** Teclea en ráfagas hasta que se apague. `alRafaga` corre al final de cada una. */
  teclear(on: boolean, o?: { alRafaga?: () => void; descansos?: boolean }): void
  /** Salto con aterrizaje; con `brazos` los levanta y con `saludo` saluda al bajar. */
  saltar(o?: { brazos?: boolean; saludo?: boolean; alto?: number }): Promise<void>
  /** Globo. Sin `ms` el texto queda fijo; con `ms` se ve ese tiempo y vuelve el fijo. */
  decir(texto: string, o?: { ms?: number; tipo?: 'pregunta' | 'ok' }): void
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
  /** Deja `n` hojas en la pila de la mesa (las nuevas caen si `animar`). */
  apilar(n: number, animar?: boolean): void
  /** Llegan más hojas de las que caben y las de arriba se caen de la mesa. */
  derrumbar(): Promise<void>
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

  let vivo = true
  let tecleando = false
  let opcTeclear: { alRafaga?: () => void; descansos?: boolean } = {}
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

  function teclear(on: boolean, o: { alRafaga?: () => void; descansos?: boolean } = {}) {
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
    gsap.set([brazoI, brazoD], { y: 0 })
    raiz.classList.remove('quieto')
    const alto = o.alto ?? 5
    const snap = { snap: { y: 1 } }
    const tl = gsap.timeline({
      onComplete: () => {
        saltando = false
        gsap.set(salto, { clearProps: 'transform' })
        gsap.set([brazoI, brazoD], { y: 0 })
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
      tl.set(brazoI, { y: 0 })
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

  function decir(texto: string, o: { ms?: number; tipo?: 'pregunta' | 'ok' } = {}) {
    if (!vivo) return
    if (o.ms) {
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

  // ---------- Mesa ----------
  function apilar(n: number, animar = false) {
    gsap.killTweensOf(hojas)
    hojas.forEach((h, k) => {
      gsap.set(h, { clearProps: 'transform,opacity,visibility' })
      h.setAttribute('visibility', k < n ? 'visible' : 'hidden')
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
    llegan.forEach((h) => h.setAttribute('visibility', 'visible'))
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

  function reposo() {
    teclear(false)
    callar()
    ojos('normal')
    sudor(false)
    raiz.classList.remove('duerme')
    mirar(0, 0)
  }

  function destruir() {
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
  return { teclear, saltar, decir, callar, ojos, mirar, sudor, dormir, pensar, lanzar, apilar, derrumbar, reposo, destruir }
}

// ---------- Papeles que se repiten ----------

/** Portada: teclea los tokens de la cinta y celebra cuando entra alguien a la sala. */
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
  c.teclear(true, {
    descansos: true,
    alRafaga: () => {
      if (!cinta || !tokens.length) return
      const tk = tokens[siguiente++ % tokens.length]!
      c.lanzar(tk.texto, tk.clase, cinta)
    },
  })
  if (!api.admin) return
  let ultimo: number | null = null
  api.cada(() => {
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
  api.cada(leerSala, 4000)
}
