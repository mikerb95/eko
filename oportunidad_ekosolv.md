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

## 5. Pendiente / a verificar antes de la llamada
- [ ] Confirmar con Mike si el nuevo sitio (este repo) ya tiene resueltas las brechas mencionadas (cifras reales, certificaciones, blog activo) antes de prometerlas en la llamada.
- [ ] Decidir si se ofrece como "rediseño completo" o "auditoría + propuesta" como puerta de entrada más barata de aceptar.
- [ ] Preparar 2-3 capturas de pantalla side-by-side (sitio actual vs. nuevo) para la demo.
