# Plan competitivo — respuesta a Lito

**Origen:** análisis de https://lito.com.co/ (ver `oportunidad_lito.md` para el ángulo comercial).
**Fecha:** 2026-07-21
**Objetivo:** cerrar la brecha de conversión y confianza frente a Lito, sin imitar su catálogo industrial.

## Decisiones ya tomadas

| Tema | Decisión |
|---|---|
| Alcance | Las 6 sugerencias, por fases; se puede parar al final de cualquier fase |
| Subastas | Extender lo existente (`libsql`, `src/lib/auth.ts`, `users.ts`, `/admin`) |
| Datos y copy | Propongo borradores marcados como no verificados; tú corriges |
| Trayectoria | **Desde 2013 (13 años)** — corregir el "Siete años" de la home |
| Logos de clientes | Reemplazar los placeholders por clientes reales con autorización |
| Cobertura | La consultoría es remota; separar el mensaje por línea de servicio |
| Inglés | Paridad permanente: cada tarea incluye su equivalente en `/en` |
| Activos disponibles | Video corporativo ✅ · Licencias PDF ✅ · Testimonios reales ✅ |

## Contexto técnico relevante

La home real es **`src/pages/index.astro`**, markup de Astro escrito a mano. `src/data/pages/home.json` y todo `src/storyblok/` son **residuo de la plantilla original** (`astro-storyblok-finance-starter`) y solo los consume `src/pages/[...slug].astro`. Los cambios de contenido de este plan se hacen en los `.astro`, no en el JSON.

**Secciones actuales de la home:** hero → Líneas de servicio (01) → EKORUTA (02) → Por los números → Clientes (03) → footer.

---

## Fase 0 — Higiene previa (bloqueante) ✅ COMPLETADA

| # | Tarea | Estado |
|---|---|---|
| 0.1 | Unificar trayectoria a 2013 | ✅ Resuelto con `src/lib/brand.ts` como fuente única |
| 0.2 | Quitar los 6 logos de clientes ficticios | ✅ Sección "Clientes" retirada en ES y EN |
| 0.3 | Cerrar hallazgos críticos de `AUDITORIA.md` | ✅ Ya estaban resueltos, salvo `path-to-regexp` (ver abajo) |

**0.1 —** En vez de corregir cuatro números a mano se creó **`src/lib/brand.ts`**: `FOUNDED_YEAR`, `yearsActive` calculado, `stats` y `yearsSpelled(lang)`. Consumido por `index.astro`, `en/index.astro`, `quienes-somos.astro` y `en/about.astro`.

Se encontró además que `/en/about` tenía **"12 years" escrito a mano** y ya desactualizado — el fallo exacto que la fuente única elimina. Esto adelanta la tarea 6.4.

**0.2 —** Se retiró la sección completa (no solo los logos): dejar el encabezado sobre una rejilla vacía quedaba peor. Hay un comentario en el código de ambas homes apuntando a la Fase 3 para que nadie la reponga por error.

**0.3 — `AUDITORIA.md` está desactualizado.** Verificado uno por uno: `auth.ts` ya lanza error en producción en vez de usar fallback; las credenciales viven en la tabla `users`; `/api/admin/login.ts` ya usa `checkRateLimit`; `.vercel/` y `data/*.db` están ignorados y sin rastrear; `bun.lock` ya no existe.

> ⚠️ **Pendiente real:** 5 vulnerabilidades de npm (4 altas). `path-to-regexp` vía `@vercel/routing-utils` exige subir a **`@astrojs/vercel@11`**, que es un cambio incompatible. No se aplicó: debe probarse en un preview de Vercel antes de tocar producción.

**Pregunta abierta 0.a** — ¿Los archivos de `src/storyblok/` y `src/data/pages/*.json` se eliminan o se conservan? Hoy son peso muerto que confunde. Recomiendo eliminarlos si `[...slug].astro` no sirve ninguna ruta en producción; verificar primero.

**Nota de repositorio** — El repo **auto-commitea cada edición**. Además, `.gitignore:33` contiene `oportunidad_lito.md`, por lo que ese documento **no está en git**: existe solo en disco local. Decidir si es intencional.

---

## Fase 1 — Los 5 beneficios operativos *(mayor impacto / menor esfuerzo)*

