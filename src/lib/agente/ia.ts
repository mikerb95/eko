/**
 * La única llamada a la IA del agente: leer un acto y devolver la extracción.
 *
 * ── DECISIONES ──────────────────────────────────────────────────────────────
 * - **Sin clave, no-op.** Igual que la bandeja de Zoho: si falta
 *   `ANTHROPIC_API_KEY`, el acto se guarda como `sin_clave` y se procesa el día
 *   que aparezca la clave. Nada se pierde.
 * - **Modelo configurable.** `AGENTE_MODELO` permite cambiar de modelo sin
 *   tocar código si cambian los precios o sale uno mejor. Por defecto Sonnet
 *   5.5 con esfuerzo medio: leer un auto no requiere el razonamiento más caro.
 * - **Salida estructurada.** `output_config.format` con el esquema de
 *   `extraccion.ts`: la respuesta llega siempre como JSON con esos campos.
 * - **Respaldo ante rechazos.** `fallbacks: "default"` reintenta en el servidor
 *   con otro modelo si los filtros de seguridad rechazan un documento por error
 *   (un auto sancionatorio puede sonar alarmante). Si aun así se rechaza, el
 *   acto queda en error con el motivo, sin inventar nada.
 * ────────────────────────────────────────────────────────────────────────────
 */
import Anthropic from '@anthropic-ai/sdk'
import { ESQUEMA_EXTRACCION, INSTRUCCIONES, normalizarExtraccion, type Extraccion } from './extraccion'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (process.env as any)?.[key] || ''
}

export const MODELO_POR_DEFECTO = 'claude-sonnet-5-5'

export function iaConfigurada(): boolean {
  return !!env('ANTHROPIC_API_KEY')
}

export function modeloAgente(): string {
  return env('AGENTE_MODELO') || MODELO_POR_DEFECTO
}

export interface Documento {
  /** Contenido en base64 (PDF o imagen) o texto plano. */
  datos: string
  tipo: 'application/pdf' | 'image/png' | 'image/jpeg' | 'text/plain'
}

export interface ResultadoIA {
  extraccion: Extraccion
  modelo: string
  tokensEntrada: number
  tokensSalida: number
}

export class ErrorIA extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ErrorIA'
  }
}

let _cliente: Anthropic | null = null
function clienteIA(): Anthropic {
  if (!_cliente) _cliente = new Anthropic({ apiKey: env('ANTHROPIC_API_KEY') })
  return _cliente
}

function bloqueDocumento(doc: Documento): Anthropic.Beta.BetaContentBlockParam {
  if (doc.tipo === 'application/pdf') {
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc.datos } }
  }
  if (doc.tipo === 'image/png' || doc.tipo === 'image/jpeg') {
    return { type: 'image', source: { type: 'base64', media_type: doc.tipo, data: doc.datos } }
  }
  return { type: 'text', text: `<documento>\n${doc.datos}\n</documento>` }
}

export async function extraerActo(doc: Documento, contexto: { fechaNotificacion?: string } = {}): Promise<ResultadoIA> {
  if (!iaConfigurada()) throw new ErrorIA('Falta ANTHROPIC_API_KEY')
  const modelo = modeloAgente()

  const pedido = [
    'Extrae la información de este acto administrativo.',
    contexto.fechaNotificacion ? `Fue notificado el ${contexto.fechaNotificacion}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const respuesta = await clienteIA().beta.messages.create({
    model: modelo,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: INSTRUCCIONES,
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: ESQUEMA_EXTRACCION as unknown as Record<string, unknown> },
    },
    messages: [{ role: 'user', content: [bloqueDocumento(doc), { type: 'text', text: pedido }] }],
  })

  if (respuesta.stop_reason === 'refusal') {
    const categoria = (respuesta as any).stop_details?.category
    throw new ErrorIA(`La IA no procesó el documento${categoria ? ` (${categoria})` : ''}.`)
  }
  if (respuesta.stop_reason === 'max_tokens') {
    throw new ErrorIA('La respuesta de la IA quedó incompleta.')
  }

  const texto = respuesta.content.find((b) => b.type === 'text')
  if (!texto || texto.type !== 'text') throw new ErrorIA('La IA no devolvió datos.')

  let crudo: unknown
  try {
    crudo = JSON.parse(texto.text)
  } catch {
    throw new ErrorIA('La IA devolvió datos con formato inválido.')
  }

  return {
    extraccion: normalizarExtraccion(crudo),
    modelo: respuesta.model || modelo,
    tokensEntrada:
      (respuesta.usage.input_tokens ?? 0) +
      (respuesta.usage.cache_read_input_tokens ?? 0) +
      (respuesta.usage.cache_creation_input_tokens ?? 0),
    tokensSalida: respuesta.usage.output_tokens ?? 0,
  }
}
