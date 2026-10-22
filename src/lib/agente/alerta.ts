/**
 * De una extracción a una alerta: cruza el acto con su expediente, calcula el
 * vencimiento y decide la prioridad.
 *
 * Todo aquí es puro (sin base de datos ni red) para poder probarlo con casos
 * concretos. El orden de las decisiones importa y está escrito para que un
 * consultor lo pueda auditar:
 *   1. ¿De qué expediente es? Por número de expediente; si no aparece, por NIT.
 *   2. ¿Cuál es el plazo que manda? El más corto entre las obligaciones.
 *   3. ¿Cuándo vence? Días hábiles con festivos de Colombia, desde la
 *      notificación.
 *   4. ¿Qué tan urgente es? La regla del tipo de acto, subida a alta si el
 *      plazo está cerca o ya venció.
 *   5. ¿Hay que confirmar algo? Si la lectura no fue confiable, si falta la
 *      fecha de notificación o si no se encontró el expediente.
 */
import { habilesRestantes, venceDiasCalendario, venceDiasHabiles, venceMeses } from './diasHabiles.ts'
import type { Extraccion, Obligacion } from './extraccion.ts'
import { decidirPrioridad, REGLAS_INICIALES, type Prioridad, type Regla } from './reglas.ts'

export interface ExpedienteRef {
  id: number
  cliente: string
  nit: string
  autoridad: string
  numero: string
  numero_norm: string
  responsable: string
  activo: boolean
}

export interface AlertaNueva {
  expediente_id: number
  prioridad: Prioridad
  tipo_acto: string
  titulo: string
  que_pide: string
  norma: string
  plazo_texto: string
  plazo_dias: number
  plazo_tipo: string
  vence_el: string
  accion: string
  por_confirmar: boolean
  motivo_confirmar: string
  responsable: string
}

