import type { APIRoute } from 'astro'
import { url } from '../lib/site'

// robots.txt generado dinámicamente para que el sitemap apunte al dominio real
// (SITE_URL / PUBLIC_SITE_URL), que aún no es definitivo. El panel no debe
// indexarse.

export const GET: APIRoute = async () => {
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${url('/sitemap.xml')}
`
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
