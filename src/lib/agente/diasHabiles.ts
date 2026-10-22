/**
 * Días hábiles en Colombia, para calcular el vencimiento de los plazos que
 * fijan las autoridades ambientales.
 *
 * ── POR QUÉ ES CÓDIGO Y NO IA ───────────────────────────────────────────────
 * El plazo es el dato más delicado de una alerta: un día de error puede
 * significar responder un requerimiento fuera de término. La IA solo extrae
 * "15 días hábiles"; el conteo lo hace este módulo, que es determinista y tiene
 * pruebas contra el calendario oficial.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Reglas que implementa:
 * - Festivos fijos: 1 ene, 1 may, 20 jul, 7 ago, 8 dic, 25 dic.
 * - Festivos que se corren al lunes siguiente (Ley 51 de 1983, "Ley
 *   Emiliani"): Reyes, San José, San Pedro y San Pablo, Asunción, Día de la
 *   Raza, Todos los Santos e Independencia de Cartagena.
 * - Festivos que dependen de la Pascua: Jueves y Viernes Santo (no se corren),
 *   Ascensión, Corpus Christi y Sagrado Corazón (se corren al lunes).
 * - Sábados y domingos no son hábiles.
 * - Los términos empiezan a correr el día hábil siguiente a la notificación
 *   (CPACA), así que el día de la notificación no cuenta.
 *
 * Todas las fechas viajan como texto `AAAA-MM-DD`. Se trabaja en UTC solo para
 * hacer aritmética de días: nunca se mezcla con la hora local, que es donde
 * aparecen los errores de "un día menos" al cruzar la medianoche.
 */

/** Convierte `AAAA-MM-DD` en una fecha UTC a medianoche. */
function aFecha(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new Error(`Fecha inválida: ${iso}`)
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
}

function aIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function masDias(d: Date, n: number): Date {
  const r = new Date(d)
  r.setUTCDate(r.getUTCDate() + n)
  return r
}

/** Si la fecha no cae en lunes, la corre al lunes siguiente. */
function alLunes(d: Date): Date {
  const dia = d.getUTCDay() // 0 = domingo, 1 = lunes
  if (dia === 1) return d
  return masDias(d, (8 - dia) % 7)
}

/** Domingo de Pascua (algoritmo anónimo gregoriano, Meeus/Jones/Butcher). */
export function domingoDePascua(anio: number): string {
  const a = anio % 19
  const b = Math.floor(anio / 100)
  const c = anio % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return aIso(new Date(Date.UTC(anio, mes - 1, dia)))
}

const cache = new Map<number, Set<string>>()

/** Festivos de un año, como conjunto de `AAAA-MM-DD`. */
export function festivosColombia(anio: number): Set<string> {
  const guardado = cache.get(anio)
  if (guardado) return guardado

  const f = (mes: number, dia: number) => new Date(Date.UTC(anio, mes - 1, dia))
  const pascua = aFecha(domingoDePascua(anio))

  const fechas: Date[] = [
    // Fijos
    f(1, 1),
    f(5, 1),
    f(7, 20),
    f(8, 7),
    f(12, 8),
    f(12, 25),
    // Ley Emiliani: se corren al lunes
    alLunes(f(1, 6)),
    alLunes(f(3, 19)),
    alLunes(f(6, 29)),
    alLunes(f(8, 15)),
    alLunes(f(10, 12)),
    alLunes(f(11, 1)),
    alLunes(f(11, 11)),
    // Semana Santa: no se corren
    masDias(pascua, -3),
    masDias(pascua, -2),
    // Dependientes de la Pascua que sí se corren
    alLunes(masDias(pascua, 39)), // Ascensión
    alLunes(masDias(pascua, 60)), // Corpus Christi
    alLunes(masDias(pascua, 68)), // Sagrado Corazón
  ]

  const set = new Set(fechas.map(aIso))
  cache.set(anio, set)
  return set
}

export function esHabil(iso: string): boolean {
  const d = aFecha(iso)
  const dia = d.getUTCDay()
  if (dia === 0 || dia === 6) return false
  return !festivosColombia(d.getUTCFullYear()).has(iso)
}

/**
 * Último día de un plazo de `n` días hábiles contados desde una notificación.
 * El día de la notificación no cuenta: el primer día del término es el hábil
 * siguiente.
 */
export function venceDiasHabiles(fechaNotificacion: string, n: number): string {
  if (!Number.isInteger(n) || n < 1) throw new Error(`Plazo inválido: ${n}`)
  let d = aFecha(fechaNotificacion)
  let contados = 0
  while (contados < n) {
    d = masDias(d, 1)
    if (esHabil(aIso(d))) contados++
  }
  return aIso(d)
}

/**
 * Último día de un plazo en días calendario. Si cae en día no hábil, se corre
 * al siguiente hábil, que es como lo aplican las autoridades.
 */
export function venceDiasCalendario(fechaNotificacion: string, n: number): string {
  if (!Number.isInteger(n) || n < 1) throw new Error(`Plazo inválido: ${n}`)
  let d = masDias(aFecha(fechaNotificacion), n)
  while (!esHabil(aIso(d))) d = masDias(d, 1)
  return aIso(d)
}

/**
 * Días hábiles que quedan entre hoy y el vencimiento, contando el día del
 * vencimiento y sin contar hoy. 0 significa que vence hoy; negativo, vencido.
 */
export function habilesRestantes(hoy: string, vence: string): number {
  if (vence === hoy) return 0
  const desde = aFecha(hoy)
  const hasta = aFecha(vence)
  const signo = hasta > desde ? 1 : -1
  let d = desde
  let n = 0
  while (aIso(d) !== vence) {
    d = masDias(d, signo)
    if (esHabil(aIso(d))) n += signo
  }
  return n
}

/** Fecha de hoy en Bogotá, como `AAAA-MM-DD`. */
export function hoyEnBogota(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora)
}
