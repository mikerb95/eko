/**
 * Lectura y escritura del módulo de Finanzas en la base (tablas fin_*).
 * Las reglas viven en los módulos puros (calendario, estados, control,
 * avisos); aquí solo se guardan y se consultan datos.
 */
import { asegurarEsquema, cliente } from '../db.ts'
import { UserError } from '../apiError.ts'
import { obligacionesDelAnio, type Responsabilidades, type TipoObligacion } from './calendario.ts'
import type { Cuenta, Entidad, PagoExistente } from './control.ts'
import type { Estado, TipoSoporte } from './estados.ts'

const ahora = () => new Date().toISOString()
const db = () => cliente()

// ------------------------------------------------------------------ ajustes

export interface Config extends Responsabilidades {
  topeIaUsd: number
  /** `false` mientras no se confirmen las responsabilidades del RUT. */
  confirmado: boolean
}

/**
 * Valores de arranque, tomados del RUT de Ekosolv (actualización del
 * 2026-07-16, casilla 53: 05, 07, 09, 10, 14, 42, 48, 52, 55) y de lo que
 * confirmó Mike el 2026-11-25: no es gran contribuyente, ICA bimestral solo en
 * Bogotá. El RUT no dice si el IVA es bimestral o cuatrimestral (depende de
 * los ingresos del año anterior): queda bimestral, que avisa más seguido, y
 * `confirmado` en false hasta saberlo.
 */
export const CONFIG_INICIAL: Config = {
  nit: '900659506',
  dv: '9',
  retencion: true,
  iva: 'bimestral',
  renta: true,
  granContribuyente: false,
  activosExterior: false,
  exogena: true,
  pila: true,
  ica: 'bimestral',
  reteica: false,
  rub: true,
  topeIaUsd: 10,
  confirmado: false,
}

export async function leerConfig(): Promise<Config> {
  await asegurarEsquema()
  const r = await db().execute(`SELECT clave, valor FROM fin_config`)
  const guardado: Record<string, unknown> = {}
  for (const f of r.rows as any[]) {
    try {
      guardado[f.clave] = JSON.parse(f.valor)
    } catch {
      /* valor corrupto: se ignora y queda el de arranque */
    }
  }
  return { ...CONFIG_INICIAL, ...(guardado as Partial<Config>) }
}

export async function guardarConfig(c: Partial<Config>): Promise<Config> {
  await asegurarEsquema()
  const actual = await leerConfig()
  const limpio: Partial<Config> = {}
  if (c.nit !== undefined) {
    const nit = String(c.nit).replace(/\D/g, '')
    if (nit.length < 6 || nit.length > 12) throw new UserError('El NIT debe tener entre 6 y 12 dígitos, sin el de verificación.')
    limpio.nit = nit
  }
  if (c.dv !== undefined) {
    if (!/^\d$/.test(String(c.dv))) throw new UserError('El dígito de verificación es un solo número.')
    limpio.dv = String(c.dv)
  }
  for (const k of ['retencion', 'renta', 'granContribuyente', 'activosExterior', 'exogena', 'pila', 'reteica', 'rub', 'confirmado'] as const) {
    if (c[k] !== undefined) limpio[k] = !!c[k]
  }
  if (c.iva !== undefined) {
    if (!['bimestral', 'cuatrimestral', 'no'].includes(c.iva)) throw new UserError('Periodicidad de IVA inválida.')
    limpio.iva = c.iva
  }
  if (c.ica !== undefined) {
    if (!['bimestral', 'anual', 'no'].includes(c.ica)) throw new UserError('Periodicidad de ICA inválida.')
    limpio.ica = c.ica
  }
  if (c.topeIaUsd !== undefined) {
    const t = Number(c.topeIaUsd)
    if (!Number.isFinite(t) || t < 0 || t > 1000) throw new UserError('El tope de IA debe estar entre 0 y 1000 dólares.')
    limpio.topeIaUsd = t
  }
  const ts = ahora()
  for (const [k, v] of Object.entries(limpio)) {
    await db().execute({
      sql: `INSERT INTO fin_config (clave, valor, updated_at) VALUES (?, ?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, updated_at = excluded.updated_at`,
      args: [k, JSON.stringify(v), ts],
    })
  }
  return { ...actual, ...limpio }
}

