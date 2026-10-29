/**
 * Lo que la IA extrae de un acto administrativo, y cómo se valida.
 *
 * La IA lee el documento y llena este esquema con salidas estructuradas
 * (`output_config.format`), así que la respuesta siempre llega como JSON con
 * estos campos. Aun así se normaliza: un campo vacío, un número negativo o una
 * fecha mal escrita no deben llegar a la alerta como si fueran datos.
 *
 * Este archivo no llama a la API: solo define el esquema, el prompt y la
 * validación, para poder probarlos sin red. La llamada vive en `ia.ts`.
 */
import { TIPOS_ACTO, esTipoActo, type TipoActo } from './reglas.ts'

export const UNIDADES_PLAZO = ['dias_habiles', 'dias_calendario', 'meses', 'sin_plazo'] as const
export type UnidadPlazo = (typeof UNIDADES_PLAZO)[number]

export const CONFIANZAS = ['alta', 'media', 'baja'] as const
export type Confianza = (typeof CONFIANZAS)[number]

export interface Obligacion {
  que: string
  plazo_cantidad: number
  plazo_unidad: UnidadPlazo
  plazo_texto: string
  periodica: boolean
}

export interface Extraccion {
  tipo_acto: TipoActo
  autoridad: string
  numero_expediente: string
  numero_acto: string
  fecha_acto: string
  titular: string
  nit: string
  resumen: string
  obligaciones: Obligacion[]
  normas: string[]
  accion_sugerida: string
  confianza: Confianza
  motivo_confianza: string
}

/** JSON Schema para `output_config.format`. Todo requerido, sin campos extra. */
export const ESQUEMA_EXTRACCION = {
  type: 'object',
  additionalProperties: false,
  required: [
    'tipo_acto', 'autoridad', 'numero_expediente', 'numero_acto', 'fecha_acto', 'titular', 'nit',
    'resumen', 'obligaciones', 'normas', 'accion_sugerida', 'confianza', 'motivo_confianza',
  ],
  properties: {
    tipo_acto: { type: 'string', enum: [...TIPOS_ACTO] },
    autoridad: { type: 'string', description: 'Autoridad que expide el acto, por ejemplo "CAR Cundinamarca" o "ANLA".' },
    numero_expediente: { type: 'string', description: 'Número de expediente tal como aparece. Vacío si no aparece.' },
    numero_acto: { type: 'string', description: 'Tipo y número del acto, por ejemplo "Auto 03562". Vacío si no aparece.' },
    fecha_acto: { type: 'string', description: 'Fecha de expedición en formato AAAA-MM-DD. Vacío si no aparece.' },
    titular: { type: 'string', description: 'Empresa o persona a quien va dirigido el acto.' },
    nit: { type: 'string', description: 'NIT del titular, solo dígitos y guion. Vacío si no aparece.' },
    resumen: { type: 'string', description: 'Qué decide o exige el acto, en una o dos frases claras para un consultor.' },
    obligaciones: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['que', 'plazo_cantidad', 'plazo_unidad', 'plazo_texto', 'periodica'],
        properties: {
          que: { type: 'string', description: 'Qué debe hacer o entregar el titular.' },
          plazo_cantidad: { type: 'integer', description: 'Número del plazo. 0 si no tiene plazo.' },
          plazo_unidad: { type: 'string', enum: [...UNIDADES_PLAZO] },
          plazo_texto: { type: 'string', description: 'El plazo copiado literalmente del documento.' },
          periodica: {
            type: 'boolean',
            description: 'true si la obligación se repite (reportes mensuales, informes anuales) y su plazo no se cuenta desde la notificación.',
          },
        },
      },
    },
    normas: { type: 'array', items: { type: 'string' }, description: 'Normas que cita el acto como fundamento.' },
    accion_sugerida: { type: 'string', description: 'Qué debería hacer el consultor, en una frase.' },
    confianza: { type: 'string', enum: [...CONFIANZAS] },
    motivo_confianza: {
      type: 'string',
      description: 'Si la confianza no es alta, por qué: páginas ilegibles, plazo ambiguo, número de expediente dudoso. Vacío si es alta.',
    },
  },
} as const

