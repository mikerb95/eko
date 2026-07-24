# Oportunidad comercial: Ekosolv (cliente directo)

**Fecha de verificación:** 2026-07-21
**Objetivo:** cold call a Ekosolv (www.ekosolv.com) ofreciendo el nuevo sitio (este repo, Astro + Storyblok) como reemplazo del Wix actual.

> Nota: esto es una gestión distinta a `oportunidad_lito.md` (ahí Ekosolv es el "aliado/beneficiario" frente a un competidor). Aquí Ekosolv es el prospecto directo.

---

## 1. Hallazgos verificados sobre www.ekosolv.com (hoy)

### Tecnología
- **Wix**, generado automáticamente (footer "Creado por Wix", imágenes servidas desde `wixstatic.com`).
- `robots.txt` autogenerado por "SEO Tools > Robots.txt Editor" de Wix — configuración genérica, no personalizada.
- Bloquea **PetalBot** por completo, aplica retraso de 10s a **dotbot** y **AhrefsBot**, pero **no hay control sobre bots de scraping de IA** (GPTBot, CCBot, ClaudeBot, etc.) — su contenido (incluida propiedad intelectual de blog y fichas de servicio) se indexa libremente para entrenar modelos y para competidores.
- Vendor lock-in típico de Wix: sin acceso al código, integraciones limitadas a su marketplace de apps, sin posibilidad de headless/API, límites de rendimiento estructurales (JS pesado, entrega no optimizada vs. SSG).

### Confianza y prueba social (el punto más fuerte para el pitch)
- La página "Quiénes somos" dice textualmente: **"Contamos con 12 años de experiencia en el mercado colombiano y latinoamericano"** (fundada en 2013).
- **Cero cifras de impacto**: no hay toneladas gestionadas, número de clientes, ni resultados medibles — a pesar de mencionar campañas puntuales (Quibdó e Istmina, mayo 2024) sin resultados cuantificados.
- **Cero certificaciones mostradas** — crítico para una empresa cuyo negocio depende de licencias ambientales y cumplimiento normativo (RAEE, residuos peligrosos). Es el tipo de prueba que un comprador B2B/gobierno busca primero.
- **Cero testimonios de clientes reales.** La única cita es del CEO sobre su propio equipo, no de un cliente.
- Logos de "autoridades ambientales" en la home sin descripción — no queda claro qué relación tienen (¿alianza? ¿reconocimiento? ¿cliente?).

### Bilingüe (ES/EN)
- Sí existe versión en inglés (`/en`), pero está **a medio traducir**: títulos de sección en español ("NUESTROS SERVICIOS DE CONSULTORÍA") y textos mezclando ambos idiomas ("¡Discover the power of #GREENSTEPS!"). Para una empresa que vende a mercado latinoamericano/internacional, un sitio bilingüe inconsistente daña credibilidad frente a clientes o inversionistas extranjeros.

### Contenido / SEO
- Blog con solo 4 posts visibles, categorización mínima (2 categorías). **Último post: 26 ago 2025 — casi 11 meses sin publicar** (hoy es 21 jul 2026), lo que es una señal negativa de frescura para Google y para cualquier visitante que lo note.
- Un post con fecha aparentemente futura respecto a su publicación (posible error de configuración).
- Estructura de servicios clara (EKONSULTING, EKOPARTNER, EKORAEE, EKOTRADING) pero sin páginas de conversión diferenciadas por línea de negocio — un comprador de consultoría remota y un cliente que necesita recolección logística (EKORAEE) tienen necesidades y objeciones distintas, y el sitio los trata igual.

### Conversión
- CTA principal genérico ("Más información"), sin lead magnets ni formularios segmentados por servicio.
- Contacto vía WhatsApp usando un enlace acortado `bit.ly/453FSCm` en vez de un botón nativo con tracking — se pierde atribución de conversión y luce menos profesional/confiable que un widget de chat directo.
- Sin chat en vivo, sin calculadora/cotizador, sin caso de éxito descargable — nada que capture leads calificados más allá de "escríbenos".

### Aspectos que sí funcionan (reconocerlos da credibilidad al pitch)
- Diseño visualmente limpio y coherente con la marca (verde, ESG).
- Imágenes optimizadas (AVIF).
- Mensaje de propósito/sostenibilidad bien redactado a nivel de tono.

---

## 2. El gancho para la llamada

La narrativa no es "su sitio se ve mal" (no es cierto, se ve bien). La narrativa es:

> **"Ekosolv vende confianza regulatoria y cumplimiento ambiental, pero su sitio no la demuestra."**

