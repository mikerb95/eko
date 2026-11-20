/**
 * Comportamiento de cada tipo de escena en el proyector. Cada hook recibe la
 * sección ya visible:
 * - `entrar(el, api, paso)`: al llegar a la escena (bucles, sondeos, oyentes).
 * - `paso(el, paso, previo, api)`: después de cada clic dentro de la escena.
 *   `previo` es -1 cuando se acaba de entrar.
 * Lo que se registre con `api.cada`, `api.limpiar` o `api.al` se apaga solo al
 * salir de la escena. Con movimiento reducido no hay tweens: se fija el valor.
 */
import { CURVA, gsap, reducido } from '../motion/core'
import { aplicarTemperatura, muestrear, tokenizarAprox } from '../../lib/talleres/reglas'
import { aHtml } from '../../lib/talleres/formato'
import { consultar, enviar, type DatosTaller } from './comun'
import { clawdDe, clawdEn, papelPortada, papelVotos } from './clawd'

export interface Api {
  n: number
  admin: boolean
  datos: DatosTaller
  cada(fn: () => void, ms: number): void
  limpiar(fn: () => void): void
  al(nombre: string, fn: () => void): void
}

interface Hook {
  entrar?(el: HTMLElement, api: Api, paso: number): void
  paso?(el: HTMLElement, paso: number, previo: number, api: Api): void
}

const $ = <T extends Element = HTMLElement>(el: ParentNode, s: string) => el.querySelector<T>(s)
const $$ = <T extends Element = HTMLElement>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)]
const pct = (v: number) => `${Math.round(v * 100)} %`
const fmt = (n: number) => Math.round(n).toLocaleString('es-CO')

/** Cifra que rueda desde 0 (o desde `desde`) hasta su valor. */
function contar(el: HTMLElement, hasta: number, formato: (n: number) => string = fmt, desde = 0) {
  // Con la pestaña oculta GSAP no avanza: se fija el valor de una vez.
  if (reducido() || document.hidden) {
    el.textContent = formato(hasta)
    return
  }
  const o = { v: desde }
  gsap.to(o, { v: hasta, duration: 1.4, ease: 'expo.out', onUpdate: () => (el.textContent = formato(o.v)) })
}

/** Sello que "cae" sobre la escena. */
function sellar(els: Element[]) {
  if (reducido() || !els.length) return
  gsap.fromTo(els, { scale: 1.8, rotate: -8, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.45, ease: 'back.out(2)', stagger: 0.1, clearProps: 'transform,opacity,visibility' })
}

/** Elementos con data-paso="k" que se acaban de revelar. */
const reveladosAhora = (el: HTMLElement, paso: number, previo: number, sel = '[data-paso]') =>
  $$(el, sel).filter((x) => {
    const k = Number(x.dataset.paso)
    return k <= paso && k > previo && previo >= 0
  })

/** Sondeo de resultados de la interacción de la escena. */
function sondear(el: HTMLElement, api: Api, pintar: (r: any) => void, ms = 2000) {
  const i = el.dataset.interaccion
  if (!i) return
  api.cada(() => {
    consultar({ que: 'resultados', n: api.n, i })
      .then((r) => {
        pintar(r)
        // Clawd (papelVotos) lleva la cuenta de quién ya respondió.
        el.dispatchEvent(new CustomEvent('tl:resultados', { detail: r }))
      })
      .catch(() => {})
  }, ms)
}

/** Cuenta regresiva que sigue corriendo aunque se salga y se vuelva a la escena. */
const inicios = new Map<string, number>()
function regresiva(el: HTMLElement, api: Api, alSegundo?: (s: number) => void) {
  const c = $(el, '[data-cuenta-regresiva]')
  if (!c) return
  const total = Number(c.dataset.cuentaRegresiva)
  const id = el.dataset.escena!
  if (!inicios.has(id)) inicios.set(id, Date.now())
  const tic = () => {
    const s = Math.max(0, total - Math.floor((Date.now() - inicios.get(id)!) / 1000))
    c.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
    alSegundo?.(s)
  }
  tic()
  api.cada(tic, 1000)
}

/**
 * Escribe la respuesta de la IA palabra por palabra, de borrosa a nítida. Se
 * pinta el HTML final y se envuelven sus palabras: si la animación se corta,
 * el texto ya está completo debajo.
 */
