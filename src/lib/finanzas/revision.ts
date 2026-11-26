/**
 * Qué tan confiable es la fecha de cada obligación, y por qué. Módulo PURO.
 *
 * Una fecha mal cargada es lo que termina en una sanción, así que el panel no
 * presenta ninguna fecha como definitiva mientras:
 * - sea estimada con la regla del decreto o venga de una fuente "por verificar";
 * - las responsabilidades del RUT estén por confirmar (de ellas sale qué se
 *   declara y cada cuánto);
 * - el contador no haya revisado el calendario de ese año, o la fecha se haya
 *   cargado o cambiado después de su revisión;
 * - sea un plazo que el sistema calculó desde un requerimiento.
 *
 * Los avisos NO se frenan por esto: dejar de avisar es peor. Cada aviso dice
 * qué falta confirmar, y la fecha que vale siempre es la del calendario
 * oficial de la DIAN o de Hacienda.
 */

export interface RevisionContador {
  anio: number
  /** Nombre del contador que revisó. */
  contador: string
  /** Usuario del panel que dejó constancia. */
  registradoPor: string
  /** ISO, cuándo se dejó la constancia. */
  fecha: string
  nota: string
}

export type Revisiones = Record<string, RevisionContador>

export type IdMotivo = 'estimada' | 'por_verificar' | 'calculada' | 'rut' | 'sin_revision' | 'cambio_posterior'

export interface Motivo {
  id: IdMotivo
  texto: string
}

/** Tipos que salen del RUT. Los requerimientos y las manuales no. */
const DEL_RUT = ['retefuente', 'iva', 'renta', 'activos_exterior', 'exogena', 'pila', 'ica', 'reteica', 'rub']

/** Frase fija que va en avisos y correos: qué fecha vale. */
export const FECHA_QUE_VALE = 'La fecha que vale es la del calendario oficial de la DIAN o de la Secretaría de Hacienda; el panel es una ayuda y no la reemplaza.'

/** Día de la constancia en Bogotá (se guarda en UTC: de noche ya sería el día siguiente). */
const fechaCorta = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const [a, m, dia] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(d).split('-')
  return `${Number(dia)}/${Number(m)}/${a}`
}

export function motivosFecha(
  o: { tipo: string; fuente: string; vence: string; created_at: string; fecha_cambiada_at?: string },
  cfg: { confirmado: boolean; iva?: string },
  revisiones: Revisiones,
): Motivo[] {
  const out: Motivo[] = []
  const fuente = String(o.fuente || '')
  const anio = /^\d{4}/.test(o.vence) ? o.vence.slice(0, 4) : ''

  if (/estimada/i.test(fuente)) {
    out.push({ id: 'estimada', texto: 'Fecha estimada con la regla del decreto: confírmela en el calendario oficial de la DIAN de ese año.' })
  } else if (/por verificar/i.test(fuente)) {
    out.push({ id: 'por_verificar', texto: 'Fecha tomada de una fuente secundaria: confírmela con la resolución de Hacienda.' })
  }

  if (o.tipo === 'requerimiento' || /calculado por el sistema/i.test(fuente)) {
    out.push({ id: 'calculada', texto: 'Plazo calculado por el sistema desde el documento: confírmelo con el contador o el abogado antes de contar con él.' })
    return out
  }

  if (!cfg.confirmado && DEL_RUT.includes(o.tipo)) {
    out.push({
      id: 'rut',
      texto:
        o.tipo === 'iva'
          ? 'No está confirmado si el IVA es bimestral o cuatrimestral: las fechas pueden ser otras.'
          : 'Las responsabilidades del RUT están por confirmar en Ajustes.',
    })
  }

  if (o.tipo === 'otra') return out

  const rev = anio ? revisiones[anio] : undefined
  if (!rev) {
    out.push({ id: 'sin_revision', texto: `El contador no ha revisado el calendario de ${anio || 'este año'}.` })
  } else {
    const cambio = [o.created_at, o.fecha_cambiada_at || ''].some((t) => t && t > rev.fecha)
    if (cambio) out.push({ id: 'cambio_posterior', texto: `La fecha se cargó o se cambió después de la revisión del contador del ${fechaCorta(rev.fecha)}.` })
  }
  return out
}

/** Para los años del calendario: cuántas obligaciones abiertas tienen algo por confirmar. */
export function resumenRevision(
  obs: readonly { tipo: string; fuente: string; vence: string; created_at: string; fecha_cambiada_at?: string; estado: string }[],
  cfg: { confirmado: boolean },
  revisiones: Revisiones,
): { anio: string; abiertas: number; porConfirmar: number; revision: RevisionContador | null }[] {
  const anios = [...new Set(obs.map((o) => o.vence.slice(0, 4)).filter((a) => /^\d{4}$/.test(a)))].sort()
  return anios.map((anio) => {
    const delAnio = obs.filter((o) => o.vence.startsWith(anio) && o.estado !== 'presentado' && o.tipo !== 'requerimiento')
    return {
      anio,
      abiertas: delAnio.length,
      porConfirmar: delAnio.filter((o) => motivosFecha(o, cfg, revisiones).length > 0).length,
      revision: revisiones[anio] ?? null,
    }
  })
}
