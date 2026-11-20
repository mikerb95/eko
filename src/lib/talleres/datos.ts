/**
 * Capacitaciones en vivo: estado de la presentación, sala, asistencia y votos
 * (tablas ac_taller_* y ac_asistencia de esquema.ts). Solo servidor.
 */
import { asegurarEsquema, cliente } from '../db.ts'
import type { Taller } from './tipos.ts'
import { claveNombre, type FilaVoto, type RegistroSala } from './reglas.ts'

const ahora = () => new Date().toISOString()
const str = (v: unknown) => (v == null ? '' : String(v))
const num = (v: unknown) => Number(v ?? 0) || 0

async function db() {
  await asegurarEsquema()
  return cliente()
}

/** La presentación cuenta como "en curso" si se movió en las últimas 6 horas. */
export const HORAS_EN_CURSO = 6
/** Un celular cuenta como "en la sala" si se reportó en los últimos 90 segundos. */
export const SEGUNDOS_EN_SALA = 90

export interface EstadoTaller {
  taller: number
  escena: string
  interaccion: string
  updated_at: string
}

export async function leerEstado(taller: number): Promise<EstadoTaller | null> {
  const c = await db()
  const r = await c.execute({ sql: 'SELECT * FROM ac_taller_estado WHERE taller = ?', args: [taller] })
  const x: any = r.rows[0]
  return x ? { taller: num(x.taller), escena: str(x.escena), interaccion: str(x.interaccion), updated_at: str(x.updated_at) } : null
}

export function enCurso(e: EstadoTaller | null, ref = Date.now()): boolean {
  return !!e && ref - Date.parse(e.updated_at) < HORAS_EN_CURSO * 3600_000
}

export async function fijarEstado(taller: number, escena: string, interaccion: string): Promise<void> {
  const c = await db()
  await c.execute({
    sql: `INSERT INTO ac_taller_estado (taller, escena, interaccion, updated_at) VALUES (?, ?, ?, ?)
          ON CONFLICT (taller) DO UPDATE SET escena = excluded.escena, interaccion = excluded.interaccion, updated_at = excluded.updated_at`,
    args: [taller, escena, interaccion, ahora()],
  })
}

/** La capacitación que se está dictando ahora (la última que se movió), si hay. */
export async function tallerEnCurso(): Promise<EstadoTaller | null> {
  const c = await db()
  const r = await c.execute('SELECT * FROM ac_taller_estado ORDER BY updated_at DESC LIMIT 1')
  const x: any = r.rows[0]
  const e = x ? { taller: num(x.taller), escena: str(x.escena), interaccion: str(x.interaccion), updated_at: str(x.updated_at) } : null
  return enCurso(e) ? e : null
}

/** Bloques de la academia programados para hoy a los que corresponde esta capacitación. */
export async function sesionesDeHoy(t: Taller, hoy: string): Promise<{ id: number; titulo: string; modulos: string[] }[]> {
  const c = await db()
  const r = await c.execute({ sql: 'SELECT id, titulo, modulos FROM ac_sesiones WHERE fecha = ?', args: [hoy] })
  return r.rows
    .map((x: any) => {
      let modulos: string[] = []
      try {
        modulos = JSON.parse(str(x.modulos))
      } catch {}
      return { id: num(x.id), titulo: str(x.titulo), modulos: Array.isArray(modulos) ? modulos : [] }
    })
    .filter((s) => s.modulos.some((m) => t.modulos.includes(m)))
}

export interface Asistente extends RegistroSala {
  id: number
  taller: number
  fecha: string
  usuario_id: number
}

const filaAsistente = (x: any): Asistente => ({
  id: num(x.id),
  taller: num(x.taller),
  fecha: str(x.fecha),
  nombre: str(x.nombre),
  apellido: str(x.apellido),
  correo: str(x.correo),
  area: str(x.area),
  usuario_id: num(x.usuario_id),
})

/**
 * Registro desde el QR. Si la misma persona (mismo nombre completo, sin
 * importar tildes ni mayúsculas) ya se registró hoy en esta capacitación, se
 * actualizan su correo y área y se devuelve el mismo registro: así no se
 * duplica si cambia de celular o borra las cookies.
 *
 * Si hay una cuenta activa de la academia con ese mismo nombre, queda
 * vinculada y se marca su asistencia en los bloques de hoy de su ruta (la que
 * cuenta para el certificado). Devuelve el registro y cuántos bloques marcó.
 */
