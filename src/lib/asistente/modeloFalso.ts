// Modelo SIMULADO del asistente, para desarrollo y para las pruebas de
// Playwright: recorre el flujo completo (consulta, tarjeta, aprobación) sin
// llamar a la API ni gastar. Lo activa ASISTENTE_MODELO_FALSO=1 y el motor lo
// ignora en producción (motor.ts, `usarModeloFalso`).
//
// Guion:
//  - "orden 12 a programada" → propone actualizar_recoleccion.
//  - "contacto 3 atendido"   → propone actualizar_contacto.
//  - cualquier otra pregunta → consulta recolecciones y resume.
//
// Módulo PURO.

import type Anthropic from '@anthropic-ai/sdk'

type Mensaje = Anthropic.Beta.BetaMessage
type Param = Anthropic.Beta.BetaMessageParam

let contador = 0
const USO = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }

function mensaje(content: unknown[], stop: 'end_turn' | 'tool_use'): Mensaje {
  return { id: `falso_${++contador}`, type: 'message', role: 'assistant', model: 'falso', content, stop_reason: stop, stop_sequence: null, usage: USO } as unknown as Mensaje
}
const texto = (t: string) => mensaje([{ type: 'text', text: t, citations: null }], 'end_turn')
const usar = (name: string, input: unknown, antes?: string) =>
  mensaje([...(antes ? [{ type: 'text', text: antes, citations: null }] : []), { type: 'tool_use', id: `toolu_falso_${++contador}`, name, input }], 'tool_use')

export function responderFalso(mensajes: readonly Param[], herramientas: readonly string[]): Mensaje {
  const ultimo = mensajes.at(-1)
  if (!ultimo) return texto('No recibí ninguna pregunta.')

  const bloques = typeof ultimo.content === 'string' ? [] : (ultimo.content as any[])
  const resultados = bloques.filter((b) => b.type === 'tool_result')
  if (resultados.length) {
    const r = resultados.at(-1)
    const contenido = typeof r.content === 'string' ? r.content : JSON.stringify(r.content)
    if (r.is_error) return texto(`(Simulado) No se hizo el cambio: ${contenido}`)
    try {
      const d = JSON.parse(contenido)
      if (d?.hecho) return texto(`(Simulado) Listo: ${d.resumen}. [Ver en el panel](${d.enlace})`)
      if (Array.isArray(d?.ordenes)) return texto(`(Simulado) Hay ${d.total} órdenes; ${d.porEstado?.solicitada ?? 0} están solicitadas.`)
    } catch {
      // resultado sin JSON: se resume genérico
    }
    return texto('(Simulado) Consulté la información.')
  }

  const pregunta = typeof ultimo.content === 'string' ? ultimo.content : String(bloques.find((b) => b.type === 'text')?.text ?? '')
  const orden = /orden\s+#?(\d+)\s+a\s+([a-z_]+)/i.exec(pregunta)
  if (orden && herramientas.includes('actualizar_recoleccion')) {
    return usar('actualizar_recoleccion', { recoleccionId: Number(orden[1]), estado: orden[2]!.toLowerCase() }, 'Le preparo el cambio.')
  }
  if (orden) return texto('(Simulado) Con su rol no puedo proponer ese cambio; lo hace alguien de operaciones o logística.')
  const contacto = /contacto\s+#?(\d+)\s+atendido/i.exec(pregunta)
  if (contacto && herramientas.includes('actualizar_contacto')) {
    return usar('actualizar_contacto', { contactoIds: [Number(contacto[1])], estado: 'atendido' })
  }
  return usar('recolecciones', {})
}
