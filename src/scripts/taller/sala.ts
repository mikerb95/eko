/**
 * La sala en el celular. Consulta cada 2 segundos qué pregunta está abierta y
 * pinta sus opciones; al tocar una, la guarda (se puede cambiar mientras siga
 * abierta). Avisa que está en la sala al llegar y cada 30 segundos, que es lo
 * que marca la asistencia y alimenta el contador del proyector.
 */
import { consultar, enviar } from './comun'

interface Estado {
  enCurso: boolean
  taller?: number
  titulo?: string
  escena?: string
  interaccion?: { id: string; tipo: string; titulo: string; preguntas: { id: string; enunciado: string; opciones: { id: string; texto: string }[] }[] } | null
  mias?: Record<string, string>
}

const raiz = document.querySelector<HTMLElement>('[data-sala]')
if (raiz) montar(raiz)

function montar(raiz: HTMLElement) {
  const $ = (s: string) => raiz.querySelector<HTMLElement>(s)!
  const kicker = $('[data-sl-kicker]')
  const titulo = $('[data-sl-titulo]')
  const sub = $('[data-sl-sub]')
  const lista = $('[data-sl-preguntas]')
  const estado = $('[data-sl-estado]')
  let abierta = ''
  let taller = 0
  let ultimaEntrada = 0
  let enviando = false

  const decir = (t: string, clase = '') => {
    estado.textContent = t
    estado.className = `sl-estado ${clase}`
  }

  const entrar = async () => {
    if (!taller || Date.now() - ultimaEntrada < 30_000) return
    ultimaEntrada = Date.now()
    try {
      const r = await enviar({ accion: 'entrar', taller })
      if (r.asistencia) kicker.textContent = 'Asistencia registrada'
    } catch {
      ultimaEntrada = 0
    }
  }

  const pintarPreguntas = (e: Estado) => {
    const i = e.interaccion!
    titulo.textContent = i.titulo
    sub.textContent = i.preguntas.length > 1 ? 'Responda todas. Puede cambiar su respuesta mientras la pregunta siga abierta.' : 'Puede cambiar su respuesta mientras la pregunta siga abierta.'
    lista.replaceChildren(
      ...i.preguntas.map((p, k) => {
        const caja = document.createElement('div')
        caja.className = 'sl-pregunta'
        caja.dataset.pregunta = p.id
        const n = document.createElement('span')
        n.className = 'n'
        n.textContent = i.preguntas.length > 1 ? `Pregunta ${k + 1} de ${i.preguntas.length}` : 'Pregunta'
        const h = document.createElement('h2')
        h.textContent = p.enunciado
        caja.append(n, h)
        for (const o of p.opciones) {
          const b = document.createElement('button')
          b.type = 'button'
          b.className = 'sl-op'
          b.dataset.op = o.id
          b.textContent = o.texto
          b.setAttribute('aria-pressed', String(e.mias?.[p.id] === o.id))
          b.addEventListener('click', () => votar(i.id, p.id, o.id, caja))
          caja.append(b)
        }
        return caja
      }),
    )
    contarHechas()
  }

  const contarHechas = () => {
    const total = lista.querySelectorAll('.sl-pregunta').length
    const hechas = lista.querySelectorAll('.sl-pregunta:has([aria-pressed="true"])').length
    if (total > 1) decir(hechas === total ? 'Listo: respondió todas. Mire la pantalla.' : `Lleva ${hechas} de ${total}.`, hechas === total ? 'ok' : '')
  }

  const votar = async (interaccion: string, pregunta: string, valor: string, caja: HTMLElement) => {
    if (enviando) return
    enviando = true
    const botones = [...caja.querySelectorAll<HTMLButtonElement>('.sl-op')]
    botones.forEach((b) => (b.disabled = true))
    try {
      await enviar({ accion: 'votar', taller, interaccion, pregunta, valor })
      botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.op === valor)))
      if (botones.length && lista.children.length === 1) decir('Respuesta enviada. Mire la pantalla.', 'ok')
      else contarHechas()
    } catch (err) {
      decir(err instanceof Error ? err.message : 'No se pudo enviar. Intente de nuevo.', 'error')
    } finally {
      botones.forEach((b) => (b.disabled = false))
      enviando = false
    }
  }

  const espera = (texto: string) => {
    const p = document.createElement('p')
    p.className = 'sl-espera'
    p.textContent = texto
    lista.replaceChildren(p)
  }

  const refrescar = async () => {
    let e: Estado
    try {
      e = await consultar<Estado>({ que: 'sala' })
    } catch (err) {
      decir(err instanceof Error ? err.message : 'Sin conexión. Reintentando…', 'error')
      return
    }
    if (!e.enCurso) {
      taller = 0
      abierta = ''
      titulo.textContent = 'No hay una capacitación en curso'
      sub.textContent = 'Cuando empiece la sesión, esta página se actualiza sola.'
      lista.replaceChildren()
      decir('')
      return
    }
    taller = e.taller!
    entrar()
    if (kicker.textContent !== 'Asistencia registrada') kicker.textContent = `Capacitación ${e.taller} · ${e.titulo}`
    const id = e.interaccion?.id ?? ''
    if (id === abierta) return
    abierta = id
    decir('')
    if (e.interaccion) pintarPreguntas(e)
    else {
      titulo.textContent = e.escena || 'Mire la pantalla'
      sub.textContent = ''
      espera('Mire la pantalla. Cuando haya una pregunta, aparece aquí.')
    }
  }

  refrescar()
  setInterval(refrescar, 2000)
}
