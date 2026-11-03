// Motor del revisor de instrucciones de la academia: dos llamadas a Claude en
// paralelo (ejecutar y revisar) con su propio tope de gasto diario. Solo
// servidor.
//
// Haiku con esfuerzo bajo, igual que el asesor y la encuesta. El tope
// (ACADEMIA_IA_TOPE_DIARIO_USD, 3 USD por defecto) va en una fila aparte para
// no gastarse el del asesor público ni el de la encuesta.

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { asegurarEsquema, cliente } from '../db'
import { costoUsd, MODELO, sumarUso, USO_CERO } from '../asesor/costo'
import { crearTopeDiario, topeDesde } from '../asesor/presupuesto'
import {
  EsquemaRevision,
  mensajeRevisar,
  prepararInstruccion,
  pulirRespuesta,
  pulirRevision,
  SYSTEM_EJECUTAR,
  SYSTEM_REVISAR,
  type EntradaPractica,
  type Revision,
} from './practica'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (process.env as any)?.[key] || ''
}

const tope = crearTopeDiario({
  clave: 'academia_ia_gasto',
  db: async () => {
    await asegurarEsquema()
    return cliente()
  },
  topeUsd: () => {
    const v = env('ACADEMIA_IA_TOPE_DIARIO_USD')
    return v ? topeDesde(v) : 3
  },
})

export class PracticaNoDisponible extends Error {}

// Modelo simulado para las pruebas en navegador: misma variable que el
// asistente del panel y nunca en Vercel.
const simulado = () => env('ASISTENTE_MODELO_FALSO') === '1' && !env('VERCEL') && !env('VERCEL_ENV')

export async function practicaDisponible(): Promise<boolean> {
  if (simulado()) return true
  if (!env('ANTHROPIC_API_KEY')) return false
  try {
    return (await tope.presupuestoRestante()) > 0
  } catch {
    return false
  }
}

export interface ResultadoPractica {
  respuesta: string
  revision: Revision
}

function simulada(texto: string, ocultos: boolean): ResultadoPractica {
  const tieneFormato = /tabla|lista|correo|columnas|formato/i.test(texto)
  return {
    respuesta: `Respuesta de prueba a: ${texto.slice(0, 80)}`,
    revision: pulirRevision(
      {
        criterios: [
          { id: 'contexto', nivel: /soy|ekosolv/i.test(texto) ? 'bien' : 'falta', comentario: 'Diga quién es y para quién es el resultado.' },
          { id: 'tarea', nivel: 'bien', comentario: 'La tarea está clara.' },
          { id: 'formato', nivel: tieneFormato ? 'bien' : 'falta', comentario: 'Indique cómo quiere recibir el resultado.' },
          { id: 'ejemplos', nivel: 'mejorable', comentario: 'Un ejemplo ayudaría.' },
        ],
        datos_sensibles: '',
        resumen: 'Agregue contexto y formato.',
        version_mejorada: `Contexto: soy [cargo] en Ekosolv.\nTarea: ${texto}\nFormato: [tabla o lista].`,
      },
      ocultos,
    ),
  }
}

export async function practicar(e: EntradaPractica): Promise<ResultadoPractica> {
  const { texto, ocultos } = prepararInstruccion(e.instruccion)
  if (simulado()) return simulada(texto, ocultos)
  const clave = env('ANTHROPIC_API_KEY')
  if (!clave || !(await practicaDisponible())) throw new PracticaNoDisponible()

  const api = new Anthropic({ apiKey: clave, maxRetries: 1, timeout: 40_000 })
  const [ejec, rev] = await Promise.all([
    api.messages.create({
      model: MODELO,
      max_tokens: 1200,
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: SYSTEM_EJECUTAR, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: texto }],
    }),
    api.messages.parse({
      model: MODELO,
      max_tokens: 2000,
      output_config: { effort: 'low', format: zodOutputFormat(EsquemaRevision) },
      system: [{ type: 'text', text: SYSTEM_REVISAR, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: mensajeRevisar(e, texto) }],
    }),
  ])

  const uso = sumarUso(sumarUso(USO_CERO, ejec.usage), rev.usage)
  await tope.sumarGasto(costoUsd(uso)).catch((err) => {
    console.error('[academia-ia/gasto]', err instanceof Error ? err.message : err)
  })

  if (rev.stop_reason === 'refusal' || !rev.parsed_output) throw new Error(`revisión sin salida (${rev.stop_reason})`)
  const respuesta = ejec.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
  return { respuesta: pulirRespuesta(respuesta), revision: pulirRevision(rev.parsed_output, ocultos) }
}
