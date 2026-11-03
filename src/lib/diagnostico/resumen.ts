/**
 * Resumen del diagnóstico por área. Módulo PURO (lo usan el panel y las pruebas).
 *
 * Lo que sale de aquí alimenta dos decisiones del programa de capacitación:
 * 1. El orden de los talleres. Operaciones va primero por definición del
 *    programa; las demás áreas se ordenan por horas semanales en tareas
 *    repetitivas (el "tiempo por ganar").
 * 2. El contenido de cada taller: tareas más comunes del área, documento real
 *    para el ejercicio y lo que cada persona quiere resolver.
 */
import {
  AREAS,
  CAMPOS_CON_IA,
  CERTIFICADO_MIN,
  CERTIFICADOS_MES,
  DOCUMENTO_REAL,
  DOCUMENTOS,
  HERRAMIENTAS,
  HORAS,
  IAS,
  MODALIDAD,
  PREOCUPACIONES,
  PROPUESTA_HORAS,
  PROPUESTA_ROL,
  PROPUESTAS_MES,
  TAREAS,
  USO_IA,
  etiqueta,
  type AreaId,
  type Opcion,
  type Respuesta,
} from './preguntas.ts'

export interface Fila extends Respuesta {
  id: number
  creado: string
}

export interface Conteo {
  id: string
  etiqueta: string
  n: number
}

export interface Nota {
  nombre: string
  texto: string
}

export interface ResumenArea {
  area: AreaId
  etiqueta: string
  n: number
  horasTotal: number
  horasPorPersona: number
  tareas: Conteo[]
  herramientas: Conteo[]
  usoIA: Conteo[]
  preocupaciones: Conteo[]
  deseos: Nota[]
  tareasPrincipales: Nota[]
  documentos: (Nota & { disponible: string })[]
  restricciones: Nota[]
  /** Lo que la persona agregó por su cuenta: otras herramientas, otras preocupaciones y comentarios. */
  comentarios: Nota[]
}

/** Semanas por mes, para pasar horas semanales a mensuales. */
export const SEMANAS_MES = 4.33

/** Tareas de Operaciones que cubre el agente de cumplimiento de la automatización. */
export const TAREAS_AGENTE = ['autos', 'obligaciones', 'vencimientos', 'normativa']

export interface PersonaPropuestas {
  nombre: string
  area: AreaId
  rol: string
  horasPorPropuesta: number
  propuestasMes: number
  horasMes: number
}

export interface ResumenPropuestas {
  /** Personas que participan en propuestas y dieron horas y volumen. */
  personas: PersonaPropuestas[]
  porRol: Conteo[]
  /** Horas-persona al mes que se van en propuestas, sumando a todos. */
  horasMes: number
  /** Propuestas al mes: el mayor volumen que reporta quien las arma (o cualquiera, si nadie las arma). */
  volumen: number
  /** Horas-persona que cuesta una propuesta de principio a fin. */
  horasPorPropuesta: number
  demoras: Nota[]
}

export interface ResumenAgente {
  /** Personas de Operaciones que hacen cada semana alguna tarea que cubre el agente. */
  personas: number
  deOperaciones: number
  tareas: Conteo[]
  /** Horas semanales repetitivas de esas personas (no todas son del agente). */
  horasSemana: number
}

export interface ResumenCertificados {
  /** Personas de Logística que dieron volumen y tiempo. */
  personas: number
  certificadosMes: number
  minutosPorCertificado: number
  /** Horas al mes emitiendo certificados. */
  horasMesEmision: number
  /** Horas al mes pidiendo certificados y haciendo seguimiento a gestores. */
  horasMesSeguimiento: number
  demoras: Nota[]
}

export interface Resumen {
  total: number
  areasConRespuesta: number
  horasTotal: number
  sinUsoIA: number
  usoIA: Conteo[]
  preocupaciones: Conteo[]
  modalidad: Conteo[]
  ias: Conteo[]
  areas: ResumenArea[]
  propuestas: ResumenPropuestas
  agente: ResumenAgente
  certificados: ResumenCertificados
  /** Áreas en el orden sugerido para los talleres. */
  orden: { area: AreaId; etiqueta: string; horasTotal: number; n: number; fija: boolean }[]
}

