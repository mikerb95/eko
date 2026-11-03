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
  DOCUMENTO_REAL,
  DOCUMENTOS,
  HERRAMIENTAS,
  HORAS,
  IAS,
  MODALIDAD,
  PREOCUPACIONES,
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
  /** Áreas en el orden sugerido para los talleres. */
  orden: { area: AreaId; etiqueta: string; horasTotal: number; n: number; fija: boolean }[]
}

const horasDe = (id: string) => HORAS.find((h) => h.id === id)?.valor ?? 0
const redondear = (x: number) => Math.round(x * 10) / 10

/** Cuenta cuántas veces aparece cada opción. `todas` deja también las de cero. */
function contar(valores: string[], lista: readonly Opcion[], todas = false): Conteo[] {
  const n = new Map<string, number>()
  for (const v of valores) n.set(v, (n.get(v) ?? 0) + 1)
  return lista
    .map((o) => ({ id: o.id, etiqueta: o.etiqueta, n: n.get(o.id) ?? 0 }))
    .filter((c) => todas || c.n > 0)
    .sort((a, b) => b.n - a.n)
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
  }
}

export function resumir(filas: Fila[]): Resumen {
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
    ['Documentos', (f) => f.documentos.map((d) => etiqueta(DOCUMENTOS, d)).join(' | ')],
    ['Herramientas', (f) => f.herramientas.map((h) => etiqueta(HERRAMIENTAS, h)).join(' | ')],
    ['Uso de IA', (f) => etiqueta(USO_IA, f.uso_ia)],
    ['IA que ha usado', (f) => f.ias.map((i) => etiqueta(IAS, i)).join(' | ')],
    ['Para qué la usa', (f) => f.para_que],
    ['Preocupaciones', (f) => f.preocupaciones.map((p) => etiqueta(PREOCUPACIONES, p)).join(' | ')],
    ['Tarea que quiere resolver con IA', (f) => f.deseo],
    ['Documento real para el taller', (f) => etiqueta(DOCUMENTO_REAL, f.documento_real)],
    ['Cuál documento', (f) => f.documento_cual],
    ['Modalidad', (f) => etiqueta(MODALIDAD, f.modalidad)],
    ['Sábados que no puede', (f) => f.restricciones],
  ]
  const celda = (s: string) => `"${String(s ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
  const lineas = [cols.map(([t]) => celda(t)).join(';'), ...filas.map((f) => cols.map(([, g]) => celda(g(f))).join(';'))]
  // BOM para que Excel reconozca las tildes.
  return '﻿' + lineas.join('\r\n')
}
