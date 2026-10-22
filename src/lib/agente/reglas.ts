/**
 * Tipos de acto y reglas iniciales del agente de cumplimiento.
 *
 * Las reglas son de Ekosolv, no del sistema: el equipo técnico las ajusta desde
 * el panel. Estas son solo el punto de partida que se siembra cuando la tabla
 * `reglas_agente` está vacía, para que el agente funcione desde el primer auto.
 */

export const TIPOS_ACTO = [
  'requerimiento',
  'sancionatorio',
  'seguimiento',
  'otorgamiento',
  'negacion',
  'modificacion',
  'cobro',
  'archivo',
  'otro',
] as const
export type TipoActo = (typeof TIPOS_ACTO)[number]

export const PRIORIDADES = ['alta', 'media', 'baja'] as const
export type Prioridad = (typeof PRIORIDADES)[number]

export interface Regla {
  id?: number
  tipo_acto: TipoActo
  nombre: string
  prioridad: Prioridad
  /** Días hábiles restantes desde los cuales la prioridad sube a alta. 0 = nunca. */
  umbral_alta: number
  accion: string
  activa: boolean
}

export const REGLAS_INICIALES: readonly Regla[] = [
  {
    tipo_acto: 'requerimiento',
    nombre: 'Requerimiento de información',
    prioridad: 'media',
    umbral_alta: 10,
    accion: 'Asignar hoy al consultor del expediente, revisar qué se pide y preparar la respuesta dentro del plazo.',
    activa: true,
  },
  {
    tipo_acto: 'sancionatorio',
    nombre: 'Proceso sancionatorio',
    prioridad: 'alta',
    umbral_alta: 0,
    accion: 'Avisar al gerente y al cliente, revisar los cargos y preparar descargos dentro del término.',
    activa: true,
  },
  {
    tipo_acto: 'seguimiento',
    nombre: 'Auto de seguimiento',
    prioridad: 'media',
    umbral_alta: 5,
    accion: 'Revisar en la semana las obligaciones nuevas y actualizar el plan de cumplimiento del cliente.',
    activa: true,
  },
  {
    tipo_acto: 'otorgamiento',
    nombre: 'Otorgamiento de permiso o licencia',
    prioridad: 'baja',
    umbral_alta: 0,
    accion: 'Registrar el permiso, sus obligaciones y su vencimiento en el calendario del cliente.',
    activa: true,
  },
  {
    tipo_acto: 'negacion',
    nombre: 'Negación de permiso o licencia',
    prioridad: 'alta',
    umbral_alta: 0,
    accion: 'Revisar con el cliente si procede recurso y el término para interponerlo.',
    activa: true,
  },
  {
    tipo_acto: 'modificacion',
    nombre: 'Modificación de permiso o licencia',
    prioridad: 'media',
    umbral_alta: 5,
    accion: 'Actualizar las obligaciones del expediente y avisar al cliente de los cambios.',
    activa: true,
  },
  {
    tipo_acto: 'cobro',
    nombre: 'Cobro de evaluación o seguimiento',
    prioridad: 'media',
    umbral_alta: 5,
    accion: 'Enviar el cobro al cliente y confirmar el pago antes del vencimiento.',
    activa: true,
  },
  {
    tipo_acto: 'archivo',
    nombre: 'Archivo del expediente',
    prioridad: 'baja',
    umbral_alta: 0,
    accion: 'Confirmar con el cliente que el archivo es esperado y cerrar el expediente en el panel.',
    activa: true,
  },
  {
    tipo_acto: 'otro',
    nombre: 'Otro acto',
    prioridad: 'media',
    umbral_alta: 5,
    accion: 'Revisar el documento y decidir si requiere acción.',
    activa: true,
  },
]

export function esTipoActo(v: unknown): v is TipoActo {
  return typeof v === 'string' && (TIPOS_ACTO as readonly string[]).includes(v)
}

export function esPrioridad(v: unknown): v is Prioridad {
  return typeof v === 'string' && (PRIORIDADES as readonly string[]).includes(v)
}

/**
 * Prioridad final de una alerta. La regla manda, pero el plazo puede subirla:
 * un acto vencido o que vence en menos de `umbral_alta` días hábiles es alta,
 * sin importar su tipo.
 */
export function decidirPrioridad(regla: Regla, habilesRestantes: number | null): Prioridad {
  if (habilesRestantes !== null) {
    if (habilesRestantes < 0) return 'alta'
    if (regla.umbral_alta > 0 && habilesRestantes <= regla.umbral_alta) return 'alta'
  }
  return regla.prioridad
}