const horasDe = (id: string) => HORAS.find((h) => h.id === id)?.valor ?? 0
const valorDe = (lista: readonly { id: string; valor: number }[], id: string) => lista.find((h) => h.id === id)?.valor ?? 0

function resumirPropuestas(filas: Fila[]): ResumenPropuestas {
  const participan = filas.filter((f) => f.propuesta_rol && f.propuesta_rol !== 'no')
  const personas: PersonaPropuestas[] = participan
    .map((f) => {
      const horasPorPropuesta = valorDe(PROPUESTA_HORAS, f.propuesta_horas)
      const propuestasMes = valorDe(PROPUESTAS_MES, f.propuestas_mes)
      return { nombre: f.nombre, area: f.area, rol: f.propuesta_rol, horasPorPropuesta, propuestasMes, horasMes: horasPorPropuesta * propuestasMes }
    })
    .filter((p) => p.horasMes > 0)
    .sort((a, b) => b.horasMes - a.horasMes)
  const horasMes = redondear(personas.reduce((s, p) => s + p.horasMes, 0))
  const armadores = personas.filter((p) => p.rol === 'arma')
  const volumen = Math.max(0, ...(armadores.length ? armadores : personas).map((p) => p.propuestasMes))
  return {
    personas,
    porRol: contar(participan.map((f) => f.propuesta_rol), PROPUESTA_ROL),
    horasMes,
    volumen,
    horasPorPropuesta: volumen ? redondear(horasMes / volumen) : 0,
    demoras: notas(participan, 'propuesta_demora'),
  }
}

function resumirCertificados(filas: Fila[]): ResumenCertificados {
  const log = filas.filter((f) => f.area === 'logistica' && f.certificados_mes && f.certificado_min)
  const certificadosMes = log.reduce((s, f) => s + valorDe(CERTIFICADOS_MES, f.certificados_mes), 0)
  const minutos = log.reduce((s, f) => s + valorDe(CERTIFICADOS_MES, f.certificados_mes) * valorDe(CERTIFICADO_MIN, f.certificado_min), 0)
  return {
    personas: log.length,
    certificadosMes,
    minutosPorCertificado: certificadosMes ? Math.round(minutos / certificadosMes) : 0,
    horasMesEmision: redondear(minutos / 60),
    horasMesSeguimiento: redondear(log.reduce((s, f) => s + horasDe(f.seguimiento_gestores), 0) * SEMANAS_MES),
    demoras: notas(log, 'certificado_demora'),
  }
}

function resumirAgente(filas: Fila[]): ResumenAgente {
  const ops = filas.filter((f) => f.area === 'operaciones')
  const tocan = ops.filter((f) => f.tareas.some((t) => TAREAS_AGENTE.includes(t)))
  return {
    personas: tocan.length,
    deOperaciones: ops.length,
    tareas: contar(
      tocan.flatMap((f) => f.tareas.filter((t) => TAREAS_AGENTE.includes(t))),
      TAREAS.operaciones,
    ),
    horasSemana: redondear(tocan.reduce((s, f) => s + horasDe(f.horas), 0)),
  }
}
const redondear = (x: number) => Math.round(x * 10) / 10

/** Cuenta cuántas veces aparece cada opción. `todas` deja también las de cero y no reordena. */
function contar(valores: string[], lista: readonly Opcion[], todas = false): Conteo[] {
  const n = new Map<string, number>()
  for (const v of valores) n.set(v, (n.get(v) ?? 0) + 1)
  return lista
    .map((o) => ({ id: o.id, etiqueta: o.etiqueta, n: n.get(o.id) ?? 0 }))
    .filter((c) => todas || c.n > 0)
    // Con `todas` es una distribución (nunca → diario): se deja el orden de la escala.
    .sort((a, b) => (todas ? 0 : b.n - a.n))
}

