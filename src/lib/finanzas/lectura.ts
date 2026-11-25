/**
 * Lectura de documentos tributarios: qué se le pide a la IA y cómo se compara
 * lo que extrajo con lo esperado. Módulo PURO (la llamada está en documentos.ts).
 *
 * La IA solo lee. Comparar y contar plazos lo hace el código, que es
 * determinista: el plazo de un requerimiento se calcula con diasHabiles.ts.
 */
import { venceDiasCalendario, venceDiasHabiles, venceMeses } from '../agente/diasHabiles.ts'
import { pesos } from './control.ts'

export const TIPOS_DOCUMENTO = ['declaracion', 'recibo_pago', 'comprobante_banco', 'acuse', 'requerimiento', 'otro'] as const
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]

export const TIPO_DOC_TEXTO: Record<TipoDocumento, string> = {
  declaracion: 'Declaración',
  recibo_pago: 'Recibo de pago',
  comprobante_banco: 'Comprobante del banco',
  acuse: 'Acuse de la entidad',
  requerimiento: 'Requerimiento',
  otro: 'Otro documento',
}

export interface ExtraccionFin {
  tipo_documento: TipoDocumento
  entidad: string
  nit: string
  formulario: string
  concepto: string
  periodo: string
  valor_total: number | null
  referencia: string
  fecha_documento: string
  fecha_notificacion: string
  plazo_cantidad: number | null
  plazo_unidad: 'dias_habiles' | 'dias_calendario' | 'meses' | 'sin_plazo'
  que_pide: string
  resumen: string
  confianza: 'alta' | 'media' | 'baja'
}

const texto = { type: 'string' } as const
export const ESQUEMA_FIN = {
  type: 'object',
  additionalProperties: false,
  required: ['tipo_documento', 'entidad', 'nit', 'formulario', 'concepto', 'periodo', 'valor_total', 'referencia', 'fecha_documento', 'fecha_notificacion', 'plazo_cantidad', 'plazo_unidad', 'que_pide', 'resumen', 'confianza'],
  properties: {
    tipo_documento: { type: 'string', enum: [...TIPOS_DOCUMENTO] },
    entidad: { type: 'string', enum: ['DIAN', 'SDH', 'PILA', 'otra'] },
    nit: texto,
    formulario: texto,
    concepto: texto,
    periodo: texto,
    valor_total: { type: ['integer', 'null'] },
    referencia: texto,
    fecha_documento: texto,
    fecha_notificacion: texto,
    plazo_cantidad: { type: ['integer', 'null'] },
    plazo_unidad: { type: 'string', enum: ['dias_habiles', 'dias_calendario', 'meses', 'sin_plazo'] },
    que_pide: texto,
    resumen: texto,
    confianza: { type: 'string', enum: ['alta', 'media', 'baja'] },
  },
} as const

export const INSTRUCCIONES_FIN = `Lees documentos tributarios de Ekosolv S.A.S., una consultora ambiental de Bogotá, Colombia: declaraciones (DIAN o Secretaría Distrital de Hacienda), recibos de pago (formulario 490 de la DIAN o el de Hacienda), comprobantes de pago del banco o PSE, acuses de recibo de la entidad y requerimientos o emplazamientos de la DIAN o de Hacienda.

Extrae solo lo que está escrito en el documento. Nunca inventes ni completes un dato que no aparece: si no está, deja el texto vacío o el número en null.

- entidad: DIAN, SDH (Secretaría Distrital de Hacienda de Bogotá), PILA (planilla de seguridad social) u otra.
- nit: el NIT del contribuyente (no el de la entidad), solo dígitos, sin el dígito de verificación.
- formulario: número del formulario (350, 300, 110, 490, ICA...).
- periodo: el periodo gravable tal como aparece (por ejemplo "Octubre 2026", "Bimestre 5 de 2026", "Año gravable 2025").
- valor_total: el total a pagar o pagado, en pesos enteros, sin decimales ni separadores.
- referencia: el número del formulario, del recibo de pago, del radicado o de la transacción, el que identifique el documento.
- fechas en formato AAAA-MM-DD. fecha_notificacion solo si el documento la dice (en requerimientos).
- plazo_cantidad y plazo_unidad: el plazo para responder que fija un requerimiento (por ejemplo 15 días hábiles, un mes). Si no fija plazo, null y sin_plazo.
- que_pide: en un requerimiento, qué le piden a Ekosolv, en una o dos frases.
- resumen: una frase que diga qué es el documento.
- confianza: baja si el documento está borroso, incompleto o no es tributario.

Responde en español.`

const fechaOk = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '')
const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const entero = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null)

