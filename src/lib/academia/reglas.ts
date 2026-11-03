/**
 * Academia de IA: reglas puras (sin base ni red), con pruebas en reglas.test.ts.
 *
 * - La ruta de cada persona es la capacitación general más el taller de su
 *   área (los módulos de src/lib/capacitacion.ts).
 * - El certificado exige dos cosas, decididas por Mike el 2026-11-03: haber
 *   asistido a todos los bloques de los sábados de su ruta y tener aprobadas
 *   las entregas de todas las lecciones de su ruta que piden ejercicio.
 * - El contenido de las lecciones es texto con un formato mínimo (párrafos,
 *   subtítulos con "## ", listas con "- " o "1. " y negrita con **), que se
 *   escapa entero antes de convertirse en HTML.
 */
import { GENERAL, MODULOS } from '../capacitacion.ts'

// ---------- Módulos y áreas ----------

export const MODULO_GENERAL = 'general'

/** Áreas en las que se puede inscribir a alguien (cada una tiene su taller). */
export const AREAS_ACADEMIA = MODULOS.map((m) => ({ id: m.id as string, etiqueta: m.titulo }))
export const AREA_IDS = AREAS_ACADEMIA.map((a) => a.id)

/** Todos los módulos, en el orden del programa: general primero. */
export const MODULOS_ACADEMIA = [GENERAL, ...MODULOS].map((m) => ({ id: m.id as string, etiqueta: m.titulo }))
export const MODULO_IDS = MODULOS_ACADEMIA.map((m) => m.id)

export const esArea = (v: unknown): v is string => typeof v === 'string' && AREA_IDS.includes(v)
export const esModulo = (v: unknown): v is string => typeof v === 'string' && MODULO_IDS.includes(v)

export const nombreModulo = (id: string) => MODULOS_ACADEMIA.find((m) => m.id === id)?.etiqueta ?? id

/** Módulos que estudia una persona del área dada. */
export function rutaDe(area: string): string[] {
  return esArea(area) ? [MODULO_GENERAL, area] : [MODULO_GENERAL]
}

// ---------- Tipos mínimos que usan las reglas ----------

export interface LeccionBase {
  id: number
  modulo: string
  orden: number
  publicada: boolean
  ejercicio: string
}

export interface SesionBase {
  id: number
  fecha: string
  horas: number
  modulos: string[]
}

export interface EntregaBase {
  leccion_id: number
  estado: string
}

export const ESTADOS_ENTREGA = [
  { id: 'enviada', etiqueta: 'Por revisar' },
  { id: 'aprobada', etiqueta: 'Aprobada' },
  { id: 'devuelta', etiqueta: 'Devuelta para ajustar' },
] as const

export const esEstadoRevision = (v: unknown): v is 'aprobada' | 'devuelta' => v === 'aprobada' || v === 'devuelta'

// ---------- Ruta, progreso y certificado ----------

/** Lecciones publicadas de la ruta, en orden: módulo según la ruta y luego `orden`. */
export function leccionesDeRuta<T extends LeccionBase>(lecciones: T[], area: string): T[] {
  const ruta = rutaDe(area)
  return lecciones
    .filter((l) => l.publicada && ruta.includes(l.modulo))
    .sort((a, b) => ruta.indexOf(a.modulo) - ruta.indexOf(b.modulo) || a.orden - b.orden || a.id - b.id)
}

/** Bloques de los sábados a los que debe asistir alguien del área. */
export function sesionesDeRuta<T extends SesionBase>(sesiones: T[], area: string): T[] {
  const ruta = rutaDe(area)
  return sesiones.filter((s) => s.modulos.some((m) => ruta.includes(m))).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id)
}

export interface Avance {
  lecciones: number
  vistas: number
  porcentaje: number
  ejercicios: number
  aprobadas: number
  porRevisar: number
  devueltas: number
  sesiones: number
  asistidas: number
  horas: number
}

