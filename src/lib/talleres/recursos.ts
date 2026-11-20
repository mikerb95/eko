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
  descargas: Enlace[]
  /** Tarjeta resumen pública de la capacitación. */
  resumen: string
}

export const AREAS_RECURSOS: AreaRecursos[] = ENTREGABLES_TALLER1.map((a) => ({ id: a.id, nombre: a.nombre }))

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
