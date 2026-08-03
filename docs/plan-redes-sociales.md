# Plan: Integración de publicaciones con redes sociales

> Objetivo: que el contenido que ya se produce en el sitio (artículos del blog, radar normativo) llegue a Instagram, Facebook y LinkedIn sin digitación doble, y que el sitio muestre esa actividad de vuelta. La vía elegida es **Zoho Social**, coherente con el principio de `plan-zoho.md`: Zoho es el transporte y el calendario editorial, la web sigue siendo la fuente del contenido.

## Estado de avance

| Fecha | Avance |
|---|---|
| 2026-08-03 | **Fase 0 implementada**: `src/lib/redes.ts` (perfiles con guarda de verificación y constructores de enlaces de compartir), columna "Síguenos" en el footer bajo el logo con paridad ES/EN, botones de compartir reales en el artículo (LinkedIn, Facebook, WhatsApp, correo y copiar enlace) que reemplazan los `href="#"` muertos, y **columna `image` en la tabla `posts`** con migración idempotente (`addColumnIfMissing` en `cms.ts`), campo en el panel, validación de ruta interna en `POST /api/admin/posts` y conexión a `ogImage` en `blog/[slug].astro`. Verificado: migración probada contra una base con el esquema viejo (añade una vez, no-op la segunda, filas existentes quedan en `''`); guardado real desde el panel con imagen válida y con URL externa (esta última se descarta como se diseñó); `astro check` sin errores y build completo. **Los tres perfiles siguen en `activo: false`**: en producción el bloque del footer no se emite hasta que alguien pegue las URLs reales. |

## 1. Estado actual (línea base)

Lo que había en el repo antes de la Fase 0:

| Aspecto | Estado |
|---|---|
| Enlaces a perfiles sociales | **No existen.** El footer (`src/components/SiteFooter.astro`) no tiene columna de redes |
| Botón de compartir | Hay un `<a href="#">LinkedIn</a>` muerto en `src/pages/blog/[slug].astro:55` |
| Open Graph | Implementado y bien resuelto en `src/layouts/Layout.astro:69-84` (título, descripción, imagen 1200×630, `twitter:card`) |
| Imagen OG por artículo | **No existe.** Todo el sitio comparte `/og/portada.jpg` por defecto |
| Imagen en la tabla `posts` | **No existe columna.** `src/lib/cms.ts:53-66`: slug, category, date, readtime, accent, featured, title, lede, sections |
| Estado de borrador en `posts` | **No existe** (ya registrado en `pendientes.md`): todo lo que entra al CMS queda publicado |
| Cliente Zoho | No existe ninguno todavía (`plan-zoho.md` §2) |

Traducción: no hay nada construido, pero tampoco hay nada que desmontar. La base de OG está sólida y es lo que hace que un link compartido en LinkedIn o Facebook se vea bien; lo que falta es que cada artículo tenga su propia imagen.

## 2. Arquitectura: quién es dueño de qué

El error típico de esta integración es terminar leyendo las APIs de Meta y LinkedIn para mostrar el feed en el sitio, con la revisión de app de Meta y el refresco de tokens que eso arrastra. Se evita por completo con una idea simple:

**La web publica, guarda el permalink que le devuelve Zoho, y renderiza su propio historial.**

```
  /admin  ──(1) publicar artículo──►  tabla posts
     │
     └────(2) "Difundir"──►  src/lib/social.ts  ──►  Zoho Social API
                                    │                      │
                                    │                (3) publica en IG / FB Page / LinkedIn
                                    │                      │
                                    ◄──(4) permalink + id ──┘
                                    │
                                    ▼
                            tabla social_posts   ──(5)──►  sección "Síguenos" del sitio
```

Consecuencias de este diseño:

- La dirección "traer el feed al sitio" **no requiere ninguna API de lectura**. Lo que se muestra es lo que nosotros publicamos, que es el 100% de la actividad de la marca.
- Las imágenes que se muestran son las nuestras, servidas desde `/public` o Vercel Blob. No hay que hotlinkear `scontent.cdninstagram.com` ni ampliar `img-src` en la CSP de `astro.config.mjs:28`.
- Si alguien publica algo a mano desde el celular, no aparece en el sitio. Es una limitación real y aceptable: el criterio pasa a ser "si quieres que salga en la web, publícalo desde el panel".

| Dato | Maestro | Comentario |
|---|---|---|
| Texto e imagen de la publicación | **Web** (`posts`, `social_posts`) | Se redacta una vez, en el panel |
| Calendario editorial y cola de envío | **Zoho Social** | Su programador es mejor que cualquiera que construyamos |
| Métricas de alcance e interacción | **Zoho Social** | No se replican en la web; se consultan en su tablero |
| Perfiles y tokens de IG / FB / LinkedIn | **Zoho Social** | Esta es la razón principal de usarlo: no mantenemos tokens de Meta |

## 3. Bloqueadores duros, antes de escribir código

Ninguno es opcional. Los tres primeros pueden invalidar el enfoque completo, así que se verifican antes de la Fase 1.

