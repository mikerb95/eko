/**
 * Motion de la portada (ES y EN). Concepto: "expediente en regla". Un solo
 * lenguaje para toda la página: el radar que vigila, el trazo que avanza y el
 * sello que cierra. Cada pieza demuestra lo que dice el texto de su sección.
 *
 * Fail-open: el HTML es el estado final. Con movimiento reducido no se monta
 * nada salvo lo que es estado (no animación).
 */
import { CURVA, SplitText, alEntrar, gsap, montarPagina, reducido } from './motion/core'
import { prepararOdometro } from './motion/odometro'
import { montarRadar } from './motion/radar'

montarPagina('[data-portada]', (raiz) => {
  const limpiezas: (() => void)[] = []
  // Pase lo que pase, la clase que esconde el hero antes del primer fotograma se va.
  const soltarHero = () => document.documentElement.classList.remove('m-ok')

  if (reducido()) {
    soltarHero()
    return
  }

  try {
    limpiezas.push(entradaHero(raiz))
    soltarHero()

    const radar = raiz.querySelector<HTMLElement>('[data-radar]')
    if (radar) limpiezas.push(montarRadar(radar))

    limpiezas.push(cifras(raiz))
  } catch (e) {
    soltarHero()
    throw e
  }

  return () => limpiezas.forEach((fn) => fn())
})

/** Titular palabra por palabra desde su línea; el resto del hero entra detrás, escalonado. */
function entradaHero(raiz: HTMLElement): () => void {
  const titulo = raiz.querySelector<HTMLElement>('.hero-title')
  const tl = gsap.timeline({ defaults: { ease: CURVA } })

  const eyebrow = raiz.querySelector('.hero > .eyebrow')
  if (eyebrow) tl.from(eyebrow, { opacity: 0, y: 12, duration: 0.7 }, 0)

  if (titulo) {
    const split = SplitText.create(titulo, { type: 'lines,words', mask: 'lines' })
    tl.from(split.words, { yPercent: 115, duration: 1.15, stagger: 0.07, ease: 'expo.out' }, 0.1)
  }

  const resto = raiz.querySelectorAll('.hero-foot > *, .hero-stats, [data-radar], .sectors')
  tl.from(resto, { opacity: 0, y: 28, duration: 1, stagger: 0.12, clearProps: 'transform,opacity' }, 0.55)

  return () => tl.kill()
}

/** Las cifras ruedan como un contador al entrar en pantalla (hero y franja de resultados). */
function cifras(raiz: HTMLElement): () => void {
  const odos = [...raiz.querySelectorAll<HTMLElement>('[data-odometro]')].map((el) => ({ el, odo: prepararOdometro(el) }))
  for (const { el, odo } of odos) {
    // Las del hero asoman en el primer pantallazo: si esperan al 82 % se leen "00" quietas.
    alEntrar(el, odo.play, el.closest('.hero') ? 'top bottom' : 'top 85%')
  }
  return () => odos.forEach(({ odo }) => odo.restaurar())
}
