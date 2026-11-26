/**
 * Lo que hace el módulo de Finanzas, con sus permisos: armar el estado del
 * panel, ejecutar cada acción y correr la tarea diaria (avisos y resúmenes).
 *
 * Permisos (además del middleware, que solo deja entrar a finanzas, gerencia
 * y admin):
 * - Finanzas (y el admin técnico, que ayuda a cargar): obligaciones,
 *   soportes, preparar y registrar pagos, documentos.
 * - Gerencia: aprueba o devuelve pagos, aprueba las obligaciones sin pago,
 *   administra cuentas y entidades autorizadas. Nunca aprueba lo que preparó.
 * - Cuentas y entidades autorizadas: solo Gerencia y admin. Si Finanzas
 *   pudiera agregar una cuenta, el chequeo de "cuenta autorizada" no
 *   protegería de nada.
 */
import { UserError } from '../apiError.ts'
import { habilesRestantes, hoyEnBogota } from '../agente/diasHabiles.ts'
import { booksConfigured } from '../zoho.ts'
import { leer as leerArchivo, guardar, TAMANO_MAXIMO, TIPOS_PERMITIDOS } from './almacen.ts'
import { avisosDelDia, nivel, resumenesDeHoy, textoPlazo } from './avisos.ts'
import { faltantesDelAnio, TIPO_TEXTO } from './calendario.ts'
import { chequear, listaVerificacion, listoParaAprobar, listoParaPagar, pesos, puedeAprobar, verificacionCompleta, type Cuenta, type PagoControl } from './control.ts'
import * as correo from './correo.ts'
import * as D from './datos.ts'
import { asociarDocumento, crearAlertaRequerimiento, gastoDelMes, leerDocumento, listarDocumentos, procesarDocumento } from './documentos.ts'
import { anterior, ESTADO_TEXTO, ESTADOS, puedeAvanzar, puedeDevolver, siguiente, soporteExigido, TIPOS_SOPORTE, type Estado, type TipoSoporte } from './estados.ts'
import { nombreMes, resumenMensual, resumenSemanal } from './resumen.ts'
import * as Siigo from './siigo.ts'
import { pesosTxt } from './proveedores.ts'
import { cifrasDelMes } from './zohoBooks.ts'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (process.env as any)?.[key] || ''
}

export interface Sesion {
  usuario: string // username, único
  nombre: string
  rol: string
}

const PREPARAN = ['finanzas', 'admin']
const AUTORIZAN = ['gerencia', 'admin']
const exigir = (s: Sesion, roles: string[], que: string) => {
  if (!roles.includes(s.rol)) throw new UserError(`Su rol no puede ${que}.`)
}

// ------------------------------------------------------------------ estado

async function controlDe(p: D.Pago, ob: D.Obligacion, ctx: { otros: Awaited<ReturnType<typeof D.pagosExistentes>>; cuentas: Cuenta[]; entidades: Awaited<ReturnType<typeof D.listarEntidades>>; config: D.Config }) {
  const pc: PagoControl = {
    id: p.id,
    obligacion_id: p.obligacion_id,
    valor: p.valor,
    entidad: p.entidad,
    referencia: p.referencia,
    cuenta_id: p.cuenta_id,
    estado: p.estado,
    preparado_por: p.preparado_por,
    aprobado_por: p.aprobado_por || undefined,
    // Solo se pudo aprobar con rol gerencia (puedeAprobar), así que se registra así.
    aprobado_rol: p.aprobado_por ? 'gerencia' : undefined,
  }
  const chequeos = chequear({ obligacion: ob, pago: pc, otrosPagos: ctx.otros, cuentas: ctx.cuentas, entidades: ctx.entidades })
  const cuenta = ctx.cuentas.find((c) => c.id === p.cuenta_id) ?? null
  const entidad = ctx.entidades.find((e) => e.codigo === p.entidad) ?? null
  const pasos = listaVerificacion({ obligacion: ob, pago: pc, cuenta, entidad, nit: ctx.config.nit, dv: ctx.config.dv })
  return { chequeos, pasos, listoParaAprobar: listoParaAprobar(chequeos), listoParaPagar: listoParaPagar(chequeos) }
}