const notas = (filas: Fila[], k: keyof Respuesta): Nota[] =>
  filas.filter((f) => String(f[k] ?? '').trim()).map((f) => ({ nombre: f.nombre, texto: String(f[k]) }))

function resumirArea(area: (typeof AREAS)[number], filas: Fila[]): ResumenArea {
  const delArea = filas.filter((f) => f.area === area.id)
  const horasTotal = redondear(delArea.reduce((s, f) => s + horasDe(f.horas), 0))
  return {
    area: area.id,
    etiqueta: area.etiqueta,
    n: delArea.length,
    horasTotal,
    horasPorPersona: delArea.length ? redondear(horasTotal / delArea.length) : 0,
    tareas: contar(delArea.flatMap((f) => f.tareas), TAREAS[area.id]),
    herramientas: contar(delArea.flatMap((f) => f.herramientas), HERRAMIENTAS),
    usoIA: contar(delArea.map((f) => f.uso_ia), USO_IA, true),
    preocupaciones: contar(delArea.flatMap((f) => f.preocupaciones), PREOCUPACIONES),
    deseos: notas(delArea, 'deseo'),
    tareasPrincipales: [
      ...notas(delArea, 'tarea_principal'),
      ...notas(delArea, 'tarea_otra').map((n) => ({ ...n, texto: `Otra tarea que repite: ${n.texto}` })),
    ],
    documentos: delArea
      .filter((f) => f.documento_real !== 'no' && (f.documento_cual || f.documento_real))
      .map((f) => ({ nombre: f.nombre, texto: f.documento_cual, disponible: f.documento_real })),
    restricciones: notas(delArea, 'restricciones'),
    comentarios: [
      ...notas(delArea, 'comentarios'),
      ...notas(delArea, 'otras_herramientas').map((n) => ({ ...n, texto: `Otras herramientas o documentos: ${n.texto}` })),
      ...notas(delArea, 'otra_preocupacion').map((n) => ({ ...n, texto: `Otra preocupación: ${n.texto}` })),
    ],
  }
}

const clavePersona = (nombre: string) =>
  nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * Si una persona llenó la encuesta más de una vez, vale la última (así lo dice
 * la pantalla final). Se reconoce por el nombre, sin tildes ni mayúsculas.
 * Devuelve las vigentes y los ids de las reemplazadas.
 */
export function vigentes(filas: Fila[]): { filas: Fila[]; reemplazadas: Set<number> } {
  const ordenadas = [...filas].sort((a, b) => (a.creado < b.creado ? 1 : a.creado > b.creado ? -1 : b.id - a.id))
  const vistas = new Set<string>()
  const quedan: Fila[] = []
  const reemplazadas = new Set<number>()
  for (const f of ordenadas) {
    const k = clavePersona(f.nombre)
    if (vistas.has(k)) reemplazadas.add(f.id)
    else {
      vistas.add(k)
      quedan.push(f)
    }
  }
  return { filas: quedan, reemplazadas }
}

/** Resume solo las respuestas vigentes (ver `vigentes`). */
export function resumir(todas: Fila[]): Resumen {
  const filas = vigentes(todas).filas
  const areas = AREAS.map((a) => resumirArea(a, filas))
  const fija = areas.find((a) => a.area === 'operaciones')!
  const resto = areas
    .filter((a) => a.area !== 'operaciones')
    // Sin respuestas al final; entre las que tienen, más horas primero.
    .sort((a, b) => Number(b.n > 0) - Number(a.n > 0) || b.horasTotal - a.horasTotal)
  const orden = [fija, ...resto].map((a) => ({
    area: a.area,
    etiqueta: a.etiqueta,
    horasTotal: a.horasTotal,
    n: a.n,
    fija: a.area === 'operaciones',
  }))

  return {
    total: filas.length,
    areasConRespuesta: areas.filter((a) => a.n > 0).length,
    horasTotal: redondear(areas.reduce((s, a) => s + a.horasTotal, 0)),
    sinUsoIA: filas.filter((f) => f.uso_ia === 'nunca').length,
    usoIA: contar(filas.map((f) => f.uso_ia), USO_IA, true),
    preocupaciones: contar(filas.flatMap((f) => f.preocupaciones), PREOCUPACIONES),
    modalidad: contar(filas.map((f) => f.modalidad), MODALIDAD, true),
    ias: contar(filas.flatMap((f) => f.ias), IAS),
    propuestas: resumirPropuestas(filas),
    agente: resumirAgente(filas),
    certificados: resumirCertificados(filas),
    areas,
    orden,
  }
}

