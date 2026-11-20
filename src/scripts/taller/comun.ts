/**
 * Piezas compartidas por el proyector, la vista de presentador y la sala.
 */

export interface EscenaCliente {
  id: string
  tipo: string
  pasos: number
  minutos: number
  bloque: string
  interaccion: string
  demo: string
  oscura: boolean
}

export interface DatosTaller {
  n: number
  admin: boolean
  /** PC vinculado (/pc): la presentación sigue la escena de quien dicta. */
  seguir?: boolean
  bloques: { id: string; titulo: string; minutos: number }[]
  escenas: EscenaCliente[]
  demos: { id: string; versiones: { id: string; parte: string; respaldo: string }[] }[]
  evaluacion: { pre: string; post: string } | null
}

export function leerDatos<T = DatosTaller>(id = 'tl-datos'): T | null {
  const el = document.getElementById(id)
  if (!el?.textContent) return null
  try {
    return JSON.parse(el.textContent) as T
  } catch {
    return null
  }
}

const API = '/api/academia/taller'
/** La sala del celular, pública y sin cuenta. */
export const API_SALA = '/api/academia/sala'
/** El PC vinculado con el código del celular. */
export const API_PC = '/api/academia/pc'

export async function consultar<T = any>(params: Record<string, string | number>, api = API): Promise<T> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))
  const r = await fetch(`${api}?${qs}`, { headers: { accept: 'application/json' } })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j?.error || `Error ${r.status}`)
  return j as T
}

export async function enviar<T = any>(cuerpo: Record<string, unknown>, ms = 15_000, api = API): Promise<T> {
  const ctl = new AbortController()
  const reloj = setTimeout(() => ctl.abort(), ms)
  try {
    const r = await fetch(api, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo), signal: ctl.signal })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j?.error || `Error ${r.status}`)
    return j as T
  } finally {
    clearTimeout(reloj)
  }
}

/** Mensajes entre la ventana del proyector y la del presentador (mismo equipo). */
export type Mensaje =
  | { tipo: 'ir'; i: number; paso: number }
  | { tipo: 'hola' }
  | { tipo: 'accion'; nombre: 'pedir' | 'generar' }

/**
 * Aviso "Empezamos en 00:00". Lo pone quien dicta y viaja por el servidor, así
 * que lo ven el proyector, los PC vinculados y los celulares aunque estén en
 * equipos distintos. El servidor manda cuánto falta (no la hora de fin)
 * porque el reloj de cada equipo es distinto.
 */
export interface AvisoRed {
  id: number
  resta: number
  ms: number
}
/** El aviso en el reloj de este equipo. */
export interface Aviso {
  id: number
  fin: number
  ms: number
}

/** Si es el mismo aviso que ya se tenía, conserva su fin: así la latencia de cada consulta no hace saltar el reloj. */
export function avisoLocal(r: AvisoRed | null | undefined, actual: Aviso | null): Aviso | null {
  if (!r) return null
  if (actual && actual.id === r.id) return actual
  return { id: r.id, fin: Date.now() + r.resta, ms: r.ms }
}

/** Segundos que faltan, el texto MM:SS y la fracción que queda (1 al lanzarlo, 0 en cero). */
export function cuentaAviso(a: Aviso, ref = Date.now()): { resta: number; texto: string; queda: number } {
  const resta = Math.max(0, Math.ceil((a.fin - ref) / 1000))
  const texto = `${String(Math.floor(resta / 60)).padStart(2, '0')}:${String(resta % 60).padStart(2, '0')}`
  return { resta, texto, queda: Math.min(1, Math.max(0, (a.fin - ref) / a.ms)) }
}

export function canal(n: number, alRecibir: (m: Mensaje) => void): (m: Mensaje) => void {
  if (typeof BroadcastChannel === 'undefined') return () => {}
  const bc = new BroadcastChannel(`ekosolv-taller-${n}`)
  bc.onmessage = (ev) => alRecibir(ev.data as Mensaje)
  return (m) => bc.postMessage(m)
}

/** Teclas de avance y retroceso (flechas, clicker, barra espaciadora). */
export function direccionTecla(ev: KeyboardEvent): 1 | -1 | 0 {
  const t = ev.target as HTMLElement | null
  if (t && (t.closest('input, textarea, select, [contenteditable="true"]') || (ev.key === ' ' && t.closest('button, a')))) return 0
  if (ev.altKey || ev.ctrlKey || ev.metaKey) return 0
  if (['ArrowRight', 'PageDown', ' ', 'ArrowDown'].includes(ev.key)) return 1
  if (['ArrowLeft', 'PageUp', 'ArrowUp', 'Backspace'].includes(ev.key)) return -1
  return 0
}
