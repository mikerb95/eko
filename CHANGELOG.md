# Changelog

## 2026-06-28

### Added
- **Identidad de marca EKOSOLV**: logo recreado en SVG vectorial (texto convertido a trazos) a partir del original. Variantes en `public/brand/`: completo, horizontal, horizontal blanco (fondos oscuros), isotipo, vertical y blanco; favicon actualizado. Instalado en el header (`Layout.astro`) y en los footers.
- **Imágenes de "Quiénes somos"**: fotos de equipo, hitos e historia extraídas del sitio original y optimizadas en `public/images/quienes-somos/`.
- **Blog clonado desde ekosolv.com**: los 15 artículos reales del sitio en producción, migrados al formato de secciones (`p`/`h2`/`pull`/`list`) y diseño propio, con destacado en la Resolución 0851.
- **Capa de datos del CMS** (`src/lib/cms.ts`): base de datos libSQL (archivo local en dev, Turso en producción), tablas `posts` y `normativas`, *seed* automático desde JSON en el primer arranque y *fallback* a JSON si la BD no está disponible.
- **Render híbrido (SSR)**: blog, post individual, normativas y el panel pasan a renderizado on-demand (`prerender = false`) para reflejar los cambios al instante; el resto del sitio sigue estático.
- **WhatsApp FAB**: botón flotante de WhatsApp en todos los layouts (`Layout.astro`, `LayoutEn.astro`) que abre chat directo al número de la empresa.
- **Páginas de servicios**: nuevas páginas individuales para EKORAEE, EKOPARTNER, EKOTRADING y EKONSULTING, con versión en español e inglés (`/en/`).
- **Página "Agenda una recolección"** (`/agenda-una-recoleccion`, `/en/schedule-a-collection`): formulario de solicitud de recolección de residuos electrónicos.
- **Página de contacto** (`/contacto`, `/en/contact`).
- **Página "Quiénes somos"** ampliada con perfiles de equipo, hitos y fotos.
- **Página de casos** con estudios de caso y métricas.
- **Blog conectado al CMS**: el índice y los posts individuales ahora se obtienen desde la API del CMS en lugar de archivos JSON estáticos.
- **Normativas conectadas al CMS**: la página `/normativas` ahora carga datos desde el CMS en lugar de definiciones estáticas.
- **Admin panel**: páginas de login, dashboard y gestión de posts y normativas con autenticación HMAC por cookie.
- **API routes**: endpoints `POST`/`DELETE` para posts y normativas; endpoints de login y logout con control de sesión y middleware de protección de rutas `/admin/*`.
- **Internacionalización EN**: versiones en inglés de todas las páginas principales bajo `/en/`.

### Fixed
- **Toggle de idioma**: al hacer clic en EN/ES el usuario ahora va a la página equivalente en el otro idioma en lugar de volver siempre al home. El mapeo se resuelve en `Layout.astro` y `LayoutEn.astro` usando `Astro.url.pathname` (cubre: servicios, nosotros, normativas, casos, blog, agenda, contacto y sub-páginas de servicios). Rutas sin equivalente hacen fallback al home del idioma destino.
- **Orden de posts en el CMS**: los posts se devuelven en orden ascendente por ID.
- **`upsertPost`**: eliminado logging de debug; asegurado que `title` se envía correctamente en el `POST`.

### Removed
- Archivos HTML estáticos sin uso de las páginas `report` y `servicios`.
