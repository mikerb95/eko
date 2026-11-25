/**
 * Motor de la presentación de la propuesta de Finanzas
 * (/admin/presentacion/finanzas).
 *
 * Versión reducida del proyector de las capacitaciones: lienzo de 1600x900
 * escalado, una escena a la vez, pasos por clic y la misma cortina entre
 * escenas. Sin sala, sin servidor y sin control remoto: se mueve con flechas,
 * PageDown, barra espaciadora o clicker. F = pantalla completa.
 *
 * El estado de cada escena se expone como clases p1..pN en la escena (paso
 * alcanzado) y la mayor parte del motion sale del CSS
 * (src/styles/presentacion-finanzas.css). Aquí solo van los contadores que
 * ruedan, la fórmula que se escribe y algunos detalles por escena.
 *
 * Regla de la casa (fail-open): el HTML es el estado final. Sin JS o en
 * pantallas angostas, la página queda como documento con todo visible.
 */
import { CURVA, SplitText, amarrarSignos, gsap, reducido } from '../motion/core'
import { crearCortina } from '../taller/cortina'
import { direccionTecla } from '../taller/comun'

const ANCHO_MIN = 760

interface Bloque {
  id: string
  titulo: string
}

const fmt = (n: number) => Math.round(n).toLocaleString('es-CO')

