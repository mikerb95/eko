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
  assert.deepEqual(r.orden.map((o) => o.area), ['operaciones', 'finanzas', 'ventas', 'mercadeo', 'gerencia'])
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
