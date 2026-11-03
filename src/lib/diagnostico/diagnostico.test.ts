import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validarRespuesta, ErrorDiagnostico } from './validar.ts'
import { aCSV, resumir, vigentes, type Fila } from './resumen.ts'
import type { Respuesta } from './preguntas.ts'

const base = {
  nombre: 'Ana Pérez',
  cargo: 'Consultora',
  area: 'operaciones',
  tareas_operaciones: 'autos, ica, inventada',
  otra_operaciones: '',
  horas: '5_10',
  tarea_principal: 'Leer autos de la CAR',
  documentos: 'pdf_escaneado, excel',
  herramientas: 'excel',
  uso_ia: 'probado',
  ias: 'chatgpt',
  preocupaciones: 'inventa',
  deseo: 'Sacar plazos de un auto',
  documento_real: 'si',
  documento_cual: 'Auto de seguimiento',
  modalidad: 'presencial',
}

test('validar: separa las opciones múltiples y descarta las que no existen', () => {
  const r = validarRespuesta(base)
  assert.deepEqual(r.tareas, ['autos', 'ica'])
  assert.deepEqual(r.documentos, ['pdf_escaneado', 'excel'])
  assert.equal(r.area, 'operaciones')
})

test('validar: solo cuentan las tareas del área elegida', () => {
  const r = validarRespuesta({ ...base, area: 'ventas', tareas_ventas: 'brief', tareas_operaciones: 'autos' })
  assert.deepEqual(r.tareas, ['brief'])
})

test('validar: exige área, tareas y lo mínimo para el diagnóstico', () => {
  assert.throws(() => validarRespuesta({ ...base, area: 'contabilidad' }), ErrorDiagnostico)
  assert.throws(() => validarRespuesta({ ...base, nombre: ' ' }), ErrorDiagnostico)
  assert.throws(() => validarRespuesta({ ...base, tareas_operaciones: '' }), /al menos una tarea/)
  assert.doesNotThrow(() => validarRespuesta({ ...base, tareas_operaciones: '', otra_operaciones: 'Visitas de campo' }))
  assert.throws(() => validarRespuesta({ ...base, horas: '99' }), /horas/)
  assert.throws(() => validarRespuesta({ ...base, deseo: '' }), ErrorDiagnostico)
})

let id = 0
function fila(r: Partial<Respuesta>, creado = '2026-11-02T10:00:00Z'): Fila {
  return { ...validarRespuesta(base), ...r, id: ++id, creado }
}

test('vigentes: si una persona responde dos veces, vale la última', () => {
  const vieja = fila({ nombre: 'Ana Pérez', horas: '2_5' }, '2026-11-01T10:00:00Z')
  const nueva = fila({ nombre: 'ana perez ', horas: 'mas_20' }, '2026-11-02T10:00:00Z')
  const { filas, reemplazadas } = vigentes([vieja, nueva])
  assert.equal(filas.length, 1)
  assert.equal(filas[0].horas, 'mas_20')
  assert.ok(reemplazadas.has(vieja.id))
})

test('resumir: Operaciones primero y las demás por horas', () => {
  const filas = [
    fila({ nombre: 'A', area: 'operaciones', horas: 'menos_2' }),
    fila({ nombre: 'B', area: 'finanzas', tareas: ['cartera'], horas: '10_20' }),
    fila({ nombre: 'C', area: 'ventas', tareas: ['brief'], horas: '2_5' }),
    fila({ nombre: 'D', area: 'ventas', tareas: ['brief', 'cotizar'], horas: '2_5', uso_ia: 'nunca' }),
  ]
  const r = resumir(filas)
  assert.deepEqual(r.orden.map((o) => o.area), ['operaciones', 'finanzas', 'ventas', 'logistica', 'mercadeo', 'gerencia'])
  assert.equal(r.total, 4)
  assert.equal(r.areasConRespuesta, 3)
  assert.equal(r.sinUsoIA, 1)
  const ventas = r.areas.find((a) => a.area === 'ventas')!
  assert.equal(ventas.horasTotal, 7)
  assert.equal(ventas.horasPorPersona, 3.5)
  assert.deepEqual(ventas.tareas[0], { id: 'brief', etiqueta: 'Pasar un Brief de Zoho CRM a propuesta', n: 2 })
})

