/**
 * Talento humano: lecturas y escrituras en la base.
 *
 * Las lecturas reciben el cliente por parámetro para que la herramienta del
 * asistente (que trae su propia base en el contexto) y las pruebas usen las
 * mismas consultas. Las escrituras validan todo lo que llega del navegador:
 * fechas reales, catálogos conocidos y enlaces solo http(s), porque los
 * enlaces se pintan como <a href> en el panel.
 */
import type { Client } from '@libsql/client'
import { asegurarEsquema, cliente } from '../db.ts'
import { UserError } from '../apiError.ts'
import { GENERAL, MODULOS } from '../capacitacion.ts'
import {
  AJUSTES_BASE,
  AREAS_EMPRESA,
  ESTADOS_NOVEDAD,
  TIPOS_CONTRATO,
  TIPOS_CURSO,
  TIPOS_DOCUMENTO,
  TIPOS_NOVEDAD,
  contarDias,
  esDe,
  esFecha,
  masMeses,
  promedioNotas,
  saldoVacaciones,
  vencimientos,
  type AjustesTalento,
  type Aviso,
  type Criterio,
  type Empleado,
  type SaldoVacaciones,
} from './reglas.ts'

const ahora = () => new Date().toISOString()
const str = (v: unknown) => (v == null ? '' : String(v))
const num = (v: unknown) => Number(v ?? 0) || 0

// ---------- Tipos ----------

export interface Ficha extends Empleado {
  documento: string
  area: string
  jefe: string
  salario: number | null
  telefono: string
  correo_personal: string
  emergencia_nombre: string
  emergencia_telefono: string
  eps: string
  pension: string
  cesantias: string
  arl: string
  caja: string
  notas: string
  updated_at: string
}

export interface Persona {
  usuario_id: number
  nombre: string
  username: string
  rol: string
  cuentaActiva: boolean
  ficha: Ficha | null
}

export interface Cargo {
  id: number
  nombre: string
  area: string
  descripcion: string
  criterios: Criterio[]
}

export interface DocumentoTH {
  id: number
  usuario_id: number
  tipo: string
  nombre: string
  enlace: string
  fecha_expedicion: string
  fecha_vencimiento: string
  notas: string
}

export interface NovedadTH {
  id: number
  usuario_id: number
  tipo: string
  desde: string
  hasta: string
  dias_habiles: number
  dias_calendario: number
  estado: string
  motivo: string
  enlace: string
  decidido_por: string
  decidido_at: string
  creado_por: string
  created_at: string
}

export interface Curso {
  id: number
  nombre: string
  tipo: string
  proveedor: string
  horas: number
  vigencia_meses: number
  capacitacion_id: string
  descripcion: string
  activo: boolean
}

export interface FormacionTH {
  id: number
  usuario_id: number
  curso_id: number
  fecha: string
  vence_el: string
  enlace: string
  notas: string
}

export interface Calificacion {
  id: string
  nombre: string
  nota: number
  comentario: string
}

export interface EvaluacionTH {
  id: number
  usuario_id: number
  cargo: string
  periodo: string
  fecha: string
  evaluador: string
  calificaciones: Calificacion[]
  promedio: number
  fortalezas: string
  mejoras: string
  metas: string
  estado: string
}

export interface EstadoTalento {
  hoy: string
  ajustes: AjustesTalento
  personas: Persona[]
  cargos: Cargo[]
  documentos: DocumentoTH[]
  novedades: NovedadTH[]
  cursos: Curso[]
  formaciones: FormacionTH[]
  evaluaciones: EvaluacionTH[]
  saldos: Record<number, SaldoVacaciones>
  avisos: Aviso[]
}

// ---------- Lectura ----------

function json<T>(s: unknown, defecto: T): T {
  try {
    const v = JSON.parse(str(s))
    return v ?? defecto
  } catch {
    return defecto
  }
}

