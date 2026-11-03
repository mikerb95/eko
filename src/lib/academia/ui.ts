// Piezas de presentación compartidas por las páginas de la academia. PURO.

/** Mismos colores por módulo que el programa de /ia. */
export const COLOR: Record<string, string> = {
  general: '#124E7D',
  operaciones: '#1f8a8a',
  logistica: '#46a85b',
  ventas: '#2f80c9',
  mercadeo: '#c2557a',
  gerencia: '#8b5cf6',
  finanzas: '#e8920c',
}

export const colorDe = (modulo: string) => COLOR[modulo] ?? '#124E7D'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** "sábado 14 de noviembre" (sin año si es el actual). */
export function fechaLarga(iso: string, hoy = ''): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
  if (!m) return iso || ''
  const d = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!))
  const base = `${DIAS[d.getUTCDay()]} ${+m[3]!} de ${MESES[+m[2]! - 1]}`
  return hoy && hoy.slice(0, 4) === m[1] ? base : `${base} de ${m[1]}`
}

/** "3 de noviembre de 2026", para documentos formales. */
export function fechaFormal(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
  return m ? `${+m[3]!} de ${MESES[+m[2]! - 1]} de ${m[1]}` : iso || ''
}

/** "8:00 a. m." a partir de "08:00". */
export function horaTexto(h: string): string {
  const m = /^(\d{2}):(\d{2})$/.exec(h || '')
  if (!m) return ''
  const n = +m[1]!
  const sufijo = n < 12 ? 'a. m.' : 'p. m.'
  const h12 = n % 12 === 0 ? 12 : n % 12
  return `${h12}:${m[2]} ${sufijo}`
}

export const ESTADO_ENTREGA: Record<string, { texto: string; clase: string }> = {
  enviada: { texto: 'Por revisar', clase: 'revisar' },
  aprobada: { texto: 'Aprobada', clase: 'ok' },
  devuelta: { texto: 'Devuelta para ajustar', clase: 'ajustar' },
}

export const primerNombre = (n: string) => n.trim().split(/\s+/)[0] || n
