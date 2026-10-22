// Información pública que el asesor puede usar. Se arma con código desde las
// mismas fuentes que pinta el sitio (líneas de servicio, normativas, relación
// perfil-norma del hero, rutas, datos de contacto), nunca a mano en el prompt:
// si alguien cambia un texto de la página, el asesor lo dice igual.
//
// Lo que no está publicado o está pendiente de validar con Ekosolv no entra:
// la tasa de aprobación y "cero sanciones" del bloque de cifras de la portada
// (pregunta abierta 1.b), los casos (todos en verificado:false) y cualquier
// precio, porque Ekosolv no publica tarifas.
//
// Módulo PURO.

import normativasEs from '../../data/normativas.json' with { type: 'json' }
import normativasEn from '../../data/normativas.en.json' with { type: 'json' }
import { FORMA_DE_TRABAJO, LINEAS } from '../../data/servicios.ts'
import { FOUNDED_YEAR, tonnesManaged } from '../brand.ts'
import { normasDe, PERFILES, type Perfil } from '../exigencias.ts'
import { rutasEn, rutasEs } from '../rutas.ts'
import { SITE_ADDRESS, SITE_LEGAL_NAME, SITE_TAGLINE } from '../site.ts'

export type Locale = 'es' | 'en'

type Norma = { code: string; title: string; body: string; ref?: string }

// Las mismas etiquetas del selector "¿Qué le exige la ANLA?" de la portada.
const PERFIL: Record<Locale, Record<Perfil, string>> = {
  es: {
    importadora: 'Importadora de tecnología',
    productora: 'Ensambladora / productora',
    telco: 'Telecomunicaciones',
    datacenter: 'Data center / infraestructura',
    retail: 'Retail electrónico',
  },
  en: {
    importadora: 'Technology importer',
    productora: 'Assembler / manufacturer',
    telco: 'Telecommunications',
    datacenter: 'Data center / infrastructure',
    retail: 'Electronics retail',
  },
}

// Páginas que no ayudan a responder dudas comerciales.
const SIN_INTERES = ['/politica-de-cookies', '/en/cookie-policy', '/terminos-de-servicio', '/en/terms-of-service', '/blog', '/en/blog']

/** Las rayas de los textos de la página pasan a coma: si el modelo las ve, las copia. */
const sinRayas = (s: string) => s.replace(/\s*[—–]\s*/g, ', ')

export function conocimiento(locale: Locale): string {
  const es = locale === 'es'
  const lineas = LINEAS[locale]
    .map((l) =>
      [
        `### ${l.code}: ${l.title}`,
        sinRayas(l.lede),
        `${es ? 'Incluye' : 'Includes'}: ${l.deliverables.join('; ')}.`,
        `${es ? 'Modalidad' : 'Engagement'}: ${l.plazo}. ${es ? 'Página' : 'Page'}: ${l.slug}`,
      ].join('\n')
    )
    .join('\n\n')

  const normas = (es ? normativasEs : normativasEn) as Norma[]
  // En inglés el código de la norma se traduce; `ref` conserva el de español,
  // que es el que usa exigencias.ts.
  const titulo = new Map(normas.map((n) => [n.ref ?? n.code, n.title]))
  const listaNormas = normas.map((n) => `- ${n.code}: ${n.title}. ${sinRayas(n.body)}`).join('\n')

  const perfiles = PERFILES.map((p) => {
    const codigos = normasDe(p).map((c) => `${c} (${titulo.get(c) ?? ''})`)
    return `- ${PERFIL[locale][p]}: ${codigos.join('; ')}`
  }).join('\n')

  const rutas = (es ? rutasEs : rutasEn)
    .filter((r) => !SIN_INTERES.includes(r.path))
    .map((r) => `- ${r.path}: ${sinRayas(r.descripcion)}`)
    .join('\n')

  const f = FORMA_DE_TRABAJO[locale]
  const tel = SITE_ADDRESS.telefono.replace(/^\+57(\d{3})(\d{3})(\d{4})$/, '+57 $1 $2 $3')

  if (es) {
    return `## Quién es Ekosolv
${SITE_LEGAL_NAME}. ${SITE_TAGLINE.es} Opera desde ${FOUNDED_YEAR} y ha gestionado más de ${tonnesManaged('es')} toneladas de RAEE desde ese año. Sede en ${SITE_ADDRESS.edificio}, ${SITE_ADDRESS.calle}, ${SITE_ADDRESS.ciudad}. La consultoría (EKONSULTING) se presta de forma remota en todo el país; la logística de recolección (EKORAEE, EKOPARTNER) es solo en Colombia.

## Líneas de servicio
${lineas}

## Forma de trabajo
${f.modalidades} ${f.diagnostico}: ${f.diagnosticoMin} minutos con un consultor. Ekosolv no publica tarifas: cada caso se cotiza después del diagnóstico, según el alcance.

## Normativa que publica el sitio (/normativas)
${listaNormas}

## Qué normas aplican según el tipo de empresa
Es la misma relación del selector "¿Qué le exige la ANLA?" de la portada. Es ORIENTATIVA: el diagnóstico confirma cada caso, y así debes presentarla.
${perfiles}

## Páginas del sitio
${rutas}

## Contacto
WhatsApp y teléfono ${tel}, correo ${SITE_ADDRESS.correo}. El formulario de /contacto deja los datos con la autorización de tratamiento. Las recolecciones de residuos electrónicos se agendan en /agenda-una-recoleccion.`
  }

  return `## Who Ekosolv is
${SITE_LEGAL_NAME}. ${SITE_TAGLINE.en} Operating since ${FOUNDED_YEAR}, it has managed more than ${tonnesManaged('en')} tonnes of WEEE since then. Offices at ${SITE_ADDRESS.edificio}, ${SITE_ADDRESS.calle}, ${SITE_ADDRESS.ciudad}, Colombia. Consulting (EKONSULTING) is delivered remotely; collection logistics (EKORAEE, EKOPARTNER) are Colombia only.

## Service lines
${lineas}

## How we work
${f.modalidades} ${f.diagnostico}: ${f.diagnosticoMin} minutes with a consultant. Ekosolv does not publish rates: every case is quoted after the diagnostic, depending on scope.

## Regulations published on the site (/en/regulations)
${listaNormas}

## Which regulations apply by type of company
Same mapping as the "What does ANLA require?" selector on the home page. It is INDICATIVE: the diagnostic confirms each case, and you must present it that way.
${perfiles}

## Site pages
${rutas}

## Contact
WhatsApp and phone ${tel}, email ${SITE_ADDRESS.correo}. The form at /en/contact sends the details with the data processing authorization. E-waste collections are scheduled at /en/schedule-a-collection.`
}