export async function cargarEstado(s: Sesion, hoy = hoyEnBogota()) {
  await D.sembrarEntidades()
  const [config, personas, obligaciones, soportes, pagos, cuentas, entidades, destinatarios, documentos, eventos, avisos, gasto, otros] = await Promise.all([
    D.leerConfig(),
    D.personas(),
    D.listarObligaciones(),
    D.listarSoportes(),
    D.listarPagos(),
    D.listarCuentas(),
    D.listarEntidades(),
    D.listarDestinatarios(),
    listarDocumentos(),
    D.eventosRecientes(),
    D.avisosRecientes(),
    gastoDelMes(hoy.slice(0, 7)),
    D.pagosExistentes(),
  ])
  const nombre = (u: string) => personas.find((p) => p.username === u)?.nombre || u
  const obs = obligaciones.map((o) => {
    const restantes = /^\d{4}-\d{2}-\d{2}$/.test(o.vence) ? habilesRestantes(hoy, o.vence) : null
    const sig = siguiente(o)
    return {
      ...o,
      tipoTexto: TIPO_TEXTO[o.tipo] ?? o.tipo,
      estadoTexto: ESTADO_TEXTO[o.estado],
      nivel: nivel(o, hoy),
      restantes,
      plazo: restantes == null ? 'Sin fecha' : textoPlazo(restantes),
      responsable: personas.find((p) => p.id === o.responsable_id)?.nombre || '',
      soportes: soportes.filter((x) => x.obligacion_id === o.id).map((x) => ({ ...x, subido_por: nombre(x.subido_por) })),
      siguiente: sig,
      soporteSiguiente: sig ? soporteExigido(sig, o) : null,
      anterior: anterior(o),
    }
  })
  const ctx = { otros, cuentas, entidades, config }
  const pagosVista = await Promise.all(
    pagos.map(async (p) => {
      const ob = obligaciones.find((o) => o.id === p.obligacion_id)
      const control = ob ? await controlDe(p, ob, ctx) : null
      return { ...p, preparadoNombre: nombre(p.preparado_por), aprobadoNombre: p.aprobado_por ? nombre(p.aprobado_por) : '', obligacion: ob ? { id: ob.id, concepto: ob.concepto, periodo: ob.periodo, vence: ob.vence, estado: ob.estado } : null, control }
    }),
  )
  const anio = Number(hoy.slice(0, 4))
  return {
    hoy,
    sesion: s,
    config,
    personas,
    obligaciones: obs,
    pagos: pagosVista,
    cuentas,
    entidades,
    destinos: D.resolverDestinos(personas, destinatarios),
    documentos,
    eventos: eventos.map((e) => ({ ...e, usuario: nombre(e.usuario) })),
    avisos,
    ia: { gastoMes: gasto, tope: config.topeIaUsd, activa: !!env('ANTHROPIC_API_KEY') },
    faltantes: [...faltantesDelAnio(config, anio), ...faltantesDelAnio(config, anio + 1)],
    entorno: { correo: correo.correoConfigurado(), books: booksConfigured(), siigo: Siigo.siigoConfigurado(), cron: !!env('CRON_SECRET') },
    catalogos: { estados: ESTADOS, estadoTexto: ESTADO_TEXTO, soportes: TIPOS_SOPORTE, tipos: TIPO_TEXTO },
    puede: {
      preparar: PREPARAN.includes(s.rol),
      aprobar: s.rol === 'gerencia',
      autorizar: AUTORIZAN.includes(s.rol),
      configurar: AUTORIZAN.includes(s.rol),
    },
  }
}

// ------------------------------------------------------------------ soportes

export async function subirSoporte(s: Sesion, d: { obligacion_id: number; tipo: string; nombre: string; mime: string; datos: Uint8Array }): Promise<number> {
  exigir(s, PREPARAN, 'subir soportes')
  if (!(TIPOS_SOPORTE as readonly string[]).includes(d.tipo)) throw new UserError('Tipo de soporte inválido.')
  if (!(TIPOS_PERMITIDOS as readonly string[]).includes(d.mime)) throw new UserError('Suba un PDF o una imagen (PNG o JPG).')
  if (d.datos.byteLength > TAMANO_MAXIMO) throw new UserError('El archivo pesa más de 4 MB.')
  if (!d.datos.byteLength) throw new UserError('El archivo está vacío.')
  const ob = await D.leerObligacion(d.obligacion_id)
  if (!ob) throw new UserError('La obligación no existe.')
  const ruta = await guardar(`soportes/${ob.id}`, d.nombre, d.datos, d.mime)
  const id = await D.agregarSoporte({ obligacion_id: ob.id, tipo: d.tipo as TipoSoporte, nombre: d.nombre.slice(0, 200), ruta, mime: d.mime, tamano: d.datos.byteLength, subido_por: s.usuario })
  await D.anotarEvento({ obligacion_id: ob.id, accion: 'soporte', detalle: `${d.tipo}: ${d.nombre}`, usuario: s.usuario, rol: s.rol })
  return id
}

