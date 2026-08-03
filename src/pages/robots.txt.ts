import type { APIRoute } from 'astro'
import { url } from '../lib/site'

/*
 * robots.txt generado dinámicamente para que el sitemap apunte al dominio real
 * (SITE_URL / PUBLIC_SITE_URL), que aún no es definitivo.
 *
 * ── POR QUÉ /admin, /docs Y /oportunidades2630 YA NO ESTÁN AQUÍ ──────────
 * Estaban con `Disallow`, y a la vez `astro.config.mjs` les pone
 * `X-Robots-Tag: noindex, nofollow, noarchive`. Las dos cosas juntas se
 * anulan: si el rastreador tiene prohibido descargar la URL, nunca llega a
 * leer la cabecera que le dice que no la indexe. El resultado es el contrario
 * del buscado, porque el pie de página enlaza esas rutas desde todas las
 * páginas públicas, y una URL enlazada y bloqueada puede terminar en el
 * índice como resultado desnudo, sin título ni descripción.
 *
 * Dejarlas rastreables es lo que hace efectivo el `noindex`: el rastreador
 * entra, lee la cabecera y las excluye del índice de verdad. Quien no tenga
 * sesión recibe una redirección al login (src/middleware.ts), así que no se
 * expone nada: el control de acceso nunca fue el robots.txt.
 *
 * `/api/` sí se queda: no son páginas, no devuelven HTML y no hay nada que
 * indexar ahí. Ninguna está enlazada, así que no hay conflicto que resolver.
 * ────────────────────────────────────────────────────────────────────────
 */

export const GET: APIRoute = async () => {
  const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${url('/sitemap.xml')}
`
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
