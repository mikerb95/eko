# Pendientes

Lista viva de cosas que faltan por resolver en el sitio: activos por entregar (documentos, fotos, video), deuda técnica y decisiones abiertas. Se va apilando a medida que aparecen.

## Activos por entregar

- [ ] **Licencias ambientales (PDF)** — para mostrar certificaciones/avales reales en el footer (idea tomada de ATICA). Nadie las ha subido a `public/` todavía.
- [ ] **Testimonios reales de clientes** — con autorización de uso, para reemplazar/reforzar `/casos`.
- [ ] **Logos de clientes reales** — con autorización de marca, para reponer la sección "Clientes" retirada (ver `docs/plan-competitivo-lito.md`, Fase 3).

## Decisiones abiertas

- [ ] **Dominio definitivo del sitio** — `src/lib/site.ts` asume `ekosolv.com` pero la gerencia no ha decidido. Bloquea además el provisionamiento de Resend (el Marketplace exige un dominio de envío verificable por DNS).
- [ ] **Correos internos para los avisos** — a qué buzones de Ekosolv deben llegar las nuevas recolecciones y contactos (van en `NOTIFY_EMAIL`, no en el código).

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
