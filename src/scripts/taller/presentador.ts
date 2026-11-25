/**
 * Vista de presentador. Lleva su propia copia de la posición (escena y paso),
 * la manda al proyector por BroadcastChannel y al servidor (para abrir la
 * pregunta en los celulares), y la actualiza cuando el proyector avanza. Si
 * el proyector está en otro equipo, se siguen por el servidor (seguirRed).
 */
import { inicioDeEscenas, reloj } from '../../lib/talleres/reglas'
import { avisoLocal, canal, idOrden, mantenerDespierto, seguirRed, sondear, consultar, cuentaAviso, direccionTecla, enviar, leerDatos, type Aviso, type AvisoRed, type Mensaje } from './comun'

interface EscenaPr {
  id: string
  tipo: string
  kicker: string
  titulo: string
  notas: string[]
  siPreguntan: { p: string; r: string }[]
  tecnico: { termino?: string; texto: string }[]
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
  areas: { id: string; etiqueta: string }[]
  escenas: EscenaPr[]
  retos: { id: string; concepto: string }[]
  minutosTurno: number
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
      red.local()
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
    $('[data-tecnico]').hidden = !e.tecnico.length
    $('[data-tecnico-lista]').replaceChildren(
      ...e.tecnico.map(({ termino, texto }) => {
        const li = document.createElement('li')
        if (termino) {
          const b = document.createElement('b')
          b.textContent = `${termino}:`
          li.append(b, ' ')
        }
        li.append(texto)
        return li
      }),
    )
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
    $('[data-correr]').hidden = e.tipo !== 'carrera'
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

  // Escena y paso se guardan en el servidor (los siguen los celulares y los PC
  // vinculados). Con clics seguidos solo sale el último.
  let guardarPend: ReturnType<typeof setTimeout> | null = null
  const guardar = (k: number, p: number) => {
    if (guardarPend) clearTimeout(guardarPend)
    guardarPend = setTimeout(() => {
      enviar<{ mov?: number }>({ accion: 'estado', taller: d.n, escena: d.escenas[k]!.id, paso: p })
        .then((r) => red.guardado(r.mov))
        .catch((e) => console.error('[presentador] estado', e))
    }, 250)
  }

  // Proyector en otro equipo: su avance llega por el servidor.
  const red = seguirRed(d.n, {
    ids: d.escenas.map((e) => e.id),
    alMover: (k, p) => {
      if (k === i && p === paso) return
      if (k !== i) llegada = Date.now()
      i = k
      paso = p
      pintar()
    },
  })

