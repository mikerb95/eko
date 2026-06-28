# Changelog

## 2026-06-28

### Added
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
