/**
 * Reglas de las capacitaciones presentadas desde el sitio. Módulo PURO (lo
 * usan la API, las páginas, el navegador y las pruebas).
 */
import type { Escena, Interaccion, Pregunta, Taller } from './tipos.ts'

// ---------- Interacciones y votos ----------

export function interaccionDe(t: Taller, id: string): Interaccion | null {
  return t.interacciones.find((i) => i.id === id) ?? null
}

/** Lo que recibe el celular: sin la respuesta correcta ni la explicación. */
export function interaccionPublica(i: Interaccion): Interaccion {
  return {
    id: i.id,
    tipo: i.tipo,
    titulo: i.titulo,
    preguntas: i.preguntas.map((p) => ({ id: p.id, enunciado: p.enunciado, opciones: p.opciones })),
  }
}

/**
 * Un voto vale si la interacción es la que está abierta en ese momento, la
 * pregunta es de esa interacción y el valor es una de sus opciones.
 */
/** Preguntas que una persona le puede enviar a quien dicta en un mismo día. */
export const PREGUNTAS_DIA = 20
export const MAX_PREGUNTA = 400

/** Limpia la pregunta que llega del celular; null si está vacía o es muy larga. */
export function validarPregunta(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.replace(/\s+/g, ' ').trim()
  return s.length >= 3 && s.length <= MAX_PREGUNTA ? s : null
}

export function votoValido(t: Taller, abierta: string, interaccion: unknown, pregunta: unknown, valor: unknown): boolean {
  if (typeof interaccion !== 'string' || interaccion !== abierta) return false
  const i = interaccionDe(t, interaccion)
  const p = i?.preguntas.find((x) => x.id === pregunta)
  return !!p && typeof valor === 'string' && p.opciones.some((o) => o.id === valor)
}

export interface FilaVoto {
  pregunta: string
  valor: string
  usuario_id: number
}

export interface Conteo {
  /** Personas distintas que respondieron al menos una pregunta. */
  personas: number
  preguntas: Record<string, { total: number; opciones: Record<string, number> }>
}

export function contarVotos(i: Interaccion, filas: FilaVoto[]): Conteo {
  const preguntas: Conteo['preguntas'] = {}
  for (const p of i.preguntas) {
    preguntas[p.id] = { total: 0, opciones: Object.fromEntries(p.opciones.map((o) => [o.id, 0])) }
  }
  const personas = new Set<number>()
  for (const f of filas) {
    const c = preguntas[f.pregunta]
    if (!c || !(f.valor in c.opciones)) continue
    c.opciones[f.valor]!++
    c.total++
    personas.add(f.usuario_id)
  }
  return { personas: personas.size, preguntas }
}

export interface Puntaje {
  personas: number
  /** Proporción de aciertos del grupo (0 a 1) sobre todas las respuestas. */
  aciertos: number
  porPregunta: { id: string; aciertos: number; total: number }[]
}

/** Aciertos de una evaluación. Solo cuentan las preguntas con respuesta correcta. */
export function puntaje(i: Interaccion, filas: FilaVoto[]): Puntaje {
  const conteo = contarVotos(i, filas)
  let buenas = 0
  let total = 0
  const porPregunta = i.preguntas
    .filter((p) => p.correcta)
    .map((p) => {
      const c = conteo.preguntas[p.id]!
      const ok = c.opciones[p.correcta!] ?? 0
      buenas += ok
      total += c.total
      return { id: p.id, aciertos: c.total ? ok / c.total : 0, total: c.total }
    })
  return { personas: conteo.personas, aciertos: total ? buenas / total : 0, porPregunta }
}

/**
 * Las preguntas de salida son las mismas de entrada: se emparejan por
 * posición para comparar pregunta a pregunta.
 */
export function compararEvaluacion(pre: Interaccion, post: Interaccion, filasPre: FilaVoto[], filasPost: FilaVoto[]) {
  const a = puntaje(pre, filasPre)
  const b = puntaje(post, filasPost)
  return {
    antes: a,
    despues: b,
    preguntas: pre.preguntas.filter((p) => p.correcta).map((p, k) => ({
      enunciado: p.enunciado,
      antes: a.porPregunta[k]?.aciertos ?? 0,
      despues: b.porPregunta[k]?.aciertos ?? 0,
    })),
  }
}

/** Preguntas de repaso tomadas de una capacitación anterior. */
export function preguntasDeRepaso(t: Taller, anterior: Taller | null): Pregunta[] {
  if (!t.repaso || !anterior) return []
  const i = interaccionDe(anterior, t.repaso.interaccion)
  if (!i) return []
  return t.repaso.preguntas.map((id) => i.preguntas.find((p) => p.id === id)).filter((p): p is Pregunta => !!p)
}