Una empresa que gestiona RAEE y residuos peligrosos vive de la credibilidad normativa. Su web actual:
- No muestra ni una cifra de impacto.
- No muestra ni una certificación o licencia ambiental (aunque internamente sí las tienen — dato confirmado: activos disponibles como PDFs de licencias, video corporativo, testimonios reales, ver `docs/` de este repo).
- Tiene una versión en inglés a medias, lo cual es peor que no tenerla — sugiere descuido justo en el área (cumplimiento, rigor) donde no pueden permitírselo.
- Lleva casi un año sin publicar contenido, mientras compite por autoridad de marca en un sector donde la regulación cambia constantemente (oportunidad de mostrar expertise vía blog).

## 3. Guion de apertura (borrador)

1. **Gancho de reconocimiento** (no ataque): "Vi la web de Ekosolv, se nota cuidado en la marca y el mensaje ESG. Los felicito por eso."
2. **Problema específico y verificable**: "Noté que en 'Quiénes somos' hablan de 12 años de trayectoria pero no hay ni una cifra de toneladas gestionadas ni certificaciones visibles — y en su sector eso es lo primero que un comprador corporativo o una entidad pública busca antes de firmar."
3. **Segundo problema, bilingüe**: "También vi que la versión en inglés está a medio traducir — para alguien evaluando Ekosolv desde afuera, eso comunica lo contrario de lo que su negocio vende: rigor."
4. **Puente a la oferta**: "Ya construí una versión nueva del sitio sobre una arquitectura más rápida y con panel de administración propio (Astro + Storyblok), pensada específicamente para resolver esto: fichas por línea de negocio (EKONSULTING vs EKORAEE, que tienen compradores distintos), sección de impacto con cifras reales, certificaciones y licencias visibles, paridad ES/EN real, y un blog con cadencia planeada."
5. **Cierre suave**: proponer una demo de 15 minutos mostrando el nuevo sitio en vivo, sin compromiso.

## 4. Objeciones esperadas
- **"Ya tenemos un sitio, funciona."** → Responder con el gap de confianza/cifras, no con estética.
- **"Wix es más barato/fácil de manejar nosotros mismos."** → Reconocer el punto, pero señalar el techo de Wix en SEO técnico, velocidad y que no pueden controlar bots de IA ni tener panel propio con datos reales (licencias, testimonios) versionados y auditables.
- **"¿Por qué confiar en un desarrollador externo/nuevo?"** → Mostrar la demo ya construida como prueba de trabajo, no una promesa.

## 5. Estado real del sitio nuevo vs. lo que promete el pitch (verificado 2026-07-21)

Revisé el repo contra las brechas que se le van a señalar a Ekosolv. Resultado mixto — hay que ajustar el guion antes de la llamada:

### Resuelto de verdad
- **`quienes-somos.astro`**: trayectoria dinámica (`yearsActive`, no hardcodeada), equipo con nombres reales, línea de tiempo con hitos verificables (ANLA REP+, COP16, Ministerio de Ambiente, Codechocó) — esto sí es más fuerte que el sitio actual y sí se puede mostrar en la demo.
- **`licencias.astro` / `src/lib/credenciales.ts`**: bien diseñado — placeholders con bandera `publicada`/`autorizado`, solo visibles en `DEV` con aviso, y fallback honesto en producción ("Estamos actualizando esta sección... se las enviamos el mismo día") en vez de mostrar datos falsos. El comentario en el propio archivo dice explícitamente que esto se hizo *porque antes hubo 6 logos de clientes inventados publicados por meses* — o sea, ya hay precedente de este error en el proyecto.
  - **Pero ojo:** ahora mismo todos los campos están en `PENDIENTE` — no hay ninguna licencia real cargada todavía. No se puede prometer en la llamada "mostramos sus licencias" sin antes cargar los PDFs reales.

### ⚠️ Riesgo real — no mostrar así en la demo
- **`casos.astro` (y su espejo `en/cases.astro`)**: a diferencia de `licencias.astro`, **no tiene ninguna guarda**. Es un arreglo hardcodeado de 6 "casos de éxito" con cifras inventadas y presentado como real: *"Expedientes reales, resultados medibles"*, *"$480M riesgo sancionatorio evitado"*, *"218 tiendas"*, *"$2.1B riesgo sancionatorio mitigado"*, con la excusa de "nombres bajo acuerdo de confidencialidad" para justificar que no hay cliente identificable. Esto es exactamente el mismo patrón de dato inventado que ya causó problema antes con los logos (ver nota en `credenciales.ts`), pero coló en una página nueva sin el mismo control.
  - **Riesgo:** si esto se muestra a Ekosolv (o a cualquier prospecto) como "así se ve su sitio nuevo", pueden pedir ver esos casos reales o notar que son de fantasía — daña la credibilidad justo en el argumento central del pitch (que ellos sí necesitan mostrar prueba real).
  - **Recomendación:** aplicarle a `casos.astro` la misma guarda que ya existe en `credenciales.ts` (placeholders solo en DEV, fallback honesto en producción) antes de usar este sitio en cualquier demo comercial.

