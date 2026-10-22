/**
 * Lecturas y escrituras del agente de cumplimiento en la base.
 *
 * Mismo criterio que el resto de `src/lib`: un solo cliente y un solo arranque
 * de esquema (`db.ts`), consultas con parámetros y fechas en ISO.
 */
import { asegurarEsquema, cliente } from '../db'
import { normalizarNumero, type AlertaNueva, type ExpedienteRef } from './alerta'
import { normalizarExtraccion, type Extraccion } from './extraccion'
import { esPrioridad, esTipoActo, REGLAS_INICIALES, type Regla } from './reglas'

const ahora = () => new Date().toISOString()
const str = (v: unknown) => (v == null ? '' : String(v))
const num = (v: unknown) => Number(v ?? 0) || 0

// ---------- Expedientes ----------

export interface Expediente extends ExpedienteRef {
  tipo_permiso: string
  responsable_email: string
  notas: string
  created_at?: string
  updated_at?: string
}

function aExpediente(r: any): Expediente {
  return {
    id: num(r.id),
    cliente: str(r.cliente),
    nit: str(r.nit),
    autoridad: str(r.autoridad),
    numero: str(r.numero),
    numero_norm: str(r.numero_norm),
    tipo_permiso: str(r.tipo_permiso),
    responsable: str(r.responsable),
    responsable_email: str(r.responsable_email),
    notas: str(r.notas),
    activo: num(r.activo) === 1,
    created_at: str(r.created_at),
    updated_at: str(r.updated_at),
  }
}

export async function listarExpedientes(): Promise<Expediente[]> {
  await asegurarEsquema()
  const res = await cliente().execute('SELECT * FROM expedientes ORDER BY activo DESC, cliente ASC, numero ASC')
  return res.rows.map(aExpediente)
}

export async function guardarExpediente(e: Partial<Expediente>): Promise<number> {
  await asegurarEsquema()
  const db = cliente()
  const args = [
    str(e.cliente).trim(),
    str(e.nit).trim(),
    str(e.autoridad).trim(),
    str(e.numero).trim(),
    normalizarNumero(str(e.numero)),
    str(e.tipo_permiso).trim(),
    str(e.responsable).trim(),
    str(e.responsable_email).trim(),
    str(e.notas).trim(),
    e.activo === false ? 0 : 1,
    ahora(),
  ]
  if (e.id) {
    await db.execute({
      sql: `UPDATE expedientes SET cliente=?,nit=?,autoridad=?,numero=?,numero_norm=?,tipo_permiso=?,responsable=?,
            responsable_email=?,notas=?,activo=?,updated_at=? WHERE id=?`,
      args: [...args, e.id],
    })
    return e.id
  }
  const res = await db.execute({
    sql: `INSERT INTO expedientes (cliente,nit,autoridad,numero,numero_norm,tipo_permiso,responsable,responsable_email,notas,activo,updated_at,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [...args, ahora()],
  })
  return Number(res.lastInsertRowid)
}

export async function eliminarExpediente(id: number): Promise<void> {
  await asegurarEsquema()
  // Se desactiva en vez de borrar: las alertas viejas siguen apuntando a él.
  await cliente().execute({ sql: 'UPDATE expedientes SET activo=0, updated_at=? WHERE id=?', args: [ahora(), id] })
}

// ---------- Reglas ----------

function aRegla(r: any): Regla {
  return {
    id: num(r.id),
    tipo_acto: esTipoActo(r.tipo_acto) ? r.tipo_acto : 'otro',
    nombre: str(r.nombre),
    prioridad: esPrioridad(r.prioridad) ? r.prioridad : 'media',
    umbral_alta: num(r.umbral_alta),
    accion: str(r.accion),
    activa: num(r.activa) === 1,
  }
}

/** Siembra las reglas iniciales la primera vez. Idempotente. */
export async function sembrarReglas(): Promise<void> {
  await asegurarEsquema()
  const db = cliente()
  for (const r of REGLAS_INICIALES) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO reglas_agente (tipo_acto,nombre,prioridad,umbral_alta,accion,activa,updated_at) VALUES (?,?,?,?,?,?,?)`,
      args: [r.tipo_acto, r.nombre, r.prioridad, r.umbral_alta, r.accion, r.activa ? 1 : 0, ahora()],
    })
  }
}

export async function listarReglas(): Promise<Regla[]> {
  await sembrarReglas()
  const res = await cliente().execute('SELECT * FROM reglas_agente ORDER BY id ASC')
  return res.rows.map(aRegla)
}

export async function guardarRegla(r: Partial<Regla> & { id: number }): Promise<void> {
  await asegurarEsquema()
  await cliente().execute({
    sql: 'UPDATE reglas_agente SET nombre=?,prioridad=?,umbral_alta=?,accion=?,activa=?,updated_at=? WHERE id=?',
    args: [str(r.nombre).trim(), esPrioridad(r.prioridad) ? r.prioridad : 'media', Math.max(0, num(r.umbral_alta)), str(r.accion).trim(), r.activa === false ? 0 : 1, ahora(), r.id],
  })
}

