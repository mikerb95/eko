/**
 * Capacitaciones en vivo: estado de la presentación, sala, asistencia y votos
 * (tablas ac_taller_* y ac_asistencia de esquema.ts). Solo servidor.
 */
import { asegurarEsquema, cliente } from '../db.ts'
import { rutaDe } from '../academia/reglas.ts'
import type { Taller } from './tipos.ts'
import type { FilaVoto } from './reglas.ts'

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

/**
 * La persona abrió la sala desde su celular: queda en la sala y, si está
 * inscrita y hoy hay un bloque de su ruta para esta capacitación, queda
 * marcada su asistencia. Devuelve cuántos bloques se marcaron.
 */
export async function entrarASala(t: Taller, usuario_id: number, area: string, hoy: string): Promise<number> {
  const c = await db()
  await c.execute({
    sql: `INSERT INTO ac_taller_sala (taller, usuario_id, visto_at) VALUES (?, ?, ?)
          ON CONFLICT (taller, usuario_id) DO UPDATE SET visto_at = excluded.visto_at`,
    args: [t.n, usuario_id, ahora()],
  })
  if (!area) return 0
  const ruta = rutaDe(area)
  const sesiones = (await sesionesDeHoy(t, hoy)).filter((s) => s.modulos.some((m) => ruta.includes(m) && t.modulos.includes(m)))
  if (!sesiones.length) return 0
  const ts = ahora()
  await c.batch(
    sesiones.map((s) => ({ sql: 'INSERT OR IGNORE INTO ac_asistencia (sesion_id, usuario_id, created_at) VALUES (?, ?, ?)', args: [s.id, usuario_id, ts] })),
    'write',
  )
  return sesiones.length
}

export async function enSala(taller: number): Promise<number> {
  const c = await db()
  const desde = new Date(Date.now() - SEGUNDOS_EN_SALA * 1000).toISOString()
  const r = await c.execute({ sql: 'SELECT COUNT(*) AS n FROM ac_taller_sala WHERE taller = ? AND visto_at >= ?', args: [taller, desde] })
  return num((r.rows[0] as any)?.n)
}

/** Asistentes marcados hoy en los bloques de esta capacitación. */
export async function asistentesDeHoy(t: Taller, hoy: string): Promise<number> {
  const sesiones = await sesionesDeHoy(t, hoy)
  if (!sesiones.length) return 0
  const c = await db()
  const r = await c.execute({
    sql: `SELECT COUNT(DISTINCT usuario_id) AS n FROM ac_asistencia WHERE sesion_id IN (${sesiones.map(() => '?').join(',')})`,
    args: sesiones.map((s) => s.id),
  })
  return num((r.rows[0] as any)?.n)
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
