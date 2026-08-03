import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Debe coincidir con SITE_URL de src/lib/site.ts.
// El dominio aún no es definitivo: PUBLIC_SITE_URL lo sobreescribe en previews.
const site = process.env.PUBLIC_SITE_URL || 'https://ekosolv.com'

// Cabeceras de seguridad aplicadas a todas las respuestas.
//
// Se inyectan en el config.json del Build Output de Vercel porque, cuando el
// adapter usa esa API, un `vercel.json` con `headers` se ignora y el middleware
// de Astro no corre para las páginas prerenderizadas (que son la mayoría).
//
// La CSP permite lo que el sitio realmente carga: fuentes de Google, pósters de
// YouTube (img.youtube.com) y el iframe de youtube-nocookie del reproductor con
// fachada. `'unsafe-inline'` en script/style es un compromiso: Astro emite
// scripts y estilos inline sin nonce en modo estático, y el XSS ya está mitigado
// aparte (escape en el panel y en `define:vars`). Restringe orígenes externos,
// base-uri, form-action, object-src y frame-ancestors, que es lo de mayor valor.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https://img.youtube.com",
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ')

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
}

// Zonas privadas: el panel, la API del panel y las páginas internas del
// proyecto. Todo lo que hay detrás de una sesión.
//
// `no-store` porque hoy responden `public, max-age=0, must-revalidate`, que
// autoriza a cachés intermedias a guardar HTML con datos de una sesión ajena.
// `noindex` porque `robots.txt` es una petición, no un control: pide no rastrear
// pero no impide que la URL termine indexada si alguien la enlaza.
const PRIVATE_PATHS = '/(admin|docs|oportunidades2630|api/admin)(/.*)?'

const PRIVATE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
}

/** Integración que añade las cabeceras de seguridad al Build Output de Vercel. */
function securityHeaders() {
  return {
    name: 'ekosolv-security-headers',
    hooks: {
      'astro:build:done': () => {
        const path = fileURLToPath(new URL('./.vercel/output/config.json', import.meta.url))
        try {
          const config = JSON.parse(readFileSync(path, 'utf-8'))
          config.routes = config.routes ?? []
          // Rutas al inicio, con `continue: true` para no interrumpir el
          // enrutado. La de zonas privadas va después de la general para que su
          // `Cache-Control` sea el que quede.
          config.routes.unshift(
            { src: '/(.*)', headers: SECURITY_HEADERS, continue: true },
            { src: PRIVATE_PATHS, headers: PRIVATE_HEADERS, continue: true },
          )
          writeFileSync(path, JSON.stringify(config, null, 2))
          console.log('[ekosolv-security-headers] cabeceras inyectadas en config.json')
        } catch (e) {
          console.warn('[ekosolv-security-headers] no se pudo escribir config.json:', e?.message || e)
        }
      },
    },
  }
}

export default defineConfig({
  site,
  output: 'static',
  adapter: vercel(),
  integrations: [securityHeaders()],

  // Astro 7 cambió el default a 'jsx', que colapsa los espacios entre elementos
  // inline (rompería separadores como "<span>·</span>"). Conservamos el de v6.
  compressHTML: true,

  image: {
    // picsum.photos (imágenes de relleno) se retiró junto con la plantilla de
    // Storyblok. Solo se sirven imágenes propias desde /public.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
})
