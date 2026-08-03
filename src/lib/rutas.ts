/**
 * Inventario de las páginas públicas del sitio.
 *
 * Fuente única para `llms.txt` y `llms-full.txt`. Antes esos archivos se
 * generaban desde la API de la plantilla de Storyblok, así que anunciaban a
 * los motores de IA tres reportes de la plantilla —con autores inventados—
 * y no listaban ni una sola página real del sitio.
 *
 * Al añadir una página nueva, añadirla aquí.
 */

export interface Ruta {
  path: string
  titulo: string
  descripcion: string
}

export const rutasEs: Ruta[] = [
  { path: '/', titulo: 'Inicio', descripcion: 'Cumplimiento ANLA, ESG y economía circular para el sector tecnológico.' },
  { path: '/servicios', titulo: 'Servicios', descripcion: 'Las cuatro líneas de servicio de Ekosolv.' },
  { path: '/ekonsulting', titulo: 'EKONSULTING', descripcion: 'Asesoría y cumplimiento normativo ante la ANLA: licenciamiento, auditorías, planes posconsumo y procesos sancionatorios.' },
  { path: '/ekoraee', titulo: 'EKORAEE', descripcion: 'Recolección, transporte, almacenamiento y certificación de residuos de aparatos eléctricos y electrónicos (RAEE).' },
  { path: '/ekopartner', titulo: 'EKOPARTNER', descripcion: 'Operación de sistemas colectivos e individuales de recolección y gestión posconsumo.' },
  { path: '/ekotrading', titulo: 'EKOTRADING', descripcion: 'Compra y venta de tecnología usada u obsoleta en escala, dentro de un marco de economía circular.' },
  { path: '/normativas', titulo: 'Normativas', descripcion: 'Marco normativo ambiental colombiano vigente que auditamos.' },
  { path: '/casos', titulo: 'Casos', descripcion: 'Cómo trabajamos, caso por caso.' },
  { path: '/licencias', titulo: 'Licencias y autorizaciones', descripcion: 'Licencias, registros y autorizaciones con número de resolución, entidad y vigencia.' },
  { path: '/quienes-somos', titulo: 'Quiénes somos', descripcion: 'Equipo, trayectoria desde 2013, hitos y aliados institucionales.' },
  { path: '/agenda-una-recoleccion', titulo: 'Agenda una recolección', descripcion: 'Programa el retiro de equipos obsoletos con transporte certificado y certificado de disposición final.' },
  { path: '/blog', titulo: 'Diario', descripcion: 'Artículos sobre economía circular, normativa ambiental y sostenibilidad empresarial.' },
  { path: '/contacto', titulo: 'Contacto', descripcion: 'Agenda un diagnóstico de 45 minutos, sin costo y confidencial.' },
  { path: '/politica-de-tratamiento-de-datos', titulo: 'Política de tratamiento de datos personales', descripcion: 'Finalidades, derechos del titular, canal de atención y transferencia internacional, conforme a la Ley 1581 de 2012.' },
  { path: '/terminos-de-servicio', titulo: 'Términos de servicio', descripcion: 'Condiciones de uso del sitio y del canal de solicitudes de recolección y consultoría.' },
  { path: '/politica-de-cookies', titulo: 'Política de cookies', descripcion: 'Inventario de cookies del sitio: solo una cookie técnica de sesión, sin analítica de terceros ni rastreo.' },
]

/*
 * `/docs`, `/docs/radar`, `/docs/kanban` y `/oportunidades2630` ya no están en
 * este inventario: son páginas internas detrás de sesión (src/middleware.ts).
 * Anunciarlas en el sitemap y en llms.txt solo mandaría a los buscadores a una
 * redirección al login.
 */

/**
 * Pares de rutas equivalentes es↔en, para emitir `hreflang` en las cabeceras.
 * `/oportunidades2630` existe solo en español, así que no tiene par: las
 * páginas sin equivalente simplemente no emiten alternates.
 */
export const HREFLANG_PAIRS: Array<{ es: string; en: string }> = [
  { es: '/', en: '/en' },
  { es: '/servicios', en: '/en/services' },
  { es: '/ekonsulting', en: '/en/ekonsulting' },
  { es: '/ekoraee', en: '/en/ekoraee' },
  { es: '/ekopartner', en: '/en/ekopartner' },
  { es: '/ekotrading', en: '/en/ekotrading' },
  { es: '/normativas', en: '/en/regulations' },
  { es: '/casos', en: '/en/cases' },
  { es: '/licencias', en: '/en/licenses' },
  { es: '/quienes-somos', en: '/en/about' },
  { es: '/agenda-una-recoleccion', en: '/en/schedule-a-collection' },
  { es: '/blog', en: '/en/blog' },
  { es: '/contacto', en: '/en/contact' },
  { es: '/politica-de-tratamiento-de-datos', en: '/en/data-processing-policy' },
  { es: '/terminos-de-servicio', en: '/en/terms-of-service' },
  { es: '/politica-de-cookies', en: '/en/cookie-policy' },
]

/** Devuelve las dos rutas equivalentes de una página, o null si no hay par. */
export function hreflangFor(path: string): { es: string; en: string } | null {
  const norm = path !== '/' && path.length > 1 ? path.replace(/\/$/, '') : path
  return HREFLANG_PAIRS.find((p) => p.es === norm || p.en === norm) ?? null
}

export const rutasEn: Ruta[] = [
  { path: '/en', titulo: 'Home', descripcion: 'ANLA compliance, ESG, and circular economy for the technology sector.' },
  { path: '/en/services', titulo: 'Services', descripcion: "Ekosolv's four service lines." },
  { path: '/en/ekonsulting', titulo: 'EKONSULTING', descripcion: 'Regulatory advisory and ANLA compliance: licensing, audits, post-consumer plans, and penalty proceedings.' },
  { path: '/en/ekoraee', titulo: 'EKORAEE', descripcion: 'Collection, transport, storage, and certification of waste electrical and electronic equipment (WEEE).' },
  { path: '/en/ekopartner', titulo: 'EKOPARTNER', descripcion: 'Operation of collective and individual post-consumer collection and management systems.' },
  { path: '/en/ekotrading', titulo: 'EKOTRADING', descripcion: 'Buying and selling used or obsolete technology at scale within a circular economy framework.' },
  { path: '/en/regulations', titulo: 'Regulations', descripcion: 'The Colombian environmental regulatory framework we audit.' },
  { path: '/en/cases', titulo: 'Cases', descripcion: 'How we work, case by case.' },
  { path: '/en/licenses', titulo: 'Licences and authorisations', descripcion: 'Licences, registrations, and authorisations with resolution number, authority, and validity.' },
  { path: '/en/about', titulo: 'About', descripcion: 'Team, track record since 2013, milestones, and institutional partners.' },
  { path: '/en/schedule-a-collection', titulo: 'Schedule a collection', descripcion: 'Arrange removal of obsolete equipment with certified transport and final disposal certificate.' },
  { path: '/en/blog', titulo: 'Journal', descripcion: 'Articles on circular economy, environmental regulation, and corporate sustainability.' },
  { path: '/en/contact', titulo: 'Contact', descripcion: 'Book a 45-minute diagnostic, free and confidential.' },
]
