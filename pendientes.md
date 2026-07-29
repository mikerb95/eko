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

## Otros pendientes

- (agregar aquí)