**Por qué:** es lo mejor que hace Lito. Ellos no dicen "gestionamos residuos", dicen "reducimos su carga administrativa" y "un solo proveedor le baja el costo de custodia". Hablan del dolor del cliente, no del servicio propio.

**Dónde:** sección nueva en `src/pages/index.astro`, entre EKORUTA (02) y "Por los números". Numerarla como `Por qué Ekosolv · 03` y recorrer la numeración de Clientes a `04`.

**Borradores propuestos** *(no verificados — corregir)*:

1. **Una sola contraparte para todo el ciclo.** Licenciamiento, recolección, disposición y certificado salen del mismo proveedor. Sin coordinar tres empresas ni tres formatos.
2. **El expediente lo armamos nosotros.** Radicaciones, respuestas a requerimientos y soportes ANLA gestionados de punta a punta. Su equipo no redacta.
3. **Certificado de disposición final trazable.** Cada lote con su documento, listo para auditoría o para el informe de sostenibilidad.
4. **Cero sanciones en firme entre clientes activos.** *(dato ya presente en la home, verificar vigencia)*
5. **Respuesta en días, no en semanas.** *(PENDIENTE-DATO: definir el compromiso real de tiempo — es el diferenciador más creíble frente a un competidor de 20 años y estructura pesada)*

**Tareas**
- [ ] 1.1 **Validar y corregir los 5 beneficios con el equipo** ← único punto pendiente
- [x] 1.2 Maquetar la sección reutilizando los estilos de tarjeta existentes
- [x] 1.3 Réplica en `src/pages/en/index.astro`
- [x] 1.4 Numeración de secciones coherente (01, 02, 03)

**Implementado.** Sección `Por qué Ekosolv · 03` entre EKORUTA y "Por los números", en ES y EN. Reutiliza la rejilla `.services` de 12 columnas con layout 3+2; el CSS nuevo se limitó a tres reglas en `global.css`:
- `.svc.half` (span 6) para las dos tarjetas inferiores
- `.svc.static` — quita `cursor: pointer`, que en tarjetas informativas simulaba falsamente que se puede hacer clic

El copy está marcado **en el propio código** con comentarios `BORRADORES SIN VALIDAR` y `PENDIENTE-DATO 1.a`, para que nadie lo publique como definitivo por descuido.

**Preguntas abiertas**
- 1.a ¿Cuál es el compromiso real de tiempo de respuesta? Sin dato, el beneficio 5 se cae.
- 1.b ¿"Cero sanciones en firme" sigue vigente en 2026 y es defendible si un prospecto lo cuestiona?

---

## Fase 2 — Cifras al hero y mensaje por línea de servicio

**Por qué:** Lito pone "+150 empresas" y "+20 años" arriba del fold. Tu mejor cifra ("1.000 toneladas gestionadas desde 2013") está enterrada en un `<meta description>` de EKORAEE, donde ningún humano la lee.

**Tareas** — ✅ IMPLEMENTADA (pendiente validar cifras)
- [x] 2.1 Franja `.hero-stats` con 3 cifras, entre `hero-foot` y `hero-visual`
- [x] 2.2 Bloque "Por los números" replanteado para no repetir el hero
- [x] 2.3 `eyebrow` del hero reencuadrado por línea de servicio
- [x] 2.4 Nota de alcance en `ekoraee.astro` (ES y EN)
- [x] 2.5 Réplica en `/en`

**Reparto de cifras** — se dividió para que hero y `band` no compitan:

| Bloque | Cifras | Rol |
|---|---|---|
| Hero | 13 años · 1.000+ ton RAEE · 10 normativas | Escala y trayectoria |
| Band "Por los números" | 98% · 0 sanciones · 4 líneas | Desempeño |

El titular del band pasó de *"Trece años acompañando la industria tech"* (que duplicaba el hero) a **"Resultados que resisten una auditoría."** / *"Results that hold up to an audit."*

**Tercera cifra del hero:** se usó `normativas.length` (10) porque es un dato real derivado de `src/data/normativas.json`, no inventado. Cuando exista el número de empresas atendidas (**2.b**) conviene sustituirla — es la cifra que usa la competencia.

**`eyebrow` del hero:** `… · Bogotá · Colombia` → `… — consultoría en toda Colombia`. Las coordenadas de Bogotá del radar se conservan: describen la base de operaciones, que sigue siendo cierto.

