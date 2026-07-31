/**
 * Genera la miniatura de compartir (Open Graph) de la portada.
 *
 *   node scripts/og/generar.mjs
 *
 * Renderiza `plantilla.html` con Chromium en 1200×630 y escribe
 * `public/og/portada.jpg`. Se ejecuta a mano: la imagen es un asset versionado,
 * no algo que deba correr en cada build (Chromium no existe en Vercel).
 *
 * Las fuentes viven en `fuentes/` y se incrustan como data URI para que el
 * render no dependa de la red ni de las fuentes del sistema.
 *
 * Chromium se busca en el PATH; se puede forzar con CHROMIUM_BIN.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = resolve(aqui, '../..')

const ANCHO = 1200
const ALTO = 630
const SALIDA = resolve(raiz, 'public/og/portada.jpg')

const dataUri = (ruta, mime) =>
  `data:${mime};base64,${readFileSync(resolve(raiz, ruta)).toString('base64')}`

const html = readFileSync(resolve(aqui, 'plantilla.html'), 'utf-8')
  .replace('{{GEIST}}', dataUri('scripts/og/fuentes/geist.woff2', 'font/woff2'))
  .replace('{{SERIF}}', dataUri('scripts/og/fuentes/instrument-serif.woff2', 'font/woff2'))
  .replace('{{SERIF_ITALIC}}', dataUri('scripts/og/fuentes/instrument-serif-italic.woff2', 'font/woff2'))
  .replace('{{LOGO}}', dataUri('public/brand/ekosolv-horizontal-white.svg', 'image/svg+xml'))

// Dentro del repo y no en /tmp ni en un directorio oculto: el Chromium
// empaquetado como snap está confinado y solo escribe en rutas visibles
// del $HOME. El directorio se borra al terminar.
const trabajo = resolve(aqui, `render-${process.pid}`)
mkdirSync(trabajo, { recursive: true })
const entrada = resolve(trabajo, 'og.html')
const captura = resolve(trabajo, 'og.png')
writeFileSync(entrada, html)

const chromium = process.env.CHROMIUM_BIN || 'chromium'
execFileSync(chromium, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=2', // se renderiza a 2× y se reduce: bordes limpios
  `--window-size=${ANCHO},${ALTO}`,
  `--screenshot=${captura}`,
  `file://${entrada}`,
], { stdio: 'inherit' })

mkdirSync(dirname(SALIDA), { recursive: true })
await sharp(captura)
  .resize(ANCHO, ALTO, { fit: 'fill' })
  .jpeg({ quality: 88, chromaSubsampling: '4:4:4', mozjpeg: true })
  .toFile(SALIDA)

rmSync(trabajo, { recursive: true, force: true })

const { size } = await sharp(SALIDA).metadata().then(async (m) => ({ ...m, size: (await sharp(SALIDA).toBuffer()).length }))
console.log(`✓ ${SALIDA.replace(raiz + '/', '')} — ${ANCHO}×${ALTO}, ${(size / 1024).toFixed(0)} KB`)
