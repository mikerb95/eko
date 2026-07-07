# Plan: Integración con Zoho (automatizaciones y comunicación)

> Objetivo: definir qué automatizaciones y qué comunicación de datos son viables entre esta web (Astro + panel operativo, `docs/plan-panel-operaciones.md`) y Zoho, sin duplicar a Zoho como CRM ni convertir la web en un ERP. Este documento es el detalle técnico de la §6 de `plan-panel-operaciones.md`.

## 1. Principio rector

**Un solo maestro por dato, nunca dos.**

| Dato | Maestro | La web... |
|---|---|---|
| Leads, tratos, pipeline comercial, facturación | **Zoho** (CRM / Books) | Solo lee o empuja eventos, no lo edita |
| Órdenes de recolección, estados, kilos, certificados | **Web** (`src/lib/ops.ts`) | Es la fuente de verdad; Zoho solo recibe un resumen |
| Cuentas/contactos de cliente | **Zoho CRM** | La web cachea una copia de solo lectura para no duplicar digitación |

Si un dato no encaja claramente en una fila, no se sincroniza todavía — se añade cuando haya un caso de uso concreto.

## 2. Estado actual (línea base)

- El formulario público de recolecciones ya persiste en la tabla `orders` vía `POST /api/recolecciones` → `createOrder()` (`src/lib/ops.ts`). Hoy esto **no toca Zoho para nada**.
- El panel admin (`src/pages/admin`) gestiona el ciclo de vida de la orden (`GET/PATCH /api/admin/recolecciones`) con bitácora de eventos (`order_events`).
- No existe hoy ningún cliente Zoho, credencial OAuth, ni webhook configurado en el repo.

## 3. Automatizaciones posibles (por dirección)

### 3.1 Web → Zoho (empujar eventos de la web hacia Zoho)

| Automatización | Disparador | Acción en Zoho | Prioridad |
|---|---|---|---|
| Nuevo lead desde formulario | `createOrder()` crea una orden `solicitada` | Crear/actualizar **Lead** en Zoho CRM (nombre, email, teléfono, empresa, mensaje) | Alta — evita que el equipo comercial pierda solicitudes que hoy solo viven en la web |
| Cierre de orden con certificado | Orden pasa a `certificada`/`cerrada` | Actualizar el **Deal**/cuenta del cliente en Zoho con resumen (kilos, fecha, link al certificado PDF) | Media — le da a comercial visibilidad sin que digiten nada |
| Cambio de estado relevante | Orden pasa a `cancelada` o `en_ruta` | Nota o actualización de campo en el Deal asociado | Baja — nice-to-have, no bloquea nada |

### 3.2 Zoho → Web (traer datos de Zoho a la web/panel)

| Automatización | Disparador | Acción en la web | Prioridad |
|---|---|---|---|
| Cache de cuentas/contactos | Job periódico o webhook de Zoho Flow | Guardar copia de solo lectura de cuentas/contactos en una tabla local (`zoho_accounts`) para autocompletar el formulario o vincular órdenes a un cliente existente | Media |
| Estado comercial visible en panel | Igual que arriba | Mostrar en la ficha de cliente del panel el estado del Deal (badge "en negociación", "cliente activo") de solo lectura | Baja |

### 3.3 Comunicación (no es sync de datos, es mensajería)

| Canal | Vía | Uso |
|---|---|---|
| Email transaccional | Zoho Mail / Zoho CRM workflow, o directo con Resend (ya evaluado en `plan-panel-operaciones.md`) | Confirmación al cliente cuando se crea la orden y cuando se emite el certificado |
| Notificación interna | Webhook de Zoho Flow → Slack/WhatsApp, o al revés (web → Zoho Flow → notificación) | Avisar a comercial/operaciones de una solicitud nueva sin construir un sistema de notificaciones propio |

## 4. Cómo implementarlo (dos caminos, no excluyentes)

### Camino A — Integración directa (API REST + OAuth)
- Cliente `src/lib/zoho.ts`: maneja el access token (se refresca solo, expira cada hora) a partir de un **refresh token** generado una vez desde Zoho API Console (self-client).
- Variables de entorno nuevas en `.env.example`:
  ```
  ZOHO_CLIENT_ID=
  ZOHO_CLIENT_SECRET=
  ZOHO_REFRESH_TOKEN=
  ZOHO_DC=com          # dominio del datacenter de la cuenta (.com, .eu, .in...)
  ```
- Llamadas a `https://www.zohoapis.{ZOHO_DC}/crm/v6/Leads` (crear lead), `/Deals` (actualizar), etc.
- Se dispara desde `createOrder()` y `updateOrder()` en `src/lib/ops.ts` (fire-and-forget, sin bloquear la respuesta al usuario si Zoho falla).

### Camino B — Zoho Flow (bajo código)
- Zoho Flow escucha un **webhook saliente de la web** (endpoint nuevo `POST /api/webhooks/zoho` o que la web llame a un webhook de Zoho Flow) y arma el flujo visualmente (crear lead, mandar Slack, etc.) sin que nosotros mantengamos la lógica de mapeo de campos.
- Ventaja: cambios de flujo (qué campo va a dónde, a quién se notifica) los ajusta el equipo comercial sin tocar código.
- Desventaja: menos control/testing, depende de que Zoho Flow esté disponible en el plan contratado.

**Recomendación:** empezar con **Camino A solo para "nuevo lead desde formulario"** (el caso de mayor impacto, evita perder solicitudes) y evaluar Zoho Flow para las automatizaciones secundarias de notificación una vez que el equipo comercial defina a quién avisar y cómo.

## 5. Riesgos y decisiones pendientes

- **Duplicados**: si un cliente ya existe en Zoho, ¿el lead nuevo se crea igual o se busca por email/teléfono primero? → usar búsqueda por email antes de crear (`GET /crm/v6/Leads/search?email=...`).
- **Fallo de Zoho no debe romper el formulario público**: la creación del lead en Zoho debe ser asíncrona/best-effort; si Zoho está caído, la orden se guarda igual en la web y se reintenta o se loguea el fallo.
- **Región del datacenter**: confirmar con la cuenta de Zoho actual si es `.com`, `.eu`, etc. antes de codear el cliente.
- **Alcance de credenciales**: el self-client de Zoho debe pedir solo los scopes necesarios (`ZohoCRM.modules.leads.CREATE,READ`, `ZohoCRM.modules.deals.ALL` si aplica), no acceso total a la cuenta.
- **Quién es el dueño del mapeo de campos** (qué campo del formulario va a qué campo de Zoho) — definir con el equipo comercial antes de implementar, no asumir.

## 6. Siguiente paso concreto

1. Confirmar con el equipo comercial: ¿qué campo de Zoho CRM debe llenar cada campo del formulario de recolecciones? ¿Lead o Deal directo?
2. Crear el self-client en Zoho API Console y generar el refresh token.
3. Implementar `src/lib/zoho.ts` + hook en `createOrder()` (Camino A, caso "nuevo lead").
4. Verificar end-to-end con una solicitud real antes de tocar los flujos de vuelta (Zoho → web).