/** "LAM-1234 / 2024", "lam 1234-2024" → "LAM12342024". */
export function normalizarNumero(v: string): string {
  return (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function normalizarNit(v: string): string {
  // El dígito de verificación a veces viene y a veces no: se compara sin él.
  const limpio = (v || '').replace(/[^0-9-]/g, '')
  const base = limpio.includes('-') ? limpio.split('-')[0] : limpio
  return base.replace(/\D/g, '')
}

/**
 * Busca el expediente del acto. Por número primero, porque es lo único que
 * identifica un trámite: un mismo cliente puede tener varios expedientes. El
 * NIT solo se usa si el cliente tiene un único expediente activo, para no
 * asignar el acto al trámite equivocado.
 */
export function buscarExpediente(
  ext: Pick<Extraccion, 'numero_expediente' | 'nit'>,
  expedientes: readonly ExpedienteRef[],
): { expediente: ExpedienteRef | null; por: 'numero' | 'nit' | null } {
  const activos = expedientes.filter((e) => e.activo)
  const num = normalizarNumero(ext.numero_expediente)
  if (num.length >= 3) {
    const exacto = activos.find((e) => e.numero_norm === num)
    if (exacto) return { expediente: exacto, por: 'numero' }
    // El auto puede traer el número con un prefijo o sufijo extra (año,
    // sigla de la autoridad). Se acepta si uno contiene al otro y la parte
    // común es suficientemente larga para no confundir "12" con "1234".
    const parcial = activos.filter(
      (e) => e.numero_norm.length >= 4 && (num.includes(e.numero_norm) || e.numero_norm.includes(num)),
    )
    if (parcial.length === 1) return { expediente: parcial[0], por: 'numero' }
  }
  const nit = normalizarNit(ext.nit)
  if (nit.length >= 6) {
    const delCliente = activos.filter((e) => normalizarNit(e.nit) === nit)
    if (delCliente.length === 1) return { expediente: delCliente[0], por: 'nit' }
  }
  return { expediente: null, por: null }
}

const ORDEN_UNIDAD: Record<string, number> = { dias_habiles: 1, dias_calendario: 1, meses: 30 }

/** Vencimiento de una obligación, o '' si no tiene plazo calculable. */
export function vencimiento(o: Obligacion, fechaNotificacion: string): string {
  if (!fechaNotificacion || o.plazo_unidad === 'sin_plazo' || o.plazo_cantidad < 1) return ''
  if (o.plazo_unidad === 'dias_habiles') return venceDiasHabiles(fechaNotificacion, o.plazo_cantidad)
  if (o.plazo_unidad === 'dias_calendario') return venceDiasCalendario(fechaNotificacion, o.plazo_cantidad)
  return venceMeses(fechaNotificacion, o.plazo_cantidad)
}

/**
 * La obligación que manda en la alerta: la de vencimiento más cercano. Sin
 * fecha de notificación no hay vencimientos, así que se compara por la
 * magnitud del plazo.
 */
export function obligacionPrincipal(obs: readonly Obligacion[], fechaNotificacion: string): Obligacion | null {
  const conPlazo = obs.filter((o) => o.plazo_unidad !== 'sin_plazo')
  if (!conPlazo.length) return obs[0] ?? null
  if (fechaNotificacion) {
    return conPlazo.toSorted((a, b) => vencimiento(a, fechaNotificacion).localeCompare(vencimiento(b, fechaNotificacion)))[0]
  }
  return conPlazo.toSorted(
    (a, b) => a.plazo_cantidad * (ORDEN_UNIDAD[a.plazo_unidad] ?? 1) - b.plazo_cantidad * (ORDEN_UNIDAD[b.plazo_unidad] ?? 1),
  )[0]
}

const UNIDAD_LEGIBLE: Record<string, string> = {
  dias_habiles: 'días hábiles',
  dias_calendario: 'días calendario',
  meses: 'meses',
}

export function armarAlerta(input: {
  extraccion: Extraccion
  expedientes: readonly ExpedienteRef[]
  reglas: readonly Regla[]
  fechaNotificacion: string
  hoy: string
}): AlertaNueva {
  const { extraccion: ext, expedientes, reglas, hoy } = input
  const motivos: string[] = []

  const { expediente } = buscarExpediente(ext, expedientes)
  if (!expediente) motivos.push('No se encontró el expediente en la tabla de expedientes.')

  // Sin fecha de notificación se calcula con la fecha del acto, pero queda por
  // confirmar: el término corre desde la notificación, que suele ser días
  // después.
  let base = input.fechaNotificacion
  if (!base && ext.fecha_acto) {
    base = ext.fecha_acto
    motivos.push('Falta la fecha de notificación; el plazo se calculó desde la fecha del acto.')
  }

  const principal = obligacionPrincipal(ext.obligaciones, base)
  const venceEl = principal && base ? vencimiento(principal, base) : ''
  if (principal && principal.plazo_unidad !== 'sin_plazo' && !base) {
    motivos.push('No hay fecha para calcular el vencimiento.')
  }

  if (ext.confianza !== 'alta') {
    motivos.push(ext.motivo_confianza || 'La lectura del documento no fue del todo confiable.')
  }

  const regla =
    reglas.find((r) => r.activa && r.tipo_acto === ext.tipo_acto) ??
    REGLAS_INICIALES.find((r) => r.tipo_acto === ext.tipo_acto) ??
    REGLAS_INICIALES[REGLAS_INICIALES.length - 1]
  const restantes = venceEl ? habilesRestantes(hoy, venceEl) : null
  const prioridad = decidirPrioridad(regla, restantes)

  const quien = expediente?.cliente || ext.titular || 'cliente sin identificar'
  const queObligaciones = ext.obligaciones.map((o) => o.que)
  const quePide = [ext.resumen, ...queObligaciones.map((q) => `• ${q}`)].filter(Boolean).join('\n')

  return {
    expediente_id: expediente?.id ?? 0,
    prioridad,
    tipo_acto: ext.tipo_acto,
    titulo: `${regla.nombre} · ${quien}`,
    que_pide: quePide,
    norma: ext.normas.join('; '),
    plazo_texto:
      principal && principal.plazo_unidad !== 'sin_plazo'
        ? principal.plazo_texto || `${principal.plazo_cantidad} ${UNIDAD_LEGIBLE[principal.plazo_unidad]}`
        : '',
    plazo_dias: principal?.plazo_cantidad ?? 0,
    plazo_tipo: principal?.plazo_unidad ?? 'sin_plazo',
    vence_el: venceEl,
    // La acción de la regla es la política de Ekosolv; la de la IA la
    // complementa con lo específico del acto.
    accion: [regla.accion, ext.accion_sugerida].filter(Boolean).join(' '),
    por_confirmar: motivos.length > 0,
    motivo_confirmar: motivos.join(' '),
    responsable: expediente?.responsable ?? '',
  }
}
