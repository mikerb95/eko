/**
 * Banco de recursos de las capacitaciones (docs/plan-recursos.md, fase 1,
 * Mike 2026-11-20). Es el destino del QR de la guía rápida impresa:
 * /academia/recursos/<área>, pública y sin login.
 *
 * Todo sale de los mismos archivos que las hojas impresas y la presentación
 * (entregables1.ts, taller1.ts, conectarZoho.ts), para que lo impreso y lo
 * publicado no se contradigan. Cuando exista la capacitación 2, se suma su
 * función en POR_TALLER y aparece sola, la más reciente arriba.
 *
 * Solo contenido de las capacitaciones: nada de datos personales ni internos.
 * Módulo PURO: sin base ni red.
 */
import { PASOS_ZOHO } from './conectarZoho.ts'
import { DONDE_PEGAR, ENTREGABLES_TALLER1, HABITOS, SI_NO_SIRVE, type EntregableArea } from './entregables1.ts'
import { TALLER_1 } from './taller1.ts'
import type { PasoGuiado } from './tipos.ts'

export interface AreaRecursos {
  id: string
  nombre: string
  /** De qué trata la ruta del área (enfoque por área de Mike, 2026-11-19). */
  enfoque: string
}

export interface Enlace {
  titulo: string
  texto: string
  href: string
}

export interface BancoCapacitacion {
  n: number
  titulo: string
  plantilla: EntregableArea['plantilla']
  /** Instrucciones del área y generales, listas para copiar. */
  instrucciones: { titulo: string; texto: string }[]
  siNoSirve: string[]
  habitos: typeof HABITOS
  dondePegar: typeof DONDE_PEGAR
  guias: { titulo: string; intro: string; pasos: PasoGuiado[] }[]
  /** Preguntas frecuentes por bloque de la capacitación. */
  preguntas: { bloque: string; items: { p: string; r: string }[] }[]
  glosario: Termino[]
  descargas: Enlace[]
  /** Tarjeta resumen pública de la capacitación. */
  resumen: string
}

const ENFOQUE: Record<string, string> = {
  gerencia: 'Zoho, propuestas, cierre de oportunidades y automatización de procesos.',
  finanzas: 'Zoho Books, Siigo Nube, nómina, cartera y manuales de procedimiento.',
  operaciones: 'Autos de la ANLA y la CAR, obligaciones, vigencias y cambios de norma.',
  logistica: 'Correo, solicitudes de recolección, avisos y tableros en Zoho.',
  ventas: 'Briefs, propuestas y seguimiento comercial.',
  mercadeo: 'Contenido, redes y blog.',
}

export interface Termino {
  termino: string
  definicion: string
}

/**
 * Preguntas frecuentes de una capacitación: las "si preguntan" de la vista de
 * presentador, agrupadas por bloque. Quedan fuera las escenas que solo
 * aplican durante la sesión (registro en la sala, cifras de la encuesta) y
 * las respuestas que otra escena dejó desactualizadas.
 */
const ESCENAS_SIN_FAQ = new Set(['sala', 'diagnostico'])
const PREGUNTAS_FUERA = new Set([
  // La práctica final sí conecta Zoho; esta respuesta decía que primero a mano.
  '¿Se puede conectar Claude a nuestro Zoho?',
])
function preguntasDe(t: typeof TALLER_1): BancoCapacitacion['preguntas'] {
  return t.bloques
    .map((b) => ({
      bloque: b.id === 'apertura' ? 'Para empezar' : b.titulo,
      items: t.escenas
        .filter((e) => e.bloque === b.id && !ESCENAS_SIN_FAQ.has(e.id))
        .flatMap((e) => e.siPreguntan ?? [])
        .filter((q) => !PREGUNTAS_FUERA.has(q.p)),
    }))
    .filter((g) => g.items.length > 0)
}

