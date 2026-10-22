// Una vuelta de conversación del asesor público: valida lo que manda el
// navegador, llama al modelo, ejecuta su herramienta y pasa la respuesta por
// la guardia de cifras antes de devolverla.
//
// El servidor no guarda la conversación: el navegador reenvía el historial en
// cada pregunta, y del historial solo se toma texto plano. Como el asesor de
// Ekosolv no tiene ninguna cifra de dinero permitida, un historial manipulado
// con una "respuesta del asesor" que traiga un precio no le sirve de nada a
// quien lo manipule: la guardia rechaza cualquier cifra en la respuesta nueva.
//
// El modelo se inyecta (`Dependencias`) para probar el bucle sin red.
// Módulo PURO.

import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { Locale } from './conocimiento.ts'
import { sumarUso, USO_CERO, type Uso } from './costo.ts'
import { verificarCifras } from './guardia.ts'
import { EsquemaWhatsapp, mensajeWhatsapp } from './herramientas.ts'
import { MAX_PREGUNTAS, PAGINAS, type Pagina } from './prompt.ts'

export const MAX_TEXTO_USUARIO = 500
export const MAX_TEXTO_ASESOR = 2_000
/** Llamadas al modelo por pregunta: la herramienta, la respuesta y un reintento de la guardia. */
export const MAX_LLAMADAS = 4

const EsquemaEntrada = z
  .object({
    locale: z.enum(['es', 'en']),
    pagina: z.enum(PAGINAS).optional(),
    mensajes: z
      .array(
        z
          .object({
            rol: z.enum(['usuario', 'asesor']),
            texto: z.string().trim().min(1),
          })
          .strict()
      )
      .min(1)
      .max(MAX_PREGUNTAS * 2 - 1),
  })
  .strict()

export type Entrada = {
  locale: Locale
  pagina?: Pagina
  mensajes: { rol: 'usuario' | 'asesor'; texto: string }[]
}

export type ErrorEntrada = { error: 'formato' | 'limite' }

/**
 * Valida el cuerpo del request. 'limite' si se pasó del máximo de preguntas
 * (el navegador lo impide; esto es para quien lo salte).
 */
export function validarEntrada(cuerpo: unknown): Entrada | ErrorEntrada {
  const r = EsquemaEntrada.safeParse(cuerpo)
  if (!r.success) {
    const largo = r.error.issues.some((i) => i.path[0] === 'mensajes' && i.code === 'too_big' && i.path.length === 1)
    return { error: largo ? 'limite' : 'formato' }
  }
  const { mensajes } = r.data
  // Alternancia estricta, empezando y terminando en el visitante.
  const alterna = mensajes.every((m, i) => m.rol === (i % 2 === 0 ? 'usuario' : 'asesor'))
  if (!alterna || mensajes.at(-1)!.rol !== 'usuario') return { error: 'formato' }
  const excede = mensajes.some((m) => m.texto.length > (m.rol === 'usuario' ? MAX_TEXTO_USUARIO : MAX_TEXTO_ASESOR))
  if (excede) return { error: 'formato' }
  return { locale: r.data.locale, pagina: r.data.pagina, mensajes }
}

// Ningún dato de contacto llega al modelo (Ley 1581): el prompt le prohíbe
// pedirlos, pero la persona igual los escribe. Se tapan en todo el historial,
// porque el navegador lo reenvía completo en cada pregunta.
const CORREO = /[\p{L}\d._%+-]+@[\p{L}\d-]+(?:\.[\p{L}\d-]+)+/gu
// Secuencias de 7 a 13 dígitos con separadores: celulares, fijos, NIT y
// cédulas. Una cifra con $ delante no es un dato personal y se deja.
const NUMERO = /(?<![$\d])\+?\d[\d\s().-]{5,18}\d(?!\d)/g

export function taparDatos(texto: string, locale: Locale): string {
  const oculto = locale === 'es' ? '[dato oculto]' : '[hidden]'
  return texto.replace(CORREO, oculto).replace(NUMERO, (m) => {
    const digitos = m.replace(/\D/g, '').length
    return digitos >= 7 && digitos <= 13 ? oculto : m
  })
}

export type Dependencias = {
  llamarModelo: (mensajes: Anthropic.MessageParam[]) => Promise<Anthropic.Message>
}

export type Respuesta = {
  texto: string
  /** Mensaje para precargar en WhatsApp, si el modelo lo preparó en esta vuelta. */
  whatsapp: string | null
  uso: Uso
  /** Por qué se devolvió el texto de respaldo en vez de la respuesta del modelo. */
  respaldo: 'guardia' | 'negativa' | 'vueltas' | null
}

export const RESPALDO: Record<Locale, string> = {
  es: 'Prefiero no darle una respuesta que no pueda respaldar. Escríbale a un consultor de Ekosolv por WhatsApp y le confirma.',
  en: "I'd rather not give you an answer I can't back up. Message an Ekosolv consultant on WhatsApp and they'll confirm.",
}

/**
 * Quita las rayas (— y –) del texto del modelo. La instrucción del
 * prompt no basta: Haiku las pone por costumbre. Un rango numérico pasa a
 * "3 a 5" / "3 to 5"; cualquier otra raya, a coma.
 */
export function sinRayas(texto: string, locale: Locale): string {
  const a = locale === 'es' ? 'a' : 'to'
  return texto.replace(/(\d)\s*[–—]\s*(?=\d)/g, `$1 ${a} `).replace(/\s*[—–]\s*/g, ', ')
}