function montar() {
  const lienzo = document.querySelector<HTMLElement>('[data-lienzo]')
  const datosBloques = document.getElementById('pf-bloques')
  if (!lienzo || !datosBloques) return
  const bloques: Bloque[] = JSON.parse(datosBloques.textContent || '[]')
  const els = [...lienzo.querySelectorAll<HTMLElement>('.tl-escena')]
  const pie = lienzo.querySelector<HTMLElement>('[data-pie]')
  const num = lienzo.querySelector<HTMLElement>('[data-num]')
  const barras = new Map([...lienzo.querySelectorAll<HTMLElement>('[data-bloque-barra]')].map((b) => [b.dataset.bloqueBarra!, b]))
  const total = els.length
  const pasosDe = (el: HTMLElement) => Number(el.dataset.pasos || 0)
  const minDe = (el: HTMLElement) => Number(el.dataset.min || 1)

  let activo = false
  let i = -1
  let paso = 0
  const titulos = new Map<number, SplitText>()
  const limpiezas = new Map<number, (() => void)[]>()

  // ---------- Escala ----------
  const escalar = () => lienzo.style.setProperty('--escala', String(Math.min(innerWidth / 1600, innerHeight / 900)))

  // ---------- Contadores que ruedan ----------
  const rodar = (span: HTMLElement) => {
    if (span.dataset.rodado) return
    span.dataset.rodado = '1'
    const fin = Number(span.dataset.rueda || 0)
    if (reducido()) {
      span.textContent = fmt(fin)
      return
    }
    const o = { v: 0 }
    gsap.to(o, { v: fin, duration: 1.4, ease: 'power2.out', onUpdate: () => void (span.textContent = fmt(o.v)) })
  }
  const visibleEn = (x: HTMLElement, p: number) => {
    const c = x.closest<HTMLElement>('[data-paso]')
    return !c || Number(c.dataset.paso) <= p
  }
  const rodarVisibles = (el: HTMLElement, p: number) => {
    for (const s of el.querySelectorAll<HTMLElement>('[data-rueda]')) if (visibleEn(s, p)) rodar(s)
  }
  const reiniciarRuedas = (el: HTMLElement) => {
    for (const s of el.querySelectorAll<HTMLElement>('[data-rueda]')) {
      delete s.dataset.rodado
      s.textContent = '0'
    }
  }

  // ---------- Detalles por escena ----------
  const HOOKS: Record<string, { entrar?: (el: HTMLElement) => void; paso?: (el: HTMLElement, p: number, previo: number) => void }> = {
    anio: {
      entrar(el) {
        el.querySelectorAll<HTMLElement>('.pf-anio-fila').forEach((f) => {
          f.querySelectorAll<HTMLElement>('.pf-dot').forEach((d) => {
            const col = [...f.children].indexOf(d.parentElement!)
            d.style.setProperty('--d', `${col * 0.05}s`)
          })
        })
        // La fecha que se pasa: el IVA de septiembre.
        const iva = el.querySelectorAll<HTMLElement>('.pf-anio-fila')[2]
        iva?.querySelectorAll<HTMLElement>('.pf-dot')[4]?.classList.add('tarde')
      },
      paso(el, p) {
        const n = el.querySelectorAll(`.pf-dot`).length
        const vis = [...el.querySelectorAll<HTMLElement>('.pf-dot')].filter((d) => Number(d.dataset.dotP) <= p).length
        const span = el.querySelector<HTMLElement>('[data-cuenta-puntos]')
        if (!span) return
        const desde = Number(span.dataset.v || 0)
        span.dataset.v = String(vis)
        if (reducido()) span.textContent = String(vis)
        else {
          const o = { v: desde }
          gsap.to(o, { v: vis, duration: 0.9, ease: 'power2.out', onUpdate: () => void (span.textContent = String(Math.round(o.v))) })
        }
        span.title = `${vis} de ${n}`
      },
    },
    exp: {
      paso(el, p) {
        const hasta = [0, 2, 4, 5][p] ?? 5
        el.querySelectorAll<HTMLElement>('.pf-estados li').forEach((li, k) => li.classList.toggle('hecho', k <= hasta))
      },
    },
    tutor: {
      paso(el, p, previo) {
        const code = el.querySelector<HTMLElement>('[data-escribe]')
        if (!code) return
        const txt = code.dataset.escribe || ''
        if (p < 1) {
          code.textContent = ''
          return
        }
        if (previo >= 1 && code.textContent === txt) return
        if (reducido() || previo > 1) {
          code.textContent = txt
          return
        }
        const o = { n: 0 }
        gsap.killTweensOf(o)
        gsap.to(o, { n: txt.length, duration: 1.8, ease: 'none', onUpdate: () => void (code.textContent = txt.slice(0, Math.round(o.n))) })
      },
    },
  }

  // ---------- Pasos ----------
  const aplicarPasos = (el: HTMLElement, p: number, previo: number, animar: boolean) => {
    for (let k = 1; k <= pasosDe(el); k++) el.classList.toggle(`p${k}`, k <= p)
    el.dataset.p = String(p)
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
    rodarVisibles(el, p)
    try {
      HOOKS[el.dataset.tipo!]?.paso?.(el, p, previo)
    } catch (e) {
      console.error('[presentacion] paso', e)
    }
  }

  const palabrasTitulo = (k: number): HTMLElement[] => {
    const titulo = els[k]!.querySelector<HTMLElement>('.tl-titulo')
    if (!titulo) return []
    let split = titulos.get(k)
    if (!split) {
      amarrarSignos(titulo)
      split = SplitText.create(titulo, { type: 'lines,words', mask: 'lines' })
      titulos.set(k, split)
    }
    return split.words as HTMLElement[]
  }
  const palabrasKicker = (el: HTMLElement): HTMLElement[] => {
    const kicker = el.querySelector<HTMLElement>('.tl-kicker')
    if (!kicker) return []
    if (!kicker.querySelector('.tl-kicker-txt')) {
      const env = document.createElement('span')
      env.className = 'tl-kicker-txt'
      ;(kicker.textContent ?? '').trim().split(/\s+/).filter(Boolean).forEach((w, q) => {
        if (q) env.append(' ')
        const s = document.createElement('span')
        s.className = 'tl-kw'
        s.append(document.createElement('span'))
        s.firstElementChild!.textContent = w
        env.append(s)
      })
      kicker.replaceChildren(env)
    }
    return [...kicker.querySelectorAll<HTMLElement>('.tl-kw')]
  }

  const entrada = (k: number, conTransicion: boolean) => {
    const el = els[k]!
    if (reducido() || conTransicion) return
    const palabras = palabrasTitulo(k)
    if (palabras.length) gsap.fromTo(palabras, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.045, ease: 'expo.out' })
    gsap.fromTo(el.querySelector('.tl-kicker'), { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: CURVA, clearProps: 'all' })
    const visibles = [...el.querySelectorAll<HTMLElement>('.tl-cuerpo > *')].filter((x) => !x.classList.contains('pend'))
    gsap.fromTo(visibles, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.09, delay: 0.2, ease: CURVA, clearProps: 'transform,opacity,visibility' })
  }

  const salir = (k: number) => {
    for (const fn of limpiezas.get(k) ?? []) fn()
    limpiezas.delete(k)
    const el = els[k]
    if (!el) return
    gsap.killTweensOf(el.querySelectorAll('*'))
    el.classList.remove('activa')
  }

  const actualizarPie = () => {
    const el = els[i]!
    pie?.classList.toggle('oscuro', el.classList.contains('oscura'))
    if (num) num.textContent = `${i + 1} / ${total}`
    for (const b of bloques) {
      const del = els.map((x, k) => ({ x, k })).filter(({ x }) => x.dataset.bloque === b.id)
      const totalB = del.reduce((a, { x }) => a + minDe(x), 0) || 1
      const hechas = del.filter(({ k }) => k < i).reduce((a, { x }) => a + minDe(x), 0) + (el.dataset.bloque === b.id ? minDe(el) * (pasosDe(el) ? paso / pasosDe(el) : 1) : 0)
      barras.get(b.id)?.style.setProperty('--p', String(Math.min(1, hechas / totalB)))
    }
  }

  const cortina = typeof Element.prototype.animate === 'function' ? crearCortina(lienzo) : null

  function ir(k: number, p: number) {
    k = Math.max(0, Math.min(total - 1, k))
    const el = els[k]!
    p = Math.max(0, Math.min(pasosDe(el), p))
    if (k !== i) {
      const anterior = i
      i = k
      paso = p
      const mostrar = (conTransicion: boolean) => {
        const pp = i === k ? paso : p
        if (anterior >= 0) salir(anterior)
        el.classList.add('activa')
        limpiezas.set(k, [])
        reiniciarRuedas(el)
        try {
          HOOKS[el.dataset.tipo!]?.entrar?.(el)
        } catch (e) {
          console.error('[presentacion] entrar', e)
        }
        aplicarPasos(el, pp, -1, false)
        entrada(k, conTransicion)
        if (!conTransicion) actualizarPie()
      }
      if (anterior >= 0 && cortina && !reducido()) {
        const bv = els[anterior]!.dataset.bloque
        const bn = el.dataset.bloque
        const nb = bloques.findIndex((b) => b.id === bn)
        cortina.correr({
          viejo: els[anterior]!,
          nuevo: el,
          adelante: k > anterior,
          bloque: bv !== bn && nb >= 0 ? { titulo: bloques[nb]!.titulo, rotulo: `Parte ${nb} de ${bloques.length - 1}` } : null,
          palabras: (esc) => ({ kicker: palabrasKicker(esc), titulo: palabrasTitulo(els.indexOf(esc)) }),
          cambiar: () => mostrar(true),
          alFinal: actualizarPie,
        })
      } else mostrar(false)
    } else {
      const previo = paso
      paso = p
      aplicarPasos(el, p, previo, true)
      actualizarPie()
    }
    history.replaceState(null, '', `#${i + 1}.${paso}`)
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
    }
  }

  // Clic en el lienzo: avanza (mitad derecha) o retrocede (mitad izquierda).
  const clic = (ev: MouseEvent) => {
    if (!activo || (ev.target as HTMLElement).closest('a, button')) return
    const r = lienzo.getBoundingClientRect()
    avanzar(ev.clientX - r.left > r.width * 0.3 ? 1 : -1)
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
    ir(k, p)
  }

  const desactivar = () => {
    if (!activo) return
    activo = false
    if (i >= 0) salir(i)
    for (const el of els) {
      el.classList.remove('activa')
      for (let k = 1; k <= pasosDe(el); k++) el.classList.add(`p${k}`)
      el.querySelectorAll('.pend').forEach((x) => x.classList.remove('pend'))
      el.querySelectorAll<HTMLElement>('[data-rueda]').forEach((s) => void (s.textContent = fmt(Number(s.dataset.rueda))))
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
      console.error('[presentacion] montar', e)
      desactivar()
    }
  }

  // Modo documento: todo visible y en su estado final.
  for (const el of els) {
    for (let k = 1; k <= pasosDe(el); k++) el.classList.add(`p${k}`)
    try {
      HOOKS[el.dataset.tipo!]?.entrar?.(el)
      HOOKS[el.dataset.tipo!]?.paso?.(el, pasosDe(el), pasosDe(el))
    } catch {}
    el.querySelectorAll<HTMLElement>('[data-rueda]').forEach((s) => void (s.textContent = fmt(Number(s.dataset.rueda))))
  }

  addEventListener('resize', evaluar)
  addEventListener('keydown', tecla)
  lienzo.addEventListener('click', clic)
  evaluar()
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar)
else montar()