function escribir(destino: HTMLElement, html: string) {
  destino.innerHTML = html
  if (reducido()) return
  const palabras: HTMLElement[] = []
  const walker = document.createTreeWalker(destino, NodeFilter.SHOW_TEXT)
  const nodos: Text[] = []
  while (walker.nextNode()) nodos.push(walker.currentNode as Text)
  for (const nodo of nodos) {
    const partes = nodo.textContent!.split(/(\s+)/)
    const frag = document.createDocumentFragment()
    for (const p of partes) {
      if (!p) continue
      if (/^\s+$/.test(p)) frag.append(p)
      else {
        const s = document.createElement('span')
        s.className = 'pal'
        s.textContent = p
        palabras.push(s)
        frag.append(s)
      }
    }
    nodo.replaceWith(frag)
  }
  gsap.fromTo(palabras, { opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.35, stagger: Math.min(0.03, 2.4 / palabras.length), ease: 'none', clearProps: 'filter,opacity' })
}

// ---------- Hooks ----------

const portada: Hook = {
  entrar(el, api) {
    papelPortada(el, api)
    const cinta = $(el, '[data-cinta]')
    if (!cinta || reducido()) return
    const tw = gsap.to(cinta, { xPercent: -50, duration: 80, ease: 'none', repeat: -1 })
    api.limpiar(() => tw.kill())
  },
}

const sala: Hook = {
  entrar(el, api) {
    const n = $(el, '[data-sala-n]')
    if (!n || !api.admin) return
    let ultimo = 0
    api.cada(() => {
      consultar({ que: 'panel', n: api.n })
        .then((r) => {
          if (r.sala !== ultimo) contar(n, r.sala, fmt, ultimo)
          ultimo = r.sala
        })
        .catch(() => {})
    }, 2500)
  },
}

const evaluacion: Hook = {
  entrar(el, api) {
    papelVotos(el, api)
    const b = $(el, '[data-respondieron]')
    const barra = $<SVGCircleElement>(el, '.anillo .barra')
    let sala = 0
    let ultimo = 0
    if (api.admin) {
      api.cada(() => {
        consultar({ que: 'panel', n: api.n }).then((r) => (sala = r.sala)).catch(() => {})
      }, 4000)
    }
    sondear(el, api, (r) => {
      if (b && r.personas !== ultimo) contar(b, r.personas, fmt, ultimo)
      ultimo = r.personas
      const v = sala ? Math.min(1, r.personas / sala) : r.personas ? 1 : 0
      barra?.style.setProperty('stroke-dasharray', `${(v * 100).toFixed(1)} 100`)
      barra?.style.setProperty('--o', v > 0 ? '1' : '0')
    })
  },
}

const diagnostico: Hook = {
  paso(el, paso, previo) {
    const nuevos = previo < 0 ? $$(el, '[data-paso]').filter((x) => Number(x.dataset.paso) <= paso) : reveladosAhora(el, paso, previo)
    for (const x of nuevos) {
      $$(x, '[data-cuenta]').forEach((c) => contar(c, Number(c.dataset.cuenta)))
      $$(x, '.barra-f').forEach((f, k) => {
        if (reducido()) return
        gsap.fromTo($(f, '.riel i'), { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.9, delay: 0.15 + k * 0.08, ease: CURVA, clearProps: 'transform' })
      })
    }
  },
}

const reglas: Hook = {
  paso(el, paso, previo) {
    if (reducido()) return
    if (paso >= 2 && previo < 2 && previo >= 0) {
      const caso = $(el, '[data-caso-reglas]')
      if (caso) {
        gsap.fromTo($(caso, '.tk'), { y: -80, rotate: -6, autoAlpha: 0 }, { y: 0, rotate: 0, autoAlpha: 1, duration: 0.7, ease: 'bounce.out', clearProps: 'all' })
        gsap.fromTo($(caso, '.sello'), { scale: 1.8, rotate: -10, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, delay: 0.75, duration: 0.4, ease: 'back.out(2)', clearProps: 'all' })
      }
    }
    if (paso >= 3 && previo < 3 && previo >= 0) {
      gsap.fromTo($$(el, '.grupo .tk'), { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, stagger: 0.04, delay: 0.3, ease: 'back.out(2)', clearProps: 'all' })
      const ac = $(el, '[data-caso-modelo]')
      if (ac) {
        gsap.fromTo($(ac, '.tk'), { x: -120, autoAlpha: 0 }, { x: 0, autoAlpha: 1, delay: 1.1, duration: 0.8, ease: CURVA, clearProps: 'all' })
        gsap.fromTo($(ac, '.sello'), { scale: 1.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, delay: 1.8, duration: 0.4, ease: 'back.out(2)', clearProps: 'all' })
      }
    }
  },
}

