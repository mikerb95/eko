// Bucle del asistente del panel: habla con la API de Claude, ejecuta las
// herramientas de lectura y, cuando el modelo propone una escritura, SE PAUSA.
//
// Por qué un bucle propio y no el Tool Runner del SDK: el runner corre el
// agente de un tirón, y aquí una propuesta puede esperar el clic de una
// persona durante horas. Una función serverless no puede quedarse esperando,
// así que la conversación se guarda (estado `esperando_aprobacion`), la
// función termina, y `decidir()` la retoma en otra petición con el
// `tool_result` que falta.
//
// Reglas de la API que este bucle respeta:
//  - Historial solo por anexión: el `content` de cada respuesta se guarda tal
//    cual (bloques de thinking incluidos). Editar turnos previos invalida el
//    thinking.
//  - Nunca se ejecutan herramientas de un turno cortado (`max_tokens`,
//    `refusal`): su entrada puede estar truncada.
//  - Los tool_result vuelven en el orden de los tool_use del turno.
//
// Módulo sin BD ni red: todo lo externo llega por `Dependencias`, para poder
// probar cada rama con un modelo falso.
//
// Receta: skill panel-ia (generalizado del bucle del analista de
// codebymike, src/lib/analista/bucle.ts).

import type Anthropic from '@anthropic-ai/sdk'
import { costoUsd, sumarUso, USO_CERO, type Uso } from './costo.ts'

type Mensaje = Anthropic.Beta.BetaMessage
type MensajeParam = Anthropic.Beta.BetaMessageParam
type ResultadoParam = Anthropic.Beta.BetaToolResultBlockParam

export const MAX_ITERACIONES = 15

export type EstadoEjecucion = 'corriendo' | 'esperando_aprobacion' | 'terminada' | 'fallida'

export type Propuesta = {
  toolUseId: string
  herramienta: string
  /** Una línea para el historial y el sello de la tarjeta. */
  origen: string
  motivo: string
  /** Lo que la pantalla enseña para decidir (calculado por el servidor, nunca por el modelo). */
  vista?: unknown
  entrada: unknown
  /** Resultados ya calculados de las otras herramientas del mismo turno. */
  resultadosPrevios: ResultadoParam[]
  /** Orden de los tool_use del turno: los resultados vuelven en ese orden. */
  orden: string[]
}

export type Ejecucion = {
  id: string
  estado: EstadoEjecucion
  pregunta: string
  mensajes: MensajeParam[]
  propuesta: Propuesta | null
  respuesta: string | null
  error: string | null
  iteraciones: number
  uso: Uso
  costoUsd: number
}

export type EventoBucle =
  | { tipo: 'paso'; id: string; herramienta: string; entrada: Record<string, unknown> }
  | { tipo: 'dato'; herramienta: string; datos: unknown }
  | { tipo: 'texto'; texto: string }
  | { tipo: 'aprobacion'; origen: string; motivo: string; herramienta: string; vista?: unknown }
  | { tipo: 'decision'; origen: string; aprobado: boolean; herramienta: string }
  | { tipo: 'fin'; estado: EstadoEjecucion; iteraciones: number; costoUsd: number; error: string | null }

export type ResultadoHerramienta = { ok: true; datos: unknown } | { ok: false; error: string }

export type PropuestaPreparada = { ok: true; origen: string; motivo: string; vista?: unknown } | { ok: false; error: string }

