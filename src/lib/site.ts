/**
 * Identidad y dominio del sitio, en un solo lugar.
 *
 * El sitio vive en ekosolv.codebymike.net, un subdominio de codebymike.net, y
 * no debe aparecer en buscadores (ver SITE_NOINDEX). Vive aquí y no repartido
 * por el código: cambiar de dominio debe ser editar una línea.
 *
 * Se puede sobreescribir sin tocar el código con la variable de entorno
 * PUBLIC_SITE_URL (útil para previews de Vercel).
 */

const FALLBACK_URL = 'https://ekosolv.codebymike.net'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (globalThis as any)?.process?.env?.[key] || ''
}

/** URL base sin barra final. */
export const SITE_URL = (env('PUBLIC_SITE_URL') || FALLBACK_URL).replace(/\/$/, '')

export const SITE_NAME = 'Ekosolv'
export const SITE_LEGAL_NAME = 'Ekosolv S.A.S.'
export const SITE_NIT = '900.659.506-9'

export const SITE_TAGLINE = {
  es: 'Consultoría ambiental especializada en cumplimiento ANLA, ESG y economía circular para el sector tecnológico en Colombia.',
  en: 'Environmental consulting specialized in ANLA compliance, ESG, and circular economy for the technology sector in Colombia.',
} as const

/**
 * Datos de contacto de la sede, en piezas separadas.
 *
 * `src/lib/legal.ts` tiene la misma dirección en una sola cadena, y esa se
 * queda como está: es el texto que se muestra dentro de un documento legal y
 * cambiarlo movería la versión de la política. Esta versión desarmada existe
 * porque el `PostalAddress` de schema.org exige cada campo por separado, y
 * partir la cadena con expresiones regulares en tiempo de render sería frágil.
 *
 * Si cambia la sede, hay que tocar los dos sitios.
 */
export const SITE_ADDRESS = {
  edificio: 'Edif. RPTV',
  calle: 'Carrera 15 #31B-33',
  ciudad: 'Bogotá',
  region: 'Bogotá D.C.',
  pais: 'CO',
  telefono: '+573212712773',
  correo: 'info@ekosolv.com',
} as const

export const url = (path = '/'): string =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

/**
 * Todo el sitio fuera de buscadores. Vive en un subdominio de codebymike.net
 * con la marca de un cliente y no debe competir con el sitio real de Ekosolv.
 * Lo usan los layouts (meta robots) y robots.txt; la cabecera X-Robots-Tag
 * está en astro.config.mjs. Si algún día se indexa, cambiar los dos sitios.
 */
export const SITE_NOINDEX = true