test('aCSV: etiquetas legibles, comillas escapadas y BOM', () => {
  const csv = aCSV([fila({ nombre: 'Luis "Lucho"', tarea_principal: 'línea 1\nlínea 2' })])
  assert.ok(csv.startsWith('﻿'))
  assert.ok(csv.includes('"Luis ""Lucho"""'))
  assert.ok(csv.includes('Leer autos, resoluciones y requerimientos'))
  assert.ok(!csv.includes('línea 1\nlínea 2'))
})

test('validar: propuestas solo para las áreas que las hacen y si participa', () => {
  const r = validarRespuesta({ ...base, area: 'ventas', tareas_ventas: 'brief', propuesta_rol: 'arma', propuesta_horas: '3_6', propuestas_mes: '11_20' })
  assert.equal(r.propuesta_horas, '3_6')
  const fin = validarRespuesta({ ...base, area: 'finanzas', tareas_finanzas: 'cartera', propuesta_rol: 'arma', propuesta_horas: '3_6' })
  assert.equal(fin.propuesta_rol, '')
  const no = validarRespuesta({ ...base, propuesta_rol: 'no', propuesta_horas: '3_6' })
  assert.equal(no.propuesta_horas, '')
})

test('resumir: horas al mes en propuestas, volumen y horas por propuesta', () => {
  const r = resumir([
    fila({ nombre: 'Vende', area: 'ventas', propuesta_rol: 'arma', propuesta_horas: '3_6', propuestas_mes: '11_20' }),
    fila({ nombre: 'Gerente', area: 'gerencia', propuesta_rol: 'revisa', propuesta_horas: 'menos_1', propuestas_mes: '11_20' }),
    fila({ nombre: 'Técnica', area: 'operaciones', tareas: ['autos', 'ica'], horas: '5_10', propuesta_rol: 'tecnica', propuesta_horas: '1_3', propuestas_mes: '6_10' }),
    fila({ nombre: 'Otra', area: 'operaciones', tareas: ['ica'], propuesta_rol: 'no' }),
  ])
  // 4,5×15 + 0,5×15 + 2×8 = 67,5 + 7,5 + 16
  assert.equal(r.propuestas.horasMes, 91)
  assert.equal(r.propuestas.volumen, 15)
  assert.equal(r.propuestas.horasPorPropuesta, 6.1)
  assert.equal(r.propuestas.personas.length, 3)
  assert.equal(r.agente.personas, 1)
  assert.equal(r.agente.deOperaciones, 2)
  assert.equal(r.agente.horasSemana, 7.5)
})

test('certificados: solo Logística, obligatorios para ella, y horas al mes', () => {
  const base_log = { ...base, area: 'logistica', tareas_logistica: 'cert_disposicion' }
  assert.throws(() => validarRespuesta(base_log), /certificados/)
  const r = validarRespuesta({ ...base_log, certificados_mes: '31_60', certificado_min: '30_60', seguimiento_gestores: '2_5' })
  assert.equal(r.certificado_min, '30_60')
  const ops = validarRespuesta({ ...base, certificados_mes: '31_60', certificado_min: '30_60' })
  assert.equal(ops.certificados_mes, '')
  const res = resumir([fila({ ...r, nombre: 'Log' })])
  // 45 certificados × 45 min = 33,75 h; 3,5 h/semana × 4,33
  assert.equal(res.certificados.certificadosMes, 45)
  assert.equal(res.certificados.horasMesEmision, 33.8)
  assert.equal(res.certificados.minutosPorCertificado, 45)
  assert.equal(res.certificados.horasMesSeguimiento, 15.2)
})

test('campos libres: se guardan y salen en el resumen del área y en el CSV', () => {
  const r = validarRespuesta({ ...base, otras_herramientas: 'SharePoint', otra_preocupacion: 'Que se caiga internet', comentarios: 'Hago visitas de campo' })
  const res = resumir([fila({ ...r, nombre: 'Libre' })])
  const ops = res.areas.find((a) => a.area === 'operaciones')!
  assert.deepEqual(ops.comentarios.map((c) => c.texto), ['Hago visitas de campo', 'Otras herramientas o documentos: SharePoint', 'Otra preocupación: Que se caiga internet'])
  assert.ok(aCSV([fila({ ...r, nombre: 'Libre' })]).includes('Hago visitas de campo'))
})

// ── Asistente con IA de la encuesta ──────────────────────────────────────

import { CAMPOS_IA, campoIA, mensajeIA, MAX_VUELTAS, pulirSalida, validarEntradaIA } from './ia.ts'
import { CAMPOS_CON_IA } from './preguntas.ts'

