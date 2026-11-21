/**
 * Control remoto del celular (/academia/taller/<n>/control). Lleva su propia
 * posición (escena y paso) como la vista de presentador: la guarda en el
 * servidor, la manda por el canal (mismo equipo) y sigue los movimientos
 * hechos desde el proyector o el presentador.
 *
 * La vista previa es el proyector en un iframe (?vista=1) que muestra la
 * escena siguiente. Mientras queden pasos por revelar en la escena actual
 * está borrosa y se va aclarando paso a paso; queda nítida cuando el
 * siguiente toque ya cambia de escena.
 */
import { canal, enviar, leerDatos, mantenerDespierto, seguirRed, type Mensaje } from './comun'

interface EscenaCt {
  id: string
  kicker: string
  titulo: string
  notas: string[]
  siPreguntan: { p: string; r: string }[]
  pasos: number
}
interface DatosCt {
  n: number
  escenas: EscenaCt[]
}

const datos = leerDatos<DatosCt>('ct-datos')
if (datos) montar(datos)

function montar(d: DatosCt) {
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!
  const total = d.escenas.length
  let i = 0
  let paso = 0

  const avisar = canal(d.n, (m: Mensaje) => {
    if (m.tipo !== 'ir') return
    red.local()
    i = m.i
    paso = m.paso
    pintar()
  })

  // ---------- Vista previa ----------
  const marco = $<HTMLIFrameElement>('[data-prev-frame]')
  const prev = $('[data-prev]')
  let listo = false
  let enVista = -1
  // El lienzo del proyector mide 1600x900: se escala al ancho del recuadro.
  new ResizeObserver(([r]) => prev.style.setProperty('--s', String(r!.contentRect.width / 1600))).observe(prev)
  const mostrarSiguiente = () => {
    const k = i + 1
    $('[data-prev-fin]').hidden = k < total
    marco.hidden = k >= total
    if (!listo || k >= total || k === enVista) return
    enVista = k
    marco.contentWindow?.postMessage({ tipo: 'vista', i: k, paso: 0 }, location.origin)
  }
  marco.addEventListener('load', () => {
    listo = true
    enVista = -1
    // El motor del proyector se monta al cargar sus módulos: un respiro antes del primer mensaje.
    setTimeout(mostrarSiguiente, 300)
  })

  // ---------- Pintar ----------
  let pintada = -1
  const pintar = () => {
    const e = d.escenas[i]!
    // Escena nueva: las notas vuelven arriba.
    if (i !== pintada) $('.ct-notas').scrollTop = 0
    pintada = i
    $('[data-numero]').textContent = `Escena ${i + 1} de ${total}`
    $('[data-paso]').textContent = e.pasos ? `Paso ${paso} de ${e.pasos}` : 'Sin pasos'
    $('[data-kicker]').textContent = e.kicker
    $('[data-titulo]').textContent = e.titulo
    let ahora: HTMLElement | null = null
    $('[data-notas]').replaceChildren(
      ...e.notas.map((n, k) => {
        const li = document.createElement('li')
        li.textContent = n
        // Igual que en el presentador: con tantas notas como pasos + 1, la nota k acompaña al paso k.
        if (e.notas.length === e.pasos + 1) {
          li.className = k < paso ? 'ya' : k === paso ? 'ahora' : ''
          if (k === paso) ahora = li
        }
        return li
      }),
    )
    $('[data-preguntan]').hidden = !e.siPreguntan.length
    $('[data-preguntan-lista]').replaceChildren(
      ...e.siPreguntan.map(({ p, r }) => {
        const det = document.createElement('details')
        const sum = document.createElement('summary')
        sum.textContent = p
        const res = document.createElement('p')
        res.textContent = r
        det.append(sum, res)
        return det
      }),
    )
    ;(ahora as HTMLElement | null)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })

    // Borrosa mientras el siguiente toque solo revela pasos; se aclara a medida
    // que avanzan y queda nítida (100 %) cuando el siguiente toque cambia de escena.
    const quedan = e.pasos - paso
    const fraccion = e.pasos ? paso / e.pasos : 1
    prev.classList.toggle('nitida', quedan <= 0)
    prev.style.setProperty('--borroso', quedan > 0 ? `${(14 - 8 * fraccion).toFixed(1)}px` : '0px')
    prev.style.setProperty('--opaco', quedan > 0 ? (0.35 + 0.3 * fraccion).toFixed(2) : '1')
    $('[data-sig-que]').textContent = quedan > 0 ? (quedan === 1 ? 'Falta 1 paso' : `Faltan ${quedan} pasos`) : i + 1 < total ? 'Escena nueva' : 'Última escena'
    $<HTMLButtonElement>('[data-siguiente]').disabled = quedan <= 0 && i + 1 >= total
    $<HTMLButtonElement>('[data-anterior]').disabled = i === 0 && paso === 0
    mostrarSiguiente()
  }

  // ---------- Mover ----------
  let guardarPend: ReturnType<typeof setTimeout> | null = null
  const guardar = (k: number, p: number) => {
    if (guardarPend) clearTimeout(guardarPend)
    guardarPend = setTimeout(() => {
      enviar<{ mov?: number }>({ accion: 'estado', taller: d.n, escena: d.escenas[k]!.id, paso: p })
        .then((r) => red.guardado(r.mov))
        .catch((e) => console.error('[control] estado', e))
    }, 250)
  }

  const red = seguirRed(d.n, {
    ids: d.escenas.map((e) => e.id),
    alMover: (k, p) => {
      if (k === i && p === paso) return
      i = k
      paso = p
      pintar()
    },
  })

  const ir = (k: number, p: number) => {
    k = Math.max(0, Math.min(total - 1, k))
    p = Math.max(0, Math.min(d.escenas[k]!.pasos, p))
    if (k === i && p === paso) return
    red.local()
    guardar(k, p)
    i = k
    paso = p
    pintar()
    avisar({ tipo: 'ir', i, paso })
  }

  const avanzar = (dir: 1 | -1) => {
    const e = d.escenas[i]!
    if (dir === 1) {
      if (paso < e.pasos) ir(i, paso + 1)
      else ir(i + 1, 0)
    } else if (paso > 0) ir(i, paso - 1)
    else if (i > 0) ir(i - 1, d.escenas[i - 1]!.pasos)
  }

  $('[data-siguiente]').addEventListener('click', () => avanzar(1))
  $('[data-anterior]').addEventListener('click', () => avanzar(-1))

  // Pantalla siempre encendida mientras el control esté abierto.
  mantenerDespierto()

  pintar()
  avisar({ tipo: 'hola' })
}
