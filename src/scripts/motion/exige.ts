/**
 * Movimiento del selector "¿Qué le exige la ANLA?" (ver ExigeAnla.astro).
 *
 * El CSS ya resuelve qué se enciende; aquí solo va lo que el CSS no puede:
 * - Recorrido automático: mientras nadie elige, el panel pasa solo por los
 *   perfiles, con una barra que se llena en el chip activo. Así se entiende
 *   desde el primer segundo que la lista responde a algo.
 * - Reordenamiento con Flip: las normas que aplican suben y las demás bajan,
 *   en vez de saltar de sitio.
 * El recorrido se pausa al apuntar o enfocar el panel (nada se mueve bajo
 * quien lee) y cuando los chips salen de pantalla, y se detiene para siempre
 * en cuanto el visitante elige un perfil.
 */
import { Flip } from 'gsap/Flip'
import { CURVA, gsap, mientrasSeVea } from './core'
import { esPerfil, ordenar, type Perfil } from '../../lib/exigencias'

gsap.registerPlugin(Flip)

/** Segundos por perfil en el recorrido automático: lo justo para leer qué se encendió. */
const PASO = 3.6
/** Espera antes de arrancar el recorrido, para que la entrada del hero termine. */
const ESPERA = 2.2

export function montarExige(raiz: HTMLElement): () => void {
  const lista = raiz.querySelector<HTMLElement>('[data-exige-lista]')
  const radios = [...raiz.querySelectorAll<HTMLInputElement>('input[name="exige-perfil"]')]
  if (!lista || radios.length === 0) return () => {}

  // El orden del servidor es la referencia estable: reordenar siempre desde él
  // hace que cada perfil quede igual sin importar de cuál se venga.
  const filas = [...lista.querySelectorAll<HTMLElement>('.ex-norma')].map((el) => ({ el, code: el.dataset.code ?? '' }))
  const actual = (): Perfil | null => {
    const v = radios.find((r) => r.checked)?.value
    return esPerfil(v) ? v : null
  }

  function mostrar(perfil: Perfil) {
    const estado = Flip.getState(filas.map((f) => f.el))
    for (const f of ordenar(filas, perfil)) lista!.appendChild(f.el)
    Flip.from(estado, { duration: 0.75, ease: CURVA, stagger: 0.015 })

    // La cifra entra rodando desde abajo, como un dato que llega.
    const cifra = raiz.querySelector<HTMLElement>(`.ex-n[data-p="${perfil}"] b`)
    if (cifra) gsap.fromTo(cifra, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out' })
    const puntos = filas.filter((f) => f.el.classList.contains(`p-${perfil}`)).map((f) => f.el.querySelector('.ex-punto'))
    gsap.fromTo(puntos, { scale: 0.2 }, { scale: 1, duration: 0.5, stagger: 0.05, delay: 0.25, ease: 'back.out(3)', clearProps: 'transform' })
  }

  // --- Recorrido automático ---
  let auto = true
  let enVista = false
  let apuntado = false
  let tween: gsap.core.Tween | null = null

  const barra = (p: Perfil) => raiz.querySelector<HTMLElement>(`[data-exige-chip="${p}"] .ex-prog`)

  function siguiente() {
    const p = actual()
    const i = radios.findIndex((r) => r.value === p)
    const r = radios[(i + 1) % radios.length]
    r.checked = true
    if (esPerfil(r.value)) mostrar(r.value)
    ciclo()
  }

  /** Llena la barra del chip activo; al completarse pasa al siguiente perfil. */
  function ciclo() {
    tween?.kill()
    const p = actual()
    const b = p && barra(p)
    if (!b) return
    raiz.querySelectorAll<HTMLElement>('.ex-prog').forEach((el) => el !== b && gsap.set(el, { scaleX: 0 }))
    tween = gsap.fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: PASO, ease: 'none', paused: true, onComplete: siguiente })
    sync()
  }

  function sync() {
    if (!tween) return
    if (auto && enVista && !apuntado) tween.play()
    else tween.pause()
  }

  function detener() {
    auto = false
    tween?.kill()
    tween = null
    gsap.to(raiz.querySelectorAll('.ex-prog'), { scaleX: 0, duration: 0.3 })
  }

  // Elección del visitante: el evento `change` solo lo dispara una persona
  // (asignar `checked` desde el script no lo emite).
  const alCambiar = () => {
    detener()
    // A partir de aquí la cifra sí se anuncia: antes, el recorrido la habría repetido cada pocos segundos.
    raiz.querySelector('[data-exige-cuenta]')?.setAttribute('aria-live', 'polite')
    const p = actual()
    if (p) mostrar(p)
  }
  const entrar = () => { apuntado = true; sync() }
  const salir = (e: Event) => {
    // focusout dentro del mismo panel no cuenta como salir.
    if (e instanceof FocusEvent && raiz.contains(e.relatedTarget as Node)) return
    if (e.type === 'pointerleave' && raiz.contains(document.activeElement)) return
    apuntado = false
    sync()
  }
  // Abrir una ficha es leer: el recorrido no debe moverla de sitio.
  const alAbrir = (e: Event) => { if ((e.target as HTMLDetailsElement).open) detener() }

  lista.addEventListener('toggle', alAbrir, true)
  raiz.addEventListener('change', alCambiar)
  raiz.addEventListener('pointerenter', entrar)
  raiz.addEventListener('pointerleave', salir)
  raiz.addEventListener('focusin', entrar)
  raiz.addEventListener('focusout', salir)

  // Se vigilan los chips, no el panel entero: si ya no se ven, quien mira está
  // leyendo la lista (en táctil no hay hover que pause) y no conviene moverla.
  // El margen superior descuenta la barra de navegación fija.
  const chips = raiz.querySelector('.ex-perfiles') ?? raiz
  const quitarVista = mientrasSeVea(chips, () => { enVista = true; sync() }, () => { enVista = false; sync() }, '-72px 0px 0px 0px')
  const arranque = gsap.delayedCall(ESPERA, () => { if (auto) ciclo() })

  return () => {
    arranque.kill()
    tween?.kill()
    quitarVista()
    lista.removeEventListener('toggle', alAbrir, true)
    raiz.removeEventListener('change', alCambiar)
    raiz.removeEventListener('pointerenter', entrar)
    raiz.removeEventListener('pointerleave', salir)
    raiz.removeEventListener('focusin', entrar)
    raiz.removeEventListener('focusout', salir)
  }
}