// ---------- Tiempos ----------

/** Minuto planeado en que empieza cada escena, desde el inicio de la sesión. */
export function inicioDeEscenas(escenas: Escena[]): number[] {
  let m = 0
  return escenas.map((e) => {
    const inicio = m
    m += e.minutos
    return inicio
  })
}

/** "1:05:09" o "4:09". */
export function reloj(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

// ---------- Interactivos de la capacitación 1 ----------

/**
 * Reparte la probabilidad según la temperatura: con T baja casi siempre gana
 * la opción más probable; con T alta se emparejan. p_i^(1/T), normalizado.
 */
export function aplicarTemperatura(probs: number[], t: number): number[] {
  const temp = Math.max(0.05, t)
  const pot = probs.map((p) => Math.pow(Math.max(p, 1e-9), 1 / temp))
  const suma = pot.reduce((a, b) => a + b, 0)
  return pot.map((p) => p / suma)
}

/** Índice elegido al azar con esas probabilidades. `azar` en [0, 1). */
export function muestrear(probs: number[], azar: number): number {
  let acc = 0
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i]!
    if (azar < acc) return i
  }
  return probs.length - 1
}

/** Palabras cortas y comunes que un tokenizador suele dejar enteras. */
const ENTERAS = new Set(
  'el la los las de del a al en y o que para por con se su sus un una es lo como más pero este esta auto ley decreto artículo plazo días'.split(' '),
)

/**
 * Partición en tokens APROXIMADA, solo para ilustrar en la capacitación: los
 * modelos reales usan un vocabulario aprendido. Palabras comunes enteras, las
 * largas en trozos de 3 a 5 letras, cifras en grupos de hasta 3 y cada signo
 * aparte. El espacio va pegado al inicio del token, como en los modelos reales.
 */
export function tokenizarAprox(texto: string): string[] {
  const out: string[] = []
  const re = /(\s*)([\p{L}]+|\d+|[^\s\p{L}\d])/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(texto))) {
    const esp = m[1] ? ' ' : ''
    const pal = m[2]!
    if (/^\d+$/.test(pal)) {
      for (let i = 0; i < pal.length; i += 3) out.push((i === 0 ? esp : '') + pal.slice(i, i + 3))
    } else if (/^\p{L}+$/u.test(pal) && pal.length > 6 && !ENTERAS.has(pal.toLowerCase())) {
      const trozos: string[] = []
      let resto = pal
      while (resto.length > 6) {
        const n = resto.length % 4 === 1 ? 3 : 4
        trozos.push(resto.slice(0, n))
        resto = resto.slice(n)
      }
      trozos.push(resto)
      trozos.forEach((t, i) => out.push((i === 0 ? esp : '') + t))
    } else {
      out.push(esp + pal)
    }
  }
  return out
}

// ---------- Registro en la sala (QR) ----------

/**
 * Primera letra de cada palabra en mayúscula y el resto en minúscula:
 * "maría JOSÉ" → "María José". Respeta los espacios tal como vienen para no
 * mover el cursor mientras la persona escribe; registroSala los limpia.
 */
export function capitalizarNombre(s: string): string {
  return s.toLocaleLowerCase('es-CO').replace(/(^|[\s'-])(\p{L})/gu, (_, a: string, l: string) => a + l.toLocaleUpperCase('es-CO'))
}

const limpio = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

/** Clave para reconocer a la misma persona: sin tildes, minúsculas, espacios simples. */
export function claveNombre(nombreCompleto: string): string {
  return nombreCompleto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

export interface RegistroSala {
  nombre: string
  apellido: string
  cargo: string
  area: string
}

/** Valida lo que llega del formulario del celular. Devuelve los datos limpios o el error. */
export function registroSala(b: any, areas: readonly string[]): RegistroSala | { error: string } {
  const nombre = capitalizarNombre(limpio(b?.nombre, 60))
  const apellido = capitalizarNombre(limpio(b?.apellido, 60))
  const cargo = limpio(b?.cargo, 80)
  const area = String(b?.area ?? '')
  if (!nombre) return { error: 'Escriba su nombre.' }
  if (!apellido) return { error: 'Escriba su apellido.' }
  if (!cargo) return { error: 'Escriba su cargo.' }
  if (!areas.includes(area)) return { error: 'Elija su área.' }
  return { nombre, apellido, cargo, area }
}