export async function descargarSoporte(id: number): Promise<{ datos: Uint8Array; mime: string; nombre: string } | null> {
  const sp = await D.leerSoporte(id)
  if (!sp) return null
  const datos = await leerArchivo(sp.ruta)
  return datos ? { datos, mime: sp.mime, nombre: sp.nombre } : null
}

export async function descargarDocumento(id: number): Promise<{ datos: Uint8Array; mime: string; nombre: string } | null> {
  const doc = await leerDocumento(id)
  if (!doc) return null
  const datos = await leerArchivo(doc.ruta)
  return datos ? { datos, mime: doc.mime, nombre: doc.nombre } : null
}

// ------------------------------------------------------------------ acciones

const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v))
const entero = (v: unknown, que: string) => {
  const n = Number(v)
  if (!Number.isInteger(n) || n <= 0) throw new UserError(`${que} no es válido.`)
  return n
}

async function obligacionOError(id: unknown) {
  const ob = await D.leerObligacion(entero(id, 'El identificador'))
  if (!ob) throw new UserError('La obligación no existe.')
  return ob
}

async function pagoOError(id: unknown) {
  const p = await D.leerPago(entero(id, 'El identificador del pago'))
  if (!p) throw new UserError('El pago no existe.')
  const ob = await D.leerObligacion(p.obligacion_id)
  if (!ob) throw new UserError('La obligación del pago no existe.')
  return { p, ob }
}

async function contexto() {
  const [otros, cuentas, entidades, config] = await Promise.all([D.pagosExistentes(), D.listarCuentas(), D.listarEntidades(), D.leerConfig()])
  return { otros, cuentas, entidades, config }
}

const obCorreo = (o: D.Obligacion, responsable = '') => ({ id: o.id, concepto: o.concepto, entidad: o.entidad, periodo: o.periodo, vence: o.vence, estado: o.estado, responsable })

type Accion = (s: Sesion, b: any) => Promise<unknown>

/** Quién consulta Siigo desde el panel: Finanzas, Gerencia y el admin. */
const CONSULTAN_SIIGO = [...PREPARAN, 'gerencia']

/** Un error de Siigo llega al panel como mensaje legible, no como error 500. */
async function conSiigo<T>(fn: () => Promise<T>): Promise<T> {
  if (!Siigo.siigoConfigurado()) throw new UserError('Siigo no está conectado todavía (faltan las credenciales de la API en Vercel).')
  try {
    return await fn()
  } catch (e: any) {
    console.error('[finanzas/siigo]', e?.message || e)
    if (e?.name === 'SiigoError') throw new UserError(String(e.message))
    if (e?.name === 'TimeoutError') throw new UserError('Siigo tardó demasiado en responder. Intente de nuevo en un momento.')
    if (e instanceof TypeError) throw new UserError('No se pudo conectar con Siigo. Intente de nuevo en un momento.')
    throw e
  }
}

