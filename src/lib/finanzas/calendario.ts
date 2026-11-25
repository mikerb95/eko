/**
 * Calendario tributario de Ekosolv: qué vence y cuándo.
 *
 * ── DE DÓNDE SALEN LAS FECHAS ──────────────────────────────────────────────
 * - **DIAN.** Plazos por último dígito del NIT (Decreto 2229 de 2023, DUR
 *   1625 de 2016). Para los meses con calendario oficial publicado se usa la
 *   tabla de la DIAN (DIAN_OFICIAL). Para los demás se estima con la regla del
 *   decreto: el dígito 1 vence el 7.º día hábil, el 2 el 8.º... y el 0 el 16.º.
 *   La prueba (calendario.test.ts) verifica que en 2026 la regla nunca dio una
 *   fecha posterior a la oficial, así que el estimado avisa antes, no después.
 * - **Exógena.** La fija una resolución de la DIAN cada año, con los dos
 *   últimos dígitos del NIT. Solo se siembra el año que esté en EXOGENA.
 * - **Seguridad social (PILA).** Decreto 1990 de 2016: día hábil del mes según
 *   los dos últimos dígitos del NIT del aportante.
 * - **Hacienda Bogotá (ICA y reteICA).** Las fija cada año la Secretaría
 *   Distrital de Hacienda con fechas fijas, no por dígito. Van en tablas por
 *   año y quedan marcadas "por verificar" hasta confirmarlas con la resolución.
 *
 * Toda fecha se puede corregir a mano en el panel: esto solo siembra.
 * ────────────────────────────────────────────────────────────────────────────
 * Módulo PURO: sin base de datos ni red.
 */
import { esHabil } from '../agente/diasHabiles.ts'

export interface Responsabilidades {
  nit: string
  dv: string
  retencion: boolean
  iva: 'bimestral' | 'cuatrimestral' | 'no'
  renta: boolean
  granContribuyente: boolean
  activosExterior: boolean
  exogena: boolean
  pila: boolean
  ica: 'bimestral' | 'anual' | 'no'
  reteica: boolean
}

export interface ObligacionSembrada {
  clave: string
  tipo: TipoObligacion
  concepto: string
  entidad: string
  periodo: string
  formulario: string
  vence: string
  con_pago: boolean
  fuente: string
}

export const TIPOS = ['retefuente', 'iva', 'renta', 'activos_exterior', 'exogena', 'pila', 'ica', 'reteica', 'requerimiento', 'otra'] as const
export type TipoObligacion = (typeof TIPOS)[number]

export const TIPO_TEXTO: Record<TipoObligacion, string> = {
  retefuente: 'Retención en la fuente',
  iva: 'IVA',
  renta: 'Renta',
  activos_exterior: 'Activos en el exterior',
  exogena: 'Información exógena',
  pila: 'Seguridad social (PILA)',
  ica: 'ICA Bogotá',
  reteica: 'ReteICA Bogotá',
  requerimiento: 'Requerimiento',
  otra: 'Otra obligación',
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const mesTexto = (anio: number, mes: number) => `${MESES[mes - 1]![0]!.toUpperCase()}${MESES[mes - 1]!.slice(1)} ${anio}`
const bimestreTexto = (anio: number, b: number) => `${cap(MESES[2 * b - 2]!)} a ${MESES[2 * b - 1]} ${anio}`
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1)
const dos = (n: number) => String(n).padStart(2, '0')

const FUENTE_DIAN = 'Calendario oficial de la DIAN'
const FUENTE_DIAN_ESTIMADA = 'Estimada con la regla del Decreto 2229 de 2023: confirmar con el calendario oficial de la DIAN de ese año'
/** Fecha DIAN y su fuente, para sembrar. */
function dian(anio: number, mes: number, nit: string): { vence: string; fuente: string } {
  const v = venceDianDetalle(anio, mes, nit)
  return { vence: v.vence, fuente: v.oficial ? FUENTE_DIAN : FUENTE_DIAN_ESTIMADA }
}
const FUENTE_PILA = 'Decreto 1990 de 2016 (PILA)'
const FUENTE_SDH = 'Calendario distrital de Hacienda Bogotá, por verificar con la resolución'

/** `AAAA-MM-DD` del n-ésimo día hábil del mes (1 = primer día hábil). */
export function nesimoHabil(anio: number, mes: number, n: number): string {
  let cuenta = 0
  for (let dia = 1; dia <= 31; dia++) {
    const d = new Date(Date.UTC(anio, mes - 1, dia))
    if (d.getUTCMonth() !== mes - 1) break
    const iso = d.toISOString().slice(0, 10)
    if (esHabil(iso) && ++cuenta === n) return iso
  }
  throw new Error(`El mes ${anio}-${dos(mes)} no tiene ${n} días hábiles`)
}

