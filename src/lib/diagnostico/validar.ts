/**
 * Convierte lo que envía la encuesta en una `Respuesta` limpia. Módulo PURO.
 *
 * El formulario (TypeformFlow) manda todo como texto plano: las opciones
 * múltiples llegan unidas con ", ". Aquí se separan y se filtran contra las
 * opciones del cuestionario, así que un valor inventado nunca llega a la base.
 *
 * Las tareas del catálogo y el campo "otra" vienen con el área en el nombre
 * (`tareas_ventas`, `otra_ventas`): si la persona eligió un área, llenó su
 * paso y luego cambió de área, solo cuenta lo del área final.
 */
import {
  AREA_IDS,
  CERTIFICADO_MIN,
  CERTIFICADOS_MES,
  AREAS_PROPUESTAS,
  PROPUESTA_HORAS,
  PROPUESTA_ROL,
  PROPUESTAS_MES,
  DOCUMENTO_REAL,
  DOCUMENTOS,
  HERRAMIENTAS,
  HORAS,
  IAS,
  MODALIDAD,
  PREOCUPACIONES,
  TAREAS,
  USO_IA,
  type AreaId,
  type Opcion,
  type Respuesta,
} from './preguntas.ts'

export class ErrorDiagnostico extends Error {}

const texto = (b: Record<string, unknown>, k: string, max = 300) => String(b[k] ?? '').trim().slice(0, max)

function una(b: Record<string, unknown>, k: string, lista: readonly Opcion[]): string {
  const v = texto(b, k, 60)
  return lista.some((o) => o.id === v) ? v : ''
}

function varias(b: Record<string, unknown>, k: string, lista: readonly Opcion[]): string[] {
  const ids = new Set(lista.map((o) => o.id))
  const vistos = String(b[k] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => ids.has(s))
  return [...new Set(vistos)]
}

export function validarRespuesta(b: Record<string, unknown>): Respuesta {
  const nombre = texto(b, 'nombre', 120)
  const area = texto(b, 'area', 30) as AreaId
  if (!nombre) throw new ErrorDiagnostico('Escriba su nombre.')
  if (!AREA_IDS.includes(area)) throw new ErrorDiagnostico('Elija su área.')

  const r: Respuesta = {
    nombre,
    cargo: texto(b, 'cargo', 120),
    area,
    tareas: varias(b, `tareas_${area}`, TAREAS[area]),
    tarea_otra: texto(b, `otra_${area}`, 400),
    horas: una(b, 'horas', HORAS),
    tarea_principal: texto(b, 'tarea_principal', 1500),
    propuesta_rol: '',
    propuesta_horas: '',
    propuestas_mes: '',
    propuesta_demora: '',
    certificados_mes: '',
    certificado_min: '',
    seguimiento_gestores: '',
    certificado_demora: '',
    documentos: varias(b, 'documentos', DOCUMENTOS),
    herramientas: varias(b, 'herramientas', HERRAMIENTAS),
    uso_ia: una(b, 'uso_ia', USO_IA),
    ias: varias(b, 'ias', IAS),
    para_que: texto(b, 'para_que', 800),
    preocupaciones: varias(b, 'preocupaciones', PREOCUPACIONES),
    deseo: texto(b, 'deseo', 1000),
    documento_real: una(b, 'documento_real', DOCUMENTO_REAL),
    documento_cual: texto(b, 'documento_cual', 300),
    modalidad: una(b, 'modalidad', MODALIDAD),
    restricciones: texto(b, 'restricciones', 300),
  }

  // Propuestas: solo para las áreas que las hacen, y solo si participa.
  if (AREAS_PROPUESTAS.includes(area)) {
    r.propuesta_rol = una(b, 'propuesta_rol', PROPUESTA_ROL)
    if (r.propuesta_rol && r.propuesta_rol !== 'no') {
      r.propuesta_horas = una(b, 'propuesta_horas', PROPUESTA_HORAS)
      r.propuestas_mes = una(b, 'propuestas_mes', PROPUESTAS_MES)
      r.propuesta_demora = texto(b, 'propuesta_demora', 800)
    }
  }

  // Certificados: solo Logística.
  if (area === 'logistica') {
    r.certificados_mes = una(b, 'certificados_mes', CERTIFICADOS_MES)
    r.certificado_min = una(b, 'certificado_min', CERTIFICADO_MIN)
    r.seguimiento_gestores = una(b, 'seguimiento_gestores', HORAS)
    r.certificado_demora = texto(b, 'certificado_demora', 800)
    if (!r.certificados_mes || !r.certificado_min) {
      throw new ErrorDiagnostico('Indique cuántos certificados emite al mes y cuánto le toma cada uno.')
    }
  }

  // Lo mínimo para que la respuesta sirva al diagnóstico. El formulario ya lo
  // exige; esto cubre a quien llame al endpoint sin pasar por él.
  if (!r.tareas.length && !r.tarea_otra) throw new ErrorDiagnostico('Marque al menos una tarea o descríbala.')
  if (!r.horas) throw new ErrorDiagnostico('Indique cuántas horas a la semana le dedica a esas tareas.')
  if (!r.tarea_principal) throw new ErrorDiagnostico('Describa la tarea que más tiempo le quita.')
  if (!r.uso_ia) throw new ErrorDiagnostico('Indique con qué frecuencia usa la IA.')
  if (!r.deseo) throw new ErrorDiagnostico('Cuéntenos qué tarea le gustaría resolver con IA.')
  if (!r.documento_real) throw new ErrorDiagnostico('Indique si puede traer un documento real al taller.')
  return r
}