export type Dependencias = {
  llamarModelo: (mensajes: MensajeParam[]) => Promise<Mensaje>
  /** Valida entrada Y permiso sin ejecutar. Devuelve el error o null. */
  validar: (nombre: string, entrada: unknown) => string | null
  /**
   * Ejecuta una lectura, o una escritura ya aprobada. `toolUseId` sirve de
   * clave de idempotencia para escrituras en sistemas externos.
   */
  ejecutar: (nombre: string, entrada: unknown, extra: { toolUseId: string }) => Promise<ResultadoHerramienta>
  guardar: (e: Ejecucion) => Promise<void>
  emitir: (e: EventoBucle) => void
  /** USD que quedan hoy (mínimo entre empresa y usuario). Si no se puede saber, debe lanzar. */
  presupuestoRestante: () => Promise<number>
  /** Herramientas que pausan el bucle: las escrituras que el rol puede proponer. */
  herramientasAprobacion: string[]
  /** Revisa una propuesta ya validada y arma lo que verá la persona. No escribe. */
  prepararPropuesta: (nombre: string, entrada: unknown) => Promise<PropuestaPreparada>
  /** Lo que recibe el modelo cuando la persona no aprueba (con o sin indicación). */
  rechazo: (comentario: string | null) => string
}

export function nuevaEjecucion(id: string, pregunta: string): Ejecucion {
  return {
    id,
    estado: 'corriendo',
    pregunta,
    mensajes: [{ role: 'user', content: pregunta }],
    propuesta: null,
    respuesta: null,
    error: null,
    iteraciones: 0,
    uso: USO_CERO,
    costoUsd: 0,
  }
}

const aResultado = (toolUseId: string, r: ResultadoHerramienta): ResultadoParam =>
  r.ok === true
    ? { type: 'tool_result', tool_use_id: toolUseId, content: JSON.stringify(r.datos) }
    : { type: 'tool_result', tool_use_id: toolUseId, content: r.error, is_error: true }

const enOrden = (orden: string[], resultados: ResultadoParam[]) =>
  orden.map((id) => resultados.find((r) => r.tool_use_id === id)).filter((r): r is ResultadoParam => !!r)

async function terminar(e: Ejecucion, deps: Dependencias, estado: EstadoEjecucion, error: string | null) {
  e.estado = estado
  e.error = error
  e.propuesta = null
  await deps.guardar(e)
  deps.emitir({ tipo: 'fin', estado, iteraciones: e.iteraciones, costoUsd: e.costoUsd, error })
  return e
}

