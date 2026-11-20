/**
 * La sala en el celular, en dos momentos:
 *
 * 1. Registro (sin cuenta): nombres y apellidos con la primera letra de cada
 *    palabra en mayúscula mientras se escribe, correo y área. Al enviarlo le
 *    llega al correo el enlace de entrada; al abrirlo queda la asistencia y
 *    entra a la sala.
 * 2. Sala: consulta cada 2 segundos qué pregunta está abierta y pinta sus
 *    opciones; al tocar una, la guarda (se puede cambiar mientras siga
 *    abierta). Avisa que sigue en la sala cada 30 segundos, que es lo que
 *    alimenta el contador del proyector.
 *
 * 3. Debajo de lo anterior: el ejemplo de la escena en curso para el área de
 *    la persona y una caja para enviarle preguntas a quien dicta (las ve en
 *    la vista de presentador).
 *
 * 4. Al llegar la presentación a su última escena, el celular pasa solo al
 *    formulario de cierre de su área (/academia/sala/opinion), si todavía no
 *    lo ha enviado.
 *
 * Mientras la página esté abierta, la pantalla del celular no se apaga.
 */
import { capitalizarNombre } from '../../lib/talleres/reglas'
import { pintarRevision } from '../academia/revision'
import { API_SALA, avisoLocal, consultar as consultarTaller, cuentaAviso, enviar as enviarTaller, type Aviso, type AvisoRed } from './comun'

const consultar = <T>(p: Record<string, string | number>) => consultarTaller<T>(p, API_SALA)
const enviar = (c: Record<string, unknown>) => enviarTaller(c, 15_000, API_SALA)
// El revisor hace dos llamadas a la IA: necesita más margen.
const enviarLargo = (c: Record<string, unknown>) => enviarTaller(c, 60_000, API_SALA)

interface Estado {
  enCurso: boolean
  registrado?: boolean
  taller?: number
  titulo?: string
  escena?: string
  interaccion?: { id: string; tipo: string; titulo: string; preguntas: { id: string; enunciado: string; opciones: { id: string; texto: string }[] }[] } | null
  mias?: Record<string, string>
  kicker?: string
  idea?: string
  ejemplo?: { area: string; titulo: string; texto: string } | null
  practica?: { consigna: string; maximo: number } | null
  guia?: Guia | null
  codigoPC?: string | null
  /** Última escena: 'pendiente' lleva al formulario de cierre del área. */
  opinion?: 'pendiente' | 'enviada' | null
  /** Aviso "Empezamos en 00:00" que puso quien dicta. */
  aviso?: AvisoRed | null
}

/** Paso de una práctica guiada (escena conectar), con su maqueta animada. */
interface Guia {
  paso: number
  total: number
  concepto: string
  titulo: string
  hacer: string
  queEs: string
  maqueta: string
}

const raiz = document.querySelector<HTMLElement>('[data-sala]')
if (raiz) montar(raiz)
const registro = document.querySelector<HTMLFormElement>('[data-sl-registro]')
if (registro) montarRegistro(registro)
mantenerDespierto()

/**
 * Pide que la pantalla no se apague mientras la sala esté abierta (Screen
 * Wake Lock). El navegador lo suelta cuando la pestaña se oculta, así que se
 * vuelve a pedir al regresar; y como Safari a veces lo niega sin un toque,
 * también se reintenta en cada toque. Si el navegador no lo soporta, la sala
 * funciona igual y la pantalla se apaga como siempre.
 */
