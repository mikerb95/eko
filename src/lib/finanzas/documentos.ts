/**
 * Lectura de documentos con IA: la persona sube la declaración, el recibo o
 * el requerimiento; la IA extrae los datos y el código los compara con lo
 * esperado. En un requerimiento, calcula el plazo y crea la obligación de
 * responderlo, que entra a los avisos como cualquier otra.
 *
 * - Sin ANTHROPIC_API_KEY el documento queda `sin_clave` (se puede revisar a
 *   mano y reintentar el día que haya clave). En local no hay clave: se prueba
 *   con el simulador (ANTHROPIC_BASE_URL).
 * - Tope mensual en dólares (Ajustes, por defecto US$10). Si se llega, el
 *   documento queda `tope` y se revisa a mano hasta el mes siguiente.
 * - Modelo: FIN_MODELO o Sonnet 5.5, con respaldo del servidor ante rechazos.
 */
import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'node:crypto'
import { asegurarEsquema, cliente } from '../db.ts'
import { UserError } from '../apiError.ts'
import { hoyEnBogota } from '../agente/diasHabiles.ts'
import { costoUsdModelo, sumarUso, USO_CERO } from '../asistente/costo.ts'
import { guardar, TAMANO_MAXIMO, TIPOS_PERMITIDOS } from './almacen.ts'
import { comparar, ESQUEMA_FIN, INSTRUCCIONES_FIN, normalizarFin, venceRequerimiento, type Diferencia, type ExtraccionFin } from './lectura.ts'
import { anotarEvento, crearObligacion, leerConfig, leerObligacion, leerPago, personas } from './datos.ts'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (process.env as any)?.[key] || ''
}
const db = () => cliente()
const ahora = () => new Date().toISOString()
const MODELO_DEFECTO = 'claude-sonnet-5-5'

export type EstadoDoc = 'pendiente' | 'leido' | 'sin_clave' | 'tope' | 'error'

export interface Documento {
  id: number
  obligacion_id: number | null
  tipo: string
  nombre: string
  ruta: string
  mime: string
  estado: EstadoDoc
  extraccion: ExtraccionFin | null
  diferencias: Diferencia[]
  error: string
  modelo: string
  costo_usd: number
  creada_obligacion_id: number | null
  subido_por: string
  created_at: string
}

const fila = (f: any): Documento => {
  let extraccion: ExtraccionFin | null = null
  let diferencias: Diferencia[] = []
  try {
    extraccion = f.extraccion ? JSON.parse(f.extraccion) : null
  } catch {}
  try {
    diferencias = JSON.parse(f.diferencias || '[]')
  } catch {}
  return {
    id: Number(f.id),
    obligacion_id: f.obligacion_id == null ? null : Number(f.obligacion_id),
    tipo: String(f.tipo),
    nombre: String(f.nombre),
    ruta: String(f.ruta),
    mime: String(f.mime),
    estado: String(f.estado) as EstadoDoc,
    extraccion,
    diferencias,
    error: String(f.error),
    modelo: String(f.modelo),
    costo_usd: Number(f.costo_usd) || 0,
    creada_obligacion_id: f.creada_obligacion_id == null ? null : Number(f.creada_obligacion_id),
    subido_por: String(f.subido_por),
    created_at: String(f.created_at),
  }
}

export async function listarDocumentos(limite = 200): Promise<Documento[]> {
  await asegurarEsquema()
  const r = await db().execute({ sql: `SELECT * FROM fin_documentos ORDER BY id DESC LIMIT ?`, args: [limite] })
  return (r.rows as any[]).map(fila)
}

export async function leerDocumento(id: number): Promise<Documento | null> {
  const r = await db().execute({ sql: `SELECT * FROM fin_documentos WHERE id = ?`, args: [id] })
  return r.rows[0] ? fila(r.rows[0]) : null
}

export async function gastoDelMes(mes = hoyEnBogota().slice(0, 7)): Promise<number> {
  const r = await db().execute({ sql: `SELECT COALESCE(SUM(costo_usd), 0) AS usd FROM fin_documentos WHERE mes = ?`, args: [mes] })
  return Number((r.rows[0] as any).usd) || 0
}