  const ir = (k: number, p: number) => {
    k = Math.max(0, Math.min(d.escenas.length - 1, k))
    p = Math.max(0, Math.min(d.escenas[k]!.pasos, p))
    if (k !== i) llegada = Date.now()
    if (k !== i || p !== paso) {
      red.local()
      guardar(k, p)
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
  // Botones para el proyector: por el canal (mismo equipo) y por el servidor
  // (otro equipo). El id evita que el proyector lo atienda dos veces.
  const ordenar = (nombre: 'pedir' | 'generar' | 'correr') => {
    const id = idOrden()
    avisar({ tipo: 'accion', nombre, id })
    enviar({ accion: 'orden', taller: d.n, nombre, id }).catch((e) => console.error('[presentador] orden', e))
  }
  $('[data-pedir]').addEventListener('click', () => ordenar('pedir'))
  $('[data-generar]').addEventListener('click', () => ordenar('generar'))
  $('[data-correr]').addEventListener('click', () => ordenar('correr'))
  montarTurnos(d)
  $('[data-iniciar]').addEventListener('click', () => {
    inicio = Date.now()
    try {
      sessionStorage.setItem(CLAVE, String(inicio))
    } catch {}
    $('[data-iniciar]').textContent = 'Reiniciar cronómetro'
  })
  if (inicio) $('[data-iniciar]').textContent = 'Reiniciar cronómetro'

  // Modo claro/oscuro: el tema inicial lo pone el script del <head>; aquí solo se cambia y se recuerda.
  const temaBtn = $('[data-tema-btn]')
  const pintarTema = () => {
    const oscuro = document.documentElement.dataset.tema === 'oscuro'
    temaBtn.textContent = oscuro ? 'Modo claro' : 'Modo oscuro'
    temaBtn.setAttribute('aria-pressed', String(oscuro))
  }
  temaBtn.addEventListener('click', () => {
    const t = document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro'
    document.documentElement.dataset.tema = t
    try {
      localStorage.setItem('pr-tema', t)
    } catch {}
    pintarTema()
  })
  pintarTema()
  addEventListener('keydown', (ev) => {
    const dir = direccionTecla(ev)
    if (dir) {
      ev.preventDefault()
      avanzar(dir)
    }
  })

  // Aviso de inicio: "Empezamos en 00:00" en el proyector, los PC vinculados y
  // los celulares. Se guarda en el servidor; volver a mostrarlo con otros
  // minutos reinicia la cuenta. El panel (cada 5 s) lo trae si lo cambió otro equipo.
  let aviso: Aviso | null = null
  let avisoOcupado = false
  // Sube con cada cambio propio: una respuesta del panel pedida antes no lo pisa.
  let avisoVersion = 0
  const pintarAviso = () => {
    const resta = $('[data-espera-resta]')
    $('[data-espera-quitar]').hidden = !aviso
    $('[data-espera-mostrar]').textContent = aviso ? 'Cambiar' : 'Mostrar'
    $('[data-espera]').classList.toggle('on', !!aviso)
    if (!aviso) return void (resta.textContent = 'apagado')
    const c = cuentaAviso(aviso)
    resta.textContent = c.resta ? reloj(c.resta) : 'en cero'
  }
  const ponerAviso = async (minutos: number | null) => {
    if (avisoOcupado) return
    avisoOcupado = true
    avisoVersion++
    const botones = [$<HTMLButtonElement>('[data-espera-mostrar]'), $<HTMLButtonElement>('[data-espera-quitar]')]
    botones.forEach((b) => (b.disabled = true))
    $('[data-espera-error]').hidden = true
    try {
      const r = await enviar<{ aviso: AvisoRed | null }>({ accion: 'aviso', taller: d.n, minutos })
      aviso = avisoLocal(r.aviso, null)
    } catch (err) {
      console.error('[presentador] aviso', err)
      const e = $('[data-espera-error]')
      e.textContent = err instanceof Error ? err.message : 'No se pudo guardar el aviso.'
      e.hidden = false
    } finally {
      avisoOcupado = false
      botones.forEach((b) => (b.disabled = false))
      pintarAviso()
    }
  }
  $<HTMLFormElement>('[data-espera-form]').addEventListener('submit', (ev) => {
    ev.preventDefault()
    const min = Math.round(Number($<HTMLInputElement>('[data-espera-min]').value))
    if (min >= 1 && min <= 120) void ponerAviso(min)
  })
  $('[data-espera-quitar]').addEventListener('click', () => void ponerAviso(null))
  pintarAviso()
  setInterval(pintarAviso, 1000)

  // Corregir el área de una respuesta de la encuesta (/ia): alguien eligió la
  // que no era. Trae la lista al abrir la caja y guarda sin recargar la vista.
  {
    const API_DIAG = '/api/admin/diagnostico'
    const caja = $<HTMLDetailsElement>('[data-area]')
    const form = $<HTMLFormElement>('[data-area-form]')
    const selPersona = $<HTMLSelectElement>('[data-area-persona]')
    const selArea = $<HTMLSelectElement>('[data-area-nueva]')
    const guardar = $<HTMLButtonElement>('[data-area-guardar]')
    const estado = $('[data-area-estado]')
    const nombreArea = (id: string) => d.areas.find((a) => a.id === id)?.etiqueta ?? id
    let personas: { id: number; nombre: string; area: string }[] = []
    let cargando = false
    let ocupado = false

    const decir = (texto: string, tipo: 'ok' | 'error' | 'info') => {
      estado.textContent = texto
      estado.dataset.tipo = tipo
      estado.hidden = false
    }
    const actual = () => personas.find((p) => p.id === Number(selPersona.value))
    const repasar = () => {
      const p = actual()
      selArea.disabled = !p || ocupado
      guardar.disabled = !p || ocupado || selArea.value === p.area
      guardar.textContent = ocupado ? 'Guardando…' : 'Guardar'
    }
    const pintarPersonas = () => {
      const elegida = selPersona.value
      selPersona.replaceChildren(new Option(personas.length ? 'Elija a la persona' : 'Aún no hay respuestas', ''))
      for (const p of personas) selPersona.add(new Option(`${p.nombre} · ${nombreArea(p.area)}`, String(p.id)))
      selPersona.value = personas.some((p) => String(p.id) === elegida) ? elegida : ''
      selPersona.disabled = !personas.length
      repasar()
    }
    const cargar = async () => {
      if (cargando) return
      cargando = true
      try {
        const r = await consultar<{ respuestas: { id: number; nombre: string; area: string }[] }>({}, API_DIAG)
        personas = r.respuestas
          .map((x) => ({ id: x.id, nombre: x.nombre || 'Sin nombre', area: x.area }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
        pintarPersonas()
      } catch (err) {
        console.error('[presentador] respuestas', err)
        decir(err instanceof Error ? err.message : 'No se pudieron traer las respuestas.', 'error')
      } finally {
        cargando = false
      }
    }

    // Cada vez que se abre trae la lista fresca (pudo llegar una respuesta nueva).
    caja.addEventListener('toggle', () => {
      if (caja.open) void cargar()
    })
    selPersona.addEventListener('change', () => {
      const p = actual()
      if (p) selArea.value = p.area
      estado.hidden = true
      repasar()
    })
    selArea.addEventListener('change', () => {
      estado.hidden = true
      repasar()
    })
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault()
      const p = actual()
      if (!p || ocupado || selArea.value === p.area) return
      ocupado = true
      repasar()
      estado.hidden = true
      try {
        const r = await enviar<{ cambio: { antes: string; area: string; quitadas: string[] } }>(
          { accion: 'area', id: p.id, area: selArea.value },
          15_000,
          API_DIAG,
        )
        p.area = r.cambio.area
        let texto = `Listo: ${p.nombre} quedó en ${nombreArea(r.cambio.area)}.`
        const q = r.cambio.quitadas
        if (q.length) {
          texto += q.length === 1
            ? ` Se quitó la tarea marcada "${q[0]}", que es solo de ${nombreArea(r.cambio.antes)}.`
            : ` Se quitaron ${q.length} tareas marcadas que son solo de ${nombreArea(r.cambio.antes)}.`
        }
        decir(texto, 'ok')
      } catch (err) {
        console.error('[presentador] cambiar área', err)
        decir(err instanceof Error ? err.message : 'No se pudo guardar el cambio.', 'error')
      } finally {
        ocupado = false
        pintarPersonas()
      }
    })
  }

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

  // Preguntas que llegan del celular, cada una con una respuesta sugerida que
  // prepara la IA (se pide una sola vez por pregunta; el servidor la guarda).
  // Al marcarla como respondida sale de la lista.
  const respuestasIA = new Map<number, string>()
  const pidiendo = new Set<number>()
  const fallidas = new Set<number>()

  const pintarRespuesta = (caja: HTMLElement, id: number) => {
    const texto = respuestasIA.get(id)
    caja.classList.toggle('esperando', !texto && !fallidas.has(id))
    caja.querySelector('p')!.textContent = texto ?? (fallidas.has(id) ? 'No se pudo preparar la respuesta con IA. Respóndala con las notas de la escena.' : 'Preparando la respuesta…')
  }

  const pedirRespuesta = (id: number) => {
    if (respuestasIA.has(id) || pidiendo.has(id) || fallidas.has(id)) return
    pidiendo.add(id)
    enviar<{ texto: string }>({ accion: 'respuesta_ia', taller: d.n, id }, 40_000)
      .then((r) => (r.texto ? respuestasIA.set(id, r.texto) : fallidas.add(id)))
      .catch((err) => {
        console.error('[presentador] respuesta_ia', err)
        fallidas.add(id)
      })
      .finally(() => {
        pidiendo.delete(id)
        const caja = document.querySelector<HTMLElement>(`[data-ia-id="${id}"]`)
        if (caja) pintarRespuesta(caja, id)
      })
  }

  const pintarDudas = (ps: { id: number; texto: string; nombre: string; area: string; escena: string; respuesta: string }[]) => {
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
        if (p.respuesta) respuestasIA.set(p.id, p.respuesta)
        const ia = document.createElement('div')
        ia.className = 'pr-duda-ia'
        ia.dataset.iaId = String(p.id)
        const et = document.createElement('small')
        et.textContent = 'Respuesta sugerida por la IA'
        ia.append(et, document.createElement('p'))
        pintarRespuesta(ia, p.id)
        pedirRespuesta(p.id)
        li.append(tx, sp, ia, b)
        return li
      }),
    )
  }

  const panel = () => {
    const version = avisoVersion
    return consultar({ que: 'panel', n: d.n })
      .then((r) => {
        $('[data-sala]').textContent = String(r.sala)
        $('[data-asistentes]').textContent = String(r.asistentes)
        $('[data-lista]').replaceChildren(
          ...(r.lista as { nombre: string; correo: string; area: string; cuenta: boolean }[]).map((a) => {
            const li = document.createElement('li')
            const b = document.createElement('b')
            b.textContent = a.nombre
            const sp = document.createElement('span')
            sp.textContent = `${a.area} · ${a.correo}${a.cuenta ? ' · con cuenta en la academia' : ''}`
            li.append(b, sp)
            return li
          }),
        )
        pintarDudas(r.preguntas ?? [])
        if (!avisoOcupado && version === avisoVersion) {
          aviso = avisoLocal(r.aviso, aviso)
          pintarAviso()
        }
        sesionesHoy = r.sesiones
        avisos()
      })
      .catch(() => {})
  }
  panel()
  sondear(panel, 5000)

  pintar()
  avisar({ tipo: 'hola' })
  mantenerDespierto()
}

