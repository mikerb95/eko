import { SITE_NAME, SITE_TAGLINE, url } from '../lib/site'
import posts from '../data/blog-posts.json'

/**
 * Texto completo de las publicaciones editoriales del sitio.
 *
 * Antes volcaba tres "reportes" de la plantilla de Storyblok firmados por
 * autores que no existen. Ahora vuelca el blog real, que sí está escrito
 * para Ekosolv y no atribuye autoría a nadie inventado.
 */
function render(section) {
  switch (section.type) {
    case 'h2':
      return `### ${section.text}`
    case 'pull':
      return `> ${section.text}`
    case 'list':
      return (section.items ?? []).map((i) => `- ${i}`).join('\n')
    default:
      return section.text ?? ''
  }
}

export const GET = async () => {
  const sections = posts
    .map((p) => {
      const cuerpo = (p.sections ?? []).map(render).filter(Boolean).join('\n\n')
      return `## ${p.title}

**Categoría**: ${p.category} | **Fecha**: ${p.date} | **Lectura**: ${p.readtime}

${p.lede}

${cuerpo}

**URL**: ${url(`/blog/${p.slug}`)}

***
`
    })
    .join('\n')

  const body = `# ${SITE_NAME} — Publicaciones completas

> ${SITE_TAGLINE.es}

Texto completo de las ${posts.length} publicaciones del Diario, para consumo
por modelos de lenguaje. El índice del sitio está en ${url('/llms.txt')}.

***

${sections}
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