// ------------------------------------------------------------------ usuarios

export interface Persona {
  id: number
  username: string
  nombre: string
  rol: string
}

/** Usuarios activos que tocan el módulo (finanzas, gerencia, admin). */
export async function personas(): Promise<Persona[]> {
  await asegurarEsquema()
  const r = await db().execute(`SELECT id, username, name, role FROM users WHERE active = 1 AND role IN ('finanzas', 'gerencia', 'admin') ORDER BY name`)
  return (r.rows as any[]).map((f) => ({ id: Number(f.id), username: String(f.username), nombre: String(f.name || f.username), rol: String(f.role) }))
}

// ------------------------------------------------------------------ eventos

export async function anotarEvento(e: { obligacion_id?: number | null; pago_id?: number | null; accion: string; detalle?: string; usuario: string; rol: string }): Promise<void> {
  await db().execute({
    sql: `INSERT INTO fin_eventos (obligacion_id, pago_id, accion, detalle, usuario, rol, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [e.obligacion_id ?? null, e.pago_id ?? null, e.accion, e.detalle ?? '', e.usuario, e.rol, ahora()],
  })
}

export interface Evento {
  id: number
  obligacion_id: number | null
  pago_id: number | null
  accion: string
  detalle: string
  usuario: string
  rol: string
  created_at: string
}

export async function eventosRecientes(limite = 300): Promise<Evento[]> {
  const r = await db().execute({ sql: `SELECT * FROM fin_eventos ORDER BY id DESC LIMIT ?`, args: [limite] })
  return (r.rows as any[]).map((f) => ({
    id: Number(f.id),
    obligacion_id: f.obligacion_id == null ? null : Number(f.obligacion_id),
    pago_id: f.pago_id == null ? null : Number(f.pago_id),
    accion: String(f.accion),
    detalle: String(f.detalle),
    usuario: String(f.usuario),
    rol: String(f.rol),
    created_at: String(f.created_at),
  }))
}

// ------------------------------------------------------------------ entidades y cuentas

const ENTIDADES_INICIALES: Omit<Entidad, 'activa'>[] = [
  { codigo: 'DIAN', nombre: 'DIAN', nit: '800197268-4', medio: 'PSE desde el portal de la DIAN', formulario_pago: 'Recibo oficial de pago 490' },
  { codigo: 'SDH', nombre: 'Secretaría Distrital de Hacienda de Bogotá', nit: '899999061-9', medio: 'PSE desde la oficina virtual', formulario_pago: 'Formulario de pago' },
  { codigo: 'PILA', nombre: 'Operador de la PILA', nit: '', medio: 'PSE desde el operador', formulario_pago: 'Número de planilla' },
]

export async function sembrarEntidades(): Promise<void> {
  await asegurarEsquema()
  const ts = ahora()
  for (const e of ENTIDADES_INICIALES) {
    await db().execute({
      sql: `INSERT OR IGNORE INTO fin_entidades (codigo, nombre, nit, medio, formulario_pago, activa, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [e.codigo, e.nombre, e.nit, e.medio, e.formulario_pago, ts, ts],
    })
  }
}

export async function listarEntidades(): Promise<Entidad[]> {
  const r = await db().execute(`SELECT * FROM fin_entidades ORDER BY codigo`)
  return (r.rows as any[]).map((f) => ({ codigo: String(f.codigo), nombre: String(f.nombre), nit: String(f.nit), medio: String(f.medio), formulario_pago: String(f.formulario_pago), activa: !!Number(f.activa) }))
}