/** Glosario de la capacitación 1: las palabras que se usan en la sesión. */
const GLOSARIO_TALLER1: Termino[] = [
  { termino: 'Modelo de IA', definicion: 'Programa que aprendió de una cantidad enorme de texto a predecir cómo sigue un escrito. Claude, GPT y Gemini son modelos.' },
  { termino: 'Token', definicion: 'Pedazo de texto con el que trabaja la IA: una palabra corta, parte de una palabra larga o unas cifras. Lo que cabe y lo que cuesta se mide en tokens.' },
  { termino: 'Predecir el siguiente token', definicion: 'Lo único que hace el modelo: elegir, uno tras otro, el pedazo de texto más probable. Por eso suena natural y por eso puede decir algo falso con seguridad.' },
  { termino: 'Alucinación', definicion: 'Cuando la IA escribe algo que suena bien pero no es cierto: una norma, un artículo, una cifra o una fecha que no existen.' },
  { termino: 'Fecha de corte', definicion: 'Hasta dónde llega lo que el modelo leyó en su entrenamiento. Lo posterior, o lo interno de Ekosolv, no lo conoce si usted no se lo muestra.' },
  { termino: 'Ventana de contexto', definicion: 'La mesa de trabajo de la IA: la conversación y los archivos que tiene a la vista. Lo que no está ahí no lo tiene en cuenta, y una conversación nueva empieza vacía.' },
  { termino: 'Instrucción (prompt)', definicion: 'Lo que usted le escribe a la IA. Una buena instrucción tiene contexto, tarea, formato y, si lo tiene, un ejemplo.' },
  { termino: 'Proyecto de Claude', definicion: 'Espacio donde se guardan documentos e instrucciones fijas para no repetirlos en cada conversación.' },
  { termino: 'Cuenta de Ekosolv', definicion: 'La cuenta de empresa de Claude. Ahí se pegan los documentos de trabajo completos; en una cuenta personal, nunca.' },
  { termino: 'Dato sensible', definicion: 'Dato personal con protección reforzada en la Ley 1581 de 2012, como los de salud. Solo se usa si la tarea de verdad lo necesita.' },
  { termino: 'MCP', definicion: 'El idioma común con el que una IA se conecta con otras herramientas, como Zoho.' },
  { termino: 'Conector', definicion: 'Una conexión ya armada entre Claude y una herramienta concreta. El de Zoho CRM lo hizo Zoho.' },
  { termino: 'Autorización', definicion: 'El paso en que usted le da permiso a Claude en la página de Zoho. La contraseña se escribe en Zoho, nunca en Claude, y el permiso se puede quitar cuando quiera.' },
  { termino: 'Solo lectura', definicion: 'Consultar sin crear, cambiar ni borrar nada. En el conector se logra dejando bloqueadas las herramientas de escritura.' },
  { termino: 'Modo Auto y modo Manual', definicion: 'En Auto, Claude usa las herramientas sin preguntar. En Manual, le muestra qué va a hacer y espera su permiso.' },
  { termino: 'Claude in Chrome', definicion: 'Extensión de Google Chrome que deja que Claude use una pestaña como usted: leer, hacer clic y escribir.' },
]

export const AREAS_RECURSOS: AreaRecursos[] = ENTREGABLES_TALLER1.map((a) => ({ id: a.id, nombre: a.nombre, enfoque: ENFOQUE[a.id] ?? '' }))

/** Total de capacitaciones del programa (las que faltan se muestran como próximas, sin temas). */
export const TOTAL_PROGRAMA = 4

export interface TemaBanco {
  /** id de la sección en la página del área. */
  id: string
  titulo: string
  etiqueta: string
}

/** Temario de una capacitación en el banco: las secciones, en el orden de la página. */
export function temarioDe(b: BancoCapacitacion): TemaBanco[] {
  return [
    { id: 'plantilla', titulo: 'Una buena instrucción tiene cuatro partes', etiqueta: 'Plantilla' },
    { id: 'instrucciones', titulo: 'Instrucciones para copiar', etiqueta: `${b.instrucciones.length} instrucciones` },
    { id: 'iterar', titulo: 'Si no sirve, dígale qué cambiar', etiqueta: `${b.siNoSirve.length} frases` },
    { id: 'verificar', titulo: 'Antes de usar la respuesta', etiqueta: `${b.habitos.length} hábitos` },
    { id: 'pegar', titulo: 'Dónde pegar', etiqueta: 'Ley 1581' },
    ...b.guias.map((g, i) => ({ id: `guia-${i + 1}`, titulo: g.titulo, etiqueta: `Guía · ${g.pasos.length} pasos` })),
    { id: 'preguntas', titulo: 'Preguntas frecuentes', etiqueta: `${b.preguntas.reduce((s, g) => s + g.items.length, 0)} preguntas` },
    { id: 'glosario', titulo: 'Glosario', etiqueta: `${b.glosario.length} términos` },
    { id: 'descargas', titulo: 'Checklist, guía rápida y tarjeta resumen', etiqueta: 'PDF' },
  ]
}

export const areaRecursos = (id: unknown) => AREAS_RECURSOS.find((a) => a.id === id) ?? null

