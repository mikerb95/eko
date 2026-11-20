/**
 * Cortina entre escenas del proyector.
 *
 * Un panel vertical barre el lienzo en la dirección del avance. La escena
 * vieja se queda quieta debajo y la nueva, encima, se va descubriendo con un
 * recorte que sigue el borde trasero del panel. Así solo se anima un recorte
 * y un transform: nada se vuelve a capturar en cada cuadro (con View
 * Transitions, cada palabra nombrada se recapturaba en vivo y la animación
 * caía a unos 10 cuadros por segundo).
 *
 * - Dentro del mismo bloque el panel es una franja; las palabras que se
 *   repiten entre los títulos vuelan a su nuevo lugar (un clon encima de
 *   todo), y un número que cambia en el mismo sitio ("Idea 3" → "Idea 4")
 *   rueda como un contador.
 * - Al cambiar de bloque el panel es más ancho que la pantalla, del color del
 *   bloque, y frena en el centro con el nombre del bloque.
 *
 * Todo es Web Animations sobre el mismo reloj y con la misma curva, así que
 * franja y recorte van pegados. Si llega otro clic a mitad de camino, la
 * transición en curso salta a su final y la siguiente arranca de inmediato.
 */
import { emparejar, tiempoPara, type Curva } from './transicion'

export interface Cambio {
  viejo: HTMLElement
  nuevo: HTMLElement
  adelante: boolean
  /** Solo si la escena nueva abre otro bloque. */
  bloque: { titulo: string; rotulo: string } | null
  /** Palabras del kicker y del título de una escena, ya partidas en elementos. */
  palabras: (escena: HTMLElement) => { kicker: HTMLElement[]; titulo: HTMLElement[] }
  /** Cambia el DOM a la escena nueva (la vieja ya no es la activa). */
  cambiar: () => void
  /** Se llama cuando el panel va por la mitad (o al saltar al final). */
  mitad?: () => void
}

const bezier = (c: Curva) => `cubic-bezier(${c.join(',')})`
// La franja usa una curva suave para no pasar demasiado rápido por el centro.
const FRANJA = { w: 0.035, t: 1.05, curva: [0.5, 0, 0.3, 1] as Curva }
// El panel de bloque entra rápido, frena en el centro para que se lea el
// nombre y sale rápido.
const PANEL = { w: 1.3, t: 1.6, curva: [0.2, 0.85, 0.8, 0.15] as Curva }
const VUELO: Curva = [0.65, 0, 0.35, 1]

