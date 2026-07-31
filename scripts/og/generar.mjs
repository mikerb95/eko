/**
 * Genera las miniaturas de compartir (Open Graph) de la portada, las que
 * WhatsApp, LinkedIn o Slack muestran al pegar el link.
 *
 *   node scripts/og/generar.mjs
 *
 * Renderiza `plantilla.html` con Chromium en 1200×630 y escribe
 * `public/og/portada.jpg` y `public/og/portada-en.jpg`. Se ejecuta a mano: las
 * imágenes son assets versionados, no algo que corra en cada build (en el
 * builder de Vercel no hay Chromium).
 *
 * Las fuentes viven en `fuentes/` y se incrustan como data URI para que el
 * render no dependa de la red ni de las fuentes del sistema.
 *
 * Las cifras del pie son solo las verificadas (ver src/lib/brand.ts): no meter
 * aquí porcentajes ni conteos de clientes sin confirmar.
 *
 * Chromium se busca en el PATH; se puede forzar con CHROMIUM_BIN.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = resolve(aqui, '../..')

const ANCHO = 1200
const ALTO = 630

/** Una variante por idioma. El HTML de los textos se inyecta tal cual. */
const VARIANTES = [
  {
    salida: 'public/og/portada.jpg',
    lang: 'es',
    eyebrow: 'Consultoría ambiental <b>·</b> Colombia',
    titular: 'Cumplir con la <em>ANLA</em>,<br>crecer con <span>propósito</span>.',
    bajada: 'Cumplimiento ANLA, estrategia ESG y economía circular para importadores, productores y operadores de tecnología.',
    prueba1: '<b>Desde 2013</b>',
    prueba2: '<b>+1.000&nbsp;t</b>&nbsp;<span>de RAEE gestionadas</span>',
  },
  {
    salida: 'public/og/portada-en.jpg',
    lang: 'en',
    eyebrow: 'Environmental consulting <b>·</b> Colombia',
    titular: 'Meet <em>ANLA</em> rules,<br>grow with <span>purpose</span>.',
    bajada: 'ANLA compliance, ESG strategy and circular economy for technology importers, producers and operators.',
    prueba1: '<b>Since 2013</b>',
    prueba2: '<b>1,000+&nbsp;t</b>&nbsp;<span>of WEEE managed</span>',
  },
]

const dataUri = (ruta, mime) =>
  `data:${mime};base64,${readFileSync(resolve(raiz, ruta)).toString('base64')}`

const plantilla = readFileSync(resolve(aqui, 'plantilla.html'), 'utf-8')
  .replace('{{GEIST}}', dataUri('scripts/og/fuentes/geist.woff2', 'font/woff2'))
  .replace('{{SERIF}}', dataUri('scripts/og/fuentes/instrument-serif.woff2', 'font/woff2'))
  .replace('{{SERIF_ITALIC}}', dataUri('scripts/og/fuentes/instrument-serif-italic.woff2', 'font/woff2'))
  .replace('{{LOGO}}', dataUri('public/brand/ekosolv-horizontal-white.svg', 'image/svg+xml'))

// Dentro del repo y no en /tmp ni en un directorio oculto: el Chromium
// empaquetado como snap está confinado y solo escribe en rutas visibles del
// $HOME. El directorio se borra al terminar.
const trabajo = resolve(aqui, `render-${process.pid}`)
mkdirSync(trabajo, { recursive: true })

const chromium = process.env.CHROMIUM_BIN || 'chromium'

try {
  for (const v of VARIANTES) {
    const html = plantilla
      .replace('lang="es"', `lang="${v.lang}"`)
      .replace('{{EYEBROW}}', v.eyebrow)
      .replace('{{TITULAR}}', v.titular)
      .replace('{{BAJADA}}', v.bajada)
      .replace('{{PRUEBA_1}}', v.prueba1)
      .replace('{{PRUEBA_2}}', v.prueba2)

    const entrada = resolve(trabajo, `${v.lang}.html`)
    const captura = resolve(trabajo, `${v.lang}.png`)
    writeFileSync(entrada, html)

    execFileSync(chromium, [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=2', // se renderiza a 2× y se reduce: bordes limpios
      `--window-size=${ANCHO},${ALTO}`,
      `--screenshot=${captura}`,
      `file://${entrada}`,
    ], { stdio: ['ignore', 'ignore', 'ignore'] })

    const salida = resolve(raiz, v.salida)
    mkdirSync(dirname(salida), { recursive: true })
    // JPEG y no PNG: WhatsApp descarta las previsualizaciones grandes y pesadas.
    await sharp(captura)
      .resize(ANCHO, ALTO, { fit: 'fill' })
      .jpeg({ quality: 88, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toFile(salida)

    const kb = statSync(salida).size / 1024
    console.log(`✓ ${v.salida} — ${ANCHO}×${ALTO}, ${kb.toFixed(0)} KB`)
  }
} finally {
  rmSync(trabajo, { recursive: true, force: true })
}