export function avanceDe(
  area: string,
  lecciones: LeccionBase[],
  sesiones: SesionBase[],
  vistas: Set<number>,
  entregas: EntregaBase[],
  asistio: Set<number>,
): Avance {
  const ruta = leccionesDeRuta(lecciones, area)
  const conEjercicio = ruta.filter((l) => l.ejercicio.trim())
  const estadoDe = new Map(entregas.map((e) => [e.leccion_id, e.estado]))
  const ses = sesionesDeRuta(sesiones, area)
  const asistidas = ses.filter((s) => asistio.has(s.id))
  const nVistas = ruta.filter((l) => vistas.has(l.id)).length
  return {
    lecciones: ruta.length,
    vistas: nVistas,
    porcentaje: ruta.length ? Math.round((nVistas / ruta.length) * 100) : 0,
    ejercicios: conEjercicio.length,
    aprobadas: conEjercicio.filter((l) => estadoDe.get(l.id) === 'aprobada').length,
    porRevisar: conEjercicio.filter((l) => estadoDe.get(l.id) === 'enviada').length,
    devueltas: conEjercicio.filter((l) => estadoDe.get(l.id) === 'devuelta').length,
    sesiones: ses.length,
    asistidas: asistidas.length,
    horas: redondearHoras(asistidas.reduce((t, s) => t + (Number(s.horas) || 0), 0)),
  }
}

export const redondearHoras = (h: number) => Math.round(h * 100) / 100

export interface Requisitos {
  elegible: boolean
  faltan: string[]
  horas: number
}

/**
 * ¿Puede recibir el certificado? Hacen falta sábados programados y al menos
 * una entrega: un certificado sin nada que lo respalde no vale.
 */
export function requisitosCertificado(a: Avance): Requisitos {
  const faltan: string[] = []
  if (!a.sesiones) faltan.push('Todavía no hay sábados programados para su ruta.')
  else if (a.asistidas < a.sesiones) {
    const n = a.sesiones - a.asistidas
    faltan.push(`Le ${n === 1 ? 'falta asistencia a 1 bloque' : `falta asistencia a ${n} bloques`} de los sábados.`)
  }
  if (!a.ejercicios) faltan.push('Todavía no hay ejercicios publicados en su ruta.')
  else if (a.aprobadas < a.ejercicios) {
    const n = a.ejercicios - a.aprobadas
    faltan.push(`Le ${n === 1 ? 'falta 1 entrega aprobada' : `faltan ${n} entregas aprobadas`}.`)
  }
  return { elegible: faltan.length === 0, faltan, horas: a.horas }
}

// ---------- Certificado ----------

// Sin 0/O ni 1/I/L, para que se pueda dictar por teléfono sin confusiones.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function codigoCertificado(azar: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const bytes = azar(8)
  let s = ''
  for (const b of bytes) s += ALFABETO[b % ALFABETO.length]
  return `EKO-IA-${s.slice(0, 4)}-${s.slice(4, 8)}`
}

export const esCodigo = (v: unknown): v is string => typeof v === 'string' && /^EKO-IA-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(v)

/** "6 horas", "1,5 horas", "1 hora". */
export function textoHoras(h: number): string {
  const n = redondearHoras(h)
  return `${n.toLocaleString('es-CO', { maximumFractionDigits: 2 })} ${n === 1 ? 'hora' : 'horas'}`
}

// ---------- Contenido ----------

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Negrita con **texto**, sobre texto ya escapado. */
const enLinea = (s: string) => escapar(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

/**
 * Convierte el texto de una lección en HTML seguro. Bloques separados por una
 * línea en blanco; "## " abre un subtítulo; "- " o "1. " al inicio de cada
 * línea arma una lista. Todo lo demás es párrafo.
 */
export function renderContenido(texto: string): string {
  const bloques = String(texto ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
  return bloques
    .map((b) => {
      const lineas = b.split('\n').map((l) => l.trim())
      if (lineas.length === 1 && lineas[0]!.startsWith('## ')) return `<h3>${enLinea(lineas[0]!.slice(3))}</h3>`
      if (lineas.every((l) => /^[-*] /.test(l))) return `<ul>${lineas.map((l) => `<li>${enLinea(l.slice(2))}</li>`).join('')}</ul>`
      if (lineas.every((l) => /^\d+[.)] /.test(l))) return `<ol>${lineas.map((l) => `<li>${enLinea(l.replace(/^\d+[.)] /, ''))}</li>`).join('')}</ol>`
      return `<p>${lineas.map(enLinea).join('<br>')}</p>`
    })
    .join('\n')
}

/** Solo http(s): un "javascript:" en un enlace sería código al hacer clic. */
export function enlaceSeguro(v: unknown): string {
  const s = String(v ?? '').trim().slice(0, 1000)
  if (!s) return ''
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : ''
  } catch {
    return ''
  }
}

export const esFecha = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z'))