/**
 * Acompañamiento de la práctica (capacitación 2): la fila de turnos de 15
 * minutos. "Armar" suma a los registrados de hoy; cada fila tiene Empezar,
 * Subir y Al final; el turno en curso lleva su reloj y "Terminar y seguir"
 * llama al siguiente. Lo mismo lo ven el proyector y cada celular.
 */
interface TurnoPr {
  id: number
  nombre: string
  area: string
  caso: string
  estado: 'espera' | 'ahora' | 'hecho'
  lleva: number
  retos: string[]
}
function montarTurnos(d: DatosPr) {
  const caja = document.querySelector<HTMLElement>('[data-turnos]')
  if (!caja) return
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => caja.querySelector<T>(s)!
  const error = $('[data-turnos-error]')
  let turnos: TurnoPr[] = []
  let actual: { id: number; desde: number } | null = null
  let ocupado = false
  const decirError = (t: string) => {
    error.textContent = t
    error.hidden = !t
  }
  const reloj = () => {
    const b = $('[data-turno-reloj]')
    if (!actual) return
    const resta = d.minutosTurno * 60_000 - (Date.now() - actual.desde)
    const s = Math.floor(Math.abs(resta) / 1000)
    b.textContent = `${resta < 0 ? '+' : ''}${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
    b.classList.toggle('tarde', resta < 0)
  }
  setInterval(reloj, 1000)
  const pintar = () => {
    const enCurso = turnos.find((t) => t.estado === 'ahora')
    actual = enCurso ? { id: enCurso.id, desde: actual?.id === enCurso.id ? actual.desde : Date.now() - enCurso.lleva } : null
    $('[data-turno-ahora]').hidden = !enCurso
    if (enCurso) {
      $('[data-turno-nombre]').textContent = enCurso.nombre
      $('[data-turno-area]').textContent = enCurso.area
      $('[data-turno-caso]').textContent = enCurso.caso ? `Caso: ${enCurso.caso}` : 'Todavía no escribió su caso en el celular.'
      $('[data-turno-retos]').textContent = `${enCurso.retos.length} de ${d.retos.length} retos`
      reloj()
    }
    $('[data-turno-fila]').replaceChildren(
      ...turnos.map((t, k) => {
        const li = document.createElement('li')
        li.className = t.estado
        const n = document.createElement('span')
        n.className = 'n'
        n.textContent = String(k + 1)
        const q = document.createElement('div')
        q.className = 'q'
        const b = document.createElement('b')
        b.textContent = t.nombre
        const sm = document.createElement('small')
        sm.textContent = `${t.area} · ${t.retos.length}/${d.retos.length} retos${t.caso ? ` · ${t.caso}` : ''}`
        q.append(b, sm)
        const acc = document.createElement('div')
        acc.className = 'acc'
        const boton = (txt: string, op: string, clase = '') => {
          const x = document.createElement('button')
          x.type = 'button'
          x.textContent = txt
          if (clase) x.className = clase
          x.addEventListener('click', () => mover(t.id, op))
          return x
        }
        if (t.estado === 'espera') acc.append(boton('Empezar', 'empezar', 'ya'), boton('Subir', 'subir'), boton('Al final', 'final'))
        else if (t.estado === 'hecho') acc.append(boton('Volver a la fila', 'final'))
        li.append(n, q, acc)
        return li
      }),
    )
    $('[data-turnos-armar]').textContent = turnos.length ? 'Sumar a los que llegaron' : 'Armar la fila'
  }
  const cargar = () =>
    consultar<{ turnos: TurnoPr[] }>({ que: 'turnos', n: d.n })
      .then((r) => {
        if (ocupado) return
        turnos = r.turnos
        pintar()
      })
      .catch(() => {})
  const mover = async (id: number, op: string) => {
    if (ocupado) return
    ocupado = true
    decirError('')
    try {
      await enviar({ accion: 'turno', taller: d.n, id, op })
    } catch (e) {
      decirError(e instanceof Error ? e.message : 'No se pudo mover el turno.')
    } finally {
      ocupado = false
      await cargar()
    }
  }
  $('[data-turnos-armar]').addEventListener('click', async () => {
    decirError('')
    try {
      const r = await enviar<{ agregados: number }>({ accion: 'turnos', taller: d.n })
      if (!r.agregados && !turnos.length) decirError('Todavía no hay personas registradas hoy en la sala.')
    } catch (e) {
      decirError(e instanceof Error ? e.message : 'No se pudo armar la fila.')
    }
    await cargar()
  })
  const terminar = async (seguir: boolean) => {
    const enCurso = turnos.find((t) => t.estado === 'ahora')
    if (!enCurso) return
    const siguiente = turnos.find((t) => t.estado === 'espera')
    if (seguir && siguiente) await mover(siguiente.id, 'empezar')
    else await mover(enCurso.id, 'terminar')
  }
  $('[data-turno-seguir]').addEventListener('click', () => terminar(true))
  $('[data-turno-terminar]').addEventListener('click', () => terminar(false))
  cargar()
  sondear(cargar, 4000)
}