export async function guardarEntidad(e: Partial<Entidad> & { codigo: string }): Promise<void> {
  const codigo = String(e.codigo || '').trim().toUpperCase()
  if (!/^[A-Z0-9_]{2,20}$/.test(codigo)) throw new UserError('El código de la entidad debe tener de 2 a 20 letras o números.')
  const nombre = String(e.nombre || '').trim()
  if (!nombre) throw new UserError('Escriba el nombre de la entidad.')
  const ts = ahora()
  await db().execute({
    sql: `INSERT INTO fin_entidades (codigo, nombre, nit, medio, formulario_pago, activa, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(codigo) DO UPDATE SET nombre = excluded.nombre, nit = excluded.nit, medio = excluded.medio, formulario_pago = excluded.formulario_pago, activa = excluded.activa, updated_at = excluded.updated_at`,
    args: [codigo, nombre, String(e.nit || '').trim(), String(e.medio || '').trim(), String(e.formulario_pago || '').trim(), e.activa === false ? 0 : 1, ts, ts],
  })
}

const filaCuenta = (f: any): Cuenta => ({ id: Number(f.id), alias: String(f.alias), banco: String(f.banco), tipo: String(f.tipo), ultimos: String(f.ultimos), activa: !!Number(f.activa) })

export async function listarCuentas(): Promise<Cuenta[]> {
  const r = await db().execute(`SELECT * FROM fin_cuentas ORDER BY activa DESC, alias`)
  return (r.rows as any[]).map(filaCuenta)
}

export async function guardarCuenta(c: Partial<Cuenta>): Promise<number> {
  const banco = String(c.banco || '').trim()
  const tipo = String(c.tipo || '').trim()
  const ultimos = String(c.ultimos || '').replace(/\D/g, '')
  if (!banco) throw new UserError('Escriba el banco.')
  if (!['ahorros', 'corriente'].includes(tipo)) throw new UserError('El tipo de cuenta es ahorros o corriente.')
  if (ultimos.length !== 4) throw new UserError('Escriba solo los últimos 4 dígitos de la cuenta.')
  const alias = String(c.alias || '').trim() || `${banco} ${tipo} ${ultimos}`
  const ts = ahora()
  if (c.id) {
    await db().execute({ sql: `UPDATE fin_cuentas SET alias = ?, banco = ?, tipo = ?, ultimos = ?, activa = ?, updated_at = ? WHERE id = ?`, args: [alias, banco, tipo, ultimos, c.activa === false ? 0 : 1, ts, c.id] })
    return c.id
  }
  const r = await db().execute({ sql: `INSERT INTO fin_cuentas (alias, banco, tipo, ultimos, activa, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)`, args: [alias, banco, tipo, ultimos, ts, ts] })
  return Number(r.lastInsertRowid)
}

// ------------------------------------------------------------------ obligaciones

export interface Obligacion {
  id: number
  clave: string
  tipo: TipoObligacion
  concepto: string
  entidad: string
  periodo: string
  formulario: string
  vence: string
  con_pago: boolean
  responsable_id: number | null
  estado: Estado
  valor_borrador: number | null
  fuente: string
  notas: string
  created_at: string
  updated_at: string
}

const filaObligacion = (f: any): Obligacion => ({
  id: Number(f.id),
  clave: String(f.clave),
  tipo: String(f.tipo) as TipoObligacion,
  concepto: String(f.concepto),
  entidad: String(f.entidad),
  periodo: String(f.periodo),
  formulario: String(f.formulario),
  vence: String(f.vence),
  con_pago: !!Number(f.con_pago),
  responsable_id: f.responsable_id == null ? null : Number(f.responsable_id),
  estado: String(f.estado) as Estado,
  valor_borrador: f.valor_borrador == null ? null : Number(f.valor_borrador),
  fuente: String(f.fuente),
  notas: String(f.notas),
  created_at: String(f.created_at),
  updated_at: String(f.updated_at),
})

