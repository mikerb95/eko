import { getReportList } from '../utils/api'
import { convertedMarkdown } from '../utils/html2md'

export const GET = async () => {
  try {
    const reports = await getReportList()
    const baseUrl = 'https://ekoambiental.co'

    const sections = reports
      .map((r) => {
        const slug = r.slug.replace('report/', '')
        const content = convertedMarkdown(r.content.content)
        return `## ${r.content.title}

**Autor**: ${r.content.author} | **Fecha**: ${r.content.published_date}

${content}

**URL**: [${r.content.title}](${baseUrl}/report/${slug})

***
`
      })
      .join('\n')

    const body = `# EKO Ambiental — Publicaciones Completas

> Consultoría en normativa ambiental para importadores y productores en Colombia

Este archivo contiene el texto completo de todas las publicaciones del sitio, optimizado para modelos de lenguaje e IA.

***

${sections}

---

Para más información visita [${baseUrl}](${baseUrl})
`
    return new Response(body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    return new Response(`Error generando llms-full.txt\n\n${error.message}`, { status: 500 })
  }
}