// ---------- Actos ----------

export type EstadoActo = 'pendiente' | 'procesado' | 'sin_clave' | 'error'

export interface Acto {
  id: number
  origen: string
  archivo_nombre: string
  archivo_tipo: string
  fecha_notificacion: string
  expediente_id: number
  estado: EstadoActo
  error: string
  extraccion: Extraccion | null
  modelo: string
  tokens_entrada: number
  tokens_salida: number
  subido_por: string
  created_at: string
}

function aActo(r: any): Acto {
  let ext: Extraccion | null = null
  try {
    const crudo = JSON.parse(str(r.extraccion) || '{}')
    ext = crudo && Object.keys(crudo).length ? normalizarExtraccion(crudo) : null
  } catch {
    ext = null
  }
  return {
    id: num(r.id),
    origen: str(r.origen),
    archivo_nombre: str(r.archivo_nombre),
    archivo_tipo: str(r.archivo_tipo),
    fecha_notificacion: str(r.fecha_notificacion),
    expediente_id: num(r.expediente_id),
    estado: (['pendiente', 'procesado', 'sin_clave', 'error'].includes(str(r.estado)) ? str(r.estado) : 'pendiente') as EstadoActo,
    error: str(r.error),
    extraccion: ext,
    modelo: str(r.modelo),
    tokens_entrada: num(r.tokens_entrada),
    tokens_salida: num(r.tokens_salida),
    subido_por: str(r.subido_por),
    created_at: str(r.created_at),
  }
}

export async function buscarActoPorHash(hash: string): Promise<Acto | null> {
  await asegurarEsquema()
  const res = await cliente().execute({ sql: 'SELECT * FROM actos WHERE hash = ? LIMIT 1', args: [hash] })
  return res.rows.length ? aActo(res.rows[0]) : null
}

export async function crearActo(a: {
  origen: string
  archivo_nombre: string
  archivo_tipo: string
  hash: string
  fecha_notificacion: string
  subido_por: string
  contenido: string
}): Promise<number> {
  await asegurarEsquema()
  const db = cliente()
  const res = await db.execute({
    sql: `INSERT INTO actos (origen,archivo_nombre,archivo_tipo,hash,fecha_notificacion,estado,subido_por,created_at,updated_at)
          VALUES (?,?,?,?,?,'pendiente',?,?,?)`,
    args: [a.origen, a.archivo_nombre, a.archivo_tipo, a.hash, a.fecha_notificacion, a.subido_por, ahora(), ahora()],
  })
  const id = Number(res.lastInsertRowid)
  await db.execute({ sql: 'INSERT OR REPLACE INTO actos_archivos (acto_id, contenido) VALUES (?,?)', args: [id, a.contenido] })
  return id
}

export async function leerActo(id: number): Promise<Acto | null> {
  await asegurarEsquema()
  const res = await cliente().execute({ sql: 'SELECT * FROM actos WHERE id = ? LIMIT 1', args: [id] })
  return res.rows.length ? aActo(res.rows[0]) : null
}

export async function leerArchivo(actoId: number): Promise<string> {
  await asegurarEsquema()
  const res = await cliente().execute({ sql: 'SELECT contenido FROM actos_archivos WHERE acto_id = ?', args: [actoId] })
  return res.rows.length ? str(res.rows[0].contenido) : ''
}

export async function listarActos(limite = 100): Promise<Acto[]> {
  await asegurarEsquema()
  const res = await cliente().execute({ sql: 'SELECT * FROM actos ORDER BY id DESC LIMIT ?', args: [limite] })
  return res.rows.map(aActo)
}

export async function actualizarActo(
  id: number,
  cambios: Partial<{ estado: EstadoActo; error: string; extraccion: Extraccion; modelo: string; tokens_entrada: number; tokens_salida: number; expediente_id: number; fecha_notificacion: string }>,
): Promise<void> {
  await asegurarEsquema()
  const campos: string[] = []
  const args: (string | number)[] = []
  for (const [k, v] of Object.entries(cambios)) {
    if (v === undefined) continue
    campos.push(`${k}=?`)
    args.push(k === 'extraccion' ? JSON.stringify(v) : (v as string | number))
  }
  if (!campos.length) return
  campos.push('updated_at=?')
  args.push(ahora(), id)
  await cliente().execute({ sql: `UPDATE actos SET ${campos.join(',')} WHERE id=?`, args })
}

/** Actos que esperan la clave de IA, para procesarlos cuando aparezca. */
export async function actosSinClave(): Promise<number[]> {
  await asegurarEsquema()
  const res = await cliente().execute(`SELECT id FROM actos WHERE estado IN ('sin_clave','pendiente') ORDER BY id ASC LIMIT 20`)
  return res.rows.map((r) => num(r.id))
}

// ---------- Alertas ----------

export const ESTADOS_ALERTA = ['abierta', 'en_curso', 'cerrada', 'descartada'] as const
export type EstadoAlerta = (typeof ESTADOS_ALERTA)[number]

