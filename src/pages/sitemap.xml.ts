import type { APIRoute } from 'astro'
import { url } from '../lib/site'
import { rutasEs, rutasEn, hreflangFor } from '../lib/rutas'
import { getPosts } from '../lib/cms'

// Sitemap generado desde el inventario único de rutas (src/lib/rutas.ts) más
// las publicaciones del blog. Incluye enlaces `xhtml:link` con hreflang para
// que Google relacione las versiones es↔en de cada página.

function xmlEscape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!
  ))
}

export const GET: APIRoute = async () => {
  const posts = await getPosts()

  const urls: string[] = []

  for (const r of [...rutasEs, ...rutasEn]) {
    const alt = hreflangFor(r.path)
    const alternates = alt
      ? [
          `    <xhtml:link rel="alternate" hreflang="es" href="${xmlEscape(url(alt.es))}" />`,
          `    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(url(alt.en))}" />`,
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(url(alt.es))}" />`,
        ].join('\n')
      : ''
    urls.push(
      `  <url>\n    <loc>${xmlEscape(url(r.path))}</loc>${alternates ? '\n' + alternates : ''}\n  </url>`,
    )
  }

  for (const p of posts) {
    urls.push(`  <url>\n    <loc>${xmlEscape(url(`/blog/${p.slug}`))}</loc>\n  </url>`)
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
