/**
 * Inventario de las páginas públicas del sitio.
 *
 * Fuente única para `llms.txt`, `llms-full.txt`, el sitemap y —desde la
 * auditoría SEO— el `<title>` y la `<meta name="description">` de cada página.
 * Antes esos archivos se generaban desde la API de la plantilla de Storyblok,
 * así que anunciaban a los motores de IA tres reportes de la plantilla —con
 * autores inventados— y no listaban ni una sola página real del sitio.
 *
 * Al añadir una página nueva, añadirla aquí.
 */

import { FOUNDED_YEAR, tonnesManaged } from './brand'

export interface Ruta {
  path: string
  titulo: string
  descripcion: string
  /**
   * `<title>` y `<meta name="description">` de la página.
   *
   * Están aquí, y no en cada `.astro`, porque cuando cada página traía los
   * suyos el resultado fue el previsible: doce de veinticuatro páginas
   * compartían la misma descripción por defecto (incluidas /contacto y
   * /servicios, las de conversión) y cuatro firmaban el título como «Eko» en
   * vez de «Ekosolv». Google descarta las descripciones duplicadas y reescribe
   * el snippet por su cuenta, así que se perdía el control del mensaje justo
   * donde más importa.
   *
   * Los layouts lo leen por `path`. Una página solo pasa `title` o
   * `description` cuando el texto no se puede saber de antemano, que hoy es
   * únicamente el caso de los artículos del blog.
   *
   * Longitudes objetivo: título hasta ~60 caracteres, descripción entre 140 y
   * 160. Más allá de eso Google trunca en el resultado de búsqueda.
   *
   * Los dos campos anteriores siguen siendo los de `llms.txt`, que pide
   * descripciones cortas de una línea. No son lo mismo y no conviene fundirlos.
   */
  seo: { titulo: string; descripcion: string }
}

