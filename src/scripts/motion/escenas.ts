/**
 * Bucles de las mini escenas de "Por qué Ekosolv" (EscenaBeneficio.astro).
 *
 * Cada escena es una timeline en bucle con tres partes: `inicio` deja la
 * escena en su primer fotograma, la timeline la lleva al estado final, y
 * `final` la devuelve al estado que pintó el servidor (al desmontar). Los
 * estados discretos (lote certificado, vencimiento atendido) son atributos que
 * el CSS ya sabe pintar; el script solo los cambia en el momento justo.
 * Cada bucle corre solo mientras su escena está en pantalla.
 */
import { gsap, mientrasSeVea } from './core'

interface Escena {
  inicio: () => void
  final: () => void
  tl: gsap.core.Timeline
}

const q = (el: HTMLElement, e: string) => [...el.querySelectorAll<HTMLElement>(`[data-e="${e}"]`)]

/** Pausa entre vuelta y vuelta, con la escena resuelta a la vista. */
const RESPIRO = 2.2

function interlocutor(el: HTMLElement): Escena {
  const frentes = q(el, 'frente')
  const [hilos] = q(el, 'hilos')
  const [nodo] = q(el, 'nodo')
  const [final] = q(el, 'final')
  const [destino] = q(el, 'destino')
  const inicio = () => {
    gsap.set(frentes, { opacity: 0.25 })
    // Los trazos se destapan con clip-path: un trazo con pathLength en un SVG
    // estirado (preserveAspectRatio="none") Chrome lo pinta entero de entrada.
    gsap.set([hilos, final], { clipPath: 'inset(0% 100% 0% 0%)' })
    gsap.set(nodo, { opacity: 0.35, scale: 0.86 })
    gsap.set(destino, { opacity: 0.35 })
  }
  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.3 })
  tl.call(inicio, [], 0.001)
    .to(frentes, { opacity: 1, duration: 0.35, stagger: 0.22 }, 0.1)
    .to(hilos, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power2.inOut' }, 0.55)
    .to(nodo, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.4)' }, 1.15)
    .to(final, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, ease: 'power2.out' }, 1.5)
    .to(destino, { opacity: 1, duration: 0.3 }, 1.8)
    .fromTo(destino, { scale: 1 }, { scale: 1.08, duration: 0.18, yoyo: true, repeat: 1 }, 1.8)
    .to({}, { duration: RESPIRO })
  return { inicio, final: () => gsap.set([frentes, hilos, nodo, final, destino], { clearProps: 'all' }), tl }
}

function redaccion(el: HTMLElement): Escena {
  const renglones = q(el, 'renglon')
  const [boton] = q(el, 'boton')
  const [cursor] = q(el, 'cursor')
  const inicio = () => {
    gsap.set(renglones, { scaleX: 0 })
    gsap.set(cursor, { opacity: 0, x: -90, y: -34 })
    gsap.set(boton, { scale: 1 })
    boton.dataset.paso = 'aprobar'
  }
  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.3 })
  tl.call(inicio, [], 0.001)
    // El borrador se escribe renglón por renglón: lo hace el equipo de Ekosolv.
    .to(renglones, { scaleX: 1, duration: 0.5, stagger: 0.32, ease: 'power1.inOut' }, 0.15)
    // La empresa solo aprueba.
    .to(cursor, { opacity: 1, duration: 0.2 }, 1.7)
    .to(cursor, { x: 0, y: 0, duration: 0.7, ease: 'power2.inOut' }, 1.7)
    .to(boton, { scale: 0.92, duration: 0.1, yoyo: true, repeat: 1 }, 2.45)
    .call(() => { delete boton.dataset.paso }, [], 2.55)
    .to(cursor, { opacity: 0, duration: 0.3 }, 3.1)
    .to({}, { duration: RESPIRO })
  return {
    inicio,
    final: () => {
      delete boton.dataset.paso
      gsap.set([...renglones, boton, cursor], { clearProps: 'all' })
    },
    tl,
  }
}