function aFicha(r: any): Ficha {
  return {
    usuario_id: num(r.usuario_id),
    documento: str(r.documento),
    cargo_id: r.cargo_id == null ? null : num(r.cargo_id) || null,
    area: str(r.area),
    jefe: str(r.jefe),
    tipo_contrato: str(r.tipo_contrato),
    fecha_ingreso: str(r.fecha_ingreso),
    fecha_fin_contrato: str(r.fecha_fin_contrato),
    fecha_retiro: str(r.fecha_retiro),
    fecha_nacimiento: str(r.fecha_nacimiento),
    salario: r.salario == null ? null : num(r.salario),
    telefono: str(r.telefono),
    correo_personal: str(r.correo_personal),
    emergencia_nombre: str(r.emergencia_nombre),
    emergencia_telefono: str(r.emergencia_telefono),
    eps: str(r.eps),
    pension: str(r.pension),
    cesantias: str(r.cesantias),
    arl: str(r.arl),
    caja: str(r.caja),
    vacaciones_ajuste: Number(r.vacaciones_ajuste) || 0,
    notas: str(r.notas),
    updated_at: str(r.updated_at),
  }
}

const aCargo = (r: any): Cargo => ({
  id: num(r.id),
  nombre: str(r.nombre),
  area: str(r.area),
  descripcion: str(r.descripcion),
  criterios: json<Criterio[]>(r.criterios, []),
})

const aDocumento = (r: any): DocumentoTH => ({
  id: num(r.id),
  usuario_id: num(r.usuario_id),
  tipo: str(r.tipo),
  nombre: str(r.nombre),
  enlace: str(r.enlace),
  fecha_expedicion: str(r.fecha_expedicion),
  fecha_vencimiento: str(r.fecha_vencimiento),
  notas: str(r.notas),
})

const aNovedad = (r: any): NovedadTH => ({
  id: num(r.id),
  usuario_id: num(r.usuario_id),
  tipo: str(r.tipo),
  desde: str(r.desde),
  hasta: str(r.hasta),
  dias_habiles: Number(r.dias_habiles) || 0,
  dias_calendario: num(r.dias_calendario),
  estado: str(r.estado),
  motivo: str(r.motivo),
  enlace: str(r.enlace),
  decidido_por: str(r.decidido_por),
  decidido_at: str(r.decidido_at),
  creado_por: str(r.creado_por),
  created_at: str(r.created_at),
})

const aCurso = (r: any): Curso => ({
  id: num(r.id),
  nombre: str(r.nombre),
  tipo: str(r.tipo),
  proveedor: str(r.proveedor),
  horas: Number(r.horas) || 0,
  vigencia_meses: num(r.vigencia_meses),
  capacitacion_id: str(r.capacitacion_id),
  descripcion: str(r.descripcion),
  activo: num(r.activo) === 1,
})

const aFormacion = (r: any): FormacionTH => ({
  id: num(r.id),
  usuario_id: num(r.usuario_id),
  curso_id: num(r.curso_id),
  fecha: str(r.fecha),
  vence_el: str(r.vence_el),
  enlace: str(r.enlace),
  notas: str(r.notas),
})

const aEvaluacion = (r: any): EvaluacionTH => ({
  id: num(r.id),
  usuario_id: num(r.usuario_id),
  cargo: str(r.cargo),
  periodo: str(r.periodo),
  fecha: str(r.fecha),
  evaluador: str(r.evaluador),
  calificaciones: json<Calificacion[]>(r.calificaciones, []),
  promedio: Number(r.promedio) || 0,
  fortalezas: str(r.fortalezas),
  mejoras: str(r.mejoras),
  metas: str(r.metas),
  estado: str(r.estado),
})

const CLAVE_AJUSTES = 'talento'

export async function leerAjustes(db: Client): Promise<AjustesTalento> {
  const r = await db.execute({ sql: 'SELECT valor FROM ajustes WHERE clave = ?', args: [CLAVE_AJUSTES] })
  const v = json<Partial<AjustesTalento>>(r.rows[0]?.valor, {})
  return {
    sabadoHabil: typeof v.sabadoHabil === 'boolean' ? v.sabadoHabil : AJUSTES_BASE.sabadoHabil,
    evaluacionMeses: Number.isInteger(v.evaluacionMeses) && v.evaluacionMeses! > 0 ? v.evaluacionMeses! : AJUSTES_BASE.evaluacionMeses,
  }
}

/**
 * Todo el estado de la sección. Para menos de 30 personas cabe en una sola
 * respuesta, y así cada escritura devuelve el estado completo y el panel no
 * tiene que reconciliar nada.
 */
