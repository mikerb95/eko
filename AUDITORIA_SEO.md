# Auditoría SEO — Ekosolv

Fecha: 3 de agosto de 2026
Alcance: `src/` completo más el build de `dist/client/` (24 páginas HTML estáticas, 13 rutas ES, 13 EN, 12 artículos de blog).

**Estado: los cuatro hallazgos P0 quedaron cerrados el mismo día.** Cada uno lleva su nota de cierre abajo. Los P1 y P2 siguen abiertos.

---

## Lo que ya está bien

Conviene decirlo primero, porque la base técnica es mejor que la de la mayoría de sitios corporativos:

- Canonical absoluto en todas las páginas, calculado desde una única fuente (`src/lib/site.ts`).
- `hreflang` es↔en bien implementado, con `x-default`, tanto en el `<head>` como dentro del sitemap con `xhtml:link`.
- Sitemap y `robots.txt` generados desde el inventario de rutas, no escritos a mano.
- Un solo `<h1>` por página en las 33 plantillas revisadas.
- Cero imágenes sin `alt`, y los `alt` son descriptivos, no rellenos de keywords.
- Open Graph completo, con dimensiones declaradas para que WhatsApp arme la tarjeta grande.
- `llms.txt` y `llms-full.txt` reales, apuntando a las páginas del sitio.
- Cabeceras de seguridad y `X-Robots-Tag: noindex` inyectadas en el Build Output.

Lo que sigue son los huecos.

---

## P0 — Impacto alto, arreglar primero

### 1. Cero datos estructurados en todo el sitio · RESUELTO

`grep -rn "application/ld+json\|schema.org" src/` devuelve **cero resultados**.

Es el hueco más grande del sitio, y el más barato de cerrar, porque los datos ya existen en el código y solo falta exponerlos en formato que Google entienda:

| Dato | Ya está en | Schema que habilita |
|---|---|---|
| Razón social, NIT | `src/lib/site.ts:22-23` | `Organization` |
| Dirección, teléfono, correo | `src/components/SiteFooter.astro:187-189` | `LocalBusiness` / `PostalAddress` |
| Cuatro líneas de servicio | `src/lib/rutas.ts:24-27` | `Service` |
| Licencias con resolución y vigencia | `src/pages/licencias.astro` | `Certification` |
| Artículos con fecha, categoría, imagen | `src/lib/cms.ts:14-31` | `BlogPosting` |

Sin esto no hay panel de conocimiento, no hay rich results en el blog, y los buscadores generativos no tienen de dónde extraer la ficha de la empresa. Para una consultora que compite por consultas locales ("consultoría ambiental Bogotá", "gestor RAEE autorizado ANLA"), `LocalBusiness` con la dirección de la Carrera 15 es lo que decide si aparece en el paquete local.

Recomendación: un componente `<SchemaOrg />` en ambos layouts que emita `Organization` + `WebSite` en todas las páginas, y que acepte un bloque adicional por página (`Service`, `BlogPosting`, `BreadcrumbList`).

> **Cerrado.** `src/lib/schema.ts` y `src/components/SchemaOrg.astro`. Las 30 páginas construidas emiten un `@graph` único con `Organization` + `ProfessionalService` (razón social, NIT, dirección, teléfono, correo, año de fundación), `WebSite` y `BreadcrumbList`; las ocho páginas de línea añaden su `Service` y los artículos su `BlogPosting` con `datePublished`. Un solo `@graph` en vez de bloques sueltos, para que los `@id` se resuelvan entre sí. `sameAs` se omite mientras los perfiles sociales sigan sin verificar en `redes.ts`.

### 2. Doce de veinticuatro páginas comparten la misma meta description · RESUELTO

Medido sobre el HTML construido. Estas páginas no pasan `description` al layout y caen en el texto por defecto de `Layout.astro:29` y `LayoutEn.astro:23`:

```
/casos            /servicios          /contacto        /quienes-somos
/en/cases         /en/services        /en/contact      /en/about
/en/regulations   /en/blog            (+ /normativas, /blog en SSR)
```

