/**
 * Formulario de cierre de cada capacitación: al llegar la presentación a su
 * última escena, cada celular pasa a /academia/sala/opinion, que muestra el
 * formulario del área con la que la persona se registró.
 *
 * No es anónimo: lo ven solo admin y gerencia en el panel (/admin/academia,
 * pestaña Opiniones), para llevar la trazabilidad de cómo se resolvió cada
 * duda. Cada campo trae una sugerencia (placeholder) que ayuda a empezar a
 * escribir, con el lenguaje del trabajo de esa área (enfoque por área de
 * Mike, 2026-11-19). Las de Ventas y Mercadeo son generales hasta que se
 * itere su contenido.
 *
 * Módulo PURO: sin base ni red, con pruebas en talleres.test.ts.
 */

/** Número de capacitaciones del programa: en la última no hay "siguiente". */
export const TOTAL_CAPACITACIONES = 4
export const MAX_RESPUESTA_OPINION = 800

export type IdCampoOpinion = 'duda' | 'usar' | 'mejorar' | 'siguiente'

export interface CampoOpinion {
  id: IdCampoOpinion
  pregunta: string
  /** Comienzo de respuesta que se muestra como placeholder. */
  sugerencia: string
}

type Sugerencias = Record<IdCampoOpinion, string>

const GENERAL: Sugerencias = {
  duda: 'Todavía no me queda claro cómo…',
  usar: 'Voy a probar la plantilla de cuatro partes para…',
  mejorar: 'El ritmo me pareció… y me gustaría más ejemplos de…',
  siguiente: 'Me gustaría ver cómo usar la IA para…',
}

const POR_AREA: Record<string, Partial<Sugerencias>> = {
  gerencia: {
    duda: 'Todavía no tengo claro cómo usar la IA con los datos de Zoho sin…',
    usar: 'Voy a pedirle a la IA el primer borrador de la propuesta para…',
    siguiente: 'Me gustaría ver cómo automatizar el seguimiento de las oportunidades en Zoho para…',
  },
  finanzas: {
    duda: 'No me quedó claro qué datos de nómina o de clientes puedo pegar en…',
    usar: 'Voy a usar la IA para documentar el procedimiento de…',
    siguiente: 'Me gustaría ver cómo revisar con la IA la nómina de Siigo Nube o la cartera de Zoho Books para…',
  },
  operaciones: {
    duda: 'No entendí bien cómo comprobar que la norma o el artículo que cita la IA…',
    usar: 'Voy a usar la IA para sacar las obligaciones y los plazos del auto de…',
    siguiente: 'Me gustaría ver cómo llevar las vigencias y los cambios de norma de la ANLA y la CAR con…',
  },
  logistica: {
    duda: 'No me quedó claro si la IA puede revisar los correos de…',
    usar: 'Voy a pedirle a la IA que me ordene las solicitudes que llegan por correo de…',
    siguiente: 'Me gustaría ver cómo armar en Zoho un tablero con las cifras de…',
  },
  ventas: {
    usar: 'Voy a usar la IA para redactar el correo de seguimiento a…',
    siguiente: 'Me gustaría ver cómo preparar una cotización más rápido con…',
  },
  mercadeo: {
    usar: 'Voy a pedirle a la IA ideas para la publicación de…',
    siguiente: 'Me gustaría ver cómo armar el calendario de contenidos con…',
  },
}

/** Campos del formulario para un área y una capacitación, en orden. */
export function camposOpinion(area: string, taller: number): CampoOpinion[] {
  const s = { ...GENERAL, ...POR_AREA[area] }
  const hayOtra = taller < TOTAL_CAPACITACIONES
  return [
    { id: 'duda', pregunta: '¿Qué duda le quedó sin resolver?', sugerencia: s.duda },
    { id: 'usar', pregunta: '¿Qué de lo que vio hoy va a poner en práctica en su trabajo?', sugerencia: s.usar },
    { id: 'mejorar', pregunta: '¿Qué cambiaría de la capacitación de hoy?', sugerencia: s.mejorar },
    {
      id: 'siguiente',
      pregunta: hayOtra ? '¿Qué le gustaría ver o solucionar en la siguiente capacitación?' : '¿Qué le gustaría ver o solucionar después de estas capacitaciones?',
      sugerencia: s.siguiente,
    },
  ]
}

/**
 * Limpia lo que llega del celular: solo los campos del formulario, sin
 * espacios de más y recortados al máximo. Error si todo viene vacío.
 */
export function validarOpinion(v: unknown, area: string, taller: number): { respuestas: Record<string, string> } | { error: string } {
  const b = v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
  const respuestas: Record<string, string> = {}
  for (const c of camposOpinion(area, taller)) {
    const s = typeof b[c.id] === 'string' ? (b[c.id] as string).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim() : ''
    if (s.length > MAX_RESPUESTA_OPINION) return { error: `Cada respuesta puede tener hasta ${MAX_RESPUESTA_OPINION} caracteres.` }
    respuestas[c.id] = s
  }
  if (!Object.values(respuestas).some(Boolean)) return { error: 'Responda al menos una pregunta.' }
  return { respuestas }
}