export async function leerEstado(db: Client, hoy: string): Promise<EstadoTalento> {
  const [usuarios, fichas, cargos, documentos, novedades, cursos, formaciones, evaluaciones, ajustes] = await Promise.all([
    db.execute('SELECT id, username, name, role, active FROM users ORDER BY name COLLATE NOCASE'),
    db.execute('SELECT * FROM th_empleados'),
    db.execute('SELECT * FROM th_cargos ORDER BY nombre COLLATE NOCASE'),
    db.execute('SELECT * FROM th_documentos ORDER BY fecha_vencimiento DESC, id DESC'),
    db.execute('SELECT * FROM th_novedades ORDER BY desde DESC, id DESC'),
    db.execute('SELECT * FROM th_cursos ORDER BY activo DESC, tipo, nombre COLLATE NOCASE'),
    db.execute('SELECT * FROM th_formaciones ORDER BY fecha DESC, id DESC'),
    db.execute('SELECT * FROM th_evaluaciones ORDER BY fecha DESC, id DESC'),
    leerAjustes(db),
  ])
  const porUsuario = new Map(fichas.rows.map((r: any) => [num(r.usuario_id), aFicha(r)]))
  const personas: Persona[] = usuarios.rows.map((u: any) => ({
    usuario_id: num(u.id),
    nombre: str(u.name) || str(u.username),
    username: str(u.username),
    rol: str(u.role),
    cuentaActiva: num(u.active) === 1,
    ficha: porUsuario.get(num(u.id)) ?? null,
  }))
  // Lo que cuelga de una cuenta borrada no se muestra.
  const existe = new Set(personas.map((p) => p.usuario_id))
  const deAlguien = <T extends { usuario_id: number }>(filas: T[]) => filas.filter((f) => existe.has(f.usuario_id))

  const estado: EstadoTalento = {
    hoy,
    ajustes,
    personas,
    cargos: cargos.rows.map(aCargo),
    documentos: deAlguien(documentos.rows.map(aDocumento)),
    novedades: deAlguien(novedades.rows.map(aNovedad)),
    cursos: cursos.rows.map(aCurso),
    formaciones: deAlguien(formaciones.rows.map(aFormacion)),
    evaluaciones: deAlguien(evaluaciones.rows.map(aEvaluacion)),
    saldos: {},
    avisos: [],
  }
  const empleados = personas.map((p) => p.ficha).filter((f): f is Ficha => !!f)
  for (const e of empleados) estado.saldos[e.usuario_id] = saldoVacaciones(e, estado.novedades, hoy)
  estado.avisos = vencimientos(
    {
      empleados,
      documentos: estado.documentos,
      formaciones: estado.formaciones,
      novedades: estado.novedades,
      evaluaciones: estado.evaluaciones,
      cursos: new Map(estado.cursos.map((c) => [c.id, c.nombre])),
      cargosConCriterios: new Set(estado.cargos.filter((c) => c.criterios.length).map((c) => c.id)),
      ajustes,
    },
    hoy,
  )
  return estado
}

/** Para el panel y la API: crea el esquema, siembra los cursos de IA y lee. */
export async function cargarEstado(hoy: string): Promise<EstadoTalento> {
  await asegurarEsquema()
  await sembrarCursosIA()
  return leerEstado(cliente(), hoy)
}

let sembrado = false

/**
 * Los talleres de IA de /ia (src/lib/capacitacion.ts) como cursos, para
 * marcar quién asistió. Idempotente: busca por capacitacion_id.
 */
export async function sembrarCursosIA(): Promise<void> {
  if (sembrado) return
  const db = cliente()
  const existentes = await db.execute(`SELECT capacitacion_id FROM th_cursos WHERE capacitacion_id <> ''`)
  const ya = new Set(existentes.rows.map((r: any) => str(r.capacitacion_id)))
  const ts = ahora()
  for (const m of [GENERAL, ...MODULOS]) {
    if (ya.has(m.id)) continue
    await db.execute({
      sql: `INSERT INTO th_cursos (nombre, tipo, proveedor, capacitacion_id, descripcion, created_at, updated_at) VALUES (?, 'ia', 'Code by Mike', ?, ?, ?, ?)`,
      args: [m.id === 'general' ? 'IA: capacitación general' : `IA: taller de ${m.titulo}`, m.id, m.quien, ts, ts],
    })
  }
  sembrado = true
}

// ---------- Validación ----------

function texto(v: unknown, max = 200): string {
  return str(v).trim().slice(0, max)
}

function fechaOpcional(v: unknown, campo: string): string {
  const s = texto(v, 10)
  if (!s) return ''
  if (!esFecha(s)) throw new UserError(`La fecha de ${campo} no es válida`)
  return s
}

