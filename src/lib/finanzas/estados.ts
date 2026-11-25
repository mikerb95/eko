/**
 * Expediente de cada obligación: estados, soporte que exige cada uno y quién
 * puede moverlo. Módulo PURO.
 *
 * Regla de la oferta: nada avanza sin su soporte. Y quien prepara no aprueba:
 * el paso a "aprobado" solo lo da alguien con rol `gerencia`, nunca quien
 * preparó el pago (ver control.ts), y el admin técnico tampoco.
 */

export const ESTADOS = ['pendiente', 'borrador_listo', 'revisado', 'aprobado', 'pagado', 'presentado'] as const
export type Estado = (typeof ESTADOS)[number]

export const ESTADO_TEXTO: Record<Estado, string> = {
  pendiente: 'Pendiente',
  borrador_listo: 'Borrador listo',
  revisado: 'Revisado',
  aprobado: 'Aprobado',
  pagado: 'Pagado',
  presentado: 'Presentado',
}

export const TIPOS_SOPORTE = ['borrador', 'formulario', 'recibo', 'comprobante', 'acuse', 'otro'] as const
export type TipoSoporte = (typeof TIPOS_SOPORTE)[number]

export const SOPORTE_TEXTO: Record<TipoSoporte, string> = {
  borrador: 'Borrador de la declaración',
  formulario: 'Formulario diligenciado',
  recibo: 'Recibo de pago (490 o el de la entidad)',
  comprobante: 'Comprobante del banco',
  acuse: 'Acuse de la entidad',
  otro: 'Otro soporte',
}

/** Soporte que se exige para LLEGAR a cada estado. */
export const SOPORTE_PARA: Partial<Record<Estado, TipoSoporte>> = {
  borrador_listo: 'borrador',
  revisado: 'formulario',
  aprobado: 'recibo',
  pagado: 'comprobante',
  presentado: 'acuse',
}

/** Roles que preparan (mueven los estados de trabajo). El admin técnico ayuda a preparar, nunca aprueba. */
export const ROLES_PREPARAN = ['finanzas', 'admin'] as const
export const ROL_APRUEBA = 'gerencia'

export interface ObligacionEstado {
  estado: Estado
  con_pago: boolean
  valor_borrador: number | null
}

/** Secuencia de estados de una obligación. Sin pago (exógena, activos) se salta "pagado". */
export function secuencia(o: { con_pago: boolean }): Estado[] {
  return o.con_pago ? [...ESTADOS] : ESTADOS.filter((e) => e !== 'pagado')
}

export function siguiente(o: ObligacionEstado): Estado | null {
  const s = secuencia(o)
  const i = s.indexOf(o.estado)
  return i >= 0 && i < s.length - 1 ? s[i + 1]! : null
}

export function cerrada(o: { estado: string }): boolean {
  return o.estado === 'presentado'
}

/** Soporte que exige un estado. Sin pago, la aprobación no lleva recibo. */
export function soporteExigido(destino: Estado, o: { con_pago: boolean }): TipoSoporte | null {
  if (destino === 'aprobado' && !o.con_pago) return null
  return SOPORTE_PARA[destino] ?? null
}

export type Veredicto = { ok: true } | { ok: false; motivo: string }

/**
 * ¿Puede `rol` llevar la obligación a `destino` con los soportes que tiene?
 * "aprobado" no pasa por aquí cuando hay pago: lo da la aprobación del pago
 * (control.ts), que además revisa los cuatro chequeos.
 */
export function puedeAvanzar(
  o: ObligacionEstado,
  destino: Estado,
  rol: string,
  soportes: readonly TipoSoporte[],
): Veredicto {
  const sig = siguiente(o)
  if (!sig) return { ok: false, motivo: 'La obligación ya está cerrada.' }
  if (destino !== sig) return { ok: false, motivo: `El siguiente paso es "${ESTADO_TEXTO[sig]}".` }
  if (destino === 'aprobado') {
    if (o.con_pago) return { ok: false, motivo: 'La aprobación se da sobre el pago preparado, en la pestaña Pagos.' }
    if (rol !== ROL_APRUEBA) return { ok: false, motivo: 'Solo Gerencia puede aprobar.' }
  } else if (!(ROLES_PREPARAN as readonly string[]).includes(rol)) {
    return { ok: false, motivo: 'Este paso lo hace Finanzas.' }
  }
  if (destino === 'borrador_listo' && o.con_pago && !(o.valor_borrador && o.valor_borrador > 0)) {
    return { ok: false, motivo: 'Escriba el valor a pagar del borrador.' }
  }
  if (destino === 'pagado') return { ok: false, motivo: 'El pago se registra desde el pago aprobado, con su lista de verificación.' }
  const exigido = soporteExigido(destino, o)
  if (exigido && !soportes.includes(exigido)) return { ok: false, motivo: `Falta el soporte: ${SOPORTE_TEXTO[exigido].toLowerCase()}.` }
  return { ok: true }
}

/** Devolver un paso (corregir un borrador). Solo antes de aprobar. */
export function puedeDevolver(o: ObligacionEstado, rol: string): Veredicto {
  if (!(ROLES_PREPARAN as readonly string[]).includes(rol) && rol !== ROL_APRUEBA) return { ok: false, motivo: 'Su rol no puede devolver la obligación.' }
  if (o.estado !== 'borrador_listo' && o.estado !== 'revisado') {
    return { ok: false, motivo: 'Solo se devuelve un borrador o una revisión, antes de la aprobación.' }
  }
  return { ok: true }
}

export function anterior(o: ObligacionEstado): Estado | null {
  const s = secuencia(o)
  const i = s.indexOf(o.estado)
  return i > 0 ? s[i - 1]! : null
}