export const ACCIONES: Record<string, Accion> = {
  async guardar_config(s, b) {
    exigir(s, AUTORIZAN, 'cambiar los ajustes')
    const cfg = b.config ?? b
    if (cfg.topeIaUsd !== undefined && s.rol !== 'admin') {
      const actual = await D.leerConfig()
      if (Number(cfg.topeIaUsd) !== actual.topeIaUsd) throw new UserError('El tope de IA lo cambia el administrador.')
    }
    const c = await D.guardarConfig(cfg)
    await D.anotarEvento({ accion: 'ajustes', detalle: JSON.stringify(cfg).slice(0, 500), usuario: s.usuario, rol: s.rol })
    return c
  },

  async sembrar_anio(s, b) {
    exigir(s, [...PREPARAN, 'gerencia'], 'cargar el calendario')
    const anio = entero(b.anio, 'El año')
    if (anio < 2025 || anio > 2035) throw new UserError('Año fuera de rango.')
    const config = await D.leerConfig()
    const resp = num(b.responsable_id)
    const nuevas = await D.sembrarAnio(config, anio, resp, hoyEnBogota())
    await D.anotarEvento({ accion: 'calendario', detalle: `Año ${anio}: ${nuevas} obligaciones nuevas`, usuario: s.usuario, rol: s.rol })
    return { nuevas }
  },

  async crear_obligacion(s, b) {
    exigir(s, PREPARAN, 'crear obligaciones')
    const id = await D.crearObligacion({
      tipo: b.tipo,
      concepto: b.concepto,
      entidad: b.entidad,
      periodo: b.periodo,
      formulario: b.formulario,
      vence: b.vence,
      con_pago: b.con_pago !== false,
      responsable_id: num(b.responsable_id),
      notas: b.notas,
    })
    await D.anotarEvento({ obligacion_id: id, accion: 'creada', detalle: String(b.concepto || ''), usuario: s.usuario, rol: s.rol })
    return { id }
  },

  async editar_obligacion(s, b) {
    exigir(s, PREPARAN, 'editar obligaciones')
    const antes = await obligacionOError(b.id)
    const cambios: Parameters<typeof D.editarObligacion>[1] = {}
    if (b.vence !== undefined) cambios.vence = b.vence
    if (b.responsable_id !== undefined) cambios.responsable_id = num(b.responsable_id)
    if (b.notas !== undefined) cambios.notas = b.notas
    if (b.valor_borrador !== undefined) cambios.valor_borrador = num(b.valor_borrador)
    if (b.concepto !== undefined) cambios.concepto = b.concepto
    if (b.periodo !== undefined) cambios.periodo = b.periodo
    const o = await D.editarObligacion(antes.id, cambios)
    const det: string[] = []
    if (o.vence !== antes.vence) det.push(`fecha ${antes.vence} → ${o.vence}`)
    if (o.valor_borrador !== antes.valor_borrador) det.push(`valor ${pesos(antes.valor_borrador)} → ${pesos(o.valor_borrador)}`)
    if (o.responsable_id !== antes.responsable_id) det.push('responsable')
    if (det.length) await D.anotarEvento({ obligacion_id: o.id, accion: 'editada', detalle: det.join(', '), usuario: s.usuario, rol: s.rol })
    return o
  },

  async eliminar_obligacion(s, b) {
    exigir(s, PREPARAN, 'eliminar obligaciones')
    const o = await obligacionOError(b.id)
    await D.eliminarObligacion(o.id)
    await D.anotarEvento({ accion: 'eliminada', detalle: `${o.concepto} (${o.periodo})`, usuario: s.usuario, rol: s.rol })
    return null
  },

  async avanzar(s, b) {
    const o = await obligacionOError(b.id)
    const destino = String(b.destino) as Estado
    const soportes = (await D.soportesDe(o.id)).map((x) => x.tipo)
    const v = puedeAvanzar(o, destino, s.rol, soportes)
    if (v.ok === false) throw new UserError(v.motivo)
    await D.cambiarEstado(o.id, destino)
    await D.anotarEvento({ obligacion_id: o.id, accion: 'estado', detalle: `${ESTADO_TEXTO[o.estado]} → ${ESTADO_TEXTO[destino]}`, usuario: s.usuario, rol: s.rol })
    return null
  },

  async devolver(s, b) {
    const o = await obligacionOError(b.id)
    const v = puedeDevolver(o, s.rol)
    if (v.ok === false) throw new UserError(v.motivo)
    const motivo = String(b.motivo || '').trim()
    if (!motivo) throw new UserError('Escriba por qué se devuelve.')
    // Con un pago esperando aprobación no se devuelve: primero se anula o se rechaza.
    const pagos = await D.pagosExistentes()
    if (pagos.some((p) => p.obligacion_id === o.id && p.estado === 'por_aprobar')) throw new UserError('Hay un pago esperando aprobación: anúlelo primero.')
    const destino = anterior(o)!
    await D.cambiarEstado(o.id, destino)
    await D.anotarEvento({ obligacion_id: o.id, accion: 'devuelta', detalle: `${ESTADO_TEXTO[o.estado]} → ${ESTADO_TEXTO[destino]}: ${motivo}`, usuario: s.usuario, rol: s.rol })
    return null
  },

  async preparar_pago(s, b) {
    exigir(s, PREPARAN, 'preparar pagos')
    const ob = await obligacionOError(b.obligacion_id)
    if (!ob.con_pago) throw new UserError('Esta obligación no lleva pago.')
    if (ob.estado !== 'revisado') throw new UserError('El pago se prepara cuando la obligación está revisada.')
    const soportes = (await D.soportesDe(ob.id)).map((x) => x.tipo)
    if (!soportes.includes('recibo')) throw new UserError('Suba primero el recibo de pago (490 o el de la entidad).')
    const valor = Math.round(Number(b.valor))
    if (!Number.isFinite(valor) || valor <= 0) throw new UserError('El valor no es válido.')
    const ctx = await contexto()
    const pago: PagoControl = { obligacion_id: ob.id, valor, entidad: String(b.entidad || ''), referencia: String(b.referencia || '').trim(), cuenta_id: num(b.cuenta_id), preparado_por: s.usuario }
    const chequeos = chequear({ obligacion: ob, pago, otrosPagos: ctx.otros, cuentas: ctx.cuentas, entidades: ctx.entidades })
    if (!listoParaAprobar(chequeos)) {
      // Se devuelve el detalle para que el panel muestre qué falló.
      return { creado: false, chequeos }
    }
    const id = await D.crearPago({ ...pago, chequeos })
    await D.anotarEvento({ obligacion_id: ob.id, pago_id: id, accion: 'pago_preparado', detalle: `${pesos(valor)} desde la cuenta #${pago.cuenta_id}`, usuario: s.usuario, rol: s.rol })
    const ds = await D.destinos()
    const cuenta = ctx.cuentas.find((c) => c.id === pago.cuenta_id)
    await correo.pagoPorAprobar({ to: D.correosDe(ds, 'gerencia'), pagoId: id, obligacion: obCorreo(ob), valor, cuenta: cuenta ? `${cuenta.banco} ${cuenta.tipo} terminada en ${cuenta.ultimos}` : '', preparadoPor: s.nombre })
    return { creado: true, id, chequeos }
  },

  async anular_pago(s, b) {
    exigir(s, PREPARAN, 'anular pagos')
    const { p, ob } = await pagoOError(b.id)
    if (p.estado !== 'por_aprobar') throw new UserError('Solo se anula un pago que no ha sido aprobado.')
    await D.actualizarPago(p.id, { estado: 'anulado' })
    await D.anotarEvento({ obligacion_id: ob.id, pago_id: p.id, accion: 'pago_anulado', detalle: String(b.motivo || ''), usuario: s.usuario, rol: s.rol })
    return null
  },

  async aprobar_pago(s, b) {
    const { p, ob } = await pagoOError(b.id)
    const v = puedeAprobar(p, s.usuario, s.rol)
    if (v.ok === false) throw new UserError(v.motivo)
    if (ob.estado !== 'revisado') throw new UserError('La obligación ya no está revisada; revise su estado.')
    const ctx = await contexto()
    const control = await controlDe({ ...p, aprobado_por: s.usuario }, ob, ctx)
    if (!control.listoParaPagar) {
      const fallas = control.chequeos.filter((c) => c.ok !== true).map((c) => c.detalle)
      throw new UserError(`El control antes de pagar no está en verde: ${fallas.join(' ')}`)
    }
    const ts = new Date().toISOString()
    await D.actualizarPago(p.id, { estado: 'aprobado', aprobado_por: s.usuario, aprobado_at: ts, chequeos: control.chequeos })
    await D.cambiarEstado(ob.id, 'aprobado')
    await D.anotarEvento({ obligacion_id: ob.id, pago_id: p.id, accion: 'pago_aprobado', detalle: pesos(p.valor), usuario: s.usuario, rol: s.rol })
    await correo.pagoDecidido({ to: D.correosDe(await D.destinos(), 'finanzas'), pagoId: p.id, obligacion: obCorreo(ob), valor: p.valor, aprobado: true, por: s.nombre })
    return null
  },

  async rechazar_pago(s, b) {
    if (s.rol !== 'gerencia') throw new UserError('Solo Gerencia devuelve pagos.')
    const { p, ob } = await pagoOError(b.id)
    if (p.estado !== 'por_aprobar') throw new UserError('El pago no está esperando aprobación.')
    const motivo = String(b.motivo || '').trim()
    if (!motivo) throw new UserError('Escriba el motivo para que Finanzas pueda corregir.')
    await D.actualizarPago(p.id, { estado: 'rechazado', motivo_rechazo: motivo, aprobado_por: '', aprobado_at: new Date().toISOString() })
    await D.anotarEvento({ obligacion_id: ob.id, pago_id: p.id, accion: 'pago_devuelto', detalle: motivo, usuario: s.usuario, rol: s.rol })
    await correo.pagoDecidido({ to: D.correosDe(await D.destinos(), 'finanzas'), pagoId: p.id, obligacion: obCorreo(ob), valor: p.valor, aprobado: false, por: s.nombre, motivo })
    return null
  },

  async registrar_pago(s, b) {
    exigir(s, PREPARAN, 'registrar pagos')
    const { p, ob } = await pagoOError(b.id)
    if (p.estado !== 'aprobado') throw new UserError('Solo se registra un pago aprobado por Gerencia.')
    const ctx = await contexto()
    const control = await controlDe(p, ob, { ...ctx, otros: ctx.otros.filter((x) => x.id !== p.id) })
    // La obligación ya está "aprobado"; el chequeo de "no pagado" sigue mirando otros pagos.
    const marcados: string[] = Array.isArray(b.verificacion) ? b.verificacion.map(String) : []
    if (!verificacionCompleta(control.pasos, marcados)) throw new UserError('Marque todos los pasos de la lista de verificación antes de registrar el pago.')
    if (!control.listoParaPagar) {
      const fallas = control.chequeos.filter((c) => c.ok !== true).map((c) => c.detalle)
      throw new UserError(`El control antes de pagar no está en verde: ${fallas.join(' ')}`)
    }
    const soportes = await D.soportesDe(ob.id)
    if (!soportes.some((x) => x.tipo === 'comprobante' && x.created_at >= p.aprobado_at)) throw new UserError('Suba el comprobante del banco de este pago.')
    const ts = new Date().toISOString()
    await D.actualizarPago(p.id, { estado: 'pagado', pagado_at: ts, verificacion: marcados })
    await D.cambiarEstado(ob.id, 'pagado')
    await D.anotarEvento({ obligacion_id: ob.id, pago_id: p.id, accion: 'pago_registrado', detalle: `${pesos(p.valor)}, referencia ${p.referencia}`, usuario: s.usuario, rol: s.rol })
    return null
  },

  async guardar_cuenta(s, b) {
    exigir(s, AUTORIZAN, 'cambiar las cuentas autorizadas')
    const id = await D.guardarCuenta({ id: num(b.id) ?? undefined, alias: b.alias, banco: b.banco, tipo: b.tipo, ultimos: b.ultimos, activa: b.activa !== false })
    await D.anotarEvento({ accion: 'cuenta', detalle: `${b.banco} ${b.tipo} ${b.ultimos}${b.activa === false ? ' (desactivada)' : ''}`, usuario: s.usuario, rol: s.rol })
    return { id }
  },

  async guardar_entidad(s, b) {
    exigir(s, AUTORIZAN, 'cambiar las entidades autorizadas')
    await D.guardarEntidad(b)
    await D.anotarEvento({ accion: 'entidad', detalle: `${b.codigo}: ${b.nombre}${b.activa === false ? ' (desactivada)' : ''}`, usuario: s.usuario, rol: s.rol })
    return null
  },

  async guardar_destinatario(s, b) {
    await D.guardarDestinatario(b)
    await D.anotarEvento({ accion: 'destinatario', detalle: `${b.grupo}: ${b.correo || '(correo del usuario)'}${b.activo === false ? ' sin avisos' : ''}`, usuario: s.usuario, rol: s.rol })
    return null
  },

  async eliminar_destinatario(s, b) {
    await D.eliminarDestinatario(entero(b.id, 'El identificador'))
    await D.anotarEvento({ accion: 'destinatario', detalle: `Quitado #${b.id}`, usuario: s.usuario, rol: s.rol })
    return null
  },

  async asociar_documento(s, b) {
    exigir(s, PREPARAN, 'asociar documentos')
    await asociarDocumento(entero(b.id, 'El documento'), num(b.obligacion_id))
    return null
  },

  async requerimiento_alerta(s, b) {
    exigir(s, PREPARAN, 'crear alertas')
    const r = await crearAlertaRequerimiento(entero(b.id, 'El documento'), String(b.fecha_notificacion || ''), s.usuario, s.rol)
    if (!r.creada) throw new UserError(r.motivo || 'No se pudo calcular el plazo.')
    return r
  },

  async reintentar_documento(s, b) {
    exigir(s, PREPARAN, 'leer documentos')
    const doc = await leerDocumento(entero(b.id, 'El documento'))
    if (!doc) throw new UserError('El documento no existe.')
    if (doc.estado === 'leido') return null
    const datos = await leerArchivo(doc.ruta)
    if (!datos) throw new UserError('No se encontró el archivo.')
    await procesarDocumento(doc.id, datos, s.usuario, s.rol)
    return null
  },

  async siigo_revisar(s, b) {
    exigir(s, CONSULTAN_SIIGO, 'consultar Siigo')
    const hoy = hoyEnBogota()
    const mes = /^\d{4}-\d{2}$/.test(String(b.mes || '')) ? String(b.mes) : hoy.slice(0, 7)
    return conSiigo(() => Siigo.revisionYCifras(hoy, mes))
  },

  async siigo_verificar_pago(s, b) {
    exigir(s, CONSULTAN_SIIGO, 'consultar Siigo')
    const nit = String(b.nit || '').replace(/\D/g, '')
    const factura = String(b.factura || '').trim()
    const valor = Math.round(Number(String(b.valor ?? '').replace(/\D/g, '')))
    if (nit.length < 5) throw new UserError('Escriba el NIT o la cédula del proveedor, sin dígito de verificación.')
    if (!factura) throw new UserError('Escriba el número de la factura.')
    if (!Number.isFinite(valor) || valor <= 0) throw new UserError('Escriba el valor a pagar.')
    const r = await conSiigo(() => Siigo.verificarPagoProveedor(hoyEnBogota(), { nit, factura, valor }))
    await D.anotarEvento({ accion: 'siigo_verificacion', detalle: `${r.proveedorNombre}, factura ${factura}, ${pesos(valor)}: ${r.ok ? 'todo en verde' : 'con alertas'}`, usuario: s.usuario, rol: s.rol })
    return r
  },

  async siigo_balance(s, b) {
    exigir(s, CONSULTAN_SIIGO, 'pedir el balance de prueba')
    const anio = entero(b.anio, 'El año')
    const mesInicio = entero(b.mes_inicio, 'El mes inicial')
    const mesFin = entero(b.mes_fin, 'El mes final')
    if (anio < 2015 || anio > 2100) throw new UserError('Año fuera de rango.')
    if (mesInicio > 13 || mesFin > 13 || mesInicio > mesFin) throw new UserError('Los meses van de 1 a 13 (13 es el cierre) y el inicial no puede ser mayor que el final.')
    const nit = String(b.nit || '').replace(/\D/g, '')
    const r = await conSiigo(() => Siigo.balancePrueba({ anio, mesInicio, mesFin, nit: nit || undefined }))
    await D.anotarEvento({ accion: 'siigo_balance', detalle: `Balance de prueba ${anio}, meses ${mesInicio} a ${mesFin}${nit ? `, tercero ${nit}` : ''}`, usuario: s.usuario, rol: s.rol })
    return r
  },

  async enviar_resumen(s, b) {
    exigir(s, [...PREPARAN, 'gerencia'], 'enviar resúmenes')
    const tipo = b.tipo === 'mensual' ? 'mensual' : 'semanal'
    const r = await enviarResumen(tipo, hoyEnBogota())
    if (!r.enviado) throw new UserError(`No se envió: ${r.motivo || 'revise la configuración del correo'}.`)
    return r
  },
}