export async function registrarAsistente(t: Taller, hoy: string, r: RegistroSala): Promise<{ asistente: Asistente; marcados: number }> {
  const c = await db()
  const clave = claveNombre(`${r.nombre} ${r.apellido}`)
  const cuentas = await c.execute(`SELECT u.id, u.name FROM users u JOIN ac_inscripciones i ON i.usuario_id = u.id WHERE u.active = 1`)
  const cuenta = cuentas.rows.find((x: any) => claveNombre(str(x.name)) === clave) as any
  const usuario_id = cuenta ? num(cuenta.id) : 0
  const res = await c.execute({
    // cargo ya no se pide (Mike, 2026-11-19): la columna queda vacía.
    sql: `INSERT INTO ac_taller_asistentes (taller, fecha, nombre, apellido, cargo, correo, area, clave, usuario_id, created_at)
          VALUES (?, ?, ?, ?, '', ?, ?, ?, ?, ?)
          ON CONFLICT (taller, fecha, clave) DO UPDATE SET nombre = excluded.nombre, apellido = excluded.apellido,
            correo = excluded.correo, area = excluded.area, usuario_id = excluded.usuario_id
          RETURNING *`,
    args: [t.n, hoy, r.nombre, r.apellido, r.correo, r.area, clave, usuario_id, ahora()],
  })
  const asistente = filaAsistente(res.rows[0])
  const marcados = cuenta ? await marcarAsistenciaAcademia(t, usuario_id, hoy) : 0
  return { asistente, marcados }
}

/**
 * Reserva el envío del enlace de entrada: no más de uno por persona cada
 * SEGUNDOS_ENTRE_ENLACES (quien toca dos veces el botón no recibe dos correos
 * y el formulario público no sirve para llenar buzones ajenos). Devuelve
 * false si hay que esperar.
 */
export const SEGUNDOS_ENTRE_ENLACES = 60
export async function reservarEnlace(asistente_id: number): Promise<boolean> {
  const c = await db()
  const limite = new Date(Date.now() - SEGUNDOS_ENTRE_ENLACES * 1000).toISOString()
  const r = await c.execute({
    sql: `UPDATE ac_taller_asistentes SET enlace_at = ? WHERE id = ? AND (enlace_at = '' OR enlace_at < ?)`,
    args: [ahora(), asistente_id, limite],
  })
  return r.rowsAffected > 0
}

/** Si el correo no salió, la persona puede volver a intentarlo de inmediato. */
export async function liberarEnlace(asistente_id: number): Promise<void> {
  const c = await db()
  await c.execute({ sql: `UPDATE ac_taller_asistentes SET enlace_at = '' WHERE id = ?`, args: [asistente_id] })
}

export async function asistenteDe(id: number): Promise<Asistente | null> {
  const c = await db()
  const r = await c.execute({ sql: 'SELECT * FROM ac_taller_asistentes WHERE id = ?', args: [id] })
  return r.rows[0] ? filaAsistente(r.rows[0]) : null
}

/**
 * Asistencia de la academia (certificado): todos los bloques de hoy de esta
 * capacitación. No se filtra por área: todo el equipo asiste a todos los
 * sábados (Mike, 2026-11-19).
 */
async function marcarAsistenciaAcademia(t: Taller, usuario_id: number, hoy: string): Promise<number> {
  const sesiones = await sesionesDeHoy(t, hoy)
  if (!sesiones.length) return 0
  const c = await db()
  const ts = ahora()
  await c.batch(
    sesiones.map((s) => ({ sql: 'INSERT OR IGNORE INTO ac_asistencia (sesion_id, usuario_id, created_at) VALUES (?, ?, ?)', args: [s.id, usuario_id, ts] })),
    'write',
  )
  return sesiones.length
}

/** El celular sigue abierto en la sala: alimenta el contador del proyector. */
export async function marcarEnSala(taller: number, asistente_id: number): Promise<void> {
  const c = await db()
  await c.execute({
    sql: `INSERT INTO ac_taller_sala (taller, usuario_id, visto_at) VALUES (?, ?, ?)
          ON CONFLICT (taller, usuario_id) DO UPDATE SET visto_at = excluded.visto_at`,
    args: [taller, asistente_id, ahora()],
  })
}

export async function enSala(taller: number): Promise<number> {
  const c = await db()
  const desde = new Date(Date.now() - SEGUNDOS_EN_SALA * 1000).toISOString()
  const r = await c.execute({ sql: 'SELECT COUNT(*) AS n FROM ac_taller_sala WHERE taller = ? AND visto_at >= ?', args: [taller, desde] })
  return num((r.rows[0] as any)?.n)
}

