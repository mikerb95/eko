# Ekosolv

Sitio web corporativo y panel de operaciones de **Ekosolv S.A.S.** (NIT 900.659.506-9),
gestor de residuos de aparatos eléctricos y electrónicos (RAEE) en Colombia.

No es solo un sitio institucional: el mismo despliegue sirve las páginas públicas
en español e inglés, recibe las solicitudes de recolección y los mensajes de
contacto, atiende a los visitantes con un asesor con IA y expone un panel interno
donde el equipo gestiona el ciclo de vida de cada orden, vigila los expedientes
ambientales de sus clientes y consulta todo desde un asistente con IA.

## Stack

| Pieza | Qué se usa |
|---|---|
| Framework | Astro 7 (`output: 'static'` con render on-demand por página) |
| Hosting | Vercel (`@astrojs/vercel` 11, Fluid Compute) |
| Base de datos | libSQL: archivo local en desarrollo, Turso (integración del Marketplace) en producción |
| Estilos | Tailwind 4 (vía `@tailwindcss/vite`) + CSS propio |
| Animación | GSAP en la portada (hero, radar normativo, escenas de beneficio) |
| IA | API de Claude (`@anthropic-ai/sdk`): asesor público, agente de cumplimiento y asistente del panel |
| Validación | Zod, para la salida estructurada del agente de cumplimiento |
| Email | Resend (API REST directa, sin SDK) |
| CRM / facturación | Zoho CRM, Books y Campaigns (API REST + OAuth self-client) |
| Pruebas | `node --test` para la lógica pura, Playwright para el panel en navegador |

La autenticación, el hash de contraseñas y el limitador de peticiones están
escritos contra WebCrypto y las APIs estándar de la plataforma, sin librerías.

## Arranque local

Requiere Node ≥ 22.12 (el repo fija 24 en `.nvmrc`).

```bash
nvm use
npm install
cp .env.example .env
npm run dev          # http://localhost:4321
```

Sin ninguna variable configurada el sitio levanta igual: la base cae al archivo
`data/cms.db`, que se crea y se siembra sola en el primer arranque desde
`src/data/blog-posts.json` y `src/data/normativas.json`. Los avisos por email,
Zoho y las funciones de IA quedan en no-op silencioso.

Para entrar al panel en local, define `ADMIN_USERNAME` y `ADMIN_PASSWORD` en el
`.env`: se siembran como primer administrador solo si la tabla `users` está vacía.

**Ojo con `.env.local`:** si lo bajaste de Vercel (`vercel env pull`), trae
`TURSO_DATABASE_URL` y apunta a la base de **producción**, que hoy es la misma
para Production, Preview y Development. Para desarrollar sin tocarla:

```bash
DATABASE_URL=file:./data/dev.db ASISTENTE_MODELO_FALSO=1 npm run dev
```

`DATABASE_URL` tiene prioridad sobre `TURSO_DATABASE_URL`, y el modelo simulado
deja probar el asistente del panel sin clave ni costo.

### Scripts

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción (Build Output de Vercel)
npm run preview    # previsualizar el build
npm test           # pruebas de lógica pura (node --test, sin red ni costo)
npm run test:e2e   # Playwright: panel y asistente con base temporal y modelo simulado
npm run migrate    # crea el esquema y siembra la base de .env.local
npx astro check    # chequeo de tipos
```

`npm run migrate` no es obligatorio (el esquema también se crea solo en la
primera petición), pero sirve para crearlo antes de desplegar y ver el
resultado. Se niega a correr sin URL de base para no sembrar el archivo local
creyendo que toca producción; `--local` es la salida explícita.

## Variables de entorno

Todas están documentadas con su procedimiento de obtención en
[`.env.example`](.env.example). Resumen:

| Variable | Para qué | Si falta |
|---|---|---|
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Base Turso, las inyecta y rota la integración de Vercel | Cae a `file:./data/cms.db` (solo sirve en local) |
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | Anulación explícita de la base (gana sobre las de Turso) | Se usan las de Turso |
| `AUTH_SECRET` | Firma HMAC de la cookie de sesión | **El arranque en producción falla a propósito** |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Primer admin en local y en `npm run migrate` | No se siembra ningún usuario |
| `RESEND_API_KEY`, `NOTIFY_FROM`, `NOTIFY_EMAIL` | Avisos internos por email | No-op: el dato se guarda igual |
| `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_DC` | CRM | No-op: los leads se acumulan en `zoho_outbox` |
| `ZOHO_BOOKS_ORG_ID` | Zoho Books | Books queda deshabilitado |
| `ZOHO_CAMPAIGNS_LISTKEY` | Lista de Campaigns para quien acepta comunicaciones | Las filas esperan en la bandeja sin gastar reintentos |
| `ANTHROPIC_API_KEY` | Asesor público, agente de cumplimiento y asistente del panel | El asesor no se ofrece, los actos quedan "esperando clave" y el asistente no responde |
| `AGENTE_MODELO` | Modelo del agente de cumplimiento | `claude-sonnet-5-5` |
| `ASESOR_TOPE_DIARIO_USD` | Tope de gasto diario del asesor público | US$1 |
| `ASISTENTE_MODELO_FALSO` | `1` para usar el modelo simulado del asistente | Usa la API real. Nunca se activa en Vercel |
| `PUBLIC_SITE_URL` | Canónicas, sitemap, OG | Cae a `https://ekosolv.com` |