test('ia: los campos del asistente y los que guarda la respuesta son los mismos', () => {
  assert.deepEqual(Object.keys(CAMPOS_IA).sort(), CAMPOS_CON_IA.map((c) => c.id).sort())
})

test('ia: otra_<área> cuenta como tarea_otra y un campo cualquiera no pasa', () => {
  assert.equal(campoIA('otra_logistica'), 'tarea_otra')
  assert.equal(campoIA('deseo'), 'deseo')
  assert.equal(campoIA('nombre'), null)
  assert.equal(validarEntradaIA({ campo: 'nombre', borrador: 'hola mundo' }), null)
  assert.equal(validarEntradaIA({ campo: 'deseo', borrador: 'ab' }), null)
  assert.equal(validarEntradaIA({ campo: 'deseo', borrador: 'leer autos', extra: 1 }), null)
})

test('ia: quita aclaraciones vacías y tapa correos y celulares antes del modelo', () => {
  const e = validarEntradaIA({
    campo: 'tarea_principal',
    borrador: 'Llamo al gestor al 300 123 4567 o le escribo a juan@gestor.co',
    contexto: { area: 'Logística', tareas: ['Pedir certificados'] },
    aclaraciones: [{ pregunta: '¿Cada cuánto?', respuesta: '' }, { pregunta: '¿Cuánto tarda?', respuesta: 'una hora' }],
  })!
  assert.equal(e.aclaraciones.length, 1)
  const m = mensajeIA(e)
  assert.doesNotMatch(m, /300 123 4567|juan@gestor/)
  assert.match(m, /\[dato oculto\]/)
  assert.match(m, /Área: Logística/)
  assert.match(m, /una hora/)
})

test('ia: la salida sale sin rayas ni voseo, con máximo dos preguntas y ninguna en la última vuelta', () => {
  const s = { propuesta: 'Reviso autos — cada semana', preguntas: ['¿Podés contarme cuánto tarda?', 'b', 'c'], nota: 'Ordené su respuesta.' }
  const r = pulirSalida(s, 1)
  assert.doesNotMatch(r.propuesta, /[—–]/)
  assert.equal(r.preguntas.length, 2)
  assert.doesNotMatch(r.preguntas[0]!, /podés|contame/i)
  assert.deepEqual(pulirSalida(s, MAX_VUELTAS).preguntas, [])
})

test('validar: las aclaraciones de la IA van aparte y el texto de la persona no cambia', () => {
  const ia_aclaraciones = JSON.stringify([
    { campo: 'deseo', pregunta: '¿Cuántas páginas?', respuesta: 'Unas 20' },
    { campo: 'deseo', pregunta: '¿Cuántas páginas?', respuesta: 'repetida' },
    { campo: 'nombre', pregunta: 'x', respuesta: 'y' },
    { campo: 'tarea_principal', pregunta: '¿Cada cuánto?', respuesta: '' },
    { campo: 'certificado_demora', pregunta: '¿Qué parte?', respuesta: 'Cruzar cifras' },
  ])
  const r = validarRespuesta({ ...base, ia_aclaraciones })
  assert.equal(r.deseo, base.deseo)
  // certificado_demora no aplica a Operaciones.
  assert.deepEqual(r.ia_aclaraciones, [{ campo: 'deseo', pregunta: '¿Cuántas páginas?', respuesta: 'Unas 20' }])
  assert.deepEqual(validarRespuesta({ ...base, ia_aclaraciones: '{roto' }).ia_aclaraciones, [])
  assert.deepEqual(validarRespuesta(base).ia_aclaraciones, [])
})

test('resumen: las aclaraciones salen como detalles de la nota y en el CSV', () => {
  const r = validarRespuesta({ ...base, ia_aclaraciones: JSON.stringify([{ campo: 'deseo', pregunta: '¿Cuántas páginas?', respuesta: 'Unas 20' }]) })
  const fila = { ...r, id: 1, creado: '2026-11-03T10:00:00Z' } as Fila
  const ops = resumir([fila]).areas.find((a) => a.area === 'operaciones')!
  assert.deepEqual(ops.deseos[0]!.detalles, ['¿Cuántas páginas? Unas 20'])
  assert.equal(ops.deseos[0]!.texto, base.deseo)
  assert.match(aCSV([fila]), /Tarea que quiere resolver con IA: ¿Cuántas páginas\? Unas 20/)
})