1. **¿Existen los perfiles?** Hace falta confirmar que Ekosolv tiene página de LinkedIn (de empresa, no perfil personal), página de Facebook y cuenta de Instagram. Si no existen, crearlos es parte del trabajo y no es técnico.
2. **Instagram debe ser cuenta Business o Creator vinculada a la página de Facebook.** Ninguna herramienta de terceros, Zoho Social incluida, puede publicar en una cuenta personal de Instagram. Es límite de Meta, no de Zoho.
3. **El plan de Zoho Social contratado debe incluir acceso a la API de publicación.** No está en los planes de entrada. Hay que abrir la consola de la cuenta y verificarlo contra la documentación vigente antes de comprometer el diseño; si el plan no lo incluye, la alternativa realista es publicar a mano en Zoho Social (que sigue quitando la digitación triple) o reevaluar un agregador.
4. **Instagram exige imagen en toda publicación.** Sin imagen no hay post. Como la tabla `posts` no tiene columna de imagen, esto bloquea la difusión automática de artículos hasta que se resuelva (es la Fase 0).
5. **El dominio definitivo sigue sin decidirse** (`src/lib/site.ts`, `pendientes.md`). Todo link que salga a redes se arma con `SITE_URL`. Publicar hacia un dominio que después cambie deja links rotos en publicaciones que no se pueden editar. **No se difunde nada a producción hasta que el dominio esté fijo.**
6. **`posts` no tiene estado de borrador.** Guardar en el CMS equivale a publicar. Por eso la difusión a redes debe ser **una acción explícita con su propio botón**, nunca un efecto secundario de guardar el artículo. Un `POST /api/admin/posts` accidental no puede terminar en Instagram.

## 4. Modelo de datos

Dos tablas nuevas, en `src/lib/social.ts`, siguiendo el patrón de `cms.ts` y `ops.ts` (`CREATE TABLE IF NOT EXISTS` al arrancar).

```
social_posts(
  id, kind[post|normativa|suelto], ref_id,        -- ref_id apunta a posts.id o normativas.id
  text, image_url, link_url,
  status[borrador|programado|publicado|fallido],
  scheduled_at, published_at, error, created_by, created_at
)

social_targets(
  id, social_post_id, network[instagram|facebook|linkedin],
  zoho_channel_id, remote_post_id, permalink,
  status[pendiente|publicado|fallido], error, updated_at
)
```

Una fila por red porque el resultado es independiente: LinkedIn puede salir bien y Instagram fallar por formato de imagen. Un estado único mentiría sobre lo que realmente pasó.

## 5. Cliente Zoho Social

Reutiliza la mecánica de OAuth ya diseñada en `plan-zoho.md` §4 (Camino A): un self-client en Zoho API Console, refresh token generado una vez, access token que se renueva solo cada hora.

Variables nuevas en `.env.example`:

```
ZOHO_CLIENT_ID=            # compartidas con la integración de CRM si es la misma cuenta
ZOHO_CLIENT_SECRET=
ZOHO_SOCIAL_REFRESH_TOKEN= # refresh token propio: los scopes de Social son distintos a los de CRM
ZOHO_DC=com                # datacenter de la cuenta (.com, .eu, .in)
ZOHO_SOCIAL_BRAND_ID=      # la "marca" de Zoho Social que agrupa los canales
```

Notas de implementación:

- Scopes mínimos de publicación únicamente, no acceso total a la cuenta. Los nombres exactos se toman de la documentación vigente al implementar, no de memoria.
- El flujo es: listar canales de la marca (una vez, para guardar los `zoho_channel_id` de cada red) y luego crear la publicación apuntando a los canales elegidos.
- Igual que el cliente de email (`src/lib/email.ts`): `fetch` directo sin SDK, timeout corto, y **fail-soft**. Si Zoho está caído, el artículo se guarda igual y la fila queda en `fallido` con el error, lista para reintentar desde el panel.
- Si faltan las variables de entorno, la publicación es un no-op silencioso y el botón se muestra deshabilitado con la razón. Mismo criterio que se usó con Resend.

## 6. Adaptación del texto por red

Un mismo contenido no se publica igual en las tres. La función que arma el texto vive en `social.ts` y es lo único que hay que ajustar cuando cambie el tono.

| | Instagram | Facebook Page | LinkedIn |
|---|---|---|---|
| Imagen | **Obligatoria.** 1:1 o 4:5, mínimo 1080px | Opcional; sin imagen usa la previsualización OG del link | Opcional; sin imagen usa la previsualización OG |
| Link clicable | **No.** El link en el caption no es clicable | Sí | Sí |
| Longitud práctica | 2.200 caracteres máx., funciona mejor con menos de 300 | Sin límite práctico, funciona mejor con menos de 400 | 3.000 caracteres máx., funciona mejor con menos de 1.300 |
| Hashtags | 5 a 10, al final | 1 o 2 | 3 a 5 |
| Estrategia de link | "Link en la bio", que apunta a `/blog` | Link directo al artículo | Link directo al artículo |