/** Último dígito del NIT sin el de verificación. */
export function ultimoDigito(nit: string): number {
  const limpio = String(nit).replace(/\D/g, '')
  if (!limpio) throw new Error('NIT vacío')
  return Number(limpio.slice(-1))
}

/** Dos últimos dígitos del NIT (sin el de verificación), de 0 a 99. */
export function dosUltimos(nit: string): number {
  const limpio = String(nit).replace(/\D/g, '')
  return Number(limpio.slice(-2))
}

/** Día hábil del mes en que vence la DIAN para un dígito: 1 → 7.º ... 0 → 16.º. */
export function diaHabilDian(digito: number): number {
  return digito === 0 ? 16 : 6 + digito
}

/**
 * Calendario oficial publicado por la DIAN: días del mes para los dígitos
 * 1, 2, 3, 4, 5, 6, 7, 8, 9, 0. En un mismo mes todas las obligaciones por
 * dígito (retención, IVA, renta, RST) comparten la tabla.
 *
 * Hace falta porque la regla de días hábiles no siempre coincide: en abril y
 * julio de 2026 la DIAN se saltó un día hábil (17 de abril y 13 de julio). En
 * todos los casos la fecha oficial quedó MÁS TARDE que la regla, así que la
 * regla sirve como estimado seguro para los años sin calendario publicado: el
 * aviso llega antes, nunca después. Cada año, cuando la DIAN publique su
 * calendario, se agregan aquí sus meses.
 */
const DIAN_OFICIAL: Record<string, readonly number[]> = {
  // Calendario_Tributario_2026.pdf (dian.gov.co).
  '2026-02': [10, 11, 12, 13, 16, 17, 18, 19, 20, 23],
  '2026-03': [10, 11, 12, 13, 16, 17, 18, 19, 20, 24],
  '2026-04': [13, 14, 15, 16, 20, 21, 22, 23, 24, 27],
  '2026-05': [12, 13, 14, 15, 19, 20, 21, 22, 25, 26],
  '2026-06': [10, 11, 12, 16, 17, 18, 19, 22, 23, 24],
  '2026-07': [9, 10, 14, 15, 16, 17, 21, 22, 23, 24],
  '2026-08': [12, 13, 14, 18, 19, 20, 21, 24, 25, 26],
  '2026-09': [9, 10, 11, 14, 15, 16, 17, 18, 21, 22],
  '2026-10': [9, 13, 14, 15, 16, 19, 20, 21, 22, 23],
  '2026-11': [11, 12, 13, 17, 18, 19, 20, 23, 24, 25],
  '2026-12': [10, 11, 14, 15, 16, 17, 18, 21, 22, 23],
  '2027-01': [13, 14, 15, 18, 19, 20, 21, 22, 25, 26],
}

export interface VenceDian {
  vence: string
  /** `false` = estimado con la regla; confirmar con el calendario oficial. */
  oficial: boolean
}

export function venceDianDetalle(anio: number, mes: number, nit: string): VenceDian {
  const d = ultimoDigito(nit)
  const tabla = DIAN_OFICIAL[`${anio}-${dos(mes)}`]
  if (tabla) return { vence: `${anio}-${dos(mes)}-${dos(tabla[d === 0 ? 9 : d - 1]!)}`, oficial: true }
  return { vence: nesimoHabil(anio, mes, diaHabilDian(d)), oficial: false }
}

export function venceDian(anio: number, mes: number, nit: string): string {
  return venceDianDetalle(anio, mes, nit).vence
}

/** Fecha por la regla, sin mirar la tabla oficial (para probar la regla). */
export function venceDianPorRegla(anio: number, mes: number, nit: string): string {
  return nesimoHabil(anio, mes, diaHabilDian(ultimoDigito(nit)))
}

/** PILA (Decreto 1990 de 2016): día hábil según los dos últimos dígitos del NIT. */
const PILA_RANGOS: readonly [hasta: number, diaHabil: number][] = [
  [7, 2], [14, 3], [21, 4], [28, 5], [35, 6], [42, 7], [49, 8], [56, 9],
  [63, 10], [69, 11], [75, 12], [81, 13], [87, 14], [93, 15], [99, 16],
]
export function diaHabilPila(dosDigitos: number): number {
  return PILA_RANGOS.find(([hasta]) => dosDigitos <= hasta)![1]
}

/**
 * Exógena de personas jurídicas por año en que se presenta: rangos de los
 * dos últimos dígitos del NIT. Solo los rangos confirmados; si el NIT no cae
 * en ninguno, no se siembra y se carga a mano.
 */
