/**
 * Datos estructurados (JSON-LD, schema.org).
 *
 * ── POR QUÉ EXISTE ESTE ARCHIVO ─────────────────────────────────────────
 * Hasta la auditoría SEO del 3 de agosto de 2026 el sitio no emitía ni un
 * bloque de JSON-LD. Era el hueco más grande y el más barato de cerrar,
 * porque los datos ya estaban todos en el código: razón social y NIT en
 * `site.ts`, dirección y teléfono en el pie, licencias con número de
 * resolución en `/licencias`, artículos con fecha y categoría en el CMS.
 * Solo faltaba exponerlos en el formato que leen los buscadores.
 *
 * Sin esto no hay panel de conocimiento, no hay resultados enriquecidos en el
 * blog, y los buscadores generativos no tienen de dónde sacar la ficha de la
 * empresa. Para una consultora que compite por consultas locales
 * («consultoría ambiental Bogotá», «gestor RAEE autorizado ANLA»), el
 * `LocalBusiness` con la dirección real es lo que decide la aparición en el
 * paquete local del mapa.
 * ────────────────────────────────────────────────────────────────────────
 *
 * Todo se construye desde las fuentes únicas que ya existen. Nada de datos
 * escritos a mano aquí: si una cifra aparece en dos sitios, se desincroniza.
 */

import { SITE_ADDRESS, SITE_LEGAL_NAME, SITE_NAME, SITE_NIT, SITE_TAGLINE, SITE_URL, url } from './site'
import { FOUNDED_YEAR } from './brand'
import { perfilesVisibles } from './redes'

type Lang = 'es' | 'en'

/**
 * `@id` estable de la organización. Los demás nodos la referencian con
 * `{ "@id": ORG_ID }` en vez de repetir el objeto entero, que es lo que
 * permite a Google entender que el editor del blog y la empresa del pie son
 * la misma entidad.
 */
export const ORG_ID = `${SITE_URL}/#organizacion`
const WEBSITE_ID = `${SITE_URL}/#sitio`

/**
 * Organización y sede. Emite `ProfessionalService`, que es a la vez
 * `Organization` y `LocalBusiness`: cubre el panel de conocimiento y el
 * paquete local con un solo nodo, en vez de dos que compiten entre sí.
 */