- **`blog/index.astro`**: el texto dice *"{posts.length} artículos · actualizado semanalmente"* — pero los posts en `src/data/blog-posts.json` son **el mismo contenido copiado del blog actual de Ekosolv**, con la misma última fecha (26 ago 2025, ~11 meses de antigüedad) que se identificó como debilidad del sitio en vivo. La etiqueta "actualizado semanalmente" es una afirmación falsa dado el dato real. No se resolvió la brecha de frescura de contenido — solo se migró el mismo contenido estancado con una etiqueta que dice lo contrario.

## 6. Pendiente / a verificar antes de la llamada
- [x] **RESUELTO (2026-07-24):** `casos.astro`/`en/cases.astro` ya usan la guarda de `credenciales.ts` (`casosVisibles`, `hayAgregado`, `mostrarPlaceholders`); todos los casos están en `verificado:false`, así que en producción se muestra el fallback honesto, no las cifras inventadas. Además se suavizó el lede que aún afirmaba "mandatos con clientes reales / cifras que podemos sustentar".
- [x] **RESUELTO (2026-07-24):** quitado "actualizado semanalmente" / "updated weekly" en `blog/index.astro` y `en/blog/index.astro` (ahora "cumplimiento ambiental" / "environmental compliance", coherente con el texto de más abajo "promedio dos piezas al mes").
- [ ] Cargar al menos 1-2 licencias reales en `credenciales.ts` (con PDF y `publicada: true`) para poder mostrar la sección funcionando, no solo el fallback.
- [ ] Decidir si se ofrece como "rediseño completo" o "auditoría + propuesta" como puerta de entrada más barata de aceptar.
- [ ] Preparar 2-3 capturas de pantalla side-by-side (sitio actual vs. nuevo) para la demo — usando `quienes-somos` como la pieza más fuerte, no `casos`.

---

## 7. Discurso "no técnico" para el gerente

> Lenguaje de negocio, para reunión o llamada. Ordenado por bloque de beneficio. **Solo promete lo que la versión nueva entrega hoy** — no menciona datos que siguen en plantilla (licencias, casos), sino la *capacidad* de mostrarlos.

### 7.1. Apertura (reconocer, no atacar)
> "Antes que nada: la marca de Ekosolv está bien cuidada. El mensaje ambiental, el tono, el propósito ESG — eso está claro y se nota. Lo que quiero mostrarte no es un cambio de imagen, es cómo hacer que el sitio **trabaje** para vender lo que ustedes ya son."

### 7.2. El problema de fondo (en una frase)
> "Ekosolv vende confianza: cumplimiento, licencias, tranquilidad regulatoria. Pero el sitio actual no la *demuestra*. Habla de 12 años de trayectoria y no hay una sola cifra, una certificación visible, ni un testimonio de cliente. Y lo primero que hace un comprador corporativo o una entidad pública antes de firmar es buscar exactamente eso. Hoy no lo encuentra."

### 7.3. Lo que mejora — por lo que te importa

**Confianza (que es tu argumento de venta)**
> "El sitio nuevo tiene un lugar preparado para tus números reales: toneladas gestionadas, años, resultados. Una sección de licencias y certificaciones donde subimos tus PDF y quedan a la vista — con el detalle de que, mientras no haya un documento real cargado, el sitio nunca inventa nada: muestra un mensaje honesto. Nunca vas a quedar expuesto con datos de fantasía. Y una sección de casos y testimonios lista para cuando quieras publicar clientes reales."

**Conversión (que el visitante se vuelva contacto)**
> "Hoy tu botón de contacto es un enlace de WhatsApp acortado — y con eso pierdes rastro de cuánta gente realmente te escribe. En el sitio nuevo cada servicio tiene su propia página, porque el que busca consultoría no es el mismo que necesita recolección de electrónicos, y no hay que hablarles igual. Y hay un formulario para **agendar una recolección** directamente desde la web: el cliente deja sus datos y la solicitud te llega ordenada, no perdida en un chat."