// Voseo rioplatense que se cuela pese al prompt (pasó en el asesor de
// codebymike.net el 6 oct 2026). Se corrige con un reemplazo fijo, sin otra
// llamada al modelo. Como aquí el trato es de usted, cada forma pasa a la de
// usted. Solo formas que no existen en el español de Colombia.
const VOSEO: [string, string][] = [
  ['con vos', 'con usted'],
  ['vos', 'usted'],
  ['podés', 'puede'],
  ['querés', 'quiere'],
  ['tenés', 'tiene'],
  ['sabés', 'sabe'],
  ['necesitás', 'necesita'],
  ['decís', 'dice'],
  ['contame', 'cuénteme'],
  ['escribime', 'escríbame'],
  ['decime', 'dígame'],
  ['mirá', 'mire'],
  ['fijate', 'fíjese'],
]

// \b de JS no entiende tildes, así que el borde es "ni antes ni después hay
// una letra", con Unicode.
const REEMPLAZOS = VOSEO.map(([vos, ud]) => [new RegExp(`(?<!\\p{L})${vos}(?!\\p{L})`, 'giu'), ud] as const)
// "sos" aparte y sin ignorar mayúsculas: "SOS" es otra cosa.
const SOS = /(?<!\p{L})([Ss])os(?!\p{L})/gu

/** Respeta la mayúscula inicial de la palabra reemplazada. */
const comoEl = (original: string, nueva: string) => (/^\p{Lu}/u.test(original) ? nueva[0]!.toUpperCase() + nueva.slice(1) : nueva)

export function sinVoseo(texto: string, locale: Locale): string {
  if (locale !== 'es') return texto
  let t = texto
  for (const [re, ud] of REEMPLAZOS) t = t.replace(re, (m) => comoEl(m, ud))
  return t.replace(SOS, (_m, s: string) => (s === 'S' ? 'Es' : 'es'))
}

function textoDe(m: Anthropic.Message): string {
  return m.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
}

/** Corre una pregunta completa. Lanza solo si falla la llamada al modelo. */
export async function atender(e: Entrada, deps: Dependencias): Promise<Respuesta> {
  const mensajes: Anthropic.MessageParam[] = e.mensajes.map((m) => ({
    role: m.rol === 'usuario' ? 'user' : 'assistant',
    content: m.rol === 'usuario' ? taparDatos(m.texto, e.locale) : m.texto,
  }))

  let uso = USO_CERO
  let whatsapp: string | null = null
  let reintentoGuardia = false
  // Texto escrito junto a la llamada a la herramienta. El modelo suele dar la
  // respuesta completa en el mismo mensaje en que pide preparar WhatsApp, y
  // después cierra sin decir nada más: si se descartara, se perdería.
  let previo: string[] = []
  const cerrar = (texto: string, respaldo: Respuesta['respaldo']): Respuesta => ({ texto, whatsapp, uso, respaldo })

  for (let vuelta = 0; vuelta < MAX_LLAMADAS; vuelta++) {
    const r = await deps.llamarModelo(mensajes)
    uso = sumarUso(uso, r.usage)
    if (r.stop_reason === 'refusal') return cerrar(RESPALDO[e.locale], 'negativa')

    const usos = r.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    if (usos.length) {
      const dicho = textoDe(r)
      if (dicho) previo.push(dicho)
      // El contenido va completo (bloques de razonamiento incluidos): la API
      // exige recibirlos sin cambios dentro de la misma vuelta.
      mensajes.push({ role: 'assistant', content: r.content })
      const resultados: Anthropic.ToolResultBlockParam[] = usos.map((u) => {
        const salida = ejecutarHerramienta(u, e.locale)
        if (salida.whatsapp) whatsapp = salida.whatsapp
        return { type: 'tool_result', tool_use_id: u.id, content: salida.contenido, is_error: salida.error }
      })
      mensajes.push({ role: 'user', content: resultados })
      continue
    }

    const texto = sinVoseo(sinRayas([...previo, textoDe(r)].filter(Boolean).join('\n\n'), e.locale), e.locale)
    if (!texto) return cerrar(RESPALDO[e.locale], 'vueltas')
    const g = verificarCifras(texto, [])
    if (g.ok) return cerrar(texto, null)
    if (reintentoGuardia) return cerrar(RESPALDO[e.locale], 'guardia')
    // Una oportunidad de corregir, con las cifras problemáticas a la vista.
    reintentoGuardia = true
    // El reintento reescribe la respuesta completa: lo dicho antes no se suma.
    previo = []
    mensajes.push({ role: 'assistant', content: r.content })
    mensajes.push({
      role: 'user',
      content:
        `[Revisión automática del sistema, no del visitante] Tu respuesta menciona cifras de dinero: ${g.inventadas.map((c) => c.texto).join(', ')}. ` +
        'Ekosolv no publica tarifas. Reescribe la respuesta completa para el visitante sin ninguna cifra de dinero: explica de qué depende el costo y ofrece hablar con un consultor.',
    })
  }
  return cerrar(RESPALDO[e.locale], 'vueltas')
}

type Salida = { contenido: string; error: boolean; whatsapp?: string }

function ejecutarHerramienta(u: Anthropic.ToolUseBlock, locale: Locale): Salida {
  if (u.name === 'preparar_whatsapp') {
    const p = EsquemaWhatsapp.safeParse(u.input)
    if (!p.success) return { contenido: `Entrada inválida: ${p.error.issues.map((i) => i.message).join('; ')}`, error: true }
    return {
      contenido: 'Listo: el botón "Enviar a un consultor" ya está visible para el visitante.',
      error: false,
      whatsapp: mensajeWhatsapp(p.data, locale),
    }
  }
  return { contenido: `Herramienta desconocida: ${u.name}`, error: true }
}