export const INSTRUCCIONES = `Eres el agente de cumplimiento de Ekosolv, una consultora ambiental colombiana. Lees actos administrativos de autoridades ambientales (ANLA, corporaciones autónomas regionales, secretarías de ambiente, MinAmbiente) dirigidos a clientes de Ekosolv, y extraes lo que un consultor necesita para actuar a tiempo.

Reglas:
- Extrae solo lo que dice el documento. Si un dato no aparece, déjalo vacío; no lo deduzcas ni lo inventes.
- Los plazos son lo más importante. Copia en plazo_texto la frase exacta del plazo. Indica si son días hábiles, días calendario o meses según el texto; si el documento dice solo "días", en actos administrativos colombianos se entienden hábiles.
- Si una obligación no tiene plazo, usa plazo_unidad "sin_plazo" y plazo_cantidad 0.
- Si una obligación se repite (por ejemplo "dentro de los cinco primeros días de cada mes" o "un informe anual"), marca periodica true: ese plazo no corre desde la notificación.
- tipo_acto: "requerimiento" si pide información o acciones; "sancionatorio" si abre o decide un proceso sancionatorio; "seguimiento" si es un control de seguimiento; "otorgamiento", "negacion" o "modificacion" si decide sobre un permiso o licencia; "cobro" si cobra evaluación o seguimiento; "archivo" si archiva el expediente; "otro" en cualquier otro caso.
- confianza: "alta" solo si el documento se lee completo y los plazos y números son claros. Si hay páginas borrosas, escritura a mano, plazos ambiguos o números dudosos, usa "media" o "baja" y explica por qué en motivo_confianza.
- Escribe en español de Colombia, claro y breve.`

function texto(v: unknown, max = 2000): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

/** Acepta solo `AAAA-MM-DD` con una fecha real; lo demás queda vacío. */
export function fechaValida(v: unknown): string {
  const s = texto(v, 20)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return ''
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s ? s : ''
}

function obligacion(v: any): Obligacion | null {
  if (!v || typeof v !== 'object') return null
  const que = texto(v.que, 600)
  if (!que) return null
  let unidad: UnidadPlazo = (UNIDADES_PLAZO as readonly string[]).includes(v.plazo_unidad) ? v.plazo_unidad : 'sin_plazo'
  let cantidad = Number.isInteger(v.plazo_cantidad) && v.plazo_cantidad > 0 ? v.plazo_cantidad : 0
  const periodica = v.periodica === true
  // Un plazo sin cantidad no se puede calcular, y el de una obligación
  // periódica ("los cinco primeros días de cada mes") no corre desde la
  // notificación: ambos se tratan como sin plazo para no inventar un
  // vencimiento. El texto del plazo se conserva.
  if (cantidad === 0 || unidad === 'sin_plazo' || periodica) {
    unidad = 'sin_plazo'
    cantidad = 0
  }
  return { que, plazo_cantidad: cantidad, plazo_unidad: unidad, plazo_texto: texto(v.plazo_texto, 300), periodica }
}

/** Limpia la respuesta de la IA. Nunca lanza: lo inválido queda vacío. */
export function normalizarExtraccion(raw: any): Extraccion {
  const r = raw && typeof raw === 'object' ? raw : {}
  const confianza: Confianza = (CONFIANZAS as readonly string[]).includes(r.confianza) ? r.confianza : 'baja'
  return {
    tipo_acto: esTipoActo(r.tipo_acto) ? r.tipo_acto : 'otro',
    autoridad: texto(r.autoridad, 200),
    numero_expediente: texto(r.numero_expediente, 100),
    numero_acto: texto(r.numero_acto, 100),
    fecha_acto: fechaValida(r.fecha_acto),
    titular: texto(r.titular, 200),
    nit: texto(r.nit, 30),
    resumen: texto(r.resumen, 1000),
    obligaciones: Array.isArray(r.obligaciones) ? r.obligaciones.map(obligacion).filter((o: Obligacion | null): o is Obligacion => !!o).slice(0, 20) : [],
    normas: Array.isArray(r.normas) ? r.normas.map((n: unknown) => texto(n, 200)).filter(Boolean).slice(0, 20) : [],
    accion_sugerida: texto(r.accion_sugerida, 600),
    confianza,
    motivo_confianza: texto(r.motivo_confianza, 600),
  }
}