/** CSV de todas las respuestas, con etiquetas legibles. Separador `;` para Excel en español. */
export function aCSV(filas: Fila[]): string {
  const cols: [string, (f: Fila) => string][] = [
    ['Fecha', (f) => f.creado.slice(0, 16).replace('T', ' ')],
    ['Nombre', (f) => f.nombre],
    ['Cargo', (f) => f.cargo],
    ['Área', (f) => etiqueta(AREAS, f.area)],
    ['Tareas semanales', (f) => f.tareas.map((t) => etiqueta(TAREAS[f.area] ?? [], t)).join(' | ')],
    ['Otra tarea', (f) => f.tarea_otra],
    ['Horas por semana', (f) => etiqueta(HORAS, f.horas)],
    ['Tarea que más tiempo le quita', (f) => f.tarea_principal],
    ['Papel en propuestas', (f) => (f.propuesta_rol ? etiqueta(PROPUESTA_ROL, f.propuesta_rol) : '')],
    ['Horas por propuesta', (f) => (f.propuesta_horas ? etiqueta(PROPUESTA_HORAS, f.propuesta_horas) : '')],
    ['Propuestas al mes', (f) => (f.propuestas_mes ? etiqueta(PROPUESTAS_MES, f.propuestas_mes) : '')],
    ['Lo que más demora de la propuesta', (f) => f.propuesta_demora],
    ['Certificados al mes', (f) => (f.certificados_mes ? etiqueta(CERTIFICADOS_MES, f.certificados_mes) : '')],
    ['Tiempo por certificado', (f) => (f.certificado_min ? etiqueta(CERTIFICADO_MIN, f.certificado_min) : '')],
    ['Seguimiento a gestores por semana', (f) => (f.seguimiento_gestores ? etiqueta(HORAS, f.seguimiento_gestores) : '')],
    ['Lo que más demora del certificado', (f) => f.certificado_demora],
    ['Documentos', (f) => f.documentos.map((d) => etiqueta(DOCUMENTOS, d)).join(' | ')],
    ['Herramientas', (f) => f.herramientas.map((h) => etiqueta(HERRAMIENTAS, h)).join(' | ')],
    ['Otros documentos o herramientas', (f) => f.otras_herramientas],
    ['Uso de IA', (f) => etiqueta(USO_IA, f.uso_ia)],
    ['IA que ha usado', (f) => f.ias.map((i) => etiqueta(IAS, i)).join(' | ')],
    ['Para qué la usa', (f) => f.para_que],
    ['Preocupaciones', (f) => f.preocupaciones.map((p) => etiqueta(PREOCUPACIONES, p)).join(' | ')],
    ['Otra preocupación', (f) => f.otra_preocupacion],
    ['Tarea que quiere resolver con IA', (f) => f.deseo],
    ['Documento real para el taller', (f) => etiqueta(DOCUMENTO_REAL, f.documento_real)],
    ['Cuál documento', (f) => f.documento_cual],
    ['Modalidad', (f) => etiqueta(MODALIDAD, f.modalidad)],
    ['Sábados que no puede', (f) => f.restricciones],
    ['Comentarios', (f) => f.comentarios],
    ['Respuestas con ayuda de la IA', (f) => (f.ia_campos ?? []).map((c) => etiqueta(CAMPOS_CON_IA, c)).join(' | ')],
  ]
  const celda = (s: string) => `"${String(s ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
  const lineas = [cols.map(([t]) => celda(t)).join(';'), ...filas.map((f) => cols.map(([, g]) => celda(g(f))).join(';'))]
  // BOM para que Excel reconozca las tildes.
  return '﻿' + lineas.join('\r\n')
}
