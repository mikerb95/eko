// Persistencia de las conversaciones del asistente (tabla
// asistente_conversaciones). La fila es el estado del bucle, y reclamarla es un
// UPDATE condicional para que dos clics o dos pestañas no la hagan avanzar dos
// veces.
//
// Cada persona ve las suyas; el admin puede leer las de todos, pero solo el
// dueño las sigue o decide su propuesta (decisión de Mike, 2026-10-27).
//
// La base se inyecta: el motor pasa la conexión de db.ts y las pruebas un
// SQLite temporal.

import type { Client } from '@libsql/client'
import { USO_CERO } from './costo.ts'
import type { Ejecucion, EstadoEjecucion } from './bucle.ts'
import { contarTurnos } from './turnos.ts'

const DIA_MS = 86_400_000
export const RETENCION_DIAS = 30
/** Cada pregunta reenvía todo el historial: a partir de aquí, conviene otra. */
export const MAX_TURNOS = 12

export type Conversacion = Ejecucion & { usuario: string; rol: string; creada: string; actualizada: string }

function aConversacion(f: any): Conversacion {
  return {
    id: String(f.id),
    usuario: String(f.usuario),
    rol: String(f.rol),
    estado: String(f.estado) as EstadoEjecucion,
    pregunta: String(f.pregunta),
    mensajes: JSON.parse(String(f.mensajes || '[]')),
    propuesta: f.propuesta ? JSON.parse(String(f.propuesta)) : null,
    respuesta: f.respuesta ? String(f.respuesta) : null,
    error: f.error ? String(f.error) : null,
    iteraciones: Number(f.iteraciones) || 0,
    // El uso detallado vive en asistente_consumo, una fila por llamada.
    uso: USO_CERO,
    costoUsd: Number(f.costo_usd) || 0,
    creada: String(f.creada),
    actualizada: String(f.actualizada),
  }
}

export async function crearConversacion(db: Client, e: Ejecucion, usuario: { usuario: string; rol: string }, ahora = new Date()): Promise<void> {
  const ts = ahora.toISOString()
  await db.execute({
    sql: `INSERT INTO asistente_conversaciones (id, usuario, rol, estado, pregunta, mensajes, propuesta, respuesta, error, turnos, iteraciones, costo_usd, creada, actualizada)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [e.id, usuario.usuario, usuario.rol, e.estado, e.pregunta.slice(0, 500), JSON.stringify(e.mensajes), e.propuesta ? JSON.stringify(e.propuesta) : '', e.respuesta ?? '', e.error ?? '', contarTurnos(e.mensajes as never), e.iteraciones, e.costoUsd, ts, ts],
  })
}

export async function guardarConversacion(db: Client, e: Ejecucion, ahora = new Date()): Promise<void> {
  await db.execute({
    sql: `UPDATE asistente_conversaciones SET estado = ?, mensajes = ?, propuesta = ?, respuesta = ?, error = ?, turnos = ?, iteraciones = ?, costo_usd = ?, actualizada = ?
          WHERE id = ?`,
    args: [e.estado, JSON.stringify(e.mensajes), e.propuesta ? JSON.stringify(e.propuesta) : '', e.respuesta ?? '', e.error ?? '', contarTurnos(e.mensajes as never), e.iteraciones, e.costoUsd, ahora.toISOString(), e.id],
  })
}

/** Lee una conversación si `quien` es su dueño o es admin. null si no existe o no le corresponde. */
export async function obtenerConversacion(db: Client, id: string, quien: { usuario: string; rol: string }): Promise<Conversacion | null> {
  const r = await db.execute({ sql: 'SELECT * FROM asistente_conversaciones WHERE id = ? LIMIT 1', args: [id] })
  const c = r.rows[0] ? aConversacion(r.rows[0]) : null
  if (!c) return null
  return c.usuario === quien.usuario || quien.rol === 'admin' ? c : null
}

/**
 * Toma una conversación PROPIA para hacerla avanzar, de forma atómica: solo
 * prospera si sigue en uno de los estados `desde`. Ni siquiera el admin puede
 * reclamar una ajena: verla sí, seguirla o decidir por otro no.
 */
export async function reclamar(db: Client, id: string, desde: EstadoEjecucion[], usuario: string, ahora = new Date()): Promise<Conversacion | null> {
  const r = await db.execute({
    sql: `UPDATE asistente_conversaciones SET estado = 'corriendo', actualizada = ?
          WHERE id = ? AND usuario = ? AND estado IN (${desde.map(() => '?').join(',')}) RETURNING *`,
    args: [ahora.toISOString(), id, usuario, ...desde],
  })
  return r.rows[0] ? aConversacion(r.rows[0]) : null
}

export type ConversacionReciente = {
  id: string
  usuario: string
  pregunta: string
  estado: EstadoEjecucion
  actualizada: string
  turnos: number
  /** Hay una escritura esperando el "Aprobar". */
  pendiente: boolean
}

/** Las últimas del usuario; con `todas` (solo admin), las de todo el equipo. */
export async function listarRecientes(db: Client, quien: { usuario: string; rol: string }, opciones: { limite?: number; todas?: boolean } = {}): Promise<ConversacionReciente[]> {
  const todas = !!opciones.todas && quien.rol === 'admin'
  const r = await db.execute({
    sql: `SELECT id, usuario, pregunta, estado, actualizada, turnos FROM asistente_conversaciones
          ${todas ? '' : 'WHERE usuario = ?'} ORDER BY actualizada DESC LIMIT ?`,
    args: todas ? [opciones.limite ?? 6] : [quien.usuario, opciones.limite ?? 6],
  })
  return r.rows.map((f: any) => ({
    id: String(f.id),
    usuario: String(f.usuario),
    pregunta: String(f.pregunta),
    estado: String(f.estado) as EstadoEjecucion,
    actualizada: String(f.actualizada),
    turnos: Number(f.turnos) || 0,
    pendiente: f.estado === 'esperando_aprobacion',
  }))
}

/** Borra conversaciones viejas. El consumo y la auditoría se quedan: son la factura y el rastro. */
export async function purgarConversaciones(db: Client, ahora = new Date()): Promise<number> {
  const limite = new Date(ahora.getTime() - RETENCION_DIAS * DIA_MS).toISOString()
  const r = await db.execute({ sql: 'DELETE FROM asistente_conversaciones WHERE creada < ?', args: [limite] })
  return r.rowsAffected
}
