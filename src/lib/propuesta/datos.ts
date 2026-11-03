/**
 * La propuesta comercial de codebymike.net a Ekosolv, como datos. Módulo PURO.
 *
 * Es la fuente única de /propuesta: la página, el simulador, la aceptación y
 * el chat con IA leen de aquí. La copia en papel es
 * propuesta_ekosolv_ia_con_logistica.pdf (15 páginas, noviembre de 2026); si
 * cambia un precio, se cambia aquí y en el PDF.
 *
 * Valores en pesos colombianos, finales (Mike no factura con IVA: no se
 * menciona).
 */

export type IdPlan = 'p20' | 'p40' | 'p80'
export type IdCapacitacion = 'ninguna' | 's4' | 's5'

export interface Plan {
  id: IdPlan
  propuestas: number
  etiqueta: string
  /** Meses 1 a 18 (incluye la cuota de construcción). */
  mensual: number
  /** Desde el mes 19. */
  mensualDespues: number
  /** Parte de consumo de IA dentro de la mensualidad. */
  consumoIA: number
}

export const PLANES: readonly Plan[] = [
  { id: 'p20', propuestas: 20, etiqueta: 'Hasta 20 propuestas al mes', mensual: 1_185_000, mensualDespues: 785_000, consumoIA: 285_000 },
  { id: 'p40', propuestas: 40, etiqueta: 'Hasta 40 propuestas al mes', mensual: 1_400_000, mensualDespues: 1_000_000, consumoIA: 500_000 },
  { id: 'p80', propuestas: 80, etiqueta: 'Hasta 80 propuestas al mes', mensual: 1_700_000, mensualDespues: 1_300_000, consumoIA: 800_000 },
]

export const ANTICIPO = 500_000
export const CUOTA_CONSTRUCCION = 400_000
export const MESES_CONSTRUCCION = 18
export const INFRAESTRUCTURA = 150_000
export const FUNCIONAMIENTO = 350_000
export const EXCEDENTE = 25_000
export const EXPEDIENTES_ADICIONALES = 50_000 // por cada 25 expedientes, al mes
export const REVISION_ADICIONAL = 20_000 // por documento
export const SEMANAS_DESARROLLO = 8

export interface OpcionCapacitacion {
  id: Exclude<IdCapacitacion, 'ninguna'>
  sabados: number
  horas: number
  etiqueta: string
  conAutomatizacion: number
  sola: number
}

export const CAPACITACION: readonly OpcionCapacitacion[] = [
  { id: 's4', sabados: 4, horas: 16, etiqueta: '4 sábados de 4 horas (16 h)', conAutomatizacion: 1_200_000, sola: 1_680_000 },
  { id: 's5', sabados: 5, horas: 20, etiqueta: '5 sábados de 4 horas (20 h)', conAutomatizacion: 1_500_000, sola: 2_100_000 },
]

export const plan = (id: string) => PLANES.find((p) => p.id === id)
export const capacitacion = (id: string) => CAPACITACION.find((c) => c.id === id)

export interface Eleccion {
  /** null = sin automatización (solo capacitación). */
  plan: IdPlan | null
  capacitacion: IdCapacitacion
}

export interface Calculo {
  plan: Plan | null
  capacitacion: OpcionCapacitacion | null
  /** Valor de la capacitación según vaya o no con la automatización. */
  valorCapacitacion: number
  /** Si la capacitación sale con precio especial por ir con la automatización. */
  capacitacionEspecial: boolean
  /** Ahorro en la capacitación por contratarla con la automatización. */
  ahorroCapacitacion: number
  anticipo: number
  mensual: number
  mensualDespues: number
  /** Anticipo + 18 mensualidades. */
  totalAutomatizacion18: number
  /** Lo que se paga al empezar: anticipo y la mitad de la capacitación. */
  alFirmar: number
  /** Todo lo de los primeros 18 meses de funcionamiento, capacitación incluida. */
  total18: number
}