El criterio general es *fail-soft*: si un servicio externo no está configurado o
está caído, la información del visitante se guarda de todos modos y el panel
sigue siendo la fuente de verdad. La única excepción deliberada es `AUTH_SECRET`,
donde un secreto conocido es peor que no arrancar.

## Estructura

```
src/
  pages/            Páginas ES en la raíz, EN bajo /en/, APIs en /api/
    api/            Endpoints públicos (contacto, recolecciones, asesor)
    api/admin/      Endpoints del panel, protegidos por sesión y rol
    admin/          Login, panel (index) y agente de cumplimiento
    docs/           Documentación interna (kanban, radar), no es para el cliente
  lib/              Lógica de negocio y acceso a datos
    asesor/         Asesor con IA de la burbuja pública
    agente/         Agente de cumplimiento normativo
    asistente/      Asistente con IA del panel
  data/             Contenido semilla y catálogos estáticos
  components/       Componentes Astro compartidos
  layouts/          Layout.astro (ES) y LayoutEn.astro (EN)
  middleware.ts     Protección de /admin y /api/admin + autorización por rol
public/admin/       JS y CSS del panel, del asistente y de cumplimiento
data/cms.db         Base local (ignorada por git)
docs/               Planes, análisis y borradores
e2e/                Pruebas de Playwright
scripts/migrate.mjs Creación del esquema y siembra
scripts/og/         Generación de las imágenes Open Graph
```

### Capa de datos (`src/lib/`)

| Archivo | Responsabilidad | Tablas |
|---|---|---|
| `db.ts` | Cliente libSQL único y arranque del esquema una sola vez por instancia | - |
| `esquema.ts` | Todo el SQL del esquema, compartido por la app y `scripts/migrate.mjs` | - |
| `cms.ts` | Blog y normativas, con estado de borrador, semilla desde JSON y *fallback* si la base no responde | `posts`, `normativas` |
| `ops.ts` | Órdenes de recolección: consecutivo `REC-AAAA-0001`, ciclo de estados, bitácora | `orders`, `order_events` |
| `contactos.ts` | Mensajes del formulario de contacto | `contacts` |
| `users.ts` | Usuarios, roles y contraseñas (PBKDF2-SHA256 con salt por usuario) | `users` |
| `reglasEscritura.ts` | Quién escribe en cada área del panel; la leen el middleware y el asistente | - |
| `zohoOutbox.ts` | Bandeja de salida hacia Zoho, con reintentos y estados | `zoho_outbox` |
| `zoho.ts` | Cliente OAuth + CRM (v8) + Books (v3) + Campaigns | - |
| `zohoMap.ts` | Mapeo de contactos y órdenes a Leads de Zoho | - |
| `auth.ts` | Sesión firmada con HMAC-SHA256, cookie `HttpOnly`, TTL de 8 h | - |
| `rateLimit.ts` | Limitador en memoria para el login y el asesor | - |
| `email.ts` | Avisos internos vía Resend, HTML + texto plano | - |
| `exigencias.ts` | Qué normas le aplican a cada perfil de empresa (selector del hero) | - |

Las migraciones son aditivas: `esquema.ts` crea las tablas con
`CREATE TABLE IF NOT EXISTS` y añade las columnas nuevas de forma idempotente en
el arranque. No hay herramienta de migraciones aparte.

### Ciclo de una orden

```
solicitada → confirmada → programada → en ruta → recolectada
           → clasificada → certificada → cerrada        (+ cancelada)
```