export function crearCortina(lienzo: HTMLElement) {
  const cortina = document.createElement('div')
  cortina.className = 'tl-cortina'
  cortina.setAttribute('aria-hidden', 'true')
  cortina.innerHTML = '<div class="tl-cortina-panel"><div class="tl-cortina-txt"><span></span><b></b></div></div>'
  const capaVuelo = document.createElement('div')
  capaVuelo.className = 'tl-vuelo'
  capaVuelo.setAttribute('aria-hidden', 'true')
  lienzo.append(cortina, capaVuelo)
  const panel = cortina.querySelector<HTMLElement>('.tl-cortina-panel')!
  const rotulo = cortina.querySelector('span')!
  const titulo = cortina.querySelector('b')!

  let terminar: (() => void) | null = null

  function correr(c: Cambio) {
    terminar?.()
    const modo = c.bloque ? PANEL : FRANJA
    const { w: W, t: T, curva } = modo
    const ms = T * 1000
    const ancho = lienzo.offsetWidth
    const recorrido = (1 + W) * ancho

    const L = lienzo.getBoundingClientRect()
    const escala = L.width / ancho
    const local = (el: Element) => {
      const r = el.getBoundingClientRect()
      return { x: (r.left - L.left) / escala, y: (r.top - L.top) / escala, w: r.width / escala, h: r.height / escala }
    }
    // Momento (ms) en que el borde delantero (o el trasero) del panel pasa por x.
    const pasoPor = (x: number, trasero: boolean) => {
      const p = (c.adelante ? x : ancho - x) + (trasero ? W * ancho : 0)
      return tiempoPara(curva, p / recorrido) * ms
    }

    // ---- Plan con la escena vieja todavía a la vista ----
    const pv = c.palabras(c.viejo)
    const pn = c.palabras(c.nuevo)
    const texto = (els: HTMLElement[]) => els.map((e) => e.textContent ?? '')
    const ek = c.bloque ? null : emparejar(texto(pv.kicker), texto(pn.kicker), true)
    const et = c.bloque ? null : emparejar(texto(pv.titulo), texto(pn.titulo))
    const vuelos = (et?.pares ?? []).map(([i, j]) => {
      const v = pv.titulo[i]!
      const cs = getComputedStyle(v)
      return { v, n: pn.titulo[j]!, desde: local(v), color: cs.color, font: cs.font, ls: cs.letterSpacing }
    })
    const numeros = [...(ek?.numeros ?? []).map(([i, j]) => [pv.kicker[i]!, pn.kicker[j]!]), ...(et?.numeros ?? []).map(([i, j]) => [pv.titulo[i]!, pn.titulo[j]!])]
      .map(([v, n]) => ({ v: v!, n: n!, xv: local(v!) }))

    // ---- Cambio de escena: la vieja queda debajo, quieta ----
    c.cambiar()
    c.viejo.classList.add('saliendo')

    const anims: Animation[] = []
    const opciones = (extra: KeyframeAnimationOptions = {}): KeyframeAnimationOptions => ({ duration: ms, easing: bezier(curva), fill: 'both', ...extra })

    // Panel (o franja) y recorte de la escena nueva, con la misma curva.
    const color = getComputedStyle(c.nuevo).getPropertyValue('--bloque').trim() || '#179C91'
    cortina.style.setProperty('--c', color)
    panel.style.width = `${W * ancho}px`
    rotulo.textContent = c.bloque?.rotulo ?? ''
    titulo.textContent = c.bloque?.titulo ?? ''
    cortina.className = `tl-cortina on${c.bloque ? ' bloque' : ''}`
    const [x0, x1] = c.adelante ? [-W * ancho, ancho] : [ancho, -W * ancho]
    anims.push(panel.animate([{ transform: `translateX(${x0}px)` }, { transform: `translateX(${x1}px)` }], opciones()))
    const recorte = c.adelante
      ? [`inset(0 ${(1 + W) * ancho}px 0 0)`, 'inset(0 0px 0 0)']
      : [`inset(0 0 0 ${(1 + W) * ancho}px)`, 'inset(0 0 0 0px)']
    anims.push(c.nuevo.animate([{ clipPath: recorte[0] }, { clipPath: recorte[1] }], opciones()))

    // Palabras que se quedan: un clon vuela del sitio viejo al nuevo.
    const ocultas: HTMLElement[] = []
    for (const p of vuelos) {
      const hasta = local(p.n)
      const clon = document.createElement('span')
      clon.className = 'tl-vuela'
      clon.textContent = p.v.textContent
      Object.assign(clon.style, { left: `${p.desde.x}px`, top: `${p.desde.y}px`, font: p.font, letterSpacing: p.ls, color: p.color })
      capaVuelo.append(clon)
      const s = hasta.h / (p.desde.h || 1)
      const colorN = getComputedStyle(p.n).color
      for (const el of [p.v, p.n]) {
        el.style.visibility = 'hidden'
        ocultas.push(el)
      }
      anims.push(
        clon.animate(
          [
            { transform: 'translate(0, 0) scale(1)', color: p.color },
            { transform: `translate(${hasta.x - p.desde.x}px, ${hasta.y - p.desde.y}px) scale(${s})`, color: colorN },
          ],
          { duration: ms * 0.8, delay: ms * 0.08, easing: bezier(VUELO), fill: 'both' },
        ),
      )
    }

    // Números: el viejo sube y sale justo antes de que llegue el panel; el
    // nuevo entra desde abajo cuando el borde trasero lo descubre.
    const rueda = (el: HTMLElement) => {
      el.classList.add('tl-rueda')
      if (!(el.firstElementChild instanceof HTMLElement)) {
        const s = document.createElement('span')
        s.append(...el.childNodes)
        el.append(s)
      }
      return el.firstElementChild as HTMLElement
    }
    for (const p of numeros) {
      const xn = local(p.n)
      const tv = Math.max(0, pasoPor(p.xv.x + p.xv.w / 2, false) - 260)
      const tn = pasoPor(xn.x + xn.w / 2, true)
      anims.push(rueda(p.v).animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)' }], { duration: 300, delay: tv, easing: 'cubic-bezier(.55,0,.8,.3)', fill: 'both' }))
      anims.push(rueda(p.n).animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], { duration: 520, delay: tn, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }))
    }

    let mitadHecha = false
    const enMitad = () => {
      if (mitadHecha) return
      mitadHecha = true
      c.mitad?.()
    }
    const reloj = setTimeout(enMitad, ms / 2)

    let hecho = false
    const fin = () => {
      if (hecho) return
      hecho = true
      clearTimeout(reloj)
      enMitad()
      for (const a of anims) a.cancel()
      for (const el of ocultas) el.style.visibility = ''
      for (const p of numeros) {
        p.v.classList.remove('tl-rueda')
        p.n.classList.remove('tl-rueda')
      }
      capaVuelo.replaceChildren()
      c.viejo.classList.remove('saliendo')
      cortina.className = 'tl-cortina'
      if (terminar === fin) terminar = null
    }
    terminar = fin
    Promise.all(anims.map((a) => a.finished)).then(fin, () => {})
  }

  return { correr }
}