const perillas: Hook = {
  paso(el, paso, previo) {
    const gs = $$<SVGGElement>(el, '.perilla g')
    const curva = $<SVGPathElement>(el, '[data-curva]')
    const ronda = $(el, '[data-ronda]')
    const azar = (k: number) => ((Math.sin(k * 91.7) * 10000) % 1) * 300
    if (paso === 1) {
      // Recién creadas: al azar.
      gs.forEach((g, k) => g.style.setProperty('--a', String(azar(k))))
      if (!reducido() && previo < 1) gsap.fromTo($$(el, '.perilla'), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, stagger: { each: 0.008, from: 'random' }, ease: 'back.out(2)', clearProps: 'all' })
      if (!reducido()) {
        // Siguen moviéndose sin rumbo.
        ;(el as any)._ruido?.forEach((t: gsap.core.Tween) => t.kill())
        ;(el as any)._ruido = gs.map((g, k) => gsap.to(g, { '--a': azar(k + 7), duration: 1.6 + (k % 5) * 0.3, repeat: -1, yoyo: true, ease: 'sine.inOut' }))
      }
    }
    if (paso >= 2 && (previo < 2 || previo < 0)) {
      ;(el as any)._ruido?.forEach((t: gsap.core.Tween) => t.kill())
      ;(el as any)._ruido = null
      gsap.killTweensOf(gs)
      const finales = gs.map((g) => Number(g.dataset.angulo))
      if (reducido() || previo < 0) {
        gs.forEach((g, k) => g.style.setProperty('--a', String(finales[k])))
        if (curva) curva.style.strokeDashoffset = '0'
        if (ronda) ronda.textContent = fmt(40_000_000)
        return
      }
      gs.forEach((g, k) => gsap.to(g, { '--a': finales[k], overwrite: true, duration: 2.6, delay: (k % 12) * 0.04 + Math.floor(k / 12) * 0.05, ease: 'elastic.out(1, .5)' }))
      if (curva) gsap.fromTo(curva, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 3, ease: 'power2.out' })
      if (ronda) contar(ronda, 40_000_000)
    }
    if (paso === 0) {
      ;(el as any)._ruido?.forEach((t: gsap.core.Tween) => t.kill())
      gsap.killTweensOf(gs)
    }
  },
}

const tokens: Hook = {
  entrar(el, api) {
    const input = $<HTMLInputElement>(el, '[data-tk-entrada]')
    const fichas = $(el, '[data-tk-fichas]')
    if (!input || !fichas) return
    let previos: string[] = $$(fichas, '.tk').map((x) => x.textContent || '')
    const pintar = () => {
      const tks = tokenizarAprox(input.value)
      fichas.replaceChildren(
        ...tks.map((t, k) => {
          const s = document.createElement('span')
          s.className = `tk t${k % 4}`
          s.textContent = t
          return s
        }),
      )
      const nuevos = $$(fichas, '.tk').filter((_, k) => tks[k] !== previos[k])
      if (!reducido() && nuevos.length) gsap.fromTo(nuevos, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, stagger: 0.015, ease: 'back.out(2)', clearProps: 'all' })
      previos = tks
      $(el, '[data-tk-n]')!.textContent = String(tks.length)
      $(el, '[data-tk-p]')!.textContent = String(input.value.split(/\s+/).filter(Boolean).length)
      $(el, '[data-tk-c]')!.textContent = String(input.value.length)
    }
    input.addEventListener('input', pintar)
    api.limpiar(() => input.removeEventListener('input', pintar))
    if (!reducido()) gsap.fromTo($$(fichas, '.tk'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.03, delay: 0.5, ease: CURVA, clearProps: 'all' })
  },
}

/** Barras de candidatos con probabilidad (siguiente token y "por qué inventa"). */
function candidatos(el: HTMLElement) {
  const filas = $$(el, '[data-cand]')
  const base = filas.map((f) => Number(f.dataset.p))
  const pintar = (probs: number[]) =>
    filas.forEach((f, k) => {
      f.style.setProperty('--v', String(probs[k]))
      $(f, 'b')!.textContent = pct(probs[k]!)
    })
  return { filas, base, pintar }
}

function mostrarNueva(el: HTMLElement, palabra: string) {
  const nueva = $(el, '[data-frase-nueva]')
  if (!nueva) return
  nueva.textContent = palabra
  if (!reducido()) gsap.fromTo(nueva, { y: 30, autoAlpha: 0, filter: 'blur(8px)' }, { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.5, ease: CURVA, clearProps: 'all' })
}