function fechaObligatoria(v: unknown, campo: string): string {
  const s = fechaOpcional(v, campo)
  if (!s) throw new UserError(`Falta la fecha de ${campo}`)
  return s
}

/** Solo http(s): un "javascript:" en un enlace sería código al hacer clic. */
function enlace(v: unknown): string {
  const s = texto(v, 1000)
  if (!s) return ''
  try {
    const u = new URL(s)
    if (u.protocol === 'https:' || u.protocol === 'http:') return u.toString()
  } catch {}
  throw new UserError('El enlace debe empezar por https:// (por ejemplo, el de Google Drive)')
}

function catalogo(v: unknown, lista: readonly { id: string }[], campo: string, opcional = false): string {
  const s = texto(v, 40)
  if (!s && opcional) return ''
  if (!esDe(lista as any, s)) throw new UserError(`${campo} no es válido`)
  return s
}

function idValido(v: unknown, campo = 'id'): number {
  const n = Number(v)
  if (!Number.isInteger(n) || n <= 0) throw new UserError(`${campo} inválido`)
  return n
}

async function usuarioExiste(db: Client, id: number): Promise<void> {
  const r = await db.execute({ sql: 'SELECT 1 FROM users WHERE id = ?', args: [id] })
  if (!r.rows.length) throw new UserError('Esa persona no tiene cuenta en el panel')
}

// ---------- Escrituras ----------

export async function guardarFicha(b: any): Promise<void> {
  const db = cliente()
  const usuario_id = idValido(b.usuario_id, 'Persona')
  await usuarioExiste(db, usuario_id)
  const tipo_contrato = catalogo(b.tipo_contrato, TIPOS_CONTRATO, 'El tipo de contrato', true)
  const fecha_ingreso = fechaOpcional(b.fecha_ingreso, 'ingreso')
  const fecha_fin_contrato = fechaOpcional(b.fecha_fin_contrato, 'fin del contrato')
  const fecha_retiro = fechaOpcional(b.fecha_retiro, 'retiro')
  if (fecha_ingreso && fecha_fin_contrato && fecha_fin_contrato < fecha_ingreso) throw new UserError('El fin del contrato no puede ser antes del ingreso')
  if (fecha_ingreso && fecha_retiro && fecha_retiro < fecha_ingreso) throw new UserError('El retiro no puede ser antes del ingreso')
  let salario: number | null = null
  if (b.salario !== '' && b.salario != null) {
    salario = Math.round(Number(String(b.salario).replace(/[^\d]/g, '')))
    if (!Number.isFinite(salario) || salario < 0) throw new UserError('El salario no es válido')
    if (salario === 0) salario = null
  }
  const ajuste = Number(String(b.vacaciones_ajuste ?? '0').replace(',', '.'))
  if (!Number.isFinite(ajuste) || Math.abs(ajuste) > 365) throw new UserError('El ajuste de vacaciones no es válido')
  let cargo_id: number | null = null
  if (b.cargo_id) {
    cargo_id = idValido(b.cargo_id, 'Cargo')
    const c = await db.execute({ sql: 'SELECT 1 FROM th_cargos WHERE id = ?', args: [cargo_id] })
    if (!c.rows.length) throw new UserError('Ese cargo ya no existe')
  }
  const ts = ahora()
  const campos = {
    documento: texto(b.documento, 30),
    cargo_id,
    area: catalogo(b.area, AREAS_EMPRESA, 'El área', true),
    jefe: texto(b.jefe, 120),
    tipo_contrato,
    fecha_ingreso,
    fecha_fin_contrato,
    fecha_retiro,
    fecha_nacimiento: fechaOpcional(b.fecha_nacimiento, 'nacimiento'),
    salario,
    telefono: texto(b.telefono, 40),
    correo_personal: texto(b.correo_personal, 160),
    emergencia_nombre: texto(b.emergencia_nombre, 120),
    emergencia_telefono: texto(b.emergencia_telefono, 40),
    eps: texto(b.eps, 80),
    pension: texto(b.pension, 80),
    cesantias: texto(b.cesantias, 80),
    arl: texto(b.arl, 80),
    caja: texto(b.caja, 80),
    vacaciones_ajuste: Math.round(ajuste * 100) / 100,
    notas: texto(b.notas, 2000),
  }
  const cols = Object.keys(campos)
  await db.execute({
    sql: `INSERT INTO th_empleados (usuario_id, ${cols.join(', ')}, created_at, updated_at)
          VALUES (?, ${cols.map(() => '?').join(', ')}, ?, ?)
          ON CONFLICT(usuario_id) DO UPDATE SET ${cols.map((c) => `${c} = excluded.${c}`).join(', ')}, updated_at = excluded.updated_at`,
    args: [usuario_id, ...Object.values(campos), ts, ts] as any[],
  })
}