/** El simulador y la aceptación: qué paga Ekosolv con una elección. */
export function calcular(e: Eleccion): Calculo {
  const p = e.plan ? plan(e.plan) ?? null : null
  const c = e.capacitacion === 'ninguna' ? null : capacitacion(e.capacitacion) ?? null
  const especial = Boolean(p && c)
  const valorCapacitacion = c ? (especial ? c.conAutomatizacion : c.sola) : 0
  const anticipo = p ? ANTICIPO : 0
  const mensual = p?.mensual ?? 0
  const totalAutomatizacion18 = p ? anticipo + mensual * MESES_CONSTRUCCION : 0
  return {
    plan: p,
    capacitacion: c,
    valorCapacitacion,
    capacitacionEspecial: especial,
    ahorroCapacitacion: c && p ? c.sola - c.conAutomatizacion : 0,
    anticipo,
    mensual,
    mensualDespues: p?.mensualDespues ?? 0,
    totalAutomatizacion18,
    alFirmar: anticipo + valorCapacitacion / 2,
    total18: totalAutomatizacion18 + valorCapacitacion,
  }
}

/** "$1.185.000", como en el PDF. */
export function pesos(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CO').replace(/,/g, '.')
}

/**
 * Todas las combinaciones con sus totales, ya calculados. Van en el prompt
 * para que la IA copie cifras en vez de hacer cuentas (un modelo pequeño se
 * equivoca sumando, y aquí un error es un precio que nadie ofreció).
 */
export function combinaciones(): { eleccion: Eleccion; calculo: Calculo }[] {
  const out: { eleccion: Eleccion; calculo: Calculo }[] = []
  for (const p of [...PLANES.map((x) => x.id), null] as (IdPlan | null)[]) {
    for (const c of ['ninguna', 's4', 's5'] as IdCapacitacion[]) {
      if (!p && c === 'ninguna') continue
      const eleccion = { plan: p, capacitacion: c }
      out.push({ eleccion, calculo: calcular(eleccion) })
    }
  }
  return out
}

/**
 * Cifras de dinero que la IA puede escribir: las de la propuesta y las que
 * salen de combinarlas. Cualquier otra cantidad es inventada (guardia.ts).
 */
export function cifrasPermitidas(): number[] {
  const base = [
    ANTICIPO,
    CUOTA_CONSTRUCCION,
    CUOTA_CONSTRUCCION * MESES_CONSTRUCCION,
    ANTICIPO + CUOTA_CONSTRUCCION * MESES_CONSTRUCCION,
    INFRAESTRUCTURA,
    FUNCIONAMIENTO,
    INFRAESTRUCTURA + FUNCIONAMIENTO,
    EXCEDENTE,
    EXPEDIENTES_ADICIONALES,
    REVISION_ADICIONAL,
    ...PLANES.flatMap((p) => [p.mensual, p.mensualDespues, p.consumoIA, p.mensual - p.mensualDespues, p.mensual * 12, p.mensualDespues * 12]),
    ...CAPACITACION.flatMap((c) => [c.conAutomatizacion, c.sola, c.conAutomatizacion / 2, c.sola / 2, c.sola - c.conAutomatizacion, c.conAutomatizacion / c.sabados, c.sola / c.sabados]),
    // Diferencias entre planes, por si preguntan "cuánto más cuesta el de 40".
    ...PLANES.flatMap((a) => PLANES.map((b) => Math.abs(a.mensual - b.mensual))),
    ...PLANES.flatMap((a) => PLANES.map((b) => Math.abs(a.mensualDespues - b.mensualDespues))),
    // Suscripción de Claude por participante (en dólares).
    20, 25,
  ]
  for (const { calculo: k } of combinaciones()) {
    base.push(k.totalAutomatizacion18, k.alFirmar, k.total18, k.valorCapacitacion, k.ahorroCapacitacion)
  }
  // El cero va: "semanas 1 a 8: $0" sale en la propuesta.
  return [...new Set([0, ...base.filter((n) => n > 0)])].sort((a, b) => a - b)
}