const siguiente: Hook = {
  entrar(el, api, paso) {
    clawdDe(el, api)
    const c = candidatos(el)
    const temp = $<HTMLInputElement>(el, '[data-temp]')
    const tempV = $(el, '[data-temp-v]')
    const historial = $(el, '[data-historial]')
    let probs = c.base
    const recalcular = () => {
      const t = Number(temp?.value || 1)
      probs = aplicarTemperatura(c.base, t)
      if (tempV) tempV.textContent = t.toFixed(1).replace('.', ',')
      c.pintar(probs)
    }
    const palabra = (j: number) => $(c.filas[j]!, '.tk')!.textContent || ''
    let pensando = false
    const generar = () => {
      if (pensando) return
      const k = muestrear(probs, Math.random())
      const w = palabra(k)
      const aplicar = () => {
        c.filas.forEach((f, j) => f.classList.toggle('elegido', j === k))
        mostrarNueva(el, w)
        if (historial) {
          const s = document.createElement('span')
          s.className = `tk t${k % 4}`
          s.textContent = w
          historial.append(s)
          while (historial.children.length > 12) historial.firstElementChild?.remove()
          if (!reducido()) gsap.from(s, { scale: 0.5, autoAlpha: 0, duration: 0.3, ease: 'back.out(2)' })
        }
      }
      // Clawd duda entre las más probables (con la temperatura de ese momento),
      // se queda con la sorteada y la lleva a la frase.
      const clawd = clawdEn(el)
      if (!clawd) return aplicar()
      const orden = probs.map((p, j) => [p, j] as const).sort((a, b) => b[0] - a[0]).slice(0, 4).map(([, j]) => j)
      if (!orden.includes(k)) orden[orden.length - 1] = k
      pensando = true
      clawd
        .pensar(orden.map((j) => ({ texto: palabra(j), nota: pct(probs[j]!) })), w, $(el, '[data-frase-nueva]'))
        .catch(() => {})
        .then(() => {
          pensando = false
          aplicar()
        })
    }
    const btn = $(el, '[data-generar]')
    btn?.addEventListener('click', generar)
    const soltar = () => temp?.blur()
    temp?.addEventListener('input', recalcular)
    temp?.addEventListener('change', soltar)
    api.al('generar', generar)
    api.limpiar(() => {
      btn?.removeEventListener('click', generar)
      temp?.removeEventListener('input', recalcular)
      temp?.removeEventListener('change', soltar)
    })
    // Las barras crecen al entrar.
    if (!reducido()) gsap.fromTo($$(el, '.cand .riel i'), { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.9, stagger: 0.07, delay: 0.4, ease: CURVA, clearProps: 'transform' })
    ;(el as any)._generar = generar
    if (paso === 0) {
      $(el, '[data-frase-nueva]')!.textContent = ''
      historial?.replaceChildren()
    }
    recalcular()
  },
  paso(el, paso, previo) {
    if (paso === 1 && previo === 0) (el as any)._generar?.()
  },
}

/**
 * Clawd en "Suena bien no significa que exista": duda entre números parecidos,
 * escoge uno con total seguridad y, cuando cae el sello, la sala le pide la
 * fuente y se queda en blanco.
 */
function inventaClawd(el: HTMLElement, paso: number, animar: boolean) {
  const c = clawdEn(el)
  if (!c) return
  if (paso === 0) {
    c.reposo()
    c.ojos('confundido')
    c.decir('¿Cuál será?')
    return
  }
  if (!animar) {
    c.reposo()
    c.ojos('blanco')
    c.sudor(true)
    c.decir('¿Fuente?', { tipo: 'pregunta' })
    return
  }
  c.callar()
  c.ojos('normal')
  c.teclear(true)
  c.decir('Es la 2290, seguro')
  setTimeout(() => {
    if (clawdEn(el) !== c) return
    c.teclear(false)
    c.decir('¿Fuente?', { tipo: 'pregunta' })
    c.ojos('blanco')
    c.sudor(true)
  }, 2600)
}