function criteriosValidos(v: unknown): Criterio[] {
  if (!Array.isArray(v)) return []
  const vistos = new Set<string>()
  const out: Criterio[] = []
  for (const c of v.slice(0, 15)) {
    const nombre = texto(c?.nombre, 80)
    if (!nombre) continue
    let id = texto(c?.id, 40) || nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)
    while (vistos.has(id)) id += '_'
    vistos.add(id)
    out.push({ id, nombre, descripcion: texto(c?.descripcion, 300) })
  }
  return out
}

export async function guardarCargo(b: any): Promise<number> {
  const db = cliente()
  const nombre = texto(b.nombre, 120)
  if (!nombre) throw new UserError('El cargo necesita un nombre')
  const area = catalogo(b.area, AREAS_EMPRESA, 'El área', true)
  const criterios = JSON.stringify(criteriosValidos(b.criterios))
  const descripcion = texto(b.descripcion, 1000)
  const ts = ahora()
  if (b.id) {
    const id = idValido(b.id)
    await db.execute({
      sql: 'UPDATE th_cargos SET nombre = ?, area = ?, descripcion = ?, criterios = ?, updated_at = ? WHERE id = ?',
      args: [nombre, area, descripcion, criterios, ts, id],
    })
    return id
  }
  const r = await db.execute({
    sql: 'INSERT INTO th_cargos (nombre, area, descripcion, criterios, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [nombre, area, descripcion, criterios, ts, ts],
  })
  return Number(r.lastInsertRowid)
}

export async function eliminarCargo(idRaw: unknown): Promise<void> {
  const id = idValido(idRaw)
  const db = cliente()
  await db.batch(
    [
      { sql: 'UPDATE th_empleados SET cargo_id = NULL WHERE cargo_id = ?', args: [id] },
      { sql: 'DELETE FROM th_cargos WHERE id = ?', args: [id] },
    ],
    'write',
  )
}

export async function guardarDocumento(b: any): Promise<void> {
  const db = cliente()
  const usuario_id = idValido(b.usuario_id, 'Persona')
  await usuarioExiste(db, usuario_id)
  const tipo = catalogo(b.tipo, TIPOS_DOCUMENTO, 'El tipo de documento')
  const fecha_expedicion = fechaOpcional(b.fecha_expedicion, 'expedición')
  const fecha_vencimiento = fechaOpcional(b.fecha_vencimiento, 'vencimiento')
  if (fecha_expedicion && fecha_vencimiento && fecha_vencimiento < fecha_expedicion) throw new UserError('El vencimiento no puede ser antes de la expedición')
  const args = [usuario_id, tipo, texto(b.nombre, 160), enlace(b.enlace), fecha_expedicion, fecha_vencimiento, texto(b.notas, 1000)]
  const ts = ahora()
  if (b.id) {
    await db.execute({
      sql: 'UPDATE th_documentos SET usuario_id = ?, tipo = ?, nombre = ?, enlace = ?, fecha_expedicion = ?, fecha_vencimiento = ?, notas = ?, updated_at = ? WHERE id = ?',
      args: [...args, ts, idValido(b.id)],
    })
    return
  }
  await db.execute({
    sql: 'INSERT INTO th_documentos (usuario_id, tipo, nombre, enlace, fecha_expedicion, fecha_vencimiento, notas, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [...args, ts, ts],
  })
}

export async function eliminarDocumento(id: unknown): Promise<void> {
  await cliente().execute({ sql: 'DELETE FROM th_documentos WHERE id = ?', args: [idValido(id)] })
}

/** Estados que dejan constancia de quién decidió y cuándo. */
const DECIDIDOS = ['aprobada', 'rechazada', 'cancelada']