**Localización de cifras:** `tonnesManaged(lang)` en `brand.ts` formatea el separador de miles por locale (`1.000+` en es-CO, `1,000+` en en-US). Escribirlo a mano en cada plantilla es exactamente cómo se cuela una errata.

**2.4 —** Como **2.c sigue sin respuesta**, la nota de EKORAEE no afirma cobertura: *"La asesoría normativa se presta de forma remota en todo el país. La recolección se coordina caso a caso según volumen y ubicación — escríbenos y confirmamos cobertura antes de agendar."* Marcada con `PENDIENTE-DATO 2.c` en el código.

**Preguntas abiertas**
- 2.a ¿La cifra de toneladas está actualizada a 2026? "1.000+ desde 2013" suena conservador para 13 años.
- 2.b ¿Cuántas empresas atendidas? Es la cifra que Lito usa (+150) y la única en la que hoy no podemos responder.
- 2.c ¿La recolección RAEE es Bogotá, nacional vía aliados, o depende del volumen?

---

## Fase 3 — Confianza: licencias, testimonios, clientes

Tienes los tres activos. Esta fase es la que más mueve la aguja en venta B2B y en licitaciones, donde el jurídico del cliente filtra por documentos verificables.

**Tareas** — 🟡 ESTRUCTURA LISTA, PENDIENTE DE DATOS
- [x] 3.1 Estructura de datos y convención `public/docs/` definida
- [x] 3.2 Página `/licencias` + `/en/licenses` con resolución, entidad, vigencia y PDF
- [x] 3.3 Sección de testimonios en la home (ES y EN)
- [x] 3.4 Sección de clientes repuesta, ahora alimentada por datos
- [ ] 3.5 Enlaces legales del footer — **no ejecutado**, ver bloqueo abajo
- [x] 3.6 Réplica en `/en`

### El guardarraíl: `src/lib/credenciales.ts`

Los placeholders quedan puestos y listos para rellenar, pero **no pueden llegar a producción**. Cada entrada lleva una bandera (`publicada`, `autorizado`) que por defecto es `false`, y las páginas consumen solo los selectores (`licenciasVisibles()`, `testimoniosVisibles()`, `clientesVisibles()`), nunca los arrays crudos.

- **En desarrollo** (`import.meta.env.DEV`): se ven los placeholders con un aviso naranja `.dev-warning` que dice qué falta.
- **En producción**: sin datos reales, las secciones **no se renderizan en absoluto**.

Verificado en el build: 0 apariciones de `PENDIENTE` y 0 bloques `dev-warning` en `.vercel/output/static`. Verificado también a la inversa con el servidor de desarrollo: allí sí aparecen.

Esto responde a la lección de la Fase 0 — los seis logos falsos llevaban meses publicados. Ahora eso es estructuralmente imposible.

**Para activar cada cosa:**
| Qué | Dónde | Requisito |
|---|---|---|
| Licencia | `licencias[]` → `publicada: true` | PDF en `public/docs/` |
| Testimonio | `testimonios[]` → `autorizado: true` | Autorización escrita del cliente |
| Logo de cliente | `clientes[]` → `autorizado: true` | Autorización de uso de marca |

La página `/licencias` **ya es útil sin datos**: muestra un estado vacío honesto ("Estamos actualizando esta sección") con CTA a solicitar los documentos, en vez de una página rota.

### 3.5 — Footer unificado ✅

**Resuelto.** El footer estaba copiado a mano en **28 páginas con 11 variantes distintas**, toda deriva accidental:

- Dos descripciones de empresa diferentes conviviendo
- Las páginas de servicio (`ekoraee`, `ekonsulting`, `ekopartner`, `ekotrading`, `agenda-una-recoleccion` y sus equivalentes en `/en`) **no tenían columna Legal**
- Columnas que aparecían y desaparecían sin criterio

Ahora hay un solo **`src/components/SiteFooter.astro`**. Las páginas solo pueden cambiar el titular:

```astro
<SiteFooter />                        <!-- español -->
<SiteFooter lang="en" />              <!-- inglés -->
<SiteFooter headline={`…`} />         <!-- titular a medida -->
```

El único titular distinto del sitio (`oportunidades2630`: *"¿Hablamos de la fase 1?"*) se preservó.