Las doce responden literalmente: *"Acompañamos a importadores, productores y operadores de tecnología en Colombia..."* o su traducción. Google descarta descripciones duplicadas y reescribe el snippet por su cuenta, así que se pierde el control del mensaje justo en las páginas de conversión, `/contacto` y `/servicios` incluidas.

Lo irónico es que **las descripciones buenas ya están escritas**: `src/lib/rutas.ts` tiene una por ruta, en ES y EN, y solo se usan para `llms.txt`. Basta con que los layouts las consulten por `path` cuando no reciban `description` explícita.

> **Cerrado.** Cada ruta de `src/lib/rutas.ts` gana un campo `seo` con título y descripción propios, y los layouts los leen con `seoDe(path)`. Las descripciones de `llms.txt` se quedan como estaban: ese formato pide una línea corta, y fundir los dos usos habría empeorado uno de los dos. Se quitaron los `title` y `description` en línea de 32 páginas; solo los artículos del blog siguen pasando el suyo, que es el único que no se puede saber de antemano. Verificado sobre el build: 30 páginas, 30 descripciones distintas.

### 3. El pie enlaza las páginas privadas desde todas las páginas públicas · RESUELTO

Cada una de las 24 páginas públicas emite estos enlaces:

```
href="/docs"   href="/docs/kanban"   href="/docs/radar"
href="/oportunidades2630"            href="/admin/login"
```

Son las mismas rutas que `robots.txt` bloquea (`src/pages/robots.txt.ts`) y que llevan `X-Robots-Tag: noindex` (`astro.config.mjs:56-62`). Hay dos problemas encadenados:

1. **Conflicto `Disallow` + `noindex`.** Si el rastreador tiene prohibido bajar la URL, nunca lee la cabecera `noindex`. Con 120 enlaces internos apuntando ahí (24 páginas × 5 enlaces), Google puede indexar la URL desnuda, sin título ni descripción, exactamente el resultado que el `noindex` pretendía evitar.
2. **PageRank interno desperdiciado.** Un quinto de los enlaces del pie va a páginas que no deben posicionar.

Recomendación: mostrar la columna "Proyecto" del pie solo con sesión activa, o `rel="nofollow"` como mínimo. Y decidir uno de los dos mecanismos: si se quiere `noindex` efectivo, hay que **quitar** el `Disallow` de `robots.txt` para que el rastreador pueda leer la cabecera.

> **Cerrado por la vía del `noindex`.** Los enlaces del pie ya llevaban `rel="nofollow"` (`SiteFooter.astro:242`), así que lo que faltaba era resolver el conflicto: `robots.txt` ya no bloquea `/admin`, `/docs` ni `/oportunidades2630`. Ahora el rastreador entra, lee `X-Robots-Tag: noindex, nofollow, noarchive` y las excluye de verdad. Quien no tenga sesión sigue recibiendo la redirección al login: el control de acceso nunca fue el `robots.txt`. `/api/` se queda bloqueado, porque ahí no hay HTML que indexar ni enlaces que resolver.

### 4. Imágenes sin optimizar, con impacto directo en Core Web Vitals · RESUELTO

`grep -rn "astro:assets" src/` devuelve **cero**. Las 12 imágenes del sitio son `<img>` crudo apuntando a `/public`:

```
banner-solar-poster.jpg    616 KB
banner-solar.jpg           432 KB
campana-posconsumo.jpg     387 KB
economia-circular.jpg      235 KB
hito-cop16.jpg             233 KB
hero-banner.jpg            219 KB
```

Tres millones de bytes de imágenes servidas como JPEG original, sin WebP ni AVIF, sin `srcset`, en tamaño de escritorio para móviles. Además, solo 2 de 12 `<img>` declaran `width`/`height`, así que el resto provoca CLS al cargar.

El adapter de Vercel ya está instalado y `astro.config.mjs` ya tiene bloque `image`. Migrar a `<Image />` de `astro:assets` en `quienes-somos.astro` y `en/about.astro` resuelve formato, `srcset` y dimensiones de una vez. El póster de 616 KB merece además una pasada de compresión manual.