const EXOGENA: Record<number, readonly { desde: number; hasta: number; vence: string }[]> = {
  // Resolución DIAN 000227 de 2025 (año gravable 2025).
  2026: [
    { desde: 1, hasta: 5, vence: '2026-05-14' },
    { desde: 6, hasta: 10, vence: '2026-05-15' },
    { desde: 11, hasta: 15, vence: '2026-05-19' },
  ],
}

/** ICA Bogotá, régimen común bimestral: [año del periodo, bimestre, vence]. */
const ICA_BIMESTRAL: readonly [number, number, string][] = [
  [2026, 1, '2026-04-10'],
  [2026, 2, '2026-06-12'],
  [2026, 3, '2026-08-21'],
  [2026, 4, '2026-10-09'],
  [2026, 5, '2026-12-11'],
  [2026, 6, '2027-02-12'],
]
/** ICA Bogotá anual: [año gravable, vence]. */
const ICA_ANUAL: readonly [number, string][] = [[2026, '2027-02-26']]
/** ReteICA Bogotá bimestral: [año del periodo, bimestre, vence]. */
const RETEICA: readonly [number, number, string][] = [
  [2026, 1, '2026-03-20'],
  [2026, 2, '2026-05-22'],
  [2026, 3, '2026-07-17'],
  [2026, 4, '2026-09-18'],
  [2026, 5, '2026-11-20'],
  [2026, 6, '2027-01-15'],
]

/** Años para los que hay fechas distritales cargadas (lo demás se carga a mano). */
export function aniosConFechasDistritales(): number[] {
  return [...new Set([...ICA_BIMESTRAL, ...RETEICA].map(([, , v]) => Number(v.slice(0, 4))))].sort()
}

/**
 * Obligaciones que vencen en `anio` según las responsabilidades. Idempotente
 * por `clave`: sembrar dos veces el mismo año no duplica nada.
 */
