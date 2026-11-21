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
  /** Clic dentro de la escena (0 = recién llegada). */
  paso: number
  /** Aviso "Empezamos en 00:00": hora de llegada a cero (ms epoch del servidor) y duración total. */
  aviso: { fin: number; ms: number } | null
  /** Marca (ms del servidor) del último cambio de escena o paso; 0 si nunca se movió con esta columna. */
  mov: number
  /** Marca (ms del servidor) de cuando se llegó a la escena actual; 0 si no se sabe. Cambiar solo de paso no la mueve. */
  escenaDesde: number
  /** Último botón del presentador para el proyector ("pedir", "generar"). */
  orden: { id: string; nombre: string } | null
  updated_at: string
}

const leerOrdenFila = (v: unknown): EstadoTaller['orden'] => {
  try {
    const o = JSON.parse(str(v) || 'null')
    return o && typeof o.id === 'string' && typeof o.nombre === 'string' ? { id: o.id, nombre: o.nombre } : null
  } catch {
    return null
  }
}

const leerAvisoFila = (v: unknown): EstadoTaller['aviso'] => {
  try {
    const a = JSON.parse(str(v) || 'null')
    return a && Number(a.fin) > 0 && Number(a.ms) > 0 ? { fin: Number(a.fin), ms: Number(a.ms) } : null
  } catch {
    return null
  }
}

const filaEstado = (x: any): EstadoTaller => ({ taller: num(x.taller), escena: str(x.escena), interaccion: str(x.interaccion), paso: num(x.paso), aviso: leerAvisoFila(x.aviso), mov: num(x.mov), escenaDesde: num(x.escena_desde), orden: leerOrdenFila(x.orden), updated_at: str(x.updated_at) })

/** Una hora después de llegar a cero, un aviso olvidado deja de mostrarse (no tapa la siguiente sesión). */
export const MINUTOS_AVISO_VENCIDO = 60

/**
 * Lo que reciben los dispositivos: cuánto falta (ms, negativo si ya pasó) en
 * vez de la hora de fin, porque el reloj de cada equipo es distinto. `id`
 * distingue un aviso de otro (si se relanza, cambia).
 */
export function avisoPublico(e: EstadoTaller | null, ref = Date.now()): { id: number; resta: number; ms: number } | null {
  const a = e?.aviso
  if (!a || ref - a.fin > MINUTOS_AVISO_VENCIDO * 60_000) return null
  return { id: a.fin, resta: a.fin - ref, ms: a.ms }
}

/**
 * Pone o quita el aviso. Cuenta como movimiento de la presentación (la deja
 * "en curso"); si todavía no había estado, arranca en la escena dada.
 */
export async function fijarAviso(taller: number, aviso: { fin: number; ms: number } | null, escena: string, interaccion: string): Promise<void> {
  const c = await db()
  await c.execute({
    sql: `INSERT INTO ac_taller_estado (taller, escena, interaccion, paso, aviso, updated_at) VALUES (?, ?, ?, '0', ?, ?)
          ON CONFLICT (taller) DO UPDATE SET aviso = excluded.aviso, updated_at = excluded.updated_at`,
    args: [taller, escena, interaccion, aviso ? JSON.stringify(aviso) : '', ahora()],
  })
}

export async function leerEstado(taller: number): Promise<EstadoTaller | null> {
  const c = await db()
  const r = await c.execute({ sql: 'SELECT * FROM ac_taller_estado WHERE taller = ?', args: [taller] })
  const x: any = r.rows[0]
  return x ? filaEstado(x) : null
}

/**
 * Cuánto lleva (ms) la escena actual según el reloj del servidor. Se manda lo
 * transcurrido y no la hora, porque el reloj de cada equipo es distinto.
 */
export function enEscena(e: EstadoTaller | null, ref = Date.now()): number | null {
  return e?.escenaDesde ? Math.max(0, ref - e.escenaDesde) : null
}

export function enCurso(e: EstadoTaller | null, ref = Date.now()): boolean {
  return !!e && ref - Date.parse(e.updated_at) < HORAS_EN_CURSO * 3600_000
}