/** Guarda el archivo y lo lee. Si el mismo archivo ya se subió, devuelve ese. */
export async function subirDocumento(d: { datos: Uint8Array; mime: string; nombre: string; obligacion_id: number | null; usuario: string; rol: string }): Promise<Documento> {
  await asegurarEsquema()
  if (!(TIPOS_PERMITIDOS as readonly string[]).includes(d.mime)) throw new UserError('Suba un PDF o una imagen (PNG o JPG).')
  if (d.datos.byteLength > TAMANO_MAXIMO) throw new UserError('El archivo pesa más de 4 MB.')
  if (d.obligacion_id && !(await leerObligacion(d.obligacion_id))) throw new UserError('La obligación no existe.')
  const hash = createHash('sha256').update(d.datos).digest('hex')
  const ya = await db().execute({ sql: `SELECT * FROM fin_documentos WHERE hash = ? LIMIT 1`, args: [hash] })
  if (ya.rows[0]) return fila(ya.rows[0])
  const ruta = await guardar('documentos', d.nombre, d.datos, d.mime)
  const ts = ahora()
  const r = await db().execute({
    sql: `INSERT INTO fin_documentos (obligacion_id, nombre, ruta, mime, hash, estado, mes, subido_por, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pendiente', ?, ?, ?, ?)`,
    args: [d.obligacion_id, d.nombre.slice(0, 200), ruta, d.mime, hash, hoyEnBogota().slice(0, 7), d.usuario, ts, ts],
  })
  const id = Number(r.lastInsertRowid)
  await anotarEvento({ obligacion_id: d.obligacion_id, accion: 'documento_subido', detalle: d.nombre, usuario: d.usuario, rol: d.rol })
  await procesarDocumento(id, d.datos, d.usuario, d.rol)
  return (await leerDocumento(id))!
}

let _ia: Anthropic | null = null
const ia = () => (_ia ??= new Anthropic({ apiKey: env('ANTHROPIC_API_KEY') }))

function bloque(datos: Uint8Array, mime: string): Anthropic.Beta.BetaContentBlockParam {
  const b64 = Buffer.from(datos).toString('base64')
  if (mime === 'application/pdf') return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
  return { type: 'image', source: { type: 'base64', media_type: mime as 'image/png' | 'image/jpeg', data: b64 } }
}

async function actualizar(id: number, c: Record<string, unknown>): Promise<void> {
  const keys = Object.keys(c)
  await db().execute({ sql: `UPDATE fin_documentos SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = ? WHERE id = ?`, args: [...keys.map((k) => c[k] as any), ahora(), id] })
}

/** Lee el documento con la IA, compara y, si es un requerimiento con plazo, crea la obligación. */
export async function procesarDocumento(id: number, datos: Uint8Array, usuario: string, rol: string): Promise<void> {
  const doc = await leerDocumento(id)
  if (!doc) return
  if (!env('ANTHROPIC_API_KEY')) {
    await actualizar(id, { estado: 'sin_clave', error: 'La lectura con IA no está activa en este entorno. Revise el documento a mano.' })
    return
  }
  const config = await leerConfig()
  const gasto = await gastoDelMes()
  if (gasto >= config.topeIaUsd) {
    await actualizar(id, { estado: 'tope', error: `Se llegó al tope de US$${config.topeIaUsd} de este mes. Revise el documento a mano; la lectura vuelve el mes siguiente.` })
    return
  }
  const modelo = env('FIN_MODELO') || MODELO_DEFECTO
  try {
    const r = await ia().beta.messages.create({
      model: modelo,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: INSTRUCCIONES_FIN,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA_FIN as unknown as Record<string, unknown> } },
      messages: [{ role: 'user', content: [bloque(datos, doc.mime), { type: 'text', text: 'Extrae los datos de este documento tributario.' }] }],
    } as any)
    const costo = costoUsdModelo(sumarUso(USO_CERO, (r as any).usage), (r as any).model || modelo)
    if ((r as any).stop_reason === 'refusal' || (r as any).stop_reason === 'max_tokens') {
      await actualizar(id, { estado: 'error', error: 'La IA no pudo leer el documento. Revíselo a mano.', costo_usd: costo, modelo: (r as any).model || modelo })
      return
    }
    const t = (r as any).content?.find((b: any) => b.type === 'text')
    const extraccion = normalizarFin(JSON.parse(t?.text || '{}'))
    const ob = doc.obligacion_id ? await leerObligacion(doc.obligacion_id) : null
    const pago = ob ? await ultimoPagoVigente(ob.id) : null
    const diferencias = comparar(extraccion, { nit: config.nit, obligacion: ob, pago })
    await actualizar(id, {
      estado: 'leido',
      tipo: extraccion.tipo_documento,
      extraccion: JSON.stringify(extraccion),
      diferencias: JSON.stringify(diferencias),
      error: '',
      modelo: (r as any).model || modelo,
      costo_usd: costo,
    })
    if (extraccion.tipo_documento === 'requerimiento') await crearAlertaRequerimiento(id, extraccion.fecha_notificacion, usuario, rol)
  } catch (e: any) {
    console.error('[finanzas/documentos] lectura fallida', e?.message || e)
    await actualizar(id, { estado: 'error', error: 'No se pudo leer el documento. Intente de nuevo o revíselo a mano.' })
  }
}

