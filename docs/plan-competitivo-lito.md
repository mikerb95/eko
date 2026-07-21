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

## Fase 0 — Higiene previa (bloqueante)

No se publica nada de las fases siguientes hasta cerrar esto. Dos de los tres puntos son riesgos de credibilidad activos.

| # | Tarea | Archivo | Notas |
|---|---|---|---|
| 0.1 | Unificar trayectoria a 2013 | `src/pages/index.astro:198`, `src/pages/ekoraee.astro` (meta) | "Siete años" → "Trece años". Barrer todo el repo por otras menciones. |
| 0.2 | Quitar los 6 logos de clientes ficticios | `src/pages/index.astro:229-236` | `Nodex`, `Andina.tech`, `Kairos`, `Ferra`, `Origen`, `Meridian` son inventados. **Sale ya**, aunque el reemplazo real llegue en la Fase 3. |
| 0.3 | Cerrar hallazgos críticos de `AUDITORIA.md` | `src/lib/auth.ts`, `.gitignore` | Credenciales por defecto y `.vercel/output/` versionado. Bloqueante para la Fase 5 (subastas con usuarios públicos) y para poder vender seguridad a Lito. |

**Pregunta abierta 0.a** — ¿Los archivos de `src/storyblok/` y `src/data/pages/*.json` se eliminan o se conservan? Hoy son peso muerto que confunde. Recomiendo eliminarlos si `[...slug].astro` no sirve ninguna ruta en producción; verificar primero.

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
- [ ] 1.1 Validar y corregir los 5 beneficios con el equipo
- [ ] 1.2 Maquetar la sección reutilizando los estilos de tarjeta existentes (sin CSS nuevo si se puede)
- [ ] 1.3 Réplica en `src/pages/en/index.astro`
- [ ] 1.4 Renumerar los `eyebrow` de las secciones siguientes

**Preguntas abiertas**
- 1.a ¿Cuál es el compromiso real de tiempo de respuesta? Sin dato, el beneficio 5 se cae.
- 1.b ¿"Cero sanciones en firme" sigue vigente en 2026 y es defendible si un prospecto lo cuestiona?

---

## Fase 2 — Cifras al hero y mensaje por línea de servicio

**Por qué:** Lito pone "+150 empresas" y "+20 años" arriba del fold. Tu mejor cifra ("1.000 toneladas gestionadas desde 2013") está enterrada en un `<meta description>` de EKORAEE, donde ningún humano la lee.

**Tareas**
- [ ] 2.1 Subir 3 cifras al hero de `index.astro` (bajo el `lede`, antes del `hero-card`)
- [ ] 2.2 Revisar el bloque "Por los números" para que no repita lo que ya diga el hero
- [ ] 2.3 Sustituir el `eyebrow` geográfico actual (`… · Bogotá · Colombia`) por el encuadre por línea de servicio: consultoría remota a todo el país, logística RAEE con su propio alcance
- [ ] 2.4 Añadir a `ekoraee.astro` una nota explícita de alcance geográfico de recolección
- [ ] 2.5 Réplica en `/en`

**Cifras candidatas** *(elegir 3, corregir valores)*: 1.000+ toneladas RAEE gestionadas · 13 años · 98% radicaciones aprobadas · 0 sanciones en firme · 4 líneas integradas.

**Preguntas abiertas**
- 2.a ¿La cifra de toneladas está actualizada a 2026? "1.000+ desde 2013" suena conservador para 13 años.
- 2.b ¿Cuántas empresas atendidas? Es la cifra que Lito usa (+150) y la única en la que hoy no podemos responder.
- 2.c ¿La recolección RAEE es Bogotá, nacional vía aliados, o depende del volumen?

---

## Fase 3 — Confianza: licencias, testimonios, clientes

Tienes los tres activos. Esta fase es la que más mueve la aguja en venta B2B y en licitaciones, donde el jurídico del cliente filtra por documentos verificables.

**Tareas**
- [ ] 3.1 Publicar licencias/autorizaciones en `public/docs/` y enlazarlas desde el footer (`Legal`) y desde `quienes-somos`
- [ ] 3.2 Página o bloque "Licencias y autorizaciones" con número de resolución, entidad y vigencia — no solo el PDF suelto
- [ ] 3.3 Sección de testimonios reales con nombre, cargo y empresa
- [ ] 3.4 Reponer logos de clientes reales (los eliminados en 0.2)
- [ ] 3.5 Completar los enlaces legales del footer, hoy sin `href`: *Política de tratamiento*, *Términos de servicio*, *Código de ética*
- [ ] 3.6 Réplica en `/en`

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