Cada transición queda registrada en `order_events` con el nombre real del
empleado que la hizo.

### Roles del panel

`admin`, `operaciones`, `logistica`, `consultor`, `finanzas`, `lectura`. La
autorización se resuelve en `src/middleware.ts` con la tabla de
`src/lib/reglasEscritura.ts`: lectura para cualquier sesión válida, con las
escrituras repartidas por prefijo.

| Recurso | Quién puede escribir |
|---|---|
| `/api/admin/recolecciones` | admin, operaciones, logistica |
| `/api/admin/contactos` | admin, operaciones, consultor |
| `/api/admin/posts`, `/api/admin/normativas` | admin, consultor |
| `/api/admin/cumplimiento` | admin, consultor |
| `/api/admin/asistente` | todos los roles (qué puede *proponer* cada uno lo decide `asistente/permisos.ts`; topes y consumo, solo admin) |
| `/api/admin/users` | solo admin (también en lectura: expone datos sensibles) |
| `/api/admin/zoho` | solo admin (escribe en un sistema externo) |

`finanzas` no escribe en ninguna área del panel: su única escritura prevista son
borradores en Zoho Books a través del asistente. Las páginas de `/docs` y
`/oportunidades2630` exigen rol admin: son documentos internos, no parte del
sitio público.

## Funciones con IA

Las tres usan la misma clave (`ANTHROPIC_API_KEY`) y ninguna falla si no está:
simplemente no se ofrecen o dejan el trabajo en espera.

- **Asesor público** (`src/lib/asesor/`, `POST /api/asesor`, `AsesorChat.astro`).
  Opción de chat dentro de la burbuja de WhatsApp. Responde dudas de los
  servicios con Haiku 5.5, de usted y **sin cifras de dinero**: una guardia
  revisa la respuesta completa antes de mostrarla (por eso no se transmite en
  vivo). Tope de gasto diario en base (`ASESOR_TOPE_DIARIO_USD`) y 40 preguntas
  por IP cada 10 minutos. No guarda la conversación: la reenvía el navegador.
- **Agente de cumplimiento** (`src/lib/agente/`, `/admin/cumplimiento`,
  `/api/admin/cumplimiento/*`). Se sube un acto administrativo, Claude lo lee y
  extrae sus obligaciones, el agente lo cruza con la tabla de expedientes,
  calcula el vencimiento en días hábiles con festivos de Colombia
  (`diasHabiles.ts`) y deja una alerta según las reglas editables. Sin clave,
  los actos quedan "esperando clave" y se procesan después desde Historial.
- **Asistente del panel** (`src/lib/asistente/`, `/api/admin/asistente/*`, caja
  "Pregunte o busque algo" arriba de `/admin`). Consulta recolecciones,
  contactos, cumplimiento y contenido con herramientas filtradas por rol, y
  **propone** cambios que la persona aprueba con una tarjeta de antes y después;
  nunca actúa solo. Sonnet 5.5, historial privado por persona, auditoría de cada
  aprobación, topes diarios por empresa y por usuario editables por el admin, y
  reporte de consumo en CSV. Las herramientas de Zoho están planeadas, no
  construidas. Detalle y decisiones en `docs/plan-asistente.md` (documento
  local, no versionado).

## Integraciones

- **Email (Resend).** `POST /api/recolecciones` y `POST /api/contacto` avisan al
  equipo con la respuesta ya diferida (`src/lib/defer.ts`), para no hacer esperar
  al visitante. Si el envío falla, se registra y la petición responde 200 igual.
- **Zoho CRM.** Cada contacto y cada recolección se encolan como `crm_lead` en
  `zoho_outbox` desde el momento en que entran. El drenaje se dispara a mano con
  `POST /api/admin/zoho {"action":"sync"}` mientras se valida el primer contacto
  real con Zoho. Deduplicación por email antes de crear el lead.
- **Zoho Campaigns.** Quien marca la casilla opcional de comunicaciones se
  encola para suscribirse a la lista de `ZOHO_CAMPAIGNS_LISTKEY`.
- **Zoho Books.** La autenticación está lista y la bandeja acepta las entidades
  `books_contact` y `books_invoice`, pero el mapeo está sin definir a la espera
  de administración. Ver las preguntas abiertas al final de `src/lib/zohoMap.ts`.

## Seguridad

