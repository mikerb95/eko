/**
 * La sala en el celular, en dos momentos:
 *
 * 1. Registro (sin cuenta): nombres y apellidos con la primera letra de cada
 *    palabra en mayúscula mientras se escribe, cargo y área. Al enviarlo
 *    queda la asistencia y la página se recarga ya dentro de la sala.
 * 2. Sala: consulta cada 2 segundos qué pregunta está abierta y pinta sus
 *    opciones; al tocar una, la guarda (se puede cambiar mientras siga
 *    abierta). Avisa que sigue en la sala cada 30 segundos, que es lo que
 *    alimenta el contador del proyector.
 */
import { capitalizarNombre } from '../../lib/talleres/reglas'
import { API_SALA, consultar as consultarTaller, enviar as enviarTaller } from './comun'

const consultar = <T>(p: Record<string, string | number>) => consultarTaller<T>(p, API_SALA)
const enviar = (c: Record<string, unknown>) => enviarTaller(c, 15_000, API_SALA)

interface Estado {
  enCurso: boolean
  registrado?: boolean
  taller?: number
  titulo?: string
  escena?: string
  interaccion?: { id: string; tipo: string; titulo: string; preguntas: { id: string; enunciado: string; opciones: { id: string; texto: string }[] }[] } | null
  mias?: Record<string, string>
}

const raiz = document.querySelector<HTMLElement>('[data-sala]')
if (raiz) montar(raiz)
const registro = document.querySelector<HTMLFormElement>('[data-sl-registro]')
if (registro) montarRegistro(registro)

function montarRegistro(form: HTMLFormElement) {
  const estado = form.querySelector<HTMLElement>('[data-sl-estado]')!
  const boton = form.querySelector<HTMLButtonElement>('button[type="submit"]')!
  const decir = (t: string, clase = '') => {
    estado.textContent = t
    estado.className = `sl-estado ${clase}`
  }

  // Mayúscula inicial en cada palabra mientras se escribe. La longitud no
  // cambia, así que el cursor se deja donde estaba.
  for (const input of form.querySelectorAll<HTMLInputElement>('[data-capitalizar]')) {
    input.addEventListener('input', () => {
      const nuevo = capitalizarNombre(input.value)
      if (nuevo === input.value) return
      const [a, b] = [input.selectionStart, input.selectionEnd]
      input.value = nuevo
      if (a != null && b != null) input.setSelectionRange(a, b)
    })
  }
  const limpiarError = (ev: Event) => {
    ;(ev.target as HTMLElement).removeAttribute('aria-invalid')
    if (estado.classList.contains('error')) decir('')
  }
  form.addEventListener('input', limpiarError)
  form.addEventListener('change', limpiarError)

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    const campos = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')]
    const vacio = campos.find((c) => !c.value.trim())
    if (vacio) {
      vacio.setAttribute('aria-invalid', 'true')
      vacio.focus()
      const nombre = vacio.closest('label')?.querySelector('span')?.textContent?.toLowerCase() ?? 'ese dato'
      decir(vacio.tagName === 'SELECT' ? 'Elija su área.' : `Escriba su ${nombre === 'nombres' ? 'nombre' : nombre === 'apellidos' ? 'apellido' : nombre}.`, 'error')
      return
    }
    boton.disabled = true
    decir('Registrando…')
    try {
      await enviar({ accion: 'registrar', ...Object.fromEntries(campos.map((c) => [c.name, c.value])) })
      location.reload()
    } catch (err) {
      decir(err instanceof Error ? err.message : 'No se pudo registrar. Intente de nuevo.', 'error')
      boton.disabled = false
    }
  })
}

function montar(raiz: HTMLElement) {
  const $ = (s: string) => raiz.querySelector<HTMLElement>(s)!
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
      await enviar({ accion: 'entrar' })
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
    // El pase es de una capacitación y un día: si ya no sirve, se vuelve al registro.
    if (!e.registrado) {
      location.reload()
      return
    }
    taller = e.taller!
    entrar()
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
