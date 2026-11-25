/**
 * Resúmenes por correo: el del lunes (lo que vence en las dos semanas
 * siguientes y lo atrasado) y el mensual (estado de las obligaciones del mes
 * más las cifras de Zoho Books). La parte de armar es PURA; las cifras de
 * Books se piden en zohoBooks.ts.
 */
import { habilesRestantes } from '../agente/diasHabiles.ts'
import { masDias, textoPlazo } from './avisos.ts'
import { cerrada, ESTADO_TEXTO, type Estado } from './estados.ts'

export interface ObligacionResumen {
  concepto: string
  periodo: string
  vence: string
  estado: string
}

export interface Linea {
  concepto: string
  periodo: string
  vence: string
  estado: string
  plazo: string
}

const linea = (o: ObligacionResumen, hoy: string): Linea => ({
  concepto: o.concepto,
  periodo: o.periodo,
  vence: o.vence,
  estado: ESTADO_TEXTO[o.estado as Estado] ?? o.estado,
  plazo: textoPlazo(habilesRestantes(hoy, o.vence)),
})

const conFecha = (o: ObligacionResumen) => /^\d{4}-\d{2}-\d{2}$/.test(o.vence)

/** Lunes: atrasadas (vencidas sin cerrar) y las que vencen en los próximos 14 días. */
export function resumenSemanal(obs: readonly ObligacionResumen[], hoy: string): { atrasadas: Linea[]; proximas: Linea[] } {
  const hasta = masDias(hoy, 14)
  const abiertas = obs.filter((o) => !cerrada(o) && conFecha(o))
  return {
    atrasadas: abiertas.filter((o) => o.vence < hoy).map((o) => linea(o, hoy)),
    proximas: abiertas.filter((o) => o.vence >= hoy && o.vence <= hasta).map((o) => linea(o, hoy)),
  }
}

/**
 * Día 1: cómo cerró el mes anterior (cuántas se presentaron a tiempo, cuáles
 * quedaron atrasadas) y qué vence en el mes que empieza.
 */
export function resumenMensual(
  obs: readonly ObligacionResumen[],
  hoy: string,
): { mesAnterior: string; delMes: number; cerradasDelMes: number; atrasadas: Linea[]; proximas: Linea[] } {
  const d = new Date(`${hoy}T12:00:00Z`)
  d.setUTCDate(0) // último día del mes anterior
  const mesAnterior = d.toISOString().slice(0, 7)
  const mesActual = hoy.slice(0, 7)
  const delMesAnterior = obs.filter((o) => o.vence.startsWith(mesAnterior))
  const abiertas = obs.filter((o) => !cerrada(o) && conFecha(o))
  return {
    mesAnterior,
    delMes: delMesAnterior.length,
    cerradasDelMes: delMesAnterior.filter(cerrada).length,
    atrasadas: abiertas.filter((o) => o.vence < hoy).map((o) => linea(o, hoy)),
    proximas: abiertas.filter((o) => o.vence.startsWith(mesActual)).map((o) => linea(o, hoy)),
  }
}

export const MESES_TXT = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
export const nombreMes = (aaaamm: string) => `${MESES_TXT[Number(aaaamm.slice(5, 7)) - 1]} de ${aaaamm.slice(0, 4)}`
