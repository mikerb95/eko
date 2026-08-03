/**
 * Perfiles sociales y enlaces de compartir.
 * Fase 0 de docs/plan-redes-sociales.md.
 *
 * ── POR QUÉ ESTE ARCHIVO TIENE GUARDA ───────────────────────────────────
 * Misma razón que `credenciales.ts`: un enlace a un perfil que no existe, o
 * que apunta a una cuenta abandonada, hace más daño que no tener el enlace.
 * Aquí NADA sale a producción hasta que alguien verifique la URL y ponga
 * `activo: true`.
 *
 * En local (`import.meta.env.DEV`) los pendientes se ven atenuados y sin
 * enlace, igual que los enlaces legales del footer.
 * ────────────────────────────────────────────────────────────────────────
 *
 * Este módulo es solo presencia y compartir: no habla con ninguna API. La
 * publicación hacia las redes vía Zoho Social es la Fase 1 y vivirá en
 * `src/lib/social.ts`.
 */

import { SITE_NAME, url as siteUrl } from './site'

export type Red = 'linkedin' | 'instagram' | 'facebook'

export interface Perfil {
  red: Red
  /** Nombre visible: "LinkedIn" */
  label: string
  /** Handle sin arroba, para mostrar. Vacío mientras no se confirme. */
  handle: string
  /** URL completa del perfil. Vacía = aún no existe o no se ha verificado. */
  url: string
  /** ⚠️ Solo `true` cuando la URL abre el perfil real de Ekosolv. */
  activo: boolean
}

// ── PENDIENTES — VERIFICAR Y ACTIVAR ────────────────────────────────────
// Para activar cada uno: abrir la URL, confirmar que es la cuenta oficial de
// Ekosolv S.A.S., pegarla aquí y poner `activo: true`.
//
// Ojo con Instagram: además de existir, la cuenta debe ser Business o Creator
// y estar vinculada a la página de Facebook, o la Fase 1 no podrá publicar en
// ella (ver §3.2 del plan). Eso no afecta a este archivo, pero es el momento
// de revisarlo.

export const perfiles: Perfil[] = [
  {
    red: 'linkedin',
    label: 'LinkedIn',
    handle: '',
    url: '', // https://www.linkedin.com/company/…  (página de empresa, no perfil personal)
    activo: false,
  },
  {
    red: 'instagram',
    label: 'Instagram',
    handle: '',
    url: '', // https://www.instagram.com/…
    activo: false,
  },
  {
    red: 'facebook',
    label: 'Facebook',
    handle: '',
    url: '', // https://www.facebook.com/…  (página, no perfil)
    activo: false,
  },
]

// ── SELECTORES ──────────────────────────────────────────────────────────
// Los componentes SIEMPRE consumen estas funciones, nunca el array crudo.

/** Muestra los pendientes solo en desarrollo local. */
export const mostrarPendientes = import.meta.env.DEV

/** Perfiles publicables: activos y con URL de verdad. */
export const perfilesVisibles = (): Perfil[] =>
  perfiles.filter((p) => p.activo && p.url)

/** ¿Hay al menos un perfil real? Sirve para omitir el bloque entero. */
export const hayPerfiles = (): boolean => perfilesVisibles().length > 0

/** Lo que el footer debe pintar: reales, y en local también los pendientes. */
export const perfilesFooter = (): Perfil[] =>
  mostrarPendientes ? perfiles : perfilesVisibles()

// ── COMPARTIR ───────────────────────────────────────────────────────────
// Endpoints públicos de cada red. No necesitan API, token ni JavaScript: son
// enlaces con el link de la página. Instagram no tiene equivalente web para
// compartir desde el navegador, así que no aparece aquí a propósito.

/**
 * Enlaces de compartir para una ruta del sitio.
 *
 * @param path  Ruta interna ("/blog/mi-articulo"). Se convierte a URL absoluta
 *              con `site.ts`, que es lo único que las redes aceptan.
 * @param title Título de la página, para el asunto del correo y WhatsApp.
 */
export function enlacesCompartir(path: string, title: string) {
  const u = encodeURIComponent(siteUrl(path))
  const t = encodeURIComponent(title)
  const asunto = encodeURIComponent(`${title} — ${SITE_NAME}`)
  const cuerpo = encodeURIComponent(`${title}\n\n${siteUrl(path)}`)

  return {
    /** URL canónica absoluta, la misma que se comparte. Para "copiar enlace". */
    url: siteUrl(path),
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    whatsapp: `https://wa.me/?text=${t}%20${u}`,
    correo: `mailto:?subject=${asunto}&body=${cuerpo}`,
  }
}