/** Guarda escena y paso. Devuelve la marca del movimiento (ver `mov`). */
export async function fijarEstado(taller: number, escena: string, interaccion: string, paso = 0): Promise<number> {
  const c = await db()
  const mov = Date.now()
  await c.execute({
    sql: `INSERT INTO ac_taller_estado (taller, escena, interaccion, paso, mov, escena_desde, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (taller) DO UPDATE SET
            escena_desde = CASE WHEN ac_taller_estado.escena = excluded.escena AND ac_taller_estado.escena_desde <> '' THEN ac_taller_estado.escena_desde ELSE excluded.escena_desde END,
            escena = excluded.escena, interaccion = excluded.interaccion, paso = excluded.paso, mov = excluded.mov, updated_at = excluded.updated_at`,
    args: [taller, escena, interaccion, String(paso), String(mov), String(mov), ahora()],
  })
  return mov
}

/** Botón del presentador para el proyector. El `id` lo pone quien lo envía: así el proyector no lo repite si también le llegó por el canal local. */
export async function fijarOrden(taller: number, orden: { id: string; nombre: string }): Promise<void> {
  const c = await db()
  await c.execute({ sql: 'UPDATE ac_taller_estado SET orden = ? WHERE taller = ?', args: [JSON.stringify(orden), taller] })
}

/** La capacitación que se está dictando ahora (la última que se movió), si hay. */
export async function tallerEnCurso(): Promise<EstadoTaller | null> {
  const c = await db()
  const r = await c.execute('SELECT * FROM ac_taller_estado ORDER BY updated_at DESC LIMIT 1')
  const x: any = r.rows[0]
  const e = x ? filaEstado(x) : null
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
 * Datos con los que se registró este correo la última vez (en cualquier
 * capacitación). La sala pide primero el correo: si ya existe, entra con estos
 * datos sin volver a escribir nombre, apellido ni área.
 */
export async function registroPorCorreo(correo: string): Promise<Pick<RegistroSala, 'nombre' | 'apellido' | 'area'> | null> {
  const c = await db()
  const r = await c.execute({
    sql: `SELECT nombre, apellido, area FROM ac_taller_asistentes WHERE correo = ? AND nombre != '' ORDER BY id DESC LIMIT 1`,
    args: [correo],
  })
  const f = r.rows[0] as any
  return f ? { nombre: str(f.nombre), apellido: str(f.apellido), area: str(f.area) } : null
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
  /** Respuesta preparada por la IA para quien dicta ('' = aún no). */
  respuesta_ia: string
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
    sql: `SELECT p.id, p.escena, p.texto, p.created_at, p.respuesta_ia, a.nombre, a.apellido, a.area
          FROM ac_taller_preguntas p JOIN ac_taller_asistentes a ON a.id = p.asistente_id
          WHERE p.taller = ? AND p.fecha = ? AND p.respondida = 0 ORDER BY p.id`,
    args: [taller, hoy],
  })
  return r.rows.map(filaPregunta)
}

/** Una pregunta de la sala por id, o null si no es de esa capacitación. */
export async function preguntaSala(taller: number, id: number): Promise<PreguntaSala | null> {
  const c = await db()
  const r = await c.execute({
    sql: `SELECT p.id, p.escena, p.texto, p.created_at, p.respuesta_ia, a.nombre, a.apellido, a.area
          FROM ac_taller_preguntas p JOIN ac_taller_asistentes a ON a.id = p.asistente_id
          WHERE p.id = ? AND p.taller = ?`,
    args: [id, taller],
  })
  return r.rows[0] ? filaPregunta(r.rows[0]) : null
}

export async function guardarRespuestaIA(taller: number, id: number, texto: string): Promise<void> {
  const c = await db()
  await c.execute({ sql: 'UPDATE ac_taller_preguntas SET respuesta_ia = ? WHERE id = ? AND taller = ?', args: [texto, id, taller] })
}