export async function listarObligaciones(): Promise<Obligacion[]> {
  await asegurarEsquema()
  const r = await db().execute(`SELECT * FROM fin_obligaciones ORDER BY vence, id`)
  return (r.rows as any[]).map(filaObligacion)
}

export async function leerObligacion(id: number): Promise<Obligacion | null> {
  const r = await db().execute({ sql: `SELECT * FROM fin_obligaciones WHERE id = ?`, args: [id] })
  return r.rows[0] ? filaObligacion(r.rows[0]) : null
}

/**
 * Siembra el año; devuelve cuántas obligaciones nuevas quedaron (las existentes
 * no se tocan). Las que vencen antes de `desde` no se cargan: ya se pagaron por
 * fuera del sistema y solo serían falsas alarmas de "vencida".
 */
export async function sembrarAnio(r: Responsabilidades, anio: number, responsableId: number | null, desde = ''): Promise<number> {
  await asegurarEsquema()
  const ts = ahora()
  let nuevas = 0
  for (const o of obligacionesDelAnio(r, anio)) {
    if (desde && o.vence < desde) continue
    const res = await db().execute({
      sql: `INSERT OR IGNORE INTO fin_obligaciones (clave, tipo, concepto, entidad, periodo, formulario, vence, con_pago, responsable_id, estado, fuente, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?)`,
      args: [o.clave, o.tipo, o.concepto, o.entidad, o.periodo, o.formulario, o.vence, o.con_pago ? 1 : 0, responsableId, o.fuente, ts, ts],
    })
    nuevas += res.rowsAffected
  }
  return nuevas
}

const ISO = /^\d{4}-\d{2}-\d{2}$/

export async function crearObligacion(o: {
  tipo: string
  concepto: string
  entidad: string
  periodo: string
  formulario?: string
  vence: string
  con_pago: boolean
  responsable_id?: number | null
  notas?: string
  fuente?: string
  clave?: string
}): Promise<number> {
  await asegurarEsquema()
  const concepto = String(o.concepto || '').trim()
  if (!concepto) throw new UserError('Escriba el concepto de la obligación.')
  if (!ISO.test(o.vence)) throw new UserError('La fecha de vencimiento no es válida.')
  const entidad = String(o.entidad || '').trim().toUpperCase()
  if (!entidad) throw new UserError('Elija la entidad.')
  const ts = ahora()
  const clave = o.clave || `manual:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`
  const r = await db().execute({
    sql: `INSERT INTO fin_obligaciones (clave, tipo, concepto, entidad, periodo, formulario, vence, con_pago, responsable_id, estado, fuente, notas, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?, ?)`,
    args: [clave, o.tipo || 'otra', concepto, entidad, String(o.periodo || '').trim(), String(o.formulario || '').trim(), o.vence, o.con_pago ? 1 : 0, o.responsable_id ?? null, o.fuente || 'Cargada a mano', String(o.notas || ''), ts, ts],
  })
  return Number(r.lastInsertRowid)
}

