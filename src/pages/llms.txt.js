import { getLinks } from '../utils/api'

export const GET = async () => {
  try {
    const links = await getLinks()
    const baseUrl = 'https://ekoambiental.co'

    const pages = links
      .filter((l) => !l.is_folder)
      .map((l) => `- [${l.slug === 'home' ? 'Inicio' : l.slug}](${baseUrl}/${l.slug === 'home' ? '' : l.slug})`)
      .join('\n')

    const body = `# EKO Ambiental

> Consultoría en normativa ambiental para importadores y productores en Colombia

Este archivo contiene un listado de todas las páginas y recursos del sitio.

***

## Páginas

${pages}

---

Para más información visita [${baseUrl}](${baseUrl})
`
    return new Response(body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    return new Response(`Error generando llms.txt\n\n${error}`, { status: 500 })
  }
}