async function ultimoPagoVigente(obligacionId: number) {
  const r = await db().execute({ sql: `SELECT id FROM fin_pagos WHERE obligacion_id = ? AND estado IN ('por_aprobar', 'aprobado', 'pagado') ORDER BY id DESC LIMIT 1`, args: [obligacionId] })
  return r.rows[0] ? leerPago(Number((r.rows[0] as any).id)) : null
}

/**
 * Crea la obligación de responder un requerimiento. Si el documento no trae
 * la fecha de notificación, el panel la pide y vuelve a llamar aquí.
 */
export async function crearAlertaRequerimiento(id: number, fechaNotificacion: string, usuario: string, rol: string): Promise<{ creada: number | null; motivo?: string }> {
  const doc = await leerDocumento(id)
  if (!doc?.extraccion) throw new UserError('El documento no se ha leído.')
  if (doc.creada_obligacion_id) return { creada: doc.creada_obligacion_id }
  const e = doc.extraccion
  const vence = venceRequerimiento(fechaNotificacion, e.plazo_cantidad, e.plazo_unidad)
  if (!vence) return { creada: null, motivo: !fechaNotificacion ? 'Falta la fecha de notificación.' : 'El requerimiento no trae un plazo que se pueda calcular.' }
  // El mismo requerimiento subido dos veces (otro escaneo, otra foto) se
  // reconoce por su radicado: se asocia a la alerta que ya existe.
  const radicado = e.referencia.replace(/[^\w]/g, '').toUpperCase()
  const clave = radicado ? `req:${e.entidad}:${radicado}` : `req:doc${id}`
  const ya = await db().execute({ sql: `SELECT id FROM fin_obligaciones WHERE clave = ?`, args: [clave] })
  if (ya.rows[0]) {
    const existente = Number((ya.rows[0] as any).id)
    await actualizar(id, { creada_obligacion_id: existente })
    return { creada: existente }
  }
  const unidad = { dias_habiles: 'días hábiles', dias_calendario: 'días calendario', meses: 'meses', sin_plazo: '' }[e.plazo_unidad]
  const obId = await crearObligacion({
    clave,
    tipo: 'requerimiento',
    concepto: `Responder requerimiento${e.referencia ? ` ${e.referencia}` : ''}${e.entidad !== 'otra' ? ` de ${e.entidad === 'SDH' ? 'Hacienda Bogotá' : e.entidad}` : ''}`,
    entidad: e.entidad === 'otra' ? 'OTRA' : e.entidad,
    periodo: e.periodo,
    vence,
    con_pago: false,
    notas: [e.que_pide, `Plazo: ${e.plazo_cantidad} ${unidad} desde la notificación del ${fechaNotificacion}.`].filter(Boolean).join('\n'),
    fuente: `Calculado por el sistema desde el requerimiento (documento #${id})`,
    // Queda a cargo de la primera persona de Finanzas; se puede cambiar en el expediente.
    responsable_id: (await personas()).find((p) => p.rol === 'finanzas')?.id ?? null,
  })
  await actualizar(id, { creada_obligacion_id: obId })
  await anotarEvento({ obligacion_id: obId, accion: 'requerimiento_alerta', detalle: `Vence ${vence} (documento #${id})`, usuario, rol })
  return { creada: obId }
}

/** Asocia un documento ya leído a una obligación y recalcula las diferencias. */
export async function asociarDocumento(id: number, obligacionId: number | null): Promise<void> {
  const doc = await leerDocumento(id)
  if (!doc) throw new UserError('El documento no existe.')
  const ob = obligacionId ? await leerObligacion(obligacionId) : null
  if (obligacionId && !ob) throw new UserError('La obligación no existe.')
  const config = await leerConfig()
  const diferencias = doc.extraccion ? comparar(doc.extraccion, { nit: config.nit, obligacion: ob, pago: ob ? await ultimoPagoVigente(ob.id) : null }) : []
  await actualizar(id, { obligacion_id: obligacionId, diferencias: JSON.stringify(diferencias) })
}