/** Ruta pública del banco de un área. */
export const rutaRecursos = (area: string) => `/academia/recursos/${area}`

/** Archivos PDF de las hojas impresas (public/recursos, ver scripts/entregables-pdf.mjs). */
export const pdfEntregable = (n: number, area: string, hoja: 'checklist' | 'guia') => `/recursos/taller${n}-${area}-${hoja}.pdf`

const FUENTES_COMUNES: Enlace[] = [
  { titulo: 'SUIN-Juriscol', texto: 'Leyes, decretos y su vigencia: si fueron modificados o derogados.', href: 'https://www.suin-juriscol.gov.co/' },
  { titulo: 'Diario Oficial', texto: 'El texto publicado de leyes y decretos nacionales.', href: 'https://svrpubindc.imprenta.gov.co/diario/' },
]

const FUENTES_AREA: Record<string, Enlace[]> = {
  operaciones: [
    { titulo: 'ANLA', texto: 'Autos, resoluciones y trámites de licenciamiento ambiental.', href: 'https://www.anla.gov.co/' },
    { titulo: 'CAR Cundinamarca', texto: 'Actos y trámites de la corporación.', href: 'https://www.car.gov.co/' },
    { titulo: 'Ministerio de Ambiente', texto: 'Normativa ambiental nacional.', href: 'https://www.minambiente.gov.co/' },
  ],
  finanzas: [{ titulo: 'DIAN', texto: 'Normativa tributaria, calendario y facturación electrónica.', href: 'https://www.dian.gov.co/' }],
  gerencia: [{ titulo: 'Ministerio de Ambiente', texto: 'Normativa ambiental nacional.', href: 'https://www.minambiente.gov.co/' }],
  mercadeo: [{ titulo: 'Ministerio de Ambiente', texto: 'Normativa ambiental nacional, para citar bien en publicaciones.', href: 'https://www.minambiente.gov.co/' }],
  ventas: [{ titulo: 'Ministerio de Ambiente', texto: 'Normativa ambiental nacional.', href: 'https://www.minambiente.gov.co/' }],
  logistica: [{ titulo: 'Ministerio de Ambiente', texto: 'Normativa de gestión de residuos (RAEE, RESPEL).', href: 'https://www.minambiente.gov.co/' }],
}

/** Fuentes oficiales para verificar: las comunes y las del área. */
export const fuentesDe = (area: string): Enlace[] => [...FUENTES_COMUNES, ...(FUENTES_AREA[area] ?? [])]

// El paso 0 de la práctica habla de la sala ("Abrir en mi PC, aquí abajo"):
// en el banco la llegada va como introducción y la guía empieza en el paso 1.
const GUIA_ZOHO = {
  titulo: 'Conectar Claude con Zoho CRM, solo para leer',
  intro: `${PASOS_ZOHO[0].queEs} Necesita un PC con Google Chrome, su usuario de Zoho y la cuenta de Claude de Ekosolv.`,
  pasos: PASOS_ZOHO.slice(1),
}

function taller1(area: string): BancoCapacitacion | null {
  const a = ENTREGABLES_TALLER1.find((x) => x.id === area)
  if (!a) return null
  return {
    n: TALLER_1.n,
    titulo: TALLER_1.titulo,
    plantilla: a.plantilla,
    instrucciones: [...a.instrucciones, ...TALLER_1.resumen.instrucciones],
    siNoSirve: SI_NO_SIRVE,
    habitos: HABITOS,
    dondePegar: DONDE_PEGAR,
    guias: [GUIA_ZOHO],
    preguntas: preguntasDe(TALLER_1),
    glosario: GLOSARIO_TALLER1,
    descargas: [
      { titulo: 'Guía rápida', texto: 'La hoja con la plantilla, las instrucciones y dónde pegar.', href: pdfEntregable(1, area, 'guia') },
      { titulo: 'Checklist', texto: 'Los temas de la capacitación para marcar lo que ya domina.', href: pdfEntregable(1, area, 'checklist') },
    ],
    resumen: `/academia/taller/${TALLER_1.n}/resumen`,
  }
}

const POR_TALLER: Record<number, (area: string) => BancoCapacitacion | null> = { 1: taller1 }

/** Banco de un área: una entrada por capacitación, la más reciente primero. */
export function bancoDe(area: string): BancoCapacitacion[] {
  return Object.keys(POR_TALLER)
    .map(Number)
    .sort((x, y) => y - x)
    .map((n) => POR_TALLER[n](area))
    .filter((b): b is BancoCapacitacion => !!b)
}