const inventa: Hook = {
  entrar(el, api, paso) {
    clawdDe(el, api)
    const c = candidatos(el)
    c.pintar(c.base)
    if (paso === 0) {
      $(el, '[data-frase-nueva]')!.textContent = ''
      c.filas.forEach((f) => f.classList.remove('elegido'))
    }
    if (!reducido()) gsap.fromTo($$(el, '.cand .riel i'), { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.9, stagger: 0.07, delay: 0.4, ease: CURVA, clearProps: 'transform' })
  },
  paso(el, paso, previo) {
    const c = candidatos(el)
    if (paso >= 1) {
      const w = $(c.filas[1]!, '.tk')!.textContent || ''
      const clawd = clawdEn(el)
      const marcar = () => {
        c.filas.forEach((f, j) => f.classList.toggle('elegido', j === 1))
        if (previo < 1) mostrarNueva(el, w)
      }
      if (previo === 0 && clawd && !reducido()) {
        // Primero escoge Clawd; la frase que sigue y el sello llegan después.
        // El proyector ya la estaba haciendo aparecer: se detiene y se oculta.
        const sigue = $(el, '[data-inventa-sigue]')
        gsap.killTweensOf(sigue)
        gsap.set(sigue, { autoAlpha: 0, y: 0 })
        clawd.callar()
        const palabras = c.filas.slice(0, 4).map((f, j) => ({ texto: $(f, '.tk')!.textContent || '', nota: pct(c.base[j]!) }))
        clawd.pensar(palabras, w, $(el, '[data-frase-nueva]')).then(() => {
          if (clawdEn(el) !== clawd) return
          marcar()
          inventaClawd(el, 1, true)
          gsap.fromTo(sigue, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.5, ease: CURVA, clearProps: 'transform,opacity,visibility' })
          gsap.delayedCall(2.4, () => sellar($$(el, '[data-inventa-sigue] .sello')))
        })
      } else {
        marcar()
        if (previo === 0) sellar($$(el, '[data-inventa-sigue] .sello'))
        if (previo < 1) inventaClawd(el, paso, false)
      }
    } else {
      c.filas.forEach((f) => f.classList.remove('elegido'))
      $(el, '[data-frase-nueva]')!.textContent = ''
      inventaClawd(el, 0, false)
    }
  },
}

const mapa: Hook = {
  paso(el, paso, previo) {
    const ptos = $$(el, '[data-pto]')
    const disperso = (k: number) => ({ x: 8 + (((k * 37) % 84) + ((k * 13) % 7)), y: 10 + (((k * 53) % 78) + ((k * 7) % 5)) })
    if (paso === 1) {
      gsap.killTweensOf(ptos)
      ptos.forEach((p, k) => {
        const d = disperso(k)
        p.style.setProperty('--x', String(d.x))
        p.style.setProperty('--y', String(d.y))
      })
      if (!reducido() && previo < 1) gsap.fromTo(ptos, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, stagger: 0.04, ease: 'back.out(2)', clearProps: 'transform,opacity,visibility' })
    }
    if (paso >= 2) {
      const animar = previo >= 0 && previo < 2 && !reducido()
      ptos.forEach((p, k) => {
        const x = Number(p.dataset.x)
        const y = Number(p.dataset.y)
        if (animar) gsap.to(p, { '--x': x, '--y': y, duration: 1.6, delay: k * 0.04, ease: 'power3.inOut' })
        else {
          p.style.setProperty('--x', String(x))
          p.style.setProperty('--y', String(y))
        }
      })
    }
    if (paso >= 3 && previo === 2 && !reducido()) {
      gsap.fromTo($$(el, 'svg.lineas line'), { strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: 1, ease: CURVA })
      sellar($$(el, '.destacado'))
    }
  },
}

const etapas: Hook = {
  paso(el, paso, previo) {
    if (reducido()) return
    if (paso >= 1 && previo < 1 && previo >= 0) {
      const flujo = $(el, '[data-flujo]')
      if (flujo) gsap.fromTo($$(flujo, 'rect'), { x: -90, autoAlpha: 0 }, { x: 0, autoAlpha: 0.85, duration: 1.2, stagger: 0.12, repeat: 2, ease: 'power1.inOut' })
      gsap.fromTo($$(el, '[data-neurona]'), { scale: 0.3, transformOrigin: 'center' }, { scale: 1, duration: 0.5, stagger: 0.06, delay: 0.8, ease: 'back.out(3)' })
    }
    if (paso >= 2 && previo < 2 && previo >= 0) {
      gsap.fromTo($$(el, '[data-marca]'), { scale: 0, transformOrigin: 'center', transformBox: 'fill-box' }, { scale: 1, duration: 0.5, stagger: 0.25, delay: 0.3, ease: 'back.out(3)' })
    }
    if (paso >= 3 && previo < 3 && previo >= 0) {
      gsap.fromTo($(el, '[data-corte]'), { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, delay: 0.3, ease: 'bounce.out' })
    }
  },
}

/** Clawd en la mesa de trabajo: recibe hojas con cada documento y, si no caben, se le caen. */
const FRASES_MESA = ['', 'Cabe de sobra', 'Cabe, pero llena la mesa', 'No cabe todo: ¿qué le doy?']
function mesaClawd(el: HTMLElement, paso: number, animar: boolean) {
  const c = clawdEn(el)
  if (!c) return
  const frases = (() => {
    try {
      return JSON.parse(el.querySelector<HTMLElement>('[data-clawd]')?.dataset.clawdFrases || 'null') ?? FRASES_MESA
    } catch {
      return FRASES_MESA
    }
  })() as string[]
  const cara = () => {
    c.ojos(paso >= 3 ? 'blanco' : paso === 2 ? 'entrecerrados' : 'normal')
    c.sudor(paso >= 2)
    if (frases[paso]) c.decir(frases[paso]!)
    else c.callar()
  }
  if (!animar) {
    c.apilar(paso >= 3 ? 7 : [0, 2, 7][paso]!)
    cara()
    return
  }
  // Las hojas llegan cuando la barra del documento termina de crecer.
  setTimeout(() => {
    if (clawdEn(el) !== c) return
    if (paso >= 3) c.derrumbar().then(() => clawdEn(el) === c && cara())
    else {
      c.apilar([0, 2, 7][paso]!, true)
      cara()
      if (paso === 1) c.saltar({ alto: 3 })
    }
  }, 700)
}