> **Cerrado.** Las doce imágenes usadas se movieron de `public/images/quienes-somos/` a `src/assets/quienes-somos/`, que es lo único que Astro puede optimizar, y `src/lib/imagenes.ts` las resuelve por nombre para que los arreglos de datos de las páginas sigan legibles. El póster del vídeo pasa por `getImage()` en vez de servirse como JPEG de 616 KB. Medido sobre el build de `/quienes-somos`:
>
> | | Antes | Ahora |
> |---|---|---|
> | Móvil | 1.647 KB | **200 KB** (12 %) |
> | Escritorio | 1.647 KB | **1.061 KB** (64 %) |
> | `width`/`height` | 2 de 12 | **13 de 13** |
> | `srcset` | ninguna | **11 de 11** |
>
> Quedan tres archivos huérfanos en `public/images/quienes-somos/` que no referencia ninguna página: `hero-banner.jpg`, `banner-solar.jpg` y `aliado-barranquilla.jpg`, unos 850 KB que se despliegan sin que nadie los pida. No los borré porque puede que estén reservados para algo; conviene decidirlo.

---

## P1 — Impacto medio

### 5. Títulos cortos, sin keywords, y marca inconsistente

Longitudes medidas del `<title>` construido, contra los ~60 caracteres que Google muestra:

| Página | Título actual | Chars |
|---|---|---|
| `/casos` | `Casos — Eko` | 11 |
| `/en/cases` | `Cases — Ekosolv` | 15 |
| `/contacto` | `Contacto — Ekosolv` | 18 |
| `/servicios` | `Servicios — Ekosolv` | 19 |
| `/quienes-somos` | `Quiénes somos — Ekosolv` | 23 |

Son 40 caracteres desaprovechados en cada una. Compárese con las páginas de servicio, que sí están trabajadas: `EKORAEE — Gestión de residuos electrónicos · Ekosolv` (52). Ninguno de los cortos menciona ANLA, RAEE, posconsumo, Colombia ni Bogotá.

Aparte, **cuatro páginas firman como "Eko" y no como "Ekosolv"**: `casos.astro:10`, `normativas.astro:12`, `blog/index.astro:12` y `blog/[slug].astro:23`. La marca en `src/lib/site.ts` es Ekosolv. Dividir la señal de marca entre dos nombres perjudica las búsquedas por marca, que suelen ser las que más convierten.

### 6. El blog corre en SSR sin caché, y el sitemap no ve los artículos nuevos

`blog/index.astro`, `blog/[slug].astro` y `normativas.astro` llevan `export const prerender = false`, así que cada visita y cada rastreo golpea Turso. No hay `Cache-Control` para esas rutas en el bloque de cabeceras de `astro.config.mjs` (solo lo hay para las zonas privadas, con `no-store`), de modo que Vercel no cachea nada en el borde. TTFB alto en las páginas que más deberían escalar en contenido.

Peor: **`sitemap.xml.ts` sí es estático**, se genera en build. Los 12 artículos que aparecen hoy salen del seed `src/data/blog-posts.json`. Cualquier artículo publicado desde el panel entra a la base de datos pero **nunca al sitemap**, hasta que alguien redespliegue.

Recomendación: o `prerender = false` también en el sitemap, o ISR con revalidación por tag desde el panel al guardar un post.

### 7. El blog en inglés sirve artículos en español

`src/pages/en/blog/index.astro:25,60` enlaza a `/blog/${slug}`, las rutas españolas. No existe `src/pages/en/blog/[slug].astro`.

O sea que `/en/blog` es una página en inglés cuyos enlaces llevan todos a contenido en español, y el par hreflang `{ es: '/blog', en: '/en/blog' }` de `rutas.ts:70` le declara a Google una equivalencia idiomática que no se cumple. Google detecta el idioma real del contenido y puede ignorar el hreflang del sitio entero cuando encuentra estas inconsistencias.

Decisión de negocio, no técnica: o se traducen los artículos, o `/en/blog` sale del inventario y del par hreflang.

### 8. Sitemap sin `lastmod`

41 URLs, cero etiquetas `<lastmod>`. La tabla `posts` ya guarda `updated_at` (`src/lib/cms.ts:77`), así que el dato existe. Sin `lastmod`, Google decide por su cuenta cuándo volver, y en un sitio con blog activo eso significa artículos nuevos tardando semanas en indexarse.

