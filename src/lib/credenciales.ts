/**
 * Credenciales de confianza: licencias, testimonios y clientes.
 * Fase 3 de docs/plan-competitivo-lito.md.
 *
 * ── POR QUÉ ESTE ARCHIVO TIENE GUARDAS ──────────────────────────────────
 * En la Fase 0 se retiraron seis logos de clientes inventados que llevaban
 * meses publicados. Para no repetirlo, aquí NADA se muestra en producción
 * hasta que alguien ponga explícitamente su bandera en `true`.
 *
 * Los placeholders de abajo son plantillas para rellenar, no contenido.
 * `import.meta.env.DEV` los hace visibles solo en local, con aviso.
 * ────────────────────────────────────────────────────────────────────────
 */

export interface Licencia {
  /** Nombre corto: "Licencia ambiental RAEE" */
  titulo: string
  /** Entidad que la expide: ANLA, CAR, Secretaría de Ambiente… */
  entidad: string
  /** Número de resolución o acto administrativo */
  resolucion: string
  /** Fecha de expedición, ISO (YYYY-MM-DD) */
  expedida: string
  /** Vigencia legible: "Indefinida", "Hasta 2028-03-14"… */
  vigencia: string
  /** Alcance en una línea */
  alcance: string
  /** Ruta al PDF en /public/docs/. Vacío = aún no cargado. */
  pdf: string
  /** ⚠️ Solo `true` cuando el documento existe y es publicable. */
  publicada: boolean
}

export interface Testimonio {
  quote: string
  autor: string
  cargo: string
  empresa: string
  /** ⚠️ Solo `true` con autorización escrita del cliente. */
  autorizado: boolean
}

export interface Cliente {
  nombre: string
  /** Ruta al logo en /public/images/clientes/. Vacío = se muestra el nombre. */
  logo: string
  /** ⚠️ Solo `true` con autorización escrita de uso de marca. */
  autorizado: boolean
}

// ── PLACEHOLDERS — RELLENAR Y ACTIVAR ───────────────────────────────────

export const licencias: Licencia[] = [
  {
    titulo: 'PENDIENTE — Licencia / autorización ambiental',
    entidad: 'PENDIENTE — ANLA / CAR / otra',
    resolucion: 'PENDIENTE — n.º de resolución',
    expedida: '',
    vigencia: 'PENDIENTE',
    alcance: 'PENDIENTE — qué habilita exactamente esta licencia.',
    pdf: '',
    publicada: false,
  },
  {
    titulo: 'PENDIENTE — Registro como gestor de RAEE',
    entidad: 'PENDIENTE',
    resolucion: 'PENDIENTE',
    expedida: '',
    vigencia: 'PENDIENTE',
    alcance: 'PENDIENTE',
    pdf: '',
    publicada: false,
  },
]

export const testimonios: Testimonio[] = [
  {
    quote: 'PENDIENTE — cita textual del cliente, tal como la autorizó.',
    autor: 'PENDIENTE — nombre',
    cargo: 'PENDIENTE — cargo',
    empresa: 'PENDIENTE — empresa',
    autorizado: false,
  },
  {
    quote: 'PENDIENTE — segunda cita.',
    autor: 'PENDIENTE',
    cargo: 'PENDIENTE',
    empresa: 'PENDIENTE',
    autorizado: false,
  },
  {
    quote: 'PENDIENTE — tercera cita.',
    autor: 'PENDIENTE',
    cargo: 'PENDIENTE',
    empresa: 'PENDIENTE',
    autorizado: false,
  },
]

export const clientes: Cliente[] = [
  { nombre: 'PENDIENTE — cliente 1', logo: '', autorizado: false },
  { nombre: 'PENDIENTE — cliente 2', logo: '', autorizado: false },
  { nombre: 'PENDIENTE — cliente 3', logo: '', autorizado: false },
  { nombre: 'PENDIENTE — cliente 4', logo: '', autorizado: false },
  { nombre: 'PENDIENTE — cliente 5', logo: '', autorizado: false },
  { nombre: 'PENDIENTE — cliente 6', logo: '', autorizado: false },
]

// ── VÍDEO CORPORATIVO (Fase 4) ──────────────────────────────────────────

export interface Video {
  /** 'youtube' | 'vimeo' | 'file' (mp4 propio en /public/video/) */
  proveedor: 'youtube' | 'vimeo' | 'file'
  /** ID de YouTube/Vimeo, o ruta al archivo si proveedor === 'file' */
  id: string
  /** Imagen de portada en /public/images/. Obligatoria: es lo que se ve antes del clic. */
  poster: string
  /** Título accesible del reproductor */
  titulo: string
  /** Duración legible: "1:24" */
  duracion: string
  /** Transcripción en texto. Suma SEO y accesibilidad; se vuelca a llms.txt. */
  transcripcion: string
  /** ⚠️ Solo `true` cuando el vídeo y su póster existen de verdad. */
  publicado: boolean
}

export const videoEs: Video = {
  proveedor: 'youtube',
  id: '',
  poster: '',
  titulo: 'PENDIENTE — título del vídeo corporativo',
  duracion: '—',
  transcripcion: 'PENDIENTE — transcripción completa del audio.',
  publicado: false,
}

export const videoEn: Video = {
  proveedor: 'youtube',
  id: '',
  poster: '',
  titulo: 'PENDING — corporate video title',
  duracion: '—',
  transcripcion: 'PENDING — full transcript of the audio.',
  publicado: false,
}

export const videoVisible = (lang: 'es' | 'en' = 'es'): Video | null => {
  const v = lang === 'en' ? videoEn : videoEs
  if (v.publicado) return v
  return mostrarPlaceholders ? v : null
}

// ── SELECTORES ──────────────────────────────────────────────────────────
// Las páginas SIEMPRE deben consumir estas funciones, nunca los arrays
// crudos: son las que garantizan que un placeholder no llegue a producción.

/** Muestra placeholders solo en desarrollo local. */
export const mostrarPlaceholders = import.meta.env.DEV

export const licenciasVisibles = (): Licencia[] =>
  mostrarPlaceholders ? licencias : licencias.filter((l) => l.publicada)

export const testimoniosVisibles = (): Testimonio[] =>
  mostrarPlaceholders ? testimonios : testimonios.filter((t) => t.autorizado)

export const clientesVisibles = (): Cliente[] =>
  mostrarPlaceholders ? clientes : clientes.filter((c) => c.autorizado)

/** ¿Hay algo real publicable? Sirve para omitir secciones enteras. */
export const hayLicencias = () => licencias.some((l) => l.publicada)
export const hayTestimonios = () => testimonios.some((t) => t.autorizado)
export const hayClientes = () => clientes.some((c) => c.autorizado)