function filaPregunta(x: any): PreguntaSala {
  return {
    id: num(x.id),
    escena: str(x.escena),
    texto: str(x.texto),
    nombre: `${str(x.nombre)} ${str(x.apellido)}`.trim(),
    area: str(x.area),
    created_at: str(x.created_at),
    respuesta_ia: str(x.respuesta_ia),
  }
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

// ---------- PC vinculado (/pc) ----------

/** Minutos que sirve el código de dos números que muestra el celular. */
export const MINUTOS_CODIGO_PC = 5

/**
 * Código de dos números (10 a 99) para abrir la presentación en el PC de esta
 * persona. Si ya tiene uno vigente, es el mismo; si no, se elige uno que no
 * tenga nadie más en ese momento. null si los 90 están ocupados (no pasa con
 * un grupo normal: cada código vive pocos minutos).
 */
export async function codigoPC(taller: number, asistente_id: number): Promise<{ codigo: string; vence: string } | null> {
  const c = await db()
  const ya = ahora()
  await c.execute({ sql: 'DELETE FROM ac_taller_codigos_pc WHERE vence_at <= ?', args: [ya] })
  const mio = await c.execute({ sql: 'SELECT codigo, vence_at FROM ac_taller_codigos_pc WHERE taller = ? AND asistente_id = ?', args: [taller, asistente_id] })
  const m: any = mio.rows[0]
  if (m) return { codigo: str(m.codigo), vence: str(m.vence_at) }
  const usados = new Set((await c.execute({ sql: 'SELECT codigo FROM ac_taller_codigos_pc WHERE taller = ?', args: [taller] })).rows.map((x: any) => str(x.codigo)))
  const libres = Array.from({ length: 90 }, (_, k) => String(k + 10)).filter((k) => !usados.has(k))
  const vence = new Date(Date.now() + MINUTOS_CODIGO_PC * 60_000).toISOString()
  // Si dos celulares eligen el mismo a la vez, la llave primaria frena al segundo y prueba otro.
  for (let intento = 0; intento < 5 && libres.length; intento++) {
    const [codigo] = libres.splice(Math.floor(Math.random() * libres.length), 1)
    const r = await c.execute({
      sql: 'INSERT INTO ac_taller_codigos_pc (taller, codigo, asistente_id, vence_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING',
      args: [taller, codigo!, asistente_id, vence],
    })
    if (r.rowsAffected > 0) return { codigo: codigo!, vence }
  }
  return null
}

/** El código vigente de esta persona, si tiene (la sala sabe cuándo ya se usó). */
export async function codigoVigente(taller: number, asistente_id: number): Promise<string | null> {
  const c = await db()
  const r = await c.execute({ sql: 'SELECT codigo FROM ac_taller_codigos_pc WHERE taller = ? AND asistente_id = ? AND vence_at > ?', args: [taller, asistente_id, ahora()] })
  const x: any = r.rows[0]
  return x ? str(x.codigo) : null
}

/** Usa el código: si está vigente lo borra y devuelve de quién era. */
export async function canjearCodigoPC(taller: number, codigo: string): Promise<number | null> {
  const c = await db()
  const r = await c.execute({
    sql: 'DELETE FROM ac_taller_codigos_pc WHERE taller = ? AND codigo = ? AND vence_at > ? RETURNING asistente_id',
    args: [taller, codigo, ahora()],
  })
  const x: any = r.rows[0]
  return x ? num(x.asistente_id) : null
}

// ---------- Formulario de cierre (/academia/sala/opinion) ----------

export interface OpinionTaller {
  id: number
  taller: number
  fecha: string
  asistente_id: number
  nombre: string
  correo: string
  area: string
  respuestas: Record<string, string>
  /** Cómo se resolvió la duda ('' = pendiente). */
  resolucion: string
  resuelta_at: string
  resuelta_por: string
  created_at: string
  updated_at: string
}

/** Guarda o actualiza el formulario de cierre de una persona. */
export async function guardarOpinion(a: Asistente, respuestas: Record<string, string>): Promise<void> {
  const c = await db()
  const ts = ahora()
  await c.execute({
    sql: `INSERT INTO ac_taller_opiniones (taller, fecha, asistente_id, area, respuestas, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (asistente_id) DO UPDATE SET area = excluded.area, respuestas = excluded.respuestas, updated_at = excluded.updated_at`,
    args: [a.taller, a.fecha, a.id, a.area, JSON.stringify(respuestas), ts, ts],
  })
}

/** Lo que la persona ya envió, para volver a mostrárselo (null si no ha enviado). */
export async function opinionDe(asistente_id: number): Promise<Record<string, string> | null> {
  const c = await db()
  const r = await c.execute({ sql: 'SELECT respuestas FROM ac_taller_opiniones WHERE asistente_id = ?', args: [asistente_id] })
  const x: any = r.rows[0]
  return x ? leerRespuestas(x.respuestas) : null
}

/** Todos los formularios, del más reciente al más antiguo (panel, solo admin). */
export async function opiniones(): Promise<OpinionTaller[]> {
  const c = await db()
  const r = await c.execute(`SELECT o.*, a.nombre, a.apellido, a.correo FROM ac_taller_opiniones o
    JOIN ac_taller_asistentes a ON a.id = o.asistente_id ORDER BY o.fecha DESC, o.id DESC`)
  return r.rows.map((x: any) => ({
    id: num(x.id),
    taller: num(x.taller),
    fecha: str(x.fecha),
    asistente_id: num(x.asistente_id),
    nombre: `${str(x.nombre)} ${str(x.apellido)}`.trim(),
    correo: str(x.correo),
    area: str(x.area),
    respuestas: leerRespuestas(x.respuestas),
    resolucion: str(x.resolucion),
    resuelta_at: str(x.resuelta_at),
    resuelta_por: str(x.resuelta_por),
    created_at: str(x.created_at),
    updated_at: str(x.updated_at),
  }))
}

/** Anota cómo se resolvió la duda; con texto vacío vuelve a quedar pendiente. */
export async function resolverOpinion(id: number, resolucion: string, quien: string): Promise<void> {
  const c = await db()
  const r = resolucion.trim().slice(0, 1000)
  await c.execute({
    sql: 'UPDATE ac_taller_opiniones SET resolucion = ?, resuelta_at = ?, resuelta_por = ? WHERE id = ?',
    args: [r, r ? ahora() : '', r ? quien : '', id],
  })
}

function leerRespuestas(v: unknown): Record<string, string> {
  try {
    const o = JSON.parse(str(v))
    return o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, s]) => [k, str(s)])) : {}
  } catch {
    return {}
  }
}