function mantenerDespierto() {
  if (!('wakeLock' in navigator)) return
  let activo = false
  const pedir = async () => {
    if (activo || document.visibilityState !== 'visible') return
    activo = true
    try {
      const lock = await navigator.wakeLock.request('screen')
      lock.addEventListener('release', () => (activo = false))
    } catch {
      activo = false
    }
  }
  void pedir()
  document.addEventListener('visibilitychange', () => void pedir())
  addEventListener('pointerdown', () => void pedir(), { passive: true })
}

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
    const correo = form.querySelector<HTMLInputElement>('input[name="correo"]')!
    if (!correo.checkValidity()) {
      correo.setAttribute('aria-invalid', 'true')
      correo.focus()
      decir('Escriba un correo válido.', 'error')
      return
    }
    boton.disabled = true
    decir('Enviando el enlace…')
    try {
      const r = (await enviar({ accion: 'registrar', ...Object.fromEntries(campos.map((c) => [c.name, c.value])) })) as { correo?: string; enlace?: string }
      // En desarrollo sin Resend el enlace vuelve en la respuesta: se abre directo.
      if (r.enlace) return void location.assign(r.enlace)
      const enviado = document.querySelector<HTMLElement>('[data-sl-enviado]')!
      enviado.querySelector('[data-sl-correo]')!.textContent = r.correo ?? correo.value
      form.hidden = true
      enviado.hidden = false
      enviado.querySelector<HTMLButtonElement>('[data-sl-otra]')!.onclick = () => {
        enviado.hidden = true
        form.hidden = false
        boton.disabled = false
        decir('')
        correo.focus()
      }
    } catch (err) {
      decir(err instanceof Error ? err.message : 'No se pudo registrar. Intente de nuevo.', 'error')
      boton.disabled = false
    }
  })
}

/** Caja para enviarle una pregunta a quien dicta. */
function montarDuda(form: HTMLFormElement) {
  const txt = form.querySelector('textarea')!
  const boton = form.querySelector('button')!
  const estado = form.querySelector<HTMLElement>('[data-sl-duda-estado]')!
  const decir = (t: string, clase = '') => {
    estado.textContent = t
    estado.className = `sl-estado ${clase}`
  }
  txt.addEventListener('input', () => decir(''))
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    if (!txt.value.trim()) {
      decir('Escriba su pregunta.', 'error')
      txt.focus()
      return
    }
    boton.disabled = true
    try {
      await enviar({ accion: 'preguntar', texto: txt.value })
      txt.value = ''
      decir('Enviada. Quien dicta la ve en su pantalla.', 'ok')
    } catch (err) {
      decir(err instanceof Error ? err.message : 'No se pudo enviar. Intente de nuevo.', 'error')
    } finally {
      boton.disabled = false
    }
  })
}

