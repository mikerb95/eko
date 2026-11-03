/**
 * Persistencia del diagnóstico: respuestas y estado del enlace.
 *
 * El enlace de la encuesta lleva un código (`/diagnostico-ia?c=…`). Sin código
 * válido o con la encuesta cerrada, la página no muestra el formulario y la API
 * rechaza el envío. Así un enlace que se reenvía por fuera de Ekosolv se
 * invalida generando uno nuevo desde el panel, sin tocar código.
 */
import { asegurarEsquema, cliente } from '../db'
import type { Respuesta } from './preguntas'
import type { Fila } from './resumen'

const CLAVE = 'diagnostico'
/** Sube si cambia el texto de la autorización de la encuesta. */
export const CONSENT_DIAGNOSTICO = 'diagnostico-1.0'

export interface EstadoEnlace {
  codigo: string
  abierta: boolean
}

function nuevoCodigo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function leerEnlace(): Promise<EstadoEnlace> {
  await asegurarEsquema()
  const r = await cliente().execute({ sql: 'SELECT valor FROM ajustes WHERE clave = ?', args: [CLAVE] })
  try {
    const v = JSON.parse(String(r.rows[0]?.valor ?? ''))
    return { codigo: String(v.codigo || ''), abierta: !!v.abierta && !!v.codigo }
  } catch {
    return { codigo: '', abierta: false }
  }
}

async function guardarEnlace(e: EstadoEnlace): Promise<EstadoEnlace> {
  await asegurarEsquema()
  await cliente().execute({
    sql: `INSERT INTO ajustes (clave, valor, actualizado) VALUES (?, ?, ?)
          ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor, actualizado = excluded.actualizado`,
    args: [CLAVE, JSON.stringify(e), new Date().toISOString()],
  })
  return e
}

/** Abre la encuesta. Conserva el código si ya había uno, para no romper el enlace enviado. */
export async function abrirEncuesta(): Promise<EstadoEnlace> {
  const e = await leerEnlace()
  return guardarEnlace({ codigo: e.codigo || nuevoCodigo(), abierta: true })
}

export async function cerrarEncuesta(): Promise<EstadoEnlace> {
  const e = await leerEnlace()
  return guardarEnlace({ codigo: e.codigo, abierta: false })
}

/** Código nuevo: el enlace anterior deja de funcionar. */
export async function regenerarEnlace(): Promise<EstadoEnlace> {
  const e = await leerEnlace()
  return guardarEnlace({ codigo: nuevoCodigo(), abierta: e.abierta })
}

/** `true` si el código corresponde al enlace vigente y la encuesta está abierta. */
export async function codigoValido(codigo: string | null | undefined): Promise<boolean> {
  if (!codigo) return false
  const e = await leerEnlace()
  return e.abierta && e.codigo === codigo
}

export async function guardarRespuesta(r: Respuesta): Promise<number> {
  await asegurarEsquema()
  const ahora = new Date().toISOString()
  const res = await cliente().execute({
    sql: `INSERT INTO diagnostico_respuestas (area, nombre, datos, consent_at, consent_version, creado)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [r.area, r.nombre, JSON.stringify(r), ahora, CONSENT_DIAGNOSTICO, ahora],
  })
  return Number(res.lastInsertRowid)
}

export async function listarRespuestas(): Promise<Fila[]> {
  await asegurarEsquema()
  const res = await cliente().execute('SELECT id, datos, creado FROM diagnostico_respuestas ORDER BY creado DESC')
  return res.rows.map((row) => {
    let datos: Partial<Respuesta> = {}
    try {
      datos = JSON.parse(String(row.datos))
    } catch {
      // Fila dañada: se muestra vacía en vez de tumbar el panel.
    }
    return {
      // Valores por defecto por si una versión vieja del cuestionario no traía el campo.
      nombre: '', cargo: '', area: 'operaciones', tareas: [], tarea_otra: '', horas: '', tarea_principal: '',
      documentos: [], herramientas: [], uso_ia: '', ias: [], para_que: '', preocupaciones: [], deseo: '',
      documento_real: '', documento_cual: '', modalidad: '', restricciones: '',
      ...datos,
      id: Number(row.id),
      creado: String(row.creado),
    } as Fila
  })
}

export async function eliminarRespuesta(id: number): Promise<void> {
  await asegurarEsquema()
  await cliente().execute({ sql: 'DELETE FROM diagnostico_respuestas WHERE id = ?', args: [id] })
}
