/**
 * Certificado laboral: el texto, armado con los datos de la ficha. Puro (sin
 * base) para probarlo; la página /admin/talento/certificado solo lo pinta.
 */
import { CONTRATOS_LABORALES } from './reglas.ts'

/** Cómo se nombra cada contrato dentro de la frase del certificado. */
const CONTRATO_EN_FRASE: Record<string, string> = {
  indefinido: 'mediante contrato de trabajo a término indefinido',
  fijo: 'mediante contrato de trabajo a término fijo',
  obra: 'mediante contrato de trabajo por obra o labor',
  aprendizaje: 'mediante contrato de aprendizaje',
  prestacion: 'mediante contrato de prestación de servicios',
}

const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

function hasta999(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cien'
  const c = Math.floor(n / 100)
  const r = n % 100
  let resto = ''
  if (r < 30) resto = UNIDADES[r]!
  else resto = DECENAS[Math.floor(r / 10)]! + (r % 10 ? ` y ${UNIDADES[r % 10]}` : '')
  return [CENTENAS[c], resto].filter(Boolean).join(' ')
}

/** "uno" pasa a "un" delante de "mil", "millón" y "pesos" (veintiuno → veintiún). */
const apocopar = (s: string) => s.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un')

/** Entero en letras, en español: 1.750.905 → "un millón setecientos cincuenta mil novecientos cinco". */
export function enLetras(n: number): string {
  n = Math.floor(Math.abs(n))
  if (n === 0) return 'cero'
  const millones = Math.floor(n / 1_000_000)
  const miles = Math.floor((n % 1_000_000) / 1000)
  const resto = n % 1000
  const partes: string[] = []
  if (millones) partes.push(millones === 1 ? 'un millón' : `${apocopar(enLetras(millones))} millones`)
  if (miles) partes.push(miles === 1 ? 'mil' : `${apocopar(hasta999(miles))} mil`)
  if (resto) partes.push(hasta999(resto))
  return partes.join(' ')
}

/** "1.750.905" → "un millón setecientos cincuenta mil novecientos cinco pesos", con "de" tras millón(es) redondos. */
export function pesosEnLetras(n: number): string {
  const l = apocopar(enLetras(n))
  return /(millón|millones)$/.test(l) ? `${l} de pesos` : `${l} pesos`
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** "2024-03-01" → "1 de marzo de 2024". */
export function fechaLarga(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  return `${d} de ${MESES[(m ?? 1) - 1]} de ${a}`
}

export interface DatosCertificado {
  nombre: string
  documento: string
  cargo: string
  tipo_contrato: string
  fecha_ingreso: string
  fecha_retiro: string
  salario: number | null
  conSalario: boolean
  hoy: string
  empresa: string
  nit: string
  ciudad: string
}

export interface Certificado {
  parrafos: string[]
  expedicion: string
  faltan: string[]
}

/**
 * El texto del certificado. Si faltan datos que el documento necesita
 * (nombre, documento, fecha de ingreso), los devuelve en `faltan` para
 * avisarlo en vez de imprimir un certificado incompleto.
 */
export function armarCertificado(d: DatosCertificado): Certificado {
  const faltan: string[] = []
  if (!d.documento) faltan.push('el documento de identidad')
  if (!d.fecha_ingreso) faltan.push('la fecha de ingreso')
  if (d.conSalario && !d.salario) faltan.push('el salario')
  const retirado = !!d.fecha_retiro && d.fecha_retiro <= d.hoy
  const laboral = CONTRATOS_LABORALES.includes(d.tipo_contrato) || d.tipo_contrato === 'aprendizaje'
  const verbo = laboral ? (retirado ? 'laboró' : 'labora') : retirado ? 'prestó sus servicios' : 'presta sus servicios'
  const periodo = d.fecha_ingreso
    ? retirado
      ? `desde el ${fechaLarga(d.fecha_ingreso)} hasta el ${fechaLarga(d.fecha_retiro)}`
      : `desde el ${fechaLarga(d.fecha_ingreso)} hasta la fecha`
    : ''
  const contratoTxt = CONTRATO_EN_FRASE[d.tipo_contrato] ? `, ${CONTRATO_EN_FRASE[d.tipo_contrato]}` : ''
  const cargoTxt = d.cargo ? `, en el cargo de ${d.cargo}` : ''
  const parrafos = [
    `Que ${d.nombre}, identificado(a) con cédula de ciudadanía No. ${d.documento || '_____'}, ${verbo} en ${d.empresa} ${periodo}${contratoTxt}${cargoTxt}.`,
  ]
  if (d.conSalario && d.salario) {
    const valor = `${pesosEnLetras(d.salario).toUpperCase()} M/CTE ($${d.salario.toLocaleString('es-CO')})`
    parrafos.push(retirado ? `Su último salario mensual fue de ${valor}.` : `Actualmente devenga un salario mensual de ${valor}.`)
  }
  const [a, m, dia] = d.hoy.split('-').map(Number)
  const expedicion = `Se expide a solicitud del interesado(a) en ${d.ciudad}, a los ${dia === 1 ? 'un (1) día' : `${enLetras(dia!)} (${dia}) días`} del mes de ${MESES[m! - 1]} de ${a}.`
  return { parrafos, expedicion, faltan }
}
