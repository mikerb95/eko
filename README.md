# Ekosolv

Sitio web corporativo y panel de operaciones de **Ekosolv S.A.S.** (NIT 900.659.506-9),
gestor de residuos de aparatos eléctricos y electrónicos (RAEE) en Colombia.

No es solo un sitio institucional: el mismo despliegue sirve las páginas públicas
en español e inglés, recibe las solicitudes de recolección y los mensajes de
contacto, y expone un panel interno donde el equipo gestiona el ciclo de vida de
cada orden.

## Stack

| Pieza | Qué se usa |
|---|---|
| Framework | Astro 7 (`output: 'static'` con render on-demand por página) |
| Hosting | Vercel (`@astrojs/vercel` 11, Fluid Compute) |
| Base de datos | libSQL: archivo local en desarrollo, Turso en producción |
| Estilos | Tailwind 4 (vía `@tailwindcss/vite`) + CSS propio |
| Email | Resend (API REST directa, sin SDK) |
| CRM / facturación | Zoho CRM y Zoho Books (API REST + OAuth self-client) |

Sin dependencias de runtime más allá de `@libsql/client`: la autenticación, el
hash de contraseñas y el limitador de peticiones están escritos contra WebCrypto
y las APIs estándar de la plataforma.

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
`src/data/blog-posts.json` y `src/data/normativas.json`. Los avisos por email y
Zoho quedan en no-op silencioso.

Para entrar al panel en local, define `ADMIN_USERNAME` y `ADMIN_PASSWORD` en el
`.env`: se siembran como primer administrador solo si la tabla `users` está vacía.

### Scripts

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción (Build Output de Vercel)
npm run preview    # previsualizar el build
npx astro check    # chequeo de tipos
```

## Variables de entorno

Todas están documentadas con su procedimiento de obtención en
[`.env.example`](.env.example). Resumen:

| Variable | Para qué | Si falta |
|---|---|---|
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | Base libSQL/Turso | Cae a `file:./data/cms.db` (solo sirve en local) |
| `AUTH_SECRET` | Firma HMAC de la cookie de sesión | **El arranque en producción falla a propósito** |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Primer admin en local | No se siembra ningún usuario |
| `RESEND_API_KEY`, `NOTIFY_FROM`, `NOTIFY_EMAIL` | Avisos internos por email | No-op: el dato se guarda igual |
| `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_DC` | CRM | No-op: los leads se acumulan en `zoho_outbox` |
| `ZOHO_BOOKS_ORG_ID` | Zoho Books | Books queda deshabilitado |
| `PUBLIC_SITE_URL` | Canónicas, sitemap, OG | Cae a `https://ekosolv.com` |

El criterio general es *fail-soft*: si un servicio externo no está configurado o
está caído, la información del visitante se guarda de todos modos y el panel
sigue siendo la fuente de verdad. La única excepción deliberada es `AUTH_SECRET`,
donde un secreto conocido es peor que no arrancar.

## Estructura

```
src/
  pages/            Páginas ES en la raíz, EN bajo /en/, APIs en /api/
    api/            Endpoints públicos (contacto, recolecciones)
    api/admin/      Endpoints del panel, protegidos por sesión y rol
    admin/          Login y panel
    docs/           Documentación interna (kanban, radar) — no es para el cliente
  lib/              Lógica de negocio y acceso a datos
  data/             Contenido semilla y catálogos estáticos
  components/       Componentes Astro compartidos
  layouts/          Layout.astro (ES) y LayoutEn.astro (EN)
  middleware.ts     Protección de /admin y /api/admin + autorización por rol
data/cms.db         Base local (ignorada por git)
docs/               Planes, análisis y borradores
scripts/og/         Generación de las imágenes Open Graph
```

### Capa de datos (`src/lib/`)

| Archivo | Responsabilidad | Tablas |
|---|---|---|
| `cms.ts` | Blog y normativas, con semilla desde JSON y *fallback* si la base no responde | `posts`, `normativas` |
| `ops.ts` | Órdenes de recolección: consecutivo `REC-AAAA-0001`, ciclo de estados, bitácora | `orders`, `order_events` |
| `contactos.ts` | Mensajes del formulario de contacto | `contacts` |
| `users.ts` | Usuarios, roles y contraseñas (PBKDF2-SHA256 con salt por usuario) | `users` |
| `zohoOutbox.ts` | Bandeja de salida hacia Zoho, con reintentos y estados | `zoho_outbox` |
| `zoho.ts` | Cliente OAuth + CRM (v8) + Books (v3) | — |
| `zohoMap.ts` | Mapeo de contactos y órdenes a Leads de Zoho | — |
| `auth.ts` | Sesión firmada con HMAC-SHA256, cookie `HttpOnly`, TTL de 8 h | — |
| `rateLimit.ts` | Limitador en memoria para el login | — |
| `email.ts` | Avisos internos vía Resend, HTML + texto plano | — |

