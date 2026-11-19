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
