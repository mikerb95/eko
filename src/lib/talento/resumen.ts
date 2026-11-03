/**
 * Resumen semanal de talento humano para el correo de RR.HH.
 *
 * Módulo PURO: arma el contenido a partir del estado; el envío lo hace
 * src/lib/email.ts. Sin salarios, documentos ni datos de contacto: un correo
 * se reenvía fácil y se queda en bandejas que nadie controla.
 */
import type { EstadoTalento } from './datos.ts'
import { NIVELES, TIPOS_NOVEDAD, ausenciasEntre, etiquetaDe, masDias } from './reglas.ts'

export interface SeccionResumen {
  titulo: string
  filas: [nombre: string, detalle: string][]
}

export interface Resumen {
  asunto: string
  secciones: SeccionResumen[]
  /** No hay nada que contar: el envío automático se salta. */
  vacio: boolean
}

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const fechaCorta = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${Number(m[3])} ${MES[Number(m[2]) - 1]}` : iso
}

export function armarResumen(e: EstadoTalento): Resumen {
  const nombre = new Map(e.personas.map((p) => [p.usuario_id, p.nombre]))
  const quien = (id: number) => nombre.get(id) ?? 'Persona sin cuenta'
  const secciones: SeccionResumen[] = []

  const urgentes = e.avisos.filter((a) => a.nivel !== 'proximo')
  if (urgentes.length) {
    secciones.push({
      titulo: 'Vencidos y por vencer en 30 días',
      filas: urgentes.map((a) => [
        quien(a.usuario_id),
        `${a.titulo}: ${a.fecha ? `${a.nivel === 'vencido' ? 'venció' : 'vence'} el ${fechaCorta(a.fecha)}` : NIVELES[a.nivel].toLowerCase()}`,
      ]),
    })
  }

  const finSemana = masDias(e.hoy, 6)
  const ausencias = ausenciasEntre(e.novedades, e.hoy, finSemana)
  if (ausencias.length) {
    secciones.push({
      titulo: 'Ausencias de esta semana',
      filas: ausencias.map((n) => [quien(n.usuario_id), `${etiquetaDe(TIPOS_NOVEDAD, n.tipo)} del ${fechaCorta(n.desde)} al ${fechaCorta(n.hasta)}`]),
    })
  }

  const pendientes = e.novedades.filter((n) => n.estado === 'solicitada')
  if (pendientes.length) {
    secciones.push({
      titulo: 'Solicitudes por aprobar',
      filas: pendientes.map((n) => [
        quien(n.usuario_id),
        `${etiquetaDe(TIPOS_NOVEDAD, n.tipo)} del ${fechaCorta(n.desde)} al ${fechaCorta(n.hasta)} (${n.dias_habiles} días hábiles)`,
      ]),
    })
  }

  const vencidos = urgentes.filter((a) => a.nivel === 'vencido').length
  const asunto = secciones.length
    ? `Talento humano: ${[
        vencidos && `${vencidos} vencido${vencidos === 1 ? '' : 's'}`,
        urgentes.length - vencidos && `${urgentes.length - vencidos} por vencer`,
        pendientes.length && `${pendientes.length} solicitud${pendientes.length === 1 ? '' : 'es'} por aprobar`,
        ausencias.length && `${ausencias.length} ausencia${ausencias.length === 1 ? '' : 's'} esta semana`,
      ].filter(Boolean).join(', ')}`
    : 'Talento humano: sin pendientes esta semana'
  return { asunto, secciones, vacio: !secciones.length }
}