export const rutasEs: Ruta[] = [
  {
    path: '/',
    titulo: 'Inicio',
    descripcion: 'Cumplimiento ANLA, ESG y economía circular para el sector tecnológico.',
    seo: {
      titulo: 'Ekosolv — Consultoría ambiental ANLA, ESG y economía circular',
      descripcion: `Consultoría ambiental para importadores y productores de tecnología en Colombia: licenciamiento ANLA, planes posconsumo, RAEE y estrategia ESG desde ${FOUNDED_YEAR}.`,
    },
  },
  {
    path: '/servicios',
    titulo: 'Servicios',
    descripcion: 'Las cuatro líneas de servicio de Ekosolv.',
    seo: {
      titulo: 'Servicios de consultoría ambiental y gestión RAEE · Ekosolv',
      descripcion: 'Cuatro líneas integradas: cumplimiento normativo ante la ANLA, gestión de RAEE, operación de sistemas posconsumo y comercialización de activos IT.',
    },
  },
  {
    path: '/ekonsulting',
    titulo: 'EKONSULTING',
    descripcion: 'Asesoría y cumplimiento normativo ante la ANLA: licenciamiento, auditorías, planes posconsumo y procesos sancionatorios.',
    seo: {
      titulo: 'EKONSULTING — Asesoría y cumplimiento ANLA · Ekosolv',
      descripcion: 'Asesoría y aplicación de estrategias para el cumplimiento ambiental normativo. Licenciamiento, planes posconsumo y estrategia ESG ante la ANLA.',
    },
  },
  {
    path: '/ekoraee',
    titulo: 'EKORAEE',
    descripcion: 'Recolección, transporte, almacenamiento y certificación de residuos de aparatos eléctricos y electrónicos (RAEE).',
    seo: {
      titulo: 'EKORAEE — Gestión de residuos electrónicos · Ekosolv',
      descripcion: `Recolección, transporte, almacenamiento y certificación de RAEE conforme a la normativa ambiental. ${tonnesManaged('es')} toneladas gestionadas desde ${FOUNDED_YEAR}.`,
    },
  },
  {
    path: '/ekopartner',
    titulo: 'EKOPARTNER',
    descripcion: 'Operación de sistemas colectivos e individuales de recolección y gestión posconsumo.',
    seo: {
      titulo: 'EKOPARTNER — Gestión de sistemas posconsumo · Ekosolv',
      descripcion: 'Operamos sistemas colectivos e individuales de recolección y gestión posconsumo de envases, empaques y RAEE, autorizados por la ANLA. Aplica solo en Colombia.',
    },
  },
  {
    path: '/ekotrading',
    titulo: 'EKOTRADING',
    descripcion: 'Compra y venta de tecnología usada u obsoleta en escala, dentro de un marco de economía circular.',
    seo: {
      titulo: 'EKOTRADING — Economía circular y activos IT · Ekosolv',
      descripcion: 'Gestión de lotes masivos de hardware tecnológico: compra y venta de electrónica nueva, seminueva y renovada dentro de un marco de economía circular.',
    },
  },
  {
    path: '/normativas',
    titulo: 'Normativas',
    descripcion: 'Marco normativo ambiental colombiano vigente que auditamos.',
    seo: {
      titulo: 'Normativa ambiental colombiana vigente · Ekosolv',
      descripcion: 'El marco normativo ambiental que le aplica a su empresa en Colombia: resoluciones de posconsumo, RAEE, envases y empaques, con lo que exige cada una.',
    },
  },
  {
    path: '/casos',
    titulo: 'Casos',
    descripcion: 'Cómo trabajamos, caso por caso.',
    seo: {
      titulo: 'Casos de cumplimiento ambiental empresarial · Ekosolv',
      descripcion: 'Cómo trabajamos, caso por caso: diagnósticos, radicaciones ante la ANLA, planes posconsumo y operaciones de recolección de RAEE en empresas colombianas.',
    },
  },
  {
    path: '/licencias',
    titulo: 'Licencias y autorizaciones',
    descripcion: 'Licencias, registros y autorizaciones con número de resolución, entidad y vigencia.',
    seo: {
      titulo: 'Licencias y autorizaciones ambientales · Ekosolv',
      descripcion: 'Licencias ambientales, registros y autorizaciones vigentes de Ekosolv S.A.S., con número de resolución, entidad expedidora y vigencia.',
    },
  },
  {
    path: '/quienes-somos',
    titulo: 'Quiénes somos',
    descripcion: 'Equipo, trayectoria desde 2013, hitos y aliados institucionales.',
    seo: {
      titulo: `Quiénes somos — Consultores ambientales desde ${FOUNDED_YEAR} · Ekosolv`,
      descripcion: `Equipo de consultores ambientales en Bogotá con trayectoria desde ${FOUNDED_YEAR}. Hitos, aliados institucionales y la forma en que acompañamos a cada cliente.`,
    },
  },
  {
    path: '/agenda-una-recoleccion',
    titulo: 'Agenda una recolección',
    descripcion: 'Programa el retiro de equipos obsoletos con transporte certificado y certificado de disposición final.',
    seo: {
      titulo: 'Agenda una recolección de residuos electrónicos · Ekosolv',
      descripcion: 'Formulario de recolección de residuos electrónicos (RAEE). Programa el retiro de tus equipos obsoletos con transporte certificado y certificado de disposición final.',
    },
  },
  {
    path: '/blog',
    titulo: 'Diario',
    descripcion: 'Artículos sobre economía circular, normativa ambiental y sostenibilidad empresarial.',
    seo: {
      titulo: 'Diario de economía circular y normativa ambiental · Ekosolv',
      descripcion: 'Artículos sobre economía circular, normativa ambiental colombiana, gestión de RAEE y sostenibilidad empresarial, escritos por el equipo de Ekosolv.',
    },
  },
  {
    path: '/contacto',
    titulo: 'Contacto',
    descripcion: 'Agenda un diagnóstico de 45 minutos, sin costo y confidencial.',
    seo: {
      titulo: 'Contacto — Diagnóstico ambiental sin costo · Ekosolv',
      descripcion: 'Agenda un diagnóstico de 45 minutos, sin costo y confidencial, sobre la situación ambiental de tu empresa ante la ANLA. Bogotá D.C. y toda Colombia.',
    },
  },
  {
    path: '/politica-de-tratamiento-de-datos',
    titulo: 'Política de tratamiento de datos personales',
    descripcion: 'Finalidades, derechos del titular, canal de atención y transferencia internacional, conforme a la Ley 1581 de 2012.',
    seo: {
      titulo: 'Política de tratamiento de datos personales · Ekosolv',
      descripcion: 'Finalidades del tratamiento, derechos del titular, canal de atención y transferencia internacional de datos, conforme a la Ley 1581 de 2012 de Colombia.',
    },
  },
  {
    path: '/terminos-de-servicio',
    titulo: 'Términos de servicio',
    descripcion: 'Condiciones de uso del sitio y del canal de solicitudes de recolección y consultoría.',
    seo: {
      titulo: 'Términos de servicio · Ekosolv',
      descripcion: 'Condiciones de uso del sitio de Ekosolv S.A.S. y del canal de solicitudes de recolección de RAEE y de servicios de consultoría ambiental.',
    },
  },
  {
    path: '/politica-de-cookies',
    titulo: 'Política de cookies',
    descripcion: 'Inventario de cookies del sitio: solo una cookie técnica de sesión, sin analítica de terceros ni rastreo.',
    seo: {
      titulo: 'Política de cookies · Ekosolv',
      descripcion: 'Inventario completo de las cookies del sitio: una sola cookie técnica de sesión, sin analítica de terceros, sin publicidad y sin rastreo entre sitios.',
    },
  },
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
  return HREFLANG_PAIRS.find((p) => p.es === normalizar(path) || p.en === normalizar(path)) ?? null
}

