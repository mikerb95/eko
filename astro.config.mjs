import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'

// Debe coincidir con SITE_URL de src/lib/site.ts.
// El dominio aún no es definitivo: PUBLIC_SITE_URL lo sobreescribe en previews.
const site = process.env.PUBLIC_SITE_URL || 'https://ekosolv.com'

export default defineConfig({
  site,
  output: 'static',
  adapter: vercel(),

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