export interface Alerta extends Omit<AlertaNueva, 'por_confirmar'> {
  id: number
  acto_id: number
  por_confirmar: boolean
  estado: EstadoAlerta
  nota: string
  created_at: string
  updated_at: string
}

function aAlerta(r: any): Alerta {
  return {
    id: num(r.id),
    acto_id: num(r.acto_id),
    expediente_id: num(r.expediente_id),
    prioridad: esPrioridad(r.prioridad) ? r.prioridad : 'media',
    tipo_acto: str(r.tipo_acto),
    titulo: str(r.titulo),
    que_pide: str(r.que_pide),
    norma: str(r.norma),
    plazo_texto: str(r.plazo_texto),
    plazo_dias: num(r.plazo_dias),
    plazo_tipo: str(r.plazo_tipo),
    vence_el: str(r.vence_el),
    accion: str(r.accion),
    por_confirmar: num(r.por_confirmar) === 1,
    motivo_confirmar: str(r.motivo_confirmar),
    estado: ((ESTADOS_ALERTA as readonly string[]).includes(str(r.estado)) ? str(r.estado) : 'abierta') as EstadoAlerta,
    responsable: str(r.responsable),
    nota: str(r.nota),
    created_at: str(r.created_at),
    updated_at: str(r.updated_at),
  }
}

/** Crea la alerta de un acto, o la reemplaza si el acto se reprocesa. */
export async function guardarAlertaDeActo(actoId: number, a: AlertaNueva): Promise<number> {
  await asegurarEsquema()
  const db = cliente()
  const previa = await db.execute({ sql: 'SELECT id FROM alertas WHERE acto_id = ? LIMIT 1', args: [actoId] })
  const args = [
    a.expediente_id, a.prioridad, a.tipo_acto, a.titulo, a.que_pide, a.norma, a.plazo_texto, a.plazo_dias,
    a.plazo_tipo, a.vence_el, a.accion, a.por_confirmar ? 1 : 0, a.motivo_confirmar, a.responsable, ahora(),
  ]
  if (previa.rows.length) {
    const id = num(previa.rows[0].id)
    await db.execute({
      sql: `UPDATE alertas SET expediente_id=?,prioridad=?,tipo_acto=?,titulo=?,que_pide=?,norma=?,plazo_texto=?,plazo_dias=?,
            plazo_tipo=?,vence_el=?,accion=?,por_confirmar=?,motivo_confirmar=?,responsable=?,updated_at=? WHERE id=?`,
      args: [...args, id],
    })
    return id
  }
  const res = await db.execute({
    sql: `INSERT INTO alertas (expediente_id,prioridad,tipo_acto,titulo,que_pide,norma,plazo_texto,plazo_dias,plazo_tipo,vence_el,
          accion,por_confirmar,motivo_confirmar,responsable,updated_at,acto_id,estado,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'abierta',?)`,
    args: [...args, actoId, ahora()],
  })
  return Number(res.lastInsertRowid)
}

export async function listarAlertas(): Promise<Alerta[]> {
  await asegurarEsquema()
  // Abiertas primero; dentro de ellas, la que vence antes. Las que no tienen
  // vencimiento van al final de su grupo.
  const res = await cliente().execute(`
    SELECT * FROM alertas
    ORDER BY CASE estado WHEN 'abierta' THEN 0 WHEN 'en_curso' THEN 1 ELSE 2 END,
             CASE WHEN vence_el = '' THEN 1 ELSE 0 END, vence_el ASC, id DESC
    LIMIT 300`)
  return res.rows.map(aAlerta)
}

export async function actualizarAlerta(
  id: number,
  c: Partial<{ estado: EstadoAlerta; nota: string; responsable: string; por_confirmar: boolean; vence_el: string; expediente_id: number }>,
): Promise<void> {
  await asegurarEsquema()
  const campos: string[] = []
  const args: (string | number)[] = []
  if (c.estado && (ESTADOS_ALERTA as readonly string[]).includes(c.estado)) {
    campos.push('estado=?')
    args.push(c.estado)
  }
  if (c.nota !== undefined) {
    campos.push('nota=?')
    args.push(str(c.nota).slice(0, 2000))
  }
  if (c.responsable !== undefined) {
    campos.push('responsable=?')
    args.push(str(c.responsable).slice(0, 200))
  }
  if (c.por_confirmar !== undefined) {
    campos.push('por_confirmar=?')
    args.push(c.por_confirmar ? 1 : 0)
    if (!c.por_confirmar) {
      campos.push("motivo_confirmar=''")
    }
  }
  if (c.vence_el !== undefined && (c.vence_el === '' || /^\d{4}-\d{2}-\d{2}$/.test(c.vence_el))) {
    campos.push('vence_el=?')
    args.push(c.vence_el)
  }
  if (c.expediente_id !== undefined) {
    campos.push('expediente_id=?')
    args.push(num(c.expediente_id))
  }
  if (!campos.length) return
  campos.push('updated_at=?')
  args.push(ahora(), id)
  await cliente().execute({ sql: `UPDATE alertas SET ${campos.join(',')} WHERE id=?`, args })
}