**Retención y autoridad (que vuelvan y te tomen como referente)**
> "Hay un blog y un boletín para equipos ambientales — cambios de normativa, vencimientos, interpretaciones de la autoridad. En un sector donde la regulación cambia todo el tiempo, publicar eso te posiciona como el que sabe. Y a la vez captura correos de gente interesada que podés volver a contactar."

**Control y autonomía (que dejes de depender de una plantilla)**
> "Tenés un panel de administración propio: entrás, cargás una noticia, una normativa o revisás las solicitudes que llegaron — sin depender de nadie ni de una plataforma que decide por vos. Además la versión en inglés queda completa y bien hecha (hoy está a medio traducir, y eso, para alguien que te evalúa desde afuera, comunica descuido justo donde vendés rigor). Y el sitio carga más rápido y controla cómo se indexa tu contenido."

**Identidad (que siga siendo *tu* marca, mejor)**
> "Respetamos tus colores de siempre — el azul y el verde de Ekosolv están idénticos. Lo que subimos de categoría es la presentación: una tipografía más editorial que le da al sitio aire de consultora seria, no de plantilla genérica. El color es tu marca de siempre; el diseño es el salto de nivel."

### 7.4. Cierre (bajar la barrera)
> "No te estoy trayendo una promesa ni un boceto. El sitio ya está construido y funcionando — te lo muestro en vivo en 15 minutos. Si te hace sentido, seguimos; si no, te queda la auditoría de lo que encontramos. Sin compromiso."

### 7.5. Notas internas (NO decir en voz alta)
- Anclar la demo en **`quienes-somos`** (línea de tiempo ANLA/COP16/Ministerio, 100% real) y en el **panel + agenda de recolección** (funcionalidad que Wix no da). Evitar abrir casos/licencias vacías salvo para mostrar "acá van tus datos reales".
- Todo lo que promete el discurso ya existe en el sitio; lo único pendiente del lado de Ekosolv es **cargar los datos reales** (licencias, testimonios, cifras) para llenar los espacios preparados.
- Marca alineada (2026-07-24): azul `#124E7D` y verde `#179C91` idénticos al corporativo; arena `#D0B49A` en fidelidad total. Tipografía intencionalmente distinta (serif editorial + Geist) como diferenciador premium, no como copia de las fuentes default de Wix (Avenir/DIN Neuzeit).

---

## 8. Guion corto — llamada de 2 minutos

> Versión condensada de la sección 7 para el primer contacto telefónico. Objetivo único de la llamada: **conseguir la demo de 15 minutos**, no cerrar nada. Tono de colega, no de vendedor. No mencionar antecedentes laborales ni el reclamo pasado (ver contexto sensible en la memoria del proyecto); si el gerente lo saca, se resuelve hablado.

**[0:00 – Reconocimiento]**
> "Hola [nombre], te robo dos minutos. Estuve viendo la web de Ekosolv — la marca y el mensaje ambiental están muy bien cuidados, los felicito por eso."

**[0:20 – El gancho, un solo problema]**
> "Pero noté algo: el sitio habla de más de diez años de trayectoria y no muestra ni una cifra, ni una certificación, ni un testimonio de cliente. Y en su negocio, que vende cumplimiento y confianza, eso es justo lo primero que busca un comprador corporativo o una entidad pública antes de contratar."

**[0:50 – La oferta, sin tecnicismos]**
> "Ya armé una versión nueva del sitio pensada para resolver eso: un lugar para sus números y sus licencias reales, una página por cada servicio, un formulario para agendar recolecciones, y un panel propio para que lo manejen ustedes sin depender de la plantilla actual. Sus colores de marca están idénticos — no es un sitio distinto, es el mismo Ekosolv mejor presentado."

**[1:30 – El cierre, bajar la barrera]**
> "No es una promesa, ya está construido y funcionando. ¿Te muestro en vivo, 15 minutos, esta semana? Si te sirve seguimos, y si no, igual te queda la auditoría de lo que encontré. Sin compromiso."

**[Si duda / objeción típica]**
> - *"Ya tenemos sitio, funciona."* → "Totalmente, y se ve bien. No te hablo de estética: te hablo de que hoy no está mostrando la prueba de confianza que tu comprador necesita. Eso es lo que resuelve."
> - *"¿Cuánto cuesta?"* → "Depende del alcance, pero por eso mejor te lo muestro primero: ves qué es y ahí hablamos de números con contexto. ¿15 minutos esta semana?"