export async function ejecutar(s: Sesion, accion: string, b: any): Promise<unknown> {
  const fn = ACCIONES[accion]
  if (!fn) throw new UserError('Acción desconocida.')
  await D.sembrarEntidades()
  return fn(s, b ?? {})
}

// ------------------------------------------------------------------ tarea diaria

async function enviarResumen(tipo: 'semanal' | 'mensual', hoy: string): Promise<correo.Envio> {
  const obs = await D.listarObligaciones()
  const ds = await D.destinos()
  const to = [...D.correosDe(ds, 'finanzas'), ...D.correosDe(ds, 'gerencia')]
  if (tipo === 'semanal') {
    const r = resumenSemanal(obs, hoy)
    const extra: [string, string][] = []
    let nota = ''
    if (Siigo.siigoConfigurado()) {
      try {
        const rv = await Siigo.revisionProveedores(hoy)
        const t = rv.totales
        extra.push(
          ['Proveedores: vencido (Siigo)', pesosTxt(t.vencido)],
          ['Proveedores: vence en 7 días', pesosTxt(t.porVencer)],
          ['Proveedores: total por pagar', `${pesosTxt(t.porPagar)} en ${t.facturas} facturas`],
        )
        if (t.graves) extra.push(['Posibles pagos o registros dobles', `${t.graves}: revíselos en Finanzas, pestaña Proveedores`])
      } catch (e: any) {
        console.error('[finanzas/resumen] Siigo', e?.message || e)
        nota = 'No se pudieron leer las cuentas por pagar de Siigo esta semana.'
      }
    }
    return correo.resumen({ to, tipo, titulo: `Calendario tributario: semana del ${hoy.slice(8)} de ${nombreMes(hoy.slice(0, 7))}`, atrasadas: r.atrasadas, proximas: r.proximas, extra, nota })
  }
  const r = resumenMensual(obs, hoy)
  const extra: [string, string][] = [[`Obligaciones de ${nombreMes(r.mesAnterior)}`, `${r.cerradasDelMes} de ${r.delMes} presentadas`]]
  const notas: string[] = []
  if (Siigo.siigoConfigurado()) {
    try {
      const c = await Siigo.cifrasDelMes(r.mesAnterior, hoy)
      if (c) {
        extra.push(
          ['Ventas facturadas (Siigo, antes de notas crédito)', `${pesos(c.ventas)} en ${c.facturasVenta} facturas`],
          ['Facturas de compra registradas', `${pesos(c.compras)} en ${c.facturasCompra} facturas`],
          ['Pagos registrados (egresos)', `${pesos(c.pagos)} en ${c.egresos} recibos`],
          ['Por pagar a proveedores a hoy', pesos(c.porPagar)],
          ['De eso, vencido', pesos(c.porPagarVencido)],
        )
        if (c.truncado) notas.push('Siigo devolvió más documentos de los que se leen en un resumen: las cifras pueden estar incompletas.')
      }
    } catch (e: any) {
      console.error('[finanzas/resumen] Siigo', e?.message || e)
      notas.push('No se pudieron leer las cifras de Siigo este mes.')
    }
  }
  let nota = ''
  try {
    const c = await cifrasDelMes(r.mesAnterior)
    if (c) {
      extra.push(['Facturado (Zoho Books)', `${pesos(c.facturado)} en ${c.facturas} facturas`], ['Recaudado', pesos(c.recaudado)], ['Cartera por cobrar a hoy', pesos(c.cartera)], ['Cartera vencida', pesos(c.carteraVencida)])
    } else if (!Siigo.siigoConfigurado()) nota = 'Las cifras de Siigo y de Zoho Books aparecerán cuando se conecten las cuentas.'
  } catch (e: any) {
    console.error('[finanzas/resumen] Zoho Books', e?.message || e)
    nota = 'No se pudieron leer las cifras de Zoho Books este mes.'
  }
  if (nota) notas.push(nota)
  return correo.resumen({ to, tipo, titulo: `Resumen tributario de ${nombreMes(r.mesAnterior)}`, atrasadas: r.atrasadas, proximas: r.proximas, extra, nota: notas.join(' ') })
}

