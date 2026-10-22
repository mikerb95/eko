// Herramienta del asesor público: preparar el mensaje de WhatsApp para un
// consultor. No hay `calcular_precio` como en el asesor de codebymike.net:
// Ekosolv no publica tarifas, así que el asesor no da cifras de dinero.
//
// Módulo PURO (sin BD ni red).

import { z } from 'zod'
import type { Locale } from './conocimiento.ts'
import { verificarCifras } from './guardia.ts'

export const LINEAS_INTERES = ['EKONSULTING', 'EKORAEE', 'EKOPARTNER', 'EKOTRADING', 'no_sabe'] as const

export const EsquemaWhatsapp = z
  .object({
    necesidad: z.string().min(3).max(300),
    linea: z.enum(LINEAS_INTERES).optional(),
    pendiente: z.string().max(300).optional(),
  })
  .strict()

export type PedidoWhatsapp = z.infer<typeof EsquemaWhatsapp>

/** Definiciones para la API. La raíz del esquema tiene que ser `type: object`. */
export function definiciones() {
  return [
    {
      name: 'preparar_whatsapp',
      description:
        'Prepara el mensaje que la persona le enviará por WhatsApp a un consultor de Ekosolv. Úsala cuando quiera avanzar, pida hablar con alguien, pregunte el precio o tenga un caso concreto. ' +
        'El mensaje lo envía la persona, así que escribe en PRIMERA persona, como si fuera ella ("Importamos computadores y necesitamos el plan posconsumo de RAEE", nunca "Quiere..."). ' +
        'Sin cifras de dinero, sin nombres, teléfonos, correos ni NIT. Después de llamarla, dile que puede tocar el botón "Enviar a un consultor".',
      input_schema: {
        type: 'object' as const,
        properties: {
          necesidad: {
            type: 'string',
            description: 'Qué necesita la empresa, en primera persona y en una o dos frases. Sin cifras de dinero ni datos personales.',
          },
          linea: {
            type: 'string',
            enum: [...LINEAS_INTERES],
            description: 'Línea de servicio que más se acerca a lo que necesita, o no_sabe.',
          },
          pendiente: {
            type: 'string',
            description: 'La duda que le quedó y que debe resolver el consultor, en primera persona. Opcional.',
          },
        },
        required: ['necesidad'],
        additionalProperties: false,
      },
    },
  ]
}

/**
 * Mensaje que se precarga en WhatsApp. Lo compone el servidor: el modelo solo
 * aporta qué necesita la persona y qué quedó pendiente.
 */
export function mensajeWhatsapp(p: PedidoWhatsapp, locale: Locale): string {
  const es = locale === 'es'
  // Si el modelo coló una cifra de dinero en un campo, se descarta el campo
  // entero: lo que llega a WhatsApp a nombre de la persona tiene que poder
  // respaldarse, y Ekosolv no publica precios.
  const limpio = (s: string | undefined) => {
    const v = s?.replace(/\s*[—–]\s*/g, ', ').trim()
    if (!v) return null
    return verificarCifras(v, []).ok ? v : null
  }
  const necesidad = limpio(p.necesidad)
  const pendiente = limpio(p.pendiente)
  const lineas = [
    es
      ? 'Hola, vengo del sitio de Ekosolv. Hablé con el asistente y quiero seguir con un consultor.'
      : 'Hi, I come from the Ekosolv website. I talked to the assistant and would like to continue with a consultant.',
  ]
  if (necesidad) lineas.push('', necesidad)
  if (p.linea && p.linea !== 'no_sabe') lineas.push(`${es ? 'Línea de interés' : 'Service line'}: ${p.linea}`)
  if (pendiente) lineas.push(`${es ? 'Me queda la duda' : 'Still unsure about'}: ${pendiente}`)
  return lineas.join('\n')
}