const contexto: Hook = {
  entrar(el, api) {
    clawdDe(el, api)
  },
  paso(el, paso, previo) {
    mesaClawd(el, paso, previo >= 0 && paso > previo)
    if (reducido() || previo < 0) return
    for (const d of reveladosAhora(el, paso, previo, '[data-doc]')) {
      gsap.fromTo(d, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.9, ease: CURVA, clearProps: 'transform' })
      if (d.classList.contains('clay')) gsap.fromTo($(el, '.mesa-riel'), { x: 0 }, { x: 10, duration: 0.07, repeat: 7, yoyo: true, delay: 0.8, clearProps: 'transform' })
    }
  },
}

/** Votación con revelado por pregunta (comprobación, repaso). */
const voto: Hook = {
  entrar(el, api) {
    papelVotos(el, api)
    sondear(el, api, (r) => {
      for (const v of $$(el, '.voto')) {
        const c = r.preguntas?.[v.dataset.pregunta!]
        if (!c) continue
        for (const op of $$(v, '[data-op]')) {
          const n = c.opciones[op.dataset.op!] ?? 0
          op.style.setProperty('--v', String(c.total ? n / c.total : 0))
          $(op, '[data-n]')!.textContent = String(n)
        }
      }
      const p = $(el, '[data-personas]')
      if (p) p.textContent = String(r.personas)
    })
  },
  paso(el, paso, previo) {
    for (const v of $$(el, '.voto')) {
      const k = Number(v.dataset.pasoRevela)
      const antes = v.classList.contains('revelada')
      v.classList.toggle('revelada', paso >= k)
      if (!antes && paso >= k && previo >= 0 && !reducido()) gsap.fromTo($(v, '.op.correcta'), { scale: 1 }, { scale: 1.04, duration: 0.18, yoyo: true, repeat: 1 })
    }
  },
}

/** Reparto de votos en barras horizontales (verdad o alucinación, semáforo). */
function reparto(el: HTMLElement, api: Api, etiquetas: Record<string, string>) {
  sondear(el, api, (r) => {
    for (const a of $$(el, '.afirm')) {
      const c = r.preguntas?.[a.dataset.pregunta!] ?? { total: 0, opciones: {} }
      // Sin votos la barra queda punteada y dice que espera: vacía y gris
      // parecía un campo roto.
      $(a, '.reparto')?.classList.toggle('vacia', !c.total)
      const n = $(a, '[data-votos]')
      if (n) n.textContent = c.total ? `${c.total} ${c.total === 1 ? 'voto' : 'votos'} de la sala` : 'Esperando votos'
      for (const s of $$(a, '[data-op]')) {
        const v = c.total ? (c.opciones[s.dataset.op!] ?? 0) / c.total : 0
        s.style.setProperty('--v', String(v))
        s.textContent = v >= 0.14 ? `${etiquetas[s.dataset.op!] ?? ''} ${pct(v)}`.trim() : ''
      }
    }
  })
}

const verdad: Hook = {
  entrar(el, api) {
    papelVotos(el, api)
    reparto(el, api, { v: 'Verdad', i: 'Inventada' })
  },
  paso(el, paso, previo) {
    const nuevos = reveladosAhora(el, paso, previo).map((x) => $(x, '.sello')!).filter(Boolean)
    sellar(nuevos)
    // Clawd: si lo que se revela es inventado, la sala le pide la fuente y se
    // queda en blanco; si es verdad, se alegra.
    const c = clawdEn(el)
    const ultimo = nuevos[nuevos.length - 1]
    if (!c || !ultimo) return
    if (ultimo.classList.contains('ok')) {
      c.ojos('normal')
      c.sudor(false)
      c.decir('Esa existe', { ms: 2200, tipo: 'ok' })
      c.saltar({ alto: 3 })
    } else {
      c.decir('¿Fuente?', { ms: 3200, tipo: 'pregunta' })
      c.ojos('blanco')
      c.sudor(true)
      setTimeout(() => {
        c.ojos('normal')
        c.sudor(false)
      }, 3200)
    }
  },
}