export function normalizarFin(raw: any): ExtraccionFin {
  const r = raw && typeof raw === 'object' ? raw : {}
  return {
    tipo_documento: (TIPOS_DOCUMENTO as readonly string[]).includes(r.tipo_documento) ? r.tipo_documento : 'otro',
    entidad: ['DIAN', 'SDH', 'PILA', 'otra'].includes(r.entidad) ? r.entidad : 'otra',
    nit: str(r.nit, 20).replace(/\D/g, ''),
    formulario: str(r.formulario, 40),
    concepto: str(r.concepto, 200),
    periodo: str(r.periodo, 80),
    valor_total: entero(r.valor_total),
    referencia: str(r.referencia, 60),
    fecha_documento: fechaOk(r.fecha_documento),
    fecha_notificacion: fechaOk(r.fecha_notificacion),
    plazo_cantidad: entero(r.plazo_cantidad),
    plazo_unidad: ['dias_habiles', 'dias_calendario', 'meses', 'sin_plazo'].includes(r.plazo_unidad) ? r.plazo_unidad : 'sin_plazo',
    que_pide: str(r.que_pide, 600),
    resumen: str(r.resumen, 300),
    confianza: ['alta', 'media', 'baja'].includes(r.confianza) ? r.confianza : 'baja',
  }
}

export interface Diferencia {
  campo: string
  esperado: string
  encontrado: string
  grave: boolean
}

/**
 * Compara lo extraído con lo esperado: el NIT de Ekosolv y, si el documento
 * está asociado a una obligación, su entidad, periodo, valor del borrador y
 * la referencia del pago.
 */
export function comparar(
  e: ExtraccionFin,
  esperado: { nit: string; obligacion?: { entidad: string; periodo: string; valor_borrador: number | null } | null; pago?: { valor: number; referencia: string } | null },
): Diferencia[] {
  const out: Diferencia[] = []
  const nit = esperado.nit.replace(/\D/g, '')
  if (e.nit && e.nit !== nit && e.nit !== nit + '') {
    // Algunos documentos traen el NIT con el dígito de verificación pegado.
    if (!(e.nit.length === nit.length + 1 && e.nit.startsWith(nit))) out.push({ campo: 'NIT', esperado: nit, encontrado: e.nit, grave: true })
  }
  if (!e.nit && e.tipo_documento !== 'comprobante_banco') out.push({ campo: 'NIT', esperado: nit, encontrado: 'no aparece', grave: false })
  const o = esperado.obligacion
  if (o) {
    if (e.entidad !== 'otra' && e.entidad !== o.entidad) out.push({ campo: 'Entidad', esperado: o.entidad, encontrado: e.entidad, grave: true })
    const anio = /\b(20\d{2})\b/.exec(o.periodo)?.[1]
    if (anio && e.periodo && !e.periodo.includes(anio)) out.push({ campo: 'Periodo', esperado: o.periodo, encontrado: e.periodo, grave: true })
    const valorEsperado = esperado.pago?.valor ?? o.valor_borrador
    if (valorEsperado != null && e.valor_total != null && e.valor_total !== valorEsperado) {
      out.push({ campo: 'Valor', esperado: pesos(valorEsperado), encontrado: pesos(e.valor_total), grave: true })
    }
  }
  const ref = (s: string) => s.replace(/[\s.-]/g, '').toUpperCase()
  if (esperado.pago && e.referencia && (e.tipo_documento === 'recibo_pago' || e.tipo_documento === 'comprobante_banco') && !ref(e.referencia).includes(ref(esperado.pago.referencia)) && !ref(esperado.pago.referencia).includes(ref(e.referencia))) {
    out.push({ campo: 'Referencia de pago', esperado: esperado.pago.referencia, encontrado: e.referencia, grave: true })
  }
  if (e.confianza === 'baja') out.push({ campo: 'Lectura', esperado: 'documento legible', encontrado: 'la IA tuvo poca confianza: revise a mano', grave: false })
  return out
}

/** Vencimiento de un requerimiento, contado desde la notificación. `null` si no se puede calcular. */
export function venceRequerimiento(fechaNotificacion: string, cantidad: number | null, unidad: ExtraccionFin['plazo_unidad']): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNotificacion) || !cantidad || cantidad <= 0) return null
  if (unidad === 'dias_habiles') return venceDiasHabiles(fechaNotificacion, cantidad)
  if (unidad === 'dias_calendario') return venceDiasCalendario(fechaNotificacion, cantidad)
  if (unidad === 'meses') return venceMeses(fechaNotificacion, cantidad)
  return null
}
