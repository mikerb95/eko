# Changelog

## 2026-08-03

### Added
- **Integración con Zoho CRM** (`src/lib/zoho.ts`, `zohoMap.ts`, `zohoOutbox.ts`): cliente OAuth con refresh token que resuelve el access token solo, CRM v8 y Books v3. Cada mensaje de contacto y cada solicitud de recolección se encola como `crm_lead` en la tabla `zoho_outbox` en el momento de entrar, con estados (`pendiente`/`sincronizado`/`fallido`/`descartado`) y hasta 5 intentos. El drenaje se dispara desde `POST /api/admin/zoho {"action":"sync"}`, deduplicando por email antes de crear el lead. Mientras no existan credenciales la integración queda en no-op y la bandeja acumula: nada se pierde en el intervalo. Detalle en `docs/plan-zoho.md`.
- **Endpoint de la bandeja** `/api/admin/zoho`: `GET` de estado y `POST` con `sync`, `retry` y `discard`. Solo rol admin, porque escribe en un sistema externo.
- **`defer()`** (`src/lib/defer.ts`): permite responderle al visitante sin esperar el aviso por correo ni el encolado, aprovechando que la función sigue viva después de la respuesta.
- **Perfiles y enlaces de redes sociales** (`src/lib/redes.ts`): columna "Síguenos" en el footer y botones de compartir en los artículos del blog (con copiar enlace). Los perfiles solo se emiten cuando tienen URL real y están marcados como activos, así que en producción no aparecen enlaces rotos. Plan en `docs/plan-redes-sociales.md`.
- **Imagen por artículo para compartir**: columna `posts.image` (migración aditiva), campo en el panel con validación de ruta interna, aviso "Sin imagen" en el listado y `ogImage` en el layout del post, para que cada artículo compartido no muestre la portada genérica.
- **Cabeceras propias para las zonas privadas** (`astro.config.mjs`): `/admin`, `/api/admin`, `/docs` y `/oportunidades2630` responden con `Cache-Control: no-store` y `X-Robots-Tag: noindex, nofollow, noarchive`. Antes respondían `public, max-age=0, must-revalidate`, que autoriza a una caché intermedia a guardar HTML con datos de una sesión ajena; y `robots.txt` es una petición, no un control: no impide que una URL termine indexada si alguien la enlaza.
- **`infra_deploy.md`**: qué hay que contratar para producción (Vercel Pro, Turso, Resend, dominio), con costos consultados, límites de cada plan, escenario multicliente, habeas data y checklist previo a la entrega.
- **`oferta_comercial_ekosolv.md`**: alcances, precios y plantilla de correo de la propuesta.

### Fixed
- **`addColumnIfMissing()`** ahora tolera el error de columna duplicada en vez de fallar: dos instancias arrancando a la vez ya no rompen la migración.

### Known issues
- **No hay base de datos en producción**: el proyecto en Vercel no tiene `DATABASE_URL` y el fallback `file:./data/cms.db` no se puede abrir en la función. Las pestañas de datos del panel responden 500. Se agregó una credencial fija en `src/lib/users.ts`, comprobada antes de tocar la base, como parche para poder entrar; hay que removerla y rotar la contraseña cuando exista la base. Ver `pendientes.md`.

## 2026-07-31

### Added
- **Documentos internos protegidos por rol**: `/docs`, `/docs/kanban`, `/docs/radar` y `/oportunidades2630` exigen sesión con rol admin (`src/middleware.ts`), llevan `noindex` y están excluidos en `robots.txt`. Son material comercial interno viviendo en el mismo dominio que ve el cliente.
- **Imágenes Open Graph propias** (`scripts/og/`): script de generación con plantilla HTML y fuentes locales, portada en español e inglés.
- **Licencia propietaria** (`LICENSE`), aviso de copyright en el footer, metadatos de autor en los layouts y plantilla de cese y desista (`docs/legal/cese-y-desista.md`).
- **Clase `.lede-coda`**: coda tipográfica para cerrar los *lede* del hero sin colgar la cláusula de un guion largo.

### Fixed
- El redirect posterior al login solo acepta rutas internas.

## 2026-07-30

### Added
- **Radar normativo** (`/docs/radar`, `src/data/radar.ts`): seguimiento del entorno político y normativo del sector.
- **Documentación de ingeniería** (`/docs`, `/docs/kanban`): tablero de iteraciones (`IteracionesBoard.astro`), diagramas BPMN y de secuencia como componentes Astro (`components/docs/`), niveles de prueba y validación. Enlazado desde el footer con nota de acceso restringido.
- **Selector de idioma con banderas** (`Flag.astro`): control segmentado ES/EN, con hoja de selección en móvil y foco accesible.
- **Borrador B1 sobre la Resolución 0851** (`docs/borradores/`), con coberturas y obligaciones para productores de AEE.

## 2026-07-29

### Added
- **Avisos por email** (`src/lib/email.ts`): notificación al equipo vía API REST de Resend, sin SDK, con `fetch` y timeout de 8 s. Conectado a `POST /api/recolecciones` y `POST /api/contacto`, con plantilla HTML y texto plano, `reply_to` al solicitante y link al panel. Diseño *fail-soft*: si el correo falla o las variables no están, la orden o el mensaje se guarda igual y el visitante recibe su confirmación.

