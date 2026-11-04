/**
 * Persistencia de /propuesta: las preguntas del chat y el plan que elige el
 * gerente. La página va con noindex, fuera del sitemap y de src/lib/rutas.ts.
 */
import { asegurarEsquema, cliente } from '../db'
import type { Calculo, IdCapacitacion, IdPlan } from './datos'

export interface Pregunta {
  id: number
  sesion: string
  pregunta: string
  respuesta: string
  aMike: boolean
  motivo: string
  creado: string
}

export async function guardarPregunta(p: Omit<Pregunta, 'id' | 'creado'> & { costoUsd: number }): Promise<void> {
  await asegurarEsquema()
  await cliente().execute({
    sql: `INSERT INTO propuesta_preguntas (sesion, pregunta, respuesta, a_mike, motivo, costo_usd, creado)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [p.sesion, p.pregunta, p.respuesta, p.aMike ? 1 : 0, p.motivo, p.costoUsd, new Date().toISOString()],
  })
}

export async function listarPreguntas(): Promise<Pregunta[]> {
  await asegurarEsquema()
  const r = await cliente().execute('SELECT * FROM propuesta_preguntas ORDER BY id DESC LIMIT 500')
  return r.rows.map((f) => ({
    id: Number(f.id),
    sesion: String(f.sesion),
    pregunta: String(f.pregunta),
    respuesta: String(f.respuesta),
    aMike: Number(f.a_mike) === 1,
    motivo: String(f.motivo),
    creado: String(f.creado),
  }))
}

export interface ElegidoPlan {
  id: number
  plan: IdPlan | ''
  capacitacion: IdCapacitacion
  nombre: string
  cargo: string
  comentario: string
  calculo: Calculo | null
  creado: string
}

export async function guardarEleccion(e: Omit<ElegidoPlan, 'id' | 'creado'>): Promise<number> {
  await asegurarEsquema()
  const r = await cliente().execute({
    sql: `INSERT INTO propuesta_elecciones (plan, capacitacion, nombre, cargo, comentario, calculo, creado)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [e.plan, e.capacitacion, e.nombre, e.cargo, e.comentario, JSON.stringify(e.calculo), new Date().toISOString()],
  })
  return Number(r.lastInsertRowid)
}

export async function listarElecciones(): Promise<ElegidoPlan[]> {
  await asegurarEsquema()
  const r = await cliente().execute('SELECT * FROM propuesta_elecciones ORDER BY id DESC LIMIT 100')
  return r.rows.map((f) => {
    let calculo: Calculo | null = null
    try {
      calculo = JSON.parse(String(f.calculo))
    } catch {}
    return {
      id: Number(f.id),
      plan: String(f.plan) as IdPlan | '',
      capacitacion: String(f.capacitacion) as IdCapacitacion,
      nombre: String(f.nombre),
      cargo: String(f.cargo),
      comentario: String(f.comentario),
      calculo,
      creado: String(f.creado),
    }
  })
}

export async function borrarPregunta(id: number): Promise<void> {
  await asegurarEsquema()
  await cliente().execute({ sql: 'DELETE FROM propuesta_preguntas WHERE id = ?', args: [id] })
}

export async function borrarEleccion(id: number): Promise<void> {
  await asegurarEsquema()
  await cliente().execute({ sql: 'DELETE FROM propuesta_elecciones WHERE id = ?', args: [id] })
}
