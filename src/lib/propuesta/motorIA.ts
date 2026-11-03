// Motor del chat de la propuesta: llama a Claude con salida estructurada, pasa
// la guardia de cifras y lleva su propio tope de gasto diario. Solo servidor.
//
// Haiku con esfuerzo bajo, como los demás asistentes del sitio: los totales ya
// van calculados en el prompt, así que no hay cuentas que hacer, y el prompt
// (la propuesta completa) va en caché. El tope (PROPUESTA_IA_TOPE_DIARIO_USD,
// 2 USD por defecto) va en su propia fila para no gastarse el del asesor.

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { asegurarEsquema, cliente } from '../db'
import { costoUsd, MODELO, sumarUso, USO_CERO, type Uso } from '../asesor/costo'
import { crearTopeDiario, topeDesde } from '../asesor/presupuesto'
import { EsquemaSalida, mensajesApi, pulirSalida, salidaRespaldo, systemPrompt, type EntradaChat, type SalidaChat } from './ia'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (process.env as any)?.[key] || ''
}

const tope = crearTopeDiario({
  clave: 'propuesta_ia_gasto',
  db: async () => {
    await asegurarEsquema()
    return cliente()
  },
  topeUsd: () => {
    const v = env('PROPUESTA_IA_TOPE_DIARIO_USD')
    return v ? topeDesde(v) : 2
  },
})

export class ChatNoDisponible extends Error {}

// Modelo simulado para pruebas en navegador: misma variable que los demás
// asistentes y nunca en Vercel.
const simulado = () => env('ASISTENTE_MODELO_FALSO') === '1' && !env('VERCEL') && !env('VERCEL_ENV')

function respuestaSimulada(e: EntradaChat): SalidaChat {
  const p = e.mensajes.at(-1)!.texto.toLowerCase()
  if (/descuento|rebaja|negoci/.test(p)) {
    return { respuesta: 'Eso no está en la propuesta, así que se lo paso a Mike para que él le responda.', pasarAMike: true, motivo: 'Pide un descuento.', seccion: null }
  }
  return { respuesta: 'El plan de hasta 20 propuestas cuesta $1.185.000 al mes en los meses 1 a 18 y $785.000 desde el mes 19.', pasarAMike: false, motivo: '', seccion: 'inversion' }
}

let systemCache = ''
const system = () => (systemCache ||= systemPrompt())

/** ¿Se puede ofrecer el chat? Falla cerrado: si la base no contesta, no. */
export async function chatDisponible(): Promise<boolean> {
  if (simulado()) return true
  if (!env('ANTHROPIC_API_KEY')) return false
  try {
    return (await tope.presupuestoRestante()) > 0
  } catch {
    return false
  }
}

export async function responderPregunta(e: EntradaChat): Promise<SalidaChat & { costoUsd: number }> {
  if (simulado()) return { ...respuestaSimulada(e), costoUsd: 0 }
  const clave = env('ANTHROPIC_API_KEY')
  if (!clave || !(await chatDisponible())) throw new ChatNoDisponible()

  const api = new Anthropic({ apiKey: clave, maxRetries: 1, timeout: 25_000 })
  const messages: Anthropic.MessageParam[] = mensajesApi(e)
  let uso: Uso = USO_CERO
  let salida: SalidaChat | null = null

  // Dos intentos: si la primera respuesta trae una cifra que no está en la
  // propuesta, se le muestra cuál y se le pide de nuevo.
  for (let intento = 0; intento < 2 && !salida; intento++) {
    const r = await api.messages.parse({
      model: MODELO,
      max_tokens: 1500,
      output_config: { effort: 'low', format: zodOutputFormat(EsquemaSalida) },
      system: [{ type: 'text', text: system(), cache_control: { type: 'ephemeral' } }],
      messages,
    })
    uso = sumarUso(uso, r.usage)
    if (r.stop_reason === 'refusal' || !r.parsed_output) break
    const pulida = pulirSalida(r.parsed_output)
    if (pulida.ok) {
      salida = pulida.salida
      break
    }
    messages.push(
      { role: 'assistant', content: JSON.stringify(r.parsed_output) },
      {
        role: 'user',
        content: `[Revisión automática, no la escribió el gerente] Tu respuesta trae cifras que no están en la propuesta: ${pulida.inventadas.join(', ')}. Responde de nuevo usando solo cifras de la propuesta o de los totales ya calculados; si la cuenta no está, pásale la pregunta a Mike.`,
      },
    )
  }

  const costo = costoUsd(uso)
  await tope.sumarGasto(costo).catch((err) => {
    console.error('[propuesta-ia/gasto]', err instanceof Error ? err.message : err)
  })
  return { ...(salida ?? salidaRespaldo(e.mensajes.at(-1)!.texto)), costoUsd: costo }
}