function trazabilidad(el: HTMLElement): Escena {
  const lotes = q(el, 'lote')
  const [escaner] = q(el, 'escaner')
  const fila = escaner.parentElement!
  const BARRIDO = 2.2
  const inicio = () => {
    lotes.forEach((l) => { l.dataset.pendiente = '' })
    gsap.set(escaner, { opacity: 0, x: 0 })
  }
  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.3 })
  tl.call(inicio, [], 0.001)
    .to(escaner, { opacity: 1, duration: 0.2 }, 0.2)
    .to(escaner, { x: () => fila.offsetWidth, duration: BARRIDO, ease: 'none' }, 0.2)
    .to(escaner, { opacity: 0, duration: 0.2 }, 0.2 + BARRIDO)
  // Cada lote se certifica cuando el escáner pasa por su centro.
  lotes.forEach((l, i) => {
    tl.call(() => { delete l.dataset.pendiente }, [], 0.2 + ((i + 0.5) / lotes.length) * BARRIDO)
  })
  tl.to({}, { duration: RESPIRO })
  return {
    inicio,
    final: () => {
      lotes.forEach((l) => { delete l.dataset.pendiente })
      gsap.set(escaner, { clearProps: 'all' })
    },
    tl,
  }
}

function vencimientos(el: HTMLElement): Escena {
  const venc = q(el, 'venc')
  const [hoy] = q(el, 'hoy')
  const RECORRIDO = 3
  const FIN = 84
  const inicio = () => {
    venc.forEach((v) => { v.dataset.pendiente = '' })
    gsap.set(hoy, { opacity: 0, left: '0%' })
  }
  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.3 })
  tl.call(inicio, [], 0.001)
    .to(hoy, { opacity: 1, duration: 0.2 }, 0.15)
    .to(hoy, { left: `${FIN}%`, duration: RECORRIDO, ease: 'none' }, 0.15)
    .to(hoy, { opacity: 0, duration: 0.3 }, 0.15 + RECORRIDO)
  // Cada vencimiento se atiende antes de que el tiempo lo alcance (8 % antes).
  venc.forEach((v) => {
    const x = parseFloat(v.style.getPropertyValue('--x'))
    tl.call(() => { delete v.dataset.pendiente }, [], 0.15 + ((x - 8) / FIN) * RECORRIDO)
  })
  tl.to({}, { duration: RESPIRO })
  return {
    inicio,
    final: () => {
      venc.forEach((v) => { delete v.dataset.pendiente })
      gsap.set(hoy, { clearProps: 'all' })
    },
    tl,
  }
}

function plazo(el: HTMLElement): Escena {
  const dias = q(el, 'dia')
  const [marca] = q(el, 'marca')
  const [rotulo] = q(el, 'rotulo')
  const usados = dias.filter((d) => d.classList.contains('esc-dia-usado'))
  const inicio = () => {
    usados.forEach((d) => d.classList.remove('esc-dia-usado'))
    gsap.set(marca, { opacity: 0, y: -16 })
    gsap.set(rotulo, { opacity: 0 })
  }
  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.3 })
  tl.call(inicio, [], 0.001)
  // Corren los días hábiles...
  usados.forEach((d, i) => tl.call(() => d.classList.add('esc-dia-usado'), [], 0.25 + i * 0.45))
  // ...y la respuesta sale con casi todo el plazo por delante.
  const t = 0.25 + usados.length * 0.45
  tl.to(marca, { opacity: 1, y: 0, duration: 0.45, ease: 'back.out(2)' }, t)
    .to(rotulo, { opacity: 1, duration: 0.3 }, t + 0.15)
    .to({}, { duration: RESPIRO + 0.4 })
  return {
    inicio,
    final: () => {
      usados.forEach((d) => d.classList.add('esc-dia-usado'))
      gsap.set([marca, rotulo], { clearProps: 'all' })
    },
    tl,
  }
}

const CONSTRUCTORES: Record<string, (el: HTMLElement) => Escena> = {
  interlocutor,
  redaccion,
  trazabilidad,
  vencimientos,
  plazo,
}

export function escenas(raiz: HTMLElement): () => void {
  const limpiezas: (() => void)[] = []
  raiz.querySelectorAll<HTMLElement>('[data-escena]').forEach((el) => {
    const crear = CONSTRUCTORES[el.dataset.escena ?? '']
    if (!crear) return
    const esc = crear(el)
    esc.inicio()
    // Arranca cuando ya asomó un poco: así se ve desde el primer gesto.
    const soltar = mientrasSeVea(el, () => esc.tl.play(), () => esc.tl.pause(), '0px 0px -10% 0px')
    limpiezas.push(() => {
      soltar()
      esc.tl.kill()
      esc.final()
    })
  })
  return () => limpiezas.forEach((fn) => fn())
}