// ── Material por correo (docs/plan-recursos.md) ──

export interface GrupoMaterial {
  taller: number
  fecha: string
  /** Personas registradas ese día (con o sin correo). */
  registrados: number
  /** Correos distintos a los que ya se les envió. */
  enviados: number
  /** Correos distintos que faltan. */
  pendientes: number
}

/** Cada sesión (capacitación y fecha) con cuántos correos van enviados y cuántos faltan. */
export async function gruposMaterial(): Promise<GrupoMaterial[]> {
  const c = await db()
  const r = await c.execute(`SELECT taller, fecha, COUNT(*) AS registrados,
      COUNT(DISTINCT CASE WHEN correo <> '' AND recursos_at <> '' THEN lower(correo) END) AS enviados,
      COUNT(DISTINCT CASE WHEN correo <> '' AND recursos_at = '' THEN lower(correo) END) AS pendientes
    FROM ac_taller_asistentes GROUP BY taller, fecha ORDER BY fecha DESC, taller DESC`)
  return r.rows.map((x: any) => ({ taller: num(x.taller), fecha: str(x.fecha), registrados: num(x.registrados), enviados: num(x.enviados), pendientes: num(x.pendientes) }))
}

/**
 * Quienes de esa sesión todavía no han recibido el material, uno por correo
 * (si alguien se registró dos veces con el mismo correo, recibe uno solo).
 */
export async function pendientesMaterial(taller: number, fecha: string): Promise<Asistente[]> {
  const c = await db()
  const r = await c.execute({
    sql: `SELECT * FROM ac_taller_asistentes WHERE taller = ? AND fecha = ? AND correo <> '' AND recursos_at = '' ORDER BY id`,
    args: [taller, fecha],
  })
  const vistos = new Set<string>()
  return r.rows.map(filaAsistente).filter((a) => {
    const k = a.correo.toLowerCase()
    if (vistos.has(k)) return false
    vistos.add(k)
    return true
  })
}

/** Marca como enviado el material a ese correo en esa sesión (todas sus filas). */
export async function marcarMaterial(taller: number, fecha: string, correo: string): Promise<void> {
  const c = await db()
  await c.execute({
    sql: `UPDATE ac_taller_asistentes SET recursos_at = ? WHERE taller = ? AND fecha = ? AND lower(correo) = lower(?)`,
    args: [ahora(), taller, fecha, correo],
  })
}