export function organizacion(lang: Lang = 'es') {
  const perfiles = perfilesVisibles().map((p) => p.url)

  return {
    '@type': ['Organization', 'ProfessionalService'],
    '@id': ORG_ID,
    name: SITE_NAME,
    legalName: SITE_LEGAL_NAME,
    url: url(lang === 'en' ? '/en' : '/'),
    description: SITE_TAGLINE[lang],
    foundingDate: String(FOUNDED_YEAR),
    logo: {
      '@type': 'ImageObject',
      url: url('/brand/ekosolv-horizontal.png'),
      width: 249,
      height: 72,
    },
    image: url('/og/portada.jpg'),
    telephone: SITE_ADDRESS.telefono,
    email: SITE_ADDRESS.correo,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${SITE_ADDRESS.edificio}, ${SITE_ADDRESS.calle}`,
      addressLocality: SITE_ADDRESS.ciudad,
      addressRegion: SITE_ADDRESS.region,
      addressCountry: SITE_ADDRESS.pais,
    },
    areaServed: { '@type': 'Country', name: 'Colombia' },
    // El NIT es el identificador fiscal colombiano. `taxID` es el campo que
    // schema.org reserva para esto; no existe uno específico para el NIT.
    taxID: SITE_NIT,
    knowsLanguage: ['es-CO', 'en'],
    /*
     * `sameAs` solo sale cuando hay perfiles verificados. Hoy los tres están
     * en `activo: false` en `redes.ts`, así que el campo se omite: declararle
     * a Google un perfil que no existe es peor que no declarar ninguno.
     */
    ...(perfiles.length > 0 ? { sameAs: perfiles } : {}),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: lang === 'en' ? 'customer service' : 'atención al cliente',
      telephone: SITE_ADDRESS.telefono,
      email: SITE_ADDRESS.correo,
      areaServed: 'CO',
      availableLanguage: ['Spanish', 'English'],
    },
  }
}

/** El sitio como obra, con el buscador interno que aún no existe omitido. */
export function sitioWeb(lang: Lang = 'es') {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_TAGLINE[lang],
    inLanguage: lang === 'en' ? 'en' : 'es-CO',
    publisher: { '@id': ORG_ID },
  }
}

/**
 * Las cuatro líneas de servicio, por ruta. El `serviceType` es lo que se
 * busca de verdad; el nombre de la marca ("EKORAEE") no lo busca nadie que
 * todavía no conozca a Ekosolv.
 */
const SERVICIOS: Record<string, { es: string; en: string }> = {
  ekonsulting: {
    es: 'Consultoría ambiental y cumplimiento normativo ANLA',
    en: 'Environmental consulting and ANLA regulatory compliance',
  },
  ekoraee: {
    es: 'Gestión de residuos de aparatos eléctricos y electrónicos (RAEE)',
    en: 'Waste electrical and electronic equipment (WEEE) management',
  },
  ekopartner: {
    es: 'Operación de sistemas de recolección posconsumo',
    en: 'Operation of post-consumer collection systems',
  },
  ekotrading: {
    es: 'Compra y venta de activos tecnológicos en economía circular',
    en: 'Circular economy trading of IT assets',
  },
}

/**
 * Nodo `Service` de una página de línea de servicio, o null si la ruta no lo
 * es. Vive aquí y lo emite el layout, en vez de que cada página lo pase a
 * mano: son cuatro páginas por idioma y el patrón de este repositorio es que
 * un dato repetido acaba desincronizado.
 */
export function servicioDeRuta(
  path: string,
  nombre: string,
  descripcion: string,
  lang: Lang = 'es',
) {
  const clave = path.replace(/^\/(en\/)?/, '')
  const tipo = SERVICIOS[clave]
  if (!tipo) return null

  return {
    '@type': 'Service',
    name: nombre,
    description: descripcion,
    url: url(path),
    serviceType: tipo[lang],
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Colombia' },
    audience: {
      '@type': 'BusinessAudience',
      name: lang === 'en'
        ? 'Technology importers, producers, and operators in Colombia'
        : 'Importadores, productores y operadores de tecnología en Colombia',
    },
  }
}

/**
 * Migas de pan. Google las usa para reemplazar la URL cruda del resultado por
 * una ruta legible, y eso sube el porcentaje de clics aunque la posición no
 * cambie. El sitio no dibuja migas visibles, pero la jerarquía existe y es
 * legítimo declararla.
 */
export function migas(items: Array<{ nombre: string; path: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.nombre,
      item: url(item.path),
    })),
  }
}

/*
 * Fechas del blog.
 *
 * La columna `date` de `posts` guarda texto libre en español ("26 ago 2025")
 * porque nació como dato de presentación. `datePublished` exige ISO 8601, así
 * que hay que traducirla. Lo correcto de fondo es añadir una columna ISO al
 * esquema y dejar la cadena actual solo para mostrar; mientras tanto esto
 * cubre el formato que usan los artículos publicados y, si un día no lo
 * reconoce, devuelve null y el campo simplemente se omite. Un `datePublished`
 * inventado es peor que ninguno: Google lo contrasta contra el texto visible.
 */
const MESES: Record<string, string> = {
  ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06',
  jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12',
}

export function fechaISO(fecha: string): string | null {
  const m = fecha.trim().toLowerCase().match(/^(\d{1,2})\s+([a-záéíóú]+)\.?\s+(\d{4})$/)
  if (!m) return null
  const mes = MESES[m[2].slice(0, 3)]
  if (!mes) return null
  return `${m[3]}-${mes}-${m[1].padStart(2, '0')}`
}

/** Un artículo del diario. */
export function articulo(post: {
  slug: string
  title: string
  lede: string
  date: string
  category: string
  image?: string
}) {
  const publicada = fechaISO(post.date)

  return {
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.lede,
    url: url(`/blog/${post.slug}`),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url(`/blog/${post.slug}`) },
    articleSection: post.category,
    inLanguage: 'es-CO',
    image: post.image ? url(post.image) : url('/og/portada.jpg'),
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    ...(publicada ? { datePublished: publicada } : {}),
  }
}

/**
 * Envuelve los nodos en un `@graph` único.
 *
 * Un solo `<script>` con `@graph` en vez de varios bloques sueltos: así los
 * `@id` se resuelven entre sí y Google ve un grafo conectado, no fragmentos
 * independientes que tiene que adivinar cómo unir.
 */
export function grafo(nodos: unknown[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodos.filter(Boolean),
  }
}
