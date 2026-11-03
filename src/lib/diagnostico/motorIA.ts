// Motor del asistente de la encuesta: llama a Claude con salida estructurada y
// lleva su propio tope de gasto diario. Solo servidor.
//
// Haiku con esfuerzo bajo, igual que el asesor del sitio: reescribir un
// párrafo y pensar dos preguntas no necesita más, y la encuesta la llena todo
// el equipo el mismo día. El tope (DIAGNOSTICO_IA_TOPE_DIARIO_USD, 2 USD por
// defecto) va en una fila aparte para no gastarse el del asesor público.

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { asegurarEsquema, cliente } from '../db'
import { costoUsd, MODELO, sumarUso, USO_CERO } from '../asesor/costo'
import { crearTopeDiario, topeDesde } from '../asesor/presupuesto'
import { EsquemaSalida, mensajeIA, MAX_VUELTAS, pulirSalida, SYSTEM_IA, type EntradaIA, type SalidaIA } from './ia'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (process.env as any)?.[key] || ''
}

const tope = crearTopeDiario({
  clave: 'diagnostico_ia_gasto',
  db: async () => {
    await asegurarEsquema()
    return cliente()
  },
  topeUsd: () => {
    const v = env('DIAGNOSTICO_IA_TOPE_DIARIO_USD')
    return v ? topeDesde(v) : 2
  },
})

export class IANoDisponible extends Error {}

// Modelo simulado para las pruebas en navegador (playwright.config.ts): misma
// variable que el asistente del panel y nunca en Vercel.
const simulado = () => env('ASISTENTE_MODELO_FALSO') === '1' && !env('VERCEL') && !env('VERCEL_ENV')

function respuestaSimulada(e: EntradaIA): SalidaIA {
  const extra = e.aclaraciones.map((a) => a.respuesta).join('. ')
  return pulirSalida(
    {
      propuesta: [e.borrador.replace(/\.$/, ''), extra].filter(Boolean).join('. ') + '.',
      preguntas: e.aclaraciones.length ? [] : ['¿Cuántas páginas tiene un documento típico?'],
      nota: 'Le pregunto un dato que ayuda a medir el tiempo.',
    },
    1,
  )
}

/** ¿Se puede ofrecer el asistente? Falla cerrado: si la base no contesta, no. */
export async function iaDisponible(): Promise<boolean> {
  if (simulado()) return true
  if (!env('ANTHROPIC_API_KEY')) return false
  try {
    return (await tope.presupuestoRestante()) > 0
  } catch {
    return false
  }
}

export async function ayudarConRespuesta(e: EntradaIA): Promise<SalidaIA> {
  if (simulado()) return respuestaSimulada(e)
  const clave = env('ANTHROPIC_API_KEY')
  if (!clave || !(await iaDisponible())) throw new IANoDisponible()

  const api = new Anthropic({ apiKey: clave, maxRetries: 1, timeout: 25_000 })
  const r = await api.messages.parse({
    model: MODELO,
    max_tokens: 1500,
    output_config: { effort: 'low', format: zodOutputFormat(EsquemaSalida) },
    system: [{ type: 'text', text: SYSTEM_IA, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: mensajeIA(e) }],
  })

  await tope.sumarGasto(costoUsd(sumarUso(USO_CERO, r.usage))).catch((err) => {
    console.error('[diagnostico-ia/gasto]', err instanceof Error ? err.message : err)
  })

  if (r.stop_reason === 'refusal' || !r.parsed_output) throw new Error(`sin salida (${r.stop_reason})`)
  const vuelta = 1 + Math.ceil(e.aclaraciones.length / 2)
  return pulirSalida(r.parsed_output, Math.min(vuelta, MAX_VUELTAS))
}