/** Edita datos de la obligación. Fecha y valor solo antes de aprobar. */
export async function editarObligacion(id: number, c: { vence?: string; responsable_id?: number | null; notas?: string; valor_borrador?: number | null; concepto?: string; periodo?: string }): Promise<Obligacion> {
  const o = await leerObligacion(id)
  if (!o) throw new UserError('La obligación no existe.')
  const antesDeAprobar = o.estado === 'pendiente' || o.estado === 'borrador_listo' || o.estado === 'revisado'
  const sets: string[] = []
  const args: any[] = []
  if (c.vence !== undefined && c.vence !== o.vence) {
    if (!ISO.test(c.vence)) throw new UserError('La fecha de vencimiento no es válida.')
    sets.push('vence = ?')
    args.push(c.vence)
  }
  if (c.valor_borrador !== undefined && c.valor_borrador !== o.valor_borrador) {
    if (!antesDeAprobar) throw new UserError('El valor no se puede cambiar después de aprobar.')
    if (o.estado !== 'pendiente') throw new UserError('Para cambiar el valor, devuelva la obligación a pendiente: el borrador cambió.')
    const v = c.valor_borrador == null ? null : Math.round(Number(c.valor_borrador))
    if (v != null && (!Number.isFinite(v) || v < 0)) throw new UserError('El valor no es válido.')
    sets.push('valor_borrador = ?')
    args.push(v)
  }
  if (c.responsable_id !== undefined) {
    sets.push('responsable_id = ?')
    args.push(c.responsable_id)
  }
  if (c.notas !== undefined) {
    sets.push('notas = ?')
    args.push(String(c.notas).slice(0, 4000))
  }
  if (c.concepto !== undefined && String(c.concepto).trim()) {
    sets.push('concepto = ?')
    args.push(String(c.concepto).trim())
  }
  if (c.periodo !== undefined) {
    sets.push('periodo = ?')
    args.push(String(c.periodo).trim())
  }
  if (sets.length) {
    sets.push('updated_at = ?')
    args.push(ahora(), id)
    await db().execute({ sql: `UPDATE fin_obligaciones SET ${sets.join(', ')} WHERE id = ?`, args })
  }
  return (await leerObligacion(id))!
}

export async function cambiarEstado(id: number, estado: Estado): Promise<void> {
  await db().execute({ sql: `UPDATE fin_obligaciones SET estado = ?, updated_at = ? WHERE id = ?`, args: [estado, ahora(), id] })
}

/** Borrar solo si está pendiente, sin soportes ni pagos (p. ej. cargada por error). */
export async function eliminarObligacion(id: number): Promise<void> {
  const o = await leerObligacion(id)
  if (!o) return
  if (o.estado !== 'pendiente') throw new UserError('Solo se puede eliminar una obligación pendiente.')
  const s = await db().execute({ sql: `SELECT COUNT(*) AS n FROM fin_soportes WHERE obligacion_id = ?`, args: [id] })
  const p = await db().execute({ sql: `SELECT COUNT(*) AS n FROM fin_pagos WHERE obligacion_id = ?`, args: [id] })
  if (Number((s.rows[0] as any).n) || Number((p.rows[0] as any).n)) throw new UserError('La obligación tiene soportes o pagos: no se elimina.')
  await db().execute({ sql: `DELETE FROM fin_obligaciones WHERE id = ?`, args: [id] })
}

// ------------------------------------------------------------------ soportes

export interface Soporte {
  id: number
  obligacion_id: number
  tipo: TipoSoporte
  nombre: string
  ruta: string
  mime: string
  tamano: number
  subido_por: string
  created_at: string
}

const filaSoporte = (f: any): Soporte => ({
  id: Number(f.id),
  obligacion_id: Number(f.obligacion_id),
  tipo: String(f.tipo) as TipoSoporte,
  nombre: String(f.nombre),
  ruta: String(f.ruta),
  mime: String(f.mime),
  tamano: Number(f.tamano),
  subido_por: String(f.subido_por),
  created_at: String(f.created_at),
})