export function obligacionesDelAnio(r: Responsabilidades, anio: number): ObligacionSembrada[] {
  const out: ObligacionSembrada[] = []
  const nit = r.nit

  if (r.retencion) {
    for (let mes = 1; mes <= 12; mes++) {
      const pa = mes === 1 ? anio - 1 : anio
      const pm = mes === 1 ? 12 : mes - 1
      out.push({
        clave: `retefuente:${pa}-${dos(pm)}`,
        tipo: 'retefuente',
        concepto: 'Retención en la fuente: declaración y pago mensual',
        entidad: 'DIAN',
        periodo: mesTexto(pa, pm),
        formulario: '350',
        ...dian(anio, mes, nit),
        con_pago: true,
      })
    }
  }

  if (r.iva === 'bimestral') {
    // Se declara en enero (nov-dic del año anterior), marzo, mayo, julio, septiembre y noviembre.
    for (const mes of [1, 3, 5, 7, 9, 11]) {
      const pa = mes === 1 ? anio - 1 : anio
      const b = mes === 1 ? 6 : (mes - 1) / 2
      out.push({
        clave: `iva:${pa}-B${b}`,
        tipo: 'iva',
        concepto: 'IVA bimestral: declaración y pago',
        entidad: 'DIAN',
        periodo: bimestreTexto(pa, b),
        formulario: '300',
        ...dian(anio, mes, nit),
        con_pago: true,
      })
    }
  } else if (r.iva === 'cuatrimestral') {
    const cuatri: [number, number, number, string][] = [
      [1, anio - 1, 3, 'Septiembre a diciembre'],
      [5, anio, 1, 'Enero a abril'],
      [9, anio, 2, 'Mayo a agosto'],
    ]
    for (const [mes, pa, c, txt] of cuatri) {
      out.push({
        clave: `iva:${pa}-C${c}`,
        tipo: 'iva',
        concepto: 'IVA cuatrimestral: declaración y pago',
        entidad: 'DIAN',
        periodo: `${txt} ${pa}`,
        formulario: '300',
        ...dian(anio, mes, nit),
        con_pago: true,
      })
    }
  }

  if (r.renta) {
    const ag = anio - 1
    const cuotas: [mes: number, n: number, concepto: string][] = r.granContribuyente
      ? [
          [2, 1, 'Renta: pago primera cuota'],
          [4, 2, 'Renta: declaración y pago segunda cuota'],
          [6, 3, 'Renta: pago tercera cuota'],
        ]
      : [
          [5, 1, 'Renta: declaración y pago primera cuota'],
          [7, 2, 'Renta: pago segunda cuota'],
        ]
    for (const [mes, n, concepto] of cuotas) {
      out.push({
        clave: `renta:${ag}-cuota${n}`,
        tipo: 'renta',
        concepto,
        entidad: 'DIAN',
        periodo: `Año gravable ${ag}`,
        formulario: concepto.includes('declaración') ? '110' : '490',
        ...dian(anio, mes, nit),
        con_pago: true,
      })
    }
    if (r.activosExterior) {
      out.push({
        clave: `activos_exterior:${ag}`,
        tipo: 'activos_exterior',
        concepto: 'Declaración anual de activos en el exterior',
        entidad: 'DIAN',
        periodo: `Año gravable ${ag}`,
        formulario: '160',
        // Mismas fechas que la declaración de renta.
        ...dian(anio, r.granContribuyente ? 4 : 5, nit),
        con_pago: false,
      })
    }
  }

  if (r.exogena) {
    const d2 = dosUltimos(nit)
    const rango = EXOGENA[anio]?.find((x) => d2 >= x.desde && d2 <= x.hasta)
    if (rango) {
      out.push({
        clave: `exogena:${anio - 1}`,
        tipo: 'exogena',
        concepto: 'Información exógena (reporte de medios magnéticos)',
        entidad: 'DIAN',
        periodo: `Año gravable ${anio - 1}`,
        formulario: 'Formatos exógena',
        vence: rango.vence,
        con_pago: false,
        fuente: 'Resolución anual de exógena de la DIAN',
      })
    }
  }

  if (r.pila) {
    const dia = diaHabilPila(dosUltimos(nit))
    for (let mes = 1; mes <= 12; mes++) {
      out.push({
        clave: `pila:${anio}-${dos(mes)}`,
        tipo: 'pila',
        concepto: 'Seguridad social y parafiscales: pago de la planilla',
        entidad: 'PILA',
        periodo: `Planilla de ${mesTexto(anio, mes).toLowerCase()}`,
        formulario: 'Planilla PILA',
        vence: nesimoHabil(anio, mes, dia),
        con_pago: true,
        fuente: FUENTE_PILA,
      })
    }
  }

  if (r.ica === 'bimestral') {
    for (const [pa, b, vence] of ICA_BIMESTRAL) {
      if (Number(vence.slice(0, 4)) !== anio) continue
      out.push({
        clave: `ica:${pa}-B${b}`,
        tipo: 'ica',
        concepto: 'ICA Bogotá: declaración y pago bimestral',
        entidad: 'SDH',
        periodo: bimestreTexto(pa, b),
        formulario: 'ICA',
        vence,
        con_pago: true,
        fuente: FUENTE_SDH,
      })
    }
  } else if (r.ica === 'anual') {
    for (const [ag, vence] of ICA_ANUAL) {
      if (Number(vence.slice(0, 4)) !== anio) continue
      out.push({
        clave: `ica:${ag}-anual`,
        tipo: 'ica',
        concepto: 'ICA Bogotá: declaración y pago anual',
        entidad: 'SDH',
        periodo: `Año gravable ${ag}`,
        formulario: 'ICA',
        vence,
        con_pago: true,
        fuente: FUENTE_SDH,
      })
    }
  }

  if (r.reteica) {
    for (const [pa, b, vence] of RETEICA) {
      if (Number(vence.slice(0, 4)) !== anio) continue
      out.push({
        clave: `reteica:${pa}-B${b}`,
        tipo: 'reteica',
        concepto: 'ReteICA Bogotá: declaración y pago bimestral',
        entidad: 'SDH',
        periodo: bimestreTexto(pa, b),
        formulario: 'ReteICA',
        vence,
        con_pago: true,
        fuente: FUENTE_SDH,
      })
    }
  }

  return out.sort((a, b) => a.vence.localeCompare(b.vence) || a.clave.localeCompare(b.clave))
}

/** Lo que aún no se sabe para un año: se muestra en el panel para cargarlo a mano. */
export function faltantesDelAnio(r: Responsabilidades, anio: number): string[] {
  const f: string[] = []
  const d2 = dosUltimos(r.nit)
  if (r.exogena && !EXOGENA[anio]?.some((x) => d2 >= x.desde && d2 <= x.hasta)) {
    f.push(`Información exógena ${anio}: la fecha sale en la resolución anual de la DIAN.`)
  }
  if (r.ica !== 'no' && !aniosConFechasDistritales().includes(anio)) {
    f.push(`ICA Bogotá ${anio}: las fechas salen en el calendario distrital de ese año.`)
  }
  if (r.reteica && !RETEICA.some(([, , v]) => Number(v.slice(0, 4)) === anio)) {
    f.push(`ReteICA Bogotá ${anio}: las fechas salen en el calendario distrital de ese año.`)
  }
  return f
}