**Enlaces legales:** *Licencias y autorizaciones* → `/licencias` (ES) y `/en/licenses` (EN), ya en las 25 páginas con footer. Los otros tres (*Política de tratamiento*, *Términos de servicio*, *Código de ética*) se renderizan atenuados con `data-pending` y **sin `<a>`**, porque los documentos no existen (**3.c**). Un enlace legal roto es peor que un texto sin enlace — la Política de Tratamiento es obligación de la Ley 1581 de 2012.

Para activarlos: redactar el documento, crear la página y poner el `href` en `SiteFooter.astro`. Un solo sitio, no 28.

**Efecto lateral:** `.foot-cols` pasó de `2fr 1fr 1fr 1fr` a `2fr repeat(4, 1fr)` con un breakpoint intermedio a 1100px, ahora que todos los footers tienen cuatro columnas.

### 🔴 Bloqueo original en 3.5 (ya resuelto, se conserva como registro)

El footer está **duplicado a mano en 18+ páginas** (`index`, `casos`, `servicios`, `contacto`, `normativas`, `quienes-somos`, `oportunidades2630`, `blog/[slug]`… y sus equivalentes en `/en`). Existe un `src/components/Footer.astro` **que no usa nadie**.

Añadir los enlaces legales significa editar el mismo bloque 18 veces, y lo mismo pasará con cualquier cambio futuro de footer. **Recomiendo refactorizar a componente único antes de tocar 3.5**, no después.

Además, 3.5 depende de la pregunta **3.c**: los tres documentos legales (*Política de tratamiento*, *Términos de servicio*, *Código de ética*) no existen redactados. No se enlazaron a páginas vacías: un enlace legal roto es peor que un texto sin enlace, sobre todo en la Política de Tratamiento de Datos, que en Colombia es una obligación de la Ley 1581 de 2012.

**Preguntas abiertas**
- 3.a ¿Tenemos **autorización escrita** de cada cliente para usar su marca y su cita? Sin esto, 3.3 y 3.4 no salen.
- 3.b ¿Qué licencias existen exactamente y cuáles son publicables? ¿Hay alguna en trámite que no convenga mostrar?
- 3.c Los documentos legales del footer, ¿existen redactados o hay que producirlos?
- 3.d ¿Publicamos PDF directo o una página HTML por licencia? (HTML posiciona en Google; el PDF da la sensación de documento oficial. Recomiendo ambas: página con los datos + enlace al PDF.)

---

## Fase 4 — Video corporativo

**Por qué:** Lito lo pone alto en la home. En industria pesada el comprador quiere ver camiones, planta y personas reales antes de confiar.

**Tareas**
- [ ] 4.1 Definir ubicación (recomiendo entre hero y Líneas de servicio)
- [ ] 4.2 Implementar con carga diferida — **sin embed de YouTube directo**: usar fachada con póster que solo cargue el iframe al hacer clic, para no destruir el rendimiento actual
- [ ] 4.3 Subtítulos en español e inglés (sirve para paridad `/en` y para accesibilidad)
- [ ] 4.4 Transcripción en texto (SEO + `llms.txt`)

**Preguntas abiertas**
- 4.a ¿Dónde está alojado el video: YouTube, Vimeo o archivo propio?
- 4.b ¿Duración y contenido? Si supera ~90 s conviene una versión corta para la home.
- 4.c ¿Tiene audio en español con opción de subtítulo en inglés, o hay dos versiones?

---

## Fase 5 — Plataforma de subastas / EKOTRADING *(proyecto grande)*

**Por qué:** es el activo digital más fuerte de Lito y el que genera tráfico recurrente y base de datos de compradores. Encaja directo con EKOTRADING, que hoy solo se describe en prosa.

**Precondición dura:** Fase 0.3 cerrada. No se abre registro público sobre un `auth.ts` con credenciales por defecto.

**Arquitectura acordada:** extender `data/cms.db` (libsql), `src/lib/auth.ts`, `src/lib/users.ts` y el panel `/admin`.

