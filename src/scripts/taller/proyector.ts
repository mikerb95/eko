/**
 * Motor de la presentación (/academia/taller/<n>).
 *
 * En pantallas anchas convierte la página en un lienzo de 1600x900 escalado
 * al proyector y muestra una escena a la vez. Cada clic (flecha, PageDown,
 * barra espaciadora o clicker) revela el siguiente paso de la escena; cuando
 * no quedan pasos, pasa a la siguiente escena con su entrada animada.
 *
 * Regla de la casa (fail-open): el HTML es el estado final. Sin JS, en
 * celular o si algo falla al montar, la página queda como documento legible
 * con todo visible.
 *
 * Con cuenta de admin, cada cambio de escena se guarda en el servidor (abre
 * o cierra la pregunta de los celulares) y se avisa a la vista de presentador
 * por BroadcastChannel; las órdenes del presentador llegan por el mismo canal.
 */
import { CURVA, SplitText, amarrarSignos, gsap, reducido } from '../motion/core'
import { canal, direccionTecla, enviar, leerDatos, type Mensaje } from './comun'
import { HOOKS, type Api } from './escenas'

const ANCHO_MIN = 760

function montar() {
  const datos = leerDatos()
  const raiz = document.querySelector<HTMLElement>('[data-taller-raiz]')
  const lienzo = document.querySelector<HTMLElement>('[data-lienzo]')
  if (!datos || !raiz || !lienzo) return
  const els = [...lienzo.querySelectorAll<HTMLElement>('.tl-escena')]
  const pie = lienzo.querySelector<HTMLElement>('[data-pie]')
  const num = lienzo.querySelector<HTMLElement>('[data-num]')
  const barras = new Map([...lienzo.querySelectorAll<HTMLElement>('[data-bloque-barra]')].map((b) => [b.dataset.bloqueBarra!, b]))
  const total = els.length

  let activo = false
  let i = -1
  let paso = 0
  const limpiezas = new Map<number, (() => void)[]>()
  const oyentes = new Map<string, () => void>()
  const titulos = new Map<number, SplitText>()

  const avisar = canal(datos.n, (m: Mensaje) => {
    if (!activo) return
    if (m.tipo === 'ir') ir(m.i, m.paso, false)
    else if (m.tipo === 'hola') avisar({ tipo: 'ir', i, paso })
    else if (m.tipo === 'accion') oyentes.get(m.nombre)?.()
  })

  // ---------- Escala ----------
  const escalar = () => {
    const s = Math.min(innerWidth / 1600, innerHeight / 900)
    lienzo.style.setProperty('--escala', String(s))
  }

  // ---------- Pasos ----------
  const pasosDe = (el: HTMLElement) => Number(el.dataset.pasos || 0)
  const aplicarPasos = (el: HTMLElement, p: number, previo: number, animar: boolean) => {
    const nuevos: HTMLElement[] = []
    for (const x of el.querySelectorAll<HTMLElement>('[data-paso]')) {
      const k = Number(x.dataset.paso)
      const pend = k > p
      if (!pend && x.classList.contains('pend') && k > previo) nuevos.push(x)
      x.classList.toggle('pend', pend)
    }
    if (animar && nuevos.length && !reducido()) {
      gsap.fromTo(nuevos, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: CURVA, clearProps: 'transform,opacity,visibility' })
    }
  }

  const apiPara = (k: number): Api => ({
    n: datos.n,
    admin: datos.admin,
    datos,
    cada(fn, ms) {
      fn()
      const id = setInterval(fn, ms)
      limpiezas.get(k)?.push(() => clearInterval(id))
    },
    limpiar(fn) {
      limpiezas.get(k)?.push(fn)
    },
    al(nombre, fn) {
      oyentes.set(nombre, fn)
      limpiezas.get(k)?.push(() => oyentes.delete(nombre))
    },
  })

  const salir = (k: number) => {
    for (const fn of limpiezas.get(k) ?? []) {
      try {
        fn()
      } catch (e) {
        console.error('[taller] salir', e)
      }
    }
    limpiezas.delete(k)
    const el = els[k]
    if (el) {
      gsap.killTweensOf(el.querySelectorAll('*'))
      el.classList.remove('activa')
    }
  }

  const entrada = (k: number) => {
    const el = els[k]!
    if (reducido()) return
    const titulo = el.querySelector<HTMLElement>('.tl-titulo')
    if (titulo) {
      let split = titulos.get(k)
      if (!split) {
        amarrarSignos(titulo)
        split = SplitText.create(titulo, { type: 'lines,words', mask: 'lines' })
        titulos.set(k, split)
      }
      gsap.fromTo(split.words, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.045, ease: 'expo.out' })
    }
    gsap.fromTo(el.querySelector('.tl-kicker'), { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: CURVA, clearProps: 'all' })
    const visibles = [...el.querySelectorAll<HTMLElement>('.tl-cuerpo > *')].filter((x) => !x.classList.contains('pend'))
    gsap.fromTo(visibles, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.09, delay: 0.2, ease: CURVA, clearProps: 'transform,opacity,visibility' })
  }

  const actualizarPie = () => {
    const e = datos.escenas[i]!
    pie?.classList.toggle('oscuro', e.oscura)
    if (num) num.textContent = `${i + 1} / ${total}`
    for (const b of datos.bloques) {
      const del = datos.escenas.map((x, k) => ({ x, k })).filter(({ x }) => x.bloque === b.id)
      const hechas = del.filter(({ k }) => k < i).reduce((a, { x }) => a + x.minutos, 0) + (e.bloque === b.id ? e.minutos * (e.pasos ? paso / e.pasos : 1) : 0)
      barras.get(b.id)?.style.setProperty('--p', String(Math.min(1, hechas / b.minutos)))
    }
  }

  let estadoPend: ReturnType<typeof setTimeout> | null = null
  const guardarEstado = () => {
    if (!datos.admin) return
    if (estadoPend) clearTimeout(estadoPend)
    const escena = datos.escenas[i]!.id
    const p = paso
    estadoPend = setTimeout(() => {
      enviar({ accion: 'estado', taller: datos.n, escena, paso: p }).catch((e) => console.error('[taller] estado', e))
    }, 250)
  }

  // Cambio de escena con View Transitions: la escena que sale se desliza hacia
  // un lado y la nueva entra por el otro (según se avance o se retroceda).
  // Sin soporte del navegador o con movimiento reducido, el cambio es directo.
  // Si llega otro clic a mitad de la transición, la anterior se termina de
  // golpe y arranca la nueva.
  let transicionActual: { skipTransition(): void; finished: Promise<void> } | null = null
  const transicion = (cambiar: () => void, adelante: boolean) => {
    const doc = document as Document & { startViewTransition?: (fn: () => void) => { skipTransition(): void; finished: Promise<void> } }
    if (!doc.startViewTransition || reducido()) return cambiar()
    document.documentElement.dataset.tlDir = adelante ? 'adelante' : 'atras'
    transicionActual?.skipTransition()
    const t = doc.startViewTransition(cambiar)
    transicionActual = t
    t.finished.finally(() => {
      if (transicionActual === t) transicionActual = null
    }).catch(() => {})
  }

  const pasoHook = (el: HTMLElement, k: number, p: number, previo: number) => {
    try {
      HOOKS[el.dataset.tipo!]?.paso?.(el, p, previo, apiPara(k))
    } catch (e) {
      console.error('[taller] paso', e)
    }
  }

  function ir(k: number, p: number, local = true) {
    k = Math.max(0, Math.min(total - 1, k))
    const el = els[k]!
    p = Math.max(0, Math.min(pasosDe(el), p))
    if (k !== i) {
      // El estado cambia ya (para que el siguiente clic cuente desde aquí);
      // el DOM cambia dentro de la transición.
      const anterior = i
      i = k
      paso = p
      const montar = () => {
        // Si mientras tanto se movió un paso dentro de esta misma escena, vale ese.
        const pp = i === k ? paso : p
        if (anterior >= 0) salir(anterior)
        el.classList.add('activa')
        limpiezas.set(k, [])
        aplicarPasos(el, pp, pp, false)
        entrada(k)
        try {
          HOOKS[el.dataset.tipo!]?.entrar?.(el, apiPara(k), pp)
        } catch (e) {
          console.error('[taller] entrar', e)
        }
        pasoHook(el, k, pp, -1)
        actualizarPie()
      }
      if (anterior >= 0) transicion(montar, k > anterior)
      else montar()
      if (local) guardarEstado()
    } else {
      const previo = paso
      paso = p
      aplicarPasos(el, p, previo, true)
      pasoHook(el, k, p, previo)
      actualizarPie()
      // El paso también se guarda: lo siguen el celular (pasos guiados) y el PC vinculado.
      if (local) guardarEstado()
    }
    history.replaceState(null, '', `#${i + 1}.${paso}`)
    if (local) avisar({ tipo: 'ir', i, paso })
  }

  const avanzar = (dir: 1 | -1) => {
    const el = els[i]!
    if (dir === 1) {
      if (paso < pasosDe(el)) ir(i, paso + 1)
      else if (i < total - 1) ir(i + 1, 0)
    } else {
      if (paso > 0) ir(i, paso - 1)
      else if (i > 0) ir(i - 1, pasosDe(els[i - 1]!))
    }
  }

  const tecla = (ev: KeyboardEvent) => {
    if (!activo) return
    const d = direccionTecla(ev)
    if (d) {
      ev.preventDefault()
      avanzar(d)
      return
    }
    if (ev.key === 'Home') ir(0, 0)
    else if (ev.key === 'End') ir(total - 1, 0)
    else if (ev.key === 'f' || ev.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen()
      else document.documentElement.requestFullscreen?.().catch(() => {})
    } else if ((ev.key === 'p' || ev.key === 'P') && datos.admin) {
      window.open(`${location.pathname.replace(/\/$/, '')}/presentador`, 'ekosolv-presentador', 'width=1280,height=800')
    }
  }

  const desdeHash = (): [number, number] => {
    const m = /^#(\d+)(?:\.(\d+))?$/.exec(location.hash)
    return m ? [Number(m[1]) - 1, Number(m[2] || 0)] : [0, 0]
  }

  const activar = () => {
    if (activo) return
    activo = true
    document.body.classList.add('tl-on')
    escalar()
    const [k, p] = desdeHash()
    i = -1
    ir(k, p, false)
    if (datos.admin) guardarEstado()
  }

  const desactivar = () => {
    if (!activo) return
    activo = false
    if (i >= 0) salir(i)
    for (const el of els) {
      el.classList.remove('activa')
      el.querySelectorAll('.pend').forEach((x) => x.classList.remove('pend'))
    }
    document.body.classList.remove('tl-on')
    i = -1
  }

  const evaluar = () => {
    try {
      if (innerWidth >= ANCHO_MIN) {
        activar()
        escalar()
      } else desactivar()
    } catch (e) {
      console.error('[taller] montar', e)
      desactivar()
    }
  }

  addEventListener('resize', evaluar)
  addEventListener('keydown', tecla)
  evaluar()
}

montar()
