/**
 * Resolución de imágenes locales para `astro:assets`.
 *
 * ── POR QUÉ NO ESTÁN YA EN /public ──────────────────────────────────────
 * Estaban, y por eso se servían tal cual: JPEG originales de entre 200 y 600
 * KB, en tamaño de escritorio también para móviles, sin WebP, sin `srcset` y
 * —diez de las doce— sin `width` ni `height`, que es lo que provocaba el
 * salto de maquetación al cargar. Astro solo puede optimizar lo que vive
 * dentro de `src/`; lo de `/public` lo copia intacto.
 *
 * Desde `src/assets/` el build genera cada variante en WebP, con el `srcset`
 * que le corresponde y las dimensiones intrínsecas ya resueltas.
 * ────────────────────────────────────────────────────────────────────────
 *
 * Las páginas siguen escribiendo la ruta pública de siempre
 * ("/images/quienes-somos/mario-castilla.jpg") dentro de sus arreglos de
 * datos, porque ahí se lee mejor que un identificador de módulo. Esta función
 * la traduce al `ImageMetadata` que espera `<Image />`.
 */

const archivos = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/quienes-somos/*.jpg',
  { eager: true },
)

/**
 * `ImageMetadata` de una imagen de la sección «quiénes somos», a partir de su
 * ruta o de su nombre de archivo.
 *
 * Lanza si no existe, y es a propósito: una imagen que falta debe romper el
 * build, no salir a producción como un hueco silencioso en la página.
 */
export function imagen(ruta: string): ImageMetadata {
  const nombre = ruta.split('/').pop()
  const clave = Object.keys(archivos).find((k) => k.endsWith(`/${nombre}`))
  if (!clave) {
    throw new Error(
      `[imagenes] No existe "${nombre}" en src/assets/quienes-somos/. ` +
        `Disponibles: ${Object.keys(archivos).map((k) => k.split('/').pop()).join(', ')}`,
    )
  }
  return archivos[clave].default
}
