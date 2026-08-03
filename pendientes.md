# Pendientes

Lista viva de cosas que faltan por resolver en el sitio: activos por entregar (documentos, fotos, video), deuda técnica y decisiones abiertas. Se va apilando a medida que aparecen.

## Activos por entregar

- [ ] **Licencias ambientales (PDF)** — para mostrar certificaciones/avales reales en el footer (idea tomada de ATICA). Nadie las ha subido a `public/` todavía.
- [ ] **Testimonios reales de clientes** — con autorización de uso, para reemplazar/reforzar `/casos`.
- [ ] **Logos de clientes reales** — con autorización de marca, para reponer la sección "Clientes" retirada (ver `docs/plan-competitivo-lito.md`, Fase 3).
- [ ] **URLs de los perfiles de redes sociales** — `src/lib/redes.ts` tiene los tres (LinkedIn, Instagram, Facebook) con `activo: false` y URL vacía. Hasta que alguien pegue las URLs reales y las active, la columna "Síguenos" del footer no se emite en producción. Ver `docs/plan-redes-sociales.md`.
- [ ] **Imágenes 1200×630 de los artículos del blog** — la columna `posts.image` ya existe y el panel marca "Sin imagen" los que faltan. Sin ellas, todo artículo compartido en LinkedIn o WhatsApp muestra la misma portada genérica, y la difusión a Instagram (Fase 1) es imposible porque exige imagen.

## Bloqueadores en producción

- [ ] **No hay base de datos en producción** — el proyecto en Vercel no tiene `DATABASE_URL` ni `DATABASE_AUTH_TOKEN`, y el fallback `file:./data/cms.db` (`src/lib/users.ts:36`, `src/lib/cms.ts`) no puede abrirse en la función: el archivo no va en el bundle y el filesystem es de solo lectura. Verificado el 2026-08-03: `/api/admin/recolecciones`, `/api/admin/contactos` y `/api/admin/users` devuelven 500 `ConnectionFailed(... cms.db: 14)`. Se entra al panel pero ninguna pestaña de datos carga. Hay que provisionar libsql/Turso y migrar el esquema. **Bloquea de hecho casi todo lo demás de este archivo**: las imágenes del blog, el flujo editorial y los avisos por correo pasan todos por esta base.
- [ ] **Quitar la credencial hardcodeada del login** — `src/lib/users.ts:151-152` tiene usuario y contraseña en texto plano, comprobados antes de tocar la base. Se agregó como parche para poder entrar con la base caída; ya está en el historial de git, así que al removerla hay que rotar también la contraseña. Depende del punto anterior: hasta que exista la base no hay otra forma de entrar.

## Decisiones abiertas

- [ ] **Dominio definitivo del sitio** — `src/lib/site.ts` asume `ekosolv.com` pero la gerencia no ha decidido. Bloquea además el provisionamiento de Resend (el Marketplace exige un dominio de envío verificable por DNS).
- [ ] **¿El plan de Zoho Social contratado incluye la API de publicación?** — no viene en los planes de entrada. Es el bloqueador principal de la Fase 1 de `docs/plan-redes-sociales.md`; si no lo incluye, la difusión automática no se construye y el equipo publica a mano desde Zoho Social.
- [ ] **Correos internos para los avisos** — a qué buzones de Ekosolv deben llegar las nuevas recolecciones y contactos (van en `NOTIFY_EMAIL`, no en el código).

## Zoho (CRM y Books)

El código está construido y probado end-to-end en local (ver `docs/plan-zoho.md` §2). **Los leads ya se están acumulando en la tabla `zoho_outbox` desde el 3 de agosto de 2026**: cada mensaje de contacto y cada solicitud de recolección deja una fila pendiente. El día que existan las credenciales se drena la bandeja y entra todo lo recibido en el intervalo, sin digitar nada a mano. Lo que sigue es lo único que falta.

### Bloquea la conexión (le toca a Mike / gerencia)

- [ ] **Crear el self-client en Zoho API Console** — https://api-console.zoho.com, con los scopes mínimos (`ZohoCRM.modules.leads.CREATE,READ`; nada de acceso total a la cuenta). El procedimiento completo, incluido el `curl` para canjear el código por el refresh token, está en `.env.example`.
- [ ] **Confirmar el datacenter de la cuenta** (`ZOHO_DC`) — `com`, `eu`, `in`, `com.au`... Una cuenta creada en `.com` no responde en `.eu`, así que equivocarse aquí se ve como credenciales inválidas y hace perder una tarde.
- [ ] **Cargar las cuatro variables en Vercel** — `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_DC` (`vercel env add`).
- [ ] **Primer drenaje observado** — `POST /api/admin/zoho {"action":"sync"}` y verificar en Zoho que los leads acumulados llegaron completos. Se dejó manual a propósito: el primer contacto real con Zoho hay que verlo ocurrir, no enterarse por un cron.

