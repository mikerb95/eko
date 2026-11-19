// Demo en vivo con Claude durante las capacitaciones (/academia/taller/<n>).
// Solo servidor.
//
// La instrucción NO viene del navegador: el navegador dice qué demo y qué
// versión, y el texto sale del contenido de la capacitación. Así nadie puede
// usar esta ruta para mandarle otra cosa al modelo. Si la IA no está
// disponible (sin clave, tope agotado, error o demora), se devuelve la
// respuesta guardada de esa misma versión, marcada como tal.
//
// Haiku con esfuerzo bajo, como el resto de la academia. Tope propio
// (TALLER_IA_TOPE_DIARIO_USD, 2 USD por defecto) en una fila aparte de ajustes.

import Anthropic from '@anthropic-ai/sdk'
import { asegurarEsquema, cliente } from '../db'
import { costoUsd, MODELO, sumarUso, USO_CERO } from '../asesor/costo'
import { crearTopeDiario, topeDesde } from '../asesor/presupuesto'
import type { Taller } from './tipos'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (process.env as any)?.[key] || ''
}

const tope = crearTopeDiario({
  clave: 'taller_ia_gasto',
  db: async () => {
    await asegurarEsquema()
    return cliente()
  },
  topeUsd: () => {
    const v = env('TALLER_IA_TOPE_DIARIO_USD')
    return v ? topeDesde(v) : 2
  },
})

const simulado = () => env('ASISTENTE_MODELO_FALSO') === '1' && !env('VERCEL') && !env('VERCEL_ENV')

// Neutro a propósito: la demo muestra cómo cambia la respuesta según la
// instrucción, así que el sistema no debe "arreglar" las instrucciones malas.
const SYSTEM = 'Eres un asistente. Responde en español, de forma clara. Usa tablas en markdown cuando te pidan una tabla.'

export interface RespuestaDemo {
  texto: string
  fuente: 'vivo' | 'guardada'
}

export function versionDe(t: Taller, demo: unknown, version: unknown) {
  const d = t.demos.find((x) => x.id === demo)
  return d?.versiones.find((v) => v.id === version) ?? null
}

export async function preguntarDemo(t: Taller, demo: unknown, version: unknown): Promise<RespuestaDemo | null> {
  const v = versionDe(t, demo, version)
  if (!v) return null
  const guardada: RespuestaDemo = { texto: v.respaldo, fuente: 'guardada' }
  if (simulado()) return guardada
  const clave = env('ANTHROPIC_API_KEY')
  if (!clave) return guardada
  try {
    if ((await tope.presupuestoRestante()) <= 0) return guardada
    const api = new Anthropic({ apiKey: clave, maxRetries: 0, timeout: 25_000 })
    const r = await api.messages.create({
      model: MODELO,
      max_tokens: 1200,
      output_config: { effort: 'low' },
      system: SYSTEM,
      messages: [{ role: 'user', content: v.instruccion }],
    })
    await tope.sumarGasto(costoUsd(sumarUso(USO_CERO, r.usage))).catch((err) => {
      console.error('[taller-ia/gasto]', err instanceof Error ? err.message : err)
    })
    const texto = r.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()
    return texto ? { texto, fuente: 'vivo' } : guardada
  } catch (err) {
    console.error('[taller-ia]', err instanceof Error ? err.message : err)
    return guardada
  }
}