/** Quienes se registraron hoy en esta capacitación, en orden de llegada. */
export async function asistentesDeHoy(taller: number, hoy: string): Promise<Asistente[]> {
  const c = await db()
  const r = await c.execute({ sql: 'SELECT * FROM ac_taller_asistentes WHERE taller = ? AND fecha = ? ORDER BY id', args: [taller, hoy] })
  return r.rows.map(filaAsistente)
}

/** Prácticas con el revisor que hizo hoy una persona desde la sala. */
export async function practicasSalaDeHoy(asistente_id: number, hoy: string): Promise<number> {
  const c = await db()
  const r = await c.execute({
    sql: 'SELECT COUNT(*) AS n FROM ac_taller_practicas WHERE asistente_id = ? AND substr(created_at, 1, 10) >= ?',
    args: [asistente_id, hoy],
  })
  return num((r.rows[0] as any)?.n)
}

export async function guardarPracticaSala(taller: number, asistente_id: number, instruccion: string, revision: unknown): Promise<void> {
  const c = await db()
  await c.execute({
    sql: 'INSERT INTO ac_taller_practicas (taller, asistente_id, instruccion, revision, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [taller, asistente_id, instruccion, JSON.stringify(revision), ahora()],
  })
}

export interface PreguntaSala {
  id: number
  escena: string
  texto: string
  nombre: string
  area: string
  created_at: string
}

export async function preguntasDeHoyDe(asistente_id: number, hoy: string): Promise<number> {
  const c = await db()
  const r = await c.execute({ sql: 'SELECT COUNT(*) AS n FROM ac_taller_preguntas WHERE asistente_id = ? AND fecha = ?', args: [asistente_id, hoy] })
  return num((r.rows[0] as any)?.n)
}

export async function guardarPregunta(taller: number, hoy: string, asistente_id: number, escena: string, texto: string): Promise<void> {
  const c = await db()
  await c.execute({
    sql: 'INSERT INTO ac_taller_preguntas (taller, fecha, asistente_id, escena, texto, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [taller, hoy, asistente_id, escena, texto, ahora()],
  })
}

/** Preguntas de hoy sin responder, de la más antigua a la más nueva. */
export async function preguntasPendientes(taller: number, hoy: string): Promise<PreguntaSala[]> {
  const c = await db()
  const r = await c.execute({
    sql: `SELECT p.id, p.escena, p.texto, p.created_at, a.nombre, a.apellido, a.area
          FROM ac_taller_preguntas p JOIN ac_taller_asistentes a ON a.id = p.asistente_id
          WHERE p.taller = ? AND p.fecha = ? AND p.respondida = 0 ORDER BY p.id`,
    args: [taller, hoy],
  })
  return r.rows.map((x: any) => ({
    id: num(x.id),
    escena: str(x.escena),
    texto: str(x.texto),
    nombre: `${str(x.nombre)} ${str(x.apellido)}`.trim(),
    area: str(x.area),
    created_at: str(x.created_at),
  }))
}

export async function marcarRespondida(taller: number, id: number): Promise<void> {
  const c = await db()
  await c.execute({ sql: 'UPDATE ac_taller_preguntas SET respondida = 1 WHERE id = ? AND taller = ?', args: [id, taller] })
}

export async function votar(taller: number, interaccion: string, pregunta: string, usuario_id: number, valor: string): Promise<void> {
  const c = await db()
  await c.execute({
    sql: `INSERT INTO ac_taller_respuestas (taller, interaccion, pregunta, usuario_id, valor, updated_at) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT (taller, interaccion, pregunta, usuario_id) DO UPDATE SET valor = excluded.valor, updated_at = excluded.updated_at`,
    args: [taller, interaccion, pregunta, usuario_id, valor, ahora()],
  })
}

export async function respuestas(taller: number, interaccion: string): Promise<FilaVoto[]> {
  const c = await db()
  const r = await c.execute({ sql: 'SELECT pregunta, valor, usuario_id FROM ac_taller_respuestas WHERE taller = ? AND interaccion = ?', args: [taller, interaccion] })
  return r.rows.map((x: any) => ({ pregunta: str(x.pregunta), valor: str(x.valor), usuario_id: num(x.usuario_id) }))
}

/** Las respuestas de una persona en una interacción: { pregunta: valor }. */
export async function misRespuestas(taller: number, interaccion: string, usuario_id: number): Promise<Record<string, string>> {
  const c = await db()
  const r = await c.execute({
    sql: 'SELECT pregunta, valor FROM ac_taller_respuestas WHERE taller = ? AND interaccion = ? AND usuario_id = ?',
    args: [taller, interaccion, usuario_id],
  })
  return Object.fromEntries(r.rows.map((x: any) => [str(x.pregunta), str(x.valor)]))
}
