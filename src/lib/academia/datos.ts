/**
 * Academia de IA: lecturas y escrituras en la base (tablas ac_* de esquema.ts).
 *
 * Dos estados: el del participante (/academia), que solo trae su ruta y lo
 * suyo, y el del administrador (/admin/academia), que trae todo. Las reglas
 * de ruta, avance y certificado son puras y viven en reglas.ts.
 *
 * Todo lo que llega del navegador se valida aquí: catálogos conocidos, fechas
 * reales, largos máximos y enlaces solo http(s), porque se pintan como <a href>.
 */
import type { Client } from '@libsql/client'
import { asegurarEsquema, cliente } from '../db.ts'
import { UserError } from '../apiError.ts'
import { SITE_URL } from '../site.ts'
import { ROLE_LABELS, upsertUser, type Role } from '../users.ts'
import { registrarFormaciones, sembrarCursosIA } from '../talento/datos.ts'
import {
  AREAS_ACADEMIA,
  avanceDe,
  codigoCertificado,
  enlaceSeguro,
  esArea,
  esCodigo,
  esEstadoRevision,
  esFecha,
  esModulo,
  leccionesDeRuta,
  nombreModulo,
  redondearHoras,
  requisitosCertificado,
  sesionesDeRuta,
  type Avance,
  type Requisitos,
} from './reglas.ts'
import { leccionesSemilla, type Prompt, type Recurso } from './semilla.ts'

const ahora = () => new Date().toISOString()
const str = (v: unknown) => (v == null ? '' : String(v))
const num = (v: unknown) => Number(v ?? 0) || 0

function json<T>(s: unknown, defecto: T): T {
  try {
    return (JSON.parse(str(s)) ?? defecto) as T
  } catch {
    return defecto
  }
}

// ---------- Tipos ----------

export interface Leccion {
  id: number
  modulo: string
  orden: number
  titulo: string
  resumen: string
  contenido: string
  prompts: Prompt[]
  recursos: Recurso[]
  ejercicio: string
  entregable: string
  practica_consigna: string
  minutos: number
  publicada: boolean
  updated_at: string
}

export interface Sesion {
  id: number
  titulo: string
  fecha: string
  hora: string
  horas: number
  modulos: string[]
  lugar: string
  notas: string
}

export interface Entrega {
  id: number
  usuario_id: number
  leccion_id: number
  texto: string
  enlace: string
  estado: string
  comentario: string
  revisado_por: string
  revisado_at: string
  created_at: string
  updated_at: string
}

export interface Certificado {
  codigo: string
  usuario_id: number
  nombre: string
  area: string
  horas: number
  emitido_at: string
  emitido_por: string
  revocado_at: string
}

export interface Practica {
  id: number
  leccion_id: number
  instruccion: string
  respuesta: string
  revision: unknown
  created_at: string
}

export interface Cuenta {
  id: number
  username: string
  nombre: string
  rol: string
  activa: boolean
}

export interface PersonaAcademia extends Cuenta {
  area: string
  avance: Avance
  requisitos: Requisitos
  certificado: Certificado | null
  vistas: number[]
  asistencias: number[]
  practicas: number
}

const aLeccion = (r: any): Leccion => ({
  id: num(r.id),
  modulo: str(r.modulo),
  orden: num(r.orden),
  titulo: str(r.titulo),
  resumen: str(r.resumen),
  contenido: str(r.contenido),
  prompts: json<Prompt[]>(r.prompts, []),
  recursos: json<Recurso[]>(r.recursos, []),
  ejercicio: str(r.ejercicio),
  entregable: str(r.entregable),
  practica_consigna: str(r.practica_consigna),
  minutos: num(r.minutos),
  publicada: num(r.publicada) === 1,
  updated_at: str(r.updated_at),
})

const aSesion = (r: any): Sesion => ({
  id: num(r.id),
  titulo: str(r.titulo),
  fecha: str(r.fecha),
  hora: str(r.hora),
  horas: num(r.horas),
  modulos: json<string[]>(r.modulos, []).filter(esModulo),
  lugar: str(r.lugar),
  notas: str(r.notas),
})

const aEntrega = (r: any): Entrega => ({
  id: num(r.id),
  usuario_id: num(r.usuario_id),
  leccion_id: num(r.leccion_id),
  texto: str(r.texto),
  enlace: str(r.enlace),
  estado: str(r.estado),
  comentario: str(r.comentario),
  revisado_por: str(r.revisado_por),
  revisado_at: str(r.revisado_at),
  created_at: str(r.created_at),
  updated_at: str(r.updated_at),
})