export async function guardarNovedad(b: any, quien: string): Promise<void> {
  const db = cliente()
  const usuario_id = idValido(b.usuario_id, 'Persona')
  await usuarioExiste(db, usuario_id)
  const tipo = catalogo(b.tipo, TIPOS_NOVEDAD, 'El tipo de novedad')
  const estado = catalogo(b.estado || 'solicitada', ESTADOS_NOVEDAD, 'El estado')
  const desde = fechaObligatoria(b.desde, 'inicio')
  const hasta = fechaObligatoria(b.hasta, 'fin')
  if (hasta < desde) throw new UserError('La fecha de fin no puede ser antes de la de inicio')
  const id = b.id ? idValido(b.id) : 0

  // Dos ausencias vigentes de la misma persona no pueden cruzarse.
  if (estado === 'solicitada' || estado === 'aprobada') {
    const cruce = await db.execute({
      sql: `SELECT tipo, desde, hasta FROM th_novedades
            WHERE usuario_id = ? AND id <> ? AND estado IN ('solicitada', 'aprobada') AND desde <= ? AND hasta >= ? LIMIT 1`,
      args: [usuario_id, id, hasta, desde],
    })
    const c: any = cruce.rows[0]
    if (c) throw new UserError(`Se cruza con otra novedad de la misma persona (del ${c.desde} al ${c.hasta})`)
  }

  const ajustes = await leerAjustes(db)
  const { habiles, calendario } = contarDias(desde, hasta, ajustes.sabadoHabil)
  if (tipo === 'vacaciones' && habiles === 0) throw new UserError('Ese rango no tiene ningún día hábil')
  const ts = ahora()
  const motivo = texto(b.motivo, 1000)
  const soporte = enlace(b.enlace)

  if (id) {
    const prev = await db.execute({ sql: 'SELECT estado, decidido_por, decidido_at FROM th_novedades WHERE id = ?', args: [id] })
    const p: any = prev.rows[0]
    if (!p) throw new UserError('Esa novedad ya no existe', 404)
    const cambia = str(p.estado) !== estado
    const decidido_por = cambia ? (DECIDIDOS.includes(estado) ? quien : '') : str(p.decidido_por)
    const decidido_at = cambia ? (DECIDIDOS.includes(estado) ? ts : '') : str(p.decidido_at)
    await db.execute({
      sql: `UPDATE th_novedades SET usuario_id = ?, tipo = ?, desde = ?, hasta = ?, dias_habiles = ?, dias_calendario = ?, estado = ?,
            motivo = ?, enlace = ?, decidido_por = ?, decidido_at = ?, updated_at = ? WHERE id = ?`,
      args: [usuario_id, tipo, desde, hasta, habiles, calendario, estado, motivo, soporte, decidido_por, decidido_at, ts, id],
    })
    return
  }
  const decidida = DECIDIDOS.includes(estado)
  await db.execute({
    sql: `INSERT INTO th_novedades (usuario_id, tipo, desde, hasta, dias_habiles, dias_calendario, estado, motivo, enlace, decidido_por, decidido_at, creado_por, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [usuario_id, tipo, desde, hasta, habiles, calendario, estado, motivo, soporte, decidida ? quien : '', decidida ? ts : '', quien, ts, ts],
  })
}

/** Cambia solo el estado (aprobar, rechazar, cancelar) desde la lista. */
export async function decidirNovedad(idRaw: unknown, estadoRaw: unknown, quien: string): Promise<void> {
  const id = idValido(idRaw)
  const estado = catalogo(estadoRaw, ESTADOS_NOVEDAD, 'El estado')
  const db = cliente()
  const r = await db.execute({ sql: 'SELECT usuario_id, desde, hasta, estado FROM th_novedades WHERE id = ?', args: [id] })
  const n: any = r.rows[0]
  if (!n) throw new UserError('Esa novedad ya no existe', 404)
  if (str(n.estado) === estado) return
  // Los días no se recalculan: quedan los que se fijaron al guardarla.
  if (estado === 'solicitada' || estado === 'aprobada') {
    const cruce = await db.execute({
      sql: `SELECT desde, hasta FROM th_novedades
            WHERE usuario_id = ? AND id <> ? AND estado IN ('solicitada', 'aprobada') AND desde <= ? AND hasta >= ? LIMIT 1`,
      args: [num(n.usuario_id), id, str(n.hasta), str(n.desde)],
    })
    const c: any = cruce.rows[0]
    if (c) throw new UserError(`Se cruza con otra novedad de la misma persona (del ${c.desde} al ${c.hasta})`)
  }
  const ts = ahora()
  const decidida = DECIDIDOS.includes(estado)
  await db.execute({
    sql: 'UPDATE th_novedades SET estado = ?, decidido_por = ?, decidido_at = ?, updated_at = ? WHERE id = ?',
    args: [estado, decidida ? quien : '', decidida ? ts : '', ts, id],
  })
}

export async function eliminarNovedad(id: unknown): Promise<void> {
  await cliente().execute({ sql: 'DELETE FROM th_novedades WHERE id = ?', args: [idValido(id)] })
}

export async function guardarCurso(b: any): Promise<number> {
  const db = cliente()
  const nombre = texto(b.nombre, 160)
  if (!nombre) throw new UserError('El curso necesita un nombre')
  const tipo = catalogo(b.tipo || 'interno', TIPOS_CURSO, 'El tipo de curso')
  const horas = Number(String(b.horas ?? '0').replace(',', '.')) || 0
  const vigencia = Math.trunc(Number(b.vigencia_meses ?? 0)) || 0
  if (horas < 0 || horas > 2000) throw new UserError('Las horas no son válidas')
  if (vigencia < 0 || vigencia > 120) throw new UserError('La vigencia debe estar entre 0 y 120 meses')
  const args = [nombre, tipo, texto(b.proveedor, 120), horas, vigencia, texto(b.descripcion, 1000), b.activo === false ? 0 : 1]
  const ts = ahora()
  if (b.id) {
    const id = idValido(b.id)
    await db.execute({
      sql: 'UPDATE th_cursos SET nombre = ?, tipo = ?, proveedor = ?, horas = ?, vigencia_meses = ?, descripcion = ?, activo = ?, updated_at = ? WHERE id = ?',
      args: [...args, ts, id],
    })
    return id
  }
  const r = await db.execute({
    sql: 'INSERT INTO th_cursos (nombre, tipo, proveedor, horas, vigencia_meses, descripcion, activo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [...args, ts, ts],
  })
  return Number(r.lastInsertRowid)
}

export async function eliminarCurso(idRaw: unknown): Promise<void> {
  const id = idValido(idRaw)
  const db = cliente()
  const r = await db.execute({ sql: 'SELECT capacitacion_id, (SELECT COUNT(*) FROM th_formaciones WHERE curso_id = ?) AS n FROM th_cursos WHERE id = ?', args: [id, id] })
  const c: any = r.rows[0]
  if (!c) return
  if (num(c.n) > 0) throw new UserError('Ese curso ya tiene asistentes registrados. Desactívelo en vez de borrarlo, para no perder el historial.')
  if (str(c.capacitacion_id)) throw new UserError('Los talleres de IA vienen del programa de capacitación y no se borran; puede desactivarlos.')
  await db.execute({ sql: 'DELETE FROM th_cursos WHERE id = ?', args: [id] })
}

/** Marca la asistencia de varias personas a un curso en una fecha. */
export async function registrarFormaciones(b: any): Promise<number> {
  const db = cliente()
  const curso_id = idValido(b.curso_id, 'Curso')
  const c = await db.execute({ sql: 'SELECT vigencia_meses FROM th_cursos WHERE id = ?', args: [curso_id] })
  if (!c.rows.length) throw new UserError('Ese curso ya no existe')
  const fecha = fechaObligatoria(b.fecha, 'realización')
  const vigencia = num((c.rows[0] as any).vigencia_meses)
  const vence_el = vigencia > 0 ? masMeses(fecha, vigencia) : ''
  const ids = [...new Set((Array.isArray(b.usuario_ids) ? b.usuario_ids : []).map((v: unknown) => idValido(v, 'Persona')))] as number[]
  if (!ids.length) throw new UserError('Elija al menos una persona')
  if (ids.length > 200) throw new UserError('Demasiadas personas en un solo registro')
  const existentes = await db.execute({ sql: `SELECT id FROM users WHERE id IN (${ids.map(() => '?').join(',')})`, args: ids })
  if (existentes.rows.length !== ids.length) throw new UserError('Alguna de las personas ya no tiene cuenta en el panel')
  // No se duplica la misma asistencia (persona, curso, fecha).
  const ya = await db.execute({
    sql: `SELECT usuario_id FROM th_formaciones WHERE curso_id = ? AND fecha = ? AND usuario_id IN (${ids.map(() => '?').join(',')})`,
    args: [curso_id, fecha, ...ids],
  })
  const repetidos = new Set(ya.rows.map((r: any) => num(r.usuario_id)))
  const nuevos = ids.filter((id) => !repetidos.has(id))
  const ts = ahora()
  const link = enlace(b.enlace)
  const notas = texto(b.notas, 500)
  if (nuevos.length) {
    await db.batch(
      nuevos.map((usuario_id) => ({
        sql: 'INSERT INTO th_formaciones (usuario_id, curso_id, fecha, vence_el, enlace, notas, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [usuario_id, curso_id, fecha, vence_el, link, notas, ts],
      })),
      'write',
    )
  }
  return nuevos.length
}

export async function eliminarFormacion(id: unknown): Promise<void> {
  await cliente().execute({ sql: 'DELETE FROM th_formaciones WHERE id = ?', args: [idValido(id)] })
}

export async function guardarEvaluacion(b: any, quien: string): Promise<number> {
  const db = cliente()
  const usuario_id = idValido(b.usuario_id, 'Persona')
  await usuarioExiste(db, usuario_id)
  const fecha = fechaObligatoria(b.fecha, 'la evaluación')
  const estado = b.estado === 'cerrada' ? 'cerrada' : 'borrador'
  const calificaciones: Calificacion[] = (Array.isArray(b.calificaciones) ? b.calificaciones : []).slice(0, 15).map((c: any) => {
    const nota = Math.round(Number(c?.nota))
    return {
      id: texto(c?.id, 40),
      nombre: texto(c?.nombre, 80),
      nota: nota >= 1 && nota <= 5 ? nota : 0,
      comentario: texto(c?.comentario, 500),
    }
  }).filter((c: Calificacion) => c.nombre)
  if (!calificaciones.length) throw new UserError('La evaluación no tiene criterios. Configúrelos en el cargo de la persona.')
  if (estado === 'cerrada' && calificaciones.some((c) => !c.nota)) throw new UserError('Para cerrar la evaluación, califique todos los criterios de 1 a 5')
  const promedio = promedioNotas(calificaciones.map((c) => c.nota))
  const ts = ahora()
  const args = [
    usuario_id, texto(b.cargo, 120), texto(b.periodo, 60), fecha, JSON.stringify(calificaciones), promedio,
    texto(b.fortalezas, 2000), texto(b.mejoras, 2000), texto(b.metas, 2000), estado,
  ]
  if (b.id) {
    const id = idValido(b.id)
    const prev = await db.execute({ sql: 'SELECT evaluador FROM th_evaluaciones WHERE id = ?', args: [id] })
    if (!prev.rows.length) throw new UserError('Esa evaluación ya no existe', 404)
    await db.execute({
      sql: `UPDATE th_evaluaciones SET usuario_id = ?, cargo = ?, periodo = ?, fecha = ?, calificaciones = ?, promedio = ?,
            fortalezas = ?, mejoras = ?, metas = ?, estado = ?, updated_at = ? WHERE id = ?`,
      args: [...args, ts, id],
    })
    return id
  }
  const r = await db.execute({
    sql: `INSERT INTO th_evaluaciones (usuario_id, cargo, periodo, fecha, calificaciones, promedio, fortalezas, mejoras, metas, estado, evaluador, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [...args, quien, ts, ts],
  })
  return Number(r.lastInsertRowid)
}

export async function eliminarEvaluacion(id: unknown): Promise<void> {
  await cliente().execute({ sql: 'DELETE FROM th_evaluaciones WHERE id = ?', args: [idValido(id)] })
}

export async function guardarAjustes(b: any): Promise<void> {
  const meses = Math.trunc(Number(b.evaluacionMeses))
  if (!Number.isInteger(meses) || meses < 1 || meses > 36) throw new UserError('La periodicidad de la evaluación debe estar entre 1 y 36 meses')
  const valor: AjustesTalento = { sabadoHabil: b.sabadoHabil === true, evaluacionMeses: meses }
  await cliente().execute({
    sql: `INSERT INTO ajustes (clave, valor, actualizado) VALUES (?, ?, ?)
          ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado = excluded.actualizado`,
    args: [CLAVE_AJUSTES, JSON.stringify(valor), ahora()],
  })
}

/** ¿La cuenta tiene ficha de talento humano? Para no borrarla sin querer. */
export async function tieneFicha(usuario_id: number): Promise<boolean> {
  await asegurarEsquema()
  const r = await cliente().execute({ sql: 'SELECT 1 FROM th_empleados WHERE usuario_id = ?', args: [usuario_id] })
  return r.rows.length > 0
}