- Cabeceras (CSP, HSTS, `X-Frame-Options`, `Permissions-Policy`) inyectadas en el
  Build Output de Vercel desde `astro.config.mjs`. Se hace ahí porque, con esa
  API del adapter, un `vercel.json` con `headers` se ignora y el middleware de
  Astro no corre para las páginas prerenderizadas.
- Las zonas privadas (`/admin`, `/api/admin`, `/docs`, `/oportunidades2630`) llevan
  además `Cache-Control: no-store` y `X-Robots-Tag: noindex, nofollow, noarchive`.
  Lo primero evita que una caché intermedia guarde HTML con datos de una sesión
  ajena; lo segundo porque `robots.txt` es una petición, no un control.
- Sesión HMAC-SHA256 con comparación *timing-safe* y expiración de 8 h.
- Rate limiting de 5 intentos por IP cada 10 minutos en `/api/admin/login`.
- Honeypot en los formularios públicos.
- El asistente del panel vuelve a leer el rol en la base al aprobar una
  propuesta, y oculta los datos de personas naturales antes de mandarlos al
  modelo (NIT y dirección de empresas sí pasan).

El estado de la revisión de seguridad, con lo resuelto y lo que sigue abierto,
está en [`AUDITORIA.md`](AUDITORIA.md).

## Pruebas

- `npm test` corre los `*.test.ts` de `src/` con `node --test`: días hábiles,
  alertas, asesor (incluida la guardia de cifras), asistente (permisos, lectura
  que no escribe, privacidad), exigencias y geometría del radar. Sin red ni costo.
- `npm run test:e2e` levanta su propio `astro dev` en el puerto 4329 contra
  `data/e2e.db` y con el modelo simulado: preguntar, aprobar y descartar
  propuestas, buscador sin IA, solo lectura, pestaña de límites, celular y el
  enlace `?alerta=` de cumplimiento.
- Falta el banco de casos con el modelo real antes de entregar el asistente.

## Documentación

| Documento | Contenido |
|---|---|
| [`pendientes.md`](pendientes.md) | Lista viva de bloqueadores, deuda técnica y activos por entregar. **Empieza por aquí.** (local, no versionado) |
| [`AUDITORIA.md`](AUDITORIA.md) | Auditoría de integridad y seguridad |
| [`AUDITORIA_SEO.md`](AUDITORIA_SEO.md) | Auditoría SEO con el estado de cada hallazgo |
| [`infra_deploy.md`](infra_deploy.md) | Qué contratar para producción, con costos y checklist de entrega |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de cambios |
| [`docs/plan-panel-operaciones.md`](docs/plan-panel-operaciones.md) | Plan del panel operativo por módulos |
| `docs/plan-asistente.md` | Asistente con IA del panel: decisiones, matriz de roles y fases (local, no versionado) |
| [`docs/plan-zoho.md`](docs/plan-zoho.md) | Integración con Zoho, detalle técnico |
| [`docs/plan-redes-sociales.md`](docs/plan-redes-sociales.md) | Difusión y perfiles sociales |
| [`docs/oportunidades-gobierno-2026-2030.md`](docs/oportunidades-gobierno-2026-2030.md) | Análisis de oportunidades del sector |
| [`docs/plan-competitivo-lito.md`](docs/plan-competitivo-lito.md) | Benchmark competitivo |

Los archivos `oportunidad_*.md`, `oferta_*.md`, `propuesta_*`,
`programa_capacitacion_*` y `mensaje_*.md` de la raíz son documentos comerciales,
no documentación técnica.

## Estado

El sitio público está completo en ES y EN, con la portada animada y el asesor
con IA listo para activarse. La base de producción está en Turso (integración
del Marketplace de Vercel). En el panel funcionan recolecciones, contactos,
blog y normativas con borradores, usuarios, la Fase 1 del agente de
cumplimiento y las fases 1 a 4 y 7 a 9 del asistente, probadas con el modelo
simulado.

Lo que falta para entregar:

- **Clave de la API de Anthropic** en Vercel y la primera prueba real de cada
  función con IA.
- **Quitar las credenciales fijas del login** (`src/lib/users.ts`) y rotar la
  contraseña (`AUDITORIA.md`, hallazgo 8). Incluye el acceso temporal, que hoy
  tiene rol admin y vence el 2026-11-04.
- **Credenciales de Zoho** y las herramientas de Zoho del asistente (fases 5 y 6).
- Dominio definitivo y Resend.

El detalle está en [`pendientes.md`](pendientes.md).