const semaforo: Hook = {
  entrar(el, api) {
    papelVotos(el, api)
    reparto(el, api, {})
  },
  paso(el, paso, previo) {
    sellar(reveladosAhora(el, paso, previo).map((x) => $(x, '.luz')!).filter(Boolean))
  },
}

const anonimizar: Hook = {
  entrar(el, api) {
    const datos = $$<HTMLButtonElement>(el, '[data-dato]')
    const cont = $(el, '[data-tapados]')
    const timers: number[] = []
    const contar = () => cont && (cont.textContent = String(datos.filter((d) => d.classList.contains('tapado')).length))
    const poner = (d: HTMLButtonElement, si: boolean) => {
      d.classList.toggle('tapado', si)
      d.classList.remove('rolado')
      d.setAttribute('aria-pressed', String(si))
      if (si) timers.push(window.setTimeout(() => d.classList.contains('tapado') && d.classList.add('rolado'), reducido() ? 0 : 900))
      contar()
    }
    const clic = (ev: Event) => {
      const d = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-dato]')
      if (d) poner(d, !d.classList.contains('tapado'))
    }
    el.addEventListener('click', clic)
    ;(el as any)._tapar = (si: boolean) => datos.forEach((d, k) => timers.push(window.setTimeout(() => poner(d, si), si && !reducido() ? k * 220 : 0)))
    api.limpiar(() => {
      el.removeEventListener('click', clic)
      timers.forEach(clearTimeout)
    })
    contar()
  },
  paso(el, paso, previo) {
    if (paso === 1 && previo === 0) (el as any)._tapar?.(true)
    if (paso === 0 && previo === 1) (el as any)._tapar?.(false)
    if (paso === 1 && previo < 0) (el as any)._tapar?.(true)
  },
}

const comparacion: Hook = {
  entrar(el, api) {
    consultar({ que: 'comparacion', n: api.n })
      .then((r) => {
        contar($(el, '[data-antes]')!, r.antes.aciertos * 100, (n) => `${Math.round(n)} %`)
        contar($(el, '[data-despues]')!, r.despues.aciertos * 100, (n) => `${Math.round(n)} %`)
        $$(el, '[data-par]').forEach((p, k) => {
          const q = r.preguntas[k]
          if (!q) return
          $(p, 'i.a')!.style.setProperty('--v', String(q.antes))
          $(p, 'i.d')!.style.setProperty('--v', String(q.despues))
        })
      })
      .catch(() => {})
  },
}

/**
 * Cuentas regresivas. En el descanso Clawd duerme y se despierta en el último
 * minuto; en la práctica teclea mientras la gente trabaja y avisa cuando se
 * acaba el tiempo.
 */
const cuenta: Hook = {
  entrar(el, api) {
    const c = clawdDe(el, api)
    const descanso = el.dataset.tipo === 'descanso'
    let fase = ''
    regresiva(el, api, (s) => {
      if (!c) return
      const nueva = s === 0 ? 'fin' : descanso && s <= 60 ? 'casi' : 'corre'
      if (nueva === fase) return
      const antes = fase
      fase = nueva
      if (descanso) {
        if (nueva === 'corre') return c.dormir(true)
        c.dormir(false)
        c.decir(nueva === 'fin' ? '¡Seguimos!' : '¡Ya casi!')
        if (antes) c.saltar({ brazos: true, saludo: nueva === 'fin' })
        return
      }
      if (nueva === 'corre') return c.teclear(true, { descansos: true })
      c.teclear(false)
      c.decir('¡Tiempo!', { tipo: 'ok' })
      if (antes) c.saltar({ brazos: true, saludo: true })
    })
  },
}