### Depende de comercial

- [ ] **Confirmar el mapeo de campos** — si Ekosolv tiene campos personalizados en Leads, se consultan con `GET /crm/v8/settings/fields?module=Leads` y se ajustan en `src/lib/zohoMap.ts`, que es el único archivo a tocar para esto. Mientras tanto, sector, líneas de interés, tipo de residuo y consecutivo se acumulan en `Description`: no se pierde información y es reversible.

### Depende de administración

- [ ] **Definir el alcance de Zoho Books** — la infraestructura de autenticación ya está lista (`booksFetch()` resuelve token y `organization_id`) y la bandeja acepta las entidades `books_contact` y `books_invoice`, pero falta el mapeo. Las tres preguntas abiertas están al final de `src/lib/zohoMap.ts`: ¿la factura se emite desde Books o el cliente tiene su propio flujo?, ¿qué ítem del catálogo corresponde a una recolección RAEE y se cobra por kilo, por visita o por contrato?, ¿el certificado se adjunta a la factura o vive solo en el panel? No se implementó nada porque sería adivinar sobre plata.
- [ ] **`ZOHO_BOOKS_ORG_ID`** — sale de Books → Settings → Organizations. Solo hace falta cuando se aborde lo anterior.

### Queda por construir (deuda del propio módulo)

- [ ] **Automatizar el drenaje** — cron de Vercel cada 15 minutos contra `/api/admin/zoho`, o `syncPending()` diferido tras cada envío. Solo después de validar el primer drenaje manual.
- [ ] **UI de la bandeja en el panel** — hoy `zoho_outbox` se opera con `curl` contra `/api/admin/zoho` (estado, reintentar, descartar). Falta la pestaña en `/admin` para que no dependa de alguien con terminal.
- [ ] **Cierre de orden → Zoho** — hoy solo se empuja el lead al recibir la solicitud. Actualizar el Deal con kilos, fecha y link al certificado cuando la orden pasa a `certificada`/`cerrada` sigue siendo §3.1 del plan, sin implementar.
- [ ] **Zoho → web** — el cache de cuentas/contactos (`zoho_accounts`) y el estado comercial visible en el panel son §3.2 del plan. Nada de eso existe todavía; se decidió no tocarlo hasta que el flujo de ida esté validado en producción.

## Deuda técnica

- [ ] **Activar los avisos por email** — el código está listo y probado (`src/lib/email.ts`, conectado a `/api/recolecciones` y `/api/contacto`), pero no envía nada hasta que existan `RESEND_API_KEY`, `NOTIFY_FROM` y `NOTIFY_EMAIL`. Depende de las dos decisiones de arriba.
- [ ] **5 vulnerabilidades de dependencias sin resolver** — requieren `npm audit fix --force` (upgrade breaking de `astro`/`@astrojs/vercel` a v11). Pendiente de decisión, ver `AUDITORIA.md`.
- [ ] **`audit_log` transversal** — M7 del plan lo pedía; hoy solo existe `order_events` (auditoría de órdenes), no de contenido ni de usuarios.
- [ ] **La tabla `posts` no tiene estado de borrador** (`src/lib/cms.ts:56-68`): no hay columna `status`/`draft`, así que todo lo que entra al CMS queda publicado. Por eso los borradores de blog viven en `docs/borradores/` como archivos, no en la base. Bloquea tener un flujo real de revisión editorial.
- [ ] **La tabla `posts` no tiene columna de idioma** → la paridad ES/EN del blog no está soportada. `src/pages/en/blog/index.astro` lee el JSON estático `src/data/blog-posts.json` y enlaza a los artículos en español, etiquetados "ES ·". No es que falte traducir: no hay dónde guardar la traducción.
- [ ] **`seedIfEmpty()` solo siembra si la tabla está vacía** (`src/lib/cms.ts:116`) — agregar un post a `src/data/blog-posts.json` no lo publica en una base ya sembrada; hay que cargarlo por `/admin`. Conviene documentarlo o dar un comando de sincronización, porque invita al error.
- [ ] **`AUDITORIA.md` hallazgo #7 está obsoleto** — dice "contraseña en texto plano", pero `src/lib/users.ts` ya usa PBKDF2-SHA256 con salt por usuario (`hashPassword` / `verifyPassword`). Corregir el documento para no perseguir un problema resuelto.

## Otros pendientes

- (agregar aquí)