const aCertificado = (r: any): Certificado => ({
  codigo: str(r.codigo),
  usuario_id: num(r.usuario_id),
  nombre: str(r.nombre),
  area: str(r.area),
  horas: num(r.horas),
  emitido_at: str(r.emitido_at),
  emitido_por: str(r.emitido_por),
  revocado_at: str(r.revocado_at),
})

// ---------- Siembra ----------

let sembrado = false

/** Las lecciones del programa, sin publicar. Idempotente: busca por `semilla`. */
export async function sembrarLecciones(db: Client = cliente()): Promise<void> {
  if (sembrado) return
  const ya = new Set((await db.execute(`SELECT semilla FROM ac_lecciones WHERE semilla <> ''`)).rows.map((r: any) => str(r.semilla)))
  const ts = ahora()
  const nuevas = leccionesSemilla().filter((l) => !ya.has(l.semilla))
  if (nuevas.length) {
    await db.batch(
      nuevas.map((l) => ({
        sql: `INSERT INTO ac_lecciones (modulo, orden, titulo, resumen, contenido, prompts, recursos, ejercicio, entregable, practica_consigna, minutos, publicada, semilla, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        args: [l.modulo, l.orden, l.titulo, l.resumen, l.contenido, JSON.stringify(l.prompts), JSON.stringify(l.recursos), l.ejercicio, l.entregable, l.practica_consigna, l.minutos, l.semilla, ts, ts],
      })),
      'write',
    )
  }
  sembrado = true
}

async function preparar(): Promise<Client> {
  await asegurarEsquema()
  const db = cliente()
  await sembrarLecciones(db)
  return db
}

// ---------- Lectura ----------

async function leerLecciones(db: Client): Promise<Leccion[]> {
  return (await db.execute('SELECT * FROM ac_lecciones ORDER BY modulo, orden, id')).rows.map(aLeccion)
}

async function leerSesiones(db: Client): Promise<Sesion[]> {
  return (await db.execute('SELECT * FROM ac_sesiones ORDER BY fecha, hora, id')).rows.map(aSesion)
}

/** La cuenta activa detrás de una sesión, o null (cuenta fija, borrada o desactivada). */
export async function cuentaDe(username: string): Promise<Cuenta | null> {
  const db = await preparar()
  const r = await db.execute({ sql: 'SELECT id, username, name, role, active FROM users WHERE username = ? LIMIT 1', args: [username.trim().toLowerCase()] })
  const u: any = r.rows[0]
  if (!u || num(u.active) !== 1) return null
  return { id: num(u.id), username: str(u.username), nombre: str(u.name), rol: str(u.role), activa: true }
}

export interface EstadoParticipante {
  hoy: string
  persona: { usuario_id: number; nombre: string; area: string; areaNombre: string }
  /** true cuando un admin mira la academia como si fuera de un área, sin inscribirse. */
  vistaPrevia: boolean
  lecciones: Leccion[]
  vistas: number[]
  entregas: Entrega[]
  sesiones: (Sesion & { asistio: boolean })[]
  avance: Avance
  requisitos: Requisitos
  certificado: Certificado | null
}

/** Área en la que está inscrita una cuenta, o '' si no lo está. */
export async function areaInscrita(usuario_id: number): Promise<string> {
  const db = await preparar()
  const r = await db.execute({ sql: 'SELECT area FROM ac_inscripciones WHERE usuario_id = ?', args: [usuario_id] })
  return str((r.rows[0] as any)?.area)
}

export async function estadoParticipante(cuenta: { id: number; nombre: string } | null, area: string, hoy: string, vistaPrevia = false): Promise<EstadoParticipante> {
  const db = await preparar()
  const uid = cuenta?.id ?? 0
  const [todas, sesiones, vistasR, entregasR, asistR, certR] = await Promise.all([
    leerLecciones(db),
    leerSesiones(db),
    db.execute({ sql: 'SELECT leccion_id FROM ac_progreso WHERE usuario_id = ?', args: [uid] }),
    db.execute({ sql: 'SELECT * FROM ac_entregas WHERE usuario_id = ?', args: [uid] }),
    db.execute({ sql: 'SELECT sesion_id FROM ac_asistencia WHERE usuario_id = ?', args: [uid] }),
    db.execute({ sql: `SELECT * FROM ac_certificados WHERE usuario_id = ? AND revocado_at = '' ORDER BY emitido_at DESC LIMIT 1`, args: [uid] }),
  ])
  // En vista previa el admin también ve los borradores, para revisarlos.
  const lecciones = leccionesDeRuta(todas, area, vistaPrevia)
  const vistas = new Set(vistasR.rows.map((r: any) => num(r.leccion_id)))
  const asistio = new Set(asistR.rows.map((r: any) => num(r.sesion_id)))
  const entregas = entregasR.rows.map(aEntrega)
  const avance = avanceDe(area, todas, sesiones, vistas, entregas, asistio)
  return {
    hoy,
    persona: { usuario_id: uid, nombre: cuenta?.nombre ?? 'Vista previa', area, areaNombre: nombreModulo(area) },
    vistaPrevia,
    lecciones,
    vistas: [...vistas],
    entregas,
    sesiones: sesionesDeRuta(sesiones, area).map((s) => ({ ...s, asistio: asistio.has(s.id) })),
    avance,
    requisitos: requisitosCertificado(avance),
    certificado: certR.rows[0] ? aCertificado(certR.rows[0]) : null,
  }
}

export async function practicasRecientes(usuario_id: number, leccion_id: number, limite = 5): Promise<Practica[]> {
  const db = await preparar()
  const r = await db.execute({
    sql: 'SELECT id, leccion_id, instruccion, respuesta, revision, created_at FROM ac_practicas WHERE usuario_id = ? AND leccion_id = ? ORDER BY id DESC LIMIT ?',
    args: [usuario_id, leccion_id, limite],
  })
  return r.rows.map((x: any) => ({
    id: num(x.id),
    leccion_id: num(x.leccion_id),
    instruccion: str(x.instruccion),
    respuesta: str(x.respuesta),
    revision: json(x.revision, {}),
    created_at: str(x.created_at),
  }))
}

export interface EstadoAdmin {
  hoy: string
  personas: PersonaAcademia[]
  cuentas: Cuenta[]
  lecciones: Leccion[]
  sesiones: (Sesion & { asistentes: number[] })[]
  entregas: (Entrega & { nombre: string; leccion: string; modulo: string })[]
  certificados: Certificado[]
  areas: typeof AREAS_ACADEMIA
}

export async function estadoAdmin(hoy: string): Promise<EstadoAdmin> {
  const db = await preparar()
  const [lecciones, sesiones, usuariosR, inscR, progR, entR, asisR, certR, pracR] = await Promise.all([
    leerLecciones(db),
    leerSesiones(db),
    db.execute('SELECT id, username, name, role, active FROM users ORDER BY name'),
    db.execute('SELECT usuario_id, area FROM ac_inscripciones'),
    db.execute('SELECT usuario_id, leccion_id FROM ac_progreso'),
    db.execute('SELECT * FROM ac_entregas ORDER BY updated_at DESC'),
    db.execute('SELECT sesion_id, usuario_id FROM ac_asistencia'),
    db.execute('SELECT * FROM ac_certificados ORDER BY emitido_at DESC'),
    db.execute('SELECT usuario_id, COUNT(*) AS n FROM ac_practicas GROUP BY usuario_id'),
  ])
  const cuentas: Cuenta[] = usuariosR.rows.map((u: any) => ({ id: num(u.id), username: str(u.username), nombre: str(u.name), rol: str(u.role), activa: num(u.active) === 1 }))
  const porId = new Map(cuentas.map((c) => [c.id, c]))
  const agrupar = (rows: any[], clave: string, valor: string) => {
    const m = new Map<number, number[]>()
    for (const r of rows) {
      const k = num(r[clave])
      m.set(k, [...(m.get(k) ?? []), num(r[valor])])
    }
    return m
  }
  const vistasDe = agrupar(progR.rows as any[], 'usuario_id', 'leccion_id')
  const asisDe = agrupar(asisR.rows as any[], 'usuario_id', 'sesion_id')
  const asistentesDe = agrupar(asisR.rows as any[], 'sesion_id', 'usuario_id')
  const entregas = entR.rows.map(aEntrega)
  const certificados = certR.rows.map(aCertificado)
  const practicasDe = new Map(pracR.rows.map((r: any) => [num(r.usuario_id), num(r.n)]))
  const leccionPorId = new Map(lecciones.map((l) => [l.id, l]))

  const personas: PersonaAcademia[] = []
  for (const r of inscR.rows as any[]) {
    const c = porId.get(num(r.usuario_id))
    if (!c) continue
    const area = str(r.area)
    const vistas = vistasDe.get(c.id) ?? []
    const asistencias = asisDe.get(c.id) ?? []
    const avance = avanceDe(area, lecciones, sesiones, new Set(vistas), entregas.filter((e) => e.usuario_id === c.id), new Set(asistencias))
    personas.push({
      ...c,
      area,
      avance,
      requisitos: requisitosCertificado(avance),
      certificado: certificados.find((x) => x.usuario_id === c.id && !x.revocado_at) ?? null,
      vistas,
      asistencias,
      practicas: practicasDe.get(c.id) ?? 0,
    })
  }
  personas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  return {
    hoy,
    personas,
    cuentas,
    lecciones,
    sesiones: sesiones.map((s) => ({ ...s, asistentes: asistentesDe.get(s.id) ?? [] })),
    entregas: entregas.map((e) => ({
      ...e,
      nombre: porId.get(e.usuario_id)?.nombre ?? 'Cuenta borrada',
      leccion: leccionPorId.get(e.leccion_id)?.titulo ?? 'Lección borrada',
      modulo: leccionPorId.get(e.leccion_id)?.modulo ?? '',
    })),
    certificados,
    areas: AREAS_ACADEMIA,
  }
}

/** Para la barra lateral del panel: inscritos y entregas por revisar. */
export async function cuentasAcademia(): Promise<{ inscritos: number; porRevisar: number }> {
  const db = await preparar()
  const [a, b] = await Promise.all([
    db.execute('SELECT COUNT(*) AS n FROM ac_inscripciones'),
    db.execute(`SELECT COUNT(*) AS n FROM ac_entregas WHERE estado = 'enviada'`),
  ])
  return { inscritos: num((a.rows[0] as any)?.n), porRevisar: num((b.rows[0] as any)?.n) }
}

export async function certificadoPorCodigo(codigo: string): Promise<Certificado | null> {
  if (!esCodigo(codigo)) return null
  await asegurarEsquema()
  const r = await cliente().execute({ sql: 'SELECT * FROM ac_certificados WHERE codigo = ?', args: [codigo] })
  return r.rows[0] ? aCertificado(r.rows[0]) : null
}

// ---------- Validación ----------

const texto = (v: unknown, max: number) => str(v).trim().slice(0, max)

function idValido(v: unknown, campo: string): number {
  const n = Number(v)
  if (!Number.isInteger(n) || n <= 0) throw new UserError(`${campo} no es válido`)
  return n
}

async function leccionVisible(db: Client, area: string, leccion_id: number): Promise<Leccion> {
  const r = await db.execute({ sql: 'SELECT * FROM ac_lecciones WHERE id = ?', args: [leccion_id] })
  const l = r.rows[0] ? aLeccion(r.rows[0]) : null
  if (!l || !leccionesDeRuta([l], area).length) throw new UserError('Esa lección no está en su ruta', 404)
  return l
}

// ---------- Escrituras del participante ----------

export async function marcarVista(usuario_id: number, area: string, leccion_id: unknown): Promise<void> {
  const db = await preparar()
  const l = await leccionVisible(db, area, idValido(leccion_id, 'La lección'))
  await db.execute({ sql: 'INSERT OR IGNORE INTO ac_progreso (usuario_id, leccion_id, vista_at) VALUES (?, ?, ?)', args: [usuario_id, l.id, ahora()] })
}

export async function entregar(usuario_id: number, area: string, b: any): Promise<Entrega> {
  const db = await preparar()
  const l = await leccionVisible(db, area, idValido(b?.leccion_id, 'La lección'))
  if (!l.ejercicio.trim()) throw new UserError('Esta lección no pide entrega')
  const t = texto(b?.texto, 6000)
  const enlaceCrudo = texto(b?.enlace, 1000)
  const link = enlaceSeguro(enlaceCrudo)
  if (enlaceCrudo && !link) throw new UserError('El enlace debe empezar por https://')
  if (t.length < 20 && !link) throw new UserError('Cuente qué hizo (al menos unas líneas) o comparta el enlace al resultado')
  const previa = await db.execute({ sql: 'SELECT estado FROM ac_entregas WHERE usuario_id = ? AND leccion_id = ?', args: [usuario_id, l.id] })
  if (str((previa.rows[0] as any)?.estado) === 'aprobada') throw new UserError('Esta entrega ya está aprobada')
  const ts = ahora()
  await db.execute({
    sql: `INSERT INTO ac_entregas (usuario_id, leccion_id, texto, enlace, estado, created_at, updated_at) VALUES (?, ?, ?, ?, 'enviada', ?, ?)
          ON CONFLICT (usuario_id, leccion_id) DO UPDATE SET texto = excluded.texto, enlace = excluded.enlace, estado = 'enviada', updated_at = excluded.updated_at`,
    args: [usuario_id, l.id, t, link, ts, ts],
  })
  // Entregar también cuenta como haber visto la lección.
  await db.execute({ sql: 'INSERT OR IGNORE INTO ac_progreso (usuario_id, leccion_id, vista_at) VALUES (?, ?, ?)', args: [usuario_id, l.id, ts] })
  const r = await db.execute({ sql: 'SELECT * FROM ac_entregas WHERE usuario_id = ? AND leccion_id = ?', args: [usuario_id, l.id] })
  return aEntrega(r.rows[0])
}

/** La lección de una práctica, comprobando que tenga el revisor y esté en la ruta. */
export async function leccionParaPracticar(usuario_id: number, area: string, leccion_id: unknown): Promise<Leccion> {
  const db = await preparar()
  const l = await leccionVisible(db, area, idValido(leccion_id, 'La lección'))
  if (!l.practica_consigna.trim()) throw new UserError('Esta lección no tiene práctica con IA')
  return l
}

export async function practicasDeHoy(usuario_id: number, hoyIso: string): Promise<number> {
  const db = await preparar()
  // created_at está en UTC; el día de Bogotá empieza a las 05:00 UTC.
  const desde = new Date(Date.parse(hoyIso + 'T05:00:00Z')).toISOString()
  const r = await db.execute({ sql: 'SELECT COUNT(*) AS n FROM ac_practicas WHERE usuario_id = ? AND created_at >= ?', args: [usuario_id, desde] })
  return num((r.rows[0] as any)?.n)
}

export async function guardarPractica(usuario_id: number, leccion_id: number, instruccion: string, respuesta: string, revision: unknown): Promise<number> {
  const db = await preparar()
  const r = await db.execute({
    sql: 'INSERT INTO ac_practicas (usuario_id, leccion_id, instruccion, respuesta, revision, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [usuario_id, leccion_id, instruccion, respuesta, JSON.stringify(revision), ahora()],
  })
  return Number(r.lastInsertRowid ?? 0)
}

// ---------- Escrituras del administrador ----------

/**
 * Inscribe una cuenta existente o crea una nueva con rol participante. Una
 * cuenta del panel conserva su rol: solo se le agrega la academia.
 */
export async function guardarInscripcion(b: any): Promise<number> {
  const db = await preparar()
  if (!esArea(b?.area)) throw new UserError('Elija el área de la persona')
  let usuario_id: number
  if (b?.crear) {
    const username = texto(b.crear.username, 60).toLowerCase()
    const name = texto(b.crear.name, 120)
    const password = str(b.crear.password)
    if (!name) throw new UserError('Falta el nombre')
    if (!/^[a-z0-9@._-]{3,60}$/.test(username)) throw new UserError('Usuario inválido (mín. 3 caracteres, letras, números o @._-)')
    if (password.length < 8) throw new UserError('La contraseña debe tener al menos 8 caracteres')
    try {
      usuario_id = await upsertUser({ username, name, role: 'participante' as Role, active: true, password })
    } catch (e: any) {
      if (String(e?.message || e).includes('UNIQUE')) throw new UserError('Ese usuario ya existe. Inscríbalo desde "Cuenta existente".')
      throw e
    }
  } else {
    usuario_id = idValido(b?.usuario_id, 'La cuenta')
    const u = await db.execute({ sql: 'SELECT id FROM users WHERE id = ?', args: [usuario_id] })
    if (!u.rows.length) throw new UserError('Esa cuenta ya no existe')
  }
  const ts = ahora()
  await db.execute({
    sql: `INSERT INTO ac_inscripciones (usuario_id, area, created_at, updated_at) VALUES (?, ?, ?, ?)
          ON CONFLICT (usuario_id) DO UPDATE SET area = excluded.area, updated_at = excluded.updated_at`,
    args: [usuario_id, b.area, ts, ts],
  })
  return usuario_id
}

/** Quita la inscripción. El historial (entregas, asistencia) se conserva por si vuelve. */
export async function quitarInscripcion(usuario_id: unknown): Promise<void> {
  const db = await preparar()
  await db.execute({ sql: 'DELETE FROM ac_inscripciones WHERE usuario_id = ?', args: [idValido(usuario_id, 'La cuenta')] })
}

function prompts(v: unknown): Prompt[] {
  if (!Array.isArray(v)) return []
  return v
    .map((p: any) => ({ titulo: texto(p?.titulo, 140), texto: texto(p?.texto, 4000) }))
    .filter((p) => p.texto)
    .slice(0, 12)
}

function recursos(v: unknown): Recurso[] {
  if (!Array.isArray(v)) return []
  return v
    .map((r: any) => {
      const crudo = texto(r?.href, 1000)
      const href = enlaceSeguro(crudo)
      if (crudo && !href) throw new UserError(`El enlace de "${texto(r?.titulo, 60) || 'un recurso'}" debe empezar por https://`)
      return { titulo: texto(r?.titulo, 160), href }
    })
    .filter((r) => r.titulo)
    .slice(0, 20)
}

export async function guardarLeccion(b: any): Promise<number> {
  const db = await preparar()
  if (!esModulo(b?.modulo)) throw new UserError('Elija el módulo de la lección')
  const titulo = texto(b?.titulo, 160)
  if (!titulo) throw new UserError('Falta el título')
  const campos = {
    modulo: b.modulo as string,
    titulo,
    resumen: texto(b?.resumen, 400),
    contenido: texto(b?.contenido, 30000),
    prompts: JSON.stringify(prompts(b?.prompts)),
    recursos: JSON.stringify(recursos(b?.recursos)),
    ejercicio: texto(b?.ejercicio, 1000),
    entregable: texto(b?.entregable, 1000),
    practica_consigna: texto(b?.practica_consigna, 1000),
    minutos: Math.max(0, Math.min(600, Math.round(num(b?.minutos)))),
    publicada: b?.publicada ? 1 : 0,
  }
  if (campos.publicada && !campos.contenido && !campos.ejercicio) throw new UserError('Para publicar, la lección necesita contenido o un ejercicio')
  const ts = ahora()
  if (b?.id) {
    const id = idValido(b.id, 'La lección')
    const r = await db.execute({
      sql: `UPDATE ac_lecciones SET modulo=?, titulo=?, resumen=?, contenido=?, prompts=?, recursos=?, ejercicio=?, entregable=?, practica_consigna=?, minutos=?, publicada=?, updated_at=? WHERE id=?`,
      args: [campos.modulo, campos.titulo, campos.resumen, campos.contenido, campos.prompts, campos.recursos, campos.ejercicio, campos.entregable, campos.practica_consigna, campos.minutos, campos.publicada, ts, id],
    })
    if (!r.rowsAffected) throw new UserError('Esa lección ya no existe', 404)
    return id
  }
  const max = await db.execute({ sql: 'SELECT COALESCE(MAX(orden), 0) AS m FROM ac_lecciones WHERE modulo = ?', args: [campos.modulo] })
  const r = await db.execute({
    sql: `INSERT INTO ac_lecciones (modulo, orden, titulo, resumen, contenido, prompts, recursos, ejercicio, entregable, practica_consigna, minutos, publicada, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [campos.modulo, num((max.rows[0] as any)?.m) + 1, campos.titulo, campos.resumen, campos.contenido, campos.prompts, campos.recursos, campos.ejercicio, campos.entregable, campos.practica_consigna, campos.minutos, campos.publicada, ts, ts],
  })
  return Number(r.lastInsertRowid ?? 0)
}

export async function publicarLeccion(id: unknown, publicada: unknown): Promise<void> {
  const db = await preparar()
  const lid = idValido(id, 'La lección')
  if (publicada) {
    const r = await db.execute({ sql: 'SELECT contenido, ejercicio FROM ac_lecciones WHERE id = ?', args: [lid] })
    const l: any = r.rows[0]
    if (!l) throw new UserError('Esa lección ya no existe', 404)
    if (!str(l.contenido).trim() && !str(l.ejercicio).trim()) throw new UserError('Para publicar, la lección necesita contenido o un ejercicio')
  }
  await db.execute({ sql: 'UPDATE ac_lecciones SET publicada = ?, updated_at = ? WHERE id = ?', args: [publicada ? 1 : 0, ahora(), lid] })
}

/** Sube o baja una lección dentro de su módulo, renumerando el orden. */
export async function moverLeccion(id: unknown, dir: unknown): Promise<void> {
  const db = await preparar()
  const lid = idValido(id, 'La lección')
  const r = await db.execute({ sql: 'SELECT modulo FROM ac_lecciones WHERE id = ?', args: [lid] })
  if (!r.rows.length) throw new UserError('Esa lección ya no existe', 404)
  const modulo = str((r.rows[0] as any).modulo)
  const ids = (await db.execute({ sql: 'SELECT id FROM ac_lecciones WHERE modulo = ? ORDER BY orden, id', args: [modulo] })).rows.map((x: any) => num(x.id))
  const i = ids.indexOf(lid)
  const j = i + (Number(dir) < 0 ? -1 : 1)
  if (j < 0 || j >= ids.length) return
  ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
  await db.batch(ids.map((x, k) => ({ sql: 'UPDATE ac_lecciones SET orden = ? WHERE id = ?', args: [k + 1, x] })), 'write')
}

export async function eliminarLeccion(id: unknown): Promise<void> {
  const db = await preparar()
  const lid = idValido(id, 'La lección')
  const e = await db.execute({ sql: 'SELECT COUNT(*) AS n FROM ac_entregas WHERE leccion_id = ?', args: [lid] })
  if (num((e.rows[0] as any)?.n)) throw new UserError('Esta lección ya tiene entregas. Despublíquela en vez de borrarla para no perderlas.', 409)
  await db.batch(
    [
      { sql: 'DELETE FROM ac_lecciones WHERE id = ?', args: [lid] },
      { sql: 'DELETE FROM ac_progreso WHERE leccion_id = ?', args: [lid] },
      { sql: 'DELETE FROM ac_practicas WHERE leccion_id = ?', args: [lid] },
    ],
    'write',
  )
}

export async function guardarSesion(b: any): Promise<number> {
  const db = await preparar()
  const titulo = texto(b?.titulo, 160)
  if (!titulo) throw new UserError('Falta el título del bloque')
  const fecha = texto(b?.fecha, 10)
  if (!esFecha(fecha)) throw new UserError('La fecha no es válida')
  const hora = texto(b?.hora, 5)
  if (hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) throw new UserError('La hora no es válida')
  const horas = redondearHoras(num(b?.horas))
  if (horas <= 0 || horas > 12) throw new UserError('Las horas deben estar entre 0,25 y 12')
  const modulos = [...new Set((Array.isArray(b?.modulos) ? b.modulos : []).filter(esModulo))]
  if (!modulos.length) throw new UserError('Elija al menos un módulo que asiste a este bloque')
  const campos = [titulo, fecha, hora, horas, JSON.stringify(modulos), texto(b?.lugar, 200), texto(b?.notas, 1000)]
  const ts = ahora()
  if (b?.id) {
    const id = idValido(b.id, 'El bloque')
    const r = await db.execute({ sql: 'UPDATE ac_sesiones SET titulo=?, fecha=?, hora=?, horas=?, modulos=?, lugar=?, notas=?, updated_at=? WHERE id=?', args: [...campos, ts, id] })
    if (!r.rowsAffected) throw new UserError('Ese bloque ya no existe', 404)
    return id
  }
  const r = await db.execute({ sql: 'INSERT INTO ac_sesiones (titulo, fecha, hora, horas, modulos, lugar, notas, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', args: [...campos, ts, ts] })
  return Number(r.lastInsertRowid ?? 0)
}

export async function eliminarSesion(id: unknown): Promise<void> {
  const db = await preparar()
  const sid = idValido(id, 'El bloque')
  await db.batch(
    [
      { sql: 'DELETE FROM ac_sesiones WHERE id = ?', args: [sid] },
      { sql: 'DELETE FROM ac_asistencia WHERE sesion_id = ?', args: [sid] },
    ],
    'write',
  )
}

/** Reemplaza la lista de asistentes de un bloque. */
export async function guardarAsistencia(sesion_id: unknown, usuario_ids: unknown): Promise<void> {
  const db = await preparar()
  const sid = idValido(sesion_id, 'El bloque')
  const s = await db.execute({ sql: 'SELECT id FROM ac_sesiones WHERE id = ?', args: [sid] })
  if (!s.rows.length) throw new UserError('Ese bloque ya no existe', 404)
  const ids = [...new Set((Array.isArray(usuario_ids) ? usuario_ids : []).map((v) => idValido(v, 'La persona')))].slice(0, 300)
  const ts = ahora()
  await db.batch(
    [
      { sql: 'DELETE FROM ac_asistencia WHERE sesion_id = ?', args: [sid] },
      ...ids.map((uid) => ({ sql: 'INSERT INTO ac_asistencia (sesion_id, usuario_id, created_at) VALUES (?, ?, ?)', args: [sid, uid, ts] })),
    ],
    'write',
  )
}

export async function revisarEntrega(b: any, quien: string): Promise<void> {
  const db = await preparar()
  const id = idValido(b?.id, 'La entrega')
  if (!esEstadoRevision(b?.estado)) throw new UserError('Elija aprobar o devolver')
  const comentario = texto(b?.comentario, 3000)
  if (b.estado === 'devuelta' && !comentario) throw new UserError('Al devolver, escriba qué debe ajustar')
  const r = await db.execute({
    sql: 'UPDATE ac_entregas SET estado = ?, comentario = ?, revisado_por = ?, revisado_at = ?, updated_at = ? WHERE id = ?',
    args: [b.estado, comentario, quien, ahora(), ahora(), id],
  })
  if (!r.rowsAffected) throw new UserError('Esa entrega ya no existe', 404)
}

/**
 * Emite el certificado si la persona cumple los requisitos. Guarda una copia
 * de los datos y registra los cursos en Talento humano (general y su área),
 * con el enlace de verificación como soporte.
 */
export async function emitirCertificado(usuario_id: number, quien: string, hoy: string): Promise<Certificado> {
  const db = await preparar()
  const vigente = await db.execute({ sql: `SELECT * FROM ac_certificados WHERE usuario_id = ? AND revocado_at = '' LIMIT 1`, args: [usuario_id] })
  if (vigente.rows[0]) return aCertificado(vigente.rows[0])
  const area = await areaInscrita(usuario_id)
  if (!area) throw new UserError('Esta persona no está inscrita en la academia')
  const u = await db.execute({ sql: 'SELECT name FROM users WHERE id = ?', args: [usuario_id] })
  if (!u.rows[0]) throw new UserError('Esa cuenta ya no existe')
  const est = await estadoParticipante({ id: usuario_id, nombre: str((u.rows[0] as any).name) }, area, hoy)
  if (!est.requisitos.elegible) throw new UserError(`Todavía no cumple los requisitos. ${est.requisitos.faltan.join(' ')}`, 409)

  let codigo = codigoCertificado()
  for (let i = 0; i < 5; i++) {
    const ya = await db.execute({ sql: 'SELECT 1 FROM ac_certificados WHERE codigo = ?', args: [codigo] })
    if (!ya.rows.length) break
    codigo = codigoCertificado()
  }
  const cert: Certificado = {
    codigo,
    usuario_id,
    nombre: est.persona.nombre,
    area,
    horas: est.requisitos.horas,
    emitido_at: ahora(),
    emitido_por: quien,
    revocado_at: '',
  }
  await db.execute({
    sql: 'INSERT INTO ac_certificados (codigo, usuario_id, nombre, area, horas, emitido_at, emitido_por) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [cert.codigo, cert.usuario_id, cert.nombre, cert.area, cert.horas, cert.emitido_at, cert.emitido_por],
  })

  // Talento humano: si falla, el certificado ya quedó; se registra en el log.
  try {
    await sembrarCursosIA()
    const cursos = await db.execute({ sql: `SELECT id, capacitacion_id FROM th_cursos WHERE capacitacion_id IN ('general', ?)`, args: [area] })
    for (const c of cursos.rows as any[]) {
      await registrarFormaciones({ curso_id: num(c.id), fecha: hoy, usuario_ids: [usuario_id], enlace: `${SITE_URL}/verificar/${codigo}`, notas: `Certificado ${codigo} de la academia de IA` })
    }
  } catch (e) {
    console.error('[academia] registro en talento', e instanceof Error ? e.message : e)
  }
  return cert
}

export async function revocarCertificado(codigo: unknown): Promise<void> {
  const db = await preparar()
  if (!esCodigo(codigo)) throw new UserError('Código inválido')
  const r = await db.execute({ sql: `UPDATE ac_certificados SET revocado_at = ? WHERE codigo = ? AND revocado_at = ''`, args: [ahora(), codigo] })
  if (!r.rowsAffected) throw new UserError('Ese certificado no existe o ya estaba revocado', 404)
}

export const etiquetaRol = (rol: string) => ROLE_LABELS[rol as Role] ?? rol

export type Acceso =
  | { tipo: 'inscrito'; cuenta: Cuenta; area: string }
  | { tipo: 'vista_previa'; cuenta: Cuenta | null; area: string }
  | { tipo: 'sin_inscripcion'; nombre: string }

/**
 * Quién entra a /academia. Un inscrito ve su ruta. Un admin sin inscripción
 * ve la academia en vista previa, como si fuera del área que elija (con los
 * borradores incluidos y sin poder enviar nada). Los demás, sin inscripción,
 * ven un aviso.
 */
export async function resolverAcceso(username: string, role: string, nombre: string, areaPedida: string | null): Promise<Acceso> {
  const cuenta = await cuentaDe(username)
  if (cuenta) {
    const area = await areaInscrita(cuenta.id)
    if (area && !(role === 'admin' && areaPedida)) return { tipo: 'inscrito', cuenta, area }
  }
  if (role === 'admin') return { tipo: 'vista_previa', cuenta, area: esArea(areaPedida) ? areaPedida : AREAS_ACADEMIA[0]!.id }
  return { tipo: 'sin_inscripcion', nombre: cuenta?.nombre || nombre }
}
