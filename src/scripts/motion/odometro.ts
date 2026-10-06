/**
 * Odómetro: cada dígito de una cifra rueda hasta su valor, columna por
 * columna. Los separadores ("." "+" "%") quedan quietos. El texto original se
 * conserva en `aria-label` y las columnas van con `aria-hidden`, así un lector
 * de pantalla lee "1.000+" y no "0123456789…".
 */
import { gsap } from './core'

const TIRA = '01234567890123456789'

export interface Odometro {
  /** Arranca la animación. Hasta entonces, el odómetro queda en ceros. */
  play: () => void
  /** Devuelve el nodo de texto original (fail-open: nada de ceros colgados). */
  restaurar: () => void
}

/**
 * Prepara `el`, que contiene la cifra en un nodo de texto, seguida o no de otros
 * elementos como `<small>%</small>`.
 */
export function prepararOdometro(el: HTMLElement, { retraso = 0.07, duracion = 1.6 } = {}): Odometro {
  const nodo = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim())
  const tl = gsap.timeline({ paused: true })
  if (!nodo) return { play: () => {}, restaurar: () => {} }

  const texto = nodo.textContent!.trim()
  const ariaPrevio = el.getAttribute('aria-label')
  el.setAttribute('aria-label', el.textContent!.replace(/\s+/g, ' ').trim())

  const caja = document.createElement('span')
  caja.className = 'odo'
  caja.setAttribute('aria-hidden', 'true')

  const columnas: { tira: HTMLElement; digito: number }[] = []
  for (const ch of texto) {
    if (/\d/.test(ch)) {
      const col = document.createElement('span')
      col.className = 'odo-col'
      const tira = document.createElement('span')
      tira.className = 'odo-tira'
      for (const d of TIRA) {
        const s = document.createElement('span')
        s.textContent = d
        tira.append(s)
      }
      // El dígito real sigue ahí para medir el ancho de la columna (tabular-nums).
      const fantasma = document.createElement('span')
      fantasma.className = 'odo-fantasma'
      fantasma.textContent = ch
      col.append(fantasma, tira)
      caja.append(col)
      columnas.push({ tira, digito: Number(ch) })
    } else {
      const s = document.createElement('span')
      s.className = 'odo-sep'
      s.textContent = ch
      caja.append(s)
    }
  }
  nodo.replaceWith(caja)

  // Cada columna da una vuelta completa y para en su dígito (segunda mitad de la tira).
  columnas.forEach(({ tira, digito }, i) => {
    gsap.set(tira, { yPercent: 0 })
    tl.to(tira, { yPercent: -((10 + digito) / 20) * 100, duration: duracion, ease: 'expo.out' }, i * retraso)
  })
  return {
    play: () => { tl.play() },
    restaurar: () => {
      tl.kill()
      if (caja.isConnected) caja.replaceWith(nodo)
      ariaPrevio === null ? el.removeAttribute('aria-label') : el.setAttribute('aria-label', ariaPrevio)
    },
  }
}
