/**
 * Borra los datos que dejaron las pruebas de las capacitaciones desde una
 * fecha: sala del QR, votos, preguntas, prácticas, PC vinculados, avance de la
 * presentación, bitácora (inicios de sesión incluidos), asistencia,
 * progreso, entregas y certificados de la academia.
 *
 * NUNCA toca las respuestas del formulario de /ia (diagnostico_respuestas,
 * taller_casos ni ajustes), ni cuentas, inscripciones, lecciones, bloques
 * programados u otra parte del sitio.
 *
 * Por defecto es un simulacro: solo cuenta lo que borraría. Para borrar de
 * verdad hay que pasar --borrar.
 *
 *   node --env-file=.env.produccion scripts/borrar-pruebas.mjs                       (simulacro, desde hoy)
 *   node --env-file=.env.produccion scripts/borrar-pruebas.mjs --desde 2026-11-19
 *   node --env-file=.env.produccion scripts/borrar-pruebas.mjs --desde 2026-11-19 --borrar
 *
 * La fecha es un día en hora de Bogotá: se borra lo creado desde las 00:00 de
 * ese día en adelante.
 */
import { createClient } from '@libsql/client'

const args = process.argv.slice(2)
const valor = (k) => {
  const i = args.indexOf(k)
  return i >= 0 ? args[i + 1] : undefined
}
const borrar = args.includes('--borrar')
const permitirLocal = args.includes('--local')

const hoyBogota = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
const dia = valor('--desde') ?? hoyBogota
if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) {
  console.error('--desde debe ser una fecha AAAA-MM-DD')
  process.exit(1)
}
// 00:00 en Bogotá (UTC-5, sin horario de verano) = 05:00 UTC. Las tablas
// guardan las fechas con toISOString(), así que se comparan como texto.
const desde = `${dia}T05:00:00.000Z`

const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL
const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN
if (!url || (url.startsWith('file:') && !permitirLocal)) {
  console.error('No hay base remota configurada (DATABASE_URL / TURSO_DATABASE_URL).')
  console.error('Aborto para no tocar el archivo local creyendo que es producción. Si es lo que quiere, pase --local.')
  process.exit(1)
}

// [tabla, condición]. El orden importa poco (no hay llaves foráneas), pero
// va de lo más derivado a lo más básico.
const BORRAR = [
  ['ac_taller_respuestas', 'updated_at >= ?'],
  ['ac_taller_preguntas', 'created_at >= ?'],
  ['ac_taller_practicas', 'created_at >= ?'],
  ['ac_taller_sala', 'visto_at >= ?'],
  ['ac_taller_codigos_pc', '1 = 1'], // viven 5 minutos: se borran todos
  ['ac_taller_asistentes', 'created_at >= ?'],
  ['ac_taller_estado', 'updated_at >= ?'],
  ['ac_asistencia', 'created_at >= ?'],
  ['ac_progreso', 'vista_at >= ?'],
  ['ac_entregas', 'created_at >= ?'],
  ['ac_practicas', 'created_at >= ?'],
  ['ac_certificados', 'emitido_at >= ?'],
  // Lo que un certificado de prueba anotó en Talento humano, y nada más.
  ['th_formaciones', "created_at >= ? AND notas LIKE 'Certificado % de la academia de IA'"],
  ['bitacora', 'created_at >= ?'],
]

// Defensa contra un error al editar esta lista.
const INTOCABLES = new Set(['diagnostico_respuestas', 'taller_casos', 'ajustes', 'users', 'ac_inscripciones', 'ac_lecciones', 'ac_sesiones'])
for (const [t] of BORRAR) if (INTOCABLES.has(t)) throw new Error(`${t} no se borra nunca`)

const db = createClient({ url, authToken })
const argsDe = (cond) => (cond.includes('?') ? [desde] : [])

const existentes = new Set((await db.execute("SELECT name FROM sqlite_master WHERE type = 'table'")).rows.map((r) => String(r.name)))
const plan = []
for (const [tabla, cond] of BORRAR) {
  if (!existentes.has(tabla)) continue
  const r = await db.execute({ sql: `SELECT COUNT(*) AS n FROM ${tabla} WHERE ${cond}`, args: argsDe(cond) })
  plan.push({ tabla, cond, n: Number(r.rows[0].n) })
}

const base = url.replace(/^libsql:\/\//, '').split('.')[0]
console.log(`Base: ${base}`)
console.log(`Desde: ${dia} 00:00 (Bogotá)\n`)
for (const p of plan) console.log(`  ${p.tabla.padEnd(22)} ${String(p.n).padStart(6)}`)
const encuesta = existentes.has('diagnostico_respuestas') ? Number((await db.execute('SELECT COUNT(*) AS n FROM diagnostico_respuestas')).rows[0].n) : 0
console.log(`\nSe conservan intactas: ${encuesta} respuestas de la encuesta de /ia (y los casos subidos).`)

const total = plan.reduce((s, p) => s + p.n, 0)
if (!borrar) {
  console.log(`\nSimulacro: se borrarían ${total} filas. Para borrarlas, repita con --borrar.`)
  process.exit(0)
}
if (!total) {
  console.log('\nNo hay nada que borrar.')
  process.exit(0)
}
await db.batch(plan.filter((p) => p.n).map((p) => ({ sql: `DELETE FROM ${p.tabla} WHERE ${p.cond}`, args: argsDe(p.cond) })), 'write')
console.log(`\nBorradas ${total} filas.`)
