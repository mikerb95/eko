/**
 * Persistencia del diagnóstico: respuestas y si la encuesta está abierta.
 *
 * La encuesta vive en /ia, una dirección corta y sin código para que sea fácil
 * de comunicar al equipo. El control es el interruptor del panel: cerrada, la
 * página no muestra el formulario y la API rechaza el envío. Contra envíos de
 * extraños quedan el noindex, el honeypot, el tope por IP y la opción de borrar
 * respuestas desde el panel.
 */
import { asegurarEsquema, cliente } from '../db'
import type { Respuesta } from './preguntas'
import type { Fila } from './resumen'

const CLAVE = 'diagnostico'
/** Sube si cambia el texto de la autorización de la encuesta. */
export const CONSENT_DIAGNOSTICO = 'diagnostico-1.0'

export interface EstadoEncuesta {
  abierta: boolean
  /** Si alguna vez se abrió: distingue "se abre pronto" de "ya cerró". */
  usada: boolean
}

export async function leerEstado(): Promise<EstadoEncuesta> {
  await asegurarEsquema()
  const r = await cliente().execute({ sql: 'SELECT valor FROM ajustes WHERE clave = ?', args: [CLAVE] })
  const fila = r.rows[0]
  if (!fila) return { abierta: false, usada: false }
  try {
    return { abierta: !!JSON.parse(String(fila.valor)).abierta, usada: true }
  } catch {
    return { abierta: false, usada: true }
  }
}

async function guardarEstado(abierta: boolean): Promise<EstadoEncuesta> {
  await asegurarEsquema()
  await cliente().execute({
    sql: `INSERT INTO ajustes (clave, valor, actualizado) VALUES (?, ?, ?)
          ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor, actualizado = excluded.actualizado`,
    args: [CLAVE, JSON.stringify({ abierta }), new Date().toISOString()],
  })
  return { abierta, usada: true }
}

export const abrirEncuesta = () => guardarEstado(true)
export const cerrarEncuesta = () => guardarEstado(false)

export async function encuestaAbierta(): Promise<boolean> {
  return (await leerEstado()).abierta
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
      propuesta_rol: '', propuesta_horas: '', propuestas_mes: '', propuesta_demora: '',
      certificados_mes: '', certificado_min: '', seguimiento_gestores: '', certificado_demora: '',
      otras_herramientas: '', otra_preocupacion: '', comentarios: '', ia_aclaraciones: [],
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