/** Tarea programada (una vez al día): avisos de vencimiento y, si toca, resúmenes. */
export async function correrDiario(hoy = hoyEnBogota()): Promise<{ avisos: number; enviados: number; semanal: boolean | null; mensual: boolean | null }> {
  const [obs, enviadas, ds, personas] = await Promise.all([D.listarObligaciones(), D.clavesEnviadas(), D.destinos(), D.personas()])
  const fin = D.correosDe(ds, 'finanzas')
  const ger = D.correosDe(ds, 'gerencia')
  const avisos = avisosDelDia(obs, hoy, enviadas)
  let enviados = 0
  for (const a of avisos) {
    if (!(await D.reservarAviso({ clave: a.clave, obligacion_id: a.obligacion_id, umbral: a.umbral, escalado: a.escalar }))) continue
    const o = obs.find((x) => x.id === a.obligacion_id)!
    const to = a.escalar ? [...fin, ...ger] : fin
    const r = await correo.avisoVencimiento({
      to,
      obligacion: obCorreo(o, personas.find((p) => p.id === o.responsable_id)?.nombre),
      plazo: textoPlazo(a.restantes),
      estadoTexto: ESTADO_TEXTO[o.estado],
      escalado: a.escalar,
    })
    await D.marcarAviso(a.clave, r.enviado, to)
    if (r.enviado) enviados++
  }
  const toca = resumenesDeHoy(hoy)
  let semanal: boolean | null = null
  let mensual: boolean | null = null
  if (toca.semanal && (await D.reservarAviso({ clave: `semanal:${hoy}` }))) {
    const r = await enviarResumen('semanal', hoy)
    await D.marcarAviso(`semanal:${hoy}`, r.enviado, [...fin, ...ger])
    semanal = r.enviado
  }
  if (toca.mensual && (await D.reservarAviso({ clave: `mensual:${hoy.slice(0, 7)}` }))) {
    const r = await enviarResumen('mensual', hoy)
    await D.marcarAviso(`mensual:${hoy.slice(0, 7)}`, r.enviado, [...fin, ...ger])
    mensual = r.enviado
  }
  return { avisos: avisos.length, enviados, semanal, mensual }
}
