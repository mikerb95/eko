/**
 * Clawd en la portada del taller (dibujo en components/taller/Clawd.astro).
 *
 * - Teclea en ráfagas: alterna los bracitos, se encienden teclas y al final de
 *   cada ráfaga sale un token del teclado que sube y se une a la cinta.
 * - Cada pocas ráfagas descansa: respira, mira hacia el título y vuelve.
 * - Si quien dicta es admin, sondea la sala: cuando entra alguien, Clawd salta,
 *   levanta los brazos, saluda y muestra cuántos entraron.
 *
 * Todo se mueve en unidades enteras de la cuadrícula del dibujo (snap) para
 * que siga pareciendo pixel art. Con movimiento reducido no se monta nada.
 */
import { gsap, reducido } from '../motion/core'
import { consultar } from './comun'
import type { Api } from './escenas'

const azar = (a: number, b: number) => a + Math.random() * (b - a)
const entero = (a: number, b: number) => Math.floor(azar(a, b + 1))

export function montarClawd(escena: HTMLElement, api: Api): void {
  const raiz = escena.querySelector<HTMLElement>('[data-clawd]')
  if (!raiz || reducido()) return
  const q = <T extends Element>(s: string) => raiz.querySelector<T>(s)!
  const salto = q<SVGGElement>('[data-clawd-salto]')
  const brazoI = q<SVGGElement>('[data-clawd-brazo="i"]')
  const brazoD = q<SVGGElement>('[data-clawd-brazo="d"]')
  const mirada = q<SVGGElement>('[data-clawd-mirada]')
  const cuerpo = q<SVGRectElement>('[data-clawd-cuerpo]')
  const globo = q<HTMLElement>('[data-clawd-globo]')
  const teclas = [...raiz.querySelectorAll<SVGRectElement>('[data-clawd-tecla]')]
  const colorTecla = teclas[0]?.getAttribute('fill') ?? '#3A5061'

  // Los tokens que lanza son los de la cinta, en orden (la cinta va duplicada
  // para el bucle: basta la primera mitad). Se saltan los separadores.
  const cinta = escena.querySelector<HTMLElement>('[data-cinta]')
  const fichas = cinta ? [...cinta.children].slice(0, cinta.children.length / 2) : []
  const tokens = fichas
    .map((f) => ({ texto: f.textContent ?? '', clase: f.className }))
    .filter((t) => t.texto.trim() && t.texto.trim() !== '·')
  let siguiente = 0

  let vivo = true
  let actual: gsap.core.Animation | null = null
  let rafagas = 0
  let reaccionando = false
  const volando = new Set<HTMLElement>()

  const correr = (a: gsap.core.Animation) => {
    actual?.kill()
    actual = a
  }

  const reposo = () => {
    gsap.set([brazoI, brazoD], { y: 0 })
    gsap.set(mirada, { x: 0, y: 0 })
    teclas.forEach((t) => t.setAttribute('fill', colorTecla))
  }

  function golpe(k: number) {
    const brazo = k % 2 ? brazoD : brazoI
    gsap.set(brazo, { y: 1 })
    gsap.delayedCall(0.07, () => gsap.set(brazo, { y: 0 }))
    // Teclas del lado del brazo que golpea.
    const mitad = Math.floor(teclas.length / 2)
    const lado = k % 2 ? teclas.slice(mitad) : teclas.slice(0, mitad)
    const t = lado[entero(0, lado.length - 1)]
    if (!t) return
    t.setAttribute('fill', '#6fd2c9')
    gsap.delayedCall(0.12, () => t.setAttribute('fill', colorTecla))
  }

  /** Un token sale del teclado, sube en arco y se funde con la cinta. */
  function lanzar() {
    if (!tokens.length || !cinta || document.hidden) return
    const tk = tokens[siguiente++ % tokens.length]
    const esc = escena.getBoundingClientRect()
    const escala = esc.width / escena.offsetWidth || 1
    const cab = cuerpo.getBoundingClientRect()
    const ci = cinta.getBoundingClientRect()

    const el = document.createElement('span')
    el.className = `${tk.clase} clawd-tk`
    el.textContent = tk.texto
    escena.append(el)
    volando.add(el)
    const w = el.offsetWidth
    const h = el.offsetHeight
    // Nace detrás de la cabeza (Clawd va encima) y asoma al subir.
    const x0 = (cab.left + cab.width / 2 - esc.left) / escala - w / 2
    const y0 = (cab.top - esc.top) / escala + h * 0.4
    const y1 = (ci.top - esc.top) / escala + (ci.height / escala - h) / 2

    gsap.set(el, { x: x0, y: y0, scale: 0.3, autoAlpha: 0 })
    gsap
      .timeline({ onComplete: () => (el.remove(), volando.delete(el)) })
      .to(el, { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' }, 0)
      .to(el, { x: x0 - azar(90, 180), duration: 1.15, ease: 'power1.in' }, 0)
      .to(el, { y: y1 + h * 0.35, duration: 1.15, ease: 'power3.out' }, 0)
      .to(el, { autoAlpha: 0, scale: 0.92, duration: 0.35, ease: 'power1.in' }, 0.85)

    // Lo sigue con la mirada.
    gsap.set(mirada, { y: -1 })
    gsap.delayedCall(0.8, () => !reaccionando && gsap.set(mirada, { y: 0 }))
  }

  function teclear() {
    if (!vivo || reaccionando) return
    raiz.classList.remove('quieto')
    const tl = gsap.timeline({
      onComplete: () => {
        lanzar()
        rafagas++
        if (rafagas % 4 === 0) descansar()
        else correr(gsap.delayedCall(azar(0.35, 0.75), teclear))
      },
    })
    let t = 0
    const n = entero(4, 8)
    for (let k = 0; k < n; k++) {
      tl.call(golpe, [k], t)
      t += azar(0.08, 0.15)
    }
    correr(tl)
  }

  function descansar() {
    raiz.classList.add('quieto')
    const dura = azar(1.8, 2.8)
    correr(
      gsap
        .timeline({ onComplete: teclear })
        .call(() => gsap.set(mirada, { x: -1, y: -1 }), [], 0.3)
        .call(() => gsap.set(mirada, { x: 0, y: 0 }), [], dura * 0.6)
        .call(() => gsap.set(mirada, { x: 1, y: 0 }), [], dura * 0.75)
        .call(() => gsap.set(mirada, { x: 0, y: 0 }), [], dura * 0.92)
        .call(() => {}, [], dura),
    )
  }

  /** Alguien entró a la sala: salto, brazos arriba, saludo y globo con el número. */
  function reaccionar(cuantos: number) {
    if (!vivo || reaccionando) return
    reaccionando = true
    raiz.classList.remove('quieto')
    reposo()
    globo.textContent = `+${cuantos}`
    const snap = { snap: { y: 1 } }
    const tl = gsap.timeline({
      onComplete: () => {
        reaccionando = false
        gsap.set(salto, { clearProps: 'transform' })
        teclear()
      },
    })
    tl.to(salto, { scaleY: 0.86, transformOrigin: '50% 100%', duration: 0.09, ease: 'power2.out' })
      .to(salto, { scaleY: 1, y: -5, duration: 0.26, ease: 'power2.out', ...snap })
      .set([brazoI, brazoD], { y: -3 }, '<0.05')
      .set(mirada, { y: -1 }, '<')
      .fromTo(globo, { autoAlpha: 0, y: 16, scale: 0.6 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(2.4)' }, '<')
      .to(salto, { y: 0, duration: 0.22, ease: 'power2.in', ...snap })
      .to(salto, { scaleY: 0.9, transformOrigin: '50% 100%', duration: 0.06 })
      .to(salto, { scaleY: 1, duration: 0.12, ease: 'back.out(3)' })
      .set(brazoI, { y: 0 })
    // Saludo con el brazo derecho.
    for (let k = 0; k < 6; k++) tl.set(brazoD, { y: k % 2 ? -3 : -2 }, `+=${0.13}`)
    tl.set(brazoD, { y: 0 }, '+=0.13')
      .set(mirada, { y: 0 }, '<')
      .to(globo, { autoAlpha: 0, y: -12, duration: 0.35, ease: 'power1.in' }, '+=0.5')
    correr(tl)
  }

  teclear()

  if (api.admin) {
    let ultimo: number | null = null
    api.cada(() => {
      consultar({ que: 'panel', n: api.n })
        .then((r) => {
          const n = Number(r?.sala) || 0
          if (ultimo !== null && n > ultimo) reaccionar(n - ultimo)
          ultimo = n
        })
        .catch(() => {})
    }, 2500)
  }

  api.limpiar(() => {
    vivo = false
    reaccionando = false
    actual?.kill()
    actual = null
    gsap.killTweensOf([salto, brazoI, brazoD, mirada, globo])
    for (const el of volando) gsap.killTweensOf(el), el.remove()
    volando.clear()
    gsap.set(salto, { clearProps: 'transform' })
    gsap.set(globo, { autoAlpha: 0 })
    raiz.classList.remove('quieto')
    reposo()
  })
}