function montar(raiz: HTMLElement) {
  const $ = (s: string) => raiz.querySelector<HTMLElement>(s)!
    const titulo = $('[data-sl-titulo]')
  const kicker = $('[data-sl-escena]')
  const sub = $('[data-sl-sub]')
  const lista = $('[data-sl-preguntas]')
  const estado = $('[data-sl-estado]')
  // null: todavía no se ha pintado nada (una escena sin pregunta también es '').
  let abierta: string | null = null
  let ejemploVisto = ''
  const ejemplo = $('[data-sl-ejemplo]')
  montarDuda(raiz.querySelector<HTMLFormElement>('[data-sl-duda]')!)
  const pc = montarPC(raiz)
  const avisoInicio = montarEspera(raiz)

  const pintarEjemplo = (e: Estado['ejemplo']) => {
    const clave = e ? e.titulo + e.texto : ''
    if (clave === ejemploVisto) return
    ejemploVisto = clave
    ejemplo.hidden = !e
    if (!e) return
    $('[data-sl-ej-area]').textContent = `En su área · ${e.area}`
    $('[data-sl-ej-titulo]').textContent = e.titulo
    $('[data-sl-ej-texto]').textContent = e.texto
  }
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

  // Práctica guiada: la sala se vuelve el revisor de instrucciones.
  const pintarPractica = (p: { consigna: string; maximo: number }) => {
    titulo.textContent = 'Revise su instrucción'
    sub.textContent = p.consigna
    const form = document.createElement('form')
    form.className = 'sl-form sl-practica'
    form.innerHTML = `
      <label><span>Su instrucción</span>
        <textarea name="instruccion" rows="7" placeholder="Contexto: soy… Tarea: … Formato: …"></textarea>
      </label>
      <p class="sl-nota">No escriba datos personales: los correos y números de documento o teléfono se ocultan antes de enviarla.</p>
      <button type="submit" class="ac-btn">Revisar mi instrucción</button>`
    const txt = form.querySelector('textarea')!
    txt.maxLength = p.maximo
    const boton = form.querySelector('button')!
    const res = document.createElement('div')
    res.className = 'ac-revision'
    res.hidden = true
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault()
      boton.disabled = true
      boton.textContent = 'Revisando…'
      decir('')
      try {
        const r = await enviarLargo({ accion: 'practicar', instruccion: txt.value })
        res.hidden = false
        res.innerHTML = pintarRevision(r)
        res.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } catch (err) {
        decir(err instanceof Error ? err.message : 'No se pudo revisar. Intente de nuevo.', 'error')
      } finally {
        boton.disabled = false
        boton.textContent = 'Revisar mi instrucción'
      }
    })
    res.addEventListener('click', async (ev) => {
      const el = ev.target as HTMLElement
      const mejorada = res.querySelector('.ac-mejorada pre')?.textContent ?? ''
      if (el.closest('[data-usar-mejorada]')) {
        txt.value = mejorada
        txt.focus()
        txt.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (el.closest('[data-copiar]')) {
        const b = el.closest<HTMLButtonElement>('[data-copiar]')!
        try {
          await navigator.clipboard.writeText(mejorada)
          b.textContent = 'Copiada'
        } catch {
          b.textContent = 'Selecciónela y copie'
        }
        setTimeout(() => (b.textContent = 'Copiar'), 1800)
      }
    })
    lista.replaceChildren(form, res)
  }

  // Práctica guiada: el paso que va mostrando quien dicta, con su animación,
  // lo que hay que hacer en el PC y el concepto que aparece.
  const pintarGuia = (g: Guia) => {
    titulo.textContent = g.titulo
    kicker.textContent = g.paso === 0 ? 'Práctica final · antes de empezar' : `Paso ${g.paso} de ${g.total} · ${g.concepto}`
    sub.textContent = ''
    const caja = document.createElement('div')
    caja.className = 'sl-guia'
    const barra = document.createElement('div')
    barra.className = 'sl-guia-barra'
    for (let k = 1; k <= g.total; k++) {
      const i = document.createElement('i')
      if (k < g.paso) i.className = 'hecho'
      else if (k === g.paso) i.className = 'actual'
      barra.append(i)
    }
    caja.append(barra)
    const plantilla = raiz.querySelector<HTMLTemplateElement>(`template[data-mq-plantilla="${CSS.escape(g.maqueta)}"]`)
    if (plantilla) {
      caja.append(plantilla.content.cloneNode(true))
      const nota = document.createElement('p')
      nota.className = 'sl-nota-mq'
      nota.textContent = 'Ilustración: en su pantalla puede verse un poco distinto.'
      caja.append(nota)
    }
    const hacer = document.createElement('p')
    hacer.className = 'sl-guia-hacer'
    hacer.textContent = g.hacer
    const quees = document.createElement('p')
    quees.className = 'sl-guia-quees'
    const b = document.createElement('b')
    b.textContent = `Qué es · ${g.concepto}`
    quees.append(b, g.queEs)
    caja.append(hacer, quees)
    lista.replaceChildren(caja)
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
    avisoInicio?.poner(e.enCurso ? e.aviso : null)
    if (!e.enCurso) {
      taller = 0
      abierta = null
      titulo.textContent = 'No hay una capacitación en curso'
      kicker.textContent = ''
      sub.textContent = 'Cuando empiece la sesión, esta página se actualiza sola.'
      lista.replaceChildren()
      pintarEjemplo(null)
      decir('')
      return
    }
    // El pase es de una capacitación y un día: si ya no sirve, se vuelve al registro.
    if (!e.registrado) {
      location.reload()
      return
    }
    // Final de la presentación: al formulario de cierre de su área.
    if (e.opinion === 'pendiente') {
      location.assign('/academia/sala/opinion')
      return
    }
    taller = e.taller!
    entrar()
    pc?.vigente(e.codigoPC ?? null)
    pintarEjemplo(e.ejemplo ?? null)
    const id = e.interaccion?.id ?? (e.practica ? 'practica' : e.guia ? `guia:${e.escena}:${e.guia.paso}` : `escena:${e.escena}`)
    if (id === abierta) return
    abierta = id
    kicker.textContent = e.kicker ?? ''
    decir('')
    if (e.interaccion) pintarPreguntas(e)
    else if (e.guia) pintarGuia(e.guia)
    else if (e.practica) pintarPractica(e.practica)
    else {
      // Sin nada que votar: la idea de la escena y, debajo, el ejemplo del área.
      titulo.textContent = e.escena || 'Mire la pantalla'
      sub.textContent = e.idea ?? ''
      if (e.idea) lista.replaceChildren()
      else espera('Mire la pantalla. Cuando haya una pregunta, aparece aquí.')
    }
    sub.classList.toggle('idea', !e.interaccion && !e.practica && !e.guia && !!e.idea)
  }

  refrescar()
  setInterval(refrescar, 2000)
}