export async function agregarSoporte(s: Omit<Soporte, 'id' | 'created_at'>): Promise<number> {
  const r = await db().execute({
    sql: `INSERT INTO fin_soportes (obligacion_id, tipo, nombre, ruta, mime, tamano, subido_por, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [s.obligacion_id, s.tipo, s.nombre, s.ruta, s.mime, s.tamano, s.subido_por, ahora()],
  })
  return Number(r.lastInsertRowid)
}

export async function listarSoportes(): Promise<Soporte[]> {
  const r = await db().execute(`SELECT * FROM fin_soportes ORDER BY id`)
  return (r.rows as any[]).map(filaSoporte)
}

export async function soportesDe(obligacionId: number): Promise<Soporte[]> {
  const r = await db().execute({ sql: `SELECT * FROM fin_soportes WHERE obligacion_id = ? ORDER BY id`, args: [obligacionId] })
  return (r.rows as any[]).map(filaSoporte)
}

export async function leerSoporte(id: number): Promise<Soporte | null> {
  const r = await db().execute({ sql: `SELECT * FROM fin_soportes WHERE id = ?`, args: [id] })
  return r.rows[0] ? filaSoporte(r.rows[0]) : null
}

// ------------------------------------------------------------------ pagos

export interface Pago {
  id: number
  obligacion_id: number
  valor: number
  entidad: string
  referencia: string
  cuenta_id: number | null
  estado: 'por_aprobar' | 'aprobado' | 'rechazado' | 'pagado' | 'anulado'
  preparado_por: string
  preparado_at: string
  aprobado_por: string
  aprobado_at: string
  motivo_rechazo: string
  chequeos: unknown[]
  verificacion: string[]
  pagado_at: string
  created_at: string
}

const json = <T>(s: unknown, d: T): T => {
  try {
    return JSON.parse(String(s)) as T
  } catch {
    return d
  }
}

const filaPago = (f: any): Pago => ({
  id: Number(f.id),
  obligacion_id: Number(f.obligacion_id),
  valor: Number(f.valor),
  entidad: String(f.entidad),
  referencia: String(f.referencia),
  cuenta_id: f.cuenta_id == null ? null : Number(f.cuenta_id),
  estado: String(f.estado) as Pago['estado'],
  preparado_por: String(f.preparado_por),
  preparado_at: String(f.preparado_at),
  aprobado_por: String(f.aprobado_por),
  aprobado_at: String(f.aprobado_at),
  motivo_rechazo: String(f.motivo_rechazo),
  chequeos: json(f.chequeos, []),
  verificacion: json(f.verificacion, []),
  pagado_at: String(f.pagado_at),
  created_at: String(f.created_at),
})

export async function listarPagos(): Promise<Pago[]> {
  const r = await db().execute(`SELECT * FROM fin_pagos ORDER BY id DESC`)
  return (r.rows as any[]).map(filaPago)
}

export async function leerPago(id: number): Promise<Pago | null> {
  const r = await db().execute({ sql: `SELECT * FROM fin_pagos WHERE id = ?`, args: [id] })
  return r.rows[0] ? filaPago(r.rows[0]) : null
}

/** Todos los pagos con el tipo y periodo de su obligación, para el chequeo de duplicados. */
export async function pagosExistentes(): Promise<PagoExistente[]> {
  const r = await db().execute(`SELECT p.id, p.obligacion_id, p.referencia, p.estado, o.tipo, o.periodo FROM fin_pagos p JOIN fin_obligaciones o ON o.id = p.obligacion_id`)
  return (r.rows as any[]).map((f) => ({ id: Number(f.id), obligacion_id: Number(f.obligacion_id), tipo: String(f.tipo), periodo: String(f.periodo), referencia: String(f.referencia), estado: String(f.estado) }))
}

export async function crearPago(p: { obligacion_id: number; valor: number; entidad: string; referencia: string; cuenta_id: number | null; preparado_por: string; chequeos: unknown[] }): Promise<number> {
  const ts = ahora()
  const r = await db().execute({
    sql: `INSERT INTO fin_pagos (obligacion_id, valor, entidad, referencia, cuenta_id, estado, preparado_por, preparado_at, chequeos, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'por_aprobar', ?, ?, ?, ?, ?)`,
    args: [p.obligacion_id, p.valor, p.entidad, p.referencia.trim(), p.cuenta_id, p.preparado_por, ts, JSON.stringify(p.chequeos), ts, ts],
  })
  return Number(r.lastInsertRowid)
}

export async function actualizarPago(id: number, c: Partial<Pick<Pago, 'estado' | 'aprobado_por' | 'aprobado_at' | 'motivo_rechazo' | 'pagado_at'>> & { chequeos?: unknown[]; verificacion?: string[] }): Promise<void> {
  const sets: string[] = []
  const args: any[] = []
  for (const k of ['estado', 'aprobado_por', 'aprobado_at', 'motivo_rechazo', 'pagado_at'] as const) {
    if (c[k] !== undefined) {
      sets.push(`${k} = ?`)
      args.push(c[k])
    }
  }
  if (c.chequeos) {
    sets.push('chequeos = ?')
    args.push(JSON.stringify(c.chequeos))
  }
  if (c.verificacion) {
    sets.push('verificacion = ?')
    args.push(JSON.stringify(c.verificacion))
  }
  sets.push('updated_at = ?')
  args.push(ahora(), id)
  await db().execute({ sql: `UPDATE fin_pagos SET ${sets.join(', ')} WHERE id = ?`, args })
}

// ------------------------------------------------------------------ destinatarios

export interface Destinatario {
  id: number
  grupo: 'finanzas' | 'gerencia'
  usuario_id: number | null
  correo: string
  activo: boolean
}

export async function listarDestinatarios(): Promise<Destinatario[]> {
  const r = await db().execute(`SELECT * FROM fin_destinatarios ORDER BY grupo, id`)
  return (r.rows as any[]).map((f) => ({ id: Number(f.id), grupo: String(f.grupo) as Destinatario['grupo'], usuario_id: f.usuario_id == null ? null : Number(f.usuario_id), correo: String(f.correo), activo: !!Number(f.activo) }))
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Agrega un correo a un grupo, o ajusta el de un usuario del panel (cambiarlo
 * o sacarlo de los avisos con activo = false).
 */
export async function guardarDestinatario(d: { id?: number; grupo: string; usuario_id?: number | null; correo?: string; activo?: boolean }): Promise<void> {
  const grupo = d.grupo === 'gerencia' ? 'gerencia' : 'finanzas'
  const correo = String(d.correo || '').trim().toLowerCase()
  if (correo && !CORREO.test(correo)) throw new UserError('El correo no es válido.')
  const ts = ahora()
  if (d.id) {
    await db().execute({ sql: `UPDATE fin_destinatarios SET correo = ?, activo = ?, updated_at = ? WHERE id = ?`, args: [correo, d.activo === false ? 0 : 1, ts, d.id] })
    return
  }
  if (d.usuario_id) {
    const ya = await db().execute({ sql: `SELECT id FROM fin_destinatarios WHERE usuario_id = ? AND grupo = ?`, args: [d.usuario_id, grupo] })
    if (ya.rows[0]) {
      await db().execute({ sql: `UPDATE fin_destinatarios SET correo = ?, activo = ?, updated_at = ? WHERE id = ?`, args: [correo, d.activo === false ? 0 : 1, ts, Number((ya.rows[0] as any).id)] })
      return
    }
  } else if (!correo) {
    throw new UserError('Escriba el correo.')
  }
  await db().execute({
    sql: `INSERT INTO fin_destinatarios (grupo, usuario_id, correo, activo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [grupo, d.usuario_id ?? null, correo, d.activo === false ? 0 : 1, ts, ts],
  })
}

export async function eliminarDestinatario(id: number): Promise<void> {
  await db().execute({ sql: `DELETE FROM fin_destinatarios WHERE id = ? AND usuario_id IS NULL`, args: [id] })
}

export interface DestinoResuelto {
  grupo: 'finanzas' | 'gerencia'
  usuario_id: number | null
  nombre: string
  correo: string
  activo: boolean
  /** Fila de fin_destinatarios que lo ajusta, si la hay. */
  ajuste_id: number | null
  origen: 'usuario' | 'agregado'
}

/**
 * Quién recibe los avisos de cada grupo: el correo de cada usuario del panel
 * con ese rol (su usuario, si es un correo, o el que se le haya escrito en
 * Ajustes), más los correos agregados a mano.
 */
export function resolverDestinos(ps: readonly Persona[], ds: readonly Destinatario[]): DestinoResuelto[] {
  const out: DestinoResuelto[] = []
  for (const grupo of ['finanzas', 'gerencia'] as const) {
    for (const p of ps.filter((x) => x.rol === grupo)) {
      const ajuste = ds.find((d) => d.usuario_id === p.id && d.grupo === grupo)
      const correo = ajuste?.correo || (CORREO.test(p.username) ? p.username.toLowerCase() : '')
      out.push({ grupo, usuario_id: p.id, nombre: p.nombre, correo, activo: ajuste ? ajuste.activo : true, ajuste_id: ajuste?.id ?? null, origen: 'usuario' })
    }
    for (const d of ds.filter((x) => x.grupo === grupo && x.usuario_id == null)) {
      out.push({ grupo, usuario_id: null, nombre: '', correo: d.correo, activo: d.activo, ajuste_id: d.id, origen: 'agregado' })
    }
  }
  return out
}

export function correosDe(destinos: readonly DestinoResuelto[], grupo: 'finanzas' | 'gerencia'): string[] {
  return [...new Set(destinos.filter((d) => d.grupo === grupo && d.activo && d.correo).map((d) => d.correo))]
}

export async function destinos(): Promise<DestinoResuelto[]> {
  return resolverDestinos(await personas(), await listarDestinatarios())
}

// ------------------------------------------------------------------ avisos enviados

export async function clavesEnviadas(): Promise<Set<string>> {
  const r = await db().execute(`SELECT clave FROM fin_avisos WHERE enviado = 1`)
  return new Set((r.rows as any[]).map((f) => String(f.clave)))
}

/**
 * Reserva la clave antes de enviar (si dos ejecuciones coinciden, solo una
 * envía). Devuelve `false` si ya estaba.
 */
export async function reservarAviso(a: { clave: string; obligacion_id?: number | null; umbral?: number | null; escalado?: boolean }): Promise<boolean> {
  const r = await db().execute({
    sql: `INSERT OR IGNORE INTO fin_avisos (clave, obligacion_id, umbral, escalado, enviado, created_at) VALUES (?, ?, ?, ?, 0, ?)`,
    args: [a.clave, a.obligacion_id ?? null, a.umbral ?? null, a.escalado ? 1 : 0, ahora()],
  })
  if (r.rowsAffected) return true
  // Ya existía: si quedó sin enviar (falló el correo), se reintenta.
  const f = await db().execute({ sql: `SELECT enviado FROM fin_avisos WHERE clave = ?`, args: [a.clave] })
  return !Number((f.rows[0] as any)?.enviado)
}

export async function marcarAviso(clave: string, enviado: boolean, destinatarios: string[]): Promise<void> {
  await db().execute({ sql: `UPDATE fin_avisos SET enviado = ?, destinatarios = ? WHERE clave = ?`, args: [enviado ? 1 : 0, destinatarios.join(', '), clave] })
}

export async function avisosRecientes(limite = 100): Promise<{ clave: string; obligacion_id: number | null; umbral: number | null; escalado: boolean; destinatarios: string; enviado: boolean; created_at: string }[]> {
  const r = await db().execute({ sql: `SELECT * FROM fin_avisos ORDER BY id DESC LIMIT ?`, args: [limite] })
  return (r.rows as any[]).map((f) => ({
    clave: String(f.clave),
    obligacion_id: f.obligacion_id == null ? null : Number(f.obligacion_id),
    umbral: f.umbral == null ? null : Number(f.umbral),
    escalado: !!Number(f.escalado),
    destinatarios: String(f.destinatarios),
    enviado: !!Number(f.enviado),
    created_at: String(f.created_at),
  }))
}
