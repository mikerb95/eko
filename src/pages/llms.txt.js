import { SITE_LEGAL_NAME, SITE_NAME, SITE_TAGLINE, url } from '../lib/site'
import { rutasEn, rutasEs } from '../lib/rutas'
import { FOUNDED_YEAR, yearsActive } from '../lib/brand'

export const GET = async () => {
  const lista = (rutas) =>
    rutas.map((r) => `- [${r.titulo}](${url(r.path)}): ${r.descripcion}`).join('\n')

  const body = `# ${SITE_NAME}

> ${SITE_TAGLINE.es}

${SITE_LEGAL_NAME} opera en Colombia desde ${FOUNDED_YEAR} (${yearsActive} años),
acompañando a importadores, productores y operadores de tecnología en el
cumplimiento de la normativa ambiental ante la ANLA, la estrategia ESG y la
transición hacia la economía circular.

## Páginas

${lista(rutasEs)}

## Pages (English)

${lista(rutasEn)}

## Contacto

- Correo: info@ekosolv.com
- Teléfono: +57 321 271 2773
- Dirección: Edif. RPTV · Carrera 15 #31B-33, Bogotá D.C., Colombia

## Detalle

- Texto completo de las publicaciones: ${url('/llms-full.txt')}
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