/**
 * Aviso "Empezamos en 00:00" arriba de la sala, con la misma cuenta que el
 * proyector (llega en cada consulta del estado; ver comun.ts).
 */
function montarEspera(raiz: HTMLElement): { poner(r: AvisoRed | null | undefined): void } | null {
  const caja = raiz.querySelector<HTMLElement>('[data-sl-espera]')
  if (!caja) return null
  const reloj = caja.querySelector<HTMLElement>('[data-sl-espera-reloj]')!
  const kicker = caja.querySelector<HTMLElement>('[data-sl-espera-kicker]')!
  const barra = caja.querySelector<HTMLElement>('[data-sl-espera-barra]')!
  let aviso: Aviso | null = null
  let tic: ReturnType<typeof setInterval> | null = null
  const pintar = () => {
    if (!aviso) return
    const c = cuentaAviso(aviso)
    reloj.textContent = c.texto
    kicker.textContent = c.resta ? 'Empezamos en' : 'Empezamos ya'
    caja.classList.toggle('cero', !c.resta)
    barra.style.setProperty('--p', String(c.queda))
  }
  return {
    poner(r) {
      const a = avisoLocal(r, aviso)
      if (a === aviso) return
      aviso = a
      if (tic) clearInterval(tic)
      tic = null
      caja.hidden = !a
      if (!a) return
      pintar()
      tic = setInterval(pintar, 250)
    },
  }
}

/**
 * "Abrir en mi PC": pide el código de dos números y lo muestra grande, con
 * la dirección corta que se escribe en el PC (/pc) y cuánto le queda.
 */
function montarPC(raiz: HTMLElement): { vigente(actual: string | null): void } | null {
  const abrir = raiz.querySelector<HTMLButtonElement>('[data-sl-pc-abrir]')
  const caja = raiz.querySelector<HTMLElement>('[data-sl-pc]')
  if (!abrir || !caja) return null
  const codigo = caja.querySelector<HTMLElement>('[data-sl-pc-codigo]')!
  const vence = caja.querySelector<HTMLElement>('[data-sl-pc-vence]')!
  let reloj: ReturnType<typeof setInterval> | null = null

  const parar = () => {
    if (reloj) clearInterval(reloj)
    reloj = null
  }
  const cerrar = () => {
    parar()
    caja.hidden = true
    abrir.hidden = false
  }
  const pedir = async () => {
    abrir.disabled = true
    try {
      const r = (await enviar({ accion: 'codigo_pc' })) as { codigo: string; vence: string }
      codigo.textContent = r.codigo
      codigo.style.opacity = ''
      abrir.hidden = true
      caja.hidden = false
      parar()
      const fin = Date.parse(r.vence)
      const contar = () => {
        const s = Math.max(0, Math.round((fin - Date.now()) / 1000))
        if (s > 0) {
          vence.textContent = `Sirve una vez, por ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} minutos.`
          return
        }
        parar()
        codigo.style.opacity = '.3'
        vence.textContent = 'Este código venció.'
        abrir.textContent = 'Pedir otro código'
        abrir.hidden = false
      }
      contar()
      reloj = setInterval(contar, 1000)
    } catch (err) {
      vence.textContent = ''
      abrir.textContent = err instanceof Error ? err.message : 'No se pudo. Toque para intentar de nuevo.'
    } finally {
      abrir.disabled = false
    }
  }
  abrir.addEventListener('click', () => void pedir())
  caja.querySelector<HTMLButtonElement>('[data-sl-pc-cerrar]')!.addEventListener('click', cerrar)
  return {
    /** La sala avisa cada 2 s qué código sigue vigente: si el mostrado ya no, es que el PC lo usó. */
    vigente(actual: string | null) {
      if (caja.hidden || !reloj || actual === codigo.textContent) return
      parar()
      codigo.style.opacity = '.3'
      vence.textContent = 'Listo: su PC ya quedó abierto con este código.'
      abrir.textContent = 'Abrir en otro PC'
      abrir.hidden = false
    },
  }
}