La consecuencia práctica: **una imagen OG por artículo sirve para las tres redes a la vez.** Es la pieza de mayor retorno de todo el plan y no depende de ninguna API.

## 7. Roadmap por fases

| Fase | Entrega | Depende de | Valor |
|---|---|---|---|
| **0. Presencia y compartir** | Columna de redes en el footer, botones de compartir reales en el artículo, imagen OG por post | Nada externo | **Hecho (2026-08-03)**; los perfiles quedan inertes hasta pegar las URLs reales |
| **1. Difusión manual desde el panel** | `src/lib/social.ts` + botón "Difundir a redes" en el artículo, con vista previa por red | Bloqueadores §3 resueltos | Fin de la digitación triple |
| **2. Compositor propio** | Publicación suelta desde el panel, sin pasar por el blog, y difusión de normativas del radar | Fase 1 | Ekonsulting publica alertas normativas sin depender de escribir un artículo |
| **3. Programación y "Síguenos"** | Fecha programada delegada al calendario de Zoho, sección de últimas publicaciones en el sitio leída de `social_posts` | Fase 2 | El sitio deja de verse estático |
| **4. Métricas (opcional)** | Traer alcance e interacción de Zoho al tablero del panel | Fase 3 y el módulo M6 | Solo si la gerencia lo pide; el tablero de Zoho ya lo muestra |

Cada fase se despliega y se usa de verdad antes de empezar la siguiente, misma regla del plan del panel.

### Fase 0 en detalle (lo que se puede hacer sin esperar a nadie)

1. **Columna "Síguenos" en `SiteFooter.astro`**, con los tres perfiles, en ambos idiomas. Los `href` salen a un solo lugar en `src/lib/site.ts` (`SOCIAL_LINKS`), no repartidos por el componente.
2. **Arreglar el botón muerto de `blog/[slug].astro:55`.** Compartir a LinkedIn, Facebook y WhatsApp con los endpoints públicos de cada red (`linkedin.com/sharing/share-offsite`, `facebook.com/sharer`, `wa.me`). No requieren API, token ni JavaScript: son enlaces con el link del artículo. Instagram no tiene equivalente web, así que no lleva botón.
3. **Columna `image` en la tabla `posts`** y campo en el formulario del panel, con la ruta a `/public/og/`. `Layout.astro` ya acepta la prop `ogImage`, así que `blog/[slug].astro` solo tiene que pasársela. Con eso cada artículo compartido en LinkedIn deja de mostrar la misma portada genérica.
4. Migración de la columna nueva siguiendo lo que ya hace `ensureSchema()` en `cms.ts`, con `ALTER TABLE ... ADD COLUMN` tolerante a que ya exista.

### Sección "Síguenos" del sitio (Fase 3), consideraciones

- El sitio es `output: 'static'` (`astro.config.mjs`). La página que muestre las últimas publicaciones necesita `export const prerender = false`, como ya hacen `normativas.astro` y `blog/[slug].astro`, o se queda congelada en el último despliegue.
- Las imágenes salen de nuestro propio almacenamiento, así que la CSP no se toca. Si en algún momento se quisiera mostrar miniaturas traídas de Instagram, habría que ampliar `img-src`; preferible descargar la imagen a Vercel Blob al publicar.
- Al maquetar las tarjetas de publicación: nada de franja de acento a la izquierda. Punto de color de la red junto al título o tinte de fondo en hover.

## 8. Riesgos

- **El plan de Zoho Social no incluye API.** Es el riesgo principal y se verifica primero. Plan B: el equipo publica desde Zoho Social a mano y la web se queda con la Fase 0, que ya es la mayor parte del valor visible.
- **Meta rompe la conexión del canal.** Los tokens de Instagram y Facebook caducan y a veces se revocan solos. Cuando pasa, Zoho falla la publicación y alguien tiene que reconectar el canal en su consola. Por eso la fila queda en `fallido` con el error visible en el panel, en vez de fallar en silencio.
- **Publicar por accidente.** Mitigado por el diseño: acción explícita, con vista previa por red y confirmación. Nunca automático al guardar.
- **Publicar links a un dominio que va a cambiar.** Bloqueador §3.5. Una publicación en Instagram no se puede editar después.
- **Contenido de relleno saliendo a producción.** El sitio todavía tiene contenido placeholder; hay que revisar que lo que se difunda sea real antes de que lo vea un cliente.
- **Nadie mantiene el ritmo.** Una cuenta con tres publicaciones y luego seis meses de silencio comunica peor que no tener cuenta. Vale la pena acordar una cadencia mínima antes de abrir los perfiles.

## 9. Siguiente paso concreto

1. **Verificar los tres bloqueadores de cuenta** (§3.1 a §3.3): perfiles existentes, Instagram en modo Business vinculado a la página de Facebook, y plan de Zoho Social con API. Es una revisión de media hora en las consolas, no es desarrollo.
2. **Ejecutar la Fase 0 en paralelo**, que no depende de nada de lo anterior: footer, botones de compartir e imagen OG por artículo.
3. Solo entonces crear el self-client de Zoho y empezar `src/lib/social.ts`.