const constructor: Hook = {
  entrar(el, api, paso) {
    const demo = api.datos.demos.find((d) => d.id === el.dataset.demo)
    const btn = $<HTMLButtonElement>(el, '[data-pedir]')
    const verDoc = $<HTMLButtonElement>(el, '[data-ver-doc]')
    const doc = $(el, '[data-doc-ej]')
    const texto = $(el, '[data-texto-ia]')!
    const fuente = $(el, '[data-fuente]')!
    if (!demo || !btn) return
    const cache = new Map<number, { texto: string; fuente: string }>()
    let k = paso
    let enCurso = 0
    // Clawd dice qué le falta a cada versión de la instrucción y teclea
    // mientras llega la respuesta.
    const clawd = clawdDe(el, api)
    const frasesClawd: string[] = (() => {
      try {
        return JSON.parse(el.querySelector<HTMLElement>('[data-clawd]')?.dataset.clawdFrases || '[]')
      } catch {
        return []
      }
    })()

    const mostrar = (r: { texto: string; fuente: string }, animar: boolean) => {
      fuente.className = `fuente ${r.fuente}`
      fuente.textContent = r.fuente === 'vivo' ? 'En vivo · Claude' : 'Respuesta guardada'
      if (animar) escribir(texto, aHtml(r.texto))
      else texto.innerHTML = aHtml(r.texto)
    }
    const vacia = () => {
      fuente.className = 'fuente'
      fuente.textContent = 'Sin respuesta todavía'
      texto.innerHTML = `<p class="espera">Pídale a Claude con esta instrucción.</p>`
    }
    const pedir = async () => {
      const v = demo.versiones[k]
      if (!v) return
      const id = ++enCurso
      const guardada = { texto: v.respaldo, fuente: 'guardada' }
      if (!api.admin) {
        cache.set(k, guardada)
        mostrar(guardada, true)
        if (clawd) {
          clawd.teclear(true)
          setTimeout(() => clawd.teclear(false), 900)
        }
        return
      }
      clawd?.teclear(true)
      btn.disabled = true
      fuente.className = 'fuente'
      fuente.textContent = 'Claude está escribiendo'
      texto.innerHTML = '<span class="pensando" aria-label="Esperando la respuesta"><i></i><i></i><i></i></span>'
      let r: { texto: string; fuente: string }
      try {
        r = await enviar({ accion: 'ia', taller: api.n, demo: demo.id, version: v.id }, 30_000)
      } catch {
        r = guardada
      }
      if (id !== enCurso) return
      clawd?.teclear(false)
      btn.disabled = false
      cache.set(k, r)
      mostrar(r, true)
    }
    const alternarDoc = () => {
      const abierto = doc?.classList.toggle('abierto')
      verDoc?.setAttribute('aria-expanded', String(!!abierto))
      if (verDoc) verDoc.textContent = abierto ? 'Cerrar el auto' : 'Ver el auto'
    }
    btn.addEventListener('click', pedir)
    verDoc?.addEventListener('click', alternarDoc)
    api.al('pedir', pedir)
    api.limpiar(() => {
      btn.removeEventListener('click', pedir)
      verDoc?.removeEventListener('click', alternarDoc)
      doc?.classList.remove('abierto')
      enCurso++
      btn.disabled = false
    })
    let animarVersion = false
    ;(el as any)._version = (nuevo: number, animar = false) => {
      animarVersion = animar
      k = nuevo
      enCurso++
      btn.disabled = false
      $$(el, '[data-instr]').forEach((x) => (x.hidden = Number(x.dataset.instr) !== k))
      $$(el, '[data-version]').forEach((x) => {
        const j = Number(x.dataset.version)
        x.classList.toggle('on', j === k)
        x.classList.toggle('hecha', j < k)
      })
      const nombre = $(el, '[data-version-nombre]')
      if (nombre) nombre.textContent = demo.versiones[k]?.parte ?? ''
      const c = cache.get(k)
      c ? mostrar(c, false) : vacia()
      if (clawd) {
        clawd.teclear(false)
        const ultima = k === demo.versiones.length - 1
        clawd.ojos(k === 0 ? 'confundido' : 'normal')
        if (frasesClawd[k]) clawd.decir(frasesClawd[k]!, ultima ? { tipo: 'ok' } : {})
        else clawd.callar()
        if (ultima && animarVersion) clawd.saltar({ brazos: true })
      }
      if (!reducido()) gsap.fromTo($(el, `[data-instr="${k}"] mark`), { backgroundColor: 'rgba(23,156,145,0.6)' }, { backgroundColor: 'rgba(23,156,145,0.2)', duration: 1.2, clearProps: 'backgroundColor' })
    }
    ;(el as any)._version(k)
  },
  paso(el, paso, previo) {
    if (previo >= 0) (el as any)._version?.(paso, paso > previo)
  },
}

/** Práctica guiada: marca el paso actual en la ruta y muestra solo su maqueta. */
const conectar: Hook = {
  paso(el, paso) {
    for (const x of $$(el, '[data-cx-k]')) {
      const k = Number(x.dataset.cxK)
      x.classList.toggle('actual', k === paso)
      x.classList.toggle('hecho', k < paso)
    }
  },
}

export const HOOKS: Record<string, Hook> = {
  portada,
  sala,
  evaluacion,
  diagnostico,
  reglas,
  perillas,
  tokens,
  siguiente,
  inventa,
  mapa,
  etapas,
  contexto,
  voto,
  repaso: voto,
  verdad,
  semaforo,
  anonimizar,
  comparacion,
  descanso: cuenta,
  practica: cuenta,
  constructor,
  conectar,
}