**Sub-fase 5A — Catálogo público (sin login)**
- [ ] Modelo de datos `lots`: código de proceso, título, categoría, descripción, fotos, estado (activo/cerrado), fechas
- [ ] CRUD en `/admin`
- [ ] Listado público `/oportunidades` con filtro por categoría y estado
- [ ] Ficha de lote con galería
- [ ] Manifestación de interés vía formulario (reusar el patrón de `src/pages/api/recolecciones.ts`)

**Sub-fase 5B — Cuentas de comprador**
- [ ] Registro y verificación de correo
- [ ] Separar la sesión pública del admin interno (**no compartir el mismo secreto ni la misma cookie**)
- [ ] Perfil de comprador con datos de empresa y NIT
- [ ] Rate limiting (ya existe `src/lib/rateLimit.ts`)

**Sub-fase 5C — Pujas y notificaciones**
- [ ] Registro de pujas con marca de tiempo y auditoría
- [ ] Cierre automático por fecha
- [ ] Suscripción por categoría de material y aviso por correo de lotes nuevos — **esto es lo que Lito no tiene** y es la ventaja real, no la subasta en sí
- [ ] Notificación de superación de puja

**Preguntas abiertas** *(no bloquean 5A; sí bloquean 5C)*
- 5.a ¿Es subasta real con pujas vinculantes, o "manifestación de interés" como hace Lito? Cambia por completo el alcance legal.
- 5.b Si hay pujas vinculantes: ¿términos y condiciones, garantías, resolución de disputas? Necesita abogado, no solo código.
- 5.c ¿Compradores verificados manualmente (RUT/NIT) o registro abierto?
- 5.d ¿Envío de correo con qué proveedor? Hoy no hay ninguno en `package.json`.
- 5.e ¿`data/cms.db` está versionado en git? Con datos de usuarios reales eso no puede seguir así.
- 5.f ¿Va en español únicamente o también `/en`? La paridad aquí cuesta bastante más que en una página de contenido.
- 5.g ¿Volumen esperado de lotes por mes? Bajo volumen puede no justificar 5B/5C.

---

## Fase 6 — Sincronización de inglés y cierre

- [ ] 6.1 Auditar paridad ES/EN de todo lo anterior
- [ ] 6.2 Actualizar `llms.txt` y `llms-full.txt` con el contenido nuevo
- [ ] 6.3 Revisar `src/locales/es.json` y `en.json` por cadenas huérfanas
- [ ] 6.4 Verificar que las cifras sean idénticas en ambos idiomas (fuente única, no números escritos a mano dos veces)

---

## Orden recomendado y esfuerzo

| Fase | Esfuerzo | Impacto | Depende de |
|---|---|---|---|
| 0 — Higiene | Bajo | Riesgo evitado | — |
| 1 — Beneficios | Bajo | **Alto** | 0 |
| 2 — Cifras | Bajo | **Alto** | 0, datos |
| 3 — Confianza | Medio | **Alto** | Autorizaciones legales |
| 4 — Video | Bajo-medio | Medio | Video listo |
| 5 — Subastas | **Alto** | Alto a largo plazo | 0.3, definición legal |
| 6 — Inglés | Bajo | Mantenimiento | Todas |

**Ruta corta si hay que priorizar:** 0 → 1 → 2. Son días de trabajo y cubren lo que más pesa en la decisión de compra. Todo lo demás puede esperar.

---

## Lo que deliberadamente NO copiamos de Lito

- **Su catálogo industrial** (plantas, laboratorio, flota). No se compite con capex ajeno desde una consultora.
- **Su stack.** WordPress con cuatro capas de add-ons de Elementor, comprometido con inyección SEO. Astro ya lo supera ampliamente.
- **Su enfoque de volumen.** Ellos venden escala y 20 años. Nosotros vendemos criterio normativo y velocidad. Copiar su mensaje nos pone a perder en su terreno.

---

## Preguntas transversales pendientes

- T.a ¿Hay analítica instalada? Sin medir, no sabremos si la Fase 1 y 2 funcionaron. La plantilla original traía PostHog pero no lo veo en `package.json`.
- T.b ¿Existe una guía de marca (tono, colores, tipografía) o el criterio es lo que ya está en `global.css`?
- T.c ¿Quién aprueba el copy antes de publicar?
- T.d ¿Hay fecha objetivo o algún evento comercial que condicione el orden?
- T.e ¿El sitio recibe tráfico hoy? Cambiar la home sin línea base es trabajar a ciegas.