export const rutasEn: Ruta[] = [
  {
    path: '/en',
    titulo: 'Home',
    descripcion: 'ANLA compliance, ESG, and circular economy for the technology sector.',
    seo: {
      titulo: 'Ekosolv — Environmental consulting, ANLA, ESG, circular economy',
      descripcion: `Environmental consulting for technology importers and producers in Colombia: ANLA licensing, post-consumer plans, WEEE, and ESG strategy since ${FOUNDED_YEAR}.`,
    },
  },
  {
    path: '/en/services',
    titulo: 'Services',
    descripcion: "Ekosolv's four service lines.",
    seo: {
      titulo: 'Environmental consulting and WEEE services · Ekosolv',
      descripcion: 'Four integrated lines: regulatory compliance before ANLA, WEEE management, operation of post-consumer systems, and IT asset trading in Colombia.',
    },
  },
  {
    path: '/en/ekonsulting',
    titulo: 'EKONSULTING',
    descripcion: 'Regulatory advisory and ANLA compliance: licensing, audits, post-consumer plans, and penalty proceedings.',
    seo: {
      titulo: 'EKONSULTING — ANLA advisory and compliance · Ekosolv',
      descripcion: 'Advisory and application of strategies for regulatory environmental compliance. Licensing, post-consumer plans, and ESG strategy before ANLA.',
    },
  },
  {
    path: '/en/ekoraee',
    titulo: 'EKORAEE',
    descripcion: 'Collection, transport, storage, and certification of waste electrical and electronic equipment (WEEE).',
    seo: {
      titulo: 'EKORAEE — Electronic waste management · Ekosolv',
      descripcion: `Collection, transport, storage, and WEEE certification under Colombian environmental regulations. ${tonnesManaged('en')} tonnes managed since ${FOUNDED_YEAR}.`,
    },
  },
  {
    path: '/en/ekopartner',
    titulo: 'EKOPARTNER',
    descripcion: 'Operation of collective and individual post-consumer collection and management systems.',
    seo: {
      titulo: 'EKOPARTNER — Post-consumer system management · Ekosolv',
      descripcion: 'We operate collective and individual collection and post-consumer management systems for packaging and WEEE, authorized by ANLA. Colombia only.',
    },
  },
  {
    path: '/en/ekotrading',
    titulo: 'EKOTRADING',
    descripcion: 'Buying and selling used or obsolete technology at scale within a circular economy framework.',
    seo: {
      titulo: 'EKOTRADING — Circular economy and IT assets · Ekosolv',
      descripcion: 'Management of bulk technology hardware lots: buying and selling of new, like-new, and refurbished electronics within a circular economy framework.',
    },
  },
  {
    path: '/en/regulations',
    titulo: 'Regulations',
    descripcion: 'The Colombian environmental regulatory framework we audit.',
    seo: {
      titulo: 'Colombian environmental regulations in force · Ekosolv',
      descripcion: 'The environmental regulatory framework that applies to your company in Colombia: post-consumer, WEEE, and packaging resolutions, and what each one requires.',
    },
  },
  {
    path: '/en/cases',
    titulo: 'Cases',
    descripcion: 'How we work, case by case.',
    seo: {
      titulo: 'Corporate environmental compliance cases · Ekosolv',
      descripcion: 'How we work, case by case: diagnostics, ANLA filings, post-consumer plans, and WEEE collection operations for companies operating in Colombia.',
    },
  },
  {
    path: '/en/licenses',
    titulo: 'Licences and authorisations',
    descripcion: 'Licences, registrations, and authorisations with resolution number, authority, and validity.',
    seo: {
      titulo: 'Environmental licences and authorisations · Ekosolv',
      descripcion: 'Environmental licences, registrations, and authorisations held by Ekosolv S.A.S., with resolution number, issuing authority, and validity.',
    },
  },
  {
    path: '/en/about',
    titulo: 'About',
    descripcion: 'Team, track record since 2013, milestones, and institutional partners.',
    seo: {
      titulo: `About us — Environmental consultants since ${FOUNDED_YEAR} · Ekosolv`,
      descripcion: `Team of environmental consultants based in Bogotá with a track record since ${FOUNDED_YEAR}. Milestones, institutional partners, and how we work with each client.`,
    },
  },
  {
    path: '/en/schedule-a-collection',
    titulo: 'Schedule a collection',
    descripcion: 'Arrange removal of obsolete equipment with certified transport and final disposal certificate.',
    seo: {
      titulo: 'Schedule an electronic waste (WEEE) collection · Ekosolv',
      descripcion: 'Electronic waste (WEEE) collection request form. Schedule the retrieval of your obsolete equipment with certified transport and final disposal certificate.',
    },
  },
  {
    path: '/en/blog',
    titulo: 'Journal',
    descripcion: 'Articles on circular economy, environmental regulation, and corporate sustainability.',
    seo: {
      titulo: 'Journal on circular economy and regulation · Ekosolv',
      descripcion: 'Articles on circular economy, Colombian environmental regulation, WEEE management, and corporate sustainability, written by the Ekosolv team.',
    },
  },
  {
    path: '/en/contact',
    titulo: 'Contact',
    descripcion: 'Book a 45-minute diagnostic, free and confidential.',
    seo: {
      titulo: 'Contact — Free environmental diagnostic · Ekosolv',
      descripcion: "Book a 45-minute diagnostic, free and confidential, on your company's environmental standing before ANLA. Bogotá D.C. and all of Colombia.",
    },
  },
  {
    path: '/en/data-processing-policy',
    titulo: 'Personal data processing policy',
    descripcion: 'Purposes, data subject rights, contact channel, and international transfer under Colombian Law 1581 of 2012.',
    seo: {
      titulo: 'Personal data processing policy · Ekosolv',
      descripcion: 'Processing purposes, data subject rights, contact channel, and international transfer of personal data under Colombian Law 1581 of 2012.',
    },
  },
  {
    path: '/en/terms-of-service',
    titulo: 'Terms of service',
    descripcion: 'Conditions of use for the site and for the collection and consulting request channel.',
    seo: {
      titulo: 'Terms of service · Ekosolv',
      descripcion: 'Conditions of use for the Ekosolv S.A.S. site and for the WEEE collection request channel and environmental consulting services.',
    },
  },
  {
    path: '/en/cookie-policy',
    titulo: 'Cookie policy',
    descripcion: 'Cookie inventory: one technical session cookie only, no third-party analytics and no tracking.',
    seo: {
      titulo: 'Cookie policy · Ekosolv',
      descripcion: 'Full inventory of the cookies used on this site: a single technical session cookie, no third-party analytics, no advertising, and no cross-site tracking.',
    },
  },
]

/** Quita la barra final para que '/servicios/' y '/servicios' se traten igual. */
function normalizar(path: string): string {
  return path !== '/' && path.length > 1 ? path.replace(/\/$/, '') : path
}

/**
 * `<title>` y `<meta name="description">` de una ruta, o null si la ruta no
 * está en el inventario (artículos del blog y páginas internas). Los layouts
 * caen en su texto por defecto cuando esto devuelve null.
 */
export function seoDe(path: string): { titulo: string; descripcion: string } | null {
  const norm = normalizar(path)
  return [...rutasEs, ...rutasEn].find((r) => r.path === norm)?.seo ?? null
}