/** Hace avanzar una ejecución `corriendo` hasta que termina, falla o se pausa. Nunca lanza. */
export async function avanzar(e: Ejecucion, deps: Dependencias): Promise<Ejecucion> {
  while (true) {
    if (e.iteraciones >= MAX_ITERACIONES) {
      return terminar(e, deps, 'fallida', `Se superó el máximo de ${MAX_ITERACIONES} pasos.`)
    }
    let restante: number
    try {
      restante = await deps.presupuestoRestante()
    } catch {
      return terminar(e, deps, 'fallida', 'No se pudo comprobar el gasto del día; por seguridad no se sigue gastando.')
    }
    if (restante <= 0) return terminar(e, deps, 'fallida', 'Se alcanzó el tope de gasto diario.')

    let msg: Mensaje
    try {
      msg = await deps.llamarModelo(e.mensajes)
    } catch (err) {
      return terminar(e, deps, 'fallida', `La API de Claude falló: ${err instanceof Error ? err.message : String(err)}`)
    }
    e.iteraciones++
    e.uso = sumarUso(e.uso, msg.usage)
    e.costoUsd = costoUsd(e.uso)
    e.mensajes.push({ role: 'assistant', content: msg.content as Anthropic.Beta.BetaContentBlockParam[] })

    const textos = msg.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text' && !!b.text.trim())
    for (const t of textos) deps.emitir({ tipo: 'texto', texto: t.text.trim() })

    switch (msg.stop_reason) {
      case 'end_turn':
      case 'stop_sequence':
        e.respuesta = textos.map((t) => t.text.trim()).join('\n\n') || null
        return terminar(e, deps, 'terminada', null)
      case 'pause_turn':
        await deps.guardar(e)
        continue
      case 'refusal':
        return terminar(e, deps, 'fallida', 'El modelo declinó continuar.')
      case 'max_tokens':
        return terminar(e, deps, 'fallida', 'La respuesta del modelo se cortó por longitud.')
      case 'tool_use':
        break
      default:
        return terminar(e, deps, 'fallida', `El modelo se detuvo de forma inesperada (${msg.stop_reason}).`)
    }

    const usos = msg.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')
    if (!usos.length) return terminar(e, deps, 'fallida', 'El modelo pidió herramientas sin nombrar ninguna.')

    const aprobacion = new Set(deps.herramientasAprobacion)
    const resultados: ResultadoParam[] = []
    let propuesta: Propuesta | null = null
    for (const uso of usos) {
      const invalida = deps.validar(uso.name, uso.input)
      if (invalida) {
        resultados.push(aResultado(uso.id, { ok: false, error: invalida }))
        continue
      }
      if (aprobacion.has(uso.name)) {
        if (propuesta) {
          resultados.push(aResultado(uso.id, { ok: false, error: 'Propón un cambio a la vez y espera la decisión.' }))
          continue
        }
        let preparada: PropuestaPreparada
        try {
          preparada = await deps.prepararPropuesta(uso.name, uso.input)
        } catch (err) {
          preparada = { ok: false, error: `No se pudo preparar la propuesta: ${err instanceof Error ? err.message : String(err)}` }
        }
        if (preparada.ok === false) {
          resultados.push(aResultado(uso.id, { ok: false, error: preparada.error }))
          continue
        }
        propuesta = {
          toolUseId: uso.id,
          herramienta: uso.name,
          origen: preparada.origen,
          motivo: preparada.motivo,
          ...(preparada.vista !== undefined ? { vista: preparada.vista } : {}),
          entrada: uso.input,
          resultadosPrevios: [],
          orden: usos.map((u) => u.id),
        }
        continue
      }
      deps.emitir({ tipo: 'paso', id: uso.id, herramienta: uso.name, entrada: (uso.input ?? {}) as Record<string, unknown> })
      const r = await deps.ejecutar(uso.name, uso.input, { toolUseId: uso.id })
      if (r.ok) deps.emitir({ tipo: 'dato', herramienta: uso.name, datos: r.datos })
      resultados.push(aResultado(uso.id, r))
    }

    if (propuesta) {
      propuesta.resultadosPrevios = resultados
      e.propuesta = propuesta
      e.estado = 'esperando_aprobacion'
      await deps.guardar(e)
      deps.emitir({
        tipo: 'aprobacion',
        origen: propuesta.origen,
        motivo: propuesta.motivo,
        herramienta: propuesta.herramienta,
        ...(propuesta.vista !== undefined ? { vista: propuesta.vista } : {}),
      })
      return e
    }

    e.mensajes.push({ role: 'user', content: enOrden(usos.map((u) => u.id), resultados) })
    await deps.guardar(e)
  }
}

/**
 * Aplica la decisión sobre la propuesta pendiente y retoma. Quien llama debe
 * haber reclamado la conversación de forma atómica, para que dos clics no la
 * decidan dos veces, y haber comprobado el rol ACTUAL de quien decide.
 * `comentario` = la persona escribió otra cosa con la tarjeta abierta.
 */
export async function decidir(
  e: Ejecucion,
  aprobado: boolean,
  deps: Dependencias,
  comentario: string | null = null
): Promise<Ejecucion> {
  const p = e.propuesta
  if (!p) throw new Error('La conversación no tiene ninguna propuesta pendiente.')

  let resultado: ResultadoParam
  if (aprobado) {
    const r = await deps.ejecutar(p.herramienta, p.entrada, { toolUseId: p.toolUseId })
    if (r.ok) deps.emitir({ tipo: 'dato', herramienta: p.herramienta, datos: r.datos })
    resultado = aResultado(p.toolUseId, r)
  } else {
    resultado = aResultado(p.toolUseId, { ok: false, error: deps.rechazo(comentario) })
  }
  deps.emitir({ tipo: 'decision', origen: p.origen, aprobado, herramienta: p.herramienta })

  e.mensajes.push({ role: 'user', content: enOrden(p.orden, [...p.resultadosPrevios, resultado]) })
  e.propuesta = null
  e.estado = 'corriendo'
  await deps.guardar(e)
  return avanzar(e, deps)
}
