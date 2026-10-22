// Motor del asesor público: conecta el bucle (bucle.ts) con la API de Claude y
// el tope diario. Solo servidor.
//
// Haiku y con esfuerzo bajo: respuestas cortas a dudas comerciales, sin
// cifras que calcular, no necesitan más, y un endpoint público conviene que
// cueste lo mínimo por pregunta.
//
// Sin transmisión en vivo: la guardia de cifras revisa la respuesta COMPLETA
// antes de mostrarla, así que transmitirla palabra a palabra enseñaría justo
// lo que la guardia podría rechazar.

import Anthropic from '@anthropic-ai/sdk'
import { asegurarEsquema, cliente } from '../db'
import { atender, type Entrada, type Respuesta } from './bucle'
import { costoUsd, MODELO } from './costo'
import { definiciones } from './herramientas'
import { crearTopeDiario, topeDesde } from './presupuesto'
import { systemPrompt } from './prompt'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (process.env as any)?.[key] || ''
}

const tope = crearTopeDiario({
  db: async () => {
    await asegurarEsquema()
    return cliente()
  },
  topeUsd: () => topeDesde(env('ASESOR_TOPE_DIARIO_USD')),
})

export class AsesorNoDisponible extends Error {
  constructor(motivo: 'sin_clave' | 'sin_presupuesto') {
    super(motivo)
    this.name = 'AsesorNoDisponible'
  }
}

/** ¿Puede responder ahora? Falla cerrado: si la base no contesta, no. */
export async function disponible(): Promise<boolean> {
  if (!env('ANTHROPIC_API_KEY')) return false
  try {
    return (await tope.presupuestoRestante()) > 0
  } catch {
    return false
  }
}

export async function responder(e: Entrada): Promise<Respuesta> {
  const clave = env('ANTHROPIC_API_KEY')
  if (!clave) throw new AsesorNoDisponible('sin_clave')
  let restante = 0
  try {
    restante = await tope.presupuestoRestante()
  } catch (err) {
    console.error('[asesor/tope]', err instanceof Error ? err.message : err)
    restante = 0
  }
  if (restante <= 0) throw new AsesorNoDisponible('sin_presupuesto')

  // Dos reintentos del SDK por defecto multiplicarían la espera de alguien que
  // está mirando el chat; uno basta, y con 25 s de tope por llamada.
  const api = new Anthropic({ apiKey: clave, maxRetries: 1, timeout: 25_000 })
  const tools: Anthropic.Tool[] = definiciones().map((d, i, todas) => ({
    ...d,
    ...(i === todas.length - 1 ? { cache_control: { type: 'ephemeral' as const } } : {}),
  }))
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: systemPrompt(e.locale, e.pagina), cache_control: { type: 'ephemeral' } },
  ]

  const r = await atender(e, {
    llamarModelo: (messages) =>
      api.messages.create({
        model: MODELO,
        // Respuestas de 2 a 5 frases más el razonamiento, que en esfuerzo
        // bajo es corto. El techo evita que una respuesta desbocada cueste
        // diez veces lo normal.
        max_tokens: 1500,
        output_config: { effort: 'low' },
        system,
        tools,
        messages,
      }),
  })

  // Si anotar el gasto falla, la respuesta ya está pagada: se entrega igual.
  await tope.sumarGasto(costoUsd(r.uso)).catch((err) => {
    console.error('[asesor/gasto]', err instanceof Error ? err.message : err)
  })
  return r
}
