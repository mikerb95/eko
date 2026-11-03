/**
 * Casos para el taller presencial: archivos reales del equipo y lo que cada
 * persona hace con ellos ("con este Excel cruzo kilos contra certificados,
 * reviso VITAL y armo un correo al cliente"). Con eso se arman los ejercicios
 * de cada sábado en vez de inventar ejemplos.
 *
 * Módulo PURO: constantes, tipos y validación, sin base ni Blob, para que lo
 * carguen igual la página /ia, las API y las pruebas.
 *
 * Los archivos se suben directo del navegador a Vercel Blob privado (el límite
 * de 4,5 MB por petición de las funciones de Vercel no alcanza para un PDF
 * escaneado). Aquí solo se valida la ruta que la persona dice haber subido; la
 * API confirma contra Blob que el archivo existe y toma de allá el tamaño.
 */
import { AREA_IDS, type AreaId, type Opcion } from './preguntas.ts'

export const MAX_ARCHIVOS = 5
export const MAX_MB = 20
export const MAX_BYTES = MAX_MB * 1024 * 1024
/** Carpeta de todos los archivos del taller en Blob: borrar todo es borrar este prefijo. */
export const PREFIJO = 'taller/'
/** Sube si cambia el texto de la autorización de los casos. */
export const CONSENT_CASOS = 'taller-casos-1.0'

/**
 * Extensiones aceptadas y su tipo. El navegador a veces no da el tipo (CSV en
 * Windows, HEIC del iPhone), así que se deduce de la extensión y se manda
 * explícito: Blob rechaza lo que no esté en esta lista.
 */
export const TIPOS: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  csv: 'text/csv',
  txt: 'text/plain',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  heic: 'image/heic',
}
export const TIPOS_PERMITIDOS = [...new Set(Object.values(TIPOS))]
export const EXTENSIONES = Object.keys(TIPOS)

export function extension(nombre: string): string {
  const m = /\.([a-z0-9]{1,5})$/i.exec(nombre.trim())
  return m ? m[1].toLowerCase() : ''
}

export function tipoDe(nombre: string): string {
  return TIPOS[extension(nombre)] ?? ''
}

/**
 * Nombre apto para una ruta de Blob: sin tildes, espacios ni símbolos raros.
 * El nombre original se guarda aparte para mostrarlo en el panel.
 */
export function nombreSeguro(nombre: string): string {
  const ext = extension(nombre)
  const base = nombre
    .trim()
    .replace(/\.[a-z0-9]{1,5}$/i, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80)
  return `${base || 'archivo'}${ext ? `.${ext}` : ''}`
}

/**
 * Ruta válida de un archivo del taller: `taller/<lote>/<nombre>`. El lote lo
 * genera el navegador por cada caso; Blob le agrega un sufijo aleatorio al
 * nombre, así que dos archivos iguales no se pisan.
 */
const RUTA = /^taller\/[a-z0-9-]{8,40}\/[A-Za-z0-9._-]{1,140}$/
export const rutaValida = (p: string) => RUTA.test(p) && !p.includes('..')

/** Lo que la persona tiene que entregar al final con esos archivos. */
export const RESULTADOS: Opcion[] = [
  { id: 'tabla', etiqueta: 'Tabla o Excel' },
  { id: 'informe', etiqueta: 'Informe o reporte' },
  { id: 'presentacion', etiqueta: 'Presentación' },
  { id: 'correo', etiqueta: 'Correo o mensaje' },
  { id: 'respuesta', etiqueta: 'Respuesta a la autoridad' },
  { id: 'certificado', etiqueta: 'Certificado' },
  { id: 'propuesta', etiqueta: 'Propuesta o cotización' },
  { id: 'otro', etiqueta: 'Otro' },
]

/**
 * Ley 1581: los archivos pueden traer datos de clientes. No se exige
 * anonimizar (a veces el ejercicio es justo leer el documento real), pero la
 * persona dice cómo viene, y el panel lo muestra para tratarlo con cuidado.
 */
export const PRIVACIDAD = [
  { id: 'sin_datos', etiqueta: 'No tiene datos de clientes, o ya los tapé' },
  { id: 'con_datos', etiqueta: 'Tiene datos reales de clientes' },
] as const satisfies readonly Opcion[]

export interface ArchivoCaso {
  /** Ruta en Blob (o en la carpeta local en desarrollo). */
  ruta: string
  /** Nombre original, para mostrarlo y para la descarga. */
  nombre: string
  tipo: string
  tamano: number
}

export interface CasoNuevo {
  nombre: string
  area: AreaId
  contexto: string
  fuentes: string
  resultados: string[]
  privacidad: string
  archivos: Omit<ArchivoCaso, 'tamano' | 'tipo'>[]
}

export interface Caso extends Omit<CasoNuevo, 'archivos'> {
  id: number
  archivos: ArchivoCaso[]
  creado: string
}

export class ErrorCaso extends Error {}

const texto = (v: unknown, max: number) => String(v ?? '').replace(/\s+\n/g, '\n').trim().slice(0, max)

/** Convierte lo que manda la página en un caso limpio, o lanza `ErrorCaso`. */
export function validarCaso(b: Record<string, unknown>): CasoNuevo {
  const nombre = texto(b.nombre, 120)
  if (nombre.length < 3) throw new ErrorCaso('Escriba su nombre.')

  const area = String(b.area ?? '') as AreaId
  if (!AREA_IDS.includes(area)) throw new ErrorCaso('Elija su área.')

  const contexto = texto(b.contexto, 4000)
  if (contexto.length < 20) throw new ErrorCaso('Cuente un poco más qué hace con estos archivos (al menos una frase).')

  const privacidad = String(b.privacidad ?? '')
  if (!PRIVACIDAD.some((p) => p.id === privacidad)) throw new ErrorCaso('Indique si los archivos tienen datos de clientes.')

  const ids = Array.isArray(b.resultados) ? b.resultados.map(String) : []
  const resultados = RESULTADOS.filter((r) => ids.includes(r.id)).map((r) => r.id)

  const crudos = Array.isArray(b.archivos) ? b.archivos : []
  if (crudos.length === 0) throw new ErrorCaso('Agregue al menos un archivo.')
  if (crudos.length > MAX_ARCHIVOS) throw new ErrorCaso(`Máximo ${MAX_ARCHIVOS} archivos por caso.`)
  const vistos = new Set<string>()
  const archivos = crudos.map((a: any) => {
    const ruta = String(a?.ruta ?? '')
    if (!rutaValida(ruta) || vistos.has(ruta)) throw new ErrorCaso('Uno de los archivos no se subió bien. Quítelo y vuelva a agregarlo.')
    vistos.add(ruta)
    const original = texto(a?.nombre, 160) || ruta.split('/').pop()!
    if (!tipoDe(original) && !tipoDe(ruta)) throw new ErrorCaso(`Ese tipo de archivo no se acepta: ${original}`)
    return { ruta, nombre: original }
  })

  return { nombre, area, contexto, fuentes: texto(b.fuentes, 1000), resultados, privacidad, archivos }
}