## 2026-07-24

### Added
- **Módulo de contactos** (`src/lib/contactos.ts`, tabla `contacts`): endpoint público `POST /api/contacto` con honeypot y rate limiting, `GET/PATCH /api/admin/contactos`, y pestaña "Contactos" en el panel con filtro por estado y contador de nuevos.
- **Cabeceras de seguridad** inyectadas en el Build Output de Vercel desde `astro.config.mjs`: CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`. Se hace ahí porque, con esa API del adapter, un `vercel.json` con `headers` se ignora y el middleware de Astro no corre para las páginas prerenderizadas.
- **SEO y compartido**: `sitemap.xml` y `robots.txt` generados, URL canónica, pares `hreflang` ES/EN (`src/lib/rutas.ts`) y metadatos Open Graph y Twitter en ambos layouts.
- **Rate limiting en `/api/recolecciones`**, además del login.
- **Formulario de recolección rediseñado** como proceso de varios pasos, con guía por campo.
- **Fondo animado** con blobs decorativos, aleatorizados al navegar.

### Changed
- **Astro 6 → 7.1.3** y **`@astrojs/vercel` → 11.0.3**. Se conserva `compressHTML: true` porque Astro 7 cambió el default a `'jsx'`, que colapsa los espacios entre elementos inline y rompería separadores como `<span>·</span>`.
- Paleta revisada para mejorar el contraste del texto.

### Fixed
- Accesibilidad de los formularios: `for`/`id` en todas las etiquetas y `aria-pressed` en los chips de filtro.

## 2026-07-21

### Added
- **Cifras de marca centralizadas** (`src/lib/brand.ts`): año de fundación, años activos y toneladas gestionadas, calculados y localizados en un solo lugar en vez de repetidos a mano por las páginas.
- **Navegación nueva** (`Nav.astro`, `src/config/nav.ts`): responsive, con panel móvil, estado al hacer scroll, navegación por teclado y rutas activas por idioma.
- **Hero con estadísticas** y radar normativo como visual, en lugar del bloque anterior.
- **Credenciales y prueba social** (`src/lib/credenciales.ts`): licencias, testimonios, clientes, casos y videos, todos con bandera de verificación. Nada se muestra en producción hasta estar verificado y autorizado; en desarrollo se ven los placeholders.
- **Página de licencias** (`/licencias`, `/en/licenses`).
- **Sección "Por qué Ekosolv"** en el home, en ES y EN.
- **Tipo de residuo y cantidad estimada** en el formulario de recolección y en la orden (`orders`, migración aditiva).

### Removed
- Sección "Clientes" con logos de relleno, en ES y EN: mostrar marcas ajenas sin autorización es un riesgo, no un adorno. Vuelve cuando haya logos autorizados (`docs/plan-competitivo-lito.md`, Fase 3).

## 2026-07-05 – 2026-07-07

### Added
- **Órdenes de recolección** (`src/lib/ops.ts`): tablas `orders` y `order_events`, consecutivo `REC-AAAA-0001` y ciclo de estados `solicitada → confirmada → programada → en ruta → recolectada → clasificada → certificada → cerrada` (+ `cancelada`) con bitácora. Endpoint público `POST /api/recolecciones` con honeypot, formularios ES/EN conectados de verdad, y pestaña "Recolecciones" en el panel con filtro por estado y drawer de gestión (estado, responsable, fecha, notas, historial) sobre `GET/PATCH /api/admin/recolecciones`. Antes el formulario no persistía nada.
- **Usuarios, roles y autorización** (`src/lib/users.ts`): tabla `users`, PBKDF2-SHA256 con salt por usuario vía WebCrypto y sin dependencias, login contra la base con bootstrap del primer admin desde `ADMIN_USERNAME`/`ADMIN_PASSWORD` solo si la tabla está vacía, sesión firmada con nombre y rol, autorización por rol en el middleware, y pestaña "Usuarios" en el panel. Salvaguardas: nadie puede auto-degradarse ni borrar al último admin activo. La bitácora de órdenes registra el nombre real del empleado.
- **Rate limiting en `/api/admin/login`** (`src/lib/rateLimit.ts`): 5 intentos por IP cada 10 minutos, con `429` y `Retry-After`. En memoria por instancia de función, sin infraestructura externa.
- **`AUDITORIA.md`**, **`docs/plan-panel-operaciones.md`** y **`docs/oportunidades-gobierno-2026-2030.md`**.
- **`.nvmrc`** fijando Node 24.

### Fixed
- **Fail-hard de variables de entorno** (`src/lib/auth.ts`): en producción el arranque falla si falta `AUTH_SECRET`, en vez de caer a un secreto conocido.

### Removed
- **`.vercel/output/` del repositorio**: ~90 archivos de build que incluían los chunks compilados con los defaults inseguros de autenticación. Añadido `.vercel/` al `.gitignore`.
- **`bun.lock`**: se mantiene `package-lock.json` como único lockfile.

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
