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
  /** Vista previa del control remoto: no guarda, no oye teclas ni el canal, solo obedece a postMessage. */
  vista?: boolean
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
  | { tipo: 'accion'; nombre: 'pedir' | 'generar'; id?: string }

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

/** Lo que devuelve GET ?que=estado: dónde va la presentación según el servidor. */
export interface EstadoRed {
  escena: string
  paso: number
  mov: number
  /** Cuánto lleva la escena actual (ms, reloj del servidor); null si no se sabe. */
  enEscena: number | null
  orden: { id: string; nombre: string } | null
  aviso: AvisoRed | null
}

/** Tras un movimiento propio, el servidor puede traer todavía uno anterior: durante este tiempo no se le hace caso. */
const QUIETO_MS = 2000

/**
 * Proyector y presentador en equipos distintos: el canal local no llega, así
 * que cada ventana pregunta al servidor cada segundo dónde va la presentación
 * y se mueve ahí si lo cambió la otra. En el mismo equipo sigue mandando el
 * canal (es instantáneo) y esto solo confirma lo mismo.
 *
 * - `local()`: avisar de cada movimiento hecho aquí o recibido por el canal.
 * - `guardado(mov)`: la marca que devolvió el servidor al guardar el propio.
 * - `orden(id)`: un botón del presentador que ya se atendió por el canal.
 * El primer botón que se lee al abrir solo sirve de punto de partida: no se repite.
 */
export function seguirRed(
  n: number,
  op: { ids: string[]; alMover: (k: number, paso: number) => void; alOrden?: (nombre: string) => void; alAviso?: (a: AvisoRed | null) => void; alTiempo?: (escena: string, enEscena: number | null) => void },
) {
  let visto = 0
  let ultimoLocal = 0
  let conBase = false
  const atendidas = new Set<string>()
  let ocupado = false

  const mirar = async () => {
    if (ocupado) return
    ocupado = true
    const pedido = Date.now()
    try {
      const r = await consultar<EstadoRed>({ que: 'estado', n })
      op.alAviso?.(r.aviso)
      op.alTiempo?.(r.escena, r.enEscena)
      if (r.orden && !atendidas.has(r.orden.id)) {
        atendidas.add(r.orden.id)
        if (conBase) op.alOrden?.(r.orden.nombre)
      }
      conBase = true
      if (r.mov <= visto || pedido < ultimoLocal + QUIETO_MS) return
      visto = r.mov
      const k = op.ids.indexOf(r.escena)
      if (k >= 0) op.alMover(k, r.paso)
    } catch (e) {
      console.error('[taller] seguir red', e)
    } finally {
      ocupado = false
    }
  }

  void mirar()
  setInterval(mirar, 1000)
  document.addEventListener('visibilitychange', () => void mirar())

  return {
    local: () => void (ultimoLocal = Date.now()),
    guardado: (mov: unknown) => void (visto = Math.max(visto, Number(mov) || 0)),
    orden: (id: string) => void atendidas.add(id),
  }
}

/** Identificador de un botón del presentador (para no atenderlo dos veces). */
export const idOrden = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

/** Teclas de avance y retroceso (flechas, clicker, barra espaciadora). */
export function direccionTecla(ev: KeyboardEvent): 1 | -1 | 0 {
  const t = ev.target as HTMLElement | null
  if (t && (t.closest('input, textarea, select, [contenteditable="true"]') || (ev.key === ' ' && t.closest('button, a')))) return 0
  if (ev.altKey || ev.ctrlKey || ev.metaKey) return 0
  if (['ArrowRight', 'PageDown', ' ', 'ArrowDown'].includes(ev.key)) return 1
  if (['ArrowLeft', 'PageUp', 'ArrowUp', 'Backspace'].includes(ev.key)) return -1
  return 0
}

/**
 * Evita que el equipo entre en reposo o apague la pantalla mientras la
 * página está abierta (Screen Wake Lock). El navegador suelta el bloqueo
 * cuando la pestaña queda oculta, así que se vuelve a pedir al regresar.
 * Si el navegador no lo soporta (o no es HTTPS), no pasa nada.
 */
export function mantenerDespierto() {
  const wl = (navigator as Navigator & { wakeLock?: { request(tipo: 'screen'): Promise<{ released: boolean }> } }).wakeLock
  if (!wl) return
  let bloqueo: { released: boolean } | null = null
  const pedir = async () => {
    if (document.hidden || (bloqueo && !bloqueo.released)) return
    try {
      bloqueo = await wl.request('screen')
    } catch (e) {
      console.error('[taller] wake lock', e)
    }
  }
  void pedir()
  document.addEventListener('visibilitychange', () => void pedir())
}
