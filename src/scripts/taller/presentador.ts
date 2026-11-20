/**
 * Vista de presentador. Lleva su propia copia de la posición (escena y paso),
 * la manda al proyector por BroadcastChannel y al servidor (para abrir la
 * pregunta en los celulares), y la actualiza cuando el proyector avanza.
 */
import { inicioDeEscenas, reloj } from '../../lib/talleres/reglas'
import { canal, consultar, direccionTecla, enviar, leerDatos, type Mensaje } from './comun'

interface EscenaPr {
  id: string
  tipo: string
  kicker: string
  titulo: string
  notas: string[]
  siPreguntan: { p: string; r: string }[]
  pasos: number
  minutos: number
  bloque: string
  provisional: boolean
  interaccion: string
}
interface DatosPr {
  n: number
  titulo: string
  bloques: { id: string; titulo: string; minutos: number }[]
  escenas: EscenaPr[]
}

const datos = leerDatos<DatosPr>('pr-datos')
if (datos) montar(datos)

function montar(d: DatosPr) {
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!
  const inicios = inicioDeEscenas(d.escenas as any)
  let i = 0
  let paso = 0
  let llegada = Date.now()
  const CLAVE = `ekosolv-taller-${d.n}-inicio`
  let inicio = 0
  try {
    inicio = Number(sessionStorage.getItem(CLAVE) || 0)
  } catch {}
  let sesionesHoy: string[] | null = null

  const avisar = canal(d.n, (m: Mensaje) => {
    if (m.tipo === 'ir') {
      if (m.i !== i) llegada = Date.now()
      i = m.i
      paso = m.paso
      pintar()
    }
  })

  const pintar = () => {
    const e = d.escenas[i]!
    $('[data-kicker]').textContent = e.kicker
    $('[data-titulo]').textContent = e.titulo
    $('[data-numero]').textContent = `Escena ${i + 1} de ${d.escenas.length}`
    $('[data-paso]').textContent = e.pasos ? `paso ${paso} de ${e.pasos}` : 'sin pasos'
    $('[data-plan]').textContent = `${e.minutos} min planeados`
    const notas = $('[data-notas]')
    notas.replaceChildren(
      ...e.notas.map((n, k) => {
        const li = document.createElement('li')
        li.textContent = n
        // Si hay tantas notas como pasos + 1, la nota k acompaña al paso k.
        if (e.notas.length === e.pasos + 1) li.className = k < paso ? 'ya' : k === paso ? 'ahora' : ''
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
    const sig = d.escenas[i + 1]
    $('[data-sig-titulo]').textContent = sig ? sig.titulo : 'Fin de la capacitación'
    $('[data-pedir]').hidden = e.tipo !== 'constructor'
    $('[data-generar]').hidden = e.tipo !== 'siguiente'
    const bloques = $('[data-bloques]')
    const idx = d.bloques.findIndex((b) => b.id === e.bloque)
    bloques.replaceChildren(
      ...d.bloques.map((b, k) => {
        const li = document.createElement('li')
        li.className = k === idx ? 'on' : k < idx ? 'hecho' : ''
        li.innerHTML = `<span></span><span>${b.minutos} min</span>`
        li.firstElementChild!.textContent = b.titulo
        return li
      }),
    )
    avisos()
  }

  const avisos = () => {
    const e = d.escenas[i]!
    const lista: string[] = []
    if (sesionesHoy && !sesionesHoy.length) lista.push('No hay un bloque de la academia programado para hoy con esta capacitación: la lista de registrados se guarda, pero no suma horas al certificado de la academia. Prográmelo en el panel de la academia.')
    if (e.provisional) lista.push('Esta escena tiene contenido de ejemplo: reemplácelo con material real de Ekosolv antes de la sesión.')
    $('[data-avisos]').replaceChildren(
      ...lista.map((t) => {
        const p = document.createElement('p')
        p.textContent = t
        return p
      }),
    )
  }

  const ir = (k: number, p: number) => {
    k = Math.max(0, Math.min(d.escenas.length - 1, k))
    p = Math.max(0, Math.min(d.escenas[k]!.pasos, p))
    if (k !== i) {
      llegada = Date.now()
      enviar({ accion: 'estado', taller: d.n, escena: d.escenas[k]!.id }).catch((e) => console.error('[presentador] estado', e))
    }
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
  $('[data-pedir]').addEventListener('click', () => avisar({ tipo: 'accion', nombre: 'pedir' }))
  $('[data-generar]').addEventListener('click', () => avisar({ tipo: 'accion', nombre: 'generar' }))
  $('[data-iniciar]').addEventListener('click', () => {
    inicio = Date.now()
    try {
      sessionStorage.setItem(CLAVE, String(inicio))
    } catch {}
    $('[data-iniciar]').textContent = 'Reiniciar cronómetro'
  })
  if (inicio) $('[data-iniciar]').textContent = 'Reiniciar cronómetro'
  addEventListener('keydown', (ev) => {
    const dir = direccionTecla(ev)
    if (dir) {
      ev.preventDefault()
      avanzar(dir)
    }
  })

  // Relojes: el ritmo compara el tiempo real con el minuto planeado de la escena.
  setInterval(() => {
    const total = inicio ? (Date.now() - inicio) / 1000 : 0
    $('[data-reloj-total]').textContent = reloj(total)
    const esc = (Date.now() - llegada) / 1000
    const relEsc = $('[data-reloj-escena]')
    relEsc.textContent = reloj(esc)
    relEsc.classList.toggle('tarde', esc > d.escenas[i]!.minutos * 60)
    const ritmo = $('[data-ritmo]')
    if (!inicio) {
      ritmo.textContent = 'sin iniciar'
      ritmo.className = ''
      return
    }
    const desfase = Math.round(total / 60 - inicios[i]!)
    ritmo.textContent = Math.abs(desfase) <= 2 ? 'a tiempo' : desfase > 0 ? `${desfase} min tarde` : `${-desfase} min antes`
    ritmo.className = Math.abs(desfase) <= 2 ? '' : desfase > 0 ? 'tarde' : 'antes'
  }, 1000)

  // Preguntas que llegan del celular. Al marcarla como respondida sale de la lista.
  const pintarDudas = (ps: { id: number; texto: string; nombre: string; area: string; escena: string }[]) => {
    $('[data-n-dudas]').textContent = String(ps.length)
    $('[data-dudas-vacio]').hidden = ps.length > 0
    $('[data-dudas]').replaceChildren(
      ...ps.map((p) => {
        const li = document.createElement('li')
        const tx = document.createElement('p')
        tx.textContent = p.texto
        const sp = document.createElement('span')
        sp.textContent = `${p.nombre} · ${p.area}${p.escena ? ` · en "${p.escena}"` : ''}`
        const b = document.createElement('button')
        b.type = 'button'
        b.textContent = 'Respondida'
        b.addEventListener('click', async () => {
          b.disabled = true
          try {
            await enviar({ accion: 'respondida', taller: d.n, id: p.id })
            li.remove()
            const n = $('[data-dudas]').children.length
            $('[data-n-dudas]').textContent = String(n)
            $('[data-dudas-vacio]').hidden = n > 0
          } catch {
            b.disabled = false
          }
        })
        li.append(tx, sp, b)
        return li
      }),
    )
  }

  const panel = () =>
    consultar({ que: 'panel', n: d.n })
      .then((r) => {
        $('[data-sala]').textContent = String(r.sala)
        $('[data-asistentes]').textContent = String(r.asistentes)
        $('[data-lista]').replaceChildren(
          ...(r.lista as { nombre: string; cargo: string; area: string; cuenta: boolean }[]).map((a) => {
            const li = document.createElement('li')
            const b = document.createElement('b')
            b.textContent = a.nombre
            const sp = document.createElement('span')
            sp.textContent = `${a.cargo} · ${a.area}${a.cuenta ? ' · con cuenta en la academia' : ''}`
            li.append(b, sp)
            return li
          }),
        )
        pintarDudas(r.preguntas ?? [])
        sesionesHoy = r.sesiones
        avisos()
      })
      .catch(() => {})
  panel()
  setInterval(panel, 5000)

  pintar()
  avisar({ tipo: 'hola' })
}