Las migraciones son aditivas: cada módulo crea sus tablas con
`CREATE TABLE IF NOT EXISTS` y añade columnas nuevas de forma idempotente en el
arranque. No hay herramienta de migraciones aparte.

### Ciclo de una orden

```
solicitada → confirmada → programada → en ruta → recolectada
           → clasificada → certificada → cerrada        (+ cancelada)
```

Cada transición queda registrada en `order_events` con el nombre real del
empleado que la hizo.

### Roles del panel

`admin`, `operaciones`, `logistica`, `consultor`, `lectura`. La autorización se
resuelve en `src/middleware.ts`: lectura para cualquier sesión válida; escrituras
de recolecciones para admin/operaciones/logística; de contenido para
admin/consultor; de usuarios solo para admin.

## Integraciones

- **Email (Resend).** `POST /api/recolecciones` y `POST /api/contacto` avisan al
  equipo con la respuesta ya diferida (`src/lib/defer.ts`), para no hacer esperar
  al visitante. Si el envío falla, se registra y la petición responde 200 igual.
- **Zoho CRM.** Cada contacto y cada recolección se encolan como `crm_lead` en
  `zoho_outbox` desde el momento en que entran. El drenaje se dispara a mano con
  `POST /api/admin/zoho {"action":"sync"}` mientras se valida el primer contacto
  real con Zoho. Deduplicación por email antes de crear el lead.
- **Zoho Books.** La autenticación está lista y la bandeja acepta las entidades
  `books_contact` y `books_invoice`, pero el mapeo está sin definir a la espera
  de administración. Ver las preguntas abiertas al final de `src/lib/zohoMap.ts`.

## Seguridad

- Cabeceras (CSP, HSTS, `X-Frame-Options`, `Permissions-Policy`) inyectadas en el
  Build Output de Vercel desde `astro.config.mjs`. Se hace ahí porque, con esa
  API del adapter, un `vercel.json` con `headers` se ignora y el middleware de
  Astro no corre para las páginas prerenderizadas.
- Sesión HMAC-SHA256 con comparación *timing-safe* y expiración de 8 h.
- Rate limiting de 5 intentos por IP cada 10 minutos en `/api/admin/login`.
- Honeypot en los formularios públicos.

El estado de la revisión de seguridad, con lo resuelto y lo que sigue abierto,
está en [`AUDITORIA.md`](AUDITORIA.md).

## Documentación

| Documento | Contenido |
|---|---|
| [`pendientes.md`](pendientes.md) | Lista viva de bloqueadores, deuda técnica y activos por entregar. **Empieza por aquí.** |
| [`AUDITORIA.md`](AUDITORIA.md) | Auditoría de integridad y seguridad |
| [`infra_deploy.md`](infra_deploy.md) | Qué contratar para producción, con costos y checklist de entrega |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de cambios |
| [`docs/plan-panel-operaciones.md`](docs/plan-panel-operaciones.md) | Plan del panel operativo por módulos |
| [`docs/plan-zoho.md`](docs/plan-zoho.md) | Integración con Zoho, detalle técnico |
| [`docs/plan-redes-sociales.md`](docs/plan-redes-sociales.md) | Difusión y perfiles sociales |
| [`docs/oportunidades-gobierno-2026-2030.md`](docs/oportunidades-gobierno-2026-2030.md) | Análisis de oportunidades del sector |
| [`docs/plan-competitivo-lito.md`](docs/plan-competitivo-lito.md) | Benchmark competitivo |

Los archivos `oportunidad_*.md`, `oferta_comercial_ekosolv.md` y `mensaje_*.md`
de la raíz son documentos comerciales, no documentación técnica.

## Estado

El sitio público está completo en ES y EN. El panel funciona y está verificado
end-to-end en local. **Falta provisionar la base en producción**: hoy el proyecto
en Vercel no tiene `DATABASE_URL`, así que las pestañas de datos del panel
responden 500. Es el bloqueador principal y arrastra casi todo lo demás. El
detalle está en [`pendientes.md`](pendientes.md).