### 9. Los H1 no cargan ninguna keyword

Los encabezados están escritos para la marca, no para la búsqueda:

- `/` → "Cumplir con la ANLA, crecer con propósito." (ANLA sí aparece, es el mejor del sitio)
- `/quienes-somos` → "Agentes de cambio ambiental positivo."
- `/casos` → "Cómo trabajamos, caso por caso."
- `/contacto` → "Un diagnóstico para empezar."

No hay que sacrificar el tono. El `<h1>` es la señal de tema más fuerte de la página después del `<title>`, y hoy tres de las cuatro páginas principales no le dicen a Google de qué tratan. Una segunda línea o un `lede` con el término real ("consultoría ambiental", "gestor RAEE en Bogotá") recupera la señal sin tocar la voz de marca.

---

## P2 — Detalles y consistencia

### 10. Falta `twitter:image` en el layout español

`LayoutEn.astro:65` lo emite. `Layout.astro` no. Verificado sobre el build: 1 ocurrencia en `/en/`, 0 en `/`. Twitter cae en `og:image` como respaldo, así que el daño es limitado, pero es una divergencia entre dos layouts que deberían ser espejo.

### 11. Los artículos se anuncian como `website`, no como `article`

`Layout.astro:71` fija `og:type="website"` para todo, artículos incluidos. Faltan `article:published_time`, `article:author` y `article:section`, que además son la entrada natural al `BlogPosting` del punto 1.

Obstáculo real: el campo `date` guarda texto libre en español (`"26 ago 2025"`, `src/data/blog-posts.json`). Para emitir `datePublished` hace falta una fecha ISO. Lo limpio es añadir una columna ISO a `posts` y dejar la cadena actual solo para presentación.

### 12. No hay página 404

No existe `src/pages/404.astro`. Vercel sirve su 404 genérico: sin navegación, sin marca, sin ruta de vuelta al sitio. Cada enlace roto o URL vieja termina en un callejón sin salida.

### 13. `trailingSlash` sin configurar

`astro.config.mjs` no lo declara, así que queda en `'ignore'`. `/servicios` y `/servicios/` responden ambas 200 con el mismo contenido. Los canonical lo resuelven, pero fijar `trailingSlash: 'never'` elimina la duplicación en origen.

### 14. Ni analítica ni verificación de Search Console

Sin `google-site-verification`, sin `@vercel/analytics`, sin Speed Insights. No es SEO en sí, pero sin Search Console no hay forma de ver qué consultas traen impresiones, qué páginas quedaron fuera del índice ni si el sitemap se procesó. Auditar de nuevo dentro de tres meses sin estos datos sería adivinar.

---

## Orden de ejecución sugerido

| # | Acción | Retorno | Estado |
|---|---|---|---|
| 1 | Descripciones únicas desde `rutas.ts` | Alto | ✅ Hecho |
| 2 | JSON-LD `Organization` + `LocalBusiness` | Alto | ✅ Hecho |
| 3 | Títulos reescritos y marca unificada en Ekosolv | Alto | ✅ Hecho |
| 4 | Resolver el conflicto `Disallow` + `noindex` | Alto | ✅ Hecho |
| 5 | Migrar imágenes a `astro:assets` | Alto (CWV) | ✅ Hecho |
| 6 | `BlogPosting` con fecha ISO | Medio | ✅ Hecho (con la salvedad del punto 11) |
| 7 | `lastmod` y sitemap que vea los posts del CMS | Medio | Pendiente — P1 #6 y #8 |
| 8 | Decidir qué pasa con `/en/blog` | Medio | Pendiente — P1 #7 |
| 9 | H1 con keywords | Medio | Pendiente — P1 #9 |
| 10 | Página 404 y `trailingSlash` | Bajo | Pendiente — P2 #12 y #13 |
| 11 | Search Console y analítica | Habilitante | Pendiente — P2 #14 |

Los puntos 7 y 8 son los siguientes con retorno real: el sitemap que no ve los artículos nuevos es lo que está frenando la indexación del blog, y `/en/blog` es una decisión de negocio antes que técnica.
